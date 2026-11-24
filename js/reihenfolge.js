/* ======================================================================
   REIHENFOLGE – Pausenraum (wird erst beim Öffnen des Spiels geladen)
   Durcheinandergewürfelte Schritte in die richtige Reihenfolge bringen.
   Bedienung: Zeile antippen und dann eine zweite Zeile antippen (tauscht),
   Pfeil-Buttons hoch/runter, Pfeiltasten auf einer Zeile, oder per
   Griff am Zeilenanfang ziehen (Pointer-Events).
   Rekord: längste Serie richtig gelöster Aufgaben (localStorage bvi_pause_best.reihenfolge).
   Alle Inhalte stammen aus index.html (Lernseite), Quelle je Aufgabe im Kommentar.
====================================================================== */
const REIHENFOLGE=(function(){
  'use strict';
  const BKEY0='bvi_pause_best', SID='rf-style';

  /* Aufgaben: t = Titel, s = Schritte in korrekter Reihenfolge. */
  const TASKS=[
    // Quelle: index.html, Führungsvorgang FwDV 100 (Merksatz „Lagefeststellung → Planung → Befehlsgebung → Kontrolle“)
    {t:'Führungsvorgang nach FwDV 100',s:['Lagefeststellung','Planung','Befehlsgebung','Kontrolle']},
    // Quelle: index.html, Abschnitt „4 Phasen der Erkundung“
    {t:'Die 4 Phasen der Erkundung',s:['Frontalansicht des Schadenobjektes','Befragung anwesender Personen','Innenansicht und Zugänge','Gesamtansicht']},
    // Quelle: index.html, GABC-Führungsgrundsatz (Merksatz: Lagefeststellung → EIMER-Regel → Gefahrengruppe → Körperschutz → GAMS → Dekon-Stufe), die ersten sechs Schritte
    {t:'Führungsgrundsatz GABC (erste sechs Schritte)',s:['Lagefeststellung','EIMER-Regel','Gefahrengruppe bestimmen','Körperschutz festlegen','GAMS anwenden','Dekon-Stufe anordnen']},
    // Quelle: index.html, Verbandsführer-Checkliste (erste sechs Schritte)
    {t:'Checkliste des Verbandsführers',s:['Eigene Lage beurteilen','Abschnitte einteilen','Abschnittsleiter einsetzen','Aufträge erteilen','Lagemeldung an die Einsatzleitung','Kontinuierliche Kontrolle']},
    // Quelle: index.html, Qualitätsmanagement, PDCA-Regelkreis (Deming-Kreis)
    {t:'PDCA-Zyklus',s:['Plan: planen','Do: umsetzen','Check: überprüfen','Act: standardisieren und verbessern']},
    // Quelle: index.html, Teamentwicklung nach Tuckman (Tabelle der Phasen)
    {t:'Teamphasen nach Tuckman',s:['Forming (Orientierung)','Storming (Konfrontation)','Norming (Kooperation)','Performing (Leistung)','Adjourning (Auflösung)']},
    // Quelle: index.html, NTW-Planung im Katastrophenschutz (5 Phasen)
    {t:'Die 5 Phasen der Planung im Katastrophenschutz (NTW-Beispiel)',s:['Brainstorming','Szenarienauswahl','Szenarienfolgenbetrachtung','Planungsziele ableiten','Maßnahmen ableiten']},
    // Quelle: index.html, S4-Konzept in 4 Phasen (Sofort → Aufbau → Durchhalten → Rückbau)
    {t:'S4-Konzept bei einem Großschadensfall',s:['Sofortphase','Aufbauphase','Durchhaltephase','Rückbau']},
    // Quelle: index.html, Rangfolge der Rechtsquellen (Grafik und Liste: Rang fallend)
    {t:'Rangfolge der Rechtsquellen, höchster Rang zuerst',s:['Grundgesetz','Formelle Bundesgesetze','Materielle Bundesgesetze','Landesverfassungen','Formelle Landesgesetze','Materielle Landesgesetze']},
    // Quelle: index.html, Laufbahnrecht und Dienstgrade (Tabelle, mittlerer Dienst, aufsteigend)
    {t:'Dienstgrade im mittleren Dienst, aufsteigend',s:['Brandmeister','Oberbrandmeister','Hauptbrandmeister','Hauptbrandmeister mit Amtszulage']},
    // Quelle: index.html, Laufbahnrecht und Dienstgrade (Tabelle, gehobener Dienst, aufsteigend)
    {t:'Dienstgrade im gehobenen Dienst, aufsteigend',s:['Brandinspektor','Brandoberinspektor','Brandamtmann','Brandamtsrat','Brandoberamtsrat']},
    // Quelle: index.html, Laufbahnrecht und Dienstgrade (Tabelle, höherer Dienst, aufsteigend)
    {t:'Dienstgrade im höheren Dienst, aufsteigend',s:['Brandrat','Brandoberrat','Branddirektor','Leitender Branddirektor']},
    // Quelle: index.html, Vergabe (offenes Verfahren, Regelfall), Schritte 4 bis 8
    {t:'Offenes Vergabeverfahren: von der Bekanntmachung zum Zuschlag',s:['Auftragsbekanntmachung','Angebotsfrist','Öffnung und Wertung der Angebote','Bieterinformation mit Wartefrist','Zuschlag und Vertragsschluss']},
    // Quelle: index.html, Personalplanung (Bestandsanalyse, Bedarfsanalyse, Lückenanalyse, Maßnahmen)
    {t:'Personalplanung',s:['Bestandsanalyse','Bedarfsanalyse','Lückenanalyse','Maßnahmen']},
    // Quelle: index.html, Haushalt (F 22): Anmeldungen → Beratung durch Parlamente → Genehmigung → Veröffentlichung
    {t:'Der Weg zum Haushalt',s:['Anmeldungen','Beratung und Anpassung durch die Parlamente','Genehmigung durch die Aufsichtsbehörde','Veröffentlichung']},
    // Quelle: index.html, Controlling-Regelkreis (Ziele setzen → Planen → Umsetzen → Kontrollieren → Gegensteuern)
    {t:'Regelkreis des Controllings',s:['Ziele setzen','Planen','Umsetzen','Kontrollieren','Gegensteuern']}
  ].filter(x=>x.s.length>=4&&x.s.length<=6);

  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const lget=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
  const lset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  const say=m=>{ if(typeof A11Y!=='undefined') A11Y.say(m); };
  const reduced=()=>{ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
  const shuffle=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

  let el=null, S=null, drag=null, deck=[];

  function css(){
    if(document.getElementById(SID)) return;
    const st=document.createElement('style'); st.id=SID;
    st.textContent=`
.rf{max-width:600px;margin:0 auto;width:100%;box-sizing:border-box;}
.rf *{box-sizing:border-box;}
.rf-hud{display:flex;gap:8px;}
.rf-hud div{flex:1;background:var(--m-raised,#2a2f36);border-radius:12px;padding:8px 6px;text-align:center;}
.rf-hud b{display:block;font-size:1.35rem;font-weight:800;line-height:1.15;color:var(--m-fg,#eee);}
.rf-hud span{font-size:.7rem;letter-spacing:.07em;text-transform:uppercase;color:var(--m-muted,#999);font-weight:700;}
.rf-hud div.hot b{color:#ffa31a;}
.rf-title{font-weight:800;font-size:1.08rem;line-height:1.35;color:var(--m-fg,#eee);margin:0;}
.rf-hint{font-size:.84rem;line-height:1.45;color:var(--m-muted,#999);margin:0;}
.rf-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;position:relative;}
.rf-row{display:flex;align-items:stretch;gap:0;background:var(--m-raised,#2a2f36);border:2px solid transparent;border-radius:13px;position:relative;min-height:52px;transition:transform .18s ease,border-color .15s,background .15s,box-shadow .15s;}
.rf-row.sel{border-color:#ffa31a;background:color-mix(in srgb,#ffa31a 16%,var(--m-raised,#2a2f36));}
.rf-row.drag{z-index:5;transition:none;box-shadow:0 8px 22px rgba(0,0,0,.35);border-color:#ffa31a;}
.rf-row.shift{transition:transform .16s ease;}
.rf-grip{flex:none;width:34px;display:grid;place-items:center;color:var(--m-dim,#888);cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;border-radius:11px 0 0 11px;font-size:1.15rem;letter-spacing:-2px;line-height:1;}
.rf-grip:active{cursor:grabbing;}
.rf-main{flex:1;min-width:0;display:flex;align-items:center;gap:10px;background:none;border:0;color:var(--m-fg,#eee);font-family:inherit;font-size:.93rem;line-height:1.35;text-align:left;padding:8px 6px;cursor:pointer;}
.rf-main:focus-visible,.rf-mv:focus-visible,.rf-grip:focus-visible{outline:3px solid #ffa31a;outline-offset:-3px;}
.rf-n{flex:none;width:26px;height:26px;border-radius:50%;background:var(--m-card,#1c2026);color:var(--m-accent-fg,#ffa31a);font-weight:800;font-size:.82rem;display:grid;place-items:center;}
.rf-tx{overflow-wrap:anywhere;hyphens:auto;}
.rf-mvs{flex:none;display:flex;flex-direction:column;width:44px;border-left:1px solid var(--m-line,#3a3f46);}
.rf-mv{flex:1;min-height:26px;background:none;border:0;color:var(--m-fg,#eee);font-size:.8rem;cursor:pointer;font-family:inherit;padding:0;}
.rf-mv:first-child{border-bottom:1px solid var(--m-line,#3a3f46);border-radius:0 11px 0 0;}
.rf-mv:last-child{border-radius:0 0 11px 0;}
.rf-mv:disabled{opacity:.25;cursor:default;}
.rf-row.ok{border-color:var(--pz-ok,#2fae6b);background:color-mix(in srgb,var(--pz-ok,#2fae6b) 18%,var(--m-raised,#2a2f36));}
.rf-row.bad{border-color:var(--pz-bad,#e5484d);background:color-mix(in srgb,var(--pz-bad,#e5484d) 16%,var(--m-raised,#2a2f36));}
.rf-row.fix{background:var(--m-raised,#2a2f36);}
.rf-res .rf-main{cursor:default;padding:10px 12px;}
.rf-mk{flex:none;font-weight:800;margin-left:auto;padding-left:6px;}
.rf-row.ok .rf-mk{color:var(--pz-ok,#2fae6b);}
.rf-row.bad .rf-mk{color:var(--pz-bad,#e5484d);}
.rf-sub{font-size:.75rem;letter-spacing:.09em;text-transform:uppercase;color:var(--m-muted,#999);font-weight:700;margin:4px 0 0;}
.rf-btns{display:flex;gap:8px;flex-wrap:wrap;}
.rf-btns button{min-height:44px;flex:1;}
.rf-start{text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center;padding:8px 0;}
.rf-start .rf-flame{font-size:2.4rem;line-height:1;}
.rf-start p{margin:0;color:var(--m-muted,#999);font-size:.92rem;line-height:1.5;max-width:420px;}
.rf-start .pz-pri{min-width:200px;min-height:46px;}
@media(prefers-reduced-motion:reduce){.rf-row,.rf-row.shift{transition:none!important;}}
@media(min-width:700px){.rf-main{font-size:1rem;}}
`;
    document.head.appendChild(st);
  }

  function best(){ return +(lget(JG.key(BKEY0),{}).reihenfolge||0); }
  function nextTask(){
    if(!deck.length) deck=shuffle(TASKS.map((_,i)=>i));
    return TASKS[deck.pop()];
  }
  function scramble(n){
    let a,tries=0; const id=[...Array(n).keys()];
    do{ a=shuffle(id); tries++; }while(a.every((v,i)=>v===i)&&tries<50);
    return a;
  }
  function newRound(){
    const task=nextTask();
    // order[pos] = Index des Schritts (in korrekter Reihenfolge), der an Position pos steht
    S.task=task; S.order=scramble(task.s.length); S.sel=-1; S.phase='play'; S.errors=0; S.moves=0; S.rec=false;
    render();
    say('Neue Aufgabe: '+task.t+'. '+task.s.length+' Schritte in die richtige Reihenfolge bringen.');
  }
  function fresh(){
    S={phase:'start',streak:0,solved:0,total:0,best:best(),order:[],task:null,sel:-1,errors:0,rec:false,lastBroken:0};
  }
  function setBest(v){
    const b=lget(JG.key(BKEY0),{}); b.reihenfolge=v; lset(JG.key(BKEY0),b); S.best=v;
  }

  function move(from,to){
    if(S.phase!=='play'||from===to||to<0||to>=S.order.length) return;
    const a=S.order.slice(), [x]=a.splice(from,1); a.splice(to,0,x); S.order=a; S.moves++;
  }
  function swap(i,j){
    if(S.phase!=='play'||i===j) return;
    const a=S.order.slice(); [a[i],a[j]]=[a[j],a[i]]; S.order=a; S.moves++;
  }
  function pick(i){
    if(S.phase!=='play') return;
    if(S.sel<0){ S.sel=i; render(i); say('Schritt '+(i+1)+' ausgewählt. Zweiten Schritt antippen zum Tauschen.'); return; }
    if(S.sel===i){ S.sel=-1; render(i); return; }
    const a=S.sel; S.sel=-1; swap(a,i); render(i); say('Getauscht. Position '+(i+1)+': '+S.task.s[S.order[i]]);
  }
  function step(i,d){
    const j=i+d; if(j<0||j>=S.order.length) return;
    S.sel=-1; move(i,j); render(j,d>0?'mvd':'mvu'); say('Position '+(j+1)+': '+S.task.s[S.order[j]]);
  }

  function check(){
    if(S.phase!=='play') return;
    drag=null;
    const wrong=S.order.reduce((n,v,i)=>n+(v===i?0:1),0);
    S.errors=wrong; S.total++; S.sel=-1; S.phase='result';
    if(wrong===0){
      S.streak++; S.solved++;
      if(S.streak>S.best){ const had=S.best>0; setBest(S.streak); S.rec=true; S.hadBest=had; }
      say('Richtig. Serie '+S.streak+'.');
    } else {
      S.lastBroken=S.streak; if(typeof PAUSE!=='undefined') PAUSE.addScore('reihenfolge',S.streak);
      const hadBest=S.hadBest, rec=S.rec;
      if(S.streak>0&&typeof GAME!=='undefined') GAME.cheer('spiel','Reihenfolge',rec&&hadBest?'Serie '+S.streak:'');
      S.streak=0; S.rec=false;
      say(wrong+(wrong===1?' Schritt':' Schritte')+' an der falschen Stelle. Die richtige Reihenfolge steht unter der Aufgabe.');
    }
    render();
  }

  /* ---------- Darstellung ---------- */
  function rowHtml(pos,idx,n){
    const txt=esc(S.task.s[idx]);
    return `<li class="rf-row${S.sel===pos?' sel':''}" data-p="${pos}">
      <span class="rf-grip" data-g="${pos}" aria-hidden="true" title="Ziehen">⋮⋮</span>
      <button type="button" class="rf-main" data-pick="${pos}" aria-pressed="${S.sel===pos}" aria-label="Position ${pos+1} von ${n}: ${txt}${S.sel===pos?', ausgewählt':''}"><span class="rf-n" aria-hidden="true">${pos+1}</span><span class="rf-tx">${txt}</span></button>
      <span class="rf-mvs"><button type="button" class="rf-mv" data-up="${pos}" aria-label="Nach oben: ${txt}"${pos===0?' disabled':''}>▲</button><button type="button" class="rf-mv" data-dn="${pos}" aria-label="Nach unten: ${txt}"${pos===n-1?' disabled':''}>▼</button></span></li>`;
  }
  function hud(){
    return `<div class="rf-hud" aria-label="Spielstand"><div class="${S.streak>0?'hot':''}"><b>${S.streak}</b><span>Serie</span></div><div><b>${Math.max(S.best,S.streak)}</b><span>Rekord</span></div><div><b>${S.solved}/${S.total}</b><span>Gelöst</span></div></div>`;
  }

  function render(focusPos,mv){
    if(!el||!el.isConnected||!S) return;
    if(S.phase==='start'){
      el.innerHTML=`<div class="pz-card rf"><div class="rf-start"><div class="rf-flame" aria-hidden="true">🔥</div><h3 class="rf-title">Reihenfolge</h3>
        <p>Du bekommst 4 bis 6 durcheinandergewürfelte Schritte. Bringe sie in die richtige Reihenfolge, zum Beispiel beim Führungsvorgang, bei Dienstgraden oder Verfahrensabläufen. Jede richtig gelöste Aufgabe verlängert deine Serie, ein Fehler beendet sie.</p>
        <p>Rekord: <b>${S.best>0?'Serie '+S.best:'noch keiner'}</b></p>
        <button type="button" class="pz-pri" data-a="go">Neues Spiel</button></div></div>`;
      el.querySelector('[data-a="go"]').onclick=()=>{ S.streak=0;S.solved=0;S.total=0; newRound(); const f=el&&el.querySelector('[data-pick]'); if(f) f.focus(); };
      return;
    }
    const n=S.order.length;
    if(S.phase==='play'){
      el.innerHTML=`<div class="pz-card rf">${hud()}
        <div class="pz-lbl"><span>Aufgabe ${S.total+1}</span><b>${n} Schritte</b></div>
        <h3 class="rf-title">${esc(S.task.t)}</h3>
        <p class="rf-hint">Tippe einen Schritt an und dann einen zweiten, dann tauschen sie die Plätze. Oder nutze ▲ ▼, Pfeiltasten (auf einer Zeile) oder ziehe am Griff ⋮⋮.</p>
        <ol class="rf-list" aria-label="Schritte, oben ist der erste">${S.order.map((idx,pos)=>rowHtml(pos,idx,n)).join('')}</ol>
        <div class="rf-btns"><button type="button" class="pz-pri" data-a="check">Prüfen</button></div></div>`;
      bindPlay();
      if(focusPos!=null){
        const sel=mv==='mvd'?'[data-dn="'+focusPos+'"]':mv==='mvu'?'[data-up="'+focusPos+'"]':'[data-pick="'+focusPos+'"]';
        const f=el.querySelector(sel)||el.querySelector('[data-pick="'+focusPos+'"]'); if(f) f.focus({preventScroll:true});
      }
      return;
    }
    // Auflösung
    const ok=S.errors===0;
    const mine=S.order.map((idx,pos)=>`<li class="rf-row ${idx===pos?'ok':'bad'}"><span class="rf-main"><span class="rf-n" aria-hidden="true">${pos+1}</span><span class="rf-tx">${esc(S.task.s[idx])}</span><span class="rf-mk" aria-label="${idx===pos?'richtig':'falsch'}">${idx===pos?'✓':'✗'}</span></span></li>`).join('');
    const right=S.task.s.map((t,i)=>`<li class="rf-row fix"><span class="rf-main"><span class="rf-n" aria-hidden="true">${i+1}</span><span class="rf-tx">${esc(t)}</span></span></li>`).join('');
    el.innerHTML=`<div class="pz-card rf rf-res">${hud()}
      <h3 class="rf-title">${esc(S.task.t)}</h3>
      <div class="pz-fb ${ok?'g':'r'}" role="status">${ok?`<b>Richtig!</b> Serie: ${S.streak}${S.rec&&S.hadBest?' · <b>Neuer Rekord!</b>':''}`:`<b>${S.errors} ${S.errors===1?'Schritt':'Schritte'} an der falschen Stelle.</b> Deine Serie von ${S.lastBroken} ist beendet.`}</div>
      ${ok?'':`<p class="rf-sub">Deine Reihenfolge</p><ol class="rf-list">${mine}</ol><p class="rf-sub">Richtige Reihenfolge</p>`}
      ${ok?'<p class="rf-sub">Richtige Reihenfolge</p>':''}
      <ol class="rf-list">${right}</ol>
      <div class="rf-btns"><button type="button" class="pz-pri" data-a="next">Nächste Aufgabe</button></div></div>`;
    const nb=el.querySelector('[data-a="next"]'); nb.onclick=()=>{ newRound(); const f=el&&el.querySelector('[data-pick]'); if(f) f.focus({preventScroll:true}); };
    nb.focus({preventScroll:true});
  }

  function bindPlay(){
    el.querySelector('[data-a="check"]').onclick=check;
    el.querySelectorAll('[data-pick]').forEach(b=>{
      b.onclick=()=>pick(+b.dataset.pick);
      b.onkeydown=e=>{
        if(e.altKey||e.ctrlKey||e.metaKey) return;
        const i=+b.dataset.pick;
        if(e.key==='ArrowUp'){ e.preventDefault(); if(i>0){ step(i,-1); const f=el.querySelector('[data-pick="'+(i-1)+'"]'); if(f) f.focus({preventScroll:true}); } }
        else if(e.key==='ArrowDown'){ e.preventDefault(); if(i<S.order.length-1){ step(i,1); const f=el.querySelector('[data-pick="'+(i+1)+'"]'); if(f) f.focus({preventScroll:true}); } }
      };
    });
    el.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>step(+b.dataset.up,-1));
    el.querySelectorAll('[data-dn]').forEach(b=>b.onclick=()=>step(+b.dataset.dn,1));
    el.querySelectorAll('[data-g]').forEach(g=>g.addEventListener('pointerdown',dragStart));
  }

  /* ---------- Drag and Drop per Pointer-Events ---------- */
  function dragStart(e){
    if(S.phase!=='play'||drag||(e.pointerType==='mouse'&&e.button!==0)) return;
    const g=e.currentTarget, from=+g.dataset.g, rows=[...el.querySelectorAll('.rf-list .rf-row')];
    if(!rows[from]) return;
    e.preventDefault();
    try{ g.setPointerCapture(e.pointerId); }catch(x){}
    S.sel=-1; rows.forEach(r=>r.classList.remove('sel'));
    const rects=rows.map(r=>r.getBoundingClientRect());
    drag={g,id:e.pointerId,from,to:from,y0:e.clientY,rows,rects,h:rects[from].height+8};
    rows[from].classList.add('drag');
    rows.forEach((r,i)=>{ if(i!==from&&!reduced()) r.classList.add('shift'); });
    g.addEventListener('pointermove',dragMove);
    g.addEventListener('pointerup',dragEnd);
    g.addEventListener('pointercancel',dragEnd);
  }
  function dragMove(e){
    if(!drag||e.pointerId!==drag.id) return;
    const d=drag, dy=e.clientY-d.y0, r0=d.rects[d.from];
    const first=d.rects[0].top-r0.top, last=d.rects[d.rects.length-1].bottom-r0.bottom;
    const ty=Math.max(first,Math.min(last,dy));
    d.rows[d.from].style.transform='translateY('+ty+'px)';
    const cy=r0.top+r0.height/2+ty;
    // Zielposition: Anzahl der Zeilen (ohne die gezogene), deren Mitte über der Zeigerposition liegt
    let to=0; d.rects.forEach((r,i)=>{ if(i!==d.from&&r.top+r.height/2<cy) to++; });
    d.to=to;
    d.rows.forEach((r,i)=>{
      if(i===d.from) return;
      let sh=0;
      if(d.to>d.from&&i>d.from&&i<=d.to) sh=-d.h;
      else if(d.to<d.from&&i>=d.to&&i<d.from) sh=d.h;
      r.style.transform=sh?'translateY('+sh+'px)':'';
    });
  }
  function dragEnd(e){
    if(!drag||(e&&e.pointerId!==drag.id)) return;
    const d=drag; drag=null;
    d.g.removeEventListener('pointermove',dragMove); d.g.removeEventListener('pointerup',dragEnd); d.g.removeEventListener('pointercancel',dragEnd);
    try{ d.g.releasePointerCapture(d.id); }catch(x){}
    const cancel=e&&e.type==='pointercancel';
    if(!cancel&&d.to!==d.from){ move(d.from,d.to); render(d.to); say('Position '+(d.to+1)+': '+S.task.s[S.order[d.to]]); }
    else render(d.from);
  }

  function start(host){
    stop(); css(); el=host; deck=[]; drag=null; fresh(); render();
  }
  function stop(){
    if(drag){ try{ drag.g.removeEventListener('pointermove',dragMove); drag.g.removeEventListener('pointerup',dragEnd); drag.g.removeEventListener('pointercancel',dragEnd); }catch(e){} drag=null; }
    el=null;
  }
  return {start,stop,_state:()=>S,_tasks:TASKS};
})();
