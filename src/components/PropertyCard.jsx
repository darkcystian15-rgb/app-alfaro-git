import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowUpRight, MessageCircle } from "lucide-react";
import { contactUrl, formatPrice, propertyUrl } from "../config/site";

export default function PropertyCard({ property: item, ...legacyProps }) {
  // Compatibilidad temporal con llamadas antiguas mediante props individuales.
  const property = item || legacyProps;
  const link = propertyUrl(property.id);
  const [failedImage, setFailedImage] = useState(null);
  const image = String(property.image || "").trim();
  return (
    <article className="alfaro-property-card group flex h-full flex-col overflow-hidden rounded-2xl bg-white">
      <Link
        to={link}
        aria-label={`Ver ${property.title || "inmueble"}`}
        className="block overflow-hidden no-underline"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {image && failedImage !== image ? (
            <img
              onError={() => setFailedImage(image)}
              src={image}
              alt={property.title || "Inmueble"}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              Imagen por confirmar
            </div>
          )}
          {property.status && (
            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm">
              {property.status}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xl font-extrabold tracking-tight text-[#b7192a]">
          {formatPrice(property.price, property.moneda)}
        </p>
        <Link
          to={link}
          className="mt-2 text-lg font-semibold leading-snug text-slate-900 no-underline hover:text-[#b7192a]"
        >
          {property.title || "Inmueble disponible"}
        </Link>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
          <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {property.address || property.location || "Ubicación por confirmar"}
        </p>
        {property.area && Number(property.area) > 0 && (
          <p className="mt-2 text-sm font-medium text-slate-500">
            {Number(property.area).toLocaleString("es-PE")} m²
          </p>
        )}
        <div className="mt-auto flex gap-2 pt-5">
          <Link
            to={link}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#b7192a] px-3 py-3 text-sm font-bold text-white no-underline hover:bg-[#961222]"
          >
            Ver inmueble <ArrowUpRight size={16} />
          </Link>
          <a
            href={contactUrl(property)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Consultar por WhatsApp sobre ${property.title || "el inmueble"}`}
            className="flex items-center justify-center rounded-xl border border-slate-300 px-4 text-slate-700 hover:border-green-600 hover:text-green-700"
          >
            <MessageCircle size={19} />
          </a>
        </div>
      </div>
    </article>
  );
}
