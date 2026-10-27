import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { existingRuns } from "./config.mjs";
import { pairwiseJudges } from "./pairwise.mjs";
import { ROOT, readJson, exists, log, sha, costUsd } from "./util.mjs";

export function buildReport(cfg, opts = {}) {
  let mock = !!opts.mock;
  const runs = existingRuns(cfg).map((r) => {
    const meta = r.meta || {};
    const checks = readJson(path.join(r.dir, "checks.json"));
    const judge = readJson(path.join(r.dir, "judge.json"));
    const htmlFile = path.join(r.dir, "output.html");
    const thinkFile = path.join(r.dir, "thinking.md");
    const reviews = (judge?.passes || []).map((p) => p.review).filter(Boolean);
    // A run that finished without a complete app (e.g. it spent max_tokens thinking) counts as a
    // delivery failure scoring zero, not as missing data. Otherwise cell averages only include the
    // runs that succeeded and flatter the settings that fail. API errors stay out: they are infrastructure.
    const finished = !!meta.model && !meta.error;
    const delivered = finished ? !!meta.extraction?.complete && exists(htmlFile) : null;
    const undelivered = finished && !delivered && !checks
      ? { functional: [], brand: [], functional_pass: 0, functional_total: 15, functional_rate: 0, brand_pass: 0, brand_total: cfg.checks?.profile === "light" ? 2 : 16, brand_rate: 0,
          a11y_serious: null, a11y_total: null, console_errors: null, fatal: `no complete app (stop reason: ${meta.stop_reason})`, a11y_rules: [] }
      : null;
    return {
      delivered,
      id: r.id,
      dir: path.relative(cfg._dir, r.dir).split(path.sep).join("/"),
      model: meta.model,
      model_label: meta.model_label || cfg.models.find((m) => m.id === meta.model)?.label || meta.model,
      effort: meta.effort,
      n: meta.n,
      error: meta.error ? `${meta.error.type || ""} ${meta.error.status || ""}: ${meta.error.message}` : null,
      html: exists(htmlFile) ? fs.readFileSync(htmlFile, "utf8") : null,
      thinking: exists(thinkFile) ? fs.readFileSync(thinkFile, "utf8").slice(0, 30000) : null,
      m: {
        mode: meta.mode,
        // Compare settings at standard prices; batch runs are billed at half, which would
        // otherwise make any cell with batch runs look cheaper. Actual spend is kept separately.
        cost: (() => { const p = cfg.models.find((x) => x.id === meta.model)?.price; return p && meta.usage ? costUsd(meta.usage, p) : meta.cost_usd ?? null; })(),
        cost_paid: meta.cost_usd ?? null,
        latency_s: meta.latency_ms != null ? meta.latency_ms / 1000 : null,
        first_text_s: meta.first_text_ms != null ? meta.first_text_ms / 1000 : null,
        out_tokens: meta.output_tokens ?? null,
        thinking_tokens: meta.thinking_tokens ?? null,
        input_tokens: meta.input_tokens ?? null,
        stop_reason: meta.stop_reason ?? (meta.error ? "error" : null),
        html_kb: meta.extraction ? meta.extraction.html_bytes / 1024 : null,
        html_lines: meta.extraction?.html_lines ?? null,
        chatter: meta.extraction?.chatter_chars ?? null,
        chatter_sample: meta.extraction?.chatter_sample ?? "",
        code: meta.code ?? null,
      },
      checks: undelivered || (checks ? {
        functional: checks.functional, brand: checks.brand,
        ...checks.summary,
        a11y_rules: checks.a11y?.rules || [],
      } : null),
      screenshots: checks?.screenshots || {},
      judge: judge?.mean || null,
      judge_review: reviews[0] || null,
      judge_tells: [...new Set(reviews.flatMap((x) => x.ai_tells || []))],
      judge_cost: (judge?.passes || []).reduce((s, p) => s + (p.cost_usd || 0), 0),
    };
  }).filter((r) => r.model && r.effort);
  // Demo runs keep the demo banner even when the report is rebuilt with plain `report`.
  mock = mock || runs.some((r) => r.m.mode === "demo");

  const data = {
    experiment: cfg.experiment,
    generated_at: new Date().toISOString(),
    mock,
    prompt: cfg.promptText,
    prompt_sha: sha(cfg.promptText + (cfg.systemText || "")),
    rubric: cfg.rubricText,
    config: {
      models: cfg.models.map((m) => ({ id: m.id, label: m.label, price: m.price })),
      efforts: cfg.efforts,
      runs_per_cell: cfg.runs_per_cell,
      generation: cfg.generation,
      judge: { model: mock ? "heuristic stand-in" : cfg.judge.model, effort: mock ? "n/a" : cfg.judge.effort, passes: cfg.judge.passes },
    },
    runs,
    // Every pairwise judge that has results; the viewer shows the primary one (the config's) first.
    pairwise_judges: pairwiseJudges(cfg),
  };
  const tpl = fs.readFileSync(path.join(ROOT, "src", "viewer.html"), "utf8");
  const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
  const json = JSON.stringify(data).replace(/</g, "\\u003c").split(LS).join("\\u2028").split(PS).join("\\u2029");
  const out = path.join(cfg._dir, "report.html");
  fs.writeFileSync(out, tpl.replace("/*__BENCH_DATA__*/null", () => json)); // function form: "$" sequences in the data stay literal
  log(`Report: ${out} (${runs.length} runs, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
  return out;
}

// Serve the experiment folder so the report, screenshots and outputs load from one origin.
export function serve(cfg, port = 4173) {
  const types = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json", ".md": "text/plain; charset=utf-8" };
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "report.html";
    const file = path.resolve(cfg._dir, rel);
    if (!file.startsWith(cfg._dir) || !exists(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  server.listen(port, "127.0.0.1", () => log(`Open http://localhost:${port}/report.html  (Ctrl+C to stop)`));
}
