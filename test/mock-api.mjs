// Local stand-in for the Messages and Message Batches endpoints, to exercise every code path without an API key or spend.
// node test/mock-api.mjs, then run commands with ANTHROPIC_BASE_URL=http://127.0.0.1:8787 ANTHROPIC_API_KEY=test
// Generation returns the fixtures (Haiku gets the generic one); judges return fixed reviews and verdicts.
import http from "node:http";
import fs from "node:fs";
const ref = fs.readFileSync(new URL("../fixtures/reference.html", import.meta.url), "utf8");
const gen = fs.readFileSync(new URL("../fixtures/generic.html", import.meta.url), "utf8");
const batches = new Map();
const seen = [];

function genMessage(body) {
  const html = body.model.includes("haiku") ? gen : ref;
  return {
    id: "msg_" + Math.random().toString(36).slice(2), type: "message", role: "assistant", model: body.model,
    content: [
      { type: "thinking", thinking: `Summary: planning the ${body.output_config?.effort} effort build.`, signature: "sig" },
      { type: "text", text: "Here is the app:\n```html\n" + html + "\n```" },
    ],
    stop_reason: "end_turn", stop_sequence: null,
    usage: { input_tokens: 2350, output_tokens: 15000, output_tokens_details: { thinking_tokens: 9000 } },
  };
}
function judgeMessage(body) {
  const d = (s) => ({ score: s, evidence: "Mock evidence." });
  const review = { brand_fidelity: d(4), visual_craft: d(4), copy_voice: d(5), ux_completeness: d(4), code_quality: d(4), directed_design: d(3), overall: 7, ai_tells: ["Mock tell: shadows on every card"], brand_violations: [], best_detail: "Clear balances.", worst_detail: "Dense form." };
  return { id: "msg_j", type: "message", role: "assistant", model: body.model, content: [{ type: "text", text: JSON.stringify(review) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 14000, output_tokens: 2500 } };
}
function pairMessage(body) {
  // Deterministic stand-in: prefer the submission whose desktop screenshot is larger, so both orders agree.
  const imgs = body.messages[0].content.filter((b) => b.type === "image");
  const w = imgs[0].source.data.length >= imgs[2].source.data.length ? "1" : "2";
  return { id: "msg_p", type: "message", role: "assistant", model: body.model, content: [{ type: "text", text: JSON.stringify({ winner: w, strength: "clear", deciding_factor: "visual", evidence: "Mock evidence." }) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 9000, output_tokens: 1200 } };
}
const reply = (body) => (body.output_config?.format?.schema?.properties?.winner ? pairMessage(body) : body.output_config?.format ? judgeMessage(body) : genMessage(body));

function sse(res, msg) {
  res.writeHead(200, { "content-type": "text/event-stream" });
  const send = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
  send("message_start", { message: { ...msg, content: [], stop_reason: null, usage: { input_tokens: msg.usage.input_tokens, output_tokens: 1 } } });
  msg.content.forEach((b, i) => {
    if (b.type === "thinking") {
      send("content_block_start", { index: i, content_block: { type: "thinking", thinking: "", signature: "" } });
      send("content_block_delta", { index: i, delta: { type: "thinking_delta", thinking: b.thinking } });
      send("content_block_delta", { index: i, delta: { type: "signature_delta", signature: "sig" } });
    } else {
      send("content_block_start", { index: i, content_block: { type: "text", text: "" } });
      for (let k = 0; k < b.text.length; k += 4000) send("content_block_delta", { index: i, delta: { type: "text_delta", text: b.text.slice(k, k + 4000) } });
    }
    send("content_block_stop", { index: i });
  });
  send("message_delta", { delta: { stop_reason: "end_turn", stop_sequence: null }, usage: msg.usage });
  send("message_stop", {});
  res.end();
}

http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const url = new URL(req.url, "http://x");
    const json = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
    if (req.method === "POST" && url.pathname === "/v1/messages") {
      const body = JSON.parse(raw);
      seen.push({ model: body.model, effort: body.output_config?.effort, thinking: body.thinking, format: !!body.output_config?.format, stream: !!body.stream, max_tokens: body.max_tokens });
      return body.stream ? sse(res, reply(body)) : json(200, reply(body));
    }
    if (req.method === "POST" && url.pathname === "/v1/messages/batches") {
      const body = JSON.parse(raw);
      const id = "msgbatch_" + Math.random().toString(36).slice(2, 8);
      batches.set(id, body.requests);
      seen.push({ batch: id, n: body.requests.length, stream_in_params: body.requests.some((r) => "stream" in r.params) });
      return json(200, { id, type: "message_batch", processing_status: "in_progress", request_counts: { processing: body.requests.length, succeeded: 0, errored: 0, canceled: 0, expired: 0 }, created_at: new Date().toISOString(), results_url: null });
    }
    const m = url.pathname.match(/^\/v1\/messages\/batches\/([^/]+)(\/results)?$/);
    if (req.method === "GET" && m) {
      const reqs = batches.get(m[1]);
      if (!reqs) return json(404, { type: "error", error: { type: "not_found_error", message: "no batch" } });
      if (m[2]) {
        res.writeHead(200, { "content-type": "application/binary" });
        return res.end(reqs.map((r) => JSON.stringify({ custom_id: r.custom_id, result: { type: "succeeded", message: reply(r.params) } })).join("\n") + "\n");
      }
      return json(200, { id: m[1], type: "message_batch", processing_status: "ended", request_counts: { processing: 0, succeeded: reqs.length, errored: 0, canceled: 0, expired: 0 }, created_at: new Date().toISOString(), ended_at: new Date().toISOString(), results_url: `http://127.0.0.1:8787/v1/messages/batches/${m[1]}/results` });
    }
    if (url.pathname === "/__seen") return json(200, seen);
    json(404, { type: "error", error: { type: "not_found_error", message: url.pathname } });
  });
}).listen(8787, "127.0.0.1", () => console.log("mock api on 8787"));
