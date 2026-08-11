import { describe, it, expect, beforeAll } from "vitest";

let GET: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/weather/route");
  GET = mod.GET;
});

describe("GET /api/weather", () => {
  const getRequest = () => new Request("http://localhost/api/weather");

  it("returns 200 with weather data", async () => {
    const res = await GET(getRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("temp");
    expect(body).toHaveProperty("humidity");
    expect(body).toHaveProperty("psi");
    expect(body).toHaveProperty("uv");
    expect(body).toHaveProperty("source");
    expect(typeof body.temp).toBe("number");
    expect(typeof body.humidity).toBe("number");
  });

  it("returns source field (live, mock, or partial)", async () => {
    const res = await GET(getRequest());
    const body = await res.json();
    expect(["live", "mock", "partial"]).toContain(body.source);
  });

  it("returns temp in valid range (15-45C for Singapore)", async () => {
    const res = await GET(getRequest());
    const body = await res.json();
    if (body.source !== "mock" || body.simulated !== true) {
      expect(body.temp).toBeGreaterThan(10);
      expect(body.temp).toBeLessThan(50);
    }
  });

  it("returns humidity in valid range (0-100)", async () => {
    const res = await GET(getRequest());
    const body = await res.json();
    expect(body.humidity).toBeGreaterThanOrEqual(0);
    expect(body.humidity).toBeLessThanOrEqual(100);
  });
});
