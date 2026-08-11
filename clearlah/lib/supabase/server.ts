/**
 * Server-side Supabase client (App Router — Server Components, API Routes, Server Actions).
 *
 * Usage (Server Components / Route Handlers):
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = createClient()
 *
 * Uses @supabase/ssr createServerClient which reads/writes cookies
 * via Next.js `cookies()` — keeping auth state consistent across
 * server and client rendering.
 *
 * In demo mode (NEXT_PUBLIC_DEMO_MODE=true) the app uses the
 * service-role key to bypass RLS entirely via SUPABASE_SERVICE_ROLE_KEY.
 * All API routes use DEMO_USER_ID instead of auth.uid().
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/utils/demo";

export async function createClient() {
  // Next.js 15: cookies() is async — must be awaited before use (F11)
  const cookieStore = await cookies();

  // In demo mode, use service-role key to bypass RLS so API routes
  // can read/write as the demo user without auth tokens.
  const demo = isDemoMode();

  // F7: Validate service role key presence eagerly so the error is clear
  if (demo && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[ClearLah] SUPABASE_SERVICE_ROLE_KEY is required when NEXT_PUBLIC_DEMO_MODE=true. " +
      "Set it in your Vercel project dashboard → Environment Variables."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "[ClearLah] NEXT_PUBLIC_SUPABASE_URL is required. " +
      "Set it in your Vercel project dashboard → Environment Variables."
    );
  }

  // Use service-role key to bypass RLS when available (demo mode or no-auth MVP).
  // Post-hackathon: switch to anon key + Supabase Auth for production.
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : (() => {
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!key) {
          throw new Error(
            "[ClearLah] NEXT_PUBLIC_SUPABASE_ANON_KEY is required when SUPABASE_SERVICE_ROLE_KEY is not set."
          );
        }
        return key;
      })();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll may throw in Server Components (read-only context).
            // This is safe to ignore — cookies set in middleware will persist.
          }
        },
      },
    }
  );
}
