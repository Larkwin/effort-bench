// Runs inside the page (page.evaluate). Must be self-contained: no imports, no closures.
// Reads computed styles and visible text, and reports how the page measures against the Even Keel guide.
export function brandAudit(brand) {
  const PALETTE = brand.palette; // { name: [r,g,b] }
  const TOL = 14;
  const parse = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || "");
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const nearest = (rgb) => {
    let best = null, d = Infinity;
    for (const [name, v] of Object.entries(PALETTE)) {
      const k = dist(rgb, v);
      if (k < d) { d = k; best = name; }
    }
    return { name: best, d };
  };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("").toUpperCase();
  const hsl = ({ r, g, b }) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return { h: 0, s: 0, l };
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h * 60, s, l };
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity > 0;
  };
  const describe = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") +
    (el.getAttribute("data-testid") ? `[data-testid=${el.getAttribute("data-testid")}]` : "") +
    (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
  const firstFamily = (el) => el ? getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim() : null;

  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();

  const els = [...document.querySelectorAll("body, body *")].filter((el) => !["SCRIPT", "STYLE", "LINK", "META", "TITLE", "BR"].includes(el.tagName) && visible(el));

  // Colour usage
  const off = new Map();
  const used = new Map();
  const signalMisuse = [];
  const addOff = (c, el, prop) => {
    const key = hex(c) + (c.a < 1 ? ` @${c.a}` : "");
    const e = off.get(key) || { colour: key, uses: 0, props: new Set(), sample: describe(el) };
    e.uses++; e.props.add(prop); off.set(key, e);
  };
  const checkColour = (raw, el, prop, isPseudo = false) => {
    const c = parse(raw);
    if (!c || c.a === 0) return;
    const n = nearest([c.r, c.g, c.b]);
    const key = hex(c) + (c.a < 0.99 ? ` @${+c.a.toFixed(2)}` : "");
    used.set(key, (used.get(key) || 0) + 1);
    if (n.d > TOL || c.a < 0.99) addOff(c, el, prop);
    if (n.name === "Signal" && n.d <= TOL) {
      const r = el.getBoundingClientRect();
      const inButton = !!el.closest("button, [role=button], a.button, input[type=submit]");
      const isRule = isPseudo || (r.width <= 40 && r.height <= 8);
      if (!inButton && !isRule) signalMisuse.push(`${describe(el)} ${prop}`);
    }
  };
  let gradients = [], shadows = [], bigRadius = [], transitions = [], uppercase = [];
  for (const el of els) {
    const cs = getComputedStyle(el);
    const isToggle = el.tagName === "INPUT" && ["checkbox", "radio"].includes(el.type);
    if (!isToggle && (ownText(el) || ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(el.tagName))) checkColour(cs.color, el, "color");
    checkColour(cs.backgroundColor, el, "background");
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== "none") checkColour(cs[`border${side}Color`], el, "border");
    }
    for (const pseudo of ["::before", "::after"]) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content && ps.content !== "none" && ps.content !== "normal") {
        checkColour(ps.backgroundColor, el, `background${pseudo}`, true);
        if (/gradient/.test(ps.backgroundImage)) gradients.push(describe(el) + pseudo);
      }
    }
    if (/gradient/.test(cs.backgroundImage)) gradients.push(describe(el));
    if (cs.boxShadow !== "none" || cs.textShadow !== "none") shadows.push(describe(el));
    if (/blur/.test(cs.backdropFilter || "") || /blur/.test(cs.filter || "")) shadows.push(describe(el) + " (blur)");
    const rect = el.getBoundingClientRect();
    const radius = Math.max(...["TopLeft", "TopRight", "BottomLeft", "BottomRight"].map((k) => {
      const v = cs[`border${k}Radius`];
      return v.endsWith("%") ? (parseFloat(v) / 100) * Math.min(rect.width, rect.height) : parseFloat(v) || 0;
    }));
    if (radius > 8.5 && !(el.tagName === "INPUT" && ["checkbox", "radio"].includes(el.type))) bigRadius.push(`${describe(el)} ${Math.round(radius)}px`);
    const durs = (cs.transitionDuration || "0s").split(",").map((s) => parseFloat(s) * (s.includes("ms") ? 1 : 1000));
    if (Math.max(...durs) > 150) transitions.push(`${describe(el)} ${Math.max(...durs)}ms`);
    if (cs.animationName && cs.animationName !== "none") transitions.push(`${describe(el)} animation ${cs.animationName}`);
    if (cs.textTransform === "uppercase" && el.textContent.trim()) uppercase.push(describe(el));
  }

  // Copy
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.textContent.trim() && n.parentElement && visible(n.parentElement) && !["SCRIPT", "STYLE"].includes(n.parentElement.tagName)) texts.push(n.textContent.trim());
  }
  const placeholders = [...document.querySelectorAll("[placeholder]")].map((e) => e.getAttribute("placeholder"));
  const allCopy = [...texts, ...placeholders, document.title];
  const emoji = allCopy.filter((t) => /\p{Extended_Pictographic}/u.test(t));
  const exclaim = allCopy.filter((t) => /!/.test(t));
  // Brand and person names are proper nouns, so they are ignored when looking for Title Case.
  const names = new Set(["Even", "Keel", ...(brand.userWords || []), ...[...document.querySelectorAll('[data-testid="person"]')].flatMap((p) => p.textContent.trim().split(/\s+/))]);
  const titleCase = [...document.querySelectorAll("button, h1, h2, h3, label, legend, th")].filter(visible).map((b) => b.textContent.trim())
    .filter((t) => {
      const w = t.split(/\s+/).filter((x) => /^[A-Za-z]/.test(x) && !names.has(x.replace(/[^A-Za-z]/g, "")));
      return w.length >= 2 && w.slice(1).every((x) => /^[A-Z]/.test(x)) && w.slice(1).some((x) => x.length > 3);
    });

  // Money figures
  const balances = [...document.querySelectorAll('[data-testid="balance"]')];
  const moneyEls = [...document.querySelectorAll('[data-testid="balance"], [data-testid="transfer"], [data-testid="expense"]')]
    .flatMap((b) => [b, ...b.querySelectorAll("*")]).filter((e) => /\$\s?\d/.test(ownText(e)));
  const tabular = moneyEls.filter((e) => /tabular-nums/.test(getComputedStyle(e).fontVariantNumeric)).length;
  const negativeRed = [];
  for (const b of balances) {
    if (Number(b.getAttribute("data-cents")) >= 0) continue;
    for (const e of [b, ...b.querySelectorAll("*")].filter((x) => /\$\s?\d/.test(ownText(x)))) {
      const c = parse(getComputedStyle(e).color);
      if (!c) continue;
      const h = hsl(c);
      const n = nearest([c.r, c.g, c.b]);
      if ((n.name === "Signal" && n.d <= TOL) || ((h.h < 25 || h.h > 330) && h.s > 0.35 && h.l > 0.2)) negativeRed.push(`${b.getAttribute("data-person")}: ${hex(c)}`);
    }
  }

  const main = document.querySelector('[data-testid="app"]') || document.querySelector("main");
  const mainWidth = main ? Math.round(main.getBoundingClientRect().width) : null;
  const contentWidth = main ? Math.round(main.getBoundingClientRect().width - parseFloat(getComputedStyle(main).paddingLeft) - parseFloat(getComputedStyle(main).paddingRight)) : null;

  // Fonts as rendered on the elements that hold text, so a font set on <main> instead of <body> still counts.
  const isHeading = (el) => /^H[1-3]$/.test(el.tagName) || /^even keel$/i.test(el.textContent.trim());
  const textEls = els.filter((el) => ownText(el) || ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(el.tagName))
    .filter((el) => !(el.tagName === "INPUT" && ["checkbox", "radio"].includes(el.type)));
  const headings = textEls.filter((el) => isHeading(el) || el.closest("h1, h2, h3"));
  const ui = textEls.filter((el) => !headings.includes(el));
  const uiPlex = ui.filter((el) => /ibm plex sans/i.test(firstFamily(el) || ""));
  const uiOther = [...new Set(ui.filter((el) => !uiPlex.includes(el)).map((el) => `${firstFamily(el)} (${describe(el)})`))].slice(0, 4);

  // The column is the span of everything that carries text or a control, so a full-width <main>
  // with a narrow inner wrapper measures the same as a narrow <main>.
  const inMain = main ? textEls.filter((el) => main.contains(el)) : [];
  const lefts = inMain.map((el) => el.getBoundingClientRect().left), rights = inMain.map((el) => el.getBoundingClientRect().right);
  const contentSpan = inMain.length ? Math.round(Math.max(...rights) - Math.min(...lefts)) : null;

  return {
    fonts: {
      headings: headings.slice(0, 8).map((el) => ({ el: describe(el), family: firstFamily(el) })),
      ui_total: ui.length,
      ui_plex: uiPlex.length,
      ui_other: uiOther,
      ui_main: (() => { const k = {}; for (const el of ui) { const f = firstFamily(el); k[f] = (k[f] || 0) + 1; } return Object.entries(k).sort((x, y) => y[1] - x[1])[0]?.[0] || null; })(),
      loaded: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/["']/g, "")),
    },
    colours: [...used.entries()].sort((x, y) => y[1] - x[1]).map(([colour, uses]) => ({ colour, uses })),
    off_palette: [...off.values()].map((e) => ({ ...e, props: [...e.props] })).sort((a, b) => b.uses - a.uses),
    signal_misuse: signalMisuse.slice(0, 10),
    gradients: gradients.slice(0, 10),
    shadows: shadows.slice(0, 10),
    big_radius: bigRadius.slice(0, 10),
    transitions: transitions.slice(0, 10),
    uppercase: uppercase.slice(0, 10),
    emoji: emoji.slice(0, 10),
    exclamations: exclaim.slice(0, 10),
    title_case: titleCase.slice(0, 10),
    money: { elements: moneyEls.length, tabular },
    negative_red: negativeRed,
    main_width: mainWidth,
    content_width: contentWidth,
    content_span: contentSpan,
    title: document.title,
  };
}
