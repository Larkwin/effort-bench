"""Recompute every number in the write-up from the raw results.

    python3 analysis/post_numbers.py

Light brief = results/even-keel-light (80 apps, 110 blind votes, two side-by-side judges).
Detailed brief = results/even-keel-v1 (3 runs per setting from low to xhigh, plus one max-effort run each).
"""
import collections, statistics as st
from lib import *

L, D = "even-keel-light", "even-keel-v1"
runs, druns = load_runs(L), load_runs(D)
votes = load_votes(L)
J = {k: verdicts(load_judgments(L, k)) for k in ("opus-5-5-medium", "fable-5-1-medium")}
voted = {pair_key(v) for v in votes}
RR = {k: [v for v in vs if pair_key(v) not in voted] for k, vs in J.items()}   # balanced round-robin
pct = lambda x: f"{100 * x:.0f}%"
def head(t): print(f"\n== {t}")

head("Setup")
print(f"light apps {len(runs)}, detailed runs {len(druns)} (delivered {sum(r['delivered'] for r in druns.values())}), "
      f"votes {len(votes)} on {len(voted)} distinct pairs ({collections.Counter(v['pool'] for v in votes)})")
print("round-robin pairs per judge:", {k: len(v) for k, v in RR.items()})
gen = sum(r["cost_paid"] for r in list(runs.values()) + list(druns.values()))
score_cost = sum(r["judge_cost"] for r in list(runs.values()) + list(druns.values()))
pw = {f"{e}/{k}": sum(j.get("cost_usd") or 0 for j in load_judgments(e, k)) for e, ks in ((L, J), (D, ["opus-5-5-medium"])) for k in ks}
print(f"spend: generation ${gen:.2f}, scoring ${score_cost:.2f}, side-by-side ${sum(pw.values()):.2f} {({k: round(v, 2) for k, v in pw.items()})}, "
      f"+ $0.66 judge calibration = ${gen + score_cost + sum(pw.values()) + 0.66:.2f}")

head("Models (cross-model comparisons only; ties half)")
ian_any = [v for v in votes if v["pool"] == "any"]
for name, vs in [("Ian, first 46 votes", ian_any)] + [(k, RR[k]) for k in RR]:
    r = win_rates(vs, model); print(f"{name:22}", {m: f"{pct(r[m][0])} ({r[m][1]})" for m in MODELS})
A, B = ({pair_key(v): v for v in J[k]} for k in J)
agree = sum(1 for k, v in A.items() if k in B and "tie" not in (v["winner"], B[k]["winner"]) and v["winner"] == B[k]["winner"])
both = sum(1 for k, v in A.items() if k in B and "tie" not in (v["winner"], B[k]["winner"]))
print(f"judges agree {agree}/{both} = {pct(agree / both)} where both picked a side")
for k, vs in J.items():
    mp = {pair_key(v): v for v in vs}; a = d = 0
    for v in votes:
        j = mp.get(pair_key(v))
        if v["winner"] == "tie" or not j or j["winner"] == "tie": continue
        a += j["winner"] == v["winner"]; d += j["winner"] != v["winner"]
    print(f"{k} agrees with Ian {a}/{a + d} = {pct(a / (a + d))}")
cr = {k: bradley_terry(RR[k], SETTINGS, setting) for k in RR}
print("Spearman between judges' setting rankings: %.2f" % spearman([cr["opus-5-5-medium"][s] for s in SETTINGS], [cr["fable-5-1-medium"][s] for s in SETTINGS]))
for k in RR:
    order = sorted(SETTINGS, key=lambda s: -cr[k][s])
    print(f"{k} setting ranks:", ", ".join(f"{i + 1}. {s}" for i, s in enumerate(order)))
ian_bt = bradley_terry(votes, SETTINGS, setting)
print("Ian setting ranks (sparse):", ", ".join(f"{i + 1}. {s}" for i, s in enumerate(sorted(SETTINGS, key=lambda s: -ian_bt[s]))))

head("Effort, same model held fixed")
same = [v for v in votes if model(v["lo"]) == model(v["hi"])]
rate, n, w = higher_effort_share(same)
print(f"Ian: higher effort won {w}/{n} = {pct(rate)}; one-sided exact binomial p = {binomial_upper_tail(round(w), n):.4f}")
same_pairs = {pair_key(v) for v in same}
for gap in (1, 2, 3):
    row = [f"Ian {higher_effort_share(same, gap)[2]:g}/{higher_effort_share(same, gap)[1]}"]
    for k, vs in J.items():
        r = higher_effort_share([v for v in vs if pair_key(v) in same_pairs], gap); row.append(f"{k} {pct(r[0])} of {r[1]} pairs")
    print(f"gap {gap}:", " | ".join(row))
print("Ian's first 46 votes by effort:", {e: pct(r[0]) for e, r in win_rates(ian_any, effort).items()})
for k in RR: print(f"{k} round-robin, higher effort within a model: {pct(higher_effort_share(RR[k])[0])} of {higher_effort_share(RR[k])[1]}")

head("Owing kept out of red (light brief L02), by setting")
print({s: sum(owing_ok(runs[i]) for i in runs if setting(i) == s) for s in SETTINGS})
for label, pool in (("cross-model", lambda v: model(v["lo"]) != model(v["hi"])), ("same-model", lambda v: model(v["lo"]) == model(v["hi"]))):
    sv = [v for v in votes if pool(v) and owing_ok(runs[v["lo"]]) != owing_ok(runs[v["hi"]])]
    iw = sum(score(v, v["lo"] if owing_ok(runs[v["lo"]]) else v["hi"]) for v in sv)
    row = [f"Ian {iw:g}/{len(sv)} votes"]
    for k, vs in J.items():
        mp = {pair_key(v): v for v in vs}; js = [mp[p] for p in {pair_key(v) for v in sv} if p in mp]
        row.append(f"{k} {sum(score(j, j['lo'] if owing_ok(runs[j['lo']]) else j['hi']) for j in js):g}/{len(js)} pairs")
    print(f"{label} pairs where exactly one kept owing out of red:", " | ".join(row))

head("Bigger apps (more HTML), decisive pairs where both sides handled owing the same way")
for name, vs in [("Ian", votes)] + list(J.items()):
    sub = [v for v in vs if v["winner"] != "tie" and owing_ok(runs[v["lo"]]) == owing_ok(runs[v["hi"]])]
    big = sum(runs[v["winner"]]["html_kb"] > runs[v["hi"] if v["winner"] == v["lo"] else v["lo"]]["html_kb"] for v in sub)
    print(f"{name}: larger app won {big}/{len(sub)} = {pct(big / len(sub))}")

head("Judges' consistency, ties, deciding factors, self-preference")
for k, vs in RR.items():
    print(f"{k}: same answer in both orders {pct(sum(v['consistent'] for v in vs) / len(vs))}, ties {pct(sum(v['winner'] == 'tie' for v in vs) / len(vs))}, "
          f"cost ${sum(j.get('cost_usd') or 0 for j in load_judgments(L, k)):.2f} for {len(load_judgments(L, k))} judgments")
fac = collections.Counter(f for v in RR["opus-5-5-medium"] for f in v["factors"])
print("Opus judge deciding factors (light):", {f: pct(c / sum(fac.values())) for f, c in fac.most_common()})

head("Detailed brief vs light brief (Opus judge, max effort excluded)")
S = [v for v in verdicts(load_judgments(D, "opus-5-5-medium")) if "max" not in (effort(v["lo"]), effort(v["hi"]))]
for name, vs in (("light", RR["opus-5-5-medium"]), ("detailed", S)):
    fc = collections.Counter(f for v in vs for f in v["factors"]); sc = collections.Counter(s for v in vs for s in v["strengths"])
    print(f"{name}: {len(vs)} pairs; models", {m: pct(r[0]) for m, r in win_rates(vs, model).items()},
          f"| brand decided {pct(fc['brand'] / sum(fc.values()))}, slight {pct(sc['slight'] / sum(sc.values()))}, ties {pct(sum(v['winner'] == 'tie' for v in vs) / len(vs))}, "
          f"higher effort within model {pct(higher_effort_share(vs)[0])}")
dd = [r for r in druns.values() if r["delivered"] and effort(r["id"]) != "max"]
print(f"detailed: {len(dd)} apps; min brand checks passed {min(r['checks']['summary']['brand_pass'] for r in dd)}/16; owing out of red {sum(owing_ok(r) for r in dd)}; "
      f"scored exactly 8: {sum(r['overall'] == 8 for r in dd)}")

head("Scores out of 10 (light)")
print("distribution:", sorted(collections.Counter(r["overall"] for r in runs.values()).items()))
dec = [v for v in votes if v["winner"] != "tie"]
print(f"Ian's decisive votes where both apps had the same score: {sum(runs[v['lo']]['overall'] == runs[v['hi']]['overall'] for v in dec)}/{len(dec)}")
print(f"apps with at least one AI tell: {sum(bool(r['tells']) for r in runs.values())}; pill tells {sum(any('pill' in t.lower() for t in r['tells']) for r in runs.values())}; "
      f"banner-comment tells {sum(any('banner' in t.lower() and 'comment' in t.lower() for t in r['tells']) for r in runs.values())}")

head("One run can mislead (Opus judge round-robin)")
def record(k, i):
    mine = [v for v in RR[k] if i in (v["lo"], v["hi"])]; return sum(score(v, i) for v in mine), len(mine)
lucky = "opus-5-5__low__r01"
print(f"{lucky}: Ian {sum(score(v, lucky) for v in votes if lucky in (v['lo'], v['hi'])):g}/{sum(1 for v in votes if lucky in (v['lo'], v['hi']))} votes; round-robin",
      {k: record(k, lucky) for k in RR})
rb = bradley_terry(RR["opus-5-5-medium"], list(runs))
order = sorted(runs, key=lambda i: -rb[i])
print("Opus low-effort apps' run ranks of 80:", sorted(order.index(i) + 1 for i in runs if setting(i) == "opus-5-5__low"))
by = collections.defaultdict(list)
for i, s in rb.items(): by[setting(i)].append(s)
print("within-setting SD / between-setting SD: %.2f" % (st.mean(st.pstdev(v) for v in by.values()) / st.pstdev([st.mean(v) for v in by.values()])))
broken = [i for i in runs if runs[i]["functional_pass"] < 15]
print("apps below 15/15:", {i: runs[i]["functional_pass"] for i in broken}, "round-robin wins", {k: sum(record(k, i)[0] for i in broken) for k in RR}, "of", sum(record("opus-5-5-medium", i)[1] for i in broken))

head("Every setting (light): cost at standard prices, median time of timed runs, thinking tokens, tests, owing")
for s in SETTINGS:
    rs = [r for r in runs.values() if setting(r["id"]) == s]; lat = [r["latency_s"] for r in rs if r["latency_s"]]
    print(f"{s:18} ${st.mean(r['cost_std'] for r in rs):.3f}  {st.median(lat):5.0f}s  think {st.mean(r['thinking_tokens'] or 0 for r in rs):7.0f}  "
          f"all 15 tests {sum(r['functional_pass'] == 15 for r in rs)}/5  owing {sum(owing_ok(r) for r in rs)}/5  "
          f"judge win prob {pct(win_prob(cr['opus-5-5-medium'][s]))} / {pct(win_prob(cr['fable-5-1-medium'][s]))}")
print("most expensive Haiku app: $%.3f" % max(r["cost_std"] for r in runs.values() if model(r["id"]) == "haiku-5-5"))

head("House style (light brief, observed)")
heads = collections.Counter(); ui = collections.Counter(); c = collections.Counter()
for r in runs.values():
    b = r["brand"]; d = b["S01"]["detail"]
    if "; UI: " in d:
        h, u = d.split("; UI: "); heads["Fraunces" in h] += 1; ui[u] += 1
    c["pill"] += "999" in b["S05"]["detail"] or any(int(x) >= 50 for x in __import__("re").findall(r"up to (\d+)px", b["S05"]["detail"]))
    for k2, sid in (("gradients", "S03"), ("shadows", "S04"), ("emoji", "S06"), ("exclamation", "S07")): c[k2] += b[sid]["detail"] != "none"
print(f"Fraunces headings {heads[True]}/80; UI fonts {ui.most_common(5)}; {dict(c)}")

head("Max effort (detailed brief, first round)")
for r in druns.values():
    if effort(r["id"]) == "max":
        print(f"{r['id']}: delivered {r['delivered']}, stop {r['meta'].get('stop_reason')}, {r['meta'].get('output_tokens')} out tokens, "
              f"{(r['latency_s'] or 0) / 60:.1f} min, ${r['cost_paid']:.2f}, tests {r['functional_pass']}")
