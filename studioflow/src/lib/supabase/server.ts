import { redirect } from "next/navigation";
import { getSupabaseConfig } from "./config";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

export async function createClient() {
  const cookieStore = await cookies();
  const config = getSupabaseConfig();
  if (!config) redirect("/setup");

  return createServerClient<Database>(
    config.url,
    config.key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies. Middleware keeps sessions fresh.
          }
        }
      }
    }
  );
}
