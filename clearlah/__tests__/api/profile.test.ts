import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

const mockUpsertFrom = vi.fn();
const mockSelectFrom = vi.fn();

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === "users") {
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { onboarding_complete: true },
              error: null,
            }),
          })),
        })),
      };
    }
    if (table === "user_profiles") {
      return {
        upsert: mockUpsertFrom,
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: mockSelectFrom,
          })),
        })),
      };
    }
    return { upsert: vi.fn().mockResolvedValue({ error: null }) };
  }),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

vi.mock("@/lib/utils/demo", () => ({
  UnauthenticatedError: class extends Error {},
}));

vi.mock("@/lib/utils/user-server", () => ({
  resolveApiUserId: vi.fn(async (id?: string) => id || "test-user-001"),
}));

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/profile/route");
  POST = mod.POST;
});

describe("POST /api/profile — E2-S2 conditions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsertFrom.mockResolvedValue({ error: null });
    mockSelectFrom.mockResolvedValue({
      data: { tracking_for: "myself", conditions: ["eczema"] },
      error: null,
    });
  });

  const postJSON = (body: unknown) => {
    const req = new Request("http://localhost/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return POST(req);
  };

  it("accepts valid conditions array", async () => {
    const res = await postJSON({
      conditions: ["eczema", "ibs"],
      user_id: "test-user-001",
    });
    expect(res.status).toBe(200);
  });

  it("accepts single condition", async () => {
    const res = await postJSON({
      conditions: ["asthma"],
      user_id: "test-user-001",
    });
    expect(res.status).toBe(200);
  });

  it("accepts all five conditions", async () => {
    const res = await postJSON({
      conditions: ["eczema", "ibs", "food_allergy", "asthma", "other"],
      user_id: "test-user-001",
    });
    expect(res.status).toBe(200);
  });

  it("rejects empty conditions array", async () => {
    const res = await postJSON({
      conditions: [],
      user_id: "test-user-001",
    });
    expect(res.status).toBe(400);
  });

  it("rejects invalid condition values", async () => {
    const res = await postJSON({
      conditions: ["invalid-condition"],
      user_id: "test-user-001",
    });
    expect(res.status).toBe(400);
  });

  it("rejects mixed valid and invalid conditions", async () => {
    const res = await postJSON({
      conditions: ["eczema", "nonsense"],
      user_id: "test-user-001",
    });
    expect(res.status).toBe(400);
  });

  it("rejects non-array conditions", async () => {
    const res = await postJSON({
      conditions: "eczema",
      user_id: "test-user-001",
    });
    expect(res.status).toBe(400);
  });

  it("conditions POST does not overwrite existing tracking_for", async () => {
    mockSelectFrom.mockResolvedValue({
      data: { tracking_for: "myself", conditions: ["ibs"] },
      error: null,
    });

    const res = await postJSON({
      conditions: ["eczema"],
      user_id: "test-user-001",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.conditions).toEqual(["eczema"]);
  });

  it("conditions POST works against existing profile", async () => {
    mockSelectFrom.mockResolvedValue({
      data: { tracking_for: "someone_else", conditions: null },
      error: null,
    });

    const res = await postJSON({
      conditions: ["asthma", "other"],
      user_id: "test-user-001",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.conditions).toEqual(["asthma", "other"]);
  });

  it("rejects conditions with non-string items in array", async () => {
    const res = await postJSON({
      conditions: [123, true],
      user_id: "test-user-001",
    });
    expect(res.status).toBe(400);
  });

  it("returns profile in response on success", async () => {
    const res = await postJSON({
      conditions: ["eczema"],
      user_id: "test-user-001",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.profile).toBeDefined();
    expect(body.profile.conditions).toEqual(["eczema"]);
  });
});
