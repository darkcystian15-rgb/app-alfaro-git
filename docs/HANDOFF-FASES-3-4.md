# Transferencia: fases 3 y 4 pendientes

Proyecto exclusivo: `darkcystian15-rgb/app-alfaro-git`. Fecha: 20 de octubre de 2026.
Las fases 3 y 4 no se implementaron. Este documento describe contratos del código;
no certifica un esquema consultado directamente en MySQL ni autoriza cambios de datos.

## Contratos que debe conservar una integración futura

| API de lectura | Respuesta y tablas referenciadas por el código |
| --- | --- |
| `/api/getProperties` | Array de inmuebles de `properties`; filtros opcionales `location`, `status`, `title` separados por comas. `featured=true` filtra `destacado = 1`. |
| `/api/get-options` | Objeto con `distritos` agrupados por departamento, `modalidades` y `tipos`; tablas homónimas. |
| `/api/getPropertyDetails?id=...` | Objeto `{ property, subProperties }`; `properties` y `sub_properties.property_id`. |
| `/api/getPropertyDetailInfo?id=...` | Array de `mas_info`, relación `id_properties`. |
| `/api/getAsesores` | `asesores`. |
| `/api/getArticulos` y `/api/getNoticias` | `articulos` y `noticias`; conservar vistas de detalle. |
| `/api/get-social-links` | `redes_sociales`. |

Las tarjetas consumen `id`, `title`, `image`, `price`, `moneda`, `location`, `address`,
`status` y `area`. Los IDs actuales mantienen las rutas `/propiedades/resumen/:id`.
No sustituirlos por posiciones de la intranet sin una correspondencia estable.

## Decisiones de las fases 1 y 2

- Catálogo y destacados usan el mismo servicio y tarjeta; nueve resultados por página y seis destacados.
- La búsqueda permite filtros vacíos o combinados y conserva los nombres de parámetros actuales.
- Precios inexistentes se muestran como consulta; PEN/soles y USD/dólares conservan símbolos diferentes.
- Fotos ausentes o rotas tienen un reemplazo visible. Se mantienen fichas, galerías y páginas institucionales.
- El WhatsApp institucional de las tarjetas se centraliza en `src/config/site.js`.
- Login, registro y administración públicos muestran información; no existe una autenticación nueva.

## Publicación y correspondencias pendientes

El API actual no implementa una nueva regla de publicación: devuelve los registros
que ya seleccionaba su código. `destacado` no equivale a autorizado para publicación.
Definir posteriormente quién puede publicar, qué estados son visibles, el tratamiento
de inmuebles suspendidos/cerrados y el retiro de imágenes o datos privados.

Antes de integrar con la intranet, acordar:

1. IDs estables, propietario de cada dato y correspondencia por operación/zona.
2. Estados y permisos de publicación, exposición de dirección y autorización de fotografías.
3. Monedas, precios, áreas, tipos, ubicación comercial y geografía sin equivalencias supuestas.
4. API autenticada, idempotencia, trazabilidad, reintentos y política de eliminación.
5. Migración por etapas con validación de conteos y recuperación ensayada en un entorno aislado.

## Respaldo necesario antes de una fase futura

Preparar copias verificadas del esquema, datos y archivos, configuración privada de
cada entorno, correspondencias de IDs y revisión del impacto en consumidores.
Definir responsables, ventana de cambio, hashes y restauración probada antes de migrar.
No ejecutar migraciones, importaciones ni rotación de credenciales como verificación.
Los riesgos históricos de secretos y HTML deben tratarse mediante mantenimiento coordinado.
