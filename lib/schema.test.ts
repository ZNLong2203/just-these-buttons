import { describe, expect, it } from "vitest";
import { normalise, normaliseBox, type ModelOutput } from "./schema";

type RawStep = ModelOutput["steps"][number];

const step = (over: Partial<RawStep> = {}): RawStep => ({
  box_2d: [100, 100, 200, 200],
  label: "START",
  action: "press",
  instruction: "Press START.",
  confidence: "high",
  ...over,
});

const output = (steps: RawStep[], over: Partial<ModelOutput> = {}): ModelOutput => ({
  photo_usable: true,
  task_possible: true,
  steps,
  ...over,
});

describe("normaliseBox", () => {
  it("clamps to the 0–1000 grid and rounds", () => {
    expect(normaliseBox([-20, 10.6, 1200, 999.4])).toEqual([0, 11, 1000, 999]);
  });

  it("puts inverted corners the right way round", () => {
    expect(normaliseBox([300, 400, 100, 200])).toEqual([100, 200, 300, 400]);
  });

  it("drops a box with no area", () => {
    expect(normaliseBox([100, 100, 101, 300])).toBeNull();
  });
});

describe("normalise", () => {
  it("reports an unusable photo before anything else", () => {
    expect(normalise(output([step()], { photo_usable: false }))).toEqual({ status: "unusable_photo" });
  });

  it("reports an impossible task", () => {
    expect(normalise(output([step()], { task_possible: false }))).toEqual({ status: "task_not_possible" });
  });

  it("treats a reply with no usable steps as an impossible task", () => {
    expect(normalise(output([step({ instruction: "   " })]))).toEqual({ status: "task_not_possible" });
  });

  it("keeps the model's order and numbers ids by position", () => {
    const r = normalise(output([step({ label: "POWER" }), step({ label: "START" })]));
    expect(r.status).toBe("ok");
    if (r.status !== "ok") return;
    expect(r.steps.map((s) => [s.id, s.label])).toEqual([
      ["s1", "POWER"],
      ["s2", "START"],
    ]);
  });

  it("caps at five steps and says so", () => {
    const r = normalise(output(Array.from({ length: 7 }, (_, i) => step({ label: `B${i}` }))));
    expect(r.status === "ok" && r.steps.length).toBe(5);
    expect(r.status === "ok" && r.truncated).toBe(true);
  });

  it("flags low confidence as needing a check", () => {
    const r = normalise(output([step({ confidence: "low" }), step()]));
    expect(r.status === "ok" && r.steps.map((s) => s.needsCheck)).toEqual([true, false]);
  });

  it("skips a step whose box has no area without breaking numbering", () => {
    const r = normalise(output([step({ box_2d: [5, 5, 5, 5] }), step({ label: "START" })]));
    expect(r.status === "ok" && r.steps.map((s) => [s.id, s.label])).toEqual([["s1", "START"]]);
  });
});
