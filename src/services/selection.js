import {
  absolutePropertyUrl,
  CONTACT_WHATSAPP,
  formatPrice,
} from "../config/site.js";
export const MAX_CONSULTATION = 10;
export function consultationText(properties, note = "") {
  const list = properties.slice(0, MAX_CONSULTATION);
  if (!list.length) return "";
  return [
    "Hola, quisiera información y coordinar una visita para estos inmuebles de mi selección:",
    ...list.map(
      (p, i) =>
        `${i + 1}. ${String(p.title || "Inmueble")
          .replace(/\s+/g, " ")
          .slice(
            0,
            100,
          )} — ${formatPrice(p.price, p.moneda)}\n${absolutePropertyUrl(p.id)}`,
    ),
    String(note).trim().slice(0, 500),
    "¿Podrían confirmar disponibilidad y orientarme?",
  ]
    .filter(Boolean)
    .join("\n\n");
}
export function selectionWhatsAppUrl(properties, note) {
  const text = consultationText(properties, note);
  return text
    ? `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}`
    : "";
}
