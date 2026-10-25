/* ======================================================================
   Minesweeper im Feuerwehrthema (Pausenraum): Brandherde finden, ohne einen zu öffnen.
   Wird erst beim Öffnen des Spiels geladen (siehe MSGAME in pause.js).
   ====================================================================== */
const MINESWEEPER=(function(){
  'use strict';
  /* Minesweeper-Engine (Feuerwehr: Brandherde = Minen). Zustand wird direkt verändert, jede Aktion gibt true zurück, wenn sich etwas geändert hat.
     Zelle: {m:bool Brandherd, n:0-8 Zahl benachbarter Brandherde, s:0 verdeckt | 1 offen | 2 markiert}
     Zustand: {rows,cols,mines,cells,started,over,won,hit (Index des getroffenen Brandherds),flags,opened,t0,t1} */
  var MS=(function(){
    var LEVELS={leicht:{rows:9,cols:9,mines:12,label:'Leicht'},mittel:{rows:12,cols:12,mines:30,label:'Mittel'},schwer:{rows:16,cols:16,mines:56,label:'Schwer'},sehr:{rows:16,cols:16,mines:72,label:'Sehr schwer'}};
    function create(level){
      var L=typeof level==='string'?LEVELS[level]:level, cells=[], i;
      for(i=0;i<L.rows*L.cols;i++) cells.push({m:false,n:0,s:0});
      return {rows:L.rows,cols:L.cols,mines:L.mines,cells:cells,started:false,over:false,won:false,hit:-1,flags:0,opened:0,t0:0,t1:0};
    }
    function nb(S,i){ var r=Math.floor(i/S.cols), c=i%S.cols, o=[], dr, dc, rr, cc; for(dr=-1;dr<=1;dr++) for(dc=-1;dc<=1;dc++){ if(!dr&&!dc) continue; rr=r+dr; cc=c+dc; if(rr>=0&&rr<S.rows&&cc>=0&&cc<S.cols) o.push(rr*S.cols+cc); } return o; }
    // Brandherde erst beim ersten Öffnen legen: das Feld und seine Nachbarn bleiben frei, der erste Zug ist nie ein Treffer
    function plant(S,safe){
      var ban={}, k, i, n=S.rows*S.cols, free=[]; ban[safe]=1; nb(S,safe).forEach(function(j){ ban[j]=1; });
      for(i=0;i<n;i++) if(!ban[i]) free.push(i);
      if(free.length<S.mines){ free=[]; for(i=0;i<n;i++) if(i!==safe) free.push(i); }
      for(k=0;k<S.mines;k++){ var j=k+Math.floor(Math.random()*(free.length-k)), t=free[k]; free[k]=free[j]; free[j]=t; S.cells[free[k]].m=true; }
      S.cells.forEach(function(c,ix){ c.n=nb(S,ix).filter(function(j){ return S.cells[j].m; }).length; });
      S.started=true; S.t0=Date.now();
    }
    function lose(S,i){ S.over=true; S.won=false; S.hit=i; S.t1=Date.now(); S.cells.forEach(function(c){ if(c.m&&c.s===0) c.s=1; }); }
    function checkWin(S){ if(S.opened===S.rows*S.cols-S.mines){ S.over=true; S.won=true; S.t1=Date.now(); S.cells.forEach(function(c){ if(c.m&&c.s!==2){ c.s=2; S.flags++; } }); } }
    // Öffnet ein Feld; Felder ohne benachbarten Brandherd öffnen ihre Nachbarn mit (Flächenöffnung)
    function open(S,i){
      var c=S.cells[i]; if(S.over||c.s!==0) return false;
      if(!S.started) plant(S,i);
      if(c.m){ c.s=1; lose(S,i); return true; }
      var st=[i];
      while(st.length){ var j=st.pop(), x=S.cells[j]; if(x.s!==0) continue; x.s=1; S.opened++; if(x.n===0) nb(S,j).forEach(function(k){ if(S.cells[k].s===0) st.push(k); }); }
      checkWin(S); return true;
    }
    function flag(S,i){ var c=S.cells[i]; if(S.over||c.s===1) return false; if(c.s===0){ c.s=2; S.flags++; } else { c.s=0; S.flags--; } return true; }
    // Doppeltipp auf eine Zahl: stimmen die Markierungen ringsum mit der Zahl überein, werden die übrigen Nachbarn geöffnet
    function chord(S,i){
      var c=S.cells[i]; if(S.over||c.s!==1||c.n===0) return false;
      var ns=nb(S,i), fl=ns.filter(function(j){ return S.cells[j].s===2; }).length; if(fl!==c.n) return false;
      var ch=false; ns.forEach(function(j){ if(S.cells[j].s===0&&!S.over) ch=open(S,j)||ch; }); return ch;
    }
    // Tipp: ein sicheres verdecktes Feld (aus Zahlen abgeleitet, sonst irgendein sicheres) oder null
    function hint(S){
      if(S.over) return null;
      var i, ns, hid, fl;
      for(i=0;i<S.cells.length;i++){ var c=S.cells[i]; if(c.s!==1||c.n===0) continue; ns=nb(S,i); fl=ns.filter(function(j){ return S.cells[j].s===2; }).length; hid=ns.filter(function(j){ return S.cells[j].s===0; });
        if(fl===c.n&&hid.length) return hid[0]; }
      if(!S.started) return Math.floor(S.cells.length/2);
      var safe=[]; S.cells.forEach(function(c,ix){ if(c.s===0&&!c.m) safe.push(ix); }); return safe.length?safe[Math.floor(Math.random()*safe.length)]:null;
    }
    function secs(S){ return S.started?Math.min(999,Math.floor(((S.over?S.t1:Date.now())-S.t0)/1000)):0; }
    return {LEVELS:LEVELS,create:create,nb:nb,open:open,flag:flag,chord:chord,hint:hint,secs:secs,left:function(S){ return S.mines-S.flags; }};
  })();

  var create=MS.create, open=MS.open, flag=MS.flag, chord=MS.chord, secs=MS.secs, left=MS.left, LEVELS=MS.LEVELS, hintOf=MS.hint;
  var BKEY='bvi_pause_best', OKEY='bvi_minesweeper_opts', LV=['leicht','mittel','schwer','sehr'];
  var lget=function(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
  var lset=function(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  var say=function(m){ if(typeof A11Y!=='undefined') A11Y.say(m); };
  var RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches);
  var I='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICO={
    flame:'<svg class="mi-ic" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="mi-fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a1f"/><stop offset="1" stop-color="#ffd166"/></linearGradient></defs><path fill="url(#mi-fg)" d="M12 2s5.4 4.6 5.4 10.2A5.4 5.4 0 0 1 6.6 12.2c0-2.3 1.1-4 2.2-5.3.1 2.1 1 3.1 2.1 3.1C10.9 6.9 12 4.7 12 2z"/></svg>',
    flag:'<svg class="mi-ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="#ff9f0a" d="M6 3.500h12l-3 4.5 3 4.500H6z"/><path d="M6 3v18" stroke="#cfe0ff" stroke-width="2.2" stroke-linecap="round"/></svg>',
    cross:'<svg class="mi-ic mi-x" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" stroke="#ff4d6d" stroke-width="3" stroke-linecap="round"/></svg>',
    flagb:'<svg width="18" height="18" '+I+'><path d="M5 21V4M5 4h13l-3 4.5 3 4.500H5"/></svg>',
    bulb:'<svg width="18" height="18" '+I+'><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.900c.6.5 1 1.3 1 2.100h5c0-.8.4-1.6 1-2.100A6 6 0 0 0 12 3z"/></svg>'
  };
  var root=null, S=null, lvl='leicht', flagMode=false, cellEls=[], board=null, wrap=null, ov=null, msg=null, handlers=[], timer=null, hintT=null, hintIdx=-1, tmo=null;
  var press={t:0,long:false,i:-1}, lastTap={i:-1,t:0}, snap=[], overT=null;
  function fmt(s){ var m=Math.floor(s/60); return m+':'+('0'+(s%60)).slice(-2); }
  function best(l){ var b=(lget(BKEY,{}).minesweeper)||{}; return b[l]; }
  function setH(k,v){ var n=root&&root.querySelector('[data-h="'+k+'"]'); if(n&&n.textContent!==String(v)) n.textContent=v; }
  function saySm(t){ if(msg) msg.textContent=t||''; }
  function build(){
    root.innerHTML='<div class="pz-card so mi">'
     +'<div class="so-hud"><div><b data-h="left">0</b><span>Brandherde</span></div><div><b data-h="time">0:00</b><span>Zeit</span></div><div><b data-h="best">–</b><span>Rekord</span></div></div>'
     +'<div class="so-bar"><div class="so-tools"><button type="button" class="so-ib" data-a="hint" aria-label="Tipp: ein sicheres Feld zeigen" title="Tipp">'+ICO.bulb+'</button>'
     +'<button type="button" class="mi-fm" data-a="flag" role="switch" aria-checked="false" title="Markieren statt Absuchen">'+ICO.flagb+'<span>Markieren</span></button></div>'
     +'<div class="so-tools"><span class="so-seg mi-seg" role="group" aria-label="Schwierigkeit">'+LV.map(function(k){ return '<button type="button" data-l="'+k+'">'+LEVELS[k].label+'</button>'; }).join('')+'</span><button type="button" class="so-new" data-a="new">Neues Spiel</button></div></div>'
     +'<div class="mi-wrap"><div class="mi-board" role="group" aria-label="Spielfeld"></div></div>'
     +'<div class="so-ov" hidden></div>'
     +'<div class="pz-fb so-msg" aria-live="polite"></div>'
     +'<div class="pz-fb">Antippen = absuchen · lang drücken, Rechtsklick oder „Markieren“ = Markierung · Doppeltipp auf eine Zahl = Nachbarfelder</div></div>';
    wrap=root.querySelector('.mi-wrap'); board=root.querySelector('.mi-board'); ov=root.querySelector('.so-ov'); msg=root.querySelector('.so-msg');
    board.insertAdjacentHTML('beforeend','<div class="mi-heat" aria-hidden="true"></div>');
  }
  function newGame(l){
    if(l) lvl=l; clearInterval(timer); clearTimeout(hintT); clearTimeout(overT); timer=null; hintIdx=-1;
    S=create(lvl); ov.hidden=true; ov.innerHTML=''; saySm('');
    var L=LEVELS[lvl]; board.style.setProperty('--cols',L.cols); board.querySelectorAll('.mi-c').forEach(function(n){ n.remove(); });
    var h=''; for(var i=0;i<S.cells.length;i++) h+='<button type="button" class="mi-c v" data-i="'+i+'" aria-label="Zeile '+(Math.floor(i/L.cols)+1)+', Spalte '+(i%L.cols+1)+', verdeckt"></button>';
    board.insertAdjacentHTML('afterbegin',h); cellEls=Array.prototype.slice.call(board.querySelectorAll('.mi-c')); snap=S.cells.map(function(c){ return c.s; });
    root.querySelectorAll('[data-l]').forEach(function(b){ var on=b.dataset.l===lvl; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); });
    var bt=best(lvl); setH('best',bt==null?'–':fmt(bt)); setH('left',S.mines); setH('time','0:00'); size();
  }
  // Zellgröße: füllt die Breite, mindestens 26 px (Schwer und Sehr schwer scrollen am Handy seitlich), höchstens 38 px
  function size(){
    if(!board||!wrap) return; var L=LEVELS[lvl], w=wrap.clientWidth-12, gap=L.cols>12?2:3;
    var cw=Math.max(26,Math.min(38,Math.floor((w-gap*(L.cols-1))/L.cols)));
    board.style.setProperty('--cw',cw+'px'); board.style.setProperty('--gap',gap+'px'); board.style.setProperty('--fs',Math.round(cw*.55)+'px');
  }
  function paint(i,wave){
    var c=S.cells[i], el=cellEls[i], lost=S.over&&!S.won, cls='mi-c', inner='', lab, L=LEVELS[lvl];
    var pos='Zeile '+(Math.floor(i/L.cols)+1)+', Spalte '+(i%L.cols+1);
    if(c.s===0){ cls+=' v'+(hintIdx===i?' hint':''); lab=pos+', verdeckt'; }
    else if(c.s===2){
      if(lost&&!c.m){ cls+=' wrong'; inner=ICO.flag+ICO.cross; lab=pos+', falsche Markierung'; }
      else { cls+=' f'; inner=ICO.flag; lab=pos+', markiert'; }
    } else {
      cls+=' o';
      if(c.m){ cls+=' m'+(S.hit===i?' hit':''); inner=ICO.flame; lab=pos+', Brandherd'; }
      else if(c.n){ cls+=' n'+c.n; inner=String(c.n); lab=pos+', abgesucht, '+c.n+' benachbarte Brandherde'; }
      else lab=pos+', abgesucht, keine Brandherde in der Nähe';
    }
    if(wave!==undefined&&!RM){ cls+=' wv'+(c.m?' bm':''); el.style.animationDelay=Math.round(S.hit===i?0:(c.m?250+wave*55:wave*48))+'ms'; } else el.style.animationDelay='';
    if(el.className!==cls){ el.className=cls; }
    if(el._h!==inner){ el.innerHTML=inner; el._h=inner; }
    el.setAttribute('aria-label',lab);
  }
  function dist(a,b){ var C=S.cols, dr=Math.floor(a/C)-Math.floor(b/C), dc=a%C-b%C; return Math.sqrt(dr*dr+dc*dc); }
  function after(i){
    var wave={}, any=false; S.cells.forEach(function(c,j){ if(snap[j]===0&&c.s===1){ wave[j]=dist(i,j); any=true; } });
    S.cells.forEach(function(c,j){ if(c.s!==snap[j]||wave[j]!==undefined||hintIdx>=0||(S.over&&c.s!==0)) paint(j,wave[j]); });
    snap=S.cells.map(function(c){ return c.s; }); setH('left',left(S));
    if(S.started&&!timer) timer=setInterval(tick,500);
    if(S.over){ clearInterval(timer); timer=null; if(S.hit>=0&&!RM){ board.classList.remove('quake'); void board.offsetWidth; board.classList.add('quake'); } overT=setTimeout(finish,S.won?450:S.hit>=0?800:0); }
  }
  function tick(){ if(!root||!root.isConnected){ stop(); return; } setH('time',fmt(secs(S))); }
  function act(type,i){
    if(!S||S.over) return false; hintIdx=-1; saySm('');
    var ch=type==='open'?open(S,i):type==='flag'?flag(S,i):chord(S,i); if(!ch) return false;
    after(i); if(type==='flag') say(S.cells[i].s===2?'Markiert':'Markierung entfernt'); return true;
  }
  function finish(){
    if(!ov||!S) return; var t=secs(S), b=lget(BKEY,{}), old=best(lvl), isNew=false;
    if(S.won&&t>=0&&(old==null||t<old)){ var m=Object.assign({},b.minesweeper||{}); m[lvl]=t; b.minesweeper=m; lset(BKEY,b); old=t; isNew=true; setH('best',fmt(t)); }
    var ok=S.won, L=LEVELS[lvl];
    ov.hidden=false; ov.innerHTML='<div class="so-win" role="dialog" aria-modal="true" aria-label="'+(ok?'Alle Brandherde gesichert':'Brand außer Kontrolle')+'"><div class="so-wi">'+(ok?ICO.flag:ICO.flame).replace('mi-ic','mi-ic mi-big')+'</div><h3>'+(ok?'Alle Brandherde gesichert':'Brand außer Kontrolle')+'</h3><p>'+(ok?'Das Gebiet ist abgesucht.':'Ein Brandherd wurde übersehen.')+'</p>'
      +'<div class="so-stats"><div><b>'+fmt(t)+'</b><span>Zeit</span></div><div><b>'+(old==null?'–':fmt(old))+'</b><span>Rekord</span></div><div><b>'+L.mines+'</b><span>Brandherde</span></div></div>'+(isNew?'<p><b>Neuer Rekord!</b></p>':'')
      +'<div class="so-act"><button type="button" class="pz-pri" data-a="new">Neues Spiel</button><button type="button" class="pz-sec2" data-a="close">Spielfeld ansehen</button></div></div>';
    say((ok?'Alle Brandherde gesichert. ':'Brand außer Kontrolle. ')+fmt(t)); var pb=ov.querySelector('.pz-pri'); if(pb) pb.focus({preventScroll:true});
  }
  function hint(){
    var btn=root.querySelector('[data-a="hint"]'), i=S&&!S.over?MS_hint():null;
    if(i==null){ btn.classList.remove('so-shake'); void btn.offsetWidth; btn.classList.add('so-shake'); saySm('Kein sicheres Feld mehr zu zeigen.'); return; }
    hintIdx=i; saySm('Tipp: Das markierte Feld ist sicher.'); paint(i); clearTimeout(hintT); hintT=setTimeout(function(){ var j=hintIdx; hintIdx=-1; if(S&&j>=0&&cellEls[j]) paint(j); },2600);
  }
  var MS_hint=function(){ return hintOf(S); };
  function idxOf(e){ var el=e.target.closest&&e.target.closest('.mi-c'); return el&&board.contains(el)?+el.dataset.i:-1; }
  function onDown(e){
    var i=idxOf(e); moveHeat(e); if(i<0||(e.button&&e.button!==0)) return;
    press.long=false; press.i=i; clearTimeout(press.t);
    press.t=setTimeout(function(){ press.long=true; if(S&&!S.over&&S.cells[i].s!==1){ act('flag',i); if(navigator.vibrate){ try{ navigator.vibrate(18); }catch(x){} } } },380);
  }
  function endPress(){ clearTimeout(press.t); }
  function onClick(e){
    var i=idxOf(e); if(i<0) return; if(press.long){ press.long=false; return; }
    if(!S||S.over) return; var c=S.cells[i], now=Date.now();
    if(c.s===1){
      if(lastTap.i===i&&now-lastTap.t<380){ lastTap.t=0; act('chord',i); } else lastTap={i:i,t:now};
      return;
    }
    lastTap={i:-1,t:0}; act(flagMode?'flag':'open',i);
  }
  function onCtx(e){ var i=idxOf(e); if(i<0) return; e.preventDefault(); if(press.long){ press.long=false; return; } act('flag',i); }
  function onKey(e){ if((e.key==='f'||e.key==='F'||e.key==='m'||e.key==='M')&&e.target.classList&&e.target.classList.contains('mi-c')){ e.preventDefault(); act('flag',+e.target.dataset.i); } }
  function moveHeat(e){
    if(!board) return; var r=board.getBoundingClientRect(); board.style.setProperty('--mx',(e.clientX-r.left)+'px'); board.style.setProperty('--my',(e.clientY-r.top)+'px'); board.style.setProperty('--ho','1');
  }
  function fadeHeat(){ if(board) board.style.setProperty('--ho','0'); }
  function onRoot(e){
    var l=e.target.closest('[data-l]'); if(l){ newGame(l.dataset.l); lset(OKEY,{level:lvl}); return; }
    var b=e.target.closest('[data-a]'); if(!b) return; var a=b.dataset.a;
    if(a==='new') newGame();
    else if(a==='close'){ ov.hidden=true; }
    else if(a==='hint') hint();
    else if(a==='flag'){ flagMode=!flagMode; b.setAttribute('aria-checked',flagMode); b.classList.toggle('on',flagMode); }
  }
  function on(t,ev,fn,o){ t.addEventListener(ev,fn,o); handlers.push([t,ev,fn,o]); }
  function start(host){
    stop(); root=host; flagMode=false; var o=lget(OKEY,{}); lvl=LV.indexOf(o.level)>=0?o.level:'leicht'; build(); newGame();
    on(board,'pointerdown',onDown); on(board,'pointermove',moveHeat); on(board,'pointerleave',fadeHeat); on(board,'pointerup',function(e){ endPress(); setTimeout(fadeHeat,650); }); on(board,'pointercancel',endPress);
    on(board,'click',onClick); on(board,'contextmenu',onCtx); on(board,'keydown',onKey); on(root,'click',onRoot); on(window,'resize',size);
  }
  function stop(){
    clearInterval(timer); clearTimeout(hintT); clearTimeout(press.t); clearTimeout(overT); timer=null;
    handlers.forEach(function(h){ h[0].removeEventListener(h[1],h[2],h[3]); }); handlers=[];
    root=null; board=null; wrap=null; ov=null; msg=null; S=null; cellEls=[];
  }
  return {start:start,stop:stop,_state:function(){ return S; },_ms:{create:create,open:open,flag:flag,chord:chord,hint:hintOf,LEVELS:LEVELS},_levels:LV};
})();
