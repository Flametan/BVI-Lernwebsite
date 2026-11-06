/* ======================================================================
   GAME – Belohnungen: Punkte, Dienstgrade, Abzeichen, Titel, Tagesaufgaben,
   Combo, Einsatz-Alarm, Lernpfad und Wochen-Rückblick.
   Alles bleibt auf dem Gerät (localStorage „bvi_game“) und wird mit der Sicherung gespeichert.
====================================================================== */
const GAME=(function(){
  const KEY='bvi_game';
  const pad=n=>String(n).padStart(2,'0');
  const dkey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const today=()=>dkey(new Date());
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const reduced=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Dienstgrade nach der Wikipedia-Übersicht (Berufsfeuerwehr NRW), nach Laufbahngruppe geordnet */
  const GROUPS={md:{n:'Mittlerer Dienst',s:'mD',c:'#e5484d'},gd:{n:'Gehobener Dienst',s:'gD',c:'#b9c2cf'},hd:{n:'Höherer Dienst',s:'hD',c:'#f0b83a'}};
  const RANKS=[
    {n:'Brandmeister',g:'md',xp:0},{n:'Oberbrandmeister',g:'md',xp:120},{n:'Hauptbrandmeister',g:'md',xp:350},
    {n:'Brandinspektor',g:'gd',xp:750},{n:'Brandoberinspektor',g:'gd',xp:1400},{n:'Brandamtmann',g:'gd',xp:2400},
    {n:'Brandrat',g:'hd',xp:3800},{n:'Oberbrandrat',g:'hd',xp:5800},{n:'Branddirektor',g:'hd',xp:8800},{n:'Leitender Branddirektor',g:'hd',xp:13000}
  ];
  RANKS.forEach((r,i)=>{ r.i=i; r.pip=RANKS.filter(x=>x.g===r.g&&x.i<=i).length; });

  const TASKS=[
    {id:'cards',t:'10 Lernkarten üben',max:10,get:(d)=>d.cards||0},
    {id:'quiz',t:'5 Quizfragen richtig',max:5,get:(d)=>d.quizOk||0},
    {id:'time',t:'10 Minuten lernen',max:10,get:()=>Math.floor((typeof USAGE!=='undefined'?USAGE.today():0)/60)}
  ];
  const TASK_XP=25, ALARM_GOAL=40, ALARM_XP=60;

  const IC={
    flame:'<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .2 1.6 1 2.3 2 2.3C10.5 9 11 6 12 3z"/>',
    card:'<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 10h16"/>',
    check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    bolt:'<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
    truck:'<path d="M2.5 16V7h10v9M12.5 10h4.5l3 3v3h-7.5"/><circle cx="7" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
    star:'<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9-4.3-4.1 5.9-.8z"/>',
    bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'
  };
  const svg=(k,sz=22)=>`<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]||IC.star}</svg>`;

  /* Abzeichen: jedes schaltet einen Titel frei */
  const BADGES=[
    {id:'k1',n:'Erste Karte',d:'Eine Lernkarte bewerten',ic:'card',t:'Frischling',ok:s=>s.tot.cards>=1},
    {id:'k100',n:'Kartenprofi',d:'100 Lernkarten bewerten',ic:'card',t:'Kartenmeister',ok:s=>s.tot.cards>=100},
    {id:'q100',n:'Klausurprofi',d:'100 Quizfragen richtig beantworten',ic:'check',t:'Klausurprofi',ok:s=>s.tot.quizOk>=100},
    {id:'s3',n:'Dranbleiber',d:'3 Tage in Folge lernen',ic:'flame',t:'Dranbleiber',ok:s=>s.streak.best>=3},
    {id:'s7',n:'Wochenläufer',d:'7 Tage in Folge lernen',ic:'flame',t:'Wochenläufer',ok:s=>s.streak.best>=7},
    {id:'s30',n:'Dauerläufer',d:'30 Tage in Folge lernen',ic:'flame',t:'Dauerläufer',ok:s=>s.streak.best>=30},
    {id:'c10',n:'Treffsicher',d:'10 Antworten in Folge richtig',ic:'bolt',t:'Treffsicher',ok:s=>s.tot.combo>=10},
    {id:'f1',n:'Hilfsfrist geschafft',d:'Eine Einsatzfahrt rechtzeitig beenden',ic:'truck',t:'Blaulicht',ok:s=>s.tot.fahrt>=1},
    {id:'t3',n:'Tagessieger',d:'Alle drei Tagesaufgaben an einem Tag erledigen',ic:'sun',t:'Tagessieger',ok:s=>s.tot.allTasks>=1},
    {id:'a1',n:'Alarm bestanden',d:'Einen Einsatz-Alarm der Woche schaffen',ic:'bell',t:'Alarmbereit',ok:s=>s.tot.alarm>=1},
    {id:'r4',n:'Gehobener Dienst',d:'Den Rang Brandinspektor erreichen',ic:'star',t:'Aufsteiger',ok:s=>rankOf(s.xp).i>=3},
    {id:'r7',n:'Höherer Dienst',d:'Den Rang Brandrat erreichen',ic:'star',t:'Führungskraft',ok:s=>rankOf(s.xp).i>=6}
  ];

  let queue=[], showing=false, combo=0, ST=null;

  function blank(){ return {xp:0,days:{},badges:{},title:'',done:{},tot:{cards:0,quizOk:0,fahrt:0,combo:0,allTasks:0,alarm:0},alarm:{},path:0,off:0}; }
  function load(){
    if(ST) return ST;
    let j=null; try{ j=JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){}
    ST=Object.assign(blank(),j&&typeof j==='object'&&!Array.isArray(j)?j:{});
    ST.tot=Object.assign(blank().tot,ST.tot||{});
    ['days','badges','done','alarm'].forEach(k=>{ if(!ST[k]||typeof ST[k]!=='object') ST[k]={}; });
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

  function streak(){
    const s=load(), use=(typeof USAGE!=='undefined'&&USAGE.days)?USAGE.days():{};
    const act=k=>((s.days[k]&&s.days[k].xp>0)||(use[k]||0)>=60);
    const d=new Date(); let cur=0;
    if(!act(dkey(d))) d.setDate(d.getDate()-1);
    while(act(dkey(d))&&cur<2000){ cur++; d.setDate(d.getDate()-1); }
    const ks=new Set([...Object.keys(s.days),...Object.keys(use)].filter(act)), arr=[...ks].sort();
    let best=0,run=0,prev=null;
    for(const k of arr){
      const [y,m,dd]=k.split('-').map(Number), t=new Date(y,m-1,dd);
      if(prev&&Math.round((t-prev)/864e5)===1) run++; else run=1;
      best=Math.max(best,run); prev=t;
    }
    return {cur,best:Math.max(best,cur),todayDone:act(today())};
  }

  function weekKeys(offset=0){
    const mo=new Date(); mo.setDate(mo.getDate()-((mo.getDay()+6)%7)+offset*7);
    return Array.from({length:7},(_,i)=>{ const x=new Date(mo); x.setDate(mo.getDate()+i); return dkey(x); });
  }
  function weekSum(offset=0){
    const s=load(), a={xp:0,cards:0,quiz:0,quizOk:0};
    weekKeys(offset).forEach(k=>{ const d=s.days[k]; if(d){ a.xp+=d.xp||0; a.cards+=d.cards||0; a.quiz+=d.quiz||0; a.quizOk+=d.quizOk||0; } });
    return a;
  }

  function taskState(){
    const rec=load().days[today()]||{};
    return TASKS.map(t=>{ const v=Math.min(t.max,t.get(rec)); return {id:t.id,t:t.t,v,max:t.max,done:v>=t.max}; });
  }

  /* ── Toast als „Gooey Drop“: ein Tropfen fällt vom oberen Rand und wird zur Meldung ── */
  function ensureHost(){
    let h=document.getElementById('g-host'); if(h) return h;
    h=document.createElement('div'); h.id='g-host'; h.setAttribute('aria-live','polite');
    h.innerHTML='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="g-goo" x="-20%" y="-50%" width="140%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></defs></svg><div class="g-goo"><i class="g-src"></i><div class="g-drop" role="status"></div></div>';
    document.body.appendChild(h); return h;
  }
  function pump(){
    if(showing||!queue.length) return;
    showing=true;
    const m=queue.shift(), h=ensureHost(), drop=h.querySelector('.g-drop'), goo=h.querySelector('.g-goo');
    drop.innerHTML=`<span class="g-di">${svg(m.ic,20)}</span><span class="g-dt"><b>${esc(m.t)}</b><span>${esc(m.s||'')}</span></span>`;
    h.classList.add('on');
    let over=false;
    const end=()=>{ if(over) return; over=true; h.classList.remove('on'); drop.onclick=null; showing=false; setTimeout(pump,250); };
    // Antippen öffnet Rang & Abzeichen und springt zum aktuellen Dienstgrad
    drop.setAttribute('role','button'); drop.setAttribute('tabindex','0'); drop.setAttribute('aria-label',m.t+'. Öffnet Rang und Abzeichen');
    const openRank=()=>{ if(over) return; drop.getAnimations().forEach(x=>x.cancel()); drop.style.opacity='0'; end(); openRank(); };
    drop.onclick=openRank; drop.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openRank(); } };
    drop.style.opacity='';
    if(reduced()||!drop.animate){ goo.style.filter='none'; drop.style.opacity='1'; setTimeout(()=>{ if(over) return; drop.style.opacity='0'; end(); },3200); return; }
    goo.style.filter='url(#g-goo)';
    const a=drop.animate([
      {transform:'translate(-50%,-34px) scale(.18,.18)',opacity:1},
      {transform:'translate(-50%,6px) scale(.9,1.12)',opacity:1,offset:.45},
      {transform:'translate(-50%,16px) scale(1.04,.96)',opacity:1,offset:.62},
      {transform:'translate(-50%,14px) scale(1,1)',opacity:1}
    ],{duration:620,easing:'cubic-bezier(.3,.1,.3,1)',fill:'forwards'});
    a.onfinish=()=>{
      goo.style.filter='none';
      setTimeout(()=>{
        if(over) return;
        goo.style.filter='url(#g-goo)';
        const b=drop.animate([{transform:'translate(-50%,14px) scale(1,1)',opacity:1},{transform:'translate(-50%,-30px) scale(.16,.16)',opacity:1}],{duration:420,easing:'cubic-bezier(.5,0,.8,.4)',fill:'forwards'});
        b.onfinish=()=>{ drop.style.opacity='0'; drop.getAnimations().forEach(x=>x.cancel()); end(); };
      },2600);
    };
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
    // Einsatz-Alarm
    const wk=weekKeys()[0], w=weekSum();
    if(w.cards+w.quiz>=ALARM_GOAL&&!s.alarm[wk]){ s.alarm[wk]=1; s.tot.alarm++; s.xp+=ALARM_XP; rec.xp+=ALARM_XP; toast('Einsatz-Alarm bestanden','Wochenziel erreicht · +'+ALARM_XP+' Punkte','bell'); confetti(); }
    // Abzeichen
    const ctx=context();
    BADGES.forEach(b=>{ if(!s.badges[b.id]&&b.ok(ctx)){ s.badges[b.id]=Date.now(); toast('Neues Abzeichen: '+b.n,'Titel „'+b.t+'“ freigeschaltet',b.ic); if(!s.title) s.title=b.t; } });
  }
  function event(type,ok){
    try{
      const s=load(), pre=rankOf(s.xp), rec=dayRec(today());
      let gain=0;
      if(type==='card'){ if(ok){ gain=2; rec.cards++; s.tot.cards++; } }
      else if(type==='quiz'){ rec.quiz++; if(ok){ gain=3; rec.quizOk++; s.tot.quizOk++; } else gain=1; }
      else if(type==='fahrt'){ gain=20; if(ok) s.tot.fahrt++; }
      if(type==='card'||type==='quiz'){
        if(ok){ combo++; s.tot.combo=Math.max(s.tot.combo,combo); if(combo>=5&&combo%5===0){ comboPill(combo); if(combo%10===0) confetti(); } }
        else combo=0;
      }
      s.xp+=gain; rec.xp+=gain;
      evaluate();
      const post=rankOf(s.xp);
      if(post.i>pre.i) toast('Beförderung: '+post.n,GROUPS[post.g].n+' · '+s.xp+' Punkte','star'), confetti();
      save(); refresh();
    }catch(e){}
  }

  /* ── Darstellung ── */
  function shoulder(r,sz=34){
    const g=GROUPS[r.g], pips=Array.from({length:r.pip},(_,i)=>`<i style="background:${g.c}"></i>`).join('');
    return `<span class="g-sh" style="--gc:${g.c};width:${sz}px;height:${Math.round(sz*.7)}px" aria-hidden="true">${pips}</span>`;
  }
  function flameIc(sz){ return svg('flame',sz); }

  function chip(){
    const s=load(), st=streak(), r=rankOf(s.xp);
    return `<button type="button" class="g-chip${st.cur>0?' on':''}" id="g-chip" aria-expanded="false" aria-controls="g-panel" aria-label="Belohnungen: ${st.cur} Tage Serie, ${esc(r.n)}" onclick="GAME.toggle(this)"><span class="g-fl${st.cur>0?' on':''}">${flameIc(15)}</span><b>${st.cur}</b></button>`;
  }
  function pathNext(){
    if(typeof MODS==='undefined'||typeof PROGRESS==='undefined') return null;
    const cnt=PROGRESS.counts(); let best=null;
    MODS.forEach(m=>{ const c=cnt[m[0]]||{done:0,total:0}; if(!c.total||c.done>=c.total) return; const p=c.done/c.total; if(!best||p<best.p) best={p,m,c}; });
    return best;
  }
  function panel(){
    const s=load(), st=streak(), r=rankOf(s.xp), nx=nextRank(r), g=GROUPS[r.g];
    const pct=nx?Math.round((s.xp-r.xp)/(nx.xp-r.xp)*100):100;
    const tasks=taskState().map(t=>`<li class="${t.done?'ok':''}"><span class="g-tk">${t.done?svg('check',14):''}</span><span class="g-tt">${esc(t.t)}</span><span class="g-tv">${t.v}/${t.max}</span></li>`).join('');
    const w=weekSum(), al=Math.min(ALARM_GOAL,w.cards+w.quiz), alDone=!!s.alarm[weekKeys()[0]];
    const pn=s.path?pathNext():null;
    const pathRow=s.path
      ?`<div class="g-row g-path"><span class="g-ri">${svg('bolt',18)}</span><span class="g-rt"><b>Lernpfad</b><span>${pn?`Als Nächstes: ${esc(pn.m[1])} · ${pn.c.done}/${pn.c.total} Themen`:'Alles geschafft'}</span></span>${pn?`<button type="button" class="g-go" onclick="NAV.go(${esc(JSON.stringify(pn.m[3]))},${esc(JSON.stringify(pn.m[4]))})">Weiter</button>`:''}<button type="button" class="g-off" aria-label="Lernpfad ausblenden" onclick="GAME.setPath(0)">×</button></div>`
      :`<button type="button" class="g-row g-pathon" onclick="GAME.setPath(1)"><span class="g-ri">${svg('bolt',18)}</span><span class="g-rt"><b>Lernpfad einschalten</b><span>Zeigt dir das Thema mit dem größten Nachholbedarf</span></span></button>`;
    return `<button type="button" class="g-rank g-rank-go" aria-label="Rang und Abzeichen öffnen" onclick="GAME.openRank()"><span class="g-rk-ic">${shoulder(r,46)}</span><span class="g-rk-t"><b>${esc(r.n)}</b><span style="color:${g.c}">${g.n}${s.title?' · '+esc(s.title):''}</span></span><span class="g-xp">${s.xp}<small> Punkte</small></span><svg class="g-chv" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>
      <div class="g-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Fortschritt zum nächsten Rang"><i style="width:${pct}%;background:${g.c}"></i></div>
      <div class="g-sub">${nx?`Noch ${nx.xp-s.xp} Punkte bis ${esc(nx.n)}`:'Höchster Rang erreicht'}</div>
      <div class="g-h">Serie</div>
      <div class="g-row"><span class="g-ri g-fl on">${flameIc(18)}</span><span class="g-rt"><b>${st.cur} ${st.cur===1?'Tag':'Tage'} in Folge</b><span>${st.todayDone?'Heute schon gelernt':'Lerne heute, damit die Serie nicht reißt'} · Rekord ${st.best}</span></span></div>
      <div class="g-h">Tagesaufgaben</div>
      <ul class="g-tasks">${tasks}</ul>
      <div class="g-h">Einsatz-Alarm der Woche</div>
      <div class="g-row"><span class="g-ri">${svg('bell',18)}</span><span class="g-rt"><b>${alDone?'Alarm bestanden':ALARM_GOAL+' Aufgaben bis Sonntag'}</b><span>${al}/${ALARM_GOAL} Karten und Quizfragen · +${ALARM_XP} Punkte</span><span class="g-bar sm"><i style="width:${Math.round(al/ALARM_GOAL*100)}%"></i></span></span></div>
      ${pathRow}
      <div class="g-links"><button type="button" onclick="NAV.go('v-week','Wochen-Rückblick')">Wochen-Rückblick</button></div>`;
  }
  /* Bereich auf der Startseite (Symbol + aufklappbares Feld); bei ausgeschalteten Belohnungen leer */
  function homeHtml(){ return load().off?{chip:'',panel:''}:{chip:chip(),panel:`<div class="g-panel" id="g-panel" hidden>${panel()}</div>`}; }
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
    if(c){ const st=streak(); c.querySelector('b').textContent=st.cur; c.querySelector('.g-fl').classList.toggle('on',st.cur>0); c.classList.toggle('on',st.cur>0); }
  }
  function setPath(on){ load().path=on?1:0; save(); refresh(); }
  function setOff(off){ load().off=off?1:0; save(); if(typeof SHELL!=='undefined'&&document.getElementById('v-home')?.classList.contains('active')) SHELL.renderHome(); }
  function isOn(){ return !load().off; }

  function renderGame(){
    const el=document.getElementById('game-body'); if(!el) return;
    const s=load(), r=rankOf(s.xp), unlocked=BADGES.filter(b=>s.badges[b.id]);
    const ladder=['md','gd','hd'].map(k=>{ const g=GROUPS[k]; return `<div class="g-lg"><div class="g-lgh" style="color:${g.c}">${g.n} (${g.s})</div>${RANKS.filter(x=>x.g===k).map(x=>`<div class="g-lr${x.i===r.i?' cur':''}${x.xp>s.xp?' lock':''}">${shoulder(x,34)}<span class="g-lrn">${esc(x.n)}</span><span class="g-lrx">${x.xp} P.</span></div>`).join('')}</div>`; }).join('');
    const titles=unlocked.length?unlocked.map(b=>`<button type="button" class="g-tt-b${s.title===b.t?' on':''}" onclick="GAME.setTitle('${b.t}')">${esc(b.t)}</button>`).join(''):'<p class="g-empty">Noch kein Titel. Jedes Abzeichen schaltet einen Titel frei.</p>';
    const grid=BADGES.map(b=>{ const got=s.badges[b.id]; return `<div class="g-bd${got?' got':''}"><span class="g-bdi">${svg(b.ic,24)}</span><b>${esc(b.n)}</b><span>${esc(b.d)}</span>${got?`<em>Titel: ${esc(b.t)}</em>`:''}</div>`; }).join('');
    el.innerHTML=`<div class="g-card"><div class="g-rank"><span class="g-rk-ic">${shoulder(r,56)}</span><span class="g-rk-t"><b>${esc(r.n)}</b><span style="color:${GROUPS[r.g].c}">${GROUPS[r.g].n}${s.title?' · '+esc(s.title):''}</span></span><span class="g-xp">${s.xp}<small> Punkte</small></span></div></div>
      <h2 class="g-h2">Dienstgrade</h2><div class="g-card g-ladder">${ladder}</div>
      <h2 class="g-h2">Titel</h2><div class="g-card"><div class="g-titles">${titles}</div></div>
      <h2 class="g-h2">Abzeichen · ${unlocked.length}/${BADGES.length}</h2><div class="g-badges">${grid}</div>`;
  }
  function setTitle(t){ const s=load(); if(BADGES.some(b=>b.t===t&&s.badges[b.id])){ s.title=t; save(); renderGame(); } }

  const DAYN=['Mo','Di','Mi','Do','Fr','Sa','So'];
  function weekText(){
    const s=load(), w=weekSum(), st=streak(), r=rankOf(s.xp), secs=(typeof USAGE!=='undefined')?USAGE.week().reduce((a,b)=>a+b,0):0;
    const min=Math.round(secs/60), lt=min>=60?Math.floor(min/60)+' Std. '+(min%60)+' Min.':min+' Min.';
    return `Meine Lernwoche (B VI – Höherer Dienst)\nLernzeit: ${lt}\nLernkarten: ${w.cards} · Quizfragen richtig: ${w.quizOk}\nSerie: ${st.cur} ${st.cur===1?'Tag':'Tage'}\nRang: ${r.n}${s.title?' · '+s.title:''} (${s.xp} Punkte)\nhttps://flametan.github.io/BVI-Lernwebsite/`;
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
  function weekImage(){
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
    const sx=120, sy=490, sw=200, sh=120; rr(c,sx,sy,sw,sh,16); c.fillStyle=g.c+'3d'; c.fill(); c.lineWidth=7; c.strokeStyle=g.c; c.stroke();
    for(let i=0;i<d.r.pip;i++){ c.beginPath(); c.arc(sx+sw/2+(i-(d.r.pip-1)/2)*46,sy+sh/2,15,0,7); c.fillStyle=g.c; c.fill(); }
    c.fillStyle='#fff'; c.font='800 58px '+FONT; c.fillText(d.r.n,360,535);
    c.fillStyle=g.c; c.font='600 38px '+FONT; c.fillText(g.n+(d.s.title?' · '+d.s.title:''),360,590);
    c.fillStyle='#9a9a9a'; c.font='500 34px '+FONT; c.fillText(d.s.xp+' Punkte',360,640);
    // Balken
    const mx=Math.max(60,...d.use), bx=80, bw=920, by=1060, bh=170, gap=22, wd=(bw-gap*6)/7;
    c.fillStyle='#9a9a9a'; c.font='600 34px '+FONT; c.fillText('Lernzeit pro Tag',80,745); c.fillStyle='#fff'; c.font='800 84px '+FONT; c.fillText(d.lt,80,835);
    d.use.forEach((v,i)=>{ const h=Math.max(8,Math.round(v/mx*bh)), x=bx+i*(wd+gap); rr(c,x,by-h,wd,h,14); c.fillStyle=v>0?acc:'#333'; c.fill(); c.fillStyle='#9a9a9a'; c.font='600 30px '+FONT; c.textAlign='center'; c.fillText(DAYN[i],x+wd/2,by+46); c.textAlign='left'; });
    // Kacheln
    const T=[[d.w.cards,'Lernkarten'],[d.w.quizOk,'Quizfragen richtig'],[d.st.cur,d.st.cur===1?'Tag Serie':'Tage Serie'],[Object.keys(d.s.badges).length,'Abzeichen']];
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

  function onShow(id){ if(id==='v-game') renderGame(); else if(id==='v-week') renderWeek(); }
  return {event,homeHtml,toggle,openRank,open,close,refresh,setPath,setOff,isOn,setTitle,share,saveImg,onShow,renderGame,renderWeek,_state:load,_ranks:RANKS,_badges:BADGES,_streak:streak,_tasks:taskState};
})();
