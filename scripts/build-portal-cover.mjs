import { renderShareImage } from "../server/share-render.js";
import { readFile, writeFile } from "node:fs/promises";
await writeFile(
  "public/og/portal-alfaro.jpg",
  await renderShareImage(
    {
      title: "Tu próximo espacio empieza aquí",
      location: "Chimbote · Nuevo Chimbote",
      status: "Venta · Alquiler",
    },
    {
      imageBuffer: await readFile("public/portal/hero-living.webp"),
      brandCover: true,
    },
  ),
);
