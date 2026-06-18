import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { serve } from "srvx";
import server from "./dist/server/server.js";

const clientDir = fileURLToPath(new URL("./dist/client", import.meta.url));
const port = Number(process.env.PORT) || 3000;

const MIME = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};

// Minimal static-file middleware. We intentionally serve uncompressed: srvx's
// built-in serveStatic brotli-compresses on every request (~500ms for the main
// bundle), which is pointless locally. Real hosting/CDNs serve precompressed
// cached assets, so this only affects this throwaway prod server.
const staticFiles = async (request, next) => {
  const { pathname } = new URL(request.url);
  if (request.method !== "GET" || pathname === "/" || pathname.includes("..")) {
    return next();
  }

  const filePath = clientDir + pathname;
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return next();
  } catch {
    return next();
  }

  const ext = pathname.slice(pathname.lastIndexOf("."));
  const body = await readFile(filePath);
  const headers = { "content-type": MIME[ext] ?? "application/octet-stream" };
  // Hashed asset filenames are immutable -> cache aggressively.
  if (pathname.startsWith("/assets/")) {
    headers["cache-control"] = "public, max-age=31536000, immutable";
  }
  return new Response(body, { headers });
};

serve({
  port,
  middleware: [staticFiles],
  fetch: server.fetch,
});

console.log(`Production server listening on http://localhost:${port}`);
