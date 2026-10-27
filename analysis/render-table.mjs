// Render analysis/figures/settings-table.html to a PNG at 2x, with the Playwright the harness already uses.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "figures");
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 728, height: 400 }, deviceScaleFactor: 2 });
await page.goto("file://" + path.join(dir, "settings-table.html"));
await (await page.$(".wrap")).screenshot({ path: path.join(dir, "7-settings-table.png") });
await browser.close();
console.log("Wrote analysis/figures/7-settings-table.png");
