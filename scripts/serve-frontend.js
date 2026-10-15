const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "frontend");
const PORT = 5500;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

http.createServer((req, res) => {
  let url = req.url.split("?")[0];
  if (url === "/") url = "/index.html";
  const filePath = path.join(ROOT, url);
  if (!filePath.startsWith(ROOT)) { res.statusCode = 403; return res.end("Forbidden"); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
    res.end(data);
  });
}).listen(PORT, () => console.log(`[frontend] Servido en http://localhost:${PORT}`));
