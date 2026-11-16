# IdF-Spiel – Plan

Stand: Alle neun Missionen sind spielbar, je fünf Level. Dazu kommen Training (Wiederholung, Prüfung), Wochenaufgabe und Bestenliste.

- **Begehung** hat eine eigene Welt (`js/m-begehung.js`, mehrgeschossig mit Treppenhaus).
- **Alle anderen** teilen sich `js/m-welt.js`: eine begehbare Kulisse je Mission (Stabsraum, Brandschutzdienststelle, Einsatzstelle,
  Lagezentrum, Flugfeld, Wache, Hörsaal, Planungsbüro) mit Stationen.
- **Aufgabenarten** (`js/app.js`, Funktion `ask`): eine Antwort (`mc`, auf Wunsch mit Bild), mehrere Antworten (`multi`), Reihenfolge (`reihe`),
  Meldung zum Sachgebiet bringen (`bringen`), Stellungnahme aus Textbausteinen (`bausteine`), Gespräch mit Stimmungsanzeige (`gespraech`),
  Posten im Budget wählen (`budget`), Statement gegen die Zeit vor laufender Kamera (`statement`).
- **Daten:** `python3 game/tools/build_data.py` erzeugt `game/data/*.json` aus den Quizfragen und Lernkarten der App und aus
  von Hand abgeleiteten Aufgaben; jede Aufgabe nennt ihre Quelle. Aufgaben mit eigener Mechanik, Rahmengeschichte (`auftrag`, `ende`)
  und Lichtstimmung (`licht`) je Level stehen in `game/tools/extra_data.py`. Eigene Übungsfälle sind im Feld `quelle` so gekennzeichnet.
- **Effekte** (`js/fx.js`): Lichtstimmungen (Tag, Morgen, Abend, Dämmerung, Regen), Nachbearbeitung (Bloom, Vignette, in der Stufe „Hoch“
  Tiefenunschärfe), Partikel (Staub, Rauch, Feuer, Konfetti, Regen, Rotorwind), Spiegelungen (einmal aufgenommene Umgebung),
  weiche Bodenschatten, Minikarte, Sprachausgabe. Einstellung „Effekte“: Aus, Mittel, Hoch; bei schwacher Bildrate schaltet
  die Grafikstufe „Automatisch“ erst die Auflösung herunter, dann die Effekte und zuletzt die Schatten ab.
- **Kamera** (`js/scene.js`, `cam`): Anflug zu Beginn, Schwenk zur Station bei einer Frage, Nicken bei richtig, Wackeln bei falsch.
- **Training:** Was nicht im ersten Versuch gelöst wird, ist sofort zur Wiederholung fällig; nach jeder richtigen Wiederholung wächst
  der Abstand (1, 3, 7, 16 Tage). Prüfung: 20 gemischte Fragen, 15 Minuten, ein Versuch je Frage, Note nach dem Schlüssel des Spiels.
- **Verknüpfung mit der App:** Die App verlinkt das Spiel im Pausenraum unter dem Reiter „IdF-Spiel (3D)“ (`js/pause.js`, `game/index.html?m=<Mission>&von=v-pause`), nicht in den Themenübersichten.
  Im Spiel führt „Im Kapitel nachlesen“ zur passenden Ansicht (`../index.html#<Ansicht>`).
- **Tests:** `game/tests/smoke.cjs` (Begehung), `game/tests/welten.cjs` (alle Welt-Missionen, Level wählbar), `game/tests/training.cjs` (Wiederholung, Prüfung, Bestenliste).
- **Nicht gebaut:** Rangliste über mehrere Geräte (bräuchte einen Server). In VAk bleiben es Fragen an Stationen.
  Die Abschnitte unten beschreiben die ursprüngliche Idee.

## Entscheidungen

- **Spielart:** richtiges 3D-Spiel in der dritten Person. Man steuert eine Einsatzkraft mit Stick (Touch) oder WASD,
  die Kamera folgt und lässt sich drehen und zoomen. Umsetzung mit Three.js und eigenen Shadern (Himmel, Leuchtsäulen, Böden).
- **Themen:** die IdF-Themen und zusätzlich IBK, VAk und FeuAK (siehe Tabelle unten, Missionen 7 bis 9).
- **Three.js:** eigene Kopie unter `game/vendor/three.min.js` (Version r128, dieselbe wie in der App).
- **Presse:** Wo der Stoff im Repo nicht reicht, kommt eigener Stoff dazu. Solche Aufgaben tragen im Feld `quelle` den Vermerk „eigener Stoff".

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
| 7 | IBK | **Mitarbeitergespräch** | `v-ibk-*` (Transaktionsanalyse, Konflikt, Führung), `js/scenarios.js` |
| 8 | VAk | **Einsatzrecht vor Ort** | `v-vak-*`, `js/fallbearbeitung.js` (8-Punkte-Schema) |
| 9 | FeuAK | **Feuerwehr planen** | `v-feuak-*` (Bedarfsplanung, Haushalt, Beschaffung) |

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

## Technische Grundlagen (eingebaut)

- Ton aus dem Browser (WebAudio, keine Dateien): Schritte, Tür, Treppe, richtig/falsch, Level geschafft; abschaltbar.
- Pausenmenü (Knopf, Esc, Start-Taste) mit Einstellungen: Ton, Vibration, Grafik (automatisch, niedrig, hoch), Kamera-Empfindlichkeit, Vollbild, Neustart.
- Auflösung passt sich im Modus „automatisch" der Bildrate an (Pixel-Ratio 0,75 bis 1,5).
- Eingabe: Stick (Touch), Tastatur, Maus, Gamepad.
- Richtungspfeil zur nächsten offenen Aufgabe oder zur Treppe, Schatten unter der Figur, Überblendung beim Geschosswechsel.
- Meldung, wenn WebGL fehlt; Anhalten und Weiterlaufen nach Abbruch des Grafik-Kontexts; Pause, wenn das Fenster verdeckt ist; Bildschirm bleibt an.
- Offline über den Service Worker der Lern-App (`sw.js`, Liste REST).
- Automatischer Durchlauf: `node game/tests/smoke.cjs` (Server auf Port 8765).
