/* ===== Fachlogik (nur Werte aus der Lernseite) ===== */
const GKS={
 '1a':{n:'GK 1a',long:'Gebäudeklasse 1a',c:'#79d65b'},
 '1b':{n:'GK 1b',long:'Gebäudeklasse 1b',c:'#c9cf3f'},
 '2':{n:'GK 2',long:'Gebäudeklasse 2',c:'#2fc7ae'},
 '3':{n:'GK 3',long:'Gebäudeklasse 3',c:'#4a9df0'},
 '4':{n:'GK 4',long:'Gebäudeklasse 4',c:'#9a82f5'},
 '5':{n:'GK 5',long:'Gebäudeklasse 5',c:'#f0643c'},
 'HH':{n:'Hochhaus',long:'Hochhaus (MHHR)',c:'#e0489a'}};
const GKORDER=['1a','1b','2','3','4','5','HH'];
const fm=(x,d)=>(Math.round(x*10)/10).toFixed(d==null?1:d).replace('.',',');
const nFloors=okff=>Math.floor(okff/3+1e-9)+1;
const NUMW=['','eine','zwei','drei','vier','fünf'];
/* Prüfschema (Abschnitt 02) */
function classify(p){
  const S=[],ok=p.okff;
  const add=(id,q,a,val)=>S.push({id,q,a,val});
  add(1,'OKFF > 22 m?',ok>22,'OKFF = '+fm(ok)+' m');
  if(ok>22)return {gk:'HH',steps:S,why:'OKFF der obersten Nutzungseinheit > 22 m: Sonderbau Nr. 1, die Muster-Hochhaus-Richtlinie (MHHR) ist anwendbar.'};
  add(2,'Freistehend und land-/forstwirtschaftlich genutzt?',p.free&&p.land,(p.free?'freistehend':'angebaut')+', '+(p.land?'land-/forstwirtschaftlich':'nicht land-/forstwirtschaftlich'));
  if(p.free&&p.land)return {gk:'1b',steps:S,why:'Freistehend und land-/forstwirtschaftlich genutzt: GK 1b.'};
  add(3,'OKFF ≤ 7 m?',ok<=7,'OKFF = '+fm(ok)+' m');
  if(ok<=7){
    const c4=p.nne<=2&&p.ane;
    add(4,'Höchstens 2 NE und ANE ≤ 400 m²?',c4,p.nne+' NE, ANE '+(p.ane?'≤':'>')+' 400 m²');
    if(!c4)return {gk:'3',steps:S,why:'OKFF ≤ 7 m, aber mehr als 2 NE oder ANE > 400 m²: sonstige Gebäude, also GK 3.'};
    add(5,'Freistehend?',p.free,p.free?'freistehend':'nicht freistehend (angebaut)');
    if(p.free)return {gk:'1a',steps:S,why:'Freistehend, max. 2 NE, ANE ≤ 400 m², OKFF ≤ 7 m: GK 1a.'};
    return {gk:'2',steps:S,why:'Nicht freistehend, max. 2 NE, ANE ≤ 400 m², OKFF ≤ 7 m: GK 2. (GK 1 wird zu GK 2, sobald das Gebäude nicht mehr freistehend ist.)'};
  }
  add(6,'OKFF ≤ 13 m?',ok<=13,'OKFF = '+fm(ok)+' m');
  if(ok>13)return {gk:'5',steps:S,why:'OKFF > 13 m: sonstige Gebäude, also GK 5.'};
  add(7,'ANE ≤ 400 m²?',p.ane,'ANE '+(p.ane?'≤':'>')+' 400 m²');
  if(p.ane)return {gk:'4',steps:S,why:'OKFF ≤ 13 m und ANE ≤ 400 m²: GK 4.'};
  return {gk:'5',steps:S,why:'OKFF ≤ 13 m, aber ANE > 400 m²: sonstige Gebäude, also GK 5.'};
}
const QDEF=[
 [1,'OKFF > 22 m?','Hochhaus-Grenze (Sonderbau Nr. 1)'],
 [2,'Freistehend und land-/forstwirtschaftlich genutzt?','GK 1b'],
 [3,'OKFF ≤ 7 m?','Grenze GK 1 bis 3'],
 [4,'Höchstens 2 NE und ANE ≤ 400 m²?','GK 1/2 oder GK 3'],
 [5,'Freistehend?','GK 1a oder GK 2'],
 [6,'OKFF ≤ 13 m?','Grenze GK 4'],
 [7,'ANE ≤ 400 m²?','GK 4 oder GK 5']];
/* Anforderungen (Abschnitt 04/05/06) */
const REQ={
 none:{k:'none',t:'keine Anforderung',s:'keine',n:'',c:'#8996ad'},
 f30:{k:'f30',t:'feuerhemmend (F30)',s:'F30',n:'feuerhemmend',c:'#f4d03f'},
 f60:{k:'f60',t:'hochfeuerhemmend (F60)',s:'F60',n:'hochfeuerhemmend',c:'#ff9f2e'},
 f60m:{k:'f60m',t:'hochfeuerhemmend mit mech. Beanspruchung (F60-M)',s:'F60-M',n:'hochfeuerhemmend, mechanisch beansprucht',c:'#f26a1b'},
 f90:{k:'f90',t:'feuerbeständig (F90)',s:'F90',n:'feuerbeständig',c:'#e23b3b'},
 bw:{k:'bw',t:'Bauart einer Brandwand (REI 90-M, F 90-A)',s:'Brandwand',n:'Bauart einer Brandwand',c:'#b0246e'},
 nt:{k:'nt',t:'kein notwendiger Treppenraum erforderlich (§ 35 Abs. 1 BauO NRW)',s:'entfällt',n:'kein Treppenraum nötig',c:'#5b6b86'},
 na:{k:'na',t:'nicht angegeben',s:'keine Angabe',n:'',c:'#47546d'}};
const TABLE={ '1a':['none','f30'],'1b':['none','f30'],'2':['f30','f30'],'3':['f30','f90'],'4':['f60','f90'],'5':['f90','f90'],'HH':['f90','f90']};
const PARTS={
 decke:{n:'Decke',pl:'Decken'},
 dach:{n:'Decke zum Dachraum',pl:'Decke zum Dachraum'},
 stuetze:{n:'Stütze',pl:'Stützen'},
 wand:{n:'Tragende Wand',pl:'Tragende Wände'},
 treppe:{n:'Treppenraum-Wand',pl:'Treppenraum'},
 trenn:{n:'Trennwand',pl:'Trennwände'},
 brand:{n:'Brandwand',pl:'Brandwand'}};
let DGAR=true; // über dem Dachgeschoss sind Aufenthaltsräume möglich (Teile-Ansicht)
function reqFor(gk,part,zone){
  const T=TABLE[gk],z=zone==='ke'?1:0;
  if(part==='brand')return 'bw';
  if(part==='dach'){if(DGAR)return T[0];return gk==='1a'||gk==='1b'||gk==='2'?'none':'f30';}
  if(part==='treppe'){return gk==='3'?'f30':gk==='4'?'f60m':gk==='5'?'bw':gk==='HH'?'f90':'nt';}
  if(part==='trenn'){if(gk==='HH')return 'f30';const r=T[z];return (r==='none'||r==='f30')?'f30':r;}
  return T[z];
}
const RL=r=>r.s+(r.n?' ('+r.n+')':'');
function explain(gk,part,zone){
  const g=GKS[gk],r=REQ[reqFor(gk,part,zone)],zn=zone==='ke'?'im Kellergeschoss':'im Obergeschoss';
  const nm=PARTS[part].n;
  if(part==='brand')return {title:'Brandwand',req:r,text:'**Brandwand** (§ 30 BauO NRW): feuerbeständig, nichtbrennbar und **auch unter zusätzlicher mechanischer Beanspruchung**, also **REI 90-M (F 90-A)**. Abstand zur **inneren Ecke**: Lernseite und MBO **≥ 5 m**, nach **§ 30 Abs. 6 BauO NRW mindestens 3 m**. Sie muss **0,30 m über die Bedachung** gezogen werden **oder** mit einer **beidseitig 0,50 m auskragenden** feuerbeständigen Platte abschließen; bei **GK 1 bis 3** genügt **bis unter die Dachhaut**. Innere Brandwände in Abständen von **höchstens 40 m**.'};
  if(part==='treppe'){
    if(gk==='HH')return {title:'Treppenraum-Wand · Hochhaus',req:r,text:'Beim **Hochhaus (MHHR 3.2.3)** haben die Wände der **notwendigen Treppenräume und ihrer Vorräume** die **Feuerwiderstandsfähigkeit der tragenden Bauteile**: **F90 (feuerbeständig)** bei h ≤ 60 m, bei h > 60 m **F120 (hochfeuerbeständig)**. Die Slider-Höhe bleibt bei max. 30 m, also gilt hier F90.'};
    if(gk==='3')return {title:'Treppenraum-Wand · GK 3',req:r,text:'Notwendige Treppenräume in **GK 3**: Wände **feuerhemmend (F30)**. Die Tür zum notwendigen Treppenraum ist eine **RS-Tür**.'};
    if(gk==='4')return {title:'Treppenraum-Wand · GK 4',req:r,text:'Notwendige Treppenräume in **GK 4**: Wände **hochfeuerhemmend mit mech. Beanspruchung (F60-M)**. Die Tür zum notwendigen Treppenraum ist eine **RS-Tür**.'};
    if(gk==='5')return {title:'Treppenraum-Wand · GK 5',req:r,text:'Notwendige Treppenräume in **GK 5**: Wände in der **Bauart einer Brandwand**. Müssen beleuchtet sein; **ohne Fenster: Sicherheitsbeleuchtung**.'};
    return {title:'Treppenraum · '+g.n,req:r,text:'In **GK 1 und 2** sind notwendige Treppen **ohne eigenen Treppenraum** zulässig (§ 35 Abs. 1 BauO NRW). Anforderungen an Treppenraum-Wände gibt es dort daher nicht. Sie gelten erst ab GK 3 (F30), GK 4 (F60-M) und GK 5 (Brandwand-Bauart).'};
  }
  if(part==='dach'){
    const t1=DGAR?'Über dem Dachgeschoss sind **Aufenthaltsräume möglich**: Die Decke muss wie die Geschossdecken des Gebäudes sein (§ 31 Abs. 1 BauO NRW): **'+REQ[r.k].t+'**.':'Über dem Dachgeschoss sind **keine Aufenthaltsräume möglich**: Nach § 31 Abs. 1 Satz 3 Nr. 1 gilt die Geschossdecken-Anforderung für Geschosse im Dachraum dann nicht. Werden die Trennwände zum nicht ausgebauten Dachraum nur bis zur Rohdecke geführt, muss diese Decke aber **feuerhemmend (F30)** sein (§ 29 Abs. 4 Satz 2); bei **Wohngebäuden der GK 1 und 2** gilt § 29 nicht (Abs. 6).';
    return {title:'Decke zum Dachraum',req:r,text:t1};}
  if(part==='decke'&&zone==='ke')return {title:'Kellerdecke (Decke im Kellergeschoss)',req:r,text:'**Decken im Kellergeschoss** (§ 31 Abs. 2 BauO NRW): **GK 3 bis 5 feuerbeständig**, **GK 1 und 2 feuerhemmend**. Das ist die Decke über dem Keller, also die Kellerdecke. Dazu: Decken unter und über Räumen mit Explosions- oder erhöhter Brandgefahr müssen **feuerbeständig** sein (Wohngebäude GK 1 und 2 ausgenommen).'};
  if(part==='trenn'){
    if(gk==='HH')return {title:'Trennwand · Hochhaus',req:r,text:'Beim **Hochhaus (MHHR 3.2.5)** müssen **Trennwände zwischen Nutzungseinheiten** und die **Wände notwendiger Flure** **feuerhemmend (F30)** sein. **Feuerbeständig (F90)** sind dagegen Brandwände, Wände von Installationsschächten, Trennwände von Räumen mit erhöhter Brandgefahr und Trennwände zwischen Aufenthaltsräumen und anders genutzten Räumen im Keller (MHHR 3.2.4). Diese Werte stehen in der MHHR, nicht auf der Lernseite.'};
    return {title:'Trennwand · '+g.n,req:r,text:'**Trennwände** (zwischen Nutzungseinheiten): mindestens die Feuerwiderstandsfähigkeit der **tragenden Bauteile des Geschosses**, jedoch **mind. F30**. Türen: **T30-DS**. '+(gk==='1a'||gk==='1b'||gk==='2'?' **Bei Wohngebäuden der GK 1 und 2** gelten die Trennwandregeln nicht (§ 29 Abs. 6 BauO NRW).':'')+' Hier: '+g.n+' '+zn+' = '+REQ[reqFor(gk,'decke',zone)].s+', Trennwand daher **'+r.s+'**.'};
  }
  if(gk==='HH')return {title:nm+' · Hochhaus',req:r,text:'Beim **Hochhaus (MHHR 3.1)** müssen **tragende und aussteifende Bauteile** (auch im Keller) **feuerbeständig (F90)** sein und aus **nichtbrennbaren Baustoffen** bestehen. Bei **mehr als 60 m Höhe** sind **120 Minuten** (F120, hochfeuerbeständig) verlangt. Geschossdecken sind raumabschließend mit der Feuerwiderstandsfähigkeit der tragenden Bauteile. Diese Werte stehen in der MHHR (Stand 2008/2012), nicht in der Tabelle der Lernseite.'};
  const row=TABLE[gk];
  const rs=gk==='2'?'GK 2':gk==='1a'||gk==='1b'?'GK 1':g.n;
  return {title:nm+' · '+zn.replace('im ','').replace('geschoss','geschoss'),req:r,
    text:'**'+PARTS[part].pl+'** '+zn+' bei **'+rs+'**: **'+r.t+'**.'+
     ' Zum Vergleich: Kellergeschoss '+RL(REQ[row[1]])+', Obergeschoss '+RL(REQ[row[0]])+'.'+
     (zone==='ke'?' (Vereinfachung: die Decke über dem Keller zählt hier zum Kellergeschoss.)':'')+((gk==='1a'||gk==='1b')&&zone==='og'&&(part==='wand'||part==='stuetze')?' Die Übungsmatrix (Seite 133) nennt für GK 1 hier **„ausreichend lange Standsicherheit“**, also keine Feuerwiderstandsklasse.':'')+(gk==='2'&&zone==='og'?' **Hinweis:** Die Übungsmatrix (Seite 133) und **§ 27 Abs. 1 BauO NRW 2018** nennen für GK 2 **feuerhemmend**; nur in GK 1 gibt es dort keine F-Klasse. (Die ältere Lernseiten-Tabelle „GK 1/2: keine Anforderung“ weicht für GK 2 ab.)':'')};
}
/* Sonderbau-Check (Abschnitt 03) */
const SONDER=[
 {n:'Hochhäuser',t:'OKFF > 22 m',v:'MHHR'},
 {n:'Verkaufsstätten',t:'A > 800 m² (ab 2000 m²: MVKVO)',v:'MVKVO'},
 {n:'Versammlungsstätten',t:'n > 100 Personen (ab 200: MVStättVO)',v:'MVStättVO'},
 {n:'Beherbergungsstätten',t:'n > 12 Gastbetten',v:'MBeVO'},
 {n:'Krankenhäuser',t:'Nutzung',v:'MKhVO'},
 {n:'Industriebauten',t:'Produktion/Lagerung',v:'MIndBauRL'},
 {n:'Garagen',t:'Stellplätze > 100 m²',v:'M-GarVO'}];
/* Quiz-Fälle */
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
function genParams(gk){
  const half=()=>rnd(0,1)*0.5;
  let p={okff:0,free:true,nne:1,ane:true,land:false},edge=Math.random()<0.28;
  if(gk==='1a'){p.okff=edge?7:rnd(0,13)/2+0.5*0+rnd(0,1)*0;p.okff=edge?7:Math.min(7,rnd(3,13)/2);p.nne=rnd(1,2);}
  else if(gk==='1b'){p.land=true;p.okff=rnd(3,9)*0.5+1;p.nne=rnd(1,3);p.ane=Math.random()<0.7;}
  else if(gk==='2'){p.free=false;p.okff=edge?7:rnd(3,13)/2;p.nne=rnd(1,2);}
  else if(gk==='3'){p.okff=edge?7:rnd(4,13)/2+0.5;p.okff=Math.min(7,p.okff);p.free=Math.random()<0.5;if(Math.random()<0.5){p.nne=rnd(3,5);}else{p.nne=rnd(1,2);p.ane=false;}}
  else if(gk==='4'){p.okff=edge?pick([7.5,13]):rnd(8,12)+half();p.okff=Math.min(13,p.okff);p.free=Math.random()<0.5;p.nne=rnd(1,5);}
  else if(gk==='5'){if(Math.random()<0.3){p.okff=rnd(8,12);p.ane=false;}else p.okff=edge?pick([13.5,22]):rnd(14,21)+half();p.free=Math.random()<0.5;p.nne=rnd(2,5);}
  else {p.okff=edge?22.5:rnd(23,30)+(Math.random()<0.5?0.5:0);p.okff=Math.min(30,p.okff);p.nne=rnd(3,5);p.ane=Math.random()<0.5;p.free=Math.random()<0.7;}
  p.okff=Math.max(0,Math.round(p.okff*2)/2);
  return p;
}
function describe(p){
  const area=p.ane?rnd(6,38)*10:rnd(42,90)*10;
  let noun;
  if(p.land)noun=pick(['Landwirtschaftliches Wirtschaftsgebäude','Hofgebäude mit Stall und Lager','Land-/forstwirtschaftlich genutzte Halle']);
  else if(p.okff>22)noun=pick(['Bürotürme','Wohnturm','Turmgebäude']).replace('Bürotürme','Bürohochhaus');
  else if(p.nne>=3)noun=pick(['Mehrfamilienhaus','Wohn- und Geschäftshaus','Bürogebäude']);
  else if(!p.free)noun=pick(['Doppelhaushälfte','Reihenendhaus','Wohnhaus mit angebauter Garage']);
  else noun=pick(['Einfamilienhaus','Zweifamilienhaus','Kleines Bürogebäude']);
  return noun+', '+(p.free?'freistehend':'an ein Nachbargebäude angebaut')+', '+(p.nne===1?'1 Nutzungseinheit':p.nne+' Nutzungseinheiten')+', größte NE etwa '+area+' m²'+(p.land?', land-/forstwirtschaftlich genutzt':'')+'. OKFF der obersten NE: '+fm(p.okff)+' m.';
}
function makeRound(){
  const targets=shuffle(GKORDER).slice(0,6),cases=[];
  targets.forEach(g=>{const p=genParams(g);cases.push({kind:'gk',p,gk:g,text:describe(p)});});
  for(let i=0;i<2;i++){
    const g=pick(['1a','2','3','4','5']),zone=i?'ke':'og';
    const p=genParams(g);
    cases.push({kind:'bt',p,gk:g,zone,text:GKS[g].long+''+', OKFF '+fm(p.okff)+' m.'});
  }
  return shuffle(cases);
}
function makeSonder(){
  return shuffle(SONDER).map(s=>{const wrong=shuffle(SONDER.filter(x=>x.v!==s.v)).slice(0,3).map(x=>x.v);return {s,opts:shuffle(wrong.concat([s.v]))};});
}
/* ===== Katalog: Ebenen, Stellen, Pin-Lage ===== */
const KT=KATALOG.bauteile,KBY={},KZ={};
KT.forEach(b=>{KBY[b.id]=b;(KZ[b.pos]=KZ[b.pos]||[]).push(b);});
const GR=[
 {k:'Tragwerk',n:'Tragwerk',c:'#4f8dff'},
 {k:'Raumabschluss',n:'Raumabschluss',c:'#ffb02e'},
 {k:'Hülle',n:'Hülle',c:'#27c9a8'},
 {k:'Rettungsweg',n:'Rettungsweg',c:'#4fd35e'},
 {k:'Öffnungen',n:'Öffnungen',c:'#c07bff'},
 {k:'Technik',n:'Technik',c:'#ff7448'},
 {k:'Bauprodukte',n:'Bauprodukte',c:'#aeb9cc'},
 {k:'Sonderbau',n:'Hochhaus',c:'#ff5cae'}];
const GCOL={};GR.forEach(g=>GCOL[g.k]=g.c);
const GCOUNT={};KT.forEach(b=>GCOUNT[b.gruppe]=(GCOUNT[b.gruppe]||0)+1);
const LAYERS0={};GR.forEach(g=>LAYERS0[g.k]=true);
const ZGRP={'wand-tragend':'Tragwerk','stuetze':'Tragwerk','decke':'Tragwerk','keller-decke':'Tragwerk','dach-decke':'Tragwerk','trennwand':'Raumabschluss','brandwand':'Raumabschluss','wand-aussen':'Hülle','dach':'Hülle','tuer':'Öffnungen','fenster':'Öffnungen','rettungsweg':'Rettungsweg','treppenraum':'Rettungsweg','flur':'Rettungsweg','aufstellflaeche':'Rettungsweg','aufzug':'Technik','durchfuehrung':'Technik','schacht':'Technik'};
const ZNAME={'aufstellflaeche':'Aufstellfläche und Zufahrt','rettungsweg':'Rettungswege','wand-aussen':'Außenwand und Fassade','fenster':'Fenster','brandwand':'Brandwand','dach':'Dach','keller-decke':'Kellerdecke','decke':'Geschossdecke','wand-tragend':'Tragende Wand','stuetze':'Stütze','trennwand':'Trennwand','tuer':'Türen','flur':'Notwendiger Flur','treppenraum':'Treppenraum','aufzug':'Aufzug','schacht':'Schächte und Leitungen','durchfuehrung':'Leitungsdurchführung','dach-decke':'Decke zum Dachraum'};
/* Rundgang: erst außen (Boden bis Dach), dann innen (Keller bis Dachraum) */
const ZOUT=['aufstellflaeche','rettungsweg','wand-aussen','fenster','brandwand','dach'];
const ZIN=['keller-decke','decke','wand-tragend','stuetze','trennwand','tuer','flur','treppenraum','aufzug','schacht','durchfuehrung','dach-decke'];
const ZTOUR=ZOUT.concat(ZIN);
const AUFTR={geschoss:'je Geschoss',gebaeude:'einmal im Gebäude',mehrfach:'mehrfach im Gebäude'};
/* Lage der Marker: [Ebene, x, y, z]; g = Erdgeschoss, m = 1. OG, t = oberstes Geschoss, k = Keller, r = über dem Dach, o = draußen */
const PINPOS={
 tw_wand:['g',-2.56,0.11,-1],tw_stuetze:['g',2.08,1.87,3.7],tw_balkon:['m',7.3,1.6,1.6],decke:['m',-4.05,0.52,3],decke_keller:['g',-4.33,-0.01,3],
 decke_explosion:['m',-0.84,0.99,3],decke_anschluss:['m',5.2,0.55,3],dach_decke:['t',-4.63,3.54,3],trennwand_ne:['g',0.97,1.84,1.2],
 trennwand_keller:['k',0.01,1.82,2.2],trennwand_explosion:['g',0.86,1.31,3.2],trennwand_dachraum:['t',3,3.65,3],
 trennwand_oeffnung:['g',-0.32,0.76,2.7],brandwand_abschluss:['g',-5.73,2.72,-5.1],brandwand_innere:['g',-4.28,1.86,-5.1],
 brandwand_landwirtschaft:['g',-1.49,1.51,-5.1],brandwand_ersatz:['g',-0.05,1.86,-5.1],brandwand_ausfuehrung:['m',-5.52,1.71,-5.1],
 brandwand_dach:['m',-3.98,2.09,-5.1],brandwand_innenecke:['m',-2.11,2.86,-5.1],brandwand_einbauten:['m',0.72,2.06,-5.1],
 brandwand_oeffnungen:['g',3.26,2.34,-5.1],aw_allgemein:['t',-5.2,2.7,-4],aw_nichttragend:['t',-3.66,2.81,-4],aw_oberflaeche:['t',-2.18,3.26,-4],
 aw_balkon_solar:['t',0.2,3.2,-4],aw_hinterlueftet:['t',1.75,3.67,-4],aw_brandueberschlag:['t',3.41,3.09,-4],bedachung_hart:['r',-2.8,3.7,0],
 bedachung_weich:['r',-0.4,3.7,0],dach_aufbauten:['r',2.37,2.38,2.8],dach_traufseitig:['r',2,3.7,0],dach_anbau:['r',4.83,2.72,0.6],
 rw_zwei:['o',-3.08,5.01,5.3],rw_rettungsgeraet:['o',-0.6,2.6,8.6],rw_laenge:['t',-1.43,1.05,-2.6],keller_rw:['k',0.27,1.42,-2.6],
 sicherheitstreppenraum:['m',3.66,0.46,-2.5],treppe_notwendig:['m',4.92,-0.98,-2.5],treppe_ohne_raum:['m',6.72,-0.83,-2.5],
 treppenraum_wand:['m',2.5,1.86,-2.5],treppenraum_abschluss:['m',4.16,2,-2.5],treppenraum_erweiterung:['m',5.93,2.09,-2.5],
 treppenraum_oberflaeche:['m',2.96,3.33,-2.5],treppenraum_beleuchtung:['m',4.6,3.54,-2.5],treppenraum_entrauchung:['m',6.36,3.61,-2.5],
 flur_pflicht:['m',-3.57,0.57,-2.7],flur_wand:['m',-2.1,1.01,-2.7],flur_rauchabschnitt:['m',0.59,0.01,-2.7],flur_stichflur:['m',-4.9,1.41,-2.7],
 flur_oberflaeche:['m',-0.62,1.33,-2.7],flur_breite_stufen:['m',0.95,1.61,-2.7],offener_gang:['m',7.08,0.91,-2],zugang_zufahrt:['o',-5.6,0.9,8.2],
 aufstellflaeche:['o',4.8,0.9,8.2],tuer_treppenraum_keller:['g',3.59,1.1,-0.9],tuer_treppenraum_flur:['g',3.17,1.88,-2.5],
 tuer_treppenraum_sonst:['g',5.41,0.96,-0.9],tuer_flur:['g',-3.95,0.97,-1],tuer_decke_oeffnung:['m',5.34,0.6,-2.4],
 fenster_rettung:['m',-2.93,1.73,-3.9],keller_rauchableitung:['k',-2.97,0.79,-3.9],aufzug_schacht:['g',-6.29,0.66,-2.1],
 aufzug_ohne_schacht:['g',-4.92,-0.27,-2.1],aufzug_rauch:['g',-6.31,2.31,-2.1],aufzug_pflicht:['g',-3.78,2.13,-2.1],
 leitung_durchfuehrung:['t',-2.02,2.94,-1],leitung_rettungsweg:['m',-1.75,2.55,-2.7],install_schacht:['t',0.9,0.52,-1.5],
 lueftung_leitung:['t',2.04,2.16,-1.5],lueftung_allgemein:['t',0.51,2.76,-1.5],feuerung:['t',-0.33,1.61,-1.5],abfallraum:['g',-2.87,0.25,2.2],
 blitzschutz:['r',-5,4.6,-2.4],rauchwarnmelder:['m',-4.23,4.29,-2.7],baustoffklassen:['g',-1.28,0.89,-1],bauteilklassen:['g',0.38,0.72,-1],
 bauteile_brennbar:['g',-5.3,1.88,-1],daemmstoffe:['t',5.19,2.67,-4],hochhaus_hinweis:['t',-6.07,1.44,-1]};
const PINDEF=['g',0,1.5,0];
/* ===== three.js-Szene ===== */
const FH=3, MAXF=11, BW=12, BD=9;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function createScene(canvas,host,cb){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,0.5,700);
  scene.add(new THREE.HemisphereLight(0xe3ecff,0x54483c,0.78));
  const sun=new THREE.DirectionalLight(0xfff2de,0.7);sun.position.set(-22,40,30);scene.add(sun);
  const lm=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
  const fm_=(c)=>new THREE.MeshStandardMaterial({color:c,flatShading:true,roughness:1,metalness:0});
  const bs=(c)=>new THREE.MeshBasicMaterial({color:c});
  const BOXG=new THREE.BoxGeometry(1,1,1);
  const bx=(par,w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(BOXG,mat);m.scale.set(w,h,d);m.position.set(x,y,z);par.add(m);return m;};
  let seed=7;const rr=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  /* ---------- Material ---------- */
  const wallM=lm(0xc5ccd8),trimM=lm(0xe8ecf2),pierM=lm(0x2e3646),doorM=lm(0x5b3d2b),roofM=lm(0x56607a),roofD=lm(0x3d4558);
  const NEC=[0xffe39a,0x9fe0ff,0xffb3c7,0xb9f0a8,0xd2b6ff];
  const glass=NEC.map(bs);
  const neutralC=new THREE.Color(0xc5ccd8);
  /* ---------- Umgebung ---------- */
  const env=new THREE.Group();scene.add(env);
  const soilM=lm(0x6b4f3a),grassM=lm(0x4f9460);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(80,82,4,36),[soilM,grassM,soilM]);disc.position.y=-2;env.add(disc);
  bx(env,64,0.06,34,0,0.03,-5,lm(0x62a86c));                 // Grundstuecksrasen
  bx(env,150,0.12,6.4,0,0.05,19,lm(0x3a4252));                // Strasse
  bx(env,150,0.16,2.4,0,0.07,13.4,lm(0xcfc9bb));              // Gehweg
  bx(env,150,0.16,1.6,0,0.07,23,lm(0xcfc9bb));
  for(let i=-14;i<15;i++)bx(env,2.2,0.02,0.2,i*5,0.12,19,bs(0xe9e6da));
  bx(env,2.2,0.1,7,0,0.06,9.8,lm(0xd9cfbd));                 // Weg zur Tuer
  const cyl=(r1,r2,h,seg,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);m.position.set(x,y,z);return m;};
  const treeG=new THREE.Group();env.add(treeG);
  const green=[fm_(0x2f7a45),fm_(0x3a8a4c),fm_(0x4a9a4a)],trunkM=lm(0x6a4a30);
  function tree(x,z,s,k){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);
    g.add(cyl(0.25,0.35,2,5,trunkM,0,1,0));
    if(k){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(1.9,0),green[1]);c.position.y=3.6;g.add(c);}
    else{g.add(cyl(0,2.1,3.2,7,green[0],0,3.2,0));g.add(cyl(0,1.6,2.8,7,green[2],0,4.6,0));}
    treeG.add(g);}
  [[-30,-6,1.3,0],[-26,6,1,1],[-38,9,1.2,0],[24,7,1.1,1],[32,-2,1.4,0],[40,8,1,0],[-20,-14,1.2,1],[18,-15,1.3,0],[-8,-16,1,0],[8,-17,1.2,1],[30,-14,1.1,0],[-44,-6,1.4,1],[46,-10,1.3,0],[-14,16.5+0,0.0001,0]].forEach(a=>{if(a[2]>0.1)tree(a[0],a[1],a[2],a[3]);});
  [-34,-12,14,36].forEach((x,i)=>tree(x,26.6,0.9+0.1*i%2,i%2));
  function house(w,d,fl,wc,rc,over){const g=new THREE.Group(),h=fl*3;
    bx(g,w,h,d,0,h/2,0,lm(wc));
    for(let f=0;f<fl;f++)for(let c=-1;c<=1;c++){bx(g,1.1,1.3,0.08,c*w/3.4,f*3+1.8,d/2+0.03,glass[f%2?0:0]);}
    const sh=new THREE.Shape();sh.moveTo(-w/2-over,0);sh.lineTo(w/2+over,0);sh.lineTo(0,w*0.3);sh.lineTo(-w/2-over,0);
    const rg=new THREE.ExtrudeGeometry(sh,{depth:d+over*2,bevelEnabled:false});rg.translate(0,0,-(d+over*2)/2);
    const r=new THREE.Mesh(rg,lm(rc));r.position.y=h;g.add(r);return g;}
  const hb=[[-26,-18,9,3,0xd9c7a8,0x8a4a3a],[-10,-19,8,2,0xe3d5c2,0x5c6579],[8,-19,10,3,0xc8d3de,0x8a4a3a],[26,-18,8,2,0xe0c9b0,0x5c6579],[-44,-14,8,2,0xd2d9c3,0x7a5040],[44,-15,9,3,0xd9d0c7,0x5c6579]];
  hb.forEach(a=>{const g=house(a[2],7,a[3],a[4],a[5],0.4);g.position.set(a[0],0,a[1]);env.add(g);});
  const nbL=house(9,BD,3,0xe0d2bd,0x7a4b3d,0),nbR=house(8,BD,2,0xd3dae2,0x56607a,0.5);env.add(nbL,nbR);
  /* Laternen */
  [-18,0,22].forEach(x=>{const g=new THREE.Group();g.position.set(x+8,0,14.8);g.add(cyl(0.08,0.1,5,5,lm(0x2c3344),0,2.5,0));const b=new THREE.Mesh(new THREE.SphereGeometry(0.34,8,6),bs(0xffe9a8));b.position.y=5.1;g.add(b);env.add(g);});
  /* Auto */
  const car=new THREE.Group();const cc=lm(0xd9482e);
  bx(car,4.2,0.9,1.9,0,0.75,0,cc);bx(car,2.2,0.8,1.7,-0.2,1.55,0,lm(0xf0f3f8));bx(car,2.0,0.5,1.74,-0.2,1.55,0,glass[1]);
  [[-1.3,0.9],[1.3,0.9],[-1.3,-0.9],[1.3,-0.9]].forEach(p=>{const w=cyl(0.38,0.38,0.3,10,lm(0x1b1f2a),p[0],0.38,p[1]);w.rotation.x=Math.PI/2;car.add(w);});
  car.position.set(0,0,20.4);env.add(car);
  const car2=car.clone();car2.position.set(-26,0,17.6);car2.rotation.y=Math.PI;env.add(car2);
  /* Land-/forstwirtschaft */
  const farm=new THREE.Group();env.add(farm);
  {const sil=cyl(1.8,1.8,11,10,fm_(0x9fb1c7),0,5.5,0);farm.add(sil);const dm=new THREE.Mesh(new THREE.SphereGeometry(1.8,10,6,0,Math.PI*2,0,Math.PI/2),fm_(0x6d7f97));dm.position.y=11;farm.add(dm);
   const s2=cyl(1.4,1.4,8,10,fm_(0xb9c7d8),3.9,4,1.2);farm.add(s2);const d2=new THREE.Mesh(new THREE.SphereGeometry(1.4,10,6,0,Math.PI*2,0,Math.PI/2),fm_(0x6d7f97));d2.position.set(3.9,8,1.2);farm.add(d2);
   for(let i=0;i<4;i++){const b=cyl(0.85,0.85,1.5,10,fm_(0xe0c45a),-3+i*1.9,0.85,7+(i%2)*1.4);b.rotation.z=Math.PI/2;farm.add(b);}
   for(let i=0;i<9;i++){bx(farm,0.18,1.2,0.18,-4+i*2,0.6,10.5,lm(0x7a5a3a));}bx(farm,16,0.12,0.1,0,0.95,10.5,lm(0x7a5a3a));bx(farm,16,0.12,0.1,0,0.5,10.5,lm(0x7a5a3a));
   for(let i=0;i<6;i++)bx(farm,30,0.05,1.6,2,0.07,-10-i*2.6,lm(i%2?0xb99a4c:0x8a7a3a));}
  /* Spielfeld Hilfs-Dach */
  /* ---------- Gebaeude ---------- */
  const bg=new THREE.Group();scene.add(bg);
  const structMeshes=[],trennList=[],floors=[];
  const secMats={};
  const TINT={dach:['w',0.2],decke:['w',0.2],stuetze:['k',0.78],wand:['w',0],treppe:['k',0.84],trenn:['w',0.1],brand:['w',0]};
  function secMat(req,dim,part){const k=req+(dim?'|d':'')+'|'+(part||'wand');if(!secMats[k]){const c=new THREE.Color(REQ[req].c),t=TINT[part||'wand'];
    if(t[0]==='w')c.lerp(new THREE.Color(0xffffff),t[1]);else c.multiplyScalar(t[1]);
    secMats[k]=dim?new THREE.MeshLambertMaterial({color:c,transparent:true,opacity:0.1,depthWrite:false}):new THREE.MeshLambertMaterial({color:c});}return secMats[k];}
  const edgeG=new THREE.EdgesGeometry(BOXG),edgeM=new THREE.LineBasicMaterial({color:0x141b2b,transparent:true,opacity:0.5});
  const stairM=lm(0xaab2c2),holeM=lm(0x39435a);
  const ZP={decke:'decke',stuetze:'stuetze',wand:'wand-tragend',treppe:'treppenraum',trenn:'trennwand',dach:'dach-decke',brand:'brandwand'};
  function mkS(par,part,zone,f,w,h,d,x,y,z,extra){const m=bx(par,w,h,d,x,y,z,secMat('none'));m.userData=Object.assign({part,zone,f},extra||{});const u0=m.userData;u0.rz=u0.rz||ZP[part];u0.grp=u0.grp||ZGRP[u0.rz];const ed=new THREE.LineSegments(edgeG,edgeM);m.add(ed);m.userData.edge=ed;structMeshes.push(m);return m;}
  const AUSSEN={rz:'wand-aussen',grp:'Hülle'};
  function buildStruct(g,zone,f){
    mkS(g,'decke',f===0&&zone==='og'?'ke':zone,f,12,0.3,9,0,-0.15,0,f===0&&zone==='og'?{kd:true,rz:'keller-decke'}:f===-1?{bp:true,noPick:true}:null);
    mkS(g,'wand',zone,f,12,3,0.3,0,1.5,-4.35,AUSSEN);
    mkS(g,'wand',zone,f,0.3,3,9,-5.85,1.5,0,{left:true,rz:'wand-aussen',grp:'Hülle'});
    mkS(g,'wand',zone,f,0.3,3,9,5.85,1.5,0,AUSSEN);
    [-4.5,-1.5,1.5,4.5].forEach(x=>mkS(g,'stuetze',zone,f,0.55,3,0.55,x,1.5,3.7));
    mkS(g,'wand',zone,f,8,3,0.25,-1.7,1.5,-1);
    const t=mkS(g,'trenn',zone,f,0.18,3,5.2,0,1.5,1.6);trennList.push(t);
    mkS(g,'treppe',zone,f,3.2,3,0.2,3.9,1.5,-4.05);mkS(g,'treppe',zone,f,3.2,3,0.2,3.9,1.5,-0.9);
    mkS(g,'treppe',zone,f,0.2,3,3.15,2.3,1.5,-2.475);mkS(g,'treppe',zone,f,0.2,3,3.15,5.5,1.5,-2.475);
    const fl=bx(g,2.6,0.14,3.9,0,0,0,stairM);fl.position.set(3.9,1.5,-2.475);fl.rotation.x=Math.PI/4;fl.userData={noPick:true};structMeshes.push(fl);fl.userData.stair=true;
  }
  /* ---------- Rundgang: zusaetzliche Bauteile (einmal gebaut, danach nur Sichtbarkeit) ---------- */
  const exM=[],pickX=[];
  const gmC={},gtC={};
  const gm=g=>gmC[g]||(gmC[g]=new THREE.MeshLambertMaterial({color:GCOL[g]}));
  const gt=(g,op)=>{const k=g+(op||'');return gtC[k]||(gtC[k]=new THREE.MeshLambertMaterial({color:GCOL[g],transparent:true,opacity:op||0.5,depthWrite:false}));};
  const CYLG=new THREE.CylinderGeometry(1,1,1,10);
  function addX(par,rz,grp,w,h,d,x,y,z,tr,op){const m=bx(par,w,h,d,x,y,z,tr?gt(grp,op):gm(grp));m.userData={rz,grp};exM.push(m);pickX.push(m);return m;}
  function pipe(par,rz,grp,r,len,x,y,z){const m=new THREE.Mesh(CYLG,gm(grp));m.scale.set(r,len,r);m.rotation.x=Math.PI/2;m.position.set(x,y,z);m.userData={rz,grp};par.add(m);exM.push(m);pickX.push(m);return m;}
  function buildExtras(par,f,kel){
    if(!kel){
      addX(par,'wand-aussen','Hülle',12.5,3,0.14,0,1.5,-4.62,true);
      addX(par,'wand-aussen','Hülle',0.14,3,9.4,6.1,1.5,0,true);
      if(f>0){addX(par,'wand-aussen','Tragwerk',2.4,0.22,3.2,7.2,-0.11,1.6);addX(par,'wand-aussen','Tragwerk',2.4,0.8,0.07,7.2,0.5,3.15,true,0.7);addX(par,'wand-aussen','Tragwerk',2.4,0.8,0.07,7.2,0.5,0.05,true,0.7);addX(par,'wand-aussen','Tragwerk',0.07,0.8,3.1,8.35,0.5,1.6,true,0.7);}
      if(f===0)addX(par,'tuer','Öffnungen',1.3,2.1,0.4,3.6,1.05,-5.0);
    }
    [-2.6,0.2].forEach(x=>addX(par,'fenster','Öffnungen',1.4,1.3,0.12,x,1.55,-4.12,true,0.7));
    addX(par,'aufzug','Technik',2,3,1.6,-4.85,1.5,-3.4,true,0.6);
    addX(par,'schacht','Technik',1.1,3,0.9,1.55,1.5,-1.7);
    addX(par,'flur','Rettungsweg',5.9,0.05,2.7,-0.9,0.03,-2.55);
    addX(par,'tuer','Öffnungen',1.1,2.1,0.36,-3.5,1.05,-1.0);
    addX(par,'tuer','Öffnungen',0.36,2.1,1.1,2.3,1.05,-2.5);
    addX(par,'tuer','Öffnungen',1.0,2.1,0.34,3.3,1.05,-0.9);
    addX(par,'tuer','Öffnungen',1.0,2.1,0.34,4.9,1.05,-0.9);
    addX(par,'tuer','Öffnungen',0.34,2.1,1.0,0,1.05,2.7);
    pipe(par,'durchfuehrung','Technik',0.14,2.2,-2.4,2.6,-1.0);
    pipe(par,'durchfuehrung','Technik',0.24,0.5,-2.4,2.6,-1.0);
  }
  function buildFloor(f){
    const g=new THREE.Group(),shell=new THREE.Group(),st=new THREE.Group(),ex=new THREE.Group();g.add(shell,st,ex);ex.visible=false;buildExtras(ex,f,false);
    bx(shell,12,3,0.3,0,1.5,4.35,wallM);bx(shell,12,3,0.3,0,1.5,-4.35,wallM);
    bx(shell,0.3,3,9,-5.85,1.5,0,wallM);bx(shell,0.3,3,9,5.85,1.5,0,wallM);
    bx(shell,12.3,0.24,9.3,0,0.12,0,trimM);
    const win=[],seps=[];
    for(let c=0;c<5;c++){
      const x=(c-2)*2.3;
      if(f===0&&c===2){bx(shell,1.5,2.3,0.1,x,1.15,4.5,doorM);bx(shell,1.9,0.15,0.4,x,2.4,4.6,trimM);win.push(null);continue;}
      win.push(bx(shell,1.4,1.5,0.1,x,1.75,4.52,glass[0]));bx(shell,1.7,0.12,0.26,x,0.95,4.55,trimM);
    }
    for(let i=0;i<4;i++){seps.push(bx(shell,0.34,3,0.5,(i-1.5)*2.3,1.5,4.5,pierM));}
    [-3.6,0,3.6].forEach(x=>bx(shell,1.3,1.4,0.1,x,1.75,-4.52,glass[0]));
    [-2.2,2.2].forEach(z=>{bx(shell,0.1,1.4,1.3,6.02,1.75,z,glass[0]);bx(shell,0.1,1.4,1.3,-6.02,1.75,z,glass[0]);});
    buildStruct(st,'og',f);
    bg.add(g);floors.push({g,shell,st,ex,win,seps,G:0});
  }
  for(let f=0;f<MAXF;f++)buildFloor(f);
  /* Keller */
  const kel=new THREE.Group();kel.position.y=-3;bg.add(kel);buildStruct(kel,'ke',-1);
  const kelEx=new THREE.Group();kelEx.visible=false;kel.add(kelEx);buildExtras(kelEx,-1,true);
  /* Sockel (Schnittmodell) */
  const plinth=new THREE.Group();bg.add(plinth);
  {const sm=lm(0x73553d),gm=lm(0x58a066);
   bx(plinth,3,3.4,12,-7.5,-1.7,-1.5,sm);bx(plinth,3,3.4,12,7.5,-1.7,-1.5,sm);bx(plinth,18,3.4,3,0,-1.7,-6,sm);
   bx(plinth,18,0.9,13.5,0,-3.75,-2.25,sm);
   bx(plinth,3,0.2,12,-7.5,0.02,-1.5,gm);bx(plinth,3,0.2,12,7.5,0.02,-1.5,gm);bx(plinth,18,0.2,3,0,0.02,-6,gm);
   bx(plinth,3,0.06,12,-7.5,-1.1,-1.5,lm(0x8a6a4e));bx(plinth,3,0.06,12,7.5,-1.1,-1.5,lm(0x8a6a4e));}
  /* Dach */
  const roofG=new THREE.Group();bg.add(roofG);
  const roofShell=new THREE.Group(),roofStruct=new THREE.Group();roofG.add(roofShell,roofStruct);
  mkS(roofStruct,'dach','og',99,12,0.3,9,0,-0.15,0);
  let GABLEG=null;
  const gable=new THREE.Group(),flat=new THREE.Group();roofShell.add(gable,flat);
  {const sh=new THREE.Shape();sh.moveTo(-5.1,-0.1);sh.lineTo(5.1,-0.1);sh.lineTo(0,2.5);sh.lineTo(-5.1,-0.1);
   const g=new THREE.ExtrudeGeometry(sh,{depth:12,bevelEnabled:false});const m=new THREE.Mesh(g,roofM);m.rotation.y=Math.PI/2;m.position.set(-6,0,0);gable.add(m);GABLEG=g;}
  bx(flat,12.4,0.5,9.4,0,0.25,0,roofD);bx(flat,3.4,1.2,2.6,-3,1.1,-1.5,lm(0x7c879e));bx(flat,0.12,5,0.12,3.5,3,1,lm(0xc9d0dc));
  {const b=new THREE.Mesh(new THREE.SphereGeometry(0.28,8,6),bs(0xff4a3a));b.position.set(3.5,5.6,1);flat.add(b);}
  /* Brandwand-Detail */
  const bwG=new THREE.Group();roofG.add(bwG);const bwM=secMat('bw',false,'brand');
  {const sh=new THREE.Shape();sh.moveTo(-4.5,0);sh.lineTo(4.5,0);sh.lineTo(4.5,0.55);sh.lineTo(0,2.9);sh.lineTo(-4.5,0.55);sh.lineTo(-4.5,0);
   const g=new THREE.ExtrudeGeometry(sh,{depth:0.3,bevelEnabled:false});const m=new THREE.Mesh(g,bwM);m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g),edgeM));m.rotation.y=-Math.PI/2;m.position.set(-5.7,-0.1,0);m.userData={part:'brand',zone:'og',f:98,rz:'brandwand',grp:'Raumabschluss'};structMeshes.push(m);bwG.add(m);
   const fb=bx(bwG,0.3,0.7,9,-5.85,0.25,0,bwM);fb.userData={part:'brand',zone:'og',f:97,flat:true,rz:'brandwand',grp:'Raumabschluss'};structMeshes.push(fb);
   bwG.userData={gableMesh:m,flatMesh:fb};}
  /* Rundgang: Dach (durchsichtig), Brandwand, Vorplatz mit Feuerwehr */
  const roofRG=new THREE.Group();roofG.add(roofRG);roofRG.visible=false;
  const rgRoofG=new THREE.Group(),rgRoofF=new THREE.Group();roofRG.add(rgRoofG,rgRoofF);
  const rzu=(m,rz,grp)=>{m.userData={rz,grp};pickX.push(m);return m;};
  {const m=new THREE.Mesh(GABLEG,gt('Hülle',0.42));m.rotation.y=Math.PI/2;m.position.set(-6,0,0);rzu(m,'dach','Hülle');rgRoofG.add(m);
   const sol=bx(rgRoofG,3.2,0.1,1.7,2.4,1.45,2.6,gm('Hülle'));sol.rotation.x=0.47;rzu(sol,'dach','Hülle');
   const rod=new THREE.Mesh(CYLG,gm('Technik'));rod.scale.set(0.05,3,0.05);rod.position.set(-5,2.8,-2.4);rzu(rod,'dach','Technik');rgRoofG.add(rod);
   rzu(bx(rgRoofF,12.4,0.5,9.4,0,0.25,0,gt('Hülle',0.42)),'dach','Hülle');
   const sf=bx(rgRoofF,3.2,0.1,1.7,2.4,0.85,2.6,gm('Hülle'));sf.rotation.x=0.3;rzu(sf,'dach','Hülle');
   const rf=new THREE.Mesh(CYLG,gm('Technik'));rf.scale.set(0.05,3,0.05);rf.position.set(-5,2,-2.4);rzu(rf,'dach','Technik');rgRoofF.add(rf);}
  const bwSlab=bx(bg,13,1,0.3,0,0,-5.0,gt('Raumabschluss',0.55));bwSlab.userData={rz:'brandwand',grp:'Raumabschluss'};pickX.push(bwSlab);bwSlab.visible=false;
  const rgOut=new THREE.Group();scene.add(rgOut);rgOut.visible=false;
  {const asph=lm(0x4b5262),red=lm(0xd8382a),wht=lm(0xeef1f6),drk=lm(0x1b1f2a);
   const addO=(rz,grp,w,h,d,x,y,z,mat)=>{const m=bx(rgOut,w,h,d,x,y,z,mat||gm(grp));m.userData={rz,grp};pickX.push(m);return m;};
   addO('aufstellflaeche','Rettungsweg',18,0.4,6.6,0,-0.2,7.8,asph);
   addO('aufstellflaeche','Rettungsweg',17.4,0.02,0.18,0,0.03,10.9);addO('aufstellflaeche','Rettungsweg',17.4,0.02,0.18,0,0.03,5.0);
   addO('aufstellflaeche','Rettungsweg',4.4,1.4,1.9,-3.2,1.0,8.6,red);addO('aufstellflaeche','Rettungsweg',1.6,1.3,1.9,-6.2,0.95,8.6,wht);
   [-6.4,-4.6,-1.8].forEach(x=>[7.6,9.6].forEach(z=>{const w=new THREE.Mesh(CYLG,drk);w.scale.set(0.45,0.3,0.45);w.rotation.x=Math.PI/2;w.position.set(x,0.45,z);rzu(w,'aufstellflaeche','Rettungsweg');rgOut.add(w);}));
   addO('aufstellflaeche','Rettungsweg',3.6,0.18,0.5,-3.2,1.8,8.6,wht);
   const P0=V3(-3.2,1.9,8.3),P1=V3(-3.2,6.4,4.7),len=P0.distanceTo(P1);
   const lad=bx(rgOut,0.5,0.14,len,(P0.x+P1.x)/2,(P0.y+P1.y)/2,(P0.z+P1.z)/2,gm('Rettungsweg'));lad.lookAt(P1);lad.userData={rz:'rettungsweg',grp:'Rettungsweg'};pickX.push(lad);}
  /* Hoehenmarken */
  const zg=new THREE.Group();bg.add(zg);
  const frameM=new THREE.MeshBasicMaterial({color:0xdfe9ff,transparent:true,opacity:0.7});
  function rimFrame(par,y,t,mat){const g=new THREE.Group();g.position.y=y;par.add(g);const W2=14,D2=11.4;
    bx(g,W2,t,t,0,0,D2/2,mat);bx(g,W2,t,t,0,0,-D2/2,mat);bx(g,t,t,D2,-W2/2,0,0,mat);bx(g,t,t,D2,W2/2,0,0,mat);return g;}
  [7,13,22].forEach(y=>rimFrame(zg,y,0.1,frameM));
  const okM=new THREE.MeshBasicMaterial({color:0xffa412});const okF=rimFrame(bg,0,0.2,okM);
  /* Auswahl-Kontur */
  const selLine=new THREE.LineSegments(new THREE.EdgesGeometry(BOXG),new THREE.LineBasicMaterial({color:0xffffff}));selLine.visible=false;
  /* ---------- Labels (HTML) ---------- */
  const lbls=document.createElement('div');lbls.className='lbls';host.appendChild(lbls);
  const mkLab=cls=>{const d=document.createElement('div');d.className='lab '+cls;lbls.appendChild(d);return d;};
  const L={z7:mkLab('zl'),z13:mkLab('zl'),z22:mkLab('zl'),ok:mkLab('okl'),badge:mkLab('badge'),bw:mkLab('bwl')};
  L.z7.textContent='7 m';L.z13.textContent='13 m';L.z22.textContent='22 m';
  L.pin=mkLab('pinl');
  const tv=V3(0,0,0);
  /* ---------- Marker fuer alle Katalog-Bauteile (Sprites, einmal angelegt) ---------- */
  const pinG=new THREE.Group();scene.add(pinG);pinG.visible=false;
  function mkTex(col,ring){const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');
    if(ring){g.lineWidth=8;g.strokeStyle='#ffffff';g.beginPath();g.arc(48,48,40,0,6.2832);g.stroke();}
    else{g.fillStyle='rgba(8,14,26,.6)';g.beginPath();g.arc(48,51,44,0,6.2832);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(48,48,42,0,6.2832);g.fill();g.fillStyle=col;g.beginPath();g.arc(48,48,33,0,6.2832);g.fill();g.fillStyle='rgba(255,255,255,.92)';g.beginPath();g.arc(48,48,9,0,6.2832);g.fill();}
    return new THREE.CanvasTexture(c);}
  const pinMat={};GR.forEach(g=>{pinMat[g.k]=new THREE.SpriteMaterial({map:mkTex(g.c),depthTest:false,transparent:true});});
  const haloS=new THREE.Sprite(new THREE.SpriteMaterial({map:mkTex('#fff',true),depthTest:false,transparent:true}));haloS.scale.set(2.1,2.1,1);haloS.renderOrder=19;haloS.visible=false;pinG.add(haloS);
  const pins=KT.map(b=>{const P=PINPOS[b.id]||PINDEF;const s=new THREE.Sprite(pinMat[b.gruppe]);s.scale.set(0.95,0.95,1);s.renderOrder=20;pinG.add(s);return {id:b.id,b,grp:b.gruppe,fl:P[0],x:P[1],y:P[2],z:P[3],s,k:0.95};});
  const pinBy={};pins.forEach(pn=>{pinBy[pn.id]=pn;});
  let lastPinLab='';
  function baseY(fl,nf){if(fl==='g')return floors[0].g.position.y;if(fl==='m')return floors[Math.min(1,nf-1)].g.position.y;if(fl==='t')return floors[nf-1].g.position.y;if(fl==='k')return -3;if(fl==='r')return C.topY;return 0;}
  function layoutPins(){const on=T.rg&&T.mode==='sec';pinG.visible=on;if(!on)return;
    const nf=nFloors(T.p.okff),sx=bg.scale.x,sp=T.selId?pinBy[T.selId]:null;
    pins.forEach(pn=>{const s=pn.s;s.visible=T.layers[pn.grp]!==false;s.position.set(pn.fl==='o'?pn.x:pn.x*sx,baseY(pn.fl,nf)+pn.y,pn.z);
      const k=pn===sp?1.6:0.95;if(k!==pn.k){pn.k=k;s.scale.set(k,k,1);}});
    haloS.visible=!!sp&&sp.s.visible;if(sp)haloS.position.copy(sp.s.position);}
  function placeW(el,v,off){tv.copy(v).project(camera);
    if(tv.z>1||tv.z<-1||!el._on){el.style.display='none';return;}
    const w=host.clientWidth,h=host.clientHeight;el.style.display='';const hw=(el.offsetWidth||60)/2+6;
    el.style.transform='translate('+clamp((tv.x*0.5+0.5)*w+(off?off[0]:0),hw,w-hw).toFixed(1)+'px,'+clamp((-tv.y*0.5+0.5)*h+(off?off[1]:0),(el.offsetHeight||24)+4,h-4).toFixed(1)+'px) translate(-50%,-100%)';}
  function place(el,x,y,z,off){tv.set(x,y,z);bg.localToWorld(tv);tv.project(camera);
    if(tv.z>1||tv.z<-1||!el._on){el.style.display='none';return;}
    const w=host.clientWidth,h=host.clientHeight;el.style.display='';const hw=(el.offsetWidth||60)/2+6;
    el.style.transform='translate('+clamp((tv.x*0.5+0.5)*w+(off?off[0]:0),hw,w-hw).toFixed(1)+'px,'+((-tv.y*0.5+0.5)*h+(off?off[1]:0)).toFixed(1)+'px) translate(-50%,-100%)';}
  /* ---------- Zustand ---------- */
  const T={p:{okff:6,free:true,nne:1,ane:true,land:false},mode:'ext',color:null,label:null,gk:'1a',focus:null,bw:false,sel:null,rulers:true,dgar:true,rg:false,layers:Object.assign({},LAYERS0),colorBy:'grp',selId:null};
  const C={W:12,gap:7,ok:6,viewH:16,col:new THREE.Color(0xc5ccd8),trimCol:new THREE.Color(0xe8ecf2),topY:3,sec:0,fw:0,fx:0,fy:0,fz:0,tx:0,ty:8};
  const cam={theta:0.3,phi:1.22,zoom:1},goal={theta:0.3,phi:1.22,zoom:1,focus:null};let flying=false;
  let dirty=true,asp=1,lastBadge='',lastNE='';
  function setSize(){const w=host.clientWidth||300,h=host.clientHeight||300;renderer.setSize(w,h,false);camera.aspect=w/h;asp=w/h;camera.updateProjectionMatrix();dirty=true;}
  const ro=new ResizeObserver(setSize);ro.observe(host);setSize();
  /* Abschnitt-Faerbung */
  function refreshSec(){select(null);
    const gk=T.gk,sec=T.mode==='sec',rg=T.rg&&sec,byReq=T.colorBy==='req';
    const fm2=p=>!T.focus||(T.focus==='wand'?(p==='wand'||p==='trenn'||p==='brand'):T.focus==='decke'?(p==='decke'||p==='dach'):T.focus===p);
    DGAR=T.dgar!==false;
    structMeshes.forEach(m=>{const u=m.userData;if(u.stair){m.visible=sec;return;}
      let part=u.part;if(u.left&&T.bw)part='brand';
      const dim=!fm2(part),req=reqFor(gk,part,u.zone);u.eff=part;u.dim=dim;
      m.material=(rg&&!byReq)?gm(u.grp):secMat(req,dim,part);if(u.edge)u.edge.visible=!dim;
      m.visible=rg?T.layers[u.grp]!==false:(part==='trenn'?T.p.nne>=2:true);});
    pickX.forEach(m=>{m.visible=T.layers[m.userData.grp]!==false;});
    bwSlab.visible=rg&&T.layers.Raumabschluss!==false&&!T.bw;
    layoutPins();dirty=true;
  }
  function refreshNE(){const n=T.p.nne;const key=n+'';if(key===lastNE)return;lastNE=key;
    floors.forEach(F=>{F.win.forEach((w,c)=>{if(w)w.material=glass[Math.floor(c*n/5)];});
      F.seps.forEach((s,i)=>{s.visible=Math.floor(i*n/5)!==Math.floor((i+1)*n/5);});});}
  function targetColor(){return T.color?new THREE.Color(T.color).lerp(new THREE.Color(0xffffff),0.18):neutralC;}
  /* ---------- Kamera ---------- */
  function viewInfo(){const sec=T.mode==='sec';
    const tanH=Math.tan(camera.fov*Math.PI/360);
    const H=C.viewH,bot=sec?-4.2:0,ext=(H-bot)*1.08;
    const rv=(ext/2)/tanH*1.32;
    const halfW=sec?(C.W/2+(asp<1?3:5)):(C.W/2+(asp<1?6.5:13));
    const rh=halfW/(tanH*asp)*1.05;
    return {r:Math.max(rv,rh),cy:(H+bot)/2};}
  function applyCam(){
    const vi=viewInfo(),r=vi.r*cam.zoom;
    const fw=C.fw,tx=C.fx*fw,ty=vi.cy*(1-fw)+C.fy*fw,tz=C.fz*fw;
    camera.position.set(tx+r*Math.sin(cam.phi)*Math.sin(cam.theta),ty+r*Math.cos(cam.phi),tz+r*Math.sin(cam.phi)*Math.cos(cam.theta));
    camera.lookAt(tx,ty,tz);camera.updateMatrixWorld();}
  function fly(g){Object.assign(goal,g);flying=true;dirty=true;}
  /* ---------- Eingabe ---------- */
  canvas.style.touchAction='none';
  const ptrs=new Map();let pinch0=0,zoom0=1,moved=0,t0=0;
  const limTheta=()=>T.mode==='sec'?1.3:3.2;
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptrs.size===1){moved=0;t0=performance.now();}
    if(ptrs.size===2){const a=[...ptrs.values()];pinch0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);zoom0=cam.zoom;moved=99;}});
  canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;
    if(ptrs.size===1){const dx=e.clientX-p.x,dy=e.clientY-p.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6){flying=false;cam.theta=clamp(cam.theta-dx*0.0075,-limTheta(),limTheta());cam.phi=clamp(cam.phi-dy*0.005,0.5,1.62);goal.theta=cam.theta;goal.phi=cam.phi;dirty=true;}}
    p.x=e.clientX;p.y=e.clientY;
    if(ptrs.size===2){const a=[...ptrs.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);flying=false;cam.zoom=clamp(zoom0*pinch0/Math.max(d,1),0.2,1.5);goal.zoom=cam.zoom;dirty=true;}});
  const up=e=>{const had=ptrs.has(e.pointerId);ptrs.delete(e.pointerId);
    if(had&&e.type==='pointerup'&&ptrs.size===0&&moved<=6&&performance.now()-t0<600)tap(e.clientX,e.clientY);if(ptrs.size===0)moved=0;};
  canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',e=>{e.preventDefault();flying=false;cam.zoom=clamp(cam.zoom*Math.exp(e.deltaY*0.0012),0.2,1.5);goal.zoom=cam.zoom;dirty=true;},{passive:false});
  const ray=new THREE.Raycaster(),mp=new THREE.Vector2();
  function deepVis(o){while(o){if(!o.visible)return false;o=o.parent;}return true;}
  function tap(cx,cy){if(T.mode!=='sec'){cb.onPick&&cb.onPick(null);return;}
    const r=canvas.getBoundingClientRect();
    if(T.rg){
      let best=null,bd=34*34;
      pins.forEach(pn=>{if(!pn.s.visible)return;tv.copy(pn.s.position).project(camera);if(tv.z>1)return;
        const dx=(tv.x*0.5+0.5)*r.width+r.left-cx,dy=(-tv.y*0.5+0.5)*r.height+r.top-cy,d=dx*dx+dy*dy;if(d<bd){bd=d;best=pn;}});
      if(best){select(null);cb.onPick&&cb.onPick({id:best.id});return;}
      mp.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(mp,camera);
      const hit=ray.intersectObjects(structMeshes.concat(pickX).filter(m=>!m.userData.noPick&&m.userData.rz&&deepVis(m)),false);
      if(hit.length){const m=hit[0].object;select(m);cb.onPick&&cb.onPick({zone:m.userData.rz});}
      else{select(null);cb.onPick&&cb.onPick(null);}
      return;}
    mp.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(mp,camera);
    const list=structMeshes.filter(m=>!m.userData.noPick&&!m.userData.dim&&deepVis(m));
    const hit=ray.intersectObjects(list,false);
    if(hit.length){const m=hit[0].object,u=m.userData;select(m);cb.onPick&&cb.onPick({part:u.eff||u.part,zone:u.zone});}
    else{select(null);cb.onPick&&cb.onPick(null);}}
  let selMesh=null,selBase=null;const hiM={};
  function select(m){if(selMesh){selMesh.remove(selLine);selLine.visible=false;selMesh.material=selBase;selMesh=null;selBase=null;}
    if(m){selMesh=m;selBase=m.material;const k=selBase.uuid;if(!hiM[k])hiM[k]=new THREE.MeshLambertMaterial({color:selBase.color.clone().lerp(new THREE.Color(0xffffff),0.45),emissive:selBase.color.clone().multiplyScalar(0.35)});m.material=hiM[k];m.add(selLine);selLine.visible=true;}
    dirty=true;}
  /* ---------- Frame ---------- */
  let last=performance.now(),raf=0,lastR=0,time=0;
  const ease=(dt,k)=>1-Math.exp(-dt*k);
  function lerpTo(o,k,t,e,dt,sp){const d=t-o[k];if(Math.abs(d)<(e||0.002)){if(o[k]!==t){o[k]=t;dirty=true;}return;}o[k]+=d*ease(dt,sp||9);dirty=true;}
  function frame(now){
    raf=requestAnimationFrame(frame);
    const nw=performance.now();const dt=Math.min(0.1,Math.max(1/120,(nw-last)/1000));last=nw;time+=dt;
    const sec=T.mode==='sec',p=T.p;
    // Stockwerke
    const nf=nFloors(p.okff);let y=0;
    floors.forEach((F,i)=>{const tg=i<nf?1:0;const d=tg-F.G;if(Math.abs(d)<0.004){F.G=tg;}else{F.G+=d*ease(dt,8);dirty=true;}
      F.g.visible=F.G>0.004;F.g.scale.y=Math.max(F.G,0.001);F.g.position.y=y;y+=F.G*FH;
      F.shell.visible=!sec;F.st.visible=sec;F.ex.visible=sec&&T.rg;});
    const topY=y;C.topY=topY;
    kel.visible=sec;plinth.visible=sec;env.visible=!sec;kelEx.visible=sec&&T.rg;rgOut.visible=sec&&T.rg;roofRG.visible=sec&&T.rg;
    roofG.position.y=topY;const hh=p.okff>22;
    gable.visible=!hh;flat.visible=hh;roofShell.visible=!sec;roofStruct.visible=sec;
    bwG.visible=sec&&T.bw;bwG.userData.gableMesh.visible=!hh;bwG.userData.flatMesh.visible=hh;rgRoofG.visible=!hh;rgRoofF.visible=hh;bwSlab.scale.y=topY+3.3;bwSlab.position.y=-3+(topY+3.3)/2;
    // Breite, Nachbarn
    lerpTo(C,'W',p.ane?12:16,0.01,dt,7);bg.scale.x=C.W/12;
    lerpTo(C,'gap',p.free?7:0.02,0.01,dt,6);
    nbL.position.set(-(C.W/2+C.gap+4.5),0,0);nbR.position.set(C.W/2+9.5,0,0);nbR.visible=!p.land;farm.visible=p.land;farm.position.set(C.W/2+7,0,-3);
    // Farbe
    const tc=targetColor();if(Math.abs(C.col.r-tc.r)+Math.abs(C.col.g-tc.g)+Math.abs(C.col.b-tc.b)>0.004){C.col.lerp(tc,ease(dt,8));dirty=true;}else C.col.copy(tc);
    wallM.color.copy(C.col);trimM.color.copy(C.col).lerp(new THREE.Color(0xffffff),0.55);
    refreshNE();
    // OKFF-Marke und Hoehenrahmen
    lerpTo(C,'ok',p.okff,0.005,dt,10);okF.position.y=C.ok+0.1;okF.visible=!sec&&T.rulers;zg.visible=!sec&&T.rulers;
    // Kamerahoehe
    lerpTo(C,'viewH',sec?Math.max(7,topY+3.4):Math.max(16,topY+3.4+(hh?4:0)),0.01,dt,5);
    // Fokus
    const fwT=goal.focus?1:0;if(goal.focus){C.fx=goal.focus.x;C.fy=goal.focus.y;C.fz=goal.focus.z;}
    if(sec&&goal.focus&&T.bw&&goal.focus.roof){C.fy=topY+goal.focus.y;}
    lerpTo(C,'fw',fwT,0.005,dt,5);
    // Kamera
    if(flying){let still=true;['theta','phi','zoom'].forEach(k=>{const d=goal[k]-cam[k];if(Math.abs(d)>0.002){cam[k]+=d*ease(dt,5);still=false;}else cam[k]=goal[k];});if(still)flying=false;dirty=true;}
    // Zeichnen nur bei Aenderung
    if(!dirty)return;
    if(now-lastR<30)return;
    lastR=now;dirty=false;
    layoutPins();
    const lt=sec?null:T.label;
    const badge=L.badge;
    if(lt){const k=lt.text+'|'+lt.sub+'|'+lt.color;if(k!==lastBadge){lastBadge=k;badge.innerHTML='<b>'+lt.text+'</b>'+(lt.sub?'<span>'+lt.sub+'</span>':'');badge.style.background=lt.color;badge.style.color=lt.dark?'#1a1a1a':'#fff';}}
    badge._on=!!lt;
    applyCam();
    const rz=!sec&&T.rulers;
    [['z7',7],['z13',13],['z22',22]].forEach(a=>{L[a[0]]._on=rz;place(L[a[0]],6.9,a[1],5.9,[8,0]);});
    L.ok._on=rz;L.ok.textContent='OKFF '+fm(p.okff)+' m';place(L.ok,-7.1,C.ok+0.1,5.9,[-6,0]);
    place(badge,0,topY+(hh?7:4.2),0,[0,0]);
    L.bw._on=sec&&T.bw;L.bw.innerHTML='<b>0,30 m</b> über Bedachung<br>REI 90-M (F 90-A)';place(L.bw,-6,topY+(hh?1.2:3.4),0,[0,-10]);
    const sp=T.rg&&sec&&T.selId?pinBy[T.selId]:null;
    L.pin._on=!!sp&&sp.s.visible;
    if(sp){if(lastPinLab!==sp.id){lastPinLab=sp.id;L.pin.textContent=sp.b.name;L.pin.style.borderColor=GCOL[sp.grp];}placeW(L.pin,sp.s.position,[0,-26]);}else L.pin.style.display='none';
    renderer.render(scene,camera);
  }
  floors.forEach((F,i)=>{F.G=i<nFloors(T.p.okff)?1:0;});
  raf=requestAnimationFrame(frame);
  refreshSec();
  return {
    set(patch){const needSec=('gk' in patch)||('dgar' in patch)||('focus' in patch)||('bw' in patch)||('mode' in patch)||('rg' in patch)||('layers' in patch)||('colorBy' in patch)||(patch.p&&patch.p.nne!==T.p.nne);
      if(patch.p)patch=Object.assign({},patch,{p:Object.assign({},T.p,patch.p)});
      if('mode' in patch&&patch.mode!==T.mode)select(null);
      Object.assign(T,patch);if(needSec)refreshSec();dirty=true;},
    fly,
    focusItem(id){const pn=pinBy[id];if(!pn)return;layoutPins();const v=pn.s.position;
      fly({theta:-0.4,phi:1.2,zoom:pn.fl==='o'?0.95:0.8,focus:{x:v.x,y:v.y,z:v.z}});},
    pinInfo(){const nf=nFloors(T.p.okff);return pins.map(pn=>({id:pn.id,fl:pn.fl,x:pn.x,y:pn.y,z:pn.z,by:baseY(pn.fl,nf),sx:pn.fl==='o'?1:bg.scale.x}));},
    proj(x,y,z){const r=canvas.getBoundingClientRect();tv.set(x,y,z).project(camera);return [(tv.x*0.5+0.5)*r.width,(-tv.y*0.5+0.5)*r.height];},
    pinScreen(){const r=canvas.getBoundingClientRect();return pins.filter(pn=>pn.s.visible).map(pn=>{tv.copy(pn.s.position).project(camera);return {id:pn.id,x:(tv.x*0.5+0.5)*r.width,y:(-tv.y*0.5+0.5)*r.height};});},
    reset(){fly({theta:T.mode==='sec'?-0.4:0.3,phi:1.22,zoom:T.rg&&T.mode==='sec'?1.12:1,focus:null});},
    clearSel(){select(null);},
    dispose(){cancelAnimationFrame(raf);ro.disconnect();renderer.dispose();lbls.remove();},
    cam,snapshotReady:()=>true
  };
}
/* ===== Oberflaeche (React) ===== */
const h=React.createElement;
const {useState,useEffect,useRef,useMemo,useCallback}=React;
const css=`
:root{--bg:#0d1522;--pn:var(--card,#162132);--pn2:var(--soft,#1d2b40);--pn3:var(--line,#243550);--tx:var(--ink,#eef2f8);--mu:var(--mute,#9aa8bd);--ac:var(--or,#ffa412);--ok:#35d07f;--bad:#ff6a4d;--ln:var(--line,rgba(255,255,255,.09))}
body{background:var(--bg);color:var(--tx);-webkit-tap-highlight-color:transparent}
button{font-family:inherit}
.app{display:flex;flex-direction:column;height:100%;height:100dvh}
.stage{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;background:var(--bg)}
.stage.sec{background:var(--bg)}
.stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.stage canvas:active{cursor:grabbing}
.lbls{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2}
.lab{position:absolute;left:0;top:0;white-space:nowrap;will-change:transform}
.zl{font:700 11px/1 inherit;color:#fff;background:rgba(13,21,34,.62);border-radius:7px;padding:3px 6px;border:1px solid rgba(255,255,255,.35)}
.okl{font:800 12px/1 inherit;color:#241503;background:var(--ac);border-radius:8px;padding:4px 8px;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.badge{border-radius:14px;padding:6px 14px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.4);border:2px solid rgba(255,255,255,.7)}
.badge b{display:block;font-size:22px;line-height:1.1;letter-spacing:.2px}
.badge span{display:block;font-size:11px;font-weight:700;opacity:.9}
.bwl{font:600 12px/1.25 inherit;color:#fff;background:rgba(176,36,110,.92);border-radius:9px;padding:5px 9px;border:1px solid #fff8;text-align:center}
.panel{flex:0 0 auto;height:49%;display:flex;flex-direction:column;background:var(--pn);border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.35);position:relative;z-index:3}
.pbody{flex:1;overflow:auto;padding:12px 14px 10px;-webkit-overflow-scrolling:touch}
.tabs{order:2;display:flex;gap:6px;padding:6px 10px calc(6px + env(safe-area-inset-bottom));border-top:1px solid var(--ln)}
.tab{flex:1;min-height:50px;border:0;border-radius:14px;background:transparent;color:var(--mu);font:700 12.5px/1.1 inherit;font-family:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer}
.tab svg{width:22px;height:22px}
.tab.on{background:rgba(255,164,18,.16);color:var(--ac)}
@media(min-width:900px){
 .app{flex-direction:row}
 .panel{height:100%;width:440px;border-radius:0;order:2;box-shadow:-10px 0 30px rgba(0,0,0,.3)}
 .tabs{order:0;border-top:0;border-bottom:1px solid var(--ln);padding:12px}
 .tab{flex-direction:row;gap:8px;font-size:14px}
 .pbody{padding:16px 20px}
}
h2{margin:0 0 6px;font-size:18px;line-height:1.2}
h3{margin:14px 0 8px;font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:var(--mu)}
p{margin:0 0 9px;line-height:1.45;font-size:14.5px}
.mu{color:var(--mu)}
.card{background:var(--pn2);border-radius:16px;padding:12px 14px;margin-bottom:10px;border:1px solid var(--ln)}
.btn{min-height:46px;border-radius:14px;border:0;font:700 15px inherit;font-family:inherit;padding:0 18px;cursor:pointer;background:var(--ac);color:#241503}
.btn.sec{background:var(--pn3);color:var(--tx);border:1px solid var(--ln)}
.btn.big{width:100%;min-height:50px;font-size:16px}
.topr{position:absolute;right:10px;top:10px;display:flex;gap:6px;z-index:4}
.ibtn{min-width:44px;height:44px;border-radius:12px;border:0;background:rgba(13,21,34,.7);color:#fff;font:700 13px inherit;font-family:inherit;padding:0 12px;cursor:pointer;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;gap:6px}
.ibtn svg{width:20px;height:20px}
.hint{position:absolute;left:50%;transform:translateX(-50%);bottom:8px;width:max-content;max-width:calc(100% - 20px);text-align:center;font-size:11.5px;color:#e7edf7;pointer-events:none;z-index:4;background:rgba(13,21,34,.62);border-radius:10px;padding:4px 10px;line-height:1.3}
.slegend{position:absolute;left:10px;top:10px;right:64px;display:flex;flex-wrap:wrap;gap:5px;z-index:4;pointer-events:none}
.sl{display:flex;align-items:center;gap:6px;color:#fff;background:rgba(13,21,34,.78);border-radius:9px;padding:4px 8px;font-size:11.5px;font-weight:700;backdrop-filter:blur(4px)}
.sl i{width:12px;height:12px;border-radius:4px;display:block}
.seg{display:flex;background:var(--pn2);border-radius:14px;padding:4px;gap:4px;margin-bottom:8px;border:1px solid var(--ln)}
.seg button{flex:1;min-height:44px;border:0;border-radius:11px;background:transparent;color:var(--mu);font:700 14px inherit;font-family:inherit;cursor:pointer;padding:0 6px}
.seg button.on{background:var(--ac);color:#241503}
.seg.sm button{min-height:40px;font-size:13px}
.ctl{background:var(--pn2);border-radius:16px;padding:10px 14px;margin-bottom:9px;border:1px solid var(--ln)}
.ctl .hd{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.ctl .hd b{font-size:14px}.ctl .hd span{font-size:12px;color:var(--mu)}
.ctl .val{font-size:22px;font-weight:800;color:var(--ac)}
.rng{position:relative;margin:6px 0 0}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:44px;background:transparent;margin:0;cursor:pointer;display:block;touch-action:pan-y}
input[type=range]::-webkit-slider-runnable-track{height:10px;border-radius:5px;background:linear-gradient(90deg,var(--ac) 0,var(--ac) var(--pct),#3a4a63 var(--pct),#3a4a63 100%)}
input[type=range]::-moz-range-track{height:10px;border-radius:5px;background:#3a4a63}
input[type=range]::-moz-range-progress{height:10px;border-radius:5px;background:var(--ac)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:32px;height:32px;border-radius:50%;background:#fff;border:4px solid var(--ac);margin-top:-11px;box-shadow:0 2px 8px rgba(0,0,0,.4)}
input[type=range]::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#fff;border:4px solid var(--ac)}
.ticks{position:relative;height:16px;margin:-8px 16px 2px 16px;pointer-events:none}
.ticks i{position:absolute;top:0;transform:translateX(-50%);font:700 11px/1 inherit;color:var(--mu);font-style:normal;text-align:center}
.ticks i:before{content:"";display:block;width:2px;height:6px;background:var(--mu);margin:0 auto 2px;opacity:.7}
.stp{display:flex;gap:10px;align-items:center;padding:7px 0;position:relative}
.stp .no{flex:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;background:var(--pn3);color:var(--mu);z-index:1;transition:all .25s}
.stp .tx{flex:1;min-width:0}.stp .tx b{display:block;font-size:14px;line-height:1.25}.stp .tx span{font-size:12px;color:var(--mu)}
.stp .yn{flex:none;min-width:48px;text-align:center;border-radius:9px;padding:5px 8px;font-weight:800;font-size:13px}
.stp.vis .no{background:var(--ac);color:#241503}
.stp.vis .yn.y{background:rgba(53,208,127,.2);color:#6ff0a8}.stp.vis .yn.n{background:rgba(255,106,77,.18);color:#ff9d88}
.stp.skip{opacity:.38}.stp.skip .tx b{font-weight:600}
.stp:not(:last-child):before{content:"";position:absolute;left:14px;top:34px;bottom:-8px;width:2px;background:var(--pn3)}
.stp.vis:not(:last-child):before{background:var(--ac)}
.res{display:flex;align-items:center;gap:12px;border-radius:16px;padding:10px 12px;margin-bottom:10px;border:2px solid var(--c);background:var(--pn2);transition:border-color .3s}
.res .gb{flex:none;min-width:84px;text-align:center;border-radius:12px;padding:8px 6px;font-weight:800;font-size:22px;line-height:1.1;background:var(--c);color:#fff;transition:background .3s}
.res .gb.dk{color:#1a1a1a}
.res .gt{flex:1;min-width:0}.res .gt b{display:block;font-size:15.5px}.res .gt span{font-size:12.5px;color:var(--mu);line-height:1.3;display:block;margin-top:2px}
.sw{display:flex;align-items:center;gap:12px;min-height:50px;padding:4px 0;cursor:pointer}
.sw .t{flex:1}.sw .t b{display:block;font-size:14px}.sw .t span{font-size:12px;color:var(--mu)}
.tg{width:50px;height:28px;border-radius:14px;background:#3a4a63;position:relative;flex:none;transition:background .2s}
.tg:after{content:"";position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}
.tg.on{background:var(--ok)}.tg.on:after{transform:translateX(22px)}
.stepper{display:flex;align-items:center;gap:10px}
.stepper button{width:48px;height:48px;border-radius:14px;border:0;background:var(--pn3);color:#fff;font:700 26px inherit;cursor:pointer;line-height:1}
.stepper button:disabled{opacity:.35}
.stepper .n{min-width:30px;text-align:center;font-size:24px;font-weight:800}
.nes{display:flex;gap:5px;flex:1;justify-content:flex-end}
.nes i{width:22px;height:22px;border-radius:6px;display:block;transition:all .2s;border:2px solid rgba(255,255,255,.5)}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chp{min-height:44px;border-radius:12px;border:2px solid var(--c,var(--ln));background:var(--pn2);color:var(--tx);font:700 13.5px inherit;font-family:inherit;padding:0 12px;cursor:pointer;display:flex;align-items:center;gap:7px}
.chp i{width:12px;height:12px;border-radius:4px;background:var(--c);display:block}
.chp.on{background:var(--c);color:#fff;box-shadow:0 0 0 2px #fff6}.chp.on i{background:#fff}
.chp.on.dk{color:#1a1a1a}
.chp.f{--c:var(--ln)}.chp.f.on{background:var(--ac);color:#241503;border-color:var(--ac);box-shadow:none}
.tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px}
.tile{flex:1;border-radius:14px;padding:9px 8px;text-align:center;color:#fff;min-width:0;border:1px solid #fff3}
.tile small{display:block;font-size:11px;font-weight:700;opacity:.92;line-height:1.15}
.tile b{display:block;font-size:19px;line-height:1.2;margin-top:2px}
.tile.dk{color:#1a1a1a}
.msg{border-radius:14px;padding:10px 13px;font-weight:600;margin:0 0 10px;font-size:14px;line-height:1.35}
.msg.g{background:rgba(53,208,127,.16);color:#7af2b0;border:1px solid rgba(53,208,127,.45)}
.msg.r{background:rgba(255,106,77,.15);color:#ffa593;border:1px solid rgba(255,106,77,.45)}
.msg.o{background:rgba(255,164,18,.14);color:#ffc462;border:1px solid rgba(255,164,18,.4)}
.msg.n{background:var(--pn2);color:var(--mu);border:1px solid var(--ln);font-weight:500}
.opts{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:10px 0}
.opt{min-height:52px;border-radius:14px;border:2px solid var(--ln);background:var(--pn2);color:var(--tx);font:700 14.5px/1.2 inherit;font-family:inherit;cursor:pointer;padding:6px 10px;display:flex;align-items:center;justify-content:center;gap:8px;text-align:center}
.opt i{width:14px;height:14px;border-radius:5px;display:block;flex:none}
.opt.ok{border-color:var(--ok);background:rgba(53,208,127,.2)}
.opt.bad{border-color:var(--bad);background:rgba(255,106,77,.2)}
.opt:disabled{cursor:default;opacity:.8}
.opt.w1{grid-column:1/-1}
.prog{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.dots{display:flex;gap:6px;flex:1}.dot{flex:1;height:10px;border-radius:5px;background:#34445d;max-width:34px}.dot.now{background:var(--ac)}.dot.ok{background:var(--ok)}.dot.bad{background:var(--bad)}
.stars{display:flex;gap:6px;justify-content:center;margin:4px 0 8px}
.stars svg{width:52px;height:52px}
.rev{display:flex;gap:8px;align-items:flex-start;font-size:13px;padding:6px 0;border-bottom:1px solid var(--ln)}
.rev:last-child{border:0}.rev b{flex:none;width:22px;text-align:center}
.ok{color:var(--ok)}.bd{color:var(--bad)}
.detail{display:flex;gap:8px;margin-top:6px}
.detail>div{flex:1;background:var(--pn);border-radius:10px;padding:6px 8px;font-size:11.5px;color:var(--mu);text-align:center}
.detail svg{width:100%;height:auto;display:block;margin-bottom:3px}
b{font-weight:700}
`;
const COLTXT=c=>({'1a':1,'1b':1,'2':1}[c]?'dk':'');
function B(txt){return String(txt).split('**').map((s,i)=>i%2?h('b',{key:i},s):s);}
const SV=(p,ch)=>h('svg',Object.assign({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},p),ch);
const ICON={
 bau:SV({},[h('path',{key:1,d:'M3 21V9l7-5 7 5v12'}),h('path',{key:2,d:'M17 21V12h4v9M7 21v-5h4v5M7 11h.01M12 11h.01'})]),
 rg:SV({},[h('path',{key:1,d:'M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z'}),h('circle',{key:2,cx:12,cy:10.5,r:2.4})]),
 quiz:SV({},[h('circle',{key:1,cx:12,cy:12,r:9}),h('path',{key:2,d:'M8.5 12.5l2.5 2.5 4.5-5'})]),
 matrix:SV({},[h('rect',{key:1,x:3,y:4,width:18,height:16,rx:2}),h('path',{key:2,d:'M3 10h18M3 15h18M9 4v16M15 4v16'})]),
 reset:SV({},[h('path',{key:1,d:'M3 12a9 9 0 1 0 3-6.7'}),h('path',{key:2,d:'M3 4v5h5'})])};
function Star({on}){return h('svg',{viewBox:'0 0 24 24'},h('path',{d:'M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z',fill:on?'#ffc83d':'#2c3a50',stroke:on?'#ffa412':'#3a4a63',strokeWidth:1.2,strokeLinejoin:'round'}));}
function useWide(){const [w,s]=useState(()=>window.matchMedia('(min-width:900px)').matches);
  useEffect(()=>{const m=window.matchMedia('(min-width:900px)'),f=()=>s(m.matches);m.addEventListener?m.addEventListener('change',f):m.addListener(f);return()=>{m.removeEventListener?m.removeEventListener('change',f):m.removeListener(f);};},[]);return w;}
function Switch({on,onChange,t,d}){return h('div',{className:'sw',role:'switch','aria-checked':on,tabIndex:0,onClick:()=>onChange(!on),onKeyDown:e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();onChange(!on);}}},
  h('div',{className:'t'},h('b',null,t),d?h('span',null,d):null),h('div',{className:'tg'+(on?' on':'')}));}
const NEC=['#ffe39a','#9fe0ff','#ffb3c7','#b9f0a8','#d2b6ff'];
const PRESETS=[
 {k:'1',n:'GK 1',gk:'1a',c:GKS['1a'].c,p:{okff:6,free:true,nne:1,ane:true,land:false}},
 {k:'2',n:'GK 2',gk:'2',c:GKS['2'].c,p:{okff:6,free:false,nne:1,ane:true,land:false}},
 {k:'3',n:'GK 3',gk:'3',c:GKS['3'].c,p:{okff:6,free:true,nne:3,ane:true,land:false}},
 {k:'4',n:'GK 4',gk:'4',c:GKS['4'].c,p:{okff:12,free:true,nne:3,ane:true,land:false}},
 {k:'5',n:'GK 5',gk:'5',c:GKS['5'].c,p:{okff:18,free:true,nne:4,ane:true,land:false}},
 {k:'HH',n:'Hochhaus',gk:'HH',c:GKS['HH'].c,p:{okff:25,free:true,nne:4,ane:true,land:false}}];
const P0={okff:6,free:true,nne:1,ane:true,land:false};

/* ---------- Baukasten ---------- */
function Controls({p,setP,gotoTeile}){
  const set=o=>setP(Object.assign({},p,o));
  const pct=(p.okff/30*100)+'%';
  return h('div',null,
    h('div',{className:'ctl'},
      h('div',{className:'hd'},h('b',null,'Höhe: OKFF oberste NE'),h('span',null,nFloors(p.okff)+' Geschosse')),
      h('div',{className:'val'},fm(p.okff)+' m'),
      h('div',{className:'rng'},h('input',{type:'range',min:0,max:30,step:0.5,value:p.okff,'aria-label':'OKFF in Metern',style:{'--pct':pct},onChange:e=>set({okff:+e.target.value})})),
      h('div',{className:'ticks'},[7,13,22].map(v=>h('i',{key:v,style:{left:(v/30*100)+'%'}},v+' m')))),
    h('div',{className:'ctl'},h('div',{className:'hd'},h('b',null,'Lage des Gebäudes')),
      h('div',{className:'seg',style:{margin:'6px 0 0'}},[[true,'Freistehend'],[false,'Angebaut']].map(a=>h('button',{key:a[1],className:p.free===a[0]?'on':'',onClick:()=>set({free:a[0]})},a[1])))),
    h('div',{className:'ctl'},h('div',{className:'hd'},h('b',null,'Nutzungseinheiten (NE)'),h('span',null,'1 bis 5')),
      h('div',{className:'stepper',style:{marginTop:6}},
        h('button',{disabled:p.nne<=1,'aria-label':'weniger NE',onClick:()=>set({nne:p.nne-1})},'−'),h('div',{className:'n'},p.nne),h('button',{disabled:p.nne>=5,'aria-label':'mehr NE',onClick:()=>set({nne:p.nne+1})},'+'),
        h('div',{className:'nes'},[0,1,2,3,4].map(i=>h('i',{key:i,style:{background:i<p.nne?NEC[i]:'transparent',opacity:i<p.nne?1:.35}}))))),
    h('div',{className:'ctl'},h('div',{className:'hd'},h('b',null,'Fläche der NE (ANE)')),
      h('div',{className:'seg',style:{margin:'6px 0 0'}},[[true,'ANE ≤ 400 m²'],[false,'ANE > 400 m²']].map(a=>h('button',{key:a[1],className:p.ane===a[0]?'on':'',onClick:()=>set({ane:a[0]})},a[1])))),
    h('div',{className:'ctl',style:{padding:'4px 14px'}},h(Switch,{on:p.land,onChange:v=>set({land:v}),t:'Land-/forstwirtschaftlich genutzt',d:'z. B. Scheune, Stall, Silo'})));
}
function PathList({cl,p}){
  const vis={};cl.steps.forEach(s=>vis[s.id]=s);
  const resG=GKS[cl.gk];
  return h('div',null,
    QDEF.map(q=>{const s=vis[q[0]];
      return h('div',{key:q[0],className:'stp '+(s?'vis':'skip')},
        h('div',{className:'no'},q[0]),
        h('div',{className:'tx'},h('b',null,q[1]),h('span',null,s?s.val:'nicht nötig auf diesem Weg')),
        s?h('div',{className:'yn '+(s.a?'y':'n')},s.a?'Ja':'Nein'):null);}),
    h('div',{className:'res',style:{'--c':resG.c,marginTop:8,marginBottom:0}},h('div',{className:'gb '+COLTXT(cl.gk)},resG.n),h('div',{className:'gt'},h('b',null,'Ergebnis'),h('span',null,cl.why))));
}
function BauTab({p,setP,cl,wide,gotoTeile,seg,setSeg}){
  const g=GKS[cl.gk];
  const info={ '1a':'Freistehend, max. 2 NE, ANE ≤ 400 m², OKFF ≤ 7 m','1b':'Freistehend, land-/forstwirtschaftlich genutzt','2':'Nicht freistehend, max. 2 NE, ANE ≤ 400 m², OKFF ≤ 7 m','3':'Sonstige Gebäude mit OKFF ≤ 7 m','4':'OKFF ≤ 13 m, ANE ≤ 400 m², sonstige Gebäude','5':'Sonstige Gebäude, auch unterirdische','HH':'OKFF > 22 m: Sonderbau Nr. 1, MHHR'}[cl.gk];
  const head=h('div',{className:'res',style:{'--c':g.c}},h('div',{className:'gb '+COLTXT(cl.gk)},g.n),h('div',{className:'gt'},h('b',null,g.long),h('span',null,info)));
  const hint=cl.gk==='2'&&!p.free?h('div',{className:'msg o'},'Hinweis: Gebäude GK 1 werden zu GK 2, sobald sie nicht mehr freistehen (z. B. angebaute Garage).'):null;
  const hh=cl.gk==='HH'?h('div',{className:'msg o'},'Prüfreihenfolge: 1. Rechtsgrundlage → 2. Gebäudeklasse → 3. Sonderbautatbestand → 4. Schutzziele.'):null;
  const next=h('button',{className:'btn sec big',style:{marginTop:2},onClick:gotoTeile},'Rundgang durch alle Bauteile →');
  if(wide)return h('div',null,head,hint,hh,h(Controls,{p,setP}),h('h3',null,'Prüfpfad: wie das Ergebnis entsteht'),h(PathList,{cl,p}),h('div',{style:{height:10}}),next);
  return h('div',null,head,hint,hh,
    h('div',{className:'seg sm'},[['regler','Regler'],['pfad','Prüfpfad']].map(a=>h('button',{key:a[0],className:seg===a[0]?'on':'',onClick:()=>setSeg(a[0])},a[1]))),
    seg==='regler'?h(Controls,{p,setP}):h(PathList,{cl,p}),
    seg==='pfad'?next:null);
}
/* ---------- Bauteile ---------- */
function BwDetail(){
  return h('div',{className:'detail'},
    h('div',null,h('svg',{viewBox:'0 0 140 80'},
      h('path',{d:'M4 66 L52 30 M88 30 L136 66',fill:'none',stroke:'#7d89a4',strokeWidth:3}),
      h('path',{d:'M52 80 V22 L56 16 L70 12 L84 16 L88 22 V80',fill:'#b0246e',stroke:'#fff',strokeWidth:1}),
      h('path',{d:'M100 12v18M96 12h8M96 30h8',stroke:'#ffa412',strokeWidth:2,fill:'none'}),
      h('text',{x:106,y:25,fill:'#ffa412',fontSize:13,fontWeight:700},'0,30 m')),
      '0,30 m über Bedachung'),
    h('div',null,h('svg',{viewBox:'0 0 140 80'},
      h('rect',{x:8,y:20,width:44,height:46,fill:'#46536d'}),h('rect',{x:88,y:20,width:44,height:46,fill:'#46536d'}),
      h('rect',{x:52,y:12,width:36,height:62,fill:'#b0246e',stroke:'#fff',strokeWidth:1}),
      h('path',{d:'M44 8 h8 M88 8 h8',stroke:'#ffa412',strokeWidth:2}),
      h('text',{x:24,y:80,fill:'#ffa412',fontSize:12,fontWeight:700},'0,50 m je Seite')),
      'oder 0,50 m beidseitig auskragen'));
}
/* ---------- Rundgang ---------- */
const ink=hex=>{const n=parseInt(hex.slice(1),16);return (((n>>16)&255)*299+((n>>8)&255)*587+(n&255)*114)/1000>150?'#111a2a':'#fff';};
const reqCol=(t,d)=>/hochfeuerbest|feuerbest|REI 90|REI 120|F ?90|F ?120/.test(t)?'#e23b3b':/hochfeuerhemm|REI 60|F ?60/.test(t)?'#ff9f2e':/feuerhemm|REI 30|F ?30/.test(t)?'#f4d03f':/Brandwand/.test(t)?'#b0246e':d;
function tourSteps(gk){const key=gk==='HH'?'5':gk,out=[];
  ZTOUR.forEach(z=>(KZ[z]||[]).forEach(b=>{const a=b.anf[key]||{},t=a.t!=null?a.t:a.og;if(gk!=='HH'&&/^nicht einschl/i.test(t||''))return;out.push(b.id);}));
  return out;}
function LayerBar({layers,setLayers}){
  const allOn=GR.every(g=>layers[g.k]!==false);
  return h('div',{className:'lyr',role:'group','aria-label':'Ebenen ein- und ausblenden'},
    h('button',{className:'ly all'+(allOn?' on':''),'aria-pressed':allOn,onClick:()=>setLayers(allOn?Object.fromEntries(GR.map(g=>[g.k,false])):Object.assign({},LAYERS0))},'Alle'),
    GR.map(g=>{const on=layers[g.k]!==false;
      return h('button',{key:g.k,className:'ly'+(on?' on':''),'aria-pressed':on,style:{'--c':g.c,'--t':ink(g.c)},onClick:()=>setLayers(Object.assign({},layers,{[g.k]:!on}))},h('i'),g.n,h('em',null,GCOUNT[g.k]));}));
}
function ItemCard({b,gk,pick}){
  const gc=GCOL[b.gruppe],gr=GR.find(g=>g.k===b.gruppe),hh=gk==='HH';
  const a=b.anf[hh?'5':gk]||{};
  const rows=a.t!=null?[['',a.t]]:[['Obergeschoss',a.og],['Kellergeschoss',a.ke]];
  const rq=(l,t,c)=>h('div',{key:l+t,className:'rq',style:{borderLeftColor:c||reqCol(t,gc)}},l?h('small',null,l):null,h('b',null,t));
  const zone=KZ[b.pos]||[];
  return h('div',{className:'icard',style:{'--g':gc}},
    h('div',{className:'ichips'},h('span',{className:'gch',style:{background:gc,color:ink(gc)}},gr?gr.n:b.gruppe),h('span',{className:'gch2'},ZNAME[b.pos]||''),h('span',{className:'gch2'},AUFTR[b.auftritt]||'')),
    h('h2',null,b.name),
    h('h3',{style:{marginTop:8}},hh?'Hochhaus (MHHR)':'Anforderung · '+GKS[gk].long),
    hh?rq('',b.hh,'#e0489a'):rows.map(r=>rq(r[0],r[1])),
    hh?h('h3',null,'Zum Vergleich: GK 5 nach MBO'):null,
    hh?rows.map(r=>rq(r[0],r[1])):null,
    a.h?h('div',{className:'inote'},h('b',null,'Hinweis: '),a.h):null,
    h('p',{className:'kurz'},b.kurz),
    b.merksatz?h('div',{className:'merk'},h('small',null,'Merksatz'),b.merksatz):null,
    h('div',{className:'rgl'},h('small',null,'Rechtsgrundlage'),h('span',null,b.rg),h('em',null,' · Quelle: '+(b.quelle||'MBO'))),
    (b.mbo||b.app)?h('div',{className:'abw'},h('b',null,'Abweichung zwischen MBO und Lernseite'),b.mbo?h('p',null,h('b',null,'MBO: '),b.mbo):null,b.app?h('p',null,h('b',null,'Lernseite / App: '),b.app):null):null,
    b.unklar?h('div',{className:'msg o',style:{marginTop:8}},'Hinweis: nicht eindeutig in der MBO.'):null,
    zone.length>1?h('div',null,h('h3',null,'Weitere Bauteile an dieser Stelle'),
      zone.map(x=>h('button',{key:x.id,className:'irow'+(x.id===b.id?' on':''),onClick:()=>pick(x.id,'list')},h('i',{style:{background:GCOL[x.gruppe]}}),x.name))):null);
}
function RgTab({p,setP,gk,rg,setRg,steps,pick,startTour,go,endTour}){
  const [openG,setOpenG]=useState(null);
  const b=rg.sel?KBY[rg.sel]:null;
  if(rg.tour&&b){
    const si=rg.step,N=steps.length,out=ZOUT.includes(b.pos);
    return h('div',null,
      h('div',{className:'thead'},h('div',null,h('b',null,'Schritt '+(si+1)+' von '+N),h('span',{className:'phase'},(out?'Außen':'Innen')+' · '+ZNAME[b.pos]+' · '+GKS[gk].n)),h('button',{className:'btn sec sm',onClick:endTour},'Beenden')),
      h('div',{className:'pbar'},h('i',{style:{width:((si+1)/N*100)+'%'}})),
      h(ItemCard,{b,gk,pick}),h('div',{style:{height:6}}));
  }
  const cur=gk==='1a'||gk==='1b'?'1':gk;
  const chips=h('div',{className:'chips'},PRESETS.map(pr=>h('button',{key:pr.k,className:'chp '+COLTXT(pr.gk)+(cur===pr.k?' on':''),style:{'--c':pr.c},onClick:()=>{setP(pr.p);setRg(r=>Object.assign({},r,{sel:null}));}},h('i'),pr.n)));
  const dgarOn=rg.dgar!==false;
  return h('div',null,
    b?h(ItemCard,{b,gk,pick}):h('div',{className:'msg n'},'Tippe im aufgeschnittenen Haus einen Marker oder ein Bauteil an. Oben schaltest du Ebenen ein und aus.'),
    h('h3',null,'Gebäudeklasse'),chips,
    h('button',{className:'btn big',style:{marginTop:10},onClick:startTour},'Rundgang starten · '+steps.length+' Stationen'),
    h('div',{className:'mu',style:{fontSize:12.5,marginTop:6}},'Von außen nach innen und von unten nach oben, alle Bauteile für '+GKS[gk].long+'.'),
    h('h3',null,'Alle Bauteile'),
    GR.map(g=>h('div',{key:g.k},
      h('button',{className:'grow'+(openG===g.k?' on':''),'aria-expanded':openG===g.k,onClick:()=>setOpenG(openG===g.k?null:g.k)},h('i',{style:{background:g.c}}),h('span',null,g.n),h('em',null,GCOUNT[g.k]),h('u',null,openG===g.k?'▴':'▾')),
      openG===g.k?h('div',{className:'glist'},KT.filter(x=>x.gruppe===g.k).map(x=>h('button',{key:x.id,className:'irow'+(rg.sel===x.id?' on':''),onClick:()=>pick(x.id,'list')},h('i',{style:{background:g.c}}),x.name))):null)),
    h('h3',null,'Darstellung'),
    h('div',{className:'seg sm'},[['grp','Farbe nach Ebene'],['req','Farbe nach Anforderung']].map(a=>h('button',{key:a[0],className:rg.colorBy===a[0]?'on':'',onClick:()=>setRg(r=>Object.assign({},r,{colorBy:a[0]}))},a[1]))),
    rg.colorBy==='req'?h('div',{className:'card',style:{padding:'4px 14px'}},h(Switch,{on:dgarOn,onChange:v=>setRg(r=>Object.assign({},r,{dgar:v})),t:'Über dem Dachgeschoss: Aufenthaltsräume möglich',d:'Aus: Die Decke zum Dachraum wird anders bewertet (§ 31, § 29)'})):null,
    h('div',{className:'card',style:{padding:'4px 14px',marginTop:10}},h(Switch,{on:rg.bw,onChange:v=>setRg(r=>Object.assign({},r,{bw:v})),t:'Brandwand-Detail zeigen',d:'REI 90-M (F 90-A), links am Gebäude'})),
    rg.bw?h('div',{className:'card'},h('p',{style:{marginBottom:6}},B('**Brandwand** (REI 90-M, F 90-A): Abstand zur Innenecke **≥ 5 m (MBO, Lernseite) bzw. ≥ 3 m (BauO NRW)**. Sie muss **0,30 m über Bedachung** gezogen oder **beidseitig 0,50 m auskragen**.')),h(BwDetail),h('div',{className:'mu',style:{fontSize:11.5,marginTop:6}},'Vereinfachte Darstellung, nicht maßstäblich.')):null,
    h('div',{style:{height:8}}));
}
/* ---------- Quiz ---------- */
function QuizTab({quiz,setQuiz,startQuiz,answer,next}){
  if(!quiz)return null;
  const n=quiz.cases.length,i=quiz.i,sonder=quiz.type==='sonder';
  const seg=h('div',{className:'seg sm'},[['gk','Prüf-Quiz'],['sonder','Sonderbau-Check']].map(a=>h('button',{key:a[0],className:quiz.type===a[0]?'on':'',onClick:()=>quiz.type!==a[0]&&startQuiz(a[0])},a[1])));
  const dots=h('div',{className:'prog'},h('b',{style:{fontSize:14,flex:'none'}},quiz.phase==='end'?'Ergebnis':'Fall '+(i+1)+' von '+n),h('div',{className:'dots'},quiz.cases.map((c,k)=>{const a=quiz.ans[k];return h('div',{key:k,className:'dot '+(a?(a.ok?'ok':'bad'):(k===i&&quiz.phase!=='end'?'now':''))});})));
  if(quiz.phase==='end'){
    const sc=quiz.ans.filter(a=>a.ok).length,r=sc/n,st=r>=0.85?3:r>=0.6?2:r>=0.35?1:0;
    return h('div',null,seg,dots,h('div',{className:'card',style:{textAlign:'center'}},h('div',{className:'stars'},[0,1,2].map(k=>h(Star,{key:k,on:k<st}))),h('h2',null,sc+' von '+n+' richtig'),
      h('p',{className:'mu',style:{marginBottom:0}},st===3?'Sehr gut: du wendest das Prüfschema sicher an.':st===2?'Gut. Schau dir die falschen Fälle noch einmal an.':'Übe das Prüfschema weiter: Höhe, NE, Fläche, Lage.')),
      quiz.cases.map((c,k)=>h('div',{key:k,className:'rev'},h('b',{className:quiz.ans[k].ok?'ok':'bd'},quiz.ans[k].ok?'✓':'✗'),h('span',null,sonder?c.s.n+' → '+c.s.v:(c.kind==='bt'?GKS[c.gk].n+' ('+(c.zone==='ke'?'Keller':'Obergeschoss')+') → '+REQ[reqFor(c.gk,'wand',c.zone)].s:c.text.split(',')[0]+', OKFF '+fm(c.p.okff)+' m → '+GKS[c.gk].n)))),
      h('div',{style:{height:10}}),h('button',{className:'btn big',onClick:()=>startQuiz(quiz.type)},'Neue Runde'),
      h('button',{className:'btn sec big',style:{marginTop:8},onClick:()=>startQuiz(sonder?'gk':'sonder')},sonder?'Zum Prüf-Quiz':'Zum Sonderbau-Check'));
  }
  const c=quiz.cases[i],a=quiz.ans[i],fb=quiz.phase==='fb';
  let q,opts,body;
  if(sonder){
    q=h('div',{className:'card'},h('p',{style:{marginBottom:2},className:'mu'},'Sonderbau nach § 2 Abs. 4 MBO'),h('h2',{style:{marginBottom:2}},c.s.n),h('p',{style:{margin:0}},B('Tatbestand: **'+c.s.t+'**. Welche Vorschrift gilt?')));
    opts=c.opts.map(o=>({k:o,t:o,ok:o===c.s.v}));
  }else if(c.kind==='bt'){
    q=h('div',{className:'card'},h('p',{className:'mu',style:{marginBottom:2}},'Tragende Wände, Stützen und Decken'),h('p',{style:{marginBottom:4}},B('**'+c.text+'**')),h('h2',{style:{margin:0,fontSize:16}},'Welche Anforderung gilt im '+(c.zone==='ke'?'Kellergeschoss':'Obergeschoss')+'?'));
    const right=reqFor(c.gk,'wand',c.zone);
    opts=['none','f30','f60','f90'].map(k=>({k,t:REQ[k].t,c:REQ[k].c,ok:k===right,w1:true}));
  }else{
    q=h('div',{className:'card'},h('p',{className:'mu',style:{marginBottom:2}},'Bestimme die Gebäudeklasse'),h('p',{style:{marginBottom:0}},B(c.text.replace(/OKFF der obersten NE: ([\d,]+ m)\./,'OKFF der obersten NE: **$1**.'))));
    opts=GKORDER.map(k=>({k,t:k==='HH'?'Hochhaus (MHHR)':GKS[k].n,c:GKS[k].c,ok:k===c.gk,w1:k==='HH'}));
  }
  let fbCard=null;
  if(fb){
    const ok=a.ok;
    let why;
    if(sonder)why='**'+c.s.n+'** ('+c.s.t+') → **'+c.s.v+'**.';
    else if(c.kind==='bt'){const T=TABLE[c.gk];why=(c.gk==='1a'?'GK 1':GKS[c.gk].n)+': Obergeschoss **'+REQ[T[0]].t+'**, Kellergeschoss **'+REQ[T[1]].t+'**.';}
    else{const cl=classify(c.p);why=cl.why;}
    fbCard=h('div',{className:'msg '+(ok?'g':'r')},h('div',{style:{fontWeight:800,fontSize:15,marginBottom:3}},ok?'Richtig!':'Leider falsch.'),B(why));
  }
  return h('div',null,seg,dots,q,
    fbCard,
    fb?h('button',{className:'btn big',style:{marginBottom:6},onClick:next},i+1>=n?'Ergebnis ansehen':'Weiter'):null,
    h('div',{className:'opts'},opts.map(o=>{const picked=a&&a.pick===o.k;const cls='opt'+(o.w1&&!sonder?' w1':'')+(fb?(o.ok?' ok':picked?' bad':''):'');
      return h('button',{key:o.k,className:cls,disabled:fb,onClick:()=>answer(o.k,o.ok)},o.c?h('i',{style:{background:o.c}}):null,o.t);})),
    fb&&!sonder&&c.kind==='gk'?h('div',{className:'card',style:{padding:'4px 14px'}},h('h3',{style:{marginTop:8}},'Prüfpfad'),h(PathList,{cl:classify(c.p),p:c.p})):null,
    h('div',{style:{height:6}}));
}
/* ---------- Stage ---------- */
function Stage({onReady,onPick,children,sec}){
  const cv=useRef(null),hostRef=useRef(null);
  useEffect(()=>{const sc=createScene(cv.current,hostRef.current,{onPick:o=>onPick.current&&onPick.current(o)});onReady(sc);window.__gk=sc;return()=>sc.dispose();},[]);
  return h('div',{className:'stage'+(sec?' sec':''),ref:hostRef},h('canvas',{ref:cv}),children);
}
/* ---------- Matrix: Feuerwiderstand je Gebäudeklasse (Tabelle Seite 133, Lösung der Übungsmatrix) ---------- */
const XW='Wohngebäude: keine / sonst: feuerhemmend',XKA='keine Anforderung',XFH='feuerhemmend',XHFH='hochfeuerhemmend',XFB='feuerbeständig';
const MX=[
 ['Nutzungseinheit','Tragende Wände',['ausreichend lange Standsicherheit',XFH,XFH,XHFH,XFB]],
 ['Nutzungseinheit','Decken',[XKA,XFH,XFH,XHFH,XFB]],
 ['Nutzungseinheit','Trennwand',[XW,XW,XFH,XHFH,XFB]],
 ['Keller','Tragende Wände (Keller)',[XFH,XFH,XFB,XFB,XFB]],
 ['Keller','Decken (Keller)',[XFH,XFH,XFB,XFB,XFB]],
 ['Keller','Trennwand (Keller)',[XW,XW,XFB,XFB,XFB]],
 ['Brandwand','Brandwand',[XKA,XKA,XKA,XKA,'feuerbeständig + A u. mechanisch']],
 ['Brandwand','Wand anstelle Brandwand',[XHFH,XHFH,XHFH,'hochfeuerhemmend + M',XKA]],
 ['Vertikale Wege','Aufzugfahrschacht',[XKA,XKA,XFH,XHFH,'feuerbeständig + A']],
 ['Vertikale Wege','Notwendiger Treppenraum',[XKA,XKA,XFH,'hochfeuerhemmend + M','Bauart Brandwand']],
 ['Rettungswege','Notwendiger Flur',[XKA,XKA,XFH,XFH,XFH]],
 ['Rettungswege','Notwendiger Flur (Keller)',[XFH,XFH,XFB,XFB,XFB]]];
const MXV={ /* Farbe und Kurzzeichen wie in der Übungsmatrix */
 'keine Anforderung':{o:0,bg:'#ffffff',fg:'#1a2233',z:'–',n:'keine Anforderung'},
 'ausreichend lange Standsicherheit':{o:1,bg:'#ffffff',fg:'#1a2233',z:'Stand­sicherheit',n:'ausreichend lange Standsicherheit'},
 [XW]:{o:2,bg:'linear-gradient(135deg,#ffffff 50%,#ffff00 50%)',fg:'#1a2233',z:'Wohn. – / sonst F30',n:XW},
 [XFH]:{o:3,bg:'#ffff00',fg:'#1a2233',z:'F30',n:XFH},
 [XHFH]:{o:4,bg:'#ffc000',fg:'#1a2233',z:'F60',n:XHFH},
 'hochfeuerhemmend + M':{o:5,bg:'#7030a0',fg:'#ffffff',z:'F60 + M',n:'hochfeuerhemmend + M'},
 [XFB]:{o:6,bg:'#ff0000',fg:'#ffffff',z:'F90',n:XFB},
 'feuerbeständig + A':{o:7,bg:'#ff0000',fg:'#ffffff',z:'F90 + A',n:'feuerbeständig + A'},
 'feuerbeständig + A u. mechanisch':{o:8,bg:'#7030a0',fg:'#ffffff',z:'F90 + A + M',n:'feuerbeständig + A u. mechanisch'},
 'Bauart Brandwand':{o:9,bg:'#7030a0',fg:'#ffffff',z:'Brandwand-Bauart',n:'Bauart Brandwand'}};
const MXOPT=Object.keys(MXV).sort((a,b)=>MXV[a].o-MXV[b].o);
const MXBER=['Nutzungseinheit','Keller','Brandwand','Vertikale Wege','Rettungswege'];
const MXBN={'Nutzungseinheit':'Nutzungseinheit (oberirdisch)','Keller':'Keller','Brandwand':'Brandwand','Vertikale Wege':'Vertikale Wege','Rettungswege':'Rettungswege'};
const MXGK=['GK 1','GK 2','GK 3','GK 4','GK 5'];
function Chip({v,full}){const m=MXV[v];return h('span',{className:'mxc',style:{background:m.bg,color:m.fg}},full?m.n:m.z);}
function MxLegend(){return h('div',{className:'mxlg'},
  h('div',{className:'mxlr'},[['keine Anforderung','keine Anforderung'],[XFH,'F30 feuerhemmend'],[XHFH,'F60 hochfeuerhemmend'],[XFB,'F90 feuerbeständig'],['hochfeuerhemmend + M','Sonderanforderung']].map(a=>h('span',{key:a[0],className:'mxc',style:{background:MXV[a[0]].bg,color:MXV[a[0]].fg}},a[1]))),
  h('div',{className:'mu',style:{fontSize:12.5}},'A = aus nichtbrennbaren Baustoffen · M = auch unter zusätzlicher mechanischer Beanspruchung. Quelle: Tabelle Seite 133 (Lösung der Übungsmatrix).'));}
function MxByGK({gi,setGi}){
  const groups={};MX.forEach(r=>{const v=r[2][gi];groups[v]=groups[v]||{};(groups[v][r[0]]=groups[v][r[0]]||[]).push(r[1]);});
  const vals=Object.keys(groups).sort((a,b)=>MXV[a].o-MXV[b].o);
  return h('div',null,
    h('div',{className:'chips',style:{marginBottom:10}},MXGK.map((g,i)=>h('button',{key:g,className:'chp f'+(gi===i?' on':''),onClick:()=>setGi(i)},g))),
    vals.map(v=>h('div',{key:v,className:'card mxg'},h('div',{className:'mxh'},h(Chip,{v,full:true})),
      MXBER.filter(b=>groups[v][b]).map(b=>h('div',{key:b,className:'mxrow'},h('b',null,MXBN[b]),h('span',null,groups[v][b].join(', ').replace(/ \(Keller\)/g,'')))))));
}
function MxByPart(){
  const out=[];
  MXBER.forEach(b=>{const rows=MX.filter(r=>r[0]===b),merged=[];
    rows.forEach(r=>{const k=r[2].join('|'),m=merged.find(x=>x.k===k);if(m)m.n.push(r[1]);else merged.push({k,n:[r[1]],v:r[2]});});
    out.push(h('h3',{key:'h'+b,style:{margin:'14px 0 6px'}},MXBN[b]));
    merged.forEach((m,i)=>out.push(h('div',{key:b+i,className:'card mxp'},h('div',{className:'mxn'},m.n.join(' · ')),
      h('div',{className:'mxcells'},m.v.map((v,gi)=>h('div',{key:gi,className:'mxcell',style:{background:MXV[v].bg,color:MXV[v].fg}},h('small',null,MXGK[gi]),h('b',null,MXV[v].z)))),
      h('div',{className:'mu',style:{fontSize:12,marginTop:6}},[...new Set(m.v)].map(v=>MXV[v].n).join(' · ')))));});
  return h('div',null,out);
}
function MxPractice(){
  const [gi,setGi]=useState(0);
  const [ans,setAns]=useState({});
  const [chk,setChk]=useState(false);
  const key=(g,r)=>g+'-'+r;
  const okOf=(g,r)=>ans[key(g,r)]===MX[r][2][g];
  let total=0;MXGK.forEach((_,g)=>MX.forEach((_,r)=>{if(okOf(g,r))total++;}));
  const perGK=MXGK.map((_,g)=>MX.reduce((n,_,r)=>n+(okOf(g,r)?1:0),0));
  const answered=MXGK.map((_,g)=>MX.reduce((n,_,r)=>n+(ans[key(g,r)]?1:0),0));
  return h('div',null,
    h('div',{className:'chips',style:{marginBottom:8}},MXGK.map((g,i)=>h('button',{key:g,className:'chp f'+(gi===i?' on':''),onClick:()=>setGi(i)},g+' · '+(chk?perGK[i]:answered[i])+'/12'))),
    h('div',{className:'mu',style:{marginBottom:8}},chk?'Auswertung: '+total+' von 60 richtig.':'Wähle für jedes Bauteil die Anforderung bei '+MXGK[gi]+'. Zum Prüfen unten tippen.'),
    MXBER.map(b=>h('div',{key:b},h('h3',{style:{margin:'12px 0 6px'}},MXBN[b]),
      MX.map((r,ri)=>r[0]!==b?null:h('div',{key:ri,className:'card mxq'},
        h('label',null,h('span',{className:'mxn'},r[1]),
          h('select',{value:ans[key(gi,ri)]||'',onChange:e=>{const v=e.target.value;setChk(false);setAns(a=>Object.assign({},a,{[key(gi,ri)]:v}));},style:ans[key(gi,ri)]?{background:MXV[ans[key(gi,ri)]].bg,color:MXV[ans[key(gi,ri)]].fg}:null},
            h('option',{value:''},'Auswählen …'),MXOPT.map(o=>h('option',{key:o,value:o,style:{background:'#fff',color:'#1a2233'}},o)))),
        chk&&ans[key(gi,ri)]?h('div',{className:'mxfb '+(okOf(gi,ri)?'ok':'bd')},okOf(gi,ri)?'richtig':'falsch, richtig ist: '+r[2][gi]):chk?h('div',{className:'mxfb bd'},'offen, richtig ist: '+r[2][gi]):null)))),
    h('div',{className:'row2'},h('button',{className:'btn',onClick:()=>{setAns({});setChk(false);}},'Neu starten'),h('button',{className:'btn pri',onClick:()=>setChk(true)},'Prüfen')));
}
function MatrixTab(){
  const [mode,setMode]=useState('gk');const [gi,setGi]=useState(2);
  return h('div',{className:'mxwrap'},
    h('div',{className:'seg sm'},[['gk','Nach Gebäudeklasse'],['bt','Nach Bauteil'],['ue','Üben']].map(a=>h('button',{key:a[0],className:mode===a[0]?'on':'',onClick:()=>setMode(a[0])},a[1]))),
    mode!=='ue'?h(MxLegend):null,
    mode==='gk'?h(MxByGK,{gi,setGi}):mode==='bt'?h(MxByPart):h(MxPractice));
}
const MXCSS=`
.app.mx>:not(.panel){display:none}
.app.mx .panel{height:100%;border-radius:0;box-shadow:none;width:100%;max-width:880px;margin:0 auto;flex:1 1 auto}
.mxc{display:inline-block;padding:4px 10px;border-radius:999px;font-weight:800;font-size:13px;line-height:1.25;border:1px solid rgba(0,0,0,.25)}
.mxlg{margin-bottom:10px}.mxlr{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}
.mxg .mxh{margin-bottom:8px}.mxrow{display:flex;flex-direction:column;gap:1px;padding:6px 0;border-top:1px solid var(--ln)}.mxrow b{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--mu)}.mxrow span{font-size:15.5px;font-weight:600}
.mxn{font-weight:800;font-size:15px;display:block;margin-bottom:6px}
.mxcells{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
.mxcell{border-radius:10px;padding:5px 3px;text-align:center;border:1px solid rgba(0,0,0,.25);min-height:54px;display:flex;flex-direction:column;justify-content:center;gap:2px}
.mxcell small{font-size:10px;font-weight:700;opacity:.75}.mxcell b{font-size:11.5px;line-height:1.15;overflow-wrap:anywhere}
.mxq label{display:flex;flex-direction:column;gap:6px}.mxq select{min-height:46px;border-radius:12px;border:2px solid var(--ln);background:var(--pn);color:var(--tx);font:600 15px inherit;font-family:inherit;padding:0 10px;width:100%}
.mxfb{margin-top:6px;font-size:13px;font-weight:700}.mxfb.ok{color:#5fd38a}.mxfb.bd{color:#ff8a8a}
.row2{display:flex;gap:10px;justify-content:flex-end;margin:14px 0 20px;flex-wrap:wrap}`;

/* ---------- App ---------- */
function App(){
  const [tab,setTab]=useState('bau');
  const [p,setP]=useState(P0);
  const [seg,setSeg]=useState('regler');
  const [rg,setRg]=useState({sel:null,src:'tap',tour:false,step:0,tick:0,layers:LAYERS0,colorBy:'grp',bw:false,dgar:true});
  DGAR=rg.dgar!==false;
  const bodyRef=useRef(null),stepsRef=useRef([]);
  const [quiz,setQuiz]=useState(null);
  const api=useRef(null),pickRef=useRef(null);
  const wide=useWide();
  const startQuiz=useCallback(type=>{setQuiz({type,cases:type==='sonder'?makeSonder():makeRound(),i:0,ans:[],phase:'ask'});},[]);
  useEffect(()=>{if(tab==='quiz'&&!quiz)startQuiz('gk');},[tab]);
  const answer=(k,ok)=>setQuiz(q=>{const ans=q.ans.slice();ans[q.i]={pick:k,ok};return Object.assign({},q,{ans,phase:'fb'});});
  const next=()=>setQuiz(q=>q.i+1>=q.cases.length?Object.assign({},q,{phase:'end'}):Object.assign({},q,{i:q.i+1,phase:'ask'}));
  const pickItem=useCallback((id,src)=>setRg(r=>{const b=KBY[id];if(!b)return r;const si=stepsRef.current.indexOf(id);
    return Object.assign({},r,{sel:id,src,tick:r.tick+1,step:r.tour&&si>=0?si:r.step,layers:r.layers[b.gruppe]===false?Object.assign({},r.layers,{[b.gruppe]:true}):r.layers});}),[]);
  pickRef.current=o=>{
    if(!o){setRg(r=>r.tour||!r.sel?r:Object.assign({},r,{sel:null}));return;}
    if(o.id){pickItem(o.id,'tap');return;}
    if(o.zone){setRg(r=>{const cur=r.sel&&KBY[r.sel];if(cur&&cur.pos===o.zone)return r;const list=KZ[o.zone]||[],b=list.find(x=>r.layers[x.gruppe]!==false)||list[0];if(!b)return r;
      const si=stepsRef.current.indexOf(b.id);return Object.assign({},r,{sel:b.id,src:'tap',tick:r.tick+1,step:r.tour&&si>=0?si:r.step});});}};
  /* Welche Szene? */
  const qc=tab==='quiz'&&quiz&&quiz.phase!=='end'?quiz.cases[quiz.i]:null;
  let ep=p,color=null,label=null,secMode=false,gk=null;
  const sonder=quiz&&quiz.type==='sonder';
  if(tab==='quiz'){
    if(qc&&!sonder){ep=qc.p;gk=qc.gk;const known=qc.kind==='bt'||quiz.phase==='fb';
      if(known){color=GKS[gk].c;label={text:GKS[gk].n,sub:'',color:GKS[gk].c,dark:!!COLTXT(gk)};}
      secMode=qc.kind==='bt'&&quiz.phase==='fb';}
    else if(qc&&sonder){ep={okff:qc.s.v==='MHHR'?26:9.5,free:true,nne:2,ane:true,land:false};
      if(quiz.phase==='fb')label={text:qc.s.v,sub:'Sonderbau',color:'#ffa412',dark:true};}
    else {ep={okff:10,free:true,nne:3,ane:true,land:false};}
  }
  const cl=classify(tab==='quiz'?ep:p);
  if(tab!=='quiz'){gk=cl.gk;color=GKS[gk].c;label={text:GKS[gk].n,sub:gk==='HH'?'MHHR':'',color:GKS[gk].c,dark:!!COLTXT(gk)};}
  const rgOn=tab==='rg';
  if(rgOn){secMode=true;ep=ep.okff<6?Object.assign({},ep,{okff:6}):ep;}
  const steps=useMemo(()=>tourSteps(cl.gk),[cl.gk]);stepsRef.current=steps;
  const view={mode:secMode?'sec':'ext',p:ep,color,label,gk:gk||cl.gk,dgar:rg.dgar!==false,focus:null,bw:rgOn&&rg.bw,rulers:!(tab==='quiz'&&sonder),rg:rgOn,layers:rg.layers,colorBy:rg.colorBy,selId:rgOn?rg.sel:null};
  const vk=JSON.stringify(view);
  useEffect(()=>{api.current&&api.current.set(view);},[vk]);
  /* Kamera bei Moduswechsel */
  const camKey=secMode?(rgOn&&rg.bw?'bw':'sec'):'ext';
  useEffect(()=>{const a=api.current;if(!a)return;
    if(camKey==='bw')a.fly({theta:-1.0,phi:1.22,zoom:0.55,focus:{x:-5.5,y:1.2,z:0,roof:true}});
    else a.reset();},[camKey]);
  const ready=sc=>{api.current=sc;sc.set(view);};
  /* Kamera folgt der Auswahl aus Liste und Rundgang (nicht beim Antippen im Haus) */
  useEffect(()=>{if(!rgOn||!rg.sel||rg.src==='tap'||!api.current)return;api.current.focusItem(rg.sel);},[rgOn,rg.sel,rg.src,rg.tick]);
  useEffect(()=>{const e=bodyRef.current;if(e)e.scrollTop=0;},[rg.sel,tab]);
  /* Rundgang: Schritte */
  const startTour=()=>{const id=steps[0];setRg(r=>{const b=KBY[id];return Object.assign({},r,{tour:true,step:0,sel:id,src:'tour',tick:r.tick+1,bw:false,layers:r.layers[b.gruppe]===false?Object.assign({},r.layers,{[b.gruppe]:true}):r.layers});});};
  const go=d=>setRg(r=>{const n=clamp(r.step+d,0,steps.length-1),id=steps[n],b=KBY[id];return Object.assign({},r,{step:n,sel:id,src:'tour',tick:r.tick+1,layers:r.layers[b.gruppe]===false?Object.assign({},r.layers,{[b.gruppe]:true}):r.layers});});
  const endTour=()=>{setRg(r=>Object.assign({},r,{tour:false,sel:null}));const a=api.current;if(a)a.reset();};
  const setLayers=l=>setRg(r=>Object.assign({},r,{layers:l}));
  /* Legende in der Szene */
  let legend=null;
  if(rgOn){if(rg.colorBy==='req'){const g=view.gk;const ks=[];const add=k=>{if(!ks.includes(k))ks.push(k);};
      add(reqFor(g,'wand','og'));add(reqFor(g,'wand','ke'));add(reqFor(g,'treppe','og'));add(reqFor(g,'dach','og'));add(reqFor(g,'trenn','og'));if(view.bw)add('bw');
      legend=h('div',{className:'slegend lg2'},ks.map(k=>h('div',{key:k,className:'sl'},h('i',{style:{background:REQ[k].c}}),REQ[k].s==='keine'?'keine Anforderung':REQ[k].s+(REQ[k].n?' '+REQ[k].n:''))));}}
  else if(secMode){const g=view.gk;const ks=[];const add=k=>{if(!ks.includes(k))ks.push(k);};
    add(reqFor(g,'wand','og'));add(reqFor(g,'wand','ke'));add(reqFor(g,'treppe','og'));add(reqFor(g,'dach','og'));if(ep.nne>=2)add(reqFor(g,'trenn','og'));if(view.bw)add('bw');
    legend=h('div',{className:'slegend'},ks.map(k=>h('div',{key:k,className:'sl'},h('i',{style:{background:REQ[k].c}}),REQ[k].s==='keine'?'keine Anforderung':REQ[k].s+(REQ[k].n?' '+REQ[k].n:''))));}
  const hint=secMode?(rgOn?'Marker antippen · Ziehen dreht · Pinch zoomt · vereinfachte Darstellung':'Aufgeschnittenes Gebäude · vereinfachte Darstellung'):'Ziehen dreht · Pinch/Scrollrad zoomt · vereinfachte Darstellung (ca. 3 m je Geschoss)';
  const stage=h(Stage,{onReady:ready,onPick:pickRef,sec:secMode},
    rgOn?h(LayerBar,{layers:rg.layers,setLayers}):null,
    legend,
    h('div',{className:'topr'},h('button',{className:'ibtn','aria-label':'Ansicht zurücksetzen',onClick:()=>{const a=api.current;if(!a)return;if(camKey==='bw')a.fly({theta:-1.0,phi:1.22,zoom:0.55,focus:{x:-5.5,y:1.2,z:0,roof:true}});else a.reset();}},ICON.reset)),
    rgOn&&rg.tour?h('div',{className:'tnav2'},h('button',{className:'tn sec',disabled:rg.step<=0,onClick:()=>go(-1)},'← Zurück'),h('button',{className:'tn',onClick:()=>rg.step>=steps.length-1?endTour():go(1)},rg.step>=steps.length-1?'Fertig':'Weiter →')):h('div',{className:'hint'},hint));
  let body;
  if(tab==='bau')body=h(BauTab,{p,setP,cl,wide,seg,setSeg,gotoTeile:()=>setTab('rg')});
  else if(tab==='rg')body=h(RgTab,{p,setP,gk:cl.gk,rg,setRg,steps,pick:pickItem,startTour,go,endTour});
  else if(tab==='matrix')body=h(MatrixTab);
  else body=h(QuizTab,{quiz,setQuiz,startQuiz,answer,next});
  const tabs=h('div',{className:'tabs',role:'tablist'},[['bau','Baukasten'],['rg','Rundgang'],['matrix','Matrix'],['quiz','Prüf-Quiz']].map(a=>h('button',{key:a[0],role:'tab','aria-selected':tab===a[0],className:'tab'+(tab===a[0]?' on':''),onClick:()=>setTab(a[0])},ICON[a[0]],a[1])));
  return h('div',{className:'app'+(tab==='matrix'?' mx':'')},stage,h('div',{className:'panel'},tabs,h('div',{className:'pbody',ref:bodyRef,key:tab+(tab==='quiz'&&quiz?quiz.type+quiz.i+quiz.phase:'')},body)));
}

const RGCSS=`
.lyr{position:absolute;left:10px;right:64px;top:10px;display:flex;gap:6px;overflow-x:auto;z-index:4;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:2px}
.lyr::-webkit-scrollbar{display:none}
.ly{flex:none;min-height:44px;display:flex;align-items:center;gap:7px;border-radius:12px;border:2px solid var(--c,rgba(255,255,255,.4));background:rgba(13,21,34,.8);color:#e7edf7;font-weight:700;font-size:13px;font-family:inherit;padding:0 12px;cursor:pointer;backdrop-filter:blur(4px)}
.ly i{width:12px;height:12px;border-radius:50%;background:var(--c,#fff);display:block;flex:none}
.ly em{font-style:normal;font-size:11px;opacity:.8;font-weight:700}
.ly.on{background:var(--c,#fff);color:var(--t,#111a2a)}
.ly.on i{background:var(--t,#111a2a)}
.ly.all{--c:#e7edf7;--t:#111a2a}
.ly:not(.on){opacity:.72}
.slegend.lg2{top:62px;right:10px}
.pinl{font-weight:700;font-size:12px;line-height:1.25;font-family:inherit;color:#fff;background:rgba(13,21,34,.9);border:2px solid #fff;border-radius:9px;padding:4px 8px;white-space:normal;width:max-content;max-width:210px;text-align:center}
.thead{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
.thead b{font-size:15px;display:block}.phase{display:block;font-size:12.5px;color:var(--mu);margin-top:1px}
.btn.sm{min-height:44px;font-size:14px;padding:0 14px;flex:none}
.pbar{height:6px;border-radius:3px;background:var(--pn3);margin-bottom:10px;overflow:hidden}.pbar i{display:block;height:100%;background:var(--ac)}
.icard{background:var(--pn2);border:1px solid var(--ln);border-left:5px solid var(--g);border-radius:16px;padding:12px 14px;margin-bottom:10px}
.ichips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.gch{border-radius:999px;padding:3px 10px;font-weight:800;font-size:12px;line-height:1.3;font-family:inherit}
.gch2{border-radius:999px;padding:3px 10px;font-weight:600;font-size:12px;line-height:1.3;font-family:inherit;background:var(--pn3);color:var(--mu)}
.icard h2{font-size:17px;margin:0 0 2px}
.icard h3{margin:10px 0 6px}
.rq{border-left:6px solid var(--ln);background:var(--pn);border-radius:8px;padding:7px 10px;margin-bottom:6px}
.rq small{display:block;font-size:11.5px;color:var(--mu);font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.rq b{display:block;font-size:15px;line-height:1.3}
.inote{font-size:13px;color:var(--mu);line-height:1.4;margin:2px 0 6px}
.kurz{font-size:14px;margin:8px 0}
.merk{background:rgba(255,164,18,.13);border:1px solid rgba(255,164,18,.45);border-radius:12px;padding:8px 11px;font-size:14px;line-height:1.4;margin-bottom:8px}
.merk small,.rgl small{display:block;font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:var(--mu);font-weight:800;margin-bottom:2px}
.rgl{font-size:13.5px;margin-bottom:8px}.rgl em{font-style:normal;color:var(--mu)}
.abw{background:rgba(255,106,77,.12);border:1px solid rgba(255,106,77,.5);border-radius:12px;padding:8px 11px;margin-top:8px;font-size:13.5px;line-height:1.4}
.abw p{margin:4px 0 0;font-size:13.5px}
.grow{width:100%;min-height:46px;border-radius:12px;border:1px solid var(--ln);background:var(--pn2);color:var(--tx);font:700 14.5px inherit;font-family:inherit;display:flex;align-items:center;gap:10px;padding:0 12px;margin-bottom:6px;cursor:pointer;text-align:left}
.grow i{width:12px;height:12px;border-radius:50%;display:block;flex:none}
.grow span{flex:1}.grow em{font-style:normal;color:var(--mu);font-size:12.5px}.grow u{text-decoration:none;color:var(--mu)}
.irow{width:100%;min-height:44px;border-radius:10px;border:1px solid transparent;background:transparent;color:var(--tx);font-weight:600;font-size:14px;line-height:1.25;font-family:inherit;display:flex;align-items:center;gap:10px;padding:6px 10px;margin:0 0 3px;cursor:pointer;text-align:left}
.irow i{flex:none;width:10px;height:10px;border-radius:50%;display:block}
.irow.on{background:var(--orsoft,rgba(255,164,18,.16));border-color:var(--ac)}
.tnav2{position:absolute;left:10px;right:10px;bottom:10px;display:flex;justify-content:space-between;gap:10px;z-index:5;pointer-events:none}
.tn{pointer-events:auto;min-height:52px;min-width:120px;border-radius:14px;border:0;font-weight:700;font-size:16px;font-family:inherit;padding:0 20px;cursor:pointer;background:var(--ac);color:#241503;box-shadow:0 4px 14px rgba(0,0,0,.4)}
.tn.sec{background:rgba(13,21,34,.88);color:#fff;border:1px solid rgba(255,255,255,.35)}
.tn:disabled{opacity:.4;cursor:default}
.btn:disabled{opacity:.4;cursor:default}
`;
const st=document.createElement('style');st.textContent=css+MXCSS+RGCSS;document.head.appendChild(st);
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
