/* ======================================================================
   KLEINE PAUSE – Pausenspiele (wird erst beim Öffnen der Seite geladen)
   Daten: js/pause-data.js (PAUSE_DATA)
====================================================================== */
const PAUSE=(function(){
  const D=typeof PAUSE_DATA!=='undefined'?PAUSE_DATA:{allg:{},fw:{},exam:[]};
  const MKEY='bvi_pause_mode',BKEY='bvi_pause_best';
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const rnd=a=>a[Math.floor(Math.random()*a.length)];
  const get=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
  const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  let root=null,cur=null,mode=get(MKEY,'beides'),pushed=false;
  const best=()=>get(BKEY,{});
  function saveBest(k,v,lower){const b=best();if(b[k]==null||(lower?v<b[k]:v>b[k])){b[k]=v;set(BKEY,b);return true;}return false;}
  // Inhalte je Umschalter: Allgemeinwissen, Feuerwehrwissen oder beides
  function pool(key){const a=(D.allg[key]||[]).map(x=>({...x,_k:'Allgemein'})),f=(D.fw[key]||[]).map(x=>({...x,_k:'Feuerwehr'}));return mode==='allg'?a:mode==='fw'?f:a.concat(f);}
  const ICON={
    ladder:'<path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10"/>',
    bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    scale:'<path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0z"/>',
    pairs:'<rect x="3" y="5" width="8" height="12" rx="2"/><rect x="13" y="7" width="8" height="12" rx="2"/>',
    truck:'<path d="M2 16V8a1 1 0 0 1 1-1h10v9M13 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M6 4h4"/>'
  };
  const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const GAMES=[
    ['fahrt','truck','Einsatzfahrt','Nur Prüfungsfragen aus IBK, VAk, FeuAK und IdF · Route wählen, Hilfsfrist schaffen',()=>FAHRT],
    ['quiz','ladder','Quizleiter','8 Stufen, ein 50:50-Joker – wie weit kommst du?',()=>QUIZL],
    ['tf','bolt','Wahr oder Falsch','60 Sekunden, so viele Aussagen wie möglich',()=>TF],
    ['word','grid','Wörter-Raten','Ein Begriff mit 5 Buchstaben, sechs Versuche',()=>WORD],
    ['num','scale','Mehr oder weniger','Was ist größer? Halte die Serie',()=>NUM],
    ['mem','pairs','Memory','Finde die Paare mit möglichst wenigen Zügen',()=>MEM]
  ];
  function bestTxt(k){const b=best()[k];if(b==null)return'';return k==='mem'?`Bestwert: ${b} Züge`:k==='quiz'?`Bestwert: Stufe ${b}`:k==='num'?`Beste Serie: ${b}`:k==='word'?`Gelöst: ${b}`:`Bestwert: ${b} Punkte`;}
  function hub(){stop();
    const card=([k,ic,t,d],big)=>`<button class="pz-game${big?' pz-big':''}" data-g="${k}"><span class="pz-gi">${svg(ic)}</span><span><b>${t}</b><small>${d}</small>${bestTxt(k)?`<em>${bestTxt(k)}</em>`:''}</span></button>`;
    // Einsatzfahrt immer mit Prüfungsfragen; der Umschalter gilt nur für die Spiele darunter
    root.innerHTML=`<div class="pz-wrap"><div class="pz-grid">${card(GAMES[0],true)}</div>
    <div class="m-sec" style="margin:.4rem 0 -.2rem">Weitere Spiele · Fragen aus</div>
    <div class="pz-mode" role="tablist" aria-label="Fragen für die weiteren Spiele">${[['allg','Allgemeinwissen'],['fw','Feuerwehr'],['beides','Beides']].map(([k,t])=>`<button data-m="${k}" class="${mode===k?'on':''}">${t}</button>`).join('')}</div>
    <div class="pz-grid">${GAMES.slice(1).map(g=>card(g,false)).join('')}</div></div>`;
    root.querySelectorAll('[data-m]').forEach(x=>x.onclick=()=>{mode=x.dataset.m;set(MKEY,mode);hub();});
    root.querySelectorAll('[data-g]').forEach(x=>x.onclick=()=>open(x.dataset.g));
  }
  function open(k){const g=GAMES.find(x=>x[0]===k);if(!g)return;stop();cur=g[4]();
    if(!pushed){try{history.pushState(Object.assign({},history.state,{pz:1}),'');pushed=true;}catch(e){}}
    root.innerHTML=`<div class="pz-wrap"><div class="pz-head"><button class="pz-back">‹ Alle Spiele</button><span class="pz-center" style="font-size:.78rem">${k==='fahrt'?'Prüfungsfragen':mode==='allg'?'Allgemeinwissen':mode==='fw'?'Feuerwehr':'Allgemein + Feuerwehr'}</span></div><div class="pz-body"></div></div>`;
    root.querySelector('.pz-back').onclick=toHub;cur.start(root.querySelector('.pz-body'));}
  function stop(){if(cur&&cur.stop)cur.stop();cur=null;}
  function toHub(){if(pushed)history.back();else hub();}
  // Zurück (Browser, Wischgeste, Android) im Spiel: zur Spieleauswahl statt zur Startseite
  window.addEventListener('popstate',e=>{if(!pushed)return;pushed=false;if(cur&&root&&root.isConnected){e.stopImmediatePropagation();hub();}},true);
  const empty=el=>{el.innerHTML='<div class="pz-card"><div class="pz-center">Für diese Auswahl gibt es noch keine Inhalte. Schalte oben auf „Beides“.</div></div>';};

  /* ---------- 1 Quizleiter ---------- */
  const QUIZL={start(el){const P=pool('quiz');if(P.length<8)return empty(el);
    const LV=[1,1,2,2,3,4,4,5],used=new Set();let i=0,joker=true;
    const pick=lv=>{let c=P.filter(q=>q.lvl===lv&&!used.has(q));if(!c.length)c=P.filter(q=>!used.has(q));const q=rnd(c);used.add(q);const ord=shuf([0,1,2,3]);return{...q,o:ord.map(k=>q.o[k]),c:ord.indexOf(q.c)};};
    let q=pick(LV[0]);
    const draw=()=>{const L='ABCD';el.innerHTML=`<div class="pz-card"><div class="pz-lbl"><span>Stufe <b>${i+1}/8</b> · ${esc(q._k)}</span><button class="pz-sec2" data-j ${joker?'':'disabled'}>50:50</button></div><div class="pz-ladder">${LV.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div><div class="pz-qt">${esc(q.q)}</div>${q.o.map((o,k)=>`<button class="pz-opt" data-k="${k}"><i>${L[k]}</i><span>${esc(o)}</span></button>`).join('')}<div class="pz-fbx"></div></div>`;
      el.querySelector('[data-j]').onclick=e=>{joker=false;e.currentTarget.disabled=true;shuf([0,1,2,3].filter(k=>k!==q.c)).slice(0,2).forEach(k=>el.querySelector(`[data-k="${k}"]`).classList.add('off'));};
      el.querySelectorAll('.pz-opt').forEach(b=>b.onclick=()=>answer(+b.dataset.k,b));};
    const answer=(k,b)=>{el.querySelectorAll('.pz-opt').forEach(x=>x.style.pointerEvents='none');el.querySelector(`[data-k="${q.c}"]`).classList.add('ok');const ok=k===q.c;if(!ok)b.classList.add('bad');
      const fb=el.querySelector('.pz-fbx');fb.innerHTML=`<div class="pz-fb ${ok?'g':'r'}"><b>${ok?'Richtig':'Leider falsch'}</b>${q.e?' – '+esc(q.e):''}</div><button class="pz-pri">${ok?(i<7?'Nächste Stufe':'Zum Ergebnis'):'Ergebnis'}</button>`;
      fb.querySelector('.pz-pri').onclick=()=>{if(ok&&i<7){i++;q=pick(LV[i]);draw();}else end(ok?8:i);};};
    const end=n=>{const rec=n>0&&saveBest('quiz',n);el.innerHTML=`<div class="pz-card"><div class="pz-big-n">${n===8?'Geschafft':'Stufe '+n}</div><div class="pz-center">${n===8?'Alle 8 Stufen richtig beantwortet.':n?`Du hast ${n} von 8 Stufen geschafft.`:'Direkt an der ersten Stufe hängen geblieben.'}${rec?' Neuer Bestwert.':''}</div><button class="pz-pri">Neue Runde</button></div>`;el.querySelector('.pz-pri').onclick=()=>QUIZL.start(el);};
    draw();}};

  /* ---------- 2 Wahr oder Falsch ---------- */
  const TF={t:0,start(el){const P=shuf(pool('tf'));if(P.length<5)return empty(el);const DUR=60;let left=DUR,score=0,streak=0,n=0,wrong=[],lock=false;
    clearInterval(this.t);
    const draw=()=>{const s=P[n%P.length];el.innerHTML=`<div class="pz-card"><div class="pz-lbl"><span>Punkte <b>${score}</b> · Serie <b>${streak}</b></span><b class="pz-tm">${left} s</b></div><div class="pz-bar"><i style="width:${left/DUR*100}%"></i></div><div class="pz-stmt">${esc(s.s)}</div><div class="pz-tf"><button class="pz-opt" data-v="1">Wahr</button><button class="pz-opt" data-v="0">Falsch</button></div></div>`;
      el.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{if(lock)return;lock=true;const ok=(b.dataset.v==='1')===!!s.a;streak=ok?streak+1:0;score+=ok?10+Math.min(streak-1,5)*2:0;if(!ok)wrong.push(s);n++;b.classList.add(ok?'ok':'bad');el.querySelector('.pz-card').classList.add(ok?'pz-flash-ok':'pz-flash-bad');setTimeout(()=>{lock=false;if(left>0)draw();},380);});};
    const end=()=>{clearInterval(this.t);const rec=saveBest('tf',score);el.innerHTML=`<div class="pz-card"><div class="pz-big-n">${score}</div><div class="pz-center">Punkte · ${n} Aussagen · ${n-wrong.length} richtig${rec?' · neuer Bestwert':''}</div>${wrong.length?`<div class="pz-lbl"><span>Auflösung</span></div><ul class="pz-res">${wrong.slice(0,8).map(w=>`<li>${esc(w.s)}<br><small>${w.a?'Wahr':'Falsch'}${w.e?' – '+esc(w.e):''}</small></li>`).join('')}</ul>`:''}<button class="pz-pri">Nochmal</button></div>`;el.querySelector('.pz-pri').onclick=()=>TF.start(el);};
    this.t=setInterval(()=>{left--;const t=el.querySelector('.pz-tm'),b=el.querySelector('.pz-bar i');if(t)t.textContent=left+' s';if(b)b.style.width=left/DUR*100+'%';if(left<=0)end();},1000);draw();},
    stop(){clearInterval(this.t);}};

  /* ---------- 3 Wörter-Raten ---------- */
  const WORD={start(el){const P=pool('words');if(!P.length)return empty(el);const w=rnd(P),W=w.w;let rows=[],inp='',hint=false,msg='';const KB=['QWERTZUIOP','ASDFGHJKL','YXCVBNM'];
    const col=(g,c)=>g[c]===W[c]?'gr':W.includes(g[c])?'ye':'xx';
    const keyCol=()=>{const m={};rows.forEach(g=>[...g].forEach((ch,c)=>{const k=col(g,c);if(m[ch]!=='gr')m[ch]=k==='gr'?'gr':(m[ch]==='ye'?'ye':k);}));return m;};
    const done=()=>rows.at(-1)===W||rows.length>=6;
    const draw=()=>{const km=keyCol(),fin=done();
      el.innerHTML=`<div class="pz-card"><div class="pz-lbl"><span>${esc(w._k)} · 5 Buchstaben</span><b>${rows.length}/6</b></div><div class="pz-wg">${Array.from({length:6},(_,r)=>`<div class="pz-wr">${[0,1,2,3,4].map(c=>{const g=rows[r];if(g)return`<div class="pz-wc ${col(g,c)}">${g[c]}</div>`;if(r===rows.length&&!fin)return`<div class="pz-wc cur">${inp[c]||''}</div>`;return'<div class="pz-wc"></div>';}).join('')}</div>`).join('')}</div>
      ${fin?`<div class="pz-fb ${rows.at(-1)===W?'g':'r'}" style="text-align:center"><b>${rows.at(-1)===W?'Richtig: '+W:'Lösung: '+W}</b>${w.h?'<br>'+esc(w.h):''}</div><button class="pz-pri">Neues Wort</button>`
      :`<div class="pz-center" style="min-height:1.3em">${msg?esc(msg):hint?'Hinweis: '+esc(w.h||'–'):'<button class="pz-sec2" data-h>Hinweis zeigen</button>'}</div><div class="pz-kb">${KB.map((r,i)=>`<div>${i===2?'<button class="w" data-k="ENTER">OK</button>':''}${[...r].map(ch=>`<button class="${km[ch]||''}" data-k="${ch}">${ch}</button>`).join('')}${i===2?'<button class="w" data-k="DEL" aria-label="Löschen">⌫</button>':''}</div>`).join('')}</div>`}</div>`;
      const p=el.querySelector('.pz-pri');if(p)p.onclick=()=>{if(rows.at(-1)===W)saveBest('word',(best().word||0)+1);WORD.start(el);};
      const h=el.querySelector('[data-h]');if(h)h.onclick=()=>{hint=true;draw();};
      el.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>key(b.dataset.k));};
    const key=k=>{if(done())return;msg='';if(k==='DEL')inp=inp.slice(0,-1);else if(k==='ENTER'){if(inp.length<5){msg='Bitte 5 Buchstaben eingeben';}else{rows.push(inp);inp='';}}else if(inp.length<5)inp+=k;draw();};
    this.kd=e=>{if(!el.isConnected)return;const k=e.key.toUpperCase();if(k==='ENTER')key('ENTER');else if(k==='BACKSPACE')key('DEL');else if(/^[A-Z]$/.test(k))key(k);else if(k==='Ä')key('A');};
    document.addEventListener('keydown',this.kd);draw();},
    stop(){if(this.kd)document.removeEventListener('keydown',this.kd);}};

  /* ---------- 4 Mehr oder weniger ---------- */
  // Mit jeder richtigen Antwort liegen die beiden Werte näher beieinander (Verhältnis groß/klein sinkt)
  const NUM={start(el){const P=pool('num');const cats={};P.forEach(x=>{const k=x._k+'|'+x.cat;(cats[k]=cats[k]||[]).push(x);});
    const pairs=[];Object.values(cats).forEach(a=>{for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const x=a[i],y=a[j];if(x.v>0&&y.v>0&&x.v!==y.v)pairs.push({a:x,b:y,r:Math.log(Math.max(x.v,y.v)/Math.min(x.v,y.v))});}});
    if(!pairs.length)return empty(el);pairs.sort((p,q)=>q.r-p.r);let streak=0;const used=new Set();
    const pickPair=()=>{const d=Math.min(1,streak/14),c=pairs.filter(p=>!used.has(p));const L=c.length?c:pairs;const idx=Math.round(d*(L.length-1)),w=Math.max(3,Math.round(L.length*.06));const lo=Math.max(0,idx-w),hi=Math.min(L.length,idx+w+1);const p=L[lo+Math.floor(Math.random()*(hi-lo))];used.add(p);return p;};
    const round=()=>{const pr=pickPair(),[a,b]=shuf([pr.a,pr.b]);const big=a.v>b.v?0:1,diff=Math.round((Math.exp(pr.r)-1)*100);
      el.innerHTML=`<div class="pz-card"><div class="pz-lbl"><span>${esc(a.cat)}</span><b>Serie ${streak}</b></div><div class="pz-qt">Was ist größer?</div><div class="pz-hl">${[a,b].map((x,i)=>`<button class="pz-opt" data-i="${i}"><span>${esc(x.n)}</span><b class="v" style="visibility:hidden">${esc(x.f)}</b></button>`).join('')}</div><div class="pz-fbx"></div></div>`;
      el.querySelectorAll('[data-i]').forEach(btn=>btn.onclick=()=>{const ok=+btn.dataset.i===big;el.querySelectorAll('[data-i]').forEach(x=>{x.style.pointerEvents='none';x.querySelector('.v').style.visibility='visible';});btn.classList.add(ok?'ok':'bad');
        const fb=el.querySelector('.pz-fbx');if(ok){streak++;fb.innerHTML=`<div class="pz-fb g"><b>Richtig</b> · Unterschied ${diff} %${streak%5===0?' · es wird knapper':''}</div>`;setTimeout(round,1300);}else{const rec=saveBest('num',streak);fb.innerHTML=`<div class="pz-fb r"><b>Serie beendet: ${streak}</b>${rec&&streak?' · neuer Bestwert':''}</div><button class="pz-pri">Neue Serie</button>`;fb.querySelector('.pz-pri').onclick=()=>NUM.start(el);}});};
    round();}};

  /* ---------- 5 Memory ---------- */
  const MEM={start(el){const P=pool('pairs');const sets={};P.forEach(x=>{const k=x._k+'|'+x.set;(sets[k]=sets[k]||[]).push(x);});const keys=Object.keys(sets).filter(k=>sets[k].length>=4);if(!keys.length)return empty(el);
    const sk=rnd(keys),pairs=shuf(sets[sk]).slice(0,6);let cards=shuf(pairs.flatMap((p,i)=>[{k:i,t:p.a},{k:i,t:p.b}])),open=[],found=0,moves=0,busy=false;
    const draw=()=>{el.innerHTML=`<div class="pz-card"><div class="pz-lbl"><span>${esc(pairs[0].set)}</span><b>Züge ${moves} · ${found}/${pairs.length}</b></div><div class="pz-mg">${cards.map((c,i)=>`<button class="pz-mc ${c.m?'m':open.includes(i)?'h':'d'}" data-i="${i}">${c.m||open.includes(i)?esc(c.t):'?'}</button>`).join('')}</div>${found===pairs.length?`<div class="pz-center">Alle Paare gefunden in ${moves} Zügen${saveBest('mem',moves,true)?' · neuer Bestwert':''}</div><button class="pz-pri">Neues Spiel</button>`:'<div class="pz-center">Zwei Karten aufdecken, die zusammengehören.</div>'}</div>`;
      const p=el.querySelector('.pz-pri');if(p)p.onclick=()=>MEM.start(el);
      el.querySelectorAll('.pz-mc').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(busy||open.includes(i)||cards[i].m)return;open.push(i);if(open.length===2){moves++;const[a,c]=open;if(cards[a].k===cards[c].k){cards[a].m=cards[c].m=1;found++;open=[];draw();}else{busy=true;draw();setTimeout(()=>{open=[];busy=false;draw();},950);}}else draw();});};
    draw();}};

  /* ---------- 6 Einsatzfahrt (Prüfungsfragen) ---------- */
  const FAHRT=(function(){
    const HF=480,MODS=[['IBK','Transaktionsanalyse · Konflikte'],['VAk','Verwaltungsrecht'],['FeuAK','Haushalt · Management'],['IdF','Brandschutz · Stab']];
    const ROUTES={A:{key:'A',name:'Hauptstraße',base:330,n:5,pen:65,bon:15,d:'kurz, aber Baustelle und Berufsverkehr',tags:['Fahrzeit 5:30','5 Fragen','falsch +65 s','richtig −15 s','ab 3 Fehlern zu spät']},
      B:{key:'B',name:'Ring',base:390,n:6,pen:30,bon:10,d:'länger, aber flüssig',tags:['Fahrzeit 6:30','6 Fragen','falsch +30 s','richtig −10 s','ab 4 Fehlern zu spät']}};
    const fmt=t=>{t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};
    const strip=h=>{const d=document.createElement('div');d.innerHTML=String(h||'');return d.textContent.replace(/\s+/g,' ').trim();};
    let Q=null;
    // Fragen: VAk und IdF aus den Altklausur-Quizzen der App, FeuAK und IBK aus pause-data.js; leuchtende Tabs (g) zählen dreifach
    function questions(){if(Q)return Q;Q=[];
      const own=(D.exam||[]).some(q=>q.m==='VAk'||q.m==='IdF'); // überarbeitete Fragen aus pause-data.js haben Vorrang
      const vq=own?[]:typeof QUIZ!=='undefined'&&QUIZ.qs?QUIZ.qs():[];
      vq.filter(q=>q.type==='mc').forEach(q=>Q.push({m:'VAk',src:'Altklausur-Quiz VAk',g:1,q:strip(q.q),o:q.opts.map(strip),c:q.correct,e:strip(q.exp)}));
      (!own&&typeof IDF_QUIZ_Q!=='undefined'?IDF_QUIZ_Q:[]).forEach(q=>{
        if(q.type==='mc')Q.push({m:'IdF',src:'Altklausur-Quiz IdF',g:1,q:strip(q.q),o:q.opts.map(strip),c:q.correct,e:strip(q.exp)});
        else if(q.type==='multi'){const wr=q.opts.map((_,i)=>i).filter(i=>!q.correct.includes(i));if(!wr.length)return;const ci=rnd(q.correct),sel=[ci,...wr.slice(0,3)];Q.push({m:'IdF',src:'Altklausur-Quiz IdF',g:1,q:strip(q.q).replace(/Welche Aussagen? (sind|ist) (richtig|zutreffend)\??/i,'Welche Aussage ist richtig?'),o:sel.map(i=>strip(q.opts[i])),c:0,e:strip(q.exp)});}});
      (D.exam||[]).forEach(q=>Q.push(q));return Q;}
    let sel=new Set(get('bvi_pause_mods',['VAk','IBK'])),st=null,el=null,cv=null,ctx=null,raf=0,PART=[],last=0,shake=0,lastFx=null,stars=[];
    const count=m=>questions().filter(q=>q.m===m).length;
    function pick(r){const pool=questions().filter(q=>sel.has(q.m)),bag=[];pool.forEach(q=>{for(let k=0;k<(q.g?3:1);k++)bag.push(q);});const out=[];while(out.length<r.n&&bag.length){const q=bag.splice(Math.floor(Math.random()*bag.length),1)[0];if(!out.includes(q))out.push(q);}
      return out.map(q=>{const ord=shuf(q.o.map((_,i)=>i));return{...q,o:ord.map(i=>q.o[i]),c:ord.indexOf(q.c)};});}
    function newGame(){st={phase:'select',p:0,t:0,qs:[],qi:0,route:null,res:[],fx:null,fxT:0,lvl:0};PART=[];panel();}
    function panel(){const pn=el.querySelector('.pz-fp'),s=st,L='ABCDE';let h='';
      if(s.phase==='select'){h=`<div class="pz-lbl"><span>Einsatzfahrt</span></div><div class="pz-qt">Aus welchen Modulen sollen die Fragen kommen?</div><div class="pz-chips">${MODS.map(([m,d])=>`<button class="pz-chip${sel.has(m)?' on':''}" data-a="tog" data-v="${m}"><b>${m}</b><small>${d}<br>${count(m)} Prüfungsfragen</small></button>`).join('')}</div><button class="pz-pri" data-a="route" ${sel.size?'':'disabled'}>Weiter: Einsatzmeldung</button>`;}
      else if(s.phase==='route'){h=`<div class="pz-lbl"><span>Alarm · Einsatzmeldung</span><b>Hilfsfrist ${fmt(HF)}</b></div><div class="pz-qt">Feuer 2 · Wohnungsbrand, Musterstraße 12, Person vermisst</div>${Object.values(ROUTES).map(r=>`<button class="pz-route" data-a="go" data-v="${r.key}"><b>${r.key} · ${r.name}</b> <span class="pz-center" style="font-size:.78rem">${r.d}</span><div class="k">${r.tags.map(x=>`<span>${x}</span>`).join('')}</div></button>`).join('')}<button class="pz-sec2" data-a="sel" style="align-self:flex-start">‹ Module</button>`;}
      else if(s.phase==='drive'){h=`<div class="pz-lbl"><span>Einsatzfahrt · ${s.route.name}</span><b>${s.qi<s.qs.length?'Frage '+(s.qi+1)+'/'+s.qs.length:'Gleich da'}</b></div><div class="pz-drv"><i></i><span>Sondersignal · Status 3</span></div>`;}
      else if(s.phase==='ask'||s.phase==='fb'){const q=s.qs[s.qi];h=`<div class="pz-lbl"><span>${esc(q.m)} · ${esc(q.src)}</span><b>${s.qi+1}/${s.qs.length}</b></div><div class="pz-qt">${esc(q.q)}</div>${q.o.map((o,i)=>{let c='';if(s.phase==='fb')c=i===q.c?' ok':i===s.pick?' bad':' dim';return`<button class="pz-opt${c}" data-a="ans" data-v="${i}" ${s.phase==='fb'?'disabled':''}><i>${L[i]}</i><span>${esc(o)}</span></button>`;}).join('')}`;
        if(s.phase==='fb'){const ok=s.res[s.res.length-1].ok;h+=`<div class="pz-fb ${ok?'g':'r'}"><b>${ok?'Richtig · freie Fahrt ('+s.dt+' s)':'Falsch · '+(s.route.key==='A'?'Stau an der Baustelle':'zähfließender Verkehr')+' (+'+s.dt+' s)'}</b>${q.e?'<br>'+esc(q.e):''}</div><button class="pz-pri" data-a="next">${s.qi+1<s.qs.length?'Weiterfahren':'Zur Einsatzstelle'}</button>`;}}
      else{const right=s.res.filter(r=>r.ok).length,rec=saveBest('fahrt',s.score);h=`<div class="pz-lbl"><span>Status 4 · am Einsatzort</span><b>${s.score} Punkte</b></div><div class="pz-qt" style="font-size:1.15rem">${s.win?'Hilfsfrist eingehalten':'Hilfsfrist überschritten'}</div><div class="pz-fb">Eintreffzeit <b>${fmt(s.t)}</b> · ${right}/${s.res.length} richtig · Route ${s.route.name}${rec?' · neuer Bestwert':''}</div>${s.res.some(r=>!r.ok)?`<div class="pz-lbl"><span>Zum Nacharbeiten</span></div><ul class="pz-res">${s.res.filter(r=>!r.ok).map(r=>`<li>${esc(r.q.q)}<br><small>Richtig: ${esc(r.q.o[r.q.c])}</small></li>`).join('')}</ul>`:''}<button class="pz-pri" data-a="new">Neuer Einsatz</button>`;}
      pn.innerHTML=h;}
    function act(a,v){const s=st;
      if(a==='tog'){sel.has(v)?sel.delete(v):sel.add(v);set('bvi_pause_mods',[...sel]);panel();}
      else if(a==='route'){if(sel.size){s.phase='route';panel();}}
      else if(a==='sel'){s.phase='select';panel();}
      else if(a==='go'){s.route=ROUTES[v];s.qs=pick(s.route);s.stops=s.qs.map((_,i)=>(i+1)/(s.qs.length+1));drive();}
      else if(a==='ans'){if(s.phase!=='ask')return;const i=+v,q=s.qs[s.qi],ok=i===q.c;s.phase='fb';s.pick=i;s.fx=ok?'ok':'bad';s.fxT=performance.now();s.dt=ok?-s.route.bon:s.route.pen;s.t+=s.dt;s.res.push({q,ok});panel();}
      else if(a==='next'){s.qi++;drive();}
      else if(a==='new')newGame();}
    function drive(){const s=st,to=s.qi<s.qs.length?s.stops[s.qi]:1;s.phase='drive';s.dr={from:s.p,to,t0:performance.now(),dur:1900,tt:s.t};panel();}
    function tick(n){const s=st;if(s.phase==='drive'){const d=s.dr,k=Math.min(1,(n-d.t0)/d.dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;s.p=d.from+(d.to-d.from)*e;s.t=d.tt+s.route.base*(s.p-d.from);
        if(k>=1){if(s.qi<s.qs.length){s.phase='ask';panel();}else{s.phase='end';s.p=1;s.win=s.t<=HF;const right=s.res.filter(r=>r.ok).length;s.score=Math.max(0,Math.round((s.win?1000+(HF-s.t)*3:0)+right*50));panel();}}}
      if(s.fx&&n-s.fxT>1500)s.fx=null;const tg=s.phase==='end'&&s.win?0:Math.min(1.3,s.t/HF);s.lvl+=(tg-s.lvl)*(s.phase==='end'&&s.win?.02:.08);}
    // Szene „Glut“: Nachtszene mit Partikelfeuer, Brand wächst mit der Zeit
    const W=360,H=300,hx=205,hy=78,hw=120,hh=132,WIN=[];for(let j=0;j<3;j++)for(let i=0;i<3;i++)WIN.push({x:hx+16+i*36,y:hy+18+j*38,w:22,h:26,o:[4,3,5,7,1,6,0,8,2].indexOf(j*3+i)});
    const road=t=>[-10+t*215,268-Math.sin(t*Math.PI)*28-t*8];
    let SP=null;
    function sprites(){const mk=col=>{const s=document.createElement('canvas');s.width=s.height=64;const g=s.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return s;};
      return{F:mk('rgba(255,170,60,1)'),R:mk('rgba(255,70,20,1)'),B:mk('rgba(70,160,255,1)'),S:mk('rgba(120,120,135,.55)'),G:mk('rgba(80,230,150,1)'),W:mk('rgba(140,200,255,.9)')};}
    const emit=(x,y,spr,vx,vy,life,size,add)=>{if(PART.length<360)PART.push({x,y,vx,vy,life,l0:life,size,spr,add});};
    function frame(n){const c=ctx,s=st,dt=Math.min(.05,(n-(last||n))/1000);last=n;tick(n);const lvl=s.lvl;
      if(s.fx!==lastFx){if(s.fx==='bad')shake=.5;if(s.fx){const[x,y]=road(s.p);for(let i=0;i<36;i++){const a=Math.random()*7,v=60+Math.random()*80;emit(x,y-10,s.fx==='ok'?SP.G:SP.R,Math.cos(a)*v,Math.sin(a)*v,.6,10,1);}}lastFx=s.fx;}
      shake=Math.max(0,shake-dt);c.save();if(shake)c.translate((Math.random()-.5)*8*shake,(Math.random()-.5)*8*shake);
      const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#070b18');sky.addColorStop(.6,`rgb(${30+lvl*90|0},${18+lvl*20|0},40)`);sky.addColorStop(1,'#120d16');c.fillStyle=sky;c.fillRect(-10,-10,W+20,H+20);
      stars.forEach(([x,y,b])=>{c.fillStyle=`rgba(255,255,255,${.25+.5*b*(1-lvl*.6)})`;c.fillRect(x,y,1.2,1.2);});
      c.fillStyle='#0d0f1c';for(let i=0;i<9;i++){const bh=40+((i*53)%50);c.fillRect(i*42-6,205-bh,36,bh+10);}
      const gl=c.createRadialGradient(hx+hw/2,hy+60,10,hx+hw/2,hy+60,220);gl.addColorStop(0,`rgba(255,110,40,${.35*lvl})`);gl.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gl;c.fillRect(0,0,W,H);
      c.fillStyle='#161a26';c.fillRect(-10,212,W+20,100);
      c.strokeStyle='rgba(255,163,26,.18)';c.lineWidth=22;c.lineCap='round';c.beginPath();for(let t=0;t<=1.001;t+=.05){const[x,y]=road(t);t?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.strokeStyle='#232838';c.lineWidth=16;c.stroke();
      c.strokeStyle='rgba(255,163,26,.9)';c.lineWidth=2;c.setLineDash([6,8]);c.beginPath();for(let t=0;t<=s.p+.001;t+=.02){const[x,y]=road(Math.min(t,s.p));t?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.setLineDash([]);
      const hg=c.createLinearGradient(hx,hy,hx+hw,hy+hh);hg.addColorStop(0,'#2a3044');hg.addColorStop(1,'#1b1f2d');c.fillStyle=hg;c.fillRect(hx,hy,hw,hh);c.fillStyle='#232839';c.beginPath();c.moveTo(hx-6,hy);c.lineTo(hx+hw+6,hy);c.lineTo(hx+hw-10,hy-14);c.lineTo(hx+10,hy-14);c.fill();
      const out=s.phase==='end'&&s.win;
      WIN.forEach(w=>{const on=w.o<lvl*9,k=Math.min(1,lvl*9-w.o);if(on){const f=.75+Math.sin(n/80+w.o)*.15,g=c.createLinearGradient(0,w.y,0,w.y+w.h);g.addColorStop(0,`rgba(255,${200*f|0},80,${k})`);g.addColorStop(1,`rgba(255,80,20,${k})`);c.fillStyle=g;c.fillRect(w.x,w.y,w.w,w.h);
          if(Math.random()<.5*k*(out?.3:1))emit(w.x+w.w/2+(Math.random()-.5)*w.w,w.y+4,Math.random()<.5?SP.F:SP.R,(Math.random()-.5)*12,-30-Math.random()*40,.7+Math.random()*.6,10+Math.random()*10,1);
          if(Math.random()<.12*k)emit(w.x+w.w/2,w.y,SP.S,(Math.random()-.5)*10+6,-22,2.6,22,0);}
        else{c.fillStyle='#10131d';c.fillRect(w.x,w.y,w.w,w.h);c.fillStyle='rgba(120,160,255,.08)';c.fillRect(w.x,w.y,w.w,w.h/2);}});
      if(lvl>.75&&Math.random()<lvl*.7)emit(hx+20+Math.random()*(hw-40),hy-12,SP.F,(Math.random()-.5)*14,-50-Math.random()*40,.9,16,1);
      const[cx,cy]=road(s.p),[nx,ny]=road(Math.min(1,s.p+.01)),ang=Math.atan2(ny-cy,nx-cx);
      if(out)for(let i=0;i<4;i++)emit(cx+10,cy-14,SP.W,150+Math.random()*40,-160-Math.random()*40,.9,9,1);
      for(let i=PART.length-1;i>=0;i--){const p=PART[i];p.life-=dt;if(p.life<=0){PART.splice(i,1);continue;}if(p.spr===SP.W)p.vy+=260*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const a=p.life/p.l0,sz=p.size*(p.add?a+.3:2-a);c.globalAlpha=p.add?a:a*.8;c.globalCompositeOperation=p.add?'lighter':'source-over';c.drawImage(p.spr,p.x-sz,p.y-sz,sz*2,sz*2);}
      c.globalAlpha=1;c.globalCompositeOperation='source-over';
      c.save();c.translate(cx,cy);c.rotate(ang);c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,4,24,5,0,0,7);c.fill();const bg=c.createLinearGradient(0,-16,0,2);bg.addColorStop(0,'#ff4b3a');bg.addColorStop(1,'#a8141a');c.fillStyle=bg;c.fillRect(-22,-15,44,14);c.fillStyle='#e9eef8';c.fillRect(-22,-8,32,2);c.fillStyle='#9fd3ff';c.fillRect(10,-13,9,6);c.fillStyle='#111';[-13,12].forEach(x=>{c.beginPath();c.arc(x,0,4,0,7);c.fill();});
      const bl=Math.floor(n/130)%2;c.globalCompositeOperation='lighter';c.drawImage(SP.B,(bl?-4:6)-18,-34,36,36);c.globalCompositeOperation='source-over';c.fillStyle=bl?'#5ab4ff':'#cfe8ff';c.fillRect(-5,-18,12,3);c.restore();
      if(s.fx==='bad'){const v=c.createRadialGradient(W/2,H/2,80,W/2,H/2,240);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(239,60,60,.45)');c.fillStyle=v;c.fillRect(0,0,W,H);}
      c.restore();
      const over=s.t>HF;c.fillStyle='rgba(255,255,255,.07)';c.strokeStyle='rgba(255,255,255,.14)';c.beginPath();c.rect(10,10,128,46);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.55)';c.font='600 9px system-ui,sans-serif';c.fillText('EINTREFFZEIT',22,26);c.fillStyle=over?'#ff7a6a':'#fff';c.font='800 21px system-ui,sans-serif';c.fillText(fmt(s.t),22,48);c.fillStyle='rgba(255,255,255,.45)';c.font='600 11px system-ui,sans-serif';c.fillText('/ '+fmt(HF),82,48);
      c.lineWidth=5;c.strokeStyle='rgba(255,255,255,.12)';c.beginPath();c.arc(W-34,34,20,0,7);c.stroke();c.strokeStyle=lvl>=1?'#ff4a3a':'#ffa31a';c.lineCap='round';c.beginPath();c.arc(W-34,34,20,-Math.PI/2,-Math.PI/2+Math.min(1,lvl)*Math.PI*2);c.stroke();c.fillStyle='#fff';c.font='800 11px system-ui,sans-serif';c.textAlign='center';c.fillText(Math.round(Math.min(1,lvl)*100)+'%',W-34,38);c.font='600 7px system-ui,sans-serif';c.fillStyle='rgba(255,255,255,.55)';c.fillText('BRAND',W-34,66);
      if(over&&s.phase==='end'){c.fillStyle='rgba(255,90,60,.9)';c.font='800 16px system-ui,sans-serif';c.fillText('FLASHOVER',hx+hw/2,hy+hh+22);}c.textAlign='left';
      c.fillStyle='rgba(255,255,255,.07)';c.fillRect(10,H-26,W-20,16);const tw=W-40;c.fillStyle='rgba(255,163,26,.85)';c.fillRect(20,H-20,Math.max(4,tw*s.p),4);(s.stops||[]).forEach((sp,i)=>{const r=s.res[i];c.fillStyle=r?(r.ok?'#3fdf8f':'#ff5a4a'):'rgba(255,255,255,.35)';c.beginPath();c.arc(20+tw*sp,H-18,4,0,7);c.fill();});
      raf=requestAnimationFrame(frame);}
    return{start(body){el=body;el.innerHTML='<div class="pz-fahrt"><div class="pz-scr"><canvas width="720" height="600" aria-label="Einsatzfahrt: Fahrzeug, Route und Brandentwicklung"></canvas></div><div class="pz-card pz-fp"></div></div>';
        cv=el.querySelector('canvas');const dpr=Math.min(2,window.devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr;ctx=cv.getContext('2d');ctx.scale(dpr,dpr);SP=SP||sprites();stars=[...Array(40)].map(()=>[Math.random()*W,Math.random()*120,Math.random()]);
        el.querySelector('.pz-fp').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;act(b.dataset.a,b.dataset.v);};
        newGame();cancelAnimationFrame(raf);last=0;raf=requestAnimationFrame(frame);},
      stop(){cancelAnimationFrame(raf);raf=0;},
      _state:()=>st};
  })();

  return{
    show(){root=document.getElementById('pause-root');if(!root)return;if(!cur)hub();},
    leave(){stop();pushed=false;if(root)root.innerHTML='';},
    back(){if(cur){toHub();return true;}return false;},
    open, _fahrt:()=>FAHRT
  };
})();
