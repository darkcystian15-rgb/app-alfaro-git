# Continuación de fase 3: seguridad, auditoría y respaldo

Fecha: 21 de octubre de 2026. Fork exclusivo: darkcystian15-rgb/app-alfaro-git.

## Cambios preparados

- Diagnósticos Netlify `test-env` y `get-options_test_db`: respuesta 410 sin leer secretos ni conectar a servicios.
- APIs editoriales y funciones Netlify: errores públicos genéricos conservando las claves de respuesta.
- Formulario Vercel: se retira el registro del cuerpo completo y de respuestas completas del receptor; errores imprevistos no devuelven detalles internos. No se enviaron formularios reales.
- `.env` deja de estar versionado. Su copia local se conserva ignorada; esto no borra el historial ni revoca ninguna clave.
- Netlify deja de contener credenciales MySQL en código: utiliza `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_PORT`, como Vercel. Antes de desplegar en Netlify, confirmar esas variables con el responsable. El cambio no configura ni despliega Netlify.
- Auditoría reproducible, transacción coherente de solo lectura: huérfanos, áreas/direcciones incompletas, referencias de catálogo faltantes, monedas y aprobación. Entrega solo IDs y conteos a un archivo privado; no corrige por suposición.
- Respaldo lógico de tablas y vistas cifrado con AES-256-GCM, compresión, clave externa de 32 bytes, archivo 0600 creado sin sobrescritura, hash y verificación de lectura/descifrado. Se rechazan motores no InnoDB y triggers/rutinas/eventos visibles; una cuenta sin visibilidad completa no permite certificar la ausencia de otros objetos.

## Uso privado

La configuración JSON debe contener `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y opcionalmente `DB_PORT`. Ambos comandos rechazan cualquier base distinta de `inmobi16_portal`. No usar `.env` heredado como conexión: puede apuntar al portal original.

```sh
PORTAL_DB_CONFIG=/ruta/privada/portal.json npm run audit:portal -- /ruta/privada/auditoria.json
PORTAL_DB_CONFIG=/ruta/privada/portal.json PORTAL_BACKUP_KEY_FILE=/ruta/privada/clave.key npm run backup:portal -- /ruta/durable/portal.backup.enc
```

La clave debe ser un archivo binario de 32 bytes aleatorios y debe custodiarse fuera de Git, separada de la copia distribuida. No imprimirla. Los comandos no sobrescriben archivos existentes. La copia se realiza en memoria y está pensada para el tamaño actual del portal. Congelar cambios DDL durante la captura: una instantánea de filas no protege contra cambios simultáneos de esquema.

**Límites:** no descarga fotos/documentos remotos ni configuración Vercel; no es todavía un respaldo integral del servicio. Leer y descifrar una copia no demuestra que pueda restaurarse en MySQL. El respaldo permanente externo y una restauración en base vacía aislada siguen siendo criterios de cierre obligatorios.

## Inventario confirmado por código

| Consumidor | Conexión o destino | Tratamiento |
| --- | --- | --- |
| Vercel `api/` y compartir | Variables DB de Production; vistas públicas para inmuebles | Mantener contratos e IDs. |
| Netlify `netlify/functions/` | Backend alternativo heredado; variables DB necesarias tras este cambio | No desplegar sin revisar variables, consumidores externos y visibilidad de sus consultas heredadas. |
| Formulario Vercel | Google reCAPTCHA y receptor Apps Script existente | No se prueban envíos ni se cambia receptor. |
| Formularios Netlify | Receptores Apps Script existentes | Revisar consumidores antes de retirar. |
| Fotos del catálogo | URLs de almacenamiento existentes | No se duplicaron ni se verificó cada archivo. |

Este inventario es estático. No prueba ausencia de otros sitios, tareas, integraciones o usuarios con las credenciales compartidas. Revisar configuración de hosting y registros operativos antes de la rotación. Las vistas SQL SECURITY INVOKER requieren permisos subyacentes: no basta con conceder SELECT a las vistas para definir el nuevo usuario.

## Aún pendiente para cerrar fase 3

1. Inventario operativo de consumidores y rotación coordinada de credenciales históricas; limpieza del historial si se acuerda. No modificar la cuenta compartida de Cystian sin esa coordinación.
2. Usuario de servicio exclusivo, permisos mínimos validados contra todas las APIs, y actualización de variables de Production del portal Dark.
3. Copia externa de base, archivos y configuración; ensayo documentado de restauración completa en un destino aislado.
4. Decisiones verificadas sobre huérfanos, áreas cero, direcciones vacías y correspondencias de catálogos. No borrar ni inventar datos.
5. Responsable de aprobación/suspensión/retirada y herramienta operativa autenticada. No se crea una administración pública.

La fase 4 y la intranet siguen fuera de esta entrega.

## Ejecución real y validación

Auditoría del 21 de octubre de 2026 a las 18:57 UTC, obteniendo las variables Production mediante la API privada de Vercel después de verificar el vínculo al fork y `DB_NAME=inmobi16_portal`. No se cambiaron variables, credenciales ni datos.

- 64 publicaciones publicadas; cero aprobaciones inválidas y cero fichas sin registro de publicación.
- Seis huérfanos de galería; cero huérfanos de información adicional.
- Cuatro áreas cero o ausentes y dos direcciones vacías.
- 64 referencias pendientes en cada catálogo: tipo, modalidad y distrito.
- Cero monedas canónicas ausentes y cero discrepancias entre las referencias nuevas y heredadas de galerías/información.

Copia lógica cifrada generada y releída: 14 tablas y 3 vistas. SHA-256: `6ea5aa87e6827cad51a82ddcde487f41505a17ae09e9722afaaf3a4f43963b29`.
La copia y su clave están en un directorio privado excluido de Git dentro del workspace. Esto evita depender exclusivamente de `/tmp`, pero no es una copia externa ni asegura supervivencia a la eliminación del workspace. La clave debe custodiarse por separado. No se descargaron fotos ni se ensayó restauración MySQL.

El comando `scripts/proponer-catalogos-f3.mjs` genera propuestas privadas a partir de la copia descifrada, sin conexión ni escrituras en la base. Igualdad de nombre, ignorando solo espacios extremos y mayúsculas: 64 candidatos únicos de modalidad y 64 de distrito; cero candidatos de tipo. Ninguna propuesta se aplica automáticamente. Coincidencia de etiqueta no equivale a identidad comercial confirmada.

Pruebas: `npm test`, `npm run test:phase3` y `npm run build -- --outDir /tmp/alfaro-fase3-build` correctos. Siguen los avisos de Browserslist y tamaño de bundle. Los ensayos nuevos cubren cifrado, manipulación de copias, clave incorrecta, permisos y no sobrescritura, rechazo de otra base, auditoría sin DML con ROLLBACK incluso al fallar, clasificación de candidatos, diagnósticos retirados y errores de las APIs editoriales. No se enviaron formularios reales.

Los cambios están preparados en una rama del fork; no se declara una publicación en Production. Antes de fusionar, comprobar `VITE_RECAPTCHA_KEY` en los entornos que utilicen el formulario heredado, ya que `.env` deja de viajar en Git. Nunca trasladar `NEON_DB_URL` ni tokens históricos al cliente.
