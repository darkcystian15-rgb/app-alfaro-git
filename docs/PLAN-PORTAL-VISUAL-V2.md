# Portal Alfaro — nuevas fases 1 y 2 juntas

Destino exclusivo: `darkcystian15-rgb/app-alfaro-git`.
Base anterior: `475edb4638ac150d39ab15dbfeb02fb7232a6c61`.
Rama de implementación: `feat/portal-experiencia-visual-v2`.

El usuario autorizó implementar y desplegar ambas fases y pidió documentación Markdown.
La fase 3 se planeará después. No se modifica Cystian, la intranet, esquemas,
registros, migraciones o credenciales.

## Fase 1 — identidad, fotografía y búsqueda

- Dirección visual Alfaro con rojo, grafito, blanco cálido, títulos de dos familias,
  fotografía protagonista y arquitectura de navegación consistente.
- Portada con imágenes controlables, pausa, acceso al catálogo y destacados con navegación
  horizontal y acceso a todos los registros destacados. Se recupera la capacidad perdida.
- Selección múltiple y distritos por departamento; búsqueda interna y filtros opcionales.
- Búsquedas compartibles por URL, moneda explícita, rangos de precio y área, ordenación,
  filtros activos y paginación numérica.
- Tarjetas con dirección y localidad separadas, características reales, favoritos,
  comparación, contacto con texto y acceso a ficha.
- Marco y firma de marca automáticos para las fotografías al presentarlas. La firma ocupa
  su propia franja y no tapa ni intenta detectar/eliminar logos que ya trae la foto.
- Copias WebP optimizadas de los tres recursos originales de portada, conservando los PNG.

## Fase 2 — ficha, decisiones y compartir

- Ficha reorganizada, galería con miniaturas y ampliación mediante dialog nativo, navegación
  de teclado, soporte de video, descripción y distribución saneadas, dimensiones,
  condiciones económicas, información adicional y mapa cuando ya existen coordenadas.
- Contacto contextual, barra móvil, regreso a los filtros y página de origen.
- Favoritos y comparador de hasta tres inmuebles, persistidos solo en el navegador.
- PDF con enlace/QR correcto a Darkcystian, descripción, distribución y galerías; JPG de marca.
- Metadatos Open Graph servidos para crawlers en el enlace de cada inmueble, con imagen
  JPEG real 1200×630 generada desde sus datos existentes.
- Apariencia común de páginas institucionales conservando contenido y destinos.
- Noticias consume el API Vercel existente. Ofrecer inmueble prepara un WhatsApp; no anuncia
  registros o envíos inexistentes ni introduce persistencia de datos.

## Criterios de aprobación

Compilación, pruebas de contratos y seguridad, navegador 375/768/1440, contraste y lectura,
funciones completas, descargas reales, acceso de crawler sin ejecutar React, comparación
visual con las versiones anteriores y vínculo exacto entre SHA de GitHub y Vercel.
Los detalles ejecutados y resultados se registran en `ENTREGA-PORTAL-VISUAL-V2.md`.
