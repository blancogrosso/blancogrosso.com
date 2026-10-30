# Estado de blancogrosso.com

_Última actualización: 2026-10-30. Entrada corregida y fila que asoma bajo la apertura en la rama `v2/entrada-muro`, sin unir ni subir: espera el OK de Tomás. `main` sigue en `22612d6`. Ver "30 de octubre" más abajo._

## 30 de octubre: entrada corregida y fila del muro que asoma

Rama `v2/entrada-muro`, creada desde `v2/redesign`. Sin unir, sin push.

- **Entrada que no se veía.** Causa: `js/home.js` sacaba `intro-play` a los 2 s desde el inicio de la
  navegación, que incluye las redirecciones del login de Vercel. Con 2 s o más de demora la entrada duraba
  2 cuadros, y la marca de sesión, escrita en el `<head>`, impedía verla al recargar. No fue el muro: viene
  de `0e0d521`. Ahora los tiempos cuentan desde el primer cuadro y la marca se guarda al terminar.
- **Fila que asoma**, copiada de `_ref/muro/muro-asoma.html`:
  - La apertura flota sobre el muro, que arranca en el tope y dura 420vh. Mide la pantalla menos 92 px
    (74 px en celular). Asoma la fila 2 de 4 en escritorio y la 3 de 6 en celular.
  - A los 1,2 s, y nunca antes de que termine la entrada, dos saltitos de 14 px. Scrollear los cancela.
  - La fila sube mientras la apertura se va, el resto se arma por distancia a ella y la grilla va de ~1,18
    a 1. El final quedó como estaba: se oscurece a 0,45 y Trabajos sube encima. La referencia cortaba ese
    fundido antes, así que ahí se priorizó "el final queda igual".
  - Con movimiento reducido el muro queda completo y quieto, sin saltitos.
- **Pantallas bajas:** el logo se achica por alto para que entre la apertura. En celular apaisado y en
  320 x 568 igual no entra: la fila queda debajo de la apertura, sin pisarla, y no asoma al cargar.
- **Fila y LCP:** la fila se pide apenas el navegador presenta el primer pintado (Paint Timing API). Escrita
  en el HTML sumaba 0,4 s al LCP en celular, y `fetchpriority="low"` no alcanzaba.
- **Fila y entrada:** la fila entra con el mismo fundido que el menú (agregado, no estaba pedido).
- **Fluidez** (scroll de escritorio, mediana de 4 rondas alternadas contra `v2/redesign`):
  - por software: 58,6 → 58,75 fps;
  - con placa de video: 59,4 → 59,4 fps.
- **Lighthouse en celular (home),** mediana de 6 corridas alternadas contra `v2/redesign`:
  - rendimiento: 98 en las dos versiones;
  - LCP: 2,33 → 2,48 s;
  - CLS: 0;
  - peso: 692 → 694 KB.
- **Pruebas:** 1000 chequeos, 999 OK en la corrida completa. La falla fue un umbral de cuadros de
  `entrada.mjs` con la máquina cargada; esa suite dio 41 de 41 en 3 rondas seguidas.
  - La batería de 900 se reconstruyó desde las transcripciones y dio 900 de 900 contra `v2/redesign`.
  - Prueba nueva: `entrada.mjs` (41). `muro.mjs` se reescribió (103). Contra `v2/redesign`, `entrada.mjs`
    falla 23 de 41: detecta el error original.
  - Las pruebas quedan en `_ref/pruebas/` (fuera de git).

**Pendientes:**
- [ ] **Revisar y unir `v2/entrada-muro` a `v2/redesign`:** espera el OK de Tomás.
- [ ] Los pendientes del 27 de octubre siguen vigentes. Se suma la rama `v2/entrada-muro` a la limpieza,
  cuando se una.

## 27 de octubre: muro de trabajos en lugar del showreel

Commits: `a198fcc` (el muro, en `v2/muro`) y `1dbe7b0` (unión en `v2/redesign`, subida).

**Vista previa:** https://blancogrosso-hs7uaeapk-tomasblancogrosso-6137s-projects.vercel.app
(tiene la protección de Vercel activada: pide login).

- **Muro de trabajos** entre la portada y Trabajos, copiado de `_ref/muro/muro.html`:
  - 24 miniaturas cuadradas de 420 px en `img/muro/`. La lista está en `data/muro.json` y las genera
    `scripts/media/miniaturas-muro.py`; cinco salen de su copia `-limpio`.
  - Queda fijo unas 3,4 pantallas. Grilla de 6×4 en escritorio y de 4×6 debajo de 700 px.
  - Las piezas aparecen del centro hacia afuera y la grilla pasa de 2,1× a 1×. Al final se oscurece y
    Trabajos sube por encima con el degradado a negro.
  - Va atado al scroll y es reversible (GSAP ScrollTrigger con Lenis).
  - Con movimiento reducido queda completo y quieto. Sin JavaScript no se muestra.
  - Las miniaturas cargan después de la primera pintada.
- GSAP y Lenis ahora se piden cuando el navegador queda libre después de la carga, para no competir
  con el LCP.
- **Videos del reel:** salieron de la home, pero siguen en `img/reel/`, sin uso.
- **Fluidez** (scroll de escritorio, mediana de 4 rondas alternadas contra el showreel):
  - por software: 59,7 → 58,8 fps;
  - con placa de video: 60,0 → 59,55 fps.

  Es una baja chica pero constante. El costo está en dibujar las 24 imágenes agrandadas mientras el muro
  está fijo.
- **Lighthouse en celular (home),** mediana de 6 corridas alternadas:
  - rendimiento: 99 en las dos versiones;
  - LCP: 2,19 s con el muro y 2,185 s con el showreel;
  - CLS: 0;
  - peso: 694 KB con el muro y 1967 KB con el showreel.
- **Pruebas:** 900 chequeos, 0 fallas. Las del showreel se reemplazaron por 44 del muro.

**Pendientes:**
- [ ] **Revisar la vista previa y publicar en main:** espera el OK de Tomás.
- [ ] **Perchero 3D en Kafuse, KitHome y Umbro:** espera los PNG de Illustrator. El prototipo está en
  `_ref/perchero/perchero-3d.html`.
- [ ] **Limpieza**, cada borrado con OK de Tomás:
  - ramas: `v2/panel` y `v2/muro`;
  - carpetas: `../preview-panel`;
  - videos sin uso de `img/reel/`: los del showreel, que ya no se usan, y `montaje-provisorio*` y
    `reel-servicios*`, que nunca se commitearon;
  - scripts y datos de prueba del scratchpad de la sesión.

## 26 de octubre: unión de `v2/panel` en `v2/redesign`

Commits: `0e0d521` (los cambios), `f8f4781` (cinta de herramientas con `translate3d`), `426c153` (páginas
regeneradas: home, los 9 casos y nido-identidad) y `f9e9de2` (unión en `v2/redesign`, subida).

**Vista previa:** https://blancogrosso-o0z6nufki-tomasblancogrosso-6137s-projects.vercel.app
(tiene la protección de Vercel activada: pide login).

- **Logo v8** en la home: letra por letra, con degradado de lava y reacción al mouse. Al bajar viaja al
  menú como marca en dos filas. Está centrado por tinta, no por caja.
- **Entrada de la home:** coreografía de fondo, logo, frase y menú. Sale solo la primera vez por sesión
  (`sessionStorage`), con CLS 0.
- **Cinta de herramientas** entre Servicios y Contacto, sin título. Sale de `data/tools.json` (íconos en
  `img/icons/stack/`). Se pausa con el mouse encima y fuera de pantalla; con movimiento reducido queda
  quieta y se desliza a mano.
- **Panel sobre la home:** el caso se abre siempre arriba. La barra muestra "← Trabajos", el nombre del caso
  (aparece a los 40 px de scroll y se oculta debajo de 360 px) y una X redonda. En celular se cierra
  arrastrando hacia abajo más de 120 px. En la página suelta del caso, "← Trabajos" lleva a `/#works`.
- **Scroll horizontal** en todas las galerías que desbordan, en escritorio con mouse (900 px o más), tanto
  en la página como en el panel.
- **Showreel** en la sección del reel (`img/reel/showreel.mp4`; debajo de 900 px, `showreel-720.mp4`).
  Carga recién a los 2 s, con póster, y se pausa fuera de pantalla.
- **NIDO como caso** en `/nido-identidad`, con los textos originales en ES y EN. Portada en
  `img/works/nido/portada.avif`, tarjeta en `img/works/nido-identidad.avif` e imagen OG en
  `img/og/nido-identidad.jpg`. Tiene un link discreto a la presentación original. `nido.html` no se tocó.
- **Fluidez** (scroll de escritorio, mediana de 4 rondas contra la versión anterior): antes 58,2 fps;
  con la cinta y el showreel andando, 57,0 fps. Con cualquiera de los dos apagado queda igual que antes, así
  que la diferencia se toma como ruido.
- **Lighthouse en celular (home):** rendimiento 96 de mediana, LCP 2,2–2,4 s y CLS 0.
- **Pruebas:** 860 chequeos, 0 fallas, en los 10 casos, el panel, las galerías, el logo, la cinta y el reel.

Los pendientes de ese día pasaron al 27 de octubre. El showreel ya no está en la home (lo reemplazó el
muro), así que la toma de la web para el showreel quedó sin efecto. La cinta en una sola capa sigue como
mejora opcional.

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

## Etapa 10: plantilla única de casos (rama `v2/redesign`, sin push ni merge)

Commits: `10bb227` (pilotos By Kafuse y Sport Editorial), `bc86717` (KitHome, Umbro y Final Clásica),
`6122650` (los 9 casos, títulos con degradado, prendas, bloque media, scroll horizontal y fotos limpias).

- **Los 9 casos salen de una sola plantilla.** Mismas URLs (`/by-kafuse`, etc.), mismas etiquetas
  Open Graph y la misma transición desde la home. Se fueron las etiquetas en mayúscula, las pastillas,
  "← Volver al Portfolio" (ahora "Cerrar", a `/#works`) y el pie.
- **Archivos:** `data/cases.json` (contenido), `scripts/build-cases.py` (genera las páginas),
  `css/case.css` y `js/case.js` (compartidos). Los textos son los originales de cada caso, en ES y EN.
- **Bloques:** hero, cover (imagen o video), facts, story, split-video, video-pair, sheet, media,
  garment, gallery, before-after, steps, prompt, video-embed, ext-link y next. Cada uno está explicado
  al principio de `scripts/build-cases.py`.
- **Galería:** tira deslizable con visor a pantalla completa. En escritorio con mouse o trackpad
  (900 px o más) y con 4 fotos o más, la galería se fija y el scroll vertical la mueve hacia el costado
  (GSAP ScrollTrigger + Lenis, de `js/vendor/`). La tira usa `<nombre>-tira.avif` (1000 px) y el visor
  carga el original recién cuando se abre.
- **Títulos** con el degradado verde de la marca (la frase grande queda blanca). Medidos: ninguna letra
  se corta ni se toca entre líneas.
- **Comparadores** con las dos fotos alineadas (`*-comparar.avif`). Iris Lab solo se pudo alinear por
  pupila y tamaño del iris: la pieza final no es la foto cruda transformada.
- **Prendas en percha** (bloque garment): al tocarlas abren el diseño técnico en el visor.
- **Fotos limpias:** 34 fotos traían una línea clara en algún borde por una mala exportación. Tienen una
  copia `<nombre>-limpio.avif` (los originales no se tocaron). `build-cases.py` y `build-home.py` usan
  solas la copia limpia cuando existe. Láminas y lista en `_ref/capturas/lineas-blancas-v2/`.
- **Pruebas** (Playwright headless, scripts en el scratchpad de la sesión, no en el repo): 518 de 518 en
  los 9 casos y 79 de 79 en el scroll horizontal. Lighthouse en celular: by-kafuse 95, sport-editorial 85,
  bufarra-umbro 84, iris-lab 89, labufarra-social 99 (accesibilidad, buenas prácticas y SEO en 100).

**Cómo agregar un caso:**
1. Poner las fotos en `img/works/<slug>/` (AVIF) y sumar el trabajo en `data/works.json` (tarjeta de la
   home, orden y "Siguiente").
2. Agregar el caso en `data/cases.json`: `slug`, `meta` (título, título OG, descripción, texto
   alternativo de la imagen OG) y la lista de bloques. Textos como `{"es": …, "en": …}`.
3. Para las fotos de galería, generar `<nombre>-tira.avif` de 1000 px de ancho.
4. Correr `python3 scripts/build-cases.py` (escribe `<slug>.html`) y `python3 scripts/build-home.py`
   si cambió la home. No editar los HTML a mano.

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

## Etapa 8, Parte 1: medición "antes" (hecha, sin cambios de código)

Servidor local con `npx serve` (puerto 3000), Lighthouse 12.2.1 y trazas de Chrome headless (sin GPU:
los números absolutos de fps son peores que en una Mac real, pero la causa es la misma).

**Lighthouse local** (mediana de 3 corridas):

| Página | Modo | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Home | Celular | 95 | 100 | 100 | 100 | 2,32 s | 199 ms | 0 |
| Home | Escritorio | 100 | 100 | 100 | 100 | 0,51 s | 0 ms | 0 |
| by-kafuse | Celular | 91 | 91 | 100 | 92 | 3,39 s | 0 ms | 0 |
| by-kafuse | Escritorio | 99 | 91 | 100 | 92 | 0,96 s | 0 ms | 0 |

**Scroll de la home de arriba a abajo:**

| | fps con fondo | fps sin fondo (control) |
|---|---|---|
| Escritorio | **5,3** | 58,5 |
| Celular | **9,9** | 59,9 |

Con el fondo no hay tareas largas ni mucho JavaScript: cada cuadro espera que se dibuje el fondo.
**Causa:** los dos círculos gigantes del fondo (140vmax) con `filter: blur(140px)` + `mix-blend-mode`.

Archivos (fuera de git, en `_ref/`): `_ref/lighthouse/antes/`, `_ref/trazas/antes-etapa8/`,
`_ref/capturas/antes-etapa8/` (capturas con las animaciones congeladas en el mismo instante, para comparar).
Los scripts de medición quedaron en el scratchpad de la sesión (no en el repo).

**Decisiones:**
- Los casos usan sus URLs reales (`/by-kafuse`, etc.). No se crea la ruta `/trabajos/`.
- `_ref/` queda ignorado por `.git/info/exclude` (no se toca `.gitignore`).

## Próxima sesión: arrancar por acá

**Etapa 8, Parte 2 hecha** (`0f22bd6`): el fondo usa manchas ya desenfocadas en imagen, sin `filter`
en vivo. Scroll de la home: escritorio de 5,3 a 59,9 fps, celular de 9,9 a 60,0 fps.

**Portada liviana del reel de labufarra-social, hecha** (`c6dcd57`): la portada es un fragmento de 9 s
sin audio en loop (`reel-portada.mp4`, 726 KB) y el botón "Ver con sonido" carga recién ahí el reel
completo (7,6 MB) con audio y controles. Lighthouse en celular: de 3,4 MB a 1,0 MB de peso.

**Pendientes:**
- [ ] **Videos de las prendas, el mes que viene:** el bloque garment ya tiene el campo `"video"`
  (`{src, poster}`) para reemplazar la foto en percha. No usar los `.mp4` de `_ref/remeras/video/`:
  tienen las prendas cortadas.
- [x] **NIDO** (hecho el 26/10, ver arriba): armar su página de caso con la plantilla. En celular se desborda hacia el costado
  (413 px de ancho en una pantalla de 375): eso cancela la transición al entrar. Por ahora `nido.html`
  solo cambió `viewport-fit=cover` y las rutas de sus 3 historias a las copias limpias.
- [x] **Casos como panel sobre la home** (probado y unido el 26/10, ver arriba; lo que sigue es histórico): hecho en la rama **`v2/panel`**
  (commit `bec9026`, "WIP", sin push), **pendiente de que Tomás lo pruebe**. Click en una tarjeta de caso:
  el caso sube como panel con el `<article>` de su página; la URL cambia a la del caso; se cierra con
  Cerrar, Escape, "atrás" o tocando el fondo. Pasó 35 de 35 pruebas automáticas (escritorio y celular).
  En esa rama `case.css` quedó separado en `css/case-base.css` (lo de página) y `css/case.css` (bloques).
  El `index.html` y las 9 páginas del repo **todavía no se regeneraron** con esa versión.

  Para probarlo en `:3002` (desde la raíz del repo, en una terminal):
  ```
  git switch v2/panel
  P=../preview-panel; mkdir -p $P
  for f in *; do case "$f" in index.html|by-kafuse.html|sport-editorial.html|bufarra-kithome.html|bufarra-umbro.html|final-clasica.html|iris-lab.html|labufarra-social.html|serie-rio-plata.html|tienda-nacional.html) ;; *) [ -e "$P/$f" ] || ln -s "$PWD/$f" "$P/$f";; esac; done
  python3 scripts/build-cases.py --out $P
  python3 scripts/build-home.py --out $P
  npx serve $P -l 3002 --symlinks
  ```
  - `git switch v2/panel`: pasa a la rama del panel.
  - `mkdir` y el `for`: arman una carpeta de prueba al lado del repo, con accesos directos a todo el
    sitio menos la home y las 9 páginas de caso, que se generan ahí.
  - Los dos `python3 … --out`: generan la home y los casos en esa carpeta, sin tocar los del repo
    (los scripts se niegan a escribir a través de un acceso directo).
  - `npx serve`: la sirve en http://127.0.0.1:3002 (Ctrl+C para apagarla).
  - Para volver: `git switch v2/redesign`.

  Si se aprueba: en `v2/panel`, correr `python3 scripts/build-cases.py` y `python3 scripts/build-home.py`
  (sin `--out`), commitear esas páginas y pasar la rama a `v2/redesign`.
- [x] **Logo de la versión 8 del prototipo** (hecho el 26/10).
- [ ] **Lighthouse final.**

**Pendientes de la etapa 7.1:**
- Lighthouse contra la preview de Vercel (tiene la protección activada: pide login).
- Elegir la portada de labufarra.com (opción B, partidos y tabla, puesta por defecto; opción A, solo tabla).
- Revisar la preview y decidir el merge de `v2/redesign` a main.

## Antes (etapa 7, todavía vigente)

**Etapa 7: sistema de diseño y rediseño**, en la rama `v2/redesign`.

Antes de diseñar hay que cerrar:

1. **La estructura:** trabajos seleccionados + archivo.
2. **El posicionamiento.**
