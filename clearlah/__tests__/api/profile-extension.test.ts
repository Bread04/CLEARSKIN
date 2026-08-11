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

// Identity now resolves server-side from the request cookie. Mocked here
// because the real implementation calls next/headers cookies(), which has no
// request scope under vitest.
vi.mock("@/lib/utils/user-server", () => ({
  resolveApiUserId: vi.fn(async (id?: string) => id || "test-user-001"),
}));

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/profile/route");
  POST = mod.POST;
});

describe("POST /api/profile — E2-S5 extension", () => {
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

  describe("known_allergens", () => {
    it("accepts valid string array", async () => {
      const res = await postJSON({
        known_allergens: ["shellfish", "peanuts"],
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });

    it("rejects non-array known_allergens", async () => {
      const res = await postJSON({
        known_allergens: "shellfish",
        user_id: "test-user-001",
      });
      expect(res.status).toBe(400);
    });

    it("rejects array with non-string items", async () => {
      const res = await postJSON({
        known_allergens: [123, "shellfish"],
        user_id: "test-user-001",
      });
      expect(res.status).toBe(400);
    });

    it("accepts empty string array", async () => {
      const res = await postJSON({
        known_allergens: [],
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });
  });

  describe("daily_skincare", () => {
    it("accepts valid string", async () => {
      const res = await postJSON({
        daily_skincare: "CeraVe Moisturiser",
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });

    it("rejects non-string daily_skincare", async () => {
      const res = await postJSON({
        daily_skincare: 123,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(400);
    });

    it("accepts null daily_skincare (clear)", async () => {
      const res = await postJSON({
        daily_skincare: null,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });
  });

  describe("onboarding_step", () => {
    it("accepts valid step 1", async () => {
      const res = await postJSON({
        onboarding_step: 1,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });

    it("accepts valid step 2", async () => {
      const res = await postJSON({
        onboarding_step: 2,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });

    it("accepts valid step 3", async () => {
      const res = await postJSON({
        onboarding_step: 3,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });

    it("rejects onboarding_step 0", async () => {
      const res = await postJSON({
        onboarding_step: 0,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(400);
    });

    it("rejects onboarding_step 4", async () => {
      const res = await postJSON({
        onboarding_step: 4,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(400);
    });

    it("rejects non-number onboarding_step", async () => {
      const res = await postJSON({
        onboarding_step: "2",
        user_id: "test-user-001",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("singlish_unlocked", () => {
    it("auto-sets singlish_unlocked when onboarding_step >= 3", async () => {
      const res = await postJSON({
        onboarding_step: 3,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.profile.singlish_unlocked).toBe(true);
    });

    it("does not set singlish_unlocked when onboarding_step < 3", async () => {
      const res = await postJSON({
        onboarding_step: 1,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.profile.singlish_unlocked).toBe(false);
    });
  });

  describe("backward compatibility", () => {
    it("still accepts tracking_for", async () => {
      const res = await postJSON({
        tracking_for: "myself",
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });

    it("still accepts conditions", async () => {
      const res = await postJSON({
        conditions: ["eczema"],
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });

    it("still accepts disclaimer_acknowledged", async () => {
      const res = await postJSON({
        disclaimer_acknowledged: true,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });

    it("accepts combination of old and new fields", async () => {
      const res = await postJSON({
        tracking_for: "myself",
        known_allergens: ["shellfish"],
        onboarding_step: 1,
        user_id: "test-user-001",
      });
      expect(res.status).toBe(200);
    });
  });
});
