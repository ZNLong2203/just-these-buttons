"use client";

import { nearestOnRect, placeBadges, type Rect } from "@/lib/badges";
import type { Photo, Step } from "@/lib/types";

type Props = { photo: Photo; task: string; steps: Step[] };

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

/** Same idea as the on-screen overlay, drawn for paper: one SVG, black ink, the rest washed out. */
function PrintOverlay({ photo, steps }: { photo: Photo; steps: Step[] }) {
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
  // Sizes follow the zoom, so badges and rings print at the same physical size.
  const unit = view.width / 1000;
  const badge = 64 * unit;
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
        <filter id="print-fade">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.3" intercept="0.7" />
            <feFuncG type="linear" slope="0.3" intercept="0.7" />
            <feFuncB type="linear" slope="0.3" intercept="0.7" />
          </feComponentTransfer>
        </filter>
        <mask id="print-keep">
          <rect width={W} height={H} fill="black" />
          {rects.map((r, i) => (
            <rect key={i} x={r.left} y={r.top} width={r.right - r.left} height={r.bottom - r.top} rx={14 * unit} fill="white" />
          ))}
        </mask>
      </defs>
      <image href={photo.url} width={W} height={H} preserveAspectRatio="none" filter="url(#print-fade)" />
      <image href={photo.url} width={W} height={H} preserveAspectRatio="none" mask="url(#print-keep)" />
      {rects.map((r, i) => (
        <rect
          key={`ring-${i}`}
          x={r.left}
          y={r.top}
          width={r.right - r.left}
          height={r.bottom - r.top}
          rx={14 * unit}
          fill="none"
          stroke="#000"
          strokeWidth={7 * unit}
        />
      ))}
      {spots.map((p, i) => {
        const end = nearestOnRect(p, rects[i]);
        return (
          <g key={`badge-${i}`}>
            <line x1={p.x} y1={p.y} x2={end.x} y2={end.y} stroke="#000" strokeWidth={5 * unit} />
            <circle cx={p.x} cy={p.y} r={badge / 2} fill="#000" stroke="#fff" strokeWidth={4 * unit} />
            <text x={p.x} y={p.y} dy="0.36em" textAnchor="middle" fill="#fff" fontSize={38 * unit} fontWeight="700" fontFamily="var(--font-sans)">
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
 * Only exists on paper. One page, laid out in millimetres to fit inside both
 * A4 and US Letter: the step card on top, a strip of number stickers below.
 */
export default function PrintSheet({ photo, task, steps }: Props) {
  return (
    <div className="print-sheet" aria-hidden="true">
      <section className="print-card">
        <h2 className="print-title">{sentenceCase(task)}</h2>
        <PrintOverlay photo={photo} steps={steps} />
        <ol className="print-steps">
          {steps.map((s, i) => (
            <li key={s.id}>
              <span className="print-num">{i + 1}</span>
              <span>{s.instruction.trim()}</span>
            </li>
          ))}
        </ol>
        <p className="print-credit">Made with Just These Buttons</p>
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
