// SECUREYE screenshots: npm run shots [--out=../artifacts/cctv-site/shots]
// Needs a Playwright Chromium build (ms-playwright cache or PLAYWRIGHT_EXE).
// Captures faq + 404 at desktop/mobile after a scroll pass (fires .reveal).
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.dirname(HERE);
const outArg = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1]
  ?? "../../artifacts/cctv-site/shots";
const OUT = path.resolve(HERE, outArg);
fs.mkdirSync(OUT, { recursive: true });

const server = spawn(process.execPath, [path.join(HERE, "serve.mjs"), "--port=8099"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));

let playwright;
try {
  ({ chromium: playwright } = await import("playwright-core"));
} catch {
  console.error("shots: playwright-core not installed (npm i -D playwright-core)");
  server.kill(); process.exit(1);
}
const exe = process.env.PLAYWRIGHT_EXE
  ?? path.join(os.homedir(), "AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe");
const browser = await playwright.launch({ executablePath: exe });
// Usage: npm run shots [--pages=faq.html,404.html] [--out=...]
// Defaults capture faq + 404 at desktop/mobile.
const pagesArg = process.argv.find((a) => a.startsWith("--pages="))?.split("=")[1]
  ?? "faq.html,404.html";
const jobs = pagesArg.split(",").map((p) => p.trim()).filter(Boolean).flatMap((page) => {
  const base = page.replace(/\.html$/, "");
  return [
    { page, file: `${base}-desktop.png`, w: 1440, h: 900 },
    { page, file: `${base}-mobile.png`, w: 390, h: 844 },
  ];
});
try {
  for (const j of jobs) {
    const ctx = await browser.newContext({ viewport: { width: j.w, height: j.h } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on("pageerror", (e) => errs.push("pageerror:" + e.message));
    pg.on("console", (m) => { if (m.type() === "error") errs.push("console:" + m.text().slice(0, 120)); });
    await pg.goto(`http://127.0.0.1:8099/${j.page}`, { waitUntil: "networkidle", timeout: 30000 });
    await pg.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 900));
    });
    // force every image (incl. loading="lazy" below the fold) to fetch,
    // then screenshot; check for broken assets only afterwards.
    await pg.evaluate(async () => {
      for (const img of [...document.images]) {
        img.loading = "eager";
        img.scrollIntoView({ block: "center" });
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await pg.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await pg.screenshot({ path: path.join(OUT, j.file), fullPage: true });
    // fullPage capture expands the viewport, firing loading="lazy" imgs —
    // so check for broken assets only now; ignore display:none carousel slides
    // (Bootstrap keeps inactive .carousel-item hidden until shown).
    const missing = await pg.evaluate(() => [...document.images]
      .filter((i) => (!i.complete || i.naturalWidth === 0) && i.offsetParent !== null)
      .map((i) => i.getAttribute("src")));
    console.log(j.file, "saved", errs.length ? `| js: ${errs.join(" ;; ")}` : "| no js errors",
      missing.length ? `| BROKEN IMGS: ${missing.join(", ")}` : "| all imgs ok");
    if (missing.length) process.exitCode = 1;
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log("SHOTS DONE -> " + OUT);
