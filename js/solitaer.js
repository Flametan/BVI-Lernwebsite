/* ======================================================================
   SOLITÄR (Klondike) im Feuerwehr-Thema – Pausenraum (wird erst beim Öffnen des Spiels geladen)
   Flammen, Löscher, Äxte und Leitern statt der Kartenfarben; Karten per Antippen oder Ziehen bewegen,
   beim Ziehen hängt die Karte am Greifpunkt hinter dem Zeiger her und kippt in 3D.
====================================================================== */
const SOLITAER=(function(){
  'use strict';
/* Solitär-Kern (Klondike) im Feuerwehr-Thema – reine Logik ohne Oberfläche */
var SOL=(function(){
  var SUITS=[
    {k:'flamme',name:'Flammen',red:true, path:'M12 2s5 4.6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3 1-6 1-8z'},
    {k:'loescher',name:'Löscher',red:true, path:'M9 9h6v12a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 21zM10.2 5.5H14V9h-3.8zM8 3h6.5L18 5v1.6l-3.6-1.4H8zM15.5 8.5C17.4 8.5 18.5 9.6 18.5 11.5V16h-1.6v-4.5c0-.9-.5-1.4-1.4-1.4z'},
    {k:'axt',name:'Äxte',red:false, path:'M4.6 21.4 13.4 8.6l1.8 1.3L6.4 22.6zM12.2 6.2 15.8 2.6c.9-.3 1.8.1 2.4.9l2.2 3.2c.6.9.6 1.9 0 2.7l-3.4 3.3c-1.1-.3-2.1-.7-3-1.5-1-.9-1.5-1.9-1.8-3.1z'},
    {k:'leiter',name:'Leitern',red:false, path:'M6.5 2h2v20h-2zM15.5 2h2v20h-2zM8.5 5.5h7v1.7h-7zM8.5 10.5h7v1.7h-7zM8.5 15.5h7v1.7h-7z'}
  ];
  var RANKS=['A','2','3','4','5','6','7','8','9','10','B','D','K'];
  var RNAME=['Alarm','2','3','4','5','6','7','8','9','10','Trupp','Staffel','Zug'];
  function rng(seed){ var a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function deck(){ var d=[]; for(var s=0;s<4;s++) for(var r=1;r<=13;r++) d.push({s:s,r:r,up:false}); return d; }
  function shuffle(a,rand){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(rand()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function core(S){ return {stock:S.stock,waste:S.waste,found:S.found,tab:S.tab,score:S.score,moves:S.moves,draw:S.draw,seed:S.seed,won:S.won,rec:S.rec}; }
  function snap(S){ return JSON.stringify(core(S)); }
  function clone(S){ var c=JSON.parse(snap(S)); c.h=S.h; c.r=S.r; return c; }
  function deal(seed,draw){
    seed=seed==null?Math.floor(Math.random()*4294967295):seed; var d=shuffle(deck(),rng(seed)), tab=[[],[],[],[],[],[],[]];
    for(var c=0;c<7;c++) for(var i=0;i<=c;i++){ var k=d.pop(); k.up=(i===c); tab[c].push(k); }
    d.forEach(function(k){k.up=false;});
    return {stock:d,waste:[],found:[[],[],[],[]],tab:tab,score:0,moves:0,draw:draw||1,seed:seed,won:false,rec:0,h:[],r:[]};
  }
  function push(S,n){ n.h=S.h.concat([snap(S)]); if(n.h.length>400) n.h.shift(); n.r=[]; return n; }
  function red(c){ return SUITS[c.s].red; }
  function seqOf(S,from){ if(from.t==='waste') return S.waste.length?[S.waste[S.waste.length-1]]:[]; if(from.t==='found') return S.found[from.f].length?[S.found[from.f][S.found[from.f].length-1]]:[]; var col=S.tab[from.c]; return from.i<col.length&&col[from.i].up?col.slice(from.i):[]; }
  function fits(S,cards,to){
    if(!cards.length) return false; var f=cards[0];
    if(to.t==='found'){ return cards.length===1&&f.s===to.f&&S.found[to.f].length===f.r-1; }
    var col=S.tab[to.c]; if(!col.length) return f.r===13; var top=col[col.length-1]; return top.up&&red(top)!==red(f)&&top.r===f.r+1;
  }
  function tryMove(S,from,to){
    if(S.won) return S; var cards=seqOf(S,from); if(!fits(S,cards,to)) return S;
    if(from.t==='tab'&&to.t==='tab'&&from.c===to.c) return S;
    var n=push(S,clone(S)); var cnt=cards.length;
    if(from.t==='waste') n.waste.pop(); else if(from.t==='found') n.found[from.f].pop(); else { n.tab[from.c].splice(from.i,cnt); }
    var moved=JSON.parse(JSON.stringify(cards));
    if(to.t==='found'){ n.found[to.f].push(moved[0]); n.score+= from.t==='found'?0:10; } else { n.tab[to.c]=n.tab[to.c].concat(moved); n.score+= from.t==='waste'?5:from.t==='found'?-15:0; }
    if(from.t==='tab'){ var col=n.tab[from.c]; if(col.length&&!col[col.length-1].up){ col[col.length-1].up=true; n.score+=5; } }
    n.moves++; n.won=n.found.every(function(f){return f.length===13;}); if(n.won) n.score+=200; return n;
  }
  function drawStock(S){
    if(S.won) return S; var n=push(S,clone(S));
    if(n.stock.length){ for(var i=0;i<n.draw&&n.stock.length;i++){ var k=n.stock.pop(); k.up=true; n.waste.push(k); } n.moves++; }
    else if(n.waste.length){ n.stock=n.waste.reverse(); n.stock.forEach(function(k){k.up=false;}); n.waste=[]; n.rec++; n.moves++; n.score=Math.max(0,n.score-(n.draw===1?100:20)); }
    else return S; return n;
  }
  function autoTo(S,from){ var c=seqOf(S,from); if(c.length!==1) return S; return tryMove(S,from,{t:'found',f:c[0].s}); }
  function selectable(S,tg){
    if(tg.t==='waste') return S.waste.length?{t:'waste'}:null;
    if(tg.t==='found') return S.found[tg.f].length?{t:'found',f:tg.f}:null;
    if(tg.t==='tab'&&tg.i!=null&&tg.i>=0){ var col=S.tab[tg.c]; return col[tg.i]&&col[tg.i].up?{t:'tab',c:tg.c,i:tg.i}:null; }
    return null;
  }
  function same(a,b){ return a&&b&&a.t===b.t&&a.c===b.c&&a.i===b.i&&a.f===b.f; }
  // Eine Aktion durch Antippen: liefert neuen Zustand und neue Auswahl
  function act(S,sel,tg){
    if(tg.t==='stock') return {S:drawStock(S),sel:null};
    if(sel){
      var to=tg.t==='found'?{t:'found',f:tg.f}:tg.t==='tab'?{t:'tab',c:tg.c}:null;
      if(to){ var n=tryMove(S,sel,to); if(n!==S) return {S:n,sel:null}; }
      if(same(sel,selectable(S,tg))) return {S:S,sel:null};
    }
    return {S:S,sel:selectable(S,tg)};
  }
  function undo(S){ if(!S.h.length) return S; var c=JSON.parse(S.h[S.h.length-1]); c.h=S.h.slice(0,-1); c.r=S.r.concat([snap(S)]); return c; }
  function redo(S){ if(!S.r.length) return S; var c=JSON.parse(S.r[S.r.length-1]); c.r=S.r.slice(0,-1); c.h=S.h.concat([snap(S)]); return c; }
  function hint(S){
    if(S.won) return null; var i,c,cols=S.tab;
    var cands=[]; function add(p,from,to){ cands.push({p:p,from:from,to:to}); }
    function srcs(){ var a=[]; if(S.waste.length) a.push({t:'waste'}); for(var c=0;c<7;c++){ var col=cols[c]; for(var i=0;i<col.length;i++) if(col[i].up) a.push({t:'tab',c:c,i:i}); } for(var f=0;f<4;f++) if(S.found[f].length) a.push({t:'found',f:f}); return a; }
    srcs().forEach(function(from){ var cards=seqOf(S,from); if(!cards.length) return;
      var f={t:'found',f:cards[0].s}; if(from.t!=='found'&&fits(S,cards,f)) add(1,from,f);
      for(var c=0;c<7;c++){ var to={t:'tab',c:c}; if(from.t==='tab'&&from.c===c) continue; if(!fits(S,cards,to)) continue;
        if(from.t==='tab'&&from.i===0&&!cols[c].length) continue;
        if(from.t==='found') continue;
        if(from.t==='tab'&&from.i>0&&!cols[from.c][from.i-1].up) add(2,from,to); else if(from.t==='waste') add(3,from,to); else if(from.t==='tab'&&from.i===0) add(2,from,to); } });   // reine Umlagerungen ohne Nutzen werden nicht vorgeschlagen
    cands.sort(function(a,b){return a.p-b.p;});
    if(cands.length){ var b=cands[0]; return {from:b.from,to:b.to}; }
    if(S.stock.length||S.waste.length) return {draw:true}; return null;
  }
  function canAuto(S){ return !S.won&&S.stock.length===0&&S.waste.length===0&&S.tab.every(function(col){return col.every(function(k){return k.up;});}); }
  function autoStep(S){ for(var c=0;c<7;c++){ var col=S.tab[c]; if(!col.length) continue; var k=col[col.length-1], n=tryMove(S,{t:'tab',c:c,i:col.length-1},{t:'found',f:k.s}); if(n!==S) return n; } return S; }
  function total(S){ var n=S.stock.length+S.waste.length; S.found.forEach(function(f){n+=f.length;}); S.tab.forEach(function(c){n+=c.length;}); return n; }
  return {SUITS:SUITS,RANKS:RANKS,RNAME:RNAME,deal:deal,act:act,tryMove:tryMove,drawStock:drawStock,autoTo:autoTo,undo:undo,redo:redo,hint:hint,canAuto:canAuto,autoStep:autoStep,seqOf:seqOf,selectable:selectable,same:same,total:total,rng:rng};
})();

  var BKEY='bvi_pause_best', OKEY='bvi_solitaer_opts';
  var lget=function(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
  var lset=function(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  var say=function(m){ if(typeof A11Y!=='undefined') A11Y.say(m); };
  var RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches);
  var clamp=function(x,a,b){ return Math.max(a,Math.min(b,x)); };
  var I='width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICO={undo:'<svg '+I+'><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',redo:'<svg '+I+'><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>',
    bulb:'<svg '+I+'><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
    recycle:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4h-4"/></svg>'};
  function suit(s,cls){ return '<svg class="'+cls+'" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="'+SOL.SUITS[s].path+'"/></svg>'; }
  function cardHtml(k,attrs,extra){
    var cls='so-c'+(extra?' '+extra:'');
    if(!k.up) return '<div class="'+cls+' down" '+attrs+'><i class="so-emb"></i></div>';
    var red=SOL.SUITS[k.s].red, face=k.r>=11, rk=SOL.RANKS[k.r-1];
    return '<div class="'+cls+' up '+(red?'red':'blk')+'" data-id="'+(k.s*20+k.r)+'" '+attrs+' aria-label="'+SOL.RNAME[k.r-1]+' '+SOL.SUITS[k.s].name+'" role="button"><span class="so-cr">'+rk+'</span>'+suit(k.s,'so-cs')+suit(k.s,'so-cm')+(k.r===1||face?'<span class="so-cn">'+SOL.RNAME[k.r-1]+'</span>':'')+'</div>';
  }
  var root=null, S=null, sel=null, hintObj=null, hintT=null, autoT=null, timer=null, t0=0, secs=0, started=false, L=null, drag=null, noClick=false;
  var opts={draw:1,hints:true}, best=0, rec=false, ovClosed=false, area=null, ov=null, msg=null, handlers=[];
  function fmt(s){ var m=Math.floor(s/60); return m+':'+('0'+(s%60)).slice(-2); }
  function saySm(t){ if(msg) msg.textContent=t||''; }
  function setH(k,v){ var n=root&&root.querySelector('[data-h="'+k+'"]'); if(n&&n.textContent!==String(v)) n.textContent=v; }
  function tick(){ if(!root||!root.isConnected){ stop(); return; } secs=Math.floor((Date.now()-t0)/1000); setH('time',fmt(secs)); }
  function begin(){ if(started) return; started=true; t0=Date.now(); timer=setInterval(tick,500); }
  function newGame(){ clearTimeout(autoT); clearInterval(timer); ovClosed=false; rec=false; S=SOL.deal(null,opts.draw); sel=null; hintObj=null; started=false; secs=0; best=+(lget(BKEY,{}).solitaer||0); render(); saySm(''); }
  function build(){
    root.innerHTML='<div class="pz-card so">'
     +'<div class="so-hud"><div><b data-h="score">0</b><span>Punkte</span></div><div><b data-h="moves">0</b><span>Züge</span></div><div><b data-h="time">0:00</b><span>Zeit</span></div><div><b data-h="best">–</b><span>Rekord</span></div></div>'
     +'<div class="so-tools"><button type="button" class="so-ib" data-a="undo" aria-label="Rückgängig" title="Rückgängig">'+ICO.undo+'</button><button type="button" class="so-ib" data-a="redo" aria-label="Aktion wiederholen" title="Wiederholen">'+ICO.redo+'</button><button type="button" class="so-ib" data-a="hint" aria-label="Tipp" title="Tipp">'+ICO.bulb+'</button>'
     +'<span class="so-seg" role="group" aria-label="Karten ziehen"><button type="button" data-d="1">Ziehen 1</button><button type="button" data-d="3">Ziehen 3</button></span><button type="button" class="pz-sec2" data-a="new">Neues Spiel</button></div>'
     +'<label class="so-sw"><span class="so-swt"><b>Hinweise</b><small>Passende Ziele leuchten beim Ziehen auf</small></span><input type="checkbox" class="m-switch" data-hints aria-label="Hinweise beim Ziehen und Ablegen"></label>'
     +'<div class="so-board"><div class="so-area"></div><div class="so-ov" hidden></div></div><div class="pz-fb so-msg" aria-live="polite"></div>'
     +'<div class="pz-fb">Karten ziehen und ablegen oder antippen · Doppeltipp = ins Fundament</div></div>';
    area=root.querySelector('.so-area'); ov=root.querySelector('.so-ov'); msg=root.querySelector('.so-msg');
    var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff6e0" d="'+SOL.SUITS[0].path+'"/></svg>';
    root.querySelector('.so').style.setProperty('--so-emb','url("data:image/svg+xml;utf8,'+encodeURIComponent(svg)+'")');
  }
  function layout(){ var w=root.querySelector('.so-board').clientWidth||360, gap=Math.max(4,Math.round(w*.014)), cw=Math.floor((w-gap*6-12)/7); return {gap:gap,cw:cw,ch:Math.round(cw*1.42),x0:6,ty:Math.round(cw*1.42)+22}; }
  function render(){
    if(!root||!root.isConnected||!S) return;
    L=layout(); var cw=L.cw, ch=L.ch, gap=L.gap, x0=L.x0, h=[], pos=function(c){ return x0+c*(cw+gap); };
    area.style.setProperty('--cw',cw+'px'); area.style.setProperty('--ch',ch+'px');
    var selSet={}; if(sel) SOL.seqOf(S,sel).forEach(function(k){ selSet[k.s*20+k.r]=1; });
    var hs={}, ht=null; if(hintObj&&hintObj.from){ SOL.seqOf(S,hintObj.from).forEach(function(k){ hs[k.s*20+k.r]=1; }); ht=hintObj.to; }
    h.push('<div class="so-slot rec" data-t="stock" style="left:'+pos(0)+'px;top:6px">'+(S.stock.length?'':ICO.recycle)+'</div>');
    if(S.stock.length) h.push(cardHtml({up:false},'data-t="stock" style="left:'+pos(0)+'px;top:6px"',''));
    h.push('<div class="so-slot" style="left:'+pos(1)+'px;top:6px"></div>');
    var wl=S.waste.length, show=S.draw===3?Math.min(3,wl):Math.min(1,wl);
    for(var i=0;i<show;i++){ var k=S.waste[wl-show+i], top=(i===show-1); h.push(cardHtml(k,(top?'data-t="waste" ':'')+'style="left:'+(pos(1)+i*Math.round(cw*.26))+'px;top:6px"',(selSet[k.s*20+k.r]?'sel ':'')+(hs[k.s*20+k.r]?'hint':''))); }
    for(var f=0;f<4;f++){ var fx=pos(3+f), fd=S.found[f]; h.push('<div class="so-slot fnd'+(ht&&ht.t==='found'&&ht.f===f?' hint':'')+'" data-t="found" data-f="'+f+'" style="left:'+fx+'px;top:6px">'+suit(f,'so-fi'+(SOL.SUITS[f].red?' red':''))+'</div>');
      if(fd.length){ var k2=fd[fd.length-1]; h.push(cardHtml(k2,'data-t="found" data-f="'+f+'" style="left:'+fx+'px;top:6px"',(selSet[k2.s*20+k2.r]?'sel':''))); } }
    var ty=L.ty, maxH=0, avail=Math.max(ch*2.2,(window.innerHeight||700)-ty-300);
    for(var c=0;c<7;c++){ var col=S.tab[c], y=0, nd=0, nu=0; col.forEach(function(k){ if(k.up) nu++; else nd++; });
      var dd=Math.round(cw*.2), du=Math.round(cw*.46); if(nd*dd+Math.max(0,nu-1)*du+ch>avail&&nu>1) du=Math.max(Math.round(cw*.22),Math.floor((avail-ch-nd*dd)/(nu-1)));
      h.push('<div class="so-slot'+(ht&&ht.t==='tab'&&ht.c===c&&!col.length?' hint':'')+'" data-t="tab" data-c="'+c+'" data-i="-1" style="left:'+pos(c)+'px;top:'+ty+'px"></div>');
      col.forEach(function(k,i){ var kk=k.s*20+k.r, cl=(selSet[kk]?'sel ':'')+(hs[kk]?'hint ':'')+(ht&&ht.t==='tab'&&ht.c===c&&i===col.length-1?'hint':''); h.push(cardHtml(k,'data-t="tab" data-c="'+c+'" data-i="'+i+'" style="left:'+pos(c)+'px;top:'+(ty+y)+'px"',cl)); y+=k.up?du:dd; });
      maxH=Math.max(maxH,y+ch); }
    area.style.height=(ty+maxH+14)+'px'; area.innerHTML=h.join('');
    root.querySelectorAll('.so-seg [data-d]').forEach(function(b){ var on=+b.dataset.d===opts.draw; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); });
    root.querySelector('[data-hints]').checked=opts.hints;
    root.querySelector('[data-a="undo"]').disabled=!S.h.length; root.querySelector('[data-a="redo"]').disabled=!S.r.length;
    setH('score',S.score); setH('moves',S.moves); setH('time',fmt(secs)); setH('best',Math.max(best,S.score)||'–');
    if(S.won){ if(ovClosed) ov.hidden=true; else finish(); } else { ov.hidden=true; if(SOL.canAuto(S)&&!autoT) autoT=setTimeout(auto,260); }
  }
  function auto(){ autoT=null; if(!S||S.won||!root||!root.isConnected) return; var n=SOL.autoStep(S); if(n===S) return; S=n; render(); autoT=setTimeout(auto,90); }
  function finish(){
    clearInterval(timer); if(S.score>best){ var b=lget(BKEY,{}); b.solitaer=S.score; lset(BKEY,b); best=S.score; rec=true; }
    ov.hidden=false; ov.innerHTML='<div class="so-win" role="dialog" aria-modal="true" aria-label="Einsatz erfolgreich"><div class="so-wi"><svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path fill="currentColor" d="'+SOL.SUITS[0].path+'"/></svg></div><h3>Einsatz erfolgreich</h3><p>Alle vier Stapel sind komplett.'+(rec?' Neuer Rekord!':'')+'</p>'
      +'<div class="so-stats"><div><b>'+S.score+'</b><span>Punkte</span></div><div><b>'+S.moves+'</b><span>Züge</span></div><div><b>'+fmt(secs)+'</b><span>Zeit</span></div></div>'
      +'<div class="so-act"><button type="button" class="pz-pri" data-a="new">Neues Spiel</button><button type="button" class="pz-sec2" data-a="close">Spielfeld ansehen</button></div></div>';
    say('Einsatz erfolgreich. '+S.score+' Punkte.'); var pb=ov.querySelector('.pz-pri'); if(pb) pb.focus({preventScroll:true});
  }
  function tgOf(el){ if(!el||!area||!area.contains(el)) return null; el=el.closest('[data-t]'); if(!el) return null; return {t:el.dataset.t,c:el.dataset.c!=null?+el.dataset.c:undefined,i:el.dataset.i!=null?+el.dataset.i:undefined,f:el.dataset.f!=null?+el.dataset.f:undefined}; }
  function dragSource(el){ var tg=tgOf(el); if(!tg||tg.t==='stock') return null; var from=tg.t==='tab'?{t:'tab',c:tg.c,i:tg.i}:tg.t==='waste'?{t:'waste'}:{t:'found',f:tg.f}; return SOL.seqOf(S,from).length?from:null; }
  function cardsOfSource(from){
    if(from.t==='tab') return Array.prototype.filter.call(area.querySelectorAll('.so-c[data-t="tab"][data-c="'+from.c+'"]'),function(n){ return +n.dataset.i>=from.i; });
    if(from.t==='waste') return [area.querySelector('.so-c[data-t="waste"]')];
    return [area.querySelector('.so-c[data-t="found"][data-f="'+from.f+'"]')];
  }
  function validTargets(from){ var out=[], c, f; for(c=0;c<7;c++) if(SOL.tryMove(S,from,{t:'tab',c:c})!==S) out.push({t:'tab',c:c}); for(f=0;f<4;f++) if(SOL.tryMove(S,from,{t:'found',f:f})!==S) out.push({t:'found',f:f}); return out; }
  function markTargets(list,on){ list.forEach(function(t){ var el=t.t==='found'?area.querySelector('.so-slot[data-t="found"][data-f="'+t.f+'"]'):(function(){ var cs=area.querySelectorAll('.so-c[data-t="tab"][data-c="'+t.c+'"]'); return cs.length?cs[cs.length-1]:area.querySelector('.so-slot[data-t="tab"][data-c="'+t.c+'"]'); })(); if(el) el.classList.toggle('drop',on); }); }
  function dropTarget(px,py){
    var r=area.getBoundingClientRect(), x=px-r.left, y=py-r.top, cw=L.cw, gap=L.gap;
    var col=clamp(Math.round((x-L.x0-cw/2)/(cw+gap)),0,6);
    if(y<L.ty-L.ch*.2){ var f=Math.floor((x-(L.x0+3*(cw+gap))+gap/2)/(cw+gap)); if(f>=0&&f<=3) return {t:'found',f:f}; }
    return {t:'tab',c:col};
  }
  // Ziehen: Die Karte hängt am Greifpunkt hinter dem Zeiger her und kippt dabei in 3D
  function frame(dt){
    var d=drag, n0=d.sim[0];
    d.sim.forEach(function(n,k){ var fk=RM?1:1-Math.pow(.84+k*.015,dt); n.x+=(d.tx-n.x)*fk; n.y+=(d.ty-n.y)*fk; });
    var lx=d.tx-n0.x, ly=d.ty-n0.y, side=d.pinTop?1:-1;
    if(RM){ d.rx=d.ry=d.rz=0; } else { d.ry+=(clamp(lx*.9,-34,34)-d.ry)*.4; d.rx+=(clamp(-ly*.9,-34,34)-d.rx)*.4; d.rz+=(clamp(lx*.30*side,-24,24)-d.rz)*.4; }
    d.sim.forEach(function(n){ n.el.style.transform='translate('+n.x.toFixed(1)+'px,'+n.y.toFixed(1)+'px)'+(RM?'':' perspective(560px) rotateX('+d.rx.toFixed(1)+'deg) rotateY('+d.ry.toFixed(1)+'deg) rotateZ('+d.rz.toFixed(1)+'deg)')+' scale(1.07)'; n.el.style.setProperty('--sx',clamp(50+d.ry*2.6,-10,110)+'%'); n.el.style.setProperty('--shx',(-lx*.35).toFixed(1)+'px'); n.el.style.setProperty('--shy',(-ly*.25).toFixed(1)+'px'); });
  }
  function loop(t){ if(!drag||!drag.sim.length||drag.busy) return; var dt=clamp((t-(drag.last||t))/16.67,.2,2.4); drag.last=t; frame(dt); drag.raf=requestAnimationFrame(loop); }
  function onDown(e){
    if(!S||S.won||(e.pointerType==='mouse'&&e.button!==0)||drag) return; var el=e.target.closest('.so-c.up'); if(!el) return; var from=dragSource(el); if(!from) return;
    drag={from:from,sx:e.clientX,sy:e.clientY,el:el,active:false,id:e.pointerId,nodes:null,sim:[],targets:[],tx:0,ty:0,raf:0,busy:false,rx:0,ry:0,rz:0,pinTop:true,last:0};
  }
  function onMove(e){
    if(!drag||e.pointerId!==drag.id||drag.busy) return; var dx=e.clientX-drag.sx, dy=e.clientY-drag.sy;
    if(!drag.active){ if(Math.hypot(dx,dy)<7) return; drag.active=true; begin(); hintObj=null; saySm(''); sel=null;
      drag.nodes=cardsOfSource(drag.from).filter(Boolean); drag.nodes.forEach(function(n){ n.classList.remove('sel','hint'); n.classList.add('dragging'); });
      drag.sim=drag.nodes.map(function(n){ return {el:n,x:0,y:0}; });
      var gr=drag.el.getBoundingClientRect(); drag.pinTop=(drag.sy-gr.top)<gr.height/2;
      drag.nodes.forEach(function(n){ var r=n.getBoundingClientRect(); n.style.transformOrigin=(drag.sx-r.left).toFixed(0)+'px '+(drag.sy-r.top).toFixed(0)+'px'; });
      var r0=drag.nodes[0].getBoundingClientRect(); drag.cx=r0.left+r0.width/2; drag.cy=r0.top+r0.height/2;
      drag.targets=validTargets(drag.from); if(opts.hints) markTargets(drag.targets,true);
      try{ area.setPointerCapture(e.pointerId); }catch(x){} drag.raf=requestAnimationFrame(loop); }
    e.preventDefault(); drag.tx=dx; drag.ty=dy;
  }
  function cleanup(d){ if(d.targets) markTargets(d.targets,false); }
  function back(d){
    d.busy=true; cancelAnimationFrame(d.raf); var left=d.nodes.length, done=function(){ if(--left>0) return; cleanup(d); d.nodes.forEach(function(n){ n.style.transform=''; n.classList.remove('dragging'); }); drag=null; sel=null; render(); };
    if(RM||!d.nodes[0].animate){ left=1; done(); return; }
    d.nodes.forEach(function(n,i){ var a=n.animate([{transform:n.style.transform||'none'},{transform:'none'}],{duration:240,easing:'cubic-bezier(.2,.9,.3,1)',delay:i*14,fill:'forwards'}); a.onfinish=done; });
  }
  function onUp(e,cancel){
    if(!drag||(e&&e.pointerId!==drag.id)||drag.busy) return; var d=drag; if(!d.active){ drag=null; return; }
    noClick=true; setTimeout(function(){ noClick=false; },60);
    var dx=e?e.clientX-d.sx:0, dy=e?e.clientY-d.sy:0, tg=(!cancel&&e)?dropTarget(d.cx+dx,d.cy+dy):null;
    var n=tg?SOL.tryMove(S,d.from,tg.t==='found'?{t:'found',f:tg.f}:{t:'tab',c:tg.c}):null;
    if(n&&n!==S){
      var from=d.sim.map(function(s){ var r=s.el.getBoundingClientRect(); return {id:s.el.dataset.id,left:r.left,top:r.top}; }), rx=d.rx, ry=d.ry, rz=d.rz;
      cancelAnimationFrame(d.raf); cleanup(d); drag=null; S=n; sel=null; render();
      if(!RM) from.forEach(function(f,i){ var el=area.querySelector('.so-c[data-id="'+f.id+'"]'); if(!el||!el.animate) return; var r=el.getBoundingClientRect(), t0s='translate('+(f.left-r.left)+'px,'+(f.top-r.top)+'px)';
        el.animate([{transform:t0s+' perspective(560px) rotateX('+rx+'deg) rotateY('+ry+'deg) rotateZ('+rz+'deg) scale(1.07)'},{transform:'perspective(560px) rotateX('+(-rx*.25)+'deg) rotateY('+(-ry*.25)+'deg) rotateZ('+(-rz*.3)+'deg) scale(1.02)',offset:.6},{transform:'none'}],{duration:420,easing:'cubic-bezier(.25,.9,.35,1)',delay:i*18}); });
      return; }
    if(opts.hints&&!cancel&&e) saySm('Dort passt die Karte nicht hin.');
    back(d);
  }
  function onClickArea(e){
    if(noClick){ noClick=false; return; } if(!S||S.won) return; var tg=tgOf(e.target); if(!tg) return; begin(); hintObj=null; saySm('');
    var r=SOL.act(S,sel,tg); S=r.S; sel=r.sel; render();
  }
  function onDbl(e){
    if(!S||S.won) return; var tg=tgOf(e.target); if(!tg||tg.t==='stock') return;
    var from=tg.t==='tab'?{t:'tab',c:tg.c,i:tg.i}:{t:tg.t,f:tg.f}; if(tg.t==='tab'&&tg.i!==S.tab[tg.c].length-1) return;
    var n=SOL.autoTo(S,from); if(n!==S){ S=n; sel=null; render(); }
  }
  function onClickRoot(e){
    var d=e.target.closest('[data-d]'); if(d){ opts.draw=+d.dataset.d; lset(OKEY,opts); newGame(); return; }
    var b=e.target.closest('[data-a]'); if(!b) return; var a=b.dataset.a;
    if(a==='new') newGame();
    else if(a==='close'){ ovClosed=true; ov.hidden=true; }
    else if(a==='undo'){ S=SOL.undo(S); sel=null; hintObj=null; render(); }
    else if(a==='redo'){ S=SOL.redo(S); sel=null; hintObj=null; render(); }
    else if(a==='hint'){ var hh=SOL.hint(S); hintObj=hh; saySm(!hh?'Keine Züge mehr möglich – starte ein neues Spiel.':hh.draw?'Tipp: Ziehe eine Karte vom Stapel.':'Tipp: Die markierte Karte lässt sich verschieben.'); sel=null; render(); clearTimeout(hintT); hintT=setTimeout(function(){ hintObj=null; if(S&&!S.won&&root&&root.isConnected) render(); },2600); }
  }
  function onChange(e){ if(e.target.matches('[data-hints]')){ opts.hints=e.target.checked; lset(OKEY,opts); if(!opts.hints) saySm(''); } }
  function onResize(){ if(S&&!drag&&root&&root.isConnected) render(); }
  function onUpW(e){ onUp(e,false); } function onCancelW(e){ onUp(e,true); }
  function on(t,ev,fn,o){ t.addEventListener(ev,fn,o); handlers.push([t,ev,fn,o]); }
  function start(host){
    stop(); root=host; opts=Object.assign({draw:1,hints:true},lget(OKEY,{})); build(); newGame();
    on(area,'click',onClickArea); on(area,'dblclick',onDbl); on(area,'pointerdown',onDown);
    on(root,'click',onClickRoot); on(root,'change',onChange);
    on(window,'pointermove',onMove,{passive:false}); on(window,'pointerup',onUpW); on(window,'pointercancel',onCancelW); on(window,'resize',onResize);
  }
  function stop(){
    clearTimeout(autoT); clearTimeout(hintT); clearInterval(timer); timer=null; autoT=null;
    if(drag){ cancelAnimationFrame(drag.raf); drag=null; }
    handlers.forEach(function(h){ h[0].removeEventListener(h[1],h[2],h[3]); }); handlers=[];
    root=null; area=null; ov=null; msg=null; S=null;
  }
  return {start:start,stop:stop,_state:function(){ return S; },_sol:SOL};
})();
