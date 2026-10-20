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
de evidencias (por defecto `/tmp/darkcystian-review`). `PORTAL_HEADERS_FILE` permite
un archivo privado de encabezados para un Preview protegido; se envían solo al
origen comprobado, nunca a proveedores de imágenes ni se guardan en Git. Las respuestas sintéticas se
limitan a un contexto de navegador aislado; no se introducen inmuebles ficticios
en el producto. Para un despliegue, omitir `PORTAL_READONLY_API_ORIGIN`.

## GitHub y Vercel

Proyecto verificado: `puma19/app-alfaro-git`, ID `prj_W5ADa1iBP42vjncafADM4jm8QBWk`.
Vínculo Git: `darkcystian15-rgb/app-alfaro-git`, Production desde `main`.
Dominio propio del fork: `https://app-alfaro-git-smoky.vercel.app`.
No utilizar el proyecto homónimo vinculado a Cystian ni el de la intranet.

Primera implementación: `64f4e4806352f50425105bc8cb176b2bcb663306`.
PR: https://github.com/darkcystian15-rgb/app-alfaro-git/pull/1.
Preview Git inicial: https://app-alfaro-e5kdo52ub-puma19.vercel.app,
`dpl_BjX7kexqZgv6omiAhXJetafPUy8C`, READY.

La configuración existente tiene variables MySQL solo en Production. Por eso el
Preview estándar devuelve HTTP 500 en su API. No se alteraron ni copiaron esas
credenciales. La interfaz del Preview se validó con una ruta GET de Playwright al
catálogo público de Darkcystian, sin modificar el producto. Para validar sus APIs
reales se creó un despliegue con `--prod --skip-domain`: utiliza la configuración
existente de Production y conserva el dominio público en el despliegue anterior.
La primera prueba remota identificó una carrera del indicador de búsqueda; se
ajustó el inicio de carga al evento de búsqueda y la versión corregida pasó la
comprobación completa antes del merge.

### Publicación comprobada

- Código corregido: `09a785dbfd698d51ed654cf65d286c0d79436a0e`.
- Preview Git corregido: https://app-alfaro-6p2il4i84-puma19.vercel.app,
  `dpl_GofaHQUpg4s6Hyt97mFu4uqjcr4k`, READY. Conserva la limitación previa de variables MySQL.
- Validación completa previa a publicación: https://app-alfaro-gcffjr1cq-puma19.vercel.app,
  `dpl_G1bAMe9oqwU31VVmtYMLSBwtd7KG`, READY, configuración Production sin asignar dominios.
- PR #1 fusionado. Commit de merge en main: `e6d77e68bffe226e6562eccfe954bb3b8e090d3c`.
- Production verificada: https://app-alfaro-git-smoky.vercel.app.
- Deployment: `dpl_626cbqyhNDViWJbLCrPUQUbUncpM`, READY,
  https://app-alfaro-4t3a7tlwt-puma19.vercel.app, del SHA de merge indicado.
- Dominio y vínculo Git cotejados mediante la API Vercel del proyecto exclusivo de Darkcystian.
- En Production pública se repitió la prueba completa de navegador sin redirigir las APIs:
  375/768/1440 px, doce rutas adicionales a Inicio, filtros, catálogo, ficha, paginación,
  WhatsApp, monedas y escenarios de fallo aislados. Cero errores JavaScript no capturados.
- GET de catálogo, destacados, opciones y detalle existente: HTTP 200. Conteos antes/después:
  64 inmuebles y 8 destacados; la portada muestra como máximo seis, sin eliminar registros.

Este registro se incorpora mediante un commit exclusivamente documental posterior a la
publicación comprobada. Ese commit no cambia el código validado; su despliegue automático
se coteja con main y con las mismas referencias de assets del despliegue probado.
La evidencia agregada está en `EVIDENCIA-VERIFICACION-FASES-1-2.json`.
No se guardan registros de inmuebles, capturas privadas o credenciales en Git.

## Pendientes fuera de estas fases

Las fases 3 y 4 están documentadas en `HANDOFF-FASES-3-4.md`, sin implementación.
Persisten hallazgos históricos de seguridad del documento original: mantenimiento
coordinado de secretos, HTML de BD, errores internos de APIs y registros de formularios.
No se rotaron credenciales ni se alteraron bases de datos o integraciones.

## Límites de la verificación y compatibilidad heredada

Las comprobaciones de rutas confirman renderizado y navegación; no certifican envíos
de formularios ni ejecutan acciones externas. Se conservan las llamadas Netlify heredadas
en Noticias y Vende o alquila: en Vercel sus destinos responden HTML, por lo que el
listado de noticias y el envío de ese formulario requieren mantenimiento posterior.
Este hallazgo ya existe en el despliegue base; no se modificaron esas integraciones.
El Preview estándar necesita configuración de BD en Preview para probar sus APIs
sin la alternativa aislada descrita. Production funciona con su configuración existente.
