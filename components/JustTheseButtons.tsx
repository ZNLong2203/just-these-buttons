"use client";

import { useReducer } from "react";
import ButtonOverlay from "./ButtonOverlay";
import PhotoStage, { PhotoInput } from "./PhotoStage";
import PrintSheet from "./PrintSheet";
import StepList from "./StepList";
import TaskStage from "./TaskStage";
import { ErrorMessage, WorkingLine, type ErrorKind } from "./StatusMessage";
import { loadSample, preparePhoto } from "@/lib/image";
import { MAX_STEPS } from "@/lib/schema";
import { addStepAt, clearFlag, editInstruction, hitTest, moveStep, removeStep, type GridPoint } from "@/lib/steps";
import type { FindButtonsResult, Photo, Step } from "@/lib/types";

const SAMPLE_PATH = "/samples/washer.jpg";
const SAMPLE_TASK = "wash everyday clothes";

type Stage = "photo" | "task" | "working" | "result";

type State = {
  stage: Stage;
  photo?: Photo;
  preparing: boolean;
  task: string;
  steps: Step[];
  truncated: boolean;
  error?: ErrorKind;
  /** The step just added by a tap, so its wording can be typed over. */
  addedId?: string;
};

type Action =
  | { type: "preparing" }
  | { type: "photo"; photo: Photo; task?: string }
  | { type: "photoFailed" }
  | { type: "task"; task: string }
  | { type: "find" }
  | { type: "found"; result: FindButtonsResult }
  | { type: "failed" }
  | { type: "steps"; steps: Step[]; addedId?: string }
  | { type: "startAgain" };

const initial: State = { stage: "photo", preparing: false, task: "", steps: [], truncated: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "preparing":
      return { ...state, preparing: true, error: undefined };
    case "photo":
      // A new photo keeps the task (Retake shouldn't make them retype it).
      return {
        ...state,
        stage: "task",
        photo: action.photo,
        preparing: false,
        task: action.task ?? state.task,
        steps: [],
        truncated: false,
        error: undefined,
      };
    case "photoFailed":
      return { ...state, preparing: false, error: "unusable_photo" };
    case "task":
      return { ...state, task: action.task };
    case "find":
      return { ...state, stage: "working", steps: [], truncated: false, error: undefined };
    case "found":
      if (action.result.status === "ok") {
        return { ...state, stage: "result", steps: action.result.steps, truncated: action.result.truncated };
      }
      return { ...state, stage: "task", error: action.result.status };
    case "failed":
      return { ...state, stage: "task", error: "unreachable" };
    case "steps":
      return { ...state, steps: action.steps, addedId: action.addedId };
    case "startAgain":
      return initial;
  }
}

let added = 0;

export default function JustTheseButtons() {
  const [state, dispatch] = useReducer(reducer, initial);
  const { photo, stage, steps } = state;
  const setSteps = (next: Step[], addedId?: string) => dispatch({ type: "steps", steps: next, addedId });

  // Tap a lit button to drop it; tap anywhere else to add a step there.
  function onTap(p: GridPoint) {
    if (!photo) return;
    const hit = hitTest(steps, p);
    if (hit >= 0) return setSteps(removeStep(steps, steps[hit].id));
    const id = `added-${++added}`;
    const next = addStepAt(steps, p, id, photo.width / photo.height);
    if (next !== steps) setSteps(next, id);
  }

  async function choosePhoto(load: () => Promise<Photo>, task?: string) {
    dispatch({ type: "preparing" });
    try {
      const next = await load();
      if (photo) URL.revokeObjectURL(photo.url);
      dispatch({ type: "photo", photo: next, task });
    } catch {
      dispatch({ type: "photoFailed" });
    }
  }

  const onFile = (file: File) => choosePhoto(() => preparePhoto(file));
  const onSample = () => choosePhoto(() => loadSample(SAMPLE_PATH), SAMPLE_TASK);

  function startAgain() {
    if (photo) URL.revokeObjectURL(photo.url);
    dispatch({ type: "startAgain" });
    window.scrollTo({ top: 0 });
  }

  async function find() {
    if (!photo) return;
    dispatch({ type: "find" });
    try {
      const res = await fetch("/api/find-buttons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: photo.base64, mimeType: photo.mimeType, task: state.task.trim() }),
      });
      if (!res.ok) throw new Error(`find-buttons ${res.status}`);
      dispatch({ type: "found", result: (await res.json()) as FindButtonsResult });
    } catch {
      dispatch({ type: "failed" });
    }
  }

  return (
    <>
    <main className="mx-auto w-full max-w-[1120px] px-4 pt-8 pb-24 sm:px-6 sm:pt-12 print:hidden">
      <header className="mb-8 sm:mb-10">
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Just These Buttons</h1>
        <p className="mt-2 text-xl text-muted">Photograph a machine. Keep only the buttons they need.</p>
      </header>

      {!photo ? (
        <div className="flex flex-col gap-4">
          <PhotoStage onFile={onFile} onSample={onSample} busy={state.preparing} />
          {state.error && <ErrorMessage kind={state.error} />}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <section aria-label="The machine" className="flex flex-col gap-3">
            <ButtonOverlay
              photo={photo}
              steps={steps}
              working={stage === "working"}
              onTap={stage === "result" ? onTap : undefined}
            />
            {stage === "result" && (
              <p className="text-base text-muted">
                {steps.length >= MAX_STEPS
                  ? "Five steps is the most a card holds. Tap a lit button to remove it."
                  : "Wrong button? Tap a lit one to remove it, or tap the right one to add it."}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PhotoInput
                id="retake-input"
                onFile={onFile}
                className="inline-flex min-h-12 cursor-pointer items-center rounded-full border-2 border-line bg-card px-5 font-semibold hover:border-ink/40 focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-accent"
              >
                Retake
              </PhotoInput>
              {photo.isSample && (
                <span className="rounded-full bg-ink/8 px-3 py-1 text-sm text-muted">Sample · AI-generated photo</span>
              )}
            </div>
          </section>

          <section aria-label="Steps" className="flex flex-col gap-6">
            <TaskStage
              task={state.task}
              onTaskChange={(task) => dispatch({ type: "task", task })}
              onFind={find}
              working={stage === "working"}
              primary={stage !== "result"}
            />
            {stage === "working" && <WorkingLine task={state.task} />}
            {state.error && (
              <ErrorMessage
                kind={state.error}
                action={
                  state.error === "unusable_photo" ? (
                    <PhotoInput
                      id="error-retake-input"
                      onFile={onFile}
                      className="inline-flex min-h-12 cursor-pointer items-center rounded-full bg-ink px-5 font-semibold text-paper"
                    >
                      Retake
                    </PhotoInput>
                  ) : undefined
                }
              />
            )}
            {stage === "result" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-bold tracking-[0.12em] text-muted uppercase">Just these buttons</h2>
                {steps.length > 0 ? (
                  <StepList
                    steps={steps}
                    focusId={state.addedId}
                    onEdit={(id, text) => setSteps(editInstruction(steps, id, text))}
                    onMove={(id, by) => setSteps(moveStep(steps, id, by))}
                    onRemove={(id) => setSteps(removeStep(steps, id))}
                    onConfirm={(id) => setSteps(clearFlag(steps, id))}
                  />
                ) : (
                  <p className="rounded-2xl border-2 border-dashed border-line p-4 text-lg text-muted">
                    No buttons kept. Tap the buttons they need on the photo, in order.
                  </p>
                )}
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={steps.length === 0}
                    className="min-h-14 rounded-full bg-accent px-8 text-lg font-bold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Print card &amp; stickers
                  </button>
                  <button
                    type="button"
                    onClick={startAgain}
                    className="min-h-12 rounded-full px-4 text-lg font-semibold text-muted underline decoration-2 underline-offset-4 hover:text-ink"
                  >
                    Start again with another machine
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
    {photo && stage === "result" && steps.length > 0 && (
      <PrintSheet photo={photo} task={state.task} steps={steps} />
    )}
    </>
  );
}
