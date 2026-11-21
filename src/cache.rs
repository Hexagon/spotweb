//! Small in-memory TTL cache with named realms that can be invalidated when
//! the scheduler has written new data (replaces 1.x DataCache + IPC clear_cache).

use std::any::Any;
use std::collections::HashMap;
use std::future::Future;
use std::sync::Arc;
use std::time::{Duration, Instant};

use parking_lot::Mutex;

type Entry = (Instant, Arc<dyn Any + Send + Sync>);

#[derive(Default, Clone)]
pub struct Cache {
    inner: Arc<Mutex<HashMap<&'static str, HashMap<String, Entry>>>>,
}

pub const MAX_ENTRIES_PER_REALM: usize = 5000;

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
        {
            let guard = self.inner.lock();
            if let Some((at, v)) = guard.get(realm).and_then(|r| r.get(&key)) {
                if at.elapsed() < ttl {
                    if let Ok(v) = v.clone().downcast::<T>() {
                        return Ok(v);
                    }
                }
            }
        }
        let started = Instant::now();
        let value = Arc::new(load().await?);
        let took = started.elapsed();
        if took > Duration::from_millis(200) {
            tracing::info!(realm, key = %key, ms = took.as_millis() as u64, "slow query");
        } else {
            tracing::debug!(realm, key = %key, ms = took.as_millis() as u64, "query");
        }
        let mut guard = self.inner.lock();
        let r = guard.entry(realm).or_default();
        if r.len() >= MAX_ENTRIES_PER_REALM {
            r.retain(|_, (at, _)| at.elapsed() < ttl);
            if r.len() >= MAX_ENTRIES_PER_REALM {
                r.clear();
            }
        }
        r.insert(
            key,
            (Instant::now(), value.clone() as Arc<dyn Any + Send + Sync>),
        );
        Ok(value)
    }

    pub fn invalidate(&self, realm: &str) {
        let mut guard = self.inner.lock();
        if let Some(r) = guard.get_mut(realm) {
            r.clear();
        }
        tracing::debug!(realm, "cache invalidated");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn caches_and_invalidates() {
        let c = Cache::new();
        let v = c
            .get_or_load("r", "k".into(), Duration::from_secs(60), || async {
                Ok(1u32)
            })
            .await
            .unwrap();
        assert_eq!(*v, 1);
        let v = c
            .get_or_load("r", "k".into(), Duration::from_secs(60), || async {
                Ok(2u32)
            })
            .await
            .unwrap();
        assert_eq!(*v, 1);
        c.invalidate("r");
        let v = c
            .get_or_load("r", "k".into(), Duration::from_secs(60), || async {
                Ok(3u32)
            })
            .await
            .unwrap();
        assert_eq!(*v, 3);
    }
}
