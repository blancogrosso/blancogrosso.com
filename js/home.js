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
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('is-await');
      // el estado inicial se aplica antes de habilitar la transición
      requestAnimationFrame(function () { el.classList.add('is-revealing'); });
      if (el.classList.contains('card')) { el.style.transitionDelay = (gridIndex++ % 3) * 90 + 'ms'; }
      revealIO.observe(el);
    });
  }

  /* ── Imágenes de las tarjetas: cargan recién al acercarse ──
     (el loading="lazy" nativo de Chrome en móvil las pide demasiado
     pronto y compiten con la fuente del logo en la primera carga) */
  var lazyImgs = document.querySelectorAll('img[data-src]');
  function showImg(img) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
  if ('IntersectionObserver' in window) {
    var imgIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { showImg(e.target); imgIO.unobserve(e.target); } });
    }, { rootMargin: '300px 0px' });
    lazyImgs.forEach(function (img) { imgIO.observe(img); });
  } else { lazyImgs.forEach(showImg); }

  /* ── Video de preview al pasar el mouse ───────────────── */
  document.querySelectorAll('.card[data-preview]').forEach(function (card) {
    var v = card.querySelector('video');
    if (!v || !finePointer || reduce) return;
    function play() {
      if (!v.src) v.src = card.dataset.preview; // carga recién en el primer hover
      card.classList.add('is-playing');
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    function stop() { card.classList.remove('is-playing'); v.pause(); }
    card.addEventListener('mouseenter', play);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('focus', play);
    card.addEventListener('blur', stop);
  });

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
        .then(function () { return Promise.all([loadScript('js/vendor/ScrollTrigger.min.js'), loadScript('js/vendor/lenis.min.js')]); })
        .then(initMotion, function () { root.classList.remove('motion'); });
    };
    if (document.readyState === 'complete') startMotion(); else window.addEventListener('load', startMotion, { once: true });
  }

  /* idioma inicial (el script del <head> ya aplicó la clase sin parpadeo) */
  setLang(root.classList.contains('lang-en-active') ? 'en' : 'es');
})();
