"use client";

export type ErrorKind = "unusable_photo" | "task_not_possible" | "unreachable" | "rate_limited";

/** The exact wording from prd.md > States and Boundaries. */
export const ERROR_COPY: Record<ErrorKind, string> = {
  unusable_photo: "I can't make out the buttons in this photo. Try again closer, with the lights on.",
  task_not_possible:
    "I couldn't find buttons for that on this machine. Try wording it differently, or tap the buttons yourself.",
  unreachable: "Something went wrong finding the buttons. Your photo is still here — try again.",
  rate_limited: "A lot of photos have been checked in the last few minutes. Wait a little and try again — your photo is still here.",
};

export function WorkingLine({ task }: { task: string }) {
  return (
    <p role="status" className="text-lg text-muted">
      Finding the buttons for <span className="text-ink">&ldquo;{task.trim()}&rdquo;</span>…
    </p>
  );
}

export function ErrorMessage({ kind, action }: { kind: ErrorKind; action?: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl border-2 border-accent/40 bg-accent-soft/70 p-4 text-lg">
      <p>{ERROR_COPY[kind]}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
