---
doc: prd
status: approved
---

# Just These Buttons — Product Requirements

A one-page web app for a grandchild or adult child caring for an elderly grandparent: photograph one machine, name one task, and print a card and number stickers that show only the buttons that task needs.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Develops `scope.md > The Core Loop` and `scope.md > What "Working" Looks Like`.

1. The caregiver opens the link on a phone or laptop. They see the name, a one-line promise — *"Photograph a machine. Keep only the buttons they need."* — one large **Photograph the machine** button, and quieter buttons to try a real sample photo (washing machine, microwave, TV remote).
2. They take or choose a photo. It appears on the page, and underneath it a single field asks **"What should they be able to do?"** (placeholder: *wash everyday clothes*), with a **Card language** choice beside it (English by default).
3. They tap **Find the buttons**. The photo stays in view while the app works, with a line saying what it is looking for.
4. The same photo comes back with every control dimmed except the ones the task needs — usually two or three — each ringed and marked with a large number. Beneath the photo, a numbered list gives one short instruction per step, in order. Any step the AI is unsure of is marked **Check this one**.
5. The caregiver fixes anything wrong: tap a highlighted button to remove it, tap anywhere else on the photo to add a step there, rewrite a step's wording, or move a step up or down. The photo and the list stay in sync.
6. A preview of the card sits under the steps and follows every edit. They tap **Print card & stickers** and get one printed page: the step card on top and a strip of number stickers below.
7. They tape the card next to the real machine and put the number stickers on the real buttons. **Success is the grandparent doing the task from the card, without a phone.** **Start again with another machine** returns to step 1.

## Screens and Layout
- **One page, three stages stacked in order** — Photo → Task → Result. Each stage appears once the previous one is done; nothing navigates away. On a phone, everything is one column. On a laptop, the result shows the photo on the left and the steps on the right.
- **The card preview** sits in the result, below the steps: the printed page drawn to scale on screen.
- **The printed page**: a print layout of the same result, not a separate screen.

## Look and Feel
*Proposed by the agent at the learner's request; confirmed by the learner ("ổn đấy").*
- **Mood:** calm and warm, like a note left on the fridge by someone who cares — not a tech product and not a hospital form. The caregiver may be tired; nothing should feel busy.
- **Colour:** warm off-white paper background, near-black ink, and one accent — a burnt orange — used only for the buttons that stay lit and their numbers. Everything else is neutral.
- **Type:** a sturdy serif for headings and the printed card's title; a plain, highly legible sans-serif for everything else. Large sizes throughout; the printed steps are very large.
- **Controls:** big touch targets, generous spacing, plain-English labels. No gradients, sparkles, robot icons or "AI magic" styling.
- **The printed card** must still read clearly on a black-and-white printer: the lit buttons keep a thick ring and number, not just a colour.
- **Reference:** the visual companion `devpost/scope.html` already uses this direction.

## Features and Behavior

### Taking the photo
From `scope.md > The POC Boundary` ("one photo, one task").
- On a phone, **Photograph the machine** opens the rear camera; on a laptop it opens a file picker. Either way the chosen image appears on the page.
- A single line under the button says the photo is sent to an AI service to find the buttons and is not stored.
- A **Retake** control replaces the photo without losing the task text.
- As a caregiver, I want to photograph the machine where it stands so that I don't need to find a manual or model number.
  - [ ] On a phone, tapping the button offers the camera; on a laptop, it opens a file picker.
  - [ ] The chosen photo is shown on the page within a second of choosing it.

### Naming the task
- One free-text field, **"What should they be able to do?"**, with the placeholder *wash everyday clothes*.
- **Find the buttons** stays disabled until there is both a photo and some task text.
  - [ ] With no task text, the button is visibly disabled.
  - [ ] The task text reappears as the title of the printed card.

### Finding the buttons
The kernel — `scope.md > The Unique Kernel`.
- The app finds the controls on *this* photo that the task needs and puts them in the order they are used. It aims for two or three steps and never shows more than five.
- A step can be a press ("Press POWER") or a turn ("Turn the big dial to COTTON").
- Each step has a short instruction in plain words that refers to what is printed on or near the button, so the card matches the machine.
- Steps the AI is not confident about are marked **Check this one** on the list and with a dashed ring on the photo.
- As a caregiver, I want the needed buttons found and ordered for me so that I only have to check, not work it out.
  - [ ] On the sample washing machine with "wash everyday clothes", two to four steps come back, each ringed on the photo at the right control.
  - [ ] Every control not in the steps is visibly dimmed.
  - [ ] The numbers on the photo match the numbers in the list.

### Correcting the result
Human check before anything is printed — from `scope.md > What "Working" Looks Like` ("one tap fixes a wrong button").
- Tap a highlighted button → it is removed; remaining steps renumber.
- Tap any other point on the photo → a new step is added there with the text "Press this button", ready to edit.
- Each step's instruction can be edited in place.
- Each step can be moved up or down; the numbers on the photo follow.
- Resolving a **Check this one** step (editing it or tapping it as correct) clears the flag.
  - [ ] Removing, adding and reordering all update the photo and the list together.
  - [ ] An edited instruction is exactly what appears on the printed card.

### Choosing the card's language
Added after the build — `scope.md > Added After the Build`.
- A **Card language** choice sits beside the task field: English (default), Tiếng Việt, Español, Français, Deutsch, Português, 中文, 日本語, 한국어, हिन्दी.
- The card's title and every instruction are written in that language, whatever language is printed on the machine.
- Each instruction quotes the control's label **exactly as printed**, in its own script, so it can be matched by eye; when that label isn't in the card's language, its meaning follows in brackets — e.g. *Press 「運転入/切」 (On/Off).*
- The title is editable, like the steps.
- As a caregiver whose grandparent reads only Vietnamese, I want the card in Vietnamese even though the machine is labelled in Japanese, so that the grandparent can follow it and still find the right button by its shape.
  - [ ] With the Japanese air-conditioner sample and English chosen, every step quotes the Japanese label and gives its English meaning.
  - [ ] Switching to Tiếng Việt and finding again gives a Vietnamese title and Vietnamese steps that still quote the Japanese labels.
  - [ ] Vietnamese text renders in one consistent font on screen and on paper.

### Previewing the card
Added after the build — `scope.md > Added After the Build`.
- Under the steps, the card is drawn to scale exactly as it will print, and updates as steps are edited, removed, added or reordered.
  - [ ] Editing a step's wording changes the preview immediately.
  - [ ] The preview matches the printout.

### Printing the card and stickers
From `scope.md > The POC Boundary` ("a print view").
- **Print card & stickers** opens the browser's print dialog for a single page that fits A4 and US Letter.
- **Top: the step card** — the task as the title (e.g. "Washing everyday clothes"), the dimmed photo with numbered rings, and the steps in very large type.
- **Bottom: the sticker strip** — each step's number as a bold circle, in a small and a large size, with cut lines. Works on plain paper and tape, or sticker paper.
- None of the app's own controls appear on the printed page.
  - [ ] The print preview shows exactly one page containing the card and the sticker strip.
  - [ ] The steps on the printout match the corrected steps on screen.
  - [ ] Printed in black and white, the kept buttons are still clearly marked.

### Sample machine
From `scope.md > The POC Boundary` ("a sample photo so anyone can try it").
- Three sample buttons — **Washing machine**, **Microwave**, **TV remote** — each load a real, openly licensed photo from Wikimedia Commons and fill in a matching task ("wash everyday clothes", "heat a bowl of soup for one minute", "turn on the TV"). The photographer and licence are shown under the photo and printed on the card. They run the same way as a real photo. *(Learner's request after the build: real web photos rather than generated ones, for a realistic demo.)*
  - [ ] One tap on the sample gets to a result without taking any photo.

## States and Boundaries
- **First use** — only the promise, the photo button and the sample link are visible.
- **Working** — the photo stays visible with a calm "Finding the buttons for *wash everyday clothes*…" line; the controls are disabled until it finishes.
- **Result** — dimmed photo, numbered rings, step list, **Print card & stickers**, **Start again**.
- **Photo can't be used** (not a machine, too blurry or too dark) — "I can't make out the buttons in this photo. Try again closer, with the lights on." with **Retake**.
- **Task can't be done with what's visible** — "I couldn't find buttons for that on this machine. Try wording it differently, or tap the buttons yourself." The caregiver can still add steps by tapping.
- **Task would need more than five steps** — the first five are shown with a note suggesting the task be split into two cards.
- **AI can't be reached** — "Something went wrong finding the buttons. Your photo is still here — try again." The photo and task are kept.
- **Nothing persists** — refreshing or leaving the page starts over. The photo is not stored anywhere.

## Product Decisions
*The learner asked the agent to propose best-practice defaults for layout, correction and printing; this section records those proposals and the learner's earlier choices. Items become learner decisions on approval.*
- **Built for the family member, not the grandparent** — the grandparent only ever meets the paper. (Learner, scope.)
- **Web, opened by link, no install** — the learner asked for a web version. (Learner.)
- **English interface; card language chosen per card** — the learner chose English, then asked for the card's language to be independent of the machine's (Japanese machine, English card). (Learner.)
- **Washing machine and TV remote first; phones cut** — the learner's grandmother struggles with all three, but phones are a different problem. (Learner, scope.)
- **One page, stacked stages** — nothing to navigate, so a tired caregiver can't get lost. (Proposed.)
- **The caregiver always checks before printing, and uncertain steps are flagged** — the AI will sometimes be wrong about a button, and a wrong card is worse than no card. (Proposed.)
- **Two or three steps, never more than five** — a card with many steps stops being simple. (Proposed.)
- **Card and stickers on one printed page** — one print action, one sheet to handle. (Proposed.)
- **Must work on a black-and-white printer** — many homes don't have colour. (Proposed.)

## What We're Building
- The one-page flow: photo → task → result.
- AI finding and ordering the needed controls on the photo, with dimming, numbered rings and plain-word steps.
- Correcting: remove, add, edit, reorder, clear "check this one".
- The one-page print layout: step card plus number-sticker strip.
- The sample photos.
- Card language choice, with labels quoted as printed plus their meaning.
- The on-screen card preview.
- The states above.

## Deferred From the POC
- **Cover patches cut to each unused button's real size** — needs the photo's real-world scale; plain numbered stickers prove the idea. (`scope.md > Later`)
- **Reading the steps aloud** — the card is the product; audio would need a device near the machine. (`scope.md > Later`)
- **Saving the family's machines and sharing a PDF or link** — would need storage or accounts. (`scope.md > Later`)
- **Several tasks per machine on one card** — one task per card keeps the card simple; a second task is a second card.

## Possible Later Enhancements
- A QR code on the card that opens a short clip of the caregiver doing the task, for the helper or relative who isn't there every day.
- A "which machine is this?" label so a printed set of cards can be kept together.

## Non-Goals
- **Not a live camera or AR guide** — the grandparent would have to hold a phone. (`scope.md > Explicitly Cut`)
- **Not for phones or touchscreens.** (`scope.md > Explicitly Cut`)
- **No accounts or login.** (`scope.md > Explicitly Cut`)
- **Not a native app.** (`scope.md > Explicitly Cut`)
- **Not a medical or safety tool** — it simplifies everyday controls; it does not decide what is safe for the grandparent to use.
- **Not for late-stage dementia** — caregivers report that people at that stage cannot use cards at all; the target is early decline, low vision and general confusion with machines.

## Open Questions
- **How reliably can the AI find small buttons, such as on a TV remote?** Does not block `4-spec`; it is the first thing to test in `5-build`. The correction tools are the fallback either way.
- **Which sample photo?** A real washing machine photo is needed. Ideally the learner's own grandmother's machine, used with permission. Does not block `4-spec`.
