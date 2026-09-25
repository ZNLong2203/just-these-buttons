import { describe, expect, it } from "vitest";
import { addStepAt, clearFlag, editInstruction, hitTest, moveStep, removeStep } from "./steps";
import type { Box, Step } from "./types";

const step = (id: string, box: Box, over: Partial<Step> = {}): Step => ({
  id,
  box,
  label: id.toUpperCase(),
  action: "press",
  instruction: `Press ${id}.`,
  needsCheck: false,
  ...over,
});

const power = step("power", [400, 60, 540, 170]);
const dial = step("dial", [350, 290, 560, 450], { action: "turn", needsCheck: true });
const start = step("start", [380, 810, 470, 860]);
const steps = [power, dial, start];

describe("hitTest", () => {
  it("finds the step whose box was tapped", () => {
    expect(hitTest(steps, { x: 100, y: 470 })).toBe(0);
    expect(hitTest(steps, { x: 835, y: 420 })).toBe(2);
  });

  it("forgives a tap just outside the edge", () => {
    expect(hitTest(steps, { x: 865, y: 420 })).toBe(2);
  });

  it("returns -1 for a tap on nothing", () => {
    expect(hitTest(steps, { x: 600, y: 800 })).toBe(-1);
  });

  it("prefers the smaller box when boxes overlap", () => {
    const panel = step("panel", [300, 0, 700, 1000]);
    expect(hitTest([panel, start], { x: 835, y: 420 })).toBe(1);
  });
});

describe("editing", () => {
  it("removes a step and the rest renumber by position", () => {
    expect(removeStep(steps, "dial").map((s) => s.id)).toEqual(["power", "start"]);
  });

  it("adds a step centred on the tap, square on screen", () => {
    const next = addStepAt(steps, { x: 500, y: 500 }, "new", 4 / 3);
    const added = next.at(-1)!;
    expect(next).toHaveLength(4);
    expect(added.instruction).toBe("Press this button.");
    const [y0, x0, y1, x1] = added.box;
    expect((x0 + x1) / 2).toBe(500);
    expect((y0 + y1) / 2).toBe(500);
    // 70 wide on a 4:3 photo is ~93 tall on the grid: the same size on screen.
    expect(Math.abs(y1 - y0 - (x1 - x0) * (4 / 3))).toBeLessThanOrEqual(1);
  });

  it("keeps a tapped-in box inside the photo at the edge", () => {
    const [y0, x0] = addStepAt([], { x: 5, y: 5 }, "edge").at(-1)!.box;
    expect(x0).toBeGreaterThanOrEqual(0);
    expect(y0).toBeGreaterThanOrEqual(0);
  });

  it("won't add a sixth step", () => {
    const five = Array.from({ length: 5 }, (_, i) => step(`s${i}`, [0, 0, 10, 10]));
    expect(addStepAt(five, { x: 500, y: 500 }, "six")).toBe(five);
  });

  it("moves a step up and down, and not past either end", () => {
    expect(moveStep(steps, "start", -1).map((s) => s.id)).toEqual(["power", "start", "dial"]);
    expect(moveStep(steps, "power", 1).map((s) => s.id)).toEqual(["dial", "power", "start"]);
    expect(moveStep(steps, "power", -1)).toBe(steps);
    expect(moveStep(steps, "start", 1)).toBe(steps);
  });

  it("clears 'check this one' when the caregiver rewrites the step", () => {
    const next = editInstruction(steps, "dial", "Turn the big dial to COTTON.");
    expect(next[1]).toMatchObject({ instruction: "Turn the big dial to COTTON.", needsCheck: false });
  });

  it("clears the flag when they confirm it as it is", () => {
    expect(clearFlag(steps, "dial")[1].needsCheck).toBe(false);
  });
});
