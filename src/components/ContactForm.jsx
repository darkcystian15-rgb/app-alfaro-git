import { useState } from "react";
import { MessageCircle, ArrowUpRight } from "lucide-react";
import { CONTACT_WHATSAPP } from "../config/site";
export default function ContactForm({ offering = false }) {
  const [data, setData] = useState({
      name: "",
      phone: "",
      interest: "",
      message: "",
    }),
    [ready, setReady] = useState(false);
  const update = (e) => {
    setReady(false);
    setData({ ...data, [e.target.name]: e.target.value });
  };
  const text = offering
    ? `Hola, soy ${data.name}. Deseo ofrecer mi inmueble. Teléfono: ${data.phone}. Operación: ${data.interest || "Por definir"}. Detalles: ${data.message || "Por conversar"}.`
    : `Hola, soy ${data.name}. Teléfono: ${data.phone}. Busco: ${data.interest || "Información inmobiliaria"}. ${data.message || ""}`;
  return (
    <div className="contact-form-card">
      <span className="eyebrow">ATENCIÓN PERSONALIZADA</span>
      <h2>
        {offering
          ? "Cuéntanos sobre tu inmueble."
          : "Conversemos sobre tu próximo espacio."}
      </h2>
      <p>
        Completa tus datos para preparar tu consulta. Tú decides cuándo enviarla
        por WhatsApp.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setReady(true);
        }}
      >
        <label>
          Tu nombre
          <input
            name="name"
            autoComplete="name"
            value={data.name}
            onChange={update}
            required
            maxLength={100}
            placeholder="¿Cómo te llamas?"
          />
        </label>
        <label>
          Teléfono de contacto
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            value={data.phone}
            onChange={update}
            required
            maxLength={25}
            pattern="[+0-9 ()-]{6,25}"
            placeholder="Tu número de contacto"
          />
        </label>
        <label>
          {offering ? "¿Qué deseas hacer?" : "¿Qué estás buscando?"}
          <select name="interest" value={data.interest} onChange={update}>
            <option value="">Selecciona una opción</option>
            <option value="Venta">
              {offering ? "Vender mi inmueble" : "Comprar un inmueble"}
            </option>
            <option value="Alquiler">
              {offering ? "Alquilar mi inmueble" : "Alquilar un inmueble"}
            </option>
            <option value="Asesoría">Asesoría inmobiliaria</option>
          </select>
        </label>
        <label>
          {offering ? "Ubicación y características" : "Cuéntanos un poco más"}
          <textarea
            name="message"
            rows={3}
            value={data.message}
            onChange={update}
            maxLength={1500}
            placeholder={
              offering
                ? "Tipo de inmueble, ubicación y detalles que quieras compartir…"
                : "Ubicación, tipo de inmueble o lo que tienes en mente…"
            }
          />
        </label>
        {ready ? (
          <a
            className="button button-red"
            href={`https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={17} /> Abrir mi consulta en WhatsApp{" "}
            <ArrowUpRight size={16} />
          </a>
        ) : (
          <button className="button button-red" type="submit">
            <MessageCircle size={17} /> Preparar consulta por WhatsApp
          </button>
        )}
        <small>
          {ready
            ? "Tu mensaje está preparado. Se abrirá WhatsApp para que revises y envíes la consulta."
            : "Este formulario no registra tus datos en una base de datos. Se usarán para preparar el mensaje de WhatsApp."}
        </small>
      </form>
    </div>
  );
}
