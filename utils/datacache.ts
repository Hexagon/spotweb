import { log } from "utils/log.ts";

const MemCache = new Map();

const Timer = () => {
  const startTime = performance.now();
  return {
    end: () => {
      return performance.now() - startTime;
    },
  };
};
const DataCache = async (realm: string, uniqueId: string, seconds: number, liveFetch: () => unknown) => {
  // Time
  const timer = Timer();

  // Check for realm, or create it
  if (!MemCache.has(realm)) {
    MemCache.set(realm, new Map());
  }

  const currentRealm = MemCache.get(realm);

  let data,
    method;

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

    data = cacheObj.data;
    method = "cache";
  } catch (_e) {
    // Live
    const result = await liveFetch();

    currentRealm.set(uniqueId, {
      dt: new Date(),
      data: result,
    });

    // Respond
    data = result;
    method = "live";
  }

  if (method === "live") {
    const t = timer.end();
    if (t > 200) {
      log("info", `SLOW Query ${realm}:${uniqueId} completed from ${method} in ${t} ms`);
    } else {
      log("debug", `Query ${realm}:${uniqueId} completed from ${method} in ${t} ms`);
    }
  }

  return data;
};

const InvalidateCache = (realm: string) => {
  if (MemCache.has(realm)) {
    const currentRealm = MemCache.get(realm);
    currentRealm.clear();
  }
};

export { DataCache, InvalidateCache };
