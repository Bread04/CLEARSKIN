import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/utils/demo", () => ({
  getActiveUserId: vi.fn((id?: string) => id || "test-user-001"),
  UnauthenticatedError: class extends Error {},
}));

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/ai/parse-log/route");
  POST = mod.POST;
});

describe("POST /api/ai/parse-log", () => {
  const postJSON = (body: unknown) => {
    const req = new Request("http://localhost/api/ai/parse-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return POST(req);
  };

  it("returns 400 for missing message", async () => {
    const res = await postJSON({});
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("ai_unavailable");
  });

  it("returns 400 for empty message", async () => {
    const res = await postJSON({ message: "" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/ai/parse-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 503 when no API key configured (basic fallback)", async () => {
    const res = await postJSON({ message: "Had laksa for lunch, stressed from work" });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("ai_unavailable");
    expect(body.partial).toBeDefined();
    expect(body.partial.food).toBeDefined();
  });

  it("includes condition context in system prompt (no crash)", async () => {
    const res = await postJSON({
      message: "Ate chicken rice, skin itchy",
      userProfile: {
        conditions: ["eczema"],
        known_allergens: ["shellfish"],
      },
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("ai_unavailable");
  });

  it("basic fallback detects hawker dishes", async () => {
    const res = await postJSON({ message: "Had laksa and chicken rice for lunch" });
    const body = await res.json();
    expect(body.partial.food.hawker_dishes).toContain("Laksa");
    expect(body.partial.food.hawker_dishes).toContain("Chicken rice");
  });

  it("basic fallback detects sleep hours", async () => {
    const res = await postJSON({ message: "Slept 7.5 hours, feeling good" });
    const body = await res.json();
    expect(body.partial.lifestyle.sleep_hours).toBe(7.5);
  });

  it("basic fallback detects stress level from number", async () => {
    const res = await postJSON({ message: "Stressed level 4 from work" });
    const body = await res.json();
    expect(body.partial.lifestyle.stress_level).toBe(4);
  });

  it("basic fallback detects skincare products", async () => {
    const res = await postJSON({
      message: "Used Cetaphil and CeraVe moisturiser today",
    });
    const body = await res.json();
    expect(body.partial.skincare).toMatch(/cetaphil/i);
    expect(body.partial.skincare).toMatch(/cerave/i);
  });

  it("basic fallback detects skin symptom severity", async () => {
    const res = await postJSON({ message: "Skin itching badly, severity 8" });
    const body = await res.json();
    expect(body.partial.symptoms.skin).toBe(8);
  });

  it("returns empty partial on unparseable input", async () => {
    const res = await postJSON({ message: "ok" });
    const body = await res.json();
    expect(body.partial.food.items).toEqual(["ok"]);
  });
});
