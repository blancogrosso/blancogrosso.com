/* Blanco Grosso: home one-page (v2) */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = false;
  var lenis = null;

  /* ── Idioma ─────────────────────────────────────────────
     Mismo almacenamiento que las páginas de caso ('bg-lang'),
     así el idioma elegido se mantiene al navegar. */
  var langButtons = document.querySelectorAll('.lang-btn');
  var mailCopy = document.getElementById('mailCopy');
  function setLang(lang) {
    var en = lang === 'en';
    root.classList.toggle('lang-en-active', en);
    root.lang = en ? 'en' : 'es';
    langButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    document.querySelectorAll('[data-en-aria-label]').forEach(function (el) {
      if (!el.dataset.esAriaLabel) el.dataset.esAriaLabel = el.getAttribute('aria-label');
      el.setAttribute('aria-label', en ? el.dataset.enAriaLabel : el.dataset.esAriaLabel);
    });
    if (mailCopy) mailCopy.textContent = en ? mailCopy.dataset.en : mailCopy.dataset.es;
    document.querySelectorAll('img[data-en-alt]').forEach(function (img) {
      if (!img.dataset.esAlt) img.dataset.esAlt = img.alt;
      img.alt = en ? img.dataset.enAlt : img.dataset.esAlt;
    });
    if (typeof updateCount === 'function' && countEl) updateCount();
    updateReelToggle();
    try { localStorage.setItem('bg-lang', lang); } catch (e) {}
  }
  langButtons.forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });

  var nav = document.getElementById('nav');
  function navOffset(id) { return id === '#inicio' ? 0 : -(nav.offsetHeight - 1); }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: navOffset(id), duration: 1.2 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
      if (target.tabIndex < 0 && !/^(A|BUTTON|INPUT)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ── Menú: fondo al bajar y marca cuando el logo sale ─── */
  var logo = document.getElementById('logo');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var gone = !es[0].isIntersecting;
      nav.classList.toggle('is-solid', gone);
      nav.classList.toggle('show-mark', gone);
    }, { rootMargin: '-' + (nav.offsetHeight) + 'px 0px 0px 0px' }).observe(logo);
  }
  // sección actual en el menú
  var navLinks = document.querySelectorAll('.nav-links a');
  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('is-current', on);
          if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['trabajos', 'servicios', 'contacto'].forEach(function (id) { var s = document.getElementById(id); if (s) secIO.observe(s); });
  }

  /* ── Apertura y escena del reel ──────────────────────── */
  var reelBox = document.getElementById('reel');
  var reelVideo = document.getElementById('reelVideo');
  var reelToggle = document.getElementById('reelToggle');
  var reelPausedByUser = reduce; // con movimiento reducido no arranca solo

  function updateReelToggle() {
    if (!reelToggle) return;
    var playing = reelVideo && !reelVideo.paused;
    var en = root.classList.contains('lang-en-active');
    reelToggle.setAttribute('aria-pressed', String(!playing));
    reelToggle.querySelector('.lang-es').textContent = playing ? 'Pausar' : 'Reproducir';
    reelToggle.querySelector('.lang-en').textContent = playing ? 'Pause' : 'Play';
    reelToggle.setAttribute('aria-label', en ? (playing ? 'Pause showreel' : 'Play showreel') : (playing ? 'Pausar showreel' : 'Reproducir showreel'));
  }
  function loadReel() {
    if (!reelVideo.poster && reelVideo.dataset.poster) reelVideo.poster = reelVideo.dataset.poster;
    if (!reelVideo.src && reelVideo.dataset.src) reelVideo.src = reelVideo.dataset.src;
  }
  function playReel() { loadReel(); var p = reelVideo.play(); if (p && p.catch) p.catch(function () {}); }
  if (reelVideo) {
    reelVideo.addEventListener('play', updateReelToggle);
    reelVideo.addEventListener('pause', updateReelToggle);
    reelToggle.addEventListener('click', function () {
      if (reelVideo.paused) { reelPausedByUser = false; playReel(); }
      else { reelPausedByUser = true; reelVideo.pause(); }
    });
    if ('IntersectionObserver' in window) {
      // carga recién al acercarse y reproduce solo mientras se ve. Se empieza a observar
      // después del evento load: así el video (2,9 MB) no le quita ancho de banda a la
      // fuente del logo en la primera carga.
      var watchReel = function () {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) { loadReel(); if (!reelPausedByUser) playReel(); }
            else if (!reelVideo.paused) reelVideo.pause();
          });
        }, { rootMargin: '25% 0px' }).observe(reelBox);
      };
      var afterLoad = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(watchReel); };
      if (document.readyState === 'complete') afterLoad(); else window.addEventListener('load', afterLoad, { once: true });
    } else { loadReel(); }
    updateReelToggle();
  }

  /* ══ Trabajos ═══════════════════════════════════════════
     Un solo lugar para los datos: sumar un trabajo = agregar una entrada.
     filters: branding | sport | web | motion | campaigns (puede tener varios).
     featured: aparece en "Destacados" (en este orden). external: abre en pestaña nueva.
     fit: 'contain' + bg: la portada se muestra entera sobre ese color (para logos que no admiten recorte). */
  var WORKS = [
    { slug: 'labufarra-social', title: { es: 'Vuelta a las redes @labufarra', en: 'Vuelta a las redes @labufarra' },
      cat: 'AI-Powered · Audiovisual Production',
      desc: { es: 'Video 100% IA para anunciar la vuelta a la conducción de redes.', en: '100% AI video to announce the return to social media management.' },
      tools: 'GPT, Gemini, Photoshop, Flow, Premiere', img: 'img/works/labufarra-social.avif', preview: 'img/works/labufarra-social-preview.mp4',
      href: '/labufarra-social', featured: true, filters: ['motion'] },
    { slug: 'sport-editorial', title: { es: 'Sport Editorial', en: 'Sport Editorial' }, cat: 'AI-Powered · Sport Design',
      desc: { es: 'Creación de imágenes sport editorial de alto nivel.', en: 'High-level sport editorial image creation.' },
      tools: 'GPT, Gemini, Photoshop', img: 'img/works/sport-editorial.avif', href: '/sport-editorial', featured: true, filters: ['sport'] },
    { slug: 'bufarra-umbro', title: { es: 'La Bufarra x Umbro Uruguay', en: 'La Bufarra x Umbro Uruguay' }, cat: 'AI-Powered · Sport Design · Apparel',
      desc: { es: 'Diseño de prenda y campaña express con video hype.', en: 'Apparel design and express campaign with hype video.' },
      tools: 'Illustrator, Photoshop, Claude, Gemini, Flow, CapCut', img: 'img/works/bufarra-umbro.avif', preview: 'img/works/bufarra-umbro-preview.mp4',
      href: '/bufarra-umbro', featured: true, filters: ['sport', 'motion'] },
    { slug: 'bufarra-kithome', title: { es: 'Bufarra KitHome 24/25', en: 'Bufarra KitHome 24/25' }, cat: 'AI-Powered · Sport Design',
      desc: { es: 'Diseño de prenda. Foto shooting IA con GPT/Gemini. Piezas para redes sociales.', en: 'Apparel design. AI photo shooting with GPT/Gemini. Social media assets.' },
      tools: 'GPT, Gemini, Photoshop, Illustrator, Lightroom', img: 'img/works/bufarra-kithome.avif', href: '/bufarra-kithome', featured: true, filters: ['sport'] },
    { slug: 'tienda-nacional', title: { es: 'Tienda Nacional', en: 'Tienda Nacional' }, cat: 'Brand Systems · Digital Content',
      desc: { es: 'Campaña Nacional Campeón e IVA OFF. Banners web y pautas RRSS.', en: 'National Champion & VAT OFF campaign. Web banners and social media ads.' },
      tools: 'Illustrator, Photoshop', img: 'img/works/tienda-nacional.avif', href: '/tienda-nacional', featured: true, filters: ['campaigns'] },
    { slug: 'by-kafuse', title: { es: 'By Kafuse Alas y Raíces', en: 'By Kafuse Alas y Raíces' }, cat: 'Apparel Design · Creative Direction · Audiovisual Production',
      desc: { es: 'Drop de media estación Otoño/Invierno. Diseño 2 en 1 y producción de estudio.', en: 'Autumn/Winter mid-season drop. 2-in-1 design and studio production.' },
      tools: 'Illustrator, Photoshop, Lightroom', img: 'img/works/by-kafuse.avif', preview: 'img/works/by-kafuse-preview.mp4',
      href: '/by-kafuse', featured: true, filters: ['campaigns'] },
    { slug: 'serie-rio-plata', title: { es: 'Serie Río de la Plata', en: 'Serie Río de la Plata' }, cat: 'Sport Design · Digital Content',
      desc: { es: 'Matchday de partidos internacionales seleccionados para las redes oficiales.', en: 'Matchday designs for selected international matches on official networks.' },
      tools: 'Photoshop, Lightroom', img: 'img/works/serie-rio-plata.avif', href: '/serie-rio-plata', featured: true, filters: ['sport'] },
    { slug: 'iris-lab', title: { es: 'Iris Lab', en: 'Iris Lab' }, cat: 'Photography · Brand Systems',
      desc: { es: 'Temporada Punta del Este. Fotos, color, diseño, impresión y armado de cuadro.', en: 'Punta del Este summer season. Photography, color, design, and final artwork.' },
      tools: 'Lightroom, Photoshop', img: 'img/works/iris-lab.avif', href: '/iris-lab', featured: true, filters: [] },
    { slug: 'final-clasica', title: { es: 'Final Clásica Fútbol Uruguayo', en: 'Final Clásica Fútbol Uruguayo' }, cat: 'Sport Design',
      desc: { es: 'Anuncio de cobertura de partido final clásica para las redes de Fix.', en: 'Classic final match coverage announcement for Fix networks.' },
      tools: 'Photoshop, Lightroom', img: 'img/works/final-clasica.avif', href: '/final-clasica', featured: true, filters: ['sport'] },
    { slug: 'nido', title: { es: 'NIDO', en: 'NIDO' }, cat: 'Brand Systems',
      desc: { es: 'Identidad visual completa para nido, marca de diseño para el hogar: ícono, paleta, tipografía, fotografía y piezas para Instagram.',
              en: 'Complete visual identity for nido, a home design brand: icon, palette, typography, photography and Instagram pieces.' },
      tools: 'GPT, Gemini, Photoshop', img: 'img/works/nido.avif', fit: 'contain', bg: '#f3eee3', href: '/nido', featured: true, filters: ['branding'] },
    { slug: 'navaja-barber', title: { es: 'Navaja Barber', en: 'Navaja Barber' }, cat: 'Web Design · Development',
      desc: { es: 'Sitio de una página para una barbería en Uruguay, con reservas online integradas.', en: 'One-page site for a barbershop in Uruguay, with built-in online booking.' },
      tools: 'Antigravity, HTML, CSS, JavaScript', img: 'img/works/navaja-barber.avif', href: 'https://www.navajabarber.com', external: true, featured: false, filters: ['web'] },
    { slug: 'labufarra-web', title: { es: 'La Bufarra · labufarra.com', en: 'La Bufarra · labufarra.com' }, cat: 'Web Design · Development',
      desc: { es: 'Sitio del club con partidos, jugadores, campeonatos e historia, y su panel de administración.', en: 'Club website with matches, players, championships and history, plus its admin panel.' },
      tools: 'HTML, CSS, JavaScript, Supabase', img: 'img/works/labufarra-web.avif', href: 'https://www.labufarra.com', external: true, featured: false, filters: ['web'] }
  ];

  var grid = document.getElementById('worksGrid');
  var countEl = document.getElementById('worksCount');
  var filterButtons = document.querySelectorAll('.filter');
  var currentFilter = 'featured';
  var ICON_INTERNAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ICON_EXTERNAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function bi(o) { return '<span class="lang-es">' + esc(o.es) + '</span><span class="lang-en" lang="en">' + esc(o.en) + '</span>'; }

  function cardHTML(w) {
    var ext = w.external ? ' target="_blank" rel="noopener"' : '';
    return '<a class="card" href="' + esc(w.href) + '"' + ext + ' data-slug="' + w.slug + '"' + (w.preview ? ' data-preview="' + w.preview + '"' : '') + '>' +
      '<div class="card-media"' + (w.bg ? ' style="background:' + w.bg + '"' : '') + '>' +
        '<img data-src="' + w.img + '" width="1200" height="900" alt="' + esc(w.title.es) + '" data-en-alt="' + esc(w.title.en) + '"' + (w.fit === 'contain' ? ' class="fit-contain"' : '') + ' loading="lazy" decoding="async" fetchpriority="low">' +
        (w.preview ? '<video muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>' : '') +
        '<span class="card-go">' + (w.external ? ICON_EXTERNAL : ICON_INTERNAL) + '</span>' +
      '</div>' +
      '<div class="card-meta">' +
        '<h3>' + bi(w.title) + '</h3>' +
        '<p class="card-cat">' + esc(w.cat) + '</p>' +
        '<p class="card-desc">' + bi(w.desc) + '</p>' +
        '<p class="card-tools">' + esc(w.tools) + '</p>' +
        (w.external ? '<span class="sr-only">' + bi({ es: ' (abre el sitio en una pestaña nueva)', en: ' (opens the site in a new tab)' }) + '</span>' : '') +
      '</div></a>';
  }
  grid.innerHTML = WORKS.map(cardHTML).join('');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  function workOf(card) { return WORKS.filter(function (w) { return w.slug === card.dataset.slug; })[0]; }
  function matches(w, f) { return f === 'featured' ? w.featured : w.filters.indexOf(f) !== -1; }

  /* Tamaños: el patrón 7/5, 4/4/4, 5/7, 6/6 se repite; la última fila nunca deja una
     tarjeta chica sola (sobra 1: ancho completo; 2: 6/6; 3: 4/4/4). */
  var PATTERN = [[7, 5], [4, 4, 4], [5, 7], [6, 6]];
  var TAIL = { 1: [12], 2: [6, 6], 3: [4, 4, 4] };
  function layout(visible) {
    var spans = [], i = 0, row = 0;
    while (i < visible.length) {
      var left = visible.length - i;
      var r = left <= 3 ? TAIL[left] : PATTERN[row % PATTERN.length];
      if (left > 3 && left - r.length === 0) r = PATTERN[row % PATTERN.length];
      r.forEach(function (sp) { spans.push(sp); });
      i += r.length; row++;
    }
    visible.forEach(function (card, k) {
      card.classList.remove('s12', 's7', 's5', 's4', 's6', 'h-tall', 'h-mid', 'h-wide', 'h-full', 'two-col-full');
      var sp = spans[k];
      card.classList.add('s' + sp, sp === 12 ? 'h-full' : (sp === 7 || sp === 5) ? 'h-tall' : sp === 4 ? 'h-mid' : 'h-wide');
    });
    // en dos columnas (tablet), una tarjeta impar al final ocupa todo el ancho
    if (visible.length % 2 === 1) visible[visible.length - 1].classList.add('two-col-full');
  }
  function updateCount() {
    var n = cards.filter(function (c) { return !c.hidden; }).length;
    var en = root.classList.contains('lang-en-active');
    countEl.textContent = en ? n + (n === 1 ? ' project' : ' projects') : n + (n === 1 ? ' trabajo' : ' trabajos');
  }
  function applyFilter(f) {
    currentFilter = f;
    var visible = [];
    cards.forEach(function (card) {
      var on = matches(workOf(card), f);
      card.hidden = !on;
      if (on) visible.push(card);
    });
    layout(visible);
    filterButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === f)); });
    updateCount();
  }
  applyFilter('featured');

  filterButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.filter;
      if (f === currentFilter) return;
      var canFlip = !reduce && window.Flip && hasGsap;
      if (!canFlip) { applyFilter(f); loadVisibleImages(); return; }
      var state = Flip.getState(cards, { props: 'opacity' });
      // con absolute:true las tarjetas salen del flujo y la grilla quedaría en 0: se fija su alto y se anima al nuevo,
      // recortando las que salen para que no pasen por encima de Servicios
      var h0 = grid.offsetHeight;
      applyFilter(f);
      var h1 = grid.offsetHeight;
      loadVisibleImages();
      cards.forEach(function (c) { c.classList.remove('is-await'); });
      gsap.fromTo(grid, { height: h0, overflow: 'clip' }, { height: h1, duration: 0.6, ease: 'power2.inOut', overwrite: true, clearProps: 'height,overflow' });
      Flip.from(state, {
        duration: 0.6, ease: 'power2.inOut', absolute: true, scale: false, nested: true,
        onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, delay: 0.15 }); },
        onLeave: function (els) { return gsap.to(els, { opacity: 0, duration: 0.3 }); },
        onComplete: function () { ScrollTrigger.refresh(); }
      });
    });
  });

  /* imágenes: cargan recién al acercarse (el lazy nativo de Chrome en móvil las pide
     demasiado pronto y compiten con la fuente del logo en la primera carga) */
  function showImg(img) { if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); } }
  var imgIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { showImg(e.target); imgIO.unobserve(e.target); } });
  }, { rootMargin: '300px 0px' }) : null;
  function loadVisibleImages() {
    cards.forEach(function (c) {
      var img = c.querySelector('img[data-src]');
      if (!img || c.hidden) return;
      if (imgIO) imgIO.observe(img); else showImg(img);
    });
  }
  loadVisibleImages();

  // video de preview al pasar el mouse (carga recién en el primer hover)
  cards.forEach(function (card) {
    var v = card.querySelector('video');
    if (!v || !finePointer || reduce) return;
    function play() {
      if (!v.src) v.src = card.dataset.preview;
      card.classList.add('is-playing');
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    function stop() { card.classList.remove('is-playing'); v.pause(); }
    card.addEventListener('mouseenter', play);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('focus', play);
    card.addEventListener('blur', stop);
  });

  /* ── Aparición al scrollear ──────────────────────────────
     Solo lo que arranca debajo de la pantalla: lo visible al
     cargar se ve de entrada. */
  if (!reduce && 'IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.remove('is-await');
        revealIO.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    var gridIndex = 0;
    document.querySelectorAll('[data-reveal], .card:not([hidden])').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('is-await');
      // el estado inicial se aplica antes de habilitar la transición
      requestAnimationFrame(function () { el.classList.add('is-revealing'); });
      if (el.classList.contains('card')) { el.style.transitionDelay = (gridIndex++ % 3) * 90 + 'ms'; }
      revealIO.observe(el);
    });
  }

  /* ── Copiar el mail ──────────────────────────────────── */
  if (mailCopy) {
    var mailText = document.getElementById('mailText');
    var status = document.getElementById('copyStatus');
    mailCopy.addEventListener('click', function () {
      var en = root.classList.contains('lang-en-active');
      function done(ok) {
        mailCopy.textContent = ok ? (en ? mailCopy.dataset.doneEn : mailCopy.dataset.doneEs) : (en ? 'Selected' : 'Seleccionado');
        status.textContent = ok ? (en ? 'Email copied' : 'Mail copiado') : (en ? 'Email selected, copy it with Cmd+C' : 'Mail seleccionado, copialo con Cmd+C');
        setTimeout(function () { mailCopy.textContent = en ? mailCopy.dataset.en : mailCopy.dataset.es; }, 1800);
      }
      function select() {
        var r = document.createRange(); r.selectNodeContents(mailText);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); done(false);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mailText.textContent).then(function () { done(true); }, select);
      else select();
    });
  }

  /* ── Movimiento (scroll suave, pin del reel, salida de la apertura, fondo) ──
     Las librerías (gsap, ScrollTrigger, Lenis: 140 KB) se cargan después del
     evento load para no competir con la fuente del logo en la primera carga.
     El layout del pin ya está en CSS (clase .motion), así que no hay saltos. */
  function initMotion() {
    hasGsap = !!(window.gsap && window.ScrollTrigger);
    if (!hasGsap) { root.classList.remove('motion'); return; }
    gsap.registerPlugin(ScrollTrigger);
    if (window.Flip) gsap.registerPlugin(Flip);
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.09 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
    // la apertura se despide con un desplazamiento suave al salir de pantalla
    gsap.to('#introInner', {
      y: function () { return -window.innerHeight * 0.12; }, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '#inicio', start: 'center center', end: 'bottom top', scrub: true }
    });
    // el reel se fija y crece desde ~40 % hasta casi toda la pantalla; después se suelta
    gsap.set(reelBox, { xPercent: -50, yPercent: -50, scale: 0.42 });
    gsap.timeline({
      scrollTrigger: { trigger: '#reelStage', start: 'top top', end: '+=120%', scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
    })
      .fromTo(reelBox, { scale: 0.42, borderRadius: 16 }, { scale: 1, borderRadius: 6, ease: 'power2.inOut', duration: 1 })
      .to(reelBox, { scale: 1, duration: 0.25 });

    // fondo: el mesh sigue levemente al mouse y la grilla avanza al 15 % del scroll
    var bgRoot = document.querySelector('.bg');
    if (finePointer) {
      var mx = gsap.quickTo(bgRoot, '--mx', { duration: 1.6, ease: 'power3.out' });
      var my = gsap.quickTo(bgRoot, '--my', { duration: 1.6, ease: 'power3.out' });
      window.addEventListener('pointermove', function (e) {
        mx((e.clientX / window.innerWidth - 0.5) * 2);
        my((e.clientY / window.innerHeight - 0.5) * 2);
      }, { passive: true });
    }
    var lastY = -1;
    gsap.ticker.add(function () {
      var y = window.scrollY;
      if (y !== lastY) { bgRoot.style.setProperty('--grid-y', (-(y * 0.15) % 60).toFixed(2) + 'px'); lastY = y; } // se repite cada 60 px, sin costuras
    });
    ScrollTrigger.refresh();
    // si se llegó con un ancla (ej. /#works desde una página de caso), el pin recién montado
    // corrió el contenido hacia abajo: volver a ubicar el destino
    var hashTarget = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    if (hashTarget) {
      var y = hashTarget.getBoundingClientRect().top + window.scrollY - (nav.offsetHeight - 1);
      if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    }
  }
  function loadScript(src) {
    return new Promise(function (ok, fail) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  }
  if (!reduce) {
    var startMotion = function () {
      loadScript('js/vendor/gsap.min.js')
        .then(function () { return Promise.all([loadScript('js/vendor/ScrollTrigger.min.js'), loadScript('js/vendor/lenis.min.js'), loadScript('js/vendor/Flip.min.js')]); })
        .then(initMotion, function () { root.classList.remove('motion'); });
    };
    if (document.readyState === 'complete') startMotion(); else window.addEventListener('load', startMotion, { once: true });
  }

  /* idioma inicial (el script del <head> ya aplicó la clase sin parpadeo) */
  setLang(root.classList.contains('lang-en-active') ? 'en' : 'es');
})();
