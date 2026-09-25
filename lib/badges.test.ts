import { describe, expect, it } from "vitest";
import { placeBadges, type Rect } from "./badges";

const SIZE = 36;
const overlaps = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y) < SIZE;
const inside = (p: { x: number; y: number }, r: Rect) =>
  p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom;

describe("placeBadges", () => {
  it("puts a lone badge beside its box, not on it", () => {
    const box = { left: 200, top: 200, right: 260, bottom: 240 };
    const [p] = placeBadges([box], SIZE, 600, 400);
    expect(inside(p, box)).toBe(false);
    expect(Math.hypot(p.x - 230, p.y - 220)).toBeLessThan(120);
  });

  it("keeps two badges apart when their buttons are neighbours", () => {
    // POWER and "1" on a remote: small and almost touching.
    const boxes = [
      { left: 330, top: 60, right: 348, bottom: 76 },
      { left: 330, top: 80, right: 348, bottom: 96 },
    ];
    const [a, b] = placeBadges(boxes, SIZE, 600, 440);
    expect(overlaps(a, b)).toBe(false);
    boxes.forEach((box) => {
      expect(inside(a, box)).toBe(false);
      expect(inside(b, box)).toBe(false);
    });
  });

  it("stays inside the photo for a box at the edge", () => {
    const [p] = placeBadges([{ left: 0, top: 0, right: 30, bottom: 30 }], SIZE, 300, 200);
    expect(p.x).toBeGreaterThanOrEqual(SIZE / 2);
    expect(p.y).toBeGreaterThanOrEqual(SIZE / 2);
  });

  it("never covers another kept button", () => {
    const boxes = [
      { left: 100, top: 100, right: 140, bottom: 140 },
      { left: 40, top: 100, right: 80, bottom: 140 },
      { left: 160, top: 100, right: 200, bottom: 140 },
    ];
    const spots = placeBadges(boxes, SIZE, 400, 300);
    spots.forEach((p) => boxes.forEach((b) => expect(inside(p, b)).toBe(false)));
  });
});
