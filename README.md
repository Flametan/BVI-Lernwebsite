# BVI-Lernwebsite

> **Prüfungsvorbereitung für den B VI-Lehrgang** – höherer feuerwehrtechnischer Dienst  
> Progressive Web App (PWA) · Offline-fähig · Kein Build-Schritt · Vanilla HTML/CSS/JS

🔗 **Live:** [flametan.github.io/BVI-Lernwebsite](https://flametan.github.io/BVI-Lernwebsite/)

---

## Inhalt

| Modul | Lernkarten (nur Prüfungswissen) |
|---|---|
| 🧠 IBK Heyrothsberge | 63 |
| ⚖️ VAk Berlin | 141 |
| 📊 FeuAK Hamburg | 86 |
| 🏛️ IdF Münster | 100 |
| **Gesamt** | **390** |

---

## Features

- **390 Lernkarten** (nur Prüfungswissen) – 3D-Flip-Animation, Know/Don't-Know-Bewertung, LocalStorage-Persistenz
- **Fallbearbeitung** – 6 juristische Übungsfälle mit 9-Punkte-Schema (Realakt/VA-Differenzierung)
- **Altklausur-Training** – VAk Berlin + FeuAK Hamburg Prüfungsvorbereitung
- **Führungsdienstsimulator** – 8 verzweigte Entscheidungsszenarien mit Scoring
- **Abkürzungsverzeichnis** – Feuerwehr-Fachbegriffe A–Z
- **Volltextsuche** – `Ctrl+K` / `Cmd+K`, Live-Trefferhervorhebung
- **Lesezeichen & Notizen** – Seitenweise, persistiert per LocalStorage
- **Fortschritts-Tracking** – Besuchte Themen mit Badge-Anzeige
- **PWA** – Installierbar, Service Worker mit Offline-Fallback
- **Farbschema** – Dunkel, Hell, Beige oder System, dazu ein Regler für die Hintergrundhelligkeit von Schwarz bis Weiß (Einstellungen)
- **Jahrgänge** – Der Master (BRef 04/2025 - AB 04/2026) ist die Grundlage; jeder weitere Jahrgang passt Stundenplan (je Abschnitt, IdF Gruppe 1/2), Prüfungen und Fragen, Lernseiten (Kapitel ausblenden, eigene Kapitel und Reiter), Lernkarten (auch Master-Karten löschbar), Link und Standorte an. Rückgängig und Wiederholen sind auf den Seiten dauerhaft sichtbar. Änderungen werden als Datei exportiert, in der WhatsApp-Gruppe geteilt und eingelesen. Anleitung: [`jahrgaenge/ANLEITUNG.md`](jahrgaenge/ANLEITUNG.md), Prüfskript für eingeschickte Dateien: `node tools/pruefe-jahrgang.cjs <Datei.json>`
- **Ersteinrichtung** – beim ersten Start: Aussehen und Akzentfarbe, Lehrgang (Master oder Jahrgang) und eine Erklärseite zur Jahrgangs-Funktion
- **Startseite** – Weiterlernen, Tagesziel, Lernzeit je Woche/Monat, „Als Nächstes“ aus dem Stundenplan, Klausurtermin-Countdown (einstellbar, im Master vorbelegt)
- **Taschenkarte Stabsarbeit** – IdF-Tab: interaktive Seite `embed/stabskarte.html` (7-Punkte-Plan, Stab, taktische Zeichen, Katastrophenschutzlager NRW mit Lagerhalle im Querschnitt und Anforderungsrechner, EVA-Übung Sachgebiet 4 mit Musterlösungen); Stand wird mit `bvi_stk_*` gesichert
- **Stundenplan** – je Abschnitt und IdF-Gruppe; nur wichtige Termine (Akzentfarbe/grün) lassen sich in den Kalender übernehmen; im IdF-Plan öffnet ein Tipp auf eine Einheit mit Raum den Raumplan als 3D-Ansicht des Geländes (Gebäude leuchtet, Raumnummer als Etikett)
- **Sicherung** – Lernstand, Notizen, Einstellungen und Jahrgangs-Änderungen als Datei sichern und einspielen; Bilder liegen nur im Jahrgangs-Export
- **Pausenraum** – kleine Spiele, Einsatzfahrt mit Prüfungsfragen, Einsatzfahrt-Duell zu zweit (WebRTC) Einsatzleitung-Snake mit wählbaren Herausforderungen (Atemluft, Löschwasser) , Solitär mit Feuerwehr-Kartenfarben (Karten antippen oder ziehen) und Minesweeper „Nachtsuche“ (vier Stufen, Markieren per langem Druck)
- **Datenschutz** – alles bleibt auf dem Gerät (LocalStorage/IndexedDB), keine Konten, kein Tracking; Hinweis in der App unter Einstellungen
- **Android-App** – WebView mit Widgets und Startsymbol je Farbschema (`android/`)
- **Bildansicht** – Bilder und Diagramme per Tipp groß öffnen und zoomen

---

## Architektur

```
BVI-Lernwebsite/
├── index.html          # Alle Views (~18.500 Zeilen)
├── css/
│   └── style.css       # Design-System, alle Komponenten
├── js/
│   ├── app.js          # NAV, PROGRESS, SEARCH, FC, SIM, GH, ...
│   ├── jg.js / jg-ui.js  # Jahrgänge: Daten und Oberfläche
│   ├── pause.js / pause-data.js / duell.js / snake.js / solitaer.js / minesweeper.js  # Pausenraum, Einsatzfahrt, Duell, Snake, Solitär, Minesweeper
│   ├── raumplan.js / three.min.js      # Raumplan IdF Münster in 3D (wird erst beim ersten Tipp geladen)
│   ├── faq.js                          # FAQ zu den Standorten (Fragen, Antworten für IdF Münster, Karte im Stundenplan)
│   └── version.js      # APP_VERSION (mit sw.js synchron halten)
├── jahrgaenge/         # optionale veröffentlichte Jahrgangs-Dateien (<ID>.json) und Anleitung
├── tools/              # Prüfskript für Jahrgangs-Dateien
├── tests/              # Playwright-Tests (smoke, logic, duell)
├── docs/               # Testleitfaden (TESTLEITFADEN.md)
├── .github/workflows/  # Pages-Deployment, Smoke-Test, APK-Build
├── android/            # Android-App (Kotlin)
├── sw.js               # Service Worker (Network-first für Core-Assets)
├── manifest.json       # PWA-Manifest
└── icons/
    ├── icon-192.svg / icon-512.svg   # Flamme (SVG)
    └── *.png                          # PNG-Varianten für Startbildschirm
```

**Stack:** Vanilla HTML/CSS/JS · Kein Framework · Kein Build-Schritt  
**Deployment:** GitHub Actions → GitHub Pages (automatisch bei Push auf `main`)

---

## Lokal starten

```bash
git clone https://github.com/flametan/BVI-Lernwebsite.git
cd BVI-Lernwebsite
# Beliebigen HTTP-Server starten, z. B.:
npx serve .
# oder:
python3 -m http.server 8080
```

Dann `http://localhost:8080` aufrufen. Ein HTTP-Server ist nötig, damit Service Worker und LocalStorage korrekt funktionieren.

---

## Tests

```bash
cd tests
npm install                        # einmalig (Playwright)
python3 -m http.server 8765 &      # im Repo-Hauptordner starten
node smoke.cjs && node logic.cjs && node duell.cjs
```

`smoke.cjs` öffnet alle Ansichten in drei Größen, `logic.cjs` prüft die App-Logik (Jahrgänge, Sicherung, Plan, Suche), `duell.cjs` das Einsatzfahrt-Duell. Der Smoke-Test läuft auch bei jedem Push als GitHub Action. Manuelle Prüfpunkte: [`docs/TESTLEITFADEN.md`](docs/TESTLEITFADEN.md).

---

## Wartung

- **Neue Lehrgänge** erscheinen automatisch in der Liste (jeweils ab 1. April und 1. Oktober); im Code ist nichts zu ergänzen.
- **Speiseplan IdF** (Tipp auf „Mittagessen“ im Stundenplan): Pro Woche neue Tage in `data/speiseplan.json` unter `tage` ergänzen (Schlüssel = Datum), `stand` anpassen; Tage ohne Eintrag zeigen „noch kein Speiseplan“.
- **Master-Klausurtermine** stehen in `DEF_EXAMS` (`js/app.js`); nach dem letzten Termin blendet sich der Countdown von selbst aus.
- **Jahrgangs-Dateien** (`jahrgaenge/<ID>.json`) sind optional; ohne sie arbeitet jeder Jahrgang mit den eigenen Einträgen.
- **Android:** Die APK wird nur bei Änderungen unter `android/**` oder an `js/version.js` neu gebaut; Inhalte kommen über die Website.
- **iPhone/iPad:** Safari löscht Website-Daten nach etwa 7 Tagen ohne Besuch. Als App auf dem Home-Bildschirm gilt das nicht; zusätzlich hilft die Sicherung.

---

## Navigation (NAV-Engine)

```javascript
NAV.go('v-vak-verwaltungsrecht', 'VAk · Verwaltungsrecht')  // Navigate forward
NAV.back()    // Zurück
NAV.home()    // Zur Startseite
```

Alle Views sind `div.view`-Container in `index.html`. View-IDs müssen in `const ALL` (`js/app.js`) und in den jeweiligen `PROGRESS.GROUPS` eingetragen werden.

---

## Neue Inhalte hinzufügen

1. **HTML-View** in `index.html` anlegen (`<div id="v-modul-thema" class="view"> ... </div>`)
2. **View-ID** in `const ALL` eintragen (`js/app.js`)
3. **PROGRESS-Gruppe** erweitern (`GROUPS`-Objekt)
4. **VIEW_LABELS** ergänzen (für Suche und Breadcrumb)
5. **Navigation** verlinken (Tile oder Card in der Modulübersicht)

---

## Design-System

```css
--c-navy:   #0A192F   /* Hintergrund */
--c-gold:   #C9A84C   /* Akzentfarbe, Headlines */
--c-red:    #A50000   /* CTA-Buttons, Warnungen */
--c-blue:   #3A7FD4   /* Info-Hinweise */
```

Wichtige CSS-Klassen: `.info-card`, `.def-box`, `.hint`, `.step-stack`, `.acc-list`, `.cg`, `.dt`, `.badge`

---

## Version

Aktuelle Version: **3.0.3**  
`js/version.js` und `sw.js` müssen immer synchron gehalten werden.

**Eine Version pro Tag:** Die erste Änderung eines Tages hebt die letzte Stelle um 1 an (3.0.1, am nächsten Tag mit Änderungen 3.0.2, …) und legt in `CHANGELOG.ENTRIES` (`js/app.js`) einen neuen Eintrag mit dem Datum an; weitere Änderungen desselben Tages kommen in denselben Eintrag und ändern die Versionsnummer nicht. Dazu gehören `js/version.js`, `sw.js` und die Angaben in dieser Datei. Die Android-App wird bei Änderung von `js/version.js` neu gebaut.

```javascript
// js/version.js
const APP_VERSION = '3.0.3';

// sw.js (erste Zeile)
const APP_VERSION = '3.0.3'; // keep in sync with js/version.js
```

---

## Lizenz

Privates Lernprojekt – nicht zur kommerziellen Nutzung.
