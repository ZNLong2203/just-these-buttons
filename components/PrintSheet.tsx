"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { nearestOnRect, placeBadges, type Rect } from "@/lib/badges";
import type { Photo, Step } from "@/lib/types";

type Props = { photo: Photo; title: string; language: string; steps: Step[] };

/**
 * The part of the photo worth printing: the kept buttons plus some context,
 * never less than 55% of the photo's width, in the photo's own proportions.
 * A remote that fills a corner of the photo becomes big enough to read.
 */
export function printRegion(rects: Rect[], W: number, H: number) {
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  const margin = 0.14 * W;
  const aspect = H / W;
  let width = Math.max(right - left + 2 * margin, (bottom - top + 2 * margin) / aspect, 0.55 * W);
  width = Math.min(width, W);
  const height = width * aspect;
  const x = Math.min(Math.max((left + right) / 2 - width / 2, 0), W - width);
  const y = Math.min(Math.max((top + bottom) / 2 - height / 2, 0), H - height);
  return { x, y, width, height };
}

const PRINT_HEIGHT_MM = 100;
const PRINT_WIDTH_MM = 186;

/** Same idea as the on-screen overlay, drawn for paper: one SVG, black ink, the rest washed out. */
function PrintOverlay({ photo, steps }: { photo: Photo; steps: Step[] }) {
  // The card is drawn twice (preview and print), so its SVG ids must differ.
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const W = 1000;
  const H = Math.round((1000 * photo.height) / photo.width);
  const pad = 12;
  const rects: Rect[] = steps.map(({ box: [y0, x0, y1, x1] }) => ({
    left: Math.max(0, x0 - pad),
    top: (Math.max(0, y0 - pad) * H) / 1000,
    right: Math.min(1000, x1 + pad),
    bottom: (Math.min(1000, y1 + pad) * H) / 1000,
  }));
  const view = printRegion(rects, W, H);
  // The photo prints 100 mm tall, or 186 mm wide if it's very wide (see .print-photo).
  // Sizing in millimetres keeps numbers and rings the same on paper for any photo shape.
  const mm = 1 / Math.min(PRINT_HEIGHT_MM / view.height, PRINT_WIDTH_MM / view.width);
  const badge = 9 * mm;
  const shifted = rects.map((r) => ({ left: r.left - view.x, top: r.top - view.y, right: r.right - view.x, bottom: r.bottom - view.y }));
  const spots = placeBadges(shifted, badge, view.width, view.height).map((p) => ({ x: p.x + view.x, y: p.y + view.y }));

  return (
    <svg
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      className="print-photo"
      role="img"
      aria-label="The machine with only the needed buttons kept"
    >
      <defs>
        <filter id={`${id}-fade`}>
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.3" intercept="0.7" />
            <feFuncG type="linear" slope="0.3" intercept="0.7" />
            <feFuncB type="linear" slope="0.3" intercept="0.7" />
          </feComponentTransfer>
        </filter>
        <mask id={`${id}-keep`}>
          <rect width={W} height={H} fill="black" />
          {rects.map((r, i) => (
            <rect key={i} x={r.left} y={r.top} width={r.right - r.left} height={r.bottom - r.top} rx={1.5 * mm} fill="white" />
          ))}
        </mask>
      </defs>
      <image href={photo.url} width={W} height={H} preserveAspectRatio="none" filter={`url(#${id}-fade)`} />
      <image href={photo.url} width={W} height={H} preserveAspectRatio="none" mask={`url(#${id}-keep)`} />
      {rects.map((r, i) => (
        <rect
          key={`ring-${i}`}
          x={r.left}
          y={r.top}
          width={r.right - r.left}
          height={r.bottom - r.top}
          rx={1.5 * mm}
          fill="none"
          stroke="#000"
          strokeWidth={0.8 * mm}
        />
      ))}
      {spots.map((p, i) => {
        const end = nearestOnRect(p, rects[i]);
        return (
          <g key={`badge-${i}`}>
            <line x1={p.x} y1={p.y} x2={end.x} y2={end.y} stroke="#000" strokeWidth={0.6 * mm} />
            <circle cx={p.x} cy={p.y} r={badge / 2} fill="#000" stroke="#fff" strokeWidth={0.5 * mm} />
            <text x={p.x} y={p.y} dy="0.36em" textAnchor="middle" fill="#fff" fontSize={5.4 * mm} fontWeight="700" fontFamily="var(--font-sans)">
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const sentenceCase = (s: string) => {
  const t = s.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/**
 * The card: one page laid out in millimetres to fit inside both A4 and US
 * Letter — the step card on top, a strip of number stickers below. Drawn by
 * the on-screen preview and by the print-only copy, so they can't disagree.
 */
export function CardSheet({ photo, title, language, steps }: Props) {
  return (
    <div className="print-sheet" lang={language}>
      <section className="print-card">
        <h2 className="print-title">{sentenceCase(title)}</h2>
        <PrintOverlay photo={photo} steps={steps} />
        <ol className="print-steps">
          {steps.map((s, i) => (
            <li key={s.id}>
              <span className="print-num">{i + 1}</span>
              <span>{s.instruction.trim()}</span>
            </li>
          ))}
        </ol>
        <p className="print-credit">
          Made with Just These Buttons
          {photo.credit && ` · Photo: ${photo.credit.author}, ${photo.credit.license}, via Wikimedia Commons`}
        </p>
      </section>

      <section className="print-stickers">
        <p>✂ Cut out. Stick each number on its real button.</p>
        <div className="print-sticker-row">
          {steps.map((s, i) => (
            <span key={`l-${s.id}`} className="print-sticker large">
              {i + 1}
            </span>
          ))}
        </div>
        <div className="print-sticker-row">
          {steps.map((s, i) => (
            <span key={`s-${s.id}`} className="print-sticker small">
              {i + 1}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Only exists on paper. */
export default function PrintSheet(props: Props) {
  return (
    <div className="print-only" aria-hidden="true">
      <CardSheet {...props} />
    </div>
  );
}

/** A4 at 96 dpi: the size the browser lays the .card-paper page out at. */
const PAGE_W = (210 / 25.4) * 96;
const PAGE_H = (297 / 25.4) * 96;

/** The card as it will print, scaled down to fit the column, following every edit. */
export function CardPreview(props: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = width / PAGE_W;

  return (
    <figure className="flex flex-col gap-2">
      <div
        ref={frame}
        aria-hidden="true"
        className="relative w-full overflow-hidden rounded-lg shadow-[0_0_0_1px_var(--line),0_18px_40px_-24px_rgb(30_27_22/0.5)]"
        style={{ height: PAGE_H * scale || undefined, aspectRatio: width ? undefined : "210 / 297" }}
      >
        {width > 0 && (
          <div className="card-paper absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
            <CardSheet {...props} />
          </div>
        )}
      </div>
      <figcaption className="text-sm text-muted">The card as it will print. It changes as you edit the steps.</figcaption>
    </figure>
  );
}
