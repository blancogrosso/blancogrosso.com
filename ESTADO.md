# Estado de blancogrosso.com

_Última actualización: 2026-10-18. Etapa 7.1 (home v2) en la rama `v2/redesign`, preview publicada, falta Lighthouse._

## Hecho

- **Supabase propio.** El sitio dejó de usar el proyecto de La Bufarra. Ahora usa el proyecto
  **blancogrosso** (`apjtdeyyuxpxyziwiogo`), con las tablas de SERRA (`serra_respuestas`,
  `serra_prefs`, `serra_identidad_contenido`, `serra_identidad_comentarios`) y las de la app de
  finanzas (`finanzas_*`) migradas, RLS activo y registro de usuarios cerrado.
  - `serra.html` y `serra-identidad.html` usan una clave publicable (`sb_publishable_…`): la URL y
    la clave están en `serra.html:366-367` y `serra-identidad.html:1196-1197`.
- **Admin y presupuesto eliminados** (`apps/_internal_v1/` y `presupuesto.html`), junto con el link
  escondido al admin en `index.html` y `portfolio.html`.
- **noindex** en `nido.html` y `linkedin-banner.html` (`serra.html` y `serra-identidad.html` ya lo tenían).
- **Dieta de media: 946 MB → 51,5 MB.**
  - Se borraron los archivos sin referencias.
  - Todos los nombres de media están en minúsculas, sin espacios, tildes, ñ ni paréntesis.
  - Imágenes en AVIF (lado largo ≤ 2560 px, ≤ 800 KB) y videos en H.264 con faststart. Ningún
    archivo tiene EXIF ni GPS.
  - El PDF de NIDO pasó de 31,5 MB a 0,3 MB.
  - Excepción vigente: los reels `bufarra-umbro/reel-final.mp4` (9,9 MB) y
    `labufarra-social/reel.mp4` (7,4 MB) tienen techo de 10 MB.
- **Historial reescrito** con `git filter-repo`: el repo pasó de ~968 MiB a **~50 MiB**. El árbol de
  HEAD quedó idéntico y se conservaron los 39 commits, pero **todos los hashes cambiaron**: cualquier
  clon anterior hay que volver a clonarlo.
- **Script reutilizable** `scripts/media/optimizar.sh` (documentado en `scripts/media/README.md`) para
  comprimir otras carpetas de fotos, videos y PDF con las mismas reglas.

## Respaldos

- `~/Backups/blancogrosso.com-mirror-2026-10-17.git`: espejo con el **historial completo anterior**
  a la reescritura. Es el **único lugar** donde quedan algunas versiones viejas de archivos.
- `~/Backups/blancogrosso-media-originales/`: los 283 archivos de media originales (946 MB), con
  las rutas de entonces y el manifiesto `MANIFEST.sha256`.

No borrar ninguno de los dos.

## Pendientes

- [ ] **(a) 24 de octubre:** en el proyecto de Supabase de **La Bufarra**, borrar las tablas
  `serra_*`, `finanzas_*` y `bg_ecosystem` y el bucket `proposals`. **Antes**, comparar con el
  proyecto blancogrosso para confirmar que nadie escribió ahí después de la migración.
- [ ] **(b)** `/portfolio` y `/nido` sin `.html` dan 404. Se resuelve con `"cleanUrls": true` en
  `vercel.json` durante el rediseño (y revisar las rewrites de `/serra` y `/serra-identidad`).
- [ ] **(c)** `.secret-gate` quedó en el CSS (`css/brand-core.css` y `css/styles.css`). Se elimina
  en el rediseño.
- [ ] **(d)** `img/works/nido/LEEME.txt` tiene los nombres de archivo viejos (y menciona un SVG
  que ya no existe).
- [ ] **(e)** El fallback de íconos en `js/project-components.js` y `js/portfolio.js` busca
  `img/icons/<nombre>.svg` / `.png` para etiquetas que no están en `iconMap`. Hoy todas están
  mapeadas, pero una nueva sin mapear daría 404.

## Etapa 7.1: home v2 (rama `v2/redesign`, sin merge a main)

- **Home one-page** con el estilo y el comportamiento del prototipo v3 aprobado (`_ref/`, fuera de git):
  filtros tipográficos con GSAP Flip, botones con barrido, etiqueta Ver caso / Ver sitio, transición
  tarjeta → caso con View Transitions, contacto con WhatsApp, videollamada y mail con Copiar.
- **Cómo se edita:** los trabajos están en `data/works.json`; el HTML de la home lo genera
  `python3 scripts/build-home.py` (no editar `index.html` a mano). Los destacados quedan escritos en el
  HTML; el resto va en un `<template>` que suma `js/home.js`.
- **Transición entre páginas:** `css/view-transitions.css`, enlazada en la home, los 9 casos y NIDO.
  Cada caso tiene `view-transition-name: case-<slug>` en su imagen principal (Serie Río de la Plata no
  tiene: solo fundido).
- **Preview:** https://blancogrosso-8i891f775-tomasblancogrosso-6137s-projects.vercel.app (commit e309936).
  Tiene la protección de Vercel activada (pide login).
- **Producción:** el póster de by-kafuse ya está arreglado en main (22612d6).
- Pendiente (b) resuelto en la rama: `cleanUrls` en `vercel.json`. En producción `/by-kafuse` sigue en 404
  hasta el merge (hoy funciona `/by-kafuse.html`).

## Próxima sesión: arrancar por acá

1. **Lighthouse mobile contra la preview** (3 corridas, mediana de rendimiento, LCP y CLS). Necesita la
   preview accesible: desactivar la protección de Vercel para previews o un bypass para automatización.
   Si el LCP supera 2,5 s: recortar la fuente (ancho 100–112 %, solo los glifos usados), medir y pushear.
2. Elegir la portada de labufarra.com (opción B, partidos y tabla, puesta por defecto; opción A, solo tabla).
3. Revisar la preview y decidir el merge de `v2/redesign` a main.

## Antes (etapa 7, todavía vigente)

**Etapa 7: sistema de diseño y rediseño**, en la rama `v2/redesign`.

Antes de diseñar hay que cerrar:

1. **La estructura:** trabajos seleccionados + archivo.
2. **El posicionamiento.**
