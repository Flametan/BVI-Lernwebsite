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

(Die ID zeigt die App unter Einstellungen → Lehrgang → „Jahrgang exportieren“ im Dateinamen:
`bvi-<ID>.json`.)

## Datei prüfen (Skript)

Bevor du eine Datei hochlädst, lass sie vom Skript durchsehen:

```
node tools/pruefe-jahrgang.cjs <Datei.json>          # Zusammenfassung, Fehler und Warnungen
node tools/pruefe-jahrgang.cjs <Datei.json> --voll   # zusätzlich alle Texte zum Durchlesen
```

Es zählt Pläne, Ergänzungen, Kapitel, Prüfungen, Fragen, Karten, Reiter und Bilder und warnt
bei HTML oder Skriptteilen, Links, sehr langen Texten, fehlenden Bildern, falschem Dateinamen und
einem Link-Hinweis mit „Passwort“. Bei echten Fehlern (kein gültiges Format, ungültiger Reiter
oder Link) endet es mit Code 1. Das Skript braucht nur Node, sonst nichts.

## So kommt eine Datei in die App

**Normalweg: der Jahrgang pflegt sich selbst.** Der Jahrgang bestimmt eine Person, die sich um die Seite kümmert.
Sie exportiert unter **Einstellungen → Lehrgang → Jahrgang exportieren** und teilt die Datei in der WhatsApp-Gruppe
des Jahrgangs. Alle anderen lesen sie unter **Jahrgang importieren** ein, damit sind alle auf demselben Stand.
Du musst dafür nichts veröffentlichen und bist nur bei Problemen gefragt.

**Optional: Datei im Repo veröffentlichen.** Wer die Datei fest in der App hinterlegen will, so dass alle im Jahrgang
sie ohne Einlesen bekommen:

1. Datei **prüfen** (Skript unten, dann siehe „Prüfen“).
2. Auf GitHub in diesen Ordner hochladen: *Add file → Upload files*, Dateiname wie oben, direkt auf `main`.
3. Nach etwa zwei Minuten ist sie veröffentlicht. Alle in diesem Jahrgang sehen den Stand beim nächsten Öffnen.

**Wunsch an die Jahrgänge:** Nur am Ende ihres B VI (einmal, nicht zwischendurch) sollen sie dir ihre App-Datei (in der App „App-Datei“ genannt, nicht „json“) per E-Mail schicken, freiwillig. Das steht in der Hilfe unter „Am Ende eures Lehrgangs“. Du prüfst die Datei (Skript oben) und lädst sie wie oben beschrieben hoch.

Der Export enthält immer den **ganzen** Stand (veröffentlichte Datei plus Änderungen des Absenders).
Die neue Datei ersetzt also die alte mit gleichem Namen.

Alternativ: Eine Person pflegt alles, exportiert und schickt die Datei in die Gruppe. Die anderen
lesen sie in der App unter **Jahrgang importieren** ein, ohne dass du etwas veröffentlichen musst.

## Was in der Datei steht

Alles ist optional (siehe `_beispiel.json`):

* `plane` – Stundenpläne je Abschnitt (`ibk`, `vak`, `feuak`, `idf`), jeweils mit Termine (Beginn, Ende, Titel, Raum); `aktiv` nennt den Abschnitt, dessen Plan Startseite und Widgets benutzen.
* `erg` – Ergänzungen zu Lernseiten (`seite` ist die Seiten-ID, z. B. `v-vak-verwaltungsrecht`; `bild` verweist auf `bilder`).
* `pr` – Prüfungen: `hinzu` (eigene Prüfungen mit Fragen und Antworten), `weg` (ausgeblendete mitgelieferte Prüfungen).
* `rel` – Klausurrelevanz einzelner Prüfungen als `{ "<Prüfungs-ID>": true|false }`. Ohne Angabe gelten die im Master hervorgehobenen Prüfungen (und eigene Prüfungen) als relevant; relevante Prüfungen liefern die Fragen für Einsatzfahrt und Duell.
* `erg` kann außer Text auch eigene Kapitel enthalten: `typ` ist `text` (Standard) oder `kapitel`. `kap` ordnet eine Ergänzung einem Kapitel zu.
* `links` – `{ "cloud": { "url": "https://…", "titel": "…", "hinweis": "…" } }`, nur `https`. Erscheint als Karte auf der Startseite. Keine Passwörter eintragen.
* `kweg` – gelöschte Lernkarten: IDs der Karten, die in diesem Jahrgang nicht mehr erscheinen sollen (Master-Karten wie `g01` oder Karten des Jahrgangs wie `jgk1`). Die Karten bleiben im Master erhalten.
* `karten` – Lernkarten des Jahrgangs: `[{ "id": "k1", "modul": "VAk", "q": "Frage", "a": "Antwort" }]` (Module: Laufbahn, IBK, VAk, FeuAK, IdF (ältere Module GAL, SFS, HLFS bleiben zulässig)).
* `faq` – Antworten zum Standort (Unterkunft, Essen, Sport, Anreise …) je `ibk`, `vak`, `feuak`, `idf`: Eine Liste mit Einträgen. Mit `id` (z. B. `kuehl`, `sport`, `parken`; alle Kennungen stehen in `js/faq.js`) wird die Antwort der Standardfrage ersetzt, ohne `id` entsteht eine eigene Frage: `{ "c": "Sonstiges", "q": "Frage?", "a": "Antwort" }`. Fragen ohne Antwort werden in der App nicht angezeigt.
* `orte` – Standorte statt der Standardnamen: `{ "ibk": "…", "vak": "…", "feuak": "…", "idf": "…" }`.
* `kuerzel` – eigene Kürzel statt IBK, VAk, FeuAK und IdF (Buchstaben, Ziffern, Punkt und Bindestrich, höchstens 12 Zeichen): `{ "idf": "…" }`.
* `reiter` – eigene Reiter auf einer Übersichtsseite: `[{ "id": "r1", "seite": "v-vak", "titel": "…", "beschr": "…" }]`. Ihre Kapitel stehen in `erg` mit `seite: "v-r-<id>"` und `typ: "kapitel"`.
* Eigene Prüfungsfragen haben `typ`: `sc` (Single-Choice, `c` = Nummer), `mc` (Multiple-Choice, `c` = Liste) oder `text` (Freitext, `a` = Musterlösung).
* `bilder` – die Bilder als `data:image/jpeg;base64,…` (die App verkleinert sie vor dem Speichern).

## Prüfen, bevor du veröffentlichst

* Datei in einem Texteditor öffnen: Sind Texte und Fragen sinnvoll? Stimmen die richtigen Antworten (`c` = Nummer der richtigen Antwort, ab 0)?
* **Urheberrecht:** Keine Folien, Skripte oder Prüfungen der Dozenten ohne Erlaubnis. Du trägst als Betreiber Verantwortung für das, was veröffentlicht wird.
* Die App bereinigt Dateien beim Einlesen (Texte werden nie als HTML ausgeführt), aber fachliche Fehler erkennt sie nicht.
* Sehr viele Bilder machen die Datei groß. Wenn sie über etwa 5 MB geht, lieber einzelne Bilder weglassen.

Dateien, deren Name mit `_` beginnt, werden von der App nicht geladen (so wie `_beispiel.json`).
