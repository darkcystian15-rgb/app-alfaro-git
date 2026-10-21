export const CONTACT_WHATSAPP = "51940221494";
export const SITE_URL = "https://app-alfaro-git-smoky.vercel.app";
export const propertyUrl = (id) =>
  `/propiedades/resumen/${encodeURIComponent(id)}`;
export const absolutePropertyUrl = (id) => SITE_URL + propertyUrl(id);
export const currencyCode = (value) =>
  /^(PEN|S\/\.?|sol(?:es)?)$/i.test(String(value || "").trim())
    ? "PEN"
    : /^(USD|US\$(?: c\/u)?|\$|d[oó]lares?)$/i.test(String(value || "US$").trim())
      ? "USD"
      : String(value).trim();
export function formatPrice(value, currency = "US$") {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === "" ||
    !Number.isFinite(Number(value))
  )
    return "Precio a consultar";
  const code = currencyCode(currency),
    symbol = code === "PEN" ? "S/" : code === "USD" ? "US$" : code;
  return `${symbol} ${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(Number(value))}${/c\/u/i.test(String(currency)) ? " c/u" : ""}`;
}
export function contactUrl(property) {
  const message = property
    ? `Hola, quisiera información sobre ${property.title || "este inmueble"} (${property.location || "ubicación por confirmar"}). ${absolutePropertyUrl(property.id)}`
    : "Hola, deseo asesoría inmobiliaria de Alberto Alfaro.";
  return `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
export const shareImageUrl = (id, download = false) =>
  `/api/property-share?id=${encodeURIComponent(id)}&format=${download ? "download" : "image"}&v=3`;
