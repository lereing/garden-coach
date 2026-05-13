"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GardenBed } from "@/components/garden/garden-bed";
import { PlantTile } from "@/components/garden/plant-tile";
import { cn } from "@/lib/utils/cn";
import {
  PLANT_TYPES,
  PLANT_TYPE_META,
  type PlantType,
} from "@/lib/garden/plant-types";

type TileState = { type: PlantType; name?: string } | null;

const COLS = 4;
const ROWS = 3;
const TILE_COUNT = COLS * ROWS;

export function GardenBedDemo() {
  const [tiles, setTiles] = useState<TileState[]>(() =>
    Array(TILE_COUNT).fill(null),
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [pickerType, setPickerType] = useState<PlantType | null>(null);
  const [pickerName, setPickerName] = useState("");
  const titleId = useId();
  const nameId = useId();
  const nameHintId = useId();

  // Escape closes the picker.
  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePicker();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  function openPicker(idx: number) {
    const existing = tiles[idx];
    setActiveIdx((cur) => (cur === idx ? null : idx));
    if (existing) {
      setPickerType(existing.type);
      setPickerName(existing.name ?? PLANT_TYPE_META[existing.type].label);
    } else {
      setPickerType(null);
      setPickerName("");
    }
  }

  function closePicker() {
    setActiveIdx(null);
    setPickerType(null);
    setPickerName("");
  }

  function selectType(t: PlantType) {
    setPickerType(t);
    // Seed the name field with the type label if it's empty — a sensible
    // starting point. Once the user types anything, we leave it alone.
    if (pickerName === "") {
      setPickerName(PLANT_TYPE_META[t].label);
    }
  }

  function commitPlant(e?: FormEvent) {
    e?.preventDefault();
    if (activeIdx === null || !pickerType) return;
    const trimmed = pickerName.trim();
    setTiles((prev) => {
      const next = [...prev];
      next[activeIdx] = {
        type: pickerType,
        name: trimmed || undefined,
      };
      return next;
    });
    closePicker();
  }

  function clearActive() {
    if (activeIdx === null) return;
    setTiles((prev) => {
      const next = [...prev];
      next[activeIdx] = null;
      return next;
    });
    closePicker();
  }

  function resetAll() {
    setTiles(Array(TILE_COUNT).fill(null));
    closePicker();
  }

  const activeTile = activeIdx !== null ? tiles[activeIdx] : null;
  const isEditing = activeTile !== null;
  const filledCount = tiles.filter((t) => t !== null).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <p className="text-sm text-muted-foreground sm:text-base">
          Tap a tile to plant something.{" "}
          <span className="font-mono text-xs tabular-nums">
            {filledCount} / {TILE_COUNT} planted
          </span>
        </p>
        {filledCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="rounded-full"
          >
            Reset bed
          </Button>
        )}
      </div>

      <GardenBed shape="raised" label="Interactive raised bed">
        <div
          role="grid"
          aria-label={`Raised bed grid, ${ROWS} rows by ${COLS} columns`}
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {tiles.map((tile, idx) => {
            const row = Math.floor(idx / COLS) + 1;
            const col = (idx % COLS) + 1;
            const positionLabel = `row ${row}, column ${col}`;
            const tileName = tile?.name;
            return (
              <div role="gridcell" key={idx}>
                <PlantTile
                  planted={tile ?? undefined}
                  selected={activeIdx === idx}
                  size="md"
                  ariaLabel={
                    tile
                      ? `${PLANT_TYPE_META[tile.type].label}${
                          tileName ? `: ${tileName}` : ""
                        } at ${positionLabel}. Press to change or remove.`
                      : `Empty plot at ${positionLabel}. Press to plant.`
                  }
                  onClick={() => openPicker(idx)}
                />
              </div>
            );
          })}
        </div>
      </GardenBed>

      {activeIdx !== null && (
        <form
          role="dialog"
          aria-labelledby={titleId}
          onSubmit={commitPlant}
          className="card-surface flex flex-col gap-6 rounded-2xl p-5 sm:p-6"
        >
          <header className="flex items-baseline justify-between gap-3">
            <p
              id={titleId}
              className="font-mono text-xs tracking-widest text-muted-foreground uppercase"
            >
              {isEditing ? "Change plant" : "Plant something here"}
            </p>
            <button
              type="button"
              onClick={closePicker}
              aria-label="Close plant picker"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-foreground">
              Type
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLANT_TYPES.map((type) => {
                const meta = PLANT_TYPE_META[type];
                const Icon = meta.icon;
                const isCurrent = pickerType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => selectType(type)}
                    aria-label={`${meta.label} type`}
                    aria-pressed={isCurrent}
                    className={cn(
                      "flex h-12 items-center gap-2 rounded-full border px-4 text-sm font-medium tracking-wide",
                      "transition hover:-translate-y-0.5 active:translate-y-0",
                      "motion-reduce:transform-none motion-reduce:transition-none",
                    )}
                    style={{
                      backgroundColor: `color-mix(in srgb, var(${meta.cssVar}) 14%, #ffffff)`,
                      color: `color-mix(in srgb, var(${meta.cssVar}) 30%, #1f2937)`,
                      borderColor: `color-mix(in srgb, var(${meta.cssVar}) 28%, transparent)`,
                      boxShadow: isCurrent
                        ? "0 0 0 3px var(--ring)"
                        : undefined,
                    }}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      strokeWidth={2.25}
                      aria-hidden="true"
                    />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor={nameId} className="text-sm font-medium">
              Name
            </Label>
            <Input
              id={nameId}
              value={pickerName}
              onChange={(e) => setPickerName(e.target.value)}
              placeholder="e.g. Sungold cherry tomato"
              aria-describedby={nameHintId}
              autoComplete="off"
            />
            <p id={nameHintId} className="text-xs text-muted-foreground">
              Helps you tell similar plants apart later. Leave blank for an
              unnamed plot.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearActive}
                className="rounded-full text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closePicker}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!pickerType}
              className="rounded-full"
            >
              {isEditing ? "Save" : "Plant it"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
