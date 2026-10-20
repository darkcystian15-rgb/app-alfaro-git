import { createHash } from "node:crypto";
import { shareHtml, renderShareImage } from "./share-render.js";
export function createShareHandler({
  getProperty,
  renderImage = renderShareImage,
}) {
  const cache = new Map();
  return async function handler(req, res) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (!["GET", "HEAD"].includes(req.method)) {
      res.setHeader("Allow", "GET, HEAD");
      return res.status(405).json({ message: "Método no permitido" });
    }
    const id = String(req.query?.id || ""),
      format = String(req.query?.format || "html");
    if (
      !/^[1-9]\d{0,9}$/.test(id) ||
      !["html", "image", "download"].includes(format)
    )
      return res.status(400).json({ message: "Solicitud inválida" });
    try {
      const rows = await getProperty(id);
      if (!rows.length)
        return res.status(404).json({ message: "Inmueble no disponible" });
      const p = rows[0];
      res.setHeader(
        "Cache-Control",
        "public, max-age=60, s-maxage=300, stale-while-revalidate=60",
      );
      if (format === "html") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(req.method === "HEAD" ? "" : shareHtml(p));
      }
      res.setHeader("Content-Type", "image/jpeg");
      if (format === "download")
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="alfaro-inmueble-${id}.jpg"`,
        );
      if (req.method === "HEAD") return res.status(200).end();
      const key = createHash("sha256").update(JSON.stringify(p)).digest("hex");
      let entry = cache.get(key);
      if (!entry || entry.expires < Date.now()) {
        entry = { promise: renderImage(p), expires: Date.now() + 300000 };
        cache.set(key, entry);
        if (cache.size > 32) cache.delete(cache.keys().next().value);
        entry.promise.catch(() => cache.delete(key));
      }
      return res.status(200).send(await entry.promise);
    } catch {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(503).json({
        message: "No pudimos preparar la tarjeta. Inténtalo nuevamente.",
      });
    }
  };
}
