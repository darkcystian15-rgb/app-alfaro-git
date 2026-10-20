import sharp from "sharp";
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
    image = `${SITE_URL}/api/property-share?id=${encodeURIComponent(property.id)}&format=image&v=2`;
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
export async function renderShareImage(
  property,
  { imageBuffer, fetcher } = {},
) {
  let picture = null;
  try {
    const input =
      imageBuffer || (await fetchPublicImage(property.image, { fetcher }));
    if (input)
      picture = await sharp(input, { limitInputPixels: 32000000 })
        .rotate()
        .resize(710, 630, { fit: "contain", background: "#e3e8dc" })
        .jpeg({ quality: 84 })
        .toBuffer();
  } catch {
    /* A branded fallback remains available when an external photo fails. */
  }
  const title = wrapText(property.title, 26, 4),
    price = escapeHtml(formatPrice(property.price, property.moneda)),
    location = wrapText(property.location || "Ubicación por consultar", 30, 2);
  const details = [
    Number(property.area) > 0
      ? `${Number(property.area).toLocaleString("es-PE")} m²`
      : null,
    Number(property.bedrooms) > 0 ? `${property.bedrooms} dorm.` : null,
    Number(property.bathrooms) > 0 ? `${property.bathrooms} baños` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f5f3ee"/>${picture ? "" : '<rect width="710" height="630" fill="#e3e8dc"/><path d="M150 365 315 220l100 98 95-125 130 170" stroke="#b8c4ad" stroke-width="15" fill="none"/><text x="355" y="450" text-anchor="middle" font-size="21" fill="#7b8a6e" font-family="sans-serif">Fotografía por confirmar</text>'}<rect x="710" width="490" height="630" fill="#f5f3ee"/><rect x="710" width="7" height="630" fill="#cf1830"/><path d="M756 75 776 55l11 11M775 75l21-27 18 22" fill="none" stroke="#cf1830" stroke-width="5"/><text x="830" y="62" font-family="sans-serif" font-weight="bold" font-size="19" fill="#202321">ALBERTO ALFARO</text><text x="831" y="79" font-family="sans-serif" letter-spacing="3" font-size="10" fill="#68765c">INMOBILIARIA</text><rect x="756" y="123" width="135" height="28" rx="2" fill="#e8e9e1"/><text x="768" y="142" font-size="13" font-family="sans-serif" font-weight="bold" fill="#556448">${escapeHtml(
      textOnly(property.status || "INMUEBLE")
        .toUpperCase()
        .slice(0, 20),
    )}</text><text x="756" y="209" font-family="sans-serif" font-weight="bold" font-size="35" letter-spacing="-1" fill="#cf1830">${price}</text>${title.map((line, i) => `<text x="756" y="${263 + i * 33}" font-family="sans-serif" font-weight="bold" font-size="24" fill="#202321">${escapeHtml(line)}</text>`).join("")}${location.map((line, i) => `<text x="756" y="${426 + i * 23}" font-family="sans-serif" font-size="17" fill="#6c7b5f">${escapeHtml(line)}</text>`).join("")}<line x1="756" y1="492" x2="1154" y2="492" stroke="#d5dccd"/><text x="756" y="525" font-family="sans-serif" font-size="16" fill="#556a44">${escapeHtml(details)}</text><text x="756" y="582" font-family="sans-serif" font-size="13" fill="#6b805a">VER FICHA · CONSULTAR · COORDINAR VISITA</text><rect y="615" width="710" height="15" fill="#cf1830"/></svg>`,
  );
  const layers = picture
    ? [
        { input: picture, left: 0, top: 0 },
        { input: svg, left: 0, top: 0 },
      ]
    : [{ input: svg, left: 0, top: 0 }];
  // The SVG background must not cover the photograph when composited.
  if (picture) {
    const panel = await sharp(svg)
      .extract({ left: 710, top: 0, width: 490, height: 630 })
      .png()
      .toBuffer();
    return sharp({
      create: { width: 1200, height: 630, channels: 3, background: "#cf1830" },
    })
      .composite([
        { input: picture, left: 0, top: 0 },
        { input: panel, left: 710, top: 0 },
        {
          input: Buffer.from(
            '<svg width="710" height="6"><rect width="710" height="6" fill="#cf1830"/></svg>',
          ),
          left: 0,
          top: 624,
        },
      ])
      .jpeg({ quality: 87, mozjpeg: true })
      .toBuffer();
  }
  return sharp({
    create: { width: 1200, height: 630, channels: 3, background: "#f5f3ee" },
  })
    .composite(layers)
    .jpeg({ quality: 87, mozjpeg: true })
    .toBuffer();
}
