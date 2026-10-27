#!/usr/bin/env python3
"""Genera las miniaturas del muro de la home a partir de data/muro.json.

Uso (desde la raíz del repo):  python3 scripts/media/miniaturas-muro.py
                               (con --forzar vuelve a generar las que ya existen)

Cada pieza "carpeta/nombre" toma img/works/carpeta/nombre.avif (o su copia -limpio.avif si
existe), la recorta al cuadrado del centro y la guarda en img/muro/carpeta-nombre.avif, de
420 x 420 px. Los originales no se tocan. Una miniatura que ya existe no se pisa sin --forzar.
Necesita avifdec, avifenc y ffmpeg (brew install libavif ffmpeg).
"""
import json, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LADO = 420
FORZAR = "--forzar" in sys.argv


def nombre(pieza):
    return pieza.replace("/", "-") + ".avif"


def origen(pieza):
    base = os.path.join(ROOT, "img", "works", pieza)
    return base + "-limpio.avif" if os.path.exists(base + "-limpio.avif") else base + ".avif"


def main():
    tiles = json.load(open(os.path.join(ROOT, "data", "muro.json"), encoding="utf-8"))["tiles"]
    os.makedirs(os.path.join(ROOT, "img", "muro"), exist_ok=True)
    fallas = 0
    with tempfile.TemporaryDirectory() as tmp:
        for i, pieza in enumerate(tiles):
            src, dst = origen(pieza), os.path.join(ROOT, "img", "muro", nombre(pieza))
            if os.path.exists(dst) and not FORZAR:
                print(f"ya existe   {os.path.relpath(dst, ROOT)}")
                continue
            if not os.path.exists(src):
                print(f"FALTA       {os.path.relpath(src, ROOT)}"); fallas += 1; continue
            png, cuad = os.path.join(tmp, f"{i}.png"), os.path.join(tmp, f"{i}-c.png")
            pasos = [
                ["avifdec", src, png],
                # cuadrado del centro y escala a 420 px
                ["ffmpeg", "-v", "error", "-y", "-i", png, "-vf",
                 f"crop='min(iw,ih)':'min(iw,ih)',scale={LADO}:{LADO}:flags=lanczos", cuad],
                ["avifenc", "-q", "62", "-s", "4", "-j", "all", "--ignore-exif", "--ignore-xmp", cuad, dst],
            ]
            for p in pasos:
                if subprocess.run(p, capture_output=True).returncode:
                    print(f"NO DECODIFICA o falló {p[0]}: {os.path.relpath(src, ROOT)}"); fallas += 1
                    break
            else:
                print(f"{os.path.getsize(dst) // 1024:>4} KB     {os.path.relpath(dst, ROOT)}  <- {os.path.relpath(src, ROOT)}")
    sys.exit(1 if fallas else 0)


main()
