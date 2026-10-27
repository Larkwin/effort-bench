// `bench demo`: builds a fake experiment from the fixture files so you can try the checks, the report
// and the viewer without spending anything. Metrics are simulated and the judge is a heuristic stand-in.
import fs from "node:fs";
import path from "node:path";
import { plannedRuns } from "./config.mjs";
import { extractHtml, codeStats } from "./extract.mjs";
import { ROOT, writeJson, readJson, costUsd, log } from "./util.mjs";
import { DIMS, meanReview } from "./judge.mjs";

const fixture = (f) => fs.readFileSync(path.join(ROOT, "fixtures", f), "utf8");

// A plausible "almost right" output: correct look, three real bugs.
function buggy(html) {
  return html
    .replace("base + (i < extra ? 1 : 0)", "base + (i >= ordered.length - extra ? 1 : 0)")
    .replace("try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}", "/* saved on exit */")
    .replace(".owed { color: var(--kelp); }", ".owed { color: var(--kelp); }\n  [data-cents^=\"-\"] .money { color: #C2462B; }");
}
const LEDES = ["Log shared trip costs and see who owes whom.", "Track what everyone paid and settle up fairly.", "Shared costs for the trip, kept even."];

const BASE = { "claude-fable-5-1": 0.86, "claude-opus-5-5": 0.76, "claude-sonnet-5-5": 0.6, "claude-haiku-5-5": 0.36 };
const EFFORT = { low: -0.22, medium: -0.06, high: 0.05, xhigh: 0.1, max: 0.12 };
const OUT = { low: 9000, medium: 14000, high: 22000, xhigh: 34000, max: 50000 };
const THINK = { low: 0.3, medium: 0.45, high: 0.6, xhigh: 0.68, max: 0.75 };
const TPS = { "claude-fable-5-1": 48, "claude-opus-5-5": 72, "claude-sonnet-5-5": 115, "claude-haiku-5-5": 230 };
const MULT = { "claude-fable-5-1": 0.9, "claude-opus-5-5": 1, "claude-sonnet-5-5": 1.1, "claude-haiku-5-5": 0.8 };
const jitter = (k) => 1 + (Math.random() * 2 - 1) * k;

export function buildDemoRuns(cfg, runsPerCell = 2) {
  fs.rmSync(cfg._dir, { recursive: true, force: true });
  const ref = fixture("reference.html"), gen = fixture("generic.html");
  for (const run of plannedRuns(cfg, { runs: runsPerCell })) {
    const q = (BASE[run.model.id] ?? 0.5) + (EFFORT[run.effort] ?? 0) + (Math.random() - 0.5) * 0.3;
    let html = q > 0.62 ? ref : q > 0.38 ? buggy(ref) : gen;
    html = html.replace(LEDES[0], LEDES[Math.floor(Math.random() * LEDES.length)]).replace("</title>", `</title>\n<!-- variant ${Math.random().toString(36).slice(2, 7)} -->`);
    const out = Math.round(OUT[run.effort] * (MULT[run.model.id] ?? 1) * jitter(0.2));
    const thinking = Math.round(out * THINK[run.effort] * jitter(0.1));
    const latency = out / ((TPS[run.model.id] ?? 80) * jitter(0.15)) + 2;
    const usage = { input_tokens: 2350, output_tokens: out, output_tokens_details: { thinking_tokens: thinking } };
    const ex = extractHtml(html);
    fs.mkdirSync(run.dir, { recursive: true });
    fs.writeFileSync(path.join(run.dir, "output.html"), ex.html);
    fs.writeFileSync(path.join(run.dir, "thinking.md"), `(Demo run: no real thinking summary. A real run stores the model's summarized reasoning here.)`);
    writeJson(path.join(run.dir, "meta.json"), {
      run_id: run.id, model: run.model.id, model_label: run.model.label, effort: run.effort, n: run.n, mode: "demo",
      stop_reason: "end_turn", usage, input_tokens: usage.input_tokens, output_tokens: out, thinking_tokens: thinking,
      cost_usd: costUsd(usage, run.model.price), latency_ms: Math.round(latency * 1000),
      first_text_ms: Math.round((latency * THINK[run.effort] + 1.5) * 1000), ttfb_ms: 1400,
      extraction: { method: ex.method, complete: ex.complete, chatter_chars: 0, chatter_sample: "", html_bytes: ex.html_bytes, html_lines: ex.html_lines },
      code: codeStats(ex.html),
    });
  }
  log(`Demo outputs written to ${cfg._dir}`);
}

const TELLS = {
  B01: "Generic sans typeface where Fraunces was specified", B02: "Inter instead of IBM Plex Sans", B04: "Decorative purple gradient on the header and buttons",
  B05: "Drop shadows on every card", B06: "Pill buttons and 16px card radii", B07: "Emoji in headings and empty states",
  B08: "Exclamation marks in UI copy", B09: "Title Case buttons and all-caps stat labels", B11: "Owing money shown in red, as if it were an error",
};

export function demoJudge(cfg) {
  for (const dir of fs.readdirSync(cfg._runsDir)) {
    const d = path.join(cfg._runsDir, dir);
    const c = readJson(path.join(d, "checks.json"));
    if (!c) continue;
    const s = c.summary;
    const failed = c.brand.filter((b) => !b.pass);
    const base = 0.5 * s.brand_rate + 0.35 * s.functional_rate + 0.15 * (s.a11y_serious === 0 ? 1 : 0);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
    const dimScore = (w) => clamp(1 + 3.4 * (base * w + (1 - w) * 0.6) + (Math.random() - 0.5) * 1.6, 1, 5);
    const review = Object.fromEntries(DIMS.map((k) => [k, { score: dimScore(k === "code_quality" ? 0.6 : 0.95), evidence: "Demo stand-in score derived from the automated checks." }]));
    review.overall = clamp(2 + 6.4 * base + (Math.random() - 0.5) * 2, 1, 10);
    review.ai_tells = failed.map((b) => TELLS[b.id]).filter(Boolean);
    review.brand_violations = failed.map((b) => `${b.name}: ${b.detail}`.slice(0, 160));
    review.best_detail = s.functional_rate === 1 ? "Balances and settle-up are exact to the cent." : "The layout reads clearly at desktop width.";
    review.worst_detail = failed.length ? `${failed[0].name} is not met.` : "Nothing stands out as weak.";
    writeJson(path.join(d, "judge.json"), { judge_model: "demo-heuristic", judge_effort: "n/a", passes: [{ mode: "demo", review, cost_usd: 0 }], mean: meanReview([review]) });
  }
  log("Demo judge scores written (heuristic, not a model).");
}

// `bench calibrate`: put the three fixtures (known-good, almost-right, unsupervised-AI look) through the
// real checks and the real judge. If the judge can't rank these three correctly, don't trust it on 100 runs.
export function buildCalibration(cfg) {
  fs.rmSync(cfg._dir, { recursive: true, force: true });
  const ref = fixture("reference.html");
  const set = [["reference", "Fixture: reference", ref], ["almost-right", "Fixture: almost right", buggy(ref)], ["generic", "Fixture: generic AI look", fixture("generic.html")]];
  for (const [slug, label, html] of set) {
    const dir = path.join(cfg._runsDir, `fixture-${slug}__fixed__r01`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "output.html"), html);
    const ex = extractHtml(html);
    writeJson(path.join(dir, "meta.json"), { run_id: path.basename(dir), model: `fixture-${slug}`, model_label: label, effort: "fixed", n: 1, mode: "fixture",
      extraction: { method: ex.method, complete: ex.complete, chatter_chars: 0, chatter_sample: "", html_bytes: ex.html_bytes, html_lines: ex.html_lines }, code: codeStats(html) });
  }
  return set.map(([slug, label]) => ({ dir: path.join(cfg._runsDir, `fixture-${slug}__fixed__r01`), label }));
}
