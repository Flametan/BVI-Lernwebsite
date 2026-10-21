# Jahrgangs-Dateien

Jeder Jahrgang außer dem Master (BRef 04/2025 - AB 04/2026) startet als 1:1-Kopie der App.
Die **Änderungen** eines Jahrgangs liegen als eine JSON-Datei in diesem Ordner. Wer in der App
diesen Jahrgang wählt, bekommt die Datei automatisch dazu.

## Dateiname = Jahrgangs-ID

`BRef-MM-JJJJ_AB-MM-JJJJ.json`, z. B.

| Jahrgang in der App | Dateiname |
| --- | --- |
| BRef 10/2026 - AB 10/2027 | `BRef-10-2026_AB-10-2027.json` |
| BRef 04/2026 - AB 04/2027 | `BRef-04-2026_AB-04-2027.json` |
| BRef 10/2025 - AB 10/2026 | `BRef-10-2025_AB-10-2026.json` |

(Die ID zeigt die App unter Einstellungen → Lehrgang → „Änderungen exportieren“ im Dateinamen:
`bvi-<ID>.json`.)

## So kommt eine Datei in die App

1. Jemand aus dem Jahrgang exportiert in der App: **Einstellungen → Lehrgang → Änderungen exportieren**
   und schickt dir die Datei (z. B. per WhatsApp).
2. Du **prüfst die Datei** (siehe unten).
3. Auf GitHub in diesen Ordner hochladen: *Add file → Upload files*, Dateiname wie oben, direkt auf `main`.
4. Nach etwa zwei Minuten ist sie veröffentlicht. Alle in diesem Jahrgang sehen den Stand beim nächsten Öffnen.

Der Export enthält immer den **ganzen** Stand (veröffentlichte Datei plus Änderungen des Absenders).
Die neue Datei ersetzt also die alte mit gleichem Namen.

Alternativ: Eine Person pflegt alles, exportiert und schickt die Datei in die Gruppe. Die anderen
lesen sie in der App unter **Änderungen einlesen** ein, ohne dass du etwas veröffentlichen musst.

## Was in der Datei steht

Alles ist optional (siehe `_beispiel.json`):

* `plane` – Stundenpläne je Abschnitt (`ibk`, `vak`, `feuak`, `idf`), jeweils mit Termine (Beginn, Ende, Titel, Raum); `aktiv` nennt den Abschnitt, dessen Plan Startseite und Widgets benutzen.
* `erg` – Ergänzungen zu Lernseiten (`seite` ist die Seiten-ID, z. B. `v-vak-verwaltungsrecht`; `bild` verweist auf `bilder`).
* `pr` – Prüfungen: `hinzu` (eigene Prüfungen mit Fragen und Antworten), `weg` (ausgeblendete mitgelieferte Prüfungen).
* `rel` – Klausurrelevanz einzelner Prüfungen als `{ "<Prüfungs-ID>": true|false }`. Ohne Angabe gelten die im Master hervorgehobenen Prüfungen (und eigene Prüfungen) als relevant; relevante Prüfungen liefern die Fragen für Einsatzfahrt und Duell.
* `erg` kann außer Text auch Auswahlfragen und eigene Kapitel enthalten: `typ` ist `text` (Standard), `sc` (Single-Choice), `mc` (Multiple-Choice) oder `kapitel`. Bei `sc`/`mc` ist `text` die Frage, `o` die Antworten, `c` die Nummern der richtigen Antworten (ab 0) und `erk` eine Erklärung. `kap` ordnet eine Ergänzung einem Kapitel zu.
* `termine` – Klausurtermine des Jahrgangs: `[{ "date": "2026-12-14", "name": "Klausur IdF" }]`. Der nächste erscheint als Countdown.
* `links` – `{ "cloud": { "url": "https://…", "titel": "…", "hinweis": "…" } }`, nur `https`. Erscheint als Karte auf der Startseite. Keine Passwörter eintragen.
* `karten` – Lernkarten des Jahrgangs: `[{ "id": "k1", "modul": "VAk", "q": "Frage", "a": "Antwort" }]` (Module: GAL, SFS, HLFS, IBK, VAk, FeuAK, IdF).
* `orte` – Standorte statt der Standardnamen: `{ "ibk": "…", "vak": "…", "feuak": "…", "idf": "…" }`.
* `bilder` – die Bilder als `data:image/jpeg;base64,…` (die App verkleinert sie vor dem Speichern).

## Prüfen, bevor du veröffentlichst

* Datei in einem Texteditor öffnen: Sind Texte und Fragen sinnvoll? Stimmen die richtigen Antworten (`c` = Nummer der richtigen Antwort, ab 0)?
* **Urheberrecht:** Keine Folien, Skripte oder Prüfungen der Dozenten ohne Erlaubnis. Du trägst als Betreiber Verantwortung für das, was veröffentlicht wird.
* Die App bereinigt Dateien beim Einlesen (Texte werden nie als HTML ausgeführt), aber fachliche Fehler erkennt sie nicht.
* Sehr viele Bilder machen die Datei groß. Wenn sie über etwa 5 MB geht, lieber einzelne Bilder weglassen.

Dateien, deren Name mit `_` beginnt, werden von der App nicht geladen (so wie `_beispiel.json`).
