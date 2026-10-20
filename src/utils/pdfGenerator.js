import {
  absolutePropertyUrl,
  formatPrice,
  shareImageUrl,
} from "../config/site";
import DOMPurify from "dompurify";
const text = (value) => {
  const node = document.createElement("div");
  node.innerHTML = DOMPurify.sanitize(String(value || ""), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  return node.textContent || "";
};
export async function generatePropertyPdf(property, subProperties = []) {
  const [{ jsPDF }, qrModule] = await Promise.all([
    import("jspdf"),
    import("qrcode"),
  ]);
  const QRCode = qrModule.default || qrModule,
    doc = new jsPDF({ unit: "mm", format: "a4" }),
    url = absolutePropertyUrl(property.id);
  const response = await fetch(shareImageUrl(property.id));
  if (!response.ok) throw Error("Image unavailable");
  const bytes = new Uint8Array(await response.arrayBuffer());
  doc.addImage(bytes, "JPEG", 10, 12, 190, 99.75);
  const qr = await QRCode.toDataURL(url, {
    width: 140,
    margin: 1,
    color: { dark: "#202321", light: "#ffffff" },
  });
  doc.setTextColor(32, 35, 33);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  const title = doc.splitTextToSize(text(property.title), 145);
  doc.text(title, 12, 125);
  let y = 128 + title.length * 7;
  doc.setTextColor(207, 24, 48);
  doc.setFontSize(18);
  doc.text(formatPrice(property.price, property.moneda), 12, y);
  y += 12;
  doc.setTextColor(95, 110, 83);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const fields = [
    property.address,
    property.location,
    Number(property.area) > 0 ? `Superficie: ${property.area} m2` : null,
    Number(property.bedrooms) > 0 ? `Dormitorios: ${property.bedrooms}` : null,
    Number(property.bathrooms) > 0 ? `Baños: ${property.bathrooms}` : null,
  ].filter(Boolean);
  for (const field of fields) {
    const lines = doc.splitTextToSize(text(field), 145);
    doc.text(lines, 12, y);
    y += lines.length * 5 + 3;
  }
  doc.addImage(qr, "PNG", 165, 120, 32, 32);
  doc.link(165, 120, 32, 32, { url });
  const addText = (heading, body) => {
    if (!body) return;
    doc.addPage();
    y = 25;
    doc.setTextColor(207, 24, 48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(heading, 15, y);
    y += 14;
    doc.setTextColor(60, 75, 49);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    for (const line of doc.splitTextToSize(text(body), 180)) {
      if (y > 267) {
        doc.addPage();
        y = 25;
      }
      doc.text(line, 15, y);
      y += 6;
    }
  };
  addText("Descripción del inmueble", property.description);
  addText("Distribución", property.distribution);
  // Preserve all gallery captions and a direct link to each original medium.
  for (const sub of subProperties) {
    doc.addPage();
    doc.setTextColor(207, 24, 48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(
      doc.splitTextToSize(text(sub.content || "Vista adicional"), 180),
      15,
      25,
    );
    let offset = 45;
    if (sub.image && !/\.(mp4|webm|mov)(?:\?|$)/i.test(sub.image)) {
      try {
        const r = await fetch(String(sub.image).trim());
        if (r.ok) {
          const buf = new Uint8Array(await r.arrayBuffer());
          const image = doc.getImageProperties(buf),
            width = 180,
            height = Math.min(170, (width * image.height) / image.width);
          doc.addImage(
            buf,
            image.fileType || "PNG",
            15,
            offset,
            width,
            height,
            undefined,
            "FAST",
          );
          offset += height + 10;
        }
      } catch {
        /* Some image hosts do not allow browser CORS; the original link remains available. */
      }
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70, 85, 60);
    const lines = doc.splitTextToSize(text(sub.text_content), 180);
    for (const line of lines) {
      if (offset > 265) {
        doc.addPage();
        offset = 25;
      }
      doc.text(line, 15, offset);
      offset += 5;
    }
    if (sub.image) {
      if (offset > 255) {
        doc.addPage();
        offset = 25;
      }
      doc.setTextColor(207, 24, 48);
      doc.textWithLink("Abrir fotografía o video original", 15, offset + 12, {
        url: String(sub.image).trim(),
      });
    }
  }
  for (let n = 1; n <= doc.getNumberOfPages(); n++) {
    doc.setPage(n);
    doc.setDrawColor(207, 24, 48);
    doc.line(12, 279, 198, 279);
    doc.setFontSize(8);
    doc.setTextColor(100, 115, 86);
    doc.text("INMOBILIARIA ALBERTO ALFARO · +51 940 221 494", 12, 286);
    doc.text(`${n} / ${doc.getNumberOfPages()}`, 185, 286);
    doc.link(12, 281, 160, 9, { url });
  }
  doc.save(`Alfaro-inmueble-${property.id}.pdf`);
}
