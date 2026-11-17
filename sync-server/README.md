# B VI Sync-Dienst

Kleiner Dienst, der pro Sync-Code einen **verschlüsselten** Datenblock speichert. Es gibt keine Konten, Namen oder Mailadressen;
die App verschlüsselt auf dem Gerät, der Server sieht nur unlesbare Daten. Läuft ohne zusätzliche Pakete auf Node 22.

## Schnittstelle
| Aufruf | Zweck |
|---|---|
| `GET /health` | Lebenszeichen (`ok`) |
| `GET /v1/blob/<id>` | Datenblock lesen (Kopfzeile `X-Sync-Token`) |
| `GET /v1/blob/<id>?have=<Version>` | wie oben, antwortet aber nur mit `{version, updatedAt, unchanged:true}` (ohne Daten), solange die Version noch stimmt; ältere Server ignorieren den Zusatz |
| `PUT /v1/blob/<id>` | Datenblock schreiben (`X-Sync-Token`, `If-Match: <Version>`, `0` = neu); bei veralteter Version `409` mit dem aktuellen Stand |
| `DELETE /v1/blob/<id>` | Datenblock löschen (`X-Sync-Token`) |

`<id>` (32 Hex-Zeichen) und Token werden in der App aus dem Sync-Code abgeleitet. Der Server speichert nur einen Hash des Tokens.

## Einstellungen (Umgebungsvariablen)
`PORT` (8787), `DATA_DIR` (./data), `MAX_BODY` (1 MiB), `MAX_BLOBS` (5000), `RATE_PER_MIN` (120), `FAIL_PER_MIN` (10),
`EXPIRE_DAYS` (400), `ALLOW_ORIGINS` (`https://flametan.github.io`, kommagetrennt), `TRUST_PROXY` (`1` hinter einem Tunnel).

## Ranking und Wochenduell
Zusätzlich zum Sync liefert der Server ein freiwilliges Ranking (Wochen- und Gesamtliste) und Wochenduelle (`/v1/rank/...`, Code in `rank.js`).
Gespeichert werden pro Teilnehmer nur Name (aus dem Account), ein 48×48-Vorschaubild (optional, höchstens wenige KB), Gesamtpunkte, Wochenpunkte und ein Hash des zufälligen Zugriffsschlüssels, in der Datei `rank.dat` im Datenordner (kein `.json`, daher nicht mit den Sync-Blöcken vermischt). Wer aussteigt, wird samt Duellen gelöscht.
Weitere Einstellungen: `RANK_TZ` (Europe/Berlin, bestimmt Beginn und Ende der Woche), `RANK_MAX_PLAYERS` (2000), `RANK_MAX_XP` (500000), `RANK_MAX_WEEK` (8000), `RANK_DAY_XP` (1500, größter Punktezuwachs je Tag, Schutz vor Schummeln), `RANK_MAX_DUELS` (3), `RANK_BLOCK` (kommagetrennte Wörter, die in Namen verboten sind).
Spiel-Bestenlisten (Pausenraum): `PUT /v1/rank/<id>/games` mit `{"g":{"tetris":5000,"mahjong":300}}` meldet die besten Werte je Spiel (nur für angemeldete Teilnehmer, es zählt je Spiel der bessere Wert, bei Zeitlisten der niedrigere; unplausible Werte werden übersprungen). `GET /v1/rank/<id>/games?b=<liste>` liefert die Top 20 und den eigenen Platz. Listen: `fahrt`, `duell`, `tagesfrage`, `lueckentext`, `reihenfolge`, `hangman`, `kreuzwort`, `mahjong`, `sudoku:leicht|mittel|schwer`, `tetris`, `solitaer`, `g2048`, `minesweeper:leicht|mittel|schwer|sehr`, `snake`. Die Werte liegen ebenfalls in `rank.dat`. Nach einem Update muss das Docker-Image neu gebaut und der Container ersetzt werden.
Einen Teilnehmer entfernen: Container stoppen, den Eintrag in `rank.dat` löschen, Container starten.

## Tests
`node --test sync-server/test/*.test.js`

## Auf dem Umbrel starten
```
cd ~ && git clone https://github.com/flametan/BVI-Lernwebsite.git
cd BVI-Lernwebsite/sync-server
sudo docker build -t bvi-sync .
sudo docker run -d --name bvi-sync --restart unless-stopped \
  -p 127.0.0.1:8787:8787 -v /home/umbrel/bvi-sync-data:/data -e TRUST_PROXY=1 bvi-sync
curl http://127.0.0.1:8787/health      # → ok
```
Aktualisieren: `git pull`, neu bauen, `sudo docker rm -f bvi-sync` und den `docker run`-Befehl wiederholen (die Daten bleiben im Ordner `/home/umbrel/bvi-sync-data`).
Sicherung: den Ordner `/home/umbrel/bvi-sync-data` regelmäßig kopieren.

## Schreibrechte

Der Container läuft als Benutzer `node` (UID 1000). Gehört der Datenordner auf dem Host `root`, scheitert das Speichern (Tailscale zeigt dann 502). Abhilfe:

```
sudo chown -R 1000:1000 /home/umbrel/bvi-sync-data
sudo docker restart bvi-sync
```

## Leistung

Der Server arbeitet ohne blockierende Dateizugriffe: Kopfdaten der zuletzt benutzten Blöcke liegen im Speicher, die Anzahl der Blöcke wird mitgezählt (kein Verzeichnis-Lesen je Anfrage), und je Block laufen Lesen, Prüfen und Schreiben nacheinander. Nach einem Update des Servers (`git pull`, neu bauen, Container ersetzen) wirkt auch die bedingte Abfrage `?have=`; die App funktioniert mit älteren Servern unverändert weiter.
