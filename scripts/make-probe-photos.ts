/**
 * Generates photorealistic appliance photos for the vision probe, plus the
 * cases file that pairs each photo with a task and the controls a person
 * would expect. Generated photos are cleaner than real ones, so the probe
 * report keeps them apart from real photos added later.
 *
 *   npm run probe:photos            # generate any photo that is missing
 *   npm run probe:photos -- --force # regenerate every photo
 */
import { GoogleGenAI, Modality } from "@google/genai";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("probe");
const PHOTOS = path.join(OUT, "photos");
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image";
const force = process.argv.includes("--force");

const STYLE =
  "A realistic, slightly imperfect smartphone photo taken by a family member, natural indoor light, " +
  "not a studio product shot. All printed text on the controls must be legible English. No people, no watermark.";

type PhotoSpec = { file: string; prompt: string };

const photos: PhotoSpec[] = [
  {
    file: "washer-front.jpg",
    prompt:
      "Close-up of the control panel of a white front-loading washing machine in a small home laundry corner. " +
      "Left: a round POWER button. Centre-left: a large programme dial with printed settings around it: COTTON, " +
      "SYNTHETICS, MIX, WOOL, DELICATES, QUICK 15', ECO 40-60, RINSE, SPIN, DRUM CLEAN. Centre-right: a small " +
      "digital display showing 1:39 and a row of small buttons labelled TEMP, SPIN, PREWASH, EXTRA RINSE, DELAY. " +
      "Right: a START/PAUSE button. Shot slightly from above at an angle.",
  },
  {
    file: "washer-top.jpg",
    prompt:
      "The control panel on top of a grey top-loading washing machine, typical of Asian homes. A row of many small " +
      "rectangular buttons with English labels: POWER, START/PAUSE, PROGRAM, WATER LEVEL, WASH, RINSE, SPIN, DELAY, " +
      "TUB CLEAN, CHILD LOCK, with small indicator lights for programmes NORMAL, HEAVY, DELICATE, QUICK, SOAK.",
  },
  {
    file: "tv-remote.jpg",
    prompt:
      "A black TV remote control lying on a fabric sofa cushion, the whole remote visible from above. Buttons: a red " +
      "POWER button at the top, INPUT, a number pad 1-9 and 0, VOL + and VOL - rocker, CH + and CH - rocker, MUTE, " +
      "HOME, a round arrow pad with OK in the middle, BACK, and NETFLIX and YOUTUBE shortcut buttons.",
  },
  {
    file: "ac-remote.jpg",
    prompt:
      "A white air-conditioner remote control held in an older person's hand in a living room. Small LCD screen at " +
      "the top showing 26°C and COOL. Buttons below: ON/OFF, MODE, FAN, a TEMP up arrow and TEMP down arrow, SWING, " +
      "TIMER, SLEEP, TURBO, ECO.",
  },
  {
    file: "microwave.jpg",
    prompt:
      "The front of a countertop microwave oven in a home kitchen. The keypad on the right has buttons: POPCORN, " +
      "POTATO, PIZZA, REHEAT, DEFROST, POWER LEVEL, TIMER, CLOCK, a number pad 1-9 and 0, STOP/CANCEL, and " +
      "START/+30SEC.",
  },
  {
    file: "rice-cooker.jpg",
    prompt:
      "The lid control panel of a white digital rice cooker on a kitchen counter. A small LCD with menu names printed " +
      "around it: WHITE RICE, BROWN RICE, QUICK COOK, PORRIDGE, STEAM. Buttons: MENU, COOK/START, KEEP WARM/CANCEL, " +
      "TIMER, HOUR, MIN.",
  },
  {
    file: "fan.jpg",
    prompt:
      "The base of a standing electric fan in a bedroom, seen from above, with a row of chunky push buttons labelled " +
      "OFF, 1, 2, 3, and a separate SWING button and a TIMER knob.",
  },
  {
    file: "not-a-machine.jpg",
    prompt: "A bowl of fruit (mangoes, bananas, oranges) on a wooden kitchen table. No machines or buttons anywhere.",
  },
];

type ProbeCase = {
  id: string;
  photo: string;
  task: string;
  expect: "ok" | "unusable_photo" | "task_not_possible";
  /** Printed labels a person would press or turn, in order. Judged loosely. */
  expectedControls: string[];
  source: "generated" | "real";
};

const cases: ProbeCase[] = [
  { id: "washer-everyday", photo: "washer-front.jpg", task: "wash everyday clothes", expect: "ok", expectedControls: ["POWER|power symbol", "COTTON|MIX", "START/PAUSE"], source: "generated" },
  { id: "washer-spin", photo: "washer-front.jpg", task: "only spin the clothes dry", expect: "ok", expectedControls: ["POWER|power symbol", "SPIN", "START/PAUSE"], source: "generated" },
  { id: "washer-coffee", photo: "washer-front.jpg", task: "make a cup of coffee", expect: "task_not_possible", expectedControls: [], source: "generated" },
  { id: "top-loader-normal", photo: "washer-top.jpg", task: "start a normal wash", expect: "ok", expectedControls: ["POWER", "START/PAUSE"], source: "generated" },
  { id: "tv-on-louder", photo: "tv-remote.jpg", task: "turn on the TV and make it louder", expect: "ok", expectedControls: ["POWER", "VOL +"], source: "generated" },
  { id: "tv-channel-1", photo: "tv-remote.jpg", task: "turn on the TV and go to channel 1", expect: "ok", expectedControls: ["POWER", "1"], source: "generated" },
  { id: "ac-cooler", photo: "ac-remote.jpg", task: "turn on the air conditioner and make it cooler", expect: "ok", expectedControls: ["ON/OFF", "TEMP down"], source: "generated" },
  { id: "microwave-soup", photo: "microwave.jpg", task: "heat a bowl of soup for one minute", expect: "ok", expectedControls: ["START/+30SEC"], source: "generated" },
  { id: "rice-white", photo: "rice-cooker.jpg", task: "cook white rice", expect: "ok", expectedControls: ["MENU", "COOK/START"], source: "generated" },
  { id: "fan-low", photo: "fan.jpg", task: "turn the fan on at the lowest speed", expect: "ok", expectedControls: ["1"], source: "generated" },
  { id: "fruit", photo: "not-a-machine.jpg", task: "wash everyday clothes", expect: "unusable_photo", expectedControls: [], source: "generated" },
];

async function generate(ai: GoogleGenAI, spec: PhotoSpec): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: `${spec.prompt}\n\n${STYLE}`,
    config: {
      responseModalities: [Modality.IMAGE],
      imageConfig: { aspectRatio: "4:3" },
    },
  });
  const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new Error(`no image returned for ${spec.file}`);
  return Buffer.from(part.inlineData.data, "base64");
}

async function main() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set (.env.local)");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  await mkdir(PHOTOS, { recursive: true });

  const todo = photos.filter((p) => force || !existsSync(path.join(PHOTOS, p.file)));
  console.log(`${IMAGE_MODEL}: generating ${todo.length} of ${photos.length} photos`);
  const results = await Promise.allSettled(
    todo.map(async (spec) => {
      const bytes = await generate(ai, spec);
      await writeFile(path.join(PHOTOS, spec.file), bytes);
      console.log(`  ✓ ${spec.file} (${Math.round(bytes.length / 1024)} KB)`);
    }),
  );
  const failed = results.filter((r) => r.status === "rejected");
  failed.forEach((r) => console.error(`  ✗ ${(r as PromiseRejectedResult).reason}`));

  await writeFile(path.join(OUT, "cases.json"), JSON.stringify(cases, null, 2) + "\n");
  console.log(`wrote probe/cases.json (${cases.length} cases)`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
