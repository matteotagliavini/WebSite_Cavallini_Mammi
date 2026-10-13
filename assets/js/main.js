/* ==========================================================================
   Cavallini & Partners — JavaScript (vanilla, nessuna dipendenza)
   In WordPress: wp_enqueue_script('cp-main', get_template_directory_uri().'/assets/js/main.js', [], null, true)
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Anno nel footer ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Header: trasparente sull'hero, bianco dopo lo scroll ---------- */
  var header = document.getElementById('site-header');
  var hero = document.querySelector('.hero');
  function onHeader() {
    if (!header) return;
    var limit = hero ? hero.offsetHeight - 90 : 10;
    header.classList.toggle('is-scrolled', window.scrollY > limit);
  }

  /* ---------- Menu mobile ---------- */
  var toggle = document.getElementById('menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
      if (open) header.classList.add('is-scrolled'); else onHeader();
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        onHeader();
      });
    });
  }

  /* ---------- Logo vivo: dall'hero alla filigrana ----------
     Ispirazione "shared element": il logo grande dell'hero, scorrendo,
     si sposta e si ingrandisce verso destra trasformandosi in filigrana
     a bassa opacità (solo linee). Poi resta sullo sfondo con:
       - parallax verticale e lieve rotazione legati all'avanzamento pagina;
       - una "penna" che ripercorre i tratti del logo man mano che si scorre.
     Solo transform/opacity e variabili CSS → nessun reflow. */
  var root = document.documentElement;
  var mark = document.getElementById('brand-mark');
  var slot = document.getElementById('hero-mark-slot');
  var raysEl = document.querySelector('.hero-rays');
  var M = { W: 0, H: 0, tx: 0, ty: 0, sx: 0, sy: 0, sw: 0 };

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  if (mark && slot) {
    if (reduceMotion) mark.classList.add('is-static');   // filigrana fissa, nessun movimento
    else root.classList.add('js-mark');
  }

  function layoutMark() {
    if (!mark) return;
    var vw = window.innerWidth, vh = window.innerHeight, mobile = vw < 768;
    M.W = mobile ? vw * 1.15 : Math.min(vw * 0.6, 760);
    M.H = M.W * 0.94;
    M.tx = mobile ? vw - M.W * 0.7 : vw - M.W * 0.86;   // esce leggermente dal bordo destro
    M.ty = (vh - M.H) / 2 + (mobile ? vh * 0.06 : 0);
    mark.style.width = M.W + 'px';
    // Punto di partenza: posizione del logo nell'hero a pagina in cima (resta "agganciato" allo schermo)
    var r = slot.getBoundingClientRect();
    M.sx = r.left; M.sy = r.top + window.scrollY; M.sw = r.width;
  }

  function onMark() {
    if (!mark || !slot) return;
    var y = window.scrollY, vh = window.innerHeight;
    var heroH = hero ? hero.offsetHeight : vh;
    var transEnd = heroH * 0.85;                                        // fine del passaggio hero → filigrana
    var docEnd = Math.max(1, document.documentElement.scrollHeight - vh - transEnd);
    var after = clamp((y - transEnd) / docEnd);                          // avanzamento nel resto della pagina

    if (reduceMotion) {
      mark.style.transform = 'translate(' + M.tx + 'px,' + M.ty + 'px)';
      mark.style.setProperty('--t', y > heroH * 0.6 ? 1 : 0);
      return;
    }

    var raw = clamp(y / transEnd);
    var t = easeInOut(raw), tx = easeOut(clamp(raw / 0.7));                          // in orizzontale si sposta prima: libera il titolo
    var s = lerp(M.sw / M.W, 1, t);
    var par = (after - 0.5) * -0.22 * vh * t;                            // parallax ±11% viewport
    var rot = (after - 0.5) * 7 * t;                                     // rotazione ±3.5°
    var x = lerp(M.sx, M.tx, tx);
    var yy = lerp(M.sy, M.ty + par, t);

    mark.style.transform = 'translate(' + x.toFixed(1) + 'px,' + yy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ') ' +
      'translate(' + (M.W / 2) + 'px,' + (M.H / 2) + 'px) rotate(' + rot.toFixed(2) + 'deg) translate(' + (-M.W / 2) + 'px,' + (-M.H / 2) + 'px)';
    // Il logo passa DIETRO ai testi dell'hero (z-index) e si attenua subito per non disturbarne la lettura.
    // Dissolvenza incrociata: il logo bianco resta visibile sul blu dell'hero, le linee blu
    // compaiono sul bianco delle sezioni (ognuno "sparisce" da solo sul fondo del suo colore).
    mark.style.setProperty('--t', clamp(raw * 1.5).toFixed(3));
    mark.style.setProperty('--ga', ((1 - 0.65 * clamp(raw / 0.3)) * (1 - clamp((raw - 0.5) / 0.5))).toFixed(3));
    mark.style.setProperty('--trace', (-y / vh * 0.32).toFixed(4));    // la "penna" avanza con lo scroll

    if (raysEl && y < heroH) raysEl.style.setProperty('--rays-y', (y * 0.25).toFixed(1) + 'px');
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onHeader(); onMark(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layoutMark(); onScroll(); });
  layoutMark(); onHeader(); onMark();
  window.addEventListener('load', function () { layoutMark(); onMark(); });  // dopo il caricamento dei font

  /* ---------- Comparsa elementi allo scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Mappa Google: caricata solo dopo il consenso ---------- */
  var loadMap = document.getElementById('load-map');
  if (loadMap) {
    loadMap.addEventListener('click', function () {
      var box = document.getElementById('map');
      box.innerHTML = '<iframe title="Mappa: Cavallini & Partners, Via Mazzini 182/F2, Sassuolo" ' +
        'src="https://www.google.com/maps?q=Via+Mazzini+182%2FF2,+41049+Sassuolo+MO&output=embed" ' +
        'class="absolute inset-0 w-full h-full border-0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
    });
  }

  /* ---------- Form contatti: validazione + invio AJAX ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var telRe = /^[+0-9 ()./-]{6,20}$/;

    function setError(input, bad) {
      input.closest('.field').classList.toggle('has-error', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    function validate() {
      var ok = true;
      ok = setError(form.nome, form.nome.value.trim().length < 2) && ok;
      ok = setError(form.email, !emailRe.test(form.email.value.trim())) && ok;
      ok = setError(form.telefono, form.telefono.value.trim() !== '' && !telRe.test(form.telefono.value.trim())) && ok;
      ok = setError(form.messaggio, form.messaggio.value.trim().length < 5) && ok;
      ok = setError(form.privacy, !form.privacy.checked) && ok;
      return ok;
    }
    function showStatus(msg, good) {
      status.textContent = msg;
      status.className = 'form-status is-visible sm:col-span-2 rounded-md p-4 text-sm ' +
        (good ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200');
    }

    form.querySelectorAll('input, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        if (el.closest('.field') && el.closest('.field').classList.contains('has-error')) validate();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var first = form.querySelector('.has-error input, .has-error textarea');
        if (first) first.focus();
        return;
      }
      // Modalità demo finché non è configurato l'endpoint reale
      if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
        showStatus('Modulo in modalità demo: configura l\'endpoint (Formspree o WordPress) per ricevere i messaggi.', true);
        form.reset();
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Invio in corso…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          showStatus('Grazie! Abbiamo ricevuto la tua richiesta e ti ricontatteremo al più presto.', true);
          form.reset();
        })
        .catch(function () {
          showStatus('Si è verificato un errore. Riprova o chiamaci allo 0536 980303.', false);
        })
        .finally(function () { btn.disabled = false; btn.textContent = 'Invia richiesta'; });
    });
  }
})();
