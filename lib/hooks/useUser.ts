"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";

type UserState =
  | { status: "loading"; user: null; profile: null; error: null }
  | {
      status: "authenticated";
      user: User;
      profile: Profile | null;
      error: null;
    }
  | { status: "unauthenticated"; user: null; profile: null; error: null }
  | { status: "error"; user: null; profile: null; error: Error };

export function useUser(): UserState {
  const [state, setState] = useState<UserState>({
    status: "loading",
    user: null,
    profile: null,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (userError) {
          setState({
            status: "error",
            user: null,
            profile: null,
            error: userError,
          });
          return;
        }
        if (!user) {
          setState({
            status: "unauthenticated",
            user: null,
            profile: null,
            error: null,
          });
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        setState({
          status: "authenticated",
          user,
          profile: profile ?? null,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          user: null,
          profile: null,
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
