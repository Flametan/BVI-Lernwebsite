# cache-band

Ein Mod für Claude Code: eine schmale Leiste direkt über dem Eingabefeld.

Von links nach rechts zeigt sie:

1. die Restzeit des Prompt-Caches in Minuten (gezählt ab der letzten Antwort) und einen Balken aus 20 Kästchen, der leerläuft (grün, im letzten Viertel gelb, in den letzten 10 % rot, bei 0 „abgelaufen“),
2. die Cache-Trefferquote der letzten Antwort in Prozent,
3. ein Wetter-Emoji für den Kontext (☀️ bis zur Hälfte der Auto-Compact-Schwelle, 🌧️ bis 80 % davon, ⛈️ darüber),
4. die Kontextfüllung in Prozent und die Auto-Compact-Schwelle,
5. den Knopf „Compact“ (bei ⛈️ hervorgehoben),
6. einen Pfeil zum Zuklappen (zugeklappt: Wetter, Cache-Restzeit, Kontext in Prozent).

Nach /compact, einem Klick auf „Compact“ oder Auto-Compact schreibt der Mod eine Zeile mit den Tokens vorher und nachher und darunter die Zusammenfassung in den Chat, als Log-Zeilen, die das Modell nicht mitliest. Lange Zusammenfassungen werden an Absätzen geteilt.

Die Cache-Laufzeit (5 Minuten oder 1 Stunde) lernt der Mod aus der Cache-Nutzung nach längeren Pausen und merkt sie sich; bis dahin gelten 5 Minuten. Die Auto-Compact-Schwelle liest er aus der Session aus, sonst nimmt er 83 % des Kontextfensters.

Installation (im Terminal): `claude --plugin-dir <Ordner>` für eine Sitzung, oder den Ordner über `CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json` für alle Projekte laden.
