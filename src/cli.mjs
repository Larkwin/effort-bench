#!/usr/bin/env node
import path from "node:path";
import { loadConfig, plannedRuns, runState, existingRuns } from "./config.mjs";
import { runGenerate, generationBatchHandler, measuredAverages, client } from "./generate.mjs";
import { collectBatches, loadBatches } from "./batch.mjs";
import { runChecks } from "./check.mjs";
import { runJudge, judgeBatchHandler } from "./judge.mjs";
import { runPairwise, pairwiseBatchHandler, summarize as pairwiseSummary, compareJudges } from "./pairwise.mjs";
import { buildReport, serve } from "./report.mjs";
import { buildDemoRuns, demoJudge, buildCalibration } from "./demo.mjs";
import { readJson } from "./util.mjs";
import { doctor } from "./doctor.mjs";
import { isImplemented, providerName, nativeEffort } from "./providers/index.mjs";
import { table, usd, log } from "./util.mjs";

const HELP = `effort-bench: one prompt, many Claude models and effort levels, compared.

Usage: node src/cli.mjs <command> [options]

  plan       Show the run matrix, what's done, and the estimated cost of what's left
  run        Generate outputs (streams; records latency). Skips runs already done
  collect    Fetch results of submitted batches (generation, judging and pairwise)
  check      Run Playwright checks, brand lint, accessibility and screenshots
  judge      Score each output with the judge model
  pairwise   Judge outputs head to head (both orders). --votes <file> checks it against your
             blind A/B export first; without it, a round-robin across all settings
  report     Build results/<experiment>/report.html
  view       Serve the report at http://localhost:4173
  all        run → check → judge → report
  doctor     Check this machine can reach the API (an ordinary request and the batch endpoint); < $0.01
  calibrate  Check and judge the three fixtures (good, almost right, generic) to sanity-check the judge
  demo       Build a no-cost demo report from the fixtures (simulated metrics, no API calls)

Options
  --config <file>        Config file (default bench.config.yaml)
  --exp <name>           Experiment name (default from config)
  --models a,b           Limit to these models (ids or short names like opus-5-5)
  --efforts low,max      Limit to these effort levels
  --runs <n>             Runs per cell for this command (e.g. --runs 1 for a pilot)
  --batch                Use the Message Batches API (50% price, no latency data)
  --wait                 With --batch or collect: poll until the batch ends, then collect
  --budget <usd>         Override generation.budget_usd for this session
  --concurrency <n>      Parallel requests
  --passes <n>           Judge passes per output
  --retry-errors         Re-run generations that failed
  --force                Redo work that already exists
  --port <n>             Port for view
  --votes <file>         pairwise: judge exactly the pairs in this A/B votes export and report agreement
  --pairs <n>            pairwise: run pairs per pair of settings in the round-robin (default 2)
  --effort <level>       pairwise: judge effort (default medium)
  --dry-run              pairwise: show what would be judged and the cost, then stop
  --summary              pairwise: print the results so far without judging anything
  --judge <model>        pairwise: judge with this model instead of the config's (e.g. fable-5-1).
                         Each judge model and effort keeps its own results file
  --limit <n>            pairwise: make at most n judgments (a cheap smoke test for a new judge)
  --compare              pairwise: every judge side by side, plus your votes if --votes is given
`;

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const o = { cmd };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) o[key] = true;
    else { o[key] = next; i++; }
  }
  for (const k of ["models", "efforts"]) if (typeof o[k] === "string") o[k] = o[k].split(",").map((s) => s.trim());
  for (const k of ["runs", "budget", "concurrency", "passes", "port", "pairs", "limit"]) if (o[k] !== undefined) o[k] = Number(o[k]);
  return o;
}

function plan(cfg, opts) {
  const runs = plannedRuns(cfg, opts);
  const measured = measuredAverages(cfg);
  const promptTokens = Math.round((cfg.promptText.length + (cfg.systemText?.length || 0)) / 3.6);
  const rows = [];
  let total = 0, totalBatch = 0, todoN = 0;
  for (const m of cfg.models) for (const e of cfg.efforts) {
    const rs = runs.filter((r) => r.model.id === m.id && r.effort === e);
    if (!rs.length) continue;
    const done = rs.filter((r) => runState(r).generated).length;
    const todo = rs.length - done;
    const meas = measured[`${m.id}|${e}`];
    const out = meas ? meas.out / meas.n : cfg.estimate_output_tokens?.[e] ?? 20000;
    const inp = meas ? meas.inp / meas.n : promptTokens;
    const each = (inp * m.price.input + out * m.price.output) / 1e6;
    total += each * todo; totalBatch += (each * todo) / 2; todoN += todo;
    rows.push([`${m.label} · ${e}`, rs.length, done, todo, `${Math.round(out / 1000)}k${meas ? "*" : ""}`, usd(each), usd(each * todo)]);
  }
  console.log(table(rows, ["cell", "planned", "done", "to do", "out tok", "per run", "to do cost"]));
  // Judge estimate: three screenshots, the rubric and brief, the source; a few thousand output tokens.
  const judged = existingRuns(cfg).filter((r) => runState(r).judged).length;
  const toJudge = runs.length - judged;
  const jp = cfg.judge.price || { input: 4, output: 20 };
  const judgeEach = ((3 * 1600 + 3500 + 9000) * jp.input + 4000 * jp.output) / 1e6 * (cfg.judge.passes || 1);
  console.log(`\nGeneration still to do: ${todoN} runs ≈ ${usd(total)} synchronous (${usd(totalBatch)} with --batch).`);
  console.log(`Judging ${toJudge} outputs ≈ ${usd(judgeEach * toJudge)} (${usd((judgeEach * toJudge) / 2)} with --batch).`);
  console.log(`Budget cap for synchronous generation: ${usd(cfg.generation.budget_usd)}. * = measured average from earlier runs.`);
  const notYet = cfg.models.filter((m) => !isImplemented(m));
  if (notYet.length) console.log(`Not runnable yet (provider not implemented, see docs/providers.md): ${notYet.map((m) => `${m.label || m.id} (${providerName(m)})`).join(", ")}.`);
  const skipped = cfg.models.flatMap((m) => cfg.efforts.filter((e) => nativeEffort(m, e) === null).map((e) => `${m.label || m.id} · ${e}`));
  if (skipped.length) console.log(`Left out because the model doesn't offer that effort level: ${skipped.join(", ")}.`);
  const open = loadBatches(cfg).filter((b) => !b.collected);
  if (open.length) console.log(`Open batches: ${open.map((b) => `${b.kind} ${b.id} (${b.custom_ids.length})`).join(", ")}. Run \`collect\`.`);
}

async function collect(cfg, opts) {
  await collectBatches(client(), cfg, { generate: generationBatchHandler(cfg), judge: judgeBatchHandler(cfg), pairwise: pairwiseBatchHandler(cfg) }, { wait: !!opts.wait });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.cmd || opts.cmd === "help" || opts.help) return console.log(HELP);
  const cfg = loadConfig(opts.config || "bench.config.yaml", { experiment: opts.exp || (opts.cmd === "demo" ? "demo" : undefined) });
  log(`Experiment "${cfg.experiment}" → ${path.relative(process.cwd(), cfg._dir) || "."}`);

  switch (opts.cmd) {
    case "plan": return plan(cfg, opts);
    case "doctor": return doctor();
    case "run":
      await runGenerate(cfg, opts);
      if (opts.batch && opts.wait) await collect(cfg, { wait: true });
      return;
    case "collect": return collect(cfg, opts);
    case "check": return runChecks(cfg, opts);
    case "judge":
      await runJudge(cfg, opts);
      if (opts.batch && opts.wait) await collect(cfg, { wait: true });
      return;
    case "pairwise": {
      const votes = opts.votes ? readJson(path.resolve(process.cwd(), opts.votes), {}).votes || [] : null;
      if (opts.compare) return compareJudges(cfg, votes);
      if (opts.summary) return pairwiseSummary(cfg, votes, opts);
      await runPairwise(cfg, opts);
      if (opts.batch && opts.wait) { await collect(cfg, { wait: true }); pairwiseSummary(cfg, votes, opts); }
      return;
    }
    case "report": return buildReport(cfg);
    case "view": buildReport(cfg); return serve(cfg, opts.port || 4173);
    case "all":
      await runGenerate(cfg, opts);
      if (opts.batch) await collect(cfg, { wait: true });
      await runChecks(cfg, opts);
      await runJudge(cfg, opts);
      if (opts.batch) await collect(cfg, { wait: true });
      return buildReport(cfg);
    case "calibrate": {
      const cal = loadConfig(opts.config || "bench.config.yaml", { experiment: "calibration" });
      const fixtures = buildCalibration(cal);
      await runChecks(cal, { force: true });
      await runJudge(cal, { passes: opts.passes || 2 });
      const rows = fixtures.map((f) => {
        const c = readJson(path.join(f.dir, "checks.json"), {}).summary || {};
        const j = readJson(path.join(f.dir, "judge.json"), {}).mean || {};
        return [f.label, `${c.functional_pass}/15`, `${c.brand_pass}/16`, j.overall ?? "—", j.overall_sd ?? "—", j.directed_design ?? "—", j.brand_fidelity ?? "—"];
      });
      console.log("\n" + table(rows, ["fixture", "functional", "brand lint", "judge overall", "± sd", "directed", "brand fid."]));
      console.log("\nExpect reference > almost right > generic on overall, and generic lowest on directed design.");
      return buildReport(cal);
    }
    case "demo":
      buildDemoRuns(cfg, opts.runs || 2);
      await runChecks(cfg, { force: true });
      demoJudge(cfg);
      return buildReport(cfg, { mock: true });
    default:
      console.log(`Unknown command "${opts.cmd}".\n`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
