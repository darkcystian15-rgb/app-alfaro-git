import { useState } from "react";
import { ImageOff } from "lucide-react";
import { BrandMark } from "./Brand";
export default function PropertyImage({
  src,
  alt = "",
  eager = false,
  signature = true,
  className = "",
}) {
  const [failed, setFailed] = useState(null);
  const image = String(src || "").trim();
  return (
    <figure className={"property-photo " + className}>
      <div className="photo-area">
        {image && failed !== image ? (
          <img
            src={image}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onError={() => setFailed(image)}
          />
        ) : (
          <div className="photo-missing">
            <ImageOff size={28} />
            <span>Imagen por confirmar</span>
          </div>
        )}
      </div>
      {signature && (
        <figcaption className="photo-signature">
          <BrandMark />
          <span>
            ALBERTO ALFARO <i>INMOBILIARIA</i>
          </span>
          <span className="signature-rule" />
        </figcaption>
      )}
    </figure>
  );
}
