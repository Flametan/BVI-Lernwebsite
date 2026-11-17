/* ======================================================================
   Mahjong (Solitaire) im Feuerwehrthema (Pausenraum): Paare gleicher Symbole entfernen.
   Wird erst beim Öffnen des Spiels geladen (siehe MSGAME in pause.js).
   Das Brett wird rückwärts erzeugt (immer ein freies Paar entfernen und merken) und ist damit garantiert lösbar.
   Rekord: localStorage['bvi_pause_best'].mahjong = beste Zeit in Sekunden (niedriger ist besser).
   ====================================================================== */
const MAHJONG=(function(){
  'use strict';
  var BKEY='bvi_pause_best', KEY='mahjong';
  var lget=function(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
  var lset=function(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  var say=function(m){ if(typeof A11Y!=='undefined') A11Y.say(m); };

  /* ---------- Symbole (Feuerwehr-Motive, Form UND Farbe verschieden) ---------- */
  var SYM=[
    {n:'Flamme',s:'<path d="M12 2.500c1 3.600 6.500 6.200 6.500 11.800a6.500 6.500 0 0 1-13 0c0-2.800 1.500-4.700 3-6.200.2 1.900 1.100 3 2.300 3.200C10.700 8.300 12 5.700 12 2.500z" fill="#f2711c"/><path d="M12 12.500c2 2 3 3.300 3 4.700a3 3 0 0 1-6 0c0-1.400 1-2.700 3-4.700z" fill="#ffd54a"/>'},
    {n:'Leiter',s:'<rect x="5" y="2" width="3.200" height="20" rx="1" fill="#8d5a2b"/><rect x="15.800" y="2" width="3.200" height="20" rx="1" fill="#8d5a2b"/><rect x="8.200" y="4.500" width="7.600" height="2.200" fill="#d9a066"/><rect x="8.200" y="9" width="7.600" height="2.200" fill="#d9a066"/><rect x="8.200" y="13.500" width="7.600" height="2.200" fill="#d9a066"/><rect x="8.200" y="18" width="7.600" height="2.200" fill="#d9a066"/>'},
    {n:'Schlauch',s:'<circle cx="11" cy="12" r="8.200" fill="none" stroke="#1d1d1d" stroke-width="4.600"/><circle cx="11" cy="12" r="8.200" fill="none" stroke="#00a67e" stroke-width="2.600"/><circle cx="11" cy="12" r="3.600" fill="none" stroke="#1d1d1d" stroke-width="4"/><circle cx="11" cy="12" r="3.600" fill="none" stroke="#00a67e" stroke-width="2"/><path d="M17.500 18.500l3.500 3.500" stroke="#1d1d1d" stroke-width="4.600" fill="none"/><path d="M17.500 18.500l3.500 3.500" stroke="#00a67e" stroke-width="2.600" fill="none"/>'},
    {n:'Helm',s:'<path d="M4 15C4 8.500 7.500 4.500 12 4.500s8 4 8 10.500z" fill="#2b3a8f"/><path d="M12 4.500V15" stroke="#8f9bd8" stroke-width="1.400" fill="none"/><path d="M1.500 15h21l-2.600 5H4.200z" fill="#1c2766"/><circle cx="12" cy="10.600" r="2.300" fill="#ffd54a"/>'},
    {n:'Hydrant',s:'<rect x="3.500" y="10.500" width="17" height="4" rx="1" fill="#e0a100"/><rect x="7.500" y="6.500" width="9" height="14" rx="1.500" fill="#e0a100"/><path d="M7.500 6.500a4.500 4.500 0 0 1 9 0z" fill="#b97f00"/><rect x="10.500" y="1" width="3" height="2.500" fill="#b97f00"/><rect x="5.500" y="20" width="13" height="2.500" rx="1" fill="#b97f00"/><circle cx="12" cy="12.500" r="1.500" fill="#fff3c4" stroke="none"/>'},
    {n:'Beil',s:'<rect x="10.500" y="2" width="3" height="20" rx="1" fill="#8d5a2b"/><path d="M13.500 4C17 3 20.500 3.500 22.500 4.500c-1 3.500-1 6 0 9.500-2 1-5.500 1.500-9 .5z" fill="#607d8b"/><path d="M10.500 5L3.500 9l7 1z" fill="#90a4ae"/>'},
    {n:'Blaulicht',s:'<rect x="5" y="17" width="14" height="4.500" rx="1" fill="#37474f"/><path d="M6.500 17v-4.500a5.500 5.500 0 0 1 11 0V17z" fill="#1e5bd8"/><path d="M9.300 15.500v-3a2.700 2.700 0 0 1 2.100-2.600" fill="none" stroke="#9cc4ff" stroke-width="1.300"/><path d="M12 1.500v2.800M4.200 4.200l2 2M19.800 4.200l-2 2M1.500 11.500h2.800M19.700 11.500h2.800" stroke="#1e5bd8" stroke-width="1.800" fill="none"/>'},
    {n:'Löschfahrzeug',s:'<rect x="1.500" y="8.500" width="13.500" height="9" rx="1" fill="#d62828"/><path d="M15 10.500h4.500l3 3.500v3.500H15z" fill="#d62828"/><path d="M16.500 11.800h2.600l1.800 2.200h-4.400z" fill="#bfe3ff"/><rect x="3" y="5.200" width="11" height="2.300" fill="#e8e8e8"/><rect x="3.500" y="12" width="9" height="1.800" fill="#fff" stroke="none"/><circle cx="6" cy="18.500" r="2.300" fill="#333"/><circle cx="18" cy="18.500" r="2.300" fill="#333"/>'},
    {n:'Feuerlöscher',s:'<rect x="7" y="8" width="9" height="14" rx="3" fill="#b3123f"/><rect x="9.500" y="4.500" width="4" height="4" fill="#666"/><path d="M7.500 3.800h7.500" stroke="#1d1d1d" stroke-width="2.400" fill="none"/><path d="M14 6.500c4 0 6 1.500 6 6" fill="none" stroke="#1d1d1d" stroke-width="1.800"/><rect x="8.800" y="12" width="5.400" height="5" fill="#fff" stroke="none"/>'},
    {n:'Wassertropfen',s:'<path d="M12 2.500S5 10.500 5 15.500a7 7 0 0 0 14 0c0-5-7-13-7-13z" fill="#4fc3f7"/><path d="M8.500 15.500a3.500 3.500 0 0 0 2.500 3.300" fill="none" stroke="#fff" stroke-width="1.600"/>'},
    {n:'Atemschutzmaske',s:'<path d="M12 2.500c5 0 8 3 8 8 0 5-3 9.500-8 11-5-1.500-8-6-8-11 0-5 3-8 8-8z" fill="#6a8f2a"/><rect x="5.500" y="7.500" width="13" height="5.500" rx="2.700" fill="#cfe8ff"/><circle cx="12" cy="17.500" r="3.200" fill="#37474f"/><circle cx="12" cy="17.500" r="1.200" fill="#9fb0b8" stroke="none"/>'},
    {n:'Rauchmelder',s:'<circle cx="12" cy="12" r="9.500" fill="#5c6bc0"/><circle cx="12" cy="12" r="6" fill="none" stroke="#e8eaf6" stroke-width="1.200"/><circle cx="12" cy="12" r="2.800" fill="#e8eaf6"/><circle cx="18" cy="5.500" r="1.400" fill="#ff5252" stroke="none"/>'},
    {n:'Warndreieck',s:'<path d="M12 2.800L22.200 20.500H1.800z" fill="#ffb300"/><rect x="10.800" y="8.500" width="2.400" height="6.500" rx="1" fill="#1d1d1d" stroke="none"/><circle cx="12" cy="17.700" r="1.400" fill="#1d1d1d" stroke="none"/>'},
    {n:'Funkgerät',s:'<rect x="13.500" y="1.500" width="2.500" height="6" rx="1" fill="#546e7a"/><rect x="6.500" y="6.500" width="11" height="16" rx="2.500" fill="#263238"/><rect x="8.500" y="8.500" width="7" height="4.500" rx="1" fill="#9be7ff" stroke="none"/><path d="M9 16h6M9 18.800h6" stroke="#90a4ae" stroke-width="1.200" fill="none"/>'},
    {n:'Taschenlampe',s:'<path d="M6.500 2.500h11l-2 5.500h-7z" fill="#c0ca33"/><rect x="8.500" y="8" width="7" height="13.500" rx="2" fill="#455a64"/><rect x="10.500" y="11" width="3" height="3.500" rx="1" fill="#ffd54a" stroke="none"/>'},
    {n:'Erste Hilfe',s:'<rect x="3" y="3" width="18" height="18" rx="3" fill="#2e9e44"/><path d="M10 6h4v4h4v4h-4v4h-4v-4H6v-4h4z" fill="#fff" stroke="none"/>'},
    {n:'Stoppuhr',s:'<rect x="9.500" y="1.500" width="5" height="3" rx="1" fill="#00838f"/><circle cx="12" cy="13.500" r="8.500" fill="#e0f7fa" stroke="#00838f" stroke-width="2.200"/><path d="M12 13.500v-5M12 13.500l3.300 2.200" fill="none" stroke="#1d1d1d" stroke-width="1.600"/>'},
    {n:'Megafon',s:'<path d="M2.500 9h4.500l9.500-5v16L7 15H2.500z" fill="#ff6e40"/><path d="M7 15l1.800 6.200h3L10.500 15.500" fill="#6d4c41"/><path d="M19 8.500a5 5 0 0 1 0 7M21.500 6a8.500 8.500 0 0 1 0 12" fill="none" stroke="#ff6e40" stroke-width="1.600"/>'},
    {n:'Blitz',s:'<path d="M13.500 1.800L4.800 13.500h6l-1.500 8.700L19.200 10h-6.200z" fill="#8e24aa"/>'},
    {n:'Eimer',s:'<path d="M4.800 9h14.400l-2 12.500H6.800z" fill="#a1452b"/><rect x="3.800" y="6.800" width="16.400" height="3" rx="1.200" fill="#c9694a"/><path d="M6 6.800a6 5 0 0 1 12 0" fill="none" stroke="#1d1d1d" stroke-width="1.100"/><path d="M8 14h8" stroke="#e8a58e" stroke-width="1.300" fill="none"/>'},
    {n:'Rettungsring',s:'<circle cx="12" cy="12" r="8.500" fill="none" stroke="#1d1d1d" stroke-width="6.400"/><circle cx="12" cy="12" r="8.500" fill="none" stroke="#fff" stroke-width="4.400"/><circle cx="12" cy="12" r="8.500" fill="none" stroke="#e91e63" stroke-width="4.400" stroke-dasharray="6.680 6.680"/>'}
  ];
  var NS=SYM.length; // 21 Symbole zu je 4 Steinen = 84 Steine

  /* ---------- Layouts (Stufen): x,y in Halbfeldern, z = Ebene ---------- */
  var LV=[['leicht','Leicht'],['mittel','Mittel'],['pyramide','Pyramide'],['burg','Burg'],['festung','Festung']];
  function grid(p,z,x0,x1,y0,y1){ for(var y=y0;y<=y1;y+=2) for(var x=x0;x<=x1;x+=2) p.push({x:x,y:y,z:z}); }
  var LAY={
    leicht:function(p){ grid(p,0,2,16,0,6); grid(p,1,6,12,2,4); },                       // 40 Steine
    mittel:function(p){ grid(p,0,2,16,0,8); grid(p,1,4,14,2,6); grid(p,2,8,10,4,4); },    // 60 Steine
    pyramide:function(p){                                                                  // 84 Steine
      var x, y;
      for(y=0;y<=10;y+=2){ var x0=(y===0||y===10)?2:0, x1=(y===0||y===10)?16:18; for(x=x0;x<=x1;x+=2) p.push({x:x,y:y,z:0}); }
      for(y=3;y<=7;y+=2) for(x=4;x<=14;x+=2) p.push({x:x,y:y,z:1});
      for(y=4;y<=6;y+=2) for(x=6;x<=12;x+=2) p.push({x:x,y:y,z:2});
      p.push({x:8,y:5,z:3}); p.push({x:10,y:5,z:3});
    },
    burg:function(p){ grid(p,0,0,18,0,10); [[0,0],[16,0],[0,8],[16,8]].forEach(function(c){ grid(p,1,c[0],c[0]+2,c[1],c[1]+2); grid(p,2,c[0],c[0]+2,c[1],c[1]+2); }); },   // 92 Steine, vier Türme
    festung:function(p){ grid(p,0,0,22,0,10); grid(p,1,2,20,2,8); grid(p,2,6,16,4,6); }  // 124 Steine
  };
  var POS=[], N=0, ABOVE=[], LEFT=[], RIGHT=[], VB=null, LVL='pyramide';
  function setLayout(id){
    if(!LAY[id]) id='pyramide'; LVL=id; POS=[]; LAY[id](POS); N=POS.length;
    ABOVE=[]; LEFT=[]; RIGHT=[];
    POS.forEach(function(a,i){
      ABOVE[i]=[]; LEFT[i]=[]; RIGHT[i]=[];
      POS.forEach(function(b,j){
        if(i===j) return;
        if(b.z>a.z&&Math.abs(b.x-a.x)<2&&Math.abs(b.y-a.y)<2) ABOVE[i].push(j);
        if(b.z===a.z&&Math.abs(b.y-a.y)<2){ if(b.x===a.x-2) LEFT[i].push(j); else if(b.x===a.x+2) RIGHT[i].push(j); }
      });
    });
    var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    POS.forEach(function(p,i){ x0=Math.min(x0,fx(i)); y0=Math.min(y0,fy(i)); x1=Math.max(x1,fx(i)+FW+DX); y1=Math.max(y1,fy(i)+FH+DY); });
    VB={x:x0-.35,y:y0-.35,w:x1-x0+.7,h:y1-y0+.7};
  }
  // Stein ist frei: nichts liegt darauf und links ODER rechts ist frei
  function isFree(al,i){
    if(!al[i]) return false;
    var k, L=false, R=false;
    for(k=0;k<ABOVE[i].length;k++) if(al[ABOVE[i][k]]) return false;
    for(k=0;k<LEFT[i].length;k++) if(al[LEFT[i][k]]){ L=true; break; }
    if(!L) return true;
    for(k=0;k<RIGHT[i].length;k++) if(al[RIGHT[i][k]]){ R=true; break; }
    return !R;
  }
  function shuffleArr(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  // Rückwärts-Erzeugung: aus den Steinen idx nacheinander zufällig ein freies Paar entfernen. Liefert die Paarfolge oder null (Sackgasse)
  function genPairs(idx){
    var al=[], i, pairs=[], rem=idx.slice();
    for(i=0;i<N;i++) al[i]=false; idx.forEach(function(k){ al[k]=true; });
    while(rem.length){
      var fr=rem.filter(function(k){ return isFree(al,k); });
      if(fr.length<2) return null;
      shuffleArr(fr); var a=fr[0], b=fr[1]; al[a]=false; al[b]=false; pairs.push([a,b]);
      rem=rem.filter(function(k){ return k!==a&&k!==b; });
    }
    return pairs;
  }
  function genBoard(){
    var all=[], i; for(i=0;i<N;i++) all.push(i);
    for(var t=0;t<500;t++){
      var pairs=genPairs(all); if(!pairs) continue;
      var ord=[]; for(i=0;i<NS;i++) ord.push(i); shuffleArr(ord); var pool=[]; for(i=0;i<N/2;i++) pool.push(ord[Math.floor(i/2)%NS]); shuffleArr(pool);
      var sym=[]; pairs.forEach(function(pr,k){ sym[pr[0]]=pool[k]; sym[pr[1]]=pool[k]; });
      return sym;
    }
    // Notlösung (praktisch nie nötig): feste Paarung der Reihe nach
    var s=[]; for(i=0;i<N;i++) s[i]=Math.floor(i/2)%NS; return s;
  }
  // Verbleibende Steine mit denselben Symbolen neu und wieder lösbar verteilen
  function reshuffle(al,sym){
    var idx=[], cnt={}, i;
    for(i=0;i<N;i++) if(al[i]){ idx.push(i); cnt[sym[i]]=(cnt[sym[i]]||0)+1; }
    var pool=[]; Object.keys(cnt).forEach(function(k){ for(var c=0;c<Math.floor(cnt[k]/2);c++) pool.push(+k); });
    for(var t=0;t<600;t++){
      var pairs=genPairs(idx); if(!pairs) continue;
      shuffleArr(pool); var out=sym.slice(); pairs.forEach(function(pr,k){ out[pr[0]]=pool[k]; out[pr[1]]=pool[k]; });
      return out;
    }
    return null;
  }
  function pairsAvail(al,sym){
    var by={}, out=[];
    for(var i=0;i<N;i++) if(isFree(al,i)){ (by[sym[i]]=by[sym[i]]||[]).push(i); }
    Object.keys(by).forEach(function(k){ var a=by[k]; for(var x=0;x<a.length;x++) for(var y=x+1;y<a.length;y++) out.push([a[x],a[y]]); });
    return out;
  }

  /* ---------- Darstellung ---------- */
  var UX=1, UY=1.3, FW=1.78, FH=2.32, DX=.22, DY=.28, SH=.3;
  function fx(i){ return POS[i].x*UX-POS[i].z*SH; }
  function fy(i){ return POS[i].y*UY-POS[i].z*SH; }
  var STYLE_ID='mj-style';
  var CSS=''
   +'.mj{max-width:620px;margin:0 auto;position:relative;width:100%;box-sizing:border-box;}'
   +'.mj-lv{display:flex;flex-wrap:nowrap;gap:5px;}.mj-lv .pz-chip{flex:1 1 0;min-width:0;padding:0 2px;font-size:.74rem;min-height:36px;text-align:center;justify-content:center;background:var(--m-raised);}.mj-lv .pz-chip.on{background:var(--m-accent,#ffa31a);color:var(--m-on-accent,#1a1205);}'
   +'.mj-hud{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}'
   +'.mj-hud div{background:var(--m-raised);border-radius:12px;padding:7px 4px;text-align:center;}'
   +'.mj-hud b{display:block;font-size:1.15rem;font-weight:800;color:var(--m-fg);font-variant-numeric:tabular-nums;line-height:1.2;}'
   +'.mj-hud span{display:block;font-size:.7rem;letter-spacing:.07em;text-transform:uppercase;color:var(--m-muted);font-weight:700;}'
   +'.mj-bw{background:var(--m-raised);border-radius:14px;padding:6px;display:flex;justify-content:center;}'
   +'.mj-svg{width:100%;height:auto;max-height:62vh;display:block;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;outline:none;}'
   +'.mj-svg:focus-visible{outline:2px solid var(--m-accent,#ffa31a);outline-offset:2px;border-radius:8px;}'
   +'.mj-t{cursor:pointer;transform-box:fill-box;transform-origin:center;}'
   +'.mj-s{fill:#bda978;stroke:#5c4d2b;stroke-width:.07;}'
   +'.mj-f{fill:#fbf5e4;stroke:#6b5a33;stroke-width:.07;transition:fill .12s;}'
   +'.mj-t use{transition:opacity .12s;}'
   +'.mj-t.mj-b .mj-f{fill:#e3dbc5;}.mj-t.mj-b use{opacity:.78;}.mj-t.mj-b{cursor:default;}'
   +'.mj-t.mj-sel .mj-f{fill:#ffe08a;stroke:#e87700;stroke-width:.2;}'
   +'.mj-t.mj-hint .mj-f{fill:#ffe9a8;stroke:#e87700;stroke-width:.2;animation:mjhint .7s ease-in-out infinite alternate;}'
   +'.mj-svg.mj-kb .mj-t.mj-cur .mj-f{stroke:#0a66ff;stroke-width:.24;stroke-dasharray:.35 .2;}'
   +'.mj-t.mj-out{animation:mjout .3s ease-in forwards;pointer-events:none;}'
   +'.mj-t.mj-in{animation:mjin .3s ease-out;}'
   +'.mj-t.mj-shake{animation:mjshake .3s;}'
   +'.mj-t.mj-gone{display:none;}'
   +'@keyframes mjout{0%{transform:scale(1);opacity:1;}35%{transform:scale(1.12);opacity:1;}100%{transform:scale(.2);opacity:0;}}'
   +'@keyframes mjin{0%{transform:scale(.3);opacity:0;}100%{transform:scale(1);opacity:1;}}'
   +'@keyframes mjshake{0%,100%{transform:translateX(0);}25%{transform:translateX(-.18px);}75%{transform:translateX(.18px);}}'
   +'@keyframes mjhint{from{filter:none;}to{filter:brightness(1.08) drop-shadow(0 0 .35px #ff9100);}}'
   +'.mj-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}'
   +'.mj-bar button{min-height:44px;border-radius:12px;border:0;background:var(--m-raised);color:var(--m-fg);font-family:inherit;font-size:.86rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;padding:0 4px;}'
   +'.mj-bar button svg{width:17px;height:17px;flex:none;}'
   +'.mj-bar button:disabled,.mj-bar button[aria-disabled="true"]{opacity:.4;}'
   +'.mj-bar button:focus-visible,.mj-ov button:focus-visible{outline:2px solid var(--m-accent,#ffa31a);outline-offset:2px;}'
   +'.mj-bar button.mj-pulse{background:var(--m-accent,#ffa31a);color:var(--m-on-accent,#1a1205);opacity:1;animation:mjpulse 1.1s ease-in-out infinite;}'
   +'@keyframes mjpulse{50%{transform:scale(1.05);}}'
   +'.mj-msg{min-height:2.6em;display:flex;align-items:center;justify-content:center;text-align:center;font-size:.88rem;line-height:1.35;color:var(--m-muted);}'
   +'.mj-msg.mj-warn{color:var(--m-fg);font-weight:700;}'
   +'.mj-ov{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--m-card) 82%,transparent);border-radius:18px;padding:12px;}'
   +'.mj-ov[hidden]{display:none;}'
   +'.mj-win{background:var(--m-card);border:1px solid var(--m-line);border-radius:18px;padding:20px 18px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center;max-width:340px;width:100%;box-shadow:0 10px 30px rgba(0,0,0,.35);animation:mjin .35s ease-out;}'
   +'.mj-win h3{margin:0;font-size:1.25rem;color:var(--m-fg);}.mj-win p{margin:0;color:var(--m-muted);font-size:.92rem;}'
   +'.mj-win svg{width:56px;height:56px;}'
   +'.mj-st{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;}'
   +'.mj-st div{background:var(--m-raised);border-radius:12px;padding:8px;}.mj-st b{display:block;font-size:1.2rem;color:var(--m-fg);}.mj-st span{font-size:.7rem;letter-spacing:.07em;text-transform:uppercase;color:var(--m-muted);font-weight:700;}'
   +'.mj-win .pz-pri{width:100%;min-height:46px;}'
   +'@media(prefers-reduced-motion:reduce){.mj *,.mj-win{animation:none!important;transition:none!important;}.mj-t.mj-out{display:none;}}';
  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    var st=document.createElement('style'); st.id=STYLE_ID; st.textContent=CSS; document.head.appendChild(st);
  }
  var IC={
    bulb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.5 1 1.300 1 2.100h5c0-.8.4-1.600 1-2.100A6 6 0 0 0 12 3z"/></svg>',
    undo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
    mix:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
    neu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.400-5.700M20 4v5h-5"/></svg>'
  };

  var root=null, host=null, svg=null, ov=null, msgEl=null, tiles=[], S=null, handlers=[], timer=null, hintT=null, overT=null, RM=false, kb=false;
  function fmt(s){ var m=Math.floor(s/60); return m+':'+('0'+(s%60)).slice(-2); }
  function secs(){ if(!S||!S.t0) return 0; return Math.floor(((S.over?S.t1:Date.now())-S.t0)/1000); }
  function bestObj(){ var v=lget(BKEY,{})[KEY]; return typeof v==='number'?{pyramide:v}:(v&&typeof v==='object'?v:{}); }
  function best(){ var v=bestObj()[LVL]; return typeof v==='number'?v:null; }
  var OKEY='bvi_mahjong_opts';
  function setH(k,v){ var n=root&&root.querySelector('[data-h="'+k+'"]'); if(n&&n.textContent!==String(v)) n.textContent=v; }
  function setMsg(t,warn){ if(!msgEl) return; msgEl.textContent=t||''; msgEl.classList.toggle('mj-warn',!!warn); }

  function build(){
    var defs='<defs>'+SYM.map(function(y,i){ return '<symbol id="mj-y'+i+'" viewBox="0 0 24 24"><g stroke="#1d1d1d" stroke-width="1.100" stroke-linejoin="round" stroke-linecap="round">'+y.s+'</g></symbol>'; }).join('')+'</defs>';
    var g='';
    var order=POS.map(function(p,i){ return i; }).sort(function(a,b){ return POS[a].z-POS[b].z||POS[a].x-POS[b].x||POS[a].y-POS[b].y; });
    order.forEach(function(i){
      var x=fx(i), y=fy(i), ix=(FW-1.4)/2, iy=(FH-1.4)/2;
      g+='<g class="mj-t" data-i="'+i+'"><rect class="mj-s" x="'+(x+DX).toFixed(2)+'" y="'+(y+DY).toFixed(2)+'" width="'+FW+'" height="'+FH+'" rx=".3"/>'
        +'<rect class="mj-f" x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+FW+'" height="'+FH+'" rx=".3"/>'
        +'<use href="#mj-y0" x="'+(x+ix).toFixed(2)+'" y="'+(y+iy).toFixed(2)+'" width="1.4" height="1.4"/></g>';
    });
    var ico=function(k,t,a){ return '<button type="button" data-a="'+a+'" aria-label="'+t.l+'" title="'+t.t+'">'+IC[k]+'<span>'+t.s+'</span></button>'; };
    root.innerHTML='<div class="pz-card mj">'
      +'<div class="pz-chips mj-lv" role="group" aria-label="Stufe">'+LV.map(function(l){ return '<button type="button" class="pz-chip'+(l[0]===LVL?' on':'')+'" data-lv="'+l[0]+'" aria-pressed="'+(l[0]===LVL)+'">'+l[1]+'</button>'; }).join('')+'</div>'
      +'<div class="mj-hud"><div><b data-h="time">0:00</b><span>Zeit</span></div><div><b data-h="left">'+N+'</b><span>Steine</span></div><div><b data-h="best">–</b><span>Bestzeit</span></div></div>'
      +'<div class="mj-bw"><svg class="mj-svg" viewBox="'+VB.x.toFixed(2)+' '+VB.y.toFixed(2)+' '+VB.w.toFixed(2)+' '+VB.h.toFixed(2)+'" tabindex="0" role="application" aria-label="Spielbrett. Pfeiltasten wählen einen freien Stein, Eingabetaste wählt ihn aus. Taste H: Tipp, U: Rückgängig, N: Neues Spiel.">'+defs+g+'</svg></div>'
      +'<div class="mj-msg" aria-live="polite"></div>'
      +'<div class="mj-bar">'
      +ico('bulb',{l:'Tipp: ein freies Paar zeigen',t:'Tipp (H)',s:'Tipp'},'hint')
      +ico('undo',{l:'Letzten Zug rückgängig machen',t:'Rückgängig (U)',s:'Zurück'},'undo')
      +ico('mix',{l:'Steine neu mischen, nur möglich wenn kein Zug mehr frei ist',t:'Mischen, nur wenn kein Zug mehr möglich ist',s:'Mischen'},'mix')
      +ico('neu',{l:'Neues Spiel',t:'Neues Spiel (N)',s:'Neu'},'new')
      +'</div>'
      +'<div class="mj-ov" hidden></div>'
      +'</div>';
    svg=root.querySelector('.mj-svg'); ov=root.querySelector('.mj-ov'); msgEl=root.querySelector('.mj-msg');
    tiles=[]; Array.prototype.forEach.call(svg.querySelectorAll('.mj-t'),function(g){ tiles[+g.dataset.i]=g; });
  }

  function newGame(){
    clearInterval(timer); clearTimeout(hintT); clearTimeout(overT); timer=null;
    var al=[]; for(var i=0;i<N;i++) al[i]=true;
    S={sym:genBoard(),al:al,hist:[],sel:-1,cur:-1,rem:N,t0:0,t1:0,over:false,noMoves:false,hint:null};
    tiles.forEach(function(g,i){ g.setAttribute('class','mj-t'); g.querySelector('use').setAttribute('href','#mj-y'+S.sym[i]); g.setAttribute('aria-hidden','false'); });
    ov.hidden=true; ov.innerHTML='';
    var b=best(); setH('best',b==null?'–':fmt(b)); setH('time','0:00'); setH('left',N);
    setMsg('Tippe einen freien Stein an und dann den passenden zweiten. Frei ist ein Stein, wenn nichts auf ihm liegt und links oder rechts Platz ist.');
    refresh(); say('Neues Spiel. '+N+' Steine.');
  }

  function refresh(){
    var free=0, i;
    for(i=0;i<N;i++){
      if(!S.al[i]) continue;
      var f=isFree(S.al,i), g=tiles[i];
      g.classList.toggle('mj-b',!f); g.classList.toggle('mj-sel',S.sel===i);
      g.setAttribute('aria-label',SYM[S.sym[i]].n+(f?', frei':', blockiert'));
      if(f) free++;
    }
    setH('left',S.rem);
    var nm=!S.over&&S.rem>0&&pairsAvail(S.al,S.sym).length===0;
    var mixB=root.querySelector('[data-a="mix"]'), undoB=root.querySelector('[data-a="undo"]');
    if(nm!==S.noMoves){
      S.noMoves=nm;
      if(nm){ setMsg('Keine Züge mehr. Mische die Steine neu oder mache einen Zug rückgängig.',true); say('Keine Züge mehr. Du kannst mischen oder rückgängig machen.'); }
      else if(msgEl.classList.contains('mj-warn')) setMsg('');
    }
    mixB.classList.toggle('mj-pulse',nm); mixB.setAttribute('aria-disabled',nm?'false':'true');
    undoB.disabled=!S.hist.length||S.over;
  }
  function clearHint(){
    clearTimeout(hintT); if(S&&S.hint){ S.hint.forEach(function(i){ if(tiles[i]) tiles[i].classList.remove('mj-hint'); }); S.hint=null; }
  }
  function startTimer(){
    if(S.t0) return; S.t0=Date.now();
    timer=setInterval(function(){ if(!root||!root.isConnected){ stop(); return; } setH('time',fmt(secs())); },500);
  }
  function tap(i){
    if(!S||S.over||!S.al[i]) return;
    clearHint();
    var g=tiles[i];
    if(!isFree(S.al,i)){
      g.classList.remove('mj-shake'); void g.getBoundingClientRect(); if(!RM) g.classList.add('mj-shake');
      setMsg('Dieser Stein ist blockiert: Es liegt etwas auf ihm oder er hat links und rechts einen Nachbarn.');
      return;
    }
    startTimer(); S.cur=i;
    if(S.noMoves===false&&msgEl.classList.contains('mj-warn')) setMsg('');
    if(S.sel===i){ S.sel=-1; refresh(); return; }
    if(S.sel>=0&&S.al[S.sel]&&S.sym[S.sel]===S.sym[i]){ removePair(S.sel,i); return; }
    S.sel=i; setMsg(''); refresh(); say(SYM[S.sym[i]].n+' ausgewählt');
  }
  function removePair(a,b){
    S.al[a]=false; S.al[b]=false; S.rem-=2; S.sel=-1; S.hist.push([a,b]);
    [a,b].forEach(function(i){
      var g=tiles[i]; g.classList.remove('mj-sel','mj-hint','mj-in','mj-b'); g.classList.add(RM?'mj-gone':'mj-out'); g.setAttribute('aria-hidden','true');
    });
    setMsg(''); say(SYM[S.sym[a]].n+' entfernt, noch '+S.rem+' Steine');
    if(S.rem===0){ S.over=true; S.t1=Date.now(); clearInterval(timer); timer=null; setH('time',fmt(secs())); refresh(); overT=setTimeout(finish,RM?100:520); return; }
    refresh();
  }
  function undo(){
    if(!S||S.over||!S.hist.length) return; clearHint();
    var p=S.hist.pop(); S.sel=-1;
    p.forEach(function(i){
      S.al[i]=true; var g=tiles[i]; g.classList.remove('mj-out','mj-gone'); g.setAttribute('aria-hidden','false');
      if(!RM){ g.classList.remove('mj-in'); void g.getBoundingClientRect(); g.classList.add('mj-in'); }
    });
    S.rem+=2; setMsg('Zug rückgängig gemacht.'); refresh(); say('Zug rückgängig. '+S.rem+' Steine');
  }
  function hint(){
    if(!S||S.over) return; clearHint();
    var av=pairsAvail(S.al,S.sym), btn=root.querySelector('[data-a="hint"]');
    if(!av.length){ setMsg('Kein Zug mehr möglich. Mische die Steine neu oder mache einen Zug rückgängig.',true); return; }
    // Bevorzugt Paare, bei denen nur noch genau diese beiden Steine des Symbols übrig sind (kein Fehlgriff möglich)
    var cnt={}; for(var i=0;i<N;i++) if(S.al[i]) cnt[S.sym[i]]=(cnt[S.sym[i]]||0)+1;
    var safe=av.filter(function(p){ return cnt[S.sym[p[0]]]===2; }), pick=(safe.length?safe:av)[Math.floor(Math.random()*(safe.length?safe.length:av.length))];
    S.hint=pick; pick.forEach(function(k){ tiles[k].classList.add('mj-hint'); });
    setMsg('Tipp: Diese beiden '+SYM[S.sym[pick[0]]].n+'-Steine passen zusammen.'); say('Tipp: zwei '+SYM[S.sym[pick[0]]].n+' sind frei.');
    hintT=setTimeout(function(){ clearHint(); },2600); void btn;
  }
  function mix(){
    if(!S||S.over) return;
    if(!S.noMoves){ setMsg('Mischen geht nur, wenn kein Zug mehr möglich ist.'); return; }
    clearHint();
    var out=reshuffle(S.al,S.sym);
    if(!out){ setMsg('Mischen war nicht möglich. Mache einen Zug rückgängig.',true); return; }
    S.sym=out; S.hist=[]; S.sel=-1; S.noMoves=false;
    for(var i=0;i<N;i++) if(S.al[i]){ var g=tiles[i]; g.querySelector('use').setAttribute('href','#mj-y'+S.sym[i]); if(!RM){ g.classList.remove('mj-in'); void g.getBoundingClientRect(); g.classList.add('mj-in'); } }
    setMsg('Die Steine sind neu gemischt.'); refresh(); say('Steine neu gemischt');
  }
  function finish(){
    if(!ov||!S) return;
    var t=secs(), old=best(), hadOld=old!=null, isNew=false; if(typeof PAUSE!=='undefined') PAUSE.addScore('mahjong',t,LVL);
    if(old==null||t<old){ var b=lget(BKEY,{}), o=bestObj(); o[LVL]=t; b[KEY]=o; lset(BKEY,b); old=t; isNew=true; setH('best',fmt(t)); }
    if(typeof GAME!=='undefined') GAME.cheer('spiel','Mahjong',isNew&&hadOld?fmt(t):'');
    ov.hidden=false;
    ov.innerHTML='<div class="mj-win" role="dialog" aria-modal="true" aria-label="Brett gelöst"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.500c1 3.600 6.500 6.200 6.500 11.800a6.500 6.500 0 0 1-13 0c0-2.800 1.500-4.700 3-6.200.2 1.900 1.100 3 2.300 3.200C10.700 8.300 12 5.700 12 2.500z" fill="#f2711c"/><path d="M12 12.500c2 2 3 3.300 3 4.700a3 3 0 0 1-6 0c0-1.400 1-2.700 3-4.700z" fill="#ffd54a"/></svg>'
      +'<h3>Brett gelöst</h3><p>Alle Steine sind abgeräumt.</p>'
      +'<div class="mj-st"><div><b>'+fmt(t)+'</b><span>Zeit</span></div><div><b>'+fmt(old)+'</b><span>Bestzeit</span></div></div>'
      +(isNew?'<p><b style="color:var(--m-fg)">Neue Bestzeit!</b></p>':'')
      +'<button type="button" class="pz-pri" data-a="new">Neues Spiel</button></div>';
    say('Brett gelöst in '+fmt(t)+(isNew?'. Neue Bestzeit.':'.'));
    var pb=ov.querySelector('.pz-pri'); if(pb) pb.focus({preventScroll:true});
  }

  /* ---------- Eingaben ---------- */
  function freeList(){ var a=[]; for(var i=0;i<N;i++) if(isFree(S.al,i)) a.push(i); return a; }
  function setCur(i){
    if(S.cur>=0&&tiles[S.cur]) tiles[S.cur].classList.remove('mj-cur');
    S.cur=i; if(i>=0&&tiles[i]) tiles[i].classList.add('mj-cur');
  }
  function moveCur(dx,dy){
    var fr=freeList(); if(!fr.length) return;
    if(S.cur<0||!S.al[S.cur]||!isFree(S.al,S.cur)){
      fr.sort(function(a,b){ return fx(a)-fx(b)||fy(a)-fy(b); }); setCur(fr[0]); return;
    }
    var c=S.cur, bi=-1, bs=1e9;
    fr.forEach(function(j){
      if(j===c) return; var ddx=fx(j)-fx(c), ddy=fy(j)-fy(c), along=ddx*dx+ddy*dy, perp=Math.abs(ddx*dy)+Math.abs(ddy*dx);
      if(along<=.3) return; var sc=along+2*perp; if(sc<bs){ bs=sc; bi=j; }
    });
    if(bi>=0) setCur(bi);
  }
  function onClick(e){
    kb=false; svg.classList.remove('mj-kb');
    var g=e.target.closest&&e.target.closest('.mj-t'); if(!g||!svg.contains(g)) return;
    if(typeof svg.focus==='function'){ try{ svg.focus({preventScroll:true}); }catch(x){} }
    tap(+g.dataset.i);
  }
  function onKey(e){
    if(!S||e.ctrlKey||e.metaKey||e.altKey) return;
    var k=e.key, onBoard=(e.target===svg), dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(S.over&&k!=='n'&&k!=='N') return;
    if(onBoard&&dirs[k]){ e.preventDefault(); kb=true; svg.classList.add('mj-kb'); moveCur(dirs[k][0],dirs[k][1]); return; }
    if(onBoard&&(k==='Enter'||k===' ')){ e.preventDefault(); kb=true; svg.classList.add('mj-kb'); if(S.cur<0||!S.al[S.cur]) moveCur(0,0); else tap(S.cur); return; }
    if(k==='h'||k==='H'){ e.preventDefault(); hint(); }
    else if(k==='u'||k==='U'||k==='z'||k==='Z'){ e.preventDefault(); undo(); }
    else if(k==='n'||k==='N'){ e.preventDefault(); newGame(); }
    else if(k==='m'||k==='M'){ e.preventDefault(); mix(); }
  }
  function onRoot(e){
    var b=e.target.closest&&e.target.closest('[data-a],[data-lv]'); if(!b||!root.contains(b)) return;
    if(b.dataset.lv){ if(b.dataset.lv!==LVL){ lset(OKEY,{lv:b.dataset.lv}); var el=root; start(el); } return; }
    var a=b.dataset.a;
    if(a==='new') newGame(); else if(a==='hint') hint(); else if(a==='undo') undo(); else if(a==='mix') mix();
  }
  function on(t,ev,fn,o){ t.addEventListener(ev,fn,o); handlers.push([t,ev,fn,o]); }

  function start(el){
    stop(); ensureStyle(); host=el; root=el;
    RM=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setLayout((lget(OKEY,{})||{}).lv); build(); newGame();
    on(svg,'click',onClick); on(root,'click',onRoot); on(root,'keydown',onKey);
  }
  function stop(){
    clearInterval(timer); clearTimeout(hintT); clearTimeout(overT); timer=null; hintT=null; overT=null;
    handlers.forEach(function(h){ h[0].removeEventListener(h[1],h[2],h[3]); }); handlers=[];
    root=null; host=null; svg=null; ov=null; msgEl=null; tiles=[]; S=null;
  }
  return {start:start,stop:stop,_state:function(){ return S; },_t:{setLayout:setLayout,pos:function(){ return POS; },genPairs:genPairs,isFree:isFree,genBoard:genBoard,pairsAvail:pairsAvail,reshuffle:reshuffle}};
})();
