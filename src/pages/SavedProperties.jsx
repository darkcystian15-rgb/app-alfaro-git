import { Link } from "react-router-dom";
import { Heart, ArrowUpRight } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import useProperties from "../hooks/useProperties";
import ResultsGrid from "../components/ResultsGrid";
export default function SavedProperties() {
  const { favorites } = usePortal(),
    { items, loading, error, onRetry } = useProperties();
  const saved = items.filter((p) => favorites.includes(String(p.id)));
  return (
    <main className="shell section-space saved-page">
      <span className="eyebrow">TU SELECCIÓN PERSONAL</span>
      <h1>
        Los espacios que
        <br />
        <em>te imaginas tuyos.</em>
      </h1>
      <p className="page-description">
        Tus favoritos se guardan en este navegador, sin necesidad de crear una
        cuenta.
      </p>
      {favorites.length ? (
        <ResultsGrid
          title="Tus inmuebles guardados"
          properties={saved}
          loading={loading}
          error={error}
          onRetry={onRetry}
          pageSize={Math.max(saved.length, 9)}
        />
      ) : (
        <div className="empty-state">
          <Heart />
          <h2>Tu próxima historia puede empezar con un favorito.</h2>
          <p>Pulsa el corazón de un inmueble para encontrarlo aquí.</p>
          <Link className="button button-red" to="/propiedades">
            Explorar propiedades <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </main>
  );
}
