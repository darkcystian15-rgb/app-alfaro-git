import test from "node:test";
import assert from "node:assert/strict";
import {
  consultationText,
  selectionWhatsAppUrl,
  MAX_CONSULTATION,
} from "../src/services/selection.js";
const rows = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  title: "Casa & jardín",
  price: 100000 + i,
  moneda: i % 2 ? "PEN" : "USD",
}));
test("La consulta respeta límite, enlaces canónicos, monedas y nota", () => {
  const text = consultationText(
    rows,
    "  Quiero visitar el sábado & preguntar por 2 opciones  ",
  );
  assert.equal(MAX_CONSULTATION, 10);
  assert.equal(
    (
      text.match(
        /https:\/\/app-alfaro-git-smoky.vercel.app\/propiedades\/resumen\//g,
      ) || []
    ).length,
    10,
  );
  assert.match(text, /US\$/);
  assert.match(text, /S\//);
  assert.match(text, /sábado & preguntar/);
  assert.doesNotMatch(text, /resumen\/11/);
  const url = new URL(selectionWhatsAppUrl(rows, "á & ? #"));
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/51940221494");
  assert.equal(url.searchParams.get("text"), consultationText(rows, "á & ? #"));
});
test("No ofrece mensaje vacío y limita el texto libre", () => {
  assert.equal(consultationText([]), "");
  assert.equal(selectionWhatsAppUrl([]), "");
  const text = consultationText(rows.slice(0, 1), "x".repeat(700));
  assert.ok(text.includes("x".repeat(500)));
  assert.ok(!text.includes("x".repeat(501)));
});
