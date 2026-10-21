import { Link } from "react-router-dom";
import { ArrowUpRight, Instagram, Facebook, Phone, MapPin } from "lucide-react";
import Brand from "./Brand";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link to="/">
            <Brand light />
          </Link>
          <p>
            Tu próximo espacio empieza con una buena decisión. Te acompañamos a
            encontrarlo.
          </p>
          <div className="footer-socials">
            <a
              aria-label="Facebook Alfaro"
              href="https://www.facebook.com/inmobiliariaalfaro"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook size={18} />
            </a>
            <a
              aria-label="Instagram Alfaro"
              href="https://www.instagram.com/inmobiliariaalfaro"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram size={18} />
            </a>
            <a
              aria-label="TikTok Alfaro"
              href="https://www.tiktok.com/@inmobiliariaalfaro"
              target="_blank"
              rel="noopener noreferrer"
            >
              TikTok <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
        <div>
          <h3>Encuentra tu espacio</h3>
          <Link to="/propiedades?status=Venta">Inmuebles en venta</Link>
          <Link to="/propiedades?status=Alquiler">Inmuebles en alquiler</Link>
          <Link to="/favoritos">Mi selección · favoritos</Link>
          <Link to="/comparar">Comparar inmuebles</Link>
        </div>
        <div>
          <h3>Somos Alfaro</h3>
          <Link to="/acerca-de-nosotros">Nuestra firma</Link>
          <Link to="/nuestra-historia">Nuestra historia</Link>
          <Link to="/servicios">Servicios inmobiliarios</Link>
          <Link to="/asesores">Nuestros asesores</Link>
          <Link to="/blog">Blog y actualidad</Link>
        </div>
        <div>
          <h3>Conversemos</h3>
          <a href="tel:+51940221494">
            <Phone size={15} /> +51 940 221 494
          </a>
          <a
            href="https://wa.me/51940221494"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp <ArrowUpRight size={14} />
          </a>
          <Link to="/contacto">
            <MapPin size={15} /> Nuevo Chimbote, Perú
          </Link>
          <Link to="/vende-o-alquila">Vende o alquila con nosotros</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>
          © {new Date().getFullYear()} Inmobiliaria Alberto Alfaro E.I.R.L.
        </span>
        <span>Espacios para vivir. Lugares para crecer.</span>
      </div>
    </footer>
  );
}
