import { log } from "utils/log.ts";

const MemCache = new Map();

const DataCache = async (realm: string, uniqueId: string, seconds: number, liveFetch: () => unknown) => {
  // Check for realm, or create it
  if (!MemCache.has(realm)) {
    MemCache.set(realm, new Map());
  }

  const currentRealm = MemCache.get(realm);

  try {
    // Check for cache, throw if cache does not exist
    let cacheObj;

    if (currentRealm.has(uniqueId)) {
      cacheObj = currentRealm.get(uniqueId);
    }

    if (!cacheObj) throw new Error("Could not read cache");

    const timeLeft = Math.round(
      (cacheObj.dt.getTime() - new Date().getTime() + (seconds * 1000)) / 1000,
    );

    if (timeLeft <= 0) {
      currentRealm.delete(uniqueId);
      throw new Error("Cache expired");
    }

    log("debug", `Cache hit ${realm}:${uniqueId}`);
    return cacheObj.data;
  } catch (_e) {
    // Live
    const result = await liveFetch();

    currentRealm.set(uniqueId, {
      dt: new Date(),
      data: result,
    });

    // Respond
    log("debug", `Cache miss ${realm}:${uniqueId}`);
    return result;
  }
};

const InvalidateCache = (realm: string) => {
  if (MemCache.has(realm)) {
    const currentRealm = MemCache.get(realm);
    currentRealm.clear();
  }
};

export { DataCache, InvalidateCache };
