import { NextResponse, type NextRequest } from "next/server";
import {
  annotatePlanting,
  sortPlantingCards,
  type PlantingBase,
  type PlantingCard,
  type RecentObservation,
} from "@/lib/garden/planting-helpers";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANT_FIELDS =
  "common_name, scientific_name, type, days_to_maturity_min, days_to_maturity_max, sunlight_min_hours";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("plantings")
    .select(
      `id, plant_id, space_id, variety, planted_date, status, last_activity_at,
       plant:plants(${PLANT_FIELDS})`,
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("last_activity_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const plantings = (rows ?? []) as unknown as PlantingBase[];
  if (plantings.length === 0) {
    return NextResponse.json({ plantings: [] });
  }

  const plantingIds = plantings.map((p) => p.id);

  // Fetch the most recent water log per planting in one round trip.
  const { data: waterLogs } = await supabase
    .from("logs")
    .select("planting_id, logged_at")
    .eq("user_id", user.id)
    .eq("type", "water")
    .in("planting_id", plantingIds)
    .order("logged_at", { ascending: false });

  const lastWaterByPlanting = new Map<string, string>();
  for (const row of waterLogs ?? []) {
    if (row.planting_id && !lastWaterByPlanting.has(row.planting_id)) {
      lastWaterByPlanting.set(row.planting_id, row.logged_at);
    }
  }

  // Recent observation-style logs (max 3 per planting).
  const { data: obsLogs } = await supabase
    .from("logs")
    .select("id, planting_id, type, logged_at, notes")
    .eq("user_id", user.id)
    .in("type", ["observation", "pest", "weather_event"])
    .in("planting_id", plantingIds)
    .order("logged_at", { ascending: false })
    .limit(plantingIds.length * 3);

  const obsByPlanting = new Map<string, RecentObservation[]>();
  for (const row of obsLogs ?? []) {
    if (!row.planting_id) continue;
    const list = obsByPlanting.get(row.planting_id) ?? [];
    if (list.length < 3) {
      list.push({
        id: row.id,
        type: row.type,
        logged_at: row.logged_at,
        notes: row.notes,
      });
      obsByPlanting.set(row.planting_id, list);
    }
  }

  const now = new Date();
  const annotated: PlantingCard[] = plantings.map((p) =>
    annotatePlanting({
      planting: p,
      lastWateredAt: lastWaterByPlanting.get(p.id) ?? null,
      recentObservations: obsByPlanting.get(p.id) ?? [],
      now,
    }),
  );

  return NextResponse.json({ plantings: sortPlantingCards(annotated) });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    plant_id?: unknown;
    space_id?: unknown;
    variety?: unknown;
    planted_date?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body must be JSON." },
      { status: 400 },
    );
  }

  const plantId =
    typeof body.plant_id === "string" ? body.plant_id : null;
  const spaceId =
    typeof body.space_id === "string" ? body.space_id : null;
  const variety =
    typeof body.variety === "string" && body.variety.trim()
      ? body.variety.trim()
      : null;
  const plantedDate =
    typeof body.planted_date === "string" ? body.planted_date : null;

  if (!plantId) {
    return NextResponse.json(
      { error: "plant_id is required." },
      { status: 400 },
    );
  }
  if (!plantedDate || !/^\d{4}-\d{2}-\d{2}$/.test(plantedDate)) {
    return NextResponse.json(
      { error: "planted_date must be YYYY-MM-DD." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("plantings")
    .insert({
      user_id: user.id,
      plant_id: plantId,
      space_id: spaceId,
      variety,
      planted_date: plantedDate,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
