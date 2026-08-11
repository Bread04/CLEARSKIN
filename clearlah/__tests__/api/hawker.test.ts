import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [
              {
                id: "1",
                name_en: "Laksa",
                name_ms: "Laksa",
                name_zh: "叻沙",
                allergens: ["shellfish", "gluten"],
                category: "noodles",
                food_type: "hawker",
              },
              {
                id: "2",
                name_en: "Chicken Rice",
                name_ms: "Nasi Ayam",
                name_zh: "鸡饭",
                allergens: [],
                category: "rice",
                food_type: "hawker",
              },
            ],
          })),
        })),
        or: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [
                {
                  id: "1",
                  name_en: "Laksa",
                  name_ms: "Laksa",
                  name_zh: "叻沙",
                  allergens: ["shellfish", "gluten"],
                  category: "noodles",
                  food_type: "hawker",
                },
              ],
            })),
          })),
        })),
      })),
    })),
  })),
}));

let GET: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/hawker/route");
  GET = mod.GET;
});

describe("GET /api/hawker", () => {
  it("returns top 10 dishes when no query", async () => {
    const req = new Request("http://localhost/api/hawker");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toBeDefined();
    expect(Array.isArray(body.results)).toBe(true);
  });

  it("returns filtered results when query provided", async () => {
    const req = new Request("http://localhost/api/hawker?q=laksa");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0].name_en).toBe("Laksa");
  });

  it("includes food_type in results", async () => {
    const req = new Request("http://localhost/api/hawker?q=laksa");
    const res = await GET(req);
    const body = await res.json();
    expect(body.results[0]).toHaveProperty("food_type");
  });

  it("handles special characters in query gracefully", async () => {
    const req = new Request("http://localhost/api/hawker?q=%3Cscript%3E");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
