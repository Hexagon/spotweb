import { sha256 } from "sha256";

interface IDataCache {
  source: string;
  dt: Date;
  timeLeft: number;
  valid: boolean;
  data: unknown;
}

interface IDataCacheParsed {
  source: Date;
  dt: string;
  timeLeft: number;
  valid: boolean;
  data: unknown;
}

interface IDataCachePolicy {
  timeoutSec: number;
  timeoutSecInvalid: number;
}

const DataCachePolicy = {
  "minute": {
    "timeoutSec": 60,
    "timeoutSecInvalid": 60,
  },
  "minute-2": {
    "timeoutSec": 2 * 60,
    "timeoutSecInvalid": 2 * 60,
  },
  "hour": {
    "timeoutSec": 60 * 60,
    "timeoutSecInvalid": 2 * 60,
  },
  "hour-2": {
    "timeoutSec": 2 * 60 * 60,
    "timeoutSecInvalid": 2 * 60,
  },
  "hour-6": {
    "timeoutSec": 60 * 60 * 6,
    "timeoutSecInvalid": 2 * 60,
  },
  "max": {
    "timeoutSec": 60 * 60 * 24 * 7,
    "timeoutSecInvalid": 2 * 60 * 60,
  },
};

const MemCache = new Map();

const DataCache = async (params: unknown, policy: string, liveFetch: unknown) => {
  // Check cache policy
  const usedPolicy: IDataCachePolicy = DataCachePolicy[policy];

  if (!usedPolicy) throw new Error("Invalid cache policy " + policy);

  // Make checksum of parameters
  const paramString = new URLSearchParams({ ...params }).toString(),
    paramHash = sha256(paramString, "utf8", "hex");

  // Check for cache

  try {
    let cacheJSON: IDataCacheParsed | IDataCache | undefined;
    // Memcache
    if (MemCache.has(paramHash)) {
      cacheJSON = MemCache.get(paramHash);

      if (cacheJSON) {
        cacheJSON.source = "memcache";
      }
    }

    if (!cacheJSON) throw new Error("Could not read cache");
    if (typeof cacheJSON.dt === "string") throw new Error("Could not read cache");

    // Append time left
    const timeLeft = Math.round(
      (cacheJSON.dt.getTime() - new Date().getTime() + ((cacheJSON.valid ? usedPolicy.timeoutSec : usedPolicy.timeoutSecInvalid) * 1000)) / 1000,
    );
    if (timeLeft <= 0) {
      throw new Error("Cache expired");
    }

    // Append time left
    cacheJSON.timeLeft = timeLeft;

    // If cache
    return cacheJSON;
  } catch (_e) {
    // Live
    const result = await liveFetch();

    const resultObj: IDataCache = {
      source: "cache",
      dt: new Date(),
      ...result,
    };

    MemCache.set(paramHash, resultObj);

    // Respond
    return {
      source: "live",
      dt: new Date(),
      timeLeft: result.valid ? usedPolicy.timeoutSec : usedPolicy.timeoutSecInvalid,
      ...result,
    };
  }
};

export { DataCache };
export type { IDataCache };
