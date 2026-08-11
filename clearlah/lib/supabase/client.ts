/**
 * Browser-side Supabase client.
 *
 * Usage (Client Components only):
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 *
 * Uses @supabase/ssr createBrowserClient which persists the session
 * in cookies, keeping it in sync with the server-side client.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
