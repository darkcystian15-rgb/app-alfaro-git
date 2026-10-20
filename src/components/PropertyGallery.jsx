import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  Image as ImageIcon,
} from "lucide-react";
import PropertyImage from "./PropertyImage";
const video = (src) => /\.(mp4|mov|webm|ogg)(?:\?|$)/i.test(src || "");
export default function PropertyGallery({ data }) {
  const photos = [
    { src: data?.property?.image, title: data?.property?.title },
    ...(data?.subProperties || []).map((s) => ({
      src: s.image,
      title: s.content,
      description: s.text_content,
    })),
  ]
    .filter(
      (p, i, all) =>
        p.src &&
        typeof p.src === "string" &&
        all.findIndex((x) => String(x.src || "").trim() === p.src.trim()) === i,
    )
    .map((p) => ({ ...p, src: p.src.trim() }));
  const [current, setCurrent] = useState(0),
    [lightbox, setLightbox] = useState(false),
    dialog = useRef(null),
    lastFocus = useRef(null);
  const move = (n) =>
      setCurrent((i) => (i + n + photos.length) % photos.length),
    item = photos[current] || photos[0];
  useEffect(() => {
    setCurrent(0);
  }, [data?.property?.id]);
  useEffect(() => {
    if (lightbox) {
      lastFocus.current = document.activeElement;
      dialog.current?.showModal();
      const before = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = before;
        lastFocus.current?.focus();
      };
    }
    dialog.current?.close();
  }, [lightbox]);
  if (!photos.length)
    return <PropertyImage alt="Inmueble sin fotografía disponible" />;
  const media = (expanded) =>
    video(item.src) ? (
      <video
        src={item.src}
        controls
        playsInline
        preload="metadata"
        aria-label={item.title || "Video del inmueble"}
      />
    ) : (
      <PropertyImage
        src={item.src}
        alt={item.title || "Fotografía del inmueble"}
        eager
        className={expanded ? "expanded-photo" : ""}
      />
    );
  return (
    <section className="property-gallery" aria-label="Galería del inmueble">
      <div className="gallery-stage">
        {media(false)}
        <button
          className="gallery-expand button button-light"
          onClick={() => setLightbox(true)}
        >
          <Expand size={16} /> Ver {photos.length}{" "}
          {photos.length === 1 ? "foto" : "fotos y videos"}
        </button>
        {photos.length > 1 && (
          <>
            <button
              className="gallery-arrow gallery-prev"
              aria-label="Foto anterior"
              onClick={() => move(-1)}
            >
              <ChevronLeft />
            </button>
            <button
              className="gallery-arrow gallery-next"
              aria-label="Foto siguiente"
              onClick={() => move(1)}
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>
      <div className="gallery-thumbnails" aria-label="Miniaturas del inmueble">
        {photos.map((p, i) => (
          <button
            key={p.src}
            aria-label={"Ver foto " + (i + 1)}
            aria-pressed={i === current}
            onClick={() => setCurrent(i)}
          >
            {video(p.src) ? (
              <span>▶ Video</span>
            ) : (
              <img
                src={p.src}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
            )}
          </button>
        ))}
        <span>
          {current + 1} / {photos.length}
        </span>
      </div>
      {item.description && (
        <p className="gallery-caption">
          {item.description.replace(/<[^>]*>/g, "")}
        </p>
      )}
      <dialog
        ref={dialog}
        className="gallery-dialog"
        aria-label="Fotografías ampliadas del inmueble"
        onCancel={() => setLightbox(false)}
        onClose={() => setLightbox(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") move(-1);
          if (e.key === "ArrowRight") move(1);
        }}
      >
        <div className="lightbox-toolbar">
          <span>
            {current + 1} / {photos.length} · {item.title}
          </span>
          <button
            className="icon-button"
            aria-label="Cerrar galería"
            onClick={() => setLightbox(false)}
          >
            <X />
          </button>
        </div>
        <div className="lightbox-media">
          {media(true)}
          {photos.length > 1 && (
            <>
              <button
                className="gallery-arrow gallery-prev"
                aria-label="Foto anterior ampliada"
                onClick={() => move(-1)}
              >
                <ChevronLeft />
              </button>
              <button
                className="gallery-arrow gallery-next"
                aria-label="Foto siguiente ampliada"
                onClick={() => move(1)}
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>
      </dialog>
    </section>
  );
}
