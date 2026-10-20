import React, { useEffect, useState } from "react";
import PropertyCard from "./PropertyCard";

const PAGE_SIZE = 9;
export default function ResultsGrid({
  properties = [],
  loading = false,
  error = "",
  onRetry,
  title = "Inmuebles disponibles",
}) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [properties]);
  const totalPages = Math.ceil(properties.length / PAGE_SIZE);
  const visible = properties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <section aria-label={title} className="alfaro-section" aria-live="polite">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="alfaro-eyebrow">EXPLORA ALFARO</p>
          <h2 className="alfaro-heading">{title}</h2>
        </div>
        {!loading && !error && (
          <p className="text-sm font-medium text-slate-500">
            {properties.length}{" "}
            {properties.length === 1 ? "inmueble" : "inmuebles"} encontrados
          </p>
        )}
      </div>
      {loading ? (
        <div
          role="status"
          className="rounded-2xl border bg-white p-10 text-center text-slate-600"
        >
          Cargando inmuebles…
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800"
        >
          {error}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-3 underline font-semibold"
            >
              Reintentar
            </button>
          )}
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-slate-600">
          No encontramos inmuebles para esos filtros. Prueba otra búsqueda.
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav
              aria-label="Paginación de propiedades"
              className="mt-9 flex items-center justify-center gap-4"
            >
              <button
                className="alfaro-page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span className="text-sm font-semibold text-slate-600">
                Página {page} de {totalPages}
              </span>
              <button
                className="alfaro-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
