// USDA hardiness-zone resolution.
//
// Strategy (in order):
//   1. ZIP code → zip_zones cache table (local Postgres).
//   2. ZIP code → phzmapi.org (mirrors the USDA 2023 per-ZIP dataset
//      from S3, ~33k records); on hit, write through to the cache.
//   3. Latitude band → coarse approximation in `lib/garden/zones.ts`.
//
// The first two steps cover ~all US addresses with USDA-accurate
// values. Step 3 exists so non-US (or address-without-postcode) cases
// don't break the flow; we tell the caller it's an approximation via
// `source`.

import {
  HARDINESS_ZONES,
  latitudeToZone,
  type HardinessZone,
} from "@/lib/garden/zones";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export type ZoneSource = "cache" | "phzmapi" | "latitude_band";

export type ZoneResolution = {
  zone: HardinessZone;
  source: ZoneSource;
};

const PHZMAPI_BASE = "https://phzmapi.org";

function asZone(value: string | undefined | null): HardinessZone | null {
  if (!value) return null;
  return (HARDINESS_ZONES as readonly string[]).includes(value)
    ? (value as HardinessZone)
    : null;
}

async function readCache(zipcode: string): Promise<HardinessZone | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("zip_zones")
    .select("zone")
    .eq("zipcode", zipcode)
    .maybeSingle();
  if (error || !data) return null;
  return asZone(data.zone);
}

async function fetchFromPhzmApi(
  zipcode: string,
): Promise<{ zone: HardinessZone; temperatureRange: string | null } | null> {
  try {
    const res = await fetch(`${PHZMAPI_BASE}/${zipcode}.json`, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      zone?: string;
      temperature_range?: string;
    };
    const zone = asZone(data.zone);
    if (!zone) return null;
    return {
      zone,
      temperatureRange: data.temperature_range ?? null,
    };
  } catch {
    return null;
  }
}

async function writeCache(
  zipcode: string,
  zone: HardinessZone,
  temperatureRange: string | null,
) {
  try {
    const service = createServiceClient();
    await service.from("zip_zones").upsert(
      {
        zipcode,
        zone,
        temperature_range: temperatureRange,
        source: "phzmapi.org",
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "zipcode" },
    );
  } catch {
    // Cache misses on the write path shouldn't break the user flow.
    // They'll just re-fetch from phzmapi next time.
  }
}

export async function resolveZone(opts: {
  zip?: string | null;
  countryCode?: string | null;
  lat?: number | null;
}): Promise<ZoneResolution | null> {
  const zip = opts.zip?.trim();
  const isUsZip =
    !!zip && /^\d{5}$/.test(zip) && (opts.countryCode ?? "us") === "us";

  if (isUsZip) {
    const cached = await readCache(zip);
    if (cached) return { zone: cached, source: "cache" };

    const remote = await fetchFromPhzmApi(zip);
    if (remote) {
      await writeCache(zip, remote.zone, remote.temperatureRange);
      return { zone: remote.zone, source: "phzmapi" };
    }
  }

  if (opts.lat != null && Number.isFinite(opts.lat)) {
    return { zone: latitudeToZone(opts.lat), source: "latitude_band" };
  }

  return null;
}
