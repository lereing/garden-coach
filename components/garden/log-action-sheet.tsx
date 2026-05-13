"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Bug, CloudRain, Sparkles, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils/cn";
import type { IssueType } from "@/app/(app)/home/actions";

// ---------------------------------------------------------------------
// Harvest sheet
// ---------------------------------------------------------------------

export type HarvestSubmit = {
  amountOz: number | null;
  notes: string | null;
  finished: boolean;
};

type HarvestSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantName: string;
  onSubmit: (input: HarvestSubmit) => Promise<void> | void;
};

export function HarvestSheet({
  open,
  onOpenChange,
  plantName,
  onSubmit,
}: HarvestSheetProps) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setNotes("");
      setFinished(false);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const parsed = parseFloat(amount);
    await onSubmit({
      amountOz: Number.isFinite(parsed) ? parsed : null,
      notes: notes.trim() || null,
      finished,
    });
    setSubmitting(false);
    onOpenChange(false);
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Log a harvest`}
      description={plantName}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="harvest-amount" className="text-sm font-medium">
            Amount harvested
          </Label>
          <div className="relative">
            <Input
              id="harvest-amount"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 pr-14 text-2xl tabular-nums"
              autoFocus
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              oz
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="harvest-notes" className="text-sm font-medium">
            Notes (optional)
          </Label>
          <textarea
            id="harvest-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="First pick, gorgeous color…"
            rows={2}
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-foreground/30"
          />
        </div>

        <YesNoToggle
          legend="Is this planting finished?"
          value={finished}
          onChange={setFinished}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-full text-base sm:w-auto sm:min-w-[160px]"
          >
            {submitting ? "Logging…" : "Log harvest"}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}

function YesNoToggle({
  legend,
  value,
  onChange,
}: {
  legend: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground">
        {legend}
      </legend>
      <div className="flex gap-2">
        {[
          { label: "Yes", val: true },
          { label: "No", val: false },
        ].map((opt) => {
          const selected = value === opt.val;
          return (
            <button
              key={opt.label}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.val)}
              className={cn(
                "h-11 flex-1 rounded-full border px-4 text-sm font-medium tracking-wide transition",
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
    </fieldset>
  );
}

// ---------------------------------------------------------------------
// Issue sheet
// ---------------------------------------------------------------------

type IssueChip = {
  label: string;
  type: IssueType;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const ISSUE_CHIPS: IssueChip[] = [
  { label: "Pest", type: "pest", icon: Bug },
  { label: "Disease", type: "observation", icon: Sparkles },
  { label: "Weather damage", type: "weather_event", icon: CloudRain },
  { label: "Slow growth", type: "observation", icon: Sprout },
];

export type IssueSubmit = {
  type: IssueType;
  notes: string;
  alsoAskCoach: boolean;
};

type IssueSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantName: string;
  onSubmit: (input: IssueSubmit) => Promise<void> | void;
};

export function IssueSheet({
  open,
  onOpenChange,
  plantName,
  onSubmit,
}: IssueSheetProps) {
  const [activeChip, setActiveChip] = useState<IssueChip | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState<"none" | "save" | "ask">("none");

  useEffect(() => {
    if (open) {
      setActiveChip(null);
      setNotes("");
      setSubmitting("none");
    }
  }, [open]);

  async function handleSave(alsoAskCoach: boolean) {
    if (!notes.trim()) return;
    setSubmitting(alsoAskCoach ? "ask" : "save");
    const type: IssueType = activeChip?.type ?? "observation";
    await onSubmit({ type, notes: notes.trim(), alsoAskCoach });
    setSubmitting("none");
    onOpenChange(false);
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Log an issue"
      description={plantName}
    >
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            What&rsquo;s going on? (optional)
          </legend>
          <div className="flex flex-wrap gap-2">
            {ISSUE_CHIPS.map((chip) => {
              const selected = activeChip?.label === chip.label;
              const Icon = chip.icon;
              return (
                <button
                  key={chip.label}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() =>
                    setActiveChip((cur) =>
                      cur?.label === chip.label ? null : chip,
                    )
                  }
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium tracking-wide transition",
                    selected
                      ? "border-transparent"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  )}
                  style={
                    selected
                      ? {
                          backgroundColor:
                            "color-mix(in srgb, var(--warning) 18%, #ffffff)",
                          color:
                            "color-mix(in srgb, var(--warning) 35%, #1f2937)",
                          borderColor:
                            "color-mix(in srgb, var(--warning) 32%, transparent)",
                        }
                      : undefined
                  }
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="issue-notes" className="text-sm font-medium">
            Describe what you&rsquo;re seeing
          </Label>
          <textarea
            id="issue-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Holes in the leaves, mostly on the lower ones…"
            rows={4}
            autoFocus
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-foreground/30"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={submitting !== "none" || !notes.trim()}
            onClick={() => handleSave(true)}
            className="h-12 rounded-full"
            title="Hooks into the coach in a later step"
          >
            {submitting === "ask" ? "Saving…" : "Save & ask the coach"}
          </Button>
          <Button
            type="button"
            disabled={submitting !== "none" || !notes.trim()}
            onClick={() => handleSave(false)}
            className="h-12 rounded-full"
          >
            {submitting === "save" ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
