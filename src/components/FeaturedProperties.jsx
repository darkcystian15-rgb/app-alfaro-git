import React, { useEffect, useState } from "react";
import PropertyCard from "./PropertyCard";
import { fetchProperties } from "../services/properties";

export default function FeaturedProperties() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchProperties({ featured: "true" }, { signal: controller.signal })
      .then(setItems)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  return (
    <section className="alfaro-section" aria-labelledby="destacados-title">
      <div className="mb-7">
        <p className="alfaro-eyebrow">SELECCIÓN INMOBILIARIA</p>
        <h2 id="destacados-title" className="alfaro-heading">
          Propiedades destacadas
        </h2>
        <p className="mt-2 text-slate-600">
          Oportunidades para vivir, invertir o hacer crecer tu negocio.
        </p>
      </div>
      {loading ? (
        <p role="status" className="py-10 text-center text-slate-500">
          Cargando propiedades destacadas…
        </p>
      ) : error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-6 text-red-800">
          {error}{" "}
          <button onClick={() => setRetry((v) => v + 1)} className="underline">
            Reintentar
          </button>
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-slate-600">
          Pronto tendremos nuevas propiedades destacadas.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((item) => (
            <PropertyCard key={item.id} property={item} />
          ))}
        </div>
      )}
    </section>
  );
}
