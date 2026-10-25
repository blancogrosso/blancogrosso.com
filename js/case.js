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
      if (target !== null) g.scrollTo({ left: target - pad, behavior: smooth });
    }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    g.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    figs.forEach(function (f) { var im = f.querySelector('img'); if (!im.complete) im.addEventListener('load', update, { once: true }); });
    update();

    // arrastrar con el mouse (con el dedo la tira ya se desliza sola)
    var down = false, moved = false, sx = 0, sl = 0;
    g.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
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
  function lbSrc(i) { var im = lbList[(i + lbList.length) % lbList.length].querySelector('img'); return im.dataset.full || im.getAttribute('src'); }
  function lbShow(i) {
    lbI = (i + lbList.length) % lbList.length;
    var im = lbList[lbI].querySelector('img');
    lbImg.src = lbSrc(lbI); lbImg.alt = im.alt;
    lbN.textContent = lbI + 1; lbT.textContent = lbList.length;
    [lbI - 1, lbI + 1].forEach(function (k) { new Image().src = lbSrc(k); }); // la anterior y la siguiente ya cargadas
  }
  function lbOpen(list, i) {
    if (!lb) lbBuild();
    localize(lb);
    lbList = list; lbShow(i);
    lb.classList.add('on');
    lb.querySelector('.lb-close').focus({ preventScroll: true });
  }
  // al cerrar, el foco vuelve a la foto que se estaba viendo (y la tira la muestra)
  function lbClose(restore) {
    if (!lb || !lb.classList.contains('on')) return;
    lb.classList.remove('on');
    var f = lbList[lbI];
    if (restore && f) {
      var g = f.parentNode, l = f.offsetLeft - g.offsetLeft;
      if (l < g.scrollLeft || l + f.offsetWidth > g.scrollLeft + g.clientWidth) g.scrollLeft = l - (parseFloat(getComputedStyle(g).scrollPaddingLeft) || 0);
      f.focus({ preventScroll: true });
    }
  }

  window.BGCase = { init: init, setLang: setLang };
  var article = document.querySelector('article.case');
  if (article) init(article, null);
})();
