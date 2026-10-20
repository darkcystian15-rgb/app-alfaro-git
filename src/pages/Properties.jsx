import React, { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import ResultsGrid from "../components/ResultsGrid";
import { fetchProperties } from "../services/properties";
export default function Properties() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError("");
    fetchProperties({}, { signal: c.signal })
      .then(setItems)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [retry]);
  return (
    <PageWrapper>
      <main className="alfaro-page">
        <div className="alfaro-section pb-0">
          <p className="alfaro-eyebrow">CATÁLOGO ALFARO</p>
          <h1 className="alfaro-heading">Encuentra tu próximo inmueble</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Explora inmuebles en venta y alquiler de nuestro catálogo
            actualizado.
          </p>
        </div>
        <ResultsGrid
          title="Todas las propiedades"
          properties={items}
          loading={loading}
          error={error}
          onRetry={() => setRetry((v) => v + 1)}
        />
      </main>
    </PageWrapper>
  );
}
