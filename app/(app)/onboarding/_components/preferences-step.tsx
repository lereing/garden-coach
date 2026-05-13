"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import type { ExperienceLevel, Preferences } from "@/lib/types/database";
import {
  savePreferences,
  type PreferencesDraft,
} from "../_actions/save-preferences";
import { StickyActions } from "./sticky-actions";

const SUGGESTED_LOVES = [
  "Tomatoes",
  "Basil",
  "Lettuce",
  "Peppers",
  "Kale",
  "Cucumbers",
  "Carrots",
  "Beans",
  "Squash",
  "Strawberries",
  "Herbs",
];

const SUGGESTED_DISLIKES = [
  "Eggplant",
  "Radish",
  "Beets",
  "Mustard greens",
  "Brussels sprouts",
];

const EXPERIENCE_OPTIONS: Array<{
  value: ExperienceLevel;
  label: string;
  hint: string;
}> = [
  {
    value: "first_year",
    label: "First year",
    hint: "New to all of this",
  },
  {
    value: "some_seasons",
    label: "A few seasons",
    hint: "I’ve grown a thing or two",
  },
  {
    value: "experienced",
    label: "Experienced",
    hint: "Comfortable in the dirt",
  },
];

const GOAL_OPTIONS = [
  { value: "self_reliance", label: "Self-reliance" },
  { value: "save_money", label: "Save money" },
  { value: "teach_kids", label: "Teach kids" },
  { value: "hobby", label: "Just for fun" },
  { value: "mental_health", label: "Clear my head" },
  { value: "other", label: "Other" },
];

type PreferencesStepProps = {
  initialPreferences: Preferences | null;
  onBack: () => void;
};

export function PreferencesStep({
  initialPreferences,
  onBack,
}: PreferencesStepProps) {
  const router = useRouter();
  const [loves, setLoves] = useState<string[]>(
    initialPreferences?.loves_eating ?? [],
  );
  const [dislikes, setDislikes] = useState<string[]>(
    initialPreferences?.dislikes ?? [],
  );
  const [alreadyHave, setAlreadyHave] = useState<string>(
    initialPreferences?.already_have?.[0] ?? "",
  );
  const [experience, setExperience] = useState<ExperienceLevel | null>(
    initialPreferences?.experience_level ?? null,
  );
  const [goals, setGoals] = useState<string[]>(
    initialPreferences?.goals ?? [],
  );

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setSubmitting(true);
    setError(null);
    const draft: PreferencesDraft = {
      lovesEating: loves,
      dislikes,
      alreadyHave,
      experienceLevel: experience,
      goals,
    };
    const result = await savePreferences(draft);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    // Server has flagged onboarding_completed_at; navigate to /home.
    // refresh() ensures middleware sees the new state on the new route.
    router.replace("/home");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10" noValidate>
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
          Tell me a bit about you
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          The coach uses this to suggest things you&rsquo;ll actually eat
          and tasks at the right level. Skip anything you&rsquo;re not sure
          about.
        </p>
      </header>

      <ChipsField
        legend="What do you love eating?"
        suggestions={SUGGESTED_LOVES}
        selected={loves}
        onChange={setLoves}
        addPlaceholder="Add another favorite"
        emptyHint="Pick a few or add your own."
      />

      <ChipsField
        legend="Anything you don't want to grow?"
        suggestions={SUGGESTED_DISLIKES}
        selected={dislikes}
        onChange={setDislikes}
        addPlaceholder="Add a dealbreaker"
        emptyHint="Totally optional."
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="already-have">
          Anything you already have on hand?
        </Label>
        <textarea
          id="already-have"
          placeholder="Seeds from my neighbor, two tomato seedlings from the nursery…"
          value={alreadyHave}
          onChange={(e) => setAlreadyHave(e.target.value)}
          rows={3}
          className="min-h-[88px] w-full rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-foreground/30"
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-base font-medium text-foreground">
          What&rsquo;s your experience level?
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {EXPERIENCE_OPTIONS.map((opt) => {
            const selected = experience === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setExperience(opt.value)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition",
                  selected
                    ? "border-transparent"
                    : "border-border bg-background hover:border-foreground/30",
                )}
                style={
                  selected
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--type-leafy-green) 14%, #ffffff)",
                        borderColor:
                          "color-mix(in srgb, var(--type-leafy-green) 36%, transparent)",
                        boxShadow: "0 0 0 2px var(--ring)",
                      }
                    : undefined
                }
              >
                <span className="text-sm font-semibold text-foreground">
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {opt.hint}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-base font-medium text-foreground">
          Why are you growing?
        </legend>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => {
            const selected = goals.includes(g.value);
            return (
              <SelectableChip
                key={g.value}
                label={g.label}
                selected={selected}
                onToggle={() =>
                  setGoals((cur) =>
                    cur.includes(g.value)
                      ? cur.filter((v) => v !== g.value)
                      : [...cur, g.value],
                  )
                }
              />
            );
          })}
        </div>
      </fieldset>

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
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-12 w-full rounded-full text-base sm:w-auto sm:min-w-[160px]"
        >
          {submitting ? "Saving…" : "Finish"}
        </Button>
      </StickyActions>
    </form>
  );
}

function ChipsField({
  legend,
  suggestions,
  selected,
  onChange,
  addPlaceholder,
  emptyHint,
}: {
  legend: string;
  suggestions: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  addPlaceholder: string;
  emptyHint: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  // Merge custom entries (not in suggestions) into the display list.
  const customChips = selected.filter(
    (s) => !suggestions.some((sug) => sug.toLowerCase() === s.toLowerCase()),
  );
  const allChips = [...suggestions, ...customChips];

  function toggle(value: string) {
    onChange(
      selected.some((v) => v.toLowerCase() === value.toLowerCase())
        ? selected.filter((v) => v.toLowerCase() !== value.toLowerCase())
        : [...selected, value],
    );
  }

  function commitDraft() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    if (
      !selected.some((v) => v.toLowerCase() === trimmed.toLowerCase())
    ) {
      onChange([...selected, trimmed]);
    }
    setDraft("");
    setAdding(false);
  }

  function onAddKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Escape") {
      setDraft("");
      setAdding(false);
    }
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-base font-medium text-foreground">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {allChips.map((label) => (
          <SelectableChip
            key={label}
            label={label}
            selected={selected.some(
              (v) => v.toLowerCase() === label.toLowerCase(),
            )}
            onToggle={() => toggle(label)}
          />
        ))}
        {adding ? (
          <span className="inline-flex items-center gap-2">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onAddKeyDown}
              onBlur={commitDraft}
              placeholder={addPlaceholder}
              className="h-9 w-44 text-sm"
            />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add your own
          </button>
        )}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      )}
    </fieldset>
  );
}

function SelectableChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "h-9 rounded-full border px-3 text-sm font-medium tracking-wide transition",
        selected
          ? "border-transparent"
          : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground",
      )}
      style={
        selected
          ? {
              backgroundColor:
                "color-mix(in srgb, var(--type-leafy-green) 18%, #ffffff)",
              color:
                "color-mix(in srgb, var(--type-leafy-green) 30%, #1f2937)",
              borderColor:
                "color-mix(in srgb, var(--type-leafy-green) 36%, transparent)",
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}
