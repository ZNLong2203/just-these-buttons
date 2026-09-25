"use client";

import { useReducer } from "react";
import ButtonOverlay from "./ButtonOverlay";
import PhotoStage, { PhotoInput } from "./PhotoStage";
import StepList from "./StepList";
import TaskStage from "./TaskStage";
import { ErrorMessage, WorkingLine, type ErrorKind } from "./StatusMessage";
import { loadSample, preparePhoto } from "@/lib/image";
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
};

type Action =
  | { type: "preparing" }
  | { type: "photo"; photo: Photo; task?: string }
  | { type: "photoFailed" }
  | { type: "task"; task: string }
  | { type: "find" }
  | { type: "found"; result: FindButtonsResult }
  | { type: "failed" };

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
  }
}

export default function JustTheseButtons() {
  const [state, dispatch] = useReducer(reducer, initial);
  const { photo, stage } = state;

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
    <main className="mx-auto w-full max-w-[1120px] px-4 pt-8 pb-24 sm:px-6 sm:pt-12">
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
            <ButtonOverlay photo={photo} steps={state.steps} working={stage === "working"} />
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
                <StepList steps={state.steps} />
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
