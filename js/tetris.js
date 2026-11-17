/* ======================================================================
   GERÄTEHAUS-TETRIS – Pausenraum (wird erst beim Öffnen des Spiels geladen)
   Klassisches Tetris (10 x 20, 7-Bag, Hold, Ghost). Die Steine tragen die
   Kürzel von Feuerwehrfahrzeugen: HLF, DLK, TLF, RW, ELW, MTW, GW.
====================================================================== */
const TETRIS=(function(){
  'use strict';
  const W=10, H=20, BKEY='bvi_pause_best', SID='t4-style';
  /* Steine: Form (Matrix), Farbe, Buchstabe auf den Zellen, Kürzel für die Legende */
  const PIECES={
    I:{m:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],c:'#4fc3e8',l:'D',n:'DLK'},
    O:{m:[[1,1],[1,1]],c:'#e5484d',l:'H',n:'HLF'},
    T:{m:[[0,1,0],[1,1,1],[0,0,0]],c:'#b36be0',l:'R',n:'RW'},
    S:{m:[[0,1,1],[1,1,0],[0,0,0]],c:'#3fb37f',l:'T',n:'TLF'},
    Z:{m:[[1,1,0],[0,1,1],[0,0,0]],c:'#e8d13b',l:'E',n:'ELW'},
    J:{m:[[1,0,0],[1,1,1],[0,0,0]],c:'#4a6de0',l:'M',n:'MTW'},
    L:{m:[[0,0,1],[1,1,1],[0,0,0]],c:'#ff8a1a',l:'G',n:'GW'}
  };
  const KEYS=Object.keys(PIECES), PTS=[0,100,300,500,800];
  const KICK_I=[[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1]], KICK=[[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]];
  const lget=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
  const lset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  const say=m=>{ if(typeof A11Y!=='undefined') A11Y.say(m); };
  const fmt=n=>Number(n).toLocaleString('de-DE');
  const reduced=()=>{ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
  const speedFor=lv=>Math.max(70,820-(lv-1)*68);

  let el=null, S=null, raf=0, last=0, cv=null, ctx=null, nx=null, hd=null, kd=null, ku=null, vis=null, rs=null;
  let rep={t1:0,t2:0}, ptr=null, dpr=1, bag=[];

  function css(){
    if(document.getElementById(SID)) return;
    const s=document.createElement('style'); s.id=SID;
    s.textContent=`
.t4{max-width:560px;margin:0 auto;width:100%;box-sizing:border-box;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;}
.t4-row{display:flex;gap:10px;justify-content:center;align-items:stretch;}
.t4-wrap{position:relative;flex:none;height:min(calc(100vh - 330px),calc(100dvh - 330px),calc((100vw - 150px)*2),620px);min-height:300px;aspect-ratio:1/2;}
.t4-cv{display:block;width:100%;height:100%;border-radius:10px;background:var(--m-raised,#1f2430);border:2px solid var(--m-line,#444);box-sizing:border-box;touch-action:none;}
.t4-side{width:84px;flex:none;display:flex;flex-direction:column;gap:6px;min-width:0;}
.t4-st{background:var(--m-raised,#1f2430);border-radius:10px;padding:5px 8px;line-height:1.15;}
.t4-st span{display:block;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--m-muted,#999);font-weight:700;}
.t4-st b{display:block;font-size:1.02rem;color:var(--m-fg,#eee);font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;}
.t4-box{background:var(--m-raised,#1f2430);border-radius:10px;padding:5px 4px 4px;text-align:center;border:0;font-family:inherit;color:var(--m-fg,#eee);}
.t4-box span{display:block;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--m-muted,#999);font-weight:700;}
.t4-box canvas{display:block;width:72px;height:50px;margin:2px auto 0;}
button.t4-box{cursor:pointer;}
button.t4-box:disabled{opacity:.5;cursor:default;}
.t4-side .pz-sec2{padding:8px 4px;min-height:40px;font-size:.8rem;width:100%;}
.t4-sp{flex:1;}
.t4-pad{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:10px;}
.t4-pad button{min-height:56px;border:0;border-radius:14px;background:var(--m-raised,#1f2430);color:var(--m-fg,#eee);font-family:inherit;font-size:1.35rem;font-weight:800;cursor:pointer;touch-action:none;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;}
.t4-pad button small{font-size:.62rem;font-weight:700;margin-top:3px;color:var(--m-muted,#999);letter-spacing:.03em;}
.t4-pad button:active{transform:scale(.96);background:var(--m-accent,#ffa31a);color:var(--m-on-accent,#1a1a1a);}
.t4-pad button.t4-drop{background:var(--m-accent,#ffa31a);color:var(--m-on-accent,#1a1a1a);}
.t4-pad button.t4-drop small{color:inherit;}
.t4 button:focus-visible,.t4-cv:focus-visible{outline:3px solid var(--m-accent-fg,#ffa31a);outline-offset:2px;}
.t4-ov{position:absolute;inset:2px;border-radius:8px;background:color-mix(in srgb,var(--m-card,#161a22) 90%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:10px;text-align:center;overflow:auto;}
.t4-ov[hidden]{display:none;}
.t4-ov h3{margin:0;font-size:1.15rem;color:var(--m-fg,#eee);}
.t4-ov p{margin:0;font-size:.8rem;line-height:1.4;color:var(--m-muted,#999);}
.t4-ov p b{color:var(--m-fg,#eee);}
.t4-ov .pz-pri{width:100%;max-width:190px;min-height:44px;}
.t4-leg{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;}
.t4-leg i{font-style:normal;font-size:.66rem;font-weight:800;padding:2px 6px;border-radius:6px;color:#111;}
.t4-keys{font-size:.74rem;}
.t4-hint{font-size:.78rem;line-height:1.4;color:var(--m-muted,#999);text-align:center;margin-top:8px;}
@media(max-width:420px){.t4-row{gap:8px;}.t4-side{width:80px;}.t4-hint.t4-desk{display:none;}}
@media(min-width:700px){.t4-side{width:104px;}.t4-box canvas{width:88px;height:60px;}.t4-st b{font-size:1.15rem;}}
`;
    document.head.appendChild(s);
  }

  /* ---------- Spiellogik ---------- */
  function refill(){ const a=KEYS.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } bag=bag.concat(a); }
  function draw7(){ if(bag.length<8) refill(); return bag.shift(); }
  function fresh(keepStatus){
    const b=lget(BKEY,{});
    bag=[]; refill();
    S={board:Array.from({length:H},()=>new Array(W).fill(null)),cur:null,next:draw7(),hold:null,canHold:true,score:0,lines:0,level:1,
       status:'idle',acc:0,clearRows:null,clearT:0,msg:'',msgT:0,best:+b.tetris||0,rec:false};
    S.cur=null;
  }
  function mk(k){ const p=PIECES[k], n=p.m.length; return {k,m:p.m.map(r=>r.slice()),x:Math.floor((W-n)/2),y:k==='I'?-1:0}; }
  function hits(c,dx,dy,m){
    m=m||c.m;
    for(let r=0;r<m.length;r++) for(let q=0;q<m[r].length;q++){
      if(!m[r][q]) continue;
      const x=c.x+q+dx, y=c.y+r+dy;
      if(x<0||x>=W||y>=H) return true;
      if(y>=0&&S.board[y][x]) return true;
    }
    return false;
  }
  function spawn(k){
    S.cur=mk(k||S.next); if(!k) S.next=draw7();
    S.canHold=true; S.acc=0;
    if(hits(S.cur,0,0)){ S.cur.y--; if(hits(S.cur,0,0)) return gameOver(); }
    return true;
  }
  function rotM(m,d){ const n=m.length, o=[]; for(let i=0;i<n;i++){ o.push([]); for(let j=0;j<n;j++) o[i].push(d>0?m[n-1-j][i]:m[j][n-1-i]); } return o; }
  function rotate(d){
    if(!canAct()||S.cur.k==='O') return;
    const m=rotM(S.cur.m,d), ks=S.cur.k==='I'?KICK_I:KICK;
    for(let i=0;i<ks.length;i++){ if(!hits(S.cur,ks[i][0],ks[i][1],m)){ S.cur.m=m; S.cur.x+=ks[i][0]; S.cur.y+=ks[i][1]; draw(); return; } }
  }
  const canAct=()=>S&&S.status==='run'&&S.cur;
  function move(dx){ if(!canAct()) return; if(!hits(S.cur,dx,0)){ S.cur.x+=dx; draw(); } }
  function soft(){ if(!canAct()) return; if(!hits(S.cur,0,1)){ S.cur.y++; S.score+=1; S.acc=0; upd(); draw(); } else { lock(); } }
  function ghostY(){ let d=0; while(!hits(S.cur,0,d+1)) d++; return d; }
  function hard(){ if(!canAct()) return; const d=ghostY(); S.cur.y+=d; S.score+=2*d; lock(); }
  function hold(){
    if(!canAct()||!S.canHold) return;
    const k=S.cur.k;
    if(S.hold){ const h=S.hold; S.hold=k; if(!spawn(h)) return; } else { S.hold=k; if(!spawn()) return; }
    S.canHold=false; upd(); draw();
  }
  function lock(){
    const c=S.cur; let above=false;
    c.m.forEach((row,r)=>row.forEach((v,q)=>{ if(!v) return; const y=c.y+r, x=c.x+q; if(y<0) above=true; else S.board[y][x]=c.k; }));
    S.cur=null;
    if(above) return gameOver();
    const rows=[]; for(let y=0;y<H;y++) if(S.board[y].every(Boolean)) rows.push(y);
    if(!rows.length){ spawn(); upd(); draw(); return; }
    const n=rows.length;
    S.score+=PTS[n]*S.level;
    S.clearRows=rows; S.clearT=0; S.status='clear';
    S.msg=n===4?'Vier Hallen voll!':n===1?'Halle voll!':n+' Hallen voll!'; S.msgT=1300;
    say(S.msg);
    upd(); draw(); ensureLoop();
  }
  function finishClear(){
    const rows=S.clearRows, n=rows.length;
    S.board=S.board.filter((_,y)=>rows.indexOf(y)<0);
    while(S.board.length<H) S.board.unshift(new Array(W).fill(null));
    S.lines+=n; const lv=1+Math.floor(S.lines/10);
    if(lv>S.level){ S.level=lv; S.msg='Stufe '+lv; S.msgT=1100; say('Stufe '+lv); }
    S.clearRows=null; S.status='run';
    spawn(); upd(); draw();
  }
  function gameOver(){
    S.status='over'; S.cur=null; cancelAnimationFrame(raf); raf=0; stopRep();
    const hadBest=S.best>0, sc=S.score;
    if(sc>S.best){ const b=lget(BKEY,{}); b.tetris=sc; lset(BKEY,b); S.best=sc; S.rec=true; }
    if(S.rec&&sc>=5000&&typeof GAME!=='undefined') GAME.cheer('spiel','Tetris',fmt(sc)+' Punkte');
    say('Spiel beendet. '+fmt(sc)+' Punkte, '+S.lines+' Reihen.'+(S.rec&&hadBest?' Neuer Rekord.':''));
    upd(); draw(); overlay();
    return false;
  }

  /* ---------- Schleife ---------- */
  function ensureLoop(){ if(!raf&&el){ last=0; raf=requestAnimationFrame(frame); } }
  function frame(ts){
    raf=0;
    if(!el||!el.isConnected){ stop(); return; }
    const dt=last?Math.min(100,ts-last):0; last=ts;
    if(S.msgT>0) S.msgT-=dt;
    if(S.status==='run'){
      S.acc+=dt; const sp=speedFor(S.level);
      while(S&&S.status==='run'&&S.cur&&S.acc>=sp){ S.acc-=sp; if(!hits(S.cur,0,1)) S.cur.y++; else { lock(); break; } }
    } else if(S.status==='clear'){
      S.clearT+=dt; if(S.clearT>=(reduced()?160:440)) finishClear();
    }
    if(S.status==='run'||S.status==='clear'){ draw(); raf=requestAnimationFrame(frame); }
  }
  function begin(){
    if(S.status==='over'||S.status==='idle'&&S.cur===null&&S.score>0) fresh();
    if(S.status==='idle'){ S.status='run'; if(!S.cur) spawn(); }
    else if(S.status==='pause') S.status='run';
    overlay(); upd(); draw(); ensureLoop(); focusBoard();
  }
  function newGame(){ stopRep(); cancelAnimationFrame(raf); raf=0; fresh(); S.status='run'; spawn(); overlay(); upd(); draw(); ensureLoop(); focusBoard(); }
  function pause(force){
    if(S.status==='run'&&force!==false){ S.status='pause'; stopRep(); cancelAnimationFrame(raf); raf=0; overlay(); draw(); upd(); }
    else if(S.status==='pause'&&force!==true) begin();
  }
  function focusBoard(){ /* Fokus weg von Buttons, damit Leertaste nichts doppelt auslöst */
    const a=document.activeElement; if(a&&a!==document.body&&el&&el.contains(a)&&a.tagName==='BUTTON'&&!a.closest('.t4-pad')) a.blur();
  }

  /* ---------- Zeichnen ---------- */
  function cell(g,x,y,s,k,alpha){
    const p=PIECES[k]; g.globalAlpha=alpha||1;
    g.fillStyle=p.c; g.fillRect(x+.5,y+.5,s-1,s-1);
    g.fillStyle='rgba(255,255,255,.32)'; g.fillRect(x+.5,y+.5,s-1,Math.max(2,s*.14));
    g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x+.5,y+s-.5-Math.max(2,s*.14),s-1,Math.max(2,s*.14));
    if(s>=14){ g.fillStyle='rgba(0,0,0,.5)'; g.font='800 '+Math.round(s*.52)+'px system-ui,sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(p.l,x+s/2,y+s/2+s*.04); }
    g.globalAlpha=1;
  }
  function size(c,w,h){ const cw=Math.max(1,Math.round(w*dpr)), ch=Math.max(1,Math.round(h*dpr)); if(c.width!==cw||c.height!==ch){ c.width=cw; c.height=ch; } }
  function draw(){
    if(!el||!el.isConnected||!cv) return;
    const r=cv.getBoundingClientRect(), w=r.width-4, h=r.height-4; if(w<10) return;
    dpr=window.devicePixelRatio||1; size(cv,w,h);
    const g=ctx, s=w/W; g.setTransform(cv.width/w,0,0,cv.height/h,0,0); g.clearRect(0,0,w,h);
    g.strokeStyle='rgba(128,128,128,.16)'; g.lineWidth=1; g.beginPath();
    for(let i=1;i<W;i++){ g.moveTo(i*s,0); g.lineTo(i*s,h); }
    for(let i=1;i<H;i++){ g.moveTo(0,i*s); g.lineTo(w,i*s); }
    g.stroke();
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const k=S.board[y][x]; if(k) cell(g,x*s,y*s,s,k); }
    if(S.cur&&S.status!=='pause'){
      const c=S.cur, gy=ghostY();
      c.m.forEach((row,rr)=>row.forEach((v,q)=>{ if(!v) return;
        const yy=c.y+rr+gy; if(yy<0) return;
        g.fillStyle=PIECES[c.k].c; g.globalAlpha=.16; g.fillRect(( c.x+q)*s+.5,yy*s+.5,s-1,s-1);
        g.globalAlpha=.7; g.strokeStyle=PIECES[c.k].c; g.lineWidth=2; g.strokeRect((c.x+q)*s+2,yy*s+2,s-4,s-4); g.globalAlpha=1; }));
      c.m.forEach((row,rr)=>row.forEach((v,q)=>{ if(v&&c.y+rr>=0) cell(g,(c.x+q)*s,(c.y+rr)*s,s,c.k); }));
    }
    if(S.status==='clear'&&S.clearRows){
      const on=reduced()||Math.floor(S.clearT/70)%2===0;
      S.clearRows.forEach(y=>{ g.fillStyle=on?'rgba(255,255,255,.92)':'rgba(255,163,26,.85)'; g.fillRect(0,y*s,w,s); });
    }
    if(S.msgT>0&&S.msg&&S.status!=='over'&&S.status!=='pause'){
      const a=Math.min(1,S.msgT/400), yy=h*.38-(reduced()?0:(1300-Math.min(1300,S.msgT))*.012);
      g.globalAlpha=a; g.font='800 '+Math.round(s*.78)+'px system-ui,sans-serif'; g.textAlign='center'; g.textBaseline='middle';
      g.lineWidth=5; g.strokeStyle='rgba(0,0,0,.75)'; g.strokeText(S.msg,w/2,yy,w-8);
      g.fillStyle='#ffa31a'; g.fillText(S.msg,w/2,yy,w-8); g.globalAlpha=1;
    }
    mini(nx,S.next); mini(hd,S.hold,!S.canHold);
  }
  function mini(c,k,dim){
    if(!c) return; const r=c.getBoundingClientRect(); if(r.width<10) return;
    size(c,r.width,r.height); const g=c.getContext('2d'); g.setTransform(c.width/r.width,0,0,c.height/r.height,0,0); g.clearRect(0,0,r.width,r.height);
    if(!k) return;
    const m=PIECES[k].m; let x0=9,x1=-1,y0=9,y1=-1;
    m.forEach((row,y)=>row.forEach((v,x)=>{ if(v){ x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); } }));
    const cs=Math.min(15,Math.floor(Math.min(r.width/(x1-x0+1),r.height/(y1-y0+1)))), ox=(r.width-(x1-x0+1)*cs)/2, oy=(r.height-(y1-y0+1)*cs)/2;
    m.forEach((row,y)=>row.forEach((v,x)=>{ if(v) cell(g,ox+(x-x0)*cs,oy+(y-y0)*cs,cs,k,dim?.35:1); }));
  }
  function upd(){
    if(!el||!S) return;
    const set=(k,v)=>{ const n=el.querySelector('[data-h="'+k+'"]'); if(n&&n.textContent!==String(v)) n.textContent=v; };
    set('score',fmt(S.score)); set('best',fmt(Math.max(S.best,S.score))); set('level',S.level); set('lines',S.lines);
    const p=el.querySelector('[data-t="pause"]'); if(p){ p.textContent=S.status==='pause'?'Weiter':'Pause'; p.disabled=S.status==='idle'||S.status==='over'; }
    const h=el.querySelector('[data-t="hold"]'); if(h) h.disabled=S.status!=='run';
  }
  function overlay(){
    const ov=el&&el.querySelector('.t4-ov'); if(!ov) return;
    if(S.status==='run'||S.status==='clear'){ ov.hidden=true; return; }
    ov.hidden=false;
    if(S.status==='over') ov.innerHTML=`<h3>Halle dicht</h3><p><b>${fmt(S.score)}</b> Punkte<br>${S.lines} Reihen, Stufe ${S.level}${S.rec?'<br><b>Neuer Rekord!</b>':''}</p><button type="button" class="pz-pri" data-t="go">Neues Spiel</button>`;
    else if(S.status==='pause') ov.innerHTML='<h3>Pause</h3><p>Das Spiel wartet auf dich.</p><button type="button" class="pz-pri" data-t="go">Weiter</button>';
    else ov.innerHTML=`<h3>Gerätehaus</h3><p>Stelle die Fahrzeuge so ab, dass die Halle Reihe für Reihe voll wird. Volle Reihen verschwinden.</p>
      <div class="t4-leg" aria-label="Steine und Kürzel">${KEYS.map(k=>`<i style="background:${PIECES[k].c}">${PIECES[k].n}</i>`).join('')}</div>
      <p class="t4-keys">Pfeile, Leertaste = Drop, C = Halten, P = Pause. Tippe aufs Feld zum Drehen.</p>
      <button type="button" class="pz-pri" data-t="go">Spiel starten</button>`;
    const b=ov.querySelector('[data-t="go"]'); if(b) b.onclick=()=>{ if(S.status==='over') newGame(); else begin(); };
  }

  /* ---------- Eingabe ---------- */
  function stopRep(){ clearTimeout(rep.t1); clearInterval(rep.t2); rep.t1=rep.t2=0; }
  function bindBtn(b,fn,repeat){
    b.addEventListener('pointerdown',e=>{
      e.preventDefault(); stopRep(); fn();
      if(repeat){ rep.t1=setTimeout(()=>{ rep.t2=setInterval(fn,repeat===2?45:70); },200); }
    });
    ['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,stopRep));
    b.addEventListener('click',e=>{ if(e.detail===0) fn(); }); /* Tastatur-Aktivierung */
  }
  function build(){
    el.innerHTML=`<div class="pz-card t4">
      <div class="t4-row">
        <div class="t4-wrap"><canvas class="t4-cv" width="300" height="600" role="img" aria-label="Spielfeld Gerätehaus-Tetris, 10 Spalten mal 20 Reihen"></canvas><div class="t4-ov"></div></div>
        <div class="t4-side">
          <div class="t4-st"><span>Punkte</span><b data-h="score">0</b></div>
          <div class="t4-st"><span>Rekord</span><b data-h="best">0</b></div>
          <div class="t4-st"><span>Stufe</span><b data-h="level">1</b></div>
          <div class="t4-st"><span>Reihen</span><b data-h="lines">0</b></div>
          <div class="t4-box" role="img" aria-label="Nächster Stein"><span>Nächster</span><canvas data-c="next"></canvas></div>
          <button type="button" class="t4-box" data-t="hold" aria-label="Stein halten (Taste C)"><span>Halten</span><canvas data-c="hold"></canvas></button>
          <div class="t4-sp"></div>
          <button type="button" class="pz-sec2" data-t="pause">Pause</button>
          <button type="button" class="pz-sec2" data-t="new">Neu</button>
        </div>
      </div>
      <div class="t4-pad">
        <button type="button" data-b="l" aria-label="links">◀</button>
        <button type="button" data-b="r" aria-label="rechts">▶</button>
        <button type="button" data-b="rot" aria-label="drehen">↻<small>drehen</small></button>
        <button type="button" data-b="d" aria-label="runter">▼</button>
        <button type="button" data-b="drop" class="t4-drop" aria-label="Hard Drop">⤓<small>Drop</small></button>
      </div>
      <div class="t4-hint t4-desk">Pfeil links/rechts bewegen, hoch drehen, runter beschleunigen, Leertaste Drop, C halten, P Pause.</div>
    </div>`;
    cv=el.querySelector('.t4-cv'); ctx=cv.getContext('2d'); nx=el.querySelector('[data-c="next"]'); hd=el.querySelector('[data-c="hold"]');
    const q=s=>el.querySelector(s);
    bindBtn(q('[data-b="l"]'),()=>move(-1),1); bindBtn(q('[data-b="r"]'),()=>move(1),1);
    bindBtn(q('[data-b="d"]'),soft,2); bindBtn(q('[data-b="rot"]'),()=>rotate(1));
    bindBtn(q('[data-b="drop"]'),hard);
    q('[data-t="hold"]').onclick=hold;
    q('[data-t="pause"]').onclick=()=>{ if(S.status==='run') pause(true); else if(S.status==='pause') begin(); };
    q('[data-t="new"]').onclick=newGame;
    /* Tippen = drehen, horizontal ziehen = bewegen */
    cv.addEventListener('pointerdown',e=>{ if(!canAct()) return; ptr={id:e.pointerId,x0:e.clientX,y0:e.clientY,ax:e.clientX,moved:false}; try{ cv.setPointerCapture(e.pointerId); }catch(x){} });
    cv.addEventListener('pointermove',e=>{
      if(!ptr||e.pointerId!==ptr.id||!canAct()) return;
      const cs=(cv.getBoundingClientRect().width-4)/W;
      while(e.clientX-ptr.ax>=cs){ ptr.ax+=cs; ptr.moved=true; move(1); }
      while(ptr.ax-e.clientX>=cs){ ptr.ax-=cs; ptr.moved=true; move(-1); }
      if(Math.abs(e.clientY-ptr.y0)>cs*1.5) ptr.moved=true;
    });
    const up=e=>{ if(!ptr||e.pointerId!==ptr.id) return; const t=ptr; ptr=null; if(e.type==='pointerup'&&!t.moved&&Math.abs(e.clientX-t.x0)<12&&Math.abs(e.clientY-t.y0)<12) rotate(1); };
    cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  }
  function onKey(e){
    if(!el||!el.isConnected||!S||e.ctrlKey||e.metaKey||e.altKey) return;
    const t=e.target; if(t&&t.closest&&t.closest('input,textarea,select,[contenteditable]')) return;
    const k=e.key, lk=(k||'').toLowerCase(), live=S.status==='run'||S.status==='clear'||S.status==='pause';
    if(lk==='p'||k==='Escape'){ if(S.status==='run'||S.status==='pause'){ e.preventDefault(); pause(); } return; }
    if(k===' '){
      if(t&&t.closest&&t.closest('button')&&!t.closest('.t4-pad')&&S.status!=='run') return; /* Button-Aktivierung nicht stören */
      e.preventDefault(); if(e.repeat) return;
      if(S.status==='run') hard(); else if(S.status==='idle'||S.status==='pause') begin(); else if(S.status==='over') newGame();
      return;
    }
    if(!live) return;
    if(k==='ArrowLeft'||lk==='a'){ e.preventDefault(); move(-1); }
    else if(k==='ArrowRight'||lk==='d'){ e.preventDefault(); move(1); }
    else if(k==='ArrowDown'||lk==='s'){ e.preventDefault(); soft(); }
    else if(k==='ArrowUp'||lk==='w'||lk==='x'){ e.preventDefault(); if(!e.repeat) rotate(1); }
    else if(lk==='z'){ e.preventDefault(); if(!e.repeat) rotate(-1); }
    else if(lk==='c'||k==='Shift'){ e.preventDefault(); if(!e.repeat) hold(); }
  }
  function onKeyUp(e){ if(e.key===' '&&S&&S.status==='run'){ const t=e.target; if(t&&t.closest&&t.closest('button')) e.preventDefault(); } }

  function start(host){
    stop(); el=host; css(); dpr=window.devicePixelRatio||1;
    fresh(); build(); overlay(); upd();
    kd=onKey; ku=onKeyUp; document.addEventListener('keydown',kd); document.addEventListener('keyup',ku);
    vis=()=>{ if(document.hidden&&S) pause(true); }; document.addEventListener('visibilitychange',vis);
    rs=()=>{ if(S&&S.status!=='run'&&S.status!=='clear') draw(); }; window.addEventListener('resize',rs);
    draw(); requestAnimationFrame(()=>{ if(el) draw(); });
  }
  function stop(){
    if(S&&S.status==='run') S.status='pause';
    cancelAnimationFrame(raf); raf=0; stopRep(); ptr=null;
    if(kd){ document.removeEventListener('keydown',kd); kd=null; }
    if(ku){ document.removeEventListener('keyup',ku); ku=null; }
    if(vis){ document.removeEventListener('visibilitychange',vis); vis=null; }
    if(rs){ window.removeEventListener('resize',rs); rs=null; }
    el=null; cv=ctx=nx=hd=null;
  }
  return {start,stop,_state:()=>S};
})();
