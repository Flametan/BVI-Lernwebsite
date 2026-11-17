/* ======================================================================
   LÜCKENTEXT-SPRINT – Pausenraum (wird erst beim Öffnen des Spiels geladen)
   60 Sekunden: In kurzen Sätzen aus den Lernkarten fehlt ein Schlüsselwort.
   Richtig: +1 und sofort die nächste Lücke. Falsch: 3 Sekunden Zeitstrafe.
   Die Lücken werden beim Start automatisch aus FLASHCARD_DATA erzeugt.
====================================================================== */
const LUECKENTEXT=(function(){
  'use strict';
  const BKEY='bvi_pause_best', KEY='lueckentext', STYLE_ID='lt-style';
  const DUR=60000, PENALTY=3000, TICK=100, LOCK=140;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const lget=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
  const lset=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  const say=m=>{ if(typeof A11Y!=='undefined') A11Y.say(m); };
  const rm=()=>{ try{ return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } };
  const shuffle=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const grp=c=>String(c).split(' · ')[0];

  /* ── Lücken erzeugen ─────────────────────────────────────────────── */
  const BAD=/^(Problem|Lösung|Falsch|Richtig|Ja|Nein|Fazit|Vorteil|Nachteil|Vorteile|Nachteile|Beispiel|Merke|Tipp|Antwort|Ergebnis|Achtung|Risiko|Stellung|Maßnahme)\b/i;
  const plainOf=h=>h.replace(/<[^>]+>/g,'');
  const prep=h=>h.replace(/<br\s*\/?>/gi,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
  function goodKw(kw){
    const w=kw.split(/\s+/);
    if(w.length>3||kw.length>26||kw.length<3) return false;
    if(!/[A-Za-zÄÖÜäöüß]{3}/.test(kw)||BAD.test(kw)||/^\d+\.\s/.test(kw)||/^§|[„“"‚‘']/.test(kw)||/&[a-z#0-9]+;/.test(kw)) return false;
    return true;
  }
  function itemsOf(c){
    const out=[], a=prep(c.a||''), q=plainOf(prep(String(c.q)));
    a.split(/(?<=[a-zäöüß)>"“]{2}[.!?])(?<!\b(?:bzw|ggf|usw|ca|Nr|Abs|Art|vgl|evtl|inkl|sog|Std|Min|Mio|Mrd|Bln|Hrsg)\.)\s+(?=[A-ZÄÖÜ<„])/).forEach(function(s){
      s=s.trim(); const plain=plainOf(s);
      if(plain.length<28||plain.length>170||!/[a-zäöüß)"“][.!?"“]$/.test(plain)) return;
      if(/siehe|Abb|Tabelle|→|…|\.\.\.|;|&[a-z#0-9]+;|\bs\. /i.test(plain)) return;
      if(/\([^)]{25,}\)/.test(plain)||(plain.match(/,/g)||[]).length>4) return;
      if(!/^[A-ZÄÖÜ„"]/.test(plain)||/\b\d\.\s|\d\)\s/.test(plain)) return;
      if((plain.match(/\(/g)||[]).length!==(plain.match(/\)/g)||[]).length) return;
      if(/^(Er|Sie|Es|Dies|Diese[rsmn]?|Dazu|Daher|Zudem|Auch|Dann|Dabei)\s/.test(plain)) return;
      const spans=s.match(/<strong>([^<]+)<\/strong>/g); if(!spans||spans.length>3) return;
      spans.forEach(function(sp){
        const kw=plainOf(sp).trim().replace(/[.,:;]+$/,''); if(!goodKw(kw)) return;
        if(q.toLowerCase().indexOf(kw.toLowerCase())>=0) return;
        const idx=s.indexOf(sp), pre=plainOf(s.slice(0,idx)), post=plainOf(s.slice(idx+sp.length));
        if(pre.replace(/\s/g,'').length<6&&post.replace(/\s/g,'').length<6) return;
        if(!pre.trim()&&/^\s*[:=(,.A-ZÄÖÜ„"]/.test(post)) return;
        if(/^[^\s]+\s*[:=]\s*$/.test(pre.trim())) return;
        if((pre+post).toLowerCase().indexOf(kw.toLowerCase())>=0) return;
        out.push({id:c.id,cat:c.cat,q:q,pre:pre,kw:kw,post:post});
      });
    });
    return out;
  }
  let cache=null;
  function build(){
    const D=(typeof FLASHCARD_DATA!=='undefined'&&Array.isArray(FLASHCARD_DATA))?FLASHCARD_DATA.filter(c=>c&&!c.own&&c.a&&c.q):[];
    if(cache&&cache.n===D.length) return cache;
    const items=[], pool={};   // pool: Kategorie -> alle kurzen Schlüsselwörter
    D.forEach(function(c){
      itemsOf(c).forEach(i=>items.push(i));
      const m=prep(c.a).match(/<strong>([^<]+)<\/strong>/g)||[];
      m.forEach(function(sp){ const kw=plainOf(sp).trim().replace(/[.,:;]+$/,''); if(goodKw(kw)) (pool[c.cat]=pool[c.cat]||[]).push({kw:kw,id:c.id}); });
    });
    cache={n:D.length,items:items,pool:pool}; return cache;
  }
  function wcount(s){ return s.split(/\s+/).length; }
  function distractors(it,B){
    const own=(it.pre+' '+it.post+' '+it.q).toLowerCase(), key=it.kw.toLowerCase();
    const seen={}; seen[key]=1;
    const cand=[], add=function(list,rank){ list.forEach(function(p){
      const k=p.kw.toLowerCase(); if(p.id===it.id||seen[k]) return;
      if(own.indexOf(k)>=0||k.indexOf(key)>=0||key.indexOf(k)>=0) return;
      if(own.indexOf(k.slice(0,Math.min(k.length,Math.max(6,k.length-3))))>=0) return;
      seen[k]=1;
      const sim=(/^[A-ZÄÖÜ]/.test(p.kw)===/^[A-ZÄÖÜ]/.test(it.kw)?0:3)+Math.abs(wcount(p.kw)-wcount(it.kw))+Math.abs(p.kw.length-it.kw.length)/12;
      cand.push({kw:p.kw,s:rank*3+sim+Math.random()*0.9});
    }); };
    add(B.pool[it.cat]||[],0);
    const g=grp(it.cat), sib=[]; Object.keys(B.pool).forEach(function(c){ if(c!==it.cat&&grp(c)===g) sib.push.apply(sib,B.pool[c]); });
    add(sib,1);
    const rest=[]; Object.keys(B.pool).forEach(function(c){ if(grp(c)!==g) rest.push.apply(rest,B.pool[c]); });
    add(rest,2);
    cand.sort((a,b)=>a.s-b.s);
    const stem=k=>k.toLowerCase().split(/\s+/).map(w=>w.slice(0,6)).join(' ');
    const used=[stem(it.kw)], res=[];
    for(let n=0;n<cand.length&&res.length<3;n++){ const st=stem(cand[n].kw); if(used.indexOf(st)>=0) continue; used.push(st); res.push(cand[n].kw); }
    return res;
  }

  /* ── Stil ───────────────────────────────────────────────────────── */
  function css(){
    if(document.getElementById(STYLE_ID)) return;
    const st=document.createElement('style'); st.id=STYLE_ID;
    st.textContent=`
.lt-wrap{max-width:600px;margin:0 auto;display:flex;flex-direction:column;gap:12px;}
.lt-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.lt-stat{display:flex;flex-direction:column;line-height:1.1;}
.lt-stat span{font-size:.7rem;letter-spacing:.09em;text-transform:uppercase;color:var(--m-muted,#888);font-weight:700;}
.lt-stat b{font-size:1.45rem;font-weight:800;color:var(--m-fg,#eee);font-variant-numeric:tabular-nums;}
.lt-stat.r{align-items:flex-end;}
.lt-time{position:relative;}
.lt-time.low b{color:#e5484d;}
.lt-pen{position:absolute;left:3.3em;top:16px;white-space:nowrap;font-weight:800;font-size:1rem;color:#e5484d;pointer-events:none;opacity:0;}
.lt-pen.go{animation:ltpen .9s ease-out;}
@keyframes ltpen{0%{opacity:0;transform:translateY(8px);}15%{opacity:1;}100%{opacity:0;transform:translateY(-22px);}}
.lt-bar{height:12px;border-radius:7px;background:var(--m-raised,#2a2a2a);overflow:hidden;position:relative;}
.lt-bar i{display:block;height:100%;width:100%;transform-origin:left center;background:linear-gradient(90deg,#ff5a1f,var(--m-accent,#ffa31a));border-radius:7px;transition:transform .12s linear;}
.lt-bar.low i{background:#e5484d;}
.lt-bar.hit{animation:ltbar .45s;}
@keyframes ltbar{0%,100%{box-shadow:none;}30%{box-shadow:0 0 0 3px rgba(229,72,77,.65);}}
.lt-card{background:var(--m-card,#1b1b1b);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:12px;border:2px solid transparent;transition:border-color .2s;}
.lt-card.bad{animation:ltshake .45s;}
.lt-card.ok{border-color:#2fae6b;}
@keyframes ltshake{0%,100%{transform:none;border-color:transparent;}12%{border-color:#e5484d;}25%{transform:translateX(-6px);}60%{transform:translateX(6px);border-color:#e5484d;}}
.lt-cat{font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;color:var(--m-muted,#888);font-weight:700;}
.lt-ctx{font-size:.84rem;line-height:1.4;color:var(--m-muted,#888);margin:0;}
.lt-sent{font-size:1.12rem;line-height:1.55;font-weight:700;color:var(--m-fg,#eee);margin:0;overflow-wrap:anywhere;hyphens:auto;}
.lt-gap{display:inline-block;min-width:4.2em;border-bottom:3px solid var(--m-accent,#ffa31a);margin:0 .1em;vertical-align:baseline;color:transparent;user-select:none;}
.lt-opts{display:grid;grid-template-columns:1fr;gap:8px;}
@media(min-width:520px){.lt-opts{grid-template-columns:1fr 1fr;}}
.lt-opt{display:flex;gap:10px;align-items:center;width:100%;min-height:52px;text-align:left;background:var(--m-raised,#2a2a2a);color:var(--m-fg,#eee);border:1px solid var(--m-line,transparent);border-radius:13px;padding:10px 12px;font-family:inherit;font-size:.95rem;line-height:1.3;cursor:pointer;touch-action:manipulation;overflow-wrap:anywhere;}
.lt-opt i{font-style:normal;font-weight:800;color:var(--m-accent-fg,#ffa31a);flex:none;width:18px;}
.lt-opt:hover{border-color:var(--m-accent,#ffa31a);}
.lt-opt:focus-visible,.lt-wrap .pz-pri:focus-visible{outline:3px solid var(--m-accent,#ffa31a);outline-offset:2px;}
.lt-opt:active{transform:scale(.985);}
.lt-hint{font-size:.78rem;color:var(--m-dim,#888);text-align:center;margin:0;}
.lt-big{font-size:3.4rem;font-weight:800;text-align:center;line-height:1.05;color:var(--m-fg,#eee);}
.lt-sub{text-align:center;color:var(--m-muted,#888);font-size:.9rem;margin:0;}
.lt-rec{text-align:center;font-weight:800;color:var(--m-accent-fg,#ffa31a);margin:0;}
.lt-rules{margin:0;padding-left:1.2rem;color:var(--m-muted,#888);font-size:.92rem;line-height:1.55;}
.lt-ttl{display:flex;align-items:center;gap:10px;font-size:1.2rem;font-weight:800;margin:0;color:var(--m-fg,#eee);}
.lt-ttl svg{width:28px;height:28px;flex:none;}
.lt-wl{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;}
.lt-wl li{background:var(--m-raised,#2a2a2a);border-radius:12px;padding:10px 12px;font-size:.88rem;line-height:1.45;color:var(--m-fg,#eee);border-left:4px solid #e5484d;}
.lt-wl .c{color:#2fae6b;font-weight:800;}
.lt-wl .w{color:#e5484d;text-decoration:line-through;font-size:.8rem;}
.lt-wl small{display:block;color:var(--m-muted,#888);font-size:.74rem;margin-top:3px;}
.lt-wrap .pz-pri{min-height:48px;}
@media(prefers-reduced-motion:reduce){.lt-bar i{transition:none;}.lt-card.bad,.lt-bar.hit,.lt-pen.go{animation:none;}.lt-pen.go{opacity:1;}}
`;
    document.head.appendChild(st);
  }

  const FLAME='<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="lt-fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a1f"/><stop offset="1" stop-color="#ffd166"/></linearGradient></defs><path fill="url(#lt-fg)" d="M12 2s5.4 4.6 5.4 10.2A5.4 5.4 0 0 1 6.6 12.2c0-2.3 1.1-4 2.2-5.3.1 2.1 1 3.1 2.1 3.1C10.9 6.9 12 4.7 12 2z"/></svg>';

  /* ── Zustand ────────────────────────────────────────────────────── */
  let root=null, S=null, timer=null, kd=null, vis=null, B=null;
  const best=()=>{ const v=(lget(BKEY,{})||{})[KEY]; return typeof v==='number'?v:0; };

  function clearTimer(){ if(timer){ clearInterval(timer); timer=null; } }
  function removeListeners(){
    if(kd){ document.removeEventListener('keydown',kd); kd=null; }
    if(vis){ document.removeEventListener('visibilitychange',vis); vis=null; }
  }

  function start(el){
    stop(); css(); root=el; B=build();
    if(B.items.length<12){ root.innerHTML='<div class="lt-wrap"><div class="pz-card"><p class="pz-center">Für dieses Spiel sind gerade nicht genug Lernkarten geladen.</p></div></div>'; return; }
    kd=onKey; document.addEventListener('keydown',kd);
    vis=onVis; document.addEventListener('visibilitychange',vis);
    root.addEventListener('click',onClick);
    S={phase:'idle'}; intro();
  }
  function stop(){
    clearTimer(); removeListeners();
    if(root){ root.removeEventListener('click',onClick); }
    root=null; S=null;
  }

  function intro(){
    S={phase:'idle'};
    root.innerHTML='<div class="lt-wrap"><div class="pz-card">'
      +'<h3 class="lt-ttl">'+FLAME+'Lückentext-Sprint</h3>'
      +'<ul class="lt-rules"><li>In kurzen Sätzen aus den Lernkarten fehlt ein Schlüsselwort.</li><li>Wähle in 60 Sekunden so viele richtige Lücken wie möglich.</li><li>Richtig: +1, sofort die nächste Lücke. Falsch: 3 Sekunden Zeitstrafe.</li><li>Am PC: Tasten 1 bis 4.</li></ul>'
      +'<p class="lt-rec">Rekord: '+(best()?best()+' in 60 s':'noch keiner')+'</p>'
      +'<button type="button" class="pz-pri" data-a="go">Los geht’s</button></div></div>';
    focusPri();
  }
  function focusPri(){ const b=root&&root.querySelector('.pz-pri'); if(b) try{ b.focus({preventScroll:true}); }catch(e){} }

  function newGame(){
    clearTimer();
    S={phase:'play',score:0,wrong:[],queue:shuffle(B.items),qi:0,cur:null,deadline:performance.now()+DUR,lock:0,pausedAt:0,lastCard:'',pen:0};
    root.innerHTML='<div class="lt-wrap" role="group" aria-label="Lückentext-Sprint">'
      +'<div class="lt-top"><div class="lt-stat lt-time"><span>Zeit</span><b data-r="t">60</b><div class="lt-pen" data-r="pen" aria-hidden="true">−3 s</div></div>'
      +'<div class="lt-stat r"><span>Richtig</span><b data-r="s">0</b></div></div>'
      +'<div class="lt-bar" data-r="bar" role="progressbar" aria-label="Restzeit" aria-valuemin="0" aria-valuemax="60" aria-valuenow="60"><i data-r="fill"></i></div>'
      +'<div class="lt-card" data-r="card"></div>'
      +'<p class="lt-hint">Tasten 1 bis 4 wählen die Antwort</p></div>';
    next(); tick(); timer=setInterval(tick,TICK);
  }

  function pick(){
    // nächste Frage, möglichst nicht von derselben Lernkarte wie zuvor
    for(let n=0;n<6;n++){
      if(S.qi>=S.queue.length){ S.queue=shuffle(B.items); S.qi=0; }
      const it=S.queue[S.qi++]; if(it.id!==S.lastCard||B.items.length<3) return it;
    }
    return S.queue[S.qi-1];
  }
  function next(){
    const it=pick(); S.lastCard=it.id;
    const opts=shuffle([it.kw].concat(distractors(it,B)));
    S.cur={it:it,opts:opts,ok:opts.indexOf(it.kw)};
    const card=root.querySelector('[data-r="card"]');
    card.className='lt-card';
    card.innerHTML='<div class="lt-cat">'+esc(it.cat)+'</div>'
      +'<p class="lt-ctx">'+esc(it.q)+'</p>'
      +'<p class="lt-sent">'+esc(it.pre)+'<span class="lt-gap" role="img" aria-label="Lücke">____</span>'+esc(it.post)+'</p>'
      +'<div class="lt-opts" role="group" aria-label="Antworten">'
      +opts.map((o,i)=>'<button type="button" class="lt-opt" data-i="'+i+'" aria-label="Antwort '+(i+1)+': '+esc(o)+'"><i>'+(i+1)+'</i><span>'+esc(o)+'</span></button>').join('')+'</div>';
  }

  function answer(i){
    if(!S||S.phase!=='play'||!S.cur) return;
    const now=performance.now(); if(now<S.lock) return;
    if(i<0||i>=S.cur.opts.length) return;
    S.lock=now+LOCK;
    const it=S.cur.it, picked=S.cur.opts[i];
    const good=i===S.cur.ok;
    if(good){
      S.score++; set('s',S.score);
    }else{
      S.deadline-=PENALTY; S.wrong.push({it:it,picked:picked});
      flashPenalty();
      if(S.deadline-now<=0){ tick(); return; }
    }
    next(); tick();
    if(!good){ const card=root.querySelector('[data-r="card"]'); if(card&&!rm()){ card.classList.remove('bad'); void card.offsetWidth; card.classList.add('bad'); } }
  }
  function flashPenalty(){
    const p=root.querySelector('[data-r="pen"]'), bar=root.querySelector('[data-r="bar"]');
    if(p&&!rm()){ p.classList.remove('go'); void p.offsetWidth; p.classList.add('go'); }
    else if(p){ p.classList.add('go'); setTimeout(function(){ if(p) p.classList.remove('go'); },900); }
    if(bar&&!rm()){ bar.classList.remove('hit'); void bar.offsetWidth; bar.classList.add('hit'); }
  }
  function set(k,v){ const e=root&&root.querySelector('[data-r="'+k+'"]'); if(e) e.textContent=v; }

  function tick(){
    if(!root||!root.isConnected){ stop(); return; }
    if(!S||S.phase!=='play') return;
    const left=Math.max(0,S.deadline-performance.now());
    set('t',Math.ceil(left/1000));
    const fill=root.querySelector('[data-r="fill"]'), bar=root.querySelector('[data-r="bar"]'), tm=root.querySelector('.lt-time');
    if(fill) fill.style.transform='scaleX('+(left/DUR).toFixed(4)+')';
    const low=left<=10000;
    if(bar){ bar.classList.toggle('low',low); bar.setAttribute('aria-valuenow',String(Math.ceil(left/1000))); }
    if(tm) tm.classList.toggle('low',low);
    if(left<=0) finish();
  }
  function onVis(){
    if(!S||S.phase!=='play') return;
    if(document.hidden){ S.pausedAt=performance.now(); clearTimer(); }
    else if(S.pausedAt){ S.deadline+=performance.now()-S.pausedAt; S.pausedAt=0; clearTimer(); timer=setInterval(tick,TICK); tick(); }
  }

  function finish(){
    if(!S||S.phase!=='play') return;
    clearTimer(); S.phase='over';
    const score=S.score, old=best(), isNew=score>old&&score>0;
    if(isNew){ const b=lget(BKEY,{})||{}; b[KEY]=score; lset(BKEY,b); }
    if(score>0&&typeof GAME!=='undefined'){ try{ GAME.cheer('spiel','Lückentext-Sprint',isNew&&old>0?score+' in 60 s':''); }catch(e){} }
    const wl=S.wrong.map(function(w){
      return '<li>'+esc(w.it.pre)+'<span class="c">'+esc(w.it.kw)+'</span>'+esc(w.it.post)
        +'<small>Du hattest: <span class="w">'+esc(w.picked)+'</span> · '+esc(w.it.cat)+'</small></li>';
    }).join('');
    root.innerHTML='<div class="lt-wrap"><div class="pz-card">'
      +'<h3 class="lt-ttl">'+FLAME+'Zeit abgelaufen</h3>'
      +'<div class="lt-big" aria-label="'+score+' richtige Lücken">'+score+'</div>'
      +'<p class="lt-sub">'+(score===1?'richtige Lücke':'richtige Lücken')+' in 60 Sekunden</p>'
      +(isNew?'<p class="lt-rec">Neuer Rekord!</p>':'<p class="lt-sub">Rekord: '+(Math.max(old,score)||'–')+'</p>')
      +'<button type="button" class="pz-pri" data-a="go">Neues Spiel</button></div>'
      +(S.wrong.length?'<div class="pz-card"><div class="pz-lbl"><span>Zum Nachlesen</span><b>'+S.wrong.length+' falsch</b></div><ul class="lt-wl">'+wl+'</ul></div>':'<div class="pz-card"><p class="pz-center">Keine Fehler. Stark!</p></div>')
      +'</div>';
    say('Zeit abgelaufen. '+score+' richtige Lücken.'+(isNew?' Neuer Rekord.':'')+(S.wrong.length?' '+S.wrong.length+' falsch, die Liste steht unter dem Ergebnis.':''));
    focusPri();
  }

  /* ── Eingaben ───────────────────────────────────────────────────── */
  function onClick(e){
    const t=e.target.closest&&e.target.closest('button'); if(!t||!root.contains(t)) return;
    if(t.dataset.a==='go'){ newGame(); return; }
    if(t.classList.contains('lt-opt')) answer(+t.dataset.i);
  }
  function onKey(e){
    if(!root||!root.isConnected||!S||e.ctrlKey||e.metaKey||e.altKey) return;
    if(S.phase==='play'){
      const n=e.key>='1'&&e.key<='4'?+e.key:(e.code&&/^Numpad[1-4]$/.test(e.code)?+e.code.slice(-1):0);
      if(n){ e.preventDefault(); answer(n-1); }
    }
  }

  return { start:start, stop:stop };
})();
