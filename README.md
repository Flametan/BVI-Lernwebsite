# B VI – Lernen für den höheren Dienst

> Interaktive Lernplattform zur Prüfungsvorbereitung für den **höheren feuerwehrtechnischen Dienst** (B VI-Lehrgang). Statische Single-Page-Application – kein Backend, kein Build-Schritt, offline-fähig.

[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-0A192F?logo=github)](https://flametan.github.io/BVI-Lernwebsite/)
[![Version](https://img.shields.io/badge/Version-3.0-C9A84C)](https://github.com/flametan/BVI-Lernwebsite)

---

## Inhaltsverzeichnis

- [Überblick](#überblick)
- [Features](#features)
- [Inhaltsstruktur](#inhaltsstruktur)
- [Führungsdienstsimulator](#führungsdienstsimulator)
- [Technische Architektur](#technische-architektur)
- [GitHub Pages Deployment](#github-pages-deployment)
- [GitHub Issues API – Vorschlagswesen](#github-issues-api--vorschlagswesen)
- [Token-Verwaltung & Sicherheitshinweis](#token-verwaltung--sicherheitshinweis)
- [Inhalte erweitern](#inhalte-erweitern)
- [Neues Simulator-Szenario ergänzen](#neues-simulator-szenario-ergänzen)
- [Design-System](#design-system)
- [Browser-Kompatibilität](#browser-kompatibilität)
- [Lizenz](#lizenz)
- [Quellen & Literatur](#quellen--literatur)

---

## Überblick

Die Plattform richtet sich an Führungskräfte der Berufsfeuerwehr, die sich auf den **B VI-Lehrgang** (höherer feuerwehrtechnischer Dienst) vorbereiten. Sie bündelt Lernmaterial aus verschiedenen Ausbildungsstätten in einer einzigen, strukturierten HTML-Datei.

```
Repository:  flametan/BVI-Lernwebsite
Datei:       index.html  (~184 KB · 1 981 Zeilen)
Sprache:     Deutsch
Technologie: Vanilla HTML · CSS · JavaScript  (kein Framework, kein Build-Tool)
Hosting:     GitHub Pages (statisch)
```

---

## Features

| Feature | Beschreibung |
|---|---|
| **14 Views / Sub-Pages** | SPA-Navigation ohne Seitenreload – jede Themenseite ist eine eigene Ansicht |
| **Breadcrumb-Navigation** | Dynamischer Pfad in der Kopfzeile, vollständig klickbar |
| **Zurück-Button** | Erscheint automatisch auf jeder Unterseite, führt zur vorherigen Ebene |
| **Inline-SVG-Diagramme** | Glasl-Treppe, Watzlawick-Axiome, Mehrabian 7-38-55, Flow-Kanal, CPM-Netzplan, Stakeholder-Matrix, Eisenhower-Matrix u. v. m. |
| **Führungsdienstsimulator** | 4 verzweigte Szenarien mit Entscheidungsbaum, Punkte-Score und Theorie-Feedback |
| **Vorschlagswesen** | GitHub Issues API – Einreichen, Anzeigen und Bewerten (👍/👎) von Verbesserungsvorschlägen |
| **Blacklist** | Regelbasierte Eingabesperre beim Einreichen von Vorschlägen |
| **Offline-fähig** | Simulator und alle Lerninhalte funktionieren ohne Internetverbindung |
| **Responsive** | Mobile-first, getestet ab 375 px Viewport-Breite |

---

## Inhaltsstruktur

```
Startseite (v-home)
│
├── IBK Heyrothsberge (v-ibk)
│   ├── 01 · Transaktionsanalyse (v-ibk-ta)
│   │       Ich-Zustände, Transaktionstypen, 4 Grundpositionen, 5 Antreiber (Kahler)
│   │
│   ├── 02 · Konfliktmanagement (v-ibk-konflikt)
│   │       Glasl (9 Stufen), Karpman-Dreieck, Schulz von Thun (4 Seiten),
│   │       Watzlawick (5 Axiome), Mehrabian (7-38-55-Regel), B4-Regel
│   │
│   ├── 03 · Stresstheorie (v-ibk-stress)
│   │       Biopsychosoziales Modell, Flow-Kanal (Csikszentmihalyi, korrigiert),
│   │       S-O-R-K-C-Modell, JD-R-Modell (Bakker & Demerouti)
│   │
│   ├── 04 · PSNV (v-ibk-psnv)
│   │       Alarmierungsformel (~30 %), Demobilisation (3 Schritte), BELLA-Konzept
│   │
│   ├── 05 · BGM (v-ibk-bgm)
│   │       WHO-Definition, 6 Gesundheitsdimensionen, Salutogenese (Antonovsky/SOC),
│   │       Ottawa-Charta 1986, PERMA-H-Modell (Seligman), 3 Säulen BGM,
│   │       Burnout in 5 Phasen, JD-R, EAP, MBSR, Public-Health-Action-Cycle
│   │
│   ├── 06 · Projektmanagement (v-ibk-pm)
│   │       SMART-Ziele, Critical Path Method (CPM), Stakeholder-Mapping,
│   │       Agiles Führen im Stab, Risikomanagement (2×2-Matrix), RACI
│   │
│   └── 07 · Zeitmanagement (v-ibk-zeit)
│           Eisenhower-Matrix, „Eat the Frog" (Tracy), Deep Work (Newport),
│           Zeitblock-System, Pomodoro, ALPEN-Methode, Pareto-Prinzip
│
├── VAk Berlin (v-vak)               ← Platzhalter, in Vorbereitung
├── FeuAK Hamburg (v-feuak)          ← Platzhalter, in Vorbereitung
├── IdF Münster (v-idf)              ← Platzhalter, in Vorbereitung
│
├── Führungsdienstsimulator (v-simulator)
│   └── 4 Szenarien mit verzweigtem Entscheidungsbaum
│
└── Verbesserungsvorschläge (v-vorschlaege)
        GitHub Issues API
```

---

## Führungsdienstsimulator

Der Simulator verwendet einen **hardcodierten Entscheidungsbaum** – kein Backend, kein API-Key erforderlich. Jedes Szenario läuft vollständig im Browser.

### Szenario-Übersicht

| Nr. | Titel | Thema | Theorie-Referenz |
|---|---|---|---|
| 01 | **Konflikt Schmidt / Müller** | Generationenkonflikt, Wertschätzung, RD-Einteilung | Transaktionsanalyse, Schulz von Thun, Glasl, Karpman |
| 02 | **Ressourcen-Dilemma** | Zwei simultane Großlagen, eine Staffel, Zeitdruck | FwDV 3, Priorisierung, Sektorenführung, PSNV |
| 03 | **Führungsfehler im Stab** | S3 vs. Einsatzleiter RD eskalieren während Großschadenslage | Watzlawick (Axiome 1+2), Mehrabian, Rollenklarheit |
| 04 | **Disziplinarischer Grenzfall** | Verdacht Alkohol im Dienst bei langjährigem Mitarbeiter | BEM (§ 84 SGB IX), EAP, Karpman-Retter-Falle, BELLA |

### Knotenstruktur

Jeder Knoten im Entscheidungsbaum ist ein JavaScript-Objekt mit folgendem Schema:

```javascript
'knoten_id': {
  phase: 1,                   // Phasenleiste 1–4
  title: '🔍 Szenentitel',
  scene: `<p>HTML-Beschreibung der Situation…</p>`,
  question: 'Was ist dein erster Schritt?',
  options: [
    {
      letter:     'A',
      text:       'Anzeigetext der Option',
      quality:    'good',       // 'good' | 'neutral' | 'bad' | 'restart'
      scoreDelta: +20,          // Punktveränderung (positiv oder negativ)
      feedback:   'Was passiert als Konsequenz.',
      theory:     '📚 Theoretische Einordnung (TA, Glasl, Watzlawick…)',
      next:       'naechster_knoten_id'
    }
  ],
  // Nur für Endknoten:
  isEnd:    true,
  endScore: 'good'              // 'good' | 'neutral' | 'bad'
}
```

### Score-Berechnung

- **Startwert:** 100 Punkte
- Jede Entscheidung addiert oder subtrahiert den `scoreDelta`-Wert
- **Wertebereich:** 0–100 (wird automatisch geclampt)
- Bei `endScore: 'bad'` wird der angezeigte Score zusätzlich auf maximal 30 begrenzt

---

## Technische Architektur

### Single-File-Architektur

Die gesamte Anwendung besteht aus **einer einzigen HTML-Datei**. Es gibt keinen Build-Schritt, keinen Node.js-Server und keine externen JavaScript-Abhängigkeiten.

```
index.html
├── <style>          CSS Custom Properties + vollständiges Styling (~400 Zeilen)
├── <body>           14 View-Divs (initial alle display:none, außer v-home)
└── <script>
    ├── NAV          Navigations-Engine (View-Stack, Breadcrumb-Verwaltung)
    ├── SCENARIOS    Alle 4 Entscheidungsbäume als verschachteltes JS-Objekt
    ├── SIM          Simulator-Engine (renderNode, pick, renderEnd, syncScore)
    ├── GH           GitHub Issues API-Client (laden, abstimmen, einreichen)
    ├── BLACKLIST    Eingabe-Sperrliste (RegExp-basiert)
    └── Hilfsfunktionen: mk() (DOM-Element erstellen), xss() (XSS-Schutz)
```

### Navigations-Engine (`NAV`)

```javascript
NAV.go('v-ibk-ta', 'Transaktionsanalyse')  // Vorwärts navigieren + Stack erweitern
NAV.back()                                   // Eine Ebene zurück
NAV.home()                                   // Stack leeren, Startseite anzeigen
NAV.jumpTo(idx)                              // Zu beliebiger Breadcrumb-Position springen
```

Intern wird ein **View-Stack** (`Array<{id, label}>`) gepflegt. Zurück-Button und Breadcrumb werden bei jeder Navigation automatisch neu gerendert.

### Vollständige View-ID-Liste

```
v-home         v-ibk
v-ibk-ta       v-ibk-konflikt    v-ibk-stress    v-ibk-psnv
v-ibk-bgm      v-ibk-pm          v-ibk-zeit
v-vak          v-feuak           v-idf
v-simulator    v-vorschlaege
```

### Externe Abhängigkeiten

| Ressource | Zweck | Verhalten ohne Internet |
|---|---|---|
| `fonts.googleapis.com` | Cormorant Garamond, DM Sans, DM Mono | Fallback auf Georgia / Helvetica Neue |
| `api.github.com` | Vorschlagswesen | Fehlermeldung in der UI, restliche App funktioniert |

---

## GitHub Pages Deployment

### Ersteinrichtung

1. `index.html` in den Root-Ordner des `main`-Branches committen
2. Im Repository: **Settings → Pages → Source: Deploy from branch → Branch: `main` / `/ (root)`**
3. Nach wenigen Minuten ist die Seite unter `https://flametan.github.io/BVI-Lernwebsite/` erreichbar

### Aktualisierungen veröffentlichen

```bash
git add index.html
git commit -m "feat: Beschreibung der Änderungen"
git push origin main
```

GitHub Pages deployt automatisch nach jedem Push auf `main`. Kein weiterer Schritt erforderlich.

---

## GitHub Issues API – Vorschlagswesen

### Konfiguration

```javascript
// In index.html – Abschnitt "GITHUB ISSUES API"
const GH = {
  token: 'github_pat_…',       // Personal Access Token (Fine-grained)
  owner: 'flametan',           // GitHub-Benutzername
  repo:  'BVI-Lernwebsite',    // Repository-Name
  label: 'vorschlag',          // Label, das neuen Issues automatisch zugewiesen wird
  base:  'https://api.github.com'
};
```

### Erforderliche Token-Berechtigung

```
Repository-Zugriff: flametan/BVI-Lernwebsite  (nur dieses Repository)
Permission:         Issues → Read & Write
Alle anderen:       keine
```

### API-Endpunkte im Überblick

| Aktion | Methode | Endpunkt |
|---|---|---|
| Vorschläge laden | `GET` | `/repos/{owner}/{repo}/issues?labels=vorschlag` |
| Reaktionen laden | `GET` | `/repos/{owner}/{repo}/issues/{num}/reactions` |
| Abstimmen (👍/👎) | `POST` | `/repos/{owner}/{repo}/issues/{num}/reactions` |
| Vorschlag einreichen | `POST` | `/repos/{owner}/{repo}/issues` |

### Blacklist – Einträge ergänzen

```javascript
const BLACKLIST = [
  {
    pattern: /nukular/i,
    msg: '…Fehlermeldung als HTML-String…'
  },
  // Weitere Einträge hier – beliebige RegExp möglich:
  { pattern: /beispiel/i, msg: '<strong>Begründung</strong> als HTML.' }
];
```

---

## Token-Verwaltung & Sicherheitshinweis

> ⚠️ **Der Token ist im Quellcode der öffentlich gehosteten HTML-Datei sichtbar.** Das ist eine inhärente Einschränkung der statischen Architektur ohne serverseitiges Backend.

### Risikoreduzierung

- **Fine-grained PAT** statt Classic Token verwenden
- Ausschließlich `Issues: Read & Write` für exakt dieses Repository vergeben – keine weiteren Berechtigungen
- Token **alle 90 Tage rotieren** (GitHub erinnert per E-Mail)

### Token rotieren – Schritt für Schritt

1. Öffne: [github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. Klicke **Generate new token**
3. Wähle: Resource owner `flametan` · Repository `BVI-Lernwebsite` · Permission `Issues: Read & Write`
4. Token generieren und kopieren
5. In `index.html` den Wert von `GH.token` ersetzen
6. Alten Token über **Revoke** widerrufen
7. Änderung committen und pushen

---

## Inhalte erweitern

### Neuen IBK-Themenbereich hinzufügen

**1. View-Div anlegen** (nach dem letzten `v-ibk-*`-Block in `index.html`):

```html
<div id="v-ibk-neu" class="view detail-view">
  <div class="page-hero">
    <div class="phi">
      <p class="page-eyebrow">IBK · Thema 08</p>
      <h1 class="page-title">Neues <span class="accent">Thema</span></h1>
      <p class="page-lead">Kurzbeschreibung des Themas.</p>
    </div>
  </div>
  <div class="pc">
    <!-- Inhalt mit den vorhandenen CSS-Klassen: .sec-h, .def-box, .cg, .info-card usw. -->
  </div>
</div>
```

**2. View-ID in der NAV-Engine registrieren:**

```javascript
const ALL = [
  'v-home', 'v-ibk',
  'v-ibk-ta', 'v-ibk-konflikt', 'v-ibk-stress', 'v-ibk-psnv',
  'v-ibk-bgm', 'v-ibk-pm', 'v-ibk-zeit',
  'v-ibk-neu',   // ← neu hinzufügen
  'v-vak', 'v-feuak', 'v-idf', 'v-simulator', 'v-vorschlaege'
];
```

**3. Topic-Card in der IBK-Übersicht ergänzen** (im View `v-ibk`):

```html
<div class="topic-card" onclick="NAV.go('v-ibk-neu', 'Neues Thema')">
  <div class="tc-num">08</div>
  <div class="tc-name">Neues Thema</div>
  <div class="tc-sub">Kurzbeschreibung der Unterkapitel</div>
</div>
```

### Platzhalter-Views mit Inhalt füllen

Die Views `v-vak`, `v-feuak` und `v-idf` enthalten nur Platzhalter-Divs. Den Inhalt einfach ersetzen:

```html
<!-- Vorher: -->
<div id="v-vak" class="view detail-view">
  <div class="pc" style="padding-top:3rem;">
    <div class="ph-view">…Platzhalter…</div>
  </div>
</div>

<!-- Nachher: -->
<div id="v-vak" class="view detail-view">
  <div class="page-hero">…</div>
  <div class="pc">…echter Inhalt…</div>
</div>
```

---

## Neues Simulator-Szenario ergänzen

### Schritt 1 – Szenario-Objekt in `SCENARIOS` anlegen

```javascript
const SCENARIOS = {
  // … bestehende Szenarien (schmidt, ressourcen, stab, disziplin) …

  mein_szenario: {
    label: 'Szenario 05 – Kurztitel',
    start: 'ms_start',            // ID des Einstiegsknotens

    nodes: {

      'ms_start': {
        phase: 1,
        title: '🔍 Situationstitel',
        scene: `<p>Situationsbeschreibung als HTML.</p>
                <div class="scene-ib"><strong>Hinweis:</strong> Kontext.</div>`,
        question: 'Was ist dein erster Schritt?',
        options: [
          {
            letter: 'A', text: 'Beschreibung der Option A',
            quality: 'good', scoreDelta: +20,
            feedback: 'Das war richtig, weil…',
            theory: '📚 Theoretischer Hintergrund (TA, Glasl, Watzlawick…)',
            next: 'ms_weiter'
          },
          {
            letter: 'B', text: 'Beschreibung der Option B',
            quality: 'bad', scoreDelta: -15,
            feedback: 'Das war falsch, weil…',
            theory: '📚 Theoretischer Hintergrund',
            next: 'ms_ende_schlecht'
          }
        ]
      },

      'ms_weiter': {
        phase: 2,
        title: '…', scene: '…', question: '…',
        options: [ /* … */ ]
      },

      'ms_ende_gut': {
        phase: 4, isEnd: true, endScore: 'good',
        title: '🏆 Erfolgreich abgeschlossen!',
        scene: `<p>Abschlussbeschreibung.</p>`,
        options: [{
          letter: '↺', text: 'Szenario neu starten',
          quality: 'restart', next: 'ms_start'
        }]
      },

      'ms_ende_schlecht': {
        phase: 2, isEnd: true, endScore: 'bad',
        title: '🔴 Spielende – Führungsversagen',
        scene: `<p>Beschreibung des Scheiterns.</p>`,
        options: [{
          letter: '↺', text: 'Szenario neu starten',
          quality: 'restart', next: 'ms_start'
        }]
      }
    }
  }
};
```

### Schritt 2 – Auswahl-Karte im HTML hinzufügen

Im View `v-simulator`, innerhalb von `#sim-menu-wrap > .sim-menu`:

```html
<div class="sc-card" onclick="SIM.loadScenario('mein_szenario')">
  <div class="sc-num">Szenario 05</div>
  <div class="sc-title">Titel des Szenarios</div>
  <div class="sc-desc">Kurze Situationsbeschreibung für das Auswahlmenü (2–3 Sätze).</div>
  <span class="sc-tag sc-tag-warn">Schlagwort · Theorie</span>
</div>
```

**Tag-Farben:** `sc-tag-ok` (grün) · `sc-tag-warn` (orange) · `sc-tag-err` (rot)

---

## Design-System

### Farbpalette (CSS Custom Properties)

| Variable | Wert | Verwendung |
|---|---|---|
| `--c-bg` | `#080F1C` | Seitenhintergrund |
| `--c-navy` | `#0A192F` | Primäre Oberfläche |
| `--c-gold` | `#C9A84C` | Hauptakzent, Überschriften, Icons |
| `--c-gold-l` | `#E8C97A` | Helles Gold |
| `--c-gold-dim` | `rgba(201,168,76,0.10)` | Gold-Hintergrund (Badges, Hinweise) |
| `--c-red` | `#A50000` | Feuerwehr-Rot, Simulator-Optionen, CTA |
| `--c-red-l` | `#CC1515` | Helles Rot (Hover, Akzente) |
| `--c-text` | `#D8E4F0` | Primärer Fließtext |
| `--c-text-b` | `#EEF4FB` | Heller Primärtext, Überschriften |
| `--c-slate-l` | `#8FA0B0` | Sekundärer Text |
| `--c-ok` | `#2A7A52` | Erfolg / positive Entscheidung |
| `--c-warn` | `#B07320` | Warnung / neutrale Entscheidung |
| `--c-err` | `#8B1A1A` | Fehler / schlechte Entscheidung |
| `--glass` | `rgba(255,255,255,0.04)` | Glassmorphismus-Oberfläche |

### Typografie

| Variable | Schrift | Einsatzbereich |
|---|---|---|
| `--f-d` | Cormorant Garamond | Überschriften, Logo, Simulator-Titel |
| `--f-b` | DM Sans | Fließtext, UI-Elemente, Buttons |
| `--f-m` | DM Mono | Code-Elemente, Badges, Scores, Zeitstempel |

### Wichtige CSS-Klassen – Referenz

| Klasse | Beschreibung |
|---|---|
| `.view` / `.view.active` | SPA-View (unsichtbar / sichtbar mit Einblend-Animation) |
| `.detail-view` | Alle Unterseiten (padding-top für fixierten Header) |
| `.sec-h` | Abschnittsüberschrift mit goldenem Linienakzent links |
| `.sec-div` | Goldene horizontale Trennlinie |
| `.def-box` | Gold-umrandete Definitionsbox (mit Label oben links) |
| `.info-card` | Glassmorphismus-Karte mit optionalem farbigem Dot |
| `.cg` / `.cg-2` / `.cg-3` | CSS-Grid (auto-fit / 2 / 3 Spalten fest) |
| `.diagram-wrap` | Dunkler Container für SVG-Diagramme mit Caption-Slot |
| `.hint` | Gold-hinterlegter Hinweisblock (auch `.hint.blue-h`, `.hint.err-h`) |
| `.bl` | Bullet-List mit goldenen Pfeil-Markern |
| `.step-stack` / `.step-item` | Nummerierte Schritt-Liste (BELLA, Projektphasen etc.) |
| `.glass-tile` | Glassmorphismus-Kachel (Startseite) |
| `.scene-ib` | Eingebettete Infobox im Simulator (auch `.scene-ib.warn`, `.scene-ib.err`) |

---

## Browser-Kompatibilität

| Browser | Status | Anmerkungen |
|---|---|---|
| Chrome 90+ | ✅ Vollständig | Referenz-Browser |
| Firefox 88+ | ✅ Vollständig | `backdrop-filter` je nach Einstellung deaktiviert |
| Safari 15+ | ✅ Vollständig | `backdrop-filter` ab Safari 9 mit `-webkit-` Prefix |
| Edge 90+ | ✅ Vollständig | Chromium-basiert, identisch zu Chrome |
| Internet Explorer 11 | ❌ Nicht unterstützt | CSS Custom Properties und `async/await` nicht verfügbar |

**Hinweis:** Wenn `backdrop-filter: blur()` nicht verfügbar ist (Firefox ohne Einstellung), entfällt der Glassmorphismus-Effekt. Die Funktionalität bleibt vollständig erhalten.

---

## Lizenz

Dieses Projekt ist **nicht öffentlich lizenziert**. Alle Inhalte und der Quellcode sind urheberrechtlich geschützt.

Die Plattform dient ausschließlich der internen Prüfungsvorbereitung für den höheren feuerwehrtechnischen Dienst. Eine Weiterverbreitung, Vervielfältigung oder kommerzielle Nutzung ohne ausdrückliche schriftliche Genehmigung ist nicht gestattet.

---

## Quellen & Literatur

| Thema | Quelle |
|---|---|
| Transaktionsanalyse | Eric Berne – *Games People Play* (1964); Taibi Kahler – Antreiber-Modell |
| Konfliktmanagement | Friedrich Glasl – *Konfliktmanagement* (9. Aufl.); Stephen Karpman – Drama Triangle |
| Kommunikation | Schulz von Thun – *Miteinander reden* (1981); Paul Watzlawick – *Menschliche Kommunikation* (1969); Albert Mehrabian – Studie (1967) |
| Stresstheorie | Richard Lazarus – Stressbewältigungsmodell; Mihaly Csikszentmihalyi – *Flow* (1990) |
| JD-R-Modell | Arnold Bakker & Evangelia Demerouti (2003) |
| PSNV | AGBF-Empfehlungen zur Psychosozialen Notfallversorgung |
| BGM – Grundlagen | WHO-Definition (1948); Ottawa-Charta (1986) |
| Salutogenese | Aaron Antonovsky – *Unraveling the Mystery of Health* (1987) |
| PERMA-H | Martin Seligman – *Flourish* (2011); Barbara Fredrickson – Broaden-and-Build |
| MBSR | Jon Kabat-Zinn – Mindfulness-Based Stress Reduction |
| Rechtliche Grundlagen | § 20b SGB V; § 84 SGB IX; § 3 ArbSchG |
| Projektmanagement | PMI – PMBOK Guide; Critical Path Method (DuPont/Remington Rand, 1957) |
| Zeitmanagement | Brian Tracy – *Eat That Frog!* (2001); Cal Newport – *Deep Work* (2016); Gloria Mark (UCI) – Unterbrechungskosten-Studie |

---

*Repository: `flametan/BVI-Lernwebsite` · Version 3.0 · Lehrgang B VI – Höherer feuerwehrtechnischer Dienst*
