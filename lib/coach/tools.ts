import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANT_TYPES as UI_PLANT_TYPES } from "@/lib/garden/plant-types";
import { getWeatherForecast } from "@/lib/garden/weather";
import type { Database, PlantType } from "@/lib/types/database";
import {
  isToolName,
  TOOL_NAMES,
  type ToolName,
} from "@/lib/coach/types";

type Client = SupabaseClient<Database>;
type AnyInput = Record<string, unknown>;

// ---------------------------------------------------------------------
// Per-tool definitions: Anthropic schema + server-side executor.
// ---------------------------------------------------------------------

type Tool<TInput extends AnyInput, TOutput> = {
  spec: Anthropic.Tool;
  execute: (
    client: Client,
    userId: string,
    input: TInput,
  ) => Promise<TOutput>;
};

// 1. get_user_context — profile + preferences in one shot.
const getUserContext: Tool<AnyInput, unknown> = {
  spec: {
    name: "get_user_context",
    description:
      "Return the user's location, USDA hardiness zone, frost dates, and gardening preferences. Call this first when answering anything that depends on who the user is or where they garden.",
    input_schema: { type: "object", properties: {} },
  },
  async execute(client, userId) {
    const [{ data: profile }, { data: prefs }] = await Promise.all([
      client
        .from("profiles")
        .select(
          "display_name, address, hardiness_zone, last_frost_date, first_frost_date",
        )
        .eq("id", userId)
        .maybeSingle(),
      client
        .from("preferences")
        .select(
          "loves_eating, dislikes, already_have, goals, experience_level",
        )
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    return {
      display_name: profile?.display_name ?? null,
      address: profile?.address ?? null,
      hardiness_zone: profile?.hardiness_zone ?? null,
      last_frost_date: profile?.last_frost_date ?? null,
      first_frost_date: profile?.first_frost_date ?? null,
      preferences: {
        loves_eating: prefs?.loves_eating ?? [],
        dislikes: prefs?.dislikes ?? [],
        already_have: prefs?.already_have ?? [],
        goals: prefs?.goals ?? [],
        experience_level: prefs?.experience_level ?? null,
      },
    };
  },
};

// 2. get_user_spaces
const getUserSpaces: Tool<AnyInput, unknown> = {
  spec: {
    name: "get_user_spaces",
    description:
      "List the user's growing spaces (beds, planters, containers) with dimensions in inches and sunlight hours. Use when answering about capacity, layout, or what fits where.",
    input_schema: { type: "object", properties: {} },
  },
  async execute(client, userId) {
    const { data, error } = await client
      .from("spaces")
      .select("id, name, type, width_inches, length_inches, sunlight_hours, notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
};

// 3. get_active_plantings — includes 14-day rolling logs per planting.
const getActivePlantings: Tool<AnyInput, unknown> = {
  spec: {
    name: "get_active_plantings",
    description:
      "Return all of the user's currently active plantings, each with the plant info, planted date, assigned space, and any logs from the last 14 days. Use this for any question about what is currently growing.",
    input_schema: { type: "object", properties: {} },
  },
  async execute(client, userId) {
    const { data: plantings, error } = await client
      .from("plantings")
      .select(
        `id, plant_id, space_id, variety, planted_date, last_activity_at,
         plant:plants(common_name, type, days_to_maturity_min, days_to_maturity_max, sunlight_min_hours, companion_plants, antagonist_plants),
         space:spaces(name, type, width_inches, length_inches, sunlight_hours)`,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .order("last_activity_at", { ascending: false });
    if (error) throw error;
    if (!plantings || plantings.length === 0) return [];

    const ids = plantings.map((p) => p.id);
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: logs } = await client
      .from("logs")
      .select("id, planting_id, type, logged_at, amount_oz, notes")
      .eq("user_id", userId)
      .in("planting_id", ids)
      .gte("logged_at", since)
      .order("logged_at", { ascending: false });

    const logsByPlanting = new Map<string, typeof logs>();
    for (const log of logs ?? []) {
      if (!log.planting_id) continue;
      const list = logsByPlanting.get(log.planting_id) ?? [];
      list.push(log);
      logsByPlanting.set(log.planting_id, list);
    }

    return plantings.map((p) => ({
      ...p,
      recent_logs: logsByPlanting.get(p.id) ?? [],
    }));
  },
};

// 4. get_planting_history — past plantings (harvested/failed/removed)
//    with total harvest weight summed from harvest logs.
const getPlantingHistory: Tool<{ seasons_back?: number }, unknown> = {
  spec: {
    name: "get_planting_history",
    description:
      "Return the user's past plantings (status harvested/failed/removed). Each row includes plant info, planted date, status, any failure_reason, and total harvested oz summed from harvest logs. Use this to learn from prior attempts before recommending.",
    input_schema: {
      type: "object",
      properties: {
        seasons_back: {
          type: "integer",
          minimum: 1,
          maximum: 12,
          description:
            "How many gardening seasons back to include. One season ≈ 3 months. Omit for all history.",
        },
      },
    },
  },
  async execute(client, userId, input) {
    const seasonsBack = typeof input.seasons_back === "number" && input.seasons_back > 0
      ? Math.floor(input.seasons_back)
      : null;

    let query = client
      .from("plantings")
      .select(
        `id, plant_id, space_id, variety, planted_date, status, failure_reason,
         plant:plants(common_name, type)`,
      )
      .eq("user_id", userId)
      .neq("status", "active")
      .order("planted_date", { ascending: false });

    if (seasonsBack) {
      const monthsBack = seasonsBack * 3;
      const cutoff = new Date();
      cutoff.setUTCMonth(cutoff.getUTCMonth() - monthsBack);
      query = query.gte("planted_date", cutoff.toISOString().slice(0, 10));
    }

    const { data: plantings, error } = await query;
    if (error) throw error;
    if (!plantings || plantings.length === 0) return [];

    const ids = plantings.map((p) => p.id);
    const { data: harvestLogs } = await client
      .from("logs")
      .select("planting_id, amount_oz")
      .eq("user_id", userId)
      .eq("type", "harvest")
      .in("planting_id", ids);

    const totals = new Map<string, number>();
    for (const log of harvestLogs ?? []) {
      if (!log.planting_id || typeof log.amount_oz !== "number") continue;
      totals.set(
        log.planting_id,
        (totals.get(log.planting_id) ?? 0) + log.amount_oz,
      );
    }

    return plantings.map((p) => ({
      ...p,
      total_harvest_oz: totals.get(p.id) ?? null,
    }));
  },
};

// 5. get_recent_logs
const getRecentLogs: Tool<
  { planting_id?: string; days_back?: number },
  unknown
> = {
  spec: {
    name: "get_recent_logs",
    description:
      "Return the user's recent log entries (water / harvest / observation / pest / weather_event), filterable by planting and time window. Use when answering about care cadence or recent activity.",
    input_schema: {
      type: "object",
      properties: {
        planting_id: {
          type: "string",
          description:
            "UUID of a specific planting. Omit to include logs across all plantings.",
        },
        days_back: {
          type: "integer",
          minimum: 1,
          maximum: 365,
          description: "How many days back to fetch. Defaults to 14.",
        },
      },
    },
  },
  async execute(client, userId, input) {
    const days =
      typeof input.days_back === "number" && input.days_back > 0
        ? Math.min(Math.floor(input.days_back), 365)
        : 14;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = client
      .from("logs")
      .select("id, planting_id, type, logged_at, amount_oz, notes")
      .eq("user_id", userId)
      .gte("logged_at", since)
      .order("logged_at", { ascending: false })
      .limit(200);

    if (typeof input.planting_id === "string" && input.planting_id.trim()) {
      query = query.eq("planting_id", input.planting_id.trim());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
};

// 6. get_weather — current + daily forecast.
const getWeather: Tool<{ days_ahead?: number }, unknown> = {
  spec: {
    name: "get_weather",
    description:
      "Fetch current weather and a daily forecast for the user's location from Open-Meteo. Use when timing advice depends on rain, frost risk, or heat.",
    input_schema: {
      type: "object",
      properties: {
        days_ahead: {
          type: "integer",
          minimum: 1,
          maximum: 14,
          description: "How many forecast days to return. Defaults to 7.",
        },
      },
    },
  },
  async execute(client, userId, input) {
    const { data: profile } = await client
      .from("profiles")
      .select("latitude, longitude, address")
      .eq("id", userId)
      .maybeSingle();
    if (
      !profile ||
      profile.latitude == null ||
      profile.longitude == null
    ) {
      return {
        error:
          "user_has_no_location: cannot fetch weather. Suggest the user finish onboarding.",
      };
    }
    const daysAhead =
      typeof input.days_ahead === "number" && input.days_ahead > 0
        ? input.days_ahead
        : 7;
    const result = await getWeatherForecast(
      profile.latitude,
      profile.longitude,
      daysAhead,
    );
    if (!result) {
      return {
        error:
          "weather_service_unavailable: Open-Meteo did not return a forecast. Give advice without weather context this turn.",
      };
    }
    return result;
  },
};

// 7. search_plant_catalog
const SEASONS = ["spring", "summer", "fall", "winter"] as const;
type Season = (typeof SEASONS)[number];

const SEASON_TYPE_HINTS: Record<Season, PlantType[]> = {
  spring: ["leafy_green", "root", "brassica", "allium", "legume"],
  summer: ["fruiting", "herb", "vine"],
  fall: ["leafy_green", "brassica", "allium", "root"],
  winter: ["leafy_green", "brassica"],
};

const searchPlantCatalog: Tool<
  {
    query?: string;
    zone?: string;
    type?: string;
    season?: Season;
    limit?: number;
  },
  unknown
> = {
  spec: {
    name: "search_plant_catalog",
    description:
      "Search the Garden Coach plant catalog. Filter by name substring, USDA zone, plant type, or season. Use this when suggesting what to plant or looking up plant facts — never invent plant data.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Case-insensitive substring match on common_name.",
        },
        zone: {
          type: "string",
          description:
            "USDA zone like '7b' or '10a'. Filters to plants whose hardiness_zones array contains this zone.",
        },
        type: {
          type: "string",
          enum: [...UI_PLANT_TYPES],
          description: "Restrict to a single plant type.",
        },
        season: {
          type: "string",
          enum: [...SEASONS],
          description:
            "Approximate season hint: spring/summer/fall/winter. Filters by plant types typically planted in that season.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Max plants to return. Defaults to 20.",
        },
      },
    },
  },
  async execute(client, _userId, input) {
    const PLANT_FIELDS =
      "id, common_name, scientific_name, type, days_to_maturity_min, days_to_maturity_max, sunlight_min_hours, spacing_inches, companion_plants, antagonist_plants, hardiness_zones, start_indoor_weeks_before_last_frost, direct_sow_weeks_relative_to_last_frost, notes";

    let query = client.from("plants").select(PLANT_FIELDS);

    if (typeof input.query === "string" && input.query.trim()) {
      query = query.ilike("common_name", `%${input.query.trim()}%`);
    }
    if (typeof input.zone === "string" && input.zone.trim()) {
      query = query.contains("hardiness_zones", [input.zone.trim()]);
    }
    if (
      typeof input.type === "string" &&
      (UI_PLANT_TYPES as readonly string[]).includes(input.type)
    ) {
      query = query.eq("type", input.type as PlantType);
    } else if (
      typeof input.season === "string" &&
      (SEASONS as readonly string[]).includes(input.season)
    ) {
      const types = SEASON_TYPE_HINTS[input.season as Season];
      query = query.in("type", types);
    }

    const limit =
      typeof input.limit === "number" && input.limit > 0
        ? Math.min(Math.floor(input.limit), 50)
        : 20;
    query = query.order("common_name").limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
};

// ---------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------

const TOOLS: Record<ToolName, Tool<AnyInput, unknown>> = {
  get_user_context: getUserContext,
  get_user_spaces: getUserSpaces,
  get_active_plantings: getActivePlantings,
  get_planting_history: getPlantingHistory as Tool<AnyInput, unknown>,
  get_recent_logs: getRecentLogs as Tool<AnyInput, unknown>,
  get_weather: getWeather as Tool<AnyInput, unknown>,
  search_plant_catalog: searchPlantCatalog as Tool<AnyInput, unknown>,
};

export const TOOL_SPECS: Anthropic.Tool[] = TOOL_NAMES.map(
  (name) => TOOLS[name].spec,
);

export async function executeCoachTool(
  name: string,
  input: unknown,
  client: Client,
  userId: string,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  if (!isToolName(name)) {
    return { ok: false, error: `Unknown tool: ${name}` };
  }
  try {
    const args = (input ?? {}) as AnyInput;
    const data = await TOOLS[name].execute(client, userId, args);
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
