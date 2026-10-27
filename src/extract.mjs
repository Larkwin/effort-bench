// Pull the HTML document out of a model reply and record how well the "HTML only" instruction was followed.
export function extractHtml(text) {
  const raw = text ?? "";
  let html = null, method = "none", start = -1, end = -1;

  const fence = /```(?:html)?\s*\n([\s\S]*?)```/i.exec(raw);
  const docStart = raw.search(/<!doctype html|<html[\s>]/i);
  const docEnd = raw.toLowerCase().lastIndexOf("</html>");

  if (docStart !== -1 && docEnd > docStart) {
    start = docStart; end = docEnd + "</html>".length;
    html = raw.slice(start, end);
    method = fence && fence.index < docStart ? "fenced" : "raw";
  } else if (fence) {
    start = fence.index; end = fence.index + fence[0].length;
    html = fence[1];
    method = "fenced-partial";
  } else if (raw.trim().startsWith("<")) {
    html = raw.trim(); start = 0; end = raw.length;
    method = "raw-partial";
  }

  const before = start > 0 ? raw.slice(0, start).replace(/```(?:html)?\s*$/i, "").trim() : "";
  const after = end > 0 && end < raw.length ? raw.slice(end).replace(/^\s*```/, "").trim() : "";
  return {
    html,
    method,
    complete: !!html && /<\/html>\s*$/i.test(html.trim()),
    chatter_chars: before.length + after.length,
    chatter_sample: (before + (before && after ? " … " : "") + after).slice(0, 300),
    html_bytes: html ? Buffer.byteLength(html) : 0,
    html_lines: html ? html.split("\n").length : 0,
  };
}

// Static code signals that show up as deltas between runs without needing a browser.
export function codeStats(html) {
  if (!html) return null;
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
  const js = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join("\n");
  const count = (s, re) => (s.match(re) || []).length;
  return {
    css_lines: css ? css.split("\n").length : 0,
    js_lines: js ? js.split("\n").length : 0,
    css_custom_properties: count(css, /--[a-z0-9-]+\s*:/gi),
    important: count(css, /!important/g),
    media_queries: count(css, /@media/g),
    innerHTML_writes: count(js, /\.innerHTML\s*[+]?=/g),
    comments: count(html, /<!--[\s\S]*?-->/g) + count(css + js, /\/\*[\s\S]*?\*\//g) + count(js, /(^|[^:])\/\/[^\n]*/g),
    aria_attributes: count(html, /\baria-[a-z]+=/g),
    labels: count(html, /<label\b/gi),
    external_scripts: count(html, /<script[^>]*\bsrc=/gi),
  };
}

// Remove anything that could tell a judge which model wrote the file.
export function blindSource(html) {
  return (html || "")
    .replace(/<!--[\s\S]*?-->/g, (c) => (/claude|anthropic|opus|sonnet|haiku|fable|mythos|generated|\bai\b|model/i.test(c) ? "" : c))
    .replace(/\/\*[\s\S]*?\*\//g, (c) => (/claude|anthropic|opus|sonnet|haiku|fable|mythos/i.test(c) ? "" : c))
    .replace(/<meta[^>]+name=["']generator["'][^>]*>/gi, "");
}
