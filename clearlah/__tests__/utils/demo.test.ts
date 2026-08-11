import { describe, it, expect, beforeEach, afterEach } from "vitest";

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  // @ts-expect-error: clear cookie for isolation
  if (typeof document !== "undefined") {
    document.cookie = "clearlah_demo_day_offset=; Path=/; Max-Age=0";
  }
});

afterEach(() => {
  process.env = originalEnv;
});

describe("isDemoMode", () => {
  it("returns false when NEXT_PUBLIC_DEMO_MODE is not set", async () => {
    delete (process.env as Record<string, string>).NEXT_PUBLIC_DEMO_MODE;
    const { isDemoMode } = await import("@/lib/utils/demo");
    expect(isDemoMode()).toBe(false);
  });

  it("returns false when NEXT_PUBLIC_DEMO_MODE is false", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    const { isDemoMode } = await import("@/lib/utils/demo");
    expect(isDemoMode()).toBe(false);
  });

  it("returns true when NEXT_PUBLIC_DEMO_MODE is true", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    const { isDemoMode } = await import("@/lib/utils/demo");
    expect(isDemoMode()).toBe(true);
  });

  it("returns true when NEXT_PUBLIC_DEMO_MODE is 1", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "1";
    const { isDemoMode } = await import("@/lib/utils/demo");
    expect(isDemoMode()).toBe(true);
  });

  it("returns true when NEXT_PUBLIC_DEMO_MODE is yes", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "yes";
    const { isDemoMode } = await import("@/lib/utils/demo");
    expect(isDemoMode()).toBe(true);
  });
});

describe("getDemoDayOffset", () => {
  it("returns 0 when not in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    const { getDemoDayOffset } = await import("@/lib/utils/demo");
    expect(getDemoDayOffset()).toBe(0);
  });

  it("returns 0 when no cookie set (in demo mode but no offset)", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    const { getDemoDayOffset } = await import("@/lib/utils/demo");
    expect(getDemoDayOffset()).toBe(0);
  });
});

describe("getDemoToday", () => {
  it("returns today's date when not in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    const { getDemoToday } = await import("@/lib/utils/demo");
    const today = new Date().toISOString().split("T")[0];
    expect(getDemoToday()).toBe(today);
  });

  it("returns today when in demo mode with no offset", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    const { getDemoToday } = await import("@/lib/utils/demo");
    const today = new Date().toISOString().split("T")[0];
    expect(getDemoToday()).toBe(today);
  });
});

describe("getDemoDateForSave", () => {
  it("returns null when not in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    const { getDemoDateForSave } = await import("@/lib/utils/demo");
    expect(getDemoDateForSave()).toBeNull();
  });

  it("returns null in demo mode with no offset", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    const { getDemoDateForSave } = await import("@/lib/utils/demo");
    expect(getDemoDateForSave()).toBeNull();
  });
});

describe("getDemoDate", () => {
  it("returns current date when not in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    const { getDemoDate } = await import("@/lib/utils/demo");
    const now = new Date();
    const d = getDemoDate();
    expect(d.getDate()).toBe(now.getDate());
  });
});

describe("DEMO_USER_ID", () => {
  it("is a valid UUID", async () => {
    const { DEMO_USER_ID } = await import("@/lib/utils/demo");
    expect(DEMO_USER_ID).toBe("00000000-0000-0000-0000-000000000001");
  });
});

describe("UnauthenticatedError", () => {
  it("has status 401", async () => {
    const { UnauthenticatedError } = await import("@/lib/utils/demo");
    const err = new UnauthenticatedError();
    expect(err.status).toBe(401);
    expect(err.name).toBe("UnauthenticatedError");
  });
});
