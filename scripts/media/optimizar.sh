#!/usr/bin/env bash
# Optimiza imágenes, videos y PDF de una carpeta y deja el resultado en otra.
# Nunca modifica la carpeta de entrada. Ver scripts/media/README.md.
#
# Uso: optimizar.sh [opciones] <carpeta-entrada> <carpeta-salida>
set -u

# ---------- valores por defecto (las reglas del sitio) ----------
IMG_LADO_MAX=2560        # px, lado largo máximo de imágenes
IMG_CALIDAD=60           # calidad AVIF inicial (0-100, más alto = mejor)
IMG_CALIDAD_MIN=50       # no bajar de acá para entrar en el peso
IMG_CALIDAD_MAX=80       # tope al subir calidad buscando el SSIM
IMG_SSIM_MIN=0.95        # umbral de "sin pérdida visible" (SSIM contra la referencia redimensionada)
IMG_PESO_MAX_KB=800      # objetivo por imagen
AVIF_RECOMPRIMIR_KB=1024 # un .avif existente se recomprime solo si pesa más que esto (o supera el lado máximo)
VID_LADO_MAX=1920        # px, lado LARGO máximo de video (1080×1920 en vertical)
VID_LADO_MIN=1280        # px, lado largo mínimo al que se puede bajar para entrar en el techo
VID_CRF_INICIAL=26       # se prueba 26 → 28 → 30
VID_TECHO_MB=5           # peso máximo por video
AUDIO=1                  # 1 = conservar audio (AAC), 0 = sacarlo (--sin-audio)
AUDIO_KBPS=128
AUDIO_MONO=0
PDF_TECHO_MB=5
POSTER=1                 # generar <video>-poster.avif

uso() {
  sed -n '2,5p' "$0" | sed 's/^# \{0,1\}//'
  cat <<'EOF'

Opciones:
  --sin-audio            quita la pista de audio de los videos (por defecto se conserva)
  --mono                 baja el audio a mono
  --audio-kbps N         bitrate AAC (por defecto 128)
  --techo-video MB       peso máximo por video (por defecto 5)
  --video-lado-min PX    lado largo mínimo al que se puede reducir un video (por defecto 1280;
                         igual a 1920 = no reducir nunca)
  --crf-inicial N        CRF con el que arranca la escalera 26/28/30 (por defecto 26)
  --sin-poster           no generar el póster AVIF de cada video
  --calidad N            calidad AVIF inicial (por defecto 60)
  --ssim-min X           SSIM mínimo buscado para imágenes (por defecto 0.95)
  --peso-max-kb N        peso objetivo por imagen en KB (por defecto 800)
  -h, --help             esta ayuda
EOF
}

POS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --sin-audio) AUDIO=0 ;;
    --mono) AUDIO_MONO=1 ;;
    --audio-kbps) AUDIO_KBPS="$2"; shift ;;
    --techo-video) VID_TECHO_MB="$2"; shift ;;
    --video-lado-min) VID_LADO_MIN="$2"; shift ;;
    --crf-inicial) VID_CRF_INICIAL="$2"; shift ;;
    --sin-poster) POSTER=0 ;;
    --calidad) IMG_CALIDAD="$2"; shift ;;
    --ssim-min) IMG_SSIM_MIN="$2"; shift ;;
    --peso-max-kb) IMG_PESO_MAX_KB="$2"; shift ;;
    -h|--help) uso; exit 0 ;;
    -*) echo "Opción desconocida: $1" >&2; uso >&2; exit 64 ;;
    *) POS+=("$1") ;;
  esac
  shift
done
[ ${#POS[@]} -eq 2 ] || { uso >&2; exit 64; }
IN="${POS[0]%/}"; OUT="${POS[1]%/}"

for t in avifenc avifdec ffmpeg ffprobe gs exiftool; do
  command -v "$t" >/dev/null 2>&1 || { echo "Falta '$t'. Instalá: brew install libavif ffmpeg ghostscript exiftool" >&2; exit 69; }
done
[ -d "$IN" ] || { echo "No existe la carpeta de entrada: $IN" >&2; exit 66; }
mkdir -p "$OUT"
IN_ABS=$(cd "$IN" && pwd -P); OUT_ABS=$(cd "$OUT" && pwd -P)
case "$OUT_ABS/" in "$IN_ABS/"*) echo "La salida no puede estar dentro de la entrada" >&2; exit 64 ;; esac
case "$IN_ABS/" in "$OUT_ABS/"*) echo "La entrada no puede estar dentro de la salida" >&2; exit 64 ;; esac

TMP=$(mktemp -d "${TMPDIR:-/tmp}/optimizar.XXXXXX"); trap 'rm -rf "$TMP"' EXIT
REPORTE="$OUT/_reporte.tsv"
printf 'archivo\tsalida\tantes_kb\tdespues_kb\tdetalle\testado\n' > "$REPORTE"
EXCEDIDOS=0

kb() { echo $(( ($(stat -f %z "$1" 2>/dev/null || stat -c %s "$1") + 1023) / 1024 )); }
reporte() { printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$@" >> "$REPORTE"; printf '%-60s %7s KB → %7s KB  %-34s %s\n' "$1" "$3" "$4" "$5" "$6"; }
limpiar_meta() { exiftool -q -overwrite_original -exif:all= -xmp:all= -gps:all= "$1" >/dev/null 2>&1 || true; }
lados() { # imprime "ancho alto" de una imagen
  exiftool -s3 -ImageWidth -ImageHeight "$1" 2>/dev/null | tr '\n' ' '
}
ssim() { # SSIM entre dos imágenes del mismo tamaño
  ffmpeg -nostdin -hide_banner -nostats -v info -i "$1" -i "$2" -lavfi "[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]ssim" -f null - 2>&1 |
    sed -n 's/.*All:\([0-9.]*\).*/\1/p' | tail -1
}

codificar() { avifenc -q "$1" -s 4 -j all --ignore-exif --ignore-xmp "$2" "$3" >/dev/null 2>&1; }
medir() { avifdec "$2" "$TMP/dec.png" >/dev/null 2>&1 && ssim "$1" "$TMP/dec.png"; }

imagen() { # $1 entrada, $2 salida .avif, $3 relativo
  local src="$1" dst="$2" rel="$3" w h lado ref q tmp_out ss
  read -r w h <<<"$(lados "$src")"
  lado=$(( w > h ? w : h ))
  ref="$TMP/ref.png"
  # referencia en PNG (redimensionada si hace falta); sips conserva el perfil de color
  if command -v sips >/dev/null 2>&1; then
    if [ "$lado" -gt "$IMG_LADO_MAX" ]; then sips -s format png -Z "$IMG_LADO_MAX" "$src" --out "$ref" >/dev/null
    else sips -s format png "$src" --out "$ref" >/dev/null; fi
  else
    ffmpeg -nostdin -v error -y -i "$src" -vf "scale='if(gte(iw,ih),min($IMG_LADO_MAX,iw),-2)':'if(gte(iw,ih),-2,min($IMG_LADO_MAX,ih))'" "$ref"
  fi
  limpiar_meta "$ref"
  # 1) bajar la calidad (hasta IMG_CALIDAD_MIN) si se pasa del peso objetivo
  q=$IMG_CALIDAD
  while :; do
    codificar "$q" "$ref" "$TMP/out.avif" || { reporte "$rel" "-" "$(kb "$src")" "-" "avifenc falló" "ERROR"; return; }
    if [ "$(kb "$TMP/out.avif")" -le "$IMG_PESO_MAX_KB" ] || [ "$q" -le "$IMG_CALIDAD_MIN" ]; then break; fi
    q=$(( q - 5 ))
  done
  ss=$(medir "$ref" "$TMP/out.avif")
  # 2) subirla (hasta IMG_CALIDAD_MAX) mientras el SSIM no llegue al umbral y entre en el peso
  while [ "$q" -lt "$IMG_CALIDAD_MAX" ] && awk "BEGIN{exit !(${ss:-1} < $IMG_SSIM_MIN)}"; do
    codificar $(( q + 5 )) "$ref" "$TMP/try.avif" || break
    [ "$(kb "$TMP/try.avif")" -gt "$IMG_PESO_MAX_KB" ] && break
    q=$(( q + 5 )); mv "$TMP/try.avif" "$TMP/out.avif"; ss=$(medir "$ref" "$TMP/out.avif")
  done
  tmp_out="$TMP/out.avif"
  mkdir -p "$(dirname "$dst")"; mv "$tmp_out" "$dst"; limpiar_meta "$dst"
  [ -n "$ss" ] && awk "BEGIN{exit !($ss < $IMG_SSIM_MIN)}" && ss="$ss(bajo)"
  read -r w h <<<"$(lados "$dst")"
  local estado=OK; [ "$(kb "$dst")" -gt "$IMG_PESO_MAX_KB" ] && estado="SUPERA_${IMG_PESO_MAX_KB}KB"
  reporte "$rel" "${dst#"$OUT"/}" "$(kb "$src")" "$(kb "$dst")" "avif q$q ${w}x$h ssim=${ss:-?}" "$estado"
}

avif_existente() {
  local src="$1" dst="$2" rel="$3" w h lado
  read -r w h <<<"$(lados "$src")"; lado=$(( w > h ? w : h ))
  if [ "$(kb "$src")" -gt "$AVIF_RECOMPRIMIR_KB" ] || [ "$lado" -gt "$IMG_LADO_MAX" ]; then
    avifdec "$src" "$TMP/src.png" >/dev/null 2>&1 && imagen "$TMP/src.png" "$dst" "$rel"
  else
    mkdir -p "$(dirname "$dst")"; cp -p "$src" "$dst"; limpiar_meta "$dst"
    reporte "$rel" "${dst#"$OUT"/}" "$(kb "$src")" "$(kb "$dst")" "avif sin recomprimir (solo metadatos)" "OK"
  fi
}

video() {
  local src="$1" dst="$2" rel="$3" w h lado durac tiene_audio crf lado_obj escala audio_args tmp_out elegido="" detalle
  read -r w h <<<"$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$src" | tr x ' ')"
  lado=$(( w > h ? w : h ))
  durac=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  tiene_audio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$src" | head -1)
  if [ "$AUDIO" -eq 1 ] && [ -n "$tiene_audio" ]; then
    audio_args="-c:a aac -b:a ${AUDIO_KBPS}k"; [ "$AUDIO_MONO" -eq 1 ] && audio_args="$audio_args -ac 1"
  else audio_args="-an"; fi
  # escalera: lado largo máximo con CRF creciente; después, si se permite, 1280 px
  local lados_try="$VID_LADO_MAX"; [ "$VID_LADO_MIN" -lt "$VID_LADO_MAX" ] && lados_try="$VID_LADO_MAX $VID_LADO_MIN"
  for lado_obj in $lados_try; do
    [ "$lado_obj" -gt "$lado" ] && lado_obj=$lado   # nunca agrandar
    for crf in 26 28 30; do
      [ "$crf" -lt "$VID_CRF_INICIAL" ] && continue
      escala="scale='if(gte(iw,ih),min($lado_obj,iw),-2)':'if(gte(iw,ih),-2,min($lado_obj,ih))'"
      tmp_out="$TMP/v_${lado_obj}_$crf.mp4"
      # shellcheck disable=SC2086
      ffmpeg -nostdin -v error -y -i "$src" -map 0:v:0 $( [ "$audio_args" != "-an" ] && echo "-map 0:a:0" ) \
        -map_metadata -1 -map_chapters -1 -vf "$escala,format=yuv420p" \
        -c:v libx264 -preset slow -crf "$crf" -profile:v high $audio_args \
        -movflags +faststart "$tmp_out" || { reporte "$rel" "-" "$(kb "$src")" "-" "ffmpeg falló" "ERROR"; return; }
      elegido="$tmp_out"; detalle="h264 crf$crf lado${lado_obj} $( [ "$audio_args" = "-an" ] && echo sin-audio || echo "aac${AUDIO_KBPS}k$( [ "$AUDIO_MONO" -eq 1 ] && echo -mono)") ${durac%%.*}s"
      [ "$(kb "$tmp_out")" -le $(( VID_TECHO_MB * 1024 )) ] && break 2
    done
  done
  mkdir -p "$(dirname "$dst")"; mv "$elegido" "$dst"
  local estado=OK; [ "$(kb "$dst")" -gt $(( VID_TECHO_MB * 1024 )) ] && { estado="SUPERA_${VID_TECHO_MB}MB"; EXCEDIDOS=$((EXCEDIDOS+1)); }
  reporte "$rel" "${dst#"$OUT"/}" "$(kb "$src")" "$(kb "$dst")" "$detalle" "$estado"
  if [ "$POSTER" -eq 1 ]; then
    local t=1; awk "BEGIN{exit !($durac < 2)}" && t=0
    ffmpeg -nostdin -v error -y -ss "$t" -i "$dst" -frames:v 1 "$TMP/poster.png" &&
      imagen "$TMP/poster.png" "${dst%.*}-poster.avif" "${rel%.*} (póster)"
  fi
}

pdf() {
  local src="$1" dst="$2" rel="$3"
  mkdir -p "$(dirname "$dst")"
  gs -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -dCompatibilityLevel=1.5 -dPDFSETTINGS=/ebook \
     -dDetectDuplicateImages=true -sOutputFile="$dst" "$src" || { reporte "$rel" "-" "$(kb "$src")" "-" "ghostscript falló" "ERROR"; return; }
  limpiar_meta "$dst"
  local estado=OK; [ "$(kb "$dst")" -gt $(( PDF_TECHO_MB * 1024 )) ] && { estado="SUPERA_${PDF_TECHO_MB}MB"; EXCEDIDOS=$((EXCEDIDOS+1)); }
  reporte "$rel" "${dst#"$OUT"/}" "$(kb "$src")" "$(kb "$dst")" "pdf /ebook" "$estado"
}

# La lista se lee por el descriptor 3: así ffmpeg/ffprobe (que leen stdin) no pueden comerse nombres de archivo.
find "$IN" -type f ! -name '._*' ! -name '.DS_Store' -print0 | sort -z > "$TMP/lista"
while IFS= read -r -d '' f <&3; do
  rel="${f#"$IN"/}"; base="${rel%.*}"
  ext=$(printf '%s' "${rel##*.}" | tr '[:upper:]' '[:lower:]')
  case "$ext" in
    png|jpg|jpeg|webp|tif|tiff|heic|heif) imagen "$f" "$OUT/$base.avif" "$rel" ;;
    avif) avif_existente "$f" "$OUT/$base.avif" "$rel" ;;
    mp4|mov|m4v|webm|mkv) video "$f" "$OUT/$base.mp4" "$rel" ;;
    pdf) pdf "$f" "$OUT/$base.pdf" "$rel" ;;
    svg|ico|gif) mkdir -p "$(dirname "$OUT/$rel")"; cp -p "$f" "$OUT/$rel"; reporte "$rel" "$rel" "$(kb "$f")" "$(kb "$OUT/$rel")" "copiado sin cambios" "OK" ;;
    *) reporte "$rel" "-" "$(kb "$f")" "-" "tipo no soportado, ignorado" "IGNORADO" ;;
  esac
done 3< "$TMP/lista"

echo
echo "Verificación de metadatos (EXIF/GPS) en la salida:"
con_meta=$(exiftool -q -r -if '$exif:all or $gps:all' -p '$Directory/$FileName' "$OUT" 2>/dev/null | /usr/bin/grep -v '_reporte.tsv' || true)
if [ -n "$con_meta" ]; then echo "$con_meta"; else echo "  ningún archivo con EXIF ni GPS"; fi
echo "Reporte: $REPORTE"
if /usr/bin/grep -qE $'\t(SUPERA_[^\t]*|ERROR)$' "$REPORTE"; then
  echo "ATENCIÓN: hay archivos que superan el límite o fallaron (ver columna estado)." >&2
  exit 2
fi
