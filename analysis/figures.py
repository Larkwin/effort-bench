"""Draw the write-up's figures into analysis/figures/.

    pip install matplotlib pillow      # Inter font optional; falls back to the default sans
    python3 analysis/figures.py
    node analysis/render-table.mjs     # settings-table.html -> 7-settings-table.png (uses the harness's Playwright)
"""
import json, math, statistics as st, collections
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
from matplotlib.path import Path as MPath
from matplotlib.patches import PathPatch, FancyBboxPatch
from PIL import Image, ImageDraw, ImageFont
from lib import *

OUT = Path(__file__).resolve().parent / "figures"
OUT.mkdir(exist_ok=True)
for f in fm.findSystemFonts():
    if "Inter" in Path(f).name:
        fm.fontManager.addfont(f)
plt.rcParams.update({"font.family": ["Inter", "DejaVu Sans"], "font.size": 10, "axes.edgecolor": "#c3c2b7", "axes.linewidth": 0.8,
                     "xtick.color": "#52514e", "ytick.color": "#898781", "xtick.labelsize": 9.5, "ytick.labelsize": 9,
                     "figure.facecolor": "#ffffff", "axes.facecolor": "#ffffff", "savefig.facecolor": "#ffffff"})
INK, INK2, MUTED, GRID = "#0b0b0b", "#52514e", "#898781", "#e1e0d9"
S1, S2, S3 = "#2a78d6", "#eb6834", "#1baf7a"   # validated categorical slots 1-3 (all-pairs CVD safe on white)
W_IN, DPI = 7.28, 200                          # 1456 px: Substack's content width at 2x

L, D = "even-keel-light", "even-keel-v1"
runs = load_runs(L)
votes = load_votes(L)
J = {k: verdicts(load_judgments(L, k)) for k in ("opus-5-5-medium", "fable-5-1-medium")}
voted = {pair_key(v) for v in votes}
RR = {k: [v for v in vs if pair_key(v) not in voted] for k, vs in J.items()}
LAB = [LABEL[m] for m in MODELS]


def rounded_bar(ax, x, w, h, color, r_px=4):
    """Column with a 4px rounded data end and a square baseline."""
    if h <= 0:
        return
    bb = ax.get_window_extent(); xr, yr = ax.get_xlim(), ax.get_ylim()
    rx = min(r_px * 2 * (xr[1] - xr[0]) / bb.width, w / 2); ry = min(r_px * 2 * (yr[1] - yr[0]) / bb.height, h); k = 0.5523
    v = [(x, 0), (x + w, 0), (x + w, h - ry), (x + w, h - ry + k * ry), (x + w - rx + k * rx, h), (x + w - rx, h), (x + rx, h),
         (x + rx - k * rx, h), (x, h - ry + k * ry), (x, h - ry), (x, 0)]
    c = [MPath.MOVETO, MPath.LINETO, MPath.LINETO, MPath.CURVE4, MPath.CURVE4, MPath.CURVE4, MPath.LINETO, MPath.CURVE4, MPath.CURVE4, MPath.CURVE4, MPath.CLOSEPOLY]
    ax.add_patch(PathPatch(MPath(v, c), facecolor=color, edgecolor="none", zorder=3))


def header(fig, title, subtitle, source, top=0.965):
    fig.text(0.035, top, title, fontsize=13.5, fontweight="semibold", color=INK, va="top")
    fig.text(0.035, top - 0.07, subtitle, fontsize=9.5, color=INK2, va="top", linespacing=1.45)
    fig.text(0.035, 0.025, source, fontsize=8, color=MUTED, va="bottom")


def legend_row(fig, items, y):
    x = 0.035
    for label, color in items:
        fig.patches.append(FancyBboxPatch((x, y - 0.006), 0.016, 0.022, boxstyle="round,pad=0,rounding_size=0.003", transform=fig.transFigure, facecolor=color, edgecolor="none"))
        t = fig.text(x + 0.024, y + 0.005, label, fontsize=9, color=INK2, va="center")
        fig.canvas.draw(); x = t.get_window_extent().x1 / fig.bbox.width + 0.03


def grouped(name, groups, series, title, subtitle, source, ref=None):
    fig = plt.figure(figsize=(W_IN, 4.6), dpi=DPI); ax = fig.add_axes((0.07, 0.15, 0.91, 0.49))
    ax.set_xlim(-0.6, len(groups) - 0.4); ax.set_ylim(0, 100)
    ax.spines[["top", "right", "left"]].set_visible(False); ax.yaxis.grid(True, color=GRID, linewidth=0.8); ax.set_axisbelow(True)
    ax.tick_params(axis="y", length=0); ax.tick_params(axis="x", length=0, pad=6)
    ax.set_yticks(range(0, 101, 25)); ax.set_yticklabels([f"{t}%" for t in range(0, 101, 25)])
    if ref:
        ax.axhline(ref[0], color=MUTED, linewidth=1, zorder=2); ax.text(len(groups) - 0.42, ref[0] + 1.5, ref[1], fontsize=8.5, color=MUTED, ha="right", va="bottom")
    fig.canvas.draw()
    px = ax.get_window_extent().width / len(groups); bw, gap = 48 / px, 4 / px     # 24px bars, 2px gaps at 1x
    n = len(series)
    for gi in range(len(groups)):
        x0 = gi - (n * bw + (n - 1) * gap) / 2
        for si, (_, color, vals) in enumerate(series):
            x = x0 + si * (bw + gap); rounded_bar(ax, x, bw, vals[gi], color)
            ax.text(x + bw / 2, vals[gi] + 1.2, f"{vals[gi]:.0f}%", ha="center", va="bottom", fontsize=7.8 if n < 3 else 7.0, color=INK2, zorder=4)
    ax.set_xticks(range(len(groups))); ax.set_xticklabels(groups, color=INK2)
    header(fig, title, subtitle, source); legend_row(fig, [(s[0], s[1]) for s in series], 0.72)
    fig.savefig(OUT / name, dpi=DPI); plt.close(fig)


# 1. Models
ian_any = [v for v in votes if v["pool"] == "any"]
rates = lambda vs: win_rates(vs, model)
grouped("1-models.png", LAB,
        [("Ian, 46 blind votes", S1, [100 * rates(ian_any)[m][0] for m in MODELS]),
         ("Opus 5.5 as judge", S2, [100 * rates(RR["opus-5-5-medium"])[m][0] for m in MODELS]),
         ("Fable 5.1 as judge", S3, [100 * rates(RR["fable-5-1-medium"])[m][0] for m in MODELS])],
        "All three raters put Opus 5.5 first",
        "Share of comparisons each model won against the other three models (ties count half).\nJudges: 232 pairs across all 16 settings, each judged in both orders.",
        "Light brief, 80 apps (4 models × 4 effort levels × 5 runs). effort-bench, October 2026.")

# 2. Effort gap
same = [v for v in votes if model(v["lo"]) == model(v["hi"])]; same_pairs = {pair_key(v) for v in same}
gap = lambda vs, g: higher_effort_share(vs, g)
ian = [gap(same, g) for g in (1, 2, 3)]
jg = {k: [gap([v for v in vs if pair_key(v) in same_pairs], g) for g in (1, 2, 3)] for k, vs in J.items()}
grouped("2-effort-gap.png", [f"One level apart\n({ian[0][1]} votes)", f"Two levels apart\n({ian[1][1]} votes)", f"Low vs xhigh\n({ian[2][1]} votes)"],
        [("Ian", S1, [100 * x[0] for x in ian]), ("Opus 5.5 as judge", S2, [100 * x[0] for x in jg["opus-5-5-medium"]]),
         ("Fable 5.1 as judge", S3, [100 * x[0] for x in jg["fable-5-1-medium"]])],
        "People notice big jumps in effort, not small ones",
        f"Same model at two effort levels: how often the higher-effort app was preferred.\nIan's {len(same)} blind votes, and both judges on the same pairs.",
        "Light brief. Ties count half. effort-bench, October 2026.", ref=(50, "coin flip"))

# 3. Cost vs preference, small multiples
bt = bradley_terry(RR["opus-5-5-medium"], SETTINGS, setting)
fig = plt.figure(figsize=(W_IN, 6.6), dpi=DPI)
header(fig, "What each step up in effort costs, and what it buys",
       "Cost per app at standard API prices (log scale) against the judge's preference for that setting:\nits chance of beating an average setting, with Opus 5.5 as judge. L, M, H, X = low, medium, high, xhigh.",
       "Light brief, 5 runs per setting. Batch runs priced at the standard rate so settings compare fairly. effort-bench, October 2026.")
for k, m in enumerate(MODELS):
    ax = fig.add_axes((0.085 + (k % 2) * 0.47, 0.49 - (k // 2) * 0.37, 0.40, 0.25))
    xs = [st.mean(r["cost_std"] for r in runs.values() if setting(r["id"]) == f"{m}__{e}") for e in EFFORTS]
    ys = [100 * win_prob(bt[f"{m}__{e}"]) for e in EFFORTS]
    ax.set_xscale("log"); ax.set_xlim(0.004, 8); ax.set_ylim(0, 100)
    ax.spines[["top", "right", "left"]].set_visible(False); ax.yaxis.grid(True, color=GRID, linewidth=0.8); ax.set_axisbelow(True)
    ax.tick_params(axis="both", length=0); ax.set_yticks([0, 50, 100]); ax.set_yticklabels(["0%", "50%", "100%"])
    ax.set_xticks([0.01, 0.1, 1]); ax.set_xticklabels(["1¢", "10¢", "$1"]); ax.xaxis.set_minor_locator(matplotlib.ticker.NullLocator())
    ax.plot(xs, ys, color=S1, linewidth=1.6, zorder=3, solid_capstyle="round", solid_joinstyle="round")
    ax.scatter(xs, ys, s=34, color=S1, edgecolor="#ffffff", linewidth=1.6, zorder=4)
    for e, x, y in zip(EFFORTS, xs, ys):
        left = e == "low"
        ax.annotate(e[0].upper(), (x, y), xytext=(-8, 0) if left else (0, 7), textcoords="offset points", fontsize=8.5, fontweight="semibold",
                    color=INK2, ha="right" if left else "center", va="center" if left else "bottom", zorder=5)
    ax.set_title(LABEL[m], loc="left", fontsize=10.5, fontweight="semibold", color=INK, pad=10)
fig.savefig(OUT / "3-cost-vs-preference.png", dpi=DPI); plt.close(fig)

# 4. Detailed vs light brief
S = [v for v in verdicts(load_judgments(D, "opus-5-5-medium")) if "max" not in (effort(v["lo"]), effort(v["hi"]))]
grouped("4-strict-vs-light.png", LAB,
        [("Light brief", S1, [100 * rates(RR["opus-5-5-medium"])[m][0] for m in MODELS]), ("Detailed brand guide", S2, [100 * rates(S)[m][0] for m in MODELS])],
        "A detailed brand guide narrows the gap between models",
        f"Share of comparisons each model won against the other three models, Opus 5.5 as judge.\nLight brief: {len(RR['opus-5-5-medium'])} pairs from 80 apps. Detailed guide: {len(S)} pairs from 48 apps.",
        "Ties count half. Max effort excluded from both. effort-bench, October 2026.")


# 5-6. Screenshot figures: the middle-ranked run of a setting, by the Opus judge's run-level ranking
rb = bradley_terry(RR["opus-5-5-medium"], list(runs))
def median_run(s):
    xs = sorted((rb[i], i) for i in runs if setting(i) == s); return xs[len(xs) // 2][1]
def font(weight, size):
    for name in (f"Inter-{weight}.otf", f"Inter-{weight}.ttf", "DejaVuSans.ttf"):
        try: return ImageFont.truetype(name, size)
        except OSError: continue
    return ImageFont.load_default()
def cents(x): return f"{x * 100:.1f}¢" if x < 0.02 else f"{x * 100:.0f}¢" if x < 1 else f"${x:.2f}"
def screen_figure(name, title, subtitle, tiles, source, cols=2, W=1456, PAD=72, gap=40):
    tw = (W - 2 * PAD - (cols - 1) * gap) // cols; cap_h = 64
    imgs = []
    for run_id, cap, note, crop in tiles:
        im = Image.open(runs[run_id]["dir"] / "filled-desktop.jpg").convert("RGB")
        im = im.resize((tw, int(im.height * tw / im.width)), Image.LANCZOS); imgs.append((im.crop((0, 0, tw, min(im.height, crop))), cap, note))
    rows = (len(imgs) + cols - 1) // cols
    row_h = [max(i.height for i, _, _ in imgs[r * cols:(r + 1) * cols]) for r in range(rows)]
    head = 210; H = head + sum(cap_h + h + gap for h in row_h) + 60
    fig = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(fig)
    d.text((PAD, 56), title, font=font("SemiBold", 38), fill=(11, 11, 11))
    for k, line in enumerate(subtitle.split("\n")): d.text((PAD, 122 + 38 * k), line, font=font("Regular", 26), fill=(82, 81, 78))
    y = head
    for r in range(rows):
        for c in range(cols):
            if r * cols + c >= len(imgs): break
            im, cap, note = imgs[r * cols + c]; x = PAD + c * (tw + gap)
            d.text((x, y + 4), cap, font=font("SemiBold", 26), fill=(11, 11, 11))
            d.text((x + d.textlength(cap, font=font("SemiBold", 26)) + 14, y + 7), note, font=font("Regular", 23), fill=(82, 81, 78))
            fig.paste(im, (x, y + cap_h)); d.rectangle((x - 1, y + cap_h - 1, x + im.width, y + cap_h + im.height), outline=(225, 224, 217), width=2)
        y += cap_h + row_h[r] + gap
    d.text((PAD, H - 52), source, font=font("Regular", 20), fill=(137, 135, 129))
    fig.save(OUT / name, optimize=True)

lo, hi = median_run("sonnet-5-5__low"), median_run("sonnet-5-5__xhigh")
think = lambda i: "no thinking" if not runs[i]["thinking_tokens"] else f"{runs[i]['thinking_tokens'] / 1000:.0f}k thinking tokens"
screen_figure("5-sonnet-low-vs-xhigh.png", "Same model, same prompt, two effort levels",
              "Sonnet 5.5 at low and xhigh effort, each the middle-ranked of its five runs, with the\nsame sample trip entered. Only the second keeps people who owe money out of red.",
              [(lo, "Sonnet 5.5 · low", f"{cents(runs[lo]['cost_std'])} · {think(lo)}", 880), (hi, "Sonnet 5.5 · xhigh", f"{cents(runs[hi]['cost_std'])} · {think(hi)}", 880)],
              "Desktop screenshots, cropped. Cost at standard API prices. effort-bench, October 2026.")
screen_figure("6-four-models-medium.png", "Four models at medium effort",
              "The middle-ranked of each setting's five runs, with the same sample trip entered.",
              [(median_run(f"{m}__medium"), LABEL[m], cents(runs[median_run(f'{m}__medium')]["cost_std"]), 620) for m in MODELS],
              "Desktop screenshots, cropped. Cost per app at standard API prices. effort-bench, October 2026.")

# 7. Settings table as HTML (render to PNG with analysis/render-table.mjs)
btF = bradley_terry(RR["fable-5-1-medium"], SETTINGS, setting)
fmt_t = lambda s: f"{s:.0f} s" if s < 90 else f"{s / 60:.1f} min"
money = lambda x: f"{x * 100:.1f}¢" if x < 0.1 else f"${x:.2f}"
rows = ""
for m in MODELS:
    for i, e in enumerate(EFFORTS):
        rs = [r for r in runs.values() if setting(r["id"]) == f"{m}__{e}"]
        tt = st.mean(r["thinking_tokens"] or 0 for r in rs); po, pf = win_prob(bt[f"{m}__{e}"]), win_prob(btF[f"{m}__{e}"])
        bar = lambda p: f"<span class='bar'><i style='width:{p * 100:.0f}%'></i></span>{p * 100:.0f}%"
        rows += (f"<tr class='{'first' if i == 0 else ''}'><td class='m'>{LABEL[m] if i == 0 else ''}</td><td>{e}</td>"
                 f"<td class='n'>{money(st.mean(r['cost_std'] for r in rs))}</td><td class='n'>{fmt_t(st.median(r['latency_s'] for r in rs if r['latency_s']))}</td>"
                 f"<td class='n'>{'none' if tt < 1 else f'{tt / 1000:.1f}k'}</td><td class='n'>{sum(r['functional_pass'] == 15 for r in rs)} of 5</td>"
                 f"<td class='n'>{sum(owing_ok(r) for r in rs)} of 5</td><td class='n'>{bar(po)}</td><td class='n'>{bar(pf)}</td></tr>")
(OUT / "settings-table.html").write_text(f"""<!doctype html><html><head><meta charset="utf-8"><style>
body{{margin:0;background:#fff;font-family:Inter,system-ui,sans-serif;color:#0b0b0b}} .wrap{{width:728px;padding:28px 36px 22px;box-sizing:border-box}}
h1{{font-size:19px;font-weight:600;margin:0 0 6px}} p{{font-size:13px;color:#52514e;margin:0 0 16px;line-height:1.45}}
table{{border-collapse:collapse;width:100%;font-size:12.5px}} th{{font-weight:500;color:#52514e;text-align:left;padding:6px;border-bottom:1px solid #c3c2b7;vertical-align:bottom;font-size:11.5px;line-height:1.3}}
td{{padding:5px 6px;border-bottom:1px solid #eeede8}} tr.first td{{border-top:1px solid #c3c2b7}} td.m{{font-weight:600}} .n,th.n{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}
.bar{{display:inline-block;width:42px;height:6px;background:#e9e8e3;border-radius:3px;margin-right:7px;vertical-align:middle;position:relative;overflow:hidden}} .bar i{{position:absolute;left:0;top:0;bottom:0;background:#2a78d6;border-radius:3px}}
.src{{font-size:11px;color:#898781;margin-top:12px;line-height:1.4}}</style></head><body><div class="wrap"><h1>Every setting at a glance</h1>
<p>Light brief, five apps per setting. Cost at standard API prices. Time is the median of the two runs that weren't batched.<br>Judge preference: chance of beating an average setting in head-to-head comparisons.</p>
<table><thead><tr><th>Model</th><th>Effort</th><th class="n">Cost<br>per app</th><th class="n">Time</th><th class="n">Thinking<br>tokens</th><th class="n">Passed all<br>15 tests</th><th class="n">Owing kept<br>out of red</th><th class="n">Opus 5.5<br>as judge</th><th class="n">Fable 5.1<br>as judge</th></tr></thead><tbody>{rows}</tbody></table>
<div class="src">effort-bench, October 2026. "Owing kept out of red" checks the brief's one principle: owing money between friends is normal, not a problem.</div></div></body></html>""")
print(f"Figures written to {OUT}")
