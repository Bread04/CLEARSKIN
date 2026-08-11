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

const DEMO_DAY_OFFSET_KEY = "clearlah_demo_day_offset";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; Path=/; Max-Age=86400; SameSite=Lax`;
}

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

/**
 * Returns the number of days to offset from today in demo mode.
 * Stored in a cookie so both server and client can read it.
 * Returns 0 outside demo mode or if not set.
 */
export function getDemoDayOffset(): number {
  if (!isDemoMode()) return 0;
  try {
    const raw = getCookie(DEMO_DAY_OFFSET_KEY);
    const n = parseInt(raw ?? "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch { return 0; }
}

/**
 * Returns a Date object representing the simulated "today" in demo mode.
 * Falls back to the real Date when not in demo mode.
 */
export function getDemoDate(): Date {
  const offset = getDemoDayOffset();
  if (offset <= 0) return new Date();
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

/**
 * Returns "YYYY-MM-DD" for the simulated today in demo mode.
 * Falls back to the real today when not in demo mode.
 */
export function getDemoToday(): string {
  return getDemoDate().toISOString().split("T")[0];
}

/**
 * Increments the demo day offset by 1 and returns the new Date.
 * Only affects demo mode. Writes to cookie so server components can read it.
 */
export function advanceDemoDay(): Date {
  if (!isDemoMode()) return new Date();
  const next = getDemoDayOffset() + 1;
  setCookie(DEMO_DAY_OFFSET_KEY, String(next));
  return getDemoDate();
}

/**
 * Returns the demo date string to send as part of the log save request.
 * Only returns a value in demo mode when an offset is active.
 */
export function getDemoDateForSave(): string | null {
  if (!isDemoMode()) return null;
  const offset = getDemoDayOffset();
  return offset > 0 ? getDemoToday() : null;
}
