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

  /* ---------- Header: trasparente sull'hero blu, bianco quando lo sfondo diventa chiaro ---------- */
  var header = document.getElementById('site-header');
  var hero = document.querySelector('.stage-hero') || document.querySelector('.hero');
  var headerLimit = function () { return hero ? hero.offsetHeight - 90 : 10; };   // ridefinito dal palco animato
  function onHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > headerLimit());
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

  /* ==========================================================================
     PALCO "SCROLLYTELLING" DEL LOGO (ispirato al video di riferimento)
     La sezione .stage è alta ~4 schermate; il suo contenitore resta agganciato
     allo schermo (sticky) e l'avanzamento p (0→1) guida una "timeline":

       p 0.00–0.10  il testo dell'hero sale e svanisce
       p 0.06–0.28  il logo ruota in 3D attorno all'asse verticale: a metà è di
                    taglio (sparisce come la bici vista di fronte), lì cambia colore
                    da bianco a blu mentre lo sfondo passa dal blu al chiaro
       p 0.05–0.32  il logo vola dal centro a destra e si ingrandisce, compare il disco
       p 0.27–0.72  a sinistra entra il testo "Lo Studio" (momento di lettura)
       p 0.44–0.68  "gioco": vela, albero e fiocco si separano e si ricompongono
       p 0.74–1.00  il logo si sposta e si alleggerisce fino a diventare la filigrana
       p ≥ 1        il palco si sgancia e la filigrana fissa (#brand-mark) prende il posto

     Solo transform/opacity e variabili CSS (niente reflow). Con "riduci movimento"
     attivo il palco non viene animato: hero e testo restano statici in sequenza.
     ========================================================================== */
  var root = document.documentElement;
  var stage = document.querySelector('.stage');
  var sticky = document.getElementById('stage-sticky');
  var sm = document.getElementById('stage-mark');
  var slot = document.getElementById('hero-mark-slot');
  var brand = document.getElementById('brand-mark');
  var smRot = sm ? sm.querySelector('.stage-mark-rot') : null;
  var pcs = ['pc1', 'pc2', 'pc3'].map(function (id) { return document.getElementById(id); });
  var disk = document.querySelector('.stage-disk');
  var heroContent = document.querySelector('.stage-hero .hero-content');
  var studio = document.querySelector('.stage-studio');
  var cue = document.querySelector('.stage-hero .scroll-cue');
  var anchor = document.getElementById('studio');

  var animated = !!(stage && sticky && sm && slot && studio && !reduceMotion);
  if (animated) { root.classList.add('js-stage'); sticky.appendChild(sm); }

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }               // avanzamento locale di un tratto della timeline
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }

  var S = { top: 0, len: 1 }, K0 = {}, K2 = {}, WM = {}, D = 0;

  function layout() {
    var vw = window.innerWidth, vh = window.innerHeight, mobile = vw < 768;
    // Filigrana finale: grande, a destra, leggermente fuori dal bordo
    WM.W = mobile ? vw * 1.15 : Math.min(vw * 0.6, 760);
    WM.H = WM.W * 0.94;
    WM.tx = mobile ? vw - WM.W * 0.7 : vw - WM.W * 0.86;
    WM.ty = (vh - WM.H) / 2 + (mobile ? vh * 0.06 : 0);
    WM.par0 = 0.11 * vh;                                                    // parallax della filigrana all'inizio
    if (brand) brand.style.width = WM.W + 'px';
    if (!animated) return;

    S.top = stage.getBoundingClientRect().top + window.scrollY;
    S.len = Math.max(1, stage.offsetHeight - vh);
    headerLimit = function () { return S.top + S.len * 0.14; };

    // K0 = posto del logo nell'hero (misurato senza le trasformazioni del testo)
    var prev = heroContent ? heroContent.style.transform : '';
    if (heroContent) heroContent.style.transform = 'none';
    var r = slot.getBoundingClientRect(), k = sticky.getBoundingClientRect();
    if (heroContent) heroContent.style.transform = prev;
    K0 = { cx: r.left - k.left + r.width / 2, cy: r.top - k.top + r.height / 2, w: r.width };
    // K2 = logo "protagonista" accanto al testo Lo Studio
    K2 = mobile ? { cx: vw * 0.5, cy: vh * 0.24, w: Math.min(vw * 0.44, 230) }
                : { cx: vw * 0.72, cy: vh * 0.53, w: Math.min(vw * 0.34, 470) };
    sm.style.width = WM.W + 'px';
    D = K2.w * 1.45;
    if (disk) { disk.style.width = D + 'px'; disk.style.height = D + 'px'; }
    if (anchor) anchor.style.top = Math.round(S.len * 0.40) + 'px';       // "Lo Studio" nel menu porta al momento giusto
  }

  function markTransform(cx, cy, s, rot) {
    var W = WM.W, H = WM.H;
    return 'translate(' + (cx - W * s / 2).toFixed(1) + 'px,' + (cy - H * s / 2).toFixed(1) + 'px) scale(' + s.toFixed(4) + ') ' +
      'translate(' + W / 2 + 'px,' + H / 2 + 'px) rotate(' + rot.toFixed(2) + 'deg) translate(' + (-W / 2) + 'px,' + (-H / 2) + 'px)';
  }

  function onStage() {
    var y = window.scrollY, vh = window.innerHeight;
    var stageEnd = animated ? S.top + S.len : (stage ? stage.offsetTop + stage.offsetHeight - vh : vh);
    var docEnd = Math.max(1, document.documentElement.scrollHeight - vh - stageEnd);
    var after = clamp((y - stageEnd) / docEnd);

    /* ---- Filigrana fissa (dopo il palco) ---- */
    if (brand) {
      var on = animated ? y >= stageEnd : y > (hero ? hero.offsetHeight * 0.8 : vh);
      brand.classList.toggle('is-on', on);
      var k = reduceMotion ? 0.5 : after;
      var cx = WM.tx + WM.W / 2, cy = WM.ty + (k - 0.5) * -0.22 * vh + WM.H / 2;
      brand.style.transform = markTransform(cx, cy, 1, (k - 0.5) * 7);       // parallax ±11% vh, rotazione ±3.5°
      if (!reduceMotion) {
        brand.style.setProperty('--trace', (-(y - stageEnd) / vh * 0.32).toFixed(4));
        brand.style.setProperty('--tro', Math.min(1, after * 25).toFixed(3));
      }
    }
    if (!animated) return;

    var p = clamp((y - S.top) / S.len);
    sm.style.visibility = p >= 1 ? 'hidden' : '';

    /* ---- Posizione e scala del logo: K0 (hero) → K2 (protagonista) → filigrana ---- */
    var m1 = easeInOut(seg(p, 0.05, 0.32)), m3 = easeInOut(seg(p, 0.74, 1));
    var wmCx = WM.tx + WM.W / 2, wmCy = WM.ty + WM.par0 + WM.H / 2;
    var cx = lerp(lerp(K0.cx, K2.cx, m1), wmCx, m3);
    var cy = lerp(lerp(K0.cy, K2.cy, m1), wmCy, m3);
    var w  = lerp(lerp(K0.w,  K2.w,  m1), WM.W, m3);

    /* ---- "Gioco": le tre parti si separano e si ricompongono ---- */
    var g = seg(p, 0.44, 0.68), e = Math.sin(Math.PI * g);                // 0 → 1 → 0
    var sway = 4 * Math.sin(2 * Math.PI * g);
    var rot2d = sway + lerp(0, -3.5, m3);
    sm.style.transform = markTransform(cx, cy, w / WM.W, rot2d);
    if (pcs[0]) pcs[0].style.transform = 'translate(' + (-24 * e).toFixed(2) + 'px,' + (12 * e).toFixed(2) + 'px) rotate(' + (-16 * e).toFixed(2) + 'deg)';
    if (pcs[1]) pcs[1].style.transform = 'translate(' + (2 * e).toFixed(2) + 'px,' + (-24 * e).toFixed(2) + 'px) rotate(' + (5 * e).toFixed(2) + 'deg)';
    if (pcs[2]) pcs[2].style.transform = 'translate(' + (28 * e).toFixed(2) + 'px,' + (-10 * e).toFixed(2) + 'px) rotate(' + (20 * e).toFixed(2) + 'deg)';

    /* ---- Rotazione 3D con cambio colore quando il logo è di taglio ---- */
    var r = seg(p, 0.06, 0.28);
    var ang = r < 0.5 ? 90 * easeIn(r * 2) : -90 * (1 - easeOut((r - 0.5) * 2));
    smRot.style.transform = 'rotateY(' + ang.toFixed(2) + 'deg)';
    sm.classList.toggle('is-dark', r >= 0.5);

    /* ---- Da logo pieno a filigrana (solo linee) ---- */
    sm.style.setProperty('--fo', lerp(1, 0.045, m3).toFixed(3));
    sm.style.setProperty('--lo', lerp(1, 0.2, m3).toFixed(3));
    sm.style.setProperty('--lw', lerp(1.4, 1.1, m3).toFixed(2) + 'px');

    /* ---- Disco chiaro dietro al logo protagonista ---- */
    if (disk) {
      var ds = easeOut(seg(p, 0.2, 0.36)) * (1 - easeInOut(seg(p, 0.72, 0.86))) * (1 + 0.08 * e);
      disk.style.transform = 'translate(' + (K2.cx - D / 2).toFixed(1) + 'px,' + (K2.cy - D / 2).toFixed(1) + 'px) scale(' + ds.toFixed(4) + ')';
    }

    /* ---- Hero: il testo sale e svanisce, poi lo sfondo blu lascia il posto al chiaro ---- */
    var h = seg(p, 0, 0.09);
    if (heroContent) { heroContent.style.opacity = (1 - h).toFixed(3); heroContent.style.transform = 'translateY(' + (-70 * easeOut(h)).toFixed(1) + 'px)'; }
    if (cue) cue.style.opacity = (1 - seg(p, 0, 0.03)).toFixed(3);
    var bg = 1 - seg(p, 0.135, 0.195);                                   // centrato sul momento "di taglio" (p≈0.17)
    hero.style.opacity = bg.toFixed(3);
    hero.style.visibility = bg <= 0 ? 'hidden' : '';

    /* ---- Testo "Lo Studio" ---- */
    var tin = easeOut(seg(p, 0.27, 0.38)), tout = easeIn(seg(p, 0.71, 0.8));
    var op = tin * (1 - tout);
    var mobile = window.innerWidth < 768;
    studio.style.opacity = op.toFixed(3);
    studio.style.visibility = op > 0.01 ? 'visible' : 'hidden';
    studio.style.transform = mobile
      ? 'translateY(' + ((1 - tin) * 40 - tout * 40).toFixed(1) + 'px)'
      : 'translate(' + ((1 - tin) * -60).toFixed(1) + 'px,' + (-tout * 40).toFixed(1) + 'px)';
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onHeader(); onStage(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layout(); onScroll(); });
  layout(); onHeader(); onStage();
  window.addEventListener('load', function () { layout(); onStage(); });   // dopo il caricamento dei font

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
