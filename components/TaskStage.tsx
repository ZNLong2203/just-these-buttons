"use client";

import { MAX_TASK_LENGTH } from "@/lib/schema";

type Props = {
  task: string;
  onTaskChange: (task: string) => void;
  onFind: () => void;
  working: boolean;
  primary: boolean;
};

export default function TaskStage({ task, onTaskChange, onFind, working, primary }: Props) {
  const ready = task.trim().length > 0 && !working;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onFind();
      }}
    >
      <label htmlFor="task-input" className="font-serif text-2xl font-semibold">
        What should they be able to do?
      </label>
      <input
        id="task-input"
        type="text"
        value={task}
        maxLength={MAX_TASK_LENGTH}
        placeholder="wash everyday clothes"
        autoComplete="off"
        enterKeyHint="go"
        disabled={working}
        onChange={(e) => onTaskChange(e.target.value)}
        className="min-h-14 rounded-2xl border-2 border-line bg-card px-4 text-xl text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none disabled:opacity-70"
      />
      <button
        type="submit"
        disabled={!ready}
        className={`min-h-14 rounded-full px-8 text-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
          primary
            ? "bg-accent text-white hover:bg-accent-strong"
            : "border-2 border-ink/80 bg-transparent text-ink hover:bg-ink hover:text-paper"
        }`}
      >
        {working ? "Finding the buttons…" : "Find the buttons"}
      </button>
    </form>
  );
}
