/* ===== Eskalationsleiter Zivile Verteidigung: Leiter + Aufgaben ===== */
/* Fachdaten nur aus der Lernseite „Grundlagen Zivile Verteidigung“ (Abschnitte 03, 04, 07, 08, 12, 13, 18, 19, 20). */
(function(){
'use strict';
const LS='bvi_sim_eskalation';
const NOTE_NA='nicht gesondert genannt';
const AN='Fall des Äußeren Notstands: Art. 80a Abs. 1 & 3, Art. 115a Abs. 1 GG';
/* Stufen (Reihenfolge der Leiter; Begriffe nach Abschnitt 03 Notstandsrecht) */
const STUFEN=[
 {n:'Krise (niederschwellig)',kurz:'Krise',rows:[
  ['Rechtsgrundlage','Abschnitt 10.1 (2) RRGV: außenpolitisch militärische Krise (niederschwellig)'],
  ['Wirkung','Wird bei den Fällen des Äußeren Notstands als niederschwellige Stufe geführt.'],
  ['Feuerwehr','Friedenszeiten: Zivile Feuerwehrkräfte können nicht gezwungen werden, in einem MSB zu arbeiten.']]},
 {n:'Zustimmungsfall',kurz:'Zustimmung',rows:[
  ['Rechtsgrundlage',AN],
  ['Wirkung','Eine eigene Wirkung beschreibt die Lernseite nicht.',1],
  ['Feuerwehr','Zwang zur Arbeit im MSB: '+NOTE_NA+'. Ausgewiesen ist er für den Spannungs- und Verteidigungsfall.',1]]},
 {n:'Spannungsfall',kurz:'Spannung',msb:1,rows:[
  ['Rechtsgrundlage',AN],
  ['Wirkung','Notstandsgesetze werden angewendet, um das öffentliche Leben in den wichtigen Bereichen aufrechtzuerhalten. Host Nation Support (HNS) für ausländische Streitkräfte auch im Spannungsfall.'],
  ['Bundeswehr','Einsatz im Inneren (Fall 1): im Verteidigungs- oder Spannungsfall, zusätzlich für den Schutz ziviler Objekte.'],
  ['Feuerwehr','Zwang zur Arbeit im MSB ist möglich. Im MSB liegt die Befehlsgebung immer beim Militär.']]},
 {n:'Verteidigungsfall',kurz:'Verteidigung',msb:1,rows:[
  ['Rechtsgrundlage',AN],
  ['Wirkung','Notstandsgesetze werden angewendet. HNS auch im Verteidigungsfall. Deutschland ist rückwärtiger Raum und „Drehscheibe“: Zivile Kräfte sind bei der NATO-Unterstützung stark gefordert.'],
  ['Bundeswehr','Einsatz im Inneren (Fall 1): im Verteidigungs- oder Spannungsfall, zusätzlich für den Schutz ziviler Objekte.'],
  ['Feuerwehr','Zwang zur Arbeit im MSB ist möglich. Im MSB liegt die Befehlsgebung immer beim Militär.']]},
 {n:'Bündnisfall',kurz:'Bündnis',rows:[
  ['Rechtsgrundlage',AN],
  ['Wirkung','Deutschland ist kein Frontstaat, sondern rückwärtiger Raum, Pufferzone, „Drehscheibe“. Zivile Kräfte sind bei der Unterstützung der NATO stark gefordert.'],
  ['Feuerwehr','Zwang zur Arbeit im MSB: '+NOTE_NA+'. Ausgewiesen ist er für den Spannungs- und Verteidigungsfall.',1]]}
];
/* Phasen des Gesamtszenarios (Abschnitte 07 und 08) */
const PHASEN=[
 {r:'I',n:'Hybride Bedrohungen',kurz:'Hybride Bedrohungen',dur:'Mehrere Jahre in schwankender Intensität',b:[
  'Hybride Aktionen eines Aggressors: Desinformation, Spionage, Cyberattacken, Sabotage, Anschläge auf KRITIS, Aktivitäten im Weltraum',
  'Ziel der Desinformation: Bevölkerung verunsichern, Meinung beeinflussen, Gesellschaft destabilisieren',
  'Überwiegend im Verborgenen; einzelne Aktionen nicht eindeutig einem staatlichen Akteur zuzuordnen']},
 {r:'II',n:'Krise, militärischer Aufmarsch an den NATO-Außengrenzen',kurz:'Krise, Aufmarsch',dur:'Mehrere Monate',b:[
  'Aufmarsch des Aggressors an den östlichen Grenzen des NATO-Gebiets; NATO-Kräfte marschieren zur Abschreckung auf',
  'In den Grenzgebieten erste Fluchtbewegungen',
  'Mehr Spionage, Cyberangriffe, Sabotage und Anschläge, um Truppenbewegungen (v. a. in Deutschland) zu be- oder verhindern',
  'Verschleierung der Urheberschaft tritt zurück, Aktionen werden aggressiver und offener']},
 {r:'III',n:'Bündnisverteidigung und Übergang zur Landesverteidigung (LV)',kurz:'Bündnisver&shy;teidigung',dur:'Mindestens ein Jahr',b:[
  'Aggressor greift mit militärischen Mitteln die Grenzen des NATO-Gebiets an; die Schwelle zum klassischen Krieg ist überschritten',
  'Punktuelle Angriffe mit konventionellen und nicht konventionellen Mitteln, auch auf Ziele in Deutschland',
  'Im Weltraum regelmäßige Störungen und vereinzelte Ausfälle von Satelliten',
  'Mittel der hybriden Kriegsführung werden weiter eingesetzt']},
 {r:'IV',n:'Landesverteidigung',kurz:'Landes&shy;verteidigung',dur:'Mindestens mehrere Monate; Ende ggf. mit ausgehandeltem Waffenstillstand',b:[
  'Gegnerische Truppen durchbrechen die Verteidigungslinien der NATO bis auf das Gebiet der Bundesrepublik',
  'Kampfhandlungen an Land, zur See und in der Luft auf deutschem Territorium',
  'Erstmalig im Weltraum ein Konflikt globalen Ausmaßes']}
];
/* ===== Aufgabenpool ===== */
/* t: c = Auswählen (eine Antwort), m = Auswählen (mehrere), o = Reihenfolge, z = Zuordnen */
const POOL=[
 {id:'ord-stufen',t:'o',q:'Bringe die Stufen der Eskalationsleiter in die Reihenfolge, von der niederschwelligen Krise bis zum Bündnisfall.',
  items:['Außenpolitisch militärische Krise (niederschwellig)','Zustimmungsfall','Spannungsfall','Verteidigungsfall','Bündnisfall'],
  why:'So steht die Leiter in dieser App: niederschwellige Krise (Abschnitt 10.1 (2) RRGV), dann Zustimmungs-, Spannungs-, Verteidigungs- und Bündnisfall.'},
 {id:'ord-phasen',t:'o',q:'Bringe die vier Phasen des Gesamtszenarios in die richtige Reihenfolge.',
  items:['Phase I: Hybride Bedrohungen','Phase II: Krise, militärischer Aufmarsch an den NATO-Außengrenzen','Phase III: Bündnisverteidigung und Übergang zur Landesverteidigung','Phase IV: Landesverteidigung'],
  why:'Das Gesamtszenario ist in vier Phasen unterteilt, die jeweils Eskalationsstufen darstellen: I Hybride Bedrohungen, II Krise und Aufmarsch, III Bündnisverteidigung, IV Landesverteidigung.'},
 {id:'z-phase-merk',t:'z',q:'Ordne jedes Merkmal der passenden Phase des Gesamtszenarios zu.',
  opts:['I','II','III','IV'],
  items:[['Desinformation, Spionage und Sabotage überwiegend im Verborgenen',0],['Aufmarsch an den östlichen Grenzen des NATO-Gebiets, erste Fluchtbewegungen',1],['Schwelle zum klassischen Krieg überschritten, punktuelle Angriffe auch auf Ziele in Deutschland',2],['Gegnerische Truppen durchbrechen die Verteidigungslinien, Kampfhandlungen auf deutschem Territorium',3]],
  why:'Phase I ist hybrid und verborgen, Phase II der Aufmarsch, Phase III der Angriff auf NATO-Grenzen mit Überschreiten der Kriegsschwelle, Phase IV die Landesverteidigung auf deutschem Gebiet.'},
 {id:'z-phase-dauer',t:'z',q:'Ordne die Dauer der passenden Phase zu.',
  opts:['I','II','III','IV'],
  items:[['Mehrere Jahre in schwankender Intensität',0],['Mehrere Monate',1],['Mindestens ein Jahr',2],['Mindestens mehrere Monate, Ende ggf. mit ausgehandeltem Waffenstillstand',3]],
  why:'Laut Lernseite dauert Phase I mehrere Jahre, Phase II mehrere Monate, Phase III mindestens ein Jahr und Phase IV mindestens mehrere Monate.'},
 {id:'z-notstand',t:'z',q:'Ordne die Normen dem richtigen Notstand zu.',
  opts:['Innerer Notstand','Äußerer Notstand'],
  items:[['Art. 80a Abs. 1 & 3 GG',1],['Art. 35 Abs. 2f. GG',0],['Art. 115a Abs. 1 GG',1],['Art. 87a Abs. 4 GG',0]],
  why:'Äußerer Notstand: Art. 80a Abs. 1 & 3, Art. 115a Abs. 1 GG (auswärtige militärische Aggression). Innerer Notstand: Art. 35 Abs. 2f., Art. 91, Art. 87a Abs. 4 GG (Gefahren aus der eigenen staatlich-gesellschaftlichen Sphäre).'},
 {id:'c-rrgv',t:'c',q:'Welche Stufe wird mit Abschnitt 10.1 (2) RRGV als „außenpolitisch militärische Krise“ geführt?',
  o:['Niederschwellige Krise','Zustimmungsfall','Spannungsfall','Bündnisfall'],a:0,
  why:'Die außenpolitisch militärische Krise (niederschwellig) mit Verweis auf Abschnitt 10.1 (2) RRGV ist die unterste Stufe der Leiter.'},
 {id:'c-notstandsgesetze',t:'c',q:'In welchen Fällen sollen die Notstandsgesetze angewendet werden?',
  o:['Im Spannungs- oder Verteidigungsfall','In jeder außenpolitisch militärischen Krise','Nur im Zustimmungsfall','Ausschließlich bei Naturkatastrophen'],a:0,
  why:'Laut Lernseite erfolgt die Anwendung im Spannungs- oder Verteidigungsfall.'},
 {id:'c-zweck',t:'c',q:'Wozu dienen die Notstandsgesetze?',
  o:['Das öffentliche Leben auch unter schwierigen Bedingungen in den wichtigen Bereichen aufrechterhalten','Die Bundeswehr von der Bindung an das Grundgesetz lösen','Die Feuerwehren in den Dienst der Länder stellen','Ausländische Streitkräfte aus Deutschland fernhalten'],a:0,
  why:'Die Notstandsgesetze sollen das öffentliche Leben auch unter schwierigen Bedingungen in den wichtigen Bereichen aufrechterhalten.'},
 {id:'m-msb-zwang',t:'m',q:'Wann können zivile Feuerwehrkräfte gezwungen werden, in einem Militärischen Sicherheitsbereich (MSB) zu arbeiten? Wähle alle zutreffenden Antworten.',
  o:[['Im Spannungsfall',1],['Im Verteidigungsfall',1],['In Friedenszeiten',0],['In Friedenszeiten, wenn die Bundeswehr darum bittet',0]],
  why:'Zivile Feuerwehrkräfte können in Friedenszeiten nicht gezwungen werden. Im Spannungs- und Verteidigungsfall ist dies möglich.'},
 {id:'c-msb-befehl',t:'c',q:'Wer hat im MSB die Befehlsgebung?',
  o:['Immer das Militär','Die zivile Einsatzleitung der Feuerwehr','Die Innenbehörde des Landes','Das BMI'],a:0,
  why:'Im MSB liegt die Befehlsgebung immer beim Militär.'},
 {id:'c-msb-def',t:'c',q:'Was ist ein Militärischer Sicherheitsbereich (MSB)?',
  o:['Anlagen, Liegenschaften und Schiffe der Bundeswehr, die temporär aus Gründen der militärischen Sicherheit eingerichtet werden können','Ein Gebiet, das nur im Verteidigungsfall betreten werden darf','Jede kritische Infrastruktur (KRITIS)','Ein Lager für Host Nation Support ausländischer Streitkräfte'],a:0,
  why:'MSB = Anlagen, Liegenschaften und Schiffe der Bundeswehr; sie können temporär aus Gründen der militärischen Sicherheit eingerichtet werden.'},
 {id:'c-lagebeurteilung',t:'c',q:'Was ist bei der Lagebeurteilung der Feuerwehr in der Zivilen Verteidigung zwingend zu berücksichtigen?',
  o:['Dass die militärische Operation weiter aufrechterhalten werden kann, und feindliche Kräfte','Dass die Feuerwehr immer Vorrang vor militärischen Belangen hat','Nur die Schäden an ziviler Infrastruktur','Ausschließlich die Wetterlage'],a:0,
  why:'Zwingend zu berücksichtigen ist, dass die militärische Operation weiter aufrechterhalten werden kann. Zusätzlich müssen feindliche Kräfte berücksichtigt werden.'},
 {id:'m-verhalten',t:'m',q:'Was gehört zum bedrohungsangepassten Verhalten der Feuerwehr? Wähle alle zutreffenden Antworten.',
  o:[['Drohnenschutz (Beobachter und Scanner)',1],['Sabotageschutz',1],['Dislozierte gedeckte Aufstellung',1],['Freie Fluchtwege (Fahrzeuge in Fluchtrichtung)',1],['Fahrzeuge dicht gedrängt an einer Stelle aufstellen',0]],
  why:'Genannt sind Drohnenschutz, Sabotageschutz, dislozierte gedeckte Aufstellung, freie Fluchtwege und der Einsatz ferngeführter und robotischer Systeme. Dicht gedrängt ist das Gegenteil einer dislozierten Aufstellung.'},
 {id:'z-bw-fall',t:'z',q:'Ordne die Aussagen zum Einsatz der Bundeswehr im Inneren dem Fall des Grundgesetzes zu.',
  opts:['Fall 1','Fall 2'],
  items:[['Einsatz im Verteidigungs- oder Spannungsfall',0],['Zusätzlich für den Schutz ziviler Objekte',0],['Verwendung unterhalb der Einsatzschwelle als Amtshilfe',1],['Oberhalb der Einsatzschwelle: Unterstützung der Polizeikräfte bei Naturkatastrophe oder besonders schwerem Unglücksfall (Terror)',1]],
  why:'Fall 1 ist der Einsatz im Verteidigungs- oder Spannungsfall (zusätzlich Schutz ziviler Objekte). Fall 2 umfasst Amtshilfe unterhalb der Einsatzschwelle und die Unterstützung der Polizei oberhalb davon.'},
 {id:'m-heimatschutz',t:'m',q:'Heimatschutzregimenter können ohne Verteidigungs- oder Spannungsfall eingesetzt werden. Wonach? Wähle alle zutreffenden Antworten.',
  o:[['Amtshilfe',1],['Innerer Notstand',1],['Terror: Unterstützung der Polizei',1],['Spannungsfall',0],['Verteidigungsfall',0]],
  why:'Der Einsatz ohne Verteidigungs- oder Spannungsfall erfolgt nach Amtshilfe, Innerem Notstand oder Terror (Unterstützung der Polizei).'},
 {id:'z-zap',t:'z',q:'Ordne die Aufgabe in der Zivilen Alarmplanung (ZAP) der zuständigen Stelle zu.',
  opts:['Bund','BMI','Ministerien'],
  items:[['Erlässt die erforderlichen Gesetze',0],['Koordiniert die ZAP',1],['Lösen Alarmmaßnahmen aus, jeweils im eigenen Zuständigkeitsbereich',2]],
  why:'Der Bund erlässt die erforderlichen Gesetze, das BMI koordiniert die ZAP. Nach dem Ressortprinzip lösen die Ministerien Alarmmaßnahmen im eigenen Zuständigkeitsbereich aus.'},
 {id:'c-ressort',t:'c',q:'Was bedeutet das Ressortprinzip in der Zivilen Alarmplanung?',
  o:['Jedes Ministerium operiert im eigenen Zuständigkeitsbereich und kommuniziert mit nachgeordneten Stellen','Das BMI trifft alle Entscheidungen allein','Die Länder erlassen die erforderlichen Gesetze','Die NATO löst die Alarmmaßnahmen aus'],a:0,
  why:'Ressortprinzip: Jedes Ministerium operiert im eigenen Zuständigkeitsbereich und kommuniziert mit nachgeordneten Stellen.'},
 {id:'z-ebenen',t:'z',q:'Ordne die Aufgabe der richtigen Ebene zu.',
  opts:['NATO','Bund','Bundesländer','Landesbehörden & Kommunen'],
  items:[['Gibt strategische Zielvorgaben',0],['Beschließt über die nationale Umsetzung und gibt ggf. Rechtsgrundlagen frei',1],['Weisen Behörden und Kommunen an',2],['Stellen die Umsetzung und Leistung sicher',3]],
  why:'Zusammenspiel der Ebenen: NATO gibt Ziele vor, der Bund beschließt die nationale Umsetzung, die Länder weisen an, Landesbehörden und Kommunen stellen die Leistung sicher.'},
 {id:'c-hns',t:'c',q:'Für wen erbringt Deutschland Host Nation Support (HNS)?',
  o:['Für ausländische Streitkräfte und Organisationen auf deutschem Hoheitsgebiet oder im Transit','Nur für die Bundeswehr im Inland','Nur für zivile Hilfsorganisationen','Für deutsche Streitkräfte im Ausland'],a:0,
  why:'HNS ist die zivile und militärische Unterstützung für ausländische Streitkräfte und Organisationen auf deutschem Hoheitsgebiet oder im Transit, im Frieden sowie im Spannungs- und Verteidigungsfall.'},
 {id:'c-hns-wann',t:'c',q:'In welchen Lagen erbringt Deutschland Host Nation Support laut Definition?',
  o:['Im Frieden sowie im Spannungs- und Verteidigungsfall','Nur im Verteidigungsfall','Nur im Frieden','Ausschließlich im Bündnisfall'],a:0,
  why:'Die Definition nennt Frieden sowie Spannungs- und Verteidigungsfall.'},
 {id:'c-geo',t:'c',q:'Wie beschreibt die Lernseite die besondere geostrategische Lage Deutschlands (relevant für Bündnis- und Verteidigungsfall)?',
  o:['Kein Frontstaat, sondern rückwärtiger Raum, Pufferzone, „Drehscheibe“','Als Frontstaat an der Ostflanke der NATO','Als neutraler Staat ohne Aufgaben für die NATO','Als reiner Absender von Truppen ins Ausland'],a:0,
  why:'Deutschland ist kein Frontstaat, sondern rückwärtiger Raum, Pufferzone und „Drehscheibe“. Dadurch sind zivile Kräfte bei der Unterstützung der NATO stark gefordert.'},
 {id:'c-p3',t:'c',q:'In welcher Phase des Gesamtszenarios ist die Schwelle zum klassischen Krieg überschritten?',
  o:['Phase I','Phase II','Phase III','Phase IV'],a:2,
  why:'In Phase III greift der Aggressor mit militärischen Mitteln die Grenzen des NATO-Gebiets an; die Schwelle zum klassischen Krieg ist überschritten.'},
 {id:'c-p2',t:'c',q:'In welcher Phase tritt die Verschleierung der Urheberschaft zunehmend in den Hintergrund, und die Aktionen werden aggressiver und offener?',
  o:['Phase I','Phase II','Phase III','Phase IV'],a:1,
  why:'Das beschreibt Phase II (Krise, militärischer Aufmarsch an den NATO-Außengrenzen).'},
 {id:'c-p4',t:'c',q:'In welcher Phase findet erstmalig im Weltraum ein Konflikt globalen Ausmaßes statt?',
  o:['Phase I','Phase II','Phase III','Phase IV'],a:3,
  why:'In Phase IV (Landesverteidigung) gibt es erstmalig im Weltraum einen Konflikt globalen Ausmaßes. In Phase III sind es noch regelmäßige Störungen und vereinzelte Satellitenausfälle.'},
 {id:'m-p1',t:'m',q:'Welche Beispiele gehören zu Phase I (Hybride Bedrohungen)? Wähle alle zutreffenden Antworten.',
  o:[['Desinformationskampagnen',1],['Spionageaktivitäten',1],['Cyberattacken und Sabotageakte',1],['Kampfhandlungen auf deutschem Territorium',0],['Aufmarsch von Truppen an den NATO-Außengrenzen',0]],
  why:'Phase I ist geprägt von hybriden Aktionen wie Desinformation, Spionage, Cyberattacken und Sabotage. Kampfhandlungen gehören zu Phase IV, der Aufmarsch zu Phase II.'},
 {id:'c-teilszenario',t:'c',q:'Worauf liegt der Fokus eines Teilszenarios in der Risikoanalyse für den Zivilschutz?',
  o:['Auf Phase III und/oder IV (V-Fall); Phase I und II werden als Grundlast berücksichtigt','Nur auf Phase I','Auf Phase II und III; Phase IV bleibt unberücksichtigt','Auf alle vier Phasen gleich stark'],a:0,
  why:'Ein Teilszenario beschreibt ein Ereignis mit Fokus auf Phase III und/oder IV (V-Fall); Phase I und II werden im Szenario berücksichtigt (Grundlast).'}
];
/* ===== Hilfsfunktionen ===== */
const $=id=>document.getElementById(id);
function h(tag,attrs){const e=document.createElement(tag);if(attrs)for(const k in attrs){const v=attrs[k];if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v);}
 for(let i=2;i<arguments.length;i++){const c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c))c.forEach(x=>x&&e.appendChild(typeof x==='string'?document.createTextNode(x):x));else e.appendChild(typeof c==='string'?document.createTextNode(c):c);}return e;}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function load(){try{const v=JSON.parse(localStorage.getItem(LS)||'{}');return v&&typeof v==='object'?v:{};}catch(e){return {};}}
function save(o){try{localStorage.setItem(LS,JSON.stringify(o));}catch(e){}}
/* ===== Zustand ===== */
const S={tab:'leiter',view:'stufen',stufe:0,phase:0,quiz:null,seen:[],store:load()};
let scrollKeep=0;
/* Aufgaben-Instanz */
function mk(def){const n=def.t==='o'?def.items.length:def.t==='z'?def.items.length:def.o.length;
 let ord=[...Array(n).keys()];ord=(def.t==='c'&&/^Phase /.test(def.o[0]))?ord:shuffle(ord);
 if(def.t==='o'){let tries=0;while(ord.every((v,i)=>v===i)&&tries++<9)ord=shuffle(ord);}
 const val=def.t==='m'?[]:def.t==='o'?[]:def.t==='z'?def.items.map(()=>-1):-1;
 return {def,ord,val,done:false,ok:false,part:''};}
function newRound(n,pool){
  let ids=(pool||POOL).map(d=>d);
  let fresh=shuffle(ids.filter(d=>S.seen.indexOf(d.id)<0)),old=shuffle(ids.filter(d=>S.seen.indexOf(d.id)>=0));
  let pick=fresh.concat(old).slice(0,n);
  /* Reihenfolge so mischen, dass nicht dreimal derselbe Typ nacheinander kommt */
  pick=shuffle(pick);
  for(let i=2;i<pick.length;i++){if(pick[i].t===pick[i-1].t&&pick[i].t===pick[i-2].t){for(let j=i+1;j<pick.length;j++){if(pick[j].t!==pick[i].t){[pick[i],pick[j]]=[pick[j],pick[i]];break;}}}}
  S.quiz={qs:pick.map(mk),i:0,fin:false,all:n>=POOL.length};
  pick.forEach(d=>{if(S.seen.indexOf(d.id)<0)S.seen.push(d.id);});
  if(S.seen.length>=POOL.length)S.seen=pick.map(d=>d.id);
}
function check(qi){
  const d=qi.def;let ok=false,part='';
  if(d.t==='c'){ok=qi.val===d.a;}
  else if(d.t==='m'){const need=d.o.map((x,i)=>x[1]?i:-1).filter(i=>i>=0);const v=qi.val;ok=v.length===need.length&&need.every(i=>v.indexOf(i)>=0);
   const right=d.o.filter((x,i)=>!!x[1]===(v.indexOf(i)>=0)).length;part=right+' von '+d.o.length+' Antworten richtig bewertet';}
  else if(d.t==='o'){ok=qi.val.length===d.items.length&&qi.val.every((v,i)=>v===i);const right=qi.val.filter((v,i)=>v===i).length;part=right+' von '+d.items.length+' an der richtigen Stelle';}
  else {const right=d.items.filter((x,i)=>qi.val[i]===x[1]).length;ok=right===d.items.length;part=right+' von '+d.items.length+' richtig zugeordnet';}
  qi.done=true;qi.ok=ok;qi.part=part;
}
function ready(qi){const d=qi.def;if(d.t==='c')return qi.val>=0;if(d.t==='m')return qi.val.length>0;if(d.t==='o')return qi.val.length===d.items.length;return qi.val.every(v=>v>=0);}
/* ===== Ansicht: Leiter ===== */
function viewLeiter(){
  const seg=h('div',{class:'seg',role:'tablist'},
    [['stufen','Stufen'],['phasen','Phasen'],['quer','Ebenen & MSB']].map(x=>h('button',{role:'tab','aria-selected':S.view===x[0],class:S.view===x[0]?'on':'',onclick:()=>{S.view=x[0];render();}},x[1])));
  let body;
  if(S.view==='stufen')body=stufenView();else if(S.view==='phasen')body=phasenView();else body=querView();
  return h('div',null,seg,body);
}
function stufenView(){
  const out=h('div',{class:'grid'});
  const lab=h('span',null,''),stairsEl=h('div',{class:'stairs',role:'list'}),detail=h('div',{class:'card'});
  const slider=h('input',{type:'range',min:0,max:STUFEN.length-1,step:1,value:S.stufe,'aria-label':'Eskalationsstufe wählen',oninput:e=>{S.stufe=+e.target.value;fill();}});
  function fill(){
    const st=STUFEN[S.stufe];
    lab.textContent='Stufe '+(S.stufe+1)+' von '+STUFEN.length;
    slider.value=S.stufe;
    [].forEach.call(stairsEl.children,(b,i)=>{b.className='st'+(i===S.stufe?' on':i<S.stufe?' past':'');b.setAttribute('aria-pressed',i===S.stufe);});
    detail.textContent='';
    detail.appendChild(h('h2',null,(S.stufe+1)+'. '+st.n));
    detail.appendChild(h('div',{class:'rows'},st.rows.map(r=>h('div',{class:'row'},h('b',null,r[0]),h('span',{class:r[2]?'na':''},r[1])))));
    detail.appendChild(h('p',{class:'mut',style:'margin:10px 0 0'},'Die Lernseite ordnet nicht jeder Stufe eine eigene Regel zu. Wo nichts steht, steht hier „'+NOTE_NA+'“.'));
  }
  STUFEN.forEach((s,i)=>stairsEl.appendChild(h('button',{role:'listitem',class:'st','aria-pressed':false,style:'margin-left:'+(i*6)+'px;width:calc(100% - '+(i*6)+'px)',onclick:()=>{S.stufe=i;fill();}},
    h('i',null,String(i+1)),h('span',null,s.n),s.msb?h('em',null,'MSB-Zwang'):null)));
  fill();
  out.appendChild(h('div',{class:'card'},h('p',{class:'lead'},'Tippe auf eine Stufe oder schiebe den Regler. Darunter siehst du Rechtsgrundlage, Wirkung und die Rolle der Feuerwehr.'),h('div',{class:'reg'},slider,lab),stairsEl));
  out.appendChild(detail);
  return out;
}
function phasenView(){
  const p=PHASEN[S.phase];
  const btns=h('div',{class:'ph'},PHASEN.map((x,i)=>h('button',{class:i===S.phase?'on':'','aria-pressed':i===S.phase,onclick:()=>{S.phase=i;render(true);}},h('b',null,x.r),h('span',{html:x.kurz}))));
  const card=h('div',{class:'card'},h('h2',null,'Phase '+p.r+': '+p.n),h('ul',{class:'b'},p.b.map(t=>h('li',null,t))),h('span',{class:'dur'},'Dauer: '+p.dur));
  const note=h('p',{class:'mut'},'Das Gesamtszenario beschreibt nur einen von vielen denkbaren Konfliktverläufen. Die vier Phasen stellen jeweils Eskalationsstufen dar. Eine Zuordnung zu den Stufen der Leiter nennt die Lernseite nicht.');
  return h('div',{class:'grid'},h('div',null,btns,note),card);
}
function querView(){
  const eb=[['NATO','Gibt strategische Zielvorgaben'],['Bund','Beschließt über die nationale Umsetzung; gibt ggf. Rechtsgrundlagen frei'],['Bundesländer','Weisen Behörden & Kommunen an'],['Landesbehörden & Kommunen','Stellen die Umsetzung und Leistung sicher']];
  const c1=h('div',{class:'card'},h('h3',null,'Zusammenspiel der Ebenen'),h('table',{class:'tbl'},h('tbody',null,eb.map(r=>h('tr',null,h('td',null,r[0]),h('td',null,r[1]))))));
  const c2=h('div',{class:'card'},h('h3',null,'Zivile Alarmplanung (ZAP)'),h('ul',{class:'b'},
    h('li',null,'Der Bund erlässt die erforderlichen Gesetze, das BMI koordiniert die ZAP'),
    h('li',null,'Ressortprinzip: Jedes Ministerium operiert im eigenen Zuständigkeitsbereich; Ministerien lösen Alarmmaßnahmen aus'),
    h('li',null,'Hauptteil: Kennzifferplan, Auftragsblätter, Einzelauftragsblätter')));
  const c3=h('div',{class:'card'},h('h3',null,'Feuerwehr im Militärischen Sicherheitsbereich (MSB)'),h('ul',{class:'b'},
    h('li',null,'MSB: Anlagen, Liegenschaften und Schiffe der Bundeswehr, temporär einrichtbar'),
    h('li',null,'Kein Zwang in Friedenszeiten, im Spannungs- und Verteidigungsfall möglich; Befehlsgebung immer beim Militär'),
    h('li',null,'Ggf. erweiterte PSA: Schutzzeichen, ballistischer Schutz'),
    h('li',null,'Bedrohungsangepasst: Drohnen- und Sabotageschutz, dislozierte gedeckte Aufstellung, freie Fluchtwege, ferngeführte und robotische Systeme')));
  return h('div',{class:'grid'},h('div',null,c1,c2),c3);
}
/* ===== Ansicht: Aufgaben ===== */
function viewAufgaben(){
  const q=S.quiz;
  if(!q)return startView();
  if(q.fin)return resultView();
  return questionView();
}
function startView(){
  const b=S.store.best;
  return h('div',{class:'card'},h('h2',null,'Aufgaben zur Eskalationsleiter'),
    h('p',{class:'lead'},'Zuordnen, Auswählen und Reihenfolge, alles aus den Lernseiten zur Zivilen Verteidigung. Jede Antwort wird erklärt. Reihenfolge und Aufgaben sind bei jedem Durchlauf neu gemischt ('+POOL.length+' Aufgaben im Pool).'),
    b?h('p',{class:'mut'},'Bestwert (Runde mit 12 Aufgaben): '+b.score+' von '+b.total):null,
    h('div',{class:'btns'},h('button',{class:'btn',onclick:()=>{newRound(12);render();}},'Runde mit 12 Aufgaben'),h('button',{class:'btn ghost',onclick:()=>{newRound(POOL.length);render();}},'Alle '+POOL.length+' Aufgaben')));
}
function typeName(t){return t==='c'?'Auswählen':t==='m'?'Auswählen (mehrere)':t==='o'?'Reihenfolge':'Zuordnen';}
function questionView(){
  const q=S.quiz,qi=q.qs[q.i],d=qi.def;
  const prog=h('div',{class:'prog'},q.qs.map((x,i)=>h('span',{class:x.done?(x.ok?'ok':'bad'):i===q.i?'cur':''})));
  const box=h('div',{class:'card'},
    h('div',{class:'qmeta'},h('span',{class:'qt'},typeName(d.t)),h('span',null,'Aufgabe '+(q.i+1)+' von '+q.qs.length)),
    h('div',{class:'q'},d.q));
  if(d.t==='c'||d.t==='m')box.appendChild(optsView(qi));
  else if(d.t==='o')box.appendChild(orderView(qi));
  else box.appendChild(matchView(qi));
  if(qi.done){
    const fb=h('div',{class:'fb '+(qi.ok?'ok':'bad'),role:'status'},h('b',null,qi.ok?'Richtig':(d.t==='c'?'Nicht ganz':'Nicht ganz: '+qi.part)),d.why);
    box.appendChild(fb);
  }
  const last=q.i===q.qs.length-1;
  const act=h('div',{class:'btns'},
    qi.done?h('button',{class:'btn',onclick:()=>{if(last)q.fin=true,finish();else q.i++;render();}},last?'Auswertung ansehen':'Nächste Aufgabe')
           :h('button',{class:'btn',disabled:!ready(qi),onclick:()=>{check(qi);render(true);const f=document.querySelector('.fb');if(f&&f.scrollIntoView)f.scrollIntoView({block:'nearest'});}},'Antwort prüfen'));
  return h('div',null,prog,box,act);
}
function optsView(qi){
  const d=qi.def,multi=d.t==='m';
  const wrap=h('div',{class:'opts',role:multi?'group':'radiogroup'});
  qi.ord.forEach((oi,k)=>{
    const txt=multi?d.o[oi][0]:d.o[oi];
    const sel=multi?qi.val.indexOf(oi)>=0:qi.val===oi;
    const corr=multi?!!d.o[oi][1]:oi===d.a;
    let cls='opt'+(multi?' sq':'')+(sel&&!qi.done?' on chk':''),mark=sel?'✓':'';
    if(qi.done){
      if(sel&&corr){cls='opt'+(multi?' sq':'')+' ok';mark='✓';}
      else if(sel&&!corr){cls='opt'+(multi?' sq':'')+' bad';mark='✕';}
      else if(!sel&&corr){cls='opt'+(multi?' sq':'')+' miss';mark='!';}
    }
    const b=h('button',{class:cls,role:multi?'checkbox':'radio','aria-checked':sel,'aria-disabled':qi.done?'true':null,onclick:()=>{
      if(qi.done)return;
      if(multi){const p=qi.val.indexOf(oi);if(p>=0)qi.val.splice(p,1);else qi.val.push(oi);}else qi.val=oi;render(true);}},
      h('span',{class:'m'},mark),h('span',null,txt));
    wrap.appendChild(b);
  });
  return wrap;
}
function orderView(qi){
  const d=qi.def,wrap=h('div',{class:'opts'});
  qi.ord.forEach(oi=>{
    const pos=qi.val.indexOf(oi);
    let cls='opt'+(pos>=0?' on chk':''),mark=pos>=0?String(pos+1):'';
    if(qi.done){cls='opt '+(pos===oi?'ok':'bad');mark=String(pos+1);}
    wrap.appendChild(h('button',{class:cls,'aria-label':d.items[oi]+(pos>=0?', Platz '+(pos+1):''),onclick:()=>{
      if(qi.done)return;
      if(pos>=0)qi.val.splice(pos,1);else qi.val.push(oi);render(true);}},h('span',{class:'m'},mark),h('span',null,d.items[oi])));
  });
  const info=h('p',{class:'mut',style:'margin:8px 0 0'},qi.done?'Richtige Reihenfolge: '+d.items.map((x,i)=>(i+1)+'. '+x).join(' → '):'Tippe die Einträge in der richtigen Reihenfolge an (zuerst der erste). Erneutes Tippen nimmt einen Eintrag zurück.');
  const out=h('div',null,wrap,info);
  if(!qi.done&&qi.val.length)out.appendChild(h('div',{class:'btns'},h('button',{class:'btn ghost',onclick:()=>{qi.val=[];render(true);}},'Zurücksetzen')));
  return out;
}
function matchView(qi){
  const d=qi.def,wrap=h('div',{class:'opts'});
  qi.ord.forEach(ii=>{
    const it=d.items[ii],cur=qi.val[ii],right=qi.done&&cur===it[1];
    const row=h('div',{class:'zrow'+(qi.done?(right?' ok':' bad'):'')},h('div',{class:'zt'},it[0]),
      h('div',{class:'zo',role:'radiogroup','aria-label':it[0]},d.opts.map((o,k)=>{
        let c='';if(qi.done){if(k===cur)c=k===it[1]?'ok':'bad';else if(k===it[1])c='miss';}else if(k===cur)c='on';
        return h('button',{class:c,role:'radio','aria-checked':k===cur,onclick:()=>{if(qi.done)return;qi.val[ii]=k;render(true);}},o);})));
    wrap.appendChild(row);
  });
  return wrap;
}
function finish(){
  const q=S.quiz,score=q.qs.filter(x=>x.ok).length;q.score=score;
  if(!q.all&&q.qs.length===12){const b=S.store.best;if(!b||score>b.score){S.store.best={score:score,total:12};}}
  S.store.plays=(S.store.plays||0)+1;save(S.store);
}
function resultView(){
  const q=S.quiz,total=q.qs.length,score=q.score,pct=Math.round(score/total*100);
  const msg=pct===100?'Alles richtig. Stark!':pct>=75?'Sehr gut. Die Eskalationsleiter sitzt weitgehend.':pct>=50?'Solide Basis. Schau dir die markierten Aufgaben noch einmal an.':'Noch Luft nach oben. Wiederhole die Stufen und Phasen im Tab „Leiter“.';
  const wrong=q.qs.filter(x=>!x.ok);
  const b=S.store.best;
  const card=h('div',{class:'card'},h('h2',null,'Auswertung'),h('div',{class:'score'},score+' von '+total),h('p',{class:'lead',style:'margin-top:4px'},pct+' % richtig. '+msg),
    !q.all&&b?h('p',{class:'mut'},'Bestwert (12 Aufgaben): '+b.score+' von '+b.total):null,
    h('div',{class:'rev'},q.qs.map((x,i)=>h('div',{class:'rv '+(x.ok?'ok':'bad')},h('span',null,x.ok?'✓':'✕'),h('span',null,(i+1)+'. '+x.def.q.replace(/ Wähle alle zutreffenden Antworten\./,'')+(x.ok?'':' Merke: '+x.def.why))))),
    h('div',{class:'btns'},
      h('button',{class:'btn',onclick:()=>{newRound(q.all?POOL.length:12);render();}},'Nochmal (neu gemischt)'),
      wrong.length?h('button',{class:'btn ghost',onclick:()=>{S.quiz={qs:wrong.map(x=>mk(x.def)),i:0,fin:false,all:false};render();}},'Nur Fehler wiederholen ('+wrong.length+')'):null,
      h('button',{class:'btn ghost',onclick:()=>{S.quiz=null;render();}},'Zur Startseite')));
  return card;
}
/* ===== Rahmen ===== */
function render(keep){
  const app=$('app'),old=app.querySelector('.main');
  const sc=keep&&old?old.scrollTop:0;
  app.textContent='';
  const main=h('div',{class:'main',id:'main'},S.tab==='leiter'?viewLeiter():viewAufgaben());
  app.appendChild(h('div',{class:'top'},h('small',null,'Zivile Verteidigung'),h('h1',null,'Eskalationsleiter')));
  app.appendChild(main);
  app.appendChild(h('div',{class:'tabs',role:'tablist'},[['leiter','Leiter'],['aufg','Aufgaben']].map(x=>h('button',{class:'tab'+(S.tab===x[0]?' on':''),role:'tab','aria-selected':S.tab===x[0],onclick:()=>{S.tab=x[0];render();}},x[1]))));
  main.scrollTop=sc;
}
render();
})();
