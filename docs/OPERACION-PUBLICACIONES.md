# Operación privada de publicaciones

Portal: `darkcystian15-rgb/app-alfaro-git`. Base autorizada: `inmobi16_portal`.
Fecha: 21 de octubre de 2026, UTC.

La herramienta `npm run publications` requiere una conexión MySQL autenticada con
configuración privada fuera de Git. No se ha abierto un panel ni un endpoint público
de escritura, y no depende de usuarios o sesiones de la intranet.

## Responsabilidad y autorización

El administrador autorizado del portal ejecuta la herramienta. El nombre de la
persona responsable debe proporcionarse en `PORTAL_OPERATOR`; el motivo del cambio
en `PORTAL_CHANGE_REASON`. El registro incluye la cuenta MySQL autenticada mediante
`CURRENT_USER()` y la fecha UTC. El nombre declarado no equivale a una cuenta personal:
se conserva la cuenta MySQL existente por decisión del usuario. No distribuir esa
configuración a visitantes ni a personas sin permiso de administración.

Antes de publicar, el responsable verifica operación, precio y moneda, ubicación
pública autorizada, derechos y consentimiento de fotografías, y datos de contacto.
Una ficha sin metraje confirmado no debe publicitar un metraje inventado; la ficha
puede conservar el dato como pendiente y mostrarlo como consulta.

## Comandos

`PORTAL_DB_CONFIG` apunta a un JSON privado con `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD` y `DB_NAME`. La herramienta rechaza otra base. No pasar contraseñas
por argumentos ni guardar el JSON en Git. Estos ejemplos son instrucciones de
operación; no se ejecutaron cambios de estado sobre publicaciones reales.

```sh
PORTAL_DB_CONFIG=/ruta/privada/portal.json npm run publications -- list

PORTAL_DB_CONFIG=/ruta/privada/portal.json \
PORTAL_OPERATOR='Nombre del responsable' \
PORTAL_CHANGE_REASON='Datos y fotografías revisados y autorizados' \
npm run publications -- change 123 pending_review published --apply --confirm-public-data

PORTAL_DB_CONFIG=/ruta/privada/portal.json \
PORTAL_OPERATOR='Nombre del responsable' \
PORTAL_CHANGE_REASON='Retiro temporal solicitado por el propietario' \
npm run publications -- change 123 published suspended --apply
```

Sustituir `123` por el ID real tras consultar el estado. `pending_review` mantiene
el inmueble fuera del catálogo; `published` lo hace visible; `suspended` lo oculta
temporalmente y `withdrawn` lo retira. Ninguno borra la ficha, galería o historial.
Reactivar una publicación siempre exige `--confirm-public-data` y registra una
nueva fecha de aprobación. Se conserva el antecedente de aprobación al suspender.

Cada cambio bloquea la fila durante una transacción, exige el estado esperado y
registra un evento. Si otro operador cambió la ficha, o si falla el evento, la
operación se revierte. Ante un estado desactualizado, volver a consultar y revisar
la decisión; no reintentar a ciegas. La tabla privada `publication_events` permite
revisar responsable declarado, cuenta autenticada, motivo y estados anterior/nuevo.

Las vistas públicas ya aplican el estado a catálogo, detalle, galería, información
adicional y tarjetas sociales. Las respuestas usan `no-store`; las redes sociales
pueden conservar copias propias que el portal no controla.

## Instalación y prueba

La instalación aditiva de `publication_events` se incluye en
`scripts/complete-phase3.mjs`. No ejecutar instaladores históricos de copia de base.
La publicación del código en Vercel no ejecuta conciliaciones ni migraciones.

Las pruebas de publicación, retirada y errores se ejecutan en MySQL local restaurado.
`npm run test:database` rechaza hosts remotos y exige un esquema `alfaro_restore_*`.
`npm run test:phase3:integration` recibe `PORTAL_RESTORE_BACKUP` y
`PORTAL_BACKUP_KEY_FILE`, crea un esquema local nuevo en el puerto
`PORTAL_RESTORE_PORT` (33079 por defecto), compara todas las filas del respaldo y
prueba el flujo sin escrituras productivas. La copia local y su clave siguen privadas.
