/**
 * Every change the caregiver makes to the steps goes through these pure
 * functions, so the photo and the list — which both read the same array —
 * can never disagree. A step's number is simply its position.
 */
import { MAX_STEPS } from "./schema";
import type { Box, Step } from "./types";

/** A point on the 0–1000 grid over the photo. */
export type GridPoint = { x: number; y: number };

/** How far outside a box a tap still counts as "on" it: fingers are wide. */
const TAP_SLOP = 12;
/** A tapped-in step's box, as a share of the photo's width. */
const NEW_BOX_WIDTH = 70;

/** Which step, if any, a tap landed on. The smallest box wins when boxes overlap. */
export function hitTest(steps: Step[], p: GridPoint): number {
  let best = -1;
  let bestArea = Infinity;
  steps.forEach((s, i) => {
    const [y0, x0, y1, x1] = s.box;
    const inside = p.x >= x0 - TAP_SLOP && p.x <= x1 + TAP_SLOP && p.y >= y0 - TAP_SLOP && p.y <= y1 + TAP_SLOP;
    const area = (x1 - x0) * (y1 - y0);
    if (inside && area < bestArea) {
      best = i;
      bestArea = area;
    }
  });
  return best;
}

export function removeStep(steps: Step[], id: string): Step[] {
  return steps.filter((s) => s.id !== id);
}

/**
 * Add a step centred where the caregiver tapped. `aspect` is the photo's
 * width ÷ height, so the new box comes out square on screen. Returns the
 * same array when the card is already full.
 */
export function addStepAt(steps: Step[], p: GridPoint, id: string, aspect = 1): Step[] {
  if (steps.length >= MAX_STEPS) return steps;
  const halfW = NEW_BOX_WIDTH / 2;
  const halfH = (NEW_BOX_WIDTH / 2) * aspect;
  const clampX = Math.min(Math.max(p.x, halfW), 1000 - halfW);
  const clampY = Math.min(Math.max(p.y, halfH), 1000 - halfH);
  const box: Box = [
    Math.round(clampY - halfH),
    Math.round(clampX - halfW),
    Math.round(clampY + halfH),
    Math.round(clampX + halfW),
  ];
  return [...steps, { id, box, label: "", action: "press", instruction: "Press this button.", needsCheck: false }];
}

export function moveStep(steps: Step[], id: string, by: -1 | 1): Step[] {
  const from = steps.findIndex((s) => s.id === id);
  const to = from + by;
  if (from === -1 || to < 0 || to >= steps.length) return steps;
  const next = [...steps];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Rewriting a step is the caregiver vouching for it, so it clears "check this one". */
export function editInstruction(steps: Step[], id: string, instruction: string): Step[] {
  return steps.map((s) => (s.id === id ? { ...s, instruction, needsCheck: false } : s));
}

export function clearFlag(steps: Step[], id: string): Step[] {
  return steps.map((s) => (s.id === id ? { ...s, needsCheck: false } : s));
}
