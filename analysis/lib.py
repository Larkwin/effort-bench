"""Load effort-bench results straight from results/<experiment>/ and compute the measures used in the write-up.

Standard library only. Everything reads the raw files the harness writes:
  results/<exp>/runs/<model>__<effort>__rNN/{meta.json, checks.json, judge.json}
  results/<exp>/pairwise/<judge>-<effort>.json   side-by-side judgments, one entry per order
  results/<exp>/ab-votes.json                    blind votes exported from the viewer
"""
import json, math, collections, statistics as st
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "results"
MODELS = ["opus-5-5", "fable-5-1", "sonnet-5-5", "haiku-5-5"]
EFFORTS = ["low", "medium", "high", "xhigh"]
LABEL = {"opus-5-5": "Opus 5.5", "fable-5-1": "Fable 5.1", "sonnet-5-5": "Sonnet 5.5", "haiku-5-5": "Haiku 5.5"}

model = lambda run_id: run_id.split("__")[0]
effort = lambda run_id: run_id.split("__")[1]
setting = lambda run_id: "__".join(run_id.split("__")[:2])
SETTINGS = [f"{m}__{e}" for m in MODELS for e in EFFORTS]


def read(path, default=None):
    try:
        return json.loads(Path(path).read_text())
    except (OSError, ValueError):
        return default


def load_runs(exp):
    """Every run folder as a dict. cost_std is the cost at standard (non-batch) prices, so settings
    compare fairly; batch runs were billed at exactly half."""
    runs = {}
    for d in sorted((RESULTS / exp / "runs").iterdir()):
        if "__" not in d.name:
            continue
        meta = read(d / "meta.json", {})
        checks = read(d / "checks.json")
        judge = read(d / "judge.json")
        paid = meta.get("cost_usd") or 0
        brand = {b["id"]: b for b in (checks or {}).get("brand", [])}
        runs[d.name] = {
            "id": d.name, "dir": d, "meta": meta, "checks": checks, "brand": brand,
            "delivered": bool(meta.get("extraction", {}).get("complete")) and (d / "output.html").exists(),
            "cost_paid": paid, "cost_std": paid * 2 if meta.get("mode") == "batch" else paid,
            "latency_s": meta["latency_ms"] / 1000 if meta.get("latency_ms") is not None else None,
            "thinking_tokens": meta.get("thinking_tokens"), "html_kb": (meta.get("extraction") or {}).get("html_bytes", 0) / 1024,
            "functional_pass": (checks or {}).get("summary", {}).get("functional_pass"),
            "overall": ((judge or {}).get("mean") or {}).get("overall"),
            "judge_cost": sum(p.get("cost_usd") or 0 for p in (judge or {}).get("passes", [])),
            "tells": [t for p in (judge or {}).get("passes", []) for t in (p.get("review") or {}).get("ai_tells", [])],
        }
    return runs


def owing_ok(run):
    """Light brief: L02. Detailed brief: B11. Both test that owing money is not shown in red."""
    b = run["brand"].get("L02") or run["brand"].get("B11")
    return bool(b and b["pass"])


def load_judgments(exp, judge_key):
    return read(RESULTS / exp / "pairwise" / f"{judge_key}.json", {"judgments": []})["judgments"]


def verdicts(judgments):
    """Combine both orders of each pair: a win scores 1, a tie 0.5; more than half wins the pair."""
    by = collections.defaultdict(list)
    for j in judgments:
        if j.get("winner"):
            by[(j["lo"], j["hi"])].append(j)
    out = []
    for (lo, hi), js in by.items():
        s = sum(1 if j["winner"] == lo else 0.5 if j["winner"] == "tie" else 0 for j in js)
        n = len(js)
        out.append({"lo": lo, "hi": hi, "winner": lo if s > n / 2 else hi if s < n / 2 else "tie", "orders": n,
                    "consistent": js[0]["winner"] == js[1]["winner"] if n == 2 else None,
                    "factors": [j.get("factor") for j in js], "strengths": [j.get("strength") for j in js]})
    return out


def load_votes(exp):
    """Blind votes as verdicts. Each vote stays separate (a pair voted twice counts twice)."""
    votes = read(RESULTS / exp / "ab-votes.json", {"votes": []})["votes"]
    return [{"lo": v["a"], "hi": v["b"], "pool": v.get("pool"), "at": v.get("at"),
             "winner": v["a"] if v["winner"] == "a" else v["b"] if v["winner"] == "b" else "tie"} for v in votes]


pair_key = lambda v: tuple(sorted((v["lo"], v["hi"])))
score = lambda v, run_id: 0.5 if v["winner"] == "tie" else 1.0 if v["winner"] == run_id else 0.0


def win_rates(vs, key):
    """Share of comparisons each group won, from pairs whose two sides fall in different groups.
    Returns {group: (rate, comparisons)}."""
    w, n = collections.Counter(), collections.Counter()
    for v in vs:
        if key(v["lo"]) == key(v["hi"]):
            continue
        for r in (v["lo"], v["hi"]):
            w[key(r)] += score(v, r)
            n[key(r)] += 1
    return {k: (w[k] / n[k], n[k]) for k in n}


def higher_effort_share(vs, gap=None):
    """Same model, different effort: share won by the higher-effort side (ties half). Returns (rate, pairs, wins)."""
    w = n = 0
    for v in vs:
        if model(v["lo"]) != model(v["hi"]) or effort(v["lo"]) == effort(v["hi"]):
            continue
        a, b = EFFORTS.index(effort(v["lo"])), EFFORTS.index(effort(v["hi"]))
        if gap is not None and abs(a - b) != gap:
            continue
        w += score(v, v["lo"] if a > b else v["hi"])
        n += 1
    return (w / n if n else None, n, w)


def bradley_terry(vs, items, key=lambda x: x, prior=0.5, iters=3000):
    """Log-strengths from pairwise results (ties count half a win each). `prior` adds that many virtual wins
    against a unit-strength opponent, so items with all wins or all losses stay finite."""
    p = {i: 1.0 for i in items}
    W, N = collections.Counter(), collections.Counter()
    for v in vs:
        a, b = key(v["lo"]), key(v["hi"])
        if a == b:
            continue
        W[a] += score(v, v["lo"]); W[b] += score(v, v["hi"]); N[frozenset((a, b))] += 1
    nb = {i: [] for i in items}
    for pr, n in N.items():
        a, b = tuple(pr); nb[a].append((b, n)); nb[b].append((a, n))
    for _ in range(iters):
        q = {i: (W[i] + prior) / (sum(n / (p[i] + p[j]) for j, n in nb[i]) + 2 * prior / (p[i] + 1)) for i in items}
        g = math.exp(sum(math.log(x) for x in q.values()) / len(q))
        p = {i: q[i] / g for i in q}
    return {i: math.log(p[i]) for i in p}


win_prob = lambda s: 1 / (1 + math.exp(-s))  # chance of beating an average item


def spearman(x, y):
    def ranks(v):
        s = sorted(v)
        return [s.index(a) + (s.count(a) - 1) / 2 for a in v]
    rx, ry = ranks(x), ranks(y)
    mx, my = st.mean(rx), st.mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    return num / math.sqrt(sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry))


def binomial_upper_tail(k, n):
    return sum(math.comb(n, i) for i in range(k, n + 1)) / 2 ** n
