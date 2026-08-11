import { describe, it, expect, vi, beforeAll } from "vitest";

const mockProfile = {
  ai_feedback_log: [
    {
      message: "had laksa",
      parsed: { food: { items: ["laksa"] } },
      rating: "accurate",
      corrections: null,
      timestamp: "2026-08-10T00:00:00Z",
    },
  ],
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: mockProfile })),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: null })),
        })),
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
  const mod = await import("@/app/api/ai/feedback/route");
  POST = mod.POST;
});

describe("POST /api/ai/feedback", () => {
  const postJSON = (body: unknown) => {
    const req = new Request("http://localhost/api/ai/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return POST(req);
  };

  it("returns 400 for missing original_message", async () => {
    const res = await postJSON({ parsed_result: {}, rating: "accurate" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.stored).toBe(false);
  });

  it("returns 400 for missing parsed_result", async () => {
    const res = await postJSON({ original_message: "hello", rating: "accurate" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.stored).toBe(false);
  });

  it("returns 400 for missing rating", async () => {
    const res = await postJSON({ original_message: "hello", parsed_result: {} });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.stored).toBe(false);
  });

  it("stores an accurate rating", async () => {
    const res = await postJSON({
      original_message: "had laksa today",
      parsed_result: { food: { items: ["laksa"] } },
      rating: "accurate",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stored).toBe(true);
    expect(body.accuracy_rate).toBeGreaterThan(0);
  });

  it("stores an inaccurate rating with corrections", async () => {
    const res = await postJSON({
      original_message: "had chicken rice",
      parsed_result: { food: { items: ["prawn mee"] } },
      rating: "inaccurate",
      corrections: { food: { items: ["chicken rice"] } },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stored).toBe(true);
  });
});
