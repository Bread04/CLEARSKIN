"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSuggestedDishes, type Suggestion } from "@/lib/utils/suggestions";

export function useSmartSuggestions(userId: string): Suggestion[] {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const supabase = createClient();

    (async () => {
      try {
        const { data } = await supabase
          .from("log_entries")
          .select("id, user_id, logged_at, food, lifestyle, skincare, symptoms, created_at")
          .eq("user_id", userId)
          .order("logged_at", { ascending: false })
          .limit(7);
        if (cancelled || !data) return;
        const result = getSuggestedDishes(data as Parameters<typeof getSuggestedDishes>[0], new Date().getDay());
        setSuggestions(result);
      } catch {
        // non-critical — suggestions degrade gracefully
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return useMemo(() => suggestions, [suggestions]);
}
