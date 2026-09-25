import { z } from "zod";
import type { Box, FindButtonsResult, Step } from "./types";

export const MAX_STEPS = 5;
export const MAX_TASK_LENGTH = 120;
/** Base64 length cap for the photo; the page sends ~0.3–0.6 MB. */
export const MAX_IMAGE_BASE64 = 4_000_000;

export const RequestSchema = z.object({
  image: z.string().min(1),
  mimeType: z.literal("image/jpeg"),
  task: z.string().trim().min(1).max(MAX_TASK_LENGTH),
});
export type FindButtonsRequest = z.infer<typeof RequestSchema>;

/**
 * What the model is asked to return. Field descriptions travel with the JSON
 * schema, so they double as instructions at the point of use.
 */
export const ModelOutputSchema = z.object({
  photo_usable: z
    .boolean()
    .describe("False if the photo shows no machine controls clearly enough to read."),
  task_possible: z
    .boolean()
    .describe("False if the task cannot be done with the controls visible in the photo."),
  steps: z
    .array(
      z.object({
        box_2d: z
          .array(z.number())
          .min(4)
          .max(4)
          .describe(
            "[ymin, xmin, ymax, xmax] of the physical control, normalized to 0-1000.",
          ),
        label: z.string().describe("The text printed on or beside the control, as written."),
        action: z.enum(["press", "turn"]),
        instruction: z
          .string()
          .describe("One short plain-English instruction for an elderly person."),
        confidence: z
          .enum(["high", "low"])
          .describe("low if unsure this is the right control or the right position."),
      }),
    )
    .describe("The controls the task needs, in the order they are used."),
});
export type ModelOutput = z.infer<typeof ModelOutputSchema>;

export function jsonSchemaFor(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

const clamp = (n: number) => Math.min(1000, Math.max(0, Math.round(n)));

/** Clamp to the grid and put the corners the right way round. */
export function normaliseBox(raw: number[]): Box | null {
  let [ymin, xmin, ymax, xmax] = raw.map(clamp);
  if (ymin > ymax) [ymin, ymax] = [ymax, ymin];
  if (xmin > xmax) [xmin, xmax] = [xmax, xmin];
  // A box with no area can't be drawn or tapped.
  if (ymax - ymin < 2 || xmax - xmin < 2) return null;
  return [ymin, xmin, ymax, xmax];
}

/**
 * Turn the model's reply into what the page shows: valid boxes only, at most
 * five steps in the order given, low confidence surfaced as "check this one".
 */
export function normalise(
  output: ModelOutput,
  makeId: (index: number) => string = (i) => `s${i + 1}`,
): FindButtonsResult {
  if (!output.photo_usable) return { status: "unusable_photo" };
  if (!output.task_possible) return { status: "task_not_possible" };

  const steps: Step[] = [];
  for (const raw of output.steps) {
    const box = normaliseBox(raw.box_2d);
    const instruction = raw.instruction.trim();
    if (!box || !instruction) continue;
    steps.push({
      id: makeId(steps.length),
      box,
      label: raw.label.trim(),
      action: raw.action,
      instruction,
      needsCheck: raw.confidence === "low",
    });
  }

  if (steps.length === 0) return { status: "task_not_possible" };
  return {
    status: "ok",
    steps: steps.slice(0, MAX_STEPS),
    truncated: steps.length > MAX_STEPS,
  };
}
