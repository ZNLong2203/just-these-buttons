/**
 * Where to put each step's number so it never hides a kept button or another
 * number. Works in pixels of the rendered photo, because a badge has a fixed
 * size on screen while the photo's boxes scale with it.
 */

export type Rect = { left: number; top: number; right: number; bottom: number };
export type Point = { x: number; y: number };

const GAP = 6;

function circleHitsRect(c: Point, r: number, rect: Rect): boolean {
  const nx = Math.max(rect.left, Math.min(c.x, rect.right));
  const ny = Math.max(rect.top, Math.min(c.y, rect.bottom));
  return (c.x - nx) ** 2 + (c.y - ny) ** 2 < r * r;
}

/** Nearest point on a rectangle's edge to p (for the leader line). */
export function nearestOnRect(p: Point, rect: Rect): Point {
  return {
    x: Math.max(rect.left, Math.min(p.x, rect.right)),
    y: Math.max(rect.top, Math.min(p.y, rect.bottom)),
  };
}

/**
 * Greedy placement in step order: try spots around each box, nearest first,
 * and take the first that stays inside the photo and clears every kept box
 * and every badge already placed. If nothing fits, sit at the box's top-left.
 */
export function placeBadges(boxes: Rect[], size: number, width: number, height: number): Point[] {
  const r = size / 2;
  const placed: Point[] = [];

  for (const box of boxes) {
    const cx = (box.left + box.right) / 2;
    const cy = (box.top + box.bottom) / 2;
    const candidates: Point[] = [];
    for (const d of [r + GAP, size + r + GAP, 2 * size + r + GAP]) {
      const diag = d * 0.75;
      candidates.push(
        { x: box.left - d, y: cy },
        { x: box.right + d, y: cy },
        { x: cx, y: box.top - d },
        { x: cx, y: box.bottom + d },
        { x: box.left - diag, y: box.top - diag },
        { x: box.right + diag, y: box.top - diag },
        { x: box.left - diag, y: box.bottom + diag },
        { x: box.right + diag, y: box.bottom + diag },
      );
    }

    const fits = (c: Point) =>
      c.x >= r && c.x <= width - r && c.y >= r && c.y <= height - r &&
      boxes.every((b) => !circleHitsRect(c, r + 2, b)) &&
      placed.every((p) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2 >= (size + 4) ** 2);

    const spot = candidates.find(fits) ?? {
      x: Math.min(Math.max(box.left, r), width - r),
      y: Math.min(Math.max(box.top, r), height - r),
    };
    placed.push(spot);
  }
  return placed;
}
