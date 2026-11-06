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
  const reduce=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
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
    o.classList.remove('hidden');
    if(typeof SEARCH!=='undefined'&&SEARCH.expand) SEARCH.expand(box,btn);
    setTimeout(()=>inp.focus({preventScroll:true}),30);
  }
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

  return {
    ok, submit, toggle, typed:mask, lock, render, ask, closeModal, fieldSubmit, fieldTyped,
    onShow(id){
      if(id==='v-lb-start'){ if(!shown){ shown=true; } render(); }
      if(id==='v-lb-vb') vbInit();
    },
    // Laufbahn gibt es nur im Master-Jahrgang; ohne Passwort geht es zur Sperrseite
    guard(id){ if(!/^v-lb-/.test(id)) return id; if(typeof JG!=='undefined'&&!JG.isMaster()) return 'v-pruefung'; return /^v-lb-(ibk|vb)/.test(id)&&!ok()?'v-lb-start':id; },
    pick(id){ st.k=id; save(); vbRender(); window.scrollTo({top:0}); },
    type,
    eval(){ const k=K(); st.ev[k.id]=1; save(); vbRender(); window.scrollTo({top:0,behavior:'smooth'}); },
    again(){ const k=K(); delete st.ev[k.id]; delete st.a[k.id]; Object.keys(st.m).forEach(x=>{ if(x.startsWith(k.id+':')) delete st.m[x]; }); save(); vbRender(); window.scrollTo({top:0}); },
    mark(key,v){ st.m[key]=v?1:0; save(); const y=window.scrollY; vbRender(); window.scrollTo(0,y); }
  };
})();
