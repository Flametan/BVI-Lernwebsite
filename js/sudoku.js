/* ======================================================================
   Sudoku (Pausenraum): drei Stufen, eindeutig lösbare Rätsel, Notizen, Tipp, Spielstand.
   Wird erst beim Öffnen des Spiels geladen (Schnittstelle: SUDOKU.start(el) / SUDOKU.stop()).
   Rekord: localStorage['bvi_pause_best'].sudoku = {leicht:sek, mittel:sek, schwer:sek} (niedriger ist besser).
   Spielstand: localStorage['bvi_sudoku_state'], Optionen: localStorage['bvi_sudoku_opts'].
   ====================================================================== */
const SUDOKU=(function(){
  'use strict';
  var LEVELS={leicht:{label:'Leicht',givens:40},mittel:{label:'Mittel',givens:32},schwer:{label:'Schwer',givens:26}};
  var LV=['leicht','mittel','schwer'];
  var BKEY='bvi_pause_best', SKEY='bvi_sudoku_state', OKEY='bvi_sudoku_opts', PENALTY=30;

  /* ---------- Engine: Löser mit Bitmasken, Lösungszähler, Generator ---------- */
  var PC=(function(){ var a=[],i; for(i=0;i<512;i++) a.push((i&1)+((i>>1)&1)+((i>>2)&1)+((i>>3)&1)+((i>>4)&1)+((i>>5)&1)+((i>>6)&1)+((i>>7)&1)+((i>>8)&1)); return a; })();
  var BOX=[], PEERS=[];
  (function(){
    var i,j;
    for(i=0;i<81;i++){ BOX.push(Math.floor(i/27)*3+Math.floor((i%9)/3)); }
    for(i=0;i<81;i++){ var p=[]; for(j=0;j<81;j++){ if(j!==i&&(Math.floor(j/9)===Math.floor(i/9)||j%9===i%9||BOX[j]===BOX[i])) p.push(j); } PEERS.push(p); }
  })();
  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  // Zählt Lösungen (Abbruch bei limit). g (81 Zahlen, 0 = leer) wird währenddessen verändert, am Ende aber wiederhergestellt.
  // rnd: zufällige Ziffernreihenfolge (Erzeugen), keep: Array, in das die erste gefundene Lösung kopiert wird.
  function countSol(g,limit,rnd,keep){
    var R=[0,0,0,0,0,0,0,0,0], C=R.slice(), B=R.slice(), n=0, i, b;
    for(i=0;i<81;i++){ if(g[i]){ b=1<<(g[i]-1); R[Math.floor(i/9)]|=b; C[i%9]|=b; B[BOX[i]]|=b; } }
    function rec(){
      var best=-1, bm=0, bc=10, i, m, c;
      for(i=0;i<81;i++){
        if(g[i]) continue;
        m=(~(R[(i/9)|0]|C[i%9]|B[BOX[i]]))&511; c=PC[m];
        if(c<bc){ bc=c; best=i; bm=m; if(c<2) break; }
      }
      if(best<0){ n++; if(keep){ for(var k=0;k<81;k++) keep[k]=g[k]; } return n>=limit; }
      if(bc===0) return false;
      var ds=[], d; for(d=0;d<9;d++) if(bm&(1<<d)) ds.push(d);
      if(rnd) shuffle(ds);
      var r=(best/9)|0, cc=best%9, bx=BOX[best], stop=false;
      for(var q=0;q<ds.length&&!stop;q++){
        d=ds[q]; b=1<<d; g[best]=d+1; R[r]|=b; C[cc]|=b; B[bx]|=b;
        stop=rec();
        g[best]=0; R[r]&=~b; C[cc]&=~b; B[bx]&=~b;
      }
      return stop;
    }
    rec(); return n;
  }
  // Generator in Häppchen: step(ms) entfernt Felder, solange Zeit ist; true, wenn fertig
  function makeGen(level){
    var sol=[], i; for(i=0;i<81;i++) sol.push(0);
    var tmp=sol.slice(); countSol(tmp,1,true,sol);
    var o=[]; for(i=0;i<81;i++) o.push(i); shuffle(o);
    var G={sol:sol, puz:sol.slice(), order:o, k:0, givens:81, target:LEVELS[level].givens};
    G.step=function(ms){
      var dl=Date.now()+ms;
      while(G.k<81&&G.givens>G.target){
        if(Date.now()>dl) return false;
        var ix=G.order[G.k++], v=G.puz[ix]; G.puz[ix]=0;
        if(countSol(G.puz,2,false)!==1) G.puz[ix]=v; else G.givens--;
      }
      return true;
    };
    return G;
  }

  /* ---------- Hilfen ---------- */
  var lget=function(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
  var lset=function(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  var ldel=function(k){ try{ localStorage.removeItem(k); }catch(e){} };
  var say=function(m){ if(typeof A11Y!=='undefined') A11Y.say(m); };
  function fmt(s){ s=Math.max(0,Math.floor(s)); var m=Math.floor(s/60); return m+':'+('0'+(s%60)).slice(-2); }
  function best(l){ var b=(lget(BKEY,{}).sudoku)||{}; return typeof b[l]==='number'?b[l]:null; }
  var I='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICO={
    pencil:'<svg width="18" height="18" '+I+'><path d="M4 20l1-4L16.500 4.500a2.100 2.100 0 0 1 3 3L8 19z"/><path d="M14.500 6.500l3 3"/></svg>',
    undo:'<svg width="18" height="18" '+I+'><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
    bulb:'<svg width="18" height="18" '+I+'><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.5 1 1.300 1 2.100h5c0-.8.4-1.600 1-2.100A6 6 0 0 0 12 3z"/></svg>',
    erase:'<svg width="22" height="22" '+I+'><path d="M20 20H8.500L3.500 15a1.500 1.500 0 0 1 0-2.100L13 3.500a1.500 1.500 0 0 1 2.100 0l5.400 5.400a1.500 1.500 0 0 1 0 2.100L12 19.500"/><path d="M9 11l5 5"/></svg>',
    flame:'<svg width="46" height="46" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sd-fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a1f"/><stop offset="1" stop-color="#ffd166"/></linearGradient></defs><path fill="url(#sd-fg)" d="M12 2c.6 3.200 3.200 4.800 4.800 7.200 1.500 2.200 1.700 4.200.9 6.200C16.600 18.200 14.500 20 12 20s-4.600-1.800-5.700-4.600c-.9-2.200-.5-4.400.9-6 .2 1.300.9 2.300 1.900 2.800C8.700 9 9.700 4.500 12 2z"/></svg>'
  };

  /* ---------- Zustand ---------- */
  var root=null, S=null, lvl='leicht', notesMode=false, showErr=false, sel=-1, cells=[], board=null, ov=null, msg=null, pad=null;
  var handlers=[], timer=null, genT=null, genId=0, msgT=null, flashT=null, flashIdx=-1, pend='', pendT=null, undo=[], running=false, t0=0, RM=false;

  function cur(){ return S?S.acc+(running?Date.now()-t0:0):0; }
  function secs(){ return S?Math.floor(cur()/1000)+S.pen:0; }
  function runT(){ if(S&&!S.over&&!running){ running=true; t0=Date.now(); } if(!timer&&S&&!S.over) timer=setInterval(tick,500); }
  function pauseT(){ if(running){ S.acc+=Date.now()-t0; running=false; } }
  function tick(){ if(!root||!root.isConnected){ stop(); return; } setH('time',fmt(secs())); }
  function setH(k,v){ var n=root&&root.querySelector('[data-h="'+k+'"]'); if(n&&n.textContent!==String(v)) n.textContent=v; }
  function note(t,keep){ if(!msg) return; msg.textContent=t||''; clearTimeout(msgT); if(t&&!keep) msgT=setTimeout(function(){ if(msg) msg.textContent=''; },4200); }

  /* ---------- Speichern / Laden ---------- */
  function save(){
    if(!S||S.over) return;
    lset(SKEY,{v:1,lvl:S.lvl,p:S.puz.join(''),s:S.sol.join(''),g:S.g.join(''),h:S.h.join(''),n:S.n,t:Math.round(cur()),pen:S.pen,hints:S.hints});
  }
  function load(){
    var o=lget(SKEY,null); if(!o||typeof o!=='object'||LV.indexOf(o.lvl)<0) return null;
    var ok=function(x,re){ return typeof x==='string'&&re.test(x); };
    if(!ok(o.p,/^[0-9]{81}$/)||!ok(o.s,/^[1-9]{81}$/)||!ok(o.g,/^[0-9]{81}$/)||!ok(o.h,/^[01]{81}$/)) return null;
    if(!Array.isArray(o.n)||o.n.length!==81) return null;
    var P=o.p.split('').map(Number), SO=o.s.split('').map(Number), G=o.g.split('').map(Number), H=o.h.split('').map(Number), N=o.n.map(function(x){ return (x|0)&511; });
    for(var i=0;i<81;i++){ if(P[i]&&P[i]!==SO[i]) return null; if(P[i]&&G[i]!==P[i]) return null; }
    if(G.every(function(v,i){ return v===SO[i]; })) return null;
    return {lvl:o.lvl,puz:P,sol:SO,g:G,h:H,n:N,acc:Math.max(0,+o.t||0),pen:Math.max(0,+o.pen||0),hints:Math.max(0,+o.hints||0),over:false};
  }
  function saveOpts(){ lset(OKEY,{lvl:lvl,err:showErr}); }

  /* ---------- Oberfläche ---------- */
  function ensureCss(){
    if(document.getElementById('sd-css')) return;
    var st=document.createElement('style'); st.id='sd-css';
    st.textContent=
     '.sd{position:relative;max-width:560px;width:100%;margin:0 auto;box-sizing:border-box;--sd-bold:color-mix(in srgb,var(--m-fg,#222) 65%,transparent);user-select:none;-webkit-user-select:none;}'
    +'.sd button{font-family:inherit;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}'
    +'.sd button:focus-visible{outline:3px solid var(--m-accent,#ffa31a);outline-offset:2px;}'
    +'.sd-hud{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}'
    +'.sd-hud div{background:var(--m-raised,#2a2a2a);border-radius:12px;padding:7px 4px;text-align:center;}'
    +'.sd-hud b{display:block;font-size:1.2rem;font-weight:800;color:var(--m-fg);font-variant-numeric:tabular-nums;line-height:1.2;}'
    +'.sd-hud span{display:block;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--m-muted);font-weight:700;}'
    +'.sd-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}'
    +'.sd-seg{display:inline-flex;background:var(--m-raised,#2a2a2a);border-radius:99px;padding:3px;}'
    +'.sd-seg button{border:0;background:none;color:var(--m-muted);padding:0 13px;min-height:40px;border-radius:99px;font-size:.88rem;cursor:pointer;}'
    +'.sd-seg button.on{background:var(--m-accent,#ffa31a);color:var(--m-on-accent,#111);font-weight:700;}'
    +'.sd-new{min-height:40px;padding:0 16px;}'
    +'.sd-wrap{container-type:inline-size;width:100%;max-width:490px;margin:0 auto;}'
    +'.sd-board{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));border:2px solid var(--sd-bold);border-radius:8px;overflow:hidden;background:var(--m-raised,#2a2a2a);touch-action:manipulation;}'
    +'.sd-c{aspect-ratio:1;position:relative;display:flex;align-items:center;justify-content:center;padding:0;margin:0;min-width:0;border:0;border-right:1px solid var(--m-line,#444);border-bottom:1px solid var(--m-line,#444);border-radius:0;background:var(--m-raised,#2a2a2a);color:var(--m-accent-fg,#ffa31a);font-size:1.3rem;font-size:6cqw;font-weight:600;line-height:1;cursor:pointer;}'
    +'.sd-c.cr{border-right:2px solid var(--sd-bold);}.sd-c.rb{border-bottom:2px solid var(--sd-bold);}.sd-c.c8{border-right:0;}.sd-c.r8{border-bottom:0;}'
    +'.sd-c.g{color:var(--m-fg);font-weight:800;}.sd-c.h{color:var(--pz-ok,#2fae6b);font-weight:800;}'
    +'.sd-c.p{background:color-mix(in srgb,var(--m-accent,#ffa31a) 10%,var(--m-raised,#2a2a2a));}'
    +'.sd-c.s2{background:color-mix(in srgb,var(--m-accent,#ffa31a) 30%,var(--m-raised,#2a2a2a));}'
    +'.sd-c.s{background:color-mix(in srgb,var(--m-accent,#ffa31a) 46%,var(--m-raised,#2a2a2a));box-shadow:inset 0 0 0 3px var(--m-accent,#ffa31a);}'
    +'.sd-c.e{color:var(--pz-bad,#e5484d);background:color-mix(in srgb,var(--pz-bad,#e5484d) 22%,var(--m-raised,#2a2a2a));}'
    +'.sd-c:focus-visible{outline:3px solid var(--m-fg,#fff);outline-offset:-4px;z-index:2;}'
    +'.sd-nt{position:absolute;inset:2px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);pointer-events:none;}'
    +'.sd-nt i{font-style:normal;display:grid;place-items:center;font-size:8px;font-size:max(8px,3.1cqw);font-weight:600;line-height:1;color:var(--m-muted,#999);}'
    +'.sd-nt i.on{color:var(--m-accent-fg,#ffa31a);font-weight:800;}'
    +'.sd-c.fl{animation:sd-pop .8s ease-out;}.sd-c.wv{animation:sd-pop .7s ease-out both;}'
    +'@keyframes sd-pop{0%{transform:scale(1);}35%{transform:scale(1.18);box-shadow:0 0 0 3px var(--m-accent,#ffa31a);z-index:3;}100%{transform:scale(1);}}'
    +'.sd-pad{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}'
    +'.sd-pb{position:relative;min-height:50px;border-radius:12px;border:0;background:var(--m-raised,#2a2a2a);color:var(--m-fg);font-size:1.4rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;}'
    +'.sd-pb:active{transform:scale(.96);}'
    +'.sd-pb small{position:absolute;top:3px;right:6px;font-size:.62rem;color:var(--m-muted);font-weight:700;}'
    +'.sd-pb.dn{opacity:.35;}'
    +'.sd-pad.nm .sd-pb{background:color-mix(in srgb,var(--m-accent,#ffa31a) 16%,var(--m-raised,#2a2a2a));font-size:1.05rem;}'
    +'.sd-pad.nm .sd-pb.er{font-size:1rem;}'
    +'.sd-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}'
    +'.sd-tb{min-height:46px;border-radius:12px;border:0;background:var(--m-raised,#2a2a2a);color:var(--m-fg);font-size:.88rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 6px;}'
    +'.sd-tb small{color:var(--m-muted);font-weight:600;font-size:.72rem;}'
    +'.sd-tb.on{background:var(--m-accent,#ffa31a);color:var(--m-on-accent,#111);}.sd-tb.on small{color:inherit;}'
    +'.sd-tb:disabled{opacity:.35;cursor:default;}'
    +'.sd-sw{display:flex;align-items:center;gap:10px;min-height:40px;background:none;border:0;color:var(--m-fg);font-size:.9rem;cursor:pointer;padding:0 2px;align-self:flex-start;}'
    +'.sd-sw i{width:40px;height:24px;border-radius:99px;background:var(--m-line,#555);position:relative;flex:none;transition:background .15s;}'
    +'.sd-sw i:after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:var(--m-fg,#fff);transition:transform .15s;}'
    +'.sd-sw[aria-checked="true"] i{background:var(--m-accent,#ffa31a);}.sd-sw[aria-checked="true"] i:after{transform:translateX(16px);background:var(--m-on-accent,#111);}'
    +'.sd-ov{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:16px;border-radius:18px;background:color-mix(in srgb,var(--m-card,#1c1c1c) 93%,transparent);}'
    +'.sd-ov[hidden]{display:none;}'
    +'.sd-dlg{text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center;max-width:340px;width:100%;}'
    +'.sd-dlg h3{margin:0;font-size:1.4rem;color:var(--m-fg);}'
    +'.sd-dlg p{margin:0;color:var(--m-muted);}'
    +'.sd-st{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;}'
    +'.sd-st div{background:var(--m-raised,#2a2a2a);border-radius:12px;padding:8px 4px;}'
    +'.sd-st b{display:block;font-size:1.15rem;color:var(--m-fg);font-variant-numeric:tabular-nums;}'
    +'.sd-st span{font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--m-muted);font-weight:700;}'
    +'.sd-act{display:flex;flex-direction:column;gap:8px;width:100%;}'
    +'.sd-act button{min-height:46px;}'
    +'.sd-spin{width:34px;height:34px;border-radius:50%;border:4px solid var(--m-line,#555);border-top-color:var(--m-accent,#ffa31a);animation:sd-rot .9s linear infinite;}'
    +'@keyframes sd-rot{to{transform:rotate(360deg);}}'
    +'@media (prefers-reduced-motion:reduce){.sd-c.fl,.sd-c.wv,.sd-spin{animation:none;}.sd-pb:active{transform:none;}.sd-sw i,.sd-sw i:after{transition:none;}}';
    document.head.appendChild(st);
  }
  function build(){
    var h='<div class="pz-card sd">'
     +'<div class="sd-hud"><div><b data-h="time">0:00</b><span>Zeit</span></div><div><b data-h="best">–</b><span>Rekord</span></div><div><b data-h="hints">0</b><span>Tipps</span></div></div>'
     +'<div class="sd-bar"><span class="sd-seg" role="group" aria-label="Schwierigkeit">'+LV.map(function(k){ return '<button type="button" data-l="'+k+'" aria-pressed="false">'+LEVELS[k].label+'</button>'; }).join('')+'</span>'
     +'<button type="button" class="pz-sec2 sd-new" data-a="new">Neues Spiel</button></div>'
     +'<div class="sd-wrap"><div class="sd-board" role="group" aria-label="Sudoku-Spielfeld">';
    for(var i=0;i<81;i++){
      var r=Math.floor(i/9), c=i%9;
      h+='<button type="button" class="sd-c'+(c%3===2&&c<8?' cr':'')+(r%3===2&&r<8?' rb':'')+(c===8?' c8':'')+(r===8?' r8':'')+'" data-i="'+i+'" tabindex="'+(i===0?0:-1)+'"></button>';
    }
    h+='</div></div>'
     +'<div class="sd-pad" role="group" aria-label="Ziffernblock">';
    for(var d=1;d<=9;d++) h+='<button type="button" class="sd-pb" data-d="'+d+'" aria-label="Ziffer '+d+'">'+d+'<small></small></button>';
    h+='<button type="button" class="sd-pb er" data-a="erase" aria-label="Feld leeren">'+ICO.erase+'</button></div>'
     +'<div class="sd-tools"><button type="button" class="sd-tb" data-a="notes" role="switch" aria-checked="false" aria-label="Notizen-Modus (Taste N)">'+ICO.pencil+'<span>Notizen</span><small>aus</small></button>'
     +'<button type="button" class="sd-tb" data-a="undo" aria-label="Rückgängig">'+ICO.undo+'<span>Zurück</span></button>'
     +'<button type="button" class="sd-tb" data-a="hint" aria-label="Tipp: ein Feld aufdecken, kostet 30 Sekunden Zeitstrafe">'+ICO.bulb+'<span>Tipp</span><small>+30 s</small></button></div>'
     +'<button type="button" class="sd-sw" data-a="err" role="switch" aria-checked="false"><i aria-hidden="true"></i><span>Fehler zeigen</span></button>'
     +'<div class="pz-fb" data-m aria-live="polite"></div>'
     +'<div class="pz-fb">Feld antippen, dann Ziffer wählen. Tastatur: 1 bis 9, Pfeiltasten, Entf, N für Notizen.</div>'
     +'<div class="sd-ov" hidden></div></div>';
    root.innerHTML=h;
    board=root.querySelector('.sd-board'); ov=root.querySelector('.sd-ov'); msg=root.querySelector('[data-m]'); pad=root.querySelector('.sd-pad');
    cells=Array.prototype.slice.call(board.querySelectorAll('.sd-c'));
  }

  /* ---------- Zeichnen ---------- */
  function label(i){
    var pos='Zeile '+(Math.floor(i/9)+1)+', Spalte '+(i%9+1)+', ', v=S.g[i];
    if(S.puz[i]) return pos+'vorgegeben '+v;
    if(S.h[i]) return pos+'Tipp '+v;
    if(v) return pos+'Ziffer '+v;
    var ns=[]; for(var d=1;d<=9;d++) if(S.n[i]&(1<<(d-1))) ns.push(d);
    return pos+(ns.length?'leer, Notizen '+ns.join(' '):'leer');
  }
  function paintCell(i,wave){
    var el=cells[i], v=S.g[i], cls='sd-c'+(i%9%3===2&&i%9<8?' cr':'')+((Math.floor(i/9))%3===2&&Math.floor(i/9)<8?' rb':'')+(i%9===8?' c8':'')+(Math.floor(i/9)===8?' r8':'');
    var fixed=S.puz[i]||S.h[i], inner='', sv=sel>=0?S.g[sel]:0;
    if(S.puz[i]) cls+=' g'; else if(S.h[i]) cls+=' h';
    if(sel>=0){
      if(i===sel) cls+=' s';
      else if(v&&v===sv) cls+=' s2';
      else if(PEERS[sel].indexOf(i)>=0) cls+=' p';
    }
    if(showErr&&v&&!fixed&&v!==S.sol[i]) cls+=' e';
    if(flashIdx===i) cls+=' fl';
    if(wave!==undefined) cls+=' wv';
    if(v) inner=String(v);
    else if(S.n[i]){ inner='<span class="sd-nt" aria-hidden="true">'; for(var d=1;d<=9;d++) inner+='<i'+(sv===d?' class="on"':'')+'>'+(S.n[i]&(1<<(d-1))?d:'')+'</i>'; inner+='</span>'; }
    if(el.className!==cls) el.className=cls;
    if(el._h!==inner){ el.innerHTML=inner; el._h=inner; }
    el.style.animationDelay=wave!==undefined?wave+'ms':'';
    var lb=label(i); if(el._l!==lb){ el.setAttribute('aria-label',lb); el._l=lb; }
    el.tabIndex=(sel<0?i===0:i===sel)?0:-1;
  }
  function paint(){
    if(!S) return;
    for(var i=0;i<81;i++) paintCell(i);
    var cnt=[0,0,0,0,0,0,0,0,0,0], i2; for(i2=0;i2<81;i2++) if(S.g[i2]&&S.g[i2]===S.sol[i2]) cnt[S.g[i2]]++;
    pad.querySelectorAll('[data-d]').forEach(function(b){ var d=+b.dataset.d, left=9-cnt[d]; b.classList.toggle('dn',left<=0); b.querySelector('small').textContent=left>0?left:''; });
    var empty=0; for(i2=0;i2<81;i2++) if(S.g[i2]!==S.sol[i2]) empty++;
    setH('hints',S.hints); setH('time',fmt(secs()));
    var ub=root.querySelector('[data-a="undo"]'); if(ub) ub.disabled=!undo.length||S.over;
  }
  function paintUi(){
    root.querySelectorAll('[data-l]').forEach(function(b){ var on=b.dataset.l===lvl; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); });
    var nb=root.querySelector('[data-a="notes"]'); nb.classList.toggle('on',notesMode); nb.setAttribute('aria-checked',notesMode); nb.querySelector('small').textContent=notesMode?'an':'aus';
    pad.classList.toggle('nm',notesMode);
    root.querySelector('[data-a="err"]').setAttribute('aria-checked',showErr);
    var b=best(lvl); setH('best',b==null?'–':fmt(b));
  }

  /* ---------- Spielzüge ---------- */
  function snapshot(){ undo.push({g:S.g.slice(),n:S.n.slice()}); if(undo.length>300) undo.shift(); }
  function clearNotes(i,d){ var bit=1<<(d-1); PEERS[i].forEach(function(j){ S.n[j]&=~bit; }); }
  function editable(){ if(!S||S.over) return false; if(sel<0){ note('Wähle zuerst ein Feld.'); return false; } if(S.puz[sel]||S.h[sel]){ note('Dieses Feld ist vorgegeben.'); return false; } return true; }
  function afterMove(){ paint(); save(); checkWin(); }
  function input(d){
    if(!editable()) return;
    if(notesMode){
      if(S.g[sel]) { note('In ein gefülltes Feld gehen keine Notizen.'); return; }
      snapshot(); S.n[sel]^=1<<(d-1); afterMove(); return;
    }
    snapshot();
    if(S.g[sel]===d) S.g[sel]=0; else { S.g[sel]=d; S.n[sel]=0; clearNotes(sel,d); }
    afterMove();
  }
  function erase(){
    if(!editable()) return;
    if(!S.g[sel]&&!S.n[sel]) return;
    snapshot(); S.g[sel]=0; S.n[sel]=0; afterMove();
  }
  function doUndo(){
    if(!S||S.over||!undo.length) return;
    var u=undo.pop(); S.g=u.g; S.n=u.n; paint(); save();
  }
  function hint(){
    if(!S||S.over) return;
    var i=-1;
    if(sel>=0&&!S.puz[sel]&&!S.h[sel]&&S.g[sel]!==S.sol[sel]) i=sel;
    else { var c=[]; for(var k=0;k<81;k++) if(!S.puz[k]&&!S.h[k]&&S.g[k]!==S.sol[k]) c.push(k); if(c.length) i=c[Math.floor(Math.random()*c.length)]; }
    if(i<0){ note('Es gibt nichts mehr aufzudecken.'); return; }
    var d=S.sol[i]; S.g[i]=d; S.h[i]=1; S.n[i]=0; clearNotes(i,d); S.pen+=PENALTY; S.hints++; undo=[]; sel=i;
    flashIdx=i; clearTimeout(flashT); flashT=setTimeout(function(){ flashIdx=-1; if(S&&cells[i]) paintCell(i); },900);
    note('Tipp: Zeile '+(Math.floor(i/9)+1)+', Spalte '+(i%9+1)+' ist '+d+'. +'+PENALTY+' s Zeitstrafe.'); say('Tipp: '+d+'. Plus '+PENALTY+' Sekunden.');
    afterMove();
  }
  function move(dr,dc){
    if(!S) return; if(sel<0){ sel=40; } else { var r=Math.max(0,Math.min(8,Math.floor(sel/9)+dr)), c=Math.max(0,Math.min(8,sel%9+dc)); sel=r*9+c; }
    paint(); try{ cells[sel].focus({preventScroll:true}); }catch(e){}
  }

  /* ---------- Sieg ---------- */
  function checkWin(){
    for(var i=0;i<81;i++) if(S.g[i]!==S.sol[i]) return;
    pauseT(); clearInterval(timer); timer=null; S.over=true; ldel(SKEY);
    var t=secs(), b=lget(BKEY,{}), old=best(lvl), hadOld=old!=null, isNew=false;
    if(old==null||t<old){ var m=Object.assign({},b.sudoku||{}); m[lvl]=t; b.sudoku=m; lset(BKEY,b); old=t; isNew=true; setH('best',fmt(t)); }
    if(typeof GAME!=='undefined') GAME.cheer('spiel','Sudoku',isNew&&hadOld?LEVELS[lvl].label+' '+fmt(t):'');
    setH('time',fmt(t)); sel=-1; paint();
    if(!RM) cells.forEach(function(el,i){ var d=((Math.floor(i/9)+i%9)*40); el.classList.add('wv'); el.style.animationDelay=d+'ms'; });
    clearTimeout(genT);
    genT=setTimeout(function(){
      if(!ov||!S) return;
      ov.hidden=false;
      ov.innerHTML='<div class="sd-dlg" role="dialog" aria-modal="true" aria-label="Sudoku gelöst"><div>'+ICO.flame+'</div><h3>Gelöst!</h3>'
        +'<div class="sd-st"><div><b>'+fmt(t)+'</b><span>Zeit</span></div><div><b>'+fmt(old)+'</b><span>Rekord</span></div><div><b>'+S.hints+'</b><span>Tipps</span></div></div>'
        +'<p>'+LEVELS[lvl].label+(S.pen?', inklusive '+S.pen+' s Zeitstrafe':'')+'</p>'+(isNew?'<p><b style="color:var(--m-accent-fg)">'+(hadOld?'Neue Bestzeit!':'Erste Bestzeit!')+'</b></p>':'')
        +'<div class="sd-act"><button type="button" class="pz-pri" data-a="new">Neues Spiel</button><button type="button" class="pz-sec2" data-a="close">Spielfeld ansehen</button></div></div>';
      say('Sudoku gelöst. Zeit '+fmt(t)+(isNew?'. Neue Bestzeit.':''));
      var pb=ov.querySelector('.pz-pri'); if(pb) pb.focus({preventScroll:true});
    },RM?100:900);
  }

  /* ---------- Neues Spiel ---------- */
  function progress(){ if(!S||S.over) return false; for(var i=0;i<81;i++) if(!S.puz[i]&&(S.g[i]||S.n[i])) return true; return false; }
  function confirmed(key){
    if(!progress()) return true;
    if(pend===key){ clearTimeout(pendT); pend=''; return true; }
    pend=key; clearTimeout(pendT); pendT=setTimeout(function(){ pend=''; note(''); },3500);
    note('Aktuelles Spiel verwerfen? Tippe nochmal zur Bestätigung.',true); return false;
  }
  function newGame(l){
    if(l) lvl=l; clearTimeout(genT); clearInterval(timer); timer=null; running=false; genId++; var id=genId;
    S=null; undo=[]; sel=-1; notesMode=false; flashIdx=-1; pend=''; note('');
    ldel(SKEY); saveOpts(); paintUi();
    ov.hidden=true; ov.innerHTML='';
    var G=makeGen(lvl);
    function done(){
      S={lvl:lvl,puz:G.puz.slice(),sol:G.sol.slice(),g:G.puz.slice(),h:G.sol.map(function(){ return 0; }),n:G.sol.map(function(){ return 0; }),acc:0,pen:0,hints:0,over:false};
      ov.hidden=true; ov.innerHTML=''; paintUi(); paint(); save(); runT();
      say('Neues Sudoku, Stufe '+LEVELS[lvl].label+'.');
    }
    function chunk(){
      if(id!==genId||!root) return;
      if(G.step(40)){ done(); return; }
      genT=setTimeout(chunk,0);
    }
    if(G.step(150)){ done(); return; }
    ov.hidden=false; ov.innerHTML='<div class="sd-dlg" role="status"><div class="sd-spin" aria-hidden="true"></div><p>Rätsel wird erstellt …</p></div>';
    genT=setTimeout(chunk,0);
  }
  function resume(L){
    S=L; lvl=L.lvl; undo=[]; sel=-1; notesMode=false; paintUi(); paint(); runT();
    note('Spielstand fortgesetzt.'); say('Spielstand fortgesetzt.');
  }

  /* ---------- Ereignisse ---------- */
  function onRoot(e){
    var c=e.target.closest&&e.target.closest('.sd-c');
    if(c&&board.contains(c)){ if(!S||S.over) return; sel=+c.dataset.i; paint(); return; }
    var l=e.target.closest('[data-l]');
    if(l){ if(l.dataset.l===lvl&&S&&!S.over) return; if(!confirmed('l'+l.dataset.l)) return; newGame(l.dataset.l); return; }
    var d=e.target.closest('[data-d]'); if(d){ input(+d.dataset.d); return; }
    var b=e.target.closest('[data-a]'); if(!b) return; var a=b.dataset.a;
    if(a==='new'){ if(!confirmed('new')) return; newGame(); }
    else if(a==='close'){ ov.hidden=true; }
    else if(a==='erase') erase();
    else if(a==='undo') doUndo();
    else if(a==='hint') hint();
    else if(a==='notes'){ notesMode=!notesMode; paintUi(); if(S) paint(); }
    else if(a==='err'){ showErr=!showErr; saveOpts(); paintUi(); if(S) paint(); }
  }
  function onKey(e){
    if(!root||!root.isConnected||e.ctrlKey||e.metaKey||e.altKey) return;
    var t=e.target, tag=t&&t.tagName; if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable)) return;
    if(!(t===document.body||root.contains(t))) return;
    if(!ov.hidden||!S||S.over) return;
    var k=e.key;
    if(k>='1'&&k<='9'&&k.length===1){ e.preventDefault(); input(+k); }
    else if(k==='0'||k==='Backspace'||k==='Delete'){ e.preventDefault(); erase(); }
    else if(k==='n'||k==='N'){ e.preventDefault(); notesMode=!notesMode; paintUi(); paint(); }
    else if(k==='u'||k==='U'){ e.preventDefault(); doUndo(); }
    else if(k==='ArrowUp'){ e.preventDefault(); move(-1,0); }
    else if(k==='ArrowDown'){ e.preventDefault(); move(1,0); }
    else if(k==='ArrowLeft'){ e.preventDefault(); move(0,-1); }
    else if(k==='ArrowRight'){ e.preventDefault(); move(0,1); }
  }
  function onVis(){ if(!S||S.over||!root) return; if(document.hidden){ pauseT(); save(); } else if(ov.hidden||!ov.querySelector('.sd-spin')) runT(); }
  function onHide(){ if(S&&!S.over){ save(); } }
  function on(t,ev,fn,o){ t.addEventListener(ev,fn,o); handlers.push([t,ev,fn,o]); }

  function start(host){
    stop(); ensureCss(); root=host; RM=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var o=lget(OKEY,{}); lvl=LV.indexOf(o.lvl)>=0?o.lvl:'leicht'; showErr=!!o.err; notesMode=false;
    build(); on(root,'click',onRoot); on(document,'keydown',onKey); on(document,'visibilitychange',onVis); on(window,'pagehide',onHide);
    var L=load(); if(L) resume(L); else newGame();
  }
  function stop(){
    if(S&&!S.over){ pauseT(); save(); }
    clearInterval(timer); clearTimeout(genT); clearTimeout(msgT); clearTimeout(flashT); clearTimeout(pendT); timer=null; genT=null; running=false; genId++;
    handlers.forEach(function(h){ h[0].removeEventListener(h[1],h[2],h[3]); }); handlers=[];
    root=null; S=null; board=null; ov=null; msg=null; pad=null; cells=[]; undo=[]; sel=-1; flashIdx=-1; pend='';
  }
  return {start:start,stop:stop,_gen:{countSol:countSol,makeGen:makeGen}};
})();
