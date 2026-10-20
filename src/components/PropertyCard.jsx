import { Link, useLocation } from "react-router-dom";
import {
  MapPin,
  ArrowUpRight,
  MessageCircle,
  Heart,
  Scale,
  Ruler,
  BedDouble,
  Bath,
} from "lucide-react";
import { contactUrl, formatPrice, propertyUrl } from "../config/site";
import { usePortal } from "../context/PortalContext";
import PropertyImage from "./PropertyImage";
export default function PropertyCard({ property: item, ...legacyProps }) {
  const p = item || legacyProps,
    { favorites, compare, toggleFavorite, toggleCompare } = usePortal(),
    location = useLocation();
  const saved = favorites.includes(String(p.id)),
    selected = compare.includes(String(p.id));
  const state = {
    from: location.pathname + location.search,
    scroll: window.scrollY,
  };
  return (
    <article className="property-card alfaro-property-card">
      <div className="card-visual">
        <Link
          to={propertyUrl(p.id)}
          state={state}
          aria-label={"Ver " + p.title}
        >
          <PropertyImage src={p.image} alt={p.title} />
        </Link>
        <span className="operation-label">
          {p.status || "Inmueble"}
          {p.destacado === 1 || p.destacado === "1" ? <i>· Destacado</i> : null}
        </span>
        <button
          type="button"
          className={"save-button " + (saved ? "is-saved" : "")}
          aria-pressed={saved}
          aria-label={`${saved ? "Quitar de favoritos" : "Guardar inmueble"} ${p.id}`}
          onClick={() => toggleFavorite(p.id)}
        >
          <Heart size={19} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-body">
        <div className="card-price">
          {formatPrice(p.price, p.moneda)}
          <span>{/alquil/i.test(p.status || "") ? " / mes" : ""}</span>
        </div>
        <Link to={propertyUrl(p.id)} state={state} className="card-title">
          {p.title || "Inmueble disponible"}
        </Link>
        <p className="card-address">{p.address || "Dirección por consultar"}</p>
        <p className="card-location">
          <MapPin size={14} />
          {p.location || "Ubicación por confirmar"}
        </p>
        <div className="card-features">
          {Number(p.area) > 0 && (
            <span>
              <Ruler size={15} />
              {Number(p.area).toLocaleString("es-PE")} m²
            </span>
          )}
          {Number(p.bedrooms) > 0 && (
            <span>
              <BedDouble size={15} />
              {p.bedrooms} dorm.
            </span>
          )}
          {Number(p.bathrooms) > 0 && (
            <span>
              <Bath size={15} />
              {p.bathrooms} baños
            </span>
          )}
        </div>
        <div className="card-actions">
          <Link
            className="button button-dark"
            to={propertyUrl(p.id)}
            state={state}
          >
            Ver ficha <ArrowUpRight size={16} />
          </Link>
          <a
            className="button button-outline"
            href={contactUrl(p)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} /> Contactar
          </a>
        </div>
        <button
          type="button"
          className={"compare-toggle " + (selected ? "is-selected" : "")}
          aria-pressed={selected}
          onClick={() => toggleCompare(p.id)}
        >
          <Scale size={15} />
          {selected ? "Añadido a comparación" : "Comparar inmueble"}
        </button>
      </div>
    </article>
  );
}
