import { describe, expect, it } from "vitest";
import { createLimiter, visitorFrom } from "./rate-limit";

const T0 = Date.UTC(2026, 9, 1, 12, 0, 0);
const MIN = 60_000;

describe("createLimiter", () => {
  it("allows up to the per-visitor limit, then refuses", () => {
    const check = createLimiter({ perVisitor: 3, daily: 100 });
    expect([1, 2, 3].map(() => check("a", T0).ok)).toEqual([true, true, true]);
    expect(check("a", T0)).toEqual({ ok: false, reason: "visitor" });
  });

  it("counts each visitor separately", () => {
    const check = createLimiter({ perVisitor: 1, daily: 100 });
    expect(check("a", T0).ok).toBe(true);
    expect(check("b", T0).ok).toBe(true);
    expect(check("a", T0).ok).toBe(false);
  });

  it("lets a visitor back in once the window has passed", () => {
    const check = createLimiter({ perVisitor: 1, windowMs: 10 * MIN, daily: 100 });
    check("a", T0);
    expect(check("a", T0 + 9 * MIN).ok).toBe(false);
    expect(check("a", T0 + 11 * MIN).ok).toBe(true);
  });

  it("stops everyone at the daily total and resets the next UTC day", () => {
    const check = createLimiter({ perVisitor: 100, daily: 2 });
    check("a", T0);
    check("b", T0);
    expect(check("c", T0)).toEqual({ ok: false, reason: "daily" });
    expect(check("c", T0 + 24 * 60 * MIN).ok).toBe(true);
  });

  it("doesn't let refused requests count against the daily total", () => {
    const check = createLimiter({ perVisitor: 1, daily: 2 });
    check("a", T0);
    check("a", T0);
    check("a", T0);
    expect(check("b", T0).ok).toBe(true);
  });
});

describe("visitorFrom", () => {
  it("takes the first forwarded address", () => {
    expect(visitorFrom(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
  });

  it("falls back to local", () => {
    expect(visitorFrom(new Headers())).toBe("local");
  });
});
