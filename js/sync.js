/* ── Sync ohne Konto ────────────────────────────────────────────────────────
   Ein Sync-Code (20 Zeichen) ersetzt das Konto. Aus ihm werden im Browser Kennung, Zugriffs-Token und
   Schlüssel abgeleitet (HKDF-SHA256). Der Server sieht nur verschlüsselte Daten (AES-GCM-256).
   Abgleich: Dreiwege-Zusammenführung je Schlüssel (lokal / letzter Stand / Server), mit beliebig vielen Geräten. */
const SYNC=(function(){
  const ALPHA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 32 eindeutige Zeichen (ohne I, O, 0, 1)
  const DEFAULT_URL='https://umbrel.taile733cb.ts.net';
  const APP_URL='https://flametan.github.io/BVI-Lernwebsite/';
  const K={code:'bvi_sync_code',base:'bvi_sync_base',ver:'bvi_sync_ver',last:'bvi_sync_last',url:'bvi_sync_url'};
  // Was synchronisiert wird: Lernstand, Notizen, Textmarkierungen, Lesezeichen – keine Geräte-Einstellungen
  const TRACK=/^bvi_(fc|fc_weak|fc_stars|fc_custom|game|progress|streak|usage|cards_day|cardgoal|hl|bookmarks|fb_answers|uk_scores|kf_scores|fq_scores|eq_scores|lb_ok|lb_vb|checks_[\w-]+|note_[\w-]+|quiz_(mastery|srs|stats|bm)|idfq_(mastery|srs|stats|bm|cat))$/;
  const enc=new TextEncoder(), dec=new TextDecoder();
  const ls={
    get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
    del(k){ try{ localStorage.removeItem(k); }catch(e){} }
  };
  let firstDone=false, own=false, busy=null, again=false, timer=null, status={state:'off',msg:''}, creds=null, credsFor=null;

  /* ── Code & Schlüssel ── */
  function newCode(){
    const b=crypto.getRandomValues(new Uint8Array(20));
    return Array.from(b,x=>ALPHA[x&31]).join('');
  }
  const norm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const valid=s=>{ s=norm(s); return s.length===20&&[...s].every(c=>ALPHA.includes(c)); };
  const pretty=s=>norm(s).match(/.{1,4}/g)?.join('-')||'';
  const b64=u=>{ let s=''; u.forEach(x=>s+=String.fromCharCode(x)); return btoa(s); };
  const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const b64u=u=>b64(u).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const hex=u=>Array.from(u,x=>x.toString(16).padStart(2,'0')).join('');
  async function derive(code){
    const k0=await crypto.subtle.importKey('raw',enc.encode(norm(code)),'HKDF',false,['deriveBits','deriveKey']);
    const bits=async(info,n)=>new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt:enc.encode('bvi-sync-v1'),info:enc.encode(info)},k0,n*8));
    const key=await crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:enc.encode('bvi-sync-v1'),info:enc.encode('key')},k0,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    return {id:hex(await bits('id',16)),token:b64u(await bits('token',32)),key};
  }
  async function getCreds(){
    const code=ls.get(K.code); if(!code) return null;
    if(!creds||credsFor!==code){ creds=await derive(code); credsFor=code; }
    return creds;
  }
  async function seal(c,obj){
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},c.key,enc.encode(JSON.stringify(obj))));
    const out=new Uint8Array(12+ct.length); out.set(iv); out.set(ct,12);
    return b64(out);
  }
  async function open(c,str){
    const raw=unb64(str);
    const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:raw.slice(0,12)},c.key,raw.slice(12));
    return JSON.parse(dec.decode(pt));
  }

  /* ── Zusammenführen ── */
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const idOf=x=>isObj(x)&&typeof x.id==='string'?'id:'+x.id:'j:'+JSON.stringify(x);
  // Listen als Menge: Neues von beiden Seiten bleibt, Gelöschtes (im letzten Stand vorhanden, jetzt weg) wird entfernt
  function mergeArr(l,b,r){
    b=b||[];
    const M=a=>{ const m=new Map(); a.forEach(x=>m.set(idOf(x),x)); return m; };
    const L=M(l),B=M(b),R=M(r),out=[],seen=new Set();
    const order=[...l,...r];
    for(const x of order){
      const id=idOf(x); if(seen.has(id)) continue; seen.add(id);
      const inL=L.has(id), inR=R.has(id), inB=B.has(id);
      if(inL&&inR){
        const lv=L.get(id), rv=R.get(id);
        out.push(same(lv,rv)?lv:(inB&&same(lv,B.get(id))?rv:lv));
      }else if(inL){ if(!inB) out.push(L.get(id)); }          // neu hier (sonst am anderen Gerät gelöscht)
      else if(inR){ if(!inB) out.push(R.get(id)); }
    }
    return out;
  }
  function mergeVal(l,b,r){
    if(same(l,r)) return l;
    if(same(l,b)) return r;
    if(same(r,b)) return l;
    if(l===undefined) return r;                      // an einem Ende gelöscht, am anderen geändert: Änderung behalten
    if(r===undefined) return l;
    if(Array.isArray(l)&&Array.isArray(r)) return mergeArr(l,Array.isArray(b)?b:[],r);
    if(isObj(l)&&isObj(r)){
      const bb=isObj(b)?b:{}, out={};
      new Set([...Object.keys(l),...Object.keys(r)]).forEach(k=>{
        const v=mergeVal(l[k],bb[k],r[k]); if(v!==undefined) out[k]=v;
      });
      return out;
    }
    if(typeof l==='number'&&typeof r==='number') return Math.max(l,r);   // Zähler, XP, Serien: der höhere Stand gewinnt
    if(typeof l==='string'&&typeof r==='string'){
      if(/^\d{4}-\d\d-\d\d/.test(l)&&/^\d{4}-\d\d-\d\d/.test(r)) return l>r?l:r;
      return l;
    }
    return l;
  }
  // Notizen sind Rohtext: bei Änderungen auf beiden Seiten gehen keine Zeilen verloren
  function mergeText(l,b,r){
    if(l===r) return l;
    if(l===b) return r;
    if(r===b) return l;
    if(l===undefined) return r;
    if(r===undefined) return l;
    if(l.includes(r)) return l;
    if(r.includes(l)) return r;
    return l.replace(/\s+$/,'')+'\n\n'+r.replace(/^\s+/,'');
  }
  function mergeKey(k,l,b,r){
    if(/^bvi_note_/.test(k)) return mergeText(l,b,r);
    const P=s=>{ if(s===undefined||s===null) return undefined; try{ return JSON.parse(s); }catch(e){ return {__raw:s}; } };
    const v=mergeVal(P(l),P(b),P(r));
    return v===undefined?undefined:(isObj(v)&&'__raw' in v?v.__raw:JSON.stringify(v));
  }
  function merge(local,base,remote){
    const out={};
    new Set([...Object.keys(local),...Object.keys(base||{}),...Object.keys(remote||{})]).forEach(k=>{
      const v=mergeKey(k,local[k],(base||{})[k],(remote||{})[k]);
      if(v!==undefined) out[k]=v;
    });
    return out;
  }

  function collect(){
    const d={};
    try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&TRACK.test(k)){ const v=localStorage.getItem(k); if(v!=null&&v.length<2e6) d[k]=v; } } }catch(e){}
    return d;
  }
  // Fremde Daten nur mit sinnvoller Form übernehmen (gleiche Prüfung wie beim Einspielen einer Sicherung)
  function accept(k,v){
    if(!TRACK.test(k)||typeof v!=='string') return false;
    return typeof BACKUP!=='undefined'&&BACKUP.check?BACKUP.check(k,v)!==null:true;
  }
  function apply(next){
    let n=0; own=true;
    try{
      const cur=collect();
      Object.keys(next).forEach(k=>{ if(cur[k]!==next[k]&&accept(k,next[k])){ ls.set(k,next[k]); n++; } });
      Object.keys(cur).forEach(k=>{ if(!(k in next)){ ls.del(k); n++; } });
    }finally{ own=false; }
    return n;
  }

  /* ── Netzwerk ── */
  const url=()=>(ls.get(K.url)||DEFAULT_URL).replace(/\/+$/,'');
  async function call(c,method,body,ver){
    const h={'X-Sync-Token':c.token};
    if(body!==undefined){ h['Content-Type']='application/json'; h['If-Match']=String(ver); }
    const ctl=new AbortController(), t=setTimeout(()=>ctl.abort(),20000);
    try{
      const res=await fetch(url()+'/v1/blob/'+c.id,{method,headers:h,body:body===undefined?undefined:JSON.stringify({data:body}),signal:ctl.signal,cache:'no-store'});
      let j=null; try{ j=await res.json(); }catch(e){}
      return {s:res.status,j};
    }finally{ clearTimeout(t); }
  }
  function setStatus(state,msg){
    status={state,msg:msg||''};
    document.querySelectorAll('[data-sync-status]').forEach(e=>{ e.textContent=label(); e.dataset.state=state; });
  }
  function label(){
    if(!connected()) return 'Nicht verbunden';
    const t=ls.get(K.last);
    if(status.state==='busy') return 'Gleicht ab …';
    if(status.state==='err') return status.msg||'Nicht erreichbar';
    if(status.state==='off'&&!t) return 'Verbunden';
    return t?'Zuletzt abgeglichen: '+new Date(t).toLocaleString('de-DE',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'}):'Verbunden';
  }
  const connected=()=>!!ls.get(K.code);

  async function run(mustExist){
    const c=await getCreds(); if(!c) return {ok:false};
    let baseSnap; try{ baseSnap=JSON.parse(ls.get(K.base)||'null'); }catch(e){ baseSnap=null; }
    let ver=parseInt(ls.get(K.ver),10)||0;
    for(let i=0;i<4;i++){
      const g=await call(c,'GET');
      let remote=null, rver=0;
      if(g.s===404){ if(mustExist) throw new Error('Diesen Code kennt der Server nicht. Bitte prüfe ihn oder erzeuge auf dem anderen Gerät einen neuen.'); remote=null; rver=0; }
      else if(g.s===200){
        try{ const o=await open(c,g.j.data); remote=o&&o.keys||{}; rver=g.j.version; }
        catch(e){ throw new Error('Daten lassen sich mit diesem Code nicht entschlüsseln'); }
      }
      else if(g.s===403) throw new Error('Code wird vom Server nicht akzeptiert');
      else if(g.s===429) throw new Error('Zu viele Anfragen – bitte später erneut');
      else throw new Error('Server antwortet nicht richtig ('+g.s+')');
      const local=collect();
      // Erster Abgleich auf diesem Gerät: kein gemeinsamer letzter Stand → alles gilt als neu, nichts wird gelöscht
      const base=remote===null&&baseSnap===null?{}:(baseSnap||{});
      const merged=remote===null?local:merge(local,base,remote);
      let newVer=rver;
      if(remote===null||!same(merged,remote)){
        const sealed=await seal(c,{v:1,keys:merged});
        const p=await call(c,'PUT',sealed,rver);
        if(p.s===409) continue;
        if(p.s===507) throw new Error('Server-Speicher ist voll');
        if(p.s===413) throw new Error('Datenmenge zu groß');
        if(p.s!==200) throw new Error('Speichern fehlgeschlagen ('+p.s+')');
        newVer=p.j.version;
      }
      const changed=apply(merged);
      ls.set(K.base,JSON.stringify(merged)); ls.set(K.ver,String(newVer)); ls.set(K.last,new Date().toISOString());
      return {ok:true,changed};
    }
    throw new Error('Gleichzeitige Änderungen – bitte erneut versuchen');
  }

  async function sync(opts){
    opts=opts||{};
    if(!connected()||!navigator.onLine&&!opts.force) return {ok:false};
    if(busy){ again=true; return busy; }
    setStatus('busy');
    busy=(async()=>{
      try{
        const r=await run(opts.mustExist);
        setStatus('ok');
        if(r.changed){
          refreshUi();
          if(!firstDone&&!sessionStorage.getItem('bvi_sync_rl')){ try{ sessionStorage.setItem('bvi_sync_rl','1'); }catch(e){} location.reload(); }
          else if(typeof TOAST!=='undefined') TOAST.show('Von einem anderen Gerät aktualisiert',{type:'ok',undo:()=>location.reload(),label:'Neu laden'});
        }
        firstDone=true;
        return r;
      }catch(e){
        const msg=e&&e.name==='AbortError'?'Server antwortet nicht':(e&&e.message&&!/fetch|network|Failed/i.test(e.message)?e.message:'Server nicht erreichbar');
        setStatus('err',msg); firstDone=true;
        return {ok:false,error:msg};
      }finally{
        busy=null;
        if(again){ again=false; schedule(1500); }
      }
    })();
    return busy;
  }
  function schedule(ms){
    if(!connected()) return;
    clearTimeout(timer); timer=setTimeout(()=>sync(),ms==null?4000:ms);
  }
  function refreshUi(){
    try{ if(typeof SHELL!=='undefined'){ SHELL.renderHome&&document.getElementById('v-home')?.classList.contains('active')&&SHELL.renderHome(); } }catch(e){}
  }

  /* ── Verbinden / Trennen ── */
  async function connect(code,mustExist){
    if(!valid(code)) throw new Error('Der Code ist nicht gültig. Er besteht aus 20 Zeichen (Buchstaben und Ziffern).');
    ls.set(K.code,norm(code)); ls.del(K.base); ls.del(K.ver); ls.del(K.last); creds=null;
    firstDone=true;
    const r=await sync({force:true,mustExist:!!mustExist});
    if(!r.ok){ ls.del(K.code); creds=null; setStatus('off'); throw new Error(r.error||'Verbindung fehlgeschlagen'); }
    return r;
  }
  async function create(){
    const code=newCode();
    await connect(code);
    return code;
  }
  function disconnect(){
    [K.code,K.base,K.ver,K.last].forEach(ls.del); creds=null; setStatus('off');
  }
  async function wipeServer(){
    const c=await getCreds(); if(!c) return false;
    const res=await fetch(url()+'/v1/blob/'+c.id,{method:'DELETE',headers:{'X-Sync-Token':c.token}});
    if(res.status===204||res.status===200||res.status===404){ disconnect(); return true; }
    throw new Error('Löschen fehlgeschlagen ('+res.status+')');
  }

  function menu(){
    if(!connected()){
      const c=dlg('<div class="sync-t">Auf mehreren Geräten lernen</div><p class="sync-p">Ohne Konto: Lernstand, Notizen, Markierungen und Lesezeichen gleichen sich über einen Code ab. Beliebig viele Geräte sind möglich.</p><div class="sync-b"><button class="btn btn-gold" id="sync-n">Neuen Code erzeugen</button><button class="btn btn-ghost" id="sync-j">Ich habe schon einen Code</button></div>');
      c.querySelector('#sync-n').onclick=startNew; c.querySelector('#sync-j').onclick=()=>startJoin();
    }else{
      const c=dlg('<div class="sync-t">Sync ist aktiv</div><p class="sync-p" data-sync-status data-state="'+status.state+'">'+esc(label())+'</p><div class="sync-b"><button class="btn btn-gold" id="sync-a">Jetzt abgleichen</button><button class="btn btn-ghost" id="sync-c">Code &amp; QR anzeigen</button></div><div class="sync-b"><button class="btn btn-ghost" id="sync-u">Serveradresse</button><button class="btn btn-ghost" id="sync-d">Trennen</button><button class="btn btn-ghost sync-danger" id="sync-w">Serverdaten löschen</button></div>');
      c.querySelector('#sync-a').onclick=e=>now(e.target); c.querySelector('#sync-c').onclick=showCode; c.querySelector('#sync-u').onclick=editUrl;
      c.querySelector('#sync-d').onclick=()=>{ disconnect(); close(); TOAST.show('Sync auf diesem Gerät beendet'); };
      c.querySelector('#sync-w').onclick=confirmWipe;
    }
  }
  /* ── Oberfläche: Karte in den Einstellungen und Dialog ── */
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let ov=null;
  function dlg(html,onClose){
    if(!ov){
      ov=document.createElement('div'); ov.id='sync-ov'; ov.className='sync-ov'; ov.hidden=true;
      ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
      ov.addEventListener('click',e=>{ if(e.target===ov||e.target.closest('.sync-x')) close(); });
      document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!ov.hidden) close(); });
      document.body.appendChild(ov);
    }
    ov.innerHTML='<div class="sync-card"><button class="sync-x" aria-label="Schließen">×</button>'+html+'</div>';
    ov.hidden=false; return ov.querySelector('.sync-card');
  }
  function close(){ if(ov) ov.hidden=true; }
  async function drawQr(el,code){
    try{ await APPSHARE.qr(el,APP_URL+'#sync='+norm(code)); }catch(e){ el.textContent='QR-Code nicht verfügbar – nutze den Code.'; }
  }
  function codeView(code,title,lead){
    const c=dlg('<div class="sync-t">'+esc(title)+'</div><p class="sync-p">'+lead+'</p>'
      +'<div class="sync-qr" role="img" aria-label="QR-Code mit dem Sync-Code"></div>'
      +'<div class="sync-code" id="sync-code-txt">'+esc(pretty(code))+'</div>'
      +'<div class="sync-b"><button class="btn btn-gold" id="sync-copy">Code kopieren</button><button class="btn btn-ghost" id="sync-ok">Fertig</button></div>'
      +'<p class="sync-warn">Wer diesen Code kennt, kann deine Lerndaten lesen und ändern. Gib ihn nicht weiter. Notiere ihn dir: Ohne Code lässt sich ein neues Gerät nicht verbinden.</p>');
    drawQr(c.querySelector('.sync-qr'),code);
    c.querySelector('#sync-copy').onclick=async()=>{ try{ await navigator.clipboard.writeText(pretty(code)); TOAST.show('Code kopiert',{type:'ok'}); }catch(e){ TOAST.show(pretty(code)); } };
    c.querySelector('#sync-ok').onclick=close;
  }
  async function startNew(){
    const c=dlg('<div class="sync-t">Code wird erzeugt …</div><p class="sync-p">Die Verbindung zum Server wird geprüft.</p>');
    try{
      const code=await create();
      codeView(code,'Dein Sync-Code','Scanne den QR-Code mit dem zweiten Gerät (Kamera-App) oder tippe den Code dort unter <b>Einstellungen → Auf mehreren Geräten lernen</b> ein.');
    }catch(e){
      c.innerHTML='<button class="sync-x" aria-label="Schließen">×</button><div class="sync-t">Das hat nicht geklappt</div><p class="sync-p">'+esc(e.message)+'</p><div class="sync-b"><button class="btn btn-gold" onclick="SYNC.startNew()">Erneut versuchen</button></div>';
    }
  }
  function startJoin(prefill){
    const c=dlg('<div class="sync-t">Code eingeben</div><p class="sync-p">Gib den Sync-Code von deinem anderen Gerät ein (20 Zeichen, Bindestriche sind egal).</p>'
      +'<input class="sync-in" id="sync-in" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" aria-label="Sync-Code">'
      +'<div class="sync-err" id="sync-err" role="alert"></div>'
      +'<div class="sync-b"><button class="btn btn-gold" id="sync-go">Verbinden</button><button class="btn btn-ghost" id="sync-no">Abbrechen</button></div>');
    const inp=c.querySelector('#sync-in'), err=c.querySelector('#sync-err'), go=c.querySelector('#sync-go');
    inp.addEventListener('input',()=>{ const p=pretty(inp.value.slice(0,40)); inp.value=p; err.textContent=''; });
    if(prefill) inp.value=pretty(prefill);
    const doit=async()=>{
      if(!valid(inp.value)){ err.textContent='Der Code besteht aus 20 Zeichen (Buchstaben A–Z ohne I und O, Ziffern 2–9).'; return; }
      go.disabled=true; go.textContent='Verbinde …';
      try{ await connect(inp.value,true); close(); TOAST.show('Verbunden – Lernstand wird abgeglichen',{type:'ok'}); }
      catch(e){ err.textContent=e.message; go.disabled=false; go.textContent='Verbinden'; }
    };
    go.onclick=doit; inp.addEventListener('keydown',e=>{ if(e.key==='Enter') doit(); });
    c.querySelector('#sync-no').onclick=close;
    setTimeout(()=>inp.focus({preventScroll:true}),50);
  }
  function showCode(){ codeView(ls.get(K.code)||'','Dein Sync-Code','Mit diesem Code verbindest du weitere Geräte.'); }
  async function now(btn){
    if(btn){ btn.disabled=true; }
    const r=await sync({force:true});
    if(btn) btn.disabled=false;
    TOAST.show(r.ok?'Abgeglichen':(r.error||'Fehlgeschlagen'),r.ok?{type:'ok'}:undefined);
  }
  function editUrl(){
    const c=dlg('<div class="sync-t">Serveradresse</div><p class="sync-p">Nur ändern, wenn du einen eigenen Sync-Server betreibst.</p><input class="sync-in" id="sync-url" type="url" value="'+esc(url())+'" aria-label="Serveradresse"><div class="sync-b"><button class="btn btn-gold" id="sync-us">Speichern</button><button class="btn btn-ghost" id="sync-ud">Standard</button></div>');
    c.querySelector('#sync-us').onclick=()=>{ const v=c.querySelector('#sync-url').value.trim(); if(/^https:\/\/[^\s]+$/.test(v)){ ls.set(K.url,v); close(); sync({force:true}); } else TOAST.show('Bitte eine https-Adresse eingeben'); };
    c.querySelector('#sync-ud').onclick=()=>{ ls.del(K.url); close(); sync({force:true}); };
  }
  function confirmWipe(){
    const c=dlg('<div class="sync-t">Serverdaten löschen?</div><p class="sync-p">Die verschlüsselten Daten werden auf dem Server gelöscht und der Sync endet auf diesem Gerät. Deine lokalen Daten bleiben. Andere Geräte verlieren die Verbindung.</p><div class="sync-b"><button class="btn btn-gold sync-danger" id="sync-yes">Löschen</button><button class="btn btn-ghost" id="sync-no">Abbrechen</button></div>');
    c.querySelector('#sync-no').onclick=close;
    c.querySelector('#sync-yes').onclick=async()=>{ try{ await wipeServer(); close(); TOAST.show('Serverdaten gelöscht',{type:'ok'}); }catch(e){ TOAST.show(e.message); } };
  }

  /* ── Start: Link mit #sync=… / Auslöser ── */
  function fromHash(){
    const code=window.__syncBoot; if(!code) return;
    window.__syncBoot=null;
    if(!valid(code)) return;
    if(connected()&&norm(ls.get(K.code))===norm(code)) return;
    const c=dlg('<div class="sync-t">Mit Sync-Code verbinden?</div><p class="sync-p">Dieses Gerät wird mit dem Lernstand des anderen Geräts abgeglichen. Vorhandene Notizen und Markierungen hier bleiben erhalten und werden zusammengeführt.</p><div class="sync-code">'+esc(pretty(code))+'</div><div class="sync-err" id="sync-err" role="alert"></div><div class="sync-b"><button class="btn btn-gold" id="sync-go">Verbinden</button><button class="btn btn-ghost" id="sync-no">Nicht jetzt</button></div>');
    c.querySelector('#sync-no').onclick=close;
    c.querySelector('#sync-go').onclick=async e=>{
      e.target.disabled=true; e.target.textContent='Verbinde …';
      try{ await connect(code,true); close(); TOAST.show('Verbunden',{type:'ok'}); }
      catch(er){ c.querySelector('#sync-err').textContent=er.message; e.target.disabled=false; e.target.textContent='Verbinden'; }
    };
  }
  function init(){
    // Schreibzugriffe auf synchronisierte Schlüssel lösen einen verzögerten Abgleich aus
    try{
      const set=Storage.prototype.setItem, del=Storage.prototype.removeItem;
      Storage.prototype.setItem=function(k,v){ set.call(this,k,v); if(!own&&this===localStorage&&TRACK.test(k)) schedule(); };
      Storage.prototype.removeItem=function(k){ del.call(this,k); if(!own&&this===localStorage&&TRACK.test(k)) schedule(); };
    }catch(e){}
    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') schedule(800); else if(connected()) sync(); });
    window.addEventListener('online',()=>schedule(500));
    if(connected()) sync();
    fromHash();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0)); else setTimeout(init,0);

  return {newCode,valid,norm,pretty,derive,merge,mergeVal,mergeArr,mergeText,collect,sync,connect,create,disconnect,connected,startNew,startJoin,showCode,now,editUrl,confirmWipe,open:menu,TRACK};
})();
