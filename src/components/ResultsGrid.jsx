import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, SearchX, RotateCw } from "lucide-react";
import PropertyCard from "./PropertyCard";
import { pageRange } from "../services/catalog-model";
export function LoadingCards() {
  return (
    <div
      className="property-grid"
      role="status"
      aria-label="Cargando inmuebles"
    >
      {Array.from({ length: 3 }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export default function ResultsGrid({
  properties = [],
  loading = false,
  error = "",
  onRetry,
  title = "Inmuebles disponibles",
  page = 1,
  onPageChange = () => {},
  pageSize = 9,
  emptyAction = true,
}) {
  const total = Math.ceil(properties.length / pageSize),
    safePage = Math.min(Math.max(1, page), Math.max(1, total)),
    visible = properties.slice((safePage - 1) * pageSize, safePage * pageSize);
  return (
    <section className="results-section" aria-label={title} aria-live="polite">
      <div className="results-heading">
        <h2>{title}</h2>
        {!loading && !error && (
          <span>
            {properties.length}{" "}
            {properties.length === 1
              ? "inmueble encontrado"
              : "inmuebles encontrados"}
          </span>
        )}
      </div>
      {loading ? (
        <LoadingCards />
      ) : error ? (
        <div role="alert" className="empty-state">
          <RotateCw />
          <h3>No pudimos cargar el catálogo</h3>
          <p>{error}</p>
          {onRetry && (
            <button className="button button-red" onClick={onRetry}>
              Reintentar
            </button>
          )}
        </div>
      ) : !properties.length ? (
        <div className="empty-state">
          <SearchX />
          <h3>No encontramos inmuebles para esos filtros</h3>
          <p>
            Amplía la ubicación o ajusta los filtros para explorar más opciones.
          </p>
          {emptyAction && (
            <Link className="button button-dark" to="/propiedades">
              Ver todos los inmuebles
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="property-grid">
            {visible.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
          {total > 1 && (
            <nav className="pagination" aria-label="Paginación de propiedades">
              <button
                aria-label="Página anterior"
                disabled={safePage === 1}
                onClick={() => onPageChange(safePage - 1)}
              >
                <ArrowLeft size={16} />
              </button>
              {pageRange(safePage, total).map((p) =>
                typeof p === "number" ? (
                  <button
                    key={p}
                    aria-label={`Página ${p}`}
                    aria-current={p === safePage ? "page" : undefined}
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={p}>…</span>
                ),
              )}
              <button
                aria-label="Página siguiente"
                disabled={safePage === total}
                onClick={() => onPageChange(safePage + 1)}
              >
                <ArrowRight size={16} />
              </button>
              <span className="pagination-detail">
                Página {safePage} de {total}
              </span>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
