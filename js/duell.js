/* ======================================================================
   EINSATZFAHRT-DUELL – zwei Spieler live gegeneinander
   Verbindung: WebRTC (direkt von Gerät zu Gerät), die Verbindungsdaten
   werden per QR-Code (oder Kurzcode zum Kopieren) getauscht – ohne Server.
   Wird erst beim Öffnen des Duells geladen (js/pause.js → DUELLGAME).
====================================================================== */
const DUELL=(function(){
  const NK='bvi_duell_name',BK='bvi_duell_bilanz',SK='bvi_duell_stun',MK='bvi_duell_cfg';
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const get=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
  const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  let root=null,F=null,loadJs=null,pc=null,dc=null,role='',me='',opp='',cfg={n:5,mods:['VAk','IBK']},ready={me:false,opp:false},sigOk=true;
  let hb=0,lastRx=0,down=false,downAt=0,stream=null,scanT=0,gameOn=false,alive=false,tm=0;

  /* ---------- Verbindungsdaten klein machen (nur das Nötige, ca. 250 Zeichen) ---------- */
  const b64=b=>btoa(b).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
  const unb64=s=>atob(s.replace(/-/g,'+').replace(/_/g,'/'));
  function pack(sdp){
    const g=r=>{const m=sdp.match(r);return m?m[1]:'';};
    const uf=g(/a=ice-ufrag:(\S+)/),pw=g(/a=ice-pwd:(\S+)/),fp=g(/a=fingerprint:sha-256 (\S+)/),setup=g(/a=setup:(\S+)/);
    const c=[...sdp.matchAll(/a=candidate:(\S+) 1 udp (\d+) (\S+) (\d+) typ (host|srflx)/gi)].map(m=>[m[1],m[2],m[3],m[4],m[5].toLowerCase()==='host'?'h':'s'].join(','));
    const hosts=c.filter(x=>x.endsWith(',h')).slice(0,3),srf=c.filter(x=>x.endsWith(',s')).slice(0,2);
    const fb=b64(fp.split(':').map(h=>String.fromCharCode(parseInt(h,16))).join(''));
    return 'D1~'+[uf,pw,fb,setup==='actpass'?'o':'a',hosts.concat(srf).join(';')].join('~');
  }
  function unpack(code){
    const p=String(code).trim().split('~');if(p[0]!=='D1'||p.length<6)throw new Error('bad');
    const [,uf,pw,fb,s,cs]=p;
    const fp=[...unb64(fb)].map(ch=>ch.charCodeAt(0).toString(16).padStart(2,'0').toUpperCase()).join(':');
    const L=['v=0','o=- 1 2 IN IP4 127.0.0.1','s=-','t=0 0','a=group:BUNDLE 0','a=msid-semantic: WMS','m=application 9 UDP/DTLS/SCTP webrtc-datachannel','c=IN IP4 0.0.0.0','a=ice-ufrag:'+uf,'a=ice-pwd:'+pw,'a=fingerprint:sha-256 '+fp,'a=setup:'+(s==='o'?'actpass':'active'),'a=mid:0','a=sctp-port:5000','a=max-message-size:262144'];
    (cs?cs.split(';'):[]).forEach(x=>{const [f,pr,ip,po,ty]=x.split(',');L.push('a=candidate:'+f+' 1 udp '+pr+' '+ip+' '+po+' typ '+(ty==='h'?'host':'srflx raddr 0.0.0.0 rport 0'));});
    L.push('a=end-of-candidates');return L.join('\r\n')+'\r\n';
  }
  const gathered=c=>new Promise(res=>{if(c.iceGatheringState==='complete')return res();const t=setTimeout(res,6000);c.addEventListener('icegatheringstatechange',()=>{if(c.iceGatheringState==='complete'){clearTimeout(t);res();}});});

  /* ---------- Anzeige ---------- */
  const card=h=>{if(root)root.innerHTML='<div class="pz-card">'+h+'</div>';};
  const san=s=>String(s||'').replace(/[<>&"]/g,'').trim().slice(0,12)||'Spieler';
  function intro(msg){stopScan();teardown(true);
    me=get(NK,'');const stun=get(SK,true);
    card(`<div class="pz-lbl"><span>Einsatzfahrt-Duell</span><b>2 Spieler</b></div><div class="pz-qt">Wer ist schneller am Einsatzort?</div>
      <div class="pz-fb">Ihr spielt live dieselben Prüfungsfragen auf derselben Strecke und seht, wo der andere gerade ist. Verbunden werdet ihr direkt per QR-Code, ohne Anmeldung und ohne Server.</div>
      ${msg?`<div class="pz-fb r"><b>${esc(msg)}</b></div>`:''}
      <label class="pz-fld">Dein Name<input class="pz-in" id="dn" maxlength="12" value="${esc(me)}" placeholder="z. B. Max"></label>
      <label class="pz-chk"><input type="checkbox" id="ds" ${stun?'checked':''}><span>Hilfsdienst für Mobilfunk nutzen (nötig, wenn ihr nicht im selben WLAN seid)</span></label>
      <div class="pz-fb"><b>Datenschutz:</b> Dein Gegner sieht beim Verbinden deine IP-Adresse. Mit Hilfsdienst erfährt auch Google (STUN-Server) kurz deine IP-Adresse; Inhalte werden dort nicht übertragen. Ohne Hilfsdienst klappt die Verbindung nur im selben WLAN.</div>
      <button class="pz-pri" data-a="host">Duell eröffnen (du zeigst den QR-Code)</button><button class="pz-sec2" data-a="join" style="align-self:flex-start">Duell beitreten (du scannst)</button>`);
  }
  function readIntro(){me=san((root.querySelector('#dn')||{}).value);put(NK,me);const s=root.querySelector('#ds');put(SK,s?s.checked:true);}
  async function qr(el,text){try{await loadJs('js/qrcode.min.js');const q=qrcode(0,'L');q.addData(text);q.make();el.innerHTML=q.createSvgTag({cellSize:4,margin:3,scalable:true});}catch(e){el.innerHTML='<div class="pz-fb">QR-Code konnte nicht erzeugt werden. Nutze den Kurzcode.</div>';}}
  const copy=async(t,btn)=>{try{await navigator.clipboard.writeText(t);}catch(e){const a=root.querySelector('.pz-code');if(a){a.select();try{document.execCommand('copy');}catch(x){}}}if(btn){const o=btn.textContent;btn.textContent='Kopiert';setTimeout(()=>btn.textContent=o,1400);}};

  /* ---------- Kamera: QR scannen ---------- */
  function stopScan(){clearTimeout(scanT);scanT=0;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}}
  async function scan(box,onCode,onErr){
    stopScan();
    try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});}catch(e){onErr('Die Kamera ist nicht verfügbar oder nicht erlaubt. Nutze den Kurzcode unten.');return;}
    const v=document.createElement('video');v.setAttribute('playsinline','');v.muted=true;v.srcObject=stream;box.innerHTML='';box.appendChild(v);
    try{await v.play();}catch(e){}
    let det=null;if('BarcodeDetector' in window){try{det=new BarcodeDetector({formats:['qr_code']});}catch(e){det=null;}}
    if(!det){try{await loadJs('js/jsqr.min.js');}catch(e){onErr('Der Scan-Baustein konnte nicht geladen werden. Nutze den Kurzcode.');return;}}
    const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
    const step=async()=>{if(!stream)return;
      if(v.readyState>=2&&v.videoWidth){try{
        if(det){const r=await det.detect(v);if(r&&r[0]&&r[0].rawValue){stopScan();onCode(r[0].rawValue);return;}}
        else{const k=Math.min(1,640/v.videoWidth);cv.width=Math.round(v.videoWidth*k);cv.height=Math.round(v.videoHeight*k);cx.drawImage(v,0,0,cv.width,cv.height);const id=cx.getImageData(0,0,cv.width,cv.height),r=jsQR(id.data,id.width,id.height);if(r&&r.data){stopScan();onCode(r.data);return;}}
      }catch(e){}}
      scanT=setTimeout(step,det?120:220);};
    step();
  }
  function scanBox(title,hint,onCode){
    card(`<div class="pz-lbl"><span>${esc(title)}</span></div><div class="pz-qt">${esc(hint)}</div><div class="pz-scan" id="sc"><div class="pz-fb" style="padding:30px 12px;text-align:center">Kamera wird gestartet …</div></div><div class="pz-fb" id="se"></div>
      <div class="pz-lbl"><span>Oder Kurzcode einfügen</span></div><textarea class="pz-code" id="pc" rows="3" placeholder="D1~…"></textarea><button class="pz-sec2" data-a="paste" style="align-self:flex-start">Code übernehmen</button><button class="pz-sec2" data-a="cancel" style="align-self:flex-start">Abbrechen</button>`);
    root._onCode=onCode;
    scan(root.querySelector('#sc'),onCode,m=>{const e=root.querySelector('#se');if(e)e.innerHTML='<b>'+esc(m)+'</b>';const s=root.querySelector('#sc');if(s)s.style.display='none';});
  }

  /* ---------- Verbindung ---------- */
  function mkPc(){const stun=get(SK,true);pc=new RTCPeerConnection({iceServers:stun?[{urls:'stun:stun.l.google.com:19302'}]:[]});
    pc.onconnectionstatechange=()=>{if(!pc)return;const s=pc.connectionState;if(s==='failed'||s==='closed')setDown(true);else if(s==='connected'){if(down&&dc&&dc.readyState==='open')lastRx=performance.now();}};
    pc.ondatachannel=e=>wire(e.channel);}
  function wire(ch){dc=ch;dc.onopen=()=>{alive=true;lastRx=performance.now();send({t:'hello',name:me,sig:F.sig()});startHb();};dc.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch(x){return;}rx(m);};dc.onclose=()=>setDown(true);}
  const send=m=>{try{if(dc&&dc.readyState==='open')dc.send(JSON.stringify(m));}catch(e){}};
  function startHb(){clearInterval(hb);hb=setInterval(()=>{send({t:'ping'});if(performance.now()-lastRx>6000)setDown(true);if(down&&performance.now()-downAt>30000){setDown(false,true);giveUp();}},2000);}
  function setDown(on,force){if(on&&!down){down=true;downAt=performance.now();if(gameOn)F.duelPause(true);else if(alive)card('<div class="pz-qt">Verbindung unterbrochen</div><div class="pz-fb">Warte auf die Verbindung …</div>');}
    else if(!on&&down){down=false;if(gameOn)F.duelPause(false);else if(!force&&alive)lobby();}}
  function giveUp(){if(gameOn){F.duelMsg({t:'bye'});}else{intro('Die Verbindung ist abgebrochen.');}}
  function teardown(silent){clearInterval(hb);hb=0;clearTimeout(tm);if(!silent)send({t:'bye'});try{dc&&dc.close();}catch(e){}try{pc&&pc.close();}catch(e){}dc=pc=null;alive=false;down=false;gameOn=false;ready={me:false,opp:false};opp='';}

  async function host(){readIntro();if(!window.RTCPeerConnection)return intro('Dieser Browser unterstützt keine direkte Verbindung (WebRTC).');
    role='host';card('<div class="pz-center">Verbindungscode wird erzeugt …</div>');
    try{mkPc();wire(pc.createDataChannel('duell',{ordered:true}));await pc.setLocalDescription(await pc.createOffer());await gathered(pc);}catch(e){return intro('Der Verbindungscode konnte nicht erzeugt werden.');}
    const code=pack(pc.localDescription.sdp);
    card(`<div class="pz-lbl"><span>Schritt 1 von 2 · Spieler 1</span></div><div class="pz-qt">Dein Mitspieler öffnet „Duell beitreten“ und scannt diesen Code</div><div class="pz-qr" id="qr"></div>
      <div class="pz-fb">Klappt der Scan nicht, schick den Kurzcode per Messenger:</div><textarea class="pz-code" readonly rows="3">${esc(code)}</textarea><button class="pz-sec2" data-a="copy" style="align-self:flex-start">Kurzcode kopieren</button>
      <button class="pz-pri" data-a="next1">Weiter: Antwort-Code scannen</button><button class="pz-sec2" data-a="cancel" style="align-self:flex-start">Abbrechen</button>`);
    root._code=code;qr(root.querySelector('#qr'),code);}
  function hostScan(){scanBox('Schritt 2 von 2 · Spieler 1','Scanne jetzt den Antwort-Code deines Mitspielers',async txt=>{try{await pc.setRemoteDescription({type:'answer',sdp:unpack(txt)});waitConn();}catch(e){intro('Der Antwort-Code ist ungültig. Bitte noch einmal von vorn.');}});}
  async function join(){readIntro();if(!window.RTCPeerConnection)return intro('Dieser Browser unterstützt keine direkte Verbindung (WebRTC).');
    role='guest';scanBox('Schritt 1 von 2 · Spieler 2','Scanne den Code von Spieler 1',async txt=>{
      try{mkPc();await pc.setRemoteDescription({type:'offer',sdp:unpack(txt)});card('<div class="pz-center">Antwort wird erzeugt …</div>');await pc.setLocalDescription(await pc.createAnswer());await gathered(pc);}catch(e){return intro('Der Code ist ungültig. Bitte noch einmal von vorn.');}
      const code=pack(pc.localDescription.sdp);
      card(`<div class="pz-lbl"><span>Schritt 2 von 2 · Spieler 2</span></div><div class="pz-qt">Spieler 1 scannt jetzt diesen Antwort-Code</div><div class="pz-qr" id="qr"></div>
        <div class="pz-fb">Oder per Messenger schicken:</div><textarea class="pz-code" readonly rows="3">${esc(code)}</textarea><button class="pz-sec2" data-a="copy" style="align-self:flex-start">Kurzcode kopieren</button><div class="pz-drv"><i></i><span>Warte auf die Verbindung …</span></div><button class="pz-sec2" data-a="cancel" style="align-self:flex-start">Abbrechen</button>`);
      root._code=code;qr(root.querySelector('#qr'),code);waitConn();});}
  function waitConn(){clearTimeout(tm);tm=setTimeout(()=>{if(!alive){stopScan();teardown(true);intro('Die Verbindung kam nicht zustande. Tipp: Beide im selben WLAN, oder den Hilfsdienst einschalten. In manchen Mobilfunknetzen ist keine direkte Verbindung möglich.');}},30000);
    if(root&&!root.querySelector('.pz-drv'))card('<div class="pz-lbl"><span>Verbinde</span></div><div class="pz-drv"><i></i><span>Verbindung wird aufgebaut …</span></div>');}

  /* ---------- Lobby ---------- */
  const modsAvail=m=>F.questions().filter(q=>q.m===m).length;
  function lobby(){clearTimeout(tm);if(!root||gameOn)return;
    const isH=role==='host',tot=F.questions().filter(q=>cfg.mods.includes(q.m)).length;
    card(`<div class="pz-lbl"><span>Lobby</span><b>${esc(me)} gegen ${esc(opp||'…')}</b></div>
      ${!opp?'<div class="pz-drv"><i></i><span>Warte auf den Mitspieler …</span></div>':''}
      ${!sigOk?'<div class="pz-fb r"><b>Die App-Stände sind verschieden.</b> Bitte beide die Seite neu laden (Fragen müssen gleich sein).</div>':''}
      <div class="pz-qt">${isH?'Du stellst das Duell ein':esc(opp||'Spielleiter')+' stellt das Duell ein'}</div>
      <div class="pz-lbl"><span>Fragenzahl</span></div><div class="pz-seg">${[5,10,15].map(n=>`<button class="${cfg.n===n?'on':''}" data-a="n" data-v="${n}" ${isH?'':'disabled'}>${n}</button>`).join('')}</div>
      <div class="pz-lbl"><span>Module</span></div><div class="pz-chips">${F.MODS.map(([m,d])=>`<button class="pz-chip${cfg.mods.includes(m)?' on':''}" data-a="m" data-v="${m}" ${isH?'':'disabled'}><b>${m}</b><small>${d}<br>${modsAvail(m)} Fragen</small></button>`).join('')}</div>
      <div class="pz-fb">Regeln: gleiche Fragen in gleicher Reihenfolge, 30 Sekunden pro Frage, Fahrzeit je Frage fest, falsch +30 s, richtig −5 s. Punkte: 100 je richtige Antwort, 300 bei eingehaltener Hilfsfrist; bei Gleichstand gewinnt die schnellere Zeit. ${tot<cfg.n?'<b>Für diese Auswahl gibt es nur '+tot+' Fragen.</b>':''}</div>
      ${isH?`<button class="pz-pri" data-a="go" ${opp&&ready.opp&&sigOk&&cfg.mods.length&&tot?'':'disabled'}>${!opp?'Warte auf Mitspieler':ready.opp?'Los geht’s':'Warte auf „Bereit“'}</button>`
           :`<button class="pz-pri" data-a="ready" ${opp&&sigOk?'':'disabled'}>${ready.me?'Bereit ✓ (tippen zum Zurücknehmen)':'Bereit'}</button>`}
      <button class="pz-sec2" data-a="cancel" style="align-self:flex-start">Duell verlassen</button>`);}
  function sendCfg(){send({t:'cfg',n:cfg.n,mods:cfg.mods});}

  function launch(c){gameOn=true;stopScan();clearTimeout(tm);
    const sess={cfg:c,opp:opp,send,close:()=>{send({t:'bye'});teardown(true);},
      record(name,res){const b=get(BK,{}),k=name.toLowerCase();const r=b[k]||{w:0,l:0,d:0};if(res==='w')r.w++;else if(res==='l')r.l++;else if(res==='d')r.d++;b[k]=r;put(BK,b);return r;},
      rematch(){if(role!=='host')return;const nc={n:c.n,mods:c.mods,seed:(Math.random()*2147483647)|0};send({t:'go',cfg:nc});launch(nc);}};
    F.startDuel(root,sess);}
  function startHostGame(){const tot=F.questions().filter(q=>cfg.mods.includes(q.m)).length,c={n:Math.min(cfg.n,tot),mods:cfg.mods.slice(),seed:(Math.random()*2147483647)|0};put(MK,{n:cfg.n,mods:cfg.mods});send({t:'go',cfg:c});launch(c);}

  /* ---------- Nachrichten ---------- */
  function rx(m){lastRx=performance.now();if(down)setDown(false);
    switch(m.t){
      case 'ping':return;
      case 'hello':opp=san(m.name);if(opp===me)opp+=' (2)';sigOk=m.sig===F.sig();if(role==='host')sendCfg();lobby();return;
      case 'cfg':if(role==='guest'){cfg={n:m.n,mods:m.mods};ready.me=false;send({t:'ready',v:false});lobby();}return;
      case 'ready':ready.opp=!!m.v;if(role==='host')lobby();return;
      case 'go':if(role==='guest'&&m.cfg)launch(m.cfg);return;
      case 'bye':if(gameOn)F.duelMsg(m);else intro(esc(opp||'Der Mitspieler')+' hat das Duell verlassen.');return;
      default:if(gameOn)F.duelMsg(m);}}

  /* ---------- Bedienung ---------- */
  function onClick(e){const b=e.target.closest('[data-a]');if(!b||b.disabled||gameOn)return;const a=b.dataset.a,v=b.dataset.v;
    if(a==='host')host();else if(a==='join')join();
    else if(a==='copy')copy(root._code,b);
    else if(a==='next1')hostScan();
    else if(a==='paste'){const t=(root.querySelector('#pc')||{}).value;if(t&&t.trim()){stopScan();root._onCode&&root._onCode(t.trim());}}
    else if(a==='cancel'){stopScan();teardown(false);intro();}
    else if(a==='n'){if(cfg.n===+v)return;cfg.n=+v;sendCfg();lobby();}
    else if(a==='m'){const i=cfg.mods.indexOf(v);i>=0?cfg.mods.splice(i,1):cfg.mods.push(v);sendCfg();lobby();}
    else if(a==='ready'){ready.me=!ready.me;send({t:'ready',v:ready.me});lobby();}
    else if(a==='go')startHostGame();}

  return{
    start(el,fahrt,loader){root=el;F=fahrt;loadJs=loader;gameOn=false;const c=get(MK,null);if(c&&Array.isArray(c.mods))cfg={n:c.n||5,mods:c.mods};
      el.onclick=onClick;if(!window.RTCPeerConnection){card('<div class="pz-qt">Nicht verfügbar</div><div class="pz-fb">Dieser Browser unterstützt keine direkte Verbindung zwischen Geräten (WebRTC).</div>');return;}intro();},
    stop(){stopScan();teardown(false);if(root)root.onclick=null;},
    _pack:pack,_unpack:unpack
  };
})();
