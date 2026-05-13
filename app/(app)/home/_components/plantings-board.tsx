"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/garden/empty-state";
import {
  HarvestSheet,
  IssueSheet,
  type HarvestSubmit,
  type IssueSubmit,
} from "@/components/garden/log-action-sheet";
import { PlantingCard } from "@/components/garden/planting-card";
import { useToast } from "@/components/ui/toast-provider";
import { usePlantings } from "@/lib/hooks/usePlantings";
import { sortPlantingCards, type PlantingCard as PlantingCardData } from "@/lib/garden/planting-helpers";
import {
  logHarvest,
  logObservation,
  logWatering,
  undoLog,
} from "@/app/(app)/home/actions";

type ActionTarget = {
  planting: PlantingCardData;
  mode: "harvest" | "issue";
};

export function PlantingsBoard({
  initialPlantings,
}: {
  initialPlantings: PlantingCardData[];
}) {
  const { plantings, mutate, error } = usePlantings({
    fallbackData: { plantings: initialPlantings },
  });
  const [active, setActive] = useState<ActionTarget | null>(null);
  const toast = useToast();

  function applyOptimisticWater(plantingId: string) {
    const nowIso = new Date().toISOString();
    return (current: { plantings: PlantingCardData[] } | undefined) => {
      const list = current?.plantings ?? plantings;
      const next = list.map((p) =>
        p.id === plantingId
          ? {
              ...p,
              last_watered_at: nowIso,
              days_since_watered: 0,
              needs_water: false,
              last_activity_at: nowIso,
            }
          : p,
      );
      return { plantings: sortPlantingCards(next) };
    };
  }

  async function handleWater(planting: PlantingCardData) {
    const optimistic = applyOptimisticWater(planting.id);
    try {
      const result = await mutate(
        async () => {
          const res = await logWatering(planting.id);
          if (!res.ok) throw new Error(res.error);
          // Pull authoritative data after the action lands.
          const refreshed = await fetch("/api/plantings", {
            credentials: "include",
          }).then((r) => r.json());
          return refreshed;
        },
        {
          optimisticData: optimistic,
          rollbackOnError: true,
          revalidate: false,
        },
      );

      // Find the log id from the action so we can offer undo.
      // mutate's returned data is the refreshed plantings; we need the
      // log_id, which the action returned. We don't have it on this
      // path. Show the toast without undo for water — the action is
      // fast and easy to re-do. (See note in summary.)
      void result;
      toast.show({
        message: `Logged watering for ${planting.plant.common_name}`,
      });
    } catch (err) {
      toast.show({
        message:
          err instanceof Error
            ? err.message
            : "Couldn't log that. Try again.",
      });
    }
  }

  async function handleHarvest(planting: PlantingCardData, input: HarvestSubmit) {
    const result = await logHarvest({
      plantingId: planting.id,
      amountOz: input.amountOz,
      notes: input.notes,
      finished: input.finished,
    });
    if (!result.ok) {
      toast.show({ message: result.error });
      return;
    }
    const logId = result.data.log_id;
    await mutate();
    toast.show({
      message: input.finished
        ? `Marked ${planting.plant.common_name} as harvested`
        : `Logged harvest for ${planting.plant.common_name}`,
      onUndo: async () => {
        await undoLog(logId);
        await mutate();
      },
    });
  }

  async function handleIssue(planting: PlantingCardData, input: IssueSubmit) {
    const result = await logObservation({
      plantingId: planting.id,
      type: input.type,
      notes: input.notes,
    });
    if (!result.ok) {
      toast.show({ message: result.error });
      return;
    }
    const logId = result.data.log_id;
    await mutate();
    const baseMessage = `Logged note for ${planting.plant.common_name}`;
    toast.show({
      message: input.alsoAskCoach
        ? `${baseMessage} — coach hand-off coming soon`
        : baseMessage,
      onUndo: async () => {
        await undoLog(logId);
        await mutate();
      },
    });
  }

  if (!plantings.length && !error) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
          Active plantings · {plantings.length}
        </h2>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-10 rounded-full"
        >
          <Link href="/plantings/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </Link>
        </Button>
      </div>

      <ul className="flex flex-col gap-4">
        {plantings.map((p) => (
          <li key={p.id}>
            <PlantingCard
              planting={p}
              onWatered={() => handleWater(p)}
              onHarvest={() => setActive({ planting: p, mode: "harvest" })}
              onLogIssue={() => setActive({ planting: p, mode: "issue" })}
            />
          </li>
        ))}
      </ul>

      <HarvestSheet
        open={active?.mode === "harvest"}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
        plantName={active?.planting.plant.common_name ?? ""}
        onSubmit={async (input) => {
          if (!active) return;
          await handleHarvest(active.planting, input);
        }}
      />

      <IssueSheet
        open={active?.mode === "issue"}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
        plantName={active?.planting.plant.common_name ?? ""}
        onSubmit={async (input) => {
          if (!active) return;
          await handleIssue(active.planting, input);
        }}
      />
    </div>
  );
}
