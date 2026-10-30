/* ===== Sonderbauten-Quartier: kleines 3D-Quartier mit den Sonderbau-Typen der Lernseite ===== */
/* ===== Fachdaten (nur Werte aus der Lernseite „Vorbeugender Brandschutz“) ===== */
const KP=[['rw','Rettungswege'],['bau','Baulich'],['ant','Technik'],['bes','Besonderheit'],['mer','Merksatz']];
const XC=['#ff4d2e','#16b8ff','#ffd21f']; /* Farben der Röntgen-Bauteile */
const D=[
 {id:'hh',n:'Hochhaus',lab:'Hochhaus',rg:'MHHR',col:'#5aa9ff',
  ab:'OKFF der obersten Nutzungseinheit > 22 m',
  q:['OKFF der obersten Nutzungseinheit liegt höher als 22 m.','Sicherheitstreppenraum und Feuerwehraufzug sind vorgeschrieben.'],
  rw:['2 voneinander unabhängige bauliche Rettungswege je Nutzungseinheit und Geschoss','Rettungsweglänge max. 35 m bis Treppenraum oder Ausgang','Stichflure max. 15 m','Lichte Breite jedes Rettungsweges mind. 1,20 m'],
  bau:['Tragende Bauteile und Außenwände nichtbrennbar','Bis 60 m F90, über 60 m F120','Wände notwendiger Flure: F30','Tür von der Nutzungseinheit zum Flur: T30-RS'],
  ant:['BMA mit automatischen Meldern, Brandfallsteuerung der Aufzüge','Nasse Steigleitung mit Wandhydranten Typ F (3 × 200 l/min bei 4,5 bar)','Druckbelüftung: Sicherheitstreppenraum-Vorraum 2,0 m/s, Feuerwehraufzug-Vorraum 0,75 m/s','ELA Pflicht, automatische Feuerlöschanlage'],
  bes:['Bis 60 m: 1 Sicherheitstreppenraum statt 2 notwendiger Treppenräume','Über 60 m: alle notwendigen Treppenräume als Sicherheitstreppenräume','Feuerwehraufzug: Haltestelle in jedem Geschoss, Vorraum mind. 6 m²','Brandschutzbeauftragter benennen'],
  mer:'Bis 60 m genügt ein Sicherheitstreppenraum, darüber sind alle notwendigen Treppenräume Sicherheitstreppenräume.',
  xr:[['Sicherheitstreppenraum','bis 60 m: 1 statt 2 notwendige Treppenräume'],['Feuerwehraufzug','Vorraum mind. 6 m², Druckbelüftung'],['Nasse Steigleitung','Wandhydranten Typ F']]},
 {id:'vk',n:'Verkaufsstätte',lab:'Verkaufsstätte',rg:'MVKVO',col:'#ff9f43',
  ab:'Verkaufsräume und Ladenstraßen > 2.000 m² (Sonderbau ab > 800 m²)',
  q:['Verkaufsräume und Ladenstraßen mit mehr als 2.000 m².','Ladenstraßen mind. 5,00 m breit, Sprinkleranlage Pflicht.'],
  rw:['Mind. 2 unabhängige Rettungswege je Verkaufsraum, Aufenthaltsraum und Ladenstraße','Verkaufsraum: max. 25 m Luftlinie, Lauflinie max. 35 m bis Ausgang oder Treppenraum','Ausgänge und Hauptgänge mind. 2,00 m, Ladenstraßen mind. 5,00 m','Rettungswege bis zur öffentlichen Verkehrsfläche'],
  bau:['Tragwerk: erdgeschossig ohne Sprinkler F30, mit Sprinkler keine Anforderung; mehrgeschossig F90','Notwendiger Treppenraum: Wände in Bauart einer Brandwand (REI 90-M (F 90-A))','Brandabschnitt erdgeschossig bis 3.000 m², mit Sprinkler bis 10.000 m²','Trennwände F90 zu fremden Räumen, keine Türen'],
  ant:['Sprinkleranlage Pflicht (Ausnahmen bei erdgeschossig bis 3.000 m²)','BMA mit automatischen Meldern, zur Feuerwehr aufgeschaltet','Rauch- und Wärmeabzug: Verkaufsräume > 50 m², Lagerräume > 200 m², Ladenstraßen','Sicherheitsbeleuchtung und Sicherheitsstromversorgung'],
  bes:['Ladenstraße als Abschnittsbildung statt Brandwand: 10 m breit, keine Einbauten außer Fahrtreppen, Aufzügen, Technik','Rechenbeispiel gesprinklert: Rettungsweg bis max. 140 m','Brandschutzbeauftragter Pflicht','A > 5.000 m²: gesondertes Räumungskonzept'],
  mer:'1. und 2. Rettungsweg baulich, und beide bis zur öffentlichen Verkehrsfläche.',
  xr:[['Ladenstraße','mind. 5,00 m breit, Rauch- und Wärmeabzug'],['Sprinkleranlage','Pflicht, Ausnahmen begrenzt'],['Treppenraum','Wände in Bauart einer Brandwand']]},
 {id:'be',n:'Beherbergungsstätte',lab:'Beherbergung',rg:'MBeVO',col:'#ee73b4',
  ab:'Mehr als 12 Gastbetten',
  q:['Mehr als 12 Gastbetten.','Rettungswegplan in jedem Zimmer, BMA ab mehr als 60 Gastbetten.'],
  rw:['Je Beherbergungsraum 2 unabhängige Rettungswege','1. Rettungsweg: notwendige Treppe (baulich)','2. Rettungsweg: zweite Treppe oder Außentreppe; bei ≤ 60 Gastbetten (≤ 30 je Geschoss) auch Anleiterung','Stichflure max. 15 m'],
  bau:['Tragende Wände, Stützen, Decken F90 (F30 bei max. 2 oberirdischen Geschossen)','Trennwände F90 zu fremden Räumen (Türen T30-RS)','Trennwände F90 zu Gasträumen und Küchen, keine Türen','Trennwände F30 zwischen Beherbergungsräumen'],
  ant:['Alarmierungseinrichtung für Mitarbeiter und Gäste','BMA ab > 60 Gastbetten, zur Feuerwehr aufgeschaltet','Sicherheitsbeleuchtung in Fluren und Treppenräumen','Aufzüge ab > 60 Gastbetten: Brandfallsteuerung über die BMA'],
  bes:['Rettungswegplan und Hinweise in jedem Zimmer (mehrsprachig)','Türen in notwendigen Fluren: RS, nicht versperrt, innen leicht zu öffnen','Ab > 60 Gastbetten: Brandschutzordnung und Feuerwehrpläne','Barrierefreie Gasträume: 10 %'],
  mer:'Mehr als 12 Gastbetten sind Sonderbau, ab mehr als 60 kommen BMA und Brandschutzordnung dazu.',
  xr:[['1. Rettungsweg','notwendiger Treppenraum'],['2. Rettungsweg','zweite Treppe oder Außentreppe'],['Notwendiger Flur','Türen RS, Stichflur max. 15 m']]},
 {id:'in',n:'Industriebau',lab:'Industriebau',rg:'MIndBauRL',col:'#aab4c4',
  ab:'Produktion oder Lagerung (Regallager: Lagergut > 7,50 m)',
  q:['Produktion oder Lagerung, Sicherheitskategorien K 1 bis K 4.','Umfahrung für die Feuerwehr ab Grundfläche > 5.000 m².'],
  rw:['Ab Grundfläche > 1.600 m² (Ebenen > 200 m²): 2 entgegengesetzte bauliche Rettungswege','Rettungsweglänge ohne Alarmierung: 35 m (5 m Raumhöhe), 50 m (10 m)','Mit Alarmierungsanlage: 50 m bzw. 70 m','Bis Hauptgang max. 15 m, Hauptgang mind. 2,00 m breit'],
  bau:['Brandabschnitt und Brandbekämpfungsabschnitt: Größe nach Sicherheitskategorie K 1 bis K 4','Brandwand (REI 90-M (F 90-A)) trennt Brandabschnitte über alle Geschosse, 0,50 m über Dach','Türen und Tore in Brandwänden: T90-DS','Außenwand bei Grenzabstand < 5 m: nichtbrennbar'],
  ant:['Nur automatische BMA, flächendeckend, zur Feuerwehr aufgeschaltet','Rauch- und Wärmeabzug: Produktions- und Lagerräume sowie Ebenen > 200 m²','Selbsttätige Feuerlöschanlage in K 4','Wandhydranten Typ F in Räumen > 1.600 m²'],
  bes:['K 1 ohne Maßnahmen, K 2 BMA, K 3 BMA + Werkfeuerwehr, K 4 Feuerlöschanlage','Umfahrung für Feuerwehrfahrzeuge ab Grundfläche > 5.000 m²','Verfahren: Abschnitt 6 (bis max. 10.000 m²), Rechenverfahren DIN 18230-1 (bis max. 120.000 m²)','Brandschutzbeauftragter ab Summe A > 5.000 m²'],
  mer:'Die Sicherheitskategorie K 1 bis K 4 bestimmt, wie groß ein Brandabschnitt werden darf.',
  xr:[['Brandwand','REI 90-M (F 90-A), 0,50 m über Dach'],['Rauch- und Wärmeabzug','Produktions- und Lagerräume'],['Umfahrung','ab Grundfläche > 5.000 m²']]},
 {id:'ga',n:'Garage',lab:'Garage',rg:'M-GarVO',col:'#4fd6b4',
  ab:'Nutzfläche > 100 m² (Großgarage > 1.000 m²)',
  q:['Stellplätze mit mehr als 100 m² Nutzfläche.','Rettungsweglänge: offen 50 m, geschlossen 35 m.'],
  rw:['Mittel- und Großgaragen: 2 unabhängige bauliche Rettungswege je Geschoss','Rettungsweglänge: offene Garage 50 m, geschlossene 35 m','Ausnahme: oberirdisch, Ausgang ≤ 10 m: 1 Rettungsweg genügt','Ein Rettungsweg darf über eine Rampe führen'],
  bau:['Tragende Bauteile grundsätzlich feuerbeständig','Brandabschnitt oberirdisch geschlossen max. 5.000 m², sonst max. 2.500 m² (mit Sprinkler doppelt)','Treppenraum nur über Sicherheitsschleuse: Garagenseite T30-RS, Treppenraumseite RS','Gebäudeabschlusswände von Mittel- und Großgaragen: Brandwände'],
  ant:['Geschlossene Mittel- und Großgaragen: maschinelle Abluftanlage','Großgaragen: Entrauchung natürlich oder maschinell (mind. 10-facher Luftwechsel/h)','BMA: geschlossene Großgarage > 2.500 m²','Trockene Löschwasserleitung bei Stellplätzen > 4 m unter oder > 13 m über Gelände'],
  bes:['Offene Garage: unverschließbare Öffnungen mind. 1/3 der Umfassungswandflächen','Natürliche Rauchableitung: mind. 1.000 cm² je Stellplatz, oberes Wanddrittel, max. 20 m Abstand','In geschlossenen Mittel- und Großgaragen ist Rauchen verboten','Großgarage entspricht etwa 40 Stellplätzen'],
  mer:'Offen oder geschlossen entscheidet: offene Garagen 50 m Rettungsweglänge, geschlossene 35 m.',
  xr:[['Rauchableitung','Öffnungen oben, maschinell 10-facher Luftwechsel'],['Sicherheitsschleuse','Garage T30-RS, Treppenraum RS'],['Trockene Löschwasserleitung','am notwendigen Treppenraum']]},
 {id:'vs',n:'Versammlungsstätte',lab:'Versammlung',rg:'MVStättVO',col:'#c08bff',
  ab:'Versammlungsräume für mehr als 200 Besucher',
  q:['Versammlungsräume für mehr als 200 Besucher.','Schutzvorhang vor der Bühnenöffnung einer Großbühne.'],
  rw:['Mind. 2 unabhängige bauliche Rettungswege je Geschoss (ab > 100 Personen oder > 100 m²)','Vom Besucherplatz bis zum Ausgang max. 30 m (bis 5 m lichte Höhe)','Insgesamt max. 90 m, das Foyer kann Teil des Rettungsweges sein','Breite: 1,20 m je 200 Personen'],
  bau:['Tragwerk erdgeschossig F30 (mit Sprinkler keine Anforderung), mehrgeschossig F90','Notwendige Treppen F90, nichtbrennbar, max. 2,40 m breit','Trennwand Bühnenhaus / Zuschauerhaus: feuerbeständig, Bauart einer Brandwand (REI 90-M (F 90-A))','Türen in feuerbeständigen Wänden: T30-RS'],
  ant:['Rauchableitung: Räume > 50 m², Bühnen, notwendige Treppenräume','Wandhydranten Typ F ab 1.000 m² Grundfläche','Automatische Feuerlöschanlage bei Grundfläche > 3.600 m²','BMA und Lautsprecheranlage bei Grundfläche > 1.000 m²'],
  bes:['Schutzvorhang schließt die Bühnenöffnung von Großbühnen dicht, durch Eigengewicht','Großbühne: Sprühwasserlöschanlage, die auch den Schutzvorhang beaufschlagt','Stehplätze 2 Personen/m², Sitzplätze an Tischen 1 Person/m²','Nicht: Gottesdienste, Museen, Fliegende Bauten'],
  mer:'Max. 30 m vom Platz zum Ausgang, insgesamt höchstens 90 m Rettungsweg.',
  xr:[['Schutzvorhang','schließt die Bühnenöffnung'],['Trennwand Bühnenhaus','Bauart einer Brandwand (REI 90-M (F 90-A))'],['Ausgänge','2 unabhängige bauliche Rettungswege']]},
 {id:'sc',n:'Schule',lab:'Schule',rg:'MSchulbauR',col:'#ffd24a',
  ab:'Allgemein- und berufsbildende Schulen (kein Schwellenwert)',
  q:['Allgemein- und berufsbildende Schulen mit Lernbereichen.','Interne BMA ab Lernbereichen > 600 m².'],
  rw:['2 unabhängige bauliche Rettungswege','Unterrichtsräume: 35 m bis zu einem der baulichen Rettungswege','Lernbereiche: 1. Rettungsweg 35 m zu Ausgang oder Treppenraum; 2. Rettungsweg weiterer Ausgang oder 25 m Lauflinie','Stichflur max. 15 m, Flure mind. 1,50 m, Treppen mind. 1,20 m'],
  bau:['Brandabschnitt max. 1.600 m²','Tragwerk feuerhemmend oder hochfeuerhemmend: Brandwand hochfeuerhemmend-M','Tragwerk feuerbeständig: Brandwand REI 90-M (F 90-A)','Türen in notwendigen Fluren T30-RS bei 2,5 m öffnungsloser Flurwand'],
  ant:['Alarmierungsanlage mit Räumungssignal, anders als das Pausensignal','Interne BMA ab Lernbereichen > 600 m² (ohne Aufschaltung auf die Feuerwehr)','Sicherheitsbeleuchtung in Rettungswegen und fensterlosen Aufenthaltsräumen','Sicherheitsstromversorgung für Beleuchtung, Alarmierung und interne BMA'],
  bes:['Lernbereiche: mehrere Räume in einer multifunktionalen Zone, Sichtbeziehung zu den Lernpositionen','Hallen: Rauchableitung 1 % der Grundfläche oben oder 2 % in der oberen Außenwand','Aufenthaltsräume > 50 m²: öffenbare Fenster','Rettungsbalkone mind. 1,20 m breit'],
  mer:'Lernbereiche: Der 1. Rettungsweg (35 m) führt zwingend zum Treppenraum oder ins Freie.',
  xr:[['Brandwand','Brandabschnitt max. 1.600 m²'],['Halle: Rauchableitung','1 % der Grundfläche'],['Notwendiger Flur','mind. 1,50 m breit']]}];
const DB={};D.forEach(d=>{DB[d.id]=d;});
/* Übrige Sonderbautatbestände (§ 2 Abs. 4 MBO), ohne 3D */
const MORE=[
 ['Bauliche Anlagen > 30 m','Höhe h > 30 m',''],
 ['Große Geschossfläche','Geschoss mit größter Ausdehnung > 1.600 m² (Ausnahme: Wohngebäude und Garagen)',''],
 ['Büro und Verwaltung','Raum einzeln > 400 m²',''],
 ['Räume für viele Personen','Raum einzeln für > 100 Personen; ab > 200 Personen gilt MVStättVO, dazwischen Handlungsspielraum','MVStättVO'],
 ['Gaststätten','> 40 Gastplätze im Gebäude oder > 1.000 Gastplätze im Freien',''],
 ['Spielhallen','Grundfläche > 150 m²',''],
 ['Pflege und Betreuung','Eingeschränkte Selbstrettungsfähigkeit: Nutzungseinheit für > 6 Personen, Intensivpflegebedarf oder insgesamt > 12 Personen mit gemeinsamem Rettungsweg','MWR'],
 ['Krankenhäuser','Nutzung','MKhVO'],
 ['Wohnheime und Unterbringung','Sonstige Einrichtungen zur Unterbringung von Personen sowie Wohnheime',''],
 ['Tageseinrichtungen','> 10 Kinder, Menschen mit Behinderung, alte Menschen',''],
 ['Justizvollzug','Justizvollzugsanstalten und bauliche Anlagen des Maßregelvollzugs',''],
 ['Camping und Wochenendplätze','Nutzung',''],
 ['Freizeit- und Vergnügungsparks','Nutzung',''],
 ['Fliegende Bauten','Soweit Ausführungsgenehmigung nötig','M-FlBauR'],
 ['Regallager','Oberkante Lagergut > 7,50 m','vgl. VDI 3564'],
 ['Explosions- oder Brandgefahr','Umgang oder Lagerung von Stoffen mit Explosions- oder erhöhter Brandgefahr',''],
 ['Vergleichbare Gefahren','Anlagen und Räume mit vergleichbaren Gefahren wie die übrigen Tatbestände','']];

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
      h('div',{className:'chips'},D.map(d=>h('button',{key:d.id,className:'chip',onClick:()=>setSel(d.id)},h('i',{style:{background:d.col}}),d.n))),
      h('button',{className:'more'+(more?' open':''),'aria-expanded':more,onClick:()=>setMore(!more)},h('span',null,'Weitere Sonderbautatbestände ('+MORE.length+')'),ICON.chev),
      more&&h('div',{style:{marginTop:10}},
        mo!=null&&h('div',{className:'note',style:{margin:'0 0 10px'}},h('b',null,MORE[mo][0]),MORE[mo][1]+(MORE[mo][2]?' · '+MORE[mo][2]:'')),
        h('div',{className:'chips'},MORE.map((m,i)=>h('button',{key:i,className:'chip sm'+(mo===i?' on':''),onClick:()=>setMo(mo===i?null:i)},m[0])))));
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
  const [kp,setKp]=useState('rw');
  const [xray,setXray]=useState(false);
  const [more,setMore]=useState(false);
  const [mo,setMo]=useState(null);
  const [quiz,setQuiz]=useState(makeQuiz);
  const api=useRef(null),pickRef=useRef(null),tabRef=useRef(tab),pbRef=useRef(null);
  tabRef.current=tab;
  const setSel=useCallback(id=>{setSel0(id);setKp('rw');},[]);
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
