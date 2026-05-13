"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlantTypeBadge } from "@/components/ui/plant-type-badge";
import { cn } from "@/lib/utils/cn";
import type { Plant, PlantType, Space } from "@/lib/types/database";
import { createPlanting } from "@/app/(app)/plantings/new/actions";

type NewPlantingFormProps = {
  plants: Pick<Plant, "id" | "common_name" | "type">[];
  spaces: Pick<Space, "id" | "name" | "type">[];
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function NewPlantingForm({ plants, spaces }: NewPlantingFormProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [plantId, setPlantId] = useState<string | null>(null);
  const [spaceId, setSpaceId] = useState<string | null>(
    spaces[0]?.id ?? null,
  );
  const [plantedDate, setPlantedDate] = useState(todayIso());
  const [variety, setVariety] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredPlants = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? plants.filter((p) => p.common_name.toLowerCase().includes(q))
      : plants;
    // Group by type for legibility.
    const grouped = new Map<PlantType, typeof plants>();
    for (const p of list) {
      const existing = grouped.get(p.type) ?? [];
      existing.push(p);
      grouped.set(p.type, existing);
    }
    return [...grouped.entries()];
  }, [plants, search]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!plantId) {
      setError("Pick a plant first.");
      return;
    }
    setSubmitting(true);
    const result = await createPlanting({
      plantId,
      spaceId,
      plantedDate,
      variety,
    });
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Label htmlFor="plant-search" className="text-sm font-medium">
          Plant
        </Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="plant-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the catalog"
            className="h-12 pl-11 text-base"
          />
        </div>
        <div
          role="radiogroup"
          aria-label="Plant catalog"
          className="max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-background/60"
        >
          {filteredPlants.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No catalog matches yet — try a different word.
            </p>
          ) : (
            filteredPlants.map(([type, group]) => (
              <fieldset key={type} className="border-b border-border/60 last:border-none">
                <legend className="block w-full px-4 pt-3 pb-1 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                  {type.replace("_", " ")}
                </legend>
                <ul className="px-2 pb-2">
                  {group.map((p) => {
                    const selected = plantId === p.id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setPlantId(p.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                            selected
                              ? "bg-foreground/[0.06] text-foreground"
                              : "text-foreground hover:bg-foreground/[0.03]",
                          )}
                        >
                          <span className="font-medium">{p.common_name}</span>
                          <PlantTypeBadge type={p.type} size="sm" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="planted-date" className="text-sm font-medium">
          Planted date
        </Label>
        <Input
          id="planted-date"
          type="date"
          value={plantedDate}
          onChange={(e) => setPlantedDate(e.target.value)}
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="variety" className="text-sm font-medium">
          Variety (optional)
        </Label>
        <Input
          id="variety"
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
          placeholder="Sungold, Lacinato, Cherokee Purple…"
          className="h-12 text-base"
        />
      </div>

      {spaces.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-foreground">
            Which space?
          </legend>
          <div className="flex flex-wrap gap-2">
            {spaces.map((s) => {
              const selected = spaceId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() =>
                    setSpaceId((cur) => (cur === s.id ? null : s.id))
                  }
                  className={cn(
                    "h-11 rounded-full border px-4 text-sm font-medium tracking-wide transition",
                    selected
                      ? "border-transparent text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                  style={
                    selected
                      ? {
                          backgroundColor:
                            "color-mix(in srgb, var(--type-leafy-green) 14%, #ffffff)",
                          borderColor:
                            "color-mix(in srgb, var(--type-leafy-green) 32%, transparent)",
                          boxShadow: "0 0 0 2px var(--ring)",
                        }
                      : undefined
                  }
                >
                  {s.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSpaceId(null)}
              aria-pressed={spaceId === null}
              className={cn(
                "h-11 rounded-full border border-dashed px-4 text-sm font-medium tracking-wide transition",
                spaceId === null
                  ? "border-foreground/50 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              Not assigned
            </button>
          </div>
        </fieldset>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting || !plantId}
        className="h-12 w-full rounded-full text-base"
      >
        {submitting ? "Adding…" : "Add planting"}
      </Button>
    </form>
  );
}
