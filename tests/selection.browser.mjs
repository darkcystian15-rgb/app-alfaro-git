import assert from "node:assert/strict";
import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const base = (process.env.PORTAL_BASE_URL || "http://127.0.0.1:4186").replace(
  /\/$/,
  "",
);
const out = process.env.PORTAL_ARTIFACTS || "/tmp/darkcystian-seleccion/local";
await mkdir(out, { recursive: true });
const headers = process.env.PORTAL_HEADERS_FILE
  ? JSON.parse(await readFile(process.env.PORTAL_HEADERS_FILE, "utf8"))
  : {};
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PORTAL_CHROMIUM ||
    "/home/codespace/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
if (Object.keys(headers).length)
  await context.route(base + "/**", (r) =>
    r.continue({ headers: { ...r.request().headers(), ...headers } }),
  );
const page = await context.newPage(),
  errors = [],
  writes = [],
  results = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (
    new URL(r.url()).origin === new URL(base).origin &&
    !["GET", "HEAD"].includes(r.method())
  )
    writes.push(r.url());
});
await page.route("https://api.fontshare.com/**", (r) => r.abort());
page.setDefaultTimeout(30000);
try {
  await page.goto(base);
  await page.locator(".featured-track article").first().waitFor();
  assert.equal(
    await page.locator(".brand-original").first().getAttribute("src"),
    "/logo.png",
  );
  assert.equal(await page.locator(".brand svg").count(), 0);
  await page.waitForFunction(
    () => document.querySelector(".brand-original").naturalWidth === 640,
  );
  const start = await page.locator(".hero-photo-label").innerText();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(7800);
  assert.notEqual(await page.locator(".hero-photo-label").innerText(), start);
  assert.ok(
    (await page.locator(".featured-track").evaluate((e) => e.scrollLeft)) > 0,
  );
  await page
    .getByRole("button", { name: "Pausar destacados", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reproducir destacados", exact: true })
    .waitFor();
  await page.waitForTimeout(500);
  const frozen = await page
    .locator(".featured-track")
    .evaluate((e) => e.scrollLeft);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(6800);
  assert.equal(
    await page.locator(".featured-track").evaluate((e) => e.scrollLeft),
    frozen,
  );
  for (let i = 0; i < 5; i++) {
    await page
      .getByRole("button", { name: "Destacados siguientes", exact: true })
      .click();
    await page.waitForTimeout(700);
  }
  await page
    .locator(".featured-track")
    .evaluate((e) => e.scrollTo({ left: e.scrollWidth, behavior: "instant" }));
  await page.waitForTimeout(300);
  await page
    .getByRole("button", { name: "Destacados siguientes", exact: true })
    .click();
  await page.waitForTimeout(800);
  assert.ok(
    (await page.locator(".featured-track").evaluate((e) => e.scrollLeft)) < 5,
  );
  await page
    .getByRole("button", { name: "Destacados anteriores", exact: true })
    .click();
  await page.waitForTimeout(800);
  assert.ok(
    (await page.locator(".featured-track").evaluate((e) => e.scrollLeft)) > 0,
  );
  results.push(
    "Portada y destacados avanzan automáticamente; pausa real y navegación circular funcionan",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.locator(".featured-track article").first().waitFor();
  await page
    .getByRole("button", { name: "Reproducir destacados", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Reproducir portada", exact: true })
    .waitFor();
  const labelBeforeSwipe = await page.locator(".hero-photo-label").innerText();
  await page
    .locator(".hero-photo-stack")
    .dispatchEvent("touchstart", { touches: [{ clientX: 270, clientY: 100 }] });
  await page.locator(".hero-photo-stack").dispatchEvent("touchend", {
    changedTouches: [{ clientX: 100, clientY: 105 }],
  });
  assert.notEqual(
    await page.locator(".hero-photo-label").innerText(),
    labelBeforeSwipe,
  );
  const afterSwipe = await page.locator(".hero-photo-label").innerText();
  await page
    .locator(".hero-photo-stack")
    .dispatchEvent("touchstart", { touches: [{ clientX: 270, clientY: 100 }] });
  await page.locator(".hero-photo-stack").dispatchEvent("touchend", {
    changedTouches: [{ clientX: 210, clientY: 400 }],
  });
  assert.equal(await page.locator(".hero-photo-label").innerText(), afterSwipe);
  results.push(
    "Movimiento reducido inicia ambos carruseles pausados; gesto horizontal cambia portada y desplazamiento vertical no la cambia",
  );
  const response = await page.request.get(base + "/api/getProperties");
  const rows = await response.json();
  assert.ok(rows.length >= 12);
  const ids = rows.slice(0, 12).map((p) => String(p.id));
  await page.evaluate((ids) => {
    localStorage.setItem("alfaro:v2:favorites", JSON.stringify(ids));
    localStorage.setItem("alfaro:v2:compare", "[]");
  }, ids);
  await page.goto(base + "/favoritos");
  await page.locator(".selection-item").nth(11).waitFor();
  assert.equal(
    await page.locator(".selection-checkbox input:checked").count(),
    10,
  );
  assert.equal(
    await page.locator(".selection-checkbox input:disabled").count(),
    2,
  );
  await page
    .getByRole("button", { name: "Desmarcar todos", exact: true })
    .click();
  assert.equal(
    await page.locator(".selection-checkbox input:checked").count(),
    0,
  );
  assert.equal(await page.locator(".selection-whatsapp").count(), 0);
  await page.locator(".selection-checkbox input").nth(0).check();
  await page.locator(".selection-checkbox input").nth(11).check();
  await page
    .getByLabel("Añade tu consulta (opcional)")
    .fill("Quiero visitar el sábado & conocer detalles.");
  await page.getByText("Revisar mensaje preparado", { exact: true }).click();
  const wa = new URL(
      await page.locator(".selection-whatsapp").getAttribute("href"),
    ),
    message = wa.searchParams.get("text");
  assert.equal(wa.hostname, "wa.me");
  assert.match(message, /sábado & conocer/);
  assert.ok(message.includes("/resumen/" + ids[0]));
  assert.ok(message.includes("/resumen/" + ids[11]));
  assert.equal((message.match(/https:\/\//g) || []).length, 2);
  assert.equal(
    await page.locator(".selection-whatsapp").getAttribute("target"),
    "_blank",
  );
  assert.match(
    await page.locator(".selection-message").innerText(),
    /sábado & conocer/,
  );
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: out + `/mi-seleccion-${width}.png`,
      fullPage: true,
      timeout: 30000,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "overflow " + width,
    );
  }
  await page.reload();
  await page.locator(".selection-item").nth(11).waitFor();
  assert.equal(
    await page.getByLabel("Añade tu consulta (opcional)").inputValue(),
    "",
  );
  assert.equal(await page.locator(".selection-item").count(), 12);
  await page
    .locator(".selection-item")
    .first()
    .getByRole("button", { name: /Quitar de favoritos/ })
    .click();
  assert.equal(await page.locator(".selection-item").count(), 11);
  await page
    .locator(".selection-item")
    .first()
    .getByRole("button", { name: "Comparar inmueble", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Comparar (1/3)", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Vaciar favoritos", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  assert.equal(await page.locator(".selection-item").count(), 11);
  await page
    .getByRole("button", { name: "Vaciar favoritos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sí, vaciar favoritos", exact: true })
    .click();
  assert.equal(await page.locator(".selection-item").count(), 0);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("alfaro:v2:favorites")),
    "[]",
  );
  results.push(
    "Administración: persistencia, corazones, comparación, límite 10, elección individual, nota no persistente, mensaje correcto, vaciado con confirmación y móvil sin desbordamiento",
  );
  await page.evaluate(() =>
    localStorage.setItem("alfaro:v2:favorites", '["999999999"]'),
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Quitar guardados no disponibles" })
    .waitFor();
  assert.equal(await page.locator(".selection-whatsapp").count(), 0);
  await page
    .getByRole("button", { name: "Quitar guardados no disponibles" })
    .click();
  await page
    .getByRole("heading", {
      name: "Tu próxima historia puede empezar con un favorito.",
    })
    .waitFor();
  results.push(
    "Guardados retirados del catálogo se explican y se excluyen de WhatsApp",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(writes, []);
  await writeFile(
    out + "/results.json",
    JSON.stringify(
      { base, results, errors, writes, checkedAt: new Date().toISOString() },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ results, errors, writes }, null, 2));
} finally {
  await browser.close();
}
