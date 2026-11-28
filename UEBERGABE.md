# Übergabe für eine neue Sitzung: BVI-Lernwebsite

## Projekt
Lern-PWA „B VI – Höherer Dienst“ (Feuerwehr, Prüfungsvorbereitung). Vanilla HTML/CSS/JS, kein Build-Schritt, offlinefähig.
Live: https://flametan.github.io/BVI-Lernwebsite/ · Repo: `flametan/bvi-lernwebsite` · Details in `README.md`.

## Zusammenarbeit
- Nutzer schreibt Deutsch: **immer auf Deutsch, knapp** antworten, keine langen Erklärungen.
- Ablauf: ändern, testen, auf den Dev-Branch committen und pushen, dann fragen: „Soll ich den PR erstellen und mergen?“. PR (Squash) erst nach „PR erstellen und mergen“ des Nutzers. Oft steht das schon in derselben Nachricht, dann direkt machen.
- Dev-Branch: `claude/page-improvement-feedback-hO6EU`. Kein `gh`, GitHub nur über `mcp__github__*` (Schemas per ToolSearch laden: `select:mcp__github__create_pull_request,mcp__github__merge_pull_request`).
- Nach einem Merge: `git fetch origin main && git checkout -B <dev-branch> origin/main`. Der Remote-Dev-Branch hat noch alte Commits; vor dem Push `git fetch origin <dev-branch> && git merge --no-edit -X ours origin/<dev-branch>`, dann normal pushen (Force-Push wird verweigert). Danach prüfen, dass gelöschte Dateien nicht durch den Merge zurückkamen.
- Commit-Nachrichten enden mit den Attributionszeilen, die die Sitzung vorgibt.
- Der Bash-Hook „cc-plugin-privacy“ verweigert manchmal harmlose Befehle (Fehlalarm). Dann Read/Grep/Edit nutzen oder Skript in Scratchpad schreiben und ausführen.

## Struktur und wichtige Stellen
- `index.html`: alle Ansichten als Lazy-Templates `<template data-lazy-view="v-…"><div id="v-…" class="view detail-view">…</div></template>`. Themenkarten: `<div class="topic-card" onclick="NAV.go('v-…','Titel')">`.
- `js/app.js`: NAV, Suche, Quiz-Fabrik `makeQuiz(cfg)` (QUIZ für VAk, IDFQ für IdF), Ansichtslisten je Bereich (z. B. `ibk:[…]`, `feuak:[…]`) und **Titel-Map** (~Zeile 1226–1264, `'v-…':'Bereich · Titel'`). Neue Ansicht = Template + Karte + Titel-Eintrag (+ ggf. Listen-Eintrag).
- `js/laufbahn.js`: Laufbahnprüfung (Passwort-Gate, Hub `v-lb-start` mit Fächern IBK/VAk/FeuAK/VB/Stab, IBK-Simulation, FeuAK-Simulation, VB-Klausur, Prüfschema). Passwort-Gate per `sessionStorage` `bvi_lb_ok='1'` (für Tests setzen). Fach-Karten stehen in `index.html` im `#lb-hub` (`lb-fach` mit Zähler `lb-cnt`).
- Laufbahn-Reiter: `v-lb-ibk1/ibk2` (Klausuren mit Musterlösung), `v-lb-ibk-eingr`, `v-lb-vak`, `v-lb-vak-eingr`, `v-lb-vak-alt`, `v-lb-vak-schema`, `v-lb-feuak`, `v-lb-feuak-eingr`, `v-lb-feuak-alt`, `v-lb-feuak-sim`, `v-lb-vb`, `v-lb-vb-eingr`.
- `js/brainyoo-data.js`: eine riesige JSON-Zeile; Fragen per Skript entfernen, nicht von Hand.
- `js/changelog-data.js`: neue Punkte oben in den **obersten** Eintrag (`v:'3.3.2'`, neueste zuerst).
- `js/version.js`: `APP_VERSION='3.3.2'` ist **intern** (Service-Worker-Cache `bvi-v…`, Tests, APK-Workflow). Angezeigt wird `APP_VERSION_ANZEIGE`: 3.3 bis 29.11.2026, 3.3.1 ab 30.11.2026, 3.3.2 ab 31.12.2026. Nicht ändern, ohne `sw.js`, README (Zeilen ~157/164/167) und obersten Changelog-Eintrag mitzuziehen (Logik-Test prüft das).
- `sw.js`, `manifest.json`, `android/` (WebView-App), `sync-server/`, `game/` (Spieldaten), `jahrgaenge/` (Jahrgangs-Funktion), `tools/`.

## Tests (aus `tests/`, vorher `export NODE_PATH=$(npm root -g)`)
- Lokaler Server im Repo-Root: `python3 -m http.server 8765` (stirbt gelegentlich, neu starten).
- `node smoke.cjs`: öffnet jede Ansicht in 3 Größen (zuletzt 504, OK). `node logic.cjs`: 131 Logikprüfungen (OK).
- Bekannt, unabhängig von der Arbeit: `sync.cjs` („Schreiben der Nutzungszeit löst keinen Abgleich aus“) und der sync-server-Test „Duell: herausfordern, annehmen, Zwischenstand“ schlagen fehl.
- Playwright ist vorinstalliert (`require('playwright')`, `chromium.launch()`).

## Stand (Nov. 2026)
Zuletzt gemergt: IdF-Quiz „Keine Fragen für diesen Filter“ behoben, Scroll zur nächsten Frage nach „Weiter“, datumsabhängige Versionsanzeige, Reiter entfernt (IBK „Projektarbeiten“, FeuAK „Prüfungsleistung Hamburg“ und „Lernarbeitsblatt April 2026“), Brainyoo-Lagekartenfrage entfernt, vier Eingrenzungen (IBK, Recht VAk, FeuAK 3.3, VB IdF NRW) als eigene Reiter im Laufbahn-Hub (PR #643). Eine Rust/WASM-„Klausur-Werkstatt“ wurde gebaut (#644) und auf Wunsch wieder entfernt (#645).

## Offen / optional (nicht angefordert)
- IBK, VAk, FeuAK aus der „Zusammenfassung V3.11“ neu aufbauen.
- Reste: `quelle`-Texte in `game/data/feuak.json` und `game/tools/faelle/feuak.json` nennen noch das gelöschte `v-feuak-lernblatt-2026`.
- `js/app.js` enthält ab ca. Zeile 4244 rund 62 wiederholte Müll-Kommentarzeilen („KF_QUIZ – Klausurfragen Übersicht …“), unbedenklich zu löschen.
- Die zwei oben genannten, schon vorher fehlschlagenden Tests.
