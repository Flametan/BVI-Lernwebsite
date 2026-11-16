# IdF-Spiel – Plan (Schritt 1)

Stand: Entwurf zur Freigabe. Es ist noch kein Spielcode geschrieben.

## Was das Spiel ist

Ein eigenständiges 3D-Lernspiel unter `game/`, getrennt von der Lern-App. Die App bekommt nur einen Link.
Auf dem Startbildschirm wählt man ein Thema; jedes Thema ist eine Mission mit mehreren Leveln.

## Themen und Missionen

Als „Themen des IdF" zähle ich die fünf Bereiche, die in der App unter „IdF Münster" stehen.
Der Vorbeugende Brandschutz bekommt wie gewünscht zwei Missionen, zusammen also sechs.

| # | Thema | Mission | Quellen im Repo (index.html) |
|---|---|---|---|
| 1 | Vorbeugender Brandschutz | **Begehung** | `v-idf-vb-42` Begriffe, `v-idf-vb-43` Gebäudeklassen, `v-idf-vb-45` Grundsatzanforderungen, `v-idf-vb-46` Bau nach MBO |
| 2 | Vorbeugender Brandschutz | **Stellungnahme** | `v-idf-vb-41` Brandschutzdienststelle, `v-idf-vb-44` Baurecht, `v-idf-vb-46`, `v-idf-vb-47` Sonderbau, Altklausur-Lösung „Stellungnahme in 4 Teilen" |
| 3 | Stabsarbeit | **Im Stab** | `v-idf-s51` bis `v-idf-s55` |
| 4 | Presse- und Öffentlichkeitsarbeit | **Pressestatement** | `v-idf-p61`, `v-idf-p62`, vorhandene Simulation Pressegespräch |
| 5 | Zivile Verteidigung / Katastrophenschutz | **Lage Bevölkerungsschutz** | `v-idf-z90` bis `v-idf-z99` |
| 6 | Katastrophenschutzverfahren der EU (UCPM) | **Hilfeersuchen** | `v-idf-u101`, `v-idf-u102` |

### 1 Begehung (erste spielbare Mission)
Man steht in einem 3D-Gebäude, das als Schnitt und von innen begehbar ist: Treppenraum, Flure, Nutzungseinheiten,
Keller und Dachraum. Zu Beginn nennt das Spiel Gebäudeklasse und Nutzung. Man tippt Bauteile an (Tür, Wand, Decke,
Flur, Treppenraum) und wählt die richtige Anforderung, zum Beispiel DS, DSS, RS, T30-RS, feuerhemmend,
hochfeuerhemmend, feuerbeständig. Richtig gewählte Bauteile färben sich grün, falsche rot mit kurzer Erklärung
und Verweis auf das Kapitel. Ein Level ist geschafft, wenn alle markierten Bauteile bewertet sind.
Höhere Level bringen höhere Gebäudeklassen und mehr Bauteile.

### 2 Stellungnahme
Man sitzt im 3D-Büro der Brandschutzdienststelle; auf dem Tisch liegt ein Bauvorhaben (Steckbrief und Plan).
Man prüft das Vorhaben in festen Schritten: Zuständigkeit und Rolle, Einordnung (Gebäudeklasse, Sonderbau),
Anforderungen, Abweichungen. Für jeden Schritt wählt man aus Textbausteinen die zutreffenden aus und legt sie
in die Stellungnahme. Falsche oder fehlende Bausteine kosten Punkte. Am Ende zeigt das Spiel die Musterlösung
neben der eigenen Fassung.

### 3 Im Stab
Man steht im 3D-Stabsraum mit den Plätzen der Sachgebiete, Lagekarte und Meldeeingang. Meldungen laufen ein;
man ordnet jede dem richtigen Sachgebiet zu und entscheidet den nächsten Schritt. Level 1 fragt Begriffe und
Zuständigkeiten ab, spätere Level die Gliederung von Einsatzleitung und Krisenstab, Werkzeuge der Stabsarbeit
und typische Fehler aus „Human Factors". Zeitdruck steigt je Level.

### 4 Pressestatement
3D-Szene an der Einsatzstelle mit Absperrung, Kamera und Reportern. Reporter stellen Fragen; man wählt unter
drei bis vier Antworten. Bewertet wird nach den Grundsätzen der Pressearbeit aus den Kapiteln (was darf gesagt
werden, was nicht, wer ist zuständig). Ein Balken zeigt, wie gut das Statement ankommt.

### 5 Lage Bevölkerungsschutz
3D-Lagetisch mit einer Karte. Je Level tritt ein Ereignis ein (zum Beispiel Warnung der Bevölkerung,
länderübergreifende Hilfe, Einsatz der Bundeswehr im Inneren). Man entscheidet: Wer ist zuständig, welches
Warnmittel, welche Rechtsgrundlage, welche Reihenfolge. Die Karte zeigt die Folgen der Entscheidung.

### 6 Hilfeersuchen
3D-Karte mit den Stationen eines Hilfeersuchens im EU-Verfahren. Man bringt die Stationen in die richtige
Reihenfolge und ordnet Akteure und Rechtsgrundlagen zu. Bei richtiger Kette „fliegt" die Hilfe sichtbar ein.

## Punkte, Level, Abzeichen

- **Punkte:** 100 je richtiger Entscheidung, 50 beim zweiten Versuch, 0 danach. Serie ab drei richtigen in Folge: +20 je Treffer.
- **Level:** je Mission 5 Level; ein Level ist bestanden ab 70 % der möglichen Punkte, das nächste wird dann frei.
- **Highscore:** beste Punktzahl je Mission und Level, dazu eine Gesamtpunktzahl.
- **Abzeichen:** je Mission eines für „alle Level bestanden" und eines für „ein Level fehlerfrei"; dazu drei übergreifende (erste Mission, 7 Tage Serie, alle Missionen bestanden).
- **Tagesziel:** ein Level am Tag spielen; die Serie zählt aufeinanderfolgende Tage.
- **Speichern:** `localStorage`, Schlüssel `bvi_game_v1`, jeder Zugriff in try/catch. Der Stand bleibt auf dem Gerät.
  Der vorhandene Schlüssel `bvi_game` der App (Belohnungen) bleibt unberührt.

## Dateien

```
game/index.html          Startbildschirm und Spielfläche
game/css/game.css        Oberfläche, hell und dunkel
game/js/core.js          Speichern, Punkte, Level, Abzeichen, Tagesziel
game/js/scene.js         gemeinsame 3D-Grundlage (Kamera, Licht, Antippen, Leistungsgrenzen)
game/js/m-begehung.js    je Mission eine Datei, erst beim Start der Mission geladen
game/js/m-stellungnahme.js, m-stab.js, m-presse.js, m-lage.js, m-ucpm.js
game/data/<mission>.json Spielinhalte, jede Aufgabe mit Feld "quelle" (Ansicht und Abschnitt)
```

## Technik

- **Three.js:** Im Repo liegt bereits `js/three.min.js` (rund 600 KB, vom Raumplan genutzt und im Service Worker
  eingetragen). Ich schlage vor, diese Datei mitzubenutzen, statt eine zweite Kopie unter `game/vendor/` abzulegen.
  Das weicht vom Prompt ab und spart 600 KB im Offline-Speicher.
- **Leistung:** nur Grundformen, keine Echtzeit-Schatten, Pixel-Ratio höchstens 1,5, gerendert wird nur bei Änderung
  oder laufender Animation. Ziel: 30 Bilder pro Sekunde auf einem Mittelklasse-Tablet.
- **Bedienung:** Antippen und Wischen (Drehen, Zoomen) sowie Maus und Tastatur.
- **Außerhalb von `game/`:** ein Link in der App, Einträge in `sw.js` für den Offline-Betrieb, ein Eintrag im Änderungsprotokoll.

## Wo Stoff fehlt oder knapp ist

- **Presse:** Die beiden Kapitel sind kurz (zusammen rund 6 KB Text). Das reicht für etwa zwei bis drei Level mit je
  sechs Fragen; fünf Level sind ohne weiteren Stoff nicht möglich. Die Mission bekäme dann weniger Level.
- **Stellungnahme:** Eine vollständige Muster-Stellungnahme steht nicht im Repo. Vorhanden sind die Anforderungen
  der VB-Kapitel und die Altklausur-Lösung zur Bewertung einer Stellungnahme. Die Bauvorhaben im Spiel müsste ich
  als Beispiele anlegen; die richtigen Bausteine kämen ausschließlich aus den Kapiteln.
- **Begehung:** Welche Tür an welcher Stelle welche Anforderung hat, steht für den Gebäudeschnitt (Kapitel Begriffe)
  und in „Bau nach MBO". Für höhere Gebäudeklassen prüfe ich je Bauteil, ob das Kapitel die Anforderung nennt;
  Bauteile ohne Beleg kommen nicht ins Spiel.
- **Zivile Verteidigung:** Zwei Kapitel sind sehr kurz (`v-idf-z95`, `v-idf-z99`); sie liefern nur einzelne Fragen.

## Offene Fragen an Sie

1. Sollen nur die IdF-Themen ins Spiel (Vorschlag), oder auch IBK, VAk und FeuAK?
2. Three.js aus `js/three.min.js` mitbenutzen (Vorschlag) oder eigene Kopie unter `game/vendor/`?
3. Presse mit weniger Leveln, oder liefern Sie weiteren Stoff?

## Nächster Schritt nach Freigabe

Startbildschirm mit allen Missionen und die Mission „Begehung" spielbar, mit Punkten, Speichern und einem Abzeichen.
Prüfung mit Playwright bei 412×800 und 1280×800, je ein Screenshot, dann wieder Halt.
