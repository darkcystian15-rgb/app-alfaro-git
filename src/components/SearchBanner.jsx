import React, { useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";
export default function SearchBanner({ onSearch }) {
  const [options, setOptions] = useState({
    distritos: [],
    modalidades: [],
    tipos: [],
  });
  const [filters, setFilters] = useState({
    location: "",
    status: "",
    title: "",
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/get-options", { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw new Error("No se pudieron cargar los filtros");
        return r.json();
      })
      .then((d) => {
        if (
          !d ||
          !Array.isArray(d.distritos) ||
          !Array.isArray(d.modalidades) ||
          !Array.isArray(d.tipos) ||
          d.distritos.some(
            (group) =>
              !group ||
              !Array.isArray(group.distritos) ||
              group.distritos.some(
                (district) => !district || typeof district.nombre !== "string",
              ),
          ) ||
          [...d.modalidades, ...d.tipos].some(
            (value) => typeof value !== "string",
          )
        ) {
          throw new Error("Invalid search options");
        }
        if (!c.signal.aborted) setOptions(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError("No pudimos cargar las opciones de búsqueda");
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, []);
  const update = (name, value) =>
    setFilters((prev) => ({ ...prev, [name]: value }));
  return (
    <section
      className="relative isolate flex min-h-[460px] items-center overflow-hidden bg-[#152337] px-4 py-20 text-white sm:min-h-[520px]"
      aria-labelledby="hero-title"
    >
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-35"
        style={{ backgroundImage: "url('/IMG2.png')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#111b2c] via-[#142136]/85 to-[#142136]/25"
        aria-hidden="true"
      />
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-4 text-sm font-bold uppercase tracking-[.2em] text-red-200">
          Inmobiliaria Alberto Alfaro
        </p>
        <h1
          id="hero-title"
          className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Un lugar para cada etapa de tu vida
        </h1>
        <p className="mt-5 max-w-2xl text-base text-slate-100 sm:text-lg">
          Encuentra propiedades en venta o alquiler con asesoría inmobiliaria
          personalizada.
        </p>
        <form
          className="mt-9 grid gap-3 rounded-2xl border border-white/20 bg-white p-4 text-slate-800 shadow-2xl sm:grid-cols-2 lg:grid-cols-4 lg:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(filters);
          }}
        >
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Ubicación
            <select
              value={filters.location}
              onChange={(e) => update("location", e.target.value)}
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-700"
            >
              <option value="">Todas las ubicaciones</option>
              {options.distritos
                .flatMap((group) => group.distritos || [])
                .map((d) => (
                  <option key={d.id} value={d.nombre}>
                    {d.nombre}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Operación
            <select
              value={filters.status}
              onChange={(e) => update("status", e.target.value)}
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-700"
            >
              <option value="">Venta y alquiler</option>
              {options.modalidades.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Tipo de inmueble
            <select
              value={filters.title}
              onChange={(e) => update("title", e.target.value)}
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-700"
            >
              <option value="">Todos los tipos</option>
              {options.tipos.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#b7192a] px-6 font-bold text-white transition-colors hover:bg-[#961222]"
          >
            <Search size={18} />
            Buscar inmuebles
          </button>
          {loading && (
            <p className="col-span-full text-xs text-slate-500" role="status">
              Cargando opciones de búsqueda…
            </p>
          )}
          {error && (
            <p className="col-span-full text-xs text-red-700" role="status">
              {error}. Puedes buscar sin filtros mientras tanto.
            </p>
          )}
        </form>
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-100">
          <MapPin size={16} /> Chimbote · Nuevo Chimbote · Casma y más
          ubicaciones
        </p>
      </div>
    </section>
  );
}
