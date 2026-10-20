import React, { useEffect, useRef, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import SearchBanner from "../components/SearchBanner";
import ResultsGrid from "../components/ResultsGrid";
import FeaturedProperties from "../components/FeaturedProperties";
import SocialMediaCallToAction from "../components/SocialMediaCallToAction";
import ContactForm from "../components/ContactForm";
import { fetchProperties } from "../services/properties";
export default function Home() {
  const [filters, setFilters] = useState(null),
    [results, setResults] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const resultsRef = useRef(null);
  useEffect(() => {
    if (!filters) return;
    const c = new AbortController();
    setLoading(true);
    setError("");
    fetchProperties(filters, { signal: c.signal })
      .then((items) => {
        if (c.signal.aborted) return;
        setResults(items);
        requestAnimationFrame(() =>
          resultsRef.current?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
            block: "start",
          }),
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [filters, retry]);
  return (
    <PageWrapper>
      <main className="alfaro-page">
        <SearchBanner onSearch={setFilters} />
        {filters && (
          <div ref={resultsRef} className="scroll-mt-24">
            <ResultsGrid
              properties={results}
              title="Resultados de tu búsqueda"
              loading={loading}
              error={error}
              onRetry={() => setRetry((x) => x + 1)}
            />
          </div>
        )}
        <FeaturedProperties />
        <div id="redes" className="alfaro-section">
          <SocialMediaCallToAction />
        </div>
        <section className="alfaro-section" id="contacto">
          <div className="grid gap-8 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-2 md:p-12">
            <div>
              <p className="alfaro-eyebrow">ATENCIÓN PERSONALIZADA</p>
              <h2 className="alfaro-heading">
                Hablemos de tu próximo inmueble
              </h2>
              <p className="mt-4 text-slate-600">
                Te asesoramos para vender, alquilar o encontrar una propiedad
                que se adapte a tus necesidades.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
    </PageWrapper>
  );
}
