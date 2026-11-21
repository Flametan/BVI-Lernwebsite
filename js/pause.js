/* ======================================================================
   KLEINE PAUSE – Pausenspiele (wird erst beim Öffnen der Seite geladen)
   Daten: js/pause-data.js (PAUSE_DATA)
====================================================================== */
const PAUSE=(function(){
  const D=typeof PAUSE_DATA!=='undefined'?PAUSE_DATA:{allg:{},fw:{},exam:[]};
  const BKEY='bvi_pause_best';
  const RM=!!(window.matchMedia&&false); // Bewegung reduzieren: Szene ohne Wackeln, weniger Partikel
  const say=m=>{ if(typeof A11Y!=='undefined') A11Y.say(m); };
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const rnd=a=>a[Math.floor(Math.random()*a.length)];
  const get=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
  const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  let root=null,cur=null,pushed=false,shAnim=false;
  const best=()=>get(BKEY,{});
  function saveBest(k,v,lower){if(v<=0&&!lower)return false;const b=best();if(b[k]==null||(lower?v<b[k]:v>b[k])){b[k]=v;set(BKEY,b);return true;}return false;}
  /* ---------- Bestenlisten: je Spiel (und Stufe) die zehn besten Läufe, nur auf dem Gerät und im Sync ---------- */
  const TOPKEY="bvi_pause_top";
  const LV4=[["leicht","Leicht"],["mittel","Mittel"],["schwer","Schwer"],["sehr","Sehr schwer"]];
  const BOARDS={fahrt:{u:"Punkte"},duell:{u:"Punkte"},lueckentext:{u:"Lücken"},reihenfolge:{u:"Serie",s:1},hangman:{u:"Serie",s:1},kreuzwort:{u:"Tage",s:1},mahjong:{t:1,lv:[["leicht","Leicht"],["mittel","Mittel"],["pyramide","Pyramide"],["burg","Burg"],["festung","Festung"]]},sudoku:{t:1,lv:LV4.slice(0,3)},tetris:{u:"Punkte"},solitaer:{u:"Punkte"},g2048:{u:"Punkte"},minesweeper:{t:1,lv:LV4},snake:{u:"Punkte"}};
  const ymd=(off)=>{const d=new Date();d.setDate(d.getDate()+(off||0));const q=n=>("0"+n).slice(-2);return d.getFullYear()+"-"+q(d.getMonth()+1)+"-"+q(d.getDate());};
  // Ergebnis eintragen: v = Punkte, Sekunden (Zeitspiele, niedriger ist besser) oder Serie; lv = Stufe
  function addScore(k,v,lv){const B=BOARDS[k];v=Math.round(+v);if(!B||!isFinite(v)||v<0||(!B.t&&v<1))return;
    const T=get(TOPKEY,{}),id=lv?k+":"+lv:k;let a=Array.isArray(T[id])?T[id]:[];
    if(B.s)a=a.filter(e=>!(e.p===v-1&&e.d===ymd(-1)&&B.u==="Tage"));
    let n="";try{n=(localStorage.getItem("bvi_profile_name")||"").slice(0,30);}catch(e){}
    const e={p:v,d:ymd(0),a:B.t?1:0};if(n)e.n=n;a.push(e);
    a.sort((x,y)=>B.t?x.p-y.p:y.p-x.p);T[id]=a.slice(0,10);set(TOPKEY,T);weekAdd(id,v,!!B.t);topG=k;topL=lv||"";set("bvi_pause_topg",topG);set("bvi_pause_topl",topL);pushBests();}
  // Wochenbestwerte (Wochenwertung): je Liste der beste Wert der laufenden ISO-Woche
  const WKEY="bvi_pause_wk";
  const wkNow=()=>{try{return GAME.isoWeek();}catch(e){return "";}};
  // Läufe dieser Woche, die vor der Wochenwertung gespielt wurden, stehen nur in der lokalen Bestenliste (mit Datum): von dort nachtragen
  function weekObj(){const k=wkNow(),s=get(WKEY,null),w=s&&s.k===k&&s.g?s:{k,g:{}};if(!k)return w;
    const T=get(TOPKEY,{});
    for(const id in T){const B=BOARDS[id.split(":")[0]];if(!B||!Array.isArray(T[id]))continue;
      for(const e of T[id]){if(!e||typeof e.d!=="string"||e.d.length!==10||typeof e.p!=="number")continue;
        let wk="";try{wk=GAME.isoWeek(new Date(+e.d.slice(0,4),+e.d.slice(5,7)-1,+e.d.slice(8,10)));}catch(x){}
        if(wk===k){const o=w.g[id];if(o==null||(B.t?e.p<o:e.p>o))w.g[id]=e.p;}}}
    return w;}
  function weekAdd(id,v,low){const w=weekObj();if(!w.k)return;const o=w.g[id];if(o==null||(low?v<o:v>o)){w.g[id]=v;set(WKEY,w);}}
  // früher gab es nur ein Mahjong-Brett (heute: Stufe Pyramide): Rekord und Liste umziehen
  (function(){try{const b=best();if(typeof b.mahjong==='number'){b.mahjong={pyramide:b.mahjong};set(BKEY,b);}
    const T=get(TOPKEY,{});if(T.mahjong){if(!(T['mahjong:pyramide']||[]).length&&Array.isArray(T.mahjong))T['mahjong:pyramide']=T.mahjong;delete T.mahjong;set(TOPKEY,T);}}catch(e){}})();
  // einmalig: bisherige Rekorde in die Bestenliste übernehmen (feste Datumsangabe, damit der Sync sie nicht doppelt führt)
  (function seedTop(){try{if(localStorage.getItem("bvi_pause_seeded"))return;localStorage.setItem("bvi_pause_seeded","1");
    const b=best(),T=get(TOPKEY,{});let ch=0,n="";n=(localStorage.getItem("bvi_profile_name")||"").slice(0,30);
    const put=(id,v,B)=>{v=Math.round(+v);if(!isFinite(v)||v<0||(!B.t&&v<1)||(Array.isArray(T[id])&&T[id].length))return;const e={p:v,d:"2026-11-17",a:B.t?1:0};if(n)e.n=n;T[id]=[e];ch++;};
    Object.keys(BOARDS).forEach(k=>{const B=BOARDS[k],v=b[k];if(v==null)return;
      if(B.lv){if(v&&typeof v==="object")B.lv.forEach(l=>{if(typeof v[l[0]]==="number")put(k+":"+l[0],v[l[0]],B);});}
      else if(typeof v==="number")put(k,v,B);});
    if(ch)set(TOPKEY,T);}catch(e){}})();
  const ICON={
    ladder:'<path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10"/>',
    bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    scale:'<path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0z"/>',
    pairs:'<rect x="3" y="5" width="8" height="12" rx="2"/><rect x="13" y="7" width="8" height="12" rx="2"/>',
    duel:'<path d="M2 16V8a1 1 0 0 1 1-1h6v9M13 16V8a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v8"/><circle cx="5.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    mine:'<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
    cards:'<rect x="3.5" y="4" width="11" height="16" rx="2"/><path d="m16 7 4.2 1.4a1.5 1.5 0 0 1 1 1.9l-3 8.7"/><path d="M9 9v.01M9 15v.01"/>',
    flame:'<path d="M12 2s5 4.6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3 1-6 1-8z"/>',
    truck:'<path d="M2 16V8a1 1 0 0 1 1-1h10v9M13 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M6 4h4"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
    tile:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><path d="M15 17h4M17 15v4"/>',
    order:'<path d="M9 6h11M9 12h11M9 18h11M3.5 5.5l1-1v3M3.2 11.5h2.6l-2.6 3h2.6M3.2 17.2h2.6v1.4H4M3.2 19.9h2.6v-2"/>',
    blank:'<path d="M4 7h16M4 12h5M13 12h7M4 17h16"/><path d="M9 11v2h4v-2"/>',
    stack:'<rect x="3" y="14" width="6" height="6" rx="1"/><rect x="9" y="14" width="6" height="6" rx="1"/><rect x="15" y="14" width="6" height="6" rx="1"/><rect x="9" y="8" width="6" height="6" rx="1"/><rect x="3" y="2.5" width="6" height="5.5" rx="1"/>',
    sudoku:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    hang:'<path d="M5 21h6M8 21V4h8v3"/><circle cx="16" cy="9.5" r="2.2"/><path d="M16 12v4l-2 3M16 16l2 3"/>',
    cross:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18M15 9v12M3 15h12"/>',
    mahjong:'<rect x="3" y="5" width="10" height="14" rx="2"/><path d="M8 5V3.5a1.5 1.5 0 0 1 1.5-1.5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1.5"/><path d="M8 10v4"/>'
  };
  const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const GAMES=[
    ['fahrt','truck','Einsatzfahrt','Nur Fragen aus der Laufbahnprüfung (IBK, VAk, FeuAK, IdF) · 5, 10 oder 15 Fragen, Hilfsfrist schaffen',()=>FAHRT],
    ['duell','duel','Einsatzfahrt-Duell','Zu zweit live gegeneinander · Verbindung per QR-Code · gleiche Fragen aus der Laufbahnprüfung',()=>DUELLGAME],
    ['snake','flame','Einsatzleitung-Snake','Löschzug durchs Feuer steuern · wähle Atemluft und Löschwasser als Herausforderung',()=>SNAKEGAME],
    ['solitaer','cards','Solitär','Klondike mit Flammen, Löschern, Äxten und Leitern · Karten ziehen oder antippen',()=>SOLGAME],
    ['minesweeper','mine','Minesweeper','Brandherde im Dunkeln aufspüren · vier Stufen von Leicht bis Sehr schwer',()=>MSGAME],
    ['kreuzwort','cross','Kreuzworträtsel','Fachbegriffe, jeden Tag ein neues Rätsel für alle',()=>KWGAME],
    ['sudoku','sudoku','Sudoku','Drei Stufen · mit Notizen, Tipp und Rückgängig',()=>SUGAME],
    ['hangman','hang','Galgenmännchen','Fachbegriffe erraten, bevor das Feuer die Leiter erreicht',()=>HMGAME],
    ['lueckentext','blank','Lückentext-Sprint','60 Sekunden, so viele Lücken wie möglich füllen',()=>LTGAME],
    ['reihenfolge','order','Reihenfolge bringen','Abläufe in die richtige Reihenfolge sortieren',()=>RFGAME],
    ['g2048','tile','2048 mit Dienstgraden','Gleiche Dienstgrade verschmelzen · wie weit kommst du?',()=>G48GAME],
    ['tetris','stack','Tetris Gerätehaus','Fahrzeuge und Geräte stapeln, volle Reihen räumen',()=>TTGAME],
    ['mahjong','mahjong','Mahjong','Gleiche Feuerwehr-Steine paarweise abräumen',()=>MJGAME]
  ];
  const fmtT=s=>Math.floor(s/60)+':'+('0'+s%60).slice(-2);
  // Rekord-Texte: kurz für die Kachel (chip), lang für Hinweise (txt)
  function bestChip(k){const b=best()[k];if(b==null)return'';
    if(k==='minesweeper'){const L=[['sehr','Sehr schwer'],['schwer','Schwer'],['mittel','Mittel'],['leicht','Leicht']].find(x=>b[x[0]]!=null);return L?`${L[1]} ${fmtT(b[L[0]])}`:'';}
    if(k==='sudoku'){const L=[['schwer','Schwer'],['mittel','Mittel'],['leicht','Leicht']].find(x=>b&&b[x[0]]!=null);return L?`${L[1]} ${fmtT(b[L[0]])}`:'';}
    if(k==='kreuzwort')return typeof b==='number'&&b>0?`Beste Serie ${b} ${b===1?'Tag':'Tage'}`:'';
    if(k==='mahjong'){const o=typeof b==='number'?{pyramide:b}:b;const L=[['festung','Festung'],['burg','Burg'],['pyramide','Pyramide'],['mittel','Mittel'],['leicht','Leicht']].find(x=>o&&o[x[0]]!=null);return L?`${L[1]} ${fmtT(o[L[0]])}`:'';}
    if(k==='lueckentext')return `${b} in 60 s`;
    if(k==='reihenfolge'||k==='hangman')return `Serie ${b}`;
    return `Rekord ${typeof b==='number'?b.toLocaleString('de-DE'):b}`;}
  const bestTxt=bestChip;
  // kurze Untertitel für die Kacheln
  const SHORT={fahrt:'5, 10 oder 15 Fragen, Hilfsfrist',duell:'Zu zweit live, per QR-Code',snake:'Löschzug durchs Feuer steuern',solitaer:'Klondike mit Flammen und Leitern',minesweeper:'Brandherde im Dunkeln aufspüren',kreuzwort:'Jeden Tag ein neues Rätsel',sudoku:'Leicht, Mittel, Schwer',hangman:'Fachbegriffe erraten',lueckentext:'60 Sekunden, Lücken füllen',reihenfolge:'Abläufe sortieren',g2048:'Dienstgrade verschmelzen',tetris:'Fahrzeuge stapeln',mahjong:'5 Stufen, Paare abräumen'};
  // Die Simulationen (eigenes 3D-Spiel unter game/) starten über die Kachel oben im Reiter Pausenspiele
  const TKEY='bvi_pause_tab';let ptab=get(TKEY,'spiele');if(ptab!=='top')ptab='spiele';
  const tabs=()=>`<div class="pz-mode pz-tabs" role="tablist" aria-label="Bereich im Pausenraum"><i class="rk-pill" aria-hidden="true"></i>${[['spiele','Pausenspiele'],['top','Bestenliste']].map(([k,t])=>`<button role="tab" aria-selected="${ptab===k}" data-pt="${k}" class="${ptab===k?'on':''}">${t}</button>`).join('')}</div>`;
  let pill=null;
  const dropSh=()=>document.querySelectorAll("body > .pz-sh").forEach(x=>x.remove());
  addEventListener("popstate",dropSh);addEventListener("hashchange",dropSh);
  const tabsOn=()=>{dropSh();root.querySelectorAll('[data-pt]').forEach(x=>x.onclick=()=>{shOpen=false;ptab=x.dataset.pt;set(TKEY,ptab);hub();});
    // Schieber gleitet vom bisherigen zum neuen Reiter (die Ansicht wird bei jedem Wechsel neu gezeichnet)
    root.querySelectorAll('.pz-tabs').forEach(tb=>{const pl=tb.querySelector('.rk-pill'),on=tb.querySelector('button.on');if(!pl||!on)return;
      const to={w:on.offsetWidth,x:on.offsetLeft},from=pill||to;pl.style.transition='none';pl.style.width=from.w+'px';pl.style.transform='translateX('+from.x+'px)';
      void pl.offsetWidth;pl.style.transition='';pl.style.width=to.w+'px';pl.style.transform='translateX('+to.x+'px)';pill=to;});};
  let topG=get("bvi_pause_topg","fahrt"),topL=get("bvi_pause_topl",""),shOpen=false,topS=get("bvi_pause_tops","me");
  const fmtV=(B,v)=>B.t?fmtT(v):v.toLocaleString("de-DE");
  const rankOn=()=>{try{return !!localStorage.getItem("bvi_rank");}catch(e){return false;}};
  const rankLoad=()=>typeof RANK!=="undefined"?Promise.resolve(RANK):loadJs("js/rank.js").then(()=>RANK);
  // eigene besten Werte je Liste (für den Vergleich mit allen)
  function myBests(){const T=get(TOPKEY,{}),g={};Object.keys(T).forEach(id=>{const a=T[id];if(BOARDS[id.split(":")[0]]&&Array.isArray(a)&&a[0]&&typeof a[0].p==="number")g[id]=a[0].p;});return g;}
  let gTimer=0;
  // Werte senden (gesamt und Woche), danach Platzierungen und Karte im Spiel neu laden
  const syncNow=()=>rankLoad().then(R=>R.games(myBests(),weekObj()).catch(e=>{if(e&&e.code===404)throw e;}).then(()=>R));
  function pushBests(){if(!rankOn()){if(window.rankAuto)window.rankAuto();return;}clearTimeout(gTimer);gTimer=setTimeout(()=>{STAND=null;syncNow().then(()=>{cardUp();return loadStand();}).then(medalCheck).catch(()=>{});},4000);}
  /* ---------- Medaillen: Gold, Silber, Bronze für Platz 1 bis 3 ---------- */
  const MED={1:["#f8c53a","#b8860b","#7a5200","Gold"],2:["#dfe3ea","#8b93a1","#4a5160","Silber"],3:["#e29a5a","#9a5a22","#5e3210","Bronze"]};
  // kleine flache Medaille (SVG) für Karten, Listen und die Rückfallansicht
  const medalSvg=(n,px)=>{const c=MED[n];return c?`<svg class="pzm" viewBox="0 0 24 24" width="${px}" height="${px}" role="img" aria-label="${c[3]}medaille"><path d="M7.5 1h3.4l1.6 8h-3.4z" fill="#c81e1e"/><path d="M13.1 1h3.4l-1.6 8h-3.4z" fill="#8f1313"/><circle cx="12" cy="15.2" r="8" fill="${c[1]}"/><circle cx="12" cy="15.2" r="6.5" fill="${c[0]}"/><text x="12" y="18.6" text-anchor="middle" font-size="9.5" font-weight="800" font-family="system-ui,sans-serif" fill="${c[2]}">${n}</text></svg>`:"";};
  const placeIcon=p=>p>=1&&p<=3?medalSvg(p,24):p;
  // Neuer bester Platz (1 bis 3) in der zuletzt gespielten Liste: Medaille zeigen, je Liste nur bei Verbesserung
  function medalCheck(j){if(!j||!j.boards||document.hidden)return;
    const id=topL?topG+":"+topL:topG,x=j.boards[id];if(!x||x.place>3||x.place<1)return;
    const M=get("bvi_pause_medal",null)||{};if(M[id]!=null&&x.place>=M[id])return;
    M[id]=x.place;set("bvi_pause_medal",M);
    loadJs("js/medal.js").then(()=>MEDAL.show(x.place,"Platz "+x.place+" · "+MED[x.place][3],bname(id)+" · neue Bestplatzierung",medalSvg(x.place,150))).catch(()=>{});}
  // Beim ersten Öffnen der Plätze den Stand merken, ohne alte Platzierungen zu feiern
  function medalSeed(j){if(get("bvi_pause_medal",null)!=null)return;const M={};Object.keys(j.boards).forEach(b=>{const p=j.boards[b].place;if(p>=1&&p<=3)M[b]=p;});set("bvi_pause_medal",M);}
  /* ---------- Platzierungen: Rang-Streifen, Plätze auf den Kacheln, Wochenwertung, Karte im Spiel ---------- */
  let STAND=null,standT=0,curK=null,curB=null,cardSeq=0;
  const bname=id=>{const k=id.split(":")[0],q=GAMES.find(x=>x[0]===k),B=BOARDS[k],l=B&&B.lv&&B.lv.find(z=>z[0]===id.split(":")[1]);return (q?q[2]:id)+(l?" · "+l[1]:"");};
  const SING={Tage:"Tag",Punkte:"Punkt","Lücken":"Lücke",Sekunden:"Sekunde"};
  const unitN=(n,u)=>n===1&&SING[u]?SING[u]:u;
  // Überholt: wurde mein Platz schlechter, merken wir uns, wer vor mir liegt
  function overtake(j){const P=get("bvi_pause_places",{}),np={};let ev=get("bvi_pause_ev",null);
    Object.keys(j.boards||{}).forEach(b=>{const x=j.boards[b];np[b]=x.place;if(P[b]!=null&&x.place>P[b]&&x.above)ev={b,by:x.above,from:P[b],t:Date.now()};});
    if(ev&&(Date.now()-ev.t>6048e5||(j.boards[ev.b]&&j.boards[ev.b].place<=ev.from)))ev=null;
    set("bvi_pause_places",np);set("bvi_pause_ev",ev);}
  function loadStand(){if(!rankOn())return Promise.resolve(null);if(STAND&&Date.now()-standT<6e4)return Promise.resolve(STAND);
    return syncNow().then(R=>R.gamesAll()).then(j=>{if(!j||!j.boards)return null;overtake(j);STAND=j;standT=Date.now();return j;}).catch(()=>null);}
  const gotoTop=(id)=>{if(id){const p=id.split(":");topG=p[0];topL=p[1]||"";set("bvi_pause_topg",topG);set("bvi_pause_topl",topL);}ptab="top";topS="all";shOpen=false;set(TKEY,ptab);set("bvi_pause_tops",topS);hub();};
  function fillRank(){
    if(ptab!=="spiele"||!root||!root.isConnected)return;
    const place=()=>{root.querySelectorAll(".pz-rk,.pz-rkb").forEach(e=>e.remove());return root.querySelector(".pz-tabs");};
    if(!rankOn()){const t=place();if(t&&Object.keys(myBests()).length){t.insertAdjacentHTML("afterend",`<button class="pz-rk pz-rkn" data-rk=""><b>Gegen alle antreten</b><span>Mit dem Ranking sehen Sie Ihre Plätze in allen Spielen. ›</span></button>`);t.nextElementSibling.onclick=()=>gotoTop("");}return;}
    loadStand().then(j=>{if(!j)return;medalSeed(j);if(ptab!=="spiele"||!root.isConnected)return;const t=place();if(!t)return;
      const ids=Object.keys(j.boards).sort((a,b)=>j.boards[a].place-j.boards[b].place||j.boards[b].total-j.boards[a].total);
      // Plätze auf den Kacheln: bester Platz je Spiel
      const bestOf={};ids.forEach(id=>{const k=id.split(":")[0];if(!bestOf[k])bestOf[k]=id;});
      Object.keys(bestOf).forEach(k=>{const x=j.boards[bestOf[k]],tt=root.querySelector('.pz-gc[data-k="'+k+'"] .pz-gr[data-has]');if(tt)tt.innerHTML=`<button class="pz-rkb${x.place<=3?" g":""}" data-rkb="${bestOf[k]}" aria-label="Bestenliste ${esc(bname(bestOf[k]))} öffnen: Platz ${x.place} von ${x.total}">${x.place<=3?medalSvg(x.place,18):""}Platz ${x.place} von ${x.total}</button>`;});
      root.querySelectorAll("[data-rkb]").forEach(x=>x.onclick=()=>gotoTop(x.dataset.rkb));
    });
  }
  // Karte im Spiel: Top 3 der aktuellen Liste, eigener Platz, Abstand zum nächsten Platz
  function board(k,lv){if(k!==curK)return;curB=lv?k+":"+lv:k;cardUp();}
  function cardUp(){const el=root&&root.querySelector(".pz-rk3");if(!el)return;if(!curB||!rankOn()){el.hidden=true;return;}
    const id=curB,B=BOARDS[id.split(":")[0]],my=++cardSeq;
    rankLoad().then(R=>R.gameBoard(id)).then(j=>{if(my!==cardSeq||!el.isConnected||curB!==id)return;
      const f=v=>fmtV(B,v)+(B.t?"":" "+B.u),row=r=>`<li${r.me?' class="me"':""}><b>${placeIcon(r.place)}</b><span>${r.me?"Sie":esc(r.name)}</span><b>${f(r.v)}</b></li>`;
      const rows=j.top.slice(0,3).map(row);if(j.me&&j.me.place>3)rows.push(row({place:j.me.place,v:j.me.v,me:1}));
      let gap="Spielen Sie eine Runde, um in diese Liste zu kommen.";
      if(j.me){const p=j.me.place,ref=p===1?j.top[1]:j.top[p-2];
        if(p===1)gap=ref?"Sie liegen vorn, "+(B.t?ref.v-j.me.v:j.me.v-ref.v).toLocaleString("de-DE")+(B.t?" Sekunden":" "+unitN(j.me.v-ref.v,B.u))+" vor Platz 2.":"Sie führen die Liste an.";
        else if(ref){const d=B.t?j.me.v-ref.v:ref.v-j.me.v;gap="Noch "+(B.t?(d<120?d+" "+(d===1?"Sekunde":"Sekunden"):fmtT(d)+" Min."):d.toLocaleString("de-DE")+" "+unitN(d,B.u))+" bis Platz "+(p-1)+".";}
        else gap="Platz "+p+" von "+j.total+".";}
      el.innerHTML=`<div class="pz-rkh">Bestenliste · ${esc(bname(id))}</div>${rows.length?`<ol>${rows.join("")}</ol>`:""}<div class="pz-rkt">${gap}</div>`;el.hidden=false;
    }).catch(()=>{if(my===cardSeq)el.hidden=true;});}
  function hubTop(){
    if(!BOARDS[topG])topG="fahrt";const B=BOARDS[topG],g=GAMES.find(x=>x[0]===topG);if(B.lv&&!B.lv.some(l=>l[0]===topL))topL=B.lv[0][0];if(!B.lv)topL="";
    const id=topL?topG+":"+topL:topG,all=topS!=="me",wk=topS==="week",u=B.t?"Bestzeit":B.u,dd=s=>s.slice(8,10)+"."+s.slice(5,7)+".";
    const lvName=B.lv?B.lv.find(l=>l[0]===topL)[1]:"";
    const wsBtn=(a,v,on,t)=>`<button class="${on?"on":""}" data-${a}="${v}" aria-pressed="${on}">${t}</button>`;
    const scope=`<div class="pz-ws" role="group" aria-label="Wer">${wsBtn("ts","me",!all,"Ich")}${wsBtn("ts","all",all&&!wk,"Alle")}${wsBtn("ts","week",wk,"Woche")}</div>`;
    const tiles=Object.keys(BOARDS).map(k=>{const q=GAMES.find(x=>x[0]===k);return `<button class="pz-sht${k===topG?" on":""}" data-tg="${k}" aria-pressed="${k===topG}"><span class="pz-gi">${svg(q[1])}</span><span>${SHN[k]||q[2]}</span></button>`;}).join("");
    const lvs=B.lv?`<h3>Stufe</h3><div class="pz-ws" role="group" aria-label="Stufe">${B.lv.map(l=>wsBtn("tl",l[0],l[0]===topL,l[1])).join("")}</div>`:"";
    root.innerHTML=`<div class="pz-wrap pz-hub">${tabs()}<div class="m-sec pz-sec">Bestenliste</div>
    <button class="pz-pick" data-pick aria-haspopup="dialog" aria-expanded="${shOpen}"><span class="pz-gi">${svg(g[1])}</span><b>${g[2]}<small>${B.lv?"Stufe "+lvName:"Eine Liste"}</small></b><span class="pz-car" aria-hidden="true">▾</span></button>
    ${scope}
    <div class="pz-lbh"><b>${g[2]}${B.lv?" · "+lvName:""}</b><small>${wk?"Wochenwertung: nur Ergebnisse seit Montag, jeden Montag beginnt sie neu":all?(B.t?"Die schnellsten Teilnehmer, je Person die beste Zeit":"Die besten Teilnehmer, je Person das beste Ergebnis"):(B.t?"Deine zehn schnellsten Läufe, nur auf deinen Geräten":"Deine zehn besten Läufe, nur auf deinen Geräten")}</small></div><div class="pz-lbb"></div>
    <button class="pz-tile pz-lgo" data-g="${topG}"><span class="pz-tt"><b>${g[2]} spielen</b></span></button>
    <div class="pz-sh${shAnim?" pz-in":""}"${shOpen?"":" hidden"}><div class="pz-shd" data-shx></div><div class="pz-shp" role="dialog" aria-modal="true" aria-label="Spiel und Stufe wählen"><h3>Spiel</h3><div class="pz-shg">${tiles}</div>${lvs}<button class="pz-shc" data-shx>Fertig</button></div></div></div>`;
    tabsOn();
    const closeSh=()=>{shOpen=false;hubTop();const b=root.querySelector("[data-pick]");if(b)b.focus();};
    root.querySelector("[data-pick]").onclick=()=>{shOpen=true;shAnim=true;hubTop();shAnim=false;const o=document.querySelector(".pz-sh .pz-sht.on");if(o)o.focus();};
    root.querySelectorAll("[data-shx]").forEach(x=>x.onclick=closeSh);
    const sh=root.querySelector(".pz-sh");
    if(shOpen)sh.onkeydown=e=>{if(e.key==="Escape"){e.stopPropagation();closeSh();}};
    // Spiel gewählt: ohne Stufen schließt das Blatt, sonst bleibt es für die Stufe offen
    root.querySelectorAll("[data-tg]").forEach(x=>x.onclick=()=>{topG=x.dataset.tg;topL="";set("bvi_pause_topg",topG);set("bvi_pause_topl","");shOpen=!!BOARDS[topG].lv;hubTop();if(shOpen){const o=document.querySelector(".pz-sh .pz-ws[aria-label=Stufe] button.on");if(o)o.focus();}});
    root.querySelectorAll("[data-tl]").forEach(x=>x.onclick=()=>{topL=x.dataset.tl;set("bvi_pause_topl",topL);shOpen=false;hubTop();});
    root.querySelectorAll("[data-ts]").forEach(x=>x.onclick=()=>{topS=x.dataset.ts;set("bvi_pause_tops",topS);hubTop();});
    /* Das offene Fenster hängt direkt am Seitenrahmen: Die Seite läuft in einem verschobenen Container, dort würde „fixed“ nicht auf den Bildschirm zeigen und das Fenster würde wandern. */
    if(shOpen)document.body.appendChild(sh);
    root.querySelector(".pz-lgo").onclick=()=>open(topG);
    const body=root.querySelector(".pz-lbb"),msg=(t,btn)=>{body.innerHTML=`<div class="pz-card"><div class="pz-center">${t}</div>${btn||""}</div>`;};
    if(!all){const a=get(TOPKEY,{})[id];
      body.innerHTML=Array.isArray(a)&&a.length?`<ol class="pz-lb">${a.map((e,i)=>`<li><span class="pz-lr">${i+1}</span><b>${fmtV(B,e.p)}${B.t?"":" <small>"+u+"</small>"}</b><span class="pz-ld">${e.n?esc(e.n)+" · ":""}${dd(e.d)}</span></li>`).join("")}</ol>`:`<div class="pz-card"><div class="pz-center">Noch kein Eintrag. Spiele eine Runde, dann erscheint dein Ergebnis hier.</div></div>`;
      return;}
    const cur=()=>ptab==="top"&&topS!=="me"&&topG===g[0]&&(topL||"")===(B.lv?topL:"")&&body.isConnected;
    const ini=n=>String(n).trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase();
    const lav=r=>/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(r.av||"")?`<span class="rk-av" style="background-image:url(${r.av})"></span>`:`<span class="rk-av">${esc(ini(r.name))}</span>`;
    const draw=j=>{if(!cur())return;
      const val=r=>`${fmtV(B,r.v)}${B.t?"":" <small>"+u+"</small>"}`,row=r=>`<li class="pz-la${r.me?" me":""}"><span class="pz-lr">${placeIcon(r.place)}</span>${lav(r)}<b>${val(r)}</b><span class="pz-ld">${esc(r.name)}</span></li>`;
      const pod=[2,1,3].map(n=>j.top.find(r=>r.place===n)).filter(Boolean),rest=j.top.filter(r=>r.place>3);
      const step=r=>`<div class="pz-pd p${r.place}${r.me?" me":""}">${lav(r)}<span class="pz-pn">${esc(r.name)}</span><b>${val(r)}</b><div class="pz-ps"><span class="pz-pnum">${r.place}</span></div></div>`;
      body.innerHTML=(j.top.length?(pod.length?`<div class="pz-podium" role="list">${pod.map(step).join("")}</div>`:"")+(rest.length?`<ol class="pz-lb">${rest.map(row).join("")}</ol>`:""):`<div class="pz-card"><div class="pz-center">Noch niemand in dieser Liste.</div></div>`)
        +(j.me&&j.me.place>20?`<p class="pz-lbn">Dein Platz: ${j.me.place} von ${j.total} (${fmtV(B,j.me.v)})</p>`:j.me?"":`<p class="pz-lbn">Du bist hier noch nicht dabei. Spiele eine Runde.</p>`);};
    const fail=e=>{if(cur())msg(esc(e&&e.message||"Der Server ist gerade nicht erreichbar."),`<button class="pz-chip" data-retry>Erneut versuchen</button>`);const r=root.querySelector("[data-retry]");if(r)r.onclick=hubTop;};
    msg("Liste wird geladen …");
    rankLoad().then(R=>R.on()?R:R.auto().then(()=>R)).then(R=>{
      if(!R.on()){msg("Für den Vergleich mit allen nimmst du am Ranking teil. Dabei werden dein Name, dein kleines Profilbild und deine Bestwerte übertragen. Es ist freiwillig und kann jederzeit im Ranking beendet werden.",`<button class="pz-chip on" data-join>Am Ranking teilnehmen</button>`);
        const j=root.querySelector("[data-join]");if(j)j.onclick=()=>{j.disabled=true;R.join().then(()=>hubTop()).catch(e=>{j.disabled=false;fail(e);});};return;}
      return R.games(myBests(),weekObj()).catch(e=>{if(e.code===404)throw e;}).then(()=>R.gameBoard(id,wk)).then(draw);
    }).catch(fail);
  }
  const SHN={fahrt:"Einsatzfahrt",duell:"Duell",snake:"Snake",kreuzwort:"Kreuzwort",hangman:"Galgenmännchen",lueckentext:"Lückentext",reihenfolge:"Reihenfolge",g2048:"2048",tetris:"Tetris"};   // kurze Namen für das Auswahl-Blatt
  // Bestleistung als Wert + Zeile darunter (für die Karten im Pausenraum)
  function bestParts(k){const b=best()[k];if(b==null)return null;
    const lvl=(o,L)=>{const x=L.find(y=>o&&o[y[0]]!=null);return x?[fmtT(o[x[0]]),x[1]]:null;};
    if(k==='minesweeper')return lvl(b,[['sehr','Sehr schwer'],['schwer','Schwer'],['mittel','Mittel'],['leicht','Leicht']]);
    if(k==='sudoku')return lvl(b,[['schwer','Schwer'],['mittel','Mittel'],['leicht','Leicht']]);
    if(k==='mahjong'){const o=typeof b==='number'?{pyramide:b}:b;return lvl(o,[['festung','Festung'],['burg','Burg'],['pyramide','Pyramide'],['mittel','Mittel'],['leicht','Leicht']]);}
    if(k==='kreuzwort')return typeof b==='number'&&b>0?[b+' '+(b===1?'Tag':'Tage'),'Beste Serie']:null;
    if(k==='lueckentext')return [String(b),'Lücken in 60 s'];
    if(k==='reihenfolge'||k==='hangman')return [String(b),'Beste Serie'];
    return [typeof b==='number'?b.toLocaleString('de-DE'):String(b),'Punkte'];}
  /* ---------- Spiele sortieren: Knopf oben rechts, dann Kacheln per Drag & Drop verschieben (Reihenfolge wird gemerkt) ---------- */
  const OKEY='bvi_pause_order',DEF={fw:['fahrt','duell','lueckentext','reihenfolge','hangman','kreuzwort'],kl:['mahjong','sudoku','tetris','solitaer','g2048','minesweeper','snake']};
  let editing=false;
  const ordered=g=>{const sv=get(OKEY,{}),a=Array.isArray(sv[g])?sv[g].filter(k=>DEF[g].includes(k)):[];DEF[g].forEach(k=>{if(!a.includes(k))a.push(k);});return a;};
  const saveOrder=()=>{const o={};root.querySelectorAll('[data-grp]').forEach(gr=>{o[gr.dataset.grp]=[...gr.querySelectorAll('.pz-gc')].map(x=>x.dataset.k);});set(OKEY,o);};
  function syncEditBtn(){const phi=document.querySelector('#v-pause .phi');if(!phi)return;let b=phi.querySelector('.pz-sortbtn');
    if(!b){b=document.createElement('button');b.type='button';b.className='pz-sortbtn';b.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12h18M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg><span class="pz-sortok">Fertig</span>';
      b.onclick=()=>{editing=!editing;if(root&&root.isConnected&&!cur)hub();else syncEditBtn();};phi.appendChild(b);}
    b.hidden=ptab==='top';b.classList.toggle('on',editing);b.setAttribute('aria-pressed',editing);const t=editing?'Sortieren beenden':'Spiele sortieren';b.setAttribute('aria-label',t);b.title=t;}
  function dragOn(){let d=null;
    root.querySelectorAll('.pz-gc').forEach(t=>{t.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();const r=t.getBoundingClientRect();d={t,grid:t.parentNode,gx:e.clientX-r.left,gy:e.clientY-r.top,id:e.pointerId};t.classList.add('pz-drag');try{t.setPointerCapture(e.pointerId);}catch(x){}};
      t.onpointermove=e=>{if(!d||d.t!==t||e.pointerId!==d.id)return;e.preventDefault();
        t.style.pointerEvents='none';const el=document.elementFromPoint(e.clientX,e.clientY);t.style.pointerEvents='';const o=el&&el.closest&&el.closest('.pz-gc');
        if(o&&o!==t&&o.parentNode===d.grid){const kids=[...d.grid.children],after=kids.indexOf(t)<kids.indexOf(o);d.grid.insertBefore(t,after?o.nextSibling:o);}
        t.style.transform='none';const r=t.getBoundingClientRect();t.style.transform=`translate(${e.clientX-d.gx-r.left}px,${e.clientY-d.gy-r.top}px)`;};
      const end=e=>{if(!d||d.t!==t)return;t.classList.remove('pz-drag');t.style.transform='';d=null;saveOrder();};
      t.onpointerup=end;t.onpointercancel=end;});}
  function hub(){stop();if(ptab==='top')editing=false;syncEditBtn();if(ptab==='top')return hubTop();
    // Karte: Spiel starten (Tipp auf die Karte), darunter die Rang-Marke (öffnet die Bestenliste, kommt nach dem Laden)
    const tile=k=>{const g=GAMES.find(x=>x[0]===k),bp=bestParts(k),chip=bestChip(k);
      return `<div class="pz-gc${k==='fahrt'?' fw':''}" data-k="${k}"><button class="pz-gm" data-g="${k}" title="${g[3]}" aria-label="${g[2]}. ${g[3]}${chip?'. '+chip:''}"><span class="pz-gh"><span class="pz-gi">${svg(g[1])}</span><b>${g[2]}</b></span>${bp?`<span class="pz-gv">${bp[0]}<small>${bp[1]}</small></span>`:`<span class="pz-gs">${SHORT[k]}</span>`}</button><span class="pz-gr"${bp?' data-has':''}>${bp?'':'<span class="pz-gn">Noch nicht gespielt</span>'}</span></div>`;};
    root.innerHTML=`<div class="pz-wrap pz-hub${editing?' pz-edit':''}">${tabs()}<div class="m-sec pz-sec">Feuerwehr</div>
    <div class="pz-tiles pz-fw" data-grp="fw">${ordered('fw').map(k=>tile(k)).join('')}</div>
    <div class="m-sec pz-sec">Klassiker</div>
    <div class="pz-tiles pz-kl" data-grp="kl">${ordered('kl').map(k=>tile(k)).join('')}</div>
    <a class="pz-tile hero pz-sim" href="game/index.html?von=v-pause"><span class="pz-ti"><span class="pz-gi">${svg('truck')}</span></span><span class="pz-tt"><b>Simulation starten</b><small>Neun Missionen in begehbaren 3D-Welten, dazu Wiederholung, Prüfung und Wochenaufgabe</small></span></a></div>`;
    tabsOn();
    root.querySelectorAll('[data-g]').forEach(x=>x.onclick=()=>{if(!editing)open(x.dataset.g);});
    if(editing)dragOn();
    fillRank();
  }
  const LABEL={fahrt:'Prüfungsfragen',duell:'Prüfungsfragen',snake:'Geschicklichkeit',tetris:'Geschicklichkeit',g2048:'Knobelspiel',solitaer:'Kartenspiel',minesweeper:'Knobelspiel',sudoku:'Knobelspiel',mahjong:'Knobelspiel',kreuzwort:'Fachbegriffe',hangman:'Fachbegriffe',lueckentext:'Lernkarten',reihenfolge:'Wissen'};
  function open(k){const g=GAMES.find(x=>x[0]===k);if(!g)return;stop();editing=false;{const sb=document.querySelector('#v-pause .pz-sortbtn');if(sb)sb.hidden=true;}cur=g[4]();
    if(!pushed){try{history.pushState(Object.assign({},history.state,{pz:1}),'');pushed=true;}catch(e){}}
    root.innerHTML=`<div class="pz-wrap"><div class="pz-head"><button class="pz-back">‹ Alle Spiele</button><span class="pz-center" style="font-size:.78rem">${LABEL[k]||''}</span></div><div class="pz-rk3" hidden></div><div class="pz-body"></div></div>`;
    curK=k;curB=BOARDS[k]&&!BOARDS[k].lv?k:null;cardUp();
    root.querySelector('.pz-back').onclick=toHub;cur.start(root.querySelector('.pz-body'));}
  function stop(){if(cur&&cur.stop)cur.stop();cur=null;}
  function toHub(){if(pushed)history.back();else hub();}
  // Zurück (Browser, Wischgeste, Android) im Spiel: zur Spieleauswahl statt zur Startseite
  // toter pz-Eintrag (Spiel über die Navigation verlassen): beim Zurückgehen überspringen
  window.addEventListener('popstate',e=>{if(!pushed){if(history.state&&history.state.pz&&root&&root.isConnected){e.stopImmediatePropagation();try{history.back();}catch(x){}}return;}pushed=false;if(cur&&root&&root.isConnected){e.stopImmediatePropagation();hub();}},true);
  /* ---------- Einsatzfahrt-Duell: Verbindung und Lobby kommen aus js/duell.js (wird erst hier geladen) ---------- */
  const JS={};const loadJs=src=>JS[src]||(JS[src]=new Promise((ok,fail)=>{const x=document.createElement('script');x.src=src;x.onload=ok;x.onerror=()=>{delete JS[src];fail();};document.body.appendChild(x);}));
  const DUELLGAME={start(el){el.innerHTML='<div class="pz-card"><div class="pz-center">Lade Duell …</div></div>';loadJs('js/duell.js').then(()=>{if(cur===DUELLGAME&&el.isConnected)DUELL.start(el,FAHRT,loadJs);}).catch(()=>{el.innerHTML='<div class="pz-card"><div class="pz-center">Das Duell konnte nicht geladen werden. Bitte Verbindung prüfen.</div></div>';});},
    stop(){if(typeof DUELL!=='undefined')DUELL.stop();FAHRT.stop();}};
  /* ---------- weitere Spiele: je eine eigene Datei, wird erst beim Öffnen geladen ---------- */
  const lazy=(file,name,get)=>{const o={start(el){el.innerHTML='<div class="pz-card"><div class="pz-center">Lade Spiel …</div></div>';loadJs(file).then(()=>{if(cur===o&&el.isConnected)get().start(el,FAHRT);}).catch(()=>{el.innerHTML='<div class="pz-card"><div class="pz-center">Das Spiel konnte nicht geladen werden. Bitte Verbindung prüfen.</div></div>';});},
    stop(){try{const g=get();if(g&&g.stop)g.stop();}catch(e){}}};return o;};
  const KWGAME=lazy('js/kreuzwort.js','KREUZWORT',()=>KREUZWORT);
  const SUGAME=lazy('js/sudoku.js','SUDOKU',()=>SUDOKU);
  const HMGAME=lazy('js/hangman.js','HANGMAN',()=>HANGMAN);
  const LTGAME=lazy('js/lueckentext.js','LUECKENTEXT',()=>LUECKENTEXT);
  const RFGAME=lazy('js/reihenfolge.js','REIHENFOLGE',()=>REIHENFOLGE);
  const G48GAME=lazy('js/g2048.js','G2048',()=>G2048);
  const TTGAME=lazy('js/tetris.js','TETRIS',()=>TETRIS);
  const MJGAME=lazy('js/mahjong.js','MAHJONG',()=>MAHJONG);
  /* ---------- Einsatzleitung-Snake: Spielcode kommt aus js/snake.js (wird erst hier geladen) ---------- */
  /* ---------- Minesweeper: Spielcode kommt aus js/minesweeper.js (wird erst hier geladen) ---------- */
  const MSGAME={start(el){el.innerHTML='<div class="pz-card"><div class="pz-center">Lade Spiel …</div></div>';loadJs('js/minesweeper.js').then(()=>{if(cur===MSGAME&&el.isConnected)MINESWEEPER.start(el);}).catch(()=>{el.innerHTML='<div class="pz-card"><div class="pz-center">Das Spiel konnte nicht geladen werden. Bitte Verbindung prüfen.</div></div>';});},
    stop(){if(typeof MINESWEEPER!=='undefined')MINESWEEPER.stop();}};
  const SNAKEGAME={start(el){el.innerHTML='<div class="pz-card"><div class="pz-center">Lade Spiel …</div></div>';loadJs('js/snake.js').then(()=>{if(cur===SNAKEGAME&&el.isConnected)SNAKE.start(el);}).catch(()=>{el.innerHTML='<div class="pz-card"><div class="pz-center">Das Spiel konnte nicht geladen werden. Bitte Verbindung prüfen.</div></div>';});},
    stop(){if(typeof SNAKE!=='undefined')SNAKE.stop();}};
  /* ---------- Solitär: Spielcode kommt aus js/solitaer.js (wird erst hier geladen) ---------- */
  const SOLGAME={start(el){el.innerHTML='<div class="pz-card"><div class="pz-center">Lade Spiel …</div></div>';loadJs('js/solitaer.js').then(()=>{if(cur===SOLGAME&&el.isConnected)SOLITAER.start(el);}).catch(()=>{el.innerHTML='<div class="pz-card"><div class="pz-center">Das Spiel konnte nicht geladen werden. Bitte Verbindung prüfen.</div></div>';});},
    stop(){if(typeof SOLITAER!=='undefined')SOLITAER.stop();}};
  /* ---------- 6 Einsatzfahrt (Prüfungsfragen) ---------- */
  const FAHRT=(function(){
    const HF=480,hf=()=>(st&&st.hf)||HF,ALLM=[['IBK','Transaktionsanalyse · Konflikte','ibk'],['VAk','Verwaltungsrecht','vak'],['FeuAK','Haushalt · Management','feuak'],['IdF','Brandschutz · Stab','idf']],MODS=[];
    // Einsatzfahrt: Anzahl der Fragen wie beim Duell (5, 10 oder 15); Fahrzeit und Hilfsfrist wachsen mit der Anzahl
    const errOk=n=>{ const r=routeFor(n); return Math.max(0,Math.floor((hfFor(n)-r.base+r.bon*n)/(r.pen+r.bon))); };   // so viele Fehler sind erlaubt, bevor die Hilfsfrist reißt
    const errTxt=n=>{ const a=errOk(n); return (a===0?'Kein Fehler erlaubt':a+' Fehler erlaubt')+' · ab dem '+(a+1)+'. Fehler kommst du zu spät'; };
    const COUNTS=[5,10,15],routeFor=n=>({key:String(n),name:n+' Fragen',base:60*(n+1),pen:30,bon:5,n}),hfFor=n=>60*(n+1)+30;
    const fmt=t=>{t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};
    const strip=h=>{const d=document.createElement('div');d.innerHTML=String(h||'');return d.textContent.replace(/\s+/g,' ').trim();};
    let Q=null;
    // Fragen: VAk und IdF aus den Altklausur-Quizzen der App, FeuAK und IBK aus pause-data.js; leuchtende Tabs (g) zählen dreifach
    // Module: nur Reiter mit „Glow“ (klausurrelevant); „Laufbahn“ nur mit eigenen Fragen
    // Module: nur die, für die es Laufbahn-Fragen gibt (Glow-Tabs spielen hier keine Rolle mehr)
    function refreshMods(){const qs=questions();MODS.length=0;ALLM.forEach(([m,d])=>{if(qs.some(q=>q.m===m))MODS.push([m,d]);});if(qs.some(q=>q.m==='Laufbahn'))MODS.push(['Laufbahn','Eigene Fragen']);return MODS;}
    let Qv=-1;
    function questions(){const v=typeof JG!=='undefined'?JG.ver():0;if(Q&&Qv===v)return Q;Qv=v;Q=[];
      const own=(D.exam||[]).some(q=>q.m==='VAk'||q.m==='IdF'); // überarbeitete Fragen aus pause-data.js haben Vorrang
      const vq=own?[]:typeof QUIZ!=='undefined'&&QUIZ.qs?QUIZ.qs():[];
      vq.filter(q=>q.type==='mc').forEach(q=>Q.push({m:'VAk',src:'Altklausur-Quiz VAk',g:1,q:strip(q.q),o:q.opts.map(strip),c:q.correct,e:strip(q.exp)}));
      (!own&&typeof IDF_QUIZ_Q!=='undefined'?IDF_QUIZ_Q:[]).forEach(q=>{
        if(q.type==='mc')Q.push({m:'IdF',src:'Altklausur-Quiz IdF',g:1,q:strip(q.q),o:q.opts.map(strip),c:q.correct,e:strip(q.exp)});
        else if(q.type==='multi'){const wr=q.opts.map((_,i)=>i).filter(i=>!q.correct.includes(i));if(!wr.length)return;const ci=rnd(q.correct),sel=[ci,...wr.slice(0,3)];Q.push({m:'IdF',src:'Altklausur-Quiz IdF',g:1,q:strip(q.q).replace(/Welche Aussagen? (sind|ist) (richtig|zutreffend)\??/i,'Welche Aussage ist richtig?'),o:sel.map(i=>strip(q.opts[i])),c:0,e:strip(q.exp)});}});
      (D.exam||[]).forEach(q=>Q.push(q));
      // eigene Prüfungen aus den Jahrgangs-Änderungen (nur Einzelspiel; im Duell zählen nur die mitgelieferten Fragen)
      if(typeof JG!=='undefined')JG.data().pr.hinzu.forEach(p=>{const t=JG.TABS.find(x=>x[0]===p.tab);if(t)p.fragen.forEach(f=>{ if((f.typ||'sc')==='sc') Q.push({m:t[2],src:p.titel,g:1,q:f.q,o:f.o.slice(),c:f.c,e:f.e||'',custom:1}); });});
      // Fragen aus Prüfungen, die nicht klausurrelevant sind, fallen heraus
      if(typeof JG!=='undefined'){const SRC={'Altklausur-Quiz VAk':'v-vak-altklausur','Altklausur-Quiz IdF':'v-idf-altklausur'};JG.data().pr.hinzu.forEach(p=>SRC[p.titel]=p.seite||p.id);Q=Q.filter(q=>!SRC[q.src]||JG.rel(SRC[q.src]));}
      // Lernkarten der Laufbahnprüfung als Auswahlfragen: richtige Antwort = Kartenrückseite, falsche = Rückseiten anderer Karten desselben Moduls
      // (alle Laufbahn-Karten; Reihenfolge fest, damit beim Duell beide dieselben Fragen sehen; eigene Karten bleiben außen vor)
      if(typeof FLASHCARD_DATA!=='undefined'){
        const MOD={'heyrothsberge':'IBK','recht':'VAk','management':'FeuAK','vorbeugender brandschutz':'IdF','stabsarbeit':'IdF','führungsvorgang':'IdF'};
        const by={};
        FLASHCARD_DATA.forEach(c=>{if(c.own||!/^Laufbahn · /i.test(c.cat))return;const m=MOD[c.cat.split(' · ')[1].toLowerCase()];if(!m)return;const a=strip(c.a);if(a.length<20)return;(by[m]=by[m]||[]).push({id:c.id,q:strip(c.q),a});});
        Object.keys(by).forEach(m=>{const L=by[m];if(L.length<4)return;L.forEach((c,i)=>{
          const wr=[];for(let k=1;wr.length<3&&k<L.length;k+=Math.max(1,Math.floor(L.length/4))){const o=L[(i+k)%L.length];if(o.a!==c.a&&!wr.includes(o.a))wr.push(o.a);}
          if(wr.length<3)return;const pos=i%4,o=wr.slice();o.splice(pos,0,c.a);
          Q.push({m,src:'Laufbahn-Lernkarten',g:1,q:c.q,o,c:pos,e:c.a});});});
      }
      // Einsatzfahrt und Duell: nur Fragen aus der Laufbahnprüfung (VB und Stabsarbeit laufen unter „IdF“)
      Q=Q.filter(q=>q.m==='Laufbahn'||q.src==='Laufbahn-Lernkarten');
      return Q;}
    const baseQuestions=()=>questions().filter(q=>!q.custom);
    let sel=new Set(get('bvi_pause_mods',['VAk','IBK'])),st=null,el=null,cv=null,ctx=null,raf=0,PART=[],last=0,shake=0,lastFx=null,stars=[];
    const count=(m,all)=>(all?questions():baseQuestions()).filter(q=>q.m===m).length;
    function pick(r){refreshMods();const pool=questions().filter(q=>sel.has(q.m)&&MODS.some(x=>x[0]===q.m)),bag=[];pool.forEach(q=>{for(let k=0;k<(q.g?3:1);k++)bag.push(q);});const out=[];while(out.length<r.n&&bag.length){const q=bag.splice(Math.floor(Math.random()*bag.length),1)[0];if(!out.includes(q))out.push(q);}
      return out.map(q=>{const ord=shuf(q.o.map((_,i)=>i));return{...q,o:ord.map(i=>q.o[i]),c:ord.indexOf(q.c)};});}
    const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};
    // Duell: aus Seed, Modulen und Anzahl entstehen auf beiden Geräten dieselben Fragen in derselben Reihenfolge
    function pickSeeded(mods,n,seed,cu){const R=rng(seed),bag=[];duelPool(cu).filter(q=>mods.includes(q.m)).forEach(q=>{for(let k=0;k<(q.g?3:1);k++)bag.push(q);});const out=[];while(out.length<n&&bag.length){const q=bag.splice(Math.floor(R()*bag.length),1)[0];if(!out.includes(q))out.push(q);}
      return out.map(q=>{const ord=q.o.map((_,i)=>i);for(let i=ord.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[ord[i],ord[j]]=[ord[j],ord[i]];}return{...q,o:ord.map(i=>q.o[i]),c:ord.indexOf(q.c)};});}
    const hash=x=>{let h=5381;for(let i=0;i<x.length;i++)h=((h<<5)+h+x.charCodeAt(i))|0;return(h>>>0).toString(36);};
    const sig=()=>hash(baseQuestions().map(q=>q.m+q.q.length+q.o.length).join('|'));   // Stand der mitgelieferten Fragen
    // Eigene Fragen des Jahrgangs zählen im Duell nur, wenn beide genau dieselben haben (Fingerabdruck wird beim Verbinden verglichen)
    const ck=q=>hash([q.m,q.q,q.o.join('\u0001'),q.c].join('\u0002'));
    const customSorted=()=>questions().filter(q=>q.custom).sort((a,b)=>{const x=ck(a),y=ck(b);return x<y?-1:x>y?1:0;});
    const csig=()=>{const c=customSorted();return c.length?hash(c.map(ck).join('|')):'';};
    const duelPool=cu=>cu?baseQuestions().concat(customSorted()):baseQuestions();
    let SESS=null,SESS_NEXT=null;
    function newGame(){st={phase:'select',p:0,t:0,qs:[],qi:0,route:null,res:[],fx:null,fxT:0,lvl:0};PART=[];panel();}
    function panel(){const pn=el.querySelector('.pz-fp'),s=st,L='ABCDE';let h='';
      if(s.paused){h=`<div class="pz-lbl"><span>Duell</span><b>pausiert</b></div><div class="pz-qt">Verbindung unterbrochen</div><div class="pz-fb">Das Spiel steht still. Kommt ${esc(s.opp.name)} nicht innerhalb von <b class="pz-pc">${Math.max(0,30-Math.floor((performance.now()-s.pausedAt)/1000))}</b> Sekunden zurück, gewinnst du.</div>`;}
      else if(s.phase==='d-count'){h=`<div class="pz-lbl"><span>Duell gegen ${esc(s.opp.name)}</span><b>${s.qs.length} Fragen</b></div><div class="pz-big-n">${Math.max(1,s.cdLeft)}</div><div class="pz-center">Gleich geht es los. Gleiche Fragen, gleiche Strecke.</div>`;}
      else if(s.phase==='select'){h=`<div class="pz-lbl"><span>Einsatzfahrt</span></div><div class="pz-qt">Aus welchen Modulen sollen die Fragen kommen?</div>${refreshMods().length?'':'<div class="pz-fb">Noch keine Laufbahn-Fragen vorhanden.</div>'}<div class="pz-chips">${MODS.map(([m,d])=>`<button class="pz-chip${sel.has(m)?' on':''}" data-a="tog" data-v="${m}"><b>${m}</b><small>${d}<br>${count(m,1)} Prüfungsfragen</small></button>`).join('')}</div><button class="pz-pri" data-a="route" ${MODS.some(x=>sel.has(x[0]))?'':'disabled'}>Weiter: Einsatzmeldung</button>`;}
      else if(s.phase==='route'){const pool=questions().filter(q=>sel.has(q.m)&&MODS.some(x=>x[0]===q.m)).length;h=`<div class="pz-lbl"><span>Alarm · Einsatzmeldung</span></div><div class="pz-qt">Feuer 2 · Wohnungsbrand, Musterstraße 12, Person vermisst</div><div class="pz-qt" style="font-size:.95rem;font-weight:500">Wie viele Fragen willst du auf der Anfahrt beantworten?</div>${COUNTS.map(n=>`<button class="pz-route" data-a="go" data-v="${n}" ${pool<n?'disabled':''}><b>${n} Fragen</b><div class="pz-rl">${pool<n?'nur '+pool+' Fragen verfügbar':errTxt(n)}</div></div></button>`).join('')}<button class="pz-sec2" data-a="sel" style="align-self:flex-start">‹ Module</button>`;}
      else if(s.phase==='drive'){h=`<div class="pz-lbl"><span>Einsatzfahrt · ${s.route.name}</span><b>${s.qi<s.qs.length?'Frage '+(s.qi+1)+'/'+s.qs.length:'Gleich da'}</b></div><div class="pz-drv"><i></i><span>Sondersignal · Status 3</span></div>`;}
      else if(s.phase==='ask'||s.phase==='fb'){const q=s.qs[s.qi];h=`<div class="pz-lbl"><span>${esc(q.m)} · ${esc(q.src)}</span><b>${s.qi+1}/${s.qs.length}</b></div>${s.duel?'<div class="pz-tmr"><i></i></div>':''}<div class="pz-qt">${esc(q.q)}</div>${q.o.map((o,i)=>{let c='';if(s.phase==='fb')c=i===q.c?' ok':i===s.pick?' bad':' dim';return`<button class="pz-opt${c}" data-a="ans" data-v="${i}" ${s.phase==='fb'?'disabled':''}><i>${L[i]}</i><span>${esc(o)}</span></button>`;}).join('')}`;
        if(s.phase==='fb'){const ok=s.res[s.res.length-1].ok;h+=`<div class="pz-fb ${ok?'g':'r'}"><b>${ok?'Richtig · freie Fahrt ('+s.dt+' s)':(s.pick<0?'Zeit abgelaufen · ':'Falsch · ')+'Stau auf der Strecke'+' (+'+s.dt+' s)'}</b>${q.e?'<br>'+esc(q.e):''}</div><button class="pz-pri" data-a="next">${s.qi+1<s.qs.length?'Weiterfahren':'Zur Einsatzstelle'}</button>`;}}
      else if(s.duel&&s.forfeit&&s.res.length<s.qs.length){h=`<div class="pz-lbl"><span>Duell beendet</span><b>Sieg durch Aufgabe</b></div><div class="pz-qt" style="font-size:1.2rem">${esc(s.opp.name)} hat aufgegeben. Du gewinnst.</div>${s.bil?`<div class="pz-fb">Bilanz gegen ${esc(s.opp.name)}: <b>${s.bil.w} : ${s.bil.l}</b>${s.bil.d?' · '+s.bil.d+' unentschieden':''}</div>`:''}<button class="pz-sec2" data-a="leave" style="align-self:flex-start">Zur Spieleauswahl</button>`;}
      else if(s.duel){const me=duelRes(s),op=s.opp.done;const right=me.right;h=`<div class="pz-lbl"><span>Status 4 · am Einsatzort</span><b>${me.score} Punkte</b></div>${op?`<div class="pz-qt" style="font-size:1.2rem">${s.forfeit?esc(s.opp.name)+' hat aufgegeben. Du gewinnst.':me.result==='w'?'Du gewinnst!':me.result==='l'?esc(s.opp.name)+' gewinnt.':'Unentschieden'}</div>
          <table class="pz-vs"><tr><th></th><th>Du</th><th>${esc(s.opp.name)}</th></tr><tr><td>Punkte</td><td>${me.score}</td><td>${op.score}</td></tr><tr><td>Richtig</td><td>${right}/${s.qs.length}</td><td>${op.right}/${s.qs.length}</td></tr><tr><td>Eintreffzeit</td><td>${fmt(s.t)}</td><td>${s.forfeit?'–':fmt(op.t)}</td></tr><tr><td>Hilfsfrist ${fmt(hf())}</td><td>${s.win?'eingehalten':'überschritten'}</td><td>${s.forfeit?'–':op.t<=hf()?'eingehalten':'überschritten'}</td></tr></table>
          ${s.bil?`<div class="pz-fb">Bilanz gegen ${esc(s.opp.name)}: <b>${s.bil.w} : ${s.bil.l}</b>${s.bil.d?' · '+s.bil.d+' unentschieden':''}</div>`:''}${s.res.some(r=>!r.ok)?`<div class="pz-lbl"><span>Zum Nacharbeiten</span></div><ul class="pz-res">${s.res.filter(r=>!r.ok).map(r=>`<li>${esc(r.q.q)}<br><small>Richtig: ${esc(r.q.o[r.q.c])}</small></li>`).join('')}</ul>`:''}${s.opp.gone?'':`<button class="pz-pri" data-a="rematch" ${s.rm?'disabled':''}>${s.rm?'Warte auf Zustimmung …':s.opp.rm?esc(s.opp.name)+' will Revanche · Annehmen':'Revanche'}</button>`}<button class="pz-sec2" data-a="leave" style="align-self:flex-start">Duell beenden</button>`:`<div class="pz-qt" style="font-size:1.1rem">Geschafft: ${fmt(s.t)} · ${right}/${s.qs.length} richtig</div><div class="pz-fb">Warte auf ${esc(s.opp.name)} (${s.opp.res.length}/${s.qs.length} Fragen) …</div><div class="pz-drv"><i></i><span>${esc(s.opp.name)} fährt noch</span></div>`}`;}
      else{const right=s.res.filter(r=>r.ok).length,rec=saveBest('fahrt',s.score);h=`<div class="pz-lbl"><span>Status 4 · am Einsatzort</span><b>${s.score} Punkte</b></div><div class="pz-qt" style="font-size:1.15rem">${s.win?'Hilfsfrist eingehalten':'Hilfsfrist überschritten'}</div><div class="pz-fb">Eintreffzeit <b>${fmt(s.t)}</b> · ${right}/${s.res.length} richtig · Route ${s.route.name}${rec?' · neuer Bestwert':''}</div>${s.res.some(r=>!r.ok)?`<div class="pz-lbl"><span>Zum Nacharbeiten</span></div><ul class="pz-res">${s.res.filter(r=>!r.ok).map(r=>`<li>${esc(r.q.q)}<br><small>Richtig: ${esc(r.q.o[r.q.c])}</small></li>`).join('')}</ul>`:''}<button class="pz-pri" data-a="new">Neuer Einsatz</button>`;}
      pn.innerHTML=h;}
    function act(a,v){const s=st;
      if(a==='tog'){sel.has(v)?sel.delete(v):sel.add(v);set('bvi_pause_mods',[...sel]);panel();}
      else if(a==='route'){if(MODS.some(x=>sel.has(x[0]))){s.phase='route';panel();}}
      else if(a==='sel'){s.phase='select';panel();}
      else if(a==='go'){const n=+v;s.route=routeFor(n);s.hf=hfFor(n);s.qs=pick(s.route);s.stops=s.qs.map((_,i)=>(i+1)/(s.qs.length+1));drive();}
      else if(a==='ans'){if(s.phase!=='ask')return;const i=+v,q=s.qs[s.qi],ok=i===q.c;say(ok?'Richtig':(i<0?'Zeit abgelaufen':'Falsch'));s.phase='fb';s.pick=i;s.fx=ok?'ok':'bad';s.fxT=performance.now();s.dt=ok?-s.route.bon:s.route.pen;s.t+=s.dt;s.res.push({q,ok});if(s.duel)SESS.send({t:'a',ok});panel();}
      else if(a==='next'){s.qi++;drive();}
      else if(a==='new')newGame();
      else if(a==='rematch'&&s.duel){s.rm=true;SESS.send({t:'rematch'});panel();if(s.opp.rm)SESS.rematch();}
      else if(a==='leave'&&s.duel){PAUSE.back();}}
    function drive(){const s=st,to=s.qi<s.qs.length?s.stops[s.qi]:1;if(s.duel)SESS.send({t:'p',to,tt:s.t});s.phase='drive';s.dr={from:s.p,to,t0:performance.now(),dur:1900,tt:s.t};panel();}
    function duelRes(s){const right=s.res.filter(r=>r.ok).length,score=right*100+(s.win?300:0),op=s.opp.done;let result=null;if(op){result=s.forfeit?'w':score>op.score?'w':score<op.score?'l':s.t<op.t?'w':s.t>op.t?'l':'d';}return{right,score,result};}
    function duelFinish(){const s=st;s.sentFin=true;const r=duelRes(s);addScore('duell',r.score);SESS.send({t:'fin',tm:s.t,score:r.score,right:r.right});if(typeof GAME!=='undefined')GAME.cheer('spiel','Duell');duelCheck();}
    function duelCheck(){const s=st;if(!s||!s.duel||s.bilDone||s.phase!=='end'||!s.opp.done)return;s.bilDone=true;const r=duelRes(s);s.bil=SESS.record(s.opp.name,r.result);panel();}
    function tick(n){const s=st;const dtp=n-(s._ln||n);s._ln=n;
      if(s.paused){if(s.dr)s.dr.t0+=dtp;if(s.askT0)s.askT0+=dtp;if(s.fbT0)s.fbT0+=dtp;const e=document.querySelector('.pz-pc');if(e)e.textContent=Math.max(0,30-Math.floor((performance.now()-s.pausedAt)/1000));return;}
      if(s.opp){const o=s.opp;o.p+=(o.tp-o.p)*Math.min(1,dtp/1000*2.2);}
      if(s.phase==='d-count'){const left=3-Math.floor((n-s.cd0)/1000);if(left!==s.cdLeft){s.cdLeft=left;if(left<=0){drive();}else panel();}return;}
      if(s.duel&&s.phase==='ask'){const el_=n-s.askT0,tm=document.querySelector('.pz-tmr i');if(tm)tm.style.width=Math.max(0,100-el_/300)+'%';if(el_>=30000){act('ans','-1');}}
      if(s.duel&&s.phase==='fb'){if(!s.fbT0)s.fbT0=n;else if(n-s.fbT0>=15000){s.fbT0=0;act('next');return;}}else s.fbT0=0; // Gegner nicht beliebig aufhalten: nach ~15 s weiter
      if(s.phase==='drive'){const d=s.dr,k=Math.min(1,(n-d.t0)/d.dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;s.p=d.from+(d.to-d.from)*e;s.t=d.tt+s.route.base*(s.p-d.from);
        if(k>=1){if(s.qi<s.qs.length){s.phase='ask';s.askT0=performance.now();panel();}else{s.phase='end';s.p=1;s.win=s.t<=hf();if(typeof GAME!=='undefined')GAME.event('fahrt',s.win);const right=s.res.filter(r=>r.ok).length;s.score=Math.max(0,Math.round((s.win?1000+(hf()-s.t)*3:0)+right*50));if(!s.duel)addScore('fahrt',s.score);panel();if(s.duel)duelFinish();}}}
      if(s.fx&&n-s.fxT>1500)s.fx=null;const tg=s.phase==='end'&&s.win?0:Math.min(1.3,s.t/hf());s.lvl+=(tg-s.lvl)*(s.phase==='end'&&s.win?.02:.08);}
    // Szene „Glut“: Nachtszene mit Partikelfeuer, Brand wächst mit der Zeit
    const W=360,H=300,hy=78,hw=120,hh=132;let hx=205,WIN=[];
    // Einzelspiel: Haus rechts, Straße von links. Duell: Haus in der Mitte, Spieler 1 fährt von links, Spieler 2 von rechts
    function layout(d){hx=d?(W-hw)/2:205;WIN=[];for(let j=0;j<3;j++)for(let i=0;i<3;i++)WIN.push({x:hx+16+i*36,y:hy+18+j*38,w:22,h:26,o:[4,3,5,7,1,6,0,8,2].indexOf(j*3+i)});}layout(false);
    const PAL=[['#ff4b3a','#a8141a','Rot'],['#5aa0ff','#1b4fb0','Blau'],['#ffd24a','#b8860b','Gelb'],['#4ade80','#15803d','Grün'],['#ffa31a','#b45309','Orange'],['#f1f5f9','#8a96a8','Weiß']];
    const roadD=(side,t)=>{const x0=side==='L'?-10:W+10,x1=side==='L'?hx-8:hx+hw+8;return[x0+(x1-x0)*t,268-Math.sin(t*Math.PI)*28-t*8];};
    const road=t=>[-10+t*215,268-Math.sin(t*Math.PI)*28-t*8];
    let SP=null;
    function sprites(){const mk=col=>{const s=document.createElement('canvas');s.width=s.height=64;const g=s.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return s;};
      return{F:mk('rgba(255,170,60,1)'),R:mk('rgba(255,70,20,1)'),B:mk('rgba(70,160,255,1)'),S:mk('rgba(120,120,135,.55)'),G:mk('rgba(80,230,150,1)'),W:mk('rgba(140,200,255,.9)')};}
    const emit=(x,y,spr,vx,vy,life,size,add)=>{if(PART.length<(RM?70:360))PART.push({x,y,vx,vy,life,l0:life,size,spr,add});};
    function truck(c,x,y,a,flip,col,n){c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.rotate(a);c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,4,24,5,0,0,7);c.fill();const g=c.createLinearGradient(0,-16,0,2);g.addColorStop(0,col[0]);g.addColorStop(1,col[1]);c.fillStyle=g;c.fillRect(-22,-15,44,14);c.fillStyle='#e9eef8';c.fillRect(-22,-8,32,2);c.fillStyle='#9fd3ff';c.fillRect(10,-13,9,6);c.fillStyle='#111';[-13,12].forEach(x=>{c.beginPath();c.arc(x,0,4,0,7);c.fill();});
      const bl=Math.floor(n/130)%2;c.globalCompositeOperation='lighter';c.drawImage(SP.B,(bl?-4:6)-18,-34,36,36);c.globalCompositeOperation='source-over';c.fillStyle=bl?'#5ab4ff':'#cfe8ff';c.fillRect(-5,-18,12,3);c.restore();}
    // Position und Richtung eines Fahrzeugs auf seiner Straße (von rechts fahrende Fahrzeuge werden gespiegelt)
    function pose(r,p){const[x,y]=r(p),[x2,y2]=r(Math.min(1,p+.01)),flip=x2<x;return{x,y,flip,a:flip?Math.atan2(y2-y,-(x2-x)):Math.atan2(y2-y,x2-x)};}
    function frame(n){const c=ctx,s=st,dt=Math.min(.05,(n-(last||n))/1000);last=n;tick(n);const lvl=s.lvl;
      const myS=SESS&&SESS.side||'L',opS=myS==='L'?'R':'L',rO=s.duel?(t=>roadD(myS,t)):road,rP=s.duel?(t=>roadD(opS,t)):null,myC=s.duel?PAL[SESS.myCol]||PAL[0]:PAL[0],opC=s.duel?PAL[SESS.oppCol]||PAL[1]:PAL[1],dir=myS==='R'&&s.duel?-1:1;
      if(s.fx!==lastFx){if(s.fx==='bad'&&!RM)shake=.5;if(s.fx){const[x,y]=rO(s.p);for(let i=0;i<36;i++){const a=Math.random()*7,v=60+Math.random()*80;emit(x,y-10,s.fx==='ok'?SP.G:SP.R,Math.cos(a)*v,Math.sin(a)*v,.6,10,1);}}lastFx=s.fx;}
      shake=Math.max(0,shake-dt);c.save();if(shake)c.translate((Math.random()-.5)*8*shake,(Math.random()-.5)*8*shake);
      const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#070b18');sky.addColorStop(.6,`rgb(${30+lvl*90|0},${18+lvl*20|0},40)`);sky.addColorStop(1,'#120d16');c.fillStyle=sky;c.fillRect(-10,-10,W+20,H+20);
      stars.forEach(([x,y,b])=>{c.fillStyle=`rgba(255,255,255,${.25+.5*b*(1-lvl*.6)})`;c.fillRect(x,y,1.2,1.2);});
      c.fillStyle='#0d0f1c';for(let i=0;i<9;i++){const bh=40+((i*53)%50);c.fillRect(i*42-6,205-bh,36,bh+10);}
      const gl=c.createRadialGradient(hx+hw/2,hy+60,10,hx+hw/2,hy+60,220);gl.addColorStop(0,`rgba(255,110,40,${.35*lvl})`);gl.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gl;c.fillRect(0,0,W,H);
      c.fillStyle='#161a26';c.fillRect(-10,212,W+20,100);
      (s.duel?[rO,rP]:[rO]).forEach((r,k)=>{c.strokeStyle='rgba(255,163,26,.18)';c.lineWidth=22;c.lineCap='round';c.beginPath();for(let t=0;t<=1.001;t+=.05){const[x,y]=r(t);t?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.strokeStyle='#232838';c.lineWidth=16;c.stroke();
        const col=k?opC[0]:'rgba(255,163,26,.9)',pp=k?s.opp.p:s.p;c.strokeStyle=k?opC[0]+'99':col;c.lineWidth=2;c.setLineDash([6,8]);c.beginPath();for(let t=0;t<=pp+.001;t+=.02){const[x,y]=r(Math.min(t,pp));t?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.setLineDash([]);});
      const hg=c.createLinearGradient(hx,hy,hx+hw,hy+hh);hg.addColorStop(0,'#2a3044');hg.addColorStop(1,'#1b1f2d');c.fillStyle=hg;c.fillRect(hx,hy,hw,hh);c.fillStyle='#232839';c.beginPath();c.moveTo(hx-6,hy);c.lineTo(hx+hw+6,hy);c.lineTo(hx+hw-10,hy-14);c.lineTo(hx+10,hy-14);c.fill();
      const out=s.phase==='end'&&s.win;
      WIN.forEach(w=>{const on=w.o<lvl*9,k=Math.min(1,lvl*9-w.o);if(on){const f=.75+Math.sin(n/80+w.o)*.15,g=c.createLinearGradient(0,w.y,0,w.y+w.h);g.addColorStop(0,`rgba(255,${200*f|0},80,${k})`);g.addColorStop(1,`rgba(255,80,20,${k})`);c.fillStyle=g;c.fillRect(w.x,w.y,w.w,w.h);
          if(Math.random()<.5*k*(out?.3:1))emit(w.x+w.w/2+(Math.random()-.5)*w.w,w.y+4,Math.random()<.5?SP.F:SP.R,(Math.random()-.5)*12,-30-Math.random()*40,.7+Math.random()*.6,10+Math.random()*10,1);
          if(Math.random()<.12*k)emit(w.x+w.w/2,w.y,SP.S,(Math.random()-.5)*10+6,-22,2.6,22,0);}
        else{c.fillStyle='#10131d';c.fillRect(w.x,w.y,w.w,w.h);c.fillStyle='rgba(120,160,255,.08)';c.fillRect(w.x,w.y,w.w,w.h/2);}});
      if(lvl>.75&&Math.random()<lvl*.7)emit(hx+20+Math.random()*(hw-40),hy-12,SP.F,(Math.random()-.5)*14,-50-Math.random()*40,.9,16,1);
      const me_=pose(rO,s.p),cx=me_.x,cy=me_.y;
      if(out)for(let i=0;i<4;i++)emit(cx+10*dir,cy-14,SP.W,dir*(150+Math.random()*40),-160-Math.random()*40,.9,9,1);
      for(let i=PART.length-1;i>=0;i--){const p=PART[i];p.life-=dt;if(p.life<=0){PART.splice(i,1);continue;}if(p.spr===SP.W)p.vy+=260*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const a=p.life/p.l0,sz=p.size*(p.add?a+.3:2-a);c.globalAlpha=p.add?a:a*.8;c.globalCompositeOperation=p.add?'lighter':'source-over';c.drawImage(p.spr,p.x-sz,p.y-sz,sz*2,sz*2);}
      c.globalAlpha=1;c.globalCompositeOperation='source-over';
      if(s.opp){const o_=pose(rP,s.opp.p);truck(c,o_.x,o_.y,o_.a,o_.flip,opC,n);c.fillStyle=opC[0];c.font='700 9px system-ui,sans-serif';c.textAlign='center';c.fillText(s.opp.name.slice(0,13),o_.x,o_.y+30);c.textAlign='left';}
      truck(c,me_.x,me_.y,me_.a,me_.flip,myC,n);
      if(s.duel){c.fillStyle=myC[0];c.font='700 9px system-ui,sans-serif';c.textAlign='center';c.fillText('Du',me_.x,me_.y+30);c.textAlign='left';}
      if(s.fx==='bad'){const v=c.createRadialGradient(W/2,H/2,80,W/2,H/2,240);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(239,60,60,.45)');c.fillStyle=v;c.fillRect(0,0,W,H);}
      c.restore();
      const over=s.t>hf();c.fillStyle='rgba(255,255,255,.07)';c.strokeStyle='rgba(255,255,255,.14)';c.beginPath();c.rect(10,10,128,46);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.55)';c.font='600 9px system-ui,sans-serif';c.fillText('EINTREFFZEIT',22,26);c.fillStyle=over?'#ff7a6a':'#fff';c.font='800 21px system-ui,sans-serif';c.fillText(fmt(s.t),22,48);c.fillStyle='rgba(255,255,255,.45)';c.font='600 11px system-ui,sans-serif';c.fillText('/ '+fmt(hf()),82,48);
      c.lineWidth=5;c.strokeStyle='rgba(255,255,255,.12)';c.beginPath();c.arc(W-34,34,20,0,7);c.stroke();c.strokeStyle=lvl>=1?'#ff4a3a':'#ffa31a';c.lineCap='round';c.beginPath();c.arc(W-34,34,20,-Math.PI/2,-Math.PI/2+Math.min(1,lvl)*Math.PI*2);c.stroke();c.fillStyle='#fff';c.font='800 11px system-ui,sans-serif';c.textAlign='center';c.fillText(Math.round(Math.min(1,lvl)*100)+'%',W-34,38);c.font='600 7px system-ui,sans-serif';c.fillStyle='rgba(255,255,255,.55)';c.fillText('BRAND',W-34,66);
      if(s.duel){const n_=s.qs.length,row=(y,label,res,col)=>{c.fillStyle=col;c.font='700 8px system-ui,sans-serif';c.fillText(label,10,y+3);for(let i=0;i<n_;i++){const r=res[i];c.fillStyle=r===undefined?'rgba(255,255,255,.25)':r?'#3fdf8f':'#ff5a4a';c.beginPath();c.arc(44+i*9,y,3,0,7);c.fill();}};row(66,'DU',s.res.map(r=>r.ok),myC[0]);row(78,s.opp.name.slice(0,6).toUpperCase(),s.opp.res,opC[0]);c.fillStyle=opC[0];c.beginPath();c.moveTo(20+(W-40)*s.opp.p,H-23);c.lineTo(16+(W-40)*s.opp.p,H-30);c.lineTo(24+(W-40)*s.opp.p,H-30);c.fill();}
      if(over&&s.phase==='end'){c.fillStyle='rgba(255,90,60,.9)';c.font='800 16px system-ui,sans-serif';c.fillText('FLASHOVER',hx+hw/2,hy+hh+22);}c.textAlign='left';
      c.fillStyle='rgba(255,255,255,.07)';c.fillRect(10,H-26,W-20,16);const tw=W-40;c.fillStyle='rgba(255,163,26,.85)';c.fillRect(20,H-20,Math.max(4,tw*s.p),4);(s.stops||[]).forEach((sp,i)=>{const r=s.res[i];c.fillStyle=r?(r.ok?'#3fdf8f':'#ff5a4a'):'rgba(255,255,255,.35)';c.beginPath();c.arc(20+tw*sp,H-18,4,0,7);c.fill();});
      raf=requestAnimationFrame(frame);}
    function mount(body,init){SESS=SESS_NEXT;SESS_NEXT=null;layout(!!SESS);el=body;el.innerHTML='<div class="pz-fahrt"><div class="pz-scr"><canvas width="720" height="600" aria-label="Einsatzfahrt: Fahrzeug, Route und Brandentwicklung"></canvas></div><div class="pz-card pz-fp"></div></div>';
        cv=el.querySelector('canvas');const dpr=Math.min(2,window.devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr;ctx=cv.getContext('2d');ctx.scale(dpr,dpr);SP=SP||sprites();stars=[...Array(40)].map(()=>[Math.random()*W,Math.random()*120,Math.random()]);
        el.querySelector('.pz-fp').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;act(b.dataset.a,b.dataset.v);};
        init();cancelAnimationFrame(raf);last=0;raf=requestAnimationFrame(frame);}
    function duelInit(cfg,sess){const n=cfg.n;st={phase:'d-count',p:0,t:0,qs:pickSeeded(cfg.mods,n,cfg.seed,cfg.cu),qi:0,res:[],fx:null,fxT:0,lvl:0,duel:1,hf:60*(n+1)+30,route:{key:'D',name:'Duell',base:60*(n+1),pen:30,bon:5},opp:{name:sess.opp,p:0,tp:0,res:[],done:null,rm:false},cd0:performance.now(),cdLeft:4,rm:false};st.stops=st.qs.map((_,i)=>(i+1)/(n+1));PART=[];panel();}
    return{start(body){SESS_NEXT=null;mount(body,newGame);},
      startDuel(body,sess){SESS_NEXT=sess;mount(body,()=>duelInit(sess.cfg,sess));},
      duelMsg(m){const s=st;if(!s||!s.duel)return;
        if(m.t==='a'){s.opp.res.push(!!m.ok);}else if(m.t==='p'){s.opp.tp=m.to;}else if(m.t==='fin'){s.opp.done={t:m.tm,score:m.score,right:m.right};s.opp.tp=1;duelCheck();panel();}
        else if(m.t==='rematch'){s.opp.rm=true;if(s.rm)SESS.rematch();else panel();}
        else if(m.t==='bye'){if(s.phase==='end'&&s.opp.done){s.opp.gone=true;panel();}else{s.forfeit=true;s.opp.gone=true;s.opp.done={t:s.t+1,score:0,right:0};s.paused=false;if(s.phase!=='end'){s.phase='end';s.win=s.t<=hf();s.p=1;}duelCheck();panel();}}},
      duelPause(on){const s=st;if(!s||!s.duel||(s.phase==='end'&&s.opp.done))return;if(on&&!s.paused){s.paused=true;s.pausedAt=performance.now();panel();}else if(!on&&s.paused){s.paused=false;panel();}},
      questions,baseQuestions,pickSeeded,sig,csig,duelPool,count,get MODS(){return refreshMods();},refreshMods,PAL,
      stop(){cancelAnimationFrame(raf);raf=0;if(SESS&&SESS.close)SESS.close();SESS=null;},
      _state:()=>st};
  })();

  return{
    show(){root=document.getElementById('pause-root');if(!root)return;if(!cur)hub();},
    leave(){stop();pushed=false;if(root)root.innerHTML='';},
    back(){if(cur){toHub();return true;}return false;},
    open, addScore, board, _fahrt:()=>FAHRT
  };
})();
