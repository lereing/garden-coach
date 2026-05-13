// Thin wrapper around Open-Meteo's free forecast endpoint. No API
// key required. Used for the home-screen header's current temperature.

export type CurrentWeather = {
  temperatureF: number;
  weatherCode: number;
  /** ISO 8601 string from the API. */
  observedAt: string;
};

const BASE = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL_SECONDS = 300; // 5 minutes — weather changes slowly.

export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const url = new URL(BASE);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", "auto");

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      // Cache responses for 5 minutes so the home page doesn't hammer
      // Open-Meteo on every refresh.
      next: { revalidate: CACHE_TTL_SECONDS },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current?: {
        time?: string;
        temperature_2m?: number;
        weather_code?: number;
      };
    };
    const c = data.current;
    if (!c || typeof c.temperature_2m !== "number") return null;
    return {
      temperatureF: Math.round(c.temperature_2m),
      weatherCode: c.weather_code ?? -1,
      observedAt: c.time ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// WMO weather codes → friendly bucket. The full table has ~30
// distinct codes; we collapse to four for the header pill.
// Reference: https://open-meteo.com/en/docs (WMO Weather interpretation)
export function weatherCodeToBucket(code: number): "clear" | "cloudy" | "rain" | "snow" {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3 || code === 45 || code === 48) return "cloudy";
  if (code >= 71 && code <= 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)) return "rain";
  return "cloudy";
}

export type DailyForecast = {
  date: string;
  highF: number;
  lowF: number;
  precipitationInches: number;
  weatherCode: number;
  bucket: ReturnType<typeof weatherCodeToBucket>;
};

export type ForecastResponse = {
  current: CurrentWeather;
  daily: DailyForecast[];
};

export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  daysAhead: number = 7,
): Promise<ForecastResponse | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const days = Math.min(Math.max(Math.floor(daysAhead), 1), 16);

  const url = new URL(BASE);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
  );
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("precipitation_unit", "inch");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", days.toString());

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      next: { revalidate: CACHE_TTL_SECONDS },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current?: {
        time?: string;
        temperature_2m?: number;
        weather_code?: number;
      };
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_sum?: number[];
        weather_code?: number[];
      };
    };

    const c = data.current;
    if (!c || typeof c.temperature_2m !== "number") return null;
    const current: CurrentWeather = {
      temperatureF: Math.round(c.temperature_2m),
      weatherCode: c.weather_code ?? -1,
      observedAt: c.time ?? new Date().toISOString(),
    };

    const d = data.daily;
    const daily: DailyForecast[] = [];
    if (
      d?.time &&
      d.temperature_2m_max &&
      d.temperature_2m_min &&
      d.precipitation_sum &&
      d.weather_code
    ) {
      for (let i = 0; i < d.time.length; i++) {
        const code = d.weather_code[i] ?? -1;
        daily.push({
          date: d.time[i],
          highF: Math.round(d.temperature_2m_max[i] ?? 0),
          lowF: Math.round(d.temperature_2m_min[i] ?? 0),
          precipitationInches: Number((d.precipitation_sum[i] ?? 0).toFixed(2)),
          weatherCode: code,
          bucket: weatherCodeToBucket(code),
        });
      }
    }

    return { current, daily };
  } catch {
    return null;
  }
}
