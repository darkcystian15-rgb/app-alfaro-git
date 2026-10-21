import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import useCarouselPlayback from "../hooks/useCarouselPlayback";
import useProperties from "../hooks/useProperties";
import PropertyCard from "./PropertyCard";
import { LoadingCards } from "./ResultsGrid";
export default function FeaturedProperties() {
  const { items, loading, error, onRetry } = useProperties({
      featured: "true",
    }),
    ref = useRef(null);
  const { paused, setPaused, playing, interaction } = useCarouselPlayback();
  const move = (direction) => {
    const track = ref.current;
    if (!track) return;
    const end = track.scrollWidth - track.clientWidth;
    const target =
      direction > 0 && track.scrollLeft >= end - 4
        ? 0
        : direction < 0 && track.scrollLeft <= 4
          ? end
          : Math.max(
              0,
              Math.min(
                end,
                track.scrollLeft + direction * (track.clientWidth + 24),
              ),
            );
    track.scrollTo({
      left: target,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };
  useEffect(() => {
    if (!playing || loading || error || items.length < 2) return;
    const timer = setInterval(() => move(1), 6500);
    return () => clearInterval(timer);
  }, [playing, loading, error, items.length]);
  return (
    <section
      className="featured-section section-space shell"
      aria-labelledby="destacados-title"
      aria-roledescription="carrusel"
      {...interaction}
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
            <button
              aria-label={
                paused ? "Reproducir destacados" : "Pausar destacados"
              }
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              aria-label="Destacados anteriores"
              onClick={() => {
                setPaused(true);
                move(-1);
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              aria-label="Destacados siguientes"
              onClick={() => {
                setPaused(true);
                move(1);
              }}
            >
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
          onPointerDown={() => setPaused(true)}
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
