import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PORTAL_BASE_URL || "http://localhost:4173";
const apiOrigin = process.env.PORTAL_READONLY_API_ORIGIN;
const artifacts = process.env.PORTAL_ARTIFACTS || "/tmp/darkcystian-review";
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PORTAL_CHROMIUM
    ? { executablePath: process.env.PORTAL_CHROMIUM }
    : {}),
  args: ["--no-sandbox"],
});
const cache = new Map();
const results = [];
const runtimeErrors = [];
const failedApi = [];
const allowed = new Set([
  "getProperties",
  "get-options",
  "getPropertyDetails",
  "getPropertyDetailInfo",
  "get-social-links",
  "getAsesores",
  "getArticulos",
  "getNoticias",
]);
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
context.on("page", (page) =>
  page.on("pageerror", (e) => runtimeErrors.push(e.message)),
);
if (apiOrigin) {
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      request.method() !== "GET" ||
      !allowed.has(url.pathname.split("/").pop())
    )
      return route.abort();
    const key = url.pathname + url.search;
    if (!cache.has(key))
      cache.set(
        key,
        (async () => {
          const response = await context.request.get(apiOrigin + key, {
            timeout: 45000,
          });
          const body = await response.body();
          return {
            status: response.status(),
            contentType: response.headers()["content-type"],
            body,
          };
        })(),
      );
    try {
      await route.fulfill(await cache.get(key));
    } catch {
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: '{"error":"Read-only API unavailable"}',
      });
    }
  });
}
try {
  const page = await context.newPage();
  page.on("response", (r) => {
    if (
      (r.url().includes("/api/") || r.url().includes("/.netlify/functions/")) &&
      r.status() >= 400
    )
      failedApi.push({ path: new URL(r.url()).pathname, status: r.status() });
  });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("heading", { name: "Propiedades destacadas", exact: true })
    .waitFor();
  await page
    .locator("article.alfaro-property-card")
    .first()
    .waitFor({ timeout: 60000 });
  await page
    .getByRole("option", { name: "Todas las ubicaciones" })
    .waitFor({ state: "attached" });
  await page.waitForFunction(
    () => document.querySelectorAll("select")[0].options.length > 1,
  );
  assert.equal(await page.locator("article.alfaro-property-card").count(), 6);
  const id = await page
    .locator("article.alfaro-property-card a")
    .first()
    .getAttribute("href");
  await page.getByRole("button", { name: "Buscar inmuebles" }).click();
  await page.getByText(/inmuebles encontrados/).waitFor({ timeout: 60000 });
  const resultsSection = page.getByRole("region", {
    name: "Resultados de tu búsqueda",
  });
  assert.equal(await resultsSection.locator("article").count(), 9);
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByText(/Página 2 de/).waitFor();
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  await page.getByText(/Página 1 de/).waitFor();
  results.push(
    "Home: six live featured properties, empty filters, pagination forward/backward",
  );
  const wa = await page
    .locator('article a[href^="https://wa.me/"]')
    .first()
    .getAttribute("href");
  assert.ok(wa.includes("wa.me/51940221494?text="));
  assert.ok(
    new URL(wa).searchParams.get("text").includes("/propiedades/resumen/"),
  );
  results.push("WhatsApp institutional contact and property link");

  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page
      .locator("article.alfaro-property-card")
      .first()
      .waitFor({ timeout: 60000 });
    await page.waitForTimeout(900);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Home overflow at " + width,
    );
    await page.screenshot({
      path: `${artifacts}/inicio-${width}.png`,
      fullPage: true,
    });
    if (width < 965) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
      await page
        .locator("nav")
        .getByRole("link", { name: "SERVICIOS", exact: true })
        .waitFor();
      await page.getByRole("button", { name: "Cerrar menú" }).click();
    }
  }
  results.push(
    "Home widths 375/768/1440 without horizontal overflow; mobile menu opens/closes",
  );

  const routes = [
    "/propiedades",
    id,
    "/servicios",
    "/blog",
    "/asesores",
    "/contacto",
    "/acerca-de-nosotros",
    "/nuestra-historia",
    "/vende-o-alquila",
    "/login",
    "/registro",
    "/admin",
  ];
  for (const path of routes) {
    console.log("Checking public route:", path);
    await page.goto(base + path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1100);
    assert.ok(await page.locator("#root").innerText(), "Empty route: " + path);
    assert.equal(
      await page.getByText("Unexpected Application Error!").count(),
      0,
      path,
    );
    if (path === "/propiedades") {
      await page
        .locator("article.alfaro-property-card")
        .first()
        .waitFor({ timeout: 60000 });
      assert.equal(
        await page.locator("article.alfaro-property-card").count(),
        9,
      );
      await page.screenshot({
        path: `${artifacts}/catalogo-1440.png`,
        fullPage: true,
      });
    }
    if (["/login", "/registro", "/admin"].includes(path))
      assert.equal(await page.locator('input[type="password"]').count(), 0);
  }
  assert.deepEqual(runtimeErrors, []);
  results.push(
    "12 public routes including existing real property summary; simulated auth forms disabled; no uncaught JavaScript errors",
  );

  // Deterministic cases use synthetic responses only in this isolated browser context.
  const isolated = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  const fixture = {
    id: "test-only",
    title: "Casa de prueba",
    price: "1500.5",
    moneda: "PEN",
    location: "Chimbote",
    status: "Venta",
    image: "/missing-test-image.png",
  };
  let mode = "empty";
  await isolated.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/get-options")
      return route.fulfill({
        json: {
          distritos: [
            {
              departamento: "Áncash",
              distritos: [{ id: 1, nombre: "Chimbote" }],
            },
          ],
          modalidades: ["Venta"],
          tipos: ["Casa"],
        },
      });
    if (path === "/api/get-social-links") return route.fulfill({ json: [] });
    if (path === "/api/getProperties") {
      if (mode === "error")
        return route.fulfill({
          status: 500,
          json: { error: "private diagnostic" },
        });
      if (mode === "invalid")
        return route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "private diagnostic",
        });
      return route.fulfill({ json: mode === "empty" ? [] : [fixture] });
    }
    return route.abort();
  });
  const scenario = await isolated.newPage();
  await scenario.goto(base + "/propiedades");
  await scenario
    .getByText(
      "No encontramos inmuebles para esos filtros. Prueba otra búsqueda.",
    )
    .waitFor();
  mode = "error";
  await scenario.reload();
  await scenario
    .getByRole("alert")
    .filter({ hasText: "No pudimos cargar" })
    .waitFor();
  assert.ok(
    !(await scenario.locator("body").innerText()).includes(
      "private diagnostic",
    ),
  );
  mode = "valid";
  await scenario.getByRole("button", { name: "Reintentar" }).click();
  await scenario.getByText("Imagen por confirmar").waitFor();
  await scenario.getByText("S/ 1,500.5", { exact: true }).waitFor();
  assert.ok(
    await scenario.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  mode = "invalid";
  await scenario.reload();
  await scenario
    .getByRole("alert")
    .filter({ hasText: "No pudimos cargar" })
    .waitFor();
  mode = "valid";
  await scenario.goto(base);
  await scenario
    .getByRole("combobox", { name: /^Ubicación/ })
    .selectOption("Chimbote");
  await scenario
    .getByRole("combobox", { name: /^Operación/ })
    .selectOption("Venta");
  await scenario
    .getByRole("combobox", { name: /^Tipo de inmueble/ })
    .selectOption("Casa");
  const requestPromise = scenario.waitForRequest((r) =>
    r.url().includes("getProperties?location="),
  );
  await scenario.getByRole("button", { name: "Buscar inmuebles" }).click();
  const request = await requestPromise;
  assert.deepEqual(Object.fromEntries(new URL(request.url()).searchParams), {
    location: "Chimbote",
    status: "Venta",
    title: "Casa",
  });
  results.push(
    "Synthetic isolated cases: empty/error/retry/invalid JSON, missing image, soles and combined filters",
  );
  await isolated.close();
  await writeFile(
    artifacts + "/browser-results.json",
    JSON.stringify(
      { base, apiOrigin, results, runtimeErrors, failedApi },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ results, runtimeErrors, failedApi }, null, 2));
} finally {
  await browser.close();
}
