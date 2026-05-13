"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLocation } from "../_actions/save-location";
import { StickyActions } from "./sticky-actions";

export type LocationData = {
  zone: string;
  lastFrost: string;
  firstFrost: string;
  displayName: string;
  approximate?: boolean;
};

type Phase = "address" | "loading" | "reveal";

type LocationStepProps = {
  initialAddress: string | null;
  initialReveal: LocationData | null;
  onComplete: (data: LocationData) => void;
};

export function LocationStep({
  initialAddress,
  initialReveal,
  onComplete,
}: LocationStepProps) {
  const [phase, setPhase] = useState<Phase>(
    initialReveal ? "reveal" : "address",
  );
  const [address, setAddress] = useState(initialAddress ?? "");
  const [reveal, setReveal] = useState<LocationData | null>(initialReveal);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) {
      setError("Enter an address to continue.");
      return;
    }
    setError(null);
    setPhase("loading");
    const result = await saveLocation({ address: trimmed });
    if (!result.ok) {
      setError(result.error);
      setPhase("address");
      return;
    }
    setReveal({
      zone: result.data.zone,
      lastFrost: result.data.lastFrost,
      firstFrost: result.data.firstFrost,
      displayName: result.data.displayName,
      approximate: result.data.approximate,
    });
    setPhase("reveal");
  }

  if (phase === "reveal" && reveal) {
    return (
      <RevealPanel
        data={reveal}
        onContinue={() => onComplete(reveal)}
        onEdit={() => setPhase("address")}
      />
    );
  }

  const isLoading = phase === "loading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
          Where do you garden?
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          We use this to find your hardiness zone and frost dates. Just a
          city is fine to start; you can refine later.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <Label htmlFor="address" className="text-sm font-medium">
          Address or city
        </Label>
        <div className="relative">
          <MapPin
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="address"
            name="address"
            inputMode="text"
            autoComplete="street-address"
            autoFocus
            required
            placeholder="Brooklyn, NY"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isLoading}
            aria-invalid={!!error}
            aria-describedby={error ? "address-error" : undefined}
            className="h-14 pl-12 text-base"
          />
        </div>
        {error && (
          <p
            id="address-error"
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>

      <StickyActions>
        <div className="hidden sm:block sm:flex-1" />
        <Button
          type="submit"
          size="lg"
          disabled={isLoading || !address.trim()}
          className="h-12 w-full rounded-full text-base sm:w-auto sm:min-w-[160px]"
        >
          {isLoading ? "Looking up…" : "Continue"}
        </Button>
      </StickyActions>
    </form>
  );
}

function RevealPanel({
  data,
  onContinue,
  onEdit,
}: {
  data: LocationData;
  onContinue: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
          Here&rsquo;s your patch of earth
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {data.displayName}
        </p>
      </header>

      <div className="card-surface flex flex-col items-stretch gap-6 rounded-3xl p-6 text-center sm:p-10">
        <div
          className="fade-in-soft flex flex-col items-center gap-2"
          style={{ animationDelay: "0ms" } as CSSProperties}
        >
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            USDA Hardiness Zone
          </span>
          <div className="flex items-center gap-3">
            <Sparkles
              className="h-7 w-7"
              style={{ color: "var(--type-vine)" }}
              aria-hidden="true"
            />
            <span className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">
              {data.zone}
            </span>
          </div>
        </div>

        <hr className="border-border/60" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FrostStat
            label="Last frost"
            date={data.lastFrost}
            delayMs={200}
            color="var(--type-leafy-green)"
          />
          <FrostStat
            label="First frost"
            date={data.firstFrost}
            delayMs={400}
            color="var(--type-brassica)"
          />
        </div>

        {data.approximate && (
          <p className="text-xs text-muted-foreground">
            We couldn&rsquo;t find a USDA record for that postcode, so this
            is a latitude-based estimate. Edit your address if it looks
            off.
          </p>
        )}
      </div>

      <StickyActions>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Change address
        </button>
        <Button
          type="button"
          size="lg"
          onClick={onContinue}
          className="h-12 w-full rounded-full text-base sm:w-auto sm:min-w-[160px]"
        >
          Continue
        </Button>
      </StickyActions>
    </div>
  );
}

function FrostStat({
  label,
  date,
  delayMs,
  color,
}: {
  label: string;
  date: string;
  delayMs: number;
  color: string;
}) {
  return (
    <div
      className="fade-in-soft flex flex-col items-center gap-1"
      style={{ animationDelay: `${delayMs}ms` } as CSSProperties}
    >
      <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className="font-heading text-2xl font-semibold sm:text-3xl"
        style={{ color }}
      >
        {formatFrostDate(date)}
      </span>
    </div>
  );
}

function formatFrostDate(isoDate: string): string {
  // YYYY-MM-DD → "March 12". Render without year (frost dates are
  // approximate seasonal anchors, not specific calendar dates).
  const [, m, d] = isoDate.split("-").map((p) => parseInt(p, 10));
  if (!m || !d) return isoDate;
  const month = new Date(2000, m - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
  return `${month} ${d}`;
}
