// USDA Plant Hardiness Zone approximation for Garden Coach v1.
//
// ------------------------- v1 simplification -------------------------
// The official USDA zone for an address is derived from the 30-year
// average annual minimum temperature at that exact location. It does
// not map cleanly to latitude — elevation, water bodies, and urban
// heat islands all shift the boundary. The authoritative source is
// the USDA PHZM (https://planthardiness.ars.usda.gov/), which exposes
// a point query, but it has no public REST endpoint suitable for
// arbitrary backends.
//
// Until we either (a) embed the PHZM raster ourselves or (b) wire up
// a paid weather service, we approximate by latitude. The table below
// is the v1 fallback. Replace it with a real lookup as soon as we
// have a satisfactory data source — the rest of the app already
// treats `hardiness_zone` as the source of truth and only this file
// needs to change.
//
// Reference table (Northern Hemisphere; mirrored for Southern via abs).
//
//   |  Latitude band  |  Zone  |
//   |-----------------|--------|
//   |  ≥ 49°          |  3a    |
//   |  47.5–49°       |  3b    |
//   |  46.0–47.5°     |  4a    |
//   |  44.5–46.0°     |  4b    |
//   |  43.0–44.5°     |  5a    |
//   |  41.5–43.0°     |  5b    |
//   |  40.0–41.5°     |  6a    |
//   |  38.5–40.0°     |  6b    |
//   |  37.0–38.5°     |  7a    |
//   |  35.5–37.0°     |  7b    |
//   |  34.0–35.5°     |  8a    |
//   |  32.5–34.0°     |  8b    |
//   |  31.0–32.5°     |  9a    |
//   |  29.5–31.0°     |  9b    |
//   |  28.0–29.5°     |  10a   |
//   |  26.5–28.0°     |  10b   |
//   |  25.0–26.5°     |  11a   |
//   |  < 25°          |  11b   |
//
// Frost dates are zone-typical averages, not location-specific. They
// will be wrong by 1–4 weeks for any individual garden depending on
// elevation, microclimate, and prevailing wind. Treat them as a
// "good enough for first sketch" anchor; the coach should refine
// per-user over time.
// --------------------------------------------------------------------

export const HARDINESS_ZONES = [
  "3a",
  "3b",
  "4a",
  "4b",
  "5a",
  "5b",
  "6a",
  "6b",
  "7a",
  "7b",
  "8a",
  "8b",
  "9a",
  "9b",
  "10a",
  "10b",
  "11a",
  "11b",
  // 12 & 13 were added to USDA PHZM in 2023 for Hawaii, Puerto Rico,
  // Guam, and parts of southern Florida.
  "12a",
  "12b",
  "13a",
  "13b",
] as const;

export type HardinessZone = (typeof HARDINESS_ZONES)[number];

type Band = { minLat: number; zone: HardinessZone };

const BANDS: Band[] = [
  { minLat: 49.0, zone: "3a" },
  { minLat: 47.5, zone: "3b" },
  { minLat: 46.0, zone: "4a" },
  { minLat: 44.5, zone: "4b" },
  { minLat: 43.0, zone: "5a" },
  { minLat: 41.5, zone: "5b" },
  { minLat: 40.0, zone: "6a" },
  { minLat: 38.5, zone: "6b" },
  { minLat: 37.0, zone: "7a" },
  { minLat: 35.5, zone: "7b" },
  { minLat: 34.0, zone: "8a" },
  { minLat: 32.5, zone: "8b" },
  { minLat: 31.0, zone: "9a" },
  { minLat: 29.5, zone: "9b" },
  { minLat: 28.0, zone: "10a" },
  { minLat: 26.5, zone: "10b" },
  { minLat: 25.0, zone: "11a" },
];

export function latitudeToZone(lat: number): HardinessZone {
  const absLat = Math.abs(lat);
  for (const band of BANDS) {
    if (absLat >= band.minLat) return band.zone;
  }
  return "11b";
}

const FROST_MMDD: Record<HardinessZone, { last: string; first: string }> = {
  "3a": { last: "05-25", first: "09-15" },
  "3b": { last: "05-20", first: "09-20" },
  "4a": { last: "05-10", first: "09-25" },
  "4b": { last: "05-05", first: "09-30" },
  "5a": { last: "04-30", first: "10-05" },
  "5b": { last: "04-25", first: "10-10" },
  "6a": { last: "04-20", first: "10-15" },
  "6b": { last: "04-15", first: "10-20" },
  "7a": { last: "04-10", first: "10-25" },
  "7b": { last: "04-05", first: "10-30" },
  "8a": { last: "03-30", first: "11-05" },
  "8b": { last: "03-25", first: "11-10" },
  "9a": { last: "03-15", first: "11-20" },
  "9b": { last: "03-05", first: "11-25" },
  "10a": { last: "02-20", first: "12-05" },
  "10b": { last: "02-05", first: "12-15" },
  "11a": { last: "01-15", first: "12-25" },
  "11b": { last: "01-01", first: "12-31" },
  // Zones 12 & 13 are functionally frost-free; the dates below are
  // placeholders so the UI has something to render. The coach should
  // treat these zones as "no frost" rather than calendar-bound.
  "12a": { last: "01-01", first: "12-31" },
  "12b": { last: "01-01", first: "12-31" },
  "13a": { last: "01-01", first: "12-31" },
  "13b": { last: "01-01", first: "12-31" },
};

export function zoneFrostDates(zone: HardinessZone): {
  lastFrost: string;
  firstFrost: string;
} {
  const dates = FROST_MMDD[zone];
  const year = new Date().getUTCFullYear();
  return {
    lastFrost: `${year}-${dates.last}`,
    firstFrost: `${year}-${dates.first}`,
  };
}
