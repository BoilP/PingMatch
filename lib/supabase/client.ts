import { createClient as _create } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Singleton — един клиент за цялото приложение
let client: ReturnType<typeof _create<Database>> | null = null;

export function createClient() {
  if (client) return client;

  client = _create<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "pingmatch-session",
      },
    }
  );

  return client;
}
