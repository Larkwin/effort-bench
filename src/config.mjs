import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { ROOT, readJson, exists } from "./util.mjs";
import { nativeEffort } from "./providers/index.mjs";

export function loadConfig(file = "bench.config.yaml", overrides = {}) {
  const cfgPath = path.resolve(ROOT, file);
  const cfg = YAML.parse(fs.readFileSync(cfgPath, "utf8"));
  if (overrides.experiment) cfg.experiment = overrides.experiment;
  cfg._path = cfgPath;
  cfg._dir = path.join(ROOT, "results", cfg.experiment);
  cfg._runsDir = path.join(cfg._dir, "runs");
  cfg.promptText = fs.readFileSync(path.resolve(ROOT, cfg.prompt), "utf8");
  cfg.systemText = cfg.system ? fs.readFileSync(path.resolve(ROOT, cfg.system), "utf8") : null;
  cfg.rubricText = fs.readFileSync(path.resolve(ROOT, cfg.judge?.rubric || "judge/rubric.md"), "utf8");
  cfg.checks = { profile: "strict", ...cfg.checks }; // strict = full brand guide; light = style profile
  cfg.generation = { max_tokens: 128000, thinking_display: "summarized", concurrency: 4, shuffle: true, budget_usd: 75, ...cfg.generation };
  cfg.judge = { passes: 1, concurrency: 4, effort: "high", ...cfg.judge };
  return cfg;
}

// "claude-opus-5-5" -> "opus-5-5". Run ids must fit batch custom_id rules: ^[a-zA-Z0-9_-]{1,64}$
export const shortModel = (id) => id.replace(/^claude-/, "").replace(/[^a-zA-Z0-9-]/g, "-");
export const runId = (model, effort, n) => `${shortModel(model)}__${effort}__r${String(n).padStart(2, "0")}`;

export function plannedRuns(cfg, { models, efforts, runs } = {}) {
  const ms = cfg.models.filter((m) => !models || models.includes(m.id) || models.includes(shortModel(m.id)));
  const es = cfg.efforts.filter((e) => !efforts || efforts.includes(e));
  const n = runs ?? cfg.runs_per_cell;
  const out = [];
  // A model that doesn't offer an effort level (nativeEffort null) gets no runs for it.
  for (const m of ms) for (const e of es.filter((x) => nativeEffort(m, x) !== null)) for (let i = 1; i <= n; i++) {
    out.push({ id: runId(m.id, e, i), model: m, effort: e, n: i, dir: path.join(cfg._runsDir, runId(m.id, e, i)) });
  }
  return out;
}

export function runState(run) {
  const meta = readJson(path.join(run.dir, "meta.json"));
  return {
    meta,
    generated: !!meta && !meta.error,
    hasHtml: exists(path.join(run.dir, "output.html")),
    checked: exists(path.join(run.dir, "checks.json")),
    judged: exists(path.join(run.dir, "judge.json")),
  };
}

// Every run directory that exists on disk, whether or not it is still in the config.
export function existingRuns(cfg) {
  if (!exists(cfg._runsDir)) return [];
  return fs.readdirSync(cfg._runsDir).filter((d) => d.includes("__")).sort().map((id) => {
    const dir = path.join(cfg._runsDir, id);
    const meta = readJson(path.join(dir, "meta.json"), {});
    const model = cfg.models.find((m) => m.id === meta.model) || { id: meta.model, label: meta.model_label || meta.model };
    return { id, dir, model, effort: meta.effort, n: meta.n, meta };
  });
}
