// Thin wrapper around Nominatim (OpenStreetMap). Free, no API key
// required. Their fair-use policy requires:
//   1. A unique User-Agent identifying the app (and ideally contact).
//   2. ≤ 1 request per second per IP.
//   3. Aggressive caching of results.
//
// We cache in process memory with a 7-day TTL. This is per-instance —
// fine for a single Vercel dev/preview deploy, less great for
// horizontally-scaled prod. If we outgrow it, lift the cache into
// Postgres (a small `geocode_cache` table) or Redis.

export type GeocodeHit = {
  lat: number;
  lng: number;
  displayName: string;
  /** US: 5-digit ZIP (no +4). Non-US: local postal code. May be null. */
  postcode: string | null;
  /** ISO 3166-1 alpha-2, lowercase (e.g. "us"). May be null. */
  countryCode: string | null;
};

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;

type Entry = { hit: GeocodeHit | null; cachedAt: number };
const cache = new Map<string, Entry>();

function normalize(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function readCache(key: string): GeocodeHit | null | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.cachedAt > TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.hit;
}

function writeCache(key: string, hit: GeocodeHit | null) {
  if (cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { hit, cachedAt: Date.now() });
}

function normalizePostcode(raw: string | undefined, country: string | null) {
  if (!raw) return null;
  if (country === "us") {
    // US postcodes can come back as ZIP+4 ("90210-1234"); we only
    // want the 5-digit ZIP.
    const match = raw.match(/^\d{5}/);
    return match ? match[0] : null;
  }
  return raw.trim() || null;
}

export async function geocodeAddress(
  query: string,
): Promise<GeocodeHit | null> {
  const key = normalize(query);
  if (!key) return null;

  const cached = readCache(key);
  if (cached !== undefined) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "GardenCoach/0.1 (https://github.com/lereing/garden-coach)",
      "Accept-Language": "en",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
    address?: {
      postcode?: string;
      country_code?: string;
    };
  }>;

  if (!Array.isArray(data) || data.length === 0) {
    writeCache(key, null);
    return null;
  }

  const first = data[0];
  if (!first.lat || !first.lon) {
    writeCache(key, null);
    return null;
  }

  const countryCode = first.address?.country_code?.toLowerCase() ?? null;
  const postcode = normalizePostcode(first.address?.postcode, countryCode);

  const hit: GeocodeHit = {
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
    displayName: first.display_name ?? query,
    postcode,
    countryCode,
  };
  writeCache(key, hit);
  return hit;
}
