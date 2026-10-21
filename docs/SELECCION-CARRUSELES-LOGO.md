# Mi selección, carruseles y logo original

Actualización autorizada del portal **darkcystian15-rgb/app-alfaro-git**.
Destino público: https://app-alfaro-git-smoky.vercel.app.

## Comportamiento entregado

- Se conservan los corazones en tarjetas y fichas. La cabecera permite abrir
  **Mi selección**, con contador y acceso permanente en `/favoritos`.
- Los favoritos se conservan en `localStorage` del mismo navegador. Sin cuentas,
  tokens, Gmail, sincronización entre dispositivos ni nuevos registros en BD.
  Se respeta la selección existente; no se impone una caducidad que la borre.
- Mi selección permite quitar favoritos, vaciar con confirmación, acceder a la
  comparación existente (hasta tres inmuebles) y elegir qué inmuebles consultar.
- La consulta conjunta admite hasta diez inmuebles por mensaje para mantenerlo
  manejable. Desmarcar no elimina favoritos; es posible preparar varias consultas.
  Incluye título, precio con su moneda y enlace canónico de cada inmueble.
- Se puede añadir una nota opcional de 500 caracteres y revisar el mensaje.
  La nota no se persiste. WhatsApp se abre solo al pulsar el enlace; el visitante
  decide si envía el mensaje. No se envían mensajes durante las pruebas.
- Los guardados ausentes del catálogo se explican, se excluyen de la consulta y
  pueden quitarse. Los errores de carga ofrecen reintento y no generan mensajes
  con información incompleta.
- Portada cada 7 segundos; destacados cada 6,5 segundos, con retorno al inicio,
  flechas, reproducción y pausa. Se suspenden al pasar el ratón, enfocar sus
  controles y ocultar la pestaña. La navegación manual pausa el avance automático.
  La preferencia de movimiento reducido inicia ambos pausados. Se conserva el
  desplazamiento táctil de destacados y se incorpora gesto horizontal en portada.
- Se restaura **el archivo original `public/logo.png`**, sin redibujar ni cambiar
  colores o proporciones. Cabecera, pie, firma externa de fotos, portada social y
  tarjetas JPG usan esta identidad. El PDF obtiene la misma tarjeta actualizada.
  `server/assets/logo.png` es una copia exacta para empaquetado de la función.
  Las fotos originales y sus marcas existentes no se modifican.
- Las imágenes de compartir usan versión `v=3`; las plataformas pueden conservar
  una vista previa previamente almacenada. No se ha realizado un envío real por
  WhatsApp ni se promete invalidar su caché.

## Verificación y reproducción

Node 24. `npm test` cubre 17 casos definidos en tres archivos; se añaden los
casos de límite de consulta, monedas, enlaces, codificación y nota acotada.
`npm run build` genera la aplicación de producción.

```sh
PORTAL_BUILD_DIR=/ruta/a/compilacion PORT=4186 npm run preview:readonly
PORTAL_BASE_URL=http://127.0.0.1:4186 node tests/selection.browser.mjs
PORTAL_BASE_URL=http://127.0.0.1:4186 npm run test:browser
```

La prueba nueva verifica avance real por temporizador, pausa, movimiento reducido,
gestos de portada, selección de doce favoritos con límite de diez por consulta,
notas y enlaces, persistencia, retirada individual, comparación, confirmación de
vaciado y guardados no disponibles. Capturas y ausencia de desbordamiento en
375, 768 y 1440 px. La regresión cubre catálogo, filtros, fichas, rutas
institucionales, accesibilidad de galería y descargas JPG/PDF reales.

Resultado local: pruebas y compilación correctas; cero errores de JavaScript y
cero solicitudes de escritura de negocio en ambas pruebas de navegador.
Advertencias existentes: Browserslist desactualizado y paquete inicial >500 kB;
no impiden la compilación. No se atribuye una medición Lighthouse inexistente.

## Publicación

Código de la aplicación validado: `8031eba7e0d474c6b23e9c32f15e3fae9b50e64a`.
PR: https://github.com/darkcystian15-rgb/app-alfaro-git/pull/3.

Despliegue de validación Vercel **READY**:
`dpl_HgAjQ7XCVhU7JraYCd92vfD5ofRf`,
https://app-alfaro-pibi2ljqh-puma19.vercel.app.
La URL de validación mantiene la protección existente; no contiene credenciales.
Ambas pruebas Chromium completas han pasado contra ese despliegue, incluidas
la generación serverless de imagen con el logo original empaquetado y las
descargas JPG/PDF. Cero errores de JavaScript y cero escrituras de negocio.

Las correcciones posteriores de la simulación táctil y autenticación de la
herramienta de prueba no cambian el código de la aplicación validada.
Se integra este PR en `main` para que la integración GitHub de Vercel publique
el mismo código. La comprobación de la dirección pública se realiza después de
integrarlo y se registra al cerrar la entrega.

Proyecto Vercel fijado: `prj_W5ADa1iBP42vjncafADM4jm8QBWk`, equipo `puma19`.
Se mantienen credenciales y alcance Production existentes. No se modifican Cystian,
la intranet, datos, esquemas de BD ni variables de entorno. No se inicia la fase 3.
