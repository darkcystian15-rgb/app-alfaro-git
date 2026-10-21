// Diagnóstico heredado deshabilitado: no exponer configuración privada.
export async function handler() {
  return {
    statusCode: 410,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ error: "Diagnóstico retirado" }),
  };
}
