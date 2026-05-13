import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { PLANT_TYPE_META, type PlantType } from "@/lib/garden/plant-types";
import { PlantTypeBadge } from "@/components/ui/plant-type-badge";

type PlantCardProps = {
  name: string;
  type: PlantType;
  image?: string;
  imageAlt?: string;
  /** Optional secondary line, e.g. cultivar or short tagline. */
  subtitle?: string;
  className?: string;
  /** Lift + shadow on hover/focus. Pair with an inner <Link> or <button>
   * to make the card keyboard-accessible. */
  interactive?: boolean;
};

export function PlantCard({
  name,
  type,
  image,
  imageAlt,
  subtitle,
  className,
  interactive = true,
}: PlantCardProps) {
  const meta = PLANT_TYPE_META[type];
  const Icon = meta.icon;

  const surfaceStyle = {
    background: `linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(${meta.cssVar}) 6%, #ffffff) 100%)`,
  };

  return (
    <article
      className={cn(
        interactive ? "card-surface-interactive" : "card-surface",
        "relative flex flex-col overflow-hidden rounded-3xl",
        "border border-border/60",
        className,
      )}
      style={surfaceStyle}
    >
      <div
        aria-hidden="true"
        className="relative h-32 w-full overflow-hidden sm:h-40"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, var(${meta.cssVar}) 22%, #ffffff) 0%, color-mix(in srgb, var(${meta.cssVar}) 8%, #ffffff) 100%)`,
        }}
      >
        {image ? (
          <Image
            src={image}
            alt={imageAlt ?? ""}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon
              className="h-12 w-12 opacity-50 sm:h-16 sm:w-16"
              style={{ color: `var(${meta.cssVar})` }}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <PlantTypeBadge type={type} size="sm" />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-6">
        <h3 className="font-heading text-lg leading-tight font-semibold text-foreground sm:text-xl">
          {name}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
    </article>
  );
}
