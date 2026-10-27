import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import AxeBuilderPkg from "@axe-core/playwright";
import { brandAudit } from "./brand-audit.mjs";
import { existingRuns } from "./config.mjs";
import { writeJson, exists, pool, log } from "./util.mjs";

const AxeBuilder = AxeBuilderPkg.default || AxeBuilderPkg;

const BRAND = {
  palette: {
    Harbour: [0x1f, 0x3a, 0x4d], Fog: [0x5b, 0x6b, 0x75], Sailcloth: [0xf6, 0xf3, 0xec], Paper: [0xff, 0xff, 0xff],
    Rope: [0xd9, 0xd2, 0xc3], Signal: [0xc2, 0x46, 0x2b], Kelp: [0x2f, 0x6b, 0x4f],
  },
  // Words the scenario types in. A button like "Remove <span class=sr-only>Coffee</span>" is not Title Case.
  userWords: ["Ana", "Ben", "Chloe", "Dee", "Groceries", "Fuel", "Coffee", "Museum", "Snacks"],
};

const T = 2500; // per-action timeout: a broken app should fail fast, not hang the suite
const sel = (id) => `[data-testid="${id}"]`;

export async function launchBrowser() {
  // CHROMIUM_PATH lets you point at a system Chrome/Chromium when `npx playwright install chromium` isn't possible.
  const executablePath = process.env.CHROMIUM_PATH || undefined;
  return chromium.launch({ headless: true, executablePath, args: executablePath ? ["--no-sandbox", "--disable-dev-shm-usage"] : [] });
}

// ---- page helpers (all driven through the QA hooks in the prompt) ----
async function count(page, id) { return page.locator(sel(id)).count(); }
async function addPerson(page, name) {
  await page.fill(sel("person-name"), name, { timeout: T });
  await page.click(sel("add-person"), { timeout: T });
}
async function addExpense(page, { desc, amount, payer, split }) {
  await page.fill(sel("expense-desc"), desc, { timeout: T });
  await page.fill(sel("expense-amount"), amount, { timeout: T });
  if (payer) await page.selectOption(sel("expense-payer"), { value: payer }, { timeout: T });
  if (split) {
    const boxes = page.locator(`${sel("expense-split")} input[type="checkbox"]`);
    const n = await boxes.count();
    for (let i = 0; i < n; i++) {
      const box = boxes.nth(i);
      const want = split.includes(await box.getAttribute("value"));
      // el.click() toggles and fires click/input/change even when a styled label hides the real input.
      if ((await box.isChecked()) !== want) await box.evaluate((el) => el.click());
    }
  }
  await page.click(sel("add-expense"), { timeout: T });
}
async function balances(page) {
  return page.$$eval(sel("balance"), (els) => Object.fromEntries(els.map((e) => [e.getAttribute("data-person"), Number(e.getAttribute("data-cents"))])));
}
async function transfers(page) {
  return page.$$eval(sel("transfer"), (els) => els.map((e) => ({ from: e.getAttribute("data-from"), to: e.getAttribute("data-to"), cents: Number(e.getAttribute("data-cents")) })));
}
const visibleErrors = (page) => page.locator(sel("form-error")).filter({ visible: true }).allInnerTexts().catch(() => []);
// A validation message counts only if it is new since `before`, so a message left over from an earlier step can't pass a later one.
async function newError(page, before) {
  await page.waitForTimeout(100);
  const now = await visibleErrors(page);
  return now.length > before.length || now.some((t) => !before.includes(t));
}
const same = (a, b) => JSON.stringify(Object.entries(a || {}).sort()) === JSON.stringify(Object.entries(b || {}).sort());
const fmt = (o) => JSON.stringify(o);

// Expected balances in integer cents. Later steps check the change each expense makes, so one
// early mistake doesn't cascade into failures on every step after it.
const AFTER_TWO = { Ana: 5000, Ben: -1000, Chloe: -4000 };   // Groceries 90 (Ana) + Fuel 30 (Ben), split 3 ways
const COFFEE_DELTA = { Ana: -334, Ben: -333, Chloe: 667 };   // Coffee 10.00 (Chloe), split 3: shares 334/333/333 in trip order
const MUSEUM_DELTA = { Ana: 1000, Ben: -1000, Chloe: 0 };    // Museum 20.00 (Ana), split Ana & Ben only
const delta = (after, before) => Object.fromEntries(Object.keys({ ...after, ...before }).map((k) => [k, (after[k] ?? 0) - (before[k] ?? 0)]));
async function clearExpenses(page) {
  let n = 0;
  while ((await count(page, "expense")) && n < 20) {
    await page.locator(sel("delete-expense")).first().click({ timeout: T });
    await page.waitForTimeout(50);
    n++;
  }
  return n;
}

async function checkOne(browser, cfg, run, opts) {
  const htmlPath = path.join(run.dir, "output.html");
  const url = pathToFileURL(htmlPath).href;
  const out = { run_id: run.id, profile: cfg.checks?.profile || "strict", checked_at: new Date().toISOString(), functional: [], brand: [], console_errors: [], page_errors: [], blocked_requests: [], screenshots: {} };
  const allowed = cfg.checks?.allowed_hosts || [];
  const vp = cfg.checks?.viewports || { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };

  // A fresh context per run isolates localStorage between outputs.
  const context = await browser.newContext({ viewport: vp.desktop, deviceScaleFactor: 1 });
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.protocol === "file:" || u.protocol === "data:" || u.protocol === "blob:" || allowed.includes(u.hostname)) return route.continue();
    out.blocked_requests.push(u.href.slice(0, 200));
    return route.abort();
  });
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error" && !/net::ERR|Failed to load resource/.test(m.text())) out.console_errors.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => out.page_errors.push(String(e.message).slice(0, 300)));
  page.on("dialog", (d) => d.accept());

  const step = async (id, name, fn) => {
    const t0 = Date.now();
    try {
      const r = await fn();
      out.functional.push({ id, name, pass: !!r.pass, detail: r.detail ?? "", ms: Date.now() - t0 });
    } catch (e) {
      out.functional.push({ id, name, pass: false, detail: `error: ${String(e.message).split("\n")[0].slice(0, 200)}`, ms: Date.now() - t0 });
    }
  };
  const shot = async (name, fullPage = true) => {
    const file = `${name}.jpg`;
    // Cap very tall pages so screenshots stay within image-input limits for the judge.
    const dims = await page.evaluate(() => ({ w: document.documentElement.clientWidth, h: document.documentElement.scrollHeight })).catch(() => null);
    const clip = dims && dims.h > 4000 ? { x: 0, y: 0, width: dims.w, height: 4000 } : undefined;
    await page.screenshot({ path: path.join(run.dir, file), fullPage, type: "jpeg", quality: 82, clip, timeout: 15000 }).catch(() => null);
    if (exists(path.join(run.dir, file))) out.screenshots[name] = file;
  };
  const waitFonts = () => page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))])).catch(() => {});

  try {
    await page.goto(url, { waitUntil: "load", timeout: 15000 });
    await waitFonts();
    await page.waitForTimeout(200);
    await shot("empty-desktop");

    const hooks = ["app", "person-name", "add-person", "expense-desc", "expense-amount", "expense-payer", "expense-split", "add-expense"];
    const missingAtStart = [];
    for (const h of hooks) if (!(await count(page, h))) missingAtStart.push(h);
    out.missing_hooks_at_start = missingAtStart;

    await step("F01", "Adds three people", async () => {
      for (const n of ["Ana", "Ben", "Chloe"]) await addPerson(page, n);
      const n = await count(page, "person");
      return { pass: n === 3, detail: `${n} people listed` };
    });
    await step("F02", "Rejects a duplicate name ignoring case", async () => {
      const before = await visibleErrors(page);
      await addPerson(page, "  ana ");
      const n = await count(page, "person");
      const err = await newError(page, before);
      return { pass: n === 3 && err, detail: `${n} people; message shown: ${err}` };
    });
    await step("F03", "Rejects an empty expense with a message", async () => {
      const before = await visibleErrors(page);
      if (await page.locator(sel("add-expense")).isDisabled().catch(() => false)) {
        return { pass: false, detail: "Add expense is disabled while the form is empty, so no message explains what to fix" };
      }
      await page.click(sel("add-expense"), { timeout: T });
      const n = await count(page, "expense");
      const err = await newError(page, before);
      return { pass: n === 0 && err, detail: `${n} expenses; message shown: ${err}` };
    });
    await step("F04", "Rejects 3 decimal places and keeps the typed description", async () => {
      await addExpense(page, { desc: "Snacks", amount: "12.345" });
      const n = await count(page, "expense");
      const kept = await page.inputValue(sel("expense-desc"), { timeout: T });
      return { pass: n === 0 && kept === "Snacks", detail: `${n} expenses; description field: "${kept}"` };
    });
    await step("F05", "Computes balances for two equal splits", async () => {
      // If an invalid expense slipped through earlier, remove it so this step starts clean.
      const cleared = await clearExpenses(page).catch(() => 0);
      await addExpense(page, { desc: "Groceries", amount: "90", payer: "Ana", split: ["Ana", "Ben", "Chloe"] });
      await addExpense(page, { desc: "Fuel", amount: "30.00", payer: "Ben", split: ["Ana", "Ben", "Chloe"] });
      const b = await balances(page);
      return { pass: same(b, AFTER_TWO), detail: `got ${fmt(b)}, want ${fmt(AFTER_TWO)}${cleared ? ` (removed ${cleared} leftover expense first)` : ""}` };
    });
    await step("F06", "Settle-up zeroes every balance within n−1 transfers", async () => {
      const b = await balances(page), t = await transfers(page);
      const left = { ...b };
      for (const x of t) { left[x.from] = (left[x.from] ?? 0) + x.cents; left[x.to] = (left[x.to] ?? 0) - x.cents; }
      const zero = Object.values(left).every((v) => v === 0);
      const nonZero = Object.values(b).filter((v) => v !== 0).length;
      const ok = zero && t.length > 0 && t.length <= Math.max(0, nonZero - 1) && t.every((x) => x.cents > 0);
      return { pass: ok, detail: `${t.length} transfers ${fmt(t)}; residual ${fmt(left)}` };
    });
    let beforeMuseum = null;
    await step("F07", "Gives leftover cents to the earliest-added people", async () => {
      const before = await balances(page);
      await addExpense(page, { desc: "Coffee", amount: "10", payer: "Chloe", split: ["Ana", "Ben", "Chloe"] });
      const after = await balances(page);
      const d = delta(after, before);
      return { pass: same(d, COFFEE_DELTA), detail: `change ${fmt(d)}, want ${fmt(COFFEE_DELTA)}` };
    });
    await step("F08", "Splits between a subset of people", async () => {
      beforeMuseum = await balances(page);
      await addExpense(page, { desc: "Museum", amount: "20.00", payer: "Ana", split: ["Ana", "Ben"] });
      const d = delta(await balances(page), beforeMuseum);
      return { pass: same(d, MUSEUM_DELTA), detail: `change ${fmt(d)}, want ${fmt(MUSEUM_DELTA)}` };
    });
    await step("F09", "Lists expenses newest first", async () => {
      const first = await page.locator(sel("expense")).first().innerText({ timeout: T });
      return { pass: /museum/i.test(first), detail: `first expense: "${first.replace(/\s+/g, " ").slice(0, 80)}"` };
    });
    await step("F10", "Removing an expense restores balances", async () => {
      const del = page.locator(sel("expense")).filter({ hasText: "Museum" }).locator(sel("delete-expense"));
      if (!(await del.count())) return { pass: false, detail: 'no data-testid="delete-expense" control on the expense, so removal could not be exercised (the app may still remove expenses another way)' };
      await del.click({ timeout: T });
      await page.waitForTimeout(100);
      const b = await balances(page), n = await count(page, "expense");
      return { pass: n === 3 && same(b, beforeMuseum), detail: `${n} expenses; balances ${fmt(b)}, want ${fmt(beforeMuseum)}` };
    });
    await step("F11", "Survives a reload", async () => {
      const p0 = await count(page, "person"), e0 = await count(page, "expense"), b0 = await balances(page);
      await page.reload({ waitUntil: "load" });
      await waitFonts();
      const p = await count(page, "person"), e = await count(page, "expense"), b = await balances(page);
      return { pass: p0 > 0 && e0 > 0 && p === p0 && e === e0 && same(b, b0), detail: `before: ${p0} people, ${e0} expenses; after: ${p} people, ${e} expenses, balances ${same(b, b0) ? "unchanged" : fmt(b)}` };
    });
    // If the trip didn't survive the reload, re-enter it so the remaining checks and screenshots
    // still have data to look at (F11 has already recorded the failure).
    if (!(await count(page, "person")) || !(await count(page, "expense"))) {
      out.restored_after_reload = true;
      try {
        if (!(await count(page, "person"))) for (const n of ["Ana", "Ben", "Chloe"]) await addPerson(page, n);
        await addExpense(page, { desc: "Groceries", amount: "90", payer: "Ana", split: ["Ana", "Ben", "Chloe"] });
        await addExpense(page, { desc: "Fuel", amount: "30.00", payer: "Ben", split: ["Ana", "Ben", "Chloe"] });
        await addExpense(page, { desc: "Coffee", amount: "10", payer: "Chloe", split: ["Ana", "Ben", "Chloe"] });
      } catch { /* the later checks will show what's missing */ }
    }
    await step("F12", "Formats money as Canadian dollars", async () => {
      const text = await page.locator("body").innerText();
      const bal = await page.$$eval(sel("balance"), (els) => els.map((e) => e.innerText));
      const cad = /\$\d{1,3}(,\d{3})*\.\d{2}/;
      const ok = text.includes("$90.00") && text.includes("$10.00") && bal.length > 0 && bal.every((t) => cad.test(t));
      return { pass: ok, detail: ok ? "expense amounts and every balance use $0.00 format" : `body has $90.00: ${text.includes("$90.00")}; balances: ${fmt(bal.map((t) => t.replace(/\s+/g, " ")))}` };
    });

    await page.waitForTimeout(250);
    await shot("filled-desktop");

    // Brand audit at desktop width with data on screen
    const audit = await page.evaluate(brandAudit, BRAND);
    out.audit = audit;

    // Accessibility
    try {
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
      for (const v of axe.violations) byImpact[v.impact] = (byImpact[v.impact] || 0) + v.nodes.length;
      out.a11y = { ...byImpact, rules: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })) };
    } catch (e) {
      out.a11y = { error: String(e.message).slice(0, 200) };
    }

    await step("F13", "Keyboard focus is visible", async () => {
      await page.focus(sel("person-name"), { timeout: T });
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return { tag: el.tagName.toLowerCase(), testid: el.getAttribute("data-testid"), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, offset: cs.outlineOffset, shadow: cs.boxShadow };
      });
      out.focus = f;
      const ok = !!f && ((f.outline.split(" ")[0] !== "none" && parseFloat(f.outline.split(" ")[1]) >= 1) || f.shadow !== "none");
      return { pass: ok, detail: f ? `${f.tag}${f.testid ? `[${f.testid}]` : ""}: outline ${f.outline}, offset ${f.offset}, shadow ${f.shadow}` : "nothing focused" };
    });

    await page.setViewportSize(vp.mobile);
    await page.waitForTimeout(250);
    await step("F14", "No horizontal scrolling at 390px", async () => {
      const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      return { pass: m.sw <= m.cw + 1, detail: `scrollWidth ${m.sw} vs viewport ${m.cw}` };
    });
    await shot("filled-mobile");
    await page.setViewportSize(vp.desktop);

    await step("F15", "Shows user input as text, not HTML", async () => {
      await page.evaluate(() => { window.__xss = 0; });
      const before = await visibleErrors(page);
      await addPerson(page, '<img src=x onerror="window.__xss=1">Dee');
      await page.waitForTimeout(150);
      const fired = await page.evaluate(() => window.__xss === 1);
      const shown = await page.locator(sel("person")).filter({ hasText: "<img" }).count();
      const rejected = !shown && (await newError(page, before));
      return { pass: !fired && (shown > 0 || rejected), detail: `script ran: ${fired}; shown literally: ${shown > 0}${rejected ? "; rejected with a message" : ""}` };
    });
  } catch (e) {
    out.fatal = String(e.message).slice(0, 300);
  } finally {
    await context.close();
  }

  out.brand = cfg.checks?.profile === "light" ? lightChecks(out, BRAND) : brandChecks(out);
  out.summary = summarize(out);
  writeJson(path.join(run.dir, "checks.json"), out);
  return out;
}

function brandChecks(out) {
  const a = out.audit;
  if (!a) return [];
  const has = (f, name) => !!f && f.toLowerCase().includes(name.toLowerCase());
  const list = (arr) => (arr.length ? arr.slice(0, 4).join("; ") + (arr.length > 4 ? ` (+${arr.length - 4})` : "") : "none");
  const f = out.focus;
  const harbourOutline = !!f && /solid/.test(f.outline) && /\b2px\b/.test(f.outline) && /rgb\(31, 58, 77\)/.test(f.outline);
  return [
    { id: "B01", name: "Wordmark and headings in Fraunces", pass: a.fonts.headings.length > 0 && a.fonts.headings.every((f) => has(f.family, "Fraunces")), detail: a.fonts.headings.length ? a.fonts.headings.map((f) => `${f.el}: ${f.family}`).slice(0, 4).join("; ") : "no headings found" },
    { id: "B02", name: "UI text in IBM Plex Sans", pass: a.fonts.ui_total > 0 && a.fonts.ui_plex / a.fonts.ui_total >= 0.95, detail: `${a.fonts.ui_plex}/${a.fonts.ui_total} text elements${a.fonts.ui_other.length ? `; others: ${a.fonts.ui_other.join(", ")}` : ""}` },
    { id: "B03", name: "Only palette colours", pass: a.off_palette.length === 0, detail: a.off_palette.length ? a.off_palette.slice(0, 5).map((o) => `${o.colour} ×${o.uses} (${o.props.join("/")}, e.g. ${o.sample})`).join("; ") : "all colours on palette" },
    { id: "B04", name: "No gradients", pass: !a.gradients.length, detail: list(a.gradients) },
    { id: "B05", name: "No shadows or blur", pass: !a.shadows.length, detail: list(a.shadows) },
    { id: "B06", name: "Radius ≤ 6–8px, no pills", pass: !a.big_radius.length, detail: list(a.big_radius) },
    { id: "B07", name: "No emoji", pass: !a.emoji.length, detail: list(a.emoji) },
    { id: "B08", name: "No exclamation marks", pass: !a.exclamations.length, detail: list(a.exclamations) },
    { id: "B09", name: "Sentence case", pass: !a.uppercase.length && !a.title_case.length, detail: `uppercase: ${list(a.uppercase)}; title case: ${list(a.title_case)}` },
    { id: "B10", name: "Tabular figures for money", pass: a.money.elements > 0 && a.money.tabular === a.money.elements, detail: `${a.money.tabular}/${a.money.elements} money elements` },
    { id: "B11", name: "Owing is not shown in red", pass: !a.negative_red.length, detail: list(a.negative_red) },
    { id: "B12", name: "Signal only on primary buttons and the rule", pass: !a.signal_misuse.length, detail: list(a.signal_misuse) },
    { id: "B13", name: "Single column ≤ 720px", pass: a.content_span != null && a.content_span <= 724, detail: `content spans ${a.content_span}px (main ${a.main_width}px)` },
    { id: "B14", name: "Focus ring 2px Harbour", pass: harbourOutline, detail: f ? f.outline : "not measured" },
    { id: "B15", name: "Transitions ≤ 150ms, no animation", pass: !a.transitions.length, detail: list(a.transitions) },
    { id: "B16", name: "No outside requests beyond Google Fonts", pass: !out.blocked_requests.length, detail: list(out.blocked_requests) },
  ];
}

// When the page never got far enough to audit, score against the profile's full set of checks.
const cfg_profile_total = (out) => (out.profile === "light" ? 2 : 16);

// Light brief: only what the brief states is scored; everything else is recorded as a style profile.
function lightChecks(out, brand) {
  const a = out.audit;
  if (!a) return [];
  const near = (hexStr, rgb) => { const v = [1, 3, 5].map((i) => parseInt(hexStr.slice(i, i + 2), 16)); return Math.hypot(v[0] - rgb[0], v[1] - rgb[1], v[2] - rgb[2]) <= 14; };
  const usesColour = (rgb) => a.colours.some((c) => !c.colour.includes("@") && near(c.colour, rgb));
  const list = (arr) => (arr.length ? arr.slice(0, 4).join("; ") + (arr.length > 4 ? ` (+${arr.length - 4})` : "") : "none");
  const solid = a.colours.filter((c) => !c.colour.includes("@"));
  const maxRadius = Math.max(0, ...a.big_radius.map((s) => parseInt(s.split(" ").pop(), 10) || 0));
  return [
    { id: "L01", name: "Uses both anchor colours", pass: usesColour(brand.palette.Harbour) && usesColour(brand.palette.Signal), detail: `Harbour ${usesColour(brand.palette.Harbour) ? "used" : "missing"}; Signal ${usesColour(brand.palette.Signal) ? "used" : "missing"}` },
    { id: "L02", name: "Owing is not shown as a problem (red)", pass: !a.negative_red.length, detail: list(a.negative_red) },
    { id: "S01", observe: true, name: "Typefaces", detail: `headings: ${[...new Set(a.fonts.headings.map((h) => h.family))].join(", ") || "none"}; UI: ${a.fonts.ui_main || "—"}` },
    { id: "S02", observe: true, name: "Palette size", detail: `${solid.length} solid colours, ${a.colours.length - solid.length} with transparency; top: ${a.colours.slice(0, 6).map((c) => c.colour).join(", ")}` },
    { id: "S03", observe: true, name: "Gradients", detail: list(a.gradients) },
    { id: "S04", observe: true, name: "Shadows or blur", detail: list(a.shadows) },
    { id: "S05", observe: true, name: "Corner radius over 8px", detail: a.big_radius.length ? `${a.big_radius.length} elements, up to ${maxRadius}px` : "none" },
    { id: "S06", observe: true, name: "Emoji", detail: list(a.emoji) },
    { id: "S07", observe: true, name: "Exclamation marks", detail: list(a.exclamations) },
    { id: "S08", observe: true, name: "Title Case or all caps", detail: `title case: ${list(a.title_case)}; uppercase: ${list(a.uppercase)}` },
    { id: "S09", observe: true, name: "Tabular figures for money", detail: `${a.money.tabular}/${a.money.elements} money elements` },
    { id: "S10", observe: true, name: "Column width", detail: `content spans ${a.content_span}px at 1280px` },
    { id: "S11", observe: true, name: "Motion", detail: list(a.transitions) },
  ];
}

function summarize(out) {
  const fp = out.functional.filter((x) => x.pass).length;
  const scored = out.brand.filter((x) => !x.observe);
  const bp = scored.filter((x) => x.pass).length, bt = out.audit ? scored.length : (cfg_profile_total(out));
  return {
    functional_pass: fp, functional_total: 15, functional_rate: +(fp / 15).toFixed(3),
    brand_pass: bp, brand_total: bt, brand_rate: bt ? +(bp / bt).toFixed(3) : 0,
    a11y_serious: out.a11y && !out.a11y.error ? (out.a11y.critical || 0) + (out.a11y.serious || 0) : null,
    a11y_total: out.a11y && !out.a11y.error ? ["critical", "serious", "moderate", "minor"].reduce((s, k) => s + (out.a11y[k] || 0), 0) : null,
    console_errors: out.console_errors.length + out.page_errors.length,
    fatal: out.fatal || null,
  };
}

export async function runChecks(cfg, opts = {}) {
  const runs = existingRuns(cfg).filter((r) => exists(path.join(r.dir, "output.html")) && (opts.force || !exists(path.join(r.dir, "checks.json"))));
  if (!runs.length) { log("Nothing to check."); return; }
  log(`Checking ${runs.length} outputs…`);
  const browser = await launchBrowser();
  let i = 0;
  try {
    await pool(runs, opts.concurrency ?? 3, async (run) => {
      // A hung page (an infinite loop in the generated script, say) must not stall the suite.
      let timer;
      const timeout = new Promise((resolve) => {
        timer = setTimeout(() => {
          const out = { run_id: run.id, profile: cfg.checks?.profile || "strict", functional: [], brand: [], console_errors: [], page_errors: [], blocked_requests: [], screenshots: {}, fatal: "timed out after 180s" };
          out.summary = summarize(out);
          writeJson(path.join(run.dir, "checks.json"), out);
          resolve(out);
        }, 180000);
      });
      const r = await Promise.race([checkOne(browser, cfg, run, opts), timeout]);
      clearTimeout(timer);
      i++;
      const s = r.summary;
      log(`✓ ${run.id.padEnd(30)} functional ${s.functional_pass}/15  brand ${s.brand_pass}/${s.brand_total}  a11y serious ${s.a11y_serious ?? "?"}  errors ${s.console_errors}${s.fatal ? "  FATAL " + s.fatal : ""}  [${i}/${runs.length}]`);
    });
  } finally {
    await browser.close();
  }
}
