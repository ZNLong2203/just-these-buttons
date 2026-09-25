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
| Photos | Rounds 1–4: 8 photorealistic photos generated with `gemini-3-pro-image` at 1200 × 896 (front-loading washer, top-loading washer, TV remote, air-conditioner remote, microwave, rice cooker, standing fan, a bowl of fruit). Later: 4 harder generated photos and 8 real ones (see [Real photos](#real-photos)). |
| Cases | Rounds 1–4: 11 — nine button tasks, one impossible task ("make a cup of coffee" on the washer), one photo with no machine. Now 24 with the extra and real photos. |

Generated photos are cleaner, sharper and better lit than a phone photo of a real machine, so these numbers are an upper bound. A second set of real photos follows (see [Real photos](#real-photos)).

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

## Real photos

Generated photos are cleaner than a phone photo of a real machine, so a second set uses real appliances. `npm run probe:real` fetches eight openly licensed photos from Wikimedia Commons, and records their credits in `probe/credits.json`:

- two washers covered in symbols rather than words
- a washer with two dials and a symbol-only On/Off button
- a panel with small printed words
- three TV remotes (one held in a hand)
- an air-conditioner remote
- a microwave with two unlabelled dials

The round-4 prompt was used unchanged. Over two runs, 18 of 18 cases named the right controls in order, and every box checked by eye sat on the right physical control. That includes the symbol-only On/Off button, and both microwave dials with "turn the bottom dial to 1".

Examples:

> Press the On/Off button. · Turn the left dial to 2. *(check this one)* · Press the Start/Pause button.
> Turn top knob to high heat symbol. · Turn the bottom knob to 1.
> Press the green power button at the top. · Press 1.

Four harder generated photos were added at the same time: a remote in an old hand in dim light, a washer shot at a steep angle with glare, an air fryer, and a portable radio. Across all 24 cases (generated and real), two runs gave 47 of 48 right. The one miss was a 25-second timeout while all 24 requests were sent at once. The app shows that as "try again".

## Decision

The plan's rule was to proceed if at least 8 of 10 photos get every needed control inside its ring. The generated photos (rounds 3 and 4) and the real photos both clear it. So the build keeps `gemini-3.8-flash` at `LOW` thinking with the round-4 prompt. The caregiver's check before printing stays: real homes are messier still, and one real case already came back flagged *check this one*.

## Still to do

- Photograph the machines in the builder's own family home and run them as a third set.
