# INSTRUCCIONES PARA CODEX — PORTAL ALFARO (FASES 1 Y 2)

## Contexto y límites estrictos
Este paquete fue preparado por ChatGPT para el repositorio **`darkcystian15-rgb/app-alfaro-git`**. El usuario aprobó implementar exclusivamente las **fases 1 y 2** (reestructuración funcional y rediseño visual del portal). Las **fases 3 y 4** (nueva base de datos e interconexión con la intranet) se realizarán posteriormente en Codex/Codespaces y **NO forman parte de esta entrega**.

**NO MODIFICAR** `Cystian/app-alfaro-git` ni `darkcystian15-rgb/inmobiliaria-alfaro`. No modificar esquemas, registros, credenciales, tablas, producción de la intranet o integraciones existentes. No ejecutar migraciones. Evitar escrituras a la base de datos. Conservar los endpoints del portal y sus rutas públicas.

## Preparación (obligatoria antes de copiar)
1. Confirmar `pwd`, `git remote -v`, `git status --short`, `git branch --show-current` y `git log -1 --oneline`. El `origin` de fetch/push debe ser `darkcystian15-rgb/app-alfaro-git`. **Si no coincide, DETENERSE**. No modificar ni remapear remotos automáticamente.
2. Proteger cualquier cambio local no confirmado. No ejecutar `git reset --hard`, `git clean -fd`, ni sobrescribir archivos con cambios del usuario.
3. Crear una rama dedicada a la implementación desde el estado correcto del portal, por ejemplo `feat/portal-reforma-fases-1-2`.
4. Inspeccionar este ZIP, el Markdown `docs/REFORMA-PORTAL-FASES-1-2.md` y el código del repositorio **antes de fusionarlo**. Es un overlay, **no** un repositorio completo y **no** contiene comandos de migración.

## Implementación
- Copiar los archivos de `src/` de este paquete a las mismas rutas en la raíz del repositorio, fusionando carpetas (NO reemplazar la carpeta `src/` completa).
- Copiar `docs/REFORMA-PORTAL-FASES-1-2.md`, este documento y el `LEEME-INSTALACION.md` a `docs/` o a la ruta documental adoptada por el repositorio.
- Revisar diffs con `git diff --check` y `git diff --stat` antes de confirmar. Adaptar los cambios a cualquier evolución del código desde la generación del ZIP; no sobrescribir indiscriminadamente.
- En fase 1: catálogo real, componentes reutilizables, manejo de errores y formularios de autenticación simulados desactivados. En fase 2: mejorar portada, buscador, tarjetas y diseño general sin romper las páginas preexistentes.
- **No eliminar contenido institucional, galerías ni funcionalidades vivas** sin comprobar sus rutas y usos. Si un cambio del ZIP altera algo importante, ajustarlo o aislarlo en lugar de imponerlo.

## Pruebas antes de subir
1. `npm ci` (si el lockfile y el entorno lo permiten); `npm run build`.
2. Verificar Inicio, `/propiedades`, `/propiedades/resumen/:id`, Servicios, Blog, Asesores, Contacto, enlaces y navegación móvil.
3. Probar APIs actuales de **solo lectura**: `/api/getProperties`, `/api/getProperties?featured=true`, `/api/get-options`, `/api/getPropertyDetails?id=<ID existente>`; no exhibir secretos en logs.
4. Confirmar búsqueda sin filtros, filtros combinados, 0 resultados, paginación, símbolos `S/` y `US$`, enlaces WhatsApp, imágenes no disponibles, responsive 375/768/1440 px.
5. Revisar que el diff no modifique `api/db.js`, archivos `.env*`, esquema MySQL ni scripts de migración.

## GitHub y Vercel
- Hacer commit en la rama del **portal Darkcystian** y push solo tras pruebas satisfactorias.
- Verificar un **Preview Deployment** de Vercel y corregir fallos de compilación o funcionamiento.
- Solo fusionar a `main` y promover a Production de Darkcystian tras revisión del resultado; el usuario desea alineación GitHub/Vercel, pero **no** publicar un estado defectuoso automáticamente.
- Registrar commit SHA, enlace Preview, enlace Production (si se publicara), resultado de pruebas y asuntos pendientes en `docs/ENTREGA-REFORMA-PORTAL.md`.

## Transferencia posterior a fases 3 y 4
Al terminar la fase 2, crear `docs/HANDOFF-FASES-3-4.md` con las APIs y tablas actuales, mapeos pendientes, reglas de visibilidad/publicación, decisiones de UI, puntos de integración sugeridos y respaldos necesarios. **No implementar** ni simular la nueva BD o la integración en esta tarea.

## Seguridad
El repositorio histórico incluye credenciales MySQL expuestas; no imprimirlas ni copiarlas a nuevos archivos. Recomendar rotación coordinada con el hosting y verificación de consumidores; no cambiar una contraseña activa sin plan para evitar romper los sistemas.

## Resultado esperado
Fases 1 y 2 integradas, compiladas, probadas y documentadas en el portal beta de Darkcystian. Si algún requisito no puede cumplirse, documentar el bloqueo y no afirmar que se desplegó.
