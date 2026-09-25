import { NextResponse } from "next/server";
import { findButtons } from "@/lib/gemini";
import { MAX_IMAGE_BASE64, RequestSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const image = (body as { image?: unknown } | null)?.image;
  if (typeof image === "string" && image.length > MAX_IMAGE_BASE64) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const { result, model, ms } = await findButtons({
      imageBase64: parsed.data.image,
      mimeType: parsed.data.mimeType,
      task: parsed.data.task,
    });
    // Status, count and timing only: never the photo, never the task.
    console.log(
      JSON.stringify({
        route: "find-buttons",
        status: result.status,
        steps: result.status === "ok" ? result.steps.length : 0,
        ms,
        model,
      }),
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error(JSON.stringify({ route: "find-buttons", status: "error", error: err instanceof Error ? err.name : "unknown" }));
    return NextResponse.json({ error: "unreachable" }, { status: 502 });
  }
}
