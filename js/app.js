/* ======================================================================
   NAVIGATIONS-ENGINE
   NAV.go(id, label) · NAV.back() · NAV.home() · NAV.jumpTo(idx)
====================================================================== */
/* ── Nachladen selten gebrauchter Teile (Szenarien, Fallbearbeitung, Update-Verlauf): ein Skript pro Datei, nur einmal ── */
const LAZY=(function(){
  const P={};
  return { script(src){ return P[src]||(P[src]=new Promise((ok,no)=>{ const x=document.createElement('script'); x.src=src; x.onload=ok; x.onerror=()=>{ delete P[src]; x.remove(); no(new Error(src)); }; document.body.appendChild(x); })); } };
})();

/* ── Eigene history.back()-Aufrufe (z. B. beim Schließen der Bildansicht): das dadurch ausgelöste popstate soll kein anderes Fenster und keine Seitennavigation auslösen.
   Dieser Wächter ist als erster registriert und schluckt das Ereignis, bevor LP, NAV & Co. es sehen. ── */
const POPGUARD=(function(){
  let until=0;
  window.addEventListener('popstate',e=>{ if(until>Date.now()){ until=0; e.stopImmediatePropagation(); } },true);
  return { back(){ until=Date.now()+700; try{ history.back(); }catch(e){ until=0; } } };
})();

const _NAVY_VIEWS = new Set(['v-simulator','v-flashcards','v-abkuerzungen','v-app','v-klausurfragen','v-klausur-0826','v-laufbahn-2023','v-laufbahn-2026']);
const _GOLD_VIEWS = new Set(['v-vak-klausurvorbereitung','v-feuak-bp-hub','v-feuak-analyse','v-idf-vb','v-idf-stabhub']);

/* ── Speicher absichern: voller oder gesperrter localStorage darf die App nicht lahmlegen ── */
(function(){
  let warned=0;
  function warn(){ if(Date.now()-warned<8000) return; warned=Date.now(); try{ TOAST.show('Speicher voll oder gesperrt – Änderungen werden nicht gespeichert'); }catch(e){} }
  let ls; try{ ls=window.localStorage; void ls.length; }catch(e){ ls=null; }
  if(!ls){   // Zugriff verweigert (z. B. alle Website-Daten blockiert): Speicher nur für diese Sitzung
    const m=new Map(), mem={ getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>{ m.set(String(k),String(v)); }, removeItem:k=>{ m.delete(k); }, clear:()=>m.clear(), key:i=>[...m.keys()][i]??null, get length(){ return m.size; } };
    try{ Object.defineProperty(window,'localStorage',{value:mem,configurable:true}); }catch(e){}
    return;
  }
  const P=Storage.prototype, si=P.setItem, gi=P.getItem, ri=P.removeItem;
  P.setItem=function(k,v){ try{ si.call(this,k,v); }catch(e){ warn(); } };
  P.getItem=function(k){ try{ return gi.call(this,k); }catch(e){ return null; } };
  P.removeItem=function(k){ try{ ri.call(this,k); }catch(e){} };
})();

const NAV = (function(){
  let stack = [];
  let _dir = 'forward';
  let _activeEl = null; // cached active view element – avoids O(90) DOM scan per navigation

  function show(id){
    if(typeof LB!=='undefined') id=LB.guard(id);   // gesperrter Bereich: ohne Passwort zur Sperrseite
    // O(2) view swap: deactivate previous, activate next
    if(!_activeEl) _activeEl = document.querySelector('.view.active');
    const next = document.getElementById(id);
    if(_activeEl && _activeEl !== next) _activeEl.classList.remove('active','nav-forward','nav-back');
    if(next){
      if(typeof VIEWS!=='undefined') VIEWS.enhance(next);
      next.classList.remove('nav-forward','nav-back');
      void next.offsetWidth;
      next.classList.add('active', _dir==='back'?'nav-back':'nav-forward');
      _activeEl = next;
    }
    window.scrollTo({top:0,behavior:'instant'});
    const isContentPage = (id.split('-').length > 2 && !_GOLD_VIEWS.has(id)) || _NAVY_VIEWS.has(id);
    if(typeof NOTES!=='undefined') NOTES.setView(id);
    if(typeof BOOKMARKS!=='undefined') BOOKMARKS.setView(id);
    SHELL.onShow(id, isContentPage, stack);
    if(id==='v-plan') IDF_PLAN.render();
    if(id==='v-app') INSTALL.render();
    ETIMER.mount(id);
    if(id==='v-flashcards'){ FC.syncFilters(); SHELL.renderFcSide(); }
    if(id==='v-home'){ SHELL.newQuip(); SHELL.renderHome(); }
    if(typeof GAME!=='undefined') GAME.onShow(id);
    if(id==='v-pruefung') SHELL.renderExam();
    if(typeof LB!=='undefined') LB.onShow(id);
    if(typeof JGUI!=='undefined'&&JGUI.names) setTimeout(JGUI.names,0);
    if(id==='v-settings') SHELL.syncSettings();
    if(id==='v-notizen') SHELL.renderNotes();
    if(id==='v-abkuerzungen') ABK.init();
    if(id==='v-vak-altklausur') QUIZ.init();
    if(id==='v-idf-altklausur') IDFQ.init();
    if(id==='v-klausurfragen') KF_QUIZ.init();
    if(id==='v-klausur') KLAUSUR_HUB.render();
    if(id==='v-vak-fallbearbeitung'){ if(typeof FALLBEARBEITUNG!=='undefined') FALLBEARBEITUNG.init(); else LAZY.script('js/fallbearbeitung.js').then(()=>FALLBEARBEITUNG.init()).catch(()=>TOAST.show('Die Seite konnte nicht geladen werden. Bitte Verbindung prüfen.',{type:'info'})); }
    if(id==='v-simulator'){ SIM._refreshCards(); if(_dir==='back'&&!document.getElementById('sim-game-wrap').classList.contains('hidden')){ SIM._pushed=false; SIM.backToMenu(); } }
    if(id==='v-app' && window._isChromium){
      const w = document.getElementById('apk-chromium-warn');
      if(w) w.classList.remove('hidden');
    }
    if(typeof PROGRESS!=='undefined') PROGRESS.track(id);
    if(typeof RELATED!=='undefined'&&RELATED[id]){const _v=document.getElementById(id);if(_v&&!_v.querySelector('.related-topics')){const _pc=_v.querySelector('.pc');if(_pc){const _d=document.createElement('div');_d.className='related-topics';_d.innerHTML='<div class="related-label">Verwandte Themen</div><div class="related-chips">'+RELATED[id].map(([rid,rl])=>'<button class="related-chip" onclick="NAV.go(\''+rid+'\',\''+rl+'\')">'+rl+'</button>').join('')+'</div>';_pc.appendChild(_d);}}}
    updateReadProgress();
    CHECKS.init(id);
    if(typeof TB!=='undefined') TB.init(id);
    if(typeof LP!=='undefined'){ LP.onShow(id); LP.init(id); }
    PAUSE_LOADER.onShow(id);
    A11Y.onShow();
    if(isContentPage){ ABKTIP.apply(id); if(typeof JGUI!=='undefined') JGUI.mount(id); }
    else if(typeof JGUI!=='undefined'&&/^v-(jahr1|jahr2|gal|sfs|hlfs|ibk|vak|feuak|idf|klausur)$/.test(id)) JGUI.mount(id);   // Übersichtsseiten: Reiter anpassen
    // Update URL for direct linking
    const url=new URL(location.href);
    if(id==='v-home') url.searchParams.delete('id'); else url.searchParams.set('id',id);
    history.replaceState(history.state,'',url.pathname+(url.search==='?'||url.search===''?'':url.search));
    // Recently visited
    if(typeof RECENT!=='undefined') RECENT.track(id);
  }

  return {
    go(id,label){ _dir='forward'; stack.push({id,label}); history.pushState({stack:[...stack]},''); show(id); },
    back(){ if(typeof LP!=='undefined'&&LP.isOpen()){ LP.back(); return; } if(typeof PAUSE!=='undefined'&&_activeEl&&_activeEl.id==='v-pause'&&PAUSE.back()) return; if(!stack.length) return; _dir='back'; stack.pop(); show(stack.length?stack[stack.length-1].id:'v-home'); },
    jumpTo(idx){ _dir=idx<stack.length-1?'back':'forward'; stack=stack.slice(0,idx+1); history.pushState({stack:[...stack]},''); show(idx>=0?stack[idx].id:'v-home'); },
    home(){ _dir='back'; stack=[]; history.pushState({home:true},''); show('v-home'); },
    tab(id,label){ _dir='forward'; stack=[{id,label}]; history.pushState({stack:[...stack]},''); show(id); },
    depth(){ return stack.length; },
    // Seite davor im Verlauf (z. B. die Themenübersicht, von der man kam)
    parent(){ return stack.length>1?stack[stack.length-2].id:null; },
    // Aktuelle Seite durch eine andere ersetzen (Kapitel-Blättern über Seitengrenzen), ohne neuen Verlaufseintrag
    replace(id,label){ _dir='forward'; if(stack.length) stack[stack.length-1]={id,label}; else stack=[{id,label}]; try{ history.replaceState(Object.assign({},history.state||{},{stack:[...stack]}),''); }catch(e){} show(id); },
    _restoreStack(s){ _dir='back'; stack=s; show(s.length?s[s.length-1].id:'v-home'); }
  };
})();

history.replaceState({home:true},'');
window.addEventListener('popstate',function(e){
  if(typeof LIGHTBOX!=='undefined'&&LIGHTBOX.isOpen()){ LIGHTBOX.close(true); e.stopImmediatePropagation(); return; }   // schließt nur die Bildansicht, danach darf kein anderes Fenster mehr auf dieses Ereignis reagieren
  if(typeof OVL!=='undefined'&&OVL.onPop(e,NAV.depth())) return;
  if(e.state&&e.state.stack){
    // Restore stack from state and show the top view
    const s=e.state.stack;
    NAV._restoreStack(s);
  } else {
    NAV._restoreStack([]);
  }
});

/* ======================================================================
   SIMULATOR ENGINE – 8 SZENARIEN
   ======================================================================
   STRUKTUR EINES KNOTENS:
     phase      {1-4}    – Phasenleiste
     title      {string} – Szenentitel
     scene      {string} – HTML-Situationsbeschreibung
     question   {string} – Entscheidungsfrage
     options    {Array}  – Auswahlmöglichkeiten:
       letter     : Beschriftung
       text       : Anzeigetext
       quality    : 'good'|'neutral'|'bad'|'restart'
       scoreDelta : Punktveränderung (±)
       feedback   : Konsequenzbeschreibung
       theory     : Theoretische Einordnung
       next       : ID des nächsten Knotens
     isEnd      {bool}   – Endknoten → Auswertungsscreen
     endScore   {string} – 'good'|'neutral'|'bad'

   UM EIN NEUES SZENARIO ZU ERGÄNZEN:
     1. Im SCENARIOS-Objekt einen neuen Key anlegen
     2. Startknoten definieren (wird automatisch als 'start' gesucht)
     3. Knoten via next verketten · isEnd+endScore für Abschluss setzen
====================================================================== */
/* SCENARIOS liegt in js/scenarios.js und wird beim Start einer Simulation geladen */

/* ======================================================================
   SIMULATOR CORE ENGINE
====================================================================== */
const SIM = {
  score: 100,
  nodeId: null,
  currentScenario: null,

  loadScenario(key){
    LAZY.script('js/scenarios.js').then(()=>this._loadScenario(key)).catch(()=>TOAST.show('Die Simulation konnte nicht geladen werden. Bitte Verbindung prüfen.',{type:'info'}));
  },
  _loadScenario(key){
    this.currentScenario = key;
    this.score = 100;
    this.nodeId = SCENARIOS[key].start;
    document.getElementById('sim-menu-wrap').classList.add('hidden');
    document.getElementById('sim-game-wrap').classList.remove('hidden');
    document.getElementById('sim-scenario-label').textContent = SCENARIOS[key].label;
    this.renderNode(this.nodeId);
    this.syncUI();
    // Szenario als eigener Schritt im Verlauf: Zurück (Kopfzeile, Wischen, Gerätetaste) führt zur Szenario-Übersicht
    if(!this._pushed){ this._pushed=true; NAV.go('v-simulator',SCENARIOS[key].label); }
  },

  // „← Szenarien“: über den Verlauf zurück, damit dieser stimmt
  exitToMenu(){
    if(this._pushed){ this._pushed=false; NAV.back(); } else this.backToMenu();
  },

  _simLoad(){ try{return JSON.parse(localStorage.getItem('bvi_sim')||'{}');}catch{return{};} },
  _simSave(d){ try{localStorage.setItem('bvi_sim',JSON.stringify(d));}catch{} },

  backToMenu(){
    document.getElementById('sim-game-wrap').classList.add('hidden');
    document.getElementById('sim-menu-wrap').classList.remove('hidden');
    document.getElementById('sim-stage').innerHTML = '';
    this.syncScore();
    this.syncPhase(0);
    this._refreshCards();
  },

  _refreshCards(){
    const data=this._simLoad();
    document.querySelectorAll('.sc-card[data-scenario]').forEach(card=>{
      const key=card.dataset.scenario;
      const d=data[key];
      let badge=card.querySelector('.sc-done-badge');
      if(d&&d.plays>0){
        if(!badge){badge=mk('div','sc-done-badge');card.appendChild(badge);}
        badge.textContent='✓ '+d.plays+'× · Beste: '+d.best+' Pkt';
      }
    });
  },

  restart(){
    if(!this.currentScenario) return;
    this.score = 100;
    this.nodeId = SCENARIOS[this.currentScenario].start;
    document.getElementById('sim-stage').innerHTML = '';
    this.renderNode(this.nodeId);
    this.syncUI();
  },

  renderNode(id){
    const nodes = SCENARIOS[this.currentScenario].nodes;
    const node = nodes[id];
    if(!node){ console.warn('[SIM] Unbekannter Knoten:', id); return; }
    this.nodeId = id;
    this.syncPhase(node.phase);
    const stage = document.getElementById('sim-stage');
    stage.innerHTML = '';
    if(node.isEnd){ this.renderEnd(node); return; }

    const hdr = mk('div','scene-hdr');
    hdr.innerHTML = `<span class="scene-title">${node.title}</span><span class="scene-ph">Phase ${node.phase}/4</span>`;

    const body = mk('div','scene-body');
    body.innerHTML = node.scene;

    const q = mk('div','scene-q');
    q.textContent = node.question;

    const opts = mk('div','opts-wrap');
    opts.id = 'sim-opts';
    (node.options||[]).forEach(opt => {
      const btn = mk('button',`opt-btn${opt.quality==='restart'?' restart':''}`);
      btn.innerHTML = `<span class="opt-ltr">${opt.letter}</span><span>${xss(opt.text)}</span>`;
      btn.addEventListener('click', () => this.pick(opt));
      opts.appendChild(btn);
    });

    stage.append(hdr, body, q, opts);
    stage.scrollIntoView({behavior:'smooth',block:'nearest'});
  },

  pick(opt){
    if(opt.quality === 'restart'){ this.restart(); return; }
    this.score = Math.max(0, Math.min(100, this.score + (opt.scoreDelta||0)));
    this.syncScore();
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);

    const optsEl = document.getElementById('sim-opts');
    if(optsEl){
      const icons = {good:'✅',neutral:'⚠️',bad:'❌'};
      const fb = mk('div',`fb-box ${opt.quality}`);
      fb.innerHTML = `<strong>${icons[opt.quality]||''} ${xss(opt.feedback)}</strong>${opt.theory?`<div class="fb-theory">📚 ${xss(opt.theory)}</div>`:''}`;
      optsEl.after(fb);
      const cont = mk('button','cont-btn');
      cont.textContent = 'Weiter →';
      cont.addEventListener('click', () => { if(opt.next) this.renderNode(opt.next); });
      fb.after(cont);
    }
  },

  renderEnd(node){
    const stage = document.getElementById('sim-stage');
    const icons = {good:'🏆',neutral:'🥈',bad:'🔴'};
    const score = node.endScore==='bad' ? Math.min(this.score,30) : this.score;
    const wrap = mk('div','sim-end');
    wrap.innerHTML = `
      <div class="sim-end-icon">${icons[node.endScore]||'🎯'}</div>
      <div class="sim-end-title">${node.title}</div>
      <div class="scene-body" style="text-align:left;max-width:500px;margin:0 auto 1.5rem">${node.scene}</div>
      <div class="score-big ${node.endScore}">${score}</div>
      <div class="score-big-sub">Führungspunkte / 100</div>`;
    (node.options||[]).forEach(opt => {
      const btn = mk('button','btn btn-red');
      btn.textContent = opt.text;
      btn.style.marginTop = '.5rem';
      btn.addEventListener('click',() => this.restart());
      wrap.appendChild(btn);
    });
    const menuBtn = mk('button','btn sim-back-btn');
    menuBtn.textContent = '← Zur Übersicht';
    menuBtn.addEventListener('click',() => this.exitToMenu());
    wrap.appendChild(menuBtn);
    stage.innerHTML = '';
    stage.appendChild(wrap);
    // Track completion
    const data=this._simLoad();
    const key=this.currentScenario;
    if(!data[key])data[key]={plays:0,best:0};
    data[key].plays++;data[key].best=Math.max(data[key].best,score);
    this._simSave(data);
  },

  syncScore(){
    const f=document.getElementById('score-fill');
    const v=document.getElementById('score-val');
    if(f) f.style.width = this.score+'%';
    if(v) v.textContent = this.score;
  },
  syncPhase(cur){
    for(let i=1;i<=4;i++){
      const el=document.getElementById(`ps-${i}`);
      if(!el) continue;
      el.classList.remove('active','done');
      if(i<cur) el.classList.add('done');
      if(i===cur) el.classList.add('active');
    }
  },
  syncUI(){ this.syncScore(); }
};

/* ======================================================================
   HILFSFUNKTIONEN
====================================================================== */
function mk(tag,cls){ const e=document.createElement(tag); e.className=cls; return e; }
function xss(s){ if(!s) return ''; const d=document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

/* ======================================================================
   FLASHCARD-DATEN
====================================================================== */
const FLASHCARD_DATA = [
  {"id":"k-lb26-01","cat":"Laufbahn · Recht","q":"Stromausfall, Kälte: Welche Voraussetzung gilt für Katastrophenschutzmaßnahmen, und wer stellt sie fest?","a":"Eine <strong>Katastrophe oder Großschadenslage</strong> (§ 1 KatSG): Gefahr für Leben/Gesundheit vieler Menschen, lebensnotwendige Versorgung. Die für Inneres zuständige Senatsverwaltung löst Katastrophenalarm aus bzw. stellt die Großschadenslage fest (§ 10 Abs. 1, 2 KatSG)."},
  {"id":"k-lb26-02","cat":"Laufbahn · Recht","q":"Welche Rechtsgrundlagen hat die Amtshilfe?","a":"<strong>Art. 35 Abs. 1 GG</strong> (Rechts- und Amtshilfepflicht aller Behörden von Bund und Ländern) und <strong>§§ 4–8 VwVfG</strong> (in Berlin über das VwVfG Bln)."},
  {"id":"k-lb26-03","cat":"Laufbahn · Recht","q":"Wann liegt Amtshilfe vor (§ 4 Abs. 1 VwVfG)?","a":"<strong>Ergänzende Hilfe auf Ersuchen</strong> einer anderen Behörde. Nötig: Ersuchen, Bedarf an ergänzender Hilfe im Einzelfall, selbstständige Behörden ohne Weisungsverhältnis."},
  {"id":"k-lb26-04","cat":"Laufbahn · Recht","q":"Wann liegt keine Amtshilfe vor (§ 4 Abs. 2 VwVfG)?","a":"Bei Hilfe im Rahmen eines <strong>Weisungs-/Unterstellungsverhältnisses</strong> und bei Handlungen, die der ersuchten Stelle als <strong>eigene Aufgabe</strong> obliegen."},
  {"id":"k-lb26-05","cat":"Laufbahn · Recht","q":"Welche Grenzen der Amtshilfe nennt § 5 VwVfG?","a":"Rechtliche oder tatsächliche <strong>Unmöglichkeit</strong>, unverhältnismäßiger Aufwand, schwerer Nachteil für Bund/Land. Verweigerung der ersuchenden Behörde mitteilen; Streit entscheidet die gemeinsame Aufsichtsbehörde."},
  {"id":"k-lb26-06","cat":"Laufbahn · Recht","q":"Wer trägt bei der Amtshilfe Verantwortung und Kosten (§§ 7, 8 VwVfG)?","a":"Ersuchende Behörde: <strong>Rechtmäßigkeit</strong> der Maßnahme. Ersuchte Behörde: <strong>Durchführung</strong> der Hilfe. Kosten (§ 8): keine Gebühren, Auslagenerstattung ab 35 €."},
  {"id":"k-lb26-07","cat":"Laufbahn · Recht","q":"Wie wird das THW im Katastrophenfall rechtlich eingebunden?","a":"THW ist Bundesanstalt. Es wirkt über <strong>§ 25 Abs. 2 KatSG</strong> im Katastrophenschutz mit (spezialgesetzliche Mitwirkung, Unterstützung nach § 1 Abs. 2 THWG, Nummer bitte prüfen). Nur ergänzend (Stromerzeuger, Beleuchtung, Logistik) greift Art. 35 GG / Amtshilfe."},
  {"id":"k-lb26-08","cat":"Laufbahn · Recht","q":"Wie wird ein städtischer Bauhof je nach Rechtsträger herangezogen?","a":"<strong>Bezirksamt/Landesbehörde:</strong> keine Amtshilfe, gesetzliche Unterstützungspflicht (§ 23 KatSG) und Weisungsrecht. <strong>Landesunternehmen:</strong> Mitwirkung § 24 KatSG. <strong>Privater Betreiber:</strong> Inanspruchnahme § 17 KatSG. <strong>Anderes Land/Gemeinde:</strong> Amtshilfe bzw. § 25 Abs. 1 KatSG."},
  {"id":"k-lb26-09","cat":"Laufbahn · Recht","q":"Begründet Amtshilfe ein Unterstellungsverhältnis?","a":"<strong>Nein.</strong> Die ersuchte Behörde bleibt Herrin ihrer Mittel und Kräfte und führt die Hilfe nach ihrem Recht durch (§ 7 VwVfG). Es gibt Auftrag und Auftragserfüllung (Auftragstaktik), keine Weisung in die Organisation."},
  {"id":"k-lb26-10","cat":"Laufbahn · Recht","q":"Wem unterstehen Kräfte des Bundes (THW) und anderer Länder im Berliner Katastrophenschutz?","a":"Sie haben die gleichen Befugnisse wie Berliner Kräfte und unterstehen den Weisungen der einsetzenden Behörde (§ 25 Abs. 1 S. 2, 3 KatSG). Die Fachführung der THW-Einheit bleibt beim THW (Zuordnung statt Unterstellung, FwDV 100)."},
  {"id":"k-lb26-11","cat":"Laufbahn · Recht","q":"Wem unterstehen anerkannte Hilfsorganisationen und Landesbehörden im Katastrophenfall?","a":"Hilfsorganisationen der <strong>Berliner Feuerwehr</strong> (§ 21 Abs. 2 KatSG). Landesbehörden dem Weisungsrecht der Fachaufsicht bzw. dem Krisenstab/Entscheidungsgremium (§§ 12–14 KatSG). Taktisch-operative Entscheidungen werden abgestimmt (§ 13 KatSG)."},
  {"id":"k-lb26-12","cat":"Laufbahn · Recht","q":"Wie lautet das Ergebnis zu Amtshilfe und Unterstellung beim Stromausfall?","a":"Amtshilfe nur, wo <strong>keine gesetzliche Mitwirkungs- oder Weisungsbeziehung</strong> besteht. THW und Landesbehörden sind über das KatSG eingebunden; Weisungsrecht nur im Rahmen von § 25 KatSG bzw. innerhalb der Landesverwaltung."},
  {"id":"k-lb26-13","cat":"Laufbahn · Recht","q":"Beamter nimmt dienstliche Batterien privat mit: Diebstahl oder Unterschlagung?","a":"Fremde bewegliche Sache. <strong>Diebstahl § 242 StGB</strong> bei Gewahrsamsbruch; ohne Gewahrsamsbruch (Obhut) <strong>Unterschlagung § 246 Abs. 1</strong>, bei anvertrauten Sachen <strong>§ 246 Abs. 2</strong> (höherer Strafrahmen). § 246 ist subsidiär."},
  {"id":"k-lb26-14","cat":"Laufbahn · Recht","q":"Wann liegt bei den Batterien eine Zueignung vor?","a":"Aneignung plus Enteignungsvorsatz; bei dauerhaftem Behalten erfüllt. Nur vorübergehende Nutzung ist straflose Gebrauchsanmaßung, aber der in der Ladung verkörperte <strong>Sachwert</strong> wird verbraucht (Sachwerttheorie)."},
  {"id":"k-lb26-15","cat":"Laufbahn · Recht","q":"Greift bei den Batterien der Notstand (§ 34 StGB)?","a":"<strong>Nein.</strong> Eigeninteresse, Güterabwägung spricht für die dienstliche Gefahrenabwehr, milderes Mittel wäre Melden/Abstimmen. § 35 StGB nur bei Gefahr für Leib, Leben, Freiheit. Bei geringem Wert nur auf Strafantrag (§ 248a StGB)."},
  {"id":"k-lb26-16","cat":"Laufbahn · Recht","q":"Dienstrechtliche Bewertung der Batteriemitnahme: Welche Pflichten sind verletzt?","a":"<strong>Dienstvergehen § 47 Abs. 1 BeamtStG</strong> (schuldhafte Pflichtverletzung). Verletzt: uneigennützige Amtsführung (§ 33 Abs. 1), voller persönlicher Einsatz (§ 34 S. 1), achtungs- und vertrauenswürdiges Verhalten (§ 34 S. 3), Regeln zur Nutzung von Dienstgut."},
  {"id":"k-lb26-17","cat":"Laufbahn · Recht","q":"Wann verliert ein Beamter kraft Gesetzes die Beamtenrechte (§ 24 Abs. 1 BeamtStG)?","a":"Bei Verurteilung wegen einer <strong>Vorsatztat zu mindestens einem Jahr Freiheitsstrafe</strong>. Bei Ersttäter und geringem Wert unwahrscheinlich (§ 246 Abs. 2 StGB bis 5 Jahre)."},
  {"id":"k-lb26-18","cat":"Laufbahn · Recht","q":"Welche Disziplinarmaßnahmen kennt das DiszG Bln (§ 5)?","a":"<strong>Verweis</strong> (§ 6), <strong>Geldbuße</strong> (§ 7), <strong>Kürzung der Dienstbezüge</strong> (§ 8), <strong>Zurückstufung</strong> (§ 9), <strong>Entfernung aus dem Beamtenverhältnis</strong> (§ 10)."},
  {"id":"k-lb26-19","cat":"Laufbahn · Recht","q":"Wie läuft das Disziplinarverfahren nach DiszG Bln ab?","a":"Einleitung von Amts wegen bei zureichenden Anhaltspunkten (§ 17), Anhörung (§ 20), Aussetzung während des Strafverfahrens (§ 22), Bindung an dessen tatsächliche Feststellungen (§ 23)."},
  {"id":"k-lb26-20","cat":"Laufbahn · Recht","q":"Wie wird die Disziplinarmaßnahme bei einem Zugriffsdelikt bemessen?","a":"Nach § 13 Abs. 1: Schwere, Persönlichkeitsbild, Vertrauensbeeinträchtigung, <strong>Verhältnismäßigkeit</strong>. Bei nicht geringwertigen Gegenständen ist Entfernung Regelmaßnahme; bei geringem Wert (Orientierung ca. 50 €, prüfen) und Milderungsgründen Kürzung, Zurückstufung oder Geldbuße."},
  {"id":"k-lb26-21","cat":"Laufbahn · Recht","q":"Wer verhängt welche Disziplinarmaßnahme (DiszG Bln)?","a":"Verweis, Geldbuße, Kürzung per <strong>Disziplinarverfügung</strong> (§ 33). Entfernung nur durch <strong>Disziplinarklage</strong> vor dem Verwaltungsgericht (§§ 34, 41). Vorläufige Dienstenthebung und Bezügeeinbehalt nach § 38."},
  {"id":"k-lb26-22","cat":"Laufbahn · Recht","q":"Was besagt das Doppelahndungsverbot (§ 14 DiszG Bln)?","a":"Nach unanfechtbarer Strafe <strong>kein Verweis, keine Geldbuße</strong> mehr; Kürzung oder Zurückstufung nur, wenn zusätzlich erforderlich."},
  {"id":"k-lb26-23","cat":"Laufbahn · Recht","q":"Nach welcher Zeit sind Disziplinarmaßnahmen nicht mehr zulässig (§ 15 DiszG Bln)?","a":"Verweis nach <strong>2</strong>, Geldbuße und Kürzung nach <strong>3</strong>, Zurückstufung nach <strong>7 Jahren</strong>."},
  {"id":"k-lb26-24","cat":"Laufbahn · Recht","q":"Welche Folgen gelten für Beamte auf Probe/Widerruf und welche weiteren Folgen drohen?","a":"Statt Disziplinarklage: <strong>Entlassung</strong> (§ 23 BeamtStG). Außerdem Schadensersatz/Regress bei Vorsatz oder grober Fahrlässigkeit (§ 48 BeamtStG), Rückgabe, Beurteilung/Beförderung, Anzeigepflicht der Dienststelle."},
  {"id":"k-lb26-25","cat":"Laufbahn · Recht","q":"Kiosk verweigert vertraglich vorgesehenes Notstromaggregat: Darf er gewaltsam geöffnet werden?","a":"<strong>Ja, als letztes Mittel</strong> bei Katastrophe/Großschadenslage: Inanspruchnahme nach § 17 KatSG, Betreten nach § 36 ASOG (Art. 13 GG), verhältnismäßig, mit Ausgleich nach §§ 59–65 ASOG. Zuvor milderes Vorgehen (Aufforderung, Androhung, Verhandlung)."},
  {"id":"k-lb26-26","cat":"Laufbahn · Recht","q":"Warum nicht zivilrechtlich gegen den Kioskbesitzer vorgehen?","a":"Der Vertrag gibt einen Erfüllungsanspruch, die Weigerung ist Vertragsverletzung. Die einstweilige Verfügung ist im akuten Notfall <strong>zu langsam</strong> und ersetzt keine Gefahrenabwehr. Daher öffentlich-rechtlich vorgehen."},
  {"id":"k-lb26-27","cat":"Laufbahn · Recht","q":"Voraussetzungen der Inanspruchnahme Nichtverantwortlicher nach § 17 Abs. 1 KatSG i. V. m. § 16 ASOG?","a":"① gegenwärtige erhebliche Gefahr, ② Maßnahmen gegen Verantwortliche nicht/nicht rechtzeitig möglich, ③ Behörde kann nicht selbst rechtzeitig abwehren, ④ keine erhebliche eigene Gefährdung, keine höherwertigen Pflichten. Nur solange nötig."},
  {"id":"k-lb26-28","cat":"Laufbahn · Recht","q":"Was regelt § 17 Abs. 2 KatSG, und was gilt daneben?","a":"<strong>Duldung</strong> von Nutzung und Verbrauch des Eigentums und Besitzes. Daneben Sicherstellung der Sache nach § 38 Abs. 1 Nr. 1 ASOG (Abwehr einer gegenwärtigen Gefahr)."},
  {"id":"k-lb26-29","cat":"Laufbahn · Recht","q":"In welcher Form ergeht die Inanspruchnahme, und welche Folgen hat ein Widerspruch (§ 17 KatSG)?","a":"<strong>Verwaltungsakt</strong> (ggf. mündlich, § 37 VwVfG). Widerspruch/Anfechtungsklage <strong>ohne aufschiebende Wirkung</strong> (§ 17 Abs. 4). Zuwiderhandlung: Ordnungswidrigkeit bis 5.000 € (§ 34 KatSG)."},
  {"id":"k-lb26-30","cat":"Laufbahn · Recht","q":"Welche Zwangsmöglichkeit besteht, wenn der Zweck anders nicht rechtzeitig erreichbar ist?","a":"<strong>Unmittelbare Ausführung</strong> (§ 15 ASOG Bln) bzw. sofortiger Vollzug nach Verwaltungsvollstreckungsrecht."},
  {"id":"k-lb26-31","cat":"Laufbahn · Recht","q":"Darf die Behörde die Kioskräume betreten? Braucht sie einen Richter?","a":"Geschäftsräume sind <strong>Wohnung</strong> (Art. 13 GG, § 36 Abs. 1 S. 2 ASOG). Betreten zulässig bei gegenwärtiger Gefahr für Leib/Leben oder Sachen von bedeutendem Wert (§ 36 Abs. 1 Nr. 3 ASOG; Art. 13 Abs. 7 GG; § 33 KatSG Zitiergebot). Richtervorbehalt nur für die <strong>Durchsuchung</strong> (Art. 13 Abs. 2)."},
  {"id":"k-lb26-32","cat":"Laufbahn · Recht","q":"Wie prüfen Sie die Verhältnismäßigkeit beim gewaltsamen Öffnen (§ 11 ASOG)?","a":"Geeignet, <strong>erforderlich</strong> (vorher Ansprache, Frist, Androhung, Alternativen wie anderes Aggregat von THW/Hilfsorganisationen), angemessen (Leben gegen Türschaden). Minimal beschädigen, dokumentieren, Kiosk sichern, Zeugen/Polizei."},
  {"id":"k-lb26-33","cat":"Laufbahn · Recht","q":"Welchen Ausgleich erhält der Inanspruchgenommene?","a":"Angemessener Ausgleich nach <strong>§§ 59–65 ASOG</strong> (§ 17 Abs. 3 KatSG), in Geld, nur Vermögensschaden (§ 60): Tür, Nutzungsentgelt, Verbrauch. Ausgleichspflichtig: Land Berlin (§ 63, prüfen); Rückgriff gegen Verantwortliche (§ 64 ASOG, § 31 KatSG)."},
  {"id":"k-lb26-34","cat":"Laufbahn · Recht","q":"Aggregate-Firma hat Geräte im Lager: Dürfen Sie diese nutzen?","a":"Zuerst <strong>freiwillig</strong> (Kauf, Miete, Überlassung; bei äußerster Dringlichkeit Beschaffung ohne förmliches Verfahren, z. B. § 14 Abs. 4 Nr. 3 VgV, prüfen). Sonst Duldung nach § 17 KatSG i. V. m. § 16 ASOG als Nichtverantwortliche."},
  {"id":"k-lb26-35","cat":"Laufbahn · Recht","q":"Wer entscheidet in Eilfällen über die Inanspruchnahme, und wie begrenzt die Verhältnismäßigkeit sie?","a":"Katastrophenschutzbehörde bzw. in Eilfällen das <strong>Senatsmitglied für Inneres</strong> (§ 14 Abs. 3 Nr. 2 KatSG, befristet). Nur benötigte Aggregate, die Existenz der Firma darf nicht gefährdet werden; Lagerbetreten wie beim Kiosk (§ 36 ASOG)."},
  {"id":"k-lb26-36","cat":"Laufbahn · Recht","q":"Warum bleibt bei einer Aggregate-Firma nur der Duldungsweg?","a":"Kritische Infrastrukturen müssen mit den Katastrophenschutzbehörden zusammenarbeiten (§ 28 KatSG), Aggregatehersteller und -vermieter sind aber meist <strong>keine KRITIS</strong>."},
  {"id":"k-lb26-37","cat":"Laufbahn · Recht","q":"Kostenersatz: Was erhält die Firma vom Land?","a":"Ausgleich nach §§ 59–65 ASOG (§ 17 Abs. 3 KatSG): Verlust/Beschädigung, Treibstoff, <strong>Nutzungsentgelt/Mietwert</strong>, entgangener gewöhnlicher Verdienst (Vermögensschaden § 60, in Geld). Bei Vertrag die vereinbarte Vergütung."},
  {"id":"k-lb26-38","cat":"Laufbahn · Recht","q":"Kostenersatz: Von wem kann das Land Kosten zurückfordern?","a":"Vom <strong>Verursacher</strong>, der die Katastrophe vorsätzlich oder grob fahrlässig herbeiführte, sowie bei Gefährdungshaftung (§ 31 Abs. 1 KatSG); bei höherer Gewalt ausgeschlossen (§ 31 Abs. 2). Rückgriff auch § 64 ASOG."},
  {"id":"k-lb26-39","cat":"Laufbahn · Recht","q":"Wer trägt welche Kosten im Katastrophenschutz, und was bleibt unberührt?","a":"Kosten der Maßnahmen trägt der Rechtsträger der Katastrophenschutzbehörde (<strong>Land Berlin</strong>); Hilfsorganisationen tragen ihre Mitwirkungskosten selbst (§ 29 Abs. 1 KatSG). Amtspflichtverletzung bleibt unberührt (§ 59 Abs. 4 ASOG)."},
  {"id":"k-lb26-40","cat":"Laufbahn · Management","q":"Welche Grundlage hat die Katastrophenschutzbedarfsplanung, und warum ist sie qualitativ?","a":"Methodik Lülf+ (angelehnt an den BBK-Leitfaden Risikoanalyse) in <strong>5 Phasen</strong>; <strong>qualitativ und szenarienbasiert</strong>, weil keine statistisch belastbare Grundgesamtheit besteht. Teil der Katastrophenvorsorge."},
  {"id":"k-lb26-41","cat":"Laufbahn · Management","q":"Wie ordnet sich der NTW in die KatS-Bedarfsplanung ein?","a":"NTW ist ein Rettungsdienstmittel (Alltag, quantitative Methodik), wird im Katastrophenschutz aber als Fähigkeit mitgedacht (<strong>Dual-Use</strong>)."},
  {"id":"k-lb26-42","cat":"Laufbahn · Management","q":"Welche fünf Phasen hat das Phasenmodell der KatS-Bedarfsplanung?","a":"① <strong>Brainstorming</strong> → ② <strong>Szenarienauswahl</strong> → ③ <strong>Szenarienfolgenbetrachtung</strong> → ④ <strong>Ableitung der Planungsziele</strong> → ⑤ <strong>Maßnahmenableitung</strong>."},
  {"id":"k-lb26-43","cat":"Laufbahn · Management","q":"Phase 1 Brainstorming: Was geschieht am Beispiel NTW?","a":"Alle denkbaren Szenarien mit zusätzlichem Transportbedarf sammeln: Blackout (Pflegeheime, Dialyse, Beatmung), MANV, Pandemie, Evakuierung, Hochwasser. Einteilung: <strong>anthropogen, Natur, konfliktbedingt</strong>."},
  {"id":"k-lb26-44","cat":"Laufbahn · Management","q":"Phase 2 Szenarienauswahl: Wie wird reduziert?","a":"Auf ca. <strong>5 Szenarien</strong> per Risikomatrix (Eintrittswahrscheinlichkeit × Schadensausmaß), Delphi oder Auswahl durch die untere KatS-Behörde. Velocity of Risk (Vorwarnzeit): lange Vorwarnzeit erlaubt Wechselladerkonzepte/Dual-Use."},
  {"id":"k-lb26-45","cat":"Laufbahn · Management","q":"Phase 3 Folgenbetrachtung: Was wird untersucht?","a":"Betroffenheit und Leistungsfähigkeit je Szenario für die Schutzgüter Leben, Gesundheit, Umwelt, Wirtschaft (Workshops, Beteiligungsmatrix). Ergebnis: <strong>Fähigkeitsbedarfe</strong>, z. B. Transport liegender nicht-kritischer Patienten, Verlegung, Entlastung der RTW."},
  {"id":"k-lb26-46","cat":"Laufbahn · Management","q":"Phase 4 Planungsziele: Was geschieht?","a":"Aggregation der Fähigkeitsbedarfe zu Planungszielen (Anzahl NTW, Eintreffzeit, Besetzung, Durchhalte-/Schichtfähigkeit). Der NTW ist Baustein für das Ziel „RTW bleiben für Notfälle verfügbar“."},
  {"id":"k-lb26-47","cat":"Laufbahn · Management","q":"Phase 5 Maßnahmenableitung: Was geschieht?","a":"<strong>SOLL-IST-Vergleich</strong> je Planungsziel, bei Differenz priorisierte Maßnahmenliste: Beschaffung/Vergabe, Personal (Stellenplan), Standorte, Haushaltsmittel, Dienstplan; überörtliche Konzepte (Nachbarn, Hilfsorganisationen, THW) einbeziehen."},
  {"id":"k-lb26-48","cat":"Laufbahn · Management","q":"Wie unterscheiden sich Ersterstellung und Fortschreibung der KatS-Bedarfsplanung?","a":"Ersterstellung: <strong>breiter Betrachtungshorizont, geringe Detailtiefe</strong>. Fortschreibung vertieft einzelne Planungsziele (hier NTW). Risiken werden objektiviert, Bedarfe priorisiert, Beschaffung legitimiert."},
  {"id":"k-lb26-49","cat":"Laufbahn · Management","q":"Wodurch werden Planungsziele bestimmt?","a":"Sie werden aus <strong>Bemessungsszenarien</strong> abgeleitet und von vier Einflussgrößen bestimmt: gesetzliche/aufsichtsbehördliche Vorgaben, wissenschaftliche Erkenntnisse, ethische Aspekte, normative Kraft des Faktischen."},
  {"id":"k-lb26-50","cat":"Laufbahn · Management","q":"NTW-Planungsziele: Entlastungsziel und Zeitziel?","a":"<strong>Entlastung:</strong> RTW frei für Notfälle; Anteil nicht-dringlicher Einsätze (N, S, K) beim NTW; Blockierungswahrscheinlichkeit RTW P(B) &lt; 1–5 %. <strong>Zeit:</strong> Eintreffzeit und Erreichungsgrad, großzügiger als RTW-Hilfsfrist, politisch festzulegen."},
  {"id":"k-lb26-51","cat":"Laufbahn · Management","q":"NTW-Planungsziele: Struktur-/Qualitätsziel und Wirtschaftlichkeitsziel?","a":"<strong>Struktur/Qualität:</strong> Anzahl, Standorte, Ausstattung (Typ B angelehnt), Rettungssanitäter mit Zusatzqualifikation, sichere Disposition. <strong>Wirtschaftlichkeit:</strong> SGB V § 12, Kostendeckung über Entgelte, geringere Kosten je Einsatz als RTW."},
  {"id":"k-lb26-52","cat":"Laufbahn · Management","q":"NTW-Planungsziele: Personal-, Katastrophenschutz- und Standortziel?","a":"<strong>Personal:</strong> Personalfaktor, Besetzbarkeit, Arbeitszeitrecht. <strong>KatS:</strong> Einsatzfähigkeit bei MANV, Durchhalte-/Schichtfähigkeit, Reserve, Hilfsorganisationen. <strong>Standort:</strong> gleichmäßige Abdeckung (GIS-Isochronen); Zielkonflikt Flächenoptimierung vs. Eintreffzeit."},
  {"id":"k-lb26-53","cat":"Laufbahn · Management","q":"Was sind Kennzahlen, und welche Arten gibt es?","a":"Grundlage für Planung, Controlling und Argumentation gegenüber Politik und Kostenträgern. <strong>Absolutkennzahlen</strong> (Anzahl Einsätze) und <strong>Verhältniskennzahlen</strong> (Kosten je Einsatz, Quoten), letztere für Vergleiche aussagekräftiger."},
  {"id":"k-lb26-54","cat":"Laufbahn · Management","q":"Wie sollten Daten für Kennzahlen aufbereitet werden?","a":"Vorab <strong>Datenbereinigung</strong> der Einsatzdaten; <strong>Zeitreihen</strong> sind das beste Argument in Ressourcenverteilungskämpfen."},
  {"id":"k-lb26-55","cat":"Laufbahn · Management","q":"NTW-Kennzahlen zu Einsatzzahlen, Verteilung und Bindungszeit?","a":"<strong>Einsatzzahlen</strong> nach Bemessungskategorie (N, S, K, Fehleinsätze): Potenzial für den NTW. <strong>Zeitliche/räumliche Verteilung</strong>: Schichtlage, Standorte. <strong>Bindungszeit</strong>: Eingangsgröße der Vorhaltebemessung (A = Häufigkeit × Bindungszeit)."},
  {"id":"k-lb26-56","cat":"Laufbahn · Management","q":"NTW-Kennzahlen zu Auslastung, Eintreffzeit und RTW-Entlastung?","a":"<strong>Auslastung</strong> (Einsatz-/Vorhaltestunden, Grenze ca. 75 %). <strong>Eintreffzeit/Erreichungsgrad</strong> gegenüber dem Planungsziel. <strong>RTW-Entlastung:</strong> RTW-Einsatzzahl, Blockierungsquote, Verfügbarkeit, Hilfsfristerreichung."},
  {"id":"k-lb26-57","cat":"Laufbahn · Management","q":"NTW-Kennzahlen zu Fehlalarmierung, Kosten, Personal und Katastrophenschutz?","a":"<strong>Nach-/Fehlalarmierungsquote</strong> (Qualität der Disposition). <strong>Kosten</strong> je Einsatz/Stunde, Kostendeckungsgrad (SGB V § 12). <strong>Personal:</strong> Personalfaktor, Krankenquote, Überstunden, Fluktuation. <strong>KatS:</strong> Verfügbarkeitsquote, Reaktionszeit der Zusatzvorhaltung."},
  {"id":"k-lb26-58","cat":"Laufbahn · Management","q":"Welche Rahmenbedingungen gelten für Schichtmodelle (EU-Arbeitszeitrichtlinie 2003/88/EG)?","a":"Max. <strong>48 h/Woche</strong> im 12-Monats-Schnitt, tägliche Ruhezeit mind. <strong>11 h</strong>, wöchentlich mind. 24 h, Ruhepause nach 6 h; Abweichung nur mit Opt-out/Personalrat. Die Vorhaltezeit folgt dem Tagesgang (NTW oft nur in der Einsatzspitze)."},
  {"id":"k-lb26-59","cat":"Laufbahn · Management","q":"24-Stunden-Dienst im NTW: Vor- und Nachteile?","a":"<strong>+</strong> beliebt, nur ca. 2 Anwesenheitstage, attraktiv für Personalgewinnung. <strong>−</strong> 11 h Ruhezeit schwer einzuhalten, Unfallrisiko, Nebentätigkeiten problematisch, Fortbildung erschwert; für NTW mit hoher Nachtbelastung ungeeignet."},
  {"id":"k-lb26-60","cat":"Laufbahn · Management","q":"12-Stunden-Schichten und Tagesdienst: Vor- und Nachteile?","a":"<strong>12 h:</strong> + RD-tauglich, Ruhezeit gesichert, Anpassung an Einsatzspitze; − mehr Anwesenheitstage und Wechsel. <strong>Tagesdienst (8–10 h):</strong> + passt zum NTW-Spektrum, planbar, familienfreundlich; − nachts keine Vorhaltung, höherer Personalbedarf."},
  {"id":"k-lb26-61","cat":"Laufbahn · Management","q":"Wachabteilungen und flexible Modelle: Vor- und Nachteile?","a":"<strong>Wachabteilungen (2/3/4 WA, z. B. Bremer Modell):</strong> + planbar, viele freie Tage, Ausfallkompensation; − starr, individuelle Planung kaum möglich. <strong>Flexibel (Springerpool, Jahresarbeitszeitkonten):</strong> + fängt Spitzen ab; − hoher Planungsaufwand."},
  {"id":"k-lb26-62","cat":"Laufbahn · Management","q":"Was empfiehlt die Musterlösung bei der Wahl des Schichtmodells?","a":"Passend zum Vorhaltezeitraum (Tag-/Doppelschichten in der Einsatzspitze), <strong>Personalfaktor</strong> berechnen (Ausfallzeiten erhöhen ihn), Wechsel behutsam einführen, Personalrat beteiligen."},
  {"id":"k-lb26-63","cat":"Laufbahn · Management","q":"Wie lauten die Vergabegrundsätze nach § 97 GWB?","a":"<strong>Wettbewerb, Transparenz</strong> (§ 7 VgV), <strong>Gleichbehandlung</strong> (§ 97 Abs. 2), <strong>Wirtschaftlichkeit</strong> (§ 127 GWB), <strong>Verhältnismäßigkeit</strong>."},
  {"id":"k-lb26-64","cat":"Laufbahn · Management","q":"Welche weiteren Grundsätze nennt die Musterlösung zur Vergabe?","a":"<strong>Mittelstandsfreundlichkeit</strong> (Teil-/Fachlose, § 97 Abs. 4), strategische Ziele (Nachhaltigkeit, Innovation, Soziales), E-Vergabe, <strong>Rechtsschutz</strong> (Rüge, Vergabekammer, § 160 GWB)."},
  {"id":"k-lb26-65","cat":"Laufbahn · Management","q":"Offenes Verfahren, Schritte 1–3?","a":"① Bedarf, Anforderungsprofil, Markterkundung (§ 28 VgV), Auftragswertschätzung, <strong>Mittelsicherung</strong>. ② Verfahrensart wählen (offen, nicht offen, Verhandlung, Dialog, Innovationspartnerschaft; § 119 GWB). ③ Vergabeunterlagen (§ 29 VgV), Losbildung."},
  {"id":"k-lb26-66","cat":"Laufbahn · Management","q":"Offenes Verfahren, Schritte 4–6?","a":"④ Auftragsbekanntmachung (TED und national), e-Vergabe-Plattform, Bieterfragen an alle. ⑤ Angebotsfrist mind. <strong>35 Tage</strong> (§ 15 VgV). ⑥ Öffnung und vierstufige Wertung."},
  {"id":"k-lb26-67","cat":"Laufbahn · Management","q":"Offenes Verfahren, Schritte 7–9?","a":"⑦ Bieterinformation (§ 134 GWB) mit <strong>15-Tage-Wartefrist</strong>. ⑧ Zuschlag und Vertragsschluss (§ 127 GWB, § 58 VgV). ⑨ Auftragsklärung, Abnahme, Vertragsstrafe, Gewährleistung, Vergabevermerk."},
  {"id":"k-lb26-68","cat":"Laufbahn · Management","q":"Wie erfolgt die vierstufige Wertung der Angebote?","a":"Formale Prüfung → <strong>Eignung</strong> → angemessener Preis → <strong>wirtschaftlichstes Angebot</strong>."},
  {"id":"k-lb26-69","cat":"Laufbahn · Management","q":"Wann dürfen Vergabeunterlagen veröffentlicht werden, und welches Recht gilt wo?","a":"Erst, wenn die <strong>Haushaltsmittel sicher</strong> sind. Oberhalb der Schwellenwerte GWB/VgV, darunter Unterschwellenvergabeordnung bzw. Landesrecht (prüfen)."},
  {"id":"k-lb26-70","cat":"Laufbahn · Management","q":"Was ist das Neue Steuerungsmodell (NSM)?","a":"Deutsche Umsetzung des <strong>New Public Management</strong> (KGSt, Anfang der 1990er; Einordnung prüfen): Steuerung über <strong>Ergebnisse</strong> (Output/Wirkung) statt über Mitteleinsatz (Input), Verwaltung als Dienstleister."},
  {"id":"k-lb26-71","cat":"Laufbahn · Management","q":"Welche Ziele hat das NSM?","a":"① Kernziel: <strong>Ausgaben senken ohne Leistungsminderung</strong>. ② Ergebnis, Qualität, Bürgernähe. ③ Mitarbeitermotivation und Eigenverantwortung. ④ Politik legt Ziele fest, Verwaltung entscheidet über das Wie."},
  {"id":"k-lb26-72","cat":"Laufbahn · Management","q":"Nennen Sie die acht Elemente des NSM.","a":"<strong>Doppik</strong>, <strong>Produktorientierung</strong>, <strong>Budgetierung</strong>, <strong>dezentrale Ressourcenverantwortung</strong>, <strong>KLR</strong>, <strong>Controlling/Berichtswesen</strong>, <strong>Prozessanalyse</strong>, <strong>Qualitätsmanagement</strong>. Dazu Kontraktmanagement (Zielvereinbarungen)."},
  {"id":"k-lb26-73","cat":"Laufbahn · Management","q":"Erklären Sie Doppik, Produktorientierung und Budgetierung im NSM.","a":"<strong>Doppik:</strong> kaufmännische Buchführung, Ressourcenverbrauch statt Geldverbrauch. <strong>Produkte:</strong> mit Zielen, Mengen, Kosten (Produktpyramide). <strong>Budgetierung:</strong> Deckungsfähigkeit, Übertragbarkeit."},
  {"id":"k-lb26-74","cat":"Laufbahn · Management","q":"Erklären Sie dezentrale Verantwortung, KLR und Controlling im NSM.","a":"<strong>Dezentral:</strong> Fachbereiche bewirtschaften eigenes Budget. <strong>KLR:</strong> Kostenarten, -stellen, -träger, Basis der Gebührenkalkulation. <strong>Controlling:</strong> intern operativ, extern politisch; planen, kontrollieren, nachsteuern."},
  {"id":"k-lb26-75","cat":"Laufbahn · Management","q":"Welche drei Säulen hat der doppische Haushalt, und wie grenzt er sich von der Kameralistik ab?","a":"<strong>Finanzhaushalt</strong> (Liquidität), <strong>Ergebnishaushalt</strong> (Aufwand/Ertrag, Ausgleich am Jahresende), <strong>Vermögenshaushalt/Bilanz</strong>. Kameralistik: Kassenorientierung, kein Werteverzehr."},
  {"id":"k-lb26-76","cat":"Laufbahn · Management","q":"Welchen Bezug hat das NSM zur Feuerwehr?","a":"Produkte: Brandschutz, Technische Hilfe, Rettungsdienst. Haushalt als „Vertrag“ Politik–Verwaltung (<strong>strategisch</strong>), KLR/Controlling (<strong>operativ</strong>); Kennzahl z. B. Schutzzielerreichungsgrad."},
  {"id":"k-lb26-77","cat":"Laufbahn · Management","q":"Was gilt bei vorläufiger Haushaltsführung, und warum?","a":"Ohne festgestellten Haushalt fehlt die <strong>Ermächtigung</strong> zu Ausgaben (Budgetrecht des Parlaments), ausgenommen gesetzlich zugelassene Ausgaben."},
  {"id":"k-lb26-78","cat":"Laufbahn · Management","q":"Welche Rechtsgrundlage gilt in Hamburg, und was erlaubt sie?","a":"<strong>Art. 67 Hamburgische Verfassung:</strong> Ausgaben (a) zur Erhaltung bestehender Einrichtungen und für beschlossene Maßnahmen, (b) für rechtliche Verpflichtungen, (c) zur Fortsetzung von Bauten/Beschaffungen mit Vorjahresmitteln. Einnahmen dürfen fortgeführt werden."},
  {"id":"k-lb26-79","cat":"Laufbahn · Management","q":"Was ist bei vorläufiger Haushaltsführung erlaubt?","a":"Rechtliche Verpflichtungen (Verträge, Gehälter, Gefahrenabwehr), <strong>Dienstbetrieb</strong>, Vermeidung von Folgeschäden, <strong>Fortführung begonnener Investitionen</strong> mit Vorjahresmitteln, Einnahmen in beliebiger Höhe."},
  {"id":"k-lb26-80","cat":"Laufbahn · Management","q":"Was darf für den NTW bei vorläufiger Haushaltsführung vorbereitet werden?","a":"Ohne Ausgabewirkung: Bedarfsplanung, <strong>Markterkundung</strong> (§ 28 VgV), Leistungsbeschreibung, Mittelanmeldung (Haushalt, Investitionsprogramm, Stellenplan), Abstimmung mit Kostenträgern (Entgeltverhandlung)."},
  {"id":"k-lb26-81","cat":"Laufbahn · Management","q":"Was ist für den NTW bei vorläufiger Haushaltsführung nicht erlaubt?","a":"Neue <strong>erhebliche Investitionen</strong> beginnen (Beschaffung, Zuschlag, Verpflichtungsermächtigungen) ohne Vorjahresmittel; <strong>neue Stellen</strong> eines nicht rechtskräftigen Stellenplans besetzen."},
  {"id":"k-lb26-82","cat":"Laufbahn · Management","q":"Wie geht man praktisch vor, wenn der NTW bei vorläufiger Haushaltsführung beschafft werden soll?","a":"Vergabeunterlagen erst bei gesicherter Finanzierung veröffentlichen, Zuschlag unter Haushaltsvorbehalt verschieben, Bestellung erst nach Inkrafttreten. Bei akuter Gefahrenabwehr bleiben notwendige Beschaffungen zulässig (mit Kämmerei klären)."},
  {"id":"k-lb26-83","cat":"Laufbahn · Management","q":"Wie lange dauert der Haushaltsprozess, und was folgt daraus?","a":"Rund <strong>18 Monate</strong>, daher langfristig planen (Investitionsprogramm, Verpflichtungsermächtigungen, Doppelhaushalte); für alles Neue: erst prüfen, dann handeln."},
  {"id":"k-lb26-84","cat":"Laufbahn · Stabsarbeit","q":"Wie gliedert sich der Führungsstab nach FwDV 100?","a":"<strong>S1</strong> Personal/Innerer Dienst, <strong>S2</strong> Lage, <strong>S3</strong> Einsatz, <strong>S4</strong> Versorgung, <strong>S5</strong> Presse- und Medienarbeit, <strong>S6</strong> Informations- und Kommunikationswesen."},
  {"id":"k-lb26-85","cat":"Laufbahn · Stabsarbeit","q":"Was ist der S4, und mit wem kann er zusammengefasst werden?","a":"Das Sachgebiet <strong>Versorgung/Logistik</strong>. Es kann mit S1 zusammengefasst oder vom Leiter des Stabes übernommen werden."},
  {"id":"k-lb26-86","cat":"Laufbahn · Stabsarbeit","q":"Aufgaben des S4 nach FwDV 100: Einsatzmittel und Verbrauchsgüter?","a":"① Weitere <strong>Einsatzmittel</strong> anfordern und zuführen (Geräte, Baustoffe, Transport-, Räum-/Hebegerät). ② <strong>Verbrauchsgüter</strong>: Löschwasser, Löschmittel (Schaum), Atemschutzgeräte/-filter, Kraftstoffe."},
  {"id":"k-lb26-87","cat":"Laufbahn · Stabsarbeit","q":"Aufgaben des S4 nach FwDV 100: Verpflegung, Unterkunft, Materialerhaltung?","a":"③ <strong>Verpflegung</strong>. ④ <strong>Unterkünfte</strong> und Rettungsmittel zum Eigenschutz (technisch, medizinisch, psychosozial, z. B. FB-PSNV-E). ⑤ <strong>Materialerhaltung</strong> (Instandsetzung, Austausch, Wiederauffüllen)."},
  {"id":"k-lb26-88","cat":"Laufbahn · Stabsarbeit","q":"Aufgabe des S4: Versorgungsorganisation festlegen. Was gehört dazu?","a":"Raumordnung (Versorgungs- und Bereitstellungsräume), Schnittstellen, <strong>Logistikkette</strong>, Finanzierung/Kostenklärung."},
  {"id":"k-lb26-89","cat":"Laufbahn · Stabsarbeit","q":"Welche Leitfragen gelten für die Logistik des S4?","a":"Die <strong>5 W</strong>: Was – Wo – Wieviel – Wann – Woher."},
  {"id":"k-lb26-90","cat":"Laufbahn · Stabsarbeit","q":"Raffineriebrand: Welchen Szenariobezug hat die S4-Arbeit?","a":"Schaum-/Löschwasserbedarf, Atemschutz/Chemikalienschutz, Kraftstoff für Pumpen und Fahrzeuge, Verpflegung und Ablösung bei langer Einsatzdauer."},
  {"id":"k-lb26-91","cat":"Laufbahn · Stabsarbeit","q":"Nach welchen Leitgedanken arbeitet der S4 (Leitidee des Konzepts)?","a":"<strong>Vorausschauend</strong> (Zeitstrahl: wann was, wo, in welcher Menge), entlang des Führungsvorgangs, im Verbund mit S1, S2, S3, S6. Grundlage ist der <strong>7-Punkte-Plan</strong>; S4 trägt Punkt 3 (Eigenschutz) und liefert Bedarfszahlen für Punkt 7 (Nachforderung)."},
  {"id":"k-lb26-92","cat":"Laufbahn · Stabsarbeit","q":"S4-Konzept: Welche vier Phasen mit Zeitrahmen gibt es?","a":"① <strong>Sofortphase</strong> (0 bis ca. 30 Min.) ② <strong>Aufbauphase</strong> (ca. 30 Min. bis 2 h) ③ <strong>Durchhaltephase</strong> (ca. 2 bis 12 h und länger) ④ <strong>Rückbau und Nachbereitung</strong>. Grenzen sind Orientierungswerte."},
  {"id":"k-lb26-93","cat":"Laufbahn · Stabsarbeit","q":"Sofortphase des S4: Bedarf und Kontakte?","a":"Arbeitsaufnahme, Lageeinweisung, Kräfte-/Mittelübersicht (S1). <strong>Bedarfsabschätzung</strong> (Löschwasser, Schaummittel, Atemschutz, Kraftstoff) mit Sicherheitszuschlag. Sofort Kontakt zu Betreiber/Werkfeuerwehr und Rettungsdienst."},
  {"id":"k-lb26-94","cat":"Laufbahn · Stabsarbeit","q":"Sofortphase des S4: Bereitstellungsraum und Eigenschutz?","a":"<strong>Bereitstellungsraum</strong> festlegen (S1/S3): Führung, Tanken, Sanitär, Wetterschutz, Strom/Wasser, Kommunikation, Lotsen, abseits der Rauchrichtung. <strong>Eigenschutz</strong>: Sicherheitstrupps, Sanitätsdienst, PSNV-E."},
  {"id":"k-lb26-95","cat":"Laufbahn · Stabsarbeit","q":"Aufbauphase des S4: Welche Maßnahmen?","a":"<strong>Nachforderung</strong> kalkulieren und über Leitstelle/S1 anfordern (Schaummittel, Großpumpen, Schlauch, Wechsellader, Tankfahrzeuge, Chemieschutz, Messtechnik). <strong>Logistikkette</strong> festlegen (wer liefert, wohin, welcher Weg), Verpflegung/Ablösekonzept, Kostenfragen vorklären."},
  {"id":"k-lb26-96","cat":"Laufbahn · Stabsarbeit","q":"Durchhaltephase des S4: Welche Maßnahmen?","a":"<strong>Verbrauchsfortschreibung</strong> (Soll/Ist, Reichweite), rollierender Nachschub, Materialerhaltung, Ablösung, Ruhe-/Unterkunftsräume, Lagebesprechungen mit Vorplanung für 6, 12 und 24 Stunden."},
  {"id":"k-lb26-97","cat":"Laufbahn · Stabsarbeit","q":"Rückbau- und Nachbereitungsphase des S4: Was gehört dazu?","a":"Rückführung von Material, Bestandsaufnahme, Instandsetzung, Auffüllen, Dekontamination; Abrechnung/Kostennachweis, Einsatztagebuch, Abschlussbericht, Lessons Learned, Übergang zur Regeleinsatzorganisation."},
  {"id":"k-lb26-98","cat":"Laufbahn · Stabsarbeit","q":"Wie kontrolliert der S4 den Ablauf?","a":"Befehle und Anforderungen schriftlich über den <strong>Vierfach-Nachrichtenvordruck</strong>, Dokumentation im Einsatztagebuch (S2), Rückmeldung an den Leiter des Stabes."},
  {"id":"k-lb26-99","cat":"Laufbahn · Stabsarbeit","q":"Schnittstellen des S4: Einsatzleiter/Leiter des Stabes, S1, S2?","a":"<strong>EL/LdS:</strong> Aufträge, Prioritäten, Vortrag der Versorgungslage. <strong>S1:</strong> Kräfte-/Mittelübersicht, Bereitstellungsräume, Ablösung, Nachschub. <strong>S2:</strong> Lagekarte, Prognosen für den Bedarf, Einsatztagebuch."},
  {"id":"k-lb26-100","cat":"Laufbahn · Stabsarbeit","q":"Schnittstellen des S4: S3, S5, S6?","a":"<strong>S3:</strong> Einsatzabschnitte/-schwerpunkte, Absperrungen, An-/Abmarschwege. <strong>S5:</strong> Informationen für die Bevölkerung, Betreuung der Medien. <strong>S6:</strong> Kommunikationswege zu Lieferanten und Bereitstellungsraum."},
  {"id":"k-lb26-101","cat":"Laufbahn · Stabsarbeit","q":"Schnittstellen des S4: Fachberater, Verbindungspersonen, Krisenstab/HVB?","a":"<strong>Fachberater/Verbindungspersonen:</strong> Werkfeuerwehr, Rettungsdienst, Polizei, THW, Hilfsorganisationen, Umwelt-/Gesundheitsamt. <strong>Krisenstab/HVB:</strong> Beschaffung, Finanzierung, Betreuung, Amtshilfe, Bundeswehr, Kosten."},
  {"id":"k-lb26-102","cat":"Laufbahn · Stabsarbeit","q":"Wie läuft die Kommunikation an den Schnittstellen des S4 ab?","a":"In beide Richtungen, <strong>schriftlich über Nachrichtenvordruck</strong>."},
  {"id":"k-lb26-103","cat":"Laufbahn · Stabsarbeit","q":"Welche Rolle hat der S4 im Stab?","a":"Sachgebietsleiter und <strong>Fachberater</strong> Logistik gegenüber EL und LdS; wirkt an Lagebeurteilung und Entschluss mit („Was ist machbar, bis wann?“), trägt in Lagebesprechungen vor. Der Stab berät und bereitet vor."},
  {"id":"k-lb26-104","cat":"Laufbahn · Stabsarbeit","q":"Wer entscheidet im Stab, und was gilt im Zwei-Stäbe-Modell?","a":"<strong>Entscheidung und Befehlsgewalt</strong> liegen beim Einsatzleiter. Zwei-Stäbe-Modell: operativ-taktische Einsatzleitung, daneben administrativ-organisatorischer Krisenstab."},
  {"id":"k-lb26-105","cat":"Laufbahn · Stabsarbeit","q":"Welche Aufgaben hat der S4 im Stab außerdem?","a":"Zuarbeiter (Verpflegungs-, Material-, Nachschubpersonal) anleiten und <strong>Dokumentation</strong> (Nachrichtenvordruck, ETB) sicherstellen."},
  {"id":"k-lb26-106","cat":"Laufbahn · Stabsarbeit","q":"Welche Rolle hat der S4 außerhalb des Stabes?","a":"<strong>Ansprechpartner/Koordinator</strong> gegenüber Versorgungskräften, Bereitstellungsraum und Einsatzabschnitten; Schnittstelle zu Lieferanten, Betreiber, HiOrg, THW, Bundeswehr, Ämtern; Kontrolle der Umsetzung; Vorbildfunktion und Fürsorge."},
  {"id":"k-lb26-107","cat":"Laufbahn · Stabsarbeit","q":"Welche Abgrenzung gilt für den S4?","a":"Er hat <strong>keine eigene Einsatzbefehlsgewalt</strong> über Kräfte im Schadengebiet; er handelt im Auftrag und mit Weisungen des Einsatzleiters/Leiters des Stabes."},
  {"id":"k-lb26-108","cat":"Laufbahn · Stabsarbeit","q":"Fehler 1 der Stabsarbeit (Raffineriebrand): Bedarf zu spät oder zu klein. Vermeidung?","a":"Logistik läuft der Lage hinterher. <strong>Zeitstrahl und Verbrauchsrechnung</strong> mit Sicherheitszuschlag, Nachforderung in Wellen, Rücksprache mit Werkfeuerwehr, Prognosen von S2/S3."},
  {"id":"k-lb26-109","cat":"Laufbahn · Stabsarbeit","q":"Fehler 2: Gestörte Schnittstellen und Informationsverlust. Vermeidung?","a":"Folge: doppelte Anforderungen, widersprüchliche Lagebilder. Klare Zuständigkeiten, <strong>Vierfach-Nachrichtenvordruck</strong>, feste Lagebesprechungen, Verbindungspersonen, Einsatztagebuch."},
  {"id":"k-lb26-110","cat":"Laufbahn · Stabsarbeit","q":"Fehler 3: Eigenschutz und Ablösung vergessen. Vermeidung?","a":"Folge: Überlastung und Ausfall von Kräften (Hitze, Atemschutz, Rauch). <strong>Eigenschutz</strong> (Punkt 3 des 7-Punkte-Plans) zuerst veranlassen, Schichtmodell und Verpflegung früh planen, Sicherheitstrupps, PSNV-E."},
  {"id":"k-lb26-111","cat":"Laufbahn · Stabsarbeit","q":"Fehler 4: Bereitstellungsraum ungeeignet oder ohne Lotsen. Vermeidung?","a":"Z. B. in der Rauchausbreitung, Stau, Glasschäden auf Straßen. Standortwahl mit S2/S3 (Wind, Zufahrten), <strong>Führungseinheit im BR</strong>, Lotsenstellen, Ausweichräume."},
  {"id":"k-lb26-112","cat":"Laufbahn · Stabsarbeit","q":"Fehler 5: Überlastung und Fixierung des S4. Vermeidung?","a":"Tunnelblick auf den Brand, Verletztenlogistik vernachlässigt. <strong>Delegieren</strong>, Prioritätenliste, Rückkopplung mit dem Leiter des Stabes, Krisenstab für nicht-feuerwehrtechnische Ressourcen einbinden."},
  {"id":"k-lb26-113","cat":"Laufbahn · Stabsarbeit","q":"Fehler 6: Rechtliche, finanzielle und dokumentarische Lücken. Vermeidung?","a":"Anforderung ohne Kostenklärung, lückenhaftes ETB, unklare Zuständigkeit. <strong>Lückenlose Dokumentation</strong>, Kostenübernahme früh mit Krisenstab/HVB klären, Betreiber einbinden, Rechtsgrundlage (Amtshilfe, KatS-Recht) beachten."},
  {"id":"k-lb26-114","cat":"Laufbahn · Stabsarbeit","q":"Welche weiteren Fehler der Stabsarbeit nennt die Musterlösung alternativ?","a":"Veraltetes Lagebild ohne Rückmeldung der Abschnitte; Rauchsäule/Bevölkerungswarnung missachtet (S5/Krisenstab); <strong>inkompatibles Material</strong> (Schaummittel, Kupplungen); keine Vorplanung der Nachbereitung."},
  {"id":"k-lbvb-01","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn die Feuerwehrzufahrt als schmale Stichstraße mit engem Kurvenradius und geringer Tragfähigkeit geplant ist?","a":"<strong>Problem:</strong> Zufahrt zu schmal, Kurve zu eng, Fahrbahn nicht ausreichend tragfähig.<br><strong>Begründung:</strong> Drehleiter und Löschfahrzeuge brauchen Breite, Schleppkurve und tragfähigen Untergrund (Drehleiter-Fahrgestell mind. 18 t); sonst ist Menschenrettung nicht möglich und die Hilfsfrist steigt.<br><strong>Lösung:</strong> Zufahrt nach den Flächen für die Feuerwehr verbreitern, Kurvenradius für die Schleppkurve auslegen, Tragfähigkeit herstellen und nachweisen, kennzeichnen und freihalten."},
  {"id":"k-lbvb-02","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr bei einer Aufstellfläche auf einem Besucherparkplatz, die durch Bäume zur Fassade verstellt ist?","a":"<strong>Problem:</strong> Fläche wird zugeparkt und Baumkronen blockieren die Leiter.<br><strong>Begründung:</strong> Parkende Fahrzeuge stehen im Einsatz im Weg; Äste verhindern Ausfahren und Anstellen der Drehleiter, jede Minute Umsetzen kostet Rettungszeit.<br><strong>Lösung:</strong> Aufstellfläche dauerhaft freihalten (Beschilderung, Absperrung, Halteverbot), Bäume im Leiterbereich entfernen oder versetzen, Maß 3,5 m × 11 m und 6 t je Abstützpunkt nachweisen."},
  {"id":"k-lbvb-03","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn eine Toreinfahrt durch fest einbetonierte Poller versperrt ist?","a":"<strong>Problem:</strong> Feuerwehrfahrzeuge kommen nicht auf das Grundstück.<br><strong>Begründung:</strong> Ohne Zufahrt keine Drehleiter und kein Löschfahrzeug am Objekt; Menschenrettung und Löschangriff verzögern sich erheblich.<br><strong>Lösung:</strong> Absenkbare oder entfernbare Poller mit Feuerwehrschließung vorsehen oder Poller entfernen, Einfahrtsbreite für die Schleppkurve nachweisen, Zufahrt kennzeichnen und freihalten."},
  {"id":"k-lbvb-05","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn das Werkstor nachts nur vom nicht besetzten Pförtnerhaus geöffnet werden kann?","a":"<strong>Problem:</strong> Die Feuerwehr kommt nachts nicht ohne fremde Hilfe auf das Gelände.<br><strong>Begründung:</strong> Ein verschlossenes Tor verzögert den Einsatz oder erzwingt Gewalt, gerade bei hoher Brandlast, bei der schnelles Eingreifen zählt.<br><strong>Lösung:</strong> Zufahrt jederzeit ohne fremde Hilfe sichern: Freischaltung durch die BMA, Feuerwehrschlüsseldepot oder Feuerwehrschloss, Kennzeichnung der Feuerwehrzufahrt."},
  {"id":"k-lbvb-06","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr, wenn der nächste Hydrant 140 m Lauflinie vom Gebäude entfernt ist?","a":"<strong>Problem:</strong> Hydrant zu weit entfernt (Richtwert 75 m Lauflinie).<br><strong>Begründung:</strong> Lange Schlauchstrecken kosten im Erstangriff Zeit, binden Personal und erhöhen den Druckverlust; bei hohem Personenrisiko nicht vertretbar.<br><strong>Lösung:</strong> Zusätzlichen Hydranten nahe dem Haupteingang errichten, sodass alle Gebäudezugänge innerhalb von 75 m Lauflinie liegen, und kennzeichnen."},
  {"id":"k-lbvb-07","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn die Löschwassermenge für ein Gebäude mit hohem Personenrisiko sehr niedrig angesetzt ist?","a":"<strong>Problem:</strong> Verfügbare Wassermenge zu gering für mehrere Rohre.<br><strong>Begründung:</strong> Die Feuerwehr braucht Wasser für Brandbekämpfung, Schutz der Rettungswege und Riegelstellung gleichzeitig; eine knappe Menge begrenzt den Einsatz.<br><strong>Lösung:</strong> Löschwasserbedarf mit Brandschutzdienststelle und Wasserversorger neu festlegen, ausreichende Menge über 2 Stunden nachweisen, notfalls Löschwasserbehälter oder Saugstelle ergänzen."},
  {"id":"k-lbvb-09","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn ein Werksbrunnen als Löschwasserquelle angesetzt wird, aber keine Saugstelle hat?","a":"<strong>Problem:</strong> Brunnen ist für die Feuerwehr nicht nutzbar.<br><strong>Begründung:</strong> Ohne Saugstelle kann kein Wasser entnommen werden; eine Pumpe im Technikgebäude fällt bei Stromausfall oder Brand aus, der angesetzte Anteil besteht nur auf dem Papier.<br><strong>Lösung:</strong> Saugstelle mit befahrbarer Aufstellfläche herstellen, Pumpe an die Sicherheitsstromversorgung anschließen oder unabhängige Quelle (Behälter, Zisterne) mit Entnahmestelle vorsehen."},
  {"id":"k-lbvb-11","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr, wenn auf Löschwasserrückhaltung wegen einer Sprinkleranlage verzichtet werden soll?","a":"<strong>Problem:</strong> Verzicht wird mit der Sprinkleranlage begründet.<br><strong>Begründung:</strong> Die Sprinkleranlage begrenzt den Brand, erzeugt aber selbst große Mengen belastetes Löschwasser; zusätzlich setzt die Feuerwehr Wasser ein.<br><strong>Lösung:</strong> Rückhaltung trotzdem nachweisen oder gleichwertig lösen und mit den zuständigen Behörden abstimmen; Einleitung in Regenwasserkanal und Vorfluter verhindern."},
  {"id":"k-lbvb-13","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn der zweite Rettungsweg über Drehleiter bei einer Brüstungsoberkante von mehr als 8 m geplant wird?","a":"<strong>Problem:</strong> Anleiterung über 8 m Brüstungshöhe ist als zweiter Rettungsweg nicht zulässig.<br><strong>Begründung:</strong> Über 8 m darf das Gebäude nur errichtet werden, wenn die Feuerwehr die erforderlichen Rettungsgeräte vorhält; die Nennrettungshöhe und Leiterbetrieb sind begrenzt.<br><strong>Lösung:</strong> Zweiten baulichen Rettungsweg schaffen (weiterer Treppenraum, Außentreppe) oder Brüstungshöhe planerisch unter 8 m halten."},
  {"id":"k-lbvb-14","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr bei einem Pflegegeschoss, dessen zweiter Rettungsweg über die Drehleiter führen soll?","a":"<strong>Problem:</strong> Bewohner sind nicht zur Selbstrettung fähig.<br><strong>Begründung:</strong> Bettlägerige und demente Personen können nicht selbstständig über eine Leiter fliehen; die Feuerwehr müsste jeden einzeln bergen, bei vielen Bewohnern nicht leistbar.<br><strong>Lösung:</strong> Zweiten baulichen Rettungsweg oder horizontale Evakuierung in sichere Brandabschnitte vorsehen; Anleiterung nicht als Rettungsweg des Pflegegeschosses ansetzen."},
  {"id":"k-lbvb-15","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn Fenster an Anleiterstellen mit Öffnungsbegrenzer ausgeführt sind?","a":"<strong>Problem:</strong> Fenster sind nicht als Rettungsöffnung nutzbar.<br><strong>Begründung:</strong> Durch ein gekipptes Fenster kann niemand gerettet werden; die Feuerwehr verliert Zeit, der zweite Rettungsweg ist wirkungslos.<br><strong>Lösung:</strong> Sperre mit Notentriegelung oder Schlüsselsicherung für Feuerwehr und Personal, ausreichender Querschnitt (lichtes Maß mind. 0,90 m × 1,20 m), Anleiterstellen kennzeichnen."},
  {"id":"k-lbvb-16","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr, wenn Klassen- oder Lernbereiche nur festverglaste Fenster haben und als Anleiterstelle gelten sollen?","a":"<strong>Problem:</strong> Festverglasung ist keine Rettungsöffnung.<br><strong>Begründung:</strong> Durch einen schmalen Lüftungsflügel gelangt weder ein Kind noch eine Rettungskraft ins Freie; Scheiben einschlagen kostet Zeit und verletzt.<br><strong>Lösung:</strong> Zweiten Rettungsweg baulich ausbilden (weiterer Ausgang, Außentreppe) oder Anleiterstellen mit ausreichend großen, öffenbaren Fenstern ausstatten."},
  {"id":"k-lbvb-17","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn die Zufahrt zu den Anleiterstellen zwar vorhanden, die Aufstellfläche aber nur für Pkw-Lasten tragfähig ist?","a":"<strong>Problem:</strong> Aufstellfläche trägt die Abstützlast der Drehleiter nicht.<br><strong>Begründung:</strong> Eine Drehleiter braucht mind. 6 t je Abstützpunkt; bei Pkw-Pflaster droht Einsinken und Umkippen, damit entfällt der zweite Rettungsweg.<br><strong>Lösung:</strong> Tragfähigkeit für Feuerwehrfahrzeuge herstellen und nachweisen (z. B. Rasengitter, Schwerlastpflaster), Fläche 3,5 m × 11 m kennzeichnen und freihalten."},
  {"id":"k-lbvb-18","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn in notwendigen Treppenräumen keine Rauchableitung an oberster Stelle vorgesehen ist?","a":"<strong>Problem:</strong> Rauchableitung am Treppenraumkopf fehlt.<br><strong>Begründung:</strong> Dringt Rauch in den Treppenraum, ist der Rettungs- und Angriffsweg der Feuerwehr nicht nutzbar; ohne Öffnung oben kann sie den Rauch nicht abführen.<br><strong>Lösung:</strong> Öffnung an oberster Stelle mit mind. 1 m² freiem Querschnitt, auslösbar im Erdgeschoss und am obersten Treppenabsatz."},
  {"id":"k-lbvb-21","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr, wenn eine Aula über zwei Geschosse nur öffenbare Fenster im Erdgeschoss zur Entrauchung hat?","a":"<strong>Problem:</strong> Rauchableitung an oberster Stelle der Halle fehlt.<br><strong>Begründung:</strong> Heißer Rauch sammelt sich unter der Decke und füllt den Raum von oben; über Fenster im Erdgeschoss kann er nicht abziehen, Sicht im Rettungsweg geht verloren.<br><strong>Lösung:</strong> Rauchableitungsöffnungen an oberster Stelle, von Hand und über die BMA auslösbar, Zuluftöffnungen ergänzen; Bemessung mit der Brandschutzdienststelle abstimmen."},
  {"id":"k-lbvb-23","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr bei Wandhydranten und Löschern in einem Sonderbau, wenn sie nur an einer Stelle des Gebäudes vorhanden sind?","a":"<strong>Problem:</strong> Anzahl und Verteilung der Löschgeräte sind unzureichend.<br><strong>Begründung:</strong> Die Lernseiten sehen Feuerlöscher und Wandhydranten Typ F in ausreichender Anzahl vor, gut sichtbar und leicht zugänglich; sonst fehlt der Erstangriff durch Nutzer und Feuerwehr.<br><strong>Lösung:</strong> Löschgeräte und Wandhydranten Typ F in ausreichender Anzahl, an den Rettungs- und Angriffswegen, im Einvernehmen mit der Brandschutzdienststelle."},
  {"id":"k-lbvb-24","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn die Brandmeldeanlage eines Pflegeheims nicht zur Feuerwehr aufgeschaltet ist?","a":"<strong>Problem:</strong> Keine automatische Alarmierung der Feuerwehr.<br><strong>Begründung:</strong> Nachts ist das Personal knapp und mit Menschenrettung beschäftigt; der Notruf verzögert sich. Eine Aufschaltung alarmiert sofort mit genauer Meldergruppe.<br><strong>Lösung:</strong> BMA mit automatischer Übertragung auf die Leitstelle, gegen Falschalarme gesichert, Alarmablauf mit der Brandschutzdienststelle abstimmen."},
  {"id":"k-lbvb-25","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr, wenn die Brandmelderzentrale im Untergeschoss liegt und kein Anzeigetableau am Eingang vorgesehen ist?","a":"<strong>Problem:</strong> Zentrale schwer erreichbar, keine Anzeige für die Feuerwehr.<br><strong>Begründung:</strong> Die Trupps müssen ohne Suchen erkennen, wo es brennt; im Keller oder vor verschlossenen Türen geht Zeit verloren.<br><strong>Lösung:</strong> Anzeige- und Bedieneinrichtungen in leicht zugänglichem Raum nahe den Feuerwehr-Eingängen, Feuerwehrlaufkarten und Feuerwehrplan abstimmen."},
  {"id":"k-lbvb-27","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr, wenn in einer Schule der Pausengong als Alarmsignal verwendet wird?","a":"<strong>Problem:</strong> Alarmsignal ist vom Pausensignal nicht unterscheidbar.<br><strong>Begründung:</strong> Kinder und Lehrkräfte halten den Alarm für das Pausenzeichen und räumen nicht oder zu spät; im Treppenraum zählt jede Sekunde.<br><strong>Lösung:</strong> Eigenes, deutlich unterscheidbares Räumungssignal einsetzen, im Alarmplan und in Räumungsübungen vermitteln, Alarmierungsanlage an Sicherheitsstrom anschließen."},
  {"id":"k-lbvb-28","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn der Handalarm in einer Schule nur im Sekretariat ausgelöst werden kann?","a":"<strong>Problem:</strong> Handauslösung nur an einer zeitweise besetzten Stelle.<br><strong>Begründung:</strong> Bei Ganztag, Hort und Abendveranstaltungen kann niemand alarmieren, der Brand wird spät gemeldet.<br><strong>Lösung:</strong> Handmelder an Rettungswegen und Ausgängen flächendeckend, Alarmierung an jederzeit zugänglicher Stelle, Alarmablauf für Veranstaltungszeiten festlegen."},
  {"id":"k-lbvb-29","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn in einem Pflegeheim keine Räumungsübungen und nachts nur zwei Pflegekräfte für 64 Bewohner vorgesehen sind?","a":"<strong>Problem:</strong> Kein geübtes Räumungskonzept, zu wenig Nachtpersonal.<br><strong>Begründung:</strong> Das Personal muss viele nicht selbstrettungsfähige Personen bis zum Eintreffen der Feuerwehr allein in Sicherheit bringen; die Feuerwehr trifft auf eine ungeordnete Lage.<br><strong>Lösung:</strong> Räumungskonzept (horizontale Evakuierung) erstellen, mindestens jährlich auch nachts üben, Nachtbesetzung mit der Brandschutzdienststelle abstimmen, Brandschutzhelfer und Brandschutzbeauftragten benennen."},
  {"id":"k-lbvb-32","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr, wenn Räumungsübungen in einer Schule nur alle zwei Jahre stattfinden?","a":"<strong>Problem:</strong> Übungen zu selten.<br><strong>Begründung:</strong> Kinder müssen den Ablauf sicher beherrschen; bei zweijährigem Rhythmus verblasst das Wissen, neue Räume und Aula-Nutzung bringen neue Fluchtwege.<br><strong>Lösung:</strong> Mindestens jährliche Übungen, auch mit Veranstaltungsszenario, Sammelplätze festlegen, Übung auswerten, Lehrkräfte als Brandschutzhelfer unterweisen."},
  {"id":"k-lbvb-33","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn Feuerwehrzufahrten und Aufstellflächen betrieblich nicht gegen Zuparken gesichert werden?","a":"<strong>Problem:</strong> Keine organisatorische Sicherung der Flächen.<br><strong>Begründung:</strong> Tragfähige Flächen helfen nicht, wenn sie im Einsatz zugestellt sind; die Lernseiten fordern dauerhaftes Freihalten und leichte Erkennbarkeit.<br><strong>Lösung:</strong> Kennzeichnung, Halteverbot oder Absperrung, regelmäßige Kontrolle durch den Brandschutzbeauftragten, Aufnahme in die Brandschutzordnung."},
  {"id":"k-lbvb-34","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn eine Aula mit 310 Plätzen wie ein normaler Mehrzweckraum behandelt wird?","a":"<strong>Problem:</strong> Besonderer Nutzungs- und Personenrisiko wird nicht berücksichtigt.<br><strong>Begründung:</strong> Bei Veranstaltungen sind viele ortsunkundige Besucher im Raum; ab 200 Besuchern greift die MVStättVO, sonst steigt die Gefahr von Panik und blockierten Ausgängen.<br><strong>Lösung:</strong> Versammlungsstättenrecht prüfen bzw. sinngemäß anwenden: Rettungswegbreiten nach Personenzahl, Bestuhlungs- und Rettungswegplan, Sicherheitsbeleuchtung, Alarmierung."},
  {"id":"k-lbvb-35","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr, wenn beide Ausgänge einer Aula ausschließlich in ein als Pausenhalle genutztes Foyer führen?","a":"<strong>Problem:</strong> Rettungswege sind nicht voneinander unabhängig.<br><strong>Begründung:</strong> Brennt oder verraucht das Foyer oder ist es verstellt, hat die Aula keinen zweiten Weg ins Freie; für viele Personen ist das ein Nadelöhr.<br><strong>Lösung:</strong> Mindestens einen weiteren, vom Foyer unabhängigen Rettungsweg direkt ins Freie; Foyer nur mit Freihaltung, Brandlastfreiheit und Rauchableitung als Rettungsweg."},
  {"id":"k-lbvb-36","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn die Sicherheitsstromversorgung in einem Pflegeheim nur die Sicherheitsbeleuchtung speist?","a":"<strong>Problem:</strong> BMA, Alarmierung und Rauchableitung ohne Notstrom.<br><strong>Begründung:</strong> Bei Stromausfall im Brandfall fallen Anzeige, Warnung und Brandfallsteuerung aus; die Feuerwehr arbeitet blind und die Bewohner werden nicht gewarnt.<br><strong>Lösung:</strong> Sicherheitsstromversorgung auch für BMA, Alarmierungseinrichtung, Rauchableitung und Aufzüge mit Brandfallsteuerung, Funktionserhalt der Leitungen sicherstellen."},
  {"id":"k-lbvb-38","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn eine Abweichung ohne Kompensation und nur mit wirtschaftlicher Begründung beantragt wird?","a":"<strong>Problem:</strong> Abweichung ohne Gleichwertigkeitsnachweis.<br><strong>Begründung:</strong> Abweichungen setzen voraus, dass das Sicherheitsniveau anders erreicht wird; Wirtschaftlichkeit ersetzt keine Sicherheit, und größere Abschnitte lassen Feuer und Rauch weiter ausbreiten.<br><strong>Lösung:</strong> Abweichung nur mit schlüssiger Begründung und Ausgleich (z. B. Sprinkler, BMA mit Aufschaltung, Rauchableitung, zusätzliche Rettungswege) zulassen, sonst Brandwand ergänzen; Abstimmung mit Bauaufsicht."},
  {"id":"k-lbvb-39","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert die Feuerwehr bei einer beantragten Abweichung vom Abstand notwendiger Rettungswege?","a":"<strong>Problem:</strong> Abweichung verlängert die Fluchtwege.<br><strong>Begründung:</strong> Längere Wege verlängern die Räumungszeit und erschweren den Löschangriff; die Gleichwertigkeit muss belegt sein.<br><strong>Lösung:</strong> Kompensation vorsehen, etwa zusätzliche Rettungswege, BMA mit Aufschaltung oder Sprinkler, und organisatorische Maßnahmen wie Räumungskonzept; Brandschutzdienststelle beteiligen."},
  {"id":"k-lbvb-40","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie nimmst du Stellung, wenn ein Brandschutzkonzept eine Abweichung beantragt, aber keine Aussage zu Löschwasser und Feuerwehrzufahrten trifft?","a":"<strong>Problem:</strong> Abweichung wird isoliert betrachtet.<br><strong>Begründung:</strong> Kompensationsmaßnahmen müssen auch für den abwehrenden Brandschutz tragen; bleiben Zufahrt, Aufstellfläche und Löschwasser offen, ist die Gleichwertigkeit nicht belegt.<br><strong>Lösung:</strong> Konzept um Zufahrt, Aufstellflächen, Löschwasser und Rettungsgeräteeinsatz ergänzen und die Abweichung nur im Gesamtzusammenhang bewerten."},
  {"id":"k-lb23-29","cat":"Laufbahn · Führungsvorgang","q":"Wie beurteilt der S3 die Lage bei einem großflächigen Stromausfall (Lage, Ort, Zeit)?","a":"Lage: Ursache und Dauer zunächst unklar, Wiederversorgung nicht absehbar. Ort: Stadt-/Ausfallgebiet; Zeit: Eintrittszeitpunkt, <strong>Wetter/Jahreszeit</strong> (Kälte, Hitze) beachten. Anlagen (Ausfallgebiet, KRITIS, Einspeisung, Notfallpufferung) auswerten."},
  {"id":"k-lb23-30","cat":"Laufbahn · Führungsvorgang","q":"Welche Gefahren (4A-C-4E) ergeben sich bei einem großflächigen Stromausfall?","a":"Stromabhängige Patienten (Heimbeatmung, Dialyse), Krankenhäuser/Pflege (Notstrom durch Kraftstoff begrenzt), Aufzugseinschlüsse, Verkehr, Trinkwasserdruck und Abwasserpumpen, Kommunikation (<strong>Notruf 112 gefährdet</strong>), Heizung, Kühlketten, Brandgefahr durch Kerzen und Aggregate, CO-Vergiftungen, Sicherheitslage."},
  {"id":"k-lb23-31","cat":"Laufbahn · Führungsvorgang","q":"Wie verläuft ein längerer Stromausfall zeitlich (antizipierter Verlauf)?","a":"<strong>0 bis 6 h</strong> Akutphase; <strong>6 bis 24 h</strong> Notstrom-Pufferzeiten laufen aus, Kraftstoffbedarf, Funk-/Mobilfunkausfall; <strong>24 bis 72 h</strong> Versorgung, Wasser, Pflege, Ablösung; <strong>&gt; 72 h</strong> Eskalation, Kräftenachforderung (Land, THW, Bundeswehr), Katastrophenfall."},
  {"id":"k-lb23-32","cat":"Laufbahn · Führungsvorgang","q":"Was gehört bei der Lagebeurteilung zur eigenen Lage?","a":"Kräfte und Mittel von Feuerwehr, Rettungsdienst und Hilfsorganisationen, ad-hoc verfügbare Rufgruppen, <strong>Eigenversorgung der Feuerwachen</strong> (Notstrom, Kraftstoff), Alarmierung und Funk ohne Netz sowie Personal (Ehrenamt) und Schichtfähigkeit."},
  {"id":"k-lb23-33","cat":"Laufbahn · Führungsvorgang","q":"Wie lautet die Beurteilung der Möglichkeiten beim Stromausfall, und nach welchen Kriterien wird entschieden?","a":"Schwerpunkt <strong>Verteidigung/Sichern</strong> (KRITIS, Notstrom, Kraftstoff) und Rettung (vulnerable Gruppen, Betreuung), kein Angriff; Rückzug nur als Evakuierung einzelner Einrichtungen. Kriterien: Sicherheit, Schnelligkeit, Erfolgsaussicht, Aufwand; Priorisierung nach Wichtigkeit und Autarkiezeit der KRITIS."},
  {"id":"k-lb23-34","cat":"Laufbahn · Führungsvorgang","q":"Welche Ziele und Prioritäten setzt der Entschluss des S3 beim Stromausfall?","a":"1. Leben und Gesundheit (Krankenhäuser, Pflege, Heimbeatmete, Notruf), 2. <strong>Notstrom und Kraftstoff der KRITIS</strong> nach Autarkiezeit, 3. Trink-/Abwasser, 4. Kommunikation und Information, 5. Betreuung/Selbsthilfe, 6. Handlungsfähigkeit der Einsatzkräfte, 7. Sachwerte."},
  {"id":"k-lb23-35","cat":"Laufbahn · Führungsvorgang","q":"Welche Sofortmaßnahmen gehören in den Entschluss des S3?","a":"Führungsorganisation herstellen, Stab einberufen und <strong>Krisenstab (HVB)</strong> anfordern, Einsatzraum gliedern, Bereitstellungsraum, Vollalarm, Kommunikationsplan, <strong>Feststellung des Katastrophenfalls anregen</strong>, Notrufabarbeitung sicherstellen (Wachen als Anlaufstellen)."},
  {"id":"k-lb23-36","cat":"Laufbahn · Führungsvorgang","q":"Wie plant der S3 den Kräfteeinsatz beim Stromausfall?","a":"Feuerwehr (Erkundung, Aggregate, Aufzugsbefreiung), THW (Notstrom, Beleuchtung, Pumpen), RD/HiOrg (Betreuung, Sanität), Polizei (Absperrung, Verkehr). Nachforderung über <strong>Zeitstrahl</strong> (wann wo welche Kräfte) und Nachbarhilfe."},
  {"id":"k-lb23-37","cat":"Laufbahn · Führungsvorgang","q":"Wie bildet der S3 Schwerpunkt und Reserve und regelt Zeit und Kontrolle?","a":"Schwerpunkt: KRITIS mit kürzester Pufferzeit zuerst; eine <strong>taktische Reserve</strong> im Bereitstellungsraum; Ablösung in 12-h-Schichten. Lagebesprechungen alle 2 bis 4 h, Neubewertung bei Lageänderung (Wiederversorgungsprognose des Netzbetreibers)."},
  {"id":"k-lb23-38","cat":"Laufbahn · Führungsvorgang","q":"Wie ist die Einsatzstruktur (Führungsstufe D) beim Stromausfall aufgebaut? Was steht an der Spitze?","a":"Oben <strong>HVB/Krisenstab</strong> (administrativ-organisatorisch) und <strong>Einsatzleitung/Führungsstab</strong> (operativ-taktisch) mit S1 bis S6; der Leiter des Stabes koordiniert."},
  {"id":"k-lb23-39","cat":"Laufbahn · Führungsvorgang","q":"Welche Fachabschnitte bildet die Einsatzstruktur beim Stromausfall?","a":"EA <strong>KRITIS und Notstrom/Kraftstoff</strong>, EA Gesundheit und Pflege, EA Wasser/Abwasser/Umwelt, EA Verkehr/Absperrung (mit Polizei), EA Logistik/Versorgung, EA IuK/Meldewesen."},
  {"id":"k-lb23-40","cat":"Laufbahn · Führungsvorgang","q":"Welche räumlichen Abschnitte und welcher Bereitstellungsraum gehören zur Einsatzstruktur?","a":"EA <strong>Bevölkerungshilfe Nord/Mitte/Süd</strong> (Selbsthilfe-Anlaufstellen/Leuchttürme an Feuerwachen und Gemeindehäusern, Notruf- und Meldestellen, Informationspunkte), Zuschnitt an den Ausrückebereichen. Bereitstellungsraum mit eigener Führung (ELW), Kraftstoff- und Verpflegungszugang."},
  {"id":"k-lb23-41","cat":"Laufbahn · Führungsvorgang","q":"Wie wird die Kommunikation in der Einsatzstruktur beim Stromausfall gesichert?","a":"<strong>Digitalfunk</strong> mit Kanalplan, Rückfallebene Analogfunk, Melder/Meldeköpfe, Leuchttürme als Meldepunkte (S6). Fachberater (Netzbetreiber, Gesundheitsamt, Ärztlicher Leiter RD, THW, Polizei, Bundeswehr) unterstützen im Stab; 30 Minuten vorausdenken."},
  {"id":"k-lb23-42","cat":"Laufbahn · Führungsvorgang","q":"Welches Befehlsschema gilt nach FwDV 100 für die Führung über längere Zeiträume?","a":"<strong>Lage – Auftrag – Durchführung – Versorgung – Führung und Kommunikation.</strong> Das Kurzschema (Einheit/Auftrag/Mittel/Ziel/Weg) gilt dagegen für den Einsatzbefehl im Einzelfall."},
  {"id":"k-lb23-43","cat":"Laufbahn · Führungsvorgang","q":"Was gehört in den Kopf eines schriftlichen Einsatzbefehls?","a":"Befehlende Stelle (z. B. Einsatzleitung/Führungsstab, S3), Abgangsort, <strong>Datum/Uhrzeit</strong>, Verteiler, Anlagen (z. B. Prioritätenliste, Lagekarte, Kanalplan), Unterschrift mit Funktion."},
  {"id":"k-lb23-44","cat":"Laufbahn · Führungsvorgang","q":"Was steht in Lage und Auftrag des Befehls am Beispiel EA KRITIS?","a":"Lage: Stromausfall seit (Zeit), Wiederversorgung ungewiss, KRITIS mit Notstrom-Pufferzeiten, zugeteilte Kräfte (FF-Züge, THW, Tankfahrzeuge). Auftrag: EA KRITIS stellt die <strong>Notstrom- und Kraftstoffversorgung</strong> der priorisierten Objekte ab sofort und bis auf Weiteres sicher."},
  {"id":"k-lb23-45","cat":"Laufbahn · Führungsvorgang","q":"Was steht in der Durchführung des Befehls (Absicht, Aufträge, Zeiten, Schutz)?","a":"Eigene Absicht: zuerst Objekte mit Pufferzeit &lt; 12 h. Aufträge an Einheiten (Erkundung, Aggregate, Betankung), Zusammenarbeit mit Netzbetreiber und S4, Zeitangaben (Beginn, Dauer, <strong>Ablösung 12-h-Schicht</strong>), Schutzmaßnahmen (Elektrofachkraft, CO, Kraftstoffe, Eigenschutz)."},
  {"id":"k-lb23-46","cat":"Laufbahn · Führungsvorgang","q":"Was regeln Versorgung sowie Führung und Kommunikation im Befehl?","a":"Versorgung: Verpflegung, Betriebsstoffe (Kraftstoffdepot), Materialerhaltung, medizinische Versorgung/PSNV-E, Versorgungsstelle und Zeiten. Führung: Digitalfunkkanal, Rückfallebene Analogfunk, Meldekopf, <strong>Lagemeldungen alle 2 h</strong>, Standort des Abschnittsleiters und des Stabes."},
  {"id":"k-lb23-47","cat":"Laufbahn · Führungsvorgang","q":"Wer sind die Empfänger des Befehls, und wie wird er erteilt?","a":"Adressat: Abschnittsleiter EA KRITIS; nachrichtlich Leiter des Stabes, S1, S2, S4, S6, Verbindungsperson Krisenstab, Leiter Bereitstellungsraum, Unterabschnittsleiter. Erteilung als Gesamtbefehl <strong>mündlich vor den Führungskräften und zusätzlich schriftlich</strong> (Nachrichtenvordruck, Einsatztagebuch); vorab Vorbefehl."},
  {"id":"k-lb23-48","cat":"Laufbahn · Führungsvorgang","q":"Was ist mit S1 und S2 vor Beginn der Einsatzabwicklung abzusprechen?","a":"S1: Kräfteübersicht, Alarmierung/Nachalarmierung, Schichtplan und Ablösung (12 h), Reserven, Personal der Anlaufstellen, Spontanhelfer. S2: <strong>einheitliches Lagebild</strong>, Meldewege und -zeiten, Einsatztagebuch, Prognosen des Netzbetreibers, Wetter (DWD)."},
  {"id":"k-lb23-49","cat":"Laufbahn · Führungsvorgang","q":"Was ist mit S4 und S5 abzusprechen?","a":"S4: Kraftstoffbedarf und -priorisierung, Notstromaggregate (THW, Bundeswehr, Baumärkte), Trinkwasser, Verpflegung, Unterkünfte, Beschaffung. S5: <strong>Warnung und Information der Bevölkerung</strong> (Sirenen, Durchsagen, Radio, NINA), Standorte der Anlaufstellen, Bürgertelefon, Falschmeldungen."},
  {"id":"k-lb23-50","cat":"Laufbahn · Führungsvorgang","q":"Was ist mit S6 und dem Leiter des Stabes abzusprechen?","a":"S6: Kommunikationskonzept, Notstrom der Funkstandorte, Kanalplan, Analog-/Satellitenfunk, Notrufabarbeitung. Leiter des Stabes: Prioritäten, Abschnittsgliederung, Nachforderungen, Abstimmung mit Krisenstab (HVB), <strong>Feststellung des Katastrophenfalls</strong>, Ablösung des Stabes."},
  {"id":"k-lb23-51","cat":"Laufbahn · Führungsvorgang","q":"Welche externen Ansprechpartner sind für Energie und KRITIS einzubeziehen?","a":"<strong>Netzbetreiber/Stadtwerke</strong>: Ursache, Dauer, Wiederversorgung, Priorisierung der KRITIS bei Wiederzuschaltung. <strong>KRITIS-Betreiber</strong> (Krankenhäuser, Pflegeheime, Wasser/Abwasser, Telekommunikation, Tankstellen, Handel, Apotheken): Autarkiezeiten, Kraftstoffvorräte, Bedarfe."},
  {"id":"k-lb23-52","cat":"Laufbahn · Führungsvorgang","q":"Welche externen Ansprechpartner kommen aus Gesundheit, Hilfsorganisationen und Sicherheit?","a":"Gesundheit: Gesundheitsamt, Kassenärztliche Vereinigung, Ärztlicher Leiter RD, Krankenhaus-Verbund, Veterinäramt. <strong>DRK, ASB, JUH, MHD</strong> (Betreuung, Verpflegung) und <strong>THW</strong> (Notstrom, Beleuchtung, Pumpen). Polizei und Ordnungsamt (Absperrung, Verkehr, Objektschutz), Verkehrsbetriebe/Bahn."},
  {"id":"k-lb23-53","cat":"Laufbahn · Führungsvorgang","q":"Welche Verwaltungsstellen und höheren Ebenen sind einzubeziehen, und was wird abgesprochen?","a":"Krisenstab/HVB, Sozialamt (Notunterkünfte), Landkreis/Nachbarkommunen, Landesbehörde (Kräftenachforderung), Bundeswehr (Amtshilfe über Kreisverbindungskommando), BBK/Bundesnetzagentur. Inhalt: <strong>Zuständigkeiten, Priorisierung, Erreichbarkeit, Verbindungspersonen, Meldewege, Kostenübernahme</strong>, rechtlicher Rahmen."},
  {"id":"k-lb23-54","cat":"Laufbahn · Recht","q":"Wen binden die Grundrechte nach Art. 1 Abs. 3 GG?","a":"Gesetzgebung, vollziehende Gewalt und Rechtsprechung <strong>unmittelbar</strong>. Sie sind nicht nur individuelle Freiheitsrechte, sondern Grundlage der gesamten Verfassungsordnung."},
  {"id":"k-lb23-55","cat":"Laufbahn · Recht","q":"Welche Funktion haben Grundrechte als Abwehrrechte (status negativus)?","a":"Schutz des Einzelnen vor Eingriffen des Staates; die <strong>Hauptfunktion</strong>. Eingriffe nur bei verfassungsrechtlicher Rechtfertigung (Gesetzesvorbehalt, Art. 19 Abs. 1 GG, Verhältnismäßigkeit). Beispiele: Art. 2 Abs. 2, 4, 5 Abs. 1, 13, 14 GG."},
  {"id":"k-lb23-56","cat":"Laufbahn · Recht","q":"Was bedeutet die Funktion der objektiven Wertordnung?","a":"Grundrechte enthalten Grundentscheidungen für die gesamte Rechtsordnung; sie sind bei Auslegung des einfachen Rechts zu beachten (<strong>Ausstrahlungswirkung</strong>). Folge: mittelbare Drittwirkung im Privatrecht über Generalklauseln (Lüth-Urteil)."},
  {"id":"k-lb23-57","cat":"Laufbahn · Recht","q":"Was folgt aus der Schutzpflichtfunktion der Grundrechte, besonders für die Feuerwehr?","a":"Der Staat muss sich schützend vor Rechtsgüter stellen und sie vor Eingriffen Dritter bewahren (z. B. Leben und Gesundheit, Art. 2 Abs. 2 GG). Daraus folgt die <strong>Pflicht zur Gefahrenabwehr</strong>."},
  {"id":"k-lb23-58","cat":"Laufbahn · Recht","q":"Was sind Teilhabe- und Leistungsrechte (status positivus)? Beispiele?","a":"Anspruch auf gleichberechtigten Zugang zu staatlichen Einrichtungen und Leistungen. Beispiele: gleicher Zugang zu öffentlichen Ämtern (<strong>Art. 33 Abs. 2 GG</strong>), Chancengleichheit im Bildungswesen, effektiver Rechtsschutz (Art. 19 Abs. 4 GG)."},
  {"id":"k-lb23-59","cat":"Laufbahn · Recht","q":"Was sind Mitwirkungsrechte (status activus)? Beispiele?","a":"Teilnahme am demokratischen Willensbildungsprozess, sie legitimieren staatliches Handeln. Beispiele: <strong>Wahlrecht</strong> (Art. 38 Abs. 2 GG), Versammlungs- und Vereinigungsfreiheit (Art. 8, 9 GG), Petitionsrecht (Art. 17 GG)."},
  {"id":"k-lb23-60","cat":"Laufbahn · Recht","q":"Welche ergänzenden Funktionen haben Verfahrens-, Organisations- und Einrichtungsgarantien?","a":"Grundrechte wirken auf Verfahrensgestaltung und Organisation ein; <strong>Institutsgarantien</strong> schützen z. B. Ehe und Familie sowie Eigentum. Ergebnis: Hauptfunktion ist die Abwehrfunktion."},
  {"id":"k-lb23-61","cat":"Laufbahn · Recht","q":"Was bedeutet der Vorrang des Gesetzes?","a":"<strong>„Kein Handeln gegen das Gesetz.“</strong> Die Verwaltung darf nicht gegen bestehende Gesetze und höherrangiges Recht verstoßen. Gilt für jedes Verwaltungshandeln, auch für begünstigende Maßnahmen."},
  {"id":"k-lb23-62","cat":"Laufbahn · Recht","q":"Was bedeutet der Vorbehalt des Gesetzes?","a":"<strong>„Kein Handeln ohne Gesetz.“</strong> Belastende Eingriffe in Freiheit und Eigentum brauchen eine gesetzliche Ermächtigungsgrundlage. Nach der <strong>Wesentlichkeitstheorie</strong> muss der Gesetzgeber alle wesentlichen, grundrechtsrelevanten Entscheidungen selbst treffen."},
  {"id":"k-lb23-63","cat":"Laufbahn · Recht","q":"Woraus leiten sich Vorrang und Vorbehalt des Gesetzes ab?","a":"Vorrang: Rechtsstaatsprinzip, <strong>Art. 20 Abs. 3 GG</strong> (Bindung an Gesetz und Recht). Vorbehalt zusätzlich aus Demokratieprinzip (Art. 20 Abs. 1, 2 GG) und Grundrechten (Gesetzesvorbehalte, z. B. Art. 2 Abs. 2 S. 3, Art. 13 Abs. 2, 7, Art. 19 Abs. 1 GG). Feuerwehr: Eingriffe brauchen eine Befugnis, z. B. § 14 FwG Bln."},
  {"id":"k-lb23-64","cat":"Laufbahn · Recht","q":"Was sind Rechtsverordnungen?","a":"Von der <strong>Exekutive</strong> (Regierung, Minister, Senat) erlassene abstrakt-generelle Rechtsnormen mit Außenwirkung. Materielle Gesetze, im Rang unter den formellen Gesetzen. Abgrenzung: Satzungen setzen Selbstverwaltungskörperschaften, Verwaltungsvorschriften wirken nur intern."},
  {"id":"k-lb23-65","cat":"Laufbahn · Recht","q":"Wer erteilt die Ermächtigung zum Erlass einer Rechtsverordnung?","a":"Der <strong>Gesetzgeber durch ein formelles Gesetz</strong> (Bund: Bundestag/Bundesrat, Land: Abgeordnetenhaus). Ohne Ermächtigungsgesetz gibt es keine Rechtsverordnung (Vorbehalt des Gesetzes, Gewaltenteilung)."},
  {"id":"k-lb23-66","cat":"Laufbahn · Recht","q":"Welche Voraussetzungen stellt Art. 80 Abs. 1 GG an die Ermächtigung?","a":"Ermächtigt werden können Bundesregierung, Bundesminister oder Landesregierungen. <strong>Inhalt, Zweck und Ausmaß</strong> müssen im Gesetz bestimmt sein; die Verordnung nennt die Rechtsgrundlage (Zitiergebot); Subdelegation nur durch Rechtsverordnung."},
  {"id":"k-lb23-67","cat":"Laufbahn · Recht","q":"Welches Beispiel für eine Verordnungsermächtigung nennt die Lösung im Berliner Feuerwehrrecht?","a":"Das FwG Bln ermächtigt die für Inneres zuständige <strong>Senatsverwaltung</strong> zum Erlass von Rechtsverordnungen (Organisation, Werkfeuerwehren). Landesrechtliche Entsprechung zu Art. 80 GG: Art. 64 VvB (bitte prüfen)."},
  {"id":"k-lb23-68","cat":"Laufbahn · Recht","q":"Was ist Ermessen, und woran unterscheidet es sich von der gebundenen Entscheidung?","a":"Handlungsspielraum auf der <strong>Rechtsfolgenseite</strong> einer Norm („kann“, „darf“), auszuüben nach pflichtgemäßem Ermessen (§ 40 VwVfG, § 114 VwGO). Bei „hat“, „muss“, „ist“ liegt eine gebundene Entscheidung vor."},
  {"id":"k-lb23-69","cat":"Laufbahn · Recht","q":"Welche zwei Formen des Ermessens gibt es?","a":"<strong>Entschließungsermessen</strong>: ob die Behörde überhaupt tätig wird (im Gefahrenabwehrrecht Opportunitätsprinzip). <strong>Auswahlermessen</strong>: wie sie tätig wird (Mittelwahl) und gegen wen (Störerauswahl); Schranke ist die Verhältnismäßigkeit."},
  {"id":"k-lb23-70","cat":"Laufbahn · Recht","q":"Welche Ermessensfehler gibt es?","a":"<strong>Ermessensnichtgebrauch</strong> (Ausfall), <strong>Ermessensüberschreitung</strong> (nicht vorgesehene Rechtsfolge), <strong>Ermessensfehlgebrauch</strong> (sachfremde Erwägungen, Verstoß gegen Grundrechte, Gleichheitssatz, Verhältnismäßigkeit)."},
  {"id":"k-lb23-71","cat":"Laufbahn · Recht","q":"Was bedeutet Ermessensreduzierung auf Null?","a":"Der Spielraum schrumpft so weit, dass nur noch <strong>eine einzige Entscheidung</strong> fehlerfrei ist; aus „Können“ wird „Müssen“, der Bürger hat einen Anspruch auf Einschreiten. Typisch: erhebliche, gegenwärtige Gefahr für Leben und Gesundheit; Selbstbindung der Verwaltung (Art. 3 GG)."},
  {"id":"k-lb23-72","cat":"Laufbahn · Recht","q":"Wie wirkt sich die Ermessensreduzierung auf Null beim Feuerwehreinsatz aus?","a":"Droht Menschen im Gebäude <strong>Lebensgefahr</strong>, ist das Entschließungsermessen auf Null reduziert: Die Feuerwehr muss handeln. Nur das Wie bleibt (Auswahlermessen) im Rahmen der Verhältnismäßigkeit."},
  {"id":"k-lb23-73","cat":"Laufbahn · Recht","q":"Welche Voraussetzungen hat die Vollstreckung eines Verwaltungsakts gegen den Willen des Adressaten?","a":"Vollstreckbarer <strong>Grund-VA</strong> mit befehlendem Inhalt (Handlung, Duldung, Unterlassung), unanfechtbar oder ohne aufschiebende Wirkung (Anordnung der sofortigen Vollziehung, § 80 Abs. 2 VwGO), dazu ein richtiges, verhältnismäßiges Zwangsmittel. In Berlin gilt das VwVG des Bundes über § 8 Abs. 1 S. 1 VwVfG Bln."},
  {"id":"k-lb23-74","cat":"Laufbahn · Recht","q":"Welche Zwangsmittel kennt das VwVG, und wann wird welches eingesetzt?","a":"<strong>Ersatzvornahme</strong> bei vertretbaren Handlungen auf Kosten des Pflichtigen (§ 10); <strong>Zwangsgeld</strong> bei unvertretbaren Handlungen, Duldung, Unterlassung, Beugemittel (§ 11); <strong>unmittelbarer Zwang</strong> nur, wenn die anderen Mittel nicht zum Ziel führen (§ 12, § 2 UZwG Bln)."},
  {"id":"k-lb23-75","cat":"Laufbahn · Recht","q":"Wie läuft das gestreckte Vollstreckungsverfahren ab?","a":"<strong>Androhung</strong> (§ 13 VwVG, mit Frist, VA) → <strong>Festsetzung</strong> (§ 14, VA) → <strong>Anwendung</strong> (§ 15, Realakt)."},
  {"id":"k-lb23-76","cat":"Laufbahn · Recht","q":"Wie wird bei Gefahr abgekürzt vollstreckt?","a":"<strong>Sofortiger Vollzug</strong> (§ 6 Abs. 2 VwVG) bzw. <strong>unmittelbare Ausführung</strong> (§ 15 ASOG Bln), wenn der Zweck durch den Verantwortlichen nicht rechtzeitig erreicht werden kann; Androhung und Festsetzung entfallen. Bei Widerstand Vollzugshilfe durch die Polizei (§§ 52 ff. ASOG)."},
  {"id":"k-lb23-77","cat":"Laufbahn · Recht","q":"Ist eine rückwirkende Ernennung eines Beamten möglich, und wo steht das?","a":"Nein: Sie ist unzulässig und <strong>insoweit unwirksam</strong> (§ 8 Abs. 4 BeamtStG). Die Ernennung wirkt frühestens ab <strong>Aushändigung der Urkunde</strong>. Für Bundesbeamte regelt § 10 BBG die Ernennung."},
  {"id":"k-lb23-78","cat":"Laufbahn · Recht","q":"Wie wird eine Ernennung nach BeamtStG geprüft?","a":"(a) Ernennung nach § 8 Abs. 1 (Begründung, Umwandlung, anderes Amt)? (b) Form: <strong>Ernennungsurkunde</strong> mit Zusätzen (§ 8 Abs. 2). (c) Wirksamkeit ab Aushändigung (§ 8 Abs. 4). (d) Zuständige Behörde?"},
  {"id":"k-lb23-79","cat":"Laufbahn · Recht","q":"Wann ist eine Ernennung nichtig, wann wird sie zurückgenommen?","a":"<strong>Nichtigkeit</strong> bei sachlicher Unzuständigkeit oder Formmangel (§ 11 Abs. 1 BeamtStG, Heilung nach Abs. 2). <strong>Rücknahme</strong> bei Täuschung, Zwang usw. (§ 12 BeamtStG). Berliner LBG: Nichtigkeit § 14, Rücknahme § 15."},
  {"id":"k-lb23-80","cat":"Laufbahn · Recht","q":"Warum ist die Ernennung rückwirkend ausgeschlossen, und was folgt im Fall?","a":"Das Beamtenverhältnis ist ein <strong>formgebundenes Statusverhältnis</strong>; Rechtssicherheit verlangt einen eindeutigen Beginn (Schutz vor Manipulation von Besoldung und Versorgung). Die Ernennung gilt ab Aushändigung; bei verzögerter Ernennung ggf. Amtshaftung."},
  {"id":"k-lb23-81","cat":"Laufbahn · Recht","q":"Welche Pflichten regeln §§ 33 und 34 BeamtStG?","a":"§ 33 Abs. 1: Dienst am ganzen Volk, <strong>unparteiische Amtsführung</strong>, Verfassungstreue; Abs. 2: Mäßigung bei politischer Betätigung. § 34: voller persönlicher Einsatz, uneigennützige Aufgabenwahrnehmung, achtungs- und vertrauenswürdiges Verhalten (auch außerdienstlich)."},
  {"id":"k-lb23-82","cat":"Laufbahn · Recht","q":"Welche Pflichten regeln §§ 35 bis 42 BeamtStG?","a":"§ 35: Beratungs-, Unterstützungs- und <strong>Folgepflicht</strong>. § 36: Verantwortung für die Rechtmäßigkeit, Remonstration auf dem Dienstweg. § 37 Verschwiegenheit, § 38 Diensteid, § 40 Nebentätigkeit, § 42 <strong>Verbot der Annahme von Belohnungen und Geschenken</strong>."},
  {"id":"k-lb23-83","cat":"Laufbahn · Recht","q":"Wie wird ein Dienstvergehen nach § 47 BeamtStG geprüft (Schema)?","a":"① Beamtenverhältnis zum Tatzeitpunkt, ② Dienstpflicht und <strong>objektive Pflichtverletzung</strong>, ③ Rechtswidrigkeit, ④ <strong>Verschulden</strong> (Vorsatz oder Fahrlässigkeit, leichte Fahrlässigkeit genügt), ⑤ sonstige Hindernisse (Maßnahmeverbot, Doppelahndung)."},
  {"id":"k-lb23-84","cat":"Laufbahn · Recht","q":"Wann ist ein Verhalten außerhalb des Dienstes ein Dienstvergehen?","a":"Nur, wenn es nach den Umständen in besonderem Maße geeignet ist, das <strong>Vertrauen in einer für das Amt bedeutsamen Weise</strong> zu beeinträchtigen (§ 47 Abs. 1 S. 2 BeamtStG)."},
  {"id":"k-lb23-85","cat":"Laufbahn · Recht","q":"Welche Maßnahmeverbote durch Zeitablauf gelten in Berlin, und was sperrt die Ahndung noch?","a":"Verweis nach <strong>2 Jahren</strong>, Geldbuße und Kürzung nach <strong>3 Jahren</strong>, Zurückstufung nach <strong>7 Jahren</strong>. Sperrwirkung bei bereits unanfechtbarer Strafe oder Geldbuße (Doppelahndungsverbot)."},
  {"id":"k-lb23-86","cat":"Laufbahn · Recht","q":"Welche Disziplinarmaßnahmen kennt das Berliner DiszG, und wie werden sie verhängt?","a":"<strong>Verweis, Geldbuße, Kürzung der Dienstbezüge</strong> (höchstens ein Fünftel, bis zu drei Jahre), <strong>Zurückstufung, Entfernung</strong> aus dem Beamtenverhältnis. Leichte und mittlere Fälle per Disziplinarverfügung (§ 33), schwere nur per Disziplinarklage beim Verwaltungsgericht."},
  {"id":"k-lb23-87","cat":"Laufbahn · Recht","q":"Wann wird ein Disziplinarverfahren eingeleitet, und welche Haftung kommt hinzu?","a":"Von Amts wegen bei <strong>zureichenden tatsächlichen Anhaltspunkten</strong> (Einleitung, Anhörung, Ermittlungen). Bemessung nach Schwere, Persönlichkeitsbild und Vertrauensbeeinträchtigung. Schadensersatz bei Vorsatz/grober Fahrlässigkeit: § 48 BeamtStG."},
  {"id":"k-lb23-88","cat":"Laufbahn · Recht","q":"Darf die Feuerwehr den Keller eines Gewerbes öffnen? Welche Befugnis und welches Grundrecht?","a":"Ja, bei <strong>konkreter Gefahr</strong> (Rauch, Wasser, Gasgeruch, Person in Not). Befugnis: § 14 Abs. 1 FwG Bln (Betreten, Zutritt auch gegen den Willen des Berechtigten); Art. 13 Abs. 7 GG; ergänzend § 36 Abs. 1 Nr. 3 ASOG. Geschäftsräume gelten als „Wohnung“ (§ 36 Abs. 1 S. 2 ASOG)."},
  {"id":"k-lb23-89","cat":"Laufbahn · Recht","q":"Welche Rolle spielen Adressat und Verhältnismäßigkeit beim Öffnen des Gewerbekellers?","a":"Adressat: Verantwortlicher als Verhaltens-/Zustandsstörer (§§ 13, 14 ASOG), sonst Nichtstörer nach § 16 ASOG; bei Nichterreichbarkeit unmittelbare Ausführung (§ 15 ASOG). Erforderlich: zuerst Schlüsselinhaber, Hausmeister, Schlüsseldienst; <strong>zerstörungsarmes Öffnen vor Aufbrechen</strong>. Bei Lebensgefahr Ermessensreduzierung auf Null."},
  {"id":"k-lb23-90","cat":"Laufbahn · Recht","q":"Darf der Keller des Mieters betreten werden, und wer ist Berechtigter?","a":"Der Keller ist Nebenraum der Wohnung, Berechtigter ist der <strong>Mieter</strong> (Besitzer), nicht der Vermieter; dieser kann den Zutritt nicht wirksam gestatten. Zulässig bei konkreter Gefahr, die das Betreten genau dieses Kellers erfordert (Art. 13 Abs. 7 GG, § 14 FwG)."},
  {"id":"k-lb23-91","cat":"Laufbahn · Recht","q":"Welche Grenzen gelten beim Betreten des Mieterkellers?","a":"Nur im <strong>erforderlichen Umfang und Zeit</strong> (keine Nachschau ohne Anlass, keine Durchsuchung), schonendes Vorgehen, Mieter benachrichtigen und möglichst zuziehen. Bei Widerstand Polizei (Vollzugshilfe, §§ 52 ff. ASOG)."},
  {"id":"k-lb23-92","cat":"Laufbahn · Recht","q":"Was ist beim Verlassen der Einsatzstelle zu beachten (Einsatzende, Sicherung, Übergabe)?","a":"Einsatzende erst nach Beseitigung der Gefahr (Nachkontrolle, Restgefahren, Brandwache). <strong>Sichern</strong> geöffneter/beschädigter Zugänge (Notverschluss), Absperrung. <strong>Übergabe nur an Berechtigte</strong>; sonst Polizei/Ordnungsamt informieren; Übergabe dokumentieren."},
  {"id":"k-lb23-93","cat":"Laufbahn · Recht","q":"Was gilt beim Verlassen der Einsatzstelle zu Hinweisen, Entschädigung und Dokumentation?","a":"Betroffene über Zustand, Restgefahren und Nutzungsverbot unterrichten, Eigentümer/Besitzer benachrichtigen. Entschädigung nach <strong>§ 15 FwG i. V. m. §§ 59 bis 65a ASOG</strong>, Amtshaftung § 839 BGB i. V. m. Art. 34 GG; Kostenersatz nur nach § 17 FwG. Einsatzbericht, Fotos, Schäden festhalten."},
  {"id":"k-lb23-94","cat":"Laufbahn · Management","q":"Welche Ziele umfasst das Magische Sechseck der Volkswirtschaft?","a":"<strong>Preisniveaustabilität</strong>, hoher Beschäftigungsstand, außenwirtschaftliches Gleichgewicht, stetiges und angemessenes Wirtschaftswachstum, Umweltschutz/Nachhaltigkeit, gerechte Einkommens- und Vermögensverteilung."},
  {"id":"k-lb23-95","cat":"Laufbahn · Management","q":"Welches Gesetz bildet die Grundlage des Magischen Vierecks, und was ergänzt das Sechseck?","a":"<strong>Stabilitäts- und Wachstumsgesetz (StWG, 1967), § 1</strong>: Erfordernisse des gesamtwirtschaftlichen Gleichgewichts (magisches Viereck). Das Sechseck ergänzt <strong>Umwelt</strong> und <strong>gerechte Verteilung</strong>."},
  {"id":"k-lb23-96","cat":"Laufbahn · Management","q":"Warum ist das Sechseck „magisch“?","a":"Alle Ziele sollen gleichzeitig und dauerhaft erreicht werden, was wegen <strong>Zielkonflikten</strong> (Zielantinomie) praktisch nie gelingt. Die Politik muss gewichten und priorisieren."},
  {"id":"k-lb23-97","cat":"Laufbahn · Management","q":"Nenne Beispiele für Zielkonflikte im Magischen Sechseck.","a":"<strong>Beschäftigung vs. Preisstabilität</strong> (Phillips-Kurve), Wachstum vs. Umweltschutz, Wachstum/Importe vs. außenwirtschaftliches Gleichgewicht, Verteilungsgerechtigkeit vs. Leistungsanreize."},
  {"id":"k-lb23-98","cat":"Laufbahn · Management","q":"Was ist das BIP, und was spricht für seine Verwendung als Maßstab?","a":"Marktwert aller im Inland in einem Zeitraum hergestellten, für die Endverwendung bestimmten Güter und Dienstleistungen. Pro: <strong>international vergleichbar</strong>, regelmäßig und standardisiert erhoben (VGR), gut für Zeitreihen und Konjunkturanalyse."},
  {"id":"k-lb23-99","cat":"Laufbahn · Management","q":"Warum ist das BIP kein perfekter Maßstab (Verteilung, unbezahlte Arbeit, Umwelt)?","a":"Es sagt nichts über <strong>Verteilung/Ungleichheit</strong>; <strong>unbezahlte Arbeit</strong> (Ehrenamt wie Freiwillige Feuerwehr, Hausarbeit, Pflege) und Schwarzarbeit fehlen; Umweltschäden und Ressourcenverbrauch werden nicht abgezogen."},
  {"id":"k-lb23-100","cat":"Laufbahn · Management","q":"Warum ist das BIP kein perfekter Maßstab (Lebensqualität, Schadensbeseitigung, Staatsleistungen)?","a":"Lebensqualität (Gesundheit, Sicherheitsgefühl, Bildung) wird nicht erfasst. <strong>Schadensbeseitigung erhöht das BIP</strong> (Unfälle, Katastrophen, Einsätze), vermiedene Schäden durch Prävention bleiben unsichtbar. Staatsleistungen werden nur zu Kosten bewertet."},
  {"id":"k-lb23-101","cat":"Laufbahn · Management","q":"Welche Maße ergänzen das BIP?","a":"Fazit: Das BIP misst <strong>Wirtschaftsleistung, nicht Wohlstand</strong>. Ergänzend: HDI (Bildung, Lebenserwartung, Einkommen), Genuine Progress Indicator, OECD Better Life Index."},
  {"id":"k-lb23-102","cat":"Laufbahn · Management","q":"Können Überstunden (Mehrarbeit) bei Beamten ausbezahlt werden?","a":"Nur <strong>ausnahmsweise</strong>, wenn Dienstbefreiung aus zwingenden dienstlichen Gründen nicht möglich ist, und im Rahmen der Mehrarbeitsvergütungsverordnung. Vorrang hat der <strong>Freizeitausgleich</strong> (vgl. § 88 BBG: innerhalb eines Jahres bei Mehrarbeit über 5 Stunden im Monat)."},
  {"id":"k-lb23-103","cat":"Laufbahn · Management","q":"Unter welchen Voraussetzungen darf Mehrarbeit angeordnet werden?","a":"Nur bei <strong>zwingenden dienstlichen Verhältnissen</strong> und für temporäre Ereignisse (Krankheitswelle, Großschadenslage, Großveranstaltung), keine Dauerlösung für Personalmangel. Der Abbau muss innerhalb von höchstens 2 Jahren realistisch möglich sein, sonst Organisationsverschulden."},
  {"id":"k-lb23-104","cat":"Laufbahn · Management","q":"Welche Höchstarbeitszeit-Grenzen gelten nach EU-Arbeitszeitrichtlinie 2003/88/EG?","a":"Im Durchschnitt max. <strong>48 Std./Woche</strong> (Bezugszeitraum bis 12 Monate, inkl. Bereitschaft und Überstunden), tägliche Ruhezeit mind. <strong>11 Std.</strong>, wöchentlich mind. 24 Std., Ruhepause nach 6 Std. Überschreitung nur mit individuellem Opt-out."},
  {"id":"k-lb23-105","cat":"Laufbahn · Management","q":"Darf eine Auszahlung die Höchstarbeitszeit legitimieren?","a":"Nein. Bei Überschreitung der 48-Std.-Grenze besteht Anspruch auf <strong>Ausgleich in Freizeit</strong>; Auszahlung löst die Überschreitung nicht. Für Tarifbeschäftigte gelten TVöD-Regelungen (Vergütung bzw. Zeitausgleich)."},
  {"id":"k-lb23-106","cat":"Laufbahn · Management","q":"Welche Ausfallgründe fließen in den Personalausfallfaktor ein?","a":"Urlaub/Sonderurlaub, <strong>Krankheit</strong>, Aus- und Fortbildung, Verwendung außerhalb des Einsatzdienstes, Mutterschutz/Elternzeit und sonstige Gründe. Jede Ausfallstunde erhöht den Personalfaktor."},
  {"id":"k-lb23-107","cat":"Laufbahn · Management","q":"Welche Größen gehören nicht in den Personalfaktor: Krankheit, Einsatzzeiten, Stellenbesetzungsgrad, Fahrzeugausfall oder Besoldung?","a":"Krankheit gehört hinein (Ausfallgrund, erhöht den Personalfaktor). <strong>Nicht</strong> hinein gehören <strong>Einsatzzeiten</strong> (Arbeitsleistung, keine Ausfallzeit), Stellenzahl/Stellenbesetzungsgrad (das ist der Stellenfaktor), Fahrzeug-/Geräteausfall, Einsatzaufkommen, Gehalt/Besoldung. Feiertage werden bei durchgehendem Schichtdienst nicht gesondert abgezogen."},
  {"id":"k-lb23-108","cat":"Laufbahn · Management","q":"Wie wird der Ist-Personalfaktor berechnet (Rechenweg und Beispiel)?","a":"Theoretische Jahresarbeitszeit minus alle Ausfallstunden = Arbeitsleistung je Mitarbeitenden; <strong>Ist-Personalfaktor = 8.760 h ÷ Arbeitsleistung</strong>. Beispiel Frankfurt 2023: 8.760 ÷ 1.412 = 6,20."},
  {"id":"k-lb23-109","cat":"Laufbahn · Management","q":"Kann ein Personaldefizit durch längere Schichten ausgeglichen werden?","a":"Im Ergebnis <strong>nein</strong>. Längere Schichten verteilen dieselben Stunden nur anders und schaffen keine zusätzlichen Arbeitsstunden; das Stundendefizit bleibt, solange die Wochenarbeitszeit nicht steigt."},
  {"id":"k-lb23-110","cat":"Laufbahn · Management","q":"Welche rechtlichen und arbeitsschutzrechtlichen Grenzen stehen längeren Schichten entgegen?","a":"Durchschnittlich <strong>48 h/Woche</strong>, Ruhezeit mind. 11 h, Ruhepause nach 6 h, Nachtarbeit max. 8 h/24 h. Bereitschaftszeit nur bei Inanspruchnahme unter 50 %. Höheres Unfallrisiko; Personalrat/Mitbestimmung nötig."},
  {"id":"k-lb23-111","cat":"Laufbahn · Management","q":"Welche Kompensationen für ein Personaldefizit sind denkbar (Stellen, Mehrarbeit, Verfügerdienst)?","a":"Zusätzliche <strong>Stellen</strong> schaffen (Personalfaktor als Argument), Recruiting und Ausbildung ausbauen; <strong>Mehrarbeit</strong> nur temporär; Verfügerdienste/Rufbereitschaften und Transferleistungen (Wachpraktikanten, Tagdienstkräfte)."},
  {"id":"k-lb23-112","cat":"Laufbahn · Management","q":"Welche weiteren Kompensationen kommen bei Personaldefiziten in Betracht?","a":"<strong>Ausfallzeiten senken</strong> (Gesundheitsmanagement, Fortbildung planen), Funktionssoll reduzieren nur nach politischem Beschluss (Risikoentscheidung), Aufgaben priorisieren/auslagern, Unterstützung durch Nachbarwehren oder Freiwillige Feuerwehr."},
  {"id":"k-lb23-113","cat":"Laufbahn · Management","q":"Stimmt das? Der Personalfaktor kann nur für rund um die Uhr besetzte Funktionen berechnet werden.","a":"<strong>Falsch.</strong> Der Personalfaktor gilt je Funktion für einen definierten Zeitraum; 24/7 (365 × 24 = 8.760 h) ist der Regelfall im Einsatzdienst, aber keine Voraussetzung. Bei anderer Besetzungszeit (z. B. Tagdienst) wird die jeweilige Jahresbesetztzeit zugrunde gelegt."},
  {"id":"k-lb23-114","cat":"Laufbahn · Management","q":"Wie wird der Personalfaktor bei Bereitschaftsdisponenten der Leitstelle berechnet?","a":"Dispositionstische (rund um die Uhr) mit Standardberechnung; <strong>Bereitschaftsdisponenten</strong> über Tisch- und Bereitschaftszeiten einer Woche, umgerechnet auf 24-h-Funktionen. Funktionsgruppen mit unterschiedlichen Einflussfaktoren getrennt berechnen."},
  {"id":"k-lb23-115","cat":"Laufbahn · Management","q":"Wie heißen die 4 Phasen des Regelkreises im Qualitätsmanagement?","a":"<strong>PDCA-Zyklus</strong> (Deming-Kreis): <strong>Plan</strong> (planen), <strong>Do</strong> (umsetzen), <strong>Check</strong> (überprüfen), <strong>Act</strong> (standardisieren, verbessern). Kontinuierlicher Verbesserungsprozess."},
  {"id":"k-lb23-116","cat":"Laufbahn · Management","q":"Was geschieht in den einzelnen PDCA-Phasen?","a":"Plan: Problem analysieren, Ziele setzen. Do: Lösung umsetzen, zunächst im Pilotmaßstab. Check: <strong>Soll-Ist-Vergleich</strong>, Kennzahlen. Act: erfolgreiche Lösung standardisieren, sonst neuer Zyklus. Beispiel: Einsatznachbereitung, Fortschreibung des Brandschutzbedarfsplans."},
  {"id":"k-lb23-117","cat":"Laufbahn · Management","q":"Nenne 6 Kennzahlen zur Steuerung einer Abteilung.","a":"<strong>Hilfsfristerreichungsgrad</strong>, Ausrückezeit, Kosten je Einsatz, Krankenquote bzw. Ist-Personalfaktor, Budgetstand (Plan-Ist-Vergleich), Abarbeitungsgrad der BEP-Maßnahmen."},
  {"id":"k-lb23-118","cat":"Laufbahn · Management","q":"Welche weiteren Kennzahlen eignen sich, und was gilt für Verhältniskennzahlen?","a":"Fahrzeugverfügbarkeitsquote, Quote unbesetzter Stellen, Bearbeitungszeit von Stellungnahmen, Anteil rechtzeitig angenommener Notrufe, Überstundenstand. <strong>Verhältniskennzahlen</strong> eignen sich besser für Benchmarking; eine Zeitreihe ist das beste Argument in der Ressourcenverteilung."},
  {"id":"k-lb23-119","cat":"Laufbahn · Management","q":"Nenne 4 Ziele des Qualitätsmanagements.","a":"① <strong>Erwartungen der Stakeholder</strong> erfüllen, ② Leistungsqualität sichern und kontinuierlich verbessern, ③ <strong>Wirtschaftlichkeit und Effizienz</strong>, ④ Transparenz, Prozess- und Rechtssicherheit (Prozesse beschreiben, Leistung messbar machen). Ergänzend: Mitarbeiterzufriedenheit."},
  {"id":"k-lb23-120","cat":"Laufbahn · Management","q":"Welche unterschiedlichen Interessen bestehen bei der Bedarfsplanung?","a":"Feuerwehr: <strong>hohes Schutzniveau</strong>, Personal, Fahrzeuge. Politik/Kämmerei: <strong>Kosten</strong>, Haushaltslage, Pflichtaufgabe. Bürger und Wirtschaft: schnelle Hilfe bei niedrigen Gebühren. Personalvertretung: Arbeitszeit, Gesundheitsschutz; Aufsichtsbehörde: Gesetzmäßigkeit."},
  {"id":"k-lb23-121","cat":"Laufbahn · Management","q":"Wie wird der Zielkonflikt Sicherheit versus Kosten in der Bedarfsplanung ausgeglichen?","a":"Über <strong>politisch legitimierte Schutzziele</strong> und Stakeholder-Management. Im Rettungsdienst treten Krankenkassen als Kostenträger mit dem Wirtschaftlichkeitsgebot hinzu."},
  {"id":"k-lb23-122","cat":"Laufbahn · Management","q":"Welche Themenfelder und Leitfragen hat die Bedarfsplanung (Schutzziele, Risiko, IST-SOLL)?","a":"① <strong>Schutzziele</strong> (z. B. AGBF: 10 Funktionen in 8 min, 6 weitere nach 5 min, 90 %), ② Gefährdungs- und Risikoanalyse mit Szenarien, ③ <strong>IST-Analyse und SOLL-IST-Vergleich</strong>."},
  {"id":"k-lb23-123","cat":"Laufbahn · Management","q":"Welche weiteren Themenfelder gehören zur Bedarfsplanung (Organisation bis Fortschreibung)?","a":"④ Organisation, Standorte, Fahrzeuge, Personal, Ausbildung, Leitstelle; ⑤ <strong>Maßnahmenplan und Finanzierung</strong> mit Priorisierung; ⑥ Umsetzung, Controlling, <strong>Fortschreibung ca. alle 5 Jahre</strong> (Kennzahl: BEP-Maßnahmen in %)."},
  {"id":"k-lb23-124","cat":"Laufbahn · Management","q":"Wie läuft die Feuerwehrbedarfsplanung (BEP) ab, und wer ist Träger?","a":"Träger ist die <strong>Gemeinde</strong> (Brandschutzgesetze der Länder), Beschluss durch den Rat. Ablauf: Schutzziel → IST-Analyse → SOLL-IST-Vergleich → Maßnahmenplan; Fortschreibung ca. alle 5 Jahre. Quantitative Methodik, Finanzierung aus dem kommunalen Haushalt."},
  {"id":"k-lb23-125","cat":"Laufbahn · Management","q":"Wie unterscheidet sich die Rettungsdienstbedarfsplanung (Rechtsgrundlage, Akteure, Finanzierung)?","a":"Landesrettungsdienstgesetze und SGB V (<strong>Wirtschaftlichkeitsgebot § 12</strong>); Aufgabenträger Kreis/kreisfreie Stadt. Verhandlung mit den Kostenträgern (Krankenkassen), Schiedsstelle bei Nichteinigung; Finanzierung über <strong>Entgelte der Kassen</strong>."},
  {"id":"k-lb23-126","cat":"Laufbahn · Management","q":"Welche Planungsgrößen gelten in der Rettungsdienstbedarfsplanung?","a":"Hilfsfrist <strong>10 bis 15 min</strong>, Erreichungsgrad 90 bis 95 %. RTW risikoabhängig (Erlang-B, Blockierungswahrscheinlichkeit 1 bis 5 %), <strong>KTW frequenzabhängig</strong> (Auslastung max. 75 %), NEF risikoabhängig. Quantitative Methodik."},
  {"id":"k-lb23-127","cat":"Laufbahn · Management","q":"Wie unterscheidet sich die Katastrophenschutzbedarfsplanung (Methodik und Zuständigkeit)?","a":"<strong>Qualitative Methodik</strong>: sehr seltene Ereignisse, keine statistisch belastbare Häufigkeit; Szenarien statt Einsatzstatistik. Zuständig: untere KatS-Behörde (Landkreis/kreisfreie Stadt), Land und Bund. Überörtliche Zusammenarbeit."},
  {"id":"k-lb23-128","cat":"Laufbahn · Management","q":"Wie läuft die KatS-Bedarfsplanung ab, und was kennzeichnet ihre Einheiten?","a":"<strong>5 Phasen</strong>: Brainstorming → Szenarienauswahl (ca. 5, Risikomatrix, Delphi) → Folgenbetrachtung → Planungsziele → Maßnahmenableitung. Großzügigere Eintreffzeiten, modulare multifunktionale Einheiten, Dual-Use, Wechselladerkonzepte, Querschnittsfunktionen."},
  {"id":"k-lb23-129","cat":"Laufbahn · Management","q":"Welche Gemeinsamkeiten haben Feuerwehr-, Rettungsdienst- und KatS-Bedarfsplanung?","a":"<strong>Strukturqualität</strong> als Ausgangspunkt, IST-Analyse, Risiko-/Szenariobetrachtung, GIS-gestützte Standortplanung, Maßnahmenplan mit Priorisierung und Abstimmung mit dem Haushalt."},
  {"id":"k-lb23-130","cat":"Laufbahn · Heyrothsberge","q":"Anhand welcher vier Prüfschritte wird ein vorgelegtes Feedback analysiert?","a":"<strong>Form</strong> (Ich- oder Du-Botschaft?), <strong>Inhalt</strong> (konkrete Beobachtung oder pauschale Bewertung?), <strong>Struktur</strong> (Positives und Entwicklungsfeld, Feedback-Burger, Änderungswunsch?), <strong>Situation</strong> (zeitnah, unter vier Augen, Rahmen passend?)."},
  {"id":"k-lb23-131","cat":"Laufbahn · Heyrothsberge","q":"Welche typischen Schwächen hat ein schlechtes Feedback?","a":"Pauschal, wertend statt beschreibend, <strong>Person statt Verhalten</strong> kritisiert, Vorwürfe („immer“, „nie“), Rechtfertigungszwang, keine Lösung, zu spät, vor Dritten, Sandwich nur als Floskel."},
  {"id":"k-lb23-132","cat":"Laufbahn · Heyrothsberge","q":"Wie gibt man ein besseres Feedback (Regeln für den Feedback-Geber)?","a":"<strong>Ich-Botschaft</strong>, sachlich, kurz, konstruktiv (Feedback-Burger), neutral und authentisch. Beobachten statt bewerten, Verhalten statt Person, Verallgemeinerungen vermeiden, zeitnah; Kritik unter vier Augen, öffentlich nur Lob."},
  {"id":"k-lb23-133","cat":"Laufbahn · Heyrothsberge","q":"Welche drei Schritte hat ein gutes Feedback, und wie verhält sich der Feedback-Nehmer?","a":"① <strong>Beobachtung</strong> („Ich habe beobachtet, dass …“), ② <strong>Wirkung</strong> („Das wirkt auf mich …“), ③ <strong>Wunsch</strong> („Ich wünsche mir künftig …“). Nehmer: ruhig zuhören, annehmen, nicht rechtfertigen, Sach- und Menschenebene trennen, bedanken."},
  {"id":"k-lb23-134","cat":"Laufbahn · Heyrothsberge","q":"Woran erkennt man die fünf Ich-Zustände in einer Äußerung?","a":"<strong>kEL</strong> Vorwurf, Befehl, „immer/nie“; <strong>fEL</strong> „Ich helfe dir“, „lass mal, ich mache das“; <strong>ER</strong> sachlich, Fakten, Fragen; <strong>nK</strong> spontan, Gefühle, Wünsche; <strong>aK</strong> fügsam, Rechtfertigung, trotzig-rebellisch."},
  {"id":"k-lb23-135","cat":"Laufbahn · Heyrothsberge","q":"Wie ordnet man Ich-Zustände einem Gespräch zu (Vorgehen mit Beispiel)?","a":"Je Satz fragen: <strong>Wer spricht, und wen spricht er an?</strong> Beispiel: „Schon wieder ist der Bericht zu spät!“ = kEL; „Ich konnte nichts dafür …“ = aK; „Wann können Sie ihn liefern?“ = ER."},
  {"id":"k-lb23-136","cat":"Laufbahn · Heyrothsberge","q":"Was zeigt die Auswertung kEL → aK im Vergleich zu ER ↔ ER?","a":"kEL → aK ist komplementär, birgt aber <strong>Eskalationsgefahr</strong>; ER ↔ ER ist das Ziel. Eine bewusst gekreuzte Transaktion (Wechsel ins ER) kann die kEL-aK-Schleife durchbrechen."},
  {"id":"k-lb23-137","cat":"Laufbahn · Heyrothsberge","q":"Wie füllt man das Drama-Dreieck (Karpman) aus: Rollen und Merkmale?","a":"<strong>Verfolger</strong>: kritisiert, wertet ab („Ich bin OK – Du nicht“). <strong>Opfer</strong>: hilflos, verweigert Eigenverantwortung, sucht Retter. <strong>Retter</strong>: hilft ungefragt, hält das Opfer abhängig. Rollenwechsel jederzeit möglich."},
  {"id":"k-lb23-138","cat":"Laufbahn · Heyrothsberge","q":"Wie ordnet man das Drama-Dreieck dem Beispiel zu, und wie steigt man aus?","a":"Beispiel: Chef = <strong>Verfolger</strong>, Mitarbeiter = <strong>Opfer</strong>, Kollege = <strong>Retter</strong>. Ausstieg: aus dem Erwachsenen-Ich handeln, Eigenverantwortung zurückgeben, Hilfe nur auf Bitte, Verantwortung klären."},
  {"id":"k-lb23-139","cat":"Laufbahn · Heyrothsberge","q":"Was ist Game-based Learning, und wie grenzt es sich von Gamification ab?","a":"Lernen mit Spielen (digital oder analog), bei dem das <strong>Spiel selbst das Lernmedium</strong> ist. Gamification dagegen nutzt Spielelemente (Punkte, Ranglisten) in Nicht-Spiel-Kontexten."},
  {"id":"k-lb23-140","cat":"Laufbahn · Heyrothsberge","q":"Welche Vorteile hat Game-based Learning?","a":"Hohe <strong>Motivation</strong> und Aktivierung, Handlungsorientierung (Fehler erlaubt), sofortiges Feedback und Erfolgserlebnisse, Teamarbeit und Entscheidungen unter Zeitdruck, nachhaltigeres Behalten, selbstgesteuertes Lernen."},
  {"id":"k-lb23-141","cat":"Laufbahn · Heyrothsberge","q":"Nenne Beispiele und Grenzen von Game-based Learning.","a":"Beispiele: Quizspiele (Kahoot), <strong>Planspiele und Stabsübungen</strong>, Serious Games/VR-Simulatoren, Escape-Room für Brandschutz oder Erste Hilfe. Grenzen: Vorbereitungsaufwand, Wettbewerb kann demotivieren, klares Lernziel und Debriefing nötig."},
  {"id":"k-lb23-142","cat":"Laufbahn · Heyrothsberge","q":"Mitarbeitende diskreditieren den neuen Abteilungsleiter: Welche Konfliktarten nach Beteiligten liegen vor?","a":"Hauptart: <strong>Personen-Gruppen-Konflikt</strong> (Leiter gegen Mitarbeitergruppe). Möglich zudem Intra-Gruppen-Konflikt (Befürworter und Gegner), interpersonale Konflikte mit Wortführern und intrapersonaler Konflikt beim Leiter."},
  {"id":"k-lb23-143","cat":"Laufbahn · Heyrothsberge","q":"Welche Konfliktursachen liegen beim diskreditierten Abteilungsleiter vor?","a":"Vorrangig <strong>Beziehungskonflikt</strong> (Verletzung des Selbstwerts), dazu Bewertungskonflikt (Werte, Führungsstil) und evtl. Beurteilungskonflikt (Informationsstand zur Auswahlentscheidung, interner Mitbewerber)."},
  {"id":"k-lb23-144","cat":"Laufbahn · Heyrothsberge","q":"Welcher Konflikttyp und welche Eskalationsstufe nach Glasl liegt beim Diskreditieren vor?","a":"Diskreditieren hinter dem Rücken ist ein <strong>kalter (verdeckter) Konflikt</strong>; offener Widerstand macht ihn heiß, wahrscheinlich Übergang kalt → heiß. Etwa <strong>Glasl-Stufe 3 bis 5</strong>; ab Stufe 4 externe Moderation."},
  {"id":"k-lb23-145","cat":"Laufbahn · Heyrothsberge","q":"Wie sieht der Lösungsansatz bei diesem Konflikt aus (Schritte 1 bis 3)?","a":"① Konflikt erkennen und <strong>früh handeln</strong>, ② Analyse (Ursachen, Wortführer, Eskalationsstufe), ③ Einzelgespräche mit aktivem Zuhören, Ich-Botschaften und Erwachsenen-Ich, Sach- und Beziehungsebene trennen."},
  {"id":"k-lb23-146","cat":"Laufbahn · Heyrothsberge","q":"Wie sieht der Lösungsansatz bei diesem Konflikt aus (Schritte 4 und 5)?","a":"④ Klärendes <strong>Gruppengespräch mit Moderation</strong> (Personalrat, Personalentwicklung, ggf. Mediator), Win-win-Ziel. ⑤ Vereinbarungen schriftlich, Nachverfolgung; bei fortgesetzter Diskreditierung <strong>B4-Regel</strong> (Beobachten – Belehren – Beobachten – Bestrafen)."},
  {"id":"k-lb23-147","cat":"Laufbahn · Heyrothsberge","q":"Variante A der perspektivischen Lösungen: Beziehungsarbeit und Teamentwicklung?","a":"Kooperativ, langfristig: Antrittsgespräche mit jedem, <strong>Teamklausur/Workshop</strong>, Quick Wins, Coaching für den Leiter, Feedback. Chance: nachhaltiger Vertrauensaufbau; Risiko: braucht Zeit."},
  {"id":"k-lb23-148","cat":"Laufbahn · Heyrothsberge","q":"Variante B der perspektivischen Lösungen: strukturierte Konfliktklärung mit Dritten?","a":"<strong>Externe Moderation/Mediation</strong>, klare Verhaltensregeln, Zielvereinbarung; bei Fortsetzung Konsequenzen (Ermahnung, Umsetzung). Chance: schnelle Befriedung; Risiko: Akzeptanz, Gesichtsverlust, Aufwand. Prävention: strukturierte Einarbeitung, Vorgesetzter stärkt den Neuen."},
  {"id":"k-lb23-149","cat":"Laufbahn · Heyrothsberge","q":"Welche Transaktionstypen unterscheidet die Transaktionsanalyse, und welches Konfliktpotenzial hat ER ↔ ER?","a":"<strong>Komplementär, gekreuzt, verdeckt</strong> (Berne). Komplementär ER ↔ ER (Einsatzleiter fragt, Gruppenführer antwortet sachlich): Konfliktpotenzial <strong>gering</strong>, Kommunikation läuft unbegrenzt weiter."},
  {"id":"k-lb23-150","cat":"Laufbahn · Heyrothsberge","q":"Welches Konfliktpotenzial hat die komplementäre Transaktion kEL → aK?","a":"Reibungslos, aber <strong>mittel/latent</strong>: Abhängigkeit, Unterwürfigkeit, Frust, Rebellion, Eskalationsschleife; Drama-Dreieck Verfolger–Opfer. Beispiel: „Das haben Sie wieder falsch gemacht!“ – „Entschuldigung, kommt nicht wieder vor.“"},
  {"id":"k-lb23-151","cat":"Laufbahn · Heyrothsberge","q":"Welches Konfliktpotenzial hat eine gekreuzte Transaktion?","a":"<strong>Hoch</strong>: Die Antwort kommt aus unerwartetem Zustand, Kommunikationsabbruch und Streit drohen. Bewusst eingesetzt kann sie eine kEL → aK-Schleife durchbrechen."},
  {"id":"k-lb23-152","cat":"Laufbahn · Heyrothsberge","q":"Welches Konfliktpotenzial hat eine verdeckte Transaktion, und was ist das Ziel?","a":"<strong>Hoch</strong> durch Manipulation, Psychospiele, Missverständnisse (sozial ER, psychologisch kEL). Ziel: aus dem ER führen, Grundposition <strong>„Ich bin OK – Du bist OK“</strong>."},
  {"id":"k-lb23-153","cat":"Laufbahn · Heyrothsberge","q":"Welche fünf Antreiber nennt Taibi Kahler, und was sind sie?","a":"<strong>Sei gefällig! – Sei perfekt! – Sei stark! – Beeil dich! – Streng dich an!</strong> Unbewusste Glaubenssätze aus der Kindheit, die das Verhalten unter Stress steuern."},
  {"id":"k-lb23-154","cat":"Laufbahn · Heyrothsberge","q":"Antreiber „Sei perfekt!“, „Sei stark!“, „Beeil dich!“: Risiko und Erlauber?","a":"Perfekt: Fehlerangst, Überkontrolle → „Ich darf Fehler machen“ / „Gut ist gut genug“. Stark: Schwächen verbergen → „Ich darf Gefühle zeigen und um Hilfe bitten“. Beeil dich: Zeitdruck → „Ich darf mir Zeit nehmen“."},
  {"id":"k-lb23-155","cat":"Laufbahn · Heyrothsberge","q":"Wie befreit man sich von Antreibern (Schritte 1 bis 3)?","a":"① <strong>Erkennen</strong> (Selbstreflexion, Antreibertest, Durchschnitt 16 auf Skala 0–32), ② <strong>Verstehen</strong> (Herkunft, frühere Schutzfunktion), ③ <strong>Erlauber</strong> formulieren und täglich einüben."},
  {"id":"k-lb23-156","cat":"Laufbahn · Heyrothsberge","q":"Wie befreit man sich von Antreibern (Schritte 4 und 5)?","a":"④ <strong>Verhalten ändern</strong> (Delegation, Pausen, Priorisierung nach Eisenhower, „Nein“ üben, Feedback, ggf. Coaching), ⑤ <strong>Ressourcen stärken</strong> (Stressmanagement, Achtsamkeit, Erwachsenen-Ich aktivieren)."},
  {"id":"k-lb23-157","cat":"Laufbahn · Heyrothsberge","q":"Was ist nach einem belastenden Einsatz leiblich und durch die Führungskraft zu tun?","a":"Leiblich: Getränke, Essen, Wärme/Wechselkleidung, Ruhe, Dekontamination, Rotation, Wiederherstellung der Einsatzbereitschaft. Führungskraft: Belastung erkennen (Rückzug, Schweigen), <strong>Einsatznachbesprechung</strong>, Wertschätzung, Kontakt anbieten."},
  {"id":"k-lb23-158","cat":"Laufbahn · Heyrothsberge","q":"Aus welchen drei Schritten besteht die Demobilisation?","a":"<strong>Rekonstruieren</strong> (Ablauf chronologisch), <strong>Normalisieren</strong> („solche Reaktionen sind typisch“), <strong>Aktivieren</strong> (eigene Bewältigungsstrategien, gruppeninterne Unterstützung, Einladung zum Defusing/Nachsorge)."},
  {"id":"k-lb23-159","cat":"Laufbahn · Heyrothsberge","q":"Welche Rolle haben PSNV-Kräfte, und was bedeutet BELLA?","a":"PSNV-E-Kräfte (sekundäre PSNV) hinzuziehen; Einzelgespräch nach <strong>BELLA</strong>: Beziehung aufbauen – Erfassen – Linderung – Leute einbeziehen – Ansatz zur Problembewältigung. Dazu Beratungsangebote, Nachsorge nach Tagen; bei Großlagen ca. <strong>30 %</strong> der Betroffenen als PSNV-Kräfte alarmieren."},
  {"id":"k-lb23-160","cat":"Laufbahn · Heyrothsberge","q":"Nenne vier PSNV-erforderliche Einsatzsituationen.","a":"Tod oder schwere Verletzung eines <strong>Kollegen</strong>; Einsätze mit toten oder schwerverletzten <strong>Kindern</strong>; Großschadenslagen/MANV, Terroranschläge; Suizid, frustrane Reanimation, Brand mit Todesopfern, Einsatz mit persönlichem Bezug."},
  {"id":"k-lb23-161","cat":"Laufbahn · Heyrothsberge","q":"Welche vier Reaktionsebenen der Belastungsreaktion gibt es?","a":"<strong>Körperlich</strong> (Herzrasen, Zittern, Schlafstörungen), <strong>emotional</strong> (Angst, Trauer, Wut, Schuld), <strong>kognitiv</strong> (Konzentrationsstörungen, Grübeln, Intrusionen), <strong>Verhalten/sozial</strong> (Rückzug, Reizbarkeit, Vermeidung, erhöhter Konsum)."},
  {"id":"k-lb23-162","cat":"Laufbahn · Heyrothsberge","q":"Welche präventiven Maßnahmen gibt es gegen Einsatzbelastung (Struktur und Kultur)?","a":"Aus- und Fortbildung (Stresstraining, realitätsnahe Übungen), Information über Belastungsreaktionen vorab, <strong>PSNV-Strukturen</strong> (Beauftragte, Peers, Meldewege), offene Teamkultur ohne Stigma."},
  {"id":"k-lb23-163","cat":"Laufbahn · Heyrothsberge","q":"Welche weiteren präventiven Maßnahmen gibt es (BGM, Taktik, Nachsorge)?","a":"<strong>BGM</strong>: Gefährdungsbeurteilung psychischer Belastung (§ 5 ArbSchG), EAP, Sport, Schlaf, Resilienztraining. Einsatztaktik: Rotation, begrenzte Dauer, Pausen. Regelmäßige Nachbesprechungen auch bei normalen Einsätzen, Betriebsarzt."},
  {"id":"k-lb23-164","cat":"Laufbahn · Heyrothsberge","q":"Was ist beim erstmaligen Auftreten eines alkoholisierten Mitarbeiters sofort zu tun?","a":"Wahrnehmung sachlich feststellen, möglichst mit <strong>Zeugen</strong> und Dokumentation (Datum, Uhrzeit, Beobachtungen, keine Diagnosen). Mitarbeiter <strong>vom Dienst abziehen</strong>, keine Fahrt allein nach Hause, bei Gefahr Rettungsdienst."},
  {"id":"k-lb23-165","cat":"Laufbahn · Heyrothsberge","q":"Welcher Rechtsrahmen gilt beim alkoholisierten Mitarbeiter?","a":"Nicht dienstfähig; Verstoß gegen Dienstpflichten (Beamte u. a. § 34 BeamtStG) und gegen die Unfallverhütungsvorschrift (<strong>DGUV Vorschrift 1</strong>). Beim Erstauftreten steht die <strong>Fürsorge</strong> im Vordergrund, Konsequenzen nach Dienststellenregelung prüfen."},
  {"id":"k-lb23-166","cat":"Laufbahn · Heyrothsberge","q":"Wie läuft das klärende Gespräch und der Stufenplan beim Alkoholproblem ab?","a":"Zeitnah, nüchtern, unter vier Augen: Beobachtungen konkret benennen (Ich-Botschaften, keine Diagnose „Alkoholiker“), Erwartung (kein Alkohol im Dienst) und <strong>Hilfsangebot</strong> (Betriebsarzt, Suchtbeauftragte, EAP). Folgegespräch; bei Wiederholung <strong>Stufenplan</strong> mit zunehmender Verbindlichkeit, Vertraulichkeit, Personalrat."},
  {"id":"k-lb23-167","cat":"Laufbahn · Heyrothsberge","q":"Was bedeutet riskanter Alkoholkonsum?","a":"Menge/Häufigkeit über der Grenze mit geringem Gesundheitsrisiko, <strong>ohne Abhängigkeit</strong>. Orientierungswerte (DHS): Frauen ab ca. 12 g, Männer ab ca. 24 g Reinalkohol pro Tag; Rauschtrinken; weniger als zwei alkoholfreie Tage pro Woche. Es gibt keine völlig risikofreie Menge."},
  {"id":"k-lb23-168","cat":"Laufbahn · Heyrothsberge","q":"Was bedeutet Abhängigkeit (ICD-10/11)?","a":"Mindestens <strong>3 Kriterien in 12 Monaten</strong>: starker Konsumwunsch, Kontrollverlust, Entzugssymptome, Toleranzentwicklung, Vernachlässigung anderer Interessen, Konsum trotz Schäden. Krankheit, kein Charakterfehler; Behandlung nötig."},
  {"id":"k-lb23-169","cat":"Laufbahn · Heyrothsberge","q":"Welche Warnzeichen am Arbeitsplatz deuten auf ein Alkoholproblem hin?","a":"Fehlzeiten (montags), Leistungsschwankungen, Zittern, Fahne, Rückzug, Stimmungsschwankungen, Verheimlichen."},
  {"id":"k-lb23-170","cat":"Laufbahn · Heyrothsberge","q":"Was ist aktives Zuhören?","a":"Gesprächstechnik nach <strong>Carl Rogers</strong>: volle Aufmerksamkeit und Prüfen, ob Inhalt und Gefühl richtig verstanden wurden. Im Suchtgespräch Voraussetzung für die Annahme von Hilfe."},
  {"id":"k-lb23-171","cat":"Laufbahn · Heyrothsberge","q":"Aus welchen Elementen besteht aktives Zuhören?","a":"Blickkontakt und zugewandte Haltung, <strong>ausreden lassen</strong>, <strong>Paraphrasieren</strong> („Wenn ich Sie richtig verstehe …“), Gefühle verbalisieren, offene Fragen, Zusammenfassen, Pausen aushalten, Ich-Botschaften, keine Ratschläge."},
  {"cat":"IBK · Transaktionsanalyse","q":"Wer entwickelte die Transaktionsanalyse und was ist ihr Ziel?","a":"<strong>Eric Berne.</strong> Psychologische Theorie der Persönlichkeit und des zwischenmenschlichen Verhaltens. Ziel: bewusste Kommunikation, bessere Beziehungen, Konfliktlösung und individuelle Autonomie.","id":"k-ibk-01"},
  {"cat":"IBK · Transaktionsanalyse","q":"Aus welchen sieben Bestandteilen besteht die TA?","a":"<strong>Strukturanalyse</strong> (Was geht in mir vor?), <strong>Transaktionsanalyse</strong> (Was geht zwischen uns vor?), <strong>Grundbedürfnisse</strong>, <strong>Grundeinstellungen</strong>, <strong>Spielanalyse</strong>, <strong>Antreiber</strong>, <strong>Skriptanalyse</strong>.","id":"k-ibk-02"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was bezeichnet man als „Transaktion“?","a":"Die <strong>Grundeinheit aller sozialen Verbindungen</strong>: die Interaktion, wenn sich zwei oder mehr Menschen begegnen. Entscheidend ist, aus welchen Ich-Zuständen heraus kommuniziert wird.","id":"k-ibk-03"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Grundannahmen gelten in der TA über den Menschen?","a":"Jeder Mensch kann denken und Probleme lösen, ist in seiner Ganzheit in Ordnung, kann <strong>Verantwortung</strong> für sein Leben übernehmen und sein Lebenskonzept konstruktiv gestalten.","id":"k-ibk-04"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche drei Ich-Zustände unterscheidet die Strukturanalyse?","a":"<strong>Eltern-Ich</strong> (übernommene Werte und Regeln), <strong>Erwachsenen-Ich</strong> (rational, objektiv), <strong>Kind-Ich</strong> (emotional, impulsiv).","id":"k-ibk-05"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche fünf Ich-Zustände sind an einer Transaktion beteiligt (Funktionsmodell)?","a":"<strong>Kritisches Eltern-Ich</strong>, <strong>fürsorgliches Eltern-Ich</strong>, <strong>Erwachsenen-Ich</strong>, <strong>natürliches Kind-Ich</strong>, <strong>angepasstes Kind-Ich</strong>.","id":"k-ibk-06"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was zeigt das Egogramm?","a":"Es stellt grafisch dar, <strong>wie stark und wie oft</strong> eine Person die einzelnen funktionellen Ich-Zustände nutzt. Werkzeug zur Selbstreflexion und Verhaltensänderung.","id":"k-ibk-07"},
  {"cat":"IBK · Transaktionsanalyse","q":"Kritisches Eltern-Ich: Vorteile und Nachteile bei starker Ausprägung?","a":"Vorteil: entscheidet in <strong>Notsituationen rasch</strong>, legt Wert auf Tradition und Norm. Nachteil: lehnt Neues ab, intolerant, unterdrückend, überkritisch, reagiert mit Ärger und Aggression.","id":"k-ibk-08"},
  {"cat":"IBK · Transaktionsanalyse","q":"Fürsorgliches Eltern-Ich: Vorteile und Nachteile bei starker Ausprägung?","a":"Vorteil: schafft Geborgenheit, hört geduldig zu, unterstützt. Nachteil: <strong>überfürsorglich</strong>, macht andere abhängig und verhindert Selbständigkeit.","id":"k-ibk-09"},
  {"cat":"IBK · Transaktionsanalyse","q":"Erwachsenen-Ich: Vorteile und Nachteile bei starker Ausprägung?","a":"Vorteil: fragt viel, geht Ursachen auf den Grund, achtet auf Logik, löst Konflikte durch <strong>kreative Kooperation</strong>. Nachteil: zeigt wenig Gefühl, überkontrolliert, roboterhaft, übertriebene Perfektion.","id":"k-ibk-10"},
  {"cat":"IBK · Transaktionsanalyse","q":"Natürliches Kind-Ich: Vorteile und Nachteile bei starker Ausprägung?","a":"Vorteil: fantasievoll, spontan, offen, zeigt Gefühle. Nachteil: <strong>impulsiv</strong>, rücksichtslos, chaotisch, cholerisch.","id":"k-ibk-11"},
  {"cat":"IBK · Transaktionsanalyse","q":"Angepasstes Kind-Ich: Vorteile und Nachteile bei starker Ausprägung?","a":"Vorteil: nimmt Rücksicht, kompromissbereit, hält sich an Normen. Nachteil: <strong>überangepasst</strong>, Angst vor Fehlern, gibt schnell nach, zieht sich zurück.","id":"k-ibk-12"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was bedeutet ein schwach ausgeprägtes Erwachsenen-Ich?","a":"Es hat <strong>keine Vorteile</strong>: wenig Lernen aus Erfahrung, wechselhaft, unberechenbar, geringes Selbstwertgefühl.","id":"k-ibk-13"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was besagt die erste Kommunikationsregel?","a":"Bei einer <strong>Paralleltransaktion</strong> (komplementär) kommt die erwartbare Reaktion. Das Gespräch läuft glatt weiter und könnte theoretisch unbegrenzt andauern, auch aus „Langeweile“ endet es.","id":"k-ibk-14"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was besagt die zweite Kommunikationsregel?","a":"Die <strong>Über-Kreuz-Transaktion</strong> ist eine Störung: Der Stimulus wird nicht mit der erwartbaren Reaktion beantwortet. Sie ist oft die Grundlage für einen <strong>Konflikt</strong>; zum Glätten muss mindestens einer den Ich-Zustand wechseln.","id":"k-ibk-15"},
  {"cat":"IBK · Transaktionsanalyse","q":"Kann man den Ich-Zustand des Gesprächspartners bestimmen?","a":"Nein. Man kann ihn nur <strong>einladen</strong>, aus einem bestimmten Ich-Zustand zu reagieren.","id":"k-ibk-16"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was besagt die dritte Kommunikationsregel?","a":"Bei der <strong>verdeckten Transaktion</strong> werden zwei Botschaften gleichzeitig gesendet: offen auf der Sachebene, verdeckt auf der Beziehungsebene. Das weitere Verhalten entscheidet sich auf der Beziehungsebene.","id":"k-ibk-17"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie wird die verdeckte Botschaft übertragen?","a":"<strong>Nonverbal</strong> über Gestik, Mimik, Sprechweise und Tonlage.","id":"k-ibk-18"},
  {"cat":"IBK · Transaktionsanalyse","q":"Warum lässt sich ein Beziehungskonflikt nicht auf der Sachebene lösen?","a":"Das eigentliche Problem liegt auf der <strong>Beziehungsebene</strong>. Wird er auf der Sachebene ausgetragen, bleibt die Ursache unberührt. Besser: mit der verdeckten Botschaft konfrontieren und direkte Botschaften einfordern.","id":"k-ibk-19"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche vier Regeln gelten im Umgang mit verdeckten Transaktionen?","a":"1. Selbst darauf <strong>verzichten</strong>. 2. Die verdeckte Ebene <strong>ignorieren</strong> und beim Wort nehmen, zur direkten Botschaft auffordern. 3. Mit der doppelbödigen Kommunikation <strong>konfrontieren</strong>. 4. Bei hartnäckigem Beibehalten den <strong>Kontakt abbrechen</strong>.","id":"k-ibk-20"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie fordert man eine direkte Botschaft ein?","a":"Durch Nachfragen, z. B. „Was ist es, was Du mir damit sagen möchtest?“ oder „Sag mir bitte, was Du wirklich möchtest.“","id":"k-ibk-21"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche psychologischen Grundbedürfnisse nennt Berne?","a":"<strong>Sinnliche Anregung</strong>, <strong>Zuwendung/Beachtung (Strokes)</strong> und <strong>Zeitgestaltung</strong>. Für Führungskräfte am wichtigsten: Zuwendung und Beachtung.","id":"k-ibk-22"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was ist ein Stroke?","a":"Jede Form der <strong>Wahrnehmung oder Anerkennung</strong> eines Menschen durch einen anderen: körperlich (Händedruck), nonverbal (Blickkontakt, Lächeln) oder verbal (Lob, Kritik, Gespräch).","id":"k-ibk-23"},
  {"cat":"IBK · Transaktionsanalyse","q":"Warum provozieren Menschen manchmal Konflikte?","a":"Menschen wollen wahrgenommen werden; selbst <strong>negative Beachtung</strong> wird oft besser erlebt als keine. Notfalls holen sie sich Aufmerksamkeit durch Konflikte, Provokationen oder manipulative Rollen.","id":"k-ibk-24"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche fünf Formen der Beachtung gibt es (in Reihenfolge)?","a":"1. Bedingungslose positive, 2. bedingte positive, 3. bedingte negative, 4. bedingungslose negative Beachtung, 5. <strong>keine Beachtung</strong> (am schlimmsten).","id":"k-ibk-25"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie lauten die fünf Stroke-Erlaubnisse?","a":"Du darfst Strokes <strong>geben</strong>, darum <strong>bitten</strong>, sie <strong>annehmen</strong>, sie <strong>ablehnen</strong> und dich <strong>selbst stroken</strong>.","id":"k-ibk-26"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie grenzt sich Berne von Maslow bei den Grundbedürfnissen ab?","a":"Maslows Grundbedürfnisse sind die unterste Stufe der Pyramide (physiologisch: Nahrung, Wasser, Luft, Schlaf). Bei Berne sind es <strong>psychologische</strong> Bedürfnisse neben den körperlichen.","id":"k-ibk-27"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche vier Grundeinstellungen unterscheidet die TA?","a":"<strong>– +</strong> Ich bin nicht o.k., du bist o.k. · <strong>+ –</strong> Ich bin o.k., du bist nicht o.k. · <strong>– –</strong> beide nicht o.k. · <strong>+ +</strong> beide o.k. (gesund und konstruktiv).","id":"k-ibk-28"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie verhält sich jemand mit der Grundeinstellung „Ich bin nicht o.k. – du bist o.k.“?","a":"Fühlt sich unterlegen und unsicher, abhängig von Anerkennung: <strong>angepasst, zurückhaltend, entschuldigend, konfliktscheu</strong>.","id":"k-ibk-29"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie verhält sich jemand mit der Grundeinstellung „Ich bin o.k. – du bist nicht o.k.“?","a":"Fühlt sich überlegen, sucht Fehler bei anderen: <strong>dominant, kontrollierend, bevormundend</strong>, gibt Verantwortung ungern ab.","id":"k-ibk-30"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie verhält sich jemand mit der Grundeinstellung „Ich bin nicht o.k. – du bist nicht o.k.“?","a":"Erlebt das Leben als sinnlos oder hoffnungslos: <strong>resigniert, pessimistisch, distanziert</strong>.","id":"k-ibk-31"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Grundeinstellung ist die gesunde, und wann zeigt sich die Grundeinstellung deutlich?","a":"<strong>Ich bin o.k. – du bist o.k. (+ +)</strong>: respektvoll, verantwortungsbewusst, offen, lösungsorientiert. Die Grundeinstellung zeigt sich spätestens in <strong>Krisensituationen</strong>.","id":"k-ibk-32"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was ist das Drama-Dreieck und von wem stammt es?","a":"Modell von <strong>Stephen Karpman</strong> (Karpman-Dreieck) für destruktive Beziehungsdynamiken: die Rollen <strong>Verfolger, Opfer, Retter</strong> in psychologischen Spielen.","id":"k-ibk-33"},
  {"cat":"IBK · Transaktionsanalyse","q":"Warum entstehen psychologische Spiele?","a":"Wenn Konflikte nicht offen angesprochen werden. Man will Aufmerksamkeit/Bestätigung, eigene Ziele indirekt durchsetzen, echte Nähe vermeiden oder Verantwortung/Schuld abgeben.","id":"k-ibk-34"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Grundhaltung hat der Verfolger?","a":"<strong>„Ich bin o.k. – du nicht“</strong> (+ –). Kritisiert, kontrolliert, greift an. Typischer Satz: „Du bist schuld.“","id":"k-ibk-35"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Grundhaltung hat der Retter?","a":"„Ohne mich geht es nicht.“ Er hilft <strong>ungefragt</strong>, übernimmt Verantwortung und macht andere abhängig. Typischer Satz: „Ich mache das für dich.“ Er erwartet Dank und fühlt sich später ausgenutzt.","id":"k-ibk-36"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Grundhaltung hat das Opfer?","a":"<strong>„Ich bin nicht o.k. – die anderen sind besser“</strong> (– +). Fühlt sich hilflos, gibt Verantwortung ab, sucht einen Retter oder Verfolger. Typischer Satz: „Ich kann das nicht.“","id":"k-ibk-37"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Merkmale haben psychologische Spiele im Drama-Dreieck?","a":"Wunsch nach <strong>Zuwendung</strong> als Einstieg, gleichzeitig <strong>verdeckte Transaktion</strong> (jemand ist nicht o.k.), alle drei Rollen werden eingenommen, <strong>blitzschnelle Rollenwechsel</strong>, die Rollen ziehen sich gegenseitig an.","id":"k-ibk-38"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie kann ein Retter zum Verfolger werden?","a":"Wenn seine Hilfe <strong>nicht angenommen</strong> wird. Das ist ein typischer Rollenwechsel im Drama-Dreieck.","id":"k-ibk-39"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie kommt man aus dem Drama-Dreieck heraus?","a":"Muster erkennen und aus dem <strong>Erwachsenen-Ich</strong> heraus offen, sachlich und verantwortungsvoll kommunizieren.","id":"k-ibk-40"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was sind Gefühlsmaschen?","a":"Taktische, oft unbewusste Gefühlsreaktionen, die in der <strong>Kindheit</strong> gelernt wurden, um andere zu beeinflussen oder Bedürfnisse indirekt durchzusetzen.","id":"k-ibk-41"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie zeigen sich die Drama-Dreieck-Rollen im Führungsalltag?","a":"Übermäßiges Kontrollieren (<strong>Verfolger</strong>), ungefragtes Helfen (<strong>Retter</strong>), Hilflosigkeit oder Schuldzuweisungen (<strong>Opfer</strong>).","id":"k-ibk-42"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie lauten die fünf Antreiber nach Taibi Kahler?","a":"<strong>Sei perfekt, sei stark, sei anderen gefällig (mach es allen recht), streng dich an, beeil dich.</strong>","id":"k-ibk-43"},
  {"cat":"IBK · Transaktionsanalyse","q":"Antreiber „Sei perfekt!“: Risiko und Erlauber?","a":"Führungsrisiko: <strong>Mikromanagement</strong>, Delegationsprobleme, Entscheidungsverzögerung. Erlauber: „Gut genug ist oft ausreichend.“","id":"k-ibk-44"},
  {"cat":"IBK · Transaktionsanalyse","q":"Antreiber „Sei stark!“: Risiko und Erlauber?","a":"Führungsrisiko: fehlende Fehlerkultur, Isolation, mangelnde Offenheit. Erlauber: <strong>„Du darfst Gefühle zeigen und Unterstützung annehmen.“</strong>","id":"k-ibk-45"},
  {"cat":"IBK · Transaktionsanalyse","q":"Antreiber „Beeil dich!“: Risiko und Erlauber?","a":"Führungsrisiko: Flüchtigkeitsfehler, vorschnelle Entscheidungen, Stressübertragung auf das Team. Erlauber: <strong>„Du darfst dir Zeit zum Denken nehmen.“</strong>","id":"k-ibk-46"},
  {"cat":"IBK · Transaktionsanalyse","q":"Antreiber „Sei anderen gefällig!“: Risiko und Erlauber?","a":"Führungsrisiko: <strong>Konfliktvermeidung</strong>, mangelnde Abgrenzung, Überlastung. Erlauber: „Du darfst eigene Bedürfnisse haben und vertreten.“","id":"k-ibk-47"},
  {"cat":"IBK · Transaktionsanalyse","q":"Antreiber „Streng dich an!“: Risiko und Erlauber?","a":"Führungsrisiko: Ineffizienz, Überarbeitung, fehlende Priorisierung. Erlauber: <strong>„Du darfst es dir leicht machen und wirksam arbeiten.“</strong>","id":"k-ibk-48"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was untersucht die Skriptanalyse und warum ist sie nicht prüfbar?","a":"Den unbewussten, in der Kindheit geformten <strong>Lebensplan</strong>. Sie erfordert Langzeitbetrachtung und tiefenpsychologische Informationen, daher nicht in einer Prüfungssituation bewertbar.","id":"k-ibk-49"},
  {"cat":"IBK · Konflikte","q":"Wie ist ein Konflikt definiert?","a":"Ein Auseinandersetzungsprozess aus unterschiedlichen <strong>Interessen, Werten oder Zielen</strong> zwischen Personen, Gruppen oder innerhalb einer Person. Unvermeidlich, aber auch konstruktiv möglich.","id":"k-ibk-50"},
  {"cat":"IBK · Konflikte","q":"Was kennzeichnet einen heißen Konflikt?","a":"Er wird <strong>offen ausgefochten</strong>. Vorteil: Beteiligte verstecken den Konflikt nicht, günstig für Bearbeitung und Lösung.","id":"k-ibk-51"},
  {"cat":"IBK · Konflikte","q":"Was passiert, wenn man einen heißen Konflikt mit einem faulen Kompromiss „deckelt“?","a":"Er verwandelt sich regelmäßig in einen <strong>kalten Konflikt</strong> (z. B. wenn Vorgesetzte oberflächlich eingreifen, statt zu mediieren).","id":"k-ibk-52"},
  {"cat":"IBK · Konflikte","q":"Was kennzeichnet einen kalten Konflikt?","a":"Er brodelt <strong>unterschwellig</strong> und fast unbemerkt, weil Ängste und Befürchtungen die Austragung verhindern (Firmenkultur, Führungspersönlichkeit, persönlicher Hintergrund).","id":"k-ibk-53"},
  {"cat":"IBK · Konflikte","q":"Welche Eskalationsstufen nach Glasl sind „heiß“, welche „kalt“?","a":"Heiß: Stufen <strong>1, 2, 6, 8, 9</strong>. Kalt: Stufen <strong>3, 4, 7</strong>.","id":"k-ibk-54"},
  {"cat":"IBK · Konflikte","q":"Ab welcher Glasl-Stufe ist man selbst nicht mehr handlungsfähig?","a":"Auf Stufe <strong>3–4</strong> noch selbst handlungsfähig. <strong>Ab Stufe 4</strong> sollte man sich nicht in die Eskalation einbringen: <strong>externe Lösung</strong>.","id":"k-ibk-55"},
  {"cat":"IBK · Konflikte","q":"Welche vier Konfliktursachen gibt es?","a":"<strong>Bewertungskonflikt</strong> (Ziele), <strong>Beurteilungskonflikt</strong> (Wege), <strong>Verteilungskonflikt</strong> (Mittel), <strong>Beziehungskonflikt</strong> (Verletzung des Selbstwertgefühls).","id":"k-ibk-56"},
  {"cat":"IBK · Konflikte","q":"Worüber herrscht beim Bewertungskonflikt Uneinigkeit?","a":"Über die <strong>Ziele</strong>: unterschiedliche Werte und Normen, gegensätzliche Ziele.","id":"k-ibk-57"},
  {"cat":"IBK · Konflikte","q":"Worüber herrscht beim Beurteilungskonflikt Uneinigkeit?","a":"Über die <strong>Wege</strong>: unterschiedliche Erfahrungen, Informationsquellen und Informationsverarbeitung.","id":"k-ibk-58"},
  {"cat":"IBK · Konflikte","q":"Worüber herrscht beim Verteilungskonflikt Uneinigkeit?","a":"Über die <strong>Mittel</strong>: knappe oder knapp gehaltene Mittel, Diskrepanz zwischen Mitteln und Ansprüchen.","id":"k-ibk-59"},
  {"cat":"IBK · Konflikte","q":"Was ist die Ursache eines Beziehungskonflikts?","a":"Die <strong>Verletzung des Selbstwertgefühls</strong>.","id":"k-ibk-60"},
  {"cat":"IBK · Konflikte","q":"Welche fünf Konfliktarten unterscheidet man?","a":"<strong>Intrapersonal</strong> (in einer Person), <strong>interpersonal</strong> (zwischen Einzelpersonen), <strong>Intra-Gruppenkonflikt</strong> (innerhalb einer Gruppe), <strong>Inter-Gruppenkonflikt</strong> (zwischen Gruppen), <strong>Personen-Gruppen-Konflikt</strong>.","id":"k-ibk-61"},
  {"cat":"IBK · Konflikte","q":"Wie geht man mit einem heißen Konflikt zuerst um?","a":"Zuerst die <strong>persönlichen Beziehungen klären</strong>, da der Konflikt hochgradig personalisiert ist. Über externe Bedingungen und Organisation wird erst später gesprochen.","id":"k-ibk-62"},
  {"cat":"IBK · Konflikte","q":"Wie geht man mit einem kalten Konflikt zuerst um?","a":"Zuerst die Parteien befähigen, den Konflikt auszutragen, dazu das <strong>Selbstwertgefühl stärken</strong>. Direkte Konfrontation ruft anfangs Abwehr hervor; Vermeidungsprozeduren direktiv abändern.","id":"k-ibk-63"},
  {"id":"k-vak-01","cat":"VAk · Staatsrecht","q":"Wer hat nach Art. 76 Abs. 1 GG das Recht zur Gesetzesinitiative?","a":"<strong>Bundesregierung, Bundesrat und Bundestag</strong> (aus seiner Mitte). Bundespräsident und Bundesverfassungsgericht haben kein Initiativrecht."},
  {"id":"k-vak-02","cat":"VAk · Staatsrecht","q":"Wer fasst den Gesetzesbeschluss nach Art. 77 Abs. 1 GG?","a":"Allein der <strong>Bundestag</strong>. Der Bundesrat kommt erst im 2. Durchgang (Art. 77 Abs. 2 ff. GG)."},
  {"id":"k-vak-03","cat":"VAk · Staatsrecht","q":"Welche Organe wirken in der Gesetzesberatung (1. Durchgang) mit?","a":"<strong>Bundestag</strong>, <strong>Bundesrat</strong> (Stellungnahme) und <strong>Bundesregierung</strong>."},
  {"id":"k-vak-04","cat":"VAk · Staatsrecht","q":"Welche Möglichkeiten hat der Bundesrat im 2. Durchgang (Art. 77 Abs. 2 ff. GG)?","a":"Er kann <strong>zustimmen</strong>, <strong>Einspruch einlegen</strong> oder den <strong>Vermittlungsausschuss anrufen</strong>. Ein absolutes Veto hat er nur bei Zustimmungsgesetzen."},
  {"id":"k-vak-05","cat":"VAk · Staatsrecht","q":"Unterschied Zustimmungsgesetz und Einspruchsgesetz?","a":"Zustimmungsgesetz: ohne Zustimmung des Bundesrates kommt das Gesetz nicht zustande, der Bundestag kann das nicht überstimmen.<br>Einspruchsgesetz: der Bundestag kann den Einspruch zurückweisen (Art. 77 Abs. 4 GG)."},
  {"id":"k-vak-06","cat":"VAk · Staatsrecht","q":"Wer fertigt ein Bundesgesetz aus und verkündet es (Art. 82 Abs. 1 GG)? Was ist zusätzlich nötig?","a":"Der <strong>Bundespräsident</strong> (Ausfertigung und Verkündung im BGBl.). Erforderlich ist die <strong>Gegenzeichnung</strong> durch die Bundesregierung bzw. den zuständigen Bundesminister (Art. 58 GG)."},
  {"id":"k-vak-07","cat":"VAk · Staatsrecht","q":"Stimmt das? Das Bundesverfassungsgericht ist am regulären Gesetzgebungsverfahren des Bundes beteiligt.","a":"<strong>Falsch.</strong> Das BVerfG prüft Bundesgesetze erst nachträglich auf Antrag (z. B. abstrakte oder konkrete Normenkontrolle)."},
  {"id":"k-vak-08","cat":"VAk · Staatsrecht","q":"Wie wirken sich Änderungen der Kräfteverhältnisse in den Landesparlamenten auf die Wahl des Bundespräsidenten aus?","a":"Die Bundesversammlung besteht zur Hälfte aus von den Landesparlamenten entsandten Mitgliedern (<strong>Art. 54 Abs. 3 GG</strong>). Mehrheitsverschiebungen in den Landtagen verschieben die Mehrheit bei der Präsidentenwahl."},
  {"id":"k-vak-09","cat":"VAk · Staatsrecht","q":"Wie wirken sich Änderungen der Kräfteverhältnisse in den Landesparlamenten auf Grundgesetzänderungen aus?","a":"Nötig sind <strong>zwei Drittel der Stimmen des Bundesrates</strong> (Art. 79 Abs. 2 GG). Der Bundesrat besteht aus Mitgliedern der Landesregierungen (Art. 51 GG), deren Koalitionen von den Landtagswahlen abhängen."},
  {"id":"k-vak-10","cat":"VAk · Staatsrecht","q":"Stimmt das? Grundrechte sind Abwehrrechte der Bürgerinnen und Bürger gegen den Staat.","a":"<strong>Richtig.</strong> Das ist ihre klassische Funktion gegenüber dem Staat."},
  {"id":"k-vak-11","cat":"VAk · Staatsrecht","q":"Stimmt das? Alle Grundrechte sind im Rahmen des Grundgesetzes einschränkbar.","a":"<strong>Falsch.</strong> Die Menschenwürde (Art. 1 Abs. 1 GG) ist nach Art. 79 Abs. 3 GG unantastbar. Vorbehaltlos gewährleistete Grundrechte (z. B. Art. 4 Abs. 1 GG) sind nur durch verfassungsimmanente Schranken einschränkbar."},
  {"id":"k-vak-12","cat":"VAk · Staatsrecht","q":"Stimmt das? Autos sind vom Schutzbereich des Art. 13 Abs. 1 GG umfasst.","a":"<strong>Falsch.</strong> Art. 13 GG schützt die Wohnung, Kraftfahrzeuge fallen nicht darunter. Wohnmobile und Wohnwagen schon (Raum des Rückzugs und der Privatsphäre)."},
  {"id":"k-vak-13","cat":"VAk · Staatsrecht","q":"Stimmt das? Gemeinderäte sind Bestandteile der vollziehenden Gewalt.","a":"<strong>Richtig.</strong> Die kommunale Selbstverwaltung (Art. 28 Abs. 2 GG) gehört organisatorisch zur <strong>Exekutive</strong>, auf kommunaler Ebene gibt es keine eigene Gewaltenteilung."},
  {"id":"k-vak-14","cat":"VAk · Staatsrecht","q":"Stimmt das? Das Schulrecht fällt in die konkurrierende Gesetzgebungskompetenz.","a":"<strong>Falsch.</strong> Schulrecht ist <strong>Ländersache</strong> (Kulturhoheit der Länder), eine Bundeskompetenz nach Art. 70 ff. GG besteht nicht."},
  {"id":"k-vak-15","cat":"VAk · Staatsrecht","q":"Was gilt bei der konkurrierenden Gesetzgebung (Art. 72 Abs. 1 GG)?","a":"Die <strong>Länder sind zuständig, bis der Bund</strong> von seiner Zuständigkeit durch Gesetz Gebrauch macht. Der Bund darf also nicht erst nach Zustimmung der Länder tätig werden."},
  {"id":"k-vak-16","cat":"VAk · Staatsrecht","q":"Welche Arten der Gesetzgebungskompetenz unterscheidet das Grundgesetz?","a":"Ausschließliche Gesetzgebung des Bundes, <strong>konkurrierende Gesetzgebung</strong> und Zuständigkeit der Länder als Auffangzuständigkeit (Art. 70 ff. GG)."},
  {"id":"k-vak-17","cat":"VAk · Staatsrecht","q":"Stimmt das? Der Bundeskanzler kann den Bundestag auflösen.","a":"<strong>Falsch.</strong> Auflösen kann nur der <strong>Bundespräsident</strong>, und nur in den engen Fällen der Art. 63 Abs. 4 oder Art. 68 GG."},
  {"id":"k-vak-18","cat":"VAk · Staatsrecht","q":"Wer vertritt den Bundespräsidenten bei Verhinderung?","a":"Der <strong>Präsident des Bundesrates</strong> (Art. 57 GG), nicht der Bundeskanzler."},
  {"id":"k-vak-19","cat":"VAk · Staatsrecht","q":"Kann Bundespräsident Steinmeier 2027 wiedergewählt werden?","a":"<strong>Nein.</strong> Seine zweite Amtszeit endet am 18. März 2027, eine dritte Amtszeit in Folge schließt Art. 54 Abs. 2 GG aus."},
  {"id":"k-vak-20","cat":"VAk · Staatsrecht","q":"Welche Wahlrechtsgrundsätze nennt Art. 38 Abs. 1 Satz 1 GG?","a":"<strong>Allgemein, unmittelbar, frei, gleich, geheim</strong> (fünf). In der Klausurfrage fehlte die Gleichheit. Die Öffentlichkeit der Wahl hat das BVerfG aus Art. 38 i.V.m. Art. 20 GG entwickelt."},
  {"id":"k-vak-21","cat":"VAk · Staatsrecht","q":"Was bedeutet der Wahlgrundsatz der Gleichheit?","a":"Jede Stimme hat den gleichen <strong>Zählwert</strong> und den gleichen <strong>Erfolgswert</strong> (Art. 38 Abs. 1 Satz 1 GG)."},
  {"id":"k-vak-22","cat":"VAk · Staatsrecht","q":"Wann wurde das Grundgesetz verkündet, wann trat es in Kraft?","a":"Verkündet am <strong>23.05.1949</strong>, in Kraft getreten am <strong>24.05.1949</strong>."},
  {"id":"k-vak-23","cat":"VAk · Staatsrecht","q":"Was bedeutet das Rechtsstaatsprinzip?","a":"Es umfasst die Bindung an Gesetz und Recht, den <strong>Vorbehalt des Gesetzes</strong>, Rechtssicherheit und Rechtsschutz. Die richterliche Unabhängigkeit (Art. 97 GG) ist eine anerkannte Ausprägung."},
  {"id":"k-vak-24","cat":"VAk · Staatsrecht","q":"Wie ist die Gewaltenteilung im Grundgesetz ausgestaltet?","a":"Gliederung in Legislative, Exekutive und Judikative, aber <strong>keine strikte Trennung</strong>: Gewaltenverschränkung mit funktionalen Überschneidungen und wechselseitiger Kontrolle."},
  {"id":"k-vak-25","cat":"VAk · Staatsrecht","q":"Nenne die fünf ständigen Verfassungsorgane des Bundes. Gehört die Bundesversammlung dazu?","a":"Bundestag, Bundesrat, Bundesregierung, Bundespräsident, Bundesverfassungsgericht. Die <strong>Bundesversammlung</strong> gehört <strong>nicht</strong> dazu: Sie ist kein ständiges Organ, sie tritt nur zur Präsidentenwahl zusammen."},
  {"id":"k-vak-26","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Was beschreibt das Entschließungsermessen?","a":"Das <strong>„Ob\"</strong>: Ob die Behörde überhaupt tätig wird (§ 40 VwVfG)."},
  {"id":"k-vak-27","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Was beschreibt das Auswahlermessen?","a":"Das <strong>„Wie\"</strong>: Auswahl der passenden Maßnahme oder des Adressaten bei mehreren erlaubten Möglichkeiten."},
  {"id":"k-vak-28","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Woran erkennt man in einer Norm typischerweise ein Ermessen?","a":"An <strong>„kann\"</strong> oder <strong>„darf\"</strong>. „Muss\" oder „ist\" weisen auf eine gebundene Entscheidung hin."},
  {"id":"k-vak-29","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Was versteht man unter Ermessensreduzierung auf Null?","a":"Durch besondere Umstände bleibt nur noch <strong>eine einzige rechtmäßige Entscheidung</strong>, jede andere wäre rechtswidrig. Beispiel: Gefahr für Leib und Leben, Einschreiten zwingend."},
  {"id":"k-vak-30","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Nenne die Stufen der Verhältnismäßigkeitsprüfung. Ist die „Rechtmäßigkeit“ eine eigene Stufe?","a":"Legitimer Zweck, <strong>Geeignetheit, Erforderlichkeit, Angemessenheit</strong>. Nein, die „Rechtmäßigkeit\" ist keine eigene Stufe, sondern das Ergebnis der Prüfung."},
  {"id":"k-vak-31","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Was prüft die Erforderlichkeit, was die Angemessenheit?","a":"Erforderlichkeit: kein <strong>milderes, gleich wirksames Mittel</strong>. Angemessenheit: kein Nachteil außer Verhältnis zum Erfolg, Abwägung Eingriffsschwere gegen Bedeutung des abzuwehrenden Schadens (§ 15 Abs. 2 OBG; § 44 Abs. 2 S. 4 BHKG)."},
  {"id":"k-vak-32","cat":"VAk · Verwaltungsrecht","q":"Was ist ein Verwaltungsakt nach § 35 VwVfG?","a":"<strong>Maßnahme einer Behörde zur Regelung eines Einzelfalls auf dem Gebiet des öffentlichen Rechts mit Außenwirkung</strong> (§ 35 Satz 1 VwVfG)."},
  {"id":"k-vak-33","cat":"VAk · Verwaltungsrecht","q":"Welches Merkmal ist das zentrale Tatbestandsmerkmal des Verwaltungsakts?","a":"Die <strong>Regelung</strong>. Schriftform, gerichtlicher Ursprung oder Zivilrechtsbezug sind nicht erforderlich."},
  {"id":"k-vak-34","cat":"VAk · Verwaltungsrecht","q":"Was bedeutet Außenwirkung beim Verwaltungsakt?","a":"Rechtswirkung gegenüber einer <strong>außerhalb der Verwaltung stehenden Person</strong>. Rein interne Abläufe oder innerdienstliche Anweisungen haben keine Außenwirkung."},
  {"id":"k-vak-35","cat":"VAk · Verwaltungsrecht","q":"Welche Maßnahme ist kein Verwaltungsakt: Baugenehmigung, Versetzung eines Beamten, Halteverbotsschild oder Ankündigung eines Gesetzesvorhabens auf einer Pressekonferenz?","a":"Die <strong>Ankündigung eines Gesetzesvorhabens</strong>: politische Aussage ohne Regelung eines Einzelfalls. Das Halteverbotsschild gilt als Allgemeinverfügung."},
  {"id":"k-vak-36","cat":"VAk · Verwaltungsrecht","q":"Was ist eine Allgemeinverfügung?","a":"Ein Verwaltungsakt, der sich an einen nach allgemeinen Merkmalen bestimmten oder bestimmbaren Personenkreis richtet bzw. an eine <strong>unbestimmte Vielzahl von Personen</strong> (§ 35 Satz 2 VwVfG). Beispiele: Halteverbotsschild, Absperrung eines Gefahrenbereichs."},
  {"id":"k-vak-37","cat":"VAk · Verwaltungsrecht","q":"Wie behandelt die Rechtsprechung Ampel- und Handzeichen der Polizei?","a":"Als Verwaltungsakte in Form von <strong>Allgemeinverfügungen</strong>, gerichtet an die anwesenden Verkehrsteilnehmer (Polizeizeichen: § 36 StVO)."},
  {"id":"k-vak-38","cat":"VAk · Verwaltungsrecht","q":"Was ist ein Realakt?","a":"Schlichtes <strong>tatsächliches Verwaltungshandeln ohne Regelungswirkung</strong> in Erfüllung öffentlicher Aufgaben, z. B. Auskunft, Warnung, Absperren einer Unfallstelle. Abgrenzung: Der Verwaltungsakt regelt einen Einzelfall mit Außenwirkung."},
  {"id":"k-vak-39","cat":"VAk · Verwaltungsrecht","q":"Was ist vor Erlass eines belastenden Verwaltungsaktes grundsätzlich erforderlich?","a":"Die <strong>Anhörung</strong> des Betroffenen (§ 28 Abs. 1 VwVfG)."},
  {"id":"k-vak-40","cat":"VAk · Verwaltungsrecht","q":"Wann kann auf die Anhörung verzichtet werden?","a":"Wenn <strong>§ 28 Abs. 2 VwVfG</strong> das zulässt, z. B. bei Gefahr im Verzug, Allgemeinverfügungen oder Massenverfahren. „Nur bei Gefahr im Verzug\" wäre zu eng."},
  {"id":"k-vak-41","cat":"VAk · Verwaltungsrecht","q":"Was gilt, wenn eine erforderliche Anhörung unterblieben ist?","a":"Der Verfahrensfehler ist <strong>heilbar</strong>, die Anhörung kann nachgeholt werden (§ 45 VwVfG). Der VA ist nicht automatisch nichtig."},
  {"id":"k-vak-42","cat":"VAk · Verwaltungsrecht","q":"Wann wird ein Verwaltungsakt wirksam?","a":"Mit seiner <strong>Bekanntgabe</strong> (§§ 41, 43 VwVfG), nicht erst mit Unterschrift, Veröffentlichung oder Zustimmung des Betroffenen."},
  {"id":"k-vak-43","cat":"VAk · Verwaltungsrecht","q":"Was ist eine Nebenbestimmung?","a":"Eine Regelung, die den Verwaltungsakt <strong>inhaltlich oder zeitlich einschränkt</strong> (§ 36 VwVfG)."},
  {"id":"k-vak-44","cat":"VAk · Verwaltungsrecht","q":"Was ist eine Bedingung im Sinne des § 36 VwVfG?","a":"Eine vom <strong>ungewissen Eintritt eines künftigen Ereignisses</strong> abhängige Regelung (§ 36 Abs. 2 Nr. 2 VwVfG)."},
  {"id":"k-vak-45","cat":"VAk · Verwaltungsrecht","q":"Was ist eine Auflage (§ 36 VwVfG)?","a":"Sie verpflichtet die begünstigte Person zu einem <strong>zusätzlichen Tun, Dulden oder Unterlassen</strong> (§ 36 Abs. 2 Nr. 4 VwVfG). Der Hauptverwaltungsakt bleibt voll wirksam."},
  {"id":"k-vak-46","cat":"VAk · Verwaltungsrecht","q":"Unterschied Auflage und Bedingung?","a":"Bedingung: die <strong>Wirksamkeit</strong> des Hauptverwaltungsakts steht infrage (tritt erst ein oder entfällt).<br>Auflage: Hauptverwaltungsakt bleibt wirksam, die Auflage ist <strong>eigenständig durchsetzbar</strong>."},
  {"id":"k-vak-47","cat":"VAk · Verwaltungsrecht","q":"Welche Anforderung stellt § 37 VwVfG an den Tenor eines Verwaltungsaktes?","a":"Er muss <strong>hinreichend bestimmt</strong> sein, also klar und vollziehbar sagen, was die Behörde verlangt. Mündliche VAs sind zulässig (§ 37 Abs. 2 VwVfG)."},
  {"id":"k-vak-48","cat":"VAk · Verwaltungsrecht","q":"Stimmt das? Die Begründung eines Verwaltungsaktes darf allgemeine Floskeln enthalten, wenn der Tenor eindeutig ist.","a":"<strong>Falsch.</strong> § 39 VwVfG verlangt eine konkrete, nicht floskelhafte Begründung mit den tragenden rechtlichen Gründen."},
  {"id":"k-vak-49","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Welche Zwangsmittel nennt § 9 Abs. 1 VwVG?","a":"<strong>Zwangsgeld, Ersatzvornahme, unmittelbarer Zwang</strong> (im Bundes-VwVG §§ 11, 10, 12)."},
  {"id":"k-vak-50","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Was muss vor dem Einsatz von Zwangsmitteln vorliegen?","a":"Ein <strong>wirksamer Verwaltungsakt, der nicht befolgt wird</strong> (§ 6 Abs. 1 VwVG des Bundes bzw. § 55 Abs. 1 VwVG NRW)."},
  {"id":"k-vak-51","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Unterschied Verwaltungsvollstreckung und Sofortvollzug?","a":"Der Sofortvollzug erfolgt <strong>ohne vorherigen Verwaltungsakt</strong>, wenn dessen vorherige Bekanntgabe den Zweck der Maßnahme vereiteln würde (§ 6 Abs. 2 VwVG)."},
  {"id":"k-vak-52","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Welche Wirkung hat ein Widerspruch gegen einen belastenden Verwaltungsakt?","a":"<strong>Aufschiebende Wirkung</strong> (§ 80 Abs. 1 VwGO). Der VA wird dadurch weder nichtig noch verzögert sich die Zustellung."},
  {"id":"k-vak-53","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Wie kann ein VA trotz Widerspruchs sofort vollzogen werden?","a":"Durch <strong>Anordnung der sofortigen Vollziehung mit besonderer schriftlicher Begründung</strong> (§ 80 Abs. 2 Nr. 4, Abs. 3 VwGO)."},
  {"id":"k-vak-54","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Wie kann sich der Adressat gegen die Anordnung der sofortigen Vollziehung wehren?","a":"Mit einem <strong>Eilantrag beim Verwaltungsgericht</strong> (§ 80 Abs. 5 VwGO)."},
  {"id":"k-vak-55","cat":"VAk · Dienstrecht","q":"Was regelt § 34 BeamtStG?","a":"Die Pflicht zum <strong>vollen persönlichen Einsatz</strong>; das Verhalten muss der Achtung und dem Vertrauen gerecht werden, die der Beruf erfordert."},
  {"id":"k-vak-56","cat":"VAk · Dienstrecht","q":"Welche vier Beamtenverhältnisse gibt es nach § 4 BeamtStG? Gibt es einen „Beamten auf Abruf“?","a":"Auf <strong>Lebenszeit, auf Probe, auf Widerruf, auf Zeit</strong>. Einen „Beamten auf Abruf\" gibt es <strong>nicht</strong>."},
  {"id":"k-vak-57","cat":"VAk · Dienstrecht","q":"Welche Staatsangehörigkeit ist Voraussetzung für die Berufung ins Beamtenverhältnis?","a":"<strong>Deutsche oder EU-Staatsangehörigkeit</strong> (§ 7 BeamtStG). § 8 BeamtStG regelt die Ernennung als formalen Akt."},
  {"id":"k-vak-60","cat":"VAk · Dienstrecht","q":"Worauf bezieht sich das statusrechtliche Amt?","a":"Auf die <strong>abstrakte Rechtsstellung</strong> (Laufbahn, Besoldungsgruppe, Amtsbezeichnung), nicht auf die tatsächlich wahrgenommenen Aufgaben (das wäre das Amt im konkret-funktionellen Sinn)."},
  {"id":"k-vak-61","cat":"VAk · Dienstrecht","q":"Welche Kriterien sind bei der Ernennung maßgeblich?","a":"<strong>Eignung, Befähigung und fachliche Leistung</strong> (Art. 33 Abs. 2 GG, Bestenauslese). Der Wohnsitz gehört nicht dazu."},
  {"id":"k-vak-62","cat":"VAk · Dienstrecht","q":"Welche Rolle hat die dienstliche Beurteilung bei der Beförderung?","a":"Sie ist im Rahmen der Bestenauslese regelmäßig das <strong>zentrale Erkenntnismittel</strong> und damit Hauptauswahlkriterium."},
  {"id":"k-vak-63","cat":"VAk · Dienstrecht","q":"Was gehört nicht zu den Dienstpflichten: Neutralitätsgebot, Folgepflicht, Verschwiegenheitspflicht oder wöchentliche Fortbildung?","a":"Die <strong>Pflicht zur wöchentlichen Fortbildung</strong>. Neutralität, Folgepflicht und Verschwiegenheit sind ausdrücklich normiert (§§ 33, 35, 37 BeamtStG)."},
  {"id":"k-vak-64","cat":"VAk · Dienstrecht","q":"Was ist ein Dienstvergehen?","a":"Eine <strong>schuldhafte Verletzung dienstlicher Pflichten</strong> (§ 47 BeamtStG)."},
  {"id":"k-vak-65","cat":"VAk · Dienstrecht","q":"Ein Beamter trägt bei einer privaten politischen Veranstaltung seine Dienstuniform. Welche Normen prüfen Sie?","a":"<strong>§ 33 Abs. 2 BeamtStG</strong> (Mäßigungsgebot) i.V.m. <strong>§ 47 Abs. 1 BeamtStG</strong> (Dienstvergehen)."},
  {"id":"k-vak-66","cat":"VAk · Dienstrecht","q":"Stimmt das? Eine Trunkenheitsfahrt in der Freizeit führt zu einem Disziplinarverfahren.","a":"<strong>Falsch</strong> (pauschal). Außerdienstliches Verhalten ist nur relevant, wenn es in besonderem Maß geeignet ist, Achtung und Vertrauen in einer für das Amt bedeutsamen Weise zu beeinträchtigen (§ 34 Satz 3 BeamtStG)."},
  {"id":"k-vak-67","cat":"VAk · Dienstrecht","q":"Wann muss ein Disziplinarverfahren eingeleitet werden?","a":"Bei <strong>zureichenden tatsächlichen Anhaltspunkten</strong> für ein Dienstvergehen. Es gilt das <strong>Legalitätsprinzip</strong>."},
  {"id":"k-vak-68","cat":"VAk · Dienstrecht","q":"Stimmt das? Dem Dienstvorgesetzten steht Ermessen zu, ob er bei einem bekannt gewordenen Dienstvergehen ein Disziplinarverfahren einleitet.","a":"<strong>Falsch.</strong> Kein Einleitungsermessen: Er muss tätig werden, nur das „Wie\" der Verfahrensführung steht ihm offen."},
  {"id":"k-vak-69","cat":"VAk · Dienstrecht","q":"Was ist der Zweck des Disziplinarrechts?","a":"<strong>Erziehung (Wiedereingliederung) und Funktionssicherung</strong> des Berufsbeamtentums, nicht Bestrafung im strafrechtlichen Sinne."},
  {"id":"k-vak-70","cat":"VAk · Dienstrecht","q":"Welche klassischen Ziele hat das Disziplinarrecht? Gehört die „Privatisierung der Ermittlungen“ dazu?","a":"Anerkannt sind <strong>Erziehungszweck, Schutzfunktion und Reinigungsfunktion</strong>. Die Privatisierung der Ermittlungen gehört <strong>nicht</strong> dazu; das Verfahren bleibt hoheitlich."},
  {"id":"k-vak-71","cat":"VAk · Dienstrecht","q":"Stimmt das? Leistung und Persönlichkeitsbild sind alleiniger Grund für die Bemessung der Disziplinarmaßnahme.","a":"<strong>Falsch.</strong> Ausgangspunkt ist die <strong>Schwere des Dienstvergehens</strong>; Persönlichkeitsbild und bisherige Führung fließen nur ergänzend ein."},
  {"id":"k-vak-72","cat":"VAk · Dienstrecht","q":"Stimmt das? Das Disziplinarrecht ist abschließend durch das Bundesdisziplinargesetz geregelt.","a":"<strong>Falsch.</strong> Das BDG gilt nur für Bundesbeamte; für Landes- und Kommunalbeamte gilt das jeweilige <strong>Landesdisziplinargesetz</strong> (in Berlin das DiszG Bln)."},
  {"id":"k-vak-74","cat":"VAk · Dienstrecht","q":"Was folgt disziplinarisch aus einer rechtskräftigen strafrechtlichen Verurteilung?","a":"<strong>Bindungswirkung</strong> der tatsächlichen Feststellungen des Strafurteils; Abweichung nur unter engen Voraussetzungen. Eigene, widersprechende Tatsachenfeststellungen sind in aller Regel unzulässig."},
  {"id":"k-vak-86","cat":"VAk · Gefahrenabwehr","q":"Gegen welche drei Personengruppen können sich Maßnahmen der Gefahrenabwehr richten?","a":"<strong>Verhaltensstörer, Zustandsstörer, Nichtstörer</strong>."},
  {"id":"k-vak-87","cat":"VAk · Gefahrenabwehr","q":"Wer ist Verhaltensstörer?","a":"Wer die Gefahr durch <strong>eigenes Verhalten</strong> (Tun oder Unterlassen) verursacht (§ 17 OBG)."},
  {"id":"k-vak-88","cat":"VAk · Gefahrenabwehr","q":"Wer ist Zustandsstörer?","a":"Wer die <strong>tatsächliche Gewalt</strong> über eine gefahrverursachende Sache hat oder ihr Eigentümer ist (§ 18 OBG)."},
  {"id":"k-vak-89","cat":"VAk · Gefahrenabwehr","q":"Wann darf ein Nichtstörer in Anspruch genommen werden?","a":"Nur unter engen Voraussetzungen bei gegenwärtiger erheblicher Gefahr: Störer nicht rechtzeitig erreichbar oder Maßnahme unzureichend, Gefahr anders nicht abwendbar, Nichtstörer so wenig wie möglich belastet (§ 19 OBG). Folge: <strong>Entschädigung</strong>."},
  {"id":"k-vak-90","cat":"VAk · Gefahrenabwehr","q":"Wann liegt eine konkrete Gefahr vor?","a":"Wenn bei ungehindertem Ablauf des objektiv zu erwartenden Geschehens <strong>in absehbarer Zeit mit hinreichender Wahrscheinlichkeit ein Schaden</strong> droht. Je höherwertiger das Rechtsgut, desto geringer die nötige Wahrscheinlichkeit."},
  {"id":"k-vak-91","cat":"VAk · Gefahrenabwehr","q":"Was ist eine abstrakte Gefahr?","a":"Eine typischerweise gefährliche Situation, unabhängig vom Einzelfall. Grundlage für generell-abstrakte Regelungen, <strong>nicht</strong> für Einzelfallmaßnahmen."},
  {"id":"k-vak-92","cat":"VAk · Gefahrenabwehr","q":"Was ist eine Anscheinsgefahr?","a":"Ex ante erscheint eine konkrete Gefahr hinreichend wahrscheinlich, nachträglich zeigt sich, dass <strong>keine Gefahr bestand</strong>. Maßgeblich ist die Sicht eines besonnenen, sachkundigen Beobachters im Zeitpunkt des Handelns (<strong>ex ante</strong>)."},
  {"id":"k-vak-93","cat":"VAk · Gefahrenabwehr","q":"Wie beurteilen Sie die Rechtmäßigkeit bei Anscheinsgefahr?","a":"Das Einschreiten war <strong>rechtmäßig</strong>, wenn die Gefahrenprognose ex ante vertretbar war. Sobald der Irrtum erkannt wird, sind alle Maßnahmen <strong>unverzüglich einzustellen</strong>."},
  {"id":"k-vak-94","cat":"VAk · Gefahrenabwehr","q":"Was ist bei der Anscheinsgefahr besonders zu beachten?","a":"Die <strong>Kostenfrage</strong>: Wer trägt die Kosten einer sich als unbegründet herausstellenden Maßnahme?"},
  {"id":"k-vak-95","cat":"VAk · Gefahrenabwehr","q":"Was ist ein Unglücksfall im Sinne des BHKG?","a":"Ein <strong>plötzliches Ereignis</strong>, von dem eine erhebliche Gefahr für Menschen, Tiere, Sachen oder die Umwelt ausgeht (nicht nur Brände oder Explosionen)."},
  {"id":"k-vak-96","cat":"VAk · Gefahrenabwehr","q":"Welche Aufgabe ergibt sich aus § 1 Abs. 1 Nr. 1 BHKG?","a":"Gesetzliche Grundlage für den <strong>vorbeugenden und abwehrenden Brandschutz</strong> zum Schutz der Bevölkerung als Pflichtaufgabe der Gemeinden."},
  {"id":"k-vak-97","cat":"VAk · Gefahrenabwehr","q":"Fall Schornsteinbrand im Altbau: Darf der Einsatzleiter die verschlossene Nachbarwohnung gewaltsam öffnen?","a":"<strong>Ja</strong>, gestützt auf § 41 BHKG NRW i.V.m. Art. 13 Abs. 7 GG. Bei möglicher Brandausbreitung liegt mindestens eine Anscheinsgefahr vor. Verhältnismäßigkeit: wenn zeitlich möglich zuerst Schlüsseldienst, bei Gefahr im Verzug sofort öffnen."},
  {"id":"k-vak-98","cat":"VAk · Gefahrenabwehr","q":"Fall Schornsteinbrand: Darf die Wohnung eines widersprechenden Mieters (pensionierter Feuerwehrmann) betreten werden?","a":"<strong>Ja.</strong> Bezüglich der Nachbarwohnung ist er nicht Inhaber und kann nicht wirksam entscheiden, sein Widerspruch ist unbeachtlich. Sein Beruf spielt rechtlich keine Rolle."},
  {"id":"k-vak-99","cat":"VAk · Gefahrenabwehr","q":"Was beachten Sie beim Verlassen der Einsatzstelle nach dem Öffnen einer Wohnung?","a":"Wohnung <strong>sichern bzw. wieder verschließen</strong>, Bewohner und Eigentümer informieren, Vorgang und Gründe <strong>dokumentieren</strong>, keine Glutnester zurücklassen."},
  {"id":"k-vak-100","cat":"VAk · Gefahrenabwehr","q":"Fall: Rauchmelder piept, niemand öffnet, Feuerwehr bricht die Tür auf, Melder war defekt. War das rechtmäßig? Ersatz für die Tür?","a":"<strong>Rechtmäßig</strong> wegen Anscheinsgefahr (ex ante, § 41 BHKG NRW i.V.m. Art. 13 Abs. 7 GG). Bei rechtmäßiger Maßnahme in der Regel kein Schadensersatz; ein Ausgleich richtet sich nach den landesrechtlichen Kostenerstattungsregeln."},
  {"id":"k-vak-101","cat":"VAk · Gefahrenabwehr","q":"Fall: Kellerbrand, der Eigentümer verbietet den Zutritt zu einem vermieteten Kellerraum. Darf geöffnet werden?","a":"<strong>Ja.</strong> Bei Rauchausbreitungsgefahr besteht eine konkrete Gefahr, die die Kontrolle aller betroffenen Räume rechtfertigt (§ 41 BHKG NRW). Weder Eigentümer noch Mieter können ein wirksames Zutrittsverbot setzen. Danach sichern und beide informieren."},
  {"id":"k-vak-102","cat":"VAk · Fallbearbeitung","q":"Wie lauten die Prüfungsschritte des Fallbearbeitungsschemas im Feuerwehreinsatz?","a":"1 Ermächtigungsgrundlage, 2 Zuständigkeit, 3 Vorliegen einer Gefahr, 4 Störerauswahl, 5 Ermessen, 6 Verhältnismäßigkeit, 7 Rechtsfolge, 8 Kosten- und Entschädigungsfragen, 9 Dokumentation und Sicherung."},
  {"id":"k-vak-103","cat":"VAk · Fallbearbeitung","q":"Fallschema Schritt 1: Wann liegt ein Verwaltungsakt vor, wann ein Realakt?","a":"VA nach § 35 VwVfG: hoheitliche Maßnahme einer Behörde, öffentliches Recht, <strong>Regelung eines Einzelfalls mit Außenwirkung</strong>; auch Anweisungen an Störer. <strong>Realakt</strong>: schlichtes Handeln ohne Regelung, z. B. wenn kein Adressat vor Ort ist."},
  {"id":"k-vak-104","cat":"VAk · Fallbearbeitung","q":"Welche Ermächtigungsgrundlagen nennt das Schema für das Feuerwehrhandeln?","a":"<strong>§ 1 Abs. 1 Nr. 1 BHKG</strong> und § 3 Abs. 1 BHKG (Aufgabenzuweisung), <strong>§ 34 Abs. 2 BHKG</strong> (Hilfeleistung bei Notlagen), <strong>§ 44 Abs. 2 BHKG</strong> (Betreten, Anordnungen, unmittelbarer Zwang), flankiert von § 1 Abs. 1 OBG."},
  {"id":"k-vak-105","cat":"VAk · Fallbearbeitung","q":"Schritt 2 Zuständigkeit: Woraus ergeben sich sachliche, örtliche und instanzielle Zuständigkeit der Feuerwehr?","a":"Sachlich: § 1 Abs. 1 Nr. 1, 2 i.V.m. § 3 Abs. 1 S. 1 BHKG. Örtlich: Gemeindegebiet (§ 3 Abs. 1 S. 1 BHKG, § 4 Abs. 1 OBG). Instanziell: Feuerwehr als behördliche Einrichtung der Gemeinde (Art. 28 Abs. 2 GG, § 5 Abs. 1 OBG)."},
  {"id":"k-vak-106","cat":"VAk · Fallbearbeitung","q":"Welche Verfahrensanforderungen gelten für einen VA bei Gefahr im Verzug?","a":"Anhörungsverzicht (<strong>§ 28 Abs. 2 Nr. 1 VwVfG</strong>), mündliche Form (§ 37 Abs. 2 VwVfG), Begründung bei mündlichem VA nicht erforderlich (§ 39 Abs. 1 S. 1 VwVfG), mündliche Bekanntgabe (§ 41 Abs. 1 VwVfG)."},
  {"id":"k-vak-107","cat":"VAk · Fallbearbeitung","q":"Welche Verfahrensanforderungen des VwVfG gelten bei einem Realakt?","a":"<strong>Keine</strong>: weder Anhörung (§ 28), Form (§ 37) noch Bekanntgabe (§ 41). Es genügen die materiellen Schritte."},
  {"id":"k-vak-108","cat":"VAk · Fallbearbeitung","q":"Fallschema Schritt 5: Wann ist das Entschließungsermessen auf Null reduziert?","a":"Bei hochrangigen Rechtsgütern (<strong>Leib, Leben</strong>) ist das Einschreiten zwingend. Das Auswahlermessen übt der Einsatzleiter pflichtgemäß aus (§ 34 Abs. 2 BHKG): Wirksamkeit, Zumutbarkeit, Verhältnismäßigkeit."},
  {"id":"k-vak-109","cat":"VAk · Fallbearbeitung","q":"Wie formulieren Sie die Rechtsfolge (Inhalt des VA) im Fallschema?","a":"Anhand der <strong>W-Fragen</strong>: Wer? Was? Wann? Wohin? Wie (lang)? Bei Weigerung <strong>unmittelbarer Zwang</strong> nach § 44 Abs. 2 BHKG, bei Gefahr im Verzug sofortiger Vollzug ohne vorherige Androhung."},
  {"id":"k-vak-110","cat":"VAk · Fallbearbeitung","q":"Wann besteht ein Entschädigungsanspruch nach § 45 BHKG?","a":"Wenn ein <strong>Nichtstörer</strong> (§ 19 OBG) in Anspruch genommen wurde: angemessene Entschädigung durch die Gemeinde, auch bei rechtmäßiger Inanspruchnahme. Kein Anspruch bei Störern oder wenn kein Dritter herangezogen wurde."},
  {"id":"k-vak-111","cat":"VAk · Fallbearbeitung","q":"Was gehört in die Dokumentation und Sicherung am Einsatzende?","a":"Einsatzbericht (<strong>§ 34 Abs. 1 BHKG</strong>) mit Maßnahmen, Rechtsgrundlage, Gründen und Zeitpunkten; Einsatzstelle sichern oder übergeben; ggf. Ordnungsbehörde (§ 24 Abs. 1 Nr. 2 OBG) oder Polizei (§ 43 Nr. 1 PolG NRW) informieren, Eigentümer benachrichtigen."},
  {"id":"k-vak-112","cat":"VAk · Fallbearbeitung","q":"Fall 1 (Heimrauchmelder piept, Tür gewaltsam geöffnet, Wohnung leer): VA oder Realakt, und warum rechtmäßig?","a":"<strong>Realakt</strong>, da kein Adressat anwesend. Rechtmäßig wegen <strong>Anscheinsgefahr</strong> (piept nachts, älterer Bewohner, keine Reaktion, ex ante vertretbar). Ermessen auf Null, § 44 Abs. 2 BHKG."},
  {"id":"k-vak-113","cat":"VAk · Fallbearbeitung","q":"Fall 1 (Heimrauchmelder piept, Tür gewaltsam geöffnet, Wohnung leer): Besteht ein Entschädigungsanspruch des Eigentümers für die Tür nach § 45 BHKG?","a":"<strong>Nein.</strong> Es wurde kein Nichtstörer in Anspruch genommen, die Feuerwehr handelte per Realakt ohne Adressaten."},
  {"id":"k-vak-114","cat":"VAk · Fallbearbeitung","q":"Fall 2 (Gasgeruch im Supermarkt, Filialleiter verweigert Räumung wegen Umsatz): Handlungsform und Gefahr?","a":"Räumungsanordnung = <strong>mündlicher Verwaltungsakt</strong> (Anhörungsverzicht § 28 Abs. 2 Nr. 1 VwVfG). <strong>Konkrete Gefahr</strong>, da der Gasgeruch von der Feuerwehr bestätigt wurde. Umsatzverlust ist rechtlich ohne Belang (Angemessenheit)."},
  {"id":"k-vak-115","cat":"VAk · Fallbearbeitung","q":"Fall 2 (Gasgeruch im Supermarkt, Filialleiter verweigert Räumung wegen Umsatz): Wer ist Störer und wer Adressat der Räumungsanordnung?","a":"Filialleiter = <strong>Verhaltensstörer</strong> (§ 17 OBG, verweigert die Räumung), Eigentümer/Betreiber = <strong>Zustandsstörer</strong> (§ 18 OBG). Adressat: der anwesende Filialleiter. Bei Weigerung unmittelbarer Zwang; <strong>kein</strong> Anspruch nach § 45 BHKG."},
  {"id":"k-vak-116","cat":"VAk · Fallbearbeitung","q":"Fall 3 (brennendes E-Fahrzeug in Tiefgarage, andere Fahrzeuge werden per Seilwinde umgesetzt): Wer ist Nichtstörer, welche Handlungsform?","a":"Eigentümer der <strong>anderen Fahrzeuge</strong> sind Nichtstörer (§ 19 OBG); Eigentümer des brennenden E-Fahrzeugs ist Zustandsstörer. Umsetzen = <strong>Realakt</strong>, Duldungsanordnung an anwesende Eigentümer = VA. Lackschäden sind gegenüber dem Brandschaden angemessen."},
  {"id":"k-vak-117","cat":"VAk · Fallbearbeitung","q":"Fall 3 (brennendes E-Fahrzeug in Tiefgarage, andere Fahrzeuge werden per Seilwinde umgesetzt): Welcher Anspruch besteht für die Eigentümer der umgesetzten Fahrzeuge?","a":"<strong>Entschädigung</strong> durch die Gemeinde nach § 45 Abs. 2 BHKG (Nichtstörer). Eigentümer informieren und im Einsatzbericht dokumentieren."},
  {"id":"k-vak-118","cat":"VAk · Fallbearbeitung","q":"Fall 4 (umgestürzter Salzsäure-Tanklastzug, Sicherheitszone auf Privatgrundstück, Eigentümer verweigert): Rechtliche Einordnung?","a":"Duldungsanordnung = <strong>VA</strong> (§ 44 Abs. 2 i.V.m. § 45 BHKG). Grundstückseigentümer = <strong>Nichtstörer</strong>, Fahrer = Verhaltensstörer, Halter und Ladungseigentümer = Zustandsstörer. Bei Weigerung unmittelbarer Zwang; Entschädigung nach § 45 Abs. 2 BHKG."},
  {"id":"k-vak-119","cat":"VAk · Fallbearbeitung","q":"Fall 4 (umgestürzter Salzsäure-Tanklastzug, Sicherheitszone auf Privatgrundstück, Eigentümer verweigert): Was ist beim Verlassen des Privatgrundstücks zu beachten?","a":"Grundstück in <strong>ursprünglichem Zustand übergeben</strong>, Eigentümer über den Entschädigungsanspruch informieren, Übergabe an Polizei und Straßenverkehrsbehörde sicherstellen, im Einsatzbericht dokumentieren."},
  {"id":"k-vak-120","cat":"VAk · Fallbearbeitung","q":"Fall 5 (Hallendach droht einzustürzen, Halle leer): Handlungsform der Absperrung?","a":"<strong>Allgemeinverfügung</strong> (§ 35 Satz 2 VwVfG), gerichtet an alle potenziell Betretenden. Kein Nichtstörer in Anspruch genommen, daher kein Anspruch nach § 45 BHKG."},
  {"id":"k-vak-121","cat":"VAk · Fallbearbeitung","q":"Fall 5 (Hallendach droht einzustürzen, Halle leer): Was darf die Feuerwehr bei drohendem Hallendacheinsturz tun und was nicht?","a":"Die Einsturzgefahr selbst <strong>nicht beseitigen</strong> (keine Zuständigkeit für Tragwerksicherung). Maßnahmen: <strong>beide Zugänge</strong> absperren, Bauaufsicht und THW (Fachberater Statik) benachrichtigen, kontrolliert an die Ordnungsbehörde übergeben."},
  {"id":"k-vak-122","cat":"VAk · Fallbearbeitung","q":"Fall 5 (Hallendach droht einzustürzen, Halle leer): Wer ist Verhaltens- und Zustandsstörer?","a":"Verhaltensstörer: Betonmischer-Fahrer bzw. Firma (<strong>§ 17 OBG</strong>). Zustandsstörer: Hallen-Eigentümer (<strong>§ 18 OBG</strong>). Relevant für Kostenersatz und Weiterleitung an die Bauaufsicht."},
  {"id":"k-vak-123","cat":"VAk · Fallbearbeitung","q":"Fall 6 (Schornsteinbrand, unbesetzte Nachbarwohnung, Mieter verweigert Zutritt): Realakt oder VA?","a":"Öffnen der <strong>unbesetzten</strong> Nachbarwohnung = <strong>Realakt</strong> (§ 44 Abs. 2 BHKG, Art. 13 Abs. 7 GG). Betreten der <strong>besetzten</strong> Wohnung gegen den Willen = Duldungsanordnung als <strong>VA</strong>, notfalls unmittelbarer Zwang."},
  {"id":"k-vak-124","cat":"VAk · Fallbearbeitung","q":"Fall 6 (Schornsteinbrand, unbesetzte Nachbarwohnung, Mieter verweigert Zutritt): Welche Rolle spielt die Weigerung des Mieters bezüglich der Nachbarwohnung?","a":"Er ist für die fremde Wohnung <strong>nicht verfügungsberechtigt</strong>, seine Weigerung ist rechtlich ohne Belang. Sein früherer Beruf ändert nichts; er ist kein Störer und hat keinen Anspruch nach § 45 BHKG."},
  {"id":"k-feuak-01","cat":"FeuAK · Haushalt","q":"Warum ist langfristige Planung im Haushaltswesen der Feuerwehr zwingend?","a":"Der Weg von Anmeldung über Parlament bis Aufsichtsbehörde dauert bis zu <strong>18 Monate</strong>. Der Haushalt gilt <strong>1 Jahr</strong>, Änderungen nur durch das Parlament. Daher rechtzeitige, begründete Bedarfsanmeldung."},
  {"id":"k-feuak-02","cat":"FeuAK · Haushalt","q":"Welcher Konflikt besteht zwischen Feuerwehr und Haushaltswesen?","a":"<strong>Schnelles Handeln</strong> (Sicherstellungsauftrag, Flexibilität) gegen <strong>Verwaltungsdenken</strong>."},
  {"id":"k-feuak-03","cat":"FeuAK · Haushalt","q":"Welche Konsequenz hat das Vergaberecht für die Haushaltsplanung der Feuerwehr?","a":"<strong>Keine Vergabe ohne Haushaltsmittel.</strong> Konsequenz: Rahmenverträge, technische Reserve, Vorausplanung."},
  {"id":"k-feuak-04","cat":"FeuAK · Haushalt","q":"Was bedeutet der Steuerungsauftrag der Feuerwehr im Haushalt?","a":"Die Feuerwehr gibt der Politik Strukturen vor: <strong>strategisch</strong> über den Haushalt, <strong>operativ</strong> über die KLR."},
  {"id":"k-feuak-10","cat":"FeuAK · Haushalt","q":"Wie lauten die vier Schritte des Wegs eines Haushalts?","a":"1. <strong>Bedarfsanmeldung</strong> 2. <strong>Priorisierung</strong> 3. <strong>Ansatzermittlung</strong> 4. <strong>Beschluss</strong> des Gemeinderats als Satzung."},
  {"id":"k-feuak-11","cat":"FeuAK · Haushalt","q":"Was geschieht bei der Bedarfsanmeldung?","a":"Die Feuerwehr meldet Ausrüstung und Technik für das kommende Jahr an, getrennt nach <strong>fixen Kosten</strong> (Mieten, Verträge) und <strong>variablen Kosten</strong> (Projekte, Sonderbeschaffungen), mit fachlicher Begründung."},
  {"id":"k-feuak-12","cat":"FeuAK · Haushalt","q":"Wer priorisiert die Anträge im Haushaltsverfahren und wonach?","a":"Gemeinde (Kämmerei/Verwaltungsführung) und <strong>Wehrleitung</strong> nach Dringlichkeit und Relevanz; politische und finanzielle Abwägungen fließen ein."},
  {"id":"k-feuak-13","cat":"FeuAK · Haushalt","q":"Was ist die Ansatzermittlung?","a":"Die <strong>Kämmerei</strong> legt konkrete Geldbeträge im Haushaltsplanentwurf fest; der Entwurf geht in die politische Beratung."},
  {"id":"k-feuak-14","cat":"FeuAK · Haushalt","q":"Wann stehen Haushaltsmittel verbindlich zur Verfügung?","a":"Nach dem Beschluss des Gemeinderats als <strong>Satzung</strong>. Erst dann ist eine Vergabe möglich."},
  {"id":"k-feuak-15","cat":"FeuAK · Haushalt","q":"Wodurch ist die Kameralistik gekennzeichnet?","a":"Zahlungsorientiertes Buchungssystem: <strong>Kassensteuerung</strong> (Ein-/Auszahlungen), Fokus auf Geldverbrauch ohne Vermögensausweis und <strong>ohne Abschreibungen</strong>, strikte <strong>Mittelkontrolle</strong>. Sie misst nicht den inhaltlichen Einsatzerfolg."},
  {"id":"k-feuak-16","cat":"FeuAK · Haushalt","q":"Wodurch ist die Doppik gekennzeichnet?","a":"Kaufmännisches Rechnungswesen aus <strong>Bilanz, Ergebnisrechnung und Finanzrechnung</strong>. Sie zeigt <strong>Ressourcenverbrauch</strong> (Abschreibungen), <strong>Transparenz</strong> (Vermögen, Schulden, Pensionsrückstellungen) und fördert <strong>Generationengerechtigkeit</strong>."},
  {"id":"k-feuak-17","cat":"FeuAK · Haushalt","q":"Worin liegt der Kernunterschied zwischen Kameralistik und Doppik?","a":"Kameralistik: Geldverbrauch und Liquidität, kein Werteverzehr. Doppik: <strong>periodengerechter Ressourcenverbrauch</strong>, macht Substanzverlust sichtbar."},
  {"id":"k-feuak-18","cat":"FeuAK · Haushalt","q":"Wofür steht die Abkürzung NKF/NKHR im Zusammenhang mit der Doppik?","a":"Sie stehen für die Doppik (doppelte Buchführung) in der Kommunalverwaltung."},
  {"id":"k-feuak-19","cat":"FeuAK · Haushalt","q":"Welche drei Säulen hat das 3-Säulen-Modell des doppischen Haushalts?","a":"<strong>Finanzhaushalt</strong> (Liquidität, Ein-/Auszahlungen), <strong>Ergebnishaushalt</strong> (Aufwand/Ertrag, Ausgleich am Jahresende), <strong>Vermögenshaushalt/Bilanz</strong> (Aktiva/Passiva)."},
  {"id":"k-feuak-20","cat":"FeuAK · VWL","q":"Was bedeutet indirekte Wertschöpfung der Feuerwehr?","a":"Die Feuerwehr produziert keine Güter, <strong>verhindert aber deren Zerstörung</strong>. Der Schutz von Sachwerten und Infrastruktur ist eine real erbrachte, nicht direkt sichtbare Wirtschaftsleistung."},
  {"id":"k-feuak-21","cat":"FeuAK · VWL","q":"Welche Rolle spielt der Faktor Zeit bei der indirekten Wertschöpfung?","a":"Schnelle Eingreifzeiten begrenzen den Schaden; jede Minute früherer Intervention reduziert direkte Sach- und Folgeschäden."},
  {"id":"k-feuak-22","cat":"FeuAK · VWL","q":"Was bedeutet Betriebserhalt als Kategorie der indirekten Wertschöpfung?","a":"Ein gelöschtes Firmengebäude verhindert Produktionsausfälle, Lieferkettenausfälle und ggf. dauerhafte Betriebsschließungen."},
  {"id":"k-feuak-23","cat":"FeuAK · VWL","q":"Was bedeutet Existenzsicherung als Kategorie der indirekten Wertschöpfung?","a":"Schutz von Betriebsstätten sichert lokale <strong>Arbeitsplätze und Steuereinnahmen</strong>. Feuerwehrausgaben stabilisieren so indirekt die kommunale Haushaltsbasis."},
  {"id":"k-feuak-24","cat":"FeuAK · VWL","q":"Warum ist das Argument der indirekten Wertschöpfung bei knappen Kassen wichtig?","a":"Es zeigt den wirtschaftlichen Nutzen der Feuerwehr: Ausgaben verhindern höhere Schäden. Vier Kategorien: indirekte Wertschöpfung, Faktor Zeit, Betriebserhalt, Existenzsicherung."},
  {"id":"k-feuak-25","cat":"FeuAK · VWL","q":"Was ist eine Kosten-Nutzen-Analyse (KNA)?","a":"<strong>Systematischer Vergleich aller Kosten und Nutzen</strong> einer Maßnahme in Geldwerten; gesetzliche Grundlage bei finanzwirksamen Entscheidungen (<strong>HGrG</strong>). Überwiegt der Nutzen, gilt die Maßnahme als wirtschaftlich vertretbar."},
  {"id":"k-feuak-26","cat":"FeuAK · VWL","q":"Wozu dient die KNA als Entscheidungshilfe?","a":"Sie objektiviert die Auswahl zwischen Investitionsalternativen (z. B. Fahrzeugtypen, Standorte) und macht Entscheidungen rational begründbar und für Dritte nachvollziehbar."},
  {"id":"k-feuak-27","cat":"FeuAK · VWL","q":"Warum ist die KNA ein Wirtschaftlichkeitsnachweis?","a":"Sie ist bei finanzwirksamen Maßnahmen gesetzlich vorgeschrieben (<strong>HGrG</strong>); ohne Nachweis sind Ausgaben formal nicht zulässig."},
  {"id":"k-feuak-28","cat":"FeuAK · VWL","q":"Was leistet der Makro-Blick der KNA?","a":"Er erfasst auch <strong>gesellschaftliche Wohlfahrtseffekte</strong> (verhinderte Umweltschäden, öffentliche Sicherheit, Lebensqualität) über direkte Ausgaben hinaus."},
  {"id":"k-feuak-29","cat":"FeuAK · VWL","q":"Wie hilft die KNA bei der Priorisierung?","a":"Sie verhindert Fehlinvestitionen durch Nachweis des langfristigen Mehrwerts und ermöglicht eine fundierte Priorisierung konkurrierender Ausgaben."},
  {"id":"k-feuak-30","cat":"FeuAK · QM","q":"Mit welcher Struktur beschreibt man Qualität in einem Feuerwehrbereich?","a":"<strong>Bereich → Produkte → Beteiligte (Kunden) → Kennzahl</strong>; mindestens zwei Bereiche nennen."},
  {"id":"k-feuak-31","cat":"FeuAK · QM","q":"Produkte, Beteiligte und Kennzahlen im abwehrenden Brandschutz?","a":"Produkte: Brandbekämpfung, TH. Beteiligte: Bürger (<strong>Hilfsfristerreichungsgrad</strong>), Politik (Kosten je Risikokategorie)."},
  {"id":"k-feuak-32","cat":"FeuAK · QM","q":"Produkte, Beteiligte und Kennzahlen bei der Leitstelle?","a":"Produkte: Notrufannahme und Disposition. Beteiligte: Bürger (<strong>Quote angenommener Notrufe</strong>), Kostenträger (RD-Gebühr)."},
  {"id":"k-feuak-33","cat":"FeuAK · QM","q":"Produkte, Beteiligte und Kennzahlen bei der Ausbildung?","a":"Produkte: Grund- und Spezialausbildung. Beteiligte: Mitarbeiter (<strong>Ausbildungsquote</strong>), BGU (qualifizierter EK-Anteil)."},
  {"id":"k-feuak-34","cat":"FeuAK · QM","q":"Produkte, Beteiligte und Kennzahlen im Rettungsdienst?","a":"Produkte: Notfallrettung, KTW. Beteiligte: Patient (<strong>Hilfsfristerreichungsgrad RD</strong>), Kostenträger (Kosten je Einsatz)."},
  {"id":"k-feuak-35","cat":"FeuAK · QM","q":"Welche vier Perspektiven hat die Balanced Scorecard?","a":"<strong>Finanzen</strong>, <strong>Kunden</strong>, <strong>Interne Prozesse</strong>, <strong>Lernen und Entwicklung</strong>."},
  {"id":"k-feuak-36","cat":"FeuAK · QM","q":"Welche Beispiel-Kennzahlen gehören zu den BSC-Perspektiven Finanzen und Kunden?","a":"Finanzen: Budgettreue, Kosten je Einsatz, Investitionsquote. Kunden: Hilfsfristerfüllungsquote, Sicherheitsgefühl der Bevölkerung."},
  {"id":"k-feuak-37","cat":"FeuAK · QM","q":"Welche Beispiel-Kennzahlen gehören zu den BSC-Perspektiven Interne Prozesse und Lernen/Entwicklung?","a":"Prozesse: Ausrückzeit, Fahrzeugverfügbarkeit, Ausbildungsstand. Lernen/Entwicklung: Fortbildungsquote, Personalentwicklung, Digitalisierung."},
  {"id":"k-feuak-38","cat":"FeuAK · QM","q":"Welche Blickwinkel gelten für die Feuerwehr (F93)?","a":"<strong>Kunden/Bevölkerung</strong>, <strong>Geschäftsführung/Politik</strong>, <strong>eigene Organisation</strong>."},
  {"id":"k-feuak-39","cat":"FeuAK · QM","q":"Warum braucht man verschiedene Blickwinkel auf Qualität?","a":"Dieselbe Leistung hat je Beteiligtem andere Qualitätsansprüche und Indikatoren. Steuerung auf zwei Ebenen: stadtgesamt (politisch/strategisch) und Ausrückbereich/Dienstgruppe (taktisch/operativ)."},
  {"id":"k-feuak-40","cat":"FeuAK · PM","q":"Welche drei Kernkennzahlen nutzt die strategische Personalplanung?","a":"<strong>Ist-Personalfaktor</strong>, <strong>Ist-Stellenfaktor</strong>, <strong>Soll-Stellenfaktor</strong>."},
  {"id":"k-feuak-41","cat":"FeuAK · PM","q":"Wie berechnet sich der Ist-Personalfaktor?","a":"<strong>8.760 h ÷ Netto-JAZ</strong> (Netto-JAZ = JAZ minus alle Ausfälle) = tatsächlich benötigte Mitarbeiter je Funktion."},
  {"id":"k-feuak-42","cat":"FeuAK · PM","q":"Wie berechnet sich der Ist-Stellenfaktor?","a":"<strong>Planstellen ÷ zu besetzende Funktionen</strong>."},
  {"id":"k-feuak-43","cat":"FeuAK · PM","q":"Was ist der Soll-Stellenfaktor?","a":"Der politisch beschlossene Faktor mit festem <strong>Besetzungsgrad (ca. 95 %)</strong>."},
  {"id":"k-feuak-44","cat":"FeuAK · PM","q":"Welche Ausfallgründe gehen in die Netto-JAZ ein?","a":"Krankheit, Urlaub, Aus-/Fortbildung, außerhalb Einsatzdienst, Mutterschutz/Elternzeit, Sonstiges."},
  {"id":"k-feuak-45","cat":"FeuAK · PM","q":"Wie wirken Mehrarbeit, Transferleistungen und Funktionsunterschreitung auf den Personalfaktor?","a":"Mehrarbeit-Aufbau erhöht den Faktor, -Abbau verringert ihn; Transferleistungen verringern ihn; Funktionsunterschreitungsstunden erhöhen ihn (keine Verrechnung mit Überschreitungen)."},
  {"id":"k-feuak-46","cat":"FeuAK · PM","q":"Wie nutzt man die Personalkennzahlen strategisch?","a":"Zeitreihenvergleiche, Risikoerkennung, Argumente im <strong>Stellenplanverfahren</strong>; Erhebung mindestens <strong>1× jährlich</strong>."},
  {"id":"k-feuak-47","cat":"FeuAK · PM","q":"Welche Rahmenbedingungen der EU-Arbeitszeitrichtlinie gelten für Schichtmodelle?","a":"Max. <strong>48 h/Woche</strong> im Durchschnitt von 12 Monaten, tägliche Ruhezeit mind. <strong>11 h</strong>, wöchentlich mind. <strong>24 h</strong>, Ruhepause nach 6 h."},
  {"id":"k-feuak-48","cat":"FeuAK · PM","q":"Vor- und Nachteile des 24-Stunden-Dienstes?","a":"Vorteil: beliebt, nur ca. 2 Anwesenheitstage. Nachteil: 11 h Ruhezeit im Rettungsdienst schwer einzuhalten, höheres Unfallrisiko; bei hoher Nachtbelastung ungeeignet."},
  {"id":"k-feuak-49","cat":"FeuAK · PM","q":"Vor- und Nachteile von 12-Stunden-Schichten und Tagesdienst?","a":"12 h: RD-tauglich, Ruhezeit gesichert; aber häufigere Wechsel. Tagesdienst: familienfreundlich, passt zur Einsatzspitze; aber nachts keine Vorhaltung, höherer Personalbedarf."},
  {"id":"k-feuak-50","cat":"FeuAK · PM","q":"Vor- und Nachteile von Wachabteilungsmodellen und flexiblen Modellen?","a":"WA (z. B. Bremer Modell): planbar, viele freie Tage, aber starr. Flexibel (Springerpool, Arbeitszeitkonten): fangen Spitzen ab, aber hoher Planungsaufwand."},
  {"id":"k-feuak-51","cat":"FeuAK · PM","q":"Was ist bei der Wahl des Schichtmodells zu beachten?","a":"Passend zum Vorhaltezeitraum wählen, <strong>Personalfaktor</strong> berechnen (Ausfallzeiten erhöhen ihn), Wechsel behutsam einführen und den Personalrat beteiligen."},
  {"id":"k-feuak-52","cat":"FeuAK · Vergabe","q":"Wann darf die Vergabe einer neuen HLF-Generation angestoßen werden?","a":"Erst, wenn <strong>Haushaltsmittel bereitstehen</strong>. Vorher werden Vergabeunterlagen und Leistungsverzeichnis vorbereitet."},
  {"id":"k-feuak-53","cat":"FeuAK · Vergabe","q":"Welche Voraussetzungen müssen für die HLF-Beschaffung erfüllt sein?","a":"Mittel rechtskräftig bewilligt; Maßnahme im <strong>Investitionsprogramm</strong> (5-Jahres-Darstellung); <strong>Wertungsmatrix</strong> (Preis mind. 40 %) mit Ausschreibung veröffentlicht; Fahrzeuge im <strong>Vermögenshaushalt</strong> (einzige Kreditfinanzierung)."},
  {"id":"k-feuak-54","cat":"FeuAK · Vergabe","q":"Worauf ist bei der HLF-Beschaffung besonders zu achten?","a":"<strong>EU-Schwellenwerte</strong> prüfen, <strong>Rahmenverträge</strong> nutzen, feste Jahresraten ansparen, Restmittel-Übertragbarkeit sichern."},
  {"id":"k-feuak-55","cat":"FeuAK · Vergabe","q":"Vorteile und Nachteile einer einzigen Tranche?","a":"Vorteile: einheitliche Ausbildung, gleiche Ersatzteile, Skaleneffekte, eine Ausschreibung. Nachteil: Ein Systemfehler trifft alle Fahrzeuge."},
  {"id":"k-feuak-56","cat":"FeuAK · Vergabe","q":"Vorteile und Nachteile mehrerer Tranchen?","a":"Vorteil: Risiko gestreut. Nachteile: höhere Einzelkosten, getrennte Ausschreibungen."},
  {"id":"k-feuak-57","cat":"FeuAK · Vergabe","q":"Wie bemisst man Nutzungsdauer und technische Reserve eines Fahrzeugs?","a":"Nutzungsdauer nach <strong>AfA-Tabelle</strong> (Anlageverzeichnis: Anschaffungswert, Restwert, Nutzungsdauer). Technische Reserve ausreichend bemessen; Indikator: <strong>Fahrzeugverfügbarkeit</strong>."},
  {"id":"k-feuak-58","cat":"FeuAK · Vergabe","q":"Was macht einen Vergabevorschlag rechtssicher?","a":"Mittel vor Vergabestart rechtskräftig vorhanden; <strong>Wertungsmatrix</strong> vorab veröffentlicht (Preis mind. 40 %); EU-Schwellenwerte geprüft; <strong>neutrales Leistungsverzeichnis</strong> (kein Hersteller, Typ, Marke)."},
  {"id":"k-feuak-59","cat":"FeuAK · Vergabe","q":"Was macht einen Vergabevorschlag zielorientiert?","a":"<strong>Bedarfsermittlung zuerst</strong> (Was brauche ich tatsächlich?), Qualitätskriterien in der Wertungsmatrix gewichten, technische Eignungskriterien klar festlegen, Rahmenverträge nutzen, Tranche(n) bewusst abwägen."},
  {"id":"k-feuak-61","cat":"FeuAK · Vergabe","q":"Nenne die vier Aspekte, warum ein neutrales Leistungsverzeichnis zentral ist.","a":"1. Vergaberecht und Neutralität 2. Diskriminierungsverbot 3. Wettbewerbssicherung 4. Rechtssicherheit."},
  {"id":"k-feuak-62","cat":"FeuAK · Vergabe","q":"Was fordert das Vergaberecht von einem neutralen Leistungsverzeichnis, und was ist verboten?","a":"Exakte, <strong>herstellerneutrale</strong> Bedarfsbeschreibung (§ 31 VgV, § 7 VOB/A). Bevorzugung bestimmter Hersteller oder Modelle ist rechtswidrig, auch versteckte Spezifikationen."},
  {"id":"k-feuak-63","cat":"FeuAK · Vergabe","q":"Wie sichert ein neutrales Leistungsverzeichnis den Wettbewerb?","a":"Transparente Kriterien ermöglichen fairen Marktvergleich und maximalen Bieterwettbewerb; Wettbewerb senkt Preise und steigert Qualität."},
  {"id":"k-feuak-64","cat":"FeuAK · Vergabe","q":"Wovor schützt ein neutrales Leistungsverzeichnis?","a":"Vor <strong>Vergaberügen</strong> und teuren <strong>Beschaffungsstopps</strong>."},
  {"id":"k-feuak-68","cat":"FeuAK · Bedarfsplanung","q":"Was prüft die Analyse der Hilfsfristerreichung im Rettungsdienst?","a":"Einen <strong>SOLL-IST-Vergleich</strong> des tatsächlichen Erreichungsgrades mit dem gesetzlichen Schutzziel, zweigleisig: Gesamterreichung aller Fahrzeuge gegenüber Erreichung ab der zuständigen Wache."},
  {"id":"k-feuak-69","cat":"FeuAK · Bedarfsplanung","q":"Wie deutet man gute Erreichung ab zuständiger Wache bei schlechter Gesamterreichung?","a":"Als <strong>Ressourcenverfügbarkeitsproblem</strong>."},
  {"id":"k-feuak-70","cat":"FeuAK · Bedarfsplanung","q":"Wie deutet man schlechte Erreichung auch ab zuständiger Wache?","a":"Als <strong>Standort-/Erreichbarkeitsproblem</strong>. Ergebnis der Analyse: räumliche Versorgungslücken und Eingrenzung der Ursachenart."},
  {"id":"k-feuak-71","cat":"FeuAK · Bedarfsplanung","q":"Was leistet die Problemfeldanalyse?","a":"Sie quantifiziert die Verursachungsbeiträge der Nicht-Erreichung: <strong>Standortstruktur und Verkehr</strong>, <strong>Ausrückzeit</strong>, <strong>Ressourcenverfügbarkeit</strong>. Ergebnis: priorisierte, zielgerichtete Maßnahmen für das Soll-Konzept."},
  {"id":"k-idf-01","cat":"IdF · Brandschutz","q":"Welche Gebäudeklasse hat ein freistehendes Gebäude mit OKFF 6,5 m und zwei Nutzungseinheiten von 130 m² und 280 m²?","a":"<strong>GK 3.</strong> Die Summe der Nutzungseinheiten beträgt 410 m² und überschreitet damit die 400-m²-Grenze von GK 1 und GK 2. Es ist ein sonstiges Gebäude mit Höhe ≤ 7 m."},
  {"id":"k-idf-02","cat":"IdF · Brandschutz","q":"Was kennzeichnet die <strong>Gebäudeklasse 2</strong>?","a":"Höhe (OKFF) bis 7 m, <strong>höchstens 2 Nutzungseinheiten</strong> mit zusammen <strong>höchstens 400 m²</strong>. Anders als GK 1 nicht freistehend."},
  {"id":"k-idf-03","cat":"IdF · Brandschutz","q":"Welche Gebäudeklasse hat ein Gebäude mit OKFF 8,5 m und einer Nutzungseinheit von 700 m²?","a":"<strong>GK 5.</strong> Die Höhe würde GK 4 (bis 13 m) erlauben, aber nur bei Nutzungseinheiten von jeweils höchstens 400 m². Die 700-m²-Einheit überschreitet das."},
  {"id":"k-idf-04","cat":"IdF · Brandschutz","q":"Wie ist die Gebäudeklasse 4 nach Höhe und Nutzungseinheiten abgegrenzt?","a":"OKFF bis 13 m, <strong>unbegrenzt viele Nutzungseinheiten</strong>, aber jede höchstens 400 m². GK 5: OKFF über 13 m bis 22 m; darüber Hochhaus (MHHR)."},
  {"id":"k-idf-05","cat":"IdF · Brandschutz","q":"Ab welcher Höhe ist ein Gebäude ein <strong>Hochhaus</strong>, und welche Regelwerke gelten dann?","a":"OKFF des höchstgelegenen Geschosses mit Aufenthaltsraum <strong>mehr als 22 m</strong> über Geländeoberfläche (Sonderbau, § 2 Abs. 4 MBO). Es gilt die <strong>MHHR</strong>; bei einem Hotel zusätzlich die Beherbergungsstättenverordnung."},
  {"id":"k-idf-06","cat":"IdF · Brandschutz","q":"Wie viele und welche Rettungswege fordert die MHHR bei einem Hotel mit 22 Geschossen?","a":"<strong>Zwei voneinander unabhängige bauliche Rettungswege</strong> je Nutzungseinheit und Geschoss (MHHR Nr. 4.1.1). Anleiterbarkeit genügt als zweiter Rettungsweg nicht."},
  {"id":"k-idf-07","cat":"IdF · Brandschutz","q":"Wie weit kann ein <strong>Sicherheitstreppenraum</strong> in Hochhäusern zwei notwendige Treppenräume ersetzen?","a":"Bis 60 m Höhe genügt <strong>ein Sicherheitstreppenraum</strong> an Stelle von zwei notwendigen Treppenräumen (Nr. 4.2.1). Über 60 m müssen alle notwendigen Treppenräume Sicherheitstreppenräume sein (Nr. 4.2.2)."},
  {"id":"k-idf-08","cat":"IdF · Brandschutz","q":"Welche Pflichten gelten bei einem Wohnhochhaus mit höchstem Aufenthaltsraum in 36 m Höhe?","a":"<strong>Feuerwehraufzug</strong> (Nr. 6.1) und ein <strong>Brandschutzbeauftragter</strong> des Eigentümers (Nr. 9.3.2). Anleiterung als zweiter Rettungsweg ist nicht vorgesehen."},
  {"id":"k-idf-09","cat":"IdF · Brandschutz","q":"Welche Anforderungen stellt die MHHR an Hochhäuser bis 60 m zu Feuerwehraufzug, Steigleitungen und Feuerwiderstand?","a":"<strong>Feuerwehraufzüge</strong> und <strong>nasse Steigleitungen mit Wandhydranten</strong> sind in allen Hochhäusern Pflicht. Tragende Bauteile feuerbeständig, über 60 m 120 Minuten, nie 180 Minuten."},
  {"id":"k-idf-10","cat":"IdF · Brandschutz","q":"Was bedeutet das Kurzzeichen <strong>REI 90-M (F 90-A)</strong> bei einer Brandwand?","a":"<strong>R</strong> tragend, <strong>E</strong> raumabschließend, <strong>I</strong> isolierend, <strong>M</strong> gegen Stoßbeanspruchung, <strong>90</strong> Minuten Feuerwiderstand. Selbstschließend (C) ist nicht enthalten."},
  {"id":"k-idf-11","cat":"IdF · Brandschutz","q":"Welche Anforderungen lassen sich genau aus <strong>C5S200</strong> ableiten?","a":"<strong>Rauchdicht und selbstschließend:</strong> C5 = Selbstschließung (Dauerfunktion), S200 = Rauchdichtheit. Brandschutzeigenschaften wie feuerhemmend oder raumabschließend stecken nicht darin."},
  {"id":"k-idf-12","cat":"IdF · Brandschutz","q":"Was bedeutet die Klassifizierung <strong>EI2 30-S200-C5</strong>?","a":"<strong>Feuerhemmender, rauchdichter und selbstschließender</strong> Öffnungsabschluss. EI2 30 = Raumabschluss und Wärmedämmung für 30 Minuten. Entspricht dem bisherigen T30-RS."},
  {"id":"k-idf-13","cat":"IdF · Brandschutz","q":"Welche Türanforderung gilt nach § 35 Abs. 10 MBO zwischen Treppenraum und Kellergeschoss?","a":"<strong>Feuerhemmend, rauchdicht und selbstschließend (T30-RS).</strong> Gilt auch zu Räumen mit erhöhter Brandlast."},
  {"id":"k-idf-14","cat":"IdF · Brandschutz","q":"Welche Anforderung gilt für Türen von notwendigen Treppenräumen zu notwendigen Fluren, Wohnungen und Nutzungseinheiten?","a":"Zu <strong>notwendigen Fluren</strong>: rauchdicht und selbstschließend. Zu <strong>Wohnungen, Nutzungseinheiten und sonstigen Räumen</strong>: dicht- und selbstschließend. Dichtschließend allein genügt nicht."},
  {"id":"k-idf-15","cat":"IdF · Brandschutz","q":"Welche Anforderung gilt für Öffnungen in inneren Brandwänden?","a":"<strong>Feuerbeständig, dicht- und selbstschließend</strong> (EI2 90-C5, § 30 MBO). Rauchdichtheit (Sa) wird dort nicht verlangt."},
  {"id":"k-idf-16","cat":"IdF · Brandschutz","q":"Welche Vorschrift hat bei Kollision Vorrang: MBO oder Sondervorschrift?","a":"<strong>Sondervorschriften</strong> (z. B. Sonderbauverordnungen nach § 51 MBO) gehen als <strong>lex specialis</strong> den allgemeinen Regelungen vor. Eine Wahl nach Günstigkeit für den Bauherrn gibt es nicht."},
  {"id":"k-idf-17","cat":"IdF · Brandschutz","q":"Welche vier Schutzziele nennt § 14 MBO im Wortlaut?","a":"Der <strong>Entstehung eines Brandes</strong> und der <strong>Ausbreitung von Feuer und Rauch</strong> wird vorgebeugt. Bei einem Brand sind die <strong>Rettung von Menschen und Tieren</strong> sowie <strong>wirksame Löscharbeiten</strong> möglich."},
  {"id":"k-idf-18","cat":"IdF · Brandschutz","q":"Welche davon sind <strong>keine</strong> Schutzziele nach § 14 MBO: Sachschutz „um jeden Preis“, Rettung von Menschen und Tieren, Löschwasser als solches, Vorbeugung der Brandausbreitung, ein einheitliches Schutzniveau aller Bundesländer?","a":"Kein Schutzziel sind <strong>Sachschutz „um jeden Preis“</strong>, <strong>Löschwasser als solches</strong> und ein <strong>einheitliches Schutzniveau</strong> aller Bundesländer. Schutzziele sind die Rettung von Menschen und Tieren, wirksame Löscharbeiten sowie die Vorbeugung der Entstehung und Ausbreitung von Feuer und Rauch."},
  {"id":"k-idf-19","cat":"IdF · Brandschutz","q":"Welchen Schutzzielen dienen Flure, Anleiterstellen, Alarmierungsanlagen, Brandwände, Trennwände und Rauchableitung aus Treppenräumen?","a":"<strong>Rettung von Menschen:</strong> notwendige Flure, anleiterbare Stelle, Alarmierungsanlage. <strong>Brandausbreitung:</strong> Brandwände, Trennwände. <strong>Wirksame Löscharbeiten:</strong> Rauchableitung aus Treppenräumen."},
  {"id":"k-idf-20","cat":"IdF · Brandschutz","q":"Welchem Schutzziel dienen Explosionsunterdrückungsanlagen und dauerhafte Sauerstoffreduktion?","a":"Der <strong>Vorbeugung der Brandentstehung</strong>. Anleiterstelle (Rettung) und Rauchabzug im Treppenraum (Löscharbeiten) gehören dagegen nicht dazu."},
  {"id":"k-idf-21","cat":"IdF · Brandschutz","q":"In welche Bereiche teilt sich der vorbeugende Brandschutz auf?","a":"<strong>Baulicher, anlagentechnischer und organisatorischer</strong> Brandschutz (dazu zählt die Brandschutzerziehung). Brandsicherheitswachen gehören zum abwehrenden Brandschutz."},
  {"id":"k-idf-22","cat":"IdF · Brandschutz","q":"Welche Hydrantenwerte gelten nach DVGW W 405 im Wohngebiet mit kleiner Brandausbreitungsgefahr?","a":"Grundschutz <strong>800 l/min (48 m³/h) über mindestens 2 Stunden</strong>, nachzuweisen im Umkreis von <strong>300 m</strong>. Bei 200 m Lauflänge und 120 m Hydrantenabstand sind die Lauflängen ausreichend."},
  {"id":"k-idf-23","cat":"IdF · Brandschutz","q":"Warum ist die Löschwasserversorgung ohne Angabe zur Rohrnetzleistung nicht als sichergestellt zu werten?","a":"Ein DN-100-Unterflurhydrant liefert nur dann etwa 800 l/min, wenn das Netz diese Menge bei mindestens 1,5 bar Betriebsdruck hergibt. Ohne Netzangaben ist das nicht nachgewiesen."},
  {"id":"k-idf-24","cat":"IdF · Brandschutz","q":"Wann sind <strong>Versammlungsstätten</strong> nach MVStättVO anwendbar (Besucherzahlen)?","a":"Versammlungsräume mit <strong>mehr als 200 Besuchern</strong>; mehrere Räume mit gemeinsamen Rettungswegen zählen zusammen. Sportstadien und Freisportanlagen mit Tribünen erst ab <strong>mehr als 5000 Besuchern</strong>."},
  {"id":"k-idf-25","cat":"IdF · Brandschutz","q":"Fällt eine Disco mit 150 m² unter die Versammlungsstättenverordnung?","a":"<strong>Ja.</strong> Bei sonstigen Stehplätzen gelten mindestens 2 Besucher je m², also mindestens 300 Besucher und damit mehr als 200. Auch eine Disco mit 200 m² (mindestens 400 Besucher) fällt darunter."},
  {"id":"k-idf-26","cat":"IdF · Brandschutz","q":"Was gilt für zwei Versammlungsräume im Krankenhaus mit 45 und 120 Personen und gemeinsamem notwendigem Flur?","a":"Zusammen <strong>165 Besucher</strong>, also nicht mehr als 200: <strong>keine Versammlungsstätte</strong>. Ebenso nicht: Fußballplatz mit 1700 Tribünenplätzen (unter 5000)."},
  {"id":"k-idf-27","cat":"IdF · Brandschutz","q":"Was gilt für die Maßgeblichkeit der Zahl in der Versammlungsstättenverordnung und für Rettungswege über Foyers?","a":"Maßgeblich ist die <strong>Besucherzahl</strong> (mehr als 200), nicht die Zahl aller anwesenden Personen. Ein Rettungsweg darf über Hallen oder Foyer geführt werden."},
  {"id":"k-idf-28","cat":"IdF · Brandschutz","q":"Welche Nutzungen fallen unter die Muster-Garagenverordnung?","a":"Offene mehrgeschossige Stahlparkhäuser und <strong>Stellplätze unter einem Gebäude</strong>. Nicht: Gebäude für Fahrzeuge des Brand- und Katastrophenschutzes, Arbeitsmaschinen, land- und forstwirtschaftliche Zugmaschinen, Verkaufsraum eines Autohauses."},
  {"id":"k-idf-29","cat":"IdF · Brandschutz","q":"Wie werden Garagen eingeteilt, und welche Rettungsweglängen gelten?","a":"<strong>Klein-, Mittel- und Großgaragen</strong> nach Nutzfläche (≤ 100 m², bis 1000 m², über 1000 m²). Rettungsweglänge in geschlossenen Garagen 35 m, in offenen 50 m. Bauteilanforderungen hängen davon ab, ob die Garage offen oder geschlossen ist."},
  {"id":"k-idf-30","cat":"IdF · Brandschutz","q":"Was gilt nach § 30 MBO für <strong>Brandwände</strong>: Höhe über der Bedachung, Anforderungen in Gebäudeklasse 5, Gebäudeabschlusswand?","a":"Brandwände sind mindestens <strong>30 cm über die Bedachung</strong> zu führen (nicht generell 50 cm). In Gebäudeklasse 5 nichtbrennbar und auch unter mechanischer Beanspruchung feuerbeständig. Gebäudeabschlusswand als Brandwand bei Abstand zur Grenze unter 2,5 m."},
  {"id":"k-idf-31","cat":"IdF · Brandschutz","q":"Was fordert die Muster-Schulbau-Richtlinie in Lernbereichen – und was wird nicht pauschal gefordert?","a":"In Lernbereichen sind <strong>Sichtbereiche</strong> vorzusehen. Nicht pauschal gefordert: Rettungsgerät der Feuerwehr, Brandmeldeanlage mit Aufschaltung, Übungen mit der Feuerwehr, notwendige-Flur-Anforderungen für alle Lernbereiche."},
  {"id":"k-idf-32","cat":"IdF · Brandschutz","q":"Was gilt bei der <strong>Brandverhütungsschau</strong>?","a":"Die Situation ist <strong>verhältnismäßig</strong> zu prüfen und auf akute wesentliche Gefährdungen hinzuweisen. Ein Protokoll und bei Bedarf eine Verfügung der Behörde empfehlen sich. Es gilt Bestandsschutz; die Zuständigkeit ist landesrechtlich verschieden."},
  {"id":"k-idf-33","cat":"IdF · Brandschutz","q":"Welche Gebäude sind Sonderbauten nach § 2 Abs. 4 MBO (Versammlungsstätten, Verkaufsstätten, Beherbergungsstätten)?","a":"Versammlungsstätten mit Räumen für mehr als <strong>200 Besucher</strong>; Verkaufsstätten mit Verkaufsräumen und Ladenstraßen von zusammen mehr als <strong>800 m²</strong>; Beherbergungsstätten bereits ab mehr als <strong>12 Gastbetten</strong> (nicht erst 30)."},
  {"id":"k-idf-34","cat":"IdF · Brandschutz","q":"Wann ist ein Krankenhaus ein Sonderbau?","a":"<strong>Immer</strong>, unabhängig von Bettenzahl, Stationen und Größe; Schwellenwerte gibt es nicht."},
  {"id":"k-idf-35","cat":"IdF · Brandschutz","q":"Was gilt für Verkaufsstätten: erster Rettungsweg über die Ladenstraße, ebenerdige Verkaufsstätte mit Feuerlöschanlage, Anwesenheit in der Betriebszeit, Rettungsweglänge im Verkaufsraum?","a":"Erster Rettungsweg über die Ladenstraße nur, wenn der zweite davon <strong>unabhängig</strong> ist. Ebenerdig mit Feuerlöschanlage bis <strong>10.000 m²</strong> Brandabschnitt; während der Betriebszeit muss ein Verantwortlicher anwesend sein. Rettungsweglänge im Verkaufsraum 25 m, nicht pauschal 100 m."},
  {"id":"k-idf-36","cat":"IdF · Brandschutz","q":"Was gilt bei Bestandsschutz und Abweichung: Fenstermaße im Bestand, Schiebeleiter statt Drehleiter, Nutzungsuntersagung bei fehlendem zweitem Rettungsweg?","a":"Bestehende Fenster müssen bei Bestandsschutz nicht auf 0,90 m × 1,20 m geändert werden. Ersatz der Drehleiter durch Schiebeleiter nur per <strong>Abweichung (§ 67 MBO)</strong>. Bei fehlendem zweitem Rettungsweg und schlechtem Zustand ist eine Nutzungsuntersagung möglich."},
  {"id":"k-idf-37","cat":"IdF · Brandschutz","q":"Wer muss Aufstellflächen für die Drehleiter herstellen und erhalten, und was darf angerechnet werden?","a":"Der <strong>Bauherr</strong> muss sie errichten und dauerhaft nutzbar halten (pflegen, freihalten). Anrechenbar sind die öffentliche Verkehrsfläche (wenn dauerhaft nutzbar) und die tatsächliche Leistungsfähigkeit der örtlichen Feuerwehr (§ 33 Abs. 3 MBO), z. B. zwei Drehleitern mit 15 m Ausladung bei 22 m Rettungshöhe, wenn die Feuerwehr sie bestätigt. Zufahrten für Fahrzeuge sind erst ab mehr als <strong>50 m</strong> Entfernung zur öffentlichen Verkehrsfläche nötig; darunter ist das Tragen tragbarer Leitern zumutbar."},
  {"id":"k-idf-38","cat":"IdF · Brandschutz","q":"Was fordert die MBO an Mindestmaßen für Fenster als Rettungsweg?","a":"Im Lichten mindestens <strong>0,90 m × 1,20 m</strong>, Brüstungshöhe höchstens 1,20 m."},
  {"id":"k-idf-51","cat":"IdF · Brandschutz","q":"Wie wird die Ausbreitung von Rauch im Gebäude begrenzt?","a":"Notwendige Flure mit <strong>Rauchabschnitten</strong> und rauchdichten Türen, notwendige Treppenräume, Lüftungsanlagen mit Brandschutzklappen sowie Abschottungen bei Leitungsdurchführungen."},
  {"id":"k-idf-58","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat der <strong>S1</strong>?","a":"Personal/Innerer Dienst: Kräfte alarmieren und anfordern (Zwiebelschalenmodell), Reserven, <strong>Lotsenstellen</strong>, mit S3 Bereitstellungsräume, Kräfteübersicht, innerer Stabsdienst und Schichtplanung für den Stab."},
  {"id":"k-idf-59","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat der <strong>S2</strong>?","a":"Lage: Informationen beschaffen und bewerten, <strong>Lagekarte</strong> und Einsatzübersichten führen, Lagebesprechungen vorbereiten, Meldungen, <strong>Einsatztagebuch</strong> und Abschlussbericht."},
  {"id":"k-idf-60","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat der <strong>S3</strong>?","a":"Einsatz: Lagebesprechungen, Lage beurteilen und <strong>Entschluss</strong> fassen, Einsatzschwerpunkte und -abschnitte festlegen, Schadengebiet ordnen, Befehle erteilen und die Durchführung kontrollieren."},
  {"id":"k-idf-61","cat":"IdF · Stabsarbeit","q":"Wer legt den Eigenschutz fest: S3 oder S4?","a":"Der <strong>S4</strong> veranlasst den Eigenschutz (technisch, medizinisch, psychosozial). Der S3 beurteilt die Lage, legt Einsatzschwerpunkte fest und kontrolliert den Einsatzerfolg."},
  {"id":"k-idf-64","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat der <strong>S5</strong>?","a":"Presse- und Medienarbeit: Presseinformationen, Betreuung der Medienvertreter, Warnung und Information der Bevölkerung, Abstimmung mit Pressesprechern (v. a. Polizei). Mit Krisenstab untersteht der S5 der BuMA."},
  {"id":"k-idf-65","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat der <strong>S6</strong>?","a":"Informations- und Kommunikationswesen: Ist-Zustand erfassen, <strong>Kommunikationskonzept</strong> mit Fernmeldeskizze, IuK-Technik bereitstellen, Kommunikationssicherheit (Redundanz) und Übermittlung."},
  {"id":"k-idf-66","cat":"IdF · Stabsarbeit","q":"Wer ist für den Aufbau der Kommunikationsstruktur zuständig?","a":"Der <strong>S6</strong>. Ist er noch nicht besetzt, schafft der <strong>S3</strong> die Kommunikation (7-Punkte-Plan). Leitstelle und BDBOS bauen die Struktur der Einsatzleitung nicht auf."},
  {"id":"k-idf-67","cat":"IdF · Stabsarbeit","q":"Woraus besteht ein Führungsstab?","a":"Aus dem <strong>Leiter des Stabes</strong>, den Leitern der Sachgebiete <strong>S1 bis S6</strong>, Führungsassistenten und Führungshilfspersonal (operativ-taktische Komponente)."},
  {"id":"k-idf-68","cat":"IdF · Stabsarbeit","q":"Woraus besteht die administrativ-organisatorische Komponente?","a":"Aus <strong>KGS, SMS und EMS</strong> (Koordinierungsgruppe, ständige und ereignisspezifische Mitglieder), geführt vom Leiter des Stabes."},
  {"id":"k-idf-69","cat":"IdF · Stabsarbeit","q":"Wofür ist die KGS im administrativ-organisatorischen Stab zuständig?","a":"<strong>Lagedarstellung und Dokumentation</strong> (ETB, GIS) sowie Innerer Dienst (z. B. Alarmierung, Schichtplanung). Pressearbeit macht die BuMA, Befehle erteilt die Einsatzleitung."},
  {"id":"k-idf-70","cat":"IdF · Stabsarbeit","q":"Welche Stabsmodelle gibt es?","a":"Das <strong>Ein-Stabsmodell</strong> und das <strong>Zwei-Stabsmodell</strong> (operativ-taktischer Stab plus administrativ-organisatorischer Stab unter dem HVB)."},
  {"id":"k-idf-71","cat":"IdF · Stabsarbeit","q":"Wie arbeitet der Krisenstab: Aufgabenabarbeitung, Führungsstufe, Raum und Lagedarstellung im Vergleich zum Führungsstab?","a":"Aufgaben werden in den bestehenden <strong>Behördenstrukturen und Zuständigkeiten</strong> (Soziales, Polizei, Gesundheit) abgearbeitet. Er ist keine Führungsstufe E und arbeitet nicht grundsätzlich im selben Raum oder mit derselben Lagedarstellung wie der Führungsstab."},
  {"id":"k-idf-73","cat":"IdF · Stabsarbeit","q":"Welche Stellung haben Sachgebietsleiter im Führungsstab?","a":"Sie sind dem <strong>Leiter des Stabes</strong> unterstellt, handeln im Aufgabengebiet <strong>eigenverantwortlich und selbstständig</strong> und versorgen den Leiter des Stabes mit Informationen. Keine Unterstellung unter den S3."},
  {"id":"k-idf-74","cat":"IdF · Stabsarbeit","q":"Welche Sachgebiete werden bei zu wenig Personal im Führungsstab zusammengefasst?","a":"<strong>S4 mit S1</strong>, <strong>S2 mit S3</strong>, <strong>S5 zu S2</strong> und <strong>S6 zu S3</strong>."},
  {"id":"k-idf-75","cat":"IdF · Stabsarbeit","q":"Wofür steht <strong>Führungsstufe D</strong> nach FwDV 100?","a":"Für den <strong>Führungsstab</strong> (S1–S6) bei mehreren Verbänden, Großeinsatzlagen und Katastrophen. Die Führungsstaffel gehört zur Stufe C. Der KBM ist nicht zwingend beteiligt."},
  {"id":"k-idf-76","cat":"IdF · Stabsarbeit","q":"Welches Fahrzeug eignet sich zum stabsmäßigen Arbeiten einer Führungsgruppe?","a":"Der <strong>ELW 2</strong>. ELW 1, KdoW und MTW reichen dafür nicht aus."},
  {"id":"k-idf-77","cat":"IdF · Stabsarbeit","q":"Was besagt die <strong>Auftragstaktik</strong> zum Befehl?","a":"Ziel und Zweck vorgeben, das Wie entscheidet der Geführte. <strong>Je weiter in die Zukunft</strong> ein Befehl reicht, desto freier ist er. Bei Gefahr oder besserer Ortskenntnis darf abgewichen werden; Kommunikation ist keine Einbahnstraße."},
  {"id":"k-idf-78","cat":"IdF · Stabsarbeit","q":"Was ist der <strong>PTZ-10 NRW</strong>?","a":"Eine mit <strong>zwei Notärzten</strong> besetzte Einheit in Zugstärke (1 Führungsfahrzeug, 4 RTW, 4 KTW). „10“ = maximal 10 transportierbare Patienten, nicht 10 Einsatzkräfte; er rückt als geschlossener Verband aus, die SEG Sanität gehört nicht dazu."},
  {"id":"k-idf-79","cat":"IdF · Stabsarbeit","q":"Was gilt für die Anforderung der MoFüSt in NRW?","a":"Anforderung über die <strong>Leitstelle</strong> bei der Bezirksregierung. In den Stufen 2 und 3 wird ein <strong>Vorauskommando</strong> entsandt. Es gibt drei Stufen: Führungskräfte, Führungsgruppe, kompletter Führungsstab."},
  {"id":"k-idf-81","cat":"IdF · Stabsarbeit","q":"Welche Sachgebiete legen Bereitstellungsräume fest?","a":"<strong>S1 und S3</strong> gemeinsam (7-Punkte-Plan, Punkt 2: BR EL oder BR EA)."},
  {"id":"k-idf-82","cat":"IdF · Stabsarbeit","q":"Was ist bei der Festlegung eines Bereitstellungsraumes zu beachten?","a":"Verkehrstechnisch gut angebunden, <strong>Versorgung</strong> (Unterkunft, Sanitär, Wetterschutz, Tankmöglichkeit, Strom, Wasser, Kommunikation), außerhalb des Gefahrenbereichs."},
  {"id":"k-idf-83","cat":"IdF · Stabsarbeit","q":"Wer führt einen Bereitstellungsraum?","a":"Eine <strong>Führungseinheit</strong> (z. B. mit ELW). Ein bloßer Haltepunkt ist kein Bereitstellungsraum."},
  {"id":"k-idf-84","cat":"IdF · Stabsarbeit","q":"Was gilt für Kraftstoffversorgung durch den S4?","a":"Auch <strong>Bereitstellungsräume</strong> brauchen eine Kraftstoffversorgung. Bestimmte Einheiten von Feuerwehr, THW und Bundeswehr können eine <strong>mobile Tankstelle</strong> stellen. Keine generelle kostenlose Betankungspflicht der Tankstellen."},
  {"id":"k-idf-85","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat die Versorgungsstelle Verpflegung?","a":"Umsetzung des S4-Konzepts: <strong>Besorgung</strong> von Lebensmitteln und Getränken, <strong>Zubereitung</strong> von Speisen, Hygiene. Wartungsarbeiten gehören zur Materialerhaltung."},
  {"id":"k-idf-86","cat":"IdF · Stabsarbeit","q":"Wer übernimmt bei Trinkwasseraufbereitung durch das THW die Technische Einsatzleitung?","a":"Sie bleibt bei der <strong>örtlich zuständigen Kommune</strong>. Das THW wird im Wege der <strong>Amtshilfe</strong> tätig."},
  {"id":"k-idf-87","cat":"IdF · Stabsarbeit","q":"Was gilt für die Bundeswehr im Einsatz?","a":"Anforderung über das <strong>Kreisverbindungskommando (KVK)</strong>; Tätigkeit als Amtshilfe/Katastrophenhilfe nach <strong>Art. 35 GG</strong>. Die Einsatzleitung bleibt bei der zivilen Behörde; Selbstverpflegung ist nicht immer gegeben."},
  {"id":"k-idf-88","cat":"IdF · Stabsarbeit","q":"Aus welchen Schritten besteht die Entscheidungshilfe <strong>FOR-DEC</strong>?","a":"<strong>F</strong>acts, <strong>O</strong>ptions, <strong>R</strong>isks &amp; Benefits, <strong>D</strong>ecision, <strong>E</strong>xecution, <strong>C</strong>heck."},
  {"id":"k-idf-89","cat":"IdF · Stabsarbeit","q":"Was umfasst das <strong>Gemeinsame Mentale Modell (GMM)</strong>?","a":"Das geteilte Verständnis des Stabes von <strong>Lage und Auftrag</strong>, <strong>Prozessen und Strukturen</strong> sowie <strong>Umwelt und Umgebung</strong>."},
  {"id":"k-idf-90","cat":"IdF · Stabsarbeit","q":"Was kennzeichnet kritische Situationen in der Stabsarbeit?","a":"<strong>Komplexität/Vernetztheit, Dynamik, Intransparenz und Totzeit.</strong> Motivationsregulation gehört nicht dazu."},
  {"id":"k-idf-91","cat":"IdF · Stabsarbeit","q":"Was gilt für das Einsatztagebuch (ETB): Pflichteinträge, Zeitpunkt der Eintragung, digitale Führung?","a":"Wichtige <strong>Einsatzentscheidungen müssen eingetragen</strong> werden. Eintragungen erfolgen zeitnah, nicht erst nach der Umsetzung; eine digitale Führung ist nicht grundsätzlich vorgeschrieben."},
  {"id":"k-idf-98","cat":"IdF · Stabsarbeit","q":"Welche Bereiche sind ständige Mitglieder (SMS) des Verwaltungsstabes?","a":"Unter anderem <strong>Sicherheit und Ordnung, Soziales, Katastrophenschutz</strong> (auch Gesundheit, Umwelt, Polizei). Das <strong>Forstamt</strong> gehört nicht dazu."},
  {"id":"k-idf-99","cat":"IdF · Presse","q":"Wer richtet bei eingesetztem Krisenstab das Bürgertelefon ein?","a":"Die für die <strong>BuMA</strong> (Bevölkerungs- und Medienarbeit) zuständige Person des Krisenstabs. Der S5 der Einsatzleitung untersteht dann der BuMA."},
  {"id":"k-idf-100","cat":"IdF · Presse","q":"Wie erfolgt die Pressearbeit, wenn Krisenstab und S5 besetzt sind?","a":"<strong>Abgestimmt mit der BuMA.</strong> Mit Arbeitsaufnahme des Krisenstabes geht das Melde- und Berichtswesen auf die BuMA über; der S5 gibt nicht eigenständig Informationen weiter."}
];
// Eigene Karten aus dem Speicher dazunehmen
try{ JSON.parse(localStorage.getItem('bvi_fc_custom')||'[]').forEach(c=>{ if(c&&c.id&&c.q&&c.a) FLASHCARD_DATA.push({id:c.id,cat:c.cat,q:c.q,a:c.a,own:true}); }); }catch(e){}


/* ======================================================================
   PROGRESS – Lernfortschritt in LocalStorage
====================================================================== */
const PROGRESS = (function(){
  const GROUPS = {
    gal:  ['v-gal-organisation','v-gal-brandlehre','v-gal-fahrzeuge','v-gal-einsatz','v-gal-atemgifte','v-gal-atemschutz','v-gal-vb','v-gal-loeschlehre','v-gal-loeschmittel-schaum','v-gal-loeschwasserversorgung','v-gal-beamtenrecht','v-gal-beihilferecht','v-gal-brandbekaempfung','v-gal-einsatztechnik','v-gal-erstehilfe','v-gal-grundlagen','v-gal-fahrzeugnormung','v-gal-fuehrung','v-gal-fwdven','v-gal-gabc','v-gal-geraetepruefung','v-gal-hbkg','v-gal-kartenkunde','v-gal-knoten','v-gal-staatsbuerger','v-gal-th-verkehr','v-gal-leitern','v-gal-uvv','v-gal-waermebildkamera','v-gal-armaturen','v-gal-maschinist','v-gal-psa','v-gal-personalvertretungsrecht'],
    sfs:  ['v-sfs-fwdv3','v-sfs-methodik','v-sfs-rechtsgrundlagen','v-sfs-abc'],
    hlfs: ['v-hlfs-fuehrungsvorgang','v-hlfs-gabc','v-hlfs-tunnel','v-hlfs-vb','v-hlfs-manv','v-hlfs-zugfuehrer','v-hlfs-stab'],
    ibk:  ['v-ibk-ta','v-ibk-konflikt','v-ibk-stress','v-ibk-psnv','v-ibk-bgm','v-ibk-pm','v-ibk-zeit','v-ibk-fuehren-gruppen','v-ibk-fuehrung','v-ibk-autoritaeten','v-ibk-fuehrungsstile','v-ibk-onboarding'],
    vak:  ['v-vak-jur-denken','v-vak-verwaltungsrecht','v-vak-staatsrecht','v-vak-einsatzrecht','v-vak-dienstrecht','v-vak-rettungsdienstrecht','v-vak-lernarbeitsblatt'],
    feuak:['v-feuak-vwl','v-feuak-haushalt','v-feuak-pm','v-feuak-bedarfsplanung','v-feuak-rdbp','v-feuak-katsbp','v-feuak-planspiel','v-feuak-qm','v-feuak-beschaffung','v-feuak-stakeholder','v-feuak-risikoanalyse','v-feuak-bwl','v-feuak-rechnungswesen','v-feuak-pruefung','v-feuak-lernblatt-hh','v-feuak-lernblatt-2026'],
    idf:  ['v-idf-vblernen','v-idf-gk','v-idf-sonderbau','v-idf-s51','v-idf-s52','v-idf-s53','v-idf-s54','v-idf-s55','v-idf-sim-stabbau','v-idf-stabskarte','v-idf-sim-pressesim','v-idf-sim-warnsim','v-idf-vb-41','v-idf-vb-42','v-idf-vb-43','v-idf-vb-44','v-idf-vb-45','v-idf-vb-46','v-idf-vb-47','v-idf-p61','v-idf-p62','v-idf-z70','v-idf-z71','v-idf-z72','v-idf-z73','v-idf-z74','v-idf-z75','v-idf-z76','v-idf-z77','v-idf-z78','v-idf-z79','v-idf-z710','v-idf-z711','v-idf-u81','v-idf-u82','v-idf-u83'],
  };
  // Prüfungs-Karten (Quiz, Klausuren, Fallbearbeitung, Simulator): kein Haken, nicht im Fortschritt
  const EXAM_VIEWS = new Set(['v-vak-klausurvorbereitung','v-vak-altklausur','v-vak-klausurhinweise','v-vak-fallbearbeitung','v-feuak-altklausur','v-idf-altklausur','v-klausur','v-klausur-0826','v-klausurfragen','v-eingrenzung-klausur','v-simulator','v-laufbahn-2023','v-laufbahn-2026']);
  const LEAF_PARENT = {};
  Object.keys(GROUPS).forEach(g => GROUPS[g].forEach(v => { LEAF_PARENT[v] = g; }));

  function load(){ try{ return JSON.parse(localStorage.getItem('bvi_progress')||'{}'); }catch{ return {}; } }
  function save(d){ try{ localStorage.setItem('bvi_progress',JSON.stringify(d)); }catch{} }

  function track(viewId){
    if(!LEAF_PARENT[viewId]) return;
    const d = load(); d[viewId] = true; save(d);
    updateUI();
  }

  let _cardCache = null;

  // Sammelkacheln: Haken, sobald alle enthaltenen Themen besucht wurden
  const HUBS = {
    'v-feuak-bp-hub':['v-feuak-bedarfsplanung','v-feuak-rdbp','v-feuak-katsbp'],
    'v-feuak-analyse':['v-feuak-stakeholder','v-feuak-risikoanalyse'],
    'v-idf-vb':['v-idf-vb-41','v-idf-vb-42','v-idf-vb-43','v-idf-vb-44','v-idf-vb-45','v-idf-vb-46','v-idf-vb-47','v-idf-vblernen','v-idf-gk','v-idf-sonderbau'],
    'v-idf-stabhub':['v-idf-s51','v-idf-s52','v-idf-s53','v-idf-s54','v-idf-s55','v-idf-sim-stabbau','v-idf-stabskarte'],
    'v-idf-presse':['v-idf-p61','v-idf-p62'],
    'v-idf-zv':['v-idf-z70','v-idf-z71','v-idf-z72','v-idf-z73','v-idf-z74','v-idf-z75','v-idf-z76','v-idf-z77','v-idf-z78','v-idf-z79','v-idf-z710','v-idf-z711'],
    'v-idf-ucpm':['v-idf-u81','v-idf-u82','v-idf-u83']
  };

  function updateUI(){
    const visited = load();
    const allLeafs = Object.values(GROUPS).flat();
    const total = allLeafs.length;
    const done = allLeafs.filter(v=>visited[v]).length;

    if(!_cardCache) _cardCache = document.querySelectorAll('.topic-card');
    _cardCache.forEach(card => {
      const oc = card.getAttribute('onclick')||'';
      const m = oc.match(/NAV\.go\('([^']+)'/);
      if(!m) return;
      const vid = m[1];
      let chk = card.querySelector('.tc-check');
      if(EXAM_VIEWS.has(vid)){ if(chk) chk.remove(); return; }
      const hub = HUBS[vid];
      if(hub ? hub.every(v=>visited[v]) : visited[vid]){
        if(!chk){ chk = document.createElement('span'); chk.className='tc-check'; chk.textContent='✓'; card.style.position='relative'; card.appendChild(chk); }
      } else { if(chk) chk.remove(); }
    });
  }

  function counts(){ const v=load(),r={}; Object.keys(GROUPS).forEach(g=>{ r[g]={done:GROUPS[g].filter(x=>v[x]).length,total:GROUPS[g].length}; }); return r; }
  return { track, updateUI, counts, groupOf:v=>GROUPS[LEAF_PARENT[v]]||null, invalidate(){ _cardCache=null; }, reset(){ localStorage.removeItem('bvi_progress'); updateUI(); } };
})();

/* ======================================================================
   SEARCH – Volltext-Suche über alle Views
====================================================================== */
const SEARCH = (function(){
  let idx = [], results = [], focusIdx = -1, _indexBuilt = false, _debounceTimer = null;
  const HIST_KEY='bvi_search_hist';
  function loadHist(){ try{ return JSON.parse(localStorage.getItem(HIST_KEY)||'[]'); }catch{ return []; } }
  function saveHist(q){ const h=loadHist().filter(x=>x!==q); h.unshift(q); localStorage.setItem(HIST_KEY,JSON.stringify(h.slice(0,5))); }

  const VIEW_LABELS = {
    'v-vak-altklausur':'VAk · Altklausur-Training',
    'v-gal-organisation':'GAL · Organisation','v-gal-brandlehre':'GAL · Brandlehre','v-gal-fahrzeuge':'GAL · Fahrzeuge','v-gal-einsatz':'GAL · Einsatz','v-gal-atemgifte':'GAL · Atemgifte','v-gal-atemschutz':'GAL · Atemschutz','v-gal-vb':'GAL · Vorbeugender Brandschutz','v-gal-beamtenrecht':'GAL · Beamtenrecht','v-gal-beihilferecht':'GAL · Beihilferecht','v-gal-brandbekaempfung':'GAL · Brandbekämpfung','v-gal-einsatztechnik':'GAL · Einsatztechnik','v-gal-erstehilfe':'GAL · Erste Hilfe','v-gal-grundlagen':'GAL · Naturwiss. Grundlagen','v-gal-fahrzeugnormung':'GAL · Fahrzeugnormung','v-gal-fuehrung':'GAL · Führung','v-gal-fwdven':'GAL · FwDVen','v-gal-gabc':'GAL · G-ABC Einsatz','v-gal-loeschlehre':'GAL · Löschlehre','v-gal-loeschmittel-schaum':'GAL · Löschmittel Schaum','v-gal-loeschwasserversorgung':'GAL · Löschwasserversorgung','v-gal-geraetepruefung':'GAL · Geräteprüfung','v-gal-hbkg':'GAL · HBKG','v-gal-kartenkunde':'GAL · Kartenkunde','v-gal-knoten':'GAL · Knoten & Stiche','v-gal-staatsbuerger':'GAL · Staatsbürgerkunde','v-gal-th-verkehr':'GAL · TH Verkehrsunfall','v-gal-leitern':'GAL · Tragbare Leitern','v-gal-uvv':'GAL · UVV','v-gal-waermebildkamera':'GAL · Wärmebildkamera','v-gal-armaturen':'GAL · Wasserführende Armaturen','v-gal-maschinist':'GAL · Maschinist','v-gal-psa':'GAL · Persönliche Schutzausrüstung','v-gal-personalvertretungsrecht':'GAL · Personalvertretungsrecht',
    'v-sfs-fwdv3':'SFS · Führung','v-sfs-methodik':'SFS · Methodik','v-sfs-rechtsgrundlagen':'SFS · Recht','v-sfs-abc':'SFS · Geräte/ABC',
    'v-hlfs-fuehrungsvorgang':'HLFS · Führungsvorgang','v-hlfs-gabc':'HLFS · GABC','v-hlfs-tunnel':'HLFS · Tunnel',
    'v-hlfs-vb':'HLFS · Vorbeugen','v-hlfs-manv':'HLFS · MANV','v-hlfs-zugfuehrer':'HLFS · Zugführer','v-hlfs-stab':'HLFS · Stab',
    'v-ibk-ta':'IBK · TA','v-ibk-konflikt':'IBK · Konflikt','v-ibk-stress':'IBK · Stress',
    'v-ibk-psnv':'IBK · PSNV','v-ibk-bgm':'IBK · BGM','v-ibk-pm':'IBK · PM','v-ibk-zeit':'IBK · Zeitmanagement',
    'v-vak-klausurvorbereitung':'VAk · Klausurvorbereitung','v-vak-jur-denken':'VAk · Juristisches Denken',
    'v-vak-verwaltungsrecht':'VAk · Allgemeines Verwaltungsrecht','v-vak-staatsrecht':'VAk · Staatsrecht',
    'v-vak-einsatzrecht':'VAk · Einsatzrecht','v-vak-dienstrecht':'VAk · Öffentliches Dienstrecht',
    'v-vak-klausurhinweise':'VAk · Klausurhinweise','v-vak-rettungsdienstrecht':'VAk · Rettungsdienstrecht','v-vak-fallbearbeitung':'VAk · Fallbearbeitung',
    'v-feuak-vwl':'FeuAK · VWL','v-feuak-haushalt':'FeuAK · Haushalt',
    'v-feuak-pm':'FeuAK · Strategisches Management',
    'v-feuak-bedarfsplanung':'FeuAK · Brandschutzbedarfsplanung',
    'v-feuak-rdbp':'FeuAK · RD-Bedarfsplanung',
    'v-feuak-katsbp':'FeuAK · KatS-Bedarfsplanung',
    'v-feuak-altklausur':'FeuAK · Altklausur-Training',
    'v-feuak-planspiel':'FeuAK · Planspiel MANV',
    'v-feuak-qm':'FeuAK · Qualitätsmanagement',
    'v-feuak-beschaffung':'FeuAK · Beschaffungspraxis',
    'v-feuak-stakeholder':'FeuAK · Stakeholder-Analyse',
    'v-feuak-risikoanalyse':'FeuAK · Prospektive Risikoanalyse',
    'v-idf-vb':'IdF · Vorbeugender Brandschutz',
    'v-idf-stabhub':'IdF · Stabsarbeit',
    'v-idf-stabskarte':'IdF · Taschenkarte Stabsarbeit',
    'v-idf-vblernen':'IdF · VB-Prüfung lernen',
    'v-idf-gk':'IdF · Gebäudeklassen-Baukasten',
    'v-idf-sonderbau':'IdF · Sonderbauten',
    'v-idf-s51':'IdF · Stabsarbeit · Begrifflichkeiten','v-idf-s52':'IdF · Stabsarbeit · Gliederung der Einsatzleitung','v-idf-s53':'IdF · Stabsarbeit · Gliederung des Krisenstabs','v-idf-s54':'IdF · Stabsarbeit · Human Factors','v-idf-s55':'IdF · Stabsarbeit · Werkzeuge',
    'v-idf-sim-stabbau':'IdF · Simulation Stab aufbauen','v-idf-sim-pressesim':'IdF · Simulation Pressegespräch','v-idf-sim-warnsim':'IdF · Simulation Warn-Simulation',
    'v-idf-zv':'IdF · Zivile Verteidigung','v-idf-ucpm':'IdF · EU-Katastrophenschutz (UCPM)',
    'v-idf-altklausur':'IdF · Altklausur-Quiz',
    'v-laufbahn-2023':'Laufbahnprüfung · Klausuren Dez 2023',
    'v-laufbahn-2026':'Laufbahnprüfung · Klausuren Juni 2026',
    'v-lb-start':'Laufbahnprüfung · Dezember','v-lb-ibk1':'Laufbahn · IBK Klausur 1','v-lb-ibk2':'Laufbahn · IBK Klausur 2','v-lb-vb':'Laufbahn · VB Klausur IdF NRW',
    'v-idf-presse':'IdF · Presse- & Öffentlichkeitsarbeit',
    'v-ibk-fuehren-gruppen':'IBK · Führen von Gruppen',
    'v-ibk-fuehrung':'IBK · Führung und Führungsaufgaben',
    'v-ibk-autoritaeten':'IBK · Autoritäten und Kompetenzen',
    'v-ibk-fuehrungsstile':'IBK · Führungsstile',
    'v-ibk-onboarding':'IBK · Onboarding',
    'v-vak-lernarbeitsblatt':'VAk · Lernarbeitsblatt Berlin',
    'v-feuak-bwl':'FeuAK · BWL',
    'v-feuak-rechnungswesen':'FeuAK · Rechnungswesen',
    'v-feuak-pruefung':'FeuAK · Prüfungsleistung Hamburg',
    'v-feuak-lernblatt-hh':'FeuAK · Lernarbeitsblatt Hamburg',
    'v-feuak-lernblatt-2026':'FeuAK · Lernarbeitsblatt Hamburg BVI April 2026',
    'v-idf-vb-41':'IdF · Wichtige Prüfschemata',
    'v-idf-vb-42':'IdF · Begriffe des VB',
    'v-idf-vb-43':'IdF · Gebäudeklassen',
    'v-idf-vb-44':'IdF · Baurecht',
    'v-idf-vb-45':'IdF · Grundsatzanforderungen',
    'v-idf-vb-46':'IdF · Bau nach MBO',
    'v-idf-vb-47':'IdF · Sonderbau',
    'v-idf-p61':'IdF · Rechtsgrundlagen & Grundsätze der Pressearbeit',
    'v-idf-p62':'IdF · Presse- und Medienarbeit bei der Feuerwehr',
    'v-idf-z70':'IdF · Genfer Konventionen',
    'v-idf-z71':'IdF · Konzeption Zivile Verteidigung',
    'v-idf-z72':'IdF · Regelkreis im Bevölkerungsschutz',
    'v-idf-z73':'IdF · Risikoanalyse im Bevölkerungsschutz',
    'v-idf-z74':'IdF · Gesamtszenario',
    'v-idf-z75':'IdF · KRITIS – Kritische Infrastrukturen',
    'v-idf-z76':'IdF · Länderübergreifende Hilfe & Fähigkeitsmanagement',
    'v-idf-z77':'IdF · Weißer Katastrophenschutz',
    'v-idf-z78':'IdF · Einsatz der Bundeswehr im Inneren',
    'v-idf-z79':'IdF · Warnung durch den Bund',
    'v-idf-z710':'IdF · Zivile Alarmplanung',
    'v-idf-z711':'IdF · Feuerwehren in der Zivilen Verteidigung',
    'v-idf-u81':'IdF · Weg des Hilfeersuchens',
    'v-idf-u82':'IdF · Rechtsgrundlagen und Akteure',
    'v-idf-u83':'IdF · ECPP Kapazitätenpyramide',
  };

  function stripHtml(s){ const d=document.createElement('div');d.innerHTML=s;return d.textContent||''; }

  // Nummer des Kapitels (Akkordeon-Abschnitt), in dem ein Element liegt; -1 = nicht in einem Kapitel
  function chOf(el){
    const d=el.closest('.acc-item'), v=el.closest('.view'); if(!d||!v) return -1;
    return [...v.querySelectorAll('.pc .acc-item')].indexOf(d);
  }
  function buildIndex(){
    if(_indexBuilt) return;
    _indexBuilt = true;
    if(typeof VIEWS!=='undefined') VIEWS.ensureAll();   // die Suche braucht den Inhalt aller Ansichten
    idx = [];
    Object.keys(VIEW_LABELS).forEach(vid => {
      if(/^v-lb-/.test(vid)) return;   // gesperrter Bereich nicht in der Suche
      const el = document.getElementById(vid); if(!el) return;
      const lbl = VIEW_LABELS[vid];
      // Ausgeblendete Kapitel, Blöcke und Reiter des Jahrgangs gehören nicht in die Suche
      const gone = (typeof JGUI!=='undefined'&&JGUI.goneEls) ? JGUI.goneEls(vid) : [], hid = n => gone.some(g => g.contains(n));
      el.querySelectorAll('.sec-h,.tc-name,.page-title,.def-box-label').forEach(h => {
        const t = h.textContent.trim(); if(t.length < 3 || hid(h)) return;
        idx.push({vid, lbl, title:t, snippet:'', boost:3, ch:chOf(h)});
      });
      el.querySelectorAll('.def-box p,.info-card p,.bl li,.step-desc,.hint p,.tc-sub,.ant-desc,.pillar ul li').forEach(p => {
        const t = p.textContent.trim(); if(t.length < 8 || hid(p)) return;
        const hdr = p.closest('.info-card,.def-box,.step-item');
        const ttl = hdr ? (hdr.querySelector('.info-card-title,.def-box-label,.step-title')||{}).textContent||lbl : lbl;
        idx.push({vid, lbl, title:ttl.trim(), snippet:t.slice(0,400), boost:1, ch:chOf(p)});
      });
    });
    // Lernkarten in den Index aufnehmen
    FLASHCARD_DATA.forEach(c=>{
      const lbl='Lernkarten · '+c.cat;
      const aText=stripHtml(c.a);
      idx.push({vid:'v-flashcards',lbl,title:c.q,snippet:aText.slice(0,400),boost:2,isCard:true});
    });
  }

  // Attributwert für onclick="…" absichern (JSON enthält Anführungszeichen)
  const attr=t=>String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  // Treffer markieren, ohne HTML-Entitäten wie &amp; zu zerreißen
  function hl(text, q){
    const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
    return text.split(/(&(?:[a-z]+|#\d+);)/i).map((p,i)=>i%2?p:p.replace(re,'<mark>$1</mark>')).join('');
  }
  function contextSnippet(text, q, len=160){
    if(!text) return '';
    const terms=q.toLowerCase().split(/\s+/).filter(Boolean);
    const lower=text.toLowerCase();
    let best=-1;
    for(const t of terms){const p=lower.indexOf(t);if(p>=0&&(best<0||p<best))best=p;}
    if(best<0) return text.slice(0,len)+(text.length>len?'…':'');
    const start=Math.max(0,best-55);
    const end=Math.min(text.length,start+len);
    return(start>0?'…':'')+text.slice(start,end)+(end<text.length?'…':'');
  }

  // Umlaute und Akzente vereinheitlichen, damit „Ubung“ auch „Übung“ findet
  const norm=t=>String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ß/g,'ss');
  function lev(a,b,max){
    if(Math.abs(a.length-b.length)>max) return max+1;
    let prev=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      const cur=[i]; let rowMin=i;
      for(let j=1;j<=b.length;j++){
        cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
        if(cur[j]<rowMin) rowMin=cur[j];
      }
      if(rowMin>max) return max+1;
      prev=cur;
    }
    return prev[b.length];
  }
  // Tippfehler: ab 5 Buchstaben ein Fehler, ab 8 Buchstaben zwei Fehler erlaubt
  const wordsOf=t=>norm(t).split(/[^a-z0-9]+/).filter(x=>x.length>=4);
  function fuzzyIn(ws,t){
    if(t.length<5) return false;
    const max=t.length>=8?2:1;
    return ws.some(w=>lev(w,t,max)<=max);
  }
  function fuzzyHas(e,t){ return fuzzyIn(e.w||(e.w=wordsOf(e.title+' '+e.snippet)),t); }
  // Eigene Inhalte des Jahrgangs: Kapitel, Ergänzungen, Reiter
  function jgEntries(){
    if(typeof JG==='undefined'||JG.isMaster()) return [];
    const d=JG.data(), out=[];
    const rid=s=>/^v-r-/.test(s)?s.slice(4):null;
    d.erg.forEach(e=>{
      const r=rid(e.seite), rt=r&&d.reiter.find(x=>x.id===r);
      if(r&&!rt) return;
      const lbl=r?'Eigener Reiter · '+rt.titel:(VIEW_LABELS[e.seite]||e.seite);
      out.push({vid:r?'v-jg-reiter':e.seite,lbl,title:(e.titel||'Ergänzung').trim(),snippet:String(e.text||'').slice(0,400),boost:e.typ==='kapitel'?3:1,jgReiter:r||null,ch:-1});
    });
    d.reiter.forEach(r=>out.push({vid:'v-jg-reiter',lbl:'Eigener Reiter',title:r.titel,snippet:r.beschr||'',boost:3,jgReiter:r.id,ch:-1}));
    return out;
  }
  function noteEntries(){
    const out=[];
    try{
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(!k||!k.startsWith('bvi_note_')) continue;
        const text=(localStorage.getItem(k)||'').trim(); if(!text) continue;
        const vid=k.slice(9), lbl=VIEW_LABELS[vid]||vid;
        out.push({vid,lbl:'Notiz · '+lbl,title:text.split('\n')[0].slice(0,90),snippet:text.slice(0,400),boost:3,isNote:true});
      }
    }catch(e){}
    return out;
  }

  // Suchbereich: auf Lehrgangs- und Themenseiten nur Inhalte dieser Seite und ihrer Unterseiten (aus den Karten der Seite abgeleitet)
  let scope=null;
  const ROOT_VIEWS=new Set(['v-home','v-pruefung','v-settings','v-plan','v-flashcards','v-pause','v-notizen','v-bookmarks','v-app','v-impressum','v-datenschutz','v-set-nav','v-klausur']);
  function computeScope(){
    const v=document.querySelector('.view.active'); if(!v||!v.id||ROOT_VIEWS.has(v.id)||/^v-lb-/.test(v.id)) return null;
    const seen=new Set([v.id]), q=[v.id];
    while(q.length){ const el=document.getElementById(q.shift()); if(!el) continue;
      el.querySelectorAll('[onclick*="NAV.go(\'v-"]').forEach(x=>{ if(x.closest('.related-topics,.m-tourhome')) return; const m=/NAV\.go\('(v-[\w-]+)'/.exec(x.getAttribute('onclick')||''); if(m&&!seen.has(m[1])&&!ROOT_VIEWS.has(m[1])){ seen.add(m[1]); q.push(m[1]); } }); }
    const t=v.querySelector('.page-title'), label=(t?t.textContent:'').replace(/\s+/g,' ').trim()||VIEW_LABELS[v.id]||'dieser Seite';
    return {ids:seen,label};
  }
  function syncScope(){
    const chip=document.getElementById('search-scope'), inp=document.getElementById('search-input'); if(!chip||!inp) return;
    chip.hidden=!scope;
    if(scope){ chip.querySelector('.ss-t').textContent=scope.label; chip.title='Nur in „'+scope.label+'“ suchen – antippen, um überall zu suchen'; }
    inp.setAttribute('aria-label',scope?'Suche in '+scope.label:'Suche');
  }
  function doSearch(q){
    if(!q || q.length < 2) return [];
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const all = (scope?idx.filter(e=>scope.ids.has(e.vid)):idx.concat(noteEntries(), jgEntries()));   // Ebene: nur Inhalte der aktuellen Seite und ihrer Unterseiten
    const hayOf=e=>e.h||(e.isNote?norm(e.title+' '+e.snippet+' '+e.lbl):(e.h=norm(e.title+' '+e.snippet+' '+e.lbl)));
    let scored = all.map(e => {
      const hay = hayOf(e);
      const score = terms.reduce((s,t) => s + (hay.includes(t) ? e.boost : 0), 0);
      return {...e, score};
    }).filter(e => e.score > 0);
    if(scored.length<4 && terms.some(t=>t.length>=5)){
      const have=new Set(scored.map(e=>e.vid+'|'+e.title));
      all.forEach(e=>{
        if(have.has(e.vid+'|'+e.title)) return;
        const hay=hayOf(e);
        const tw=wordsOf(e.title);
        const sc=terms.reduce((s,t)=>s+(hay.includes(t)?e.boost:(fuzzyHas(e,t)?e.boost*.6+(fuzzyIn(tw,t)?2:0):0)),0);
        if(sc>0) scored.push({...e,score:sc,fuzzy:true});
      });
    }
    scored.sort((a,b) => b.score-a.score);
    const seen = new Set();
    const uniq = scored.filter(e => { const k=e.vid+'|'+e.title; if(seen.has(k)) return false; seen.add(k); return true; });
    const pick=(f,n)=>uniq.filter(f).slice(0,n);
    return [
      ...pick(e=>e.isNote,4).map(e=>({...e,grp:'Notizen'})),
      ...pick(e=>!e.isCard&&!e.isNote,8).map(e=>({...e,grp:'Seiten und Themen'})),
      ...pick(e=>e.isCard,6).map(e=>({...e,grp:'Lernkarten'}))
    ];
  }

  // ── Kapitel der aktuellen Seite in der Suche ──
  function quick(q){
    const v=document.querySelector('.view.active'), vid=v&&v.id, out=[];
    const t=norm(q||'').trim();
    if(v){
      const its=[...v.querySelectorAll('.pc .acc-item')];
      its.forEach((d,i)=>{
        const ti=(d.querySelector('summary .acc-title,summary .acc-h')||d.querySelector('summary')).textContent.replace(/\s+/g,' ').trim();
        if(t?norm(ti).includes(t):i<8) out.push({grp:'Kapitel dieser Seite',lbl:String(i+1).padStart(2,'0'),title:ti,snippet:'',act:()=>LP.focus(vid,i),quick:true});
      });
    }
    return out.slice(0,t?14:16);
  }
  function quickHtml(items,q){
    let lastGrp='';
    return items.map((r,i)=>{
      const head=r.grp!==lastGrp?`<div class="sr-group">${r.grp}</div>`:''; lastGrp=r.grp;
      return head+`<div class="search-result" data-idx="${i}" onclick="SEARCH.go(${i})"><span class="sr-section">${xss(r.lbl)}</span><div><div class="sr-title">${q?hl(xss(r.title),q):xss(r.title)}</div></div></div>`;
    }).join('');
  }

  function renderBookmarks(){
    const el = document.getElementById('search-results'); if(!el) return;
    const bks = (typeof BOOKMARKS!=='undefined') ? BOOKMARKS.getAll() : [];
    const hist = loadHist();
    let html = '';
    if(bks.length) html+='<div class="bk-section"><div class="bk-section-title">⭐ Lesezeichen</div>'
      +bks.map(b=>`<div class="bk-item" onclick="SEARCH.goBk(${attr(JSON.stringify(b.id))},${attr(JSON.stringify(b.label||b.id))})">`
        +`<span class="bk-label">${xss(b.label||b.id)}</span>`
        +`<button class="bk-del" onclick="event.stopPropagation();SEARCH.removeBk(${attr(JSON.stringify(b.id))})" aria-label="Lesezeichen entfernen">✕</button>`
        +'</div>').join('')+'</div>';
    if(hist.length) html+='<div class="bk-section"><div class="bk-section-title">🕐 Zuletzt gesucht</div>'
      +hist.map(q=>`<div class="bk-item" onclick="SEARCH.runHist(${attr(JSON.stringify(q))})">`
        +`<span class="bk-label">${xss(q)}</span>`
        +`<button class="bk-del" onclick="event.stopPropagation();SEARCH.clearHist()" aria-label="Suchverlauf löschen">✕</button>`
        +'</div>').join('')+'</div>';
    if(!html) html='<div class="search-idle">Suchbegriff eingeben – z.&nbsp;B. <em>AVIVA</em>, <em>Glasl</em>, <em>MANV</em></div>';
    el.innerHTML=quickHtml(results,'')+html;
  }

  function render(q){
    const el = document.getElementById('search-results');
    const sb=document.querySelector('#search-overlay .search-box'); if(sb) sb.classList.toggle('sr-empty',!q);   // ohne Eingabe nur das Suchfeld, keine Fläche darunter
    if(!q){ results=quick(''); focusIdx=-1; renderBookmarks(); return; }
    results = [...quick(q), ...doSearch(q)];
    if(!results.length){ el.innerHTML='<div class="search-empty">Keine Treffer für <strong>'+xss(q)+'</strong></div>'; focusIdx=-1; return; }
    let lastGrp='';
    el.innerHTML = results.map((r,i)=>{
      const head=r.grp!==lastGrp?`<div class="sr-group">${r.grp}</div>`:''; lastGrp=r.grp;
      if(r.quick) return head+`<div class="search-result" data-idx="${i}" onclick="SEARCH.go(${i})"><span class="sr-section">${xss(r.lbl)}</span><div><div class="sr-title">${hl(xss(r.title),q)}</div></div></div>`;
      return head+`<div class="search-result" data-idx="${i}" onclick="SEARCH.go(${i})"><span class="sr-section">${xss(r.lbl)}</span><div><div class="sr-title">${hl(xss(r.title),q)}${r.fuzzy?' <i class="sr-fz">ähnlich</i>':''}</div>${r.snippet?`<div class="sr-snippet">${hl(xss(contextSnippet(r.snippet,q)),q)}</div>`:''}</div></div>`;
    }).join('');
    focusIdx = -1;
    drop(el);
  }

  // Live-Vorschläge fallen nacheinander ein (45 ms Abstand, höchstens 12)
  function drop(el){ el.querySelectorAll('.search-result').forEach((r,i)=>{ r.style.setProperty('--d',Math.min(i,12)*45+'ms'); r.classList.add('sr-drop'); }); }
  function syncClear(){ const i=document.getElementById('search-input'), c=document.getElementById('search-clear'); if(c&&i) c.hidden=!i.value; }
  let _typeT=0;
  function typePlaceholder(inp){
    clearTimeout(_typeT); const full=scope?'Hier suchen …':'Suchen …'; let n=0; inp.placeholder='';
    (function step(){ if(n<=full.length){ inp.placeholder=full.slice(0,n++); _typeT=setTimeout(step,45); } })();
  }

  function setFocus(i){
    const items = document.querySelectorAll('#search-results .search-result');
    items.forEach(e=>e.classList.remove('sr-focus'));
    if(i>=0 && i<items.length){ items[i].classList.add('sr-focus'); items[i].scrollIntoView({block:'nearest'}); }
    focusIdx = i;
  }

  return {
    open(trigger){
      buildIndex(); scope=computeScope(); syncScope();
      document.getElementById('search-overlay').classList.remove('hidden');
      const inp = document.getElementById('search-input');
      inp.value = ''; inp.focus(); render(''); syncClear();
      // Icon Expand: der runde Knopf zieht sich zur Suchleiste auf, der Platzhalter wird getippt
      const box=document.querySelector('#search-overlay .search-box');
      if(box&&!false){
        this.expand(box,trigger);
        typePlaceholder(inp);
      }
    },
    // Icon Expand: das Feld wächst aus dem angetippten Symbol/Knopf heraus (auch für das Passwortfeld der Laufbahn)
    expand(box,trigger){
      if(!box||false) return;
      box.classList.remove('sr-expand');
      if(trigger&&trigger.getBoundingClientRect&&box.animate){
        const t=trigger.getBoundingClientRect(), r=box.getBoundingClientRect();
        const dx=(t.left+t.width/2)-(r.left+r.width/2), dy=(t.top+t.height/2)-(r.top+r.height/2), s=Math.max(.06,t.height/Math.max(r.height,1));
        box.animate([{transform:`translate(${dx}px,${dy}px) scale(${s})`,opacity:0,borderRadius:'60px'},{transform:`translate(${dx*.25}px,${dy*.25}px) scale(.8)`,opacity:1,borderRadius:'36px',offset:.35},{transform:'none',opacity:1,borderRadius:'24px'}],{duration:480,easing:'cubic-bezier(.2,.9,.2,1)'});
      } else { void box.offsetWidth; box.classList.add('sr-expand'); }
    },
    // Suchbereich aufheben: überall suchen
    widen(){ scope=null; syncScope(); const inp=document.getElementById('search-input'); if(inp){ inp.placeholder='Suchen …'; inp.focus(); render(inp.value.trim()); } },
    // Clear Field: die Buchstaben fallen weg, der Platzhalter blendet wieder ein
    clearField(){
      const inp=document.getElementById('search-input'), fall=document.getElementById('search-fall'); if(!inp) return;
      const txt=inp.value; clearTimeout(_debounceTimer);
      if(txt&&fall&&!false){
        fall.innerHTML=[...txt].map((c,i)=>`<i style="--dx:${(Math.random()*30-15).toFixed(0)}px;--r:${(Math.random()*80-40).toFixed(0)}deg;animation-delay:${i*18}ms">${c===' '?'&nbsp;':xss(c)}</i>`).join('');
        setTimeout(()=>{ fall.innerHTML=''; }, 650+txt.length*18);
      }
      inp.value=''; syncClear(); render(''); inp.classList.remove('sr-ph-in'); void inp.offsetWidth; inp.classList.add('sr-ph-in'); inp.focus();
    },
    // Search Loading: beim Absenden dreht sich das Symbol, Platzhalter-Zeilen schimmern, dann blenden die Treffer ein
    load(q){
      const el=document.getElementById('search-results'), ic=document.querySelector('#search-overlay .search-ic'); if(!el) return;
      if(false){ render(q); return; }
      if(ic) ic.classList.add('sr-spin');
      el.innerHTML='<div class="sr-skel" aria-hidden="true">'+'<div class="sr-sk-row"><i></i><b></b><u></u></div>'.repeat(4)+'</div>';
      setTimeout(()=>{ render(q); el.classList.remove('sr-fade'); void el.offsetWidth; el.classList.add('sr-fade'); if(ic) ic.classList.remove('sr-spin'); },520);
    },
    close(){ document.getElementById('search-overlay').classList.add('hidden'); results=[]; focusIdx=-1; },
    reset(){ _indexBuilt=false; },
    toggle(){ document.getElementById('search-overlay').classList.contains('hidden') ? this.open() : this.close(); },
    query(q){ clearTimeout(_debounceTimer); syncClear(); _debounceTimer = setTimeout(()=>render(q.trim()), 120); },
    goBk(id,label){ this.close(); NAV.go(id,label||id); },
    removeBk(id){ if(typeof BOOKMARKS!=='undefined') BOOKMARKS.remove(id); renderBookmarks(); },
    keydown(e){
      if(e.key==='Escape'){ this.close(); return; }
      if(e.key==='ArrowDown'){ e.preventDefault(); setFocus(Math.min(focusIdx+1,results.length-1)); return; }
      if(e.key==='ArrowUp'){ e.preventDefault(); setFocus(Math.max(focusIdx-1,0)); return; }
      if(e.key==='Enter' && focusIdx>=0){ this.go(focusIdx); return; }
      if(e.key==='Enter'){ const q=e.target.value.trim(); if(q){ clearTimeout(_debounceTimer); saveHist(q); this.load(q); } return; }
    },
    go(i){
      const r = results[i]; if(!r) return;
      if(r.quick){ this.close(); setTimeout(r.act,60); return; }
      saveHist(document.getElementById('search-input').value.trim());
      this.close();
      const lbl = r.lbl.split('·').pop().trim();
      if(r.jgReiter&&typeof JGUI!=='undefined'){ JGUI.openReiter(r.jgReiter); return; }
      NAV.go(r.vid, lbl);
      if(r.ch>=0&&typeof LP!=='undefined') setTimeout(()=>LP.focus(r.vid,r.ch),80);
    },
    runHist(q){
      const inp=document.getElementById('search-input');
      if(inp){ inp.value=q; render(q); }
    },
    clearHist(){ localStorage.removeItem(HIST_KEY); renderBookmarks(); }
  };
})();

/* ======================================================================
   SETTINGS
====================================================================== */
/* ======================================================================
   TOAST
====================================================================== */
/* ======================================================================
   A11Y – Hilfen für Screenreader und Tastatur: Live-Ansage, Hauptbereich, Sprunglink
====================================================================== */
const A11Y=(function(){
  let t=0;
  return{
    // Text vorlesen lassen (höflich, unterbricht nichts); gleicher Text hintereinander wird erneut angesagt
    say(msg){ const el=document.getElementById('a11y-live'); if(!el) return; clearTimeout(t); el.textContent=''; t=setTimeout(()=>{ el.textContent=String(msg).replace(/<[^>]*>/g,'').trim(); },60); },
    // die sichtbare Seite ist der Hauptbereich (genau einer zur Zeit)
    onShow(){ document.querySelectorAll('.view[role="main"]').forEach(v=>v.removeAttribute('role')); const a=document.querySelector('.view.active'); if(a){ a.setAttribute('role','main'); a.setAttribute('aria-label',(a.querySelector('.page-title')?.textContent||'').trim()||'Inhalt'); } },
    skip(e){ e.preventDefault(); const a=document.querySelector('.view.active'); if(!a) return; a.setAttribute('tabindex','-1'); a.focus({preventScroll:false}); }
  };
})();

/* ======================================================================
   OVL – Fenster (Suche, Notiz, Pomodoro …): Fokus hinein und zurück, Tab bleibt im Fenster,
   Esc schließt nur das oberste, Zurück (Browser/Android) schließt das Fenster statt die Seite dahinter
====================================================================== */
const OVL=(function(){
  const DEFS={
    'search-overlay':()=>SEARCH.close(), 'shortcuts-overlay':()=>document.getElementById('shortcuts-overlay').classList.add('hidden'),
    'pomodoro-overlay':()=>POMO.close(), 'onboarding-overlay':()=>ONBOARD.close(),
    'quiz-mastery-modal':()=>QUIZ.closeMastery(), 'quiz-mastery-modal-idf':()=>IDFQ.closeMastery(),
    'notes-overlay':()=>NOTES.close(), 'changelog-modal':()=>CHANGELOG.close(), 'lb-field':()=>LB.closeModal()
  };
  const order=[], opener={}; let skip=0;
  const el=id=>document.getElementById(id);
  const isOpen=id=>{ const e=el(id); return !!e&&!e.classList.contains('hidden'); };
  const top=()=>{ for(let i=order.length-1;i>=0;i--) if(isOpen(order[i])) return order[i]; return null; };
  const focusables=root=>[...root.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(e=>!e.disabled&&!e.hidden&&e.offsetParent!==null&&e.tabIndex>=0);
  function onChange(id){
    const e=el(id); if(!e) return;
    const open=isOpen(id), idx=order.indexOf(id);
    if(open&&idx<0){
      order.push(id); opener[id]=document.activeElement;
      setTimeout(()=>{ if(!isOpen(id)||e.contains(document.activeElement)) return; const f=focusables(e)[0]; if(f) f.focus({preventScroll:true}); },30);
    } else if(!open&&idx>=0){
      order.splice(idx,1); const o=opener[id]; delete opener[id];
      if(o&&o.isConnected&&o!==document.body&&!order.length) try{ o.focus({preventScroll:true}); }catch(err){}
    }
  }
  function init(){
    const mo=new MutationObserver(m=>m.forEach(r=>onChange(r.target.id)));
    Object.keys(DEFS).forEach(id=>{ const e=el(id); if(e){ mo.observe(e,{attributes:true,attributeFilter:['class']}); onChange(id); } });
    document.addEventListener('keydown',e=>{
      if(e.key!=='Tab') return;
      const t=top(); if(!t) return;
      const f=focusables(el(t)); if(!f.length) return;
      const a=document.activeElement, first=f[0], last=f[f.length-1];
      if(!el(t).contains(a)){ e.preventDefault(); first.focus(); }
      else if(e.shiftKey&&a===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey&&a===last){ e.preventDefault(); first.focus(); }
    },true);
  }
  return {
    init, top, any:()=>!!top(),
    closeTop(){ const t=top(); if(!t) return false; DEFS[t](); return true; },
    escape(e){ if(!OVL.closeTop()) return false; if(e) e.preventDefault(); return true; },
    // Browser-Zurück bei offenem Fenster: Fenster schließen und die Seite dahinter behalten
    onPop(e,depth){
      if(skip>0){ skip--; return true; }
      if(!OVL.closeTop()) return false;
      const n=(e.state&&e.state.stack)?e.state.stack.length:0;
      if(n<depth){ skip=1; try{ history.forward(); }catch(err){ skip=0; } }
      return true;
    }
  };
})();

// Zurück-Taste der Android-App: "handled" (Fenster/Kapitel geschlossen), "exit" (Startseite) oder "back"
window.bviBack=function(){
  if(typeof JGUI!=='undefined'&&JGUI.closeTop()) return 'handled';
  if(OVL.closeTop()) return 'handled';
  if(typeof SPEISE!=='undefined'&&SPEISE.isOpen()){ SPEISE.close(); return 'handled'; }
  if(typeof RAUMPLAN!=='undefined'&&RAUMPLAN.isOpen()){ RAUMPLAN.close(); return 'handled'; }
  if(typeof LIGHTBOX!=='undefined'&&LIGHTBOX.isOpen()){ LIGHTBOX.close(); return 'handled'; }
  if(typeof LP!=='undefined'&&LP.isOpen()){ LP.back(); return 'handled'; }
  const v=document.querySelector('.view.active');
  return !v||v.id==='v-home'?'exit':'back';
};

const TOAST = (function(){
  let wrap;
  function container(){ if(!wrap){ wrap=document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); } return wrap; }
  return {
    show(msg, {type='',undo=null,duration=4200,label='Rückgängig'}={}){
      // gleiche Meldung nicht doppelt stapeln
      if([...container().querySelectorAll('.toast:not(.toast-out) .toast-msg')].some(e=>e.textContent===String(msg).replace(/<[^>]*>/g,''))) return;
      const t=document.createElement('div');
      t.className='toast'+(type?' toast-'+type:'');
      t.innerHTML=`<span class="toast-msg">${msg}</span>${undo?'<button class="toast-undo">'+label+'</button>':''}`;
      if(undo) t.querySelector('.toast-undo').addEventListener('click',()=>{ undo(); this.dismiss(t); });
      container().appendChild(t);
      A11Y.say(msg);
      t._timer=setTimeout(()=>this.dismiss(t),duration);
    },
    dismiss(t){
      clearTimeout(t._timer);
      t.classList.add('toast-out');
      t.addEventListener('animationend',()=>t.remove(),{once:true});
    }
  };
})();

/* ── Rückgängig/Wiederholen für Einstellungen, Lernstand, Klausurtermin, Notizen und Jahrgangs-Import: dauerhaft sichtbare Knöpfe statt kurz eingeblendetem „Rückgängig“ ── */
const UNDO=(function(){
  const u=[], r=[];
  const refresh=()=>{ document.querySelectorAll('.ud-undo').forEach(b=>{ b.disabled=!u.length; }); document.querySelectorAll('.ud-redo').forEach(b=>{ b.disabled=!r.length; }); };
  const html=()=>'<button type="button" class="btn btn-ghost ud-undo" aria-label="Rückgängig" title="Rückgängig"'+(u.length?'':' disabled')+'><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg></button><button type="button" class="btn btn-ghost ud-redo" aria-label="Aktion wiederholen" title="Wiederholen"'+(r.length?'':' disabled')+'><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg></button>';
  // undo/redo stellen jeweils den Stand vor bzw. nach der Aktion her
  function push(label,undo,redo){ u.push({label,undo,redo}); if(u.length>30) u.shift(); r.length=0; refresh(); }
  function back(){ const a=u.pop(); if(!a) return false; try{ a.undo(); }catch(e){} r.push(a); refresh(); TOAST.show(a.label+': rückgängig gemacht',{type:'ok'}); return true; }
  function again(){ const a=r.pop(); if(!a) return false; try{ a.redo(); }catch(e){} u.push(a); refresh(); TOAST.show(a.label+': wiederholt',{type:'ok'}); return true; }
  document.addEventListener('click',e=>{ const x=e.target.closest('.ud-undo,.ud-redo'); if(!x) return; e.preventDefault(); if(x.classList.contains('ud-undo')) back(); else again(); });
  return {push,html,refresh,undo:back,redo:again};
})();

const SETTINGS = (function(){
  return {
    resetTopics(){
      const snap=localStorage.getItem('bvi_progress');
      if(!confirm('Lernfortschritt wirklich zurücksetzen?')) return;
      PROGRESS.reset();
      const after=localStorage.getItem('bvi_progress'), put=v=>{ if(v===null) localStorage.removeItem('bvi_progress'); else localStorage.setItem('bvi_progress',v); PROGRESS.updateUI(); };
      UNDO.push('Themen-Fortschritt zurücksetzen',()=>put(snap),()=>put(after));
      TOAST.show('Themen-Fortschritt zurückgesetzt',{type:'ok'});
    },
    resetCards(){
      const snap=localStorage.getItem('bvi_fc');
      if(!confirm('Lernkarten-Lernstand wirklich zurücksetzen?')) return;
      localStorage.removeItem('bvi_fc');
      const redraw=()=>{ if(document.getElementById('v-flashcards').classList.contains('active')) FC.start(true); }, put=v=>{ if(v===null) localStorage.removeItem('bvi_fc'); else localStorage.setItem('bvi_fc',v); redraw(); };
      redraw();
      UNDO.push('Lernkarten zurücksetzen',()=>put(snap),()=>put(null));
      TOAST.show('Lernkarten zurückgesetzt',{type:'ok'});
    },
    // Schriftgröße stufenlos: Position 0 bis 3 (14 px bis 20 px, 16 px = Standard); alte Werte sm/md/lg/xl werden übernommen
    fsPos(){
      const v=localStorage.getItem('bvi_font_size'), L={sm:0,md:1,lg:2,xl:3};
      const n=v in L?L[v]:parseFloat(v);
      return isFinite(n)?Math.min(3,Math.max(0,n)):1;
    },
    setFontSize(pos,save){
      const p=Math.min(3,Math.max(0,+pos||0)), px=14+2*p, h=document.documentElement;
      h.style.fontSize=px+'px';
      h.classList.remove('fs-sm','fs-lg','fs-xl');
      if(p<.5) h.classList.add('fs-sm'); else if(p>=2.5) h.classList.add('fs-xl'); else if(p>=1.5) h.classList.add('fs-lg');
      if(save!==false){ try{ localStorage.setItem('bvi_font_size',String(Math.round(p*100)/100)); }catch(e){} }
      this._restoreFsUI(p);
    },
    fsSlide(v){ this.setFontSize(v); },
    restoreFontSize(){ this.setFontSize(this.fsPos(),false); },
    _restoreFsUI(p){
      if(p===undefined) p=this.fsPos();
      const r=document.getElementById('fs-range'), tg=document.getElementById('fs-tag');
      if(r&&document.activeElement!==r) r.value=p;
      if(tg){ tg.textContent=Math.round((14+2*p)/16*100)+' %'; tg.style.left='calc(14px + (100% - 28px) * '+(p/3)+')'; }
      const fill=document.getElementById('fs-sl'); if(fill) fill.style.setProperty('--p',(p/3*100)+'%');
    },
    async toggleNotif(on){ if(typeof NOTIF!=='undefined') await NOTIF.setEnabled(on); },
    setNotifHour(h){ if(typeof NOTIF!=='undefined') NOTIF.setHour(h); }
  };
})();


/* ======================================================================
   NOTES – Seitennotizen (localStorage pro View)
====================================================================== */
const NOTES = (function(){
  let _view = null, _openKey = null;
  const SKIP = new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz','v-plan','v-pruefung','v-settings','v-notizen']);
  function key(){ return _openKey||'bvi_note_'+(_view||'home'); }
  function getBtn(){
    if(!_view) return null;
    const v = document.getElementById(_view);
    return v ? v.querySelector('.page-notes-btn') : null;
  }
  function updateBtn(){
    const note = localStorage.getItem(key());
    const btn = getBtn();
    if(btn){
      btn.classList.toggle('pnb-active', !!note);
      const preview = btn.querySelector('.pnb-preview');
      if(preview) preview.textContent = note ? note.substring(0,80)+(note.length>80?'…':'') : 'Notiz hinzufügen…';
    }
    const has = !!(note && note.trim());
    document.getElementById('m-note')?.classList.toggle('fab-active', has);
  }
  function ensureWidget(){}
  return {
    setView(id){
      if(_openKey&&!document.getElementById('notes-overlay').classList.contains('hidden')) this.close();   // Text bleibt auf der Seite, auf der er geschrieben wurde
      _view = id; ensureWidget(); updateBtn();
    },
    open(){
      _openKey = 'bvi_note_'+(_view||'home');
      const ta = document.getElementById('notes-textarea');
      if(ta){ ta.value = localStorage.getItem(key())||''; if(!ta._live){ ta._live=true; ta.addEventListener('input',()=>{ if(_openKey){ if(ta.value.trim()) localStorage.setItem(_openKey,ta.value); else localStorage.removeItem(_openKey); } }); } }
      const lbl = document.getElementById('notes-page-lbl');
      if(lbl) lbl.textContent = document.querySelector('#'+_view+' .page-title')?.textContent?.trim()||'';
      document.getElementById('notes-overlay').classList.remove('hidden');
      if(ta) setTimeout(()=>ta.focus(),80);
    },
    close(){
      const ta = document.getElementById('notes-textarea');
      if(ta){ const v=ta.value.trim(); if(v) localStorage.setItem(key(),ta.value); else localStorage.removeItem(key()); }
      document.getElementById('notes-overlay').classList.add('hidden');
      _openKey = null;
      updateBtn();
    },
    toggle(){ document.getElementById('notes-overlay').classList.contains('hidden') ? this.open() : this.close(); },
    clear(){
      const ta=document.getElementById('notes-textarea'); if(!ta) return;
      const k=key(), prev=ta.value;
      ta.value=''; localStorage.removeItem(k); updateBtn();
      if(!prev.trim()) return;
      const show=v=>{ const t=document.getElementById('notes-textarea'); if(t&&key()===k) t.value=v; try{ v?localStorage.setItem(k,v):localStorage.removeItem(k); }catch(e){} updateBtn(); };
      UNDO.push('Notiz löschen',()=>show(prev),()=>show(''));
    },
    share(){
      const ta = document.getElementById('notes-textarea');
      const text = ta ? ta.value.trim() : '';
      if(!text){ TOAST.show('Keine Notiz zum Teilen'); return; }
      const title = 'Notiz – B VI Lernwebsite';
      if(navigator.share){
        navigator.share({title, text}).catch(()=>{});
      } else {
        navigator.clipboard.writeText(text)
          .then(()=>TOAST.show('In Zwischenablage kopiert',{type:'ok'}))
          .catch(()=>TOAST.show('Teilen nicht unterstützt'));
      }
    },
    exportAll(){
      const entries = [];
      for(const [k,v] of Object.entries(localStorage)){
        if(!k.startsWith('bvi_note_') || !v.trim()) continue;
        const id = k.replace('bvi_note_','');
        const label = id === 'home' ? 'Startseite' : id.replace(/^v-/,'').replace(/-/g,' ');
        entries.push('### '+label+'\n'+v.trim());
      }
      if(!entries.length){ TOAST.show('Keine Notizen vorhanden'); return; }
      FILES.save('bvi-notizen.txt','text/plain',entries.join('\n\n---\n\n'));
    }
  };
})();

/* ======================================================================
   BOOKMARKS – Lesezeichen (localStorage)
====================================================================== */
const BOOKMARKS = (function(){
  const KEY='bvi_bookmarks';
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } }
  function save(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch{} }
  function removeBk(id){ const d=load(),i=d.findIndex(b=>b.id===id); if(i>=0){d.splice(i,1);save(d);} }
  function syncFab(id){
    if(!id) return;
    const on=load().some(b=>b.id===id);
    document.getElementById('m-bm')?.classList.toggle('fab-active', on);
  }
  function renderPage(){
    const list=document.getElementById('bm-list');
    const empty=document.getElementById('bm-empty');
    if(!list) return;
    const d=load();
    if(!d.length){ list.innerHTML=''; empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');
    list.innerHTML='<div class="m-list">'+d.map(b=>{
      const eb=document.querySelector('#'+b.id+' .page-eyebrow')?.textContent?.trim()||'';
      return `<div class="m-row bm-row">
        <button class="bm-open" data-id="${xss(b.id)}" data-label="${xss(b.label||b.id)}"><span class="m-t1">${xss(b.label||b.id)}</span>${eb?`<span class="m-t2">${xss(eb)}</span>`:''}</button>
        <button class="bm-remove" data-id="${xss(b.id)}" aria-label="Lesezeichen entfernen"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>`;}).join('')+'</div>';
    list.querySelectorAll('.bm-open').forEach(btn=>{
      btn.addEventListener('click',()=>NAV.go(btn.dataset.id, btn.dataset.label));
    });
    list.querySelectorAll('.bm-remove').forEach(btn=>{
      btn.addEventListener('click',()=>{ removeBk(btn.dataset.id); renderPage(); });
    });
  }
  return {
    setView(id){ syncFab(id); if(id==='v-bookmarks') renderPage(); },
    toggle(id,label){
      if(!id) return;
      const d=load();
      const i=d.findIndex(b=>b.id===id);
      if(i>=0){ d.splice(i,1); TOAST.show('Lesezeichen entfernt'); }
      else { d.unshift({id,label:label||id}); TOAST.show('Lesezeichen gesetzt',{type:'ok'}); }
      save(d); syncFab(id);
    },
    getAll(){ return load(); },
    remove(id){ removeBk(id); },
    renderPage
  };
})();

/* ======================================================================
   LESEFORTSCHRITT
====================================================================== */
const NO_PROG = new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz','v-plan','v-pruefung','v-settings','v-notizen']);
function updateReadProgress(){
  const bar = document.getElementById('read-prog');
  const fill = document.getElementById('read-prog-fill');
  if(!bar||!fill) return;
  const active = document.querySelector('.view.active');
  const show = active && !NO_PROG.has(active.id);
  bar.classList.toggle('visible', show);
  if(!show){ fill.style.width='0%'; return; }
  const total = document.documentElement.scrollHeight - window.innerHeight;
  fill.style.width = (total>0 ? Math.min(100, window.scrollY/total*100) : 0)+'%';
}


/* ======================================================================
   CONFETTI
====================================================================== */
function launchConfetti(){
  let canvas = document.getElementById('confetti-canvas');
  if(!canvas){ canvas=document.createElement('canvas'); canvas.id='confetti-canvas'; document.body.appendChild(canvas); }
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const colors = ['#C9A84C','#E8C97A','#4ACD90','#6BAAD4','#E07070','#D4903A','#fff'];
  const particles = Array.from({length:120}, ()=>({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height - canvas.height,
    r: 4 + Math.random()*5,
    d: 2 + Math.random()*3,
    color: colors[Math.floor(Math.random()*colors.length)],
    tilt: Math.random()*10 - 5,
    tiltSpeed: 0.12 + Math.random()*0.1
  }));
  let frame=0, raf;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.y += p.d; p.tilt += p.tiltSpeed; p.x += Math.sin(frame*0.02)*1.2;
      ctx.beginPath(); ctx.fillStyle=p.color;
      ctx.ellipse(p.x+p.tilt,p.y,p.r*0.6,p.r,p.tilt*0.05,0,Math.PI*2);
      ctx.fill();
      if(p.y>canvas.height) p.y=-12;
    });
    frame++;
    if(frame<200) raf=requestAnimationFrame(draw); else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.remove(); }
  }
  if(raf) cancelAnimationFrame(raf);
  draw();
}

/* ======================================================================
   FC – Flashcard-Engine
====================================================================== */
const FC = (function(){
  const CATS = ['laufbahn','ibk','vak','feuak','idf'];
  let deck=[], curIdx=0, flipped=false, sess={known:0,unknown:0};
  let activeFilters = new Set(['laufbahn']);
  let _seen = [], _reviewPos = -1, _toCard = false;

  const SR_DAYS = [0,1,3,7,14,30];

  function sm2(prev, quality){
    // quality: 0=nicht gewusst, 1=schwer, 2=gewusst
    let interval=prev.interval||1, ease=prev.ease||2.5, reps=prev.reps||0;
    if(quality===0) return {interval:1,ease,reps:0,nextReview:Date.now()+86400000};
    if(reps<=1) interval = quality===1 ? 3 : 7;
    else interval=Math.round(interval*ease);
    reps++;
    if(quality===1){ interval=Math.max(3,Math.round(interval*0.85)); ease=Math.max(1.3,ease-0.15); }
    else { ease=Math.min(2.5,ease+0.1); }
    interval=Math.max(1,Math.min(interval,365));
    return {interval,ease,reps,nextReview:Date.now()+interval*86400000};
  }

  function fcLoad(){
    try{
      const raw=JSON.parse(localStorage.getItem('bvi_fc')||'{}');
      const out={};
      for(const [k,v] of Object.entries(raw)){
        if(v===true) out[k]={interval:30,ease:2.5,reps:5,nextReview:0};
        else if(v && v.box!==undefined && v.interval===undefined)
          out[k]={interval:SR_DAYS[v.box]||1,ease:2.5,reps:v.box||0,nextReview:v.nextReview||0};
        else out[k]=v;
      }
      return out;
    }catch{ return {}; }
  }
  function fcSave(d){ try{ localStorage.setItem('bvi_fc',JSON.stringify(d)); }catch{} }
  function fcLoadStars(){ try{ return new Set(JSON.parse(localStorage.getItem('bvi_fc_stars')||'[]')); }catch{ return new Set(); } }
  function fcSaveStars(s){ try{ localStorage.setItem('bvi_fc_stars',JSON.stringify([...s])); }catch{} }
  function fcLoadWeak(){ try{ return new Set(JSON.parse(localStorage.getItem('bvi_fc_weak')||'[]')); }catch{ return new Set(); } }
  function fcSaveWeak(s){ try{ localStorage.setItem('bvi_fc_weak',JSON.stringify([...s])); }catch{} }
  function fcToggleStar(id){ const s=fcLoadStars(); if(s.has(id)) s.delete(id); else s.add(id); fcSaveStars(s); return s.has(id); }

  function getDeck(){
    if(activeFilters.has('starred')){
      const stars=fcLoadStars();
      return shuffle(FLASHCARD_DATA.filter(c=>stars.has(c.id)));
    }
    if(activeFilters.has('own')) return shuffle(FLASHCARD_DATA.filter(c=>c.own));
    if(activeFilters.has('weak')){
      const weak=fcLoadWeak();
      return shuffle(FLASHCARD_DATA.filter(c=>weak.has(c.id)));
    }
    return shuffle(FLASHCARD_DATA.filter(c=>CATS.filter(f=>activeFilters.has(f)).some(f=>c.cat.toLowerCase().startsWith(f))));
  }

  function updateFilterButtons(){
    const known=fcLoad();
    const stars=fcLoadStars();
    const isStarred=activeFilters.has('starred')||activeFilters.has('weak')||activeFilters.has('own');
    const isWeak=activeFilters.has('weak');
    const isOwn=activeFilters.has('own');
    const ownN=FLASHCARD_DATA.filter(c=>c.own).length;
    const weakN=fcLoadWeak().size;
    const tw=document.getElementById('fc-t-weak'), ts=document.getElementById('fc-t-star'), tb=document.getElementById('fc-t-star-btn');
    const cardsTxt=n=>n+(n===1?' Karte':' Karten');
    if(tw) tw.textContent=cardsTxt(weakN);
    if(ts){ const old=ts.dataset.n; ts.textContent=cardsTxt(stars.size); if(old!==undefined&&+old!==stars.size&&tb&&tb.animate) tb.animate([{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:300,easing:'ease-out'}); ts.dataset.n=stars.size; }
    if(tb) tb.classList.toggle('active',activeFilters.has('starred'));
    document.querySelectorAll('.fc-f-btn').forEach(b=>{
      const df=b.dataset.filter;
      const base=b.dataset.label||'';
      if(df==='all'){
        b.innerHTML=`<b>${base}</b><small>${FLASHCARD_DATA.length}</small>`;
      } else if(df==='starred'){
        b.classList.toggle('active',activeFilters.has('starred'));
        b.classList.toggle('hidden',stars.size===0&&!activeFilters.has('starred'));
        b.innerHTML=`<b>${base}</b><small><svg class="fc-chip-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg> ${stars.size}</small>`;
      } else if(df==='own'){
        b.classList.toggle('active',isOwn);
        b.classList.toggle('hidden',ownN===0&&!isOwn);
        b.innerHTML=`<b>${base}</b><small>${ownN}</small>`;
      } else if(df==='weak'){
        b.classList.toggle('active',isWeak);
        b.classList.toggle('hidden',weakN===0&&!isWeak);
        b.innerHTML=`<b>${base}</b><small>${weakN}</small>`;
      } else if(df==='pruefung'){ /* kein eigener Zustand */
      } else if(df){
        const cats=FLASHCARD_DATA.filter(c=>c.cat.toLowerCase().startsWith(df));
        const knownCnt=cats.filter(c=>known[c.id]).length;
        b.classList.toggle('active',!isStarred&&activeFilters.has(df));
        b.innerHTML=`<b>${base}</b><small>${knownCnt}/${cats.length}</small>`;
      }
    });
  }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]; } return a; }

  function sizeCard(){
    const outer = document.querySelector('.fc-outer');
    if(!outer) return;
    let maxH = 0;
    outer.querySelectorAll('.fc-face').forEach(f => { maxH = Math.max(maxH, f.scrollHeight); });
    const capped = Math.max(Math.min(maxH, Math.floor(window.innerHeight * 0.72)), 180);
    outer.style.height = capped + 'px';
  }

  function setupSwipe(outer){
    if(!outer) return;
    let x0=0, y0=0, live=false, dx=0, dy=0, pid=-1, lt=0, lx=0, ly=0, vx=0, vy=0, mode='';
    const THR=80, TILT=12;
    const st={ok:outer.querySelector('.fc-st-ok'), no:outer.querySelector('.fc-st-no'), hard:outer.querySelector('.fc-st-hard')};
    const tilt=d=>Math.max(-TILT,Math.min(TILT,d*0.08));
    const stamps=(o,n,h)=>{ st.ok.style.opacity=o; st.no.style.opacity=n; st.hard.style.opacity=h; };
    const reset=()=>{ outer.style.transform=''; stamps(0,0,0); };
    const fly=(kind,ms)=>{
      stamps(kind==='ok'?1:0,kind==='no'?1:0,kind==='hard'?1:0);
      outer.style.transition=`transform ${ms}ms cubic-bezier(.4,0,.9,.6),opacity ${ms}ms ease`;
      outer.style.transform=kind==='hard'
        ? `translateY(${-window.innerHeight*0.9}px)`
        : `translateX(${(kind==='ok'?1:-1)*window.innerWidth*1.1}px) translateY(-30px) rotate(${(kind==='ok'?1:-1)*TILT}deg)`;
      outer.style.opacity='0';
      setTimeout(()=>FC.answer(kind==='ok'?true:kind==='no'?false:'hard',true),ms-20);
    };

    outer.addEventListener('pointerdown',e=>{
      x0=e.clientX; y0=e.clientY; live=true; dx=0; dy=0; pid=e.pointerId; mode=''; lt=performance.now(); lx=e.clientX; ly=e.clientY; vx=0; vy=0;
      outer.setPointerCapture(e.pointerId);
    });

    outer.addEventListener('pointermove',e=>{
      if(!live||e.pointerId!==pid) return;
      dx=e.clientX-x0; dy=e.clientY-y0;
      if(!mode){
        if(Math.max(Math.abs(dx),Math.abs(dy))<6) return;
        mode = Math.abs(dy)>Math.abs(dx)+5 ? (dy<0?'up':'v') : 'x';
      }
      if(mode==='v'){ live=false; outer.style.transform=''; return; }
      e.preventDefault();
      const now=performance.now(); if(now>lt){ vx=(e.clientX-lx)/(now-lt); vy=(e.clientY-ly)/(now-lt); lt=now; lx=e.clientX; ly=e.clientY; }
      outer.style.transition='none';
      if(mode==='up'){
        const y=Math.min(0,dy);
        outer.style.transform=`translate(${dx*0.25}px,${y}px)`;
        stamps(0,0,Math.min(-y/THR,1));
      } else {
        // Die Karte folgt dem Finger und neigt sich dabei bis 12°
        outer.style.transform=`translateX(${dx}px) rotate(${tilt(dx)}deg)`;
        { const p=Math.min(Math.abs(dx)/THR,1); stamps(dx>0?p:0,dx<0?p:0,0); }
      }
    },{passive:false});

    outer.addEventListener('pointerup',e=>{
      if(e.pointerId!==pid||!live) return;
      live=false;
      if(Math.abs(dx)<8&&Math.abs(dy)<8){
        outer.style.transition=''; outer.style.transform=''; FC.flip();
      } else if(mode==='up'&&(-dy>=THR||vy<-0.6)){
        fly('hard',Math.max(180,Math.min(300,300+vy*100)));
      } else if(mode==='x'&&(Math.abs(dx)>=THR||Math.abs(vx)>0.6)){
        // Wegschnippen: Schwung des Fingers bestimmt die Richtung und das Tempo
        const dir=(Math.abs(vx)>0.6?vx:dx)>0?1:-1;
        fly(dir>0?'ok':'no',Math.max(180,Math.min(320,320-Math.abs(vx)*120)));
      } else {
        outer.style.transition='transform .45s cubic-bezier(.34,1.56,.64,1)'; reset();
      }
    });

    outer.addEventListener('pointercancel',e=>{
      if(e.pointerId!==pid) return;
      live=false; outer.style.transition='transform .3s ease'; reset();
    });
  }

  function showSkeleton(){
    const box = document.getElementById('fc-container'); if(!box) return;
    box.innerHTML = `<div class="sk" aria-hidden="true">
      <div class="sk-pills"><i class="sk-b"></i><i class="sk-b"></i><i class="sk-b"></i></div>
      <i class="sk-b sk-line" style="width:46%;margin:14px auto 12px"></i>
      <div class="sk-card sk-fc"><i class="sk-b sk-line" style="width:90px;height:12px"></i><i class="sk-b sk-line" style="width:88%"></i><i class="sk-b sk-line" style="width:74%"></i><i class="sk-b sk-line" style="width:58%"></i></div>
      <div class="sk-ctl"><i class="sk-b"></i><i class="sk-b"></i></div></div>`;
  }

  // Jahrgang: Karte löschen (nur für diesen Jahrgang), dazu Rückgängig/Wiederholen und die gelöschten Karten zurückholen
  function _jgBar(card){
    if(typeof JGUI==='undefined'||JG.isMaster()) return '';
    const n=JGUI.hiddenCards();
    return `<div class="jg-bar fc-jgbar">${card.own?'':`<button type="button" class="btn btn-ghost" onclick="FC.delCard('${card.id}')">Karte löschen</button>`}${JGUI.histHtml()}${n?`<button type="button" class="btn btn-ghost" onclick="JGUI.restoreCards()">${n} gelöschte wiederherstellen</button>`:''}</div>`;
  }
  function renderCard(){
    const box = document.getElementById('fc-container'); if(!box) return;
    if(curIdx >= deck.length){ renderEnd(); return; }
    const card = deck[curIdx];
    const known = fcLoad();
    const card_e = known[card.id];
    const iVal=card_e?(card_e.interval||1):0;
    const ease_v=card_e?(card_e.ease||2.5):2.5;
    const reps_v=card_e?(card_e.reps||0):0;
    const iGood=reps_v>=2?Math.round(iVal*ease_v):7;
    const iHard=reps_v>=2?Math.max(3,Math.round(iVal*ease_v*0.85)):3;
    const stars=fcLoadStars();
    const isStarred=stars.has(card.id);
    box.innerHTML = `
      <div class="fc-nav">
        <button class="fc-back-btn" onclick="FC.back()" ${_seen.length===0?'disabled':''} aria-label="Vorherige Karte"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
        <span class="fc-pos">Karte ${curIdx+1} von ${deck.length}</span>
        <span class="fc-score">${sess.known} gewusst · ${sess.unknown} nicht gewusst</span>
        <button type="button" class="fc-rep-btn" onclick="FC.report()" aria-label="Fehler oder Unklarheit bei dieser Karte melden"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg></button>
      </div>
      <div class="fc-progress"><i style="width:${deck.length?Math.round(curIdx/deck.length*100):0}%"></i></div>
      <div class="fc-outer">
        <div class="fc-inner" id="fc-inner">
          <div class="fc-face fc-front">
            <button type="button" class="fc-card-star fc-star-btn${isStarred?' starred':''}" onclick="event.stopPropagation();FC.toggleStar('${card.id}')" onpointerdown="event.stopPropagation()" aria-label="${isStarred?'Markierung entfernen':'Karte markieren'}" aria-pressed="${isStarred}"><svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg></button>
            <div class="fc-cat">${card.cat}</div>
            <div class="fc-q">${card.q}</div>
            <div class="fc-tap">Tippen zum Aufdecken</div>
          </div>
          <div class="fc-face fc-back">
            <button type="button" class="fc-card-star fc-star-btn${isStarred?' starred':''}" onclick="event.stopPropagation();FC.toggleStar('${card.id}')" onpointerdown="event.stopPropagation()" aria-label="${isStarred?'Markierung entfernen':'Karte markieren'}" aria-pressed="${isStarred}"><svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg></button>
            <div class="fc-cat">${card.cat}</div>
            <div class="fc-a">${card.a}</div>
          </div>
        </div>
        <div class="fc-stamp fc-st-ok" aria-hidden="true">Gewusst</div>
        <div class="fc-stamp fc-st-no" aria-hidden="true">Nicht gewusst</div>
        <div class="fc-stamp fc-st-hard" aria-hidden="true">Schwer</div>
      </div>
      ${_jgBar(card)}
      <div class="fc-controls" id="fc-controls">
        <button class="fc-rb fc-no" onclick="FC.answer(false,true)" aria-label="Nicht gewusst, gleich wieder"><span class="fc-rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></span><span class="fc-rl">Nicht gewusst</span></button>
        <button class="fc-rb fc-hard" onclick="FC.answer('hard',true)" aria-label="Schwer, in ${iHard} Tagen"><span class="fc-rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg></span><span class="fc-rl">Schwer</span></button>
        <button class="fc-rb fc-yes" onclick="FC.answer(true,true)" aria-label="Gewusst, in ${iGood} Tagen"><span class="fc-rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><span class="fc-rl">Gewusst</span></button>
      </div>
      <p class="fc-swhint" id="fc-swhint">Wischen: links nicht gewusst · oben schwer · rechts gewusst</p>
      </div>`;
    flipped = false;
    requestAnimationFrame(()=>{ sizeCard(); setupSwipe(document.querySelector('.fc-outer')); });
    if(_toCard){ _toCard=false; requestAnimationFrame(()=>{ const n=document.querySelector('#v-flashcards .fc-filter-row'); if(n) n.scrollIntoView({block:'start',behavior:'smooth'}); }); }
  }

  function renderEnd(){
    const box = document.getElementById('fc-container'); if(!box) return;
    const known = fcLoad();
    const knownCnt = FLASHCARD_DATA.filter(c=>known[c.id]).length;
    if(deck.length===0){
      box.innerHTML=`<div class="fc-end"><div class="fc-end-ico">⭐</div><div class="fc-end-title">Keine Karten in dieser Auswahl</div><div class="fc-end-sub">Wähle eine andere Kategorie oder markiere zuerst Karten.</div><div style="display:flex;gap:.6rem;justify-content:center"><button class="btn btn-gold" onclick="FC.setFilter('all')">Alle Karten</button></div></div>`;
      return;
    }
    const pct = deck.length ? Math.round(sess.known/deck.length*100) : 0;
    const ico = pct>=80?'🏆':pct>=50?'📖':'🔄';
    const ttl = pct>=80?'Ausgezeichnet!':pct>=50?'Gut gemacht!':'Weiter üben!';
    if(pct>=80) launchConfetti();
    box.innerHTML = `
      <div class="fc-end">
        <div class="fc-end-ico">${ico}</div>
        <div class="fc-end-title">${ttl}</div>
        <div class="fc-end-sub">${sess.known} von ${deck.length} Karten gewusst (${pct}%).<br>Insgesamt <strong>${knownCnt}/${FLASHCARD_DATA.length}</strong> Begriffe dauerhaft gelernt.</div>
        <div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-gold" onclick="FC.start()">Neu mischen & wiederholen</button>
          <button class="btn btn-ghost" onclick="FC.resetKnown()">Lernstand zurücksetzen</button>
        </div>
        <div class="jg-bar ud-bar" style="justify-content:center;margin:.8rem 0 0">${UNDO.html()}</div>
      </div>`;
  }
  function renderReviewCard(){
    const box=document.getElementById('fc-container'); if(!box) return;
    const card=_seen[_reviewPos];
    const stars=fcLoadStars();
    const isStarred=stars.has(card.id);
    box.innerHTML=`
      <div class="fc-review-nav">
        <button class="fc-review-nav-btn" onclick="FC.back()" ${_reviewPos===0?'disabled':''}>← Ältere</button>
        <span class="fc-review-pos">Rückblick ${_reviewPos+1} / ${_seen.length}</span>
        <button class="fc-review-nav-btn" onclick="FC.forward()">Weiter →</button>
      </div>
      <div class="fc-review-card">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;">
          <span class="fc-review-badge">↩ Rückblick</span>
          <button class="fc-star-btn${isStarred?' starred':''}" onclick="FC.toggleStar('${card.id}')" title="${isStarred?'Markierung entfernen':'Markieren'}">⭐</button>
        </div>
        <div class="fc-cat">${card.cat}</div>
        <div class="fc-review-q">${card.q}</div>
        <hr class="fc-review-hr">
        <div class="fc-review-a">${card.a}</div>
      </div>
      <div style="text-align:center">
        <button class="btn btn-ghost" onclick="FC.forward()">↩ Zurück zur aktuellen Karte</button>
      </div>`;
  }

  return {
    start(keepScroll){
      deck = getDeck(); curIdx=0; flipped=false; sess={known:0,unknown:0};
      _seen=[]; _reviewPos=-1; _toCard=!keepScroll;
      showSkeleton();
      setTimeout(renderCard, 320);
    },
    flip(){
      if(curIdx>=deck.length) return;
      flipped=!flipped;
      const inner=document.getElementById('fc-inner');
      const ctrl=document.getElementById('fc-controls');
      if(inner){
        inner.classList.remove('fc-lift'); void inner.offsetWidth;   // Animation neu starten
        inner.classList.add('fc-lift'); inner.classList.toggle('flipped',flipped);
        inner.addEventListener('animationend',()=>inner.classList.remove('fc-lift'),{once:true});
      }
      const ou=document.querySelector('.fc-outer'); if(ou) ou.classList.toggle('fl',flipped);
    },
    // Karte außerhalb des Kartenstapels bewerten (z. B. im Übungs-Fenster neben der Lernseite)
    rateExternal(id,ok){
      const d=fcLoad();
      if(ok){ d[id]=sm2(d[id]||{},2); if(typeof STREAK!=='undefined') STREAK.record(); } else delete d[id];
      if(typeof GAME!=='undefined') GAME.event('card',!!ok);
      const weak=fcLoadWeak(); if(ok) weak.delete(id); else weak.add(id); fcSaveWeak(weak);
      fcSave(d); SHELL.renderFcSide(); updateFilterButtons();
    },
    answer(quality,viaSwipe){
      if((!flipped&&!viaSwipe)||_reviewPos>=0) return;   // im Rückblick nicht die unsichtbare aktuelle Karte bewerten
      const q=quality===true?2:quality===false?0:1; // true=gut, false=wieder, 'hard'=schwer
      if(navigator.vibrate) navigator.vibrate(q>0?[30]:[20,50,20]);
      const card=deck[curIdx];
      _seen.push(card); _reviewPos=-1;
      const d=fcLoad();
      if(q===0){
        delete d[card.id]; sess.unknown++;
        const reps=card._reps||0;
        if(reps<2) deck.push(Object.assign({},card,{_reps:reps+1}));
      } else {
        d[card.id]=sm2(d[card.id]||{},q); sess.known++;
        if(typeof STREAK!=='undefined') STREAK.record();
      }
      const weak=fcLoadWeak(); if(q===2) weak.delete(card.id); else weak.add(card.id); fcSaveWeak(weak);
      fcSave(d); curIdx++; renderCard(); SHELL.renderFcSide(); updateFilterButtons();
      if(typeof GAME!=='undefined') GAME.event('card',q>0);
    },
    setFilter(f){
      if(f==='starred'){
        activeFilters=activeFilters.has('starred')?new Set(['laufbahn']):new Set(['starred']);
      } else if(f==='own'){
        activeFilters=activeFilters.has('own')?new Set(['laufbahn']):new Set(['own']);
      } else if(f==='weak'){
        activeFilters=activeFilters.has('weak')?new Set(['laufbahn']):new Set(['weak']);
      } else if(f==='all'){
        activeFilters=new Set(['laufbahn']);
      } else if(f==='pruefung'){
        activeFilters=new Set(['ibk','vak','feuak','idf']);
        updateFilterButtons(); this.start(true); return;
      } else {
        activeFilters.delete('starred'); activeFilters.delete('weak'); activeFilters.delete('own');
        if(activeFilters.has(f)){ if(CATS.every(c=>activeFilters.has(c))) return; activeFilters.delete(f); if(activeFilters.size===0) activeFilters=new Set(['laufbahn']); }
        else activeFilters.add(f);
      }
      updateFilterButtons();
      this.start(true);
    },
    back(){
      if(_seen.length===0) return;
      if(_reviewPos===-1) _reviewPos=_seen.length-1;
      else if(_reviewPos>0) _reviewPos--;
      else return;
      renderReviewCard();
    },
    forward(){
      if(_reviewPos===-1) return;
      _reviewPos++;
      if(_reviewPos>=_seen.length){ _reviewPos=-1; renderCard(); }
      else renderReviewCard();
    },
    delCard(id){
      const c=FLASHCARD_DATA.find(x=>x.id===id); if(!c||c.own||typeof JGUI==='undefined'||!JGUI.hideCard(id)) return;
      deck=deck.filter(x=>x.id!==id); _seen=_seen.filter(x=>(x&&x.id!==undefined?x.id:x)!==id);
      TOAST.show('Karte gelöscht – nur in deinem Jahrgang',{type:'ok'});
      renderCard();
    },
    report(){
      const c=_reviewPos>=0?_seen[_reviewPos]:deck[curIdx]; if(!c) return;
      const t=x=>String(x).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
      SHELL.report('Lernkarte ('+t(c.cat)+')\nFrage: '+t(c.q)+'\nAntwort: '+t(c.a));
    },
    toggleStar(id){
      const starred=fcToggleStar(id);
      document.querySelectorAll('.fc-star-btn').forEach(b=>{ b.classList.toggle('starred',starred); b.setAttribute('aria-pressed',starred); });
      const rc=document.querySelector('.fc-card-star svg'); if(rc&&rc.animate) rc.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:260,easing:'ease-out'});
      updateFilterButtons();
    },
    showWeak(){ activeFilters=new Set(['weak']); updateFilterButtons(); this.start(); },
    weakCount(){ return fcLoadWeak().size; },
    weakByModule(){
      const w=fcLoadWeak(), m={};
      FLASHCARD_DATA.forEach(c=>{ if(w.has(c.id)){ const k=c.cat.split(' · ')[0]; m[k]=(m[k]||0)+1; } });
      return m;
    },
    starCurrent(){
      const c=_reviewPos>=0?_seen[_reviewPos]:deck[curIdx];
      if(!c) return;
      this.toggleStar(c.id);
      TOAST.show(fcLoadStars().has(c.id)?'Karte markiert':'Markierung entfernt',{type:'ok'});
    },
    resetKnown(){
      const snap=localStorage.getItem('bvi_fc');
      if(!confirm('Lernkarten-Lernstand wirklich zurücksetzen?')) return;
      localStorage.removeItem('bvi_fc'); this.start(true);
      const put=v=>{ if(v===null) localStorage.removeItem('bvi_fc'); else localStorage.setItem('bvi_fc',v); FC.start(true); };
      UNDO.push('Lernstand zurücksetzen',()=>put(snap),()=>put(null));
      TOAST.show('Lernstand zurückgesetzt',{type:'ok'});
    },
    syncFilters(){ updateFilterButtons(); },
    resize(){ sizeCard(); },
    print(){
      const cards=[...new Map(getDeck().map(c=>[c.id,c])).values()];
      const rows=cards.map(c=>`<div class="pc"><div class="cat">${c.cat}</div><div class="q">${c.q}</div><hr/><div class="a">${c.a}</div></div>`).join('');
      const w=window.open('','_blank');
      if(!w){ TOAST.show('Das Druckfenster wurde blockiert – bitte Pop-ups erlauben'); return; }
      w.document.write(`<!DOCTYPE html><html><head><title>Lernkarten B VI</title><style>
        *{box-sizing:border-box;margin:0;padding:0;}body{font-family:sans-serif;padding:1rem;}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;}
        .pc{border:1px solid #ccc;border-radius:8px;padding:.85rem;page-break-inside:avoid;}
        .cat{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:.35rem;}
        .q{font-weight:700;font-size:.88rem;margin-bottom:.45rem;line-height:1.4;}
        hr{border:none;border-top:1px solid #eee;margin:.4rem 0;}
        .a{font-size:.78rem;color:#333;line-height:1.6;}
        @media print{.grid{grid-template-columns:1fr 1fr;}}
      </style></head><body><div class="grid">${rows}</div></body></html>`);
      w.document.close(); w.print();
    }
  };
})();

/* ======================================================================
   ABKÜRZUNGEN
====================================================================== */
const ABK = (function(){
  const DATA = [
    // Ausbildungseinrichtungen
    {s:'Ausbildungseinrichtungen',a:'GAL',f:'Grundausbildungslehrgang',d:'Basismodul der Laufbahnausbildung im höheren feuerwehrtechnischen Dienst'},
    {s:'Ausbildungseinrichtungen',a:'SFS',f:'Staatliche Feuerwehrschule Regensburg',d:'Bayerische Landesfeuerwehrschule, u.a. Gruppenführerlehrgang B3'},
    {s:'Ausbildungseinrichtungen',a:'HLFS',f:'Hessische Landesfeuerwehrschule',d:'Standort Kassel, Führungslehrgänge für BF und FF'},
    {s:'Ausbildungseinrichtungen',a:'IBK',f:'Institut für Brand- und Katastrophenschutz Heyrothsberge',d:'Sachsen-Anhalt; Lehrgang Führung, PSNV, BGM, Kommunikation'},
    {s:'Ausbildungseinrichtungen',a:'VAk',f:'Verwaltungsakademie Berlin',d:'Rechtliche und verwaltungsbezogene Ausbildungsmodule'},
    {s:'Ausbildungseinrichtungen',a:'FeuAK',f:'Feuerwehrakademie Hamburg',d:'Wirtschafts- und Managementlehrgänge für Führungskräfte'},
    {s:'Ausbildungseinrichtungen',a:'IdF',f:'Institut der Feuerwehr NRW',d:'Standort Münster; Brandschutz, Stabsarbeit, Öffentlichkeitsarbeit'},
    {s:'Ausbildungseinrichtungen',a:'BF',f:'Berufsfeuerwehr',d:'Hauptamtliche kommunale Feuerwehr'},
    {s:'Ausbildungseinrichtungen',a:'FF',f:'Freiwillige Feuerwehr',d:'Ehrenamtlich organisierte Feuerwehr'},
    {s:'Ausbildungseinrichtungen',a:'WF',f:'Werkfeuerwehr',d:'Betriebliche Feuerwehr in Unternehmen'},
    // Fahrzeuge
    {s:'Fahrzeuge',a:'LF',f:'Löschfahrzeug',d:'Genormtes Löschfahrzeug nach DIN 14530'},
    {s:'Fahrzeuge',a:'HLF',f:'Hilfeleistungslöschfahrzeug',d:'Kombinationsfahrzeug für Brand- und TH-Einsätze'},
    {s:'Fahrzeuge',a:'TLF',f:'Tanklöschfahrzeug',d:'Fahrzeug mit großem Löschwassertank, für wasserarme Gebiete'},
    {s:'Fahrzeuge',a:'DLK',f:'Drehleiter mit Korb',d:'Hubrettungsfahrzeug mit Rettungskorb, i.d.R. 23 m oder 32 m'},
    {s:'Fahrzeuge',a:'TM',f:'Teleskopmast',d:'Hubrettungsfahrzeug als Alternative zur DLK'},
    {s:'Fahrzeuge',a:'RW',f:'Rüstwagen',d:'Fahrzeug für technische Hilfeleistung, mit Seilwinde und Hebesatz'},
    {s:'Fahrzeuge',a:'GW',f:'Gerätewagen',d:'Transportfahrzeug für spezifische Ausrüstung (z.B. GW-G, GW-L, GW-Öl)'},
    {s:'Fahrzeuge',a:'ELW',f:'Einsatzleitwagen',d:'Führungsfahrzeug für den Einsatzleiter'},
    {s:'Fahrzeuge',a:'KdoW',f:'Kommandowagen',d:'Führungsfahrzeug für Führungskräfte (Pkw)'},
    {s:'Fahrzeuge',a:'MTW',f:'Mannschaftstransportwagen',d:'Transportfahrzeug für Personal und Material'},
    {s:'Fahrzeuge',a:'WLF',f:'Wechselladerfahrzeug',d:'Trägerfahrzeug für Abrollbehälter'},
    {s:'Fahrzeuge',a:'AB',f:'Abrollbehälter',d:'Wechselaufbau für WLF, z.B. AB-Schlauch, AB-Rüst, AB-Atemschutz'},
    {s:'Fahrzeuge',a:'MZF',f:'Mehrzweckfahrzeug',d:'Kleines Einsatzfahrzeug für vielfältige Aufgaben'},
    {s:'Fahrzeuge',a:'NEF',f:'Notarzteinsatzfahrzeug',d:'Pkw für den Notarzt zur schnellen Anfahrt'},
    {s:'Fahrzeuge',a:'RTW',f:'Rettungswagen',d:'Rettungsfahrzeug mit Intensivtransportmöglichkeit'},
    // Einsatztaktik
    {s:'Einsatztaktik & Organisation',a:'FwDV',f:'Feuerwehr-Dienstvorschrift',d:'Bundesweit gültige Vorschriften für den Feuerwehrdienst'},
    {s:'Einsatztaktik & Organisation',a:'FwDV 3',f:'FwDV 3 – Einheiten im Lösch- und Hilfeleistungseinsatz',d:'Regelt Taktik und Aufgaben von Staffel, Gruppe und Zug'},
    {s:'Einsatztaktik & Organisation',a:'TH',f:'Technische Hilfeleistung',d:'Einsatzart für nicht brennende Notlagen, z.B. Verkehrsunfall'},
    {s:'Einsatztaktik & Organisation',a:'MANV',f:'Massenanfall von Verletzten',d:'Besondere Einsatzlage mit vielen Verletzten; erfordert MANV-Konzept'},
    {s:'Einsatztaktik & Organisation',a:'VB',f:'Verbandsführung / Verband',d:'Taktische Einheit aus mehreren Zügen unter einem Verbandsführer'},
    {s:'Einsatztaktik & Organisation',a:'GABC',f:'Gefahren ABC',d:'Gefahrenklassen: Gefährliche Stoffe, Atomare, Biologische, Chemische Gefahren'},
    {s:'Einsatztaktik & Organisation',a:'ABC',f:'Atomare, Biologische, Chemische Gefahren',d:'Klassifizierung von Sonderschadenslagen'},
    {s:'Einsatztaktik & Organisation',a:'CBRN',f:'Chemical, Biological, Radiological, Nuclear',d:'Internationale Bezeichnung für ABC-Gefahrenlagen'},
    {s:'Einsatztaktik & Organisation',a:'GF',f:'Gruppenführer',d:'Führt eine Gruppe (1:8) im Einsatz'},
    {s:'Einsatztaktik & Organisation',a:'ZF',f:'Zugführer',d:'Führt einen Löschzug (mind. 2 Gruppen) im Einsatz'},
    {s:'Einsatztaktik & Organisation',a:'StF',f:'Staffelführer',d:'Führt eine Staffel (1:5) im Einsatz'},
    {s:'Einsatztaktik & Organisation',a:'Ma',f:'Maschinist',d:'Bedient und überwacht die feuerwehrtechnischen Geräte des Fahrzeugs'},
    {s:'Einsatztaktik & Organisation',a:'A-Tr',f:'Angriffstrupp',d:'Trupp zur Brandbekämpfung und Menschenrettung (unter PA)'},
    {s:'Einsatztaktik & Organisation',a:'W-Tr',f:'Wassertrupp',d:'Trupp zur Wasserversorgung und Sicherung des Angriffstrupps'},
    {s:'Einsatztaktik & Organisation',a:'S-Tr',f:'Sicherheitstrupp',d:'Trupp zur Sicherung und Rettung des Angriffstrupps'},
    {s:'Einsatztaktik & Organisation',a:'Schl-Tr',f:'Schlauchtrupp',d:'Trupp zur Herstellung der Wasserversorgung über längere Strecken'},
    {s:'Einsatztaktik & Organisation',a:'BOS',f:'Behörden und Organisationen mit Sicherheitsaufgaben',d:'Nutzer des Digitalfunks: Feuerwehr, Polizei, Rettungsdienst'},
    {s:'Einsatztaktik & Organisation',a:'ILS',f:'Integrierte Leitstelle',d:'Gemeinsame Leitstelle für Feuerwehr und Rettungsdienst'},
    {s:'Einsatztaktik & Organisation',a:'TETRA',f:'Terrestrial Trunked Radio',d:'Standard für den digitalen Behördenfunk (BOS-Digitalfunk)'},
    // Ausrüstung & Atemschutz
    {s:'Ausrüstung & Atemschutz',a:'PSA',f:'Persönliche Schutzausrüstung',d:'Gesamtheit der Schutzkleidung und -ausrüstung des Einsatzkräfte'},
    {s:'Ausrüstung & Atemschutz',a:'PA',f:'Pressluftatmer',d:'Atemschutzgerät mit Pressluft-Atemluft; Schutz gegen Atemgifte'},
    {s:'Ausrüstung & Atemschutz',a:'CSA',f:'Chemikalienschutzanzug',d:'Gasdichter Vollschutzanzug für Gefahrstoffeinsätze'},
    {s:'Ausrüstung & Atemschutz',a:'AS',f:'Atemschutz',d:'Oberbegriff für alle Maßnahmen zum Schutz der Atemwege'},
    {s:'Ausrüstung & Atemschutz',a:'ÜAS',f:'Atemschutzüberwachung',d:'Pflicht zur Überwachung von PA-Trägern im Einsatz (FwDV 7)'},
    {s:'Ausrüstung & Atemschutz',a:'UVV',f:'Unfallverhütungsvorschrift',d:'Vorschriften der Berufsgenossenschaften zur Unfallverhütung'},
    {s:'Ausrüstung & Atemschutz',a:'DGUV',f:'Deutsche Gesetzliche Unfallversicherung',d:'Dachverband der Berufsgenossenschaften und Unfallkassen'},
    // Brandlehre & Gefahrstoffe
    {s:'Brandlehre & Gefahrstoffe',a:'UEG',f:'Untere Explosionsgrenze',d:'Mindestkonzentration eines brennbaren Gases für eine Zündung'},
    {s:'Brandlehre & Gefahrstoffe',a:'OEG',f:'Obere Explosionsgrenze',d:'Maximalkonzentration eines brennbaren Gases für eine Zündung'},
    {s:'Brandlehre & Gefahrstoffe',a:'BLEVE',f:'Boiling Liquid Expanding Vapour Explosion',d:'Explosion eines überhitzten Druckbehälters mit siedender Flüssigkeit'},
    {s:'Brandlehre & Gefahrstoffe',a:'UVCE',f:'Unconfined Vapour Cloud Explosion',d:'Unkontrollierte Gaswolkenexplosion im Freien'},
    {s:'Brandlehre & Gefahrstoffe',a:'GHS',f:'Globally Harmonized System',d:'Weltweites System zur Einstufung und Kennzeichnung von Gefahrstoffen'},
    {s:'Brandlehre & Gefahrstoffe',a:'ADR',f:'Accord Dangereux Routier',d:'Europäisches Übereinkommen über den Straßentransport gefährlicher Güter'},
    {s:'Brandlehre & Gefahrstoffe',a:'GGVSEB',f:'Gefahrgutverordnung Straße, Eisenbahn und Binnenschifffahrt',d:'Nationales Recht für den Gefahrguttransport'},
    {s:'Brandlehre & Gefahrstoffe',a:'CO',f:'Kohlenmonoxid',d:'Farb- und geruchloses Atemgift; häufigstes Brandgas'},
    {s:'Brandlehre & Gefahrstoffe',a:'HCN',f:'Cyanwasserstoff (Blausäure)',d:'Hochtoxisches Gas bei Bränden von Kunststoffen und Wolle'},
    // Löschmittel
    {s:'Löschmittel',a:'AFFF',f:'Aqueous Film-Forming Foam',d:'Filmbildendes Schaummittel; legt Schutzfilm auf Flüssigkeitsoberfläche'},
    {s:'Löschmittel',a:'MBS',f:'Mehrbereichsschaummittel',d:'Universelles Schaummittel, erzeugt Leicht- bis Schwerschaum'},
    {s:'Löschmittel',a:'EBS',f:'Einbereichsschaummittel',d:'Schaummittel für einen definierten Verschäumungsbereich'},
    {s:'Löschmittel',a:'LP',f:'Leichtschaum',d:'Verschäumungszahl > 200; für Brandbekämpfung in geschlossenen Räumen'},
    {s:'Löschmittel',a:'MP',f:'Mittelschaum',d:'Verschäumungszahl 20–200; vielseitig einsetzbar'},
    {s:'Löschmittel',a:'SP',f:'Schwerschaum',d:'Verschäumungszahl < 20; für Flächenbrände (B-Brände)'},
    // Vorbeugender Brandschutz
    {s:'Vorbeugender Brandschutz',a:'MBO',f:'Musterbauordnung',d:'Modellbauordnung der Länder als Grundlage für die LBO'},
    {s:'Vorbeugender Brandschutz',a:'LBO',f:'Landesbauordnung',d:'Landesrechtliche Bauordnung mit Brandschutzanforderungen'},
    {s:'Vorbeugender Brandschutz',a:'BMA',f:'Brandmeldeanlage',d:'Automatische Anlage zur Branddetektion und Alarmierung'},
    {s:'Vorbeugender Brandschutz',a:'RWA',f:'Rauch- und Wärmeabzugsanlage',d:'Anlage zur Entrauchung bei Bränden in Gebäuden'},
    {s:'Vorbeugender Brandschutz',a:'SAA',f:'Sprachalarmanlage',d:'Anlage zur Evakuierungsdurchsage bei Brandgefahr'},
    {s:'Vorbeugender Brandschutz',a:'BSO',f:'Brandschutzordnung',d:'Regelwerk für Verhalten vor, während und nach einem Brand (Teil A–C)'},
    {s:'Vorbeugender Brandschutz',a:'VdS',f:'VdS Schadenverhütung',d:'Prüfinstitut für Brandschutz und Sicherheitstechnik'},
    {s:'Vorbeugender Brandschutz',a:'MLAR',f:'Muster-Lüftungsanlagen-Richtlinie',d:'Technische Anforderungen an Lüftungsanlagen im Brandschutz'},
    {s:'Vorbeugender Brandschutz',a:'VStättVO',f:'Versammlungsstättenverordnung',d:'Brandschutzanforderungen für Versammlungsstätten'},
    // Recht & Verwaltung
    {s:'Recht & Verwaltung',a:'GG',f:'Grundgesetz',d:'Verfassung der Bundesrepublik Deutschland'},
    {s:'Recht & Verwaltung',a:'BBG',f:'Bundesbeamtengesetz',d:'Regelt das Beamtenverhältnis auf Bundesebene'},
    {s:'Recht & Verwaltung',a:'BeamtStG',f:'Beamtenstatusgesetz',d:'Bundesrahmengesetz für den Status der Landesbeamten'},
    {s:'Recht & Verwaltung',a:'BHO',f:'Bundeshaushaltsordnung',d:'Vorschriften zur Aufstellung und Ausführung des Bundeshaushalts'},
    {s:'Recht & Verwaltung',a:'LHO',f:'Landeshaushaltsordnung',d:'Haushaltsrecht der Bundesländer'},
    {s:'Recht & Verwaltung',a:'VOB',f:'Vergabe- und Vertragsordnung für Bauleistungen',d:'Regelwerk für die Vergabe und Abwicklung von Bauaufträgen'},
    {s:'Recht & Verwaltung',a:'VgV',f:'Vergabeverordnung',d:'Umsetzung der EU-Vergaberichtlinien in nationales Recht'},
    {s:'Recht & Verwaltung',a:'HOAI',f:'Honorarordnung für Architekten und Ingenieure',d:'Regelt die Vergütung von Planungsleistungen'},
    {s:'Recht & Verwaltung',a:'TVöD',f:'Tarifvertrag für den öffentlichen Dienst',d:'Tarifrecht für Angestellte bei Bund und Kommunen'},
    {s:'Recht & Verwaltung',a:'BPersVG',f:'Bundespersonalvertretungsgesetz',d:'Mitbestimmungsrechte der Personalräte auf Bundesebene'},
    {s:'Recht & Verwaltung',a:'VwVfG',f:'Verwaltungsverfahrensgesetz',d:'Regelt das Verfahren der Behörden bei Verwaltungsentscheidungen'},
    {s:'Recht & Verwaltung',a:'VwGO',f:'Verwaltungsgerichtsordnung',d:'Verfahrensrecht für verwaltungsgerichtliche Klagen'},
    {s:'Recht & Verwaltung',a:'OVG',f:'Oberverwaltungsgericht',d:'Zweite Instanz der Verwaltungsgerichtsbarkeit der Länder'},
    {s:'Recht & Verwaltung',a:'BVerwG',f:'Bundesverwaltungsgericht',d:'Höchstes Gericht der allgemeinen Verwaltungsgerichtsbarkeit'},
    {s:'Recht & Verwaltung',a:'HBKG',f:'Hessisches Brand- und Katastrophenschutzgesetz',d:'Landesgesetz Hessen für Brandschutz und KatS (exemplarisch)'},
    // Psychosoziales & Führung
    {s:'Psychosoziales & Führung',a:'PSNV',f:'Psychosoziale Notfallversorgung',d:'Betreuung Betroffener und Einsatzkräfte nach belastenden Ereignissen'},
    {s:'Psychosoziales & Führung',a:'SbE',f:'Stressbearbeitung nach belastenden Einsätzen',d:'Strukturiertes Nachsorgeverfahren für Einsatzkräfte (Debriefing)'},
    {s:'Psychosoziales & Führung',a:'CISM',f:'Critical Incident Stress Management',d:'Internationales Konzept zur Einsatznachsorge und Prävention'},
    {s:'Psychosoziales & Führung',a:'PTBS',f:'Posttraumatische Belastungsstörung',d:'Psychische Störung nach extremen Belastungsereignissen'},
    {s:'Psychosoziales & Führung',a:'TA',f:'Transaktionsanalyse',d:'Psychologisches Modell zur Analyse von Kommunikation und Verhalten'},
    {s:'Psychosoziales & Führung',a:'BGM',f:'Betriebliches Gesundheitsmanagement',d:'Systematische Förderung von Gesundheit und Wohlbefinden im Betrieb'},
    {s:'Psychosoziales & Führung',a:'PM',f:'Projektmanagement',d:'Planung, Steuerung und Abschluss von zeitlich befristeten Vorhaben'},
    {s:'Psychosoziales & Führung',a:'SWOT',f:'Strengths, Weaknesses, Opportunities, Threats',d:'Stärken-Schwächen-Chancen-Risiken-Analyse im strategischen Management'},
    {s:'Psychosoziales & Führung',a:'SMART',f:'Spezifisch, Messbar, Attraktiv, Realistisch, Terminiert',d:'Methode zur Formulierung klarer Ziele'},
    {s:'Psychosoziales & Führung',a:'KVP',f:'Kontinuierlicher Verbesserungsprozess',d:'Dauerhaftes Streben nach Optimierung von Abläufen und Ergebnissen'},
    // Wirtschaft & Finanzen
    {s:'Wirtschaft & Finanzen',a:'VWL',f:'Volkswirtschaftslehre',d:'Wissenschaft von den gesamtwirtschaftlichen Zusammenhängen'},
    {s:'Wirtschaft & Finanzen',a:'BWL',f:'Betriebswirtschaftslehre',d:'Wissenschaft von den wirtschaftlichen Vorgängen in Unternehmen'},
    {s:'Wirtschaft & Finanzen',a:'KLR',f:'Kosten- und Leistungsrechnung',d:'Internes Rechnungswesen zur Erfassung von Kosten und Erlösen'},
    {s:'Wirtschaft & Finanzen',a:'ROI',f:'Return on Investment',d:'Kennzahl für die Rentabilität einer Investition'},
    {s:'Wirtschaft & Finanzen',a:'TCO',f:'Total Cost of Ownership',d:'Gesamtkosten über den gesamten Lebenszyklus eines Investitionsguts'},
    {s:'Wirtschaft & Finanzen',a:'EVA',f:'Earned Value Analysis',d:'Methode zur Projektfortschrittskontrolle durch Kostenwertanalyse'},
    {s:'Wirtschaft & Finanzen',a:'KGSt',f:'Kommunale Gemeinschaftsstelle für Verwaltungsmanagement',d:'Beratungsorganisation für kommunale Verwaltungen'},
    // Erste Hilfe & Rettung
    {s:'Erste Hilfe & Rettungsdienst',a:'HLW',f:'Herz-Lungen-Wiederbelebung',d:'Maßnahme bei Herz-Kreislauf-Stillstand (Thoraxkompression + Beatmung)'},
    {s:'Erste Hilfe & Rettungsdienst',a:'AED',f:'Automatischer Externer Defibrillator',d:'Gerät zur elektrischen Behandlung von Herzrhythmusstörungen'},
    {s:'Erste Hilfe & Rettungsdienst',a:'ABCDE',f:'Atemweg, Beatmung, Circulation, Disability, Exposure',d:'Systematischer Erstcheck nach Trauma- und Notfallalgorithmus'},
    {s:'Erste Hilfe & Rettungsdienst',a:'ERC',f:'European Resuscitation Council',d:'Europäischer Rat für Wiederbelebungsempfehlungen'},
    {s:'Erste Hilfe & Rettungsdienst',a:'NAW',f:'Notarztwagen',d:'Fahrzeug mit Notarzt und Rettungsassistent besetzt'},
    {s:'Erste Hilfe & Rettungsdienst',a:'KTW',f:'Krankentransportwagen',d:'Fahrzeug für nicht dringende Krankentransporte'},
    // Kartenkunde & Navigation
    {s:'Kartenkunde & Navigation',a:'UTM',f:'Universal Transverse Mercator',d:'Koordinatensystem für genaue Lageangaben auf topographischen Karten'},
    {s:'Kartenkunde & Navigation',a:'MGRS',f:'Military Grid Reference System',d:'Gitterkennzahl-Referenzsystem auf UTM-Basis'},
    {s:'Kartenkunde & Navigation',a:'GPS',f:'Global Positioning System',d:'US-amerikanisches satellitengestütztes Navigationssystem'},
    {s:'Kartenkunde & Navigation',a:'GIS',f:'Geographisches Informationssystem',d:'System zur Erfassung, Verwaltung und Analyse räumlicher Daten'},
    // Führung & Stabsarbeit
    {s:'Führung & Stabsarbeit',a:'FüGK',f:'Führungsgruppe Katastrophenschutz',d:'Führungsunterstützung auf Landkreisebene bei Großlagen'},
    {s:'Führung & Stabsarbeit',a:'GS',f:'Gemeinsamer Stab',d:'Gemeinsamer Führungsstab von BF/FF und KatS bei großen Einsatzlagen'},
    {s:'Führung & Stabsarbeit',a:'KatS',f:'Katastrophenschutz',d:'Staatliche Aufgabe: Schutz der Bevölkerung bei Großschadenlagen'},
    {s:'Führung & Stabsarbeit',a:'THW',f:'Technisches Hilfswerk',d:'Bundesbehörde für technische Nothilfe; ergänzt Feuerwehren bei Großlagen'},
    {s:'Führung & Stabsarbeit',a:'BBK',f:'Bundesamt für Bevölkerungsschutz und Katastrophenhilfe',d:'Koordiniert zivile Schutzmaßnahmen auf Bundesebene'},
    {s:'Führung & Stabsarbeit',a:'ICS',f:'Incident Command System',d:'Amerikanisches Führungssystem für Großlagen; Basis des NIMS'},
    {s:'Führung & Stabsarbeit',a:'NIMS',f:'National Incident Management System',d:'US-amerikanisches Rahmenwerk für standardisierte Einsatzführung'},
    {s:'Führung & Stabsarbeit',a:'SbE',f:'Stab für außergewöhnliche Ereignisse',d:'Katastrophenschutzstab der kommunalen Ebene'},
    {s:'Führung & Stabsarbeit',a:'UVP',f:'Umweltverträglichkeitsprüfung',d:'Behördliches Verfahren zur Bewertung von Umweltauswirkungen'},
    {s:'Führung & Stabsarbeit',a:'LÜKEX',f:'Länder- und Ressortübergreifende Krisenmanagementübung',d:'Bundesweite Stabsrahmenübung zur Stärkung des Krisenmanagements'},
    // Fahrzeuge (ergänzt)
    {s:'Fahrzeuge',a:'GW-AS',f:'Gerätewagen Atemschutz/Strahlenschutz',d:'Fahrzeug mit Reservegeräten und Technik für AS-Großlagen'},
    {s:'Fahrzeuge',a:'GW-L',f:'Gerätewagen Logistik',d:'Fahrzeug für Materialversorgung und Logistik im Einsatz'},
    {s:'Fahrzeuge',a:'GW-G',f:'Gerätewagen Gefahrgut',d:'Fahrzeug mit Spezialmittel und -ausrüstung für Gefahrstoffeinsätze'},
    {s:'Fahrzeuge',a:'ULF',f:'Unimog Löschfahrzeug',d:'Geländegängiges Löschfahrzeug auf Unimog-Basis'},
    {s:'Fahrzeuge',a:'FwDL',f:'Feuerwehrdrehleiter',d:'Ältere Bezeichnung für Drehleiter ohne Korb'},
    {s:'Fahrzeuge',a:'LF 10',f:'Löschgruppenfahrzeug 10',d:'Nach DIN 14530-5; Besatzung 1/8, Pumpe FPN 10-1000, 1.200 l Löschwasser'},
    {s:'Fahrzeuge',a:'HLF 20',f:'Hilfeleistungslöschgruppenfahrzeug 20',d:'Nach DIN 14530-27; 1.600 l Löschwasser, hydraulischer Rettungssatz'},
    // Ausrüstung & Atemschutz (ergänzt)
    {s:'Ausrüstung & Atemschutz',a:'FwDV 7',f:'FwDV 7 – Atemschutz',d:'Dienstvorschrift für Atemschutzeinsätze und Überwachungspflichten'},
    {s:'Ausrüstung & Atemschutz',a:'FwDV 1',f:'FwDV 1 – Grundtätigkeiten',d:'Dienstvorschrift für Lösch- und Hilfeleistungseinsätze (Truppmannausbildung)'},
    {s:'Ausrüstung & Atemschutz',a:'WBK',f:'Wärmebildkamera',d:'Infrarotkamera zur Lokalisierung von Personen und Brandherden'},
    {s:'Ausrüstung & Atemschutz',a:'PSA-ga',f:'PSA gegen Absturz',d:'Persönliche Schutzausrüstung gegen Absturz; Auffanggurt, Bandfalldämpfer'},
    // Recht & Verwaltung (ergänzt)
    {s:'Recht & Verwaltung',a:'BImSchG',f:'Bundesimmissionsschutzgesetz',d:'Schützt vor schädlichen Umwelteinwirkungen durch Luft, Lärm, Erschütterungen'},
    {s:'Recht & Verwaltung',a:'WHG',f:'Wasserhaushaltsgesetz',d:'Regelt den Schutz der Gewässer; Grundlage für Gewässerschutzeinsätze'},
    {s:'Recht & Verwaltung',a:'ChemG',f:'Chemikaliengesetz',d:'Regelwerk für Einstufung, Kennzeichnung und Schutzmaßnahmen bei Chemikalien'},
    {s:'Recht & Verwaltung',a:'SGB VII',f:'Sozialgesetzbuch VII – Gesetzliche Unfallversicherung',d:'Rechtliche Grundlage für Unfall- und Berufskrankheitenversicherung im öD'},
    {s:'Recht & Verwaltung',a:'GemO',f:'Gemeindeordnung',d:'Landesrechtliches Kommunalverfassungsgesetz; Grundlage kommunaler Feuerwehr'},
    {s:'Recht & Verwaltung',a:'VwZG',f:'Verwaltungszustellungsgesetz',d:'Regelt Zustellung von Verwaltungsakten und Bescheiden'},
    {s:'Recht & Verwaltung',a:'ROG',f:'Raumordnungsgesetz',d:'Bundesrahmengesetz für räumliche Gesamtplanung'},
    // Psychosoziales & Führung (ergänzt)
    {s:'Psychosoziales & Führung',a:'EAP',f:'Employee Assistance Program',d:'Betriebliches Hilfsangebot für psychische und soziale Belastungen'},
    {s:'Psychosoziales & Führung',a:'FüSt',f:'Führungsstil',d:'Art und Weise der Führung; transaktional, transformational, laissez-faire'},
    {s:'Psychosoziales & Führung',a:'MBO',f:'Management by Objectives',d:'Führungskonzept durch Zielvereinbarungen zwischen Führung und Mitarbeitern'},
    {s:'Psychosoziales & Führung',a:'OE',f:'Organisationsentwicklung',d:'Geplanter Wandel in Organisationen durch Lernprozesse und Partizipation'},
    {s:'Psychosoziales & Führung',a:'TZI',f:'Themenzentrierte Interaktion',d:'Gruppenarbeitsmethode von Ruth Cohn; Ich – Wir – Es – Globe'},
    // Einsatztaktik (ergänzt)
    {s:'Einsatztaktik & Organisation',a:'AVIVA',f:'Ankommen, Verschaffen, Informieren, Vorgehen, Abschließen',d:'Phasenmodell für den Lehrauftrag/Unterrichtsplanung; auch Einsatzführung'},
    {s:'Einsatztaktik & Organisation',a:'FüGr',f:'Führungsgruppe',d:'Stabselement zur Unterstützung der Einsatzleitung bei Großlagen'},
    {s:'Einsatztaktik & Organisation',a:'ELW 2',f:'Einsatzleitwagen 2',d:'Größerer Führungskomponenten-Einsatzleitwagen für Großschadenslagen'},
    {s:'Einsatztaktik & Organisation',a:'SEG',f:'Schnelleinsatzgruppe',d:'Vorbereitete Einheit für rasch verfügbaren Einsatz (z.B. SEG-San, SEG-Bet)'},
    {s:'Einsatztaktik & Organisation',a:'KFZ',f:'Kraftfahrzeug',d:'Allgemeine Bezeichnung für motorisierte Fahrzeuge im Feuerwehrbereich'},
    {s:'Einsatztaktik & Organisation',a:'TEL',f:'Technische Einsatzleitung',d:'Örtliche Führungsebene bei großen Schadenslagen'},
    {s:'Einsatztaktik & Organisation',a:'FwDV 100',f:'FwDV 100 – Führung und Leitung im Einsatz',d:'Grundlegende Dienstvorschrift für Führungsorganisation und Führungsvorgang'},
    // Hilfsorganisationen
    {s:'Hilfsorganisationen',a:'HiOrg',f:'Hilfsorganisation',d:'Oberbegriff für DRK, MHD, JUH, ASB, DLRG im Rettungsdienst und KatS'},
    {s:'Hilfsorganisationen',a:'DRK',f:'Deutsches Rotes Kreuz',d:'Hilfsorganisation; Träger des Rettungsdienstes in vielen Bundesländern'},
    {s:'Hilfsorganisationen',a:'BRK',f:'Bayerisches Rotes Kreuz',d:'Landesverband des DRK in Bayern; Träger von Rettungsdienst und KatS'},
    {s:'Hilfsorganisationen',a:'MHD',f:'Malteser Hilfsdienst',d:'Hilfsorganisation; Rettungsdienst, PSNV und Betreuungsdienste'},
    {s:'Hilfsorganisationen',a:'JUH',f:'Johanniter-Unfall-Hilfe',d:'Hilfsorganisation; Rettungsdienst und Betreuungsdienste'},
    {s:'Hilfsorganisationen',a:'ASB',f:'Arbeiter-Samariter-Bund',d:'Hilfsorganisation; Rettungsdienst und Katastrophenschutz'},
    {s:'Hilfsorganisationen',a:'DLRG',f:'Deutsche Lebens-Rettungs-Gesellschaft',d:'Wasserrettungsorganisation; Küstenrettung und Einsatzunterstützung'},
    // MANV & Massenanfall
    {s:'MANV & Massenanfall',a:'LNA',f:'Leitender Notarzt',d:'Ärztliche Einsatzleitung bei MANV; koordiniert alle medizinischen Maßnahmen'},
    {s:'MANV & Massenanfall',a:'OrgL',f:'Organisatorischer Leiter Rettungsdienst',d:'Nicht-ärztliche Führungskraft bei MANV; koordiniert Rettungskräfte'},
    {s:'MANV & Massenanfall',a:'BHP',f:'Behandlungsplatz',d:'Ort der medizinischen Erstversorgung bei MANV, unterteilt in Sichtungskategorien'},
    {s:'MANV & Massenanfall',a:'VSt',f:'Verletztensammelstelle',d:'Sammelpunkt für Verletzte vor Triage und Zuweisung zum BHP'},
    {s:'MANV & Massenanfall',a:'BTrp',f:'Betreuungsplatz',d:'Anlaufstelle für unverletzt-betroffene Personen nach MANV oder KatS'},
    {s:'MANV & Massenanfall',a:'DEKON-P',f:'Dekontaminationsplatz Personen',d:'Einrichtung zur Personendekontamination bei ABC-Lagen'},
    {s:'MANV & Massenanfall',a:'DEKON-G',f:'Dekontaminationsplatz Geräte',d:'Einrichtung zur Gerätedekontamination bei ABC-Lagen'},
    {s:'MANV & Massenanfall',a:'SK I-IV',f:'Sichtungskategorien I–IV',d:'I = sofort lebensrettend (rot) · II = dringend (gelb) · III = abwartend (grün) · IV = verstorben (schwarz)'},
    {s:'MANV & Massenanfall',a:'NA',f:'Notarzt',d:'Arzt mit notfallmedizinischer Zusatzausbildung; Einsatz an der Einsatzstelle'},
    {s:'MANV & Massenanfall',a:'RD',f:'Rettungsdienst',d:'Öffentliche Aufgabe zur präklinischen Notfallversorgung und zum Transport'},
    {s:'MANV & Massenanfall',a:'SEG-San',f:'Schnell-Einsatz-Gruppe Sanität',d:'Vorbereitete Gruppe der HiOrg für schnelle Unterstützung bei MANV'},
    {s:'MANV & Massenanfall',a:'SEG-Bet',f:'Schnell-Einsatz-Gruppe Betreuung',d:'Gruppe zur psychosozialen Betreuung und Versorgung Betroffener'},
    // Digitalfunk & Kommunikation
    {s:'Digitalfunk & Kommunikation',a:'FMS',f:'Fahrzeugmeldesystem',d:'Statusmeldungen im BOS-Funk: Status 1–8 (einsatzbereit, Anfahrt, Einsatzstelle …)'},
    {s:'Digitalfunk & Kommunikation',a:'TMO',f:'Trunked Mode Operation',d:'Netzbetrieb über TETRA-Basisstationen (Normalbetrieb BOS-Digitalfunk)'},
    {s:'Digitalfunk & Kommunikation',a:'DMO',f:'Direct Mode Operation',d:'Direktbetrieb Gerät zu Gerät ohne Netz; bei Netzausfall oder in Gebäuden'},
    {s:'Digitalfunk & Kommunikation',a:'HRT',f:'Hand Radio Terminal',d:'Tragbares TETRA-Digitalfunkgerät (Handfunkgerät) für Einsatzkräfte'},
    {s:'Digitalfunk & Kommunikation',a:'MRT',f:'Mobile Radio Terminal',d:'Im Fahrzeug fest eingebautes TETRA-Digitalfunkgerät'},
    {s:'Digitalfunk & Kommunikation',a:'GAN',f:'Gemeinsamer Ansatz Netzsteuerung',d:'Abstimmungsverfahren beim länderübergreifenden TETRA-BOS-Netz'},
    {s:'Digitalfunk & Kommunikation',a:'FuG',f:'Funkgerät',d:'Allgemeine Bezeichnung für ein Sende- und Empfangsgerät im Feuerwehrdienst'},
    {s:'Digitalfunk & Kommunikation',a:'EZV',f:'Einsatzstellenverteiler',d:'Anschlussverteiler für Signalleitungen und Kommunikation an der Einsatzstelle'},
    // Brandmeldetechnik
    {s:'Brandmeldetechnik',a:'BMZ',f:'Brandmeldezentrale',d:'Empfängt und verarbeitet Meldungen aller Brandmelder eines Objekts'},
    {s:'Brandmeldetechnik',a:'ÜE',f:'Übertragungseinrichtung',d:'Gerätetechnik zur Übertragung von BMA-Alarmen zur Leitstelle'},
    {s:'Brandmeldetechnik',a:'FBF',f:'Feuerwehr-Bedienfeld',d:'Bedienfeld für die Feuerwehr zur Steuerung der BMA und angeschlossener Anlagen'},
    {s:'Brandmeldetechnik',a:'FAT',f:'Feuerwehr-Anzeigetableau',d:'Zeigt der Feuerwehr Detailinformationen zur ausgelösten Meldergruppe'},
    {s:'Brandmeldetechnik',a:'FSD',f:'Feuerwehr-Schlüsseldepot',d:'Geprüfter Safe für Objektschlüssel; Zugang durch ILS-Alarmierung'},
    {s:'Brandmeldetechnik',a:'TAB',f:'Technische Anschlussbedingungen',d:'Örtliche Aufschaltbedingungen der Feuerwehr/ILS für BMA-Anlagen'},
    {s:'Brandmeldetechnik',a:'ELA',f:'Elektroakustische Anlage',d:'Anlage zur Alarmierung und Durchsage; oft kombiniert mit Sprachalarmanlagen'},
    {s:'Brandmeldetechnik',a:'MG',f:'Meldergruppe',d:'Zusammenfassung mehrerer Brandmelder zu einer adressierten Gruppe in der BMZ'},
    {s:'Brandmeldetechnik',a:'RAS',f:'Rauchansaugsystem',d:'Frühdetektionssystem mit aktiver Luftprobenentnahme; für Serverräume und Reinräume'},
    // Fahrzeuge – DIN 14011:2018 Ergänzungen
    {s:'Fahrzeuge',a:'MLF',f:'Mittleres Löschfahrzeug',d:'Löschfahrzeug mittlerer Größe nach DIN 14530-26; Besatzung 1:5, mind. 800 l Tank'},
    {s:'Fahrzeuge',a:'KLF',f:'Kleinlöschfahrzeug',d:'Kompaktes Löschfahrzeug nach DIN 14530-23; für beengte Verhältnisse und kleine FF'},
    {s:'Fahrzeuge',a:'TSF',f:'Tragkraftspritzenfahrzeug',d:'Fahrzeug zur Beförderung einer Tragkraftspritze (TS 8/8) und Mannschaft (1:5)'},
    {s:'Fahrzeuge',a:'TSF-W',f:'Tragkraftspritzenfahrzeug-Wasser',d:'TSF mit eingebautem Löschwassertank (750–1000 l); für wasserarme Gebiete'},
    {s:'Fahrzeuge',a:'HAB',f:'Hubarbeitsbühne',d:'Fahrzeug mit Arbeitsbühne zur Rettung und technischen Arbeit in der Höhe (kein Rettungskorb)'},
    {s:'Fahrzeuge',a:'SW',f:'Schlauchwagen',d:'Fahrzeug zur Beförderung großer Schlauchlängen (bis 2000 m B-Schlauch) für Fernwasserversorgung'},
    {s:'Fahrzeuge',a:'RTB',f:'Rettungsboot',d:'Boot für die Wasserrettung; einsatzbereit auf Trailer oder fest verlastet auf Fahrzeug'},
    {s:'Fahrzeuge',a:'MZB',f:'Mehrzweckboot',d:'Vielseitig einsetzbares Boot für Wasserrettung, Einsatztaucher und Materialversorgung'},
    // Ausrüstung & Atemschutz – DIN 14011:2018 Ergänzungen
    {s:'Ausrüstung & Atemschutz',a:'ASG',f:'Atemschutzgerät',d:'Oberbegriff für alle Geräte zum Schutz der Atemwege nach DIN 14011 (Abschn. 3.4.4)'},
    {s:'Ausrüstung & Atemschutz',a:'STK',f:'Schlauchtragekorb',d:'Korb zum Transport und geordneter Lagerung von Druckschläuchen (B- und C-Schlauch)'},
    {s:'Ausrüstung & Atemschutz',a:'EHZ',f:'Einfach wirkender Hydraulikzylinder',d:'Hydraulisches Hubgerät für technische Hilfeleistung (Teil des hydraulischen Rettungssatzes)'},
    // Vorbeugender Brandschutz – DIN 14011:2018 Ergänzungen
    {s:'Vorbeugender Brandschutz',a:'MRA',f:'Maschinelle Rauchabzugsanlage',d:'Aktive Entrauchungsanlage mit Ventilatoren; Unterform der RWA nach DIN EN 12101'},
    {s:'Vorbeugender Brandschutz',a:'NRA',f:'Natürliche Rauchabzugsanlage',d:'Passive Entrauchung durch Thermik und natürlichen Auftrieb; Unterform der RWA'},
    // Brandmeldetechnik – DIN 14011:2018 Ergänzungen
    {s:'Brandmeldetechnik',a:'FGB',f:'Feuerwehr-Gebäudefunkbedienfeld',d:'Bedienfeld zur Steuerung der Gebäudefunkanlage durch die Feuerwehr (DIN VDE 0800-174)'},
    // Einsatztaktik – DIN 14011:2018 Ergänzungen
    {s:'Einsatztaktik & Organisation',a:'BuK',f:'Brand unter Kontrolle',d:'Lagermeldung nach DIN 14011 (3.2.6.8): Ausbreitung des Brandes ist gestoppt'},
    // Löschmittel – DIN 14011:2018 Ergänzungen
    {s:'Löschmittel',a:'DZA',f:'Druckzumischanlage',d:'Fest installierte Anlage zur Zumischung von Schaummittel in den Löschwasserstrom'},
    {s:'Löschmittel',a:'DLS',f:'Druckluftschaumanlage',d:'Anlage zur Erzeugung von Druckluftschaum (CAFS); erhöhter Löscheffekt bei geringerem Wasserverbrauch'},
  ];

  let rendered = false;
  return {
    render(){
      if(rendered) return;
      const cards = document.getElementById('abk-cards');
      if(!cards) return;
      rendered = true;
      const sections = [...new Set(DATA.map(d=>d.s))];
      cards.innerHTML = sections.map(sec=>{
        const rows = DATA.filter(d=>d.s===sec).sort((a,b)=>a.a.localeCompare(b.a));
        return `<div class="abk-c-grp" data-sec="${sec}"><div class="abk-c-sec">${sec}</div><div class="abk-c-list">`
          + rows.map(r=>`<div class="abk-card" data-sec="${sec}" data-search="${(r.a+' '+r.f+' '+r.d).toLowerCase()}" onclick="this.classList.toggle('open')"><div class="abk-c-h"><span class="abk-c-ab">${r.a}</span><span class="abk-c-fu">${r.f}</span><span class="abk-c-ch">›</span></div><div class="abk-c-d">${r.d}</div></div>`).join('')
          + '</div></div>';
      }).join('');
    },
    filter(q){
      const term = q.trim().toLowerCase();
      const words = term ? term.split(/\s+/).filter(Boolean) : [];
      const crd = document.querySelectorAll('#abk-cards .abk-card');
      let vis = 0;
      crd.forEach(c=>{ const show = !words.length||words.every(w=>c.dataset.search.includes(w)); c.classList.toggle('hidden',!show); if(show) vis++; });
      document.querySelectorAll('#abk-cards .abk-c-grp').forEach(g=>{
        g.classList.toggle('hidden',![...crd].some(c=>c.dataset.sec===g.dataset.sec&&!c.classList.contains('hidden')));
      });
      const none = document.getElementById('abk-none'); if(none) none.classList.toggle('hidden',vis>0);
      const clr = document.getElementById('abk-clear'); if(clr) clr.classList.toggle('hidden',!term);
      const cnt = document.getElementById('abk-count');
      if(cnt) cnt.textContent = term ? `${vis} Treffer` : `${crd.length} Einträge`;
    },
    init(){ this.render(); document.getElementById('abk-search').value=''; this.filter(''); },
    data(){ return DATA; }
  };
})();

/* ======================================================================
   ABKTIP – Abkürzungen in Lernseiten antippen: Name und Erläuterung aus dem Abkürzungsverzeichnis
====================================================================== */
const ABKTIP=(function(){
  // zu allgemeine Kürzel nicht markieren (zu viele Fehltreffer)
  const SKIP=new Set(['Ma','SMART','CO','NA','PA','SP','OE','AS']);
  const BLOCK='script,style,textarea,input,select,a,button,summary,svg,h1,h2,h3,.abk-t,.acc-num,.page-title,.sec-h,.lj-src,.quiz-src,.m-hl,#m-hl-bar';
  let re=null, map=null, pop=null;
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function build(){
    if(re||map) return !!re;
    try{
      map=new Map();
      ABK.data().forEach(x=>{ if(x.a.length>=2&&!SKIP.has(x.a)&&!map.has(x.a)) map.set(x.a,x); });
      const keys=[...map.keys()].sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
      re=new RegExp('(?<![\\p{L}\\p{N}-])('+keys.join('|')+')(?![\\p{L}\\p{N}-])','gu');
    }catch(e){ re=null; }
    return !!re;
  }
  // jede Abkürzung auf der Seite nur beim ersten Vorkommen markieren (seen gilt für die ganze Seite)
  function wrapBlock(root,seen){
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.data.trim().length>1&&n.parentElement&&!n.parentElement.closest(BLOCK)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
    const nodes=[]; let n; while((n=w.nextNode())) nodes.push(n);
    nodes.forEach(node=>{
      re.lastIndex=0; const t=node.data; let m, last=0, frag=null;
      while((m=re.exec(t))){
        if(seen.has(m[1])) continue;
        seen.add(m[1]);
        frag=frag||document.createDocumentFragment();
        if(m.index>last) frag.appendChild(document.createTextNode(t.slice(last,m.index)));
        const sp=document.createElement('span'); sp.className='abk-t'; sp.dataset.k=m[1]; sp.tabIndex=0; sp.setAttribute('role','button'); sp.textContent=m[1];
        frag.appendChild(sp); last=m.index+m[1].length;
      }
      if(frag){ if(last<t.length) frag.appendChild(document.createTextNode(t.slice(last))); node.replaceWith(frag); }
    });
  }
  function apply(id){
    { const v0=document.getElementById(id); if(v0&&v0.hasAttribute('data-noabk')) return; }
    const v=document.getElementById(id); if(!v||v._abk||!v.querySelector('.pc')) return;
    v._abk=true;
    if(!build()) return;
    const pc=v.querySelector('.pc'), items=[...pc.querySelectorAll('.acc-item')];
    const seen=new Set();
    if(items.length) items.forEach(it=>wrapBlock(it,seen)); else wrapBlock(pc,seen);
  }
  function hide(){ if(pop) pop.hidden=true; }
  function show(el){
    const x=map&&map.get(el.dataset.k); if(!x) return;
    if(!pop){
      pop=document.createElement('div'); pop.id='abk-pop'; pop.hidden=true; pop.setAttribute('role','dialog'); pop.setAttribute('aria-label','Abkürzung');
      document.body.appendChild(pop);
      pop.addEventListener('click',e=>{ if(e.target.closest('[data-all]')){ hide(); NAV.go('v-abkuerzungen','Abkürzungen'); setTimeout(()=>{ const i=document.getElementById('abk-search'); if(i){ i.value=el.dataset.k; ABK.filter(el.dataset.k); } },120); } });
    }
    pop.innerHTML='<b>'+esc(x.a)+'</b> – '+esc(x.f)+(x.d?'<div class="abk-d">'+esc(x.d)+'</div>':'')+'<button type="button" data-all>Alle Abkürzungen ›</button>';
    pop.hidden=false;
    const r=el.getBoundingClientRect(), w=Math.min(320,innerWidth-24);
    pop.style.width=w+'px';
    pop.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+'px';
    const h=pop.offsetHeight, below=r.bottom+8+h<innerHeight-12;
    pop.style.top=(below?r.bottom+8:Math.max(12,r.top-8-h))+'px';
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest&&e.target.closest('.abk-t');
    if(t){ e.preventDefault(); show(t); return; }
    if(pop&&!pop.hidden&&!e.target.closest('#abk-pop')) hide();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') hide();
    if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('abk-t')){ e.preventDefault(); show(e.target); }
  });
  window.addEventListener('scroll',hide,{passive:true});
  return {apply,hide};
})();


/* ======================================================================
   CHROMIUM-ERKENNUNG – Warnung beim APK-Download
====================================================================== */
(function(){
  window._isChromium = !!window.chrome;
})();

/* ======================================================================
   INITIALISIERUNG
====================================================================== */
window.addEventListener('resize', () => {
  if(document.querySelector('.fc-outer')) FC.resize();
});

/* ======================================================================
   STREAK – tägliche Lernsträhne
====================================================================== */
const STREAK = (function(){
  function load(){ try{return JSON.parse(localStorage.getItem('bvi_streak')||'{}');}catch{return{};} }
  function save(d){ try{localStorage.setItem('bvi_streak',JSON.stringify(d));}catch{} }
  function todayStr(){ const n=new Date();return n.getFullYear()+'-'+(n.getMonth()+1)+'-'+n.getDate(); }
  return {
    record(){
      const d=load(),today=todayStr();
      if(d.lastStudy===today) return;
      const prev=new Date();prev.setDate(prev.getDate()-1);
      const yStr=prev.getFullYear()+'-'+(prev.getMonth()+1)+'-'+prev.getDate();
      d.current=d.lastStudy===yStr?(d.current||0)+1:1;
      d.longest=Math.max(d.longest||0,d.current);
      d.lastStudy=today;
      save(d);
    },
    get(){ return load(); }
  };
})();

/* ======================================================================
   NOTIF – Browser-Benachrichtigungen
====================================================================== */
const NOTIF = (function(){
  function prefs(){ try{return JSON.parse(localStorage.getItem('bvi_notif')||'{}');}catch{return{};} }
  function savePrefs(p){ try{localStorage.setItem('bvi_notif',JSON.stringify(p));}catch{} }
  const native=()=>!!(window.BVIAndroid&&window.BVIAndroid.setReminder);
  function syncToggle(){ const t=document.getElementById('m-notif-toggle'); if(t) t.checked=api.isEnabled(); }
  const api={
    async setEnabled(on){
      if(native()){
        // Android-App: echte Benachrichtigung, auch wenn die App geschlossen ist
        let r='ok'; try{ r=BVIAndroid.setReminder(!!on,api.hour()); }catch(e){ r='error'; }
        if(r==='ask') return !!prefs().enabled;
        savePrefs({...prefs(),enabled:!!on&&r==='ok'});
        if(on&&r==='ok') TOAST.show('Erinnerung gegen '+api.hour()+':00 Uhr aktiviert',{type:'ok'});
        return !!prefs().enabled;
      }
      if(!('Notification' in window)){ TOAST.show('Benachrichtigungen nicht unterstützt'); return false; }
      if(on){
        if(Notification.permission==='denied'){
          TOAST.show('Benachrichtigungen sind in deinem Browser blockiert. Erlaube sie über das Schloss-Symbol neben der Adresse (Website-Einstellungen) und schalte dann erneut ein.',{duration:9000});
          return false;
        }
        let r='denied';
        try{ r=await Notification.requestPermission(); }catch(e){}
        if(r!=='granted'){
          TOAST.show(r==='denied'?'Benachrichtigungen wurden abgelehnt. Du kannst sie über das Schloss-Symbol neben der Adresse wieder erlauben.':'Du hast die Abfrage geschlossen – bitte erlaube Benachrichtigungen, um erinnert zu werden.',{duration:8000});
          return false;
        }
        savePrefs({...prefs(),enabled:true});
        TOAST.show('Erinnerung aktiviert. Im Browser erscheint sie, wenn die App geöffnet ist; die Android-App erinnert auch bei geschlossener App.',{type:'ok',duration:8000}); return true;
      } else { savePrefs({...prefs(),enabled:false}); return false; }
    },
    // Antwort der Android-App auf die Berechtigungsabfrage
    _nativeResult(ok){
      savePrefs({...prefs(),enabled:!!ok});
      TOAST.show(ok?'Erinnerung gegen '+api.hour()+':00 Uhr aktiviert':'Benachrichtigungen wurden abgelehnt',{type:ok?'ok':undefined});
      syncToggle();
    },
    setHour(h){
      savePrefs({...prefs(),hour:parseInt(h,10)});
      if(native()&&prefs().enabled){ try{ BVIAndroid.setReminder(true,parseInt(h,10)); }catch(e){} }
    },
    hour(){ return prefs().hour||18; },
    isEnabled(){ const p=prefs(); return native()?!!p.enabled:(!!p.enabled&&'Notification' in window&&Notification.permission==='granted'); },
    check(){
      if(native()) return;
      const p=prefs(); if(!this.isEnabled()) return;
      const today=new Date().toDateString(); if(p.lastShown===today) return;
      if(new Date().getHours()<(p.hour||18)) return;
      try{ new Notification('B VI Lernwebsite 📚',{body:'Heute schon gelernt? Kurz Karten wiederholen!',icon:'./icons/icon-192.svg',tag:'bvi-daily'}); }catch{}
      savePrefs({...p,lastShown:today});
    }
  };
  return api;
})();

/* ======================================================================
   POMO – Pomodoro-Timer
====================================================================== */
const POMO=(function(){
  let _total=25*60, _rem=25*60, _running=false, _iv=null, _end=0;
  function fmt(s){ return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
  function tick(){ if(!_running) return; _rem=Math.max(0,Math.round((_end-Date.now())/1000)); render(); if(_rem<=0){ clearInterval(_iv); _running=false; done(); } }
  function render(){
    const d=document.getElementById('pomo-display'); if(d) d.textContent=fmt(_rem);
    const btn=document.getElementById('pomo-start'); if(btn) btn.textContent=_running?'Pause':'Start';
    document.getElementById('m-pomo')?.classList.toggle('hidden',!_running);
    const mt=document.getElementById('m-pomo-time');
    if(mt) mt.textContent=fmt(_rem);
  }
  function done(){
    render();
    TOAST.show('⏰ Zeit! Mach eine Pause.',{duration:6000});
    if(navigator.vibrate) navigator.vibrate([200,100,200]);
  }
  return {
    open(){ document.getElementById('pomodoro-overlay').classList.remove('hidden'); render(); },
    close(){ document.getElementById('pomodoro-overlay').classList.add('hidden'); },
    toggle(){
      if(_rem<=0) _rem=_total;   // nach Ablauf startet "Start" eine neue Runde
      _running=!_running;
      if(_running){ _end=Date.now()+_rem*1000; _iv=setInterval(tick,1000); } else clearInterval(_iv);
      render();
    },
    reset(){ clearInterval(_iv); _running=false; _rem=_total; render(); },
    setPreset(min,btn){
      clearInterval(_iv); _running=false;
      _total=min*60; _rem=_total;
      document.querySelectorAll('.pomo-preset').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      render();
    }
  };
})();

/* ======================================================================
   CHECKS – Abschnitte abhaken
====================================================================== */
const CHECKS=(function(){
  const SKIP=new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz','v-plan','v-pruefung','v-settings','v-notizen']);
  function key(id){ return 'bvi_checks_'+id; }
  function load(id){ try{ return JSON.parse(localStorage.getItem(key(id))||'{}'); }catch{ return {}; } }
  function save(id,d){ try{ localStorage.setItem(key(id),JSON.stringify(d)); }catch{} }
  return {
    init(id){
      if(SKIP.has(id)) return;
      const view=document.getElementById(id); if(!view) return;
      const checks=load(id);
      view.querySelectorAll('.acc-item summary').forEach((sum)=>{
        if(sum.querySelector('.acc-check')) return;
        const titleEl=sum.querySelector('.acc-title,.acc-h');
        const ck=(titleEl?titleEl.textContent:sum.textContent).trim().slice(0,80);
        const btn=document.createElement('button');
        btn.className='acc-check'+(checks[ck]?' checked':'');
        btn.title='Abgehakt'; btn.type='button';
        btn.innerHTML='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        btn.addEventListener('click',e=>{
          e.stopPropagation(); e.preventDefault();
          const d=load(id); d[ck]=!d[ck]; save(id,d);
          btn.classList.toggle('checked',!!d[ck]);
        });
        const arrow=sum.querySelector('.acc-arrow');
        if(arrow) sum.insertBefore(btn,arrow); else sum.appendChild(btn);
      });
    },
    // für LP: Lesestand je Kapitel abfragen bzw. setzen (gleicher Speicher wie die Haken)
    get(id,ck){ return !!load(id)[ck]; },
    set(id,ck,on){
      const d=load(id); d[ck]=!!on; save(id,d);
      const v=document.getElementById(id);
      v&&v.querySelectorAll('.acc-item summary').forEach(sum=>{
        const t=sum.querySelector('.acc-title,.acc-h');
        if(((t?t.textContent:sum.textContent).trim().slice(0,80))===ck) sum.querySelector('.acc-check')?.classList.toggle('checked',!!on);
      });
    }
  };
})();

/* ======================================================================
   TB – Tabellen am Handy: 2 Spalten als Begriff/Erklärung, 3–4 Spalten als Karten,
   ab 5 Spalten mit fester erster Spalte (reines CSS ab 700 px nicht nötig)
====================================================================== */
const TB=(function(){
  function init(id){
    const v=document.getElementById(id); if(!v) return;
    v.querySelectorAll('.pc table:not(.tb)').forEach(t=>{
      t.classList.add('tb');
      const rows=[...t.rows]; if(rows.length<2) { t.classList.add('tb-wide'); return; }
      const head=rows.find(r=>r.querySelector('th'))||rows[0];
      const hi=rows.indexOf(head);
      const spans=[...t.querySelectorAll('td,th')].some(c=>c.colSpan>1||c.rowSpan>1);
      const n=Math.max(...rows.map(r=>r.cells.length));
      head.classList.add('tb-head');
      const labels=[...head.cells].map(c=>c.textContent.replace(/\s+/g,' ').trim());
      rows.forEach((r,ri)=>{ if(ri===hi) return; [...r.cells].forEach((c,i)=>{ if(labels[i]) c.setAttribute('data-label',labels[i]); }); });
      const kind=spans?'wide':n===2?'dl':n<=4?'cards':'wide';
      t.classList.add('tb-'+kind);
      if(kind==='wide'){
        let w=t.parentElement;
        if(!w||!/auto|scroll/.test(getComputedStyle(w).overflowX)){ w=document.createElement('div'); t.parentNode.insertBefore(w,t); w.appendChild(t); }
        w.classList.add('tb-scroll');
        const hint=document.createElement('span'); hint.className='tb-hint'; hint.textContent='← wischen →'; w.appendChild(hint);
        { let q=0; w.addEventListener('scroll',()=>{ if(q) return; q=requestAnimationFrame(()=>{ q=0; hint.classList.toggle('gone',w.scrollLeft>8); }); },{passive:true}); }
        requestAnimationFrame(()=>{ if(w.scrollWidth<=w.clientWidth+4) hint.classList.add('gone'); });
      }
    });
  }
  return { init };
})();

/* ======================================================================
   LP – Lernseiten: Überblick mit Kapitelkarten, Kapitel-Fenster, Volltext
   (Handy/Tablet; ab 1100 px immer Volltext mit allen Abschnitten offen)
====================================================================== */
const LP=(function(){
  const mq=window.matchMedia('(min-width:1100px)');
  let win=null, cur=null, pushed=false, ignorePop=false;
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const items=v=>[...v.querySelectorAll('.pc .acc-item:not(.jg-gone)')];
  const ckOf=d=>{ const t=d.querySelector('summary .acc-title,summary .acc-h'); return (t?t.textContent:d.querySelector('summary').textContent).trim().slice(0,80); };
  const titleOf=d=>{ const t=d.querySelector('summary .acc-title,summary .acc-h'); return ((t?t.textContent:d.querySelector('summary').textContent)||'').replace(/\s+/g,' ').trim(); };
  const numOf=(d,i)=>d.querySelector('summary .acc-num')?.textContent.trim()||String(i+1).padStart(2,'0');
  function plain(body){
    const w=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);let out=[],n;
    while((n=w.nextNode())){ const t=n.nodeValue.replace(/\s+/g,' ').trim(); if(t) out.push(t); }
    return out.join(' ');
  }
  // Vorschau: erste Sätze/Stichpunkte des Kapitels, durch „·“ getrennt (statt aneinandergereihter Textknoten)
  function preview(body){
    const sel='p,li,.def-body,.step-desc';
    const out=[]; let n=0;
    body.querySelectorAll(sel).forEach(el=>{
      if(n>=170||el.querySelector(sel)||el.closest('table')) return;
      const t=el.textContent.replace(/\s+/g,' ').trim(); if(t.length<12) return;
      out.push(t.replace(/[.;:]$/,'')); n+=t.length;
    });
    let s=out.length?out.join(' · '):plain(body).replace(/ (?=[A-ZÄÖÜ])/g,' · ');
    if(s.length>170){ s=s.slice(0,170); const k=s.lastIndexOf(' '); s=(k>120?s.slice(0,k):s)+' …'; }
    return s;
  }
  function init(id){
    const v=document.getElementById(id); if(!v) return;
    if(v.hasAttribute('data-nolp')) return;
    if(v._lp){ apply(v); return; }
    const list=v.querySelector('.pc .acc-list:not(.acc-cards)'); if(!list||items(v).length<1) return;
    v._lp={id};
    const cards=document.createElement('div'); cards.className='lp-cards';
    list.parentNode.insertBefore(cards,list);
    cards.onclick=e=>{ const c=e.target.closest('.lp-card'); if(c) open(v,+c.dataset.i); };
    apply(v);
  }
  function apply(v){
    const mode='ueber'; // Handy, Tablet und Desktop gleich: Kapitelkarten, ein Kapitel öffnet im eigenen Fenster (Vorheriges/Nächstes Kapitel)
    v.classList.add('lp-on'); v.classList.toggle('lp-ueber',mode==='ueber'); v.classList.toggle('lp-voll',mode==='voll');
    if(mode==='voll'){ items(v).forEach(d=>{ d.open=true; }); }
    if(mode==='ueber') render(v);
  }
  function render(v){
    const its=items(v), id=v._lp.id, box=v.querySelector('.lp-cards'); if(!box) return;
    const ed=typeof JGUI!=='undefined'&&!!v.querySelector('.pc.jg-ed-on');
    box.innerHTML=its.map((d,i)=>{
      const body=d.querySelector('.acc-body')||d.querySelector('.lp-held');
      const read=CHECKS.get(id,ckOf(d));
      const key=ed?JGUI.chapterKey(id,d):'', ctl=key?'<span class="jg-ctl jg-cx" role="button" tabindex="0" aria-label="Kapitel löschen" data-key="'+esc(key)+'">✕</span>':'';
      return '<button type="button" class="lp-card'+(read?' read':'')+'" data-i="'+i+'"><span class="acc-num">'+esc(numOf(d,i))+'</span><span class="t">'+esc(titleOf(d))+'</span>'+(read?'<span class="acc-pts">✓ gelesen</span>':'')+'<span class="pv">'+esc(body?preview(body):'')+'</span><span class="go">Kapitel öffnen ›</span>'+ctl+'</button>';
    }).join('');
  }
  function build(){
    win=document.createElement('div'); win.className='lp-win'; win.setAttribute('role','dialog'); win.setAttribute('aria-label','Kapitel');
    win.innerHTML='<div class="lp-wh"><button type="button" class="lp-wb-back" aria-label="Zurück zur Übersicht"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button><div class="lp-wt"><span class="lp-eb"></span><b></b></div>'
      +'<div class="m-tb-actions"><button type="button" class="lp-fm" aria-label="Schrift kleiner">A−</button><button type="button" class="lp-fp" aria-label="Schrift größer">A+</button><button type="button" class="lp-bm" aria-label="Lesezeichen setzen" onclick="SHELL.bookmark()"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>'
      +'<button type="button" class="lp-nt" aria-label="Notiz zu dieser Seite" onclick="NOTES.toggle()"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button></div></div>'
      +'<div class="lp-bar"><i></i></div><div class="lp-wbody"></div><div class="lp-pg"><button type="button" class="lp-prev">‹ Vorheriges Kapitel</button><button type="button" class="lp-next">Nächstes Kapitel ›</button></div>';
    win.querySelector('.lp-wb-back').onclick=()=>back();
    win.querySelector('.lp-fm').onclick=()=>fz(-1);
    win.querySelector('.lp-fp').onclick=()=>fz(1);
    { let q=0; win.querySelector('.lp-wbody').addEventListener('scroll',()=>{ if(q) return; q=requestAnimationFrame(()=>{ q=0; bar(); }); },{passive:true}); } // pro Frame höchstens einmal rechnen
    swipe(win.querySelector('.lp-wbody'));
    win.querySelector('.lp-prev').onclick=()=>go(cur.i-1);
    win.querySelector('.lp-next').onclick=()=>go(cur.i+1);
    const mo=new MutationObserver(sync);
    ['m-bm','m-note'].forEach(i=>{ const e=document.getElementById(i); if(e) mo.observe(e,{attributes:true,attributeFilter:['class']}); });
  }
  function sync(){
    if(!win) return;
    win.querySelector('.lp-bm').classList.toggle('fab-active',!!document.getElementById('m-bm')?.classList.contains('fab-active'));
    win.querySelector('.lp-nt').classList.toggle('fab-active',!!document.getElementById('m-note')?.classList.contains('fab-active'));
  }
  function give(){ // Inhalt zurück in sein Kapitel
    if(!cur||!cur.body) return;
    const d=items(cur.v)[cur.i]; if(d&&cur.body.parentNode!==d) d.appendChild(cur.body);
    cur.body.classList.remove('lp-held'); cur.body=null;
  }
  function load(i){
    const its=items(cur.v), d=its[i]; cur.i=i;
    const body=d.querySelector('.acc-body'); cur.body=body;
    const wb=win.querySelector('.lp-wbody'); wb.innerHTML='<h2 class="lp-h">'+esc(titleOf(d))+'</h2>'; wb.appendChild(body); body.classList.add('lp-held');
    win.querySelector('.lp-eb').textContent='Kapitel '+numOf(d,i)+' / '+String(its.length).padStart(2,'0');
    applyFz();
    win.querySelector('.lp-wt b').textContent=document.querySelector('#'+cur.v.id+' .page-title')?.textContent.trim()||'';
    // Vorheriges/Nächstes Kapitel ist immer möglich, solange es davor/danach noch eine Seite mit Kapiteln gibt
    win.querySelector('.lp-prev').classList.toggle('dis',i===0&&!neighbor(cur.v.id,-1));
    win.querySelector('.lp-next').classList.toggle('dis',i===its.length-1&&!neighbor(cur.v.id,1));
    wb.scrollTop=0; CHECKS.set(cur.v._lp.id,ckOf(d),true); sync(); bar();
    if(typeof HL!=='undefined') HL.apply(cur.v.id);   // Markierungen im Kapitel-Fenster zeigen
  }
  // Fokus-Lesemodus: Fortschrittslinie (Kapitel + Lesestand im Kapitel) und Schriftgröße
  function bar(){
    if(!cur||!win) return;
    const wb=win.querySelector('.lp-wbody'), n=items(cur.v).length, f=wb.scrollHeight>wb.clientHeight?wb.scrollTop/(wb.scrollHeight-wb.clientHeight):1;
    win.querySelector('.lp-bar i').style.width=Math.min(100,(cur.i+f)/n*100)+'%';
  }
  const FZ=[15,16,18,20,22,24];
  function fzIdx(){ try{ const i=parseInt(localStorage.getItem('bvi_lp_fz'),10); return i>=0&&i<FZ.length?i:2; }catch(e){ return 2; } }
  function fz(d){ const i=Math.max(0,Math.min(FZ.length-1,fzIdx()+d)); try{ localStorage.setItem('bvi_lp_fz',String(i)); }catch(e){} applyFz(); }
  function applyFz(){ win&&win.style.setProperty('--lp-fz',FZ[fzIdx()]+'px'); requestAnimationFrame(fitTables); }
  // Tabellen, die in die Breite passen, scrollen nicht seitlich: sie geben das waagerechte Wischen an den Kapitelwechsel ab
  // (sonst übernimmt der Browser die Geste und die Wisch-Ereignisse brechen ab). Breite Tabellen scrollen weiter selbst.
  function fitTables(){ if(!win) return; win.querySelectorAll('.lp-wbody .tbl-wrap').forEach(w=>w.classList.toggle('tw-fit',w.clientWidth>0&&w.scrollWidth<=w.clientWidth+1)); }
  window.addEventListener('resize',()=>{ if(cur) requestAnimationFrame(fitTables); });
  // Lage des Kapitel-Fensters: links/Breite wie die Seite, unten bis zur Tab-Leiste (nur wenn sie sichtbar ist; sonst Wert entfernen, z. B. nach Drehen aufs Querformat)
  function place(){
    if(!win||!cur) return;
    const r=cur.v.getBoundingClientRect(); win.style.setProperty('--lp-l',Math.max(0,r.left)+'px'); win.style.setProperty('--lp-w',r.width+'px');
    const tb=document.getElementById('m-tabbar');
    if(tb&&tb.offsetHeight) win.style.setProperty('--lp-tb',tb.offsetHeight+'px'); else win.style.removeProperty('--lp-tb');
  }
  window.addEventListener('resize',()=>{ if(cur&&win&&win.classList.contains('on')) place(); });
  function open(v,i,opt){
    if(!win) build();
    const focus=!!(opt&&opt.focus);
    cur={v,i,body:null,focus};
    win.classList.toggle('focus',focus); v.classList.toggle('lp-focus',focus);
    v.appendChild(win); v.classList.add('lp-open'); document.documentElement.classList.add('lp-lock');
    place();
    load(i); win.classList.add('on');
    if(!pushed){ try{ history.pushState(Object.assign({},history.state||{},{lp:1}),''); pushed=true; }catch(e){} }
  }
  // Reihenfolge der Seiten („Tabs“) wie in der Übersicht, von der man kam; sonst die Reihenfolge der Gruppe des Lehrgangs
  function pagesOf(vid){
    const par=typeof NAV!=='undefined'&&NAV.parent&&NAV.parent();
    const hub=par&&document.getElementById(par);
    if(hub){
      const out=[]; hub.querySelectorAll('[onclick*="NAV.go(\'v-"]').forEach(x=>{
        if(x.closest('.related-topics,.m-tourhome,.lp-win')) return;
        const m=/NAV\.go\('(v-[\w-]+)'/.exec(x.getAttribute('onclick')||''); if(m&&!out.includes(m[1])) out.push(m[1]);
      });
      if(out.includes(vid)) return out;
    }
    return (typeof PROGRESS!=='undefined'&&PROGRESS.groupOf&&PROGRESS.groupOf(vid))||[vid];
  }
  const hasChapters=id=>{ const e=document.getElementById(id); return !!e&&e.classList.contains('view')&&!e.hasAttribute('data-nolp')&&!!e.querySelector('.pc .acc-list:not(.acc-cards)')&&items(e).length>0; };
  // nächste (dir=1) oder vorherige (dir=-1) Seite mit Kapiteln
  function neighbor(vid,dir){
    const list=pagesOf(vid); let k=list.indexOf(vid); if(k<0) return null;
    for(k+=dir;k>=0&&k<list.length;k+=dir) if(hasChapters(list[k])) return list[k];
    return null;
  }
  // Über die Seitengrenze blättern: Fenster bleibt offen, die Seite dahinter wird ersetzt
  function cross(dir){
    const t=neighbor(cur.v.id,dir); if(!t) return;
    const focus=cur.focus, old=cur.v;
    give(); old.classList.remove('lp-open','lp-focus'); cur=null;
    if(typeof HL!=='undefined') HL.apply(old.id);
    if(old.classList.contains('lp-ueber')) render(old);
    const label=document.querySelector('#'+t+' .page-title')?.textContent.trim()||t;
    NAV.replace(t,label);
    const v=document.getElementById(t); if(!v._lp) init(t);
    open(v,dir>0?0:items(v).length-1,{focus});
  }
  const canGo=dir=>{ if(!cur) return false; const n=items(cur.v).length, j=cur.i+dir; return (j>=0&&j<n)||!!neighbor(cur.v.id,dir); };
  // Wischen zum nächsten/vorherigen Kapitel (nur Touch/Stift), gleiche Logik wie bei den Lernkarten: der Inhalt folgt dem Finger,
  // ab 80 px oder schnellem Wisch wird gewechselt, sonst federt er zurück. Senkrechtes Wischen scrollt weiter ganz normal.
  // Konflikte: Wischen in waagerecht scrollbaren Tabellen/Schaubildern, am Bildschirmrand (Zurück-Geste), mit Markierung, beim Zoomen
  // und in Eingabefeldern löst keinen Kapitelwechsel aus; ein Wisch löst kein Antippen (Bild vergrößern) aus.
  function swipe(el){
    const THR=80, EDGE=44, reduce=()=>window.matchMedia&&false;
    let x0=0, y0=0, live=false, moved=false, dx=0, pid=-1, lt=0, lx=0, vx=0, mute=0;
    const hscroll=t=>{ for(let n=t;n&&n!==el;n=n.parentElement){ if(n.scrollWidth>n.clientWidth+1){ const o=getComputedStyle(n).overflowX; if(o==='auto'||o==='scroll') return true; } } return false; };
    const rest=()=>{ el.style.transform=''; el.style.opacity=''; };
    el.addEventListener('pointerdown',e=>{
      if(!cur||e.pointerType==='mouse'||!e.isPrimary||live) return;
      if(e.clientX<EDGE||e.clientX>window.innerWidth-EDGE) return;
      if(window.visualViewport&&window.visualViewport.scale>1.02) return;
      if(e.target.closest&&(e.target.closest('input,textarea,select,[contenteditable],iframe,.lp-nosw')||hscroll(e.target))) return;
      if(String(window.getSelection&&window.getSelection()||'').length) return;
      x0=e.clientX; y0=e.clientY; dx=0; live=true; moved=false; pid=e.pointerId; lt=performance.now(); lx=x0; vx=0;
    });
    el.addEventListener('pointermove',e=>{
      if(!live||e.pointerId!==pid) return;
      dx=e.clientX-x0; const dy=e.clientY-y0;
      if(!moved){
        if(Math.abs(dy)>Math.abs(dx)+5&&Math.abs(dy)>8){ live=false; return; }   // senkrecht: normales Scrollen
        if(Math.abs(dx)<10) return;
        moved=true; try{ el.setPointerCapture(pid); }catch(_){}
      }
      const now=performance.now(); if(now>lt){ vx=(e.clientX-lx)/(now-lt); lt=now; lx=e.clientX; }
      const can=canGo(dx<0?1:-1), shown=can?dx:dx*0.25;   // ohne Ziel gibt es nur einen kleinen Widerstand
      el.style.transition='none'; el.style.transform='translateX('+shown+'px)'; el.style.opacity=String(1-Math.min(.5,Math.abs(shown)/(el.clientWidth||400)));
    });
    const end=e=>{
      if(e.pointerId!==pid||!live) return;
      live=false;
      if(!moved) return;
      mute=Date.now()+350;   // das folgende „click“ (z. B. Bild vergrößern) ignorieren
      const dir=(Math.abs(vx)>0.6&&Math.abs(dx)>20?vx:dx)<0?1:-1, can=canGo(dir), W=el.clientWidth||window.innerWidth;
      if(e.type==='pointercancel'||!can||!(Math.abs(dx)>=THR||(Math.abs(vx)>0.6&&Math.abs(dx)>20))){
        el.style.transition=reduce()?'none':'transform .35s cubic-bezier(.34,1.56,.64,1),opacity .2s'; rest(); return;
      }
      const ms=reduce()?0:170;
      el.style.transition=ms?'transform '+ms+'ms ease-in,opacity '+ms+'ms':'none'; el.style.transform='translateX('+(-dir*W)+'px)'; el.style.opacity='0';
      setTimeout(()=>{
        if(!cur) return;
        go(cur.i+dir);   // über die Seitengrenze, wenn es auf dieser Seite kein weiteres Kapitel gibt
        el.style.transition='none'; el.style.transform='translateX('+(dir*W*.4)+'px)'; el.style.opacity='0';
        void el.offsetWidth;
        el.style.transition=reduce()?'none':'transform .25s cubic-bezier(.2,.8,.3,1),opacity .2s'; rest();
      },ms);
    };
    el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
    el.addEventListener('click',e=>{ if(Date.now()<mute){ e.stopPropagation(); e.preventDefault(); } },true);
  }
  function go(i){
    if(!cur) return;
    if(i>=0&&i<items(cur.v).length){ give(); load(i); return; }
    cross(i<0?-1:1);
  }
  function close(silent){
    if(!cur) return;
    give(); const v=cur.v; win.classList.remove('on','focus'); v.classList.remove('lp-open','lp-focus'); document.documentElement.classList.remove('lp-lock'); cur=null;
    if(typeof HL!=='undefined') HL.apply(v.id);
    if(v.classList.contains('lp-ueber')) render(v);
    if(pushed){ pushed=false; if(!silent){ ignorePop=true; try{ history.back(); }catch(e){ ignorePop=false; } } }
  }
  function back(){ close(false); }
  window.addEventListener('popstate',e=>{
    if(ignorePop){ ignorePop=false; e.stopImmediatePropagation(); return; }
    // Zurück bei geöffneter Bildansicht schließt nur diese, nicht auch noch das Kapitelfenster
    if(typeof LIGHTBOX!=='undefined'&&LIGHTBOX.isOpen()){ LIGHTBOX.close(true); e.stopImmediatePropagation(); return; }
    if(cur){ close(true); e.stopImmediatePropagation(); }
  },true);
  document.addEventListener('keydown',e=>{
    if(!cur) return;
    if(e.key==='Escape'&&!e.defaultPrevented&&!OVL.any()){ if(!(typeof LIGHTBOX!=='undefined'&&LIGHTBOX.isOpen())) back(); }   // Esc schließt zuerst die Bildansicht
    else if(cur.focus&&!/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'')){
      if(e.key==='ArrowRight') go(cur.i+1); else if(e.key==='ArrowLeft') go(cur.i-1);
    }
  });
  // ── Fokus-Lesemodus (Desktop) ──
  function focusMode(){
    if(cur&&win&&win.classList.contains('on')){ cur.focus=!cur.focus; win.classList.toggle('focus',cur.focus); cur.v.classList.toggle('lp-focus',cur.focus); bar(); return; }   // Kapitel ist schon offen: nur umschalten
    const v=document.querySelector('.view.active'); if(!v||!v._lp) return;
    const cards=[...v.querySelectorAll('.lp-card')], its=cards.length&&cards[0].offsetParent?cards:items(v); let i=0;   // die Kapitelkarten (oder, ohne Karten, die Kapitel selbst) zeigen, wo man gerade liest
    its.forEach((d,k)=>{ if(d.getBoundingClientRect().top<window.innerHeight*0.4) i=k; });
    open(v,i,{focus:true});
  }
  // ── Lernkarten-Fenster neben der Lernseite (Desktop): ein-/ausblendbar ──
  const PMAP={
    'v-vak-jur-denken':['VAk · Ermessen und Verhältnismäßigkeit'],'v-vak-verwaltungsrecht':['VAk · Verwaltungsrecht','VAk · Verwaltungsvollstreckung und Rechtsschutz'],'v-vak-staatsrecht':['VAk · Staatsrecht'],
    'v-vak-einsatzrecht':['VAk · Einsatzrecht Berlin','VAk · Gefahrenabwehr','VAk · Fallbearbeitung'],'v-vak-dienstrecht':['VAk · Dienstrecht','VAk · Dienstrecht Fallklausur Berlin'],
    'v-ibk-ta':['IBK · Transaktionsanalyse'],'v-ibk-konflikt':['IBK · Konflikte'],
    'v-feuak-vwl':['FeuAK · VWL'],'v-feuak-haushalt':['FeuAK · Haushalt'],'v-feuak-pm':['FeuAK · PM'],'v-feuak-bedarfsplanung':['FeuAK · Bedarfsplanung'],
    'v-feuak-qm':['FeuAK · QM'],'v-feuak-beschaffung':['FeuAK · Vergabe'],
    'v-idf-vb-41':['IdF · Brandschutz'],'v-idf-vb-42':['IdF · Brandschutz'],'v-idf-vb-43':['IdF · Brandschutz'],'v-idf-vb-44':['IdF · Brandschutz'],'v-idf-vb-45':['IdF · Brandschutz'],'v-idf-vb-46':['IdF · Brandschutz'],'v-idf-vb-47':['IdF · Brandschutz'],'v-idf-s51':['IdF · Stabsarbeit'],'v-idf-s52':['IdF · Stabsarbeit'],'v-idf-s53':['IdF · Stabsarbeit'],'v-idf-s54':['IdF · Stabsarbeit'],'v-idf-s55':['IdF · Stabsarbeit']
  };

  const cardsFor=id=>{ const c=PMAP[id]; return c&&typeof FLASHCARD_DATA!=='undefined'?FLASHCARD_DATA.filter(x=>c.includes(x.cat)):[]; };
  const PRKEY='bvi_lp_prac';
  let pr={id:null,list:[],i:0,flip:false,known:0}, panel=null;
  const prefPrac=()=>{ try{ return localStorage.getItem(PRKEY)==='1'; }catch(e){ return false; } };
  const shuf=a=>{ const r=[...a]; for(let i=r.length-1;i>0;i--){ const j=0|Math.random()*(i+1); [r[i],r[j]]=[r[j],r[i]]; } return r; };
  function drawPrac(){
    if(!panel) return;
    const c=pr.list[pr.i], n=pr.list.length;
    panel.innerHTML='<div class="lpp-h"><b>Üben</b><span>'+n+' Karten zu dieser Seite</span><button type="button" class="lpp-x" aria-label="Lernkarten ausblenden">✕</button></div>'
      +'<div class="lpp-bar"><i style="width:'+(n?pr.known/n*100:0)+'%"></i></div>'
      +(c?'<button type="button" class="lpp-card" aria-label="Karte umdrehen"><small>'+(pr.flip?'Antwort':'Frage')+' '+(pr.i+1)+' / '+n+'</small><div class="'+(pr.flip?'a':'q')+'">'+(pr.flip?c.a:c.q)+'</div></button>'
        +'<div class="lpp-act"><button type="button" class="lpp-no">Nochmal</button><button type="button" class="lpp-ok">Gewusst</button></div><p class="lpp-t">Antippen dreht die Karte um. Die Bewertung zählt auch bei den Lernkarten.</p>':'<p class="lpp-t">Keine Karten zu dieser Seite.</p>');
    panel.querySelector('.lpp-x').onclick=()=>togglePractice(false);
    const card=panel.querySelector('.lpp-card'); if(card) card.onclick=()=>{ pr.flip=!pr.flip; drawPrac(); };
    const rate=ok=>{ FC.rateExternal(c.id,ok); if(ok) pr.known=Math.min(n,pr.known+1); pr.i=(pr.i+1)%n; pr.flip=false; drawPrac(); };
    const ok=panel.querySelector('.lpp-ok'), no=panel.querySelector('.lpp-no'); if(ok) ok.onclick=()=>rate(true); if(no) no.onclick=()=>rate(false);
  }
  function applyPrac(id){
    const list=cardsFor(id);
    const on=!!list.length&&prefPrac()&&mq.matches;
    document.body.classList.toggle('lp-prac',on);
    if(!on){ panel&&panel.classList.remove('on'); return; }
    if(!panel){ panel=document.createElement('aside'); panel.id='lp-practice'; panel.setAttribute('aria-label','Lernkarten zu dieser Seite'); document.body.appendChild(panel); }
    if(pr.id!==id){ pr={id,list:shuf(list),i:0,flip:false,known:0}; }
    panel.classList.add('on'); drawPrac();
  }
  function togglePractice(force){
    const v=document.querySelector('.view.active'); if(!v) return;
    const on=typeof force==='boolean'?force:!prefPrac();
    try{ localStorage.setItem(PRKEY,on?'1':'0'); }catch(e){}
    applyPrac(v.id); tools(v.id);
  }
  // Knöpfe „Fokus“ und „Üben“ in der Kopfleiste nur auf passenden Seiten zeigen
  function tools(id){
    const v=document.getElementById(id), f=document.getElementById('m-focus'), p=document.getElementById('m-practice');
    if(f) f.classList.toggle('hidden',!(v&&v._lp));
    if(p){ const has=cardsFor(id).length>0; p.classList.toggle('hidden',!has); p.classList.toggle('fab-active',has&&prefPrac()); }
  }
  mq.addEventListener&&mq.addEventListener('change',()=>{ const v=document.querySelector('.view.active'); if(v&&v._lp) apply(v); });
  // Suche: direkt zum Kapitel – im Überblick (Handy/Tablet) im Kapitel-Fenster, sonst Abschnitt aufklappen und hinscrollen
  function focus(id,i){
    const v=document.getElementById(id); if(!v) return;
    const d=items(v)[i]; if(!d) return;
    if(v._lp&&v.classList.contains('lp-ueber')){ open(v,i); return; }
    d.open=true; d.scrollIntoView({block:'start',behavior:'smooth'});
  }
  return { init, refresh(id){ const v=document.getElementById(id); if(v&&v._lp&&v.classList.contains('lp-ueber')) render(v); }, held(){ return cur&&cur.body?{d:items(cur.v)[cur.i],body:cur.body}:null; }, focus, focusMode, togglePractice, canFocus:()=>{ const v=document.querySelector('.view.active'); return !!(v&&v._lp); }, canPractice:()=>cardsFor(document.querySelector('.view.active')?.id).length>0, isOpen:()=>!!cur, back,
    onShow(id){ if(cur) close(true); applyPrac(id); setTimeout(()=>tools(id),0); } };
})();

/* ======================================================================
   CUSTOM – Eigene Lernkarten
====================================================================== */
const CUSTOM=(function(){
  const KEY='bvi_fc_custom', MODS=['Laufbahn','IBK','VAk','FeuAK','IdF'];
  let box=null;
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const html=t=>esc(t.trim()).replace(/\n/g,'<br>');
  const load=()=>{ try{ const a=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(a)?a.filter(c=>c&&typeof c==='object'&&c.id&&typeof c.cat==='string'):[]; }catch(e){ return []; } };
  const save=a=>{ try{ localStorage.setItem(KEY,JSON.stringify(a)); }catch(e){} };
  function refresh(){ if(typeof FC!=='undefined') FC.syncFilters(); SHELL.renderFcSide(); }
  function list(){
    const el=box.querySelector('#cu-list'), a=load();
    el.innerHTML=a.length?a.map(c=>`<div class="cu-item"><div><b>${esc(c.cat.split(' · ')[0])}</b> ${c.q}</div><button aria-label="Karte löschen" data-id="${esc(c.id)}">Löschen</button></div>`).join(''):'<div class="cu-empty">Noch keine eigenen Karten.</div>';
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>remove(b.dataset.id));
  }
  function remove(id){
    save(load().filter(c=>c.id!==id));
    const i=FLASHCARD_DATA.findIndex(c=>c.id===id); if(i>=0) FLASHCARD_DATA.splice(i,1);
    // Lernstand, Stern und "schwer" der gelöschten Karte entfernen (sonst zählt sie weiter)
    try{
      const fc=JSON.parse(localStorage.getItem('bvi_fc')||'{}'); if(fc&&typeof fc==='object'&&id in fc){ delete fc[id]; localStorage.setItem('bvi_fc',JSON.stringify(fc)); }
      ['bvi_fc_stars','bvi_fc_weak'].forEach(k=>{ const a=JSON.parse(localStorage.getItem(k)||'[]'); if(Array.isArray(a)&&a.includes(id)) localStorage.setItem(k,JSON.stringify(a.filter(x=>x!==id))); });
    }catch(e){}
    list(); refresh();
    if(typeof FC!=='undefined'&&document.getElementById('v-flashcards').classList.contains('active')) FC.start(true);
  }
  function add(){
    const q=box.querySelector('#cu-q').value, a=box.querySelector('#cu-a').value, m=box.querySelector('#cu-m').value;
    if(!q.trim()||!a.trim()){ TOAST.show('Bitte Frage und Antwort eintragen',{type:'info'}); return; }
    const c={id:'own'+Date.now().toString(36),cat:m+' · Eigene Karte',q:html(q),a:html(a)};
    const all=load(); all.push(c); save(all);
    FLASHCARD_DATA.push({...c,own:true});
    box.querySelector('#cu-q').value=''; box.querySelector('#cu-a').value='';
    list(); refresh(); TOAST.show('Karte gespeichert',{type:'ok'});
    box.querySelector('#cu-q').focus();
  }
  const plain=h=>String(h).replace(/<br\s*\/?>/g,'\n').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  function exportCards(){
    const a=load();
    if(!a.length){ TOAST.show('Noch keine eigenen Karten zum Exportieren',{type:'info'}); return; }
    const data={app:'bvi-lernwebsite',typ:'eigene-karten',version:APP_VERSION,exportiert:new Date().toISOString(),
      karten:a.map(c=>({modul:c.cat.split(' · ')[0],frage:plain(c.q),antwort:plain(c.a)}))};
    const d=new Date(), p2=n=>String(n).padStart(2,'0');
    FILES.save('bvi-eigene-karten-'+d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+'.json','application/json',JSON.stringify(data,null,1));
  }
  // ── Kartenstapel teilen: Link oder Code (Karten stecken im Link selbst, nichts läuft über einen Server) ──
  const URL_APP='https://flametan.github.io/BVI-Lernwebsite/';
  const toB64u=u8=>{ let b=''; for(let i=0;i<u8.length;i+=8192) b+=String.fromCharCode.apply(null,u8.subarray(i,i+8192)); return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
  const fromB64u=t=>{ const b=atob(t.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((t.length+3)%4)); const u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; };
  async function pack(){
    const a=load(), bytes=new TextEncoder().encode(JSON.stringify({v:1,k:a.map(c=>[c.cat.split(' · ')[0],plain(c.q),plain(c.a)])}));
    if(typeof CompressionStream!=='undefined'){
      try{ return 'BVIK1.'+toB64u(new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer())); }catch(e){}
    }
    return 'BVIK0.'+toB64u(bytes);
  }
  async function unpack(text){
    const m=/BVIK([01])\.([A-Za-z0-9_-]+)/.exec(String(text||'')); if(!m) throw new Error('code');
    let bytes=fromB64u(m[2]);
    if(m[1]==='1') bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    const j=JSON.parse(new TextDecoder().decode(bytes));
    if(!j||!Array.isArray(j.k)) throw new Error('format');
    return j.k.slice(0,300).map(x=>({modul:x[0],frage:x[1],antwort:x[2]}));
  }
  // Karten zu den vorhandenen hinzufügen (gleiche Fragen im selben Modul werden übersprungen)
  function merge(items){
    const all=load(), have=new Set(all.map(c=>c.cat.split(' · ')[0]+'|'+plain(c.q).trim())); let n=0;
    items.forEach(k=>{
      const m=MODS.includes(k.modul)?k.modul:'Laufbahn', q=String(k.frage||'').slice(0,500), a=String(k.antwort||'').slice(0,1500);
      if(!q.trim()||!a.trim()||have.has(m+'|'+q.trim())) return;
      have.add(m+'|'+q.trim());
      const c={id:'own'+Date.now().toString(36)+n,cat:m+' · Eigene Karte',q:html(q),a:html(a)};
      all.push(c); FLASHCARD_DATA.push({...c,own:true}); n++;
    });
    save(all); if(box) list(); refresh();
    return n;
  }
  async function fromCode(text,ask){
    let items;
    try{ items=await unpack(text); }catch(e){ TOAST.show('Das ist kein gültiger Karten-Link oder -Code',{type:'info'}); return; }
    if(!items.length){ TOAST.show('Keine Karten gefunden',{type:'info'}); return; }
    if(ask&&!confirm(items.length+' Lernkarten übernehmen?\n\nSie werden zu deinen eigenen Karten hinzugefügt.')) return;
    const n=merge(items);
    TOAST.show(n?n+' Karten importiert':'Alle Karten hatte ich schon',{type:n?'ok':'info'});
  }
  async function shareLink(){
    if(!load().length){ TOAST.show('Noch keine eigenen Karten zum Teilen',{type:'info'}); return null; }
    return URL_APP+'?karten='+await pack();
  }
  async function shareNow(){
    const link=await shareLink(); if(!link) return;
    const n=load().length;
    if(navigator.share){ try{ await navigator.share({title:'B VI – Lernkarten',text:'Meine '+n+' Lernkarten für B VI. Link öffnen, dann werden sie übernommen:',url:link}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
    try{ await navigator.clipboard.writeText(link); TOAST.show('Link kopiert – jetzt z. B. in WhatsApp einfügen',{type:'ok'}); }
    catch(e){ box.querySelector('#cu-code').value=link; TOAST.show('Link steht unten im Feld – bitte kopieren',{type:'info'}); }
  }
  async function showQr(){
    const link=await shareLink(); if(!link) return;
    const el=box.querySelector('#cu-qr');
    if(link.length>2300){ el.innerHTML='<div class="cu-empty">Zu viele Karten für einen QR-Code – bitte „Link teilen“ nutzen.</div>'; return; }
    try{ await APPSHARE.qr(el,link); el.innerHTML+='<div class="cu-empty" style="text-align:center">Mit der Kamera scannen, der Link öffnet B VI</div>'; }
    catch(e){ el.innerHTML='<div class="cu-empty">QR-Code konnte nicht erstellt werden – bitte „Link teilen“ nutzen.</div>'; }
  }
  function importCards(file){
    if(!file) return;
    const r=new FileReader();
    r.onload=()=>{
      try{
        const j=JSON.parse(r.result);
        if(j.typ!=='eigene-karten'||!Array.isArray(j.karten)) throw new Error('format');
        const n=merge(j.karten);
        TOAST.show(n?n+' Karten importiert':'Keine neuen Karten gefunden',{type:n?'ok':'info'});
      }catch(e){ TOAST.show('Datei nicht lesbar – bitte eine exportierte Kartendatei wählen',{type:'info'}); }
    };
    r.readAsText(file);
  }
  function build(){
    box=document.createElement('div'); box.id='cu-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Eigene Lernkarte');
    box.innerHTML='<div class="cu-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t">Eigene Lernkarte</div>'
      +'<label>Modul<select id="cu-m">'+MODS.map(m=>'<option>'+m+'</option>').join('')+'</select></label>'
      +'<label>Frage<textarea id="cu-q" rows="3" maxlength="500"></textarea></label>'
      +'<label>Antwort<textarea id="cu-a" rows="4" maxlength="1500"></textarea></label>'
      +'<button class="btn btn-gold" id="cu-save">Karte speichern</button>'
      +'<div class="cu-h">Meine Karten</div><div id="cu-list"></div>'
      +'<div class="cu-h">Karten teilen</div><div class="cu-io"><button class="btn btn-ghost" id="cu-share">Link teilen</button><button class="btn btn-ghost" id="cu-qrb">QR-Code zeigen</button></div><div id="cu-qr"></div>'
      +'<label>Link oder Code von jemand anderem<textarea id="cu-code" rows="2" placeholder="Link oder Code hier einfügen"></textarea></label><button class="btn btn-ghost" id="cu-fromcode">Karten übernehmen</button>'
      +'<div class="cu-io"><button class="btn btn-ghost" id="cu-exp">Als Datei speichern</button><label class="btn btn-ghost" for="cu-imp">Aus Datei laden</label><input type="file" id="cu-imp" accept=".json,application/json" hidden></div>'
      +'</div>';
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
    box.querySelector('#cu-save').onclick=add;
    box.querySelector('#cu-exp').onclick=exportCards;
    box.querySelector('#cu-share').onclick=shareNow;
    box.querySelector('#cu-qrb').onclick=showQr;
    box.querySelector('#cu-fromcode').onclick=()=>{ const t=box.querySelector('#cu-code').value; if(t.trim()) fromCode(t,false).then(()=>{ box.querySelector('#cu-code').value=''; }); };
    box.querySelector('#cu-imp').onchange=e=>{ importCards(e.target.files[0]); e.target.value=''; };
  }
  // pre: {a: vorbelegte Antwort, view: Seite, von der der Text stammt} – für „Als Lernkarte“ aus einer Markierung
  function open(pre){
    if(!box) build(); list(); box.hidden=false;
    if(pre){
      box.querySelector('#cu-a').value=String(pre.a||'').slice(0,1500);
      box.querySelector('#cu-q').value='';
      const m=({gal:'GAL',sfs:'SFS',hlfs:'HLFS',ibk:'IBK',vak:'VAk',feuak:'FeuAK',idf:'IdF'})[String(pre.view||'').split('-')[1]];
      if(m) box.querySelector('#cu-m').value=m;
    }
    box.querySelector('#cu-q').focus({preventScroll:true});
  }
  function close(){ if(box) box.hidden=true; }
  return {open,close,fromCode};
})();

/* ======================================================================
   WEAK – schwere Karten im Überblick
====================================================================== */
const WEAK=(function(){
  let box=null;
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function build(){
    box=document.createElement('div'); box.id='wk-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Nochmal üben');
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
  }
  function render(){
    const n=FC.weakCount(), by=FC.weakByModule();
    const chips=Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<span class="wk-chip">${esc(k)} <b>${v}</b></span>`).join('');
    box.innerHTML=`<div class="cu-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t" style="text-align:left;padding-right:36px">Nochmal üben</div>
      <div class="wk-sec"><div class="wk-h">Lernkarten</div>${n?`<div class="wk-n"><b>${n}</b> ${n===1?'Karte':'Karten'} mit „schwer“ oder „nicht gewusst“</div><div class="wk-chips">${chips}</div><button class="btn btn-gold" onclick="WEAK.cards()">Diese Karten üben</button>`:'<div class="wk-n m">Keine schweren Karten. Gut so!</div>'}</div>
      <div class="m-t2">Eine Karte verschwindet aus der Liste, sobald du sie als „gewusst“ beantwortest.</div></div>`;
  }
  function open(){ if(!box) build(); render(); box.hidden=false; box.querySelector('.sh-x').focus({preventScroll:true}); }
  function close(){ if(box) box.hidden=true; }
  return {
    open,close,
    cards(){ close(); NAV.tab('v-flashcards','Lernkarten'); FC.showWeak(); }
  };
})();

/* ======================================================================
   RECENT – Zuletzt besucht
====================================================================== */
const RECENT=(function(){
  const KEY='bvi_recent'; const MAX=5;
  const SKIP=new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz','v-plan','v-pruefung','v-settings','v-notizen']);
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } }
  function save(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch{} }
  return {
    track(id){
      if(SKIP.has(id)) return;
      const label=document.querySelector('#'+id+' .page-title')?.textContent?.trim()||id;
      const entries=load().filter(e=>e.id!==id);
      entries.unshift({id,label});
      save(entries.slice(0,MAX));
    },
    clear(){ save([]); },
    list(){ return load(); }
  };
})();

/* ======================================================================
   ONBOARD – Erste-Schritte-Overlay (einmalig)
====================================================================== */
const ONBOARD=(function(){
  const KEY='bvi_onboarded';
  let _step=0;
  const TOTAL=3;
  function syncSetup(){
    THEME.render(); ACCENT.render();
  }
  // Lehrgangsliste der letzten Seite (neueste zuerst, der Master ist vorgewählt)
  function fillCourses(){
    const sel=document.getElementById('ob-jg'); if(!sel||sel.options.length) return;
    sel.innerHTML=JG.list().map(j=>'<option value="'+j.id+'"'+(j.id===JG.MASTER?' selected':'')+'>'+j.label+(j.id===JG.MASTER?' (Master)':'')+'</option>').join('');
  }
  function setStep(n){
    _step=Math.max(0,Math.min(TOTAL-1,n));
    document.querySelectorAll('.ob-step').forEach((el,i)=>el.classList.toggle('active',i===_step));
    document.querySelectorAll('.ob-dot').forEach((el,i)=>el.classList.toggle('active',i===_step));
    const nextBtn=document.querySelector('.ob-next');
    if(nextBtn) nextBtn.textContent=_step===TOTAL-1?'Los geht\'s!':'Weiter →';
    if(_step===0) syncSetup();
    if(_step===2) fillCourses();
  }
  return {
    init(){
      if(localStorage.getItem(KEY)) return;
      document.getElementById('onboarding-overlay')?.classList.remove('hidden');
    },
    next(){ if(_step<TOTAL-1){ setStep(_step+1); } else { this.finish(); } },
    // Letzte Seite: Master → nichts weiter; anderer Jahrgang → wählen und die Erklärseite zeigen
    finish(){
      const id=document.getElementById('ob-jg')?.value||JG.MASTER;
      this.close();
      if(id!==JG.MASTER){ JG.set(id); if(typeof JGUI!=='undefined') JGUI.help(true); }
    },
    goto(n){ setStep(n); },
    close(){
      document.getElementById('onboarding-overlay')?.classList.add('hidden');
      localStorage.setItem(KEY,'1');
    }
  };
})();

/* ──────────────────────────────────────────────
   QUIZ – Altklausur Quiz
────────────────────────────────────────────────── */
function makeQuiz(cfg){
  const G=cfg.G,SFX=cfg.sfx||'',VIEW_ID=cfg.view,HTMLX=!!cfg.html,EXAM_MIN=cfg.minutes||60;
  const $=id=>document.getElementById(id+SFX);
  const $v=()=>document.getElementById(VIEW_ID);
  let self;
  const KEY_BM=cfg.keys.bm;
  const KEY_MASTERY=cfg.keys.mastery;
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  const Q=cfg.Q;

  let _mode='learn',_order=[],_cur=0,_answered=false,_filter='all',_catFilter='all',_inited=false;
  if(cfg.topCats&&cfg.keys.cat){ try{ const c=localStorage.getItem(cfg.keys.cat); if(c&&cfg.Q.some(q=>q.cat===c)) _catFilter=c; }catch(e){} }   // gewählter Themenbereich bleibt erhalten
  let _bookmarks=new Set(),_examAnswers={},_examSubmitted=false;
  let _masteryMap={},_sessionCorrect=0,_sessionWrong=0,_sessionSkipped=0,_retried=new Set();
  let _typeFilter='all',_posHistory={},_retriedCount=0,_examPendingSubmit=false,_filterOpen=false;
  let _examTimerInterval=null,_examTimeLeft=0,_msel=new Set(),_examQs=[];
  const setTxt=(el,t)=>{if(HTMLX)el.innerHTML=t;else el.textContent=t;};
  const corrSet=q=>new Set(q.type==='multi'?q.correct:[q.correct]);
  const sameSet=(a,b)=>a.size===b.size&&[...a].every(x=>b.has(x));
  const TYPE_LBL={mc:'Multiple Choice',tf:'Richtig / Falsch',multi:'Mehrfachauswahl',essay:'Freitextfrage'};
  const BASIS_LBL={protokoll:'Quelle: Prüfungsprotokoll',tab:'Quelle: IdF-Tab',web:'Quelle: Recherche',gemischt:'Quelle: Protokoll/Tab/Recherche'};
  function examOk(q){const a=_examAnswers[q.id];return q.type==='multi'?!!a&&sameSet(new Set(a),corrSet(q)):a===q.correct;}
  function markOpts(q,sel){const c=corrSet(q);$v().querySelectorAll('.quiz-opt').forEach((b,i)=>{b.disabled=true;b.classList.remove('sel');if(c.has(i)){b.classList.add('correct');if(!sel.has(i))b.classList.add('missed');}else if(sel.has(i))b.classList.add('wrong');});}
  function metaHtml(q){return (q.basis?'<span class="quiz-src-tag">'+(BASIS_LBL[q.basis]||'')+'</span>':'')+(q.unsicher?'<span class="quiz-src-tag quiz-src-warn">⚠ Antwort bitte prüfen</span>':'');}

  function startTimer(){
    if(document.documentElement.classList.contains('no-timers')) return;
    _examTimeLeft=EXAM_MIN*60;
    const bar=$('quiz-exam-timer-bar');
    if(bar)bar.classList.remove('hidden');
    updateTimerDisplay();
    clearInterval(_examTimerInterval);
    const end=Date.now()+_examTimeLeft*1000;   // Endzeitpunkt statt Herunterzählen: läuft auch bei gedrosselten Timern richtig
    _examTimerInterval=setInterval(()=>{_examTimeLeft=Math.max(0,Math.round((end-Date.now())/1000));updateTimerDisplay();if(_examTimeLeft<=0){clearInterval(_examTimerInterval);self.submitExam(true);}},1000);
  }
  function updateTimerDisplay(){
    const el=$('quiz-exam-time');if(!el)return;
    const m=Math.floor(_examTimeLeft/60),s=_examTimeLeft%60;
    el.textContent=m+':'+String(s).padStart(2,'0');
    const bar=$('quiz-exam-timer-bar');
    if(bar)bar.classList.toggle('qetb-urgent',_examTimeLeft<=300);
  }
  function stopTimer(){
    clearInterval(_examTimerInterval);_examTimerInterval=null;
    const bar=$('quiz-exam-timer-bar');
    if(bar)bar.classList.add('hidden');
  }

  const CAT_LABELS=cfg.catLabels||{};

  function loadBm(){try{const s=localStorage.getItem(KEY_BM);if(s)_bookmarks=new Set(JSON.parse(s));}catch(e){}}
  function saveBm(){try{localStorage.setItem(KEY_BM,JSON.stringify([..._bookmarks]));}catch(e){}}
  // Wiederholung nach Plan: richtig = nächste Stufe (1, 3, 7, 14, 30 Tage), falsch = Stufe 1 und sofort fällig
  const KEY_SRS=cfg.keys.srs, SRS_DAYS=[0,1,3,7,14,30];
  let _srs={};
  function loadSrs(){try{_srs=JSON.parse(localStorage.getItem(KEY_SRS)||'{}')||{};}catch(e){_srs={};}}
  function srsUpdate(id,ok){
    const cur=_srs[id]||{box:0};
    const box=ok?Math.min(5,(cur.box||0)+1):1;
    _srs[id]={box,due:ok?Date.now()+SRS_DAYS[box]*864e5:Date.now()};
    try{localStorage.setItem(KEY_SRS,JSON.stringify(_srs));}catch(e){}
  }
  const isDue=id=>!!_srs[id]&&_srs[id].due<=Date.now();
  function dueCount(){ loadSrs(); return Object.values(_srs).filter(x=>x&&x.due<=Date.now()).length; }
  function updateDueBtn(){const b=$('quiz-filter-due');if(b){const n=Q.filter(q=>isDue(q.id)).length;b.textContent='↻ Fällig'+(n?' ('+n+')':'');}}
  function loadMastery(){try{const s=localStorage.getItem(KEY_MASTERY);if(s)_masteryMap=JSON.parse(s);}catch(e){}}
  function saveMastery(){try{localStorage.setItem(KEY_MASTERY,JSON.stringify(_masteryMap));}catch(e){}}

  const KEY_STATS=cfg.keys.stats;
  function loadStats(){try{return JSON.parse(localStorage.getItem(KEY_STATS)||'{"sessions":[],"exams":[]}');}catch{return{sessions:[],exams:[]};}}
  function saveStats(d){try{localStorage.setItem(KEY_STATS,JSON.stringify(d));}catch{}}
  function recordSession(ok,err,skip){
    if(!ok&&!err&&!skip)return;
    const d=loadStats();
    d.sessions.push({ts:new Date().toISOString().slice(0,16),ok,err,skip});
    if(d.sessions.length>50)d.sessions=d.sessions.slice(-50);
    saveStats(d);
  }
  function recordExam(ok,total,pct,grade){
    const d=loadStats();
    d.exams.push({ts:new Date().toISOString().slice(0,16),ok,total,pct,grade});
    if(d.exams.length>20)d.exams=d.exams.slice(-20);
    saveStats(d);
  }
  function shuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=0|Math.random()*(i+1);[r[i],r[j]]=[r[j],r[i]];}return r;}
  function filteredIds(){let p=_filter==='bookmarked'?Q.filter(q=>_bookmarks.has(q.id)):_filter==='wrong'?Q.filter(q=>_masteryMap[q.id]==='err'):_filter==='due'?Q.filter(q=>isDue(q.id)):Q;if(_catFilter!=='all')p=p.filter(q=>q.cat===_catFilter);if(_typeFilter!=='all')p=p.filter(q=>q.type===_typeFilter);return p.map(q=>q.id);}
  function buildOrder(){_order=shuffle(filteredIds());_cur=0;_answered=false;_sessionCorrect=0;_sessionWrong=0;_sessionSkipped=0;_retried=new Set();_retriedCount=0;_posHistory={};hideSummary();renderFilterStatus();}
  function curQ(){return Q.find(q=>q.id===_order[_cur]);}

  function renderCatBar(){
    const bar=$('quiz-cat-bar');if(!bar)return;
    const cats=[...new Set(Q.map(q=>q.cat))];
    bar.innerHTML='<button class="quiz-cat-filter-btn'+(_catFilter==='all'?' active':'')+'" data-cat="all">Alle</button>'
      +cats.map(c=>'<button class="quiz-cat-filter-btn'+(_catFilter===c?' active':'')+'" data-cat="'+esc(c)+'">'+(CAT_LABELS[c]||esc(c))+'</button>').join('');
    bar.querySelectorAll('.quiz-cat-filter-btn').forEach(btn=>{btn.addEventListener('click',()=>{self.setCatFilter(btn.dataset.cat);});});
    // Themenbereich oben auf der Seite: immer sichtbar, gilt für Lernmodus und Prüfungsmodus
    const top=$('quiz-topcat');
    if(top&&cfg.topCats){
      const n=c=>Q.filter(q=>c==='all'||q.cat===c).length;
      top.innerHTML=['all',...cats].map(c=>'<button type="button" class="quiz-topcat-btn'+(_catFilter===c?' active':'')+'" data-cat="'+esc(c)+'" aria-pressed="'+(_catFilter===c)+'">'+(c==='all'?'Alle':esc(c))+' <small>'+n(c)+'</small></button>').join('');
      top.querySelectorAll('.quiz-topcat-btn').forEach(btn=>{btn.addEventListener('click',()=>{self.setCatFilter(btn.dataset.cat);});});
      if(cfg.keys.cat){ try{ if(_catFilter==='all') localStorage.removeItem(cfg.keys.cat); else localStorage.setItem(cfg.keys.cat,_catFilter); }catch(e){} }
    }
  }

  function renderMastery(){
    const grid=$('quiz-mastery-grid');if(!grid)return;
    grid.innerHTML=Q.map(q=>{const m=_masteryMap[q.id];return'<span class="qmd '+(m==='ok'?'qmd-ok':m==='err'?'qmd-err':'qmd-un')+'" title="'+esc(q.q.substring(0,60))+'"></span>';}).join('');
  }

  function renderMasteryCats(){
    const el=$('quiz-mastery-cats');if(!el)return;
    const cats=[...new Set(Q.map(q=>q.cat))];
    el.innerHTML=cats.map(cat=>{
      const qs=Q.filter(q=>q.cat===cat);
      const ok=qs.filter(q=>_masteryMap[q.id]==='ok').length;
      const err=qs.filter(q=>_masteryMap[q.id]==='err').length;
      const pct=Math.round((ok/qs.length)*100);
      return'<div class="quiz-mcat"><span class="quiz-mcat-name">'+(CAT_LABELS[cat]||esc(cat))+'</span><div class="quiz-mcat-bar"><div class="quiz-mcat-fill" style="width:'+pct+'%"></div></div><span class="quiz-mcat-stat"><span class="qmc-ok">'+ok+'✓</span> <span class="qmc-err">'+err+'✗</span> / '+qs.length+'</span></div>';
    }).join('');
  }

  function renderTypeBar(){
    const bar=$('quiz-type-bar');if(!bar)return;
    const types=[{k:'all',l:'Alle Typen'},{k:'mc',l:'Multiple Choice'},{k:'multi',l:'Mehrfachauswahl'},{k:'tf',l:'Richtig/Falsch'},{k:'essay',l:'Freitext'}].filter(t=>t.k==='all'||Q.some(q=>q.type===t.k));
    bar.innerHTML=types.map(t=>'<button class="quiz-cat-filter-btn'+(_typeFilter===t.k?' active':'')+'" data-type="'+t.k+'">'+t.l+'</button>').join('');
    bar.querySelectorAll('.quiz-cat-filter-btn').forEach(btn=>{btn.addEventListener('click',()=>{self.setTypeFilter(btn.dataset.type);});});
  }

  function renderFilterStatus(){
    const el=$('quiz-filter-status');
    const tog=$('qft-status');
    const count=filteredIds().length;
    updateDueBtn();
    const parts=[];
    if(_filter!=='all')parts.push(_filter==='bookmarked'?'★ Gemerkte':_filter==='due'?'↻ Fällig':'✗ Falsche');
    if(_catFilter!=='all')parts.push(CAT_LABELS[_catFilter]||_catFilter);
    if(_typeFilter!=='all')parts.push(TYPE_LBL[_typeFilter]||_typeFilter);
    const hasFilter=parts.length>0;
    if(el){
      el.innerHTML='<span class="qfs-count">'+count+' Frage'+(count!==1?'n':'')+'</span>'
        +(parts.length?'<span class="qfs-sep">·</span><span class="qfs-chips">'+parts.map(p=>'<span class="qfs-chip">'+esc(p)+'</span>').join('')+'</span>':'')
        +(hasFilter?'<button class="qfs-reset" onclick="'+G+'.clearFilters()">× leeren</button>':'');
    }
    if(tog){tog.textContent=hasFilter?parts.join(' · '):count+' Fragen';tog.className='qft-status'+(hasFilter?' qft-active':'');}
  }

  function initKeyboard(){
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){const m=$('quiz-mastery-modal');if(m&&!m.classList.contains('hidden')){self.closeMastery();return;}}
      if(_mode!=='learn'||!$v().classList.contains('active')||e.ctrlKey||e.metaKey||e.altKey||(typeof OVL!=='undefined'&&OVL.any()))return;
      const inText=e.target.matches('textarea,input,select,[contenteditable]');
      if(e.key===' '&&!inText&&!(e.target.closest&&e.target.closest('button,a,summary'))){   // Leertaste auf einem fokussierten Knopf klickt den Knopf
        e.preventDefault();
        const q=curQ();if(!q)return;
        if(_answered)self.next();else if(q.type==='essay')self._revealEssay();else if(q.type==='multi')self._check();
      }else if(e.key==='Backspace'&&!inText){
        if(_cur>0){e.preventDefault();self.back();}
      }else if(!inText&&['1','2','3','4','5','6'].includes(e.key)){
        const q=curQ();
        if(!_answered&&q&&(q.type==='mc'||q.type==='tf')){const idx=+e.key-1;if(idx<q.opts.length)self._answer(idx);}
        else if(!_answered&&q&&q.type==='multi'){const idx=+e.key-1;if(idx<q.opts.length)self._toggle(idx);}
      }
    });
  }

  function initTouch(){
    const card=$('quiz-learn-inner');if(!card)return;
    let sx=0,sy=0;
    card.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
    card.addEventListener('touchend',e=>{
      if(_mode!=='learn'||!curQ())return;
      const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
      if(Math.abs(dx)<50||Math.abs(dy)>Math.abs(dx)*0.75)return;
      if(dx<0){if(_answered)self.next();}else{if(_cur>0)self.back();}
    },{passive:true});
  }

  function showSummary(){
    recordSession(_sessionCorrect,_sessionWrong,_sessionSkipped);
    const inner=$('quiz-learn-inner'),summary=$('quiz-summary');
    if(inner)inner.classList.add('hidden');
    if(!summary)return;
    const mc=_sessionCorrect+_sessionWrong||1;
    const pct=Math.round((_sessionCorrect/mc)*100);
    const d=loadStats();
    const past=d.sessions.slice(0,-1);
    let cmpHtml='';
    if(past.length>0){
      const pastOk=past.reduce((s,x)=>s+(x.ok||0),0);
      const pastAns=past.reduce((s,x)=>s+(x.ok||0)+(x.err||0),0);
      const avg=pastAns?Math.round(pastOk/pastAns*100):0;
      const diff=pct-avg;
      const arrow=diff>0?'↑':diff<0?'↓':'→';
      const col=diff>0?'#22c55e':diff<0?'#ef4444':'var(--c-sub)';
      cmpHtml='<div class="quiz-summary-cmp"><span style="color:'+col+'">'+arrow+' '+(diff>0?'+':'')+diff+'%</span> zum Schnitt ('+avg+'%)</div>';
    }
    summary.innerHTML='<div class="quiz-summary-inner"><div class="quiz-summary-title">Runde abgeschlossen!</div><div class="quiz-summary-stats"><div class="quiz-stat quiz-stat-ok"><div class="quiz-stat-num">'+_sessionCorrect+'</div><div class="quiz-stat-label">Richtig</div></div><div class="quiz-stat quiz-stat-err"><div class="quiz-stat-num">'+_sessionWrong+'</div><div class="quiz-stat-label">Falsch</div></div><div class="quiz-stat quiz-stat-skip"><div class="quiz-stat-num">'+_sessionSkipped+'</div><div class="quiz-stat-label">Übersprungen</div></div></div><div class="quiz-summary-pct">'+pct+' % richtig (MC / R-F)</div>'+cmpHtml+'<button class="quiz-next-btn quiz-new-round-btn" onclick="'+G+'.newRound()">Neue Runde ↻</button></div>';
    summary.classList.remove('hidden');
  }

  function hideSummary(){
    const inner=$('quiz-learn-inner'),summary=$('quiz-summary');
    if(inner)inner.classList.remove('hidden');
    if(summary)summary.classList.add('hidden');
  }

  function renderLearn(){
    const q=curQ();
    if(!q){renderEmpty();return;}
    $('quiz-cat').textContent=q.cat;
    $('quiz-counter').textContent=(_cur+1)+' / '+_order.length;
    $('quiz-progress').style.width=((_cur/_order.length)*100)+'%';
    $('quiz-bm-btn').textContent=_bookmarks.has(q.id)?'★':'☆';
    const rt=$('quiz-retry-tag');if(rt)rt.textContent=_retriedCount>0?'+'+_retriedCount+' ↻':'';
    $('quiz-q').textContent=q.q;
    const im=$('quiz-img');if(im){im.innerHTML=q.img||'';im.classList.toggle('hidden',!q.img);}
    const mt=$('quiz-meta');if(mt)mt.innerHTML=metaHtml(q);
    _msel=new Set();
    const tb=$('quiz-type-badge');
    tb.textContent=TYPE_LBL[q.type]||'';
    tb.className='quiz-type-badge quiz-type-'+q.type;
    const opts=$('quiz-opts');
    if(q.type==='mc'){
      opts.innerHTML='<div class="quiz-opts">'+q.opts.map((o,i)=>'<button class="quiz-opt" onclick="'+G+'._answer('+i+')"><span class="quiz-opt-label">'+String.fromCharCode(97+i)+'</span><span class="quiz-opt-text">'+esc(o)+'</span></button>').join('')+'</div>';
    }else if(q.type==='tf'){
      opts.innerHTML='<div class="quiz-opts">'+q.opts.map((o,i)=>'<button class="quiz-opt quiz-tf-opt" onclick="'+G+'._answer('+i+')"><span class="quiz-opt-text">'+esc(o)+'</span></button>').join('')+'</div>';
    }else if(q.type==='multi'){
      opts.innerHTML='<div class="quiz-multi-hint">Mehrere Antworten möglich – alle richtigen müssen gewählt sein.</div><div class="quiz-opts">'+q.opts.map((o,i)=>'<button class="quiz-opt quiz-opt-multi" onclick="'+G+'._toggle('+i+')"><span class="quiz-opt-label quiz-opt-box">'+String.fromCharCode(97+i)+'</span><span class="quiz-opt-text">'+esc(o)+'</span></button>').join('')+'</div><button class="quiz-reveal-btn quiz-check-btn" onclick="'+G+'._check()">Antwort prüfen</button>';
    }else{
      opts.innerHTML='<textarea class="quiz-textarea" aria-label="Deine Antwort" id="quiz-ta'+SFX+'" placeholder="Schreibe deine Antwort hier..." rows="4"></textarea><button class="quiz-reveal-btn" onclick="'+G+'._revealEssay()">Lösung anzeigen</button>';
    }
    const exp=$('quiz-exp');exp.textContent='';exp.className='quiz-exp hidden';
    const noteEl=$('quiz-note');if(noteEl){noteEl.textContent='';noteEl.className='quiz-note hidden';}
    const hist=_posHistory[_cur];
    if(hist){
      _answered=true;
      if(q.type==='essay'){
        setTxt(exp,q.ref);exp.className='quiz-exp quiz-exp-ref';
        const rb=$v().querySelector('.quiz-reveal-btn');if(rb)rb.disabled=true;
      }else{
        markOpts(q,new Set(hist.sel||(hist.userIdx==null?[]:[hist.userIdx])));
        setTxt(exp,q.exp);exp.className=hist.correct?'quiz-exp quiz-exp-ok':'quiz-exp quiz-exp-err';
        if(q.note&&noteEl){noteEl.textContent=q.note;noteEl.className='quiz-note';}
      }
      $('quiz-skip').classList.add('hidden');
      $('quiz-next').classList.remove('hidden');
    }else{
      $('quiz-skip').classList.remove('hidden');
      $('quiz-next').classList.add('hidden');
      _answered=false;
    }
    const bb=$('quiz-back');if(bb)bb.classList.toggle('hidden',_cur===0);
  }

  function renderEmpty(){
    $('quiz-cat').textContent='';$('quiz-counter').textContent='';
    $('quiz-type-badge').textContent='';
    const msg=_filter==='bookmarked'?'Keine gemerkten Fragen für diesen Filter.':_filter==='wrong'?'Keine falsch beantworteten Fragen für diesen Filter.':(_catFilter!=='all'||_typeFilter!=='all'?'Keine Fragen für diesen Filter.':'Keine Fragen gefunden.');
    $('quiz-q').textContent=msg;
    $('quiz-opts').innerHTML='';$('quiz-exp').className='quiz-exp hidden';
    $('quiz-skip').classList.add('hidden');$('quiz-next').classList.add('hidden');
    $('quiz-progress').style.width='100%';
  }

  function renderExam(){
    _examAnswers={};_examSubmitted=false;_examPendingSubmit=false;
    const el=$('quiz-exam-questions');
    const pool=cfg.topCats&&_catFilter!=='all'?Q.filter(q=>q.cat===_catFilter):Q;   // Prüfungsmodus: nur der gewählte Themenbereich
    _examQs=cfg.examCount?shuffle(pool.filter(q=>q.type!=='essay')).slice(0,cfg.examCount):pool;
    el.innerHTML=_examQs.map((q,qi)=>{
      const isE=q.type==='essay';
      const optsH=isE
        ?'<div class="quiz-exam-essay-note">Freitextfrage – fließt nicht in die Bewertung ein</div><textarea class="quiz-textarea quiz-exam-ta" id="qeta-'+q.id+SFX+'" placeholder="Notizen..." rows="3"></textarea>'
        :(q.type==='multi'?'<div class="quiz-multi-hint">Mehrfachauswahl – alle richtigen Antworten wählen</div>':'')+q.opts.map((o,i)=>'<label class="quiz-exam-opt" id="qeol-'+q.id+'-'+i+SFX+'"><input type="'+(q.type==='multi'?'checkbox':'radio')+'" name="qe-'+q.id+SFX+'" value="'+i+'" onchange="'+G+(q.type==='multi'?'._examTog('+q.id+','+i+',this.checked)':'._examSel('+q.id+','+i+')')+'"><span class="quiz-exam-opt-label">'+(q.type==='tf'?(i===0?'R':'F'):String.fromCharCode(97+i))+'</span><span>'+esc(o)+'</span></label>').join('');
      return '<div class="quiz-exam-q" id="qeq-'+q.id+SFX+'"><div class="quiz-exam-q-header"><span class="quiz-exam-q-num" id="qeqn-'+q.id+SFX+'">Frage '+(qi+1)+'</span><span class="quiz-cat quiz-cat-sm">'+esc(q.cat)+'</span>'+(isE?'<span class="quiz-essay-tag">Freitext</span>':'')+'</div><div class="quiz-exam-q-text">'+esc(q.q)+'</div>'+(q.img?'<div class="quiz-img">'+q.img+'</div>':'')+'<div class="quiz-exam-opts" id="qeo-'+q.id+SFX+'">'+optsH+'</div><div class="quiz-exam-ref hidden" id="qee-'+q.id+SFX+'">'+(HTMLX?(isE?q.ref:q.exp):esc(isE?q.ref:q.exp))+'</div></div>';
    }).join('');
    $('quiz-exam-footer').classList.remove('hidden');
    $('quiz-result').classList.add('hidden');
    startTimer();
  }

  self={
    qs(){return Q;},
    init(){
      if(_inited)return;_inited=true;
      loadBm();loadMastery();loadSrs();buildOrder();renderCatBar();renderTypeBar();renderLearn();initKeyboard();initTouch();
    },
    setMode(m){
      _mode=m;
      $('quiz-learn').classList.toggle('hidden',m!=='learn');
      $('quiz-exam').classList.toggle('hidden',m!=='exam');
      $('quiz-mode-learn').classList.toggle('active',m==='learn');
      $('quiz-mode-exam').classList.toggle('active',m==='exam');
      if(m==='exam')renderExam();
      else{stopTimer();buildOrder();renderCatBar();renderTypeBar();renderLearn();}
    },
    _answer(idx){
      if(_answered)return;_answered=true;
      const q=curQ();const ok=idx===q.correct;
      markOpts(q,new Set([idx]));
      const exp=$('quiz-exp');
      setTxt(exp,q.exp);exp.className=ok?'quiz-exp quiz-exp-ok':'quiz-exp quiz-exp-err';A11Y.say((ok?'Richtig. ':'Falsch. ')+(q.exp||''));
      const noteEl2=$('quiz-note');if(q.note&&noteEl2){noteEl2.textContent=q.note;noteEl2.className='quiz-note';}
      $('quiz-skip').classList.add('hidden');$('quiz-next').classList.remove('hidden');
      _masteryMap[q.id]=ok?'ok':'err';saveMastery();srsUpdate(q.id,ok);updateDueBtn();
      _posHistory[_cur]={userIdx:idx,correct:ok};
      if(typeof GAME!=='undefined') GAME.event('quiz',ok);
      if(!ok&&!_retried.has(q.id)){_retried.add(q.id);_order.push(q.id);_retriedCount++;const rt=$('quiz-retry-tag');if(rt){rt.textContent='+'+_retriedCount+' ↻';rt.classList.add('qrt-flash');setTimeout(()=>rt.classList.remove('qrt-flash'),600);}}
      if(ok)_sessionCorrect++;else _sessionWrong++;
      renderMastery();renderMasteryCats();
    },
    _revealEssay(){
      if(_answered)return;_answered=true;
      const q=curQ();
      const exp=$('quiz-exp');setTxt(exp,q.ref);exp.className='quiz-exp quiz-exp-ref';
      $('quiz-skip').classList.add('hidden');$('quiz-next').classList.remove('hidden');
      const rb=$v().querySelector('.quiz-reveal-btn');if(rb)rb.disabled=true;
      if(!_masteryMap[q.id]||_masteryMap[q.id]==='err')_masteryMap[q.id]='ok';
      saveMastery();srsUpdate(q.id,true);updateDueBtn();_posHistory[_cur]={userIdx:null,correct:true};
      if(typeof GAME!=='undefined') GAME.event('quiz',true);
      renderMastery();renderMasteryCats();
    },
    _toggle(i){
      if(_answered)return;
      if(_msel.has(i))_msel.delete(i);else _msel.add(i);
      $v().querySelectorAll('.quiz-opt')[i]?.classList.toggle('sel',_msel.has(i));
    },
    _check(){
      if(_answered)return;
      const q=curQ();if(!q||!_msel.size)return;
      _answered=true;
      const sel=new Set(_msel),ok=sameSet(sel,corrSet(q));
      markOpts(q,sel);
      const exp=$('quiz-exp');setTxt(exp,q.exp);exp.className=ok?'quiz-exp quiz-exp-ok':'quiz-exp quiz-exp-err';
      const noteEl=$('quiz-note');if(q.note&&noteEl){noteEl.textContent=q.note;noteEl.className='quiz-note';}
      const cb=$v().querySelector('.quiz-check-btn');if(cb)cb.disabled=true;
      $('quiz-skip').classList.add('hidden');$('quiz-next').classList.remove('hidden');
      _masteryMap[q.id]=ok?'ok':'err';saveMastery();srsUpdate(q.id,ok);updateDueBtn();
      _posHistory[_cur]={userIdx:null,sel:[...sel],correct:ok};
      if(typeof GAME!=='undefined') GAME.event('quiz',ok);
      if(!ok&&!_retried.has(q.id)){_retried.add(q.id);_order.push(q.id);_retriedCount++;const rt=$('quiz-retry-tag');if(rt)rt.textContent='+'+_retriedCount+' ↻';}
      if(ok)_sessionCorrect++;else _sessionWrong++;
      renderMastery();renderMasteryCats();
    },
    next(){_cur++;if(_cur>=_order.length){showSummary();return;}renderLearn();},
    skip(){_sessionSkipped++;_cur++;if(_cur>=_order.length){showSummary();return;}renderLearn();},
    newRound(){buildOrder();renderLearn();},
    toggleBookmark(){
      const q=curQ();if(!q)return;
      if(_bookmarks.has(q.id))_bookmarks.delete(q.id);else _bookmarks.add(q.id);
      saveBm();$('quiz-bm-btn').textContent=_bookmarks.has(q.id)?'★':'☆';
    },
    setFilter(f){
      _filter=f;
      $('quiz-filter-all').classList.toggle('active',f==='all');
      $('quiz-filter-bm').classList.toggle('active',f==='bookmarked');
      $('quiz-filter-wrong')?.classList.toggle('active',f==='wrong');
      $('quiz-filter-due')?.classList.toggle('active',f==='due');
      buildOrder();renderFilterStatus();renderLearn();
    },
    setCatFilter(cat){_catFilter=cat;renderCatBar();if(_mode==='exam'){stopTimer();renderExam();return;}buildOrder();renderFilterStatus();renderLearn();},
    setTypeFilter(t){_typeFilter=t;renderTypeBar();buildOrder();renderFilterStatus();renderLearn();},
    toggleFilters(){
      _filterOpen=!_filterOpen;
      const body=$('quiz-filter-body');
      const chev=$('qft-chevron');
      if(body)body.classList.toggle('open',_filterOpen);
      if(chev)chev.style.transform=_filterOpen?'rotate(180deg)':'';
    },
    clearFilters(){
      _filter='all';_catFilter='all';_typeFilter='all';
      $('quiz-filter-all').classList.add('active');
      $('quiz-filter-bm').classList.remove('active');
      $('quiz-filter-wrong')?.classList.remove('active');
      $('quiz-filter-due')?.classList.remove('active');
      renderCatBar();renderTypeBar();renderFilterStatus();buildOrder();renderLearn();
    },
    back(){if(_cur>0){_cur--;renderLearn();}},
    dueCount,
    reshuffle(){buildOrder();renderLearn();},
    openMastery(){
      renderMastery();renderMasteryCats();
      const m=$('quiz-mastery-modal');
      if(m){m.classList.remove('hidden');document.body.style.overflow='hidden';}
    },
    closeMastery(){
      const m=$('quiz-mastery-modal');
      if(m){m.classList.add('hidden');document.body.style.overflow='';}
    },
    resetMastery(){
      if(!confirm('Lernstand für alle '+Q.length+' Fragen zurücksetzen?'))return;
      _masteryMap={};saveMastery();renderMastery();renderMasteryCats();
    },
    _examSel(qid,idx){_examAnswers[qid]=idx;},
    _examTog(qid,idx,on){const a=new Set(_examAnswers[qid]||[]);if(on)a.add(idx);else a.delete(idx);if(a.size)_examAnswers[qid]=[...a];else delete _examAnswers[qid];},
    submitExam(force){   // force: Zeit abgelaufen, ohne Rückfrage abgeben
      if(_examSubmitted)return;
      const unanswered=_examQs.filter(q=>q.type!=='essay'&&_examAnswers[q.id]===undefined);
      if(unanswered.length>0&&!_examPendingSubmit&&!force){
        unanswered.forEach(q=>{const el=$('qeq-'+q.id);if(el)el.classList.add('exam-q-unanswered');});
        const warn=$('quiz-exam-warn');
        if(warn){warn.textContent=unanswered.length+' Frage'+(unanswered.length!==1?'n':'')+' noch nicht beantwortet – nochmal klicken zum Abgeben.';warn.classList.remove('hidden');}
        const first=$('qeq-'+unanswered[0].id);
        if(first)first.scrollIntoView({behavior:'smooth',block:'center'});
        _examPendingSubmit=true;return;
      }
      _examSubmitted=true;_examPendingSubmit=false;stopTimer();
      let correct=0,total=0;
      _examQs.forEach(q=>{
        const ee=$('qee-'+q.id);if(ee)ee.classList.remove('hidden');
        if(q.type==='essay')return;
        total++;
        const sel=_examAnswers[q.id],ok=examOk(q),selS=new Set(q.type==='multi'?(sel||[]):[sel]),cS=corrSet(q);
        if(ok)correct++;
        q.opts.forEach((o,i)=>{const l=$('qeol-'+q.id+'-'+i);if(!l)return;if(cS.has(i))l.classList.add('exam-correct');else if(selS.has(i))l.classList.add('exam-wrong');});
        const eo=$('qeo-'+q.id);if(eo)eo.querySelectorAll('input').forEach(inp=>inp.disabled=true);
        const qel=$('qeq-'+q.id);if(qel)qel.classList.add(ok?'exam-q-correct':'exam-q-wrong');
      });
      const pct=Math.round((correct/total)*100);
      const grade=pct>=90?'Sehr gut':pct>=75?'Gut':pct>=60?'Befriedigend':pct>=50?'Ausreichend':'Nicht bestanden';
      recordExam(correct,total,pct,grade); if(typeof GAME!=='undefined') GAME.cheer('pruefung','Quiz');
      const catBreakdown=[...new Set(_examQs.filter(q=>q.type!=='essay').map(q=>q.cat))].map(cat=>{
        const cq=_examQs.filter(q=>q.cat===cat&&q.type!=='essay');
        const cok=cq.filter(examOk).length;
        const cp=Math.round((cok/cq.length)*100);
        return'<div class="quiz-rcat"><span class="quiz-rcat-name">'+(CAT_LABELS[cat]||esc(cat))+'</span><div class="quiz-rcat-bar"><div class="quiz-rcat-fill'+(cp<60?' qrf-fail':'')+'" style="width:'+cp+'%"></div></div><span class="quiz-rcat-stat">'+cok+'/'+cq.length+'</span></div>';
      }).join('');
      const res=$('quiz-result');
      res.innerHTML='<div class="quiz-result-inner"><div class="quiz-result-title">Ergebnis</div><div class="quiz-result-score">'+correct+' / '+total+'</div><div class="quiz-result-pct '+(pct>=60?'grade-ok':'grade-fail')+'">'+pct+' %</div><div class="quiz-result-grade">'+grade+'</div><div class="quiz-result-bar"><div class="quiz-result-fill" style="width:'+pct+'%"></div></div><div class="quiz-result-cats">'+catBreakdown+'</div><p class="quiz-result-note">'+total+' bewertete Fragen (MC + R/F'+(Q.some(x=>x.type==='multi')?' + Mehrfachauswahl, nur ganz richtig zählt':'')+'). Freitextfragen nicht eingerechnet.<br>Scrolle nach oben, um alle Korrekturen zu sehen.</p><button class="quiz-retry-btn" onclick="'+G+'.setMode(\'exam\')">Nochmal versuchen</button></div>';
      res.classList.remove('hidden');
      $('quiz-exam-footer').classList.add('hidden');
      res.scrollIntoView({behavior:'smooth'});
    }
  };

  return self;
}
const QUIZ=makeQuiz({G:'QUIZ',view:'v-vak-altklausur',sfx:'',minutes:60,
  keys:{bm:'bvi_quiz_bm',mastery:'bvi_quiz_mastery',srs:'bvi_quiz_srs',stats:'bvi_quiz_stats'},
  catLabels:{'Staatsorganisationsrecht':'StaatsorgR','Allgemeines Verwaltungsrecht':'AllgVwR','Verwaltungsvollstreckung / Rechtsschutz':'Vollstr./RS','Beamten- und Disziplinarrecht':'BeamtR','Gefahrenabwehr / Feuerwehrrecht':'GefahrenabwR'},
  Q:[{"id":1,"cat":"Staatsorganisationsrecht","type":"essay","q":"Nennen Sie die Verfassungsorgane, die bei den einzelnen Phasen der Bundesgesetzgebung beteiligt sind oder beteiligt sein können (Gesetzesinitiative, Gesetzesberatung, Gesetzesbeschluss, Länderbeteiligung, Ausfertigung, Verkündung).","ref":"Gesetzesinitiative (Art. 76 I GG): Bundesregierung ✓, Bundesrat ✓, Bundestag ✓\nGesetzesberatung/1. Durchgang: Bundestag ✓, Bundesrat ✓ (Stellungnahme), Bundesregierung ✓\nGesetzesbeschluss (Art. 77 I GG): nur Bundestag ✓\nLänderbeteiligung/2. Durchgang (Art. 77 II ff.): Bundesrat ✓ (Zustimmung/Einspruch, ggf. Vermittlungsausschuss)\nAusfertigung (Art. 82 I GG): Bundespräsident ✓, Bundesregierung ✓ (Gegenzeichnung, Art. 58 GG)\nVerkündung im BGBl. (Art. 82 I GG): Bundespräsident ✓\nDas Bundesverfassungsgericht ist am regulären Gesetzgebungsverfahren nie beteiligt."},{"id":2,"cat":"Staatsorganisationsrecht","type":"essay","q":"Welche Auswirkungen haben Änderungen in den politischen Kräfteverhältnissen in den Landesparlamenten auf der Bundesebene? Erläutern Sie dies für die Wahl des Bundespräsidenten und für Grundgesetzänderungen.","ref":"Bundespräsidentenwahl: Die Bundesversammlung besteht zur Hälfte aus von den Landesparlamenten entsandten Mitgliedern (Art. 54 III GG); Mehrheitsverschiebungen in den Landtagen verschieben die Mehrheitsverhältnisse bei der Präsidentenwahl.\nGrundgesetzänderungen: Erforderlich sind zwei Drittel der Stimmen des Bundesrates (Art. 79 II GG); der Bundesrat besteht aus Mitgliedern der Landesregierungen (Art. 51 GG) – welche Koalitionen dort regieren, hängt von den Landtagswahlen ab."},{"id":3,"cat":"Staatsorganisationsrecht","type":"tf","q":"Grundrechte sind Abwehrrechte der Bürgerinnen und Bürger gegen den Staat.","opts":["Richtig","Falsch"],"correct":0,"exp":"Das ist ihre klassische Funktion gegenüber dem Staat."},{"id":4,"cat":"Staatsorganisationsrecht","type":"tf","q":"Gemeinderäte sind Bestandteile der vollziehenden Gewalt.","opts":["Richtig","Falsch"],"correct":0,"exp":"Trotz parlamentsähnlicher Struktur gehört die kommunale Selbstverwaltung nach Art. 28 II GG organisatorisch zur Exekutive, da es auf kommunaler Ebene keine eigene Gewaltenteilung gibt."},{"id":5,"cat":"Staatsorganisationsrecht","type":"tf","q":"Das Schulrecht fällt in die konkurrierende Gesetzgebungskompetenz des Bundes und der Länder.","opts":["Richtig","Falsch"],"correct":1,"exp":"Schulrecht ist Ländersache (Kulturhoheit der Länder); eine Bundeskompetenz nach Art. 70 ff. GG besteht dafür nicht."},{"id":6,"cat":"Staatsorganisationsrecht","type":"tf","q":"Der Bundeskanzler beziehungsweise die Bundeskanzlerin kann den Deutschen Bundestag auflösen.","opts":["Richtig","Falsch"],"correct":1,"exp":"Auflösen kann nur der Bundespräsident, und nur in den engen Fällen der Art. 63 IV oder Art. 68 GG."},{"id":7,"cat":"Staatsorganisationsrecht","type":"tf","q":"Der Bundeskanzler beziehungsweise die Bundeskanzlerin vertritt im Falle der Verhinderung den Bundespräsidenten.","opts":["Richtig","Falsch"],"correct":1,"exp":"Das übernimmt nach Art. 57 GG der Präsident des Bundesrates."},{"id":8,"cat":"Staatsorganisationsrecht","type":"tf","q":"Bundespräsident Steinmeier kann 2027 wiedergewählt werden.","opts":["Richtig","Falsch"],"correct":1,"exp":"Seine zweite Amtszeit endet am 18. März 2027, eine dritte Amtszeit in Folge schließt Art. 54 II GG aus."},{"id":9,"cat":"Staatsorganisationsrecht","type":"tf","q":"Autos sind vom Schutzbereich des Art. 13 Abs. 1 GG umfasst.","opts":["Richtig","Falsch"],"correct":1,"exp":"Art. 13 GG schützt die Wohnung; Kraftfahrzeuge fallen nach ständiger Rechtsprechung nicht darunter.","note":"Wohnmobile schon, obwohl sie ein KFZ sind. (Wohnwagen auch) – sie sind ein Raum des Rückzuges und der Privatsphäre."},{"id":10,"cat":"Staatsorganisationsrecht","type":"tf","q":"Alle Grundrechte sind im Rahmen der Regelungen des Grundgesetzes einschränkbar.","opts":["Richtig","Falsch"],"correct":1,"exp":"Die Menschenwürde (Art. 1 I GG) ist nach Art. 79 III GG unantastbar; vorbehaltlos gewährleistete Grundrechte wie Art. 4 I GG sind nur durch verfassungsimmanente Schranken einschränkbar."},{"id":11,"cat":"Staatsorganisationsrecht","type":"tf","q":"Die Wahlrechtsgrundsätze lauten Allgemein, Unmittelbar, Frei und Geheim.","opts":["Richtig","Falsch"],"correct":1,"exp":"Art. 38 I 1 GG nennt fünf Grundsätze; es fehlen die Gleichheit der Wahl und die Öffentlichkeit (durch BVerfG aus Art. 38 i.V.m. Art. 20 GG entwickelt)."},{"id":12,"cat":"Staatsorganisationsrecht","type":"tf","q":"Das Grundgesetz wurde am 23.05.1949 verkündet.","opts":["Richtig","Falsch"],"correct":0,"exp":"Verkündet wurde es am 23.05.1949. In Kraft getreten ist es erst am folgenden Tag, dem 24.05.1949."},{"id":13,"cat":"Staatsorganisationsrecht","type":"mc","q":"Was beschreibt das Entschließungsermessen?","opts":["Die Auswahl eines Mittels durch die Behörde","Die Entscheidung, ob die Behörde überhaupt tätig wird","Die Pflicht zur Anhörung des Betroffenen","Die Festlegung von Nebenbestimmungen"],"correct":1,"exp":"Das Entschließungsermessen betrifft nur die Frage, ob die Behörde tätig wird. Welches Mittel sie einsetzt, ist das davon zu unterscheidende Auswahlermessen."},{"id":14,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welches Kriterium gehört nicht zur Verhältnismäßigkeitsprüfung?","opts":["Legitimer Zweck","Geeignetheit","Rechtmäßigkeit","Angemessenheit"],"correct":2,"exp":"Die Prüfung umfasst legitimen Zweck, Geeignetheit, Erforderlichkeit und Angemessenheit. Die Rechtmäßigkeit ist keine eigene Stufe, sondern das Ergebnis der Prüfung."},{"id":15,"cat":"Staatsorganisationsrecht","type":"mc","q":"Woran erkennt man in einer Norm typischerweise Ermessensspielräume?","opts":["An der Verwendung von „muss\"","An der Verwendung von „kann\" oder „darf\"","An der Reihenfolge der Normabsätze","An der Länge des Gesetzestextes"],"correct":1,"exp":"„Kann\" oder „darf\" signalisieren Ermessen; „muss\" oder „ist\" weisen auf eine gebundene Entscheidung hin."},{"id":16,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Aussage zur Konkurrenzgesetzgebung ist korrekt?","opts":["Der Bund darf nur tätig werden, wenn die Länder zustimmen","Die Länder sind zuständig, bis der Bund tätig wird","Der Bund ist immer zuständig","Konkurrenzgesetzgebung betrifft nur das Steuerrecht"],"correct":1,"exp":"Das folgt aus Art. 72 I GG: Die Länder haben die Gesetzgebungsbefugnis, solange und soweit der Bund von seiner Zuständigkeit nicht durch Gesetz Gebrauch gemacht hat."},{"id":17,"cat":"Staatsorganisationsrecht","type":"mc","q":"Was bedeutet das Rechtsstaatsprinzip?","opts":["Es verpflichtet den Staat zu wirtschaftlicher Neutralität","Es garantiert rechtliche Unabhängigkeit","Es verbietet Gewaltenteilung","Es erlaubt Verwaltungshandeln ohne Gesetz"],"correct":1,"exp":"Die richterliche Unabhängigkeit (Art. 97 GG) ist eine anerkannte Ausprägung des Rechtsstaatsprinzips. Es umfasst vor allem die Bindung an Gesetz und Recht, den Vorbehalt des Gesetzes, Rechtssicherheit und Rechtsschutz."},{"id":18,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Aussage beschreibt das Prinzip der Gewaltenteilung im deutschen Grundgesetz zutreffend?","opts":["Die Legislative kontrolliert ausschließlich die Exekutive","Die Gewalten sind strikt getrennt und dürfen nicht zusammenwirken","Die Staatsgewalt ist in Legislative, Exekutive und Judikative gegliedert, mit funktionalen Überschneidungen","Die Judikative entscheidet nur über politische Fragen"],"correct":2,"exp":"Das deutsche Modell kennt keine strikte Trennung, sondern eine Gewaltenverschränkung mit wechselseitigen Kontrollmechanismen."},{"id":19,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche der folgenden Institutionen gehört nicht zu den (ständigen) Verfassungsorganen der Bundesrepublik Deutschland?","opts":["Der Bundesrat","Der Bundespräsident","Das Bundesverfassungsgericht","Die Bundesversammlung"],"correct":3,"exp":"Zu den fünf ständigen Verfassungsorganen zählen Bundestag, Bundesrat, Bundesregierung, Bundespräsident und Bundesverfassungsgericht. Die Bundesversammlung tritt nur bei Bedarf zur Präsidentenwahl zusammen."},{"id":20,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Aussage zur Bundesrat-Mitwirkung im Gesetzgebungsverfahren ist korrekt?","opts":["Der Bundesrat wirkt nur bei Finanzgesetzen mit","Der Bundesrat hat bei Zustimmungsgesetzen ein Vetorecht, das der Bundestag nicht überstimmen kann","Der Bundesrat ist am Gesetzgebungsverfahren nie beteiligt","Der Bundesrat kann nur beratende Stellungnahmen abgeben"],"correct":1,"exp":"Bei Zustimmungsgesetzen kommt das Gesetz ohne Zustimmung des Bundesrates nicht zustande. Das unterscheidet sie von Einspruchsgesetzen, bei denen der Bundestag einen Einspruch zurückweisen kann (Art. 77 IV GG)."},{"id":21,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Aussage zum Wahlgrundsatz der Gleichheit ist zutreffend?","opts":["Jede Stimme hat den gleichen Zähl- und Erfolgswert","Der Erfolgswert darf unterschiedlich sein, solange alle wählen dürfen","Wahlgleichheit gilt nur für Bundestagswahlen","Wahlgleichheit verlangt zwingend Mehrheitswahl"],"correct":0,"exp":"Das folgt aus Art. 38 I 1 GG: Jede Stimme hat denselben Zählwert und denselben Erfolgswert."},{"id":22,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was ist nach § 35 VwVfG ein Verwaltungsakt?","opts":["Eine Rechtsverordnung, die von einer obersten Bundesbehörde erlassen wird","Eine Maßnahme einer Behörde zur Regelung eines Einzelfalls auf dem Gebiet des öffentlichen Rechts mit Außenwirkung","Ein allgemeiner Erlass, der für eine unbestimmte Vielzahl von Fällen gilt","Eine innerdienstliche Anweisung ohne rechtliche Außenwirkung"],"correct":1,"exp":"So die Legaldefinition in § 35 S. 1 VwVfG."},{"id":23,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Welches der folgenden Merkmale muss ein Verwaltungsakt nach § 35 VwVfG erfüllen?","opts":["Er muss schriftlich erlassen sein","Er muss von einem Gericht stammen","Er muss eine Regelung enthalten","Er muss sich auf Zivilrecht beziehen"],"correct":2,"exp":"Der Regelungscharakter ist das zentrale Tatbestandsmerkmal des § 35 VwVfG."},{"id":24,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Welche Aussage trifft im Sinne des § 35 VwVfG am ehesten auf die „Außenwirkung\" eines Verwaltungsaktes zu?","opts":["Der Verwaltungsakt muss für die allgemeine Öffentlichkeit bestimmt sein","Der Verwaltungsakt betrifft ausschließlich interne Verwaltungsabläufe","Der Verwaltungsakt muss gegenüber einer außerhalb der Verwaltung stehenden Person rechtliche Wirkung entfalten","Die Außenwirkung meint, dass der Verwaltungsakt öffentlich bekannt gemacht werden muss"],"correct":2,"exp":"Außenwirkung bedeutet Rechtswirkung gegenüber einer außerhalb der Verwaltung stehenden Person."},{"id":25,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Welche der folgenden Maßnahmen stellt typischerweise keinen Verwaltungsakt im Sinne des § 35 VwVfG dar?","opts":["Eine Baugenehmigung für ein Wohnhaus","Die Versetzung eines Beamten in eine andere Dienststelle","Eine Straßenverkehrsbehörde stellt ein Halteverbotsschild auf","Eine Ministerin kündigt auf einer Pressekonferenz ein neues Gesetzesvorhaben an"],"correct":3,"exp":"Der Ankündigung fehlt die Regelung eines Einzelfalls – sie ist eine politische Aussage ohne unmittelbare Rechtswirkung. Das Halteverbotsschild gilt als Allgemeinverfügung."},{"id":26,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was ist vor dem Erlass eines belastenden Verwaltungsaktes grundsätzlich erforderlich?","opts":["Die Veröffentlichung im Amtsblatt","Die Genehmigung durch das Bundesministerium","Die Anhörung des Betroffenen","Die Zustimmung des Landtages"],"correct":2,"exp":"So § 28 I VwVfG."},{"id":27,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Wann kann auf eine Anhörung vor Erlass eines Verwaltungsaktes verzichtet werden?","opts":["Nie","Nur bei Gefahr im Verzug","Wenn dies durch Verwaltungsvorschriften vorgesehen ist","Wenn § 28 Abs. 2 VwVfG dies zulässt"],"correct":3,"exp":"§ 28 II VwVfG zählt mehrere Fallgruppen auf, etwa Gefahr im Verzug, Allgemeinverfügungen oder Massenverfahren – „nur bei Gefahr im Verzug\" wäre zu eng."},{"id":28,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was gilt, wenn eine erforderliche Anhörung unterblieben ist?","opts":["Der Verwaltungsakt ist automatisch nichtig","Die Anhörung kann nachgeholt werden","Der Verwaltungsakt bleibt dauerhaft unwirksam","Der Verwaltungsakt ist nur in Bayern gültig"],"correct":1,"exp":"Nach § 45 VwVfG ist dieser Verfahrensfehler heilbar."},{"id":29,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Welche Aussage ist richtig?","opts":["Jeder Verwaltungsakt muss durch die Polizei vollzogen werden","Verwaltungsakte werden durch das Grundgesetz definiert","Allgemeinverfügungen richten sich an eine unbestimmte Vielzahl von Personen","Ein Verwaltungsakt muss immer durch den Bundesrat bestätigt werden"],"correct":2,"exp":"So die Definition der Allgemeinverfügung in § 35 S. 2 VwVfG."},{"id":30,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Wann wird ein Verwaltungsakt wirksam?","opts":["Bei Unterschrift durch den Behördenleiter","Bei Veröffentlichung im Gesetzblatt","Mit seiner Bekanntgabe","Nach Zustimmung der betroffenen Person"],"correct":2,"exp":"So §§ 41, 43 VwVfG."},{"id":31,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was ist eine Nebenbestimmung im Verwaltungsakt?","opts":["Ein unwesentlicher Zusatz ohne rechtliche Wirkung","Eine Regelung, die den Verwaltungsakt inhaltlich oder zeitlich einschränkt","Eine interne Dienstanweisung","Eine mündliche Erläuterung für den Bürger"],"correct":1,"exp":"So § 36 VwVfG."},{"id":32,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was ist eine Bedingung im Sinne des § 36 VwVfG?","opts":["Eine sofort wirksame Einschränkung","Von einem künftigen ungewissen Ereignis abhängige Regelung","Eine interne Absprache","Eine Obliegenheit"],"correct":1,"exp":"Eine Bedingung macht den Eintritt oder Wegfall einer Vergünstigung oder Belastung vom ungewissen Eintritt eines künftigen Ereignisses abhängig (§ 36 II Nr. 2 VwVfG)."},{"id":33,"cat":"Allgemeines Verwaltungsrecht","type":"essay","q":"Was ist eine Auflage gemäß § 36 VwVfG? Erläutern Sie den Unterschied zur Bedingung.","ref":"Eine Auflage (§ 36 II Nr. 4 VwVfG) verpflichtet die begünstigte Person zu einem zusätzlichen Tun, Dulden oder Unterlassen, ohne dass die Wirksamkeit des Verwaltungsakts selbst davon abhängt.\nUnterschied zur Bedingung: Bei der Bedingung steht die Wirksamkeit des Hauptverwaltungsakts infrage (er tritt erst ein oder entfällt bei Bedingungseintritt). Bei der Auflage bleibt der Hauptverwaltungsakt voll wirksam; die Auflage kann eigenständig durchgesetzt werden."},{"id":34,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was ist ein Realakt?","opts":["Hoheitliche Aufgabe","Gesetz","Verwaltungsakt","Vertrag"],"correct":0,"exp":"In der Altklausur passt von den vier Optionen „Hoheitliche Aufgabe“ am ehesten: Ein Realakt ist schlichtes (tatsächliches) Verwaltungshandeln in Erfüllung öffentlicher Aufgaben ohne Regelungswirkung – z. B. Auskunft, Warnung, Straßenreinigung oder das Absperren einer Unfallstelle. Ein Verwaltungsakt regelt dagegen einen Einzelfall mit Außenwirkung (§ 35 VwVfG); Gesetz und Vertrag sind andere Handlungsformen."},{"id":35,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was sind Ampel- und Handzeichen der Polizei nach der Rechtsprechung?","opts":["Gesetz","Realakt","Allgemeinverfügung","Verordnung"],"correct":2,"exp":"Die Rechtsprechung behandelt Ampelzeichen als Verwaltungsakte in Form von Allgemeinverfügungen, gerichtet an die jeweils anwesenden Verkehrsteilnehmer. Gleiches gilt für Zeichen von Polizeibeamten nach § 36 StVO."},{"id":36,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Welche Zwangsmittel kennt das Verwaltungsvollstreckungsrecht typischerweise?","opts":["Bußgeld, Freiheitsentzug, Enteignung","Zwangsgeld, Ersatzvornahme, unmittelbarer Zwang","Ordnungsstrafe, Hausverbot, Verwarnung","Verwarnungsgeld, Bußgeld, Verhaftung"],"correct":1,"exp":"Nach dem Bundes-VwVG: Ersatzvornahme (§ 10), Zwangsgeld (§ 11), unmittelbarer Zwang (§ 12), zusammengefasst in § 9 VwVG."},{"id":37,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Was ist der wesentliche Unterschied zwischen Verwaltungsvollstreckung und Sofortvollzug?","opts":["Es gibt keinen Unterschied","Der Sofortvollzug kann ohne vorherigen Verwaltungsakt erfolgen","Die Verwaltungsvollstreckung ist nur für Steuerschulden möglich","Der Sofortvollzug darf nur bei Notstand angewendet werden"],"correct":1,"exp":"§ 6 II VwVG: Der Sofortvollzug ist zulässig, wenn die vorherige Bekanntgabe eines Verwaltungsakts den Zweck der Maßnahme vereiteln würde."},{"id":38,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Was muss vor dem Einsatz von Zwangsmitteln vorliegen?","opts":["Eine richterliche Genehmigung","Ein Gesetz zur Anordnung","Ein wirksamer Verwaltungsakt, der nicht befolgt wird","Eine Anzeige durch Dritte"],"correct":2,"exp":"So § 6 I VwVG des Bundes beziehungsweise § 55 I VwVG NRW."},{"id":39,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Welche Wirkung hat ein Widerspruch gegen einen belastenden Verwaltungsakt?","opts":["Keine","Er verzögert die Zustellung","Er hat aufschiebende Wirkung","Er macht den Verwaltungsakt nichtig"],"correct":2,"exp":"So § 80 I VwGO."},{"id":40,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Was muss die Behörde tun, wenn sie trotz Widerspruchs sofort vollziehen will?","opts":["Klage beim Verwaltungsgericht erheben","Eine Anhörung durchführen","Sofortige Vollziehung anordnen und begründen","Den Verwaltungsakt zurücknehmen"],"correct":2,"exp":"So § 80 II Nr. 4, § 80 III VwGO."},{"id":41,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Wie kann sich der Adressat gegen die Anordnung der sofortigen Vollziehung wehren?","opts":["Mit Dienstaufsichtsbeschwerde","Mit Gegenvorstellung bei der Behörde","Mit Eilantrag beim Verwaltungsgericht","Mit Antrag beim Bundesverfassungsgericht"],"correct":2,"exp":"So § 80 V VwGO."},{"id":42,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Was regelt § 34 BeamtStG?","opts":["Dienstunfall","Pflicht zum vollen persönlichen Einsatz","Wahlrecht","Nebentätigkeiten"],"correct":1,"exp":"Beamtinnen und Beamte haben sich mit vollem persönlichem Einsatz ihrem Beruf zu widmen und ihr Verhalten muss der Achtung und dem Vertrauen gerecht werden, die ihr Beruf erfordert."},{"id":43,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Welches Beamtenverhältnis gibt es nicht?","opts":["Beamter auf Probe","Beamter auf Widerruf","Beamter auf Lebenszeit","Beamter auf Abruf"],"correct":3,"exp":"Nach § 4 BeamtStG gibt es Beamte auf Lebenszeit, auf Probe, auf Widerruf und auf Zeit. Einen „Beamten auf Abruf\" kennt das Beamtenrecht nicht."},{"id":44,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Was ist die Voraussetzung für die Berufung in das Beamtenverhältnis?","opts":["10 Jahre Berufserfahrung","Deutsche oder EU-Staatsangehörigkeit","Privatrechtlicher Vertrag","Kirchenzugehörigkeit"],"correct":1,"exp":"Diese materielle Voraussetzung steht in § 7 BeamtStG. § 8 BeamtStG regelt die Ernennung als formalen Akt."},{"id":45,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Welcher Zweck gehört nicht zu den klassischen Zielen des Disziplinarrechts?","opts":["Erziehungszweck","Schutzfunktion","Privatisierung der Ermittlungen","Reinigungsfunktion"],"correct":2,"exp":"Das Disziplinarverfahren ist und bleibt ein hoheitliches, staatliches Verfahren. Erziehungszweck, Schutzfunktion und Reinigungsfunktion sind anerkannte Zwecke."},{"id":46,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Was ist der Zweck des Disziplinarrechts?","opts":["Bestrafung","Erziehung und Funktionssicherung","Politische Kontrolle","Gehaltskürzungen maximieren"],"correct":1,"exp":"Das Disziplinarrecht dient der Erziehung (Wiedereingliederung) und der Funktionssicherung des Berufsbeamtentums, nicht der Bestrafung im strafrechtlichen Sinne."},{"id":47,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Wann muss ein Disziplinarverfahren eingeleitet werden?","opts":["Sobald der Personalrat zustimmt","Wenn eine anonyme Beschwerde eingeht","Bei zureichenden tatsächlichen Anhaltspunkten für ein Dienstvergehen","Wenn ein Strafbefehl rechtskräftig ist"],"correct":2,"exp":"Es gilt das Legalitätsprinzip – dem Dienstvorgesetzten steht kein Ermessen zu, ob er tätig wird, nur wie er das Verfahren führt."},{"id":48,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Was versteht man unter einem „Dienstvergehen\"?","opts":["Jegliches Verhalten außerhalb der Dienstzeit","Eine schuldhafte Verletzung dienstlicher Pflichten","Jede Form von Kritik an Vorgesetzten","Ein Verwaltungsverstoß nach dem Ordnungsrecht"],"correct":1,"exp":"So die Definition in § 47 BeamtStG."},{"id":49,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Was gehört nicht zu den Dienstpflichten?","opts":["Pflicht zur wöchentlichen Fortbildung","Neutralitätsgebot","Folgepflicht","Verschwiegenheitspflicht"],"correct":0,"exp":"Neutralitätsgebot, Folgepflicht und Verschwiegenheitspflicht sind ausdrücklich normiert (§§ 33, 35, 37 BeamtStG). Eine eigenständige, gesetzlich fixierte Pflicht zur wöchentlichen Fortbildung gibt es dagegen nicht."},{"id":50,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Eine Trunkenheitsfahrt in der Freizeit führt zu einem Disziplinarverfahren.","opts":["Richtig","Falsch"],"correct":1,"exp":"Rein außerdienstliches Verhalten ist nur dann relevant, wenn es in besonderem Maß geeignet ist, Achtung und Vertrauen in einer für das Amt bedeutsamen Weise zu beeinträchtigen (§ 34 S. 3 BeamtStG)."},{"id":51,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Das statusrechtliche Amt bezieht sich auf die tatsächlich wahrgenommenen Aufgaben.","opts":["Richtig","Falsch"],"correct":1,"exp":"Das statusrechtliche Amt meint die abstrakte Rechtsstellung (Laufbahn, Besoldungsgruppe, Amtsbezeichnung), nicht die konkret ausgeübte Tätigkeit – das wäre das Amt im konkret-funktionellen Sinn."},{"id":52,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Für eine Ernennung zum 10.01.2025 kann die Urkunde bis zum Ende des Monats überreicht werden.","opts":["Richtig","Falsch"],"correct":1,"exp":"Eine Ernennung auf einen zurückliegenden Zeitpunkt ist unzulässig und unwirksam (§ 8 IV BeamtStG). Wirksam wird sie erst mit tatsächlicher Aushändigung der Urkunde."},{"id":53,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Der Dienstherr muss bei Vorliegen tatsächlicher Anhaltspunkte über ein Dienstvergehen ein Disziplinarverfahren einleiten.","opts":["Richtig","Falsch"],"correct":0,"exp":"Legalitätsprinzip, kein Einleitungsermessen."},{"id":54,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Leistung und Persönlichkeitsbild des Beamten oder der Beamtin sind alleiniger Grund für die Bemessung der Disziplinarmaßnahme.","opts":["Richtig","Falsch"],"correct":1,"exp":"Ausgangspunkt ist die Schwere des Dienstvergehens; Persönlichkeitsbild und bisherige Führung fließen nur ergänzend ein."},{"id":55,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Die dienstliche Beurteilung ist das Hauptauswahlkriterium bei der Beförderung.","opts":["Richtig","Falsch"],"correct":0,"exp":"Im Rahmen der Bestenauslese nach Art. 33 II GG ist sie regelmäßig das zentrale Erkenntnismittel für Eignung, Befähigung und fachliche Leistung."},{"id":56,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Maßgebliche Kriterien bei einer Ernennung von Beamten sind Eignung, Leistung, Befähigung und der Wohnsitz im Gebiet des jeweiligen Dienstherrn.","opts":["Richtig","Falsch"],"correct":1,"exp":"Art. 33 II GG nennt Eignung, Befähigung und fachliche Leistung; ein Wohnsitzerfordernis gehört nicht dazu."},{"id":57,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Bei Bekanntwerden eines Dienstvergehens steht dem Dienstvorgesetzten Ermessen zu, ob ein Disziplinarverfahren eingeleitet wird oder nicht.","opts":["Richtig","Falsch"],"correct":1,"exp":"Legalitätsprinzip – kein Einleitungsermessen."},{"id":58,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Das Disziplinarrecht ist abschließend durch das Bundesdisziplinargesetz geregelt.","opts":["Richtig","Falsch"],"correct":1,"exp":"Das Bundesdisziplinargesetz gilt nur für Bundesbeamte; für Landes- und Kommunalbeamte gilt das jeweilige Landesdisziplinargesetz."},{"id":59,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Die Entfernung aus dem Beamtenverhältnis aufgrund von Verfehlungen muss im Rahmen einer Disziplinarklage vor dem Verwaltungsgericht erwirkt werden.","opts":["Richtig","Falsch"],"correct":0,"exp":"Diese schwerste Disziplinarmaßnahme kann die Behörde nicht selbst verfügen, sondern nur gerichtlich durchsetzen."},{"id":60,"cat":"Beamten- und Disziplinarrecht","type":"essay","q":"Was ist nach einer strafrechtlichen Verurteilung disziplinarisch nicht zulässig? (Die Antwortoptionen fehlen im Original-Protokoll.)","ref":"Einschlägig ist die Bindungswirkung strafgerichtlicher Feststellungen: Die Disziplinarbehörde bzw. das Disziplinargericht ist an die tatsächlichen Feststellungen eines rechtskräftigen Strafurteils grundsätzlich gebunden und darf davon nur unter engen Voraussetzungen abweichen (z. B. bei offenkundiger Unrichtigkeit).\nNicht zulässig ist es daher in aller Regel, eigene, den strafgerichtlichen Feststellungen widersprechende Tatsachenfeststellungen zu treffen."},{"id":61,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Gegen welche drei „Personengruppen\" können sich Maßnahmen der Gefahrenabwehr richten?","ref":"1. Verhaltensstörer (Handlungsstörer): verursacht die Gefahr durch eigenes Verhalten.\n2. Zustandsstörer: hat die tatsächliche Gewalt über eine gefahrverursachende Sache oder ist deren Eigentümer.\n3. Nichtstörer (Notstandspflichtiger): nicht verantwortliche Dritte – nur unter engen Voraussetzungen bei gegenwärtiger erheblicher Gefahr zulässig."},{"id":62,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Erklären Sie den Unterschied zwischen einer konkreten Gefahr und einer Anscheinsgefahr. Was ist bei der Anscheinsgefahr besonders zu beachten?","ref":"Konkrete Gefahr: Bei ungehindertem Ablauf des objektiv zu erwartenden Geschehens ist mit hinreichender Wahrscheinlichkeit in absehbarer Zeit ein Schaden zu erwarten.\nAnscheinsgefahr: Nachträglich stellt sich heraus, dass keine Gefahr bestand – maßgeblich ist die Sicht im Zeitpunkt des Handelns (ex-ante-Betrachtung). Durfte eine besonnene Einsatzkraft von einer Gefahr ausgehen, war das Einschreiten rechtmäßig. Sobald der Irrtum erkannt wird, sind alle Maßnahmen unverzüglich einzustellen.\nBesonders zu beachten: Die Kostenfrage – wer trägt die Kosten einer sich als unbegründet herausstellenden Maßnahme?"},{"id":63,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Welche Aufgabe ergibt sich aus § 1 Abs. 1 Nr. 1 BHKG?","ref":"§ 1 Abs. 1 Nr. 1 BHKG definiert das Ziel des Gesetzes im Bereich Brandschutz: vorbeugende und abwehrende Maßnahmen bei Brandgefahren zum Schutz der Bevölkerung. Die Norm begründet die gesetzliche Grundlage für den vorbeugenden und abwehrenden Brandschutz als Pflichtaufgabe der Gemeinden."},{"id":64,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"mc","q":"Was ist ein Unglücksfall im Sinne des BHKG?","opts":["Langsamer Vorgang","Plötzliches Ereignis mit erheblicher Gefahr","Nur Explosionen","Nur Brände"],"correct":1,"exp":"Ein Unglücksfall ist ein plötzliches Ereignis, von dem eine erhebliche Gefahr für Menschen, Tiere, Sachen oder die Umwelt ausgeht."},{"id":65,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Fall: Schornsteinbrand im Hinterhaus. Alarmierung zu einem Schornsteinbrand in einem Altbau, 3 OG. Der Einsatzleiter ordnet an, alle am Schornstein gelegenen Wohnungen auf Brandausbreitung zu kontrollieren. Im 3. OG lässt ein pensionierter Feuerwehrmann weder die Nachbarwohnung noch seine eigene Wohnung kontrollieren.\n\na) Dürfen Sie als Einsatzleiter die verschlossene Nachbarwohnung gewaltsam öffnen? Was ist zu beachten?\nb) Dürfen Sie die Wohnung gegen den Willen des Mieters betreten?\nc) Was beachten Sie beim Verlassen der Einsatzstelle?","ref":"a) Ja, gestützt auf § 41 BHKG NRW i. V. m. Art. 13 VII GG. Bei möglicher Rauch-/Brandausbreitung liegt zumindest eine Anscheinsgefahr vor. Zu beachten: Verhältnismäßigkeit – wenn zeitlich möglich, zunächst Schlüsseldienst; bei Gefahr im Verzug sofortiges gewaltsames Öffnen zulässig.\nb) Ja. Der widersprechende Mieter ist nicht Inhaber der zu kontrollierenden Nachbarwohnung und kann über deren Betretung nicht wirksam entscheiden. Sein Widerspruch ist rechtlich unbeachtlich.\nc) Geöffnete Wohnung sichern/wiederverschließen; Bewohner und Eigentümer informieren; Vorgang und Gründe dokumentieren; sicherstellen, dass keine Glutnester zurückbleiben."},{"id":66,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Fall: Rauchmelder piept im 2. OG, Nachbarn alarmieren die Feuerwehr. Die Feuerwehr bricht die Tür auf – in der Wohnung kein Rauch, Melder hatte technischen Defekt. Der Mieter fordert Ersatz für die Tür. War die Türöffnung rechtmäßig?","ref":"Ja. Maßgeblich ist die Anscheinsgefahr: Beim Alarm eines Rauchmelders, auf den niemand reagiert, durfte die Feuerwehr ex-ante von einer konkreten Gefahr ausgehen (§ 41 BHKG NRW i. V. m. Art. 13 VII GG). Der nachträglich festgestellte technische Defekt ändert an der Rechtmäßigkeit nichts.\nEin Schadensersatzanspruch scheidet bei rechtmäßiger Maßnahme in der Regel aus; ein etwaiger Ausgleich richtet sich nach den landesrechtlichen Kostenerstattungsregelungen."},{"id":67,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Fall: Es brennt im Keller eines Mehrfamilienhauses. Ein Trupp soll wegen der Rauchausbreitung die angrenzenden Kellerräume kontrollieren. Der Eigentümer verbietet den Zutritt zu einem vermieteten Kellerraum, weil der Mieter das Betreten nicht erlauben würde. Dürfen Sie den Kellerraum öffnen?","ref":"Ja. Bei einem Kellerbrand mit Rauchausbreitungsgefahr besteht eine konkrete Gefahr, die die Kontrolle aller betroffenen Kellerräume rechtfertigt, unabhängig davon, ob sie vermietet sind. Weder Eigentümer noch Mieter können der Gefahrenabwehr ein wirksames Zutrittsverbot entgegensetzen (§ 41 BHKG NRW).\nVorgehen: Raum verhältnismäßig, notfalls gewaltsam öffnen, kontrollieren, anschließend sichern und Eigentümer sowie Mieter informieren."},{"id":68,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was regelt das Entschließungsermessen einer Behörde?","opts":["Das „Ob\" des behördlichen Handelns – ob die Behörde tätig wird","Das „Wie\" – die Art und Weise der Maßnahme","Die Auswahl zwischen mehreren Adressaten","Den Zeitpunkt des behördlichen Eingreifens"],"correct":0,"exp":"Das Entschließungsermessen (§ 40 VwVfG) betrifft das „Ob\" – ob die Behörde bei Vorliegen aller Voraussetzungen tätig wird oder untätig bleibt. Das „Wie\" regelt das Auswahlermessen."},{"id":69,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was regelt das Auswahlermessen einer Behörde?","opts":["Das „Ob\" des behördlichen Handelns","Das „Wie\" – die Auswahl der passenden Maßnahme oder Person","Die Zuständigkeit der Behörde","Ob überhaupt ein Verwaltungsakt erlassen werden darf"],"correct":1,"exp":"Das Auswahlermessen (§ 40 VwVfG) betrifft das „Wie\" – bei mehreren erlaubten Maßnahmen oder Adressaten wählt die Behörde die passende Reaktion aus."},{"id":70,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was versteht man unter einer Ermessensreduzierung auf Null?","opts":["Die Behörde hat kein Ermessen und muss untätig bleiben","Aufgrund besonderer Umstände ist nur noch eine einzige rechtmäßige Entscheidung möglich","Die Behörde kann frei zwischen allen Maßnahmen wählen","Das Ermessen wird auf eine übergeordnete Behörde übertragen"],"correct":1,"exp":"Bei der Ermessensreduzierung auf Null schrumpft der gesetzliche Spielraum der Behörde so stark, dass nur noch eine rechtmäßige Entscheidung verbleibt. Jede andere Handlung wäre rechtswidrig (gebundene Entscheidung)."},{"id":71,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"tf","q":"Bei einer Anscheinsgefahr muss die Feuerwehr ihre Maßnahmen sofort einstellen, sobald sich herausstellt, dass keine konkrete Gefahr vorliegt.","opts":["Richtig","Falsch"],"correct":0,"exp":"Richtig. Ergibt die Erkundung, dass keine konkrete Gefahr besteht, handelt es sich um eine Anscheinsgefahr – alle Maßnahmen sind unverzüglich einzustellen."},{"id":72,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"mc","q":"Wann liegt eine konkrete Gefahr vor?","opts":["Wenn Anhaltspunkte für eine mögliche Gefahr bestehen","Wenn bei ungehindertem Ablauf in absehbarer Zeit mit hinreichender Wahrscheinlichkeit ein Schaden droht","Wenn bereits ein Schaden eingetreten ist","Wenn ein Bürger eine Gefahr gemeldet hat"],"correct":1,"exp":"Eine konkrete Gefahr liegt vor, wenn bei ungehindertem Ablauf des objektiv zu erwartenden Geschehens mit hinreichender Wahrscheinlichkeit in absehbarer Zeit ein Schaden zu erwarten ist."},{"id":73,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Welche Anforderung stellt § 37 VwVfG an den Tenor (Verfügungssatz) eines Verwaltungsaktes?","opts":["Er muss schriftlich und handschriftlich unterschrieben sein","Er muss hinreichend bestimmt sein","Er muss stets eine Rechtsmittelbelehrung enthalten","Er darf keine Bedingungen oder Auflagen enthalten"],"correct":1,"exp":"§ 37 VwVfG verlangt, dass der Tenor eines VA hinreichend bestimmt ist – er muss klar und vollziehbar beschreiben, was die Behörde vom Bürger verlangt."},{"id":74,"cat":"Allgemeines Verwaltungsrecht","type":"tf","q":"Die Begründung eines Verwaltungsaktes darf allgemeine Floskeln enthalten, wenn der Tenor eindeutig ist (§ 39 VwVfG).","opts":["Richtig","Falsch"],"correct":1,"exp":"Falsch. § 39 VwVfG verlangt eine konkrete Begründung: Sie muss an bestimmte Anhaltspunkte geknüpft sein, darf nicht floskelhaft sein und muss die tragenden rechtlichen Gründe aufführen."},{"id":75,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Welche Zwangsmittel nennt § 9 Abs. 1 VwVG zur Durchsetzung eines Verwaltungsaktes?","opts":["Bußgeld, Strafanzeige, Zwangshaft","Zwangsgeld, Ersatzvornahme, unmittelbarer Zwang","Ordnungsgeld, Einspruch, Vollziehung","Bußgeld, Ersatzvornahme, Freiheitsstrafe"],"correct":1,"exp":"§ 9 Abs. 1 VwVG nennt abschließend drei Zwangsmittel: Zwangsgeld, Ersatzvornahme und unmittelbarer Zwang."},{"id":76,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Wie kann ein VA trotz eingelegten Widerspruchs vollzogen werden?","opts":["Gar nicht – der Widerspruch hat immer unüberwindliche aufschiebende Wirkung","Durch Anordnung des sofortigen Vollzugs mit schriftlicher Begründung nach § 80 Abs. 2 Nr. 4 VwGO","Durch eine einfache mündliche Anweisung des Vorgesetzten","Durch Verwirkung des Widerspruchsrechts nach drei Tagen"],"correct":1,"exp":"§ 80 Abs. 2 Nr. 4 VwGO ermöglicht die Anordnung des sofortigen Vollzugs. Sie muss schriftlich erfolgen und besonders begründet werden, damit die aufschiebende Wirkung des Widerspruchs entfällt."},{"id":77,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Arten der Gesetzgebungskompetenz unterscheidet das Grundgesetz?","opts":["Primäre und sekundäre Gesetzgebung","Ausschließliche Bundeskompetenz (§ 71 GG), konkurrierende Gesetzgebung (§ 72 GG) und Länderzuständigkeit (§ 70 GG)","Föderale und zentralistische Gesetzgebung","Formelle und materielle Gesetzgebung"],"correct":1,"exp":"Das GG unterscheidet: ausschließliche Gesetzgebungskompetenz des Bundes (§ 71 GG), konkurrierende Gesetzgebung (§ 72 GG) und den Bereich, in dem die Länder die Gesetzgebungszuständigkeit haben (§ 70 GG, Auffangzuständigkeit)."},{"id":78,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Eine Ernennung mit rückwirkendem Datum ist nach § 8 BeamtStG zulässig.","opts":["Richtig","Falsch"],"correct":1,"exp":"Falsch. § 8 Abs. 4 BeamtStG verbietet Ernennungen mit rückwirkender Kraft ausdrücklich. Die Ernennung wird nach § 8 Abs. 2 BeamtStG erst mit Aushändigung der Ernennungsurkunde wirksam."},{"id":79,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Ein Beamter trägt bei einer privaten politischen Veranstaltung seine Dienstuniform ohne vorherige Abstimmung. Welche Rechtsgrundlagen sind für die Prüfung eines Dienstvergehens einschlägig?","opts":["§ 33 Abs. 2 BeamtStG (Mäßigungsgebot) i.V.m. § 47 Abs. 1 BeamtStG (Dienstvergehen)","§ 12 BeamtStG (Eidesleistung)","§ 60 BeamtStG (Streikverbot)","§ 42 BeamtStG (Nebentätigkeit)"],"correct":0,"exp":"§ 33 Abs. 2 BeamtStG verpflichtet Beamte zur Mäßigung und Zurückhaltung – das Tragen der Dienstuniform bei politischen Veranstaltungen verletzt diese Pflicht. § 47 Abs. 1 BeamtStG definiert die schuldhafte Verletzung von Dienstpflichten als Dienstvergehen."},{"id":80,"cat":"Staatsorganisationsrecht","type":"mc","q":"Wer hat nach Art. 76 Abs. 1 GG das Recht der Gesetzesinitiative?","opts":["Bundestag, Bundesrat und Bundesregierung","Nur Bundestag und Bundesrat","Bundestag, Bundesrat, Bundesregierung und Bundespräsident","Bundestag und Bundesverfassungsgericht"],"correct":0,"exp":"Das Initiativrecht steht nach Art. 76 I GG dem Bundestag (aus seiner Mitte), dem Bundesrat und der Bundesregierung zu. Der Bundespräsident und das BVerfG haben kein Initiativrecht."},{"id":81,"cat":"Staatsorganisationsrecht","type":"tf","q":"Das Bundesverfassungsgericht ist am regulären Gesetzgebungsverfahren des Bundes beteiligt.","opts":["Richtig","Falsch"],"correct":1,"exp":"Das BVerfG ist am regulären Verfahren nicht beteiligt. Es prüft Bundesgesetze erst nachträglich auf Antrag – z. B. im Wege der abstrakten oder konkreten Normenkontrolle."},{"id":82,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welches Organ fasst den Gesetzesbeschluss (Art. 77 Abs. 1 GG) allein?","opts":["Bundestag und Bundesrat gemeinsam","Nur der Bundestag","Nur der Bundesrat","Bundestag und Bundesregierung gemeinsam"],"correct":1,"exp":"Nach Art. 77 I GG beschließt allein der Bundestag die Bundesgesetze. Der Bundesrat ist in dieser Phase nicht beteiligt – er kommt erst im 2. Durchgang (Art. 77 II ff. GG)."},{"id":83,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Möglichkeiten hat der Bundesrat im zweiten Durchgang (Art. 77 Abs. 2 ff. GG)?","opts":["Er kann das Gesetz endgültig und unüberwindlich ablehnen","Er kann zustimmen, Einspruch einlegen oder den Vermittlungsausschuss anrufen","Er hat in dieser Phase keine Mitwirkungsrechte","Er leitet das Gesetz zur Prüfung an das BVerfG weiter"],"correct":1,"exp":"Im 2. Durchgang kann der Bundesrat zustimmen, Einspruch einlegen oder den Vermittlungsausschuss anrufen (Art. 77 II ff. GG). Ein absolutes Veto hat er nur bei Zustimmungsgesetzen; bei Einspruchsgesetzen kann der Bundestag den Einspruch überstimmen."},{"id":84,"cat":"Staatsorganisationsrecht","type":"mc","q":"Wer fertigt ein Bundesgesetz nach Art. 82 Abs. 1 GG aus und verkündet es?","opts":["Der Bundestag","Der Bundesrat","Der Bundespräsident – mit Gegenzeichnung durch die Bundesregierung (Art. 58 GG)","Das Bundesverfassungsgericht"],"correct":2,"exp":"Nach Art. 82 I GG fertigt der Bundespräsident die Bundesgesetze aus und verkündet sie im Bundesgesetzblatt. Die Gegenzeichnung nach Art. 58 GG durch den zuständigen Bundesminister ist Voraussetzung für die Wirksamkeit."}]});
const IDFQ=makeQuiz({G:'IDFQ',view:'v-idf-altklausur',sfx:'-idf',minutes:45,html:true,examCount:25,topCats:true,
  keys:{bm:'bvi_idfq_bm',mastery:'bvi_idfq_mastery',srs:'bvi_idfq_srs',stats:'bvi_idfq_stats',cat:'bvi_idfq_cat'},
  catLabels:{'Vorbeugender Brandschutz':'Vorb. Brandschutz','Stabsarbeit':'Stabsarbeit'},
  Q:typeof IDF_QUIZ_Q!=='undefined'?IDF_QUIZ_Q:[]});

/* ══════════════════════════════════════════════════════════════
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═ */
const KF_QUIZ = (function(){
  const KEY = 'bvi_kf_scores';
  let _step=0, _revealed=false, _shortRevealed=false;
  let _scores={};

  const QUESTIONS = [
    {id:13,nr:'Frage 1',punkte:5,cat:'Haushalt',
     text:'Auf welche Besonderheiten und Konsequenzen des Haushaltswesens muss sich jede Führungskraft der Feuerwehr einstellen?',
     answer:'<strong>1. Der lange Weg zum Haushalt</strong><br>Bedarfsanmeldungen → Parlamentsberatung → Genehmigung der Aufsichtsbehörde → Veröffentlichung. Gesamtdauer: bis zu <strong>18 Monate</strong>.<br><br><strong>2. Konsequenzen</strong><br>→ Zwingend <strong>langfristige, strategische Planung</strong> (Investitionsprogramm, mehrjährige Vorausschau).<br>→ Haushalt gilt nur für <strong>ein Jahr</strong> — Änderungen nur durch das Parlament; keine Eigenentscheidung der Feuerwehr.<br>→ Bedarfsanmeldungen müssen <strong>rechtzeitig und fachlich begründet</strong> eingereicht werden.<br><br><strong>3. Feuerwehrspezifische Konflikte</strong><br>→ Gebot des <strong>schnellen Handelns</strong> steht im Widerspruch zum langsamen Verwaltungsdenken.<br>→ Sicherstellungsauftrag erfordert <strong>Flexibilität im Haushaltsvollzug</strong>.<br>→ Beschaffungen verlangen <strong>strategischen Weitblick</strong> (Nutzungsdauer, Ersatzteilversorgung, technische Reserve).<br><br><strong>4. Vergaberecht</strong><br>→ <strong>Keine Vergabe ohne bereitstehende Haushaltsmittel</strong> — Verstöße begründen Rechtsrisiken.<br>→ Gegenmittel: Rahmenverträge, technische Reserve, langfristige Planung.<br><br><strong>5. Steuerungsauftrag</strong><br>→ Führungskraft gibt der Politik <strong>Handlungsfelder und Strukturen vor</strong>.<br>→ Steuerung auf zwei Ebenen: strategisch (Haushalt) und operativ (KLR, Controlling).',
     short:'<strong>5 Besonderheiten &amp; Konsequenzen:</strong><br>① <strong>Langer Weg</strong> – Anmeldung → Parlament → Aufsichtsbehörde = bis <strong>18 Monate</strong> → langfristige Planung zwingend.<br>② <strong>Konsequenzen</strong> – Haushalt gilt <strong>1 Jahr</strong>; Änderung nur durch Parlament; rechtzeitige, begründete Bedarfsanmeldung.<br>③ <strong>FW-Konflikte</strong> – schnelles Handeln vs. Verwaltungsdenken; Sicherstellungsauftrag erfordert Flexibilität.<br>④ <strong>Vergaberecht</strong> – keine Vergabe ohne Haushaltsmittel → Rahmenverträge, techn. Reserve, Vorausplanung.<br>⑤ <strong>Steuerungsauftrag</strong> – FW gibt Politik Strukturen vor; strategisch (Haushalt) + operativ (KLR).'},
    {id:1,nr:'Frage 2',punkte:5,cat:'Haushalt',
     text:'Welche Ausgaben dürfen geleistet werden, solange der Haushalt noch nicht rechtskräftig ist? Wo liegen die Grenzen? (Thema: vorläufige Haushaltsführung)',
     answer:'Die <strong>vorläufige Haushaltführung</strong> gilt, solange kein rechtskräftiger Haushalt beschlossen ist.<br><br><strong>Zulässig für die Feuerwehr (F 24):</strong><br>① Ausgaben, zu denen die FW <strong>rechtlich verpflichtet</strong> ist: Löhne, Verträge, Brandschutz/Rettungsdienst im Rahmen der Bedarfspläne.<br>② Ausgaben zur <strong>Aufrechterhaltung des Dienstbetriebes</strong>: Kraftstoff, Büromaterial, laufender Unterhalt.<br><br><strong>Zulässig allgemein (F 25):</strong><br>③ Ausgaben zur <strong>Vermeidung von Folgeschäden</strong> oder höheren Folgekosten.<br>④ <strong>Fortführung begonnener Investitionen.</strong><br>⑤ Einnahmen in beliebiger Höhe erzielen.<br>→ Fazit: Faktisch <strong>keine Einschränkungen für den laufenden Dienstbetrieb.</strong><br><br><strong>Nicht zulässig (F 26):</strong><br>① Ausgaben außerhalb der oben genannten Kategorien.<br>② <strong>Beginn neuer, im Umfang erheblicher Investitionsmaßnahmen.</strong><br>③ <strong>Besetzung neuer Stellen</strong> aus noch nicht rechtskräftigem Stellenplan.',
     short:'<strong>Vorläufige Haushaltsführung</strong> = kein rechtskräftiger Haushalt.<br><br><strong>✓ Zulässig:</strong> Pflichtausgaben (Löhne, Verträge), laufender Betrieb (Kraftstoff, Material), Schadensabwehr, begonnene Investitionen, Einnahmen unbegrenzt.<br><br><strong>✗ Nicht zulässig:</strong> Neue erhebliche Investitionen; neue Stellen besetzen.<br>→ Laufender FW-Betrieb faktisch <strong>unbeschränkt.</strong>'},
    {id:2,nr:'Frage 3',punkte:5,cat:'BSC / QM',
     text:'A) Nennen Sie aus zwei typischen Bereichen der Feuerwehr jeweils wesentliche Produkte.\nB) Nennen Sie die an diesen Produkten beteiligten Kunden/Stakeholder.\nC) Nennen Sie mindestens eine Qualität aus Sicht eines beteiligten Stakeholders.\nD) Nennen Sie Indikatoren, anhand derer eine Qualitätsveränderung nachgewiesen werden kann.',
     answer:'<strong>Vorgehensweise (F 98):</strong> Produkte → Beteiligte → Qualität aus Sicht eines Beteiligten → messbarer Indikator.<br><em style="font-size:.85rem;opacity:.75">Für die Klausur genügen zwei Bereiche.</em><br><br><strong>Bereich 1 – Abwehrender Brandschutz (F 105)</strong><br>Produkte: Brandbekämpfung, TH. | Beteiligte: Bürger → <strong>Hilfsfristerreichungsgrad</strong>, Eintreffzeit; Politik → <strong>Kosten je Risikokategorie</strong>.<br><br><strong>Bereich 2 – Leitstelle (F 109)</strong><br>Produkte: Annahme &amp; Disposition von Notrufen. | Beteiligte: Bürger → <strong>Quote angenommener Notrufe</strong>; Kostenträger → <strong>Rettungsdienstgebühr</strong>.<br><br><strong>Bereich 3 – Ausbildung (F 102)</strong><br>Produkte: Grundausbildung, Spezialausbildung (Atemschutz, FzF). | Beteiligte: Mitarbeiter → <strong>Ausbildungsquote je Stufe</strong>; BGU → <strong>Anteil vorschriftsmäßig qualifizierter EK</strong>.<br><br><strong>Bereich 4 – Rettungsdienst (F 106)</strong><br>Produkte: Notfallrettung, Krankentransport. | Beteiligte: Patienten → <strong>Hilfsfristerreichungsgrad RD</strong>; Kostenträger → <strong>Kosten je Einsatz</strong>.<br><br><strong>Bereich 5 – Vorbeugender Brandschutz (F 104)</strong><br>Produkte: Brandschutzprüfungen, Beratungen. | Beteiligte: Bauherren → <strong>Bearbeitungszeit je Antrag</strong>; Genehmigungsbehörde → <strong>Mängelquote Folgeprüfungen</strong>.',
     short:'Struktur: <strong>Bereich → Produkte → Beteiligte → Kennzahl</strong> (mind. 2 Bereiche)<br><br><strong>Abwehrender Brandschutz:</strong> Brandbekämpfung, TH. Bürger → <em>Hilfsfristerreichungsgrad;</em> Politik → <em>Kosten je Risikokategorie.</em><br><strong>Leitstelle:</strong> Notrufannahme &amp; Disposition. Bürger → <em>Quote angenommener Notrufe;</em> Kostenträger → <em>RD-Gebühr.</em><br><strong>Ausbildung:</strong> Grund-/Spezialausbildung. Mitarbeiter → <em>Ausbildungsquote;</em> BGU → <em>qual. EK-Anteil.</em><br><strong>Rettungsdienst:</strong> Notfallrettung, KTW. Patient → <em>Hilfsfristerreichungsgrad RD;</em> Kostenträger → <em>Kosten je Einsatz.</em>'},
    {id:3,nr:'Frage 4',punkte:5,cat:'BSC / QM',
     text:'Stellen Sie die Betrachtung aus den verschiedenen Blickwinkeln (Perspektiven) des Balanced-Scorecard-Ansatzes dar.',
     answer:'<strong>Die 4 BSC-Perspektiven (Kaplan/Norton):</strong><br>① <strong>Finanzperspektive:</strong> Blick des Trägers/Haushalts. FW: Budgettreue, Kosten je Einsatz, Investitionsquote.<br>② <strong>Kundenperspektive:</strong> Blick der Bevölkerung/Politik. FW: Hilfsfristerfüllungsquote, Sicherheitsgefühl.<br>③ <strong>Interne Prozessperspektive:</strong> Kernprozesse. FW: Ausrückzeit, Fahrzeugverfügbarkeit, Ausbildungsstand.<br>④ <strong>Lern- und Entwicklungsperspektive:</strong> Zukunftsfähigkeit. FW: Fortbildungsquote, Personalentwicklung, Digitalisierung.<br><br><strong>Blickwinkel im FW-Kontext (F 93):</strong><br>① <strong>Sicht des Kunden / der Bevölkerung</strong> – Schnelle Hilfe, kompetente Notfallversorgung.<br>② <strong>Sicht der Geschäftsführung / Magistrat / SVV</strong> – Wirtschaftlichkeit, Budgettreue, politische Ziele.<br>③ <strong>Sicht der eigenen Organisation</strong> – Arbeitssicherheit, Entwicklung, angemessene Ressourcen.<br><br><strong>Warum mehrperspektivisch? (F 46)</strong><br>→ Dieselbe Leistung hat je Beteiligtem andere Qualitätsansprüche und andere Indikatoren.<br>→ Steuerung auf zwei Ebenen: stadtgesamt (politisch/strategisch) und Ausrückbereich/Dienstgruppe (taktisch/operativ).',
     short:'<strong>4 BSC-Perspektiven:</strong><br>① Finanzen (Budgettreue, Kosten/Einsatz)<br>② Kunden (Hilfsfristerfüllungsquote, Sicherheitsgefühl)<br>③ Interne Prozesse (Ausrückzeit, Verfügbarkeit, Ausbildung)<br>④ Lernen/Entwicklung (Fortbildungsquote, Digitalisierung)<br><br><strong>FW-Blickwinkel (F93):</strong> Kunden/Bevölkerung · Geschäftsführung/Politik · eigene Organisation.<br><strong>Warum?</strong> Gleiche Leistung = unterschiedliche Indikatoren je Beteiligtem; Steuerung politisch + operativ.'},
    {id:4,nr:'Frage 5',punkte:5,cat:'Bedarfsplanung',
     text:'Welche Informationen und Kennzahlen sind für die strategische Personalplanung und die daraus resultierenden Entscheidungen erforderlich?',
     answer:'<strong>Grundbegriffe (F 111, 114)</strong><br><em>Funktion</em> = Aufgabe, gesichert für 365/24 h; 1 HLF = 6 Funktionen. Jahresbesetztzeit = <strong>8.760 h</strong>. Stellen erbringen keine Arbeitsleistung – nur physisch Anwesende (F 111).<br><br><strong>Die drei zentralen Kennzahlen (F 115–118)</strong><br>① <strong>Ist-Personalfaktor:</strong> 8.760 h ÷ Netto-JAZ je MA (JAZ minus alle Ausfälle).<br>② <strong>Ist-Stellenfaktor:</strong> Planstellen (Art 01) ÷ zu besetzende Funktionen.<br>③ <strong>Soll-Stellenfaktor:</strong> politisch beschlossen; 100 % Besetzung unterstellt, fester Besetzungsgrad (∼95 %, F 128).<br><br><strong>Zu erhebende Ausfallgründe (F 123)</strong><br>Krankheit · Urlaub · Aus-/Fortbildung · Verwendung außerhalb Einsatzdienst · Mutterschutz/Elternzeit · Sonstiges.<br><br><strong>Weitere Einflussgrößen</strong><br>→ <strong>Mehrarbeit (F 124/125):</strong> Aufbau erhöht, Abbau verringert den Faktor. Nicht abbaubar = Organisationsverschulden (F 120).<br>→ <strong>Transferleistungen (F 126):</strong> Integrationsdienst, Wachpraktikanten – verringern den Faktor.<br>→ <strong>Funktionsunterschreitungsstunden (F 127):</strong> erhöhen den Faktor; keine Verrechnung mit Überschreitungen.<br><br><strong>Strategische Nutzung (F 136, 137)</strong><br>Zeitreihenvergleiche · Risikoerkennung · Argumente für Stellenplanverfahren · Erhebung mind. 1× jährlich.',
     short:'<strong>3 Kennzahlen (F115–118):</strong><br>① <strong>Ist-Personalfaktor:</strong> 8.760 h ÷ Netto-JAZ (= JAZ minus alle Ausfälle)<br>② <strong>Ist-Stellenfaktor:</strong> Planstellen ÷ zu besetzende Funktionen<br>③ <strong>Soll-Stellenfaktor:</strong> politisch beschlossen; Besetzungsgrad ~95 %<br><br><strong>Ausfallgründe (F123):</strong> Krankheit · Urlaub · Aus-/Fortbildung · außerhalb Einsatzdienst · MuSch/Elternzeit · Sonstiges.<br><br><strong>Einflussgrößen:</strong> Mehrarbeit-Aufbau erhöht, -Abbau verringert Faktor; Transferleistungen verringern; Funktionsunterschreitungsstunden erhöhen (keine Verrechnung).<br><strong>Nutzung:</strong> Zeitreihenvergleich · Stellenplanverfahren · mind. 1×/Jahr.'},
    {id:5,nr:'Frage 6',punkte:5,cat:'Vergabe',
     text:'Wie würden Sie bei der Beschaffung einer neuen Fahrzeuggeneration strategisch vorgehen, damit der Vergabevorschlag gleichzeitig rechtssicher und zielorientiert ist?\n\nBerücksichtigen Sie: (1) richtiger Zeitpunkt, (2) notwendige Voraussetzungen, (3) worauf besonders zu achten ist, (4) Vor- und Nachteile einer Tranche vs. mehrerer Tranchen, (5) Begründung von Nutzungsdauer und technischer Reserve.',
     answer:'<strong>1. Richtiger Zeitpunkt (F 17, 26, 28)</strong><br>Vergabe erst anstoßen, wenn <strong>Haushaltsmittel bereitstehen</strong>. In der vorläufigen Haushaltsführung: keine neuen erheblichen Investitionen. Zeit vorher nutzen: <strong>Vergabeunterlagen vorbereiten.</strong><br><br><strong>2. Notwendige Voraussetzungen (F 20, 90)</strong><br>→ Haushaltsmittel rechtskräftig bewilligt.<br>→ Maßnahme im <strong>Investitionsprogramm</strong> (5-Jahres-Darstellung mit Gesamtvolumen und Jahresabflüssen).<br>→ <strong>Wertungsmatrix</strong> mit Ausschreibung veröffentlicht; Preis mind. 40 %.<br>→ Fahrzeuge → <strong>Vermögenshaushalt</strong> (einzige Kreditfinanzierung möglich).<br><br><strong>3. Worauf besonders zu achten (F 28, 50, 51)</strong><br>→ <strong>EU-Schwellenwerte</strong> prüfen, Rechtsstreitrisiko einkalkulieren.<br>→ <strong>Rahmenverträge</strong> nutzen – mehrjährig, erleichtern Beschaffungen.<br>→ Feste <strong>Jahresraten</strong> ansparen, Restmittel-Übertragbarkeit sicherstellen.<br><br><strong>4. Eine Tranche vs. mehrere Tranchen (F 51)</strong><br><u>Eine Tranche:</u> einheitliche Ausbildung, gleiche Ersatzteile, Skaleneffekte, eine Ausschreibung. <u>Nachteil:</u> Systemfehler treffen <strong>alle Fahrzeuge</strong>.<br><u>Mehrere Tranchen:</u> Risiko gestreut – Nachteil: höhere Einzelkosten, getrennte Ausschreibungen.<br><br><strong>5. Nutzungsdauer und technische Reserve (F 7, 39, 41, 107)</strong><br>→ Nutzungsdauer nach <strong>AfA-Tabelle</strong> (Anlageverzeichnis: Anschaffungswert, Restwert, Nutzungsdauer).<br>→ Technische Reserve: <strong>ausreichend bemessen</strong>, Indikator: Fahrzeugverfügbarkeit.',
     short:'<strong>1. Zeitpunkt:</strong> Haushaltsmittel bereit → Vergabe starten. Vorher Unterlagen vorbereiten.<br><strong>2. Voraussetzungen:</strong> Mittel rechtskräftig; Investitionsprogramm; Wertungsmatrix (Preis ≥ 40 %) mit Ausschreibung; Fahrzeuge → Vermögenshaushalt.<br><strong>3. Achten auf:</strong> EU-Schwellen prüfen; Rahmenverträge; Jahresraten ansparen.<br><strong>4. Tranche(n):</strong><br>→ <em>Eine:</em> einheitl. Ausbildung + Ersatzteile, Skaleneffekte. ⚠ Systemfehler trifft alle.<br>→ <em>Mehrere:</em> Risiko gestreut. ⚠ Höhere Kosten, mehr Ausschreibungen.<br><strong>5. Nutzungsdauer:</strong> AfA-Tabelle; techn. Reserve = Fahrzeugverfügbarkeit sicherstellen.'},
    {id:6,nr:'Frage 7',punkte:5,cat:'Bedarfsplanung',
     text:'Zweigleisige Analyse des Ist-Zustandes im Rahmen einer Rettungsdienstbedarfsplanung. Welche zwei Ist-Analysen werden eingesetzt und was liefern sie?',
     answer:'<strong>1. Analyse der Hilfsfristerreichung</strong><br>Auswertung des tatsächlichen Erreichungsgrades im Analysezeitraum; SOLL-IST-Vergleich mit dem gesetzlichen Schutzziel (z.B. 95 % innerhalb 10 Min.). Die Auswertung erfolgt zweigleisig:<br>→ <strong>Hilfsfristerreichung insgesamt</strong> (alle Fahrzeuge, alle Einsätze).<br>→ <strong>Hilfsfristerreichung ab der zuständigen Wache</strong> (nur Einsätze der nächstgelegenen Wache).<br>Vergleich beider Auswertungen ermöglicht die Unterscheidung zweier Problemtypen:<br>• Gute Erreichung ab zuständiger Wache, schlechte Gesamterreichung → <strong>Ressourcenverfügbarkeitsproblem</strong> (zu wenig Fahrzeuge parallel verfügbar).<br>• Schlechte Erreichung auch ab zuständiger Wache → <strong>Standort-/Erreichbarkeitsproblem</strong>.<br><em>Ergebnis:</em> Räumliche Identifikation von Versorgungslücken und erste Eingrenzung der Ursachenart.<br><br><strong>2. Problemfeldanalyse</strong><br>Mehrstufige Analyse der <strong>Verursachungsbeiträge</strong> der Nicht-Erreichung der Hilfsfrist. Drei Faktoren werden quantifiziert:<br>① <strong>Standortstruktur und Verkehr</strong> – Nicht-Erreichungen durch ungünstige Wachlage und Verkehrsverhältnisse.<br>② <strong>Ausrückzeit</strong> – Nicht-Erreichungen durch zu lange Ausrückzeit.<br>③ <strong>Ressourcenverfügbarkeit</strong> – Nicht-Erreichungen, weil kein Fahrzeug der zuständigen Wache verfügbar war.<br>Wichtig: Organisatorische Optimierungen der Ausrückzeit sind in der Regel <strong>einfacher und schneller</strong> umsetzbar als Veränderungen der Standortstruktur oder Ausweitungen der Vorhaltung.<br><em>Ergebnis:</em> Priorisierte und zielgerichtete Maßnahmenableitung auf Basis quantifizierter Verursachungsbeiträge.',
     short:'<strong>① Analyse der Hilfsfristerreichung</strong><br><em>Ergebnis:</em> Räumliche Versorgungslücken + Ursachenart.<br><br><strong>② Problemfeldanalyse</strong><br><em>Ergebnis:</em> Zielgerichtete, priorisierte Maßnahmenableitung.'},
    {id:7,nr:'Frage 8',punkte:5,cat:'Bedarfsplanung',
     text:'Phasenmodell der Katastrophenschutzbedarfsplanung. Beschreiben Sie die wesentlichen Phasen.',
     answer:'<strong>Phasenmodell der KatS-Bedarfsplanung (5 Phasen, in Anlehnung an BBK-Leitfaden):</strong><br><br><strong>Phase 1 – Brainstorming</strong><br>Sammlung aller denkbaren Szenarien im Zuständigkeitsbereich. Leitfragen: Bestehen relevante Anschlagsziele? Welche KRITIS gibt es? Sind Hochwasser- oder Georisiken vorhanden? Kategorisierung in <em>anthropogene Katastrophen</em>, <em>Naturkatastrophen</em> und <em>konfliktbedingte Katastrophen</em>. Ziel: möglichst viele Risiken in Szenarien bündeln.<br><br><strong>Phase 2 – Szenarienauswahl</strong><br>Reduktion auf ca. <strong>5 relevante Szenarien</strong> mithilfe der Risikomatrix (Eintrittswahrscheinlichkeit × Schadensausmaß). Zusätzliche Determinante: <strong>Velocity of Risk (VoR)</strong> = Vorwarnzeit des Ereigniseintritts (z. B. ermöglicht Planung von WLF-Konzepten und Dual-Use-Lösungen). Bewertungsverfahren: Delphisches Verfahren mit Fachexperten (Abstimmungsrunden) oder Auswahl durch untere KatS-Behörde. Szenarien sollen die gesamte Breite der KatS-Fachdienste abdecken.<br><br><strong>Phase 3 – Szenarienfolgenbetrachtung</strong><br>Workshopbasierte Analyse der Folgen je Szenario. Fokus: eigene Betroffenheit und Leistungsfähigkeit; Schutzgüter (Menschenleben, Gesundheit, Umwelt, Wirtschaft). Einbindung privater und wirtschaftlicher Akteure (Offenbarung zusätzlicher Ressourcen). Am Ende jedes Szenarios: <strong>Ableitung der Fähigkeitsbedarfe</strong> des Katastrophenschutzes. Maximalbetrachtung gleichartiger Fähigkeiten über alle Szenarien hinweg.<br><br><strong>Phase 4 – Ableitung der Planungsziele</strong><br>Aggregierung der szenarienbezogenen Fähigkeitsbedarfe zu <strong>übergeordneten Planungszielen</strong> (z. B. „Betrieb eines Verwaltungsstabes"). Unterscheidung: <em>Querschnittsfunktionen</em> (I&amp;K, Führungsunterstützung) und <em>Fachdienstanforderungen</em> (ABC-Gefahrenabwehr, SEG Rettung etc.). Berücksichtigung begrenzter Haushaltsmittel: modulare, multifunktionale Einheiten; WLF-Konzepte; Dual-Use von Räumlichkeiten.<br><br><strong>Phase 5 – Maßnahmenableitung</strong><br>IST-Analyse für jedes Planungsziel im Zuständigkeitsbereich. SOLL-IST-Vergleich → bei Differenz sind Maßnahmen erforderlich. Ergebnis: <strong>priorisierte Maßnahmenliste</strong>. Berücksichtigung überörtlicher Konzepte (Katastrophe mit eigenen Mitteln allein nicht bewältigbar); aber: Katastrophe kann angrenzende Kommunen gleichermaßen betreffen und überörtliche Hilfe beeinträchtigen.',
     short:'<strong>5 Phasen KatS-Bedarfsplanung (in Anlehnung an BBK-Leitfaden):</strong><br>① <strong>Brainstorming</strong> – Alle denkbaren Szenarien sammeln (anthropogen · Natur · Konflikt).<br>② <strong>Szenarienauswahl</strong> – Reduktion auf ca. 5 Szenarien via Risikomatrix (EW × Schadensausmaß) + VoR; Delphisches Verfahren.<br>③ <strong>Szenarienfolgenbetrachtung</strong> – Workshopbasierte Folgenanalyse; Ableitung Fähigkeitsbedarfe je Szenario.<br>④ <strong>Ableitung der Planungsziele</strong> – Aggregierung zu übergeordneten Zielen; Querschnittsfunktionen + Fachdienste; modulare Planung.<br>⑤ <strong>Maßnahmenableitung</strong> – IST-SOLL-Vergleich je Planungsziel → priorisierte Maßnahmenliste.'},
    {id:8,nr:'Frage 9',punkte:5,cat:'Rechnungswesen',
     text:'Grenzen Sie die Begrifflichkeiten Kameralistik und Doppik voneinander ab und nennen Sie jeweils vier charakteristische Eigenschaften.',
     answer:'<strong>Kameralistik</strong> – traditionelles zahlungsorientiertes Buchungssystem:<br>① <strong>Kassensteuerung:</strong> Erfasst ausschließlich Einzahlungen und Auszahlungen eines Haushaltsjahres – reiner Kassenfokus, kein Blick auf Vermögenswerte.<br>② <strong>Geldverbrauchs-Fokus:</strong> Zeigt die Liquidität, vernachlässigt aber Vermögenswerte und langfristigen Werteverzehr (keine Abschreibungen).<br>③ <strong>Mittelkontrolle:</strong> Sichert strikte budgetäre Gesetzmäßigkeit und ministerielle Vorgaben; starke formale Bindung an genehmigte Haushaltspläne.<br>④ <strong>Abgrenzung zu Effektivität:</strong> Kameralistik überwacht formal die Kassenmittel, misst aber nicht den inhaltlichen Einsatzerfolg oder gesellschaftlichen Nutzen.<br><br><strong>Doppik</strong> (Doppelte Buchführung / NKF / NKHR) – kaufmännisches Rechnungswesen der öffentlichen Hand; ergibt sich aus dem Neuen Steuerungsmodell (NSM/NPM):<br>① <strong>Kaufmännisches Prinzip:</strong> Ersetzt Kameralistik durch doppelte Buchführung mit Bilanz, Ergebnisrechnung und Finanzrechnung.<br>② <strong>Ressourcenverbrauch:</strong> Periodengerechter Werteverzehr (Abschreibungen) statt reiner Zahlungsströme – macht langfristigen Substanzverlust sichtbar.<br>③ <strong>Transparenz:</strong> Zeigt das tatsächliche Vermögen und die Schulden der öffentlichen Hand vollständig (inkl. Pensionsrückstellungen, Infrastrukturvermögen).<br>④ <strong>Generationengerechtigkeit:</strong> Verhindert Konsum auf Kosten der Zukunft, da Abschreibungen den laufenden Ressourcenverbrauch dem zugehörigen Haushaltsjahr zuordnen.',
     short:'<strong>Kameralistik:</strong><br>① Kassensteuerung – nur Einzahlungen/Auszahlungen (Zahlungsorientierung)<br>② Geldverbrauchs-Fokus – Liquidität, kein Vermögensausweis, keine Abschreibungen<br>③ Mittelkontrolle – strikte budgetäre Gesetzmäßigkeit<br>④ Abgrenzung zu Effektivität – misst nicht inhaltlichen Einsatzerfolg<br><br><strong>Doppik (NSM/NPM):</strong><br>① Kaufmännisches Prinzip – Bilanz + Ergebnisrechnung + Finanzrechnung<br>② Ressourcenverbrauch – Abschreibungen, periodengerechter Werteverzehr<br>③ Transparenz – vollst. Ausweis Vermögen, Schulden, Pensionsrückstellungen<br>④ Generationengerechtigkeit – kein Konsum auf Kosten der Zukunft'},
    {id:9,nr:'Frage 10',punkte:5,cat:'Vergabe',
     text:'Ein neutrales Leistungsverzeichnis ist für eine Beschaffung von zentraler Bedeutung. Nennen Sie vier Aspekte eines neutralen Leistungsverzeichnisses.',
     answer:'Ein <strong>neutrales Leistungsverzeichnis (LV)</strong> beschreibt den Beschaffungsgegenstand so, dass kein Anbieter bevorzugt oder benachteiligt wird (§ 31 VgV, § 7 VOB/A).<br><br><strong>① Vergaberecht &amp; Neutralität:</strong><br>Leistungsverzeichnisse müssen Bedarfe <strong>exakt und herstellerneutral</strong> beschreiben – keine Nennung von Marken, Typen oder Herstellern. Alle geeigneten Anbieter sollen gleichermaßen ansprechen können.<br><br><strong>② Diskriminierungsverbot:</strong><br>Es ist <strong>rechtswidrig</strong>, bestimmte Hersteller oder Fahrzeugmodelle bei Ausschreibungen zu bevorzugen. Auch versteckte Spezifikationen, die faktisch nur ein Produkt erfüllen kann, verstoßen gegen das Diskriminierungsverbot.<br><br><strong>③ Wettbewerbssicherung:</strong><br>Transparente, neutrale Kriterien sichern den <strong>fairen Marktvergleich</strong> – möglichst viele Anbieter sollen Angebote einreichen können. Wettbewerb senkt Preise und steigert Qualität.<br><br><strong>④ Rechtssicherheit:</strong><br>Saubere Leistungsbeschreibungen schützen Kommunen und Feuerwehren vor <strong>Vergaberügen</strong> und teuren Beschaffungsstopps. Lücken oder herstellerspezifische Anforderungen können nachträglich angefochten werden.',
     short:'<strong>4 Aspekte des neutralen Leistungsverzeichnisses:</strong><br>① <strong>Vergaberecht &amp; Neutralität</strong> – exakte, herstellerneutrale Bedarfsbeschreibung; keine Marken/Typen/Hersteller.<br>② <strong>Diskriminierungsverbot</strong> – Bevorzugung bestimmter Hersteller oder Fahrzeugmodelle ist rechtswidrig.<br>③ <strong>Wettbewerbssicherung</strong> – transparente Kriterien ermöglichen fairen Marktvergleich und maximalen Bieterwettbewerb.<br>④ <strong>Rechtssicherheit</strong> – saubere Leistungsbeschreibungen schützen vor Vergaberügen und Beschaffungsstopps.'},
    {id:10,nr:'Frage 11',punkte:5,cat:'Weg der Ansatzermittlung (Haushalt)',
     text:'Beschreiben Sie den Weg der Ansatzermittlung im Haushaltsrecht in vier Schritten.',
     answer:'Der <strong>Weg der Ansatzermittlung</strong> beschreibt, wie die Feuerwehr ihren Finanzbedarf für das kommende Haushaltsjahr geltend macht und bis zum verbindlichen Beschluss begleitet:<br><br><strong>Schritt 1 – Bedarfsanmeldung</strong><br>Die Feuerwehr meldet ihre notwendige Ausrüstung und Technik für das kommende Jahr an. Dabei wird unterschieden in <strong>fixe Kosten</strong> (z. B. Mieten, Vertragskosten, in Teilen Verbrauchsmaterial) und <strong>variable Kosten</strong> (z. B. Projekte, Sonderbeschaffungen). Die Anmeldung muss fachlich begründet sein.<br><br><strong>Schritt 2 – Priorisierung</strong><br>Gemeinde (Kämmerei / Verwaltungsführung) und Wehrleitung ordnen die eingereichten Anträge nach <strong>Dringlichkeit und Relevanz</strong>. Nicht alle Anmeldungen können berücksichtigt werden – politische und finanzielle Abwägungen fließen ein.<br><br><strong>Schritt 3 – Ansatzermittlung</strong><br>Auf Basis der priorisierten Anmeldungen werden die <strong>konkreten Geldbeträge im Haushaltsplanentwurf</strong> festgelegt (Ansätze). Der Entwurf wird durch die Kämmerei erstellt und in die politische Beratung eingebracht.<br><br><strong>Schritt 4 – Finaler Beschluss</strong><br>Der <strong>Gemeinderat verabschiedet den Haushalt rechtssicher</strong> als Satzung. Erst nach dem Beschluss stehen die Mittel für die Feuerwehr verbindlich zur Verfügung – keine Vergabe ohne beschlossene Haushaltsmittel.',
     short:'<strong>4 Schritte – Weg der Ansatzermittlung:</strong><br>① <strong>Bedarfsanmeldung:</strong> FW meldet Ausrüstung/Technik für kommendes Jahr (fixe Kosten: Mieten; variable Kosten: Projekte).<br>② <strong>Priorisierung:</strong> Gemeinde &amp; Wehrleitung ordnen Anträge nach Dringlichkeit und Relevanz.<br>③ <strong>Ansatzermittlung:</strong> Festlegung der konkreten Geldbeträge im Haushaltsplanentwurf durch Kämmerei.<br>④ <strong>Finaler Beschluss:</strong> Gemeinderat verabschiedet Haushalt rechtssicher als Satzung → Mittel verbindlich verfügbar.'},
    {id:11,nr:'Frage 12',punkte:5,cat:'VWL',
     text:'Erläutern Sie das Argument der indirekten Wertschöpfung im Rahmen der Haushaltsaufstellung anhand von vier Kategorien.',
     answer:'Das Argument der <strong>indirekten Wertschöpfung</strong> zeigt, dass Feuerwehrausgaben nicht nur Kosten sind, sondern volkswirtschaftlichen Nutzen erzeugen – ein zentrales Argument in Haushaltsverhandlungen:<br><br><strong>① Indirekte Wertschöpfung</strong><br>Die Feuerwehr <strong>produziert keine Güter</strong>, verhindert aber deren Zerstörung. Dieser Schutz von Sachwerten, Infrastruktur und Betriebskapital ist eine nicht direkt sichtbare, aber real erbrachte wirtschaftliche Leistung.<br><br><strong>② Faktor Zeit</strong><br><strong>Schnelle Eingreifzeiten</strong> begrenzen den Schaden auf ein Minimum. Jede Minute früherer Intervention reduziert direkte Sach- und Folgeschäden – die Eintreffzeit ist daher ein zentraler volkswirtschaftlicher Hebel.<br><br><strong>③ Betriebserhalt</strong><br>Ein gelöschtes Firmengebäude bedeutet die <strong>Vermeidung teurer Produktionsausfälle</strong>. Ohne Feuerwehreinsatz drohen Betriebsunterbrechungen, Lieferkettenausfälle und ggf. dauerhafte Betriebsschließungen.<br><br><strong>④ Existenzsicherung</strong><br>Der Schutz von Betriebsstätten sichert langfristig <strong>lokale Arbeitsplätze und Steuereinnahmen</strong>. Feuerwehrausgaben stabilisieren damit indirekt die kommunale Haushaltsbasis und rechtfertigen sich auch gegenüber einer KNA.',
     short:'<strong>4 Kategorien indirekter Wertschöpfung (VWL S.28):</strong><br>① <strong>Indirekte Wertschöpfung</strong> – FW produziert keine Güter, verhindert aber deren Zerstörung.<br>② <strong>Faktor Zeit</strong> – schnelle Eingreifzeiten begrenzen Schaden auf Minimum.<br>③ <strong>Betriebserhalt</strong> – gelöschtes Firmengebäude verhindert teure Produktionsausfälle.<br>④ <strong>Existenzsicherung</strong> – Schutz von Betriebsstätten sichert Arbeitsplätze und Steuereinnahmen.'},
    {id:12,nr:'Frage 13',punkte:5,cat:'VWL',
     text:'Was ist die Kosten-Nutzen-Analyse (KNA)? Nennen Sie fünf Kategorien des Instruments.',
     answer:'Die <strong>Kosten-Nutzen-Analyse (KNA)</strong> ist ein Bewertungsinstrument, das alle anfallenden Kosten und erwarteten Nutzen eines Projekts oder einer Maßnahme systematisch erfasst, bewertet und gegenüberstellt. Im öffentlichen Haushaltsrecht ist sie gesetzlich verankerte Grundlage für finanzwirksame Entscheidungen (HGrG).<br><br><strong>① Bewertungstool</strong><br>Die KNA <strong>vergleicht alle anfallenden Kosten und erwarteten Nutzen</strong> eines Projekts in Geldwerten. Überwiegt der Nutzen, gilt die Maßnahme als wirtschaftlich vertretbar.<br><br><strong>② Entscheidungshilfe</strong><br>Die KNA <strong>objektiviert die Auswahl zwischen verschiedenen Investitionsalternativen</strong> (z. B. Fahrzeugtypen, Standortalternativen) und macht Entscheidungen rational begründbar und für Dritte nachvollziehbar.<br><br><strong>③ Wirtschaftlichkeitsnachweis</strong><br>Die KNA ist <strong>gesetzlich vorgeschriebene Grundlage</strong> bei finanzwirksamen Maßnahmen im öffentlichen Bereich (Haushaltsgrundsätzegesetz = HGrG). Ohne Wirtschaftlichkeitsnachweis sind Ausgaben formal nicht zulässig.<br><br><strong>④ Makro-Blick</strong><br>Im Gegensatz zu rein betriebswirtschaftlichen Kalkulationen <strong>erfasst die KNA auch gesellschaftliche Wohlfahrtseffekte</strong> – z. B. verhinderte Umweltschäden, öffentliche Sicherheit, Lebensqualität – die über direkte Ausgaben hinausgehen.<br><br><strong>⑤ Priorisierung</strong><br>Die KNA <strong>verhindert Fehlinvestitionen</strong>, indem sie den langfristigen Mehrwert einer Maßnahme nachweist und eine fundierte Priorisierung konkurrierender Ausgaben (z. B. Fahrzeug A vs. Fahrzeug B) ermöglicht.',
     short:'<strong>KNA:</strong> Systematischer Vergleich aller Kosten und Nutzen einer Maßnahme in Geldwerten; gesetzlich vorgeschrieben (HGrG).<br><br><strong>5 Kategorien der KNA (VWL S.42):</strong><br>① <strong>Bewertungstool</strong> – vergleicht Kosten und Nutzen eines Projekts in Geldwerten.<br>② <strong>Entscheidungshilfe</strong> – objektiviert Auswahl zwischen verschiedenen Investitionsalternativen.<br>③ <strong>Wirtschaftlichkeitsnachweis</strong> – gesetzlich vorgeschrieben bei finanzwirksamen Maßnahmen (HGrG).<br>④ <strong>Makro-Blick</strong> – erfasst auch gesellschaftliche Wohlfahrtseffekte über direkte Ausgaben hinaus.<br>⑤ <strong>Priorisierung</strong> – verhindert Fehlinvestitionen durch Nachweis des langfristigen Mehrwerts.'},
    {id:14,nr:'Frage 14',punkte:5,cat:'Bedarfsplanung',
     text:'Was ist ein Planungsziel in der Feuerwehrbedarfsplanung, und woraus besteht es?',
     answer:'<strong>Definition Planungsziel</strong><br>Ein <strong>Planungsziel</strong> definiert den angestrebten Leistungsstand, den eine Feuerwehr im Einsatzfall erreichen soll. Es bildet den <strong>normativen Kern des Bedarfsplans</strong> und macht die geforderte Leistungsfähigkeit quantifizierbar und damit politisch beschließbar.<br><br><strong>Funktion</strong><br>Das Planungsziel operationalisiert das <strong>Schutzziel</strong> (z. B. „Menschenrettung vor Flashover") in mess- und überprüfbare Kenngrößen. Nur so kann die Zielerreichung später per Hilfsfristerreichungsanalyse bewertet und ggf. nachgesteuert werden.<br><br><strong>Die drei Zieldimensionen</strong><br>① <strong>Hilfsfrist (Planungsfrist)</strong><br>Zeitspanne zwischen Eingang des Notrufes und Eintreffen der ersten taktischen Einheit an der Einsatzstelle.<br>→ Üblicherweise <strong>8 Minuten</strong> für die erste und <strong>13 Minuten</strong> für die Ergänzungskraft (Empfehlung AGBF).<br><br>② <strong>Taktische Einheit (Funktionsstärke)</strong><br>Qualitative und quantitative Stärke der Kräfte, die innerhalb der Hilfsfrist ankommen müssen.<br>→ Üblicherweise <strong>1/9 = 10 Einsatzkräfte</strong> für den Kritischen Wohnungsbrand als Referenzszenario (AGBF-Grundsätze).<br><br>③ <strong>Erreichungsgrad</strong><br>Anteil aller relevanten Einsätze, bei denen Hilfsfrist <em>und</em> Funktionsstärke gleichzeitig erreicht werden.<br>→ AGBF-Empfehlung: <strong>mindestens 90 %</strong> aller Einsätze der Schutzzielkategorie.<br><br><strong>Zusammenhang</strong><br>Das Planungsziel bildet die Grundlage für die <strong>Hilfsfristerreichungsanalyse</strong> (Ist-Analyse), aus der Rückschlüsse auf Standorte, Fahrzeugvorhaltung und Personalstärke abgeleitet werden. Eine strukturelle Unterschreitung löst die Pflicht zur Anpassung des Bedarfsplans aus.',
     short:'<strong>Planungsziel:</strong> Definiert den angestrebten Leistungsstand der Feuerwehr im Einsatzfall; normativer Kern des Bedarfsplans; macht Leistungsfähigkeit messbar.<br><br><strong>3 Zieldimensionen:</strong><br>① <strong>Hilfsfrist (Planungsfrist)</strong> – Zeit zwischen Notruf und Eintreffen der 1. taktischen Einheit (Standard: 8 min / Ergänzung: 13 min).<br>② <strong>Taktische Einheit (Funktionsstärke)</strong> – Stärke der fristgerecht eintreffenden Kräfte (Standard: 1/9 = 10 EK für Kritischen Wohnungsbrand).<br>③ <strong>Erreichungsgrad</strong> – Anteil der Einsätze, bei denen Hilfsfrist + Funktionsstärke gleichzeitig erreicht werden (AGBF: mind. <strong>90 %</strong>).'}
  ];

  const KF_TOTAL_PTS = QUESTIONS.reduce(function(s,q){return s+q.punkte;},0);

  function loadScores(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  function saveScores(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} }
  function scoreKey(id){ return 'q'+id; }
  function dotsHtml(){
    return QUESTIONS.map(function(q,i){
      var sc=_scores[scoreKey(q.id)];
      var cls='fb-dot'+(i===_step?' fb-dot-active':sc!==undefined?' fb-dot-done':'');
      return '<span class="'+cls+'" onclick="KF_QUIZ.goToQ('+i+')" title="Zu Frage '+(i+1)+' springen">'+(i+1)+'</span>';
    }).join('');
  }

  function renderStart(){
    var el=document.getElementById('kf-content'); if(!el) return;
    _scores=loadScores();
    var scored=QUESTIONS.filter(function(q){return _scores[scoreKey(q.id)]!==undefined;});
    var totalScored=scored.reduce(function(s,q){return s+(_scores[scoreKey(q.id)]||0);},0);
    var progress=scored.length;
    var overviewRows=QUESTIONS.map(function(q,i){
      var pts=_scores[scoreKey(q.id)];
      var done=pts!==undefined;
      var ptsHtml=done?('<span class="uk-q-pts-got">'+pts+'/'+q.punkte+'</span>'):'<span class="uk-q-pts-open">–</span>';
      return '<div class="uk-q-row'+(done?' uk-q-done':'')+'" onclick="KF_QUIZ.goToQ('+i+')">'+'<span class="acc-num">'+String(i+1).padStart(2,'0')+'</span><span class="uk-q-nr">'+q.nr+'</span><span class="acc-pts">'+q.punkte+' Pkt.</span>'+ptsHtml+'<span class="acc-q">'+q.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\s*\n\s*/g,' ')+'</span><span class="uk-q-hint">'+(done?'Nochmal ansehen ›':'Beantworten ›')+'</span></div>';
    }).join('');
    var progressHtml=progress>0?('<div class="uk-progress-row"><span>Fortschritt: '+progress+'/'+QUESTIONS.length+' bewertet</span><span>'+totalScored+'/'+KF_TOTAL_PTS+' Punkte ('+Math.round(totalScored/KF_TOTAL_PTS*100)+' %)</span></div>'):''
;    var resetBtn=progress>0?'<button class="uk-timer-reset" style="margin-left:auto" onclick="KF_QUIZ.resetAll()">↺ Neu beginnen</button>':'';
    var resultBtn=progress===QUESTIONS.length?'<button class="uk-result-btn" onclick="KF_QUIZ.showResult()">Auswertung anzeigen</button>':'';
    el.innerHTML='<div class="uk-start"><div class="uk-intro-box"><div class="uk-intro-title">Klausurfragen · FeuAK Hamburg</div>'+'<div class="uk-intro-meta">'+QUESTIONS.length+' Fragen · '+KF_TOTAL_PTS+' Punkte</div>'+'</div>'+(resetBtn?'<div class="uk-timer-box">'+resetBtn+'</div>':'')+'<div class="uk-q-overview">'+overviewRows+'</div>'+progressHtml+'<button class="uk-start-btn" onclick="KF_QUIZ.goToQ(0)">'+(progress>0?'Klausur fortsetzen →':'Klausur beginnen →')+'</button>'+resultBtn+'</div>';
  }

  function renderQuestion(){
    var el=document.getElementById('kf-content'); if(!el) return;
    _scores=loadScores();
    var q=QUESTIONS[_step];
    var savedTa=_scores['ta_q'+q.id]||'';
    var myPts=_scores[scoreKey(q.id)];
    var scoreBtns=Array.from({length:q.punkte+1},function(_,i){return '<button class="uk-score-btn'+(myPts===i?' uk-score-active':'')+'" onclick="KF_QUIZ.setScore('+i+')">'+i+'</button>';}).join('');
    var scoreGot=myPts!==undefined?('<span class="uk-score-got">'+myPts+'/'+q.punkte+' Pkt. gespeichert</span>'):'';
    var prevBtn=_step===0?'':'<button class="fb-prev-btn" onclick="KF_QUIZ.prevQ()">← Zurück</button>';
    var nextLabel=_step===QUESTIONS.length-1?'Auswertung →':'Nächste Frage →';
    var nextFn=_step===QUESTIONS.length-1?'KF_QUIZ.showResult()':'KF_QUIZ.nextQ()';
    el.innerHTML='<div class="uk-q-header"><button class="uk-back-btn" onclick="KF_QUIZ.showStart()">← Übersicht</button>'+'<span class="uk-q-badge">'+q.nr+' · '+q.punkte+(q.punkte===1?' Punkt':' Punkte')+'</span></div>'+'<div class="uk-question"><p>'+q.text+'</p></div>'+'<textarea class="fb-textarea" id="kf-ta" placeholder="Schreibe deine Antwort hier…" rows="6">'+xss(savedTa)+'</textarea>'+'<div class="eq-reveal-row" id="kf-reveal-row">'+'<button class="fb-reveal-btn" id="kf-reveal-btn" onclick="KF_QUIZ.reveal()">Musterlösung anzeigen</button>'+'<button class="eq-short-btn" id="kf-short-btn" onclick="KF_QUIZ.revealShort()">Kurzantwort</button></div>'+'<div class="fb-answer'+(_revealed?'':' hidden')+'" id="kf-answer">'+q.answer+'</div>'+'<div class="fb-answer eq-short-answer'+(_shortRevealed?'':' hidden')+'" id="kf-short">'+(q.short||q.answer)+'</div>'+'<div class="uk-score-row'+((_revealed||_shortRevealed)?'':' hidden')+'" id="kf-score-row">'+'<span class="uk-score-label">Meine Punkte:</span><div class="uk-score-btns">'+scoreBtns+'</div>'+scoreGot+'</div>'+'<div class="fb-step-actions">'+prevBtn+'<button class="fb-next-btn" onclick="'+nextFn+'">'+nextLabel+'</button></div>'+'<div class="fb-step-dots">'+dotsHtml()+'</div>';
  }

  function renderResult(){
    var el=document.getElementById('kf-content'); if(!el) return;
    _scores=loadScores();
    var total=QUESTIONS.reduce(function(s,q){return s+(_scores[scoreKey(q.id)]||0);},0);
    var pct=Math.round(total/KF_TOTAL_PTS*100);
    var grade=pct>=90?'Sehr gut':pct>=80?'Gut':pct>=70?'Befriedigend':pct>=60?'Ausreichend':'Nicht bestanden';
    var gradeCol=pct>=60?'#4ACD90':'#ef4444';
    var rows=QUESTIONS.map(function(q,i){
      var got=_scores[scoreKey(q.id)];
      var done=got!==undefined;
      var col=done?(got===q.punkte?'#4ACD90':got>0?'var(--c-gold)':'#ef4444'):'var(--c-slate-l)';
      return '<tr><td>'+q.nr+'</td><td>'+q.punkte+'</td><td style="color:'+col+'">'+(done?got:'–')+'</td><td><button class="uk-jump-btn" onclick="KF_QUIZ.goToQ('+i+')">→</button></td></tr>';
    }).join('');
    el.innerHTML='<div class="uk-result"><div class="uk-result-header">Auswertung</div>'+'<div class="uk-result-score" style="color:'+gradeCol+';">'+total+' / '+KF_TOTAL_PTS+' Punkte</div>'+'<div class="uk-result-pct" style="color:'+gradeCol+';">'+pct+' % – '+grade+'</div>'+'<div class="uk-result-bar"><div class="uk-result-fill" style="width:'+pct+'%;background:'+gradeCol+';"></div></div>'+'<table class="uk-result-table"><thead><tr><th>Frage</th><th>Max.</th><th>Erreicht</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+'<div class="uk-result-actions">'+'<button class="uk-start-btn" onclick="KF_QUIZ.showStart()">← Zur Übersicht</button>'+'<button class="uk-reset-btn" onclick="KF_QUIZ.resetAll()">Neu beginnen</button></div></div>';
  }

  return {
    init:function(){
      _scores=loadScores();
      this.showStart();
    },
    showStart:function(){
      _step=0; _revealed=false;
      renderStart();
    },
    goToQ:function(i){
      var ta=document.getElementById('kf-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      _step=i; _revealed=false; _shortRevealed=false;
      renderQuestion(); window.scrollTo({top:0,behavior:'instant'});
    },
    nextQ:function(){
      var ta=document.getElementById('kf-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      if(_step<QUESTIONS.length-1){_step++;_revealed=false;_shortRevealed=false;renderQuestion();window.scrollTo({top:0,behavior:'instant'});}
    },
    prevQ:function(){
      var ta=document.getElementById('kf-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      if(_step>0){_step--;_revealed=true;_shortRevealed=false;renderQuestion();window.scrollTo({top:0,behavior:'instant'});}
    },
    reveal:function(){
      var ta=document.getElementById('kf-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      _revealed=!_revealed;
      var ans=document.getElementById('kf-answer');
      if(ans){if(_revealed){ans.classList.remove('hidden');}else{ans.classList.add('hidden');}}
      var sr=document.getElementById('kf-score-row');
      if(sr){if(_revealed||_shortRevealed){sr.classList.remove('hidden');}else{sr.classList.add('hidden');}}
      var btn=document.getElementById('kf-reveal-btn');
      if(btn){if(_revealed){btn.classList.add('eq-btn-active');}else{btn.classList.remove('eq-btn-active');}}
    },
    revealShort:function(){
      var ta=document.getElementById('kf-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      _shortRevealed=!_shortRevealed;
      var sh=document.getElementById('kf-short');
      if(sh){if(_shortRevealed){sh.classList.remove('hidden');}else{sh.classList.add('hidden');}}
      var sr=document.getElementById('kf-score-row');
      if(sr){if(_revealed||_shortRevealed){sr.classList.remove('hidden');}else{sr.classList.add('hidden');}}
      var btn=document.getElementById('kf-short-btn');
      if(btn){if(_shortRevealed){btn.classList.add('eq-short-btn-active');}else{btn.classList.remove('eq-short-btn-active');}}
    },
    setScore:function(pts){
      var d=loadScores();d[scoreKey(QUESTIONS[_step].id)]=pts;saveScores(d);_scores=d;
      renderQuestion();
      _revealed=true;
      document.getElementById('kf-answer')?.classList.remove('hidden');
      document.getElementById('kf-score-row')?.classList.remove('hidden');
    },
    showResult:function(){renderResult(); if(typeof GAME!=='undefined') GAME.cheer('pruefung','Klausurfragen');},
    // Stand für die Übersichtskachel: nur Fragen, die es wirklich gibt
    info:function(){
      var sc={};try{sc=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
      var got=QUESTIONS.filter(function(q){return sc[scoreKey(q.id)]!==undefined;});
      return {done:got.length,totalQ:QUESTIONS.length,pts:got.reduce(function(a,q){return a+(parseInt(sc[scoreKey(q.id)])||0);},0),maxPts:KF_TOTAL_PTS};
    },
    resetAll:function(){
      localStorage.removeItem(KEY);_scores={};_step=0;_revealed=false;_shortRevealed=false;
      renderStart();
    }
  };
})();

/* ══════════════════════════════════════════════════════════════
   KLAUSUR_HUB – Live-Fortschritt für den Klausuren-Übersichtstab
══════════════════════════════════════════════════════════════ */
const KLAUSUR_HUB = (function(){
  function getInfo(key, totalQ, maxPts){
    try{
      var sc=JSON.parse(localStorage.getItem(key)||'{}');
      var scored=Object.keys(sc).filter(function(k){return /^q\d+$/.test(k);});
      var pts=scored.reduce(function(s,k){return s+(parseInt(sc[k])||0);},0);
      return {done:scored.length, totalQ:totalQ, pts:pts, maxPts:maxPts};
    }catch(e){return {done:0,totalQ:totalQ,pts:0,maxPts:maxPts};}
  }
  function fmt(info){
    if(info.done===0) return 'Noch nicht gestartet';
    return info.done+'/'+info.totalQ+' bewertet · '+info.pts+'/'+info.maxPts+' Pkt.';
  }
  return {
    render:function(){
      var eq=document.getElementById('klh-eq-progress');
      var fq=document.getElementById('klh-fq-progress');
      var kf=document.getElementById('klh-kf-progress');
      if(kf) kf.textContent=fmt(KF_QUIZ.info());
      if(eq) eq.textContent=fmt(getInfo('bvi_eq_scores',8,50));
      if(fq) fq.textContent=fmt(getInfo('bvi_fq_scores',22,110));
    }
  };
})();


/* ======================================================================
   CHANGELOG – Update-Feed mit Auto-Open bei neuer Version
====================================================================== */
// Eingebettete Seiten (iframe): füllen den Platz zwischen Kopfleiste und Tableiste, ihre Reiter bleiben sichtbar
(function(){
  // Skeleton: schimmernde Fläche, bis die eingebettete Seite geladen ist
  document.querySelectorAll('iframe.emb-frame').forEach(function(f){ var ok=function(){ f.classList.add('ld'); }; f.addEventListener('load',ok); setTimeout(ok,6000); });
  function fit(){
    var any=false;
    document.querySelectorAll('iframe.emb-frame').forEach(function(f){
      var v=f.parentElement;if(!v||!v.classList.contains('active'))return;
      any=true;
      var tb=document.getElementById('m-topbar'),bar=document.getElementById('m-tabbar');
      var top=tb?Math.max(0,Math.ceil(tb.getBoundingClientRect().bottom)):0;
      var bot=bar&&getComputedStyle(bar).display!=='none'?bar.offsetHeight:0;
      var rail=document.getElementById('m-rail'),left=rail&&getComputedStyle(rail).display!=='none'?Math.max(0,Math.round(rail.getBoundingClientRect().right)):0;
      /* fest am Bildschirm: die Seite scrollt nicht mit, die Reiter der Karte bleiben immer sichtbar */
      f.style.position='fixed';f.style.left=left+'px';f.style.top=top+'px';f.style.width=(innerWidth-left)+'px';
      f.style.height=Math.max(300,innerHeight-top-bot)+'px';
      var q=f.getBoundingClientRect();
      if(Math.abs(q.left-left)>1)f.style.left=(left-(q.left-left))+'px';
      if(Math.abs(q.top-top)>1)f.style.top=(top-(q.top-top))+'px';
    });
    /* Eingebettete Seiten: Tableiste ohne herausragenden Mittelknopf, damit zwischen beiden Leisten kein Spalt bleibt */
    document.body.classList.toggle('emb-on',any);
  }
  window.addEventListener('resize',fit);
  setInterval(fit,500);
  document.addEventListener('click',function(){setTimeout(fit,350)},true);
  window.addEventListener('popstate',function(){setTimeout(fit,350)});
})();
const CHANGELOG=(function(){
  const KEY='bvi_seen_version';
  const _MON=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  function _fmtTs(ts){
    const d=new Date(ts);
    return`${d.getDate()}. ${_MON[d.getMonth()]} ${d.getFullYear()}`;
  }
  let ENTRIES=null;   // kommt aus js/changelog-data.js (erst beim Öffnen geladen)
  let _seen=null;     // zuletzt gesehene Version beim Öffnen (für die Markierung „Neu“, auch wenn die Daten erst später kommen)
  function _render(){
    const el=document.getElementById('changelog-feed');
    if(!el) return;
    if(!ENTRIES){
      el.textContent='Lade Update-Verlauf …';
      LAZY.script('js/changelog-data.js').then(()=>{ ENTRIES=CHANGELOG_ENTRIES; _render(); }).catch(()=>{ el.textContent='Der Update-Verlauf konnte nicht geladen werden. Bitte Verbindung prüfen.'; });
      return;
    }
    const seen=_seen;
    el.innerHTML=ENTRIES.map((e,i)=>{
      const isNew=i===0&&e.v!==seen;
      return`<div class="cl-entry${isNew?' cl-new':''}"><div class="cl-meta"><span class="cl-version">v${e.v}</span>${isNew?'<span class="cl-new-badge">Neu</span>':''}<span class="cl-date">${_fmtTs(e.ts)}</span></div><ul class="cl-items">${e.items.map(it=>`<li>${it}</li>`).join('')}</ul></div>`;
    }).join('');
  }
  function _updateTile(){
    const badge=document.getElementById('changelog-badge');
    const desc=document.getElementById('changelog-tile-desc');
    if(!badge) return;
    const seen=localStorage.getItem(KEY);
    if(seen!==APP_VERSION){
      badge.classList.remove('hidden');
      if(desc) desc.textContent='Neu in v'+APP_VERSION+' · Update-Verlauf';
    } else {
      badge.classList.add('hidden');
      if(desc) desc.textContent='Update-Verlauf · Was ist neu';
    }
  }
  return{
    open(){
      const m=document.getElementById('changelog-modal');
      if(!m) return;
      _seen=localStorage.getItem(KEY);
      _render();
      m.classList.remove('hidden');
      localStorage.setItem(KEY,APP_VERSION);
      _updateTile();
      document.getElementById('m-cl-badge')?.classList.add('hidden');
      document.getElementById('m-cl-badge2')?.classList.add('hidden');
    },
    close(){
      document.getElementById('changelog-modal').classList.add('hidden');
    },
    check(){
      _updateTile();
    },
    isNew(){
      try{ return localStorage.getItem(KEY)!==APP_VERSION; }catch(e){ return false; }
    }
  };
})();

/* ======================================================================
   RELATED – Themenübergreifende Verlinkung
====================================================================== */
const RELATED={
  'v-hlfs-fuehrungsvorgang':[['v-sfs-fwdv3','SFS Führung/FwDV3'],['v-ibk-konflikt','IBK Konflikt'],['v-ibk-ta','IBK TA']],
  'v-hlfs-gabc':[['v-gal-atemgifte','GAL Atemgifte'],['v-gal-gabc','GAL G-ABC'],['v-sfs-abc','SFS Geräte/ABC']],
  'v-hlfs-vb':[['v-gal-vb','GAL Vorbeugen'],['v-idf-vb','IdF VB']],
  'v-hlfs-manv':[['v-gal-erstehilfe','GAL Erste Hilfe'],['v-ibk-psnv','IBK PSNV']],
  'v-hlfs-zugfuehrer':[['v-sfs-fwdv3','SFS FwDV3/Führung'],['v-hlfs-fuehrungsvorgang','HLFS Führungsvorgang'],['v-ibk-zeit','IBK Zeitmanagement']],
  'v-hlfs-stab':[['v-idf-stabhub','IdF Stabsarbeit'],['v-ibk-pm','IBK PM'],['v-ibk-zeit','IBK Zeitmanagement']],
  'v-hlfs-tunnel':[['v-gal-atemschutz','GAL Atemschutz']],
  'v-ibk-ta':[['v-ibk-konflikt','IBK Konflikt'],['v-sfs-methodik','SFS Methodik'],['v-ibk-stress','IBK Stress']],
  'v-ibk-konflikt':[['v-ibk-ta','IBK TA'],['v-ibk-stress','IBK Stress'],['v-hlfs-fuehrungsvorgang','HLFS Führung']],
  'v-ibk-stress':[['v-ibk-psnv','IBK PSNV'],['v-ibk-bgm','IBK BGM'],['v-ibk-konflikt','IBK Konflikt']],
  'v-ibk-psnv':[['v-ibk-stress','IBK Stress'],['v-hlfs-manv','HLFS MANV']],
  'v-ibk-bgm':[['v-ibk-stress','IBK Stress'],['v-ibk-psnv','IBK PSNV']],
  'v-ibk-pm':[['v-hlfs-stab','HLFS Stab'],['v-idf-stabhub','IdF Stabsarbeit'],['v-ibk-zeit','IBK Zeitmanagement'],['v-feuak-pm','FeuAK PM']],
  'v-ibk-zeit':[['v-ibk-pm','IBK PM'],['v-hlfs-zugfuehrer','HLFS Zugführer']],
  'v-vak-verwaltungsrecht':[['v-vak-staatsrecht','Staatsrecht'],['v-vak-einsatzrecht','Einsatzrecht'],['v-vak-dienstrecht','Dienstrecht'],['v-vak-altklausur','Altklausur-Quiz']],
  'v-vak-staatsrecht':[['v-vak-verwaltungsrecht','Verwaltungsrecht'],['v-gal-staatsbuerger','GAL Staatsbürgerkunde']],
  'v-vak-einsatzrecht':[['v-vak-verwaltungsrecht','Verwaltungsrecht'],['v-gal-hbkg','GAL HBKG'],['v-vak-altklausur','Altklausur-Quiz']],
  'v-vak-dienstrecht':[['v-vak-verwaltungsrecht','Verwaltungsrecht'],['v-gal-beamtenrecht','GAL Beamtenrecht'],['v-vak-altklausur','Altklausur-Quiz']],
  'v-vak-altklausur':[['v-vak-verwaltungsrecht','Verwaltungsrecht'],['v-vak-einsatzrecht','Einsatzrecht'],['v-vak-dienstrecht','Dienstrecht'],['v-vak-staatsrecht','Staatsrecht']],
  'v-vak-jur-denken':[['v-vak-verwaltungsrecht','Verwaltungsrecht'],['v-vak-einsatzrecht','Einsatzrecht']],
  'v-feuak-vwl':[['v-feuak-haushalt','FeuAK Haushalt'],['v-feuak-pm','Strategisches Management']],
  'v-feuak-haushalt':[['v-feuak-vwl','FeuAK VWL'],['v-feuak-qm','Qualitätsmanagement']],
  'v-feuak-qm':[['v-feuak-haushalt','Haushalt'],['v-feuak-bedarfsplanung','Bedarfsplanung']],
  'v-feuak-pm':[['v-ibk-pm','IBK PM'],['v-ibk-zeit','IBK Zeitmanagement'],['v-feuak-bedarfsplanung','Bedarfsplanung']],
  'v-feuak-planspiel':[['v-hlfs-manv','HLFS MANV & OLRD'],['v-feuak-altklausur','Altklausur']],
'v-idf-vb-41':[['v-hlfs-vb','HLFS VB'],['v-gal-vb','GAL Vorbeugen']],
  'v-idf-vb-42':[['v-hlfs-vb','HLFS VB'],['v-gal-vb','GAL Vorbeugen']],
  'v-idf-vb-43':[['v-hlfs-vb','HLFS VB'],['v-gal-vb','GAL Vorbeugen']],
  'v-idf-vb-44':[['v-hlfs-vb','HLFS VB'],['v-gal-vb','GAL Vorbeugen']],
  'v-idf-vb-45':[['v-hlfs-vb','HLFS VB'],['v-gal-vb','GAL Vorbeugen']],
  'v-idf-vb-46':[['v-hlfs-vb','HLFS VB'],['v-gal-vb','GAL Vorbeugen']],
  'v-idf-vb-47':[['v-hlfs-vb','HLFS VB'],['v-gal-vb','GAL Vorbeugen']],
'v-idf-s51':[['v-hlfs-stab','HLFS Stab'],['v-ibk-pm','IBK PM']],
  'v-idf-s52':[['v-hlfs-stab','HLFS Stab'],['v-ibk-pm','IBK PM']],
  'v-idf-s53':[['v-hlfs-stab','HLFS Stab'],['v-ibk-pm','IBK PM']],
  'v-idf-s54':[['v-hlfs-stab','HLFS Stab'],['v-ibk-pm','IBK PM']],
  'v-idf-s55':[['v-hlfs-stab','HLFS Stab'],['v-ibk-pm','IBK PM']],
  'v-idf-p61':[['v-ibk-konflikt','IBK Konflikt'],['v-ibk-ta','IBK TA']],
  'v-idf-p62':[['v-ibk-konflikt','IBK Konflikt'],['v-ibk-ta','IBK TA']],
  'v-sfs-fwdv3':[['v-hlfs-zugfuehrer','HLFS Zugführer'],['v-hlfs-fuehrungsvorgang','HLFS Führungsvorgang']],
  'v-sfs-methodik':[['v-ibk-ta','IBK TA'],['v-ibk-stress','IBK Stress'],['v-hlfs-fuehrungsvorgang','HLFS Führung']],
  'v-sfs-rechtsgrundlagen':[['v-vak-verwaltungsrecht','VAk Verwaltungsrecht'],['v-vak-einsatzrecht','VAk Einsatzrecht']],
  'v-gal-beamtenrecht':[['v-vak-dienstrecht','VAk Dienstrecht'],['v-gal-beihilferecht','GAL Beihilferecht']],
  'v-gal-hbkg':[['v-vak-einsatzrecht','VAk Einsatzrecht']],
  'v-gal-vb':[['v-hlfs-vb','HLFS VB'],['v-idf-vb','IdF VB']],
  'v-gal-staatsbuerger':[['v-vak-staatsrecht','VAk Staatsrecht']],
  'v-gal-gabc':[['v-hlfs-gabc','HLFS GABC'],['v-sfs-abc','SFS ABC']],
  'v-gal-atemschutz':[['v-hlfs-tunnel','HLFS Tunnel']],
  'v-gal-erstehilfe':[['v-hlfs-manv','HLFS MANV']],
};


/* ══════════════════════════════════════════════════════════════
   FALLBEARBEITUNG – 8-Punkte-Schema + Übungsfälle
══════════════════════════════════════════════════════════════ */
/* FALLBEARBEITUNG liegt in js/fallbearbeitung.js und wird beim Öffnen der Seite geladen */


/* ══════════════════════════════════════════════════════════════
   UEBUNGSKLAUSUR – Interaktive Übungsklausur Einsatzrecht
══════════════════════════════════════════════════════════════ */
const UEBUNGSKLAUSUR = (function(){
  const KEY = 'bvi_uk_scores';
  let _step=0, _revealed=false, _timerOn=false, _timeLeft=3600, _timerRef=null;
  let _scores={};

  const CONTEXTS = {
    bhkg27:'<div class="uk-context"><span class="uk-ctx-label">§ 27 BHKG – Brandsicherheitswachen (Abs. 1):</span> Veranstaltungen, bei denen eine erhöhte Brandgefahr besteht und bei Ausbruch eines Brandes eine große Anzahl von Personen gefährdet ist, sind der Gemeinde rechtzeitig anzuzeigen. Die Gemeinde entscheidet über eine Brandsicherheitswache und kann Auflagen erteilen.<br><br><span class="uk-ctx-label">Situation:</span> Als Mitarbeiter der Gemeinde bearbeiten Sie den Antrag von Herrn Meyer (Veranstaltung fällt unter §27 Abs. 1 BHKG). Ergebnis: Herr Meyer muss 3 Brandsicherheitswachen stellen. Herr Meyer wurde angehört und hat Widerspruch angekündigt.</div>',
    pkw:'<div class="uk-context"><span class="uk-ctx-label">Sachverhalt:</span> Bei Tiefbauarbeiten im öffentlichen Straßenland rutscht durch abgleitendes Erdreich ein falsch parkender PKW in die Baugrube. Es befinden sich keine Personen mehr im PKW. Nach Erkundung: Keine auslaufenden Betriebsstoffe.</div>',
    brand:'<div class="uk-context"><span class="uk-ctx-label">Sachverhalt:</span> Alarmierung zu einem Wohn- und Geschäftshaus wegen intensivem Brandrauchgeruch. Im Keller zwei Türen: <strong>Links</strong> – stark gesicherte Kellertür einer geschlossenen Wein- und Zigarrenhandlung (kein Ansprechpartner). <strong>Rechts</strong> – Keller des meldenden Mieters. Dieser verweigert den Zutritt mit der Begründung, er habe seinen Keller bereits kontrolliert. Der Geruch wird im Keller stärker.</div>'
  };

  const QUESTIONS = [
    {
      id:1, nr:'Frage 1', punkte:1, ctx:'bhkg27',
      text:'Welche Form des Verwaltungshandelns wählen Sie, um Herrn Meyer über Ihre Entscheidung zu informieren?',
      answer:'<strong>Verwaltungsakt mit Nebenbestimmung</strong> – konkret eine <strong>Auflage</strong> gem. §36 Abs. 2 Nr. 4 VwVfG i.V.m. §27 Abs. 1 S. 2–3 BHKG.<br><br>Die Gemeinde erlässt einen schriftlichen Bescheid (§37 Abs. 3 VwVfG), der die Zulassung der Veranstaltung mit der Auflage verbindet, drei Brandsicherheitswachen zu stellen. Die Auflage begründet eine selbstständige, vollstreckbare Pflicht.'
    },
    {
      id:2, nr:'Frage 2', punkte:5, ctx:'bhkg27',
      text:'Was sind die wesentlichen Merkmale der gewählten Handlungsform?',
      answer:'Ein <strong>Verwaltungsakt (§35 VwVfG)</strong> muss alle 6 Merkmale kumulativ erfüllen:<ol><li><strong>Hoheitliche Maßnahme</strong> – Die Gemeinde handelt einseitig mit Entscheidungscharakter (Verfügung/Bescheid), nicht auf Augenhöhe wie bei einem Vertrag.</li><li><strong>Einer Behörde</strong> – Die Gemeinde ist Träger öffentlicher Verwaltung und handelt als zuständige Behörde nach BHKG.</li><li><strong>Auf dem Gebiet des öffentlichen Rechts</strong> – Die Maßnahme stützt sich auf §27 BHKG (öffentliches Sonderrecht), nicht auf Zivilrecht.</li><li><strong>Regelung</strong> – Die Auflage begründet unmittelbar eine Pflicht für Herrn Meyer; bloße Auskünfte ohne Bindungswirkung sind keine Regelung.</li><li><strong>Eines Einzelfalls</strong> – Die Auflage richtet sich konkret-individuell an Herrn Meyer (nicht generell-abstrakt wie ein Gesetz).</li><li><strong>Mit Außenwirkung</strong> – Die Auflage trifft Herrn Meyer direkt als Bürger; behördeninterne Weisungen haben keine Außenwirkung und sind kein VA.</li></ol>'
    },
    {
      id:3, nr:'Frage 3', punkte:4, ctx:'bhkg27',
      text:'Welche Möglichkeit haben Sie bei der Erteilung Ihrer Auflage, die eine Umsetzung trotz des angekündigten Widerspruchs sicherstellt? Was müssen Sie dabei beachten?',
      answer:'<strong>Anordnung der sofortigen Vollziehung</strong> gem. §80 Abs. 2 Nr. 4 VwGO.<br><br><strong>Ausgangslage:</strong> Widerspruch und Anfechtungsklage haben grundsätzlich aufschiebende Wirkung (§80 Abs. 1 VwGO). Der angekündigte Widerspruch würde die Auflage zunächst nicht vollziehbar machen.<br><br><strong>Zu beachten:</strong><ul><li><strong>Besonderes öffentliches Interesse</strong> muss vorliegen (hier: Brandschutz und Sicherheit der Veranstaltungsbesucher).</li><li><strong>Schriftliche Begründung</strong> zwingend erforderlich (§80 Abs. 3 S. 1 VwGO) – das besondere Vollziehungsinteresse muss konkret dargelegt werden; Formeln genügen nicht.</li><li>Die Anordnung kann direkt in den Bescheid aufgenommen werden.</li><li>Herr Meyer kann beim Verwaltungsgericht Antrag auf <strong>Wiederherstellung der aufschiebenden Wirkung</strong> stellen (§80 Abs. 5 VwGO).</li></ul>'
    },
    {
      id:4, nr:'Frage 4', punkte:5, ctx:null,
      text:'Wann liegt eine Gefahr im Sinne des Gefahrenabwehrrechts vor?',
      answer:'Eine <strong>Gefahr</strong> liegt vor, wenn bei <strong>ungehindertem Fortgang der Ereignisse</strong> mit <strong>hinreichender Wahrscheinlichkeit</strong> ein <strong>Schaden</strong> für ein polizeiliches Schutzgut (öffentliche Sicherheit/Ordnung – insbes. Leben, Gesundheit, Eigentum) eintreten wird.<br><br>Maßgeblich ist eine <strong>ex-ante-Betrachtung</strong> aus Sicht eines sorgfältigen, sachkundigen Beamten zum Zeitpunkt des Handelns – nicht die nachträgliche Beurteilung.<br><br>Das erforderliche Maß der Wahrscheinlichkeit richtet sich nach der <strong>Schwere des drohenden Schadens</strong> (umgekehrt proportionales Verhältnis): Je gewichtiger das bedrohte Rechtsgut, desto geringere Wahrscheinlichkeit genügt.'
    },
    {
      id:5, nr:'Frage 5', punkte:5, ctx:null,
      text:'Erklären Sie den Unterschied zwischen einer konkreten Gefahr und einer Anscheinsgefahr und erläutern Sie kurz, was bei der Anscheinsgefahr zu beachten ist.',
      answer:'<strong>Konkrete Gefahr:</strong> Eine auf den tatsächlichen Umständen des Einzelfalls beruhende, hinreichend wahrscheinliche Schädigung eines Schutzguts – sowohl ex-ante als auch ex-post liegt die gefährliche Sachlage tatsächlich vor.<br><br><strong>Anscheinsgefahr:</strong> Eine Sachlage, die bei verständiger ex-ante-Beurteilung als konkrete Gefahr erscheint, sich aber ex-post als ungefährlich herausstellt (die Gefahr war nur scheinbar vorhanden).<br><br><strong>Bei der Anscheinsgefahr zu beachten:</strong><ul><li>Die Maßnahme bleibt <strong>rechtmäßig</strong>, wenn die ex-ante-Einschätzung des sorgfältigen, sachkundigen Beamten vertretbar war.</li><li>Maßgeblich ist ausschließlich die <strong>ex-ante-Perspektive</strong>; ex-post-Erkenntnisse ändern die Rechtmäßigkeit nicht.</li><li>Liegt eine <strong>Putativgefahr</strong> vor (Behörde hätte bei sorgfältiger Prüfung erkannt, dass keine Gefahr bestand), ist die Maßnahme rechtswidrig.</li></ul>'
    },
    {
      id:6, nr:'Frage 6', punkte:10, ctx:null,
      text:'Welche Funktion haben die Grundrechte? Mit welchen Grundrechten haben Sie es ggf. im Feuerwehreinsatz zu tun? Unter welchen Voraussetzungen können Grundrechte eingeschränkt werden? Gilt das für alle Grundrechte?',
      answer:'<strong>Funktionen der Grundrechte:</strong><ul><li><strong>Abwehrrechte</strong> (primäre Funktion): Schutz des Bürgers vor staatlichen Eingriffen</li><li><strong>Staatliche Schutzpflichten</strong>: Staat muss Bürger vor Grundrechtsverletzungen durch Dritte schützen</li><li><strong>Institutionelle Garantien</strong>: Schutz von Einrichtungen (z.B. Ehe und Familie, Art. 6 GG)</li><li><strong>Objektive Wertordnung</strong>: Grundrechte strahlen auf die gesamte Rechtsordnung aus</li></ul><strong>Im Feuerwehreinsatz relevant (gem. §48 BHKG):</strong><ul><li><strong>Art. 2 Abs. 1 i.V.m. Art. 1 Abs. 1 GG</strong>: Informationelle Selbstbestimmung</li><li><strong>Art. 2 Abs. 2 S. 1 GG</strong>: Recht auf körperliche Unversehrtheit</li><li><strong>Art. 2 Abs. 2 S. 2 GG</strong>: Freiheit der Person – z.B. bei Sperrmaßnahmen</li><li><strong>Art. 13 GG</strong>: Unverletzlichkeit der Wohnung – Eingriff gem. §44 Abs. 2 BHKG i.V.m. Art. 13 Abs. 7 GG</li></ul><strong>Voraussetzungen der Einschränkung:</strong><ul><li><strong>Gesetzesvorbehalt</strong>: Nur durch Gesetz oder aufgrund eines Gesetzes (Art. 19 Abs. 1 S. 1 GG)</li><li><strong>Verhältnismäßigkeit</strong>: Legitimer Zweck, Geeignetheit, Erforderlichkeit, Angemessenheit</li><li><strong>Wesensgehaltsgarantie</strong>: Kernbestand darf nicht angetastet werden (Art. 19 Abs. 2 GG)</li><li><strong>Zitiergebot</strong>: Das eingeschränkte Grundrecht muss im Gesetz benannt sein (Art. 19 Abs. 1 S. 2 GG)</li></ul><strong>Gilt nicht für alle:</strong> Nein – Art. 1 Abs. 1 GG (<strong>Menschenwürde</strong>) ist absolutes, einschränkungsfestes Grundrecht.'
    },
    {
      id:7, nr:'Frage 7', punkte:4, ctx:null,
      text:'Nennen Sie die vier Gründe, aus denen entsprechend der Festlegungen des BVerfG eine Nebentätigkeit untersagt werden kann.',
      answer:'Entsprechend den Festlegungen des BVerfG kann eine Nebentätigkeit untersagt werden, wenn:<ol><li>Die <strong>Arbeitskraft</strong> des Beamten beeinträchtigt wird (zeitliche oder körperliche Überlastung)</li><li>Eine <strong>Pflichtenkollision</strong> besteht (die Nebentätigkeit steht im Widerspruch zu dienstlichen Pflichten)</li><li>Das <strong>Ansehen des Berufsbeamtentums</strong> geschädigt wird</li><li><strong>Staatliche oder fiskalische Interessen</strong> berührt werden</li></ol>'
    },
    {
      id:8, nr:'Frage 8', punkte:9, ctx:'pkw',
      text:'Prüfen Sie, ob hier eine Gefahr vorliegt, deren Beseitigung in den Aufgabenbereich der Feuerwehr fällt. Sofern nicht: Skizzieren Sie kurz, worauf Sie beim Verlassen der Einsatzstelle achten sollten.',
      answer:'<strong>Prüfung gem. §1 Abs. 1 BHKG:</strong><ul><li>Keine Personen im PKW → keine Menschenrettung erforderlich</li><li>Keine auslaufenden Betriebsstoffe → keine Umweltgefährdung</li><li>Kein Brand und kein Brandrisiko erkennbar</li><li>PKW in Baugrube → reiner Sachschaden ohne akute Gefahr für öffentliche Sicherheit</li></ul><strong>Ergebnis:</strong> Kein Feuerwehreinsatz. Das Bergen des PKW fällt nicht in den Aufgabenbereich der Feuerwehr. Zuständig: Eigentümer/Versicherung (Abschleppunternehmer), Polizei, Ordnungsamt, Straßenverkehrsbehörde.<br><br><strong>Beim Verlassen zu beachten:</strong><ul><li><strong>Absicherung</strong>: Gefahrenbereich absperren (offene Baugrube = Gefahrenstelle für Verkehr und Fußgänger)</li><li><strong>Zuständige Stellen informieren</strong>: Polizei, Ordnungsamt, Straßenverkehrsbehörde</li><li><strong>Verantwortliche benachrichtigen</strong>: Bauherr/Bauleitung, ggf. Fahrzeugeigentümer</li><li><strong>Dokumentation</strong>: Einsatzbericht mit Feststellungen und Begründung</li><li>Übergabe an zuständige Stelle sicherstellen, bevor die Feuerwehr abrückt</li></ul>'
    },
    {
      id:9, nr:'Frage 9 (a–c)', punkte:9, ctx:'brand',
      text:'a) Dürfen Sie den Keller der Gewerbeeinheit (links) gewaltsam öffnen? Welche Voraussetzungen müssen vorliegen? b) Dürfen Sie den Keller des Mieters (rechts) gegen seinen Willen betreten? c) Was müssen Sie beim Verlassen beachten?',
      answer:'<strong>a) Gewerbekeller (links) gewaltsam öffnen – Ja</strong>, gem. §44 Abs. 2 BHKG i.V.m. Art. 13 Abs. 7 GG.<br>Voraussetzungen: <strong>Anscheinsgefahr</strong> liegt vor – intensiver, stärker werdender Brandrauchgeruch ergibt ex-ante die begründete Annahme einer konkreten Brandgefahr. Art. 13 GG gilt auch für Geschäftsräume; Art. 13 Abs. 7 GG erlaubt den Eingriff durch Gesetz (§44 Abs. 2 BHKG). Da die Gewerbeeinheit geschlossen und kein Adressat vorhanden ist, handelt die Feuerwehr als <strong>Realakt</strong>. Verhältnismäßigkeit: gewalt. Öffnung als einzig verfügbares Erkundungsmittel – geeignet, erforderlich, angemessen.<br><br><strong>b) Keller des Mieters (rechts) – Ja</strong>, gem. §44 Abs. 2 BHKG i.V.m. Art. 13 Abs. 7 GG.<br>Die Aussage des Mieters reicht nicht aus, die Anscheinsgefahr auszuschließen. Mündliche <strong>Duldungsanordnung</strong> (VA gem. §35 VwVfG): „Sie dulden das Betreten Ihres Kellers nach §44 Abs. 2 BHKG." Bei weiterer Weigerung: unmittelbarer Zwang gem. §44 Abs. 2 BHKG.<br><br><strong>c) Beim Verlassen:</strong><ul><li>Geöffnete Räume sichern und wieder provisorisch verschließen</li><li>Eigentümer/Vermieter/Hausverwaltung benachrichtigen (insb. für den Gewerbekeller)</li><li>Vollständige Dokumentation im Einsatzbericht (Maßnahmen, Rechtsgrundlagen, Gründe, Zeitpunkte)</li><li>Sicherstellen, dass keine Gefahrenursache zurückbleibt (Glutnester, techn. Defekte)</li><li>Meldenden Mieter über das Ergebnis informieren</li></ul>'
    }
  ];

  const TOTAL_PTS = QUESTIONS.reduce(function(s,q){return s+q.punkte;},0);

  function loadScores(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  function saveScores(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} }
  function scoreKey(id){ return 'q'+id; }
  function fmtTime(s){ return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }

  function startTimer(){
    if(_timerRef) return;
    _timerOn=true;
    _timerRef=setInterval(function(){
      if(_timeLeft>0){ _timeLeft--; updateTimerDisplay(); }
      else{ stopTimer(); var el=document.getElementById('uk-timer'); if(el) el.style.color='#ef4444'; }
    },1000);
    updateTimerDisplay();
  }

  function stopTimer(){
    if(_timerRef){ clearInterval(_timerRef); _timerRef=null; }
    _timerOn=false;
  }

  function updateTimerDisplay(){
    var el=document.getElementById('uk-timer-val'); if(el) el.textContent=fmtTime(_timeLeft);
    var el2=document.getElementById('uk-timer-val2'); if(el2) el2.textContent=fmtTime(_timeLeft);
    var btn=document.getElementById('uk-timer-btn'); if(btn) btn.textContent=_timerOn?'⏸ Pausieren':'▶ Timer starten';
  }

  function dotsHtml(){
    return QUESTIONS.map(function(q,i){
      var sc=_scores[scoreKey(q.id)];
      var cls='fb-dot'+(i===_step?' fb-dot-active':sc!==undefined?' fb-dot-done':'');
      return '<span class="'+cls+'" onclick="UEBUNGSKLAUSUR.goToQ('+i+')" title="Zu Frage '+(i+1)+' springen">'+(i+1)+'</span>';
    }).join('');
  }

  function renderStart(){
    var el=document.getElementById('uk-content'); if(!el) return;
    _scores=loadScores();
    var scored=QUESTIONS.filter(function(q){return _scores[scoreKey(q.id)]!==undefined;});
    var totalScored=scored.reduce(function(s,q){return s+(_scores[scoreKey(q.id)]||0);},0);
    var progress=scored.length;
    var overviewRows=QUESTIONS.map(function(q){
      var pts=_scores[scoreKey(q.id)];
      var done=pts!==undefined;
      var ptsHtml=done?('<span class="uk-q-pts-got">'+pts+'/'+q.punkte+'</span>'):'<span class="uk-q-pts-open">–</span>';
      return '<div class="uk-q-row'+(done?' uk-q-done':'')+'" onclick="UEBUNGSKLAUSUR.goToQ('+(q.id-1)+')"><span class="uk-q-nr">'+q.nr+'</span><span class="uk-q-pts-max">'+q.punkte+' Pkt.</span>'+ptsHtml+'</div>';
    }).join('');
    var progressHtml=progress>0?('<div class="uk-progress-row"><span>Fortschritt: '+progress+'/'+QUESTIONS.length+' bewertet</span><span>'+totalScored+'/'+TOTAL_PTS+' Punkte ('+Math.round(totalScored/TOTAL_PTS*100)+' %)</span></div>'):'';
    var resetBtn=progress>0?'<button class="uk-timer-reset" style="margin-left:auto" onclick="UEBUNGSKLAUSUR.resetAll()">↺ Neu beginnen</button>':'';
    var resultBtn=progress===QUESTIONS.length?'<button class="uk-result-btn" onclick="UEBUNGSKLAUSUR.showResult()">Auswertung anzeigen</button>':'';
    var timerResetBtn=_timeLeft<3600?'<button class="uk-timer-reset" onclick="UEBUNGSKLAUSUR.resetTimer()">↺ Zurücksetzen</button>':'';
    el.innerHTML='<div class="uk-start"><div class="uk-intro-box"><div class="uk-intro-title">Übungsklausur · Einsatzrecht</div><div class="uk-intro-meta">'+QUESTIONS.length+' Fragen · '+TOTAL_PTS+' Punkte · Bearbeitungszeit: 60 Min.</div><div class="uk-intro-desc">Bearbeite jede Frage im Freitextfeld, zeige dann die Musterlösung an und bewerte dich selbst. Am Ende erhältst du deine Gesamtpunktzahl.</div></div><div class="uk-timer-box"><span id="uk-timer">⏱ <span id="uk-timer-val">'+fmtTime(_timeLeft)+'</span></span><button id="uk-timer-btn" class="uk-timer-toggle" onclick="UEBUNGSKLAUSUR.toggleTimer()">'+(_timerOn?'⏸ Pausieren':'▶ Timer starten')+'</button>'+timerResetBtn+resetBtn+'</div><div class="uk-q-overview">'+overviewRows+'</div>'+progressHtml+'<button class="uk-start-btn" onclick="UEBUNGSKLAUSUR.goToQ(0)">'+(progress>0?'Klausur fortsetzen →':'Klausur beginnen →')+'</button>'+resultBtn+'</div>';
  }

  function renderQuestion(){
    var el=document.getElementById('uk-content'); if(!el) return;
    _scores=loadScores();
    var q=QUESTIONS[_step];
    var savedTa=_scores['ta_q'+q.id]||'';
    var myPts=_scores[scoreKey(q.id)];
    var scoreBtns=Array.from({length:q.punkte+1},function(_,i){return '<button class="uk-score-btn'+(myPts===i?' uk-score-active':'')+'" onclick="UEBUNGSKLAUSUR.setScore('+i+')">'+i+'</button>';}).join('');
    var scoreGot=myPts!==undefined?('<span class="uk-score-got">'+myPts+'/'+q.punkte+' Pkt. gespeichert</span>'):'';
    var ctxHtml=q.ctx?CONTEXTS[q.ctx]:'';
    var prevBtn=_step===0?'':'<button class="fb-prev-btn" onclick="UEBUNGSKLAUSUR.prevQ()">← Zurück</button>';
    var nextLabel=_step===QUESTIONS.length-1?'Auswertung →':'Nächste Frage →';
    var nextFn=_step===QUESTIONS.length-1?'UEBUNGSKLAUSUR.showResult()':'UEBUNGSKLAUSUR.nextQ()';
    el.innerHTML='<div class="uk-q-header"><button class="uk-back-btn" onclick="UEBUNGSKLAUSUR.showStart()">← Übersicht</button><span class="uk-q-badge">'+q.nr+' · '+q.punkte+(q.punkte===1?' Punkt':' Punkte')+'</span><span class="uk-timer-inline">⏱ <span id="uk-timer-val2">'+fmtTime(_timeLeft)+'</span></span></div>'+ctxHtml+'<div class="uk-question"><p>'+q.text+'</p></div><textarea class="fb-textarea" id="uk-ta" placeholder="Schreibe deine Antwort hier…" rows="6">'+xss(savedTa)+'</textarea><button class="fb-reveal-btn'+(_revealed?' hidden':'')+'" id="uk-reveal" onclick="UEBUNGSKLAUSUR.reveal()">Musterlösung anzeigen</button><div class="fb-answer'+(_revealed?'':' hidden')+'" id="uk-answer">'+q.answer+'</div><div class="uk-score-row'+(_revealed?'':' hidden')+'" id="uk-score-row"><span class="uk-score-label">Meine Punkte:</span><div class="uk-score-btns">'+scoreBtns+'</div>'+scoreGot+'</div><div class="fb-step-actions">'+prevBtn+'<button class="fb-next-btn" onclick="'+nextFn+'">'+nextLabel+'</button></div><div class="fb-step-dots">'+dotsHtml()+'</div>';
  }

  function renderResult(){
    var el=document.getElementById('uk-content'); if(!el) return;
    stopTimer();
    _scores=loadScores();
    var total=QUESTIONS.reduce(function(s,q){return s+(_scores[scoreKey(q.id)]||0);},0);
    var pct=Math.round(total/TOTAL_PTS*100);
    var grade=pct>=90?'Sehr gut':pct>=80?'Gut':pct>=70?'Befriedigend':pct>=60?'Ausreichend':'Nicht bestanden';
    var gradeCol=pct>=60?'#4ACD90':'#ef4444';
    var rows=QUESTIONS.map(function(q){
      var got=_scores[scoreKey(q.id)];
      var done=got!==undefined;
      var col=done?(got===q.punkte?'#4ACD90':got>0?'var(--c-gold)':'#ef4444'):'var(--c-slate-l)';
      return '<tr><td>'+q.nr+'</td><td>'+q.punkte+'</td><td style="color:'+col+';">'+(done?got:'–')+'</td><td><button class="uk-jump-btn" onclick="UEBUNGSKLAUSUR.goToQ('+(q.id-1)+')">→</button></td></tr>';
    }).join('');
    el.innerHTML='<div class="uk-result"><div class="uk-result-header">Auswertung</div><div class="uk-result-score" style="color:'+gradeCol+';">'+total+' / '+TOTAL_PTS+' Punkte</div><div class="uk-result-pct" style="color:'+gradeCol+';">'+pct+' % – '+grade+'</div><div class="uk-result-bar"><div class="uk-result-fill" style="width:'+pct+'%;background:'+gradeCol+';"></div></div><table class="uk-result-table"><thead><tr><th>Frage</th><th>Max.</th><th>Erreicht</th><th></th></tr></thead><tbody>'+rows+'</tbody></table><div class="uk-result-actions"><button class="uk-start-btn" onclick="UEBUNGSKLAUSUR.showStart()">← Zur Übersicht</button><button class="uk-reset-btn" onclick="UEBUNGSKLAUSUR.resetAll()">Neu beginnen</button></div></div>';
  }

  return {
    init:function(){
      _scores=loadScores();
      this.showStart();
    },
    showStart:function(){
      _step=0; _revealed=false;
      renderStart();
    },
    goToQ:function(i){
      var ta=document.getElementById('uk-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      _step=i; _revealed=false;
      renderQuestion(); window.scrollTo({top:0,behavior:'instant'});
    },
    nextQ:function(){
      var ta=document.getElementById('uk-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      if(_step<QUESTIONS.length-1){_step++;_revealed=false;renderQuestion();window.scrollTo({top:0,behavior:'instant'});}
    },
    prevQ:function(){
      var ta=document.getElementById('uk-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      if(_step>0){_step--;_revealed=true;renderQuestion();window.scrollTo({top:0,behavior:'instant'});}
    },
    reveal:function(){
      var ta=document.getElementById('uk-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      _revealed=true;
      document.getElementById('uk-reveal')?.classList.add('hidden');
      document.getElementById('uk-answer')?.classList.remove('hidden');
      document.getElementById('uk-score-row')?.classList.remove('hidden');
    },
    setScore:function(pts){
      var d=loadScores();d[scoreKey(QUESTIONS[_step].id)]=pts;saveScores(d);_scores=d;
      renderQuestion();
      _revealed=true;
      document.getElementById('uk-answer')?.classList.remove('hidden');
      document.getElementById('uk-score-row')?.classList.remove('hidden');
    },
    showResult:function(){renderResult(); if(typeof GAME!=='undefined') GAME.cheer('pruefung','Klausurfragen');},
    toggleTimer:function(){
      if(_timerOn) stopTimer(); else startTimer();
      updateTimerDisplay();
    },
    resetTimer:function(){stopTimer();_timeLeft=3600;renderStart();},
    resetAll:function(){
      if(!confirm('Alle Antworten und Punkte zurücksetzen?')) return;
      localStorage.removeItem(KEY);_scores={};_step=0;_revealed=false;
      stopTimer();_timeLeft=3600;
      renderStart();
    }
  };
})();

/* ── IdF Münster Stundenplan Modul 3.5 ──────────────────────────────────── */
/* ── Heimadresse für „Abreise“: nur auf diesem Gerät. Sie steckt in keiner Sicherung, keinem Jahrgangs-Export und keiner Kalenderdatei
   (BACKUP.keep schließt sie aus, BACKUP.clean lehnt sie ab). ── */
const HOME=(function(){
  const KEY='bvi_heimadresse';
  let box=null;
  const get=()=>{ try{ return (localStorage.getItem(KEY)||'').slice(0,160); }catch(e){ return ''; } };
  const clean=v=>String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,160);
  const url=a=>'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='+encodeURIComponent(a);
  function build(){
    box=document.createElement('div'); box.id='hm-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Heimadresse');
    box.innerHTML='<div class="cu-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t" style="padding:0">Meine Heimadresse</div>'
      +'<p class="m-t2" style="margin:6px 0 12px">Mit ihr startet „Abreise“ im Stundenplan die Navigation nach Hause. Die Adresse bleibt nur auf diesem Gerät: Sie wird <strong>nicht gesichert und nicht exportiert</strong>.</p>'
      +'<label>Adresse<input id="hm-a" class="m-input" type="text" maxlength="160" autocomplete="street-address" placeholder="Straße Nr., PLZ Ort"></label>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button type="button" class="btn btn-gold" id="hm-s">Speichern</button><button type="button" class="btn btn-ghost" id="hm-d">Adresse löschen</button></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
    box.querySelector('#hm-s').onclick=()=>{ const v=clean(box.querySelector('#hm-a').value); if(!v){ box.querySelector('#hm-a').focus(); return; } try{ localStorage.setItem(KEY,v); }catch(e){} close(); TOAST.show('Heimadresse gespeichert',{type:'ok'}); };
    box.querySelector('#hm-d').onclick=()=>{ clear(); close(); TOAST.show('Heimadresse gelöscht',{type:'ok'}); };
    box.querySelector('#hm-a').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); box.querySelector('#hm-s').click(); } });
  }
  function edit(){
    if(!box) build();
    box.querySelector('#hm-a').value=get();
    box.querySelector('#hm-d').hidden=!get();
    box.hidden=false; box.querySelector('#hm-a').focus({preventScroll:true});
  }
  function close(){ if(!box||box.hidden) return; box.hidden=true; if(typeof IDF_PLAN!=='undefined') IDF_PLAN.redraw(); }
  function clear(){ try{ localStorage.removeItem(KEY); }catch(e){} }
  return {get,edit,url,clear};
})();

const IDF_PLAN = (function(){
  // Eintrag: "Zeit|Titel|Art|Raum|Hinweis" · Zeit = UE ("1-2") oder Uhrzeit ("09:00-09:15", "19:00", "EVA")
  // Art: hi = Schlüsseltermin, ex = Exkursion, ar = Anreise/Abreise/frei
  const UE_S=['07:45','08:30','09:45','10:30','11:30','12:15','14:00','14:45'];
  const UE_E=['08:30','09:15','10:30','11:15','12:15','13:00','14:45','15:30'];
  const TEL={
    spahl:[['Jörn Ruschenburg','-3202'],['Frank Spahlholz','-3223']],
    vb:[['Heiko Böcking','-2220'],['Joachim Achtert','-2213'],['Stephanie Vöge','-2222'],['E-Mail VB','vb@idf.nrw.de'],['Abwesenheiten melden','poststelle@idf.nrw.de']],
    babz:[['Christoph Schaaf (BABZ)','0228 99550-5205'],['Thorsten Ohm (BABZ)','-5206']]
  };
  const SG='Sachgebiete 1 bis 4|hi|C-205, C-213, C-214, C-215|in vier Gruppen rollierend';
  const VB1_G1=[
    ['1-2|Anreise|ar','3|Begrüßung|hi|C-1|Begrüßung durch den Direktor · Hemd/Krawatte','4|Einführung in das Teilmodul VB||B1-106','5-6|Rechtsgrundlagen Baurecht||B1-106','7-8|Gebäudeklassen||B1-106'],
    ['1-2|Baustoffnormung||B1-106','3-6|Bauliche Trennung||B1-106','7-8|Löschwasserversorgung||B1-106'],
    ['1-6|System Rettungswege||B1-106','7-8|Brandmeldeanlagen||B1-106','19:00|Vortrag @fire|hi|C-1|freiwillig'],
    ['1-2|Einführung Sonderbau||B1-106','3-6|Beherbergungsstätten||B1-106','7-8|Brandschutznachweis||B1-106'],
    ['1-4|Versammlungsstätten||B1-106','5-6|Löschanlagen||B1-106','7|Abreise|ar']];
  const VB1_G2=[
    ['1-2|Anreise|ar','3|Einführung in das Teilmodul VB||B1-106','4-5|Rechtsgrundlagen Baurecht||B1-106','6-7|Gebäudeklassen||B1-106','8|Baustoffnormung||B1-106'],
    ['1-4|Baustoffnormung||B1-106','5-6|Bauliche Trennung||B1-106','7-8|Löschwasserversorgung||B1-106'],
    VB1_G1[2].slice(0,2), VB1_G1[3], VB1_G1[4]];
  const VB2=(mi,doLast,fr)=>[
    ['1-2|Anreise|ar','3-6|Verkaufsstätten||B1-106','7-8|Einführung Stellungnahme||B1-106'],
    ['1-2|Stellungnahme Übung|hi|B1-106','3-5|Garagen||B1-106','6-8|Hochhäuser||B1-106'],
    ['1-4|Industriebau||B1-106','5-8|Brandschutzsachverständige||B1-106',...mi],
    ['07:45-ca. 11:00|Stellungnahme Übung|hi|B1-106','ca. 11:00-13:00|Aktuelles aus der Forschung||B1-106',doLast],
    fr];
  const SELBST=['ganztägig|Selbststudium|ar||Inhalt und Ort nach eigenem Ermessen'];
  const VB3_FR=['1-4|Leitung einer Brandschutzdienststelle||B1-106','5-6|Verabschiedung||B1-106|Evaluation der vergangenen drei Wochen','7|Abreise|ar'];
  const VB3_MO=['1-2|Anreise|ar','3-4|Pflege- und Betreuung||B1-106','5-8|Stellungnahme Übung|hi|B1-106','EVA|Vorbereitung Einsatzplanung'];
  const VB3_DI=['1-4|Einführung Brandverhütungsschau||B1-106','5-8|Brandverhütungsschau praktisch|hi||IdF NRW','EVA|Vorbereitung Exkursion anhand BSK'];
  const VB3_DO=['1-8|Veranstaltungssicherheit||B1-106|Orientierungsrahmen für Veranstaltungen im Freien'];
  const STAB1=(g)=>[
    g===1?['1-2|Anreise|ar','3|Begrüßung & Organisation||C-205','4-7|Führungslehre||C-205|Zwei-Stäbe-Modell · FwDV 100 · Führungsstufe D · Rollenverständnis','8|Kommunikation|||Nachrichtenvordruck · Lagedarstellung · Lagevortrag · Einsatztagebuch','EVA|Sachgebiet 4']
         :['1-2|Anreise|ar','3|Begrüßung|hi|C-1|Begrüßung durch den Direktor · Hemd/Krawatte · Vorstellungsrunde','4|Wochenorganisation||C-205','5-7|Führungslehre||C-205|Zwei-Stäbe-Modell · FwDV 100 · Führungsstufe D · Rollenverständnis · Lagedarstellung NRW','8|Kommunikation|||Nachrichtenvordruck · Lagedarstellung · Lagevortrag · Einsatztagebuch','EVA|Sachgebiet 4'],
    ['07:45-09:00|Führungslehre||C-205|'+(g===1?'Wiederholung Vortrag · Meldewesen · FB & Verbinder':'Meldewesen · Fachberater & Verbinder'),'09:00-09:15|Stationsausbildung|||gemeinsame Lageeinweisung','09:30-10:30|'+SG,'10:45-11:45|'+SG,'12:00-13:00|'+SG,'14:00-15:00|'+SG,'15:00-15:30|Aufbau|||Stabsräume „klein“','EVA|Sichter/Sichterin'],
    ['07:45-08:30|Innerer Dienst / Übernahme der EL|||gleitender Übergang zur Übung','08:30-12:15|Stabsrahmenübung »Waldbrand«|hi|'+(g===1?'C-204, C-205':'C-205, C-215')+'|Küchenwagen mitbringen','6|Übungsauswertung','14:00-15:00|Waldbrände||C-205|Einsatztaktiken · Einsatzmittel · Kooperation mit Forstbehörden','15:00-15:30|Rückbau|||Stabsräume „klein“',...(g===2?['19:00|Vortrag @fire|hi|C-1|freiwillig']:[]),'EVA|Führungsgrundsätze'],
    ['1-2|Sachgebiete 5 und 6||'+(g===1?'C-204, A3-28':'C-204, C-205')+'|in Halbgruppen im Wechsel · in zivil','3-8|Mars, Venus & Saturn||C-215|in zivil','EVA|Fayol'],
    ['1-5|Mars, Venus & Saturn (Fortsetzung)|||in zivil','6|Rekapitulation & Organisatorisches||'+(g===1?'C-215':'C-205'),'7|Abreise|ar']];
  const STAB2=(g)=>[
    ['1-2|Anreise|ar','3-8|Krisenstäbe||C-205|in zivil · Zuständigkeiten · Struktur · Methoden · Kooperation mit EL','EVA|Web-GIS||C-205'],
    ['07:45-12:30|Krisenstäbe||C-1|in zivil · Aufbau · Anwendungstraining · Nachbesprechung','13:30-17:00|Exkursion zur SAR-Leitstelle|ex||Hemd/Krawatte, ggf. Wetterschutz · fußläufig · Abmarsch 13:30 vor Gebäude C','EVA|KatS-Konzepte'],
    ['1|Wiederholung & Aufbau||C-205|Stabsraum „groß“','2-5|Stabsrahmenübung »Auswärtsspiel«|hi|C-205|Küchenwagen mitbringen','6|Übungsauswertung||C-205','7-8|Zusammenarbeit mit dem THW||C-205','EVA|Sachgebiet 3'],
    g===1?['1-5|Stabsrahmenübung »Zugunglück«|hi|C-205|Küchenwagen mitbringen','6|Übungsauswertung & Rückbau','7|Abreise|ar','EVA|LdS']
         :['1-5|Stabsrahmenübung »Zugunglück«|hi|C-205|Küchenwagen mitbringen','6|Übungsauswertung & Rückbau','7-8|EVA: EU-Katastrophenschutz','EVA|LdS'],
    g===1?SELBST:['1-6|EU-Katastrophenschutz|hi|C-205|beide Halbgruppen gemeinsam','7|Abreise|ar']];
  const PRESSE=(g)=>{
    const r=g===1?'C-215':'C-205';
    const wdr='13:30-ca. 17:00|Exkursion zum WDR-Studio|ex||zivil · Fahrt mit MTFs · Abfahrt 13:30, Parkplatz 2 · Ende in Dortmund';
    return [
      ['1-2|Anreise|ar','3|Begrüßung, Vorstellung der Woche||'+r,'4-8|Presserecht||'+r,...(g===2?['18:00|Kaminabend in Präsenz|hi||Gebäude C · zivil/leger · inkl. Catering']:[])],
      ['1|Einführung in die Pressearbeit||'+r,'2|Strategische Pressearbeit','3|Medien im Wandel||'+r,'4|Öffentlichkeitsarbeit','5|Wie arbeitet Presse?','6|Erwartungen eines Journalisten','13:30-18:00|Exkursion zur Villa ten Hompel|ex||zivil · fußläufig · Abmarsch 13:30 vor Gebäude C'],
      g===1?['1-7|Gr. A: Pressearbeit in der Krise, Pressekonferenzen|hi|C-215','1-7|Gr. B: Kameratraining|hi|C-204','8|Gruppenwechsel|||Fortsetzung']
           :['1-6|Gr. A: Pressearbeit in der Krise, Pressekonferenzen|hi|C-205','1-6|Gr. B: Kameratraining|hi|C-204',wdr],
      g===1?['1-6|Pressearbeit in der Krise / Kameratraining (Fortsetzung)',wdr]
           :['1|Pressearbeit in der Krise / Kameratraining (Fortsetzung)','2-8|Gruppenwechsel|||Fortsetzung'],
      ['1-2|Spontanhelfende||'+r,'3-4|Virtual Operations Support Team (VOST)||'+r,'5-6|Krisenkommunikation in der Privatwirtschaft||'+r+'|Evaluation der Woche','7|Abreise|ar']];
  };
  const W = [ // [KW, Woche, Thema, Montag, Gruppe, Tage Mo–Fr, Telefon, Hinweis]
    [44,1,'Vorbeugender Brandschutz 1','2026-10-26','g1',VB1_G1],
    [45,2,'Vorbeugender Brandschutz 2','2026-11-02','g1',VB2([],'EVA|EU-Katastrophenschutz',['1-6|EU-Katastrophenschutz|hi|C-205|beide Halbgruppen gemeinsam','7|Abreise|ar'])],
    [46,3,'Vorbeugender Brandschutz 3','2026-11-09','g1',[[...VB3_MO,'18:00|Kaminabend in Präsenz|hi||Gebäude C · zivil/leger · inkl. Catering'],VB3_DI,
      ['1-3|Exkursion Brandverhütungsschau praktisch|ex||extern · Poloshirt, Büroschuhe genügen','4-6|Brandverhütungsschaubericht||A3-25','7-8|Einsatzplanung||A3-25'],VB3_DO,VB3_FR]],
    [47,4,'Stab 1','2026-11-16','g1',STAB1(1),TEL.spahl],
    [48,5,'Stab 2','2026-11-23','g1',STAB2(1),TEL.spahl],
    [49,6,'Presse & Öffentlichkeitsarbeit','2026-11-30','g1',PRESSE(1),TEL.spahl],
    [44,1,'Stab 1','2026-10-26','g2',STAB1(2),TEL.spahl],
    [45,2,'Stab 2','2026-11-02','g2',STAB2(2),TEL.spahl],
    [46,3,'Presse & Öffentlichkeitsarbeit','2026-11-09','g2',PRESSE(2),TEL.spahl],
    [47,4,'Vorbeugender Brandschutz 1','2026-11-16','g2',VB1_G2],
    [48,5,'Vorbeugender Brandschutz 2','2026-11-23','g2',VB2(['EVA|Vorbereitung Stellungnahme für Freitag anhand Unterlagen'],'7|Abreise|ar',SELBST)],
    [49,6,'Vorbeugender Brandschutz 3','2026-11-30','g2',[VB3_MO,VB3_DI,
      ['1-6|Exkursion Brandverhütungsschau praktisch|ex||Poloshirt, Büroschuhe genügen · inkl. Brandverhütungsschaubericht','7-8|Einsatzplanung||B1-106'],VB3_DO,VB3_FR]],
    [50,7,'Zivile Verteidigung','2026-12-07','both',[
      ['bis 12:30|Anreise|ar||BABZ Ahrweiler, Ramersbacher Str. 95|babz',
       '12:45-13:30|Begrüßung & Organisatorisches|hi||Abteilungsleiter B (BABZ) · Seminaradministration, VS-NfD-Verpflichtung · Frank Meurer, Christoph Schaaf, Thorsten Ohm · Konferenzgebäude BABZ',
       '13:30-14:15|Einsatzkräfte im Zivilschutz|||Erfahrungsbericht aus der Ukraine · Felix Hecker · Konferenzgebäude BABZ',
       '14:45-16:15|Grundlagen Gesamtverteidigung & Gesamtszenario Zivile Verteidigung|||Verfassungs- und völkerrechtlicher Rahmen · Sicherheitspolitische Ziele und Interessen · Zivile Verteidigung und ihre vier Säulen · Eskalationsverlauf vom Frieden zur Landesverteidigung (Stufen I–IV: hybride Bedrohungen, Aufmarsch, Bündnis- und Landesverteidigung) · Gesetzeslage entlang des Eskalationsverlaufs · Alexander Esser, Robin Kwast · Konferenzgebäude BABZ',
       '16:15|Freie Zeit & Abendessen|ar||Zeit zur freien Verfügung',
       '18:00-ca. 19:30|Vortrag & Diskussion: Einfluss der Zeitenwende auf die Deutschen Feuerwehren|hi||angefragt · Frank Meurer, N.N. (Akademie für Verfassungsschutz), Christoph Schaaf, Thorsten Ohm · Konferenzgebäude BABZ'],
      ['08:30-09:15|KRITIS vor dem Hintergrund komplexer geopolitischer Herausforderungen|||Kritische & verteidigungswichtige Infrastruktur in Deutschland · Kommunale Perspektive auf Kritische Infrastrukturen · Stefan Mertens, Dr. Kai Fürstenberg · Konferenzgebäude BABZ',
       '09:15-10:00|Die Zivile Alarmplanung in Deutschland|||Reaktionsfähigkeit in Krisensituationen über Ressort- und Verwaltungsgrenzen hinweg · Josef Kanders · Konferenzgebäude BABZ',
       '10:15-11:45|Die Zivile Alarmplanung in Deutschland (Fortsetzung)|||Reaktionsfähigkeit in Krisensituationen über Ressort- und Verwaltungsgrenzen hinweg · Josef Kanders · Konferenzgebäude BABZ',
       '11:45-12:45|Mittagspause|ar||Konferenzgebäude BABZ',
       '12:45-14:15|Exkurs: Militärische Verteidigung|||Strukturen der Bundeswehr · Zivil-Militärische Zusammenarbeit in der Gesamtverteidigung · Der Operationsplan und die Drehscheibe Deutschland · OberstLt Erwin Langer, OberstLt Felix Schramm, BrdDir Nick Taubert · Konferenzgebäude BABZ',
       '14:45-16:15|Feuerwehren in der Zivilen Verteidigung|hi||Brandschutz der Bundeswehr · Nichtpolizeiliche Gefahrenabwehr: mögliche Szenarien · Einsatzgrundsätze und Informationsquellen · OberstLt Felix Schramm, BrdDir Nick Taubert, OberstLt Erwin Langer · Konferenzgebäude BABZ',
       '16:15|Freie Zeit & Abendessen|ar||Zeit zur freien Verfügung',
       'abends|Exkursion zum Gemeinsamen Melde- und Lagezentrum (GMLZ)|ex||Transfer zum BBK-Standort Bonn-Lengsdorf wird vom BBK sichergestellt · BBK L.6 · BBK Bonn-Lengsdorf'],
      ['08:30-10:00|Weißer Katastrophenschutz im Zivilschutz: Erfordernis einer breiten Ausbildung|||Erfordernis eines neuen Mindsets in Ausbildung und Planung · Neue Herausforderungen und Einsatzdimensionen · Fritjof Brüne · Konferenzgebäude BABZ',
       '10:15-11:45|C-B-RN in der Zivilen Verteidigung|||Einblick in die Risikoanalyse des Bundes · Kampfstoffe, Waffen, Wirkmittel · Dr. Jan Kämpen · Konferenzgebäude BABZ',
       '11:45-12:45|Mittagspause|ar||Konferenzgebäude BABZ',
       '12:45-14:15|Arbeiten an Stationen (Kleingruppen)|hi||Alle Stationen im Wechsel: Fähigkeitsmanagement von Bund und Ländern (FäM) · Psychosoziale Notfallversorgung für Einsatzkräfte unter Zivilschutzbedingungen · Möglichkeiten der Fernerkundung · Spezifische Aspekte des Warndienstes (angefragt) · Anne Eversheim, Fachzentrum Resilienz und Traumaprävention (FRT), Marie-Luise Kautz · Konferenzgebäude BABZ',
       '14:45-16:15|Arbeiten an Stationen (Fortsetzung)|hi||Alle Stationen im Wechsel: Fähigkeitsmanagement von Bund und Ländern (FäM) · Psychosoziale Notfallversorgung für Einsatzkräfte unter Zivilschutzbedingungen · Möglichkeiten der Fernerkundung · Spezifische Aspekte des Warndienstes (angefragt) · Konferenzgebäude BABZ',
       'abends|Abendverpflegung über Grillhütte|ar||Konferenzgebäude BABZ'],
      ['09:00-10:00|Vorstellung Gemeinsames Kompetenzzentrum Bevölkerungsschutz (GeKoB)|||Heiko Pereira Wolf · Konferenzgebäude BABZ',
       '10:15-11:45|Methode: World-Café|||Vorbereitung der Podiumsdiskussion: Vortragsinhalte mit der eigenen Berufserfahrung verschneiden · richtungsweisende Aspekte für die künftige Führungstätigkeit sammeln · Herausforderungen für die eigene Rolle in der Zivilen Verteidigung ableiten · Seminarteilnehmer in Kleingruppen · Konferenzgebäude BABZ',
       '11:45-12:45|Mittagspause|ar||Konferenzgebäude BABZ',
       '12:45-14:15|Podiumsdiskussion: Feuerwehren in der Zivilen Verteidigung|hi||Mathias Bessel (Deutscher Feuerwehrverband, AK ZMZ) · Frank Meurer (Abteilungsleiter BABZ) · Oberst i.G. Armin Schaus (J9 ZMZ, Operatives Führungskommando der Bundeswehr) · Heiko Pereira Wolf (Stv. Leitung GeKoB, Ländervertreter Thüringen) · Christoph Schaaf, Thorsten Ohm · Konferenzgebäude BABZ',
       '14:45-15:30|Zusammenfassung der Veranstaltung|hi||Rückblick, Ausblick, Evaluation BBK · Evaluation IdF · Christoph Schaaf, Thorsten Ohm · Konferenzgebäude BABZ',
       'ab ca. 15:30|Abreise|ar||Programmende laut BABZ am Donnerstag'],
      []],TEL.babz,
      'Die Woche gestaltet die BABZ in Ahrweiler (Konferenzgebäude, Ramersbacher Str. 95), Modul 3.5 „Strategische Leitung und Führung“, Veranstaltungsnummer 23.060/26/50-06. Programmstand 30.10.2026. Pausen können bei Bedarf verlaufsabhängig durchgeführt werden. Nach dem Programm vom Stand 30.10. endet die Woche am Donnerstag um 15:30 Uhr.'],
    [51,8,'Stab 3','2026-12-14','both',[
      ['1-2|Anreise|ar','3|Leistungsnachweis nach § 13 Abs. 3|hi|C-1|siehe Prüfungsleitfaden','11:00-11:30|MoFüSt NRW||C-1','11:30-13:00|Historie der Stabsarbeit & Stabsarbeit international||C-1','13:30-14:45|Historie der Stabsarbeit (Fortsetzung)','8|Lageeinweisung||C-1','18:15|Stabsrahmenübung »Unwetter«|hi||Lunchpaket packen · spätes Ende · Küchenwagen mitbringen'],
      ['1-6|unterrichtsfrei|ar','7-8|Übungsauswertung||C-205'],
      ['08:00-16:30|Fachtagung Stabsarbeit|hi|C-1|Get Together 08:00 · Beginn 08:45 · Hemd/Krawatte','EVA|Übungsbedarf'],
      ['1-5|Konzepterarbeitung Großveranstaltung||C-205','6|Aufbau||C-205|Stabsraum „groß“','14:00-17:00|Gr. A: Stabsrahmenübung »Großveranstaltung«|hi|C-205|Küchenwagen mitbringen'],
      ['07:45-ca. 11:00|Gr. B: Stabsrahmenübung »Großveranstaltung«|hi|C-205|Küchenwagen mitbringen','ca. 11:15-12:15|Übungsauswertung beider Gruppen||C-205','6|Rückbau & Organisatorisches|||Evaluation der drei Wochen Stab','7|Abreise|ar']],TEL.spahl],
    [52,9,'Klausuren','2026-12-21','both',[
      ['1|Anreise|ar','08:30-12:30|Klausur nach § 21|hi|B1-106, A3-25|4 Zeitstunden','7-8|unterrichtsfrei|ar'],
      ['1|unterrichtsfrei|ar','08:30-12:30|Klausur nach § 21|hi|B1-106, A3-25|4 Zeitstunden','7-8|Verabschiedung durch den Direktor|hi|A2-1|Hemd/Krawatte'],
      [],['nachmittags|Heiligabend|ar'],['ganztägig|1. Weihnachtstag|ar']],TEL.spahl]
  ];

  const DAYS=['Mo','Di','Mi','Do','Fr','Sa','So'];
  const MONS=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let _grp='g1', _wi=0, _weeks=[];

  function _time(spec){
    const m=/^(\d)(?:-(\d))?$/.exec(spec);
    if(m) return [UE_S[m[1]-1], UE_E[(m[2]||m[1])-1]];
    const i=spec.indexOf('-');
    return i<0?[spec,'']:[spec.slice(0,i),spec.slice(i+1)];
  }
  // Anreise: Tipp öffnet die Karten-App mit Navigation zum IdF Münster (Android/iOS öffnen Google Maps bzw. fragen nach der Karten-App)
  const mapsTo=a=>'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='+encodeURIComponent(a);   // travelmode=driving: gleich „mit dem Auto“
  const IDF_MAPS=mapsTo('Institut der Feuerwehr Nordrhein-Westfalen, Wolbecker Straße 237, 48155 Münster');
  const BABZ_MAPS=mapsTo('BABZ, Ramersbacher Str. 95, 53474 Bad Neuenahr-Ahrweiler-Godeneltern');
  const NAV_PIN='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  // „Anreise“ → Navigation zum IdF; „Abreise“ → Navigation zur eigenen Heimadresse (erst festlegen, dann Link plus kleiner Knopf zum Ändern)
  function _navTitle(title,ymd,nav){
    if(!ymd||!(!_isCustom()||/^idf/.test(_vkey()))) return esc(title);
    if(title==='Anreise') return `<a class="idf-map" href="${nav==='babz'?BABZ_MAPS:IDF_MAPS}" target="_blank" rel="noopener noreferrer" aria-label="Anreise: Navigation ${nav==='babz'?'zur BABZ in Ahrweiler':'zum Institut der Feuerwehr NRW'} starten">${NAV_PIN}${esc(title)}</a>`;
    if(title!=='Abreise') return esc(title);
    const a=HOME.get();
    return a?`<span class="idf-abr"><a class="idf-map" href="${esc(HOME.url(a))}" target="_blank" rel="noopener noreferrer" aria-label="Abreise: Navigation zur Heimadresse starten">${NAV_PIN}${esc(title)}</a><button type="button" class="idf-home idf-home-edit" onclick="event.stopPropagation();HOME.edit()" aria-label="Heimadresse ändern">Adresse ändern</button></span>`
      :`<button type="button" class="idf-map idf-home-set" onclick="event.stopPropagation();HOME.edit()" aria-label="Abreise: Heimadresse festlegen">${NAV_PIN}${esc(title)} <span class="idf-home">Heimadresse festlegen</span></button>`;
  }
  // Räume für den Raumplan: nur im IdF-Plan; Raum = Gebäude + Nummer (B1-106, C-205, A3-25), „Gebäude C“ nennt nur das Gebäude
  const _BLD=/^(A[1-9]|B[1-4]|C|M6)$/;
  const _idfView=()=>_nonMaster()?/^idf/.test(_vkey()):!_isCustom();
  function _roomsOf(room){
    const out=[], seen={};
    String(room||'').replace(/(^|[^A-Za-z0-9])([ABCM]\d?)-(\w+)/g,(m,p,b,n)=>{ const r=b+'-'+n; if(_BLD.test(b)&&!seen[r]){ seen[r]=1; out.push({room:r,b}); } return m; });
    return out;
  }
  const _bldOf=(room,note)=>{ const m=/Gebäude\s+(A[1-9]|B[1-4]|C|M6)(?![A-Za-z0-9])/.exec((room||'')+' '+(note||'')); return m?m[1]:''; };
  let _nk='';
  function _item(s,ymd){
    const [t,title,cls='',room='',note='',nav='']=s.split('|');   // nav: 'babz' = Anreise führt zur BABZ statt zum IdF
    const [a,b]=_time(t);
    const meta=[note,room?(_isCustom()?room:'Raum '+room):''].filter(Boolean).join(' · ');
    const isNext=ymd&&_nk&&(ymd+'|'+title+'|'+_minutes(a))===_nk;
    const hasNav=!!ymd&&(title==='Anreise'||title==='Abreise')&&(!_isCustom()||/^idf/.test(_vkey()));
    const rooms=ymd&&_idfView()?_roomsOf(room):[], bd=rooms.length?'':(ymd&&_idfView()?_bldOf(room,note):'');
    const lunch=ymd&&_idfView()&&/^Mittagessen/i.test(title)?ymd:'';
    const tap=hasNav||rooms.length||bd||lunch;
    return `<div class="idf-item ${cls}${/^\d/.test(a)?'':' idf-wtime'}${tap?' idf-tap':''}${isNext?' idf-now':''}"${tap?` tabindex="0" role="button"${lunch?` data-lunch="${lunch}" aria-label="Mittagessen, Speiseplan öffnen"`:''}${rooms.length||bd?` data-rm="${esc(rooms.map(r=>r.room).join(','))}" data-bd="${esc(bd)}" aria-label="${esc(title+', '+(rooms.length?'Raum '+rooms.map(r=>r.room).join(', '):'Gebäude '+bd)+'. Raumplan öffnen')}"`:''}`:''}><span class="idf-time">${esc(a)}${b?`<i>${esc(b)}</i>`:''}</span><span class="idf-txt"><span class="idf-name">${_navTitle(title,ymd,nav)}</span>${meta?`<span class="idf-meta${rooms.length||bd?' idf-rm':''}">${rooms.length||bd?NAV_PIN:''}${esc(meta)}</span>`:''}</span></div>`;
  }
  const LUNCH=(end,ymd)=>`<div class="idf-item idf-lunch${ymd&&_idfView()?' idf-tap':''}"${ymd&&_idfView()?` data-lunch="${ymd}" tabindex="0" role="button" aria-label="Mittagessen, Speiseplan öffnen"`:''}><span class="idf-time">13:00<i>${end}</i></span><span class="idf-txt"><span class="idf-name"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 2v20M4 2v5a3 3 0 0 0 6 0V2M18 22V2c-2.5 1.5-4 4.5-4 8 0 2 1 3 4 3"/></svg>Mittagessen</span><span class="idf-meta">Speiseraum A3</span></span></div>`;
  // Frühstück und Abendessen (Zeiten laut IdF); wie das Mittagessen nur als Hinweis, kein Termin
  const MEAL=(name,a,b,note)=>`<div class="idf-item idf-lunch idf-tap" tabindex="0" role="button" data-bd="A3" aria-label="${name}, Speiseraum A3, Raumplan öffnen"><span class="idf-time">${a}<i>${b}</i></span><span class="idf-txt"><span class="idf-name"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 2v20M4 2v5a3 3 0 0 0 6 0V2M18 22V2c-2.5 1.5-4 4.5-4 8 0 2 1 3 4 3"/></svg>${name}</span><span class="idf-meta idf-rm">${NAV_PIN}Speiseraum A3${note?' · '+note:''}</span></span></div>`;
  function _start(spec){
    const ue=/^(\d)(?:-\d)?$/.exec(spec);
    if(ue) return UE_S[ue[1]-1];
    const hm=/(\d{2}):(\d{2})/.exec(spec);
    return hm?hm[0]:null;
  }
  function _splitAtLunch(items){
    const out=[];
    items.forEach(x=>{
      const p=x.split('|'), m=/^(\d)-(\d)$/.exec(p[0]);
      if(m&&+m[1]<=6&&+m[2]>=7){
        out.push([`${m[1]}-6`,...p.slice(1)].join('|'));
        out.push([m[2]==='7'?'7':`7-${m[2]}`,p[1]+' (Fortsetzung)',p[2]||'',p[3]||''].join('|'));
      } else out.push(x);
    });
    return out.map((x,i)=>({x,i,t:_start(x.split('|')[0])}))
      .sort((a,b)=>a.t&&b.t?(a.t<b.t?-1:a.t>b.t?1:a.i-b.i):a.i-b.i).map(o=>o.x);
  }
  function _dayItems(raw,ymd){
    if(!raw.length) return '<div class="idf-empty">frei</div>';
    const items=_splitAtLunch(raw);
    const starts=items.map(x=>_start(x.split('|')[0]));
    const html=items.map(x=>_item(x,ymd));
    if(!_isCustom()&&starts.some(Boolean)){
      const babz=raw.some(x=>/BABZ/.test(x)), away=raw.some(x=>/^[^|]*\|Abreise\|/.test(x));   // BABZ-Woche hat eigene Verpflegung; am Abreisetag kein Abendessen
      if(!babz&&!away){ let d=starts.findIndex(t=>t&&t>='17:00'); if(d<0) d=html.length; html.splice(d,0,MEAL('Abendessen','17:00','19:00','Essenausgabe bis 18:30 Uhr')); }
      if(!babz) html.unshift(MEAL('Frühstück','06:30','07:45'));
      let at=0;
      starts.forEach((t,i)=>{ if(t&&t<'13:00') at=i+1; });
      const next=starts.slice(at).find(Boolean);
      if(!babz) html.splice(at+1,0,LUNCH(next&&next>'13:00'&&next<'14:00'?next:'14:00',ymd));   // BABZ-Programm nennt die Mittagspause selbst
    }
    return html.join('');
  }

  // Änderungen vom Institut: data/plan-overrides.json (siehe Datei), wird beim Öffnen frisch geladen
  let _ov={tage:[],wochenhinweise:[]};
  const _ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

  // ── Eigener Stundenplan aus einer Kalenderdatei (.ics): ersetzt den IdF-Plan, alle Funktionen laufen weiter ──
  const CKEY='bvi_plan_custom', SKEY='bvi_plan_src';
  let _cust=null, _act=null, _cw=null, _cwa=null, _mode='view';   // _cust: angezeigter Plan, _act: aktiver Plan (Startseite, Widgets)
  // Master-Jahrgang: eigener Plan optional (alter Speicherort); andere Jahrgänge: immer eigener Plan, ggf. noch leer
  const _nonMaster=()=>typeof JG!=='undefined'&&!JG.isMaster();
  const PTAB={ibk:'IBK',vak:'VAk',feuak:'FeuAK',idf:'IdF Gruppe 1',idf2:'IdF Gruppe 2'};
  const _idfG=()=>{ try{ return localStorage.getItem('bvi_plan_idfg')==='idf2'?'idf2':'idf'; }catch(e){ return 'idf'; } };
  const _actKey=()=>{ const d=JG.data(); return d.aktiv&&d.plane[d.aktiv]?d.aktiv:(JG.PLANKEYS.find(k=>d.plane[k])||null); };
  function _vkey(){ try{ const k=localStorage.getItem('bvi_plan_view'); if(JG.PLANKEYS.includes(k)) return k; }catch(e){} return _actKey()||'idf'; }
  const _faqKey=()=>{ const k=_nonMaster()?_vkey():'idf'; return k==='idf2'?'idf':k; };
  function _loadCust(){
    if(_nonMaster()){ const d=JG.data(), ak=_actKey(); _cust=d.plane[_vkey()]||null; _act=ak?d.plane[ak]:null; }
    else{ try{ const j=JSON.parse(localStorage.getItem(CKEY)||'null'); _cust=j&&Array.isArray(j.ev)&&j.ev.length?j:null; }catch(e){ _cust=null; } _act=_cust; }
    _cw=null; _cwa=null;
  }
  const _isCustom=()=>{ if(_nonMaster()) return true; try{ return !!_cust&&localStorage.getItem(SKEY)==='custom'; }catch(e){ return false; } };
  function _saveCust(res){
    if(_nonMaster()){ const l=JG.local(), k=_vkey(); res.at=Date.now(); l.plane[k]=res; if(!l.aktiv) l.aktiv=k; JG.saveLocal(l); }
    else{ try{ localStorage.setItem(CKEY,JSON.stringify(res)); localStorage.setItem(SKEY,'custom'); }catch(e){} }
    _loadCust(); _manual=false; render(); pushWidget();
    if(typeof SHELL!=='undefined') SHELL.renderHome();
  }
  // Andere Jahrgänge: zwischen den Abschnitten (IBK, VAk, FeuAK, IdF) wechseln und einen Plan als aktiv markieren
  // viewTab('idf') zeigt die zuletzt gewählte IdF-Gruppe, viewTab('idf',true) genau Gruppe 1
  function viewTab(k,exact){ if(!JG.PLANKEYS.includes(k)) return; if(k==='idf'&&!exact) k=_idfG(); try{ localStorage.setItem('bvi_plan_view',k); if(k==='idf'||k==='idf2') localStorage.setItem('bvi_plan_idfg',k); }catch(e){} _loadCust(); _manual=false; render(); }
  function setActive(k){ const l=JG.local(); l.aktiv=k; JG.saveLocal(l); TOAST.show(PTAB[k]+'-Plan ist jetzt aktiv: Startseite und Widgets nutzen ihn',{type:'ok'}); }
  const _icsUnfold=t=>String(t).replace(/\r\n|\r/g,'\n').replace(/\n[ \t]/g,'').split('\n');
  const _icsText=v=>String(v||'').replace(/\\[nN]/g,' ').replace(/\\([,;\\])/g,'$1').replace(/\s+/g,' ').trim();
  // lokale Zeit in einer Zeitzone → UTC-Millisekunden (unbekannte Zeitzone: Zeit des Geräts)
  function _tzMs(y,mo,d,h,mi,tz){
    try{
      const f=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
      const off=t=>{ const p={}; f.formatToParts(new Date(t)).forEach(x=>{ p[x.type]=x.value; }); return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute,+p.second)-t; };
      const g=Date.UTC(y,mo-1,d,h,mi); let t=g-off(g); t=g-off(t); return t;
    }catch(e){ return new Date(y,mo-1,d,h,mi).getTime(); }
  }
  function _icsDate(val,params){
    const m=/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/.exec(String(val).trim()); if(!m) return null;
    const y=+m[1], mo=+m[2], d=+m[3];
    if(m[4]===undefined) return {ms:new Date(y,mo-1,d).getTime(),all:true};
    if(m[7]) return {ms:Date.UTC(y,mo-1,d,+m[4],+m[5],+(m[6]||0)),all:false};
    const tz=/TZID=([^;:]+)/i.exec(params||'');
    return {ms:tz?_tzMs(y,mo,d,+m[4],+m[5],tz[1].replace(/"/g,'')):new Date(y,mo-1,d,+m[4],+m[5]).getTime(),all:false};
  }
  function _icsDur(v){
    const m=/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(v).trim()); if(!m) return null;
    const ms=(((+m[2]||0)*7+(+m[3]||0))*86400+(+m[4]||0)*3600+(+m[5]||0)*60+(+m[6]||0))*1000;
    return m[1]==='-'?-ms:ms;
  }
  // Kalenderdatei lesen → Liste von Terminen {s,e,t,r,n,ad}; einfache Wiederholungen (täglich, wöchentlich) werden aufgelöst
  function parseIcs(text){
    const evs=[]; let cur=null, name='';
    _icsUnfold(text).forEach(ln=>{
      if(ln==='BEGIN:VEVENT'){ cur={}; return; }
      if(ln==='END:VEVENT'){ if(cur&&cur.DTSTART) evs.push(cur); cur=null; return; }
      const m=/^([A-Za-z-]+)((?:;[^:]*)?):(.*)$/.exec(ln); if(!m) return;
      const k=m[1].toUpperCase();
      if(cur){ if(k==='EXDATE'){ (cur.EX=cur.EX||[]).push(...m[3].split(',').map(x=>x.trim().slice(0,8))); } else if(!(k in cur)){ cur[k]=m[3]; cur[k+'_P']=m[2]; } }
      else if(k==='X-WR-CALNAME') name=_icsText(m[3]);
    });
    const out=[], DAYMAP={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6}, LIMIT=3000;
    evs.forEach(ev=>{
      if(/CANCELLED/i.test(ev.STATUS||'')) return;
      const st=_icsDate(ev.DTSTART,ev.DTSTART_P); if(!st) return;
      let en=ev.DTEND?_icsDate(ev.DTEND,ev.DTEND_P):null, dur=en?en.ms-st.ms:(ev.DURATION?_icsDur(ev.DURATION):null);
      if(dur===null||dur<=0) dur=st.all?86400000:3600000;
      const t=_icsText(ev.SUMMARY)||'Termin', r=_icsText(ev.LOCATION), n=_icsText(ev.DESCRIPTION).slice(0,140);
      const starts=[st.ms];
      const rr=ev.RRULE?Object.fromEntries(ev.RRULE.split(';').map(x=>x.split('='))):null;
      if(rr&&(rr.FREQ==='DAILY'||rr.FREQ==='WEEKLY')){
        const iv=Math.max(1,+rr.INTERVAL||1), cnt=+rr.COUNT||0, s0=new Date(st.ms);
        let until=rr.UNTIL?(_icsDate(rr.UNTIL,'')||{}).ms:null; if(!until||until>st.ms+400*864e5) until=st.ms+400*864e5; if(rr.UNTIL&&/^\d{8}$/.test(rr.UNTIL)) until+=86399000;
        const wd=rr.BYDAY?rr.BYDAY.split(',').map(x=>DAYMAP[x.slice(-2)]).filter(x=>x!==undefined):[s0.getDay()];
        const mon0=new Date(s0.getFullYear(),s0.getMonth(),s0.getDate()-((s0.getDay()+6)%7));
        starts.length=0; let c=0;
        for(let i=0;i<=400&&starts.length<LIMIT;i++){
          const day=new Date(s0.getFullYear(),s0.getMonth(),s0.getDate()+i); if(day.getTime()>until) break;
          let ok;
          if(rr.FREQ==='DAILY') ok=i%iv===0;
          else ok=Math.floor((new Date(day.getFullYear(),day.getMonth(),day.getDate()-((day.getDay()+6)%7))-mon0)/(7*864e5))%iv===0&&wd.includes(day.getDay());
          if(!ok) continue;
          const o=new Date(day.getFullYear(),day.getMonth(),day.getDate(),s0.getHours(),s0.getMinutes()).getTime();
          if(o<st.ms) continue;
          c++; if(cnt&&c>cnt) break;
          const key=_ymd(day).replace(/-/g,'');
          if((ev.EX||[]).includes(key)) continue;
          starts.push(o);
        }
      }
      starts.forEach(a=>{ if(out.length<LIMIT) out.push({s:a,e:a+dur,t,r,n,ad:st.all?1:0}); });
    });
    out.sort((a,b)=>a.s-b.s);
    return {name,ev:out};
  }
  const _isoWeek=d=>{ const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const n=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-n); return Math.ceil(((t-Date.UTC(t.getUTCFullYear(),0,1))/864e5+1)/7); };
  // Termine in Wochen (Mo–So) mit Einträgen im Format des IdF-Plans umwandeln
  function _customWeeks(){
    const pl=_mode==='active'?_act:_cust;
    if(_mode==='active'?_cwa:_cw) return _mode==='active'?_cwa:_cw;
    const ev=(pl&&pl.ev)||[]; const keep=w=>{ if(_mode==='active') _cwa=w; else _cw=w; return w; };
    if(!ev.length) return keep([]);
    const hm=ms=>{ const d=new Date(ms); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
    const days=new Map(), add=(ymd,raw)=>{ (days.get(ymd)||days.set(ymd,[]).get(ymd)).push(raw); };
    const clean=x=>String(x||'').replace(/\|/g,'/');
    ev.forEach(e=>{
      if(e.ad){ for(let d=new Date(e.s);d.getTime()<e.e&&d.getTime()<e.s+60*864e5;d.setDate(d.getDate()+1)) add(_ymd(d),['ganztägig',clean(e.t),'ar',clean(e.r),clean(e.n)].join('|')); return; }
      const sd=new Date(e.s), same=_ymd(sd)===_ymd(new Date(e.e-1));
      add(_ymd(sd),[hm(e.s)+'-'+(same?hm(e.e):'23:59'),clean(e.t),'',clean(e.r),clean(e.n)].join('|'));
    });
    const first=new Date(Math.min(...ev.map(e=>e.s))), last=new Date(Math.max(...ev.map(e=>e.e)));
    const mon=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7));
    const ws=[]; let i=0;
    for(let m=mon(first);m<=last&&ws.length<110;m=new Date(m.getFullYear(),m.getMonth(),m.getDate()+7)){
      const dd=[]; for(let k=0;k<7;k++) dd.push(days.get(_ymd(new Date(m.getFullYear(),m.getMonth(),m.getDate()+k)))||[]);
      ws.push([_isoWeek(m),++i,(pl&&pl.name)||'Eigener Plan',_ymd(m),'both',dd,null,'']);
    }
    return keep(ws);
  }
  function importIcs(file){
    if(!file) return;
    const r=new FileReader();
    r.onload=()=>{
      let res; try{ res=parseIcs(String(r.result)); }catch(e){ res=null; }
      if(!res||!res.ev.length){ TOAST.show('In der Datei wurden keine Termine gefunden – bitte eine Kalenderdatei (.ics) wählen',{type:'info'}); return; }
      res.name=res.name||String(file.name||'').replace(/\.[^.]+$/,'')||'Eigener Plan'; res.at=Date.now();
      _saveCust(res);
      TOAST.show(res.ev.length+' Termine aus „'+res.name+'“ geladen',{type:'ok'});
    };
    r.onerror=()=>TOAST.show('Datei konnte nicht gelesen werden');
    r.readAsText(file);
  }
  function useSource(src){
    try{ localStorage.setItem(SKEY,src==='custom'?'custom':'idf'); }catch(e){}
    _cw=null; _manual=false; render(); pushWidget();
    if(typeof SHELL!=='undefined') SHELL.renderHome();
    TOAST.show(src==='custom'?'Eigener Plan wird angezeigt':'IdF-Plan Modul 3.5 wird angezeigt',{type:'ok'});
  }
  function removeCustom(){
    if(!confirm('Den geladenen eigenen Stundenplan entfernen?')) return;
    if(_nonMaster()){ const l=JG.local(), k=_vkey(); delete l.plane[k]; if(l.aktiv===k) l.aktiv=null; JG.saveLocal(l); }
    else{ try{ localStorage.removeItem(CKEY); localStorage.setItem(SKEY,'idf'); }catch(e){} }
    _loadCust(); _manual=false; render(); pushWidget();
    if(typeof SHELL!=='undefined') SHELL.renderHome();
    TOAST.show('Eigener Plan entfernt',{type:'ok'});
  }
  // Leiste ganz oben (andere Jahrgänge): Abschnitt wählen, Plan als aktiv markieren
  function _tabsBar(){
    if(!_nonMaster()) return '';
    const d=JG.data(), vk=_vkey(), ak=_actKey();
    const inIdf=vk==='idf'||vk==='idf2', idfAct=ak==='idf'||ak==='idf2', idfHas=!!(d.plane.idf||d.plane.idf2);
    const seg=[['ibk','IBK'],['vak','VAk'],['feuak','FeuAK'],['idf','IdF']].map(([k,l])=>{
      const on=k==='idf'?inIdf:k===vk, star=k==='idf'?idfAct:ak===k, has=k==='idf'?idfHas:!!d.plane[k];
      return `<button class="${on?'active':''}" onclick="IDF_PLAN.viewTab('${k}')" aria-pressed="${on}">${l}${star?' ★':has?'':' ·'}</button>`;
    }).join('');
    const grp=inIdf?`<span class="m-seg idf-seg idf-gr" role="group" aria-label="IdF-Gruppe">${[['idf','Gruppe 1'],['idf2','Gruppe 2']].map(([k,l])=>`<button class="${k===vk?'active':''}" onclick="IDF_PLAN.viewTab('${k}',true)" aria-pressed="${k===vk}">${l}${ak===k?' ★':d.plane[k]?'':' ·'}</button>`).join('')}</span>`:'';
    let act='';
    if(d.plane[vk]) act=ak===vk?`<div class="idf-act on"><span class="m-badge">★ Aktiv</span><span class="m-t2">Startseite und Widgets zeigen diesen Plan</span></div>`:`<div class="idf-act"><button class="btn btn-gold" onclick="IDF_PLAN.setActive('${vk}')">Als aktiven Stundenplan markieren</button><span class="m-t2">Dann nutzen Startseite und Widgets diesen Plan</span></div>`;
    return `<div class="m-card idf-tabs"><span class="m-seg idf-seg" role="group" aria-label="Abschnitt">${seg}</span>${grp}${act}</div>`;
  }
  function _planControls(){
    const cust=!!_cust, on=_isCustom(), nm=_nonMaster();
    const row=(t1,t2,btn)=>`<div class="m-row m-static m-wrap"><span class="m-tx"><span class="m-t1">${t1}</span><span class="m-t2">${t2}</span></span>${btn}</div>`;
    const fileRow=`<label class="m-row" for="plan-file" style="cursor:pointer"><span class="m-tx"><span class="m-t1">Kalenderdatei (.ics) laden</span><span class="m-t2">z. B. aus dem Kalender deiner Schule oder deines Betriebs</span></span><input type="file" id="plan-file" accept=".ics,text/calendar" hidden onchange="IDF_PLAN.importIcs(this.files[0]);this.value=''"></label>`;
    const ui=(fn,t1,t2)=>`<button class="m-row m-go" onclick="${fn}"><span class="m-tx"><span class="m-t1">${t1}</span><span class="m-t2">${t2}</span></span></button>`;
    let h='<div class="m-sec" style="margin:1rem 0 .6rem">'+(nm?'Plan für '+PTAB[_vkey()]:cust?'Stundenplan wählen':'Kalender')+'</div><div class="m-list idf-src">';
    if(!nm&&cust) h+=row('IdF Münster · Modul 3.5',on?'Der mitgelieferte Plan, mit Gruppe 1 und 2':'Wird gerade angezeigt',on?'<button class="btn btn-ghost" onclick="IDF_PLAN.useSource(\'idf\')">Anzeigen</button>':'<span class="m-badge">aktiv</span>');
    if(cust) h+=row(esc(_cust.name),_cust.ev.length+' Termine'+(nm?'':' aus deiner Datei'),on&&!nm?'<span class="m-badge">aktiv</span>':nm?'':'<button class="btn btn-ghost" onclick="IDF_PLAN.useSource(\'custom\')">Anzeigen</button>');
    if(nm) h+=fileRow;   // Im Master lässt sich nichts ändern oder importieren
    if(nm&&typeof JGUI!=='undefined'){
      h+=ui('JGUI.planPhoto()','Foto oder Screenshot einlesen','Die Termine werden erkannt und zum Ausbessern angezeigt');
      h+=ui('JGUI.planEditor()','Termine von Hand eingeben oder ändern','Datum, Zeit, Titel und Raum');
    }
    if(cust&&(!nm||JG.local().plane[_vkey()])) h+=`<button class="m-row" onclick="IDF_PLAN.removeCustom()"><span class="m-tx"><span class="m-t1">Eigenen Plan entfernen</span></span></button>`;
    return h.endsWith('<div class="m-list idf-src">')?'':h+'</div>';
  }
  // Noch kein Plan für diesen Abschnitt (andere Jahrgänge): Hinweis und Wege zum Importieren
  function _drawEmpty(el){
    const ey=document.querySelector('#v-plan .page-eyebrow'), ld=document.querySelector('#v-plan .page-lead');
    if(ey&&ld){ if(!ey.dataset.d){ ey.dataset.d=ey.textContent; ld.dataset.d=ld.textContent; } ey.style.textTransform='none'; ey.textContent=JG.labelOf(JG.current())+' · '+PTAB[_vkey()]; ld.textContent='Importiere oder erstelle den Stundenplan für diesen Abschnitt. Mit „Aktiv“ nutzen ihn Startseite und Widgets.'; }
    el.innerHTML=_tabsBar()+FAQ.card(_faqKey())+_raumBtn()+'<div class="m-card"><div class="m-t1">Noch kein Stundenplan für '+PTAB[_vkey()]+'</div><div class="m-t2" style="margin-top:6px">Importiere ihn als Kalenderdatei (.ics), lies ein Foto oder einen Screenshot ein, oder gib die Termine selbst ein.</div></div>'+_planControls();
  }
  function _dayRaw(w,d,g){
    if(_isCustom()) return w[5][d]||[];
    const day=new Date(w[3]+'T00:00'); day.setDate(day.getDate()+d);
    const key=_ymd(day);
    const o=_ov.tage.find(t=>t&&t.datum===key&&(!t.gruppe||t.gruppe==='both'||t.gruppe===g)&&Array.isArray(t.eintraege));
    return o?o.eintraege:(w[5][d]||[]);
  }
  function _weekNote(w){
    const o=_ov.wochenhinweise.find(x=>x&&x.montag===w[3]);
    return o&&o.text?String(o.text):'';
  }
  async function _loadOv(){
    try{
      const r=await fetch('data/plan-overrides.json',{cache:'no-cache'}); if(!r.ok) return;
      const j=await r.json();
      _ov={tage:Array.isArray(j.tage)?j.tage:[],wochenhinweise:Array.isArray(j.wochenhinweise)?j.wochenhinweise:[]};
      if(document.getElementById('v-plan')?.classList.contains('active')) _draw();
      if(typeof SHELL!=='undefined'&&document.getElementById('v-home')?.classList.contains('active')) SHELL.renderHome();
      pushWidget();
    }catch(e){}
  }
  function _buildWeeks(g=_grp){
    if(_isCustom()) return _customWeeks();
    return W.filter(w=>w[4]==='both'||w[4]===g).sort((a,b)=>a[3]<b[3]?-1:1);
  }
  function _autoIdx(ws=_weeks){
    const today=new Date(); today.setHours(0,0,0,0);
    for(let i=ws.length-1;i>=0;i--) if(new Date(ws[i][3]+'T00:00')<=today) return i;
    return 0;
  }
  function _savedGrp(){ try{ return localStorage.getItem('idf_plan_grp')||'g1'; }catch(e){ return 'g1'; } }

  function _draw(){
    const el=document.getElementById('plan-inner'); if(!el) return;
    const nxt=_next(); _nk=nxt?_ymd(nxt.start)+'|'+nxt.title+'|'+(nxt.start.getHours()*60+nxt.start.getMinutes()):'';
    const wk=_weeks[_wi]; if(!wk) return;
    const [kw,nr,thema,start,grp,days,tel,info]=wk;
    const today=new Date(); today.setHours(0,0,0,0);
    const base=new Date(start+'T00:00');
    const notStarted=today<new Date(_weeks[0][3]+'T00:00');
    const icon=d=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
    let h=_tabsBar()+FAQ.card(_faqKey())+_raumBtn()+`<div class="m-card idf-head">
      <div class="idf-row"><div><b class="idf-kw">KW ${kw}</b><span class="m-t2">Woche ${nr} von ${_isCustom()?_weeks.length:9}${grp==='both'&&!_isCustom()?' · beide Gruppen':''}</span></div>
        <div class="idf-nav"><button onclick="IDF_PLAN._nav(-1)" aria-label="Vorherige Woche"${_wi===0?' disabled':''}>${icon('m15 18-6-6 6-6')}</button><button onclick="IDF_PLAN._nav(1)" aria-label="Nächste Woche"${_wi===_weeks.length-1?' disabled':''}>${icon('m9 18 6-6-6-6')}</button></div></div>
      <div class="idf-pips">${_weeks.map((w,i)=>`<button type="button" class="${i<_wi?'done':i===_wi?'cur':''}" onclick="IDF_PLAN._go(${i})" aria-label="Zu KW ${w[0]} springen (Woche ${i+1} von ${_weeks.length})"${i===_wi?' aria-current="true"':''}><i></i><span>${w[0]}</span></button>`).join('')}</div>
      <div class="idf-row idf-row2"><span class="idf-thema">${esc(thema)}</span>
        ${_isCustom()?'':`<span class="m-seg" role="group" aria-label="Gruppe">${['g1','g2'].map(g=>`<button class="${_grp===g?'active':''}" onclick="IDF_PLAN._grp('${g}')">Gruppe ${g[1]}</button>`).join('')}</span>`}</div>
    </div>`;
    if(notStarted&&_wi===0) h+=_isCustom()?`<div class="idf-note">Der Plan beginnt am ${base.toLocaleDateString('de-DE',{day:'numeric',month:'long'})}. Bis dahin zeigt er die erste Woche.</div>`:`<div class="idf-note">Das Modul beginnt am 26. Oktober. Bis dahin zeigt der Plan die erste Woche.</div>`;
    if(info) h+=`<div class="idf-note">${esc(info)}</div>`;
    const wn=_weekNote(wk); if(wn) h+=`<div class="idf-note">${esc(wn)}</div>`;
    h+='<div class="idf-days">'+days.map((_,i)=>{
      const items=_dayRaw(wk,i,_grp);
      const d=new Date(base); d.setDate(base.getDate()+i);
      const isToday=d.getTime()===today.getTime();
      return `<div class="idf-day${isToday?' today':''}" data-ymd="${_ymd(d)}"><div class="idf-dc"><span class="idf-dow">${DAYS[i]}</span><span class="idf-dnum">${d.getDate()}</span><span class="idf-dmo">${MONS[d.getMonth()]}</span></div>
        <div class="idf-items">${_dayItems(items,_ymd(d))}</div></div>`;
    }).join('')+'</div>';
    const full=(n,t)=>/^-/.test(t)?(/BABZ/.test(n)?'0228 99550':'0251 3112')+t:t;
    const rows=[...(tel||(/^Vorbeugender Brandschutz/.test(thema)?TEL.vb:TEL.spahl)),['Pforte','-1400'],['Notruf','-0112']].map(([n,t])=>[n,full(n,t)]);
    if(!_isCustom()) h+=`<div class="m-card idf-tel"><div class="m-t1">Erreichbarkeiten</div>${rows.map(([n,t])=>`<div class="idf-tel-row"><span>${esc(n)}</span><a href="${t.includes('@')?'mailto:'+esc(t):'tel:+49'+t.replace(/\D/g,'').replace(/^0/,'')}">${esc(t)}</a></div>`).join('')}</div>`;
    h+=`<button class="m-cal-btn" onclick="IDF_PLAN.exportIcs()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 13v5M9.5 15.5h5"/></svg>Wichtige Termine in den Kalender übernehmen<small>${_isCustom()?'Alle Termine deines Plans':'Gruppe '+_grp[1]+' · Schlüsseltermine und Exkursionen'} · mit Erinnerung 30 Minuten vorher</small></button>`;
    if(!_isCustom()) h+='<div class="idf-legend"><span><i class="hi"></i>Schlüsseltermin</span><span><i class="ex"></i>Exkursion</span><span><i class="ar"></i>An-/Abreise, frei</span><span>EVA = eigenverantwortliches Arbeiten</span></div>';
    h+=_planControls();
    // Kopf der Seite: Name und Zeitraum des angezeigten Plans
    const ey=document.querySelector('#v-plan .page-eyebrow'), ld=document.querySelector('#v-plan .page-lead');
    if(ey&&ld){
      if(!ey.dataset.d){ ey.dataset.d=ey.textContent; ld.dataset.d=ld.textContent; }
      ey.style.textTransform=_nonMaster()?'none':'';
      ey.textContent=_isCustom()?(_nonMaster()?JG.labelOf(JG.current())+' · '+PTAB[_vkey()]:_cust.name):ey.dataset.d;
      ld.textContent=_isCustom()?'Stundenplan für KW '+_weeks[0][0]+' bis '+_weeks[_weeks.length-1][0]+'. Es öffnet sich immer die aktuelle Woche.':ld.dataset.d;
    }
    el.innerHTML=h;
  }

  // Woche der laufenden bzw. nächsten Einheit (sonst die Woche von heute)
  function _curWeek(){
    let wi=_autoIdx(); const nx=_next();
    if(nx){
      const k=_weeks.findIndex(w=>{ const b=new Date(w[3]+'T00:00'), e=new Date(b); e.setDate(b.getDate()+7); return nx.start>=b&&nx.start<e; });
      if(k>=0) wi=k;
    }
    return wi;
  }
  let _manual=false;   // true, sobald jemand selbst in andere Wochen geblättert hat
  // läuft das Datum weiter (Mitternacht, App wieder im Vordergrund), springt der Plan zur aktuellen Woche – außer es wurde selbst geblättert
  function _follow(){
    if(document.hidden||_manual||!document.getElementById('v-plan')?.classList.contains('active')||!_weeks.length) return;
    const wi=_curWeek();
    if(wi===_wi) return;
    _wi=wi; _draw();
    const nx=_next(), day=nx&&document.querySelector('#plan-inner .idf-day[data-ymd="'+_ymd(nx.start)+'"]');
    if(day) requestAnimationFrame(()=>{ day.scrollIntoView({block:'start'}); });
  }
  document.addEventListener('visibilitychange',_follow);
  function render(){
    _grp=_savedGrp();
    _weeks=_buildWeeks();
    if(!_weeks.length){ const el=document.getElementById('plan-inner'); if(el) _drawEmpty(el); return; }
    _manual=false; _wi=_curWeek();
    if(_toFaq){ _toFaq=false; _draw(); window.scrollTo(0,0); requestAnimationFrame(()=>window.scrollTo(0,0)); return; }
    // Springt zur laufenden bzw. nächsten Einheit: richtige Woche, Tag nach oben scrollen
    const nx=_next(), key=nx&&_ymd(nx.start);
    _draw();
    const day=key&&document.querySelector('#plan-inner .idf-day[data-ymd="'+key+'"]');
    if(day) requestAnimationFrame(()=>{ day.scrollIntoView({block:'start'}); });
  }
  // Markierung folgt der Uhrzeit: alle 30 s prüfen, ob eine andere Einheit läuft bzw. ansteht
  setInterval(()=>{
    if(document.hidden||!document.getElementById('v-plan')?.classList.contains('active')) return;
    _follow();
    const n=_next(), k=n?_ymd(n.start)+'|'+n.title+'|'+(n.start.getHours()*60+n.start.getMinutes()):'';
    if(k!==_nk) _draw();
  },30000);
  function _go(i){ _manual=true; _wi=Math.max(0,Math.min(_weeks.length-1,i)); _draw(); }   // Sprung per Tipp auf einen Abschnitt der Fortschrittsleiste
  function _nav(d){ _manual=true; _wi=Math.max(0,Math.min(_weeks.length-1,_wi+d)); _draw(); }
  function _setGrp(g){
    _grp=g;
    try{ localStorage.setItem('idf_plan_grp',g); }catch(e){}
    const kw=_weeks[_wi]&&_weeks[_wi][0];
    _weeks=_buildWeeks();
    const keep=_weeks.findIndex(w=>w[0]===kw);
    _wi=keep>=0?keep:_autoIdx();
    _draw();
    pushWidget();
  }
  function _minutes(str){ const m=/(\d{1,2}):(\d{2})/.exec(str||''); return m?(+m[1])*60+(+m[2]):null; }
  // Laufende oder nächste Einheit nach Stundenplan der gewählten Gruppe; null, wenn das Modul vorbei ist
  // öffentlich (Startseite, Widgets): immer der aktive Plan; intern (Seite, Sprung zur Uhrzeit): der angezeigte Plan
  function next(now){ _mode='active'; try{ return _next(now); }finally{ _mode='view'; } }
  function _next(now=new Date()){
    for(const w of _buildWeeks(_savedGrp())){
      const base=new Date(w[3]+'T00:00');
      for(let d=0;d<w[5].length;d++){
        const day=new Date(base); day.setDate(base.getDate()+d);
        const dayEnd=new Date(day); dayEnd.setHours(23,59,59,0);
        if(dayEnd<now) continue;
        for(const raw of _splitAtLunch(_dayRaw(w,d,_savedGrp()))){
          const [t,title,cls='',room='',note='']=raw.split('|');
          if(/unterrichtsfrei|Selbststudium|Heiligabend|Weihnachtstag/.test(title)) continue;
          const [a,b]=_time(t);
          const s=_minutes(a); if(s===null) continue;
          const e=_minutes(b); 
          const start=new Date(day); start.setHours(0,s,0,0);
          const end=new Date(day); end.setHours(0,e===null?s+60:e,0,0);
          if(end>now) return {state:start<=now?'now':'next',title,start,end,room,note,cls,kw:w[0]};
        }
      }
    }
    return null;
  }

  // Alle kommenden Einheiten (Beginn/Ende in ms) für die Startbildschirm-Widgets der Android-App
  // Erster Plantag und Standort des aktiven Plans (für den FAQ-Hinweis auf der Startseite)
  function arrival(){ _mode='active'; try{ const w=_buildWeeks(_savedGrp()), k=_nonMaster()?(_actKey()||'idf'):'idf'; return w.length?{key:k==='idf2'?'idf':k,start:w[0][3]}:null; }catch(e){ return null; }finally{ _mode='view'; } }
  // Andere Jahrgänge (nicht der Master): Knopf zum Raumplan des IdF Münster, auch für Pläne ohne Raumangaben
  const _raumBtn=()=>_nonMaster()?`<button type="button" class="m-card idf-raumbtn" onclick="RAUM.open({title:'Raumplan IdF Münster',time:'Gelände des Instituts',rooms:[],overview:true},this)"><span class="idf-rb-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg></span><span class="m-tx"><span class="m-t1">Raumplan IdF Münster</span><span class="m-t2">Gelände in 3D, Gebäude und Parkplätze</span></span></button>`:'';
  let _toFaq=false;   // true: der nächste Aufbau springt nicht zur aktuellen Einheit, sondern bleibt oben bei der FAQ
  function openFaq(){ const a=arrival(); if(a&&_nonMaster()) viewTab(a.key,true); FAQ.want(); _toFaq=true; NAV.tab('v-plan','Stundenplan'); }
  function units(){ _mode='active'; try{ return _units(); }finally{ _mode='view'; } }
  function _units(){
    const out=[], g=_savedGrp(), from=new Date(); from.setHours(0,0,0,0);
    for(const w of _buildWeeks(g)){
      const base=new Date(w[3]+'T00:00');
      for(let d=0;d<w[5].length;d++){
        const day=new Date(base); day.setDate(base.getDate()+d);
        if(day<from) continue;
        for(const raw of _splitAtLunch(_dayRaw(w,d,g))){
          const [t,title,cls='',room='']=raw.split('|');
          if(/unterrichtsfrei|Selbststudium|Heiligabend|Weihnachtstag/.test(title)) continue;
          const [a,b]=_time(t); const s=_minutes(a); if(s===null) continue;
          const e=_minutes(b);
          const st=new Date(day); st.setHours(0,s,0,0);
          const en=new Date(day); en.setHours(0,e===null?s+60:e,0,0);
          out.push({s:st.getTime(),e:en.getTime(),t:title,r:room?(_isCustom()?room:'Raum '+room):'',x:1});
        }
      }
    }
    return out;
  }
  function pushWidget(){
    try{ if(window.BVIAndroid&&BVIAndroid.setSchedule) BVIAndroid.setSchedule(JSON.stringify(units())); }catch(e){}
  }
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) pushWidget(); });

  // Stundenplan der gewählten Gruppe als Kalenderdatei (iCalendar), mit Erinnerung 30 Minuten vorher
  function ics(){
    const g=_savedGrp(), pad=n=>String(n).padStart(2,'0');
    const fold=l=>{ let out='',cur=''; for(const ch of l){ if(new TextEncoder().encode(cur+ch).length>73){ out+=cur+'\r\n '; cur=''; } cur+=ch; } return out+cur; };
    const esc=t=>String(t).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
    const stamp=(()=>{const d=new Date();return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+'T'+pad(d.getUTCHours())+pad(d.getUTCMinutes())+pad(d.getUTCSeconds())+'Z';})();
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//B VI Lernwebsite//Stundenplan Modul 3.5//DE','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+(_isCustom()?esc((_cust&&_cust.name)||'Stundenplan'):'IdF Münster Modul 3.5 · Gruppe '+g[1])];
    let count=0;
    for(const w of _buildWeeks(g)){
      const base=new Date(w[3]+'T00:00');
      for(let d=0;d<w[5].length;d++){
        const day=new Date(base); day.setDate(base.getDate()+d);
        const ymd=day.getFullYear()+pad(day.getMonth()+1)+pad(day.getDate());
        _splitAtLunch(_dayRaw(w,d,g)).forEach((raw,i)=>{
          const [t,title,cls='',room='',note='']=raw.split('|');
          if(/unterrichtsfrei|Selbststudium|Heiligabend|Weihnachtstag/.test(title)) return;
          if(!_isCustom()&&!/^(hi|ex)$/.test(cls)) return;   // nur Schlüsseltermine (Akzentfarbe) und Exkursionen (grün)
          const [a,b]=_time(t); const s=_minutes(a); if(s===null) return;
          const e=_minutes(b)??s+60, hm=m=>pad(Math.floor(m/60))+pad(m%60)+'00';
          lines.push('BEGIN:VEVENT','UID:bvi-'+g+'-'+ymd+'-'+hm(s)+'-'+i+'@bvi-lernwebsite','DTSTAMP:'+stamp,
            'DTSTART:'+ymd+'T'+hm(s),'DTEND:'+ymd+'T'+hm(e),
            'SUMMARY:'+esc(title));
          if(room) lines.push('LOCATION:'+esc(_isCustom()?room:'IdF NRW Münster, Raum '+room));
          lines.push('DESCRIPTION:'+esc([w[2]+' (KW '+w[0]+')',note].filter(Boolean).join('\n')));
          lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc(title),'TRIGGER:-PT30M','END:VALARM','END:VEVENT');
          count++;
        });
      }
    }
    lines.push('END:VCALENDAR');
    return {text:lines.map(fold).join('\r\n')+'\r\n',count,group:g};
  }
  function exportIcs(){
    const r=ics();
    FILES.save(_isCustom()?'bvi-stundenplan-eigener-plan.ics':'bvi-stundenplan-gruppe'+r.group[1]+'.ics','text/calendar',r.text,true);
  }

  function summary(){
    const ws=_buildWeeks(_savedGrp());
    if(!ws.length) return { kw:0, thema:'', over:false };
    const w=ws[_autoIdx(ws)];
    const end=new Date(ws[ws.length-1][3]+'T00:00'); end.setDate(end.getDate()+5);
    return { kw:w[0], thema:w[2], over:new Date()>end };
  }

  // Tipp auf einen Eintrag: An-/Abreise führen zu Maps (die ganze Zeile ist der Knopf); ohne Heimadresse öffnet „Abreise“ die Adresseingabe; Einheiten mit Raum öffnen den Raumplan
  function _tap(it){
    const go=it.querySelector('a.idf-map'); if(go){ go.click(); return; }
    if(it.querySelector('button.idf-home-set')){ HOME.edit(); return; }
    if(it.dataset.lunch){ SPEISE.open(it.dataset.lunch,it); return; }
    const rm=(it.dataset.rm||'').split(',').filter(Boolean), bd=it.dataset.bd||'';
    if(!rm.length&&!bd) return;
    const t=it.querySelector('.idf-time'), day=it.closest('.idf-day'), d=day&&day.dataset.ymd?new Date(day.dataset.ymd+'T00:00').toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'}):'';
    const time=(d?d+' · ':'')+(t?t.textContent.replace(/(\d)(\d{2}:\d{2})/,'$1 – $2'):'');
    RAUM.open({time,title:it.querySelector('.idf-name').textContent.trim(),rooms:_roomsOf(rm.join(' ')),building:bd},it);
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('#plan-inner .idf-map,#plan-inner .idf-home')) return;   // der Link bzw. Knopf selbst tut das Seine
    const it=e.target.closest('#plan-inner .idf-tap'); if(it) _tap(it);
  });
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('#plan-inner .idf-tap')){ e.preventDefault(); _tap(e.target); }
  });
  if(typeof JG!=='undefined') JG.on(()=>{
    _loadCust(); _manual=false;
    if(document.getElementById('v-plan')?.classList.contains('active')) render();
    pushWidget();
    if(typeof SHELL!=='undefined'&&document.getElementById('v-home')?.classList.contains('active')) SHELL.renderHome();
  });
  _loadOv();
  pushWidget();
  return { roomsOf:_roomsOf, arrival, openFaq, viewTab, setActive, savePlan:_saveCust, getPlan:()=>_cust, render, summary, next, units, pushWidget, ics, exportIcs, parseIcs, importIcs, useSource, removeCustom, isCustom:_isCustom, _nav, _go, _grp:_setGrp, redraw:_draw };
})();

/* ── Speiseplan des IdF: Tipp auf „Mittagessen“ im Stundenplan öffnet den Plan des Tages (data/speiseplan.json, wöchentlich ergänzen) ── */
const SPEISE=(function(){
  let ov=null, ret=null, data=null, onKey=null;
  const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ROWS=[['stamm','Stammessen'],['beilage','Beilage'],['veg','Vegetarisch'],['dessert','Dessert']];
  const load=()=>data?Promise.resolve(data):fetch('data/speiseplan.json',{cache:'no-cache'}).then(r=>{ if(!r.ok) throw 0; return r.json(); }).then(j=>(data=j));
  const dayHtml=(ymd,d,on)=>{
    const dt=new Date(ymd+'T00:00'), h=dt.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});
    const rows=d?ROWS.filter(([k])=>d[k]&&d[k].t).map(([k,l])=>`<div class="sp-row"><span class="sp-l">${l}</span><span class="sp-t">${esc(d[k].t)}${d[k].a?` <small>(${esc(d[k].a)})</small>`:''}</span></div>`).join(''):'';
    return `<section class="sp-day${on?' on':''}" data-d="${ymd}"${on?' aria-current="date"':''}><h3>${esc(h)}</h3>${rows||'<p class="sp-none">Für diesen Tag liegt noch kein Speiseplan vor.</p>'}</section>`;
  };
  function close(quiet){
    if(!ov) return; document.removeEventListener('keydown',onKey,true); ov.remove(); ov=null; document.body.classList.remove('rp-lock');
    if(!quiet&&ret&&ret.isConnected) try{ ret.focus({preventScroll:true}); }catch(e){}
  }
  function open(ymd,from){
    close(true); ret=from||document.activeElement;
    load().catch(()=>({tage:{}})).then(j=>{
      const days=Object.keys(j.tage||{}).sort(), mon=new Date(ymd+'T00:00'); mon.setDate(mon.getDate()-((mon.getDay()+6)%7));
      const fri=new Date(mon); fri.setDate(mon.getDate()+6);
      const week=days.filter(k=>k>=_ymdOf(mon)&&k<=_ymdOf(fri));
      const list=week.includes(ymd)?week:[...week,ymd].sort();
      ov=document.createElement('div'); ov.className='rp-back sp-back';
      ov.innerHTML=`<div class="sp-card" role="dialog" aria-modal="true" aria-label="Speiseplan"><div class="sp-head"><div><div class="sp-title">Speiseplan</div><div class="sp-sub">Speisenausgabe ${esc(j.ausgabe||'12:00 bis 13:30 Uhr')}${j.stand?' · Stand '+esc(j.stand):''}</div></div><button type="button" class="rp-close" aria-label="Schließen">Schließen</button></div><button type="button" class="sp-room" data-room>Speiseraum im Raumplan zeigen (Gebäude A3)</button><div class="sp-body">${list.map(k=>dayHtml(k,(j.tage||{})[k],k===ymd)).join('')}</div></div>`;
      document.body.appendChild(ov); document.body.classList.add('rp-lock');
      ov.addEventListener('click',e=>{ if(e.target===ov||e.target.closest('.rp-close')) close(); else if(e.target.closest('[data-room]')) RAUM.open({title:'Speiseraum',time:'Gebäude A3',rooms:[],building:'A3'},e.target.closest('[data-room]')); });
      onKey=e=>{ if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); close(); } };
      document.addEventListener('keydown',onKey,true);
      const cur=ov.querySelector('.sp-day.on'); if(cur) cur.scrollIntoView({block:'start'});
      // Wischen nach unten (am Anfang der Liste) schließt das Fenster
      const bd=ov.querySelector('.sp-body'), cd=ov.querySelector('.sp-card'); let y0=null, dy=0;
      bd.addEventListener('touchstart',e=>{ y0=bd.scrollTop<=0&&e.touches.length===1?e.touches[0].clientY:null; dy=0; },{passive:true});
      bd.addEventListener('touchmove',e=>{ if(y0===null) return; dy=e.touches[0].clientY-y0; if(dy>0&&bd.scrollTop<=0) cd.style.transform='translateY('+Math.min(dy,220)+'px)'; else if(dy<0){ y0=null; cd.style.transform=''; } },{passive:true});
      bd.addEventListener('touchend',()=>{ if(y0!==null&&dy>110) close(); else cd.style.transform=''; y0=null; },{passive:true});
      const cb=ov.querySelector('.rp-close'); if(cb) cb.focus({preventScroll:true});
    });
  }
  const _ymdOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  return {open,close,isOpen:()=>!!ov};
})();

/* ── Raumplan (3D): Code und three.js werden erst beim ersten Tipp auf eine Einheit mit Raum geladen ── */
const RAUM=(function(){
  const JS={};
  const load=src=>JS[src]||(JS[src]=new Promise((ok,no)=>{ const x=document.createElement('script'); x.src=src; x.onload=ok; x.onerror=()=>{ delete JS[src]; x.remove(); no(); }; document.body.appendChild(x); }));
  function open(info,from){
    if(typeof RAUMPLAN!=='undefined'){ RAUMPLAN.open(info,from); return; }
    TOAST.show('Raumplan wird geladen …',{type:'info'});
    load('js/three.min.js').then(()=>load('js/raumplan.js')).then(()=>RAUMPLAN.open(info,from)).catch(()=>TOAST.show('Der Raumplan konnte nicht geladen werden. Bitte Verbindung prüfen.',{type:'info'}));
  }
  return {open};
})();

/* ── Dateien speichern (Browser: Download, Android-App: Ordner Downloads) ── */
const FILES=(function(){
  function save(name,mime,text,open){
    if(window.BVIAndroid&&BVIAndroid.saveText){
      try{
        const ok=BVIAndroid.saveText(name,mime,text,!!open);
        TOAST.show(ok?(open?'Datei wird geöffnet …':'In Downloads gespeichert'):'Speichern fehlgeschlagen',ok?{type:'ok'}:undefined);
        return ok;
      }catch(e){}
    }
    const url=URL.createObjectURL(new Blob([text],{type:mime+';charset=utf-8'}));
    const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
    TOAST.show('Datei erstellt: '+name,{type:'ok'});
    return true;
  }
  return {save};
})();

/* ── Sicherung: Lernstand, Notizen, Lesezeichen und Einstellungen als Datei ── */
const BACKUP=(function(){
  const keep=k=>(k.startsWith('bvi_')&&k!=='bvi_seen_version'&&k!=='bvi_last_backup'&&k!=='bvi_et_end'&&k!=='bvi_heimadresse'&&!k.startsWith('bvi_jgp_'))||k==='idf_plan_grp';   // bvi_jgp_ = Zwischenspeicher veröffentlichter Jahrgangs-Dateien
  // Form der Werte beim Einspielen prüfen: falsch geformte Daten würden die App dauerhaft stören
  const ARR=new Set(['bvi_bookmarks','bvi_recent','bvi_search_hist','bvi_fc_custom','bvi_fc_stars','bvi_fc_weak']);
  const NOJSON=new Set(['bvi_plan_src','bvi_theme','bvi_bg','bvi_accent','bvi_font_size','bvi_goal','bvi_timers','bvi_onboarded','bvi_exam','bvi_lp_fz','bvi_lp_prac','bvi_pause_mode','bvi_pause_mods','bvi_duell_name','bvi_duell_col','bvi_duell_stun','bvi_duell_cfg','idf_plan_grp']);
  const safeTxt=t=>String(t==null?'':t).replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function clean(k,v){
    if(typeof v!=='string'||v.length>2e6||k==='bvi_heimadresse') return null;
    if(/^bvi_note_v-[a-z0-9-]+$|^bvi_note_home$/.test(k)) return v;
    if(NOJSON.has(k)) return v;
    // Jahrgänge: gewählter Jahrgang, eigene Änderungen je Jahrgang, Plan-Ansicht
    if(k==='bvi_jg') return /^BRef-\d\d-\d{4}_AB-\d\d-\d{4}$/.test(v)?v:null;
    if(/^bvi_jgd_BRef-\d\d-\d{4}_AB-\d\d-\d{4}$/.test(k)){ try{ const o=JSON.parse(v); return o&&typeof o==='object'&&!Array.isArray(o)?v:null; }catch(e){ return null; } }
    if(k==='bvi_plan_view') return JG.PLANKEYS.includes(v)?v:null;
    if(k==='bvi_plan_idfg') return v==='idf'||v==='idf2'?v:null;
    if(!/^bvi_[a-z0-9_]+$/.test(k)&&!/^bvi_checks_[\w-]+$/.test(k)) return null;
    let j; try{ j=JSON.parse(v); }catch(e){ return null; }
    if(j===null||typeof j!=='object') return null;
    if(ARR.has(k)!==Array.isArray(j)&&(ARR.has(k)||k==='bvi_progress'||k==='bvi_fc'||k==='bvi_usage'||k==='bvi_notif')) return null;
    if(k==='bvi_fc_custom') j=j.filter(c=>c&&typeof c==='object'&&/^[\w-]+$/.test(String(c.id))).map(c=>({...c,id:String(c.id),q:safeTxt(c.q),a:safeTxt(c.a),cat:safeTxt(c.cat||'Eigene')}));
    if(k==='bvi_bookmarks') j=j.filter(b=>b&&typeof b==='object'&&typeof b.id==='string');
    if(k==='bvi_recent'||k==='bvi_search_hist') j=j.filter(x=>typeof x==='string'||(x&&typeof x==='object'));
    return JSON.stringify(j);
  }
  function collect(){
    const d={};
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&keep(k)) d[k]=localStorage.getItem(k); }
    return d;
  }
  const stamp=()=>{ const d=new Date(),p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); };
  return {
    export(){
      const data=collect(), n=Object.keys(data).length;
      const body=JSON.stringify({app:'bvi-lernwebsite',version:APP_VERSION,exported:new Date().toISOString(),data},null,1);
      FILES.save('bvi-sicherung-'+stamp()+'.json','application/json',body);
      try{ localStorage.setItem('bvi_last_backup',new Date().toISOString()); }catch(e){}
      SHELL.syncSettings();
      return n;
    },
    last(){ try{ const t=localStorage.getItem('bvi_last_backup'); return t?new Date(t):null; }catch(e){ return null; } },
    import(input){
      const f=input.files&&input.files[0]; input.value='';
      if(!f) return;
      const r=new FileReader();
      r.onload=()=>{
        let o; try{ o=JSON.parse(r.result); }catch(e){ TOAST.show('Das ist keine gültige Sicherungsdatei'); return; }
        if(!o||o.app!=='bvi-lernwebsite'||typeof o.data!=='object'||!o.data){ TOAST.show('Das ist keine Sicherung dieser App'); return; }
        const ok={}, skipped=[];
        Object.keys(o.data).filter(keep).forEach(k=>{ const c=clean(k,o.data[k]); if(c===null) skipped.push(k); else ok[k]=c; });
        const keys=Object.keys(ok);
        if(!keys.length){ TOAST.show('Die Sicherung enthält keine verwertbaren Daten'); return; }
        const dt=o.exported?new Date(o.exported):null;
        const when=dt&&!isNaN(dt)?dt.toLocaleDateString('de-DE'):'unbekannt';
        if(!confirm('Sicherung vom '+when+' einspielen?\n\nDie '+keys.length+' Einträge der Sicherung überschreiben deine aktuellen Daten. Was in der Sicherung fehlt, bleibt unverändert.')) return;
        let failed=0;
        keys.forEach(k=>{ localStorage.setItem(k,ok[k]); if(localStorage.getItem(k)!==ok[k]) failed++; });
        if(failed||skipped.length){ TOAST.show((failed?failed+' Einträge passten nicht in den Speicher. ':'')+(skipped.length?skipped.length+' ungültige Einträge wurden übersprungen. ':'')+'Rest eingespielt – App wird neu geladen'); }
        else TOAST.show('Sicherung eingespielt – App wird neu geladen',{type:'ok'});
        setTimeout(()=>location.reload(),failed||skipped.length?2600:900);
      };
      r.onerror=()=>TOAST.show('Datei konnte nicht gelesen werden');
      r.readAsText(f);
    }
  };
})();

/* ── Textmarkierungen auf Lernseiten (CSS Custom Highlight API; gespeichert wird das Zitat samt Umgebung) ── */
const HL=(function(){
  const KEY='bvi_hl', OK=!!(window.CSS&&CSS.highlights&&window.Highlight);
  const load=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ return {}; } };
  const save=d=>{ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} };
  let view=null, ranges=[], bar=null, timer=null;
  // im Kapitel-Fenster (Handy/Tablet) liegt der Kapiteltext im Fenster statt in .pc
  const root=()=>{ const v=view&&document.getElementById(view); if(!v) return null; return (v.classList.contains('lp-open')&&v.querySelector(':scope > .lp-win .lp-wbody'))||v.querySelector('.pc'); };
  const lesson=pc=>!!pc&&(pc.classList.contains('lp-wbody')||!!pc.querySelector('.sec-h,.acc-item,.info-card,table'));
  function index(pc){
    const w=document.createTreeWalker(pc,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&!n.parentElement.closest('script,style,textarea,input,.m-report,#m-hl-bar')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
    const arr=[]; let n,pos=0;
    while((n=w.nextNode())){ arr.push({n,s:pos}); pos+=n.data.length; }
    return {arr,full:arr.map(x=>x.n.data).join('')};
  }
  function span(r,idx){
    let a=null,b=null;
    for(const e of idx.arr){
      if(!r.intersectsNode(e.n)) continue;
      const st=e.n===r.startContainer?r.startOffset:0, en=e.n===r.endContainer?r.endOffset:e.n.data.length;
      if(en<=st) continue;
      if(a===null) a=e.s+st;
      b=e.s+en;
    }
    return a===null?null:[a,b];
  }
  function locate(idx,h){
    let best=-1,score=-1,from=0,i;
    while((i=idx.full.indexOf(h.q,from))!==-1){
      let sc=0;
      if(h.p&&idx.full.slice(Math.max(0,i-h.p.length),i)===h.p) sc+=2;
      if(h.s&&idx.full.slice(i+h.q.length,i+h.q.length+h.s.length)===h.s) sc+=2;
      if(sc>score){ score=sc; best=i; }
      from=i+1;
    }
    return best<0?null:[best,best+h.q.length];
  }
  function toRange(idx,a,b){
    const r=document.createRange(); let set=false;
    for(const e of idx.arr){
      const end=e.s+e.n.data.length;
      if(!set&&a<end){ r.setStart(e.n,a-e.s); set=true; }
      if(set&&b<=end){ r.setEnd(e.n,b-e.s); return r; }
    }
    return null;
  }
  function apply(id){
    view=id; ranges=[];
    if(!OK) return;
    const pc=root();
    if(!lesson(pc)){ CSS.highlights.delete('user-hl'); hide(); return; }
    const idx=index(pc), list=load()[id]||[];
    list.forEach((h,i)=>{ const sp=locate(idx,h); const r=sp&&toRange(idx,sp[0],sp[1]); if(r){ r._i=i; ranges.push(r); } });
    ranges.length?CSS.highlights.set('user-hl',new Highlight(...ranges)):CSS.highlights.delete('user-hl');
    hide();
  }
  const overlaps=(r,h)=>h.isPointInRange(r.startContainer,r.startOffset)||h.isPointInRange(r.endContainer,r.endOffset)||r.isPointInRange(h.startContainer,h.startOffset);
  function hide(){ if(bar) bar.hidden=true; }
  function update(){
    const pc=root(), sel=getSelection();
    if(!OK||!lesson(pc)||!sel||!sel.rangeCount) return hide();
    const r=sel.getRangeAt(0), node=r.commonAncestorContainer, el=node.nodeType===1?node:node.parentElement;
    if(!pc.contains(node)||(el&&el.closest('textarea,input,#m-hl-bar'))) return hide();
    const hit=ranges.filter(h=>overlaps(r,h));
    const canAdd=!r.collapsed&&r.toString().trim().length>=2;
    if(!canAdd&&!hit.length) return hide();
    if(!bar) build();
    bar.querySelector('[data-a="add"]').hidden=!canAdd;
    bar.querySelector('[data-a="card"]').hidden=!canAdd;
    bar.querySelector('[data-a="del"]').hidden=!hit.length;
    bar.hidden=false;
  }
  function build(){
    bar=document.createElement('div'); bar.id='m-hl-bar'; bar.hidden=true; bar.setAttribute('role','toolbar');
    bar.innerHTML='<button data-a="add">Markieren</button><button data-a="card">Als Lernkarte</button><button data-a="del">Markierung entfernen</button>';
    ['mousedown','touchstart'].forEach(ev=>bar.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
    bar.addEventListener('click',e=>{ const a=e.target.closest('button')?.dataset.a; if(a==='add') add(); else if(a==='card') toCard(); else if(a==='del') remove(); });
    document.body.appendChild(bar);
  }
  function add(){
    const pc=root(), sel=getSelection(); if(!pc||!sel||!sel.rangeCount) return;
    const idx=index(pc), sp=span(sel.getRangeAt(0),idx); if(!sp) return;
    let [a,b]=sp; while(a<b&&/\s/.test(idx.full[a])) a++; while(b>a&&/\s/.test(idx.full[b-1])) b--;
    const q=idx.full.slice(a,b);
    if(q.length<2||q.length>800){ TOAST.show('Markiere eine Stelle zwischen 2 und 800 Zeichen'); return; }
    const d=load(), list=d[view]||[];
    list.push({q,p:idx.full.slice(Math.max(0,a-24),a),s:idx.full.slice(b,b+24)});
    d[view]=list; save(d);
    sel.removeAllRanges(); apply(view);
    TOAST.show('Stelle markiert',{type:'ok'});
  }
  // Markierten Text als Antwort einer eigenen Lernkarte übernehmen; die Frage schreibt man selbst
  function toCard(){
    const sel=getSelection(); if(!sel||!sel.rangeCount) return;
    const t=sel.toString().replace(/\s+/g,' ').trim(); if(t.length<2) return;
    sel.removeAllRanges(); hide();
    CUSTOM.open({a:t,view});
    TOAST.show('Schreibe oben die Frage dazu',{type:'info'});
  }
  function remove(){
    const sel=getSelection(), r=sel&&sel.rangeCount?sel.getRangeAt(0):null; if(!r) return;
    const drop=new Set(ranges.filter(h=>overlaps(r,h)).map(h=>h._i));
    const d=load(); d[view]=(d[view]||[]).filter((_,i)=>!drop.has(i)); if(!d[view].length) delete d[view];
    save(d); sel.removeAllRanges(); apply(view);
    TOAST.show('Markierung entfernt');
  }
  document.addEventListener('selectionchange',()=>{ clearTimeout(timer); timer=setTimeout(update,120); });
  return {
    apply, hide, supported:OK,
    all(){ const d=load(); return Object.keys(d).map(v=>({view:v,items:d[v]})); },
    removeAt(v,i){ const d=load(); (d[v]=d[v]||[]).splice(i,1); if(!d[v].length) delete d[v]; save(d); if(v===view) apply(view); }
  };
})();

/* ── Nutzungszeit: zählt nur, solange die App sichtbar ist und bedient wird ── */
const USAGE=(function(){
  const KEY='bvi_usage', TICK=15, IDLE=5*60*1000;
  let last=Date.now();
  const pad=n=>String(n).padStart(2,'0');
  const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  ['pointerdown','keydown','wheel','touchstart','scroll'].forEach(ev=>window.addEventListener(ev,()=>{ last=Date.now(); },{passive:true,capture:true}));
  setInterval(()=>{
    if(document.visibilityState!=='visible'||Date.now()-last>IDLE) return;
    const d=load(), k=key(new Date());
    d[k]=(d[k]||0)+TICK;
    try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){}
  },TICK*1000);
  return {
    today(){ return load()[key(new Date())]||0; },
    week(){
      const d=load(), mo=new Date(); mo.setDate(mo.getDate()-((mo.getDay()+6)%7));
      return Array.from({length:7},(_,i)=>{ const x=new Date(mo); x.setDate(mo.getDate()+i); return d[key(x)]||0; });
    },
    total(){ return Object.values(load()).reduce((a,b)=>a+b,0); },
    days(){ return load(); },
    // letzte n Monate (ältester zuerst) mit Sekunden je Monat
    months(n){
      const d=load(), now=new Date();
      return Array.from({length:n},(_,i)=>{
        const x=new Date(now.getFullYear(),now.getMonth()-(n-1-i),1), pre=x.getFullYear()+'-'+pad(x.getMonth()+1)+'-';
        let sec=0; for(const k in d) if(k.startsWith(pre)) sec+=d[k];
        return {y:x.getFullYear(),m:x.getMonth(),sec};
      });
    }
  };
})();

const SPENDE_URL='https://www.paypal.me/FabianFlemig';

/* ── Bild-Vergrößerung (Lightbox) ───────────────────────────────────────── */
const LIGHTBOX=(function(){
  let box=null, stage=null, content=null, open=false;
  let sc=1, tx=0, ty=0;
  const pts=new Map(); let startDist=0, startSc=1, last=null, lastTap=0;
  function apply(){ content.style.transform=`translate(${tx}px,${ty}px) scale(${sc})`; }
  function reset(){ sc=1; tx=0; ty=0; apply(); }
  function zoomAt(f,cx,cy){
    const n=Math.min(6,Math.max(1,sc*f)), r=n/sc, b=stage.getBoundingClientRect();
    const ox=cx-(b.left+b.width/2), oy=cy-(b.top+b.height/2);
    tx=ox-(ox-tx)*r; ty=oy-(oy-ty)*r; sc=n;
    if(sc===1){ tx=0; ty=0; }
    apply();
  }
  function build(){
    box=document.createElement('div'); box.id='lb'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Bildansicht');
    box.innerHTML='<div class="lb-stage"><div class="lb-content"></div></div><div class="lb-cap"></div>'
      +'<button class="lb-x" aria-label="Schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'
      +'<div class="lb-hint">Zum Zoomen zweimal tippen oder zwei Finger nutzen</div>';
    document.body.appendChild(box);
    stage=box.querySelector('.lb-stage'); content=box.querySelector('.lb-content');
    box.querySelector('.lb-x').onclick=()=>close();
    stage.addEventListener('pointerdown',e=>{
      stage.setPointerCapture(e.pointerId); pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pts.size===2){ const [a,b]=[...pts.values()]; startDist=Math.hypot(a.x-b.x,a.y-b.y); startSc=sc; }
      last={x:e.clientX,y:e.clientY,t:Date.now(),moved:false};
    });
    stage.addEventListener('pointermove',e=>{
      if(!pts.has(e.pointerId)) return;
      const p=pts.get(e.pointerId), dx=e.clientX-p.x, dy=e.clientY-p.y;
      p.x=e.clientX; p.y=e.clientY;
      if(last&&Math.hypot(e.clientX-last.x,e.clientY-last.y)>6) last.moved=true;
      if(pts.size===2){
        const [a,b]=[...pts.values()], d=Math.hypot(a.x-b.x,a.y-b.y);
        if(startDist) zoomAt((startSc*d/startDist)/sc,(a.x+b.x)/2,(a.y+b.y)/2);
      } else if(sc>1){ tx+=dx; ty+=dy; apply(); }
    });
    const up=e=>{
      if(!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if(pts.size===0&&last&&!last.moved&&Date.now()-last.t<350){
        const now=Date.now();
        if(now-lastTap<320){ lastTap=0; if(sc>1) reset(); else zoomAt(2.5,e.clientX,e.clientY); }
        else{
          lastTap=now;
          setTimeout(()=>{ if(lastTap&&Date.now()-lastTap>=300){ lastTap=0; if(sc===1&&!e.target.closest('.lb-x')) close(); } },320);
        }
      }
    };
    stage.addEventListener('pointerup',up); stage.addEventListener('pointercancel',up);
    stage.addEventListener('wheel',e=>{ e.preventDefault(); zoomAt(e.deltaY<0?1.2:1/1.2,e.clientX,e.clientY); },{passive:false});
    document.addEventListener('keydown',e=>{ if(!open) return; if(e.key==='Escape') close(); else if(e.key==='+'||e.key==='=') zoomAt(1.3,innerWidth/2,innerHeight/2); else if(e.key==='-') zoomAt(1/1.3,innerWidth/2,innerHeight/2); else if(e.key==='0') reset(); });
  }
  function show(node,cap){
    if(!box) build();
    content.replaceChildren(node);
    box.querySelector('.lb-cap').textContent=cap||'';
    reset(); box.hidden=false; open=true;
    document.documentElement.classList.add('lb-open');
    try{ history.pushState(history.state,''); }catch(e){}
    box.querySelector('.lb-x').focus({preventScroll:true});
  }
  function close(fromPop){
    if(!open) return;
    open=false; box.hidden=true; content.replaceChildren(); pts.clear();
    document.documentElement.classList.remove('lb-open');
    if(!fromPop) POPGUARD.back();   // den eigenen Verlaufseintrag entfernen, ohne dass ein offenes Kapitelfenster oder die Seite dahinter mitgeschlossen wird
  }
  document.addEventListener('click',e=>{
    if(open) return;
    const img=e.target.closest('img.pdf-img,img.pdf-img-sm');
    if(img){ const c=img.cloneNode(); c.className='lb-img'; c.removeAttribute('style'); c.draggable=false; show(c,img.alt); return; }
    const svg=e.target.closest('.diagram-wrap svg,svg.dg-svg');
    if(svg&&!e.target.closest('a,button')){
      const c=svg.cloneNode(true); c.classList.add('lb-img'); c.removeAttribute('style'); c.removeAttribute('width'); c.removeAttribute('height');
      show(c,svg.getAttribute('aria-label')||'');
    }
  });
  return {open:show,close,isOpen:()=>open};
})();

/* ── App teilen (QR-Code) und Installationshilfe ────────────────────────── */
const APPSHARE=(function(){
  const URL_APP='https://flametan.github.io/BVI-Lernwebsite/';
  let box=null, loading=null;
  function loadLib(){
    if(window.qrcode) return Promise.resolve();
    return loading||(loading=new Promise((ok,fail)=>{
      const s=document.createElement('script'); s.src='js/qrcode.min.js'; s.onload=ok; s.onerror=()=>{ loading=null; fail(); };
      document.head.appendChild(s);
    }));
  }
  function build(){
    box=document.createElement('div'); box.id='share-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','App teilen');
    box.innerHTML='<div class="sh-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t">B VI auf dem Handy öffnen</div>'
      +'<div class="sh-qr" id="sh-qr" role="img" aria-label="QR-Code zum Link der App"></div>'
      +'<div class="sh-u">'+URL_APP.replace('https://','')+'</div>'
      +'<div class="sh-b"><button class="btn btn-gold" id="sh-copy">Link kopieren</button><button class="btn btn-ghost" id="sh-share" hidden>Teilen …</button></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
    box.querySelector('#sh-copy').onclick=async()=>{
      try{ await navigator.clipboard.writeText(URL_APP); TOAST.show('Link kopiert',{type:'ok'}); }
      catch(e){ TOAST.show(URL_APP,{type:'info'}); }
    };
    const sb=box.querySelector('#sh-share');
    if(navigator.share){ sb.hidden=false; sb.onclick=()=>navigator.share({title:'B VI – Höherer Dienst',url:URL_APP}).catch(()=>{}); }
  }
  async function open(){
    if(!box) build();
    box.hidden=false;
    const el=box.querySelector('#sh-qr');
    try{
      await loadLib();
      const q=qrcode(0,'M'); q.addData(URL_APP); q.make();
      el.innerHTML=q.createSvgTag({cellSize:6,margin:2,scalable:true});
    }catch(e){ el.textContent='QR-Code konnte nicht geladen werden – nutze den Link darunter.'; }
    box.querySelector('.sh-x').focus({preventScroll:true});
  }
  function close(){ if(box) box.hidden=true; }
  // QR-Code für beliebigen Text in ein Element zeichnen (z. B. geteilte Lernkarten)
  async function qr(el,text){
    await loadLib();
    const q=qrcode(0,'L'); q.addData(text); q.make();
    el.innerHTML=q.createSvgTag({cellSize:4,margin:2,scalable:true});
  }
  return {open,close,qr};
})();

const INSTALL=(function(){
  let deferred=null;
  window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferred=e; render(); });
  window.addEventListener('appinstalled',()=>{ deferred=null; render(); });
  const ua=navigator.userAgent||'';
  const ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const android=/Android/.test(ua);
  const standalone=()=>window.matchMedia&&(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true);
  function render(){
    const el=document.getElementById('app-device'); if(!el) return;
    let t,steps=[],btn='';
    if(window.BVIAndroid){ t='Du nutzt die Android-App bereits ✓'; }
    else if(standalone()){ t='Die App ist installiert ✓'; }
    else if(ios){ t='So installierst du die App auf deinem iPhone / iPad'; steps=['Öffne diese Seite in <strong>Safari</strong>','Tippe unten auf das <strong>Teilen-Symbol</strong> (□↑)','Wähle <strong>„Zum Home-Bildschirm“</strong> und bestätige mit <strong>„Hinzufügen“</strong>']; }
    else if(android){ t='So installierst du die App auf deinem Android-Gerät'; steps=deferred?['Tippe auf <strong>„Jetzt installieren“</strong> und bestätige']:['Tippe oben rechts auf das <strong>Menü</strong> (⋮)','Wähle <strong>„App installieren“</strong> oder <strong>„Zum Startbildschirm hinzufügen“</strong>','Alternativ: die <strong>APK</strong> weiter unten laden – sie ändert auch das Symbol mit deiner Akzentfarbe']; }
    else { t='So installierst du die App am Computer'; steps=deferred?['Klicke auf <strong>„Jetzt installieren“</strong>']:['Klicke in der Adressleiste auf das <strong>Installieren-Symbol</strong> (Chrome, Edge) oder im Menü auf <strong>„App installieren“</strong>','Auf dem Handy: QR-Code unten scannen']; }
    if(deferred&&!standalone()) btn='<button class="btn btn-gold" onclick="INSTALL.prompt()">Jetzt installieren</button>';
    el.innerHTML='<div class="m-card"><div class="m-eyebrow">Für dein Gerät</div><div class="m-t1" style="margin:4px 0 8px">'+t+'</div>'
      +(steps.length?'<ol class="ap-steps">'+steps.map(x=>'<li>'+x+'</li>').join('')+'</ol>':'')
      +'<div class="ap-act">'+btn+'<button class="btn btn-ghost" onclick="APPSHARE.open()">QR-Code zum Teilen</button></div></div>';
  }
  async function prompt(){ if(!deferred) return; deferred.prompt(); try{ await deferred.userChoice; }catch(e){} deferred=null; render(); }
  return {render,prompt};
})();

/* ── Klausur-Timer für die Übungsklausuren ──────────────────────────────── */
const ETIMER=(function(){
  const KEY='bvi_et_end', VIEWS=['v-klausurfragen','v-feuak-altklausur','v-klausur-0826','v-eingrenzung-klausur','v-laufbahn-2023','v-laufbahn-2026'];
  let pill=null, tick=null, minutes=60;
  const left=()=>{ try{ const e=parseInt(localStorage.getItem(KEY),10); return e?Math.round((e-Date.now())/1000):null; }catch(x){ return null; } };
  const fmt=sec=>{ sec=Math.max(0,sec); const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60; return (h?h+':':'')+String(m).padStart(h?2:1,'0')+':'+String(s).padStart(2,'0'); };
  function ensurePill(){
    if(pill) return;
    pill=document.createElement('div'); pill.id='et-pill'; pill.hidden=true;
    pill.innerHTML='<span class="et-t" role="timer"></span><button class="et-stop" aria-label="Timer beenden">×</button>';
    pill.querySelector('.et-stop').onclick=stop;
    document.body.appendChild(pill);
  }
  function update(){
    const l=left(); ensurePill();
    if(l===null){ pill.hidden=true; clearInterval(tick); tick=null; return; }
    pill.hidden=false;
    pill.classList.toggle('urgent',l<=300&&l>0);
    pill.classList.toggle('over',l<=0);
    pill.querySelector('.et-t').textContent=l>0?'⏱ '+fmt(l):'Zeit um';
    if(l<=-60){ try{ localStorage.removeItem(KEY); }catch(x){} clearInterval(tick); tick=null; pill.hidden=true; return; }   // abgelaufene Zeit nicht ewig anzeigen
    if(l<=0&&!pill.dataset.done){ pill.dataset.done='1'; if(navigator.vibrate) navigator.vibrate([200,100,200]); TOAST.show('Die Zeit ist um – Stift runter!',{type:'ok'}); }
  }
  function start(min){
    if(document.documentElement.classList.contains('no-timers')) return;
    try{ localStorage.setItem(KEY,String(Date.now()+min*60000)); }catch(e){}
    ensurePill(); delete pill.dataset.done; update();
    clearInterval(tick); tick=setInterval(update,1000);
    TOAST.show('Timer läuft: '+min+' Minuten',{type:'ok'});
  }
  function stop(){ try{ localStorage.removeItem(KEY); }catch(e){} update(); }
  function card(){
    return '<div class="m-card et-card"><div class="m-t1">Klausur simulieren</div><div class="m-t2" style="margin:2px 0 10px">Stelle einen Timer und bearbeite die Fragen, ohne in die Musterlösung zu schauen.</div>'
      +'<div class="et-row"><span class="m-seg" role="group" aria-label="Dauer">'+[30,45,60,90].map(m=>'<button class="et-d'+(m===minutes?' active':'')+'" data-m="'+m+'">'+m+' min</button>').join('')+'</span>'
      +'<button class="btn btn-gold et-go">Timer starten</button></div></div>';
  }
  function mount(id){
    if(!VIEWS.includes(id)) return;
    const pc=document.querySelector('#'+id+' .pc'); if(!pc||pc.querySelector('.et-card')) return;
    pc.insertAdjacentHTML('afterbegin',card());
    const c=pc.querySelector('.et-card');
    c.querySelectorAll('.et-d').forEach(b=>b.onclick=()=>{ minutes=+b.dataset.m; c.querySelectorAll('.et-d').forEach(x=>x.classList.toggle('active',x===b)); });
    c.querySelector('.et-go').onclick=()=>start(minutes);
  }
  function init(){
    const l=left();
    if(l!==null&&l<=-60){ try{ localStorage.removeItem(KEY); }catch(x){} return; }   // alter, längst abgelaufener Timer
    if(l!==null){ ensurePill(); if(l<=0) pill.dataset.done='1'; update(); tick=setInterval(update,1000); }
  }
  return {mount,init,start,stop};
})();

/* ── Fehler melden: E-Mail oder GitHub ──────────────────────────────────── */
const REPORT=(function(){
  let box=null;
  function build(){
    box=document.createElement('div'); box.id='rp-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Fehler melden');
    box.innerHTML='<div class="sh-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t">Fehler oder Unklarheit melden</div>'
      +'<div class="m-t2">Seite, Link und App-Version werden automatisch mitgeschickt.</div>'
      +'<div class="sh-b" style="flex-direction:column;align-items:stretch"><a class="btn btn-gold" id="rp-mail">Per E-Mail senden</a><a class="btn btn-ghost" id="rp-gh" target="_blank" rel="noopener noreferrer">Auf GitHub melden (Konto nötig)</a></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')||e.target.closest('a')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
  }
  function open(mail,gh){ if(!box) build(); box.querySelector('#rp-mail').href=mail; box.querySelector('#rp-gh').href=gh; box.hidden=false; box.querySelector('#rp-mail').focus({preventScroll:true}); }
  function close(){ if(box) box.hidden=true; }
  return {open,close};
})();

/* ── Farbschema: Dunkel / Hell / System ─────────────────────────────────── */
/* ── Hintergrundhelligkeit: Regler von Schwarz bis Weiß ───────────────────────
   Leitet Hintergrund, Karten, Linien und Textfarben aus einem Wert 0–100 ab; die Texte bleiben dabei lesbar
   (Kontrast mindestens 4,5:1). Beige-Farbschema = warmer Farbton, sonst neutral. */
const BG=(function(){
  const KEY='bvi_bg', DEFAULTS={dark:7,light:95,beige:77};
  const NAMES=['--m-bg','--m-card','--m-raised','--m-line','--m-bar','--m-fg','--m-muted','--m-dim','--c-bg','--c-navy','--c-navy-2','--c-navy-3','--c-navy-4','--c-slate','--c-slate-l','--c-text','--c-text-b','--glass','--glass-h','--glass-b'];
  function get(){ try{ const v=parseInt(localStorage.getItem(KEY),10); return v>=0&&v<=100?v:null; }catch(e){ return null; } }
  function hsl(h,s,l){   // → [r,g,b]
    s/=100; l/=100; const k=n=>(n+h/30)%12, a=s*Math.min(l,1-l), f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
    return [Math.round(255*f(0)),Math.round(255*f(8)),Math.round(255*f(4))];
  }
  const hex=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
  const lum=c=>{ const f=v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }; return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]); };
  const ratio=(a,b)=>{ const x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
  const mix=(a,b,w)=>a.map((v,i)=>Math.round(v+(b[i]-v)*w));   // w=0 → a, w=1 → b
  // Farben für den Wert t (0–100); warm=true: Beige-Farbton
  function colors(t,warm){
    const h=warm?41:0, s=warm?38:0, dark=t<50;
    const bg=hsl(h,s,t), up=l=>hsl(h,s,Math.max(0,Math.min(100,l)));
    // Kacheln wie in Dunkel und Hell: immer ein Stück heller als der Hintergrund (Leuchtdichte-Verhältnis wie dort,
    // Dunkel 1,12 / Hell 1,07); ganz am weißen Ende, wo es nicht heller geht, stattdessen ein Stück dunkler
    // Beige (hell): wie die Voreinstellung (Kachel 1,18 heller, eingelassene Flächen 1,15 und Linien 1,37 dunkler als der Hintergrund)
    const R=dark?1.12:warm?1.18:1.07, tile=(want)=>{ for(let l=t;l<=100;l+=.5){ const c=up(l); if(ratio(c,bg)>=want) return c; } return null; };
    const shade=want=>{ for(let l=t;l>=0;l-=.5){ const c=up(l); if(ratio(c,bg)>=want) return c; } return up(0); };
    let card=tile(R);
    if(!card){ for(let l=t;l>=0;l-=.5){ card=up(l); if(ratio(card,bg)>=R) break; } }
    const raised=dark?up(t+8):warm?shade(1.15):up(t-6), line=dark?up(t+10):warm?shade(1.37):up(t-12);
    // Textfarbe: die mit dem höheren Kontrast, im warmen Ton leicht bräunlich
    const light=warm?[237,229,214]:[237,237,237], darkc=warm?[40,31,20]:[26,26,26];
    let fg=ratio(light,bg)>ratio(darkc,bg)?light:darkc;
    if(ratio(fg,bg)<6){ const pure=[[255,255,255],[0,0,0]]; fg=pure.reduce((b,c)=>ratio(c,bg)>ratio(b,bg)?c:b,fg); }   // mittlere Töne: reines Weiß oder Schwarz für den bestmöglichen Kontrast
    // gedämpfte Texte: so weit zum Hintergrund hin, wie der Kontrast 4,5:1 (Nebentext) bzw. 4,0:1 (ganz leise) erlaubt
    const soft=min=>{ let w=0; for(let i=1;i<=20;i++){ const c=mix(fg,bg,i/20); if(ratio(c,bg)>=min) w=i/20; else break; } return mix(fg,bg,w); };
    return {bg,card,raised,line,fg,muted:soft(5.2),dim:soft(4.6),dark,fgStrong:lum(fg)>.4?[255,255,255]:[17,17,17],glassH:dark?up(t+7):warm?(tile(1.26)||[250,248,242]):(t>=93?[250,250,248]:up(t+9))};
  }
  function clear(){ const st=document.documentElement.style; NAMES.forEach(n=>st.removeProperty(n)); }
  function apply(){
    const t=get(), de=document.documentElement;
    if(t===null){ clear(); return; }
    const warm=de.getAttribute('data-tone')==='beige', c=colors(t,warm), st=de.style, H=hex;
    de.setAttribute('data-theme',c.dark?'dark':'light');
    const set=(k,v)=>st.setProperty(k,v);
    set('--m-bg',H(c.bg)); set('--m-card',H(c.card)); set('--m-raised',H(c.raised)); set('--m-line',H(c.line)); set('--m-bar',H(c.card));
    set('--m-fg',H(c.fg)); set('--m-muted',H(c.muted)); set('--m-dim',H(c.dim));
    set('--c-bg',H(c.bg)); set('--c-navy',H(c.card)); set('--c-navy-2',H(c.card)); set('--c-navy-3',H(c.raised)); set('--c-navy-4',H(c.line));
    set('--c-slate',H(c.muted)); set('--c-slate-l',H(mix(c.fg,c.muted,.35))); set('--c-text',H(c.fg)); set('--c-text-b',H(c.fgStrong));
    set('--glass',H(c.card)); set('--glass-h',H(c.glassH)); set('--glass-b',H(c.line));
    const m=document.querySelector('meta[name=theme-color]'); if(m) m.content=H(c.bg);
  }
  function sync(){
    const r=document.getElementById('m-bg-range'); if(!r) return;
    const t=get(), mode=(()=>{ try{ return localStorage.getItem('bvi_theme')||'system'; }catch(e){ return 'system'; } })();
    const de=document.documentElement, base=de.getAttribute('data-tone')==='beige'?DEFAULTS.beige:de.getAttribute('data-theme')==='light'?DEFAULTS.light:DEFAULTS.dark;
    r.value=t===null?base:t;
    r.style.background='linear-gradient(90deg,'+(de.getAttribute('data-tone')==='beige'?'#000,#7d6c47 50%,#fff':'#000,#fff')+')';
    const s=document.getElementById('m-bg-sub'); if(s) s.textContent=t===null?'Hintergrund von Schwarz bis Weiß':'Hintergrund: eigene Helligkeit '+t+' %';
  }
  return {
    get, apply, sync, colors, hex, clear,
    set(v){ v=Math.max(0,Math.min(100,Math.round(+v))); try{ localStorage.setItem(KEY,String(v)); }catch(e){} apply(); sync(); try{ ACCENT.syncIcon(); }catch(e){} },
    reset(){ try{ localStorage.removeItem(KEY); }catch(e){} clear(); THEME.render(); sync(); }
  };
})();

const THEME=(function(){
  const KEY='bvi_theme', MODES=['dark','light','beige','system'];
  const mq=window.matchMedia?matchMedia('(prefers-color-scheme: light)'):null;
  function get(){ try{ const m=localStorage.getItem(KEY); return MODES.includes(m)?m:'system'; }catch(e){ return 'system'; } }
  function light(m){ return m==='light'||m==='beige'||(m==='system'&&!!(mq&&mq.matches)); }
  function apply(m){
    const l=light(m), b=m==='beige';
    document.documentElement.setAttribute('data-theme',l?'light':'dark');
    if(b) document.documentElement.setAttribute('data-tone','beige'); else document.documentElement.removeAttribute('data-tone');   // Beige = helles Design mit warmem Farbton
    const t=document.querySelector('meta[name=theme-color]'); if(t) t.content=b?'#ddcfb1':l?'#f4f4f1':'#121212';
    BG.apply();   // eigene Hintergrundhelligkeit (falls gesetzt) legt sich über das Farbschema
    try{ ACCENT.syncIcon(); }catch(e){}   // beim ersten Aufruf ist ACCENT noch nicht angelegt
    document.querySelectorAll('.theme-opt').forEach(b=>{ const on=b.dataset.mode===m; b.classList.toggle('active',on); b.setAttribute('aria-pressed',on); });
  }
  if(mq) (mq.addEventListener?mq.addEventListener.bind(mq,'change'):mq.addListener.bind(mq))(()=>{ if(get()==='system') apply('system'); });
  return {
    init(){ apply(get()); },
    set(m){ if(!MODES.includes(m)) return; try{ localStorage.setItem(KEY,m); localStorage.removeItem('bvi_bg'); }catch(e){} BG.clear(); apply(m); BG.sync(); },
    render(){ apply(get()); }
  };
})();
THEME.init();

/* ── Akzentfarbe der Mobil-Ansicht ──────────────────────────────────────── */
const ACCENT=(function(){
  const KEY='bvi_accent', DEF='#FFA412';
  const PRESETS=[['#FFA412','Orange','orange'],['#C9A84C','Gold','gold'],['#E5484D','Rot','red'],['#3E8EF7','Blau','blue'],['#3DBE7A','Grün','green']];
  const valid=c=>/^#[0-9a-f]{6}$/i.test(c||'');
  function get(){ try{ const c=localStorage.getItem(KEY); return valid(c)?c.toUpperCase():DEF; }catch(e){ return DEF; } }
  function onColor(hex){
    // Schrift auf Akzentfläche: die Farbe (dunkel oder weiß) mit dem höheren WCAG-Kontrast
    const n=parseInt(hex.slice(1),16), ch=v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); };
    const L=.2126*ch(n>>16&255)+.7152*ch(n>>8&255)+.0722*ch(n&255);
    return (L+.05)/(0.0056+.05)>=(1.05)/(L+.05)?'#111':'#fff';   // #111 hat die Leuchtdichte ≈ .0056
  }
  function apply(c){
    const st=document.documentElement.style;
    st.setProperty('--m-accent',c);
    st.setProperty('--m-on-accent',onColor(c));
    favicon(c);
  }
  // Tab-Symbol im Browser: Flamme in der Akzentfarbe (installierte Web-App behält ihr festes Symbol)
  function favicon(c){
    const el=document.getElementById('fav'); if(!el) return;
    const d='M12 2s5 4.6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3 1-6 1-8z';
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${document.documentElement.getAttribute('data-tone')==='beige'?'#ddcfb1':'#0a0a0a'}"/><g transform="translate(-24.8 33.7) scale(23.4)"><path d="${d}" fill="${c}"/><path d="${d}" fill="#fff" fill-opacity=".65" transform="translate(12 17) scale(.52) translate(-12 -17)"/></g></svg>`;
    el.href='data:image/svg+xml,'+encodeURIComponent(svg);
  }
  // Android-App: Startsymbol in der nächstliegenden der 5 Vorgabefarben
  function syncAppIcon(c){
    if(!window.BVIAndroid||!BVIAndroid.setIcon) return;
    const rgb=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};
    const [r,g,b]=rgb(c);
    let best=PRESETS[0],min=Infinity;
    PRESETS.forEach(p=>{const [x,y,z]=rgb(p[0]),d=(r-x)**2+(g-y)**2+(b-z)**2;if(d<min){min=d;best=p;}});
    const light=document.documentElement.getAttribute('data-theme')==='light', beige=document.documentElement.getAttribute('data-tone')==='beige';
    try{ BVIAndroid.setIcon(best[2]+(beige?'_beige':light?'_light':'')); }catch(e){}
    try{ if(BVIAndroid.setWidgetStyle) BVIAndroid.setWidgetStyle(c,light); }catch(e){}
  }
  function render(){
    const cur=get(), custom=!PRESETS.some(p=>p[0]===cur);
    const html=PRESETS.map(([c,n])=>`<button class="m-sw" role="radio" aria-checked="${c===cur}" aria-label="${n}" style="background:${c}" onclick="ACCENT.set('${c}')"></button>`).join('')
      +`<label class="m-sw m-sw-wheel" role="radio" aria-checked="${custom}" aria-label="Eigene Farbe wählen">${custom?`<i style="background:${cur}"></i>`:''}<input type="color" value="${cur.toLowerCase()}" oninput="ACCENT.preview(this.value)" onchange="ACCENT.set(this.value)"></label>`;
    document.querySelectorAll('#m-accent,.ob-accent').forEach(el=>{ el.innerHTML=html; });
  }
  return {
    init(){ const c=get(); apply(c); syncAppIcon(c); },
    set(c){ if(!valid(c)) return; c=c.toUpperCase(); try{ localStorage.setItem(KEY,c); }catch(e){} apply(c); syncAppIcon(c); render(); },
    preview(c){ if(valid(c)) apply(c); },
    syncIcon(){ syncAppIcon(get()); },
    render
  };
})();
ACCENT.init();
ETIMER.init();

/* ── Mobil-Ansicht: Tab-Leiste, Startseite, Prüfung, Einstellungen ──────── */
const SHELL=(function(){
  /* Navigationsleiste: fünf feste Plätze; der mittlere ist der Mittelknopf, der rechte gehört den Einstellungen.
     Jeder Platz zeigt einen Tab oder zwei (Auswahl beim Antippen). Einstellbar über Dropdowns in den Einstellungen. */
  const NAVBAR=(function(){
    const KEY='bvi_nav2', FABI=2, SETI=4, STI=0;
    const IC={
      start:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
      plan:'<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
      exam:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
      pause:'<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path class="st1" d="M8 2.5c-.6 1 .6 1.8 0 3"/><path class="st2" d="M12 2.5c-.6 1 .6 1.8 0 3"/>',
      cards:'<rect class="cf" x="2.5" y="7" width="15" height="14" rx="2.5"/><path class="cb" d="M6.5 3.5h12a2.5 2.5 0 0 1 2.5 2.5v11"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'};
    // gefüllte Ebene: Lernkarten als zwei geschlossene Karten (hintere dunkler, vordere davor; die Kopie cb2 ist für den Tauscheffekt)
    const ICF={cards:'<rect class="cb" x="6.5" y="3.5" width="14.5" height="13.5" rx="2.5"/><rect class="cf" x="2.5" y="7" width="15" height="14" rx="2.5"/><rect class="cb2" x="6.5" y="3.5" width="14.5" height="13.5" rx="2.5"/>'};
    ICF.settings=IC.settings.replace(/^(<circle[^>]*\/>)([\s\S]*)$/,'$2$1');   // Zahnrad: erst Körper, dann der Kreis darüber, so bleibt die Mitte frei
    const T={
      start:{n:'Start',s:'Start',go:()=>NAV.home()},
      plan:{n:'Stundenplan',s:'Plan',go:()=>NAV.tab('v-plan','Stundenplan')},
      exam:{n:'Prüfung',s:'Prüfung',go:()=>NAV.tab('v-pruefung','Prüfung')},
      pause:{n:'Pausenraum',s:'Pause',go:()=>NAV.tab('v-pause','Pausenraum')},
      cards:{n:'Lernkarten',s:'Karten',go:()=>NAV.tab('v-flashcards','Lernkarten')},
      settings:{n:'Einstellungen',s:'Einst.',go:()=>NAV.tab('v-settings','Einstellungen')}};
    const IDS=Object.keys(T);
    const DEF={slots:[['start'],['plan'],['exam'],['pause','cards'],['settings']]};
    const clone=o=>JSON.parse(JSON.stringify(o));
    const svg=(inner,cls)=>'<svg'+(cls?' class="'+cls+'"':'')+' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+inner+'</svg>';
    const pairSvg=(a,b,cls)=>{ const f=cls==='f', g=x=>(f&&ICF[x])||IC[x]; return svg('<g class="pa pa1"><g transform="translate(-.5 6.5) scale(.5)" stroke-width="3.4">'+g(a)+'</g></g><g class="pa pa2"><g transform="translate(12.5 6.5) scale(.5)" stroke-width="3.4">'+g(b)+'</g></g><path d="M14.2 3.5 9.8 20.5" stroke-width="1.6"/>',cls); };
    function valid(c){
      if(!c||!Array.isArray(c.slots)||c.slots.length!==5) return false;
      if(!c.slots.every(x=>Array.isArray(x)&&x.length>=1&&x.length<=2&&x.every(t=>IDS.includes(t)))) return false;
      const all=[].concat(...c.slots); if(new Set(all).size!==all.length) return false;   // jeder Tab höchstens einmal
      return c.slots[SETI][0]==='settings'&&c.slots[STI][0]==='start';   // Start ganz links, Einstellungen ganz rechts
    }
    function load(){ try{ const c=JSON.parse(localStorage.getItem(KEY)||'null'); if(valid(c)) return c; }catch(e){} return clone(DEF); }
    let cfg=load(), sel=FABI;
    function save(){ try{ localStorage.setItem(KEY,JSON.stringify(cfg)); }catch(e){} }
    const key=s=>s.join(' ');
    function label(s){ return s.length===1?T[s[0]].n:s.map(x=>T[x].s).join('/'); }
    function curTab(){ return window.__navTab||'start'; }
    function apply(){ const t=curTab(); document.querySelectorAll('#m-tabbar [data-tabs],#m-rail [data-tab]').forEach(b=>{ const on=(b.dataset.tabs||b.dataset.tab||'').split(' ').includes(t); b.classList.toggle('on',on); if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); }); }
    function render(){
      const bar=document.getElementById('m-tabbar'); if(!bar) return;
      bar.style.gridTemplateColumns='repeat(5,1fr)';
      bar.innerHTML=cfg.slots.map((s,i)=>{
        const fab=i===FABI, one=s.length===1;
        const click='NAVBAR.tap(this);'+(one?'NAVBAR.go(\''+s[0]+'\')':'PMENU.toggle(event,this)');
        const attrs=one?'':' aria-haspopup="menu" aria-expanded="false" aria-controls="m-pmenu"';
        // Icon Fill: Umriss-Ebene (o) und gefüllte Ebene (f); die gefüllte füllt sich beim aktiven Tab von der Mitte aus
        const ic=fab?(one?svg(IC[s[0]]):pairSvg(s[0],s[1])):'<span class="m-tic">'+(one?svg(IC[s[0]],'o')+svg(ICF[s[0]]||IC[s[0]],'f'):pairSvg(s[0],s[1],'o')+pairSvg(s[0],s[1],'f'))+'</span>';
        return '<button class="m-tab'+(fab?' m-tab-center':'')+'" data-tab="'+s[0]+'" data-tabs="'+key(s)+'" data-ic="'+(one?s[0]:'pair')+'" onclick="'+click+'"'+attrs+'>'+(fab?'<span class="m-fab">'+ic+'</span>':ic)+'<span>'+label(s)+'</span></button>';
      }).join('');
      apply();
    }
    function go(id){ PMENU.close(); T[id].go(); }
    /* ---- Einstellungen ---- */
    const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const pos=id=>{ for(let i=0;i<5;i++){ const m=cfg.slots[i].indexOf(id); if(m>=0) return [i,m]; } return null; };
    const unplaced=()=>IDS.filter(t=>!pos(t));
    function renderSettings(){
      const el=document.getElementById('nav-edit'); if(!el) return;
      const sl=cfg.slots, i=sel, cur=sl[i], up=unplaced();
      const prev='<div class="nb-prev" role="group" aria-label="Plätze der Navigationsleiste">'+sl.map((s,k)=>'<button type="button" class="nb-p'+(k===FABI?' nb-fab':'')+(k===i?' nb-sel':'')+'" aria-pressed="'+(k===i)+'" aria-label="Platz '+(k+1)+': '+esc(label(s))+'" onclick="NAVBAR.select('+k+')">'+(s.length===1?svg(IC[s[0]]):pairSvg(s[0],s[1]))+'<span>'+esc(label(s))+'</span></button>').join('')+'</div>';
      const tabOpts=IDS.filter(t=>(t!=='settings'||i===SETI)&&(t!=='start'||i===STI)).map(t=>'<option value="'+t+'"'+(t===cur[0]?' selected':'')+'>'+esc(T[t].n)+(up.includes(t)?' (zurzeit nicht in der Leiste)':'')+'</option>').join('');
      const partnerOpts='<option value=""'+(cur.length===1?' selected':'')+'>Einzeln (ohne zweiten Tab)</option>'+IDS.filter(t=>t!==cur[0]&&t!=='settings'&&t!=='start').map(t=>'<option value="'+t+'"'+(cur[1]===t?' selected':'')+'>mit „'+esc(T[t].n)+'“ zusammenlegen'+(up.includes(t)?' (zurzeit nicht in der Leiste)':'')+'</option>').join('');
      el.innerHTML='<p class="nb-t">Tippe oben auf den Platz, den du ändern willst, und wähle darunter den Tab. Start steht immer ganz links, der mittlere Platz bleibt der Mittelknopf, die Einstellungen stehen immer ganz rechts. Ein Platz kann einzeln bleiben oder sich mit einem zweiten Tab teilen (beim Antippen erscheint dann eine Auswahl). Es müssen nicht alle sechs Tabs in der Leiste stehen.</p>'
        +'<div class="nb-h">Leiste (antippen zum Ändern)</div>'+prev
        +'<div class="nb-panel"><div class="nb-h">Platz '+(i+1)+(i===FABI?' · Mittelknopf':i===SETI?' · Einstellungen':i===STI?' · Start':'')+'</div>'
        +'<label class="nb-f">Tab<select onchange="NAVBAR.setTab(this.value)"'+(i===SETI||i===STI?' disabled':'')+'>'+tabOpts+'</select></label>'
        +'<label class="nb-f">Platz teilen<select onchange="NAVBAR.setPartner(this.value)">'+partnerOpts+'</select></label>'
        +(up.length?'<p class="nb-t nb-sm">Nicht in der Leiste: '+up.map(t=>esc(T[t].n)).join(', ')+'. Du erreichst sie weiterhin über die Startseite und die Seitenleiste am PC.</p>':'<p class="nb-t nb-sm">Alle sechs Tabs stehen in der Leiste.</p>')
        +'</div><div class="nb-act"><button type="button" class="btn btn-ghost" onclick="NAVBAR.reset()">Zurücksetzen</button></div>';
    }
    function commit(){ save(); render(); renderSettings(); }
    function swap(p,q){ const t=cfg.slots[p[0]][p[1]]; cfg.slots[p[0]][p[1]]=cfg.slots[q[0]][q[1]]; cfg.slots[q[0]][q[1]]=t; }
    return {
      init(){ render(); renderSettings(); },
      render, renderSettings, go, mark(){ apply(); },
      select(i){ sel=i; renderSettings(); },
      setTab(id){
        if(sel===SETI||sel===STI||id==='settings'||id==='start'||!IDS.includes(id)) return;
        const p=[sel,0], q=pos(id);
        if(!q) cfg.slots[sel][0]=id;                 // war nicht in der Leiste: ersetzt den bisherigen Tab
        else if(q[0]===p[0]&&q[1]===p[1]) return;
        else swap(p,q);                              // stand schon in der Leiste: beide tauschen den Platz
        commit();
      },
      setPartner(id){
        const i=sel, cur=cfg.slots[i];
        if(!id){ if(cur.length===2){ cur.splice(1,1); commit(); } else renderSettings(); return; }
        if(!IDS.includes(id)||id==='settings'||id==='start'||id===cur[0]||cur[1]===id) return;
        const freed=cur.length===2?cur[1]:null;      // bisheriger Partner wird frei
        const q=pos(id);
        if(q){
          if(cfg.slots[q[0]].length===2) cfg.slots[q[0]].splice(q[1],1);
          else {                                     // Platz würde leer: mit einem freien Tab füllen
            const filler=freed||unplaced().find(t=>t!==id)||(()=>{ const k=cfg.slots.findIndex((x,n)=>n!==i&&x.length===2); return k>=0?cfg.slots[k].splice(1,1)[0]:null; })();
            if(!filler) return renderSettings();
            cfg.slots[q[0]][0]=filler;
          }
        }
        cur.length=1; cur.push(id);
        commit();
      },
      reset(){ cfg=clone(DEF); sel=FABI; try{ localStorage.removeItem(KEY); localStorage.removeItem('bvi_nav'); }catch(e){} render(); renderSettings(); },
      pairOf(btn){ return (btn.dataset.tabs||'').split(' ').filter(Boolean); },
      // kurze, zum Symbol passende Klick-Animation (Hüpfen, Wackeln, Drehen, Häkchen zeichnen …)
      tap(btn){ if(!btn) return; btn.classList.remove('tap'); void btn.offsetWidth; btn.classList.add('tap'); clearTimeout(btn._tp); btn._tp=setTimeout(()=>btn.classList.remove('tap'),900); },
      T, IC, ICF, svg
    };
  })();
  window.NAVBAR=NAVBAR;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>NAVBAR.init()); else NAVBAR.init();
  /* Pause / Karten und andere geteilte Plätze: Tab öffnet eine Auswahl über der Leiste */
  const PMENU=(function(){
    let anchor=null;
    const el=()=>document.getElementById('m-pmenu');
    function place(){ const m=el(), t=anchor; if(!m||!t) return; const r=t.getBoundingClientRect(); const L=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,r.left+r.width/2-m.offsetWidth/2)); m.style.left=L+'px'; m.style.setProperty('--pm-ax',(r.left+r.width/2-L)+'px'); m.style.bottom=(innerHeight-r.top+8)+'px'; }
    function close(){ const m=el(); if(!m||m.hidden) return; m.hidden=true; if(anchor) anchor.setAttribute('aria-expanded','false'); anchor=null; }
    function open(btn){ const m=el(); if(!m) return; const ids=NAVBAR.pairOf(btn); m.innerHTML=ids.map(id=>'<button role="menuitem" onclick="NAVBAR.go(\''+id+'\')">'+NAVBAR.svg(NAVBAR.IC[id])+'<span>'+NAVBAR.T[id].n+'</span></button>').join(''); anchor=btn; m.hidden=false; place(); btn.setAttribute('aria-expanded','true'); m.querySelector('button')?.focus({preventScroll:true}); }
    document.addEventListener('click',e=>{ const m=el(); if(m&&!m.hidden&&!e.target.closest('#m-pmenu')&&!e.target.closest('#m-tabbar [aria-haspopup]')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
    addEventListener('resize',close);
    return { toggle(e,btn){ e&&e.stopPropagation(); const m=el(); if(m&&m.hidden||anchor!==btn){ close(); open(btn); } else close(); }, close };
  })();
  window.PMENU=PMENU;
  const ROOTS={'v-home':'start','v-plan':'plan','v-pruefung':'exam','v-settings':'settings','v-pause':'pause','v-flashcards':'cards'};
  const MODS=[
    ['gal','GAL','Grundlehrgang','v-gal','GAL Grundlehrgang',1],
    ['sfs','SFS','Staatliche Feuerwehrschule Regensburg','v-sfs','SFS Regensburg',1],
    ['hlfs','HLFS','Hessische Landesfeuerwehrschule Kassel','v-hlfs','HLFS Kassel',1],
    ['ibk','IBK','Institut für Brand- und Katastrophenschutz Heyrothsberge','v-ibk','IBK Heyrothsberge',2],
    ['vak','VAk','Verwaltungsakademie Berlin','v-vak','VAk Berlin',2],
    ['feuak','FeuAK','Feuerwehrakademie Hamburg','v-feuak','FeuAK Hamburg',2],
    ['idf','IdF','Institut der Feuerwehr NRW · Münster','v-idf','IdF Münster',2]
  ];
  const EXAMS=[
    ['Laufbahnprüfung',[
      ['v-lb-start','Laufbahnprüfung','IBK-Klausuren und VB-Übungsklausur mit Musterlösungen · Passwort nötig','doc',true],
      ['v-laufbahn-2026','Laufbahnklausuren Juni 2026','Recht, Management, Stabsarbeit, Vorbeugender Brandschutz · Musterlösungen','doc'],
      ['v-laufbahn-2023','Laufbahnklausuren Dez 2023','Führungsvorgang, Recht, Management, Heyrothsberge · Musterlösungen','doc']]],
    ['IdF Münster',[
      ['v-idf-altklausur','Altklausur-Quiz IdF',(typeof IDF_QUIZ_Q!=='undefined'?IDF_QUIZ_Q.length:0)+' Fragen · Vorbeugender Brandschutz & Stabsarbeit · Lern- und Prüfungsmodus','doc',true]]],
    ['FeuAK Hamburg',[
      ['v-klausur-0826','Klausur 08/2026','14 Originalfragen · 70 Punkte · Musterlösungen','doc',true],
      ['v-klausurfragen','Klausurfragen','14 Fragen der Dozenten-Liste · Freitext und Selbstbewertung','pen'],
      ['v-eingrenzung-klausur','Eingrenzung 08/2026 & Münster','12 Fragen · Kurzantwort und Musterlösung','target'],
      ['v-feuak-altklausur','Altklausur-Training FeuAK','22 Fragen aus Aug 2025 und Feb 2026','doc']]],
    ['VAk Berlin',[
      ['v-vak-altklausur','Altklausur-Quiz VAk','84 Fragen · Lernmodus oder Prüfungssimulation','doc',true],
      ['v-vak-fallbearbeitung','Fallbearbeitung','9-Punkte-Schema mit sechs Übungsfällen','pen',true],
      ['v-vak-klausurhinweise','Klausurhinweise','Prüfungsrelevante Themen und Definitionen','doc'],
      ['v-vak-klausurvorbereitung','Klausurvorbereitung VAk','Alle VAk-Materialien auf einen Blick','target']]],
    ['IBK Heyrothsberge',[
      ['v-simulator','Führungsdienstsimulator','8 Szenarien mit verzweigten Entscheidungen','sim',true]]]
  ];
  JG.setExams(EXAMS);
  const ICON={
    doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    sim:'<path d="M12 2s5 4.6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3 1-6 1-8z"/>',
    cal:'<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    cloud:'<path d="M18 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7"/><path d="M15 3h6v6M10 14 21 3"/>',
    exam:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    cards:'<rect x="2.5" y="7" width="15" height="14" rx="2.5"/><path d="M6.5 3.5h12a2.5 2.5 0 0 1 2.5 2.5v11"/>',
    play:'<path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z" fill="currentColor" stroke="none"/>',
    cup:'<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 2.5c-.6 1 .6 1.8 0 3M12 2.5c-.6 1 .6 1.8 0 3"/>',
    flame:'<path d="M12 2s5 4.6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3 1-6 1-8z" fill="currentColor" stroke="none"/>'
  };
  const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const goJs=(id,label)=>esc(`NAV.go(${JSON.stringify(id)},${JSON.stringify(label)})`);
  const row=({ic,t1,t2,on,right=''})=>`<button class="m-row m-go" onclick="${on}">${ic}<span class="m-tx"><span class="m-t1">${esc(t1)}</span>${t2?`<span class="m-t2">${esc(t2)}</span>`:''}</span>${right}</button>`;
  const ic=k=>`<span class="m-ic">${svg(k)}</span>`;

  // Startseite: Gruß und Spruch je Tageszeit; der Spruch bleibt pro App-Öffnung gleich
  const GREET={night:'Noch wach?',morning:'Guten Morgen',noon:'Mahlzeit',afternoon:'Guten Tag',evening:'Guten Abend'};
  const QUIPS={
    night:[
      "Die Leitstelle schläft nie – du offenbar auch nicht.",
      "Nachtschicht am Schreibtisch: Der Lagevortrag hält dich wach.",
      "Um diese Uhrzeit lernt nur, wer wirklich Bereitschaft hat.",
      "Selbst die Brandmeldeanlage gönnt sich gerade Ruhe.",
      "Nachteule erkannt. Kaffee ist keine Dauerlösung.",
      "Funkstille überall, nur dein Kopf ist noch auf Empfang.",
      "Ruhezeiten gelten auch für Führungskräfte. Nur so als Hinweis.",
      "Das Einsatztagebuch notiert: „Lernbetrieb weiterhin aktiv.“",
      "Mondschein, Monitorlicht und Musterbauordnung – romantischer wird's nicht.",
      "Selbst der Sicherheitstrupp hat jetzt Pause.",
      "Die Klausur schreibt man tagsüber. Nur so als Tipp.",
      "Nächtlicher Alarm? Nein, nur dein Ehrgeiz.",
      "Schlaf ist auch eine Lernmethode. Wissenschaftlich belegt.",
      "Wer um diese Zeit Gebäudeklassen paukt, verdient einen Orden.",
      "Die Stabsrahmenübung »Schlafmangel« läuft bereits.",
      "„Nur noch eine Karte“ – sagen alle um diese Uhrzeit.",
      "Sogar der Rauchmelder blinzelt dir müde zu.",
      "Lagefeststellung: Es ist dunkel, und du lernst. Respekt.",
      "Die Wache schläft, die Lernkarten nicht.",
      "Morgen früh dankt dir dein Kopf – oder er beschwert sich.",
      "Die Sterne leuchten, die Lernkarten auch.",
      "Bereitschaftsdienst im Schlafanzug – auch eine Dienstform.",
      "Wenn jetzt der Melder geht, bist du wenigstens schon wach.",
      "Nachtruhe ist kein Dienstvergehen. Nur so.",
      "Um diese Zeit zählt jede Karte doppelt. Gefühlt.",
      "Der Wachhabende fragt: Alles ruhig bei dir?",
      "Das Wissen sickert nachts besonders tief ein. Angeblich.",
      "Wach wie ein Nachtalarm, fleißig wie eine ganze Wachabteilung.",
      "Noch eine Frage, dann ist aber wirklich Licht aus.",
      "Die Wärmebildkamera würde jetzt nur dich und den Bildschirm sehen.",
      "Nachts sind alle Gebäudeklassen grau.",
      "Ein kurzer Blick auf den Plan – und dann ab ins Bett.",
      "Stille Wache am Schreibtisch: angetreten.",
      "Kaffee um diese Uhrzeit ist ein taktischer Fehler.",
      "Selbst die Pforte hat schon das Licht gedimmt.",
      "Du lernst, während andere schnarchen. Respekt.",
      "Nachtdienst-Modus: aktiviert.",
      "Morgen wirst du dich fragen, warum du so lange wach warst.",
      "Die Nacht ist kurz, die FwDV lang.",
      "Schlafen ist die beste Wiederholung. Gute Nacht – bald!"
    ],
    morning:[
      "Kaffee an, Gehirn hochfahren, Lagefeststellung beginnen.",
      "Frühdienst! Heute wird gelernt, nicht nur gelöscht.",
      "Der frühe Vogel kennt alle Gebäudeklassen.",
      "Erst Kaffee, dann Krisenstab.",
      "Morgenappell: Alle Synapsen bitte vollzählig antreten.",
      "Wissen kalt einspeisen, Kaffee heiß trinken.",
      "Heute sagst du S1 bis S6 im Schlaf auf. Na ja, fast.",
      "Die Sonne geht auf, der Lernfortschritt hoffentlich auch.",
      "Morgenstund hat Gold im Mund – und die FwDV im Kopf.",
      "Fahrzeughalle offen, Kopf auch. Los geht's.",
      "Einsatzbereitschaft hergestellt. Jetzt fehlt nur noch der Kaffee.",
      "Heute ist ein guter Tag für einen sauberen Führungsvorgang.",
      "Wer morgens lernt, muss abends nicht büffeln.",
      "Erste Lagemeldung: motiviert, aber noch im Bademantel.",
      "Das Frühstück ist die wichtigste Mahlzeit – direkt nach den Lernkarten.",
      "Alarmstufe Kaffee: erreicht.",
      "Die Brötchen sind frisch, die Rechtsgrundlagen hoffentlich auch.",
      "Wach werden ist auch eine Form von Lagebeurteilung.",
      "Der innere Schweinehund bekommt heute keinen Einsatzbefehl.",
      "Guten Start – heute wird's ein Wissens-Großeinsatz.",
      "Der Tag hat gerade erst ausgerückt.",
      "Das Funkgerät ist noch still, der Kopf schon an.",
      "Wer früh aufsteht, hat mehr Zeit für Lernkarten.",
      "Frisch geduscht, frisch motiviert.",
      "Heute schon Fahrzeugkunde gemacht? Zur Not tut's auch eine Lernkarte.",
      "Morgenlage: Wetter egal, Motivation hoch.",
      "Atemschutzüberwachung läuft – du atmest, also lernst du.",
      "Kaffee ist das Löschmittel gegen Müdigkeit.",
      "Erste Übung des Tages: Augen offen halten.",
      "Der Morgen gehört den Schnellen und den Neugierigen.",
      "Gestern ist abgearbeitet, heute ist ein neuer Einsatz.",
      "Fahrzeugcheck erledigt? Dann jetzt Kopfcheck.",
      "Früh übt sich, wer in den höheren Dienst will.",
      "Ein Frühstücksbrötchen und eine Lernkarte, bitte.",
      "Die Sonne meldet: einsatzbereit. Und du?",
      "Heute schreiben wir Geschichte. Oder wenigstens Stichpunkte.",
      "Gute Laune ist ansteckend. Wissen hoffentlich auch.",
      "Wer morgens schon hier ist, hat den Tag im Griff.",
      "Ab in den Tag – mit Plan, Kaffee und Lernkarten.",
      "Schichtbeginn: Kopf auf Empfang, Handy auf Lernen."
    ],
    noon:[
      "Mittagspause naht. Vorher noch schnell eine Karte?",
      "Erst die Karten, dann die Kantine.",
      "Der Magen knurrt lauter als jedes Funkgerät.",
      "Lagefeststellung: Hunger. Maßnahme: Mittagessen.",
      "Halbzeit! Die zweite Hälfte des Tages wartet schon.",
      "Zwischen Suppe und Stabsarbeit passt noch eine Lernkarte.",
      "Die Kantine ist kein Bereitstellungsraum. Aber fast.",
      "Nachschub angefordert: Essen und Wissen.",
      "Löschwasserversorgung ist wichtig. Trinkwasserversorgung auch.",
      "Auch Führungskräfte brauchen Verpflegung. Zuständig: S4.",
      "Nach dem Essen sollst du ruhen oder tausend Karten üben.",
      "Der Küchenwagen ist schon unterwegs. Hoffentlich.",
      "Kurze Pause im Einsatzabschnitt Schreibtisch.",
      "Satt und schlau – die perfekte Kombination.",
      "Mittagstief? Nicht mit dir.",
      "Schnitzel mit Brandschutzordnung – das Tagesgericht.",
      "Die Lernkarten essen übrigens nicht mit.",
      "Wer mit vollem Bauch lernt, lernt doppelt. Behauptet zumindest der Koch.",
      "Volle Teller, volle Akkus, voller Lernplan.",
      "13 Uhr ist Mittag. Bis dahin zählt jede Minute.",
      "Nachtisch gibt's erst nach drei Karten.",
      "Kurze Lagebesprechung: Was gibt's heute in der Kantine?",
      "Die Mittagspause ist heilig. Die Lernkarten sind geduldig.",
      "Satt werden ist auch eine Form von Eigenschutz.",
      "Ein Lernhäppchen zum Mittagessen?",
      "Pünktlich um 13 Uhr wird verpflegt – bis dahin wird gelernt.",
      "Mittag ist, wenn der Kopf nach Kartoffeln verlangt.",
      "Zwischen Hauptgang und Dessert passt immer eine Definition.",
      "Auch die Wache macht jetzt Mittag. Fast alle.",
      "Die Verpflegungskomponente ist angefordert.",
      "Mittagsrapport: halb geschafft, halb satt.",
      "Kurze Pause, große Wirkung.",
      "Heute auf dem Speiseplan: Brandschutz à la carte.",
      "Wer mittags lernt, verdaut doppelt.",
      "Erst essen, dann Einsatzplanung.",
      "Mit leerem Magen löscht es sich schlecht.",
      "Mittag! Zeit, die Akkus aufzuladen.",
      "Ein Teller Nudeln und ein Prüfschema – das Mittagsmenü.",
      "Der Kopf braucht Pause, der Bauch braucht Essen.",
      "Halbzeitpfiff! Kurz durchatmen."
    ],
    afternoon:[
      "Mittagstief überstanden? Dann ab an die Karten.",
      "Kaffee Nummer drei zählt offiziell als Lernhilfe.",
      "Zeit für Kaffee, Kuchen und Krisenkommunikation.",
      "Die zweite Welle rollt an: Konzentration nachfordern!",
      "Halte durch – der Feierabend ist schon in Sichtweite.",
      "Das Gehirn meldet: Kapazität für noch ein Kapitel.",
      "Perfekte Zeit, um eine Klausurfrage zu knacken.",
      "Kuchenpause ist auch ein taktischer Rückzug.",
      "Kleine Nachforderung: noch zehn Minuten Fokus.",
      "Nachmittags lernen ist wie Nachlöschen – lohnt sich immer.",
      "Die Sonne sinkt, das Wissen steigt.",
      "Kurz die Lage beurteilen und dann Vollgas.",
      "Zwischen Kaffee und Feierabend passt noch ein Prüfschema.",
      "Der Tag ist noch jung. Na ja, mittelalt.",
      "Gute Nachricht: Mehr als die Hälfte des Tages ist geschafft.",
      "Der Nachmittag gehört den Fleißigen – und den Kuchenessern.",
      "Wer jetzt noch lernt, hat den Rückzugsbefehl elegant überhört.",
      "Nachmittagsübung: Die Lernkarten warten schon.",
      "Ein Kapitel noch, dann darfst du an den Kühlschrank.",
      "Feierabend kommt sowieso. Wissen nur, wenn du was tust.",
      "Das Nachmittagsprogramm: Kaffee, Kekse, Kompetenz.",
      "Die Uhr tickt Richtung Feierabend – du tickst Richtung Klausur.",
      "Jetzt wird's spannend: Endspurt des Tages.",
      "Konzentration ist wie Löschwasser – rechtzeitig nachfüllen.",
      "Kleiner Energieschub gefällig? Eine Lernkarte wirkt Wunder.",
      "Der Nachmittag ist lang genug für ein ganzes Kapitel.",
      "Wer jetzt dranbleibt, darf abends entspannen.",
      "Lagebild: müde Augen, wache Gedanken.",
      "Zeit für eine Lernrunde mit Kuchenbegleitung.",
      "Noch nicht Feierabend? Perfekt für eine Wiederholung.",
      "Nachmittagsdienst: Wissen nachfordern, Müdigkeit zurückstellen.",
      "Ein Keks pro richtiger Antwort. Deal?",
      "Die Sonne wandert, du lernst.",
      "Jetzt noch kurz durchziehen, dann ist der Tag gewonnen.",
      "Stabsarbeit am Nachmittag: S3 übernimmt deine Motivation.",
      "Gähnen ist erlaubt, Aufgeben nicht.",
      "Ein paar Karten noch, dann darfst du den Rechner ausmachen.",
      "Wer nachmittags lernt, hat abends frei.",
      "Zweiter Trupp vor: Konzentration, Wasser marsch!",
      "Fast geschafft – der Feierabend steht schon im Bereitstellungsraum."
    ],
    evening:[
      "Feierabend? Nicht für deinen Ehrgeiz.",
      "Couch, Tee und ein bisschen Verwaltungsrecht – so geht Entspannung.",
      "Der Kaminabend ist eröffnet. Thema: Lernen.",
      "Abendrunde: Ein paar Karten noch, dann ist Schluss.",
      "Wer abends lernt, träumt nachts von Gebäudeklassen.",
      "Abendlage: Was hast du heute gelernt?",
      "Die Fahrzeughalle ist sauber, jetzt ist der Kopf dran.",
      "Die Serie kann warten. Die FwDV nicht.",
      "Ein guter Tag endet mit einer guten Wiederholung.",
      "Einsatznachbesprechung des Tages: Lernkarten zählen dazu.",
      "Abendbrot erledigt? Dann jetzt Abendwissen.",
      "Die Sonne ist weg, die Motivation hoffentlich nicht.",
      "Noch eine Fragerunde vor dem Schlafengehen?",
      "Abends ist die Lage ruhig – perfekt zum Lernen.",
      "Kurze Lernschicht, dann ab in die Bereitschaft.",
      "Rückbau des Tages beginnt. Vorher noch eine Karte.",
      "Wer abends lernt, startet morgen mit Vorsprung.",
      "Zeit für eine entspannte Lagebesprechung mit dir selbst.",
      "Gleich ist Ruhezeit. Vorher noch ein kleines Erfolgserlebnis?",
      "Der Tag war lang, die Karteikarten sind kurz.",
      "Feierabendbier? Erst nach der Lernkarte.",
      "Abends werden die Fleißigen sichtbar.",
      "Schicht im Schacht – fast.",
      "Die Lernkarten freuen sich über Abendbesuch.",
      "Ein bisschen Wissen zum Abendbrot.",
      "Abendroutine: Zähne putzen, Karten lernen, schlafen.",
      "Heute schon geglänzt? Hier kannst du noch nachlegen.",
      "Der Abend gehört dir – und ein bisschen der FwDV.",
      "Abendlage: Akkus niedrig, Wissen hoch.",
      "Noch schnell den Tag sichern, dann Feierabend.",
      "Lesezeichen setzen und morgen weitermachen – auch ein Plan.",
      "Gemütlich lernen ist auch lernen.",
      "Abendsonne, Abendruhe, Abendrunde.",
      "Ein Prüfschema vor dem Schlafen – das Gute-Nacht-Märchen für Profis.",
      "Heute war ein guter Tag. Mit einer Karte wird er noch besser.",
      "Die Wache wechselt, du bleibst dran.",
      "Schluss machen ist erlaubt. Eine Karte vorher auch.",
      "Abends lernt es sich ohne Funkverkehr am besten.",
      "Der Tag geht, das Wissen bleibt.",
      "Gleich Feierabend – aber vorher noch ein kleiner Sieg."
    ]
  };
  const daySlot=h=>h>=22||h<5?'night':h<11?'morning':h<14?'noon':h<18?'afternoon':'evening';
  let _quip=null;
  // Satz bleibt, solange die Startseite nur neu gezeichnet wird; beim erneuten Aufrufen der Seite (newQuip) kommt ein anderer
  function quip(slot){
    if(!_quip||_quip.slot!==slot){ const l=QUIPS[slot], old=_quip&&_quip.text; let t; do{ t=l[Math.floor(Math.random()*l.length)]; }while(t===old&&l.length>1); _quip={slot,text:t}; }
    return _quip.text;
  }
  function newQuip(){ if(_quip) _quip.slot=null; }

  function cardStats(){
    let fc={}; try{ fc=JSON.parse(localStorage.getItem('bvi_fc')||'{}'); }catch(e){}
    const now=Date.now();
    const ids=new Set(FLASHCARD_DATA.map(c=>c.id)); if(!fc||typeof fc!=='object') fc={};
    const ks=Object.keys(fc).filter(k=>ids.has(k));
    return { known:ks.length, due:ks.filter(k=>fc[k]&&fc[k].nextReview<=now).length, total:FLASHCARD_DATA.length };
  }
  // Balken-Diagramm: beginnt bei 0, kein Strich bis zur Oberkante; Beschriftung nur an Balken mit Wert
  function plot(vals,labels,cur,top,secs,goal){
    return `<div class="m-plot${vals.length>8?' many':''}" role="group" aria-label="Lernzeit je ${vals.length>8?'Monat':'Tag'}, antippen für die Zeit">${vals.map((v,i)=>{
      const h=v>0?Math.max(4,v/top*100):0, pos=i===0?' first':i===vals.length-1?' last':'';
      const cls=i===cur?' cur':v>0?' dim':' zero';
      let bar;
      if(goal){   // Tagesziel als Rahmen: Balken wächst im Rahmen, darüber hinaus ragt er heraus; ✓ bei erreichtem Ziel
        const g=goal/top*100, ok=v>=goal;
        bar=`<span class="m-pg${ok?' ok':''}" style="height:${g}%"><i class="m-pb${cls}" style="height:${v>0?Math.max(3,v/goal*100):0}%">${ok?'<u class="m-pk" aria-hidden="true">✓</u>':''}</i></span>`;
      } else bar=`<i class="m-pb${cls}" style="height:${h}%"></i>`;
      return `<button type="button" class="m-pc" onclick="SHELL.pick(this)" aria-label="${labels[i]}: ${dur(secs[i])}"><span class="m-tip${pos}" style="bottom:calc(${h}% + 22px)">${dur(secs[i])}</span>${bar}<span class="m-pl${i===cur?' cur':''}">${labels[i]}</span></button>`;}).join('')}</div>`;
  }
  function weekPlot(){
    const w=USAGE.week(), today=(new Date().getDay()+6)%7;
    const hours=Math.max(...w)>=7200, gm=goalMin(), g=hours?gm/60:gm;
    const v=w.map(x=>hours?x/3600:x/60), top=Math.max(g,hours?Math.max(2,Math.ceil(Math.max(...v))):Math.max(30,Math.ceil(Math.max(...v)/10)*10));
    const avg=w.slice(0,today+1).reduce((s,x)=>s+x,0)/(today+1);   // Durchschnitt je Tag bis heute
    return {html:plot(v,['Mo','Di','Mi','Do','Fr','Sa','So'],today,top,w,g),unit:hours?'Stunden pro Tag':'Minuten pro Tag',sum:w.reduce((a,b)=>a+b,0),avg,note:'Rahmen = Tagesziel '+gm+' min'};
  }
  function monthPlot(){
    const ms=USAGE.months(12), names=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    const hours=Math.max(...ms.map(m=>m.sec))>=7200;
    const v=ms.map(m=>hours?m.sec/3600:m.sec/60), top=hours?Math.max(2,Math.ceil(Math.max(...v)/2)*2):Math.max(30,Math.ceil(Math.max(...v)/10)*10);
    const cm=ms[ms.length-1], avg=cm.sec/new Date().getDate();   // Durchschnitt je Tag im laufenden Monat
    return {html:plot(v,ms.map(m=>names[m.m]),ms.length-1,top,ms.map(m=>m.sec)),unit:hours?'Stunden pro Monat':'Minuten pro Monat',sum:ms.reduce((a,m)=>a+m.sec,0),avg,note:'laufender Monat'};
  }
  function homeRing(p,label,aria){
    const r=44,c=2*Math.PI*r;
    return `<svg class="m-hring" viewBox="0 0 100 100" role="img" aria-label="${esc(aria)}"><circle cx="50" cy="50" r="${r}" class="bg"/>${p>0?`<circle cx="50" cy="50" r="${r}" class="fg" stroke-dasharray="${c*p/100} ${c}" transform="rotate(-90 50 50)"/>`:''}<text x="50" y="58" text-anchor="middle" font-size="${label.length>3?22:26}">${esc(label)}</text></svg>`;
  }
  let chartRange='week', y1Open=false;
  if(window.matchMedia) matchMedia('(min-width:701px)').addEventListener('change',()=>{ if(document.getElementById('v-home')?.classList.contains('active')) renderHome(); });

  function dur(sec){
    const m=Math.floor(sec/60);
    return m<60?`${m} min`:`${Math.floor(m/60)} h ${String(m%60).padStart(2,'0')}`;
  }

  // Voreinstellung: der nächste anstehende Termin (nach dem 14.12. folgt die Klausur nach § 21 am 21.12.)
  const DEF_EXAMS=[{date:'2026-12-14',name:'Leistungsnachweis nach § 13 Abs. 3'},{date:'2026-12-21',name:'Klausur nach § 21'}];
  const DEF_EXAM=DEF_EXAMS[0];
  function defExam(){
    const t=new Date(); t.setHours(0,0,0,0);
    let list=DEF_EXAMS;   // andere Jahrgänge: kein vorgegebener Termin (jeder kann seinen eigenen unter Einstellungen eintragen)
    if(!JG.isMaster()) list=[{date:'2000-01-01',name:'Klausur'}];
    return list.find(e=>new Date(e.date+'T00:00')>=t)||list[list.length-1];
  }
  // Ziele für den Countdown: dieselben Prüfungen wie im Prüfung-Tab (Master ohne die ausgeblendeten, dazu die eigenen des Jahrgangs)
  function examList(){
    const jd=JG.data(), weg=new Set(jd.pr.weg);
    return EXAMS.map(([name,items],si)=>{
      const key=JG.TABS[si][0];
      return [name,[...items.filter(x=>!weg.has(x[0])).map(x=>[x[0],x[1]]),...jd.pr.hinzu.filter(p=>p.tab===key&&!p.seite).map(p=>[p.id,p.titel,'own'])]];
    }).filter(g=>g[1].length);
  }
  const examFind=id=>examList().flatMap(g=>g[1]).find(x=>x[0]===id);
  function examCfg(){
    const d=defExam();
    try{
      const o=JSON.parse(localStorage.getItem('bvi_exam')||'{}');
      return {date:/^\d{4}-\d{2}-\d{2}$/.test(o.date||'')?o.date:d.date, name:((o.name||'').trim().slice(0,60))||d.name, target:examFind(o.target)?o.target:'', off:!!o.off};
    }catch(e){ return {...d,target:'',off:false}; }
  }
  function goalMin(){
    try{ const v=parseInt(localStorage.getItem('bvi_goal'),10); return v>=5&&v<=240?v:30; }catch(e){ return 30; }
  }
  // Ziel der Countdown-Karte: Klausur nach § 21 → Laufbahnklausuren, sonst Altklausur-Quiz IdF
  function examTarget(){
    const t=examCfg().target;
    if(t){ const it=examFind(t); if(it) return it; }   // it = [id, Titel, 'own' bei eigener Prüfung]
    return /§\s*21/.test(examCfg().name)?['v-laufbahn-2026','Laufbahnklausuren Juni 2026']:['v-idf-altklausur','Altklausur-Quiz IdF']; }
  function daysToExam(){
    const t=new Date(); t.setHours(0,0,0,0);
    if(examCfg().off) return -1;   // Termin entfernt: kein Countdown
    return Math.round((new Date(examCfg().date+'T00:00')-t)/864e5);
  }
  const hhmm=d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  function dayWord(d){
    const t=new Date(); t.setHours(0,0,0,0);
    const x=new Date(d); x.setHours(0,0,0,0);
    const diff=Math.round((x-t)/864e5);
    return diff===0?'heute':diff===1?'morgen':d.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'});
  }
  // Lernzeit-Diagramm als eigene Karte: beim Wechsel Woche/Monate wird nur sie ersetzt, die Startseite animiert nicht neu
  function chartHtml(){
    const pl=chartRange==='month'?monthPlot():weekPlot(), isM=chartRange==='month';
    return `<div class="m-card m-chart2"><div class="m-chart-h"><span class="m-seg m-seg-s" role="group" aria-label="Zeitraum"><button class="${isM?'':'active'}" onclick="SHELL.setRange('week')">Woche</button><button class="${isM?'active':''}" onclick="SHELL.setRange('month')">Monate</button></span><span class="m-st"><b>${dur(pl.sum)}</b> / ${isM?'12 Monate':'Woche'}</span></div>
      ${pl.html}<div class="m-glg"><span>${pl.note}</span><span class="m-gavg">Ø ${dur(pl.avg)} / Tag</span></div></div>`;
  }
  function renderHome(){
    const el=document.getElementById('m-home');
    if(!el) return;
    const now=new Date(), h=now.getHours();
    const slot=daySlot(h), hi=GREET[slot];
    const cnt=PROGRESS.counts();
    const cs=cardStats(), recent=RECENT.list()[0], nx=IDF_PLAN.next(), exam=daysToExam(), week=USAGE.week(), ex=examCfg();
    const pct=c=>c.total?Math.round(c.done/c.total*100):0;
    const modRow=m=>{
      const c=cnt[m[0]]||{done:0,total:0};
      return `<button class="m-row m-go" onclick="${goJs(m[3],m[4])}"><span class="m-ic">${m[1]}</span><span class="m-tx"><span class="m-t1">${m[1]}</span><span class="m-t2">${esc(m[2])}</span><span class="m-bar"><i style="width:${pct(c)}%"></i></span></span><span class="m-val">${c.done}/${c.total}</span></button>`;
    };
    const modCard=m=>{
      const c=cnt[m[0]]||{done:0,total:0};
      return `<button class="m-modcard" onclick="${goJs(m[3],m[4])}"><span class="m-mc-top"><span class="m-ic">${m[1]}</span><span class="m-val">${c.done}/${c.total}</span></span><b>${m[1]}</b><span class="m-t2">${esc(m[2])}</span><span class="m-bar"><i style="width:${pct(c)}%"></i></span></button>`;
    };
    const year=y=>{
      const ms=MODS.filter(m=>m[5]===y);
      return `<div class="m-sec">${y}. Ausbildungsjahr</div><div class="m-list m-only-s">${ms.map(modRow).join('')}</div><div class="m-modgrid">${ms.map(modCard).join('')}</div>`;
    };
    const sec=USAGE.today(), goal=goalMin(), gp=Math.min(100,Math.round(sec/(goal*60)*100));
    const minToday=Math.floor(sec/60);
    let cTitle="Los geht's", cSub='Wähle ein Modul oder übe mit dem Altklausur-Quiz', cGo="NAV.tab('v-pruefung','Prüfung')", cBtn='Starten';
    if(recent&&document.getElementById(recent.id)){
      cTitle=recent.label; cGo=goJs(recent.id,recent.label); cBtn='Weiter';
      cSub=document.querySelector('#'+recent.id+' .page-eyebrow')?.textContent?.trim()||'';
    }
    // Oben rechts: Lupe wie in Top-Apps (Tipp: Suchfeld wächst aus dem Symbol, Tastatur öffnet sich); die nächste Einheit steht im Stundenplan
    const nextBox=`<button type="button" class="m-hsearch" aria-label="Suchen" title="Suchen" onclick="SEARCH.open(this)"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m20 20-3.5-3.5"/></svg></button>`;
    const chartCard=chartHtml();
    // Standort-Liste: Umschalter 2./1. Jahr (Handy), je Standort eine Zeile mit Ring, Ort, Fortschrittsbalken und Prozent
    const MODSUB={ibk:'Heyrothsberge · Führung',vak:'Berlin · Verwaltungsrecht',feuak:'Hamburg · Haushalt',idf:'Münster · VB & Stabsarbeit',gal:'Grundlehrgang',sfs:'Regensburg',hlfs:'Kassel'};
    const stRing=(p,aria)=>{ const r=44,c=2*Math.PI*r; return `<svg class="m-hring" viewBox="0 0 100 100" role="img" aria-label="${esc(aria)}: ${p} %"><circle cx="50" cy="50" r="${r}" class="bg"/>${p>0?`<circle cx="50" cy="50" r="${r}" class="fg" stroke-dasharray="${c*p/100} ${c}" transform="rotate(-90 50 50)"/>`:''}<text x="50" y="57" text-anchor="middle" font-size="25">${p}%</text></svg>`; };
    const stRow=m=>{
      const c=cnt[m[0]]||{done:0,total:0}, p=pct(c);
      return `<button class="m-modrow" onclick="${goJs(m[3],m[4])}" aria-label="${esc(m[1])}: ${c.done} von ${c.total} Themen"><span class="m-mring">${stRing(p,m[1])}</span><span class="m-tx"><span class="m-t1">${esc(m[1])}</span><span class="m-t2">${esc(MODSUB[m[0]]||m[2])}</span><span class="m-mbar"><i style="width:${p}%"></i></span></span><span class="m-chv" aria-hidden="true">›</span></button>`;
    };
    let hy='2'; try{ hy=localStorage.getItem('bvi_home_year')==='1'?'1':'2'; }catch(e){}
    const gm=(typeof GAME!=='undefined')?GAME.homeHtml():{chip:'',panel:'',rank:''};
    const mods=`<div class="m-card m-mods" data-y="${hy}"><div class="m-seg2"><span class="m-seg2-w">${gm.rank||''}${gm.chip}</span><span class="m-mini" role="tablist" aria-label="Ausbildungsjahr"><i class="m-mini-ind" aria-hidden="true"></i><button type="button" role="tab" class="${hy==='2'?'on':''}" aria-selected="${hy==='2'}" onclick="SHELL.setYear('2')">2. Jahr</button><button type="button" role="tab" class="${hy==='1'?'on':''}" aria-selected="${hy==='1'}" onclick="SHELL.setYear('1')">1. Jahr</button></span></div>
      ${gm.panel}
      <div class="m-modgrid2"><div class="m-yl" data-yr="2"><div class="m-sec">2. Ausbildungsjahr</div><div class="m-modlist">${MODS.filter(m=>m[5]===2).map(stRow).join('')}</div></div>
      <div class="m-yl" data-yr="1"><div class="m-sec">1. Ausbildungsjahr</div><div class="m-modlist">${MODS.filter(m=>m[5]===1).map(stRow).join('')}</div></div></div></div>`;
    const pause='';
    const lk=JG.isMaster()?{url:'https://cloud.hd-fw.de/index.php/s/xoHDwfCM9DtLo9t/authenticate/showshare',titel:'Lehrgangs-Cloud',hinweis:'Unterlagen aus dem Lehrgang · Passwort steht in der WhatsApp-Gruppe'}:JG.data().links.cloud;
    const cloud=lk?`<div class="m-list m-cloud"><a class="m-row m-go" href="${esc(lk.url)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">${ic('cloud')}<span class="m-tx"><span class="m-t1">${esc(lk.titel||'Lehrgangs-Link')}</span>${lk.hinweis?`<span class="m-t2 m-cloud-x">${esc(lk.hinweis)}</span>`:''}</span></a></div>`:'';
    const donate=`<a class="m-list m-donate m-donate-home" href="${SPENDE_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration:none"><div class="m-row m-go">${ic('heart')}<span class="m-tx"><span class="m-t1">Gefällt dir die Seite?</span><span class="m-t2">Kostenlos &amp; werbefrei – freiwillig unterstützen</span></span></div></a>`;
    el.innerHTML=`
      <div class="m-hello"><div><h1>${hi}</h1><p class="m-quip">${esc(quip(slot))}</p><div class="m-date">${now.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})}</div></div>${nextBox}</div>
      ${(typeof TOUR!=='undefined'&&!TOUR.done())?`<div class="m-tourhome" id="tour-home"><button type="button" class="m-tourhome-go" onclick="TOUR.start('home')"><span class="m-tourhome-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"/></svg></span><span class="m-tx"><span class="m-t1">Neu hier? App kennenlernen</span><span class="m-t2">Kurze Tour mit Spotlight – zeigt dir alles Wichtige</span></span><span class="m-tourhome-btn">Tour starten</span></button><button type="button" class="m-tourhome-x" aria-label="Hinweis ausblenden" onclick="TOUR.dismiss()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>`:''}
      <div class="m-hgrid"><div class="m-hl">${chartCard}</div><div class="m-hr2">${mods}${pause}${cloud}${donate}</div></div>`;
  }

  function renderExam(){
    const cd=document.getElementById('m-countdown'), list=document.getElementById('m-exam-list');
    if(!cd||!list) return;
    const days=daysToExam();
    const tgt=examTarget();
    cd.innerHTML=days<0?'':`<button type="button" class="m-card m-count m-count-go" onclick="${tgt[2]==='own'&&/^[\w-]+$/.test(tgt[0])?`JGUI.openExam('${tgt[0]}')`:goJs(tgt[0],tgt[1])}"><div class="m-count-big">${days===0?'Heute':days}</div><div class="m-tx"><span class="m-t2" style="margin:0">${days===0?'ist die':days===1?'Tag bis zur nächsten Klausur':'Tage bis zur nächsten Klausur'}</span><span class="m-t1">${esc(examCfg().name)}</span><span class="m-t2">${new Date(examCfg().date+'T00:00').toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'long',year:'numeric'})}</span></div><span class="m-count-link">${esc(tgt[1])} <i>›</i></span></button>`;
    const dueQ=(typeof QUIZ!=='undefined'&&QUIZ.dueCount)?QUIZ.dueCount():0;
    const dueI=(typeof IDFQ!=='undefined'&&IDFQ.dueCount)?IDFQ.dueCount():0;
    const jd=JG.data(), weg=new Set(jd.pr.weg), edit=typeof JGUI!=='undefined'&&JGUI.isEditing()&&!JG.isMaster();
    const rel=id=>JG.rel(id), star=id=>`<span class="jg-st${rel(id)?' on':''}" aria-hidden="true">★</span>`;
    // Im Bearbeiten-Modus schaltet das Antippen einer Prüfung ihre Klausurrelevanz um; sonst öffnet es sie
    const card=([id,t1,t2,k])=>row({ic:ic(k),t1,t2:id==='v-vak-altklausur'&&dueQ?`${t2} · ${dueQ} zur Wiederholung fällig`:id==='v-idf-altklausur'&&dueI?`${t2} · ${dueI} zur Wiederholung fällig`:t2,on:edit?`JGUI.setRel('${id}')`:(id==='v-lb-start'&&typeof LB!=='undefined'?'LB.ask(this)':goJs(id,t1)),right:edit?star(id):(id==='v-lb-start'&&typeof LB!=='undefined'&&!LB.ok()?'<svg class="lb-row-lock" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="gesperrt"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>':'')});
    const own=p=>row({ic:ic('doc'),t1:esc(p.titel),t2:p.fragen.length+' Fragen · eigene Prüfung',on:edit?`JGUI.setRel('${p.id}')`:`JGUI.openExam('${p.id}')`,right:edit?star(p.id):''});
    const del=id=>edit?`<button type="button" class="jg-x" aria-label="Prüfung entfernen" onclick="JGUI.delExam('${id}')">✕</button>`:'';
    const master=JG.isMaster();
    // kleiner Stern statt Farbverlauf: gefüllt = wichtig für Einsatzfahrt und Lernkarten; in anderen Lehrgängen direkt antippbar
    const starB=id=>{ if(edit) return ''; const on=!!rel(id); return master?(on?'<span class="jg-starbtn on" role="img" aria-label="Klausurrelevant">★</span>':''):`<button type="button" class="jg-starbtn${on?' on':''}" aria-pressed="${on}" aria-label="${on?'Als wichtig markiert – antippen zum Entfernen':'Als wichtig markieren'}" onclick="JGUI.starExam('${id}')">★</button>`; };
    const rw=(id,inner)=>`<div class="jg-rw${rel(id)?' hot':''}${id==='v-lb-start'?' lbg':''}">${inner}${starB(id)}${del(id)}</div>`;
    // je Modul: sichtbare Einträge (eigene hinzugefügte Prüfungen inbegriffen) mit fertigen Zeilen
    const mods=EXAMS.map(([name,items],si)=>{
      const key=JG.TABS[si][0], short=JG.TABS[si][2];
      const vis=items.filter(x=>!weg.has(x[0])&&!(x[0]==='v-lb-start'&&!JG.isMaster())), adds=jd.pr.hinzu.filter(p=>p.tab===key&&!p.seite);
      const ent=[...vis.map(x=>({id:x[0],row:rw(x[0],card(x)),imp:()=>card([x[0],x[1],short+' · '+x[2],x[3]])})),...adds.map(p=>({id:p.id,row:rw(p.id,own(p)),imp:null,own:p}))];
      return {key,name,short,ent};
    });
    const sec=m=>`<div class="m-col"><div class="m-sec jg-sh">${esc(m.name)}</div><div class="m-list">${m.ent.map(e=>e.row).join('')||'<div class="jg-none">Keine Prüfungen</div>'}</div></div>`;
    const hidden=EXAMS.reduce((n,[,it])=>n+it.filter(x=>weg.has(x[0])).length,0);
    // Bearbeiten-Knopf oben auf der Seite; „Prüfung hinzufügen“ erst im Bearbeiten-Modus
    const tools=typeof JGUI==='undefined'||JG.isMaster()?'':`<button type="button" class="btn btn-ghost" onclick="JGUI.toggleEdit()">${edit?'Fertig':'Prüfungen bearbeiten'}</button>${JGUI.histHtml()}${edit?`<button type="button" class="jg-plus" onclick="JGUI.examEditor()"><span>+</span> Prüfung hinzufügen</button>`:''}${edit&&hidden?`<button type="button" class="btn btn-ghost" onclick="JGUI.restoreExams()">${hidden} ausgeblendete wiederherstellen</button>`:''}`;
    let eb=document.getElementById('jg-exam-bar');
    if(!eb){ eb=document.createElement('div'); eb.id='jg-exam-bar'; cd.parentNode.insertBefore(eb,cd); }
    eb.className=tools?'jg-bar':''; eb.innerHTML=tools;
    const hint=edit&&tools?'<div class="m-note" style="padding:6px 2px">Tippe eine Prüfung an, um sie klausurrelevant (★) zu machen oder abzuwählen. Nur relevante Prüfungen liefern Fragen für Einsatzfahrt und Duell.</div>':'';
    const legend=edit?'':`<div class="m-note jg-legend"><span class="jg-st on" aria-hidden="true">★</span> wichtig für Einsatzfahrt und Lernkarten${master?'':' · zum Ändern den Stern antippen'}</div>`;
    // Handy: Umschalter „Wichtig | Module“. Wichtig = markierte Prüfungen (Laufbahnprüfung zuerst), Module = aufklappbar.
    // Tablet und PC zeigen weiter alle Module nebeneinander (per CSS).
    const impList=[];
    mods.forEach(m=>m.ent.forEach(e=>{ if(e.id==='v-lb-start'||rel(e.id)) impList.push({m,e}); }));
    impList.sort((x,y)=>(y.e.id==='v-lb-start')-(x.e.id==='v-lb-start'));
    const impRows=impList.map(({m,e})=>e.own?rw(e.id,row({ic:ic('doc'),t1:esc(e.own.titel),t2:m.short+' · '+e.own.fragen.length+' Fragen · eigene Prüfung',on:`JGUI.openExam('${e.own.id}')`,right:''})):rw(e.id,e.imp()));
    const nMods=mods.filter(m=>m.ent.length).length;
    let view='imp', openSet=null; try{ view=localStorage.getItem('bvi_exam_view')==='mod'?'mod':'imp'; openSet=JSON.parse(localStorage.getItem('bvi_exam_open')||'null'); }catch(e){}
    if(edit) view='mod';
    if(!Array.isArray(openSet)){ const tid=tgt&&tgt[0], hit=mods.find(m=>m.ent.some(e=>e.id===tid))||mods.find(m=>m.ent.length); openSet=hit?[hit.key]:[]; }
    const acc=m=>{ const o=openSet.includes(m.key)||edit; const n=m.ent.length;
      return `<div class="ex-acc${o?' open':''}" data-k="${m.key}"><button type="button" class="ex-ah" aria-expanded="${o}" onclick="SHELL.examAcc('${m.key}')"><span class="ex-an">${esc(m.name)}</span><span class="ex-ac">${n}</span><svg class="m-acc-chv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="ex-ab"><div class="m-list">${m.ent.map(e=>e.row).join('')||'<div class="jg-none">Keine Prüfungen</div>'}</div></div></div>`; };
    const seg=edit?'':`<div class="ex-seg" role="tablist" aria-label="Ansicht"><button type="button" role="tab" class="${view==='imp'?'on':''}" aria-selected="${view==='imp'}" onclick="SHELL.examView('imp')">Wichtig <b>${impList.length}</b></button><button type="button" role="tab" class="${view==='mod'?'on':''}" aria-selected="${view==='mod'}" onclick="SHELL.examView('mod')">Module <b>${nMods}</b></button><i class="ex-pill" aria-hidden="true"></i></div>`;
    const impPane=`<div class="ex-pane ex-imp"><div class="ex-ph"><span>Wichtig</span><span class="ex-star"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9-4.3-4.1 5.9-.8z"/></svg>${impList.length}</span></div><div class="m-list">${impRows.join('')||'<div class="jg-none">Noch nichts als wichtig markiert. Im Reiter „Module“ lässt sich der Stern bei einer Prüfung antippen.</div>'}</div></div>`;
    list.innerHTML=`${hint}<div class="ex-wrap${edit?' ex-edit':''}" data-v="${view}">${seg}${impPane}<div class="ex-pane ex-mod"><div class="ex-ph"><span>Module</span></div>${mods.map(acc).join('')}</div></div>${legend}`;
  }
  function examView(v){
    try{ localStorage.setItem('bvi_exam_view',v==='mod'?'mod':'imp'); }catch(e){}
    const w=document.querySelector('#m-exam-list .ex-wrap'); if(!w) return;
    w.dataset.v=v==='mod'?'mod':'imp';
    w.querySelectorAll('.ex-seg button').forEach(b=>{ const on=(b.textContent.startsWith('Wichtig'))===(v!=='mod'); b.classList.toggle('on',on); b.setAttribute('aria-selected',on); });
  }
  function examAcc(key){
    const el=document.querySelector(`#m-exam-list .ex-acc[data-k="${key}"]`); if(!el) return;
    const o=!el.classList.contains('open'); el.classList.toggle('open',o); el.querySelector('.ex-ah').setAttribute('aria-expanded',o);
    const set=[...document.querySelectorAll('#m-exam-list .ex-acc.open')].map(x=>x.dataset.k);
    try{ localStorage.setItem('bvi_exam_open',JSON.stringify(set)); }catch(e){}
  }

  function renderFcSide(){
    const el=document.getElementById('m-fc-side'); if(!el) return;
    let fc={}; try{ fc=JSON.parse(localStorage.getItem('bvi_fc')||'{}'); }catch(e){}
    const cats=[['laufbahn','Laufbahn'],['ibk','IBK'],['vak','VAk'],['feuak','FeuAK'],['idf','IdF']];
    const rows=cats.map(([k,l])=>{
      const cs=FLASHCARD_DATA.filter(c=>c.cat.toLowerCase().startsWith(k));
      const p=cs.length?Math.round(cs.filter(c=>fc[c.id]).length/cs.length*100):0;
      return `<div class="m-fc-row"><span>${l}</span><span class="m-bar"><i style="width:${p}%"></i></span><span class="m-val">${p} %</span></div>`;
    }).join('');
    const known=FLASHCARD_DATA.filter(c=>fc[c.id]).length;
    el.innerHTML=`<div class="m-card"><div class="m-t1">Dein Stand</div>${rows}<div class="m-t2" style="margin-top:12px">${known} von ${FLASHCARD_DATA.length} Karten gewusst</div></div>
      <div class="m-card m-kbd"><div class="m-t1">Tastatur</div><div class="m-t2" style="line-height:2.1"><span class="kb-r"><kbd>↑</kbd> aufdecken</span><span class="kb-r"><kbd>Leertaste</kbd> markieren</span><span class="kb-r"><kbd>→</kbd> gewusst</span><span class="kb-r"><kbd>↓</kbd> schwer</span><span class="kb-r"><kbd>←</kbd> nicht gewusst</span></div></div>`;
  }

  let _tocIO=null;
  function buildToc(id,isContent){
    const toc=document.getElementById('m-toc'); if(!toc) return;
    if(_tocIO){ _tocIO.disconnect(); _tocIO=null; }
    const v=document.getElementById(id);
    let heads=isContent&&v?[...v.querySelectorAll('.pc .sec-h')]:[];
    if(heads.length<2&&isContent&&v) heads=[...v.querySelectorAll('.pc .acc-item > summary')];
    heads=heads.slice(0,24);
    const on=heads.length>=2;
    toc.classList.toggle('hidden',!on);
    document.body.classList.toggle('has-toc',on);
    if(!on){ toc.innerHTML=''; return; }
    const label=h=>((h.querySelector('.acc-title,.acc-h')||h).textContent||'').replace(/\s+/g,' ').trim().slice(0,70);
    toc.innerHTML='<div class="m-toc-h">Auf dieser Seite</div>'+heads.map((h,i)=>`<button data-i="${i}">${esc(label(h))}</button>`).join('');
    toc.onclick=e=>{ const b=e.target.closest('button[data-i]'); if(b) heads[+b.dataset.i].scrollIntoView({behavior:'smooth',block:'start'}); };
    const btns=[...toc.querySelectorAll('button')];
    _tocIO=new IntersectionObserver(es=>{
      es.forEach(en=>{ if(en.isIntersecting){ const i=heads.indexOf(en.target); btns.forEach((b,k)=>b.classList.toggle('on',k===i)); } });
    },{rootMargin:'-15% 0px -75% 0px'});
    heads.forEach(h=>_tocIO.observe(h));
  }

  function notes(){
    const out=[];
    try{
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(!k||!k.startsWith('bvi_note_')) continue;
        const txt=(localStorage.getItem(k)||'').trim();
        if(txt) out.push({id:k.slice(9),txt});
      }
    }catch(e){}
    return out;
  }
  function renderNotes(){
    const el=document.getElementById('m-notes-list'); if(!el) return;
    const n=notes(), marks=HL.all();
    let h='';
    if(n.length){
      h+='<div class="m-list">'+n.map(({id,txt})=>{
        const v=document.getElementById(id);
        const label=v?.querySelector('.page-title')?.textContent?.trim()||(id==='home'?'Startseite':id);
        const eb=v?.querySelector('.page-eyebrow')?.textContent?.trim()||'';
        return `<button class="m-row m-go" onclick="${v?goJs(id,label):''}" style="align-items:flex-start"><span class="m-tx"><span class="m-t2" style="margin:0;color:var(--m-accent-fg)">${esc(eb?eb+' · '+label:label)}</span><span class="m-note-txt">${esc(txt)}</span></span></button>`;
      }).join('')+'</div>';
    }
    if(marks.length){
      h+='<div class="m-sec" style="margin-top:1.4rem">Markierungen</div>'+marks.map(({view,items})=>{
        const v=document.getElementById(view);
        const label=v?.querySelector('.page-title')?.textContent?.trim()||view;
        return `<div class="m-hl-group"><div class="m-t2" style="color:var(--m-accent-fg);margin:0 0 6px 4px">${esc(label)}</div><div class="m-list">${items.map((it,i)=>`<div class="m-row bm-row"><button class="bm-open" onclick="${goJs(view,label)}"><span class="m-note-txt">${esc(it.q)}</span></button><button class="bm-remove" aria-label="Markierung löschen" onclick="HL.removeAt(${esc(JSON.stringify(view))},${i});SHELL.renderNotes()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>`).join('')}</div></div>`;
      }).join('');
    }
    if(!h) h='<div class="m-empty">Noch keine Notizen oder Markierungen.<br>Öffne eine Lernseite: Mit dem Stift schreibst du eine Notiz, und wenn du Text auswählst, kannst du ihn markieren.</div>';
    el.innerHTML=h;
  }

  function syncSettings(){
    ACCENT.render();
    SETTINGS._restoreFsUI();
    const nc=notes().length, bc=BOOKMARKS.getAll().length;
    const set=(id,txt)=>{ const e=document.getElementById(id); if(e) e.textContent=txt; };
    set('m-notes-count',nc||'');
    set('m-bm-count',bc||'');
    set('m-version',APP_VERSION);
    set('m-notif-hour',NOTIF.hour()+':00');
    set('m-goal-val',goalMin()+' min');
    const gt=document.getElementById('m-game-toggle'); if(gt&&typeof GAME!=='undefined') gt.checked=GAME.isOn();
    const gs=document.getElementById('m-game-small'); if(gs&&typeof GAME!=='undefined') gs.checked=GAME.isSmall();
    const tm=document.getElementById('m-timers-toggle'); if(tm) tm.checked=!document.documentElement.classList.contains('no-timers');
    const lb=BACKUP.last(); set('m-backup-last',lb?'Letzte Sicherung: '+lb.toLocaleDateString('de-DE'):'Noch nie gesichert');
    const ex=examCfg(), di=document.getElementById('m-exam-date'), ni=document.getElementById('m-exam-name'), ti=document.getElementById('m-exam-target'), xb=document.getElementById('m-exam-clear');
    if(di) di.value=ex.off?'':ex.date; if(ni) ni.value=ex.off?'':(ex.name===defExam().name&&!localStorage.getItem('bvi_exam')?'':ex.name);
    if(ti){
      ti.innerHTML='<option value="">Automatisch</option>'+examList().map(([n,it])=>'<optgroup label="'+esc(n)+'">'+it.map(x=>'<option value="'+esc(x[0])+'">'+esc(x[1])+(x[2]?' (eigene)':'')+'</option>').join('')+'</optgroup>').join('');   // bei jedem Öffnen neu: folgt dem Prüfung-Tab
      ti.value=ex.off?'':ex.target;
    }
    if(xb) xb.hidden=ex.off;
    BG.sync();
    const tg=document.getElementById('m-notif-toggle'); if(tg) tg.checked=NOTIF.isEnabled();
    document.getElementById('m-cl-badge')?.classList.toggle('hidden',!CHANGELOG.isNew());
    document.getElementById('m-cl-badge2')?.classList.toggle('hidden',!CHANGELOG.isNew());
    accSubs();
  }

  // Kurzinfo unter jeder Einstellungs-Gruppe (zeigt die aktuellen Werte, auch wenn die Gruppe zu ist)
  function accSubs(){
    const set=(id,txt)=>{ const e=document.getElementById(id); if(e) e.textContent=txt; };
    const th={dark:'Dunkel',light:'Hell',beige:'Beige',system:'System'}[localStorage.getItem('bvi_theme')]||'System';
    const fs=Math.round((14+2*SETTINGS.fsPos())/16*100)+' %';
    const nc=notes().length, bc=BOOKMARKS.getAll().length;
    const lb=BACKUP.last();
    set('acc-dar-sub',th+' · Schrift '+fs);
    if(typeof JG!=='undefined') set('acc-lg-sub',JG.labelOf(JG.current())+(JG.isMaster()?' (Master)':''));
    set('acc-ler-sub','Tagesziel '+goalMin()+' min · Timer '+(document.documentElement.classList.contains('no-timers')?'aus':'an')+' · Erinnerung '+(NOTIF.isEnabled()?NOTIF.hour()+':00':'aus'));
    set('acc-dat-sub',(lb?'Gesichert '+lb.toLocaleDateString('de-DE'):'Noch nie gesichert')+' · '+nc+(nc===1?' Notiz':' Notizen')+' · '+bc+' Lesezeichen');
  }
  document.addEventListener('click',e=>{ if(e.target.closest('#v-settings')) setTimeout(accSubs,0); });
  document.addEventListener('change',e=>{ if(e.target.closest('#v-settings')) setTimeout(accSubs,0); });

  // alte Einstellungen und Zähler der entfernten Funktionen „Karten pro Tag“ und „Zahl bei den Lernkarten“ löschen
  ['bvi_cardgoal','bvi_tabnum','bvi_cards_day'].forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
  function onShow(id,isContent,stack){
    const tab=stack.length&&ROOTS[stack[0].id]?ROOTS[stack[0].id]:'start';
    window.__navTab=tab;
    PMENU.close();
    document.querySelectorAll('#m-tabbar [data-tabs],#m-rail [data-tab]').forEach(b=>{
      const on=(b.dataset.tabs||b.dataset.tab||'').split(' ').includes(tab);
      b.classList.toggle('on',on);
      if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
    });
    const isRoot=!stack.length||(stack.length===1&&!!ROOTS[id]);
    document.getElementById('m-topbar')?.classList.toggle('hidden',isRoot);
    if(!isRoot){
      const lbl=document.getElementById('m-back-lbl');
      if(lbl) lbl.textContent=stack.length>=2?stack[stack.length-2].label:'Start';
    }
    document.getElementById('m-tb-actions')?.classList.toggle('hidden',!isContent);
    buildToc(id,isContent);
    HL.apply(id);
    if(isContent){
      const pc=document.getElementById(id)?.querySelector('.pc');
      if(pc&&!pc.querySelector(':scope > .m-report')){
        const d=document.createElement('div'); d.className='m-report';
        d.innerHTML='<button onclick="SHELL.report()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg>Fehler oder Unklarheit melden</button>';
        pc.appendChild(d);
      }
    }
  }

  return {
    onShow, renderHome, newQuip, renderExam, examView, examAcc, renderNotes, renderFcSide, syncSettings, goalMin, daysToExam, mods:()=>MODS,
    report(extra){
      const v=document.querySelector('.view.active'); if(!v) return;
      const title=v.querySelector('.page-title')?.textContent?.trim()||v.id;
      const eb=v.querySelector('.page-eyebrow')?.textContent?.trim()||'';
      const body='Seite: '+title+(eb?' ('+eb+')':'')+'\nLink: '+location.origin+location.pathname+'?id='+v.id+'\nApp-Version: '+APP_VERSION+'\n'+(extra?'\n'+extra+'\n':'')+'\nWas ist falsch oder unklar?\n';
      const mail='mailto:fabian.flemig@gmx.de?subject='+encodeURIComponent('B VI – Fehler: '+title)+'&body='+encodeURIComponent(body);
      const gh='https://github.com/Flametan/BVI-Lernwebsite/issues/new?labels=fehler&title='+encodeURIComponent('Fehler: '+title)+'&body='+encodeURIComponent(body);
      if(!window.__noMail) REPORT.open(mail,gh);
      return mail;
    },
    reportQuiz(sfx){
      const t=id=>document.getElementById(id+(sfx||''))?.textContent?.trim()||'';
      return this.report((sfx?'IdF-Quiz ':'')+'Frage '+t('quiz-counter')+' ['+t('quiz-cat')+']:\n'+t('quiz-q'));
    },
    acc(btn){
      const open=btn.getAttribute('aria-expanded')!=='true';
      document.querySelectorAll('#v-settings .m-acc-h').forEach(h=>{ h.setAttribute('aria-expanded','false'); document.getElementById(h.getAttribute('aria-controls')).hidden=true; });
      if(open){ btn.setAttribute('aria-expanded','true'); document.getElementById(btn.getAttribute('aria-controls')).hidden=false; }
    },
    stepGoal(d){
      const g=Math.min(240,Math.max(5,goalMin()+d*5));
      try{ localStorage.setItem('bvi_goal',String(g)); }catch(e){}
      const e=document.getElementById('m-goal-val'); if(e) e.textContent=g+' min';
    },
    setTimers(on){
      try{ localStorage.setItem('bvi_timers',on?'1':'0'); }catch(e){}
      document.documentElement.classList.toggle('no-timers',!on);
      if(!on&&typeof ETIMER!=='undefined') ETIMER.stop();
    },
    setRange(r){
      chartRange=r==='month'?'month':'week';
      const old=document.querySelector('#v-home .m-chart2');
      if(!old){ renderHome(); return; }
      const t=document.createElement('template'); t.innerHTML=chartHtml();
      old.replaceWith(t.content.firstElementChild);
      document.querySelector('#v-home .m-chart2 .m-seg-s button.active')?.focus({preventScroll:true});
    },
    setYear(y){ try{ localStorage.setItem('bvi_home_year',y); }catch(e){} const m=document.querySelector('#v-home .m-mods'); if(!m) return; m.dataset.y=y; m.querySelectorAll('.m-seg2 .m-mini button').forEach((b,i)=>{ const on=(i===0)===(y==='2'); b.classList.toggle('on',on); b.setAttribute('aria-selected',on); }); },
    y1(open){ if(!document.querySelector('.m-y1.static')) y1Open=!!open; },
    pick(btn){
      const on=!btn.classList.contains('sel');
      btn.parentElement.querySelectorAll('.sel').forEach(x=>x.classList.remove('sel'));
      if(on) btn.classList.add('sel');
    },
    setExam(){
      const date=document.getElementById('m-exam-date')?.value, name=document.getElementById('m-exam-name')?.value||'';
      const o=examCfg(); if(/^\d{4}-\d{2}-\d{2}$/.test(date||'')) o.date=date;
      const target=document.getElementById('m-exam-target')?.value||'';
      if(o.off&&!/^\d{4}-\d{2}-\d{2}$/.test(date||'')){ try{ localStorage.setItem('bvi_exam',JSON.stringify({off:1,target})); }catch(e){} return; }   // ohne neues Datum bleibt der Termin entfernt
      try{ localStorage.setItem('bvi_exam',JSON.stringify({date:o.date,name:name.trim(),target})); }catch(e){}
      syncSettings(); if(document.getElementById('v-pruefung')?.classList.contains('active')) renderExam();
    },
    clearExam(){
      let prev=null; try{ prev=localStorage.getItem('bvi_exam'); localStorage.setItem('bvi_exam',JSON.stringify({off:1})); }catch(e){}
      syncSettings(); renderExam(); renderHome();
      const put=v=>{ try{ v===null?localStorage.removeItem('bvi_exam'):localStorage.setItem('bvi_exam',v); }catch(e){} syncSettings(); renderExam(); renderHome(); };
      UNDO.push('Klausurtermin entfernen',()=>put(prev),()=>put(JSON.stringify({off:1})));
      TOAST.show('Klausurtermin entfernt',{type:'ok'});
    },
    bookmark(){
      const v=document.querySelector('.view.active'); if(!v) return;
      BOOKMARKS.toggle(v.id, v.querySelector('.page-title')?.textContent?.trim()||v.id);
    },
    async setNotif(el){ await NOTIF.setEnabled(el.checked); el.checked=NOTIF.isEnabled(); accSubs(); },
    stepHour(d){
      const h=Math.min(23,Math.max(6,NOTIF.hour()+d));
      NOTIF.setHour(h);
      const e=document.getElementById('m-notif-hour'); if(e) e.textContent=h+':00';
    }
  };
})();

// Zeit-Sprechblase am Balken nur nach Tipp; ein Tipp daneben oder Esc schließt sie
document.addEventListener('click',e=>{ if(!e.target.closest('.m-pc')) document.querySelectorAll('.m-pc.sel').forEach(x=>x.classList.remove('sel')); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.m-pc.sel').forEach(x=>x.classList.remove('sel')); });

document.addEventListener('DOMContentLoaded',()=>{
  // Deep-link on load
  // Geteilte Lernkarten: ?karten=… übernehmen (nach Rückfrage) und den Parameter aus der Adresse entfernen
  (function(){
    const u=new URL(location.href), kc=u.searchParams.get('karten');
    if(!kc) return;
    u.searchParams.delete('karten');
    try{ history.replaceState(history.state,'',u.pathname+(u.search||'')+u.hash); }catch(e){}
    setTimeout(()=>CUSTOM.fromCode('BVIK'+kc.replace(/^BVIK/,''),true),700);
  })();
  const initId=new URLSearchParams(location.search).get('id')||location.hash.replace(/^#/,'');
  if(initId&&document.getElementById(initId)?.classList.contains('view')){
    const lbl=document.querySelector('#'+initId+' .page-title')?.textContent?.trim()||initId;
    NAV.go(initId,lbl);
  } else {
    NAV.home();
  }
  PROGRESS.updateUI();
  SETTINGS.restoreFontSize();
  NOTIF.check();
  ONBOARD.init();
  OVL.init();
  CHANGELOG.check();
  if(window.SK) requestAnimationFrame(()=>window.SK());
  if(typeof FALLBEARBEITUNG!=='undefined') { document.querySelectorAll('#v-vak-fallbearbeitung').forEach(()=>{}); }
  VIEWS.light(document);
  document.addEventListener('keydown', e => {
    if((e.ctrlKey||e.metaKey) && e.key==='k'){ e.preventDefault(); const t=OVL.top(); if(!t||t==='search-overlay') SEARCH.open(); return; }
    if(e.key==='?'&&!e.target.matches('input,textarea')){
      e.preventDefault();
      document.getElementById('shortcuts-overlay').classList.toggle('hidden');
      return;
    }
    if(e.key==='Escape'&&OVL.escape(e)) return;
    // Lernkarten-Tastatursteuerung (nicht in Eingabefeldern und nicht hinter offenen Fenstern)
    if(document.getElementById('v-flashcards').classList.contains('active')&&!OVL.any()&&!(e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]'))){
      if(e.key==='ArrowUp'){ e.preventDefault(); FC.flip(); }
      if(e.key===' '&&!e.target.matches('input,textarea,button,select')){ e.preventDefault(); FC.starCurrent(); }
      if((e.key==='ArrowRight'||e.key==='j')&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); FC.answer(true); }
      if((e.key==='ArrowLeft'||e.key==='f')&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); FC.answer(false); }
      if(e.key==='ArrowDown'&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); FC.answer('hard'); }
    }
  });
  let _perfRafPending=false;
  window.addEventListener('scroll',()=>{
    if(!_perfRafPending){_perfRafPending=true;requestAnimationFrame(()=>{updateReadProgress();_perfRafPending=false;});}
  },{passive:true});
  // Swipe-Back-Geste (Wischen vom linken Rand → zurück)
  (function(){
    let x0=0, y0=0, live=false;
    document.addEventListener('touchstart',e=>{
      if(e.touches.length!==1) return;
      x0=e.touches[0].clientX; y0=e.touches[0].clientY;
      live = x0 < 40; // nur vom linken Rand
    },{passive:true});
    document.addEventListener('touchend',e=>{
      if(!live) return; live=false;
      const dx=e.changedTouches[0].clientX-x0;
      const dy=Math.abs(e.changedTouches[0].clientY-y0);
      const active=document.querySelector('.view.active');
      if(active&&active.id==='v-flashcards') return;
      if(dx>70&&dy<60) NAV.back();
    },{passive:true});
  })();
  // Online/Offline-Indikator
  function updateOnlineStatus(){
    const online = navigator.onLine;
    document.body.classList.toggle('offline',!online);
  }
  window.addEventListener('offline', updateOnlineStatus);
  window.addEventListener('online', updateOnlineStatus);
  document.addEventListener('visibilitychange', updateOnlineStatus);
  updateOnlineStatus();
  if('serviceWorker' in navigator){
    // Neue Version: nicht mitten im Lernen neu laden, sondern einen Hinweis zeigen
    const hadSW=!!navigator.serviceWorker.controller;
    let reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(hadSW&&!reloading){ reloading=true; location.reload(); } });
    const offer=w=>{ if(!hadSW||!w) return; TOAST.show('Neue Version verfügbar',{type:'info',duration:600000,undo:()=>w.postMessage({type:'SKIP_WAITING'}),label:'Aktualisieren'}); };
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      if(reg.waiting) offer(reg.waiting);
      reg.addEventListener('updatefound',()=>{ const n=reg.installing; if(n) n.addEventListener('statechange',()=>{ if(n.state==='installed'&&navigator.serviceWorker.controller) offer(n); }); });
      document.addEventListener('visibilitychange',()=>{ if(!document.hidden) reg.update().catch(()=>{}); });
      // Spiele, Simulationen und Bilder erst nach dem Start im Hintergrund für den Offline-Betrieb ablegen (nicht bei „Daten sparen“)
      const warm=()=>{ const c=navigator.connection; if(c&&c.saveData) return; navigator.serviceWorker.ready.then(r=>r.active&&r.active.postMessage({type:'WARM'})).catch(()=>{}); };
      setTimeout(warm,6000);
    }).catch(()=>{});
  }
  ABK.render(); ABK.filter('');
  // Übrige Ansichten im Leerlauf nach dem Start einsetzen
  if(document.readyState==='complete') setTimeout(VIEWS.idle,1200); else window.addEventListener('load',()=>setTimeout(VIEWS.idle,1200));
  console.log('%c B VI %c Lernwebsite '+APP_VERSION+' · flametan/BVI-Lernwebsite ',
    'background:#A50000;color:#fff;padding:3px 8px;border-radius:4px 0 0 4px;font-family:"DM Mono",monospace;font-weight:700',
    'background:#0A192F;color:#C9A84C;padding:3px 8px;border-radius:0 4px 4px 0;font-family:"DM Mono",monospace');
});
/* ======================================================================
   KLEINE PAUSE – Sätze und Nachladen der Spiele (js/pause-data.js, js/pause.js)
====================================================================== */
const PAUSE_LOADER=(function(){
  const QUIPS=[
    'Kurz durchatmen – das Gehirn speichert in Pausen am besten.',
    'Fünf Minuten Spiel, danach geht das Lernen leichter.',
    'Auch der beste Atemschutzgeräteträger braucht mal frische Luft.',
    'Pause ist keine verlorene Zeit, sondern Ladezeit.',
    'Einmal den Kopf durchlüften, dann weiter im Stoff.',
    'Wissen sacken lassen – und nebenbei ein bisschen spielen.',
    'Kurze Pause, großer Effekt.',
    'Auch zwischen zwei Einsätzen gibt es eine Tasse Kaffee.',
    'Kurz abschalten, bevor der Akku leer ist.',
    'Wer Pausen macht, bleibt länger konzentriert.',
    'Ein Spiel zwischendurch hält den Kopf beweglich.',
    'Raus aus dem Paragrafendschungel, rein in die Pause.',
    'Kurz die Gedanken ordnen, dann geht es weiter.',
    'Die Wache ruht, die Neugier nicht.',
    'Ein bisschen Spaß gehört auch in den Dienstplan.',
    'Pause heißt nicht Stillstand – nur kurz Tempo raus.',
    'Zeit für eine Runde, bevor das nächste Kapitel ruft.',
    'Gehirnjogging statt Grübeln.',
    'Mal kurz den Helm absetzen.',
    'Ein paar Minuten Abstand bringen oft die beste Idee.',
    'Lernen ist ein Marathon – hier ist die Trinkstation.',
    'Durchschnaufen ist erlaubt, sogar ausdrücklich empfohlen.',
    'Kurzer Boxenstopp für den Kopf.',
    'Wer spielt, lernt oft mehr, als er denkt.',
    'Gönn dir eine Runde, du hast sie dir verdient.',
    'Das Lehrbuch läuft nicht weg.',
    'Zwischen Haushaltsplan und Stabsarbeit: einmal lächeln.',
    'Auch Führungskräfte dürfen mal Pause machen.',
    'Kurz entspannen, dann wieder volle Leistung.',
    'Eine Pause ist die beste Vorbereitung auf die nächste Stunde.',
    'Kopf frei, Wasser marsch für neue Gedanken.',
    'Ein kleines Rätsel zwischendurch weckt die grauen Zellen.',
    'Pause machen ist auch eine Führungsaufgabe – an sich selbst.',
    'Kaffee holen, eine Runde spielen, weiterlernen.',
    'Hier zählt kein Punkt für die Prüfung – nur der Spaß.',
    'Kurze Pausen verhindern lange Durchhänger.',
    'Abstand gewinnen, Überblick behalten.',
    'Erst ein Spiel, dann wieder Gesetzestexte.',
    'Wenn der Kopf raucht: kurz lüften.',
    'Eine Runde Quiz ist Frühsport fürs Gehirn.',
    'Kurz runterfahren, ohne den Motor abzustellen.',
    'Konzentration braucht Erholung – hier gibt es beides.',
    'Die beste Lernstrategie hat Pausen fest eingeplant.',
    'Ein bisschen Ablenkung, ganz ohne schlechtes Gewissen.',
    'Kurz die Perspektive wechseln.',
    'Fünf Minuten für dich – der Rest kann warten.',
    'Spielen ist Lernen in bequemer Kleidung.',
    'Status 2: einsatzbereit, aber gerade in der Pause.',
    'Pause heißt auch: Das Gelernte darf sich setzen.',
    'Noch eine Runde? Aber wirklich nur eine.'
  ];
  let last=-1,loading=null;
  // bei jedem Anzeigen ein anderer Satz
  function quip(){let i;do{i=Math.floor(Math.random()*QUIPS.length);}while(i===last&&QUIPS.length>1);last=i;return QUIPS[i];}
  function load(){
    if(typeof PAUSE!=='undefined') return Promise.resolve();
    if(loading) return loading;
    const add=src=>new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=fail;document.body.appendChild(s);});
    loading=add('js/pause-data.js').then(()=>add('js/pause.js')).catch(()=>{loading=null;const r=document.getElementById('pause-root');if(r)r.innerHTML='<div class="m-card">Die Spiele konnten nicht geladen werden. Bitte Verbindung prüfen.</div>';});
    return loading;
  }
  function onShow(id){
    if(id!=='v-pause'){ if(typeof PAUSE!=='undefined') PAUSE.leave(); return; }
    const q=document.getElementById('pause-quip'); if(q) q.textContent=quip();
    const pr=document.getElementById('pause-root'); if(pr&&typeof PAUSE==='undefined'&&!pr.firstElementChild) pr.innerHTML='<div class="pz-wrap pz-hub sk" aria-hidden="true"><div class="m-sec pz-sec"><i class="sk-b" style="width:90px;height:14px"></i></div><div class="pz-tiles pz-fw"><div class="pz-tile wide hero sk-pzt"><i class="sk-b sk-ic"></i><div><i class="sk-b sk-line" style="width:62%"></i><i class="sk-b sk-line" style="width:88%;height:10px;margin-top:8px"></i></div></div><div class="pz-tile sk-pzt"><i class="sk-b sk-ic"></i><div><i class="sk-b sk-line" style="width:62%"></i><i class="sk-b sk-line" style="width:88%;height:10px;margin-top:8px"></i></div></div><div class="pz-tile sk-pzt"><i class="sk-b sk-ic"></i><div><i class="sk-b sk-line" style="width:62%"></i><i class="sk-b sk-line" style="width:88%;height:10px;margin-top:8px"></i></div></div><div class="pz-tile sk-pzt"><i class="sk-b sk-ic"></i><div><i class="sk-b sk-line" style="width:62%"></i><i class="sk-b sk-line" style="width:88%;height:10px;margin-top:8px"></i></div></div><div class="pz-tile sk-pzt"><i class="sk-b sk-ic"></i><div><i class="sk-b sk-line" style="width:62%"></i><i class="sk-b sk-line" style="width:88%;height:10px;margin-top:8px"></i></div></div></div><div class="m-sec pz-sec"><i class="sk-b" style="width:150px;height:14px"></i></div><div class="pz-src"><span><i class="sk-b" style="width:78px;height:12px"></i></span><div class="pz-mode"><i class="sk-b" style="width:210px;height:28px"></i></div></div><div class="pz-tiles pz-wi"><div class="pz-tile sk-pzt"><i class="sk-b sk-ic"></i><div><i class="sk-b sk-line" style="width:62%"></i><i class="sk-b sk-line" style="width:88%;height:10px;margin-top:8px"></i></div></div><div class="pz-tile sk-pzt"><i class="sk-b sk-ic"></i><div><i class="sk-b sk-line" style="width:62%"></i><i class="sk-b sk-line" style="width:88%;height:10px;margin-top:8px"></i></div></div><div class="pz-tile sk-pzt"><i class="sk-b sk-ic"></i><div><i class="sk-b sk-line" style="width:62%"></i><i class="sk-b sk-line" style="width:88%;height:10px;margin-top:8px"></i></div></div><div class="pz-tile sk-pzt"><i class="sk-b sk-ic"></i><div><i class="sk-b sk-line" style="width:62%"></i><i class="sk-b sk-line" style="width:88%;height:10px;margin-top:8px"></i></div></div><div class="pz-tile wide sk-pzt"><i class="sk-b sk-ic"></i><div><i class="sk-b sk-line" style="width:62%"></i><i class="sk-b sk-line" style="width:88%;height:10px;margin-top:8px"></i></div></div></div></div>';
    load().then(()=>{ if(typeof PAUSE!=='undefined'&&document.getElementById('v-pause').classList.contains('active')) PAUSE.show(); });
  }
  return { quip, onShow, load, QUIPS };
})();

/* ── Desktop-Seitenleiste: Drawer (Hamburger) oder angeheftet ─────────────── */
const RAIL=(function(){
  const KEY='bvi_rail_pin', mq=window.matchMedia('(min-width:1100px)');
  let open=false, tm=0;
  const b=()=>document.body, pinB=()=>document.getElementById('m-pin'), rail=()=>document.getElementById('m-rail');
  const pinned=()=>b().classList.contains('rail-pin');
  function setOpen(o){
    clearTimeout(tm);
    open=!!o&&!pinned()&&mq.matches;
    b().classList.toggle('rail-open',open);
  }
  function sync(){ const p=pinned(), pb=pinB(); if(pb){ pb.setAttribute('aria-pressed',p); pb.setAttribute('aria-label',p?'Seitenleiste lösen':'Seitenleiste anheften'); pb.dataset.tip=p?'Seitenleiste lösen':'Seitenleiste anheften'; pb.removeAttribute('title'); } setOpen(false); }
  function init(){
    document.querySelectorAll('#m-rail .m-ri').forEach(e=>{ const t=(e.textContent||'').replace(/\s+/g,' ').replace(/Strg K/,'').trim(); if(t){ e.dataset.tip=t; e.setAttribute('aria-label',t); } });   // eingeklappt zeigt der Balken nur Symbole: Name als Tooltip
    // Symbole wie in der Tab-Leiste am Handy: Umriss + gefüllte Ebene (Icon Fill) und kleine Klick-Animation je Symbol
    const N=window.NAVBAR;
    if(N) document.querySelectorAll('#m-rail .m-ri[data-tab]').forEach(btn=>{
      const id=btn.dataset.tab, old=btn.querySelector(':scope>svg'); if(!old||!N.IC[id]) return;
      btn.dataset.ic=id;
      const w=document.createElement('span'); w.className='m-tic'; w.innerHTML=N.svg(N.IC[id],'o')+N.svg(N.ICF[id]||N.IC[id],'f'); btn.replaceChild(w,old);
      btn.addEventListener('click',()=>N.tap(btn));
    });
    const sb=document.querySelector('#m-rail .m-ri-search'); if(sb){ sb.dataset.ic='search'; sb.addEventListener('click',()=>{ window.NAVBAR&&NAVBAR.tap(sb); }); }
    const r=rail(); if(!r) return;
    // Premium-Sidebar: kein Aufklappen beim Darüberfahren; der Name des Tabs erscheint als Sprechblase (CSS, data-tip). Anheften über den Pin.
    // Beim Darüberfahren (oder Tastatur-Fokus, Antippen) klappt die schmale Leiste über den Inhalt auf; Pin erscheint erst dann
    // Klick auf ein Symbol: Leiste bleibt schmal (kein Aufklappen), bis die Maus sie verlässt
    let hv=0, hold=false;
    const want=o=>{ clearTimeout(hv); if(o&&hold) return; hv=setTimeout(()=>setOpen(o),o?90:260); };
    r.addEventListener('pointerdown',e=>{ if(e.target.closest('.m-ri')&&!pinned()){ hold=true; clearTimeout(hv); setOpen(false); } });
    document.addEventListener('pointerdown',e=>{ if(!r.contains(e.target)) hold=false; },true);
    r.addEventListener('mouseenter',()=>want(true));
    r.addEventListener('mouseleave',()=>{ hold=false; want(false); });
    r.addEventListener('focusin',()=>{ if(!r.matches(':hover')) want(true); });
    r.addEventListener('focusout',e=>{ if(!r.contains(e.relatedTarget)) want(false); });
    r.addEventListener('click',e=>{ if(!open&&!hold&&!pinned()&&mq.matches&&!e.target.closest('.m-ri')) want(true); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&open) setOpen(false); });
    (mq.addEventListener?mq.addEventListener.bind(mq,'change'):mq.addListener.bind(mq))(()=>sync());
    sync();
  }
  return { init, toggle(){ setOpen(!open); }, close(){ setOpen(false); },
    pin(){ const p=!pinned(); setOpen(false); b().classList.toggle('rail-pin',p); try{ localStorage.setItem(KEY,p?'1':'0'); }catch(e){} sync(); window.dispatchEvent(new Event('resize')); } };
})();
/* ======================================================================
   VIEWS – Nachbearbeitung der Ansichten. Die teuren Schritte (Schriftgrößen der Schaubilder messen,
   Tabellen einrahmen) laufen erst, wenn eine Ansicht zum ersten Mal geöffnet wird, nicht für alle beim Start.
====================================================================== */
const VIEWS=(function(){
  // Lernseiten liegen in index.html als <template data-lazy-view="v-…"> (siehe tools/lazy_views.py) und werden
  // erst beim Öffnen, bei der Suche oder im Leerlauf nach dem Start in das Dokument eingesetzt.
  const T=new Map(), IDS=window.__LAZY_IDS||{};
  document.querySelectorAll('template[data-lazy-view]').forEach(t=>T.set(t.dataset.lazyView,t));
  const _gid=Document.prototype.getElementById, _qs=Document.prototype.querySelector;

  function heavy(root){
  // Schaubilder: kleinste Schrift soll am Handy lesbar bleiben (~9,5 px); sonst seitlich wischbar, Tippen vergrößert
  root.querySelectorAll('.diagram-wrap svg').forEach(svg=>{
    const vb=(svg.getAttribute('viewBox')||'').split(/[ ,]+/).map(Number); if(!(vb[2]>0)) return;
    let min=99; svg.querySelectorAll('text').forEach(t=>{ const f=parseFloat(getComputedStyle(t).fontSize); if(f>0&&f<min) min=f; });
    if(min===99) return;
    const need=Math.min(760,Math.ceil(vb[2]*9.5/min));
    if(need>300){ svg.style.setProperty('--svg-min',need+'px'); const w=svg.closest('.diagram-wrap'); if(w){ w.dataset.wide='1'; if(!w.querySelector('.sv-hint')){ const h=document.createElement('div'); h.className='sv-hint'; h.textContent='← wischen · antippen zum Vergrößern →'; w.appendChild(h); } } }
  });
  root.querySelectorAll('.pc table').forEach(t=>{
    // Tabellen mit reiner Nummernspalte (z. B. Sonderbau-Nr.): Nummer nie umbrechen
    const f=[...t.querySelectorAll('tr')].slice(1).map(r=>r.cells[0]&&r.cells[0].textContent.trim()).filter(x=>x!==undefined);
    if(f.length>2&&f.every(x=>/^\d{1,3}[a-z]?\.?$/.test(x))) t.classList.add('tb-nr');
    if(t.closest('.tbl-wrap')) return;
    const w=document.createElement('div');
    w.className='tbl-wrap';
    t.parentNode.insertBefore(w,t);
    w.appendChild(t);
  });
  }
  function light(root){
  // Accent-Solo-Erkennung: Wenn .accent den gesamten Titel ausmacht → Gradient, sonst Vollrot
  root.querySelectorAll('.page-title .accent').forEach(acc=>{
    if(acc.parentNode.textContent.trim()===acc.textContent.trim()) acc.classList.add('accent-solo');
  });
  // Dekorative SVGs für Screenreader ausblenden
  root.querySelectorAll('.tile-icon,.tile-arr,.tc-icon').forEach(el=>el.setAttribute('aria-hidden','true'));
  // Keyboard-Navigation für Kacheln und Topic-Cards
  root.querySelectorAll('.glass-tile,.topic-card').forEach(el=>{
    el.setAttribute('tabindex','0');
    el.setAttribute('role','button');
    el.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); el.click(); }
    });
  });

  }
  function enhance(v){ if(!v||v._enh) return; v._enh=1; heavy(v); }
  function progress(){ try{ if(typeof PROGRESS!=='undefined'){ PROGRESS.invalidate(); PROGRESS.updateUI(); } }catch(e){} }
  // quiet: mehrere Ansichten nacheinander einsetzen; der Fortschritt (Haken an Kacheln) wird dann einmal am Ende nachgeführt
  function hydrate(id,quiet){
    const t=T.get(id); if(!t) return null;
    T.delete(id);
    const el=t.content.firstElementChild;
    t.replaceWith(t.content);
    light(el);
    if(!quiet) progress();
    return el;
  }
  // document.getElementById und document.querySelector('#…') finden auch Elemente in noch nicht eingesetzten Ansichten
  const owner=id=>T.has(id)?id:(IDS[id]&&T.has(IDS[id])?IDS[id]:null);
  Document.prototype.getElementById=function(id){
    let e=_gid.call(this,id);
    if(!e&&this===document){ const o=owner(id); if(o){ hydrate(o); e=_gid.call(this,id); } }
    return e;
  };
  Document.prototype.querySelector=function(sel){
    if(this===document&&typeof sel==='string'&&sel.charCodeAt(0)===35){ const m=/^#([\w-]+)/.exec(sel), o=m&&owner(m[1]); if(o) hydrate(o); }
    return _qs.call(this,sel);
  };
  let idleOn=false;
  function ensureAll(){ if(!T.size) return; [...T.keys()].forEach(k=>hydrate(k,true)); progress(); }
  function afterAll(){
    // Dinge, die beim Start über das ganze Dokument laufen, für die nachgeladenen Ansichten nachholen
    progress();
    window.dispatchEvent(new Event('views:ready'));
  }
  // Im Leerlauf nach dem Start nach und nach alle übrigen Ansichten einsetzen (je Schritt eine)
  function idle(){
    if(idleOn||!T.size) return; idleOn=true;
    const ric=window.requestIdleCallback||(f=>setTimeout(()=>f({timeRemaining:()=>20}),60));
    const step=dl=>{
      const t0=performance.now();
      while(T.size&&(dl.timeRemaining()>6||performance.now()-t0<2)){ hydrate(T.keys().next().value,true); if(performance.now()-t0>12) break; }
      if(T.size) ric(step,{timeout:2000}); else afterAll();
    };
    ric(step,{timeout:2000});
  }
  return {
    light, enhance, hydrate, ensureAll, idle,
    pending(){ return T.size; },
    // alle Ansichten einsetzen und fertig nachbearbeiten (Tests)
    hydrateAll(){ ensureAll(); document.querySelectorAll('.view').forEach(enhance); afterAll(); }
  };
})();

window.RAIL=RAIL;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>RAIL.init()); else RAIL.init();
