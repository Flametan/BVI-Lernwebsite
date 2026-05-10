# B VI – Lernwebsite für den höheren feuerwehrtechnischen Dienst

> **Für den nächsten Chat:** Diese README beschreibt das Projekt vollständig. Claude kann damit sofort weiterarbeiten, ohne den alten Chatverlauf zu benötigen.

---

## Projektüberblick

**Datei:** `index.html` (single-file SPA, ~3.410 Zeilen, kein Build-Schritt nötig)  
**Zweck:** Prüfungsvorbereitung für den höheren feuerwehrtechnischen Dienst (B VI)  
**Sprache:** Deutsch  
**GitHub-Repo:** `flametan/BVI-Lernwebsite`  
**Deployment:** Direkt als statische HTML-Datei, z. B. über GitHub Pages

---

## Technischer Stack

| Bereich | Technologie |
|---|---|
| Framework | Vanilla HTML/CSS/JS (kein Framework, kein Build) |
| Fonts | Google Fonts: Cormorant Garamond (Display), DM Sans (Body), DM Mono (Code) |
| Icons / Grafiken | Inline SVG (keine externen Bibliotheken) |
| Externe API | GitHub Issues API (Vorschlagswesen) |
| Hosting | Beliebig – reine statische Datei |

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

/* Typografie */
--f-d: 'Cormorant Garamond' (Serif, Überschriften, Seitentitel)
--f-b: 'DM Sans' (Body-Text)
--f-m: 'DM Mono' (Badges, Codes, Nummern)
```

**Hintergrundgitter:** Feines Gold-Raster (25px × 25px, opacity 0.025) als `body::before`.  
**Glassmorphismus:** `.glass`-Klassen mit `backdrop-filter: blur(12px)`.

---

## Architektur: Single-Page-App (View-Switching)

Die App hat **keine Routen / URLs**. Navigation erfolgt via JavaScript durch Ein-/Ausblenden von `div.view`-Containern.

### NAV-Engine (JavaScript)

```javascript
NAV.go(id, label)   // Navigiere zu View, push auf Stack
NAV.back()          // Zurück (pop Stack)
NAV.home()          // Zur Startseite (Stack leeren)
NAV.jumpTo(idx)     // Breadcrumb-Sprung
```

**Stack-Breadcrumb:** Wird im Header automatisch als Breadcrumb angezeigt.  
**Back-Button:** `#back-btn` – wird ausgeblendet wenn Stack leer ist.

### Vollständiges Array aller View-IDs

```javascript
const ALL = [
  'v-home',
  // SFS Regensburg
  'v-sfs', 'v-sfs-fwdv3', 'v-sfs-methodik', 'v-sfs-rechtsgrundlagen', 'v-sfs-abc',
  // HLFS Kassel
  'v-hlfs', 'v-hlfs-fuehrungsvorgang', 'v-hlfs-gabc', 'v-hlfs-vb',
  'v-hlfs-manv', 'v-hlfs-tunnel', 'v-hlfs-zugfuehrer', 'v-hlfs-stab',
  // IBK Heyrothsberge
  'v-ibk', 'v-ibk-ta', 'v-ibk-konflikt', 'v-ibk-stress',
  'v-ibk-psnv', 'v-ibk-bgm', 'v-ibk-pm', 'v-ibk-zeit',
  // Platzhalter (noch nicht implementiert)
  'v-vak', 'v-feuak', 'v-idf',
  // Sonderfunktionen
  'v-simulator', 'v-vorschlaege'
];
```

> **Wichtig:** Bei jedem neuen View muss die ID hier eingetragen werden, sonst wird er beim View-Switch nicht korrekt aus-/eingeblendet.

---

## Inhaltsstruktur (alle Views)

### 🏠 Startseite (`v-home`)
Grid aus 8 Glass-Tiles. Tiles mit Klasse `.tp` sind gesperrt ("In Vorbereitung"). Tiles mit `.ts` haben rotes Farbschema (Simulator). Tile-Klick ruft `NAV.go(id, label)` auf.

---

### 🔵 SFS Regensburg (`v-sfs` → Unterpunkte)

| View-ID | Thema | Schlüsselinhalte |
|---|---|---|
| `v-sfs-fwdv3` | Führung & Taktik | FwDV 3, FwDV 100, Führungskreislauf-SVG, 4A-C-4E Gefahrenmatrix, Befehlsgebung, MELDEN-Schema |
| `v-sfs-methodik` | Methodik & Didaktik | Regelkreis der Ausbildung, Lernziele (3 Bereiche), **Bloom-Taxonomie** (6 Stufen mit Tabelle), AVIVA-Modell, **4-Stufen-Methode** (4 Detailkarten), Feedback, UVP |
| `v-sfs-rechtsgrundlagen` | Rechtsgrundlagen | Normenpyramide-SVG, Muss/Soll/Kann, Einsatzleitung kraft Gesetz/Übernahme/Übertragung, Gefahrenbegriffe (konkrete/Anscheins-/Scheingefahr) |
| `v-sfs-abc` | Geräte, ABC & Atemschutz | Rettungsgeräte, Arbeitsgeräte, FwDV 7 Atemschutz, GAMS-Regel, 4 Körperschutzformen, 3 Dekon-Stufen, A-Referenzwerte Strahlenschutz |

---

### 🔴 HLFS Kassel (`v-hlfs` → Unterpunkte)

| View-ID | Thema | Schlüsselinhalte |
|---|---|---|
| `v-hlfs-fuehrungsvorgang` | **NEU: Führungsvorgang** | Großes 3-Knoten-SVG des Kreislaufs (mit glow), 4 Phasen der Erkundung, AUTO-Regel, **EIMER-Regel**, 8 Fragen der Beurteilung, Taktische Optionen (Verteidigung/Rettung/Angriff/Rückzug), Befehl mit/ohne Bereitstellung, MELDEN, GAMS, Abschließende Maßnahmen |
| `v-hlfs-gabc` | GABC Führen | Gefahrengruppen I–III, 3 Grundprinzipien, **EIMER-Regel als Step-Stack**, **Absperrgrenzen** (50/100/300m, 25mSv/h), Zoneneinteilung (heiß/warm/kalt), Messstrategien, **Spezialkräfte** (TUIS, CBRN, LKA), Ergänzende Maßnahmen |
| `v-hlfs-tunnel` | Tunnelseminar | Besondere Gefährdungen, Taktische Grundsätze (5 Schritte), 3 Ventilationskonzepte |
| `v-hlfs-vb` | Vorbeugender Brandschutz | 3 Säulen (baulich/anlagentechnisch/organisatorisch), Feuerwiderstandsklassen F30–F120, Rettungswege 1./2., Brandschutzordnung DIN 14096 (Teil A/B/C) |
| `v-hlfs-manv` | MANV & OLRD | Definition MANV, mSTaRT-Algorithmus (SK I–IV), Führungsstruktur (ELF/LNA/OLRD), 4-Schritte Organisationsstruktur, Schnittstellentabelle FW/RD |
| `v-hlfs-zugfuehrer` | Zug- & Verbandsführer | Führungsstufen A–D (Tabelle), 2-5-Regel Abschnittsbildung, Aufgaben ZF (4 Karten), Taktische Zeichen, **TETRA Digitalfunk TMO vs. DMO** (Vergleichskarten + Gateway-SVG) |
| `v-hlfs-stab` | **NEU: Bildung eines Stabs** | SVG der 3 Führungskomponenten, Führungsstufen-Tabelle A–D, **S1–S6 Aufgaben** (6 Detailkarten), TEL-Struktur, Verwaltungsstab (KGS/BuMA/SMS/EMS), Abschnittsstruktur |

---

### 🟡 IBK Heyrothsberge (`v-ibk` → Unterpunkte)

| View-ID | Thema | Schlüsselinhalte |
|---|---|---|
| `v-ibk-ta` | Transaktionsanalyse | Ich-Zustände SVG (Eltern-/Erwachsenen-/Kind-Ich), Transaktionstypen (komplementär/gekreuzt/verdeckt), 4 Lebensgrundpositionen, Antreiber (Miniskript) |
| `v-ibk-konflikt` | Konfliktmanagement | Glasl 9-Stufen, Karpman-Dreieck, Schulz von Thun (4-Ohren), Watzlawick 5 Axiome, Mehrabian 7/38/55-Regel, B4-Methode |
| `v-ibk-stress` | Stresstheorie | S-O-R-K-C-Schema, Flow-Kanal (Csikszentmihalyi), Biopsychosoziales Modell, JD-R-Modell |
| `v-ibk-psnv` | PSNV | Alarmierungsformel (~30%), Demobilisation, BELLA-Konzept, Einsatznachsorge |
| `v-ibk-bgm` | BGM | WHO-Definition, 6 Gesundheitsdimensionen, Salutogenese (SOC), PERMA-H (6 Karten + Tabelle), 3 Säulen BGM, Burnout-Phasen, Public-Health-Action-Cycle |
| `v-ibk-pm` | Projektmanagement | SMART-Ziele, CPM/kritischer Pfad, Stakeholder-Mapping, Risikomatrix 2×2, Agiles PM im Stab |
| `v-ibk-zeit` | Zeitmanagement | Eisenhower-Matrix, ALPEN-Methode, Pareto-Prinzip, Eat the Frog, Deep Work, Time-Blocking |

---

### ⚫ Platzhalter-Views (noch nicht implementiert)

- `v-vak` – VAk Berlin (Verwaltungsakademie)
- `v-feuak` – FeuAK Hamburg (Feuerwehrakademie)
- `v-idf` – IdF Münster (Institut der Feuerwehr NRW)

Alle drei zeigen einen `ph-view` Platzhalter-Screen. Tiles haben die Klasse `.tp` (nicht klickbar, gedimmt).

---

### 🎮 Führungsdienstsimulator (`v-simulator`)

Verzweigter Entscheidungsbaum mit 4 Szenarien, Scoring-System (0–100 Punkte).

| Key | Szenario | Thema |
|---|---|---|
| `schmidt` | Konflikt Schmidt / Müller | Generationenkonflikt, TA, Glasl, Schulz von Thun |
| `ressourcen` | Ressourcen-Dilemma | Zwei simultane Großlagen, Priorisierung |
| `stab` | Führungsfehler im Stab | Stabsarbeit, Deeskalation, Watzlawick |
| `disziplin` | Disziplinarischer Grenzfall | Dienstvergehen, Führungsfürsorge, Recht |

**Node-Struktur eines Szenarios:**
```javascript
{
  phase: 1-4,       // Phasenleiste (Analyse/Gespräche/Entscheidung/Maßnahmen)
  title: '',        // Szenentitel
  scene: '',        // HTML-Situationsbeschreibung
  question: '',     // Entscheidungsfrage
  options: [{
    letter: 'A',
    text: '',
    quality: 'good|neutral|bad|restart',
    scoreDelta: ±n,
    feedback: '',   // Konsequenzbeschreibung
    theory: '',     // Theoretische Einordnung (TA, Glasl, etc.)
    next: 'nodeId'
  }],
  isEnd: bool,
  endScore: 'good|neutral|bad'
}
```

**Simulator starten:** `SIM.loadScenario('schmidt')` etc. (aus `sc-card`-Klick-Handler).

---

### 💬 Vorschlagswesen (`v-vorschlaege`)

GitHub Issues API – Vorschläge werden als Issues im Repo gespeichert und können mit 👍/👎 bewertet werden.

**Konfiguration (in JavaScript):**
```javascript
const GH = {
  token: 'github_pat_11CDHYT7A0ic...',  // Fine-grained PAT (Issues: Read & Write)
  owner: 'flametan',
  repo: 'BVI-Lernwebsite',
  label: 'vorschlag',
  base: 'https://api.github.com'
};
```

> ⚠️ **Token-Sicherheit:** Der Token liegt im Klartext im Quellcode. Fine-grained PAT mit minimalen Rechten (nur Issues R/W). Beim Ablauf des Tokens: GitHub → Settings → Developer Settings → Fine-grained Personal Access Tokens → Token rotieren, dann neuen Wert in `GH.token` einsetzen.

**Blacklist:** Das Wort `nukular` ist gesperrt (Regex `/nukular/i`). Einreichung wird blockiert mit Korrekturhinweis. Weitere Patterns können im `BLACKLIST`-Array ergänzt werden:
```javascript
const BLACKLIST = [
  { pattern: /nukular/i, msg: '...' }
  // hier weitere { pattern, msg } Einträge
];
```

---

## CSS-Komponenten-Bibliothek

### Layout-Container
```
.view           – Jeder Screen (display:none/block)
.detail-view    – Screen mit padding-top:58px (Header-Abstand)
.page-hero      – Seitenkopf-Bereich mit Eyebrow/Titel/Lead
.phi            – max-width:900px, horizontaler Padding
.pc             – Haupt-Content-Bereich (max-width:900px, padding-bottom:6rem)
```

### Inhalts-Komponenten
```
.info-card          – Glasmorphismus-Karte (Standard-Inhaltsblock)
.info-card-title    – Karten-Überschrift mit farbenem Punkt (.dot)
.def-box            – Definition-Box mit goldenem linken Rand
.hint               – Hinweis-Box (gold), .hint.blue-h (blau), .hint.err-h (rot)
.step-stack         – Vertikale Schritt-Liste
.step-item          – Einzelner Schritt mit Buchstaben-Indikator
.sec-h              – Abschnittsüberschrift (goldener linker Strich)
.sec-div            – Trennlinie (goldener Farbverlauf)
```

### Raster-System
```
.cg             – CSS Grid, auto-fit, minmax(200px, 1fr)
.cg-2           – 2-spaltig erzwingen
.cg-3           – 3-spaltig erzwingen
.topic-grid     – Themen-Karten-Grid (minmax 220px)
.home-grid      – Startseiten-Kacheln (3-spaltig)
```

### Farbpunkte (Dot-System)
```
.dot            – Gold (Standard)
.dot-r          – Rot
.dot-b          – Blau
.dot-ok         – Grün
.dot-w          – Amber/Warn
```

### Tabellen
```
.dt             – Datentabelle mit Gold-Header und Hover-Zeilen
.badge          – Kleines Label  (.b-ok grün / .b-w amber / .b-err rot)
```

### Buttons & Status
```
.btn-red        – Primär-Button (dunkelrot)
.btn-ghost      – Sekundär-Button (Glas)
.btn-gold       – Gold-Button
.s-ok / .s-err / .s-warn / .s-load  – Status-Messages
.spinner        – Lade-Spinner (CSS-Animation)
```

### Diagramme
```
.diagram-wrap   – Container für SVG-Diagramme (dunkler Hintergrund)
.diagram-caption – Bildunterschrift
```

---

## Neue Views hinzufügen – Schritt-für-Schritt

1. **HTML-View anlegen:**
```html
<div id="v-mein-neuer-view" class="view detail-view">
  <div class="page-hero"><div class="phi">
    <p class="page-eyebrow">Standort · Thema XX</p>
    <h1 class="page-title">Titel <span class="accent">Untertitel</span></h1>
    <p class="page-lead">Kurzbeschreibung des Inhalts.</p>
  </div></div>
  <div class="pc">
    <!-- Inhalt hier -->
  </div>
</div>
```

2. **View-ID in `const ALL` eintragen** (in der JavaScript-Sektion ganz unten):
```javascript
const ALL = [..., 'v-mein-neuer-view', ...];
```

3. **Navigation verlinken** (z. B. in einem `topic-card` auf der Übersichtsseite):
```html
<div class="topic-card" onclick="NAV.go('v-mein-neuer-view','Mein Thema')">
  <div class="tc-num">XX</div>
  <div class="tc-name">Titel</div>
  <div class="tc-sub">Kurzbeschreibung</div>
</div>
```

---

## Terminologie-Regeln

| ❌ Nicht verwenden | ✅ Verwenden |
|---|---|
| „(Klausurrelevant!)" | *(entfernt, wird nicht mehr verwendet)* |
| „Klausurhinweis" | „Hinweis" |

---

## Design-Konventionen

- **Inline-SVG** für alle Diagramme (kein externer Chart-Service)
- **Keine externen JS-Bibliotheken** (außer Google Fonts)
- Sämtliche Farben über CSS-Variablen (nie Hardcoding)
- `--c-gold` für primäre Akzente, `--c-red` für Aktionen/Warnungen
- Neue komplexe Themen: SVG-Diagramm + info-cards + step-stack-Kombination
- Jede neue Unterseite braucht den Header-Back-Button (funktioniert automatisch über die NAV-Engine)

---

## Noch ausstehende Entwicklungen (In Vorbereitung)

| Standort | Status | Geplante Inhalte |
|---|---|---|
| VAk Berlin | Platzhalter (`v-vak`) | Verwaltungsakademie, Führung im öffentlichen Dienst |
| FeuAK Hamburg | Platzhalter (`v-feuak`) | Feuerwehrakademie Hamburg |
| IdF Münster | Platzhalter (`v-idf`) | Institut der Feuerwehr NRW |

Um einen Platzhalter zu aktivieren: Klasse `.tp` vom `glass-tile` entfernen, `onclick`-Handler hinzufügen, View-Inhalt befüllen.

---

## Changelog (letzte Version)

### v3.1 – aktuelle Version
- ✅ Globale Terminologie: `(Klausurrelevant!)` entfernt, `Klausurhinweis` → `Hinweis`
- ✅ **NEU View:** `v-hlfs-fuehrungsvorgang` – vollständiger Führungsvorgang mit SVG-Kreislauf, 4 Erkundungsphasen, EIMER-Regel, 8 Fragen, Befehlsgebung, GAMS
- ✅ **NEU View:** `v-hlfs-stab` – Bildung eines Stabs (S1–S6, TEL, Verwaltungsstab, Führungsstufen A–D)
- ✅ **Erweitert:** `v-hlfs-gabc` – EIMER-Regel Step-Stack, Absperrgrenzen mit Werten, Spezialkräfte, Ergänzende Maßnahmen
- ✅ **Erweitert:** `v-hlfs-zugfuehrer` – TETRA TMO/DMO Gegenüberstellung, Gateway-SVG, Praxishinweise
- ✅ **Erweitert:** `v-sfs-methodik` – Bloom-Taxonomie (6 Stufen + Tabelle), 4-Stufen-Methode mit 4 Detailkarten
- ✅ HLFS-Übersicht um Thema 01 (Führungsvorgang) und 07 (Stab) ergänzt

### v3.0 – Vorversion
- SPA-Architektur mit NAV-Engine
- Führungsdienstsimulator (4 Szenarien)
- GitHub Issues API (Vorschlagswesen)
- IBK-Modul vollständig (TA, Konflikt, Stress, PSNV, BGM, PM, Zeit)
- SFS-Modul vollständig (FwDV 3/100, Methodik, Rechtsgrundlagen, ABC)
- HLFS-Grundmodule (GABC, Tunnel, VB, MANV, Zug-/Verbandsführer)
