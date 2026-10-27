// `doctor`: checks that this machine can reach the API, separately for an ordinary request and the batch
// endpoint, and prints the underlying network error when it can't. Costs well under a cent.
import fs from "node:fs";
import path from "node:path";
import { client } from "./generate.mjs";
import { ROOT, errorDetail } from "./util.mjs";

export async function doctor() {
  const sdk = JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules/@anthropic-ai/sdk/package.json"), "utf8")).version;
  console.log(`Node ${process.version}, Anthropic SDK ${sdk}`);
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.length} characters)` : "NOT SET"}`);
  for (const k of ["ANTHROPIC_BASE_URL", "HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy", "NO_PROXY", "NODE_OPTIONS", "NODE_EXTRA_CA_CERTS"]) {
    if (process.env[k]) console.log(`${k}: ${process.env[k]}`);
  }
  const api = client();
  try {
    const t0 = Date.now();
    const m = await api.messages.create({ model: "claude-haiku-5-5", max_tokens: 5, messages: [{ role: "user", content: "Reply with OK." }] });
    console.log(`✓ Ordinary request: ${m.model} answered in ${Date.now() - t0} ms.`);
  } catch (err) {
    console.log(`✗ Ordinary request failed: ${errorDetail(err)}`);
    console.log("  Batches can't work until this does: check the network, VPN or proxy, and the variables above.");
    return;
  }
  // A one-request batch, cancelled straight away: checks the batch endpoint itself.
  try {
    const t0 = Date.now();
    const b = await api.messages.batches.create({ requests: [{ custom_id: "doctor", params: { model: "claude-haiku-5-5", max_tokens: 5, messages: [{ role: "user", content: "Reply with OK." }] } }] });
    console.log(`✓ Batch endpoint accepted a test batch in ${Date.now() - t0} ms (${b.id}); cancelling it.`);
    await api.messages.batches.cancel(b.id).catch(() => {});
  } catch (err) {
    console.log(`✗ Batch endpoint failed: ${errorDetail(err)}`);
  }
}
