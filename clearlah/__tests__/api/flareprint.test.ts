import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                data: [
                  {
                    logged_at: "2026-08-10",
                    location: { lat: 1.3039, lng: 103.8318 },
                    symptoms: { skin: 8, gut: null, respiratory: null },
                    food: { items: [{ name: "laksa" }], hawker_dishes: ["Laksa"] },
                    weather_snapshot: { humidity: 88, psi: 45, uv: 9, temp: 31 },
                  },
                ],
              })),
            })),
          })),
        })),
        maybeSingle: vi.fn(() => ({ data: null })),
      })),
    })),
  })),
}));

vi.mock("@/lib/utils/user-server", () => ({
  resolveApiUserId: vi.fn(() => "test-user-id"),
}));

describe("GET /api/flareprint/personal", () => {
  it("returns flares array with location data", async () => {
    const { GET } = await import("@/app/api/flareprint/personal/route");
    const req = new Request("http://localhost:3000/api/flareprint/personal?days=30");
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("flares");
    expect(Array.isArray(body.flares)).toBe(true);
    expect(body.flares[0]).toHaveProperty("lat");
    expect(body.flares[0]).toHaveProperty("lng");
    expect(body.flares[0]).toHaveProperty("severity");
  });
});
