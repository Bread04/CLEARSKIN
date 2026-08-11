/**
 * GET /api/weather
 *
 * Returns current Singapore weather data.
 * - If USE_MOCK_WEATHER is enabled: returns static Singapore mock values immediately.
 * - Otherwise: fetches the four NEA signals (data.gov.sg) concurrently.
 * - Signals resolve independently: any that fail are substituted from mock and
 *   named in `simulated_fields`, so a single unavailable endpoint no longer
 *   discards the readings that did succeed.
 *
 * Response always HTTP 200 — client components must never receive a weather 500.
 * Cached via Next.js ISR: revalidated every 600 seconds (10 minutes).
 *
 * Response schema: WeatherApiResponse (lib/types/database.ts)
 * AD-5: Client components must call this route only — never NEA directly.
 *
 * Note: with fetch-level revalidation the segment is statically prerendered, so
 * USE_MOCK_WEATHER is read at build time and re-read on each revalidation —
 * flipping it in the hosting dashboard takes effect within the 10-minute window.
 */

import { NextResponse } from "next/server";
import type { WeatherApiResponse, WeatherSignal } from "@/lib/types/database";
import {
  fetchAllNeaWeather,
  isFrameworkError,
  type NeaReading,
  type NeaWeatherReadings,
} from "@/lib/utils/nea";

// Static mock — Singapore typical values (day, elevated humidity).
const MOCK_VALUES: Record<WeatherSignal, number> = {
  temp: 31,
  humidity: 82,
  psi: 45,
  uv: 9,
};

const ALL_SIGNALS: WeatherSignal[] = ["temp", "humidity", "psi", "uv"];

/** Decimal places per signal — temperature and humidity are reported to 1 d.p. */
const PRECISION: Record<WeatherSignal, number> = {
  temp: 1,
  humidity: 1,
  psi: 0,
  uv: 0,
};

// 10-minute ISR cache — reduces NEA call frequency across all users.
// The fetches in lib/utils/nea.ts carry a matching `next: { revalidate: 600 }`;
// neither alone is sufficient, and a `no-store` fetch would nullify this value.
export const revalidate = 600;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Env flags are hand-edited — accept TRUE/True/1/yes and stray whitespace. */
function isFlagEnabled(raw: string | undefined): boolean {
  const value = raw?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function mockResponse(): WeatherApiResponse {
  return {
    ...MOCK_VALUES,
    source: "mock",
    simulated: true,
    simulated_fields: [...ALL_SIGNALS],
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Assemble the response from whichever signals resolved, filling the rest from
 * mock and recording exactly which ones were substituted.
 */
function buildResponse(readings: NeaWeatherReadings): WeatherApiResponse {
  const simulated_fields: WeatherSignal[] = [];

  const resolve = (signal: WeatherSignal): number => {
    const reading = readings[signal];
    if (reading === null) {
      simulated_fields.push(signal);
      return MOCK_VALUES[signal];
    }
    return round(reading.value, PRECISION[signal]);
  };

  const values = {
    temp: resolve("temp"),
    humidity: resolve("humidity"),
    psi: resolve("psi"),
    uv: resolve("uv"),
  };

  // The oldest live observation is the honest age of the payload as a whole.
  const observedTimes = ALL_SIGNALS.map((signal) => readings[signal])
    .filter((reading): reading is NeaReading => reading !== null)
    .map((reading) => Date.parse(reading.observedAt))
    .filter((time) => !Number.isNaN(time));

  const fetched_at =
    observedTimes.length > 0
      ? new Date(Math.min(...observedTimes)).toISOString()
      : new Date().toISOString();

  if (simulated_fields.length === ALL_SIGNALS.length) {
    console.warn("[weather] all NEA signals unavailable — returning full mock");
    return { ...values, source: "mock", simulated: true, simulated_fields, fetched_at };
  }

  if (simulated_fields.length > 0) {
    console.warn(`[weather] partial NEA data — simulated: ${simulated_fields.join(", ")}`);
    return { ...values, source: "partial", simulated_fields, fetched_at };
  }

  return { ...values, source: "live", simulated_fields, fetched_at };
}

export async function GET(): Promise<NextResponse<WeatherApiResponse>> {
  // Short-circuit to mock if explicitly configured.
  if (isFlagEnabled(process.env.USE_MOCK_WEATHER)) {
    return NextResponse.json(mockResponse());
  }

  try {
    const readings = await fetchAllNeaWeather();
    return NextResponse.json(buildResponse(readings));
  } catch (err) {
    // Framework control-flow signals must propagate, never be reported as weather.
    if (isFrameworkError(err)) throw err;

    // Unexpected error — never propagate a 500 to the client.
    console.error("[weather] Unexpected error:", err);
    return NextResponse.json(mockResponse());
  }
}
