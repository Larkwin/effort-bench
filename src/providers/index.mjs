// Routes each model to the provider that serves it. A model's config entry may set `provider:`; the
// default is "anthropic". Only Anthropic is implemented. To add another, write src/providers/<name>.mjs
// to the contract in docs/providers.md and register it below.
import anthropic from "./anthropic.mjs";

const PROVIDERS = { anthropic };

export const providerName = (model) => model?.provider || "anthropic";
export const isImplemented = (model) => providerName(model) in PROVIDERS;

export function providerFor(model) {
  const name = providerName(model);
  const p = PROVIDERS[name];
  if (!p) throw new Error(`Provider "${name}" (for ${model?.id ?? "this model"}) isn't implemented yet. See docs/providers.md.`);
  return p;
}

// The provider's own effort setting for one of the bench's levels (low … max), or null when the model
// doesn't offer that level, in which case the cell is left out of the plan rather than faked.
// A config entry can map levels explicitly: efforts: { low: <native>, medium: <native>, xhigh: null }.
export function nativeEffort(model, level) {
  if (model?.efforts && Object.hasOwn(model.efforts, level)) return model.efforts[level];
  const p = PROVIDERS[providerName(model)];
  return !p || p.efforts.includes(level) ? level : null;
}
