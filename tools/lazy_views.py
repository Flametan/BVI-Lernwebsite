#!/usr/bin/env python3
"""
Packt die Lernseiten in index.html in <template>-Elemente, damit der Browser sie beim Start nicht
gestalten und anzeigen muss. Die App setzt sie bei Bedarf (Öffnen, Suche) oder im Leerlauf ein
(VIEWS in js/app.js).

Aufruf:  python3 tools/lazy_views.py            (schreibt index.html neu; mehrfaches Ausführen ist unschädlich)
         python3 tools/lazy_views.py --check    (nur melden, nichts schreiben)

Neue Ansichten können weiter einfach als <div id="v-..." class="view ..."> in index.html stehen;
das Skript verpackt sie beim nächsten Lauf. Ansichten aus EAGER bleiben immer direkt im Dokument.
"""
import re, sys, json

EAGER = {
    'v-home', 'v-settings', 'v-flashcards', 'v-pause', 'v-pruefung', 'v-plan', 'v-notizen',
    'v-bookmarks', 'v-set-nav', 'v-app', 'v-klausur', 'v-simulator',
}
PATH = 'index.html'

def close_of(h, start):
    """Index hinter dem passenden </div> zu dem <div ...>, das bei start beginnt."""
    depth = 0
    i = start
    tok = re.compile(r'<(/?)div\b|<script\b|<style\b|<!--', re.I)
    while True:
        m = tok.search(h, i)
        if not m:
            raise SystemExit('Kein passendes </div> ab Position %d' % start)
        t = m.group(0).lower()
        if t.startswith('<script'):
            i = h.index('</script>', m.end()) + 9
        elif t.startswith('<style'):
            i = h.index('</style>', m.end()) + 8
        elif t == '<!--':
            i = h.index('-->', m.end()) + 3
        else:
            gt = h.index('>', m.end())
            if m.group(1):
                depth -= 1
                if depth == 0:
                    return gt + 1
            else:
                if h[gt - 1] != '/':
                    depth += 1
            i = gt + 1

def main():
    check = '--check' in sys.argv
    h = open(PATH, encoding='utf-8').read()
    # Nur Ansichten auf oberster Ebene des <body>-Inhalts; Vorkommen in Kommentaren oder Skripten zählen nicht
    out, pos, n, moved = [], 0, 0, []
    pat = re.compile(r'<div id="(v-[\w-]+)" class="(view[^"]*)"[^>]*>')
    for m in pat.finditer(h):
        if m.start() < pos:
            continue
        vid = m.group(1)
        if vid in EAGER:
            continue
        end = close_of(h, m.start())
        block = h[m.start():end]
        out.append(h[pos:m.start()])
        out.append('<template data-lazy-view="%s">%s</template>' % (vid, block))
        pos = end
        n += 1
        moved.append(vid)
    out.append(h[pos:])
    res = ''.join(out)
    # Tabelle: Element-IDs innerhalb der ausgelagerten Ansichten -> Ansicht (für document.getElementById)
    ids = {}
    for tm in re.finditer(r'<template data-lazy-view="([\w-]+)">(.*?)</template>', res, re.S):
        vid, body = tm.group(1), tm.group(2)
        for im in re.finditer(r'\sid="([^"]+)"', body):
            if im.group(1) != vid:
                ids.setdefault(im.group(1), vid)
    table = '<script id="lazy-ids">window.__LAZY_IDS=%s;</script>' % json.dumps(ids, ensure_ascii=False, separators=(',', ':'))
    res = re.sub(r'<script id="lazy-ids">.*?</script>', '', res, flags=re.S)
    # Tabelle direkt vor dem ersten Skript am Ende des Dokuments einsetzen (vor js/jg.js)
    anchor = '<script src="js/jg.js"></script>'
    assert anchor in res, 'Anker <script src="js/jg.js"> fehlt'
    res = res.replace(anchor, table + '\n' + anchor, 1)
    print('Neu verpackt: %d Ansichten, IDs in Tabelle: %d' % (n, len(ids)))
    if not check:
        open(PATH, 'w', encoding='utf-8').write(res)

if __name__ == '__main__':
    main()
