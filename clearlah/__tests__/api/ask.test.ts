import { describe, it, expect, vi, beforeAll } from "vitest";

const mockProfile = {
  conditions: ["eczema"],
  known_allergens: ["shellfish"],
  trigger_cache: null,
  ai_feedback_log: [],
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: mockProfile })),
              data: [],
            })),
            data: [],
          })),
          maybeSingle: vi.fn(async () => ({ data: mockProfile })),
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

vi.mock("@/lib/pattern-engine", () => ({
  detectCorrelations: vi.fn((entries: unknown[]) => {
    if (Array.isArray(entries) && entries.length < 7) {
      return { status: "insufficient_data", entries_needed: 7 - entries.length };
    }
    return [
      {
        trigger: "Shellfish",
        pillar: "food",
        confidence: 74,
        cooccurrence_count: 9,
        affected_days: ["2026-08-01", "2026-08-03"],
        explanation_template: "Shellfish appeared on 9 of your flare days (74% confidence).",
      },
    ];
  }),
}));

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/ai/ask/route");
  POST = mod.POST;
});

describe("POST /api/ai/ask", () => {
  const postJSON = (body: unknown) => {
    const req = new Request("http://localhost/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return POST(req);
  };

  it("returns a friendly message for empty question", async () => {
    const res = await postJSON({});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.answer).toBeTruthy();
  });

  it("returns a friendly message for whitespace question", async () => {
    const res = await postJSON({ question: "   " });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.answer).toBeTruthy();
  });

  it("returns a fallback message when no API key is set", async () => {
    const res = await postJSON({ question: "Can I eat laksa today?" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.answer).toBe("string");
    expect(body.answer.length).toBeGreaterThan(0);
  });

  it("accepts a valid question", async () => {
    const res = await postJSON({ question: "What are my top triggers?" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("answer");
    expect(typeof body.answer).toBe("string");
  });
});
