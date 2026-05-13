import { NextResponse, type NextRequest } from "next/server";
import { geocodeAddress } from "@/lib/garden/geocode";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "Missing 'q' query parameter." },
      { status: 400 },
    );
  }

  try {
    const hit = await geocodeAddress(q);
    if (!hit) {
      return NextResponse.json(
        { error: "No match found for that address." },
        { status: 404 },
      );
    }
    return NextResponse.json(hit);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Geocoding failed.", detail },
      { status: 502 },
    );
  }
}
