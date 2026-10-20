import { useEffect, useState } from "react";
import { fetchProperties } from "../services/properties";
export default function useProperties(filters = {}) {
  const key = JSON.stringify(filters),
    [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError("");
    fetchProperties(JSON.parse(key), { signal: c.signal })
      .then((rows) => {
        if (!c.signal.aborted) setItems(rows);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [key, retry]);
  return { items, loading, error, onRetry: () => setRetry((n) => n + 1) };
}
