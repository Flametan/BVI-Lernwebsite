#!/usr/bin/env node
/* Prüft eine eingeschickte Jahrgangs-Datei und fasst sie zusammen.
   Aufruf:  node tools/pruefe-jahrgang.cjs <Datei.json> [--voll]
   --voll   gibt zusätzlich alle Texte zum Durchlesen aus.
   Ende mit Code 1, wenn die Datei nicht passt; Warnungen ändern den Code nicht. */
const fs=require('fs'), path=require('path');
const arg=process.argv.slice(2), file=arg.find(a=>!a.startsWith('--')), voll=arg.includes('--voll');
if(!file){ console.error('Aufruf: node tools/pruefe-jahrgang.cjs <Datei.json> [--voll]'); process.exit(2); }

const warn=[], fehler=[];
let j;
try{ j=JSON.parse(fs.readFileSync(file,'utf8')); }catch(e){ console.error('FEHLER: keine gültige JSON-Datei ('+e.message+')'); process.exit(1); }
if(!j||j.format!=='bvi-jahrgang'){ console.error('FEHLER: Das ist keine Jahrgangs-Datei (format "bvi-jahrgang" fehlt).'); process.exit(1); }

const TABS=['laufbahn','idf','feuak','vak','ibk'], PLAN=['ibk','vak','feuak','idf','idf2'], MODS=['GAL','SFS','HLFS','IBK','VAk','FeuAK','IdF'];
const arr=v=>Array.isArray(v)?v:[], str=v=>typeof v==='string'?v:'';
const KNOWN=['format','v','jahrgang','stand','plane','plan','aktiv','erg','pr','rel','ausg','termine','links','karten','orte','reiter','bilder','nrel','glow'];
Object.keys(j).filter(k=>!KNOWN.includes(k)).forEach(k=>warn.push('Unbekanntes Feld „'+k+'“ (wird von der App ignoriert)'));

// Verdächtige Texte: HTML, Skripte, Links
const texte=[];
const sehen=(wo,t)=>{ t=str(t); if(!t) return; texte.push([wo,t]);
  if(/[<>]/.test(t)) warn.push(wo+': enthält „<“ oder „>“ (HTML?) – '+JSON.stringify(t.slice(0,60)));
  if(/javascript:|onerror|onload|data:text/i.test(t)) warn.push(wo+': enthält etwas wie ein Skript – '+JSON.stringify(t.slice(0,60)));
  if(/https?:\/\/|www\./i.test(t)) warn.push(wo+': enthält einen Link – '+JSON.stringify((t.match(/(https?:\/\/|www\.)\S+/i)||[''])[0].slice(0,80)));
  if(t.length>5000) warn.push(wo+': sehr langer Text ('+t.length+' Zeichen)'); };
const dup=(wo,ids)=>{ const s=new Set(); ids.forEach(i=>{ if(s.has(i)) fehler.push(wo+': doppelte ID '+i); s.add(i); }); };

const zeilen=[];
const z=(...a)=>zeilen.push(a.join(' '));
z('Jahrgang:',str(j.jahrgang)||'(ohne Angabe)','· Stand:',str(j.stand)||'(ohne Angabe)');
const id=path.basename(file).replace(/^bvi-/,'').replace(/\.json$/,'');
if(/^BRef-\d\d-\d{4}_AB-\d\d-\d{4}$/.test(id)){
  const [b,a]=id.split('_'), lab='BRef '+b.slice(5,7)+'/'+b.slice(8)+' - AB '+a.slice(3,5)+'/'+a.slice(6);
  if(str(j.jahrgang)&&j.jahrgang!==lab) warn.push('Der Dateiname gehört zu „'+lab+'“, in der Datei steht „'+j.jahrgang+'“');
} else warn.push('Der Dateiname „'+path.basename(file)+'“ ist keine Jahrgangs-ID (BRef-MM-JJJJ_AB-MM-JJJJ.json)');

// Stundenpläne
const plane=j.plane||(j.plan?{idf:j.plan}:{});
const pl=PLAN.filter(k=>plane[k]&&arr(plane[k].ev).length);
z('Stundenpläne:',pl.length?pl.map(k=>{ const ev=arr(plane[k].ev), t=ev.map(e=>+e.s).filter(Number.isFinite); const d=x=>new Date(x).toISOString().slice(0,10);
  ev.forEach((e,i)=>{ sehen('Plan '+k+' Termin '+(i+1)+' Titel',e.t); sehen('Plan '+k+' Termin '+(i+1)+' Raum',e.r); sehen('Plan '+k+' Termin '+(i+1)+' Notiz',e.n); if(!(+e.e>+e.s)) warn.push('Plan '+k+' Termin '+(i+1)+': Ende liegt nicht nach dem Beginn'); });
  return k+' ('+ev.length+' Termine'+(t.length?', '+d(Math.min(...t))+' bis '+d(Math.max(...t)):'')+')'; }).join(', '):'keine');
Object.keys(plane).filter(k=>!PLAN.includes(k)).forEach(k=>warn.push('Unbekannter Plan-Abschnitt „'+k+'“'));
if(j.aktiv&&!pl.includes(j.aktiv)) warn.push('„aktiv“ nennt „'+j.aktiv+'“, dafür gibt es keinen Plan');

// Ergänzungen und Kapitel
const erg=arr(j.erg); dup('Ergänzungen',erg.map(e=>e&&e.id));
const kap=erg.filter(e=>e&&e.typ==='kapitel'), txt=erg.filter(e=>e&&e.typ!=='kapitel');
const bilder=j.bilder&&typeof j.bilder==='object'?j.bilder:{};
z('Ergänzungen:',txt.length,'· eigene Kapitel:',kap.length);
erg.forEach(e=>{ const wo=(e.typ==='kapitel'?'Kapitel „':'Ergänzung „')+str(e.titel||e.id).slice(0,30)+'“ ('+str(e.seite)+')'; sehen(wo+' Titel',e.titel); sehen(wo+' Text',e.text);
  if(!/^v-[a-z0-9-]+$/.test(str(e.seite))) fehler.push(wo+': ungültige Seite');
  if(e.bild&&!bilder[e.bild]) warn.push(wo+': Bild „'+e.bild+'“ fehlt unter „bilder“'); });

// Prüfungen
const pr=j.pr||{}, hinzu=arr(pr.hinzu); dup('Prüfungen',hinzu.map(p=>p&&p.id));
const fr=hinzu.reduce((n,p)=>n+arr(p.fragen).length,0);
z('Eigene Prüfungen:',hinzu.length,'(zusammen',fr,'Fragen) · ausgeblendet:',arr(pr.weg).length);
hinzu.forEach(p=>{ const wo='Prüfung „'+str(p.titel).slice(0,30)+'“'; sehen(wo+' Titel',p.titel);
  if(!TABS.includes(p.tab)) fehler.push(wo+': unbekannter Reiter „'+p.tab+'“');
  const t={sc:0,mc:0,text:0}; arr(p.fragen).forEach((f,i)=>{ const k=f.typ==='mc'||f.typ==='text'?f.typ:'sc'; t[k]++; sehen(wo+' Frage '+(i+1),f.q); arr(f.o).forEach(o=>sehen(wo+' Frage '+(i+1)+' Antwort',o)); sehen(wo+' Frage '+(i+1)+' Antwort',f.a); sehen(wo+' Frage '+(i+1)+' Erklärung',f.e);
    if(k==='sc'&&!(Number.isInteger(f.c)&&f.c>=0&&f.c<arr(f.o).length)) warn.push(wo+' Frage '+(i+1)+': richtige Antwort fehlt oder liegt außerhalb'); });
  z('   ·',str(p.titel)+(p.seite?' (zu Seite '+p.seite+')':''),'–',arr(p.fragen).length,'Fragen (Single '+t.sc+', Multiple '+t.mc+', Freitext '+t.text+')'); });
const rel=j.rel||{}; if(Object.keys(rel).length) z('Klausurrelevanz geändert:',Object.keys(rel).map(k=>k+'='+(rel[k]?'ja':'nein')).join(', '));
z('Ausgeblendete Kapitel/Blöcke/Reiter:',arr(j.ausg).length);

// Termine, Link, Karten, Orte, Reiter
const tm=arr(j.termine); z('Klausurtermine:',tm.length?tm.map(t=>str(t.date)+' '+str(t.name)).join('; '):'keine'); tm.forEach(t=>{ sehen('Termin',t.name); if(!/^\d{4}-\d{2}-\d{2}$/.test(str(t.date))) fehler.push('Termin mit ungültigem Datum: '+t.date); });
const cl=j.links&&j.links.cloud;
if(cl){ z('Lehrgangs-Link:',str(cl.titel),'→',str(cl.url)); sehen('Link Titel',cl.titel); sehen('Link Hinweis',cl.hinweis);
  let h=''; try{ h=new URL(str(cl.url)).hostname; }catch(e){ fehler.push('Link ist keine gültige Adresse'); }
  if(!/^https:\/\//.test(str(cl.url))) fehler.push('Link beginnt nicht mit https://');
  if(/passwor|kennwort/i.test(str(cl.hinweis)+str(cl.titel))) warn.push('Im Link-Hinweis geht es um ein Passwort – bitte prüfen, dass keins drinsteht');
  if(h) warn.push('Link-Ziel prüfen: '+h); } else z('Lehrgangs-Link: keiner');
const ka=arr(j.karten); dup('Lernkarten',ka.map(k=>k&&k.id)); z('Lernkarten:',ka.length);
ka.forEach((k,i)=>{ sehen('Karte '+(i+1)+' Frage',k.q); sehen('Karte '+(i+1)+' Antwort',k.a); if(!MODS.includes(k.modul)) fehler.push('Karte '+(i+1)+': unbekanntes Modul „'+k.modul+'“'); });
const orte=j.orte||{}; z('Standorte:',Object.keys(orte).length?Object.keys(orte).map(k=>k+'='+orte[k]).join(', '):'Standard'); Object.values(orte).forEach(o=>sehen('Standort',o));
const re=arr(j.reiter); dup('Reiter',re.map(r=>r&&r.id)); z('Eigene Reiter:',re.length?re.map(r=>str(r.titel)+' (auf '+str(r.seite)+')').join('; '):'keine'); re.forEach(r=>{ sehen('Reiter',r.titel); sehen('Reiter Beschreibung',r.beschr); });

// Bilder
const bk=Object.keys(bilder); let kb=0;
bk.forEach(k=>{ const u=bilder[k]; kb+=Math.round(str(u).length*0.75/1024);
  if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(str(u))) warn.push('Bild „'+k+'“ hat kein erlaubtes Format (nur jpeg, png, webp)');
  else if(str(u).length>=700000) warn.push('Bild „'+k+'“ ist zu groß, die App ignoriert es'); });
z('Bilder:',bk.length,'(etwa',kb,'KB)');

console.log('Prüfung von',path.basename(file)+'\n'+'='.repeat(40)); zeilen.forEach(l=>console.log(l));
if(voll){ console.log('\nAlle Texte zum Durchlesen\n'+'-'.repeat(40)); texte.forEach(([w,t])=>console.log('['+w+']\n'+t+'\n')); }
console.log('\n'+(fehler.length?'FEHLER ('+fehler.length+'):\n - '+fehler.join('\n - ')+'\n':'Keine Fehler.')+(warn.length?'\nWARNUNGEN ('+warn.length+'):\n - '+[...new Set(warn)].join('\n - '):'\nKeine Warnungen.'));
process.exit(fehler.length?1:0);
