# [B VI – Lernwebsite für den höheren feuerwehrtechnischen Dienst](https://flametan.github.io/BVI-Lernwebsite/)

> **Prüfungsvorbereitung für den B VI-Lehrgang** (höherer feuerwehrtechnischer Dienst)  
> Fachlich tiefgründige Wissensdatenbank zu GAL, SFS Regensburg, HLFS Kassel und IBK Heyrothsberge.

---

## Projektüberblick

| Eigenschaft | Wert |
|---|---|
| **Architektur** | Single-Page-App (SPA), kein Build-Schritt nötig |
| **Dateien** | `index.html` (6.272 Zeilen), `css/style.css` (404 Zeilen), `js/app.js` (~1.200 Zeilen) |
| **Sprache** | Deutsch |
| **GitHub-Repo** | `flametan/BVI-Lernwebsite` |
| **Live-URL** | [https://flametan.github.io/BVI-Lernwebsite/](https://flametan.github.io/BVI-Lernwebsite/) |
| **Deployment** | GitHub Pages (statisch, automatisch beim Push auf `main`) |

---

## Features

- **GAL Grundlehrgang** – 24 vollständige Lernthemen mit maximaler Informationstiefe (Gesetzesparagraphen, Formeln, Einsatztaktiken)
- **SFS Regensburg** – 4 Unterthemen (Taktik/FwDV, Methodik, Rechtsgrundlagen, ABC)
- **HLFS Kassel** – 7 Unterthemen (Führungsvorgang, GABC, Vorbeugen, MANV, Tunnel, Zug-/Verbandsführer, Stab)
- **IBK Heyrothsberge** – 7 Unterthemen (TA, Konflikt, Stress, PSNV, BGM, PM, Zeitmanagement)
- **121 Karteikarten** (Flashcards) – 61 SFS/HLFS/IBK + 60 GAL, mit 3D-Flip-Animation und persistentem Lernstand
- **Fortschritts-Tracking** – Besuchte Themen werden per LocalStorage gespeichert; Badge-Anzeige auf Modul-Tiles
- **Volltextsuche** – Ctrl+K öffnet Suchoverlay mit Live-Trefferhervorhebung
- **Führungsdienstsimulator** – 4 verzweigte Entscheidungsszenarien mit Scoring
- **Floating Back-Button** – position:fixed, mobilfreundlich
- **Vorschlagswesen** – GitHub Issues API (Fine-grained PAT)

---

## Technischer Stack

| Bereich | Technologie |
|---|---|
| Framework | Vanilla HTML/CSS/JS (kein Framework, kein Build) |
| Fonts | Google Fonts: Cormorant Garamond, DM Sans, DM Mono |
| Icons / Grafiken | Inline SVG |
| Externe API | GitHub Issues API (Vorschlagswesen) |
| Persistenz | LocalStorage (Fortschritt, Karteikarten-Lernstand) |
| Hosting | GitHub Pages |

---

## Dateistruktur

```
BVI-Lernwebsite/
├── index.html        # Alle Views (6.272 Zeilen)
├── css/
│   └── style.css     # Design-System, alle Komponenten (404 Zeilen)
└── js/
    └── app.js        # NAV, PROGRESS, SEARCH, FC, SIM, GH (~1.200 Zeilen)
```

---

## Design System – „Higher Service Style"

```css
/* Primärfarben */
--c-bg:      #080F1C   /* Hintergrund (fast schwarz) */
--c-navy:    #0A192F   /* Dunkelblau (Primär) */
--c-gold:    #C9A84C   /* Gold (Akzent, Headlines, Punkte) */
--c-red:     #A50000   /* Dunkelrot (Warnungen, CTA-Buttons) */

/* Sekundärfarben */
--c-ok:      #2A7A52   /* Grün (OK-Status) */
--c-warn:    #B07320   /* Amber (Warnhinweis) */
--c-err:     #8B1A1A   /* Dunkelrot (Fehler) */
--c-blue:    #3A7FD4   /* Blau (Info-Hinweise) */
```

**Hintergrundgitter:** Feines Gold-Raster (25px × 25px, opacity 0.025) als `body::before`.  
**Glassmorphismus:** `.glass`-Klassen mit `backdrop-filter: blur(12px)`.

---

## Architektur: Single-Page-App (View-Switching)

Die App hat **keine Routen / URLs**. Navigation erfolgt via JavaScript durch Ein-/Ausblenden von `div.view`-Containern.

### NAV-Engine

```javascript
NAV.go(id, label)   // Navigiere zu View, push auf Stack
NAV.back()          // Zurück (pop Stack)
NAV.home()          // Zur Startseite (Stack leeren)
NAV.jumpTo(idx)     // Breadcrumb-Sprung
```

### Vollständiges Array aller View-IDs (`js/app.js`, Zeile 7)

```javascript
const ALL = [
  'v-home',
  // GAL Grundlehrgang (24 Themen)
  'v-gal',
  'v-gal-organisation', 'v-gal-brandlehre', 'v-gal-fahrzeuge', 'v-gal-einsatz',
  'v-gal-atemschutz', 'v-gal-beamtenrecht', 'v-gal-beihilferecht', 'v-gal-brandbekaempfung',
  'v-gal-einsatztechnik', 'v-gal-erstehilfe', 'v-gal-grundlagen', 'v-gal-fahrzeugnormung',
  'v-gal-fuehrung', 'v-gal-fwdven', 'v-gal-gabc', 'v-gal-geraetepruefung',
  'v-gal-hbkg', 'v-gal-kartenkunde', 'v-gal-knoten', 'v-gal-staatsbuerger',
  'v-gal-th-verkehr', 'v-gal-leitern', 'v-gal-uvv', 'v-gal-waermebildkamera',
  // SFS Regensburg
  'v-sfs', 'v-sfs-fwdv3', 'v-sfs-methodik', 'v-sfs-rechtsgrundlagen', 'v-sfs-abc',
  // HLFS Kassel
  'v-hlfs', 'v-hlfs-fuehrungsvorgang', 'v-hlfs-gabc', 'v-hlfs-vb',
  'v-hlfs-manv', 'v-hlfs-tunnel', 'v-hlfs-zugfuehrer', 'v-hlfs-stab',
  // IBK Heyrothsberge
  'v-ibk', 'v-ibk-ta', 'v-ibk-konflikt', 'v-ibk-stress',
  'v-ibk-psnv', 'v-ibk-bgm', 'v-ibk-pm', 'v-ibk-zeit',
  // Platzhalter
  'v-vak', 'v-feuak', 'v-idf',
  // Sonderfunktionen
  'v-simulator', 'v-flashcards', 'v-vorschlaege'
];
```

---

## Inhaltsstruktur (alle Views)

### GAL Grundlehrgang (`v-gal` → 24 Unterthemen)

| Nr. | View-ID | Thema | Schlüsselinhalte |
|-----|---------|-------|-----------------|
| 01 | `v-gal-organisation` | Organisation der Feuerwehr | BF/FF/WF/Pflichtfw, Laufbahngruppen A7–B4, HBKG §§ 10–19, Behördenstruktur, HiOrg |
| 02 | `v-gal-brandlehre` | Brandlehre & Löschmittel | Brandtetraeder, Klassen A–F (DIN EN 2), Flash-Over/Backdraft/BLEVE, Stefan-Boltzmann-Gesetz |
| 03 | `v-gal-fahrzeuge` | Fahrzeug- & Gerätekunde | Normfahrzeuge (DIN 14530/EN 1846), FPN 10-1000/2000, DLK 23-12, Normbeladung |
| 04 | `v-gal-einsatz` | Einsatzgrundlagen & FwDV | Einsatzprinzipien, Truppgrundsatz, FwDV-System (1–500), Gruppenfunktionen |
| 05 | `v-gal-atemschutz` | Atemschutz | PA-Typen, Atemluftberechnung (1.800 Nl), Kehrtpunkt, FwDV 7, CO/HCN-Physiologie, G26 |
| 06 | `v-gal-beamtenrecht` | Beamtenrecht | BeamtStG §§ 33–37, Beamtenarten, Besoldungstabelle, §42a BBesO Feuerwehrzulage |
| 07 | `v-gal-beihilferecht` | Beihilferecht | BBhV §§ 10–26, Beihilfesätze 50/70/80 %, Kostendämpfungspauschale, PKV/GKV |
| 08 | `v-gal-brandbekaempfung` | Brandbekämpfung | Innen-/Außenangriff, 3D-Löschangriff, HSR-Modi, Druckbelüftung, Sonderbrände |
| 09 | `v-gal-einsatztechnik` | Einsatztechnik | Schlauchtypen, Δp = R·L·Q², Armaturen, Schaummittel/PFAS, Bernoulli |
| 10 | `v-gal-erstehilfe` | Erste Hilfe | ABCDE-Schema, CPR (ERC 2021), AED, Schockformen, Verbrennung/9er-Regel, Parkland |
| 11 | `v-gal-grundlagen` | Naturwiss. Grundlagen | Physik (Druck, Bernoulli), Verbrennungschemie, Baustoffklassen EN 13501, Elektrotechnik |
| 12 | `v-gal-fahrzeugnormung` | Fahrzeugnormung | DIN EN 1846 Klassifizierung, Typbezeichnung, Prüffristen, WLF/AB-System |
| 13 | `v-gal-fuehrung` | Führung | Führungsstile (Lewin/Hersey-Blanchard), Schulz von Thun, Tuckman-Phasen |
| 14 | `v-gal-fwdven` | FwDVen – Überblick | Alle FwDV 1–500, Rechtliche Stellung (AFKzV/IMK), Verhältnis zu DIN/EN/DGUV |
| 15 | `v-gal-gabc` | G-ABC Lehrgang | GHS (9 Piktogramme), ADR-Klassen 1–9, Kemler-Nummern, GAMS, KS 1–4, Dekon P/G/V |
| 16 | `v-gal-geraetepruefung` | Geräteprüfung | DGUV V 49/50, Prüftabelle 9 Gerätearten, Befähigte Person vs. Sachkundiger |
| 17 | `v-gal-hbkg` | HBKG Hessen | §§ 1–70 paragraphengenau, §61 mit 12 Kostenersatz-Fallgruppen, KatS §§ 20–29 |
| 18 | `v-gal-kartenkunde` | Kartenkunde | TK 25/50, UTM (32U/33U), MGRS, GNSS/SBAS, Kreuzpeilung, Orientierung ohne GPS |
| 19 | `v-gal-knoten` | Knoten, Stiche & Bunde | Achtknoten/Mastwurf/Pfahlstich, Knotenwirkungsgrade, Prüfregeln |
| 20 | `v-gal-staatsbuerger` | Staatsbürgerkunde | GG Art. 1–33, Staatsorgane, Gewaltenteilung, Föderalismus, Feuerwehr im Staatsaufbau |
| 21 | `v-gal-th-verkehr` | TH Verkehrsunfall | Hydraulisches Rettungsgerät, E-Fahrzeuge (HV/Thermal Runaway), Tramcar |
| 22 | `v-gal-leitern` | Tragbare Leitern | Leiternarten (DIN 14094), Aufstellwinkel 65–75°, Fußsicherung, Prüffristen |
| 23 | `v-gal-uvv` | UVV – Unfallverhütung | ArbSchG §5, DGUV V 1/49/50, PSA-Normen (EN 469/443/659), BK-Recht |
| 24 | `v-gal-waermebildkamera` | Wärmebildkamera | LWIR-Physik (Wien/Stefan-Boltzmann), Emissionsgrade, Glasbarriere, Thermal Runaway |

### SFS Regensburg (`v-sfs` → 4 Unterthemen)

| View-ID | Thema | Schlüsselinhalte |
|---------|-------|-----------------|
| `v-sfs-fwdv3` | Führung & Taktik | FwDV 3/100, Führungskreislauf, 4A-C-4E Gefahrenmatrix, MELDEN-Schema |
| `v-sfs-methodik` | Methodik & Didaktik | Bloom-Taxonomie (6 Stufen), AVIVA-Modell, 4-Stufen-Methode, Lernziele, UVP |
| `v-sfs-rechtsgrundlagen` | Rechtsgrundlagen | Normenpyramide, Muss/Soll/Kann, Einsatzleitung kraft Gesetz |
| `v-sfs-abc` | Geräte, ABC & Atemschutz | Rettungsgeräte, GAMS-Regel, Körperschutzformen, Dekon-Stufen |

### HLFS Kassel (`v-hlfs` → 7 Unterthemen)

| View-ID | Thema | Schlüsselinhalte |
|---------|-------|-----------------|
| `v-hlfs-fuehrungsvorgang` | Führungsvorgang | SVG-Kreislauf, 4 Erkundungsphasen, EIMER-Regel, 8 Beurteilungsfragen |
| `v-hlfs-gabc` | GABC Führen | Gefahrengruppen I–III, Absperrgrenzen, Zoneneinteilung, Spezialkräfte |
| `v-hlfs-vb` | Vorbeugender Brandschutz | 3 Säulen, Feuerwiderstandsklassen F30–F120, Brandschutzordnung DIN 14096 |
| `v-hlfs-manv` | MANV & OLRD | mSTaRT-Algorithmus, SK I–IV, LNA/OLRD-Struktur |
| `v-hlfs-tunnel` | Tunnelseminar | Besondere Gefährdungen, Ventilationskonzepte, Taktische Grundsätze |
| `v-hlfs-zugfuehrer` | Zug- & Verbandsführer | Führungsstufen A–D, TETRA TMO vs. DMO, Taktische Zeichen |
| `v-hlfs-stab` | Bildung eines Stabs | S1–S6 Aufgaben, TEL-Struktur, Verwaltungsstab, Führungsstufen A–D |

### IBK Heyrothsberge (`v-ibk` → 7 Unterthemen)

| View-ID | Thema | Schlüsselinhalte |
|---------|-------|-----------------|
| `v-ibk-ta` | Transaktionsanalyse | Ich-Zustände, Transaktionstypen, 4 Lebensgrundpositionen, Antreiber |
| `v-ibk-konflikt` | Konfliktmanagement | Glasl 9-Stufen, Karpman-Dreieck, Schulz von Thun, Watzlawick 5 Axiome |
| `v-ibk-stress` | Stresstheorie | S-O-R-K-C, Flow-Kanal (Csikszentmihalyi), JD-R-Modell |
| `v-ibk-psnv` | PSNV | Demobilisation, BELLA-Konzept, Einsatznachsorge |
| `v-ibk-bgm` | BGM | Salutogenese (SOC), PERMA-H, 3 Säulen BGM, Burnout-Phasen |
| `v-ibk-pm` | Projektmanagement | SMART-Ziele, CPM/kritischer Pfad, Stakeholder-Mapping, Risikomatrix |
| `v-ibk-zeit` | Zeitmanagement | Eisenhower-Matrix, ALPEN-Methode, Pareto, Deep Work |

---

## Karteikarten (Flashcards)

**121 Karteikarten** gesamt – 3D-Flip-Animation, Know/Don't-Know-Bewertung, LocalStorage-Persistenz.

| Kategorie | IDs | Anzahl |
|-----------|-----|--------|
| GAL (alle 24 Themen) | g01–g60 | 60 |
| SFS · Taktik/Methodik/Recht | f01–f17 | 17 |
| HLFS · Führung/GABC/MANV/Stab/Tunnel/Vorbeugen | f18–f33 | 16 |
| IBK · TA/Konflikt/Stress/PSNV/BGM/PM/Zeit | f34–f61 | 28 |

---

## CSS-Komponenten-Bibliothek

### Layout-Container
```
.view / .detail-view    – Screen-Container
.page-hero / .phi / .pc – Seitenkopf und Content-Bereich
```

### Inhalts-Komponenten
```
.info-card / .info-card-title   – Glasmorphismus-Karte mit Header
.def-box / .def-box-label       – Definition-Box (goldener Rand)
.hint                           – Hinweis-Box (.blue-h / .err-h)
.step-stack / .step-item / .step-letter  – Schrittfolge
.sec-h / .sec-div               – Abschnittsüberschrift / Trenner
```

### Raster & Tabellen
```
.cg / .cg-2 / .cg-3   – CSS Grid (auto-fit / 2-spaltig / 3-spaltig)
.dt                    – Datentabelle mit Gold-Header
.badge (.b-ok/.b-w/.b-err)  – Status-Label
```

### Farbpunkte
```
.dot / .dot-r / .dot-b / .dot-ok / .dot-w
```

---

## Neue Views hinzufügen – Schritt-für-Schritt

1. **HTML-View anlegen** in `index.html`
2. **View-ID in `const ALL`** eintragen (`js/app.js`, Zeile 7)
3. **PROGRESS-Gruppe erweitern** (GROUPS-Objekt in `js/app.js`)
4. **VIEW_LABELS erweitern** (SEARCH-Modul in `js/app.js`)
5. **Navigation verlinken** (Topic-Card oder Tile)

---

## Sonderfunktionen

### Führungsdienstsimulator (`v-simulator`)
4 Szenarien: `schmidt`, `ressourcen`, `stab`, `disziplin` – Scoring 0–100 Punkte, verzweigter Entscheidungsbaum.

### Vorschlagswesen (`v-vorschlaege`)
GitHub Issues API – Fine-grained PAT in `GH.token` (`js/app.js`).  
> ⚠️ **Token-Rotation:** GitHub → Settings → Developer Settings → Fine-grained PATs → rotieren und neuen Wert in `js/app.js` eintragen.

---

## Noch ausstehende Module

| Standort | Status | Geplante Inhalte |
|----------|--------|-----------------|
| VAk Berlin | Platzhalter (`v-vak`) | Verwaltungsakademie, Führung im öffentlichen Dienst |
| FeuAK Hamburg | Platzhalter (`v-feuak`) | Feuerwehrakademie Hamburg |
| IdF Münster | Platzhalter (`v-idf`) | Institut der Feuerwehr NRW |

Platzhalter aktivieren: `.tp`-Klasse entfernen, `onclick` hinzufügen, View befüllen, alle 4 JS-Stellen aktualisieren.

---

## Changelog

### v4.0 – aktuell
- ✅ **GAL Grundlehrgang** – alle 24 Themen mit maximaler Informationstiefe vollständig neu geschrieben
- ✅ **60 neue GAL-Karteikarten** (g01–g60) → 121 Karteikarten gesamt
- ✅ `index.html` auf 6.272 Zeilen erweitert

### v3.0 – GAL-Grundmodul & Refactoring
- ✅ GAL-Modul als erstes Tile mit 24 Topic-Cards
- ✅ Code-Refactoring: monolithische HTML-Datei aufgeteilt in `index.html` + `css/style.css` + `js/app.js`
- ✅ Floating Back-Button (Mobile, `position:fixed`)
- ✅ 61 Karteikarten (SFS/HLFS/IBK), Fortschritts-Tracking, Volltextsuche (Ctrl+K)

### v2.0 – HLFS & IBK
- ✅ HLFS Kassel: 7 Unterthemen (Führungsvorgang-SVG, Stab S1–S6, Tunnel, MANV)
- ✅ IBK Heyrothsberge: 7 Unterthemen

### v1.0 – Grundaufbau
- ✅ SPA-Architektur mit NAV-Engine
- ✅ SFS Regensburg: 4 Unterthemen
- ✅ Führungsdienstsimulator, Vorschlagswesen (GitHub Issues API)
