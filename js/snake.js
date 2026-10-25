/* ======================================================================
   EINSATZLEITUNG-SNAKE – Pausenraum (wird erst beim Öffnen des Spiels geladen)
   Herausforderungen wählbar: Atemluft (Vorrat sinkt, Druckluftflaschen füllen auf)
   und Löschwasser (Aufnehmen löscht einen Brandherd).
====================================================================== */
const SNAKE=(function(){
  const N=18, OKEY='bvi_snake_opts', BKEY='bvi_pause_best';
  const LEVELS=[{n:'Einsatzstufe 1',s:190,f:0.10,t:'Kleinbrand'},{n:'Einsatzstufe 2',s:150,f:0.17,t:'Zimmerbrand'},{n:'Einsatzstufe 3',s:115,f:0.26,t:'Großbrand'}];
  const CH={head:'🧑‍🚒',item:'🧯',fire:'🔥',water:'💧',air:'💨'};
  const rnd=n=>Math.floor(Math.random()*n), key=(x,y)=>y*N+x;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const lget=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
  const lset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  const say=m=>{ if(typeof A11Y!=='undefined') A11Y.say(m); };
  let el=null, S=null, timer=null, kd=null, opts={air:false,water:true}, level=0, cache=[], logEl=null;

  function occupied(x,y){ const k=key(x,y); return S.snake.some(c=>c.x===x&&c.y===y)||S.fires.has(k)||(S.item&&key(S.item.x,S.item.y)===k)||(S.water&&key(S.water.x,S.water.y)===k)||(S.airItem&&key(S.airItem.x,S.airItem.y)===k); }
  function freeCell(far){ for(let i=0;i<500;i++){ const x=rnd(N),y=rnd(N); if(occupied(x,y)) continue; if(far&&Math.max(Math.abs(x-S.snake[0].x),Math.abs(y-S.snake[0].y))<far) continue; return {x,y}; } return {x:0,y:0}; }
  function fresh(){
    S={snake:[{x:9,y:9},{x:8,y:9},{x:7,y:9}],dir:{x:1,y:0},next:{x:1,y:0},grow:0,fires:new Set(),item:null,water:null,waterT:0,airItem:null,airT:0,air:100,score:0,status:'idle',tick:0,eaten:0,over:'',log:['Einsatzleitung bereit. Wähle die Herausforderungen und die Einsatzstufe.'],best:+(lget(BKEY,{}).snake||0),rec:false};
    S.item=freeCell(3); const f=freeCell(5); S.fires.add(key(f.x,f.y));
  }
  const speed=()=>LEVELS[level].s-Math.min(60,S.eaten*4);
  function note(t){ S.log.push(t); if(S.log.length>6) S.log.shift(); }
  function finish(why){
    S.status='over'; S.over=why; clearTimeout(timer);
    if(S.score>S.best){ const b=lget(BKEY,{}); b.snake=S.score; lset(BKEY,b); S.best=S.score; S.rec=true; }
    note('Einsatz beendet: '+why); say('Einsatz beendet. '+why+'. '+S.score+' Punkte.'); render();
  }
  function tick(){
    if(!el||!el.isConnected){ stop(); return; }
    if(document.hidden){ pause(true); return; }
    S.dir=S.next; const h=S.snake[0], nx=h.x+S.dir.x, ny=h.y+S.dir.y, L=LEVELS[level];
    if(nx<0||ny<0||nx>=N||ny>=N) return finish('Gegen die Gebäudewand gefahren');
    const tail=S.grow>0?-1:S.snake.length-1;
    for(let i=0;i<S.snake.length;i++) if(i!==tail&&S.snake[i].x===nx&&S.snake[i].y===ny) return finish('In die eigene Schlauchleitung gefahren');
    if(S.fires.has(key(nx,ny))) return finish('In die Flammen gelaufen');
    S.snake.unshift({x:nx,y:ny}); if(S.grow>0) S.grow--; else S.snake.pop();
    S.tick++;
    if(opts.air){ S.air-=.5+L.f; if(S.air<=0){ S.air=0; return finish('Atemluft aufgebraucht'); } }
    if(S.item&&nx===S.item.x&&ny===S.item.y){ S.grow++; S.score+=10; S.eaten++; note('Feuerlöscher aufgenommen (+10)'); S.item=null; }
    if(S.airItem&&nx===S.airItem.x&&ny===S.airItem.y){ S.air=Math.min(100,S.air+42); S.score+=5; note('Druckluftflasche gewechselt (+42 % Luft)'); S.airItem=null; }
    if(S.water&&nx===S.water.x&&ny===S.water.y){
      let bk=null,bd=1e9; S.fires.forEach(k=>{ const d=Math.abs(k%N-nx)+Math.abs(Math.floor(k/N)-ny); if(d<bd){ bd=d; bk=k; } });
      if(bk!==null){ S.fires.delete(bk); S.score+=15; note('Löschwasser: ein Brandherd gelöscht (+15)'); } else { S.score+=5; note('Löschwasser aufgenommen, kein Brandherd mehr (+5)'); }
      S.water=null;
    }
    if(!S.item) S.item=freeCell(2);
    if(S.tick%4===0&&Math.random()<L.f*4){
      const arr=Array.from(S.fires), src=arr.length?arr[rnd(arr.length)]:null; let c=null;
      if(src===null) c=freeCell(5); else { const d=[[1,0],[-1,0],[0,1],[0,-1]][rnd(4)], cx=src%N+d[0], cy=Math.floor(src/N)+d[1]; if(cx>=0&&cy>=0&&cx<N&&cy<N&&!occupied(cx,cy)) c={x:cx,y:cy}; }
      if(c){ S.fires.add(key(c.x,c.y)); if(S.fires.size%6===0) note('Feuer breitet sich aus – '+S.fires.size+' Brandherde'); }
    }
    if(opts.water&&!S.water&&S.fires.size>=3&&S.tick%9===0){ S.water=freeCell(0); S.waterT=70; }
    if(S.water&&--S.waterT<=0) S.water=null;
    if(opts.air&&!S.airItem&&S.tick%8===0&&S.air<85){ S.airItem=freeCell(2); S.airT=75; }
    if(S.airItem&&--S.airT<=0) S.airItem=null;
    render(); timer=setTimeout(tick,speed());
  }
  function run(){ clearTimeout(timer); S.status='run'; render(); timer=setTimeout(tick,speed()); }
  function pause(force){ if(S.status==='run'&&force!==false){ S.status='pause'; clearTimeout(timer); render(); } else if(S.status==='pause'&&force!==true) run(); }
  function dir(dx,dy){ if(!S||S.status==='over') return; if(S.dir.x===-dx&&S.dir.y===-dy) return; S.next={x:dx,y:dy}; if(S.status==='idle'||S.status==='pause') run(); }
  function setOpt(k){ if(S.status==='run') return; opts[k]=!opts[k]; lset(OKEY,opts); fresh(); render(); }
  function setLevel(i){ if(S.status==='run') return; level=i; fresh(); render(); }

  function build(){
    const cells=[]; for(let i=0;i<N*N;i++) cells.push('<div class="sn-c"></div>');
    el.innerHTML=`<div class="pz-card sn">
      <div class="sn-sec">Herausforderungen</div>
      <div class="sn-opts" role="group" aria-label="Herausforderungen">
        <button type="button" role="checkbox" class="sn-opt" data-o="air"><i class="sn-cb" aria-hidden="true"></i><span><b>Atemluft</b><small>Luftvorrat sinkt</small></span></button>
        <button type="button" role="checkbox" class="sn-opt" data-o="water"><i class="sn-cb" aria-hidden="true"></i><span><b>Löschwasser</b><small>löscht einen Brandherd</small></span></button></div>
      <div class="sn-sec">Einsatzstufe</div>
      <div class="sn-lv" role="group" aria-label="Einsatzstufe">${LEVELS.map((l,i)=>`<button type="button" class="sn-l" data-l="${i}"><b>Stufe ${i+1}</b><small>${l.t}</small></button>`).join('')}</div>
      <div class="sn-hud"><div><b data-h="score">0</b><span>Punkte</span></div><div><b data-h="best">0</b><span>Rekord</span></div><div><b data-h="len">3</b><span>Länge</span></div><div><b data-h="fires">0</b><span>Brandherde</span></div></div>
      <div class="sn-air" hidden><span>Atemluft</span><i><b></b></i></div>
      <div class="sn-wrap"><div class="sn-board" role="img" aria-label="Spielfeld Einsatzleitung-Snake">${cells.join('')}</div><div class="sn-ov"></div></div>
      <div class="sn-log" aria-live="polite"></div>
      <div class="sn-pad"><button type="button" data-d="u" aria-label="hoch">▲</button><button type="button" data-d="l" aria-label="links">◀</button><button type="button" data-d="d" aria-label="runter">▼</button><button type="button" data-d="r" aria-label="rechts">▶</button></div>
      <div class="sn-tools"><button type="button" class="pz-sec2" data-t="pause">Pause</button><button type="button" class="pz-sec2" data-t="new">Neu starten</button></div>
      <div class="pz-fb">Pfeiltasten / WASD oder wischen · Leertaste = Pause</div></div>`;
    cache=new Array(N*N).fill('');
    el.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>setOpt(b.dataset.o));
    el.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>setLevel(+b.dataset.l));
    el.querySelectorAll('.sn-pad [data-d]').forEach(b=>b.addEventListener('pointerdown',e=>{ e.preventDefault(); const d=b.dataset.d; dir(d==='l'?-1:d==='r'?1:0,d==='u'?-1:d==='d'?1:0); }));
    el.querySelector('[data-t="pause"]').onclick=()=>{ if(S.status==='idle'||S.status==='over'){ if(S.status==='over') fresh(); run(); } else pause(); };
    el.querySelector('[data-t="new"]').onclick=()=>{ fresh(); render(); };
    el.querySelector('.sn-ov').addEventListener('click',e=>{ if(!e.target.closest('button')) return; if(S.status==='over') fresh(); run(); });
    const bd=el.querySelector('.sn-board'); let t0=null;
    bd.addEventListener('pointerdown',e=>{ t0={x:e.clientX,y:e.clientY}; });
    bd.addEventListener('pointerup',e=>{ if(!t0) return; const dx=e.clientX-t0.x, dy=e.clientY-t0.y; t0=null; if(Math.max(Math.abs(dx),Math.abs(dy))<18) return; if(Math.abs(dx)>Math.abs(dy)) dir(dx>0?1:-1,0); else dir(0,dy>0?1:-1); });
    logEl=el.querySelector('.sn-log');
  }
  function render(){
    if(!el||!el.isConnected) return;
    const run=S.status==='run';
    el.querySelectorAll('[data-o]').forEach(b=>{ const on=!!opts[b.dataset.o]; b.classList.toggle('on',on); b.setAttribute('aria-checked',on); b.disabled=run; });
    el.querySelectorAll('[data-l]').forEach(b=>{ const on=+b.dataset.l===level; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); b.disabled=run; });
    const set=(k,v)=>{ const n=el.querySelector('[data-h="'+k+'"]'); if(n&&n.textContent!==String(v)) n.textContent=v; };
    set('score',S.score); set('best',Math.max(S.best,S.score)); set('len',S.snake.length); set('fires',S.fires.size);
    const air=el.querySelector('.sn-air'); air.hidden=!opts.air; if(opts.air){ air.classList.toggle('low',S.air<30); air.querySelector('b').style.width=Math.max(0,S.air)+'%'; }
    const map={}; S.fires.forEach(k=>{map[k]='fire';});
    if(S.item) map[key(S.item.x,S.item.y)]='item'; if(S.water) map[key(S.water.x,S.water.y)]='water'; if(S.airItem) map[key(S.airItem.x,S.airItem.y)]='air';
    S.snake.forEach((c,i)=>{ map[key(c.x,c.y)]=i===0?'head':(i%4===0?'body cup':'body'); });
    const cs=el.querySelectorAll('.sn-c');
    for(let i=0;i<N*N;i++){ const v=map[i]||''; if(cache[i]!==v){ cache[i]=v; cs[i].className='sn-c'+(v?' '+v:''); const ch=CH[v]; cs[i].textContent=ch||''; } }
    logEl.innerHTML=S.log.map((t,i)=>`<div class="sn-ln${i===S.log.length-1?' last':''}">${esc(t)}</div>`).join('');
    el.querySelector('[data-t="pause"]').textContent=run?'Pause':S.status==='pause'?'Weiter':S.status==='over'?'Nochmal':'Start';
    const ov=el.querySelector('.sn-ov');
    if(run){ ov.hidden=true; return; }
    ov.hidden=false; const L=LEVELS[level];
    if(S.status==='over') ov.innerHTML=`<h3>Einsatz beendet</h3><p>${esc(S.over)} · ${S.score} Punkte${S.rec?'<br><b>Neuer Rekord!</b>':''}</p><button type="button" class="pz-pri">Nochmal</button>`;
    else if(S.status==='pause') ov.innerHTML='<h3>Pause</h3><p>Zum Weiterspielen tippen.</p><button type="button" class="pz-pri">Weiter</button>';
    else ov.innerHTML=`<h3>Einsatzbereit</h3><p>${L.n} – ${L.t}. Fahre mit dem Trupp, sammle Feuerlöscher (🧯) und meide die Flammen.${opts.air?' Atemluft: Der Vorrat sinkt, hol dir Flaschen (💨).':''}${opts.water?' Löschwasser (💧) löscht einen Brandherd.':' Ohne Löschwasser kannst du die Brandherde nur umfahren.'}</p><button type="button" class="pz-pri">Los geht’s</button>`;
  }
  function start(host){
    stop(); el=host; opts=Object.assign({air:false,water:true},lget(OKEY,{}));
    build(); fresh(); render();
    kd=e=>{
      if(!el||!el.isConnected||e.ctrlKey||e.metaKey||e.altKey) return;
      const t=e.target; if(t&&t.closest&&t.closest('input,textarea,select,[contenteditable]')) return;
      const m={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}, k=m[e.key]||m[(e.key||'').toLowerCase()];
      if(k){ e.preventDefault(); dir(k[0],k[1]); }
      else if(e.key===' '&&!(t&&t.closest&&t.closest('button'))){ e.preventDefault(); if(S.status==='idle') run(); else if(S.status==='over'){ fresh(); run(); } else pause(); }
    };
    document.addEventListener('keydown',kd);
  }
  function stop(){ clearTimeout(timer); timer=null; if(kd){ document.removeEventListener('keydown',kd); kd=null; } el=null; }
  return {start,stop,_state:()=>S};
})();
