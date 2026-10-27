import fs from "node:fs";
import path from "node:path";
import { plannedRuns, runState, existingRuns } from "./config.mjs";
import { providerFor, providerName, isImplemented, nativeEffort } from "./providers/index.mjs";
import { extractHtml, codeStats } from "./extract.mjs";
import { writeJson, readJson, costUsd, pool, shuffle, log, usd, sha, sleep } from "./util.mjs";
import { submitBatch, pendingIds } from "./batch.mjs";

// Every call site still speaks the Anthropic Messages API, so this is the Anthropic client. When a second
// provider exists, generation and judging will ask providerFor(model) for theirs (docs/providers.md).
export const client = () => providerFor({ provider: "anthropic" }).client();

export function genParams(cfg, run) {
  const p = {
    model: run.model.id,
    max_tokens: cfg.generation.max_tokens,
    messages: [{ role: "user", content: cfg.promptText }],
    output_config: { effort: nativeEffort(run.model, run.effort) },
    thinking: { type: "adaptive", display: cfg.generation.thinking_display },
  };
  if (cfg.systemText) p.system = cfg.systemText;
  return p;
}

// Write everything we keep for one generation, from either a streamed or a batched message.
export function saveGeneration(cfg, run, message, extra) {
  fs.mkdirSync(run.dir, { recursive: true });
  const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const thinking = message.content.filter((b) => b.type === "thinking").map((b) => b.thinking).filter(Boolean).join("\n\n---\n\n");
  const ex = extractHtml(text);
  writeJson(path.join(run.dir, "response.json"), message);
  if (ex.html) fs.writeFileSync(path.join(run.dir, "output.html"), ex.html);
  if (thinking) fs.writeFileSync(path.join(run.dir, "thinking.md"), thinking);
  const usage = message.usage || {};
  const meta = {
    run_id: run.id,
    model: run.model.id,
    model_label: run.model.label,
    model_returned: message.model,
    provider: providerName(run.model),
    effort: run.effort,
    n: run.n,
    mode: extra.mode,
    prompt_sha: sha(cfg.promptText + (cfg.systemText || "")),
    max_tokens: cfg.generation.max_tokens,
    thinking_display: cfg.generation.thinking_display,
    stop_reason: message.stop_reason,
    usage,
    input_tokens: usage.input_tokens ?? null,
    output_tokens: usage.output_tokens ?? null,
    thinking_tokens: usage.output_tokens_details?.thinking_tokens ?? null,
    thinking_blocks: message.content.filter((b) => b.type === "thinking").length,
    cost_usd: costUsd(usage, run.model.price, { batch: extra.mode === "batch" }),
    extraction: { method: ex.method, complete: ex.complete, chatter_chars: ex.chatter_chars, chatter_sample: ex.chatter_sample, html_bytes: ex.html_bytes, html_lines: ex.html_lines },
    code: codeStats(ex.html),
    ...extra.timing,
    finished_at: new Date().toISOString(),
  };
  writeJson(path.join(run.dir, "meta.json"), meta);
  return meta;
}

function saveError(run, err, mode, attempt) {
  fs.mkdirSync(run.dir, { recursive: true });
  writeJson(path.join(run.dir, "meta.json"), {
    run_id: run.id, model: run.model.id, model_label: run.model.label, effort: run.effort, n: run.n, mode,
    error: { status: err.status ?? null, type: err.error?.error?.type ?? err.name, message: String(err.message).slice(0, 500) },
    attempts: attempt, finished_at: new Date().toISOString(),
  });
}

async function streamOne(api, cfg, run) {
  const params = genParams(cfg, run);
  const started = new Date();
  const t0 = performance.now();
  let firstBlock = null, firstText = null, deltaUsage = null;
  const stream = api.messages.stream(params);
  for await (const ev of stream) {
    const t = performance.now() - t0;
    if (ev.type === "content_block_start" && firstBlock === null) firstBlock = t;
    if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && firstText === null) firstText = t;
    if (ev.type === "message_delta" && ev.usage) deltaUsage = ev.usage;
  }
  const message = await stream.finalMessage();
  // The thinking-token breakdown arrives on the final message_delta; make sure it survives accumulation.
  if (deltaUsage?.output_tokens_details && !message.usage.output_tokens_details) {
    message.usage = { ...message.usage, output_tokens_details: deltaUsage.output_tokens_details };
  }
  const total = performance.now() - t0;
  return saveGeneration(cfg, run, message, {
    mode: "sync",
    timing: {
      started_at: started.toISOString(),
      latency_ms: Math.round(total),
      ttfb_ms: firstBlock === null ? null : Math.round(firstBlock),
      first_text_ms: firstText === null ? null : Math.round(firstText),
      output_tps: message.usage?.output_tokens ? +(message.usage.output_tokens / (total / 1000)).toFixed(1) : null,
    },
  });
}

function spentSoFar(cfg) {
  return existingRuns(cfg).reduce((s, r) => s + (r.meta?.cost_usd || 0), 0);
}

export async function runGenerate(cfg, opts) {
  const all = plannedRuns(cfg, opts);
  const inBatch = pendingIds(cfg, "generate");
  const todo = all.filter((r) => {
    const st = runState(r);
    if (inBatch.has(r.id)) return false;
    if (st.generated && !opts.force) return false;
    if (st.meta?.error && !opts.retryErrors && !opts.force) return false;
    return true;
  });
  if (!todo.length) { log(`Nothing to generate (${all.length} planned runs are done or pending in a batch).`); return; }
  const notYet = [...new Set(todo.filter((r) => !isImplemented(r.model)).map((r) => `${r.model.id} (${providerName(r.model)})`))];
  if (notYet.length) {
    log(`These models use a provider that isn't implemented yet: ${notYet.join(", ")}. Leave them out with --models, or see docs/providers.md.`);
    return;
  }

  const api = client();
  if (opts.batch) {
    // A batch can't be stopped part-way the way a synchronous run can, so check the estimate up front.
    const meas = measuredAverages(cfg), promptTok = cfg.promptText.length / 3.6;
    const est = todo.reduce((s, r) => {
      const m = meas[`${r.model.id}|${r.effort}`];
      const out = m ? m.out / m.n : cfg.estimate_output_tokens?.[r.effort] ?? 20000;
      return s + ((m ? m.inp / m.n : promptTok) * r.model.price.input + out * r.model.price.output) / 1e6 / 2;
    }, 0);
    const budget = opts.budget ?? cfg.generation.budget_usd, spent = spentSoFar(cfg);
    if (spent + est > budget && !opts.force) {
      log(`This batch is estimated at ${usd(est)}; with ${usd(spent)} already spent that passes the ${usd(budget)} budget. Raise it with --budget, or pass --force.`);
      return;
    }
    log(`Batch estimate ${usd(est)} (already spent ${usd(spent)} of ${usd(budget)}).`);
    const requests = todo.map((r) => ({ custom_id: r.id, params: genParams(cfg, r) }));
    await submitBatch(api, cfg, "generate", requests);
    return;
  }

  const order = cfg.generation.shuffle ? shuffle(todo) : todo;
  let spent = spentSoFar(cfg);
  const budget = opts.budget ?? cfg.generation.budget_usd;
  let done = 0, stopped = false;
  log(`Generating ${order.length} runs, concurrency ${cfg.generation.concurrency}, already spent ${usd(spent)} of ${usd(budget)} budget.`);

  await pool(order, opts.concurrency ?? cfg.generation.concurrency, async (run) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const meta = await streamOne(api, cfg, run);
        spent += meta.cost_usd || 0;
        done++;
        const think = meta.thinking_tokens != null ? ` (thinking ${meta.thinking_tokens.toLocaleString()})` : "";
        const flag = meta.stop_reason !== "end_turn" ? `  STOP=${meta.stop_reason}` : "";
        const ex = meta.extraction.method === "none" ? "  NO HTML" : `  html ${(meta.extraction.html_bytes / 1024).toFixed(0)}KB`;
        log(`✓ ${run.id.padEnd(30)} ${(meta.latency_ms / 1000).toFixed(1)}s  out ${meta.output_tokens.toLocaleString()}${think}  ${usd(meta.cost_usd)}${ex}${flag}  [${done}/${order.length}] spent ${usd(spent)}`);
        return;
      } catch (err) {
        const retryable = !err.status || err.status === 429 || err.status >= 500 || /overloaded/i.test(err.message);
        if (attempt < 3 && retryable) {
          log(`… ${run.id} attempt ${attempt} failed (${err.status ?? ""} ${err.message.slice(0, 120)}), retrying`);
          await sleep(15000 * attempt);
          continue;
        }
        saveError(run, err, "sync", attempt);
        done++;
        log(`✗ ${run.id} ${err.status ?? ""} ${err.message.slice(0, 200)}`);
        return;
      }
    }
  }, () => {
    if (spent >= budget) {
      if (!stopped) log(`Budget of ${usd(budget)} reached (spent ${usd(spent)}). Not starting more runs; raise generation.budget_usd or pass --budget to continue.`);
      stopped = true;
    }
    return stopped;
  });
  log(`Done. ${done} runs finished this session; experiment spend ${usd(spent)}.`);
}

// Handler for `collect`: turn one batch result line into a run folder.
export function generationBatchHandler(cfg) {
  const byId = new Map(plannedRuns(cfg, { runs: 999 }).map((r) => [r.id, r]));
  return async (entry, timing) => {
    let run = byId.get(entry.custom_id);
    if (!run) {
      const [m, effort, rn] = entry.custom_id.split("__");
      const model = cfg.models.find((x) => x.id.endsWith(m));
      run = { id: entry.custom_id, model, effort, n: Number(rn.slice(1)), dir: path.join(cfg._runsDir, entry.custom_id) };
    }
    if (entry.result.type === "succeeded") {
      const meta = saveGeneration(cfg, run, entry.result.message, { mode: "batch", timing });
      log(`✓ ${run.id} (batch) out ${meta.output_tokens} ${usd(meta.cost_usd)}`);
    } else {
      const err = entry.result.error || {};
      saveError(run, { status: null, name: entry.result.type, message: err.error?.message || entry.result.type, error: err }, "batch", 1);
      log(`✗ ${run.id} (batch) ${entry.result.type}`);
    }
  };
}

// Measured averages by cell, used by `plan` once some runs exist.
export function measuredAverages(cfg) {
  const acc = {};
  for (const r of existingRuns(cfg)) {
    const m = r.meta;
    if (!m || m.error || m.output_tokens == null) continue;
    const k = `${m.model}|${m.effort}`;
    (acc[k] ||= { out: 0, inp: 0, n: 0 });
    acc[k].out += m.output_tokens; acc[k].inp += m.input_tokens || 0; acc[k].n++;
  }
  return acc;
}

export function readMeta(run) { return readJson(path.join(run.dir, "meta.json")); }
