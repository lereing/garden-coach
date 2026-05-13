// One-shot reconciliation: re-resolve every profile's hardiness zone
// using the ZIP-first pipeline that landed in lib/garden/zone-lookup.
// Use when:
//   - The lookup logic changes and stored zones need to catch up.
//   - We swap zone data sources (phzmapi → a paid API, GeoTIFF, etc).
//   - A bug-fix migration in the resolution path needs to backfill.
//
// Run:
//   pnpm reconcile-zones              # apply changes
//   pnpm reconcile-zones --dry-run    # show what would change, write nothing
//
// Reads/writes via the service-role client, so RLS doesn't block us.
// Re-geocodes each address (Nominatim's 1-req/sec rule means this
// caps at ~3600 profiles/hour). Plenty fast at our current scale.

import { createClient } from "@supabase/supabase-js";
import { geocodeAddress } from "@/lib/garden/geocode";
import {
  HARDINESS_ZONES,
  latitudeToZone,
  zoneFrostDates,
  type HardinessZone,
} from "@/lib/garden/zones";
import type { Database } from "@/lib/types/database";

const PHZMAPI = "https://phzmapi.org";
const NOMINATIM_THROTTLE_MS = 1100;

function asZone(value: unknown): HardinessZone | null {
  if (typeof value !== "string") return null;
  return (HARDINESS_ZONES as readonly string[]).includes(value)
    ? (value as HardinessZone)
    : null;
}

type PhzmHit = {
  zone: HardinessZone;
  temperatureRange: string | null;
};

async function fetchPhzmZone(zip: string): Promise<PhzmHit | null> {
  try {
    const res = await fetch(`${PHZMAPI}/${zip}.json`, {
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
    return { zone, temperatureRange: data.temperature_range ?? null };
  } catch {
    return null;
  }
}

async function main() {
  const dryRun = process.argv.slice(2).includes("--dry-run");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (loaded from .env.local via --env-file).",
    );
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (dryRun) {
    console.log("[dry-run] No writes will be made.\n");
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, address, latitude, hardiness_zone")
    .not("address", "is", null);

  if (error) throw error;
  if (!profiles || profiles.length === 0) {
    console.log("No profiles with stored addresses. Nothing to reconcile.");
    return;
  }

  console.log(`Reconciling ${profiles.length} profile(s)…\n`);

  let changed = 0;
  let unchanged = 0;
  let failed = 0;

  for (const profile of profiles) {
    const idShort = profile.id.slice(0, 8);
    const address = profile.address;
    if (!address) continue;

    const hit = await geocodeAddress(address);
    if (!hit) {
      console.log(`  ✗ ${idShort} — geocode failed for "${address}"`);
      failed++;
      await sleep(NOMINATIM_THROTTLE_MS);
      continue;
    }

    let newZone: HardinessZone | null = null;
    let source = "latitude_band";
    if (hit.postcode && (hit.countryCode ?? "us") === "us") {
      const phzm = await fetchPhzmZone(hit.postcode);
      if (phzm) {
        newZone = phzm.zone;
        source = "phzmapi";
        // Warm the cache for subsequent user lookups.
        if (!dryRun) {
          await supabase.from("zip_zones").upsert(
            {
              zipcode: hit.postcode,
              zone: phzm.zone,
              temperature_range: phzm.temperatureRange,
              source: "phzmapi.org",
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "zipcode" },
          );
        }
      }
    }
    if (!newZone) {
      newZone = latitudeToZone(hit.lat);
    }

    if (newZone === profile.hardiness_zone) {
      console.log(`  · ${idShort} — already ${newZone} (${source})`);
      unchanged++;
    } else if (dryRun) {
      console.log(
        `  → ${idShort} — would update ${profile.hardiness_zone ?? "(none)"} → ${newZone} (${source})`,
      );
      changed++;
    } else {
      const frost = zoneFrostDates(newZone);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          hardiness_zone: newZone,
          last_frost_date: frost.lastFrost,
          first_frost_date: frost.firstFrost,
          latitude: hit.lat,
          longitude: hit.lng,
        })
        .eq("id", profile.id);
      if (updateError) {
        console.log(
          `  ✗ ${idShort} — write failed: ${updateError.message}`,
        );
        failed++;
      } else {
        console.log(
          `  ✓ ${idShort} — ${profile.hardiness_zone ?? "(none)"} → ${newZone} (${source})`,
        );
        changed++;
      }
    }

    await sleep(NOMINATIM_THROTTLE_MS);
  }

  const prefix = dryRun ? "[dry-run] " : "";
  const verb = dryRun ? "would update" : "updated";
  console.log(
    `\n${prefix}Done. ${changed} ${verb} · ${unchanged} unchanged · ${failed} failed.`,
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error("\nFatal:", err);
  process.exit(1);
});
