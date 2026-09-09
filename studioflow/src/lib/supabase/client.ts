import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "./config";

import type { Database } from "@/lib/database.types";

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured. See the project README.");
  return createBrowserClient<Database>(
    config.url,
    config.key
  );
}
