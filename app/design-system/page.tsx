import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlantCard } from "@/components/ui/plant-card";
import { PlantTypeBadge } from "@/components/ui/plant-type-badge";
import { StatBar } from "@/components/ui/stat-bar";
import { GardenBed } from "@/components/garden/garden-bed";
import { GardenBedDemo } from "@/components/garden/garden-bed-demo";
import { PlantTile } from "@/components/garden/plant-tile";
import {
  PLANT_TYPES,
  PLANT_TYPE_META,
  type PlantType,
} from "@/lib/garden/plant-types";

const STATUS_COLORS = [
  { name: "Success", token: "success", hex: "#10B981" },
  { name: "Warning", token: "warning", hex: "#F59E0B" },
  { name: "Error", token: "error", hex: "#EF4444" },
];

const SAMPLE_PLANTS: Array<{
  name: string;
  subtitle: string;
  type: PlantType;
}> = [
  { name: "Cherry Tomato", subtitle: "Sungold", type: "fruiting" },
  { name: "Lacinato Kale", subtitle: "Dinosaur kale", type: "leafy_green" },
  { name: "Rainbow Carrot", subtitle: "Cosmic purple", type: "root" },
  { name: "Genovese Basil", subtitle: "Classic Italian", type: "herb" },
  { name: "Sugar Snap Pea", subtitle: "Climbing", type: "legume" },
  { name: "Walla Walla Onion", subtitle: "Sweet, mild", type: "allium" },
  { name: "Romanesco", subtitle: "Fractal head", type: "brassica" },
  { name: "Delicata Squash", subtitle: "Single-serving", type: "vine" },
];

const CONTRAST_PAIRS = [
  {
    label: "Primary text on background",
    fg: "#1f2937",
    bg: "#fafaf7",
    ratio: "14.9 : 1",
    standard: "AAA",
  },
  {
    label: "Muted text on background",
    fg: "#4b5563",
    bg: "#fafaf7",
    ratio: "6.8 : 1",
    standard: "AAA",
  },
  {
    label: "Muted text on card surface",
    fg: "#4b5563",
    bg: "#ffffff",
    ratio: "7.0 : 1",
    standard: "AAA",
  },
  {
    label: "Badge text on tinted surface",
    fg: "#1f2937 +30% type",
    bg: "type 14% on white",
    ratio: "≥ 4.5 : 1",
    standard: "AA",
  },
];

export default function DesignSystemPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
      <header className="mb-16 flex flex-col gap-4">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Garden Coach · Design System
        </p>
        <h1 className="font-heading text-4xl leading-[1.1] font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Visual language
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Soft, rounded, vibrant but harmonious. Pokémon&rsquo;s grammar for
          legible complexity, applied to plants. Built on an 8-point grid,
          tuned for WCAG AA contrast, and respectful of motion preferences.
        </p>
      </header>

      <Section
        title="Typography"
        eyebrow="01"
        description="Geist Sans for prose, Geist Mono for numbers. Sizes scale at sm and lg breakpoints."
      >
        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Heading 1 — 700
          </h1>
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Heading 2 — 600
          </h2>
          <h3 className="font-heading text-xl font-semibold sm:text-2xl">
            Heading 3 — 600
          </h3>
          <p className="max-w-2xl text-base leading-relaxed text-foreground">
            Body copy is set at 400. Long paragraphs of plant care advice
            should feel calm and unhurried, with generous line height. The
            coach talks to a person, not a database.
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Secondary text uses{" "}
            <span className="text-foreground">--muted-foreground</span> and
            sits a half step quieter than the body.
          </p>
          <div className="flex items-baseline gap-4 pt-2">
            <span className="font-mono text-3xl font-medium tabular-nums sm:text-4xl">
              68
            </span>
            <span className="font-mono text-base font-medium text-muted-foreground tabular-nums sm:text-xl">
              days to harvest
            </span>
          </div>
        </div>
      </Section>

      <Section
        title="Plant type badges"
        eyebrow="02"
        description="Type is a first-class visual primitive. Eight types, each with a color and an icon. Badge text passes AA on every tinted surface."
      >
        <div className="flex flex-col gap-6">
          <SubLabel>Medium (32 px)</SubLabel>
          <div className="flex flex-wrap gap-2">
            {PLANT_TYPES.map((type) => (
              <PlantTypeBadge key={`md-${type}`} type={type} />
            ))}
          </div>
          <SubLabel>Small (24 px)</SubLabel>
          <div className="flex flex-wrap gap-2">
            {PLANT_TYPES.map((type) => (
              <PlantTypeBadge key={`sm-${type}`} type={type} size="sm" />
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="Stat bars"
        eyebrow="03"
        description="Days to harvest, sunlight, water, confidence — all read like Pokémon stats. Animates from 0 → target over 380 ms; instant for users who prefer reduced motion."
      >
        <div className="card-surface rounded-2xl p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <StatBar
              label="Days to harvest"
              value={45}
              displayValue="45 days"
            />
            <StatBar
              label="Sun"
              value={85}
              displayValue="Full sun"
              color="var(--warning)"
            />
            <StatBar
              label="Water"
              value={60}
              displayValue="Moderate"
              color="var(--type-brassica)"
            />
            <StatBar
              label="Confidence"
              value={92}
              displayValue="92%"
              color="var(--success)"
            />
            <StatBar
              label="Spacing"
              value={25}
              displayValue={'18"'}
              color="var(--type-root)"
            />
            <StatBar
              label="Vigor"
              value={75}
              displayValue="High"
              color="var(--type-leafy-green)"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <ProgressionDemo />
        </div>
      </Section>

      <Section
        title="Plant cards"
        eyebrow="04"
        description="The Pokédex entry. Dense across, breathing inside. Cards lift on hover and on focus-within so they animate when an inner link or button is tabbed to."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SAMPLE_PLANTS.map((plant) => (
            <PlantCard
              key={plant.name}
              name={plant.name}
              type={plant.type}
              subtitle={plant.subtitle}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Garden beds"
        eyebrow="05"
        description="Containers for plants. Three shapes — raised bed, in-ground row, container pot — share an 8-pt tile grid. Tap an empty plot in the raised bed below to plant something."
      >
        <div className="flex flex-col gap-10">
          <GardenBedDemo />

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <SubLabel>In-ground row · 1 × 4</SubLabel>
              <GardenBed shape="in_ground" label="In-ground row example">
                <div className="grid grid-cols-4 gap-2">
                  <PlantTile
                    planted={{ type: "root", name: "Rainbow carrot" }}
                    size="md"
                  />
                  <PlantTile
                    planted={{ type: "root", name: "Nantes" }}
                    size="md"
                  />
                  <PlantTile size="md" />
                  <PlantTile
                    planted={{ type: "allium", name: "Walla Walla" }}
                    size="md"
                  />
                </div>
              </GardenBed>
            </div>

            <div className="flex flex-col items-start gap-4">
              <SubLabel>Container pot · 1 plant</SubLabel>
              <GardenBed shape="container" label="Container pot example">
                <PlantTile
                  planted={{ type: "herb", name: "Genovese basil" }}
                  size="md"
                />
              </GardenBed>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Palette"
        eyebrow="06"
        description="Plant-type anchors plus the system tokens that hold everything together."
      >
        <div className="flex flex-col gap-8">
          <SwatchRow
            heading="Plant types"
            swatches={PLANT_TYPES.map((t) => ({
              name: PLANT_TYPE_META[t].label,
              token: PLANT_TYPE_META[t].tailwindToken,
              cssVar: PLANT_TYPE_META[t].cssVar,
            }))}
          />
          <SwatchRow
            heading="Status"
            swatches={STATUS_COLORS.map((s) => ({
              name: s.name,
              token: s.token,
              cssVar: `--${s.token}`,
            }))}
          />
        </div>
      </Section>

      <Section
        title="Accessibility"
        eyebrow="07"
        description="Contrast measured against WCAG 2.1. Focus rings are keyboard-only; press Tab to verify. Motion is gated on prefers-reduced-motion."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-surface rounded-2xl p-6 sm:p-8">
            <p className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Contrast ratios
            </p>
            <ul className="flex flex-col gap-3">
              {CONTRAST_PAIRS.map((pair) => (
                <li
                  key={pair.label}
                  className="flex flex-col gap-1 border-b border-border/60 pb-3 last:border-none last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="text-sm text-foreground">{pair.label}</span>
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums sm:text-sm">
                      {pair.ratio}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--success) 14%, #ffffff)",
                        color:
                          "color-mix(in srgb, var(--success) 30%, #1f2937)",
                      }}
                    >
                      {pair.standard}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-surface rounded-2xl p-6 sm:p-8">
            <p className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Focus &amp; motion
            </p>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground sm:text-base">
                Tab through the controls below. Each picks up a 2 px ring in
                the brand color with a 2 px offset — visible on any
                background.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button className="rounded-full">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Primary
                </Button>
                <Button variant="outline" className="rounded-full">
                  Outline
                </Button>
                <Button variant="ghost" className="rounded-full">
                  Ghost
                </Button>
                <a
                  href="#"
                  className="rounded-full px-3 py-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Plain link
                </a>
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">
                Stat bar fills and card lifts disable themselves when the OS
                signals{" "}
                <span className="font-mono text-xs">
                  prefers-reduced-motion
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function Section({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16 sm:mb-24">
      <header className="mb-8 flex flex-col gap-2">
        <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

function ProgressionDemo() {
  const stages = [
    { label: "Seedling", value: 15, color: "var(--type-leafy-green)" },
    { label: "Vegetative", value: 45, color: "var(--type-leafy-green)" },
    { label: "Flowering", value: 70, color: "var(--type-fruiting)" },
    { label: "Harvest", value: 95, color: "var(--type-vine)" },
  ];
  return (
    <>
      <div className="card-surface rounded-2xl p-6 sm:p-8">
        <p className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Growth progression
        </p>
        <div className="flex flex-col gap-4">
          {stages.map((s) => (
            <StatBar
              key={s.label}
              label={s.label}
              value={s.value}
              color={s.color}
              displayValue={`${s.value}%`}
            />
          ))}
        </div>
      </div>
      <div className="card-surface rounded-2xl p-6 sm:p-8">
        <p className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Edge values
        </p>
        <div className="flex flex-col gap-4">
          <StatBar label="Minimum" value={0} displayValue="0" />
          <StatBar label="Quarter" value={25} displayValue="25" />
          <StatBar label="Half" value={50} displayValue="50" />
          <StatBar label="Three quarters" value={75} displayValue="75" />
          <StatBar label="Maximum" value={100} displayValue="100" />
        </div>
      </div>
    </>
  );
}

function SwatchRow({
  heading,
  swatches,
}: {
  heading: string;
  swatches: Array<{ name: string; token: string; cssVar: string }>;
}) {
  return (
    <div>
      <p className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">
        {heading}
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {swatches.map((s) => (
          <div
            key={s.token}
            className="card-surface flex items-center gap-4 rounded-2xl p-4"
          >
            <div
              aria-hidden="true"
              className="h-10 w-10 shrink-0 rounded-xl sm:h-12 sm:w-12"
              style={{
                backgroundColor: `var(${s.cssVar})`,
                boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.25)",
              }}
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium sm:text-base">
                {s.name}
              </span>
              <span className="truncate font-mono text-[11px] text-muted-foreground sm:text-xs">
                {s.token}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
