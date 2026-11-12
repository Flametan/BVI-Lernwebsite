# prompt-polish

Ein Mod für Claude Code: ein Knopf direkt unter dem Eingabefeld, in der Zeile der Hinweise, im Look eines Live-Knopfs (pulsierender roter Punkt mit „LIVE“).

Ein Klick verbessert den Prompt, den du gerade eingetippt hast, nach Best Practices und den Prompting-Richtlinien von Anthropic: klare, direkte Aufgabe, nötiger Kontext, festgelegtes Ausgabeformat, XML-Tags bei gemischten Inhalten, Beispiele nur wenn nötig, bei Analysen die Bitte um Ergebnis, Annahmen und Begründung statt verdecktem Denken, Grenzen bei Aufgaben mit Nebenwirkungen. Deine Absicht, Namen, Pfade und Code bleiben unverändert, die Sprache auch. Der verbesserte Prompt ersetzt den Entwurf im Eingabefeld, abgeschickt wird er erst von dir. „↩ Original“ stellt den alten Entwurf wieder her.

Befehle mit `/` und leere Eingaben werden nicht verändert. Hast du während des Verbesserns weitergetippt, bleibt deine Eingabe unangetastet.

Installation (im Terminal): `claude --plugin-dir <Ordner>` für eine Sitzung, oder den Ordner über `CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json` für alle Projekte laden.
