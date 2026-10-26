/* Blanco Grosso: páginas de caso (plantilla única, ver scripts/build-cases.py) */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Idioma ─────────────────────────────────────────────
     Misma clase y misma clave ('bg-lang') que la home: el idioma se mantiene al navegar. */
  var langButtons = document.querySelectorAll('.lang-btn');
  // etiquetas y textos alternativos en el idioma activo (también para lo que se agrega después, como el visor)
  function localize(scope) {
    var en = root.classList.contains('lang-en-active');
    scope.querySelectorAll('[data-en-aria-label]').forEach(function (el) {
      if (!el.dataset.esAriaLabel) el.dataset.esAriaLabel = el.getAttribute('aria-label');
      el.setAttribute('aria-label', en ? el.dataset.enAriaLabel : el.dataset.esAriaLabel);
    });
    scope.querySelectorAll('img[data-en-alt]').forEach(function (img) {
      if (!img.dataset.esAlt) img.dataset.esAlt = img.alt;
      img.alt = en ? img.dataset.enAlt : img.dataset.esAlt;
    });
  }
  function setLang(lang) {
    var en = lang === 'en';
    root.classList.toggle('lang-en-active', en);
    root.lang = en ? 'en' : 'es';
    langButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    localize(document);
    try { localStorage.setItem('bg-lang', lang); } catch (e) {}
  }
  langButtons.forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
  setLang(root.classList.contains('lang-en-active') ? 'en' : 'es');

  /* ── Caso ───────────────────────────────────────────────
     init(article, scrollRoot): scrollRoot es null en la página propia; el panel sobre la
     home (etapa 8) le va a pasar su propio contenedor con scroll. */
  function init(article, scrollRoot) {
    var observers = [];
    var els = Array.prototype.slice.call(article.querySelectorAll('.rv, .rv-img'));
    var hasIO = 'IntersectionObserver' in window;

    // apariciones al scrollear
    if (reduce || !hasIO) {
      els.forEach(function (e) { e.classList.add('in'); });
    } else {
      // al aparecer un bloque se destapan también los anteriores: si un salto de scroll
      // pasó por encima de alguno sin que llegara a verse, no queda escondido
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var above = e.rootBounds && e.boundingClientRect.bottom < e.rootBounds.top;
          if (!e.isIntersecting && !above) return;
          for (var k = els.indexOf(e.target); k >= 0 && !els[k].classList.contains('in'); k--) {
            els[k].classList.add('in'); io.unobserve(els[k]);
          }
        });
      }, { root: scrollRoot, rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      els.forEach(function (e) { io.observe(e); });
      observers.push(io);
    }

    // los videos se reproducen solo mientras se ven; con movimiento reducido quedan quietos con controles
    var videos = article.querySelectorAll('video[data-autoplay]');
    if (reduce || !hasIO) {
      videos.forEach(function (v) { v.controls = true; });
    } else {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var p = e.target.play(); if (p) p.catch(function () {}); }
          else e.target.pause();
        });
      }, { root: scrollRoot, threshold: 0.3 });
      videos.forEach(function (v) { vio.observe(v); });
      observers.push(vio);
    }

    article.querySelectorAll('.ba-box').forEach(function (box) { slider(box, scrollRoot, observers); });
    var cleanups = [];
    article.querySelectorAll('.gal-block').forEach(function (block) { cleanups.push(gallery(block)); });
    if (!scrollRoot) horizontal(article); // en el panel sobre la home (etapa 8) la tira queda deslizable

    // imagen ancha y prendas: se abren en el visor (las prendas de un mismo bloque, juntas)
    article.querySelectorAll('.media.zoomable').forEach(function (m) { zoomable([m], 0); });
    article.querySelectorAll('.garments').forEach(function (sec) {
      var list = Array.prototype.slice.call(sec.querySelectorAll('.garment'));
      list.forEach(function (g, i) { zoomable(list, i); });
    });
    // acercamiento lento de las prendas, solo mientras se ven
    var garments = article.querySelectorAll('.garment');
    if (garments.length && hasIO && !reduce) {
      var gio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target.classList.toggle('visible', e.isIntersecting); });
      }, { root: scrollRoot, threshold: 0.1 });
      garments.forEach(function (g) { gio.observe(g); });
      observers.push(gio);
    }

    return function destroy() {
      observers.forEach(function (o) { o.disconnect(); });
      cleanups.forEach(function (f) { f(); });
      lbClose(false);
      article.querySelectorAll('video').forEach(function (v) { v.pause(); });
    };
  }

  /* comparador antes/después: el control nativo (teclado y dedo) más arrastre con mouse desde cualquier punto */
  function slider(box, scrollRoot, observers) {
    var input = box.querySelector('input');
    var hint = null;
    function set(v) { box.style.setProperty('--p', v + '%'); input.value = v; }
    function stopHint() { if (hint) { clearInterval(hint); hint = null; } }
    input.addEventListener('input', function () { stopHint(); set(input.value); });
    box.addEventListener('pointerdown', function (e) {
      stopHint();
      if (e.pointerType === 'touch') return; // en celular manda el control nativo
      var r = box.getBoundingClientRect();
      function mv(ev) { set(Math.max(0, Math.min(100, (ev.clientX - r.left) / r.width * 100)).toFixed(1)); }
      mv(e); box.setPointerCapture(e.pointerId);
      box.addEventListener('pointermove', mv);
      box.addEventListener('pointerup', function up() { box.removeEventListener('pointermove', mv); box.removeEventListener('pointerup', up); });
    });
    // pista: se mueve solo un poco la primera vez que aparece
    if (reduce || !('IntersectionObserver' in window)) return;
    var hio = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      hio.disconnect();
      var t = 0;
      hint = setInterval(function () {
        t += 0.05; set((50 + Math.sin(t) * 14).toFixed(1));
        if (t > Math.PI * 2) { stopHint(); set(50); }
      }, 30);
    }, { root: scrollRoot, threshold: 0.6 });
    hio.observe(box);
    observers.push(hio);
  }

  /* ── Scroll horizontal integrado al vertical ─────────────
     Solo en escritorio con mouse o trackpad (900 px o más) y en galerías de 4 fotos o más:
     la galería se fija y el scroll de la página mueve la tira; al ver la última foto se suelta.
     gsap, ScrollTrigger y Lenis (js/vendor/, los de la home) se cargan después del evento load. */
  var lenis = null;
  var DESKTOP = '(hover: hover) and (pointer: fine) and (min-width: 900px) and (prefers-reduced-motion: no-preference)';
  function loadScript(src) {
    return new Promise(function (ok, fail) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  }
  function horizontal(article) {
    var blocks = Array.prototype.filter.call(article.querySelectorAll('.gal-block'), function (b) { return b.querySelectorAll('.gal figure').length >= 4; });
    if (!blocks.length || reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var start = function () {
      loadScript('js/vendor/gsap.min.js')
        .then(function () { return Promise.all([loadScript('js/vendor/ScrollTrigger.min.js'), loadScript('js/vendor/lenis.min.js')]); })
        .then(function () { setupHorizontal(blocks); }, function () {});
    };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
  }
  function setupHorizontal(blocks) {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add(DESKTOP, function () {
      var tick = null;
      if (window.Lenis) {
        lenis = new Lenis({ lerp: 0.09 });
        lenis.on('scroll', ScrollTrigger.update);
        tick = function (t) { lenis.raf(t * 1000); };
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }
      var refresh = (function () { var id; return function () { clearTimeout(id); id = setTimeout(function () { ScrollTrigger.refresh(); }, 120); }; })();
      blocks.forEach(function (block) {
        var g = block.querySelector('.gal');
        var max = function () { return g.scrollWidth - g.clientWidth; };
        block.classList.add('hscroll');
        var bar = document.createElement('div'); bar.className = 'gal-progress'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<span></span>';
        g.parentNode.insertBefore(bar, g.nextSibling); block._bar = bar.firstChild;
        // la distancia de scroll es el ancho que le falta mostrar a la tira (1 px de página = 1 px de tira)
        var tw = gsap.fromTo(g, { scrollLeft: 0 }, {
          scrollLeft: max, ease: 'none',
          scrollTrigger: {
            trigger: block, pin: true, anticipatePin: 1, scrub: 0.6, invalidateOnRefresh: true,
            start: function () { return block.offsetHeight > window.innerHeight ? 'top top' : 'center center'; },
            end: function () { return '+=' + max(); }
          }
        });
        var st = tw.scrollTrigger;
        block._hs = function (x) {
          var y = st.start + Math.max(0, Math.min(max(), x));
          if (lenis) lenis.scrollTo(y, { duration: 0.9 }); else window.scrollTo({ top: y, behavior: 'smooth' });
        };
        g.querySelectorAll('img').forEach(function (im) { if (!im.complete) im.addEventListener('load', refresh, { once: true }); });
        if (block._update) block._update();
      });
      // Lenis vuelve a medir la página cada vez que ScrollTrigger rearma los pin (si no, al volver
      // de una ventana angosta se queda con un alto viejo y no termina nunca de llegar al destino)
      var remedir = function () { if (lenis) lenis.resize(); };
      ScrollTrigger.addEventListener('refresh', remedir);
      ScrollTrigger.refresh();
      return function () {
        ScrollTrigger.removeEventListener('refresh', remedir);
        blocks.forEach(function (b) {
          b.classList.remove('hscroll'); b._hs = null;
          if (b._bar) { b._bar.parentNode.remove(); b._bar = null; }
          var g = b.querySelector('.gal'); g.scrollLeft = 0;
          if (b._update) b._update();
        });
        if (lenis) { gsap.ticker.remove(tick); lenis.destroy(); lenis = null; }
      };
    });
  }

  /* abre el visor al tocar o con Enter / espacio */
  function zoomable(list, i) {
    var el = list[i];
    el.addEventListener('click', function () { lbOpen(list, i); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbOpen(list, i); }
    });
  }

  /* galería: flechas y contador (con mouse), arrastre con mouse y fotos que abren el visor */
  function gallery(block) {
    var g = block.querySelector('.gal');
    var figs = Array.prototype.slice.call(g.querySelectorAll('figure'));
    var count = block.querySelector('.gc-n');
    var prev = block.querySelector('.gc-prev'), next = block.querySelector('.gc-next');
    var smooth = reduce ? 'auto' : 'smooth';
    function left(f) { return f.offsetLeft - g.offsetLeft - g.clientLeft; }

    // contador: cuántas fotos ya asomaron hasta la mitad
    function update() {
      if (block._bar) { var max = g.scrollWidth - g.clientWidth; block._bar.style.transform = 'scaleX(' + (max > 0 ? g.scrollLeft / max : 0) + ')'; }
      if (!count) return; // una sola foto: sin flechas ni contador
      var seen = 0, edge = g.scrollLeft + g.clientWidth;
      figs.forEach(function (f) { if (left(f) + f.offsetWidth / 2 <= edge) seen++; });
      count.textContent = Math.max(1, seen);
      prev.disabled = g.scrollLeft < 4;
      next.disabled = g.scrollLeft + g.clientWidth >= g.scrollWidth - 4;
    }
    // cada flecha lleva a la foto anterior o siguiente, alineada con el margen
    function go(dir) {
      var pad = parseFloat(getComputedStyle(g).scrollPaddingLeft) || 0;
      var x = g.scrollLeft + pad, target = null;
      figs.forEach(function (f) {
        var l = left(f);
        if (dir > 0 && target === null && l > x + 4) target = l;
        if (dir < 0 && l < x - 4) target = l;
      });
      if (target === null) return;
      // tira fijada: la flecha mueve la página hasta la posición de esa foto
      if (block._hs) block._hs(target - pad); else g.scrollTo({ left: target - pad, behavior: smooth });
    }
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    g.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    figs.forEach(function (f) { var im = f.querySelector('img'); if (!im.complete) im.addEventListener('load', update, { once: true }); });
    update();

    // arrastrar con el mouse (con el dedo la tira ya se desliza sola)
    var down = false, moved = false, sx = 0, sl = 0;
    g.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || block._hs) return; // con la tira fijada no se arrastra
      down = true; moved = false; sx = e.clientX; sl = g.scrollLeft;
    });
    g.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 5) { moved = true; g.classList.add('dragging'); }
      if (moved) g.scrollLeft = sl - dx;
    });
    function up() {
      if (!down) return;
      down = false;
      if (!moved) return;
      // al soltar vuelve el imán, desde donde quedó
      var at = g.scrollLeft; g.classList.remove('dragging'); g.scrollLeft = at;
    }
    g.addEventListener('pointerup', up);
    g.addEventListener('pointerleave', up);
    // el click que cierra un arrastre no abre el visor
    g.addEventListener('click', function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

    // con la tira fijada, una foto que recibe el foco con Tab lleva la página hasta ella
    g.addEventListener('focusin', function (e) {
      var f = e.target.closest('figure'); if (!block._hs || !f || !f.matches(':focus-visible')) return; // solo con teclado
      var pad = parseFloat(getComputedStyle(g).scrollPaddingLeft) || 0;
      block._hs(left(f) - pad);
    });
    block._update = update;

    figs.forEach(function (f, i) {
      f.addEventListener('click', function () { lbOpen(figs, i); });
      f.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbOpen(figs, i); }
      });
    });
    return function () { window.removeEventListener('resize', update); };
  }

  /* ── Visor a pantalla completa ──────────────────────────
     Uno solo para toda la página, agregado al body (así funciona igual dentro del panel de la home). */
  var lb = null, lbImg, lbN, lbT, lbList = [], lbI = 0;
  function lbBuild() {
    var CLOSE = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12"/></svg>';
    var PREV = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4l-6 6 6 6"/></svg>';
    var NEXT = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 4l6 6-6 6"/></svg>';
    lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Foto ampliada'); lb.dataset.enAriaLabel = 'Enlarged photo';
    lb.innerHTML =
      '<div class="lb-top"><span><span class="lb-n"></span> <span class="lang-es">de</span><span class="lang-en" lang="en">of</span> <span class="lb-t"></span></span>' +
      '<button type="button" class="lb-close" aria-label="Cerrar" data-en-aria-label="Close">' + CLOSE + '</button></div>' +
      '<div class="lb-stage"><img alt="" draggable="false"></div>' +
      '<div class="lb-nav"><button type="button" class="lb-prev" aria-label="Foto anterior" data-en-aria-label="Previous photo">' + PREV + '</button>' +
      '<button type="button" class="lb-next" aria-label="Foto siguiente" data-en-aria-label="Next photo">' + NEXT + '</button></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('img'); lbN = lb.querySelector('.lb-n'); lbT = lb.querySelector('.lb-t');
    lb.querySelector('.lb-close').addEventListener('click', function () { lbClose(true); });
    lb.querySelector('.lb-prev').addEventListener('click', function () { lbShow(lbI - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { lbShow(lbI + 1); });
    lb.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });

    // deslizar: de costado cambia de foto, hacia abajo cierra; un toque fuera de la foto también cierra
    var sx = 0, sy = 0, track = false;
    lb.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      track = true; sx = e.clientX; sy = e.clientY; lb.classList.add('swiping');
    });
    lb.addEventListener('pointermove', function (e) {
      if (!track || reduce) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dy) > Math.abs(dx) && dy > 0) {
        lbImg.style.transform = 'translateY(' + dy + 'px) scale(' + Math.max(0.85, 1 - dy / 1200) + ')';
        lb.style.opacity = Math.max(0.4, 1 - dy / 500);
      } else lbImg.style.transform = 'translateX(' + dx + 'px)';
    });
    function end(e, cancel) {
      if (!track) return;
      track = false; lb.classList.remove('swiping');
      lbImg.style.transform = ''; lb.style.opacity = '';
      if (cancel) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (dy > 110 && Math.abs(dy) > Math.abs(dx)) lbClose(true);
      else if (dx < -60) lbShow(lbI + 1);
      else if (dx > 60) lbShow(lbI - 1);
      else if (Math.abs(dx) < 6 && Math.abs(dy) < 6 && e.target !== lbImg && e.target.closest('.lb-stage')) lbClose(true);
    }
    lb.addEventListener('pointerup', function (e) { end(e, false); });
    lb.addEventListener('pointercancel', function (e) { end(e, true); });

    // teclado: flechas, Escape cierra solo el visor y el foco no sale de él
    window.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      e.stopImmediatePropagation();
      if (e.key === 'Escape') { e.preventDefault(); lbClose(true); }
      else if (e.key === 'ArrowRight') lbShow(lbI + 1);
      else if (e.key === 'ArrowLeft') lbShow(lbI - 1);
      else if (e.key === 'Tab') {
        e.preventDefault();
        var f = Array.prototype.filter.call(lb.querySelectorAll('button'), function (b) { return b.offsetParent !== null; });
        var k = f.indexOf(document.activeElement);
        f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    }, true);
  }
  // el visor muestra el original (data-full); la tira solo descargó la versión liviana
  // lo que abre el visor puede traer la imagen grande en sí mismo (prendas: el diseño técnico) o en su <img>
  function lbSrc(i) {
    var el = lbList[(i + lbList.length) % lbList.length], im = el.querySelector('img');
    return el.dataset.full || (im && (im.dataset.full || im.getAttribute('src')));
  }
  function lbAlt(el) {
    if (el.dataset.fullAlt) return root.classList.contains('lang-en-active') && el.dataset.enFullAlt ? el.dataset.enFullAlt : el.dataset.fullAlt;
    var im = el.querySelector('img'); return im ? im.alt : '';
  }
  function lbShow(i) {
    lbI = (i + lbList.length) % lbList.length;
    lbImg.src = lbSrc(lbI); lbImg.alt = lbAlt(lbList[lbI]);
    lbN.textContent = lbI + 1; lbT.textContent = lbList.length;
    [lbI - 1, lbI + 1].forEach(function (k) { new Image().src = lbSrc(k); }); // la anterior y la siguiente ya cargadas
  }
  function lbOpen(list, i) {
    if (!lb) lbBuild();
    localize(lb);
    lbList = list; lbShow(i);
    lb.classList.add('on');
    if (lenis) lenis.stop();
    lb.querySelector('.lb-close').focus({ preventScroll: true });
  }
  // al cerrar, el foco vuelve a la foto que se estaba viendo (y la tira la muestra)
  function lbClose(restore) {
    if (!lb || !lb.classList.contains('on')) return;
    lb.classList.remove('on');
    if (lenis) lenis.start();
    var f = lbList[lbI];
    if (restore && f) {
      var g = f.parentNode, l = f.offsetLeft - g.offsetLeft;
      // en una tira, que la foto quede a la vista (si la tira va fijada, moviendo la página)
      if (g.classList.contains('gal') && (l < g.scrollLeft || l + f.offsetWidth > g.scrollLeft + g.clientWidth)) {
        var to = l - (parseFloat(getComputedStyle(g).scrollPaddingLeft) || 0), blk = g.closest('.gal-block');
        if (blk && blk._hs) blk._hs(to); else g.scrollLeft = to;
      }
      f.focus({ preventScroll: true });
    }
  }

  window.BGCase = { init: init, setLang: setLang };
  var article = document.querySelector('article.case');
  if (article) init(article, null);
})();
