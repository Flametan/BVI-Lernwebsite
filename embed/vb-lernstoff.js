/* Lernstoff VB-Prüfung Münster. Neues Thema = ein weiteres Objekt in VBL.themen.
   Seitenaufbau je Reiter: def (hervorgehobene Karte ganz oben), merke, dann „Auf einen Blick“, dann die Simulation (extra).
   Felder: id, kurz (Reitername), titel, quelle, extra (Simulation), farben (Kachelfarben), def [Überschrift, Text],
   merke, kacheln [[Titel, Satz]] (aufklappbar, Stichpunkte aus sort), blick [[Zahl, Einheit, Text]] (Zahlenkacheln „mind. …“),
   zusatz [[Titel, Text]] (weitere Textkachel unter den Zahlen), sort {kats, items:[[Text, Index der Kategorie]]} (Kacheln, Punkte mit Komma getrennt).
   **fett** im Text wird fett dargestellt. */
const VBL = { themen: [

{ id: 'ziele', kurz: 'Ziele', titel: 'Ziele des Vorbeugenden Brandschutzes', quelle: '§ 14 MBO (Aushang IdF, Dezernat B2)', extra: 'ziele',
  farben: ['#3f9a54','#e58a00','#2f78d1','#a8201a'],
  merke: 'E – A – R – L: Entstehung, Ausbreitung, Rettung, Löschen.',
  kacheln: [['Entstehung verhindern', 'Der Entstehung eines Brandes wird vorgebeugt.'], ['Ausbreitung verhindern', 'Der Ausbreitung von Feuer und Rauch wird vorgebeugt.'], ['Rettung ermöglichen', 'Bei einem Brand ist die Rettung von Menschen und Tieren möglich.'], ['Löschen ermöglichen', 'Bei einem Brand sind wirksame Löscharbeiten möglich.']],
  sort: { kats: ['Entstehung', 'Ausbreitung', 'Rettung', 'Löschen'], items: [
    ['Zündquellen vermeiden', 0], ['Entstehung eines Brandes verhindern', 0],
    ['Feuer begrenzen', 1], ['Rauch begrenzen', 1], ['Brandwände und Trennwände', 1],
    ['Menschen und Tiere retten können', 2], ['Rettungswege nutzbar halten', 2],
    ['Wirksam löschen können', 3], ['Zugang für die Feuerwehr', 3]
  ] }
},

{ id: 'aufenthaltsraum', kurz: 'Aufenthaltsraum', titel: 'Aufenthaltsraum', quelle: '§ 2 Abs. 7 MBO (Aushang IdF)', extra: 'raeume',
  farben: ['#2e8a4a','#e58a00','#b5352b'],
  def: ['Definition', 'Aufenthaltsräume sind Räume, die zum **nicht nur vorübergehenden Aufenthalt** von Menschen **bestimmt oder geeignet** sind.'],
  merke: 'Nicht nur vorübergehend: Wohnen, Schlafen, Arbeiten. Nebenfunktion, Flur und Treppe: nein.',
  sort: { kats: ['Aufenthaltsraum', 'Bedingt', 'Kein Aufenthaltsraum'], items: [
    ['Wohnraum', 0], ['Schlafraum', 0], ['Küche', 0], ['Büroraum', 0], ['Verkaufsraum', 0],
    ['Werk- oder Sporträume, wenn sie mehr als nur „selten und kurzzeitig“ genutzt werden', 1],
    ['Lagerraum', 2], ['Abstellraum', 2], ['Sanitärraum', 2], ['Flur', 2], ['Treppenraum', 2], ['andere Räume mit Nebenfunktionen', 2]
  ] }
},

{ id: 'nutzungseinheit', kurz: 'Nutzungseinheit', titel: 'Nutzungseinheit', quelle: 'OVG NRW, B. v. 07.07.1997, 10 A 3367/94 (Aushang IdF)', extra: 'nutzung',
  farben: ['#2f78d1','#7b6f5a'],
  def: ['Definition', 'Eine **räumliche Einheit**, die von einem einzelnen oder einer **Gruppe von Personen** für einen **gemeinsamen Zweck** so genutzt wird, dass eine **baulich nachhaltige Trennung** der einzelnen Räumlichkeiten **nicht erforderlich** ist.'],
  merke: 'Ein Zweck, eine Gruppe, keine bauliche Trennung nötig.',
  sort: { kats: ['Gehört zur Definition', 'Gehört nicht dazu'], items: [
    ['Räumliche Einheit', 0], ['Gemeinsamer Zweck', 0], ['Einzelne Person oder Gruppe', 0], ['Baulich nachhaltige Trennung nicht erforderlich', 0],
    ['Mindestgröße von 400 m²', 1], ['Eigener Eingang zwingend', 1], ['Brandwand zwischen den Räumen', 1], ['Nur ein Geschoss', 1]
  ] }
},

{ id: 'baustoffe', kurz: 'Baustoffe', titel: 'Baustoffe: nichtbrennbar bis normalentflammbar', quelle: 'MVV TB, Anforderungen an Baustoffe (DIN 4102-1)', extra: 'baustoffe',
  farben: ['#5a6b7d','#e8892b','#d9482b'],
  merke: 'Je höher die Anforderung, desto größer die Brandeinwirkung: nichtbrennbar (Vollbrand), schwerentflammbar (sich entwickelnder Brand), normalentflammbar (Entstehungsbrand).',
  sort: { kats: ['nichtbrennbar', 'schwerentflammbar', 'normalentflammbar'], items: [
    ['Schmelzpunkt mindestens 1000 °C', 0], ['kein Beitrag zum Brand auch bei Vollbrand', 0], ['Brandeinwirkung bis zum Vollbrand', 0], ['kein fortschreitendes Glimmen oder Schwelen', 0], ['kein brennendes Abtropfen oder Abfallen', 0],
    ['kein selbstständiges Weiterbrennen', 1], ['Entzündung erst nach bestimmter Zeit', 1], ['begrenzte Brandausbreitung auch nach Wegfall der Einwirkung', 1], ['Brandeinwirkung bis zum sich entwickelnden Brand', 1],
    ['Brandeinwirkung nur Entstehungsbrand', 2], ['begrenzter Beitrag zum Brand', 2], ['schwächste zulässige Klasse', 2], ['darunter: leichtentflammbar (§ 26 Abs. 1 Satz 2 MBO, Landesrecht)', 2]
  ] }
},

{ id: 'standsicherheit', kurz: 'Standsicherheit', titel: 'Standsicherheit im Brandfall', quelle: 'MVV TB, Standsicherheit im Brandfall (DIN 4102-2)', extra: 'etk',
  farben: ['#e9b949','#e8892b','#d9482b','#a8201a'],
  def: ['Grundsatz', 'Um die Standsicherheit nach § 12 MBO zu erfüllen, müssen **tragende Teile** auch unter Brandeinwirkung **über eine bestimmte Zeit standsicher** bleiben. Maßstab ist die **Einheits-Temperaturzeitkurve (ETK)** nach DIN 4102-2. Querschnittsänderungen, Durchdringungen und Verformungen sind zu berücksichtigen.'],
  merke: '30 – 60 – 90 – 120: feuerhemmend, hochfeuerhemmend, feuerbeständig, Feuerwiderstand 120 Minuten.',
  blick: [['30', 'Min.', 'feuerhemmend'], ['60', 'Min.', 'hochfeuerhemmend'], ['90', 'Min.', 'feuerbeständig'], ['120', 'Min.', 'Feuerwiderstand mit Raumabschluss']],
  zusatz: [['Besondere Fälle', 'Für bestimmte Bauteile gelten 90 bzw. 60 Minuten. Bauteile aus brennbaren Baustoffen mit nichtbrennbarem Dämmstoff in den Hohlräumen und nichtbrennbarer Brandschutzbekleidung: 60 bzw. 90 Minuten. Bei 120 Minuten bestehen tragende und aussteifende Teile aus nichtbrennbaren Baustoffen.']]
}

] };
