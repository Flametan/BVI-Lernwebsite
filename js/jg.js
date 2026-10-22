/* ======================================================================
   JG – Jahrgänge und ihre Änderungen am Master
   Der Master (BRef 04/2025 – AB 04/2026) ist die App wie sie ausgeliefert wird. Jeder andere Jahrgang
   startet als 1:1-Kopie und legt nur seine Änderungen darüber:
     · veröffentlichte Ebene  jahrgaenge/<Jahrgang-ID>.json  (vom Betreuer ins Repository gelegt, nur lesen)
     · eigene Ebene          im Browser gespeichert (Ergänzungen, Prüfungen, Klausurrelevanz, eigener Plan)
   Datei-Format (Version 1), alles optional:
     { format:'bvi-jahrgang', v:1, jahrgang:'BRef 10/2026 - AB 10/2027', stand:'2027-01-12',
       plane:{ ibk|vak|feuak|idf|idf2 (IdF Gruppe 1/2) : { name, ev:[{s,e,t,r,n,ad}] } },  aktiv:'idf',
       erg:[{ id, seite, kap, typ:'text'|'sc'|'mc'|'kapitel', titel, text, o:[…], c:[…], erk, bild, ts }],   (sc/mc: text = Frage, o = Antworten, c = richtige Nummern)
       links:{ cloud:{ url, titel, hinweis } },  karten:[{ id, modul, q, a }],  kweg:[IDs gelöschter Lernkarten],  orte:{ ibk, vak, feuak, idf },  kuerzel:{ ibk, vak, feuak, idf } (eigene Kürzel statt IBK/VAk/FeuAK/IdF),  reiter:[{ id, seite, titel, beschr }] (eigene Reiter auf einer Übersichtsseite),
       pr:{ hinzu:[{ id, tab, seite (optional: gehört zu dieser Prüfungsseite), titel, fragen:[{ q, o:[…], c:0, e:'' }], ts }], weg:['v-…', …] },
       rel:{ '<pruefung-id>':true|false },  ausg:['v-seite|a|<kennung>', …]  (ausgeblendete Kapitel/Blöcke)
       bilder:{ '<bild-id>':'data:image/jpeg;base64,…' } }
====================================================================== */
const JG=(function(){
  const MASTER='BRef-04-2025_AB-04-2026', K='bvi_jg', PRE='bvi_jgd_', PUB='bvi_jgp_';
  const TABS=[['laufbahn','Laufbahnprüfung','Laufbahn'],['idf','IdF Münster','IdF'],['feuak','FeuAK Hamburg','FeuAK'],['vak','VAk Berlin','VAk'],['ibk','IBK Heyrothsberge','IBK']];
  const ALLTABS=TABS.map(t=>t[0]), PLANKEYS=['ibk','vak','feuak','idf','idf2'];   // Stundenpläne je Abschnitt; IdF hat je einen für Gruppe 1 (idf) und Gruppe 2 (idf2)
  const pad=n=>String(n).padStart(2,'0');
  let pub=null, pubImg={}, ver=0; const subs=[];
  const lsGet=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const lsSet=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} };

  // ── Liste der Jahrgänge: Beginn April und Oktober, bis zum neuesten, der heute schon begonnen hat ──
  // Die BRef beginnen ein Jahr vor den AB: zu BRef 04/2025 gehört AB 04/2026
  function list(now){
    now=now||new Date();
    const ly=now.getFullYear(), lm=now.getMonth()+1>=10?10:now.getMonth()+1>=4?4:-1;   // neuester Beginn ≤ heute
    const lastY=lm<0?ly-1:ly, lastM=lm<0?10:lm, out=[];
    for(let y=2025,m=4;y*100+m<=lastY*100+lastM;){
      const ab=y+1;
      out.push({id:'BRef-'+pad(m)+'-'+y+'_AB-'+pad(m)+'-'+ab,label:'BRef '+pad(m)+'/'+y+' - AB '+pad(m)+'/'+ab,start:y*100+m});
      if(m===4) m=10; else{ m=4; y++; }
    }
    return out.reverse();
  }
  const labelOf=id=>{ const j=list().find(x=>x.id===id); return j?j.label:String(id).replace(/_/g,' - ').replace(/-(\d\d)-/g,' $1/').replace(/-/g,'/'); };
  function current(){ const id=lsGet(K); return id&&/^BRef-\d\d-\d{4}_AB-\d\d-\d{4}$/.test(id)?id:MASTER; }
  const isMaster=()=>current()===MASTER;

  // ── Bilder (IndexedDB, damit der kleine Speicher des Browsers für Lernstand und Notizen frei bleibt) ──
  let _db=null;
  function db(){
    return _db||(_db=new Promise((ok,fail)=>{
      try{
        const r=indexedDB.open('bvi_img',1);
        r.onupgradeneeded=()=>r.result.createObjectStore('i');
        r.onsuccess=()=>ok(r.result); r.onerror=()=>fail(r.error);
      }catch(e){ fail(e); }
    }));
  }
  const tx=(mode,fn)=>db().then(d=>new Promise((ok,fail)=>{ const t=d.transaction('i',mode), s=t.objectStore('i'), rq=fn(s); t.oncomplete=()=>ok(rq&&rq.result); t.onerror=()=>fail(t.error); }));
  const img={
    put:(id,dataUrl)=>tx('readwrite',s=>s.put(dataUrl,id)),
    get:async id=>{ if(pubImg[id]) return pubImg[id]; try{ return await tx('readonly',s=>s.get(id)); }catch(e){ return null; } },
    del:id=>tx('readwrite',s=>s.delete(id)).catch(()=>{})
  };
  const okImg=u=>typeof u==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(u)&&u.length<700000;

  // ── Daten prüfen und bereinigen (Dateien von anderen sind nie vertrauenswürdig) ──
  const str=(v,n)=>String(v==null?'':v).slice(0,n);
  const idOk=v=>/^[A-Za-z0-9_-]{1,40}$/.test(String(v))?String(v):null;
  const KMOD=['GAL','SFS','HLFS','IBK','VAk','FeuAK','IdF'];
  const KEYOK=/^[a-z0-9]{1,12}(~\d{1,3})?$/, AUSOK=/^v-[a-z0-9-]{1,58}\|[abt]\|[a-z0-9]{1,12}(~\d{1,3})?$/;
  function clean(o){
    const out={v:1,plane:{},aktiv:null,erg:[],pr:{hinzu:[],weg:[]},rel:{},ausg:[],links:{},karten:[],kweg:[],orte:{},kuerzel:{},reiter:[]};
    if(!o||typeof o!=='object') return out;
    const planOf=pl=>{
      if(!pl||!Array.isArray(pl.ev)) return null;
      const ev=pl.ev.slice(0,3000).filter(e=>e&&Number.isFinite(+e.s)&&Number.isFinite(+e.e)&&+e.e>+e.s).map(e=>({s:+e.s,e:+e.e,t:str(e.t,140),r:str(e.r,60),n:str(e.n,140),ad:e.ad?1:0}));
      return ev.length?{name:str(pl.name,60)||'Eigener Plan',ev,at:Date.now()}:null;
    };
    PLANKEYS.forEach(k=>{ const pl=planOf(o.plane&&o.plane[k]); if(pl) out.plane[k]=pl; });
    if(!Object.keys(out.plane).length){ const old=planOf(o.plan); if(old) out.plane.idf=old; }   // ältere Dateien mit einem einzigen Plan
    out.aktiv=PLANKEYS.includes(o.aktiv)?o.aktiv:null;
    (Array.isArray(o.erg)?o.erg:[]).slice(0,300).forEach(e=>{
      const id=e&&idOk(e.id); if(!id||!str(e.seite,60).startsWith('v-')) return;
      const titel=str(e.titel,120).trim(), text=str(e.text,20000), typ=e.typ==='kapitel'?'kapitel':'text';
      const it={id,seite:str(e.seite,60),typ,kap:typ!=='kapitel'&&KEYOK.test(String(e.kap))?String(e.kap):null,titel,text,bild:e.bild&&idOk(e.bild)?String(e.bild):null,ts:Number.isFinite(+e.ts)?+e.ts:Date.now()};
      if(!titel&&!text&&!e.bild) return;
      if(typ==='kapitel'&&!titel) return;
      out.erg.push(it);
    });
    const pr=o.pr||{};
    (Array.isArray(pr.hinzu)?pr.hinzu:[]).slice(0,60).forEach(p=>{
      const id=p&&idOk(p.id); if(!id||!ALLTABS.includes(p.tab)) return;
      const fr=(Array.isArray(p.fragen)?p.fragen:[]).slice(0,300).map(f=>{
        const q=str(f&&f.q,600).trim(), e=str(f&&f.e,1200).trim(), typ=f&&(f.typ==='mc'||f.typ==='text')?f.typ:'sc';
        if(!q) return null;
        if(typ==='text'){ const a=str(f.a,2000).trim(); return a?{q,typ,o:[],c:-1,a,e}:null; }
        const raw=(Array.isArray(f.o)?f.o:[]).slice(0,6).map(x=>str(x,300).trim()), keep=[]; raw.forEach((x,i)=>{ if(x) keep.push(i); });
        const opts=keep.map(i=>raw[i]);
        if(opts.length<2) return null;
        if(typ==='mc'){ const c=[...new Set((Array.isArray(f.c)?f.c:[]).map(x=>keep.indexOf(+x)).filter(i=>i>=0))].sort((x,y)=>x-y); return c.length?{q,typ,o:opts,c,a:'',e}:null; }
        const c=keep.indexOf(+f.c); return c>=0?{q,typ,o:opts,c,a:'',e}:null;
      }).filter(Boolean);
      if(fr.length) out.pr.hinzu.push({id,tab:p.tab,seite:/^v-[a-z0-9-]{1,58}$/.test(String(p.seite))?String(p.seite):null,titel:str(p.titel,100).trim()||'Eigene Prüfung',fragen:fr,ts:Number.isFinite(+p.ts)?+p.ts:Date.now()});
    });
    out.pr.weg=(Array.isArray(pr.weg)?pr.weg:[]).slice(0,200).map(x=>str(x,60)).filter(x=>/^(v-[a-z0-9-]+|[A-Za-z0-9_-]+)$/.test(x));
    if(Array.isArray(o.ausg)) out.ausg=[...new Set(o.ausg.slice(0,600).map(x=>String(x)).filter(x=>AUSOK.test(x)))];
    (Array.isArray(o.reiter)?o.reiter:[]).slice(0,100).forEach(r=>{ const id=r&&idOk(r.id), s=String(r&&r.seite), t=str(r&&r.titel,60).trim(); if(id&&/^v-[a-z0-9-]{1,58}$/.test(s)&&t) out.reiter.push({id,seite:s,titel:t,beschr:str(r.beschr,140).trim(),ts:Number.isFinite(+r.ts)?+r.ts:Date.now()}); });
    const cl=o.links&&o.links.cloud; if(cl&&/^https:\/\/[^\s"'<>]{3,500}$/.test(String(cl.url))) out.links.cloud={url:String(cl.url),titel:str(cl.titel,60).trim(),hinweis:str(cl.hinweis,140).trim()};
    (Array.isArray(o.karten)?o.karten:[]).slice(0,300).forEach(k=>{ const id=k&&idOk(k.id), q=str(k&&k.q,600).trim(), a=str(k&&k.a,1500).trim(); if(id&&q&&a&&KMOD.includes(k.modul)) out.karten.push({id,modul:k.modul,q,a}); });
    if(Array.isArray(o.kweg)) out.kweg=[...new Set(o.kweg.slice(0,600).map(idOk).filter(Boolean))];   // gelöschte Lernkarten (Master-Karten und Karten des Jahrgangs, jeweils die ID der Karte)
    ['ibk','vak','feuak','idf'].forEach(k=>{ const v=str(o.kuerzel&&o.kuerzel[k],12).trim(); if(/^[A-Za-z0-9ÄÖÜäöüß.-]{1,12}$/.test(v)) out.kuerzel[k]=v; });
    ['ibk','vak','feuak','idf'].forEach(k=>{ const v=str(o.orte&&o.orte[k],40).replace(/[<>]/g,'').trim(); if(v) out.orte[k]=v; });
    if(o.rel&&typeof o.rel==='object'&&!Array.isArray(o.rel)) Object.keys(o.rel).slice(0,300).forEach(k=>{ if(/^(v-[a-z0-9-]+|[A-Za-z0-9_-]+)$/.test(k)&&k.length<=60) out.rel[k]=!!o.rel[k]; });
    return out;
  }
  const empty=()=>clean({});
  function local(id){ id=id||current(); try{ return clean(JSON.parse(lsGet(PRE+id)||'null')); }catch(e){ return empty(); } }
  // Verlauf zum Rückgängig-/Wiederholen-Machen: frühere Stände der eigenen Ebene des gewählten Jahrgangs, nur im Speicher
  const H={id:null,u:[],r:[]};
  const hist=id=>{ if(H.id!==id){ H.id=id; H.u=[]; H.r=[]; } return H; };
  const setRaw=(id,v)=>{ try{ if(v===null) localStorage.removeItem(PRE+id); else localStorage.setItem(PRE+id,v); }catch(e){} };
  function record(id,before,after){ if(before===after) return; const h=hist(id); h.u.push(before); if(h.u.length>50) h.u.shift(); h.r=[]; }
  function saveLocal(d,id){ id=id||current(); const next=JSON.stringify(d); record(id,lsGet(PRE+id),next); lsSet(PRE+id,next); changed(); }
  function undo(){ const id=current(), h=hist(id); if(!h.u.length) return false; h.r.push(lsGet(PRE+id)); setRaw(id,h.u.pop()); changed(); return true; }
  function redo(){ const id=current(), h=hist(id); if(!h.r.length) return false; h.u.push(lsGet(PRE+id)); setRaw(id,h.r.pop()); changed(); return true; }
  const canUndo=()=>hist(current()).u.length>0, canRedo=()=>hist(current()).r.length>0;
  function pubData(){ return pub||empty(); }

  // eigene und veröffentlichte Ebene zusammen (eigene gewinnt bei gleicher ID)
  function data(){
    if(isMaster()) return {plane:{},aktiv:null,erg:[],pr:{hinzu:[],weg:[]},rel:{},ausg:[],links:{},karten:[],kweg:[],orte:{},kuerzel:{},reiter:[]};   // der Master ist nicht veränderbar
    const p=pubData(), l=local(), byId=(a,b)=>{ const m=new Map(); [...a,...b].forEach(x=>m.set(x.id,x)); return [...m.values()]; };
    return {
      plane:{...p.plane,...l.plane},
      aktiv:l.aktiv||p.aktiv,
      erg:byId(p.erg,l.erg),
      pr:{hinzu:byId(p.pr.hinzu,l.pr.hinzu),weg:[...new Set([...p.pr.weg,...l.pr.weg])]},
      rel:{...p.rel,...l.rel},
      ausg:[...new Set([...p.ausg,...l.ausg])],
      links:{...p.links,...l.links},
      karten:byId(p.karten,l.karten),
      kweg:[...new Set([...p.kweg,...l.kweg])],
      orte:{...p.orte,...l.orte},
      kuerzel:{...p.kuerzel,...l.kuerzel},
      reiter:byId(p.reiter,l.reiter)
    };
  }
  // Klausurrelevanz gilt je Prüfung: Standard sind die hervorgehobenen Prüfungen des Masters (5. Eintrag) und eigene Prüfungen;
  // rel hält die Abweichungen {id:true|false}. Ein Reiter zählt, wenn mindestens eine Prüfung darin relevant ist.
  let exams=null;
  const setExams=e=>{ exams=e; };
  const rel=id=>{
    const o=data().rel; if(Object.prototype.hasOwnProperty.call(o,id)) return !!o[id];
    const it=exams&&exams.flatMap(x=>x[1]).find(x=>x[0]===id);
    return it?!!it[4]:true;
  };
  const examOf=id=>{ if(!exams) return null; for(let i=0;i<exams.length;i++){ const it=exams[i][1].find(x=>x[0]===id); if(it) return {tab:TABS[i][0],titel:it[1]}; } return null; };
  const glow=()=>{
    if(!exams) return new Set(ALLTABS);
    const d=data(), weg=new Set(d.pr.weg), g=new Set();
    exams.forEach(([,items],i)=>{ if(items.some(x=>!weg.has(x[0])&&rel(x[0]))) g.add(TABS[i][0]); });
    d.pr.hinzu.forEach(p=>{ if(rel(p.seite||p.id)) g.add(p.tab); });
    return g;
  };
  function changed(){ ver++; subs.forEach(f=>{ try{ f(); }catch(e){} }); }
  const on=f=>subs.push(f);

  async function load(){
    pub=null; pubImg={};
    const id=current();
    if(id===MASTER){ changed(); return; }   // der Master ist die App selbst
    try{
      const r=await fetch('jahrgaenge/'+id+'.json',{cache:'no-cache'});
      if(r.ok){ const j=await r.json(); pub=clean(j); Object.entries((j&&j.bilder)||{}).forEach(([k,v])=>{ if(idOk(k)&&okImg(v)) pubImg[k]=v; }); lsSet(PUB+id,JSON.stringify(j&&{...j,bilder:undefined})); }
    }catch(e){
      try{ const c=JSON.parse(lsGet(PUB+id)||'null'); if(c) pub=clean(c); }catch(x){}   // offline: letzter Stand
    }
    changed();
  }
  function set(id){
    if(!list().some(j=>j.id===id)&&id!==MASTER) return;
    lsSet(K,id); H.id=null;   // Wechsel des Jahrgangs: Verlauf beginnt neu
    pub=null; pubImg={}; changed(); load();
  }

  // ── Export und Import ──
  async function exportJson(){
    const d=data(), ids=new Set(d.erg.map(e=>e.bild).filter(Boolean)), bilder={};
    for(const i of ids){ const u=await img.get(i); if(okImg(u)) bilder[i]=u; }
    return JSON.stringify({format:'bvi-jahrgang',v:1,jahrgang:labelOf(current()),stand:new Date().toISOString().slice(0,10),
      plane:d.plane,aktiv:d.aktiv,erg:d.erg,pr:d.pr,rel:d.rel,ausg:d.ausg,links:d.links,karten:d.karten,kweg:d.kweg,orte:d.orte,kuerzel:d.kuerzel,reiter:d.reiter,bilder},null,1);
  }
  // Datei einlesen und zu den eigenen Änderungen hinzufügen; liefert Zahlen für die Rückmeldung
  async function importJson(text,mode){
    let j; try{ j=JSON.parse(text); }catch(e){ throw new Error('json'); }
    if(!j||j.format!=='bvi-jahrgang') throw new Error('format');
    const c=clean(j), l=mode==='replace'?empty():local(), have=new Set([...l.erg.map(e=>e.id)]), haveP=new Set(l.pr.hinzu.map(p=>p.id));
    let ne=0, np=0, ni=0;
    for(const [k,v] of Object.entries(j.bilder||{})){ if(idOk(k)&&okImg(v)&&ni<60){ await img.put(k,v); ni++; } }
    c.erg.forEach(e=>{ const i=l.erg.findIndex(x=>x.id===e.id); if(i>=0) l.erg[i]=e; else{ l.erg.push(e); } if(!have.has(e.id)) ne++; });
    c.pr.hinzu.forEach(p=>{ const i=l.pr.hinzu.findIndex(x=>x.id===p.id); if(i>=0) l.pr.hinzu[i]=p; else l.pr.hinzu.push(p); if(!haveP.has(p.id)) np++; });
    l.pr.weg=[...new Set([...l.pr.weg,...c.pr.weg])];
    Object.assign(l.rel,c.rel);
    l.ausg=[...new Set([...l.ausg,...c.ausg])];
    Object.assign(l.links,c.links); Object.assign(l.orte,c.orte); Object.assign(l.kuerzel,c.kuerzel);
    c.reiter.forEach(r=>{ const i=l.reiter.findIndex(x=>x.id===r.id); if(i>=0) l.reiter[i]=r; else l.reiter.push(r); });
    c.karten.forEach(k=>{ const i=l.karten.findIndex(x=>x.id===k.id); if(i>=0) l.karten[i]=k; else l.karten.push(k); });
    l.kweg=[...new Set([...l.kweg,...c.kweg])];
    let pl=0; Object.entries(c.plane).forEach(([k,v])=>{ l.plane[k]=v; pl+=v.ev.length; });
    if(c.aktiv) l.aktiv=c.aktiv;
    saveLocal(l);
    return {erg:ne,pruefungen:np,bilder:ni,plan:pl};
  }
  // Datei ansehen, ohne etwas zu ändern: Jahrgang der Datei und Umfang (für die Rückfrage beim Einlesen)
  function peek(text){
    let j; try{ j=JSON.parse(text); }catch(e){ return null; }
    if(!j||j.format!=='bvi-jahrgang') return null;
    const c=clean(j);
    return {label:str(j.jahrgang,60),erg:c.erg.length,pruefungen:c.pr.hinzu.length,plan:Object.keys(c.plane).length,reiter:c.reiter.length,karten:c.karten.length,geloescht:c.kweg.length};
  }
  const snapshot=()=>lsGet(PRE+current());
  // Alle eigenen Änderungen dieses Jahrgangs verwerfen (Rückgabe: vorheriger Stand zum Rückgängigmachen)
  function discard(){ const prev=lsGet(PRE+current()); record(current(),prev,null); try{ localStorage.removeItem(PRE+current()); }catch(e){} changed(); return prev; }
  function restore(prev){ if(prev){ record(current(),lsGet(PRE+current()),prev); lsSet(PRE+current(),prev); } changed(); }
  const hasLocal=()=>{ const l=local(); return !!(Object.keys(l.plane).length||l.aktiv||l.erg.length||l.pr.hinzu.length||l.pr.weg.length||Object.keys(l.rel).length||l.ausg.length||Object.keys(l.links).length||l.karten.length||l.kweg.length||Object.keys(l.orte).length||Object.keys(l.kuerzel).length||l.reiter.length); };

  return { MASTER, TABS, PLANKEYS, list, labelOf, current, isMaster, data, local, saveLocal, glow, rel, setExams, examOf, load, set, on, ver:()=>ver, img, okImg,
    exportJson, importJson, peek, snapshot, discard, restore, undo, redo, canUndo, canRedo, hasLocal, empty, newId:()=>'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6) };
})();
