"use client";

import { CARD_LANGUAGES, type CardLanguage } from "@/lib/languages";
import { MAX_TASK_LENGTH } from "@/lib/schema";

type Props = {
  task: string;
  onTaskChange: (task: string) => void;
  language: CardLanguage;
  onLanguageChange: (language: CardLanguage) => void;
  onFind: () => void;
  working: boolean;
  primary: boolean;
};

export default function TaskStage({ task, onTaskChange, language, onLanguageChange, onFind, working, primary }: Props) {
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <label htmlFor="language-select" className="text-base text-muted">
          Write the card in
        </label>
        <select
          id="language-select"
          value={language}
          disabled={working}
          onChange={(e) => onLanguageChange(e.target.value as CardLanguage)}
          className="min-h-11 rounded-xl border-2 border-line bg-card px-3 text-lg text-ink focus:border-accent focus-visible:outline-none"
        >
          {CARD_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} lang={l.code}>
              {l.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted">— even if the machine speaks another.</span>
      </div>
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
