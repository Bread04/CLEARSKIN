/**
 * Server-side user identity for Server Components and Route Handlers.
 *
 * Kept out of lib/utils/demo.ts on purpose: that module is imported by client
 * components, and `next/headers` cannot be bundled for the browser.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEMO_USER_ID, isDemoMode, UnauthenticatedError } from "@/lib/utils/demo";
import { ANON_COOKIE, isValidAnonId } from "@/lib/utils/anon-id";

/**
 * Resolves the active user id, or null when no usable identity is present.
 * Mirrors the client-side getAnonymousUserId() so both sides agree on who
 * the user is — if they disagreed, the dashboard would read one user's data
 * while /api/logs wrote another's.
 */
export async function getServerUserId(): Promise<string | null> {
  if (isDemoMode()) return DEMO_USER_ID;

  const cookieStore = await cookies();
  const id = cookieStore.get(ANON_COOKIE)?.value;
  return isValidAnonId(id) ? id : null;
}

/**
 * Resolves the user id for a Route Handler.
 *
 * Identity comes from the cookie, so no client call site has to remember to
 * send a `user_id` — most of them never did, which only worked because demo
 * mode handed back a fixed id regardless. The explicit argument stays as a
 * fallback for non-browser callers (scripts, tests) that carry no cookie.
 *
 * @throws {UnauthenticatedError} when neither source yields a valid id.
 */
export async function resolveApiUserId(explicit?: string): Promise<string> {
  const resolved = await getServerUserId();
  if (resolved) return resolved;
  if (isValidAnonId(explicit)) return explicit;
  throw new UnauthenticatedError();
}

/**
 * Resolves the user id and guarantees onboarding is finished, redirecting to
 * the onboarding flow otherwise. Replaces the duplicated demo/auth branch
 * that previously appeared in each gated page.
 */
export async function requireOnboardedUserId(): Promise<string> {
  const userId = await getServerUserId();
  if (!userId) redirect("/onboarding/step/1");

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (!data?.onboarding_complete) redirect("/onboarding/step/1");

  return userId;
}
