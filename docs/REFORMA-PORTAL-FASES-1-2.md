# Portal Alfaro — reestructuración y rediseño (fases 1 y 2)
Fecha: 2026-10-20
Proyecto único: `darkcystian15-rgb/app-alfaro-git`.
No tocar: `Cystian/app-alfaro-git`, la intranet `darkcystian15-rgb/inmobiliaria-alfaro` ni bases de datos.

## Fase 1 — cambios preparados
- `src/services/properties.js`: centraliza las consultas a `/api/getProperties`, comprueba estado HTTP y estructura del JSON.
- `src/config/site.js`: centraliza el número de WhatsApp y formato de moneda en las tarjetas nuevas.
- `src/pages/Properties.jsx`: elimina las propiedades ficticias y consume la API de lectura existente.
- `src/components/PropertyCard.jsx`: tarjeta compartida para catálogo y destacados; mantiene compatibilidad con props individuales antiguas.
- `src/components/ResultsGrid.jsx`: estados de error, carga, vacío y paginación simple.
- `src/components/FeaturedProperties.jsx`: reutiliza las tarjetas, conserva la consulta `featured=true` y muestra un máximo de seis destacados. Se sustituye el carrusel automático por una cuadrícula accesible.
- `src/pages/Home.jsx`: estructura los bloques y gestiona búsquedas cancelables.
- `src/pages/Login.jsx`, `Register.jsx`, `Admin.jsx`: reemplaza pantallas simuladas por mensajes informativos hasta que exista integración de autenticación; no se incorporan rutas privadas en el portal.

## Fase 2 — cambios preparados
- `src/components/SearchBanner.jsx`: hero sobrio con filtros accesibles y búsqueda sin obligación de completar tres campos.
- `src/styles/main.css`: sistema visual aditivo con fondo, tipografía, jerarquía de títulos, tarjetas y accesibilidad.
- `src/Layout/MainLayout.jsx`: simplifica estructura del layout y corrige contenido literal de comentario JSX.

## Compatibilidad
- NO se modifica ninguna ruta pública, función API ni tabla MySQL.
- La consulta `featured=true` se conserva.
- Las páginas de resumen `/propiedades/resumen/:id` quedan intactas.
- Las otras páginas institucionales, blog, contactos y asesores quedan intactas.
- En esta primera entrega se privilegian estabilidad y un diseño renovado de portada y catálogo; el rediseño total de todas las páginas requiere pruebas visuales y puede continuarse incrementalmente.

## Hallazgos de seguridad pendientes para mantenimiento controlado
1. Rotar contraseñas publicadas anteriormente en `netlify/functions/db.js` y eliminar el secreto del historial remoto con un proceso coordinado; no resetear la contraseña activa sin conocer consumidores.
2. `.env` está versionado: contiene nombres de configuraciones potencialmente sensibles. Revisar su contenido localmente y revocar cualquier token comprometido sin exponerlo.
3. `api/getPropertyDetails.js` y otras APIs aún devuelven textos internos `error.message`: sanitizar antes de producción.
4. `api/sendForm.js` registra datos completos del formulario: limitar logs de PII y revisar política CORS.
5. `PropertyDetails.jsx` usa `dangerouslySetInnerHTML` con contenido BD: sanitizar con una librería mantenida o usar texto seguro antes de dar confianza al HTML almacenado.

## Checklist de validación previo al merge
- Ejecutar `npm ci` y `npm run build` desde la raíz del repositorio completo.
- Confirmar que no hay errores de navegador en Inicio, Propiedades, Resumen, Servicios, Blog, Asesores y Contacto.
- Confirmar consultas API (`/api/getProperties`, `?featured=true`, `/api/get-options`).
- Probar búsquedas con filtros vacíos, combinados y sin coincidencias.
- Probar a 375, 768 y 1440 px.
- Verificar WhatsApp, precios en soles/dólares, imágenes ausentes, navegación y enlaces.
- Comparar la cantidad de inmuebles antes/después (no se escriben datos).
- Validar Vercel Preview y comprobar que corresponde al SHA correcto antes de desplegar Production.

## Fases 3 y 4 — reservadas a Codespaces/Codex
- Fase 3: nuevo esquema, relaciones y migración controlada con backups.
- Fase 4: interconexión mediante API autorizada con intranet, mapeo de ID y estados de publicación.

## Estado de entrega
Verificación local: 12 archivos JS/JSX pasaron análisis de sintaxis con TypeScript; no se ejecutó `npm run build` porque no se dispone del repositorio completo y sus dependencias en este entorno.

Este paquete es un **overlay** (archivos de reemplazo) preparado fuera de GitHub. En esta sesión GitHub respondió HTTP 403 al intentar crear rama o archivo; no hay commit ni despliegue confirmado. Vercel se ha instalado pero sus acciones no estaban accesibles en las herramientas de esta sesión.
