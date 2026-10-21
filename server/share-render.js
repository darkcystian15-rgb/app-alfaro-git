import sharp from "sharp";
import opentype from "opentype.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  formatPrice,
  SITE_URL,
  absolutePropertyUrl,
} from "../src/config/site.js";
export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const textOnly = (value) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export function safeImageUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === "https:" &&
      url.hostname === "media.inmobiliariaalbertoalfaro.com.pe" &&
      (!url.port || url.port === "443") &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function wrapText(value, maxChars = 25, maxLines = 4) {
  const words = textOnly(value).split(/\s+/),
    lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line);
      line = "";
    }
    line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1) + "…";
  }
  return lines;
}
export function shareHtml(property) {
  const title = `${textOnly(property.title)} · ${formatPrice(property.price, property.moneda)}`,
    description = [
      property.location,
      Number(property.area) > 0 ? `${Number(property.area)} m²` : null,
      Number(property.bedrooms) > 0 ? `${property.bedrooms} dormitorios` : null,
      Number(property.bathrooms) > 0 ? `${property.bathrooms} baños` : null,
      "Inmobiliaria Alberto Alfaro",
    ]
      .filter(Boolean)
      .map(textOnly)
      .join(" · "),
    url = absolutePropertyUrl(property.id),
    image = `${SITE_URL}/api/property-share?id=${encodeURIComponent(property.id)}&format=image&v=3`;
  return `<!doctype html><html lang="es" prefix="og: https://ogp.me/ns#"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${escapeHtml(url)}"><meta property="og:type" content="website"><meta property="og:locale" content="es_PE"><meta property="og:site_name" content="Inmobiliaria Alberto Alfaro"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(url)}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:secure_url" content="${escapeHtml(image)}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escapeHtml(property.title)} · Alberto Alfaro"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}"></head><body><h1>${escapeHtml(property.title)}</h1><p>${escapeHtml(description)}</p><p>${escapeHtml(formatPrice(property.price, property.moneda))}</p><a href="${escapeHtml(url)}">Ver la ficha del inmueble</a></body></html>`;
}
export async function fetchPublicImage(value, { fetcher = fetch } = {}) {
  const url = safeImageUrl(value);
  if (!url) return null;
  const response = await fetcher(url, {
    signal: AbortSignal.timeout(8000),
    redirect: "error",
  });
  if (
    !response.ok ||
    !/^image\/(png|jpeg|webp|avif)/i.test(
      response.headers.get("content-type") || "",
    )
  )
    return null;
  if (Number(response.headers.get("content-length")) > 8 * 1024 * 1024)
    return null;
  const reader = response.body.getReader(),
    chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8 * 1024 * 1024) {
        await reader.cancel();
        return null;
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
let fonts;
function outlinedText(value, x, y, size, color, bold = false) {
  if (!fonts) {
    const parse = (name) => {
      const bytes = readFileSync(
        path.join(process.cwd(), "server", "fonts", name),
      );
      return opentype.parse(
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
      );
    };
    fonts = {
      regular: parse("DejaVuSans.ttf"),
      bold: parse("DejaVuSans-Bold.ttf"),
    };
  }
  const font = bold ? fonts.bold : fonts.regular;
  let cursor = x;
  const scale = size / font.unitsPerEm;
  // Direct glyph outlines avoid optional shaping tables; the portal uses Latin/Spanish text.
  const outlines = [...textOnly(value).normalize("NFC")]
    .map((character) => {
      const glyph = font.charToGlyph(character);
      const outline = glyph.getPath(cursor, y, size).toPathData(2);
      cursor += (glyph.advanceWidth || font.unitsPerEm) * scale;
      return outline;
    })
    .join(" ");
  return `<path fill="${color}" d="${outlines}"/>`;
}
export async function renderShareImage(
  property,
  { imageBuffer, fetcher, brandCover = false } = {},
) {
  let picture = null;
  try {
    const input =
      imageBuffer || (await fetchPublicImage(property.image, { fetcher }));
    if (input)
      picture = await sharp(input, { limitInputPixels: 32000000 })
        .rotate()
        .resize(710, 630, {
          fit: brandCover ? "cover" : "contain",
          background: "#e3e8dc",
        })
        .jpeg({ quality: 84 })
        .toBuffer();
  } catch {
    /* Keep an honest visual fallback for unavailable photos. */
  }
  const title = wrapText(property.title, 26, 4),
    location = wrapText(property.location || "Ubicación por consultar", 30, 2);
  const features = [
    Number(property.area) > 0
      ? `${Number(property.area).toLocaleString("es-PE")} m²`
      : null,
    Number(property.bedrooms) > 0 ? `${property.bedrooms} dorm.` : null,
    Number(property.bathrooms) > 0 ? `${property.bathrooms} baños` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  // All text is converted to vector paths with bundled fonts, independent of OS fonts.
  const panel = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect x="710" width="490" height="630" fill="#f5f3ee"/><rect x="710" width="7" height="630" fill="#cf1830"/><rect x="756" y="123" width="160" height="28" rx="2" fill="#e8e9e1"/>${outlinedText(
      String(property.status || "INMUEBLE")
        .toUpperCase()
        .slice(0, 20),
      768,
      143,
      13,
      "#556448",
      true,
    )}${outlinedText(brandCover ? "Encuentra tu lugar" : formatPrice(property.price, property.moneda), 756, 209, brandCover ? 30 : 34, "#cf1830", true)}${title.map((line, i) => outlinedText(line, 756, 263 + i * 33, 23, "#202321", true)).join("")}${location.map((line, i) => outlinedText(line, 756, 426 + i * 23, 17, "#6c7b5f")).join("")}<line x1="756" y1="492" x2="1154" y2="492" stroke="#d5dccd"/>${outlinedText(features, 756, 525, 15, "#556a44")}${outlinedText("VER FICHA · CONSULTAR · COORDINAR VISITA", 756, 582, 12, "#6b805a")}<rect y="624" width="710" height="6" fill="#cf1830"/></svg>`,
  );
  const base = sharp({
    create: { width: 1200, height: 630, channels: 3, background: "#e3e8dc" },
  });
  const layers = picture
    ? [{ input: picture, left: 0, top: 0 }]
    : [
        {
          input: Buffer.from(
            `<svg width="710" height="630"><path d="M150 365 315 220l100 98 95-125 130 170" stroke="#b8c4ad" stroke-width="15" fill="none"/>${outlinedText("Fotografía por confirmar", 220, 450, 21, "#7b8a6e")}</svg>`,
          ),
          left: 0,
          top: 0,
        },
      ];
  const officialLogo = await sharp(
    readFileSync(path.join(process.cwd(), "server", "assets", "logo.png")),
  )
    .resize(270, 98, { fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();
  return base
    .composite([
      ...layers,
      { input: panel, left: 0, top: 0 },
      { input: officialLogo, left: 756, top: 12 },
    ])
    .jpeg({ quality: 87, mozjpeg: true })
    .toBuffer();
}
