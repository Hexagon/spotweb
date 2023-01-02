const MemCache = new Map();

const DataCache = async (uniqueId: string, seconds: number, liveFetch: unknown) => {


  try {
    // Check for cache, throw if cache does not exist
    let cacheObj;

    if (MemCache.has(uniqueId)) {
        cacheObj = MemCache.get(uniqueId);
    }

    if (!cacheObj) throw new Error("Could not read cache");

    const timeLeft = Math.round(
      (cacheObj.dt.getTime() - new Date().getTime() + (seconds * 1000)) / 1000,
    );

    if (timeLeft <= 0) {
      MemCache.delete(uniqueId);
      throw new Error("Cache expired");
    }

    return {__cache:true, ...cacheObj.data};

  } catch (_e) {
    // Live
    const result = await liveFetch();

    MemCache.set(uniqueId, {
        dt: new Date(),
        data: result,
    });

    // Respond
    return result;
  }
};

export { DataCache };
