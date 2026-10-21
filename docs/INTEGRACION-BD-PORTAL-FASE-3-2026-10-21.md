# Integración del portal con base independiente — 21 de octubre de 2026

Proyecto exclusivo: darkcystian15-rgb/app-alfaro-git, Vercel app-alfaro-git del equipo puma19.
Destino: inmobi16_portal. La base y configuración del portal de Cystian no se modifican.

## Cambio

Las APIs de catálogo, detalle, información adicional y compartir consultan las vistas públicas de la nueva base. Conservan IDs, contratos y filtros; la galería desempata por ID. La retirada de publicación se aplica a todas esas lecturas. Las respuestas de catálogo/detalle/información y compartir usan no-store para evitar servir fichas suspendidas desde cachés HTTP; redes externas pueden conservar copias propias.

La moneda «US$ c/u» se reconoce como USD para filtros/comparación y mantiene «c/u» al mostrar el precio. Los errores de las APIs de inmuebles ya no devuelven mensajes internos MySQL.

La transición preserva la visibilidad de los IDs que ya devolvía públicamente el portal antes del cambio: 64 inmuebles, 8 destacados. No interpreta que futuros inmuebles de intranet estén autorizados. La tabla publications registra su aprobación de transición; nuevos registros deben tener su aprobación explícita.

Solo DB_NAME de Production del proyecto Dark cambia a inmobi16_portal; no se amplían variables a Preview. Se mantiene el usuario existente autorizado por el usuario. La base nueva contiene copia de campos privados: el backend usa proyecciones explícitas y vistas. Aún se recomienda un usuario exclusivo con privilegios mínimos. Esta migración no replica cambios posteriores de Cystian ni duplica archivos de fotos.

## Validación previa

- npm test: tres archivos aprobados, incluida la prueba de precio por unidad.
- npm run build: correcto, con avisos existentes de Browserslist y tamaño de bundle.
- Integración SQL de APIs contra la nueva base: 64 IDs preservados, 8 destacados, filtros, detalle y galería/información de cada inmueble, opciones y APIs editoriales, tarjeta HTML e imagen real, ausencia de propietario en respuestas y retirada de publicación. Escrituras del ensayo revertidas con ROLLBACK.
- Copia inicial y restricciones de BD documentadas en los informes de scripts. Se incorporan scripts para trazabilidad; crear-portal-prueba-f3 se detiene sobre bases no vacías y no debe repetirse como actualización. mejorar-portal-f3 requiere publicaciones pendientes para su ensayo; no ejecutar automáticamente en producción.

## Recuperación

Antes de cambiar configuración se registró de forma privada el despliegue anterior READY dpl_H6uiijyedZBY3K6ANGMqBo1hiuH9, la configuración previa y los IDs públicos. Para volver, restaurar el valor previo de DB_NAME únicamente en este proyecto y promover/recrear el despliegue anterior. Cambiar variables no altera los despliegues existentes. La base anterior no recibe escrituras en este procedimiento.

Los respaldos temporales de esquema y datos no sustituyen una copia permanente ni certifican un ensayo de restauración completa. No hay secretos ni datos personales en este documento.

## Estado

Código preparado y validado localmente. Verificación de despliegue y dominio pendiente al redactar; se registra en entrega posterior.
