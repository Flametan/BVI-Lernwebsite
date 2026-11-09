/* Update-Verlauf. Neueste Version zuerst; Änderungen eines Tages gehören in den Eintrag dieses Tages. Wird erst beim Öffnen des Verlaufs geladen. */
const CHANGELOG_ENTRIES=[
    {v:'3.2.3',ts:'2026-11-09T10:00',items:[
      'Account-Menü: Das Titelbild oben lässt sich jetzt ebenfalls ändern (Kamera-Symbol links oben im Banner) oder wieder entfernen; es wird wie das Profilbild über den Sync abgeglichen.',
      'Tour: Neue Schritte zum Account-Menü und zum Synchronisieren von Geräten (Code erzeugen, zweites Gerät per Code oder QR-Code verbinden). „Bild entfernen“ steht im Account-Menü jetzt neben dem Namen.',
      'Notizen: Gehört eine Notiz zu einer Seite, die es nicht mehr gibt (zum Beispiel nach dem Umbau der IdF-Lernseiten), sagt die Liste das jetzt, kopiert beim Antippen den Text und bietet × zum Löschen. Notizen auf der Startseite öffnen wieder die Startseite.',
    ]},
    {v:'3.2.2',ts:'2026-11-08T10:00',items:[
      'Das Rang-Abzeichen steht jetzt auf allen Seiten in der Kopfleiste (Tipp öffnet Rang & Abzeichen). Am PC liegen sie auf der Startseite unter der Lehrgangs-Cloud. Bei den Lernkarten fehlen Notiz und Lesezeichen in der Kopfleiste.',
      'Dunkles Design: Die Symbol-Animationen in der Navigationsleiste sind besser zu sehen (hellere hintere Karte bei den Lernkarten, Schein um das aktive Symbol, oranger Dampf beim Pausenraum).',
      'Neu: Account-Knopf auf der Startseite (neben der Suche) mit Profilbild, Namen, Sync-Status, Schnellzugriffen auf Sync, Einstellungen, Sicherung und Teilen sowie Schalter für das dunkle Design. Am Handy und Tablet sitzt in der Navigationsleiste jetzt der Pausenraum statt der Einstellungen; die Leiste bleibt anpassbar.',
      'App teilen: Neben dem QR-Code gibt es jetzt Knöpfe für WhatsApp, Telegram, SMS und E-Mail, dazu „Mehr …“ für das Teilen-Menü des Geräts.',
      'Neu: Sync ohne Konto. Über den Knopf neben der Suche erzeugst du einen Code (mit QR-Code zum Scannen oder zum Abtippen) und verbindest damit beliebig viele Geräte. Lernstand, Notizen, Textmarkierungen und Lesezeichen werden verschlüsselt abgeglichen; der Server sieht nur unlesbare Daten. Du erreichst es über den Anmelde-Knopf neben der Suche auf der Startseite.',
      'Kapitelfenster (Tablet/Desktop): Die Knöpfe „Vorheriges Kapitel“ und „Nächstes Kapitel“ stehen mittig nebeneinander, sind größer (grau und hell orange) und zeigen den Namen des Kapitels, das kommt (über die Seitengrenze hinweg den Namen der Seite). Am Desktop steht die Pfeiltaste ← bzw. → im Knopf. Am Handy zeigen die beiden Knöpfe den Namen als kleine zweite Zeile (bei langen Namen gekürzt).',
      'Kapitelfenster (Desktop): Der Text nutzt jetzt die Breite (bis 1280 px statt 780 px), der Zurück-Knopf steht bündig mit dem linken Textrand, und die Knöpfe „Vorheriges/Nächstes Kapitel“ unten sind kleiner und zurückhaltend (am Tablet auch). Die Pfeiltasten ← und → wechseln das Kapitel jetzt auch ohne Fokus-Lesemodus.',
      'Fokus-Lesemodus (Desktop): Mit den Pfeiltasten ← und → wechselst du zwischen den Kapiteln, auch über die Seitengrenze hinweg. Die Tasten stehen jetzt als Hinweis auf den Knöpfen „Vorheriges Kapitel“ und „Nächstes Kapitel“.',
      'Lernkarten (Tastatur): Pfeil hoch ist jetzt „schwer“ und Pfeil runter deckt die Karte auf (vertauscht). Die Pfeiltasten lassen die Karte außerdem wie die Knöpfe zur passenden Seite fliegen. Die Hilfe „Tastatur“ am Desktop zeigt die neue Belegung.',
      'Quiz: Der Buchstabe einer markierten Antwort (A, B, C …) bleibt lesbar. Er stand bisher in Orange auf orangem Grund und war unsichtbar; jetzt ist er dunkel auf orange, auf Handy, Tablet und Desktop.',
      'Desktop: Die schmale Seitenleiste klappt beim Darüberfahren nicht mehr auf. Sie wird breit, wenn du auf eine freie Stelle der Leiste klickst (nicht auf ein Symbol); verlässt die Maus die Leiste, wird sie wieder schmal. Mit der Tastatur (Tab) klappt sie weiter auf.',
      'Android-Startsymbol: Es wächst jetzt schneller mit der Serie. Ab 4 Tagen erscheint die Glut hinter der Flamme, ab 14 Tagen eine hellere Flamme mit Funken, ab 25 Tagen zusätzlich ein Ring (bisher 7, 30 und 100 Tage).',
      'Kapitel (Handy): Beim Blättern von einem Bereich in den nächsten verdeckte die Kopfleiste der Seite manchmal die Kopfzeile des Kapitelfensters, sodass Zurück-Knopf und „Kapitel 01 / 10“ mit Titel fehlten. Solange ein Kapitelfenster offen ist, bleibt die Kopfleiste jetzt ausgeblendet.',
      'Lernkarten: Eine Karte, die du mit „Schwer“ bewertest, zählt erst nach einer richtigen Antwort als gewusst. Das gilt für die Modul-Zahlen (z. B. 10/286), die Zahl „Gewusste“, „Dein Stand“ und den Zähler oben; schwere Karten stehen weiter unter „Nochmal“ und werden in der Zeile zusätzlich als „schwer“ gezählt.',
      'Lernkarten: Unter den Modul-Chips steht eine Auswahlzeile („Offen · 277 Karten“). Ein Tipp öffnet ein Blatt von unten mit fünf Auswahlen für das gewählte Modul: Offen (schwache, fällige und neue Karten), Neu, Nochmal (schwache Karten), Gewusste und Alle, jeweils mit Zahl. Das Blatt lässt sich nach unten wegziehen, oben gibt es wie bei einem Gummiband nach und federt zurück; am Handy sind die Zeilen flacher, damit alle Auswahlen in der unteren Bildschirmhälfte stehen, am Tablet und Desktop erscheint es als Fenster in der Mitte. Oben bleiben nur „Eigene Karte“ und „Markierte“. Die Auswahl wird gemerkt.',
      'Lernkarten: Eine Runde beginnt jetzt mit schwachen und fälligen Karten, danach kommen neue. Gewusste Karten warten auf ihren Wiederholungstermin und tauchen nicht mehr in jeder Runde auf. Neu in der obersten Reihe: „Gewusste“ (alle gewussten Karten gezielt wiederholen). Die Reihe hat jetzt vier Kacheln: Eigene, Nochmal, Markierte, Gewusste. Ist in einem Modul nichts fällig, führt ein Hinweis direkt zu „Gewusste wiederholen“.',
      'Lernkarten: Die drei runden Knöpfe haben jetzt dieselbe Rückmeldung wie das Wischen. Die Karte fliegt nach links (Nicht gewusst), nach oben (Schwer) oder nach rechts (Gewusst) und zeigt dabei den Stempel.',
      'Quiz (Lernmodus): Bei Multiple-Choice-Fragen mit nur einer richtigen Antwort löst ein Tipp auf eine Antwort nicht mehr sofort auf. Die Antwort wird nur markiert (und lässt sich ändern), aufgelöst wird erst mit „Antwort prüfen“. Mit der Tastatur wählen die Tasten 1 bis 4 aus, die Leertaste prüft.',
      'Lernkarten (Tablet): Die Antwort-Knöpfe sitzen direkt unter der Karte statt fest am unteren Bildschirmrand; nur am Handy bleiben sie über der Tab-Leiste angeheftet.',
    ]},
    {v:'3.2.1',ts:'2026-11-07T10:00',items:[
      'Lernkarten: Der Knopf „Fehler oder Unklarheit melden“ (Flaggen-Symbol) sitzt jetzt oben in der Kartenzeile und schickt Frage und Antwort der aktuellen Karte mit; die Zeile am Seitenende lag hinter den Antwort-Knöpfen.',
      'Lernkarten: Der Stern zum Markieren sitzt auf beiden Seiten der Karte oben rechts und dreht sich beim Umdrehen mit.',
      'Pausenraum: Der Platzhalter beim Laden zeigt jetzt das Kachel-Raster der echten Ansicht (breite Einsatzfahrt, vier Kacheln, Fragenquelle, zweite Gruppe) statt eines allgemeinen Rasters; er passt auf Handy, Tablet und Desktop.',
      'Lernkarten: Der Einleitungstext oben ist weg. Die drei Kacheln „Eigene Karte“, „Nochmal üben“ und „Markierte“ sind einheitlich aufgebaut (Symbol, Name, Zahl) und nichts ragt mehr über den Rand.',
      'Lernkarten: Wischen nach oben zählt jetzt zuverlässig als „Schwer“ (auch auf dem Handy; bisher brach der Browser die Geste ab). Wischen geht auch, bevor die Karte aufgedeckt ist. Die Antwort-Knöpfe sind immer sichtbar und sitzen am Handy und Tablet fest über der Tab-Leiste, direkt unter der Karte; sie funktionieren auch ohne vorheriges Aufdecken.  Die Seite springt nicht mehr beim Zudecken. Die Antwort-Knöpfe sind 48 px groß; „Schwer“ sitzt über dem mittleren Tab-Knopf, „Nicht gewusst“ und „Gewusst“ tiefer daneben, nichts wird vom Tab-Knopf überdeckt. Beim Start der Karten (nicht beim Wechsel eines Filters) scrollt die Seite so, dass die Modul-Chips oben stehen und die Karte direkt darunter folgt (ohne Lücke).',
      'Dienstgrade: Im Mittleren Dienst kommt „Hauptbrandmeister mit Amtszulage“ (ab 550 Punkten) dazu, im Gehobenen Dienst „Brandamtsrat“ (ab 3000 Punkten). Beide tragen vier Sterne auf der Schulterklappe.',
      'Dienstgrade: Das Schulterstück ist neu gezeichnet. Es hat eine gedrehte Kordel mit Metallverlauf in Rot, Silber oder Gold, Tuch mit feinem Gewebe, Naht, Sterne für den Rang und einen Knopf mit Flamme. Der Gehobene Dienst trägt eine zweite Innenkordel, der Höhere Dienst Eichenlaub an Ober- und Unterkante. Es erscheint auf der Startseite, in der Rangliste und im Wochen-Bild zum Teilen.',
      'Lernkarten: Oben stehen flache Kacheln für „Eigene Karte“, „Nochmal üben“ und „Markierte“ mit der Zahl der Karten. Der Stern zum Markieren sitzt direkt auf der Karte. Nach dem Umdrehen gibt es drei runde Knöpfe: Nicht gewusst, Schwer (nach oben versetzt) und Gewusst. „Schwer“ geht auch durch Wischen nach oben, beim Wischen steht der Stempel („Gewusst“, „Nicht gewusst“, „Schwer“) direkt auf der Karte. Schwer und Nicht gewusst landen in „Nochmal üben“.',
      'Pausenraum: Die Spiele stehen als Kachel-Raster mit großen Symbolen. Die Einsatzfahrt ist breit und hervorgehoben, Rekorde erscheinen als kleine Etiketten auf den Kacheln. Zwei Gruppen: „Feuerwehr“ und „Wissen und Rätsel“ (mit der Wahl der Fragenquelle). Auf dem Tablet sind es drei, am PC vier bis fünf Spalten; am PC ist die Einsatzfahrt zwei Spalten breit und zwei hoch.',
      'Stundenplan und Prüfung: Die Beschreibung unter der Überschrift entfällt, der Leerraum darunter ebenfalls.',
      'Prüfung (Handy): Der Tab ist aufgeräumt. Ein Umschalter „Wichtig | Module“ zeigt entweder die mit Stern markierten Prüfungen (die Laufbahnprüfung steht ganz oben) oder die Module zum Aufklappen; geöffnet ist das Modul der nächsten Klausur. Auswahl und geöffnete Module merkt sich die App. Der Countdown oben ist auf dem Handy nur noch eine flache Zeile (Zahl, Datum und kleiner Knopf; der Name der Prüfung entfällt), und die Erklärung zum Stern steht ganz unten auf der Seite. Auf Tablet und PC steht „Wichtig“ links (beim Scrollen mitlaufend) und rechts die aufklappbaren Module, mehrere gleichzeitig.',
      'Android-App: Mit einem Serien-Schutz bleibt es am Abend (ab 18 und ab 21 Uhr) bei der schwächeren Flamme, dazu kommt ein Schild in dunklem Flammenton mit hellem Rand und Haken: Die Serie ist abgesichert. Bei langer Serie wächst das Startsymbol: ab 7 Tagen mit Glut hinter der Flamme, ab 30 Tagen mit hellerer Flamme und Funken, ab 100 Tagen zusätzlich mit einem Ring.',
      'Android-App: Droht die Serie ab 18 Uhr zu reißen (du hast heute noch nicht gelernt), wird die Flamme am Startsymbol kleiner und blasser, ab 21 Uhr nur noch halb so groß und grau. Sobald du wieder lernst, ist sie wieder groß und kräftig; ist die Serie gerissen, erscheint das normale Symbol. Dafür ist die neue App-Version nötig.'
    ]},
    {v:'3.2.0',ts:'2026-11-06T10:00',items:[
      'Alle Bilder in den Lernseiten (Armaturen und Atemschutz) sind jetzt eigene Zeichnungen (SVG) mit allen Texten und Zahlen. Sie passen sich dem Design an (dunkel, hell, beige), lassen sich vergrößern und sind viel kleiner als die bisherigen Fotos.',
      'Lernseiten: Tabellen, die in die Breite passen, lassen das Wischen zum nächsten oder vorherigen Kapitel durch (breite Tabellen scrollen weiter selbst).',
      'Serie nach Duolingo-Vorbild: Die Flamme leuchtet erst, wenn du heute gelernt hast; abends ab 18 Uhr ohne Lernen wird die Zahl rot. Alle 7 Tage Serie erhältst du einen Serien-Schutz (bis zu 2), der einen verpassten Tag automatisch überbrückt. Meilensteine bei 7, 30, 100 und 365 Tagen werden gefeiert',
      'Bildansicht: Wenn du ein Bild oder Schaubild vergrößerst und wieder schließt (Tippen, ✕, Esc oder Zurück-Taste), bleibst du jetzt auf der Seite und im Kapitel, statt eine Ebene zu weit zurückzuspringen.',
      'Schaubilder passen sich dem Design an: Im hellen und beigen Design sind sie jetzt hell, in der Farbe der Karten, mit dunkler Schrift und kräftigeren Farben. Im dunklen Design bleibt alles wie bisher. Auch die vergrößerte Bildansicht hat im hellen und beigen Design einen hellen Hintergrund statt Schwarz.',
      'Laufbahnprüfung: Statt eines Fensters erscheint nur ein Passwortfeld genau über der angetippten Zeile, das wie die Suche aus dem Knopf herauswächst und rechts einen Enter-Knopf hat. Ein falsches Passwort lässt das Feld rot wackeln, das richtige zeigt einen grünen Haken und öffnet die Seite.',
      'Lernseiten: „Nächstes Kapitel“ und „Vorheriges Kapitel“ gehen jetzt über das Seitenende hinaus. Nach dem letzten Kapitel öffnet sich die nächste Seite der Übersicht, zurück genauso.',
      'Lernseiten (Touch): Mit einem Wisch nach links oder rechts wechselst du das Kapitel, wie bei den Lernkarten. In scrollbaren Tabellen und Schaubildern scrollt der Wisch weiter wie gewohnt; senkrechtes Wischen, Zoomen und Antippen von Bildern bleiben unverändert.',
      'Lernseiten: Im Kapitelfenster verdeckt der Zurück-Knopf der Kopfleiste (mit dem Seitentitel) die Überschrift nicht mehr.',
      'Schneller: Die App startet auf Tablets etwa dreimal so schnell. Bilder sind kleiner (WebP) und laden erst beim Lesen, Lernseiten werden erst beim Öffnen aufgebaut, Update-Verlauf, Szenarien und Fallbearbeitung laden erst bei Bedarf, und Spiele, Simulationen und Bilder für den Offline-Betrieb kommen nach dem Start im Hintergrund.',
      'Service Worker: Bei langsamer Verbindung erscheint die gespeicherte Seite nach 1,5 Sekunden statt nach 3; ein fehlendes Bild oder Spiel bricht die Installation nicht mehr ab.',
      'App-Tour: Neuer Schritt zur Einstellung „Navigationsleiste“ (Reihenfolge der Plätze, geteilte Plätze, Mittelknopf).',
      'Ladebildschirm: Das Skeleton der Startseite passt auf Tablet und PC zum neuen Aufbau (2. Ausbildungsjahr groß in zwei Spalten, 1. Jahr kompakt darunter).',
      'Einstellungen: Der Knopf „Freiwillige Spende“ ist wieder lesbar (dunkle Schrift auf der Akzentfläche, vorher im dunklen Design unsichtbar).',
      'Startseite (Tablet und PC): Das 2. Ausbildungsjahr steht groß in zwei Spalten, das 1. Jahr folgt kompakt darunter. Bei Münster steht jetzt „VB & Stabsarbeit“ statt „Brandschutz“.',
      'Desktop: Die schmale Seitenleiste klappt beim Darüberfahren über den Inhalt auf (mit Namen der Bereiche). Der Pin zum Anheften ist in der schmalen Leiste nicht mehr zu sehen und erscheint erst beim Aufklappen.',
      'Einstellungen: Das Suchsymbol sieht jetzt aus wie auf der Startseite (gleiche Größe, Farbe und Lupe) und sitzt bei jeder Breite an derselben Stelle.',
      'Wochen-Rückblick: „Teilen“ und „Bild speichern“ funktionieren jetzt in der Android-App (Teilen-Menü mit WhatsApp und Instagram, Bild landet in Bilder/B VI) und zeigen immer eine Rückmeldung. Dafür ist die neue App-Version nötig.',
      'Das aufgeklappte Belohnungsfeld auf der Startseite reicht auf Tablet und PC immer bis zum Rand.',
      'Serie: Flamme und Puls-Ring sind orange, sobald eine Serie läuft (auch wenn du heute noch nicht gelernt hast), und nur ohne Serie grau.',
      'Ladebildschirm: Auf Tablet und PC entspricht das Skeleton der Startseite jetzt dem neuen Aufbau (Cloud und Spende, Wochenübersicht, Lernstoff mit beiden Ausbildungsjahren). Auch auf dem Handy sitzen „Lernstoff“ und die Serie wie in der App.',
      'Tablet: Die Startseite ist neu angeordnet. Die Standorte beider Ausbildungsjahre stehen nebeneinander über die volle Breite und laufen nicht mehr seitlich aus dem Bild; „Lernstoff“ und die Serie sitzen darüber.',
      'Belohnungsfeld: Der extra Knopf „Rang & Abzeichen“ entfällt, die Rang-Zeile oben führt dorthin.',
      'Wochen-Rückblick: Wird jetzt als Bild im Story-Format geteilt (WhatsApp, Instagram und andere Apps) oder gespeichert. Ein Tipp auf den Rang im Belohnungsfeld öffnet „Rang & Abzeichen“.',
      'Der Tropfen bei neuen Abzeichen und Beförderungen lässt sich antippen: Er öffnet „Rang & Abzeichen“ und zeigt deinen aktuellen Dienstgrad.',
      'Die Flamme der Serie pulsiert: grau, solange du heute noch nicht gelernt hast, orange bei aktiver Serie. Die App-Tour zeigt die Serie jetzt in einem eigenen Schritt.',
      'Schriftgröße: Der Regler arbeitet jetzt stufenlos (statt in vier Sprüngen); die Anzeige nennt die Größe in Prozent.',
      'Neu: Belohnungen. Neben „Lernstoff“ auf der Startseite zeigt ein Flammen-Symbol deine Lern-Serie. Antippen klappt Dienstgrad, Tagesaufgaben, Einsatz-Alarm der Woche und Lernpfad auf. In den Einstellungen kannst du die Belohnungen ausschalten.',
      'Neu: Dienstgrade von Brandmeister bis Leitender Branddirektor (mittlerer Dienst rot, gehobener Dienst silber, höherer Dienst gold). Punkte gibt es für Lernkarten, Quizfragen und Einsatzfahrten.',
      'Neu: Abzeichen mit Titeln, Combo bei richtigen Antworten in Folge mit Konfetti, neue Abzeichen erscheinen als kleiner Tropfen oben und ein Wochen-Rückblick zum Teilen.',
      'Einsatzfahrt: Bei der Auswahl 5, 10 oder 15 Fragen steht jetzt, wie viele Fehler erlaubt sind (statt der Zeit-Chips), z. B. „1 Fehler erlaubt · ab dem 2. Fehler kommst du zu spät“.',
      'Suche: Auf allen Unterseiten (Lehrgang, Themen-Übersichten, Lernseiten) steht oben rechts eine Lupe. Sie sucht in dieser Ebene und in den Ebenen darunter.',
      'Suche: Auf jeder Ebene wird nur der Inhalt dieser Seite durchsucht (im IdF-Tab nur IdF, in Stabsarbeit nur Stabsarbeit). Ein Feld „Suche in …“ im Suchfeld zeigt den Bereich; mit ✕ suchst du überall.',
      'Startseite: Oben rechts steht jetzt eine Lupe statt des Kastens „nächste Einheit“. Antippen: Das Suchfeld wächst aus dem Symbol, die Tastatur öffnet sich sofort, mit ✕ löschst du, Esc oder Zurück schließen. Die nächste Einheit findest du im Stundenplan.',
      'Einstellungen: Der Titel „Einstellungen“ bricht nicht mehr vor dem letzten Buchstaben um. Das Tagesziel stellst du weiter unter „Lernen & Erinnerung“ ein; der Lernzeit-Graph übernimmt es sofort.',
      'Lernzeit-Graph: Das Tagesziel steht als Rahmen hinter jedem Tag (Woche); wer das Ziel schafft, bekommt ein ✓ über dem Balken. Darunter steht die durchschnittliche Lernzeit pro Tag (Woche: bis heute, Monate: laufender Monat).',
      'Tour: Der Spotlight bei „Dein Lernstoff“ und „Deine Lernzeit“ sitzt wieder genau auf dem Bereich (die Seite scrollte weich und wurde währenddessen vermessen). „Überspringen“ entfällt; oben rechts auf der Karte beendet ein ✕ die Tour.',
      'Tour (andere Lehrgänge): Neuer Schritt zu Export und Import der Lehrgangsdaten.',
      'Tour: Kein Neuladen und kein verzögertes Verschieben des Spotlights mehr bei „Weiter“. Die Seite wird nur noch gewechselt, wenn der nächste Schritt auf einer anderen Seite liegt; dann blendet der Rahmen erst am Ziel ein.',
      'Weitere Hinweise als Gooey Drop, selten und nur, wenn gerade nichts anderes läuft: Tagesziel erreicht, „Tag N in Folge“, neuer Rekord bei Minesweeper, Solitär und Snake (ersetzt dann den Glückwunsch), Countdown zur Prüfung (100, 50, 30, 14, 7 Tage), „Serie in Gefahr“ am Abend und „Willkommen zurück“ nach mehreren Tagen Pause. Unter Einstellungen lassen sich diese „Kleinen Hinweise“ ausschalten; Prüfungs-, Spiel- und Kartenmeldungen bleiben. Außerdem funktioniert die Lernpfad-Karte wieder (sie fand die Standorte nicht).',
      'Gooey Drop kommt öfter: Nach einer Prüfung (Quiz-Prüfung, Klausurfragen) oder einem Spiel (Einsatzfahrt, Minesweeper, Solitär, Snake, Duell) gibt es einen Glückwunsch, zufällig aus 40 Texten. Bei den Lernkarten kommt alle 10 Karten am Tag eine Motivation, die mit jeder Stufe (10, 20, 30 … Karten) kräftiger wird; auch hier wechseln die Texte.',
      'Meldungen („Gooey Drop“): lebendigere Animation. Der Tropfen fällt, beim Aufprall laufen Wellen nach außen, das Symbol springt heraus, die Überschrift erscheint Zeichen für Zeichen, ein Glanz streift über die Meldung, am Ende löst sie sich auf. Antippen öffnet wieder zuverlässig „Rang & Abzeichen“.',
      'Lernkarten: Die Zahlen auf den Filter-Reitern (z. B. „Laufbahn 12/286“) zählen jetzt sofort mit, wenn du Karten bewertest, auch beim Üben neben der Lernseite.',
      'Lernkarten: Fragen wie „Welche Aussagen sind richtig?“ (Brandwände, Schulbau, Verkaufsstätten, Bestandsschutz, Krisenstab, Einsatztagebuch) nennen jetzt die gefragten Punkte direkt, sodass sie ohne Antwortliste lösbar sind.',
      'Lernkarten: Fragen, die nur nach dem Gegenteil fragten („Was ist kein Schutzziel …?“, „Was gehört nicht in …?“), sind positiv und beantwortbar umformuliert (§ 14 MBO, Personalfaktor, Verfassungsorgane, Verhältnismäßigkeit, Beamtenverhältnisse, Disziplinarrecht). Die Folgefragen der sechs Fälle nennen jetzt den Sachverhalt, sodass sie ohne die Vorkarte lösbar sind.',
      'Ladebildschirm: Das Skeleton der Startseite zeigt jetzt Schulterstück, Serie und Jahr-Schalter wie die neue Startseite; oben rechts sitzt auf dem Handy der runde Such-Knopf.',
      'Dienstgrad „Leitender Branddirektor“: Die vier Punkte auf dem Schulterstück haben jetzt Abstand zum Rand.',
      'Animationen lassen sich nicht mehr reduzieren: Die Rücksicht auf die Geräte-Einstellung „Bewegung reduzieren“ ist entfernt, alle Animationen laufen immer.',
      'Startseite: Der Jahr-Schalter (2. Jahr / 1. Jahr) hat eine gleitende Pille mit weicher Animation; die Standort-Karten blenden beim Wechsel sanft ein. Statt „Lernstoff“ steht links jetzt dein Dienstgrad als Schulterstück (am schmalen Handy nur das Symbol, der Name erscheint, sobald genug Breite da ist; Antippen öffnet Rang & Abzeichen).',
      'Lernkarten: Sind alle Filter (Laufbahn und alle Standorte) gewählt, bleibt die Auswahl bestehen und nichts wird mehr abgewählt.',
      'Lernkarten: Die „Alle“-Erkennung bei den Standort-Filtern ist entfernt; jeder Filter zeigt nur noch seinen eigenen Zustand.',
      'Lernkarten: Wählt man alle Standorte nacheinander an, bleiben sie jetzt alle ausgewählt (vorher erloschen alle Filter). Ein erneuter Tipp nimmt einen Standort wieder heraus.',
      'Desktop und Touch: Tippt oder klickt man bei der schmalen Seitenleiste auf ein Symbol, bleibt sie schmal und klappt nicht auf. Erst beim erneuten Darüberfahren erweitert sie sich wieder.',
      'Startseite (Handy): Der Abstand zwischen dem Datum und der Zeile „Lernstoff“ mit der Serie ist halbiert.',
      'Startseite: Die Lücke zwischen „Lernstoff“ und den Standort-Karten ist halbiert.',
      'Startseite: Über dem Lernstoff steht eine leuchtende Karte „App kennenlernen“ mit der Tour. Nach der Tour (oder mit dem ✕) verschwindet sie; die Tour bleibt in den Einstellungen unter „App vorstellen“.',
      'Tour (Master-Lehrgang): Neuer Schritt zur Laufbahnprüfung – die Eingrenzungen mit Lösungen, die gerne verbessert werden dürfen.',
      'Neu: „App vorstellen“ in den Einstellungen – eine Tour mit Spotlight durch die Startseite, alle Tabs, die Lernkarten (Karte, Antwort, Filter) und die Einstellungen (Lehrgang, Aussehen, Lernen & Erinnerung, Daten & Werkzeuge). Mit Weiter, Zurück, Überspringen oder Esc.',
      'Einsatzfahrt: Am Anfang wählst du jetzt 5, 10 oder 15 Fragen (wie beim Duell) statt zwischen Hauptstraße und Ring. Fahrzeit und Hilfsfrist wachsen mit der Anzahl: 5 Fragen 6:00 / 6:30, 10 Fragen 11:00 / 11:30, 15 Fragen 16:00 / 16:30; falsch +30 s, richtig −5 s.',
      'Suche: Ohne Eingabe steht nur das Suchfeld da; die Fläche darunter erscheint erst beim Tippen.',
      'Einstellungen: Die Lupe hat etwas Abstand zum Rand, und das Suchfeld wächst aus dem Symbol heraus. Die Zeile „Navigationsleiste“ hat nur noch einen Pfeil.',
      'Prüfung: Nur die „Laufbahnprüfung“ hat noch einen Farbverlauf. Bei allen anderen steht stattdessen ein kleiner Stern in der Zeile (gefüllt = wichtig für Einsatzfahrt und Lernkarten). In anderen Lehrgängen tippst du den Stern direkt an, um Prüfungen als wichtig zu markieren oder abzuwählen.',
      'Ladebildschirm (Skeleton) auf jeder Seite ans neue Aussehen angepasst: Startseite mit Standort-Karten, Einstellungen (fünf Karten), Prüfungsliste, Lernseiten mit Kapitelkarten, Themenraster; am PC mit der schwebenden Seitenleiste. Dazu Platzhalter für Lernkarten, Pausenraum und eingebettete Seiten. „Bewegung reduzieren“ schaltet das Schimmern ab.',
      'Startseite: Der Jahr-Umschalter ist jetzt klein (rechts neben „Lernstoff“ als „2. Jahr | 1. Jahr“) und braucht kaum noch Platz.',
      'Startseite: Die Standorte sind wieder einzelne Karten mit Prozent im Ring und passenden Farben.',
      'Startseite: Die Standort-Liste passt jetzt zum Rest der App (eine Karte mit Trennlinien, Umschalter wie bei „Woche / Monate“) und zeigt den Fortschritt in Prozent.',
      'Update: Mit der neuen Version lädt die App alle Seiten neu, damit auch die aufgeräumten Einstellungen erscheinen.',
    ]},
    {v:'3.1.5',ts:'2026-11-05T09:00',items:[
      'Startseite: Die Karte „Los geht\'s“ (Weiterlernen) ist entfernt.',
      'Startseite: Die Standorte stehen jetzt als Liste mit Umschalter „2. / 1. Ausbildungsjahr“ (Handy). Jede Zeile zeigt Ring, Ort, Fortschrittsbalken und Prozent und öffnet den Standort.',
      'Einstellungen (Handy): aufgeräumter. Acht Gruppen sind jetzt fünf (Aussehen, Lernen & Erinnerung, Daten & Werkzeuge …), die Karten sind kompakter, Rückgängig/Wiederholen und Suche sitzen als kleine Symbole oben rechts, die Navigationsleiste hat eine eigene Seite und die Spende ist eine Zeile, die sich aufklappen lässt.',
      'Prüfung: Die Zeile mit dem Farbverlauf heißt jetzt „Laufbahnprüfung“. Untertitel sind auf zwei Zeilen begrenzt.',
      'Kleinigkeiten: Keine Schrift mehr unter 12 px, Startseite (Handy) ohne extra Datumszeile, „Bewegung reduzieren“ schaltet alle Animationen ab.',
      'Lernseiten: Auf den Übersichten von IBK, VAk, FeuAK und IdF fehlt die Prüfungskarte (Simulator, Klausurvorbereitung, Altklausur-Quiz), weil es sie schon unter „Prüfung“ gibt.',
      'Prüfung: „Laufbahn“ gibt es nur im Master-Jahrgang. Das Passwortfeld öffnet sich beim Antippen als Fenster über der Seite.',
      'Prüfung: „Laufbahn“ steht ganz oben und hat den Farbverlauf (statt der Juni-2026-Klausuren). ',
      'Desktop: Die Seitenleiste ist jetzt eine „Premium Sidebar“ – eine schwebende, abgerundete Leiste nur mit Symbolen. Beim Darüberfahren erscheint der Name des Tabs als Sprechblase neben dem Symbol. Mit dem Pin lässt sie sich wie bisher ganz anheften.',
      'Laufbahn: Industriebau kommt nicht mehr vor (Konzept „Logistikhalle“ sowie die zugehörigen VB-Fragen und -Lernkarten entfernt).',
      'Suche: Beim Öffnen zieht sich der runde Knopf zur Suchleiste auf und der Platzhalter wird getippt. Die Vorschläge fallen beim Tippen nacheinander ein, Treffer sind fett. Mit dem ✕ fallen die Buchstaben weg. Beim Absenden dreht sich das Symbol, Platzhalter-Zeilen schimmern und die Treffer blenden ein.',
      'Themenübersichten: Die Karten bauen sich ebenfalls nacheinander auf.',
      'Lernkarten: Beim Umdrehen hebt sich die Karte kurz an und dreht sich mit Tiefe (Flip with depth). Beim Wischen folgt die Karte dem Finger, neigt sich bis 12° und wird bei Schwung weggeschnippt (Follow, then fling).',
      'Lernseiten: Die Kapitelkarten einer Lernseite bauen sich nacheinander auf (Cascade, don\'t dump).',
      'Einstellungen: Die Schriftgröße wird jetzt mit einem Schieberegler (vier Stufen, mitlaufende Wertmarke) eingestellt statt mit vier Knöpfen.',
      'Einstellungen: Bei „Navigationsleiste“ fehlt der Pfeil rechts nicht mehr.',
      'Lernseiten (Tablet/PC): Die Kapitelübersicht steht wieder mittig auf der Seite.',
      'Lernseiten (Tablet/PC): Im geöffneten Kapitel ist der Zurück-Knopf zur Übersicht oben links wieder sichtbar.',
    ]},
    {v:'3.1.4',ts:'2026-11-03T09:00',items:[
      'Startseite: Die Zeilen „Lernkarten“ und „Pausenraum“ sind entfernt (beides bleibt über die Navigation erreichbar). Am Desktop und am Tablet im Querformat entfallen oben das B-VI-Zeichen sowie Prüfung und Einstellungen (erreichbar über die Seitenleiste).',
      'Lernseiten: Kapitelübersicht (Titel, Kopfleiste, Kapitelkarten) ist am Tablet und PC jetzt genauso breit wie die Themenübersicht davor.',
      'Lernseiten: Kapitel-Fenster reicht nach dem Drehen aufs Querformat wieder bis zum unteren Rand (vorher blieb ein Streifen der Seite darunter sichtbar).',
      'Desktop-Seitenleiste: Symbole wie in der Tab-Leiste am Handy – das aktive Symbol ist ausgefüllt und jedes Symbol hat beim Antippen seine kleine Animation.',
      'Desktop: am Rand steht immer ein schmaler Balken mit den Symbolen; er klappt zur vollen Seitenleiste auf, sobald die Maus darüber fährt (kein Hamburger-Knopf mehr).',
      'Rechnungswesen (FeuAK): Buchungsbelege 8 Jahre aufbewahren (seit 2025), Bücher, Konten, Inventare und Jahresabschlüsse 10 Jahre.',
      'Tab-Leiste: der Punkt unter dem aktiven Symbol ist entfernt.',
      'Stundenplan KW 50 (Zivile Verteidigung): das BABZ-Programm vom 30.10.2026 eingetragen (Montag bis Donnerstag mit Referenten, Pausen und Exkursion GMLZ, Abreise Donnerstag ab ca. 15:30); in der BABZ-Woche gibt es keine automatische Mittagessen-Zeile mehr.'
    ]},
    {v:'3.1.3',ts:'2026-11-02T09:00',items:[
      'Lernseiten an die neue Zusammenfassung (V3.0) angepasst: IBK, VAk, FeuAK und IdF (Vorbeugender Brandschutz, Stabsarbeit, Presse, Zivile Verteidigung, EU-Katastrophenschutz).',
      'Je Unterpunkt der Zusammenfassung ein eigener Tab, gefüllt mit den Unter-Unterpunkten als Kapitel; vorhandene Inhalte bleiben erhalten und stehen jetzt im passenden Tab.',
      'Neue Tabs: IBK Führen von Gruppen, Führung, Autoritäten, Führungsstile, Onboarding; VAk Lernarbeitsblatt Berlin; FeuAK BWL, Rechnungswesen, Prüfungsleistung, Lernarbeitsblätter Hamburg; IdF eigene Tabs für 4.1–4.7, 5.1–5.5, 6.1–6.2, 7.1–7.11 und 8.1–8.3.',
      'Neue Schaubilder (zum Vergrößern antippen), aus dem Lerntext gebaut.',
      'NRW-Recht (BHKG, OBG, LDG, LBG) im VAk-Reiter ergänzt, da danach geprüft wird.',
      'Die alte Gesamtseite „Stabsarbeit“ wurde in die Tabs 5.1–5.5 übernommen.',
      'Korrekturen: keine Gliederungsnummern mehr in den Überschriften, Überschrift und Kapitelliste in einer Spalte, Kapitelfenster ohne leere Zeile oben, breiterer Fokus-Modus (Fokus-Knopf bei geöffnetem Kapitel funktioniert jetzt), Tab IBK Projektarbeiten entfernt, eigene Symbole für neue Hub-Karten.',
      'Schaubilder: im hellen und beigen Design wieder gut lesbar (feste helle Schrift auf dunklem Grund), blasse Schriftfarben aufgehellt; am Handy bleibt die Schrift lesbar (seitlich wischen oder antippen zum Vergrößern).',
      'Tab-Leiste (Handy/Tablet): „Icon Fill“ – das aktive Symbol füllt sich von der Mitte aus mit der Akzentfarbe, springt kurz und bekommt einen Punkt; beim Antippen hat jedes Symbol eine eigene kleine Animation (Haus hüpft, Kalender schwingt, Häkchen wird gezeichnet, Tasse kippt, Karten mischen, Zahnrad dreht).',
      'Einsatzfahrt, Quiz und Lernkarten nur noch aus Prüfungen mit Farbverlauf (IBK: Transaktionsanalyse, Konfliktmanagement): 8 „Ergänzung“-Fragen aus dem IdF-Quiz, 10 FeuAK-Fragen aus nicht hervorgehobenen Prüfungen und 3 Lernkarten ohne Prüfungsbezug entfernt.',
      'Tab-Leiste: Zahnrad bleibt in der Mitte frei, der Dampf der Tasse steigt auf und neuer kommt aus der Tasse, die Lernkarten wechseln zweimal Vorder- und Hintergrund (hintere Karte dunkler), zwei Symbole auf einem Platz tauschen zweimal die Plätze; der Mittelknopf kann wieder zwei Symbole teilen.',
      'Desktop-Startseite: Marke (Flamme, B VI), Knopf „Prüfung“ und Zahnrad für die Einstellungen oben rechts; im Drawer steht der Pin jetzt auf Höhe des X.',
      'Desktop: Seitenleiste jetzt als Side Drawer – Hamburger-Knopf oben links, der Drawer federt herein, die Einträge laufen nacheinander ein. Mit dem Pin lässt er sich anheften (dann wie bisher feste Seitenleiste); die Einstellung wird gemerkt.',
      'Einheitliches Design: auch Tabs mit nur einem oder zwei Kapiteln zeigen jetzt die Kapitelkarten (vorher aufgeklappt und über die volle Breite).',
      'Speiseplan IdF Münster für 02.–06.11.2026 ergänzt.',
      'Warn-Simulation jetzt im Tab 7.9 (Warnung durch den Bund), Pressegespräch-Simulation im Tab 6.2; beide nicht mehr auf der IdF-Startseite.'
    ]},
    {v:'3.1.2',ts:'2026-11-01T09:00',items:['Vorbeugender Brandschutz: neuer Gebäudeschnitt zu den Türen (T30-RS, RS, DS, DSS) vom notwendigen Treppenraum in jede Nutzung.','Alle Tabellen in den Lernseiten geprüft: am PC und Tablet nirgends mehr zu breit, Nummernspalten brechen nicht um, Kopfzeilen deutlich lesbarer; am Handy breitere Begriffsspalte und stimmige feste erste Spalte.','IdF-Quiz „Aussagen aus Sicht von Bauherren oder Planern“ und zugehörige Lernkarte korrigiert (richtig: B, C, D, E).','Lernseiten am PC: Der Üben-Modus verdeckt das Kapitel nicht mehr, und oben links erscheint kein doppelter Knopf mehr.',
      'Platzhalter-Bildschirm beim Laden passt sich an Handy, Tablet und PC an (Tab-Leiste oder Seitenleiste, ein bis drei Spalten) und an die geöffnete Seite (Startseite, Stundenplan, Liste, Themenübersicht, Lernkarten, Lernseite)',
      'Startseite: „Lernkarten“ und „Pausenraum“ stehen wieder beide sichtbar untereinander in einer Karte (am PC und Tablet war „Lernkarten“ verdeckt)',
    ]},
    {v:'3.1.1',ts:'2026-10-31T09:00',items:[
      'Navigationsleiste: Start steht immer ganz links und lässt sich nicht verschieben oder entfernen (kann aber einen Platz mit einem zweiten Tab teilen)',
    ]},
    {v:'3.1.0',ts:'2026-10-30T09:00',items:[
      'Lernkarten: Feuerwiderstand überall in beiden Schreibweisen, z. B. „REI 30 (F 30)“',
      'Einstellungen → Navigationsleiste: Platz in der Vorschau antippen und per Dropdown den Tab wählen oder zwei Tabs auf einem Platz zusammenlegen (Auswahl beim Antippen, Symbol aus beiden Tabs mit Schrägstrich); fünf Plätze, der Mittelknopf bleibt in der Mitte, die Einstellungen immer rechts; es müssen nicht alle sechs Tabs in der Leiste stehen; Zurücksetzen',
      'Lernkarten: Modul-Auswahl (Alle, IBK, VAk, FeuAK, IdF) steht in einer Reihe; Symbol des Tabs „Pause/Karten“ nicht mehr abgeschnitten',
      'Gebäudeklassen-Baukasten: Prüf-Quiz ohne Hochhaus als Antwortoption und ohne Hochhaus-Fälle',
      'Abkürzung für Oberkante Fertigfußboden einheitlich OKFF (statt FOK)',
      'Version 3.1: Stabsarbeit in fünf Reiter, neue IdF-Tabs (Zivile Verteidigung, EU-Katastrophenschutz), Simulationen (Sonderbauten, Stab aufbauen, Pressegespräch, Warn-Simulation), Gebäudeklassen-Baukasten mit MBO-Katalog, neue Lernkarten nur zu den Prüfungen, Tab „Pause/Karten“',
      'Startseite: neuer Reiter „Pausenraum“ unter den Lernkarten',
      'Simulationen (Sonderbauten, Stab aufbauen, Pressegespräch, Warn-Simulation) bekommen beim Besuch einen Haken und zählen zum Themenfortschritt',
      'IdF → Stabsarbeit: „Stab aufbauen (Simulation)“ steht jetzt direkt hinter „Werkzeuge der Stabsarbeit“ und vor der Taschenkarte',
      'IdF: Taschenkarte Stabsarbeit steht jetzt als letzter Reiter in der Stabsarbeit; Planspiel-Trainer, Eskalationsleiter und „Lernunterlagen und Prüfungshinweise“ wieder entfernt',
      'Neue Simulationen (IdF): Stab aufbauen mit Vordruck-Trainer (Stabsarbeit), Pressegespräch, Eskalationsleiter Zivile Verteidigung, Warn-Simulation und Planspiel-Trainer mit eigenen Szenarien (Erkundung, Lagebeurteilung, Organisations- und Kommunikationsschema, Aufträge)',
      'Krisenstab: Grafiken zu Aktivierungsprozess, erster Verwaltungsstabssitzung (mit modifizierter Eisenhower-Matrix und Auftragsliste) und Folgesitzungen nachgebaut; Quiz-Frage 49 und Karte zur Zusammenlegung der Sachgebiete um „S4 mit S1“ und „S2 mit S3“ ergänzt',
      'Vorbeugender Brandschutz: Grafik „Türen im Gebäude“ (T30-RS, DS, DSS, RS je Nutzung) nachgebaut und in die Lernseite eingefügt',
      'IdF-Lernseiten: wichtige Grafiken der Zusammenfassung als eigene Diagramme nachgebaut (Zwei-Stäbe-Modell, Aufbau der Einsatzleitung, Krisenstab mit Zeitablauf und Zusammensetzung, Meldungsarten, Human Factors mit „dreckigem Dutzend“, Gesamtverteidigung, Pakt für den Bevölkerungsschutz, Regelkreis, Risikoanalyse, KRITIS-Sektoren, Weg der länderübergreifenden Hilfe, Warnsystem, Kapazitätenpyramide)',
      'IdF-Prüfungsfragen an die neuen Stabsarbeit-Seiten angepasst (Bürgertelefon liegt bei der BuMA, Schichtplanung des S1, Großeinsatzlagen, 7-Punkte-Plan Punkt 7 in der Laufbahn-Musterlösung)',
      'IdF → Stabsarbeit: fünf neue Reiter zu Begrifflichkeiten, Gliederung der Einsatzleitung, Gliederung des Krisenstabs, Human Factors und Werkzeugen der Stabsarbeit (aus der Zusammenfassung Oktober 2026); IdF Münster: neue Tabs „Zivile Verteidigung“, „EU-Katastrophenschutz (UCPM)“ und „Lernunterlagen und Prüfungshinweise“; Presse- und Öffentlichkeitsarbeit um Grenzen des Auskunftsanspruchs und Pressestatements ergänzt',
      'Eingebettete Seiten (Baukasten, Sonderbauten, VB-Prüfung lernen, Stabskarte): zwischen der Seiten-Leiste und der unteren Navigationsleiste bleibt kein Spalt mehr; der Prüfung-Knopf ragt dort nicht mehr über die Leiste',
      'IdF → Vorbeugender Brandschutz: neue Simulation „Sonderbauten“ – Quartier mit allen sieben Sonderbau-Typen der Lernseite, Röntgenblick und Quiz',
    ]},
    {v:'3.0.3',ts:'2026-10-29T10:00',items:[
      'Lernkarten komplett neu: 623 Karten ausschließlich aus den Prüfungen – neuer Tab „Laufbahn“ (313 Karten aus den Laufbahnklausuren Juni 2026 und Dezember 2023, ersetzt „Alle“), IBK (Transaktionsanalyse und Konflikte, 63), VAk (110), FeuAK (62) und IdF (75); alle Tabs stehen oben in einer Reihe',
      'IdF → Vorbeugender Brandschutz: Tabs „Brandabschnitt-Haus in 3D“, „Brandschutzplaner“ und „Sonderbau-Quartier“ entfernt',
      'IdF → Vorbeugender Brandschutz → Lernseite: Inhalte der Zusammenfassung Oktober 2026 (Prüfschemata bis Schule) eingearbeitet – neue Punkte Begriffe, Baurecht, Grundsatzanforderungen, Baustoffe und Bauteile, Aufzüge, Versammlungsstätten, Schulen; Ergänzungen bei Rettungswegen, baulichem Brandschutz, Hochhäusern, Verkaufs-, Beherbergungs-, Industriebau und Garagen',
      'Lernkarten: „Alle“ wird markiert, wenn man darauf tippt oder alle vier Module einzeln auswählt',
      'Brandwand: REI 90-M gilt nach europäischer Norm (EN 13501-2), nach deutscher Norm (DIN 4102) heißt es F 90-A; „REIM 90“ überall durch REI 90-M ersetzt (Lernseite, Quiz)',
      'IdF → Vorbeugender Brandschutz: Gebäudeklassen-Baukasten in drei Varianten zur Auswahl, jeweils mit allen 80 Bauteilen der MBO (Rundgang, Katalog mit Vergleich, Abnahme zum Ausfüllen); neuer Bauteil-Katalog aus MBO und Lernseite mit 12 dokumentierten Abweichungen',
      'Lernseite Vorbeugender Brandschutz und Baukasten nach der MBO korrigiert: GK 2 im Obergeschoss feuerhemmend, Stichflur 15 m nur zum Sicherheitstreppenraum, Rauchabschnitte als Sollvorschrift, Brandabschnitte ohne feste Fläche, Tür zur Nutzungseinheit dicht schließend, Hubrettung ab Anleiterhöhe 8 m, Sicherheitsbeleuchtung ab 13 m Höhe, Brandwand-Abstand 5 m, Breite 2,50 m nur für Seitenteile und Oberlichte, Trennwände in Wohngebäuden GK 1/2 entfallen',
      'Baukasten: nur noch eine Version („Gebäudeklassen-Baukasten“, bisher Variante 2) mit Bauteil-Katalog; Katalog auf die 32 Bauteile mit Feuerwiderstandsangaben gekürzt, ohne Hochhaus; Hinweiskästen in hellem Design lesbar; Navigationsleiste bleibt beim Scrollen sichtbar; Varianten 1 und 3 sowie der alte Baukasten entfernt',
      'Baukasten: Matrix-Tab lädt wieder (Fehler bei der Brandwand-Zeile behoben)',
      'Baukasten: Gruppen-Chips im Katalog umbrechen statt zu scrollen (am PC nicht bedienbar); Matrix: Tab „Nach Bauteil“ steht jetzt vor „Nach Gebäudeklasse“ und ist die Startansicht',
      'Untere Leiste: Tab „Pause/Karten“ mit geteiltem Symbol (Tasse / Karten); beim Antippen erscheint eine Auswahl mit Lernkarten und Pausenraum; am PC steht „Lernkarten“ zusätzlich in der Seitenleiste',
      'Alle bisherigen Karten ohne Klausurbezug (GAL, SFS, HLFS und die Theoriekarten der vier Module) entfernt; Filter und Fortschritt zeigen nur noch IBK, VAk, FeuAK und IdF',
    ]},
    {v:'3.0.2',ts:'2026-10-27T00:10',items:[
      'Lernseite Vorbeugender Brandschutz · Brandwände: Die Anforderung REIM 90 ist als „Besonders wichtig“ hervorgehoben und aufgeschlüsselt: REI 90-M (DIN EN 13501-2) und F 90-A (DIN 4102), mit R, E, I, M und A erklärt; in den Simulationen steht überall dieselbe Schreibweise',
      'Alle vier 3D-Simulationen (Brandabschnitt-Haus, Gebäudeklassen-Baukasten, Brandschutzplaner, Sonderbau-Quartier) übernehmen jetzt Farben und Hintergrund der App (Dunkel, Hell und Beige): kein blauer Hintergrund mehr, Bedienfelder und 3D-Hintergrund in den App-Farben',
      'Gebäudeklassen-Baukasten: Neuer Reiter „Matrix“ mit der kompletten Lösung der Übungsmatrix (Tabelle Seite 133, 12 Bauteile × GK 1 bis 5): nach Gebäudeklasse (gleiche Anforderungen zusammengefasst, nach Farbe sortiert), nach Bauteil (gleiche Zeilen zusammengefasst, fünf Farbfelder je Zeile) und zum Üben mit Auswahlfeldern, Auswertung und Punktzahl bis 60',
      'Gebäudeklassen-Baukasten · Bauteile nach BauO NRW 2018 geprüft: Die Decke über dem Keller ist jetzt die Kellerdecke und folgt der Kellerzeile (§ 31 Abs. 2); neu die Decke zum Dachraum mit Schalter „Aufenthaltsräume über dem Dachgeschoss möglich“ (§ 31 Abs. 1, § 29 Abs. 4); Brandwand: Abstand zur Innenecke 5 m (MBO, Lernseite) bzw. 3 m (BauO NRW), bei GK 1 bis 3 bis unter die Dachhaut; Hinweis zu Trennwänden in Wohngebäuden der GK 1 und 2',
      'Gebäudeklassen-Baukasten: GK 1 und GK 2 getrennt – nach § 27 Abs. 1 BauO NRW 2018 sind tragende Teile im Obergeschoss bei GK 2 feuerhemmend (bei GK 1 keine Anforderung), im Keller bei beiden feuerhemmend; bei GK 1 und 2 ist kein notwendiger Treppenraum erforderlich (§ 35 Abs. 1)',
      'Duell: Ein roter Hinweis ganz oben sagt klar, dass das Duell im Schul-WLAN (und in Gast- oder Firmennetzen) nicht funktioniert, und empfiehlt mobile Daten (WLAN aus, Hilfsdienst an), einen Hotspot vom Handy oder das WLAN zu Hause',
      'Duell: Verbindung im selben WLAN zuverlässiger – beim Beitreten bleibt die Kamera an, bis der Antwort-Code erzeugt ist (dann nennt das Gerät seine echte WLAN-Adresse statt eines .local-Namens, den manche Android-Geräte nicht auflösen können); ist die Kamera schon erlaubt, gilt das auch beim Eröffnen. Der Hinweis bei einem Fehlschlag nennt jetzt die Geräteisolierung von Gast- und Schulnetzen',
      'VB lernen · Standsicherheit: Die 120 Minuten heißen jetzt „hochfeuerbeständig“ (F120) wie in der Unterrichtsfolie, mit Raumabschluss bei den Besonderen Fällen',
      'Gebäudeklassen-Baukasten · Bauteile: Hinter F30, F60, F90 steht jetzt die bauaufsichtliche Benennung (feuerhemmend, hochfeuerhemmend, feuerbeständig); die Kachel Kellergeschoss steht links, Obergeschoss in der Mitte; beim Hochhaus sind die Werte nach der Muster-Hochhaus-Richtlinie ergänzt (tragende und aussteifende Bauteile feuerbeständig und nichtbrennbar, über 60 m Höhe 120 Minuten; Wände der notwendigen Treppenräume wie die tragenden Bauteile; Trennwände zwischen Nutzungseinheiten feuerhemmend)',
      'Gebäudeklassen-Baukasten: Das Gebäude steht sofort beim Öffnen da (die Stockwerke wuchsen vorher per Animation ein und blieben auf manchen Geräten unsichtbar)',
      'Drei weitere 3D-Lernsimulationen (React und three.js) im IdF-Bereich „Vorbeugender Brandschutz“, passend zur Lernseite: der Gebäudeklassen-Baukasten (Gebäude hochziehen, Gebäudeklasse und Anforderungen an die Bauteile live sehen, Prüf-Quiz), der Brandschutzplaner (ein Geschoss selbst planen, vom Prüfer abnehmen lassen, Evakuierung und Fehlerpläne) und das Sonderbau-Quartier (Röntgenblick auf Hochhaus, Verkaufsstätte, Beherbergung, Industrie und Garage, Prüfreihenfolge, Zuordnen)',
      'Neu im IdF-Bereich „Vorbeugender Brandschutz“: Das Brandabschnitt-Haus in 3D (React und three.js) – ein aufgeschnittenes Haus zum Drehen und Zoomen. Drei Modi: Erkunden (die vier Ziele nach § 14 MBO mit Wortlaut), Brand (Feuer und Rauch lassen sich per Zeitregler ausbreiten, vier Schutzmaßnahmen schalten die Ausbreitung ein oder aus) und Aufgabe (Menschen retten, mit Sternen und Quiz)',
    ]},
    {v:'3.0.1',ts:'2026-10-26T20:00',items:[
      'VB lernen: Alle fünf Reiter haben denselben kompakten Aufbau – Definition bzw. Grundsatz oben, darunter der Merksatz, dann kleine Farbkacheln „Auf einen Blick“ (Punkte mit Komma getrennt), dann die Simulation; „Ausführlich erklärt“ entfällt. Aufenthaltsraum hat jetzt die Kachel „Bedingt“, Standsicherheit zeigt „mind. 30/60/90/120 Min.“ und die Kachel „Besondere Fälle“, Baustoffe nennt Abtropfen und § 26 MBO in den Kacheln',
      'VB lernen · Ziele: Der Merksatz steht oben, die vier Ziele sind nummerierte, aufklappbare Kacheln („Entstehung verhindern“, „Ausbreitung verhindern“, „Rettung ermöglichen“, „Löschen ermöglichen“) mit dem jeweiligen Satz aus § 14 MBO (alle beim Öffnen zugeklappt); die ausführliche Erklärung entfällt',
      'VB lernen: Die Definition (bei Aufenthaltsraum und Nutzungseinheit) steht jetzt als hervorgehobene Karte ganz oben direkt unter dem Titel',
      'VB lernen: Die Texte in „Auf einen Blick“ stehen als Stichpunkte mit hellem Strich in breiten Farbkacheln (statt in schmalen Pillen)',
      'VB lernen: Neues Seitenlayout auf allen fünf Reitern – oben „Auf einen Blick“ als farbige Kacheln (bei Standsicherheit mit den Minutenzahlen), dann „Ausprobieren“ mit der Simulation, darunter „Ausführlich erklärt“',
      'Startseite: Der FAQ-Hinweis „Vor der Anreise“ ist entfernt; die FAQ bleibt im Stundenplan',
      'VB lernen: Aufbau wie die Taschenkarte Stabsarbeit – alle fünf Themen (Ziele, Aufenthaltsraum, Nutzungseinheit, Baustoffe, Standsicherheit) sind Reiter in einer festen Navigationsleiste oben; die Themenliste sowie Quiz und Sortieren sind entfallen',
      'VB-Prüfung lernen und Taschenkarte Stabsarbeit: Alle Aktionsknöpfe (Weiter, Prüfen, Nochmal, Quiz starten, Brand starten, Text kopieren usw.) stehen rechts',
      'Taschenkarte Stabsarbeit: „Weiter“ im Zeichen-Quiz steht rechts; die Zeichen im Quiz passen in ihre Kästen; die Reiter bleiben auch am Desktop beim Scrollen sichtbar (eingebettete Seiten stehen fest unter der Kopfleiste)',
      'VB-Prüfung lernen: Die Zurück-Taste (Handy und Browser) führt erst aus dem Thema, Quiz oder Sortierspiel zurück zur Themenliste und danach erst aus der Seite; „Weiter“ im Quiz steht rechts; die Kopfleiste der eingebetteten Seiten verdeckt die Reiter nicht mehr',
      'IdF Münster: Die Themen sind neu geordnet. „Vorbeugender Brandschutz“ und „Stabsarbeit“ sind jetzt eigene Kacheln; darin liegen jeweils die Lernseite und das interaktive Lernen (Brandofen, Quiz, Sortieren bzw. Taschenkarte). Die interaktiven Seiten bekommen wie die übrigen Themen einen Haken, sobald man sie geöffnet hat, und zählen zum IdF-Fortschritt.',
      'IdF · Vorbeugender Brandschutz: Neue interaktive Lernseite „VB-Prüfung lernen“ mit Definitionen und Aufgaben aus dem Unterricht (Ziele des Brandschutzes, Aufenthaltsraum, Nutzungseinheit, Baustoffklassen, Standsicherheit im Brandfall). Zum Ausprobieren gibt es einen Brandprüfstand, einen Brandofen mit Zeitregler, einen Grundriss und ein Gebäude zum Erkunden, dazu Quiz und Sortierspiel. Neue Themen lassen sich leicht ergänzen.',
      'Taschenkarte Stabsarbeit: Taktische Zeichen nach der Vorlage neu gezeichnet (Führungsstellen mit Fahne, Leitstelle mit Dach, Führungskräfte mit schwarzer Spitze, Personen, Schäden, Brände als rote Zacken, Gefahren, Fahrzeuge, Patientenablage, Versorgungsstellen mit schwarzem Boden, Größenordnung als Punkte); die ausgewählte Palette in der Lagerhalle ist klar hervorgehoben und wird erst mit Plus in den Rechner gelegt.',
      'IdF · Stabsarbeit: Neue interaktive Taschenkarte mit 7-Punkte-Plan, Stabsstruktur, taktischen Zeichen, Katastrophenschutzlager NRW (Lagerhalle im Querschnitt mit antippbaren Paletten und Anforderungsrechner) und der EVA-Übung zum Sachgebiet 4 Versorgung; zu jeder der drei Aufgaben gibt es am Ende eine recherchierte Musterlösung mit Quellen.',
      'Stundenplan: In allen Jahrgängen außer dem Master gibt es unter der FAQ den Knopf „Raumplan IdF Münster“; er öffnet das Gelände in 3D mit allen Gebäuden, Parkplätzen und Sammelplätzen, auch wenn der eigene Plan keine Räume enthält',
      'Stundenplan IdF Münster: Frühstück, Mittagessen und Abendessen nennen den Speiseraum (Gebäude A3); ein Tipp auf Frühstück oder Abendessen zeigt A3 im Raumplan, im Speiseplan gibt es dazu einen Knopf',
      'Stundenplan IdF Münster: Jeder Tag zeigt jetzt auch Frühstück (6:30 bis 7:45 Uhr) und Abendessen (17:00 bis 19:00 Uhr, Essenausgabe bis 18:30 Uhr); am Abreisetag und in der BABZ-Woche entfällt das Abendessen bzw. beides',
      'Feinschliff: weichere Ecken wie bei iOS auf Karten, Listen und Knöpfen, Zahlen mit gleich breiten Ziffern, ausgewogene Überschriften, der Speiseplan lässt sich nach unten wischen, und bei sehr langsamer Verbindung zeigt die App nach 3 Sekunden die gespeicherte Seite statt zu warten',
      'Prüfung: Die wichtigen Klausuren (Laufbahnklausuren Juni 2026, Altklausur-Quiz IdF, Klausur 08/2026, die beiden oberen von VAk Berlin und der Führungsdienstsimulator) haben jetzt einen deutlich sichtbaren orangen Farbverlauf, auch im beigen und hellen Design',
      'Altklausur-Quiz IdF: Oben auf der Seite lässt sich der Themenbereich wählen – Alle, Vorbeugender Brandschutz oder Stabsarbeit. Im Lernmodus und im Prüfungsmodus (25 Fragen) kommen dann nur Fragen dieses Bereichs; die Auswahl bleibt beim nächsten Öffnen erhalten',
      'Datenschutz: Die Angabe zu Notizen im Stundenplan ist entfernt, weil es sie nicht mehr gibt',
      'Startseite: Der Link zur FAQ vor der Anreise öffnet den Stundenplan jetzt ganz oben bei der FAQ statt bei der aktuellen Einheit',
      'FAQ zu den Standorten: Für das IdF Münster sind jetzt Essenszeiten, Getränke, Tagesablauf, Sporthalle, Strom und Netz sowie Waschmöglichkeiten eingetragen; der Laptop wird in keiner Antwort mehr erwähnt',
      'Lernseiten: Auf dem Desktop gibt es jetzt wie auf Handy und Tablet die Kapitelkarten; ein Kapitel öffnet im eigenen Fenster mit „Vorheriges Kapitel“ und „Nächstes Kapitel“. Auf dem Tablet war die Leiste mit diesen Knöpfen unter der Tab-Leiste verdeckt und ist jetzt sichtbar. Die Seitenübersicht „Auf dieser Seite“ am rechten Rand entfällt dafür',
      'Stundenplan IdF Münster: Ein Tipp auf „Mittagessen“ öffnet den Speiseplan des Tages (Stammessen, Beilage, vegetarisch, Dessert mit den Kürzeln vom Aushang); die anderen Tage der Woche stehen darunter, der gewählte Tag ist hervorgehoben. Der Speiseplan der aktuellen Woche ist eingetragen',
      'Raumplan: Das Gelände ist jetzt nach der detaillierten Übersichtskarte des Instituts nachgebaut – Gebäudeformen und Farben nach Nutzung (Unterrichtsgebäude, Sporthalle B4, Werkstatt und Fahrzeughalle B2 und B3, Parkhaus), Parkplätze P1 bis P7, Sammelplätze S1 bis S3, Haltestellen und Wolbecker Straße; die Legende ist angepasst',
      'Stundenplan IdF Münster: In den Vorbeugender-Brandschutz-Wochen (Gruppe 1 die ersten drei, Gruppe 2 die letzten drei Wochen) zeigt „Erreichbarkeiten“ jetzt die Ansprechpersonen des VB mit Durchwahl (Heiko Böcking, Joachim Achtert, Stephanie Vöge), die VB-E-Mail-Adresse und die Adresse für Abwesenheiten. Vorher standen dort die Kontakte der Stabswochen'
    ]},
    {v:'3.0.0',ts:'2026-10-19T22:00',items:[
      'Neues App-Design auf Handy, Tablet und Desktop: Navigation mit Start, Stundenplan, Prüfung, Einstellungen und Lernen – unten als Tab-Leiste, auf dem Desktop als Seitenleiste links',
      'Android-App: Das Startsymbol und das Startbild folgen jetzt auch dem Farbschema – schwarz im dunklen, hell (Farbton der Website) im hellen Design',
      'Startseite: Beim Wechsel zwischen Woche und Monaten starten die Animationen nicht mehr neu; die Umschalter sind wieder schmaler',
      'Android-App: Drei Widgets für den Startbildschirm zur Auswahl – „Nächste Einheit“, „Tagesplan“ und „Jetzt und danach“ mit Zeitraum, Raum, Restzeit und der Einheit danach (nach Unterrichtsende zeigen sie, was morgen ansteht); sie folgen Akzentfarbe und Hell/Dunkel',
      'Lehrgang: Unter Einstellungen den Jahrgang wählen (BRef/AB, jedes Halbjahr ein neuer). Alle Jahrgänge starten als 1:1-Kopie des Masters; Verbesserungen am Master kommen automatisch an. Pro Jahrgang: eigener Stundenplan (Kalenderdatei, Foto oder Screenshot mit Texterkennung, oder Eingabeformular), Ergänzungen zu jeder Lernseite mit „+“ (Text oder Bild, mit Texterkennung), eigene Prüfungen hinzufügen und löschen (mit Rückgängig), einzelne Prüfungen als „klausurrelevant“ (★) markieren (nur sie füttern Einsatzfahrt und Duell), und alle Änderungen als Datei exportieren und einlesen',
      'Stundenplan: Eigenen Stundenplan aus einer Kalenderdatei (.ics) laden – er ersetzt den IdF-Plan und alle Funktionen laufen weiter (nächste Einheit auf der Startseite, Widgets, Notizen, Kalender-Export); der IdF-Plan lässt sich als Kalender-Abo (Link, der sich selbst aktualisiert) in den eigenen Kalender einbinden',
      'Lernkarten teilen: Eigene Karten als Link oder QR-Code an Kollegen schicken (die Karten stecken im Link, nichts läuft über einen Server); „Per E-Mail senden“ gibt es nicht mehr',
      'Lernseiten: Abkürzungen (z. B. ELW, FwDV, HBKG) sind beim ersten Vorkommen auf der Seite unterstrichen; ein Tipp zeigt Name und Erläuterung aus dem Abkürzungsverzeichnis',
      'Neu: Markierten Text auf einer Lernseite mit „Als Lernkarte“ direkt zu einer eigenen Lernkarte machen (Modul wird vorgewählt, die Frage schreibst du dazu)',
      'Updates: Bei einer neuen Version erscheint ein Hinweis „Aktualisieren“, statt dass die Seite mitten im Lernen neu lädt',
      'Spendenlink: dezente Karte unten auf der Startseite (ohne Pop-up)',
      'Lernseiten bearbeiten: Mit „Seite bearbeiten“ lassen sich ganze Kapitel und einzelne Blöcke ausblenden, auch innerhalb eines Kapitels ergänzen, und „gelöschte wiederherstellen“ bringt alles zurück (zusätzlich gibt es Rückgängig direkt nach dem Löschen)',
      'Prüfungen: Klausurrelevanz (★) gilt jetzt je einzelne Prüfung statt für den ganzen Reiter',
      'Einstellungen „Nächste Klausur“: Die Auswahl „Der Countdown öffnet“ folgt jetzt dem Prüfung-Tab – eigene Prüfungen des Jahrgangs stehen dort zur Wahl, ausgeblendete nicht mehr; ein nicht mehr vorhandenes Ziel fällt auf „Automatisch“ zurück',
      'Beige: Beim Verschieben des Hintergrund-Reglers bleiben die Kacheln so heller als der Hintergrund wie in der Voreinstellung (vorher wurden sie schwächer abgehoben), ebenso eingelassene Flächen und Linien',
      'Stundenplan: Die Abschnitte der Fortschrittsleiste unter der Kalenderwoche sind größer, mit KW-Nummer, und springen beim Antippen direkt zur jeweiligen Woche',
      'Stundenplan: Die Navigation bei Anreise und Abreise startet gleich mit „Auto“ als Verkehrsmittel',
      'Stundenplan Zivile Verteidigung (KW 50): Montag „Anreise“ 07:45–11:00 mit Navigation zur BABZ in Ahrweiler (Ramersbacher Str. 95), Programm ab mittags; Freitag „Abreise“ 14:00–14:45 (ohne Gewähr) zur Heimadresse',
      'Stundenplan IdF Münster: Die ganze Zeile „Anreise“ bzw. „Abreise“ ist der Knopf zu Maps, es öffnet sich keine Notiz mehr (nur „Adresse ändern“ öffnet die Adresseingabe)',
      'Stundenplan IdF Münster: „Abreise“ startet die Navigation zu deiner Heimadresse, die du dort einmal festlegst. Sie bleibt nur auf deinem Gerät und steckt in keiner Sicherung und keinem Export',
      'Stundenplan IdF Münster: „Anreise“ ist antippbar und startet die Navigation zum Institut der Feuerwehr NRW (Wolbecker Straße 237, Münster) in der Karten-App',
      'Hilfe: neuer Abschnitt „Am Ende eures Lehrgangs“ – Jahrgänge können dir am Ende ihres B VI (einmal) ihre App-Datei schicken, damit sie fest in der App hinterlegt wird',
      'Jahrgänge: Lernkarten lassen sich löschen (auch Karten des Masters, nur im eigenen Jahrgang; „Karte löschen“ unter der Lernkarte, „gelöschte wiederherstellen“ holt sie zurück). Die gelöschten Karten stehen im Jahrgangs-Export und gelten für alle, die ihn einlesen',
      'Jahrgänge: „Rückgängig“ ist nicht mehr nur kurz eingeblendet, sondern dauerhaft sichtbar neben „Seite bearbeiten“ (auch bei Prüfungen, Lernkarten und im Karten-Fenster). Daneben gibt es „Wiederholen“, das die zurückgenommene Aktion erneut ausführt',
      'Jahrgänge: Prüfungen und Klausurvorbereitung bleiben im Gleichklang – eine im Prüfung-Tab hinzugefügte Prüfung erscheint auch als Kachel auf der Übersichtsseite ihres Reiters (IBK, VAk, FeuAK, IdF), eine gelöschte Prüfung verschwindet dort ebenfalls, und umgekehrt',
      'Jahrgänge: Unter „Kürzel und Standorte“ lassen sich jetzt auch die Kürzel (IBK, VAk, FeuAK, IdF) ändern. Kürzel und Ort ersetzen die Standardnamen überall, wo sie auf der Seite stehen, und stehen im Jahrgangs-Export',
      'Rückgängig und Wiederholen sind jetzt auch an den übrigen Stellen dauerhaft sichtbar statt nur kurz eingeblendet: oben in den Einstellungen (Fortschritt und Lernkarten zurücksetzen, Klausurtermin entfernen, Jahrgang importieren oder verwerfen), nach „Lernstand zurücksetzen“ bei den Lernkarten und bei den Notizen (Notiz löschen)',
      'Stundenplan in Jahrgängen: Zwischen der Reiterkarte (IBK, VAk, FeuAK, IdF) und der Karte darunter ist jetzt eine kleine Lücke',
      'Pausenraum: neues Spiel „Einsatzleitung-Snake“ direkt unter dem Duell. Du steuerst einen Trupp mit Schlauchleitung, sammelst Feuerlöscher und meidest die Flammen. Als Herausforderung wählbar: „Atemluft“ (der Vorrat sinkt, Druckluftflaschen füllen auf) und „Löschwasser“ (Aufnehmen löscht einen Brandherd), dazu drei Einsatzstufen',
      'Pausenraum: neues Spiel „Solitär“ direkt unter dem Snake – Klondike mit Flammen, Löschern, Äxten und Leitern als Kartenfarben und Feuerwehr-Namen für Ass, Bube, Dame und König. Karten antippen oder ziehen (die Karte hängt am Greifpunkt hinter dem Zeiger her und kippt dabei in 3D), Doppeltipp führt den passenden Zug aus (zuerst ins Fundament, sonst auf eine Spalte), dazu Rückgängig, Wiederholen, Tipp, Ziehen 1 oder 3 und einschaltbare Hinweise beim Ziehen',
      'Stundenplan IdF Münster: Ein Tipp auf eine Einheit mit Raum öffnet den Raumplan als 3D-Ansicht des Geländes – die Kamera fährt zum Gebäude, es leuchtet orange und über ihm steht die Raumnummer (bei mehreren Räumen je ein Chip, zum Beispiel bei der Klausur). Ziehen dreht, zwei Finger oder das Mausrad zoomen, dazu Draufsicht und Legende. Die Notizen zu Einheiten gibt es dafür nicht mehr',
      'Ladebildschirm: Solange die Seite startet, zeigt sie jetzt einen Platzhalter-Bildschirm (graue Flächen im Aufbau der Startseite, in deinem Farbschema) statt einer leeren Fläche; sobald die App bereit ist, blendet er sich aus. Gilt für die Website und die Android-App',
      'Pausenraum: neues Spiel „Minesweeper“ direkt unter dem Solitär – im Dunkeln Brandherde aufspüren. Vier Stufen (Leicht 12, Mittel 30, Schwer 56, Sehr schwer 72 Brandherde), Antippen sucht ab, langes Drücken, Rechtsklick oder der Schalter „Markieren“ setzt die Markierung, Doppeltipp auf eine Zahl öffnet die Nachbarfelder. Dazu Tipp, Zeit und Rekord je Stufe sowie ein leuchtender Wärmebild-Cursor',
      'Neu: FAQ zu den Standorten. Im Stundenplan gibt es ganz oben die eingeklappte Karte „Vor der Anreise: FAQ“ mit Fragen zu Unterkunft, Verpflegung, Sport, Anreise, Kleidung und Organisation (für IdF Münster, IBK Heyrothsberge, VAk Berlin und FeuAK Hamburg). Fragen ohne Antwort werden ausgeblendet. 14 Tage vor dem ersten Plantag zeigt die Startseite einen Link dorthin. Jahrgänge können Antworten ändern und eigene Fragen in ihrer Jahrgangsdatei ergänzen',
      'Hinweis für iPhone und iPad: Apple löscht die Daten einer Website in Safari nach etwa 7 Tagen ohne Besuch. Das steht jetzt unter Einstellungen, bei der App-Installation und in der Hilfe – mit dem Rat, die App auf den Home-Bildschirm zu legen und ab und zu zu sichern',
      'Die Flamme im Kopf der Seite flackert deutlicher und ist jetzt gut zu erkennen',
      'Sicherung: Gewählter Jahrgang, eigene Jahrgangs-Änderungen und die Plan-Ansicht werden jetzt mitgesichert und wieder eingespielt (vorher gingen sie beim Einspielen verloren)',
      'Duell: Eigene Fragen des Jahrgangs zählen jetzt mit, wenn beide Spieler genau dieselben haben (die Lobby zeigt das an); sonst kommen nur die mitgelieferten Fragen dran',
      'Jahrgang importieren: Rückfrage mit dem Jahrgang der Datei und Wahl „Ergänzen“ oder „Stand ersetzen“ (mit Rückgängig); die Suche findet eigene Kapitel, Ergänzungen und Reiter und zeigt ausgeblendete nicht mehr; die Erklärseite nennt Datenverlust-Risiko, Export statt Sicherung und weitere Grenzen',
      'Ersteinrichtung nur noch 2 Seiten plus Lehrgangs-Auswahl: Wer einen anderen Jahrgang als den Master wählt, landet auf „So funktioniert dein Jahrgang“ und kommt mit „Verstanden, lass mich in die App“ zur Startseite; aus den Einstellungen gibt es den Knopf nicht. Neu auf der Erklärseite: Die App-Datei lässt sich an den Jahrgang nach euch weitergeben',
      'Hintergrund-Regler (Einstellungen → Darstellung): Die Hintergrundhelligkeit lässt sich stufenlos von Schwarz bis Weiß einstellen, Karten, Linien und Texte passen sich an und bleiben lesbar; im Beige-Schema mit warmem Farbton',
      'Neues Farbschema „Beige“ (Einstellungen → Darstellung): warmer Leinen-Ton statt Grauweiß; in der Android-App mit passendem Startsymbol und beigem Startbild',
      'Abkürzungsverzeichnis: Dort wird kein Wort mehr als Abkürzung markiert',
      'Nächste Klausur (Einstellungen → Lernen): Der Termin lässt sich mit „Termin entfernen“ wieder löschen (mit Rückgängig), und du wählst, welche Prüfung der Countdown öffnet',
      'Stundenplan: „Wichtige Termine in den Kalender übernehmen“ nimmt nur Schlüsseltermine (Akzentfarbe) und Exkursionen (grün) mit; „Kalender abonnieren“ und die Anzeige des aktiven Plans im Master sind entfernt',
      'Jahrgänge: Die Erklärseite beschreibt jetzt, dass jeder Jahrgang eine Person bestimmt, die die Seite pflegt, den Jahrgang exportiert und in der WhatsApp-Gruppe teilt; alle anderen importieren die Datei. Klausurtermine als Countdown für Jahrgänge sind entfernt.',
      'Jahrgänge: „So funktioniert dein Jahrgang“ in den Einstellungen erklärt, warum es die Seite gibt und wie sie funktioniert; „Prüfungen bearbeiten“ steht oben auf der Prüfungsseite, auf Übersichtsseiten lassen sich Reiter ausblenden und eigene Reiter mit Kapiteln anlegen; eigene Fragen können Single-Choice, Multiple-Choice oder Freitext sein; die Ergänzung im Kapitel hat nur noch Text und Bild',
      'Jahrgang einrichten (Einstellungen → Lehrgang): Checkliste mit Stundenplänen, Lehrgangs-Link, Standorten und Lernkarten des Jahrgangs; die Datei trägt alles mit',
      'Lernseiten: „+ Eigene Ergänzung“ und „+ Eigene Frage“ erscheinen erst nach „Seite bearbeiten“; Ergänzungen als Freitext, Single-Choice oder Multiple-Choice, dazu eigene Kapitel; das Kreuz sitzt rechts an der Frage',
      'Klausuren: In Jahrgängen lassen sich direkt auf der Prüfungsseite eigene Fragen hinzufügen, bearbeiten, entfernen und üben (sie zählen für Einsatzfahrt, wenn die Prüfung klausurrelevant ist)',
      'Stundenplan (Jahrgänge): Für IdF gibt es je einen Plan für Gruppe 1 und Gruppe 2 mit Umschalter; mit „Als aktiven Stundenplan markieren“ wählst du die Gruppe für Startseite und Widgets',
      'Einsatzfahrt-Duell: Farbverlauf auf der Karte entfernt',
      'Master-Lehrgang ist nicht veränderbar (keine Bearbeitungsfelder); den Farbverlauf in den Prüfungen tragen nur die hervorgehobenen Prüfungen, in Jahrgängen lässt sich das je Prüfung mit ★ ändern',
      'Kapitelkarten zeigen keine Lesezeit in Minuten mehr, nur noch ein Häkchen bei gelesenen Kapiteln',
      'Stundenplan: Er springt von selbst zur aktuellen Kalenderwoche, wenn das Datum weiterläuft (Mitternacht) oder die App wieder in den Vordergrund kommt – außer du hast selbst in andere Wochen geblättert',
      'Fehlerbehebung: In Textfeldern (Suche, eigene Lernkarte) lassen sich „j“ und „f“ wieder tippen; Lesezeichen und „Zuletzt gesucht“ in der Suche funktionieren wieder; Markierungen funktionieren auch im Kapitel-Fenster auf Handy und Tablet',
      'Fehlerbehebung: Der Prüfungsmodus gibt bei Zeitablauf automatisch ab; Pomodoro startet nach Ablauf eine neue Runde; Klausur-Timer und Pomodoro laufen auch bei gesperrtem Bildschirm richtig weiter; ein abgelaufener Klausur-Timer meldet sich nicht mehr bei jedem Start',
      'Fehlerbehebung: Fenster (Suche, Notiz, Pomodoro, Neuigkeiten) nehmen den Fokus auf, halten die Tab-Taste im Fenster und schließen mit Zurück oder Esc einzeln; die Zurück-Taste der Android-App schließt zuerst offene Fenster',
      'Fehlerbehebung: Eine Notiz landet immer auf der Seite, auf der sie geschrieben wurde; Sicherungen werden beim Einspielen geprüft, damit eine kaputte Datei die App nicht lahmlegt; bei vollem Speicher läuft die App weiter und weist darauf hin',
      'Fehlerbehebung: Besserer Kontrast der Schrift auf Akzentflächen (Rot, Blau, Grün); größere Trefferflächen auf Touch-Geräten; ein Quiz-Fakt zur Vergabefrist korrigiert (35 statt 52 Tage); Erste Schritte nennt den Pausenraum; fehlender Trennstrich in den Einstellungen ergänzt',
      'Fehlerbehebung Pausenraum und Duell: Wörter-Raten färbt doppelte Buchstaben richtig, Duell-Gast bricht nicht mehr nach 30 Sekunden ab, fremde oder eingefügte Codes werden erkannt, die Kamera schaltet sich zuverlässig aus, Revanche-Knopf nur wenn der Gegner noch da ist',
      'Fehlerbehebung Offline: Bilder werden mit der App gespeichert und sind auch ohne Netz da',
      'Suche: Aktionen (Seitensprünge, Notiz, Lesezeichen, Fokus) und die Filterleiste entfernt – die Suche zeigt nur noch Treffer und die Kapitel der Seite',
      'Startseite: Der Satz unter der Begrüßung wechselt bei jedem Aufrufen der Seite; „Freiwillige Spende“ ist als ganze Karte anklickbar',
      'Startseite: Wochen- und Monatsdiagramm passt auf dem Handy wieder vollständig in die Karte',
      'Einstellungen: Gruppen (Darstellung, Lernen, Erinnerung, Daten, Werkzeuge, App) klappen auf und zu und zeigen die aktuellen Werte; „Projekt unterstützen“ bleibt immer unten sichtbar',
      'Farbschema: Dunkel, Hell oder System (Einstellungen → Farbschema)',
      'Akzentfarbe wählbar (5 Vorgaben oder Farbkreis); sie färbt Navigation, Rahmen und Grafiken, in der Android-App auch das Symbol auf dem Startbildschirm',
      'Neues App-Symbol: die Flamme der Website',
      'Startseite ruhiger: Weiterlernen mit Tagesziel-Ring, Lernzeit-Verlauf als Balken (Woche oder Monate) mit nächster Einheit, Module als Ringe, 1. Ausbildungsjahr eingeklappt; Gruß und Spruch passend zur Tageszeit',
      'Stundenplan: IdF Modul 3.5 mit Uhrzeiten, Räumen, Hinweisen, Mittagspause und Telefonnummern; Übernahme in den Kalender mit Erinnerung',
      'Prüfung: alle Klausur-Werkzeuge an einem Ort, mit Countdown zur nächsten Klausur; Altklausur-Quiz, Klausurfragen und Fallbearbeitung im neuen Design',
      'Prüfung: neuer Abschnitt „Laufbahnprüfung“ mit den schriftlichen Klausuren Dez 2023 und Juni 2026 samt Musterlösungen (wie Klausur 08/2026) und Abschnitt „IdF Münster“ mit dem Altklausur-Quiz IdF (Vorbeugender Brandschutz und Stabsarbeit, Mehrfachauswahl, Lern- und Prüfungsmodus, Wiederholung nach Plan), auch im Reiter IdF erreichbar; Quelle und Unsicherheit stehen bei jeder Antwort; Prüfung-Tab als gleichmäßiges Raster (3 Spalten Desktop, 2 Tablet, 1 Handy) und Countdown-Karte führt zum passenden Quiz bzw. zur Klausur',
      'Startseite: Die nächste Einheit steht oben rechts neben der Begrüßung (im Unterricht grau die laufende, orange die folgende; Text bis zu drei Zeilen), ein Tipp öffnet den Stundenplan',
      'Prüfungs-Karten (Quiz, Klausuren, Fallbearbeitung, Simulator) bekommen keinen Haken mehr und zählen nicht zum Themenfortschritt; Führungsdienstsimulator steht oben im IBK-Reiter, Zurück aus einem Szenario führt zur Szenario-Übersicht',
      'Klausur-Seiten (Klausur 08/2026, Eingrenzung, Altklausur-Training FeuAK, Laufbahnklausuren, VAk-Klausurhinweise) als Karten: zuerst die Frage, per Tipp Kurzfassung und Musterlösung; Klausurfragen, Hubs (FeuAK, VAk) im gleichen Kartenstil und gleich groß',
      'Desktop: Befehlspalette (Strg K) mit Kapiteln und Aktionen, Fokus-Lesemodus (ganzer Bildschirm, Pfeiltasten, Schriftgröße) und ein ein-/ausblendbares Lernkarten-Fenster neben der Lernseite',
      'Der Pfeil „Nach oben“ (Seitenanfang) ist überall entfernt',
      'Die Kopfzeile mit Zurück, Üben, Fokus, Notiz und Lesezeichen bleibt auf Inhaltsseiten beim Scrollen sichtbar',
      'Startseite: Die Modul-Kreise tragen einen kleinen Pfeil-Knopf (›) mit Rand in Kartenfarbe am Ring und pulsieren beim Öffnen der Seite kurz nacheinander, damit klar ist, dass man sie antippen kann',
      'Neu: Pausenraum – Karte auf der Startseite mit wechselndem Satz und eigene Seite mit sechs Spielen: Einsatzfahrt (Route wählen, Prüfungsfragen aus IBK, VAk, FeuAK oder IdF, Hilfsfrist schaffen, Brand wächst mit der Zeit), Quizleiter, Wahr oder Falsch, Wörter-Raten, Mehr oder weniger und Memory; Fragen wahlweise Allgemeinwissen, Feuerwehr oder beides',
      'Pausenraum: Zurück im Spiel führt zur Spieleauswahl; bei „Mehr oder weniger“ liegen die Werte mit jeder richtigen Antwort enger beieinander; auf dem Handy steht die Karte über dem 1. Ausbildungsjahr; keine Tagesserie mehr in der Kopfzeile der Startseite',
      'Neu: Einsatzfahrt-Duell – zwei Spieler live gegeneinander; Verbindung direkt von Gerät zu Gerät per QR-Code (oder Kurzcode zum Kopieren), gleiche Prüfungsfragen in gleicher Reihenfolge, 5/10/15 Fragen, frei wählbare Module, 30 Sekunden pro Frage, beide Löschfahrzeuge und Richtig/Falsch des Gegners live sichtbar, Revanche, Bilanz gegen den Gegner, Pause von 30 Sekunden bei Verbindungsabbruch',
      'Duell: Die Kamera startet erst nach Tipp auf „Kamera starten“ mit kurzer Erklärung; bei verweigertem Zugriff steht der Weg in die Einstellungen da; die Android-App darf die Kamera jetzt nach Rückfrage nutzen (neue Android-App nötig); Kopfzeile zeigt „Prüfungsfragen“ statt „Allgemeinwissen“',
      'Duell: Alternativ zur Live-Kamera kann man den QR-Code über „Stattdessen Foto vom QR-Code aufnehmen“ fotografieren (Systemkamera des Geräts); das Foto wird in der App gelesen, auch wenn der Kamerazugriff gesperrt ist',
      'Navigation: Der Pausenraum steht jetzt in der Tab-Leiste und am Desktop in der Seitenleiste (nicht mehr auf der Startseite); die Lernkarten sind über die Startseite erreichbar. Entfernt: die Einstellungen „Karten pro Tag“ und „Zahl bei den Lernkarten“ samt Tagesfortschritt der Karten',
      'Duell: Das Haus steht in der Bildmitte, Spieler 1 fährt von links an, Spieler 2 von rechts; vor dem Spiel wählt jeder die Farbe seines Fahrzeugs (sechs Farben, doppelte Farben sind gesperrt)',
      'Duell: Der Platzhalter im Namensfeld („z. B. …“) wechselt bei jedem Antippen und zeigt Namen aus einer Bibliothek von 100 Namen (männlich, weiblich und erfundene Figuren wie Frodo oder Optimus Prime); Namen dürfen bis 14 Zeichen lang sein',
      'Startseite: Unter den Modul-Kreisen (1. und 2. Ausbildungsjahr) stehen keine Zahlen mehr (z. B. 3/3); das Tippen und der Fortschrittsring bleiben',
      'Einstellungen: Eintrag „Lernstatistik“ entfernt',
      'Lernseiten korrigiert: FwDV 8 (Tauchen) und FwDV 10 (tragbare Leitern), praktische Saughöhe einheitlich 7,5 m, LF 10 mit 1.200 l und HLF 20 mit 1.600 l nach DIN 14530-5 bzw. -27, Körperschutzformen 1–3 und Gefahrengruppen I–III nach FwDV 500, Absperrbereich 25 µSv/h, Führungsstufen B/C mit Führungstrupp/-staffel bzw. Führungsgruppe',
      'Altklausur-Quiz korrigiert: IdF „Hochhäuser bis 60 m“ nach MHHR (Feuerwehraufzug und Steigleitungen sowie ein Sicherheitstreppenraum statt zwei Treppenräumen sind richtig), VAk „Was ist ein Realakt?“ mit Erklärung, warum „Hoheitliche Aufgabe“ am ehesten passt',
      'Farbsystem: Skalen (Amber, Neutral, Grün, Rot) und Namen nach Aufgabe (Seite, Fläche, Haupttext, Nebentext, Akzent …) als gemeinsame Schicht im CSS; Kontrast im hellen Design korrigiert (graue Zusatztexte, Datum), alle geprüften Texte erreichen jetzt WCAG AA; Verläufe, Glow und bewusst farbige Kacheln bleiben unverändert',
      'Technik: Höhen folgen der sichtbaren Bildschirmhöhe (dvh, wichtig am Handy mit Adressleiste), Übergänge nur noch für Farben, Rand, Deckkraft und Bewegung statt für alles, ruhigeres Scrollen in Kapitel-Fenster und Tabellen, einheitliche Strichstärke der Symbole (2, große Kachel-Symbole 1,5) und eine benannte Skala für die Ebenen (z-index)',
'Lernseiten neu: Überblick mit Kapitelkarten (Titel, Lesezeit, Vorschau) – auf Handy und Tablet gleich, ohne Umschalter; ein Kapitel öffnet im eigenen Fenster mit „Vorheriges/Nächstes Kapitel“, Stift (Notiz) und Lesezeichen oben; Zurück führt zur Übersicht; am Desktop als Volltext; die Suche springt direkt ins passende Kapitel; Vorlesefunktion entfernt; Tabellen am Handy automatisch lesbar (2 Spalten als Begriff/Erklärung, 3–4 Spalten als Karten, ab 5 Spalten mit fester erster Spalte) und überall im gleichen Stil',
      'Stundenplan springt beim Öffnen zur laufenden bzw. nächsten Einheit: richtige Woche, der aktuelle Tag steht oben (am Wochenende der nächste Montag); die laufende bzw. nächste Einheit leuchtet mit Farbverlauf und Glow und wechselt mit der Uhrzeit',
      'Abkürzungen als Karten zum Aufklappen (Kürzel und Name, Erläuterung per Tipp; auf Tablet 2, auf Desktop 3 Spalten) mit fest stehender Suchleiste, Kategorien-Überschriften und „Suche leeren“',
      'Quiz mit Wiederholung nach Plan (1, 3, 7, 14, 30 Tage) und Filter „Fällig“; Lernkarten mit allen Filtern auf einen Blick',
      'Lernseiten: Text markieren, Merken, Notiz direkt auf der Seite; Bilder und Diagramme per Tipp groß öffnen und zoomen; Inhaltsverzeichnis am Rand auf großen Bildschirmen; Fehler melden',
      'Einstellungen: Suche, Notizen, Lesezeichen, Pomodoro, Abkürzungen, Sicherung erstellen und einspielen, Klausurtermin einstellbar, freiwillige Unterstützung per PayPal',
      'Ersteinrichtung beim ersten Start (Farbschema, Akzentfarbe); Installationshilfe je Gerät und QR-Code zum Teilen der App',
      'Lernkarten: eigene Karten anlegen, Filter „Schwach“ für Karten, die schwer waren oder nicht saßen',
      'Klausur-Timer (30 bis 90 Minuten) auf den Übungsklausuren; Notizen zu Stundenplan-Einträgen; Fehler melden per E-Mail oder GitHub',
      'Suche findet auch bei Tippfehlern und fehlenden Umlauten, Treffer in Gruppen (Seiten, Lernkarten, Notizen); eine Übersicht sammelt die schweren Lernkarten',
      'Schriften liegen jetzt in der App (kein Google-Aufruf mehr), Datenschutz ergänzt, rote Texte im dunklen Design besser lesbar',
      'Android-App: Erinnerung als echte Benachrichtigung, Links öffnen außerhalb der App'
    ]},
    {v:'2.31.0',ts:'2026-10-18T00:00',items:[
      'IdF Münster: Stundenplan Modul 3.5 (KW 44–52, Gruppe 1 & 2) direkt im Übersichtstab – Tageskarten-Ansicht mit Wochennavigation, automatischer Wochenerkennung und Gruppen-Toggle'
    ]},
    {v:'2.30.11',ts:'2026-08-27T00:00',items:[
      'FeuAK · Klausurvorbereitung: Neuer Tab „Klausur 08/2026" – alle 14 Originalfragen des Führungslehrgangs mit Musterlösungen im Akkordeon'
    ]},
    {v:'2.30.10',ts:'2026-08-26T00:00',items:[
      'Klausurfragen FeuAK: Neue Frage 14 – „Planungsziel in der Feuerwehrbedarfsplanung" mit Musterlösung und Kurzantwort (5 Punkte) · Gesamtpunkte 65 → 70'
    ]},
    {v:'2.30.9',ts:'2026-08-26T00:00',items:[
      'FeuAK · Klausurfragen: Seite umbenannt in „Klausurfragen" (war „Klausurfragen – Übungsmodus"), Kachel im Hub bereinigt',
      'FeuAK: Ghost-Views (BWL, Vergabe, Rechnungswesen) aus Fortschritts-Tracking und Verwandten-Chips entfernt – FeuAK-Fortschritt zeigt jetzt korrekte 7 statt 10 Module',
      'HLFS: Thema-Nummern korrigiert – Tunnel→03, Vorbeugl. Brandschutz→04, MANV→05, Zug-/Verbandsführer→06',
      'Simulator: Szenario-Anzahl auf Seite korrigiert (war „4 Szenarien", korrekt: 8)',
      'Startseite: Lernkarten-Zahl aktualisiert (364→319), Abkürzungen-Beschreibung aktualisiert',
      'IBK-Kachel: „Simulator" aus der Beschreibung entfernt (Simulator ist kein Lernmodul im Fortschritt)',
      'HLFS-Hub: Standort „Kassel" in Überschrift ergänzt',
      'CSS: .acc-list als eigene Klasse definiert; tote Regel .ai-tutor-btn{} entfernt'
    ]},
    {v:'2.30.8',ts:'2026-08-25T00:00',items:[
      'Notizen- und Lesezeichen-Button im Header jetzt auf allen Leaf-Pages sichtbar (gleiche Logik wie Gold/Blau-Hintergrund) – u. a. auch auf Klausurfragen-Übungsmodus'
    ]},
    {v:'2.30.6',ts:'2026-08-25T00:00',items:[
      'Navigation: Hintergrundfarbe (Gold/Blau) jetzt konsistent – Leaf-Seiten blau, Hub-Seiten gold',
      'Fix: „Klausurfragen – Übungsmodus" (FeuAK) zeigt nun blauen Hintergrund statt gold',
      'Fix: VAk Klausurvorbereitung-Hub, FeuAK Bedarfsplanungs-Hub und FeuAK Analyse-Hub zeigen nun goldenen Hintergrund'
    ]},
    {v:'2.30.5',ts:'2026-08-25T00:00',items:[
      'Lernkarten FeuAK: 24 Karten aus gelöschten Tabs entfernt – BWL (6 Karten: h06–h08, h29, h30, h57) und Rechnungswesen (14 Karten: h18–h22, h36–h38, h47–h50, h60, h69)',
      'Lernkarten FeuAK · Vergabe: 4 veraltete/redundante Karten gelöscht (h14 Definition, h15 alte Schwellenwerte, h17 Unterschwellen-Verfahren, h45 Grundsätze-Duplikat) – 5 Karten bleiben'
    ]},
    {v:'2.30.4',ts:'2026-08-25T00:00',items:[
      'Lernkarten FeuAK: 11 neue Karten hinzugefügt – KatS-Bedarfsplanung (h106–h108), Stakeholderanalyse (h109–h111), Prospektive Risikoanalyse (h112–h113), Beschaffungspraxis Detail (h114–h116)',
      'Lernkarten FeuAK: 2 Duplikate gelöscht – h23 (Porter-Strategietypen, Duplikat von h80) und h43 (vorläufige Haushaltsführung, Duplikat von h13)'
    ]},
    {v:'2.30.3',ts:'2026-08-25T00:00',items:[
      'Barrierefreiheit: Dekorative SVG-Icons (tile-icon, tile-arr, tc-icon) mit aria-hidden versehen',
      'Barrierefreiheit: Kacheln und Topic-Cards sind jetzt per Tastatur navigierbar (Tab + Enter/Space)',
      'CSS: .glass-card explizit als eigene Klasse definiert',
      'CSS: Textklasse tc-sub vereinheitlicht (war teilweise noch tc-desc)',
      'Layout: Mindestbreite der BVI-Inhalts-Grid von 265 px auf 200 px reduziert (kleinere Tablets)'
    ]},
    {v:'2.30.1',ts:'2026-08-25T00:00',items:[
      'FeuAK Klausurvorbereitung: Grid-Fehler behoben – „Eingrenzung 08/2026 & Münster" und „Altklausur-Training FeuAK" füllen jetzt gemeinsam die volle Breite (cg-3 → cg-2)'
    ]},
    {v:'2.30.0',ts:'2026-08-25T00:00',items:[
      'Startseite: Kachel-Grid auf 2 Spalten umgestellt (war 3/4) und füllt jetzt die volle Bildschirmbreite',
      'Startseite: App-Kachel alleine in voller Breite ganz unten',
      'Startseite: „2. Jahr" als primärer Call-to-Action hervorgehoben – goldener Rahmen, Gold-Glow und goldener Titel',
      'Startseite: „B" im Hero-Logo mit dezenter Schatten-Ebene für mehr Tiefe und Kontrast'
    ]},
    {v:'2.29.48',ts:'2026-08-25T00:00',items:[
      'Global: abschließende hr.sec-div vor </details> entfernt (42 Akkordeons) – kein unnötiger Bodenabstand mehr in offenen Akkordeons'
    ]},
    {v:'2.29.47',ts:'2026-08-25T00:00',items:[
      'Global: hr.sec-div als erstes Element in acc-body entfernt (31 Akkordeons quer durch alle Tabs) – kein Leerraum mehr beim Öffnen'
    ]},
    {v:'2.29.46',ts:'2026-08-25T00:00',items:[
      'GAL UVV (v-gal-uvv): doppelte Zahlen in 5 Akkordeon-Titeln entfernt; hr.sec-div-Leerraum beim Öffnen behoben'
    ]},
    {v:'2.29.45',ts:'2026-08-25T00:00',items:[
      'GAL Wärmebildkamera: doppelte Zahlen in Akkordeon-Titeln entfernt (\"1 · Physikalische Grundlagen\" → \"Physikalische Grundlagen\"); trennende hr.sec-div aus acc-body entfernt (Leerraum beim Öffnen)'
    ]},
    {v:'2.29.44',ts:'2026-08-25T00:00',items:[
      'FeuAK Klausurvorbereitung (v-klausur): Überschrift „Klausur – Training" → „Klausurenvorbereitung"; Klausurfragen-Karte als Gold-Hub-Karte (volle Breite)'
    ]},
    {v:'2.29.43',ts:'2026-08-25T00:00',items:[
      'FeuAK: Tab „Prüfungsleistung Lehrgang Hamburg" komplett gelöscht (Karte + View)'
    ]},
    {v:'2.29.42',ts:'2026-08-25T00:00',items:[
      'FeuAK: Klausuren-Karte zu „Klausurenvorbereitung" umbenannt und als Gold-Hub-Karte (volle Breite) gestaltet'
    ]},
    {v:'2.29.41',ts:'2026-08-25T00:00',items:[
      'VAk Berlin: Tabs Lernzusammenfassung und Übungsklausur gelöscht; neuer Hub-Tab „Klausurvorbereitung" mit Altklausur-Quiz, Fallbearbeitung und Klausurhinweise; Fallbearbeitung-Init-Bug (Comma-Operator) behoben'
    ]},
    {v:'2.29.40',ts:'2026-08-25T00:00',items:[
      'KF_QUIZ: falscher Array-Index in Übersicht und Auswertung behoben (q.id-1 → i); Klick auf Frage 1 öffnet jetzt korrekt Frage 1'
    ]},
    {v:'2.29.39',ts:'2026-08-25T00:00',items:[
      'Klausurfragen und Übungsklausur: nach Fragen-Sprung (goToQ, nextQ, prevQ) wird jetzt automatisch an den Seitenanfang gescrollt'
    ]},
    {v:'2.29.38',ts:'2026-08-25T00:00',items:[
      'Altklausur-Training FeuAK (22 Fragen) und Eingrenzung 08/2026 & Münster (12 Fragen) von Quiz-Struktur auf Akkordeon-Format umgebaut; FEUAK_QUIZ und EINGRENZUNG_QUIZ IIFEs entfernt (~440 Zeilen)'
    ]},
    {v:'2.29.37',ts:'2026-08-25T00:00',items:[
      'Haushalt-Tab ergänzt: Produktorientierter Haushalt (Zeilen/Ansätze/Reste/Ermächtigungsübertragungen), Verpflichtungsermächtigungen (VE) mit Praxis-Beispiel, Deckungsfähigkeit/Übertragbarkeit/Mittelbindung als def-box; Kameralistik + Doppik um Effektivitäts-Abgrenzung erweitert; Broken-Link zum gelöschten Vergabe-Tab in Acc 06 korrigiert'
    ]},
    {v:'2.29.36',ts:'2026-08-25T00:00',items:[
      'VWL-Tab ergänzt: Allokation mit Etymologie-Klammer; Produktivitäts-Hebel in Effizienz-Karte; Statistischer Wert eines Menschenlebens auf 4 Punkte erweitert (Investitionsbasis + Risikominimierung)'
    ]},
    {v:'2.29.35',ts:'2026-08-25T00:00',items:[
      'FeuAK Struktur: Tabs Vergabe, Rechnungswesen und BWL entfernt (Karten + Views gelöscht); „Bedarfsplanung" umbenannt zu „Brandschutzbedarfsplanung"; neuer Hub-Tab „Bedarfsplanung" mit 3 Unterbereichen (Brandschutz-, RD- und KatS-Bedarfsplanung)'
    ]},
    
    {v:'2.29.34',ts:'2026-08-25T00:00',items:[
      'KF_QUIZ: Neue Frage 1 – Besonderheiten & Konsequenzen des Haushaltswesens für FW-Führungskräfte (5 Punkte, 5 Abschnitte: langer Weg/18 Monate, Konsequenzen, FW-Konflikte, Vergaberecht, Steuerungsauftrag); alle bisherigen Fragen 1–12 zu Fragen 2–13 verschoben; Gesamtpunkte 60→65, Fragenanzahl 12→13'
    ]},
    {v:'2.29.33',ts:'2026-08-25T00:00',items:[
      'KF_QUIZ F8–F12: Antworten an Vorlesungsfolien Modul 3.3 angepasst – F8: Kameralistik/Doppik auf PDF-Terminologie (Kassensteuerung, Abgrenzung Effektivität, Generationengerechtigkeit, NSM/NPM); F9: 4 Aspekte neutrales LV nach S.22 (Neutralität, Diskriminierungsverbot, Wettbewerbssicherung, Rechtssicherheit); F10: Fragetext+Antwort auf Weg der Ansatzermittlung (S.32) korrigiert; F11: 4 Kategorien nach S.28 VWL (Indirekte WS, Faktor Zeit, Betriebserhalt, Existenzsicherung); F12: 5 Kategorien KNA nach S.42 VWL (Bewertungstool, Entscheidungshilfe, Wirtschaftlichkeitsnachweis, Makro-Blick, Priorisierung)'
    ]},
    {v:'2.29.32',ts:'2026-08-25T00:00',items:[
      'Neuer Tab „KatS-Bedarfsplanung" in FeuAK: 6 Accordion-Abschnitte auf Basis der Lülf+-Präsentation – Grundlagen & Methodik, Katastrophenkreislauf & Zuständigkeiten, Relevanz der KatSBP, Die 5 Phasen (Brainstorming → Szenarienauswahl → Folgenbetrachtung → Planungsziele → Maßnahmenableitung), Allokation & Modulverschränkung, Abgrenzung KatS vs. Alltag'
    ]},
    {v:'2.29.31',ts:'2026-08-25T00:00',items:[
      'Neuer Tab „RD-Bedarfsplanung" in FeuAK: 7 Accordion-Abschnitte auf Basis der Lülf+-Präsentation – Rahmenbedingungen & Akteure, Zeitabschnitte & Hilfsfrist, IST-Analyse (Hilfsfristerreichung + Problemfeldanalyse), Standortstruktur von Rettungswachen, Vorhaltebemessung (KTW/RTW/NEF), Aktuelle Entwicklungen, Abgrenzung BEP vs. RDBP'
    ]},
    {v:'2.29.30',ts:'2026-08-24T00:00',items:[
      'Klausurfragen F6 + Lernkarte h58: Zweigleisige IST-Analyse RDBP korrigiert – korrekte zwei Analysen: (1) Analyse der Hilfsfristerreichung (Gesamterreichung vs. ab zuständiger Wache → Ressourcenverfügbarkeits- vs. Standortproblem) und (2) Problemfeldanalyse (3 Verursachungsbeiträge: Standortstruktur/Verkehr · Ausrückzeit · Ressourcenverfügbarkeit)'
    ]},
    {v:'2.29.29',ts:'2026-08-24T00:00',items:[
      'Klausurfragen F6: Zweigleisige IST-Analyse RDBP überarbeitet nach Lülf+-Präsentation – Frequenzanalyse (Langzeitentwicklung, räumlich/zeitlich, Tageskategorien, KTW-Angebotsdruck) und Hilfsfristerreichungsanalyse (Gesamterreichung vs. zuständige Wache, Problemfeldanalyse mit 3 Verursachungsbeiträgen)'
    ]},
    {v:'2.29.28',ts:'2026-08-24T00:00',items:[
      'Klausurfragen F7: Phasenmodell KatS-Bedarfsplanung auf 5 Phasen aktualisiert (Brainstorming · Szenarienauswahl · Szenarienfolgenbetrachtung · Planungsziele · Maßnahmenableitung) nach Lülf+/BBK-Leitfaden; Musterlösung und Kurzantwort überarbeitet'
    ]},
    {v:'2.29.27',ts:'2026-08-24T00:00',items:[
      'Klausurfragen: alle 12 Fragen auf einheitlich 5 Punkte (60 Punkte gesamt); Timer entfernt'
    ]},
    {v:'2.29.26',ts:'2026-08-24T00:00',items:[
      'Neuer Tab „Klausurfragen": 12 Fragen aus Dozenten-Fragenliste · 66 Punkte · 90-Min.-Timer · Musterlösung + Kurzantwort; platziert vor den Eingrenzungen im Klausur-Hub'
    ]},
    {v:'2.29.25',ts:'2026-08-24T00:00',items:[
      'AGBF 1998 vs. 2015: Erreichungsgrad korrigiert (95 % → 90 %, nicht 80 % → 90 %); Antwortinhalt auf Basis Lindemann-Folie vollständig überarbeitet – 6 Änderungspunkte (Herleitung entfallen, Einsatzmittel ergänzt, Erreichungsgrad, Szenario, Formulierung Funktionsstärke, mind. 50 Einsätze); betrifft Eingrenzung F12, FeuAK F13 und Lernkarte h52'
    ]},
    {v:'2.29.24',ts:'2026-08-24T00:00',items:[
      'Bedarfsplanung-Tab: 4 neue Akkordeons (07–10) – Drei Ermessensqualitäten, BEP-Aufbau, Erlang-B-Formel, GIS-Standortplanung; irrtümlich eingefügte Lernkarten wieder entfernt'
    ]},
    {v:'2.29.23',ts:'2026-08-24T00:00',items:[
      'Bedarfsplanung-Tab: 5 neue Karten – Drei Ermessensqualitäten, BEP-Aufbau, Erlang-B-Formel, GIS-Standortplanung, Externe Sachverständige'
    ]},
    {v:'2.29.22',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Musterlösung-Button leuchtet gold, Kurzantwort-Button silber'
    ]},
    {v:'2.29.21',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: aktive Buttons in wärmerem Goldton (#D4923A)'
    ]},
    {v:'2.29.20',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Fragen 11+12 (AGBF) an richtiger Position (Doppelkomma-Fix); aktive Buttons leuchten golden'
    ]},
    {v:'2.29.19',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Frage 11 (AGBF 4 Elemente Schutzziel) und Frage 12 (AGBF 1998 vs. 2015) aus Altklausur-Training übernommen, je mit Musterlösung und Kurzantwort'
    ]},
    {v:'2.29.18',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: aktive Buttons farblich hervorgehoben; Neu-beginnen-Button funktioniert jetzt (confirm()-Dialog entfernt)'
    ]},
    {v:'2.29.17',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Musterlösung- und Kurzantwort-Button als Toggle – beliebig ein- und ausblendbar, Wechsel jederzeit möglich'
    ]},
    {v:'2.29.16',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Musterlösung- und Kurzantwort-Button bleiben sichtbar; beide Antworten gleichzeitig anzeigbar'
    ]},
    {v:'2.29.15',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Kurzantwort-Button neben Musterlösung – kompakte Lernversion aller 10 Antworten'
    ]},
    {v:'2.29.14',ts:'2026-08-21T00:00',items:[
      'Impressum: §5 TMG → §5 DDG aktualisiert'
    ]},
    {v:'2.29.13',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: vereinfacht – nur noch die zwei EU-Schwellenwerte (Liefer-/DL und Bauleistungen), kein Nennen-Sie-außerdem-Block'
    ]},
    {v:'2.29.12',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: Fragetext auf v2.29.8-Stand korrigiert (Bauleistungen (b) explizit, Nennen Sie außerdem-Block erhalten)'
    ]},
    {v:'2.29.11',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: auf v2.29.7-Stand zurückgesetzt (vollständige Antwort mit Schwellenwerten, Zeitpunkt, FW-Fahrzeugen, Angebotsfrist)'
    ]},
    {v:'2.29.10',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: Struktur repariert (Off-by-one-Fehler aus v2.29.9); Frage und Antwort korrekt auf zwei Schwellenwerte reduziert; {id:10} wiederhergestellt'
    ]},
    {v:'2.29.9',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: Frage und Antwort auf die beiden Schwellenwerte reduziert (216.000 € Liefer/DL · 5.404.000 € Bauleistungen)'
    ]},
    {v:'2.29.8',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: Fragetext auf beide Schwellenwerte (Liefer/DL + Bauleistungen) angepasst'
    ]},
    {v:'2.29.7',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: Bauleistungen-Schwellenwert 5.404.000 € ergänzt; F10: Fragetext auf „mind. 5 der 9 Grundsätze" geändert, Antwort auf reine Namensliste (keine Stichpunkte)'
    ]},
    {v:'2.29.6',ts:'2026-08-21T00:00',items:[
      'Eingrenzung Fragen 1–9: Antworten gestrafft – Prosa zu Stichpunkten, Frankfurt-Rechenbeispiel (F5) entfernt, F2/F7/F8 redundante Blöcke gekürzt, F3 alle 8 Bereiche kompakt auf Produkte/Beteiligte/Indikator, Folienzahlen beibehalten'
    ]},
    {v:'2.29.5',ts:'2026-08-20T00:00',items:[
      'Beschaffungspraxis Acc 04 + Eingrenzung Frage 10: Wirtschaftlichkeit als eigenständiger Grundsatz #3 wiederhergestellt – korrekt 9 Grundsätze des Vergaberechts in Uhrzeigersinn-Reihenfolge des Kreisdiagramms (Reinstorf 2026)'
    ]},
    {v:'2.29.4',ts:'2026-08-20T23:55',items:[
      'Beschaffungspraxis Acc 04 + Eingrenzung Frage 10: „Gebot der Mittelstandsfreundlichkeit" als eigener Grundsatz ergänzt (§97 Abs. 4 GWB, Losaufteilung); Wirtschaftlichkeit als übergeordnetes Ziel (MEAT) herausgelöst; damit exakt 8 nummerierte Grundsätze'
    ]},
    {v:'2.29.3',ts:'2026-08-20T23:45',items:[
      'Eingrenzung Frage 10: Antwort auf Reinstorf-Slide-Stichpunkte ausgerichtet (§-Verweise, Bieterkommunikation, Verhältnismäßigkeit §124 I GWB, strategische Ziele)',
      'Beschaffungspraxis Acc 04: Vergabegrundsätze auf alle 8 Grundsätze erweitert mit vollständigen Stichpunkten aus der Vorlesung (§7 VgV, §20 VgV, §97, §122, §124, §127, §160 GWB)'
    ]},
    {v:'2.29.2',ts:'2026-08-20T23:30',items:[
      'Eingrenzung-Quiz: 2 neue Fragen (F9: EU-Schwellenwert 216.000 € / Angebotsfristen · F10: 8 Grundsätze Vergaberecht §97 GWB) · Timer 30 → 40 Min.',
      'FeuAK-Altklausur F9: Schwellenwert auf 216.000 € (2026) und Frist auf 35 Tage (§15 VgV) korrigiert',
      'Vergabe-Tab: Oberschwellenwerte auf 2026-Werte aktualisiert (216.000 € / 5.404.000 €)'
    ]},
    {v:'2.29.1',ts:'2026-08-20T23:00',items:[
      '28 Lernkarten entfernt: FeuAK · Beschaffungspraxis (h106–h117, h125–h133), FeuAK · Stakeholder (h118–h121) und FeuAK · Risikoanalyse (h122–h124) – nicht Bestandteil der 17 Groblernziele / Eingrenzung'
    ]},
    {v:'2.29.0',ts:'2026-08-20T22:00',items:[
      'Neue Lernkarte h133: Strategische Handlungsfelder des Warengruppenmanagements (WGM) – 5 Felder: Wettbewerb stärken, Standardisierung, Dienstleistersteuerung, Qualität/Abhängigkeiten, Know-how-Transfer'
    ]},
    {v:'2.28.9',ts:'2026-08-20T21:00',items:[
      'Acc 07 (Beschaffungspraxis): Reinstorf-Badge bei „Ablauf des Vergabeprozesses (offenes Verfahren)" entfernt – Inhalt nicht im Reinstorf-Skript nachweisbar'
    ]},
    {v:'2.28.8',ts:'2026-08-20T20:00',items:[
      'Acc 03 (Beschaffungspraxis): Digitaler Marktplatz Deutschland & KI-Einsatz + Strategische Aspekte WGM aus Acc 10 hierher verschoben',
      'Reinstorf-Badges im Inneren von Acc 03 und Acc 04 entfernt – Badge verbleibt nur in der Akkordeon-Überschrift (Summary)'
    ]},
    {v:'2.28.7',ts:'2026-08-20T19:00',items:[
      'Reinstorf-2026-Badge auf Akkordeon-Ebene: Acc 03 (Vergaberecht: Grundlagen & Schwellenwerte) und Acc 04 (Vergabegrundsätze & Verfahrensarten) im Tab Beschaffungspraxis – beide vollständig aus Reinstorf 2026'
    ]},
    {v:'2.28.6',ts:'2026-08-20T18:00',items:[
      '12 weitere Reinstorf-2026-Badges (gold) im Tab Beschaffungspraxis: Definition Vergaberecht, Zweiteilung, EU-Schwellenwerte, Ausnahmen (Acc 03), Grundsätze, Verfahrensarten, Angebotswertung (Acc 04), Markterkundung (Acc 05), Bestandteile VU, Ablauf Vergabeprozess, Zuschlagskriterien (Acc 07), Strategische Aspekte WGM (Acc 10)'
    ]},
    {v:'2.28.5',ts:'2026-08-20T17:00',items:[
      '3 neue Lernkarten: h130 (Herausforderungen + Anwendungsbereich §98–105 GWB), h131 (Teilnehmer am Vergabeverfahren / Bietergemeinschaft §43 VgV), h132 (Digitaler Marktplatz Deutschland / KI-Einsatz)',
      'Reinstorf-2026-Badge (golden) an 4 Acc-Sub-Überschriften im Tab Beschaffungspraxis ergänzt'
    ]},
    {v:'2.28.4',ts:'2026-08-20T16:00',items:[
      'Acc 03: Aktuelle Herausforderungen öffentlicher Vergabe (Bietermangel, EU-Rechnungshof 2023 „verlorenes Jahrzehnt") ergänzt',
      'Acc 03: Anwendungsbereich des Vergaberechts §98–105 GWB (persönlich + sachlich) ergänzt',
      'Acc 03: HmbTG – Hamburger Transparenzgesetz als Hinweis ergänzt',
      'Acc 04: Teilnehmer am Vergabeverfahren (Bewerber, Bieter, Bietergemeinschaft §43 VgV, Unterauftragnehmer) ergänzt',
      'Acc 10: Digitaler Marktplatz Deutschland & KI-Einsatz bei Vergaben (Koalitionsvertrag 2025, M150/M151, KI-Anwendungsfälle) ergänzt'
    ]},
    {v:'2.28.3',ts:'2026-08-20T15:00',items:[
      '5 neue Lernkarten FeuAK · Beschaffungspraxis: h125 (12 Schadensbilder), h126 (Ziele + Zivilschutzausstattung Bund), h127 (Sonderausstattung + Wattiefe-Faktoren), h128 (Vergabeprozess-Ablauf 7 Schritte + Vertragsstrafe), h129 (Inbetriebnahme + Presse + Projektdokumentation + Mängelabarbeitung)',
      'h109 aktualisiert: §3 VgV Zeitpunkt (Tag der Auftragsbekanntmachung) + Optionen/Verlängerungen einbeziehen'
    ]},
    {v:'2.28.2',ts:'2026-08-20T14:00',items:[
      'FeuAK-Tab Beschaffungspraxis: 9 Inhaltslücken aus Demtröder-PDF geschlossen',
      'Acc 01: Schäden-Liste auf 12 laufzeitrelevante Schadensbilder erweitert',
      'Acc 02: Ziele eines Fahrzeugbeschaffungsprogramms und Exkurs Zivilschutzausstattung des Bundes ergänzt',
      'Acc 03: §3-VgV-Zeitpunkt (Tag der Auftragsbekanntmachung) und Einbeziehung von Optionen ergänzt',
      'Acc 05: Besondere Ausstattungsmerkmale, technische Faktoren Wattiefe und Bedarfsplan als Förderbedingung ergänzt',
      'Acc 07: Vergabeprozess-Ablauf (7 Schritte) und Vertragsstrafe/Garantieansprüche ergänzt',
      'Acc 09: Vertragsstrafe, Garantieansprüche und Reklamationsbeseitigung ergänzt',
      'Acc 10: Presse- und Medienarbeit, abschließende Projektdokumentation und nachträgliche Mängelabarbeitung ergänzt'
    ]},
    {v:'2.28.1',ts:'2026-08-20T13:00',items:[
      '19 neue Lernkarten: FeuAK Beschaffungspraxis (h106–h117), Stakeholder-Analyse (h118–h121), Risikoanalyse (h122–h124)',
      'h44 aktualisiert: EU-Schwellenwerte auf Stand 1.1.2026 (216.000 € statt 221.000 €, Bau 5.404.000 €)'
    ]},
    {v:'2.28.0',ts:'2026-08-20T12:00',items:[
      'Neuer FeuAK-Tab „Beschaffungspraxis": 10 Akkordeons zu Ausgangslage, Bedarfsermittlung & Investitionsplanung, Vergaberecht & Schwellenwerte, Vergabegrundsätze & Verfahrensarten, Vorplanung & Markterkundung, Haushaltsmittel & Lebenszykluskosten, Vergabeunterlagen & Leistungsbeschreibung, Losbildung & Blockbeschaffung, Abnahme sowie Inbetriebnahme & Verwertung',
      'Inhalte aus Demtröder 2026 (Fahrzeugbeschaffung HLF 20, FeuAK HH) und Reinstorf 2026 (Grundlagenwissen öffentliche Beschaffungen)'
    ]},
    {v:'2.27.1',ts:'2026-08-19T17:00',items:[
      'Eingrenzung F3: Alle 8 Feuerwehr-Bereiche vollständig ausgearbeitet (je Produkte, Beteiligte, Indikatoren) – Ausbildung, Fortbildung, Vorbeugender Brandschutz, Rettungsdienst, Technik, IuK neu hinzugefügt'
    ]},
    {v:'2.27.0',ts:'2026-08-19T16:00',items:[
      'Eingrenzung: Alle 8 Fragen durch echte Dozenten-Klausurfragen aus den offiziellen Klausurhinweisen ersetzt (50 Pkt, zuvor 44 Pkt)',
      'Antworten aus Musterlösung + Vorlesungsfolien (Haushalt, BSC/QM, Bedarfsplanung, Vergabe, Risikoanalyse) synthetisiert',
      'Punktzahl-Anzeige im Klausuren-Hub und in der Eingrenzungsseite auf 50 Pkt korrigiert'
    ]},
    {v:'2.26.0',ts:'2026-08-19T14:00',items:[
      'Neu: Tab „Eingrenzung – Klausur 08/2026 & Münster 2026" mit 8 Dozenten-Klausurfragen und 30-Min.-Timer (EINGRENZUNG_QUIZ)',
      'Neu: Hub-Tab „Klausuren" fasst Eingrenzung, Altklausur-Training und Prüfungsleistung in einer Übersicht zusammen',
      'FeuAK-Übersicht: Zwei Einzelkacheln durch eine „Klausuren"-Kachel ersetzt'
    ]},
    {v:'2.25.0',ts:'2026-08-19T12:00',items:[
      'QM: Vergleichsabschnitt „Personal-Ist-Faktor vs. Ist-Stellenfaktor" ergänzt – mit Kernunterschied, Visualisierung und Realdaten FW Frankfurt 2023'
    ]},
    {v:'2.24.1',ts:'2026-08-18T20:00',items:[
      'Planspiel MANV: Bugfix – fehlende </details>-Tags im OLRD-Akkordeon ergänzt, nachfolgende Akkordeons wieder eigenständig'
    ]},
    {v:'2.24.0',ts:'2026-08-18T19:30',items:[
      'Planspiel MANV: OLRD-Akkordeon von acc09 auf acc05 verschoben – direkt nach Oberste Führungsebene',
      'Reihenfolge: MANV-Grundlagen→06, HEIKAT→07, Organigramm→08, Lagekarte→09'
    ]},
    {v:'2.23.0',ts:'2026-08-18T19:00',items:[
      'Planspiel MANV: Acc09 „OLRD – Rolle im Planspiel" neu ergänzt',
      'Ablauf Berliner Platz: 4 Schritte kommissarische Übernahme → Lagemeldung → Abschnitte → Transport',
      'OLRD (grün) vs. LNA (blau): Aufgabenteilung auf einen Blick',
      'Hinweiskarte: Schnittstelle Verbandsführer ↔ OLRD – wer spricht wen für was an'
    ]},
    {v:'2.22.0',ts:'2026-08-18T18:00',items:[
      'Dezentes Farbschema auf der gesamten Lernwebsite – semantisch begründete Farbakzente in allen Haupttabs',
      'Neue CSS-Klasse ic-r (rot) für Gefahren/Verbote – löst alle inline-Styles ab',
      'HLFS Führungsvorgang: AUTO-Regel (blau) vs. EIMER-Regel (amber), Gefahr (rot) vs. Entschluss (grün)',
      'IBK Stress: JD-R-Modell – Job Demands (rot) vs. Job Resources (grün); BGM-Gesundheitsdimensionen + Salutogenese-Trias eingefärbt',
      'FeuAK VWL: Skaleneffekte Vorteile (grün) / Nachteile (amber)',
      'Bedarfsplanung: Szenarien + Externe Sachverständige – dafür (grün) vs. dagegen (amber)',
      'IdF Auftragstaktik: Vorteile (grün) / Voraussetzungen (blau)'
    ]},
    {v:'2.21.0',ts:'2026-08-18T16:30',items:[
      'FeuAK QM: Farbakzente auf nötigstes reduziert – nur noch 5 semantisch begründete Stellen',
      'Acc04 Vorläufige HHF: Erlaubt (grün) / Nicht erlaubt (rot) – weiterhin eingefärbt',
      'Acc05 NSM: Kameralistik (amber) vs. Doppik (blau) – direkter Systemvergleich',
      'Acc09 PDCA: P=blau, D=grün, C=amber – Phasenzyklus farblich markiert',
      'Acc10 Stakeholder-Matrix: 4 Quadranten (grün/amber/blau/neutral) + Risikoanalyse (grün/blau/amber/rot)',
      'Acc13 24h-Dienst: Vorteile (grün) / Nachteile (amber); 2WA (blau) / 3WA (amber) / 4WA (grün)'
    ]},
    {v:'2.20.9',ts:'2026-08-18T15:30',items:[
      'FeuAK QM: Farbliche Akzente im gesamten QM-Tab – semantische Farb-Varianten (blau/grün/amber) für info-card, def-box und step-letter',
      'Acc01: Einnahmequellen-Schritte (2=blau, 3=amber, 4=rot), Finanzausgleich-Cards (blau/grün), Haushaltsgrundsätze (blau/amber/grün)',
      'Acc03: VE-Schritte (blau/amber/grün), Deckungsfähigkeit/Übertragbarkeit/Mittelbindung, IP/Stellenplan',
      'Acc04: Erlaubt (grün) / Nicht erlaubt (rot)',
      'Acc05: NSM 8 Elemente abwechselnd blau/grün/amber, 3-Säulen (blau/amber/grün), Kameralistik (amber) vs. Doppik (blau)',
      'Acc06: KLR 3 Ebenen – Kostenträger (grün), Kostenstelle (blau), Kostenart (amber)',
      'Acc07: Internes (blau) / Externes Controlling (grün), Absolut (amber) / Verhältnis-KZ (blau)',
      'Acc08: Primär (blau) / Sekundärprozesse (amber), Teilprozess-Cards',
      'Acc09: PDCA P=blau, D=grün, C=amber, A=gold; Fehlerkultur def-box grün; BEP-Cards, Schutzziele/Mengenbezugsgrößen/Maßnahmen',
      'Acc10: Stakeholder-Matrix 4 Quadranten (grün/amber/blau/neutral), Risikoanalyse (grün/blau/amber/rot)',
      'Acc11: Produkte (blau), Qualitätsansprüche (grün), Stakeholder (amber) durch alle BF-Bereiche',
      'Acc12: Personal-Ist (blau), Soll (amber), Ist-Stellen (grün), Mehrarbeit-Cards, Transferleistungen/Funktionsunterschreitungen',
      'Acc13: Anforderungen (blau) / Voraussetzungen (grün), EU-RL (amber) / ArbSchG (blau), 24h Vorteile (grün) / Nachteile (amber), 2WA (blau) / 3WA (amber) / 4WA (grün)'
    ]},
    {v:'2.20.8',ts:'2026-08-18T14:00',items:[
      'FeuAK QM: Lückenanalyse – fehlende Inhalte aus Jackel-Skript nachgetragen',
      'QM Acc01: Haushaltsgrundsätze (Wirtschaftlichkeit & Sparsamkeit, Vollständigkeit & Einheit, Jährlichkeit, Gesamtdeckungsprinzip) und Schlüsselzuweisungen ergänzt',
      'QM Acc07: Kennzahlensystematik (Absolut- vs. Verhältnis-Kennzahlen) vor Benchmarking eingefügt',
      'QM Acc09: Fehlerkultur als QM-Element und BEP-Inhalte Funktionssoll & Standortplanung ergänzt',
      'QM Acc13: Schichtfolge-Beispiele inkl. Bremer Modell (D–N–F–F–F), 2/3-Wechsel und RD-taugliche Varianten hinzugefügt'
    ]},
    {v:'2.20.7',ts:'2026-08-18T12:00',items:[
      'FeuAK: Neuer Tab „Qualitätsmanagement" (Skript Jackel, FL 3.3b) – 13 Akkordeons: Einnahmequellen/Finanzausgleich, Haushaltsstruktur, Haushaltspläne, Vorläufige Haushaltsführung, NSM & 3-Säulen-Modell, KLR, Controlling, Prozessmanagement, QM & Brandschutzbedarfsplan, Management-Instrumente, QM nach BF-Bereichen, Personalfaktor, Dienstplanung & Dienstplanmodelle',
      'FeuAK: Haushalt-Tab bereinigt – alle Jackel-markierten Inhalte (Acc 03–05, 08–09, 11–14) ausgelagert in neuen QM-Tab, restliche Akkordeons neu nummeriert'
    ]},
    {v:'2.20.6',ts:'2026-08-18T10:30',items:[
      'FeuAK: Tab „Projektmanagement / Strategisches Management" umbenannt in „Strategisches Management" (Topic-Card, Seitenüberschrift, Kategorie-Map)'
    ]},
    {v:'2.20.5',ts:'2026-08-18T10:00',items:[
      'FeuAK: Neuer Tab Planspiel MANV – Berliner Platz (Polizeilage / LebEL)',
      'Planspiel: 8 Akkordeons – Fahrzeugführer, Zugführer, Verbandsführer, Oberste Führungsebene (Direktionsdienst), MANV-Grundlagen & Sichtung, HEIKAT & Besonderheiten, Organigramm (SVG), Lagekarte (SVG)',
      'Planspiel: Organigramm nach handgezeichnetem Skript (EL-Raute + Lts-Kreis = TEL, EA Tech./Betreuung/med.Rettung, BR, Patientenablagen, Transportorganisation)',
      'Planspiel: Lagekarte mit Drei-Zonen-Konzept (Rot/Gelb/Grün), PA, BHP, LEBEL, Bereitstellungsraum, Zu-/Abfahrt'
    ]},
    {v:'2.20.4',ts:'2026-08-17T22:00',items:[
      'HLFS Kassel MANV & OLRD: 2 neue Akkordeons – OLRD Aufgaben/Qualifikation/Fahrzeug (Fg 21 HLFS, § 18 DVO HRDG) und Med. EL LNA+OLRD Abgrenzung+Alarmierung (§ 8 HRDG)',
      'HLFS MANV: Akkordeon 02 Führungsstruktur erweitert (med. EL, Fachautonomie LNA, kommissarische Übernahme)',
      'HLFS MANV: Akkordeon 03 um Verletztensammelstelle (VSt) ergänzt, Schnittstelle FW→RD an der PA präzisiert',
      'HLFS MANV: Page-Lead und MANV-Definition um Hessische Stufenfolge (MANV-0→1000) ergänzt'
    ]},
    {v:'2.20.3',ts:'2026-08-17T20:00',items:[
      'FeuAK Haushalt: 11 neue Lernkarten h95–h105 (Finanzausgleich, Produktpyramide, VE/IP/Stellenplan, investiv/konsumtiv, Mehrausgaben, Kameralistik vs. Doppik, Controlling, Prozessmanagement, PDCA/BEP, Markterkundung, Rechnungsprüfung)',
      'Lernkartenzahl auf 364 aktualisiert'
    ]},
    {v:'2.20.2',ts:'2026-08-17T18:00',items:[
      'FeuAK Haushalt: 4 Akkordeon-Paare zusammengefasst – 20 → 16 Akkordeons',
      'FeuAK Haushalt: Akk 03+04 → „Einnahmequellen & Finanzausgleich"; Akk 06+07 → „Haushaltspläne – Aufbau, VE, IP & Stellenplan"',
      'FeuAK Haushalt: Akk 17+18 → „Beschaffung: Markterkundung & Vertragsmanagement"; Akk 19+20 → „Kontrolle & Rechnungsprüfung"'
    ]},
    {v:'2.20.1',ts:'2026-08-17T16:00',items:[
      'FeuAK Haushalt: Reihenfolge aller 20 Akkordeons nach Jackel-Skript-Struktur korrigiert (Teil 1 Grundlagen → Teil 2 NSM → Teil 3 Beschaffung & Kontrolle)',
      'FeuAK Haushalt: Dopplung 3-Säulen-Modell entfernt (war in Akk 05 und 11 – jetzt nur in 11)',
      'FeuAK Haushalt: Dopplung Produktpyramide entfernt (stand zweimal in Akk 14 – zu einer Sektion zusammengeführt)'
    ]},
    {v:'2.20.0',ts:'2026-08-17T14:00',items:[
      'FeuAK Haushalt: 5 neue Akkordeons aus Skript Jackel (FL 3.3b, FeuAK Hamburg 08/2026) – Finanzausgleich, Investitionsprogramm & Stellenplan, Controlling, Prozessmanagement, QM & Brandschutzbedarfsplan',
      'FeuAK Haushalt: 5 Badges „nicht im Skript" → „Skript Jackel" (Akk 11–15 alle im Jackel-Skript enthalten)',
      'FeuAK Haushalt: Akk 05 (Doppik) um Aufwand/Ertrag-Definition ergänzt; Akk 09 (Budgetierung) um Restmittel-Übertragbarkeit und „Todsünden"; Akk 11 (NSM) alle 8 Elemente als Cards; Akk 12 (KLR) Gebührenbezug und Steuerungsebenen; Akk 14 (Haushaltsstruktur) Produktpyramide 5 Ebenen + 2 Steuerungsebenen; Akk 15 (Vorläufige HF) 18-Monate-Prozess und Praxis-Hinweis',
      'FeuAK Haushalt: Untertitel auf Skript Jackel als Quelle aktualisiert'
    ]},
    {v:'2.19.8',ts:'2026-08-11T19:00',items:[
      'PM Entscheidungstheorie: Ambiguitätstoleranz nach Skript 1 S. 22 ergänzt (hint-Box nach 3 Rationalitäten)',
      'Lernkarte h85: Frage und Antwort um Ambiguitätstoleranz erweitert'
    ]},
    {v:'2.19.7',ts:'2026-08-11T18:00',items:[
      'Lernkarten PM h78–h94: Reihenfolge an Abschnittsfolge angepasst (Abschnitt 01→02→03→04→05→10) und IDs entsprechend neu nummeriert'
    ]},
    {v:'2.19.6',ts:'2026-08-11T17:00',items:[
      'PM-Tab: Reihenfolge an PDF-Gliederung angepasst – PDF 1 (Kap.1–3) komplett vor PDF 2 (Stakeholder)',
      'PM-Tab: Neue Nummerierung 01–10 (Strategie→Entscheidung→Mintzberg→VUKA→Stakeholder→Prozess→QM→Controlling→Risiko)'
    ]},
    {v:'2.19.5',ts:'2026-08-11T16:00',items:[
      'PM-Tab: Section 06 und 09 getauscht – Reihenfolge entspricht jetzt Skript-Gliederung (Kap. 1 → 2 → 3)'
    ]},
    {v:'2.19.4',ts:'2026-08-11T15:00',items:[
      'Lernkarten: 17 neue PM-Karten h78–h94 (VUKA, BANI, Entscheidungstheorie, Mintzberg, Clausewitz, Gälweiler, Strategiehierarchie, 8 Handlungsfelder, Risikoanalyse, Wohlfahrtsdreieck, Prosumption, Porter)'
    ]},
    {v:'2.19.3',ts:'2026-08-11T14:00',items:[
      'PM-Tab: Prolog-Inhalte (Wohlfahrtsdreieck + SVG-Grafik, Prosumption, 4 Dienstleistungstypen) in Section 01 integriert',
      'PM-Tab: Section 11 entfernt (Inhalte in Section 01 zusammengeführt)',
      'PM-Tab: Section 01 – Titel zu „Grundlagen: Feuerwehr & Strategisches Management" aktualisiert'
    ]},
    {v:'2.19.2',ts:'2026-08-11T13:30',items:[
      'PM-Tab: 3 Strategietypen in Section 01 integriert, Nummerierung 02–11 angepasst'
    ]},
    {v:'2.19.1',ts:'2026-08-11T13:00',items:[
      'PM-Tab: Gälweiler-Definition + „Strat. Mgmt. ohne Markt" in Section 10 ergänzt',
      'PM-Tab: Neue Section 12 – Wohlfahrtsdreieck, Prosumption & 4 Dienstleistungstypen',
      'PM-Tab: Section 08 – 6 Entscheidungsarten der Unternehmensleitung ergänzt',
      'PM-Tab: Section 03 – Stakeholder- vs. Shareholder-Ansatz Vollvergleich (4 Kriterien)'
    ]},
    {v:'2.19.0',ts:'2026-08-11T12:00',items:[
      'PM-Tab: 5 neue Sektionen aus FeuAK-Skripten (VUKA/BANI, Entscheidungstheorie, Mintzberg, Strategiehierarchie, Prospektive Risikoanalyse)',
      'PM-Tab: Stakeholderanalyse erweitert (Etzioni-Bindungsgründe, Macht/Legitimität/Dringlichkeit, 7 Stakeholder-Typen, Einfluss-Interessen-Matrix, 10 Schlüsselfragen)'
    ]},
    {v:'2.18.17',ts:'2026-08-10T15:00',items:[
      'VWL-Tab: Hinweisboxen in Section 08 & 09 lesbar gemacht (inline border-color-Override entfernt, Standard-Hint-Styling)'
    ]},
    {v:'2.18.16',ts:'2026-08-10T14:00',items:[
      'VWL-Tab: Titel bleibt „VWL"; Eyebrow auf „FeuAK Hamburg · Volkswirtschaftslehre" aktualisiert',
      'Neue Section 08: Marktformen &amp; Preis-Mengen-Diagramm (Polypol/Oligopol/Monopol, Kurvenverschiebungen, Altklausur F15/F16) – als „nicht in Modul 3.3" gekennzeichnet',
      'Neue Section 09: Bruttoinlandsprodukt (BIP) mit Definition, 3 Berechnungsseiten, 6 Kritikpunkten, Alternativen (Altklausur F17) – als „nicht in Modul 3.3" gekennzeichnet',
      'Flashcard h27 (Konjunkturzyklus) gelöscht',
      'Lernkarten gesamt: 320 → 319'
    ]},
    {v:'2.18.15',ts:'2026-08-10T13:00',items:[
      'FeuAK VWL-Tab komplett neu nach Modul 3.3 der Vorlesung: 7 Kapitel – Swiftonomics/Multiplikatoreffekt, VWL-Grundlagen &amp; VWL vs. BWL, Knappheit &amp; Opportunitätskosten, Marktversagen &amp; Staatsrolle, Feuerwehr im Wirtschaftskreislauf, Ressourcenmanagement &amp; Effizienz (TCO, Skaleneffekte, Personalökonomie), Kosten-Nutzen-Analysen (KNA, Grenzkosten der Sicherheit)',
      'Vorherige Inhalte (10 VWL-Regeln, Marktformen, BIP, Gütertabelle) durch vorlesungsrelevante Inhalte ersetzt',
      '19 VWL-Lernkarten vollständig überarbeitet: 11 bestehende Karten aktualisiert/neu bespielt (h01–h05, h28, h46, h51, h54, h67, h68), 8 neue Karten h70–h77 (Positive Externalität, Ressourcenmanagement, Effizienz vs. Effektivität, Personalökonomie, Skaleneffekte, TCO, KNA, Grenzkosten)',
      'Lernkarten gesamt: 312 → 320'
    ]},
    {v:'2.18.13',ts:'2026-08-07T16:00',items:[
      '9 neue FeuAK-Lernkarten h61–h69: Haushaltsgrundsätze, QM ISO 9001, Produkte/Kunden/Merkmale FW, BSC-Kennzahlen, Strategische Personalplanung, Beschaffungsalternativen HLF 20, VWL Nachfrageeffekte, VWL Angebotseffekte, Bilanz HGB vollständig',
      'Lernkarten gesamt: 303 → 312',
      'Bug-Fix: Kartenzähler in Lernkarten-Tab, Startseite und Onboarding auf 312 korrigiert (war fälschlicherweise noch 284)'
    ]},
    {v:'2.18.12',ts:'2026-08-07T15:00',items:[
      'FeuAK Altklausur: Punktzahl je Frage neu bewertet – differenzierte Verteilung nach Umfang und Komplexität (3–7 Punkte statt pauschal 5); Gesamtpunktzahl bleibt 110'
    ]},
    {v:'2.18.11',ts:'2026-08-07T14:00',items:[
      'FeuAK Altklausur-Training: komplett neu gestaltet – identisches Design wie VAk-Übungsklausur mit 90-Min.-Timer, Startbildschirm mit Frageübersicht, Selbstbewertung, Dot-Navigation und gespeichertem Fortschritt'
    ]},
    {v:'2.18.10',ts:'2026-08-07T13:00',items:[
      'FeuAK Altklausur: Design des Textfeldes identisch mit den VAk-Übungsfällen',
      'FeuAK Altklausur: Textfeld bleibt beim Vor-/Zurück-Blättern erhalten (kein automatisches Löschen)',
      'FeuAK Übersicht: „Altklausur-Training" steht jetzt an erster Stelle'
    ]},
    {v:'2.18.9',ts:'2026-08-07T12:00',items:[
      'FeuAK Altklausur-Training: Freitext-Eingabefeld – eigene Antwort formulieren, bevor die Musterlösung aufgedeckt wird'
    ]},
    {v:'2.18.8',ts:'2026-08-07T11:00',items:[
      'Neuer Tab: FeuAK Altklausur-Training – 22 Essay-Fragen aus Gedächtnisprotokollen Hamburg Aug 2025 &amp; Feb 2026 mit vollständigen Musterlösungen',
      '19 neue FeuAK-Lernkarten h42–h60: BSC, Haushalt, Vergabe, AGBF 1998/2015, KTW-Kurve, IST-Analysen RD, Doppik, Rechnungswesen',
      'Lernkarten gesamt: 284 → 303'
    ]},
    {v:'2.18.5',ts:'2026-08-06T17:30',items:[
      'Fallbearbeitung: Realakt/VA-Kohärenz in Fall 3 (Tiefgarage) und Fall 6 (Schornsteinbrand) korrigiert – Schritt 2 differenziert nun klar zwischen Realakt (VwVfG entfällt) und VA (§28/§37/§41 VwVfG)',
      'Lernkarten-Kachel: Kartenanzahl auf 284 aktualisiert (war: 271)'
    ]},
    {v:'2.18.4',ts:'2026-08-06T16:00',items:[
      'Lernkarten: Zurück-Button zum Blättern durch bereits beantwortete Karten (Rückblick-Modus)',
      'Lernkarten: Karten mit ⭐ markieren – markierte Karten erscheinen im eigenen „Markiert"-Tab',
      'Lernkarten: Fokus-Modus, Schwer-zuerst und Zeitplan entfernt (vereinfacht)',
      'VAk Berlin: 13 neue Karteikarten zum 9-Punkte-Schema (Fallbearbeitung, §§ BHKG/OBG NRW) – v50–v62',
      'Lernkarten: Gesamtanzahl 271 → 284 Karten'
    ]},
    {v:'2.18.3',ts:'2026-08-06T15:00',items:[
      'Fallbearbeitung: Anzahl der Übungsfälle in Tab-Untertitel und Seitenbeschreibung auf 6 korrigiert (war: 4)'
    ]},
    {v:'2.18.1',ts:'2026-08-06T13:30',items:[
      'Fallbearbeitung Schema: neue §§ in Schematext eingebaut (Steps 1/2/4/5/9) – OBG, Art. 28 Abs.2 GG, Art. 19 Abs.4 GG, §34 Abs.2 BHKG u.a.'
    ]},
    {v:'2.18.0',ts:'2026-08-06T12:00',items:[
      'Fallbearbeitung: 8-Punkte-Schema auf 9-Punkte-Schema erweitert – neuer Punkt 9 „Dokumentation u. Sicherung" (§34 Abs.1 BHKG · §24 Abs.1 Nr.2 OBG · §43 Nr.1 PolG NRW)',
      'Alle Steps: Gesetzesfelder aus Handnotizen ergänzt (§§ OBG, Art. 19 GG, Art. 28 Abs.2 GG u.a.)',
      'Alle 6 Fallbeispiele: 9. Musterlösung (Dokumentation u. Sicherung) hinzugefügt'
    ]},
    {v:'2.17.9',ts:'2026-08-06T11:30',items:[
      'Fall 5 – Betonhalle: Absperrung korrigiert von Realakt zu Allgemeinverfügung (§35 S.2 VwVfG) – Steps 1, 2, 4 und 8 angepasst'
    ]},
    {v:'2.17.8',ts:'2026-08-06T11:10',items:[
      'Fallbearbeitung Step 1 – Ermächtigungsgrundlage: §48 BHKG korrigiert zu „Einschränkung von Grundrechten" (statt Kostenersatz)'
    ]},
    {v:'2.17.7',ts:'2026-08-05T12:30',items:[
      'Fallbearbeitung Schema-Karte: Gesetzestext wird bei Überlänge mit Ellipsis (…) abgeschnitten – alle 8 Karten einheitlich einzeilig'
    ]},
    {v:'2.17.6',ts:'2026-08-05T12:00',items:[
      'VAk Einsatzrecht Karteikarte & Übungsklausur Frage 6: Grundrechtsliste auf §48 BHKG aktualisiert (Art. 2 Abs. 1 i.V.m. Art. 1 Abs. 1, Art. 2 Abs. 2 S. 1, Art. 2 Abs. 2 S. 2, Art. 13 GG); Art. 11 GG und Art. 14 GG entfernt'
    ]},
    {v:'2.17.5',ts:'2026-08-05T11:30',items:[
      'Quiz: Wahlrechtsgrundsätze-Erklärung um Öffentlichkeit ergänzt (BVerfG aus Art. 38 i.V.m. Art. 20 GG)'
    ]},
    {v:'2.17.4',ts:'2026-08-05T11:10',items:[
      'Quiz: Leertaste statt Enter zum Weiterblättern im Lernmodus'
    ]},
    {v:'2.17.3',ts:'2026-08-05T10:45',items:[
      'Fallbearbeitung Step 4 – Störerauswahl: Verhaltensstörer (§17 OBG), Zustandsstörer (§18 OBG), Nichtstörer (§19 OBG)',
      'Fallbearbeitung Step 8 – Kosten: nur §45 BHKG (Entschädigung Nichtstörer); §48 BHKG und §839 BGB entfernt'
    ]},
    {v:'2.17.2',ts:'2026-08-05T10:15',items:[
      'Fallbearbeitung Fall 6 (Schornsteinbrand) Step 2: §41 VwVfG → §44 Abs.2 BHKG i.V.m. Art. 13 Abs.7 GG'
    ]},
    {v:'2.17.1',ts:'2026-08-05T09:45',items:[
      'Quiz: Ergänzungs-Notizen für einzelne Fragen – erste Notiz bei Art.-13-GG-Frage (Wohnmobile-Ausnahme)'
    ]},
    {v:'2.17.0',ts:'2026-08-05T09:00',items:[
      'VAk: Neue Seite „Übungsklausur – Einsatzrecht" – 9 Fragen, 43 Punkte, §27 BHKG, VA, Gefahrenbegriff, Grundrechte; 60-Min.-Timer und Selbstbewertung',
      'VAk: Tab-Reihenfolge neu – Klausurhinweise, Fallbearbeitung, Übungsklausur direkt nach Altklausur-Quiz; Lernzusammenfassung ans Ende'
    ]},
    {v:'2.16.0',ts:'2026-08-04T11:46',items:[
      'Performance: Navigation von O(90) auf O(2) DOM-Operationen beschleunigt – deutlich flüssiger auf Tablet',
      'Fortschritt: Modul-Kacheln zeigen animierte Mini-Fortschrittsbalken statt einfachem Text',
      'Quiz: 84 Fragen in externe Datei (quiz-data.json) ausgelagert – app.js ~80 KB kleiner, Quiz lädt beim ersten Öffnen aus SW-Cache',
      'Quiz-Statistiken: Neuer Tab mit Session-Verlauf, Klausur-Historie und Kategorie-Auswertung',
    ]},
    {v:'2.15.5',ts:'2026-08-03T13:08',items:[
      'CSS: Hyperlinks in Akkordion-Inhalten jetzt in Gold statt Browser-Blau – bessere Lesbarkeit auf dunklem Hintergrund'
    ]},
    {v:'2.15.4',ts:'2026-08-03T12:58',items:[
      'VAk Rettungsdienstrecht: Akkordion-Nummern korrigiert (01–10)'
    ]},
    {v:'2.15.3',ts:'2026-08-03T12:53',items:[
      'VAk Rettungsdienstrecht: UI an andere Tabs angeglichen – info-card statt Goldrahmen-Kästchen, class="dt"-Tabellen, Normenhierarchie und Quellen ins Akkordion (00/09)'
    ]},
    {v:'2.15.2',ts:'2026-08-03T12:30',items:[
      'VAk Rettungsdienstrecht: KTW-B → RTW-B (Notfalltransport) korrigiert; vollständige Besetzung nach § 9 Abs. 2 Buchst. b + § 23 RDG ergänzt (Fahrer RettSan, Betreuung RettSan ≥ 2 J./2.000 h + ÄLRD-Zusatzqual.)'
    ]},
    {v:'2.15.1',ts:'2026-08-03T12:23',items:[
      'VAk Rettungsdienstrecht: RTW-B (Notfalltransport) in Fahrzeugtabelle ergänzt; Weiterführende Quellen mit klickbaren Hyperlinks versehen'
    ]},
    {v:'2.15.0',ts:'2026-08-03T12:12',items:[
      'VAk: Neue Seite „Rettungsdienstrecht" – Normenhierarchie, RDG Berlin (§§ 5/5a/8/9/23), Fahrzeugbesetzung (§ 9 + RDAbweichV 2025), Trägermodelle (Hoheits-/Submissions-/Konzessionsmodell), Leitstelle/ProQA, NAIK, Hilfsfrist/Schutzziele, KatRetter, Notfallversorgungsreform 2023–2027 und Vorbeugender Rettungsdienst'
    ]},
    {v:'2.14.2',ts:'2026-08-02T19:46',items:[
      'VAk Quiz: 5 neue Fragen zum Gesetzgebungsverfahren – Initiativrecht, BVerfG-Beteiligung, Gesetzesbeschluss, Bundesrat 2. Durchgang, Ausfertigung (jetzt 84 Fragen)'
    ]},
    {v:'2.14.1',ts:'2026-08-02T18:50',items:[
      'VAk Klausurfälle: Rechtliche Korrektur Fall 3 – Duldungsverfügung (§§ 6, 9 VwVG) für unbesetzte Wohnung präzisiert',
      'VAk Klausurhinweise: § 80 Abs. 3 VwGO (Schriftlichkeit und Begründungspflicht) ergänzt, § 44 Abs. 2 BHKG präzisiert',
      '2. Jahr: Link zur Lehrgangs-Cloud auf der Jahres-Übersichtsseite ergänzt',
      'PWA: Querformat explizit freigegeben (orientation: any in manifest.json)'
    ]},
    {v:'2.14.0',ts:'2026-08-02T18:39',items:[
      'VAk: 12 neue Quizfragen aus Gedächtnisprotokoll 04.08.2023 (Ermessen, Anscheinsgefahr, VA-Tenor/Begründung, Zwangsmittel, Widerspruch/Vollzug, Gesetzgebungskompetenzen, Ernennung, Dienstvergehen)',
      'VAk: Neue Seite „Klausurhinweise" – Lernübersicht zu Prüfungsthemen und Definitionen',
      'VAk: Neue Seite „Klausurfälle" – drei komplexe Fallbearbeitungen mit Musterlösung aus der Klausur 04.08.2023'
    ]},
    {v:'2.13.3',ts:'2026-08-01',items:[
      'Neuigkeiten: Zeitanzeige entfernt – nur noch Datum wird angezeigt'
    ]},
    {v:'2.13.2',ts:'2026-08-01T21:06',items:[
      'Notizen: Undo-Button erscheint jetzt direkt im Notiz-Overlay nach dem Löschen'
    ]},
    {v:'2.13.1',ts:'2026-07-31T00:16',items:[
      'Desktop: „Inhalt"-Sidebar auf allen Seiten entfernt',
      'Layout: Fehlender Abstand vor Abschnittsüberschriften behoben (gilt für alle Seiten)'
    ]},
    {v:'2.13.0',ts:'2026-07-30T16:21',items:[
      'Performance: Suchindex wird jetzt nur noch einmal aufgebaut (statt bei jedem Öffnen)',
      'Performance: Sucheingabe mit Debouncing – flüssigeres Tippen auf schwächeren Geräten',
      'Performance: Scroll-Handler läuft jetzt immer über requestAnimationFrame',
      'Bug-Fix: Altklausur-Training (VAk) erscheint jetzt in der Suche und im Fortschritts-Tracking',
      'Bug-Fix: Escape-Taste schließt jetzt auch Pomodoro-Timer, Onboarding und Lernstand-Modal',
      'Bug-Fix: Accordion-Häkchen bleiben korrekt gesetzt, auch wenn Inhalte umstrukturiert werden',
      'UX: Notiz löschen zeigt jetzt einen Undo-Button im Toast',
      'Barrierefreiheit: Alle Navigations-Kacheln sind jetzt per Tastatur (Tab + Enter) erreichbar',
      'Barrierefreiheit: Fokus-Indikator für Tastaturnavigation hinzugefügt'
    ]},
    {v:'2.12.13',ts:'2026-07-30T16:10',items:[
      'App-Seite: Hinweistext für Chromium-Browser angepasst'
    ]},
    {v:'2.12.12',ts:'2026-07-30T16:03',items:[
      'Bug-Fix: Android-APK-Download funktioniert wieder (Build-Fehler durch abgelaufenen Keystore-Cache behoben)'
    ]},
    {v:'2.12.11',ts:'2026-07-30T15:50',items:[
      'Lernstatistiken: Bereich „Lernaktivität" (Heatmap) entfernt'
    ]},
    {v:'2.12.10',ts:'2026-07-30T15:34',items:[
      'Bug-Fix: Lernstand-Modal zentriert sich jetzt korrekt auf iOS/Safari, auch wenn die Seite gescrollt ist (Modal auf Body-Ebene verschoben)'
    ]},
    {v:'2.12.9',ts:'2026-07-30T14:51',items:[
      'Bug-Fix: Neuigkeiten-Overlay öffnet jetzt zuverlässig im Quiz (fehlende position:fixed!important-Regel und stopPropagation ergänzt)'
    ]},
    {v:'2.12.8',ts:'2026-07-30T12:42',items:[
      'Lernstand: „Noch nicht gesehen" in Blau-Grau (#4b6180) für bessere Sichtbarkeit'
    ]},
    {v:'2.12.7',ts:'2026-07-30T12:33',items:[
      'Lernstand auf Stand v2.12.4 zurückgesetzt'
    ]},
    {v:'2.12.6',ts:'2026-07-30T12:29',items:[
      'Lernstand: „Noch nicht gesehen"-Felder jetzt klar sichtbar in Blau-Grau statt fast unsichtbarem Hintergrund'
    ]},
    {v:'2.12.5',ts:'2026-07-30T12:27',items:[
      'Bug-Fix: Lernstand-Modal auf iOS/Safari korrekt zentriert – Modal auf Body-Ebene verschoben, sodass position:fixed nicht vom View-Transform gefangen wird'
    ]},
    {v:'2.12.4',ts:'2026-07-30T12:20',items:[
      'Bug-Fix: Lernstand-Modal auf Stand v2.12.0 zurückgesetzt – Zwischenstände 2.12.1–2.12.3 rückgängig gemacht',
      'Changelog-Zeitstempel: alle Einträge zeigen jetzt die exakte Git-Merge-Zeit'
    ]},
    {v:'2.12.3',ts:'2026-07-30T12:11',items:[
      'Bug-Fix: Lernstand-Modal layout wie Statistiken/Pomodoro'
    ]},
    {v:'2.12.2',ts:'2026-07-30T12:03',items:[
      'Bug-Fix: Lernstand-Modal identisch zu Pomodoro/Statistiken'
    ]},
    {v:'2.12.1',ts:'2026-07-30T11:53',items:[
      'Bug-Fix: Lernstand-Modal zentriert auf Mobilgeräten'
    ]},
    {v:'2.12.0',ts:'2026-07-30T11:43',items:[
      'Desktop-Optimierung: schlankerer Hero, breitere Inhaltsspalten ab 1200 px',
      'Desktop-Optimierung: 4-spaltiges Kachel-Raster auf der Startseite ab 1000 px',
      'Desktop-Optimierung: Text-Inhaltsverzeichnis als Seitenleiste auf breiten Bildschirmen (≥ 1300 px)'
    ]},
    {v:'2.11.1',ts:'2026-07-30T10:52',items:[
      'Bug-Fix: 1. Jahr und 2. Jahr zeigten keinen Inhalt (fehlende Registrierung in der NAV-Liste)'
    ]},
    {v:'2.11.0',ts:'2026-07-30T10:50',items:[
      'Startseite nach Ausbildungsjahren gegliedert: 1. Jahr (GAL, SFS, HLFS) und 2. Jahr (IBK, VAk, FeuAK, IdF)'
    ]},
    {v:'2.10.1',ts:'2026-07-30T10:40',items:[
      'Neuigkeiten-Overlay: Verhalten identisch zum Pomodoro-Timer – funktioniert jetzt auf allen Geräten zuverlässig',
      'Zeitstempel im Changelog: zeigt jetzt die echten Git-Commit-Zeiten'
    ]},
    {v:'2.10.0',ts:'2026-07-30T10:23',items:[
      'Neuigkeiten-Overlay öffnet jetzt immer zuverlässig beim Antippen',
      'Kein automatisches Öffnen beim App-Start mehr',
      'Genaues Datum und Uhrzeit pro Eintrag im Neuigkeiten-Feed'
    ]},
    {v:'2.9.0',ts:'2026-07-30T10:02',items:[
      'Neuigkeiten von Startseite in die Einstellungen verschoben'
    ]},
    {v:'2.8.3',ts:'2026-07-30T09:55',items:[
      'Bug-Fix: Neuigkeiten-Overlay öffnet zuverlässig – CSS-Animations-Neustart-Problem behoben'
    ]},
    {v:'2.8.2',ts:'2026-07-30T09:44',items:[
      'Bug-Fix: Ghost-Click-Schutz für Tablets beim Öffnen des Overlays'
    ]},
    {v:'2.8.1',ts:'2026-07-30T09:20',items:[
      'Neuigkeiten-Feed: Overlay-Design wie das Suchfeld (Blur, Header, Footer)',
      'Semantic Versioning (MAJOR.MINOR.PATCH) eingeführt'
    ]},
    {v:'2.8.0',ts:'2026-07-30T09:01',items:[
      'Neuigkeiten-Feed: automatisches Update-Modal bei neuer Version',
      'Neuigkeiten-Kachel auf der Startseite'
    ]},
    {v:'2.7.1',ts:'2026-07-30T08:45',items:[
      'Accordion-Tabs: doppelte Nummern aus Titeln entfernt (Badge zeigt bereits die Nummer)'
    ]},
    {v:'2.7.0',ts:'2026-07-30T08:35',items:[
      'Verwandte Themen: kontextbezogene Verlinkungen am Ende jeder Lernseite',
      'Aktivitäts-Heatmap: 13-Wochen-Übersicht in den Statistiken',
      'Suche: Kontext-Snippets zeigen die relevante Textstelle',
      'Offline-Banner: Hinweis bei fehlendem Netz',
      'Simulator: abgeschlossene Szenarien werden dauerhaft markiert'
    ]},
    {v:'2.6.0',ts:'2026-07-30T08:15',items:[
      'Prüfungs-Timer mit Countdown-Balken',
      'Kategorien-Auswertung nach der Klausur',
      'Service-Worker-Update-Erkennung zuverlässig verbessert'
    ]},
    {v:'2.5.1',ts:'2026-07-30T08:05',items:[
      'Lernstand-Modal: Backdrop-Blur wie beim Suchfeld',
      'Frage 62 (Anscheinsgefahr): fehlenden Inhalt ergänzt'
    ]},
    {v:'2.5.0',ts:'2026-07-29T16:30',items:[
      'Lernstand als zentriertes Modal-Fenster statt Seitenleiste'
    ]},
    {v:'2.4.0',ts:'2026-07-29T16:22',items:[
      'Filter-Panel als kollabierendes Akkordeon'
    ]}
];
