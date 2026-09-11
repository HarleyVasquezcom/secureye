// SECUREYE build: validates the static site, then generates sitemap.xml.
//   npm run build
// Checks: lang JSON parses · zero Unsplash hotlinks · every referenced local
// asset exists · every internal *.html link resolves (catches sitemap typos).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fail = [];
const warn = [];
const ok = (m) => console.log("  ok  " + m);

const htmlFiles = fs.readdirSync(SITE).filter((f) => f.endsWith(".html"));
console.log(`pages: ${htmlFiles.length}`);

// 1 · lang JSON
const langs = fs.readdirSync(path.join(SITE, "lang")).filter((f) => f.endsWith(".json"));
for (const l of langs) {
  try {
    JSON.parse(fs.readFileSync(path.join(SITE, "lang", l), "utf8"));
    ok(`lang/${l} parses`);
  } catch (e) {
    fail.push(`lang/${l}: invalid JSON (${e.message})`);
  }
}

// 2 · no remote imagery hotlinks + collect refs
const imgRefs = new Set();
const pageLinks = new Set();
let pictureCount = 0;
for (const f of htmlFiles) {
  const t = fs.readFileSync(path.join(SITE, f), "utf8");
  if (/images\.unsplash\.com/.test(t)) fail.push(`${f}: still references images.unsplash.com`);
  for (const m of t.matchAll(/(?:src|href|srcset)="(assets\/[^"]+)"/g)) imgRefs.add(m[1].split(" ")[0]);
  for (const m of t.matchAll(/href="([a-z0-9-]+\.html)"/g)) pageLinks.add(m[1]);
  pictureCount += (t.match(/<picture>/g) || []).length;
  const imgs = (t.match(/<img[^>]*src="assets\//g) || []).length;
  const sources = (t.match(/<source srcset="assets\/[^"]+\.webp" type="image\/webp">/g) || []).length;
  const nested = (t.match(/<picture><source[^>]*><picture>/g) || []).length;
  if (nested) fail.push(`${f}: nested <picture> (${nested})`);
  if (sources !== imgs) fail.push(`${f}: ${imgs} asset <img> but ${sources} webp <source> (every img needs a webp source)`);
}
ok("zero Unsplash hotlinks");

// 3 · referenced assets exist; flag orphans
for (const a of imgRefs) {
  if (!fs.existsSync(path.join(SITE, a))) fail.push(`missing asset: ${a}`);
}
ok(`${imgRefs.size} local asset refs resolve`);
for (const f of fs.readdirSync(path.join(SITE, "assets", "img"))) {
  if (![...imgRefs].some((r) => r.endsWith("/" + f))) warn.push(`orphan asset (unreferenced): assets/img/${f}`);
}

// 3b · image size budgets: every JPG needs a smaller WebP; caps enforced
const PER_FILE_KB = 600, TOTAL_KB = 3000;
let totalBytes = 0;
for (const f of fs.readdirSync(path.join(SITE, "assets", "img")).filter((x) => /\.jpe?g$/i.test(x))) {
  const jpg = path.join(SITE, "assets", "img", f);
  const webp = jpg.replace(/\.jpe?g$/i, ".webp");
  const js = fs.statSync(jpg).size;
  totalBytes += js;
  if (!fs.existsSync(webp)) fail.push(`no WebP variant: assets/img/${f}`);
  else {
    const ws = fs.statSync(webp).size;
    totalBytes += ws;
    if (ws >= js) fail.push(`WebP not smaller: ${f} (jpg ${(js / 1024).toFixed(0)}KB, webp ${(ws / 1024).toFixed(0)}KB)`);
    else ok(`assets/img/${path.basename(webp)} ${(ws / 1024).toFixed(0)}KB < jpg ${(js / 1024).toFixed(0)}KB`);
  }
  if (js > PER_FILE_KB * 1024) fail.push(`over per-file budget: ${f} > ${PER_FILE_KB}KB`);
}
if (totalBytes > TOTAL_KB * 1024) fail.push(`over total image budget: ${(totalBytes / 1024).toFixed(0)}KB > ${TOTAL_KB}KB`);
else ok(`total image weight ${(totalBytes / 1024).toFixed(0)}KB <= ${TOTAL_KB}KB budget`);

// 4 · internal page links resolve
for (const p of pageLinks) {
  if (!fs.existsSync(path.join(SITE, p))) fail.push(`broken page link: ${p}`);
}
ok(`${pageLinks.size} internal page links resolve (${[...pageLinks].sort().join(", ")})`);

// 5 · sitemap.xml
const today = new Date().toISOString().slice(0, 10);
const urls = htmlFiles
  .map((f) => `  <url><loc>https://secureye.example/${f}</loc><lastmod>${today}</lastmod></url>`)
  .join("\n");
fs.writeFileSync(
  path.join(SITE, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);
ok(`sitemap.xml written (${htmlFiles.length} urls)`);

for (const w of warn) console.log("  warn " + w);
if (fail.length) {
  console.error("\nBUILD FAILED:");
  for (const m of fail) console.error("  fail " + m);
  process.exit(1);
}
console.log("\nBUILD OK");
