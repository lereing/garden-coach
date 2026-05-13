import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderStatus } from "@/components/garden/header-status";
import { SignOutButton } from "@/app/(app)/_components/sign-out-button";
import { PlantingsBoard } from "@/app/(app)/home/_components/plantings-board";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries";
import {
  annotatePlanting,
  sortPlantingCards,
  type PlantingBase,
  type PlantingCard,
  type RecentObservation,
} from "@/lib/garden/planting-helpers";
import { getCurrentWeather } from "@/lib/garden/weather";

export const dynamic = "force-dynamic";

const PLANT_FIELDS =
  "common_name, scientific_name, type, days_to_maturity_min, days_to_maturity_max, sunlight_min_hours";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [profile, { data: rows }] = await Promise.all([
    getProfile(supabase, user.id),
    supabase
      .from("plantings")
      .select(
        `id, plant_id, space_id, variety, planted_date, status, last_activity_at,
         plant:plants(${PLANT_FIELDS})`,
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("last_activity_at", { ascending: false }),
  ]);

  const plantings = (rows ?? []) as unknown as PlantingBase[];

  // Pull last-watered timestamps and recent observations in one batch.
  let initialCards: PlantingCard[] = [];
  if (plantings.length > 0) {
    const ids = plantings.map((p) => p.id);
    const [{ data: waterLogs }, { data: obsLogs }] = await Promise.all([
      supabase
        .from("logs")
        .select("planting_id, logged_at")
        .eq("user_id", user.id)
        .eq("type", "water")
        .in("planting_id", ids)
        .order("logged_at", { ascending: false }),
      supabase
        .from("logs")
        .select("id, planting_id, type, logged_at, notes")
        .eq("user_id", user.id)
        .in("type", ["observation", "pest", "weather_event"])
        .in("planting_id", ids)
        .order("logged_at", { ascending: false })
        .limit(ids.length * 3),
    ]);

    const lastWaterByPlanting = new Map<string, string>();
    for (const row of waterLogs ?? []) {
      if (row.planting_id && !lastWaterByPlanting.has(row.planting_id)) {
        lastWaterByPlanting.set(row.planting_id, row.logged_at);
      }
    }
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
    initialCards = sortPlantingCards(
      plantings.map((p) =>
        annotatePlanting({
          planting: p,
          lastWateredAt: lastWaterByPlanting.get(p.id) ?? null,
          recentObservations: obsByPlanting.get(p.id) ?? [],
          now,
        }),
      ),
    );
  }

  const weather =
    profile?.latitude != null && profile?.longitude != null
      ? await getCurrentWeather(profile.latitude, profile.longitude)
      : null;

  const needsWaterCount = initialCards.filter((c) => c.needs_water).length;
  const readyToHarvestCount = initialCards.filter(
    (c) => c.ready_to_harvest,
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-12 sm:px-6 sm:pt-10">
      <HeaderStatus
        city={profile?.address ?? null}
        weather={weather}
        needsWaterCount={needsWaterCount}
        readyToHarvestCount={readyToHarvestCount}
        activeCount={initialCards.length}
      />

      <PlantingsBoard initialPlantings={initialCards} />

      <footer className="mt-6 flex items-center justify-between gap-3">
        <Button
          asChild
          variant="ghost"
          className="rounded-full text-muted-foreground"
        >
          <Link href="/coach">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Ask the coach
          </Link>
        </Button>
        <SignOutButton />
      </footer>
    </main>
  );
}
