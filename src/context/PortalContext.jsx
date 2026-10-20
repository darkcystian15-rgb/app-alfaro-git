import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
const PortalContext = createContext(null);
const load = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem("alfaro:v2:" + key) || "[]");
    return Array.isArray(v)
      ? [
          ...new Set(
            v.filter((id) => typeof id === "string" && id.length < 80),
          ),
        ].slice(0, key === "compare" ? 3 : 500)
      : [];
  } catch {
    return [];
  }
};
export function PortalProvider({ children }) {
  const [favorites, setFavorites] = useState(() => load("favorites")),
    [compare, setCompare] = useState(() => load("compare"));
  useEffect(() => {
    try {
      localStorage.setItem("alfaro:v2:favorites", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);
  useEffect(() => {
    try {
      localStorage.setItem("alfaro:v2:compare", JSON.stringify(compare));
    } catch {}
  }, [compare]);
  useEffect(() => {
    const sync = (e) => {
      if (e.key === "alfaro:v2:favorites") setFavorites(load("favorites"));
      if (e.key === "alfaro:v2:compare") setCompare(load("compare"));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const toggleFavorite = (id) =>
    setFavorites((prev) =>
      prev.includes(String(id))
        ? prev.filter((v) => v !== String(id))
        : [...prev, String(id)],
    );
  const toggleCompare = (id) => {
    id = String(id);
    if (!compare.includes(id) && compare.length >= 3) {
      toast("Puedes comparar hasta 3 inmuebles. Retira uno para añadir otro.");
      return;
    }
    setCompare((prev) =>
      prev.includes(id)
        ? prev.filter((v) => v !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    );
  };
  return (
    <PortalContext.Provider
      value={{
        favorites,
        compare,
        toggleFavorite,
        toggleCompare,
        clearCompare: () => setCompare([]),
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}
export const usePortal = () => useContext(PortalContext);
