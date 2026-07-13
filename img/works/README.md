# /img/works/ — Carátulas de Proyectos

Colocá aquí las imágenes de portada de cada proyecto.

## Naming Convention
Usá nombres descriptivos en minúscula con guiones:
- `sport-campana-verano.jpg`
- `ia-concept-art-futbol.jpg`
- `it-dashboard-labufarra.jpg`
- `sm-pack-instagram.jpg`

## Formato recomendado
- **JPG o WebP** para fotos/renders
- **PNG** solo si necesitás transparencia
- **Tamaño ideal:** 1200x900px (ratio 4:3)
- **Peso máximo sugerido:** 500KB por imagen

## Cómo agregar un trabajo nuevo
1. Guardá la imagen aquí (ej: `sport-mi-proyecto.jpg`)
2. Abrí `old-works.html`
3. Copiá un bloque `<div class="work-card">` existente
4. Cambiá:
   - `data-category` → la categoría (sport, it, ia, sm, branding)
   - `src` → la ruta a tu imagen (ej: `img/works/sport-mi-proyecto.jpg`)
   - El título, tag y herramientas
