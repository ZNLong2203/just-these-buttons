/**
 * Vision probe: runs the app's own findButtons() over probe/cases.json and
 * writes probe/report.html — every returned box drawn on its photo — so a
 * person can judge whether the boxes sit on the right controls.
 *
 *   npm run probe
 *   GEMINI_MODEL=gemini-3.5-flash-lite PROBE_TAG=lite npm run probe   # compare a model
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { findButtons, DEFAULT_MODEL, type FindButtonsOutput } from "../lib/gemini";

const OUT = path.resolve("probe");

type ProbeCase = {
  id: string;
  photo: string;
  task: string;
  expect: "ok" | "unusable_photo" | "task_not_possible";
  expectedControls: string[];
  source: "generated" | "real";
};

type Row = { c: ProbeCase; out?: FindButtonsOutput; error?: string; labelsMatch?: boolean };

// Image models may return PNG whatever the file is called; trust the bytes.
const mimeFor = (bytes: Buffer) => (bytes[0] === 0x89 && bytes[1] === 0x50 ? "image/png" : "image/jpeg");

/**
 * Loose automatic check: every expected control appears, in order, among the
 * returned labels or instructions. Words may come in any order ("VOL +" and
 * "+ VOL" match), and "COTTON|MIX" accepts either.
 */
function labelsMatch(c: ProbeCase, out: FindButtonsOutput): boolean {
  if (out.result.status !== "ok") return false;
  const tokens = (s: string) => s.toUpperCase().match(/[A-Z0-9]+|\+/g) ?? [];
  const said = out.result.steps.map((s) => new Set(tokens(`${s.label} ${s.instruction}`)));
  const hit = (want: string, i: number) =>
    want.split("|").some((alt) => tokens(alt).every((t) => said[i].has(t)));
  let from = 0;
  for (const want of c.expectedControls) {
    const at = said.findIndex((_, i) => i >= from && hit(want, i));
    if (at === -1) return false;
    from = at + 1;
  }
  return true;
}

function statusOf(r: Row): string {
  if (r.error) return "error";
  return r.out!.result.status;
}

function verdict(r: Row): "pass" | "fail" | "check" {
  if (r.error) return "fail";
  const status = r.out!.result.status;
  if (status !== r.c.expect) return "fail";
  if (status !== "ok") return "pass";
  return r.labelsMatch ? "check" : "fail";
}

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);

function overlay(r: Row): string {
  if (!r.out || r.out.result.status !== "ok") return "";
  return r.out.result.steps
    .map((s, i) => {
      const [y0, x0, y1, x1] = s.box;
      const dash = s.needsCheck ? ' stroke-dasharray="14 10"' : "";
      return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="8" class="ring"${dash}/>
        <circle cx="${x0}" cy="${y0}" r="26" class="badge"/><text x="${x0}" y="${y0 + 10}" class="num">${i + 1}</text>`;
    })
    .join("");
}

function render(rows: Row[], model: string): string {
  const counted = rows.filter((r) => r.c.expect === "ok");
  const auto = counted.filter((r) => verdict(r) === "check").length;
  const statesRight = rows.filter((r) => r.c.expect !== "ok" && verdict(r) === "pass").length;
  const statesTotal = rows.filter((r) => r.c.expect !== "ok").length;
  const avgMs = Math.round(rows.filter((r) => r.out).reduce((a, r) => a + r.out!.ms, 0) / Math.max(1, rows.filter((r) => r.out).length));

  const cards = rows
    .map((r) => {
      const v = verdict(r);
      const steps =
        r.out?.result.status === "ok"
          ? `<ol>${r.out.result.steps
              .map((s) => `<li${s.needsCheck ? ' class="low"' : ""}><b>${esc(s.instruction)}</b> <small>${esc(s.label)} · ${s.action} · [${s.box.join(", ")}]${s.needsCheck ? " · check this one" : ""}</small></li>`)
              .join("")}</ol>${r.out.result.truncated ? "<p><small>truncated to five steps</small></p>" : ""}`
          : "";
      return `<article class="${v}">
  <figure><img src="photos/${esc(r.c.photo)}" alt=""><svg viewBox="0 0 1000 1000" preserveAspectRatio="none">${overlay(r)}</svg></figure>
  <div class="meta">
    <h2>${esc(r.c.id)} <span class="v">${v === "check" ? "labels match — check boxes by eye" : v}</span></h2>
    <p class="task">“${esc(r.c.task)}”</p>
    <p><small>expected ${esc(r.c.expect)}${r.c.expectedControls.length ? `: ${esc(r.c.expectedControls.join(" → "))}` : ""} · got ${esc(statusOf(r))}${r.out ? ` · ${r.out.ms} ms` : ""} · ${r.c.source}</small></p>
    ${steps}
    ${r.error ? `<pre>${esc(r.error)}</pre>` : ""}
    <label class="eye"><input type="checkbox"> Every needed control is inside its ring</label>
  </div>
</article>`;
    })
    .join("\n");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vision probe — ${esc(model)}</title>
<style>
  body{margin:0;background:#F7F3EC;color:#1E1B16;font:16px/1.5 system-ui,sans-serif}
  main{max-width:1200px;margin:0 auto;padding:32px 16px}
  h1{font:600 32px Georgia,serif;margin:0 0 4px}
  .sum{color:#6B6358;margin:0 0 24px}
  article{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:20px;background:#FFFDF8;border:1px solid #E3DBCF;border-left:6px solid #E3DBCF;border-radius:14px;padding:16px;margin-bottom:16px}
  article.fail{border-left-color:#B42318} article.pass{border-left-color:#2F7D4F} article.check{border-left-color:#C2410C}
  @media(max-width:760px){article{grid-template-columns:1fr}}
  figure{position:relative;margin:0} figure img{display:block;width:100%;height:auto;border-radius:8px}
  figure svg{position:absolute;inset:0;width:100%;height:100%}
  .ring{fill:none;stroke:#C2410C;stroke-width:7;vector-effect:non-scaling-stroke} .badge{fill:#C2410C}
  .num{fill:#fff;font:700 30px system-ui;text-anchor:middle}
  h2{font-size:18px;margin:0 0 6px} .v{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6B6358;margin-left:8px}
  .task{font:italic 18px Georgia,serif;margin:0 0 4px}
  ol{padding-left:20px;margin:8px 0} li.low b{text-decoration:underline dashed #C2410C}
  small{color:#6B6358} pre{white-space:pre-wrap;background:#F2E9E4;padding:8px;border-radius:8px;font-size:12px}
  .eye{display:flex;gap:8px;align-items:center;margin-top:10px;font-weight:600}
</style></head><body><main>
<h1>Vision probe</h1>
<p class="sum">${esc(model)} · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · ${rows.length} cases · average ${avgMs} ms<br>
Labels match on ${auto}/${counted.length} button tasks (boxes still need checking by eye) · correct refusal on ${statesRight}/${statesTotal} photo/task checks.</p>
${cards}
</main></body></html>`;
}

async function main() {
  const cases: ProbeCase[] = JSON.parse(await readFile(path.join(OUT, "cases.json"), "utf8"));
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  console.log(`probing ${cases.length} cases with ${model}`);

  const rows: Row[] = await Promise.all(
    cases.map(async (c): Promise<Row> => {
      try {
        const bytes = await readFile(path.join(OUT, "photos", c.photo));
        const out = await findButtons({ imageBase64: bytes.toString("base64"), mimeType: mimeFor(bytes), task: c.task, model });
        const row: Row = { c, out, labelsMatch: labelsMatch(c, out) };
        console.log(`  ${verdict(row).padEnd(5)} ${c.id} → ${out.result.status}${out.result.status === "ok" ? ` (${out.result.steps.map((s) => s.label).join(" → ")})` : ""} ${out.ms}ms`);
        return row;
      } catch (err) {
        console.log(`  error ${c.id}: ${String(err)}`);
        return { c, error: String(err) };
      }
    }),
  );

  const tag = process.env.PROBE_TAG ? `-${process.env.PROBE_TAG}` : "";
  await writeFile(path.join(OUT, `report${tag}.html`), render(rows, `${model}${tag ? ` (${process.env.PROBE_TAG})` : ""}`));
  await writeFile(
    path.join(OUT, `results${tag}.json`),
    JSON.stringify(rows.map((r) => ({ id: r.c.id, verdict: verdict(r), result: r.out?.result, raw: r.out?.raw, ms: r.out?.ms, error: r.error })), null, 2),
  );
  console.log(`wrote probe/report${tag}.html and probe/results${tag}.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
