# Avance de fase 3 — seguridad, datos y operación del portal

Fecha de corte: 21 de octubre de 2026, UTC.
Repositorio exclusivo: [darkcystian15-rgb/app-alfaro-git](https://github.com/darkcystian15-rgb/app-alfaro-git).
Portal: https://app-alfaro-git-smoky.vercel.app.

## Estado y alcance autorizado

La fase 3 cuenta con base independiente integrada, medidas de seguridad, conciliación
conservadora de catálogos, restauración local comprobada y una herramienta privada
para gestionar publicaciones. No se declara saneamiento comercial completo: quedan
datos que requieren una fuente o decisión comercial verificable.

El usuario indicó en esta sesión **omitir el respaldo externo y el usuario MySQL
exclusivo**, completar los demás trabajos posibles, documentar el avance y desplegar
con Git, Vercel y Codespaces alineados. Esos dos puntos se excluyen del cierre de esta
entrega por decisión expresa; no se presentan como implementados. La restauración
local sí se realizó. La sincronización de la intranet continúa siendo fase 4.

La base original de Cystian y la intranet no se modificaron. El checkout original
del workspace conserva sus cambios ajenos. La copia de trabajo de este fork se
encuentra en `/workspaces/app-alfaro-git/portal-dark`, con remoto propio a Dark.

## Avance acumulado

| Área | Resultado |
| --- | --- |
| Base independiente | `inmobi16_portal`, 64 inmuebles y sus IDs preservados; 8 destacados. |
| Lecturas públicas | Catálogo, detalle, galería, información y compartir usan vistas públicas con aprobación y respuestas `no-store`. |
| Seguridad de código | Diagnósticos heredados retirados con 410; errores sin detalles MySQL; se retiran registros completos de formularios y credenciales fijas de Netlify. |
| Secretos en Git | `.env` retirado del seguimiento; configuración y copias privadas ignoradas. Esto no borra el historial ni revoca credenciales. |
| Catálogos | 64 modalidades, 64 distritos y 54 tipos asociados sin cambiar los títulos ni los campos heredados. |
| Publicaciones | Herramienta privada autenticada por MySQL, estado esperado, bloqueo de fila, motivo, responsable declarado y cuenta autenticada en historial transaccional. |
| Restauración | 14 tablas y 3 vistas restauradas en MySQL 8.0 local aislado; contenido completo de todas las filas comparado. |
| Presentación | El detalle heredado muestra «Área por consultar» cuando no hay metraje válido y utiliza la moneda real para mostrar el precio. |

Las medidas de seguridad anteriores provienen de `cc37f9d`, preparado en el
[PR #4](https://github.com/darkcystian15-rgb/app-alfaro-git/pull/4). Esta continuación
añade conciliación, operación, restauración reproducible y documentación actualizada.

## Conciliación aplicada y revisión de datos

Se creó y verificó una copia local cifrada previa a las escrituras. Hash SHA-256:
`e7cd7a24a327f8e0c3b8f3d8fb8e72cb9479ddf372b4b1abf99865180a2b6f4d`.
La copia y su clave no se publican. La restauración de esta copia se comprobó antes
de aplicar la conciliación. No incluye descarga/restauración de fotografías remotas,
configuración de hosting ni recuperación integral del servicio.

Las asignaciones de modalidad y distrito usan coincidencia única del nombre ya
utilizado en la ficha. Los tipos se asignan cuando el título identifica explícitamente
una categoría existente. Los anuncios industriales, edificios, usos mixtos y locales
sin categoría inequívoca se dejan sin equivalencia antes que forzar una decisión.
El ensayo inicial se revirtió; después se aplicó la conciliación autorizada. Una
segunda ejecución confirmó cero asignaciones adicionales. Se preservan IDs, títulos,
precios, monedas, direcciones, metrajes, fotos y estados de publicación.

| Comprobación | Antes | Después |
| --- | ---: | ---: |
| Tipos sin correspondencia | 64 | 10 |
| Modalidades sin correspondencia | 64 | 0 |
| Distritos sin correspondencia | 64 | 0 |
| Monedas canónicas ausentes | 0 | 0 |
| Aprobaciones inválidas | 0 | 0 |
| Fichas sin registro de publicación | 0 | 0 |
| Galerías sin padre histórico vigente | 6 | 6, conservadas fuera de vistas públicas |
| Áreas cero/ausentes | 4 | 4, pendientes de medición verificable |
| Direcciones vacías | 2 | 2, se conserva la ubicación pública existente |

### Casos que requieren una fuente o decisión comercial

- **Tipos:** IDs 3, 19, 24, 25, 26, 38, 50, 56, 62 y 64. El catálogo no expresa
  inequívocamente su uso actual. No se crearon categorías ni equivalencias comerciales
  por suposición; el filtro heredado mantiene su comportamiento.
- **Áreas:** IDs 24, 34, 51 y 61. La ficha 34 describe bloques de oficina de 70 y
  135 m², pero también tiene información adicional de un almacén de 300 m²: no hay
  evidencia para convertir esos números en el área principal. Las otras fichas no
  aportan un metraje inequívoco. No se sumaron bloques ni se inventaron superficies.
- **Direcciones:** IDs 4 y 54. Las descripciones contienen ubicaciones referenciales,
  pero no prueban una dirección exacta ni su autorización pública. Se mantiene la
  consulta al asesor y se registra esa decisión en `migration_issues`.
- **Galería:** IDs 10, 13, 14, 15, 346 y 469 apuntan a padres heredados inexistentes
  (10, 11, 40 y 0). Los nombres de fotos no prueban una relación con las fichas
  actuales. Se conservaron íntegros, se documentó la cuarentena y siguen excluidos
  de las vistas públicas. No se borraron ni se reasignaron a otros inmuebles.

Estas decisiones se registraron privadamente en `migration_issues`; no equivalen a
haber obtenido los datos faltantes ni a resolver comercialmente todos los casos.
Los empates de orden de galería se resuelven mediante orden e ID en las lecturas,
sin renumerar ni borrar imágenes.

## Publicación y responsabilidad

Consultar [Operación privada de publicaciones](OPERACION-PUBLICACIONES.md).
La herramienta permite `pending_review`, `published`, `suspended` y `withdrawn`.
Publicar exige confirmar autorización de datos/fotos; cualquier cambio requiere
responsable y motivo, y falla si el estado consultado ya cambió. Publicación y evento
se confirman juntos; un error de historial revierte todo el cambio.

La cuenta MySQL existente autentica al ejecutor; el nombre en `PORTAL_OPERATOR` es
declarado, no un nuevo sistema de cuentas individuales. El rol operativo es administrador
autorizado del portal; la designación nominal se solicitó al usuario y queda pendiente
si no se ha recibido respuesta. No se atribuye una aprobación a una persona inexistente.
No se abrió una administración pública ni se cambió el estado de las 64 publicaciones
reales para ensayar el flujo. Los cuatro estados se probaron en la restauración local.

## Consumidores, configuración y credenciales históricas

Inventario comprobado por código y configuración del proyecto Dark:

| Consumidor | Estado y alcance |
| --- | --- |
| Vercel `app-alfaro-git`, equipo `puma19` | Vinculado al fork Dark, rama de producción `main`, variables MySQL solo en Production, base independiente verificada. |
| APIs públicas y tarjetas sociales | Lectura mediante vistas públicas; preservan contratos e IDs. |
| Formularios visibles de contacto/oferta | Preparan mensajes para WhatsApp; el visitante decide el envío. No necesitan `VITE_RECAPTCHA_KEY`. |
| Formulario reCAPTCHA heredado | Componente sin uso en las rutas actuales; no se copian secretos del `.env` al cliente ni se amplían variables MySQL a Preview. |
| Netlify heredado | Conexión por variables; no se desplegó Netlify ni se comprobó su configuración operativa. |
| Fotografías | Se mantienen URLs y archivos originales; no se modificó el hosting multimedia. |

La rotación de credenciales históricas **no se ejecutó**: la cuenta heredada puede
tener consumidores externos y no hay inventario operativo completo de Cystian/Netlify
ni control de su configuración en este alcance. Cambiar su contraseña desde este
fork podría interrumpir otros sistemas. Omitir el usuario exclusivo no autoriza a
romper esas conexiones. Se necesita identificar consumidores y coordinar al dueño
de la cuenta. Tampoco se reescribió el historial de Git. Este punto continúa abierto,
distinto de los dos requisitos expresamente excluidos por el usuario.

## Verificaciones ejecutadas

- `npm test`: tres archivos de pruebas existentes aprobados.
- `npm run test:phase3`: auditoría, cifrado y flujo de publicación aprobados.
- `npm run test:phase3:integration`: restauración completa del respaldo lógico,
  conciliación repetible, suspensión, retiro, vuelta a revisión, republicación,
  rechazo de estado desactualizado y requisito de aprobación comprobados en MySQL local.
- `npm run test:database`: 64 fichas, 8 destacados, filtros, todas las galerías e
  informaciones, APIs editoriales, HTML e imagen social, exclusión de campos privados
  y retirada de todas las vistas comprobados sobre la base local restaurada.
- `npm run build -- --outDir /tmp/alfaro-dark-fase3-build`: correcto. Permanecen
  avisos de Browserslist y bundle principal mayor de 500 kB.
- Auditoría de producción de solo lectura después de la conciliación: 64 publicaciones,
  cero referencias nuevas discrepantes y resultados de la tabla anterior.
- Navegador local con APIs públicas de solo lectura: navegación institucional, catálogo,
  filtros, favoritos, comparación, ficha, galería por teclado, PDF y JPG reales,
  vista móvil, fallos HTTP, imágenes rotas y saneamiento HTML aprobados. Cero errores
  de ejecución y cero solicitudes de escritura.
- No se enviaron formularios ni mensajes reales.

La evidencia de navegador y despliegue se incorporará tras comprobar la publicación.
Un build o un check Preview aprobado no se presenta como producción comprobada.

## Evidencias y continuidad

- [Conciliación aplicada: conteos anteriores y posteriores](evidencia-fase3/CONCILIACION-APLICADA-2026-10-21.json).
- [Restauración local y flujo de publicación](evidencia-fase3/RESTAURACION-Y-FLUJO-2026-10-21.json).
- [Navegador sobre compilación local](evidencia-fase3/NAVEGADOR-LOCAL-2026-10-21.json).
- [Entrega previa de seguridad](CONTINUIDAD-FASE-3-SEGURIDAD-2026-10-21.md).
- [Avance anterior de base e interfaz](AVANCES-PORTAL-FASE-3-2026-10-21.md).

Los documentos anteriores conservan su fecha histórica. Cuando indican que la
restauración no se probó o que las referencias seguían vacías, describen el estado
anterior; este documento y las evidencias nuevas registran la continuación actual.

Para completar el saneamiento comercial faltan las decisiones de los diez tipos,
mediciones, direcciones autorizadas y, si procede, la recuperación de antecedentes
de las seis galerías. La rotación depende de la coordinación de consumidores.
La entrega técnica no se confunde con el cierre de esos pendientes.
