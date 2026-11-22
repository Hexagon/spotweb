//! Small in-memory TTL cache with named realms that can be invalidated when
//! the scheduler has written new data (replaces 1.x DataCache + IPC clear_cache).
//!
//! Loads are single-flight per key: when a key is missing or expired, the first caller
//! runs the loader and concurrent callers for the same key wait for its result instead
//! of running the same query. Errors are passed to the waiters but never cached.

use std::any::Any;
use std::collections::HashMap;
use std::future::Future;
use std::sync::Arc;
use std::time::{Duration, Instant};

use parking_lot::Mutex;
use tokio::sync::watch;

type Value = Arc<dyn Any + Send + Sync>;
/// Outcome of a load shared with waiters. The error is a formatted message since
/// `anyhow::Error` cannot be cloned.
type FlightResult = Result<Value, Arc<str>>;
type Flight = Arc<watch::Sender<Option<FlightResult>>>;

struct Entry {
    at: Instant,
    /// Insertion order, used to evict the oldest entries when a realm is full
    seq: u64,
    value: Value,
}

#[derive(Default)]
struct Realm {
    entries: HashMap<String, Entry>,
    inflight: HashMap<String, Flight>,
    /// Bumped by `invalidate`, so a load started before it is not stored afterwards
    generation: u64,
}

#[derive(Default)]
struct State {
    realms: HashMap<&'static str, Realm>,
    seq: u64,
}

#[derive(Default, Clone)]
pub struct Cache {
    inner: Arc<Mutex<State>>,
}

pub const MAX_ENTRIES_PER_REALM: usize = 5000;

/// What a caller should do after looking at the cache
enum Step {
    Hit(Value),
    Wait(watch::Receiver<Option<FlightResult>>),
    Lead(Flight, u64),
}

/// Removes the in-flight marker when the leader finishes or is cancelled (e.g. the
/// request was dropped). Waiters then see the result, or a closed channel and retry.
struct FlightGuard<'a> {
    cache: &'a Cache,
    realm: &'static str,
    key: &'a str,
    flight: Flight,
}

impl Drop for FlightGuard<'_> {
    fn drop(&mut self) {
        let mut guard = self.cache.inner.lock();
        if let Some(r) = guard.realms.get_mut(self.realm) {
            if r.inflight
                .get(self.key)
                .is_some_and(|f| Arc::ptr_eq(f, &self.flight))
            {
                r.inflight.remove(self.key);
            }
        }
    }
}

impl Cache {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn get_or_load<T, F, Fut>(
        &self,
        realm: &'static str,
        key: String,
        ttl: Duration,
        load: F,
    ) -> anyhow::Result<Arc<T>>
    where
        T: Send + Sync + 'static,
        F: FnOnce() -> Fut,
        Fut: Future<Output = anyhow::Result<T>>,
    {
        let (flight, generation) = loop {
            let step = {
                let mut guard = self.inner.lock();
                let r = guard.realms.entry(realm).or_default();
                match r.entries.get(&key) {
                    Some(e) if e.at.elapsed() < ttl && e.value.is::<T>() => {
                        Step::Hit(e.value.clone())
                    }
                    _ => match r.inflight.get(&key) {
                        Some(f) => Step::Wait(f.subscribe()),
                        None => {
                            let f: Flight = Arc::new(watch::channel(None).0);
                            r.inflight.insert(key.clone(), f.clone());
                            Step::Lead(f, r.generation)
                        }
                    },
                }
            };
            match step {
                Step::Hit(v) => return downcast(v),
                Step::Lead(f, generation) => break (f, generation),
                Step::Wait(mut rx) => {
                    // A closed channel without a result means the leader was cancelled:
                    // look again (and possibly become the leader)
                    let res = match rx.wait_for(Option::is_some).await {
                        Ok(v) => v.clone(),
                        Err(_) => continue,
                    };
                    match res {
                        Some(Ok(v)) if v.is::<T>() => return downcast(v),
                        // Same key loaded as another type: load it ourselves
                        Some(Ok(_)) => return Ok(Arc::new(load().await?)),
                        Some(Err(e)) => return Err(anyhow::anyhow!("{e}")),
                        None => continue,
                    }
                }
            }
        };
        let _guard = FlightGuard {
            cache: self,
            realm,
            key: &key,
            flight: flight.clone(),
        };

        let started = Instant::now();
        let result = load().await;
        let took = started.elapsed();
        if took > Duration::from_millis(200) {
            tracing::info!(realm, key = %key, ms = took.as_millis() as u64, "slow query");
        } else {
            tracing::debug!(realm, key = %key, ms = took.as_millis() as u64, "query");
        }
        let value = match result {
            Ok(v) => Arc::new(v),
            Err(e) => {
                flight.send_replace(Some(Err(format!("{e:#}").into())));
                return Err(e);
            }
        };
        {
            let mut guard = self.inner.lock();
            let state = &mut *guard;
            let r = state.realms.entry(realm).or_default();
            // Skip storing a value loaded from data that was replaced meanwhile
            if r.generation == generation {
                if r.entries.len() >= MAX_ENTRIES_PER_REALM && !r.entries.contains_key(&key) {
                    evict(&mut r.entries, ttl);
                }
                state.seq += 1;
                r.entries.insert(
                    key.clone(),
                    Entry {
                        at: Instant::now(),
                        seq: state.seq,
                        value: value.clone() as Value,
                    },
                );
            }
        }
        flight.send_replace(Some(Ok(value.clone() as Value)));
        Ok(value)
    }

    pub fn invalidate(&self, realm: &str) {
        let mut guard = self.inner.lock();
        if let Some(r) = guard.realms.get_mut(realm) {
            r.entries.clear();
            // Loads already running read the old data: let new callers start fresh ones
            r.inflight.clear();
            r.generation += 1;
        }
        tracing::debug!(realm, "cache invalidated");
    }
}

fn downcast<T: Send + Sync + 'static>(v: Value) -> anyhow::Result<Arc<T>> {
    v.downcast::<T>()
        .map_err(|_| anyhow::anyhow!("cache value has unexpected type"))
}

/// Make room in a full realm: drop expired entries, then the oldest ones until the
/// realm is at 90 % of its capacity, so eviction does not run on every insert.
fn evict(entries: &mut HashMap<String, Entry>, ttl: Duration) {
    entries.retain(|_, e| e.at.elapsed() < ttl);
    let target = MAX_ENTRIES_PER_REALM * 9 / 10;
    if entries.len() <= target {
        return;
    }
    let mut seqs: Vec<u64> = entries.values().map(|e| e.seq).collect();
    let remove = seqs.len() - target;
    let (_, &mut cutoff, _) = seqs.select_nth_unstable(remove - 1);
    entries.retain(|_, e| e.seq > cutoff);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    const TTL: Duration = Duration::from_secs(60);

    #[tokio::test]
    async fn caches_and_invalidates() {
        let c = Cache::new();
        let v = c
            .get_or_load("r", "k".into(), TTL, || async { Ok(1u32) })
            .await
            .unwrap();
        assert_eq!(*v, 1);
        let v = c
            .get_or_load("r", "k".into(), TTL, || async { Ok(2u32) })
            .await
            .unwrap();
        assert_eq!(*v, 1);
        c.invalidate("r");
        let v = c
            .get_or_load("r", "k".into(), TTL, || async { Ok(3u32) })
            .await
            .unwrap();
        assert_eq!(*v, 3);
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    async fn concurrent_loads_run_loader_once() {
        let c = Cache::new();
        let calls = Arc::new(AtomicUsize::new(0));
        let tasks: Vec<_> = (0..20)
            .map(|_| {
                let c = c.clone();
                let calls = calls.clone();
                tokio::spawn(async move {
                    c.get_or_load("r", "k".into(), TTL, || async move {
                        calls.fetch_add(1, Ordering::SeqCst);
                        tokio::time::sleep(Duration::from_millis(100)).await;
                        Ok(7u32)
                    })
                    .await
                })
            })
            .collect();
        for t in tasks {
            assert_eq!(*t.await.unwrap().unwrap(), 7);
        }
        assert_eq!(calls.load(Ordering::SeqCst), 1);
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    async fn failure_is_shared_but_not_cached() {
        let c = Cache::new();
        let calls = Arc::new(AtomicUsize::new(0));
        let tasks: Vec<_> = (0..10)
            .map(|_| {
                let c = c.clone();
                let calls = calls.clone();
                tokio::spawn(async move {
                    c.get_or_load("r", "k".into(), TTL, || async move {
                        calls.fetch_add(1, Ordering::SeqCst);
                        tokio::time::sleep(Duration::from_millis(100)).await;
                        anyhow::bail!("db down");
                        #[allow(unreachable_code)]
                        Ok(0u32)
                    })
                    .await
                })
            })
            .collect();
        for t in tasks {
            let e = t.await.unwrap().unwrap_err();
            assert!(e.to_string().contains("db down"));
        }
        assert_eq!(calls.load(Ordering::SeqCst), 1);
        let v = c
            .get_or_load("r", "k".into(), TTL, || async { Ok(5u32) })
            .await
            .unwrap();
        assert_eq!(*v, 5);
    }

    #[tokio::test]
    async fn cancelled_leader_lets_waiter_load() {
        let c = Cache::new();
        let leader = {
            let c = c.clone();
            tokio::spawn(async move {
                c.get_or_load("r", "k".into(), TTL, || async {
                    tokio::time::sleep(Duration::from_secs(3600)).await;
                    Ok(1u32)
                })
                .await
            })
        };
        // Let the leader register its load
        tokio::task::yield_now().await;
        let waiter = {
            let c = c.clone();
            tokio::spawn(async move {
                c.get_or_load("r", "k".into(), TTL, || async { Ok(2u32) })
                    .await
            })
        };
        tokio::task::yield_now().await;
        leader.abort();
        assert_eq!(*waiter.await.unwrap().unwrap(), 2);
    }

    #[tokio::test]
    async fn eviction_keeps_newest_entries() {
        let c = Cache::new();
        for i in 0..=MAX_ENTRIES_PER_REALM {
            c.get_or_load("r", format!("k{i}"), TTL, || async move { Ok(i) })
                .await
                .unwrap();
        }
        let len = c.inner.lock().realms["r"].entries.len();
        assert_eq!(len, MAX_ENTRIES_PER_REALM * 9 / 10 + 1);
        // Newest entries are still cached
        for i in [MAX_ENTRIES_PER_REALM, MAX_ENTRIES_PER_REALM - 1, 1000] {
            let v = c
                .get_or_load("r", format!("k{i}"), TTL, || async { Ok(usize::MAX) })
                .await
                .unwrap();
            assert_eq!(*v, i);
        }
        // The oldest were evicted
        let v = c
            .get_or_load("r", "k0".into(), TTL, || async { Ok(usize::MAX) })
            .await
            .unwrap();
        assert_eq!(*v, usize::MAX);
    }
}
