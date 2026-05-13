"use client";

import { useState } from "react";
import { ChevronDown, Droplets, MessageCircle, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlantTypeBadge } from "@/components/ui/plant-type-badge";
import { cn } from "@/lib/utils/cn";
import { PLANT_TYPE_META } from "@/lib/garden/plant-types";
import type { PlantingCard as PlantingCardData } from "@/lib/garden/planting-helpers";

type PlantingCardProps = {
  planting: PlantingCardData;
  onWatered: () => void;
  onHarvest: () => void;
  onLogIssue: () => void;
};

export function PlantingCard({
  planting,
  onWatered,
  onHarvest,
  onLogIssue,
}: PlantingCardProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const meta = PLANT_TYPE_META[planting.plant.type];

  const surfaceGradient = `linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(${meta.cssVar}) 6%, #ffffff) 100%)`;

  return (
    <article
      className={cn(
        "card-surface relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-border/60",
        "p-5 sm:p-6",
      )}
      style={{ background: surfaceGradient }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-xl leading-tight font-semibold text-foreground sm:text-2xl">
            {planting.plant.common_name}
          </h3>
          {planting.variety && (
            <p className="text-sm text-muted-foreground sm:text-base">
              {planting.variety}
            </p>
          )}
        </div>
        <PlantTypeBadge type={planting.plant.type} size="sm" />
      </header>

      <StatStrip planting={planting} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          onClick={onLogIssue}
          variant="outline"
          className="h-12 flex-1 rounded-full border-border/70 text-foreground sm:h-14 sm:flex-none sm:min-w-[140px]"
        >
          Log issue
        </Button>
        <Button
          type="button"
          onClick={onHarvest}
          variant="outline"
          className="h-12 flex-1 rounded-full border-border/70 text-foreground sm:h-14 sm:flex-none sm:min-w-[140px]"
        >
          <Sprout className="h-4 w-4" aria-hidden="true" />
          Harvested
        </Button>
        <Button
          type="button"
          onClick={onWatered}
          className="h-12 flex-1 rounded-full sm:h-14 sm:flex-none sm:min-w-[180px]"
        >
          <Droplets className="h-4 w-4" aria-hidden="true" />
          Watered
        </Button>
      </div>

      {planting.recent_observations.length > 0 && (
        <NotesSection
          open={notesOpen}
          onToggle={() => setNotesOpen((v) => !v)}
          observations={planting.recent_observations}
        />
      )}
    </article>
  );
}

function StatStrip({ planting }: { planting: PlantingCardData }) {
  const water = formatWaterStat(planting.days_since_watered);
  const harvest = formatHarvestStat(planting.days_until_harvest);
  return (
    <div
      role="list"
      className="grid grid-cols-3 gap-3 rounded-2xl border border-border/60 bg-background/60 p-4"
    >
      <Stat
        role="listitem"
        label="Planted"
        value={`${planting.days_since_planted}d`}
        hint="ago"
      />
      <Stat
        role="listitem"
        label="Harvest"
        value={harvest.value}
        hint={harvest.hint}
        tone={planting.ready_to_harvest ? "good" : "neutral"}
      />
      <Stat
        role="listitem"
        label="Watered"
        value={water.value}
        hint={water.hint}
        tone={planting.needs_water ? "warn" : "neutral"}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "neutral",
  role,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "good" | "warn";
  role?: string;
}) {
  const accent =
    tone === "good"
      ? "var(--type-leafy-green)"
      : tone === "warn"
        ? "var(--type-brassica)"
        : "var(--foreground)";
  return (
    <div role={role} className="flex flex-col gap-1 text-center">
      <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className="font-mono text-xl font-semibold tabular-nums sm:text-2xl"
        style={{ color: accent }}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function NotesSection({
  open,
  onToggle,
  observations,
}: {
  open: boolean;
  onToggle: () => void;
  observations: PlantingCardData["recent_observations"];
}) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="notes-content"
        className="inline-flex items-center gap-1.5 self-start rounded-full text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" strokeWidth={2.25} />
        Notes ({observations.length})
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <ul
          id="notes-content"
          className="fade-in-soft flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/60 p-4"
        >
          {observations.map((obs) => (
            <li key={obs.id} className="flex flex-col gap-0.5">
              <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                {obs.type.replace("_", " ")} ·{" "}
                {new Date(obs.logged_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-foreground">{obs.notes}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatWaterStat(daysSinceWatered: number | null): {
  value: string;
  hint: string;
} {
  if (daysSinceWatered === null) return { value: "—", hint: "no log yet" };
  if (daysSinceWatered === 0) return { value: "Today", hint: "watered" };
  return {
    value: `${daysSinceWatered}d`,
    hint: daysSinceWatered === 1 ? "day ago" : "days ago",
  };
}

function formatHarvestStat(daysUntilHarvest: number | null): {
  value: string;
  hint: string;
} {
  if (daysUntilHarvest === null)
    return { value: "—", hint: "no estimate" };
  if (daysUntilHarvest <= 0) return { value: "Ready", hint: "to harvest" };
  return {
    value: `${daysUntilHarvest}d`,
    hint: "to go",
  };
}
