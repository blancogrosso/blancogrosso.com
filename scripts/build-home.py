#!/usr/bin/env python3
"""Genera index.html (home one-page) a partir de data/works.json y de los servicios de abajo.

Uso (desde la raíz del repo):  python3 scripts/build-home.py
                    (con --out CARPETA escribe index.html en otra carpeta, para probar sin pisar el del sitio)

Los trabajos destacados quedan escritos en el HTML (los leen Google y las vistas previas
de links, que no ejecutan JS). Los demás van en un <template>: js/home.js los agrega a la
grilla junto con los filtros. Sin JS se ven los destacados.
"""
import html, json, os, re, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# con --out CARPETA escribe index.html en otra carpeta, para probar sin pisar el del sitio
OUT = os.path.join(sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else ROOT, "index.html")
E = lambda s: html.escape(s, quote=True)
WA = "https://wa.me/59899234543?text="
CALL = "https://calendar.app.google/xqyLbf59LWQSJCHk7"

WORKS = json.load(open(os.path.join(ROOT, "data", "works.json"), encoding="utf-8"))["works"]
# trabajos con página de caso de la plantilla (data/cases.json): en la home se abren como panel
CASE_SLUGS = {c["slug"] for c in json.load(open(os.path.join(ROOT, "data", "cases.json"), encoding="utf-8"))["cases"]}
# herramientas de la sección "Herramientas" (data/tools.json)
TOOLS = json.load(open(os.path.join(ROOT, "data", "tools.json"), encoding="utf-8"))["groups"]
FILTERS = [  # id, etiqueta ES, etiqueta EN
    ("featured", "Destacados", "Featured"),
    ("branding", "Branding", "Branding"),
    ("sport", "Sport Design", "Sport Design"),
    ("web", "Web", "Web"),
    ("motion", "Motion", "Motion"),
    ("campaigns", "Campañas y contenido", "Campaigns &amp; content"),
]

# nombre, desc ES, desc EN, incluye ES, incluye EN, ejemplo (texto, url, externo), WA ES, WA EN
SERVICES = [
 ("Visual Sprint",
  "Branding, Social Media, piezas de campaña. Identidad visual con impacto inmediato.",
  "Branding, Social Media, campaign assets. Visual identity with immediate impact.",
  "Identidad de marca, key visuals y campañas, contenido para redes, templates y sistemas gráficos.",
  "Brand identity, key visuals and campaigns, social media content, templates and graphic systems.",
  ("NIDO", "/nido-identidad", False),
  "Hola Tomás, me gustaría pedir presupuesto para un Visual Sprint (Branding/Identidad).",
  "Hi Tomás, I'd like to request a quote for a Visual Sprint (Branding/Identity)."),
 ("Digital Powerhouse",
  "Web, producto digital, dashboards de datos. Diseño + código con visión estratégica.",
  "Web, digital product, data dashboards. Design + code with strategic vision.",
  "Sitios web y landing pages, producto digital y UI/UX, dashboards y visualización de datos, integración con IA.",
  "Websites and landing pages, digital product and UI/UX, dashboards and data viz, AI integration.",
  ("navajabarber.com", "https://navajabarber.com", True),
  "Hola Tomás, me gustaría pedir presupuesto para un proyecto de Digital Powerhouse (Web/Producto).",
  "Hi Tomás, I'd like to request a quote for a Digital Powerhouse project (Web/Product)."),
 ("Creative Partnership",
  "Dirección creativa externa, acompañamiento recurrente. Tu estudio creativo on-demand.",
  "External creative direction, recurring support. Your on-demand creative studio.",
  "Dirección creativa, consultoría de marca, retainer mensual, estrategia y ejecución.",
  "Creative direction, brand consultancy, monthly retainer, strategy and execution.",
  ("La Bufarra", "https://labufarra.com", True),
  "Hola Tomás, me gustaría pedir presupuesto para un Creative Partnership.",
  "Hi Tomás, I'd like to request a quote for a Creative Partnership."),
]

def bi(es, en, tag="span"):
    return f'<{tag} class="lang-es">{es}</{tag}><{tag} class="lang-en" lang="en">{en}</{tag}>'

def svg(path, cls="", sw="2.2", fill="none"):
    c = f' class="{cls}"' if cls else ""
    stroke = '' if fill != "none" else f' stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"'
    return f'<svg{c} viewBox="0 0 24 24" fill="{fill}"{stroke} aria-hidden="true">{path}</svg>'

ARROW_RIGHT = svg('<path d="M5 12h14M13 6l6 6-6 6"/>', "ar")
ARROW_DOWN = svg('<path d="M12 5v14M5 12l7 7 7-7"/>', "ar-down")
ARROW_EXT = svg('<path d="M7 17 17 7M8 7h9v9"/>', "ext-ic")
WHATSAPP = svg('<path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.6 2.6 0 0 0-.8 1.9 4.5 4.5 0 0 0 1 2.4 10.3 10.3 0 0 0 4 3.5c1.5.6 2 .7 2.8.6a2.3 2.3 0 0 0 1.5-1.1 1.9 1.9 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3Z"/>', fill="currentColor")
CAMERA = svg('<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8Z"/>', sw="2")
TICK = svg('<path d="M4 12.5l5 5 11-11"/>', "tick", sw="2.6")
BACK = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 10H4M9 4l-6 6 6 6"/></svg>'
CLOSE_X = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12"/></svg>'
NEW_TAB = '<span class="sr-only">' + bi(" (abre en una pestaña nueva)", " (opens in a new tab)") + '</span>'

# Tamaños: el patrón 7/5, 4/4/4, 5/7, 6/6 se repite; la última fila nunca deja una tarjeta chica
# sola (sobra 1: ancho completo; 2: 6/6; 3: 4/4/4). Es la misma regla que layout() en js/home.js.
PATTERN = [[7, 5], [4, 4, 4], [5, 7], [6, 6]]
TAIL = {1: [12], 2: [6, 6], 3: [4, 4, 4]}
def layout_classes(n):
    spans, i, row = [], 0, 0
    while i < n:
        left = n - i
        r = TAIL[left] if left <= 3 else PATTERN[row % len(PATTERN)]
        spans += r; i += len(r); row += 1
    out = []
    for k, sp in enumerate(spans):
        h = "h-full" if sp == 12 else "h-tall" if sp in (7, 5) else "h-mid" if sp == 4 else "h-wide"
        c = f"s{sp} {h}"
        if n % 2 == 1 and k == n - 1: c += " two-col-full"
        out.append(c)
    return out

def card(w, size=""):
    ext = w.get("external", False)
    attrs = f' data-slug="{w["slug"]}" data-filters="{" ".join(w["filters"])}"'
    if w.get("featured"): attrs += ' data-featured'
    if w["slug"] in CASE_SLUGS: attrs += ' data-case'
    if ext: attrs += ' target="_blank" rel="noopener" data-external'
    if w.get("preview"): attrs += f' data-preview="img/works/{w["slug"]}-preview.mp4"'
    img = w.get("img", f'img/works/{w["slug"]}.avif')  # "img": portada con otro nombre que el slug
    fit = ' class="fit-contain"' if w.get("fit") == "contain" else ""
    bg = f' style="background:{w["bg"]}"' if w.get("bg") else ""
    video = '\n          <video muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>' if w.get("preview") else ""
    cat = E(w["cat"]) + (" " + ARROW_EXT if ext else "")
    return f'''      <a class="card{(" " + size) if size else ""}" href="{E(w["href"])}"{attrs}>
        <div class="card-media"{bg}>
          <img data-src="{img}" width="1200" height="900" alt="{E(w["title"])}"{fit} loading="lazy" decoding="async" fetchpriority="low">
          <noscript><img src="{img}" width="1200" height="900" alt="{E(w["title"])}"{fit} loading="lazy" decoding="async"></noscript>{video}
        </div>
        <div class="card-meta">
          <h3>{E(w["title"])}</h3>
          <p class="card-cat">{cat}</p>
          <p class="card-desc">{bi(E(w["desc"]["es"]), E(w["desc"]["en"]))}</p>
          <p class="card-tools">{E(w["tools"])}</p>{(chr(10) + "          " + NEW_TAB) if ext else ""}
        </div>
      </a>'''

# Logo grande (versión 8 del prototipo): letra por letra, para que cada una lleve su margen de aire
# (el degradado no corta los bordes del dibujo) y para el kerning del lockup: L-A, A-N, G-R, R-O, O-S.
# --i es el orden de entrada de cada letra y --r el renglón. js/home.js arma el degradado y el movimiento.
KERN = {2: "k-la", 3: "k-an", 7: "k-gr", 8: "k-ro", 9: "k-os"}
def logo_html():
    rows, i = [], 0
    for r, word in enumerate(("BLANCO", "GROSSO")):
        chs = ""
        for ch in word:
            k = f" {KERN[i]}" if i in KERN else ""
            chs += f'<span class="ch{k}" style="--i:{i};--r:{r}">{ch}</span>'
            i += 1
        rows.append(f'<span class="logo-row" aria-hidden="true"><span>{chs}</span></span>')
    return ('<div class="logo-wrap" id="logoWrap"><span class="halo" aria-hidden="true"></span>'
            f'<h1 class="logo" id="logo" aria-label="Blanco Grosso">{"".join(rows)}</h1></div>')
LOGO = logo_html()

featured = [w for w in WORKS if w.get("featured")]
others = [w for w in WORKS if not w.get("featured")]
sizes = layout_classes(len(featured))
featured_html = "\n".join(card(w, sizes[k]) for k, w in enumerate(featured))
others_html = "\n".join(card(w) for w in others)
def count(f): return len(featured) if f == "featured" else sum(1 for w in WORKS if f in w["filters"])
filters_html = "\n".join(
    f'          <button type="button" class="filter" data-filter="{fid}" aria-pressed="{str(fid == "featured").lower()}">'
    f'<span class="filter-label">{bi(es, en) if es != en else es}</span><sup>{count(fid)}</sup></button>'
    for fid, es, en in FILTERS)

offers = []
for name, des, den, ies, ien, (exn, exu, ext), wes, wen in SERVICES:
    target = ' target="_blank" rel="noopener"' if ext else ""
    offers.append(f'''    <article class="offer" data-reveal>
      <h3>{E(name)}</h3>
      <div class="offer-body">
        <p>{bi(E(des), E(den))}</p>
        <p class="offer-inc">{bi(E(ies), E(ien))}</p>
        <p class="offer-ex">{bi("Ejemplo:", "Example:")} <a href="{E(exu)}"{target}>{E(exn)}{NEW_TAB if ext else ""}</a></p>
      </div>
      <div class="offer-cta">
        <a class="btn btn-ghost lang-es" href="{E(WA + urllib.parse.quote(wes))}" target="_blank" rel="noopener">Pedir presupuesto {ARROW_RIGHT}</a>
        <a class="btn btn-ghost lang-en" lang="en" href="{E(WA + urllib.parse.quote(wen))}" target="_blank" rel="noopener">Request a quote {ARROW_RIGHT}</a>
      </div>
    </article>''')

# Herramientas: una cinta de borde a borde que se desplaza lento en loop (todas las herramientas de
# data/tools.json seguidas, en el orden de los grupos). Cada una es una pastilla con el ícono en una
# baldosa y el nombre como texto (el ícono es decorativo: alt vacío). Los íconos negros llevan invert.
# La lista va tres veces para que el loop no tenga costura hasta pantallas de ~3800 px; las copias están
# escondidas para los lectores de pantalla (y con movimiento reducido no se muestran: queda una fila
# quieta que se scrollea). Los íconos no van lazy: los que todavía no entraron aparecerían de golpe.
def tool(t):
    inv = " invert" if t.get("invert") else ""
    return (f'<li class="tool"><span class="tool-tile"><img class="tool-ic{inv}" src="img/icons/stack/{E(t["icon"])}.avif" '
            f'width="28" height="28" alt="" decoding="async" fetchpriority="low"></span><span class="tool-name">{E(t["name"])}</span></li>')
TOOL_ITEMS = "\n".join("          " + tool(t) for g in TOOLS for t in g["items"])

WA_ES = WA + urllib.parse.quote("Hola Tomás, vi tu portfolio y me gustaría hablar sobre un proyecto.")
WA_EN = WA + urllib.parse.quote("Hi Tomás, I saw your portfolio and I'd like to talk about a project.")

page = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Blanco Grosso | Creative Studio for Sports &amp; Tech</title>
  <meta name="description" content="Blanco Grosso es un estudio creativo especializado en Sport Design, Vibe Coding e inteligencia artificial aplicada. Diseño estratégico para marcas que compiten.">
  <meta name="theme-color" content="#050505">
  <!-- Open Graph / canonical -->
  <link rel="canonical" href="https://www.blancogrosso.com/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Blanco Grosso">
  <meta property="og:locale" content="es_UY">
  <meta property="og:url" content="https://www.blancogrosso.com/">
  <meta property="og:title" content="Blanco Grosso | Creative Studio for Sports &amp; Tech">
  <meta property="og:description" content="Estudio creativo de Sport Design, Vibe Coding e inteligencia artificial aplicada en Montevideo. Diseño estratégico, tecnología moderna e IA para marcas que compiten.">
  <meta property="og:image" content="https://www.blancogrosso.com/img/og/home.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Logo de Blanco Grosso en verde sobre fondo oscuro con grilla, con el claim Creative Studio for Sports &amp; Tech">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/png" href="img/icons/logo-verde.png">
  <link rel="preload" href="fonts/archivo-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/home.css">
  <link rel="stylesheet" href="css/view-transitions.css">
  <script>
    /* Antes de pintar: idioma guardado y si hay JS para las animaciones y si hay movimiento (evita parpadeos y saltos de layout) */
    (function () {{
      var d = document.documentElement; d.classList.add('js');
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {{
        d.classList.add('motion');
        /* la entrada (fondo, letras, claim, botones y menú) corre solo la primera vez por sesión */
        try {{ if (!sessionStorage.getItem('bg-entrada')) {{ d.classList.add('intro-play'); sessionStorage.setItem('bg-entrada', '1'); }} }} catch (e) {{ d.classList.add('intro-play'); }}
      }}
      try {{ if (localStorage.getItem('bg-lang') === 'en') {{ d.classList.add('lang-en-active'); d.lang = 'en'; }} }} catch (e) {{}}
      /* Al volver de un caso: la imagen de su tarjeta recibe el mismo nombre que la imagen
         principal del caso, así la transición entre páginas la devuelve a su lugar */
      window.addEventListener('pagereveal', function (e) {{
        if (!e.viewTransition || !window.navigation || !navigation.activation || !navigation.activation.from) return;
        var slug = new URL(navigation.activation.from.url).pathname.replace(/^\\/|\\.html$/g, '');
        var img = slug && document.querySelector('.card[data-slug="' + slug + '"]:not([hidden]) .card-media img');
        if (!img) return;
        if (img.dataset.src) {{ img.src = img.dataset.src; img.removeAttribute('data-src'); }} // ya está en caché: que llegue con imagen
        img.style.viewTransitionName = 'case-' + slug;
        e.viewTransition.finished.finally(function () {{ img.style.viewTransitionName = ''; }});
      }});
    }})();
  </script>
</head>
<body>
  <a class="skip" href="#trabajos">{bi("Saltar a los trabajos", "Skip to work")}</a>

  <div class="bg" aria-hidden="true">
    <div class="bg-mesh"></div>
    <div class="bg-grid"></div>
  </div>

  <header class="nav" id="nav">
    <div class="wrap nav-row">
      <a href="#inicio" class="nav-mark" aria-label="Blanco Grosso, inicio"><span class="mark" id="navMark" aria-hidden="true"><span>BLANCO</span><span>GROSSO</span></span></a>
      <nav aria-label="Principal">
        <ul class="nav-links">
          <li><a href="#trabajos">{bi("Trabajos", "Work")}</a></li>
          <li><a href="#servicios">{bi("Servicios", "Services")}</a></li>
          <li><a href="#contacto">{bi("Contacto", "Contact")}</a></li>
        </ul>
      </nav>
      <div class="lang" role="group" aria-label="Idioma / Language">
        <button type="button" class="lang-btn" data-lang="es" aria-pressed="true">ES</button>
        <button type="button" class="lang-btn" data-lang="en" aria-pressed="false">EN</button>
      </div>
    </div>
  </header>

  <main>
    <section class="intro" id="inicio">
      <div class="wrap intro-inner" id="introInner">
        {LOGO}
        <div class="intro-foot">
          <div>
            <p class="claim">Creative Studio <span class="claim-acc">for Sports &amp; Tech</span></p>
            <p class="tags">Sport Design · Vibe Coding · AI Powered</p>
          </div>
          <div class="intro-side">
            <p class="lead">{bi("Diseño estratégico, tecnología moderna e inteligencia artificial para marcas que compiten.", "Strategic design, modern technology, and artificial intelligence for competing brands.")}</p>
            <div class="ctas">
              <a class="btn btn-primary" href="#trabajos">{bi("Ver trabajos", "View work")}{ARROW_DOWN}</a>
              <a class="btn btn-ghost" href="#contacto">{bi("Hablemos", "Let's talk")}</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="reel-sec" id="reelSec" aria-label="Showreel">
      <div class="reel-stage" id="reelStage">
        <div class="reel" id="reel">
          <!-- showreel de trabajos (_ref/showreel/): 1080p y, en pantallas de menos de 900 px, la versión de 720
               (la elige js/home.js al cargarlo). Los anteriores (reel-provisorio, montaje-provisorio, reel-servicios) siguen en img/reel/. -->
          <video id="reelVideo" muted loop playsinline preload="none" data-poster="img/reel/showreel-poster.avif" data-src="img/reel/showreel.mp4" data-src-chico="img/reel/showreel-720.mp4" width="1920" height="1080" aria-label="Showreel de trabajos de Blanco Grosso" data-en-aria-label="Blanco Grosso showreel of projects"></video>
          <button type="button" class="reel-toggle" id="reelToggle" aria-pressed="false">{bi("Pausar", "Pause")}</button>
        </div>
      </div>
    </section>

    <section class="works wrap" id="trabajos" aria-labelledby="t-trabajos">
      <span id="works" class="anchor-alias" aria-hidden="true"></span>
      <div class="works-top" data-reveal>
        <div class="works-title">
          <h2 id="t-trabajos">{bi("Trabajos", "Work")}</h2>
          <p class="works-count" aria-hidden="true"><span class="works-count-num" id="worksCountNum">{len(featured)}</span> <span class="works-count-word" id="worksCountWord">{bi("trabajos", "projects")}</span></p>
        </div>
        <div class="filters" role="group" aria-label="Filtrar trabajos" data-en-aria-label="Filter work">
{filters_html}
        </div>
        <p class="sr-only" id="worksStatus" role="status" aria-live="polite"></p>
      </div>
      <div class="grid" id="worksGrid">
{featured_html}
      </div>
      <!-- Trabajos que no están en Destacados: js/home.js los agrega a la grilla para los filtros -->
      <template id="worksMore">
{others_html}
      </template>
    </section>

    <section class="services wrap" id="servicios" aria-labelledby="t-servicios">
      <div class="sec-head" data-reveal>
        <h2 id="t-servicios">{bi("Servicios", "Services")}</h2>
      </div>
{chr(10).join(offers)}
    </section>

    <section class="stack" id="herramientas" aria-label="Herramientas" data-en-aria-label="Tools" data-reveal>
      <div class="ribbon" id="ribbon">
        <ul class="ribbon-track">
{TOOL_ITEMS}
        </ul>
        <ul class="ribbon-track ribbon-copy" aria-hidden="true">
{TOOL_ITEMS}
        </ul>
        <ul class="ribbon-track ribbon-copy" aria-hidden="true">
{TOOL_ITEMS}
        </ul>
      </div>
    </section>

    <section class="contact wrap" id="contacto" aria-labelledby="t-contacto">
      <h2 id="t-contacto" data-reveal>{bi("¿Tenés un proyecto en mente?", "Have a project in mind?")}</h2>
      <p class="lead" data-reveal>{bi("Contame tu idea y armamos una propuesta a medida.", "Tell me about your idea and we'll build a tailored proposal.")}</p>
      <div class="contact-ctas" data-reveal>
        <a class="btn btn-primary btn-lg lang-es" href="{E(WA_ES)}" target="_blank" rel="noopener">{WHATSAPP}Escribime por WhatsApp{NEW_TAB}</a>
        <a class="btn btn-primary btn-lg lang-en" lang="en" href="{E(WA_EN)}" target="_blank" rel="noopener">{WHATSAPP}Message me on WhatsApp{NEW_TAB}</a>
        <a class="btn btn-ghost btn-lg" href="{CALL}" target="_blank" rel="noopener">{CAMERA}{bi("Charlemos de tu proyecto", "Let's talk about your project")}{NEW_TAB}</a>
        <div class="mail">
          <span class="mail-text" id="mailText">tomasblancogrosso@gmail.com</span>
          <button type="button" class="mail-copy" id="mailCopy" data-es="Copiar" data-en="Copy" data-done-es="Copiado" data-done-en="Copied">{TICK}<span class="mail-copy-label">Copiar</span></button>
        </div>
        <p class="sr-only" id="copyStatus" role="status" aria-live="polite"></p>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="wrap footer-row">
      <p>© 2026 Blanco Grosso · Montevideo, Uruguay</p>
      <ul class="footer-links">
        <li><a href="https://instagram.com/blancogrosso" target="_blank" rel="noopener">Instagram</a></li>
        <li><a href="https://linkedin.com/in/tomasblancogrosso" target="_blank" rel="noopener">LinkedIn</a></li>
        <li><a href="https://behance.net/blancogrosso" target="_blank" rel="noopener">Behance</a></li>
        <li><a href="https://x.com/blancogrosso" target="_blank" rel="noopener">X</a></li>
      </ul>
    </div>
  </footer>

  <!-- etiqueta que sigue al mouse sobre las tarjetas (solo con mouse) -->
  <div class="cursor-tag" id="cursorTag" aria-hidden="true"><span></span></div>

  <!-- caso como panel sobre la home: js/home.js lo llena con el <article> de la página del caso
       (las que genera scripts/build-cases.py); abrir la URL del caso directo muestra la página completa -->
  <div class="cp-scrim" id="cpScrim" hidden></div>
  <div class="case-panel case-tokens" id="casePanel" role="dialog" aria-modal="true" aria-label="Caso" tabindex="-1" hidden data-lenis-prevent>
    <header class="bar" id="cpBar">
      <span class="cp-handle" aria-hidden="true"></span>
      <div class="bar-start">
        <button type="button" class="back" id="cpBack">{BACK}{bi("Trabajos", "Work")}</button>
        <span class="count" id="cpCount"></span>
      </div>
      <span class="bar-title" id="cpTitle" aria-hidden="true"></span>
      <div class="bar-end">
        <div class="lang" role="group" aria-label="Idioma / Language">
          <button type="button" class="lang-btn" data-lang="es" aria-pressed="true">ES</button>
          <button type="button" class="lang-btn" data-lang="en" aria-pressed="false">EN</button>
        </div>
        <button type="button" class="close x" id="cpClose" aria-label="Cerrar" data-en-aria-label="Close">{CLOSE_X}</button>
      </div>
    </header>
    <div class="cp-body" id="cpBody"></div>
  </div>

  <!-- home.js carga gsap, ScrollTrigger, Flip y Lenis (js/vendor/) después del evento load -->
  <script src="js/home.js" defer></script>
</body>
</html>
'''
# si al lado de una foto hay una copia <nombre>-limpio.avif (sin la línea clara que dejó una mala
# exportación en el borde), se usa esa, como en scripts/build-cases.py. El original no se toca.
def limpio(m):
    src = m.group(0)
    c = src[:-5] + "-limpio.avif"
    return c if not src.endswith("-limpio.avif") and os.path.exists(os.path.join(ROOT, c)) else src
page = re.sub(r"img/[^\"'\s,)]+?\.avif", limpio, page)

if os.path.islink(OUT):  # en una carpeta de prueba, no escribir a través de un acceso directo al sitio
    sys.exit(f"{OUT} es un acceso directo: no lo piso")
open(OUT, "w", encoding="utf-8").write(page)
print("ok", OUT, len(page), "bytes ·", len(featured), "destacados en el HTML,", len(others), "en el template")
