# Vision probe

Just These Buttons stands on one assumption: that a vision model, given a photo of a machine and a task, can put a box on the right physical controls in the right order. Before building any interface, the probe tested that assumption.

`npm run probe` runs the app's own `findButtons()` (`lib/gemini.ts`) over the cases in `probe/cases.json` and writes `probe/report.html`: every returned box drawn on its photo, next to the steps the card would print. Box placement is judged by eye; the script only checks automatically that the expected controls were named, in order, and that bad photos and impossible tasks were refused.

```bash
npm run probe:photos                      # generate the test photos (once)
npm run probe                             # probe/report.html
GEMINI_THINKING=MEDIUM PROBE_TAG=medium npm run probe   # compare a setting
```

## Setup

| | |
|---|---|
| Model | `gemini-3.8-flash`, thinking `LOW`, image part at `MEDIA_RESOLUTION_HIGH`, JSON schema output |
| Photos | 8 photorealistic photos generated with `gemini-3-pro-image` at 1200 × 896: front-loading washer, top-loading washer, TV remote, air-conditioner remote, microwave, rice cooker, standing fan, and a bowl of fruit |
| Cases | 11: nine button tasks, one impossible task ("make a cup of coffee" on the washer), one photo with no machine |

Generated photos are cleaner, sharper and better lit than a phone photo of a real machine, so these numbers are an upper bound. Real photos are added before the demo is recorded (see [Still to do](#still-to-do)).

## What happened

| Round | Change | Result |
|---|---|---|
| 1 | First prompt | 11/11 statuses right. Every box landed on the right physical control (17/17, checked by eye). But 2 of 9 tasks were incomplete: on the front-loading washer the model skipped the power button, which carries only the ⏻ symbol. |
| 2 | Told it power buttons are often symbol-only | No better. Over six runs at `LOW`, `MEDIUM` and `HIGH` thinking, the top-loader also started dropping its POWER button. `HIGH` took 8–25 s per photo and often hit the 25 s timeout without being more complete. |
| 3 | Told it the machine **starts switched off, with nothing set** | 33/33 right over three runs, power buttons included. |
| 4 | One step per control ("Press START twice", not two steps on one button); always one setting, never "COTTON or MIX" | 22/22 right over two runs, about 3.6 s per photo. This is the prompt the app uses. |

The final instructions read like a card:

> Press the power button. · Turn the dial to SPIN. · Press START/PAUSE.
> Press the red POWER button. · Press the 1 button.
> Press ON/OFF to turn it on. · Press the down arrow under TEMP.
> Press START +30SEC twice.

## What it taught

- **The coordinates were never the problem.** Every box checked by eye sat on the right physical control, down to the "1" key on a TV remote.
- **The errors were about *which* controls, and they came from an unstated assumption.** The model pictured the machine already switched on, so "fewest controls" meant leaving the power button out. Stating the starting state fixed it. Telling it more about power buttons, or letting it think harder, did not.
- **Thinking harder made it slower, not better,** for this kind of spatial answer, consistent with Google's advice to keep thinking low for detection. `gemini-3.8-flash` also rejects the `MINIMAL` level the plan assumed; `LOW` is its floor.
- **Runs vary.** The same photo and task gave different step lists across runs until the prompt pinned down the starting state. One run is not evidence; the numbers above are from repeated runs.

## Decision

The plan's rule was: proceed if at least 8 of 10 photos get every needed control inside its ring. Rounds 3 and 4 clear it on generated photos. So the build keeps `gemini-3.8-flash` at `LOW` thinking with the round-4 prompt. The caregiver's check before printing stays, because real photos will be harder than these.

## Still to do

- Re-run on real phone photos of real machines at home, reported separately from the generated set, before recording the demo.
- Add a case with glare, an angled shot, and a remote held in a hand in dim light.
