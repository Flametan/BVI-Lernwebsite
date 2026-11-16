"""Zusätzliche Aufgaben mit eigener Spielmechanik und die Rahmengeschichte je Level.

Wird von build_data.py eingebunden. Herkunft des Stoffs:
- Stellungnahme (Textbausteine): Aussagen aus den Erklärungen des IdF-Quiz der App (Vorbeugender Brandschutz)
- Gespräch (IBK): eigene Übungsfälle, abgeleitet aus den Lernkarten k-ibk-* (im Feld quelle genannt)
- Budget und Standort (FeuAK): eigene Übungsfälle mit frei gewählten Zahlen, abgeleitet aus den Lernkarten k-feuak-*
- Statement (Presse): eigener Stoff, abgeleitet aus den Grundsätzen der Pressearbeit (v-idf-p61, v-idf-p62)
- Rahmengeschichte (auftrag, ende): frei erfunden, kein Prüfungsstoff
"""
import random


def _mix(rnd, richtig, falsch):
    o = [richtig] + list(falsch)
    rnd.shuffle(o)
    return o


def bausteine(frage, fall, felder, erkl, quelle, rnd):
    """felder: [(Name, richtiger Baustein, [falsche Bausteine])]"""
    return {'typ': 'bausteine', 'frage': frage, 'fall': fall,
            'felder': [{'name': n, 'optionen': _mix(rnd, r, f), 'richtig': r} for n, r, f in felder], 'erkl': erkl, 'quelle': quelle}


def gespraech(frage, rolle, lage, zuege, erkl, quelle, rnd):
    """zuege: [(Satz des Gegenübers, (gute Antwort, Einordnung), [(schlechte Antwort, Einordnung), ...])]"""
    z = []
    for sagt, gut, schlecht in zuege:
        o = [{'t': gut[0], 'gut': True, 'ich': gut[1]}] + [{'t': t, 'gut': False, 'ich': i} for t, i in schlecht]
        rnd.shuffle(o)
        z.append({'sagt': sagt, 'optionen': o})
    return {'typ': 'gespraech', 'frage': frage, 'rolle': rolle, 'lage': lage, 'zuege': z, 'erkl': erkl, 'quelle': quelle}


def budget(frage, fall, summe, posten, richtig, erkl, quelle):
    """posten: [(Name, Kosten in Tausend Euro)]"""
    assert sum(k for n, k in posten if n in richtig) <= summe
    return {'typ': 'budget', 'frage': frage, 'fall': fall, 'budget': summe, 'posten': [{'t': n, 'kosten': k} for n, k in posten], 'richtig': list(richtig), 'erkl': erkl, 'quelle': quelle}


def statement(frage, richtig, falsch, zeit, erkl, quelle, rnd):
    o = list(richtig) + list(falsch)
    while o[:len(richtig)] == list(richtig):
        rnd.shuffle(o)
    return {'typ': 'statement', 'frage': frage, 'optionen': o, 'richtig': list(richtig), 'zeit': zeit, 'erkl': erkl, 'quelle': quelle}


# ---------------------------------------------------------------- Stellungnahme: je Level ein Vorhaben aus Textbausteinen
def stellungnahme_extra():
    rnd = random.Random(31)
    q = 'IdF-Quiz der App (Vorbeugender Brandschutz), Erklärungen · '
    f = 'Stellungnahme: Setze für jedes Feld den richtigen Baustein ein.'
    return {
        0: [bausteine(f, 'Vorhaben: freistehendes Wohnhaus, Fußboden des obersten Geschosses 6,5 m über dem Gelände, zwei Nutzungseinheiten mit 130 m² und 280 m².', [
            ('Gebäudeklasse', 'GK 3, weil die Nutzungseinheiten zusammen mehr als 400 m² haben', ['GK 1, weil das Gebäude freistehend und nicht höher als 7 m ist', 'GK 2, weil es zwei Nutzungseinheiten hat']),
            ('Maßgebliche Höhe', 'Fußbodenoberkante des höchstgelegenen Geschosses mit möglichem Aufenthaltsraum über der mittleren Geländeoberfläche', ['Höhe des Dachfirsts über der Straße', 'Oberkante der Attika über dem tiefsten Punkt des Geländes']),
            ('Erster Rettungsweg', 'Baulich, höchstens 35 m bis zum notwendigen Treppenraum oder ins Freie', ['Über Rettungsgeräte der Feuerwehr', 'Baulich, höchstens 50 m bis ins Freie'])],
            '130 + 280 = 410 m² überschreiten die Grenze von 400 m² der GK 1 und 2. Die Höhe misst man an der Fußbodenoberkante des höchsten Geschosses mit möglichem Aufenthaltsraum. Der erste Rettungsweg ist stets baulich.', q + 'Gebäudeklassen, Rettungswege', rnd)],
        1: [bausteine(f, 'Vorhaben: Wohngebäude, die Brüstung des obersten Fensters liegt 7,2 m über dem Gelände. Der zweite Rettungsweg soll über dieses Fenster führen.', [
            ('Zweiter Rettungsweg', 'Über tragbare Leitern der Feuerwehr möglich, weil die Brüstung nicht höher als 8 m liegt', ['Nur mit einem Hubrettungsfahrzeug möglich', 'Nicht nötig, ein Rettungsweg genügt']),
            ('Fenster', 'Mindestens 0,90 × 1,20 m, Brüstung höchstens 1,20 m hoch', ['Mindestens 0,60 × 0,90 m, Brüstung höchstens 1,50 m hoch', 'Jede Größe, wenn sich das Fenster öffnen lässt']),
            ('Laufweg mit der Leiter', 'Höchstens 50 m', ['Höchstens 100 m', 'Ohne Begrenzung'])],
            'Tragbare Leitern reichen bis 8 m Brüstungshöhe, darüber braucht es ein Hubrettungsfahrzeug. Anleiterbare Fenster: mindestens 0,90 × 1,20 m, Brüstung höchstens 1,20 m. Laufweg mit tragbarer Leiter höchstens 50 m.', q + 'Rettungswege', rnd)],
        2: [bausteine(f, 'Vorhaben: Gebäude in zweiter Reihe, nur über einen Zugang zu erreichen. Im Gebäude liegt eine Maisonettewohnung mit innerer Treppe; im notwendigen Flur ist eine Rauchschutztür geplant.', [
            ('Zugang', 'Geradlinig und 1,25 m breit, kurze Einengungen bis 1,0 m', ['0,80 m Breite genügen', '3,0 m Breite wie bei einer Zufahrt']),
            ('Treppe in der Wohnung', 'Notwendige Treppe ohne eigenen Treppenraum zulässig, weil sie innerhalb einer Nutzungseinheit liegt', ['Ein eigener notwendiger Treppenraum ist zwingend', 'Die Treppe braucht einen Sicherheitstreppenraum']),
            ('Rauchschutztür', 'Dicht- und selbstschließend, umlaufend abgedichtet, im notwendigen Flur nicht abschließbar', ['Feuerbeständig und abschließbar', 'Selbstschließend ohne Dichtung'])],
            'Zugang zu rückwärtigen Gebäuden: geradlinig, 1,25 m, kurz 1,0 m. Eine notwendige Treppe ohne Treppenraum ist in GK 1 und 2 sowie innerhalb einer Nutzungseinheit zulässig. Rauchschutztüren sind dicht- und selbstschließend.', q + 'Rettungswege und Bauteile', rnd)],
        3: [bausteine(f, 'Vorhaben: Verkaufsstätte mit Verkaufsräumen und Ladenstraße von zusammen 1.200 m², dazu ein Saal für 270 Besucher.', [
            ('Verkaufsstätte', 'Sonderbau, weil Verkaufsräume und Ladenstraßen zusammen mehr als 800 m² haben', ['Kein Sonderbau, die Grenze liegt bei 2.000 m²', 'Sonderbau erst ab 10.000 m²']),
            ('Saal', 'Versammlungsstätte, weil der Raum mehr als 200 Besucher fasst', ['Keine Versammlungsstätte, die Grenze liegt bei 500 Besuchern', 'Versammlungsstätte nur, wenn es eine Bühne gibt']),
            ('Verhältnis der Vorschriften', 'Die Sonderbauverordnung regelt das Spezielle und geht vor; im Übrigen gilt die Bauordnung', ['Die Bauordnung geht der Sonderbauverordnung vor', 'Für Sonderbauten gilt die Bauordnung gar nicht']),
            ('Inhalt der Stellungnahme', 'Zugänglichkeit, Löschwasserversorgung, Löschwasserrückhaltung, Anleiterstellen, Anlagen zur Brandbekämpfung, Brandmeldeanlagen, betriebliche Maßnahmen', ['Standsicherheit, Schallschutz und Wärmeschutz', 'Stellplätze, Abstandsflächen und Barrierefreiheit'])],
            'Sonderbautatbestände: Verkaufsstätten über 800 m², Versammlungsräume für mehr als 200 Besucher. Sondervorschriften gehen als speziellere Regel vor. Die Brandschutzdienststelle nimmt zu sieben Punkten Stellung.', q + 'Sonderbau, Brandschutzdienststelle', rnd)],
        4: [bausteine(f, 'Vorhaben: zwei aneinandergebaute Gebäude der Gebäudeklasse 5. Der Bauherr möchte eine Tür in der Wand zwischen den Gebäuden; in einem Gebäude gibt es außerdem eine innere Brandwand mit Öffnung.', [
            ('Wand zwischen den Gebäuden', 'Gebäudeabschlusswand in der Bauart einer Brandwand, ohne Öffnungen', ['Trennwand, Öffnungen frei wählbar', 'Brandwand, Türen in beliebiger Zahl zulässig']),
            ('Öffnung in der inneren Brandwand', 'Feuerbeständig, dicht- und selbstschließend', ['Feuerhemmend genügt', 'Rauchdicht genügt']),
            ('Brandwand am Dach', 'Mindestens 30 cm über die Bedachung führen oder beidseitig 50 cm auskragen', ['Bündig unter der Dachhaut enden lassen', 'Mindestens 1 m über das Dach führen'])],
            'Aneinandergebaute Gebäude trennt eine Gebäudeabschlusswand in Bauart Brandwand ohne Öffnungen. Öffnungen in inneren Brandwänden: feuerbeständig, dicht- und selbstschließend. Brandwände 30 cm über Dach oder beidseitig 50 cm auskragend.', q + 'Brandwände', rnd)],
    }


# ---------------------------------------------------------------- IBK: je Level ein Gespräch mit Antwortwahl
def ibk_extra():
    rnd = random.Random(32)
    e = 'Eigener Übungsfall, abgeleitet aus den Lernkarten '
    ER, KEL, FEL, NK, AK = 'Erwachsenen-Ich: sachlich, fragt nach', 'Kritisches Eltern-Ich: wertet ab, weist zurecht', 'Fürsorgliches Eltern-Ich, übertrieben: nimmt dem anderen die Verantwortung ab', 'Natürliches Kind-Ich: spontan, aber an der Sache vorbei', 'Angepasstes Kind-Ich: gibt nach, zieht sich zurück'
    f = 'Führe das Gespräch. Wähle jeweils die Antwort, die das Gespräch voranbringt.'
    return {
        0: [gespraech(f, 'Jonas, Brandmeister', 'Jonas kommt zum dritten Mal in diesem Monat zu spät zum Dienst. Du bist sein Wachabteilungsführer.', [
            ('Tut mir leid, die Bahn ist ausgefallen. Ich weiß, ich bin spät dran.', ('Danke, dass du es gleich sagst. Das ist jetzt das dritte Mal. Woran liegt es?', ER), [('Immer dasselbe mit dir! So geht das nicht!', KEL), ('Nicht so schlimm, ich habe deine Aufgaben schon für dich erledigt.', FEL)]),
            ('Die Verbindung am Morgen ist einfach unzuverlässig.', ('Dann lass uns klären, welche Möglichkeiten du siehst.', ER), [('Dann musst du eben früher aufstehen, wie jeder anständige Mensch.', KEL), ('Wenn du meinst. Mir ist das egal.', AK)]),
            ('Ich könnte den früheren Zug nehmen oder mit einem Kollegen fahren.', ('Gut. Du nimmst den früheren Zug, und in zwei Wochen schauen wir, ob es klappt.', ER), [('Das glaube ich erst, wenn ich es sehe.', KEL), ('Super, das feiern wir mit einem Kaffee, die Übung kann warten!', NK)])],
            'Aus dem Erwachsenen-Ich lädst du dein Gegenüber ein, ebenfalls sachlich zu antworten. Bestimmen kannst du seinen Ich-Zustand nicht.', e + 'k-ibk-05 bis k-ibk-13 und k-ibk-16', rnd)],
        1: [gespraech(f, 'Petra, Wachabteilungsführerin', 'Petra kommt gereizt in dein Büro. Der Einsatzbericht von gestern ist noch nicht fertig.', [
            ('Na, ist der Einsatzbericht vielleicht heute noch fertig?', ('Der Bericht ist um 14 Uhr fertig. Was möchtest du mir damit sagen?', 'Erwachsenen-Ich: nimmt beim Wort und fordert die direkte Botschaft ein'), [('Mach ihn doch selbst, wenn es dir nicht schnell genug geht!', 'Über-Kreuz-Transaktion aus dem Kind-Ich: Grundlage für einen Konflikt'), ('Entschuldigung, ich bin einfach zu langsam.', AK)]),
            ('Ich ärgere mich, weil ich den Bericht für die Besprechung brauche.', ('Verstanden. Wann genau brauchst du ihn, und welchen Teil zuerst?', 'Erwachsenen-Ich: Paralleltransaktion, das Gespräch läuft glatt weiter'), [('Das hättest du früher sagen müssen. So arbeitet man nicht.', KEL), ('Dann lass die Besprechung doch ausfallen.', NK)]),
            ('Um 13 Uhr, vor allem die Kräfteübersicht.', ('Die Kräfteübersicht bekommst du bis 12:30 Uhr, den Rest bis 14 Uhr.', ER), [('Typisch. Bei dir kommt immer alles auf den letzten Drücker.', KEL), ('Ich versuche es, aber versprechen kann ich nichts. Ich schaffe ja nie etwas.', AK)])],
            'Bei einer verdeckten Transaktion entscheidet die Beziehungsebene. Nimm die offene Botschaft beim Wort und fordere die direkte Botschaft ein.', e + 'k-ibk-14 bis k-ibk-21', rnd)],
        2: [gespraech(f, 'Aylin, Gerätewartin', 'Aylin hat den Pflegeplan für alle Fahrzeuge neu aufgestellt. Du bist ihre Vorgesetzte oder ihr Vorgesetzter.', [
            ('Ich habe den Pflegeplan neu aufgestellt. Hat das eigentlich jemand bemerkt?', ('Ja. Der Plan ist übersichtlich, und die Fahrzeuge sind seitdem schneller wieder einsatzbereit. Danke dafür.', 'Bedingte positive Beachtung: konkret und ehrlich'), [('Das ist doch Ihre Aufgabe.', 'Bedingte negative Beachtung: wertet die Leistung ab'), ('Hm. Ich habe gerade keine Zeit.', 'Keine Beachtung: die schlimmste Form')]),
            ('Manchmal habe ich das Gefühl, es fällt nur auf, wenn etwas schiefgeht.', ('Das nehme ich ernst. Ich gebe künftig auch Rückmeldung, wenn etwas gut läuft.', ER), [('Wer Lob braucht, ist hier falsch.', KEL), ('Jetzt übertreiben Sie aber.', KEL)]),
            ('Darf ich Sie dann auch direkt um Rückmeldung bitten?', ('Ja, jederzeit. Um Beachtung zu bitten ist erlaubt.', 'Stroke-Erlaubnis: Du darfst um Strokes bitten'), [('Lob muss man sich verdienen, nicht einfordern.', KEL), ('Das wirkt aber ziemlich bedürftig.', KEL)])],
            'Zuwendung und Beachtung sind für Führungskräfte das wichtigste Grundbedürfnis nach Berne. Keine Beachtung ist die schlimmste Form.', e + 'k-ibk-22 bis k-ibk-26', rnd)],
        3: [gespraech(f, 'Marc, Brandmeisteranwärter', 'Marc ist durch die Atemschutzübung gefallen und sucht dich in der Pause auf.', [
            ('Ich schaffe die Übung nie, alle sind gegen mich. Kannst du nicht für mich mit dem Ausbilder reden?', ('Ich sehe, dass dich das belastet. Was genau fällt dir schwer, und was kannst du selbst als Nächstes tun?', 'Erwachsenen-Ich: bleibt außerhalb des Drama-Dreiecks'), [('Klar, ich regle das für dich. Lass mich nur machen.', 'Retter im Drama-Dreieck'), ('Du bist selbst schuld. Stell dich nicht so an.', 'Verfolger im Drama-Dreieck')]),
            ('Na toll, du hilfst mir also auch nicht.', ('Ich übe gern mit dir. Mit dem Ausbilder sprichst du selbst; wenn du möchtest, komme ich mit.', 'Erwachsenen-Ich: bietet Hilfe an, lässt die Verantwortung bei Marc'), [('Dann eben nicht. Undankbar wie immer!', 'Verfolger im Drama-Dreieck'), ('Doch, doch, entschuldige, ich rufe ihn sofort an.', 'Retter im Drama-Dreieck')]),
            ('Okay. Vielleicht frage ich ihn nach einem Übungstermin.', ('Gute Idee. Wann fragst du ihn?', ER), [('Soll ich die Mail für dich schreiben?', 'Retter im Drama-Dreieck'), ('Wird ja auch Zeit.', 'Verfolger im Drama-Dreieck')])],
            'Psychologische Spiele entstehen, wenn Konflikte nicht offen angesprochen werden. Im Drama-Dreieck gibt es Verfolger, Opfer und Retter; aus dem Erwachsenen-Ich steigst du aus.', e + 'k-ibk-33 bis k-ibk-35', rnd)],
        4: [gespraech(f, 'Sven, Oberbrandmeister', 'Zwei Kollegen streiten laut über den Dienstplan. Sven steht aufgebracht vor dir, du bist der Vorgesetzte.', [
            ('Mit dem arbeite ich nicht mehr zusammen! Der hat mir schon wieder die Wochenendschicht aufgedrückt!', ('Ich höre, dass du verärgert bist. Wir setzen uns zu dritt hin und klären zuerst, was zwischen euch vorgefallen ist.', 'Heißer Konflikt: zuerst die persönlichen Beziehungen klären'), [('Schluss jetzt. Ihr teilt euch die Schicht, und damit ist das Thema erledigt.', 'Fauler Kompromiss: deckelt den Konflikt, er wird kalt'), ('Lasst uns erst einmal den Dienstplan neu organisieren.', 'Organisation kommt bei einem heißen Konflikt erst später')]),
            ('Er redet hinter meinem Rücken über mich. Das verletzt mich.', ('Dann geht es nicht um den Plan, sondern um euren Umgang miteinander. Das sprechen wir offen an.', 'Beziehungskonflikt: Ursache ist die Verletzung des Selbstwertgefühls'), [('Dann tauschen wir eben die Schicht, dann ist es gut.', 'Sachebene: lässt die Ursache auf der Beziehungsebene unberührt'), ('Sei nicht so empfindlich.', KEL)]),
            ('Und wenn wir uns nicht einigen?', ('Noch können wir das selbst lösen. Wenn es weiter eskaliert, holen wir jemanden von außen dazu.', 'Glasl: Stufen 1 bis 3 selbst handlungsfähig, ab Stufe 4 externer Eingriff'), [('Dann entscheide ich, wer von euch geht.', KEL), ('Dann warten wir ab. Das legt sich von selbst.', 'Deckelt den Konflikt: Er brodelt als kalter Konflikt weiter')])],
            'Ein heißer Konflikt wird offen ausgetragen: zuerst die Beziehungen klären. Ein fauler Kompromiss macht daraus einen kalten Konflikt.', e + 'k-ibk-51 bis k-ibk-63', rnd)],
    }


# ---------------------------------------------------------------- FeuAK: Haushalt mit Budget, Standortwahl auf der Karte
def _karte(titel, wachen, kreise, kandidaten, balken):
    """Kleine Stadtkarte als SVG: Fluss, Straßen, Hilfsfrist-Bereiche (Kreise), Wachen, Kandidaten A bis C, zwei Balken zum Erreichungsgrad."""
    s = ['<svg viewBox="0 0 320 210" role="img" aria-label="' + titel + '" xmlns="http://www.w3.org/2000/svg" font-family="Roboto,system-ui,sans-serif">',
         '<rect x="1" y="1" width="318" height="150" rx="8" fill="currentColor" opacity=".06"/>',
         '<path d="M0 118 C60 96 110 132 170 108 S270 92 320 112" fill="none" stroke="#5b9bd5" stroke-width="7" opacity=".55"/>',
         '<path d="M20 40 H300 M20 84 H300 M70 10 V146 M160 10 V146 M250 10 V146" stroke="currentColor" stroke-width="1" opacity=".22"/>']
    for x, y, r in kreise:
        s.append('<circle cx="%d" cy="%d" r="%d" fill="#1f9d55" opacity=".22" stroke="#1f9d55" stroke-width="1.5"/>' % (x, y, r))
    for x, y in wachen:
        s.append('<rect x="%d" y="%d" width="16" height="16" rx="3" fill="#c4261c"/><text x="%d" y="%d" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">W</text>' % (x - 8, y - 8, x, y + 4))
    for k, x, y in kandidaten:
        s.append('<circle cx="%d" cy="%d" r="10" fill="#2f7de1"/><text x="%d" y="%d" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">%s</text>' % (x, y, x, y + 4, k))
    for i, (name, wert) in enumerate(balken):
        y = 166 + i * 22
        s.append('<text x="2" y="%d" font-size="11" fill="currentColor">%s</text>' % (y + 10, name))
        s.append('<rect x="150" y="%d" width="130" height="12" rx="3" fill="currentColor" opacity=".12"/><rect x="150" y="%d" width="%d" height="12" rx="3" fill="%s"/>' % (y, y, round(130 * wert / 100), '#1f9d55' if wert >= 90 else '#c53030'))
        s.append('<text x="286" y="%d" font-size="11" font-weight="700" fill="currentColor">%d %%</text>' % (y + 10, wert))
    s.append('</svg>')
    return ''.join(s)


def feuak_extra():
    rnd = random.Random(33)
    e = 'Eigener Übungsfall mit frei gewählten Zahlen, abgeleitet aus den Lernkarten '
    weg = ['Bedarfsanmeldung und Ansatzermittlung', 'Beratung durch die Politik und Gremienbeschluss', 'Genehmigung durch die Aufsichtsbehörde', 'Veröffentlichung des Haushaltsplans (Rechtskraft)']
    o = list(weg)
    while o == weg:
        rnd.shuffle(o)
    a_res = 'Keinen neuen Standort bauen: Fahrzeuge und Personal an der bestehenden Wache verstärken'
    k1 = {'typ': 'mc', 'frage': 'Stadtmodell: Der Erreichungsgrad ab der zuständigen Wache ist gut, der Gesamtwert aller Fahrzeuge ist schlecht. Was schlägst du vor?',
          'bild': _karte('Stadtkarte: eine Wache in der Mitte, ihr Hilfsfrist-Bereich deckt das Stadtgebiet ab', [(160, 70)], [(160, 70, 118)], [('A', 262, 34), ('B', 52, 128)], [('Ab zuständiger Wache', 93), ('Alle Fahrzeuge gesamt', 71)]),
          'optionen': _mix(rnd, a_res, ['Neue Wache am Standort A bauen', 'Neue Wache am Standort B bauen', 'Die bestehende Wache nach A verlegen']), 'richtig': a_res,
          'erkl': 'Gute Erreichung ab der zuständigen Wache bei schlechter Gesamterreichung deutet man als Problem der Ressourcenverfügbarkeit: Die Wache liegt richtig, aber ihre Fahrzeuge sind zu oft gebunden.', 'quelle': e + 'k-feuak-68 bis k-feuak-71'}
    b_ok = 'Neue Wache am Standort A bauen'
    k2 = {'typ': 'mc', 'frage': 'Stadtmodell: Auch ab der zuständigen Wache wird das Schutzziel im Nordosten verfehlt. Wo setzt du an?',
          'bild': _karte('Stadtkarte: eine Wache im Westen, ihr Hilfsfrist-Bereich erreicht den Nordosten nicht; Kandidaten A im Nordosten, B neben der Wache, C im Süden außerhalb', [(78, 74)], [(78, 74, 82)], [('A', 246, 44), ('B', 112, 92), ('C', 150, 138)], [('Ab zuständiger Wache', 68), ('Alle Fahrzeuge gesamt', 64)]),
          'optionen': _mix(rnd, b_ok, ['Neue Wache am Standort B bauen', 'Neue Wache am Standort C bauen', 'Keinen neuen Standort bauen: nur mehr Fahrzeuge an der bestehenden Wache']), 'richtig': b_ok,
          'erkl': 'Schlechte Erreichung auch ab der zuständigen Wache deutet man als Standort- und Erreichbarkeitsproblem. Die Analyse zeigt die räumliche Versorgungslücke; Standort A schließt sie.', 'quelle': e + 'k-feuak-68 bis k-feuak-71'}
    fix = ['Miete der Feuerwache (fix)', 'Wartungsverträge (fix)', 'Leasing der Leitstellentechnik (fix)']
    return {
        0: [{'typ': 'reihe', 'frage': 'Bring den Weg eines Haushalts in die richtige Reihenfolge.', 'optionen': o, 'richtig': weg, 'erkl': 'Erst danach stehen die Mittel verbindlich zur Verfügung; bis dahin gilt die vorläufige Haushaltsführung.', 'quelle': 'Lernkarte k-feuak-10'},
            budget('Bedarfsanmeldung: Wähle aus, was du mit dem freigegebenen Betrag anmeldest.', 'Die Kämmerei gibt 460 Tausend Euro frei. Alle fixen Kosten müssen gedeckt sein. Vom Rest wählst du das Projekt, das die Politik an die erste Stelle gesetzt hat.', 460,
                   [(fix[0], 120), ('Projekt Priorität 1: neue Schutzkleidung', 150), (fix[1], 80), ('Projekt Priorität 2: Drohne für die Erkundung', 90), (fix[2], 100), ('Projekt Priorität 3: Anstrich der Fahrzeughalle', 40)],
                   fix + ['Projekt Priorität 1: neue Schutzkleidung'],
                   'Die Feuerwehr meldet getrennt nach fixen Kosten (Mieten, Verträge) und variablen Kosten (Projekte, Sonderbeschaffungen) an. Die Politik priorisiert; die Entscheidungshoheit liegt bei ihr.', e + 'k-feuak-11 und k-feuak-12')],
        4: [k1, k2],
    }


# ---------------------------------------------------------------- Presse: Statement vor laufender Kamera
def presse_extra():
    rnd = random.Random(34)
    e = 'Eigener Stoff, abgeleitet aus den Grundsätzen der Pressearbeit (v-idf-p61) und den Hinweisen zum Pressestatement (v-idf-p62)'
    f = 'Die Kamera läuft. Tippe vier Sätze in sinnvoller Reihenfolge an. Zwei Sätze gehören nicht in ein Statement.'
    return {
        3: [statement(f, ['Heute um 14:10 Uhr ist in einem Mehrfamilienhaus ein Feuer ausgebrochen.', 'Die Feuerwehr ist mit 40 Kräften im Einsatz und hat das Feuer unter Kontrolle.', 'Anwohner halten bitte Fenster und Türen geschlossen.', 'Sobald wir Neues wissen, informieren wir Sie hier wieder.'],
                      ['Schuld ist vermutlich der Mieter im zweiten Stock.', 'Der Verletzte heißt Peter M. und wohnt im Erdgeschoss.'], 75,
                      'Aufbau: Was ist passiert? Was tut die Feuerwehr? Was sollen die Menschen tun? Wie geht es weiter? Keine Aussagen zu Schuldfragen, keine Personalien.', e, rnd)],
        4: [statement(f, ['Gegen 9 Uhr ist in einem Chemiebetrieb ein Stoff ausgetreten.', 'Unsere Messtrupps sind im Einsatz; gesicherte Messwerte liegen noch nicht vor.', 'Bitte meiden Sie das Gebiet und achten Sie auf die Warn-Apps.', 'Um 11 Uhr geben wir hier die nächsten gesicherten Informationen.'],
                      ['Die Betriebsleitung hat hier offensichtlich geschlampt.', 'Ich schätze, da sind bestimmt zwanzig Menschen schwer vergiftet.'], 60,
                      'Nur gesicherte Fakten nennen, Vermutungen kennzeichnen oder weglassen, keine wertenden Aussagen und keine Schuldfragen.', e, rnd)],
    }


# ---------------------------------------------------------------- Rahmengeschichte: (wer spricht, Auftrag, Ende bei Bestehen, Ende bei Nichtbestehen)
STORY = {
    'begehung': [
        ('Leitstelle', 'Guten Morgen. Im Wohn- und Geschäftshaus an der Hauptstraße steht die Brandverhütungsschau an. Fang bei den Türen am Treppenraum an.', 'Der Eigentümer bekommt einen sauberen Bericht. Die Türen sind richtig bestimmt.', 'Der Bericht hat Lücken. Die Schau muss wiederholt werden.'),
        ('Bauaufsicht', 'Ein Wohngebäude der Gebäudeklasse 3. Ich brauche deine Einschätzung zu Wänden, Decken und Treppe, bevor die Abnahme läuft.', 'Die Abnahme kann stattfinden. Die Bauaufsicht dankt für die klare Einschätzung.', 'Die Bauaufsicht fragt nach. Deine Angaben passen nicht zur Gebäudeklasse.'),
        ('Brandschutzdienststelle', 'Heute geht es in ein Gebäude der Gebäudeklasse 4 mit notwendigen Fluren. Die Sonne steht schon tief, wir haben wenig Zeit.', 'Vor Einbruch der Dunkelheit ist alles geprüft. Gute Arbeit.', 'Es ist dunkel geworden, und der Bericht ist noch nicht belastbar.'),
        ('Leitstelle', 'Es regnet, aber der Termin steht: Gebäudeklasse 5 mit innerer Brandwand. Der Betreiber wartet im Erdgeschoss.', 'Trotz Regen ein gründlicher Rundgang. Der Betreiber weiß jetzt, was zu tun ist.', 'Der Betreiber ist ratlos, weil mehrere Angaben nicht stimmen.'),
        ('Ausbilder', 'Letzter Rundgang vor der Prüfung. Heute zählen die Maße und Abstände. Miss genau.', 'Alle Maße sitzen. So gehst du sicher in die Prüfung.', 'Bei den Maßen hakt es noch. Wiederhole sie, bevor es ernst wird.'),
    ],
    'stellungnahme': [
        ('Amtsleiterin', 'Willkommen in der Brandschutzdienststelle. Im Posteingang liegen die ersten Bauvorhaben. Kläre die Grundlagen und schreib die erste Stellungnahme.', 'Die Stellungnahmen gehen heute noch an die Bauaufsicht.', 'Die Bauaufsicht schickt deine Stellungnahmen mit Rückfragen zurück.'),
        ('Kollege aus der Bauaufsicht', 'Ich brauche deine Einordnung: Gebäudeklassen und Rettungswege. Der Architekt ruft um zwölf an.', 'Der Architekt hat seine Antwort pünktlich bekommen.', 'Der Architekt muss vertröstet werden. Die Einordnung stimmt noch nicht.'),
        ('Amtsleiterin', 'Draußen regnet es, drinnen stapeln sich die Akten: Rettungswege, Wände, Decken und Türen. Nimm dir die Pläne am Plantisch vor.', 'Der Stapel ist abgearbeitet, die Pläne sind geprüft.', 'Einige Pläne müssen noch einmal auf den Tisch.'),
        ('Bauherr am Telefon', 'Wir planen ein Einkaufszentrum mit Saal. Mir wurde gesagt, das sei ein Sonderbau. Was heißt das für uns?', 'Der Bauherr weiß jetzt, welche Vorschriften für sein Vorhaben gelten.', 'Der Bauherr ist verunsichert. Die Auskunft war nicht eindeutig.'),
        ('Amtsleiterin', 'Feierabend ist erst, wenn die Abweichungsanträge bewertet sind. Der Bauherr will Öffnungen in der Brandwand.', 'Die Abweichungen sind sauber bewertet. Schönen Feierabend.', 'Die Bewertung der Abweichungen trägt noch nicht. Morgen geht es weiter.'),
    ],
    'stab': [
        ('Leiter des Stabes', 'Der Stab ist einberufen. Die ersten Meldungen liegen beim Sichter. Bring jede zum zuständigen Sachgebiet.', 'Alle Meldungen sind angekommen. Der Stab arbeitet geordnet.', 'Meldungen sind beim falschen Sachgebiet gelandet. Der Stab verliert Zeit.'),
        ('Leiter des Stabes', 'Lagebesprechung in zehn Minuten. Die Sachgebiete haben vorher noch Fragen an dich. Draußen zieht Regen auf.', 'Die Lagebesprechung beginnt pünktlich, alle Fragen sind geklärt.', 'Zur Lagebesprechung sind noch Fragen offen.'),
        ('Leitstelle', 'Es dämmert, und die Lage zieht an. Die Meldungen kommen jetzt im Minutentakt. Die Zeit läuft.', 'Trotz Zeitdruck kam jede Meldung an. Die Lage ist unter Kontrolle.', 'Im Meldungsstau ist Wichtiges liegen geblieben.'),
        ('Leiter des Stabes', 'Großeinsatzlage. Wir müssen die Führungsorganisation erweitern und den Krisenstab einbinden. Ich verlasse mich auf dich.', 'Die Führungsorganisation steht. Der Krisenstab ist eingebunden.', 'Die Führungsorganisation ist noch nicht stimmig.'),
        ('Ablösung', 'Schichtende in wenigen Minuten. Arbeite die letzten Meldungen und Fragen ab, dann übernehme ich.', 'Saubere Übergabe. Die Ablösung übernimmt eine geordnete Lage.', 'Die Übergabe verzögert sich. Es ist noch zu viel offen.'),
    ],
    'presse': [
        ('Einsatzleiter', 'Wohnungsbrand, die ersten Reporter stehen an der Absperrung. Du übernimmst die Presse. Was dürfen sie, was müssen wir?', 'Die Presse hat ihre Auskünfte, der Einsatz läuft ungestört weiter.', 'An der Absperrung gibt es Ärger mit der Presse.'),
        ('Einsatzleiter', 'Es wird dunkel, die Kameras laufen. Die Reporter fragen nach Schuld und Namen. Bleib bei den Grundsätzen.', 'In den Abendnachrichten läuft ein sachlicher Bericht.', 'In den Abendnachrichten werden Vermutungen als Tatsachen gesendet.'),
        ('Pressesprecherin der Stadt', 'Es regnet, und die Presse drängt auf Messwerte und Bilder. Kläre, was du herausgeben musst und was nicht.', 'Die Presse akzeptiert die Grenzen. Niemand wurde gefährdet.', 'Es sind Auskünfte hinausgegangen, die nicht hätten hinausgehen dürfen.'),
        ('Einsatzleiter', 'Das Feuer ist unter Kontrolle. Jetzt gibst du den O-Ton für die Abendsendung. Kurz, klar, nur das Wichtigste.', 'Dein Statement wird ungekürzt gesendet. Es war klar und verlässlich.', 'Das Statement muss geschnitten werden. Es war zu unklar.'),
        ('Redaktion im Ohr', 'Wir schalten gleich live zu Ihnen. Die Moderatorin wird unbequem fragen. Noch dreißig Sekunden.', 'Die Live-Schalte lief ruhig. Die Bevölkerung weiß, was zu tun ist.', 'In der Live-Schalte sind Sätze gefallen, die jetzt Fragen aufwerfen.'),
    ],
    'lage': [
        ('Lagedienstführer', 'Willkommen im Lagezentrum. Bevor es losgeht, klären wir die Grundlagen der zivilen Verteidigung.', 'Die Grundlagen sitzen. Du bist bereit für die Lage.', 'Bei den Grundlagen gibt es noch Lücken.'),
        ('Warnzentrale', 'Es wird Abend, und wir müssen die Bevölkerung warnen. Welche Warnmittel setzen wir ein, und wer löst aus?', 'Die Warnung ist ausgelöst und kommt an.', 'Die Warnung hat nicht alle erreicht.'),
        ('Lagedienstführer', 'Starkregen im ganzen Land. Kritische Infrastrukturen melden Ausfälle. Verschaff dir am Lagetisch einen Überblick.', 'Das Lagebild steht. Die Prioritäten sind gesetzt.', 'Das Lagebild ist unvollständig.'),
        ('Verbindungsoffizier', 'Die Länder bitten um Unterstützung, auch die Bundeswehr ist angefragt. Was geht rechtlich, was nicht?', 'Die Hilfe ist rechtssicher auf dem Weg.', 'Die Anforderung hängt, weil die Rechtsgrundlage nicht geklärt ist.'),
        ('Lagedienstführer', 'Die Nacht war lang. Vor der Übergabe gehen wir das Gesamtszenario noch einmal durch.', 'Übergabe mit vollständigem Lagebild. Gute Arbeit.', 'Zur Übergabe sind noch Punkte offen.'),
    ],
    'ucpm': [
        ('Teamleiter', 'Guten Morgen auf dem Flugfeld. Bevor wir verladen, müssen alle die Abkürzungen kennen. Ohne die versteht man in Brüssel nichts.', 'Das Team spricht jetzt dieselbe Sprache.', 'Im Team gehen die Abkürzungen noch durcheinander.'),
        ('Lagezentrum Brüssel', 'Ein Mitgliedstaat bittet um Hilfe. Auf welchem Weg läuft das Ersuchen, und wer koordiniert?', 'Das Hilfeersuchen ist auf dem richtigen Weg.', 'Das Ersuchen ist an der falschen Stelle gelandet.'),
        ('Teamleiter', 'Es regnet, die Maschine wartet. Welche Kapazitäten können wir anbieten, und was gehört in welches Modul?', 'Die Module sind richtig gemeldet und verladen.', 'Beim Verladen fehlt die Übersicht über die Kapazitäten.'),
        ('Verbindungsbeamtin', 'Vor dem Abflug am Abend noch die Fragen zu Kosten und Rechtsgrundlagen. Der Start ist in einer Stunde.', 'Start pünktlich, alle Formalitäten sind geklärt.', 'Der Abflug verzögert sich wegen offener Formalitäten.'),
        ('Teamleiter', 'Einsatzbesprechung vor dem Abflug: Akteure, Ablauf, Zuständigkeiten. Danach geht es los.', 'Abflug. Das Team ist vorbereitet.', 'Die Einsatzbesprechung muss wiederholt werden.'),
    ],
    'ibk': [
        ('Wachleiter', 'Auf der Wache knirscht es im Miteinander. Ich möchte, dass du die Ich-Zustände erkennst und das erste Gespräch führst.', 'Das Gespräch verlief sachlich. Der Kollege weiß, woran er ist.', 'Das Gespräch ist entgleist. Der Kollege hat dichtgemacht.'),
        ('Wachleiter', 'Heute Abend geht es um Transaktionen. Achte darauf, was zwischen den Zeilen gesagt wird.', 'Die verdeckte Botschaft ist auf dem Tisch. Das Gespräch läuft wieder glatt.', 'Die verdeckte Botschaft blieb unausgesprochen und der Ärger ist geblieben.'),
        ('Personalrat', 'Guten Morgen. Eine Kollegin fühlt sich übersehen. Was Menschen antreibt und was Beachtung bewirkt, ist heute dein Thema.', 'Die Kollegin fühlt sich gesehen und bleibt motiviert.', 'Die Kollegin fühlt sich weiter übersehen.'),
        ('Ausbilder', 'Es regnet, die Übung fällt aus, die Stimmung ist gereizt. Ein Anwärter sucht einen Retter. Erkenne das Spiel.', 'Du bist nicht ins Drama-Dreieck eingestiegen. Der Anwärter übernimmt selbst Verantwortung.', 'Du steckst mitten im Drama-Dreieck.'),
        ('Wachleiter', 'Zwei Kollegen streiten offen über den Dienstplan. Bevor das eskaliert, übernimmst du die Klärung.', 'Der Konflikt ist auf dem Weg zur Lösung. Niemand hat das Gesicht verloren.', 'Der Konflikt ist gedeckelt und brodelt weiter.'),
    ],
    'vak': [
        ('Dozentin', 'Willkommen im Hörsaal. Wir beginnen mit dem Staatsorganisationsrecht. Jede Reihe hat eine Frage für Sie.', 'Die Dozentin nickt zufrieden. Das Fundament steht.', 'Die Dozentin empfiehlt, das Kapitel noch einmal zu lesen.'),
        ('Dozentin', 'Heute früh: allgemeines Verwaltungsrecht. Verwaltungsakt, Ermessen, Verfahren. Bitte nach vorn.', 'Verwaltungsakt und Ermessen sitzen.', 'Beim Verwaltungsakt gibt es noch Unsicherheiten.'),
        ('Dozent', 'Beamten- und Disziplinarrecht. Das betrifft Sie alle persönlich. Los geht es.', 'Rechte und Pflichten im Dienst sind klar.', 'Bei Rechten und Pflichten ist noch nicht alles klar.'),
        ('Dozentin', 'Draußen regnet es, drinnen geht es um Zwang: Vollstreckung und Rechtsschutz.', 'Zwangsmittel und Rechtsbehelfe sind sauber auseinandergehalten.', 'Zwangsmittel und Rechtsbehelfe gehen noch durcheinander.'),
        ('Prüfungsvorsitzender', 'Guten Abend. Dies ist die gemischte Klausur. Alles kann drankommen.', 'Die Klausur ist bestanden.', 'Die Klausur ist noch nicht bestanden. Sie dürfen wiederholen.'),
    ],
    'feuak': [
        ('Kämmerin', 'Der Haushalt für das nächste Jahr steht an. Ich brauche Ihre Bedarfsanmeldung, sauber begründet.', 'Die Anmeldung geht unverändert in den Haushaltsplanentwurf.', 'Die Kämmerei schickt die Anmeldung zur Überarbeitung zurück.'),
        ('Dezernent', 'Wir bauen eine neue Wache. Sie leiten das Projekt. Wie setzen Sie es auf?', 'Der Projektplan überzeugt den Dezernenten.', 'Der Projektplan hat Lücken.'),
        ('Amtsleiter', 'Guten Morgen. Die Politik will wissen, wie gut wir arbeiten. Zeigen Sie mir Ihr Qualitätsmanagement.', 'Die Kennzahlen überzeugen den Ausschuss.', 'Der Ausschuss hat Nachfragen zu den Kennzahlen.'),
        ('Kämmerin', 'Bevor wir heute Abend über Geld reden: Wie steht es um die wirtschaftlichen Grundlagen?', 'Die Kämmerin spricht jetzt auf Augenhöhe mit Ihnen.', 'Bei den wirtschaftlichen Grundlagen fehlt noch etwas.'),
        ('Dezernent', 'Es regnet, die Sitzung ist lang: neue Fahrzeuge beschaffen und den Bedarfsplan fortschreiben. Am Stadtmodell entscheiden Sie über Standorte.', 'Der Rat beschließt Vergabe und Bedarfsplan wie vorgeschlagen.', 'Der Rat vertagt die Entscheidung.'),
    ],
}

# Lichtstimmung je Level (passend zur Rahmengeschichte)
LICHT = {
    'begehung': ['tag', 'morgen', 'abend', 'regen', 'tag'], 'stellungnahme': ['morgen', 'tag', 'regen', 'tag', 'abend'], 'stab': ['tag', 'regen', 'daemmerung', 'abend', 'daemmerung'],
    'presse': ['abend', 'daemmerung', 'regen', 'abend', 'daemmerung'], 'lage': ['tag', 'abend', 'regen', 'daemmerung', 'morgen'], 'ucpm': ['morgen', 'tag', 'regen', 'abend', 'tag'],
    'ibk': ['tag', 'abend', 'morgen', 'regen', 'daemmerung'], 'vak': ['tag', 'morgen', 'tag', 'regen', 'abend'], 'feuak': ['tag', 'tag', 'morgen', 'abend', 'regen'],
}
