# Portal Inmobiliaria Alberto Alfaro

Portal público de **darkcystian15-rgb/app-alfaro-git**, construido con React, Vite y
las funciones Vercel existentes. Sitio: https://app-alfaro-git-smoky.vercel.app.

La entrega vigente es el rediseño conjunto de las nuevas fases 1 y 2: portada,
catálogo, búsqueda múltiple, fotografías de marca, ficha, favoritos locales,
comparación y tarjetas para compartir por WhatsApp. La fase 3 queda por planear.

## Documentación vigente

- [Entrega, pruebas y despliegue](docs/ENTREGA-PORTAL-VISUAL-V2.md).
- [Alcance de las fases 1 y 2](docs/PLAN-PORTAL-VISUAL-V2.md).
- [Fotografías, PDF y tarjetas de WhatsApp](docs/TARJETAS-WHATSAPP-Y-FOTOGRAFIAS.md).
- [Transferencia para la fase 3](docs/HANDOFF-FASE-3-PORTAL.md).

Los documentos del primer ZIP se conservan como historial. No describen todos los
cambios visuales de esta nueva entrega.

## Desarrollo y pruebas

Usar Node 24, igual que el proyecto Vercel.

```sh
npm ci
npm test
npm run build
npx playwright install chromium
PORTAL_BUILD_DIR=./dist npm run preview:readonly
```

Abrir http://127.0.0.1:4180. Esta vista sirve la compilación local y consulta únicamente
APIs GET del portal público de Darkcystian. El generador social se prueba con el mismo
código y un lector de datos públicos, sin conectar directamente a MySQL.

```sh
PORTAL_BASE_URL=http://127.0.0.1:4180 npm run test:browser
```

`npm run dev` inicia solo Vite; las funciones Vercel necesitan su propio entorno.
No copiar credenciales reales para hacer pruebas ni ejecutar migraciones al desplegar.
La configuración MySQL existente en Vercel se mantiene con alcance Production.

## Límites

Este repositorio no administra usuarios de la intranet ni modifica su base de datos.
Favoritos y comparación se guardan en este navegador. Las consultas preparadas para
WhatsApp requieren que el visitante las revise y envíe; no se registran en el servidor.
Las fotos originales no se sobrescriben. El endpoint gráfico nuevo es de solo lectura.
