import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const readJson = (p, fallback = null) => {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
};
export const writeJson = (p, data) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
};
export const exists = (p) => fs.existsSync(p);
export const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Run `worker` over `items` with at most `limit` in flight. `shouldStop` is checked before each start.
export async function pool(items, limit, worker, shouldStop = () => false) {
  const results = [];
  let next = 0;
  async function lane() {
    while (next < items.length) {
      if (shouldStop()) return;
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, lane));
  return results;
}

export const usd = (n) => (n == null ? "—" : `$${n.toFixed(n < 1 ? 3 : 2)}`);

export function costUsd(usage, price, { batch = false } = {}) {
  if (!usage || !price) return null;
  const input = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) * 1.25
    + (usage.cache_read_input_tokens || 0) * 0.1;
  const c = (input * price.input + (usage.output_tokens || 0) * price.output) / 1e6;
  return batch ? c / 2 : c;
}

export function log(...args) {
  const t = new Date().toTimeString().slice(0, 8); // local time, HH:MM:SS
  console.log(`[${t}]`, ...args);
}

export function table(rows, headers) {
  const all = [headers, ...rows].map((r) => r.map((c) => String(c ?? "")));
  const w = headers.map((_, i) => Math.max(...all.map((r) => r[i].length)));
  return all.map((r, k) => {
    const line = r.map((c, i) => (i === 0 ? c.padEnd(w[i]) : c.padStart(w[i]))).join("  ");
    return k === 0 ? `${line}\n${w.map((n) => "-".repeat(n)).join("  ")}` : line;
  }).join("\n");
}

// The SDK reports most network failures as "Connection error."; the real reason is in the cause chain.
export function errorDetail(err) {
  const parts = [`${err.constructor?.name || err.name || "Error"}${err.status ? ` ${err.status}` : ""}: ${err.message}`];
  for (let c = err.cause, i = 0; c && i < 4; c = c.cause, i++) parts.push(`cause: ${c.code ? `${c.code} ` : ""}${c.message || c}`);
  return parts.join(" ← ");
}
