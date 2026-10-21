# Tarjetas de ubicaciones — imágenes de ambientación

21 de octubre de 2026. Herramienta: image_gen integrada, tres generaciones independientes, sin imágenes de referencia. Son escenas ficticias de ambientación, no fotografías documentales de las ciudades ni de inmuebles ofertados. La sección informa esa condición al visitante.

## Archivos finales

- public/portal/location-nuevo-chimbote-v1.webp
- public/portal/location-chimbote-v1.webp
- public/portal/location-casma-v1.webp

Originales PNG: /home/codespace/.codex/generated_images/01a15e45-b26d-7120-bcea-6b14d798d1ac/. Optimización con sharp a WebP 1200×800, calidad 84. No se modificaron datos, conteos ni filtros. Los conteos se calculan desde los inmuebles públicos existentes.

## Prompts finales

Cada imagen usa el siguiente prompt, sustituyendo SCENE por su escena exacta de abajo:

Use case: photorealistic-natural. Asset type: editorial image for a real-estate website location card. Primary request: SCENE Composition: landscape 3:2, strong coherent scene filling the frame, details concentrated in middle and upper two thirds; lower third usable under a dark UI gradient and white text added separately. Natural materials, sophisticated warm neutral color grading consistent across the set, realistic scale. This is a fictional referential ambience, not documentary proof of an actual landmark or property. No text, no logos, no watermarks, no borders, no collage. Generate one single photograph.

### Nuevo Chimbote

A welcoming contemporary residential avenue inspired by coastal northern Peru: low-rise light stucco houses, a landscaped pedestrian park with palms and flowering trees, distant dry hills, warm late-afternoon sunshine. Street-level architectural photography, inviting and realistic, no resort or luxury skyline.

### Chimbote

An atmospheric coastal promenade inspired by northern Peru: broad Pacific bay, modest fishing boats in the distance, low coastal hills, a stone pedestrian walkway and restrained palms in foreground, soft golden-hour light with blue water. Realistic editorial travel photography, no tropical turquoise resort.

### Casma

A tranquil river valley inspired by the Casma region of coastal Peru: green cultivated fields and a few modest adobe/stucco country homes, arid ochre hills behind, a path in the foreground, warm golden-hour sun. Realistic editorial landscape photography, understated and inviting.

## Diseño

Tarjetas que llenan el ancho disponible; fotografía con degradado oscuro; conteo del catálogo; nombre y enlace explícito a cada ubicación. Tres columnas en escritorio/tablet y una columna en móvil, foco visible y movimiento reducido. Carga diferida de las imágenes para no priorizarlas sobre la portada. Ubicaciones futuras usan una ambientación genérica hasta disponer de su imagen.
