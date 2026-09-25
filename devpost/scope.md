---
doc: scope
status: approved
---

# Just These Buttons

A web app, opened by link in any phone or laptop browser with nothing to install: photograph a machine your grandparent struggles with, say what they need to do, and get back a version of that machine with only the buttons that matter — as a picture, a printed card and stickers.

## The Unique Kernel
It doesn't teach the grandparent a new app — it edits the machine they already own. AI finds the two or three buttons one task needs on a photo of the real device, everything else fades away, and the result leaves the screen as paper that lives on the machine itself. The grandparent never touches a phone.

## Who It's For
A grandchild or adult child who looks after an elderly grandparent whose health or memory is failing, and who keeps getting stuck on everyday machines — the washing machine, the TV remote. Today families improvise: caregivers on dementia forums describe taping paper over unused buttons, dabbing on correction fluid, drawing a red dot on START, or writing notes that don't match what the buttons actually say. People in this situation often cannot learn a new, "simpler" machine, so the one they have needs to become simple.

## The Core Loop
The caregiver opens the page, photographs one machine, and types the one thing their grandparent needs to do with it ("wash everyday clothes", "turn on the TV and find the news"). They get the same photo back with only the needed buttons lit and numbered in order, fix any button the AI got wrong, and print. They come back for the next machine, or the next task on the same one.

## Inspiration & Identity
Not discussed yet — `3-prd` will ask. References gathered so far:
- What families do by hand today: [Alzheimer's Society forum — simple washing machine](https://forum.alzheimers.org.uk/threads/simple-to-use-washing-machine.21781/), [washing machines](https://forum.alzheimers.org.uk/threads/washing-machines%E2%80%A6.132410/), [TV remote](https://forum.alzheimers.org.uk/threads/unable-to-use-television-remote.110176/)
- Contrast: [Vite Vere](https://ai.google.dev/competition/projects/vite-vere), Be My AI and Seeing AI give step-by-step help through a phone — which the person has to hold and operate themselves.

## Why This Matters to the Learner
"I want to make it for grandparents and older people, because my grandmother is ill too." She struggles with the washing machine, her phone and the TV.

## What "Working" Looks Like
On a phone or laptop, the caregiver opens the web page, photographs a washing machine (or taps a sample photo), and types "wash everyday clothes". Within seconds the same photo comes back with every control greyed out except the two or three that matter, each marked with a large 1, 2, 3 and a one-line instruction. One tap fixes a wrong button. Print produces a large-print step card and a sheet of number stickers.

The "oh, that's cool" beat: a machine with twenty-odd buttons becomes a machine with two — on a photo of *that* machine — and then the printed card is taped up next to the real one.

## The POC Boundary
- One photo, one task, one result at a time.
- AI locates and orders the needed buttons; the caregiver can correct them.
- A print view: the step card and a sheet of numbered stickers.
- A sample photo so anyone can try it without a machine to hand.
- English interface and English card.
- No accounts; nothing saved between visits.

## Later
- Cover patches cut to each unused button's real size.
- The card in the grandparent's own language (for example Vietnamese), even when the machine is labelled in English.
- Reading the steps aloud.
- A saved set of the family's machines, shared as a PDF or link with other relatives or a home helper.
- Several tasks per machine.

## Explicitly Cut
- **Phones and touchscreens.** Their buttons are pictures that change with every update, and phones already ship simplified modes — a different problem from a machine with fixed buttons.
- **Live AR through the camera.** It would require the grandparent to hold and aim a phone, which is exactly what the kernel avoids.
- **Accounts and login.** No part of the core loop needs them.
- **A native mobile app.** The browser already opens the camera and prints; an install adds friction for a job done a few times.
