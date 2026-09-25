import { describe, expect, it } from "vitest";
import { buildPrompt } from "./prompt";

describe("buildPrompt", () => {
  it("writes the card in the chosen language but keeps labels as printed", () => {
    const p = buildPrompt("turn on the air conditioner", "Vietnamese");
    expect(p).toContain("one short, plain sentence in Vietnamese");
    expect(p).toContain("exactly as written on the machine and in its own script");
    expect(p).toContain("short title in Vietnamese");
  });

  it("says the machine starts switched off — the probe's key finding", () => {
    expect(buildPrompt("wash everyday clothes")).toContain("Assume the machine starts switched off");
  });

  it("defaults to English", () => {
    expect(buildPrompt("wash everyday clothes")).toContain("one short, plain sentence in English");
  });
});
