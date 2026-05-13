"use server";

import { revalidatePath } from "next/cache";
import { geocodeAddress } from "@/lib/garden/geocode";
import { resolveZone } from "@/lib/garden/zone-lookup";
import { zoneFrostDates } from "@/lib/garden/zones";
import { createClient } from "@/lib/supabase/server";

export type SaveLocationResult =
  | {
      ok: true;
      data: {
        zone: string;
        lastFrost: string;
        firstFrost: string;
        displayName: string;
        // Echoed back so the UI can show "approximate" wording when the
        // ZIP path fell through (e.g., for non-US addresses).
        approximate: boolean;
      };
    }
  | { ok: false; error: string };

export async function saveLocation(input: {
  address: string;
}): Promise<SaveLocationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const address = input.address.trim();
  if (!address) {
    return { ok: false, error: "Enter an address to continue." };
  }

  const hit = await geocodeAddress(address);
  if (!hit) {
    return {
      ok: false,
      error:
        "We couldn't find that address. Try adding more detail — city, state, country.",
    };
  }

  const resolution = await resolveZone({
    zip: hit.postcode,
    countryCode: hit.countryCode,
    lat: hit.lat,
  });

  if (!resolution) {
    return {
      ok: false,
      error: "We couldn't determine a hardiness zone for that location.",
    };
  }

  const frost = zoneFrostDates(resolution.zone);

  const { error } = await supabase
    .from("profiles")
    .update({
      address,
      latitude: hit.lat,
      longitude: hit.lng,
      hardiness_zone: resolution.zone,
      last_frost_date: frost.lastFrost,
      first_frost_date: frost.firstFrost,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "Couldn't save that. Try again in a moment." };
  }

  revalidatePath("/onboarding");
  return {
    ok: true,
    data: {
      zone: resolution.zone,
      lastFrost: frost.lastFrost,
      firstFrost: frost.firstFrost,
      displayName: hit.displayName,
      approximate: resolution.source === "latitude_band",
    },
  };
}
