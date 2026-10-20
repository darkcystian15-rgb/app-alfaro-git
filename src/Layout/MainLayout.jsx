import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CompareDock from "../components/CompareDock";
const titles = {
  "/servicios": ["SERVICIOS INMOBILIARIOS", "Cada decisión, bien acompañada."],
  "/acerca-de-nosotros": ["SOMOS ALFARO", "Personas detrás de cada espacio."],
  "/nuestra-historia": ["NUESTRA HISTORIA", "Una trayectoria que nos conecta."],
  "/asesores": ["EL EQUIPO ALFARO", "Conoce a quienes te acompañan."],
  "/blog": ["ACTUALIDAD INMOBILIARIA", "Ideas para tu próxima decisión."],
  "/contacto": ["CONVERSEMOS", "Tu próximo paso empieza aquí."],
  "/vende-o-alquila": [
    "OFRECE TU INMUEBLE",
    "Dale a tu propiedad un nuevo comienzo.",
  ],
};
export default function MainLayout() {
  const location = useLocation(),
    title =
      titles[location.pathname] ||
      (location.pathname.startsWith("/blog/") ? titles["/blog"] : null);
  useEffect(() => {
    if (location.state?.keepScroll) return;
    if (location.state?.restoreScroll != null) {
      const y = location.state.restoreScroll;
      const t = setTimeout(() => window.scrollTo(0, y), 180);
      return () => clearTimeout(t);
    }
    if (location.hash) return;
    window.scrollTo(0, 0);
  }, [location.key]);
  return (
    <div className="portal-v2">
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <Navbar />
      <div
        id="contenido"
        className={title ? "institutional-page" : "page-content"}
      >
        {title && (
          <div className="institutional-heading shell">
            <span className="eyebrow">{title[0]}</span>
            <h1>{title[1]}</h1>
            <div className="heading-rule" />
          </div>
        )}
        <Outlet />
      </div>
      <Footer />
      <CompareDock />
    </div>
  );
}
