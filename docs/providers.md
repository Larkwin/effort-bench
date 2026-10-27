# Other providers

The goal is to put another vendor's models through the same brief, checks, judges and blind votes. They could be contestants, judges, or both. Only Anthropic is implemented today. This note covers what is already in place, what an adapter for another provider has to do, and the decisions to make before building one.

## Already in place

- **Every model has a provider.** A config entry may set `provider:`; the default is `anthropic`. `src/providers/index.mjs` routes each model to its provider. `plan` lists models whose provider isn't implemented yet. `run` and `judge` refuse them with a clear message instead of failing halfway.
- **Effort levels can be mapped per model.** The bench's levels are `low` … `max`. A model can map them to its own settings, and `null` means it doesn't offer that level. That cell is then left out of the plan, so it doesn't appear as a failure:
  ```yaml
  - id: <model id>
    label: <label>
    provider: <name>
    price: { input: 1.00, output: 4.00 }       # USD per million tokens
    efforts: { low: <native>, medium: <native>, high: <native>, xhigh: null }
  ```
- **Judges are interchangeable.** Any model in the config, or one listed under `judges:`, can be the pairwise judge (`--judge`). Each judge keeps its own results file, and `pairwise --compare` puts them side by side.
- **Runs record their provider** in `meta.json`.

## What an adapter has to do

The harness's internal format is the Anthropic Messages format. An adapter's job is translation in both directions, so that checks, judging, the report and the viewer don't change.

| Piece | Must provide | If the provider can't |
|---|---|---|
| `client()` | Authenticated client from an environment variable (`envKey`) | — |
| Generation | Send the brief with the mapped effort and an output cap. Return a message shaped like Anthropic's: `content` with `text` (and `thinking` if available), `stop_reason` mapped to `end_turn` or `max_tokens`, `usage.input_tokens`, `usage.output_tokens`, `usage.output_tokens_details.thinking_tokens` | Thinking tokens or summaries unavailable: leave them `null` so the report shows a gap, never a zero |
| Timing | Time to first content and first visible text, from streaming | Without streaming: latency only |
| Judging | Images plus text in, JSON matching a schema out | Without schema enforcement, the existing JSON fallback parse applies, and the error rate should be reported |
| Batch (optional) | Submit, poll, and stream results into the same handlers `collect` uses | Synchronous only |
| Price | Input and output price, including how reasoning tokens are billed | — |

Today `generate.mjs`, `judge.mjs` and `pairwise.mjs` call the Anthropic SDK directly. The first real adapter moves those calls behind `providerFor(model)`: a stream or complete function, and optional batch functions. That change is mechanical, and a small local mock of the new provider's API can test it without spending anything.

## Decisions to make first

1. **Which providers and models,** and API keys for each. One adapter per provider, plus a mock for testing.
2. **What "effort" means across vendors.** The levels have the same names but aren't equivalent. Options:
   - Map them by name and report each vendor's own label.
   - Compare settings by thinking tokens actually spent, which the bench already records.

   The question was about effort, so this choice shapes the findings.
3. **Who judges.** With other vendors in the field, a Claude-only judge panel has an obvious bias question. Use at least one non-Claude judge, and keep the same judges for every contestant.
4. **What the judges see.** Today they get screenshots only, or screenshots plus source. Both work for any vendor, but each judge model needs image input and reliable JSON output.
5. **Output caps and timeouts.** The bench gives every model the same 128k output allowance today. Vendors with lower caps either get the lower cap for everyone, or a noted exception.
6. **Run names.** Short model names must be unique across providers, and the longest run id must fit the 64-character batch id limit.
