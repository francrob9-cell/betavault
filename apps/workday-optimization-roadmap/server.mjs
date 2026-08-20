import { createServer } from "node:https";
import { readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname);
const port = Number(process.env.PORT || 8788);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
]);

const options = {
  pfx: await readFile(join(root, "certs", "localhost.pfx")),
  passphrase: "wd-optimize-localhost-dev",
};

function fileForUrl(url) {
  const parsed = new URL(url, `https://${host}:${port}`);
  const pathname = decodeURIComponent(parsed.pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const normalized = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(root, `.${normalized}`);
  return filePath.startsWith(root) ? filePath : null;
}

createServer(options, (request, response) => {
  const filePath = fileForUrl(request.url || "/");
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  const stream = createReadStream(filePath);
  stream.on("open", () => {
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(extname(filePath)) || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    stream.pipe(response);
  });
  stream.on("error", () => {
    response.writeHead(404);
    response.end("Not found");
  });
}).listen(port, host, () => {
  console.log(`WD Optimize dashboard running at https://localhost:${port}/`);
});
