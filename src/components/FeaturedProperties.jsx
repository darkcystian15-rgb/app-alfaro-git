import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import useProperties from "../hooks/useProperties";
import PropertyCard from "./PropertyCard";
import { LoadingCards } from "./ResultsGrid";
export default function FeaturedProperties() {
  const { items, loading, error, onRetry } = useProperties({
      featured: "true",
    }),
    ref = useRef(null);
  const move = (direction) =>
    ref.current?.scrollBy({
      left: direction * (ref.current.clientWidth + 24),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  return (
    <section
      className="featured-section section-space shell"
      aria-labelledby="destacados-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">UNA SELECCIÓN PARA TI</span>
          <h2 id="destacados-title">
            Espacios que merecen
            <br />
            <em>una segunda mirada.</em>
          </h2>
        </div>
        <div className="section-heading-actions">
          <Link className="text-link" to="/propiedades?featured=true">
            Ver todos los destacados <ArrowUpRight size={17} />
          </Link>
          <div className="carousel-controls">
            <button aria-label="Destacados anteriores" onClick={() => move(-1)}>
              <ArrowLeft size={18} />
            </button>
            <button aria-label="Destacados siguientes" onClick={() => move(1)}>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
      {loading ? (
        <LoadingCards />
      ) : error ? (
        <div className="empty-state" role="alert">
          <p>{error}</p>
          <button className="button button-dark" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      ) : items.length ? (
        <div
          className="featured-track"
          ref={ref}
          aria-label="Carrusel de propiedades destacadas"
          tabIndex={0}
        >
          {items.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <p className="empty-state">
          Pronto tendremos nuevas propiedades destacadas.
        </p>
      )}
    </section>
  );
}
