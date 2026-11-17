/* ======================================================================
   2048 MIT DIENSTGRADEN – Pausenraum (wird erst beim Öffnen des Spiels geladen)
   Gleiche Dienstgrade verschmelzen zum nächsthöheren, Ziel: Leitender Branddirektor.
   Reihe: mittlerer, gehobener und höherer feuerwehrtechnischer Dienst (nach index.html / game.js).
   Rekord: localStorage['bvi_pause_best'].g2048 = höchste Punktzahl (höher ist besser).
   Spielstand: localStorage['bvi_g2048_state'] (Brett + Punkte), wird bei stop() gesichert.
====================================================================== */
const G2048=(function(){
  'use strict';
  const N=4, BKEY='bvi_pause_best', SKEY='bvi_g2048_state', STYLE_ID='g2048-style';
  /* a = Kürzel, n = Dienstgrad, g = Laufbahngruppe */
  const RANKS=[
    {a:'BM', n:'Brandmeister',            g:'Mittlerer Dienst'},
    {a:'OBM',n:'Oberbrandmeister',        g:'Mittlerer Dienst'},
    {a:'HBM',n:'Hauptbrandmeister',       g:'Mittlerer Dienst'},
    {a:'BI', n:'Brandinspektor',          g:'Gehobener Dienst'},
    {a:'BOI',n:'Brandoberinspektor',      g:'Gehobener Dienst'},
    {a:'BAM',n:'Brandamtmann',            g:'Gehobener Dienst'},
    {a:'BAR',n:'Brandamtsrat',            g:'Gehobener Dienst'},
    {a:'BR', n:'Brandrat',                g:'Höherer Dienst'},
    {a:'OBR',n:'Oberbrandrat',            g:'Höherer Dienst'},
    {a:'BD', n:'Branddirektor',           g:'Höherer Dienst'},
    {a:'LBD',n:'Leitender Branddirektor', g:'Höherer Dienst'}
  ];
  const TOP=RANKS.length;                       // Stufe 11 = 2048
  const rk=n=>RANKS[Math.min(n,TOP)-1];
  const val=n=>Math.pow(2,n);
  const fmt=v=>Number(v).toLocaleString('de-DE');
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const lget=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
  const lset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  const ldel=k=>{try{localStorage.removeItem(k);}catch(e){}};
  const say=m=>{ if(typeof A11Y!=='undefined') A11Y.say(m); };
  const reduced=()=>!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd=n=>Math.floor(Math.random()*n);

  const CSS=`
.g48{max-width:560px;margin:0 auto;width:100%;box-sizing:border-box;}
.g48 *{box-sizing:border-box;}
.g48-hud{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.g48-hud div{background:var(--m-raised,#2a2a2a);border-radius:12px;padding:7px 6px;text-align:center;min-width:0;}
.g48-hud b{display:block;font-size:1.15rem;color:var(--m-fg,#eee);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.g48-hud span{font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--m-muted,#999);font-weight:700;}
.g48-goal{margin:0;font-size:.84rem;line-height:1.4;color:var(--m-muted,#999);text-align:center;}
.g48-goal b{color:var(--m-fg,#eee);}
.g48-wrap{position:relative;width:100%;}
.g48-board{position:relative;width:100%;aspect-ratio:1/1;container-type:inline-size;background:var(--m-line,#444);border-radius:14px;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden;}
.g48-grid{position:absolute;inset:0;}
.g48-cell{position:absolute;width:25%;height:25%;padding:1.2cqw;}
.g48-cell i{display:block;width:100%;height:100%;border-radius:2.4cqw;background:var(--m-card,#1c1c1c);opacity:.75;}
.g48-t{position:absolute;left:0;top:0;width:25%;height:25%;padding:1.2cqw;z-index:2;transform:translate(calc(var(--c)*100%),calc(var(--r)*100%));transition:transform .12s ease-out;will-change:transform;}
.g48-t.dead{z-index:1;}
.g48-i{width:100%;height:100%;border-radius:2.4cqw;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4cqw;background:linear-gradient(160deg,var(--b2),var(--b1));color:var(--f);box-shadow:inset 0 -.6cqw 0 rgba(0,0,0,.18),0 .4cqw 1.2cqw rgba(0,0,0,.25);font-family:inherit;overflow:hidden;}
.g48-a{font-weight:800;font-size:7.6cqw;line-height:1;letter-spacing:.01em;}
.g48-v{font-size:3cqw;line-height:1;font-weight:600;opacity:.85;font-variant-numeric:tabular-nums;}
.g48-new .g48-i{animation:g48-appear .18s .1s ease-out backwards;}
.g48-pop .g48-i{animation:g48-pop .22s ease-out;}
@keyframes g48-appear{from{transform:scale(.4);opacity:0;}to{transform:scale(1);opacity:1;}}
@keyframes g48-pop{0%{transform:scale(1);}45%{transform:scale(1.2);}100%{transform:scale(1);}}
.g48-l1{--b1:#5d7791;--b2:#7390ab;--f:#fff;}
.g48-l2{--b1:#4d8aa6;--b2:#63a3c0;--f:#fff;}
.g48-l3{--b1:#3f9a96;--b2:#58b5b0;--f:#08211f;}
.g48-l4{--b1:#6fa95c;--b2:#8cc577;--f:#10200b;}
.g48-l5{--b1:#bcb23f;--b2:#d9cf5a;--f:#251f00;}
.g48-l6{--b1:#ecb132;--b2:#f9c953;--f:#2a1d00;}
.g48-l7{--b1:#ff9a14;--b2:#ffb445;--f:#2a1600;}
.g48-l8{--b1:#f27a1a;--b2:#ff9648;--f:#2a1000;}
.g48-l9{--b1:#e8542a;--b2:#f87a4e;--f:#fff;}
.g48-l10{--b1:#d12f33;--b2:#ee5357;--f:#fff;}
.g48-l11{--b1:#e8a900;--b2:#ffdc5c;--f:#3a1400;}
.g48-l11 .g48-i{box-shadow:inset 0 -.6cqw 0 rgba(0,0,0,.18),0 0 3cqw rgba(255,170,20,.75);}
.g48-ov{position:absolute;inset:0;border-radius:14px;background:color-mix(in srgb,var(--m-bg,#111) 86%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:16px;z-index:5;animation:g48-fade .3s .3s ease-out backwards;}
.g48-ov[hidden]{display:none;}
.g48-ov h3{margin:0;font-size:1.35rem;color:var(--m-fg,#eee);}
.g48-ov p{margin:0;color:var(--m-muted,#999);font-size:.9rem;line-height:1.45;max-width:34ch;}
.g48-ov p b{color:var(--m-fg,#eee);}
.g48-ov .pz-pri,.g48-ov .pz-sec2{min-height:44px;padding:10px 22px;}
.g48-ov .pz-sec2{border-radius:13px;}
@keyframes g48-fade{from{opacity:0;}to{opacity:1;}}
.g48-pad{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.g48-pad button{min-height:44px;border:0;border-radius:12px;background:var(--m-raised,#2a2a2a);color:var(--m-fg,#eee);font-size:1.1rem;font-family:inherit;cursor:pointer;}
.g48-pad button:active{background:var(--m-line,#444);}
.g48-tools{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;}
.g48-tools .pz-sec2{min-height:44px;padding:10px 18px;}
.g48 button:focus-visible,.g48 summary:focus-visible{outline:3px solid var(--m-accent,#ffa31a);outline-offset:2px;}
.g48-leg summary{cursor:pointer;font-size:.84rem;color:var(--m-muted,#999);font-weight:600;padding:6px 0;}
.g48-leg ol{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:5px;}
.g48-leg li{display:flex;align-items:center;gap:10px;font-size:.84rem;color:var(--m-fg,#eee);}
.g48-leg li i{flex:none;width:46px;text-align:center;font-style:normal;font-weight:800;font-size:.78rem;border-radius:8px;padding:5px 0;background:linear-gradient(160deg,var(--b2),var(--b1));color:var(--f);}
.g48-leg li small{margin-left:auto;color:var(--m-dim,#777);font-size:.72rem;text-align:right;}
@media(max-width:420px){.g48-hud b{font-size:1rem;}}
@media(prefers-reduced-motion:reduce){
  .g48-t{transition:none;}
  .g48-new .g48-i,.g48-pop .g48-i,.g48-ov{animation:none;}
}`;

  let el=null, S=null, kd=null, deadT=null, els=new Map(), dead=[], uid=0, boardEl=null;

  function injectCss(){
    if(document.getElementById(STYLE_ID)) return;
    const st=document.createElement('style'); st.id=STYLE_ID; st.textContent=CSS; document.head.appendChild(st);
  }

  /* ---------- Spiellogik ---------- */
  function fresh(){
    const best=+(lget(BKEY,{}).g2048||0);
    S={tiles:[],score:0,best:best,start:best,status:'play',won:false,keep:false,top:0,rec:false};
    spawn(); spawn(); S.top=maxN();
  }
  function maxN(){ return S.tiles.reduce((m,t)=>Math.max(m,t.n),0); }
  function spawn(){
    const used=new Set(S.tiles.map(t=>t.r*N+t.c)), free=[];
    for(let i=0;i<N*N;i++) if(!used.has(i)) free.push(i);
    if(!free.length) return null;
    const p=free[rnd(free.length)], t={id:++uid,r:Math.floor(p/N),c:p%N,n:Math.random()<.9?1:2};
    S.tiles.push(t); return t;
  }
  function canMove(){
    if(S.tiles.length<N*N) return true;
    const g={}; S.tiles.forEach(t=>{ g[t.r*N+t.c]=t.n; });
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){
      const v=g[r*N+c];
      if(c+1<N&&g[r*N+c+1]===v) return true;
      if(r+1<N&&g[(r+1)*N+c]===v) return true;
    }
    return false;
  }
  /* dr,dc = Bewegungsrichtung; liefert {moved, merged:[{keep,gone}], } */
  function slide(dr,dc){
    const g={}; S.tiles.forEach(t=>{ g[t.r*N+t.c]=t; });
    let moved=false; const merges=[];
    for(let l=0;l<N;l++){
      const pos=[]; // k=0 liegt an der Kante, auf die zugeschoben wird
      for(let k=0;k<N;k++){
        if(dc!==0){ pos.push({r:l,c:dc>0?N-1-k:k}); }
        else { pos.push({r:dr>0?N-1-k:k,c:l}); }
      }
      let w=0, last=null, lastMerged=false;
      for(let k=0;k<N;k++){
        const t=g[pos[k].r*N+pos[k].c]; if(!t) continue;
        if(last&&!lastMerged&&last.n===t.n){
          // verschmelzen: t gleitet auf last
          merges.push({keep:last,gone:t,fromR:t.r,fromC:t.c});
          t.r=last.r; t.c=last.c; moved=true; last.n++; S.score+=val(last.n); lastMerged=true;
        } else {
          const tp=pos[w++];
          if(t.r!==tp.r||t.c!==tp.c){ t.r=tp.r; t.c=tp.c; moved=true; }
          last=t; lastMerged=false;
        }
      }
    }
    if(moved){ const gone=new Set(merges.map(m=>m.gone)); S.tiles=S.tiles.filter(t=>!gone.has(t)); }
    return {moved,merges};
  }
  function move(dr,dc){
    if(!el||!S||S.status!=='play') return;
    flushDead();
    const res=slide(dr,dc);
    if(!res.moved) return;
    const spawned=spawn();
    // Animation: Positionen setzen, verschmolzene Kachel entfernen, neue Kachel einblenden
    res.merges.forEach(m=>{
      const ge=els.get(m.gone.id); if(ge){ ge.classList.add('dead'); setPos(ge,m.gone); dead.push(ge); els.delete(m.gone.id); }
    });
    S.tiles.forEach(t=>{ const e=els.get(t.id); if(e) setPos(e,t); });
    res.merges.forEach(m=>{ const e=els.get(m.keep.id); if(e){ paintTile(e,m.keep.n); pop(e); } });
    if(spawned) addTile(spawned,true);
    if(dead.length){ if(reduced()) flushDead(); else deadT=setTimeout(flushDead,140); }
    afterMove();
  }
  function afterMove(){
    const top=maxN(), prevTop=S.top;
    if(top>prevTop){
      S.top=top;
      if(top>=3) say('Neuer höchster Dienstgrad: '+rk(top).n+'.');
    }
    if(S.score>S.best){ S.best=S.score; const b=lget(BKEY,{}); b.g2048=S.best; lset(BKEY,b); S.rec=S.start>0; }
    if(!S.won&&!S.keep&&top>=TOP){
      S.won=true; S.status='win';
      if(typeof GAME!=='undefined') GAME.cheer('spiel','2048 Dienstgrade',S.rec?fmt(S.best)+' Punkte':'');
      say('Höchster Dienstgrad erreicht: Leitender Branddirektor. Du kannst weiterspielen.');
    } else if(!canMove()){
      S.status='over';
      if(S.score>0&&typeof GAME!=='undefined') GAME.cheer('spiel','2048 Dienstgrade',S.rec?fmt(S.best)+' Punkte':'');
      say('Kein Zug mehr möglich. '+fmt(S.score)+' Punkte.'+(S.rec?' Neuer Rekord.':''));
    }
    if(S.status==='over') ldel(SKEY); else save();
    render();
  }
  function save(){
    if(!S||S.status==='over') return;
    lset(SKEY,{t:S.tiles.map(t=>[t.r,t.c,t.n]),s:S.score,w:S.won,k:S.keep,b0:S.start});
  }
  function restore(){
    const d=lget(SKEY,null);
    if(!d||!Array.isArray(d.t)||d.t.length<1||d.t.length>N*N||typeof d.s!=='number') return false;
    const seen=new Set(), tiles=[];
    for(const a of d.t){
      if(!Array.isArray(a)||a.length!==3) return false;
      const r=a[0],c=a[1],n=a[2];
      if(!Number.isInteger(r)||!Number.isInteger(c)||!Number.isInteger(n)||r<0||c<0||r>=N||c>=N||n<1||n>20) return false;
      if(seen.has(r*N+c)) return false; seen.add(r*N+c);
      tiles.push({id:++uid,r,c,n});
    }
    const best=+(lget(BKEY,{}).g2048||0);
    S={tiles,score:Math.max(0,d.s),best:Math.max(best,d.s),start:typeof d.b0==='number'?d.b0:best,status:'play',won:!!d.w,keep:!!d.k,top:0,rec:false};
    S.top=maxN();
    if(!canMove()){ ldel(SKEY); return false; }
    if(S.won&&!S.keep) S.keep=true;           // Gewinn-Hinweis wurde schon gezeigt
    return true;
  }

  /* ---------- Darstellung ---------- */
  function setPos(e,t){ e.style.setProperty('--r',t.r); e.style.setProperty('--c',t.c); }
  function paintTile(e,n){
    const r=rk(n);
    e.className=e.className.replace(/\bg48-l\d+\b/g,'').replace(/\s+/g,' ').trim()+' g48-l'+Math.min(n,TOP);
    e.querySelector('.g48-a').textContent=r.a;
    e.querySelector('.g48-v').textContent=fmt(val(n));
    e.setAttribute('data-n',n);
  }
  function pop(e){ e.classList.remove('g48-pop','g48-new'); void e.offsetWidth; e.classList.add('g48-pop'); }
  function addTile(t,isNew){
    const e=document.createElement('div'); e.className='g48-t'; e.setAttribute('aria-hidden','true');
    e.innerHTML='<div class="g48-i"><span class="g48-a"></span><span class="g48-v"></span></div>';
    setPos(e,t); paintTile(e,t.n); if(isNew) e.classList.add('g48-new');
    boardEl.querySelector('.g48-tiles').appendChild(e); els.set(t.id,e); return e;
  }
  function flushDead(){
    clearTimeout(deadT); deadT=null;
    dead.forEach(e=>{ if(e.parentNode) e.parentNode.removeChild(e); }); dead=[];
  }
  function drawBoard(){
    flushDead(); els=new Map();
    const host=boardEl.querySelector('.g48-tiles'); host.innerHTML='';
    S.tiles.forEach(t=>addTile(t,false));
  }
  function build(){
    let cells=''; for(let i=0;i<N*N;i++) cells+=`<div class="g48-cell" style="left:${(i%N)*25}%;top:${Math.floor(i/N)*25}%"><i></i></div>`;
    const leg=RANKS.map((r,i)=>`<li><i class="g48-l${i+1}">${r.a}</i><span>${esc(r.n)}</span><small>${esc(r.g)} · ${fmt(val(i+1))}</small></li>`).join('');
    el.innerHTML=`<div class="pz-card g48">
      <div class="g48-hud"><div><b data-h="score">0</b><span>Punkte</span></div><div><b data-h="best">0</b><span>Rekord</span></div><div><b data-h="top">BM</b><span>Grad</span></div></div>
      <p class="g48-goal" data-h="goal"></p>
      <div class="g48-wrap">
        <div class="g48-board" role="img" aria-label="Spielfeld 2048 mit Dienstgraden, 4 mal 4 Felder. Steuerung mit Pfeiltasten, WASD oder Wischen."><div class="g48-grid">${cells}</div><div class="g48-tiles g48-grid"></div></div>
        <div class="g48-ov" role="dialog" aria-live="polite" hidden></div>
      </div>
      <div class="g48-pad" role="group" aria-label="Zusätzliche Steuerung"><button type="button" data-d="l" aria-label="nach links">◀</button><button type="button" data-d="u" aria-label="nach oben">▲</button><button type="button" data-d="d" aria-label="nach unten">▼</button><button type="button" data-d="r" aria-label="nach rechts">▶</button></div>
      <div class="g48-tools"><button type="button" class="pz-sec2" data-t="new">Neues Spiel</button></div>
      <details class="g48-leg"><summary>Reihe der Dienstgrade</summary><ol>${leg}</ol></details>
      <div class="pz-fb">Pfeiltasten / WASD oder wischen. Gleiche Dienstgrade verschmelzen zum nächsthöheren.</div></div>`;
    boardEl=el.querySelector('.g48-board');
    el.querySelectorAll('.g48-pad [data-d]').forEach(b=>b.addEventListener('click',()=>{
      const d=b.dataset.d; move(d==='u'?-1:d==='d'?1:0,d==='l'?-1:d==='r'?1:0);
    }));
    el.querySelector('[data-t="new"]').onclick=newGame;
    // Wischen (Touch und Maus)
    let t0=null;
    boardEl.addEventListener('pointerdown',e=>{ t0={x:e.clientX,y:e.clientY,id:e.pointerId}; });
    boardEl.addEventListener('pointermove',e=>{
      if(!t0||e.pointerId!==t0.id) return;
      const dx=e.clientX-t0.x, dy=e.clientY-t0.y;
      if(Math.max(Math.abs(dx),Math.abs(dy))<28) return;
      t0=null;
      if(Math.abs(dx)>Math.abs(dy)) move(0,dx>0?1:-1); else move(dy>0?1:-1,0);
    });
    const end=()=>{ t0=null; };
    boardEl.addEventListener('pointerup',end); boardEl.addEventListener('pointercancel',end); boardEl.addEventListener('pointerleave',end);
    el.querySelector('.g48-ov').addEventListener('click',e=>{
      const b=e.target.closest('button'); if(!b) return;
      if(b.dataset.a==='keep'){ S.keep=true; S.status='play'; save(); render(); }
      else newGame();
    });
  }
  function render(){
    if(!el||!el.isConnected||!S) return;
    const set=(k,v)=>{ const n=el.querySelector('[data-h="'+k+'"]'); if(n&&n.textContent!==String(v)) n.textContent=v; };
    set('score',fmt(S.score)); set('best',fmt(Math.max(S.best,S.score))); set('top',rk(S.top).a);
    const tr=rk(S.top), next=S.top<TOP?rk(S.top+1):null;
    const goal=el.querySelector('[data-h="goal"]');
    goal.innerHTML=next?`Höchster Grad: <b>${esc(tr.n)}</b>. Nächstes Ziel: <b>${esc(next.n)}</b> (${next.a}).`:`Höchster Grad erreicht: <b>${esc(tr.n)}</b>.`;
    const ov=el.querySelector('.g48-ov'), prev=ov.getAttribute('data-s')||'';
    if(S.status==='play'){ ov.hidden=true; ov.setAttribute('data-s',''); return; }
    ov.hidden=false;
    if(prev===S.status) return;
    ov.setAttribute('data-s',S.status);
    if(S.status==='win'){
      ov.setAttribute('aria-label','Höchster Dienstgrad erreicht');
      ov.innerHTML=`<h3>Leitender Branddirektor!</h3><p>Du hast den höchsten Dienstgrad der Reihe erreicht. <b>${fmt(S.score)} Punkte</b>${S.rec?'<br><b>Neuer Rekord!</b>':''}</p><button type="button" class="pz-pri" data-a="keep">Weiterspielen</button><button type="button" class="pz-sec2" data-a="new">Neues Spiel</button>`;
    } else {
      ov.setAttribute('aria-label','Spiel beendet');
      ov.innerHTML=`<h3>Kein Zug mehr</h3><p>Höchster Grad: <b>${esc(tr.n)}</b><br><b>${fmt(S.score)} Punkte</b>${S.rec?'<br><b>Neuer Rekord!</b>':''}</p><button type="button" class="pz-pri" data-a="new">Neues Spiel</button>`;
    }
    const f=ov.querySelector('button'); if(f){ try{ f.focus({preventScroll:true}); }catch(e){} }
  }
  function newGame(){
    ldel(SKEY); fresh(); drawBoard(); render();
    say('Neues Spiel gestartet.');
  }

  function start(host){
    stop(); injectCss(); el=host;
    build();
    if(!restore()) fresh();
    drawBoard(); render(); save();
    kd=e=>{
      if(!el||!el.isConnected||e.ctrlKey||e.metaKey||e.altKey) return;
      const t=e.target; if(t&&t.closest&&t.closest('input,textarea,select,[contenteditable]')) return;
      const k=(e.key||'');
      const m={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1],w:[-1,0],s:[1,0],a:[0,-1],d:[0,1]};
      const d=m[k]||m[k.toLowerCase()];
      if(d){ e.preventDefault(); move(d[0],d[1]); }
    };
    document.addEventListener('keydown',kd);
  }
  function stop(){
    if(S&&el) save();
    clearTimeout(deadT); deadT=null; dead=[]; els=new Map();
    if(kd){ document.removeEventListener('keydown',kd); kd=null; }
    el=null; boardEl=null;
  }
  return {start,stop,_state:()=>S};
})();
