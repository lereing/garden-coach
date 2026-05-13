"use client";

import useSWR, { type SWRConfiguration } from "swr";
import type { Log } from "@/lib/types/database";

type LogsResponse = { logs: Log[] };

async function fetcher(url: string): Promise<LogsResponse> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      typeof detail.error === "string" ? detail.error : "Couldn't load logs",
    );
  }
  return (await res.json()) as LogsResponse;
}

// Fetches recent logs for a specific planting. Used by the
// expandable "Notes" section on a plant card when the user taps it
// — the home payload only ships the latest 3 observations, this
// hook is for "show me the whole history."
export function useLogs(
  plantingId: string | null,
  config?: SWRConfiguration<LogsResponse>,
) {
  const key = plantingId ? `/api/logs?planting_id=${plantingId}` : null;
  const swr = useSWR<LogsResponse>(key, fetcher, {
    revalidateOnFocus: true,
    keepPreviousData: true,
    ...config,
  });
  return {
    logs: swr.data?.logs ?? [],
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
    mutate: swr.mutate,
  };
}
