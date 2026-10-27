// Message Batches bookkeeping shared by generation and judging.
// results/<exp>/batches.json records every batch submitted, what it was for, and whether it was collected.
import path from "node:path";
import { readJson, writeJson, log, sleep, errorDetail } from "./util.mjs";

const file = (cfg) => path.join(cfg._dir, "batches.json");
export const loadBatches = (cfg) => readJson(file(cfg), []);
const saveBatches = (cfg, list) => writeJson(file(cfg), list);

// Custom ids sitting in batches that have not been collected yet, so they are not submitted twice.
// `filter` narrows further, e.g. to the batches of one pairwise judge.
export function pendingIds(cfg, kind, filter = () => true) {
  return new Set(loadBatches(cfg).filter((b) => b.kind === kind && !b.collected && filter(b)).flatMap((b) => b.custom_ids));
}

// Large submissions (pairwise requests carry four screenshots each) go up as several batches. Each one is
// recorded as soon as it is accepted, so if a later one fails, rerunning the command submits only what is
// missing. `meta` is stored on each batch record and handed back to the result handler.
//
// Upload size: the API's documented limit is 256 MB per batch, but large uploads can be cut off well below
// that (on 26 Oct, 40 MB uploads were refused with HTTP/2 ENHANCE_YOUR_CALM after working on 22 Oct). So
// uploads start at `maxBytes`, and an upload refused at the connection level is split in half and retried,
// down to single requests. Splitting costs nothing: batches are billed per request.
const MB = (n) => `${(n / 1e6).toFixed(1)} MB`;
export async function submitBatch(client, cfg, kind, requests, { maxBytes = 20e6, maxCount = 5000, meta = {} } = {}) {
  const sized = requests.map((r) => ({ r, n: Buffer.byteLength(JSON.stringify(r)) }));
  const queue = [];
  let cur = [], size = 0;
  for (const x of sized) {
    if (cur.length && (size + x.n > maxBytes || cur.length >= maxCount)) { queue.push(cur); cur = []; size = 0; }
    cur.push(x); size += x.n;
  }
  if (cur.length) queue.push(cur);
  const total = requests.length;
  // A rejected key can show up as a dropped upload: the server refuses the request before the large body
  // has finished sending, so the client sees "Connection error" instead of a 401. Check the key first
  // with a tiny request (listing batches is free).
  try { await client.messages.batches.list({ limit: 1 }, { maxRetries: 1 }); }
  catch (err) {
    if (err.status === 401 || err.status === 403) {
      log(`The API rejected the key (${errorDetail(err).slice(0, 200)}). Check ANTHROPIC_API_KEY; nothing was submitted.`);
      throw err;
    }
  }
  if (queue.length > 1) log(`Uploading ${total} requests as ${queue.length} batches of up to ${MB(maxBytes)}.`);
  const made = [];
  let sent = 0, attempt = 0;
  while (queue.length) {
    const chunk = queue[0];
    const bytes = chunk.reduce((a, x) => a + x.n, 0);
    try {
      // Retries are handled here (by splitting), so the SDK shouldn't re-send a refused upload on its own.
      const batch = await client.messages.batches.create({ requests: chunk.map((x) => x.r) }, { maxRetries: 0 });
      const list = loadBatches(cfg);
      list.push({ id: batch.id, kind, ...meta, created_at: batch.created_at, custom_ids: chunk.map((x) => x.r.custom_id), collected: false });
      saveBatches(cfg, list);
      queue.shift(); made.push(batch); sent += chunk.length; attempt = 0;
      log(`Submitted ${kind} batch ${batch.id}: ${chunk.length} requests, ${MB(bytes)} (${sent} of ${total} submitted).`);
    } catch (err) {
      const network = !err.status; // the upload never got an HTTP response: dropped or refused connection
      if (network && chunk.length > 1) {
        const half = Math.ceil(chunk.length / 2);
        queue.splice(0, 1, chunk.slice(0, half), chunk.slice(half));
        log(`… a ${MB(bytes)} upload was refused (${errorDetail(err).slice(0, 160)}); splitting it in half and retrying.`);
        await sleep(3000);
        continue;
      }
      const retryable = network || err.status === 429 || err.status >= 500;
      if (retryable && ++attempt < 4) {
        log(`… submitting failed (${errorDetail(err).slice(0, 200)}), retrying in ${10 * attempt}s`);
        await sleep(10000 * attempt);
        continue;
      }
      log(`Submitting failed: ${errorDetail(err)}. ${sent} of ${total} requests already submitted are kept; rerun the same command to submit the rest. \`node src/cli.mjs doctor\` checks the connection.`);
      throw err;
    }
  }
  log(`Run \`collect\` later, or pass --wait.`);
  return made;
}

// Poll open batches; for each that has ended, hand every result (and the batch record) to its handler
// and mark it collected.
export async function collectBatches(client, cfg, handlers, { wait = false, pollSeconds = 60 } = {}) {
  for (;;) {
    const list = loadBatches(cfg);
    const open = list.filter((b) => !b.collected);
    if (!open.length) { log("No open batches."); return; }
    let still = 0;
    for (const b of open) {
      const status = await client.messages.batches.retrieve(b.id);
      const c = status.request_counts || {};
      if (status.processing_status !== "ended") {
        still++;
        log(`${b.kind} batch ${b.id}: ${status.processing_status} (processing ${c.processing ?? "?"}, succeeded ${c.succeeded ?? 0}, errored ${c.errored ?? 0})`);
        continue;
      }
      const timing = { batch_id: b.id, batch_created_at: status.created_at, batch_ended_at: status.ended_at };
      let n = 0;
      for await (const entry of await client.messages.batches.results(b.id)) {
        await handlers[b.kind](entry, timing, b);
        n++;
      }
      b.collected = true;
      b.ended_at = status.ended_at;
      b.request_counts = c;
      saveBatches(cfg, list);
      log(`Collected ${n} results from ${b.kind} batch ${b.id}.`);
    }
    if (!still || !wait) return;
    await sleep(pollSeconds * 1000);
  }
}
