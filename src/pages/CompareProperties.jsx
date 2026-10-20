import { Link } from "react-router-dom";
import { Scale, X, ArrowUpRight } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import useProperties from "../hooks/useProperties";
import PropertyImage from "../components/PropertyImage";
import { formatPrice, propertyUrl, contactUrl } from "../config/site";
export default function CompareProperties() {
  const { compare, toggleCompare, clearCompare } = usePortal(),
    { items, loading, error, onRetry } = useProperties(),
    selected = items.filter((p) => compare.includes(String(p.id)));
  const rows = [
    ["Operación", (p) => p.status || "No disponible"],
    ["Precio", (p) => formatPrice(p.price, p.moneda)],
    ["Ubicación", (p) => p.location || "No disponible"],
    ["Dirección", (p) => p.address || "Por consultar"],
    [
      "Superficie",
      (p) => (Number(p.area) > 0 ? p.area + " m²" : "No disponible"),
    ],
    [
      "Dormitorios",
      (p) => (Number(p.bedrooms) > 0 ? p.bedrooms : "No disponible"),
    ],
    ["Baños", (p) => (Number(p.bathrooms) > 0 ? p.bathrooms : "No disponible")],
  ];
  return (
    <main className="shell section-space compare-page">
      <span className="eyebrow">DECIDE CON MÁS CLARIDAD</span>
      <h1>
        Encuentra lo que
        <br />
        <em>hace la diferencia.</em>
      </h1>
      <p className="page-description">
        Compara hasta tres inmuebles. Los precios conservan su moneda y
        operación originales; no realizamos conversiones.
      </p>
      {loading && compare.length ? (
        <p role="status">Cargando tu selección…</p>
      ) : error && compare.length ? (
        <div role="alert" className="empty-state">
          <p>{error}</p>
          <button className="button button-red" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      ) : selected.length ? (
        <>
          <div className="comparison-toolbar">
            <span>{selected.length} de 3 inmuebles</span>
            <Link className="text-link" to="/propiedades">
              Añadir otro inmueble <ArrowUpRight size={16} />
            </Link>
            <button className="text-action" onClick={clearCompare}>
              Vaciar comparación
            </button>
          </div>
          <div className="comparison-scroll">
            <table className="comparison-table">
              <caption className="sr-only">
                Comparación de características de inmuebles
              </caption>
              <thead>
                <tr>
                  <th scope="col">Tu próxima decisión</th>
                  {selected.map((p) => (
                    <th scope="col" key={p.id}>
                      <button
                        className="comparison-remove"
                        aria-label={"Quitar de comparación " + p.id}
                        onClick={() => toggleCompare(p.id)}
                      >
                        <X size={16} />
                      </button>
                      <PropertyImage src={p.image} alt={p.title} />
                      <Link to={propertyUrl(p.id)}>{p.title}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {selected.map((p) => (
                      <td key={p.id}>{value(p)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Conoce el inmueble</th>
                  {selected.map((p) => (
                    <td key={p.id}>
                      <Link
                        className="button button-dark"
                        to={propertyUrl(p.id)}
                      >
                        Ver ficha <ArrowUpRight size={14} />
                      </Link>
                      <a
                        className="comparison-contact"
                        href={contactUrl(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Consultar por WhatsApp
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="muted">
            Si un dato no está registrado, se muestra como no disponible. Tu
            selección se conserva en este navegador.
          </p>
        </>
      ) : (
        <div className="empty-state">
          <Scale />
          <h2>Dales una segunda mirada, lado a lado.</h2>
          <p>
            Usa “Comparar inmueble” en las tarjetas para añadir hasta tres
            opciones.
          </p>
          <Link className="button button-red" to="/propiedades">
            Elegir inmuebles
          </Link>
          {compare.length > 0 && (
            <button className="text-action" onClick={clearCompare}>
              Limpiar referencias no disponibles
            </button>
          )}
        </div>
      )}
    </main>
  );
}
