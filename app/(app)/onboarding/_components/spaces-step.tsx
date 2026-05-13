"use client";

import { useState, type ChangeEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import type { Space, SpaceType } from "@/lib/types/database";
import { saveSpaces, type SpaceDraft } from "../_actions/save-spaces";
import { StickyActions } from "./sticky-actions";

type Unit = "in" | "ft";

type SpaceForm = {
  id: string; // local-only
  name: string;
  type: SpaceType;
  width: string;
  length: string;
  unit: Unit;
  sunlight: string;
};

const TYPE_OPTIONS: Array<{ value: SpaceType; label: string }> = [
  { value: "raised_bed", label: "Raised bed" },
  { value: "in_ground", label: "In-ground" },
  { value: "container", label: "Container" },
  { value: "vertical", label: "Vertical" },
];

function blankSpace(): SpaceForm {
  return {
    id: cryptoId(),
    name: "",
    type: "raised_bed",
    width: "",
    length: "",
    unit: "in",
    sunlight: "",
  };
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function spaceToForm(s: Space): SpaceForm {
  // DB stores inches; surface as inches in the form. User can flip to
  // feet if they prefer.
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    width: String(s.width_inches),
    length: String(s.length_inches),
    unit: "in",
    sunlight: s.sunlight_hours == null ? "" : String(s.sunlight_hours),
  };
}

function formToDraft(s: SpaceForm): SpaceDraft | null {
  const w = parseFloat(s.width);
  const l = parseFloat(s.length);
  const sun = s.sunlight.trim() === "" ? null : parseFloat(s.sunlight);
  if (!s.name.trim() || !Number.isFinite(w) || !Number.isFinite(l)) return null;
  const widthInches = s.unit === "ft" ? w * 12 : w;
  const lengthInches = s.unit === "ft" ? l * 12 : l;
  return {
    name: s.name.trim(),
    type: s.type,
    widthInches,
    lengthInches,
    sunlightHours: sun != null && Number.isFinite(sun) ? sun : null,
  };
}

type SpacesStepProps = {
  initialSpaces: Space[];
  onComplete: () => void;
  onBack: () => void;
};

export function SpacesStep({
  initialSpaces,
  onComplete,
  onBack,
}: SpacesStepProps) {
  const [spaces, setSpaces] = useState<SpaceForm[]>(() =>
    initialSpaces.length > 0 ? initialSpaces.map(spaceToForm) : [blankSpace()],
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(id: string, patch: Partial<SpaceForm>) {
    setSpaces((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  function remove(id: string) {
    setSpaces((prev) =>
      prev.length === 1 ? prev : prev.filter((s) => s.id !== id),
    );
  }

  function add() {
    setSpaces((prev) => [...prev, blankSpace()]);
  }

  async function handleSubmit() {
    setError(null);
    const drafts = spaces.map(formToDraft);
    if (drafts.some((d) => d === null)) {
      setError("Each space needs a name, width, and length.");
      return;
    }
    setSubmitting(true);
    const result = await saveSpaces({
      spaces: drafts.filter((d): d is SpaceDraft => d !== null),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onComplete();
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
          Where will things grow?
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Add every bed, container, or planter you&rsquo;ve got. Rough
          dimensions are fine — we just need a sense of the space.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {spaces.map((space, idx) => (
          <SpaceCard
            key={space.id}
            space={space}
            index={idx}
            canRemove={spaces.length > 1}
            onChange={(patch) => update(space.id, patch)}
            onRemove={() => remove(space.id)}
          />
        ))}
        <button
          type="button"
          onClick={add}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/50 px-4 py-4 text-sm font-medium text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add another space
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <StickyActions>
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="rounded-full"
        >
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
          className="h-12 w-full rounded-full text-base sm:w-auto sm:min-w-[160px]"
        >
          {submitting ? "Saving…" : "Continue"}
        </Button>
      </StickyActions>
    </div>
  );
}

function SpaceCard({
  space,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  space: SpaceForm;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<SpaceForm>) => void;
  onRemove: () => void;
}) {
  const onText =
    (key: keyof SpaceForm) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      onChange({ [key]: e.target.value });

  return (
    <article className="card-surface flex flex-col gap-5 rounded-3xl border border-border/60 p-5 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Space {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove space ${index + 1}`}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </header>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`name-${space.id}`}>Name</Label>
        <Input
          id={`name-${space.id}`}
          value={space.name}
          placeholder="Backyard raised bed"
          onChange={onText("name")}
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Type</Label>
        <div
          role="radiogroup"
          aria-label="Space type"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {TYPE_OPTIONS.map((opt) => {
            const selected = space.type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ type: opt.value })}
                className={cn(
                  "h-11 rounded-full border px-3 text-sm font-medium transition",
                  selected
                    ? "border-transparent text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
                style={
                  selected
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--type-leafy-green) 18%, #ffffff)",
                        borderColor:
                          "color-mix(in srgb, var(--type-leafy-green) 36%, transparent)",
                        boxShadow: "0 0 0 2px var(--ring)",
                      }
                    : undefined
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-3">
          <Label>Dimensions</Label>
          <UnitToggle
            unit={space.unit}
            onChange={(unit) => onChange({ unit })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            inputMode="decimal"
            placeholder="Width"
            value={space.width}
            onChange={onText("width")}
            aria-label={`Width in ${space.unit === "ft" ? "feet" : "inches"}`}
            className="h-11"
          />
          <Input
            inputMode="decimal"
            placeholder="Length"
            value={space.length}
            onChange={onText("length")}
            aria-label={`Length in ${space.unit === "ft" ? "feet" : "inches"}`}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`sun-${space.id}`}>Sunlight hours per day (optional)</Label>
        <Input
          id={`sun-${space.id}`}
          inputMode="decimal"
          placeholder="e.g. 6"
          value={space.sunlight}
          onChange={onText("sunlight")}
          className="h-11"
        />
      </div>
    </article>
  );
}

function UnitToggle({
  unit,
  onChange,
}: {
  unit: Unit;
  onChange: (u: Unit) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Measurement unit"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1 text-xs font-medium"
    >
      {(["in", "ft"] as const).map((u) => (
        <button
          key={u}
          type="button"
          role="radio"
          aria-checked={unit === u}
          onClick={() => onChange(u)}
          className={cn(
            "rounded-full px-3 py-1 transition",
            unit === u
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {u === "in" ? "inches" : "feet"}
        </button>
      ))}
    </div>
  );
}
