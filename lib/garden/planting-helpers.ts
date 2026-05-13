// Server-side annotation: takes a Planting + its Plant + its most
// recent watering log timestamp and computes the derived fields the
// home logging screen renders and sorts by.

import type { Plant, Planting } from "@/lib/types/database";

export const NEEDS_WATER_THRESHOLD_DAYS = 3;

export type PlantSummary = Pick<
  Plant,
  | "common_name"
  | "scientific_name"
  | "type"
  | "days_to_maturity_min"
  | "days_to_maturity_max"
  | "sunlight_min_hours"
>;

export type PlantingBase = Pick<
  Planting,
  | "id"
  | "plant_id"
  | "space_id"
  | "variety"
  | "planted_date"
  | "status"
  | "last_activity_at"
> & {
  plant: PlantSummary;
};

export type RecentObservation = {
  id: string;
  type: string;
  logged_at: string;
  notes: string | null;
};

export type PlantingCard = PlantingBase & {
  /** ISO string of the most recent water log for this planting, or null. */
  last_watered_at: string | null;
  /** Whole-day counts at request time. Negative days_until_harvest means past due. */
  days_since_planted: number;
  days_until_harvest: number | null;
  days_since_watered: number | null;
  needs_water: boolean;
  ready_to_harvest: boolean;
  recent_observations: RecentObservation[];
};

function startOfDayUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function daysBetween(earlier: Date, later: Date): number {
  const ms =
    startOfDayUtc(later).getTime() - startOfDayUtc(earlier).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function annotatePlanting(opts: {
  planting: PlantingBase;
  lastWateredAt: string | null;
  recentObservations: RecentObservation[];
  now: Date;
}): PlantingCard {
  const { planting, lastWateredAt, recentObservations, now } = opts;

  const plantedDate = new Date(`${planting.planted_date}T00:00:00Z`);
  const daysSincePlanted = Math.max(daysBetween(plantedDate, now), 0);

  const maturity =
    planting.plant.days_to_maturity_max ??
    planting.plant.days_to_maturity_min;
  const daysUntilHarvest =
    typeof maturity === "number" ? maturity - daysSincePlanted : null;

  let daysSinceWatered: number | null = null;
  if (lastWateredAt) {
    daysSinceWatered = Math.max(
      daysBetween(new Date(lastWateredAt), now),
      0,
    );
  }

  const needsWater =
    daysSinceWatered === null
      ? daysSincePlanted >= NEEDS_WATER_THRESHOLD_DAYS
      : daysSinceWatered >= NEEDS_WATER_THRESHOLD_DAYS;

  const readyToHarvest =
    daysUntilHarvest !== null && daysUntilHarvest <= 0;

  return {
    ...planting,
    last_watered_at: lastWateredAt,
    days_since_planted: daysSincePlanted,
    days_until_harvest: daysUntilHarvest,
    days_since_watered: daysSinceWatered,
    needs_water: needsWater,
    ready_to_harvest: readyToHarvest,
    recent_observations: recentObservations,
  };
}

// Card ordering: attention items first, then most recent activity.
export function sortPlantingCards(cards: PlantingCard[]): PlantingCard[] {
  return [...cards].sort((a, b) => {
    const aAttention = (a.needs_water ? 1 : 0) + (a.ready_to_harvest ? 1 : 0);
    const bAttention = (b.needs_water ? 1 : 0) + (b.ready_to_harvest ? 1 : 0);
    if (aAttention !== bAttention) return bAttention - aAttention;
    return b.last_activity_at.localeCompare(a.last_activity_at);
  });
}
