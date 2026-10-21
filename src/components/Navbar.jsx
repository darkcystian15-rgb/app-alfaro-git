import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Heart, ArrowUpRight, ChevronDown, Phone } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import Brand from "./Brand";
export default function Navbar() {
  const [open, setOpen] = useState(false),
    [more, setMore] = useState(false),
    location = useLocation(),
    ref = useRef(null),
    { favorites } = usePortal();
  useEffect(() => {
    setOpen(false);
    setMore(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMore(false);
      }
      if (e.type === "pointerdown" && !ref.current?.contains(e.target)) {
        setOpen(false);
        setMore(false);
      }
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, []);
  return (
    <header className="site-header" ref={ref}>
      <div className="header-top">
        <div className="shell">
          <span>Chimbote · Nuevo Chimbote · Y más ubicaciones</span>
          <a href="tel:+51940221494">
            <Phone size={12} /> +51 940 221 494
          </a>
        </div>
      </div>
      <nav className="main-nav shell" aria-label="Navegación principal">
        <Link to="/" aria-label="Alberto Alfaro, inicio">
          <Brand />
        </Link>
        <div className={"nav-links " + (open ? "is-open" : "")}>
          <Link
            className={
              location.pathname.startsWith("/propiedades/resumen") ||
              (location.pathname === "/propiedades" &&
                !new URLSearchParams(location.search).get("status"))
                ? "active"
                : ""
            }
            to="/propiedades"
          >
            Propiedades
          </Link>
          <Link
            className={
              location.pathname === "/propiedades" &&
              new URLSearchParams(location.search).get("status") === "Venta"
                ? "active"
                : ""
            }
            to="/propiedades?status=Venta"
          >
            Comprar
          </Link>
          <Link
            className={
              location.pathname === "/propiedades" &&
              new URLSearchParams(location.search).get("status") === "Alquiler"
                ? "active"
                : ""
            }
            to="/propiedades?status=Alquiler"
          >
            Alquilar
          </Link>
          <NavLink to="/servicios">Servicios</NavLink>
          <div className="nav-more">
            <button
              type="button"
              aria-expanded={more}
              onClick={() => setMore(!more)}
            >
              Conócenos <ChevronDown size={13} />
            </button>
            {more && (
              <div className="nav-dropdown">
                {[
                  ["/acerca-de-nosotros", "Nosotros"],
                  ["/nuestra-historia", "Nuestra historia"],
                  ["/asesores", "Nuestros asesores"],
                  ["/blog", "Blog y actualidad"],
                  ["/contacto", "Contacto"],
                ].map(([url, label]) => (
                  <Link to={url} key={url}>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/vende-o-alquila" className="nav-offer">
            Ofrece tu inmueble <ArrowUpRight size={14} />
          </Link>
        </div>
        <Link
          className="nav-favorites"
          to="/favoritos"
          aria-label={`Mi selección, ${favorites.length} guardados`}
          title="Administrar mi selección"
        >
          <Heart size={19} />
          <span className="selection-nav-label">Mi selección</span>
          <span>{favorites.length}</span>
        </Link>
        <button
          type="button"
          className="mobile-menu-button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
    </header>
  );
}
