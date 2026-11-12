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
  function sLoad(){ try{ S=JSON.parse(localStorage.getItem(SIMKEY)||'null'); }catch(e){ S=null; } if(!S||typeof S!=='object') S={}; S.phase=S.phase||'start'; S.acc=S.acc||0; S.a=S.a||{}; S.r=S.r||{}; S.tal=S.tal||{p:0,k:0,v:0}; }
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
    return (simData[k]=D);
  }
  const allBlocks=D=>D.tasks.flatMap(t=>t.blocks);
  const earned=D=>allBlocks(D).reduce((a,b)=>a+b.pts*(S.r[b.key]||0),0);
  const totalPts=D=>D.tasks.reduce((a,t)=>a+t.pts,0);

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
      <div class="lbsim-pick"><button type="button" class="m-go2" onclick="LB.sim.start('ibk1')">${esc(KL.ibk1[1])}</button><button type="button" class="m-go2" onclick="LB.sim.start('ibk2')">${esc(KL.ibk2[1])}</button><button type="button" class="btn btn-ghost" onclick="LB.sim.start()">Zufällig ziehen</button></div></div>`
      +(run?`<div class="m-card lbsim-res"><div class="m-eyebrow">Laufende Simulation</div><p>${esc(KL[S.k][1])} · ${S.phase==='eval'?'Auswertung':S.phase==='read'?'Lesephase':'Bearbeitung'} · verbleibend ${mmss(TOTAL-elapsed())}</p><div class="lbsim-pick"><button type="button" class="m-go2" onclick="LB.sim.resume()">Fortsetzen</button><button type="button" class="btn btn-ghost" onclick="LB.sim.drop()">Verwerfen</button></div></div>`:'');
  }
  function vRead(D){
    return head(D,KL[S.k][1])+`<div class="m-card"><div class="m-eyebrow">Phase 1 · Lesen</div><p>Szene mehrfach lesen, Redebeiträge markieren, Checkliste anlegen. Empfohlen: etwa 30 Minuten. Die Aufgaben sehen Sie erst in der nächsten Phase.</p></div>`
      +`<div class="m-card lbsim-scene">${D.scene}</div>`+tools()+`<details class="lb-sol"><summary>Hinweise zum Vorgehen</summary><div class="lbsim-pad">${D.hint}</div></details>`
      +`<button type="button" class="m-go2 lbsim-go" onclick="LB.sim.work()">Lesen beenden, Aufgaben bearbeiten →</button>`;
  }
  function vWork(D){
    const bl=allBlocks(D), dn=bl.filter(b=>words(S.a[b.key])>=15).length;
    let h=head(D,KL[S.k][1])+`<div class="lbsim-prog"><div class="bar"><i style="width:${Math.round(dn/bl.length*100)}%"></i></div><small data-p>${dn} von ${bl.length} Teilaufgaben bearbeitet</small></div>`
      +`<details class="lb-sol"><summary>Szene und Strichliste</summary><div class="lbsim-pad"><div class="lbsim-scene">${D.scene}</div>${tools()}</div></details>`;
    D.tasks.forEach((t,ti)=>{
      h+=`<div class="m-card lbsim-task"><div class="lbsim-th"><b>${ti+1}. ${esc(t.name)}</b><span class="chip">${t.pts} Pkt. · ca. ${Math.round(t.pts*2.4)} Min.</span></div>${t.intro}`;
      t.blocks.forEach(b=>{ h+=`<div class="lbsim-blk"><h4>${esc(b.h)} <span>${b.pts} Pkt.</span></h4>${b.q}<textarea class="lbsim-ta" rows="5" placeholder="Ihre Antwort in Fließtext …" ${S.run?'':'disabled'} oninput="LB.sim.type('${b.key}',this)">${esc(S.a[b.key]||'')}</textarea><small class="lbsim-wc">${words(S.a[b.key])} Wörter</small></div>`; });
      h+=`</div>`;
    });
    return h+`<button type="button" class="m-go2 lbsim-go" onclick="LB.sim.finish()">Abgeben und auswerten →</button>`;
  }
  function vEval(D){
    const e=earned(D), T=totalPts(D), pct=Math.round(e/T*100), rated=allBlocks(D).filter(b=>S.r[b.key]!=null).length;
    const weak=D.tasks.map(t=>({n:t.name,p:t.blocks.reduce((a,b)=>a+b.pts*(S.r[b.key]||0),0),t:t.pts})).filter(x=>x.p/x.t<.6).sort((a,b)=>a.p/a.t-b.p/b.t).slice(0,3);
    let h=head(D,KL[S.k][1])+`<div class="m-card lbsim-sum"><div class="m-eyebrow">Auswertung</div><div class="lbsim-score"><b data-e>${(+e.toFixed(1))}</b> von ${T} Punkten <span class="chip">${pct} %</span></div><div class="bar"><i style="width:${pct}%"></i></div>`
      +`<p data-m>${rated<allBlocks(D).length?`Noch ${allBlocks(D).length-rated} Teilaufgaben ohne Bewertung. Vergleichen Sie Ihre Antwort mit der Musterlösung und bewerten Sie sich ehrlich.`:pct>=80?'Sehr stark. Prüfen Sie nur noch, ob die Brücke von der Theorie in die Praxis überall steht.':pct>=60?'Solide. Die schwächsten Themen unten gezielt nacharbeiten.':'Es gibt Lücken. Die Themen unten zuerst wiederholen, dann die Simulation noch einmal mit der anderen Klausur laufen lassen.'}</p>`
      +(weak.length?`<p><strong>Zuerst wiederholen:</strong> ${weak.map(x=>esc(x.n)+' ('+(+x.p.toFixed(1))+'/'+x.t+')').join(', ')}</p>`:'')+`</div>`;
    D.tasks.forEach((t,ti)=>{
      h+=`<div class="m-card lbsim-task"><div class="lbsim-th"><b>${ti+1}. ${esc(t.name)}</b><span class="chip" data-tp="${ti}">${(+t.blocks.reduce((a,b)=>a+b.pts*(S.r[b.key]||0),0).toFixed(1))} / ${t.pts}</span></div>`;
      t.blocks.forEach(b=>{ const r=S.r[b.key];
        h+=`<div class="lbsim-blk"><h4>${esc(b.h)} <span>${b.pts} Pkt.</span></h4><div class="lbsim-mine"><small>Ihre Antwort</small>${S.a[b.key]&&S.a[b.key].trim()?`<p>${esc(S.a[b.key])}</p>`:'<p class="lbsim-none">nicht bearbeitet</p>'}</div>`
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
    init(){ sLoad(); if(S.run&&S.phase!=='eval'){ /* nach Neuladen: Pause, Zeit der Abwesenheit zählt nicht */ S.acc+=0; S.run=false; sSave(); } simRender(); },
    start(k){ const key=k||(Math.random()<.5?'ibk1':'ibk2'); S={k:key,phase:'read',acc:0,run:true,t0:Date.now(),a:{},r:{},tal:{p:0,k:0,v:0}}; sSave(); simRender(); window.scrollTo({top:0}); },
    resume(){ if(!S.run&&S.phase!=='eval'){ S.run=true; S.t0=Date.now(); sSave(); } simRender(); },
    drop(){ clearInterval(simTick); S={phase:'start',acc:0,a:{},r:{},tal:{p:0,k:0,v:0}}; sSave(); simRender(); window.scrollTo({top:0}); },
    pause(){ if(S.run){ S.acc+=Date.now()-S.t0; S.run=false; } else { S.run=true; S.t0=Date.now(); } sSave(); simRender(); },
    work(){ S.phase='work'; sSave(); simRender(); window.scrollTo({top:0}); },
    finish(){ if(S.run){ S.acc+=Date.now()-S.t0; S.run=false; } S.phase='eval'; sSave(); simRender(); window.scrollTo({top:0}); },
    type(key,ta){ S.a[key]=ta.value; sSave(); const w=ta.nextElementSibling; if(w) w.textContent=words(ta.value)+' Wörter'; const D=parse(S.k), bl=allBlocks(D), dn=bl.filter(b=>words(S.a[b.key])>=15).length, r=root(), p=r&&r.querySelector('[data-p]'); if(p){ p.textContent=dn+' von '+bl.length+' Teilaufgaben bearbeitet'; r.querySelector('.lbsim-prog .bar i').style.width=Math.round(dn/bl.length*100)+'%'; } },
    tal(x,d){ S.tal[x]=Math.max(0,(S.tal[x]||0)+d); sSave(); const y=window.scrollY; simRender(); window.scrollTo(0,y); },
    rate(key,v){ S.r[key]=v; sSave(); const y=window.scrollY; simRender(); window.scrollTo(0,y); }
  };

  return {
    sim, ok, submit, toggle, typed:mask, lock, render, ask, closeModal, fieldSubmit, fieldTyped,
    onShow(id){
      if(id==='v-lb-start'){ if(!shown){ shown=true; } render(); }
      if(id==='v-lb-vb') vbInit();
      if(id==='v-lb-ibk-sim') sim.init();
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
