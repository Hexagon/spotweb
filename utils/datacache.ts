import { sha256 } from "sha256";
import { resolve } from "std/path/mod.ts";
import { deflateRaw, inflateRaw } from "compress/zlib/mod.ts";

interface IDataCache {
  source: string;
  dt: Date;
  timeLeft: number;
  valid: boolean;
  data: unknown;
}

interface IDataCacheLiveResponse {
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

const DataCache = async (params: unknown, baseId: string, policy: string, liveFetch: unknown) => {
  // Check cache policy
  const usedPolicy: IDataCachePolicy = DataCachePolicy[policy];

  if (!usedPolicy) throw new Error("Invalid cache policy");

  // Make checksum of parameters
  const paramString = new URLSearchParams({ ...params }).toString(),
    paramHash = sha256(paramString, "utf8", "hex");

  // Check for cache
  let cacheContent;
  try {
    let cacheJSON: IDataCacheParsed | IDataCache | undefined;
    // Memcache
    if (MemCache.has(paramHash)) {

      cacheJSON = MemCache.get(paramHash);
   
      if (cacheJSON) {
        cacheJSON.source = "memcache";
      }

    // diskCache
    } else {

      cacheContent = await Deno.readFile(resolve(Deno.cwd(), `./cache/${baseId}.${paramHash}.cache`));
      if (cacheContent) {
        const cacheInflated = inflateRaw(cacheContent),
        cacheResult = new TextDecoder().decode(cacheInflated);
        cacheJSON = JSON.parse(cacheResult);
        if( cacheJSON) {
           // Parse date time
           cacheJSON.dt = new Date(Date.parse(cacheJSON.dt as string));      
        }

        // Hoist to memcache
        MemCache.set(paramHash, cacheJSON);
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

    MemCache.set(paramHash,resultObj);
    
    const resultStr: string = JSON.stringify(resultObj);
    const resultBytes = new TextEncoder().encode(resultStr);
    const compressedResult = deflateRaw(resultBytes);
    try {
      Deno.writeFile(
        resolve(Deno.cwd(), `./cache/${baseId}.${paramHash}.cache`),
        compressedResult,
      );
    } catch (_e) {
      console.log("Failed to write cache");
    }

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
