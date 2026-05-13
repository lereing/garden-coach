import { cn } from "@/lib/utils/cn";
import { PLANT_TYPE_META, type PlantType } from "@/lib/garden/plant-types";

type Size = "sm" | "md";

type PlantTypeBadgeProps = {
  type: PlantType;
  size?: Size;
  className?: string;
};

const SIZE_STYLES: Record<
  Size,
  { container: string; icon: string }
> = {
  sm: {
    // 24px height, 8px horizontal pad, 4px gap, 12px text
    container: "h-6 gap-1 px-2 text-xs",
    icon: "h-3 w-3",
  },
  md: {
    // 32px height, 12px horizontal pad, 8px gap, 14px text
    container: "h-8 gap-2 px-3 text-sm",
    icon: "h-4 w-4",
  },
};

export function PlantTypeBadge({
  type,
  size = "md",
  className,
}: PlantTypeBadgeProps) {
  const meta = PLANT_TYPE_META[type];
  const Icon = meta.icon;
  const sizes = SIZE_STYLES[size];

  return (
    <span
      role="img"
      aria-label={`${meta.label} type`}
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        "border tracking-wide whitespace-nowrap",
        sizes.container,
        className,
      )}
      style={{
        // 14% tint background — soft surface, retains the type's hue.
        backgroundColor: `color-mix(in srgb, var(${meta.cssVar}) 14%, #ffffff)`,
        // 30% type + 70% ink — darker than the badge, guarantees AA 4.5:1+
        // contrast on the tinted surface for every type in the palette.
        color: `color-mix(in srgb, var(${meta.cssVar}) 30%, #1f2937)`,
        borderColor: `color-mix(in srgb, var(${meta.cssVar}) 28%, transparent)`,
      }}
    >
      <Icon className={sizes.icon} strokeWidth={2.25} aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}
