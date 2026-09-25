import { NextResponse } from "next/server";
import { findButtons } from "@/lib/gemini";
import { createLimiter, visitorFrom } from "@/lib/rate-limit";
import { MAX_IMAGE_BASE64, RequestSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 30;

const positive = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const checkLimit = createLimiter({
  perVisitor: positive(process.env.RATE_LIMIT, 20),
  daily: positive(process.env.DAILY_LIMIT, 300),
});

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  // Counted before anything else, so malformed floods are limited too.
  const limit = checkLimit(visitorFrom(request.headers));
  if (!limit.ok) return fail("rate_limited", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("bad_request", 400);
  }

  const image = (body as { image?: unknown } | null)?.image;
  if (typeof image === "string" && image.length > MAX_IMAGE_BASE64) return fail("too_large", 413);

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return fail("bad_request", 400);

  try {
    const { result, model, ms } = await findButtons({
      imageBase64: parsed.data.image,
      mimeType: parsed.data.mimeType,
      task: parsed.data.task,
      language: parsed.data.language,
    });
    // Status, count and timing only: never the photo, never the task.
    console.log(
      JSON.stringify({
        route: "find-buttons",
        status: result.status,
        steps: result.status === "ok" ? result.steps.length : 0,
        language: parsed.data.language,
        ms,
        model,
      }),
    );
    return NextResponse.json(result);
  } catch (err) {
    const name = err instanceof Error ? err.name : "unknown";
    console.error(JSON.stringify({ route: "find-buttons", status: "error", error: name }));
    return fail("unreachable", 502);
  }
}
