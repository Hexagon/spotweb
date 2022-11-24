import { spotprice } from "spotprice";
import { sha256 } from "sha256";
import { resolve } from "std/path/mod.ts";
import { inflateRaw, deflateRaw } from "compress/zlib/mod.ts";

interface SpotApiRow {
    startTime: string;
    endTime: string;
    areaCode: string;
    spotPrice: number;
    unit: string;
}

interface SpotApiResult {
    source: string;
    dt: Date;
    data: SpotApiRow[]
}

export type { SpotApiRow, SpotApiResult };
  
export const handler = async (req: Request): Promise<Response> => {
    
    // Parse URL
    const url = new URL(req.url);

    // Get raw query
    const 
        period = url.searchParams.get("period")?.trim().toLowerCase() || "",
        area = url.searchParams.get("area")?.trim().toUpperCase() || "",
        currency = url.searchParams.get("currency")?.trim().toUpperCase() || "",
        isoDate = url.searchParams.get("date") || "";

    // Validate period
    const validPeriods = ["hourly", "daily", "weekly", "monthly", "yearly"];
    if (!validPeriods.includes(period)) {
        return new Response(JSON.stringify({status: "Error", details: "Period not valid"}), { status: 500});
    }

    // Validate date
    const parsedDate = new Date(Date.parse(isoDate));
    if(!(parsedDate instanceof Date) || isNaN((parsedDate as unknown) as number)) {
        return new Response(JSON.stringify({status: "Error", details: "Date not valid : " +isoDate + " parsed as " + parsedDate}),{ status: 500});
    }
    
    // Make checksum of parameters
    const
        paramString = new URLSearchParams({period, area, currency, isoDate, unit, extra, factor}).toString(),
        paramHash = sha256(paramString, "utf8", "hex");

    // Check for cache
    let cacheContent;
    try {
        // Cache
        cacheContent = await Deno.readFile(resolve(Deno.cwd(),`./cache/${paramHash}.cache`));
        const cacheInflated = inflateRaw(cacheContent),
            cacheResult = new TextDecoder().decode(cacheInflated);
        return new Response(cacheResult);
    } catch (_e) {

        // Live
        const 
            result = await spotprice(period, area, currency, parsedDate);

        // Store cache if result seem sane
        let validResult = true;
        if (result.length > 0) {
            for(const e of result) {
                if (isNaN(parseInt(e.spotPrice.toString(), 10))) {
                    validResult = false;
                    break;
                }
            }
        } else {
            validResult = false;
        }
        if (validResult) {
            try {
                const resultStr = JSON.stringify({ 
                    source: 'cache',
                    dt: new Date().toISOString(),
                    data: result
                });
                const resultBytes = new TextEncoder().encode(resultStr);
                const compressedResult = deflateRaw(resultBytes);
                Deno.writeFile(resolve(Deno.cwd(),`./cache/${paramHash}.cache`), compressedResult);
            } catch (_e) {
                console.log("Failed to write cache");
            }
        }

        // Respond
        return new Response(JSON.stringify({ 
            source: 'live',
            dt: new Date().toISOString(),
            data: result
        }));
    }
    
};
