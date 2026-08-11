/**
 * Demo mode utilities.
 * All demo-mode logic is centralised here so it can be audited easily.
 */
import {
  ANON_COOKIE,
  ANON_COOKIE_MAX_AGE,
  LEGACY_ANON_KEY,
  isValidAnonId,
} from "@/lib/utils/anon-id";

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Typed error for unauthenticated API route calls.
 * API routes should catch this and return a 401, not let it bubble as a 500.
 */
export class UnauthenticatedError extends Error {
  readonly status = 401;
  constructor() {
    super("No authenticated user and demo mode is not active.");
    this.name = "UnauthenticatedError";
  }
}

/**
 * Returns the active user ID.
 * In demo mode, returns the fixed demo user ID.
 * In production, returns the provided real user ID.
 * @throws {UnauthenticatedError} if no user ID is provided outside demo mode
 */
export function getActiveUserId(realUserId?: string): string {
  if (isDemoMode()) return DEMO_USER_ID;
  if (!realUserId) throw new UnauthenticatedError();
  return realUserId;
}

/**
 * Returns true when the app is running in demo mode.
 */
export function isDemoMode(): boolean {
  const value = process.env.NEXT_PUBLIC_DEMO_MODE?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

/** Reads a cookie value by name from document.cookie. */
function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Writes the anonymous id cookie with the same attributes the middleware uses. */
function writeAnonCookie(id: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${ANON_COOKIE}=${id}; Path=/; Max-Age=${ANON_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

/**
 * Returns a stable anonymous user ID for non-demo mode.
 * In demo mode, returns the fixed DEMO_USER_ID.
 * Only callable from client components (browser context).
 *
 * Reads the cookie the middleware issues, so the client and the Server
 * Components resolve the same user. Any id left behind by the previous
 * localStorage implementation is migrated into the cookie rather than
 * discarded, so returning users keep their logged history.
 */
export function getAnonymousUserId(): string {
  if (isDemoMode()) return DEMO_USER_ID;
  if (typeof document === "undefined") throw new UnauthenticatedError();

  const fromCookie = readCookie(ANON_COOKIE);
  if (isValidAnonId(fromCookie)) return fromCookie;

  const legacy = localStorage.getItem(LEGACY_ANON_KEY);
  const id = isValidAnonId(legacy) ? legacy : crypto.randomUUID();
  writeAnonCookie(id);
  return id;
}
