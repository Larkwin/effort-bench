// Claude through the Anthropic API: the only provider implemented so far, and the reference the others
// have to match. The harness's internal message format is this API's Messages format, so for Anthropic
// there is nothing to translate. See docs/providers.md for what another provider's adapter must do.
import Anthropic from "@anthropic-ai/sdk";

export default {
  name: "anthropic",
  envKey: "ANTHROPIC_API_KEY",
  // Values output_config.effort accepts. The bench's own effort levels use the same names.
  efforts: ["low", "medium", "high", "xhigh", "max"],
  // What the rest of the harness relies on. Another provider may lack some of these; the docs say how
  // each gap should show up in the results (as missing data, never as a zero).
  supports: { streaming: true, batch: true, images: true, jsonSchema: true, thinkingSummary: true, thinkingTokens: true },
  client() {
    if (!process.env[this.envKey]) {
      console.error(`Set ${this.envKey} first.`);
      process.exit(1);
    }
    // Long timeout: a max-effort Fable run can stream for most of an hour.
    return new Anthropic({ maxRetries: 4, timeout: 70 * 60 * 1000 });
  },
};
