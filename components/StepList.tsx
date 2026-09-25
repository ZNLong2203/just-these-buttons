"use client";

import { useEffect, useRef } from "react";
import type { Step } from "@/lib/types";

type Props = {
  steps: Step[];
  onEdit: (id: string, instruction: string) => void;
  onMove: (id: string, by: -1 | 1) => void;
  onRemove: (id: string) => void;
  onConfirm: (id: string) => void;
  /** A just-added step, whose wording should be ready to type over. */
  focusId?: string;
};

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-11 place-items-center rounded-full text-muted hover:bg-ink/6 hover:text-ink disabled:opacity-25 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

const Arrow = ({ up }: { up?: boolean }) => (
  <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d={up ? "M5 12l5-5 5 5" : "M5 8l5 5 5-5"} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Cross = () => (
  <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
  </svg>
);

export default function StepList({ steps, onEdit, onMove, onRemove, onConfirm, focusId }: Props) {
  const inputs = useRef(new Map<string, HTMLTextAreaElement>());

  useEffect(() => {
    if (!focusId) return;
    const el = inputs.current.get(focusId);
    el?.focus();
    el?.select();
  }, [focusId]);

  return (
    <ol className="flex flex-col gap-3" aria-label="Steps">
      {steps.map((s, i) => (
        <li
          key={s.id}
          className={`flex items-start gap-3 rounded-2xl border-2 bg-card py-3 pr-2 pl-4 ${
            s.needsCheck ? "border-dashed border-accent bg-accent-soft/60" : "border-line"
          }`}
        >
          <span
            className="mt-1.5 grid size-10 shrink-0 place-items-center rounded-full bg-accent text-lg font-bold text-white"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <label htmlFor={`step-${s.id}`} className="sr-only">
              Step {i + 1} instruction
            </label>
            <textarea
              id={`step-${s.id}`}
              rows={1}
              ref={(el) => {
                if (el) inputs.current.set(s.id, el);
                else inputs.current.delete(s.id);
              }}
              value={s.instruction}
              maxLength={80}
              onChange={(e) => onEdit(s.id, e.target.value.replace(/\n/g, " "))}
              onKeyDown={(e) => {
                // One line per step on the card; Enter just finishes editing.
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className="field-sizing-content w-full resize-none rounded-md border-b-2 border-transparent bg-transparent py-1.5 text-xl leading-snug font-semibold text-ink hover:border-line focus:border-accent focus-visible:outline-none"
            />
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
              {s.label && (
                <span>
                  {s.action === "turn" ? "Dial" : "Button"}: {s.label}
                </span>
              )}
              {s.needsCheck && (
                <>
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold tracking-wide text-white uppercase">
                    Check this one
                  </span>
                  <button
                    type="button"
                    onClick={() => onConfirm(s.id)}
                    className="min-h-9 rounded-full border-2 border-accent/50 px-3 font-semibold text-accent-strong hover:bg-card"
                  >
                    Looks right
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <IconButton label={`Move step ${i + 1} up`} onClick={() => onMove(s.id, -1)} disabled={i === 0}>
              <Arrow up />
            </IconButton>
            <IconButton label={`Move step ${i + 1} down`} onClick={() => onMove(s.id, 1)} disabled={i === steps.length - 1}>
              <Arrow />
            </IconButton>
            <IconButton label={`Remove step ${i + 1}`} onClick={() => onRemove(s.id)}>
              <Cross />
            </IconButton>
          </div>
        </li>
      ))}
    </ol>
  );
}
