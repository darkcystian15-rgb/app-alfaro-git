import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  MapPin,
  Building2,
  Ruler,
  Handshake,
  ChevronRight,
} from "lucide-react";
import useCarouselPlayback from "../hooks/useCarouselPlayback";
import SearchBanner from "../components/SearchBanner";
import FeaturedProperties from "../components/FeaturedProperties";
import ContactForm from "../components/ContactForm";
import SocialMediaCallToAction from "../components/SocialMediaCallToAction";
import useProperties from "../hooks/useProperties";
import { filterParams } from "../services/catalog-model";
const scenes = [
  { image: "/portal/hero-living.webp", label: "Espacios para vivir" },
  { image: "/portal/hero-spaces.webp", label: "Lugares para crecer" },
  { image: "/portal/hero-beginnings.webp", label: "Nuevos comienzos" },
];
export default function Home() {
  const [slide, setSlide] = useState(0),
    { items } = useProperties();
  const { paused, setPaused, playing, interaction } = useCarouselPlayback();
  const touchStart = useRef(null);
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(
      () => setSlide((i) => (i + 1) % scenes.length),
      7000,
    );
    return () => clearInterval(interval);
  }, [playing]);
  const locations = Object.entries(
    items.reduce((acc, p) => {
      if (p.location) acc[p.location] = (acc[p.location] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  return (
    <main>
      <section className="home-hero">
        <div className="shell hero-composition">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" />
              INMOBILIARIA ALBERTO ALFARO
            </span>
            <h1>
              Hay lugares.
              <br />Y está <em>tu lugar.</em>
            </h1>
            <p>
              Un hogar para empezar. Un espacio para tu negocio. Una oportunidad
              para invertir. Encuéntralo con nosotros.
            </p>
            <div className="hero-intents">
              <Link to="/propiedades?status=Venta">
                Quiero comprar <ArrowUpRight size={16} />
              </Link>
              <Link to="/propiedades?status=Alquiler">
                Busco alquilar <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="hero-note">
              <span className="small-brand-rule" />
              <span>
                Conectamos personas
                <br />
                <b>con su próximo espacio.</b>
              </span>
            </div>
          </div>
          <div
            className="hero-media"
            {...interaction}
            aria-roledescription="carrusel"
            aria-label="Imágenes de portada"
          >
            <div
              className="hero-photo-stack"
              onTouchStart={(e) => {
                touchStart.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                };
                setPaused(true);
              }}
              onTouchEnd={(e) => {
                if (touchStart.current === null) return;
                const delta =
                  e.changedTouches[0].clientX - touchStart.current.x;
                const vertical =
                  e.changedTouches[0].clientY - touchStart.current.y;
                touchStart.current = null;
                if (
                  Math.abs(delta) > 40 &&
                  Math.abs(delta) > Math.abs(vertical)
                )
                  setSlide(
                    (i) =>
                      (i + (delta < 0 ? 1 : scenes.length - 1)) % scenes.length,
                  );
              }}
            >
              {scenes.map((scene, i) => (
                <img
                  key={scene.image}
                  src={scene.image}
                  alt={scene.label + " · imagen de inspiración"}
                  className={i === slide ? "active" : ""}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ))}
            </div>
            <div className="hero-photo-label">
              <span>ALFARO / {String(slide + 1).padStart(2, "0")}</span>
              <b>{scenes[slide].label}</b>
            </div>
            <div className="hero-navigation">
              <button
                aria-label="Imagen anterior"
                onClick={() => {
                  setPaused(true);
                  setSlide((i) => (i + scenes.length - 1) % scenes.length);
                }}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="hero-dots">
                {scenes.map((s, i) => (
                  <button
                    key={s.image}
                    aria-label={"Ver imagen " + (i + 1)}
                    aria-current={i === slide ? "true" : undefined}
                    onClick={() => {
                      setPaused(true);
                      setSlide(i);
                    }}
                  />
                ))}
              </div>
              <button
                aria-label={paused ? "Reproducir portada" : "Pausar portada"}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button
                aria-label="Imagen siguiente"
                onClick={() => {
                  setPaused(true);
                  setSlide((i) => (i + 1) % scenes.length);
                }}
              >
                <ArrowRight size={16} />
              </button>
            </div>
            <span className="hero-vertical">
              ESPACIOS · PERSONAS · POSIBILIDADES
            </span>
          </div>
        </div>
        <div className="shell hero-search">
          <SearchBanner />
        </div>
      </section>
      <div className="discovery-strip">
        <div className="shell">
          <span>
            Un nuevo comienzo, <b>muchas posibilidades.</b>
          </span>
          <Link to="/propiedades">
            Explora todo el catálogo <ArrowRight size={17} />
          </Link>
        </div>
      </div>
      <FeaturedProperties />
      <section className="locations-section section-space">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CERCA DE LO QUE IMPORTA</span>
              <h2>
                ¿Dónde te gustaría
                <br />
                <em>estar?</em>
              </h2>
            </div>
            <p>
              Encuentra oportunidades
              <br />
              en las ubicaciones de nuestro catálogo.
            </p>
          </div>
          <div className="location-grid">
            {locations.map(([name, count], i) => (
              <Link
                key={name}
                to={"/propiedades?" + filterParams({ location: name })}
                className={"location-tile location-tile-" + i}
              >
                <span className="location-number">0{i + 1}</span>
                <MapPin size={24} />
                <div>
                  <h3>{name}</h3>
                  <p>
                    {count} {count === 1 ? "inmueble" : "inmuebles"} en catálogo
                  </p>
                </div>
                <ArrowUpRight size={22} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section-space shell services-preview">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TE ACOMPAÑAMOS EN CADA PASO</span>
            <h2>
              Mucho más que
              <br />
              <em>encontrar una propiedad.</em>
            </h2>
          </div>
          <Link className="text-link" to="/servicios">
            Nuestros servicios <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="service-preview-grid">
          {[
            {
              Icon: Building2,
              n: "01",
              title: "Compra, venta y alquiler",
              text: "Conectamos tu necesidad con las oportunidades de nuestro catálogo.",
            },
            {
              Icon: Ruler,
              n: "02",
              title: "Tasación de inmuebles",
              text: "Un punto de partida para tomar decisiones informadas sobre tu propiedad.",
            },
            {
              Icon: Handshake,
              n: "03",
              title: "Asesoría inmobiliaria",
              text: "Orientación personalizada durante tu proceso inmobiliario.",
            },
          ].map(({ Icon, n, title, text }) => (
            <Link to="/servicios" key={n}>
              <span>
                {n}
                <Icon size={27} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
              <ArrowUpRight size={19} />
            </Link>
          ))}
        </div>
      </section>
      <SocialMediaCallToAction />
      <section className="owner-banner shell">
        <div>
          <span className="eyebrow">TU INMUEBLE, SU PRÓXIMA HISTORIA</span>
          <h2>
            Hay alguien buscando
            <br />
            un lugar como el tuyo.
          </h2>
          <p>
            Conoce cómo podemos acompañarte a vender o alquilar tu propiedad.
          </p>
          <Link className="button button-light" to="/vende-o-alquila">
            Quiero ofrecer mi inmueble <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="owner-art" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
      <section className="section-space shell home-contact" id="contacto">
        <div>
          <span className="eyebrow">HABLEMOS DE LO QUE BUSCAS</span>
          <h2>
            Tu próximo paso,
            <br />
            <em>lo damos contigo.</em>
          </h2>
          <p>
            Cuéntanos qué tienes en mente.
            <br />
            Nuestro equipo te orientará personalmente.
          </p>
          <Link className="text-link" to="/asesores">
            Conoce a nuestros asesores <ChevronRight size={16} />
          </Link>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
