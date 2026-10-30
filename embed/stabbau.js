/* ===== Stab aufbauen + Vordruck-Trainer =====
   Fakten: Lernseiten „Gliederung der Einsatzleitung“ (v-idf-s52) und „Gliederung des Krisenstabs“ (v-idf-s53). */
(function(){
'use strict';
const KEY='bvi_sim_stabbau';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const pct=(a,b)=>b?Math.round(100*a/b):0;

/* ---------- Speicher ---------- */
let store={best:{},last:{}};
try{const r=JSON.parse(localStorage.getItem(KEY)||'null');if(r&&r.best)store=r;if(!store.last)store.last={};}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}};
function setBest(k,p){const o=store.best[k];if(o===undefined||p>o)store.best[k]=p;store.last[k]=p;save();return o;}
const bestTxt=(k,old,p)=>old===undefined?'Erstes Ergebnis gespeichert.':(p>old?'Neuer Bestwert (bisher '+old+' %).':'Bestwert: '+Math.max(old,p)+' %.');

/* ---------- Fachdaten Stab ---------- */
const SG=[
 {n:'S 1',t:'Personal / Innerer Dienst',s:'Bereitstellen der Einsatzkräfte und innerer Stabsdienst'},
 {n:'S 2',t:'Lage',s:'Lagefeststellung, Lagedarstellung, Information und Einsatzdokumentation'},
 {n:'S 3',t:'Einsatz',s:'Lagebesprechung, Entschluss, Ordnen des Schadengebietes, Befehle und Kontrolle der Einsatzdurchführung'},
 {n:'S 4',t:'Versorgung',s:'Verpflegung, Unterkünfte, Rettungsmittel zum Eigenschutz, weitere Einsatzmittel und Verbrauchsgüter'},
 {n:'S 5',t:'Presse und Medienarbeit',s:'Presse- und Medienarbeit und Betreuung von Medienvertretern'},
 {n:'S 6',t:'Informations- und Kommunikationswesen',s:'Fernmeldeorganisation, Kommunikationskonzept und IuK-Technik'}
];
const CARDS=[
 {g:0,t:'Einsatzkräfte nach dem Zwiebelschalenmodell alarmieren',w:'Zum Bereitstellen der Einsatzkräfte gehört das Alarmieren unter Berücksichtigung des Zwiebelschalenmodells.'},
 {g:0,t:'Lotsenstellen für ortsunkundige Kräfte einrichten',w:'Auch das Einrichten von Lotsenstellen gehört zum Bereitstellen der Einsatzkräfte.'},
 {g:0,t:'Schichtplanung für den Stab',w:'Die Schichtplanung gehört zum inneren Stabsdienst.'},
 {g:0,t:'Zugangskontrolle zu den Führungsräumen',w:'Führungsräume einzurichten und zu sichern, einschließlich Zugangskontrolle, ist Sache des S 1.'},
 {g:1,t:'Lagekarte führen',w:'Zur Lagedarstellung gehört das Führen der Lagekarte (inklusive Einsatzübersichten).'},
 {g:1,t:'Einsatztagebuch führen',w:'Das Einsatztagebuch gehört zur Einsatzdokumentation.'},
 {g:1,t:'Meldungen an vorgesetzte Stellen absetzen',w:'Das Melden an vorgesetzte Stellen gehört zur Information.'},
 {g:1,t:'Abschlussbericht erstellen',w:'Das Erstellen des Abschlussberichts gehört zur Einsatzdokumentation.'},
 {g:2,t:'Entschluss über die Einsatzdurchführung fassen',w:'Der S 3 beurteilt die Lage und fasst den Entschluss über die Einsatzdurchführung.'},
 {g:2,t:'Absperrmaßnahmen anordnen und An- und Abmarschwege festlegen',w:'Das gehört zum Ordnen des Schadengebietes.'},
 {g:2,t:'Einsatzdurchführung beaufsichtigen und kontrollieren',w:'Beaufsichtigen und Kontrollieren der Einsatzdurchführung ist Aufgabe des S 3.'},
 {g:2,t:'Sofortmaßnahmen zum Schutz der Bevölkerung veranlassen',w:'Das Veranlassen von Sofortmaßnahmen zum Schutz der Bevölkerung ist Aufgabe des S 3.'},
 {g:3,t:'Verpflegung bereitstellen und zuführen',w:'Bereitstellen und Zuführen der Verpflegung ist Aufgabe des S 4.'},
 {g:3,t:'Unterkünfte für Einsatzkräfte bereitstellen',w:'Das Bereitstellen von Unterkünften für Einsatzkräfte ist Aufgabe des S 4.'},
 {g:3,t:'Löschmittel und Kraftstoffe bereitstellen',w:'Verbrauchsgüter und Einsatzmittel wie Löschmittel und Kraftstoffe stellt der S 4 bereit.'},
 {g:3,t:'Materialerhaltung für das Gerät sicherstellen',w:'Die Materialerhaltung für das Gerät sichert der S 4.'},
 {g:4,t:'Presse- und Medieninformationen erstellen',w:'Das Erstellen von Presse- und Medieninformationen gehört zur Presse- und Medienarbeit des S 5.'},
 {g:4,t:'VOST einsetzen',w:'Der Einsatz von VOST ist Aufgabe des S 5.'},
 {g:4,t:'Presse- und Medienkonferenzen vorbereiten und durchführen',w:'Vorbereitung und Durchführung von Presse- und Medienkonferenzen gehören zum S 5.'},
 {g:4,t:'Presse- und Medienvertreter informieren und führen',w:'Das gehört zur Presse- und Medienbetreuung des S 5.'},
 {g:5,t:'Fernmeldeorganisation planen',w:'Die Planung der Fernmeldeorganisation ist Aufgabe des S 6.'},
 {g:5,t:'Kommunikationskonzept erstellen',w:'Das Kommunikationskonzept gehört zum S 6.'},
 {g:5,t:'Einsatzabschnitte und Untereinsatzabschnitte eindeutig bezeichnen',w:'Die eindeutige Bezeichnung der EAs und UEAs ist Teil des Kommunikationskonzepts des S 6.'},
 {g:5,t:'IuK-Technik bereitstellen und in Betrieb nehmen',w:'Bereitstellung und Inbetriebnahme der erforderlichen IuK-Technik ist Aufgabe des S 6.'}
];
const EL=[
 {n:'Einsatzleiter',t:'Verantwortung und Befehlsgewalt',s:'Gesamtverantwortung, operative Einsatzdurchführung, Zusammenarbeit mit dem Krisenstab, Befehlsgewalt'},
 {n:'Leiter des Stabes',t:'Koordination im Stab',s:'Zusammenarbeit der Sachgebiete, Personalzuweisung, Vertretung des Einsatzleiters, Rückkehr zur Regeleinsatzorganisation und Nachbereitung'}
];
const ELCARDS=[
 {g:0,t:'Trägt die Gesamtverantwortung für die Einsatzdurchführung im operativ-taktischen Bereich',w:'Das ist Aufgabe des Einsatzleiters.'},
 {g:0,t:'Koordiniert die gesamte operative Einsatzdurchführung',w:'Das ist Aufgabe des Einsatzleiters.'},
 {g:0,t:'Koordiniert die Zusammenarbeit mit dem Krisenstab',w:'Die Zusammenarbeit mit dem Krisenstab koordiniert der Einsatzleiter.'},
 {g:0,t:'Hat die Befehlsgewalt über alle unterstellten Einsatzkräfte der nichtpolizeilichen Gefahrenabwehr in seinem Zuständigkeitsbereich',w:'Die Befehlsgewalt liegt beim Einsatzleiter.'},
 {g:1,t:'Koordiniert die Zusammenarbeit der Sachgebiete',w:'Das ist Aufgabe des Leiters des Stabes.'},
 {g:1,t:'Weist Personal den Sachbereichen zu',w:'Die Zuweisung von Personal zu Sachbereichen gehört zum Leiter des Stabes.'},
 {g:1,t:'Vertritt den Einsatzleiter bei Abwesenheit',w:'Die Abwesenheitsvertretung des Einsatzleiters ist Aufgabe des Leiters des Stabes.'},
 {g:1,t:'Koordiniert die Rückkehr zur Regeleinsatzorganisation und die Einsatznachbereitung',w:'Das koordiniert der Leiter des Stabes.'}
];
const CFG={sg:{tg:SG,cards:CARDS,name:'Sachgebiet'},el:{tg:EL,cards:ELCARDS,name:'Aufgabenträger'}};
const MERGE=[{i:3,txt:'S 4 mit S 1'},{i:1,txt:'S 2 mit S 3'},{i:4,txt:'S 5 zu S 2'},{i:5,txt:'S 6 zu S 3'}];
const MERGETXT='S 4 mit S 1, S 2 mit S 3, S 5 zu S 2, S 6 zu S 3';
const ZQ=[
 {q:'S 4 wird bei zu wenig Personal zusammengefasst mit …',who:3,a:0},
 {q:'S 2 wird bei zu wenig Personal zusammengefasst mit …',who:1,a:2},
 {q:'S 5 wird bei zu wenig Personal zugeschlagen zu …',who:4,a:1},
 {q:'S 6 wird bei zu wenig Personal zugeschlagen zu …',who:5,a:2},
 {q:'Mit S 1 wird bei zu wenig Personal zusammengefasst …',who:0,a:3}
];

/* ---------- Fachdaten Vordruck ---------- */
const FARBEN=[{id:'W',n:'Weiß'},{id:'R',n:'Rot'},{id:'G',n:'Gelb'},{id:'N',n:'Grün'}];
const OPT={
 A:'Verbleibt beim Verfasser',
 B:'Verbleibt bei der Nachweisung',
 C:'Nachweisung, dann S 2',
 D:'Nachweisung, dann zurück an den Verfasser',
 E:'Direkt an S 2',
 F:'Inhaltsbezogene Vergabe (ggf. Kopien)'
};
const WEGE=['Eingang','Ausgang','Gesprächsnotiz'];
const TAB={
 Eingang:{W:'F',R:'E',G:'B',N:'F'},
 Ausgang:{W:'A',R:'C',G:'B',N:'D'},
 'Gesprächsnotiz':{W:'A',R:'C',G:'B',N:'F'}
};
const EXPL={
 Eingang:{W:'Eingang, Weiß: inhaltsbezogene Vergabe, bei Bedarf werden Kopien erstellt.',R:'Eingang, Rot: geht immer an S 2.',G:'Eingang, Gelb: geht an die Nachweisung.',N:'Eingang, Grün: inhaltsbezogene Vergabe, bei Bedarf werden Kopien erstellt.'},
 Ausgang:{W:'Ausgang, Weiß: verbleibt beim Verfasser.',R:'Ausgang, Rot: wird von der Nachweisung bearbeitet, danach immer an S 2.',G:'Ausgang, Gelb: verbleibt bei der Nachweisung.',N:'Ausgang, Grün: wird von der Nachweisung bearbeitet, danach immer zurück an den Verfasser.'},
 'Gesprächsnotiz':{W:'Gesprächsnotiz, Weiß: verbleibt beim Verfasser.',R:'Gesprächsnotiz, Rot: wird von der Nachweisung bearbeitet, danach immer an S 2.',G:'Gesprächsnotiz, Gelb: verbleibt bei der Nachweisung.',N:'Gesprächsnotiz, Grün: inhaltsbezogene Vergabe, bei Bedarf werden Kopien erstellt.'}
};
const WEGINFO={
 Eingang:'Eingang: Annahme durch die IuK, Weitergabe aller Vordrucke an den Sichter. Der Sichter erstellt den Verteilungsplan.',
 Ausgang:'Ausgang: Das Schreiben ist verfasst und geht ab.',
 'Gesprächsnotiz':'Gesprächsnotiz: Ein Gespräch wird auf dem Vordruck festgehalten.'
};
/* Beispielmeldungen sind frei formuliert (nicht aus den Lernseiten); es zählt nur der Weg des Vordrucks. */
const MSGS=[
 {w:'Eingang',t:'Per Funk meldet der Einsatzabschnitt Nord bei der IuK: Wasserversorgung steht, zwei weitere Trupps werden angefordert.'},
 {w:'Eingang',t:'Die Polizei teilt telefonisch bei der IuK mit, dass die Zufahrt im Südwesten des Schadengebiets gesperrt ist.'},
 {w:'Eingang',t:'Die Leitstelle meldet über die IuK, dass die angeforderte Unterstützung aus der Nachbarstadt unterwegs ist.'},
 {w:'Eingang',t:'Ein Fachberater schickt über die IuK seine schriftliche Einschätzung zur Standsicherheit des Gebäudes an den Stab.'},
 {w:'Ausgang',t:'Der S 3 verfasst einen Befehl an den Einsatzabschnitt Süd. Das Schreiben geht ab.'},
 {w:'Ausgang',t:'Der S 1 schreibt eine Anforderung weiterer Einsatzkräfte an die Leitstelle. Das Schreiben geht ab.'},
 {w:'Ausgang',t:'Der S 2 verfasst eine Meldung an eine vorgesetzte Stelle. Das Schreiben geht ab.'},
 {w:'Ausgang',t:'Der S 4 schreibt eine Anweisung zur Verpflegung an den Bereitstellungsraum. Das Schreiben geht ab.'},
 {w:'Gesprächsnotiz',t:'Der Einsatzleiter telefoniert mit dem Betreiber des Objekts und hält dessen Auskunft schriftlich fest.'},
 {w:'Gesprächsnotiz',t:'Der S 5 spricht vor Ort mit einem Pressevertreter und notiert dessen Fragen.'},
 {w:'Gesprächsnotiz',t:'Der S 3 bespricht mündlich mit dem Einsatzabschnitt eine geänderte Aufstellung und notiert das Ergebnis.'},
 {w:'Gesprächsnotiz',t:'Der S 6 klärt telefonisch mit der Leitstelle die Funkkanäle und notiert das Ergebnis.'}
];

/* ---------- Zustand ---------- */
let tab=store.last.tab==='vor'?'vor':'stab';
let mode='sg';
let less=false;
const A={sg:null,el:null};
let Z=null,V=null;

function newAssign(kind,len){
 const cfg=CFG[kind];let ids;
 if(kind==='sg'){
  len=len===24?24:12;
  ids=[];for(let g=0;g<6;g++){const mine=shuf(cfg.cards.map((c,i)=>i).filter(i=>cfg.cards[i].g===g));ids.push(...(len===24?mine:mine.slice(0,2)));}
  ids=shuf(ids);
 }else{len=cfg.cards.length;ids=shuf(cfg.cards.map((c,i)=>i));}
 A[kind]={len,ids,placed:{},wrong:{},sel:ids[0],fb:null,flash:null,done:false,res:null};
}
function newZ(){Z={qs:shuf(ZQ),i:0,pick:null,score:0,miss:[],done:false,res:null};}
function newV(len){
 len=len===12?12:6;
 const ids=shuf(MSGS.map((m,i)=>i)).slice(0,len);
 V={len,ids,i:0,wegPick:null,ans:{},row:'W',log:[],done:false,res:null};
}
newAssign('sg',12);newAssign('el');newZ();newV(6);

/* ---------- Zuordnen ---------- */
function place(kind,cid,tgt){
 const st=A[kind],cfg=CFG[kind],card=cfg.cards[cid];
 if(st.done||st.placed[cid]!==undefined)return;
 const tn=cfg.tg[tgt].n;
 if(tgt===card.g){
  st.placed[cid]=tgt;st.flash=null;
  st.fb={ok:true,html:'<b>Richtig:</b> „'+esc(card.t)+'“ gehört zum '+(kind==='sg'?'Sachgebiet ':'')+esc(tn)+'. '+esc(card.w)};
  const rest=st.ids.filter(i=>st.placed[i]===undefined);
  if(!rest.length){finishAssign(kind);return;}
  const pos=st.ids.indexOf(cid);let nx=null;
  for(let k=1;k<=st.ids.length;k++){const j=st.ids[(pos+k)%st.ids.length];if(st.placed[j]===undefined){nx=j;break;}}
  st.sel=nx;
 }else{
  st.wrong[cid]=(st.wrong[cid]||0)+1;st.sel=cid;st.flash=tgt;
  st.fb={ok:false,html:'<b>Nicht richtig:</b> „'+esc(card.t)+'“ gehört nicht zum '+(kind==='sg'?'Sachgebiet ':'')+esc(tn)+(kind==='sg'?' ('+esc(cfg.tg[tgt].t)+')':'')+'. Dort geht es um: '+esc(cfg.tg[tgt].s)+'. Versuche ein anderes Feld.'};
 }
}
function finishAssign(kind){
 const st=A[kind],n=st.ids.length;
 const first=st.ids.filter(i=>!st.wrong[i]).length;
 const p=pct(first,n);const bk=kind==='sg'?'sg'+st.len:'el';
 const old=setBest(bk,p);
 st.done=true;st.sel=null;st.fb=null;st.flash=null;
 st.res={first,n,p,msg:bestTxt(bk,old,p),errs:st.ids.filter(i=>st.wrong[i]).reduce((s,i)=>s+st.wrong[i],0)};
}

/* ---------- Render: Kopf und Navigation ---------- */
const ICON={
 stab:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="15" width="6" height="5" rx="1"/><rect x="15" y="15" width="6" height="5" rx="1"/><path d="M12 8v3M6 15v-4h12v4"/></svg>',
 vor:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
};
function renderHead(){
 const t=tab==='stab';
 $('#hdr').innerHTML='<small>IdF Münster · Stabsarbeit</small><h1>'+(t?'Stab aufbauen':'Vordruck-Trainer')+'</h1><p>'+(t?'Aufgabe antippen, dann Sachgebiet antippen (mit der Maus auch ziehen).':'Wohin geht welcher Durchschlag des Vierfach-Nachrichtenvordrucks?')+'</p>';
 $('#nav').innerHTML=['stab','vor'].map(k=>'<button type="button" data-a="tab" data-v="'+k+'" class="'+(tab===k?'on':'')+'"'+(tab===k?' aria-current="page"':'')+'>'+ICON[k]+(k==='stab'?'Stab aufbauen':'Vordruck-Trainer')+'</button>').join('');
}

/* ---------- Render: Stab ---------- */
function seg(items,cur,act){return '<div class="seg" role="group">'+items.map(i=>'<button type="button" data-a="'+act+'" data-v="'+i[0]+'" class="'+(String(cur)===String(i[0])?'on':'')+'" aria-pressed="'+(String(cur)===String(i[0]))+'">'+i[1]+'</button>').join('')+'</div>';}

function renderAssign(kind){
 const st=A[kind],cfg=CFG[kind],n=st.ids.length;
 const placedN=st.ids.filter(i=>st.placed[i]!==undefined).length;
 let h='';
 if(kind==='sg'){
  h+='<div class="bar"><span>Umfang:</span>'+seg([[12,'12 Aufgaben'],[24,'Alle 24']],st.len,'len')+'<span>'+placedN+' von '+n+' zugeordnet</span></div>';
 }else{
  h+='<div class="bar"><span>Einsatzleiter oder Leiter des Stabes? '+placedN+' von '+n+' zugeordnet</span></div>';
 }
 if(st.done){
  const r=st.res;
  const miss=st.ids.filter(i=>st.wrong[i]);
  h+='<div class="res"><div class="big2">'+r.first+' von '+r.n+'</div><h2>beim ersten Versuch richtig ('+r.p+' %)</h2><p>'+esc(r.msg)+(r.errs?' Fehlversuche insgesamt: '+r.errs+'.':' Kein einziger Fehlversuch.')+'</p>';
  if(miss.length){h+='<p><b>Zum Wiederholen:</b></p><ul>'+miss.map(i=>'<li>'+esc(cfg.cards[i].t)+': '+esc(cfg.tg[cfg.cards[i].g].n)+'. '+esc(cfg.cards[i].w)+'</li>').join('')+'</ul>';}
  else h+='<p>Alle Aufgaben waren sofort am richtigen Platz.</p>';
  h+='<button type="button" class="btn" data-a="again">Nochmal (neue Zusammenstellung)</button></div>';
 }else{
  h+='<div class="pk">';
  if(st.sel!==null){h+='<div class="sel"><small>Gewählte Aufgabe – jetzt '+(kind==='sg'?'Sachgebiet':'Feld')+' antippen</small>'+esc(cfg.cards[st.sel].t)+'</div>';}
  else h+='<div class="sel"><small>Keine Aufgabe gewählt</small>Aufgabe antippen, dann '+(kind==='sg'?'Sachgebiet':'Feld')+' antippen.</div>';
  if(st.fb)h+='<div class="fb '+(st.fb.ok?'ok':'bad')+'" role="status">'+st.fb.html+'</div>';
  h+='</div>';
 }
 /* Felder */
 let f='';
 const fld=(i,extra,inner)=>{
  const t=cfg.tg[i];const items=st.ids.filter(c=>st.placed[c]===i);
  const cls='fld tgt'+(extra||'')+(st.flash===i&&!st.done?' bad':'')+(items.length&&!(st.flash===i)?' has':'')+(st.sel!==null&&!st.done?' armed':'');
  return '<button type="button" class="'+cls+'" data-a="tgt" data-t="'+i+'" data-tgt="'+i+'"><span class="n">'+esc(t.n)+'</span><span class="t">'+esc(t.t)+'</span>'+(inner||'')+(items.length?'<ul>'+items.map(c=>'<li class="'+(st.wrong[c]?'w':'')+'">'+esc(cfg.cards[c].t)+'</li>').join('')+'</ul>':'')+'</button>';
 };
 if(kind==='sg'){
  f+='<div class="grid"><div class="fld static el"><span class="n">Einsatzleitung</span><span class="t">Leiterin / Leiter</span></div>';
  for(let i=0;i<6;i++){
   const mg=MERGE.find(m=>m.i===i);
   f+='<div>'+fld(i,less&&mg?' dim':'',less&&mg?'<span class="m">'+mg.txt+'</span>':'')+'</div>';
  }
  f+='<div class="fld static el"><span class="n">Fachberaterin / Fachberater und Verbindungspersonen</span><span class="t">Die personelle Ausstattung wird an Umfang und Aufwand der Lage angepasst.</span></div></div>';
 }else{
  f+='<div class="grid">'+[0,1].map(i=>'<div>'+fld(i,' big')+'</div>').join('')+'</div>';
 }
 /* Pool */
 let p='';
 if(!st.done){
  const rest=st.ids.filter(i=>st.placed[i]===undefined);
  p+='<div class="hint">Noch zuzuordnen ('+rest.length+')</div><div class="pool">'+rest.map(i=>'<button type="button" class="card'+(st.sel===i?' on':'')+(st.wrong[i]?' w':'')+'" data-a="pick" data-v="'+i+'" data-card="'+i+'">'+esc(cfg.cards[i].t)+'</button>').join('')+'</div>';
 }
 if(kind==='sg'){
  const sw='<button type="button" class="sw" role="switch" aria-checked="'+less+'" data-a="less"><span>Weniger Personal</span><span class="tg"></span></button>';
  const info=less?'<div class="fb">Zusammenfassung bei zu wenig Personal: '+MERGETXT+'.</div><button type="button" class="btn alt" data-a="mode" data-v="zl">Zusammenlegung üben</button>':'';
  if(window.matchMedia&&matchMedia('(min-width:900px)').matches){
   return h+'<div class="asg two"><div>'+f+'<div style="margin-top:8px">'+sw+info+'</div></div><div class="poolcol">'+p+'</div></div>';
  }
  return h+'<div class="asg">'+f+sw+info+p+'</div>';
 }
 if(window.matchMedia&&matchMedia('(min-width:900px)').matches)return h+'<div class="asg two"><div>'+f+'</div><div class="poolcol">'+p+'</div></div>';
 return h+'<div class="asg">'+f+p+'</div>';
}

function renderZ(){
 let h='';
 if(Z.done){
  const n=Z.qs.length;
  h+='<div class="res"><div class="big2">'+Z.score+' von '+n+'</div><h2>Zusammenlegungen richtig ('+Z.res.p+' %)</h2><p>'+esc(Z.res.msg)+'</p><p>Bei zu wenig Personal gilt: '+MERGETXT+'.</p><button type="button" class="btn" data-a="zagain">Nochmal</button><button type="button" class="btn alt" data-a="mode" data-v="sg">Zurück zu den Sachgebieten</button></div>';
  return h;
 }
 const q=Z.qs[Z.i];
 h+='<div class="bar"><span>Frage '+(Z.i+1)+' von '+Z.qs.length+'. Tipp: Der Schalter „Weniger Personal“ unter „Sachgebiete“ zeigt die Zusammenlegungen.</span></div>';
 h+='<div class="q"><small>Weniger Personal</small>'+esc(q.q)+'</div><div class="opts">';
 SG.forEach((s,i)=>{
  if(i===q.who)return;
  let c='opt';if(Z.pick!==null){if(i===q.a)c+=' ok';else if(i===Z.pick)c+=' bad';}
  h+='<button type="button" class="'+c+'" data-a="zpick" data-v="'+i+'"'+(Z.pick!==null?' disabled':'')+'><b>'+s.n+'</b>'+esc(s.t)+'</button>';
 });
 h+='</div>';
 if(Z.pick!==null){
  const ok=Z.pick===q.a;
  h+='<div class="fb '+(ok?'ok':'bad')+'" role="status">'+(ok?'<b>Richtig.</b> ':'<b>Nicht richtig.</b> ')+'Zusammenfassung bei zu wenig Personal: '+MERGETXT+'.</div>';
  h+='<button type="button" class="btn" data-a="znext">'+(Z.i+1<Z.qs.length?'Weiter':'Auswertung')+'</button>';
 }
 return h;
}

/* ---------- Render: Vordruck ---------- */
function curMsg(){return MSGS[V.ids[V.i]];}
function renderV(){
 let h='';
 if(V.done){
  const r=V.res;
  h+='<div class="res"><div class="big2">'+r.pts+' von '+r.max+' Punkten</div><h2>'+r.p+' % richtig</h2><p>'+esc(r.msg)+' Pro Meldung gibt es 1 Punkt für den Weg und je 1 Punkt für jeden der vier Durchschläge.</p>';
  h+='<div class="stat"><span>Weg richtig<b>'+r.weg+' von '+r.n+'</b></span>'+FARBEN.map(f=>'<span>'+f.n+'<b>'+r.col[f.id]+' von '+r.n+'</b></span>').join('')+'</div>';
  if(r.errs.length)h+='<p><b>Zum Wiederholen:</b></p><ul>'+r.errs.map(e=>'<li>„'+esc(e.t)+'“<br>'+e.items.map(esc).join('<br>')+'</li>').join('')+'</ul>';else h+='<p>Alles richtig verteilt.</p>';
  h+='<button type="button" class="btn" data-a="vagain" data-v="'+V.len+'">Nochmal (neue Meldungen)</button></div>';
  return h+table();
 }
 const m=curMsg();
 h+='<div class="bar"><span>Meldung '+(V.i+1)+' von '+V.ids.length+'</span>'+seg([[6,'6 Meldungen'],[12,'Alle 12']],V.len,'vlen')+'</div>';
 h+='<div class="msg"><small>Meldung kommt rein</small>'+esc(m.t)+'</div>';
 h+='<div class="hint">1. Welcher Weg des Vordrucks ist das?</div><div class="wg">'+WEGE.map(w=>{let c='';if(V.wegPick!==null){if(w===m.w)c='ok';else if(w===V.wegPick)c='bad';}return '<button type="button" class="'+c+'" data-a="weg" data-v="'+w+'"'+(V.wegPick!==null?' disabled':'')+'>'+w+'</button>';}).join('')+'</div>';
 if(V.wegPick===null)return h+table();
 const wok=V.wegPick===m.w;
 h+='<div class="fb '+(wok?'ok':'bad')+'" role="status"><b>'+(wok?'Richtig: ':'Nicht ganz: ')+'</b>'+(wok?'':'Das ist ein '+(m.w==='Gesprächsnotiz'?'e ':'')+esc(m.w)+'. ')+esc(WEGINFO[m.w])+'</div>';
 h+='<div class="hint">2. Was passiert mit jedem Durchschlag? (Durchschlag antippen, dann Ziel wählen)</div>';
 const tb=TAB[m.w];const allDone=FARBEN.every(f=>V.ans[f.id]);
 FARBEN.forEach(f=>{
  const a=V.ans[f.id];let c='d';if(a)c+=a.ok?' ok':' bad';else if(V.row===f.id)c+=' sel2';
  h+='<button type="button" class="'+c+'" data-a="row" data-v="'+f.id+'"><span class="l"><u class="'+f.id+'"></u>'+f.n+'<em>'+(a?(a.ok?'Richtig':'Falsch'):'Ziel wählen ›')+'</em></span>'+(a?'<span class="x">'+(a.ok?'':'Richtig wäre: <b>'+esc(OPT[tb[f.id]])+'</b>. ')+esc(EXPL[m.w][f.id])+'</span>':'')+'</button>';
 });
 if(!allDone){
  const fn=FARBEN.find(f=>f.id===V.row);
  h+='<div class="hint">Ziel für '+fn.n+'</div><div class="opts">'+Object.keys(OPT).map(k=>'<button type="button" class="opt" data-a="opt" data-v="'+k+'">'+esc(OPT[k])+'</button>').join('')+'</div>';
 }else{
  const pts=1*(wok?1:0)+FARBEN.filter(f=>V.ans[f.id].ok).length;
  h+='<div class="fb info" style="margin-top:8px">Diese Meldung: '+pts+' von 5 Punkten.</div><button type="button" class="btn" data-a="vnext">'+(V.i+1<V.ids.length?'Nächste Meldung':'Auswertung')+'</button>';
 }
 return h+table();
}
function table(){
 const rows=FARBEN.map(f=>'<tr><td>'+f.n+'</td>'+WEGE.map(w=>'<td>'+esc(OPT[TAB[w][f.id]])+'</td>').join('')+'</tr>').join('');
 return '<details><summary>Tabelle: Verbleib der Durchschläge</summary><div><table class="tbl"><tr><th>Farbe</th>'+WEGE.map(w=>'<th>'+w+'</th>').join('')+'</tr>'+rows+'</table></div></details>';
}

/* ---------- Gesamt ---------- */
const SCROLL={};
function render(){
 const main=$('#main');
 const key=tab==='stab'?'stab-'+mode:'vor';
 const prev=main.scrollTop;
 renderHead();
 let h='<div class="wrap">';
 if(tab==='stab'){
  h+=seg([['sg','Sachgebiete'],['zl','Weniger Personal'],['el','Einsatzleiter oder Leiter des Stabes']],mode,'mode');
  h+=mode==='sg'?renderAssign('sg'):mode==='el'?renderAssign('el'):renderZ();
 }else h+=renderV();
 main.innerHTML=h+'</div>';
 main.scrollTop=prev;
 main.dataset.k=key;
}
function toTop(){const m=$('#main');if(window.innerWidth<900)m.scrollTop=0;}

/* ---------- Vordruck-Logik ---------- */
function nextRow(){const f=FARBEN.find(f=>!V.ans[f.id]);V.row=f?f.id:V.row;}
function finishV(){
 const n=V.log.length;let pts=0,wegOk=0;const col={W:0,R:0,G:0,N:0};const errs=[];
 V.log.forEach(l=>{
  const m=MSGS[l.id];const it=[];
  if(l.wegOk){pts++;wegOk++;}else it.push('Weg: Das ist '+(m.w==='Gesprächsnotiz'?'eine ':'ein ')+m.w+'.');
  FARBEN.forEach(f=>{if(l.ans[f.id].ok){pts++;col[f.id]++;}else it.push(f.n+': '+OPT[TAB[m.w][f.id]]+'.');});
  if(it.length)errs.push({t:m.t,items:it});
 });
 const max=n*5,p=pct(pts,max);const bk='vor'+V.len;const old=setBest(bk,p);
 V.done=true;V.res={pts,max,p,n,weg:wegOk,col,errs,msg:bestTxt(bk,old,p)};
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click',e=>{
 if(Date.now()-dragT<150)return;
 const el=e.target.closest('[data-a]');if(!el)return;
 const a=el.dataset.a,v=el.dataset.v;
 switch(a){
  case 'tab':tab=v;store.last.tab=v;save();break;
  case 'mode':mode=v;if(v==='zl'&&Z.done)newZ();break;
  case 'less':less=!less;break;
  case 'len':newAssign('sg',+v);break;
  case 'again':newAssign(mode==='el'?'el':'sg',A[mode==='el'?'el':'sg'].len);toTop();break;
  case 'pick':{const st=A[mode];st.sel=+v;st.flash=null;toTop();break;}
  case 'tgt':{const st=A[mode];if(st.sel===null||st.done){st.fb={ok:false,html:'Erst eine Aufgabe unten antippen, dann das Feld.'};}else{place(mode,st.sel,+el.dataset.t);if(st.done)$('#main').scrollTop=0;}break;}
  case 'zpick':{if(Z.pick!==null)break;Z.pick=+v;const q=Z.qs[Z.i];if(Z.pick===q.a)Z.score++;else Z.miss.push(q.q);break;}
  case 'znext':{if(Z.i+1<Z.qs.length){Z.i++;Z.pick=null;}else{const p=pct(Z.score,Z.qs.length);const old=setBest('zl',p);Z.done=true;Z.res={p,msg:bestTxt('zl',old,p)};}$('#main').scrollTop=0;break;}
  case 'zagain':newZ();break;
  case 'weg':{if(V.wegPick!==null)break;V.wegPick=v;break;}
  case 'row':{if(!V.ans[v])V.row=v;break;}
  case 'opt':{const m=curMsg();const f=V.row;if(V.ans[f]||V.wegPick===null)break;V.ans[f]={pick:v,ok:v===TAB[m.w][f]};nextRow();break;}
  case 'vnext':{V.log.push({id:V.ids[V.i],wegOk:V.wegPick===curMsg().w,ans:V.ans});if(V.i+1<V.ids.length){V.i++;V.wegPick=null;V.ans={};V.row='W';}else finishV();$('#main').scrollTop=0;break;}
  case 'vagain':newV(+v);$('#main').scrollTop=0;break;
  case 'vlen':newV(+v);break;
  default:return;
 }
 render();
});

/* ---------- Ziehen mit Maus/Stift ---------- */
let dragT=0;
(function(){
 let d=null;
 document.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'||e.button!==0)return;
  const c=e.target.closest('[data-card]');if(!c||tab!=='stab')return;
  d={id:+c.dataset.card,x:e.clientX,y:e.clientY,on:false,g:null,over:null};
 });
 document.addEventListener('pointermove',e=>{
  if(!d)return;
  if(!d.on){if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<7)return;
   d.on=true;const st=A[mode];st.sel=d.id;
   const g=document.createElement('div');g.className='ghost';g.textContent=CFG[mode].cards[d.id].t;document.body.appendChild(g);d.g=g;}
  d.g.style.left=(e.clientX+12)+'px';d.g.style.top=(e.clientY+12)+'px';
  const t=document.elementFromPoint(e.clientX,e.clientY),f=t&&t.closest?t.closest('[data-tgt]'):null;
  if(d.over!==f){if(d.over)d.over.classList.remove('over');d.over=f;if(f)f.classList.add('over');}
 });
 const end=e=>{
  if(!d)return;const cur=d;d=null;
  if(!cur.on)return;
  cur.g.remove();if(cur.over)cur.over.classList.remove('over');
  dragT=Date.now();
  const t=document.elementFromPoint(e.clientX,e.clientY),f=t&&t.closest?t.closest('[data-tgt]'):null;
  if(f&&A[mode]&&!A[mode].done)place(mode,cur.id,+f.dataset.tgt);else A[mode].sel=cur.id;
  render();
 };
 document.addEventListener('pointerup',end);
 document.addEventListener('pointercancel',e=>{if(d&&d.on){d.g.remove();}d=null;});
})();

window.addEventListener('embtheme',()=>{});
render();
})();
