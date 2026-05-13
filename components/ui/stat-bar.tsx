"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

type StatBarProps = {
  label: string;
  value: number;
  max?: number;
  /** A CSS color (hex, var(...), color-mix(...)). Defaults to brand primary. */
  color?: string;
  /** Hide the numeric readout on the right. */
  hideValue?: boolean;
  /** Optional override for the value displayed (e.g. "45 days" instead of "45"). */
  displayValue?: string;
  className?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function StatBar({
  label,
  value,
  max = 100,
  color,
  hideValue = false,
  displayValue,
  className,
}: StatBarProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const target = (clamped / max) * 100;

  // SSR-safe mount animation. Render at 0% on first paint, then flip
  // to target on the next frame so the CSS transition fires.
  // For users who prefer reduced motion, jump straight to target.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setWidth(target);
      return;
    }
    const handle = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(handle);
  }, [target]);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase sm:text-sm">
          {label}
        </span>
        {!hideValue && (
          <span
            aria-hidden="true"
            className="font-mono text-xs font-medium text-foreground/80 tabular-nums sm:text-sm"
          >
            {displayValue ?? `${Math.round(clamped)}`}
          </span>
        )}
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-valuetext={displayValue}
        className="stat-track relative h-3 w-full overflow-hidden rounded-full"
      >
        <div
          className="stat-fill h-full rounded-full"
          style={{ width: `${width}%`, "--stat-color": color } as CSSProperties}
        />
      </div>
    </div>
  );
}
