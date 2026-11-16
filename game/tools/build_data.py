#!/usr/bin/env python3
"""Erzeugt die Spieldaten game/data/<mission>.json.

Quellen (nichts wird erfunden, außer wo "eigener Stoff" dabeisteht):
- Quizfragen der App: IDF_QUIZ_Q in js/idf-data.js (Vorbeugender Brandschutz, Stabsarbeit), VAk-Quiz in js/app.js
- Lernkarten der App (k-ibk-*, k-feuak-*) in js/app.js: Frage der Karte, richtige Antwort = Antwort der Karte,
  falsche Antworten = Antworten anderer Karten desselben Fachs
- von Hand aus den Kapiteln abgeleitete Aufgaben (Presse, Zivile Verteidigung, UCPM, Zuordnung der Sachgebiete)
- Aufgaben mit eigener Spielmechanik und die Rahmengeschichte je Level: game/tools/extra_data.py

Aufruf im Repo-Ordner: python3 game/tools/build_data.py
"""
import html, json, os, random, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extra_data as X

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'game', 'data')
DEC = json.JSONDecoder()


def plain(t):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', t))).strip()


def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()


APP = read('js/app.js')
IDF = read('js/idf-data.js')
IDF_Q = DEC.raw_decode(IDF[IDF.index('const IDF_QUIZ_Q=') + len('const IDF_QUIZ_Q='):])[0]
VAK_Q = DEC.raw_decode(APP[APP.index('  Q:[{"id":1,"cat":"Staatsorganisationsrecht"') + 4:])[0]


def cards(prefix):
    res = []
    for m in re.finditer(r'"id"\s*:\s*"k-' + prefix + r'-\d+"', APP):
        depth, start = 0, None
        for j in range(m.start(), max(0, m.start() - 6000), -1):
            if APP[j] == '}':
                depth += 1
            elif APP[j] == '{':
                if depth == 0:
                    start = j
                    break
                depth -= 1
        o = DEC.raw_decode(APP[start:])[0]
        res.append({'id': o['id'], 'cat': o.get('cat', ''), 'q': plain(o['q']), 'a': plain(o['a'])})
    return res


def from_quiz(q, src):
    """Quizfrage der App -> Aufgabe (mc, tf oder multi)."""
    opts = [plain(o) for o in q['opts']]
    if q['type'] == 'multi':
        return {'typ': 'multi', 'frage': plain(q['q']), 'optionen': opts, 'richtig': [opts[i] for i in q['correct']],
                'erkl': plain(q.get('exp', '')), 'quelle': src + ' · Frage ' + str(q['id'])}
    return {'typ': 'mc', 'frage': plain(q['q']), 'optionen': opts, 'richtig': opts[q['correct']],
            'erkl': plain(q.get('exp', '')), 'quelle': src + ' · Frage ' + str(q['id'])}


def from_cards(pool, rnd, maxlen=190):
    """Lernkarten -> Auswahlaufgaben; falsche Antworten sind Antworten anderer Karten mit ähnlicher Länge."""
    ok = [c for c in pool if 12 <= len(c['a']) <= maxlen and len(c['q']) <= 170]
    res = []
    for c in ok:
        others = sorted((o for o in ok if o['a'] != c['a']), key=lambda o: (o['cat'] != c['cat'], abs(len(o['a']) - len(c['a']))))
        wrong = rnd.sample(others[:8], 3)
        opts = [c['a']] + [w['a'] for w in wrong]
        rnd.shuffle(opts)
        res.append({'typ': 'mc', 'frage': c['q'], 'optionen': opts, 'richtig': c['a'], 'erkl': c['cat'], 'quelle': 'Lernkarte ' + c['id'], '_cat': c['cat']})
    return res


def mc(frage, richtig, falsch, erkl, quelle, rnd):
    opts = [richtig] + list(falsch)
    rnd.shuffle(opts)
    return {'typ': 'mc', 'frage': frage, 'optionen': opts, 'richtig': richtig, 'erkl': erkl, 'quelle': quelle}


def multi(frage, richtig, falsch, erkl, quelle, rnd):
    opts = list(richtig) + list(falsch)
    rnd.shuffle(opts)
    return {'typ': 'multi', 'frage': frage, 'optionen': opts, 'richtig': list(richtig), 'erkl': erkl, 'quelle': quelle}


def reihe(frage, folge, erkl, quelle, rnd):
    opts = list(folge)
    while opts == list(folge):
        rnd.shuffle(opts)
    return {'typ': 'reihe', 'frage': frage, 'optionen': opts, 'richtig': list(folge), 'erkl': erkl, 'quelle': quelle}


def bringen(meldung, ziel, quelle):
    return {'typ': 'bringen', 'frage': meldung, 'ziel': ziel, 'erkl': 'Zuständig: ' + ziel + '.', 'quelle': quelle}


def write(mission, welt, level):
    for L in level:
        for a in L['aufgaben']:
            a.pop('_cat', None)
            assert a['typ'] in ('mc', 'multi', 'reihe', 'bringen', 'bausteine', 'gespraech', 'budget', 'statement'), a
            assert a.get('quelle') and a.get('frage'), a
            if a['typ'] == 'bausteine':
                assert all(f['richtig'] in f['optionen'] and len(f['optionen']) == 3 for f in a['felder']), a['frage']
            if a['typ'] == 'gespraech':
                assert all(sum(1 for o in z['optionen'] if o['gut']) == 1 for z in a['zuege']), a['frage']
            if a['typ'] in ('budget',):
                assert all(r in [x['t'] for x in a['posten']] for r in a['richtig']), a['frage']
            if a['typ'] in ('statement', 'reihe'):
                assert all(r in a['optionen'] for r in a['richtig']), a['frage']
            if a['typ'] == 'mc':
                assert a['richtig'] in a['optionen'] and len(set(a['optionen'])) == len(a['optionen']), a['frage']
            if a['typ'] == 'multi':
                assert a['richtig'] and all(r in a['optionen'] for r in a['richtig']), a['frage']
    assert len(level) == 5, (mission, len(level))
    geschichte(mission, level)
    with open(os.path.join(OUT, mission + '.json'), 'w', encoding='utf-8') as f:
        json.dump({'mission': mission, 'welt': welt, 'level': level}, f, ensure_ascii=False, indent=1)
    print(mission, [len(L['aufgaben']) for L in level])


def geschichte(mission, level):
    """Rahmengeschichte und Lichtstimmung je Level eintragen."""
    for i, L in enumerate(level):
        wer, text, gut, schlecht = X.STORY[mission][i]
        L['auftrag'] = {'wer': wer, 'text': text}
        L['ende'] = {'gut': gut, 'schlecht': schlecht}
        L['licht'] = X.LICHT[mission][i]


def begehung():
    """Die Aufgaben der Begehung sind von Hand gepflegt; hier kommen nur Rahmengeschichte und Licht dazu."""
    p = os.path.join(OUT, 'begehung.json')
    with open(p, encoding='utf-8') as f:
        d = json.load(f)
    geschichte('begehung', d['level'])
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    print('begehung', [len(L['aufgaben']) for L in d['level']])


def chunks(pool, n, size):
    return [pool[i * size:(i + 1) * size] for i in range(n)]


# ---------------------------------------------------------------- Stellungnahme (VB-Quiz der App)
def stellungnahme():
    rnd = random.Random(11)
    extra = X.stellungnahme_extra()
    pool = [from_quiz(q, 'IdF-Quiz') for q in IDF_Q if q['cat'].startswith('Vorbeugender') and q['type'] in ('mc', 'multi') and not q.get('unsicher') and not q.get('img')]
    neu = [p for p, q in zip(pool, [q for q in IDF_Q if q['cat'].startswith('Vorbeugender') and q['type'] in ('mc', 'multi') and not q.get('unsicher') and not q.get('img')]) if '12/2026' in q['cat']]
    alt = [p for p in pool if p not in neu]
    rnd.shuffle(neu); rnd.shuffle(alt)
    titel = ['Posteingang', 'Gebäudeklasse und Einordnung', 'Rettungswege und Bauteile', 'Sonderbau', 'Abweichungen']
    text = ['Auf deinem Schreibtisch liegen Bauvorhaben. Kläre die Grundlagen.', 'Ordne die Vorhaben richtig ein.', 'Prüfe Rettungswege, Wände, Decken und Türen.',
            'Die Vorhaben werden größer: Sonderbauten.', 'Der Bauherr beantragt Abweichungen. Bewerte sie.']
    level = []
    for i in range(5):
        a = neu[i * 4:(i + 1) * 4] + alt[i * 2:(i + 1) * 2]
        a[1:1] = extra.get(i, [])
        level.append({'titel': titel[i], 'steckbrief': text[i], 'aufgaben': a})
    write('stellungnahme', 'amt', level)


# ---------------------------------------------------------------- Im Stab (Zuordnung aus Kapitel S1–S6, Stab-Quiz der App)
def stab():
    rnd = random.Random(12)
    q = 'v-idf-s52 · '
    b = [
        bringen('Für ortsunkundige Kräfte muss eine Lotsenstelle eingerichtet werden.', 'S1', q + 'S1 Personal / Innerer Dienst'),
        bringen('Die Lagekarte muss auf den neuen Stand gebracht werden.', 'S2', q + 'S2 Lage'),
        bringen('Für das Schadengebiet sind Absperrmaßnahmen anzuordnen.', 'S3', q + 'S3 Einsatz'),
        bringen('Die Einsatzkräfte brauchen Verpflegung und Unterkünfte.', 'S4', q + 'S4 Versorgung'),
        bringen('Eine Presse- und Medienkonferenz ist vorzubereiten.', 'S5', q + 'S5 Presse und Medienarbeit'),
        bringen('Das Kommunikationskonzept mit eindeutigen Bezeichnungen der Einsatzabschnitte ist zu planen.', 'S6', q + 'S6 Informations- und Kommunikationswesen'),
        bringen('Das Einsatztagebuch ist zu führen.', 'S2', q + 'S2 Lage'),
        bringen('Die Schichtplanung für den Stab ist aufzustellen.', 'S1', q + 'S1 Personal / Innerer Dienst'),
        bringen('Technischer, medizinischer und psychosozialer Eigenschutz der Einsatzkräfte ist bereitzustellen.', 'S4', q + 'S4 Versorgung'),
        bringen('An- und Abmarschwege sind festzulegen.', 'S3', q + 'S3 Einsatz'),
        bringen('Presse- und Medienvertreter sind zu informieren, zu führen und unterzubringen.', 'S5', q + 'S5 Presse und Medienarbeit'),
        bringen('Die erforderliche IuK-Technik ist bereitzustellen und in Betrieb zu nehmen.', 'S6', q + 'S6 Informations- und Kommunikationswesen'),
        bringen('Eine Kräfteübersicht ist zu führen.', 'S1', q + 'S1 Personal / Innerer Dienst'),
        bringen('Die Lagebesprechung ist durchzuführen und der Entschluss zu fassen.', 'S3', q + 'S3 Einsatz'),
        bringen('Kraftstoffe, Löschmittel und Atemschutzgeräte sind bereitzustellen.', 'S4', q + 'S4 Versorgung'),
        bringen('Fachberater von THW und Polizei sind anzufordern.', 'S1', q + 'S1 Personal / Innerer Dienst'),
        bringen('Der Abschlussbericht ist zu erstellen.', 'S2', q + 'S2 Lage'),
        bringen('Die Befehlsstelle ist festzulegen.', 'S3', q + 'S3 Einsatz'),
    ]
    plan = reihe('Arbeitsaufnahme des Stabes: Bring den Sieben-Punkte-Plan in die richtige Reihenfolge.',
                 ['Einsatzraum strukturieren', 'Bereitstellungsraum festlegen', 'Eigenschutz veranlassen', 'Grundschutz zuweisen', 'Kommunikation schaffen', 'Vorhandene Kräfte einsetzen', 'Nachforderung kalkulieren'],
                 'Sieben-Punkte-Plan: 1 Einsatzraum strukturieren (S3), 2 Bereitstellungsraum (S1 & S3), 3 Eigenschutz (S4), 4 Grundschutz (S3), 5 Kommunikation (S3 oder S6), 6 vorhandene Kräfte (S1 & S3), 7 Nachforderung (S1 & S3).',
                 'v-idf-s52 · Sieben-Punkte-Plan', rnd)
    zus = mc('Zu wenig Personal im Stab: Mit welchem Sachgebiet wird S4 zusammengefasst?', 'mit S1', ['mit S2', 'mit S3', 'mit S6'], 'S4 mit S1, S2 mit S3, S5 zu S2, S6 zu S3.', 'v-idf-s52 · Zusammenfassung der Sachgebiete', rnd)
    quiz = [from_quiz(x, 'IdF-Quiz') for x in IDF_Q if x['cat'] == 'Stabsarbeit' and x['type'] in ('mc', 'multi') and not x.get('unsicher')]
    rnd.shuffle(quiz)
    level = [
        {'titel': 'Meldungen sichten', 'steckbrief': 'Hol die Meldungen am Sichter ab und bring jede zum zuständigen Sachgebiet.', 'aufgaben': b[0:6]},
        {'titel': 'Lagebesprechung', 'steckbrief': 'Die Sachgebiete haben Fragen an dich.', 'aufgaben': [plan, zus] + quiz[0:4]},
        {'titel': 'Die Lage zieht an', 'steckbrief': 'Mehr Meldungen, und die Zeit läuft.', 'zeit': 240, 'aufgaben': b[6:12]},
        {'titel': 'Großeinsatzlage', 'steckbrief': 'Führungsorganisation, Einheiten und Krisenstab.', 'aufgaben': quiz[4:11]},
        {'titel': 'Schichtende', 'steckbrief': 'Letzte Meldungen und Fragen vor der Übergabe, unter Zeitdruck.', 'zeit': 360, 'aufgaben': b[12:18] + quiz[11:14]},
    ]
    write('stab', 'stab', level)


# ---------------------------------------------------------------- Pressestatement (Kapitel Presse, dazu eigener Stoff)
def presse():
    rnd = random.Random(13)
    a, b, e = 'v-idf-p61 · ', 'v-idf-p62 · ', 'eigener Stoff'
    g = 'Grundsätze der Pressearbeit'
    t = [
        mc('Wozu verpflichtet § 4 Landespressegesetz die Behörden?', 'Der Presse auf konkrete Anfragen zweckdienliche und erschöpfende Auskünfte zu erteilen', ['Jede Einsatzstelle für die Presse zu sperren', 'Messwerte sofort als Rohdaten herauszugeben', 'Nur schriftliche Anfragen zu beantworten'], 'Behörden müssen der Presse auf konkrete Anfragen zweckdienliche und erschöpfende Auskünfte erteilen.', a + '§ 4 LPG', rnd),
        mc('Wer entscheidet nach § 43 Landesbeamtengesetz, wer den Medien Auskünfte erteilt?', 'Die Leitung der Behörde; der HVB kann das delegieren', ['Die dienstälteste Kraft an der Einsatzstelle', 'Die Leitstelle', 'Jede Einsatzkraft für sich selbst'], 'Die Leitung der Behörde entscheidet; der HVB kann delegieren, z. B. an Pressesprecher oder Einsatzleiter.', a + '§ 43 LBG', rnd),
        mc('Ab wann kann die Presse auf Auskünften bestehen?', 'Erst wenn das Einsatzgeschehen eine Beurteilung und die Weitergabe nach pflichtgemäßem Ermessen erlaubt', ['Sofort mit dem Eintreffen an der Einsatzstelle', 'Erst nach dem Ende des Einsatzes', 'Erst nach einem schriftlichen Antrag'], 'Maßgeblich ist das pflichtgemäße Ermessen des Einsatzleiters bzw. des Pressesprechers.', a + 'Rechtliche Grundlagen', rnd),
        multi('Welche Grundsätze gelten im Umgang mit der Presse?', ['Keine Aussagen zu Schuldfragen', 'Keine Personalien preisgeben', 'Vermutungen kennzeichnen', 'Wahrheitsgetreu antworten'], ['Wertende Aussagen sind erwünscht'], 'Dazu: keine wertenden Aussagen, Statements erst, wenn der Einsatz es zulässt.', a + g, rnd),
        mc('Eine Reporterin fragt: „Wer ist schuld an dem Brand?“ Was antwortest du?', '„Zur Schuldfrage machen wir keine Aussagen.“', ['„Vermutlich war es der Mieter.“', '„Der Vermieter hat hier geschlampt.“', '„Das sehen Sie doch selbst.“'], 'Keine Aussagen zu Schuldfragen, keine wertenden Aussagen.', a + g, rnd),
        mc('Ein Reporter will den Namen des Verletzten wissen. Was antwortest du?', '„Personalien geben wir nicht preis.“', ['„Ich buchstabiere Ihnen den Namen.“', '„Fragen Sie die Nachbarn.“', '„Den Namen gibt es gegen ein Belegexemplar.“'], 'Keine Personalien preisgeben.', a + g, rnd),
        mc('Darf die Presse an der Einsatzstelle fotografieren?', 'Ja, innerhalb der Schranken darf sie sich bewegen und fotografieren', ['Nein, an Einsatzstellen ist das verboten', 'Nur mit schriftlicher Genehmigung des Einsatzleiters', 'Nur nach dem Ende des Einsatzes'], 'Die Presse darf sich bewegen und fotografieren, innerhalb der Schranken.', a + 'Schranken für die Presse', rnd),
        multi('Welche Schranken gelten für die Presse an der Einsatzstelle?', ['Einsatzmaßnahmen nicht behindern', 'Sich selbst nicht gefährden', 'Die Würde betroffener Personen achten'], ['Bilder vor der Veröffentlichung der Feuerwehr vorlegen'], 'Nicht behindern, nicht selbst gefährden, Würde der Betroffenen achten (Pressekodex).', a + 'Schranken für die Presse', rnd),
        mc('Ein Reporter verlangt sofort die Messwerte. Was gilt nach dem Umweltinformationsgesetz?', 'Kein Anspruch auf sofortige Rohdaten; ausgewertete Informationen innerhalb eines Monats', ['Rohdaten sind sofort herauszugeben', 'Messwerte bleiben immer geheim', 'Messwerte gibt es nur gegen Gebühr'], 'Kein Anspruch auf sofortige Herausgabe von Rohdaten; ausgewertete Informationen binnen eines Monats.', a + 'Umweltinformationsgesetz', rnd),
        multi('Wann können Auskünfte verweigert werden?', ['Vorschriften über die Geheimhaltung stehen entgegen', 'Ein überwiegendes öffentliches oder schutzwürdiges privates Interesse würde verletzt', 'Der Umfang würde das zumutbare Maß überschreiten'], ['Die Frage ist unbequem'], 'Das sind die drei Grenzen des Auskunftsanspruchs.', b + 'Grenzen des Auskunftsanspruchs', rnd),
        multi('Was macht ein gutes Pressestatement aus?', ['Einfache Sprache', 'Zahlensalat vermeiden', 'Auf die wichtigsten Punkte beschränken'], ['Sämtliche Probleme des Einsatzes aufzählen'], 'Nur auf die größte Herausforderung im Einsatz eingehen, statt sämtliche Probleme zu nennen.', b + 'Pressestatements abgeben', rnd),
        mc('Warum ist der Einsatzleiter vor Ort für die Presse besonders wertvoll?', 'Die Presse möchte authentische Augenzeugenberichte; er ist der Experte vor Ort', ['Er darf als Einziger Schuldfragen beantworten', 'Er kennt die Personalien der Betroffenen', 'Er muss jede Frage sofort beantworten'], 'Authentische Augenzeugenberichte; klare und verlässliche Aussagen sind wichtig.', b + 'Pressestatements abgeben', rnd),
        mc('Wem untersteht S5, wenn der Krisenstab die Arbeit aufnimmt?', 'Der BuMA', ['Dem S2', 'Der Leitstelle', 'Dem Kreisbrandmeister'], 'Bei Arbeitsaufnahme des Krisenstabes gehen Melde- und Berichtswesen auf die BuMA über, S5 untersteht dann der BuMA.', 'v-idf-s52 · S5 Presse und Medienarbeit', rnd),
        mc('Was gehört zur Presse- und Medienbetreuung des S5?', 'Informieren, Führen und Unterbringen von Presse- und Medienvertretern', ['Führen der Lagekarte', 'Bereitstellen der Verpflegung', 'Planung der Fernmeldeorganisation'], 'Dazu Vorbereitung und Durchführung von Presse- und Medienkonferenzen.', 'v-idf-s52 · S5 Presse und Medienarbeit', rnd),
        mc('Du vermutest einen technischen Defekt als Ursache, gesichert ist das nicht. Wie sagst du es?', 'Als Vermutung kennzeichnen', ['Als Tatsache nennen, das klingt sicherer', 'Die Ursache einem Beteiligten zuschreiben', 'Die Zahl der Verletzten schätzen und dazusagen'], 'Vermutungen kennzeichnen, wahrheitsgetreu antworten.', a + g, rnd),
        mc('Mitten in der Menschenrettung verlangt ein Kamerateam sofort ein Statement. Was gilt?', 'Statements gibt es erst, wenn der Einsatz es zulässt', ['Die Presse hat Vorrang vor dem Einsatz', 'Statements gibt es grundsätzlich nie an der Einsatzstelle', 'Das Kamerateam ist des Platzes zu verweisen'], 'Statements erst, wenn der Einsatz es zulässt.', a + g, rnd),
        mc('Bevor du vor die Kamera trittst: Was klärst du zuerst?', 'Welche gesicherten Fakten ich nennen kann und was meine Kernbotschaft ist', ['Wie ich möglichst viele Zahlen unterbringe', 'Wem ich die Schuld geben kann', 'Wie ich die Fragen der Presse umgehe'], 'Eigener Stoff, abgeleitet aus den Grundsätzen: wahrheitsgetreu, auf das Wichtigste beschränken.', e, rnd),
        mc('Ein Reporter stellt eine Frage, deren Antwort du nicht kennst. Was sagst du?', '„Das weiß ich im Moment nicht. Ich reiche die Information nach, sobald sie gesichert ist.“', ['Irgendetwas, das plausibel klingt', '„Kein Kommentar.“ und weggehen', 'Eine Schätzung, ohne sie zu kennzeichnen'], 'Eigener Stoff, abgeleitet aus den Grundsätzen: wahrheitsgetreu antworten, Vermutungen kennzeichnen.', e, rnd),
        reihe('Bring die Teile eines kurzen O-Tons in eine sinnvolle Reihenfolge.', ['Was ist passiert?', 'Was tut die Feuerwehr gerade?', 'Was sollen die Menschen in der Umgebung tun?', 'Wie geht es weiter?'], 'Eigener Stoff: ein möglicher Aufbau. Die Kapitel der App verlangen einfache Sprache und die Beschränkung auf das Wichtigste.', e, rnd),
        mc('Ein Reporter drängt: „Sagen Sie einfach irgendetwas, wir senden live.“ Wie reagierst du?', 'Ruhig bleiben und nur gesicherte Fakten nennen', ['Spekulieren, damit die Sendezeit gefüllt ist', 'Die Einsatzstelle für die Presse sperren', 'Die Schuldfrage ansprechen, das interessiert die Zuschauer'], 'Eigener Stoff, abgeleitet aus den Grundsätzen: wahrheitsgetreu, keine Schuldfragen, klare und verlässliche Aussagen.', e, rnd),
    ]
    titel = ['Rechtsgrundlagen', 'Die Kameras laufen', 'Schranken und Grenzen', 'Das Statement', 'Live-Schalte']
    text = ['Die ersten Reporter treffen ein. Was gilt rechtlich?', 'Die Presse stellt Fragen zur Einsatzstelle.', 'Was die Presse darf und was du verweigern kannst.', 'Jetzt gibst du selbst den O-Ton.', 'Die Fragen werden unbequem.']
    order = [[0, 1, 2, 12], [4, 5, 6, 15], [7, 8, 9, 13], [10, 11, 16, 18], [3, 14, 17, 19]]
    extra = X.presse_extra()
    write('presse', 'einsatz', [{'titel': titel[i], 'steckbrief': text[i], 'aufgaben': [t[k] for k in order[i]] + extra.get(i, [])} for i in range(5)])


# ---------------------------------------------------------------- Lage Bevölkerungsschutz (Kapitel Zivile Verteidigung)
def lage():
    r = random.Random(14)
    z = 'v-idf-z9'
    l1 = [
        multi('Wen oder was schützen die Genfer Konventionen von 1949?', ['Verwundete und Kranke', 'Kriegsgefangene', 'Zivilbevölkerung', 'Medizinisches Personal und Einrichtungen'], ['Kombattanten im laufenden Gefecht'], 'Schutz von Verwundeten und Kranken, Kriegsgefangenen, Zivilbevölkerung, medizinischem Personal und Einrichtungen.', z + '0 · Genfer Konventionen', r),
        mc('Welche zwei zentralen Grundsätze nennen die Genfer Konventionen?', 'Unterscheidung zwischen Kombattanten und Zivilpersonen sowie Verhältnismäßigkeit der Mittel', ['Neutralität und Bündnistreue', 'Ressortprinzip und Subsidiarität', 'Abschreckung und Vergeltung'], 'Unterscheidung und Verhältnismäßigkeit.', z + '0 · Genfer Konventionen', r),
        mc('Woraus besteht die Gesamtverteidigung?', 'Aus ziviler und militärischer Verteidigung', ['Aus Zivilschutz und Katastrophenschutz', 'Aus Bundeswehr und Polizei', 'Aus Bund und Ländern'], 'Gesamtverteidigung = Zivile Verteidigung + Militärische Verteidigung.', z + '0 · Gesamtverteidigung', r),
        multi('Was gehört zur Zivilen Verteidigung?', ['Aufrechterhaltung der Staats- und Regierungsfunktion', 'Zivilschutz', 'Versorgung', 'Unterstützung der Streitkräfte'], ['Bündnisverteidigung Ausland'], 'Die vier Säulen der Zivilen Verteidigung.', z + '0 · Gesamtverteidigung', r),
        mc('Was ist Zivilschutz?', 'Schutz der Bevölkerung vor Kriegseinwirkungen', ['Schutz der Bevölkerung vor Naturkatastrophen', 'Schutz militärischer Anlagen', 'Schutz der Staatsgrenzen'], 'Zivilschutz = Schutz der Bevölkerung vor Kriegseinwirkungen.', z + '7 · Warnung durch den Bund', r),
        mc('Was kennzeichnet den äußeren Notstand?', 'Gefahren, bedingt durch auswärtige militärische Aggression', ['Gefahren aus der eigenen staatlich-gesellschaftlichen Sphäre', 'Naturkatastrophen und schwere Unglücksfälle', 'Ausfall kritischer Infrastruktur'], 'Innerer Notstand: Gefahren aus der eigenen staatlich-gesellschaftlichen Sphäre. Äußerer Notstand: auswärtige militärische Aggression.', z + '1 · Notstandsrecht', r),
    ]
    l2 = [
        reihe('Bring die vier Phasen des Gesamtszenarios in die richtige Reihenfolge.', ['Hybride Bedrohungen', 'Krise, Aufmarsch an den NATO-Außengrenzen', 'Bündnisverteidigung, Übergang zur Landesverteidigung', 'Landesverteidigung'], 'Phase I bis IV sind Eskalationsstufen.', z + '3 · Phasen der Eskalation', r),
        mc('Wie lange dauert Phase I (Hybride Bedrohungen) im Gesamtszenario?', 'Mehrere Jahre in schwankender Intensität', ['Mehrere Monate', 'Mindestens ein Jahr', 'Wenige Wochen'], 'Phase I: mehrere Jahre in schwankender Intensität.', z + '3 · Phase I', r),
        mc('Was kennzeichnet Phase III?', 'Angriff auf die Grenzen des NATO-Bündnisgebietes; die Schwelle zum klassischen Krieg ist überschritten', ['Aktionen überwiegend im Verborgenen', 'Durchbruch bis auf das Gebiet der Bundesrepublik', 'Aufmarsch zur Abschreckung, erste Fluchtbewegungen'], 'Phase III: Bündnisverteidigung und Übergang zur Landesverteidigung.', z + '3 · Phase III', r),
        mc('Was geschieht in Phase IV (Landesverteidigung)?', 'Durchbruch der Verteidigungslinien der NATO bis auf das Gebiet der Bundesrepublik', ['Desinformationskampagnen und Cyberattacken', 'Militärischer Aufmarsch an den NATO-Außengrenzen', 'Punktuelle Angriffe, noch keine Kampfhandlungen im Land'], 'Phase IV: Kampfhandlungen auf deutschem Territorium.', z + '3 · Phase IV', r),
        multi('Was kennzeichnet hybride Bedrohungen?', ['Aggressor operiert im Verborgenen', 'Schwelle zum Krieg wird nicht überschritten', 'Ziel ist die Destabilisierung von Gesellschaften'], ['Offene Kriegserklärung'], 'Mehrdimensionales Vorgehen, Beeinflussung der öffentlichen Meinung.', z + '1 · Hybride Bedrohungen', r),
        multi('Welche Schutzgüter nennt das Kapitel bei den Kritischen Infrastrukturen?', ['Mensch', 'Umwelt', 'Volkswirtschaft', 'Immateriell'], ['Militär'], 'Schutzgüter: Mensch, Umwelt, Volkswirtschaft, Immateriell.', z + '3 · KRITIS', r),
    ]
    l3 = [
        mc('Warnstufe „Hoch“ (extreme Gefahr): Wann muss gesendet werden?', 'Sofort', ['Innerhalb von 10 Minuten', 'Innerhalb einer Stunde', 'Keine Sendeverpflichtung'], 'Hoch: sofort. Mittel: innerhalb von 10 min. Niedrig: keine Sendeverpflichtung.', z + '7 · Warnstufen', r),
        mc('Warnstufe „Mittel“ (Gefahr): Welche Sendeverpflichtung gilt?', 'Innerhalb von 10 Minuten', ['Sofort', 'Innerhalb von 30 Minuten', 'Keine Sendeverpflichtung'], 'Mittel: innerhalb von 10 min.', z + '7 · Warnstufen', r),
        mc('Über welchen Warnkanal läuft Cell Broadcast?', 'Mobilfunknetzbetreiber', ['WarnApps', 'Radio und Fernsehen', 'Warnmittelbetreiber'], 'Mobilfunknetzbetreiber: Cell Broadcast.', z + '7 · Warnkanäle', r),
        mc('Wer warnt die Bevölkerung im Zivilschutz?', 'Die Behörden der Länder im Auftrag des Bundes', ['Ausschließlich die Bundeswehr', 'Nur das Bundesministerium des Innern', 'Die Gemeinden in eigener Zuständigkeit'], 'Behörden der Länder warnen im Auftrag des Bundes; das BBK wirkt mit.', z + '7 · Warnung durch den Bund', r),
        reihe('Bring den Warnablauf in die richtige Reihenfolge.', ['Gefahr erkennen und bewerten', 'Entscheidung zu warnen', 'Lage übermitteln', 'Warnmeldung erstellen, übermitteln und verbreiten', 'Bevölkerung empfängt, interpretiert und reagiert'], 'Ereignis / Lage → Modulares Warnsystem → Bevölkerung.', z + '7 · Warnablauf', r),
        multi('Was gehört nach § 1 Abs. 2 ZSKG zum Zivilschutz?', ['Der Selbstschutz', 'Die Warnung der Bevölkerung', 'Der Schutzbau', 'Die Aufenthaltsregelung'], ['Die Bündnisverteidigung'], 'Außerdem: Katastrophenschutz nach § 11, Schutz der Gesundheit, Schutz von Kulturgut.', z + '7 · § 1 ZSKG', r),
    ]
    l4 = [
        reihe('Länderübergreifende Hilfe: Bring die ersten Schritte des Ersuchens in die richtige Reihenfolge.', ['Bedarfsanforderung durch die Einsatzleitung vor Ort', 'Freigabe und Weiterleitung durch die Innenbehörde des anfordernden Landes', 'Verteilung des Ersuchens durch das GMLZ', 'Prüfung des Ersuchens durch die Innenbehörden', 'Abgabe des Unterstützungsangebots an das GMLZ', 'Auswahl und Annahme des Angebots durch den Anforderer'], 'Danach: Information der anbietenden Innenbehörde, Information der Einheit, Alarmierung, Anreise, einsatzbereit im Einsatzraum.', z + '4 · Weg des Ersuchens', r),
        mc('Fähigkeitsmanagement: Wie lange muss eine Einheit nach dem Eintreffen unabhängig arbeiten können (Autarkie)?', 'Die ersten 36 Stunden', ['Die ersten 12 Stunden', 'Die ersten 72 Stunden', 'Die ersten 96 Stunden'], 'Autarkie: die ersten 36 Stunden nach Eintreffen.', z + '4 · Fähigkeitsmanagement', r),
        mc('Was ist im Fähigkeitsmanagement die Mindestleistung?', 'Eine messbare Größe, z. B. Förderung von Löschwasser über eine Strecke', ['Die Mindestzahl an Einsatzkräften', 'Die Mindestdauer des Einsatzes', 'Der Mindestbetrag der Kostenerstattung'], 'Fähigkeiten werden anhand ihrer Leistung beschrieben.', z + '4 · Fähigkeitsmanagement', r),
        multi('Welche Vorteile hat das Fähigkeitsmanagement?', ['Vergleichbarkeit', 'Effizienz', 'Planungssicherheit'], ['Wegfall der Obergrenzen'], 'Vergleichbarkeit, Effizienz, Planungssicherheit.', z + '4 · Fähigkeitsmanagement', r),
        reihe('Bring den Regelkreis im Bevölkerungsschutz in die richtige Reihenfolge.', ['Prävention', 'Vorbereitung', 'Ereignis', 'Bewältigung', 'Nachbereitung'], 'Nach der Nachbereitung beginnt wieder die Prävention.', z + '1 · Regelkreis im Bevölkerungsschutz', r),
        mc('Wer erstellt nach dem ZSKG die bundesweite Risikoanalyse für den Zivilschutz?', 'Der Bund im Zusammenwirken mit den Ländern', ['Jede Gemeinde für sich', 'Die NATO', 'Die Hilfsorganisationen'], '„Der Bund erstellt im Zusammenwirken mit den Ländern eine bundesweite Risikoanalyse für den Zivilschutz.“', z + '2 · ZSKG', r),
    ]
    l5 = [
        mc('Wer koordiniert die Zivile Alarmplanung (ZAP)?', 'Das BMI', ['Das BBK', 'Die Bundeswehr', 'Die Länder'], 'Der Bund erlässt die erforderlichen Gesetze, das BMI koordiniert die ZAP.', z + '8 · Zivile Alarmplanung', r),
        mc('Was bedeutet das Ressortprinzip in der Zivilen Alarmplanung?', 'Jedes Ministerium operiert im eigenen Zuständigkeitsbereich und löst Alarmmaßnahmen aus', ['Das BMI entscheidet für alle Ministerien', 'Die Länder handeln ohne den Bund', 'Die NATO gibt jede Einzelmaßnahme vor'], 'Jedes Ministerium kommuniziert mit seinen nachgeordneten Stellen.', z + '8 · Zivile Alarmplanung', r),
        reihe('Zusammenspiel aller Ebenen: Bring sie von oben nach unten in die richtige Reihenfolge.', ['NATO', 'Bund', 'Bundesländer', 'Landesbehörden und Kommunen'], 'NATO gibt Zielvorgaben, der Bund beschließt die Umsetzung, die Länder weisen an, Landesbehörden und Kommunen stellen die Leistung sicher.', z + '8 · Zusammenspiel aller Ebenen', r),
        mc('Bei wem liegt die Befehlsgebung im Militärischen Sicherheitsbereich (MSB)?', 'Immer beim Militär', ['Beim Einsatzleiter der Feuerwehr', 'Beim Hauptverwaltungsbeamten', 'Bei der Polizei'], 'Im MSB liegt die Befehlsgebung immer beim Militär.', z + '9 · Feuerwehren in der Zivilen Verteidigung', r),
        mc('Können zivile Feuerwehrkräfte gezwungen werden, in einem MSB zu arbeiten?', 'In Friedenszeiten nicht; im Spannungs- oder Verteidigungsfall ist es möglich', ['Ja, jederzeit', 'Nein, nie', 'Nur mit Zustimmung des Personalrats'], 'In Friedenszeiten nicht, im Spannungs- / Verteidigungsfall möglich.', z + '9 · Feuerwehren in der Zivilen Verteidigung', r),
        multi('Was gehört zum bedrohungsangepassten Verhalten?', ['Drohnenschutz (Beobachter und Scanner)', 'Sabotageschutz', 'Dislozierte gedeckte Aufstellung', 'Freie Fluchtwege (Fahrzeuge in Fluchtrichtung)'], ['Fahrzeuge dicht nebeneinander aufstellen'], 'Dazu: Verwendung von ferngeführten und robotischen Systemen.', z + '9 · Feuerwehren in der Zivilen Verteidigung', r),
        multi('Wonach können Heimatschutzregimenter ohne Verteidigungs- oder Spannungsfall eingesetzt werden?', ['Amtshilfe', 'Innerer Notstand', 'Terror – Unterstützung der Polizei'], ['Bündnisverteidigung Ausland'], 'Amtshilfe, innerer Notstand, Terror (Unterstützung der Polizei).', z + '6 · Heimatschutzregimenter', r),
    ]
    titel = ['Grundlagen', 'Gesamtszenario', 'Warnung der Bevölkerung', 'Hilfe und Fähigkeiten', 'Alarmplanung und Bundeswehr']
    text = ['Im Lagezentrum: Erst die Begriffe klären.', 'Die Lage eskaliert in Phasen.', 'Eine Warnung muss raus.', 'Kräfte aus anderen Ländern werden gebraucht.', 'Zivile Alarmplanung und Zusammenarbeit mit dem Militär.']
    write('lage', 'lagezentrum', [{'titel': titel[i], 'steckbrief': text[i], 'aufgaben': x} for i, x in enumerate([l1, l2, l3, l4, l5])])


# ---------------------------------------------------------------- Hilfeersuchen (Kapitel UCPM)
def ucpm():
    r = random.Random(15)
    u1, u2 = 'v-idf-u101 · ', 'v-idf-u102 · '
    ab = 'Abkürzungen'
    l1 = [
        mc('Wofür steht NCP?', 'National Contact Point', ['National Crisis Plan', 'NATO Command Post', 'National Civil Protection'], 'NCP = National Contact Point; in Deutschland das GMLZ.', u1 + ab, r),
        mc('Wofür steht LEMA?', 'Local Emergency Management Agency (örtliche Einsatzleitung)', ['Local Emergency Medical Assistance', 'Logistics and Equipment Management Agency', 'Lead Emergency Module Administration'], 'LEMA = örtliche Einsatzleitung.', u1 + ab, r),
        mc('Wofür steht OSOCC?', 'On-site Operations Coordination Centre', ['Operational Support Office for Civil Crises', 'Overseas Operations Command Centre', 'On-site Observation and Control Cell'], 'OSOCC = örtliche Leitstelle / Koordinierungsstelle.', u1 + ab, r),
        mc('Wofür steht RfA?', 'Request for Assistance', ['Report for Authorities', 'Rescue and Fire Alliance', 'Ready for Action'], 'RfA = Request for Assistance (Hilfeersuchen).', u1 + ab, r),
        mc('Wofür steht EUCPT?', 'EU Civil Protection Team', ['EU Crisis Planning Tool', 'European Union Central Protection Treaty', 'EU Coordination Point for Transport'], 'EUCPT = EU Civil Protection Team.', u1 + ab, r),
    ]
    weg = 'Weg des Hilfeersuchens'
    l2 = [
        reihe('Hilfeersuchen nach Deutschland: Bring die Schritte 1 bis 5 in die richtige Reihenfolge.', ['Request for Assistance vom betroffenen Staat an ERCC / CECIS', 'RfA an das GMLZ des BBK', 'Austausch und Entscheidung mit BMI und Bundesministerien', 'Steuerung der RfA und Informationsaustausch mit den Anbietern', 'Hilfsangebote (in kind, Module, Experten)'], 'Es folgen: Angebot Deutschlands an das ERCC, Akzeptanz oder Ablehnung, Entsendung, Ko-Finanzierung.', u1 + weg, r),
        reihe('Hilfeersuchen nach Deutschland: Bring die Schritte 6 bis 9 in die richtige Reihenfolge.', ['Angebot Deutschlands an das ERCC', 'Akzeptanz oder Ablehnung durch den betroffenen Staat', 'Entsendung und Hilfeleistung', 'Ko-Finanzierung'], 'Schritte 6 bis 9 des Schaubilds.', u1 + weg, r),
        mc('Welche Stelle ist in Deutschland die nationale Kontaktstelle (NCP)?', 'Das GMLZ', ['Das THW', 'Die Bundespolizei', 'Das Auswärtige Amt'], 'Kommunikationsknotenpunkt mit den nationalen Kontaktstellen (NCP), in Deutschland GMLZ.', u2 + 'ERCC', r),
        mc('Was ist das ERCC?', 'Der operative Kern des UCPM mit 24/7-Überwachung der globalen Lage', ['Ein Einsatzmodul für Waldbrände', 'Die Rechtsgrundlage des Unionsverfahrens', 'Ein Förderprogramm für Fahrzeuge'], 'Emergency Response Coordination Centre: koordiniert die EU-Katastrophenbewältigung.', u2 + 'ERCC', r),
    ]
    l3 = [
        mc('Auf welcher Rechtsgrundlage beruht das Unionsverfahren?', 'Art. 196 AEUV', ['Art. 35 GG', 'Art. 5 NATO-Vertrag', 'Art. 42 EUV'], 'Rechtsgrundlage: Art. 196 Vertrag über die Arbeitsweise der EU.', u2 + 'Rechtsgrundlagen und Akteure', r),
        mc('Welcher Beschluss regelt das Katastrophenschutzverfahren der Union?', 'Beschluss 1313/2013/EU', ['Beschluss 2020/1/EU', 'Verordnung 305/2011', 'Richtlinie 2012/18/EU'], 'Gesetzgebung: Beschluss 1313/2013/EU.', u2 + 'Rechtsgrundlagen und Akteure', r),
        mc('Wer trägt das Unionsverfahren?', 'Die EU-Kommission und 37 teilnehmende Staaten', ['Nur die 27 Mitgliedstaaten', 'Die NATO', 'Die Vereinten Nationen'], 'Getragen von EU-Kommission und 37 teilnehmenden Staaten.', u2 + 'Rechtsgrundlagen und Akteure', r),
        multi('Was trifft auf das Unionsverfahren zu?', ['Zwischenstaatliches Kooperationsinstrument', 'Von jedem Land weltweit aktivierbar', 'Für natürliche und menschengemachte Katastrophen'], ['Nur von EU-Mitgliedstaaten aktivierbar'], 'Für Vorsorge, Vorbereitung und Bewältigung.', u2 + 'Rechtsgrundlagen und Akteure', r),
    ]
    l4 = [
        reihe('Kapazitätenpyramide: Bring die Stufen von oben nach unten in die richtige Reihenfolge.', ['rescEU', 'European Civil Protection Pool (ECPP)', 'Zum internationalen Einsatz befähigte Kapazitäten', 'Nationale Kapazitäten im Katastrophenschutz'], 'rescEU (Art. 12), ECPP (Art. 11, zertifiziert), befähigte Kapazitäten (Art. 9), nationale Kapazitäten.', u2 + 'ECPP Kapazitätenpyramide', r),
        mc('Wie lange muss jedes Modul autark arbeiten können?', 'Mindestens 96 Stunden', ['Mindestens 24 Stunden', 'Mindestens 36 Stunden', 'Mindestens 72 Stunden'], 'Autarkie min. 96 h, dazu eigene Führungsstrukturen und definierte Komponenten.', u2 + 'ECPP Kapazitätenpyramide', r),
        mc('Was zeichnet Einheiten im ECPP aus?', 'Sie sind zertifiziert und erfüllen besondere Qualitätsstandards', ['Sie werden vollständig von der EU finanziert', 'Sie dienen nur dem Einsatz im eigenen Land', 'Sie brauchen keine eigene Führungsstruktur'], 'Die EU fördert Zertifizierung und trägt einen Großteil der Einsatz- und Transportkosten; die Einheiten werden national finanziert.', u2 + 'ECPP Kapazitätenpyramide', r),
        mc('Was ist „In-Kind Assistance“?', 'Hilfsgüter, die koordiniert in Schadensgebiete transportiert werden', ['Entsendung von Experten', 'Finanzielle Soforthilfe', 'Aufnahme von Evakuierten'], 'In-Kind Assistance = Hilfsgüter.', u2 + 'ECPP Kapazitätenpyramide', r),
    ]
    l5 = [
        multi('Was bedeutet Host Nation Support praktisch?', ['Einreiseabwicklung', 'Registrierung', 'Lageeinweisung', 'Zuweisung eines Einsatzraums'], ['Übernahme der Führung der fremden Module'], 'Dazu: Ansprechpartner, Unterstützung bei Transport, Unterbringung und Versorgung.', u2 + 'Host Nation Support', r),
        multi('Welche Aufgaben hat das EUCPT?', ['Unterstützung bei der Koordinierung der EU-Hilfe', 'Informationsmanagement und Lagebericht für das ERCC', 'Unterstützung und Beratung der nationalen Behörden'], ['Übernahme der örtlichen Einsatzleitung'], 'Außerdem Zusammenarbeit mit internationalen Akteuren und Gewährleistung der EU-Sichtbarkeit.', u1 + 'Aufgaben des EUCPT', r),
        mc('Was ist CECIS?', 'Eine web-basierte Kommunikations- und Koordinierungsplattform', ['Ein Satellitensystem zur Brandüberwachung', 'Ein Modul für Hochwasserpumpen', 'Die Leitstelle des THW'], 'Common Emergency Communication and Information System.', u2 + 'CECIS', r),
        mc('Welcher Copernicus-Dienst informiert über Waldbrände?', 'EFFIS', ['EFAS', 'EDO', 'CECIS'], 'EFFIS = European Forest Fire Information System; EFAS = Hochwasser, EDO = Dürre.', u2 + 'Copernicus', r),
        mc('Welcher Copernicus-Dienst warnt vor Hochwasser?', 'EFAS', ['EFFIS', 'EDO', 'ERCC'], 'EFAS = European Flood Awareness System.', u2 + 'Copernicus', r),
    ]
    titel = ['Abkürzungen', 'Der Weg des Ersuchens', 'Rechtsgrundlagen', 'Kapazitäten', 'Ankunft im Einsatzland']
    text = ['Auf dem Flugfeld wimmelt es von Abkürzungen.', 'Ein Staat bittet um Hilfe. Wie läuft das Ersuchen?', 'Worauf stützt sich das Verfahren?', 'Welche Einheiten stehen bereit?', 'Die Module landen. Was jetzt?']
    write('ucpm', 'flugfeld', [{'titel': titel[i], 'steckbrief': text[i], 'aufgaben': x} for i, x in enumerate([l1, l2, l3, l4, l5])])


# ---------------------------------------------------------------- IBK und FeuAK (Lernkarten), VAk (Quiz)
def karten(mission, welt, prefix, gruppen, titel, text, seed, extra=None):
    rnd = random.Random(seed)
    pool = from_cards(cards(prefix), rnd)
    level = []
    for i, g in enumerate(gruppen):
        a = [p for p in pool if any(k in p['_cat'] for k in g)]
        level.append(a)
    # Karten einer Gruppe auf die Level verteilen, die dieselbe Gruppe haben
    used, out = {}, []
    for i, g in enumerate(gruppen):
        key = '|'.join(g); start = used.get(key, 0)
        take = level[i][start:start + 6]; used[key] = start + 6
        assert len(take) >= 4, (mission, i, len(take))
        out.append({'titel': titel[i], 'steckbrief': text[i], 'aufgaben': take[:1] + (extra or {}).get(i, []) + take[1:]})
    write(mission, welt, out)


def vak():
    rnd = random.Random(18)
    pool = [(q['cat'], from_quiz(q, 'VAk-Quiz')) for q in VAK_Q if q['type'] in ('mc', 'tf')]
    by = {}
    for c, a in pool:
        by.setdefault(c, []).append(a)
    for v in by.values():
        rnd.shuffle(v)
    rest = by['Staatsorganisationsrecht'][7:14] + by['Allgemeines Verwaltungsrecht'][7:10] + by.get('Gefahrenabwehr / Feuerwehrrecht', [])
    rnd.shuffle(rest)
    level = [
        {'titel': 'Staatsorganisationsrecht', 'steckbrief': 'Im Hörsaal: Grundgesetz, Staatsorgane, Gesetzgebung.', 'aufgaben': by['Staatsorganisationsrecht'][:7]},
        {'titel': 'Allgemeines Verwaltungsrecht', 'steckbrief': 'Verwaltungsakt, Ermessen, Verfahren.', 'aufgaben': by['Allgemeines Verwaltungsrecht'][:7]},
        {'titel': 'Beamten- und Disziplinarrecht', 'steckbrief': 'Rechte und Pflichten im Dienst.', 'aufgaben': by['Beamten- und Disziplinarrecht'][:7]},
        {'titel': 'Vollstreckung und Rechtsschutz', 'steckbrief': 'Zwangsmittel, Widerspruch, Klage.', 'aufgaben': by['Verwaltungsvollstreckung / Rechtsschutz'][:7]},
        {'titel': 'Gemischte Klausur', 'steckbrief': 'Alles durcheinander, wie in der Prüfung.', 'aufgaben': rest[:8]},
    ]
    write('vak', 'hoersaal', level)


if __name__ == '__main__':
    begehung()
    stellungnahme()
    stab()
    presse()
    lage()
    ucpm()
    ta = ['Transaktionsanalyse']
    karten('ibk', 'wache', 'ibk', [ta, ta, ta, ta, ['Konflikte']],
           ['Ich-Zustände', 'Transaktionen', 'Grundbedürfnisse und Antreiber', 'Spiele und Skript', 'Konflikte'],
           ['Auf der Wache: Die Kolleginnen und Kollegen haben Fragen zur Transaktionsanalyse.', 'Was geht zwischen uns vor?', 'Was treibt Menschen an?', 'Muster erkennen.', 'Ein Konflikt auf der Wache.'], 16, X.ibk_extra())
    karten('feuak', 'planung', 'feuak', [['Haushalt'], ['PM'], ['QM'], ['VWL'], ['Vergabe', 'Bedarfsplanung']],
           ['Haushalt', 'Projektmanagement', 'Qualitätsmanagement', 'Volkswirtschaft', 'Vergabe und Bedarfsplanung'],
           ['Im Planungsbüro: Der Haushalt steht an.', 'Ein Projekt für die neue Wache.', 'Wie misst man gute Arbeit?', 'Wirtschaftliche Grundlagen.', 'Beschaffen und Bedarf planen.'], 17, X.feuak_extra())
    vak()
