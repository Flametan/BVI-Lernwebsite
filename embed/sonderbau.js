/* ===== Sonderbauten-Quartier: kleines 3D-Quartier mit den Sonderbau-Typen der Lernseite ===== */
/* ===== Fachdaten (nur Werte aus der Lernseite „Vorbeugender Brandschutz“, Kapitel 6.5, Merkschema T-R-O-S-T) ===== */
const KP=[['bau','T Tragwerk'],['rau','R Rauch'],['bes','O Objekt'],['rw','S Rettungswege'],['ant','T Technik'],['mer','Merksatz']];
const XC=['#ff4d2e','#16b8ff','#ffd21f']; /* Farben der Röntgen-Bauteile */
const D=[
 {id:'hh',n:'Hochhaus',lab:'Hochhaus',rg:'MHHR',col:'#5aa9ff',
  ab:'Gebäude mit OKFF > 22 m',
  q:['Gebäude mit OKFF über 22 m.','Feuerwehraufzüge und nasse Steigleitungen in allen Hochhäusern, über 60 m zusätzlich automatische Feuerlöschanlage.'],
  bau:['Bis 60 m OKFF: tragende Wände, Stützen, Decken feuerbeständig, nichtbrennbare Baustoffe (§ 3.1.1 MHHR)','Über 60 m OKFF: 120 Minuten Feuerwiderstand, nichtbrennbare Baustoffe (§ 3.1.2 MHHR)','Anforderungen gelten auch im Kellergeschoss','Trennwände mindestens feuerhemmend','Wände notwendiger Treppenräume mit Feuerwiderstand der tragenden Bauteile (über 60 m: 120 Minuten)'],
  rau:['Jedes Geschoss muss entraucht werden können (§ 6.7)','Installationsschächte nach § 7.2.2','Öffnungen zur Rauchableitung im Treppenraum abhängig von der Art des Treppenraumes'],
  bes:['Erleichterungen bis 60 m nur bei vollständiger Erfüllung der Bedingungen des § 8 (Zellenbauweise)','Kein genereller Anlagenverzicht','Bis 60 m bei Verzicht auf Brandmelde- und/oder Löschanlage: Trennwände feuerbeständig und Maßnahmen gegen den vertikalen Brandüberschlag über die Außenwände'],
  rw:['Bis 60 m: 1. Rettungsweg baulich; 2. Rettungsweg baulich oder ein Sicherheitstreppenraum','Über 60 m: beide Rettungswege über Sicherheitstreppenräume','Außenliegender Sicherheitstreppenraum ohne Rauchschutzdruckanlage (RDA) möglich','Rettungsweglänge von jeder Stelle eines Aufenthaltsraums bis zum Ausgang höchstens 35 m (§ 4.1 MHHR)'],
  ant:['Feuerwehraufzüge (§ 6.1), Druckbelüftung (§ 6.2), nasse Steigleitungen (§ 6.3.2), Sicherheitsbeleuchtung (§ 6.5), Feuerwehrpläne (§ 9.2)','Auf nasse Steigleitungen mit Wandhydranten kann im Einvernehmen mit der Brandschutzdienststelle nicht verzichtet werden','Zusätzlich über 60 m: automatische Feuerlöschanlage (§ 6.3), Brandmelde- und Alarmierungsanlage (§ 6.4)'],
  mer:'Bis 60 m: 2. Rettungsweg baulich oder ein Sicherheitstreppenraum. Über 60 m: beide Rettungswege über Sicherheitstreppenräume, 120 Minuten Feuerwiderstand.',
  xr:[['Sicherheitstreppenraum','2. Rettungsweg bis 60 m, über 60 m beide'],['Feuerwehraufzug','in allen Hochhäusern, mit Druckbelüftung'],['Nasse Steigleitung','Wandhydranten, nicht verzichtbar']]},
 {id:'vk',n:'Verkaufsstätte',lab:'Verkaufsstätte',rg:'MVKVO',col:'#ff9f43',
  ab:'Verkaufsräume und Ladenstraßen insgesamt > 2.000 m²',
  q:['Verkaufsräume und Ladenstraßen insgesamt über 2.000 m².','Brandabschnitt erdgeschossig bis 10.000 m² mit Sprinkleranlage.'],
  bau:['Ebenerdig: erdgeschossig mit Sprinkleranlage ohne Feuerwiderstand möglich (§ 3); ohne Löschanlage tragende Grundstruktur feuerhemmend','Mehrgeschossig: feuerbeständig','Im Kellergeschoss feuerbeständig','Trennwände nach § 5 MVKVO; feuerbeständig bei Abtrennung zu fremden Nutzungen','Ohne Löschanlage: Trennwände zu Lagern, Werkstätten usw. feuerbeständig','Treppenraum mehrgeschossig: Bauart Brandwand'],
  rau:['Räume > 200 m² bis 1000 m²: Öffnungen (§ 16), meist Fenster im oberen Raumdrittel','Räume > 1000 m²: Rauch- und Wärmeabzugsgeräte (RWA) oder maschinelle Rauchabzugsanlagen','Zuluft im unteren Raumdrittel; Auslösung durch die Feuerwehr muss sichergestellt sein'],
  bes:['Brandabschnitte erdgeschossig (§ 6): mit Sprinkleranlage höchstens 10.000 m², ohne höchstens 3.000 m²','Sonstige Verkaufsstätten: mit Sprinkleranlage höchstens 5.000 m², ohne höchstens 1.500 m² je Geschoss und höchstens drei Geschosse','Grundsätzlich kein Feuerwiderstand bei Trennwänden zwischen den Verkaufsräumen'],
  rw:['1. Rettungsweg baulich; 2. Rettungsweg baulich','Rettungsweglänge nach § 10 MVKVO: 105 m ebenerdig, 140 m mehrgeschossig (Treppenraumerweiterung)'],
  ant:['Feuerwehrpläne (§ 27), Brandmelde- und Alarmierungseinrichtungen (§ 20), Sicherheitsstromversorgung (§ 21); Feuerlöscheinrichtungen nach § 20','Auf Wandhydranten oder trockene Löschleitungen kann im Einvernehmen mit der Brandschutzdienststelle verzichtet werden (örtliche Einsatzplanung)'],
  mer:'Brandabschnitt erdgeschossig 10.000 m² mit und 3.000 m² ohne Sprinkler; Rettungsweglänge 105 m, mehrgeschossig 140 m.',
  xr:[['Sprinkleranlage','erdgeschossig bis 10.000 m² je Brandabschnitt'],['Rauchableitung','über 1000 m²: RWA oder maschinell'],['Treppenraum','mehrgeschossig: Bauart Brandwand']]},
 {id:'be',n:'Beherbergungsstätte',lab:'Beherbergung',rg:'MBeVO',col:'#ee73b4',
  ab:'Mehr als 12 Gastbetten',
  q:['Mehr als 12 Gastbetten.','Rauchwarnmelder in jedem Beherbergungsraum, über 60 Gastbetten aufgeschaltete BMA.'],
  bau:['Bis 60 Gastbetten: Mindestanforderung feuerhemmend (§ 4); über 60: entsprechend Gebäudeklasse, im Keller ebenso','Trennwände mindestens feuerhemmend (§ 5)','Notwendige Treppenräume nach MBO; Türen nach § 7 MBeVO','Greifen die Erleichterungen der SBauVO NRW Teil 2 nicht, ist die tragende Grundstruktur grundsätzlich feuerbeständig und der Treppenraum in Bauart Brandwand'],
  rau:['Öffnungen zur Rauchableitung im notwendigen Treppenraum','Räume und notwendige Flure können gegebenenfalls über öffenbare Fenster entraucht werden'],
  bes:['Rauchschutzabschlüsse zwischen notwendigen Fluren und Beherbergungsräumen (§ 7 Abs. 2)','Bis 60 Gastbetten: Einbau einer BMA nicht verpflichtend geregelt; ohne BMA sind die Türen zu den Beherbergungsräumen rauchdicht und selbstschließend'],
  rw:['1. Rettungsweg baulich; 2. Rettungsweg baulich; Rettungsweglänge 35 m','Bis 60 Gastbetten und höchstens 30 je Geschoss: als 2. Rettungsweg eine mit Rettungsgeräten erreichbare Stelle zulässig (§ 3 Abs. 1)','Dann muss jeder Beherbergungsraum anleiterbar sein (notwendiges Fenster); Brüstungshöhe > 8,00 m: Feuerwehrzufahrt und Aufstellfläche erforderlich'],
  ant:['Bis 60 Gastbetten: Rauchwarnmelder in jedem Beherbergungsraum (über MBO); nichtselbsttätige Alarmierungseinrichtung (§ 9)','Über 60 Gastbetten: aufgeschaltete BMA in den Fluren, automatische Alarmierungsanlage, Brandfallsteuerung der Aufzüge (§ 9 MBeVO)'],
  mer:'Über 12 Gastbetten ist es ein Sonderbau; die Grenze im Merkschema liegt bei 60 Gastbetten: darüber aufgeschaltete BMA und selbsttätige Alarmierung.',
  xr:[['1. Rettungsweg','notwendiger Treppenraum, baulich'],['2. Rettungsweg','baulich, bis 60 Betten auch Anleiterung'],['Notwendiger Flur','Rauchschutzabschlüsse, Rauchwarnmelder']]},
 {id:'in',n:'Industriebau',lab:'Industriebau',rg:'MIndBauRL',col:'#aab4c4',
  ab:'Produktion oder Lagerung von Produkten und Gütern (Industrie und Gewerbe)',
  q:['Produktion oder Lagerung, Sicherheitskategorien K 1 bis K 4.','Umfahrung für die Feuerwehr ab Grundfläche > 5.000 m².'],
  bau:['Tragwerk und Brandabschnitte: Abschnitt 6 Tabelle 2 bis max. 10.000 m²; Rechenverfahren nach Abschnitt 7 bis max. 120.000 m²','Geschosse mehr als 1 m unter Geländeoberfläche: feuerbeständig (F90)','Brandwände über alle Geschosse, 0,50 m über Dach (mehr als MBO)','Türen und Tore in Brandwänden: T90-DS','Außenwand bei Grenzabstand < 5 m: nichtbrennbar; Wände notwendiger Treppenräume wie GK 5'],
  rau:['Produktions- und Lagerräume sowie Ebenen > 200 m² müssen entraucht werden können (natürlich oder maschinell)','Öffnung zur Rauchableitung bei Räumen ab 200 m²'],
  bes:['Sicherheitskategorien: K 1 ohne Maßnahmen, K 2 BMA, K 3 Werkfeuerwehr (3.1 Staffel, 3.2 Gruppe, 3.3 zwei Staffeln, 3.4 drei Staffeln), K 4 selbsttätige Feuerlöschanlage','Umfahrung für Feuerwehrfahrzeuge ab Grundfläche > 5.000 m²','Verfahren: Abschnitt 6, Abschnitt 7 (DIN 18230-1), sonst Brandschutzingenieurwesen (Anhang 1)','Brandschutzbeauftragter bei Industriebauten mit in Summe A > 5.000 m²'],
  rw:['Ab Grundfläche > 1.600 m² (Ebenen und Einbauten > 200 m²): 2 bauliche Rettungswege je Geschoss','Rettungsweglänge ohne Alarmierung: über 35 m (5 m Raumhöhe), über 50 m (10 m); mit Alarmierung über 50 m bzw. 70 m','Jeder Raum > 200 m²: zwei Ausgänge; Hauptgang nach höchstens 15 m Lauflänge, mindestens 2,00 m breit'],
  ant:['Nur automatische BMA, flächendeckend, Aufschaltung zur Feuerwehr','Selbsttätige Feuerlöschanlage (K 4), für das Brandgut geeignet; halbstationär nur mit Werkfeuerwehr in K 3.1 bis K 3.3','Wandhydranten Typ F in Räumen > 1.600 m²','Gebäudefunkanlage bei Brandbekämpfungsabschnittsflächen > 30.000 m²'],
  mer:'Die Sicherheitskategorie K 1 bis K 4 bestimmt, wie groß ein Brandabschnitt werden darf.',
  xr:[['Brandwand','über alle Geschosse, 0,50 m über Dach'],['Rauch- und Wärmeabzug','Produktions- und Lagerräume'],['Umfahrung','ab Grundfläche > 5.000 m²']]},
 {id:'ga',n:'Garage',lab:'Garage',rg:'M-GarVO',col:'#4fd6b4',
  ab:'Mittelgarage über 100 m² bis 1000 m², Großgarage über 1000 m²',
  q:['Stellplätze mit mehr als 100 m² Nutzfläche (Mittel- und Großgaragen).','Rettungsweglänge: offen 50 m, geschlossen 35 m.'],
  bau:['Unterirdische geschlossene Mittelgarage: tragende Bauteile grundsätzlich feuerbeständig (§ 7 Abs. 1–2)','Nur nicht brennbar bei den Voraussetzungen des § 7 Abs. 3 Nr. 2 (u. a. Gebäude allein für die Garage, Höhe ≤ 22 m)','Oberirdische Mittel- und Großgaragen: feuerhemmend und nicht brennbar','Trennwände mindestens feuerhemmend und nichtbrennbar (§ 9 Abs. 1)','Treppenraum: feuerbeständige Wände und Decken (Bauart Brandwand)'],
  rau:['Mittelgarage: keine generelle Rauchableitungspflicht nach § 17 Abs. 4; Lüftung nach § 16 prüfen','Geschlossene Großgarage: Rauchableitung nach § 17 Abs. 4, z. B. mindestens 1.000 cm² Öffnung je Stellplatz oder maschinelle RWA','Offene Großgarage: ständige Querlüftung (§ 2 Abs. 1)'],
  bes:['Offene Garage: 1/3 der Umfassungswände aus unverschließbaren Öffnungen, mindestens zwei Außenwände mit Öffnungen höchstens 70 m gegenüberliegend (Querlüftung)','Sicherheitsschleuse: 1. Tür zur Garage T30-DSS, 2. Tür zum notwendigen Treppenraum RS','Schleuse nur erforderlich, wenn das Gebäude nicht allein den Nutzern der Garage dient (z. B. Garage unter einem Wohngebäude)','Brandabschnitte höchstens 2.500 m², mit selbsttätiger Löschanlage 5.000 m² (§ 12)'],
  rw:['Zwei unabhängige bauliche Rettungswege je Geschoss; einer darf über eine Rampe führen (§ 14 Abs. 1)','Rettungsweglänge geschlossen höchstens 35 m, offen höchstens 50 m (§ 14 Abs. 2)'],
  ant:['Trockene Löschwasserleitungen nur bei Geschosslage weniger 4 m und mehr als 13 m Distanz zur Geländeoberfläche (Wortlaut der Zusammenfassung)','BMA bei geschlossener Großgarage > 2.500 m²: Pflicht (§ 18 Abs. 1)'],
  mer:'Offen oder geschlossen entscheidet: offene Garagen 50 m Rettungsweglänge, geschlossene 35 m.',
  xr:[['Rauchableitung','Großgarage geschlossen nach § 17 Abs. 4'],['Sicherheitsschleuse','Garage T30-DSS, Treppenraum RS'],['Querlüftung','offene Garage: Öffnungen höchstens 70 m auseinander']]},
 {id:'vs',n:'Versammlungsstätte',lab:'Versammlung',rg:'MVStättVO',col:'#c08bff',
  ab:'Versammlungsräume für mehr als 200 Besucher (§ 1 MVStättVO)',
  q:['Versammlungsräume für mehr als 200 Besucher.','Trennwand zwischen Bühnen- und Zuschauerhaus, automatische Feuerlöschanlage ab 3.600 m² Grundfläche.'],
  bau:['Ebenerdig: feuerhemmend; ohne Feuerwiderstand bei selbsttätiger Feuerlöschanlage (§ 3 Abs. 1)','Mehrgeschossig: feuerbeständig (§ 3 Abs. 1); im Kellergeschoss feuerbeständig','Trennwände ebenerdig mindestens feuerhemmend, mehrgeschossig feuerbeständig (§ 3 Abs. 3) und Bauart Brandwand','Notwendige Treppen(räume) feuerbeständig, mehrgeschossig Treppenraum mindestens nicht brennbar','Trennwand zwischen Bühnen- und Zuschauerhaus erforderlich'],
  rau:['Räume > 50 m² bis 200 m²: Öffnungen nach MBO','Räume > 200 m² bis 1000 m²: Öffnungen mit besonderen Anforderungen, meist Fenster im oberen Raumdrittel','Räume > 1000 m²: Rauch- und Wärmeabzugsgeräte (RWA) oder maschinelle Rauchabzugsanlagen','Zuluft im unteren Raumdrittel; Auslösung durch die Feuerwehr muss sichergestellt sein'],
  bes:['Foyers oder Hallen können Teil des Rettungsweges sein, wenn Brandmeldeanlage und Alarmierungsanlage vorhanden sind','Ab > 1000 m² Wandhydranten Typ F, auf trockene Löschwasserleitung reduzierbar','Keine Anforderung an den Feuerwiderstand von Trennwänden zwischen den Versammlungsräumen'],
  rw:['Zwei voneinander unabhängige bauliche Rettungswege (§ 6)','Rettungsweglänge nach § 7: 30 m, bis 60 m möglich, Lauflinienberechnung','§§ 6–9: Längen, Breiten und Führung abhängig von Raumhöhe, Personenzahl und Nutzungsart'],
  ant:['Feuerwehrpläne; Brandmelde- und Alarmierungsanlagen ab > 1000 m² Grundfläche','Feuerlöscheinrichtungen gemäß § 19: bei Großbühnen Sprühwasserlöschanlage mit Handbetrieb','Automatische Feuerlöschanlage bei > 3600 m² Grundfläche; Sonderfälle existieren'],
  mer:'Rettungsweglänge 30 m (bis 60 m möglich); BMA ab 1.000 m², automatische Feuerlöschanlage ab 3.600 m² Grundfläche.',
  xr:[['Trennwand Bühnenhaus','zwischen Bühnen- und Zuschauerhaus'],['Foyer als Rettungsweg','nur mit BMA und Alarmierungsanlage'],['Ausgänge','2 unabhängige bauliche Rettungswege']]},
 {id:'sc',n:'Schule',lab:'Schule',rg:'MSchulbauR',col:'#ffd24a',
  ab:'Allgemein- und berufsbildende Schulen (keine Hochhäuser, keine reinen Erwachsenenschulen)',
  q:['Allgemein- und berufsbildende Schulen mit Lernbereichen.','Interne BMA ab Lernbereichen > 600 m².'],
  bau:['Lernbereich eingeschossig bis 400 m², mehrgeschossig bis 200 m² (max. 2 Geschosse): Bauteile GK 1 bzw. 2','Lernbereich > 200 bis 600 m²: h ≤ 7 m GK 3; h ≤ 13 m hochfeuerhemmend; h > 13 m GK 5','Lernbereich > 600 bis 900 m², h > 7 m: GK 5','Brandwände: max. 60 m Brandabschnittslänge, max. 1.600 m²; bei feuerhemmendem oder hochfeuerhemmendem Tragwerk Wände anstelle Brandwand möglich (hfh-M)','Notwendiger Treppenraum nach Gebäudeklasse (GK 1 und 2 mindestens feuerhemmend), Türen mindestens rauchdicht und selbstschließend'],
  rau:['Aufenthaltsräume über 50 m² müssen öffenbare Fenster haben (7.1)','Innenliegende Aufenthaltsräume und Erschließungsbereiche über 200 m²: geeignete Maßnahmen zur Rauchableitung (7.1)','Hallen: oben Öffnung von 1 % der Grundfläche oder 2 % Öffnungen in der oberen Außenwand (7.2)'],
  bes:['Lernbereiche: mehrere Räume in einer multifunktional genutzten Zone, beliebig verbunden oder getrennt, über Erschließungsbereiche zugänglich','Hallen: Räume über mehrere Geschosse, auch Mehrzweckräume','Türen können feuerhemmend-RS sein, wenn 2,5 m öffnungslose Flurwand in beide Richtungen'],
  rw:['Zwei unabhängige bauliche Rettungswege (4.1)','Unterrichtsräume: 35 m zu einem der baulichen Rettungswege','Lernbereiche: 1. Rettungsweg 35 m zwingend zu Ausgang in Treppenraum oder ins Freie; 2. Rettungsweg weiterer Ausgang oder Lauflinie 25 m bis angrenzender Lernbereich, Außentreppe, begehbare Dächer, Rettungsbalkon','Stichflur max. 15 m; Sichtbeziehung innerhalb von Lernbereichen','Breiten: 1,2 m je 200 Personen; Flure mind. 1,50 m, Treppen 1,20 m'],
  ant:['Sicherheitsbeleuchtung, Sicherheitsstromversorgung, Alarmierung, BMA, Feuerwehrpläne','Alarmierungsanlage als Räumungssignal, verschieden vom Pausensignal','Interne BMA ab Lernbereichen > 600 m² ohne Aufschaltung auf die Feuerwehr (Kenngröße Rauch)','Sicherheitsstromversorgung für Sicherheitsbeleuchtung, Alarmierungsanlage und interne BMA'],
  mer:'Lernbereiche: Der 1. Rettungsweg (35 m) führt zwingend zum Treppenraum oder ins Freie.',
  xr:[['Brandwand','Brandabschnitt max. 1.600 m²'],['Halle: Rauchableitung','1 % der Grundfläche'],['Notwendiger Flur','mind. 1,50 m breit']]}];
const DB={};D.forEach(d=>{DB[d.id]=d;});

/* ===== three.js-Szene ===== */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const BOXG=new THREE.BoxGeometry(1,1,1);
const MC={};const M=c=>MC[c]||(MC[c]=new THREE.MeshLambertMaterial({color:c}));
const HIT=new THREE.MeshBasicMaterial({visible:false});
const XM=XC.map(c=>new THREE.MeshBasicMaterial({color:c}));
const GHOST=new THREE.MeshLambertMaterial({color:0xaec3de,transparent:true,opacity:0.12,depthWrite:false});
const edgeM=new THREE.LineBasicMaterial({color:0xdce8fa,transparent:true,opacity:0.8});
const CELL=3;
const TX={};
function winTex(kind,wall){
  const key=kind+wall;if(TX[key])return TX[key];
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
  g.fillStyle=wall;g.fillRect(0,0,64,64);
  const gl='#2c3b55',hi='rgba(255,255,255,.28)';
  if(kind==='office'){g.fillStyle=gl;g.fillRect(8,12,48,36);g.fillStyle=hi;g.fillRect(8,12,48,7);g.fillStyle=wall;g.fillRect(31,12,2,36);}
  else if(kind==='hotel'){g.fillStyle=gl;g.fillRect(8,14,20,30);g.fillRect(36,14,20,30);g.fillStyle=hi;g.fillRect(8,14,20,5);g.fillRect(36,14,20,5);}
  else if(kind==='band'){g.fillStyle=gl;g.fillRect(0,16,64,30);g.fillStyle=hi;g.fillRect(0,16,64,5);g.fillStyle=wall;g.fillRect(30,16,4,30);}
  else if(kind==='shop'){g.fillStyle=gl;g.fillRect(0,20,64,40);g.fillStyle=hi;g.fillRect(0,20,64,6);g.fillStyle=wall;g.fillRect(14,20,3,40);g.fillRect(31,20,3,40);g.fillRect(48,20,3,40);}
  else if(kind==='plain'){g.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<64;i+=8)g.fillRect(i,0,2,64);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=2;TX[key]=t;return t;
}
const bx=(par,w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(BOXG,mat);m.scale.set(w,h,d);m.position.set(x,y,z);par.add(m);return m;};
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function createScene(canvas,host,cb){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,1,520);
  const TH=Math.tan(camera.fov*Math.PI/360);
  scene.add(new THREE.HemisphereLight(0xe8f0ff,0x5a4d40,0.9));
  const sun=new THREE.DirectionalLight(0xfff2de,0.75);sun.position.set(-30,60,45);scene.add(sun);
  /* ---------- Umgebung ---------- */
  const env=new THREE.Group();scene.add(env);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(52,54,1,48),[M(0x6b4f3a),M(0x5aa066),M(0x6b4f3a)]);disc.position.y=-0.5;env.add(disc);
  [-10,10.5].forEach(z=>{bx(env,104,0.08,5.2,0,0.04,z,M(0x3a4252));bx(env,104,0.12,1,0,0.06,z-3.1,M(0xcfc9bb));bx(env,104,0.12,1,0,0.06,z+3.1,M(0xcfc9bb));
    for(let i=-9;i<=9;i++)bx(env,2,0.02,0.18,0,0.1,z).position.x=i*5.2;});
  bx(env,5.2,0.08,22,-31,0.045,0.25,M(0x3a4252));
  bx(env,16,0.1,10,2,0.05,0,M(0x86bd7c));
  {const f=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.8,0.7,20),M(0xb7bfcc));f.position.set(2,0.35,0);env.add(f);
   const w=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,0.1,20),M(0x59b4ea));w.position.set(2,0.72,0);env.add(w);
   const p=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,2.2,8),M(0xb7bfcc));p.position.set(2,1.6,0);env.add(p);}
  const trunkG=new THREE.CylinderGeometry(0.25,0.35,2,6),coneG=new THREE.ConeGeometry(2,5,7),ballG=new THREE.IcosahedronGeometry(1.9,0);
  const gr=[M(0x2f7a45),M(0x3a8a4c),M(0x4a9a4a)];
  function tree(x,z,s,k){const t=new THREE.Mesh(trunkG,M(0x6a4a30));t.position.set(x,s,z);t.scale.setScalar(s);env.add(t);
    const c=new THREE.Mesh(k?ballG:coneG,gr[Math.floor(Math.abs(x)+Math.abs(z))%3]);c.position.set(x,k?s*3.6:s*4.6,z);c.scale.setScalar(s);env.add(c);}
  [[-33,-24,1.1,0],[-8,-12.5,0.9,1],[14,-12.5,1,0],[36,-14,1.2,0],[-33,6,1.1,1],[-8,6,0.8,0],[12,5,0.9,1],[36,8,1.2,0],[-33,26,1,0],[-23,14,0.9,1],[1,15.5,0.8,0],[28,15.5,1,1],[38,24,1.1,0],[-24,-30,1.2,1],[3,-33,1,0],[30,-31,1.1,0],[-5,3.5,0.8,1],[9,-3.5,0.8,0]].forEach(a=>tree(a[0],a[1],a[2],a[3]));
  const CARC=[0xd9482e,0x3e82d8,0xe8e4d8,0x6c7a8c];
  function car(x,z,c,rot){const g=new THREE.Group();bx(g,4,0.9,1.9,0,0.65,0,M(c));bx(g,2.1,0.7,1.7,-0.2,1.4,0,M(0xdfe6f0));g.position.set(x,0,z);g.rotation.y=rot||0;env.add(g);}
  car(-14,-10.5,CARC[0],0);car(9,-9.4,CARC[1],Math.PI);car(-20,11.2,CARC[2],0);car(18,9.8,CARC[3],Math.PI);
  /* Auswahlplatte */
  const plate=bx(scene,1,0.12,1,0,0.09,0,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.28}));plate.visible=false;
  /* ---------- Gebäude ---------- */
  const B={};
  function nb(id,x,z){const b={id,x,z,g:new THREE.Group(),w:10,h:10,shell:[],edges:[],parts:[[],[],[]],anch:[],pick:null,tag:null,sh:{w:10,d:10}};b.g.position.set(x,0,z);scene.add(b.g);B[id]=b;return b;}
  const sh=(b,m)=>{m.userData.m0=m.material;b.shell.push(m);return m;};
  const px=(b,i,w,h,d,x,y,z)=>{const m=bx(b.g,w,h,d,x,y,z,XM[i]);m.visible=false;b.parts[i].push(m);return m;};
  const pk=(b,w,h,d,x,y,z)=>{b.pick=bx(b.g,w,h,d,x,y,z,HIT);b.pick.userData.bid=b.id;b.w=Math.max(w,d*0.7);b.h=h;b.sh={w,d};};
  function facade(b,w,h,d,x,y,z,kind,wall,roof){
    const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv;
    const sz=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*sz[f][0]/CELL,uv.getY(k)*sz[f][1]/CELL);}
    const sm=new THREE.MeshLambertMaterial({map:winTex(kind,wall)}),rm=M(roof);
    const m=new THREE.Mesh(g,[sm,sm,rm,rm,sm,sm]);m.position.set(x,y+h/2,z);b.g.add(m);sh(b,m);
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(g),edgeM);e.visible=false;m.add(e);b.edges.push(e);return m;}
  const BU={};
  BU.hh=b=>{const g=b.g;
    facade(b,8,30,8,0,0,0,'office','#aab8cc','#7d8aa0');
    sh(b,bx(g,8.5,0.5,8.5,0,30.25,0,M(0x6f7c92)));sh(b,bx(g,3,1.6,3,-1.5,31.3,1,M(0x8a96aa)));
    bx(g,8.3,0.4,8.3,0,22,0,M(0xe8483f));
    pk(b,8.6,31.6,8.6,0,15.8,0);
    px(b,0,2.2,29.6,2.2,-2.5,14.9,-2.5);px(b,1,1.6,29.6,1.6,1.4,14.9,-2.7);px(b,2,0.6,29.6,0.6,2.8,14.9,2.2);
    b.anch=[V3(-2.5,26,-2.5),V3(1.4,22,-2.7),V3(2.8,17,2.2)];b.tag={t:'22 m',p:V3(4.4,22,4.4)};};
  BU.vk=b=>{const g=b.g;
    facade(b,18,6,11,0,0,0,'shop','#e6d8bd','#8b93a3');
    sh(b,bx(g,18.6,0.4,11.6,0,6.2,0,M(0x7d8596)));
    bx(g,6,0.4,2.6,0,3.6,6.6,M(0xd8452f));bx(g,0.3,3.5,0.3,-2.7,1.75,7.7,M(0xcfd4dc));bx(g,0.3,3.5,0.3,2.7,1.75,7.7,M(0xcfd4dc));
    sh(b,bx(g,7,1.7,0.4,0,7.3,4.4,M(0xd8452f)));sh(b,bx(g,2.6,1.2,2.6,-6,7,-2,M(0x9aa3b2)));sh(b,bx(g,2.6,1.2,2.6,5,7,-2.5,M(0x9aa3b2)));
    pk(b,18.4,7,11.6,0,3.5,0);
    px(b,0,17,0.3,3.4,0,0.2,0);
    for(const z of [-3.6,0,3.6])px(b,1,16.8,0.32,0.32,0,5.2,z);
    for(let i=-3;i<=3;i++)px(b,1,0.28,0.28,9.6,i*2.4,5.1,0);
    px(b,2,2.6,6.4,3.6,-7.3,3.2,-3.6);
    b.anch=[V3(6,1.6,0),V3(-3,5.8,3.6),V3(-7.3,6.9,-3.6)];};
  BU.be=b=>{const g=b.g;
    facade(b,10,12,8,0,0,0,'hotel','#ebcdb0','#7b6a63');
    sh(b,bx(g,10.8,0.5,8.8,0,12.25,0,M(0x6d5e58)));
    bx(g,4.4,0.35,2.4,0,3.2,5.1,M(0x4a5a72));bx(g,0.3,3.1,0.3,-1.9,1.55,6.1,M(0xcfd4dc));bx(g,0.3,3.1,0.3,1.9,1.55,6.1,M(0xcfd4dc));
    for(let k=1;k<4;k++)bx(g,9,0.22,1.1,0,k*3,4.55,M(0xd9dfe8));
    pk(b,11,12.6,9,0,6.3,0);
    px(b,0,2.4,11.6,2.6,-3.7,5.9,-2.4);
    px(b,1,1.5,11.6,3,5.9,5.9,-1);px(b,1,1.5,0.5,0.5,5.9,5.9,0.8);
    for(let k=0;k<4;k++)px(b,2,8.2,0.3,1.4,0.5,0.35+k*3,0.4);
    b.anch=[V3(-3.7,10,-2.4),V3(5.9,10,-1),V3(1.5,9.5,0.4)];};
  BU.in=b=>{const g=b.g;
    facade(b,18,8,12,0,0,0,'plain','#c3c9d1','#7f8896');
    for(const x of [-6,0,6])bx(g,3.4,3.6,0.18,x,1.8,6.05,M(0x4a5565));
    for(const x of [-7,-1.5,7])sh(b,bx(g,3,0.9,3,x,8.45,-1,M(0x5f6b7d)));
    const ch=new THREE.Mesh(new THREE.CylinderGeometry(0.8,1,14,10),M(0xa8aeb8));ch.position.set(-7.5,7,-8);g.add(ch);
    pk(b,18.4,8.6,12.4,0,4.3,0);
    px(b,0,0.6,8.6,12.5,3,4.3,0);
    for(const x of [-7,-1.5,7])px(b,1,3.3,1.1,3.3,x,8.5,-1);
    px(b,2,22,0.12,1.6,0,0.12,8.6);px(b,2,22,0.12,1.6,0,0.12,-8.6);px(b,2,1.6,0.12,18,-11.2,0.12,0);px(b,2,1.6,0.12,18,11.2,0.12,0);
    b.anch=[V3(3,9.2,0),V3(7,9.6,-1),V3(0,0.3,8.6)];};
  BU.ga=b=>{const g=b.g;
    const slab=M(0xaab2bd);
    for(let k=0;k<5;k++)sh(b,bx(g,12,0.35,10,0,k*2.8+0.17,0,slab));
    for(let k=0;k<4;k++){const y=k*2.8+0.8;
      sh(b,bx(g,12,0.9,0.25,0,y,4.85,M(0xd4d9e0)));sh(b,bx(g,12,0.9,0.25,0,y,-4.85,M(0xd4d9e0)));
      sh(b,bx(g,0.25,0.9,10,5.85,y,0,M(0xd4d9e0)));sh(b,bx(g,0.25,0.9,10,-5.85,y,0,M(0xd4d9e0)));}
    for(const x of [-5.7,0,5.7])for(const z of [-4.7,4.7])sh(b,bx(g,0.5,11.2,0.5,x,5.6,z,slab));
    const tw=facade(b,3.2,11.6,3.6,4.2,0,-3,'plain','#b9c0cb','#7f8896');
    const cc=[0xd9482e,0x3e82d8,0xe8e4d8,0x4c5a70];
    for(let k=0;k<4;k++){bx(g,1.8,0.9,3.6,-3.6,k*2.8+0.8,0.5+(k%2),M(cc[k]));bx(g,1.8,0.9,3.6,-0.4,k*2.8+0.8,0.8-(k%2),M(cc[(k+2)%4]));}
    pk(b,12.4,11.8,10.4,0,5.9,0);
    for(let k=0;k<4;k++)px(b,0,11,0.5,0.18,0,k*2.8+2.35,5.0);
    for(let k=0;k<4;k++)px(b,1,1.2,2.3,2,1.8,k*2.8+1.4,-3);
    px(b,2,0.4,11.4,0.4,4.2,5.7,-0.9);
    b.anch=[V3(-4,10.2,5.0),V3(1.8,10.3,-3),V3(4.2,6.5,-0.9)];};
  BU.vs=b=>{const g=b.g;
    facade(b,14,4,4,0,0,8,'shop','#d9cdbb','#7b8598');
    facade(b,14,9,9,0,0,1.5,'band','#d3c7b3','#7b8598');
    facade(b,10,13,6,0,0,-6,'plain','#c0b7a7','#7b8598');
    const vault=new THREE.Mesh(new THREE.CylinderGeometry(7,7,9,16,1,false,Math.PI/2,Math.PI),M(0x6c7a90));
    const vg=new THREE.Group();vault.rotation.x=Math.PI/2;vg.add(vault);vg.scale.y=0.36;vg.position.set(0,9,1.5);g.add(vg);sh(b,vault);
    sh(b,bx(g,14.4,0.4,4.4,0,4.2,8,M(0x7b8598)));
    bx(g,6,0.4,2.4,0,3.4,10.2,M(0xc9553a));
    pk(b,14.4,13.6,18.4,0,6.8,0);
    px(b,1,10.2,13,0.5,0,6.5,-3);px(b,1,2,9,0.5,6,4.5,-3);px(b,1,2,9,0.5,-6,4.5,-3);
    px(b,0,6.4,5,0.25,0,3,-2.55);
    for(const x of [-4.5,0,4.5])px(b,2,1.8,2.6,0.3,x,1.3,10.1);
    px(b,2,0.3,2.6,1.8,7.1,1.3,3);px(b,2,0.3,2.6,1.8,-7.1,1.3,3);
    b.anch=[V3(0,5,-2.4),V3(4.2,11,-3),V3(4.5,3,10.3)];};
  BU.sc=b=>{const g=b.g;
    facade(b,14,9,9,-4.5,0,0,'office','#d7bd9c','#85715d');
    facade(b,8,9,11,6.5,0,0,'band','#d9c9ae','#85715d');
    sh(b,bx(g,14.8,0.4,9.8,-4.5,9.2,0,M(0x6c5f52)));sh(b,bx(g,8.6,0.4,11.6,6.5,9.2,0,M(0x6c5f52)));
    bx(g,4,0.3,2.4,-4.5,3.4,5.1,M(0x7a6a5a));bx(g,0.3,3.3,0.3,-6.3,1.65,6.1,M(0xcfd4dc));bx(g,0.3,3.3,0.3,-2.7,1.65,6.1,M(0xcfd4dc));
    const fp=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,8,6),M(0xcfd4dc));fp.position.set(-10,4,6.5);g.add(fp);bx(g,1.4,0.9,0.05,-9.3,7.3,6.5,M(0xd8452f));
    pk(b,22.2,9.8,11.6,-0.5,4.9,0);
    px(b,0,0.6,9.6,9.4,2.5,4.8,0);
    px(b,1,3.4,0.7,5.4,6.5,9.55,0);
    for(let k=0;k<3;k++)px(b,2,12.4,0.3,1.8,-4.5,k*3+0.3,0.4);
    b.anch=[V3(2.5,7.5,0),V3(6.5,10.4,0),V3(-4.5,6.4,0.4)];};
  /* Anordnung: hinten Industrie, Versammlung, Hochhaus; Mitte Garage, Beherbergung; vorn Schule, Verkauf */
  [['in',-18,-21],['vs',2,-21],['hh',22,-21],['ga',-18,0],['be',22,0],['sc',-8,21],['vk',14,21]].forEach(a=>{const b=nb(a[0],a[1],a[2]);BU[a[0]](b);});
  /* ---------- Beschriftungen ---------- */
  const lbls=document.createElement('div');lbls.className='lbls';host.appendChild(lbls);
  D.forEach(d=>{const b=B[d.id];const e=document.createElement('button');e.type='button';e.className='lab';e.textContent=d.lab;e.style.setProperty('--c',d.col);
    e.addEventListener('click',ev=>{ev.stopPropagation();cb.onPick&&cb.onPick(d.id);});lbls.appendChild(e);b.lab=e;
    b.badges=d.xr.map((_,i)=>{const n=document.createElement('span');n.className='nb';n.textContent=i+1;n.style.background=XC[i];lbls.appendChild(n);return n;});});
  const tagEl=document.createElement('span');tagEl.className='tg';lbls.appendChild(tagEl);
  /* ---------- Kamera ---------- */
  const T0={x:2,y:8,z:-2};
  let asp=1;
  const homeR=()=>Math.max(33*1.1/(TH*asp),36*1.12/TH);
  const focusR=b=>Math.max((b.w*0.78+6)/(TH*asp),(b.h*(b.h>20?0.68:1.0)+6)/TH,24);
  const cam={th:-0.28,ph:0.82,r:130,tx:T0.x,ty:T0.y,tz:T0.z};
  const goal=Object.assign({},cam);
  let inited=false,raf=0,last=0,labMode='all',selId=null,xrOn=false,xrB=null;
  function setSize(){const w=host.clientWidth||300,h=host.clientHeight||300;renderer.setSize(w,h,false);camera.aspect=w/h;asp=w/h;camera.updateProjectionMatrix();if(!selId){goal.r=homeR();cam.r=goal.r;}else{goal.r=focusR(B[selId]);cam.r=goal.r;}kick();}
  const ro=new ResizeObserver(setSize);ro.observe(host);
  function applyCam(){camera.position.set(cam.tx+cam.r*Math.sin(cam.ph)*Math.sin(cam.th),cam.ty+cam.r*Math.cos(cam.ph),cam.tz+cam.r*Math.sin(cam.ph)*Math.cos(cam.th));camera.lookAt(cam.tx,cam.ty,cam.tz);camera.updateMatrixWorld();}
  const pv=new THREE.Vector3();
  function place(el,v,dy){pv.copy(v).project(camera);const w=host.clientWidth,h=host.clientHeight;
    if(pv.z>1||pv.z<-1){el.style.display='none';return;}el.style.display='';
    el.style.transform='translate('+Math.round((pv.x*0.5+0.5)*w)+'px,'+Math.round((-pv.y*0.5+0.5)*h)+'px) translate(-50%,'+dy+')';}
  const lv=new THREE.Vector3();
  function labels(){
    D.forEach(d=>{const b=B[d.id];const on=labMode==='all'||(labMode==='sel'&&selId===d.id);
      b.lab.style.visibility=on?'visible':'hidden';b.lab.classList.toggle('on',selId===d.id);
      if(on){lv.set(b.x,b.id==='hh'?25:b.h+2.4,b.z);place(b.lab,lv,'-100%');}
      const showB=xrOn&&selId===d.id;
      b.badges.forEach((n,i)=>{n.style.visibility=showB?'visible':'hidden';if(showB){lv.copy(b.anch[i]).add(b.g.position);place(n,lv,'-50%');}});});
    const tb=selId&&B[selId].tag;tagEl.style.visibility=tb?'visible':'hidden';
    if(tb){tagEl.textContent=tb.t;lv.copy(tb.p).add(B[selId].g.position);place(tagEl,lv,'-50%');}}
  function frame(now){raf=0;const dt=Math.min(0.1,Math.max(0.001,(now-last)/1000||0.016));last=now;
    let moving=false;const e=1-Math.exp(-dt*5.5);
    ['th','ph','r','tx','ty','tz'].forEach(k=>{const d=goal[k]-cam[k];if(Math.abs(d)>(k==='r'?0.05:0.002)){cam[k]+=d*e;moving=true;}else cam[k]=goal[k];});
    applyCam();labels();renderer.render(scene,camera);
    if(moving)raf=requestAnimationFrame(frame);}
  function kick(){if(!raf){last=performance.now();raf=requestAnimationFrame(frame);}}
  /* ---------- Röntgenblick ---------- */
  function applyXray(){const want=xrOn&&selId?B[selId]:null;
    if(xrB&&xrB!==want){xrB.shell.forEach(m=>{m.material=m.userData.m0;});xrB.edges.forEach(e=>{e.visible=false;});xrB.parts.forEach(p=>p.forEach(m=>{m.visible=false;}));xrB=null;}
    if(want&&xrB!==want){want.shell.forEach(m=>{m.material=GHOST;});want.edges.forEach(e=>{e.visible=true;});want.parts.forEach(p=>p.forEach(m=>{m.visible=true;}));xrB=want;}}
  /* ---------- Eingabe ---------- */
  canvas.style.touchAction='none';
  const ptrs=new Map();let pinch0=0,r0=1,moved=0,t0=0;
  canvas.addEventListener('pointerdown',e=>{try{canvas.setPointerCapture(e.pointerId);}catch(_){}ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptrs.size===1){moved=0;t0=performance.now();}
    if(ptrs.size===2){const a=[...ptrs.values()];pinch0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);r0=cam.r;moved=99;}});
  canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;
    if(ptrs.size===1){const dx=e.clientX-p.x,dy=e.clientY-p.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6){cam.th-=dx*0.0075;cam.ph=clamp(cam.ph-dy*0.005,0.3,1.45);goal.th=cam.th;goal.ph=cam.ph;goal.r=cam.r;goal.tx=cam.tx;goal.ty=cam.ty;goal.tz=cam.tz;kick();}}
    p.x=e.clientX;p.y=e.clientY;
    if(ptrs.size===2){const a=[...ptrs.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);cam.r=clamp(r0*pinch0/Math.max(d,1),12,homeR()*1.25);goal.r=cam.r;kick();}});
  const up=e=>{const had=ptrs.has(e.pointerId);ptrs.delete(e.pointerId);
    if(had&&e.type==='pointerup'&&ptrs.size===0&&moved<=6&&performance.now()-t0<600)tap(e.clientX,e.clientY);if(ptrs.size===0)moved=0;};
  canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',e=>{e.preventDefault();cam.r=clamp(cam.r*Math.exp(e.deltaY*0.0012),12,homeR()*1.25);goal.r=cam.r;kick();},{passive:false});
  const ray=new THREE.Raycaster(),mp=new THREE.Vector2();
  const picks=D.map(d=>B[d.id].pick);
  function tap(cx,cy){const r=canvas.getBoundingClientRect();mp.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(mp,camera);
    const hit=ray.intersectObjects(picks,false);cb.onPick&&cb.onPick(hit.length?hit[0].object.userData.bid:null);}
  /* ---------- Schnittstelle ---------- */
  function show(o){
    labMode=o.labels;xrOn=!!o.xray;
    if(o.focus!==selId||!inited){
      inited=true;selId=o.focus;
      if(selId){const b=B[selId];goal.tx=b.x;goal.ty=b.h*0.5;goal.tz=b.z;goal.r=focusR(b);goal.th=-0.35;goal.ph=1.0;
        plate.visible=true;plate.scale.set(b.sh.w+2,0.12,b.sh.d+2);plate.position.set(b.x,0.09,b.z);}
      else{goal.tx=T0.x;goal.ty=T0.y;goal.tz=T0.z;goal.r=homeR();goal.th=-0.28;goal.ph=0.82;plate.visible=false;}}
    applyXray();kick();}
  function screenOf(id){const b=B[id];applyCam();const v=new THREE.Vector3(b.x,b.h*0.35,b.z).project(camera);const r=canvas.getBoundingClientRect();return {x:r.left+(v.x*0.5+0.5)*r.width,y:r.top+(-v.y*0.5+0.5)*r.height};}
  return {show,screenOf,home(){show({focus:null,labels:labMode,xray:false});},
    dispose(){if(raf)cancelAnimationFrame(raf);ro.disconnect();renderer.dispose();lbls.remove();}};
}

/* ===== Oberfläche (React) ===== */
const h=React.createElement;
const {useState,useEffect,useRef,useMemo,useCallback}=React;
const css=`
:root{--bg:#0d1522;--pn:var(--card,#162132);--pn2:var(--soft,#1d2b40);--pn3:var(--line,#243550);--tx:var(--ink,#eef2f8);--mu:var(--mute,#9aa8bd);--ac:var(--or,#ffa412);--ok:#35d07f;--bad:#ff6a4d;--ln:var(--line,rgba(255,255,255,.09))}
body{background:var(--bg);color:var(--tx);-webkit-tap-highlight-color:transparent}
button{font-family:inherit}
.app{display:flex;flex-direction:column;height:100%;height:100dvh}
.stage{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;background:var(--bg)}
.stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.lbls{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2}
.lab{position:absolute;left:0;top:0;pointer-events:auto;will-change:transform;white-space:nowrap;border:2px solid var(--c);background:rgba(13,21,34,.78);color:#fff;font:700 12px/1 inherit;font-family:inherit;border-radius:10px;padding:6px 9px;cursor:pointer;margin-top:-4px}
.lab.on{background:var(--c);color:#14110a}
.nb{position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;color:#14110a;font:800 13px/24px inherit;text-align:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45)}
.tg{position:absolute;left:0;top:0;font:800 11px/1 inherit;color:#fff;background:#e8483f;border-radius:6px;padding:3px 6px}
.topr{position:absolute;right:10px;top:10px;display:flex;gap:6px;z-index:4}
.ibtn{min-width:44px;height:44px;border-radius:12px;border:0;background:rgba(13,21,34,.74);color:#fff;font:700 13.5px inherit;font-family:inherit;padding:0 12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
.ibtn svg{width:20px;height:20px}
.ibtn.on{background:var(--ac);color:var(--onor,#241503)}
.hint{position:absolute;left:50%;transform:translateX(-50%);bottom:8px;width:max-content;max-width:calc(100% - 20px);text-align:center;font-size:11.5px;color:#e7edf7;pointer-events:none;z-index:4;background:rgba(13,21,34,.64);border-radius:10px;padding:4px 10px;line-height:1.3}
.xleg{position:absolute;left:10px;bottom:8px;right:10px;max-width:430px;z-index:4;background:rgba(13,21,34,.82);border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;gap:5px;color:#fff;pointer-events:none}
.xl{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;line-height:1.3}
.xl i{flex:0 0 20px;height:20px;border-radius:50%;font:800 12px/20px inherit;font-style:normal;text-align:center;color:#14110a}
.xl b{font-weight:700}.xl span{opacity:.82}
.panel{flex:0 0 auto;height:50%;display:flex;flex-direction:column;background:var(--pn);border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.3);position:relative;z-index:3}
.pbody{flex:1;overflow:auto;padding:12px 14px 10px;-webkit-overflow-scrolling:touch}
.tabs{order:2;display:flex;gap:6px;padding:6px 10px calc(6px + env(safe-area-inset-bottom));border-top:1px solid var(--ln)}
.tab{flex:1;min-height:50px;border:0;border-radius:14px;background:transparent;color:var(--mu);font:700 12.5px/1.1 inherit;font-family:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer}
.tab svg{width:22px;height:22px}
.tab.on{background:color-mix(in srgb,var(--ac) 16%,transparent);color:var(--ac)}
@media(min-width:900px){
 .app{flex-direction:row}
 .panel{height:100%;width:430px;border-radius:0;order:2;box-shadow:-10px 0 30px rgba(0,0,0,.25)}
 .tabs{order:0;border-top:0;border-bottom:1px solid var(--ln);padding:12px}
 .tab{flex-direction:row;gap:8px;font-size:14px}
 .pbody{padding:16px 20px}
}
h2{margin:0;font-size:19px;line-height:1.2}
p{margin:0 0 9px;line-height:1.45;font-size:14.5px}
.mu{color:var(--mu)}
.lead{font-size:13.5px;color:var(--mu);margin:0 0 10px}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chip{min-height:44px;border-radius:22px;border:1px solid var(--ln);background:var(--pn2);color:var(--tx);font:700 13.5px/1.1 inherit;font-family:inherit;padding:0 14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
.chip i{width:12px;height:12px;border-radius:50%;flex:0 0 12px}
.chip.on{background:var(--ac);border-color:var(--ac);color:var(--onor,#241503)}
.chip.sm{font-weight:600;font-size:13px}
.more{width:100%;min-height:44px;margin-top:12px;border-radius:14px;border:1px dashed var(--ln);background:transparent;color:var(--mu);font:700 13.5px inherit;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:0 14px}
.more svg{width:18px;height:18px;transition:transform .15s}.more.open svg{transform:rotate(180deg)}
.note{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:var(--pn2);border:1px solid var(--ln);font-size:13.5px;line-height:1.4}
.note b{display:block;margin-bottom:2px}
.head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.back{flex:0 0 44px;width:44px;height:44px;border-radius:12px;border:1px solid var(--ln);background:var(--pn2);color:var(--tx);cursor:pointer;display:flex;align-items:center;justify-content:center}
.back svg{width:22px;height:22px}
.rgl{font-size:12.5px;color:var(--mu);margin-top:2px}.rgl b{color:var(--ac)}
.ab{border-radius:12px;background:var(--pn2);border:1px solid var(--ln);padding:8px 12px;margin-bottom:10px;font-size:13.5px;line-height:1.35}
.ab span{display:block;font-size:11.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--mu)}
ul.bul{margin:12px 0 0;padding:0;list-style:none}
ul.bul li{position:relative;padding:0 0 8px 20px;font-size:14.5px;line-height:1.4}
ul.bul li:before{content:"";position:absolute;left:3px;top:.5em;width:8px;height:8px;border-radius:50%;background:var(--ac)}
.mer{margin-top:12px;padding:12px 14px;border-radius:14px;background:color-mix(in srgb,var(--ac) 14%,var(--pn2));border-left:4px solid var(--ac);font-size:15.5px;line-height:1.45;font-weight:600}
.qh{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--mu);margin-bottom:8px}
.dots{display:flex;gap:5px}.dots i{width:10px;height:10px;border-radius:50%;background:var(--pn3)}.dots i.ok{background:var(--ok)}.dots i.no{background:var(--bad)}.dots i.cur{outline:2px solid var(--ac);outline-offset:1px}
.qc{border-radius:14px;background:var(--pn2);border:1px solid var(--ln);padding:12px 14px;margin-bottom:10px}
.qc span{font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--mu)}
.qc p{margin:4px 0 0;font-size:16px;font-weight:600}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.opt{min-height:52px;border-radius:14px;border:1px solid var(--ln);background:var(--pn2);color:var(--tx);font:700 14px/1.2 inherit;font-family:inherit;padding:6px 10px;cursor:pointer}
.opt.ok{background:var(--ok);border-color:var(--ok);color:#06240f}.opt.no{background:var(--bad);border-color:var(--bad);color:#2a0b04}
.opt:disabled{cursor:default}.opt.dim{opacity:.55}
.btn{min-height:48px;border-radius:14px;border:0;font:700 15px inherit;font-family:inherit;padding:0 18px;cursor:pointer;background:var(--ac);color:var(--onor,#241503);width:100%;margin-top:10px}
.fb{margin-top:10px;font-size:14px;line-height:1.4}.fb b{display:block;font-size:16px}
.big{font-size:34px;font-weight:800;color:var(--ac);margin:4px 0}
@media(min-height:1000px) and (max-width:899px){.panel{height:40%}}
@media(max-width:380px){.opts{grid-template-columns:1fr}}
`;
const SV=(p,ch)=>h('svg',Object.assign({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},p),ch);
const ICON={
 q:SV({},[h('path',{key:1,d:'M3 21V10l5-3v14M8 21V4l7 3v14M15 21v-9l6 2v7M3 21h18'})]),
 quiz:SV({},[h('circle',{key:1,cx:12,cy:12,r:9}),h('path',{key:2,d:'M8.5 12.5l2.5 2.5 4.5-5'})]),
 reset:SV({},[h('path',{key:1,d:'M3 12a9 9 0 1 0 3-6.7'}),h('path',{key:2,d:'M3 4v5h5'})]),
 eye:SV({},[h('path',{key:1,d:'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z'}),h('circle',{key:2,cx:12,cy:12,r:3})]),
 back:SV({},[h('path',{key:1,d:'M15 5l-7 7 7 7'})]),
 chev:SV({},[h('path',{key:1,d:'M6 9l6 6 6-6'})])};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function makeQuiz(){
  const qs=shuffle(D).slice(0,5).map((d,i)=>{
    const type=i%2?'vo':'bau';const others=shuffle(D.filter(x=>x.id!==d.id)).slice(0,3);
    const opts=shuffle(others.concat([d])).map(x=>({k:x.id,t:type==='bau'?x.n:x.rg}));
    return {id:d.id,type,clue:d.q[Math.floor(Math.random()*2)],opts};});
  return {qs,i:0,pick:null,res:[]};
}
function Stage({apiRef,onPick,children}){
  const cv=useRef(null),host=useRef(null);
  useEffect(()=>{const s=createScene(cv.current,host.current,{onPick:id=>onPick.current&&onPick.current(id)});apiRef.current=s;window.__sb=s;return()=>{s.dispose();apiRef.current=null;};},[]);
  return h('div',{className:'stage',ref:host},h('canvas',{ref:cv}),children);
}
function Quartier({sel,setSel,kp,setKp,more,setMore,mo,setMo}){
  if(!sel){
    return h('div',null,
      h('p',{className:'lead'},'Tippe ein Gebäude im Quartier oder hier an.'),
      h('div',{className:'chips'},D.map(d=>h('button',{key:d.id,className:'chip',onClick:()=>setSel(d.id)},h('i',{style:{background:d.col}}),d.n))));
  }
  const d=DB[sel],pts=d[kp];
  return h('div',null,
    h('div',{className:'head'},
      h('button',{className:'back','aria-label':'Zurück zur Übersicht',onClick:()=>setSel(null)},ICON.back),
      h('div',null,h('h2',null,d.n),h('div',{className:'rgl'},'Rechtsgrundlage: ',h('b',null,d.rg)))),
    h('div',{className:'ab'},h('span',null,'Ab wann Sonderbau?'),d.ab),
    h('div',{className:'chips',role:'tablist'},KP.map(k=>h('button',{key:k[0],role:'tab','aria-selected':kp===k[0],className:'chip'+(kp===k[0]?' on':''),onClick:()=>setKp(k[0])},k[1]))),
    kp==='mer'?h('div',{className:'mer'},d.mer):h('ul',{className:'bul'},pts.map((t,i)=>h('li',{key:i},t))));
}
function Quiz({quiz,setQuiz}){
  const q=quiz.qs[quiz.i];
  if(!q){
    const n=quiz.res.filter(Boolean).length;
    return h('div',null,h('div',{className:'qc'},h('span',null,'Ergebnis'),h('div',{className:'big'},n+' von 5'),
      h('p',{className:'mu',style:{fontSize:14,fontWeight:500}},n===5?'Alle Sonderbauten erkannt.':n>=3?'Gut. Schau dir die übrigen Gebäude im Quartier noch einmal an.':'Sieh dir die Gebäude im Quartier in Ruhe an und versuche es erneut.')),
      h('div',{className:'dots',style:{justifyContent:'center'}},quiz.res.map((r,i)=>h('i',{key:i,className:r?'ok':'no'}))),
      h('button',{className:'btn',onClick:()=>setQuiz(makeQuiz())},'Nochmal'));
  }
  const ans=quiz.pick!=null,d=DB[q.id];
  return h('div',null,
    h('div',{className:'qh'},h('span',null,'Frage '+(quiz.i+1)+' von 5'),h('div',{className:'dots'},[0,1,2,3,4].map(i=>h('i',{key:i,className:i<quiz.res.length?(quiz.res[i]?'ok':'no'):i===quiz.i?'cur':''})))),
    h('div',{className:'qc'},h('span',null,q.type==='bau'?'Welcher Sonderbau ist das?':'Welche Vorschrift gilt?'),h('p',null,q.clue)),
    h('div',{className:'opts'},q.opts.map(o=>h('button',{key:o.k,className:'opt'+(ans?(o.k===q.id?' ok':o.k===quiz.pick?' no':' dim'):''),disabled:ans,onClick:()=>setQuiz(z=>({...z,pick:o.k,res:z.res.concat([o.k===q.id])}))},o.t))),
    ans&&h('div',{className:'fb'},h('b',null,quiz.pick===q.id?'Richtig!':'Nicht ganz.'),d.n+' · '+d.rg),
    ans&&h('button',{className:'btn',onClick:()=>setQuiz(z=>({...z,i:z.i+1,pick:null}))},quiz.i>=4?'Ergebnis':'Weiter'));
}
function App(){
  const [tab,setTab]=useState('q');
  const [sel,setSel0]=useState(null);
  const [kp,setKp]=useState('bau');
  const [xray,setXray]=useState(false);
  const [more,setMore]=useState(false);
  const [mo,setMo]=useState(null);
  const [quiz,setQuiz]=useState(makeQuiz);
  const api=useRef(null),pickRef=useRef(null),tabRef=useRef(tab),pbRef=useRef(null);
  tabRef.current=tab;
  const setSel=useCallback(id=>{setSel0(id);setKp('bau');},[]);
  pickRef.current=id=>{if(tabRef.current==='q')setSel(id);};
  const qCur=quiz.qs[quiz.i];
  useEffect(()=>{const a=api.current;if(!a)return;
    if(tab==='q')a.show({focus:sel,labels:sel?'none':'all',xray:xray&&!!sel});
    else{const done=qCur&&quiz.pick!=null;a.show({focus:done?qCur.id:null,labels:'none',xray:false});}
  },[tab,sel,xray,quiz.i,quiz.pick,quiz.qs]);
  useEffect(()=>{if(pbRef.current)pbRef.current.scrollTop=0;},[tab,sel]);
  const d=sel&&tab==='q'?DB[sel]:null;
  const stage=h(Stage,{apiRef:api,onPick:pickRef},
    h('div',{className:'topr'},
      d&&h('button',{className:'ibtn'+(xray?' on':''),'aria-pressed':xray,onClick:()=>setXray(!xray)},ICON.eye,'Röntgenblick'),
      h('button',{className:'ibtn','aria-label':'Ansicht zurücksetzen',onClick:()=>{if(tab==='q')setSel(null);else api.current&&api.current.home();}},ICON.reset)),
    d&&xray?h('div',{className:'xleg'},d.xr.map((x,i)=>h('div',{key:i,className:'xl'},h('i',{style:{background:XC[i]}},i+1),h('div',null,h('b',null,x[0]),' ',h('span',null,x[1]))))):
      (tab==='q'||qCur)&&h('div',{className:'hint'},tab==='q'?(d?'Ziehen dreht · Pinch zoomt':'Gebäude antippen · Ziehen dreht · Pinch zoomt'):'Das Gebäude erscheint nach der Antwort'));
  const body=tab==='q'?h(Quartier,{sel,setSel,kp,setKp,more,setMore,mo,setMo}):h(Quiz,{quiz,setQuiz});
  const tabs=h('div',{className:'tabs',role:'tablist'},[['q','Quartier'],['quiz','Quiz']].map(a=>h('button',{key:a[0],role:'tab','aria-selected':tab===a[0],className:'tab'+(tab===a[0]?' on':''),onClick:()=>setTab(a[0])},ICON[a[0]],a[1])));
  return h('div',{className:'app'},stage,h('div',{className:'panel'},tabs,h('div',{className:'pbody',ref:pbRef},body)));
}
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
