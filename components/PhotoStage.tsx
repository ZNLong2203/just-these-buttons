"use client";

type Props = {
  onFile: (file: File) => void;
  onSample: () => void;
  busy: boolean;
};

export const PHOTO_INPUT_ID = "photo-input";

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 8h3l1.6-2.2A1.5 1.5 0 0 1 9.8 5h4.4a1.5 1.5 0 0 1 1.2.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.6" />
    </svg>
  );
}

/** A file input dressed as a button; on phones `capture` opens the rear camera. */
export function PhotoInput({ onFile, id, children, className }: { onFile: (f: File) => void; id: string; children: React.ReactNode; className: string }) {
  return (
    <label htmlFor={id} className={className}>
      {children}
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

export default function PhotoStage({ onFile, onSample, busy }: Props) {
  return (
    <section
      aria-labelledby="start-heading"
      className="rounded-3xl border-2 border-dashed border-line bg-card px-6 py-12 text-center sm:px-12 sm:py-16"
    >
      <h2 id="start-heading" className="sr-only">
        Start with a photo
      </h2>
      <p className="mx-auto max-w-md text-lg text-muted">
        A washing machine, a TV remote, a microwave. Whatever they keep getting stuck on.
      </p>
      <div className="mt-8 flex flex-col items-center gap-5">
        <PhotoInput
          id={PHOTO_INPUT_ID}
          onFile={onFile}
          className={`inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-full bg-accent px-8 text-lg font-bold text-white transition-colors hover:bg-accent-strong focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-accent ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <CameraIcon />
          Photograph the machine
        </PhotoInput>
        <button
          type="button"
          onClick={onSample}
          disabled={busy}
          className="min-h-12 rounded-full px-4 text-lg font-semibold text-accent-strong underline decoration-2 underline-offset-4 hover:text-accent disabled:opacity-60"
        >
          Try a sample washing machine
        </button>
      </div>
      <p className="mx-auto mt-10 max-w-sm text-sm text-muted">
        Your photo is sent to Google&rsquo;s Gemini to find the buttons. This app doesn&rsquo;t keep it.
      </p>
    </section>
  );
}
