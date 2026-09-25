/**
 * Keeps a public demo from spending the API key dry: a per-visitor limit and
 * a daily total. In memory, so it resets when the server restarts, and on a
 * serverless host each instance counts on its own — approximate by design.
 */

export type LimitResult = { ok: true } | { ok: false; reason: "visitor" | "daily" };

export type LimiterOptions = {
  perVisitor?: number;
  windowMs?: number;
  daily?: number;
};

export function createLimiter({ perVisitor = 20, windowMs = 10 * 60_000, daily = 300 }: LimiterOptions = {}) {
  const hits = new Map<string, number[]>();
  let day = "";
  let dayCount = 0;

  return function check(visitor: string, now = Date.now()): LimitResult {
    const today = new Date(now).toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      dayCount = 0;
    }
    if (dayCount >= daily) return { ok: false, reason: "daily" };

    const recent = (hits.get(visitor) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= perVisitor) {
      hits.set(visitor, recent);
      return { ok: false, reason: "visitor" };
    }
    recent.push(now);
    hits.set(visitor, recent);
    dayCount += 1;
    return { ok: true };
  };
}

/** The caller's address as the host reports it; "local" when there is none. */
export function visitorFrom(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}
