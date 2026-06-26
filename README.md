# [B VI – Lernwebsite für den höheren feuerwehrtechnischen Dienst](https://flametan.github.io/BVI-Lernwebsite/)

> **Prüfungsvorbereitung für den B VI-Lehrgang** (höherer feuerwehrtechnischer Dienst)  
> Fachlich tiefgründige Wissensdatenbank zu GAL, SFS Regensburg, HLFS Kassel, IBK Heyrothsberge, VAk Berlin, FeuAK Hamburg und IdF Münster.

---

## Projektüberblick

| Eigenschaft | Wert |
|---|---|
| **Architektur** | Single-Page-App (SPA), kein Build-Schritt nötig |
| **Dateien** | `index.html` (12.246 Zeilen), `css/style.css` (437 Zeilen), `js/app.js` (~1.390 Zeilen) |
| **Sprache** | Deutsch |
| **GitHub-Repo** | `flametan/BVI-Lernwebsite` |
| **Live-URL** | [https://flametan.github.io/BVI-Lernwebsite/](https://flametan.github.io/BVI-Lernwebsite/) |
| **Deployment** | GitHub Pages (statisch, automatisch beim Push auf `main`) |

---

## Features

- **GAL Grundlehrgang** – 33 vollständige Lernthemen mit maximaler Informationstiefe (Gesetzesparagraphen, Formeln, Einsatztaktiken)
- **SFS Regensburg** – 4 Unterthemen (Taktik/FwDV, Methodik, Rechtsgrundlagen, ABC)
- **HLFS Kassel** – 7 Unterthemen (Führungsvorgang, GABC, Vorbeugen, MANV, Tunnel, Zug-/Verbandsführer, Stab)
- **IBK Heyrothsberge** – 7 Unterthemen (TA, Konflikt, Stress, PSNV, BGM, PM, Zeitmanagement)
- **VAk Berlin** – 6 Unterthemen (Juristisches Denken, Verwaltungsrecht, Staatsrecht, Einsatzrecht, Dienstrecht, Lernzusammenfassung)
- **FeuAK Hamburg** – 8 Unterthemen (VWL, BWL, Haushalt, Vergabe, Rechnungswesen, PM, Bedarfsplanung, Prüfungsleistung)
- **IdF Münster** – 3 Unterthemen (Vorbeugender Brandschutz, Stabsarbeit, Presse- & Öffentlichkeitsarbeit)
- **271 Karteikarten** (Flashcards) – GAL, SFS, HLFS, IBK, VAk, FeuAK, IdF; 3D-Flip-Animation, dynamische Kartenhöhe, persistenter Lernstand
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
├── index.html        # Alle Views (12.246 Zeilen)
├── css/
│   └── style.css     # Design-System, alle Komponenten (437 Zeilen)
└── js/
    └── app.js        # NAV, PROGRESS, SEARCH, FC, SIM, GH (~1.390 Zeilen)
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
  // GAL Grundlehrgang (33 Themen)
  'v-gal',
  'v-gal-organisation', 'v-gal-brandlehre', 'v-gal-fahrzeuge', 'v-gal-einsatz',
  'v-gal-atemgifte', 'v-gal-atemschutz', 'v-gal-vb', 'v-gal-loeschlehre',
  'v-gal-loeschmittel-schaum', 'v-gal-loeschwasserversorgung',
  'v-gal-beamtenrecht', 'v-gal-beihilferecht', 'v-gal-brandbekaempfung',
  'v-gal-einsatztechnik', 'v-gal-erstehilfe', 'v-gal-grundlagen', 'v-gal-fahrzeugnormung',
  'v-gal-fuehrung', 'v-gal-fwdven', 'v-gal-gabc', 'v-gal-geraetepruefung',
  'v-gal-hbkg', 'v-gal-kartenkunde', 'v-gal-knoten', 'v-gal-staatsbuerger',
  'v-gal-th-verkehr', 'v-gal-leitern', 'v-gal-uvv', 'v-gal-waermebildkamera',
  'v-gal-armaturen', 'v-gal-maschinist', 'v-gal-psa', 'v-gal-personalvertretungsrecht',
  // SFS Regensburg
  'v-sfs', 'v-sfs-fwdv3', 'v-sfs-methodik', 'v-sfs-rechtsgrundlagen', 'v-sfs-abc',
  // HLFS Kassel
  'v-hlfs', 'v-hlfs-fuehrungsvorgang', 'v-hlfs-gabc', 'v-hlfs-vb',
  'v-hlfs-manv', 'v-hlfs-tunnel', 'v-hlfs-zugfuehrer', 'v-hlfs-stab',
  // IBK Heyrothsberge
  'v-ibk', 'v-ibk-ta', 'v-ibk-konflikt', 'v-ibk-stress',
  'v-ibk-psnv', 'v-ibk-bgm', 'v-ibk-pm', 'v-ibk-zeit',
  // VAk Berlin
  'v-vak', 'v-vak-lernzusammenfassung', 'v-vak-jur-denken',
  'v-vak-verwaltungsrecht', 'v-vak-staatsrecht', 'v-vak-einsatzrecht', 'v-vak-dienstrecht',
  // FeuAK Hamburg
  'v-feuak', 'v-feuak-vwl', 'v-feuak-bwl', 'v-feuak-haushalt', 'v-feuak-vergabe',
  'v-feuak-rechnungswesen', 'v-feuak-pm', 'v-feuak-bedarfsplanung', 'v-feuak-pruefung',
  // IdF Münster
  'v-idf', 'v-idf-brandschutz', 'v-idf-stab', 'v-idf-presse',
  // Sonderfunktionen
  'v-simulator', 'v-flashcards', 'v-vorschlaege'
];
```

---

## Inhaltsstruktur (alle Views)

### GAL Grundlehrgang (`v-gal` → 33 Unterthemen)

| Nr. | View-ID | Thema | Schlüsselinhalte |
|-----|---------|-------|-----------------|
| 01 | `v-gal-organisation` | Organisation der Feuerwehr | BF/FF/WF/Pflichtfw, Laufbahngruppen A7–B4, HBKG §§ 10–19, Behördenstruktur, HiOrg |
| 02 | `v-gal-brandlehre` | Brandlehre & Löschmittel | Brandtetraeder, Klassen A–F (DIN EN 2), Flash-Over/Backdraft/BLEVE, Stefan-Boltzmann-Gesetz |
| 03 | `v-gal-fahrzeuge` | Fahrzeug- & Gerätekunde | Normfahrzeuge (DIN 14530/EN 1846), FPN 10-1000/2000, DLK 23-12, Normbeladung |
| 04 | `v-gal-einsatz` | Einsatzgrundlagen & FwDV | Einsatzprinzipien, Truppgrundsatz, FwDV-System (1–500), Gruppenfunktionen |
| 05 | `v-gal-atemgifte` | Atemgifte | 3 Wirkungsgruppen (erstickend/reizend/giftig), CO/HCN-Physiologie, Brandrauch, Konzentrationseinheiten ppm/mg·m⁻³ |
| 06 | `v-gal-atemschutz` | Atemschutz | PA-Typen, Atemluftberechnung (1.800 Nl), Kehrtpunkt, FwDV 7, G26 |
| 07 | `v-gal-vb` | Vorbeugender Brandschutz | §14 HBO-Schutzziele, Gebäudeklassen 1–5, Feuerwiderstandsklassen, Brandwände, Rettungswege, Flächen für die FW |
| 08 | `v-gal-loeschlehre` | Löschlehre | Löscheffekte, Strahlformen, Löschwasser-Einsatzgrenzen, Löschpulver, CO₂, Halon |
| 09 | `v-gal-loeschmittel-schaum` | Löschmittel Schaum | Schaumbestandteile, Verschäumungszahlen (NS/MS/HS), AFFF/AR-AFFF/PFAS, Einsatzbereiche |
| 10 | `v-gal-loeschwasserversorgung` | Löschwasserversorgung | Grundschutz/Objektschutz, Rohrnetztypen, Hydranten (Unter-/Überflur), Steigleitungen, unabhängige LWV |
| 11 | `v-gal-beamtenrecht` | Beamtenrecht | BeamtStG §§ 33–37, Beamtenarten, Besoldungstabelle, §42a BBesO Feuerwehrzulage |
| 12 | `v-gal-beihilferecht` | Beihilferecht | BBhV §§ 10–26, Beihilfesätze 50/70/80 %, Kostendämpfungspauschale, PKV/GKV |
| 13 | `v-gal-brandbekaempfung` | Brandbekämpfung | Innen-/Außenangriff, 3D-Löschangriff, HSR-Modi, Druckbelüftung, Sonderbrände |
| 14 | `v-gal-einsatztechnik` | Einsatztechnik | Schlauchtypen, Δp = R·L·Q², Armaturen, Schaummittel/PFAS, Bernoulli |
| 15 | `v-gal-erstehilfe` | Erste Hilfe | ABCDE-Schema, CPR (ERC 2021), AED, Schockformen, Verbrennung/9er-Regel, Parkland |
| 16 | `v-gal-grundlagen` | Naturwiss. Grundlagen | Physik (Druck, Bernoulli), Verbrennungschemie, Baustoffklassen EN 13501, Elektrotechnik |
| 17 | `v-gal-fahrzeugnormung` | Fahrzeugnormung | DIN EN 1846 Klassifizierung, Typbezeichnung, Prüffristen, WLF/AB-System |
| 18 | `v-gal-fuehrung` | Führung | Führungsstile (Lewin/Hersey-Blanchard), Schulz von Thun, Tuckman-Phasen |
| 19 | `v-gal-fwdven` | FwDVen – Überblick | Alle FwDV 1–500, Rechtliche Stellung (AFKzV/IMK), Verhältnis zu DIN/EN/DGUV |
| 20 | `v-gal-gabc` | G-ABC Lehrgang | GHS (9 Piktogramme), ADR-Klassen 1–9, Kemler-Nummern, GAMS, KS 1–4, Dekon P/G/V |
| 21 | `v-gal-geraetepruefung` | Geräteprüfung | DGUV V 49/50, Prüftabelle 9 Gerätearten, Befähigte Person vs. Sachkundiger |
| 22 | `v-gal-hbkg` | HBKG Hessen | §§ 1–70 paragraphengenau, §61 mit 12 Kostenersatz-Fallgruppen, KatS §§ 20–29 |
| 23 | `v-gal-kartenkunde` | Kartenkunde | TK 25/50, UTM (32U/33U), MGRS, GNSS/SBAS, Kreuzpeilung, Orientierung ohne GPS |
| 24 | `v-gal-knoten` | Knoten, Stiche & Bunde | Achtknoten/Mastwurf/Pfahlstich, Knotenwirkungsgrade, Prüfregeln |
| 25 | `v-gal-staatsbuerger` | Staatsbürgerkunde | GG Art. 1–33, Staatsorgane, Gewaltenteilung, Föderalismus, Feuerwehr im Staatsaufbau |
| 26 | `v-gal-th-verkehr` | TH Verkehrsunfall | Hydraulisches Rettungsgerät, E-Fahrzeuge (HV/Thermal Runaway), Tramcar |
| 27 | `v-gal-leitern` | Tragbare Leitern | Leiternarten (DIN 14094), Aufstellwinkel 65–75°, Fußsicherung, Prüffristen |
| 28 | `v-gal-uvv` | UVV – Unfallverhütung | ArbSchG §5, DGUV V 1/49/50, PSA-Normen (EN 469/443/659), BK-Recht |
| 29 | `v-gal-waermebildkamera` | Wärmebildkamera | LWIR-Physik (Wien/Stefan-Boltzmann), Emissionsgrade, Glasbarriere, Thermal Runaway |
| 30 | `v-gal-armaturen` | Wasserführende Armaturen | Entnahme-/Fortleitungs-/Abgabearmaturen, Schlauchtypen, Kupplungen, Hohlstrahlrohr |
| 31 | `v-gal-maschinist` | Maschinistendienst | Löschfahrzeugtypen, FLKP, Inbetriebnahme, Pumpenprüfung, Wasserförderung über lange Strecken |
| 32 | `v-gal-psa` | Persönliche Schutzausrüstung | Mindestschutzausrüstung nach FwDV 1, Schutzanzugklassen, Normen EN 469/443/659 |
| 33 | `v-gal-personalvertretungsrecht` | Personalvertretungsrecht | HPVG, §38 Freistellungsregelungen, Zusammensetzung des Personalrats |

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

### VAk Berlin (`v-vak` → 6 Unterthemen)

| View-ID | Thema | Schlüsselinhalte |
|---------|-------|-----------------|
| `v-vak-lernzusammenfassung` | Lernzusammenfassung | Übergreifende Zusammenfassung aller VAk-Themen |
| `v-vak-jur-denken` | Juristisches Denken | Öffentliches Recht vs. Privatrecht, Subsumtionstechnik, Auslegungsmethoden |
| `v-vak-verwaltungsrecht` | Allgemeines Verwaltungsrecht | VwVfG, Verwaltungsakt (§35), Bestandskraft, Widerspruch/Klage |
| `v-vak-staatsrecht` | Staatsrecht | GG-Grundstruktur, Grundrechte, Staatszielbestimmungen, Bundesstaatsprinzip |
| `v-vak-einsatzrecht` | Einsatzrecht | Polizei- & Ordnungsrecht, Feuerwehrrecht, Amtshilfe (Art. 35 GG) |
| `v-vak-dienstrecht` | Öffentliches Dienstrecht | BeamtStG, Laufbahnrecht, Disziplinarrecht, Personalvertretung |

### FeuAK Hamburg (`v-feuak` → 8 Unterthemen)

| View-ID | Thema | Schlüsselinhalte |
|---------|-------|-----------------|
| `v-feuak-vwl` | VWL | Mikro-/Makroökonomie, Marktversagen, öffentliche Güter, Konjunkturzyklus |
| `v-feuak-bwl` | BWL | Organisationsformen, Controlling, Kostenrechnung, Wirtschaftlichkeitsprinzip |
| `v-feuak-haushalt` | Haushaltsrecht | Kameralismus vs. Doppik, Haushaltsgrundsätze, Deckungsprinzip |
| `v-feuak-vergabe` | Vergaberecht | UVgO/VgV, Schwellenwerte, nationale vs. EU-weite Ausschreibung |
| `v-feuak-rechnungswesen` | Rechnungswesen | Doppelte Buchführung, Bilanz, GuV, Kostenarten/-stellen/-träger |
| `v-feuak-pm` | Projektmanagement / Strat. Management | SMART, Stakeholder, kritischer Pfad, BSC, Strategieprozess |
| `v-feuak-bedarfsplanung` | Bedarfsplanung | Qualitäts-/Quantitäts-/Zeitplanung, Risikoanalyse, Schutzzielerreichung |
| `v-feuak-pruefung` | Prüfungsleistung Hamburg | Zusammenfassung aller FeuAK-Prüfungsthemen |

### IdF Münster (`v-idf` → 3 Unterthemen)

| View-ID | Thema | Schlüsselinhalte |
|---------|-------|-----------------|
| `v-idf-brandschutz` | Vorbeugender Brandschutz | §14 MBO-Schutzziele, Sonderbauvorschriften, bautechnische Begriffe |
| `v-idf-stab` | Stabsarbeit | S1–S6-Funktion, Stabsarbeitsprozess, TEL-Struktur |
| `v-idf-presse` | Presse- & Öffentlichkeitsarbeit | Krisenkommunikation, 30-70-100-Regel, Social Media, Pressekonferenz |

---

## Karteikarten (Flashcards)

**271 Karteikarten** gesamt – 3D-Flip-Animation, dynamische Kartenhöhe (mobile-optimiert), Know/Don't-Know-Bewertung, LocalStorage-Persistenz.

| Kategorie | IDs | Anzahl |
|-----------|-----|--------|
| GAL (alle 33 Themen) | g01–g90 | 90 |
| SFS · Taktik/Methodik/Recht | f01–f17 | 17 |
| HLFS · Führung/GABC/MANV/Stab/Tunnel/Vorbeugen | f18–f33 | 16 |
| IBK · TA/Konflikt/Stress/PSNV/BGM/PM/Zeit | f34–f79 | 46 |
| VAk Berlin | v01–v33 | 33 |
| FeuAK Hamburg | h01–h41 | 41 |
| IdF Münster | i01–i28 | 28 |

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
.acc-list / .acc-item           – Accordion (details/summary-basiert)
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

## Changelog

### v5.0 – aktuell
- ✅ **VAk Berlin** – 6 vollständige Unterthemen (Jur. Denken, VwR, Staatsrecht, Einsatzrecht, Dienstrecht, Lernzusammenfassung) mit 33 Karteikarten (v01–v33)
- ✅ **FeuAK Hamburg** – 8 vollständige Unterthemen (VWL, BWL, Haushalt, Vergabe, Rechnungswesen, PM, Bedarfsplanung, Prüfungsleistung) mit 41 Karteikarten (h01–h41)
- ✅ **IdF Münster** – 3 vollständige Unterthemen (Vorbeugender Brandschutz, Stabsarbeit, Presse) mit 28 Karteikarten (i01–i28)
- ✅ **GAL-Erweiterung** auf 33 Unterthemen (+9 neue: Atemgifte, Vorbeugender Brandschutz, Löschlehre, Löschmittel Schaum, Löschwasserversorgung, Armaturen, Maschinistendienst, PSA, Personalvertretungsrecht)
- ✅ **90 neue GAL-Karteikarten** (g01–g90) → 271 Karteikarten gesamt
- ✅ **Accordion-Darstellung** für 6 weitere GAL-Views (Organisation, Atemschutz, Fahrzeugnormung, Führung, Knoten, Staatsbürgerkunde)
- ✅ **Dynamische Kartenhöhe** – Flashcards passen sich mobilfreundlich dem Inhalt an (`scrollHeight`-basiert, max. 72 vh)
- ✅ `index.html` auf 12.246 Zeilen erweitert

### v4.0
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
