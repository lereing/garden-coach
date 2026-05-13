import { cn } from "@/lib/utils/cn";

type ProgressIndicatorProps = {
  current: 1 | 2 | 3;
  total?: number;
};

export function ProgressIndicator({
  current,
  total = 3,
}: ProgressIndicatorProps) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div
      role="progressbar"
      aria-label={`Onboarding step ${current} of ${total}`}
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      className="flex items-center gap-2"
    >
      {steps.map((s) => {
        const isPast = s < current;
        const isActive = s === current;
        return (
          <span
            key={s}
            aria-hidden="true"
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              isActive ? "w-10" : "w-2",
            )}
            style={{
              backgroundColor: isActive || isPast
                ? "var(--type-leafy-green)"
                : "color-mix(in srgb, var(--type-leafy-green) 20%, transparent)",
            }}
          />
        );
      })}
      <span className="ml-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Step {current} / {total}
      </span>
    </div>
  );
}
