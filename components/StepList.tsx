"use client";

import type { Step } from "@/lib/types";

type Props = { steps: Step[] };

export default function StepList({ steps }: Props) {
  return (
    <ol className="flex flex-col gap-3" aria-label="Steps">
      {steps.map((s, i) => (
        <li
          key={s.id}
          className={`flex items-start gap-4 rounded-2xl border-2 bg-card p-4 ${
            s.needsCheck ? "border-dashed border-accent bg-accent-soft/60" : "border-line"
          }`}
        >
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-lg font-bold text-white"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xl leading-snug font-semibold">
              <span className="sr-only">Step {i + 1}: </span>
              {s.instruction}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>
                {s.action === "turn" ? "Dial" : "Button"}: {s.label}
              </span>
              {s.needsCheck && (
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold tracking-wide text-white uppercase">
                  Check this one
                </span>
              )}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
