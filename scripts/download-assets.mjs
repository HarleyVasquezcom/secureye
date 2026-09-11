// One-off downloader: Unsplash -> site/assets/img (run from site/ as cwd).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "assets", "img");
const FILES = {
  "camera-closeup.jpg": "photo-1557597774-9d273605dfa9",
  "installer.jpg": "photo-1621905251189-08b45d6a269e",
// NOTE: photo-1585771724684 ("dome") rejected — file is headphones, off-theme.
// Spots reuse camera-closeup.jpg (verified CCTV).
  "team-1.jpg": "photo-1507003211169-0a1dd7228f2d",
  "team-2.jpg": "photo-1573496359142-b8d87734a5a2",
  "team-3.jpg": "photo-1560250097-0b93528c311a",
  "team-4.jpg": "photo-1519085360753-af0119f7cbe7",
};
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [file, id] of Object.entries(FILES)) {
    const url = `https://images.unsplash.com/${id}?q=80&w=1600&auto=format&fit=crop`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(path.join(OUT, file), buf);
    console.log(file, (buf.length / 1024).toFixed(0) + "KB");
  }
  console.log("DOWNLOAD DONE");
})().catch(e => { console.error("FAIL", e.message); process.exit(1); });
