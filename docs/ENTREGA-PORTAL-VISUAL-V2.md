# Entrega — nuevas fases visuales 1 y 2

Proyecto único: `darkcystian15-rgb/app-alfaro-git`.
Base: `475edb4638ac150d39ab15dbfeb02fb7232a6c61`.
Rama: `feat/portal-experiencia-visual-v2`.
Plan: [alcance de ambas fases](PLAN-PORTAL-VISUAL-V2.md).

## Resultado implementado

La versión anterior simplificó controles e interacciones. Esta entrega recupera las
capacidades útiles y añade una identidad Alfaro coherente en Inicio, catálogo, ficha
y el marco de las páginas institucionales. Se conservaron textos, información,
galerías, videos, condiciones de alquiler, mapa existente y documentos de la ficha.

| Área | Resultado |
| --- | --- |
| Inicio | Composición fotográfica, carrusel controlable, pausa, recorridos comprar/alquilar/ofrecer, ubicaciones calculadas con el catálogo y servicios. |
| Destacados | Todos los registros retornados por featured=true accesibles mediante desplazamiento, controles y enlace específico al catálogo. |
| Búsqueda | Selección múltiple, departamentos agrupados, búsqueda de opciones, filtros opcionales, chips, URL persistente y rangos por moneda/área. |
| Catálogo | Precio/dirección/localidad diferenciados, características válidas, paginación numérica, ordenación por moneda y regreso a la página anterior. |
| Fotografías | Marco y firma fuera de la foto original; tratamiento automático para fotos nuevas que lleguen mediante URLs del catálogo. |
| Favoritos | Guardados en localStorage de este navegador; sin cuenta ni persistencia en servidor. |
| Comparación | Hasta tres inmuebles; muestra moneda, operación y datos reales sin puntajes ni conversiones inventadas. |
| Ficha | Jerarquía nueva, contacto contextual, barra móvil, galería ampliada accesible por teclado, miniaturas y video. |
| Compartir | Metadatos por inmueble para crawlers, JPEG 1200×630 con foto/precio/ubicación y descarga JPG. |
| PDF | Carga bajo demanda, QR y enlaces canónicos de Darkcystian, textos y galería con referencias a originales. |
| Contenido público | Navegación, tipografía, marcos y pie comunes; Noticias usa su API Vercel; ofrecer un inmueble prepara una consulta de WhatsApp sin envío automático. |
| Seguridad de presentación | Saneamiento de HTML de ficha y modal; generación de imágenes con validación de host, MIME, límite de bytes, píxeles, tiempo y métodos GET/HEAD. |

## Compatibilidad y límites

Las APIs antiguas no se reemplazan ni cambian de esquema. El nuevo endpoint de
compartir ejecuta únicamente un SELECT parametrizado de campos públicos en properties.
No se ejecutó ninguna migración, importación ni escritura de negocio. api/db.js,
.env y funciones Netlify conservan su contenido. No se cambian credenciales.

La firma visual no sobrescribe las fotos ni detecta marcas de agua existentes. El
archivo para compartir se genera aparte. La portada usa las mismas tres imágenes
anteriores en copias WebP de 95.524, 166.306 y 109.512 bytes, conservando los PNG originales.

El bundle inicial pasó de aproximadamente 939 kB a 506 kB sin comprimir; el PDF y QR
se descargan bajo demanda. Se conserva la advertencia de tamaño de Vite y la de
Browserslist. No se afirma una puntuación Lighthouse no medida.

Las variables MySQL del proyecto siguen limitadas a Production. Un Preview estándar
compila pero no tiene configuración suficiente para las consultas; la validación
completa se realiza con un despliegue aislado usando la configuración existente de
Production y --skip-domain antes de publicar. No se copian credenciales a Preview.

Las redes sociales pueden conservar sus propias tarjetas en caché y decidir el recorte.
Se verifican HTML de crawler, metadatos y JPEG; esto no equivale a enviar un WhatsApp real.
Las imágenes externas del PDF pueden omitirse por CORS; se mantiene su enlace original.
El PDF no contiene marcas comerciales como “exclusivo” que no estén respaldadas por datos.

## Pruebas

Pruebas unitarias: 15 casos aprobados sobre contrato HTTP, cancelación, monedas,
URLs de compartir, HTML escapado, URLs externas restringidas, límites de descarga,
JPEG generado, alternativa de imagen, rechazo de escrituras, 404/503, HEAD, caché,
filtros y paginación. No usan MySQL.

Navegador: recorridos completos con datos públicos en vista local de solo lectura,
favoritos persistentes, máximo de comparación, multiubicación, URL y regreso desde ficha,
filtros por moneda, vacío/reintento, navegación móvil, galería de teclado, JPG y PDF reales,
páginas institucionales y preparación de consulta sin enviar mensajes. Se utilizan
respuestas ficticias solo en un contexto aislado para probar errores y HTML hostil.

La prueba completa pasó tanto en el despliegue aislado como en Production pública,
sin sustituir las APIs en esas dos comprobaciones. Se descargaron PDF y JPG reales.
En 375/768/1440 px se revisaron portada y ficha; las páginas institucionales se
comprobaron también en móvil y escritorio. Cero errores JavaScript no capturados y
cero solicitudes de escritura de negocio al origen del portal.

El HTML del crawler contiene metadatos del inmueble, no los genéricos de la SPA.
El JPEG remoto fue inspeccionado visualmente y utiliza glifos vectoriales para no
depender de fuentes del sistema de Vercel. Las descargas del entorno protegido se
verificaron con la cookie de autenticación del propio despliegue; no se exponen tokens.

## Publicación comprobada

- Fuente final probada: `089994be38c85f193fd69601f80adada15c407cd`.
- PR [#2](https://github.com/darkcystian15-rgb/app-alfaro-git/pull/2), fusionado.
- Preview final: https://app-alfaro-3y3n0bl4o-puma19.vercel.app,
  `dpl_DWaL8664btSSn9n1K5hsvXj4xJxP`, READY. Conserva la limitación de variables de BD.
- Despliegue aislado plenamente validado: https://app-alfaro-kjee2x7oa-puma19.vercel.app,
  `dpl_GPgupXcp4Ls7QQs7pRiJ8q3rmKTQ`, READY, sin asignación del dominio público.
- Merge en main: `3c94eaa5158624a08286cbe004901ece5cfd9246`.
- Production: https://app-alfaro-git-smoky.vercel.app.
- Deployment probado: `dpl_46NYAyCEVECpbvZfUMtTbzuizUWj`, READY,
  https://app-alfaro-ga68cnxdi-puma19.vercel.app, del SHA de merge indicado.
- API de catálogo, destacados, opciones y ficha existente: HTTP 200.
- Conteos antes/después: 64 inmuebles y 8 destacados; sin escrituras de negocio.
- Ejemplo gráfico: https://app-alfaro-git-smoky.vercel.app/api/property-share?id=36&format=image.

El commit que incorpora esta evidencia es exclusivamente documental. La comprobación
final contrasta su SHA en GitHub y Vercel y confirma que conserva los mismos assets
del código probado. Los resultados agregados están en `EVIDENCIA-PORTAL-VISUAL-V2.json`;
no se incluyen fotos descargadas, datos de contacto, cookies, secretos ni registros
completos del catálogo en esa evidencia.

## Reproducción

Usar Node 24, igual que el proyecto Vercel.

```sh
npm ci
npm test
npm run build
npx playwright install chromium
PORTAL_BUILD_DIR=./dist npm run preview:readonly
```

En otra terminal:

```sh
PORTAL_BASE_URL=http://127.0.0.1:4180 npm run test:browser
```

El servidor de prueba solo consulta los endpoints GET públicos de Darkcystian y
entrega la compilación local; no lee credenciales ni conecta directamente a MySQL.
La generación gráfica usa el mismo generador y un lector de datos públicos inyectado.
Para una versión desplegada, indicar su URL en PORTAL_BASE_URL. PORTAL_HEADERS_FILE
permite un archivo privado para autenticación de Preview; los encabezados se envían
solo al origen objetivo, nunca al host de fotos ni a servicios externos.

Las pruebas registran ausencia de POST de negocio al origen del portal; Google Maps
puede usar RPC propios de lectura. No se ejecutan envíos de formularios ni mensajes reales.

## Fase 3

Pendiente de planificación. Consultar [transferencia](HANDOFF-FASE-3-PORTAL.md).
Esta entrega no inicia el cambio de BD ni integra la intranet.
