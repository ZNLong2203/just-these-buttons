---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast (learner: "oke ổn triển đi"; can switch to learn mode at any time)

Commit messages follow this repo's Conventional Commits hook (`scripts/hooks/commit-msg`), the learner's standing convention for every project.

## Slices

- [x] **1. The model finds the right buttons, with evidence**
  Becomes usable: `npm run probe` sends about ten appliance photos with realistic tasks to Gemini and writes a contact sheet showing every returned box drawn on its photo, plus a pass/fail tally. The core prompt, schema and model call that the app will reuse all exist and are tested.
  Why now: The whole product rests on one unproven assumption: that the model can put a box on the right physical control, in the right order. It is also the learner's learning goal. Finding out now is cheap; finding out after building the interface is not. This is the one technical-layer slice the plan allows, because it proves the critical risk and leaves runnable evidence. It also bootstraps the project.
  PRD ref: `prd.md > Features and Behavior > Finding the buttons`, `prd.md > Open Questions`
  Spec ref: `spec.md > Components > Prompt`, `spec.md > Components > Vision Probe`, `spec.md > External Services and Dependencies > Gemini API`, `spec.md > Stack`, `spec.md > Decisions and Open Issues`
  Build: Scaffold Next.js 16 + TypeScript + Tailwind 4 + Vitest at the repo root per `spec.md > File Structure`. Add `.env.example` (empty values) and extend `.gitignore` for build output and `probe/`. Write `lib/types.ts`, `lib/prompt.ts`, `lib/schema.ts` (request, model output, response, `normalise()`), `lib/gemini.ts` (`findButtons()`). Confirm the `generateContent` call shape and thinking setting against SDK 2.24 first. Write `scripts/make-probe-photos.ts`, which generates about ten photorealistic appliance photos with a Gemini image model into `probe/photos/` along with `probe/cases.json`. Write `scripts/probe.ts`, which runs `findButtons()` over the cases and writes `probe/report.html`. Record the result in `docs/vision-probe.md`.
  Verify (mechanical): `npm test` passes (`normalise()` clamps, fixes inverted boxes, caps at five, maps low confidence to `needsCheck`). `npx tsc --noEmit` is clean. `npm run probe:photos` writes the photos. `npm run probe` completes for every case and writes the report. Inspect the report screenshot and count the cases where every needed control sits inside its box; record the count and the failures in `docs/vision-probe.md`.
  Learner check: Open `probe/report.html` in a browser. For each photo, look at whether the boxes sit on the buttons you would press for that task, in that order, and say how many you'd trust on a card for your grandmother.
  Commit: `feat(vision): prove the model can find the buttons a task needs`

- [x] **2. Photograph a machine, name a task, see just these buttons**
  Becomes usable: Open `http://localhost:3000`, take or choose a photo (or tap the sample washer), type a task, press **Find the buttons**, and see the same photo come back with everything dimmed except the needed controls, ringed and numbered, with the steps listed underneath. This is the kernel, working in the real interface with the planned look.
  Why now: The kernel comes before everything else in the interface. Correction and printing only matter once this moment exists, and early feedback on how it looks and feels can still shape the rest.
  PRD ref: `prd.md > The Core Journey` (steps 1–4), `prd.md > Screens and Layout`, `prd.md > Look and Feel`, `prd.md > Features and Behavior > Taking the photo`, `> Naming the task`, `> Finding the buttons`, `> Sample machine`
  Spec ref: `spec.md > Components > App shell and stages`, `> Photo stage`, `> Task stage`, `> Find-buttons route`, `> Button overlay`, `> Sample machine`, `spec.md > Look and Feel`, `spec.md > Data Model`
  Build: `app/layout.tsx` (fonts, metadata), `app/globals.css` (colour tokens, Tailwind theme), `app/page.tsx`, and `components/JustTheseButtons.tsx` with the reducer and stages. Add `PhotoStage.tsx` with `lib/image.ts`, `TaskStage.tsx`, `app/api/find-buttons/route.ts` (validation and normalising; the rate limit comes in slice 5), `ButtonOverlay.tsx` (dim layer, mask, rings, badges, dashed ring for flagged steps), and a read-only `StepList.tsx`. Add the sample washer at `public/samples/washer.jpg` with a "Sample · AI-generated photo" label. Laptop layout: photo left, steps right; phone: one column.
  Verify (mechanical): `npx tsc --noEmit` and `npm run build` pass. With the dev server running, `curl` the route with the sample washer and "wash everyday clothes" and confirm a 200 with two to four steps whose boxes are inside 0–1000. Drive the page headlessly (sample → Find the buttons), screenshot the result at laptop and phone widths, and check the dimming, rings, numbers and list agree.
  Learner check: Run `npm run dev`, open `http://localhost:3000`, tap **Try a sample washing machine**, then **Find the buttons**. Then try one photo of your own on your phone (same Wi-Fi, laptop's IP address). Say what you notice about how it looks and feels and whether the lit buttons are the right ones.
  Commit: `feat(app): photograph a machine and see just these buttons`

- [x] **3. Fix what the AI got wrong**
  Becomes usable: On the result, tapping a lit button removes it and renumbers. Tapping anywhere else adds a step there. Step text can be rewritten, steps can be moved up or down, and a **Check this one** step can be confirmed or edited to clear its flag. The photo and list always agree.
  Why now: The human check is what makes a printed card trustworthy. It needs the working overlay from slice 2, and printing needs its final, corrected steps.
  PRD ref: `prd.md > Features and Behavior > Correcting the result`, `prd.md > The Core Journey` (step 5)
  Spec ref: `spec.md > Components > Step list and editing`, `spec.md > Components > Button overlay`, `spec.md > Data Model`
  Build: `lib/steps.ts` (`hitTest`, `removeStep`, `addStepAt`, `moveStep`, `editInstruction` which also clears the flag, `clearFlag`) with `lib/steps.test.ts`. Tap-to-grid conversion and hit-testing in `ButtonOverlay.tsx`. Editable, reorderable rows in `StepList.tsx`, wired through the reducer.
  Verify (mechanical): `npm test` covers remove, add, reorder, edit-clears-flag and hit-testing at box edges. Typecheck and build pass. A headless run on the sample removes one step, adds one by clicking the photo, moves a step, and a screenshot shows the photo numbers matching the list.
  Learner check: On the sample result, tap a lit button, tap a different button, rewrite one instruction in your own words, and move a step. Check that the photo and the list stay in step with each other.
  Commit: `feat(edit): let the caregiver fix any button before printing`

- [x] **4. Print the card and stickers**
  Becomes usable: **Print card & stickers** opens the print dialog showing one page. The step card is on top (task as title, black-and-white overlay, large steps) and a strip of number stickers in two sizes with a cut line is below. None of the app's controls appear.
  Why now: The paper is the product the grandparent actually meets. It depends on the corrected steps from slice 3.
  PRD ref: `prd.md > Features and Behavior > Printing the card and stickers`, `prd.md > The Core Journey` (steps 6–7)
  Spec ref: `spec.md > Components > Print sheet`, `spec.md > Components > Button overlay` (`printMode`), `spec.md > Look and Feel` (Print)
  Build: `components/PrintSheet.tsx` and the print stylesheet in `globals.css`. Use `@page { margin: 12mm }` and a 186 × 250 mm content box; hide the app under `@media print`. `ButtonOverlay` gets `printMode`. Add the **Print card & stickers** button and **Start again**.
  Verify (mechanical): Headless Chrome prints the result to PDF at A4 and at Letter. Confirm each PDF is exactly one page, contains the corrected step text, and that a greyscale render still shows the rings and numbers.
  Learner check: Get a result, edit one step, press **Print card & stickers**, and look at the print preview (or print it). Check that the card matches your edits, reads clearly from arm's length, and the stickers are a size you could put on a real button.
  Commit: `feat(print): print the step card and number stickers on one page`

- [x] **5. Every failure has a kind answer**
  Becomes usable: A blurry or non-machine photo, an impossible task, more than five steps, a slow or unreachable model, an oversized image and too many requests each give the plain message and recovery action from the PRD. The photo and task are never lost.
  Why now: These states only make sense once the whole journey exists. They are what a judge or real caregiver hits first when trying their own photo.
  PRD ref: `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components > Status messages`, `spec.md > Components > Find-buttons route`, `spec.md > Important Failure Modes`
  Build: `components/StatusMessage.tsx` with the exact PRD copy and actions. `lib/rate-limit.ts` (per-IP and daily) wired into the route, with the 25-second timeout, the 413 size cap, and mapping 502 and network errors to *AI can't be reached*. Add the truncated-steps note. Also handle a decode failure in `lib/image.ts`.
  Verify (mechanical): Unit tests for the rate limiter. `curl` the route with a non-machine photo, an impossible task, an oversized body and a burst over the limit, and check each status. Screenshot each error state in the page with the photo and task still present.
  Learner check: Try a photo of something that isn't a machine, and a task the machine can't do (for example "make coffee" on the washer). Read the messages and say whether they'd make sense to a tired family member.
  Commit: `feat(states): answer every failure plainly and keep the caregiver's work`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2 (the kernel in the real interface), while look, feel and accuracy can still shape slices 3–5. The slice 1 probe report is also reviewed at its own learner check because it decides the prompt. *Pending: the learner stepped away after slice 1 and asked the build to continue ("cái nào làm đc cứ tiếp"); slices 1–2 learner checks are queued for their return and feed the final review.*
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: not yet done with the learner. Evidence prepared: the slice 1 vision probe (`docs/vision-probe.md`) answers the spec's useful unknown and the profile's learning goal; the learner has not reviewed it yet.
Route and stops: `devpost/app-map.html` drafted at commit 0972a37 as a reference route (`JustTheseButtons.tsx › find` → `lib/prompt.ts › buildPrompt` → `ButtonOverlay.tsx › mask`); not walked through together. Refresh after final review if code changes.
Edit outcome: not applicable yet.
Reflection: not offered yet.
Activity mode: pending (planned: focused alternative on the probe, since the learner is experienced and plan-first).

## Revisions

- Thinking level `LOW` instead of `MINIMAL` — `gemini-3.8-flash` rejects `MINIMAL` with a 400; `LOW` is its floor. Overridable with `GEMINI_THINKING`. (`spec.md > Stack`, `> External Services and Dependencies`)
- Prompt states that the machine starts switched off, gives one step per control, and always picks one setting — the probe showed the model otherwise drops power buttons, splits "press twice" into two steps, and offers "COTTON or MIX". Evidence in `docs/vision-probe.md`. (`spec.md > Components > Prompt`)
- Probe gained `PROBE_TAG` (keep reports side by side) and a word-order-tolerant label check — needed to compare settings across repeated runs, because single runs varied.
- Step numbers are placed beside their button by `lib/badges.ts`, with a leader line, instead of at each box's top-left corner — on the TV remote the corner badges covered the small neighbouring buttons they were meant to point at. Rings stay on the 0–1000 grid; numbers are placed in pixels because they have a fixed on-screen size. (`spec.md > Components > Button overlay`)
- The printed photo zooms to the kept buttons (never below 55% of the photo's width, same proportions), instead of printing the whole photo — on the TV-remote card the needed keys printed a few millimetres wide. This is a visible change to the card; flagged for the learner's review. (`prd.md > Features and Behavior > Printing the card and stickers`, `spec.md > Components > Print sheet`)
- The print overlay is its own aspect-correct SVG inside `PrintSheet` rather than `ButtonOverlay` in a `printMode` — the screen overlay measures itself in the browser to place numbers, which can't happen for a sheet that is hidden until printing. (`spec.md > Components > Button overlay`)
- "Task not possible" opens the result with no steps and the photo tappable, instead of returning to the task field — the PRD's own copy tells the caregiver to "tap the buttons yourself", which the task stage couldn't offer. Placing a button clears the message. (`prd.md > States and Boundaries`)
- Added a rate-limited message and `RATE_LIMIT` (per visitor per 10 minutes, default 20) alongside `DAILY_LIMIT`; the limit is counted before validation so malformed floods are limited too. (`spec.md > Components > Find-buttons route`)

