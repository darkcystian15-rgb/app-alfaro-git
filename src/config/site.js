// Punto unico de configuracion comercial. No contiene secretos.
export const CONTACT_WHATSAPP = "51940221494";
export const propertyUrl = (id) =>
  `/propiedades/resumen/${encodeURIComponent(id)}`;
export function contactUrl(property) {
  const message = property
    ? `Hola, quisiera información sobre ${property.title || "este inmueble"} (${property.location || "ubicación por confirmar"}). ${typeof window !== "undefined" ? window.location.origin + propertyUrl(property.id) : propertyUrl(property.id)}`
    : "Hola, deseo información sobre sus servicios inmobiliarios.";
  return `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
export function formatPrice(value, currency = "US$") {
  if (value === null || value === undefined || String(value).trim() === "")
    return "Precio a consultar";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Precio a consultar";
  const rawCurrency = String(currency || "US$").trim();
  const symbol = /^(PEN|S\/\.?|soles?)$/i.test(rawCurrency)
    ? "S/"
    : /^(USD|US\$|\$|d[oó]lares?)$/i.test(rawCurrency)
      ? "US$"
      : rawCurrency;
  return `${symbol} ${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(amount)}`;
}
