import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import sharp from "sharp";
const base = (process.env.PORTAL_BASE_URL || "http://127.0.0.1:4180").replace(
    /\/$/,
    "",
  ),
  artifacts = process.env.PORTAL_ARTIFACTS || "/tmp/darkcystian-v2/validation",
  uiOnly = process.env.PORTAL_UI_ONLY === "1";
await mkdir(artifacts, { recursive: true });
const headers = process.env.PORTAL_HEADERS_FILE
  ? JSON.parse(await readFile(process.env.PORTAL_HEADERS_FILE, "utf8"))
  : {};
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PORTAL_CHROMIUM
    ? { executablePath: process.env.PORTAL_CHROMIUM }
    : {}),
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
  acceptDownloads: true,
});
if (Object.keys(headers).length) {
  // Native browser downloads also need the origin-scoped Vercel authentication cookie.
  await context.request.get(base, {
    headers: { ...headers, "x-vercel-set-bypass-cookie": "true" },
  });
}
if (Object.keys(headers).length)
  await context.route(base + "/**", (route) =>
    route.continue({ headers: { ...route.request().headers(), ...headers } }),
  );
if (process.env.PORTAL_READONLY_API_ORIGIN)
  await context.route("**/api/get*", async (route) => {
    const u = new URL(route.request().url());
    assert.equal(route.request().method(), "GET");
    const response = await context.request.get(
      process.env.PORTAL_READONLY_API_ORIGIN + u.pathname + u.search,
    );
    await route.fulfill({ response });
  });
const errors = [],
  results = [],
  outbound = [];
context.on("page", (p) => {
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("request", (r) => {
    if (
      new URL(r.url()).origin === new URL(base).origin &&
      !["GET", "HEAD"].includes(r.method())
    )
      outbound.push({ method: r.method(), path: new URL(r.url()).pathname });
  });
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
await page.route("https://api.fontshare.com/**", (r) => r.abort());
async function cards(p = page) {
  await p.locator("article.property-card").first().waitFor({ timeout: 45000 });
}
async function photograph(p = page) {
  await p.locator(".property-card").first().scrollIntoViewIfNeeded();
  await p
    .waitForFunction(
      () =>
        [...document.querySelectorAll(".property-card .photo-area img")]
          .slice(0, 3)
          .every((i) => i.complete),
      {},
      { timeout: 25000 },
    )
    .catch(() => {});
}
async function screenshot(name, p = page) {
  await p.screenshot({
    path: artifacts + "/" + name + ".png",
    fullPage: true,
    timeout: 20000,
  });
}
try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await cards();
  assert.equal(await page.locator(".featured-track article").count(), 8);
  await page.getByRole("button", { name: "Pausar portada" }).count();
  await page
    .getByRole("button", { name: "Imagen siguiente", exact: true })
    .click();
  await page.getByText("Lugares para crecer", { exact: true }).waitFor();
  const track = page.locator(".featured-track");
  await page.getByRole("button", { name: "Destacados siguientes" }).click();
  await page.waitForFunction(
    () => document.querySelector(".featured-track").scrollLeft > 0,
  );
  await page.getByRole("button", { name: "Destacados anteriores" }).click();
  results.push(
    "All featured properties reachable; hero and featured carousels controlled",
  );
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
    await photograph();
    await page.evaluate(() => scrollTo(0, 0));
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Home overflow " + width,
    );
    if (width < 851) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
      await page
        .locator("nav")
        .getByRole("link", { name: "Servicios", exact: true })
        .waitFor();
      await page.getByRole("button", { name: "Cerrar menú" }).click();
    }
    await screenshot("inicio-" + width);
  }
  await page.goto(base + "/propiedades");
  await cards();
  assert.equal(await page.locator(".property-grid article").count(), 9);
  await page
    .getByRole("button", { name: "Página siguiente", exact: true })
    .click();
  await page.waitForURL("**page=2");
  await page.getByRole("button", { name: "Página 2", exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Página 2", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
  results.push("Real catalogue, numbered pagination and URL state");
  const first = page.locator(".property-grid article").first(),
    idHref = await first.locator(".card-title").getAttribute("href"),
    id = idHref.split("/").pop();
  await first
    .getByRole("button", { name: new RegExp("Guardar inmueble") })
    .click();
  assert.equal(
    await first
      .getByRole("button", { name: new RegExp("Quitar de favoritos") })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.reload();
  await cards();
  assert.equal(
    await page
      .locator(".property-grid article")
      .first()
      .getByRole("button", { name: new RegExp("Quitar de favoritos") })
      .getAttribute("aria-pressed"),
    "true",
  );
  for (let i = 0; i < 4; i++)
    await page
      .locator(".property-grid article")
      .nth(i)
      .getByRole("button", { name: "Comparar inmueble", exact: true })
      .click();
  assert.match(await page.locator(".compare-dock").innerText(), /3 de 3/);
  await page.goto(base + "/comparar");
  await page.locator(".comparison-table").waitFor();
  assert.equal(await page.locator(".comparison-table thead th").count(), 4);
  await screenshot("comparacion-1440");
  await page.goto(base + "/favoritos");
  await cards();
  assert.equal(await page.locator(".property-grid article").count(), 1);
  results.push(
    "Favorites persist after reload; comparison capped at three and displays actual fields",
  );
  await page.goto(base + "/propiedades");
  await cards();
  const search = page.getByRole("form", { name: "Buscar inmuebles" });
  await search
    .locator("details.filter-select")
    .nth(0)
    .locator("summary")
    .click();
  await search.getByRole("checkbox", { name: "Chimbote", exact: true }).check();
  await search
    .getByRole("checkbox", { name: "Nuevo Chimbote", exact: true })
    .check();
  await search
    .locator("details.filter-select")
    .nth(0)
    .locator("summary")
    .click();
  await search.getByRole("button", { name: "Buscar inmuebles" }).click();
  await page.waitForURL(
    (u) => u.searchParams.get("location") === "Chimbote,Nuevo Chimbote",
  );
  await cards();
  assert.ok(new URL(page.url()).searchParams.get("location").includes(","));
  await page.reload();
  await cards();
  assert.ok(
    (await page.locator(".filter-chips").innerText()).includes(
      "Chimbote,Nuevo Chimbote",
    ),
  );
  await page.getByRole("button", { name: "Quitar filtro Ubicación" }).click();
  await cards();
  results.push(
    "Multiple districts, shareable filter URL, reload and clearing chips",
  );
  await page.goto(base + "/propiedades?currency=PEN&min=1&sort=price-asc");
  await cards();
  const priceTexts = await page
    .locator(".property-grid .card-price")
    .allTextContents();
  assert.ok(priceTexts.every((t) => t.includes("S/")));
  await screenshot("catalogo-1440");
  await page.goto(base + "/propiedades?currency=PEN&min=999999999");
  await page
    .getByRole("heading", {
      name: "No encontramos inmuebles para esos filtros",
    })
    .waitFor();
  results.push("Price filters respect explicit currency and empty results");
  await page.goto(base + "/propiedades?page=2");
  await cards();
  const href = await page
    .locator(".property-grid article .card-title")
    .first()
    .getAttribute("href");
  await page.locator(".property-grid article .card-title").first().click();
  await page.locator(".gallery-stage").waitFor();
  await page.getByRole("link", { name: "Volver a los inmuebles" }).click();
  await page.waitForURL("**page=2");
  await cards();
  results.push("Property detail returns to original search and pagination");
  await page.goto(base + idHref);
  await page.locator(".gallery-stage").waitFor();
  await page.getByRole("button", { name: /Ver \d+ foto/ }).click();
  await page
    .getByRole("dialog", { name: "Fotografías ampliadas del inmueble" })
    .waitFor();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Compartir", exact: true }).click();
  const wa = await page
    .locator('.contact-panel a[href^="https://wa.me/"]')
    .getAttribute("href");
  assert.ok(wa.includes("51940221494"));
  assert.ok(
    decodeURIComponent(wa).includes(
      "https://app-alfaro-git-smoky.vercel.app/propiedades/resumen/",
    ),
  );
  results.push(
    "Gallery opens and closes by keyboard; institutional WhatsApp includes canonical property URL",
  );
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Detail overflow " + width,
    );
    await screenshot("ficha-" + width);
  }
  if (!uiOnly) {
    const reqHeaders = { ...headers, "user-agent": "WhatsApp/2.24" };
    const crawler = await context.request.get(base + idHref, {
      headers: reqHeaders,
    });
    assert.equal(crawler.status(), 200);
    const html = await crawler.text();
    assert.ok(html.includes("og:image:width"));
    assert.ok(
      html.includes("/api/property-share?id=" + id),
      "Crawler must receive property-specific metadata, not the generic SPA",
    );
    assert.ok(html.includes('content="1200"'));
    assert.ok(!html.includes("/src/main.jsx"));
    const image = await context.request.get(
      base + `/api/property-share?id=${id}&format=image`,
      { headers },
    );
    assert.equal(image.status(), 200);
    assert.ok(image.headers()["content-type"].includes("image/jpeg"));
    const bytes = await image.body();
    const meta = await sharp(bytes).metadata();
    assert.equal(meta.width, 1200);
    assert.equal(meta.height, 630);
    await writeFile(artifacts + "/tarjeta-whatsapp.jpg", bytes);
    const imageDl = page.waitForEvent("download");
    await page.getByRole("link", { name: "Descargar tarjeta JPG" }).click();
    const dl = await imageDl;
    assert.ok(dl.suggestedFilename().endsWith(".jpg"));
    await dl.saveAs(artifacts + "/tarjeta-descarga.jpg");
    const pdfDl = page.waitForEvent("download", { timeout: 90000 });
    await page.getByRole("button", { name: "Descargar ficha PDF" }).click();
    const pdf = await pdfDl;
    await pdf.saveAs(artifacts + "/ficha.pdf");
    assert.equal(
      (await readFile(artifacts + "/ficha.pdf")).subarray(0, 4).toString(),
      "%PDF",
    );
    results.push(
      "WhatsApp crawler receives server metadata; real JPG 1200x630 and branded PDF downloads succeed",
    );
  }
  for (const path of [
    "/servicios",
    "/acerca-de-nosotros",
    "/nuestra-historia",
    "/asesores",
    "/blog",
    "/blog/noticias",
    "/blog/articulos",
    "/contacto",
    "/vende-o-alquila",
    "/login",
    "/registro",
    "/admin",
  ]) {
    console.log("Route:", path);
    await page.goto(base + path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    assert.ok(
      !(await page.locator("body").innerText()).includes(
        "Unexpected Application Error",
      ),
    );
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Overflow " + path + " " + width,
      );
    }
    if (
      [
        "/servicios",
        "/asesores",
        "/blog",
        "/contacto",
        "/vende-o-alquila",
      ].includes(path)
    )
      await screenshot(path.slice(1) + "-1440");
  }
  await page.goto(base + "/vende-o-alquila");
  const form = page.locator(".offer-contact form");
  await form.getByLabel("Tu nombre").fill("Prueba local");
  await form.getByLabel("Teléfono de contacto").fill("999999999");
  await form
    .getByRole("button", { name: "Preparar consulta por WhatsApp" })
    .click();
  const destination = await form
    .getByRole("link", { name: /Abrir mi consulta/ })
    .getAttribute("href");
  assert.ok(destination.startsWith("https://wa.me/51940221494"));
  assert.ok(
    decodeURIComponent(destination).includes("Deseo ofrecer mi inmueble"),
  );
  results.push(
    "Institutional routes and mobile overflow checked; offering prepares WhatsApp without sending or POST",
  );
  // Malformed data and untrusted HTML stay confined to this synthetic browser context.
  const fixture = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  if (Object.keys(headers).length)
    await fixture.route(base + "/**", (r) =>
      r.continue({ headers: { ...r.request().headers(), ...headers } }),
    );
  let mode = "error";
  await fixture.route("**/api/**", (r) => {
    const u = new URL(r.request().url());
    if (u.pathname === "/api/getProperties")
      return r.fulfill(
        mode === "error"
          ? { status: 500, json: { message: "private diagnostic" } }
          : { json: [] },
      );
    if (u.pathname === "/api/get-options")
      return r.fulfill({ json: { distritos: [], tipos: [], modalidades: [] } });
    if (u.pathname === "/api/getPropertyDetails")
      return r.fulfill({
        json: {
          property: {
            id: 36,
            title: "Prueba de contenido",
            image: "/missing-image-test.png",
            description:
              '<p>Texto válido</p><script>window.__xss=1</script><img src=x onerror="window.__xss=2"><a href="javascript:alert(1)">enlace</a>',
          },
          subProperties: [],
        },
      });
    return r.fulfill({ json: [] });
  });
  const fp = await fixture.newPage();
  await fp.goto(base + "/propiedades");
  await fp.getByRole("alert").waitFor();
  assert.ok(
    !(await fp.locator("body").innerText()).includes("private diagnostic"),
  );
  mode = "empty";
  await fp.getByRole("button", { name: "Reintentar" }).click();
  await fp
    .getByRole("heading", {
      name: "No encontramos inmuebles para esos filtros",
    })
    .waitFor();
  await fp.goto(base + "/propiedades/resumen/36");
  await fp.getByText("Texto válido", { exact: true }).waitFor();
  assert.equal(await fp.evaluate(() => window.__xss), undefined);
  assert.equal(
    await fp
      .locator(
        '.rich-content script,.rich-content [onerror],.rich-content a[href^="javascript:"]',
      )
      .count(),
    0,
  );
  await fp.getByText("Imagen por confirmar", { exact: true }).first().waitFor();
  await fixture.close();
  results.push(
    "HTTP failure/retry, empty results, broken images and HTML sanitization verified with isolated fixtures",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(outbound, []);
  const result = {
    base,
    uiOnly,
    results,
    runtimeErrors: errors,
    outboundWrites: outbound,
  };
  await writeFile(
    artifacts + "/browser-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
