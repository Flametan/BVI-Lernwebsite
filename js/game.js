/* ======================================================================
   GAME – Belohnungen: Punkte, Dienstgrade, Abzeichen, Titel, Tagesaufgaben,
   Combo und Wochen-Rückblick.
   Alles bleibt auf dem Gerät (localStorage „bvi_game“) und wird mit der Sicherung gespeichert.
====================================================================== */
const GAME=(function(){
  const KEY='bvi_game';
  const pad=n=>String(n).padStart(2,'0');
  const dkey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const today=()=>dkey(new Date());
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const reduced=()=>window.matchMedia&&false;

  /* Dienstgrade nach der Wikipedia-Übersicht (Berufsfeuerwehr NRW), nach Laufbahngruppe geordnet */
  const GROUPS={md:{n:'Mittlerer Dienst',s:'mD',c:'#e5484d'},gd:{n:'Gehobener Dienst',s:'gD',c:'#b9c2cf'},hd:{n:'Höherer Dienst',s:'hD',c:'#f0b83a'}};
  const RANKS=[
    {n:'Brandmeister',g:'md',xp:0},{n:'Oberbrandmeister',g:'md',xp:120},{n:'Hauptbrandmeister',g:'md',xp:350},{n:'Hauptbrandmeister mit Amtszulage',g:'md',xp:550},
    {n:'Brandinspektor',g:'gd',xp:750},{n:'Brandoberinspektor',g:'gd',xp:1400},{n:'Brandamtmann',g:'gd',xp:2400},{n:'Brandamtsrat',g:'gd',xp:3000},
    {n:'Brandrat',g:'hd',xp:3800},{n:'Oberbrandrat',g:'hd',xp:5800},{n:'Branddirektor',g:'hd',xp:8800},{n:'Leitender Branddirektor',g:'hd',xp:13000}
  ];
  RANKS.forEach((r,i)=>{ r.i=i; r.pip=RANKS.filter(x=>x.g===r.g&&x.i<=i).length; });

  /* Tagesaufgaben: jeden Tag wechselt die Auswahl (je eine aus drei Gruppen, rollierend nach Tag) */
  const mins=()=>Math.floor((typeof USAGE!=='undefined'?USAGE.today():0)/60);
  /* Je Platz eine rollierende Liste; die Längen (5, 6, 7) sind teilerfremd, so ergeben sich viele verschiedene Tage */
  const best=d=>d.best||0, G=(id,t,max,get)=>({id,t,max,get});
  const TASK_POOL=[
    [G('cards','10 Lernkarten',10,d=>d.cards||0),G('cards2','15 Lernkarten',15,d=>d.cards||0),G('cards3','20 Lernkarten',20,d=>d.cards||0),G('redo','5 Wiederholungen',5,d=>d.redo||0),G('redo2','10 Wiederholungen',10,d=>d.redo||0)],
    [G('quiz','5 Prüfungsfragen',5,d=>d.quizOk||0),G('quiz2','8 Prüfungsfragen',8,d=>d.quizOk||0),G('quiz3','10 Antworten',10,d=>d.quiz||0),G('str','3 richtig in Folge',3,best),G('str2','5 richtig in Folge',5,best),G('str3','8 richtig in Folge',8,best)],
    [G('time','10 Minuten',10,mins),G('time2','15 Minuten',15,mins),G('time3','20 Minuten',20,mins),G('new','1 neues Thema',1,d=>d.newT||0),G('new2','2 neue Themen',2,d=>d.newT||0),G('star','3 Karten markieren',3,d=>d.stars||0),G('star2','5 Karten markieren',5,d=>d.stars||0)]
  ];
  function taskDefs(){ const n=Math.floor(Date.now()/864e5-new Date().getTimezoneOffset()/1440); return TASK_POOL.map((g,i)=>g[(n+i)%g.length]); }
  /* Wochenaufgaben (Mo–So): jede bringt Punkte, alle drei zusammen das Abzeichen „Wochenmeister“ */
  /* Jede Woche wechselt die Auswahl: je eine Aufgabe aus drei Gruppen (Karten, Fragen, Einsatz), rollierend nach Kalenderwoche */
  const W=(id,t,max,xp,get)=>({id,t,max,xp,get});
  const WEEKLY_POOL=[
    [W('wc','100 Lernkarten',100,50,w=>w.cards),W('wc2','150 Lernkarten',150,60,w=>w.cards),W('wc3','200 Lernkarten',200,70,w=>w.cards),W('wr','30 Wiederholungen',30,50,w=>w.redo),W('wr2','50 Wiederholungen',50,60,w=>w.redo)],
    [W('wq','25 Prüfungsfragen',25,50,w=>w.quizOk),W('wq2','40 Prüfungsfragen',40,60,w=>w.quizOk),W('wq3','60 Antworten',60,60,w=>w.quiz),W('ws','10 richtig in Folge',10,50,w=>w.best),W('ws2','15 richtig in Folge',15,70,w=>w.best),W('wk','1 Probeklausur',1,60,w=>w.klausur)],
    [W('wd','5 Tage',5,50,w=>w.days),W('wd2','4 Tage',4,40,w=>w.days),W('wd3','6 Tage',6,60,w=>w.days),W('wx','400 Punkte',400,50,w=>w.xp),W('wm','120 Minuten',120,50,w=>w.min),W('wm2','180 Minuten',180,60,w=>w.min),W('wn','5 neue Themen',5,50,w=>w.newT),W('wf','10 Karten markieren',10,40,w=>w.stars),W('wg','4 Tage à 10 Karten',4,60,w=>w.steady)]
  ];
  function weeklyDefs(){
    const [y,m,d]=weekKeys()[0].split('-').map(Number), n=Math.floor(Date.UTC(y,m-1,d)/864e5/7);
    return WEEKLY_POOL.map((g,i)=>g[(n+i)%g.length]);
  }
  /* Erklärungen zu den Aufgaben (Hover am PC, Tippen am Handy) */
  const HINT={
    cards:'Lernkarten, die du heute als „gewusst“ bewertest.', cards2:'Lernkarten, die du heute als „gewusst“ bewertest.', cards3:'Lernkarten, die du heute als „gewusst“ bewertest.',
    redo:'Karten, die du schon einmal gelernt oder falsch hattest und heute erneut beantwortest (egal ob richtig).', redo2:'Karten, die du schon einmal gelernt oder falsch hattest und heute erneut beantwortest (egal ob richtig).',
    quiz:'Prüfungsfragen, die du heute richtig beantwortest.', quiz2:'Prüfungsfragen, die du heute richtig beantwortest.',
    quiz3:'Prüfungsfragen, die du heute beantwortest, egal ob richtig oder falsch.',
    str:'So viele Karten oder Prüfungsfragen heute direkt nacheinander richtig, ohne Fehler dazwischen.', str2:'So viele Karten oder Prüfungsfragen heute direkt nacheinander richtig, ohne Fehler dazwischen.', str3:'So viele Karten oder Prüfungsfragen heute direkt nacheinander richtig, ohne Fehler dazwischen.',
    time:'Zeit, die du heute in der App verbringst.', time2:'Zeit, die du heute in der App verbringst.', time3:'Zeit, die du heute in der App verbringst.',
    new:'Themenseiten, die du heute zum ersten Mal öffnest.', new2:'Themenseiten, die du heute zum ersten Mal öffnest.',
    star:'Lernkarten, die du heute neu mit dem Stern markierst.', star2:'Lernkarten, die du heute neu mit dem Stern markierst.',
    wc:'Lernkarten, die du diese Woche (Mo–So) als „gewusst“ bewertest.', wc2:'Lernkarten, die du diese Woche (Mo–So) als „gewusst“ bewertest.', wc3:'Lernkarten, die du diese Woche (Mo–So) als „gewusst“ bewertest.',
    wr:'Karten, die du schon einmal gelernt oder falsch hattest und diese Woche erneut beantwortest.', wr2:'Karten, die du schon einmal gelernt oder falsch hattest und diese Woche erneut beantwortest.',
    wq:'Prüfungsfragen, die du diese Woche richtig beantwortest.', wq2:'Prüfungsfragen, die du diese Woche richtig beantwortest.',
    wq3:'Prüfungsfragen, die du diese Woche beantwortest, egal ob richtig oder falsch.',
    ws:'Deine längste Serie richtiger Antworten (Karten oder Prüfungsfragen) an einem einzigen Tag dieser Woche.', ws2:'Deine längste Serie richtiger Antworten (Karten oder Prüfungsfragen) an einem einzigen Tag dieser Woche.',
    wk:'Eine Probeklausur bis zur Auswertung durcharbeiten.',
    wd:'Tage dieser Woche, an denen du Punkte gesammelt hast.', wd2:'Tage dieser Woche, an denen du Punkte gesammelt hast.', wd3:'Tage dieser Woche, an denen du Punkte gesammelt hast.',
    wx:'Punkte, die du diese Woche sammelst.',
    wm:'Lernzeit in der App diese Woche.', wm2:'Lernzeit in der App diese Woche.',
    wn:'Themenseiten, die du diese Woche zum ersten Mal öffnest.',
    wf:'Lernkarten, die du diese Woche neu mit dem Stern markierst.',
    wg:'Tage dieser Woche, an denen du mindestens 10 Lernkarten als „gewusst“ bewertet hast.'
  };
  const WEEK_ALL_XP=100;
  const FZ_MAX=2, FZ_EVERY=7, MILES=[7,30,100,365], RISK_HOUR=18;
  const TASK_XP=25;

  const IC={
    flame:'<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .2 1.6 1 2.3 2 2.3C10.5 9 11 6 12 3z"/>',
    card:'<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 10h16"/>',
    check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    bolt:'<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
    truck:'<path d="M2.5 16V7h10v9M12.5 10h4.5l3 3v3h-7.5"/><circle cx="7" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
    star:'<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9-4.3-4.1 5.9-.8z"/>',
    shield:'<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/>',
    bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'
  };
  const svg=(k,sz=22)=>`<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]||IC.star}</svg>`;

  /* Abzeichen: jedes schaltet einen Titel frei */
  const BADGES=[
    {id:'k1',n:'Erste Karte',d:'Eine Lernkarte bewerten',ic:'card',t:'Frischling',ok:s=>s.tot.cards>=1},
    {id:'k100',n:'Kartenprofi',d:'100 Lernkarten bewerten',ic:'card',t:'Kartenmeister',ok:s=>s.tot.cards>=100},
    {id:'q100',n:'Klausurprofi',d:'100 Prüfungsfragen richtig beantworten',ic:'check',t:'Klausurprofi',ok:s=>s.tot.quizOk>=100},
    {id:'s3',n:'Dranbleiber',d:'3 Tage in Folge lernen',ic:'flame',t:'Dranbleiber',ok:s=>s.streak.best>=3},
    {id:'s7',n:'Wochenläufer',d:'7 Tage in Folge lernen',ic:'flame',t:'Wochenläufer',ok:s=>s.streak.best>=7},
    {id:'s30',n:'Dauerläufer',d:'30 Tage in Folge lernen',ic:'flame',t:'Dauerläufer',ok:s=>s.streak.best>=30},
    {id:'c10',n:'Treffsicher',d:'10 Antworten in Folge richtig',ic:'bolt',t:'Treffsicher',ok:s=>s.tot.combo>=10},
    {id:'f1',n:'Hilfsfrist geschafft',d:'Eine Einsatzfahrt rechtzeitig beenden',ic:'truck',t:'Blaulicht',ok:s=>s.tot.fahrt>=1},
    {id:'t3',n:'Tagessieger',d:'Alle drei Tagesaufgaben an einem Tag erledigen',ic:'sun',t:'Tagessieger',ok:s=>s.tot.allTasks>=1},
    {id:'w1',n:'Wochenmeister',d:'Alle drei Wochenaufgaben in einer Woche erledigen',ic:'shield',t:'Wochenmeister',ok:s=>s.tot.weekly>=1},
    {id:'w4',n:'Beständig',d:'Vier Wochen mit allen Wochenaufgaben',ic:'shield',t:'Beständig',ok:s=>s.tot.weekly>=4},
    {id:'k500',n:'Kartenlegende',d:'500 Lernkarten bewerten',ic:'card',t:'Kartenlegende',ok:s=>s.tot.cards>=500},
    {id:'q500',n:'Klausurlegende',d:'500 Prüfungsfragen richtig beantworten',ic:'check',t:'Klausurlegende',ok:s=>s.tot.quizOk>=500},
    {id:'s100',n:'Hundert Tage',d:'100 Tage in Folge lernen',ic:'flame',t:'Unerschütterlich',ok:s=>s.streak.best>=100},
    {id:'r4',n:'Gehobener Dienst',d:'Den Rang Brandinspektor erreichen',ic:'star',t:'Aufsteiger',ok:s=>rankOf(s.xp).i>=RANKS.findIndex(x=>x.g==='gd')},
    {id:'r7',n:'Höherer Dienst',d:'Den Rang Brandrat erreichen',ic:'star',t:'Führungskraft',ok:s=>rankOf(s.xp).i>=RANKS.findIndex(x=>x.g==='hd')}
  ];

  let queue=[], showing=false, combo=0, ST=null;

  function blank(){ return {xp:0,days:{},badges:{},title:'',done:{},tot:{cards:0,quizOk:0,fahrt:0,combo:0,allTasks:0,alarm:0,weekly:0},alarm:{},wdone:{},path:0,off:0,fz:{have:0,used:{},last:''},seen:{}}; }
  function load(){
    if(ST) return ST;
    let j=null; try{ j=JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){}
    ST=Object.assign(blank(),j&&typeof j==='object'&&!Array.isArray(j)?j:{});
    ST.tot=Object.assign(blank().tot,ST.tot||{});
    ['days','badges','done','alarm','wdone'].forEach(k=>{ if(!ST[k]||typeof ST[k]!=='object') ST[k]={}; });
    if(!ST.fz||typeof ST.fz!=='object') ST.fz={have:0,used:{},last:''};
    if(!ST.seen||typeof ST.seen!=='object') ST.seen={};
    if(!ST.fz.used||typeof ST.fz.used!=='object') ST.fz.used={};
    ST.fz.have=Math.max(0,Math.min(FZ_MAX,ST.fz.have|0));
    return ST;
  }
  function save(){
    const s=load(), keys=Object.keys(s.days).sort();
    while(keys.length>200) delete s.days[keys.shift()];
    try{ localStorage.setItem(KEY,JSON.stringify(s)); }catch(e){}
  }
  /* wenn die Sicherung zurückgespielt wurde, Zwischenspeicher verwerfen */
  window.addEventListener('storage',e=>{ if(e.key===KEY) ST=null; });

  function rankOf(xp){ let r=RANKS[0]; for(const x of RANKS) if(xp>=x.xp) r=x; return r; }
  function nextRank(r){ return RANKS[r.i+1]||null; }

  function dayRec(k){ const s=load(); return s.days[k]||(s.days[k]={xp:0,cards:0,quiz:0,quizOk:0}); }

  /* Serie nach dem Vorbild von Duolingo: ein Tag zählt, wenn gelernt wurde; ein Serien-Schutz überbrückt
     einen verpassten Tag, ohne die Serie zu erhöhen */
  function streak(){
    const s=load(), use=(typeof USAGE!=='undefined'&&USAGE.days)?USAGE.days():{}, fz=s.fz.used;
    const act=k=>((s.days[k]&&s.days[k].xp>0)||(use[k]||0)>=60);
    const d=new Date(); let cur=0;
    if(!act(dkey(d))&&!fz[dkey(d)]) d.setDate(d.getDate()-1);
    for(let n=0;n<2000;n++){ const k=dkey(d); if(act(k)) cur++; else if(!fz[k]) break; d.setDate(d.getDate()-1); }
    const ks=new Set([...Object.keys(s.days),...Object.keys(use)].filter(act)), arr=[...ks].sort();
    let best=0,run=0,prev=null;
    for(const k of arr){
      const [y,m,dd]=k.split('-').map(Number), t=new Date(y,m-1,dd);
      if(prev){ let gap=Math.round((t-prev)/864e5), ok=gap>=1; for(let i=1;i<gap&&ok;i++){ const x=new Date(prev); x.setDate(x.getDate()+i); if(!fz[dkey(x)]) ok=false; } if(ok) run++; else run=1; } else run=1;
      best=Math.max(best,run); prev=t;
    }
    const h=new Date().getHours();
    return {cur,best:Math.max(best,cur),todayDone:act(today()),risk:cur>0&&!act(today())&&h>=RISK_HOUR,have:s.fz.have};
  }
  /* Verpasster Tag: ist ein Schutz vorhanden, wird er automatisch eingesetzt (bis zu 2 Tage am Stück) */
  function settleFreeze(){
    const s=load(), use=(typeof USAGE!=='undefined'&&USAGE.days)?USAGE.days():{}, fz=s.fz;
    const act=k=>((s.days[k]&&s.days[k].xp>0)||(use[k]||0)>=60||fz.used[k]);
    if(fz.have<=0) return false;
    const miss=[]; const d=new Date(); d.setDate(d.getDate()-1);
    while(!act(dkey(d))&&miss.length<=fz.have){ miss.push(dkey(d)); d.setDate(d.getDate()-1); }
    if(!miss.length||miss.length>fz.have||!act(dkey(d))) return false;
    miss.forEach(k=>{ fz.used[k]=1; fz.have--; });
    Object.keys(fz.used).sort().slice(0,-30).forEach(k=>delete fz.used[k]);
    toast('Serien-Schutz eingesetzt',miss.length>1?'Deine Serie bleibt bestehen ('+miss.length+' Tage überbrückt)':'Deine Serie bleibt bestehen','shield');
    return true;
  }
  /* Meilensteine (7, 30, 100, 365 Tage): Feier; alle 7 Tage gibt es einen neuen Serien-Schutz */
  function milestones(){
    const s=load(), st=streak(), fz=s.fz;
    if(!st.todayDone||st.cur<1||fz.last===today()) return;
    fz.last=today();
    if(st.cur%FZ_EVERY===0&&fz.have<FZ_MAX){ fz.have++; toast('Serien-Schutz erhalten','Fängt einen verpassten Tag ab · '+fz.have+' von '+FZ_MAX,'shield'); }
    if(MILES.includes(st.cur)||(st.cur>365&&st.cur%100===0)){ toast(st.cur+' Tage Serie','Starke Leistung – weiter so!','flame'); confetti(); }
  }

  function weekKeys(offset=0){
    const mo=new Date(); mo.setDate(mo.getDate()-((mo.getDay()+6)%7)+offset*7);
    return Array.from({length:7},(_,i)=>{ const x=new Date(mo); x.setDate(mo.getDate()+i); return dkey(x); });
  }
  function weekSum(offset=0){
    const s=load(), a={xp:0,cards:0,quiz:0,quizOk:0,days:0,redo:0,newT:0,stars:0,best:0,klausur:0,steady:0,min:0};
    weekKeys(offset).forEach(k=>{ const d=s.days[k]; if(d){ a.xp+=d.xp||0; a.cards+=d.cards||0; a.quiz+=d.quiz||0; a.quizOk+=d.quizOk||0; if((d.xp||0)>0) a.days++; a.redo+=d.redo||0; a.newT+=d.newT||0; a.stars+=d.stars||0; a.klausur+=d.klausur||0; a.best=Math.max(a.best,d.best||0); if((d.cards||0)>=10) a.steady++; } });
    if(!offset&&typeof USAGE!=='undefined'){ try{ a.min=Math.floor(USAGE.week().reduce((x,y)=>x+y,0)/60); }catch(e){} }
    return a;
  }
  function weeklyState(){
    const w=weekSum();
    return weeklyDefs().map(t=>{ const v=Math.min(t.max,t.get(w)); return {id:t.id,t:t.t,v,max:t.max,xp:t.xp,h:HINT[t.id]||'',done:v>=t.max}; });
  }
  /* ISO-Wochenschlüssel (z. B. 2026-W47) für das Ranking */
  function isoWeek(d=new Date()){
    const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())), n=t.getUTCDay()||7;
    t.setUTCDate(t.getUTCDate()+4-n);
    const y=t.getUTCFullYear(), w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);
    return y+'-W'+pad(w);
  }

  function taskState(){
    const rec=load().days[today()]||{};
    return taskDefs().map(t=>{ const v=Math.min(t.max,t.get(rec)); return {id:t.id,t:t.t,v,max:t.max,h:HINT[t.id]||'',done:v>=t.max}; });
  }

  /* ── Toast als „Gooey Drop“: ein Tropfen fällt vom oberen Rand und wird zur Meldung ── */
  function ensureHost(){
    let h=document.getElementById('g-host'); if(h) return h;
    h=document.createElement('div'); h.id='g-host'; h.setAttribute('aria-live','polite');
    h.innerHTML='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="g-goo" x="-20%" y="-50%" width="140%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></defs></svg><div class="g-goo"><i class="g-src"></i><div class="g-drop" role="status"></div></div><div class="g-fx" aria-hidden="true"><i class="g-ring"></i><i class="g-ring"></i></div>';
    document.body.appendChild(h); return h;
  }
  /* Meldung als „Gooey Drop“ (Variante 3): Tropfen fällt, beim Aufprall laufen Wellen nach außen, das Symbol springt heraus,
     die Zeichen erscheinen nacheinander, ein Glanz streift darüber; am Ende bläht sie sich auf und löst sich auf */
  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), lerp=(a,b,t)=>a+(b-a)*t, easeIn=t=>t*t, easeOut=t=>1-(1-t)*(1-t);
  const spr=(t,w=16,z=.32)=>{ t=Math.max(0,t); return 1-Math.exp(-z*w*t)*Math.cos(w*Math.sqrt(1-z*z)*t); };
  const DROP_END=3.65;
  function pump(){
    if(showing||!queue.length) return;
    showing=true;
    const m=queue.shift(), h=ensureHost(), drop=h.querySelector('.g-drop'), goo=h.querySelector('.g-goo'), rings=[...h.querySelectorAll('.g-ring')];
    drop.textContent='';
    const di=document.createElement('span'); di.className='g-di'; di.innerHTML=svg(m.ic,20);
    const dt=document.createElement('span'); dt.className='g-dt';
    const ttl=document.createElement('b'), sub=document.createElement('span'); sub.textContent=m.s||'';
    const ems=[...String(m.t)].map((c,i)=>{ const e=document.createElement('em'); e.textContent=c; e.dataset.i=i; ttl.appendChild(e); return e; });
    dt.append(ttl,sub);
    const sh=document.createElement('i'); sh.className='g-shine';
    drop.append(di,dt,sh);
    h.classList.add('on');
    drop.style.width='auto'; const FULL=Math.min(Math.ceil(drop.scrollWidth)+2,Math.round(innerWidth*.94));
    let over=false, raf=0;
    const end=()=>{ if(over) return; over=true; cancelAnimationFrame(raf); h.classList.remove('on'); drop.onclick=null; showing=false; setTimeout(pump,250); };
    // Antippen öffnet Rang und Abzeichen
    const go=()=>{ if(over) return; end(); openRank(); };
    drop.setAttribute('role','button'); drop.setAttribute('tabindex','0'); drop.setAttribute('aria-label',m.t+'. Öffnet Rang und Abzeichen');
    drop.onclick=go; drop.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } };
    goo.style.filter='url(#g-goo)';
    const t0=performance.now();
    const frame=now=>{
      if(over) return;
      const t=(now-t0)/1000;
      if(t>=DROP_END){ end(); return; }
      let y,w=34,sx=1,sy=1,op=1;
      if(t<.32){ const f=clamp(t/.32); y=lerp(-44,16,easeIn(f)); sy=lerp(.6,1.2,f); sx=lerp(.6,.85,f); }
      else{ const l=t-.32; y=16+Math.sin(l*3.2)*1.6*Math.min(1,l*2); sx=1+.25*Math.exp(-l*8)*Math.cos(l*24); sy=1-.2*Math.exp(-l*8)*Math.cos(l*24); w=lerp(34,FULL,clamp(spr(Math.max(0,l-.05),11,.45),0,1.035)); }
      const exit=clamp((t-3.2)/.45);
      if(t>=3.2){ w=lerp(FULL,34,easeIn(clamp(exit*1.4))); const p=clamp((exit-.55)/.45); sx*=1+p*.5; sy*=1+p*.5; op=1-p; }
      drop.style.width=Math.max(30,Math.min(FULL*1.035,w))+'px';
      drop.style.transform='translate(-50%,'+y+'px) scale('+sx+','+sy+')'; drop.style.opacity=op;
      const l=t-.32, fade=t>=3.2?1-clamp(exit*3):1;
      ems.forEach((e,i)=>{ const p=clamp((l-.35-i*.018)/.22); e.style.opacity=p; e.style.transform='translateY('+((1-easeOut(p))*9)+'px)'; });
      sub.style.opacity=clamp((l-.75)/.3)*fade; ttl.style.opacity=fade;
      const sc=l<0?0:spr(clamp((l-.12)/.5),14,.38); di.style.transform='scale('+Math.max(0,sc)+') rotate('+((1-clamp(sc,0,1))*-200)+'deg)';
      rings.forEach((r,i)=>{ const p=clamp((l-i*.14)/.7), z=34+p*(i?200:150); r.style.opacity=l<0?0:(1-p)*.55; r.style.width=r.style.height=z+'px'; r.style.marginLeft=(-z/2)+'px'; r.style.top=(42-z/2)+'px'; });
      const gp=clamp((l-1.1)/.9); sh.style.left=(-60+gp*(FULL+120))+'px'; sh.style.opacity=(l>1.1&&l<2)?1:0;
      raf=requestAnimationFrame(frame);
    };
    drop.style.opacity='0'; raf=requestAnimationFrame(frame);
  }
  function toast(t,s,ic){ if(load().off) return; queue.push({t,s,ic:ic||'star'}); pump(); }

  function confetti(){
    if(load().off||reduced()) return;
    const cols=['#e5484d','#b9c2cf','#f0b83a','#4cc38a','#5aa9ff'], host=document.createElement('div');
    host.className='g-conf'; document.body.appendChild(host);
    for(let i=0;i<34;i++){
      const p=document.createElement('i'); p.style.background=cols[i%cols.length];
      p.style.left=(35+Math.random()*30)+'%'; host.appendChild(p);
      const dx=(Math.random()-.5)*340, dy=-(120+Math.random()*180), rot=(Math.random()-.5)*720;
      p.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${dx*.6}px,${dy}px) rotate(${rot*.6}deg)`,opacity:1,offset:.45},{transform:`translate(${dx}px,${dy+420}px) rotate(${rot}deg)`,opacity:0}],{duration:1300+Math.random()*500,easing:'cubic-bezier(.2,.6,.4,1)',fill:'forwards'});
    }
    setTimeout(()=>host.remove(),2000);
  }
  function comboPill(n){
    if(load().off) return;
    let c=document.getElementById('g-combo');
    if(!c){ c=document.createElement('div'); c.id='g-combo'; c.setAttribute('aria-hidden','true'); document.body.appendChild(c); }
    c.innerHTML=`${svg('bolt',16)}<b>Combo ×${n}</b>`; c.classList.remove('on'); void c.offsetWidth; c.classList.add('on');
    clearTimeout(comboPill._t); comboPill._t=setTimeout(()=>c.classList.remove('on'),1500);
  }

  /* ── Auswertung nach jedem Ereignis ── */
  function context(){ const s=load(); return {xp:s.xp,tot:s.tot,streak:streak()}; }
  function evaluate(){
    const s=load(), rec=dayRec(today());
    // Tagesaufgaben
    const dn=s.done[today()]||(s.done[today()]={}); let n=0;
    taskState().forEach(t=>{
      if(t.done){ n++; if(!dn[t.id]){ dn[t.id]=1; s.xp+=TASK_XP; rec.xp+=TASK_XP; toast('Tagesaufgabe erledigt',t.t+' · +'+TASK_XP+' Punkte','check'); } }
    });
    if(n===3&&!dn.all){ dn.all=1; s.tot.allTasks++; }
    Object.keys(s.done).sort().slice(0,-10).forEach(k=>delete s.done[k]);
    // Wochenaufgaben
    const wk=weekKeys()[0];
    const wd=s.wdone[wk]||(s.wdone[wk]={}); let wn=0;
    weeklyState().forEach(t=>{
      if(t.done){ wn++; if(!wd[t.id]){ wd[t.id]=1; s.xp+=t.xp; rec.xp+=t.xp; toast('Wochenaufgabe erledigt',t.t+' · +'+t.xp+' Punkte','star'); } }
    });
    if(wn===WEEKLY_POOL.length&&!wd.all){ wd.all=1; s.tot.weekly=(s.tot.weekly|0)+1; s.xp+=WEEK_ALL_XP; rec.xp+=WEEK_ALL_XP; toast('Alle Wochenaufgaben geschafft','Bonus · +'+WEEK_ALL_XP+' Punkte','shield'); confetti(); }
    Object.keys(s.wdone).sort().slice(0,-8).forEach(k=>delete s.wdone[k]);
    // Abzeichen
    const ctx=context();
    BADGES.forEach(b=>{ if(!s.badges[b.id]&&b.ok(ctx)){ s.badges[b.id]=Date.now(); toast('Neues Abzeichen: '+b.n,'Titel „'+b.t+'“ freigeschaltet',b.ic); if(!s.title) s.title=b.t; } });
  }

  /* ── Glückwünsche und Motivation (Gooey Drop) ── */
  const CHEER=['Glückwunsch!','Stark gemacht!','Sehr gut!','Das war stark!','Gut gemacht!','Hervorragend!','Top Leistung!','Starke Leistung!','Bravo!','Geschafft!',
    'Das sitzt!','Genau so!','Klasse gemacht!','Respekt!','Sauber durchgezogen!','Großartig!','Weiter so!','Ein Schritt weiter!','Das hast du dir verdient!','Auf dich ist Verlass!',
    'Ordentlich geleistet!','Voll im Soll!','Einsatz erfolgreich!','Aufgabe erfüllt!','Wie ein Profi!','Das war souverän!','Richtig stark!','Mit Bravour!','Alle Achtung!','Du bist dabei!',
    'Genau richtig!','Beeindruckend!','Das lief rund!','Fleiß zahlt sich aus!','Starker Auftritt!','Mission erfüllt!','Ein Erfolg mehr!','Das macht Eindruck!','Du bleibst dran!','Ausgezeichnet!'];
  /* Lernkarten: alle 10 Karten am Tag ein Text; je mehr Karten, desto kräftiger die Motivation */
  const MOTI=[
    ['Guter Start – bleib dran.','Die ersten zehn sind im Kasten.','Kleine Schritte, große Wirkung.','So fängt jede Prüfungsvorbereitung an.','Zehn Karten, zehn Mal klüger.','Schön, dass du heute lernst.'],
    ['Zwanzig! Du kommst in den Fluss.','Das wird zur Routine – stark.','Dein Wissen wächst mit jeder Karte.','Jetzt läuft es, weiter so.','Wiederholung ist der Schlüssel, du lebst es.','Genau so prägt sich der Stoff ein.'],
    ['Dreißig Karten – das ist echte Ausdauer.','Du bist im Flow, nicht bremsen!','Das merkt sich dein Kopf bis zur Prüfung.','Dein zukünftiges Ich sagt Danke.','Du ziehst heute richtig durch.','Das Wissen sitzt immer fester.'],
    ['Vierzig! Das ist Prüfungsniveau.','Disziplin schlägt Talent, und du hast Disziplin.','Du setzt dich gerade von der Masse ab.','So bestehen Leute, die dranbleiben.','Kaum zu stoppen heute.','Jede Karte bringt dich näher ans Ziel.'],
    ['Fünfzig Karten! Das ist ein Statement.','Du lernst heute wie ein Profi.','Solche Tage entscheiden Prüfungen.','Respekt vor deinem Durchhaltevermögen.','Das ist Leistungssport für den Kopf.','Heute bist du nicht aufzuhalten.'],
    ['Unaufhaltsam! Du spielst in einer eigenen Liga.','Das ist Höherer-Dienst-Niveau.','Legendärer Lerntag, gönn dir gleich eine Pause.','Mehr als der Plan verlangt, das ist Einsatz.','Wahnsinn, was du heute schaffst.','Du hast dir heute allen Respekt verdient.']
  ];
  const lastPick={};
  function pick(pool,key){ let i=Math.floor(Math.random()*pool.length); if(pool.length>1&&i===lastPick[key]) i=(i+1+Math.floor(Math.random()*(pool.length-1)))%pool.length; lastPick[key]=i; return pool[i]; }
  const REC=['Neuer Rekord!','Bestmarke geknackt!','Persönliche Bestleistung!','Neuer Bestwert!'];
  /* nach einem Spiel: Glückwunsch; ist es ein neuer Rekord (record = Bestwert als Text), ersetzt „Neuer Rekord“ den Glückwunsch */
  function cheer(kind,label,record){
    if(load().off) return;
    const now=Date.now(); if(now-(cheer._t||0)<30000) return; cheer._t=now;   // nicht mehrfach kurz hintereinander
    if(record){ toast(pick(REC,'rec'),(label?label+' · ':'')+record,'star'); confetti(); return; }
    const sub=(kind==='pruefung'?'Prüfung abgeschlossen':'Spiel geschafft')+(label?' · '+label:'');
    toast(pick(CHEER,'cheer'),sub,kind==='pruefung'?'check':'star'); confetti();
  }
  function cardCheer(n){
    const tier=Math.min(MOTI.length,Math.floor(n/10))-1;
    toast(n+' Lernkarten heute',pick(MOTI[tier],'m'+tier),['check','bolt','flame','star','star','flame'][tier]);
    if(tier>=2) confetti();
  }

  /* ── Kleine Hinweise (Gooey Drop): selten, mit Tages-/Ereignisschlüssel, nur wenn gerade nichts anderes läuft ── */
  const SOFT_MAX=3; let softN=0;
  function soft(key,t,sub,ic,imp){
    const s=load(); if(s.off) return false;
    if(!imp&&(s.small===0||softN>=SOFT_MAX||showing||queue.length||document.hidden)) return false;
    if(s.seen[key]) return false;
    s.seen[key]=today(); if(!imp) softN++;
    const ks=Object.keys(s.seen); if(ks.length>300) ks.sort((a,b)=>String(s.seen[a]).localeCompare(String(s.seen[b]))).slice(0,ks.length-300).forEach(k=>delete s.seen[k]);
    save(); toast(t,sub,ic); return true;
  }
  const P_GOAL=m=>[m+' Minuten gelernt. Das Tagesziel steht.','Tagesziel erreicht, alles darüber ist Bonus.',m+' Minuten konsequent gelernt.','Heute hast du geliefert, '+m+' Minuten.'];
  const P_DAY=['Die Serie lebt.','Dranbleiben zahlt sich aus.','Jeder Tag zählt, heute auch.','Du bleibst in der Spur.','Gewohnheit schlägt Motivation.'];
  const P_BACK=['Schön, dass du wieder da bist. Zehn Karten sind ein guter Einstieg.','Willkommen zurück. Fang einfach klein an.','Pause vorbei, jetzt geht es weiter.','Gut, dass du wieder dabei bist.'];
  const P_CD={100:'Genug Zeit, wenn du jetzt anfängst.',50:'Halbzeit. Plane feste Lernslots ein.',30:'Noch ein Monat. Jetzt wird wiederholt.',14:'Zwei Wochen. Übe gezielt die schwachen Karten.',7:'Letzte Woche. Ruhig bleiben, Stoff festigen.'};
  function checkGoal(){
    if(typeof USAGE==='undefined'||typeof SHELL==='undefined'||!SHELL.goalMin) return;
    const gm=SHELL.goalMin(); if(USAGE.today()>=gm*60) soft('goal:'+today(),'Tagesziel geschafft',pick(P_GOAL(gm),'goal'),'sun',true);
  }
  function checkStreakDay(){
    const st=streak(); if(!st.todayDone||st.cur<2||MILES.includes(st.cur)||st.cur%FZ_EVERY===0) return;
    soft('day:'+today(),'Tag '+st.cur+' in Folge',pick(P_DAY,'day'),'flame');
  }
  function checkCountdown(){
    if(typeof SHELL==='undefined'||!SHELL.daysToExam) return;
    const d=SHELL.daysToExam(); if(d<0) return;
    const ths=[100,50,30,14,7], th=ths.filter(x=>d<=x).pop(); if(th===undefined) return;
    const ex=(()=>{ try{ return (JSON.parse(localStorage.getItem('bvi_exam')||'{}').date||'')+''; }catch(e){ return ''; } })();
    const s=load(), k='ex:'+th+':'+ex;
    ths.filter(x=>x>th).forEach(x=>{ s.seen['ex:'+x+':'+ex]=s.seen['ex:'+x+':'+ex]||today(); });
    soft(k,'Noch '+d+' '+(d===1?'Tag':'Tage')+' bis zur Prüfung',P_CD[th],'bell');
  }
  function lastActDays(){
    const s=load(), use=(typeof USAGE!=='undefined'&&USAGE.days)?USAGE.days():{}; let best=null;
    const ks=new Set([...Object.keys(s.days).filter(k=>s.days[k].xp>0),...Object.keys(use).filter(k=>(use[k]||0)>=60)]);
    ks.forEach(k=>{ if(k<today()&&(best===null||k>best)) best=k; });
    if(!best) return null; const [y,m,d]=best.split('-').map(Number); return Math.round((new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())-new Date(y,m-1,d))/864e5);
  }
  function checkStart(){
    const st=streak();
    const gap=lastActDays();
    if(gap!==null&&gap>=3&&!st.todayDone&&soft('back:'+today(),'Willkommen zurück',pick(P_BACK,'back'),'sun')) return;
    if(st.cur>0&&!st.todayDone&&new Date().getHours()>=RISK_HOUR&&soft('risk:'+today(),'Serie in Gefahr','Deine '+st.cur+'-Tage-Serie läuft heute ab. Eine Karte reicht.','flame')) return;
    checkCountdown();
  }
  setTimeout(checkStart,3600);
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') setTimeout(checkStart,1200); });
  setInterval(()=>{ if(!document.hidden){ checkGoal(); const td=document.getElementById('g-today'); if(td) td.outerHTML=todayHtml(); } },60000);
  function setSmall(on){ load().small=on?1:0; save(); }
  function isSmall(){ return load().small!==0; }
  function event(type,ok,x){
    try{
      const s=load(), pre=rankOf(s.xp), rec=dayRec(today());
      let gain=0;
      if(type==='card'){ if(ok){ gain=2; rec.cards++; s.tot.cards++; } if(x&&x.redo) rec.redo=(rec.redo|0)+1; rec.cd=(rec.cd|0)+1; if(rec.cd%10===0) cardCheer(rec.cd); }
      else if(type==='quiz'){ rec.quiz++; if(ok){ gain=3; rec.quizOk++; s.tot.quizOk++; } else gain=1; }
      else if(type==='klausur') rec.klausur=(rec.klausur|0)+1;
      else if(type==='star') rec.stars=(rec.stars|0)+1;
      else if(type==='new') rec.newT=(rec.newT|0)+1;
      else if(type==='fahrt'){ gain=20; if(ok){ s.tot.fahrt++; cheer('spiel','Einsatzfahrt'); } }
      if(type==='card'||type==='quiz'){
        if(ok){ combo++; s.tot.combo=Math.max(s.tot.combo,combo); rec.best=Math.max(rec.best|0,combo); if(combo>=5&&combo%5===0){ comboPill(combo); if(combo%10===0) confetti(); } }
        else combo=0;
      }
      s.xp+=gain; rec.xp+=gain;
      settleFreeze(); evaluate(); milestones();
      const post=rankOf(s.xp);
      if(post.i>pre.i) toast('Beförderung: '+post.n,GROUPS[post.g].n+' · '+s.xp+' Punkte','star'), confetti();
      save(); refresh(); pushIcon();
      if(rankOn()) rankLoad().then(R=>R.touch()).catch(()=>{});
      if(type!=='fahrt'){ checkGoal(); checkStreakDay(); }
    }catch(e){}
  }

  /* ── Darstellung ── */
  /* Schulterklappe: Kordel mit Metallverlauf, Tuch mit Gewebe, Naht, Sterne und Flammenknopf.
     Gehobener Dienst: zweite Innenkordel, Höherer Dienst: Eichenlaub an Ober- und Unterkante.
     Jede Klappe bringt ihre Verläufe mit eigenen Kennungen mit (auch in ausgeblendeten Ansichten sicher). */
  const SH_COL={md:['#ffd9da','#e5484d','#9e1f24'],gd:['#f3f5f8','#c9d1dc','#6f7a89'],hd:['#fff0c2','#f0b83a','#a56a00']};
  const SH_PATH='M8 9 H86 L114 40 L86 71 H8 Z', FLAME_P='M0 -30C4 -16 22 -8 22 10A22 22 0 0 1 -22 10C-22 1 -17 -5 -12 -9C-11 -2 -8 1 -4 1C-7 -9 -4 -21 0 -30Z';
  let shN=0;
  function shoulderSvg(r,w,h){
    const [l,m,d]=SH_COL[r.g], u='sh'+(++shN), n=r.pip;
    const leaf=(x,y,rot)=>`<g transform="translate(${x} ${y}) rotate(${rot}) scale(.9)"><path d="M0 0Q4 -5 10 0Q4 5 0 0Z" fill="${m}" stroke="${d}" stroke-width=".6"/></g>`;
    let o=`<svg xmlns="http://www.w3.org/2000/svg" class="g-sh" width="${w}" height="${h}" viewBox="0 0 120 82" aria-hidden="true" focusable="false"><defs>`+
      `<linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${l}"/><stop offset=".45" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></linearGradient>`+
      `<linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3856"/><stop offset="1" stop-color="#18213a"/></linearGradient>`+
      `<pattern id="${u}p" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.4" height="4" fill="#fff" opacity=".045"/></pattern></defs>`+
      `<path d="${SH_PATH}" transform="translate(0 2.5)" fill="#000" opacity=".18"/><path d="${SH_PATH}" fill="url(#${u}f)"/><path d="${SH_PATH}" fill="url(#${u}p)"/>`+
      `<path d="${SH_PATH}" fill="none" stroke="url(#${u}c)" stroke-width="7" stroke-linejoin="round"/><path d="${SH_PATH}" fill="none" stroke="${d}" stroke-width="7" stroke-linejoin="round" stroke-dasharray="1.2 3.4" opacity=".22"/>`;
    if(r.g==='gd') o+=`<path d="M14 15 H84 L106 40 L84 65 H14 Z" fill="none" stroke="${m}" stroke-width="1.6" stroke-linejoin="round"/>`;
    o+=`<path d="M15.5 16.5 H83.5 L103.5 40 L83.5 63.5 H15.5 Z" fill="none" stroke="${m}" stroke-width=".9" stroke-dasharray="2.2 1.8" opacity=".7" stroke-linejoin="round"/>`;
    if(r.g==='hd') for(let k=0;k<6;k++){ const x=20+k*11.5; o+=leaf(x,13.2,-12)+leaf(x+5.5,13.2,192)+leaf(x,66.8,12)+leaf(x+5.5,66.8,168); }
    const rad=n<4?7.4:6.4, gap=n<4?17:14.5, cx=n<4?52:50, x0=cx-(n-1)*gap/2;
    for(let k=0;k<n;k++){ const p=[]; for(let j=0;j<10;j++){ const a=-Math.PI/2+j*Math.PI/5, rr=j%2?rad*.42:rad; p.push((x0+k*gap+rr*Math.cos(a)).toFixed(1)+','+(41+rr*Math.sin(a)).toFixed(1)); } o+=`<polygon points="${p.join(' ')}" fill="url(#${u}c)" stroke="${d}" stroke-width=".9" stroke-linejoin="round"/>`; }
    o+=`<circle cx="97" cy="40" r="6.2" fill="url(#${u}c)" stroke="${d}" stroke-width="1"/><circle cx="97" cy="40" r="4.2" fill="none" stroke="${d}" stroke-width=".6" opacity=".7"/><path transform="translate(97 41) scale(.13)" d="${FLAME_P}" fill="${d}"/></svg>`;
    return o;
  }
  function shoulder(r,sz=34){ return shoulderSvg(r,sz,Math.round(sz*.68)); }
  function flameIc(sz){ return svg('flame',sz); }

  /* wie bei Duolingo: Flamme leuchtet, sobald heute gelernt wurde; abends ohne Lernen wird die Zahl rot */
  const chipCls=st=>(st.cur>0?' on':'')+(st.risk?' risk':'');
  function freezeRow(st){
    const pips=Array.from({length:FZ_MAX},(_,i)=>`<span class="g-fzp${i<st.have?' has':''}">${svg('shield',16)}</span>`).join('');
    return `<div class="g-row"><span class="g-ri">${pips}</span><span class="g-rt"><b>Serien-Schutz: ${st.have} von ${FZ_MAX}</b><span>Fängt einen verpassten Tag ab · alle ${FZ_EVERY} Tage ein neuer</span></span></div>`;
  }
  function chip(){
    const s=load(), st=streak(), r=rankOf(s.xp);
    return `<button type="button" class="g-chip${chipCls(st)}" id="g-chip" aria-expanded="false" aria-controls="g-panel" aria-label="Belohnungen: ${st.cur} Tage Serie${st.risk?' in Gefahr':''}, ${esc(r.n)}" onclick="GAME.toggle(this)"><span class="g-fl${st.cur>0&&st.todayDone?' on':''}">${flameIc(15)}</span><b>${st.cur}</b></button>`;
  }
  function panel(){
    const s=load(), st=streak(), r=rankOf(s.xp), nx=nextRank(r), g=GROUPS[r.g];
    const pct=nx?Math.round((s.xp-r.xp)/(nx.xp-r.xp)*100):100;
    return `<button type="button" class="g-rank g-rank-go" aria-label="Rang und Abzeichen öffnen" onclick="GAME.openRank()"><span class="g-rk-ic">${shoulder(r,46)}</span><span class="g-rk-t"><b>${esc(r.n)}</b><span style="color:${g.c}">${g.n}${s.title?' · '+esc(s.title):''}</span></span><span class="g-xp">${s.xp}<small> Punkte</small></span><svg class="g-chv" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>
      <div class="g-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Fortschritt zum nächsten Rang"><i style="width:${pct}%;background:${g.c}"></i></div>
      <div class="g-sub">${nx?`Noch ${nx.xp-s.xp} Punkte bis ${esc(nx.n)}`:'Höchster Rang erreicht'}</div>
      <div class="g-h">Serie</div>
      <div class="g-row"><span class="g-ri g-fl${st.cur>0&&st.todayDone?' on':''}">${flameIc(18)}</span><span class="g-rt"><b>${st.cur} ${st.cur===1?'Tag':'Tage'} in Folge</b><span>${st.todayDone?'Heute schon gelernt':st.cur>0?(st.risk?'Deine Serie ist in Gefahr – lerne noch heute':'Lerne heute, damit die Serie nicht reißt'):'Lerne heute, um eine Serie zu starten'} · Rekord ${st.best}</span></span></div>
      ${freezeRow(st)}
      <div class="g-links"><button type="button" onclick="NAV.go('v-week','Wochen-Rückblick')">Wochen-Rückblick</button></div>`;
  }
  /* Bereich auf der Startseite (Symbol + aufklappbares Feld); bei ausgeschalteten Belohnungen leer */
  /* aktueller Dienstgrad mit Schulterstück (ersetzt die Überschrift „Lernstoff“ auf der Startseite) */
  function rankLabel(){ const r=rankOf(load().xp); return `<button type="button" class="g-rklab" aria-label="Dienstgrad ${esc(r.n)}. Rang und Abzeichen öffnen" onclick="GAME.openRank()">${shoulder(r,45)}<span>${esc(r.n)}</span></button>`; }
  // Kopfleiste (alle Seiten außer Startseite): Dienstgrad-Abzeichen und Serie, Tipp öffnet Rang & Abzeichen
  function barHtml(){
    if(load().off) return '';
    const r=rankOf(load().xp);
    return `<button type="button" class="tb-rk" aria-label="Dienstgrad ${esc(r.n)}. Rang und Abzeichen öffnen" title="${esc(r.n)}" onclick="GAME.openRank()">${shoulder(r,38)}</button>`;
  }
  // PC/Tablet-Startseite: große Karte mit Serie (Tipp = Belohnungen) und Dienstgrad (Tipp = Rang & Abzeichen)
  function heroHtml(){
    if(load().off) return '';
    const s=load(), st=streak(), r=rankOf(s.xp);
    return `<div class="g-hero"><div class="g-hero-top"><button type="button" class="g-hero-st" onclick="GAME.toggle()" aria-label="${st.cur} Tage Serie${st.risk?' in Gefahr':''}. Belohnungen anzeigen"><span class="g-hero-k">Serie${st.risk?' · in Gefahr':''}</span><span class="g-hero-n"><span class="g-hero-fl${st.cur>0&&st.todayDone?' on':''}">🔥</span> ${st.cur}</span><span class="g-hero-l">Tage in Folge</span></button><button type="button" class="g-hero-rk" onclick="GAME.openRank()" aria-label="Dienstgrad ${esc(r.n)}. Rang und Abzeichen öffnen">${shoulder(r,118)}</button></div><button type="button" class="g-hero-rkl" onclick="NAV.go('v-rank','Ranking')"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg><span>Ranking</span></button></div>`;
  }
  /* Karte „Heute“: Tagesziel-Ring (Lernzeit), Tagesaufgaben, Wochenaufgaben */
  function tasksList(){
    const li=t=>`<li class="${t.done?'ok':''}"><span class="g-tk">${t.done?svg('check',14):''}</span><span class="g-tt">${esc(t.t)}</span><span class="g-tx">+${t.xp||TASK_XP} XP</span><span class="g-tv">${t.v}/${t.max}</span></li>`;
    return {d:taskState().map(li).join(''), w:weeklyState().map(li).join('')};
  }
  const tdOpen=()=>{ try{ return localStorage.getItem('bvi_td_o')==='1'; }catch(e){ return false; } };
  function tdToggle(){ try{ localStorage.setItem('bvi_td_o',tdOpen()?'0':'1'); }catch(e){} const td=document.getElementById('g-today'); if(td) td.outerHTML=todayHtml(); }
  /* Startseite: eine schmale Leiste (Ring, Stand, Pfeil); aufgeklappt Tages- und Wochenaufgaben, Ranking und Rang & Abzeichen */
  function todayHtml(){ if(typeof tipHide==='function') tipHide();
    if(load().off) return '';
    const gm=(typeof SHELL!=='undefined'&&SHELL.goalMin)?SHELL.goalMin():15, sec=(typeof USAGE!=='undefined')?USAGE.today():0;
    const min=Math.floor(sec/60), p=Math.min(1,sec/(gm*60)), C=2*Math.PI*42, done=p>=1, o=tdOpen();
    const ts=taskState(), dn=ts.filter(t=>t.done).length, wsx=weeklyState(), wn=wsx.filter(t=>t.done).length, L=tasksList();
    /* Tablet/PC: drei Ringe für die Tagesaufgaben, daneben die Wochenaufgaben (die Leiste oben gilt nur für Handy) */
    const R3=2*Math.PI*18;
    const ring=t=>`<div class="g-r3${t.done?' ok':''}" data-h="${esc(t.h)}" tabindex="0"><svg viewBox="0 0 44 44" width="64" height="64" role="img" aria-label="${esc(t.t)}: ${t.v} von ${t.max}"><circle class="t" cx="22" cy="22" r="18"/><circle class="v" cx="22" cy="22" r="18" stroke-dasharray="${(R3*Math.min(1,t.v/t.max)).toFixed(1)} ${R3.toFixed(1)}" transform="rotate(-90 22 22)"/><text x="22" y="26" text-anchor="middle">${t.v}/${t.max}</text></svg><em>${esc(t.t.replace(/^\d+ /,''))}</em></div>`;
    const chev=r=>`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${r?'m15 6-6 6 6 6':'m9 6 6 6-6 6'}"/></svg>`;
    const d3=`<div class="g-d3"><div class="g-d3h"><span class="g-d3t"><h6>Heute</h6></span><button type="button" class="g-rk" onclick="NAV.go('v-rank','Ranking')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>Ranking</button></div><div class="g-sl"><div class="g-trk"><div class="g-top"><div class="g-rs">${ts.map(ring).join('')}</div><button type="button" class="g-wsum${wn===wsx.length?' ok':''}" aria-label="Wochenaufgaben anzeigen" onclick="GAME.wk(this)"><b>${wn}/${wsx.length}</b><em>Woche</em>${chev(0)}</button></div><div class="g-w3" id="g-w3"><div class="g-wr"><div class="g-rs">${wsx.map(ring).join('')}</div><button type="button" class="g-wsum g-wback" aria-label="Zurück zu Heute" onclick="GAME.wk(this)"><b>${dn}/${ts.length}</b><em>Heute</em>${chev(1)}</button></div><div class="g-wl"><h6>Diese Woche</h6>${wsx.map(t=>`<div class="r${t.done?' ok':''}" data-h="${esc(t.h)}" tabindex="0"><span>${esc(t.t)}</span><b>${t.v}/${t.max}</b></div>`).join('')}</div></div></div></div></div>`;
    return `<div class="g-today${o?' open':''}" id="g-today"><button type="button" class="g-tbar${done?' ok':''}" aria-expanded="${o}" aria-controls="g-more" onclick="GAME.tdToggle()">`+
      `<span class="g-rg"><svg viewBox="0 0 100 100" width="38" height="38" aria-hidden="true"><circle cx="50" cy="50" r="42" class="g-rg-t"/><circle cx="50" cy="50" r="42" class="g-rg-v" stroke-dasharray="${(C*p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 50 50)"/></svg><b>${min}</b></span>`+
      `<span class="g-bt"><span><b>Heute ${dn}/${ts.length}</b> <em>· Woche ${wn}/${wsx.length}</em></span><small>${done?'Tagesziel geschafft':min+' von '+gm+' min'}</small></span>`+
      `<svg class="g-tdc" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>`+
      `<div class="g-more" id="g-more"${o?'':' hidden'}><div class="g-td"><div><div class="g-td-h"><b>Heute</b><span>${dn}/${ts.length} · je +${TASK_XP} XP</span></div><ul class="g-tasks">${L.d}</ul></div>`+
      `<div><div class="g-td-h"><b>Diese Woche</b><span>${wn}/${wsx.length} · je +50 XP</span></div><ul class="g-tasks">${L.w}</ul></div></div>`+
      `<div class="g-tlinks"><button type="button" class="g-lk" onclick="NAV.go('v-rank','Ranking')">Ranking</button></div></div>`+d3+`</div>`;
  }
  function homeHtml(){ return load().off?{chip:'',panel:'',rank:''}:{rank:rankLabel(),chip:chip(),panel:`<div class="g-panel" id="g-panel" hidden>${panel()}</div>`}; }
  let _open=false;
  function toggle(btn){
    const p=document.getElementById('g-panel'); if(!p) return;
    _open=p.hidden; p.hidden=!_open;
    (btn||document.getElementById('g-chip')).setAttribute('aria-expanded',String(_open));
    if(_open){ p.innerHTML=panel(); if(p.animate&&!reduced()) p.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'none'}],{duration:200,easing:'ease-out'}); }
  }
  function openRank(){ if(typeof NAV!=='undefined') NAV.go('v-game','Rang & Abzeichen'); setTimeout(()=>{ const c=document.querySelector('#game-body .g-lr.cur'); if(c) c.scrollIntoView({block:'center',behavior:reduced()?'auto':'smooth'}); },350); }
  function open(){ const p=document.getElementById('g-panel'); if(p&&p.hidden) toggle(); }
  function close(){ const p=document.getElementById('g-panel'); if(p&&!p.hidden) toggle(); }
  function refresh(){
    const p=document.getElementById('g-panel'), c=document.getElementById('g-chip');
    if(p&&!p.hidden) p.innerHTML=panel();
    const rl=document.querySelector('.g-rklab'); if(rl) rl.outerHTML=rankLabel();
    try{ ACCOUNT.refreshGame(); }catch(e){}
    const hs=document.querySelector('#m-gameslot .g-hero'); if(hs) hs.outerHTML=heroHtml();
    const td=document.getElementById('g-today'); if(td) td.outerHTML=todayHtml();
    if(c){ const st=streak(); c.querySelector('b').textContent=st.cur; c.querySelector('.g-fl').classList.toggle('on',st.cur>0&&st.todayDone); c.classList.toggle('on',st.cur>0); c.classList.toggle('risk',!!st.risk); }
  }
  // Android-App: Startsymbol je Serienzustand (ab 18/21 Uhr schwächere Flamme, mit Serien-Schutz zusätzlich ein Schild, bei langer Serie Glut/Funken/Ring); Serie, letzten Lerntag und Schutz melden
  let iconT=0;
  function pushIcon(){
    clearTimeout(iconT);
    iconT=setTimeout(()=>{
      if(!window.BVIAndroid||!BVIAndroid.setStreak) return;
      try{
        const st=streak(), y=new Date(); y.setDate(y.getDate()-1);
        BVIAndroid.setStreak(load().off?0:st.cur, st.cur>0?(st.todayDone?today():dkey(y)):'', st.have>0?1:0);
      }catch(e){}
    },800);
  }
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') pushIcon(); });
  setTimeout(pushIcon,3000);
  function setOff(off){ load().off=off?1:0; save(); pushIcon(); if(typeof SHELL!=='undefined'&&document.getElementById('v-home')?.classList.contains('active')) SHELL.renderHome(); }
  function isOn(){ return !load().off; }

  function renderGame(){
    const el=document.getElementById('game-body'); if(!el) return;
    const s=load(), r=rankOf(s.xp), unlocked=BADGES.filter(b=>s.badges[b.id]);
    const ladder=['md','gd','hd'].map(k=>{ const g=GROUPS[k]; return `<div class="g-lg"><div class="g-lgh" style="color:${g.c}">${g.n} (${g.s})</div>${RANKS.filter(x=>x.g===k).map(x=>`<div class="g-lr${x.i===r.i?' cur':''}${x.xp>s.xp?' lock':''}">${shoulder(x,46)}<span class="g-lrn">${esc(x.n)}</span><span class="g-lrx">${x.xp} P.</span></div>`).join('')}</div>`; }).join('');
    const titles=unlocked.length?unlocked.map(b=>`<button type="button" class="g-tt-b${s.title===b.t?' on':''}" onclick="GAME.setTitle('${b.t}')">${esc(b.t)}</button>`).join(''):'<p class="g-empty">Noch kein Titel. Jedes Abzeichen schaltet einen Titel frei.</p>';
    const grid=BADGES.map(b=>{ const got=s.badges[b.id]; return `<div class="g-bd${got?' got':''}"><span class="g-bdi">${svg(b.ic,24)}</span><b>${esc(b.n)}</b><span>${esc(b.d)}</span>${got?`<em>Titel: ${esc(b.t)}</em>`:''}</div>`; }).join('');
    el.innerHTML=`<div class="g-card"><div class="g-rank"><span class="g-rk-ic">${shoulder(r,76)}</span><span class="g-rk-t"><b>${esc(r.n)}</b><span style="color:${GROUPS[r.g].c}">${GROUPS[r.g].n}${s.title?' · '+esc(s.title):''}</span></span><span class="g-xp">${s.xp}<small> Punkte</small></span></div></div>

      <h2 class="g-h2">Dienstgrade</h2><div class="g-card g-ladder">${ladder}</div>
      <h2 class="g-h2">Titel</h2><div class="g-card"><div class="g-titles">${titles}</div></div>
      <h2 class="g-h2">Abzeichen · ${unlocked.length}/${BADGES.length}</h2><div class="g-badges">${grid}</div>`;
  }
  /* Ranking-Baustein (js/rank.js) erst bei Bedarf laden */
  let rankP=null;
  function rankLoad(){
    if(typeof RANK!=='undefined') return Promise.resolve(RANK);
    return rankP||(rankP=new Promise((ok,fail)=>{ const s=document.createElement('script'); s.src='js/rank.js'; s.onload=()=>ok(RANK); s.onerror=()=>{ rankP=null; fail(); }; document.body.appendChild(s); }));
  }
  const rankOn=()=>{ try{ return !!localStorage.getItem('bvi_rank'); }catch(e){ return false; } };
  setTimeout(()=>{ if(rankOn()) rankLoad().then(R=>R.report()).catch(()=>{}); },8000);
  function setTitle(t){ const s=load(); if(BADGES.some(b=>b.t===t&&s.badges[b.id])){ s.title=t; save(); renderGame(); } }

  const DAYN=['Mo','Di','Mi','Do','Fr','Sa','So'];
  function weekText(){
    const s=load(), w=weekSum(), st=streak(), r=rankOf(s.xp), secs=(typeof USAGE!=='undefined')?USAGE.week().reduce((a,b)=>a+b,0):0;
    const min=Math.round(secs/60), lt=min>=60?Math.floor(min/60)+' Std. '+(min%60)+' Min.':min+' Min.';
    return `Meine Lernwoche (B VI – Höherer Dienst)\nLernzeit: ${lt}\nLernkarten: ${w.cards} · Prüfungsfragen richtig: ${w.quizOk}\nSerie: ${st.cur} ${st.cur===1?'Tag':'Tage'}\nRang: ${r.n}${s.title?' · '+s.title:''} (${s.xp} Punkte)\nhttps://flametan.github.io/BVI-Lernwebsite/`;
  }
  /* Wochen-Rückblick als Bild im Story-Format (1080 × 1920) – passend für WhatsApp-Status, Instagram und andere Apps */
  function weekData(){
    const s=load(), w=weekSum(), st=streak(), r=rankOf(s.xp);
    const use=(typeof USAGE!=='undefined')?USAGE.week():[0,0,0,0,0,0,0], secs=use.reduce((a,b)=>a+b,0), min=Math.round(secs/60);
    const lt=min>=60?Math.floor(min/60)+' Std. '+(min%60)+' Min.':min+' Min.';
    const k=weekKeys(), f=x=>{ const [y,m,d]=x.split('-'); return d+'.'+m+'.'; };
    return {s,w,st,r,use,lt,range:f(k[0])+' – '+f(k[6])+k[6].slice(0,4)};
  }
  function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
  async function weekImage(){
    const d=weekData(), W=1080, H=1920, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const c=cv.getContext('2d'), cs=getComputedStyle(document.documentElement);
    const acc=(cs.getPropertyValue('--m-accent')||'#FFA412').trim()||'#FFA412', g=GROUPS[d.r.g];
    const FONT='system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    const bg=c.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#1d1d1d'); bg.addColorStop(1,'#0b0b0b'); c.fillStyle=bg; c.fillRect(0,0,W,H);
    const gl=c.createRadialGradient(W/2,0,0,W/2,0,900); gl.addColorStop(0,acc+'55'); gl.addColorStop(1,'transparent'); c.fillStyle=gl; c.fillRect(0,0,W,H);
    c.textBaseline='alphabetic'; c.fillStyle='#fff';
    c.font='700 40px '+FONT; c.fillStyle=acc; c.fillText('B VI – HÖHERER DIENST',80,150);
    c.fillStyle='#fff'; c.font='800 104px '+FONT; c.fillText('Meine Lernwoche',80,280);
    c.fillStyle='#9a9a9a'; c.font='500 40px '+FONT; c.fillText(d.range,80,345);
    // Rang
    rr(c,80,420,920,260,36); c.fillStyle='#262626'; c.fill();
    try{
      const im=new Image(); im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(shoulderSvg(d.r,360,246));
      await im.decode(); c.drawImage(im,100,477,220,150);
    }catch(e){ const sx=120, sy=490, sw=200, sh=120; rr(c,sx,sy,sw,sh,16); c.fillStyle=g.c+'3d'; c.fill(); c.lineWidth=7; c.strokeStyle=g.c; c.stroke(); }
    c.fillStyle='#fff'; c.font='800 58px '+FONT; c.fillText(d.r.n,360,535);
    c.fillStyle=g.c; c.font='600 38px '+FONT; c.fillText(g.n+(d.s.title?' · '+d.s.title:''),360,590);
    c.fillStyle='#9a9a9a'; c.font='500 34px '+FONT; c.fillText(d.s.xp+' Punkte',360,640);
    // Balken
    const mx=Math.max(60,...d.use), bx=80, bw=920, by=1060, bh=170, gap=22, wd=(bw-gap*6)/7;
    c.fillStyle='#9a9a9a'; c.font='600 34px '+FONT; c.fillText('Lernzeit pro Tag',80,745); c.fillStyle='#fff'; c.font='800 84px '+FONT; c.fillText(d.lt,80,835);
    d.use.forEach((v,i)=>{ const h=Math.max(8,Math.round(v/mx*bh)), x=bx+i*(wd+gap); rr(c,x,by-h,wd,h,14); c.fillStyle=v>0?acc:'#333'; c.fill(); c.fillStyle='#9a9a9a'; c.font='600 30px '+FONT; c.textAlign='center'; c.fillText(DAYN[i],x+wd/2,by+46); c.textAlign='left'; });
    // Kacheln
    const T=[[d.w.cards,'Lernkarten'],[d.w.quizOk,'Prüfungsfragen richtig'],[d.st.cur,d.st.cur===1?'Tag Serie':'Tage Serie'],[Object.keys(d.s.badges).length,'Abzeichen']];
    T.forEach((t,i)=>{ const x=80+(i%2)*470, y=1170+Math.floor(i/2)*260; rr(c,x,y,450,230,32); c.fillStyle='#262626'; c.fill(); c.fillStyle='#fff'; c.font='800 96px '+FONT; c.fillText(String(t[0]),x+36,y+120); c.fillStyle='#9a9a9a'; c.font='500 36px '+FONT; c.fillText(t[1],x+36,y+182); });
    c.fillStyle='#9a9a9a'; c.font='500 36px '+FONT; c.textAlign='center'; c.fillText('flametan.github.io/BVI-Lernwebsite',W/2,1800); c.textAlign='left';
    return new Promise(res=>cv.toBlob(b=>res(b),'image/png'));
  }
  let _blob=null, _url='';
  function renderWeek(){
    const el=document.getElementById('week-body'); if(!el) return;
    const d=weekData(), s=d.s, w=d.w, pw=weekSum(-1), st=d.st, r=d.r;
    const bars=d.use.map((v,i)=>`<span class="g-wb"><i style="height:${Math.round(v/Math.max(60,...d.use)*100)}%"></i><em>${DAYN[i]}</em></span>`).join('');
    const delta=(a,b)=>b?(a>=b?'▲ ':'▼ ')+Math.abs(a-b):'';
    el.innerHTML=`<div class="g-card g-wk"><div class="g-rank"><span class="g-rk-ic">${shoulder(r,46)}</span><span class="g-rk-t"><b>${esc(r.n)}</b><span style="color:${GROUPS[r.g].c}">${GROUPS[r.g].n}${s.title?' · '+esc(s.title):''}</span></span></div>
      <div class="g-wbars" role="img" aria-label="Lernzeit pro Wochentag">${bars}</div>
      <div class="g-stats"><div><b>${d.lt}</b><span>Lernzeit</span></div><div><b>${w.cards}</b><span>Lernkarten <small>${delta(w.cards,pw.cards)}</small></span></div><div><b>${w.quizOk}</b><span>Quiz richtig <small>${delta(w.quizOk,pw.quizOk)}</small></span></div><div><b>${st.cur}</b><span>Tage Serie</span></div></div></div>
      <h2 class="g-h2">Bild zum Teilen</h2>
      <div class="g-card g-shcard"><img class="g-wimg" id="g-wimg" alt="Vorschau des Wochen-Rückblicks als Bild" width="270" height="480"><div class="g-share"><button type="button" class="g-btn" onclick="GAME.share(this)">Teilen</button><button type="button" class="g-btn alt" onclick="GAME.saveImg(this)">Bild speichern</button></div><span class="g-sh-msg" aria-live="polite"></span><p class="g-empty">Das Bild passt als Status oder Story. Bei „Teilen“ wählst du WhatsApp, Instagram oder eine andere App.</p></div>`;
    _blob=null;
    weekImage().then(b=>{ _blob=b; if(!b) return; if(_url) URL.revokeObjectURL(_url); _url=URL.createObjectURL(b); const im=document.getElementById('g-wimg'); if(im) im.src=_url; });
  }
  function note(btn,m,ok){
    const msg=btn&&btn.closest&&btn.closest('.g-shcard')&&btn.closest('.g-shcard').querySelector('.g-sh-msg');
    if(msg){ msg.textContent=m; clearTimeout(note._t); note._t=setTimeout(()=>{ msg.textContent=''; },5000); }
    if(m&&typeof TOAST!=='undefined') TOAST.show(m,ok?{type:'ok'}:undefined);
  }
  const b64=blob=>new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(String(r.result).split(',')[1]||''); r.onerror=()=>res(''); r.readAsDataURL(blob); });
  const nat=fn=>typeof window.BVIAndroid!=='undefined'&&window.BVIAndroid&&typeof window.BVIAndroid[fn]!=='undefined';
  async function share(btn){
    note(btn,'Bild wird vorbereitet …');
    try{
      const blob=_blob||await weekImage(), txt=weekText();
      // Android-App: eigenes Teilen-Menü über die App
      if(nat('shareImage')){
        const ok=BVIAndroid.shareImage('lernwoche.png',await b64(blob),'Meine Lernwoche in der B-VI-App');
        note(btn,ok?'Teilen-Menü wird geöffnet …':'Teilen fehlgeschlagen. Bitte Speicherzugriff erlauben und erneut tippen.',ok); return;
      }
      const file=new File([blob],'lernwoche.png',{type:'image/png'});
      try{
        if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],title:'Meine Lernwoche',text:'Meine Lernwoche in der B-VI-App'}); note(btn,'Geteilt',true); return; }
        if(navigator.share){ await navigator.share({title:'Meine Lernwoche',text:txt}); note(btn,'Geteilt',true); return; }
      }catch(e){ if(e&&e.name==='AbortError'){ note(btn,''); return; } }
      // Ältere App-Version oder Browser ohne Teilen: Text kopieren und Hinweis geben
      let copied=false;
      try{ await navigator.clipboard.writeText(txt); copied=true; }catch(e){}
      note(btn,(copied?'Text kopiert. ':'')+(window.BVIAndroid?'Zum Teilen des Bildes bitte die App aktualisieren.':'Dein Gerät kann Bilder hier nicht teilen. Nutze „Bild speichern“.'),copied);
    }catch(e){ note(btn,'Teilen fehlgeschlagen'); }
  }
  async function saveImg(btn){
    try{
      const blob=_blob||await weekImage();
      if(nat('saveImage')){
        const ok=BVIAndroid.saveImage('lernwoche.png',await b64(blob));
        note(btn,ok?'Bild in der Galerie gespeichert (Ordner Bilder/B VI)':'Speichern fehlgeschlagen. Bitte Speicherzugriff erlauben und erneut tippen.',ok); return;
      }
      if(window.BVIAndroid){ note(btn,'Zum Speichern des Bildes bitte die App aktualisieren.'); return; }
      const u=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=u; a.download='lernwoche.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000);
      note(btn,'Bild gespeichert',true);
    }catch(e){ note(btn,'Speichern fehlgeschlagen'); }
  }

  function onShow(id){
    if(id==='v-game') renderGame(); else if(id==='v-week') renderWeek();
    else if(id==='v-rank'){ const b=document.getElementById('rank-body'); if(b) rankLoad().then(R=>R.mount(b)).catch(()=>{ b.innerHTML='<p class="rk-msg err">Ranking konnte nicht geladen werden. Bitte Verbindung prüfen.</p>'; }); }
  }
  /* Handy: Tippen auf „Woche“ schiebt die Wochenaufgaben (auch als Ringe) von rechts in die Karte, Tippen auf „Heute“ zurück */
  /* Tooltip: Maus = Hover, Tastatur = Fokus, Touch = Tippen (schliesst nach 3,5 s oder beim nächsten Tippen) */
  let tipEl=null,tipFor=null,tipTimer=0;
  function tipHide(){ clearTimeout(tipTimer); tipFor=null; if(tipEl) tipEl.classList.remove('on'); }
  function tipShow(el){
    const h=el.getAttribute('data-h'); if(!h) return;
    if(!tipEl){ tipEl=document.createElement('div'); tipEl.className='g-tip'; tipEl.setAttribute('role','tooltip'); document.body.appendChild(tipEl); }
    tipEl.textContent=h; tipFor=el;
    tipEl.style.maxWidth=Math.min(240,innerWidth-16)+'px';
    const r=el.getBoundingClientRect(), tw=tipEl.offsetWidth, th=tipEl.offsetHeight;
    let top=r.top-th-8; if(top<8) top=r.bottom+8;
    const left=Math.max(8,Math.min(innerWidth-tw-8,r.left+r.width/2-tw/2));
    tipEl.style.top=top+'px'; tipEl.style.left=left+'px';
    tipEl.classList.add('on');
  }
  const tipTarget=e=>e.target.closest&&e.target.closest('.g-r3[data-h],.g-wl .r[data-h]');
  document.addEventListener('pointerover',e=>{ if(e.pointerType!=='mouse') return; const el=tipTarget(e); if(el) tipShow(el); });
  document.addEventListener('pointerout',e=>{ if(e.pointerType==='mouse'&&tipTarget(e)) tipHide(); });
  document.addEventListener('focusin',e=>{ const el=tipTarget(e); if(el&&el.matches(':focus-visible')) tipShow(el); });
  document.addEventListener('focusout',e=>{ if(tipTarget(e)) tipHide(); });
  document.addEventListener('click',e=>{
    const el=tipTarget(e);
    if(!el){ tipHide(); return; }
    if(e.pointerType==='mouse'||(e.detail===0)) return;
    if(tipFor===el){ tipHide(); return; }
    tipShow(el); clearTimeout(tipTimer); tipTimer=setTimeout(tipHide,3500);
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') tipHide(); });
  window.addEventListener('scroll',tipHide,{passive:true,capture:true});
  function wk(btn){ tipHide(); const d=btn.closest('.g-d3'); if(!d) return; const o=d.classList.toggle('wo'); const h=d.querySelector('.g-d3t h6'); if(h) h.textContent=o?'Diese Woche':'Heute'; }
  return {wk,tdToggle,todayHtml,isoWeek,weeklyState,weekSum,heroHtml,shoulder,rankOf,barHtml,event,cheer,setSmall,isSmall,homeHtml,toggle,openRank,open,close,refresh,setOff,isOn,setTitle,share,saveImg,onShow,renderGame,renderWeek,_state:load,_ranks:RANKS,_badges:BADGES,_streak:streak,_tasks:taskState};
})();
