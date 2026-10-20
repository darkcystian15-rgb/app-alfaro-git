// Contrato de solo lectura compartido por portada y catálogo.
export async function fetchProperties(filters = {}, { signal } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      params.set(key, String(value).trim());
    }
  });
  const query = params.toString();
  let response;
  let data;
  try {
    response = await fetch(`/api/getProperties${query ? "?" + query : ""}`, {
      signal,
    });
    if (!response.ok) throw new Error("HTTP error");
    data = await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("No pudimos cargar las propiedades. Inténtalo nuevamente.");
  }
  if (
    !Array.isArray(data) ||
    data.some(
      (item) =>
        !item ||
        typeof item !== "object" ||
        item.id === undefined ||
        item.id === null,
    )
  ) {
    throw new Error("La respuesta del catálogo no tiene el formato esperado.");
  }
  return data;
}
