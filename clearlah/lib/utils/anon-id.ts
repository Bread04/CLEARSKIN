/**
 * Anonymous user identity — shared constants.
 *
 * This module is deliberately isomorphic: it must not import `next/headers`
 * or touch `document`, because it is pulled into both the client bundle
 * (lib/utils/demo.ts) and the Edge middleware.
 *
 * The identity lives in a cookie rather than localStorage because Server
 * Components cannot read localStorage — that mismatch is what previously
 * made /dashboard, /log and /insights/report unreachable outside demo mode.
 */

/** Cookie holding the anonymous user UUID. Readable by client JS (not httpOnly). */
export const ANON_COOKIE = "clearlah_uid";

/** Legacy localStorage key — migrated into the cookie on first client read. */
export const LEGACY_ANON_KEY = "clearlah_anon_user_id";

/** One year. The identity is the user's only handle on their own history. */
export const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Guards every read of the identity. The value reaches Postgres as a `uuid`,
 * so a malformed cookie must be rejected before it becomes a query error.
 */
export function isValidAnonId(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
