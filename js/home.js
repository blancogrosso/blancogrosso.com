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
  var cursorTag = document.getElementById('cursorTag');
  var cursorText = cursorTag && cursorTag.firstElementChild;
  var cursorExternal = false;
  function cursorLabel() {
    var en = root.classList.contains('lang-en-active');
    return cursorExternal ? (en ? 'Visit site' : 'Ver sitio') : (en ? 'View case' : 'Ver caso');
  }
  function setLang(lang) {
    var en = lang === 'en';
    root.classList.toggle('lang-en-active', en);
    root.lang = en ? 'en' : 'es';
    langButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    document.querySelectorAll('[data-en-aria-label]').forEach(function (el) {
      if (!el.dataset.esAriaLabel) el.dataset.esAriaLabel = el.getAttribute('aria-label');
      el.setAttribute('aria-label', en ? el.dataset.enAriaLabel : el.dataset.esAriaLabel);
    });
    if (mailCopy && !mailCopy.classList.contains('is-done')) mailCopy.querySelector('.mail-copy-label').textContent = en ? mailCopy.dataset.en : mailCopy.dataset.es;
    if (cursorText) cursorText.textContent = cursorLabel();
    document.querySelectorAll('img[data-en-alt]').forEach(function (img) {
      if (!img.dataset.esAlt) img.dataset.esAlt = img.alt;
      img.alt = en ? img.dataset.enAlt : img.dataset.esAlt;
    });
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
     Los datos están en data/works.json (scripts/build-home.py arma el HTML).
     Los destacados vienen escritos en el HTML; acá se suman los del <template>
     (los que no están en Destacados) y se agregan los filtros. */
  var grid = document.getElementById('worksGrid');
  var more = document.getElementById('worksMore');
  if (more && more.content) grid.appendChild(more.content.cloneNode(true));
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var countNum = document.getElementById('worksCountNum');
  var countWord = document.getElementById('worksCountWord');
  var countEl = document.getElementById('worksStatus');
  var filterButtons = document.querySelectorAll('.filter');
  var currentFilter = 'featured';
  var shownCount = cards.filter(function (c) { return c.hasAttribute('data-featured'); }).length;
  function matches(card, f) {
    return f === 'featured' ? card.hasAttribute('data-featured') : (' ' + card.dataset.filters + ' ').indexOf(' ' + f + ' ') !== -1;
  }

  /* Tamaños: el patrón 7/5, 4/4/4, 5/7, 6/6 se repite; la última fila nunca deja una
     tarjeta chica sola (sobra 1: ancho completo; 2: 6/6; 3: 4/4/4).
     Misma regla que layout_classes() en scripts/build-home.py. */
  var PATTERN = [[7, 5], [4, 4, 4], [5, 7], [6, 6]];
  var TAIL = { 1: [12], 2: [6, 6], 3: [4, 4, 4] };
  function layout(visible) {
    var spans = [], i = 0, row = 0;
    while (i < visible.length) {
      var left = visible.length - i;
      var r = left <= 3 ? TAIL[left] : PATTERN[row % PATTERN.length];
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
  function countLabel(n, en) { return en ? n + (n === 1 ? ' project' : ' projects') : n + (n === 1 ? ' trabajo' : ' trabajos'); }
  function paintCount(n) {
    var en = root.classList.contains('lang-en-active');
    countNum.textContent = n;
    countWord.querySelector('.lang-es').textContent = n === 1 ? 'trabajo' : 'trabajos';
    countWord.querySelector('.lang-en').textContent = n === 1 ? 'project' : 'projects';
    return en;
  }
  function updateCount(animate) {
    var n = cards.filter(function (c) { return !c.hidden; }).length;
    var en = root.classList.contains('lang-en-active');
    countEl.textContent = countLabel(n, en); // lo anuncia el lector de pantalla (aria-live)
    if (!animate || reduce || !hasGsap) { paintCount(n); shownCount = n; return; }
    // el número visible cuenta hasta el nuevo valor
    var o = { v: shownCount };
    gsap.to(o, { v: n, duration: 0.5, ease: 'power2.out', overwrite: true, onUpdate: function () { paintCount(Math.round(o.v)); } });
    shownCount = n;
  }
  function applyFilter(f) {
    currentFilter = f;
    var visible = [];
    cards.forEach(function (card) {
      var on = matches(card, f);
      card.hidden = !on;
      if (on) visible.push(card);
    });
    layout(visible);
    filterButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === f)); });
  }
  applyFilter('featured');
  paintCount(shownCount);

  filterButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.filter;
      if (f === currentFilter) return;
      var canFlip = !reduce && window.Flip && hasGsap;
      if (!canFlip) { applyFilter(f); loadVisibleImages(); updateCount(false); return; }
      var state = Flip.getState(cards);
      // con absolute:true las tarjetas salen del flujo y la grilla quedaría en 0: se fija su alto y se anima al nuevo,
      // recortando las que salen para que no pasen por encima de Servicios
      var h0 = grid.offsetHeight;
      applyFilter(f);
      var h1 = grid.offsetHeight;
      loadVisibleImages();
      cards.forEach(function (c) { c.classList.remove('is-await', 'is-revealing'); c.style.transitionDelay = ''; });
      // (el alto se suelta recién cuando termina Flip: la cascada de entrada dura más que el reacomodo)
      gsap.fromTo(grid, { height: h0, overflow: 'clip' }, { height: h1, duration: 0.7, ease: 'power3.inOut', overwrite: true });
      // las que se quedan se reacomodan; las que salen se achican y se apagan (aceleran al irse);
      // las que entran aparecen en cascada y frenan sin rebote
      Flip.from(state, {
        duration: 0.7, ease: 'power3.inOut', absolute: true, scale: false, nested: true, prune: true,
        onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.2, stagger: 0.06, ease: 'power3.out' }); },
        onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.3, ease: 'power2.in' }); },
        onComplete: function () { gsap.set(grid, { clearProps: 'height,overflow' }); ScrollTrigger.refresh(); }
      });
      updateCount(true);
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

  /* ── Etiqueta que sigue al mouse sobre las tarjetas ──────
     "Ver caso" en las internas, "Ver sitio" en las externas. Solo con mouse.
     Con gsap la sigue con un leve retraso; sin gsap (o con movimiento reducido), directo. */
  var moveTag = null;
  if (cursorTag && finePointer) {
    root.classList.add('has-cursor-tag');
    var tx = 0, ty = 0;
    moveTag = function (x, y) { tx = x; ty = y; cursorTag.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; };
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') moveTag(e.clientX, e.clientY); }, { passive: true });
    cards.forEach(function (c) {
      c.addEventListener('mouseenter', function (e) {
        cursorExternal = c.hasAttribute('data-external');
        cursorText.textContent = cursorLabel();
        if (!cursorTag.classList.contains('is-on')) moveTag(e.clientX, e.clientY, true); // aparece donde está el mouse
        cursorTag.classList.add('is-on');
      });
      c.addEventListener('mouseleave', function () { cursorTag.classList.remove('is-on'); });
    });
  }

  /* ── Portadas de los filtros ─────────────────────────────
     Con la página cargada y el navegador libre, se piden las portadas de las
     tarjetas que no están en Destacados: así no aparecen vacías al abrir un filtro. */
  function preloadOtherCovers() {
    cards.forEach(function (c) {
      if (c.hasAttribute('data-featured')) return;
      var img = c.querySelector('img[data-src]');
      if (img) { var pre = new Image(); pre.decoding = 'async'; pre.src = img.dataset.src; }
    });
  }
  var idle = window.requestIdleCallback ? function (f) { window.requestIdleCallback(f, { timeout: 4000 }); } : function (f) { setTimeout(f, 1500); };
  if (document.readyState === 'complete') idle(preloadOtherCovers);
  else window.addEventListener('load', function () { idle(preloadOtherCovers); }, { once: true });

  /* ── Transición de la tarjeta al caso ────────────────────
     View Transitions entre páginas (css/view-transitions.css). Al salir hacia un caso,
     la imagen de su tarjeta toma el nombre case-<slug>, el mismo que la imagen principal
     del caso. La vuelta la resuelve el script del <head> (evento pagereveal). */
  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition || !e.activation || !e.activation.entry) return;
    var url = new URL(e.activation.entry.url);
    if (url.origin !== location.origin) return;
    var slug = url.pathname.replace(/^\/|\.html$/g, '');
    var card = slug && grid.querySelector('.card[data-slug="' + slug + '"]:not([hidden])');
    if (!card) return;
    var img = card.querySelector('.card-media img');
    img.style.viewTransitionName = 'case-' + slug;
    e.viewTransition.finished.finally(function () { img.style.viewTransitionName = ''; });
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
    var copyLabel = mailCopy.querySelector('.mail-copy-label');
    var copyTimer = null;
    mailCopy.addEventListener('click', function () {
      var en = root.classList.contains('lang-en-active');
      function done(ok) {
        copyLabel.textContent = ok ? (en ? mailCopy.dataset.doneEn : mailCopy.dataset.doneEs) : (en ? 'Selected' : 'Seleccionado');
        mailCopy.classList.toggle('is-done', ok);
        status.textContent = ok ? (en ? 'Email copied' : 'Mail copiado') : (en ? 'Email selected, copy it with Cmd+C' : 'Mail seleccionado, copialo con Cmd+C');
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () {
          mailCopy.classList.remove('is-done');
          copyLabel.textContent = root.classList.contains('lang-en-active') ? mailCopy.dataset.en : mailCopy.dataset.es;
        }, 1800);
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
    // la etiqueta del cursor lo sigue con un leve retraso (frena sin rebote)
    if (moveTag) {
      cursorTag.style.transform = '';
      var qx = gsap.quickTo(cursorTag, 'x', { duration: 0.45, ease: 'power3.out' });
      var qy = gsap.quickTo(cursorTag, 'y', { duration: 0.45, ease: 'power3.out' });
      moveTag = function (x, y, instant) { if (instant) gsap.set(cursorTag, { x: x, y: y }); qx(x, instant ? x : undefined); qy(y, instant ? y : undefined); };
    }
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
      scrollTrigger: { trigger: '#reelStage', start: 'top top', end: '+=120%', scrub: 0.6, pin: true, pinSpacing: false, anticipatePin: 1, invalidateOnRefresh: true }
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
    // la grilla se mueve con transform directo sobre su propia capa (no con una variable en .bg,
    // que obligaba a recalcular estilos de todo el fondo en cada cuadro)
    var bgGrid = document.querySelector('.bg-grid');
    var lastY = -1;
    gsap.ticker.add(function () {
      var y = window.scrollY;
      if (y !== lastY) { bgGrid.style.transform = 'translate3d(0,' + (-(y * 0.15) % 60).toFixed(2) + 'px,0)'; lastY = y; } // se repite cada 60 px, sin costuras
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

  /* ── Caso como panel sobre la home (etapa 8, Parte 3) ────
     Click en una tarjeta de caso: se pide la página del caso, se toma su <article> y se muestra
     en un panel que sube por encima de la home. La URL pasa a ser la del caso (abrirla directo
     muestra la página completa). Se cierra con Cerrar, Escape, "atrás" o tocando el fondo, y la
     home queda donde estaba. css/case.css y js/case.js se cargan recién la primera vez. */
  var panel = document.getElementById('casePanel');
  if (panel && window.fetch && window.DOMParser && history.pushState) {
    var scrim = document.getElementById('cpScrim');
    var cpBody = document.getElementById('cpBody');
    var cpCount = document.getElementById('cpCount');
    var cp = { open: false, busy: false, destroy: null, opener: null, y: 0, closeTimer: null };
    var caseCache = {};
    var caseAssets = null;
    var caseSlugs = cards.filter(function (c) { return c.hasAttribute('data-case'); }).map(function (c) { return c.dataset.slug; });

    function slugOf(href) { return new URL(href, location.href).pathname.replace(/^\/|\.html$/g, ''); }
    function isCase(href) { return caseSlugs.indexOf(slugOf(href)) !== -1; }
    function loadCSS(href) {
      return new Promise(function (ok, fail) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = ok; l.onerror = fail; document.head.appendChild(l); });
    }
    function assets() {
      if (!caseAssets) caseAssets = Promise.all([loadCSS('css/case.css'), loadScript('js/case.js')]);
      return caseAssets;
    }
    // la página del caso: se pide una sola vez (y antes, al pasar el mouse por la tarjeta)
    function fetchCase(href) {
      var key = slugOf(href);
      if (!caseCache[key]) {
        caseCache[key] = fetch('/' + key).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (t) {
          var doc = new DOMParser().parseFromString(t, 'text/html');
          var art = doc.querySelector('article.case');
          if (!art) throw new Error('sin artículo');
          return { article: art, count: doc.querySelector('.bar .count') };
        });
        caseCache[key].catch(function () { delete caseCache[key]; });
      }
      return caseCache[key];
    }
    function render(data) {
      if (cp.destroy) { cp.destroy(); cp.destroy = null; }
      var art = document.importNode(data.article, true);
      // los nombres de la transición entre páginas no hacen falta adentro del panel
      art.querySelectorAll('[style*="view-transition-name"]').forEach(function (el) { el.style.viewTransitionName = ''; });
      cpBody.replaceChildren(art);
      cpCount.innerHTML = data.count ? data.count.innerHTML : '';
      var h1 = art.querySelector('h1');
      panel.setAttribute('aria-label', h1 ? h1.textContent.trim() : 'Caso');
      panel.scrollTop = 0;
      setLang(root.classList.contains('lang-en-active') ? 'en' : 'es'); // textos alternativos y etiquetas en el idioma activo
      cp.destroy = window.BGCase.init(art, panel);
    }
    function lockHome() {
      cp.y = window.scrollY;
      if (lenis) lenis.stop();
      root.classList.add('cp-open');
      if (cursorTag) cursorTag.classList.remove('is-on');
      cards.forEach(function (c) { var v = c.querySelector('video'); if (v) { c.classList.remove('is-playing'); v.pause(); } });
    }
    function unlockHome() {
      root.classList.remove('cp-open');
      // la home vuelve exactamente a donde estaba
      window.scrollTo(0, cp.y);
      if (lenis) { lenis.start(); lenis.scrollTo(cp.y, { immediate: true }); }
    }
    function showPanel() {
      clearTimeout(cp.closeTimer);
      panel.hidden = false; scrim.hidden = false;
      void panel.offsetWidth; // que la transición arranque desde abajo
      panel.classList.add('on'); scrim.classList.add('on');
      document.getElementById('cpClose').focus({ preventScroll: true });
    }
    // abre (o cambia) el caso. push: true agrega la URL al historial; false la reemplaza ("Siguiente")
    function openCase(href, opener, push) {
      if (cp.busy) return;
      cp.busy = true;
      Promise.all([fetchCase(href), assets()]).then(function (r) {
        cp.busy = false;
        var url = '/' + slugOf(href);
        if (!cp.open) {
          cp.open = true; cp.opener = opener || null;
          lockHome(); render(r[0]); showPanel();
          if (push) history.pushState({ casePanel: url }, '', url);
          return;
        }
        // "Siguiente": el panel queda abierto y cambia el contenido con un fundido corto
        cpBody.classList.add('is-swapping');
        setTimeout(function () {
          render(r[0]);
          cpBody.classList.remove('is-swapping');
          history.replaceState({ casePanel: url }, '', url);
          document.getElementById('cpClose').focus({ preventScroll: true });
        }, reduce ? 0 : 250);
      }).catch(function () { cp.busy = false; location.href = href; }); // si falla, la página normal
    }
    function closeCase(fromHistory) {
      if (!cp.open) return;
      cp.open = false;
      panel.classList.remove('on'); scrim.classList.remove('on');
      cp.closeTimer = setTimeout(function () {
        panel.hidden = true; scrim.hidden = true;
        if (cp.destroy) { cp.destroy(); cp.destroy = null; }
        cpBody.replaceChildren();
      }, reduce ? 0 : 550);
      cpBody.querySelectorAll('video').forEach(function (v) { v.pause(); });
      unlockHome();
      if (cp.opener) cp.opener.focus({ preventScroll: true });
      if (!fromHistory && history.state && history.state.casePanel) history.back();
    }

    cards.forEach(function (card) {
      if (!card.hasAttribute('data-case')) return; // externos y NIDO siguen como hoy
      var href = card.getAttribute('href');
      var warm = function () { fetchCase(href).catch(function () {}); assets().catch(function () {}); };
      card.addEventListener('mouseenter', warm);
      card.addEventListener('focus', warm);
      card.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // nueva pestaña: como siempre
        e.preventDefault();
        openCase(href, card, true);
      });
    });
    document.getElementById('cpClose').addEventListener('click', function () { closeCase(false); });
    scrim.addEventListener('click', function () { closeCase(false); });
    // "Siguiente" dentro del panel cambia de caso sin cerrarlo (NIDO, que no es un caso, abre su página)
    cpBody.addEventListener('click', function (e) {
      var a = e.target.closest('a.next');
      if (!a || !isCase(a.getAttribute('href')) || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      openCase(a.getAttribute('href'), cp.opener, false);
    });
    // atrás / adelante del navegador
    window.addEventListener('popstate', function (e) {
      var s = e.state && e.state.casePanel;
      if (cp.open && !s) closeCase(true);
      else if (!cp.open && s) openCase(s, grid.querySelector('.card[data-slug="' + slugOf(s) + '"]'), false);
    });
    // Escape cierra (el visor de fotos, si está abierto, se queda con su Escape) y el foco no sale del panel
    document.addEventListener('keydown', function (e) {
      if (!cp.open) return;
      if (e.key === 'Escape') { e.preventDefault(); closeCase(false); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(panel.querySelectorAll('a[href], button, input, video[controls], [tabindex]:not([tabindex="-1"])'), function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* idioma inicial (el script del <head> ya aplicó la clase sin parpadeo) */
  setLang(root.classList.contains('lang-en-active') ? 'en' : 'es');
})();
