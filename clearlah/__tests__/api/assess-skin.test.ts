import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

vi.mock("@/lib/utils/user-server", () => ({
  resolveApiUserId: vi.fn(async () => "test-user-001"),
}));

vi.mock("@/lib/utils/demo", () => ({
  UnauthenticatedError: class extends Error {
    readonly status = 401;
    constructor() {
      super("Unauthenticated");
      this.name = "UnauthenticatedError";
    }
  },
}));

const mockFetch = vi.fn();

let POST: (req: Request) => Promise<Response>;

const PNG = "data:image/png;base64,iVBORw0KGgo=";

function postJSON(body: unknown) {
  return POST(
    new Request("http://localhost/api/ai/assess-skin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

function mockAiResponse(content: string | null, status = 200) {
  mockFetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify({ choices: content ? [{ message: { content } }] : [] }),
      { status, headers: { "Content-Type": "application/json" } }
    )
  );
}

beforeAll(async () => {
  vi.stubGlobal("fetch", mockFetch);
  process.env.CODEBUDDY_API_KEY = "test-key";
  const mod = await import("@/app/api/ai/assess-skin/route");
  POST = mod.POST;
});

beforeEach(() => {
  mockFetch.mockReset();
  process.env.CODEBUDDY_API_KEY = "test-key";
});

describe("POST /api/ai/assess-skin", () => {
  it("returns 400 when image is missing", async () => {
    const res = await postJSON({});
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-data-URL image", async () => {
    const res = await postJSON({ image: "not-a-data-url" });
    expect(res.status).toBe(400);
  });

  it("rejects an unsupported image MIME type", async () => {
    const res = await postJSON({ image: "data:image/svg+xml;base64,PHN2Zz4=" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an oversized image", async () => {
    const res = await postJSON({ image: "data:image/png;base64," + "a".repeat(3_200_000) });
    expect(res.status).toBe(400);
  });

  it("returns 503 when the AI key is missing", async () => {
    delete process.env.CODEBUDDY_API_KEY;
    const res = await postJSON({ image: PNG });
    expect(res.status).toBe(503);
  });

  it("returns 503 when the AI provider fails", async () => {
    mockAiResponse(null, 500);
    const res = await postJSON({ image: PNG });
    expect(res.status).toBe(503);
  });

  it("returns assessment with escalation for a severe score", async () => {
    mockAiResponse(JSON.stringify({ score: 9, indicators: ["redness"], summary: "Severe flare." }));
    const res = await postJSON({ image: PNG });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assessment).toBeTruthy();
    expect(body.assessment.score).toBe(9);
    expect(body.assessment.severity).toBe("severe");
    expect(body.assessment.escalate).toBe(true);
    expect(body.assessment.escalationReason).toBeTruthy();
    expect(body.assessment.selfCare.length).toBeGreaterThan(0);
  });

  it("escalates on urgent indicators even at a moderate score", async () => {
    mockAiResponse(JSON.stringify({ score: 5, indicators: ["weeping", "redness"], summary: "x" }));
    const res = await postJSON({ image: PNG });
    const body = await res.json();
    expect(body.assessment.escalate).toBe(true);
  });

  it("does not escalate for a moderate, non-urgent score", async () => {
    mockAiResponse(JSON.stringify({ score: 5, indicators: ["redness", "dryness"], summary: "x" }));
    const res = await postJSON({ image: PNG });
    const body = await res.json();
    expect(body.assessment.severity).toBe("moderate");
    expect(body.assessment.escalate).toBe(false);
  });

  it("returns assessment null when the image is unreadable", async () => {
    mockAiResponse(JSON.stringify({ score: null, indicators: [], summary: "unable to assess" }));
    const res = await postJSON({ image: PNG });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assessment).toBeNull();
    expect(body.message).toBeTruthy();
  });
});
