import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  X,
} from "lucide-react";
import { filterParams, valuesOf } from "../services/catalog-model";
import toast from "react-hot-toast";
function MultiFilter({ label, groups, value, onChange, placeholder }) {
  const [query, setQuery] = useState(""),
    ref = useRef(null),
    selected = valuesOf(value);
  useEffect(() => {
    const close = (e) => {
      if (
        e.key === "Escape" ||
        (e.type === "pointerdown" && !ref.current?.contains(e.target))
      )
        ref.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  return (
    <details className="filter-select" ref={ref}>
      <summary>
        <span className="filter-label">{label}</span>
        <span className="filter-value">
          {selected.length
            ? selected.length > 1
              ? `${selected.length} seleccionados`
              : selected[0]
            : placeholder}
          <ChevronDown size={15} />
        </span>
      </summary>
      <div className="filter-popover">
        <label className="filter-search">
          <Search size={15} />
          <input
            type="search"
            placeholder={`Buscar ${label.toLowerCase()}`}
            aria-label={`Buscar ${label.toLowerCase()}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="text-action"
          onClick={() => onChange("")}
        >
          Todas las opciones
        </button>
        <div className="filter-options">
          {groups.map((group) => {
            const list = group.items.filter((v) =>
              v.toLowerCase().includes(query.toLowerCase()),
            );
            return (
              list.length > 0 && (
                <fieldset key={group.name}>
                  <legend>{group.name}</legend>
                  {list.map((option) => (
                    <label key={option}>
                      <input
                        type="checkbox"
                        checked={selected.includes(option)}
                        onChange={() =>
                          onChange(
                            (selected.includes(option)
                              ? selected.filter((x) => x !== option)
                              : [...selected, option]
                            ).join(","),
                          )
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
              )
            );
          })}
          {!groups.some((g) =>
            g.items.some((v) => v.toLowerCase().includes(query.toLowerCase())),
          ) && <p>Sin opciones coincidentes.</p>}
        </div>
      </div>
    </details>
  );
}
export default function SearchBanner({
  initialFilters = {},
  compact = false,
  onSearch,
}) {
  const navigate = useNavigate(),
    [options, setOptions] = useState({
      distritos: [],
      modalidades: [],
      tipos: [],
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [filters, setFilters] = useState(initialFilters),
    key = JSON.stringify(initialFilters);
  useEffect(() => setFilters(JSON.parse(key)), [key]);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/get-options", { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (
          !d ||
          !Array.isArray(d.distritos) ||
          !Array.isArray(d.modalidades) ||
          !Array.isArray(d.tipos) ||
          d.distritos.some((g) => !g || !Array.isArray(g.distritos))
        )
          throw Error();
        if (!c.signal.aborted) setOptions(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            "Las opciones no están disponibles. Puedes buscar sin filtros.",
          );
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, []);
  const update = (name, value) =>
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "currency" && !value ? { min: "", max: "" } : {}),
    }));
  const submit = (e) => {
    e.preventDefault();
    if (
      (filters.min &&
        filters.max &&
        Number(filters.min) > Number(filters.max)) ||
      (filters.areaMin &&
        filters.areaMax &&
        Number(filters.areaMin) > Number(filters.areaMax))
    ) {
      toast.error("El mínimo no puede superar al máximo.");
      return;
    }
    if (onSearch) onSearch(filters);
    else navigate("/propiedades?" + filterParams(filters));
  };
  return (
    <form
      className={"property-search " + (compact ? "search-compact" : "")}
      onSubmit={submit}
      aria-label="Buscar inmuebles"
    >
      <div className="search-main">
        <MultiFilter
          label="Ubicación"
          placeholder="¿Dónde quieres buscar?"
          value={filters.location}
          onChange={(v) => update("location", v)}
          groups={options.distritos.map((g) => ({
            name: g.departamento || "Ubicaciones",
            items: g.distritos
              .map((d) => d.nombre)
              .filter((v) => typeof v === "string"),
          }))}
        />
        <MultiFilter
          label="Operación"
          placeholder="Venta y alquiler"
          value={filters.status}
          onChange={(v) => update("status", v)}
          groups={[
            {
              name: "Elige una o varias",
              items: options.modalidades.filter((v) => typeof v === "string"),
            },
          ]}
        />
        <MultiFilter
          label="Tipo de inmueble"
          placeholder="Todos los tipos"
          value={filters.title}
          onChange={(v) => update("title", v)}
          groups={[
            {
              name: "Elige uno o varios",
              items: options.tipos.filter((v) => typeof v === "string"),
            },
          ]}
        />
        <button className="button button-red search-submit" type="submit">
          <Search size={19} />
          Buscar inmuebles
        </button>
      </div>
      <div className="search-bottom">
        <span>
          <MapPin size={13} />
          {loading
            ? "Cargando ubicaciones…"
            : error || "Una ubicación o varias. Tú eliges."}
        </span>
        <details className="advanced-filters">
          <summary>
            <SlidersHorizontal size={15} /> Más filtros
          </summary>
          <div className="advanced-panel">
            <label>
              Moneda
              <select
                value={filters.currency || ""}
                onChange={(e) => update("currency", e.target.value)}
              >
                <option value="">Todas las monedas</option>
                <option value="USD">US$ · Dólares</option>
                <option value="PEN">S/ · Soles</option>
              </select>
            </label>
            <label>
              Precio mínimo
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Desde"
                value={filters.min || ""}
                disabled={!filters.currency}
                onChange={(e) => update("min", e.target.value)}
              />
            </label>
            <label>
              Precio máximo
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Hasta"
                value={filters.max || ""}
                disabled={!filters.currency}
                onChange={(e) => update("max", e.target.value)}
              />
            </label>
            <label>
              Área mínima · m²
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Desde"
                value={filters.areaMin || ""}
                onChange={(e) => update("areaMin", e.target.value)}
              />
            </label>
            <label>
              Área máxima · m²
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Hasta"
                value={filters.areaMax || ""}
                onChange={(e) => update("areaMax", e.target.value)}
              />
            </label>
            <p>
              Selecciona una moneda para filtrar precios. No realizamos
              conversiones.
            </p>
            <button
              type="button"
              className="text-action"
              onClick={() => setFilters({})}
            >
              <X size={13} /> Limpiar todo
            </button>
          </div>
        </details>
      </div>
    </form>
  );
}
