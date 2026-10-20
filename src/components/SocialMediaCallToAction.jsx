import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
export default function SocialMediaCallToAction() {
  const [links, setLinks] = useState([]);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/get-social-links", { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) return;
        setLinks(
          data.filter((item) => {
            try {
              const u = new URL(item.enlace);
              return /^https?:$/.test(u.protocol) && !u.username && !u.password;
            } catch {
              return false;
            }
          }),
        );
      })
      .catch(() => {});
    return () => c.abort();
  }, []);
  if (!links.length) return null;
  return (
    <section
      className="social-strip shell"
      aria-label="Redes sociales de Alfaro"
    >
      <div>
        <span className="eyebrow">SIGAMOS CONECTADOS</span>
        <p>Más espacios. Más historias.</p>
      </div>
      <div>
        {links.map((item, i) => (
          <a
            key={item.id || i}
            href={item.enlace}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.nombre}
            <ArrowUpRight size={16} />
          </a>
        ))}
      </div>
    </section>
  );
}
