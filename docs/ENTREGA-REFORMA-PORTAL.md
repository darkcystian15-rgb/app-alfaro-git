# Entrega de reforma del portal: fases 1 y 2

Fecha: 20 de octubre de 2026. Destino único: `darkcystian15-rgb/app-alfaro-git`.
Base: `0650d692beb9094fef037c11d9a0a665369504e8`.
Rama: `feat/portal-reforma-fases-1-2`.

## Implementación

Se integró el overlay `reforma_darkcystian_fases_1_2_codex.zip` después de leer
`CODEX-LEER-PRIMERO.md` y sus otros documentos. La implementación se hizo en un
clon independiente, con origin de lectura/escritura de Darkcystian. El checkout de
Cystian, sus cambios locales y la intranet se conservaron intactos.

La portada incorpora banner, filtros opcionales, búsqueda cancelable y estados de
carga/error/vacío. El catálogo elimina los ejemplos ficticios y usa el API existente;
comparte tarjetas con destacados, con paginación, precios, enlace a ficha y WhatsApp.
Login, registro y administración simulados se sustituyen por información pública.

Adaptaciones al ZIP: conservar estilos globales preexistentes, el ancla de redes,
las páginas y galerías; evitar un main anidado; reemplazar fotos rotas, distinguir
precios ausentes de cero, normalizar símbolos de moneda y mostrar errores sin
mensajes técnicos internos. Se añaden pruebas reproducibles con Playwright como
dependencia exclusiva de desarrollo. No se cambian las APIs ni las credenciales.

## Validación local

- Instalación limpia con `npm ci --no-audit --no-fund` aprobada fuera del sandbox.
- `npm test`: cinco casos aprobados (contrato/filtros, errores, cancelación, moneda y WhatsApp).
- Build Vite aprobado. Permanecen advertencias históricas de Browserslist y tamaño del bundle.
- Navegador: 375/768/1440 px, sin desbordamiento horizontal en Inicio, menú móvil,
  búsqueda vacía y combinada, paginación, seis destacados, enlace WhatsApp, imagen
  rota, soles, cero resultados, error/reintento y JSON inválido.
- Doce rutas públicas comprobadas, incluida una ficha real, Servicios, Blog,
  Asesores, Contacto, Historia, Acerca de, Vende o alquila y las tres rutas de acceso.
- Sin errores JavaScript no capturados. No se enviaron formularios ni escrituras de negocio.
- `git diff --check` aprobado; APIs, `.env*`, DB y migraciones excluidos del diff.

La primera prueba local usó como referencia de compatibilidad el portal histórico
`https://app-alfaro-git.vercel.app`, sin escrituras. Una vez identificada la cuenta
correcta de Vercel, se repitió contra `https://app-alfaro-git-smoky.vercel.app`
(Darkcystian), mediante una ruta GET de Playwright. No se cambia el origen de APIs
del producto ni se guardan registros del catálogo en Git. Los resultados remotos
se registran después de validar cada despliegue.

## Reproducción

Requiere Node 20 o superior para las herramientas de navegador.

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run dev -- --host 127.0.0.1 --port 4173
```

En otra terminal, indicar el origen público de lectura para la prueba local:

```sh
PORTAL_BASE_URL=http://localhost:4173 PORTAL_READONLY_API_ORIGIN=https://app-alfaro-git-smoky.vercel.app npm run test:browser
```

`PORTAL_CHROMIUM` permite un binario existente y `PORTAL_ARTIFACTS` cambia la carpeta
de evidencias (por defecto `/tmp/darkcystian-review`). Las respuestas sintéticas se
limitan a un contexto de navegador aislado; no se introducen inmuebles ficticios
en el producto. Para un despliegue, omitir `PORTAL_READONLY_API_ORIGIN`.

## GitHub y Vercel

Proyecto verificado: `puma19/app-alfaro-git`, ID `prj_W5ADa1iBP42vjncafADM4jm8QBWk`.
Vínculo Git: `darkcystian15-rgb/app-alfaro-git`, Production desde `main`.
Dominio propio del fork: `https://app-alfaro-git-smoky.vercel.app`.
No utilizar el proyecto homónimo vinculado a Cystian ni el de la intranet.

Commit de implementación, Preview, Production y verificaciones remotas: pendientes
de completar tras subir la rama y revisar sus despliegues. No se afirma una publicación
antes de comprobar el SHA y estado READY.

## Pendientes fuera de estas fases

Las fases 3 y 4 están documentadas en `HANDOFF-FASES-3-4.md`, sin implementación.
Persisten hallazgos históricos de seguridad del documento original: mantenimiento
coordinado de secretos, HTML de BD, errores internos de APIs y registros de formularios.
No se rotaron credenciales ni se alteraron bases de datos o integraciones.
