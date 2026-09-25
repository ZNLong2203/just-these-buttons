/**
 * Downloads openly licensed photos of real appliances from Wikimedia Commons
 * for the vision probe, with their authors and licences, and writes
 * probe/real-cases.json. Real photos are messier than generated ones —
 * glare, angles, symbols instead of words — which is the point.
 *
 *   npm run probe:real
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("probe");
const PHOTOS = path.join(OUT, "photos");
const UA = "JustTheseButtons/0.1 (https://github.com/ZNLong2203/just-these-buttons)";

type RealCase = {
  id: string;
  file: string; // Commons file title, without "File:"
  photo: string; // local name
  task: string;
  expect: "ok";
  expectedControls: string[];
  /** Card language; defaults to English. */
  language?: string;
};

const cases: RealCase[] = [
  { id: "real-washer-words", file: "HK home machine washing control button panel August 2021 SS2.jpg", photo: "real-washer-words.jpg", task: "wash everyday clothes", expect: "ok", expectedControls: ["COTTON|DAILY|DIAL|PROGRAM", "START"] },
  { id: "real-washer-spin", file: "HK home machine washing control button panel August 2021 SS2.jpg", photo: "real-washer-words.jpg", task: "only spin the clothes dry", expect: "ok", expectedControls: ["SPIN", "START"] },
  { id: "real-washer-symbols", file: "HK ARISTON washing machine control panel March 2021 SS2 01.jpg", photo: "real-washer-symbols.jpg", task: "wash everyday clothes", expect: "ok", expectedControls: ["DIAL|KNOB|PROGRAM|40|60|COTTON", "START|PLAY"] },
  { id: "real-washer-two-dials", file: "Ariston washing machine Oct-2011 HK Ip4.jpg", photo: "real-washer-two-dials.jpg", task: "wash everyday clothes", expect: "ok", expectedControls: ["ON|OFF|POWER", "START"] },
  { id: "real-remote-plain", file: "Television remote control - unbranded-4028.jpg", photo: "real-remote-plain.jpg", task: "turn on the TV", expect: "ok", expectedControls: ["POWER|STANDBY|RED"] },
  { id: "real-remote-hand", file: "TV remote control in hand 20170128.jpg", photo: "real-remote-hand.jpg", task: "turn on the TV and go to channel 1", expect: "ok", expectedControls: ["POWER|STANDBY|RED", "1"] },
  { id: "real-remote-louder", file: "Remote control for Hisense TV.jpg", photo: "real-remote-hisense.jpg", task: "turn on the TV and make it louder", expect: "ok", expectedControls: ["POWER|RED", "VOL|+"] },
  { id: "real-ac", file: "Remote control for Koppel air conditioner.jpg", photo: "real-ac.jpg", task: "turn on the air conditioner", expect: "ok", expectedControls: ["ON|OFF|POWER"] },
  { id: "jp-ac-en", file: "Air conditioner remote - Japan - 2024 sept 8.jpeg", photo: "jp-ac-remote.jpg", task: "turn on the air conditioner and make it cooler", expect: "ok", expectedControls: ["運転", "冷房"], language: "en" },
  { id: "jp-ac-vi", file: "Air conditioner remote - Japan - 2024 sept 8.jpeg", photo: "jp-ac-remote.jpg", task: "turn on the air conditioner and make it cooler", expect: "ok", expectedControls: ["運転", "冷房"], language: "vi" },
  { id: "jp-remote-hitachi-en", file: "Hitachi aircon remote control in Japan 20140910.jpg", photo: "jp-ac-hitachi.jpg", task: "turn on the air conditioner to cool the room", expect: "ok", expectedControls: ["冷房"], language: "en" },
  { id: "jp-washer-en", file: "Hitachi washing-maschine BW-D8HV 20110503.jpg", photo: "jp-washer-top.jpg", task: "start a normal wash", expect: "ok", expectedControls: ["スタート|電源|入"], language: "en" },
  { id: "real-microwave-dials", file: "BedieningspaneelProLineSM117.jpg", photo: "real-microwave-dials.jpg", task: "heat a bowl of soup for one minute", expect: "ok", expectedControls: ["POWER|LEVEL|DIAL|KNOB|TOP", "TIMER|1|MINUTE|DIAL|KNOB|BOTTOM"] },
];

type Credit = { photo: string; title: string; author: string; license: string; source: string };

const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function info(title: string) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      titles: `File:${title}`,
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: "1600",
      format: "json",
    });
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const json = (await res.json()) as {
    query: { pages: Record<string, { imageinfo?: { thumburl: string; descriptionurl: string; extmetadata: Record<string, { value: string }> }[] }> };
  };
  const ii = Object.values(json.query.pages)[0]?.imageinfo?.[0];
  if (!ii) throw new Error(`not found on Commons: ${title}`);
  return {
    url: ii.thumburl,
    source: ii.descriptionurl,
    author: stripTags(ii.extmetadata.Artist?.value ?? "unknown"),
    license: ii.extmetadata.LicenseShortName?.value ?? "unknown",
  };
}

async function main() {
  await mkdir(PHOTOS, { recursive: true });
  const credits = new Map<string, Credit>();
  for (const c of cases) {
    if (credits.has(c.photo)) continue;
    const meta = await info(c.file);
    const target = path.join(PHOTOS, c.photo);
    if (!existsSync(target)) {
      const res = await fetch(meta.url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`download failed ${res.status}: ${c.file}`);
      await writeFile(target, Buffer.from(await res.arrayBuffer()));
    }
    credits.set(c.photo, { photo: c.photo, title: c.file, author: meta.author, license: meta.license, source: meta.source });
    console.log(`  ✓ ${c.photo} — ${meta.author}, ${meta.license}`);
  }
  await writeFile(
    path.join(OUT, "real-cases.json"),
    JSON.stringify(cases.map(({ file: _file, ...c }) => ({ ...c, source: "real" })), null, 2) + "\n",
  );
  await writeFile(path.join(OUT, "credits.json"), JSON.stringify([...credits.values()], null, 2) + "\n");
  console.log(`wrote probe/real-cases.json (${cases.length} cases) and probe/credits.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
