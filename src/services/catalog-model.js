import { currencyCode } from "../config/site.js";
export const FILTER_KEYS = [
  "location",
  "status",
  "title",
  "currency",
  "min",
  "max",
  "areaMin",
  "areaMax",
  "sort",
  "featured",
];
export function readFilters(params) {
  return Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ""]));
}
export function filterParams(filters) {
  const params = new URLSearchParams();
  for (const k of FILTER_KEYS)
    if (filters[k] !== "" && filters[k] != null)
      params.set(k, String(filters[k]));
  return params;
}
export const valuesOf = (value) =>
  String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
export function refineProperties(items, filters = {}) {
  let out = items.filter((item) => {
    const price =
        item.price === null ||
        item.price === undefined ||
        String(item.price).trim() === ""
          ? NaN
          : Number(item.price),
      area = Number(item.area);
    if (filters.currency && currencyCode(item.moneda) !== filters.currency)
      return false;
    // Price bounds apply only after explicitly choosing a currency.
    if (
      filters.currency &&
      filters.min &&
      (!Number.isFinite(price) || price < Number(filters.min))
    )
      return false;
    if (
      filters.currency &&
      filters.max &&
      (!Number.isFinite(price) || price > Number(filters.max))
    )
      return false;
    if (
      filters.areaMin &&
      (!Number.isFinite(area) || area < Number(filters.areaMin))
    )
      return false;
    if (
      filters.areaMax &&
      (!Number.isFinite(area) || area > Number(filters.areaMax))
    )
      return false;
    return true;
  });
  if (filters.sort === "price-asc" || filters.sort === "price-desc") {
    // Never imply an exchange rate: group by currency before comparing amounts.
    const amount = (p) =>
      p.price == null || String(p.price).trim() === "" ? NaN : Number(p.price);
    out = [...out].sort((a, b) => {
      const group = currencyCode(a.moneda).localeCompare(
        currencyCode(b.moneda),
      );
      if (group) return group;
      const left = amount(a),
        right = amount(b);
      if (!Number.isFinite(left) || !Number.isFinite(right))
        return Number(!Number.isFinite(left)) - Number(!Number.isFinite(right));
      return (
        (left - right) * (filters.sort === "price-desc" ? -1 : 1) ||
        String(a.id).localeCompare(String(b.id))
      );
    });
  } else if (filters.sort === "area-desc")
    out = [...out].sort(
      (a, b) => (Number(b.area) || 0) - (Number(a.area) || 0),
    );
  return out;
}
export function pageRange(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const sorted = [...pages]
    .filter((n) => n > 0 && n <= total)
    .sort((a, b) => a - b);
  return sorted.flatMap((n, i) =>
    i && n - sorted[i - 1] > 1 ? ["gap-" + n, n] : [n],
  );
}
