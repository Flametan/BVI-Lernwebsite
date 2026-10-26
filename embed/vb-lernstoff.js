/* Lernstoff VB-Prüfung Münster. Neues Thema = ein weiteres Objekt in VBL.themen.
   Felder: id, kurz (Reitername), kacheln [[Titel, Satz]] (aufklappbare Kacheln statt Textkarte; Merksatz steht dann oben, die ausführliche Erklärung entfällt), titel, quelle, merke, fakten [[Überschrift, Text]],
   sort {kats:[...], items:[[Text, Index der Kategorie]]} (Kacheln „Auf einen Blick“), farben [Kachelfarben], blick [[Zahl, Einheit, Text]] (optional, Zahlenkacheln statt Sortierkacheln), extra ('etk' = Regler zur Einheits-Temperaturzeitkurve).
   **fett** im Text wird fett dargestellt. */
const VBL = { themen: [

{ id: 'ziele', kurz: 'Ziele', titel: 'Ziele des Vorbeugenden Brandschutzes', quelle: '§ 14 MBO (Aushang IdF, Dezernat B2)', extra: 'ziele',
  farben: ['#3f9a54','#e58a00','#2f78d1','#a8201a'],
  kacheln: [['Entstehung verhindern', 'Der Entstehung eines Brandes wird vorgebeugt.'], ['Ausbreitung verhindern', 'Der Ausbreitung von Feuer und Rauch wird vorgebeugt.'], ['Rettung ermöglichen', 'Bei einem Brand ist die Rettung von Menschen und Tieren möglich.'], ['Löschen ermöglichen', 'Bei einem Brand sind wirksame Löscharbeiten möglich.']],
  merke: 'E – A – R – L: Entstehung, Ausbreitung, Rettung, Löschen.',
  fakten: [
    ['Brandentstehung', 'Der **Entstehung eines Brandes** wird vorgebeugt.'],
    ['Brandausbreitung', 'Der **Ausbreitung von Feuer und Rauch** wird vorgebeugt.'],
    ['Rettung', 'Bei einem Brand ist die **Rettung von Menschen und Tieren** möglich.'],
    ['Löscharbeiten', 'Bei einem Brand sind **wirksame Löscharbeiten** möglich.']
  ],
  sort: { kats: ['Entstehung', 'Ausbreitung', 'Rettung', 'Löschen'], items: [
    ['Zündquellen vermeiden', 0], ['Entstehung eines Brandes verhindern', 0],
    ['Feuer begrenzen', 1], ['Rauch begrenzen', 1], ['Brandwände und Trennwände', 1],
    ['Menschen und Tiere retten können', 2], ['Rettungswege nutzbar halten', 2],
    ['Wirksam löschen können', 3], ['Zugang für die Feuerwehr', 3]
  ] }
},

{ id: 'aufenthaltsraum', kurz: 'Aufenthaltsraum', titel: 'Aufenthaltsraum', quelle: '§ 2 Abs. 7 MBO (Aushang IdF)', extra: 'raeume',
  farben: ['#2e8a4a','#b5352b'],
  merke: 'Nicht nur vorübergehend: Wohnen, Schlafen, Arbeiten. Nebenfunktion, Flur und Treppe: nein.',
  fakten: [
    ['Definition', 'Aufenthaltsräume sind Räume, die zum **nicht nur vorübergehenden Aufenthalt** von Menschen **bestimmt oder geeignet** sind.'],
    ['Sind Aufenthaltsräume', 'Wohnräume, Schlafräume und Küchen sowie Büro- und Verkaufsräume.'],
    ['Bedingt', 'Werk- oder Sporträume gehören dazu, wenn sie mehr als nur **„selten und kurzzeitig“** genutzt werden.'],
    ['Keine Aufenthaltsräume', 'Lager-, Abstell-, Sanitär- und andere Räume mit **Nebenfunktionen** sowie **Flure und Treppenräume**.']
  ],
  sort: { kats: ['Aufenthaltsraum', 'Kein Aufenthaltsraum'], items: [
    ['Wohnraum', 0], ['Schlafraum', 0], ['Küche', 0], ['Büroraum', 0], ['Verkaufsraum', 0], ['Werkstatt, täglich genutzt', 0], ['Sporthalle, täglich genutzt', 0],
    ['Lagerraum', 1], ['Abstellraum', 1], ['Sanitärraum', 1], ['Flur', 1], ['Treppenraum', 1], ['Sportraum, selten und kurzzeitig genutzt', 1]
  ] }
},

{ id: 'nutzungseinheit', kurz: 'Nutzungseinheit', titel: 'Nutzungseinheit', quelle: 'OVG NRW, B. v. 07.07.1997, 10 A 3367/94 (Aushang IdF)', extra: 'nutzung',
  farben: ['#2f78d1','#7b6f5a'],
  merke: 'Ein Zweck, eine Gruppe, keine bauliche Trennung nötig.',
  fakten: [
    ['Definition', 'Eine **räumliche Einheit**, die von einem einzelnen oder einer **Gruppe von Personen** für einen **gemeinsamen Zweck** so genutzt wird, dass eine **baulich nachhaltige Trennung** der einzelnen Räumlichkeiten **nicht erforderlich** ist.'],
    ['Quelle', 'Nach der Rechtsprechung: OVG NRW, Beschluss vom 07.07.1997, Az. 10 A 3367/94.'],
    ['Beispiel Aushang', 'Eine Büroetage mit Open Space, Einzelbüros, Konferenzräumen, Küche und WC wird für einen gemeinsamen Zweck genutzt. Eine bauliche Trennung zwischen diesen Räumen ist nicht erforderlich.']
  ],
  sort: { kats: ['Gehört zur Definition', 'Gehört nicht dazu'], items: [
    ['Räumliche Einheit', 0], ['Gemeinsamer Zweck', 0], ['Einzelne Person oder Gruppe', 0], ['Baulich nachhaltige Trennung nicht erforderlich', 0],
    ['Mindestgröße von 400 m²', 1], ['Eigener Eingang zwingend', 1], ['Brandwand zwischen den Räumen', 1], ['Nur ein Geschoss', 1]
  ] }
},

{ id: 'baustoffe', kurz: 'Baustoffe', titel: 'Baustoffe: nichtbrennbar bis normalentflammbar', quelle: 'MVV TB, Anforderungen an Baustoffe (DIN 4102-1)', extra: 'baustoffe',
  farben: ['#5a6b7d','#e8892b','#d9482b'],
  merke: 'Je höher die Anforderung, desto größer die Brandeinwirkung: nichtbrennbar (Vollbrand), schwerentflammbar (sich entwickelnder Brand), normalentflammbar (Entstehungsbrand).',
  fakten: [
    ['Nichtbrennbar', 'Auch bei **fortentwickeltem oder vollentwickeltem Brand** **kein Beitrag zum Brand**. Keine oder nur begrenzt bleibende Entzündung, geringstmögliche Rauchentwicklung, kein fortschreitendes Glimmen oder Schwelen, **kein brennendes Abtropfen oder Abfallen**. Der Schmelzpunkt liegt bei mindestens **1000 °C**.'],
    ['Schwerentflammbar', 'Bei **Entstehungsbrand oder sich entwickelndem Brand** nur **begrenzter Beitrag** und **begrenzte Brandausbreitung** (auch nach Wegfall der Brandeinwirkung). Entzündung erst nach bestimmter Zeit, begrenzte Rauchgastemperatur und Energiefreisetzung, **kein selbstständiges Weiterbrennen**. Soll das Bauteil nicht brennend abtropfen oder abfallen, kommt ein zusätzlicher Nachweis dazu.'],
    ['Normalentflammbar', 'Bei **Entstehungsbrand** nur begrenzter Beitrag zum Brand, kein brennendes Abfallen oder Abtropfen soweit erforderlich. Soll das Bauteil nicht brennend abtropfen oder abfallen, kommt ein zusätzlicher Nachweis dazu.'],
    ['Leichtentflammbar', 'Entspricht ein Baustoff nicht mindestens „normalentflammbar“, ist er leichtentflammbar. Dann ist **§ 26 Abs. 1 Satz 2 MBO** einzuhalten (Landesrecht). Leichtentflammbare Baustoffe sind also nur unter besonderen Bedingungen zulässig.']
  ],
  sort: { kats: ['nichtbrennbar', 'schwerentflammbar', 'normalentflammbar'], items: [
    ['Schmelzpunkt mindestens 1000 °C', 0], ['Kein Beitrag zum Brand auch bei Vollbrand', 0], ['Brandeinwirkung: bis zum Vollbrand', 0], ['Kein fortschreitendes Glimmen oder Schwelen', 0],
    ['Kein selbstständiges Weiterbrennen', 1], ['Entzündung erst nach bestimmter Zeit', 1], ['Begrenzte Brandausbreitung auch nach Wegfall der Einwirkung', 1],
    ['Brandeinwirkung: nur Entstehungsbrand', 2], ['Begrenzter Beitrag zum Brand beim Entstehungsbrand', 2], ['Schwächste zulässige Klasse (darunter: leichtentflammbar)', 2]
  ] }
},

{ id: 'standsicherheit', kurz: 'Standsicherheit', titel: 'Standsicherheit im Brandfall', quelle: 'MVV TB, Standsicherheit im Brandfall (DIN 4102-2)', extra: 'etk',
  farben: ['#e9b949','#e8892b','#d9482b','#a8201a'],
  blick: [['30', 'Min.', 'feuerhemmend'], ['60', 'Min.', 'hochfeuerhemmend'], ['90', 'Min.', 'feuerbeständig'], ['120', 'Min.', 'Feuerwiderstand mit Raumabschluss']],
  merke: '30 – 60 – 90 – 120: feuerhemmend, hochfeuerhemmend, feuerbeständig, Feuerwiderstand 120 Minuten.',
  fakten: [
    ['Grundsatz', 'Um die Standsicherheit nach § 12 MBO zu erfüllen, müssen **tragende Teile** auch unter Brandeinwirkung **über eine bestimmte Zeit standsicher** bleiben. Querschnittsänderungen, Durchdringungen und Verformungen durch die Brandeinwirkung sind zu berücksichtigen.'],
    ['Maßstab', 'Brandeinwirkung nach der **Einheits-Temperaturzeitkurve (ETK)** nach **DIN 4102-2**.'],
    ['Feuerbeständig', 'Standsicherheit über mindestens **90 Minuten**.'],
    ['Hochfeuerhemmend', 'Standsicherheit über mindestens **60 Minuten**.'],
    ['Feuerhemmend', 'Standsicherheit über mindestens **30 Minuten**.'],
    ['Feuerwiderstand 120 Minuten', '**120 Minuten** für Bauteile mit Standsicherheit **und Raumabschluss**; tragende und aussteifende Teile aus nichtbrennbaren Baustoffen).'],
    ['90 und 60 Minuten für besondere Bauteile', 'Für bestimmte Bauteile gelten **90 Minuten** bzw. **60 Minuten** Standsicherheit.'],
    ['60 bzw. 90 Minuten bei Holzbauteilen mit Dämmung', '**60 bzw. 90 Minuten** für Bauteile aus brennbaren Baustoffen, deren Hohlräume mit nichtbrennbarem Dämmstoff gefüllt sind und die eine Brandschutzbekleidung aus nichtbrennbaren Baustoffen haben.']
  ],
  sort: { kats: ['30 Minuten', '60 Minuten', '90 Minuten', '120 Minuten'], items: [
    ['Feuerhemmend', 0], ['Hochfeuerhemmend', 1], ['Feuerbeständig', 2], ['Feuerwiderstand mit Raumabschluss', 3],
    ['Standsicherheit „über mindestens 90 Minuten“', 2], ['Standsicherheit „über mindestens 60 Minuten“', 1], ['Standsicherheit „über mindestens 30 Minuten“', 0], ['Standsicherheit „über mindestens 120 Minuten“', 3]
  ] }
}

] };
