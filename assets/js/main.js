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
     La sezione .stage è alta 2 schermate; il suo contenitore resta agganciato
     allo schermo (sticky) e l'avanzamento p (0→1) guida una "timeline":

       p 0.00–0.18  il testo dell'hero sale e svanisce
       p 0.05–0.55  il logo ruota in 3D (mezzo giro): a metà è di taglio, lì cambia
                    colore da bianco a blu mentre lo sfondo passa dal blu al chiaro
       p 0.05–0.62  il logo vola dal centro a destra e si ingrandisce, compare il disco
       p 0.45–0.72  a sinistra entra il testo "Lo Studio"; da p 0.66 i valori in cascata (a tempo)
       p 0.72–1.00  lettura: tutto FERMO
       uscita       il palco si sgancia: la schermata Studio scorre via in modo naturale
                    mentre il logo (0.8 schermate di scroll) diventa la filigrana fissa,
                    con dissolvenza incrociata tra logo pieno e filigrana (solo GPU)

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
  var disk = document.querySelector('.stage-disk');
  var heroContent = document.querySelector('.stage-hero .hero-content');
  var studio = document.querySelector('.stage-studio');
  var cue = document.querySelector('.stage-hero .scroll-cue');
  var anchor = document.getElementById('studio');
  var valuesWrap = document.querySelector('.stage-values');

  var animated = !!(stage && sticky && sm && slot && studio && !reduceMotion);
  // Il logo diventa un elemento fisso a livello di pagina: non "salta" quando il palco si sgancia
  if (animated) { root.classList.add('js-stage'); document.body.appendChild(sm); }

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }               // avanzamento locale di un tratto della timeline
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function smooth(t) { return t * t * t * (t * (t * 6 - 15) + 10); }        // smootherstep: parte e arriva con velocità zero

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
    headerLimit = function () { return S.top + S.len * 0.28; };

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
    if (anchor) anchor.style.top = Math.round(S.len * 0.9) + 'px';    // "Lo Studio" nel menu: momento di lettura (logo fermo)
  }

  function markTransform(cx, cy, s, rot) {
    var W = WM.W, H = WM.H;
    return 'translate(' + (cx - W * s / 2).toFixed(1) + 'px,' + (cy - H * s / 2).toFixed(1) + 'px) scale(' + s.toFixed(4) + ') ' +
      'translate(' + W / 2 + 'px,' + H / 2 + 'px) rotate(' + rot.toFixed(2) + 'deg) translate(' + (-W / 2) + 'px,' + (-H / 2) + 'px)';
  }

  function onStage(y) {
    var vh = window.innerHeight;
    var stageEnd = animated ? S.top + S.len : (stage ? stage.offsetTop + stage.offsetHeight - vh : vh);
    // Uscita: dopo lo sgancio del palco, il logo diventa filigrana mentre la schermata
    // "Lo Studio" scorre via in modo naturale (niente schermata vuota in mezzo).
    var EXIT = animated ? vh * 0.8 : 0;
    var q = animated ? clamp((y - stageEnd) / EXIT) : 1;                  // 0→1 durante l'uscita
    var wmStart = stageEnd + EXIT;
    var docEnd = Math.max(1, document.documentElement.scrollHeight - vh - wmStart);
    var after = clamp((y - wmStart) / docEnd);

    /* ---- Filigrana: posizione (parallax ±11% vh, rotazione ±3.5°) ---- */
    var k = reduceMotion ? 0.5 : after;
    var wmCx = WM.tx + WM.W / 2, wmCy = WM.ty + (k - 0.5) * -0.22 * vh + WM.H / 2;
    var wmRot = (k - 0.5) * 7;

    if (!animated) {
      if (brand) {
        brand.style.opacity = y > (hero ? hero.offsetHeight * 0.8 : vh) ? 1 : 0;
        brand.style.transform = markTransform(wmCx, wmCy, 1, wmRot);
      }
      return;
    }

    var p = clamp((y - S.top) / S.len);

    /* ---- Posizione del logo: K0 (hero) → K2 (protagonista, poi FERMO) → filigrana ---- */
    var m1 = smooth(seg(p, 0.05, 0.62)), m3 = smooth(q);
    var cx = lerp(lerp(K0.cx, K2.cx, m1), wmCx, m3);
    var cy = lerp(lerp(K0.cy, K2.cy, m1), wmCy, m3);
    var w  = lerp(lerp(K0.w,  K2.w,  m1), WM.W, m3);
    var rot = lerp(0, wmRot, m3);
    var T = markTransform(cx, cy, w / WM.W, rot);


    /* ---- Passaggio logo pieno → filigrana: dissolvenza incrociata tra due livelli che si
       muovono insieme. Solo transform + opacity (gestiti dalla GPU): nessun ridisegno
       dell'SVG durante lo scroll, quindi niente scatti. ---- */
    var mobileExit = window.innerWidth < 768;
    var solid, wmOp, TB = T;
    if (mobileExit) {
      // Smartphone: il testo è sotto il logo, quindi il logo NON lo attraversa: sale insieme
      // alla schermata e svanisce; la filigrana compare dopo, già al suo posto.
      var up = Math.max(0, y - stageEnd);
      T = markTransform(K2.cx, K2.cy - up, K2.w / WM.W, 0);
      if (p < 1) T = markTransform(cx, cy, w / WM.W, 0);
      TB = markTransform(wmCx, wmCy, 1, wmRot);
      solid = 1 - smooth(seg(q, 0, 0.5));
      wmOp = smooth(seg(q, 0.45, 1));
    } else {
      solid = 1 - smooth(seg(q, 0.15, 0.85));
      wmOp = smooth(seg(q, 0.05, 0.75));
    }
    sm.style.transform = T;
    sm.style.opacity = solid.toFixed(3);
    sm.style.visibility = solid <= 0.001 ? 'hidden' : '';
    if (brand) {
      brand.style.transform = TB;
      brand.style.opacity = wmOp.toFixed(3);
      // la "penna" sui tratti si muove solo quando la filigrana è a riposo (evita ridisegni durante l'uscita)
      brand.style.setProperty('--trace', (-Math.max(0, y - wmStart) / vh * 0.32).toFixed(4));
      brand.style.setProperty('--tro', Math.min(1, after * 25).toFixed(3));
    }

    /* ---- Rotazione 3D con cambio colore quando il logo è di taglio ---- */
    // Mezzo giro continuo (0→180°): oltre 90° si sottraggono 180° così non appare mai specchiato.
    var r = seg(p, 0.05, 0.55), a180 = 180 * smooth(r);
    var ang = a180 > 90 ? a180 - 180 : a180;
    smRot.style.transform = 'rotateY(' + ang.toFixed(2) + 'deg)';
    sm.classList.toggle('is-dark', a180 > 90);

    /* ---- Disco chiaro dietro al logo (scorre via insieme alla schermata) ---- */
    if (disk) {
      var ds = smooth(seg(p, 0.3, 0.62));
      disk.style.transform = 'translate(' + (K2.cx - D / 2).toFixed(1) + 'px,' + (K2.cy - D / 2).toFixed(1) + 'px) scale(' + ds.toFixed(4) + ')';
    }

    /* ---- Hero: il testo sale e svanisce, poi lo sfondo blu lascia il posto al chiaro ---- */
    var h = smooth(seg(p, 0, 0.18));
    if (heroContent) { heroContent.style.opacity = (1 - h).toFixed(3); heroContent.style.transform = 'translateY(' + (-70 * h).toFixed(1) + 'px)'; }
    if (cue) cue.style.opacity = (1 - seg(p, 0, 0.05)).toFixed(3);
    var bg = 1 - smooth(seg(p, 0.2, 0.42));                               // centrato sul momento "di taglio" (p≈0.3)
    hero.style.opacity = bg.toFixed(3);
    hero.style.visibility = bg <= 0 ? 'hidden' : '';

    /* ---- Testo "Lo Studio": entra e poi resta (esce scorrendo con la pagina) ---- */
    var tin = smooth(seg(p, 0.45, 0.72));
    var mobile = window.innerWidth < 768;
    studio.style.opacity = tin.toFixed(3);
    studio.style.visibility = tin > 0.01 ? 'visible' : 'hidden';
    studio.style.transform = mobile ? 'translateY(' + ((1 - tin) * 40).toFixed(1) + 'px)'
                                    : 'translateX(' + ((1 - tin) * -60).toFixed(1) + 'px)';

    /* ---- I quattro valori: compaiono da soli "in cascata" (animazione a tempo, CSS) ---- */
    if (valuesWrap) {
      if (p >= 0.66) valuesWrap.classList.add('is-in');
      else if (p < 0.5) valuesWrap.classList.remove('is-in');
    }
  }

  /* ---- Scroll "morbido": l'animazione insegue la posizione reale con un'inerzia
     (come lo "scrub" dei siti di riferimento). Gli scatti della rotellina del mouse
     vengono ammorbiditi; la pagina continua a scorrere in modo nativo. ---- */
  var sy = window.scrollY, rafId = null, lastT = 0;
  var INERTIA = 110;                                                       // ms: più alto = più morbido
  function tick(t) {
    var target = window.scrollY;
    var dt = lastT ? Math.min(64, t - lastT) : 16;
    lastT = t;
    sy += (target - sy) * (1 - Math.exp(-dt / INERTIA));
    if (Math.abs(target - sy) < 0.25) sy = target;
    onHeader(); onStage(sy);
    if (sy !== target) rafId = requestAnimationFrame(tick);
    else { rafId = null; lastT = 0; }
  }
  function onScroll() { if (!rafId) rafId = requestAnimationFrame(tick); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layout(); sy = window.scrollY; onHeader(); onStage(sy); });
  layout(); onHeader(); onStage(sy);
  window.addEventListener('load', function () { layout(); onStage(sy); });   // dopo il caricamento dei font

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

  /* ---------- Testi dell'interfaccia nelle due lingue (lingua letta da <html lang>) ---------- */
  var LANG = (document.documentElement.lang || 'it').slice(0, 2);
  var T = {
    it: { menuOpen: 'Apri il menu', menuClose: 'Chiudi il menu', sending: 'Invio in corso…',
          demo: 'Modulo in modalità demo: configura l\'endpoint (Formspree o WordPress) per ricevere i messaggi.',
          ok: 'Grazie! Abbiamo ricevuto la tua richiesta e ti ricontatteremo al più presto.',
          err: 'Si è verificato un errore. Riprova o chiamaci allo 0536 980303.', mapTitle: 'Mappa' },
    en: { menuOpen: 'Open menu', menuClose: 'Close menu', sending: 'Sending…',
          demo: 'Demo form: configure the endpoint (Formspree or WordPress) to receive messages.',
          ok: 'Thank you! We have received your request and will get back to you shortly.',
          err: 'Something went wrong. Please try again or call us on +39 0536 980303.', mapTitle: 'Map' }
  }[LANG] || null;
  if (!T) T = { menuOpen: 'Apri il menu', menuClose: 'Chiudi il menu', sending: '…', demo: '', ok: '', err: '', mapTitle: 'Mappa' };
  if (toggle) toggle.addEventListener('click', function () {
    toggle.setAttribute('aria-label', toggle.getAttribute('aria-expanded') === 'true' ? T.menuClose : T.menuOpen);
  });

  /* ---------- Mappa Google: caricata solo dopo il consenso ----------
     L'indirizzo è nell'attributo data-address del contenitore #map. */
  var loadMap = document.getElementById('load-map');
  if (loadMap) {
    loadMap.addEventListener('click', function () {
      var box = document.getElementById('map');
      var addr = box.getAttribute('data-address') || 'Via Mazzini 182/F, 41049 Sassuolo MO';
      box.innerHTML = '<iframe title="' + T.mapTitle + ': ' + addr.replace(/"/g, '') + '" ' +
        'src="https://www.google.com/maps?q=' + encodeURIComponent(addr) + '&output=embed" ' +
        'class="absolute inset-0 w-full h-full border-0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
    });
  }

  /* ---------- Moduli (contatti, lavora con noi): validazione + invio AJAX ----------
     Ogni <form class="js-form"> ha campi .field; i campi con "required" sono obbligatori,
     type="email" e type="tel" vengono controllati nel formato. */
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var telRe = /^[+0-9 ()./-]{6,20}$/;
  document.querySelectorAll('form.js-form').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');
    var btnLabel = btn ? btn.textContent : '';

    function setError(input, bad) {
      var f = input.closest('.field'); if (f) f.classList.toggle('has-error', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    function validate() {
      var ok = true;
      form.querySelectorAll('.field input, .field textarea, .field select').forEach(function (el) {
        var v = (el.value || '').trim(), bad = false;
        if (el.type === 'checkbox') bad = el.required && !el.checked;
        else if (el.required && v.length < 2) bad = true;
        else if (el.type === 'email' && v && !emailRe.test(v)) bad = true;
        else if (el.type === 'tel' && v && !telRe.test(v)) bad = true;
        ok = setError(el, bad) && ok;
      });
      return ok;
    }
    function showStatus(msg, good) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status is-visible sm:col-span-2 rounded-md p-4 text-sm ' +
        (good ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200');
    }
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f && f.classList.contains('has-error')) validate();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var first = form.querySelector('.has-error input, .has-error textarea, .has-error select');
        if (first) first.focus();
        return;
      }
      // Modalità demo finché non è configurato l'endpoint reale
      if (form.action.indexOf('YOUR_FORM_ID') !== -1) { showStatus(T.demo, true); form.reset(); return; }
      if (btn) { btn.disabled = true; btn.textContent = T.sending; }
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(); showStatus(T.ok, true); form.reset(); })
        .catch(function () { showStatus(T.err, false); })
        .finally(function () { if (btn) { btn.disabled = false; btn.textContent = btnLabel; } });
    });
  });

  /* ---------- Pagina servizi: evidenzia nell'indice laterale la sezione in lettura ---------- */
  var idx = document.querySelector('.service-index');
  if (idx && 'IntersectionObserver' in window) {
    var links = {};
    idx.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.toggle('is-active', k === e.target.id); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(links).forEach(function (k) { var el = document.getElementById(k); if (el) spy.observe(el); });
  }
})();
