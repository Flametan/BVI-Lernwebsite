# BVI-Lernwebsite

> **Prüfungsvorbereitung für den B VI-Lehrgang** – höherer feuerwehrtechnischer Dienst  
> Progressive Web App (PWA) · Offline-fähig · Kein Build-Schritt · Vanilla HTML/CSS/JS

🔗 **Live:** [flametan.github.io/BVI-Lernwebsite](https://flametan.github.io/BVI-Lernwebsite/)

---

## Inhalt

| Modul | Themen | Lernkarten |
|---|---|---|
| 🔥 GAL Grundlehrgang | 33 | 90 |
| 🎓 SFS Regensburg | 4 | 17 |
| 🏫 HLFS Kassel | 7 | 16 |
| 🧠 IBK Heyrothsberge | 7 | 46 |
| ⚖️ VAk Berlin | 6 | 33 |
| 📊 FeuAK Hamburg | 9 | 60 |
| 🏛️ IdF Münster | 3 | 28 |
| **Gesamt** | **69** | **303** |

---

## Features

- **303 Lernkarten** – 3D-Flip-Animation, Know/Don't-Know-Bewertung, LocalStorage-Persistenz
- **Fallbearbeitung** – 6 juristische Übungsfälle mit 9-Punkte-Schema (Realakt/VA-Differenzierung)
- **Altklausur-Training** – VAk Berlin + FeuAK Hamburg Prüfungsvorbereitung
- **Führungsdienstsimulator** – 4 verzweigte Entscheidungsszenarien mit Scoring
- **Abkürzungsverzeichnis** – Feuerwehr-Fachbegriffe A–Z
- **Volltextsuche** – `Ctrl+K` / `Cmd+K`, Live-Trefferhervorhebung
- **Lesezeichen & Notizen** – Seitenweise, persistiert per LocalStorage
- **Fortschritts-Tracking** – Besuchte Themen mit Badge-Anzeige
- **PWA** – Installierbar, Service Worker mit Offline-Fallback
- **Dark/Light-Mode** – Automatisch per `prefers-color-scheme`

---

## Architektur

```
BVI-Lernwebsite/
├── index.html          # Alle Views (~13.000 Zeilen)
├── css/
│   └── style.css       # Design-System, alle Komponenten
├── js/
│   ├── app.js          # NAV, PROGRESS, SEARCH, FC, SIM, GH, ...
│   └── version.js      # APP_VERSION (mit sw.js synchron halten)
├── sw.js               # Service Worker (Network-first für Core-Assets)
├── manifest.json       # PWA-Manifest
└── icons/
    ├── icon-192.svg
    └── icon-512.svg
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

Aktuelle Version: **2.19.7**  
`js/version.js` und `sw.js` müssen immer synchron gehalten werden.

```javascript
// js/version.js
const APP_VERSION = '2.19.7';

// sw.js (erste Zeile)
const APP_VERSION = '2.19.7'; // keep in sync with js/version.js
```

---

## Lizenz

Privates Lernprojekt – nicht zur kommerziellen Nutzung.
