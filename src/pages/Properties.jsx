import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { X, SlidersHorizontal } from "lucide-react";
import SearchBanner from "../components/SearchBanner";
import ResultsGrid from "../components/ResultsGrid";
import useProperties from "../hooks/useProperties";
import {
  readFilters,
  filterParams,
  refineProperties,
} from "../services/catalog-model";
export default function Properties() {
  const [params, setParams] = useSearchParams(),
    filters = readFilters(params),
    page = Math.max(1, Math.floor(Number(params.get("page"))) || 1),
    key = params.toString(),
    ref = useRef(null);
  const requestFilters = Object.fromEntries(
      ["location", "title", "status", "featured"].map((k) => [k, filters[k]]),
    ),
    { items, loading, error, onRetry } = useProperties(requestFilters),
    results = useMemo(() => refineProperties(items, filters), [items, key]);
  const update = (next) => setParams(filterParams(next));
  const pageChange = (n) => {
    const next = new URLSearchParams(params);
    next.set("page", n);
    setParams(next, { preventScrollReset: true, state: { keepScroll: true } });
    ref.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };
  const labels = {
    location: "Ubicación",
    status: "Operación",
    title: "Tipo",
    currency: "Moneda",
    min: "Desde",
    max: "Hasta",
    areaMin: "Área desde",
    areaMax: "Área hasta",
    featured: "Destacados",
  };
  return (
    <main className="catalog-page">
      <section className="catalog-intro shell">
        <div>
          <span className="eyebrow">TU PRÓXIMO ESPACIO</span>
          <h1>
            Encuentra un lugar
            <br />
            <em>a tu medida.</em>
          </h1>
        </div>
        <p>
          Para vivir, emprender o invertir.
          <br />
          Explora nuestro catálogo y elige con calma.
        </p>
      </section>
      <div className="shell catalog-search">
        <SearchBanner compact initialFilters={filters} onSearch={update} />
      </div>
      <div className="shell section-space" ref={ref}>
        <div className="catalog-toolbar">
          <div className="filter-chips">
            {Object.entries(labels)
              .filter(([k]) => filters[k])
              .map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => update({ ...filters, [k]: "" })}
                  aria-label={`Quitar filtro ${label}`}
                >
                  {label}: {k === "featured" ? "Sí" : filters[k]}
                  <X size={12} />
                </button>
              ))}
            {Object.keys(labels).some((k) => filters[k]) && (
              <button className="clear-filters" onClick={() => update({})}>
                Limpiar todo
              </button>
            )}
          </div>
          <label className="sort-control">
            <SlidersHorizontal size={15} />
            <span className="sr-only">Ordenar inmuebles</span>
            <select
              aria-label="Ordenar inmuebles"
              value={filters.sort}
              onChange={(e) => update({ ...filters, sort: e.target.value })}
            >
              <option value="">Más recientes</option>
              <option value="price-asc">Menor precio por moneda</option>
              <option value="price-desc">Mayor precio por moneda</option>
              <option value="area-desc">Mayor superficie</option>
            </select>
          </label>
        </div>
        {filters.sort.startsWith("price") && !filters.currency && (
          <p className="currency-note">
            Los precios se agrupan por moneda. No se convierten soles y dólares.
          </p>
        )}
        <ResultsGrid
          title={
            filters.featured
              ? "Propiedades destacadas"
              : "Inmuebles disponibles"
          }
          properties={results}
          loading={loading}
          error={error}
          onRetry={onRetry}
          page={page}
          onPageChange={pageChange}
        />
      </div>
    </main>
  );
}
