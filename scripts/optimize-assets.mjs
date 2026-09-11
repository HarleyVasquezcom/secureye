// SECUREYE asset optimizer: JPG -> WebP (q80) next to originals.
//   npm run opt
// JPGs stay as fallback inside <picture>; capable browsers get WebP.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const IMG = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "img");
const jpgs = fs.readdirSync(IMG).filter((f) => /\.jpe?g$/i.test(f));
if (!jpgs.length) { console.error("opt: no JPGs in assets/img"); process.exit(1); }
for (const j of jpgs) {
  const src = path.join(IMG, j);
  const dst = path.join(IMG, j.replace(/\.jpe?g$/i, ".webp"));
  await sharp(src).webp({ quality: 80 }).toFile(dst);
  const a = fs.statSync(src).size, b = fs.statSync(dst).size;
  console.log(`${path.basename(dst)} ${(b / 1024).toFixed(0)}KB (was ${(a / 1024).toFixed(0)}KB, -${Math.round((1 - b / a) * 100)}%)`);
}
console.log("OPT DONE");
