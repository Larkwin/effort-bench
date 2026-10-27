# effort-bench

**Do you notice a difference between Claude models, and between effort levels?** One prompt for a small web app went to four Claude models (Opus 5.5, Fable 5.1, Sonnet 5.5, Haiku 5.5) at four effort levels, five times each. Every app was tested by script, judged side by side by two Claude models, and voted on blind by a person.

- **Take the blind test yourself:** https://larkwin.github.io/effort-bench/
- **Read the write-up:** [notes.lark.win/p/maximum-effort](https://notes.lark.win/p/maximum-effort)
- **Recompute every number in it:** `python3 analysis/post_numbers.py`

What we found, briefly:

- **Models: yes, clearly.** Opus 5.5 came first for the human and both judges; Haiku 5.5 came last.
- **Effort: yes, but only the big jumps.** Holding the model fixed, one effort level apart was a coin flip for the human (16 of 32); low against xhigh was 8 of 8.
- **A detailed brand guide narrows the gaps** between models but doesn't erase them.

The app is **Even Keel**, a single-file trip expense splitter for a made-up brand. It does real arithmetic (uneven splits, leftover cents, settle-up), so correctness is tested objectively, and its brief gives the design side something to be judged against. Two briefs were used: a *light* one (personality, two anchor colours, a voice, one principle) and a *detailed* brand guide (exact palette, fonts, sizes, rules).

## What's in this repository

```
src/                     the harness: generation, batches, checks, brand audit, judges, report, viewer
src/providers/           API provider routing (Anthropic today); see docs/providers.md
prompts/                 prompt-light.md (light brief), prompt.md (detailed brief)
judge/                   rubrics for the 1–10 scorer, prompts for the side-by-side judges
bench.light.yaml         light-brief experiment: models, prices, effort levels, judges
bench.config.yaml        detailed-brief experiment
fixtures/                hand-built reference apps: one that passes everything, one generic "AI look"
results/even-keel-light/ 80 apps, 2 side-by-side judges, 110 blind votes   (CC BY 4.0)
results/even-keel-v1/    detailed brief: 52 runs, 1 side-by-side judge     (CC BY 4.0)
results/calibration/     the scorer's sanity check on the fixtures
analysis/                post_numbers.py (every number in the write-up), figures.py, figures/
test/mock-api.mjs        a local stand-in for the API, to run everything without a key or spend
index.html               the GitHub Pages landing page
```

### Results data

Each `results/<experiment>/runs/<model>__<effort>__rNN/` holds one generation:

| File | Contents |
|---|---|
| `output.html` | the app as generated (the HTML extracted from the reply) |
| `response.json` | the full API response |
| `thinking.md` | the model's thinking summary |
| `meta.json` | model, effort, mode (`sync` or `batch`), usage and thinking tokens, `cost_usd` as billed (batch = half price), latency (sync runs only), stop reason, extraction and code stats |
| `checks.json` | the 15 functional tests, brand or style checks, accessibility results, screenshot names |
| `judge.json` | the 1–10 scorer's review (six dimensions, overall, AI tells, best and worst detail) |
| `*.jpg` | screenshots: empty desktop, filled desktop and filled mobile (the same sample trip) |

Alongside the runs:

- `pairwise/<judge>-<effort>.json`: side-by-side judgments, one entry per pair **and order** (`lo`, `hi`, `order`, `winner`, `strength`, `factor`, `evidence`, usage, cost). Combine the two orders of a pair to get its verdict; `analysis/lib.py` shows how.
- `ab-votes.json`: the blind votes (`a`, `b`, `winner` of `a`/`b`/`tie`, `pool` of `any` or `model` = same model, different effort).
- `batches.json`: every Message Batches job, with timing.
- `report.html`: the viewer with all data embedded; open it through `npm run view` or any static server.

## Reproduce it

The light-brief round with one judge cost about $62: $37.76 to generate 80 apps (most at batch prices), $7.76 to score them, $16.18 for the side-by-side judging. Batch jobs took from 2 minutes to 2 hours 20 minutes. Prices in the configs were checked on 2026-10-21.

```bash
npm install && npx playwright install chromium
export ANTHROPIC_API_KEY=sk-ant-...
node src/cli.mjs plan --config bench.light.yaml                        # matrix and cost estimate
node src/cli.mjs run --config bench.light.yaml --batch --wait          # 80 apps
node src/cli.mjs check --config bench.light.yaml                       # tests and screenshots
node src/cli.mjs judge --config bench.light.yaml --batch --wait        # 1–10 scores
node src/cli.mjs pairwise --config bench.light.yaml --batch --wait     # side-by-side round-robin
node src/cli.mjs view --config bench.light.yaml                        # http://localhost:4173/report.html
```

Use a new experiment name (`--exp my-run`) to keep your results apart from ours. Then vote blind in the viewer's Blind A/B tab, export your votes, and compare: `node src/cli.mjs pairwise --config bench.light.yaml --compare --votes <your export>`.

To recompute the write-up's numbers and figures from the data here, no API key needed:

```bash
python3 analysis/post_numbers.py
pip install matplotlib pillow && python3 analysis/figures.py && node analysis/render-table.mjs
```

## How this was built

Ian Howlett ([Larkwin](https://lark.win)) designed the experiment and cast the blind votes. Claude (Anthropic) wrote the harness, ran the analysis and drafted the write-up. The judges are Claude models as well, so the blind votes are the independent check on everything a judge says.

## Licence

Code (`src/`, `analysis/` scripts, `test/`) under the MIT licence in `LICENSE`. Data and content (`results/`, `prompts/`, `judge/`, `fixtures/`, `docs/`, `analysis/figures/`) under CC BY 4.0; see `LICENSE-DATA.md`.

---

The rest of this file is the harness manual.

## Setup

```bash
npm install
npx playwright install chromium        # browser for the checks
export ANTHROPIC_API_KEY=sk-ant-...
```

Requires Node 20 or later. To use an existing Chrome or Chromium instead of the Playwright download, set `CHROMIUM_PATH`.

If requests fail with a connection error, `node src/cli.mjs doctor` checks an ordinary request and the batch endpoint separately (for under a cent) and prints the underlying network error.

To see the viewer without spending anything:

```bash
npm run demo                           # fake runs built from the fixtures, real checks, simulated judge
npm run view -- --exp demo             # http://localhost:4173/report.html
```

To exercise every command without a key or spend, run the mock API in one terminal and point the harness at it:

```bash
node test/mock-api.mjs
ANTHROPIC_BASE_URL=http://127.0.0.1:8787 ANTHROPIC_API_KEY=test node src/cli.mjs run --config bench.light.yaml --exp mock-test --runs 1 --batch --wait
```

## Running the experiment

```bash
npm run plan                           # matrix, what's done, estimated cost of what's left
node src/cli.mjs calibrate             # ~$1: judge the three fixtures; confirm it ranks them correctly
npm run pilot                          # one run per cell (20 runs), synchronous
npm run check && npm run judge && npm run view
#   read a few outputs; if the prompt needs fixing, change it AND the experiment name
npm run run                            # fill the remaining runs (r02…r05)
npm run check && npm run judge && npm run view
```

`run` and `judge` skip work that already exists, so you can stop and resume at any point. Add `--force` to redo work, or `--retry-errors` to re-run failed generations.

**Batch mode** (`--batch`) sends requests through the Message Batches API: half price, but no latency data, and results can take up to 24 hours (usually under one). Use it as a fallback, or to raise the run count cheaply:

```bash
npm run run -- --batch --wait          # submit, poll, collect
npm run judge -- --batch               # submit and exit…
npm run collect                        # …collect later
```

Useful filters: `--models opus-5-5,haiku-5-5`, `--efforts low,max`, `--runs 1`, `--budget 20`, `--concurrency 8`.

## What gets measured

| Source | Per run |
|---|---|
| API | latency, time to first visible text, input, output and thinking tokens (`output_tokens_details.thinking_tokens`), cost, stop reason, thinking summary |
| Output | HTML size and lines, characters written outside the HTML (ignoring "HTML only"), code stats (CSS/JS lines, `innerHTML` writes, ARIA attributes, comments) |
| Functional checks (15) | people, duplicate names, validation, equal split, settle-up minimality, leftover cents, subset split, ordering, delete, reload persistence, currency format, keyboard focus, 390px overflow, HTML escaping |
| Brand lint (16) | typefaces, palette-only colours, gradients, shadows, radius, emoji, exclamation marks, sentence case, tabular figures, owing not in red, Signal usage, column width, focus ring, transitions, outside requests |
| Accessibility | axe-core WCAG 2.1 A/AA violations by impact |
| Judge | six 1–5 scores (brand fidelity, visual craft, copy and voice, UX completeness, code quality, directed design vs. unsupervised AI) plus overall 1–10, the AI tells it saw, brand violations, best and worst detail |

## Pairwise judge

Absolute 1–10 scores miss differences a person sees at a glance. `pairwise` shows the judge two outputs side by side, desktop and mobile with the sample trip entered, and asks which it would ship. Every pair is judged in both orders; if the orders disagree, the pair is a tie.

```bash
# 1. Check it against your own blind votes first (export them from the Blind A/B tab)
node src/cli.mjs pairwise --config bench.light.yaml --votes results/even-keel-light/ab-votes.json
# 2. If it agrees with you well enough, run a round-robin across every setting
node src/cli.mjs pairwise --config bench.light.yaml --dry-run          # count and cost
node src/cli.mjs pairwise --config bench.light.yaml --batch --wait     # half price
node src/cli.mjs report --config bench.light.yaml
```

Results land in `results/<experiment>/pairwise/<judge model>-<effort>.json` and show in the report's Blind A/B tab and as a heatmap metric. Settings live under `pairwise:` in the config.

**A second judge.** Any model in the config can judge the same pairs, which shows how much of a preference belongs to the judge rather than the outputs (for example, whether Opus favours its own look). Each judge keeps its own results file, and the report has a judge picker.

```bash
node src/cli.mjs pairwise --config bench.light.yaml --judge fable-5-1 --limit 2            # smoke test, ~$0.40
node src/cli.mjs pairwise --config bench.light.yaml --judge fable-5-1 --votes results/even-keel-light/ab-votes.json --batch
node src/cli.mjs pairwise --config bench.light.yaml --judge fable-5-1 --batch --wait       # same round-robin pairs
node src/cli.mjs pairwise --config bench.light.yaml --compare --votes results/even-keel-light/ab-votes.json
```

Win rates by model count only pairs between different models (and likewise for effort); ties count half.

## The viewer

`npm run view` builds `results/<experiment>/report.html` and serves it.

- **Overview:** model × effort heatmap for any metric, metric-by-effort lines, quality against cost, and a list of the biggest deltas.
- **Runs:** sortable table; click a run for its live app, checks, judge review, thinking summary and source.
- **Compare:** up to six runs side by side, live or as screenshots. Includes a metric table with Δ against the first column, checks that differ, judge reviews, a code diff, and thinking summaries. Quick picks: same effort across models, or same model across efforts (median, best or worst run of each cell).
- **Blind A/B:** two unlabelled outputs; vote with A / B / T. "Stay blind" (on by default) hides which setting made each app and all win rates until you turn it off; then you see your win rates by model, effort and setting next to each judge's. Votes stay in the browser, with export and import. Link straight to it with `report.html#ab`.

The report is a single HTML file; outputs run in sandboxed iframes with in-memory storage, so runs can't interfere with each other.

## Files

```
bench.config.yaml        models, prices, effort levels, runs per cell, budget, judge
prompts/prompt.md        the detailed-brief prompt (task, QA hooks, brand guide); prompt-light.md the light one
judge/                   rubric.md and rubric-light.md (1–10 scorer), pairwise.md and pairwise-strict.md (side by side)
fixtures/                reference.html (passes every check), generic.html (unsupervised-AI look)
src/                     cli, generation, batch, checks, brand audit, judge, pairwise, report, viewer
src/providers/           one adapter per API provider (Anthropic today) and the router
docs/providers.md        how to add another provider
results/<experiment>/    runs/<model>__<effort>__rNN/{output.html, meta.json, response.json,
                         thinking.md, checks.json, judge.json, *.jpg}, pairwise/, ab-votes.json,
                         batches.json, report.html
```

## Other providers

Only Anthropic is implemented. Each model in the config can name a `provider:`, and can map the bench's effort levels to its own settings, with `null` for a level it doesn't offer. `plan` shows what isn't runnable yet. What an adapter needs to do, and the decisions to make first, are in [docs/providers.md](docs/providers.md).

## Changing the test

- Edit `prompts/prompt.md`, and give the experiment a new name in `bench.config.yaml`. Every run records the prompt's hash, so results from different prompts aren't mixed by accident.
- If you change the brand, update the palette in `src/check.mjs` (`BRAND`) and the rules in `brandChecks`.
- If you change the app, update the QA hooks in the prompt and the scenario in `checkOne`.
- Keep the fixtures in step, and rerun `calibrate`.

## Caveats

- The default judge (Opus 5.5) is also a contestant. Judging is blind and anchored, but self-preference is possible. Compare the judge against your own A/B votes, or set `judge.model` to another model.
- Font checks read the declared font stack. Whether the Google Fonts actually loaded depends on the network.
- `thinking_display: summarized` adds a little time before the first visible text. Set it to `omitted` for the cleanest latency numbers.
- Prices in the config were checked on 2026-10-21. Check again before a large run.
