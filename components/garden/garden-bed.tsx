import { cn } from "@/lib/utils/cn";

export type GardenBedShape = "in_ground" | "raised" | "container";

type GardenBedProps = {
  shape: GardenBedShape;
  label?: string;
  children: React.ReactNode;
  className?: string;
};

export function GardenBed({
  shape,
  label,
  children,
  className,
}: GardenBedProps) {
  if (shape === "raised") {
    return (
      <section
        aria-label={label ?? "Raised garden bed"}
        className={cn("relative", className)}
      >
        <div
          className="rounded-3xl p-3 sm:p-4 lg:p-5"
          style={{
            background:
              "linear-gradient(180deg, #d0a87c 0%, #a98664 100%)",
            boxShadow:
              "inset 0 1px 0 rgb(255 255 255 / 0.4), 0 1px 2px rgb(0 0 0 / 0.08), 0 12px 28px -10px rgb(16 24 40 / 0.22)",
          }}
        >
          <div
            className="rounded-2xl p-3 sm:p-4"
            style={{
              background:
                "radial-gradient(120% 100% at 30% 0%, #7a583c 0%, #543d23 80%)",
              boxShadow:
                "inset 0 4px 10px rgb(0 0 0 / 0.32), inset 0 -2px 4px rgb(0 0 0 / 0.18)",
            }}
          >
            {children}
          </div>
        </div>
      </section>
    );
  }

  if (shape === "in_ground") {
    return (
      <section
        aria-label={label ?? "In-ground bed"}
        className={cn(
          "relative overflow-hidden rounded-3xl p-4 sm:p-6",
          className,
        )}
        style={{
          background:
            "radial-gradient(120% 100% at 30% 0%, #8a6845 0%, #604730 80%)",
          boxShadow:
            "inset 0 4px 12px rgb(0 0 0 / 0.28), inset 0 -2px 0 rgb(255 255 255 / 0.06), 0 1px 2px rgb(0 0 0 / 0.06)",
        }}
      >
        {children}
      </section>
    );
  }

  // container
  return (
    <section
      aria-label={label ?? "Container pot"}
      className={cn("inline-block", className)}
    >
      <div
        className="grid h-44 w-44 place-items-center rounded-full p-4 sm:h-56 sm:w-56 sm:p-6 lg:h-64 lg:w-64 lg:p-8"
        style={{
          background:
            "linear-gradient(180deg, #C77B3F 0%, #9A5F2F 70%, #7d4a22 100%)",
          boxShadow:
            "inset 0 2px 0 rgb(255 255 255 / 0.28), 0 1px 2px rgb(0 0 0 / 0.08), 0 12px 28px -8px rgb(16 24 40 / 0.28)",
        }}
      >
        <div
          className="grid h-full w-full place-items-center rounded-full"
          style={{
            background:
              "radial-gradient(circle, #5a4128 0%, #3d2a18 80%)",
            boxShadow: "inset 0 6px 12px rgb(0 0 0 / 0.5)",
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
