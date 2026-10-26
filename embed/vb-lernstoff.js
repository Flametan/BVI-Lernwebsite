/* Lernstoff VB-Prüfung Münster. Neues Thema = ein weiteres Objekt in VBL.themen.
   Felder: id, titel, quelle, merke, fakten [[Überschrift, Text]], quiz [{q, o:[Antworten], a:Index, e:Erklärung}],
   sort {kats:[...], items:[[Text, Index der Kategorie]]}, extra ('etk' = Regler zur Einheits-Temperaturzeitkurve).
   **fett** im Text wird fett dargestellt. */
const VBL = { themen: [

{ id: 'ziele', titel: 'Ziele des Vorbeugenden Brandschutzes', quelle: '§ 14 MBO (Aushang IdF, Dezernat B2)', extra: 'ziele',
  merke: 'E – A – R – L: Entstehung, Ausbreitung, Rettung, Löschen.',
  fakten: [
    ['Brandentstehung', 'Der **Entstehung eines Brandes** wird vorgebeugt.'],
    ['Brandausbreitung', 'Der **Ausbreitung von Feuer und Rauch** wird vorgebeugt.'],
    ['Rettung', 'Bei einem Brand ist die **Rettung von Menschen und Tieren** möglich.'],
    ['Löscharbeiten', 'Bei einem Brand sind **wirksame Löscharbeiten** möglich.']
  ],
  quiz: [
    { q: 'In welcher Vorschrift der MBO stehen die Ziele des Brandschutzes?', o: ['§ 12 MBO', '§ 14 MBO', '§ 26 MBO', '§ 2 MBO'], a: 1, e: '§ 14 MBO regelt den Brandschutz. § 12 betrifft die Standsicherheit, § 26 die Baustoffe und Bauteile.' },
    { q: 'Was ist KEIN Ziel nach § 14 MBO?', o: ['Vorbeugung der Brandentstehung', 'Vorbeugung der Brandausbreitung', 'Rettung von Menschen und Tieren', 'Schutz jedes Sachwertes vor Brandschäden'], a: 3, e: 'Es geht um Entstehung, Ausbreitung, Rettung und wirksame Löscharbeiten, nicht um den Schutz aller Sachwerte.' },
    { q: 'Was soll sich nach dem Wortlaut des Paragrafen nicht ausbreiten?', o: ['Feuer und Rauch', 'Feuer und Löschwasser', 'Rauch und Wärme', 'Feuer und Explosionsgase'], a: 0, e: 'Brandausbreitung bedeutet die Ausbreitung von Feuer und Rauch.' },
    { q: 'Wahr oder falsch: Auch die Rettung von Tieren soll bei einem Brand möglich sein.', o: ['Wahr', 'Falsch'], a: 0, e: 'Die Rettung von Menschen und Tieren wird ausdrücklich genannt.' },
    { q: 'Welches Ziel dient unmittelbar der Arbeit der Feuerwehr an der Einsatzstelle?', o: ['Brandentstehung vorbeugen', 'Wirksame Löscharbeiten ermöglichen', 'Baustoffe prüfen', 'Nutzungseinheiten bilden'], a: 1, e: 'Das Gebäude muss so beschaffen sein, dass die Feuerwehr wirksam löschen kann.' }
  ],
  sort: { kats: ['Entstehung', 'Ausbreitung', 'Rettung', 'Löschen'], items: [
    ['Zündquellen vermeiden', 0], ['Entstehung eines Brandes verhindern', 0],
    ['Feuer begrenzen', 1], ['Rauch begrenzen', 1], ['Brandwände und Trennwände', 1],
    ['Menschen und Tiere retten können', 2], ['Rettungswege nutzbar halten', 2],
    ['Wirksam löschen können', 3], ['Zugang für die Feuerwehr', 3]
  ] }
},

{ id: 'aufenthaltsraum', titel: 'Aufenthaltsraum', quelle: '§ 2 Abs. 7 MBO (Aushang IdF)', extra: 'raeume',
  merke: 'Nicht nur vorübergehend: Wohnen, Schlafen, Arbeiten. Nebenfunktion, Flur und Treppe: nein.',
  fakten: [
    ['Definition', 'Aufenthaltsräume sind Räume, die zum **nicht nur vorübergehenden Aufenthalt** von Menschen **bestimmt oder geeignet** sind.'],
    ['Sind Aufenthaltsräume', 'Wohnräume, Schlafräume und Küchen sowie Büro- und Verkaufsräume.'],
    ['Bedingt', 'Werk- oder Sporträume gehören dazu, wenn sie mehr als nur **„selten und kurzzeitig“** genutzt werden.'],
    ['Keine Aufenthaltsräume', 'Lager-, Abstell-, Sanitär- und andere Räume mit **Nebenfunktionen** sowie **Flure und Treppenräume**.']
  ],
  quiz: [
    { q: 'Aufenthaltsräume sind Räume, die zum ... Aufenthalt von Menschen bestimmt oder geeignet sind.', o: ['nur vorübergehenden', 'nicht nur vorübergehenden', 'ständigen und dauernden', 'kurzzeitigen'], a: 1, e: 'Entscheidend ist der „nicht nur vorübergehende“ Aufenthalt.' },
    { q: 'Genügt es, dass ein Raum zum Aufenthalt „geeignet“ ist?', o: ['Nein, er muss dafür bestimmt sein', 'Ja, bestimmt ODER geeignet reicht', 'Nein, nur die Baugenehmigung zählt', 'Nur bei Wohnräumen'], a: 1, e: 'Die Definition nennt „bestimmt oder geeignet“. Eines von beiden reicht.' },
    { q: 'Welcher Raum ist ein Aufenthaltsraum?', o: ['Abstellraum', 'Flur', 'Büroraum', 'Sanitärraum'], a: 2, e: 'Büro- und Verkaufsräume sind Aufenthaltsräume. Die anderen sind Nebenräume bzw. Verkehrsflächen.' },
    { q: 'Ein Sportraum wird nur „selten und kurzzeitig“ genutzt. Aufenthaltsraum?', o: ['Ja, Sporträume sind immer Aufenthaltsräume', 'Nein, bei seltener und kurzzeitiger Nutzung nicht', 'Ja, wenn er groß genug ist', 'Nur mit Fenster'], a: 1, e: 'Werk- und Sporträume zählen nur dazu, wenn sie mehr als nur selten und kurzzeitig genutzt werden.' },
    { q: 'Treppenräume und Flure sind ...', o: ['Aufenthaltsräume', 'keine Aufenthaltsräume', 'Aufenthaltsräume ab 3 Metern Breite', 'immer Nutzungseinheiten'], a: 1, e: 'Flure und Treppenräume dienen dem Verkehr und sind keine Aufenthaltsräume.' },
    { q: 'Küchen zählen zu den Aufenthaltsräumen.', o: ['Wahr', 'Falsch'], a: 0, e: 'Wohnräume, Schlafräume und Küchen sind ausdrücklich genannt.' }
  ],
  sort: { kats: ['Aufenthaltsraum', 'Kein Aufenthaltsraum'], items: [
    ['Wohnraum', 0], ['Schlafraum', 0], ['Küche', 0], ['Büroraum', 0], ['Verkaufsraum', 0], ['Werkstatt, täglich genutzt', 0], ['Sporthalle, täglich genutzt', 0],
    ['Lagerraum', 1], ['Abstellraum', 1], ['Sanitärraum', 1], ['Flur', 1], ['Treppenraum', 1], ['Sportraum, selten und kurzzeitig genutzt', 1]
  ] }
},

{ id: 'nutzungseinheit', titel: 'Nutzungseinheit', quelle: 'OVG NRW, B. v. 07.07.1997, 10 A 3367/94 (Aushang IdF)', extra: 'nutzung',
  merke: 'Ein Zweck, eine Gruppe, keine bauliche Trennung nötig.',
  fakten: [
    ['Definition', 'Eine **räumliche Einheit**, die von einem einzelnen oder einer **Gruppe von Personen** für einen **gemeinsamen Zweck** so genutzt wird, dass eine **baulich nachhaltige Trennung** der einzelnen Räumlichkeiten **nicht erforderlich** ist.'],
    ['Quelle', 'Nach der Rechtsprechung: OVG NRW, Beschluss vom 07.07.1997, Az. 10 A 3367/94.'],
    ['Beispiel Aushang', 'Eine Büroetage mit Open Space, Einzelbüros, Konferenzräumen, Küche und WC wird für einen gemeinsamen Zweck genutzt. Eine bauliche Trennung zwischen diesen Räumen ist nicht erforderlich.']
  ],
  quiz: [
    { q: 'Wer hat die Definition der Nutzungseinheit geprägt?', o: ['Die MBO selbst', 'Die Rechtsprechung (OVG NRW)', 'Die DIN 4102', 'Die FwDV 100'], a: 1, e: 'Die Definition stammt aus der Rechtsprechung: OVG NRW, B. v. 07.07.1997, 10 A 3367/94.' },
    { q: 'Eine Nutzungseinheit ist eine ... Einheit.', o: ['wirtschaftliche', 'räumliche', 'organisatorische', 'rechtliche'], a: 1, e: 'Es ist eine räumliche Einheit.' },
    { q: 'Von wem kann eine Nutzungseinheit genutzt werden?', o: ['Nur von einer einzelnen Person', 'Von einem einzelnen oder einer Gruppe von Personen', 'Nur von einer Familie', 'Nur von Firmen'], a: 1, e: 'Einzelne Person oder Gruppe von Personen.' },
    { q: 'Wozu wird die Nutzungseinheit genutzt?', o: ['Zu verschiedenen Zwecken', 'Für einen gemeinsamen Zweck', 'Nur zum Wohnen', 'Nur zum Arbeiten'], a: 1, e: 'Entscheidend ist der gemeinsame Zweck.' },
    { q: 'Wahr oder falsch: Innerhalb einer Nutzungseinheit ist eine baulich nachhaltige Trennung der Räume erforderlich.', o: ['Wahr', 'Falsch'], a: 1, e: 'Gerade nicht: Es ist keine baulich nachhaltige Trennung erforderlich.' }
  ],
  sort: { kats: ['Gehört zur Definition', 'Gehört nicht dazu'], items: [
    ['Räumliche Einheit', 0], ['Gemeinsamer Zweck', 0], ['Einzelne Person oder Gruppe', 0], ['Baulich nachhaltige Trennung nicht erforderlich', 0],
    ['Mindestgröße von 400 m²', 1], ['Eigener Eingang zwingend', 1], ['Brandwand zwischen den Räumen', 1], ['Nur ein Geschoss', 1]
  ] }
},

{ id: 'baustoffe', titel: 'Baustoffe: nichtbrennbar bis normalentflammbar', quelle: 'MVV TB, Anforderungen an Baustoffe (DIN 4102-1)', extra: 'baustoffe',
  merke: 'Je höher die Anforderung, desto größer die Brandeinwirkung: nichtbrennbar (Vollbrand), schwerentflammbar (sich entwickelnder Brand), normalentflammbar (Entstehungsbrand).',
  fakten: [
    ['Nichtbrennbar', 'Auch bei **fortentwickeltem oder vollentwickeltem Brand** **kein Beitrag zum Brand**. Keine oder nur begrenzt bleibende Entzündung, geringstmögliche Rauchentwicklung, kein fortschreitendes Glimmen oder Schwelen, **kein brennendes Abtropfen oder Abfallen**. Der Schmelzpunkt liegt bei mindestens **1000 °C**.'],
    ['Schwerentflammbar', 'Bei **Entstehungsbrand oder sich entwickelndem Brand** nur **begrenzter Beitrag** und **begrenzte Brandausbreitung** (auch nach Wegfall der Brandeinwirkung). Entzündung erst nach bestimmter Zeit, begrenzte Rauchgastemperatur und Energiefreisetzung, **kein selbstständiges Weiterbrennen**. Soll das Bauteil nicht brennend abtropfen oder abfallen, kommt ein zusätzlicher Nachweis dazu.'],
    ['Normalentflammbar', 'Bei **Entstehungsbrand** nur begrenzter Beitrag zum Brand, kein brennendes Abfallen oder Abtropfen soweit erforderlich. Soll das Bauteil nicht brennend abtropfen oder abfallen, kommt ein zusätzlicher Nachweis dazu.'],
    ['Leichtentflammbar', 'Entspricht ein Baustoff nicht mindestens „normalentflammbar“, ist er leichtentflammbar. Dann ist **§ 26 Abs. 1 Satz 2 MBO** einzuhalten (Landesrecht). Leichtentflammbare Baustoffe sind also nur unter besonderen Bedingungen zulässig.']
  ],
  quiz: [
    { q: 'Welche Brandeinwirkung wird für „nichtbrennbar“ angenommen?', o: ['Entstehungsbrand', 'Sich entwickelnder Brand', 'Fortentwickelter bzw. vollentwickelter Brand', 'Schwelbrand'], a: 2, e: 'Nichtbrennbare Baustoffe leisten selbst beim fortentwickelten oder vollentwickelten Brand keinen Beitrag.' },
    { q: 'Welcher Schmelzpunkt wird bei nichtbrennbaren Baustoffen verlangt?', o: ['mindestens 500 °C', 'mindestens 800 °C', 'mindestens 1000 °C', 'mindestens 1500 °C'], a: 2, e: 'Mindestens 1000 °C nach DIN 4102-17.' },
    { q: 'Welcher Baustoff darf nach dem Wegfall der Brandeinwirkung nicht selbstständig weiterbrennen und nur begrenzt zur Brandausbreitung beitragen?', o: ['Nichtbrennbar', 'Schwerentflammbar', 'Normalentflammbar', 'Leichtentflammbar'], a: 1, e: 'Das ist die Anforderung an schwerentflammbare Baustoffe: begrenzte Brandausbreitung, kein selbstständiges Weiterbrennen.' },
    { q: 'Welche Brandeinwirkung gilt für „normalentflammbar“?', o: ['Vollbrand', 'Sich entwickelnder Brand', 'Entstehungsbrand', 'Raumbrand mit Flashover'], a: 2, e: 'Bei normalentflammbar wird ein Entstehungsbrand angenommen.' },
    { q: 'Wann ist § 26 Abs. 1 Satz 2 MBO einzuhalten?', o: ['Bei nichtbrennbaren Baustoffen', 'Wenn ein Baustoff nicht mindestens normalentflammbar (leichtentflammbar) ist', 'Bei jedem Dämmstoff', 'Nur bei Hochhäusern'], a: 1, e: 'Für leichtentflammbare Baustoffe gilt die Vorgabe aus § 26 Abs. 1 Satz 2 MBO.' },
    { q: 'Welches Kriterium gehört NUR zu nichtbrennbar?', o: ['Schmelzpunkt mindestens 1000 °C', 'Entstehungsbrand als Brandeinwirkung', 'Begrenzter Beitrag zum Brand', 'Entzündung erst nach bestimmter Zeit'], a: 0, e: 'Der Schmelzpunkt von mindestens 1000 °C nach DIN 4102-17 ist ein Kriterium der Nichtbrennbarkeit.' }
  ],
  sort: { kats: ['nichtbrennbar', 'schwerentflammbar', 'normalentflammbar'], items: [
    ['Schmelzpunkt mindestens 1000 °C', 0], ['Kein Beitrag zum Brand auch bei Vollbrand', 0], ['Brandeinwirkung: bis zum Vollbrand', 0], ['Kein fortschreitendes Glimmen oder Schwelen', 0],
    ['Kein selbstständiges Weiterbrennen', 1], ['Entzündung erst nach bestimmter Zeit', 1], ['Begrenzte Brandausbreitung auch nach Wegfall der Einwirkung', 1],
    ['Brandeinwirkung: nur Entstehungsbrand', 2], ['Begrenzter Beitrag zum Brand beim Entstehungsbrand', 2], ['Schwächste zulässige Klasse (darunter: leichtentflammbar)', 2]
  ] }
},

{ id: 'standsicherheit', titel: 'Standsicherheit im Brandfall', quelle: 'MVV TB, Standsicherheit im Brandfall (DIN 4102-2)', extra: 'etk',
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
  quiz: [
    { q: 'Wie lange muss ein feuerbeständiges Bauteil standsicher bleiben?', o: ['30 Minuten', '60 Minuten', '90 Minuten', '120 Minuten'], a: 2, e: 'Feuerbeständig: mindestens 90 Minuten.' },
    { q: 'Wie lange bei hochfeuerhemmend?', o: ['30 Minuten', '60 Minuten', '90 Minuten', '120 Minuten'], a: 1, e: 'Hochfeuerhemmend: mindestens 60 Minuten.' },
    { q: 'Wie lange bei feuerhemmend?', o: ['15 Minuten', '30 Minuten', '45 Minuten', '60 Minuten'], a: 1, e: 'Feuerhemmend: mindestens 30 Minuten.' },
    { q: 'Nach welcher Kurve wird die Brandeinwirkung angesetzt?', o: ['Parametrische Brandkurve', 'Einheits-Temperaturzeitkurve (ETK)', 'Hydrokarbon-Kurve', 'Schwelbrandkurve'], a: 1, e: 'Die Einheits-Temperaturzeitkurve (ETK) nach DIN 4102-2 ist der Maßstab.' },
    { q: 'Was wird bei einem Bauteil mit 120 Minuten Feuerwiderstand zusätzlich zur Standsicherheit verlangt?', o: ['Wärmedämmung', 'Raumabschluss', 'Schalldämmung', 'Rauchdichtheit'], a: 1, e: 'Standsicherheit im Brandfall und Raumabschluss über 120 Minuten; tragende und aussteifende Bauteile bestehen aus nichtbrennbaren Baustoffen.' },
    { q: 'Woraus müssen tragende und aussteifende Bauteile mit 120 Minuten Feuerwiderstand bestehen?', o: ['Aus brennbaren Baustoffen mit Dämmung', 'Aus nichtbrennbaren Baustoffen', 'Aus normalentflammbaren Baustoffen', 'Aus Holz'], a: 1, e: 'Sie müssen aus nichtbrennbaren Baustoffen ausgeführt werden. Das gilt auch für raumabschließende Bauteile.' },
    { q: 'Wahr oder falsch: Querschnittsänderungen und Verformungen durch die Brandeinwirkung müssen berücksichtigt werden, soweit sie Einfluss auf die Standsicherheit haben.', o: ['Wahr', 'Falsch'], a: 0, e: 'Ja, das gehört zum Grundsatz der Standsicherheit im Brandfall.' },
    { q: 'Auf welche Vorschrift der MBO stützt sich die Anforderung an die Standsicherheit im Brandfall?', o: ['§ 12 MBO', '§ 14 MBO', '§ 17 MBO', '§ 2 MBO'], a: 0, e: '§ 12 MBO, Standsicherheit.' }
  ],
  sort: { kats: ['30 Minuten', '60 Minuten', '90 Minuten', '120 Minuten'], items: [
    ['Feuerhemmend', 0], ['Hochfeuerhemmend', 1], ['Feuerbeständig', 2], ['Feuerwiderstand mit Raumabschluss', 3],
    ['Standsicherheit „über mindestens 90 Minuten“', 2], ['Standsicherheit „über mindestens 60 Minuten“', 1], ['Standsicherheit „über mindestens 30 Minuten“', 0], ['Standsicherheit „über mindestens 120 Minuten“', 3]
  ] }
}

] };
