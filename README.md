[README.md](https://github.com/user-attachments/files/27542925/README.md)
# 🔥 B VI – Lernen für den höheren Dienst

> Interaktive Lernplattform zur Prüfungsvorbereitung für den höheren feuerwehrtechnischen Dienst (Lehrgang B VI).

[![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-blue?style=flat-square&logo=github)](https://flametan.github.io/BVI-Lernwebsite)
[![License](https://img.shields.io/badge/Lizenz-MIT-green?style=flat-square)](LICENSE)

---

## 📋 Inhaltsverzeichnis

- [Projektbeschreibung](#projektbeschreibung)
- [Features](#features)
- [Schnellstart & Installation](#schnellstart--installation)
- [GitHub Pages einrichten](#github-pages-einrichten)
- [GitHub Token konfigurieren](#github-token-konfigurieren)
- [Führungsdienstsimulator einrichten](#führungsdienstsimulator-einrichten)
- [Sicherheitshinweise](#sicherheitshinweise)
- [Projektstruktur](#projektstruktur)
- [Weiterentwicklung](#weiterentwicklung)

---

## Projektbeschreibung

Diese Single-Page-Application (SPA) dient als interaktives Lernwerkzeug für Teilnehmerinnen und Teilnehmer des B VI-Lehrgangs. Die Seite wird als statische Webseite auf **GitHub Pages** gehostet – ohne eigenen Server, ohne Datenbankkosten.

**Inhaltliche Schwerpunkte (IBK Heyrothsberge):**
- Transaktionsanalyse (Ich-Zustände, Kommunikationsregeln, Grundpositionen)
- Konfliktmanagement (Glasl, Karpman-Dreieck, B4-Regel)
- Stresstheorie (S-O-R-K-C-Modell, 5 Antreiber, Flow)
- PSNV (BELLA-Konzept, Demobilisation)
- Betriebliches Gesundheitsmanagement (BGM-Säulen)
- Projektmanagement & Zeitmanagement

---

## Features

| Feature | Beschreibung | Status |
|---|---|---|
| 🏫 IBK Heyrothsberge | 7 Themenbereiche im Accordion-System | ✅ Aktiv |
| 🎯 Führungsdienstsimulator | KI-gestütztes Rollenspiel (Claude API) | ✅ Aktiv |
| 💡 Verbesserungsvorschläge | Globales Voting via GitHub Issues API | ✅ Aktiv |
| 🏛️ VAk Berlin | Inhalte | 🔜 Geplant |
| 🔥 FeuAK Hamburg | Inhalte | 🔜 Geplant |
| ⚔️ IdF Münster | Inhalte | 🔜 Geplant |
| 📱 Responsive Design | Mobile-optimiert, Hamburger-Menü | ✅ Aktiv |

---

## Schnellstart & Installation

Da es sich um eine reine HTML-Datei handelt, ist keine Installation erforderlich.

### Lokal testen

```bash
# Option 1: Datei direkt im Browser öffnen
# → Doppelklick auf index.html (einige Features benötigen einen Server)

# Option 2: Kleinen lokalen Server starten (empfohlen)
# Mit Python 3:
python3 -m http.server 8000
# → Browser öffnen: http://localhost:8000

# Mit Node.js (npx):
npx serve .
# → Browser öffnen: http://localhost:3000
```

---

## GitHub Pages einrichten

### Schritt 1: Repository erstellen

```bash
# Repository klonen (oder frisch erstellen)
git clone https://github.com/flametan/BVI-Lernwebsite.git
cd BVI-Lernwebsite
```

### Schritt 2: Dateien hochladen

```bash
git add index.html README.md
git commit -m "feat: Initiale Version der B VI Lernwebsite"
git push origin main
```

### Schritt 3: GitHub Pages aktivieren

1. Öffne dein Repository auf GitHub: `https://github.com/flametan/BVI-Lernwebsite`
2. Klicke auf **Settings** (Einstellungen, oben rechts)
3. In der linken Sidebar: **Pages**
4. Unter **Source**: Wähle `Deploy from a branch`
5. Wähle Branch: `main`, Ordner: `/ (root)`
6. Klicke **Save**
7. Nach ca. 2–5 Minuten ist die Seite erreichbar unter:
   `https://flametan.github.io/BVI-Lernwebsite`

### Schritt 4: CORS-Label anlegen (für Vorschläge)

Damit die Vorschläge korrekt gefiltert werden, muss das Label `vorschlag` im Repository existieren:

1. Gehe zu deinem Repository → **Issues** → **Labels**
2. Klicke **New label**
3. Name: `vorschlag`, Farbe: `#E2001A`, Beschreibung: `Verbesserungsvorschlag aus der Lernwebsite`
4. Klicke **Create label**

---

## GitHub Token konfigurieren

Das Voting-System und das Einreichen von Vorschlägen benötigen einen GitHub **Personal Access Token (PAT)** mit eingeschränkten Rechten.

### Schritt 1: Token erstellen

1. Melde dich bei GitHub an
2. Gehe zu: **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
3. Klicke **Generate new token**
4. Fülle aus:
   - **Token name**: `BVI-Lernwebsite-Issues`
   - **Expiration**: 90 Tage (regelmäßig erneuern!)
   - **Repository access**: `Only select repositories` → `flametan/BVI-Lernwebsite`
5. Unter **Permissions** → **Repository permissions**:
   - **Issues**: `Read and write` ✅
   - **Reactions**: (enthalten in Issues)
   - Alles andere: `No access`
6. Klicke **Generate token**
7. **Token sofort kopieren** – er wird nur einmal angezeigt!

### Schritt 2: Token in die index.html eintragen

Öffne `index.html` und suche nach dieser Zeile (ca. Zeile 560):

```javascript
const GITHUB_CONFIG = {
  token: 'DEIN_GITHUB_TOKEN_HIER', // ← TOKEN EINFÜGEN
  owner: 'flametan',
  repo:  'BVI-Lernwebsite',
  label: 'vorschlag',
  apiBase: 'https://api.github.com'
};
```

Ersetze `'DEIN_GITHUB_TOKEN_HIER'` mit deinem Token:

```javascript
token: 'github_pat_11BEISPIEL_AbcDefGhi...',
```

### Schritt 3: Token rotieren

GitHub-Tokens sollten regelmäßig erneuert werden:
- Token läuft ab → wiederholen ab Schritt 1
- Token kompromittiert → sofort in GitHub Settings → **Revoke** klicken

---

## Führungsdienstsimulator einrichten

Der Simulator nutzt die **Anthropic Claude API** direkt im Browser. Jeder Nutzer benötigt seinen eigenen API-Key.

### Anthropic API-Key holen

1. Registriere dich auf [console.anthropic.com](https://console.anthropic.com)
2. Gehe zu **API Keys** → **Create Key**
3. Name: `BVI-Simulator`
4. Key beginnt mit `sk-ant-api03-...`
5. Guthaben aufladen (ca. 5 USD für ausgiebiges Testen)

### Nutzung im Simulator

1. Öffne die Website und klicke auf **Führungsdienstsimulator**
2. Gib deinen Anthropic API-Key in das Eingabefeld ein
3. Klicke **Speichern**
4. Starte den Simulator mit **▶ Simulator starten**

> **Hinweis:** Der API-Key wird nur im Arbeitsspeicher dieser Browser-Sitzung gespeichert. Beim Schließen des Tabs ist er weg. Er wird nicht an Dritte übertragen.

### Kosten des Simulators

Der Simulator nutzt `claude-sonnet-4-20250514`. Richtwerte:
- Eine vollständige Simulation (3 Phasen) ≈ 0,01–0,05 USD
- Für Prüfungsvorbereitung also nahezu kostenlos

---

## Sicherheitshinweise

### ⚠️ GitHub Token im Quellcode

Das GitHub Personal Access Token ist im Quellcode der `index.html` eingebettet und damit **für jeden sichtbar**, der die Seite im Browser öffnet und "Quellcode anzeigen" wählt.

**Risikominimierung:**
- ✅ Token mit **minimalen Rechten** (nur Issues) erstellen
- ✅ Token **regelmäßig rotieren** (alle 90 Tage)
- ✅ Repository **auf Missbrauch überwachen** (GitHub Security Alerts aktivieren)
- ✅ Bei Missbrauch: Token sofort unter GitHub Settings → Tokens → **Revoke** deaktivieren

**Professionelle Alternative (für sensible Umgebungen):**
Erstelle eine serverlose Backend-Funktion als Token-Proxy, z.B. mit:
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)

Diese empfangen die Anfragen der Website, fügen das Token server-seitig hinzu und leiten sie an GitHub weiter. Das Token verlässt niemals den Browser des Nutzers.

### ⚠️ Anthropic API-Key

Der Anthropic API-Key wird **nicht** in der `index.html` gespeichert – jeder Nutzer gibt seinen eigenen ein. Dieses Design ist bewusst sicherer als das GitHub-Token.

---

## Projektstruktur

```
BVI-Lernwebsite/
│
├── index.html          # Gesamte Applikation (HTML + CSS + JS)
└── README.md           # Diese Dokumentation
```

Die gesamte Anwendung ist bewusst als **Single File** konzipiert:
- Einfachstes Deployment (nur 1 Datei hochladen)
- Keine Build-Pipeline, kein npm, kein Framework
- Sofort einsatzbereit auf GitHub Pages

---

## Weiterentwicklung

### Inhalte ergänzen

Die Platzhalter-Sektionen (VAk Berlin, FeuAK Hamburg, IdF Münster) können einfach durch Accordion-Gruppen befüllt werden. Kopiere das Muster aus dem IBK-Bereich.

### Neue Themen-Accordions hinzufügen

```html
<div class="accordion-item" id="acc-neues-thema">
  <button class="accordion-header" onclick="toggleAccordion('acc-neues-thema')">
    <span class="accordion-number">08</span>
    <span class="accordion-title-text">Neues Thema</span>
    <span class="accordion-badge">Schlüsselbegriff</span>
    <svg class="accordion-chevron" ...>...</svg>
  </button>
  <div class="accordion-body">
    <div class="content-block">
      <h4>Unterüberschrift</h4>
      <p>Inhalt hier...</p>
    </div>
  </div>
</div>
```

### Mitmachen

Verbesserungsvorschläge können direkt über die Website eingereicht werden (Reiter "Verbesserungsvorschläge") oder als [GitHub Issue](https://github.com/flametan/BVI-Lernwebsite/issues) erstellt werden.

---

*Erstellt für den B VI-Lehrgang · IBK Heyrothsberge · Version 1.0*
