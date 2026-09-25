/**
 * A control's position on the photo, as [top, left, bottom, right] on a
 * 0–1000 grid laid over the image. This is the format Gemini returns for
 * detection, and the overlay draws in the same space, so nothing converts it.
 */
export type Box = [ymin: number, xmin: number, ymax: number, xmax: number];

export type StepAction = "press" | "turn";

export type Step = {
  /** Stable key for rendering; never shown. */
  id: string;
  box: Box;
  /** The text printed on or next to the control, e.g. "START". */
  label: string;
  action: StepAction;
  /** Exactly what prints on the card. */
  instruction: string;
  /** Shown as "Check this one" until the caregiver confirms or edits it. */
  needsCheck: boolean;
};

export type FindButtonsResult =
  | { status: "ok"; steps: Step[]; truncated: boolean }
  | { status: "unusable_photo" }
  | { status: "task_not_possible" };
