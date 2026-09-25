"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { nearestOnRect, placeBadges, type Rect } from "@/lib/badges";
import type { Box, Photo, Step } from "@/lib/types";

type Props = {
  photo: Pick<Photo, "url" | "width" | "height">;
  steps: Step[];
  working?: boolean;
};

/** Grow a box a little so the lit window shows the whole control, not a crop of it. */
function padded([y0, x0, y1, x1]: Box, by = 12): Box {
  return [Math.max(0, y0 - by), Math.max(0, x0 - by), Math.min(1000, y1 + by), Math.min(1000, x1 + by)];
}

/** A 0–1000 grid value as a percentage of the photo — the only conversion there is. */
const pct = (n: number) => `${n / 10}%`;

/** The rendered size of the photo, so numbers can be placed in real pixels. */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/**
 * The photo twice in one SVG: a dimmed copy underneath, and the original on
 * top seen only through a window at each step's box. Rings and numbers are
 * HTML on top, so they stay round whatever the photo's shape.
 */
export default function ButtonOverlay({ photo, steps, working = false }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const lit = steps.length > 0;
  const [frame, { width, height }] = useSize<HTMLDivElement>();

  // Numbers sit beside their button, never on it, never on each other.
  const badge = width < 480 ? 30 : 38;
  const rects: Rect[] = steps.map((s) => {
    const [y0, x0, y1, x1] = padded(s.box);
    return { left: (x0 / 1000) * width, top: (y0 / 1000) * height, right: (x1 / 1000) * width, bottom: (y1 / 1000) * height };
  });
  const spots = width > 0 ? placeBadges(rects, badge, width, height) : [];

  return (
    <div
      ref={frame}
      className="relative w-full overflow-hidden rounded-2xl bg-ink/5 shadow-[0_1px_0_var(--line),0_12px_32px_-18px_rgb(30_27_22/0.45)]"
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
    >
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={lit ? `Photo with ${steps.length} buttons kept and everything else dimmed` : "The machine photo"}
      >
        {lit && (
          <defs>
            <filter id={`${id}-dim`}>
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncR type="linear" slope="0.36" />
                <feFuncG type="linear" slope="0.36" />
                <feFuncB type="linear" slope="0.36" />
              </feComponentTransfer>
            </filter>
            <mask id={`${id}-keep`}>
              <rect width="1000" height="1000" fill="black" />
              {steps.map((s) => {
                const [y0, x0, y1, x1] = padded(s.box);
                return <rect key={s.id} x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx="16" fill="white" />;
              })}
            </mask>
          </defs>
        )}
        <image
          href={photo.url}
          width="1000"
          height="1000"
          preserveAspectRatio="none"
          filter={lit ? `url(#${id}-dim)` : undefined}
        />
        {lit && (
          <image href={photo.url} width="1000" height="1000" preserveAspectRatio="none" mask={`url(#${id}-keep)`} />
        )}
      </svg>

      {steps.map((s) => {
        const [y0, x0, y1, x1] = padded(s.box);
        return (
          <div
            key={s.id}
            aria-hidden="true"
            className={`absolute rounded-xl border-[3px] border-accent shadow-[0_0_0_2px_rgb(255_255_255/0.85)] sm:border-4 ${
              s.needsCheck ? "border-dashed" : ""
            }`}
            style={{ left: pct(x0), top: pct(y0), width: pct(x1 - x0), height: pct(y1 - y0) }}
          />
        );
      })}

      {spots.length > 0 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          {spots.map((p, i) => {
            const end = nearestOnRect(p, rects[i]);
            const far = Math.hypot(end.x - p.x, end.y - p.y) > badge / 2 + 4;
            return far ? (
              <g key={steps[i].id}>
                <line x1={p.x} y1={p.y} x2={end.x} y2={end.y} stroke="white" strokeWidth="5" strokeLinecap="round" />
                <line x1={p.x} y1={p.y} x2={end.x} y2={end.y} stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : null;
          })}
        </svg>
      )}

      {spots.map((p, i) => (
        <span
          key={steps[i].id}
          aria-hidden="true"
          className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent font-bold text-white shadow-[0_0_0_2px_white]"
          style={{ left: p.x, top: p.y, width: badge, height: badge, fontSize: badge * 0.48 }}
        >
          {i + 1}
        </span>
      ))}

      {working && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="scan-band h-1/2 w-full" />
        </div>
      )}
    </div>
  );
}
