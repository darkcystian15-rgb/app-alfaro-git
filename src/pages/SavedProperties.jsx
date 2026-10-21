import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ArrowUpRight,
  MessageCircle,
  Scale,
  Trash2,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import useProperties from "../hooks/useProperties";
import PropertyCard from "../components/PropertyCard";
import {
  consultationText,
  selectionWhatsAppUrl,
  MAX_CONSULTATION,
} from "../services/selection";
export default function SavedProperties() {
  const { favorites, clearFavorites, toggleFavorite, compare } = usePortal();
  const { items, loading, error, onRetry } = useProperties();
  const [chosen, setChosen] = useState(null),
    [note, setNote] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const saved = favorites
    .map((id) => items.find((p) => String(p.id) === id))
    .filter(Boolean);
  const missing = favorites.filter(
    (id) => !saved.some((p) => String(p.id) === id),
  );
  const selected = saved
    .filter((p) => chosen === null || chosen.includes(String(p.id)))
    .slice(0, MAX_CONSULTATION);
  const selectedIds = selected.map((p) => String(p.id));
  const ready = !loading && !error && selected.length > 0;
  const toggleIncluded = (id) => {
    if (selectedIds.includes(id))
      setChosen(selectedIds.filter((v) => v !== id));
    else if (selected.length < MAX_CONSULTATION)
      setChosen([...selectedIds, id]);
  };
  return (
    <main className="shell section-space saved-page">
      <span className="eyebrow">TUS FAVORITOS, TU PRÓXIMO PASO</span>
      <h1>
        Mi selección.
        <br />
        <em>Conversemos sobre ella.</em>
      </h1>
      <p className="page-description">
        Guarda con el corazón, compara y reúne tus consultas en un mensaje de
        WhatsApp. Tu selección queda en este navegador, sin cuentas ni tokens;
        se pierde al borrar sus datos y no se sincroniza entre dispositivos.
      </p>
      {favorites.length > 0 && (
        <div className="selection-toolbar">
          <span aria-live="polite">
            <Heart size={17} /> {favorites.length}{" "}
            {favorites.length === 1
              ? "inmueble guardado"
              : "inmuebles guardados"}
          </span>
          <Link className="text-link" to="/propiedades">
            Seguir explorando <ArrowUpRight size={16} />
          </Link>
          <Link className="text-link" to="/comparar">
            <Scale size={17} /> Comparar ({compare.length}/3)
          </Link>
          <button className="text-action" onClick={() => setConfirmClear(true)}>
            <Trash2 size={16} /> Vaciar favoritos
          </button>
        </div>
      )}
      {confirmClear && favorites.length > 0 && (
        <div
          className="selection-confirm"
          role="group"
          aria-label="Confirmar vaciado"
        >
          <p>
            ¿Quitar todos los inmuebles guardados? Puedes volver a añadirlos con
            el corazón.
          </p>
          <button
            className="button button-red"
            onClick={() => {
              clearFavorites();
              setChosen(null);
              setConfirmClear(false);
            }}
          >
            Sí, vaciar favoritos
          </button>
          <button
            className="button button-dark"
            onClick={() => setConfirmClear(false)}
          >
            Cancelar
          </button>
        </div>
      )}
      {!favorites.length ? (
        <div className="empty-state">
          <Heart />
          <h2>Tu próxima historia puede empezar con un favorito.</h2>
          <p>Pulsa el corazón de un inmueble para encontrarlo aquí.</p>
          <Link className="button button-red" to="/propiedades">
            Explorar propiedades <ArrowUpRight size={16} />
          </Link>
        </div>
      ) : loading ? (
        <p role="status">Cargando tus inmuebles guardados…</p>
      ) : error ? (
        <div className="empty-state" role="alert">
          <p>{error}</p>
          <button className="button button-red" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      ) : (
        <div className="selection-layout">
          <section aria-label="Administrar inmuebles guardados">
            <div className="selection-list-heading">
              <h2>Tus inmuebles guardados</h2>
              <p>
                El corazón quita un favorito. La casilla decide qué inmuebles
                consultar juntos.
              </p>
            </div>
            {missing.length > 0 && (
              <div className="selection-unavailable" role="status">
                <p>
                  {missing.length}{" "}
                  {missing.length === 1
                    ? "inmueble ya no figura"
                    : "inmuebles ya no figuran"}{" "}
                  en el catálogo. No se incluirán en WhatsApp.
                </p>
                <button
                  className="text-action"
                  onClick={() => missing.forEach(toggleFavorite)}
                >
                  Quitar guardados no disponibles
                </button>
              </div>
            )}
            <div className="property-grid selection-grid">
              {saved.map((p) => (
                <div key={p.id} className="selection-item">
                  <label className="selection-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(String(p.id))}
                      disabled={
                        !selectedIds.includes(String(p.id)) &&
                        selected.length >= MAX_CONSULTATION
                      }
                      onChange={() => toggleIncluded(String(p.id))}
                    />{" "}
                    Incluir en consulta · inmueble {p.id}
                  </label>
                  <PropertyCard property={p} />
                </div>
              ))}
            </div>
          </section>
          <aside
            className="selection-consultation"
            aria-labelledby="selection-consultation-title"
          >
            <span className="eyebrow">ATENCIÓN PERSONALIZADA</span>
            <h2 id="selection-consultation-title">
              De tu selección
              <br />a una conversación.
            </h2>
            <p aria-live="polite">
              {selected.length} de {saved.length} inmuebles para consultar.
            </p>
            <p>
              Hasta {MAX_CONSULTATION} inmuebles por mensaje. Puedes preparar
              otras consultas sin borrar tus favoritos.
            </p>
            <div className="selection-batch-actions">
              <button
                className="text-action"
                onClick={() =>
                  setChosen(
                    saved.slice(0, MAX_CONSULTATION).map((p) => String(p.id)),
                  )
                }
              >
                Incluir primeros {Math.min(saved.length, MAX_CONSULTATION)}
              </button>
              <button className="text-action" onClick={() => setChosen([])}>
                Desmarcar todos
              </button>
            </div>
            <label className="selection-note">
              Añade tu consulta (opcional)
              <textarea
                rows={3}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Por ejemplo: quisiera visitar estas propiedades el sábado…"
              />
            </label>
            {ready && (
              <details className="selection-message">
                <summary>Revisar mensaje preparado</summary>
                <p>{consultationText(selected, note)}</p>
              </details>
            )}
            {ready ? (
              <a
                className="button button-red selection-whatsapp"
                href={selectionWhatsAppUrl(selected, note)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} /> Consultar mi selección por WhatsApp{" "}
                <ArrowUpRight size={16} />
              </a>
            ) : (
              <p role="status">
                Marca al menos un inmueble disponible para preparar tu consulta.
              </p>
            )}
            <small>
              WhatsApp se abre cuando pulses el botón. Tú revisas y envías el
              mensaje; el portal no lo envía automáticamente. Tu nota no se
              guarda.
            </small>
          </aside>
        </div>
      )}
    </main>
  );
}
