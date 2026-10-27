import fs from "node:fs";
import path from "node:path";
import { existingRuns } from "./config.mjs";
import { blindSource } from "./extract.mjs";
import { client } from "./generate.mjs";
import { resolveModel } from "./models.mjs";
import { isImplemented } from "./providers/index.mjs";
import { submitBatch, pendingIds } from "./batch.mjs";
import { readJson, writeJson, exists, pool, costUsd, log, usd, sleep } from "./util.mjs";

export const DIMS = ["brand_fidelity", "visual_craft", "copy_voice", "ux_completeness", "code_quality", "directed_design"];

const dim = { type: "object", properties: { score: { type: "integer", enum: [1, 2, 3, 4, 5] }, evidence: { type: "string" } }, required: ["score", "evidence"], additionalProperties: false };
export const SCHEMA = {
  type: "object",
  properties: {
    ...Object.fromEntries(DIMS.map((d) => [d, dim])),
    overall: { type: "integer", enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    ai_tells: { type: "array", items: { type: "string" } },
    brand_violations: { type: "array", items: { type: "string" } },
    best_detail: { type: "string" },
    worst_detail: { type: "string" },
  },
  required: [...DIMS, "overall", "ai_tells", "brand_violations", "best_detail", "worst_detail"],
  additionalProperties: false,
};

const SHOTS = [
  ["empty-desktop", "Screenshot 1: desktop (1280px wide), first load with no data"],
  ["filled-desktop", "Screenshot 2: desktop (1280px wide) after entering a sample trip: 3 people, 3 expenses"],
  ["filled-mobile", "Screenshot 3: mobile (390px wide), same trip"],
];

export function judgeParams(cfg, run) {
  const checks = readJson(path.join(run.dir, "checks.json"), {});
  const html = fs.readFileSync(path.join(run.dir, "output.html"), "utf8");
  const content = [{ type: "text", text: cfg.rubricText.replace("{{BRIEF}}", cfg.promptText.trim()) }];
  for (const [key, caption] of SHOTS) {
    const file = checks.screenshots?.[key] && path.join(run.dir, checks.screenshots[key]);
    if (file && exists(file)) {
      content.push({ type: "text", text: caption });
      content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: fs.readFileSync(file).toString("base64") } });
    } else {
      content.push({ type: "text", text: `${caption}: not available (the page failed to render this state).` });
    }
  }
  content.push({ type: "text", text: `<source>\n${blindSource(html)}\n</source>\n\nReturn your review as JSON that matches the schema.` });
  return {
    model: cfg.judge.model,
    max_tokens: 32000,
    messages: [{ role: "user", content }],
    output_config: { effort: cfg.judge.effort, format: { type: "json_schema", schema: SCHEMA } },
  };
}

function parseReview(message) {
  const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/); // tolerate stray text around the object
  try { return m ? JSON.parse(m[0]) : null; } catch { return null; }
}

export function saveJudgement(cfg, run, message, mode) {
  const file = path.join(run.dir, "judge.json");
  const prev = readJson(file, { passes: [] });
  const review = parseReview(message);
  prev.judge_model = cfg.judge.model;
  prev.judge_effort = cfg.judge.effort;
  prev.passes.push({
    at: new Date().toISOString(), mode, stop_reason: message.stop_reason, usage: message.usage,
    cost_usd: costUsd(message.usage, cfg.judge.price, { batch: mode === "batch" }),
    review, parse_error: review ? null : "reply was not valid JSON",
  });
  prev.mean = meanReview(prev.passes.map((p) => p.review).filter(Boolean));
  writeJson(file, prev);
  return prev;
}

export function meanReview(reviews) {
  if (!reviews.length) return null;
  const m = {};
  for (const d of DIMS) m[d] = +(reviews.reduce((s, r) => s + r[d].score, 0) / reviews.length).toFixed(2);
  m.overall = +(reviews.reduce((s, r) => s + r.overall, 0) / reviews.length).toFixed(2);
  if (reviews.length > 1) {
    const sd = (xs) => { const mu = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (xs.length - 1)); };
    m.overall_sd = +sd(reviews.map((r) => r.overall)).toFixed(2);
  }
  return m;
}

function passesDone(run) {
  return (readJson(path.join(run.dir, "judge.json"), { passes: [] }).passes || []).filter((p) => p.review).length;
}

export async function runJudge(cfg, opts = {}) {
  const jm = resolveModel(cfg, cfg.judge.model);
  if (!isImplemented(jm)) return log(`The judge ${jm.id} uses provider "${jm.provider}", which isn't implemented yet (see docs/providers.md).`);
  const want = opts.passes ?? cfg.judge.passes;
  const inBatch = pendingIds(cfg, "judge");
  const jobs = [];
  for (const run of existingRuns(cfg)) {
    if (!exists(path.join(run.dir, "output.html")) || !exists(path.join(run.dir, "checks.json"))) continue;
    if (opts.force && exists(path.join(run.dir, "judge.json"))) fs.rmSync(path.join(run.dir, "judge.json"));
    const have = opts.force ? 0 : passesDone(run);
    for (let k = have + 1; k <= want; k++) {
      const cid = `j__${run.id}__p${k}`;
      if (!inBatch.has(cid)) jobs.push({ run, k, cid });
    }
  }
  if (!jobs.length) { log("Nothing to judge (run `check` first, or everything is already judged)."); return; }
  const api = client();

  if (opts.batch) {
    await submitBatch(api, cfg, "judge", jobs.map((j) => ({ custom_id: j.cid, params: judgeParams(cfg, j.run) })));
    return;
  }

  log(`Judging ${jobs.length} outputs with ${cfg.judge.model} at ${cfg.judge.effort} effort…`);
  let spent = 0, done = 0;
  await pool(jobs, cfg.judge.concurrency, async ({ run }) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const stream = api.messages.stream(judgeParams(cfg, run));
        const message = await stream.finalMessage();
        const j = saveJudgement(cfg, run, message, "sync");
        const last = j.passes.at(-1);
        spent += last.cost_usd || 0; done++;
        log(`✓ ${run.id.padEnd(30)} overall ${last.review?.overall ?? "?"}/10  directed ${last.review?.directed_design?.score ?? "?"}/5  ${usd(last.cost_usd)}  [${done}/${jobs.length}] spent ${usd(spent)}`);
        return;
      } catch (err) {
        if (attempt < 3 && (!err.status || err.status === 429 || err.status >= 500)) { await sleep(15000 * attempt); continue; }
        done++;
        log(`✗ ${run.id} judge failed: ${err.status ?? ""} ${String(err.message).slice(0, 200)}`);
        return;
      }
    }
  });
}

export function judgeBatchHandler(cfg) {
  return async (entry) => {
    const [, id] = entry.custom_id.match(/^j__(.+)__p\d+$/) || [];
    const run = existingRuns(cfg).find((r) => r.id === id);
    if (!run) return log(`? judge result for unknown run ${entry.custom_id}`);
    if (entry.result.type !== "succeeded") return log(`✗ ${id} judge ${entry.result.type}`);
    const j = saveJudgement(cfg, run, entry.result.message, "batch");
    log(`✓ ${id} (batch) overall ${j.passes.at(-1).review?.overall ?? "?"}/10`);
  };
}
