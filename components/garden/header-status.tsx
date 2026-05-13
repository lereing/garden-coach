import {
  Cloud,
  CloudRain,
  Snowflake,
  Sun,
  ThermometerSun,
} from "lucide-react";
import { Sprout, Droplets } from "lucide-react";
import {
  weatherCodeToBucket,
  type CurrentWeather,
} from "@/lib/garden/weather";

type HeaderStatusProps = {
  city: string | null;
  weather: CurrentWeather | null;
  needsWaterCount: number;
  readyToHarvestCount: number;
  activeCount: number;
};

export function HeaderStatus({
  city,
  weather,
  needsWaterCount,
  readyToHarvestCount,
  activeCount,
}: HeaderStatusProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header
      className="card-surface flex flex-col gap-5 rounded-3xl p-5 sm:p-7"
      style={{
        background:
          "linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(--type-leafy-green) 6%, #ffffff) 100%)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Today
          </p>
          <p className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {today}
          </p>
          {city && (
            <p className="text-sm text-foreground/70">{city}</p>
          )}
        </div>
        {weather && <WeatherChip weather={weather} />}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AttentionPill
          tone={needsWaterCount > 0 ? "water" : "neutral"}
          icon={<Droplets className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />}
          label={
            needsWaterCount > 0
              ? `${needsWaterCount} need${needsWaterCount === 1 ? "s" : ""} water`
              : "All watered"
          }
        />
        <AttentionPill
          tone={readyToHarvestCount > 0 ? "harvest" : "neutral"}
          icon={<Sprout className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />}
          label={
            readyToHarvestCount > 0
              ? `${readyToHarvestCount} ready to harvest`
              : `${activeCount} growing`
          }
        />
      </div>
    </header>
  );
}

function WeatherChip({ weather }: { weather: CurrentWeather }) {
  const bucket = weatherCodeToBucket(weather.weatherCode);
  const Icon =
    bucket === "clear"
      ? Sun
      : bucket === "rain"
        ? CloudRain
        : bucket === "snow"
          ? Snowflake
          : Cloud;
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5"
      aria-label={`Current weather: ${weather.temperatureF}°F`}
    >
      <Icon
        className="h-4 w-4"
        style={{ color: "var(--type-vine)" }}
        strokeWidth={2.25}
        aria-hidden="true"
      />
      <ThermometerSun className="sr-only" aria-hidden="true" />
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {weather.temperatureF}°F
      </span>
    </div>
  );
}

type Tone = "neutral" | "water" | "harvest";

function AttentionPill({
  tone,
  icon,
  label,
}: {
  tone: Tone;
  icon: React.ReactNode;
  label: string;
}) {
  const tokens: Record<Tone, { bg: string; fg: string; border: string }> = {
    neutral: {
      bg: "var(--muted)",
      fg: "var(--foreground)",
      border: "var(--border)",
    },
    water: {
      bg: "color-mix(in srgb, var(--type-brassica) 16%, #ffffff)",
      fg: "color-mix(in srgb, var(--type-brassica) 35%, #1f2937)",
      border: "color-mix(in srgb, var(--type-brassica) 32%, transparent)",
    },
    harvest: {
      bg: "color-mix(in srgb, var(--type-leafy-green) 16%, #ffffff)",
      fg: "color-mix(in srgb, var(--type-leafy-green) 35%, #1f2937)",
      border: "color-mix(in srgb, var(--type-leafy-green) 32%, transparent)",
    },
  };
  const t = tokens[tone];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium tracking-wide"
      style={{ backgroundColor: t.bg, color: t.fg, borderColor: t.border }}
    >
      {icon}
      {label}
    </span>
  );
}
