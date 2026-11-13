/* ======================================================================
   LAUFBAHN – gesperrter Prüfungsbereich (IBK-Klausuren, VB-Übungsklausur)
   Hinweis: Das Passwort ist nur eine Sperre im Browser (Spoilerschutz), kein echter Zugriffsschutz.
   Der Prüfwert steht im Code; der Seitentext ist öffentlich.
====================================================================== */
const LB=(function(){
  const HASH='1333yoxa8fz', SKEY='bvi_lb_ok', VKEY='bvi_lb_vb';
  let shown=false;

  function hash(s){
    let a=0xdeadbeef,b=0x41c6ce57;
    for(let i=0;i<s.length;i++){ const c=s.charCodeAt(i); a=Math.imul(a^c,2654435761); b=Math.imul(b^c,1597334677); }
    a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);
    b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);
    return (4294967296*(2097151&b)+(a>>>0)).toString(36);
  }
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const $=id=>document.getElementById(id);
  function ok(){ try{ return sessionStorage.getItem(SKEY)==='1'; }catch(e){ return false; } }

  /* ── Passwortfeld: Punkte werden nacheinander zu Buchstaben (und zurück); ein Feld, mehrere Orte (Sperrseite, Prüfungsliste) ── */
  const wrapOf=el=>el&&el.closest('.lb-form');
  function mask(inp){
    const f=wrapOf(inp), m=f&&f.querySelector('.lb-mask'); if(!m) return;
    const er=f.querySelector('.lb-err-t'); if(er) er.hidden=true; inp.removeAttribute('aria-invalid');
    const v=inp.value, on=m.classList.contains('show');
    while(m.children.length>v.length) m.removeChild(m.lastChild);
    for(let i=0;i<v.length;i++){
      let el=m.children[i];
      if(!el){ el=document.createElement('i'); el.style.setProperty('--i',i); el.innerHTML='<b class="d">•</b><b class="c"></b>'; m.appendChild(el); if(on) el.classList.add('rv'); }
      el.lastChild.textContent=v[i];
    }
  }
  function toggle(btn){
    const f=wrapOf(btn), m=f.querySelector('.lb-mask'), inp=f.querySelector('.lb-input');
    const on=!m.classList.contains('show');
    m.classList.toggle('show',on);
    btn.setAttribute('aria-pressed',on?'true':'false'); btn.setAttribute('aria-label',on?'Passwort verbergen':'Passwort anzeigen'); btn.classList.toggle('on',on);
    const items=[...m.children], n=items.length;
    items.forEach((el,i)=>{ el.style.setProperty('--i',on?i:(n-1-i)); el.classList.toggle('rv',on); });   // beim Verbergen von hinten nach vorn
    inp.focus();
  }
  function submit(e){
    if(e) e.preventDefault();
    const f=wrapOf(e&&e.target), inp=f.querySelector('.lb-input'), err=f.querySelector('.lb-err-t'), wrap=f.querySelector('.lb-pwrap');
    if(hash(inp.value.trim().toLowerCase())===HASH){
      try{ sessionStorage.setItem(SKEY,'1'); }catch(x){}
      err.hidden=true; inp.value=''; mask(inp);
      if(f.dataset.go){ closeModal(); if(typeof SHELL!=='undefined'&&SHELL.renderExam) SHELL.renderExam(); NAV.go('v-lb-start','Laufbahnprüfung'); }
      else render();
    } else {
      err.hidden=false; inp.setAttribute('aria-invalid','true');
      wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
    }
    return false;
  }
  // Prüfungsliste: Antippen der gesperrten Zeile öffnet nur ein Passwortfeld, das wie die Suche aus dem Knopf herauswächst.
  // Falsch: rotes Wackeln. Richtig: grüner Haken, dann geht es auf die Laufbahn-Seite.
  let lastFocus=null, okTimer=0;
  const reduce=()=>window.matchMedia&&false;
  function closeModal(){
    const o=$('lb-field'); if(!o||o.classList.contains('hidden')) return;
    clearTimeout(okTimer); o.classList.add('hidden');
    const f=lastFocus; lastFocus=null; if(f&&f.focus) f.focus({preventScroll:true});
  }
  function ask(btn){
    if(ok()){ NAV.go('v-lb-start','Laufbahnprüfung'); return; }
    const o=$('lb-field'), inp=$('lb-field-input'); if(!o||!inp) return;
    const box=o.querySelector('.search-box');
    box.classList.remove('lbf-bad','lbf-ok'); inp.value=''; inp.readOnly=false; inp.removeAttribute('aria-invalid');
    lastFocus=btn||document.activeElement;
    anchor=btn&&btn.getBoundingClientRect?btn:null;
    o.classList.remove('hidden');
    place();
    if(typeof SEARCH!=='undefined'&&SEARCH.expand) SEARCH.expand(box,btn);
    setTimeout(()=>{ inp.focus({preventScroll:true}); place(); },30);
  }
  // Das Feld liegt genau über der angetippten Zeile (nicht oben an der Seite); bei geöffneter Tastatur wandert es in den sichtbaren Bereich
  let anchor=null;
  function place(){
    const o=$('lb-field'); if(!o||o.classList.contains('hidden')) return;
    const box=o.querySelector('.search-box');
    if(!anchor||!anchor.isConnected){ o.classList.remove('lbf-at'); box.style.cssText=''; return; }
    o.classList.add('lbf-at');
    const r=anchor.getBoundingClientRect(), vv=window.visualViewport, vw=vv?vv.width:window.innerWidth, vh=vv?vv.height:window.innerHeight, vt=vv?vv.offsetTop:0, vl=vv?vv.offsetLeft:0;
    const w=Math.min(Math.max(r.width,Math.min(300,vw-24)),Math.min(720,vw-24)), h=box.offsetHeight||58;
    const left=Math.max(vl+12,Math.min(vl+vw-w-12,r.left+(r.width-w)/2));
    const top=Math.max(vt+8,Math.min(vt+vh-h-8,r.top+(r.height-h)/2));
    box.style.width=w+'px'; box.style.left=left+'px'; box.style.top=top+'px';
  }
  if(window.visualViewport){ visualViewport.addEventListener('resize',place); visualViewport.addEventListener('scroll',place); }
  window.addEventListener('resize',place);
  function fieldTyped(inp){ const box=inp.closest('.search-box'); if(box) box.classList.remove('lbf-bad'); inp.removeAttribute('aria-invalid'); }
  function fieldSubmit(e){
    if(e) e.preventDefault();
    const inp=$('lb-field-input'), box=inp.closest('.search-box');
    if(inp.readOnly) return false;
    if(hash(inp.value.trim().toLowerCase())===HASH){
      try{ sessionStorage.setItem(SKEY,'1'); }catch(x){}
      box.classList.remove('lbf-bad'); box.classList.add('lbf-ok'); inp.readOnly=true; inp.blur();
      okTimer=setTimeout(()=>{ closeModal(); if(typeof SHELL!=='undefined'&&SHELL.renderExam) SHELL.renderExam(); NAV.go('v-lb-start','Laufbahnprüfung'); },reduce()?250:800);
    } else {
      inp.setAttribute('aria-invalid','true');
      box.classList.remove('lbf-bad'); void box.offsetWidth; box.classList.add('lbf-bad');
    }
    return false;
  }
  const EYE='<svg class="lb-eye-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path class="lb-slash" d="M3 3l18 18"/></svg>';
  function lock(){ try{ sessionStorage.removeItem(SKEY); }catch(e){} render(); }

  function render(){
    const g=$('lb-gate'), h=$('lb-hub'); if(!g||!h) return;
    const open=ok(); g.hidden=open; h.hidden=!open;
    if(open) h.classList.remove('lb-in'), void h.offsetWidth, h.classList.add('lb-in');
    else setTimeout(()=>{ const i=$('lb-pw'); if(i&&document.getElementById('v-lb-start').classList.contains('active')) i.focus({preventScroll:true}); },60);
  }

  /* ── VB-Übungsklausur: Brandschutzkonzept lesen, zu mindestens 5 Punkten Stellung nehmen ── */
  let st=null;
  function load(){ try{ st=JSON.parse(localStorage.getItem(VKEY)||'null'); }catch(e){ st=null; } if(!st||typeof st!=='object') st={}; st.k=st.k||'k1'; st.a=st.a||{}; st.ev=st.ev||{}; st.m=st.m||{}; }
  function save(){ try{ localStorage.setItem(VKEY,JSON.stringify(st)); }catch(e){} }
  const D=()=>(typeof LB_VB!=='undefined'?LB_VB:null);
  const K=()=>{ const d=D(); return d&&d.konzepte.find(k=>k.id===st.k)||d&&d.konzepte[0]; };
  const ans=(k,p)=>((st.a[k]||(st.a[k]={}))[p]||(st.a[k][p]={p:'',b:'',l:''}));
  const done=(k,p)=>{ const a=((st.a[k]||{})[p])||{}; return (a.p||'').trim().length>=8&&(a.b||'').trim().length>=8; };
  const count=k=>D().punkte.filter(p=>done(k,p.id)).length;

  let vbTried=false;
  function vbInit(){
    const root=$('lb-vb-root'); if(!root) return;
    load();
    if(!D()){
      // Die Konzepte (js/laufbahn-data.js) werden erst hier geladen, nicht schon beim App-Start
      const fail=()=>{ vbTried=false; root.innerHTML='<div class="m-card">Die Inhalte konnten nicht geladen werden.</div>'; };
      if(!vbTried&&typeof LAZY!=='undefined'){ vbTried=true; root.innerHTML='<div class="m-card">Lade Inhalte …</div>'; LAZY.script('js/laufbahn-data.js').then(()=>{ vbTried=false; if(D()) vbInit(); else fail(); },fail); return; }
      fail(); return;
    }
    vbRender();
  }
  function vbRender(){
    const root=$('lb-vb-root'), d=D(), k=K(); if(!root||!d||!k) return;
    const ev=!!st.ev[k.id];
    const tabs=d.konzepte.map(c=>`<button type="button" class="lb-ktab${c.id===k.id?' on':''}" onclick="LB.pick('${c.id}')">${esc(c.titel)}</button>`).join('');
    const cards=d.punkte.map((p,i)=>{
      const ab=(k.abschnitte.find(x=>x.punkt===p.id)||{}).text||'';
      const a=ans(k.id,p.id), bearb=done(k.id,p.id);
      return `<section class="lb-pt${bearb?' done':''}" id="lb-p-${p.id}">
        <header><span class="lb-n">${String(i+1).padStart(2,'0')}</span><h3>${esc(p.name)}</h3><span class="lb-badge" aria-hidden="true">${bearb?'bearbeitet':''}</span></header>
        <blockquote class="lb-txt">${esc(ab)}</blockquote>
        ${ev?'':`<details class="lb-write"${(a.p||a.b||a.l)?' open':''}><summary>Stellung nehmen</summary>
          <label>Problem<textarea rows="2" oninput="LB.type('${p.id}','p',this)" placeholder="Was ist unklar, unkonkret oder für den Einsatz unbeantwortet?">${esc(a.p)}</textarea></label>
          <label>Begründung aus Feuerwehrsicht<textarea rows="2" oninput="LB.type('${p.id}','b',this)" placeholder="Warum braucht die Feuerwehr das im Einsatz?">${esc(a.b)}</textarea></label>
          <label>Lösungsvorschlag<textarea rows="2" oninput="LB.type('${p.id}','l',this)" placeholder="Was soll der Bauherr ändern oder ergänzen?">${esc(a.l)}</textarea></label>
        </details>`}
        ${ev?result(k,p,a,bearb):''}
      </section>`;
    }).join('');
    root.innerHTML=`<div class="lb-ktabs" role="tablist">${tabs}</div>
      <div class="m-card lb-obj"><div class="m-eyebrow">Objekt</div><p>${esc(k.objekt)}</p></div>
      ${ev?summary(k):`<div class="lb-bar"><div class="lb-barfill" id="lb-barfill" style="width:${Math.min(100,count(k.id)/5*100)}%"></div><span id="lb-cnt">${count(k.id)} von 9 Punkten bearbeitet · gefordert: mindestens 5</span></div>`}
      <div class="lb-pts">${cards}</div>
      <div class="lb-act">${ev?`<button type="button" class="btn btn-ghost" onclick="LB.again()">Konzept neu bearbeiten</button>`:`<button type="button" class="m-go2" onclick="LB.eval()">Auswerten ${''}</button>`}</div>`;
  }
  function type(p,f,el){
    const k=K(); ans(k.id,p)[f]=el.value; save();
    const c=count(k.id), cnt=$('lb-cnt'), bf=$('lb-barfill'), sec=$('lb-p-'+p);
    if(cnt) cnt.textContent=c+' von 9 Punkten bearbeitet · gefordert: mindestens 5';
    if(bf) bf.style.width=Math.min(100,c/5*100)+'%';
    if(sec){ sec.classList.toggle('done',done(k.id,p)); const b=sec.querySelector('.lb-badge'); if(b) b.textContent=done(k.id,p)?'bearbeitet':''; }
  }
  function found(k,e){
    const key=k.id+':'+e.id; if(st.m[key]!=null) return !!st.m[key];
    const a=(st.a[k.id]||{})[e.punkt]||{}; const t=((a.p||'')+' '+(a.b||'')+' '+(a.l||'')).toLowerCase();
    const kw=e.schluesselwoerter||[]; const hits=kw.filter(w=>t.includes(String(w).toLowerCase())).length;
    return hits>=Math.min(2,kw.length)&&done(k.id,e.punkt);
  }
  function result(k,p,a,bearb){
    const errs=k.fehler.filter(e=>e.punkt===p.id), okp=k.ok_punkte.includes(p.id);
    let head='';
    if(okp) head=bearb?'<div class="lb-res warn"><strong>Hier gab es keinen Mangel.</strong> Prüfe, ob deine Forderung wirklich nötig ist oder ob das Konzept den Punkt schon ausreichend regelt.</div>':'<div class="lb-res good"><strong>Kein Mangel.</strong> Der Punkt ist im Konzept ausreichend geregelt, hier musst du nichts fordern.</div>';
    else if(!bearb) head='<div class="lb-res miss"><strong>Nicht bearbeitet.</strong> Hier steckt mindestens ein Mangel im Konzept.</div>';
    const list=errs.map(e=>{
      const f=found(k,e);
      return `<div class="lb-err ${f?'hit':'no'}"><div class="lb-errh"><span>${f?'Erkannt':'Nicht getroffen'}</span>
        <label class="lb-self"><input type="checkbox" ${f?'checked':''} onchange="LB.mark('${k.id}:${e.id}',this.checked)"> habe ich sinngemäß genannt</label></div>
        <p class="lb-q">„${esc(e.fundstelle)}“</p>
        <p><strong>Problem:</strong> ${esc(e.problem)}</p><p><strong>Begründung:</strong> ${esc(e.begruendung)}</p><p><strong>Lösung:</strong> ${esc(e.loesung)}</p></div>`;
    }).join('');
    return head+list;
  }
  function summary(k){
    const errs=k.fehler, nf=errs.filter(e=>found(k,e)).length;
    const pts=new Set(errs.filter(e=>found(k,e)).map(e=>e.punkt)).size;
    const good=pts>=5;
    return `<div class="m-card lb-sum ${good?'good':'warn'}"><div class="m-eyebrow">Ergebnis</div>
      <p><strong>${nf} von ${errs.length}</strong> Mängeln erkannt, zu <strong>${pts}</strong> Punkten mit Mangel Stellung genommen.</p>
      <p>${good?'Ziel erreicht: Stellung zu mindestens 5 Punkten mit Begründung gilt als erfüllt.':'Noch nicht erreicht: gefordert ist die begründete Stellung zu mindestens 5 Punkten.'}</p>
      <p class="m-t2">Gesprächstipp: ${esc(k.gespraechstipp||'')}</p></div>`;
  }


  /* ── IBK-Prüfungssimulation: 240 Minuten, 100 Punkte; Inhalt kommt aus den Seiten v-lb-ibk1/-ibk2 ── */
  const SIMKEY='bvi_lb_sim', TOTAL=240*60000;
  const KL={ibk1:['v-lb-ibk1','Klausur 1: Ausbildung – Wertschätzung'],ibk2:['v-lb-ibk2','Klausur 2: Schichtwechsel – Pünktlichkeit']};
  let S=null, simTick=0, simData={};
  function sLoad(){ try{ S=JSON.parse(localStorage.getItem(SIMKEY)||'null'); }catch(e){ S=null; } if(!S||typeof S!=='object') S={}; S.phase=S.phase||'start'; S.acc=S.acc||0; S.a=S.a||{}; S.r=S.r||{}; S.mk=S.mk||{}; S.mode=S.mode||'text'; S.tal=S.tal||{p:0,k:0,v:0}; }
  function sSave(){ try{ localStorage.setItem(SIMKEY,JSON.stringify(S)); }catch(e){} }
  const root=()=>{ const v=document.getElementById('v-lb-ibk-sim'); return v&&v.querySelector('.lbsim'); };
  const elapsed=()=>S.acc+(S.run?Date.now()-S.t0:0);
  const mmss=ms=>{ const s=Math.floor(Math.abs(ms)/1000); return (ms<0?'+':'')+String(Math.floor(s/3600)).padStart(1,'0')+':'+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };
  const words=t=>(String(t||'').trim().match(/\S+/g)||[]).length;

  function parse(k){
    if(simData[k]) return simData[k];
    const src=document.getElementById(KL[k][0]); if(!src) return null;
    const items=[...src.querySelectorAll('details.acc-item')], D={scene:'',hint:'',tasks:[]};
    items.forEach(it=>{
      const title=(it.querySelector('.acc-title')||{}).textContent||'', body=it.querySelector('.acc-body'); if(!body) return;
      if(/^Beispielszene/.test(title)) D.scene=body.innerHTML;
      else if(/^Aufbau/.test(title)) D.hint=body.innerHTML;
      else if(/^Aufgabe:/.test(title)){
        const m=title.match(/^Aufgabe:\s*(.*?)\s*·\s*(\d+)\s*Punkt/), t={name:m?m[1]:title.replace(/^Aufgabe:\s*/,''),pts:m?+m[2]:0,intro:'',blocks:[]};
        let cur=null; const push=()=>{ if(cur) t.blocks.push(cur); cur=null; };
        [...body.childNodes].forEach(n=>{
          if(n.nodeName==='H4'){ push(); const pm=n.textContent.match(/\((\d+)\s*Punkte?\)/); cur={h:n.textContent.replace(/\s*\(\d+\s*Punkte?\)\s*$/,''),pts:pm?+pm[1]:0,q:'',sol:'',inSol:false}; return; }
          if(!cur){ t.intro+=n.outerHTML||''; return; }
          if(n.nodeName==='DETAILS'&&n.classList.contains('lb-sol')){ cur.inSol=true; const c=n.cloneNode(true); const sm=c.querySelector('summary'); if(sm) sm.remove(); cur.sol+=c.innerHTML; return; }
          if(cur.inSol) cur.sol+=n.outerHTML||n.textContent; else cur.q+=n.outerHTML||'';
        }); push();
        if(!t.blocks.length) t.blocks.push({h:t.name,pts:t.pts,q:t.intro,sol:''});
        const sum=t.blocks.reduce((a,b)=>a+b.pts,0); if(sum!==t.pts){ t.blocks.forEach(b=>{ if(!b.pts) b.pts=Math.max(1,Math.round(t.pts/t.blocks.length)); }); t.pts=t.blocks.reduce((a,b)=>a+b.pts,0); }
        t.blocks.forEach((b,i)=>{ b.key=k+':'+D.tasks.length+':'+i; });
        D.tasks.push(t);
      }
    });
    const tmp=document.createElement('div'); tmp.innerHTML=D.scene; D.lines=[];
    tmp.querySelectorAll('p.lb-line').forEach(pp=>{ const st=pp.querySelector('strong'), em=pp.querySelector('em'); const m=st&&st.textContent.match(/^\((\d+)\)\s*(.*?):?\s*$/); if(!m) return;
      const c=pp.cloneNode(true); const s2=c.querySelector('strong'), e2=c.querySelector('em'); if(s2) s2.remove(); if(e2) e2.remove();
      D.lines.push({n:+m[1],who:m[2],text:c.textContent.trim(),reg:em?em.textContent.replace(/^\(|\)$/g,''):''}); });
    return (simData[k]=D);
  }
  const tasksOf=D=>S.mode==='mark'?D.tasks.filter(t=>/Transaktions|Konflikt|Schulz/i.test(t.name)):D.tasks;
  const allBlocks=D=>tasksOf(D).flatMap(t=>t.blocks);
  const earned=D=>allBlocks(D).reduce((a,b)=>a+b.pts*(S.r[b.key]||0),0);
  const totalPts=D=>tasksOf(D).reduce((a,t)=>a+t.pts,0);
  const IZ=[['kEL','kritisches Eltern-Ich'],['fEL','fürsorgliches Eltern-Ich'],['ER','Erwachsenen-Ich'],['nK','natürliches Kind-Ich'],['aK','angepasstes Kind-Ich']];
  const TR=[['p','parallel'],['k','gekreuzt'],['v','verdeckt']], KU=[['V','Verteilung'],['B','Beziehung'],['U','Beurteilung'],['W','Bewertung']], EB=[['sach','Sach'],['self','Selbstoffenbarung'],['bez','Beziehung'],['app','Appell']];
  const mk=(D,n)=>((S.mk||(S.mk={}))[S.k+':'+n]||(S.mk[S.k+':'+n]={}));
  const mkAll=D=>D.lines.map(x=>({x,m:(S.mk||{})[S.k+':'+x.n]||{}}));
  function cover(D){
    const L=mkAll(D), cnt=k=>L.filter(a=>a.m[k]).length, by=k=>new Set(L.filter(a=>a.m[k]).map(a=>a.m[k]));
    const who={}; L.forEach(a=>{ (who[a.x.who]||(who[a.x.who]={n:0,s:0}));who[a.x.who].n++; if(a.m.s) who[a.x.who].s++; });
    const mains=Object.keys(who).filter(w=>who[w].n>=3);
    return [
      ['Jeder Hauptakteur mit mindestens zwei Ich-Zuständen belegt',mains.length>0&&mains.every(w=>who[w].s>=2),mains.map(w=>w+' '+who[w].s).join(', ')],
      ['Mindestens fünf Transaktionen in die Strichliste eingetragen',cnt('t')>=5,cnt('t')+' von 5'],
      ['Mindestens eine gekreuzte und eine verdeckte Transaktion erkannt',by('t').has('k')&&by('t').has('v'),''],
      ['Alle vier Konfliktursachen mit einem Beleg versehen',by('c').size>=4,by('c').size+' von 4'],
      ['Mindestens zwei Seiten der Nachricht (Schulz von Thun) belegt',by('e').size>=2,by('e').size+' von 4']];
  }
  const modeBar=()=>`<div class="lbsim-sw" role="group" aria-label="Arbeitsweise"><button type="button" class="${S.mode==='mark'?'':'on'}" onclick="LB.sim.mode('text')">Schreiben</button><button type="button" class="${S.mode==='mark'?'on':''}" onclick="LB.sim.mode('mark')">Markieren</button></div>`;

  function head(D,label){
    const left=TOTAL-elapsed(), over=left<0;
    return `<div class="lbsim-bar${over?' over':''}"><div><div class="lbsim-k">${esc(label)}</div><div class="lbsim-time" data-t>${mmss(left)}</div></div>`
      +`<div class="lbsim-act">${S.phase!=='eval'?`<button type="button" class="btn btn-ghost" onclick="LB.sim.pause()">${S.run?'Pause':'Weiter'}</button>`:''}</div></div>`;
  }
  const tools=()=>`<div class="m-card lbsim-tal"><div class="m-eyebrow">Strichliste Transaktionen</div><div class="lbsim-tr">`
    +[['p','parallel'],['k','gekreuzt'],['v','verdeckt']].map(([x,n])=>`<div class="lbsim-t"><span>${n}</span><div><button type="button" aria-label="${n} minus" onclick="LB.sim.tal('${x}',-1)">−</button><b>${S.tal[x]}</b><button type="button" aria-label="${n} plus" onclick="LB.sim.tal('${x}',1)">+</button></div></div>`).join('')+`</div></div>`;

  function vStart(){
    const run=S.phase!=='start'&&S.k&&KL[S.k];
    return `<div class="m-card"><div class="m-eyebrow">Prüfungssimulation</div><h2 class="lbsim-h">IBK-Klausur wie im Dezember</h2>
      <p>240 Minuten, 100 Punkte. Zuerst die Szene lesen (empfohlen etwa 30 Minuten, mit Markieren und Checkliste), dann die Aufgaben der Reihe nach schreiben, zuletzt gegen die Musterlösung selbst bewerten. Welche Klausur gezogen wird, ist offen.</p>
      <p class="lbsim-mt"><strong>Arbeitsweise:</strong></p>${modeBar()}<p class="lbsim-md">${S.mode==='mark'?'Markieren: Sie tippen die Redebeiträge der Szene an und ordnen sie per Klick zu (Ich-Zustand, Transaktion, Konfliktursache, Seite der Nachricht). Die Checkliste füllt sich von selbst. Bewertet werden die Analyseaufgaben mit der Musterlösung.':'Schreiben: Sie beantworten alle Aufgaben in Fließtext, wie in der echten Klausur.'}</p>
      <div class="lbsim-pick"><button type="button" class="m-go2" onclick="LB.sim.start('ibk1')">${esc(KL.ibk1[1])}</button><button type="button" class="m-go2" onclick="LB.sim.start('ibk2')">${esc(KL.ibk2[1])}</button><button type="button" class="btn btn-ghost" onclick="LB.sim.start()">Zufällig ziehen</button></div></div>`
      +(run?`<div class="m-card lbsim-res"><div class="m-eyebrow">Laufende Simulation</div><p>${esc(KL[S.k][1])} · ${S.phase==='eval'?'Auswertung':S.phase==='read'?'Lesephase':'Bearbeitung'} · verbleibend ${mmss(TOTAL-elapsed())}</p><div class="lbsim-pick"><button type="button" class="m-go2" onclick="LB.sim.resume()">Fortsetzen</button><button type="button" class="btn btn-ghost" onclick="LB.sim.drop()">Verwerfen</button></div></div>`:'');
  }
  function vRead(D){
    return head(D,KL[S.k][1])+`<div class="m-card"><div class="m-eyebrow">Phase 1 · Lesen</div><p>Szene mehrfach lesen, Redebeiträge markieren, Checkliste anlegen. Empfohlen: etwa 30 Minuten. Die Aufgaben sehen Sie erst in der nächsten Phase.</p></div>`
      +`<div class="m-card lbsim-scene">${D.scene}</div>`+tools()+`<details class="lb-sol"><summary>Hinweise zum Vorgehen</summary><div class="lbsim-pad">${D.hint}</div></details>`
      +`<button type="button" class="m-go2 lbsim-go" onclick="LB.sim.work()">Lesen beenden, Aufgaben bearbeiten →</button>`;
  }
  function vWork(D){
    if(S.mode==='mark') return vMark(D);
    const bl=allBlocks(D), dn=bl.filter(b=>words(S.a[b.key])>=15).length;
    let h=head(D,KL[S.k][1])+modeBar()+`<div class="lbsim-prog"><div class="bar"><i style="width:${Math.round(dn/bl.length*100)}%"></i></div><small data-p>${dn} von ${bl.length} Teilaufgaben bearbeitet</small></div>`
      +`<details class="lb-sol"><summary>Szene und Strichliste</summary><div class="lbsim-pad"><div class="lbsim-scene">${D.scene}</div>${tools()}</div></details>`;
    D.tasks.forEach((t,ti)=>{
      h+=`<div class="m-card lbsim-task"><div class="lbsim-th"><b>${ti+1}. ${esc(t.name)}</b><span class="chip">${t.pts} Pkt. · ca. ${Math.round(t.pts*2.4)} Min.</span></div>${t.intro}`;
      t.blocks.forEach(b=>{ h+=`<div class="lbsim-blk"><h4>${esc(b.h)} <span>${b.pts} Pkt.</span></h4>${b.q}<textarea class="lbsim-ta" rows="5" placeholder="Ihre Antwort in Fließtext …" ${S.run?'':'disabled'} oninput="LB.sim.type('${b.key}',this)">${esc(S.a[b.key]||'')}</textarea><small class="lbsim-wc">${words(S.a[b.key])} Wörter</small></div>`; });
      h+=`</div>`;
    });
    return h+`<button type="button" class="m-go2 lbsim-go" onclick="LB.sim.finish()">Abgeben und auswerten →</button>`;
  }

  function chipRow(lab,opts,cur,key,n){
    return `<div class="lbsim-cr"><span>${lab}</span>`+opts.map(([v,t])=>`<button type="button" class="${cur===v?'on':''}" onclick="LB.sim.mk(${n},'${key}','${v}')">${esc(t)}</button>`).join('')+`</div>`;
  }
  function vMark(D){
    const L=mkAll(D), done=L.filter(a=>a.m.s||a.m.t||a.m.c||a.m.e).length, cv=cover(D), tal={p:0,k:0,v:0}; L.forEach(a=>{ if(a.m.t) tal[a.m.t]++; });
    let h=head(D,KL[S.k][1])+modeBar()+`<div class="lbsim-prog"><div class="bar"><i style="width:${Math.round(done/L.length*100)}%"></i></div><small data-p>${done} von ${L.length} Redebeiträgen markiert</small></div>`
      +`<div class="m-card"><div class="m-eyebrow">Szene markieren</div><p>Tippen Sie einen Redebeitrag an und ordnen Sie ihn zu. Die Hinweise zum Vorgehen und die Szenenbeschreibung finden Sie unten.</p>`;
    L.forEach(({x,m})=>{
      const sel=S.msel===x.n;
      h+=`<div class="lbsim-line${m.s?' s-'+m.s:''}${sel?' sel':''}"><button type="button" class="lbsim-lb" aria-expanded="${sel}" onclick="LB.sim.msel(${x.n})"><b>(${x.n}) ${esc(x.who)}</b> ${esc(x.text)}<em>${esc(x.reg)}</em></button>`
        +`<div class="lbsim-badges">${m.s?`<span>${m.s}</span>`:''}${m.t?`<span>${TR.find(a=>a[0]===m.t)[1]}</span>`:''}${m.c?`<span>${KU.find(a=>a[0]===m.c)[1]}</span>`:''}${m.e?`<span>${EB.find(a=>a[0]===m.e)[1]}</span>`:''}</div>`
        +(sel?`<div class="lbsim-pan">${chipRow('Ich-Zustand des Sprechers',IZ.map(a=>[a[0],a[0]]),m.s,'s',x.n)}<small class="lbsim-leg">kEL kritisch, fEL fürsorglich, ER Erwachsenen-Ich, nK natürliches Kind, aK angepasstes Kind</small>${chipRow('Transaktion zum Beitrag davor',TR,m.t,'t',x.n)}${chipRow('Konfliktursache',KU,m.c,'c',x.n)}${chipRow('Seite der Nachricht (vorherrschend)',EB,m.e,'e',x.n)}</div>`:'')+`</div>`; });
    h+=`</div><div class="m-card lbsim-tal"><div class="m-eyebrow">Strichliste Transaktionen</div><div class="lbsim-tr">${[['p','parallel'],['k','gekreuzt'],['v','verdeckt']].map(([x,n])=>`<div class="lbsim-t"><span>${n}</span><div><b>${tal[x]}</b></div></div>`).join('')}</div></div>`
      +`<div class="m-card"><div class="m-eyebrow">Checkliste für die Klausur</div>`+cv.map(([t,ok,d])=>`<div class="lbsim-ck${ok?' ok':''}"><span class="lbsim-bx">${ok?'✓':''}</span><span>${esc(t)}${d?` <small>${esc(d)}</small>`:''}</span></div>`).join('')+`</div>`
      +`<details class="lb-sol"><summary>Szenenbeschreibung und Hinweise zum Vorgehen</summary><div class="lbsim-pad">${D.hint}</div></details>`
      +`<button type="button" class="m-go2 lbsim-go" onclick="LB.sim.finish()">Abgeben und mit Musterlösung vergleichen →</button>`;
    return h;
  }
  function vMarkSum(D){
    const L=mkAll(D), who={}; L.forEach(({x,m})=>{ if(m.s){ ((who[x.who]||(who[x.who]={}))[m.s]||(who[x.who][m.s]=[])).push(x.n); } });
    const cu={}; L.forEach(({x,m})=>{ if(m.c) (cu[m.c]||(cu[m.c]=[])).push(x.n); });
    const rows=Object.keys(who).map(w=>`<tr><td>${esc(w)}</td><td>${Object.keys(who[w]).map(s=>`<b>${s}</b> (${who[w][s].join(', ')})`).join(' · ')}</td></tr>`).join('')||'<tr><td colspan="2">Keine Ich-Zustände markiert.</td></tr>';
    return `<div class="m-card"><div class="m-eyebrow">Ihre Markierungen</div><div class="tbl-wrap"><table><thead><tr><th>Akteur</th><th>Ich-Zustände mit Redebeitrag</th></tr></thead><tbody>${rows}</tbody></table></div>`
      +`<p><strong>Konfliktursachen:</strong> ${KU.map(([k,n])=>n+' '+(cu[k]?'('+cu[k].join(', ')+')':'–')).join(' · ')}</p>`
      +cover(D).map(([t,ok])=>`<div class="lbsim-ck${ok?' ok':''}"><span class="lbsim-bx">${ok?'✓':''}</span><span>${esc(t)}</span></div>`).join('')+`</div>`;
  }
  function vEval(D){
    const e=earned(D), T=totalPts(D), pct=Math.round(e/T*100), rated=allBlocks(D).filter(b=>S.r[b.key]!=null).length;
    const weak=tasksOf(D).map(t=>({n:t.name,p:t.blocks.reduce((a,b)=>a+b.pts*(S.r[b.key]||0),0),t:t.pts})).filter(x=>x.p/x.t<.6).sort((a,b)=>a.p/a.t-b.p/b.t).slice(0,3);
    let h=head(D,KL[S.k][1])+modeBar()+`<div class="m-card lbsim-sum"><div class="m-eyebrow">Auswertung</div><div class="lbsim-score"><b data-e>${(+e.toFixed(1))}</b> von ${T} Punkten <span class="chip">${pct} %</span></div><div class="bar"><i style="width:${pct}%"></i></div>`
      +`<p data-m>${rated<allBlocks(D).length?`Noch ${allBlocks(D).length-rated} Teilaufgaben ohne Bewertung. Vergleichen Sie Ihre Antwort mit der Musterlösung und bewerten Sie sich ehrlich.`:pct>=80?'Sehr stark. Prüfen Sie nur noch, ob die Brücke von der Theorie in die Praxis überall steht.':pct>=60?'Solide. Die schwächsten Themen unten gezielt nacharbeiten.':'Es gibt Lücken. Die Themen unten zuerst wiederholen, dann die Simulation noch einmal mit der anderen Klausur laufen lassen.'}</p>`
      +(weak.length?`<p><strong>Zuerst wiederholen:</strong> ${weak.map(x=>esc(x.n)+' ('+(+x.p.toFixed(1))+'/'+x.t+')').join(', ')}</p>`:'')+`</div>`;
    if(S.mode==='mark') h+=vMarkSum(D);
    tasksOf(D).forEach((t,ti)=>{
      h+=`<div class="m-card lbsim-task"><div class="lbsim-th"><b>${ti+1}. ${esc(t.name)}</b><span class="chip" data-tp="${ti}">${(+t.blocks.reduce((a,b)=>a+b.pts*(S.r[b.key]||0),0).toFixed(1))} / ${t.pts}</span></div>`;
      t.blocks.forEach(b=>{ const r=S.r[b.key];
        h+=`<div class="lbsim-blk"><h4>${esc(b.h)} <span>${b.pts} Pkt.</span></h4>${S.mode==='mark'?'':`<div class="lbsim-mine"><small>Ihre Antwort</small>${S.a[b.key]&&S.a[b.key].trim()?`<p>${esc(S.a[b.key])}</p>`:'<p class="lbsim-none">nicht bearbeitet</p>'}</div>`}`
          +`<details class="lb-sol"><summary>Musterlösung anzeigen</summary><div class="lbsim-pad">${b.sol||'<p>Siehe Seite der Klausur.</p>'}</div></details>`
          +`<div class="lbsim-rate" role="group" aria-label="Selbstbewertung">`+[[0,'nicht erfüllt'],[.5,'teilweise'],[1,'erfüllt']].map(([v,n])=>`<button type="button" class="${r===v?'on':''}" onclick="LB.sim.rate('${b.key}',${v})">${n}</button>`).join('')+`</div></div>`; });
      h+=`</div>`;
    });
    return h+`<div class="lbsim-pick"><button type="button" class="m-go2" onclick="LB.sim.drop()">Neue Simulation</button></div>`;
  }
  function simRender(){
    const r=root(); if(!r) return; if(!S) sLoad();
    let D=S.k&&parse(S.k); let h;
    if(S.phase==='start'||!D) h=vStart(); else h=S.phase==='read'?vRead(D):S.phase==='work'?vWork(D):vEval(D);
    r.innerHTML=h; clearInterval(simTick);
    if(S.run&&S.phase!=='start'&&S.phase!=='eval') simTick=setInterval(simTime,1000);
  }
  function simTime(){
    const r=root(); if(!r||!r.offsetParent){ clearInterval(simTick); return; }
    const t=r.querySelector('[data-t]'); if(t){ t.textContent=mmss(TOTAL-elapsed()); t.parentNode.parentNode.classList.toggle('over',TOTAL-elapsed()<0); }
  }
  const sim={
    mode(m){ S.mode=m; sSave(); const y=window.scrollY; simRender(); window.scrollTo(0,y); },
    init(){ sLoad(); if(S.run&&S.phase!=='eval'){ /* nach Neuladen: Pause, Zeit der Abwesenheit zählt nicht */ S.acc+=0; S.run=false; sSave(); } simRender(); },
    start(k){ const key=k||(Math.random()<.5?'ibk1':'ibk2'); S={k:key,mode:S.mode||'text',phase:'read',acc:0,run:true,t0:Date.now(),a:{},r:{},mk:{},tal:{p:0,k:0,v:0}}; sSave(); simRender(); window.scrollTo({top:0}); },
    resume(){ if(!S.run&&S.phase!=='eval'){ S.run=true; S.t0=Date.now(); sSave(); } simRender(); },
    drop(){ clearInterval(simTick); S={phase:'start',mode:S.mode||'text',acc:0,a:{},r:{},mk:{},tal:{p:0,k:0,v:0}}; sSave(); simRender(); window.scrollTo({top:0}); },
    pause(){ if(S.run){ S.acc+=Date.now()-S.t0; S.run=false; } else { S.run=true; S.t0=Date.now(); } sSave(); simRender(); },
    work(){ S.phase='work'; sSave(); simRender(); window.scrollTo({top:0}); },
    finish(){ if(S.run){ S.acc+=Date.now()-S.t0; S.run=false; } S.phase='eval'; sSave(); simRender(); window.scrollTo({top:0}); },
    type(key,ta){ S.a[key]=ta.value; sSave(); const w=ta.nextElementSibling; if(w) w.textContent=words(ta.value)+' Wörter'; const D=parse(S.k), bl=allBlocks(D), dn=bl.filter(b=>words(S.a[b.key])>=15).length, r=root(), p=r&&r.querySelector('[data-p]'); if(p){ p.textContent=dn+' von '+bl.length+' Teilaufgaben bearbeitet'; r.querySelector('.lbsim-prog .bar i').style.width=Math.round(dn/bl.length*100)+'%'; } },
    msel(n){ S.msel=S.msel===n?null:n; sSave(); const y=window.scrollY; simRender(); window.scrollTo(0,y); },
    mk(n,key,v){ const D=parse(S.k), m=mk(D,n); if(m[key]===v) delete m[key]; else m[key]=v; sSave(); const y=window.scrollY; simRender(); window.scrollTo(0,y); },
    tal(x,d){ S.tal[x]=Math.max(0,(S.tal[x]||0)+d); sSave(); const y=window.scrollY; simRender(); window.scrollTo(0,y); },
    rate(key,v){ S.r[key]=v; sSave(); const y=window.scrollY; simRender(); window.scrollTo(0,y); }
  };

  return {
    sim, ok, submit, toggle, typed:mask, lock, render, ask, closeModal, fieldSubmit, fieldTyped,
    onShow(id){
      if(id==='v-lb-start'){ if(!shown){ shown=true; } render(); }
      if(id==='v-lb-vb') vbInit();
      if(id==='v-lb-ibk-sim') sim.init();
      if(id==='v-lb-ibk-labor'&&typeof LAB!=='undefined') LAB.init();
    },
    // Laufbahn gibt es nur im Master-Jahrgang; ohne Passwort geht es zur Sperrseite
    guard(id){ if(!/^v-lb-/.test(id)) return id; if(typeof JG!=='undefined'&&!JG.isMaster()) return 'v-pruefung'; return /^v-lb-(ibk|vb|vak|feuak)/.test(id)&&!ok()?'v-lb-start':id; },
    pick(id){ st.k=id; save(); vbRender(); window.scrollTo({top:0}); },
    type,
    eval(){ const k=K(); st.ev[k.id]=1; save(); vbRender(); window.scrollTo({top:0,behavior:'smooth'}); },
    again(){ const k=K(); delete st.ev[k.id]; delete st.a[k.id]; Object.keys(st.m).forEach(x=>{ if(x.startsWith(k.id+':')) delete st.m[x]; }); save(); vbRender(); window.scrollTo({top:0}); },
    mark(key,v){ st.m[key]=v?1:0; save(); const y=window.scrollY; vbRender(); window.scrollTo(0,y); }
  };
})();

/* ======================================================================
   IBK-LABOR – Transaktionsanalyse (Zeichner, Regeln, Quiz), Maslow, Schulz von Thun
   Selbst gezeichnete SVG-Grafiken, die sich bewegen. Redebeiträge stammen aus den Beispielszenen der beiden IBK-Klausuren.
====================================================================== */
const LAB=(function(){
  const NS='http://www.w3.org/2000/svg';
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ST=['EL','ER','K'], NAME={EL:'Eltern-Ich',ER:'Erwachsenen-Ich',K:'Kind-Ich'};
  const POS=(side,s)=>({x:side==='A'?62:298,y:[46,126,206][ST.indexOf(s)]});
  const root=()=>{ const v=document.getElementById('v-lb-ibk-labor'); return v&&v.querySelector('.lbx'); };
  const q=sel=>{ const r=root(); return r&&r.querySelector(sel); };
  const el=(n,a,p)=>{ const e=document.createElementNS(NS,n); for(const k in (a||{})) e.setAttribute(k,a[k]); if(p) p.appendChild(e); return e; };
  const KEY='bvi_lb_lab';
  let S={tab:'z',cnt:{p:0,k:0,v:0},mq:{},sq:{}};
  let tabsDone=0;
  function load(){ try{ const o=JSON.parse(localStorage.getItem(KEY)||'null'); if(o&&typeof o==='object') S=Object.assign(S,o); }catch(e){} S.cnt=S.cnt||{p:0,k:0,v:0}; }
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify({tab:S.tab,cnt:S.cnt})); }catch(e){} }

  /* ---------- Diagramm ---------- */
  function board(host,names,pick,hot){
    host.innerHTML='';
    const svg=el('svg',{viewBox:'0 0 360 280',role:'img','aria-label':'Ich-Zustände von '+names[0]+' und '+names[1]},host);
    const defs=el('defs',{},svg);
    [['m1','var(--m-accent)'],['m2','var(--lx-bl)']].forEach(([id,c])=>{ const m=el('marker',{id:'lx-'+id,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6.5,markerHeight:6.5,orient:'auto'},defs); el('path',{d:'M0 0L10 5L0 10z',fill:c},m); });
    el('text',{x:62,y:16,class:'lx-who'},svg).textContent=names[0]; el('text',{x:298,y:16,class:'lx-who'},svg).textContent=names[1];
    ['A','B'].forEach(side=>ST.forEach(s=>{
      const p=POS(side,s), g=el('g',{class:pick?'lx-hit':'',tabindex:pick?0:-1,role:pick?'button':'img','aria-label':NAME[s]+' '+names[side==='A'?0:1]},svg);
      el('circle',{cx:p.x,cy:p.y,r:27,class:'lx-node'+(hot&&hot[side+s]?' hot':'')},g); el('text',{x:p.x,y:p.y+5,class:'lx-nt'},g).textContent=s;
      if(pick){ const f=()=>pick(side,s); g.addEventListener('click',f); g.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); f(); } }); }
    }));
    return {svg,layer:el('g',{},svg)};
  }
  function arrow(b,from,to,o){
    o=o||{}; const a=POS(from[0],from.slice(1)), t=POS(to[0],to.slice(1));
    const dx=t.x-a.x, dy=t.y-a.y, len=Math.hypot(dx,dy), ux=dx/len, uy=dy/len;
    const p=el('path',{d:`M${a.x+ux*29} ${a.y+uy*29} L${t.x-ux*33} ${t.y-uy*33}`,pathLength:1,class:'lx-arr lx-draw'+(o.dash?' lx-dash':''),stroke:o.blue?'var(--lx-bl)':'var(--m-accent)','marker-end':`url(#lx-${o.blue?'m2':'m1'})`},b.layer);
    p.style.animationDelay=(o.delay||0)+'ms'; return p;
  }
  function burst(b,x,y,txt,col,delay){
    const g=el('g',{class:'lx-pop'},b.layer); g.style.animationDelay=(delay||0)+'ms';
    el('circle',{cx:x,cy:y,r:17,fill:col},g); const t=el('text',{x,y:y+6,'text-anchor':'middle',fill:'#fff','font-size':17,'font-weight':900},g); t.textContent=txt;
  }

  /* ---------- Zeichner ---------- */
  const PRE=[
    {k:'K2 (1)',t:'(1) Bergmann, abfällig zu Pfeiffer: „Die zwei Prinzen kommen wieder auf den letzten Drücker.“',a:'Bergmann',b:'Pfeiffer',reiz:['AEL','BK'],hint:'Der Reiz ist gesetzt: kritisches Eltern-Ich spricht das Kind-Ich an.'},
    {k:'K2 (3)',t:'(3) Aydin: „Wir sind da, 06:58 Uhr, umgezogen. Dienstbeginn ist sieben. Wenn du über uns sprichst, Gerd, dann bitte mit uns.“',a:'Aydin',b:'Bergmann',reiz:['AER','BER'],hint:'Der Reiz ist gesetzt: Erwachsenen-Ich spricht das Erwachsenen-Ich an.'},
    {k:'K1 (1)',t:'(1) Lindner: „Es ist halb elf. Die Ausbildung läuft seit einer halben Stunde, wieder ohne euch. Das ist jetzt das dritte Mal in Folge.“',a:'Lindner',b:'Seidel',reiz:['AEL','BK'],hint:'Der Reiz ist gesetzt: kritisches Eltern-Ich (Vorwurf) an das Kind-Ich.'}
  ];
  const Z={i:0,from:null,pick:null,verd:false};
  function zRender(){
    const r=root(), host=r.querySelector('[data-p=z]'), p=PRE[Z.i];
    host.innerHTML=`<div class="m-card"><div class="lx-row">${PRE.map((x,i)=>`<button type="button" class="lx-chip${i===Z.i?' on':''}" onclick="LAB.zi(${i})">${x.k}</button>`).join('')}</div>
      <div class="lx-say">${esc(p.t)}</div><div class="lx-step"><span class="lx-n">1</span>${esc(p.hint)}</div>
      <div class="lx-step"><span class="lx-n${Z.pick?'':' d'}">2</span><span data-zs>${Z.pick?'Reaktion: '+NAME[Z.pick.s]+' → '+NAME[Z.pick.t]:'Tippen Sie: Aus welchem Ich-Zustand antwortet '+esc(p.b)+' (rechts), an welchen von '+esc(p.a)+' (links) geht die Antwort?'}</span></div>
      <div data-zb></div><div class="lx-row"><button type="button" class="lx-chip${Z.verd?' on':''}" aria-pressed="${Z.verd}" onclick="LAB.zv()">Verdeckte Botschaft dazu</button><button type="button" class="btn btn-ghost" onclick="LAB.zi(${Z.i})">Zurücksetzen</button></div></div>
      <div data-zres></div><div class="m-card"><div class="m-eyebrow">Strichliste</div><div class="lx-tal" data-tal></div></div>`;
    talRender();
    const bd=board(host.querySelector('[data-zb]'),[p.a,p.b],(side,s)=>{
      if(Z.pick) return;
      if(!Z.from){ if(side!=='B') return; Z.from=s; zRender(); return; }
      if(side!=='A') return; Z.pick={s:Z.from,t:s}; zEval();
    },Z.from&&!Z.pick?{['B'+Z.from]:1}:{});
    arrow(bd,p.reiz[0],p.reiz[1]);
    if(Z.verd&&!Z.pick) arrow(bd,'AEL','BK',{blue:1,dash:1,delay:300});
    if(Z.pick){ arrow(bd,'B'+Z.pick.s,'A'+Z.pick.t,{blue:1,delay:350}); if(!zPar()) burst(bd,180,126,'✕','var(--c-err,#d4493b)',1100); }
  }
  const zPar=()=>{ const r=PRE[Z.i].reiz; return Z.pick.s===r[1].slice(1)&&Z.pick.t===r[0].slice(1); };
  function zEval(){
    let kind,cls,txt;
    if(Z.verd){ kind='v'; cls='bl'; txt='<b>Verdeckt (doppelbödig).</b> Soziale Ebene: Erwachsenen-Ich zu Erwachsenen-Ich (durchgezogen). Psychologische Ebene: Eltern-Ich zu Kind-Ich (gestrichelt). Regel 3: Das weitere Verhalten entscheidet sich auf der psychologischen Ebene. Sinnvoll sind die direkte Rückfrage („Was möchtest du mir damit sagen?“) oder das Ignorieren der verdeckten Ebene.'; }
    else if(zPar()){ kind='p'; cls='ok'; txt='<b>Parallel (stimmig).</b> Regel 1: Die Kommunikation kann ungestört weiterlaufen.'+(Z.pick.s==='K'&&Z.pick.t==='EL'?' Achtung: kritisches Eltern-Ich gegen rebellisches Kind-Ich endet oft im „Tumult“. Parallel heißt nicht automatisch gut.':''); }
    else { kind='k'; cls='no'; txt='<b>Gekreuzt.</b> Regel 2: Die Antwort kommt aus einem anderen Ich-Zustand oder geht an einen anderen als erwartet, die Kommunikation bricht ab. Zum Glätten wechselt mindestens einer den Ich-Zustand, am besten ins Erwachsenen-Ich.'; }
    zSay(); setTimeout(()=>{ const d=q('[data-zres]'); if(!d) return; d.innerHTML=`<div class="m-card lx-fade"><div class="lx-row" style="justify-content:space-between"><b>Auswertung</b><span class="lx-res ${cls}">${kind==='p'?'parallel':kind==='k'?'gekreuzt':'verdeckt'}</span></div><p>${txt}</p><button type="button" class="m-go2" onclick="LAB.zt('${kind}',this)">In Strichliste eintragen</button></div>`; },900);
  }
  function zSay(){ const s=q('[data-zs]'); if(s&&Z.pick) s.textContent='Reaktion: '+NAME[Z.pick.s]+' → '+NAME[Z.pick.t]; }
  function talRender(){ const t=q('[data-tal]'); if(t) t.innerHTML=[['p','parallel'],['k','gekreuzt'],['v','verdeckt']].map(([x,n])=>`<div><b>${S.cnt[x]}</b><span>${n}</span></div>`).join(''); }

  /* ---------- Regeln ---------- */
  const RUL=[
    {t:'Regel 1: parallel',lead:'„Solange die Botschaften stimmig zueinander oder parallel verlaufen, kann sich die Kommunikation ungestört und unendlich lange fortsetzen.“',
     play(b,n){ arrow(b,'AER','BER'); arrow(b,'BER','AER',{blue:1,delay:900}); arrow(b,'AER','BER',{delay:1800}); n('Sachliche Frage','sachliche Antwort','Gespräch läuft weiter'); },
     res:['ok','Gespräch läuft weiter','Beispiel: „Wann ist die Übergabe?“ – „Um sieben.“ – „Danke.“ Parallel heißt stimmig, nicht automatisch gut: Kritisches Eltern-Ich gegen rebellisches Kind-Ich endet im „Tumult“.']},
    {t:'Regel 2: gekreuzt',lead:'„Die Kommunikation bricht ab, wenn eine Transaktion gekreuzt verläuft.“ Die häufigste Ursache für Dienstaufsichtsbeschwerden sind „gekreuzte Schwerter“.',
     play(b,n){ arrow(b,'AER','BER'); arrow(b,'BK','AEL',{blue:1,delay:900}); burst(b,180,126,'✕','var(--c-err,#d4493b)',1900); n('Sachliche Frage','Antwort aus dem Kind-Ich','Abbruch'); },
     res:['no','Kommunikation bricht ab','Beispiel: „Wann ist die Übergabe?“ – „Immer diese Vorwürfe!“ Zum Glätten muss einer den Ich-Zustand wechseln.']},
    {t:'Regel 3: verdeckt',lead:'„Bei der verdeckten Transaktion fällt die Entscheidung über das weitere Verhalten auf der psychologischen Ebene und nicht auf der sozialen Ebene.“',
     play(b,n){ arrow(b,'AER','BER'); arrow(b,'AEL','BK',{blue:1,dash:1,delay:900}); burst(b,180,86,'?','var(--lx-bl)',1700); n('Sachebene (durchgezogen)','Beziehungsebene (gestrichelt)','Was ist wirklich gemeint?'); },
     res:['bl','Zwei Botschaften gleichzeitig','Beispiel: „Ich sag das nur, damit ihr nicht auffallt.“ Sache: Rat (ER zu ER). Beziehung: Tadel (EL zu K). Regel: nicht mitspielen, nachfragen oder die verdeckte Ebene ignorieren.']}
  ];
  let R=0;
  function rRender(){
    const host=root().querySelector('[data-p=r]'), r=RUL[R];
    host.innerHTML=`<div class="m-card"><div class="lx-row">${RUL.map((x,i)=>`<button type="button" class="lx-chip${i===R?' on':''}" onclick="LAB.ri(${i})">${i+1}</button>`).join('')}<button type="button" class="m-go2" style="margin-left:auto" onclick="LAB.rp()">▶ Abspielen</button></div><h3 class="lx-h">${r.t}</h3><p class="lx-mu">${r.lead}</p><div data-rb></div><div class="lx-row" data-rs style="min-height:34px"></div><div data-rr></div></div>`;
    rPlay();
  }
  function rPlay(){
    const r=RUL[R], bd=board(q('[data-rb]'),['Person A','Person B']), steps=q('[data-rs]'), res=q('[data-rr]'); steps.innerHTML=''; res.innerHTML='';
    r.play(bd,(...l)=>l.forEach((x,i)=>setTimeout(()=>{ const s=q('[data-rs]'); if(s&&R===RUL.indexOf(r)) s.insertAdjacentHTML('beforeend',`<span class="lx-chip lx-fade">${i+1}. ${x}</span>`); },i*900)));
    setTimeout(()=>{ const d=q('[data-rr]'); if(d&&R===RUL.indexOf(r)) d.innerHTML=`<div class="lx-say lx-fade lx-${r.res[0]}"><b>${r.res[1]}</b><br><small>${r.res[2]}</small></div>`; },2700);
  }

  /* ---------- Quiz Transaktionen ---------- */
  const QZ=[
    {w:['Wolff','Aydin'],s:['(12) Wolff: „Es ist zwei Minuten vor sieben, wir haben noch die Fahrzeugübernahme. Wollt ihr das hier jetzt wirklich austragen?“','(13) Aydin: „Danke, Sabine. Ich beginne sofort mit der Übergabe.“'],a:[['AER','BER'],['BER','AER']],ans:'p',e:'Beide sprechen sachlich aus dem Erwachsenen-Ich. Parallel, die Kommunikation läuft weiter.'},
    {w:['Aydin','Bergmann'],s:['(3) Aydin: „Wenn du über uns sprichst, Gerd, dann bitte mit uns.“','(4) Bergmann: „Wenn ihr euch angesprochen fühlt, dann ist das euer Problem.“'],a:[['AER','BER'],['BEL','AK']],ans:'k',e:'Die sachliche Bitte (ER zu ER) wird aus dem kritischen Eltern-Ich an das Kind-Ich beantwortet. Gekreuzt, das Gespräch bricht ab.'},
    {w:['Lindner','Seidel'],s:['(1) Lindner: „Das ist jetzt das dritte Mal in Folge.“ (laut und gepresst)','(2) Seidel: „Wir waren bei der Brandschau im Hafen. Das ist Arbeit, falls du dich erinnerst.“ (ironisch gedehnt)'],a:[['AEL','BK'],['BK','AEL']],ans:'p',e:'Kritisches Eltern-Ich trifft rebellisches Kind-Ich. Formal parallel, aber das endet oft im Tumult, also laut und mit Trennung.'},
    {w:['Seidel','Hartmann'],s:['(10) Seidel zur Anwärterin: „Lass dir nichts erzählen, Kleine. Hier geht es nur darum, wer wen vorführt.“ (freundliche Miene, herablassender Unterton)','(keine Antwort nötig: Die Botschaft hat zwei Ebenen.)'],a:[['AER','BER'],['AEL','BK']],d:1,ans:'v',e:'Sachebene: Rat (ER zu ER). Beziehungsebene: Herablassung (EL zu K). Zwei Botschaften, also verdeckt (doppelbödig).'},
    {w:['Aydin','Bergmann'],s:['(7) Aydin: „Wo steht denn, dass wir eine Viertelstunde vorher kommen müssen?“','(8) Bergmann: „Das steht nirgends! Das macht man einfach so. Davon habt ihr ja keine Ahnung.“ (belehrend, von oben herab)'],a:[['AER','BER'],['AEL','BK']],ans:'k',e:'Die sachliche Frage wird mit Belehrung und Abwertung beantwortet: Eltern-Ich zum Kind-Ich statt Erwachsenen-Ich zum Erwachsenen-Ich. Gekreuzt.'}
  ];
  QZ[1].a[1]=['BK','AEL']; // Antwort kommt aus dem Eltern-Ich von Bergmann (B) an das Kind-Ich von Aydin (A); Pfeil siehe qDraw
  const Q={i:0,sc:0,pick:null};
  function qRender(){
    const host=root().querySelector('[data-p=q]');
    if(Q.i>=QZ.length){ host.innerHTML=`<div class="m-card"><div class="m-eyebrow">Ergebnis</div><p class="lx-big">${Q.sc} von ${QZ.length}</p><p class="lx-mu">${Q.sc>=4?'Sehr gut. Sie erkennen die Muster sicher.':'Wiederholen Sie die Regeln im Tab „Regeln“.'}</p><button type="button" class="m-go2" onclick="LAB.qn(true)">Noch einmal</button></div>`; return; }
    const z=QZ[Q.i];
    host.innerHTML=`<div class="m-card"><div class="lx-row" style="justify-content:space-between"><b>Frage ${Q.i+1} von ${QZ.length}</b><span class="lx-chip">${Q.sc} Punkte</span></div><div class="lx-say">${esc(z.s[0])}</div><div class="lx-say lx-b">${esc(z.s[1])}</div><div data-qb></div><p class="lx-mu">Welche Art von Transaktion ist das?</p><div class="lx-row">${[['p','parallel'],['k','gekreuzt'],['v','verdeckt']].map(([k,n])=>`<button type="button" class="btn btn-ghost" data-k="${k}" onclick="LAB.qa('${k}',this)">${n}</button>`).join('')}</div><div data-qf></div></div>`;
    board(q('[data-qb]'),z.w);
  }
  function qDraw(z){
    const bd=board(q('[data-qb]'),z.w);
    if(z.ans==='k'&&z.w[0]==='Aydin'&&z.w[1]==='Bergmann'){ arrow(bd,'AER','BER'); arrow(bd,'BEL','AK',{blue:1,delay:600}); }
    else { arrow(bd,z.a[0][0],z.a[0][1]); if(z.d) arrow(bd,z.a[1][0],z.a[1][1],{blue:1,dash:1,delay:350}); else arrow(bd,z.a[1][0],z.a[1][1],{blue:1,delay:600}); }
    if(z.ans==='k') burst(bd,180,126,'✕','var(--c-err,#d4493b)',1500); if(z.ans==='v') burst(bd,180,86,'?','var(--lx-bl)',1300);
  }

  /* ---------- Maslow ---------- */
  const ML=[
    {n:'Physiologische Bedürfnisse',k:'Schlaf, Essen, Erholung',b:'Ruhezeiten nach Nachtdienst, Pausen, Verpflegung, körperliche Belastung im Einsatz.',c:'defizit'},
    {n:'Sicherheitsbedürfnisse',k:'Stabilität, klare Regeln, verlässliche Planung',b:'Verlässlicher Dienstplan, klare (auch geschriebene) Regeln, sicherer Arbeitsplatz. Ungeschriebene Regeln wie „Viertelstunde vorher“ erzeugen Unsicherheit.',c:'defizit'},
    {n:'Soziale Bedürfnisse',k:'Zugehörigkeit, Kameradschaft, Team',b:'Zum Team gehören, nicht hinter dem Rücken besprochen werden. Hier setzt das Zitat „Mit wem du arbeitest, ist wichtiger als wo“ an.',c:'defizit'},
    {n:'Wertschätzung (Ich-Bedürfnisse)',k:'Anerkennung, Respekt, Status',b:'Lob, Respekt vor Erfahrung und Leistung, faire Aufgabenverteilung. Abwertende Begriffe wie „Prinzen“ verletzen diese Stufe.',c:'defizit'},
    {n:'Selbstverwirklichung',k:'Entfaltung, Sinn, Weiterentwicklung',b:'Eigene Fähigkeiten einsetzen, Verantwortung und Perspektive, Mitarbeiterförderung. Wachstumsbedürfnis: wird nie „satt“.',c:'wachstum'}
  ];
  const MQ=[
    ['Nach drei Einsätzen in der Nacht fällt die Pause weg und die Gruppe bekommt keine Zeit zum Essen.',0],
    ['Die Anwärterin weiß nicht, wie es hier läuft. Niemand erklärt ihr die Regeln.',1],
    ['Zwei junge Brandmeister werden hinter ihrem Rücken besprochen und gehören nicht dazu.',2],
    ['Erfahrene Kräfte fühlen sich benachteiligt und nicht mehr gesehen („Prinzen“, kaum noch Löschfahrzeug).',3],
    ['Der Gruppenführer sieht keine Perspektive, sich weiterzuentwickeln oder Ausbildungsaufgaben zu übernehmen.',4]
  ];
  const M={sel:null,qi:0,sc:0,done:false,built:false};
  function mRender(){
    const host=root().querySelector('[data-p=m]');
    const W=360,H=250,lh=46,gap=4, short=['Physiologisch','Sicherheit','Soziales','Wertschätzung','Selbstverwirklichung'];
    let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Maslow-Pyramide mit fünf Stufen">`;
    ML.forEach((l,i)=>{ const row=4-i, top=row*(lh+gap)+6, wb=340-i*40, wt=wb-40, cx=W/2;
      const cls='lx-lvl'+(M.sel===i?' sel':'')+(M.hit===i?' hit':'')+(M.bad===i?' bad':'');
      svg+=`<g class="${cls}" style="--d:${(4-i)*140}ms" tabindex="0" role="button" aria-label="${esc(l.n)}" onclick="LAB.ms(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();LAB.ms(${i})}"><path d="M${cx-wt/2} ${top} L${cx+wt/2} ${top} L${cx+wb/2} ${top+lh} L${cx-wb/2} ${top+lh} Z"/><text x="${cx}" y="${top+lh/2+4}">${i+1} ${short[i]}</text></g>`; });
    svg+='</svg>';
    const l=M.sel!=null?ML[M.sel]:null, z=MQ[M.qi];
    host.innerHTML=`<div class="m-card"><div class="lx-row"><b>Bedürfnispyramide nach Maslow</b><button type="button" class="m-go2" style="margin-left:auto" onclick="LAB.mb()">▶ Aufbauen</button></div><p class="lx-mu">Fünf Stufen, die von unten nach oben aufeinander aufbauen. Stufe 1 bis 4 sind Defizitbedürfnisse (sie drängen, wenn sie fehlen), Stufe 5 ist ein Wachstumsbedürfnis.</p><div class="lx-pyr">${svg}</div>
      ${l?`<div class="lx-say lx-fade"><b>${esc(l.n)}</b> · ${l.c==='wachstum'?'Wachstumsbedürfnis':'Defizitbedürfnis'}<br><small>${esc(l.k)}</small><br>${esc(l.b)}</div>`:'<p class="lx-mu">Tippen Sie eine Stufe an, um Beispiele aus der Dienststelle zu sehen.</p>'}</div>
      <div class="m-card"><div class="m-eyebrow">Übung ${M.qi<MQ.length?(M.qi+1)+' von '+MQ.length:''}</div>${M.qi<MQ.length?`<p><b>Welche Stufe ist hier verletzt?</b> Tippen Sie sie in der Pyramide an.</p><div class="lx-say">${esc(z[0])}</div>${M.msg?`<div class="lx-say lx-fade lx-${M.ok?'ok':'no'}">${M.msg}</div><button type="button" class="m-go2" onclick="LAB.mn()">Weiter →</button>`:''}`:`<p class="lx-big">${M.sc} von ${MQ.length}</p><button type="button" class="m-go2" onclick="LAB.mr()">Noch einmal</button>`}</div>`;
  }

  /* ---------- Schulz von Thun ---------- */
  const SV=[
    {s:'„Die zwei Prinzen kommen wieder auf den letzten Drücker.“',w:'(1) Bergmann, Klausur 2',
     o:{sach:'Es ist kurz vor Dienstbeginn, zwei Kollegen sind noch nicht in der Dienststelle.',self:'Ich ärgere mich und lege großen Wert auf Anwesenheit vor Dienstbeginn.',bez:'Ihr seid unzuverlässig und ich stehe über euch.',app:'Seid künftig früher da.'},
     miss:'Aydin und Kuhn hören vor allem mit dem Beziehungsohr („Prinzen“) und reagieren auf die Abwertung, nicht auf den Sachinhalt.'},
    {s:'„Wo steht denn, dass wir eine Viertelstunde vorher kommen müssen?“',w:'(7) Aydin, Klausur 2',
     o:{sach:'Eine Pflicht, 15 Minuten früher zu kommen, ist nirgends festgelegt.',self:'Ich fühle mich ungerecht behandelt und fordere eine nachvollziehbare Regel.',bez:'Du kannst mir keine Pflicht vorhalten, die es nicht gibt. Wir sind gleichberechtigt.',app:'Nenne die Regel oder lass den Vorwurf fallen.'},
     miss:'Bergmann hört das Beziehungsohr („du hast hier nichts zu sagen“) und antwortet mit Belehrung statt mit einer Auskunft.'},
    {s:'„Ich wollte nur die Teeküche fertig machen. Kai hat gesagt, das machen die Anwärter morgens.“',w:'(11) Hartmann, Klausur 1',
     o:{sach:'Die Anwärterin räumt die Teeküche auf, weil es ihr so gesagt wurde.',self:'Ich bin unsicher und verängstigt, ich will nichts falsch machen.',bez:'Ich bin neu und auf eure Unterstützung angewiesen.',app:'Sagt mir, was ich richtig machen soll, und zieht mich nicht in den Streit hinein.'},
     miss:'Wer nur das Sachohr nutzt, überhört den Hilferuf. Gutes Onboarding erkennt die Selbstoffenbarung und die Beziehungsbotschaft.'}
  ];
  const SIDES=[['sach','Sachinhalt','Worüber informiere ich?'],['self','Selbstoffenbarung','Was gebe ich von mir preis?'],['bez','Beziehung','Wie stehen wir zueinander?'],['app','Appell','Wozu möchte ich dich veranlassen?']];
  const V={i:0,split:false,hold:null,placed:{},order:null,bad:null};
  function vRender(){
    const host=root().querySelector('[data-p=v]'), z=SV[V.i];
    if(!V.order||V.order.i!==V.i){ const k=['sach','self','bez','app'], o=k.slice(); for(let a=o.length-1;a>0;a--){ const b=Math.floor(Math.random()*(a+1)); [o[a],o[b]]=[o[b],o[a]]; } V.order={i:V.i,o}; }
    const left=V.order.o.filter(k=>!V.placed[k]), all=Object.keys(V.placed).length===4;
    host.innerHTML=`<div class="m-card"><div class="lx-row">${SV.map((x,i)=>`<button type="button" class="lx-chip${i===V.i?' on':''}" onclick="LAB.vi(${i})">Satz ${i+1}</button>`).join('')}</div>
      <div class="lx-bubble"><small>${esc(z.w)}</small><br><b>${z.s}</b></div>
      <div class="lx-row"><button type="button" class="m-go2" onclick="LAB.vs()">▶ In vier Seiten aufspalten</button></div>
      <div class="lx-sq">${SIDES.map(([k,n,f],i)=>`<button type="button" class="lx-cell${V.placed[k]?' ok':''}${V.bad===k?' bad':''}" style="--d:${i*160}ms" onclick="LAB.vc('${k}')"><b>${n}</b><small>${f}</small>${V.placed[k]?`<span class="lx-fade">${esc(z.o[k])}</span>`:'<em>Hier ablegen</em>'}</button>`).join('')}</div>
      ${all?`<div class="lx-say lx-fade lx-ok"><b>Alle vier Seiten zugeordnet.</b><br><small>Typisches Missverständnis:</small> ${esc(z.miss)}</div>`:`<p class="lx-mu">Tippen Sie eine Aussage an und dann die Seite, zu der sie gehört:</p><div class="lx-opts">${left.map(k=>`<button type="button" class="lx-chip${V.hold===k?' on':''}" onclick="LAB.vh('${k}')">${esc(z.o[k])}</button>`).join('')}</div>`}</div>`;
  }

  const TABS=[['z','Zeichner'],['r','Regeln'],['q','Quiz'],['m','Maslow'],['v','Schulz von Thun']];
  function show(t){
    S.tab=t; save(); const r=root(); if(!r) return;
    r.querySelectorAll('.lx-tab').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===t));
    r.querySelectorAll('[data-p]').forEach(p=>p.hidden=p.dataset.p!==t);
    ({z:zRender,r:rRender,q:qRender,m:mRender,v:vRender})[t]();
  }
  return {
    init(){ load(); const r=root(); if(!r) return;
      r.innerHTML=`<div class="lx-tabs" role="tablist">${TABS.map(([k,n])=>`<button type="button" role="tab" class="lx-tab" data-t="${k}" aria-selected="false" onclick="LAB.t('${k}')">${n}</button>`).join('')}</div>`+TABS.map(([k])=>`<section data-p="${k}" hidden></section>`).join('');
      show(TABS.some(t=>t[0]===S.tab)?S.tab:'z'); },
    t:show,
    zi(i){ Z.i=i; Z.from=null; Z.pick=null; zRender(); },
    zv(){ Z.verd=!Z.verd; Z.from=null; Z.pick=null; zRender(); },
    zt(k,btn){ S.cnt[k]++; save(); talRender(); btn.textContent='Eingetragen'; btn.disabled=true; },
    ri(i){ R=i; rRender(); }, rp(){ rPlay(); },
    qa(k,b){ if(Q.pick) return; Q.pick=k; const z=QZ[Q.i], ok=k===z.ans; if(ok) Q.sc++; qDraw(z);
      root().querySelectorAll('[data-k]').forEach(x=>{ x.disabled=true; if(x.dataset.k===z.ans) x.classList.add('lx-good'); else if(x===b) x.classList.add('lx-badb'); });
      setTimeout(()=>{ const f=q('[data-qf]'); if(f) f.innerHTML=`<div class="lx-say lx-fade lx-${ok?'ok':'no'}"><b>${ok?'Richtig.':'Nicht ganz.'}</b> ${esc(z.e)}</div><button type="button" class="m-go2" onclick="LAB.qn()">${Q.i+1<QZ.length?'Weiter':'Ergebnis'} →</button>`; },1000); },
    qn(reset){ if(reset){ Q.i=0; Q.sc=0; } else Q.i++; Q.pick=null; qRender(); },
    ms(i){ if(M.qi<MQ.length&&!M.msg&&M.armed){ const ok=MQ[M.qi][1]===i; if(ok) M.sc++; M.ok=ok; M.hit=MQ[M.qi][1]; M.bad=ok?null:i; M.msg=(ok?'<b>Richtig.</b> ':'<b>Nicht ganz.</b> Gemeint ist Stufe '+(MQ[M.qi][1]+1)+' ('+esc(ML[MQ[M.qi][1]].n)+'). ')+esc(ML[MQ[M.qi][1]].b); M.sel=MQ[M.qi][1]; mRender(); return; }
      M.sel=i; mRender(); },
    mn(){ M.qi++; M.msg=null; M.hit=null; M.bad=null; M.sel=null; mRender(); },
    mr(){ M.qi=0; M.sc=0; M.msg=null; M.hit=null; M.bad=null; M.sel=null; mRender(); },
    mb(){ mRender(); const p=q('.lx-pyr'); if(p){ p.classList.remove('built'); void p.offsetWidth; p.classList.add('built'); setTimeout(()=>p.classList.remove('built'),1700); } },
    vi(i){ V.i=i; V.split=false; V.hold=null; V.placed={}; V.bad=null; vRender(); },
    vs(){ vRender(); const s=q('.lx-sq'); if(s){ s.classList.remove('split'); void s.offsetWidth; s.classList.add('split'); setTimeout(()=>s.classList.remove('split'),1200); } },
    vh(k){ V.hold=V.hold===k?null:k; vRender(); },
    vc(side){ if(!V.hold||V.placed[side]) return; if(V.hold===side){ V.placed[side]=1; V.hold=null; V.bad=null; } else { V.bad=side; setTimeout(()=>{ V.bad=null; if(root()) vRender(); },650); } vRender(); }
  };
})();
