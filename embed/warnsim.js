/* ===== Warn-Simulation: Kette des Modularen Warnsystems (MoWaS) =====
   Fakten nur aus der Lernseite (Views: Warnung durch den Bund und MoWaS, Warnung im ZSKG und Warnkanäle, Warnstufen).
   Die Lagen, Bevölkerungsgruppen und Anteile sind freie Modellannahmen der Simulation. */
(function(){
"use strict";
var KEY="bvi_sim_warnsim";

/* ---------- Fachdaten ---------- */
var BED={hoch:"Extreme Gefahr",mittel:"Gefahr",niedrig:"Gefahreninformation"};
var STUFE={
 hoch:{n:"Hoch",bed:"Extreme Gefahr",send:"sofort",zeit:"sofort"},
 mittel:{n:"Mittel",bed:"Gefahr",send:"innerhalb von 10 min",zeit:"innerhalb von 10 min"},
 niedrig:{n:"Niedrig",bed:"Gefahreninformation",send:"keine Sendeverpflichtung",zeit:"ohne Sendeverpflichtung"}
};
var ORDER=["hoch","mittel","niedrig"];
var STAGES=["Gefahr erkennen und bewerten","Entscheidung zu warnen","Lage übermitteln","Warnmeldung erstellen","Warnmeldung übermitteln","Warnmeldung verbreiten","Bevölkerung: empfangen, interpretieren, reagieren"];

/* Warnkanäle (Warnmultiplikatoren) laut Lernseite; g = erreichte Bevölkerungsgruppe im Modell */
var KAN=[
 {id:"radio",n:"Radio und Fernsehen",s:"Medien",g:"home",info:"Lange Notstrompufferung, ggf. Empfang über Sat"},
 {id:"apps",n:"Warn-Apps",s:"NINA, KATWARN, BIWAPP",g:"app",info:"NINA, KATWARN, BIWAPP, www.warnung.bund.de"},
 {id:"cb",n:"Cell Broadcast",s:"Mobilfunknetzbetreiber",g:"phone",info:"Mobilfunknetzbetreiber"},
 {id:"kritis",n:"Kritische Infrastruktur",s:"z. B. Deutsche Bahn",g:"bahn",info:"Deutsche Bahn"},
 {id:"wmb",n:"Warnmittelbetreiber",s:"Infotafeln, lokale Systeme, Amateurfunk",g:"public",info:"Stadtinformationstafeln, lokale Warnsysteme, Amateurfunker"},
 {id:"sir",n:"Sirenenansteuerung (TETRA)",s:"zukünftiges Modul",fut:1,info:"Zukünftiges Modul"},
 {id:"dig",n:"Digitalradio / DAB+",s:"zukünftiges Modul (Automatic Safety Alert)",fut:1,info:"Zukünftiges Modul"},
 {id:"navi",n:"Navigationssysteme",s:"zukünftiges Modul",fut:1,info:"Zukünftiges Modul"}
];
var GRP={
 home:"Menschen zu Hause mit Radio oder Fernseher",
 app:"Smartphone-Nutzer mit installierter Warn-App",
 phone:"Alle Mobiltelefone im Gebiet, auch ohne App",
 bahn:"Reisende und Beschäftigte an Bahnanlagen",
 public:"Passanten an Infotafeln und Funkamateure"
};
var GKAN={home:"Radio und Fernsehen",app:"Warn-Apps",phone:"Cell Broadcast",bahn:"Kritische Infrastruktur (z. B. Deutsche Bahn)",public:"Warnmittelbetreiber"};

/* Lagen: l = richtige Stufe, w = Anteil der Gruppen (Summe 100, Modellannahme), key = Gruppen, die erreicht werden müssen */
var LAGEN=[
 {id:"kern",t:"Kernwaffe (Teilszenario)",ic:"☢",l:"hoch",
  tx:"Im Rahmen eines Konflikts ist in einem Nachbarkreis eine taktische Kernwaffe detoniert. Die radioaktive Wolke zieht auf das Stadtgebiet zu. Wer im Freien bleibt, ist unmittelbar in Lebensgefahr. Es ist Zivilschutz: Schutz der Bevölkerung vor Kriegseinwirkungen.",
  cue:"Unmittelbare Lebensgefahr für alle im Freien und jede Minute zählt: das ist eine extreme Gefahr.",
  w:{home:30,app:25,phone:30,bahn:5,public:10},key:["home","phone"]},
 {id:"chem",t:"Chemieunfall am Güterbahnhof",ic:"⚗",l:"hoch",
  tx:"Ein Kesselwagen ist am Güterbahnhof leckgeschlagen. Eine giftige Gaswolke breitet sich über Gleise und angrenzendes Wohngebiet aus. Einatmen führt innerhalb von Minuten zu schweren Vergiftungen.",
  cue:"Akute Vergiftungsgefahr innerhalb von Minuten: eine extreme Gefahr, die sofortiges Handeln der Bevölkerung verlangt.",
  w:{home:25,app:25,phone:30,bahn:15,public:5},key:["bahn","phone"]},
 {id:"deich",t:"Deichbruch bei Nacht",ic:"≈",l:"hoch",
  tx:"Es ist 3 Uhr nachts. Der Deich ist gebrochen, Wasser strömt in die Ortschaft. Die Menschen müssen Keller und Erdgeschosse sofort verlassen. Die meisten schlafen, Radio und Fernseher sind aus, die Handys liegen neben dem Bett.",
  cue:"Das Wasser ist bereits da und die Menschen müssen sofort fliehen: das ist eine extreme Gefahr.",
  w:{home:10,app:30,phone:50,bahn:0,public:10},key:["phone","app"]},
 {id:"terror",t:"Terrorlage in der Innenstadt",ic:"!",l:"hoch",
  tx:"Bewaffnete Täter bewegen sich zwischen Fußgängerzone und Hauptbahnhof und schießen auf Passanten. Die Täter sind flüchtig, die Lage ist unübersichtlich. Alle Menschen im Gebiet sind akut in Lebensgefahr.",
  cue:"Täter sind aktiv und flüchtig, Menschen sind akut in Lebensgefahr: eine extreme Gefahr.",
  w:{home:15,app:25,phone:30,bahn:15,public:15},key:["bahn","public","phone"]},
 {id:"hw",t:"Hochwasser: Pegel steigt",ic:"≈",l:"mittel",
  tx:"Seit zwei Tagen regnet es. Der Fluss steigt weiter, der Scheitel wird in etwa 12 Stunden erwartet. Tiefliegende Straßen und Keller werden voraussichtlich überflutet. Die Menschen haben Zeit, Vorkehrungen zu treffen.",
  cue:"Eine Gefährdung ist absehbar, es gibt aber noch Zeit für Schutzmaßnahmen und keine unmittelbare Lebensgefahr: Gefahr.",
  w:{home:35,app:30,phone:25,bahn:0,public:10},key:["home","app"]},
 {id:"brand",t:"Großbrand mit Rauchwolke",ic:"♨",l:"mittel",
  tx:"Eine Lagerhalle brennt. Die Rauchwolke zieht über einen Stadtteil, Reizstoffe in der Luft sind möglich, Messungen laufen. Es besteht eine Gefahr für Atemwege, aber keine unmittelbare Lebensgefahr. Anwohner sollen Fenster und Türen geschlossen halten.",
  cue:"Die Gefährdung ist da und verlangt Verhalten der Bevölkerung, ist aber nicht unmittelbar lebensbedrohlich: Gefahr.",
  w:{home:30,app:30,phone:30,bahn:0,public:10},key:["phone","app"]},
 {id:"strom",t:"Großflächiger Stromausfall",ic:"⚡",l:"mittel",
  tx:"Seit zwei Stunden ist in der Region der Strom ausgefallen, die Wiederherstellung ist unklar. Notstrom läuft, die Versorgung wird jedoch schwieriger. Die Bevölkerung soll Hinweise zum Verhalten bekommen. Radio und Fernsehen sind über lange Notstrompufferung weiter erreichbar.",
  cue:"Die Lage verschärft sich, ist aber keine unmittelbare Lebensgefahr: Gefahr.",
  w:{home:35,app:20,phone:35,bahn:10,public:0},key:["home","phone"]},
 {id:"rauch",t:"Rauchwolke abgezogen",ic:"i",l:"niedrig",
  tx:"Der Großbrand ist gelöscht, die Rauchwolke ist abgezogen, die Messwerte sind unauffällig. Anwohner fragen nach, ob Fenster wieder geöffnet werden dürfen. Es besteht keine Gefährdung mehr, die Bevölkerung soll nur informiert werden.",
  cue:"Es besteht keine Gefährdung mehr, die Meldung dient nur der Information: Gefahreninformation.",
  w:{home:35,app:40,phone:15,bahn:0,public:10},key:["app"]},
 {id:"pegel",t:"Pegel unter Meldegrenze",ic:"i",l:"niedrig",
  tx:"Der Fluss führt etwas mehr Wasser als sonst, bleibt aber deutlich unter der Meldegrenze. Eine Überflutung wird nicht erwartet. Die Behörde möchte die Bevölkerung nur über die Beobachtung der Lage informieren.",
  cue:"Keine Überflutung erwartet, keine Gefährdung: die Meldung ist eine reine Gefahreninformation.",
  w:{home:30,app:45,phone:15,bahn:0,public:10},key:["app"]},
 {id:"hinw",t:"Unbestätigter Hinweis",ic:"i",l:"niedrig",
  tx:"Bei der Polizei ist ein unbestätigter Hinweis auf einen möglichen Anschlag eingegangen. Es gibt keine konkrete Gefahr, die Hinweise werden geprüft. Die Bevölkerung soll um erhöhte Aufmerksamkeit gebeten werden.",
  cue:"Es gibt keine konkrete Gefahr, nur eine Information mit der Bitte um Aufmerksamkeit: Gefahreninformation.",
  w:{home:25,app:45,phone:20,bahn:10,public:0},key:["app"]}
];

/* Zuständigkeitsfragen (Schritt „Lage übermitteln“) */
var ZUST=[
 {q:"Wer stellt den Kommunen die Warninfrastruktur zur Warnung zur Verfügung?",o:["Der Bund","Das Land","Die örtliche Feuerwehr"],a:0,
  e:"§ 12 ZSKG: Der Bund stellt die Warninfrastruktur den Kommunen zur Warnung zur Verfügung."},
 {q:"Über welches System wird die Warnmeldung an die Warnkanäle übermittelt?",o:["Modulares Warnsystem (MoWaS)","NINA","Sirenenansteuerung über TETRA"],a:0,
  e:"Das Modulare Warnsystem (MoWaS) übermittelt die Warnmeldung an die Warnmultiplikatoren. NINA ist nur einer der Kanäle, die Sirenenansteuerung ist ein zukünftiges Modul."},
 {q:"Welche Aufgabe des Zivilschutzes nennt § 1 Abs. 2 ZSKG, um die es hier geht?",o:["Die Warnung der Bevölkerung","Die Brandverhütungsschau","Der Bau von Wohnhäusern"],a:0,
  e:"§ 1 Abs. 2 ZSKG zählt die Warnung der Bevölkerung ausdrücklich zum Zivilschutz."},
 {q:"Wer warnt im Auftrag des Bundes?",o:["Die Behörden der Länder","Der Deutsche Feuerwehrverband","Die Betreiber der Warn-Apps"],a:0,
  e:"Behörden der Länder warnen im Auftrag des Bundes, ergänzt durch Warnmittel des Katastrophenschutzes der Länder."},
 {q:"Was bedeutet Zivilschutz?",o:["Schutz der Bevölkerung vor Kriegseinwirkungen","Schutz der Bevölkerung vor Naturereignissen","Schutz von Gebäuden vor Brand"],a:0,
  e:"Zivilschutz ist der Schutz der Bevölkerung vor Kriegseinwirkungen (§ 1 ZSKG)."},
 {q:"Welche Stelle wirkt bei der Warnung der Bevölkerung mit und erfasst besondere Gefahren?",o:["Das BBK","Der Deutsche Feuerwehrverband","Das Bundesamt für Verfassungsschutz"],a:0,
  e:"Das BBK (Bundesamt für Bevölkerungsschutz und Katastrophenhilfe) wirkt bei der Warnung mit und erfasst die besonderen Gefahren."}
];

/* ---------- Hilfsfunktionen ---------- */
function $(s){return document.querySelector(s)}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function lage(id){for(var i=0;i<LAGEN.length;i++)if(LAGEN[i].id===id)return LAGEN[i]}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}}
function save(o){try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}

/* ---------- Zustand ---------- */
var S={screen:"start",mode:"ueben",queue:[],zq:[],idx:0,step:0,locked:false,tab:"sim",
 a:{bew:null,stufe:null,zust:null,kan:[]},res:[],cur:null,zorder:[]};

function startRun(mode,ids){
 S.mode=mode;S.queue=ids;S.zq=shuffle([0,1,2,3,4,5]);S.idx=0;S.res=[];S.screen="play";S.tab="sim";newLage();
}
function newLage(){
 S.step=0;S.locked=false;S.a={bew:null,stufe:null,zust:null,kan:[]};S.cur=null;
 S.zorder=shuffle([0,1,2]);
}
function pickSet(){
 var by={hoch:[],mittel:[],niedrig:[]};LAGEN.forEach(function(l){by[l.l].push(l.id)});
 var ids=[];ORDER.forEach(function(k){ids=ids.concat(shuffle(by[k]).slice(0,2))});
 return shuffle(ids);
}
function curZ(){return ZUST[S.zq[S.idx%S.zq.length]]}

/* ---------- Bewertung ---------- */
function evalKanaele(L){
 var sel=S.a.kan,reached={},reach=0,fut=[],k;
 sel.forEach(function(id){var c=KAN.filter(function(x){return x.id===id})[0];if(c.fut)fut.push(c.n);else reached[c.g]=1});
 Object.keys(L.w).forEach(function(g){if(reached[g])reach+=L.w[g]});
 var missing=L.key.filter(function(g){return !reached[g]});
 var needReach=L.l==="hoch"?80:0;
 var ok=!missing.length&&!fut.length&&reach>=needReach;
 var why=[];
 if(missing.length)why.push("Nicht erreicht, aber in dieser Lage wichtig: "+missing.map(function(g){return GRP[g]+" (Kanal: "+GKAN[g]+")"}).join("; ")+".");
 if(fut.length)why.push("Zukünftige Module ("+fut.join(", ")+") sind heute noch nicht nutzbar und erreichen niemanden.");
 if(L.l==="hoch"&&reach<needReach&&!missing.length)why.push("Bei extremer Gefahr soll die Bevölkerung möglichst vollständig erreicht werden. In diesem Modell sind mindestens 80 % nötig, erreicht wurden "+reach+" %.");
 if(ok)why.push(L.l==="hoch"?"Alle wichtigen Gruppen sind erreicht und die Reichweite ist bei extremer Gefahr ausreichend.":"Alle für diese Lage wichtigen Gruppen werden über die gewählten Kanäle erreicht.");
 return{ok:ok,reach:reach,reached:reached,missing:missing,fut:fut,why:why};
}
function finishLage(){
 var L=lage(S.queue[S.idx]),z=curZ(),a=S.a;
 var ev=evalKanaele(L);S.cur=ev;
 var r={id:L.id,pts:{bew:a.bew===L.l?1:0,stufe:a.stufe===L.l?1:0,zust:a.zust===z.a?1:0,kan:ev.ok?1:0},
  tx:{
   bew:(a.bew===L.l?"Richtig bewertet: ":"Gewählt „"+BED[a.bew]+"“, richtig ist „"+BED[L.l]+"“. ")+L.cue,
   stufe:(a.stufe===L.l?"Richtig: ":"Gewählt Warnstufe "+STUFE[a.stufe].n+", richtig ist "+STUFE[L.l].n+". ")+"Warnstufe "+STUFE[L.l].n+" = "+STUFE[L.l].bed+", Sendeverpflichtung: "+STUFE[L.l].send+".",
   zust:(a.zust===z.a?"Richtig. ":"Falsch (gewählt: "+z.o[a.zust]+"). ")+z.e,
   kan:ev.why.join(" ")},reach:ev.reach,chosen:a.stufe};
 S.res.push(r);S.step=4;
 if(S.mode!=="einzel"){/* Bestwerte nur bei vollständigen Läufen */}
}
function total(){var p=0,m=0;S.res.forEach(function(r){p+=r.pts.bew+r.pts.stufe+r.pts.zust+r.pts.kan;m+=4});return{p:p,m:m}}

/* ---------- Ansicht ---------- */
function chainBar(stage){
 var h='<div class="chain" aria-hidden="true">';
 for(var i=0;i<7;i++)h+='<i class="'+(i<stage?"d":i===stage?"c":"")+'"></i>';
 return h+'</div><div class="chainlab">Kette '+(Math.min(stage,6)+1)+' von 7: <b>'+STAGES[Math.min(stage,6)]+'</b></div>';
}
function lageCard(L){
 var n=S.queue.length;
 return '<div class="card lage"><div class="sub">Lage '+(S.idx+1)+' von '+n+' · '+(S.mode==="pruefung"?"Prüfung":S.mode==="einzel"?"Einzellage":"Üben")+'</div><div class="t">'+L.ic+' '+esc(L.t)+'</div><p>'+esc(L.tx)+'</p></div>';
}
function fb(ok,title,txt){return '<div class="fb '+(ok?"ok":"bad")+'"><b>'+title+'</b>'+esc(txt)+'</div>'}
function help(){return S.mode!=="pruefung"}

function viewStart(){
 var d=load(),b=function(k){return d[k]!=null?" · Bestwert "+d[k]+" %":""};
 return '<div class="card"><h3>Ablauf</h3><p>Sie sind die warnende Stelle. In jeder Lage durchlaufen Sie die Kette des Modularen Warnsystems: Gefahr bewerten, Entscheidung zu warnen, Lage übermitteln, Warnmeldung erstellen, übermitteln und verbreiten. Danach sehen Sie, wie die Bevölkerung erreicht wird.</p><p class="mut">Pro Lage 4 Punkte: Bewertung, Warnstufe, Zuständigkeit, Warnkanäle.</p></div>'
 +'<div class="card modes"><h3>Modus wählen</h3>'
 +'<button class="opt" data-a="start" data-m="ueben"><span><b>Üben</b><span class="s">6 Lagen, Rückmeldung nach jedem Schritt, Nachschlagen erlaubt'+b("bestUeben")+'</span></span></button>'
 +'<button class="opt" data-a="start" data-m="pruefung"><span><b>Prüfung</b><span class="s">6 Lagen, Auswertung erst am Ende, Nachschlagen gesperrt'+b("bestPruefung")+'</span></span></button>'
 +'<button class="opt" data-a="einzel"><span><b>Einzelne Lage wählen</b><span class="s">Eine der '+LAGEN.length+' Lagen gezielt üben</span></span></button></div>';
}
function viewEinzel(){
 var h='<div class="card"><h3>Lage wählen</h3>';
 LAGEN.forEach(function(l){h+='<button class="opt" data-a="start" data-m="einzel" data-id="'+l.id+'"><span><b>'+l.ic+' '+esc(l.t)+'</b></span></button>'});
 return h+'<button class="opt" data-a="home"><span><b>Zurück</b></span></button></div>';
}
function viewPlay(){
 var L=lage(S.queue[S.idx]),a=S.a,h=lageCard(L),st=S.step,z=curZ();
 if(st<4){var stage=st===0?0:st===1?1:st===2?2:3;h=chainBar(stage)+h}
 if(st===0){
  h+='<div class="card"><h3>1 · Gefahr erkennen und bewerten</h3><p>Wie bewerten Sie die Lage?</p>';
  ORDER.forEach(function(k){var c="opt"+(a.bew===k?" on":"");
   if(S.locked){c="opt"+(k===L.l?" ok":a.bew===k?" bad":"")}
   h+='<button class="'+c+'" data-a="bew" data-v="'+k+'"'+(S.locked?" disabled":"")+'><span><b>'+BED[k]+'</b></span></button>'});
  if(S.locked)h+=fb(a.bew===L.l,a.bew===L.l?"Richtig bewertet":"Anders zu bewerten","Richtig ist „"+BED[L.l]+"“. "+L.cue);
  h+='</div>';
 }else if(st===1){
  h+='<div class="card"><h3>2 · Entscheidung zu warnen</h3><p>Sie warnen. Welche Warnstufe setzen Sie?</p>';
  ORDER.forEach(function(k){var c="opt"+(a.stufe===k?" on":"");
   if(S.locked){c="opt"+(k===L.l?" ok":a.stufe===k?" bad":"")}
   h+='<button class="'+c+'" data-a="stufe" data-v="'+k+'"'+(S.locked?" disabled":"")+'><span><b>'+STUFE[k].n+'</b>'+(help()?'<span class="s">'+STUFE[k].bed+' · Sendeverpflichtung: '+STUFE[k].send+'</span>':'')+'</span></button>'});
  if(S.locked)h+=fb(a.stufe===L.l,a.stufe===L.l?"Richtig":"Falsche Warnstufe","Warnstufe "+STUFE[L.l].n+" = "+STUFE[L.l].bed+", Sendeverpflichtung: "+STUFE[L.l].send+". "+L.cue);
  h+='</div>';
 }else if(st===2){
  h+='<div class="card"><h3>3 · Lage übermitteln</h3><p>Die Lage geht an das Modulare Warnsystem. Zuständigkeit: '+esc(z.q)+'</p>';
  S.zorder.forEach(function(i){var c="opt"+(a.zust===i?" on":"");
   if(S.locked){c="opt"+(i===z.a?" ok":a.zust===i?" bad":"")}
   h+='<button class="'+c+'" data-a="zust" data-v="'+i+'"'+(S.locked?" disabled":"")+'><span><b>'+esc(z.o[i])+'</b></span></button>'});
  if(S.locked)h+=fb(a.zust===z.a,a.zust===z.a?"Richtig":"Falsch",z.e);
  h+='</div>';
 }else if(st===3){
  h+='<div class="card"><h3>4 bis 6 · Warnmeldung erstellen, übermitteln, verbreiten</h3><p>Warnstufe '+STUFE[a.stufe].n+' ist gesetzt. Wählen Sie die Warnkanäle, über die MoWaS die Meldung verbreiten soll (Mehrfachauswahl).</p><div class="chs">';
  KAN.forEach(function(c){var on=a.kan.indexOf(c.id)>=0;
   h+='<button class="opt'+(on?" on":"")+(c.fut?" fut":"")+'" data-a="kan" data-v="'+c.id+'" aria-pressed="'+on+'"><b>'+esc(c.n)+'</b><span class="s">'+esc(c.s)+'</span></button>'});
  h+='</div>';
  if(help())h+='<p class="mut" style="margin-top:8px">Tipp: Überlegen Sie, wer in dieser Lage erreicht werden muss. Gestrichelte Kanäle sind zukünftige Module.</p>';
  h+='</div>';
 }else{
  h+=viewResult(L);
 }
 return h;
}
function viewResult(L){
 var r=S.res[S.res.length-1],ev=S.cur,a=S.a,pts=r.pts.bew+r.pts.stufe+r.pts.zust+r.pts.kan;
 var cls=ev.reach>=80?"":ev.reach>=50?" mid":" low";
 var h=chainBar(6);
 var zt=a.stufe==="hoch"?"sofort":a.stufe==="mittel"?"innerhalb von 10 min":"ohne Sendeverpflichtung";
 var late="";
 if(a.stufe!==L.l){
  if(ORDER.indexOf(a.stufe)>ORDER.indexOf(L.l))late="Die Warnstufe war zu niedrig: "+(a.stufe==="mittel"?"Die Kanäle müssen erst innerhalb von 10 min senden, bei dieser Lage ist das zu spät.":"Es besteht keine Sendeverpflichtung, die Kanäle müssen die Meldung also nicht senden. Die Warnung kann ausbleiben.");
  else late="Die Warnstufe war höher als nötig: Die Sendeverpflichtung ("+STUFE[a.stufe].send+") ist für diese Lage nicht erforderlich.";
 }
 h+='<div class="card"><h3>Wirkung: Erreichbarkeit der Bevölkerung</h3><div class="big">'+ev.reach+' %</div>'
 +'<div class="meter'+cls+'"><div style="width:'+ev.reach+'%"></div></div>';
 Object.keys(L.w).forEach(function(g){if(!L.w[g])return;var ok=!!ev.reached[g],key=L.key.indexOf(g)>=0;
  h+='<div class="grp'+(ok?"":" no")+'"><span class="m">'+(ok?"✓":"✗")+'</span><span>'+esc(GRP[g])+(key?' <b>(in dieser Lage wichtig)</b>':'')+'<br><span class="mut">'+(ok?"erreicht über ":"nicht erreicht, Kanal: ")+esc(GKAN[g])+'</span></span><span class="w">'+L.w[g]+' %</span></div>'});
 h+='<p class="mut">Die Anteile der Gruppen sind eine Modellannahme dieser Simulation, keine amtlichen Zahlen.</p></div>';
 h+='<div class="card"><h3>Ablauf der Warnung</h3><ul class="tl">'
 +'<li><b>Warnmeldung erstellt</b>Warnstufe '+STUFE[a.stufe].n+' ('+STUFE[a.stufe].bed+')</li>'
 +'<li><b>Über MoWaS übermittelt</b>'+(a.kan.length?a.kan.map(function(id){return KAN.filter(function(c){return c.id===id})[0].n}).join(", "):"an keinen Kanal")+'</li>'
 +'<li><b>Verbreitet</b>Sendeverpflichtung: '+zt+'</li>'
 +'<li><b>Bevölkerung</b>empfängt, interpretiert, reagiert (siehe unten)</li></ul>'
 +(late?'<div class="fb bad">'+esc(late)+'</div>':'')+'</div>';
 h+='<div class="card"><h3>Auswertung dieser Lage: '+pts+' von 4 Punkten</h3>'+detailRows(r)+'</div>';
 return h;
}
function detailRows(r){
 var lab={bew:"Gefahr bewertet",stufe:"Warnstufe",zust:"Zuständigkeit",kan:"Warnkanäle"},h="";
 ["bew","stufe","zust","kan"].forEach(function(k){h+='<p><span class="k '+(r.pts[k]?"y":"n")+'">'+(r.pts[k]?"✓":"✗")+'</span><b>'+lab[k]+':</b> '+esc(r.tx[k])+'</p>'});
 return h;
}
function viewEnd(){
 var t=total(),pc=Math.round(100*t.p/t.m);
 var verdict=pc>=90?"Sehr gut: Sie warnen sicher und treffend.":pc>=70?"Gut, einige Punkte noch einmal ansehen.":"Noch Übungsbedarf: Stufen und Kanäle wiederholen.";
 var h='<div class="card lage"><div class="sub">Auswertung · '+(S.mode==="pruefung"?"Prüfung":S.mode==="einzel"?"Einzellage":"Üben")+'</div><div class="big">'+t.p+' von '+t.m+' Punkten ('+pc+' %)</div><p>'+verdict+'</p>'+bestLine()+'</div>';
 h+='<div class="card"><h3>Ihre Lagen mit Begründung</h3>';
 S.res.forEach(function(r){var L=lage(r.id),p=r.pts.bew+r.pts.stufe+r.pts.zust+r.pts.kan;
  h+='<details><summary>'+L.ic+' '+esc(L.t)+'<span class="pt">'+p+' / 4</span></summary><div class="in"><p class="mut">Richtige Warnstufe: '+STUFE[L.l].n+' ('+STUFE[L.l].bed+') · Reichweite '+r.reach+' %</p>'+detailRows(r)+'</div></details>'});
 return h+'</div>';
}
function bestLine(){
 var d=load();if(S.mode==="einzel")return"";
 var k=S.mode==="pruefung"?"bestPruefung":"bestUeben";return d[k]!=null?'<p class="mut">Bestwert in diesem Modus: '+d[k]+' %</p>':"";
}
function storeBest(){
 if(S.mode==="einzel")return;var t=total(),pc=Math.round(100*t.p/t.m),d=load(),k=S.mode==="pruefung"?"bestPruefung":"bestUeben";
 if(d[k]==null||pc>d[k])d[k]=pc;save(d);
}

/* Referenz: Kanäle, Stufen, Info */
function refKan(){
 var h='<div class="card"><h3>Warnkanäle (Warnmultiplikatoren)</h3><p class="mut">Der Bund stellt die Warninfrastruktur den Kommunen zur Warnung zur Verfügung (§ 12 ZSKG).</p><table><tr><th>Kanal</th><th>Beispiele / Hinweis</th></tr>';
 KAN.forEach(function(c){h+='<tr><td><b>'+esc(c.n.replace(" / DAB+",""))+'</b></td><td>'+esc(c.fut?"Zukünftiges Modul"+(c.id==="sir"?": Sirenenansteuerung TETRA":c.id==="dig"?": Digitalradio, DAB+ Automatic Safety Alert":": Navigationssysteme"):c.info)+'</td></tr>'});
 return h+'</table></div>';
}
function refStufen(){
 var h='<div class="card"><h3>Warnstufen</h3><table><tr><th>Stufe</th><th>Bedeutung</th><th>Sendeverpflichtung</th></tr>';
 ORDER.forEach(function(k){h+='<tr><td><b>'+STUFE[k].n+'</b></td><td>'+STUFE[k].bed+'</td><td>'+STUFE[k].send+'</td></tr>'});
 return h+'</table></div>';
}
function refInfo(){
 return '<div class="card"><h3>Kette des Modularen Warnsystems</h3><ul class="tl"><li><b>Ereignis / Lage</b>Gefahr erkennen und bewerten, Entscheidung zu warnen, Lage übermitteln</li><li><b>Modulares Warnsystem</b>Warnmeldung erstellen, übermitteln, verbreiten</li><li><b>Bevölkerung</b>empfangen, interpretieren, reagieren</li></ul></div>'
 +'<div class="card"><h3>Zuständigkeiten</h3><p>Zivilschutz = Schutz der Bevölkerung vor Kriegseinwirkungen. Die Warnung der Bevölkerung gehört nach § 1 Abs. 2 ZSKG dazu.</p><p>Behörden der Länder warnen im Auftrag des Bundes. Ergänzende Warnmittel stellt der Katastrophenschutz der Länder für den Zivilschutz.</p><p>Das BBK wirkt bei der Warnung mit und erfasst besondere Gefahren.</p><p>§ 12 ZSKG: Der Bund stellt die Warninfrastruktur den Kommunen zur Warnung zur Verfügung.</p></div>'
 +'<div class="card"><h3>Hinweis zur Simulation</h3><p class="mut">Die Lagen, die Bevölkerungsgruppen und ihre Anteile sind frei erfundene Modellannahmen. Fachlich aus der Lernseite stammen die Kette, die Warnstufen, die Warnkanäle und die Zuständigkeiten.</p></div>';
}
function lockMsg(){return '<div class="card"><p class="lock">Im Prüfungsmodus ist das Nachschlagen gesperrt. Es steht nach der Prüfung wieder zur Verfügung.</p></div>'}
function refAll(){return S.mode==="pruefung"&&S.screen==="play"?lockMsg():refStufen()+refKan()+refInfo()}

/* ---------- Rendern ---------- */
var mainScroll=0;
function bar(){
 if(S.screen==="start"||S.tab!=="sim")return"";
 if(S.screen==="einzel")return"";
 if(S.screen==="end")return '<button class="btn sec" data-a="home">Zum Start</button><button class="btn" data-a="again">Nochmal</button>';
 var st=S.step,a=S.a,lastL=S.idx>=S.queue.length-1,btn="";
 if(st<=2){
  var sel=st===0?a.bew:st===1?a.stufe:a.zust;
  if(S.locked)btn='<button class="btn" data-a="next">Weiter</button>';
  else btn='<button class="btn" data-a="ok"'+(sel==null?" disabled":"")+'>Bestätigen</button>';
 }else if(st===3)btn='<button class="btn" data-a="fire"'+(a.kan.length?"":" disabled")+'>Warnung auslösen</button>';
 else btn='<button class="btn" data-a="nextLage">'+(lastL?"Zur Auswertung":"Nächste Lage")+'</button>';
 return '<button class="btn sec" style="width:auto;padding:0 14px" data-a="home" aria-label="Abbrechen">Ende</button>'+btn;
}
function render(keepScroll){
 var m=$(".main");if(m)mainScroll=m.scrollTop;
 var content=S.screen==="start"?viewStart():S.screen==="einzel"?viewEinzel():S.screen==="end"?viewEnd():viewPlay();
 var sim=S.tab==="sim";
 var main=sim?content:S.tab==="kan"?(S.mode==="pruefung"&&S.screen==="play"?lockMsg():refKan()):S.tab==="stufen"?(S.mode==="pruefung"&&S.screen==="play"?lockMsg():refStufen()):(S.mode==="pruefung"&&S.screen==="play"?lockMsg():refInfo());
 var tabs=[["sim","Warnung"],["kan","Kanäle"],["stufen","Stufen"],["info","Info"]];
 $("#app").innerHTML='<div class="head"><small>Zivile Verteidigung</small><h1>Warn-Simulation</h1></div>'
  +'<div class="body"><div class="main" id="main">'+main+'</div><div class="side">'+(S.screen==="start"||S.screen==="einzel"?refStufen()+refKan():refAll())+'</div></div>'
  +(bar()?'<div class="bar">'+bar()+'</div>':'')
  +'<nav class="nav">'+tabs.map(function(t){return '<button data-a="tab" data-v="'+t[0]+'" class="'+(S.tab===t[0]?"on":"")+'">'+t[1]+'</button>'}).join("")+'</nav>';
 var mm=$("#main");if(mm)mm.scrollTop=keepScroll?mainScroll:0;
}

/* ---------- Ereignisse ---------- */
document.addEventListener("click",function(e){
 var t=e.target.closest("[data-a]");if(!t||t.disabled)return;
 var act=t.getAttribute("data-a"),v=t.getAttribute("data-v"),keep=false;
 if(act==="tab"){S.tab=v;render();return}
 if(act==="home"){S.screen="start";S.tab="sim";render();return}
 if(act==="einzel"){S.screen="einzel";S.tab="sim";render();return}
 if(act==="start"){var m=t.getAttribute("data-m"),id=t.getAttribute("data-id");startRun(m,id?[id]:pickSet());render();return}
 if(act==="again"){var mm=S.mode;if(mm==="einzel"){S.screen="einzel";render();return}startRun(mm,pickSet());render();return}
 if(act==="bew"){S.a.bew=v;keep=true}
 else if(act==="stufe"){S.a.stufe=v;keep=true}
 else if(act==="zust"){S.a.zust=+v;keep=true}
 else if(act==="kan"){var i=S.a.kan.indexOf(v);if(i>=0)S.a.kan.splice(i,1);else S.a.kan.push(v);keep=true}
 else if(act==="ok"){if(S.mode==="pruefung"){S.step++;S.locked=false}else{S.locked=true;keep=true}}
 else if(act==="next"){S.step++;S.locked=false}
 else if(act==="fire"){finishLage()}
 else if(act==="nextLage"){
  if(S.idx>=S.queue.length-1){S.screen="end";storeBest()}else{S.idx++;newLage()}
 }
 render(keep);
});
render();
})();
