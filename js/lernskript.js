/* ======================================================================
   LERNSKRIPT – Lernskript (Fließtext, Tabellen, Schemata) und Spickzettel zum Lesen am Handy
   Inhalt: js/lernskript-data.js (window.LSK_DATA = {ch:[Kapitel], sp:[Kapitel]}), Bilder in img/lernskript/
   Route in der Navigation (NAV.top().r): {k:'c'|'r', d:'ch'|'sp', c:Kapitelindex, i:Abschnittsindex}
   Wird beim ersten Öffnen nachgeladen (siehe lsLoad in app.js).
====================================================================== */
const LS=(function(){
  const KR='bvi_ls_read', KL='bvi_ls_last', KD='bvi_ls_doc';
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const data=()=>window.LSK_DATA||{ch:[],sp:[]};
  const jget=(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } };
  const jset=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  const DOC={ch:{n:'Lernskript',eb:'Lernskript'},sp:{n:'Spickzettel',eb:'Spickzettel'}};
  const curDoc=()=>jget(KD,'ch')==='sp'?'sp':'ch';
  const secKey=(d,c,i)=>{ const s=data()[d][c]?.secs[i]; return s?d+c+'.'+s.no:''; };
  const isRead=(d,c,i)=>!!jget(KR,{})[secKey(d,c,i)];
  function markRead(d,c,i){ const k=secKey(d,c,i); if(!k) return; const r=jget(KR,{}); if(!r[k]){ r[k]=1; jset(KR,r); } }
  const nRead=(d,c)=>{ const r=jget(KR,{}); return data()[d][c].secs.filter((s,i)=>r[d+c+'.'+s.no]).length; };
  const lastPos=()=>{ const l=jget(KL,null); return l&&data()[l.d]?.[l.c]?.secs[l.i]?l:null; };
  const chLabel=(d,c)=>{ const ch=data()[d][c]; return 'Kapitel '+ch.n+' · '+ch.t; };

  /* ── Übersicht (im Reiter „Lernskript“ der Prüfung-Seite und als Grundansicht von v-ls) ── */
  function chapterCards(d){
    return data()[d].map((ch,c)=>{
      const n=ch.secs.length, r=d==='ch'?nRead(d,c):0, pct=n?Math.round(r/n*100):0;
      return `<button type="button" class="ls-ch" onclick="LS.go('c','${d}',${c})"><span class="ls-no">${esc(ch.n)}</span><span class="ls-chx"><b>${esc(ch.t)}</b><span>${esc(ch.s)}</span><span class="ls-meta">${n} Abschnitte${d==='ch'?' · '+(r?r+' gelesen':'noch nicht gelesen'):''}</span>${d==='ch'?`<i class="ls-bar"><i style="width:${pct}%"></i></i>`:''}</span><span class="ls-go" aria-hidden="true">›</span></button>`;
    }).join('');
  }
  function homeHtml(){
    const d=curDoc(), l=lastPos();
    const docs=`<div class="ls-docs" role="tablist" aria-label="Dokument">${['ch','sp'].map(k=>`<button type="button" role="tab" class="${d===k?'on':''}" aria-selected="${d===k}" onclick="LS.doc('${k}')">${DOC[k].n}</button>`).join('')}</div>`;
    const cont=l&&l.d===d?`<button type="button" class="ls-cont" onclick="LS.go('r','${l.d}',${l.c},${l.i})"><span class="ls-ct">Weiterlesen</span><b>${esc(data()[l.d][l.c].secs[l.i].t)}</b><span>${esc(chLabel(l.d,l.c))}</span></button>`:'';
    return `${docs}<label class="ls-search"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" enterkeyhint="search" autocomplete="off" placeholder="${d==='ch'?'Im Lernskript suchen':'Im Spickzettel suchen'}" aria-label="Suchen" oninput="LS.find(this.value)"></label><div class="ls-res" hidden></div><div class="ls-main">${cont}<div class="ls-list">${chapterCards(d)}</div></div>`;
  }
  function home(el){
    if(!el) return;
    el.innerHTML=`<div class="ex-ph"><span>Lernskript</span></div><div class="ls-home">${homeHtml()}</div>`;
  }
  function refreshHome(){
    document.querySelectorAll('.ls-home').forEach(h=>{ h.innerHTML=homeHtml(); });
  }
  function doc(k){ jset(KD,k==='sp'?'sp':'ch'); refreshHome(); }

  /* ── Suche ── */
  let _idx={};
  function index(d){
    if(_idx[d]) return _idx[d];
    const tx=document.createElement('div');
    return _idx[d]=data()[d].flatMap((ch,c)=>ch.secs.map((s,i)=>{ tx.innerHTML=s.h.replace(/<\/(p|li|div|h4|span|b)>/g,' </$1>'); const t=tx.textContent.replace(/\s+/g,' ').trim(); return {c,i,t:s.t,x:t,l:(s.t+' '+t).toLowerCase()}; }));
  }
  function find(q){
    q=(q||'').trim().toLowerCase();
    document.querySelectorAll('.ls-home').forEach(h=>{
      const res=h.querySelector('.ls-res'), main=h.querySelector('.ls-main'); if(!res||!main) return;
      if(q.length<2){ res.hidden=true; main.hidden=false; return; }
      const d=curDoc(), words=q.split(/\s+/);
      const hits=index(d).filter(e=>words.every(w=>e.l.includes(w))).slice(0,40);
      res.hidden=false; main.hidden=true;
      res.innerHTML=hits.length?hits.map(e=>{
        const p=e.x.toLowerCase().indexOf(words[0]); let sn='';
        if(p>=0){ const a=Math.max(0,p-50); sn=(a?'…':'')+e.x.slice(a,p)+'\u0001'+e.x.slice(p,p+words[0].length)+'\u0002'+e.x.slice(p+words[0].length,p+words[0].length+80)+'…'; }
        sn=esc(sn).replace('\u0001','<mark>').replace('\u0002','</mark>');
        return `<button type="button" class="ls-hit" onclick="LS.go('r','${d}',${e.c},${e.i})"><b>${esc(e.t)}</b><span class="ls-meta">${esc(chLabel(d,e.c))}</span>${sn?`<span class="ls-sn">${sn}</span>`:''}</button>`;
      }).join(''):'<div class="m-note">Keine Treffer.</div>';
    });
  }

  /* ── Navigation ── */
  function label(k,d,c,i){ return k==='c'?'Kapitel '+data()[d][c].n:data()[d][c].secs[i].t; }
  function go(k,d,c,i){ i=i||0; NAV.go('v-ls',label(k,d,c,i),{k,d,c,i}); }
  function swap(k,d,c,i){ NAV.replace('v-ls',label(k,d,c,i),{k,d,c,i}); }

  /* ── Seite v-ls ── */
  const $=id=>document.getElementById(id);
  let _io=null;
  function hero(eb,ti,le){ $('ls-eb').textContent=eb; $('ls-ti').textContent=ti; $('ls-le').textContent=le||''; }
  function render(){
    closeSheet(); if(_io){ _io.disconnect(); _io=null; }
    const v=$('v-ls'), body=$('ls-body'); if(!v||!body) return;
    const top=NAV.top&&NAV.top(), r=top&&top.r;
    if(!r||!data()[r.d]?.[r.c]){ v.classList.remove('ls-reading'); hero('Prüfung','Lernskript','Lernskript und Spickzettel zum Lesen am Handy.'); body.innerHTML=`<div class="ls-home">${homeHtml()}</div>`; return; }
    const D=data()[r.d], ch=D[r.c];
    if(r.k==='c'){
      v.classList.remove('ls-reading');
      hero(DOC[r.d].eb+' · Kapitel '+ch.n,ch.t,ch.s);
      const first=r.d==='ch'?ch.secs.findIndex((s,i)=>!isRead(r.d,r.c,i)):0, st=first<0?0:first;
      body.innerHTML=`<button type="button" class="btn ls-start" onclick="LS.go('r','${r.d}',${r.c},${st})">${r.d==='ch'&&nRead(r.d,r.c)?'Weiterlesen':'Lesen beginnen'}</button><div class="ls-secs">${ch.secs.map((s,i)=>`<button type="button" class="ls-sec${isRead(r.d,r.c,i)?' done':''}" onclick="LS.go('r','${r.d}',${r.c},${i})"><span class="ls-sno">${esc(s.no)}</span><span class="ls-st">${esc(s.t)}</span><span class="ls-ck" aria-label="gelesen">${isRead(r.d,r.c,i)?'✓':'›'}</span></button>`).join('')}</div>`;
      return;
    }
    const s=ch.secs[r.i]; if(!s){ swap('c',r.d,r.c,0); return; }
    v.classList.add('ls-reading');
    jset(KL,{d:r.d,c:r.c,i:r.i});
    const n=ch.secs.length, pct=Math.round((r.i+1)/n*100);
    const prev=r.i>0?[r.c,r.i-1]:(r.c>0?[r.c-1,D[r.c-1].secs.length-1]:null);
    const next=r.i<n-1?[r.c,r.i+1]:(r.c<D.length-1?[r.c+1,0]:null);
    const nb=(p,cls,txt)=>p?`<button type="button" class="ls-nb ${cls}" onclick="LS.step(${p[0]},${p[1]},${cls==='nx'?1:0})"><i>${cls==='nx'?'':'‹'}</i><span>${esc(txt)}<b>${esc(D[p[0]].secs[p[1]].t)}</b></span><i>${cls==='nx'?'›':''}</i></button>`:'<span></span>';
    body.innerHTML=`<div class="ls-rh"><div class="ls-rt"><span class="ls-meta">${esc(chLabel(r.d,r.c))} · Abschnitt ${r.i+1} von ${n}</span><button type="button" class="ls-jump" onclick="LS.sheet()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>Springen</button></div><i class="ls-bar"><i style="width:${pct}%"></i></i><h2 class="ls-h">${esc(s.no)} ${esc(s.t)}</h2></div><article class="ls-art">${s.h}</article><i class="ls-end" aria-hidden="true"></i><nav class="ls-nav">${nb(prev,'pv','Zurück')}${nb(next,'nx','Weiter')}</nav>`;
    if(r.d==='ch'&&'IntersectionObserver' in window){
      _io=new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ markRead(r.d,r.c,r.i); _io.disconnect(); _io=null; } },{threshold:0});
      _io.observe(body.querySelector('.ls-end'));
    } else if(r.d==='ch') markRead(r.d,r.c,r.i);
  }
  function step(c,i,fwd){
    const r=NAV.top().r; if(fwd&&r.d==='ch') markRead(r.d,r.c,r.i);
    swap('r',r.d,c,i);
  }

  /* ── Sprungblatt ── */
  function sheet(){
    const r=NAV.top()&&NAV.top().r; if(!r) return; closeSheet();
    const D=data()[r.d];
    const el=document.createElement('div'); el.className='ls-sheet'; el.id='ls-sheet';
    el.innerHTML=`<div class="ls-bd" onclick="LS.closeSheet()"></div><div class="ls-pn" role="dialog" aria-modal="true" aria-label="Springen"><div class="ls-grab"></div><div class="ls-pt"><b>Springen</b><button type="button" class="ls-x" aria-label="Schließen" onclick="LS.closeSheet()">✕</button></div><div class="ls-pl">${D.map((ch,c)=>`<div class="ls-pg">${esc(chLabel(r.d,c))}</div>${ch.secs.map((s,i)=>`<button type="button" class="ls-pi${c===r.c&&i===r.i?' cur':''}${r.d==='ch'&&isRead(r.d,c,i)?' done':''}" onclick="LS.jumpTo(${c},${i})"><span>${esc(s.no)}</span>${esc(s.t)}</button>`).join('')}`).join('')}</div></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(()=>{ el.classList.add('open'); el.querySelector('.cur')?.scrollIntoView({block:'center'}); });
    document.addEventListener('keydown',_esc);
  }
  const _esc=e=>{ if(e.key==='Escape') closeSheet(); };
  function closeSheet(){ document.removeEventListener('keydown',_esc); $('ls-sheet')?.remove(); }
  function jumpTo(c,i){ const r=NAV.top().r; closeSheet(); swap('r',r.d,c,i); }

  return { home, render, go, doc, find, step, sheet, closeSheet, jumpTo, refresh:refreshHome };
})();
