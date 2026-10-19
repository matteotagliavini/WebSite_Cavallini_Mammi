#!/usr/bin/env python3
"""Genera la versione inglese del sito (cartella en/) a partire dalle pagine italiane.
Uso:  python3 strumenti/traduci_en.py            -> crea en/*.html
      python3 strumenti/traduci_en.py --estrai   -> aggiunge a en.json le frasi nuove (valore vuoto) da tradurre
Il dizionario strumenti/en.json associa ogni testo italiano alla sua traduzione."""
import sys, os, re, json, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DICT = os.path.join(ROOT, 'strumenti', 'en.json')
PAGES = ['index.html', 'servizi.html', 'team.html', 'circolari.html', 'privacy.html', 'note-legali.html']
ATTRS = ('alt', 'aria-label', 'title', 'placeholder', 'data-address-label')
LETTER = re.compile('[A-Za-zÀ-ÿ]')

def norm(t): return ' '.join(html.unescape(t).split())

def process(src, fn):
    """fn(testo_normalizzato) -> traduzione o None. Restituisce l'HTML tradotto."""
    parts = re.split(r'(<!--.*?-->|<[^>]+>)', src, flags=re.S)
    skip = 0; out = []
    for p in parts:
        if p.startswith('<!--'): out.append(p); continue
        if p.startswith('<'):
            m = re.match(r'<\s*(/?)\s*([a-zA-Z0-9]+)', p)
            if m:
                tag = m.group(2).lower(); closing = m.group(1) == '/'
                if tag in ('script', 'style', 'svg') and not p.endswith('/>'):
                    skip += -1 if closing else 1
                if not closing and not skip:
                    def rep(a):
                        name, q, val = a.group(1), a.group(2), a.group(3)
                        if LETTER.search(val):
                            tr = fn(norm(val))
                            if tr is not None: return f'{name}={q}{html.escape(tr, quote=True)}{q}'
                        return a.group(0)
                    p = re.sub(r'\b(' + '|'.join(ATTRS) + r')=(["\'])(.*?)\2', rep, p)
                    if tag == 'meta' and re.search(r'(name="description"|property="og:(title|description)")', p):
                        p = re.sub(r'\b(content)=(["\'])(.*?)\2', rep, p)
            out.append(p); continue
        if skip or not LETTER.search(p): out.append(p); continue
        key = norm(p)
        tr = fn(key)
        if tr is None: out.append(p); continue
        lead = re.match(r'\s*', p).group(0); trail = re.search(r'\s*$', p).group(0)
        out.append(lead + html.escape(tr, quote=False) + trail)
    return ''.join(out)

def links(h, page):
    # percorsi verso ../ , pagine interne restano relative (stessi nomi in en/)
    h = re.sub(r'(src|href)="assets/', r'\1="../assets/', h)
    h = h.replace("url('assets/", "url('../assets/")
    h = h.replace('<html lang="it">', '<html lang="en">').replace('content="it_IT"', 'content="en_GB"')
    # selettore lingua
    h = re.sub(r'<span class="is-current" aria-current="true">IT</span><a href="en/[^"]*" hreflang="en" lang="en">EN</a>',
               f'<a href="../{page}" hreflang="it" lang="it">IT</a><span class="is-current" aria-current="true">EN</span>', h)
    return h

def main():
    d = json.load(open(DICT, encoding='utf-8')) if os.path.exists(DICT) else {}
    if '--estrai' in sys.argv:
        new = []
        def coll(k):
            if k not in d and k not in new: new.append(k)
            return None
        for pg in PAGES:
            if os.path.exists(os.path.join(ROOT, pg)): process(open(os.path.join(ROOT, pg), encoding='utf-8').read(), coll)
        for k in new: d[k] = ''
        json.dump(d, open(DICT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f'{len(new)} frasi nuove aggiunte a en.json (da tradurre)'); return
    missing = set()
    def tr(k):
        v = d.get(k)
        if v: return v
        missing.add(k); return None
    os.makedirs(os.path.join(ROOT, 'en'), exist_ok=True)
    for pg in PAGES:
        p = os.path.join(ROOT, pg)
        if not os.path.exists(p): continue
        h = links(process(open(p, encoding='utf-8').read(), tr), pg)
        open(os.path.join(ROOT, 'en', pg), 'w', encoding='utf-8').write(h)
    print('Pagine inglesi generate in en/.')
    if missing:
        print(f'ATTENZIONE: {len(missing)} testi senza traduzione (lasciati in italiano):')
        for k in sorted(missing): print('  -', k[:90])

if __name__ == '__main__': main()
