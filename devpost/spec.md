---
doc: spec
status: approved
---

# Just These Buttons — Technical Spec

## How This Works, In Plain Language
There are three pieces.

1. **The web page** runs in the caregiver's browser. It takes the photo, shrinks it, shows each stage, draws the dimming and the numbered rings, handles taps, and lays out the printed page. Everything the caregiver does lives in the page's memory; refreshing starts over.
2. **One small server route**, `/api/find-buttons`. The page sends it the photo and the task. The route adds the secret API key (which must never reach the browser), asks Gemini, checks the answer is well-formed, and sends back a short list of steps.
3. **Gemini 3.8 Flash**, Google's multimodal model. It looks at the photo and returns, for each control the task needs, a box around it as four numbers on a 0–1000 grid over the photo (`[top, left, bottom, right]`), what's printed on it, and a plain instruction.

There is no database and no login. The photo passes through the route to Gemini and is never saved. Printing uses the browser's own print dialog with a print-only layout. This shape is the smallest one that keeps the API key secret and proves the kernel; anything more (storage, accounts, PDF generation) would not change what the demo shows.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Open.** Next.js serves the page. The app starts in the *photo* stage: promise, **Photograph the machine**, and three sample buttons.
2. **Photo.** The button is a file input with `accept="image/*"` and `capture="environment"`, so phones open the rear camera and laptops open a file picker. `lib/image.ts` decodes the file with the correct orientation, shrinks the long edge to 1600 px, re-encodes it as JPEG, and keeps both a display URL and the base64 bytes in memory. The *task* field appears.
3. **Task.** The caregiver types the task. **Find the buttons** enables once there is a photo and non-blank task text.
4. **Working.** The page `POST`s `{ image, mimeType, task }` to `/api/find-buttons`. The route validates the request, checks the rate limit, and calls Gemini with the photo, the prompt from `lib/prompt.ts` and a JSON schema. It validates the reply, clamps boxes to the grid, keeps at most five steps, and returns them. The page shows the *working* line with the photo still in view.
5. **Result.** `ButtonOverlay` draws the photo twice in one SVG: a dimmed copy underneath, and the original on top shown only through holes cut at each step's box. Rings and number badges sit on top; flagged steps get a dashed ring. `StepList` shows the same steps in order.
6. **Check.** A tap on the photo is converted to grid coordinates. Inside a step's box it removes that step; anywhere else it adds a step there. Edits, reorders and flag-clearing go through pure functions in `lib/steps.ts`, so the photo and the list always read from the same list of steps.
7. **Print.** **Print card & stickers** calls `window.print()`. The print stylesheet hides the app and shows `PrintSheet`: the card (task as title, the same overlay in black and white, large steps) and the sticker strip, sized in millimetres to fit A4 and Letter.

## Stack
*Recommended by the agent to match the learner's recent projects; agreed by the learner at review ("oke đc nghe ổn đấy").*

- **Next.js 16.3 (App Router) + React 19 + TypeScript** — one project holds both the page and the server route, and it is the learner's usual stack. [Docs](https://nextjs.org/docs)
- **Tailwind CSS 4.3** for styling, with its `print:` variant for the print layout. [Docs](https://tailwindcss.com/docs)
- **`@google/genai` 2.24** — Google's official SDK, calling `ai.models.generateContent` with an inline image and `responseJsonSchema`. The learner has used this exact call before. [SDK](https://googleapis.github.io/js-genai/) · [Image understanding and bounding boxes](https://ai.google.dev/gemini-api/docs/image-understanding)
- **Model: `gemini-3.8-flash`** (stable), set via `GEMINI_MODEL` so the probe can compare alternatives without code changes. [Models](https://ai.google.dev/gemini-api/docs/models)
- **zod 4** to validate the request and the model's reply. [Docs](https://zod.dev)
- **Vitest 5** for unit tests of the pure logic. [Docs](https://vitest.dev)
- **Fonts via `next/font/google`:** Atkinson Hyperlegible Next for body text and printed steps (designed by the Braille Institute for low-vision readers), Source Serif 4 for headings and the card title. [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next) · [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4)

**Unverified — check in the first build step:**
- Google's current docs show a newer `client.interactions.create` call in their examples. `generateContent` is expected to still work in SDK 2.24, but confirm it before building on it.
- Confirm the exact thinking setting for 3.8 Flash. The docs recommend minimal thinking for detection; the learner's earlier project used `thinkingLevel: "MINIMAL"`. *Checked in slice 1: `generateContent` works; 3.8 Flash rejects `MINIMAL`, so the app uses `LOW` (see `docs/vision-probe.md`).*

## Where It Runs and How Someone Tries It
- **Runtime:** Node.js 22 (installed: 22.18) and any modern browser. A phone on the same Wi-Fi can open the laptop's dev server by IP to test the camera path.
- **Keys:** `GEMINI_API_KEY` in `.env.local` (gitignored). `.env.example` ships with empty values.
- **Start:** `npm install`, then `npm run dev`, then open `http://localhost:3000`.
- **Tests:** `npm test` runs the unit tests. `npm run probe` runs the vision probe (see **Vision Probe**).
- **For the demo video:** record the laptop browser for the flow, and a phone for the real-machine shots (photographing the washing machine, taping the card up).
- **Optional deployment — agreed by the learner, live at https://just-these-buttons.vercel.app:** Vercel, with `GEMINI_API_KEY` set in project settings, so the Devpost page can carry a "Try it" link. It is never a substitute for the video. The key is on the paid tier (agreed), which stops Google using the photos to improve its products and costs about a cent per photo. The free tier's terms allow that use and would contradict the page's privacy line.

## Look and Feel
Carries forward `prd.md > Look and Feel` (confirmed by the learner).

- **Palette (light only; the paper is the metaphor):** paper `#F7F3EC` page background, card `#FFFDF8` surfaces, ink `#1E1B16` text, muted `#6B6358` secondary text, line `#E3DBCF` borders, accent burnt orange `#C2410C` used **only** for kept buttons, their numbers and the one primary action per stage. Accent-soft `#FFE9DA` for flagged-step backgrounds. Defined once as CSS variables in `globals.css` and mapped into Tailwind's theme.
- **Type:** Source Serif 4 (600) for the name, stage headings and the card title; Atkinson Hyperlegible Next for everything else. Body 18 px; step text on screen 20 px; printed card title 30 pt and steps 26 pt.
- **Density:** spacious and calm. One column on phones, max width about 1080 px on laptops with the result as photo-left / steps-right. Touch targets at least 48 px. One primary (accent) button visible at a time.
- **Overlay:** dimmed layer is the photo in greyscale at about 35 % brightness; kept buttons show in full colour through rounded holes; rings are 4 px accent, number badges are accent circles with white numerals. Dashed ring for **Check this one**.
- **Print:** pure black on white. Rings 1.5 mm black; badges black with white numerals; nothing depends on colour.
- **Copy tone:** plain, warm, second person to the caregiver, "they" for the grandparent. No "AI magic" language, no emoji, no sparkles.

## Components

### App shell and stages
`app/page.tsx` renders the client component `components/JustTheseButtons.tsx`, which owns all state through a reducer (see **Data Model**) and renders the stages in order.
PRD ref: `prd.md > The Core Journey`, `prd.md > Screens and Layout`.

### Photo stage
`components/PhotoStage.tsx` renders the promise, the photo button, the sample link, the privacy line and, once a photo exists, the photo with **Retake**. `lib/image.ts` does the browser-side work: `createImageBitmap(file, { imageOrientation: "from-image" })`, draws to a canvas at most 1600 px on the long edge, exports `image/jpeg` at quality 0.85, and returns `{ url, base64, width, height }`. A decode failure becomes the *photo can't be used* state.
PRD ref: `prd.md > Features and Behavior > Taking the photo`.

### Task stage
`components/TaskStage.tsx` renders the labelled text field ("What should they be able to do?", max 120 characters) and **Find the buttons**, disabled until there is a photo and non-blank task.
PRD ref: `prd.md > Features and Behavior > Naming the task`.

### Find-buttons route
`app/api/find-buttons/route.ts` (Node runtime, `maxDuration` 30 s):
1. Parse the body with `RequestSchema` (zod). Reject over-sized images (base64 over 4 MB) with 413.
2. Check `lib/rate-limit.ts` (per-IP: 20 requests per 10 minutes; plus a daily total from `DAILY_LIMIT`, default 300). Over the limit → 429.
3. Call `findButtons()` in `lib/gemini.ts` (server-only), which builds the request from `lib/prompt.ts` and `ModelOutputSchema`, with a 25-second timeout.
4. Validate the reply, then normalise it: clamp each box to 0–1000 and fix inverted corners, drop empty instructions, sort into order, keep at most five steps (`truncated: true` if more came back), and map `confidence: "low"` to `needsCheck: true`.
5. Return the response described under **External Services and Dependencies**. Nothing is logged except status, step count and duration.
PRD ref: `prd.md > Features and Behavior > Finding the buttons`, `prd.md > States and Boundaries`.

### Prompt
`lib/prompt.ts` builds one instruction from the task. It tells the model:
- the photo shows a household machine, and an elderly person must do the task using as few controls as possible;
- the machine starts switched off with nothing set, so a power button comes first (added after the probe showed the model otherwise assumes the machine is on);
- one step per control, with repeats written as "twice", and always one setting rather than a choice;
- return only the controls needed, in the order used — normally two or three, never more than five;
- the box must tightly cover the physical control, not its printed label;
- for a dial, the step says which setting to turn it to, reading the words printed on the machine;
- keep each instruction short and plain, quoting the printed text;
- mark `confidence: "low"` when unsure;
- set `photo_usable: false` if no controls are legible, and `task_possible: false` if the task can't be done with the visible controls.

PRD ref: `prd.md > Features and Behavior > Finding the buttons`.

### Button overlay
`components/ButtonOverlay.tsx` is one SVG with `viewBox="0 0 1000 1000"` and `preserveAspectRatio="none"`, laid over the photo's exact aspect ratio, so the model's grid maps straight onto it (x = left, y = top). It contains:
- a dimmed `<image>` (CSS filter `grayscale(1) brightness(.35)`);
- the original `<image>` clipped by a `<mask>` with one rounded rectangle per step box, padded slightly;
- a ring and number badge per step, placed at the box's top-left corner and kept inside the frame.

It accepts a `printMode` prop that switches to the black-and-white styling, so `PrintSheet` reuses the same drawing. Pointer taps become grid coordinates and are passed to `hitTest` in `lib/steps.ts`.
PRD ref: `prd.md > Features and Behavior > Finding the buttons`, `prd.md > Features and Behavior > Correcting the result`.

### Step list and editing
`components/StepList.tsx` shows the steps in order. Each row has the number, an editable instruction, move up/down controls, a **Check this one** tag when flagged, and a way to mark a flagged step correct. `lib/steps.ts` holds the pure functions: `hitTest`, `removeStep`, `addStepAt` (default box about 7 % of the photo's width, centred on the tap, instruction "Press this button"), `moveStep`, `editInstruction` (which also clears the step's flag, as the PRD requires), `clearFlag`. Numbers are always the list position, never stored.
PRD ref: `prd.md > Features and Behavior > Correcting the result`.

### Card language
`lib/languages.ts` lists the card languages (code, native name, English name). The request carries `language` (default `en`); `buildPrompt` tells the model to write the title and instructions in that language, quote each label exactly as printed, and give `label_meaning` when the label is in another language. The model also returns a short `title`. `TaskStage` holds the select; the chosen code goes on `<html lang>`-style `lang` attributes on the step list, preview and print sheet, so `:lang(vi)` switches Vietnamese text to Be Vietnam Pro (Atkinson Hyperlegible has no Vietnamese subset). CJK labels fall back to system fonts.
PRD ref: `prd.md > Features and Behavior > Choosing the card's language`.

### Card preview
`components/CardSheet.tsx` is the card's markup, used twice: scaled on screen by `components/CardPreview.tsx` (its width measured, the 186 mm sheet scaled to fit), and full size by the print-only `PrintSheet`. Sheet styles apply on screen and paper; `@media print` only decides which copy shows. SVG ids come from `useId` so the two copies don't collide.
PRD ref: `prd.md > Features and Behavior > Previewing the card`.

### Print sheet
`components/PrintSheet.tsx` is always in the page but only visible under `@media print`, while the app is hidden. `@page { margin: 12mm }`. The content box is 186 × 250 mm, which fits both A4 and Letter.
- **Card:** task as title (sentence case), the overlay in `printMode`, and numbered steps.
- **Sticker strip:** below a dashed cut line, one bold circle per step in 15 mm and 25 mm sizes.

PRD ref: `prd.md > Features and Behavior > Printing the card and stickers`.

### Sample machine
`lib/samples.ts` lists three real photos from Wikimedia Commons, resized into `public/samples/` (`washing-machine.jpg`, `microwave.jpg`, `tv-remote.jpg`), each with a task and its credit (author, licence, source). A sample loads through the same `lib/image.ts` path, carries its credit on the `Photo`, and calls the real route — the kernel is never faked. The credit is shown under the photo and printed on the card, as CC BY-SA requires. Credits: `docs/photo-credits.md`.
PRD ref: `prd.md > Features and Behavior > Sample machine`.

### Status messages
`components/StatusMessage.tsx` renders the working line and the error states with the exact copy from `prd.md > States and Boundaries`, plus the action each offers (**Retake**, **Try again**).
PRD ref: `prd.md > States and Boundaries`.

### Vision Probe
`scripts/probe.ts` (`npm run probe`) is a developer tool, not part of the app. `scripts/make-probe-photos.ts` (`npm run probe:photos`) first generates photorealistic appliance photos with a Gemini image model into `probe/photos/`. The probe reads photos and tasks from `probe/cases.json`, calls the same `findButtons()` for each, and writes `probe/report.html`: a contact sheet with each photo, its drawn boxes and the returned steps, plus a pass/fail column the learner fills in by eye. The photos and report stay out of git. A summary (hit rate, what failed and why, which model) is written to `docs/vision-probe.md`.
Serves the learner's **Desired Learning Outcome** and `prd.md > Open Questions`.

## Data Model
All state lives in the reducer in `JustTheseButtons.tsx`. Nothing is written to storage.

```ts
type Box = [ymin: number, xmin: number, ymax: number, xmax: number]; // 0–1000 grid over the photo

type Step = {
  id: string;            // stable key for React; not shown
  box: Box;
  label: string;         // text printed on/near the control, as printed, e.g. "START" or "運転入/切"
  labelMeaning?: string; // the label's meaning in the card language, when it's in another language
  action: "press" | "turn";
  instruction: string;   // what prints on the card
  needsCheck: boolean;   // "Check this one"
};

type Photo = { url: string; base64: string; mimeType: "image/jpeg"; width: number; height: number; credit?: Credit /* samples only */ };

type Stage = "photo" | "task" | "working" | "result";

type AppState = {
  stage: Stage;
  photo?: Photo;
  task: string;
  language: string;      // card language code, default "en"
  title: string;         // card title, from the model, editable
  steps: Step[];
  truncated: boolean;
  error?: { kind: "unusable_photo" | "task_not_possible" | "unreachable" | "rate_limited"; message: string };
};
```

- **Photo** comes from the file input or the sample, is updated by **Retake**, and is gone on refresh. The object URL is revoked on retake.
- **Task** is typed by the caregiver and kept across **Retake** and errors. It is gone on refresh.
- **Steps** are set by the route's reply, changed only through `lib/steps.ts`, and gone on refresh. **Start again** clears the photo, task and steps.
- **The server keeps nothing.** The rate-limit counters are in-memory and reset when the server restarts.

## File Structure
```
.
├── app/
│   ├── layout.tsx                 # fonts, metadata, <html lang="en">
│   ├── page.tsx                   # renders <JustTheseButtons/>
│   ├── globals.css                # Tailwind, colour tokens, print stylesheet
│   └── api/find-buttons/route.ts  # POST: validate → rate limit → Gemini → normalise
├── components/
│   ├── JustTheseButtons.tsx       # client; reducer; stage order
│   ├── PhotoStage.tsx
│   ├── TaskStage.tsx
│   ├── ButtonOverlay.tsx          # SVG dim + mask + rings + badges; tap → grid coords
│   ├── StepList.tsx
│   ├── PrintSheet.tsx             # print-only card + sticker strip
│   └── StatusMessage.tsx
├── lib/
│   ├── types.ts                   # Box, Step, Photo, AppState
│   ├── image.ts                   # browser: orient, shrink, encode
│   ├── steps.ts                   # pure edit functions + hitTest
│   ├── steps.test.ts
│   ├── schema.ts                  # zod: request, model output, response; normalise()
│   ├── schema.test.ts
│   ├── prompt.ts                  # the instruction sent with the photo
│   ├── gemini.ts                  # server-only SDK client + findButtons()
│   └── rate-limit.ts
├── public/samples/               # three real sample photos (CC BY-SA, credited)
├── scripts/
│   ├── make-probe-photos.ts       # generates appliance photos with a Gemini image model
│   └── probe.ts                   # vision probe → probe/report.html
├── probe/                         # gitignored: probe photos, cases.json, report
├── docs/                          # public technical docs (architecture, vision-probe results)
├── devpost/                       # Devpost learning workspace (scope, prd, spec, checklist)
├── private/                       # gitignored: strategy and drafts
├── scripts/hooks/                 # commit-msg + pre-commit guards
├── .env.example                   # GEMINI_API_KEY=, GEMINI_MODEL=, DAILY_LIMIT=
├── next.config.ts · tsconfig.json · vitest.config.ts · package.json
├── README.md
└── LICENSE
```

## External Services and Dependencies

### Gemini API
- **Call:** `ai.models.generateContent({ model, contents, config })`. `contents` is one user turn with two parts: `{ inlineData: { mimeType: "image/jpeg", data: <base64> } }` and `{ text: <prompt> }`. The config sets `responseMimeType: "application/json"`, sets `responseJsonSchema` to the model output schema below, and sets thinking to `LOW` (3.8 Flash's lowest; overridable with `GEMINI_THINKING`). The image part is sent at `MEDIA_RESOLUTION_HIGH`.
- **Model output schema:**
  ```json
  {
    "photo_usable": true,
    "task_possible": true,
    "steps": [
      { "box_2d": [412, 88, 520, 160], "label": "POWER", "action": "press",
        "instruction": "Press POWER.", "confidence": "high" }
    ]
  }
  ```
  `box_2d` is `[ymin, xmin, ymax, xmax]` on a 0–1000 grid, the format Google documents for detection.
- **Auth:** API key from [Google AI Studio](https://aistudio.google.com/apikey), server-side only.
- **Limits:** inline requests up to 20 MB total, and the app sends about 0.3–0.6 MB.
- **Cost:** paid-tier `gemini-3.8-flash` is $0.75 per 1M input tokens and $3.75 per 1M output tokens through Dec 31 2026 ([pricing](https://ai.google.dev/gemini-api/docs/pricing)). One photo plus its reply is a few thousand tokens, well under a cent.
- **Data use:** free tier content "used to improve our products"; paid tier "not used".

### The app's own route: `POST /api/find-buttons`
- **Request:** `{ "image": "<base64 JPEG, no data: prefix>", "mimeType": "image/jpeg", "task": "wash everyday clothes", "language": "en" }`
- **200, found:** `{ "status": "ok", "title": "Wash everyday clothes", "steps": [{ "id", "box", "label", "labelMeaning", "action", "instruction", "needsCheck" }], "truncated": false }`
- **200, photo unusable:** `{ "status": "unusable_photo" }`
- **200, task not possible:** `{ "status": "task_not_possible" }`
- **400** bad request · **413** image too large · **429** rate limited · **502** model failed or timed out. The page maps 502 and network errors to *AI can't be reached*.

## Important Failure Modes
- **Boxes land on the wrong control or miss a small button** (most likely on remotes). The caregiver corrects before printing, and low-confidence steps arrive flagged. The probe measures how often this happens before the demo is recorded.
- **Gemini is slow or down.** A 25-second timeout leads to "Something went wrong finding the buttons. Your photo is still here — try again." The photo and task are kept.
- **A phone photo won't decode** (an unusual format in a desktop browser) → the *photo can't be used* message with **Retake**.
- **The printout spills onto a second page.** A fixed-millimetre print layout sized to the smaller of A4 and Letter; checked in the print preview as an acceptance criterion.

## What Was Simplified and Why
- **In-memory state** instead of saved machines — nothing in the kernel needs persistence. The fuller version would need storage and probably accounts.
- **The browser's print dialog** instead of generating a PDF on the server — same printed result with no extra library. "Save as PDF" in the dialog covers sharing for now.
- **Numbered stickers in two fixed sizes** instead of cover patches cut to each button — sizing needs the photo's real-world scale, for example from a reference object of known size.
- **A tapped-in step gets a default-size box** instead of a drawn rectangle — tapping is easier on a phone, and the ring only needs to show *which* button.
- **An in-memory rate limit** instead of a shared quota store — enough to protect a demo key. A serverless deploy may run several instances, so treat the limits as approximate.
- **Light theme only** — the page is meant to feel like paper, and the printed card is always light.

## Decisions and Open Issues

**Decisions:**
- **Web app, one page, no accounts, English** — from the learner (scope, PRD).
- **Stack, model, Vercel deployment and paid-tier key** — recommended by the agent; agreed by the learner at review.
- **Generated photos for now** — the learner chose to generate appliance photos with Gemini instead of photographing machines at this stage. Tradeoff accepted: generated photos are cleaner and better lit than real ones, so probe results on them are optimistic, and the sample must be labelled as generated.
- **SVG overlay on the model's 0–1000 grid; pure edit functions; print from the same drawing** — implementation details derived from the PRD, chosen by the agent.
- **Fonts** — Atkinson Hyperlegible Next and Source Serif 4, chosen by the agent to fit the confirmed look and feel.

**The useful unknown: how far can the model's coordinates be trusted?** This is the learner's **Desired Learning Outcome**.
- *Clarified so far:* the model returns each box as `[top, left, bottom, right]` on a 0–1000 grid laid over the photo. `ButtonOverlay` uses that grid directly as its drawing space, so no conversion step can drift.
- *Agreed investigation:* the first build step runs the **Vision Probe** on at least 10 photos — washing machine, TV remote, air-conditioner remote, microwave, rice cooker — each with a realistic task. Per the learner's choice these start as Gemini-generated photos; real photos from home are added before the demo is recorded, and the report keeps the two sets apart.
- *Evidence:* `docs/vision-probe.md` records the hit rate.
- *Decision rule:*
  - If at least 8 of 10 photos have every needed control inside its ring, proceed.
  - If not, compare another model through `GEMINI_MODEL` and tighten the prompt. Lean harder on flagging and correction in the demo.

**Open issues:**
- **Real photos before the video** — generated photos unblock the build, but the probe must be re-run on real photos (and the sample swapped for one) before recording, so the demo's claims hold for real machines. Carried from `prd.md > Open Questions`.
- **SDK call shape and thinking setting for 3.8 Flash** — verify in the first build step (see **Stack**).
