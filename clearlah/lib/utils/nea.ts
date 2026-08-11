/**
 * NEA (National Environment Agency) / data.gov.sg weather data helpers.
 *
 * All endpoints are public — no API key required.
 * Each fetcher returns a NeaReading (value + the upstream observation timestamp)
 * or null, so the caller can substitute mock data per signal rather than
 * discarding a whole payload when one endpoint is unavailable.
 *
 * API base: https://api-open.data.gov.sg/v2/real-time/api/
 *
 * Response shapes below were verified against the live v2 API. Note that v2 is
 * NOT uniform: air-temperature and relative-humidity nest readings under
 * `data.readings[]`, psi under `data.items[]`, and uv under `data.records[]`.
 */

const NEA_BASE = "https://api-open.data.gov.sg/v2/real-time/api";

/** Upstream call budget. Vercel functions default to 10s — stay well inside it. */
const FETCH_TIMEOUT_MS = 5000;

/** Matches the route handler's ISR window so the two cannot drift apart. */
const REVALIDATE_SECONDS = 600;

/**
 * Readings older than this are treated as unavailable rather than reported as
 * live. Per-signal because publication cadence differs: temperature and humidity
 * update every few minutes, while psi and uv are published hourly on the hour.
 */
const MAX_AGE_MS = {
  frequent: 60 * 60 * 1000, // 1h  — air-temperature, relative-humidity
  hourly: 2 * 60 * 60 * 1000, // 2h — psi, uv
} as const;

/** Plausibility bounds. Sentinel values (-999) and dead-sensor zeroes fail these. */
const BOUNDS = {
  temp: { min: 15, max: 45 }, // °C, generous around Singapore's 23–36 range
  humidity: { min: 1, max: 100 }, // %
  psi: { min: 1, max: 500 }, // index
  uv: { min: 0, max: 20 }, // index — 0 is legitimate at night
} as const;

/** A single weather signal plus the time the upstream sensor recorded it. */
export interface NeaReading {
  value: number;
  /** ISO timestamp of the upstream observation itself, not of our request. */
  observedAt: string;
}

export interface NeaWeatherReadings {
  temp: NeaReading | null;
  humidity: NeaReading | null;
  psi: NeaReading | null;
  uv: NeaReading | null;
}

interface Bounds {
  min: number;
  max: number;
}

/** Every v2 endpoint wraps its payload in this envelope. `code` 0 means success. */
interface NeaEnvelope<T> {
  code?: number;
  data?: T;
  errorMsg?: string | null;
}

/** Shape shared by air-temperature and relative-humidity. */
interface StationSeries {
  readings?: Array<{
    timestamp?: string;
    data?: Array<{ stationId?: string; value?: unknown }>;
  }>;
}

/**
 * Next.js signals control flow (dynamic bailout, redirect, notFound) by throwing
 * errors tagged with a `digest`. Swallowing one turns a framework signal into a
 * bogus "NEA outage", so these must always propagate.
 */
export function isFrameworkError(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === "string";
}

/** JSON is untrusted — reject strings, null, NaN and Infinity before arithmetic. */
function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function inBounds(value: number, bounds: Bounds): boolean {
  return value >= bounds.min && value <= bounds.max;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Guard against NEA serving a last-known record during a sensor outage, which
 * would otherwise be reported as a current live reading.
 */
function isFresh(timestamp: string | undefined, maxAgeMs: number, label: string): timestamp is string {
  if (!timestamp) {
    console.warn(`[nea] ${label}: reading has no timestamp`);
    return false;
  }

  const observed = Date.parse(timestamp);
  if (Number.isNaN(observed)) {
    console.warn(`[nea] ${label}: unparseable timestamp "${timestamp}"`);
    return false;
  }

  const ageMs = Date.now() - observed;
  if (ageMs > maxAgeMs) {
    console.warn(`[nea] ${label}: reading is stale (${Math.round(ageMs / 60000)} min old)`);
    return false;
  }

  return true;
}

/** Shared fetch wrapper — returns the unwrapped `data` payload or null on failure. */
async function neaFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${NEA_BASE}/${path}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // 10-minute ISR cache. Must NOT be `no-store` — that opts the route segment
      // out of static rendering and silently resets its `revalidate` to 0.
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      console.warn(`[nea] ${path}: HTTP ${res.status} ${res.statusText}`);
      return null;
    }

    const body = (await res.json()) as NeaEnvelope<T>;

    // data.gov.sg reports application errors inside an HTTP 200 response.
    if (typeof body.code === "number" && body.code !== 0) {
      console.warn(`[nea] ${path}: upstream code ${body.code} — ${body.errorMsg || "no message"}`);
      return null;
    }

    if (!body.data) {
      console.warn(`[nea] ${path}: envelope carried no data payload`);
      return null;
    }

    return body.data;
  } catch (err) {
    if (isFrameworkError(err)) throw err;
    const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.warn(`[nea] ${path}: fetch failed — ${reason}`);
    return null;
  }
}

/**
 * Average every station in the most recent reading batch (~16 island-wide).
 * Taking `data[0]` alone would pin the value to whichever station the API happens
 * to list first — an identity that is not contractual and can change per response.
 */
function averageStations(
  payload: StationSeries | null,
  label: string,
  bounds: Bounds
): NeaReading | null {
  const batch = payload?.readings?.[0];
  if (!batch) {
    console.warn(`[nea] ${label}: no reading batches in payload`);
    return null;
  }

  if (!isFresh(batch.timestamp, MAX_AGE_MS.frequent, label)) return null;

  const values = (batch.data ?? [])
    .map((station) => toFiniteNumber(station?.value))
    .filter((value): value is number => value !== null && inBounds(value, bounds));

  if (values.length === 0) {
    console.warn(`[nea] ${label}: no station reading passed validation`);
    return null;
  }

  return { value: mean(values), observedAt: batch.timestamp };
}

/** Fetch current air temperature (°C), averaged across all reporting stations. */
export async function fetchTemperature(): Promise<NeaReading | null> {
  const payload = await neaFetch<StationSeries>("air-temperature");
  return averageStations(payload, "air-temperature", BOUNDS.temp);
}

/** Fetch current relative humidity (%), averaged across all reporting stations. */
export async function fetchHumidity(): Promise<NeaReading | null> {
  const payload = await neaFetch<StationSeries>("relative-humidity");
  return averageStations(payload, "relative-humidity", BOUNDS.humidity);
}

/**
 * The v2 API exposes 24-hour PSI per region only — there is no national figure.
 * We report the mean of the five regions as the island-wide value.
 */
const PSI_REGIONS = ["south", "north", "west", "central", "east"] as const;

/** Fetch 24-hour PSI, averaged across the five reporting regions. */
export async function fetchPsi(): Promise<NeaReading | null> {
  const payload = await neaFetch<{
    items?: Array<{
      timestamp?: string;
      updatedTimestamp?: string;
      readings?: { psi_twenty_four_hourly?: Record<string, unknown> };
    }>;
  }>("psi");

  const item = payload?.items?.[0];
  if (!item) {
    console.warn("[nea] psi: no items in payload");
    return null;
  }

  const observedAt = item.updatedTimestamp ?? item.timestamp;
  if (!isFresh(observedAt, MAX_AGE_MS.hourly, "psi")) return null;

  const regional = item.readings?.psi_twenty_four_hourly;
  if (!regional) {
    console.warn("[nea] psi: payload has no psi_twenty_four_hourly readings");
    return null;
  }

  const values = PSI_REGIONS.map((region) => toFiniteNumber(regional[region])).filter(
    (value): value is number => value !== null && inBounds(value, BOUNDS.psi)
  );

  if (values.length === 0) {
    console.warn("[nea] psi: no regional reading passed validation");
    return null;
  }

  return { value: mean(values), observedAt };
}

/** Fetch the most recent hourly UV Index for Singapore. */
export async function fetchUv(): Promise<NeaReading | null> {
  const payload = await neaFetch<{
    records?: Array<{
      updatedTimestamp?: string;
      index?: Array<{ value?: unknown; hour?: string }>;
    }>;
  }>("uv");

  const record = payload?.records?.[0];
  if (!record) {
    console.warn("[nea] uv: no records in payload");
    return null;
  }

  // `index` ordering is not contractual — select the latest hour explicitly
  // rather than trusting the array to be sorted newest-first.
  const latest = (record.index ?? [])
    .filter((entry): entry is { value?: unknown; hour: string } => typeof entry?.hour === "string")
    .sort((a, b) => Date.parse(b.hour) - Date.parse(a.hour))[0];

  if (!latest) {
    // NEA publishes UV across daylight hours only; an empty array overnight is
    // expected, not a fault. The caller substitutes mock for this signal alone.
    console.warn("[nea] uv: no index entries (expected outside ~07:00–19:00 SGT)");
    return null;
  }

  if (!isFresh(latest.hour, MAX_AGE_MS.hourly, "uv")) return null;

  const value = toFiniteNumber(latest.value);
  if (value === null || !inBounds(value, BOUNDS.uv)) {
    console.warn(`[nea] uv: reading failed validation (${String(latest.value)})`);
    return null;
  }

  return { value, observedAt: latest.hour };
}

/**
 * Fetch all four weather signals concurrently.
 *
 * Each signal resolves independently — a null means only that one signal is
 * unavailable, so the caller can keep the readings that did succeed. Framework
 * errors thrown by any fetcher propagate rather than being reported as an outage.
 */
export async function fetchAllNeaWeather(): Promise<NeaWeatherReadings> {
  const [temp, humidity, psi, uv] = await Promise.all([
    fetchTemperature(),
    fetchHumidity(),
    fetchPsi(),
    fetchUv(),
  ]);

  return { temp, humidity, psi, uv };
}
