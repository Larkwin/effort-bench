// One place that turns a model name (from the config or the command line) into everything the harness
// needs to call and price it: id, label, short name, provider and price.
//
// Contestants live under `models:`. A model that only judges can be declared under `judges:` with the
// same fields. Every entry may name a `provider:`; it defaults to "anthropic", the only one implemented
// so far (see src/providers/ and docs/providers.md).
import { shortModel } from "./config.mjs";

export function knownModels(cfg) {
  const list = [...(cfg.models || []), ...(cfg.judges || [])];
  if (cfg.judge?.model && !list.some((m) => m.id === cfg.judge.model)) list.push({ id: cfg.judge.model, price: cfg.judge.price });
  return list.map((m) => ({ provider: "anthropic", label: m.label || m.id, ...m, short: shortModel(m.id) }));
}

export function resolveModel(cfg, name) {
  const all = knownModels(cfg);
  const want = String(name).toLowerCase();
  const m = all.find((x) => x.id === name || x.short === want || x.label.toLowerCase() === want);
  if (!m) throw new Error(`Unknown model "${name}". Known: ${all.map((x) => x.short).join(", ")}. Add it under models: or judges: in the config.`);
  if (!m.price) throw new Error(`No price for ${m.id}. Add price: { input, output } (USD per million tokens) to its config entry.`);
  return m;
}
