import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: { streak: 5, streak_last_date: "2026-08-10" },
          })),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn(async () => ({ data: null })) })),
      })),
    })),
  })),
}));

vi.mock("@/lib/utils/demo", () => ({
  resolveApiUserId: vi.fn(async () => "test-user-001"),
  UnauthenticatedError: class extends Error {
    readonly status = 401;
    constructor() {
      super("Unauthenticated");
      this.name = "UnauthenticatedError";
    }
  },
}));

vi.mock("@/lib/utils/user-server", () => ({
  resolveApiUserId: vi.fn(async () => "test-user-001"),
}));

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/logs/route");
  POST = mod.POST;
});

describe("POST /api/logs", () => {
  const postJSON = (body: unknown) => {
    const req = new Request("http://localhost/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return POST(req);
  };

  it("returns 400 for missing log", async () => {
    const res = await postJSON({ weather_snapshot: {} });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 400 for missing weather_snapshot", async () => {
    const res = await postJSON({ log: {} });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("accepts a valid log entry with demo_date", async () => {
    const res = await postJSON({
      log: {
        food: { items: ["laksa"], hawker_dishes: [] },
        lifestyle: {
          sleep_hours: 7,
          stress_level: 3,
          stress_type: "work",
          exercise_minutes: 30,
          water_ml: 2000,
          caffeine_cups: 2,
          alcohol_drinks: null,
        },
        skincare: "Cetaphil",
        symptoms: { skin: 5, gut: null, respiratory: null },
        summary: "Laksa for lunch, normal day",
      },
      weather_snapshot: {
        temp: 31,
        humidity: 82,
        psi: 45,
        uv: 9,
        source: "mock",
        simulated_fields: [],
        fetched_at: new Date().toISOString(),
      },
      demo_date: "2026-08-15",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.streak).toBeGreaterThanOrEqual(1);
  });
});
