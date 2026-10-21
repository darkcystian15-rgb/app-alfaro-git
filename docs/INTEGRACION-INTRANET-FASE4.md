# Integración con la intranet — 21 de octubre de 2026

El receptor `/api/intranet-sync` recibe únicamente publicaciones autorizadas desde
el servidor de `darkcystian15-rgb/inmobiliaria-alfaro`. También entrega la configuración
aprobada del carrusel de inicio y sirve imágenes seleccionadas de publicaciones vigentes.

El POST exige `INTRANET_WEB_SYNC_TOKEN` y valida versiones monotónicas y contenido.
Una revisión repetida con el mismo cuerpo devuelve el mismo ID; una anterior se rechaza.
La publicación y sus galerías se confirman en una transacción. Se mantiene un vínculo
por ID interno estable de la intranet. Se puede vincular expresamente un ID heredado
sin cambiar su enlace, siempre que no esté asociado a otra ficha.

Se instala `portal_intranet_sync` y `properties.price_on_request`; la vista pública
representa ese indicador como precio null. Los anuncios anteriores comienzan con el
indicador desactivado. No hay importación masiva, reasignación por posiciones ni envíos
automáticos durante el despliegue. Los tipos canónicos participan en los filtros aunque
el título comercial no contenga el tipo.

El GET de imágenes exige que la foto esté en la instantánea de una publicación visible.
El servidor pide el archivo a `INTRANET_WEB_BRIDGE_URL` con el secreto, nunca desde el
navegador. El bridge verifica selección y estado, y entrega solo imágenes. Los DNI y
documentos privados no se exponen. Las tarjetas de WhatsApp admiten exclusivamente la
ruta de foto del propio portal además del hosting público ya autorizado.

El inicio consulta las diapositivas aprobadas. Conserva sus imágenes actuales hasta
recibir una portada válida. Los botones solo admiten destinos internos del portal;
los textos se renderizan como texto y las descripciones de inmuebles se escapan.

Configuración solo en Production: `INTRANET_WEB_SYNC_TOKEN`,
`INTRANET_WEB_BRIDGE_URL`. Las variables DB actuales no se modifican. Instalación
explícita: `PORTAL_DB_CONFIG=/ruta/privada.json node scripts/install-intranet-sync.mjs --apply`.
El script de instalación no se ejecuta como parte del build.

La copia local cifrada previa contiene 15 tablas y 3 vistas; no incluye multimedia.
SHA-256: `604c046aeded8c0e22f78beb3056939325c1e1285c59370ba93a9c85b78e4de4`.
La entrega no cambia la exclusión de respaldo externo y usuario MySQL exclusivo
decidida por el usuario en fase 3.

Pruebas: unitarias existentes, fase 3 y nuevas de autenticación/enlaces/imágenes;
build Vite; integración real entre dos bases locales con venta, alquiler, vínculo
heredado, suspensión, reintento y portada. Datos ficticios y almacenamiento HTTPS
en memoria. Evidencia y operación de usuario en el repositorio de intranet:
[Portal web, fase 4](https://github.com/darkcystian15-rgb/inmobiliaria-alfaro/blob/main/docs/portal-web-fase4.md).

Para recuperar código, conservar el despliegue anterior y la tabla de vínculos.
La aplicación anterior puede coexistir con el esquema aditivo; no borrar asociaciones
ni anuncios generados para volver a desplegar. Los cierres se retiran expresamente
desde la intranet; todavía no hay sincronización automática de cierres ni reintentos
en segundo plano. Los fallos quedan visibles para reintento manual.

## Gestión del catálogo previo — 21 de octubre de 2026

GET autenticado `?admin=existing` (opcional `id`) devuelve únicamente campos
públicos de anuncios legados aprobados, incluidos suspendidos/retirados, fotografías
actuales y hash de versión. No exige ficha interna. La intranet puede editar,
actualizar, suspender o republicar mediante POST `kind=legacy`, conservando ID y
origen. La asociación con un inmueble interno sigue siendo opcional y explícita.

El receptor nunca inserta propiedades para esta operación. Rechaza cambios sobre
anuncios ya adoptados por el flujo nativo y cambios con hash remoto antiguo. Resuelve
las imágenes por ID existente; no acepta URLs nuevas enviadas por el navegador.
Las entregas se registran con clave `legacy:{id}` y sin propiedad asociada en la
columna única, permitiendo una adopción posterior voluntaria. No hay migración.
El ID 0 identifica la portada previa. Suspender/retirar no exige completar datos.
Publicar exige contenido público válido; DNI, tasación y visitas son requisitos
exclusivos del flujo de fichas nuevas de intranet.

## Información adicional y mapas

La instantánea admite additionalInfoMode (preserve/replace), additionalInfo con
bloques title/content, y map con mode preserve/none/exact/approximate y coordenadas.
La ausencia de estos campos conserva el contenido anterior. Ambos apartados son
opcionales; se validan solo cuando se activan/editaron. replace vacío retira bloques.
Se reutiliza mas_info, reemplazando la lista dentro de la transacción y en orden;
títulos de 50 y contenidos escapados de hasta 1000 caracteres, hasta 20 bloques.

map preserve no sobrescribe coordenadas al actualizar o adoptar un anuncio. none
oculta el mapa; exact publica un punto válido; approximate redondea a dos decimales
antes de guardarlo y la API pública vuelve a aplicar esa precisión. El modo se
registra en la clave map:{id} del almacén instalado, sin property_id asociado.
La API de ficha devuelve map_mode y coordenadas efectivas; el sitio rotula los
puntos aproximados y no muestra mapas ocultos ni coordenadas inválidas.
GET administrativo extras requiere autenticación e ID concreto y permite cargar
los bloques/mapa de un anuncio adoptado por una ficha interna. Los anuncios legados
incluyen estos campos en su revisión. Sin migraciones ni cambios masivos de datos.
