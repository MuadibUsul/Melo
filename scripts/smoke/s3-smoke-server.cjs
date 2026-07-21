const http = require("http");
const { mkdirSync, existsSync, createWriteStream, createReadStream, statSync } = require("fs");
const { dirname, join, normalize } = require("path");

const port = Number(process.env.S3_SMOKE_PORT || 9000);
const root = process.env.S3_SMOKE_ROOT || join(process.cwd(), "artifacts", "local-infra", "s3data");

mkdirSync(root, { recursive: true });

function toPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] || "/").replace(/^\/+/, "");
  const safe = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return join(root, safe);
}

const server = http.createServer((req, res) => {
  const filePath = toPath(req.url || "/");

  if (req.method === "HEAD") {
    res.writeHead(existsSync(filePath) || existsSync(dirname(filePath)) ? 200 : 404);
    res.end();
    return;
  }

  if (req.method === "PUT") {
    mkdirSync(dirname(filePath), { recursive: true });
    const stream = createWriteStream(filePath);
    req.pipe(stream);
    stream.on("finish", () => {
      res.writeHead(200, { ETag: `"${Date.now().toString(16)}"` });
      res.end();
    });
    stream.on("error", () => {
      res.writeHead(500);
      res.end();
    });
    return;
  }

  if (req.method === "GET") {
    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end();
      return;
    }
    const stat = statSync(filePath);
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": "application/octet-stream",
    });
    createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(200);
  res.end();
});

server.listen(port, "127.0.0.1", () => {
  console.log(`s3-smoke-server listening on http://127.0.0.1:${port}`);
});
