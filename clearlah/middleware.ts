import { NextResponse, type NextRequest } from "next/server";
import {
  ANON_COOKIE,
  ANON_COOKIE_MAX_AGE,
  isValidAnonId,
} from "@/lib/utils/anon-id";

/**
 * Issues a stable anonymous identity on the very first request.
 *
 * Without this, a brand-new visitor has no server-readable user id, so every
 * Server Component gate falls through to redirect("/onboarding/step/1") — the
 * loop that made the app unusable outside demo mode.
 *
 * Note this is an identifier, not an authentication token: it is client
 * readable and client settable, exactly like the localStorage UUID it
 * replaces, and the API routes already accept a `user_id` in the body. Real
 * auth (Supabase Auth + RLS instead of the service-role key) is still the
 * post-hackathon step called out in lib/supabase/server.ts.
 */
export function middleware(request: NextRequest) {
  const existing = request.cookies.get(ANON_COOKIE)?.value;
  if (isValidAnonId(existing)) return NextResponse.next();

  const id = crypto.randomUUID();

  // Setting it on the *request* makes the new id visible to Server Components
  // rendering this same request. Without it the identity would only take
  // effect on the following navigation.
  request.cookies.set(ANON_COOKIE, id);

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  response.cookies.set(ANON_COOKIE, id, {
    path: "/",
    maxAge: ANON_COOKIE_MAX_AGE,
    sameSite: "lax",
    // Client components read this to send `user_id` on API calls.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
