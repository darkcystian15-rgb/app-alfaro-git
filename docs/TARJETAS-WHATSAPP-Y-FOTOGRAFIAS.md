# Fotografías y tarjetas para WhatsApp

## Presentación de fotografías

`PropertyImage` aplica a todas las imágenes que muestran tarjetas y galería una firma
Alfaro en una franja propia, con borde rojo. Las fotos originales y sus logos no se
sobrescriben. No hay detección automática de marcas de agua ni un proceso nuevo de carga.
Cualquier URL nueva que llegue al catálogo existente recibe este formato al mostrarse.
Los videos mantienen sus controles y pueden ampliarse en la galería.

## Tarjeta compartida por inmueble

`/api/property-share?id=ID` genera HTML de lectura con título, precio, ubicación y datos
reales. `format=image` devuelve JPEG 1200×630; `format=download` entrega el mismo diseño
como archivo descargable. Para crawlers conocidos, la ruta pública existente
`/propiedades/resumen/ID` se reescribe hacia ese HTML. Los visitantes humanos conservan
la ficha React. La respuesta incluye URL canónica, `og:image`, dimensiones, tipo MIME,
alternativa textual y Twitter Card. La portada tiene una imagen social estática propia.

El único acceso nuevo a MySQL es un SELECT parametrizado de campos públicos en
`properties`. No hay migración ni escritura. El generador remoto acepta únicamente
HTTPS del host de imágenes ya observado en el catálogo, sin credenciales, puertos
alternativos ni redirecciones. Limita tiempo, bytes y píxeles. Una imagen no disponible
produce un diseño alternativo de marca, sin publicar detalles internos del error.

La caché de la función dura cinco minutos y tiene límite de entradas. La caché CDN también
es breve; WhatsApp y otras redes pueden conservar sus propias versiones durante más tiempo.
Las pruebas técnicas de crawler no equivalen a enviar mensajes ni a garantizar el recorte
exacto que decida cada versión de WhatsApp. No se enviaron mensajes reales como prueba.

El JPG es una pieza nueva para compartir. No cambia el archivo original de la fotografía.
El PDF se genera bajo demanda en el navegador y conserva los textos y enlaces de la
galería; si el host externo impide cargar una imagen por CORS, su enlace original se mantiene.

## Referencias técnicas

- [Open Graph Protocol](https://ogp.me/).
- [Rewrites en Vercel](https://vercel.com/docs/routing/rewrites).
- [Configuración estática de Vercel](https://vercel.com/docs/project-configuration/vercel-json).

## Tipografía estable en servidor

El renderizador incluye DejaVu Sans y su licencia; convierte los textos a trazos
vectoriales antes de generar el JPEG. No depende de que el runtime de Vercel tenga
fuentes del sistema ni descarga fuentes de terceros durante la solicitud.
