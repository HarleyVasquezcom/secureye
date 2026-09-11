// SECUREYE static server: npm run serve [--port 8099]
// Serves site/ incl. assets, lang JSON and generated sitemap.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".xml": "application/xml", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp",
};
const port = Number(process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] ?? 8099);

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(SITE, path.normalize(p).replace(/^[/\\]+/, ""));
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] ?? "application/octet-stream" });
    res.end(d);
  });
}).listen(port, "127.0.0.1", () => console.log(`SECUREYE on http://127.0.0.1:${port}`));
