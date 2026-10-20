# Transferencia para planear la fase 3

Las nuevas fases visuales 1 y 2 funcionan sobre el catálogo y APIs existentes. La fase 3
no está implementada y necesita alcance propio antes de cualquier cambio de datos.

## Decisiones por definir

- Modelo definitivo del catálogo y permisos/estados reales de publicación.
- Identificadores estables y correspondencias con cualquier sistema externo.
- Responsables de fotos, derechos, calidad, versiones y tratamiento de marca en la carga.
- Si se necesitan favoritos entre dispositivos o seguimiento de consultas, definir cuenta,
  consentimiento, retención y almacenamiento; hoy no existe persistencia en servidor.
- Integración autorizada con intranet: campos, API, estados, conflictos y reintentos.
- Entorno aislado de pruebas para APIs de Preview. Hoy las variables MySQL están solo en
  Production; no ampliar su alcance ni copiarlas sin autorización específica.
- Mantenimiento coordinado de credenciales históricas y endurecimiento de las APIs antiguas.

## Contratos a conservar

`/api/getProperties` permite location/status/title múltiples separados por comas y featured.
`/api/get-options` entrega geografía agrupada y catálogos; `/api/getPropertyDetails` conserva
property/subProperties; `/api/getPropertyDetailInfo` mantiene información adicional.
El nuevo `/api/property-share` es solo GET/HEAD y lee los mismos datos públicos por ID.
Las rutas de inmuebles, galerías, PDF y enlaces sociales dependen de mantener IDs estables.

## Requisitos antes de implementar

Inventario de consumidores, lectura del esquema real con fecha, entorno de ensayo,
respaldos de datos/archivos verificados, reglas de visibilidad y restauración probada.
No ejecutar scripts históricos o migraciones como una comprobación de despliegue.
La documentación de la entrega anterior se conserva como evidencia histórica.
