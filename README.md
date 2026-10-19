# Cavallini & Partners — Nuovo sito web

Prototipo statico (HTML5 + Tailwind via CDN + JavaScript vanilla) pubblicabile su **GitHub Pages**
e strutturato per la successiva conversione in tema **WordPress**. Bilingue: italiano (radice) e inglese (`en/`).

## Struttura dei file

```
/
├── index.html            Home (palco animato del logo, studio, rete, servizi, internazionale, team, sedi, contatti)
├── servizi.html          Le 8 aree di attività (#fiscale #societaria #estero #assistenza #concorsuali #contenzioso #controllo #elaborazione)
├── team.html             Profili dei professionisti + "Lavora con noi" (#lavora)
├── circolari.html        Circolari informative (archivio in preparazione)
├── privacy.html          Informativa privacy e cookie
├── note-legali.html      Note legali
├── 404.html              Pagina "in preparazione"
├── en/                   Versione inglese (GENERATA: non modificare a mano, vedi sotto)
├── strumenti/
│   ├── traduci_en.py     Genera en/*.html dalle pagine italiane
│   └── en.json           Dizionario italiano → inglese
├── .nojekyll             Disattiva Jekyll su GitHub Pages
└── assets/
    ├── css/style.css     Colori, font e componenti
    ├── js/main.js        Header, menu, palco del logo, filigrana, reveal, mappa con consenso, form (testi IT/EN)
    └── img/
        ├── foto_sfondo.jpg   Foto di sfondo dell'hero: sostituisci il file con lo STESSO nome e il sito si aggiorna
        ├── logo/
        │   ├── logo.svg            Logo ufficiale ripulito (usato dal sito)
        │   └── logo-originale.svg  File vettoriale ricevuto dal cliente
        └── foto/
            ├── studio-libreria.jpg   Biblioteca (rete, sedi)
            ├── studio-attestato.jpg  Attestato (sedi, team: provvisoria al posto del ritratto)
            ├── studio-giornali.jpg   Circolari
            ├── studio-barca.jpg      Lavora con noi
            └── estero-bandiere.jpg   Internazionale
```

## Versione inglese

Dopo aver modificato un testo nelle pagine italiane:

1. `python strumenti/traduci_en.py --estrai` → aggiunge a `strumenti/en.json` le frasi nuove con traduzione vuota.
2. Compila le traduzioni mancanti in `en.json`.
3. `python strumenti/traduci_en.py` → rigenera `en/*.html` (segnala eventuali testi non tradotti).

## Pubblicazione su GitHub Pages

`git add -A && git commit -m "..." && git push` — Settings → Pages → Deploy from a branch → main / (root).

## Da completare prima della messa online

- P.IVA nel footer (`[da inserire]`).
- Form: creare un form su Formspree e sostituire `YOUR_FORM_ID` (home e team).
- Ritratto di Corrado Cavallini: `assets/img/team/corrado-cavallini.jpg` (oggi c'è la foto dell'attestato).
- Testi di privacy e note legali da far verificare a un legale.

## Mappa per la migrazione a WordPress

| Prototipo                         | WordPress                                                        |
|-----------------------------------|------------------------------------------------------------------|
| Variabili `:root` in style.css    | `theme.json` → palette e tipografia                              |
| `<header>` / `<footer>`           | `parts/header.html` / `parts/footer.html` o `header.php` / `footer.php` |
| Sezioni con commento `WP: pattern`| Block pattern o sezioni Elementor                                |
| Aree di attività                  | Custom Post Type "Servizio" o pagine figlie di /servizi          |
| team.html                         | Custom Post Type "Professionista"                                |
| Circolari                         | Articoli (categoria "Circolari")                                 |
| Versione inglese `en/`            | WPML o Polylang                                                  |
| Form                              | Contact Form 7 / WPForms (stesse classi `.field`)                |
| Mappa con consenso                | Plugin cookie (Complianz / Iubenda)                              |
| Tailwind CDN                      | CSS compilato incluso dal tema                                   |
