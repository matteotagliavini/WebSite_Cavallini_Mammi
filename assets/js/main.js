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

  /* ---------- Filigrana del logo: si disegna con lo scroll ----------
     Progresso 0→1 dalla fine dell'hero al fondo pagina.
     I tre tratti (vela, albero, fiocco) si disegnano in sequenza,
     poi compare un riempimento molto leggero. */
  var wm = document.getElementById('watermark');
  var strokes = wm ? wm.querySelectorAll('.mk-stroke') : [];
  var fills = wm ? wm.querySelectorAll('.mk-fill') : [];
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function onWatermark() {
    if (!wm) return;
    var start = hero ? hero.offsetHeight * 0.6 : 0;
    var end = document.documentElement.scrollHeight - window.innerHeight;
    var p = clamp((window.scrollY - start) / Math.max(1, end - start));
    wm.classList.toggle('is-active', window.scrollY > start);
    if (reduceMotion) p = 1;
    strokes.forEach(function (s, i) {
      var local = clamp((p - i * 0.12) / 0.5);          // sfasamento tra i tratti
      s.style.strokeDashoffset = 1 - local;
    });
    var f = clamp((p - 0.55) / 0.35);
    fills.forEach(function (el) { el.style.opacity = (f * 0.06).toFixed(3); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onHeader(); onWatermark(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onHeader(); onWatermark();

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
