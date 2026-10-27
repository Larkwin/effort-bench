// Pairwise judge: shows a model two outputs side by side and asks which one it would ship.
// Absolute 1–10 scores rated nearly half of the decided blind pairs as equal; picking between two is
// far more sensitive. Each pair is judged in both orders to cancel position bias.
//
// More than one judge can be run over the same pairs (`--judge fable-5-1`). Each judge model and effort
// keeps its own file, results/<experiment>/pairwise/<model>-<effort>.json, so judges can be compared.
import fs from "node:fs";
import path from "node:path";
import { existingRuns, shortModel } from "./config.mjs";
import { client } from "./generate.mjs";
import { resolveModel } from "./models.mjs";
import { submitBatch, pendingIds } from "./batch.mjs";
import { ROOT, readJson, writeJson, exists, pool, costUsd, log, usd, sha, sleep, table, errorDetail } from "./util.mjs";

const SCHEMA = {
  type: "object",
  properties: {
    winner: { type: "string", enum: ["1", "2", "tie"] },
    strength: { type: "string", enum: ["slight", "clear", "strong"] },
    deciding_factor: { type: "string", enum: ["brand", "visual", "copy", "usability", "correctness"] },
    evidence: { type: "string" },
  },
  required: ["winner", "strength", "deciding_factor", "evidence"],
  additionalProperties: false,
};

export const judgeKey = (model, effort) => `${shortModel(model)}-${effort}`;

// Settings for one judge: the config's pairwise block, then --judge / --effort from the command line.
export function settings(cfg, { judge, effort } = {}) {
  const base = { model: cfg.judge.model, effort: "medium", per_cell_pair: 2, budget_usd: 40, concurrency: 4, prompt: "judge/pairwise.md", ...(cfg.pairwise || {}) };
  const m = resolveModel(cfg, judge || base.model);
  const s = { ...base, model: m.id, label: m.label, provider: m.provider, effort: effort || base.effort };
  if (s.provider !== "anthropic") throw new Error(`Judge ${m.id} uses provider "${s.provider}", which isn't implemented yet (see docs/providers.md).`);
  s.price = (m.id === base.model && cfg.pairwise?.price) || m.price;
  s.key = judgeKey(s.model, s.effort);
  return s;
}
// The judge a batch was submitted for. Batches from before per-judge files carry no judge: they were the default.
const batchJudge = (cfg, b) => b.judge || (() => { const d = settings(cfg); return { model: d.model, effort: d.effort, key: d.key }; })();

// One results file per judge. A pairwise.json from before that change is moved into place on first use.
const judgesDir = (cfg) => path.join(cfg._dir, "pairwise");
function migrateLegacy(cfg) {
  const old = path.join(cfg._dir, "pairwise.json");
  if (!exists(old)) return;
  const st = readJson(old, {});
  const key = judgeKey(st.judge_model || cfg.judge.model, st.judge_effort || "medium");
  const dest = path.join(judgesDir(cfg), `${key}.json`);
  if (exists(dest)) return;
  fs.mkdirSync(judgesDir(cfg), { recursive: true });
  try { fs.renameSync(old, dest); } catch { fs.copyFileSync(old, dest); }
  log(`Moved pairwise.json to pairwise/${key}.json (one results file per judge now).`);
}
const storeFile = (cfg, s) => path.join(judgesDir(cfg), `${s.key}.json`);
const loadStore = (cfg, s) => { migrateLegacy(cfg); return readJson(storeFile(cfg, s), { judgments: [] }); };
const judgeLabel = (cfg, j) => { try { return resolveModel(cfg, j.judge_model).label; } catch { return j.judge_label || j.judge_model || j.key; } };
// Every judge that has results, as { key, judge_model, judge_effort, judgments }.
export function listJudges(cfg) {
  migrateLegacy(cfg);
  if (!exists(judgesDir(cfg))) return [];
  return fs.readdirSync(judgesDir(cfg)).filter((f) => f.endsWith(".json")).sort()
    .map((f) => ({ key: f.replace(/\.json$/, ""), ...readJson(path.join(judgesDir(cfg), f), { judgments: [] }) }));
}
const cell = (id) => id.replace(/__r\d+$/, "");
// Pairs are stored with the two run ids sorted, so a pair is the same whichever way it was asked.
// order "ab": the first sorted id was shown as submission 1; "ba": the second was.
const norm = (x, y) => (x < y ? [x, y] : [y, x]);
const keyOf = (lo, hi, order) => `${lo}|${hi}|${order}`;
const customId = (lo, hi, order) => `pw__${lo}__vs__${hi}__${order}`;
function parseCustomId(cid) {
  const m = /^pw__(.+)__vs__(.+)__(ab|ba)$/.exec(cid);
  return m ? { lo: m[1], hi: m[2], order: m[3] } : null;
}

// Runs that can be judged (both screenshots exist), optionally limited with --models / --efforts.
function usable(cfg, { models, efforts } = {}) {
  const ok = new Map();
  for (const r of existingRuns(cfg)) {
    const [m, e] = r.id.split("__");
    if (models && !models.some((x) => x === m || shortModel(x) === m)) continue;
    if (efforts && !efforts.includes(e)) continue;
    const c = readJson(path.join(r.dir, "checks.json"));
    const shots = c?.screenshots || {};
    if (shots["filled-desktop"] && shots["filled-mobile"]) ok.set(r.id, { dir: r.dir, shots });
  }
  return ok;
}

export function pairParams(cfg, s, runs, lo, hi, order) {
  const [first, second] = order === "ab" ? [lo, hi] : [hi, lo];
  const promptText = fs.readFileSync(path.resolve(ROOT, s.prompt), "utf8").replace("{{BRIEF}}", cfg.promptText.trim());
  const img = (id, key) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: fs.readFileSync(path.join(runs.get(id).dir, runs.get(id).shots[key])).toString("base64") } });
  const content = [{ type: "text", text: promptText }];
  for (const [label, id] of [["1", first], ["2", second]]) {
    content.push({ type: "text", text: `Submission ${label}, desktop (1280px wide):` }, img(id, "filled-desktop"));
    content.push({ type: "text", text: `Submission ${label}, mobile (390px wide):` }, img(id, "filled-mobile"));
  }
  content.push({ type: "text", text: "Which submission would you put in front of the client? Return JSON that matches the schema." });
  return { model: s.model, max_tokens: 16000, messages: [{ role: "user", content }], output_config: { effort: s.effort, format: { type: "json_schema", schema: SCHEMA } } };
}

function saveJudgment(cfg, s, lo, hi, order, message, mode) {
  const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  let v = null;
  try { v = JSON.parse(text); } catch { const m = text.match(/\{[\s\S]*\}/); try { v = m ? JSON.parse(m[0]) : null; } catch {} }
  const [first, second] = order === "ab" ? [lo, hi] : [hi, lo];
  const store = loadStore(cfg, s);
  store.judge_model = s.model; store.judge_effort = s.effort; store.judge_label = s.label;
  store.prompt_sha = sha(fs.readFileSync(path.resolve(ROOT, s.prompt), "utf8"));
  store.judgments = store.judgments.filter((j) => keyOf(j.lo, j.hi, j.order) !== keyOf(lo, hi, order));
  const j = {
    lo, hi, order, at: new Date().toISOString(), mode,
    winner: v ? (v.winner === "1" ? first : v.winner === "2" ? second : "tie") : null,
    strength: v?.strength ?? null, factor: v?.deciding_factor ?? null, evidence: v?.evidence ?? null,
    stop_reason: message.stop_reason, usage: message.usage,
    cost_usd: costUsd(message.usage, s.price, { batch: mode === "batch" }),
    error: v ? null : "reply was not valid JSON",
  };
  store.judgments.push(j);
  writeJson(storeFile(cfg, s), store);
  return j;
}

// Seeded shuffle so the schedule is the same every time it's built.
function rng(seed) { let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }

// Round-robin: every pair of different settings (cells), `k` run pairs each.
function schedule(cfg, runs, k) {
  const byCell = new Map();
  for (const id of runs.keys()) { const c = cell(id); if (!byCell.has(c)) byCell.set(c, []); byCell.get(c).push(id); }
  const cells = [...byCell.keys()].sort();
  const rand = rng(cfg.experiment);
  const pairs = [];
  for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) {
    const A = byCell.get(cells[i]), B = byCell.get(cells[j]);
    const all = A.flatMap((a) => B.map((b) => [a, b]));
    for (let n = all.length - 1; n > 0; n--) { const m = Math.floor(rand() * (n + 1)); [all[n], all[m]] = [all[m], all[n]]; }
    pairs.push(...all.slice(0, k));
  }
  return pairs;
}

// Combine both orders: a win scores 1, a tie 0.5; whoever scores more over the two orders wins the pair.
export function verdicts(store) {
  const by = new Map();
  for (const j of store.judgments.filter((x) => x.winner)) {
    const k = `${j.lo}|${j.hi}`;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(j);
  }
  return [...by.entries()].map(([k, js]) => {
    const [lo, hi] = k.split("|");
    const loScore = js.reduce((s, j) => s + (j.winner === lo ? 1 : j.winner === "tie" ? 0.5 : 0), 0);
    const n = js.length;
    const winner = loScore > n / 2 ? lo : loScore < n / 2 ? hi : "tie";
    const consistent = n === 2 ? js[0].winner === js[1].winner : null;
    return { lo, hi, winner, orders: n, consistent, factors: js.map((j) => j.factor), strengths: js.map((j) => j.strength), evidence: js.map((j) => j.evidence) };
  });
}

function agreementWith(votes, vs) {
  const map = new Map(vs.map((v) => [`${v.lo}|${v.hi}`, v]));
  let agree = 0, disagree = 0, judgeTie = 0, n = 0;
  const misses = [];
  for (const x of votes) {
    if (x.winner === "tie") continue;
    const [lo, hi] = norm(x.a, x.b);
    const v = map.get(`${lo}|${hi}`);
    if (!v || v.orders < 2) continue;
    n++;
    const human = x.winner === "a" ? x.a : x.b;
    if (v.winner === "tie") judgeTie++;
    else if (v.winner === human) agree++;
    else { disagree++; misses.push(`${human} over ${human === lo ? hi : lo}`); }
  }
  return { n, agree, disagree, judgeTie, misses };
}

export async function runPairwise(cfg, opts = {}) {
  const s = settings(cfg, opts);
  const runs = usable(cfg, opts);
  let votes = null, pairs;
  if (opts.votes) {
    const file = path.resolve(process.cwd(), opts.votes);
    votes = (readJson(file, {})?.votes || []).filter((v) => runs.has(v.a) && runs.has(v.b));
    pairs = votes.map((v) => [v.a, v.b]);
    log(`Validating against ${votes.length} of your blind votes (${file}).`);
  } else {
    pairs = schedule(cfg, runs, opts.pairs ?? s.per_cell_pair);
    log(`Round-robin across ${new Set([...runs.keys()].map(cell)).size} settings: ${pairs.length} pairs.`);
  }

  const done = new Set(loadStore(cfg, s).judgments.filter((j) => j.winner).map((j) => keyOf(j.lo, j.hi, j.order)));
  const inBatch = pendingIds(cfg, "pairwise", (b) => batchJudge(cfg, b).key === s.key);
  const seen = new Set();
  let jobs = [];
  for (const [x, y] of pairs) {
    const [lo, hi] = norm(x, y);
    for (const order of ["ab", "ba"]) {
      const k = keyOf(lo, hi, order);
      if (seen.has(k) || (done.has(k) && !opts.force) || inBatch.has(customId(lo, hi, order))) continue;
      seen.add(k);
      jobs.push({ lo, hi, order });
    }
  }
  // --limit n: judge only the first n (e.g. a two-judgment smoke test before a big batch with a new judge).
  if (opts.limit) jobs = jobs.slice(0, opts.limit);
  const perCall = ((4 * 1550 + 3200) * s.price.input + 1800 * s.price.output) / 1e6;
  log(`${jobs.length} judgments to make (both orders per pair), about ${usd(perCall * jobs.length)} synchronous or ${usd((perCall * jobs.length) / 2)} with --batch. Judge ${s.label} at ${s.effort} effort → pairwise/${s.key}.json`);
  if (opts.dryRun) return;

  if (jobs.length) {
    const api = client();
    if (opts.batch) {
      await submitBatch(api, cfg, "pairwise", jobs.map((j) => ({ custom_id: customId(j.lo, j.hi, j.order), params: pairParams(cfg, s, runs, j.lo, j.hi, j.order) })), { meta: { judge: { model: s.model, effort: s.effort, key: s.key } } });
      return;
    }
    let spent = 0, n = 0, stopped = false;
    await pool(jobs, s.concurrency, async (job) => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const message = await api.messages.stream(pairParams(cfg, s, runs, job.lo, job.hi, job.order)).finalMessage();
          const j = saveJudgment(cfg, s, job.lo, job.hi, job.order, message, "sync");
          spent += j.cost_usd || 0; n++;
          log(`✓ ${job.lo} vs ${job.hi} (${job.order}) → ${j.winner === "tie" ? "tie" : cell(j.winner)} ${j.strength ?? ""} [${j.factor ?? "?"}]  ${usd(j.cost_usd)}  [${n}/${jobs.length}] spent ${usd(spent)}`);
          return;
        } catch (err) {
          if (attempt < 3 && (!err.status || err.status === 429 || err.status >= 500)) { await sleep(15000 * attempt); continue; }
          n++; log(`✗ ${job.lo} vs ${job.hi} (${job.order}): ${errorDetail(err).slice(0, 300)}`); return;
        }
      }
    }, () => { if (spent >= s.budget_usd && !stopped) { stopped = true; log(`Pairwise budget ${usd(s.budget_usd)} reached; stopping.`); } return stopped; });
  }
  summarize(cfg, votes, opts);
}

export function summarize(cfg, votes = null, opts = {}) {
  const s = settings(cfg, opts);
  const store = loadStore(cfg, s);
  const vs = verdicts(store);
  if (!vs.length) { log(`No pairwise judgments yet from ${s.label} at ${s.effort} effort.`); return; }
  const both = vs.filter((v) => v.orders === 2);
  const consistent = both.filter((v) => v.consistent).length;
  const ties = vs.filter((v) => v.winner === "tie").length;
  console.log(`\nJudge: ${s.label} at ${s.effort} effort.`);
  console.log(`${vs.length} pairs judged; ${both.length} in both orders, ${Math.round((100 * consistent) / Math.max(1, both.length))}% picked the same winner in both orders; ${Math.round((100 * ties) / vs.length)}% ended as ties.`);
  if (votes) {
    const a = agreementWith(votes, vs);
    console.log(`Against your ${a.n} decisive votes: agreed ${a.agree}, disagreed ${a.disagree}, called ${a.judgeTie} a tie.`);
    console.log(`Agreement where the judge picked a side: ${a.agree + a.disagree ? Math.round((100 * a.agree) / (a.agree + a.disagree)) : 0}%.`);
    // The same comparison for the absolute-score judge, from each run's overall score.
    const overall = new Map(existingRuns(cfg).map((r) => [r.id, readJson(path.join(r.dir, "judge.json"))?.mean?.overall ?? null]));
    let ag = 0, dg = 0, tg = 0;
    for (const x of votes) {
      if (x.winner === "tie") continue;
      const sa = overall.get(x.a), sb = overall.get(x.b);
      if (sa == null || sb == null) continue;
      if (sa === sb) tg++; else if ((sa > sb) === (x.winner === "a")) ag++; else dg++;
    }
    if (ag + dg + tg) console.log(`For comparison, the absolute-score judge on the same votes: agreed ${ag}, disagreed ${dg}, called ${tg} even.`);
    if (a.misses.length) console.log(`Disagreements: ${a.misses.join("; ")}`);
  }
  console.log("\n" + table(rateRows(winRates(vs, byModel)), ["model", "won", "pairs"]));
  console.log("\n" + table(rateRows(winRates(vs, byEffort)), ["effort", "won", "pairs"]));
  console.log("\nWin rates count only pairs across different models (or efforts); ties count half.");
}

const byModel = (id) => id.split("__")[0];
const byEffort = (id) => id.split("__")[1];
const pct = (x) => `${Math.round(100 * x)}%`;
// Win rate per group, from pairs whose two sides fall in different groups (a same-model pair says
// nothing about that model against the others). Ties count half.
function winRates(vs, key) {
  const t = {};
  for (const v of vs) {
    if (key(v.lo) === key(v.hi)) continue;
    for (const id of [v.lo, v.hi]) {
      const k = key(id); (t[k] ||= { w: 0, n: 0 }); t[k].n++;
      t[k].w += v.winner === "tie" ? 0.5 : v.winner === id ? 1 : 0;
    }
  }
  for (const x of Object.values(t)) x.rate = x.w / x.n;
  return t;
}
const rateRows = (t) => Object.entries(t).sort((x, y) => y[1].rate - x[1].rate).map(([k, x]) => [k, pct(x.rate), x.n]);
// Blind A/B votes in the same shape as verdicts.
const voteVerdicts = (votes) => votes.map((x) => ({ lo: x.a, hi: x.b, winner: x.winner === "a" ? x.a : x.winner === "b" ? x.b : "tie" }));

// Every judge side by side: win rates by model and effort (with your votes when given), how often the
// judges agree with each other on the same pairs, and how often each agrees with you.
export function compareJudges(cfg, votes = null) {
  const primary = settings(cfg).key;
  const judges = listJudges(cfg).map((j) => ({ ...j, name: `${judgeLabel(cfg, j)} · ${j.judge_effort || "?"}`, vs: verdicts(j) }))
    .filter((j) => j.vs.length).sort((a, b) => (b.key === primary) - (a.key === primary));
  if (!judges.length) return log("No pairwise judgments yet.");
  const cols = [...judges.map((j) => j.name), ...(votes ? [`you (${votes.length} votes)`] : [])];
  for (const [label, key] of [["model", byModel], ["effort", byEffort]]) {
    const rates = [...judges.map((j) => winRates(j.vs, key)), ...(votes ? [winRates(voteVerdicts(votes), key)] : [])];
    const groups = [...new Set(rates.flatMap((r) => Object.keys(r)))].sort((a, b) => (rates[0][b]?.rate ?? 0) - (rates[0][a]?.rate ?? 0));
    console.log("\n" + table(groups.map((g) => [g, ...rates.map((r) => (r[g] ? `${pct(r[g].rate)} (${r[g].n})` : "–"))]), [label, ...cols]));
  }
  console.log("\nWin rates count only pairs across different models (or efforts); ties count half; (n) = comparisons.");
  for (const j of judges) {
    const both = j.vs.filter((v) => v.orders === 2);
    console.log(`${j.name}: ${j.vs.length} pairs, ${pct(both.filter((v) => v.consistent).length / Math.max(1, both.length))} same winner in both orders, ${pct(j.vs.filter((v) => v.winner === "tie").length / j.vs.length)} ties, ${usd(j.judgments.reduce((s, x) => s + (x.cost_usd || 0), 0))} spent.`);
  }
  // Judge vs judge, on pairs both judged in both orders.
  for (let a = 0; a < judges.length; a++) for (let b = a + 1; b < judges.length; b++) {
    const B = new Map(judges[b].vs.filter((v) => v.orders === 2).map((v) => [`${v.lo}|${v.hi}`, v]));
    let agree = 0, disagree = 0, tie = 0;
    for (const v of judges[a].vs.filter((x) => x.orders === 2)) {
      const w = B.get(`${v.lo}|${v.hi}`); if (!w) continue;
      if (v.winner === "tie" || w.winner === "tie") tie++; else if (v.winner === w.winner) agree++; else disagree++;
    }
    if (agree + disagree + tie) console.log(`${judges[a].name} vs ${judges[b].name}: same winner on ${agree} of ${agree + disagree} shared pairs where both picked a side (${pct(agree / Math.max(1, agree + disagree))}); ${tie} with a tie.`);
  }
  if (votes) for (const j of judges) {
    const x = agreementWith(votes, j.vs);
    if (x.n) console.log(`${j.name} vs you: agreed ${x.agree}, disagreed ${x.disagree}, tie ${x.judgeTie} on ${x.n} of your decisive votes it also judged (${pct(x.agree / Math.max(1, x.agree + x.disagree))} where it picked a side).`);
  }
}

// Batch results go to the judge the batch was submitted for, not whichever judge the config names now.
export function pairwiseBatchHandler(cfg) {
  const cache = new Map();
  return async (entry, timing, batch) => {
    const jd = batchJudge(cfg, batch || {});
    if (!cache.has(jd.key)) cache.set(jd.key, settings(cfg, { judge: jd.model, effort: jd.effort }));
    const s = cache.get(jd.key);
    const p = parseCustomId(entry.custom_id);
    if (!p) return log(`? unknown pairwise result ${entry.custom_id}`);
    if (entry.result.type !== "succeeded") return log(`✗ ${entry.custom_id} ${entry.result.type}`);
    const j = saveJudgment(cfg, s, p.lo, p.hi, p.order, entry.result.message, "batch");
    log(`✓ ${p.lo} vs ${p.hi} (${p.order}) → ${j.winner === "tie" ? "tie" : cell(j.winner || "?")} (${jd.key}, batch)`);
  };
}

// For the report: every judge with its verdicts; `primary` is the judge the config names.
export function pairwiseJudges(cfg) {
  const primary = settings(cfg).key;
  return listJudges(cfg).map((j) => ({ key: j.key, primary: j.key === primary, model: judgeLabel(cfg, j), effort: j.judge_effort, judgments: j.judgments.length, verdicts: verdicts(j) }))
    .filter((j) => j.verdicts.length);
}
