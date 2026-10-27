/* ===== Fachdaten (nur Inhalte der Lernseite) ===== */
const h=React.createElement;
const GOALS={
  E:{n:'Entstehung vorbeugen',k:'Entstehung',c:'#ff7a4d',hex:0xff7a4d},
  A:{n:'Ausbreitung vorbeugen',k:'Ausbreitung',c:'#ffd23f',hex:0xffd23f},
  R:{n:'Rettung ermöglichen',k:'Rettung',c:'#3ddc84',hex:0x3ddc84},
  L:{n:'Wirksame Löschmaßnahmen ermöglichen',k:'Löschen',c:'#4cc3ff',hex:0x4cc3ff}
};
const VSLIST=['MHHR','MVKVO','MVStättVO','MBeVO','MKhVO','MIndBauRL','M-GarVO'];
/* allgemeine Hotspots (Abschnitt 04/05, Grundsatz Standardgebäude) */
const G_RW={id:'rw',t:'Zwei Rettungswege',v:'Je Nutzungseinheit und Geschoss mind. zwei voneinander unabhängige RW (1. RW baulich, 2. RW i. d. R. Anleiterstelle)',w:'Fällt ein Weg aus, bleibt der andere nutzbar.',g:'R',feat:['rw']};
const G_BA={id:'ba',t:'Brandabschnitte',v:'Standard: i. d. R. 40 m × 40 m = 1.600 m²',w:'Das Feuer bleibt in seinem Abschnitt.',g:'A',feat:['ba']};
const G_AUF={id:'auf',t:'Zufahrt und Aufstellfläche',v:'Bei OKFF > 7 m: Zu-/Durchfahrten für Hubrettungsfahrzeuge · Aufstellflächen ausreichend befestigt, tragfähig, dauerhaft freigehalten',w:'Die Feuerwehr kommt ans Gebäude und kann Menschen retten.',g:'L',feat:['auf']};
const BUILDINGS=[
 {id:'hoch',name:'Hochhaus',vs:'MHHR',nr:'1',tat:'OKFF oberste NE > 22 m',col:'#4f86f0',hex:0x4f86f0,
  intro:'Sonderbau Nr. 1: Muster-Hochhaus-Richtlinie, Anwendung ab OKFF der obersten Nutzungseinheit > 22 m.',
  hot:[
   {id:'tat',t:'Hochhaus-Schwelle',v:'OKFF oberste NE > 22 m → MHHR anwendbar',w:'Ab dieser Höhe gilt die Muster-Hochhaus-Richtlinie.',g:null,feat:['tat']},
   {id:'rw',t:'Zwei Rettungswege',v:'2 voneinander unabhängige bauliche RW je NE und Geschoss · max. 35 m bis Treppenraum/Ausgang · Stichflure max. 15 m',w:'Fällt ein Weg aus, bleibt der andere nutzbar.',g:'R',feat:['rw']},
   {id:'str',t:'Sicherheitstreppenraum',v:'h ≤ 60 m: 1 Sicherheitstreppenraum statt 2 NTR möglich · h > 60 m: alle NTR als STR · Wände F90 (h ≤ 60 m) bzw. F120 (h > 60 m)',w:'Ein geschützter Treppenraum, den man auch bei Feuer im Geschoss erreicht.',g:'R',feat:['str']},
   {id:'fa',t:'Feuerwehraufzug',v:'Haltestelle in jedem Geschoss · Vorraum mind. 6 m² · Druckbelüftungsanlage',w:'Die Feuerwehr gelangt schnell und geschützt in die Geschosse.',g:'L',feat:['fa']},
   {id:'steig',t:'Nasse Steigleitung',v:'Wandhydranten Typ F · gleichzeitig 3 × 200 l/min bei 4,5 bar',w:'Löschwasser steht in jedem Geschoss sofort bereit.',g:'L',feat:['steig']},
   {id:'druck',t:'Druckbelüftungsanlage',v:'STR-Vorraum: 2,0 m/s · FA-Vorraum: 0,75 m/s',w:'Überdruck hält Rauch aus Treppenraum und Aufzugsvorraum fern.',g:'A',feat:['druck']},
   {id:'bma',t:'Brandmeldeanlage (BMA)',v:'Automatische Melder + Brandfallsteuerung der Aufzüge',w:'Der Brand wird früh erkannt, die Menschen werden gewarnt.',g:'R',feat:['bma']},
   {id:'ela',t:'Lautsprecheranlage (ELA)',v:'Elektrische Lautsprecheranlage: Pflicht',w:'Durchsagen führen die Menschen gezielt ins Freie.',g:'R',feat:['ela']},
   {id:'spr',t:'Automatische Feuerlöschanlage',v:'Ausnahmen nur bei NE ≤ 200 m² + F90-Trennwänden',w:'Ein Brand wird früh gelöscht oder klein gehalten.',g:'A',feat:['spr']}
  ],
  gk:'GK 5',gkWhy:'OKFF > 13 m: sonstige Gebäude inkl. unterirdische → GK 5. (Über 22 m kommt zusätzlich die MHHR.)',
  fact:'Bürohochhaus, OKFF der obersten Nutzungseinheit > 22 m.'},
 {id:'verk',name:'Verkaufsstätte',vs:'MVKVO',nr:'4',tat:'A > 800 m² (ab 2.000 m²: MVKVO)',col:'#ef6a6a',hex:0xef6a6a,
  intro:'Sonderbau Nr. 4: Verkaufsstätten ab A > 800 m². Die MVKVO gilt für Verkaufsräume und Ladenstraßen > 2.000 m².',
  hot:[
   {id:'tat',t:'Verkaufsstätten-Schwelle',v:'A > 800 m² (ab 2.000 m²: MVKVO)',w:'Bei großen Verkaufsflächen drohen viele Menschen und viel Brandlast.',g:null,feat:['tat']},
   {id:'laden',t:'Ladenstraße',v:'Ladenstraßen mind. 5,00 m breit · Hauptgänge mind. 2,00 m',w:'Breite Wege lassen viele Menschen gleichzeitig flüchten.',g:'R',feat:['laden']},
   {id:'rw',t:'Ausgänge und Weglängen',v:'Mind. 2 unabhängige RW · max. 25 m (Luftlinie) bis Ausgang/NTR · Ausgänge mind. 2,00 m (Ausnahme ≤ 500 m²: 1,00 m)',w:'Kurze, breite Wege bis ins Freie.',g:'R',feat:['rw']},
   {id:'spr',t:'Sprinkleranlage',v:'Pflicht (Ausnahmen bei erdgeschossigen Verkaufsstätten ≤ 3.000 m² ohne Sprinkler)',w:'Löscht früh und erlaubt größere Brandabschnitte.',g:'A',feat:['spr']},
   {id:'ba',t:'Brandabschnitte',v:'Erdgeschoss: ≤ 3.000 m² ohne / ≤ 10.000 m² mit Sprinkler · sonstige: ≤ 1.500 m² / ≤ 5.000 m² je Geschoss',w:'Begrenzt, wie weit sich ein Feuer ausbreiten kann.',g:'A',feat:['ba']},
   {id:'rwa',t:'Rauch- und Wärmeabzug',v:'Verkaufsräume > 50 m² · Lagerräume > 200 m² · Ladenstraßen',w:'Rauch und Hitze ziehen nach oben ab.',g:'A',feat:['rwa']},
   {id:'hyd',t:'Wandhydranten Typ F',v:'In ausreichender Anzahl',w:'Löschwasser steht sofort zur Verfügung.',g:'L',feat:['hyd']},
   {id:'bma',t:'BMA mit Aufschaltung',v:'Automatische Melder, aufgeschaltet zur Feuerwehr',w:'Die Feuerwehr wird automatisch alarmiert.',g:'L',feat:['bma']}
  ],
  gk:'GK 3',gkWhy:'≤ 7 m und sonstiges Gebäude (nicht GK 1/2) → GK 3.',
  fact:'Supermarkt mit Ladenstraße, Verkaufsfläche A > 800 m², OKFF ≤ 7 m, sonstiges Gebäude.'},
 {id:'vers',name:'Versammlungsstätte',vs:'MVStättVO',nr:'6',tat:'n > 100 Personen (ab 200: MVStättVO)',col:'#a06cf0',hex:0xa06cf0,
  intro:'Sonderbau Nr. 6: Versammlungsstätten mit n > 100 Personen. Die Lernseite nennt hier nur den Tatbestand; die Details regelt die MVStättVO.',
  hot:[
   {id:'tat',t:'Versammlungsstätten-Schwelle',v:'n > 100 Personen (ab 200: MVStättVO)',w:'Viele Menschen auf engem Raum brauchen besondere Regeln.',g:null,feat:['tat']},
   Object.assign({},G_RW,{t:'Zwei Rettungswege (Grundsatz)'}),
   Object.assign({},G_BA),
   Object.assign({},G_AUF)
  ],
  gk:'GK 3',gkWhy:'≤ 7 m und sonstiges Gebäude (nicht GK 1/2) → GK 3.',
  fact:'Stadthalle für n > 100 Personen, OKFF ≤ 7 m, sonstiges Gebäude.'},
 {id:'beh',name:'Beherbergungsstätte',vs:'MBeVO',nr:'9',tat:'n > 12 Gastbetten',col:'#2db8a0',hex:0x2db8a0,
  intro:'Sonderbau Nr. 9: Beherbergungsstätten ab mehr als 12 Gastbetten (MBeVO).',
  hot:[
   {id:'tat',t:'Beherbergungs-Schwelle',v:'n > 12 Gastbetten',w:'Schlafende Gäste kennen das Haus nicht und merken Brände spät.',g:null,feat:['tat']},
   {id:'rw2',t:'Zwei Rettungswege',v:'1. RW: notwendige Treppe (baulich) · 2. RW: zweite notwendige Treppe/Außentreppe – bei ≤ 60 Gastbetten ges. und ≤ 30/Geschoss auch durch Anleiterung (Feuerwehr) · Stichflure max. 15 m',w:'Jedes Zimmer hat zwei unabhängige Wege nach draußen.',g:'R',feat:['rw2']},
   {id:'rs',t:'Rauchschutztüren (RS)',v:'Zu Beherbergungsräumen, Gasträumen und NTR: RS · nicht versperrt, von innen leicht zu öffnen',w:'Rauch dringt nicht in den Flur, Türen lassen sich im Notfall öffnen.',g:'A',feat:['rs']},
   {id:'bma',t:'Brandmeldeanlage (BMA)',v:'Ab > 60 Gastbetten (Rauchmelder in NF, HDM)',w:'Der Brand wird früh erkannt.',g:'R',feat:['bma']},
   {id:'alarm',t:'Alarmierungseinrichtung',v:'Akustisch + optisch in barrierefreien Räumen',w:'Auch Gäste mit Einschränkungen werden gewarnt.',g:'R',feat:['alarm']},
   {id:'sb',t:'Sicherheitsbeleuchtung',v:'In NF, NTR und Sicherheitszeichen',w:'Die Wege bleiben auch bei Stromausfall sichtbar.',g:'R',feat:['sb']},
   {id:'plan',t:'Rettungswegplan im Zimmer',v:'In jedem Beherbergungszimmer · Hinweise mehrsprachig',w:'Ortsfremde Gäste finden den Weg nach draußen.',g:'R',feat:['plan']},
   {id:'bso',t:'Brandschutzordnung',v:'Ab > 60 Gastbetten: Brandschutzordnung + Feuerwehrpläne',w:'Verhalten und Pläne beugen Bränden und Fehlern vor.',g:'E',feat:['bso']}
  ],
  gk:'GK 4',gkWhy:'≤ 13 m und sonstiges Gebäude → GK 4.',
  fact:'Hotel mit mehr als 12 Gastbetten, OKFF ≤ 13 m, sonstiges Gebäude.'},
 {id:'ind',name:'Industriebau',vs:'MIndBauRL',nr:'–',tat:'Produktion / Lagerung',col:'#dd9b2b',hex:0xdd9b2b,
  intro:'Industriebauten (Produktion, Behandlung, Verwertung, Lagerung) regelt die MIndBauRL.',
  hot:[
   {id:'tat',t:'Industriebau-Tatbestand',v:'Produktion, Behandlung, Verwertung, Lagerung',w:'Die Nutzung entscheidet, nicht die Größe allein.',g:null,feat:['tat']},
   {id:'ba',t:'Brandabschnitt und BBA',v:'Brandabschnitt: Bereich zwischen Außenwänden und/oder Brandwänden über alle Geschosse · Brandbekämpfungsabschnitt (BBA): Unterbereich eines Brandabschnittes',w:'Das Feuer bleibt in seinem Bereich.',g:'A',feat:['ba']},
   {id:'k',t:'Sicherheitskategorien K1–K4',v:'K 1: keine besonderen Maßnahmen · K 2: BMA · K 3.4: BMA + Werkfeuerwehr in Staffelstärke · K 4: BMA + automatische Feuerlöschanlage',w:'Die Größe der Abschnitte hängt von der Kategorie ab.',g:'A',feat:['k']},
   {id:'rw',t:'Zwei Rettungswege',v:'Ab Grundfläche > 1.600 m² oder Ebenen > 200 m²: mind. 2 entgegengesetzte bauliche RW',w:'Die Wege führen in entgegengesetzte Richtungen.',g:'R',feat:['rw']},
   {id:'rwl',t:'Rettungsweglängen',v:'Ohne Alarmierungsanlage: 35 m (Raumhöhe 5 m) / 50 m (10 m) · mit Alarmierungsanlage: 50 m / 70 m',w:'Kurze Wege bis ins Freie oder in einen sicheren Bereich.',g:'R',feat:['rwl']},
   {id:'gang',t:'Hauptgang',v:'Bis Hauptgang max. 15 m von jeder Stelle · Hauptgangbreite mind. 2,00 m',w:'Der breite Hauptgang sammelt die Flüchtenden.',g:'R',feat:['gang']},
   {id:'umf',t:'Umfahrung',v:'Ab Grundfläche > 5.000 m²: Umfahrung für Feuerwehrfahrzeuge erforderlich',w:'Die Feuerwehr erreicht jede Gebäudeseite.',g:'L',feat:['umf']}
  ],
  gk:'GK 3',gkWhy:'≤ 7 m und sonstiges Gebäude (nicht GK 1/2) → GK 3.',
  fact:'Produktions- und Lagerhalle (Industriebau), OKFF ≤ 7 m, sonstiges Gebäude.'},
 {id:'gar',name:'Garage',vs:'M-GarVO',nr:'–',tat:'Stellplätze > 100 m²',col:'#8cc63f',hex:0x8cc63f,
  intro:'Garagen mit Stellplätzen > 100 m² regelt die M-GarVO. Wechsle den Garagentyp und sieh, was jeweils dazukommt.',
  hot:[
   {id:'tat',t:'Garagen-Tatbestand',v:'Stellplätze > 100 m² · Kleingarage bis 100 m² (geringe Anforderungen) · Mittelgarage 100–1.000 m² · Großgarage > 1.000 m² (erhöhte Anforderungen)',w:'Mit der Nutzfläche wachsen die Anforderungen.',g:null,feat:['tat'],typ:'KMG'},
   {id:'rw',t:'Rettungswege',v:'Mittel- und Großgaragen: mind. 2 unabhängige bauliche RW je Geschoss · RW-Länge: offene Garagen 50 m, geschlossene 35 m · Ausnahme: oberirdische Garagen mit Ausgang ≤ 10 m → 1 RW',w:'Auch aus den oberen Decks führt ein zweiter Weg hinaus.',g:'R',feat:['rw'],typ:'MG',need:'Mittelgarage'},
   {id:'abl',t:'Maschinelle Abluftanlage',v:'Pflicht in geschlossenen Mittel- und Großgaragen',w:'Luft und Rauch werden maschinell abgeführt.',g:'A',feat:['abl'],typ:'MG',need:'Mittelgarage'},
   {id:'entr',t:'Entrauchung',v:'Großgaragen: natürliche oder maschinelle Entrauchung (mind. 10-facher Luftwechsel/h)',w:'Rauch zieht ab, bevor er die Wege füllt.',g:'A',feat:['entr'],typ:'G',need:'Großgarage'},
   {id:'bma',t:'Brandmeldeanlage (BMA)',v:'Ab geschlossener Großgarage > 2.500 m²',w:'Der Brand wird früh erkannt.',g:'R',feat:['bma'],typ:'G',need:'Großgarage'},
   {id:'troc',t:'Trockene Löschwasserleitung',v:'Bei Stellplätzen > 4 m unter oder > 13 m über GOF',w:'Die Feuerwehr speist Löschwasser selbst ein.',g:'L',feat:['troc'],typ:'MG'},
   {id:'funk',t:'Objektfunkanlage',v:'In nichtautomatischen Großgaragen (Fußboden < −4 m oder > 22 m)',w:'Funk funktioniert auch tief im Gebäude.',g:'L',feat:['funk'],typ:'G',need:'Großgarage'},
   {id:'ba',t:'Brandabschnitte',v:'Oberirdisch geschlossene Garagen: max. 5.000 m² Nutzfläche · sonstige geschlossene Garagen: max. 2.500 m² (Verdoppelung mit Sprinkler)',w:'Das Feuer bleibt in seinem Abschnitt.',g:'A',feat:['ba'],typ:'MG',need:'Mittelgarage'}
  ],
  gk:'GK 3',gkWhy:'Hier vereinfachte Annahme: ≤ 7 m und sonstiges Gebäude → GK 3.',
  fact:'Garage mit Stellplätzen > 100 m², OKFF ≤ 7 m, sonstiges Gebäude (Annahme der Aufgabe).'},
 {id:'kra',name:'Krankenhaus',vs:'MKhVO',nr:'10',tat:'Nutzung (Krankenhaus)',col:'#ff7a9a',hex:0xff7a9a,
  intro:'Sonderbau Nr. 10: Krankenhäuser – der Tatbestand ist allein die Nutzung (MKhVO). Die Lernseite nennt keine weiteren Einzelwerte.',
  hot:[
   {id:'tat',t:'Krankenhaus-Tatbestand',v:'Nutzung als Krankenhaus → MKhVO',w:'Patienten können sich nicht selbst retten.',g:null,feat:['tat']},
   Object.assign({},G_RW,{t:'Zwei Rettungswege (Grundsatz)'}),
   Object.assign({},G_BA),
   Object.assign({},G_AUF)
  ],
  gk:'GK 4',gkWhy:'≤ 13 m und sonstiges Gebäude → GK 4.',
  fact:'Krankenhaus, OKFF ≤ 13 m, sonstiges Gebäude.'},
 {id:'woh',name:'Wohnhaus',vs:null,nr:'–',tat:'Kein Sonderbau (Standardgebäude)',col:'#e0b48a',hex:0xe0b48a,
  intro:'Zum Vergleich: ein Standardgebäude. Es ist kein Sonderbau, es gelten die allgemeinen Anforderungen der Abschnitte 04 und 05.',
  hot:[
   {id:'tat',t:'Gebäudeklasse GK 1a',v:'OKFF ≤ 7 m · freistehend · max. 2 NE · ANE ≤ 400 m²',w:'Ein Einfamilienhaus ist ein Standardgebäude, kein Sonderbau.',g:null,feat:['tat']},
   {id:'rw',t:'Zwei Rettungswege',v:'Je Nutzungseinheit und Geschoss mind. zwei voneinander unabhängige RW: 1. RW baulich (Treppe), 2. RW i. d. R. Anleiterstelle',w:'Fällt ein Weg aus, bleibt der andere nutzbar.',g:'R',feat:['rw','anl']},
   {id:'tw',t:'Tragende Bauteile',v:'GK 1/2: Obergeschoss keine Anforderungen · Kellergeschoss feuerhemmend (F30)',w:'Der Keller trägt das Haus auch im Brandfall.',g:'A',feat:['tw']},
   {id:'gk',t:'Freistehend?',v:'Gebäude GK 1 werden zu GK 2, sobald sie nicht mehr freistehen (z. B. angebaute Garage)',w:'Die Einstufung hängt von der Lage ab.',g:null,feat:['gk']},
   Object.assign({},G_AUF)
  ],
  gk:'GK 1a',gkWhy:'≤ 7 m, freistehend, max. 2 NE, ANE ≤ 400 m² → GK 1a.',
  fact:'Einfamilienhaus: freistehend, max. 2 NE, ANE ≤ 400 m², OKFF ≤ 7 m.'}
];
const BY={};BUILDINGS.forEach(b=>BY[b.id]=b);
const GKS=['GK 1a','GK 1b','GK 2','GK 3','GK 4','GK 5'];
/* Karten fuer Zuordnen: a = Gebaeude-ID */
const CARDS_TAT=[
 {t:'OKFF oberste NE > 22 m',a:'hoch',e:'Hochhäuser: OKFF > 22 m → MHHR.'},
 {t:'Verkaufsfläche A > 800 m²',a:'verk',e:'Verkaufsstätten: A > 800 m² (ab 2.000 m²: MVKVO).'},
 {t:'n > 100 Personen',a:'vers',e:'Versammlungsstätten: n > 100 Personen (ab 200: MVStättVO).'},
 {t:'n > 12 Gastbetten',a:'beh',e:'Beherbergungsstätten: n > 12 Gastbetten → MBeVO.'},
 {t:'Nutzung als Krankenhaus',a:'kra',e:'Krankenhäuser: Tatbestand ist die Nutzung → MKhVO.'},
 {t:'Produktion / Lagerung',a:'ind',e:'Industriebauten: Produktion/Lagerung → MIndBauRL.'},
 {t:'Stellplätze > 100 m²',a:'gar',e:'Garagen: Stellplätze > 100 m² → M-GarVO.'},
 {t:'Freistehend, max. 2 NE, ANE ≤ 400 m² (GK 1a)',a:'woh',e:'Das ist ein Standardgebäude, kein Sonderbau.'}
];
const CARDS_ANF=[
 {t:'Feuerwehraufzug, Vorraum mind. 6 m²',a:'hoch',e:'Abschnitt 06 Hochhäuser: Feuerwehraufzüge mit Vorraum mind. 6 m².'},
 {t:'Nasse Steigleitung mit Wandhydranten Typ F',a:'hoch',e:'Abschnitt 06 Hochhäuser: nasse Steigleitung, 3 × 200 l/min bei 4,5 bar.'},
 {t:'Sicherheitstreppenraum mit Druckbelüftung',a:'hoch',e:'Abschnitt 06 Hochhäuser.'},
 {t:'Ladenstraße mind. 5,00 m breit',a:'verk',e:'Abschnitt 07 Verkaufsstätten: Ladenstraßen mind. 5,00 m.'},
 {t:'Rauch- und Wärmeabzug für Ladenstraßen',a:'verk',e:'Abschnitt 07 Verkaufsstätten.'},
 {t:'Rettungswegplan im Zimmer, mehrsprachig',a:'beh',e:'Abschnitt 08 Beherbergungsstätten.'},
 {t:'BMA ab > 60 Gastbetten',a:'beh',e:'Abschnitt 08 Beherbergungsstätten.'},
 {t:'Sicherheitskategorien K1–K4',a:'ind',e:'Abschnitt 09 Industriebau.'},
 {t:'Umfahrung ab Grundfläche > 5.000 m²',a:'ind',e:'Abschnitt 09 Industriebau.'},
 {t:'Brandbekämpfungsabschnitt (BBA)',a:'ind',e:'Abschnitt 09 Industriebau.'},
 {t:'Maschinelle Abluft in geschlossenen Mittel- und Großgaragen',a:'gar',e:'Abschnitt 10 Garagen.'},
 {t:'Trockene Löschwasserleitung: Stellplätze > 4 m unter / > 13 m über GOF',a:'gar',e:'Abschnitt 10 Garagen.'},
 {t:'2. Rettungsweg i. d. R. über Anleiterstelle',a:'woh',e:'Grundsatz bei Standardgebäuden (Abschnitt 04).'}
];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
/* ===== three.js: Hilfen ===== */
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3(1,1,1);
const _bx=new THREE.Vector3(),_by=new THREE.Vector3(),_bz=new THREE.Vector3(),_UP=new THREE.Vector3(0,1,0);
function mergeGeoms(list){
  const gs=list.map(g=>g.index?g.toNonIndexed():g);let n=0;gs.forEach(g=>n+=g.attributes.position.count);
  const pos=new Float32Array(n*3);let o=0;
  gs.forEach(g=>{pos.set(g.attributes.position.array,o*3);o+=g.attributes.position.count;});
  const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.computeVertexNormals();
  list.forEach(g=>g.dispose());return r;
}
function labelTex(text,fg,bg,fs){
  fs=fs||44;const c=document.createElement('canvas'),x=c.getContext('2d');
  x.font='700 '+fs+'px "Segoe UI",Arial,sans-serif';const w=Math.ceil(x.measureText(text).width)+fs*0.9,hh=Math.round(fs*1.6);
  c.width=w;c.height=hh;x.font='700 '+fs+'px "Segoe UI",Arial,sans-serif';
  if(bg){x.fillStyle=bg;const r=hh/2;x.beginPath();x.moveTo(r,0);x.arcTo(w,0,w,hh,r);x.arcTo(w,hh,0,hh,r);x.arcTo(0,hh,0,0,r);x.arcTo(0,0,w,0,r);x.fill();}
  x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,hh/2+2);
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;return {tex:t,ar:w/hh};
}
/* Baukasten pro Gebaeude: sammelt Geometrie je Material und verschmilzt sie */
function newB(def,scene){
  const b={id:def.id,def,group:new THREE.Group(),shell:[],mats:[],feats:{},lines:[],sprites:[],anim:[],ghosts:[],cols:new Map(),
    xr:0,xrT:0,dim:0,dimT:0,glow:0,glowCol:new THREE.Color(1,1,1),hl:{},hotpos:{},pre:'',cur:null,pill:[0,10,0],view:{c:[0,5,0],rad:12},pickBox:null};
  b.cur=b.group;scene.add(b.group);
  b.lineMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false});
  b.m=(col,o)=>{const m=new THREE.MeshLambertMaterial(Object.assign({color:col},o||{}));m.userData.base=new THREE.Color(col);b.mats.push(m);return m;};
  b.sm=(col,op,o)=>{op=op==null?1:op;const m=b.m(col,Object.assign({transparent:true,opacity:op},o||{}));m.userData.shell=true;m.userData.op=op;b.shell.push(m);return m;};
  b.fx=(name,col,o)=>{o=o||{};const m=b.m(col,Object.assign({emissive:0x000000},o.mat||{}));const k=b.pre+name;(b.feats[k]=b.feats[k]||[]).push(m);
    if(o.ghost){m.transparent=true;m.userData.ghost=o.ghost;m.opacity=0;m.depthWrite=false;b.ghosts.push(m);}
    else if(o.op!=null){m.transparent=true;m.opacity=o.op;m.depthWrite=false;m.userData.fixop=o.op;}
    return m;};
  b.put=(mat,geo,x,y,z,rx,ry,rz)=>{_e.set(rx||0,ry||0,rz||0);_q.setFromEuler(_e);_p.set(x,y,z);_m.compose(_p,_q,_s);geo.applyMatrix4(_m);
    let a=b.cols.get(mat);if(!a){a=[];b.cols.set(mat,a);}a.push(geo);};
  b.box=(mat,w,hh,d,x,y,z,ry,rx,rz)=>b.put(mat,new THREE.BoxGeometry(w,hh,d),x,y,z,rx,ry,rz);
  b.bot=(mat,w,hh,d,x,y,z,ry)=>b.put(mat,new THREE.BoxGeometry(w,hh,d),x,y+hh/2,z,0,ry||0,0);
  b.cyl=(mat,rt,rb,hh,seg,x,y,z,rx,ry,rz)=>b.put(mat,new THREE.CylinderGeometry(rt,rb,hh,seg||8),x,y+hh/2,z,rx,ry,rz);
  b.ico=(mat,r,x,y,z,det,sx)=>{const g=new THREE.IcosahedronGeometry(r,det||0);b.put(mat,g,x,y,z);};
  b.geo=(mat,g,x,y,z,rx,ry,rz)=>b.put(mat,g,x,y,z,rx,ry,rz);
  /* geneigte Platte von (x0,y0,z0) nach (x1,y1,z1), Breite w, Dicke t */
  b.slope=(mat,w,t,x0,y0,z0,x1,y1,z1)=>{
    _bz.set(x1-x0,y1-y0,z1-z0);const len=_bz.length();_bz.normalize();_bx.crossVectors(_UP,_bz).normalize();_by.crossVectors(_bz,_bx);
    const g=new THREE.BoxGeometry(w,t,len);_m.makeBasis(_bx,_by,_bz);_m.setPosition((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);g.applyMatrix4(_m);
    let a=b.cols.get(mat);if(!a){a=[];b.cols.set(mat,a);}a.push(g);};
  b.fin=(grp)=>{grp=grp||b.group;b.cols.forEach((list,mat)=>{const me=new THREE.Mesh(mergeGeoms(list),mat);me.userData.bid=def.id;grp.add(me);});b.cols.clear();};
  /* eigenes Mesh (animiert) */
  b.part=(mat,geo,x,y,z,fn)=>{const me=new THREE.Mesh(geo,mat);me.position.set(x,y,z);b.cur.add(me);if(fn)b.anim.push({m:me,fn:fn,y0:y});return me;};
  b.edges=(w,hh,d,x,y,z)=>{const l=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,hh,d)),b.lineMat);l.position.set(x,y,z);b.cur.add(l);return l;};
  b.label=(text,x,y,z,sc,fg,bg)=>{const t=labelTex(text,fg||'#ffffff',bg||'rgba(15,22,34,.82)',40);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t.tex,transparent:true,depthTest:false,opacity:0}));sp.scale.set((sc||1.6)*t.ar,(sc||1.6),1);sp.position.set(x,y,z);sp.renderOrder=20;b.cur.add(sp);b.sprites.push(sp);return sp;};
  b.sign=(text,w,hh,x,y,z,ry,bg,fg,fs)=>{const t=labelTex(text,fg||'#ffffff',bg||null,fs||64);
    const me=new THREE.Mesh(new THREE.PlaneGeometry(w,hh),new THREE.MeshBasicMaterial({map:t.tex,transparent:true}));me.position.set(x,y,z);me.rotation.y=ry||0;b.cur.add(me);return me;};
  return b;
}
/* Treppe: Doppellauf (U) zwischen zwei Ebenen, Richtung entlang z */
function stairU(b,mat,x0,x1,zA,zB,y0,rise,w){ // Lauf 1 bei x0 von zA nach zB (steigend), Lauf 2 bei x1 zurueck
  b.slope(mat,w,0.16,x0,y0,zA,x0,y0+rise/2,zB);b.slope(mat,w,0.16,x1,y0+rise/2,zB,x1,y0+rise,zA);
}
function stairsBox(b,mat,shaftMat,cx,cz,sx,sz,levels,fh,y0,dir){ // Schacht + Laeufe
  const H=fh*levels;if(shaftMat)b.bot(shaftMat,sx,H,sz,cx,y0,cz);
  const zA=cz-sz/2+0.35,zB=cz+sz/2-0.35;
  for(let i=0;i<levels;i++){const y=y0+fh*i;
    b.slope(mat,sx*0.38,0.16,cx-sx*0.22,y,zA,cx-sx*0.22,y+fh/2,zB);
    b.slope(mat,sx*0.38,0.16,cx+sx*0.22,y+fh/2,zB,cx+sx*0.22,y+fh,zA);
    b.bot(mat,sx*0.82,0.14,0.5,cx,y+fh/2-0.1,zB+0.05);}
}
function addTruck(b,mat,matDark,x,z,ry,arm){
  const c=Math.cos(ry),s=Math.sin(ry);const P=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c];
  b.box(mat,2.3,1.3,5.6,x,1.1,z,ry);let p=P(0,1.7);b.box(mat,2.3,1.5,1.9,p[0],1.55,p[1],ry);
  p=P(0,2.0);b.box(matDark,2.0,0.7,0.08,p[0],1.8,p[1]+0*0,ry);
  [[-1.2,-1.8],[1.2,-1.8],[-1.2,1.8],[1.2,1.8]].forEach(w=>{const q=P(w[0],w[1]);b.cyl(matDark,0.55,0.55,0.4,8,q[0],0.55,q[1],0,ry,Math.PI/2);});
  if(arm){const a=P(0,-1.0),e=P(arm[0],arm[1]);b.slope(matDark,0.35,0.25,a[0],2.0,a[1],e[0],arm[2],e[1]);}
}
function addCar(b,body,dark,x,z,ry,sc){
  sc=sc||1;b.box(body,1.7*sc,0.6*sc,3.5*sc,x,0.55*sc+0.1,z,ry);
  const c=Math.cos(ry||0),s=Math.sin(ry||0);b.box(dark,1.5*sc,0.5*sc,1.8*sc,x+0.25*s*sc,1.1*sc+0.1,z+0.25*c*sc,ry);
}
/* ===== Gebaeude ===== */
const GC=g=>GOALS[g].hex;
const TR=(o)=>Object.assign({transparent:true,depthWrite:false},o||{});
function bHoch(b){
  const F=2.75,N=11,H=F*N;
  const wall=b.sm(0xe9eef8),glass=b.sm(0x27457f,0.94),acc=b.sm(0x4f86f0),pod=b.sm(0xd3dcec),roof=b.sm(0xb9c4d8);
  const slab=b.m(0xcfd6e2),dk=b.m(0x56627a);
  // Sockel (Erdgeschoss)
  b.bot(pod,14,F,0.3,0,0,6.85);b.bot(pod,14,F,0.3,0,0,-6.85);b.bot(pod,0.3,F,13.4,-6.85,0,0);b.bot(pod,0.3,F,13.4,6.85,0,0);
  b.bot(glass,10,1.5,0.1,0,0.5,7.05);b.bot(acc,14.4,0.35,14.4,0,F-0.05,0);
  // Turm
  b.bot(wall,9,H-F,0.3,0,F,4.35);b.bot(wall,9,H-F,0.3,0,F,-4.35);b.bot(wall,0.3,H-F,8.4,-4.35,F,0);b.bot(wall,0.3,H-F,8.4,4.35,F,0);
  [[-4.5,-4.5],[4.5,-4.5],[-4.5,4.5],[4.5,4.5]].forEach(c=>b.bot(acc,0.8,H-F+0.4,0.8,c[0],F,c[1]));
  for(let i=1;i<N;i++){const y=F*i+0.8;
    b.bot(glass,7.6,1.35,0.08,0,y,4.55);b.bot(glass,7.6,1.35,0.08,0,y,-4.55);b.bot(glass,0.08,1.35,7.6,-4.55,y,0);b.bot(glass,0.08,1.35,7.6,4.55,y,0);}
  b.bot(roof,9.8,0.4,9.8,0,H,0);
  b.bot(dk,0.2,3.5,0.2,3.6,H+0.4,3.6);
  b.edges(14,F,14,0,F/2,0);b.edges(9,H-F,9,0,(H+F)/2,0);
  // Geschossdecken (innen)
  b.bot(slab,13.4,0.1,13.4,0,0,0);
  for(let i=1;i<N;i++)b.bot(slab,8.7,0.28,8.7,0,F*i-0.28,0);
  // Rettungsweg: zweiter Treppenraum (NTR)
  const rwG=b.fx('rw',GC('R')),rwS=b.fx('rw',GC('R'),{mat:TR({opacity:0.2})});
  stairsBox(b,rwG,rwS,2.6,2.6,3,3,N-1,F,0,0);
  // Sicherheitstreppenraum
  const sG=b.fx('str',GC('R')),sS=b.fx('str',GC('R'),{mat:TR({opacity:0.26})});
  stairsBox(b,sG,sS,-2.6,-2.6,3,3,N-1,F,0,0);
  b.bot(sG,3.2,0.1,3.2,-2.6,F*5-0.05,-2.6);
  // Feuerwehraufzug
  const faS=b.fx('fa',GC('L'),{mat:TR({opacity:0.24})}),faG=b.fx('fa',GC('L'));
  b.bot(faS,2.2,H-0.3,2.2,2.4,0,-2.9);
  for(let i=0;i<N-1;i++)b.bot(faG,1.0,2.0,0.06,2.4,F*i,-1.78);
  b.bot(faG,3,0.08,2,2.4,F*4,-0.8);
  b.part(faG,new THREE.BoxGeometry(1.6,2.2,1.6),2.4,1.1,-2.9,(m,t)=>{m.position.y=1.2+(Math.sin(t*0.5)*0.5+0.5)*(H-4.5);});
  // Steigleitung
  const stG=b.fx('steig',0xe84a4a);
  b.cyl(stG,0.13,0.13,H-0.6,8,-0.4,0.2,-4.0);
  for(let i=0;i<N;i++)b.bot(stG,0.5,0.75,0.28,-0.4,F*i+0.6,-3.95);
  // Druckbelueftung (Ventilator auf dem Dach)
  const dr=b.fx('druck',GC('A')),drD=b.fx('druck',0x3b4558);
  b.bot(dr,2.2,1.3,2.2,-2.6,H+0.4,-2.6);b.cyl(drD,0.75,0.75,0.12,12,-2.6,H+1.7,-2.6);
  b.part(drD,new THREE.BoxGeometry(1.5,0.1,0.28),-2.6,H+1.9,-2.6,(m,t)=>{m.rotation.y=t*4;});
  b.part(drD,new THREE.BoxGeometry(0.28,0.1,1.5),-2.6,H+1.9,-2.6,(m,t)=>{m.rotation.y=t*4;});
  b.bot(b.fx('druck',GC('A'),{mat:TR({opacity:0.28})}),0.9,H-0.5,0.9,-2.6,0,-2.6);
  // BMA
  const bm=b.fx('bma',GC('R'));
  for(let i=0;i<N;i++){const y=F*(i+1)-0.45;b.cyl(bm,0.3,0.3,0.14,10,-0.9,y,1.2);b.cyl(bm,0.3,0.3,0.14,10,1.2,y,0.2);}
  b.bot(bm,0.6,0.9,0.22,3.9,0.9,4.2);
  // ELA
  const el=b.fx('ela',GC('R'));
  for(let i=0;i<N;i++){const y=F*i+2.0;b.bot(el,0.34,0.34,0.3,1,y,4.0);b.cyl(el,0.1,0.34,0.4,8,1,y+0.17,3.65,Math.PI/2,0,0);}
  // Sprinkler
  const sp=b.fx('spr',GC('A'));
  for(let i=0;i<N;i++){const y=F*(i+1)-0.55;b.bot(sp,7.6,0.09,0.09,0,y,1.8);
    [-2,0,2].forEach(x=>{b.bot(sp,0.09,0.09,4,x,y,0.5);[-0.8,2.4].forEach(z=>b.cyl(sp,0.07,0.16,0.18,6,x,y-0.18,z));});}
  // Schwelle 22 m
  const th=b.fx('tat',0xffe27a,{ghost:0.95});
  b.bot(th,9.9,0.12,0.12,0,21.95,4.95);b.bot(th,9.9,0.12,0.12,0,21.95,-4.95);b.bot(th,0.12,0.12,9.9,-4.95,21.95,0);b.bot(th,0.12,0.12,9.9,4.95,21.95,0);
  b.bot(th,0.1,22,0.1,5.1,0,5.1);for(let y=0;y<=22;y+=5.5)b.bot(th,0.9,0.1,0.1,5.1,y,5.1);
  b.label('22 m',5.3,11,5.3,1.4,'#1c2433','rgba(255,226,122,.95)');
  b.label('OKFF > 22 m → MHHR',-4.95,23.8,4.95,1.2,'#1c2433','rgba(255,226,122,.95)');
  b.fin();
  b.hotpos={tat:[-4.95,22,4.95],rw:[2.6,5.2,2.6],str:[-2.6,18.8,-2.6],fa:[2.4,25.4,-2.9],steig:[-0.4,12.0,-4.0],druck:[-2.6,H+2.4,-2.6],bma:[0.6,28.9,1.2],ela:[1,15.6,4.0],spr:[-1,8.8,1.8]};
  b.pill=[0,H+3.5,0];b.view={c:[0,15.5,0],rad:23,hot:0.55,el:0.36};b.pick=[14.6,H+4,14.6,0,(H+4)/2,0];b.fp=[7.3,7.3];
}
function bVerk(b){
  const W=18,D=13,Hh=5;
  const wall=b.sm(0xf08a82),band=b.sm(0xd9514f),glass=b.sm(0x2e4d6e,0.9),roof=b.sm(0xdfe3ea),par=b.sm(0xd9514f);
  const fl=b.m(0xe9e4da),asph=b.m(0x4c5461),line=b.m(0xf3f3f3),shA=b.m(0xcb8a52),shB=b.m(0x6ba3d6),shC=b.m(0xe8c24a),dk=b.m(0x3a4152);
  b.bot(wall,W,1.0,0.3,0,0,D/2);b.bot(glass,W-0.4,2.8,0.12,0,1.0,D/2+0.02);b.bot(band,W,1.2,0.34,0,3.8,D/2);
  b.bot(wall,W,Hh,0.3,0,0,-D/2);
  [-1,1].forEach(s=>{const x=s*W/2;b.bot(wall,0.3,Hh,5.3,x,0,-D/2+2.65+0.15);b.bot(wall,0.3,Hh,5.3,x,0,D/2-2.65-0.15);b.bot(wall,0.3,1.4,2.4,x,3.6,0);});
  b.bot(roof,W+0.6,0.35,D+0.6,0,Hh,0);
  b.bot(par,W+0.6,0.5,0.3,0,Hh+0.35,D/2+0.15);b.bot(par,W+0.6,0.5,0.3,0,Hh+0.35,-D/2-0.15);b.bot(par,0.3,0.5,D,-W/2-0.15,Hh+0.35,0);b.bot(par,0.3,0.5,D,W/2+0.15,Hh+0.35,0);
  b.edges(W,Hh,D,0,Hh/2,0);
  b.bot(fl,W-0.5,0.1,D-0.5,0,0,0);
  // Regale
  [-1,1].forEach(s=>{[3.7,5.2].forEach((z,ri)=>{for(let x=-7.6;x<=7.7;x+=3.8){b.bot(ri?shB:shA,3.0,1.7,0.7,x,0.1,s*z);b.bot(shC,3.0,0.15,0.74,x,1.8,s*z);}});});
  // Kassen
  [-3,3].forEach(x=>b.bot(dk,1.2,0.9,2.0,x,0.1,0));
  b.bot(dk,0.001,0.001,0.001,0,0,0);
  // Ladenstrasse
  const ls=b.fx('laden',GC('R'),{mat:TR({opacity:0.7})});b.bot(ls,W-0.5,0.05,5,0,0.1,0);
  const lsw=b.fx('tat',0xffffff,{ghost:0.9});b.bot(lsw,0.1,0.1,5,-7.7,0.22,0);b.bot(lsw,0.6,0.1,0.1,-7.7,0.22,2.5);b.bot(lsw,0.6,0.1,0.1,-7.7,0.22,-2.5);
  b.label('5,00 m',-6.6,0.9,0,1.3,'#0e2a1a','rgba(61,220,132,.95)');
  // Sprinkler
  const sp=b.fx('spr',GC('A'));
  [-4,0,4].forEach(z=>{b.bot(sp,W-1,0.1,0.1,0,4.55,z);for(let x=-8;x<=8;x+=2.67)b.cyl(sp,0.07,0.17,0.2,6,x,4.33,z);});
  [-8,8].forEach(x=>b.bot(sp,0.1,0.1,8.4,x,4.55,0));
  // Rauch- und Waermeabzug (Dachklappen)
  const rw=b.fx('rwa',GC('A')),rwd=b.fx('rwa',0x3b4558);
  [-5.5,0,5.5].forEach(x=>{b.bot(rwd,2.6,0.4,2.8,x,Hh+0.1,0);b.box(rw,2.4,0.12,2.6,x,Hh+0.8,0.1,0,0.45,0);});
  // Wandhydranten
  const hy=b.fx('hyd',GC('L'));
  [-6,0,6].forEach(x=>{b.bot(hy,0.9,1.1,0.3,x,0.9,-D/2+0.4);});
  // BMA
  const bm=b.fx('bma',GC('L'));
  [-6,-2,2,6].forEach(x=>[-4,4].forEach(z=>b.cyl(bm,0.3,0.3,0.14,10,x,4.65,z)));b.bot(bm,0.7,1.0,0.25,7.8,1.0,-D/2+0.45);
  // Ausgaenge
  const ex=b.fx('rw',GC('R'));
  [-1,1].forEach(s=>{b.bot(ex,0.12,0.45,1.1,s*(W/2-0.08),3.2,0);b.bot(ex,0.1,0.1,2.4,s*(W/2+0.05),0,-1.2);b.bot(ex,0.1,0.1,2.4,s*(W/2+0.05),0,1.2);});
  [-1,1].forEach(s=>{const lx=s*(W/2-2.8);for(let k=0;k<3;k++)b.bot(ex,0.9,0.05,0.25,lx+s*k*1.1,0.12,0);});
  b.label('2,00 m',W/2-0.5,1.6,2.3,1.1,'#0e2a1a','rgba(61,220,132,.95)');
  // Brandabschnitt (Rahmen)
  const ba=b.fx('ba',GC('A'),{ghost:0.95});
  b.bot(ba,W-0.6,0.12,0.15,0,0.2,D/2-0.3);b.bot(ba,W-0.6,0.12,0.15,0,0.2,-D/2+0.3);b.bot(ba,0.15,0.12,D-0.6,W/2-0.3,0.2,0);b.bot(ba,0.15,0.12,D-0.6,-W/2+0.3,0.2,0);
  // Parkplatz + Pylon
  b.bot(asph,W,0.06,3.8,0,0,D/2+2.3);for(let x=-8;x<=8;x+=2.6)b.bot(line,0.12,0.02,2.6,x,0.07,D/2+2.3);
  addCar(b,b.m(0x4f86f0),dk,-6.3,D/2+2.4,0);addCar(b,b.m(0xf2f2f2),dk,-1.0,D/2+2.4,0);addCar(b,b.m(0x2db8a0),dk,3.9,D/2+2.4,0);addCar(b,b.m(0xe8c24a),dk,6.5,D/2+2.4,0);
  b.bot(dk,0.4,6.6,0.4,-7.6,0,D/2+4.5);
  const pn=b.m(0xd9514f);b.bot(pn,4.2,1.8,0.5,-7.6,6.0,D/2+4.5);
  b.sign('MARKT',3.8,1.4,-7.6,6.9,D/2+4.78,0,null,'#ffffff',90);
  b.fin();
  b.hotpos={tat:[-7.6,8.1,D/2+4.5],laden:[-5.2,0.7,0],rw:[W/2,3.4,0],spr:[3,4.6,-4],ba:[W/2-0.3,0.3,-4.8],rwa:[0,Hh+1.6,0],hyd:[-6,1.7,-D/2+0.5],bma:[6,4.8,4]};
  b.pill=[0,Hh+4.5,0];b.view={c:[0,2.5,1],rad:13,hot:0.6,el:0.62};b.pick=[W+1,Hh+7,D+8.5,0,(Hh+7)/2,2];b.fp=[10,10];
}
function bVers(b){
  const R=6.5,Hh=6.0,CZ=-2;
  const wall=b.sm(0xc8b0f5,1,{side:THREE.DoubleSide}),roof=b.sm(0x7f58c8,1,{side:THREE.DoubleSide}),acc=b.sm(0xa06cf0),glass=b.sm(0x2e4d6e,0.9),fo=b.sm(0xe3d6fa);
  const fl=b.m(0xe4def0),bowl=b.m(0xb7aed0,{side:THREE.DoubleSide}),stage=b.m(0x6e49c4),dk=b.m(0x3a4152);
  const pc=[b.m(0xe86a6a),b.m(0x4f86f0),b.m(0xf0c24a),b.m(0x4cc08a)],hd=b.m(0xf3d2b0);
  b.geo(wall,new THREE.CylinderGeometry(R,R,Hh,12,1,true),0,Hh/2,CZ);
  b.geo(roof,new THREE.ConeGeometry(R+0.6,2.8,12),0,Hh+1.4,CZ);
  b.geo(b.sm(0x8a5fd6,1,{side:THREE.DoubleSide}),new THREE.CylinderGeometry(R+0.15,R+0.15,0.6,12,1,true),0,Hh-0.3,CZ);
  // Foyer
  b.bot(fo,8,4.6,0.3,0,0,7.4);b.bot(glass,6.4,2.8,0.1,0,0.5,7.6);b.bot(fo,0.3,4.6,4.6,-4,0,5.2);b.bot(fo,0.3,4.6,4.6,4,0,5.2);b.bot(acc,8.6,0.5,5.4,0,4.5,5.2);
  b.bot(acc,5,0.25,1.6,0,3.7,8.4);b.bot(dk,0.2,3.7,0.2,-2.3,0,9.0);b.bot(dk,0.2,3.7,0.2,2.3,0,9.0);
  b.edges(R*2,Hh,R*2,0,Hh/2,CZ);
  // Boden, Sitzstufen (Lathe), Buehne
  b.cyl(fl,R-0.15,R-0.15,0.1,12,0,0,CZ);b.bot(fl,7.6,0.1,4.6,0,0,5.2);
  const pts=[[1.9,0.02],[2.3,0.02],[2.3,0.45],[3.1,0.45],[3.1,0.9],[3.9,0.9],[3.9,1.35],[4.7,1.35],[4.7,1.8],[5.5,1.8],[5.5,2.25],[5.9,2.25],[5.9,0.02]].map(p=>new THREE.Vector2(p[0],p[1]));
  b.geo(bowl,new THREE.LatheGeometry(pts,12),0,0,CZ);
  b.cyl(stage,1.9,1.9,0.5,12,0,0,CZ);
  const rings=[[2.7,14,0.45],[3.5,18,0.9],[4.3,22,1.35],[5.1,26,1.8],[5.7,30,2.25]];let k=0;
  rings.forEach(r=>{for(let i=0;i<r[1];i++){const a=i/r[1]*Math.PI*2+0.1*r[2];const x=Math.cos(a)*r[0],z=CZ+Math.sin(a)*r[0];
    b.geo(pc[(k++)%4],new THREE.ConeGeometry(0.24,0.7,5),x,r[2]+0.38,z);b.ico(hd,0.17,x,r[2]+0.86,z);}});
  // Rettungswege: Tueren in der Rundhalle
  const ex=b.fx('rw',GC('R'));
  [[-1,0],[1,0],[0,-1]].forEach(d=>{const a=Math.atan2(d[1],d[0]);const x=Math.cos(a)*(R-0.05),z=CZ+Math.sin(a)*(R-0.05);
    b.bot(ex,0.14,2.2,1.5,x,0,z,-a);b.bot(ex,0.12,0.4,1.1,x,2.6,z,-a);});
  b.bot(ex,3.0,0.1,0.12,0,0.12,6.6);b.bot(ex,0.12,0.4,1.4,0,3.0,6.95);
  // Brandabschnitt (Ring)
  const ba=b.fx('ba',GC('A'),{ghost:0.95});b.geo(ba,new THREE.TorusGeometry(R-0.6,0.09,5,36),0,0.25,CZ,Math.PI/2,0,0);
  // Aufstellflaeche
  const pad=b.fx('auf',GC('L'),{mat:TR({opacity:0.5})}),tr=b.fx('auf',0xe84a4a),trd=b.fx('auf',0x333a48);
  b.bot(pad,3.4,0.05,10,-8.8,0.0,-1.5);for(let z=-5.5;z<=2.5;z+=2)b.bot(b.fx('auf',0xffffff),0.1,0.02,1,-8.8,0.06,z);
  addTruck(b,tr,trd,-8.8,-2.2,0,[2.6,0.0,0]);
  b.fin();
  b.hotpos={tat:[0,Hh+3.4,CZ],rw:[R,1.8,CZ],ba:[-3.5,0.6,CZ+4.9],auf:[-8.8,3.0,-2.2]};
  b.pill=[0,Hh+5,CZ];b.view={c:[-0.5,3.2,0.5],rad:14,hot:0.6,el:0.58};b.pick=[R*2+1+3,Hh+4,R*2+8,-2,(Hh+4)/2,0];b.fp=[10,10];
}
function bBeh(b){
  const W=16,D=9,FH=3,NF=4,Hh=FH*NF,X0=-5.5;
  const wall=b.sm(0xbfeee3),band=b.sm(0x2db8a0),glass=b.sm(0x2a5a63,0.9),roof=b.sm(0xcfd8dc);
  const slab=b.m(0xdde6e3),inW=b.m(0xeef3f1),bed=b.m(0xffffff),bl=b.m(0x2db8a0),dk=b.m(0x3a4a50);
  b.bot(wall,W,Hh,0.3,0,0,D/2);b.bot(wall,W,Hh,0.3,0,0,-D/2);b.bot(wall,0.3,Hh,D,-W/2,0,0);b.bot(wall,0.3,Hh,D,W/2,0,0);
  for(let i=0;i<NF;i++){const y=FH*i;for(let k=0;k<4;k++){const x=X0+3.375*(k+0.5);b.bot(glass,1.7,1.2,0.1,x,y+1.0,D/2+0.1);b.bot(glass,1.7,1.2,0.1,x,y+1.0,-D/2-0.1);}
    b.bot(band,W+0.2,0.28,D+0.2,0,y+FH-0.28,0);}
  b.bot(roof,W+0.6,0.35,D+0.6,0,Hh,0);
  b.edges(W,Hh,D,0,Hh/2,0);
  // Geschosse
  const rs=b.fx('rs',GC('A')),pl=b.fx('plan',GC('R')),bm=b.fx('bma',GC('R')),al=b.fx('alarm',GC('R')),sb=b.fx('sb',GC('R')),bso=b.fx('bso',GC('E'));
  for(let i=0;i<NF;i++){const y=FH*i;
    b.bot(slab,W-0.4,i?0.25:0.1,D-0.4,0,i?y-0.25:0,0);
    b.bot(inW,13.5,2.7,0.12,X0+6.75,y,0.9);b.bot(inW,13.5,2.7,0.12,X0+6.75,y,-0.9);
    for(let k=1;k<4;k++){const x=X0+3.375*k;b.bot(inW,0.12,2.7,3.45,x,y,2.65);b.bot(inW,0.12,2.7,3.45,x,y,-2.65);}
    b.bot(inW,0.12,2.7,D-0.4,X0,y,0);
    for(let k=0;k<4;k++){const x=X0+3.375*(k+0.5);
      [-1,1].forEach(s=>{b.bot(bed,1.0,0.4,2.0,x,y+0.1,s*3.1);b.bot(bl,1.0,0.1,1.2,x,y+0.5,s*3.4);
        b.bot(rs,0.9,2.1,0.09,x+0.9,y+0.1,s*0.93);b.bot(pl,0.8,0.95,0.06,x-0.9,y+1.2,s*1.0);});}
    [-3,0,3,6].forEach(x=>b.cyl(bm,0.28,0.28,0.12,10,x,y+2.58,0));
    [-1.5,4.5].forEach(x=>b.bot(al,0.3,0.22,0.22,x,y+2.3,0));
    b.bot(sb,0.5,0.22,0.06,X0+0.4,y+2.35,0);b.bot(sb,0.1,0.35,0.5,W/2-0.25,y+2.0,0);
    // Treppenraum West (1. RW)
    stairsBox(b,b.fx('rw2',GC('R')),null,-6.75,0,2.5,D-0.9,1,FH,y);
  }
  // Rezeption / Brandschutzordnung
  b.bot(bso,1.0,1.1,0.1,-3.6,0.9,D/2-0.5);b.bot(b.m(0x2b3a40),2.0,0.9,0.6,0,0.1,2.0);
  // Aussentreppe
  const as=b.fx('rw2',GC('R'));
  for(let i=0;i<NF;i++){const y=FH*i;b.bot(as,2.3,0.14,3.0,9.1,y-0.1,0);
    if(i<NF-1){b.slope(as,0.9,0.14,8.7,y,-1.5,8.7,y+FH/2,-3.9);b.slope(as,0.9,0.14,9.7,y+FH/2,-3.9,9.7,y+FH,-1.5);
      b.bot(as,2.3,0.14,0.9,9.1,y+FH/2-0.1,-3.95);}
    b.bot(as,0.06,1.0,3.0,10.2,y,0);}
  // Dach: Schild
  b.bot(b.m(0x1f8f7c),7.2,1.4,0.5,0,Hh+0.35,0);b.sign('HOTEL',6.6,1.1,0,Hh+1.05,0.28,0,null,'#ffffff',90);b.sign('HOTEL',6.6,1.1,0,Hh+1.05,-0.28,Math.PI,null,'#ffffff',90);
  b.fin();
  b.hotpos={tat:[0,Hh+2.4,0],plan:[X0+3.375*0.5-0.9,FH*2+1.6,1.1],bma:[3,FH*3+2.5,0],alarm:[4.5,FH*2+2.3,0],rs:[X0+3.375*2.5+0.9,FH*1+1.2,0.95],sb:[X0+0.4,2.3,0],bso:[-3.6,1.5,D/2-0.5],rw2:[9.1,FH*1.5,0]};
  b.pill=[0,Hh+4,0];b.view={c:[1,5.5,0],rad:15,hot:0.6,el:0.5};b.pick=[W+5,Hh+3,D+1,1.5,(Hh+3)/2,0];b.fp=[10,5];
}
function bInd(b){
  const W=14,D=9,Hh=6.5;
  const wall=b.sm(0xf4e0b0),acc=b.sm(0xdd9b2b),roof=b.sm(0xc98a26),glass=b.sm(0x35597d,0.92),door=b.sm(0xb87a1e),base=b.sm(0xcfa458);
  const fl=b.m(0xd8d2c4),rack=b.m(0x7b8798),g1=b.m(0xc9873a),g2=b.m(0x6ba3d6),mach=b.m(0x6c7a90),top=b.m(0x2db8a0),conv=b.m(0x3f4a5e),asph=b.m(0x4c5461);
  b.bot(wall,W,Hh,0.3,0,0,D/2);b.bot(wall,W,Hh,0.3,0,0,-D/2);b.bot(wall,0.3,Hh,D,-W/2,0,0);b.bot(wall,0.3,Hh,D,W/2,0,0);
  b.bot(base,W+0.1,0.9,D+0.1,0,0,0);
  [-4,0,4].forEach(x=>b.bot(door,2.6,3.2,0.12,x,0,D/2+0.1));
  b.bot(glass,W-1,0.9,0.1,0,4.6,D/2+0.06);
  b.bot(roof,W+0.5,0.3,D+0.5,0,Hh,0);
  const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(3.5,0);sh.lineTo(3.5,1.8);sh.lineTo(0,0);
  for(let i=0;i<4;i++){const x=-W/2+3.5*i;
    const g=new THREE.ExtrudeGeometry(sh,{depth:D+0.3,bevelEnabled:false});b.geo(roof,g,x,Hh+0.3,-(D+0.3)/2);
    b.bot(glass,0.08,1.7,D-0.2,x+3.5,Hh+0.3,0);}
  b.edges(W,Hh,D,0,Hh/2,0);
  b.bot(fl,W-0.5,0.1,D-0.5,0,0,0);
  // Hauptgang
  const gg=b.fx('gang',GC('R'),{mat:TR({opacity:0.75})});b.bot(gg,W-0.5,0.05,2.0,0,0.1,0);
  b.label('2,00 m',-0.5,0.9,0,1.1,'#0e2a1a','rgba(61,220,132,.95)');
  // Regale / Maschinen
  [-1,1].forEach(s=>{for(let k=0;k<3;k++){const x=-5.7+k*2.4;
    b.bot(rack,2.0,0.08,0.9,x,0.35,s*2.3);b.bot(rack,2.0,0.08,0.9,x,1.2,s*2.3);b.bot(rack,2.0,0.08,0.9,x,2.05,s*2.3);b.bot(rack,0.1,2.2,0.1,x-0.95,0.1,s*2.3);b.bot(rack,0.1,2.2,0.1,x+0.95,0.1,s*2.3);
    [0.43,1.28,2.13].forEach((y,j)=>{b.bot(j%2?g1:g2,0.8,0.6,0.7,x-0.45,y,s*2.3);b.bot(j%2?g2:g1,0.8,0.6,0.7,x+0.45,y,s*2.3);});}});
  [3.6,6.0].forEach(x=>{b.bot(mach,2.0,1.5,1.8,x,0.1,2.5);b.bot(top,2.0,0.25,1.8,x,1.6,2.5);});
  b.bot(conv,5.5,0.5,0.8,4.8,0.3,-2.7);b.bot(top,5.5,0.1,0.8,4.8,0.8,-2.7);
  // Brandwand + Brandbekaempfungsabschnitt
  const bw=b.fx('ba',0xb5503a),bba=b.fx('ba',GC('A'),{mat:TR({opacity:0.3})}),bbaE=b.fx('ba',GC('A'),{ghost:0.95});
  b.bot(bw,0.4,7.2,D-0.3,1.4,0,0);
  b.bot(bba,5.0,3.4,3.4,-4.4,0,-2.6);
  b.bot(bbaE,5.0,0.1,0.1,-4.4,3.4,-4.3);b.bot(bbaE,5.0,0.1,0.1,-4.4,3.4,-0.9);b.bot(bbaE,0.1,0.1,3.4,-6.9,3.4,-2.6);b.bot(bbaE,0.1,0.1,3.4,-1.9,3.4,-2.6);
  b.label('BBA',-4.4,4.2,-2.6,1.2,'#2a2208','rgba(255,210,63,.95)');b.label('Brandwand',1.4,7.9,-3.6,1.1,'#ffffff','rgba(181,80,58,.95)');
  // Sicherheitskategorien: BMA + Sprinkler
  const k=b.fx('k',GC('A'));
  for(let x=-5.5;x<=5.6;x+=3.7)[-2.6,2.6].forEach(z=>b.cyl(k,0.3,0.3,0.14,10,x,6.05,z));
  [-3.2,3.2].forEach(z=>{b.bot(k,W-1,0.09,0.09,0,6.2,z);for(let x=-6;x<=6;x+=2)b.cyl(k,0.07,0.17,0.2,6,x,6.0,z);});
  b.bot(k,0.6,0.9,0.22,-W/2+0.4,1.2,-D/2+0.4);
  // Rettungswege
  const ex=b.fx('rw',GC('R'));
  [-1,1].forEach(s=>{const x=s*(W/2-0.05);b.bot(ex,0.12,3.0,0.12,x,0,-1.4);b.bot(ex,0.12,3.0,0.12,x,0,1.4);b.bot(ex,0.12,0.12,2.9,x,3.0,0);b.bot(ex,0.12,0.4,1.1,x,3.3,0);});
  const rl=b.fx('rwl',GC('R'),{ghost:0.95});
  b.bot(rl,0.14,0.08,3.2,-4.6,0.18,-1.6);b.bot(rl,2.3,0.08,0.14,-5.75,0.18,0);b.bot(rl,0.14,0.08,3.2,5.3,0.18,1.6);b.bot(rl,1.7,0.08,0.14,6.15,0.18,0);
  // Schornstein
  const ch=b.fx('tat',0xb9c2d0),chR=b.fx('tat',0xe84a4a);
  b.cyl(ch,0.5,0.7,12,10,5.1,0,-2.6);b.cyl(chR,0.52,0.56,1.2,10,5.1,10.6,-2.6);b.cyl(chR,0.6,0.64,1.2,10,5.1,8.0,-2.6);
  // Umfahrung
  const um=b.fx('umf',0x5a7fa5);
  b.bot(um,21,0.07,2.0,0,0,7.5);b.bot(um,21,0.07,2.0,0,0,-7.5);b.bot(um,2.0,0.07,13,-10,0,0);b.bot(um,2.0,0.07,13,10,0,0);
  const dl=b.fx('umf',0xffffff);for(let x=-9;x<=9;x+=3){b.bot(dl,1.3,0.02,0.12,x,0.08,7.5);b.bot(dl,1.3,0.02,0.12,x,0.08,-7.5);}
  for(let z=-5;z<=5;z+=3){b.bot(dl,0.12,0.02,1.3,-10,0.08,z);b.bot(dl,0.12,0.02,1.3,10,0.08,z);}
  addTruck(b,b.fx('umf',0xe84a4a),b.fx('umf',0x333a48),-10,-2,0,null);
  b.fin();
  b.hotpos={tat:[5.1,12.8,-2.6],ba:[1.4,4.2,2.0],k:[-2,6.0,-3.2],rw:[-W/2,3.6,0],rwl:[-4.6,0.5,-1.6],gang:[3.2,0.5,0],umf:[10,0.8,5.2]};
  b.pill=[0,15.3,0];b.view={c:[0,3.5,0],rad:14,hot:0.55,el:0.62};b.pick=[W+8,13,D+7,0,6.5,0];b.fp=[10.5,8];
}
function bGar(b){
  const wall=b.sm(0xc3de8c),accn=b.sm(0x7fb62c),glass=b.sm(0x2f4a3a,0.9),roof=b.sm(0xa9b8c9);
  const slab=b.m(0xaab2bf),col=b.m(0x8c95a3),ramp=b.m(0x7d8794),asph=b.m(0x4c5461),line=b.m(0xf3f3f3),dk=b.m(0x3a4152);
  const cars=[0xe86a6a,0x4f86f0,0xf2f2f2,0xe8c24a,0x2db8a0,0x8e6bd8].map(c=>b.m(c));
  b.hotV={};b.variants={};
  const make=(key,W,D,n,fl)=>{
    const grp=new THREE.Group();b.group.add(grp);b.cur=grp;b.pre=key+'_';b.variants[key]=grp;
    const FHg=3,Hh=FHg*n,hx=W/2,hz=D/2,rs=fl.ramp?3:0;
    // Waende
    b.bot(wall,W,Hh,0.3,0,0,-hz);b.bot(wall,0.3,Hh,D,-hx,0,0);b.bot(wall,0.3,Hh,D,hx,0,0);
    if(fl.ramp){const gx=hx-1.5;b.bot(wall,W/2+gx-1.7,FHg,0.3,(-hx+gx-1.7)/2,0,hz);b.bot(wall,hx-gx-1.7,FHg,0.3,(gx+1.7+hx)/2,0,hz);
      if(n>1)b.bot(wall,W,Hh-FHg,0.3,0,FHg,hz);b.bot(accn,3.6,0.3,0.34,gx,FHg-0.3,hz);}
    else{b.bot(wall,W,Hh,0.3,0,0,hz);}
    for(let i=0;i<n;i++){const y=FHg*i;
      b.bot(glass,W-1,0.5,0.06,0,y+1.5,-hz-0.1);b.bot(glass,0.06,0.5,D-1,-hx-0.1,y+1.5,0);b.bot(glass,0.06,0.5,D-1,hx+0.1,y+1.5,0);if(i>0||!fl.ramp)b.bot(glass,W-1,0.5,0.06,0,y+1.5,hz+0.1);
      b.bot(accn,W+0.2,0.28,D+0.2,0,y+FHg-0.28,0);}
    b.bot(roof,W+0.5,0.3,D+0.5,0,Hh,0);
    b.edges(W,Hh,D,0,Hh/2,0);
    // Decks, Stuetzen, Autos
    const xs=[];for(let x=-hx+1.2;x<=hx-rs-0.8;x+=Math.max(2.6,(W-rs-2)/3))xs.push(x);
    for(let i=0;i<n;i++){const y=FHg*i;
      b.bot(slab,W-0.4-rs,i?0.3:0.1,D-0.4,-rs/2,i?y-0.3:0,0);
      if(fl.cols)xs.forEach(x=>[-hz+1.0,hz-1.0].forEach(z=>b.bot(col,0.5,FHg-0.3,0.5,x,y,z)));
      let ci=0;const nx=Math.max(1,Math.floor((W-rs-3.2)/2.6));
      for(let k=0;k<nx;k++){const x=-hx+1.8+k*2.6;
        [-1,1].forEach(s=>{if(((k+i+(s>0?1:0))%4)!==3)addCar(b,cars[(ci++)%cars.length],dk,x,s*(hz-2.4),0,0.95);});
        b.bot(line,0.1,0.02,3.4,x+1.3,y+0.1,-(hz-2.4));b.bot(line,0.1,0.02,3.4,x+1.3,y+0.1,hz-2.4);}
      if(fl.ramp&&i<n-1){const up=i%2===0;const z0=up?hz-0.8:-hz+0.8,z1=up?-hz+0.8:hz-0.8;b.slope(ramp,2.8,0.3,hx-1.5,y,z0,hx-1.5,y+FHg,z1);b.bot(slab,2.8,0.3,0.9,hx-1.5,y+FHg-0.3,z1);}
    }
    b.bot(asph,W+1,0.06,3.4,0,0,hz+1.8);
    // Einfahrt / Schild (Tatbestand)
    const ps=b.fx('tat',0x2f7bd6);b.bot(b.fx('tat',0xdddddd),0.15,3.6,0.15,hx-3.6,0,hz+0.9);b.bot(ps,1.2,1.2,0.15,hx-3.6,3.4,hz+0.9);
    b.sign('P',1.0,1.0,hx-3.6,4.0,hz+1.0,0,null,'#ffffff',110);
    b.bot(b.fx('tat',0xe84a4a),2.0,0.12,0.12,hx-1.5,1.2,hz+0.8);
    // Rettungswege: zwei Treppenraeume
    if(fl.stairs){const rg=b.fx('rw',GC('R')),rsh=b.fx('rw',GC('R'),{mat:TR({opacity:0.22})});
      [-1,1].forEach(s=>stairsBox(b,rg,rsh,-hx+1.4,s*(hz-1.4),2.4,2.4,n,FHg,0));
      b.bot(rg,0.12,0.4,1.0,-hx+0.2,2.3,hz-1.4);}
    // trockene Loeschwasserleitung
    if(fl.troc){const tr=b.fx('troc',GC('L'));b.cyl(tr,0.1,0.1,Hh+0.4,8,-hx+3.0,0,-hz+0.5);for(let i=0;i<n;i++)b.bot(tr,0.5,0.6,0.3,-hx+3.0,FHg*i+0.7,-hz+0.8);b.bot(tr,0.7,0.8,0.4,-hx+3.0,0.3,-hz-0.35);}
    // Abluft
    if(fl.abl){const ab=b.fx('abl',GC('A')),abD=b.fx('abl',0x3b4558),abS=b.fx('abl',GC('A'),{mat:TR({opacity:0.3})});
      b.bot(ab,2.4,1.2,1.6,-1,Hh+0.3,0);b.cyl(abD,0.6,0.6,0.12,12,-1,Hh+1.5,0);
      const px=-1;b.part(abD,new THREE.BoxGeometry(1.1,0.1,0.22),px,Hh+1.7,0,(m,t)=>{m.rotation.y=t*4;});b.part(abD,new THREE.BoxGeometry(0.22,0.1,1.1),px,Hh+1.7,0,(m,t)=>{m.rotation.y=t*4;});
      b.bot(abS,0.6,Hh,0.6,-1,0,0);for(let i=0;i<n;i++)b.bot(ab,W-rs-6,0.3,0.34,-rs/2+1.5,FHg*i+2.35,0);}
    // Entrauchung
    if(fl.entr){const en=b.fx('entr',GC('A'));for(let i=0;i<n;i++)[-3,0.5,4].forEach(x=>{b.bot(en,1.4,0.45,0.2,x,FHg*i+2.3,-hz+0.25);b.geo(en,new THREE.ConeGeometry(0.22,0.6,5),x,FHg*i+2.95,-hz+0.5);});}
    // BMA
    if(fl.bma){const bm=b.fx('bma',GC('R'));for(let i=0;i<n;i++)[-3,0,3].forEach(x=>[-1.5,1.5].forEach(z=>b.cyl(bm,0.28,0.28,0.12,10,x,FHg*(i+1)-0.45,z)));}
    // Funk
    if(fl.funk){const fk=b.fx('funk',GC('L'));b.cyl(fk,0.07,0.07,3.2,6,hx-1.2,Hh,hz-1.2);[0.8,1.6,2.4].forEach(y=>b.bot(fk,0.9-y*0.2,0.07,0.07,hx-1.2,Hh+y,hz-1.2));
      b.bot(fk,0.4,0.3,0.3,hx-1.2,Hh+3.2,hz-1.2);}
    // Brandabschnitt
    if(fl.ba){const ba=b.fx('ba',GC('A'),{ghost:0.95});for(let i=0;i<n;i++){const y=FHg*i+0.25;
      b.bot(ba,W-0.6,0.1,0.14,0,y,hz-0.3);b.bot(ba,W-0.6,0.1,0.14,0,y,-hz+0.3);b.bot(ba,0.14,0.1,D-0.6,hx-0.3,y,0);b.bot(ba,0.14,0.1,D-0.6,-hx+0.3,y,0);}}
    b.fin(grp);
    const Y=(k)=>Math.min(Hh-1.0,k);
    b.hotV[key]={tat:[hx-3.6,4.2,hz+1],rw:[-hx+1.4,1.7,-hz+1.4],abl:[-1,Hh+2.1,0],entr:[0.5,FHg*(n-1)+2.6,-hz+0.3],bma:[3,FHg+2.4,2],troc:[-hx+3.0,FHg*(n-1)+1.0,-hz+0.8],funk:[hx-1.2,Hh+3.6,hz-1.2],ba:[hx-0.3,0.5,-hz+0.6]};
    b.vH=b.vH||{};b.vH[key]=Hh;
    grp.visible=false;
  };
  make('K',7,6.5,1,{ramp:false,cols:false,stairs:false});
  make('M',12,9.5,2,{ramp:true,cols:true,stairs:true,troc:true,abl:true,ba:true});
  make('G',16,12,3,{ramp:true,cols:true,stairs:true,troc:true,abl:true,entr:true,bma:true,funk:true,ba:true});
  b.cur=b.group;b.variant='G';b.variants.G.visible=true;
  b.hotpos=b.hotV.G;
  b.pill=[0,14,0];b.view={c:[0,4.5,0],rad:15,hot:0.55,el:0.5};b.pick=[17,13,16,0,6.5,0.5];b.fp=[8.5,7.5];
  b.vview={K:{c:[0,1.8,0],rad:7},M:{c:[0,3.2,0],rad:11},G:{c:[0,4.5,0],rad:15}};
}
function bKra(b){
  const FHk=3,Hh=12;
  const wall=b.sm(0xf2f5fa),band=b.sm(0xff7a9a),glass=b.sm(0x35597d,0.9),roof=b.sm(0xdde3ee);
  const slab=b.m(0xdfe5ee),inW=b.m(0xeef1f7),bed=b.m(0xffffff),bl=b.m(0xff9db4),pk=b.m(0xff5c80),dk=b.m(0x3a4152);
  const MZ=-2.5;
  b.bot(wall,16,Hh,0.3,0,0,MZ+3.5);b.bot(wall,16,Hh,0.3,0,0,MZ-3.5);b.bot(wall,0.3,Hh,7,-8,0,MZ);b.bot(wall,0.3,Hh,7,8,0,MZ);
  for(let i=0;i<4;i++){const y=FHk*i;for(let k=0;k<7;k++){const x=-6.9+k*2.3;b.bot(glass,1.4,1.1,0.1,x,y+1.0,MZ-3.6);if(Math.abs(x)>3.5)b.bot(glass,1.4,1.1,0.1,x,y+1.0,MZ+3.6);}
    b.bot(band,16.2,0.28,7.2,0,y+FHk-0.28,MZ);}
  b.bot(roof,16.6,0.35,7.6,0,Hh,MZ);
  // Mittelbau
  b.bot(wall,6,9,0.3,0,0,MZ+3.5+5);b.bot(wall,0.3,9,5,-3,0,MZ+3.5+2.5);b.bot(wall,0.3,9,5,3,0,MZ+3.5+2.5);
  b.bot(glass,4.4,2.2,0.1,0,0.8,MZ+3.5+5.1);
  for(let i=0;i<3;i++){b.bot(band,6.2,0.28,5.2,0,FHk*i+FHk-0.28,MZ+3.5+2.5);}
  b.bot(roof,6.4,0.35,5.4,0,9,MZ+3.5+2.5);
  b.bot(band,5,0.3,2.2,0,3.2,MZ+3.5+5.9);b.bot(dk,0.2,3.2,0.2,-2.3,0,MZ+3.5+6.8);b.bot(dk,0.2,3.2,0.2,2.3,0,MZ+3.5+6.8);
  b.edges(16,Hh,7,0,Hh/2,MZ);b.edges(6,9,5,0,4.5,MZ+6);
  b.bot(slab,15.6,0.1,6.6,0,0,MZ);b.bot(slab,5.6,0.1,4.6,0,0,MZ+6);
  for(let i=1;i<4;i++){b.bot(slab,15.6,0.25,6.6,0,FHk*i-0.25,MZ);if(i<3)b.bot(slab,5.6,0.25,4.6,0,FHk*i-0.25,MZ+6);}
  for(let i=0;i<4;i++){const y=FHk*i;b.bot(inW,13,2.7,0.12,0,y,MZ-0.5);for(let k=0;k<6;k++)b.bot(bed,1.0,0.4,2.0,-6.2+k*2.4,y+0.1,MZ-2.2),b.bot(bl,1.0,0.1,1.2,-6.2+k*2.4,y+0.5,MZ-2.5);}
  // Kreuz
  b.bot(pk,0.7,3.6,0.6,0,Hh+0.35,MZ);b.bot(pk,2.6,0.7,0.6,0,Hh+1.8,MZ);
  b.bot(pk,0.5,2,0.1,0,5.5,MZ+3.5+5.15);b.bot(pk,1.5,0.5,0.1,0,6.3,MZ+3.5+5.15);
  // Features
  const rg=b.fx('rw',GC('R')),rsh=b.fx('rw',GC('R'),{mat:TR({opacity:0.22})});
  [-1,1].forEach(s=>stairsBox(b,rg,rsh,s*6.7,MZ,2.4,2.6,4,FHk,0));
  [-1,1].forEach(s=>{b.bot(rg,0.12,0.4,1.1,s*8.05,2.6,MZ);});
  const ba=b.fx('ba',GC('A'),{ghost:0.95});for(let i=0;i<4;i+=3){const y=FHk*i+0.2;b.bot(ba,15.6,0.1,0.14,0,y,MZ+3.2);b.bot(ba,15.6,0.1,0.14,0,y,MZ-3.2);b.bot(ba,0.14,0.1,6.4,7.8,y,MZ);b.bot(ba,0.14,0.1,6.4,-7.8,y,MZ);}
  const pad=b.fx('auf',GC('L'),{mat:TR({opacity:0.5})});b.bot(pad,3.6,0.05,9.0,6.8,0,MZ+7.2);
  addTruck(b,b.fx('auf',0xe84a4a),b.fx('auf',0x333a48),6.8,MZ+7.2,0,null);
  b.fx('tat',0xffffff);
  b.fin();
  b.hotpos={tat:[0,Hh+2.2,MZ],rw:[-6.7,5.4,MZ],ba:[7.6,0.5,MZ-2.6],auf:[6.8,3.4,MZ+7.2]};
  b.pill=[0,Hh+4.4,MZ];b.view={c:[0,5,0.5],rad:14.5,hot:0.55,el:0.48};b.pick=[17,Hh+3,14.5,0,(Hh+3)/2,1.5];b.fp=[8.5,9];
}
function bWoh(b){
  const W=8,D=7,F=2.6,Hh=5.2;
  const wall=b.sm(0xf6ecd8),roof=b.sm(0xc0492f),glass=b.sm(0x3a6188,0.9),trim=b.sm(0xffffff),door=b.sm(0x7a4b2a);
  const slab=b.m(0xd8cdb4),inW=b.m(0xfbf5e8),bed=b.m(0xffffff),bl=b.m(0x6ba3d6),sofa=b.m(0x8e6bd8),tb=b.m(0xa9774a),fence=b.m(0xe9dcc0),hedge=b.m(0x4d9a4f);
  const hz=D/2,hx=W/2;
  b.bot(wall,W,Hh,0.3,0,0,-hz);b.bot(wall,0.3,Hh,D,-hx,0,0);b.bot(wall,0.3,Hh,D,hx,0,0);
  b.bot(wall,3.4,F,0.3,-2.3,0,hz);b.bot(wall,3.4,F,0.3,2.3,0,hz);b.bot(wall,1.2,0.5,0.3,0,2.1,hz);b.bot(wall,W,Hh-F,0.3,0,F,hz);
  b.bot(door,1.0,2.1,0.1,0,0,hz+0.02);
  [-2.4,2.4].forEach(x=>{b.bot(glass,1.2,1.1,0.1,x,0.9,hz+0.1);b.bot(glass,1.2,1.1,0.1,x,F+0.9,hz+0.1);b.bot(trim,1.5,0.1,0.14,x,0.8,hz+0.1);});
  b.bot(glass,1.2,1.1,0.1,0,F+0.9,hz+0.1);
  [-1.5,1.5].forEach(z=>{b.bot(glass,0.1,1.1,1.2,-hx-0.1,0.9,z);b.bot(glass,0.1,1.1,1.2,hx+0.1,F+0.9,z);b.bot(glass,0.1,1.1,1.2,-hx-0.1,F+0.9,z);});
  b.bot(trim,3,0.15,1.4,0,0,hz+0.9);
  // Giebel
  const sh=new THREE.Shape();sh.moveTo(-hz-0.0,0);sh.lineTo(hz,0);sh.lineTo(0,2.6);sh.lineTo(-hz,0);
  [-hx,hx].forEach(x=>{const g=new THREE.ExtrudeGeometry(sh,{depth:0.3,bevelEnabled:false});b.geo(wall,g,x-0.15,Hh,0,0,Math.PI/2,0);});
  const ang=Math.atan2(2.6,hz+0.4),L=Math.hypot(hz+0.4,2.6)+0.1;
  b.box(roof,W+0.9,0.22,L,0,Hh+1.3+0.12,(hz+0.4)/2,0,ang,0);b.box(roof,W+0.9,0.22,L,0,Hh+1.3+0.12,-(hz+0.4)/2,0,-ang,0);
  b.bot(b.m(0x9a8f7c),0.8,1.8,0.8,2.6,Hh+0.4,-1.5);
  b.edges(W,Hh,D,0,Hh/2,0);
  // innen
  b.bot(slab,W-0.4,0.1,D-0.4,0,0,0);b.bot(slab,W-0.4,0.25,D-0.4,0,F-0.25,0);
  b.bot(inW,0.12,2.3,3.2,0.9,0.1,-1.7);b.bot(inW,0.12,2.3,3.2,0.9,F,-1.7);
  b.bot(bed,1.6,0.4,2.0,2.8,F+0.1,-2.2);b.bot(bl,1.6,0.1,1.2,2.8,F+0.5,-2.5);b.bot(sofa,2.2,0.7,0.9,-2.6,0.1,-2.7);b.bot(tb,1.2,0.6,1.2,2.8,0.1,-1.8);b.bot(tb,1.0,0.6,1.6,-2.6,F+0.1,-2.5);
  // Kamin/Rest
  // Feature: Rettungsweg (Treppe innen + Anleiterstelle)
  const rw=b.fx('rw',GC('R')),anl=b.fx('rw',GC('R'));
  b.slope(rw,0.9,0.14,-3.2,0.05,2.4,-0.2,F,2.4);b.bot(rw,0.9,0.14,0.8,0.2,F-0.12,2.4);
  b.bot(anl,1.5,0.1,0.14,2.4,F+0.25,hz+0.16);b.bot(anl,1.5,0.1,0.14,2.4,F+1.5,hz+0.16);b.bot(anl,0.1,1.3,0.14,1.7,F+0.25,hz+0.16);b.bot(anl,0.1,1.3,0.14,3.1,F+0.25,hz+0.16);
  [1.9,2.9].forEach(x=>b.slope(anl,0.08,0.08,x,0,hz+2.2,x,F+0.2,hz+0.35));
  for(let k=0;k<6;k++){const t=(k+0.5)/6;b.bot(anl,1.1,0.05,0.05,2.4,F*t*0.95,hz+2.2-1.85*t);}
  // tragende Bauteile
  const tw=b.fx('tw',GC('A'),{ghost:0.9});[[-hx,-hz],[hx,-hz],[-hx,hz],[hx,hz]].forEach(c=>b.bot(tw,0.28,Hh,0.28,c[0],0,c[1]));
  b.bot(tw,W+0.2,0.2,0.2,0,F-0.1,hz);b.bot(tw,W+0.2,0.2,0.2,0,F-0.1,-hz);b.bot(tw,0.2,0.2,D+0.2,-hx,F-0.1,0);b.bot(tw,0.2,0.2,D+0.2,hx,F-0.1,0);
  // Garage angebaut (Geist)
  const gk=b.fx('gk',0x9aa3b2,{ghost:0.55});b.bot(gk,3.6,2.6,D-0.4,hx+1.8,0,0);b.bot(gk,3.9,0.2,D,hx+1.8,2.6,0);
  b.label('angebaut → GK 2',hx+1.8,3.7,0,1.1,'#1c2433','rgba(255,226,122,.95)');
  // Aufstellflaeche
  const pad=b.fx('auf',GC('L'),{mat:TR({opacity:0.5})});b.bot(pad,8.5,0.05,3.3,-0.3,0,hz+3.9);
  addTruck(b,b.fx('auf',0xe84a4a),b.fx('auf',0x333a48),-1,hz+4,Math.PI/2,[2.4,-1.2,5.0]);
  // Garten
  b.bot(fence,10.5,0.9,0.1,0,0,hz+7.4);b.bot(hedge,0.5,0.8,12,-5.6,0,hz+1.4);b.bot(hedge,0.5,0.8,12,5.6+4,0,hz+1.4);
  b.fin();
  b.hotpos={tat:[0,Hh+3.6,0],rw:[-1.7,1.6,2.4],tw:[-hx,2.8,hz],gk:[hx+1.8,1.5,0],auf:[-1,2.9,hz+4]};
  b.pill=[0,Hh+4.8,0];b.view={c:[1,2.8,2],rad:12,hot:0.6,el:0.55};b.pick=[W+5,Hh+3,D+9,2,(Hh+3)/2,3];b.fp=[9,10];
}
/* ===== Szene: Viertel, Kamera, Rendering ===== */
const SLOTS={hoch:[-26,-26,0,0],vers:[0,-26,0,0],kra:[26,-26,0,0],woh:[-26,0,0,-1.5],verk:[26,0,0,-1.5],beh:[-26,26,-1,0],ind:[0,26,0,0],gar:[26,26,0,0]};
const BUILDERS={hoch:bHoch,verk:bVerk,vers:bVers,beh:bBeh,ind:bInd,gar:bGar,kra:bKra,woh:bWoh};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const easeIO=t=>t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function rng(seed){let s=seed;return()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296;};}
function createScene(canvas,cb){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const scene=new THREE.Scene();const SKY=0xcfe6f7;scene.background=new THREE.Color(SKY);scene.fog=new THREE.Fog(SKY,140,330);
  const camera=new THREE.PerspectiveCamera(38,1,0.5,600);
  scene.add(new THREE.HemisphereLight(0xeaf4ff,0x8a9a78,1.0));
  const sun=new THREE.DirectionalLight(0xfff1d6,0.9);sun.position.set(-40,70,50);scene.add(sun);
  // Himmel
  { const g=new THREE.SphereGeometry(420,16,10),cols=[],p=g.attributes.position,top=new THREE.Color(0x6fb2ec),hor=new THREE.Color(SKY);
    for(let i=0;i<p.count;i++){const y=p.getY(i)/420;const c=hor.clone().lerp(top,clamp((y+0.05)*1.6,0,1));cols.push(c.r,c.g,c.b);}
    g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));scene.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false})));}
  const Lm=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
  const addBox=(w,hh,d,x,y,z,mat,par)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),mat);m.position.set(x,y,z);(par||scene).add(m);return m;};
  // Boden
  const grass=Lm(0x8ccf74),pave=Lm(0xe7e2d6),road=Lm(0x4b5361),lane=Lm(0xf1f1f1),parkG=Lm(0x78c15f);
  const gr=new THREE.Mesh(new THREE.PlaneGeometry(900,900),grass);gr.rotation.x=-Math.PI/2;scene.add(gr);
  [-26,0,26].forEach(x=>[-26,0,26].forEach(z=>{const park=(x===0&&z===0);addBox(21,0.06,21,x,0.03,z,park?parkG:pave);}));
  [-13,13].forEach(v=>{addBox(300,0.08,5,0,0.01,v,road);addBox(5,0.08,300,v,0.012,0,road);});
  { const dg=[];const lg=(x,z,w,d)=>{const g=new THREE.BoxGeometry(w,0.02,d);g.translate(x,0.07,z);dg.push(g);};
    [-13,13].forEach(v=>{for(let i=-70;i<=70;i+=4){if(Math.abs(Math.abs(i)-13)<3.5||Math.abs(i+0)<0.1)continue;lg(i,v,2,0.18);lg(v,i,0.18,2);}});
    [-13,13].forEach(v=>{ // Zebrastreifen
      [-1,1].forEach(s=>{for(let k=-2;k<=2;k++){lg(v+k*0.9,s*16.2,0.5,2.4);lg(s*16.2,v+k*0.9,2.4,0.5);}});});
    scene.add(new THREE.Mesh(mergeGeoms(dg),lane)); }
  // Park
  { const pond=Lm(0x6bb7e8),stone=Lm(0xcfc9ba),bench=Lm(0xa9774a);
    const pg=new THREE.Mesh(new THREE.CylinderGeometry(4.2,4.2,0.12,20),pond);pg.position.set(0,0.1,0);scene.add(pg);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(4.3,0.28,5,24),stone);ring.rotation.x=Math.PI/2;ring.position.set(0,0.2,0);scene.add(ring);
    addBox(1.2,1.2,1.2,0,0.7,0,stone);addBox(0.5,2.0,0.5,0,1.8,0,stone);
    const fn=new THREE.Mesh(new THREE.SphereGeometry(0.55,6,5),Lm(0xbfe6ff,{transparent:true,opacity:0.8}));fn.position.set(0,3.1,0);scene.add(fn);
    addBox(2.2,0.03,21,0,0.075,0,stone);addBox(21,0.03,2.2,0,0.075,0,stone);
    [[-6,3],[6,3],[-6,-3],[6,-3]].forEach(p=>{addBox(0.5,0.1,2.2,p[0],0.5,p[1],bench);addBox(0.5,0.1,0.14,p[0]-0.2,0.8,p[1],bench);addBox(0.1,0.4,2.2,p[0]+0.25,0.35,p[1],bench);});
    const lab=labelTex('Park','#1c2433','rgba(255,255,255,.85)',34);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:lab.tex,transparent:true,depthTest:false}));sp.scale.set(2.4*lab.ar,2.4,1);sp.position.set(0,6.0,0);sp.renderOrder=5;sp.visible=false; }
  // Gebaeude
  const B={},boxes=[];
  BUILDINGS.forEach(def=>{const b=newB(def,scene);BUILDERS[def.id](b);const s=SLOTS[def.id];b.group.position.set(s[0]+s[2],0,s[1]+s[3]);b.slot=s;B[def.id]=b;
    const pk=b.pick;const pm=new THREE.Mesh(new THREE.BoxGeometry(pk[0],pk[1],pk[2]),new THREE.MeshBasicMaterial({visible:false}));
    pm.position.set(b.group.position.x+pk[3],pk[4],b.group.position.z+pk[5]);pm.userData.bid=def.id;scene.add(pm);boxes.push(pm);b.pickMesh=pm;
    const sh=addBox(b.fp[0]*2+1.5,0.02,b.fp[1]*2+1.5,b.group.position.x+0.6,0.075,b.group.position.z-0.4,new THREE.MeshBasicMaterial({color:0x2a3a2a,transparent:true,opacity:0.16,depthWrite:false}));
    // Pflaster-/Rasenkante
  });
  // Bäume
  { const R=rng(7),pts=[];
    const free=(x,z)=>{for(const k in B){const b=B[k];const dx=Math.abs(x-b.group.position.x),dz=Math.abs(z-b.group.position.z);if(dx<b.fp[0]+3.4&&dz<b.fp[1]+3.4)return false;}
      if(Math.abs(x)<4.8&&Math.abs(z)<4.8)return false;if(Math.abs(Math.abs(x)-13)<3.2||Math.abs(Math.abs(z)-13)<3.2)return false;return true;};
    for(let i=0;i<900&&pts.length<120;i++){const x=(R()-0.5)*84,z=(R()-0.5)*84;if(Math.abs(x)>38||Math.abs(z)>38)continue;if(!free(x,z))continue;
      const inPark=Math.abs(x)<10.5&&Math.abs(z)<10.5;if(!inPark&&R()<0.55)continue;pts.push([x,z,0.8+R()*0.6]);}
    for(let i=0;i<260&&pts.length<230;i++){const a=R()*Math.PI*2,r=48+R()*70;pts.push([Math.cos(a)*r,Math.sin(a)*r,1+R()*0.9]);}
    const cone=new THREE.InstancedMesh(new THREE.ConeGeometry(1.5,4.2,6),Lm(0xffffff),pts.length),ball=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.5,0),Lm(0xffffff),pts.length),trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22,0.3,1.8,5),Lm(0x7a5a3a),pts.length);
    const o=new THREE.Object3D(),gc=[0x4fa05a,0x5eb36a,0x3f8f50,0x6cc27a],cc=new THREE.Color();let nc=0,nb=0;
    pts.forEach((p,i)=>{o.position.set(p[0],0.9*p[2],p[1]);o.scale.set(p[2],p[2],p[2]);o.rotation.set(0,i,0);o.updateMatrix();trunk.setMatrixAt(i,o.matrix);
      const isCone=i%3===0;o.position.y=(isCone?3.4:3.0)*p[2];o.updateMatrix();cc.setHex(gc[i%4]);
      if(isCone){cone.setMatrixAt(nc,o.matrix);cone.setColorAt(nc,cc);nc++;}else{ball.setMatrixAt(nb,o.matrix);ball.setColorAt(nb,cc);nb++;}});
    cone.count=nc;ball.count=nb;[cone,ball,trunk].forEach(m=>{m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;scene.add(m);}); }
  // Autos auf den Strassen
  const cars=[];
  [{ax:'x',l:14.2,d:1,p:-60},{ax:'x',l:11.8,d:-1,p:30},{ax:'x',l:-11.8,d:1,p:-15},{ax:'x',l:-14.2,d:-1,p:55},{ax:'z',l:14.2,d:-1,p:10},{ax:'z',l:11.8,d:1,p:-45},{ax:'z',l:-11.8,d:-1,p:40}].forEach((c,i)=>{
    const g=new THREE.Group(),col=[0xe86a6a,0x4f86f0,0xf2f2f2,0xe8c24a,0x2db8a0,0x8e6bd8,0xff9a3c][i];
    const bd=new THREE.Mesh(new THREE.BoxGeometry(3.4,0.9,1.7),Lm(col));bd.position.y=0.6;g.add(bd);const cb=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.7,1.5),Lm(0x2d3644));cb.position.set(-0.1,1.3,0);g.add(cb);
    if(c.ax==='x'){g.position.set(c.p,0.05,c.l);g.rotation.y=c.d>0?0:Math.PI;}else{g.position.set(c.l,0.05,c.p);g.rotation.y=c.d>0?-Math.PI/2:Math.PI/2;}
    g.userData={ax:c.ax,dir:c.d,sp:5+i*0.8};scene.add(g);cars.push(g);});
  // Wolken
  const clouds=[];{const R=rng(3),cm=Lm(0xffffff,{transparent:true,opacity:0.92});
    for(let i=0;i<7;i++){const g=new THREE.Group();for(let k=0;k<4;k++){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(5+R()*4,1),cm);s.position.set(k*6-9,R()*2,R()*4);s.scale.y=0.55;g.add(s);}
      g.position.set((R()-0.5)*260,70+R()*35,(R()-0.5)*200-40);scene.add(g);clouds.push(g);}}
  // Ringe fuer Erfolgsanimation
  const fx=[];
  /* ---------- Kamera ---------- */
  const cam={t:V3(0,5,0),r:100,az:0.6,el:0.62};let tween=null,aspect=1,W=1,Hc=1;
  const fitR=(rad)=>{const vf=camera.fov*Math.PI/180,hf=Math.atan(Math.tan(vf/2)*aspect);return rad/Math.sin(Math.min(vf/2,hf));};
  const overview=()=>({t:V3(0,aspect<1?9:4,2),r:fitR(aspect<1?50:50),az:0.55,el:aspect<1?0.85:0.72});
  function applyCam(){const ce=Math.cos(cam.el);camera.position.set(cam.t.x+cam.r*ce*Math.sin(cam.az),cam.t.y+cam.r*Math.sin(cam.el),cam.t.z+cam.r*ce*Math.cos(cam.az));camera.lookAt(cam.t);}
  function flyTo(g,dur){const f={t:cam.t.clone(),r:cam.r,az:cam.az,el:cam.el};let da=g.az-f.az;da=Math.atan2(Math.sin(da),Math.cos(da));
    tween={f:f,g:{t:g.t.clone(),r:g.r,az:f.az+da,el:g.el},t0:performance.now(),d:(dur||1.3)*1000};}
  function bView(b,zoom){const v=b.vview&&b.vview[b.variant]?b.vview[b.variant]:b.view;const c=b.group.position.clone().add(V3(v.c[0],v.c[1],v.c[2]));
    return {t:c,r:fitR(v.rad)*(zoom||1),az:cam.az,el:b.view.el||0.42};}
  /* ---------- Zustand ---------- */
  const track=new Map();let focus=null;
  function hotWorld(b,hid){const hp=b.hotpos[hid];if(!hp)return null;return V3(b.group.position.x+hp[0],hp[1],b.group.position.z+hp[2]);}
  const api={
    B,onPick:null,
    home(dur){flyTo(overview(),dur);},
    view(bid,opts){opts=opts||{};const b=B[bid];if(!b)return;let g=bView(b,opts.zoom);
      if(opts.hid){const w=hotWorld(b,opts.hid);if(w){g.t=g.t.clone().lerp(w,b.view.hot||0.5);g.r=g.r*(opts.zr||0.62);}}
      flyTo(g,opts.dur);},
    focus(bid,xray){focus=bid;Object.keys(B).forEach(k=>{const b=B[k];b.xrT=(k===bid&&xray)?1:0;b.dimT=(bid&&k!==bid)?1:0;});},
    dimAll(on){Object.keys(B).forEach(k=>{B[k].dimT=on?1:0;});},
    setHL(bid,keys,goal){const b=B[bid];if(!b)return;b.hl={};b.hasHL=false;if(keys){keys.forEach(k=>{b.hl[(b.hotV?b.variant+'_':'')+k]=new THREE.Color(goal?GOALS[goal].hex:0xffffff);b.hasHL=true;});}b._clr=true;},
    clearHL(){Object.keys(B).forEach(k=>{if(B[k].hasHL||Object.keys(B[k].hl).length){B[k].hl={};B[k].hasHL=false;B[k]._clr=true;}});},
    flash(bid,col,bad){const b=B[bid];if(!b)return;b.glow=1;b.glowCol.set(col||0xffffff);
      const rg=new THREE.Mesh(new THREE.RingGeometry(1,1.25,40),new THREE.MeshBasicMaterial({color:col||0xffffff,transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide}));
      rg.rotation.x=-Math.PI/2;rg.position.set(b.group.position.x,0.3,b.group.position.z);scene.add(rg);fx.push({m:rg,t:0,r0:Math.max(b.fp[0],b.fp[1])});},
    hover(bid){Object.keys(B).forEach(k=>{B[k].hoverT=(k===bid)?0.35:0;});},
    variant(v){const b=B.gar;b.variant=v;Object.keys(b.variants).forEach(k=>b.variants[k].visible=(k===v));b.hotpos=b.hotV[v];},
    track(key,el,spec){if(el)track.set(key,{el,spec});else track.delete(key);},
    pickAt(x,y){const r=canvas.getBoundingClientRect();const nd=new THREE.Vector2((x-r.left)/r.width*2-1,-((y-r.top)/r.height)*2+1);
      const rc=new THREE.Raycaster();rc.setFromCamera(nd,camera);const hit=rc.intersectObjects(boxes,false);return hit.length?hit[0].object.userData.bid:null;},
    resize(w,hh){W=Math.max(1,w);Hc=Math.max(1,hh);aspect=W/Hc;renderer.setSize(W,Hc,false);camera.aspect=aspect;camera.fov=aspect<0.9?44:38;camera.updateProjectionMatrix();api.fitted&&api.fitted();},
    dispose(){cancelAnimationFrame(raf);renderer.dispose();}
  };
  /* ---------- Eingabe ---------- */
  const ptrs=new Map();let moved=0,t0=0,p0=0,r0=0,downId=-1;
  canvas.style.touchAction='none';
  canvas.addEventListener('pointerdown',e=>{try{canvas.setPointerCapture(e.pointerId);}catch(_){}
    ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptrs.size===1){moved=0;t0=performance.now();}tween=null;
    if(ptrs.size===2){const a=[...ptrs.values()];p0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);r0=cam.r;moved=99;}});
  canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(ptrs.size===1){moved+=Math.abs(dx)+Math.abs(dy);if(moved>6){cam.az-=dx*0.0075;cam.el=clamp(cam.el+dy*0.006,0.08,1.42);}}
    else if(ptrs.size===2){const a=[...ptrs.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);cam.r=clamp(r0*p0/Math.max(10,d),7,190);}});
  const up=e=>{if(!ptrs.has(e.pointerId))return;const was=ptrs.size;ptrs.delete(e.pointerId);
    if(e.type==='pointerup'&&was===1&&moved<8&&performance.now()-t0<700){const bid=api.pickAt(e.clientX,e.clientY);api.onPick&&api.onPick(bid);}};
  canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',e=>{e.preventDefault();tween=null;cam.r=clamp(cam.r*Math.exp(e.deltaY*0.0012),7,190);},{passive:false});
  /* ---------- Render ---------- */
  const DIMC=new THREE.Color(0xaebccb),tmp=new THREE.Color();let last=performance.now(),T=0,raf=0;const v4=V3(0,0,0);
  function updateB(b,dt){
    b.xr+=(b.xrT-b.xr)*Math.min(1,dt*5);if(Math.abs(b.xrT-b.xr)<0.003)b.xr=b.xrT;
    b.dim+=(b.dimT-b.dim)*Math.min(1,dt*5);if(Math.abs(b.dimT-b.dim)<0.003)b.dim=b.dimT;
    b.shell.forEach(m=>{const op=m.userData.op*(1-b.xr)+Math.min(m.userData.op,0.1)*b.xr;if(Math.abs(m.opacity-op)>0.002){m.opacity=op;m.depthWrite=op>0.7;}});
    b.lineMat.opacity=b.xr*0.6;
    b.ghosts.forEach(m=>{m.opacity=m.userData.ghost*b.xr;m.visible=b.xr>0.02;});
    b.sprites.forEach(s=>{s.material.opacity=clamp((b.xr-0.4)*1.7,0,1);s.visible=b.xr>0.45;});
    if(b._dimA!==b.dim){b._dimA=b.dim;b.mats.forEach(m=>{m.color.copy(m.userData.base).lerp(DIMC,b.dim*0.7);});}
    b.glow=Math.max(0,b.glow-dt*0.9);const gl=Math.max(b.glow,b.hoverT||0);
    if(gl>0.001||b.hasHL||b._clr||b._gl>0.001){
      b.mats.forEach(m=>m.emissive.setRGB(b.glowCol.r*gl*0.6,b.glowCol.g*gl*0.6,b.glowCol.b*gl*0.6));
      if(b.hasHL){const k=0.5+0.3*Math.sin(T*6);for(const key in b.hl){const c=b.hl[key];(b.feats[key]||[]).forEach(m=>m.emissive.setRGB(c.r*k+b.glowCol.r*gl*0.6,c.g*k+b.glowCol.g*gl*0.6,c.b*k+b.glowCol.b*gl*0.6));}}
      b._clr=false;b._gl=gl;}
    b.anim.forEach(a=>a.fn(a.m,T));
  }
  function frame(now){raf=requestAnimationFrame(frame);if(document.hidden)return;const dt=Math.min(0.06,(now-last)/1000);last=now;T+=dt;
    if(tween){const k=clamp((now-tween.t0)/tween.d,0,1),e=easeIO(k);cam.t.lerpVectors(tween.f.t,tween.g.t,e);cam.r=tween.f.r+(tween.g.r-tween.f.r)*e;cam.az=tween.f.az+(tween.g.az-tween.f.az)*e;cam.el=tween.f.el+(tween.g.el-tween.f.el)*e;if(k>=1)tween=null;}
    applyCam();
    for(const k in B)updateB(B[k],dt);
    cars.forEach(g=>{const u=g.userData;const p=g.position;if(u.ax==='x'){p.x+=u.dir*u.sp*dt;if(p.x>80)p.x=-80;if(p.x<-80)p.x=80;}else{p.z+=u.dir*u.sp*dt;if(p.z>80)p.z=-80;if(p.z<-80)p.z=80;}});
    clouds.forEach(c=>{c.position.x+=dt*1.2;if(c.position.x>170)c.position.x=-170;});
    for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.t+=dt;const k=f.t/1.1;const s=f.r0+k*14;f.m.scale.set(s,s,s);f.m.material.opacity=0.9*(1-k);if(k>=1){scene.remove(f.m);f.m.geometry.dispose();f.m.material.dispose();fx.splice(i,1);}}
    renderer.render(scene,camera);
    // HUD
    const hw=W/2,hh=Hc/2;
    track.forEach(tr=>{const sp=tr.spec,b=B[sp.bid];let pos;
      if(sp.kind==='pill'){pos=b.group.position;v4.set(pos.x+b.pill[0],b.pill[1],pos.z+b.pill[2]);}
      else{const hp=b.hotpos[sp.hid];if(!hp){tr.el.style.display='none';return;}v4.set(b.group.position.x+hp[0],hp[1],b.group.position.z+hp[2]);}
      v4.project(camera);if(v4.z>1||v4.z<-1){tr.el.style.display='none';return;}
      tr.el.style.display='';tr.el.style.transform='translate('+Math.round(v4.x*hw+hw)+'px,'+Math.round(-v4.y*hh+hh)+'px) translate(-50%,-50%)';});
  }
  api.fitted=()=>{if(!api._init){api._init=1;const o=overview();cam.t.copy(o.t);cam.r=o.r;cam.az=o.az;cam.el=o.el;}};
  api.cam=cam;api.info=renderer.info;
  raf=requestAnimationFrame(frame);
  return api;
}
/* ===== Oberflaeche: Stil + kleine Bausteine ===== */
const {useState,useEffect,useRef,useMemo,useCallback}=React;
const CSS=`
:root{--bg:#0c1320;--p:#131c2d;--p2:#1a2740;--p3:#233250;--t:#eaf0fa;--m:#9aabc7;--acc:#ffa412;--line:rgba(255,255,255,.09);--E:#ff7a4d;--A:#ffd23f;--R:#3ddc84;--L:#4cc3ff;--bad:#ff6b6b}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{background:var(--bg);color:var(--t);font-size:16px;line-height:1.4}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
.app{display:flex;flex-direction:column;height:100%;height:100dvh}
.stage{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;background:#cfe6f7}
.stage canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block;cursor:grab}
.hud{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.hw{position:absolute;left:0;top:0;pointer-events:none;will-change:transform}
.pill{pointer-events:auto;display:flex;align-items:center;gap:7px;min-height:34px;padding:4px 12px 4px 8px;border-radius:20px;background:rgba(12,19,32,.86);color:#fff;font-weight:700;font-size:13.5px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.35);border:1.5px solid rgba(255,255,255,.18);position:relative}
.pill:before{content:"";position:absolute;inset:-6px -4px}
.pill i{width:14px;height:14px;border-radius:50%;display:block;flex:none;box-shadow:0 0 0 2px rgba(255,255,255,.35)}
.pill.on{border-color:var(--acc)}
.pill.ok{background:#12623a}.pill.no{background:#7a1f1f}
.mk{pointer-events:auto;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:16px;color:#10151f;border:3px solid #fff;position:relative;box-shadow:0 0 0 0 currentColor,0 3px 10px rgba(0,0,0,.5);animation:pulse 1.8s infinite}
.mk:before{content:"";position:absolute;inset:-5px}
.mk.sel{transform:scale(1.22);border-color:var(--acc);animation:none;box-shadow:0 0 0 6px rgba(255,164,18,.35),0 0 18px 4px currentColor}
.mk.dimm{opacity:.28;animation:none}
.mk .ck{position:absolute;right:-6px;top:-6px;width:18px;height:18px;border-radius:50%;background:#fff;color:#0c8a45;display:grid;place-items:center}
@keyframes pulse{0%{box-shadow:0 0 0 0 currentColor,0 3px 10px rgba(0,0,0,.5)}70%{box-shadow:0 0 0 14px rgba(255,255,255,0),0 3px 10px rgba(0,0,0,.5)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0),0 3px 10px rgba(0,0,0,.5)}}
.tag{position:absolute;left:12px;top:12px;background:rgba(12,19,32,.82);color:#fff;border-radius:12px;padding:7px 12px;font-weight:800;font-size:14px;letter-spacing:.2px;pointer-events:none;display:flex;align-items:center;gap:8px}
.tag b{color:var(--acc)}
.note{position:absolute;left:12px;bottom:10px;background:rgba(12,19,32,.72);color:#d3deef;border-radius:8px;padding:4px 9px;font-size:12px;pointer-events:none}
.sbtns{position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:8px}
.sb{width:46px;height:46px;border-radius:14px;background:rgba(12,19,32,.86);color:#fff;display:grid;place-items:center;border:1.5px solid rgba(255,255,255,.18);box-shadow:0 2px 8px rgba(0,0,0,.3)}
.sb.on{background:var(--acc);color:#241600;border-color:#fff}
.score{position:absolute;left:12px;top:56px;background:rgba(12,19,32,.86);color:#fff;border-radius:12px;padding:6px 12px;font-weight:800;font-size:15px;display:flex;gap:10px;align-items:center;pointer-events:none}
.panel{flex:0 0 47%;max-height:52%;display:flex;flex-direction:column;background:var(--p);border-radius:20px 20px 0 0;margin-top:-16px;position:relative;z-index:2;box-shadow:0 -6px 24px rgba(0,0,0,.35);min-height:0}
.tabs{display:flex;gap:6px;padding:10px 10px 8px;flex:none}
.tab{flex:1;min-height:46px;border-radius:13px;background:var(--p2);color:var(--m);display:flex;align-items:center;justify-content:center;gap:7px;font-weight:700;font-size:14px;padding:0 6px}
.tab.on{background:var(--acc);color:#241600}
.tab svg{flex:none}
.body{flex:1;overflow-y:auto;padding:4px 14px 18px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
h1,h2,h3{margin:0}
h2{font-size:20px;line-height:1.2;margin:6px 0 6px}
h3{font-size:16px;margin:14px 0 6px}
p{margin:0 0 8px}
.mut{color:var(--m)}
.sm{font-size:14px}
.xs{font-size:12.5px}
.lg{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.gchip{display:flex;align-items:center;gap:7px;min-height:44px;padding:4px 12px 4px 6px;border-radius:22px;background:var(--p2);font-weight:700;font-size:14px;border:2px solid transparent;text-align:left}
.gchip.on{border-color:var(--acc)}
.gchip.off{opacity:.45}
.bd{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;font-weight:800;font-size:14px;color:#10151f;flex:none}
.bd.s{width:22px;height:22px;font-size:12px}
.bar{height:8px;border-radius:5px;background:var(--p3);overflow:hidden;margin:6px 0 4px}
.bar i{display:block;height:100%;background:var(--acc);border-radius:5px;transition:width .4s}
.bcard{display:flex;align-items:center;gap:12px;width:100%;min-height:58px;padding:8px 12px;margin:0 0 8px;border-radius:14px;background:var(--p2);text-align:left;border:2px solid transparent}
.bcard:active{background:var(--p3)}
.bcard .sw{width:12px;align-self:stretch;border-radius:6px;flex:none}
.bcard .tx{flex:1;min-width:0}
.bcard b{display:block;font-size:16px}
.bcard span.s{display:block;font-size:13px;color:var(--m)}
.cnt{font-size:13px;font-weight:700;color:var(--m);white-space:nowrap;display:flex;align-items:center;gap:4px}
.cnt.done{color:var(--acc)}
.back{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px 0 8px;border-radius:12px;background:var(--p2);font-weight:700;font-size:14px}
.row{display:flex;align-items:center;gap:8px}
.sp{flex:1}
.vs{display:inline-block;padding:2px 10px;border-radius:12px;font-weight:800;font-size:13px;color:#10151f}
.sw2{display:flex;background:var(--p2);border-radius:14px;padding:4px;gap:4px;margin:8px 0}
.sw2 button{flex:1;min-height:46px;border-radius:11px;font-weight:700;font-size:14px;color:var(--m);line-height:1.15}
.sw2 button small{display:block;font-weight:500;font-size:11.5px;opacity:.85}
.sw2 button.on{background:var(--acc);color:#241600}
.tgl{display:flex;align-items:center;gap:10px;min-height:44px;padding:0 12px;border-radius:12px;background:var(--p2);font-weight:700;font-size:14px}
.tgl .k{width:42px;height:24px;border-radius:12px;background:var(--p3);position:relative;transition:background .2s;flex:none}
.tgl .k:after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s}
.tgl.on .k{background:var(--acc)}.tgl.on .k:after{left:21px}
.chips{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0}
.hc{display:flex;align-items:center;gap:7px;min-height:44px;padding:4px 12px 4px 6px;border-radius:22px;background:var(--p2);font-size:14px;font-weight:600;border:2px solid transparent;text-align:left}
.hc.sel{border-color:var(--acc);background:var(--p3)}
.hc.dis{opacity:.4}
.hc.fnd .bd{box-shadow:0 0 0 2px var(--p),0 0 0 4px #fff}
.hc.dimm{opacity:.35}
.card{background:var(--p2);border-radius:16px;padding:12px 14px;margin:10px 0;border-left:6px solid var(--acc)}
.card h3{margin:0 0 6px;display:flex;align-items:center;gap:8px;font-size:17px}
.val{background:rgba(255,255,255,.07);border-radius:10px;padding:8px 10px;font-weight:700;font-size:15.5px;margin:6px 0}
.zl{display:flex;align-items:center;gap:8px;font-size:14.5px;font-weight:700;margin-top:8px}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:50px;padding:0 16px;border-radius:14px;background:var(--acc);color:#241600;font-weight:800;font-size:16px;margin:10px 0 0}
.btn.sec{background:var(--p3);color:var(--t)}
.btn:disabled{opacity:.4}
.opt{display:block;width:100%;min-height:52px;padding:10px 14px;margin:0 0 8px;border-radius:14px;background:var(--p2);text-align:left;font-weight:600;font-size:15.5px;border:2px solid transparent}
.opt:active{background:var(--p3)}
.opt.good{background:#14572f;border-color:var(--R)}
.opt.bad{background:#6b2222;border-color:var(--bad)}
.opt.fade{opacity:.55}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.grid3 .opt{margin:0;text-align:center;font-size:17px;font-weight:800}
.fb{border-radius:14px;padding:10px 14px;margin:8px 0;font-size:15px}
.fb.ok{background:rgba(61,220,132,.16);border:1.5px solid var(--R)}
.fb.no{background:rgba(255,107,107,.15);border:1.5px solid var(--bad)}
.fb b{display:block;font-size:16px;margin-bottom:2px}
.steps{display:flex;gap:6px;margin:4px 0 10px}
.stp{flex:1;text-align:center;font-size:11.5px;font-weight:700;color:var(--m)}
.stp i{display:block;height:6px;border-radius:4px;background:var(--p3);margin-bottom:4px}
.stp.on{color:var(--acc)}.stp.on i{background:var(--acc)}
.stp.ok i{background:var(--R)}.stp.no i{background:var(--bad)}
.stars{display:flex;gap:6px;justify-content:center;margin:8px 0}
.big{font-size:34px;font-weight:800;text-align:center;line-height:1.1}
.fact{background:var(--p2);border-radius:12px;padding:8px 12px;font-size:14px;margin:6px 0 10px;border-left:5px solid var(--acc)}
.mrow{background:var(--p2);border-radius:14px;padding:10px;margin:0 0 8px;border:2px solid transparent}
.mrow.act{border-color:var(--acc)}
.mrow .t{font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;margin-bottom:6px}
.mrow .n{width:24px;height:24px;border-radius:50%;background:#fff;color:#10151f;display:grid;place-items:center;font-weight:800;font-size:13px;flex:none}
.gb{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.gb button{min-height:46px;border-radius:11px;background:var(--p3);font-weight:800;font-size:17px;color:#10151f;opacity:.85;border:2px solid transparent}
.gb button.on{opacity:1;border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.2)}
.gb button.good{opacity:1;border-color:#fff;box-shadow:0 0 0 3px var(--R)}
.gb button.bad{opacity:.45}
.zcard{background:linear-gradient(160deg,#2b3d63,#1d2b49);border:2px solid rgba(255,255,255,.18);border-radius:18px;padding:16px 16px;margin:8px 0 10px;font-size:19px;font-weight:800;text-align:center;min-height:84px;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;cursor:grab;box-shadow:0 6px 16px rgba(0,0,0,.35)}
.zcard.drag{opacity:.35}
.ghost{position:fixed;left:0;top:0;z-index:99;pointer-events:none;background:linear-gradient(160deg,#3a5388,#26396a);border:2px solid var(--acc);border-radius:16px;padding:12px 16px;font-weight:800;font-size:17px;max-width:260px;text-align:center;box-shadow:0 10px 28px rgba(0,0,0,.5)}
.vchip{min-height:46px;padding:4px 12px;border-radius:12px;background:var(--p2);font-weight:800;font-size:14.5px;border:2px solid transparent;flex:1 1 auto}
.vchip.hov{border-color:var(--acc);background:var(--p3)}
.vchip.good{background:#14572f;border-color:var(--R)}.vchip.bad{background:#6b2222;border-color:var(--bad)}
.rev{display:flex;gap:8px;align-items:flex-start;font-size:14px;padding:7px 0;border-top:1px solid var(--line)}
@media (min-width:900px){
 .app{flex-direction:row}
 .panel{flex:0 0 410px;max-height:none;border-radius:0;margin:0;box-shadow:-6px 0 24px rgba(0,0,0,.3)}
 .tag{font-size:15px}
}
@media (orientation:landscape) and (max-width:899px){.app{flex-direction:row}.panel{flex:0 0 46%;max-height:none;border-radius:0;margin:0}}
@media (max-width:520px){.pill{min-height:30px;font-size:12px;padding:3px 9px 3px 6px;gap:5px}.pill i{width:11px;height:11px}.tab{font-size:13px;gap:5px}.tab span{white-space:nowrap}}
`;
const Ico={
  explore:h('svg',{width:20,height:20,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.2,strokeLinecap:'round',strokeLinejoin:'round'},h('path',{d:'M12 3 3 7.5 12 12l9-4.5L12 3Z'}),h('path',{d:'M3 7.5v9L12 21l9-4.5v-9M12 12v9'})),
  check:h('svg',{width:20,height:20,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.4,strokeLinecap:'round',strokeLinejoin:'round'},h('path',{d:'M9 6h11M9 12h11M9 18h11'}),h('path',{d:'m3.5 6 1.3 1.3L7 5M3.5 12l1.3 1.3L7 11M3.5 18l1.3 1.3L7 17'})),
  cards:h('svg',{width:20,height:20,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.2,strokeLinecap:'round',strokeLinejoin:'round'},h('rect',{x:3,y:6,width:12,height:15,rx:2}),h('path',{d:'M8 3h11a2 2 0 0 1 2 2v12'})),
  home:h('svg',{width:24,height:24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.2,strokeLinecap:'round',strokeLinejoin:'round'},h('path',{d:'M4 11 12 4l8 7M6 10v10h12V10'})),
  eye:h('svg',{width:24,height:24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.2,strokeLinecap:'round',strokeLinejoin:'round'},h('path',{d:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z'}),h('circle',{cx:12,cy:12,r:3})),
  back:h('svg',{width:20,height:20,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.6,strokeLinecap:'round',strokeLinejoin:'round'},h('path',{d:'m15 5-7 7 7 7'})),
  ck:h('svg',{width:12,height:12,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:4,strokeLinecap:'round',strokeLinejoin:'round'},h('path',{d:'m5 12 5 5 9-10'})),
  flame:h('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'#ffa412'},h('path',{d:'M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10Z'}))
};
function Star({on,size}){return h('svg',{width:size||34,height:size||34,viewBox:'0 0 24 24',fill:on?'#ffc83d':'none',stroke:on?'#ffc83d':'#5b6c8c',strokeWidth:1.8,strokeLinejoin:'round'},h('path',{d:'m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.8 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8L12 3Z'}));}
function Bd({g,s}){const c=g?GOALS[g].c:'#e8edf6';return h('span',{className:'bd'+(s?' s':''),style:{background:c}},g||'§');}
const SHORT={hoch:'OKFF > 22 m',verk:'A > 800 m²',vers:'n > 100 Personen',beh:'n > 12 Gastbetten',kra:'Nutzung als Krankenhaus',ind:'Produktion / Lagerung',gar:'Stellplätze > 100 m²',woh:'Kein Sonderbautatbestand'};
const VSMAP={'MHHR':'hoch','MVKVO':'verk','MVStättVO':'vers','MBeVO':'beh','MKhVO':'kra','MIndBauRL':'ind','M-GarVO':'gar','STD':'woh'};
/* ===== Panels ===== */
const hotsFor=(b,v)=>b.hot.filter(x=>!x.typ||x.typ.indexOf(v)>=0);
const TOTAL_HOT=BUILDINGS.reduce((a,b)=>a+b.hot.length,0);
function Legend({gf,setGf,sub}){
  return h('div',{className:'lg'},Object.keys(GOALS).map(g=>h('button',{key:g,className:'gchip'+(gf===g?' on':'')+(gf&&gf!==g?' off':''),onClick:setGf?()=>setGf(gf===g?null:g):undefined,style:setGf?null:{cursor:'default'}},
    h(Bd,{g}),h('span',null,GOALS[g].k))));
}
function ErkHome({found,select}){
  const nf=Object.keys(found).length;
  return h('div',null,
    h('h2',null,'Erkunde das Sonderbau-Quartier'),
    h('p',{className:'mut sm'},'Tippe ein Gebäude an (oder sein Schild). Die Kamera fährt hin, die Wände werden durchsichtig: Du siehst, was der Brandschutz dort verlangt. Ziehen dreht, Zwei-Finger-Zoom oder Mausrad zoomt.'),
    h('h3',null,'Vier Schutzziele (§ 14 MBO)'),
    h(Legend,{}),
    h('p',{className:'xs mut'},'Jede Maßnahme im Röntgenblick trägt eines dieser Abzeichen.'),
    h('div',{className:'row',style:{marginTop:10}},h('b',null,'Entdeckt'),h('span',{className:'sp'}),h('span',{className:'cnt'},nf+' von '+TOTAL_HOT)),
    h('div',{className:'bar'},h('i',{style:{width:(nf/TOTAL_HOT*100)+'%'}})),
    h('h3',null,'Gebäude im Viertel'),
    BUILDINGS.map(b=>{const n=b.hot.filter(x=>found[b.id+':'+x.id]).length,all=n===b.hot.length;
      return h('button',{key:b.id,className:'bcard',onClick:()=>select(b.id)},
        h('span',{className:'sw',style:{background:b.col}}),
        h('span',{className:'tx'},h('b',null,b.name),h('span',{className:'s'},(b.vs?b.vs+' · ':'')+SHORT[b.id])),
        h('span',{className:'cnt'+(all?' done':'')},all?h(Star,{on:true,size:20}):null,n+'/'+b.hot.length));}));
}
function ErkSel({b,found,hot,setHot,gf,setGf,gv,setGv,xray,setXray,back}){
  const list=hotsFor(b,gv),cur=hot&&b.hot.find(x=>x.id===hot);
  const nfound=list.filter(x=>found[b.id+':'+x.id]).length,all=nfound===list.length;
  const hidden=b.hot.filter(x=>list.indexOf(x)<0&&x.need);
  const card=cur&&list.indexOf(cur)>=0?h('div',{className:'card',style:{borderLeftColor:cur.g?GOALS[cur.g].c:'#e8edf6'}},
      h('h3',null,h(Bd,{g:cur.g}),cur.t),
      h('div',{className:'val'},cur.v),
      h('p',{className:'sm',style:{margin:'4px 0 0'}},h('b',null,'Zweck: '),cur.w),
      h('div',{className:'zl'},cur.g?h('span',{style:{color:GOALS[cur.g].c}},'Ziel: '+GOALS[cur.g].n):h('span',{className:'mut'},'Einstufung: Tatbestand bzw. Gebäudeklasse'))):
      h('div',{className:'card',style:{borderLeftColor:'#5b6c8c'}},h('span',{className:'sm mut'},'Tippe einen leuchtenden Punkt im Modell oder eine Schaltfläche darunter: Du siehst Wert, Zweck und Schutzziel.'));
  return h('div',null,
    h('div',{className:'row',style:{marginBottom:8}},
      h('button',{className:'back',onClick:back},Ico.back,'Viertel'),h('span',{className:'sp'}),
      h('button',{className:'tgl'+(xray?' on':''),onClick:()=>setXray(!xray)},'Röntgenblick',h('span',{className:'k'}))),
    h('div',{className:'row',style:{gap:10,marginBottom:4}},h('span',{style:{width:12,alignSelf:'stretch',borderRadius:6,background:b.col}}),
      h('div',null,h('h2',{style:{margin:0}},b.name),h('div',{className:'sm mut'},b.vs?h('span',null,'Vorschrift ',h('b',{style:{color:'#fff'}},b.vs),' · Sonderbau Nr. '+b.nr):'Standardgebäude'))),
    b.id==='gar'?h('div',{className:'sw2'},[['K','Klein','bis 100 m²'],['M','Mittel','100–1.000 m²'],['G','Groß','> 1.000 m²']].map(t=>h('button',{key:t[0],className:gv===t[0]?'on':'',onClick:()=>setGv(t[0])},t[1],h('small',null,t[2])))):null,
    card,
    h('div',{className:'row',style:{marginTop:6}},h('b',null,'Hotspots'),h('span',{className:'sp'}),h('span',{className:'cnt'+(all?' done':'')},all?h(Star,{on:true,size:20}):null,nfound+' von '+list.length+' entdeckt')),
    h('div',{className:'chips'},list.map(x=>{const dim=gf&&x.g!==gf;
      return h('button',{key:x.id,className:'hc'+(hot===x.id?' sel':'')+(found[b.id+':'+x.id]?' fnd':'')+(dim?' dimm':''),onClick:()=>setHot(hot===x.id?null:x.id)},h(Bd,{g:x.g}),x.t);}),
      hidden.map(x=>h('button',{key:x.id,className:'hc dis',disabled:true},h(Bd,{g:x.g}),x.t+' · ab '+x.need))),
    all?h('div',{className:'fb ok'},h('b',null,'Alle Hotspots entdeckt'),'Stark: Dieses Gebäude kennst du jetzt. Weiter mit dem nächsten oder üben im Modus Prüfreihenfolge.'):null,
    h('p',{className:'sm',style:{margin:'10px 0 6px'}},b.intro),
    h('div',{className:'sm mut',style:{margin:'10px 0 4px'}},'Nur Maßnahmen für ein Schutzziel hervorheben:'),
    h(Legend,{gf,setGf}),
    h('p',{className:'xs mut'},'Vereinfachte Darstellung, nicht maßstäblich. Die Zuordnung der Maßnahmen zu den Schutzzielen dient dem Lernen.'));
}
function StepBar({pru}){
  const names=['Recht','Klasse','Sonderbau','Ziele'];
  return h('div',{className:'steps'},names.map((n,i)=>{const r=pru.res[i];return h('div',{key:i,className:'stp'+(pru.step===i?' on':'')+(r===true?' ok':'')+(r===false?' no':'')},h('i'),(i+1)+'. '+n);}));
}
function PruPanel({pru,start,setPru,stats}){
  if(!pru||pru.step===undefined)return h('div',null,
    h('h2',null,'Prüfreihenfolge'),
    h('p',{className:'mut sm'},'Du bekommst ein zufälliges Gebäude im Viertel und arbeitest die vier Schritte der Prüfreihenfolge ab. Nach jedem Schritt gibt es eine Rückmeldung mit Begründung.'),
    ['Rechtsgrundlage prüfen','Gebäudeklasse bestimmen','Sonderbautatbestand prüfen','Schutzziele anwenden'].map((t,i)=>h('div',{key:i,className:'bcard',style:{cursor:'default'}},h('span',{className:'bd',style:{background:'var(--acc)'}},i+1),h('span',{className:'tx'},h('b',null,t)))),
    h('button',{className:'btn',onClick:()=>start(null)},'Gebäude auswürfeln'),
    stats.pru?h('p',{className:'xs mut',style:{textAlign:'center',marginTop:10}},stats.pru+' Gebäude geprüft · '+stats.stars+' Sterne gesammelt'):null);
  const b=BY[pru.bid],st=pru.step,res=pru.res;
  if(st===4){const ok=res.filter(Boolean).length,stars=ok===4?3:ok===3?2:ok===2?1:0;
    return h('div',null,h(StepBar,{pru}),
      h('div',{className:'big'},ok+' von 4 Schritten richtig'),
      h('div',{className:'stars'},[0,1,2].map(i=>h(Star,{key:i,on:i<stars,size:42}))),
      h('div',{className:'fb '+(ok>=3?'ok':'no')},h('b',null,b.name+(b.vs?' · '+b.vs:' · Standardgebäude')),
        'Ziele erkannt: '+pru.goalOk+' von '+pru.picks.length+'. '+(ok===4?'Perfekt geprüft.':'Schau dir die markierten Schritte noch einmal im Erkundungsmodus an.')),
      h('button',{className:'btn',onClick:()=>start(pru.bid)},'Nächstes Gebäude'),
      h('button',{className:'btn sec',onClick:()=>setPru(null)},'Zur Übersicht'));}
  const fbBox=pru.fb?h('div',{className:'fb '+(pru.fb.ok?'ok':'no')},h('b',null,pru.fb.ok?'Richtig':'Nicht ganz'),pru.fb.txt):null;
  const next=pru.fb?h('button',{className:'btn',onClick:()=>setPru(Object.assign({},pru,{step:st+1,fb:null}))},st===3?'Ergebnis ansehen':'Weiter'):null;
  const fact=st>=1?h('div',{className:'fact'},h('b',null,'Bauvorhaben: '),b.fact):null;
  if(st===0){return h('div',null,h(StepBar,{pru}),h('h3',{style:{marginTop:0}},'Schritt 1: Rechtsgrundlage prüfen'),
    h('p',{className:'sm'},'Ein Gebäude steht im Viertel. Bevor du es einstufst: Welche Norm der MBO nennt die Sonderbautatbestände?'),
    pru.opts0.map(o=>h('button',{key:o.id,disabled:!!pru.fb,className:'opt'+(pru.fb?(o.id==='2'?' good':(pru.pick===o.id?' bad':' fade')):''),onClick:()=>pru.act(o.id)},o.t)),fbBox,next);}
  if(st===1){return h('div',null,h(StepBar,{pru}),h('h3',{style:{marginTop:0}},'Schritt 2: Gebäudeklasse bestimmen'),fact,
    h('p',{className:'sm mut'},'Annahme der Aufgabe, vereinfacht. Welche Gebäudeklasse passt?'),
    h('div',{className:'grid3'},GKS.map(g=>h('button',{key:g,disabled:!!pru.fb,className:'opt'+(pru.fb?(g===b.gk?' good':(pru.pick===g?' bad':' fade')):''),onClick:()=>pru.act(g)},g))),fbBox,next);}
  if(st===2){return h('div',null,h(StepBar,{pru}),h('h3',{style:{marginTop:0}},'Schritt 3: Sonderbautatbestand prüfen'),fact,
    h('p',{className:'sm mut'},'Welcher Tatbestand und welche Vorschrift passen zu diesem Gebäude?'),
    pru.opts2.map(o=>h('button',{key:o.id,disabled:!!pru.fb,className:'opt'+(pru.fb?(o.id===pru.bid?' good':(pru.pick===o.id?' bad':' fade')):''),onClick:()=>pru.act(o.id)},o.t)),fbBox,next);}
  // Schritt 4
  const done=Object.keys(pru.assign).length===pru.picks.length;
  return h('div',null,h(StepBar,{pru}),h('h3',{style:{marginTop:0}},'Schritt 4: Schutzziele anwenden'),
    h('p',{className:'sm mut'},'Im Röntgenblick leuchten drei Maßnahmen. Welches Schutzziel verfolgt jede?'),
    pru.picks.map((x,i)=>{const a=pru.assign[x.id],chk=pru.checked;
      return h('div',{key:x.id,className:'mrow'+(pru.actId===x.id?' act':''),onClick:()=>pru.focusRow(x.id)},
        h('div',{className:'t'},h('span',{className:'n'},i+1),x.t),
        h('div',{className:'xs mut',style:{margin:'-2px 0 8px'}},x.v),
        h('div',{className:'gb'},Object.keys(GOALS).map(g=>h('button',{key:g,disabled:chk,style:{background:GOALS[g].c},className:(a===g?'on':'')+(chk&&g===x.g?' good':'')+(chk&&a===g&&g!==x.g?' bad':''),onClick:e=>{e.stopPropagation();pru.assignGoal(x.id,g);}},g,h('div',{style:{fontSize:10.5,fontWeight:700}},GOALS[g].k)))),
        chk?h('div',{className:'xs',style:{marginTop:6,color:a===x.g?'var(--R)':'var(--bad)'}},(a===x.g?'Richtig: ':'Richtig wäre: ')+GOALS[x.g].n+'. '+x.w):null);}),
    pru.checked?h('button',{className:'btn',onClick:()=>setPru(Object.assign({},pru,{step:4}))},'Ergebnis ansehen'):
      h('button',{className:'btn',disabled:!done,onClick:pru.check},done?'Prüfen':'Ordne alle drei Maßnahmen zu'));
}
function ZuoPanel({z,startRound,answer,next,sc,hv,setHv}){
  const [drag,setDrag]=useState(null);const ds=useRef(null);
  if(z.phase==='start')return h('div',null,h('h2',null,'Zuordnen'),
    h('p',{className:'mut sm'},'Du bekommst Karten mit Tatbeständen oder Anforderungen. Ordne jede Karte dem richtigen Gebäude zu: Tippe das Gebäude im Viertel (oder sein Schild) oder die Vorschrift an. Du kannst die Karte auch darauf ziehen.'),
    h('button',{className:'bcard',onClick:()=>startRound('tat')},h('span',{className:'sw',style:{background:'var(--acc)'}}),h('span',{className:'tx'},h('b',null,'Tatbestände'),h('span',{className:'s'},'8 Karten: Schwellen der Sonderbauten'))),
    h('button',{className:'bcard',onClick:()=>startRound('anf')},h('span',{className:'sw',style:{background:'var(--L)'}}),h('span',{className:'tx'},h('b',null,'Anforderungen'),h('span',{className:'s'},'8 Karten: typische Maßnahmen'))),
    h('button',{className:'bcard',onClick:()=>startRound('mix')},h('span',{className:'sw',style:{background:'var(--R)'}}),h('span',{className:'tx'},h('b',null,'Gemischt'),h('span',{className:'s'},'12 Karten, volle Prüfung'))),
    z.last?h('p',{className:'xs mut',style:{textAlign:'center'}},'Letzte Runde: '+z.last):null);
  if(z.phase==='end'){const n=z.deck.length,acc=z.right/n,stars=acc>=0.88?3:acc>=0.62?2:acc>=0.3?1:0;
    return h('div',null,h('div',{className:'big'},z.right+' von '+n+' richtig'),
      h('div',{className:'stars'},[0,1,2].map(i=>h(Star,{key:i,on:i<stars,size:42}))),
      h('div',{className:'big',style:{fontSize:24,color:'var(--acc)'}},z.score+' Punkte'),
      z.wrongs.length?h('div',null,h('h3',null,'Das solltest du wiederholen'),z.wrongs.map((c,i)=>h('div',{key:i,className:'rev'},h('span',{className:'bd s',style:{background:BY[c.a].col}}),h('div',null,h('b',null,c.t),h('div',{className:'mut'},BY[c.a].name+(BY[c.a].vs?' · '+BY[c.a].vs:'')+' – '+c.e))))):h('div',{className:'fb ok'},h('b',null,'Fehlerfrei'),'Alle Karten gleich richtig zugeordnet.'),
      h('button',{className:'btn',onClick:()=>startRound(z.round)},'Nochmal spielen'),h('button',{className:'btn sec',onClick:()=>startRound(null)},'Andere Runde'));}
  const c=z.deck[z.i],fb=z.fb;
  const targetAt=(x,y)=>{const el=document.elementFromPoint(x,y);if(!el)return null;const t=el.closest&&el.closest('[data-bid]');if(t)return t.getAttribute('data-bid');if(el.tagName==='CANVAS')return sc.pickAt(x,y);return null;};
  const down=e=>{if(fb)return;try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}ds.current={x:e.clientX,y:e.clientY,on:false};};
  const move=e=>{const d=ds.current;if(!d)return;if(!d.on&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>8)d.on=true;if(d.on){setDrag({x:e.clientX,y:e.clientY});const t=targetAt(e.clientX,e.clientY);setHv(t);sc.hover(t);}};
  const up=e=>{const d=ds.current;ds.current=null;if(!d)return;setDrag(null);setHv(null);sc.hover(null);if(d.on){const t=targetAt(e.clientX,e.clientY);if(t)answer(t);}};
  return h('div',null,
    h('div',{className:'row xs mut'},h('b',null,'Karte '+(z.i+1)+' von '+z.deck.length),h('span',{className:'sp'}),h('span',null,'Wohin gehört sie?')),
    h('div',{className:'zcard'+(drag?' drag':''),onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:up},c.t),
    drag?h('div',{className:'ghost',style:{transform:'translate('+(drag.x-90)+'px,'+(drag.y-60)+'px)'}},c.t):null,
    fb?null:h('div',{className:'xs mut',style:{margin:'0 0 6px'}},'Gebäude im Viertel antippen, eine Vorschrift wählen oder die Karte ziehen.'),
    fb?null:h('div',{className:'chips',style:{margin:'4px 0'}},VSLIST.concat(['STD']).map(v=>{const bid=VSMAP[v];
      const cls='vchip'+(hv===bid?' hov':'');
      return h('button',{key:v,'data-bid':bid,className:cls,onClick:()=>answer(bid)},v==='STD'?'Kein Sonderbau':v);})),
    fb?h('div',null,h('div',{className:'fb '+(fb.ok?'ok':'no')},h('b',null,fb.ok?'Richtig! +'+fb.pts:'Nicht ganz'),
        fb.ok?c.e:'Richtig: '+BY[c.a].name+(BY[c.a].vs?' ('+BY[c.a].vs+'). ':'. ')+c.e),
      h('button',{className:'btn',onClick:next},z.i+1>=z.deck.length?'Ergebnis ansehen':'Nächste Karte')):null);
}
/* ===== App ===== */
const GREEN=0x3ddc84,REDC=0xff5c5c;
function App(){
  const [ready,setReady]=useState(false);
  const [mode,setMode]=useState('erk');
  const [sel,setSel]=useState(null);
  const [xray,setXray]=useState(true);
  const [hot,setHot]=useState(null);
  const [found,setFound]=useState({});
  const [gf,setGf]=useState(null);
  const [gv,setGv]=useState('G');
  const [pru,setPru]=useState(null);
  const [zuo,setZuo]=useState({phase:'start'});
  const [hv,setHv]=useState(null);
  const [stats,setStats]=useState({pru:0,stars:0});
  const sc=useRef(null),cv=useRef(null),host=useRef(null),pickRef=useRef(null),prevHot=useRef(null),bodyRef=useRef(null);
  /* Szene anlegen */
  useEffect(()=>{
    let s;try{s=createScene(cv.current);}catch(err){console.error(err);return;}
    sc.current=s;s.onPick=b=>pickRef.current&&pickRef.current(b);
    const fit=()=>{const r=host.current.getBoundingClientRect();s.resize(r.width,r.height);};
    fit();const ro=new ResizeObserver(fit);ro.observe(host.current);
    setReady(true);window.__sc=s;
    return()=>{ro.disconnect();s.dispose();};
  },[]);
  const S=()=>sc.current;
  useEffect(()=>{const el=bodyRef.current;if(el)el.scrollTop=0;},[mode,sel,hot,pru&&pru.step,pru&&pru.bid,zuo.i,zuo.phase]);
  useEffect(()=>{const el=bodyRef.current;if(el&&pru&&(pru.fb||pru.checked))setTimeout(()=>el.scrollTo({top:el.scrollHeight,behavior:'smooth'}),60);},[pru&&pru.fb,pru&&pru.checked]);
  /* Auswahl */
  const selectB=bid=>{setSel(bid);setHot(null);setXray(true);setGf(null);prevHot.current=null;if(bid==='gar'){setGv('G');}};
  /* ---- Erkunden ---- */
  useEffect(()=>{if(!ready)return;const s=S();
    if(mode==='erk'){s.clearHL();
      if(sel){if(sel==='gar')s.variant(gv);s.focus(sel,xray);s.view(sel);}else{s.focus(null,false);s.home();}}
  },[ready,mode,sel]);
  useEffect(()=>{if(!ready||mode!=='erk')return;if(sel)S().focus(sel,xray);},[xray]);
  useEffect(()=>{if(!ready||mode!=='erk'||!sel)return;const s=S(),b=BY[sel];
    if(hot){const x=b.hot.find(y=>y.id===hot);if(x){s.setHL(sel,x.feat,x.g);s.view(sel,{hid:hot});setFound(f=>{const k=sel+':'+hot;return f[k]?f:Object.assign({},f,{[k]:1});});}}
    else{s.clearHL();if(prevHot.current)s.view(sel);}
    prevHot.current=hot;
  },[hot]);
  useEffect(()=>{if(!ready||mode!=='erk'||sel!=='gar')return;const s=S();s.variant(gv);s.clearHL();setHot(null);s.view('gar');},[gv]);
  /* ---- Moduswechsel ---- */
  const switchMode=m=>{if(m===mode)return;setMode(m);setSel(null);setHot(null);setPru(null);setZuo({phase:'start'});setHv(null);
    if(ready){const s=S();s.clearHL();s.focus(null,false);s.hover(null);s.home(1.0);}};
  /* ---- Prüfreihenfolge ---- */
  useEffect(()=>{if(!ready||mode!=='pru')return;const s=S();
    if(!pru||pru.step===undefined){s.clearHL();s.focus(null,false);s.home();return;}
    if(pru.bid==='gar')s.variant('G');
    s.focus(pru.bid,pru.step>=3);s.view(pru.bid);if(pru.step<3)s.clearHL();
  },[ready,mode,pru&&pru.bid,pru&&pru.step]);
  useEffect(()=>{if(!ready||mode!=='pru'||!pru||pru.step!==3)return;const s=S();const x=pru.picks.find(p=>p.id===pru.actId);
    if(x){s.setHL(pru.bid,x.feat,null);s.view(pru.bid,{hid:x.id});}else{s.clearHL();}
  },[pru&&pru.actId]);
  const startPru=(prev)=>{
    const pool=BUILDINGS.filter(b=>b.id!==prev);const b=pool[Math.floor(Math.random()*pool.length)];
    const o0=shuffle([{id:'2',t:'§ 2 Abs. 4 MBO – Sonderbautatbestände'},{id:'14',t:'§ 14 MBO – Schutzziele des Brandschutzes'},{id:'3',t:'§ 3 Abs. 1 MBO – Allgemeine Anforderungen'}]);
    const o2=shuffle(BUILDINGS.map(x=>({id:x.id,t:SHORT[x.id]+(x.vs?' → '+x.vs:' → kein Sonderbau')})));
    // Massnahmen fuer Schritt 4: moeglichst verschiedene Schutzziele
    const cand=shuffle(b.hot.filter(x=>x.g&&(!x.typ||x.typ.indexOf('G')>=0)));const picks=[],seen={};
    cand.forEach(x=>{if(picks.length<3&&!seen[x.g]){seen[x.g]=1;picks.push(x);}});cand.forEach(x=>{if(picks.length<3&&picks.indexOf(x)<0)picks.push(x);});
    setPru({bid:b.id,step:0,res:[null,null,null,null],fb:null,pick:null,opts0:o0,opts2:o2,picks:picks,assign:{},checked:false,actId:null,goalOk:0});
  };
  const pruAct=id=>setPru(p=>{if(!p||p.fb)return p;const b=BY[p.bid],st=p.step;let ok,txt;
    if(st===0){ok=id==='2';txt='§ 2 Abs. 4 MBO nennt die Sonderbautatbestände. § 14 MBO beschreibt die vier Schutzziele, § 3 Abs. 1 MBO die allgemeinen Anforderungen.';}
    else if(st===1){ok=id===b.gk;txt=ok?b.gkWhy:'Richtig ist '+b.gk+'. '+b.gkWhy;}
    else{ok=id===p.bid;txt=b.vs?'Tatbestand: '+b.tat+' → '+b.vs+(b.nr!=='–'?' (Sonderbau Nr. '+b.nr+')':'')+'.':'Kein Sonderbautatbestand erfüllt: Das ist ein Standardgebäude, es gelten die Abschnitte 04 und 05. '+b.gkWhy;
      if(!ok)txt='Richtig wäre: '+(b.vs?b.tat+' → '+b.vs:'kein Sonderbau')+'. '+(b.vs?'':b.gkWhy);}
    const res=p.res.slice();res[st]=ok;return Object.assign({},p,{pick:id,res,fb:{ok,txt}});});
  const pruObj=useMemo(()=>{if(!pru)return null;return Object.assign({},pru,{act:pruAct,
    assignGoal:(hid,g)=>setPru(p=>Object.assign({},p,{assign:Object.assign({},p.assign,{[hid]:g}),actId:hid})),
    focusRow:hid=>setPru(p=>p.actId===hid?p:Object.assign({},p,{actId:hid})),
    check:()=>setPru(p=>{let n=0;p.picks.forEach(x=>{if(p.assign[x.id]===x.g)n++;});const res=p.res.slice();res[3]=n===p.picks.length;return Object.assign({},p,{checked:true,goalOk:n,res});})});},[pru]);
  useEffect(()=>{if(pru&&pru.step===4){setStats(s=>{const ok=pru.res.filter(Boolean).length;return {pru:s.pru+1,stars:s.stars+(ok===4?3:ok===3?2:ok===2?1:0)};});}},[pru&&pru.step===4]);
  /* ---- Zuordnen ---- */
  useEffect(()=>{if(!ready||mode!=='zuo')return;const s=S();s.clearHL();s.focus(null,false);},[ready,mode,zuo.phase]);
  const startRound=r=>{
    if(!r){setZuo(z=>({phase:'start',last:z.last}));return;}
    let deck;if(r==='tat')deck=shuffle(CARDS_TAT);else if(r==='anf')deck=shuffle(CARDS_ANF).slice(0,8);else deck=shuffle(shuffle(CARDS_TAT).slice(0,5).concat(shuffle(CARDS_ANF).slice(0,7)));
    setZuo({phase:'play',round:r,deck,i:0,score:0,streak:0,right:0,wrongs:[],fb:null});
  };
  const answer=bid=>{if(!bid)return;
    const z=zuo;if(z.phase!=='play'||z.fb)return;const c=z.deck[z.i],ok=bid===c.a,pts=ok?100+Math.min(z.streak,4)*25:0;
    S().hover(null);setHv(null);
    if(ok)S().flash(bid,GREEN);else{S().flash(bid,REDC);setTimeout(()=>sc.current&&sc.current.flash(c.a,GREEN),550);}
    setZuo(Object.assign({},z,{fb:{ok,pick:bid,pts},score:z.score+pts,streak:ok?z.streak+1:0,right:z.right+(ok?1:0),wrongs:ok?z.wrongs:z.wrongs.concat([c])}));
  };
  const nextCard=()=>setZuo(z=>z.i+1>=z.deck.length?Object.assign({},z,{phase:'end',fb:null,last:z.right+' von '+z.deck.length+' richtig, '+z.score+' Punkte'}):Object.assign({},z,{i:z.i+1,fb:null}));
  /* Tippen auf Gebaeude im 3D */
  pickRef.current=bid=>{
    if(mode==='erk'){if(bid&&bid!==sel)selectB(bid);}
    else if(mode==='zuo'){if(bid)answer(bid);}
  };
  /* ---- HUD: Schilder + Marker ---- */
  const track=(k,el,sp)=>sc.current&&sc.current.track(k,el,sp);
  let pills=[];
  if(ready&&((mode==='erk'&&!sel)||(mode==='zuo'&&zuo.phase==='play')))pills=BUILDINGS;
  let marks=[];
  if(ready&&mode==='erk'&&sel&&xray)marks=hotsFor(BY[sel],gv).map(x=>({bid:sel,id:x.id,g:x.g,t:x.t}));
  if(ready&&mode==='pru'&&pru&&pru.step===3)marks=pru.picks.map((x,i)=>({bid:pru.bid,id:x.id,g:null,n:i+1,t:x.t}));
  const onMark=m=>{if(mode==='erk')setHot(hot===m.id?null:m.id);else if(mode==='pru')pruObj.focusRow(m.id);};
  const zfb=mode==='zuo'&&zuo.phase==='play'?zuo.fb:null,zc=mode==='zuo'&&zuo.phase==='play'?zuo.deck[zuo.i]:null;
  const nf=Object.keys(found).length;
  /* ---- Render ---- */
  return h('div',{className:'app'},
    h('div',{className:'stage',ref:host},
      h('canvas',{ref:cv}),
      h('div',{className:'hud'},
        pills.map(b=>h('div',{key:'p'+b.id,className:'hw',ref:el=>track('p'+b.id,el,{kind:'pill',bid:b.id})},
          h('button',{className:'pill'+(hv===b.id?' on':'')+(zfb&&b.id===zc.a?' ok':'')+(zfb&&!zfb.ok&&b.id===zfb.pick?' no':''),'data-bid':b.id,onClick:()=>{if(mode==='erk')selectB(b.id);else answer(b.id);}},h('i',{style:{background:b.col}}),b.name))),
        marks.map(m=>h('div',{key:'m'+m.bid+m.id,className:'hw',ref:el=>track('m'+m.bid+m.id,el,{kind:'hot',bid:m.bid,hid:m.id})},
          h('button',{'aria-label':m.t,title:m.t,className:'mk'+((mode==='erk'?hot===m.id:pru&&pru.actId===m.id)?' sel':'')+(mode==='erk'&&gf&&m.g!==gf?' dimm':''),style:{background:m.n?'#fff':(m.g?GOALS[m.g].c:'#e8edf6'),color:m.n?'#ffa412':(m.g?GOALS[m.g].c:'#e8edf6')},onClick:()=>onMark(m)},
            h('span',{style:{color:'#10151f'}},m.n||m.g||'§'),found[m.bid+':'+m.id]&&mode==='erk'?h('span',{className:'ck'},Ico.ck):null)))),
      h('div',{className:'tag'},h('b',null,'Sonderbau-Quartier'),mode==='erk'&&sel?h('span',{style:{fontWeight:600,opacity:.85}},'· '+BY[sel].name):null),
      mode==='zuo'&&zuo.phase==='play'?h('div',{className:'score'},h('span',null,zuo.score+' Punkte'),zuo.streak>1?h('span',{style:{display:'flex',alignItems:'center',gap:3}},Ico.flame,zuo.streak):null):null,
      h('div',{className:'sbtns'},
        mode==='erk'&&sel?h('button',{className:'sb'+(xray?' on':''),'aria-label':'Röntgenblick umschalten',onClick:()=>setXray(!xray)},Ico.eye):null,
        h('button',{className:'sb','aria-label':'Ansicht zurücksetzen',onClick:()=>{const s=S();if(mode==='erk'&&sel)s.view(sel);else if(mode==='pru'&&pru&&pru.bid)s.view(pru.bid);else s.home();}},Ico.home)),
      h('div',{className:'note'},'Vereinfachte Darstellung, nicht maßstäblich')),
    h('div',{className:'panel'},
      h('div',{className:'tabs'},[['erk','Erkunden',Ico.explore],['pru','Prüfreihenfolge',Ico.check],['zuo','Zuordnen',Ico.cards]].map(t=>h('button',{key:t[0],className:'tab'+(mode===t[0]?' on':''),onClick:()=>switchMode(t[0])},t[2],h('span',null,t[1])))),
      h('div',{className:'body',ref:bodyRef},
        mode==='erk'?(sel?h(ErkSel,{b:BY[sel],found,hot,setHot,gf,setGf,gv,setGv,xray,setXray,back:()=>selectB(null)}):h(ErkHome,{found,select:selectB})):null,
        mode==='pru'?h(PruPanel,{pru:pruObj,start:startPru,setPru:p=>setPru(p),stats}):null,
        mode==='zuo'?h(ZuoPanel,{z:zuo,startRound,answer,next:nextCard,sc:{pickAt:(x,y)=>sc.current&&sc.current.pickAt(x,y),hover:b=>sc.current&&sc.current.hover(b)},hv,setHv}):null)));
}
const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
