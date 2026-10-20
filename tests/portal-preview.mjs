// Read-only local harness: production build + existing public GET APIs.
// Does not connect to MySQL; the share handler receives a public API-backed reader.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createShareHandler } from "../server/share-handler.js";
const root = path.resolve(
  process.env.PORTAL_BUILD_DIR || "/tmp/darkcystian-review/v2-build",
);
const origin = "https://app-alfaro-git-smoky.vercel.app";
const allowed = new Set([
  "getProperties",
  "get-options",
  "getPropertyDetails",
  "getPropertyDetailInfo",
  "getAsesores",
  "getArticulos",
  "getNoticias",
  "get-social-links",
]);
const cache = new Map();
async function remote(key) {
  if (!cache.has(key)) {
    const promise = fetch(origin + key, {
      signal: AbortSignal.timeout(20000),
    }).then(async (r) => ({
      status: r.status,
      headers: {
        "content-type": r.headers.get("content-type") || "application/json",
      },
      body: Buffer.from(await r.arrayBuffer()),
    }));
    cache.set(key, promise);
    promise.catch(() => cache.delete(key));
  }
  return cache.get(key);
}
const handler = createShareHandler({
  getProperty: async (id) => {
    const r = await remote("/api/getProperties");
    const list = JSON.parse(r.body);
    return list.filter((p) => String(p.id) === String(id));
  },
});
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405);
        return res.end();
      }
      if (
        url.pathname === "/api/property-share" ||
        (url.pathname.startsWith("/propiedades/resumen/") &&
          /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|Googlebot/i.test(
            req.headers["user-agent"] || "",
          ))
      ) {
        req.query = Object.fromEntries(url.searchParams);
        if (url.pathname.startsWith("/propiedades/resumen/"))
          req.query.id = url.pathname.split("/").pop();
        res.status = (n) => {
          res.statusCode = n;
          return res;
        };
        res.json = (data) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
          return res;
        };
        res.send = (data) => {
          res.end(data);
          return res;
        };
        return handler(req, res);
      }
      if (url.pathname.startsWith("/api/")) {
        if (!allowed.has(url.pathname.split("/").pop())) {
          res.writeHead(404);
          return res.end();
        }
        const r = await remote(url.pathname + url.search);
        res.writeHead(r.status, r.headers);
        return res.end(req.method === "HEAD" ? "" : r.body);
      }
      let file = path.resolve(root, "." + decodeURIComponent(url.pathname));
      if (!file.startsWith(root + path.sep) && file !== root) {
        res.writeHead(403);
        return res.end();
      }
      try {
        if (!(await stat(file)).isFile()) file = path.join(root, "index.html");
      } catch {
        file = path.join(root, "index.html");
      }
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      });
      res.end(req.method === "HEAD" ? "" : body);
    } catch {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end('{"message":"Public read-only source unavailable"}');
    }
  })
  .listen(Number(process.env.PORT || 4180), "127.0.0.1", () =>
    console.log(
      "Read-only portal preview http://127.0.0.1:" + (process.env.PORT || 4180),
    ),
  );
