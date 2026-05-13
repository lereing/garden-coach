"use client";

import useSWR, { type SWRConfiguration } from "swr";
import type { PlantingCard } from "@/lib/garden/planting-helpers";

const ENDPOINT = "/api/plantings";

type PlantingsResponse = { plantings: PlantingCard[] };

async function fetcher(url: string): Promise<PlantingsResponse> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      typeof detail.error === "string" ? detail.error : "Couldn't load plantings",
    );
  }
  return (await res.json()) as PlantingsResponse;
}

export function usePlantings(config?: SWRConfiguration<PlantingsResponse>) {
  const swr = useSWR<PlantingsResponse>(ENDPOINT, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    keepPreviousData: true,
    ...config,
  });
  return {
    plantings: swr.data?.plantings ?? [],
    isLoading: swr.isLoading,
    isValidating: swr.isValidating,
    error: swr.error as Error | undefined,
    mutate: swr.mutate,
    key: ENDPOINT,
  };
}

export const PLANTINGS_SWR_KEY = ENDPOINT;
