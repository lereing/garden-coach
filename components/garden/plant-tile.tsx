import type { CSSProperties } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  PLANT_TYPE_META,
  type PlantType,
} from "@/lib/garden/plant-types";

export type PlantTileSize = "sm" | "md" | "lg";

type Base = {
  size?: PlantTileSize;
  selected?: boolean;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

export type PlantTileProps =
  | (Base & { planted?: undefined })
  | (Base & { planted: { type: PlantType; name?: string } });

const SIZE: Record<
  PlantTileSize,
  { box: string; icon: string; caption: string; wrapper: string }
> = {
  sm: {
    box: "h-14 w-14",
    icon: "h-5 w-5",
    caption: "text-[11px]",
    wrapper: "w-14",
  },
  md: {
    box: "h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24",
    icon: "h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8",
    caption: "text-xs sm:text-sm",
    wrapper: "w-16 sm:w-20 lg:w-24",
  },
  lg: {
    box: "h-24 w-24 sm:h-32 sm:w-32 lg:h-36 lg:w-36",
    icon: "h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14",
    caption: "text-sm sm:text-base",
    wrapper: "w-24 sm:w-32 lg:w-36",
  },
};

export function PlantTile(props: PlantTileProps) {
  const { size = "md", selected, className, onClick, ariaLabel } = props;
  const sizes = SIZE[size];
  const isInteractive = typeof onClick === "function";

  const tileClass = cn(
    "relative grid place-items-center rounded-2xl border transition",
    sizes.box,
    isInteractive &&
      "cursor-pointer hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none",
    className,
  );

  // 3px ring around the tile to mark it as "currently being edited".
  // Painted with box-shadow so it stacks with the tile's own shadow.
  const selectedRing = selected ? "0 0 0 3px var(--ring), " : "";

  const planted = props.planted;
  const hasCaption = !!planted?.name;

  // Build the tile element (interactive or static).
  let tile: React.ReactNode;

  if (planted) {
    const meta = PLANT_TYPE_META[planted.type];
    const Icon = meta.icon;
    const style: CSSProperties = {
      backgroundColor: `color-mix(in srgb, var(${meta.cssVar}) 22%, #ffffff)`,
      borderColor: `color-mix(in srgb, var(${meta.cssVar}) 40%, transparent)`,
      boxShadow: `${selectedRing}inset 0 -2px 0 rgb(0 0 0 / 0.06), 0 2px 4px rgb(16 24 40 / 0.08)`,
    };
    const label =
      ariaLabel ??
      `${meta.label}${planted.name ? `: ${planted.name}` : ""}${
        isInteractive ? ". Press to change." : ""
      }`;
    const content = (
      <Icon
        className={sizes.icon}
        strokeWidth={2}
        style={{
          color: `color-mix(in srgb, var(${meta.cssVar}) 50%, #1f2937)`,
        }}
        aria-hidden="true"
      />
    );
    tile = isInteractive ? (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={selected}
        className={tileClass}
        style={style}
      >
        {content}
      </button>
    ) : (
      <div className={tileClass} role="img" aria-label={label} style={style}>
        {content}
      </div>
    );
  } else {
    const emptyStyle: CSSProperties = {
      backgroundColor: "rgb(255 255 255 / 0.08)",
      borderColor: "rgb(255 255 255 / 0.22)",
      borderStyle: "dashed",
      boxShadow: `${selectedRing}inset 0 2px 4px rgb(0 0 0 / 0.18)`,
    };
    const emptyLabel = ariaLabel ?? "Empty plot. Press to plant.";

    tile = isInteractive ? (
      <button
        type="button"
        onClick={onClick}
        aria-label={emptyLabel}
        aria-pressed={selected}
        className={cn(tileClass, "hover:border-white/40 hover:bg-white/[0.14]")}
        style={emptyStyle}
      >
        <Plus
          className={cn(sizes.icon, "text-white/65")}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </button>
    ) : (
      <div
        className={tileClass}
        role="img"
        aria-label={emptyLabel}
        style={emptyStyle}
      />
    );
  }

  // Wrap every tile in a column container sized exactly to the tile width
  // and centered in its grid cell. Caption (when present) sits flush-left
  // under the tile so the first character aligns with the tile's left edge.
  return (
    <div
      className={cn(
        "mx-auto flex flex-col items-stretch gap-1.5",
        sizes.wrapper,
      )}
    >
      {tile}
      {hasCaption && (
        <span
          title={planted?.name}
          className={cn(
            "block w-full truncate text-left font-medium text-white/90",
            sizes.caption,
          )}
        >
          {planted?.name}
        </span>
      )}
    </div>
  );
}
