import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  refineProperties,
  readFilters,
  filterParams,
  pageRange,
} from "../src/services/catalog-model.js";
import {
  safeImageUrl,
  shareHtml,
  renderShareImage,
  fetchPublicImage,
} from "../server/share-render.js";
import { createShareHandler } from "../server/share-handler.js";
const row = {
  id: 36,
  title: 'Casa <script>alert(1)</script> "& visita',
  price: "120000",
  moneda: "USD",
  location: "Nuevo Chimbote",
  status: "Venta",
  area: 180,
  bedrooms: 3,
  bathrooms: 2,
};
const response = () => ({
  code: 200,
  headers: {},
  body: null,
  setHeader(k, v) {
    this.headers[k.toLowerCase()] = v;
  },
  status(n) {
    this.code = n;
    return this;
  },
  send(v) {
    this.body = v;
    return this;
  },
  json(v) {
    this.body = v;
    return this;
  },
  end() {
    return this;
  },
});
test("share HTML is server-readable, escaped and points to canonical Alfaro URLs", () => {
  const html = shareHtml(row);
  assert.match(html, /og:image:width" content="1200/);
  assert.match(html, /og:image:height" content="630/);
  assert.match(html, /twitter:card" content="summary_large_image/);
  assert.ok(html.includes("&quot;&amp; visita"));
  assert.ok(!html.includes("<script>"));
  assert.match(
    html,
    /https:\/\/app-alfaro-git-smoky.vercel.app\/propiedades\/resumen\/36/,
  );
  assert.ok(html.includes("og:image"));
  assert.ok(html.includes("Nuevo Chimbote"));
});
test("image fetching rejects arbitrary hosts, credentials, ports, protocols and redirects", async () => {
  for (const url of [
    "http://media.inmobiliariaalbertoalfaro.com.pe/a",
    "https://localhost/a",
    "https://127.0.0.1/a",
    "https://media.inmobiliariaalbertoalfaro.com.pe.evil.test/a",
    "https://u:p@media.inmobiliariaalbertoalfaro.com.pe/a",
    "https://media.inmobiliariaalbertoalfaro.com.pe:444/a",
    "data:image/png,a",
  ])
    assert.equal(safeImageUrl(url), null);
  let called = 0;
  assert.equal(
    await fetchPublicImage("https://evil.test/a", {
      fetcher: async () => {
        called++;
      },
    }),
    null,
  );
  assert.equal(called, 0);
  await fetchPublicImage(
    "https://media.inmobiliariaalbertoalfaro.com.pe/a.png",
    {
      fetcher: async (url, opts) => {
        assert.equal(opts.redirect, "error");
        assert.ok(opts.signal);
        return { ok: false };
      },
    },
  );
});
test("image fetch rejects incorrect MIME and oversized inputs", async () => {
  for (const headers of [
    { "content-type": "text/html" },
    { "content-type": "image/png", "content-length": String(9 * 1024 * 1024) },
  ]) {
    const result = await fetchPublicImage(
      "https://media.inmobiliariaalbertoalfaro.com.pe/a.png",
      { fetcher: async () => ({ ok: true, headers: new Headers(headers) }) },
    );
    assert.equal(result, null);
  }
});
test("share image includes the photograph and remains a 1200x630 JPEG", async () => {
  const photo = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#0044dd" },
  })
    .png()
    .toBuffer();
  const output = await renderShareImage(row, { imageBuffer: photo });
  const meta = await sharp(output).metadata();
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 630);
  assert.equal(meta.format, "jpeg");
  const pixel = await sharp(output)
    .extract({ left: 100, top: 100, width: 1, height: 1 })
    .raw()
    .toBuffer();
  assert.ok(pixel[2] > 180 && pixel[0] < 30);
  assert.ok(output.length < 300000);
});
test("image fallback works when a remote photograph is absent or unavailable", async () => {
  const output = await renderShareImage({
    ...row,
    image: "https://not-allowed.test/photo.png",
  });
  const meta = await sharp(output).metadata();
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 630);
});
test("share endpoint rejects writes and invalid IDs before reading any data", async () => {
  let reads = 0;
  const handler = createShareHandler({
    getProperty: async () => {
      reads++;
      return [row];
    },
  });
  for (const req of [
    { method: "POST", query: { id: "36" } },
    { method: "GET", query: { id: "1 OR 1=1" } },
    { method: "GET", query: { id: "0" } },
    { method: "GET", query: { id: "36", format: "sql" } },
  ]) {
    const res = response();
    await handler(req, res);
    assert.ok([400, 405].includes(res.code));
  }
  assert.equal(reads, 0);
});
test("share endpoint handles absent records and sanitizes read failures", async () => {
  const missing = response();
  await createShareHandler({ getProperty: async () => [] })(
    { method: "GET", query: { id: "36" } },
    missing,
  );
  assert.equal(missing.code, 404);
  const failed = response();
  await createShareHandler({
    getProperty: async () => {
      throw Error("database-secret");
    },
  })({ method: "GET", query: { id: "36" } }, failed);
  assert.equal(failed.code, 503);
  assert.ok(!JSON.stringify(failed.body).includes("database-secret"));
  assert.equal(failed.headers["cache-control"], "no-store");
});
test("HEAD does not generate an image, downloads use a safe filename and concurrent image requests coalesce", async () => {
  let renders = 0;
  const handler = createShareHandler({
    getProperty: async () => [row],
    renderImage: async () => {
      renders++;
      await new Promise((r) => setTimeout(r, 5));
      return Buffer.from("JPEG");
    },
  });
  const head = response();
  await handler({ method: "HEAD", query: { id: "36", format: "image" } }, head);
  assert.equal(renders, 0);
  const first = response(),
    second = response();
  await Promise.all([
    handler({ method: "GET", query: { id: "36", format: "download" } }, first),
    handler({ method: "GET", query: { id: "36", format: "image" } }, second),
  ]);
  assert.equal(renders, 1);
  assert.equal(
    first.headers["content-disposition"],
    'attachment; filename="alfaro-inmueble-36.jpg"',
  );
  assert.equal(first.headers["content-type"], "image/jpeg");
  assert.deepEqual(first.body, second.body);
});
test("price bounds do not mix currencies or treat missing prices as zero", () => {
  const list = [
    { id: 1, price: 100, moneda: "PEN", area: 100 },
    { id: 2, price: 100, moneda: "USD", area: 100 },
    { id: 3, price: null, moneda: "USD", area: 40 },
  ];
  assert.deepEqual(
    refineProperties(list, { currency: "PEN", min: 50, max: 150 }).map(
      (p) => p.id,
    ),
    [1],
  );
  assert.equal(refineProperties(list, { min: 110 }).length, 3);
  assert.deepEqual(
    refineProperties(list, { areaMin: 80 }).map((p) => p.id),
    [1, 2],
  );
  assert.deepEqual(
    refineProperties(list, { currency: "USD", min: "0" }).map((p) => p.id),
    [2],
  );
});
test("multiple selections round-trip through URLs and pagination stays bounded", () => {
  const filters = {
    location: "Chimbote,Nuevo Chimbote",
    title: "Casa,Departamento",
    currency: "USD",
    min: 20000,
  };
  const read = readFilters(filterParams(filters));
  assert.equal(read.location, filters.location);
  assert.equal(read.title, filters.title);
  assert.equal(read.min, "20000");
  assert.deepEqual(pageRange(2, 4), [1, 2, 3, 4]);
  const pages = pageRange(10, 20);
  assert.ok(pages.includes(1) && pages.includes(20) && pages.includes(10));
  assert.ok(pages.length <= 7);
});
