# optimizar.sh — dieta de media

Comprime una carpeta de imágenes, videos y PDF y deja el resultado en otra carpeta,
con la misma estructura de subcarpetas. **Nunca modifica la carpeta de entrada.**

```sh
scripts/media/optimizar.sh [opciones] <carpeta-entrada> <carpeta-salida>
```

Al terminar escribe `<carpeta-salida>/_reporte.tsv` (archivo, salida, peso antes/después,
detalle y estado), verifica que ningún archivo de salida tenga EXIF ni GPS y sale con
código `2` si algún archivo supera su límite o falló.

## Requisitos

macOS con Homebrew:

```sh
brew install libavif ffmpeg ghostscript exiftool
```

- `avifenc` / `avifdec` (libavif): codificar AVIF y medir calidad.
- `ffmpeg` / `ffprobe`: videos, pósters y SSIM.
- `gs` (ghostscript): PDF.
- `exiftool`: leer dimensiones y quitar metadatos.
- `sips` (viene con macOS): redimensiona imágenes conservando el perfil de color.
  Si no está, se usa `ffmpeg`.

Funciona con el `bash` 3.2 que trae macOS.

## Qué hace con cada tipo

### Imágenes (`png`, `jpg`, `jpeg`, `webp`, `tif`, `heic`) → AVIF

- Lado largo máximo **2560 px** (no agranda nunca).
- Calidad inicial **60** (`avifenc -q`, velocidad 4).
- Si pesa más de **800 KB**, baja la calidad de a 5 hasta **50** como mínimo.
- Después mide el **SSIM** contra la imagen original redimensionada. Si da menos de **0.95**,
  sube la calidad de a 5 (hasta 80) mientras siga entrando en 800 KB.
- En el reporte, `ssim=…(bajo)` significa que no llegó a 0.95 sin pasarse del peso: hay que
  mirarla a ojo. Suele pasar en fotos con mucho grano, donde el SSIM es pesimista.
- Quita EXIF, XMP y GPS. Conserva el perfil de color (ICC) y la transparencia.

### AVIF existentes

- Se recomprimen (con las reglas de arriba) **solo si pesan más de 1 MB o superan 2560 px**.
- Si no, se copian tal cual y solo se les quitan los metadatos (sin recomprimir; los
  píxeles quedan idénticos).
- Si tenés el original (png/jpg) de un AVIF grande, conviene pasar el **original** como
  entrada: así se evita sumar una segunda pérdida de compresión.

### Videos (`mp4`, `mov`, `m4v`, `webm`, `mkv`) → MP4

- H.264 (`libx264`, `-preset slow`, `yuv420p`) + AAC, con `-movflags +faststart`
  (el video empieza a reproducirse antes de bajar entero).
- **El máximo de 1920 px se aplica al LADO LARGO**: un vertical 2160×3840 queda en
  1080×1920; un horizontal 3840×2160 queda en 1920×1080. Nunca agranda.
- Escalera de calidad: CRF **26 → 28 → 30**. Si con CRF 30 sigue pasando el techo
  (**5 MB** por defecto), prueba con lado largo **1280 px** y CRF 28 → 30.
  Elige la primera combinación que entra en el techo (la de mejor calidad posible).
- El audio **se conserva por defecto** (AAC 128 kbps). `--sin-audio` lo saca: usalo solo
  para videos que se reproducen en silencio y no tienen controles ni botón de sonido.
- Genera además `<nombre>-poster.avif`, un cuadro del segundo 1 para usar como `poster`.
- Quita los metadatos del contenedor.

### PDF

- Ghostscript con `-dPDFSETTINGS=/ebook` (imágenes a ~150 dpi). Techo **5 MB**.

### SVG, ICO, GIF

- Se copian sin cambios.

## Opciones

| Opción | Efecto |
|---|---|
| `--sin-audio` | Saca el audio de los videos (por defecto se conserva). |
| `--mono` | Baja el audio a mono. Solo si el original es mono de hecho (los dos canales iguales). |
| `--audio-kbps N` | Bitrate AAC (por defecto 128). |
| `--techo-video MB` | Peso máximo por video (por defecto 5). |
| `--video-lado-min PX` | Lado largo mínimo al que se puede bajar un video para entrar en el techo (por defecto 1280; con `1920` no baja nunca). |
| `--crf-inicial N` | CRF con el que arranca la escalera 26/28/30 (por defecto 26). |
| `--sin-poster` | No generar pósters. |
| `--calidad N` | Calidad AVIF inicial (por defecto 60). |
| `--ssim-min X` | SSIM objetivo de imágenes (por defecto 0.95). |
| `--peso-max-kb N` | Peso objetivo por imagen (por defecto 800). |

## Ejemplos

```sh
# Una carpeta de fotos de una sesión
scripts/media/optimizar.sh ~/Desktop/sesion-cliente ~/Desktop/sesion-cliente-web

# Clips que se reproducen en loop sin sonido (sin audio)
scripts/media/optimizar.sh --sin-audio ~/Desktop/loops ~/Desktop/loops-web

# Un reel largo con audio: sin bajar de 1080×1920 y techo de 10 MB
scripts/media/optimizar.sh --techo-video 10 --video-lado-min 1920 --crf-inicial 28 \
  ~/Desktop/reels ~/Desktop/reels-web
```

Después revisá `_reporte.tsv` en la carpeta de salida: los estados distintos de `OK`
(`SUPERA_…`, `ERROR`, `ssim=…(bajo)`) son los que hay que mirar.

## Excepción vigente en el sitio: reels largos

En blancogrosso.com hay dos reels que no entran en 5 MB sin perder calidad visible:

- `img/works/bufarra-umbro/reel-final.mp4` (60 s, 1080×1920)
- `img/works/labufarra-social/reel.mp4` (72 s, 1280×720, con botón de sonido)

Para **esos dos únicamente** se acepta un techo de **10 MB**, sin bajar de su resolución
(1080 px / 1280 px de lado largo según el caso) y arrancando en CRF 28:

```sh
scripts/media/optimizar.sh --techo-video 10 --video-lado-min 1920 --crf-inicial 28 <in> <out>
# labufarra-social/reel.mp4 además con: --audio-kbps 96   (el audio es estéreo real; no se pasa a mono)
```

En el rediseño se decide si siguen en el sitio o se reemplazan por un teaser corto.
Cualquier otro archivo de más de 5 MB es un error y hay que revisarlo a mano.
