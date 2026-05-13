import { NextResponse, type NextRequest } from "next/server";
import { resolveZone } from "@/lib/garden/zone-lookup";
import { zoneFrostDates } from "@/lib/garden/zones";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const zip = params.get("zip");
  const latStr = params.get("lat");
  const lngStr = params.get("lng");

  if (!zip && !latStr) {
    return NextResponse.json(
      {
        error:
          "Provide either 'zip' (US, 5 digits) or 'lat' (+ optional 'lng').",
      },
      { status: 400 },
    );
  }

  const lat = latStr ? parseFloat(latStr) : null;
  const lng = lngStr ? parseFloat(lngStr) : null;

  if (lat !== null && (!Number.isFinite(lat) || Math.abs(lat) > 90)) {
    return NextResponse.json(
      { error: "Invalid latitude." },
      { status: 400 },
    );
  }
  if (lng !== null && (!Number.isFinite(lng) || Math.abs(lng) > 180)) {
    return NextResponse.json(
      { error: "Invalid longitude." },
      { status: 400 },
    );
  }

  const resolution = await resolveZone({
    zip,
    countryCode: zip ? "us" : null,
    lat,
  });

  if (!resolution) {
    return NextResponse.json(
      { error: "Couldn't resolve a zone for those inputs." },
      { status: 404 },
    );
  }

  const frost = zoneFrostDates(resolution.zone);

  return NextResponse.json({
    zone: resolution.zone,
    source: resolution.source,
    last_frost_date: frost.lastFrost,
    first_frost_date: frost.firstFrost,
  });
}
