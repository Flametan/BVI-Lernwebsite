/* ── Ranking und Wochenduell ────────────────────────────────────────────────
   Freiwillig, erreichbar über den Account-Knopf. Name und Profilbild kommen aus dem Account. Wer teilnimmt, sendet Name, ein kleines
   Vorschaubild, Gesamtpunkte und Wochenpunkte an den Sync-Server (derselbe wie beim Sync).
   Kennung und Zugriffsschlüssel sind zufällig und liegen nur auf diesem Gerät. Wird erst bei Bedarf geladen (js/game.js). */
const RANK=(function(){
  const K='bvi_rank', esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rnd=n=>{ const b=crypto.getRandomValues(new Uint8Array(n)); return Array.from(b,x=>x.toString(16).padStart(2,'0')).join(''); };
  const tok=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const st=()=>{ try{ return JSON.parse(localStorage.getItem(K)||'null'); }catch(e){ return null; } };
  const put=v=>{ try{ if(v) localStorage.setItem(K,JSON.stringify(v)); else localStorage.removeItem(K); }catch(e){} };
  const base=()=>(typeof SYNC!=='undefined'&&SYNC.url)?SYNC.url():'https://umbrel.taile733cb.ts.net';
  const ls=k=>{ try{ return localStorage.getItem(k)||''; }catch(e){ return ''; } };
  const myName=()=>ls('bvi_profile_name').trim().replace(/\s+/g,' ');
  const nameOk=n=>/^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,18}[\p{L}\p{N}]$/u.test(n);
  // Vorschaubild 48 × 48 aus dem Profilbild des Accounts (klein, damit die Listen schlank bleiben)
  function thumb(){
    const a=ls('bvi_avatar');
    if(!/^data:image\/jpeg;base64,/.test(a)) return Promise.resolve(null);
    return new Promise(res=>{ const im=new Image(); im.onload=()=>{ try{ const c=document.createElement('canvas'); c.width=c.height=48; c.getContext('2d').drawImage(im,0,0,48,48); res(c.toDataURL('image/jpeg',.7)); }catch(e){ res(null); } }; im.onerror=()=>res(null); im.src=a; });
  }
  const ini=n=>n.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const av=(n,a,cls)=>`<span class="rk-av${cls?' '+cls:''}"${a?` style="background-image:url(${a})"`:''}>${a?'':esc(ini(n))}</span>`;
  const kw=k=>String(k||'').slice(-2).replace(/^0/,'');
  let tab='week', el=null, busy=false, timer=0, lastRep=0;

  async function api(method,path,body){
    const s=st(); if(!s) throw new Error('nicht angemeldet');
    let r;
    try{ r=await fetch(base()+'/v1/rank/'+s.id+path,{method,headers:{'X-Rank-Token':s.token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(9000)}); }
    catch(e){ const x=new Error('Der Server ist gerade nicht erreichbar.'); x.net=true; throw x; }
    if(r.status===204) return {};
    let j={}; try{ j=await r.json(); }catch(e){}
    if(!r.ok){ const x=new Error(j.error||'Fehler '+r.status); x.code=r.status; throw x; }
    return j;
  }
  async function payload(){
    const p={name:myName(),xp:GAME._state().xp,week:{k:GAME.isoWeek(),xp:GAME.weekSum().xp}}, s=st(), t=await thumb();
    if((t||null)!==(s.av||null)) p.av=t;    // Bild nur senden, wenn es sich geändert hat
    return {p,t};
  }
  async function send(){
    const {p,t}=await payload(); await api('PUT','',p);
    const s=st(); if(s&&p.av!==undefined){ s.av=t; put(s); }
  }
  async function report(force){
    if(!st()||(!force&&Date.now()-lastRep<20000)) return;
    lastRep=Date.now();
    try{ await send(); }catch(e){}
  }
  // nach Spielereignissen: gesammelt, höchstens alle 30 Sekunden
  function touch(){ if(!st()) return; clearTimeout(timer); timer=setTimeout(()=>report(true),30000); }

  async function join(){
    const old=st(); put(old||{id:rnd(16),token:tok(),av:null});
    try{ await send(); lastRep=Date.now(); }
    catch(e){ put(old); throw e; }
  }
  async function leave(){ try{ await api('DELETE',''); }catch(e){ if(!e.net&&e.code!==404) throw e; } put(null); }

  /* ── Darstellung ── */
  const msg=(t,err)=>`<p class="rk-msg${err?' err':''}" role="status">${esc(t)}</p>`;
  async function intro(note){
    const n=myName(), t=await thumb(), ok=nameOk(n);
    el.innerHTML=`<div class="rk-me">${av(n||'?',t,'big')}<div><b>${esc(n||'Kein Name festgelegt')}</b><span>Dein Account</span></div></div>
      <p class="rk-lead">Mit der Teilnahme erscheinst du in der Rangliste und kannst Wochenduelle spielen. Übertragen werden dein <b>Name</b>, dein <b>Profilbild</b> (klein), deine <b>Gesamtpunkte</b> und deine <b>Wochenpunkte</b> an den Sync-Server, sonst nichts. Beim Aussteigen wird alles dort gelöscht.</p>
      ${ok?'<button type="button" class="g-btn" onclick="RANK.doJoin(this)">Teilnehmen</button>':'<p class="rk-msg err">Für das Ranking brauchst du im Account einen Namen mit 3–20 Zeichen (Buchstaben, Ziffern, Leerzeichen, . _ -).</p><button type="button" class="g-btn" onclick="ACCOUNT.open()">Account öffnen</button>'}${note||''}`;
  }
  async function doJoin(b){
    b.disabled=true;
    try{ await join(); busy=false; mount(el); }
    catch(e){ b.disabled=false; flash(e.message+(e.code===409?'. Ändere deinen Namen im Account.':''),true); }
  }
  async function mount(target){
    el=target||el; if(!el) return;
    if(!st()){ await intro(); return; }
    if(busy) return; busy=true;
    el.innerHTML='<p class="rk-lead">Ranking wird geladen …</p>';
    try{
      lastRep=Date.now(); await send();
      const [b,d]=await Promise.all([api('GET','?board='+tab),api('GET','/duels')]);
      draw(b,d);
    }catch(e){
      if(e.code===404){ put(null); busy=false; await intro(msg('Dein Eintrag war auf dem Server nicht mehr vorhanden. Du kannst erneut teilnehmen.')); }
      else if(e.code===409||e.code===422){ el.innerHTML=msg(e.message+'. Ändere deinen Namen im Account und öffne das Ranking erneut.',true)+'<button type="button" class="g-btn" onclick="ACCOUNT.open()">Account öffnen</button>'; }
      else el.innerHTML=msg(e.message,true)+'<button type="button" class="g-btn alt" onclick="RANK.mount()">Erneut versuchen</button>';
    }
    busy=false;
  }
  function draw(b,d){
    const me=myName(), rows=b.top.map(r=>`<li class="${r.me?'me':''}"><span class="rk-p">${r.place}</span>${av(r.name,r.av)}<span class="rk-n">${esc(r.name)}</span><b>${r.xp}</b>${r.me?'':`<button type="button" class="rk-sw" aria-label="${esc(r.name)} herausfordern" title="Herausfordern" onclick="RANK.challenge(this.dataset.n)" data-n="${esc(r.name)}">⚔</button>`}</li>`).join('');
    const mine=b.me&&b.me.place>20?`<li class="me gap"><span class="rk-p">${b.me.place}</span>${av(me,st().av)}<span class="rk-n">${esc(me)}</span><b>${b.me.xp}</b></li>`:'';
    const dl=d.duels.map(x=>{
      const inc=x.status==='pending'&&!x.mine;
      const stat={pending:x.mine?'wartet auf Antwort':'fordert dich heraus',active:'läuft',done:x.result==='win'?'Sieg':x.result==='lose'?'Niederlage':'Unentschieden',declined:'abgelehnt',expired:'nicht angenommen'}[x.status]||x.status;
      const act=inc?`<button type="button" class="g-btn" onclick="RANK.act('${x.id}','accept')">Annehmen</button><button type="button" class="g-btn alt" onclick="RANK.act('${x.id}','decline')">Ablehnen</button>`:(x.status==='pending'&&x.mine?`<button type="button" class="g-btn alt" onclick="RANK.act('${x.id}','cancel')">Zurückziehen</button>`:'');
      const sc=(x.status==='active'||x.status==='done')?`<div class="rk-sc"><span class="${x.me>=x.opp?'lead':''}"><b>${x.me}</b>Du</span><i>:</i><span class="${x.opp>x.me?'lead':''}"><b>${x.opp}</b>${esc(x.oppName)}</span></div>`:'';
      return `<li class="rk-d ${x.status}${x.result?' '+x.result:''}"><div class="rk-dh"><b class="rk-dn">${av(x.oppName,x.oppAv)}${esc(x.oppName)}</b><span>KW ${kw(x.wk)} · ${stat}</span></div>${sc}${act?`<div class="rk-da">${act}</div>`:''}</li>`;
    }).join('');
    el.innerHTML=`<div class="rk-tabs" role="tablist"><button type="button" role="tab" class="${tab==='week'?'on':''}" aria-selected="${tab==='week'}" onclick="RANK.setTab('week')">Diese Woche</button><button type="button" role="tab" class="${tab==='all'?'on':''}" aria-selected="${tab==='all'}" onclick="RANK.setTab('all')">Gesamt</button></div>
      <ol class="rk-list">${rows||'<li class="rk-empty">Noch niemand in der Liste.</li>'}${mine}</ol>
      <p class="rk-sub">${b.me?`Dein Platz: ${b.me.place} von ${b.total}`:'Sammle Punkte, um in der Liste zu erscheinen.'} · Du bist als „${esc(me)}“ dabei</p>
      <h3 class="rk-h">Wochenduell</h3>
      ${dl?`<ul class="rk-dl">${dl}</ul>`:'<p class="rk-sub">Fordere jemanden für eine Woche heraus: Wer bis Sonntag mehr Punkte sammelt, gewinnt. Tippe in der Liste auf ⚔ oder gib einen Namen ein.</p>'}
      <form class="rk-form" onsubmit="RANK.doChallenge(event)"><label for="rk-opp">Herausfordern (Name im Ranking)</label><div class="rk-row"><input id="rk-opp" maxlength="20" autocomplete="off" placeholder="Name"><button type="submit" class="g-btn">Los</button></div></form>
      <p class="rk-sub">Ein neues Duell zählt für KW ${kw(d.duelWeek)}.</p>
      <div class="rk-foot"><button type="button" class="g-btn alt" onclick="RANK.doLeave(this)">Ranking verlassen</button></div>`;
  }
  const flash=(t,err)=>{ if(!el) return; el.querySelectorAll('.rk-msg').forEach(n=>n.remove()); el.insertAdjacentHTML('beforeend',msg(t,err)); };
  async function challenge(name){
    try{ await api('POST','/duel',{name}); busy=false; await mount(); }
    catch(e){ flash(e.message,true); }
  }
  function doChallenge(ev){ ev.preventDefault(); const v=document.getElementById('rk-opp').value.trim(); if(v) challenge(v); }
  async function act(id,action){ try{ await api('POST','/duel/'+id,{action}); busy=false; await mount(); }catch(e){ flash(e.message,true); } }
  function setTab(t){ tab=t; busy=false; mount(); }
  let sure=0;
  async function doLeave(b){
    if(!sure){ sure=1; b.textContent='Wirklich verlassen? Nochmal tippen'; setTimeout(()=>{ sure=0; if(b.isConnected) b.textContent='Ranking verlassen'; },4000); return; }
    sure=0; try{ await leave(); mount(); }catch(e){ flash(e.message,true); }
  }
  return {mount,touch,report,doJoin,doChallenge,challenge,act,setTab,doLeave,on:()=>!!st()};
})();
