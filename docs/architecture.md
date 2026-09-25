# Architecture

Three pieces, one request, no storage.

```
 caregiver's browser                      server                          Google
┌──────────────────────────┐   POST    ┌──────────────────────────┐    ┌─────────────────┐
│ page (React, one screen) │ ────────▶ │ /api/find-buttons         │ ─▶ │ Gemini 3.8 Flash │
│  photo → task → result   │  photo +  │  rate limit · validate    │    │  boxes on a      │
│  edits · print layout    │  task     │  normalise · log status   │ ◀─ │  0–1000 grid     │
└──────────────────────────┘ ◀──────── └──────────────────────────┘    └─────────────────┘
        memory only              steps           holds the API key
```

## Modules

| File | Runs in | Job |
|---|---|---|
| `components/JustTheseButtons.tsx` | browser | Holds all state in one reducer. Stages: photo → task → working → result. |
| `lib/image.ts` | browser | Decodes the photo upright (`createImageBitmap` with `imageOrientation: "from-image"`). Shrinks it to 1600 px and re-encodes it as JPEG 0.85. |
| `components/ButtonOverlay.tsx` | browser | The photo twice in one SVG (dimmed, then masked to the kept boxes), plus rings. Numbers and leader lines are drawn in pixels. Turns taps into grid points. |
| `lib/badges.ts` | browser | Places each number beside its button without covering any kept button or another number. |
| `lib/steps.ts` | browser | Pure edits: `hitTest`, `removeStep`, `addStepAt`, `moveStep`, `editInstruction` (which also clears the flag), `clearFlag`. |
| `components/StepList.tsx` | browser | Editable, reorderable steps, and the *Check this one* flag. |
| `components/PrintSheet.tsx` | browser | A print-only page: an aspect-correct SVG zoomed to the kept buttons, large steps, and a sticker strip. |
| `app/api/find-buttons/route.ts` | server | Rate limit, JSON and size checks, `findButtons()`, then a status-only log line. |
| `lib/gemini.ts` | server | One `generateContent` call. It sends the image part at high media resolution, asks for JSON against a schema, uses `LOW` thinking, and aborts after 25 s. |
| `lib/prompt.ts` | server | The instruction. It says the machine starts switched off, asks for one step per control and one setting per step, and says when to refuse. |
| `lib/schema.ts` | both | zod schemas for the request and the model reply. `normalise()` clamps boxes, fixes inverted corners, keeps at most five steps and flags low confidence. |
| `lib/rate-limit.ts` | server | Per-visitor limit (20 per 10 minutes) and a daily total (300), both in memory. |

## One request

1. The page sends `POST /api/find-buttons` with `{ image: <base64 JPEG>, mimeType: "image/jpeg", task }`.
2. The route counts the visitor. If they are over the limit it returns **429**. An image over 4 MB of base64 gets **413**, and a malformed body gets **400**.
3. `findButtons()` sends the photo and prompt. Gemini replies:

   ```json
   { "photo_usable": true, "task_possible": true, "title": "Bật điều hòa",
     "steps": [{ "box_2d": [140, 420, 205, 610], "label": "運転入/切", "label_meaning": "Bật/Tắt",
                 "action": "press", "instruction": "Nhấn nút 「運転 入/切」 (Bật/Tắt).", "confidence": "high" }] }
   ```

4. `normalise()` turns that into one of three results. On any error or timeout the route returns **502**.

   ```json
   { "status": "ok", "title": "…", "steps": [{ "id", "box", "label", "labelMeaning", "action", "instruction", "needsCheck" }], "truncated": false }
   { "status": "unusable_photo" }
   { "status": "task_not_possible" }
   ```

## The grid

Gemini gives each box as `[top, left, bottom, right]` on a 0–1000 scale, whatever the photo's real size. The overlay SVG uses `viewBox="0 0 1000 1000"` stretched over the photo, so the model's numbers are drawn exactly as returned. A tap is converted into the same grid to find which box it hit. The only other conversion is for things with a fixed on-screen size (numbers, leader lines), which are placed in pixels from the photo's measured size.

## State

| Data | Lives in | Changed by | After leaving the page |
|---|---|---|---|
| Photo (object URL + base64) | reducer | camera or file input, the sample, Retake | Gone. The URL is revoked on retake and on start again. |
| Task | reducer | text field; kept through Retake and errors | Gone |
| Steps | reducer | the route's reply, then only through `lib/steps.ts` | Gone |
| Rate-limit counters | server memory | each request | Reset on restart |

Nothing is written to disk or a database.

## Failure behaviour

| What breaks | What the caregiver sees |
|---|---|
| The photo shows no readable controls, or the file won't decode | "I can't make out the buttons in this photo. Try again closer, with the lights on." It has a **Retake** button. |
| The task can't be done with the visible controls | "I couldn't find buttons for that on this machine…" The photo stays open for tapping buttons in by hand. |
| Gemini times out, errors, or the network fails | "Something went wrong finding the buttons. Your photo is still here — try again." It has a **Try again** button. |
| Too many requests | A plain wait-and-retry message. The photo and task are kept. |
| More than five steps | The first five are kept, with a note suggesting a second card. |

## Printing

`@page { margin: 12mm }` and a 186 × 250 mm sheet fit both A4 (186 × 273 mm usable) and Letter (192 × 255 mm usable), so one layout prints on one page either way. The layout was checked by printing to PDF at both sizes.

- **Photo:** zoomed to the kept buttons, at least 55% of the photo's width, in its own proportions. It is height-led so wide washers and tall remotes both fit.
- **Colour:** everything is black on white. The rest of the photo is washed out rather than darkened, to save ink and to work on a black-and-white printer.
