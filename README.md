# Cavallini & Partners — Nuovo sito web

Prototipo statico (HTML5 + Tailwind via CDN + JavaScript vanilla) pubblicabile su **GitHub Pages**
e strutturato per la successiva conversione in tema **WordPress**.

## Struttura dei file

```
/
├── index.html            Home page
├── team.html             (prossimo step) Pagina team con foto e profili
├── servizi.html          (prossimo step) Approfondimento servizi (#fiscale #societaria #contabile #revisione)
├── privacy.html          (da fare) Informativa privacy
├── cookie.html           (da fare) Cookie policy
├── 404.html              Pagina "in preparazione" (usata da GitHub Pages per i link non ancora creati)
├── .nojekyll             Disattiva Jekyll su GitHub Pages
└── assets/
    ├── css/style.css     Variabili colore/font + componenti (hero, card, form, filigrana)
    ├── js/main.js        Header, menu mobile, filigrana animata, reveal, mappa con consenso, form
    └── img/
        ├── logo.svg      Ricostruzione vettoriale del marchio (sostituire con il vettoriale ufficiale)
        ├── hero-sassuolo.jpg   (da aggiungere) foto di sfondo dell'hero
        └── sede-*.jpg          (da aggiungere) foto della sede
```

## Pubblicazione su GitHub Pages

1. `git add . && git commit -m "Home page" && git push`
2. Su GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. Il sito sarà online su `https://matteotagliavini.github.io/WebSite_Cavallini_Mammi/`.

## Da completare prima della messa online

- Logo ufficiale in SVG (sostituire `assets/img/logo.svg` e i tre path `#mk-p1/2/3` in `index.html`).
- Foto: hero di Sassuolo (`--cp-hero-img` sulla sezione `.hero`) e foto della sede (blocchi `.photo-slot`).
- Form: creare un form su Formspree e sostituire `YOUR_FORM_ID` in `index.html`.
- P.IVA, email PEC/ordinaria, eventuali orari nel footer.

## Mappa per la migrazione a WordPress

| Prototipo                         | WordPress                                                        |
|-----------------------------------|------------------------------------------------------------------|
| Variabili `:root` in style.css    | `theme.json` → `settings.color.palette` e `typography`           |
| `<header>` / `<footer>`           | `parts/header.html` / `parts/footer.html` (block theme) o `header.php` / `footer.php` |
| Sezioni con commento `WP: pattern`| Block pattern (`patterns/hero.php`, `servizi.php`, …) o sezioni Elementor |
| Card servizi                      | Custom Post Type "Servizio" o pagine figlie di /servizi          |
| team.html                         | Custom Post Type "Professionista" (foto, ruolo, bio) + template archivio |
| Form contatti                     | Contact Form 7 / WPForms (stesse classi `.field`)                |
| Mappa con consenso                | Gestita dal plugin cookie (es. Complianz / Iubenda)              |
| Tailwind CDN                      | CSS compilato (Tailwind CLI) incluso dal tema, senza CDN         |
