import { Link, useLocation } from "react-router-dom";
import { Scale, X, ArrowRight } from "lucide-react";
import { usePortal } from "../context/PortalContext";
export default function CompareDock() {
  const { compare, clearCompare } = usePortal(),
    location = useLocation();
  if (!compare.length || location.pathname === "/comparar") return null;
  return (
    <aside className="compare-dock" aria-label="Inmuebles para comparar">
      <Scale size={20} />
      <span>
        <b>{compare.length} de 3</b> para comparar
      </span>
      <Link className="button button-red" to="/comparar">
        Comparar <ArrowRight size={15} />
      </Link>
      <button
        type="button"
        className="icon-button"
        aria-label="Vaciar comparación"
        onClick={clearCompare}
      >
        <X size={17} />
      </button>
    </aside>
  );
}
