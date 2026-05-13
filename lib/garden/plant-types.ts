import {
  Apple,
  Carrot,
  CircleDot,
  Grape,
  Leaf,
  Salad,
  Sprout,
  Wheat,
  type LucideIcon,
} from "lucide-react";

export const PLANT_TYPES = [
  "leafy_green",
  "fruiting",
  "root",
  "herb",
  "legume",
  "allium",
  "brassica",
  "vine",
] as const;

export type PlantType = (typeof PLANT_TYPES)[number];

type PlantTypeMeta = {
  label: string;
  icon: LucideIcon;
  // CSS custom property name on :root holding the hex.
  // Use for inline gradients / arbitrary values.
  cssVar: string;
  // Tailwind color token (matches @theme entry in globals.css).
  tailwindToken: string;
};

export const PLANT_TYPE_META: Record<PlantType, PlantTypeMeta> = {
  leafy_green: {
    label: "Leafy Green",
    icon: Leaf,
    cssVar: "--type-leafy-green",
    tailwindToken: "leafy-green",
  },
  fruiting: {
    label: "Fruiting",
    icon: Apple,
    cssVar: "--type-fruiting",
    tailwindToken: "fruiting",
  },
  root: {
    label: "Root",
    icon: Carrot,
    cssVar: "--type-root",
    tailwindToken: "root",
  },
  herb: {
    label: "Herb",
    icon: Sprout,
    cssVar: "--type-herb",
    tailwindToken: "herb",
  },
  legume: {
    label: "Legume",
    icon: Wheat,
    cssVar: "--type-legume",
    tailwindToken: "legume",
  },
  allium: {
    label: "Allium",
    icon: CircleDot,
    cssVar: "--type-allium",
    tailwindToken: "allium",
  },
  brassica: {
    label: "Brassica",
    icon: Salad,
    cssVar: "--type-brassica",
    tailwindToken: "brassica",
  },
  vine: {
    label: "Vine",
    icon: Grape,
    cssVar: "--type-vine",
    tailwindToken: "vine",
  },
};
