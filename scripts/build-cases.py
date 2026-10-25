#!/usr/bin/env python3
"""Genera las páginas de caso (by-kafuse.html, etc.) a partir de data/cases.json con una sola plantilla.

Uso (desde la raíz del repo):  python3 scripts/build-cases.py
                    (con --out CARPETA escribe las páginas en otra carpeta, para probar sin pisar las del sitio)

Cada caso es una lista de bloques en orden. Tipos de bloque:
  hero          título, bajada (lead) y fecha
  cover         imagen principal (src, alt); lleva el view-transition-name de la tarjeta de la home
  facts         ficha: items = [[clave, valor], …] con clave client | for | year | did | tools
  story         frase grande (heading) + párrafos (paras)
  split-video   video vertical en marco (src, poster) + heading y paras; "controls": true si tiene sonido
  video-pair    dos videos verticales con sonido, cruzados en diagonal (items = [{src, poster, heading}])
  sheet         pieza sobre plano claro (src, alt, caption y heading opcionales)
  gallery       tira de fotos que se desliza, con visor a pantalla completa (items = [{src, alt}], heading opcional)
  before-after  comparador arrastrable (before, after); "cover": true si hace de imagen principal
  steps         pasos numerados (items = [{title, text}])
  prompt        texto de prompt (label, text) + imagen resultado opcional (src, alt)
  video-embed   video de YouTube (id, title)
  ext-link      link externo (href, label)
  next          siguiente caso (sale del orden de data/works.json)

Textos: {"es": …, "en": …} o un texto solo si es igual en los dos idiomas.
El orden de los casos (contador "2 de 10" y "Siguiente") es el de data/works.json.
"""
import html, json, os, struct, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = lambda s: html.escape(s, quote=True)
SITE = "https://www.blancogrosso.com"

CASES = json.load(open(os.path.join(ROOT, "data", "cases.json"), encoding="utf-8"))["cases"]
WORKS = json.load(open(os.path.join(ROOT, "data", "works.json"), encoding="utf-8"))["works"]
SEQUENCE = [w for w in WORKS if not w.get("external")]  # casos con página propia, en el orden de la home

FACT_LABELS = {
    "client": ("Cliente", "Client"),
    "for": ("Para", "For"),
    "year": ("Año", "Year"),
    "did": ("Qué hice", "What I did"),
    "tools": ("Herramientas", "Tools"),
}

def es(t): return t["es"] if isinstance(t, dict) else t
def en(t): return t["en"] if isinstance(t, dict) else t

def bi(t, tag="span"):
    """Texto en los dos idiomas: si es igual, va una sola vez."""
    a, b = E(es(t)), E(en(t))
    if a == b: return a
    return f'<{tag} class="lang-es">{a}</{tag}><{tag} class="lang-en" lang="en">{b}</{tag}>'

def alt_attrs(t):
    a, b = es(t), en(t)
    return f'alt="{E(a)}"' + (f' data-en-alt="{E(b)}"' if a != b else "")

def img_size(src):
    """Ancho y alto de un AVIF (cajas 'ispe'), para reservar el lugar y que no salte el layout.
    Los AVIF grandes vienen en mosaico: hay una caja por mosaico y otra para la imagen entera (la mayor)."""
    try:
        data = open(os.path.join(ROOT, src), "rb").read(8192)
    except OSError:
        return None
    sizes, i = [], data.find(b"ispe")
    while i != -1:
        sizes.append(struct.unpack(">II", data[i + 8:i + 16]))
        i = data.find(b"ispe", i + 4)
    return max(sizes, key=lambda s: s[0] * s[1]) if sizes else None

def img(src, alt, lazy=True, extra="", sizes="100vw", small_suffix="-1080"):
    size = img_size(src)
    dims = f' width="{size[0]}" height="{size[1]}"' if size else ""
    load = ' loading="lazy" decoding="async"' if lazy else ' fetchpriority="high"'
    # si al lado hay una versión liviana (<nombre>-1080.avif, o -tira.avif en la galería), esa va como src
    # y el navegador pasa al original solo si la pantalla lo pide
    small = src[:-5] + small_suffix + ".avif" if src.endswith(".avif") else None
    srcset, main = "", src
    if small and size and os.path.exists(os.path.join(ROOT, small)):
        w = img_size(small)[0]
        srcset = f' srcset="{E(small)} {w}w, {E(src)} {size[0]}w" sizes="{sizes}"'
        main = small
    return f'<img src="{E(main)}"{srcset}{dims} {alt_attrs(alt)}{load}{extra}>'

def svg(path, sw="2", box="0 0 20 20", cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<svg{c} viewBox="{box}" fill="none" stroke="currentColor" stroke-width="{sw}" aria-hidden="true">{path}</svg>'

ARROW = svg('<path d="M3 10h13M11 4l6 6-6 6"/>', "2.4")
CLOSE = svg('<path d="M2 2l10 10M12 2L2 12"/>', "1.8", "0 0 14 14")
KNOB = svg('<path d="M8 6l-5 5 5 5M14 6l5 5-5 5"/>', "2", "0 0 22 22")
# ícono de ampliar en cada foto de la galería (decorativo: la foto ya dice "Ver foto 2 de 6 en grande")
ZOOM = '<span class="zoom" aria-hidden="true">' + svg('<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/>', "1.8", "0 0 16 16") + '</span>'
NEW_TAB = '<span class="sr-only">' + bi({"es": " (abre en una pestaña nueva)", "en": " (opens in a new tab)"}) + '</span>'

def vt(slug): return f' style="view-transition-name: case-{slug}"'

# ── Bloques ──────────────────────────────────────────────

def b_hero(b, c):
    return f'''    <header class="c-hero">
      <h1 class="rv">{bi(b["title"])}</h1>
      <p class="c-lead rv">{bi(b["lead"])}</p>
      <p class="c-meta rv">{bi(b["date"])}</p>
    </header>'''

def b_cover(b, c):
    if b["src"].endswith(".mp4"):
        media = f'<video src="{E(b["src"])}" poster="{E(b.get("poster", ""))}" muted loop playsinline preload="metadata" data-autoplay></video>'
    else:
        media = img(b["src"], b["alt"], lazy=False)
    return f'    <figure class="cover rv-img" id="cover" data-vt{vt(c["slug"])}>{media}</figure>'

def b_facts(b, c):
    rows = "\n".join(f'      <div><dt>{bi(dict(zip(("es", "en"), FACT_LABELS[k])))}</dt><dd>{bi(v)}</dd></div>' for k, v in b["items"])
    return f'    <dl class="facts rv">\n{rows}\n    </dl>'

def block_heading(b):
    """Título opcional de un bloque (galería, pieza sobre plano claro)."""
    return f'\n      <h2 class="blk-h rv">{bi(b["heading"])}</h2>' if b.get("heading") else ""

def paras(b):
    return "".join(f"<p>{bi(p)}</p>" for p in b.get("paras", []))

def b_story(b, c):
    return f'''    <section class="story">
      <h2 class="rv">{bi(b["heading"])}</h2>
      <div class="rv">{paras(b)}</div>
    </section>'''

def b_split_video(b, c):
    # "controls": true para piezas con sonido: no arranca sola y se reproduce con los controles
    attrs = "controls playsinline" if b.get("controls") else "muted loop playsinline data-autoplay"
    return f'''    <section class="split">
      <div class="phone rv-img"><video src="{E(b["src"])}" poster="{E(b["poster"])}" {attrs} preload="metadata"></video></div>
      <div class="rv">
        <h2>{bi(b["heading"])}</h2>{paras(b)}
      </div>
    </section>'''

def b_video_pair(b, c):
    """Dos videos verticales con sonido, cruzados: el primero arriba a la izquierda y el segundo
    más abajo a la derecha. Se reproducen con los controles (no arrancan solos)."""
    items = "\n".join(
        f'''      <figure class="vp-item">
        <h2 class="blk-h rv">{bi(v["heading"])}</h2>
        <div class="phone rv-img"><video src="{E(v["src"])}" poster="{E(v["poster"])}" controls playsinline preload="metadata"></video></div>
      </figure>''' for v in b["items"])
    return f'    <section class="vpair">\n{items}\n    </section>'

def b_sheet(b, c):
    cap = f'\n      <figcaption class="cap">{bi(b["caption"])}</figcaption>' if b.get("caption") else ""
    return f'''    <figure class="sheet-wrap">{block_heading(b)}
      <div class="sheet rv-img">{img(b["src"], b["alt"])}</div>{cap}
    </figure>'''

def b_gallery(b, c):
    """Tira horizontal: cada foto entera (alto fijo, ancho según su proporción). En escritorio lleva
    flechas y contador; tocar una foto la abre en el visor (lo arma js/case.js).
    La tira usa <nombre>-tira.avif (1000 px de ancho); el original (data-full) lo carga el visor al abrirse."""
    n = len(b["items"])
    sizes = "(min-width: 760px) 460px, 85vw"  # el alto manda: una foto vertical nunca pasa de ~460 px de ancho
    nodrag = ' draggable="false"'
    full = lambda src: f' data-full="{E(src)}"'
    figs = "\n".join(
        f'        <figure tabindex="0" role="button" aria-label="Ver foto {k + 1} de {n} en grande" data-en-aria-label="View photo {k + 1} of {n} large">'
        f'{img(i["src"], i["alt"], sizes=sizes, extra=nodrag + full(i["src"]), small_suffix="-tira")}{ZOOM}</figure>'
        for k, i in enumerate(b["items"]))
    prev = svg('<path d="M12 4l-6 6 6 6"/>')
    nxt = svg('<path d="M8 4l6 6-6 6"/>')
    return f'''    <div class="gal-block">{block_heading(b)}
      <div class="rv">
      <div class="gal-ctrl">
        <span class="gc-count"><span class="gc-n">1</span> {bi({"es": "de", "en": "of"})} {n}</span>
        <span class="gc-btns"><button type="button" class="gc-prev" aria-label="Foto anterior" data-en-aria-label="Previous photo">{prev}</button><button type="button" class="gc-next" aria-label="Foto siguiente" data-en-aria-label="Next photo">{nxt}</button></span>
      </div>
      <div class="gal">
{figs}
      </div>
      </div>
    </div>'''

def b_before_after(b, c):
    cover = b.get("cover")
    wrap = ' id="cover" data-vt' if cover else ""
    name = vt(c["slug"]) if cover else ""
    lazy = not cover
    sizes = "(min-width: 760px) 720px, 100vw"  # el comparador mide como mucho 720 px
    w, h = img_size(b["after"]["src"]) or (3, 4)  # la caja toma la proporción de las fotos (las dos miden igual)
    return f'''    <div class="ba rv{" ba-cover" if cover else ""}"{wrap} style="--ar: {w} / {h}">
      <div class="ba-box"{name}>
        {img(b["before"]["src"], b["before"]["alt"], lazy, sizes=sizes)}
        {img(b["after"]["src"], b["after"]["alt"], lazy, ' class="after"', sizes)}
        <span class="ba-line"></span>
        <span class="ba-knob" aria-hidden="true">{KNOB}</span>
        <span class="ba-tag l" aria-hidden="true">{bi({"es": "Generada", "en": "Generated"})}</span><span class="ba-tag r" aria-hidden="true">{bi({"es": "Terminada", "en": "Finished"})}</span>
        <input type="range" min="0" max="100" value="50" aria-label="Comparar foto generada y pieza terminada" data-en-aria-label="Compare generated photo and finished piece">
      </div>
    </div>'''

def b_steps(b, c):
    items = "\n".join(
        f'      <li class="rv"><span class="n grad" aria-hidden="true">{k + 1:02d}</span><h3>{bi(s["title"])}</h3><p>{bi(s["text"])}</p></li>'
        for k, s in enumerate(b["items"]))
    four = " four" if len(b["items"]) == 4 else ""  # 4 pasos: de a dos en tablet, los cuatro juntos en escritorio
    return f'    <ol class="steps{four}">\n{items}\n    </ol>'

def b_prompt(b, c):
    # la imagen resultado es opcional; sin ella el prompt ocupa todo el ancho
    fig = f'\n      <figure class="rv-img">{img(b["src"], b["alt"])}</figure>' if b.get("src") else ""
    return f'''    <section class="prompt{"" if fig else " solo"}">
      <pre class="rv"><b>{E(b["label"])}</b>

{E(b["text"])}</pre>{fig}
    </section>'''

def b_video_embed(b, c):
    return f'''    <div class="embed rv-img"><iframe src="https://www.youtube-nocookie.com/embed/{E(b["id"])}" title="{E(es(b["title"]))}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'''

def b_ext_link(b, c):
    return f'    <a class="ext rv" href="{E(b["href"])}" target="_blank" rel="noopener">{bi(b["label"])} <span aria-hidden="true">↗</span>{NEW_TAB}</a>'

def b_next(b, c):
    i = next(k for k, w in enumerate(SEQUENCE) if w["slug"] == c["slug"])
    w = SEQUENCE[(i + 1) % len(SEQUENCE)]
    thumb = f'img/works/{w["slug"]}.avif'
    return f'''    <a class="next" href="{E(w["href"])}">
      <small>{bi({"es": "Siguiente", "en": "Next"})}</small>
      <span class="nt"><span class="grad">{E(w["title"])}</span>{ARROW}</span>
      <span class="thumb">{img(thumb, "")}</span>
    </a>'''

BLOCKS = {
    "hero": b_hero, "cover": b_cover, "facts": b_facts, "story": b_story, "split-video": b_split_video,
    "video-pair": b_video_pair, "sheet": b_sheet, "gallery": b_gallery, "before-after": b_before_after, "steps": b_steps,
    "prompt": b_prompt, "video-embed": b_video_embed, "ext-link": b_ext_link, "next": b_next,
}

# ── Página ───────────────────────────────────────────────

def page(c):
    m, slug = c["meta"], c["slug"]
    pos = next(k for k, w in enumerate(SEQUENCE) if w["slug"] == slug) + 1
    url = f"{SITE}/{slug}"
    body = "\n".join(BLOCKS[b["type"]](b, c) for b in c["blocks"])
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{E(m["title"])}</title>
  <meta name="description" content="{E(m["description"])}">
  <meta name="theme-color" content="#0a0a0a">
  <!-- Open Graph / canonical -->
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Blanco Grosso">
  <meta property="og:locale" content="es_UY">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{E(m["og_title"])}">
  <meta property="og:description" content="{E(m["description"])}">
  <meta property="og:image" content="{SITE}/img/og/{slug}.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{E(m["og_image_alt"])}">
  <meta name="twitter:card" content="summary_large_image">
  <!-- /Open Graph -->
  <link rel="icon" type="image/png" href="img/icons/logo-verde.png">
  <link rel="preload" href="fonts/archivo-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/case.css">
  <link rel="stylesheet" href="css/view-transitions.css">
  <!-- la transición desde la home espera a que exista la imagen principal -->
  <link rel="expect" href="#cover" blocking="render">
  <script>
    /* Antes de pintar: idioma guardado y si hay JS (evita parpadeos) */
    (function () {{
      var d = document.documentElement; d.classList.add('js');
      try {{ if (localStorage.getItem('bg-lang') === 'en') {{ d.classList.add('lang-en-active'); d.lang = 'en'; }} }} catch (e) {{}}
      /* si se llega con la transición desde la home, la imagen principal ya está destapada */
      window.addEventListener('pagereveal', function (e) {{
        var cover = document.querySelector('[data-vt]');
        if (e.viewTransition && cover) cover.classList.add('in', 'no-anim');
      }});
    }})();
  </script>
</head>
<body>
  <header class="bar">
    <span class="count">{bi({"es": f"{pos} de {len(SEQUENCE)}", "en": f"{pos} of {len(SEQUENCE)}"})}</span>
    <div class="bar-end">
      <div class="lang" role="group" aria-label="Idioma / Language">
        <button type="button" class="lang-btn" data-lang="es" aria-pressed="true">ES</button>
        <button type="button" class="lang-btn" data-lang="en" aria-pressed="false">EN</button>
      </div>
      <a class="close" href="/#works">{CLOSE}{bi({"es": "Cerrar", "en": "Close"})}</a>
    </div>
  </header>

  <main>
  <article class="case" data-case="{slug}">
{body}
  </article>
  </main>

  <script src="js/case.js" defer></script>
</body>
</html>
'''

OUT_DIR = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else ROOT
for c in CASES:
    out = os.path.join(OUT_DIR, c["slug"] + ".html")
    if os.path.islink(out):  # en una carpeta de prueba, no escribir a través de un acceso directo al sitio
        sys.exit(f"{out} es un acceso directo: no lo piso")
    html_text = page(c)
    open(out, "w", encoding="utf-8").write(html_text)
    print("ok", out, len(html_text), "bytes")
