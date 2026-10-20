import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const importSource = async (path) =>
  import(
    `data:text/javascript;base64,${Buffer.from(await readFile(new URL(path, import.meta.url), "utf8")).toString("base64")}`
  );
const { fetchProperties } = await importSource("../src/services/properties.js");
const { formatPrice, contactUrl, propertyUrl } = await importSource(
  "../src/config/site.js",
);

test("catalog preserves optional filters and featured contract, encoding values and passing cancellation", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => [{ id: 123 }] };
  });
  const controller = new AbortController();
  assert.deepEqual(await fetchProperties({}, { signal: controller.signal }), [
    { id: 123 },
  ]);
  assert.equal(calls[0].url, "/api/getProperties");
  assert.equal(calls[0].options.signal, controller.signal);
  await fetchProperties({
    location: " Nuevo Chimbote ",
    title: "Local comercial",
    status: "alquiler",
    featured: "true",
    omitted: "",
    other: null,
  });
  const query = new URL(calls[1].url, "https://portal.test").searchParams;
  assert.deepEqual(Object.fromEntries(query), {
    location: "Nuevo Chimbote",
    title: "Local comercial",
    status: "alquiler",
    featured: "true",
  });
});

test("catalog rejects HTTP, invalid JSON and malformed responses without disclosing server details", async (t) => {
  for (const response of [
    { ok: false },
    {
      ok: true,
      json: async () => {
        throw new Error("private database detail");
      },
    },
    { ok: true, json: async () => ({ error: "private database detail" }) },
    { ok: true, json: async () => [null] },
    { ok: true, json: async () => [{ title: "missing id" }] },
  ]) {
    const mock = t.mock.method(globalThis, "fetch", async () => response);
    await assert.rejects(
      fetchProperties(),
      (error) =>
        !error.message.includes("private") &&
        /cargar|formato/.test(error.message),
    );
    mock.mock.restore();
  }
});

test("cancelled requests stay cancelled", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new DOMException("Cancelled", "AbortError");
  });
  await assert.rejects(fetchProperties(), { name: "AbortError" });
});

test("prices distinguish missing amounts, soles, dollars, zero and decimal amounts", () => {
  for (const value of [null, undefined, "", " ", "invalid"])
    assert.equal(formatPrice(value), "Precio a consultar");
  assert.match(formatPrice("1500.5", "PEN"), /^S\/ /);
  assert.match(formatPrice("1500.5", "USD"), /^US\$ /);
  assert.match(formatPrice(0, "S/"), /^S\/ 0$/);
  assert.ok(formatPrice(1500.5, "US$").includes("1,500.5"));
});

test("WhatsApp uses the institutional contact and an encoded summary URL", () => {
  assert.equal(propertyUrl("a/b ?"), "/propiedades/resumen/a%2Fb%20%3F");
  const url = new URL(
    contactUrl({ id: 123, title: "Casa & local", location: "Chimbote" }),
  );
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/51940221494");
  assert.ok(url.searchParams.get("text").includes("Casa & local"));
  assert.ok(url.searchParams.get("text").includes("/propiedades/resumen/123"));
});
