import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  Car,
  Heart,
  Scale,
  MessageCircle,
  Share2,
  Download,
  Check,
  ArrowUpRight,
  House,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import PropertyGallery from "../components/PropertyGallery";
import FeaturedProperties from "../components/FeaturedProperties";
import { usePortal } from "../context/PortalContext";
import {
  absolutePropertyUrl,
  contactUrl,
  formatPrice,
  shareImageUrl,
  SITE_URL,
} from "../config/site";
const safeHtml = (value) =>
  DOMPurify.sanitize(String(value || ""), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "input", "iframe"],
    FORBID_ATTR: ["style"],
  });
export default function PropertyResumenPage() {
  const { id } = useParams(),
    location = useLocation(),
    { favorites, compare, toggleFavorite, toggleCompare } = usePortal(),
    [data, setData] = useState(null),
    [info, setInfo] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [pdfBusy, setPdfBusy] = useState(false),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    Promise.all([
      fetch("/api/getPropertyDetails?id=" + encodeURIComponent(id), {
        signal: c.signal,
      }).then(async (r) => {
        if (!r.ok)
          throw Error(
            r.status === 404
              ? "Este inmueble no está disponible."
              : "No pudimos cargar la ficha. Inténtalo nuevamente.",
          );
        const d = await r.json();
        if (!d?.property?.id) throw Error("La ficha no está disponible.");
        return d;
      }),
      fetch("/api/getPropertyDetailInfo?id=" + encodeURIComponent(id), {
        signal: c.signal,
      })
        .then((r) => (r.ok ? r.json() : []))
        .catch((e) => {
          if (e.name === "AbortError") throw e;
          return [];
        }),
    ])
      .then(([d, i]) => {
        if (!c.signal.aborted) {
          setData(d);
          setInfo(Array.isArray(i) ? i : []);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            e.message.startsWith("Este inmueble")
              ? e.message
              : "No pudimos cargar la ficha. Inténtalo nuevamente.",
          );
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [id, retry]);
  const back =
    location.state?.from?.startsWith("/") &&
    !location.state.from.startsWith("//")
      ? location.state.from
      : "/propiedades";
  const goBack = (
    <Link
      className="text-link back-link"
      to={back}
      state={{ restoreScroll: location.state?.scroll || 0 }}
    >
      <ArrowLeft size={16} /> Volver a los inmuebles
    </Link>
  );
  if (loading)
    return (
      <main className="shell section-space detail-loading">
        {goBack}
        <div className="detail-skeleton" role="status">
          Cargando ficha del inmueble…
        </div>
      </main>
    );
  if (error || !data)
    return (
      <main className="shell section-space">
        {goBack}
        <div className="empty-state" role="alert">
          <House />
          <h1>{error || "Inmueble no disponible"}</h1>
          <button
            className="button button-red"
            onClick={() => setRetry((x) => x + 1)}
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  const p = data.property,
    saved = favorites.includes(String(id)),
    selected = compare.includes(String(id));
  const specs = [
    {
      Icon: Ruler,
      label: "Área de terreno",
      value:
        Number(p.area) > 0
          ? `${Number(p.area).toLocaleString("es-PE")} m²`
          : null,
    },
    {
      Icon: Ruler,
      label: "Área construida",
      value:
        Number(p.area_c) > 0
          ? `${Number(p.area_c).toLocaleString("es-PE")} m²`
          : null,
    },
    {
      Icon: BedDouble,
      label: /hotel|local/i.test(p.title) ? "Habitaciones" : "Dormitorios",
      value: Number(p.bedrooms) > 0 ? p.bedrooms : null,
    },
    {
      Icon: Bath,
      label: "Baños",
      value: Number(p.bathrooms) > 0 ? p.bathrooms : null,
    },
    {
      Icon: Car,
      label: "Cocheras",
      value: Number(p.cocheras) > 0 ? p.cocheras : null,
    },
    {
      Icon: Ruler,
      label: "Frente",
      value:
        Number(p.frontera || p.frente) > 0
          ? `${p.frontera || p.frente} m`
          : null,
    },
    {
      Icon: Ruler,
      label: "Largo",
      value: Number(p.Largo || p.largo) > 0 ? `${p.Largo || p.largo} m` : null,
    },
    {
      Icon: Ruler,
      label: "Cerco perimétrico",
      value:
        Number(p.cerco_perimetrico) > 0 ? `${p.cerco_perimetrico} ml` : null,
    },
    {
      Icon: House,
      label: "Antigüedad",
      value: p.antiguedad && p.antiguedad !== "cero" ? p.antiguedad : null,
    },
  ].filter((s) => s.value != null);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(absolutePropertyUrl(id));
      setCopied(true);
      toast.success("Enlace de la ficha copiado");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast("Puedes compartir el enlace desde la barra de tu navegador.");
    }
  };
  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const { generatePropertyPdf } = await import("../utils/pdfGenerator");
      await generatePropertyPdf(p, data.subProperties || []);
    } catch {
      toast.error("No pudimos preparar el PDF. Inténtalo nuevamente.");
    } finally {
      setPdfBusy(false);
    }
  };
  return (
    <main className="detail-page">
      <Helmet>
        <title>{p.title} · Alberto Alfaro</title>
        <meta
          name="description"
          content={`${formatPrice(p.price, p.moneda)} · ${p.location || ""} · Consulta este inmueble con Alberto Alfaro.`}
        />
        <link rel="canonical" href={absolutePropertyUrl(id)} />
        <meta
          property="og:title"
          content={`${p.title} · ${formatPrice(p.price, p.moneda)}`}
        />
        <meta
          property="og:description"
          content={p.location || "Inmobiliaria Alberto Alfaro"}
        />
        <meta property="og:image" content={SITE_URL + shareImageUrl(id)} />
        <meta property="og:url" content={absolutePropertyUrl(id)} />
      </Helmet>
      <div className="shell detail-top">
        {goBack}
        <div className="detail-top-actions">
          <button
            onClick={() => toggleFavorite(id)}
            aria-pressed={saved}
            className="button button-outline"
          >
            <Heart size={16} fill={saved ? "currentColor" : "none"} />
            {saved ? "Guardado" : "Guardar"}
          </button>
          <button className="button button-outline" onClick={share}>
            {copied ? <Check size={16} /> : <Share2 size={16} />}Compartir
          </button>
        </div>
      </div>
      <div className="shell detail-layout">
        <div className="detail-main">
          <div className="detail-heading">
            <span className="eyebrow">
              {p.status || "INMUEBLE"} · {p.location || "CATÁLOGO ALFARO"}
            </span>
            <h1>{p.title}</h1>
            <p>
              <MapPin size={16} />
              {p.address || "Dirección por consultar"}
              {p.location && <span> · {p.location}</span>}
            </p>
          </div>
          <PropertyGallery data={data} />
          <section className="detail-section">
            <span className="eyebrow">CONOCE EL ESPACIO</span>
            <h2>Los detalles hacen la diferencia.</h2>
            {specs.length ? (
              <div className="detail-specs">
                {specs.map(({ Icon, label, value }) => (
                  <div key={label}>
                    <Icon size={22} />
                    <b>{value}</b>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                Consulta con nuestro equipo las características de este
                inmueble.
              </p>
            )}
          </section>
          {p.description && (
            <section className="detail-section">
              <h2>Un poco más sobre este inmueble</h2>
              <div
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: safeHtml(p.description) }}
              />
            </section>
          )}
          {p.distribution && (
            <section className="detail-section">
              <h2>Distribución</h2>
              <div
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: safeHtml(p.distribution) }}
              />
            </section>
          )}
          {/alquil/i.test(p.status || "") &&
            (Number(p.adelanto) > 0 || Number(p.garantia) > 0) && (
              <section className="detail-section rental-conditions">
                <Info size={21} />
                <div>
                  <h2>Condiciones de alquiler</h2>
                  {Number(p.adelanto) > 0 && (
                    <p>
                      Adelanto: {p.adelanto}{" "}
                      {Number(p.adelanto) === 1 ? "mes" : "meses"}
                    </p>
                  )}
                  {Number(p.garantia) > 0 && (
                    <p>
                      Garantía: {p.garantia}{" "}
                      {Number(p.garantia) === 1 ? "mes" : "meses"}
                    </p>
                  )}
                </div>
              </section>
            )}
          {info.length > 0 && (
            <section className="detail-section">
              <h2>Información adicional</h2>
              {info.map((it) => (
                <details className="info-accordion" key={it.id}>
                  <summary>{it.titulo_info}</summary>
                  <div
                    className="rich-content"
                    dangerouslySetInnerHTML={{
                      __html: safeHtml(it.descripcion_info),
                    }}
                  />
                </details>
              ))}
            </section>
          )}
          {p.latitude != null &&
            p.longitude != null &&
            p.map_mode !== 'none' &&
            Number.isFinite(Number(p.latitude)) &&
            Number.isFinite(Number(p.longitude)) && (
              <section className="detail-section">
                <h2>{p.map_mode==='approximate'?'Ubicación aproximada':'Ubicación'}</h2>{p.map_mode==='approximate'&&<p>El punto indica una zona referencial, no la dirección exacta del inmueble.</p>}
                <iframe
                  className="property-map"
                  title="Mapa de la propiedad"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${Number(p.latitude)},${Number(p.longitude)}&z=16&output=embed`}
                />
              </section>
            )}
          <section className="detail-section share-downloads">
            <h2>Llévate los detalles</h2>
            <p>Guarda la ficha o compártela con quien está buscando contigo.</p>
            <div>
              <button
                className="button button-dark"
                onClick={downloadPdf}
                disabled={pdfBusy}
              >
                <Download size={16} />
                {pdfBusy ? "Preparando PDF…" : "Descargar ficha PDF"}
              </button>
              <a
                className="button button-outline"
                href={shareImageUrl(id, true)}
                download
              >
                <Download size={16} /> Descargar tarjeta JPG
              </a>
              <a
                className="button button-outline"
                href={
                  "https://wa.me/?text=" +
                  encodeURIComponent(p.title + " " + absolutePropertyUrl(id))
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Share2 size={16} /> Compartir por WhatsApp
              </a>
            </div>
          </section>
        </div>
        <aside className="detail-contact">
          <div className="contact-panel">
            <span className="eyebrow">TU PRÓXIMO ESPACIO</span>
            <p className="detail-price">{formatPrice(p.price, p.moneda)}</p>
            {/alquil/i.test(p.status || "") && (
              <span className="muted">Precio mensual</span>
            )}
            <div className="contact-divider" />
            <h2>¿Te imaginas aquí?</h2>
            <p>
              Conversemos sobre este inmueble. Nuestro equipo te ayudará con los
              detalles y la coordinación de una visita.
            </p>
            <a
              className="button button-red"
              href={contactUrl(p)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={18} /> Consultar por WhatsApp{" "}
              <ArrowUpRight size={16} />
            </a>
            <a className="button button-outline" href="tel:+51940221494">
              Llamar al +51 940 221 494
            </a>
            <button
              className="compare-toggle"
              aria-pressed={selected}
              onClick={() => toggleCompare(id)}
            >
              <Scale size={16} />
              {selected ? "Añadido a comparación" : "Comparar este inmueble"}
            </button>
            <small>Referencia del inmueble: {p.id}</small>
          </div>
          <div className="detail-brand-note">
            <House size={25} />
            <p>
              Personas detrás
              <br />
              <b>de cada espacio.</b>
            </p>
            <Link to="/asesores">
              Conoce al equipo <ArrowRightIcon />
            </Link>
          </div>
        </aside>
      </div>
      <FeaturedProperties />
      <div className="detail-mobile-contact">
        <span>{formatPrice(p.price, p.moneda)}</span>
        <a
          className="button button-red"
          href={contactUrl(p)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={17} /> Consultar
        </a>
      </div>
    </main>
  );
}
function ArrowRightIcon() {
  return <ArrowUpRight size={15} />;
}
