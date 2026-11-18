/* IdF-Spiel – Oberfläche: Startbildschirm mit Training, Levelwahl, Spielansicht mit Auftrag, Fragen in mehreren Arten,
   Auswertung, Wiederholung, Prüfung und Bestenliste. */
(function(){
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const fmt = n => n.toLocaleString('de-DE');
  const PAR = new URLSearchParams(location.search), VON = /^v-[a-z0-9-]+$/.test(PAR.get('von') || '') ? PAR.get('von') : null;
  let screen = 'home', mis = null, data = null, lvl = 0, run = null, tipT = 0, uhr = 0, modus = 'mission', lauf = null, fpsT = 0, coachT = 0;
  const SG = ['S1 Personal', 'S2 Lage', 'S3 Einsatz', 'S4 Versorgung', 'S5 Presse', 'S6 IuK'];
  const TRAIN = { wdh:{ id:'wdh', thema:'Training', titel:'Wiederholung', welt:true }, pruefung:{ id:'pruefung', thema:'Training', titel:'Prüfung', welt:true } };

  function show(name){
    screen = name;
    ['home', 'levels', 'play', 'rang'].forEach(s => { $(s).hidden = s !== name; });
    $('training').hidden = name !== 'home';
    $('btn-back').hidden = false; $('btn-back').setAttribute('aria-label', name === 'home' ? (VON === 'v-pause' ? 'Zurück zum Pausenraum' : 'Zurück zur Lern-App') : 'Zurück'); $('btn-menu').hidden = name !== 'play';
    $('top-kick').textContent = name === 'home' ? 'IdF Münster' : name === 'rang' ? 'Training' : mis.thema;
    $('top-title').textContent = name === 'home' ? 'Simulationen' : name === 'rang' ? 'Bestenliste' : name === 'levels' ? mis.titel : modus === 'mission' ? 'Level ' + (lvl + 1) + ' · ' + data.level[lvl].titel : mis.titel;
    $('st-total').textContent = fmt(CORE.total()); $('st-serie').textContent = CORE.serie();
  }

  /* ---------- Daten laden ---------- */
  const DATEN = {};
  function lade(id){ return DATEN[id] ? Promise.resolve(DATEN[id]) : fetch('data/' + id + '.json').then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }).then(d => (DATEN[id] = d)); }
  function script(src){
    return new Promise((ok, no) => {
      if(document.querySelector('script[src="' + src + '"]')) return ok();
      const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s);
    });
  }
  // Aufgabe für Wiederholung und Prüfung: eigenständig lösbar machen (Begehung bekommt Gebäude und Geschoss in die Frage, Meldungen werden zur Auswahl)
  function wandle(m, d, l, a){
    const L = d.level[l], o = Object.assign({}, a, { _m:m, _l:l, _f:a.frage });
    if(m === 'begehung'){ o.typ = 'mc'; o.frage = 'Begehung · ' + L.titel + ' · ' + L.geschosse[a.g].name + ': ' + a.frage; o.optionen = d.optionen[a.opt]; }
    else if(a.typ === 'bringen'){ o.typ = 'mc'; o.frage = 'Welches Sachgebiet ist zuständig? „' + a.frage + '“'; o.optionen = SG; o.richtig = SG.find(x => x.indexOf(a.ziel) === 0); }
    return o;
  }
  const fehler = () => { $('daily').className = 'daily'; $('daily').textContent = 'Die Daten konnten nicht geladen werden. Bitte prüfe die Verbindung und versuche es erneut.'; };

  /* ---------- Startbildschirm ---------- */
  const SYM = { begehung:'grid', stellungnahme:'doc', stab:'users', presse:'mic', lage:'globe', ucpm:'plane', ibk:'chat', vak:'book', feuak:'calc' };
  const HUE = { begehung:28, stellungnahme:200, stab:160, presse:330, lage:262, ucpm:190, ibk:300, vak:12, feuak:45 };
  const PATH = {
    grid:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/>', doc:'<path d="M7 3h8l4 4v14H7z"/><path d="M10 12h6M10 16h6"/>',
    users:'<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6M15 15c3 0 6 1.5 6 5"/>', mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>', plane:'<path d="M3 13l18-8-6 16-3-7z"/>', chat:'<path d="M4 5h16v11H9l-5 4z"/>',
    book:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>', calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2"/>',
    repeat:'<path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    star:'<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>', trophy:'<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 20h8"/>'
  };
  const ICON = (n, s, c) => '<svg' + (c ? ' class="' + c + '"' : '') + ' viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="' + (c ? 1.4 : 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATH[n] || '') + '</svg>';
  function home(){
    const d = $('daily'), done = CORE.dailyDone();
    d.className = 'daily' + (done ? ' done' : '');
    d.textContent = done ? 'Tagesziel geschafft. Serie: ' + CORE.serie() + (CORE.serie() === 1 ? ' Tag.' : ' Tage.') : 'Tagesziel: Spiele heute ein Level, eine Wiederholung oder eine Prüfung.';
    const f = CORE.faellig().length, w = CORE.woche(), pb = CORE.pruefBest();
    const pill = (t, ico, txt, sub, extra, ttl) => '<button class="pill" data-t="' + t + '"' + (extra || '') + ' title="' + esc(ttl) + '">' + ICON(ico, 18) + '<span>' + txt + '</span>' + (sub ? '<b>' + sub + '</b>' : '') + '</button>';
    $('training').innerHTML =
      pill('wdh', 'repeat', 'Wiederholung', f || '', f ? '' : ' disabled', f ? (f === 1 ? 'Eine Aufgabe ist fällig' : f + ' Aufgaben sind fällig') : 'Nichts fällig. Falsch gelöste Aufgaben landen hier.')
      + pill('pruefung', 'clock', 'Prüfung', pb ? pb + ' %' : '', '', '20 gemischte Fragen, 15 Minuten' + (pb ? ' · Bestwert ' + pb + ' %' : ''))
      + pill('woche', 'star', 'Woche', Math.min(w.n, w.ziel) + '/' + w.ziel, w.n >= w.ziel ? ' data-ok="1"' : '', 'Wochenaufgabe: ' + w.mission.titel + ' – drei Level bestehen')
      + pill('rang', 'trophy', 'Liste', '', '', 'Bestenliste auf diesem Gerät');
    $('missions').innerHTML = CORE.MISSIONS.map((m, i) => {
      const p = CORE.passed(m.id);
      return '<button class="card" data-m="' + m.id + '" style="--h:' + (HUE[m.id] != null ? HUE[m.id] : (i * 47) % 360) + '"' + (m.bereit ? '' : ' disabled') + ' title="' + esc(m.text) + '">'
        + ICON(SYM[m.id] || 'grid', 96, 'bg') + '<span class="kick">' + esc(m.thema) + '</span><h3>' + esc(m.titel) + '</h3>'
        + '<span class="lvl">Level ' + p + ' / ' + m.levels + '</span><div class="bar"><i style="width:' + Math.round(p / m.levels * 100) + '%"></i></div>'
        + '</button>';
    }).join('');
    if(VON){ $('app-link').href = '../index.html#' + VON; $('app-link').textContent = VON === 'v-pause' ? 'Zurück zum Pausenraum' : 'Zurück zum Kapitel in der Lern-App'; }
    modus = 'mission'; show('home');
  }

  async function mission(id){
    const m = CORE.MISSIONS.find(x => x.id === id); if(!m) return;
    try{ const [d] = await Promise.all([lade(m.id), script('js/m-' + (m.welt ? 'welt' : m.id) + '.js')]); mis = m; data = d; modus = 'mission'; levels(); }catch(err){ fehler(); }
  }
  $('missions').addEventListener('click', e => { const c = e.target.closest('.card'); if(c && !c.disabled) mission(c.dataset.m); });
  $('training').addEventListener('click', e => {
    const c = e.target.closest('button.pill'); if(!c || c.disabled) return;
    if(c.dataset.t === 'rang') rang(); else if(c.dataset.t === 'woche') mission(CORE.woche().mission.id); else training(c.dataset.t);
  });

  /* ---------- Training: Wiederholung fälliger Aufgaben, Prüfung über alle Themen ---------- */
  async function training(art){
    try{
      const ids = CORE.MISSIONS.map(m => m.id), alle = await Promise.all(ids.map(lade)); await script('js/m-welt.js');
      let aufgaben = [], L;
      if(art === 'wdh'){
        CORE.faellig().forEach(e => {
          const d = DATEN[e.m], lv = d && d.level[e.l], a = lv && lv.aufgaben.find(x => x.frage === e.f);
          if(a){ const o = wandle(e.m, d, e.l, a); if(o.typ !== 'mc' || Array.isArray(o.optionen)) aufgaben.push(o); } else CORE.vergiss(e.m, e.l, e.f);          // Aufgabe gibt es nicht mehr
        });
        aufgaben = aufgaben.slice(0, 10); if(!aufgaben.length) return home();
        L = { titel:'Wiederholung', steckbrief:'Diese Aufgaben hast du zuletzt nicht im ersten Versuch gelöst.', aufgaben, licht:'morgen',
          auftrag:{ wer:'Tutorin', text:'Schön, dass du dranbleibst. Hier warten die Aufgaben, bei denen es zuletzt gehakt hat. Was du heute kannst, lasse ich länger ruhen.' } };
      } else {
        const pool = []; ids.forEach((m, i) => alle[i].level.forEach((lv, l) => !lv.szenario && lv.aufgaben.forEach(a => { const o = wandle(m, alle[i], l, a); if(['mc', 'multi', 'reihe'].includes(o.typ) && Array.isArray(o.optionen)) pool.push(o); })));
        for(let i = pool.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)), t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
        aufgaben = pool.slice(0, 20);
        L = { titel:'Prüfung', steckbrief:'20 Fragen aus allen Themen. Ein Versuch je Frage, die Zeit läuft.', aufgaben, zeit:900, licht:'tag', pruefung:true,
          auftrag:{ wer:'Prüfungsvorsitzender', text:'Willkommen zur Prüfung. Zwanzig Fragen aus allen Themen, fünfzehn Minuten. Je Frage haben Sie einen Versuch. Viel Erfolg.' } };
      }
      mis = TRAIN[art]; data = { welt:'hoersaal', level:[L] }; modus = art; play(0);
    }catch(err){ console.warn(err); fehler(); }
  }

  /* ---------- Bestenliste ---------- */
  function rang(){
    mis = TRAIN.wdh; $('rang-name').value = CORE.opt('name');
    const zeit = t => Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
    const liste = (a, fn) => a.length ? a.map(e => '<li><b>' + esc(e.n) + '</b><span>' + esc(fn(e)) + '</span><span>' + esc(e.d.split('-').reverse().join('.')) + '</span></li>').join('') : '<li class="leer">Noch keine Einträge.</li>';
    $('rang-p').innerHTML = liste(CORE.rang('pruefung'), e => e.p + ' % · ' + e.w + ' · ' + zeit(e.t || 0) + ' min');
    $('rang-l').innerHTML = liste(CORE.rang('level'), e => fmt(e.p) + ' P. · ' + e.w);
    show('rang');
  }
  $('rang-name').onchange = e => CORE.setOpt('name', e.target.value.trim().slice(0, 20));

  /* ---------- Levelwahl ---------- */
  function levels(){
    $('lv-text').textContent = mis.text;
    $('lv-kap').href = '../index.html#' + mis.kapitel;
    $('lv-list').innerHTML = data.level.map((L, i) => {
      const r = CORE.lv(mis.id, i), open = CORE.unlocked(mis.id, i);
      return '<button class="lv' + (r && r.ok ? ' ok' : '') + '" data-l="' + i + '"' + (open ? '' : ' disabled') + '>'
        + '<span class="no">' + (i + 1) + '</span><span class="lt"><b>' + esc(L.titel) + '</b><span>' + (open ? esc(L.steckbrief) : 'Wird frei, wenn Level ' + i + ' bestanden ist.') + '</span>'
        + (L.szenario || (r && r.ernst) ? '<span class="tags">' + (L.szenario ? '<i class="tag">Zusammenhängender Fall</i>' : '') + (r && r.ernst ? '<i class="tag ok">Im Ernstfall bestanden</i>' : '') + '</span>' : '') + '</span>'
        + '<span class="pt">' + (r ? fmt(r.best) + ' P.' : '') + '</span></button>';
    }).join('');
    stufeZeigen(); show('levels');
  }
  /* Schwierigkeit: Lernen (mit Tipps, ohne Zeit), Normal, Ernstfall (ein Versuch, ohne Richtungspfeil und Minikarte) */
  const STUFEN = { lernen:'Lernen: ohne Zeitdruck und Fristen. In vielen Aufgaben gibt es einen Tipp; mit Tipp zählt die Aufgabe halb.',
    normal:'Normal: zwei Versuche je Aufgabe, Zeit und Fristen laufen.', ernst:'Ernstfall: ein Versuch je Aufgabe, Zeit und Fristen laufen, kein Richtungspfeil und keine Minikarte.' };
  function stufeZeigen(){ const s = CORE.opt('stufe'); $('lv-stufe').querySelectorAll('button').forEach(b => { const an = b.dataset.s === s; b.setAttribute('aria-checked', an); b.classList.toggle('on', an); }); $('lv-stufe-t').textContent = STUFEN[s] || STUFEN.normal; }
  $('lv-stufe').addEventListener('click', e => { const b = e.target.closest('button'); if(b){ CORE.setOpt('stufe', b.dataset.s); stufeZeigen(); } });
  $('lv-list').addEventListener('click', e => { const b = e.target.closest('.lv'); if(b && !b.disabled) play(+b.dataset.l); });

  /* ---------- Spielen ---------- */
  function play(i){
    lvl = i; stop();
    const L = data.level[i], n = L.aufgaben.length + (L.eingang ? L.eingang.length : 0), stufe = modus === 'mission' ? CORE.opt('stufe') : 'normal', mitZeit = !!L.zeit && stufe !== 'lernen';
    const st = { pts:0, done:0, combo:0, fehler:0, max:n * 100, falsch:[], t0:Date.now(), rest:mitZeit ? L.zeit : 0, log:[], lage:L.lage ? L.lage.start : null, stufe };
    lauf = { L, st, stufe };
    $('hud-s').textContent = L.steckbrief; $('result').hidden = true; $('sheet').hidden = true; $('note').hidden = true; $('rec').hidden = true;
    $('tip').textContent = 'Lauf mit dem Stick oder mit WASD zu einer Leuchtsäule und drück den Knopf oder die Taste E. Ziehen dreht die Kamera.' + (mis.welt ? '' : ' Über die Treppe kommst du in die anderen Geschosse.');
    $('tip').hidden = true; clearTimeout(tipT);
    show('play');
    const hud = () => {
      $('hud-prog').textContent = st.done + ' / ' + n; $('hud-pts').textContent = fmt(st.pts);
      $('hud-combo').hidden = st.combo < 3; $('hud-combo').textContent = 'Serie ×' + st.combo;
    };
    hud();
    // Einsatz: Anzeige, wie gut die Lage im Griff ist (0 bis 100), und die Phasen des Falls
    const lageZ = d => {
      if(st.lage === null) return; st.lage = Math.max(0, Math.min(100, st.lage + (d || 0)));
      $('hud-lbar').style.width = st.lage + '%'; $('hud-lbar').className = st.lage >= 70 ? '' : st.lage >= 40 ? 'mittel' : 'schlecht'; $('hud-lwert').textContent = st.lage;
      $('hud-lrole').setAttribute('aria-label', L.lage.name + ': ' + st.lage + ' von 100');
    };
    $('hud-lage').hidden = st.lage === null; if(L.lage){ $('hud-lname').textContent = L.lage.name; lageZ(0); }
    const phasen = L.szenario ? L.aufgaben.map(a => a.phase).filter((p, k, a) => p && a.indexOf(p) === k) : [];
    $('hud-ph').hidden = !phasen.length; $('hud-ph').innerHTML = phasen.map(p => '<li>' + esc(p) + '</li>').join('');
    const phase = p => { const k = phasen.indexOf(p); [...$('hud-ph').children].forEach((li, j) => { li.className = j < k ? 'war' : j === k ? 'ist' : ''; if(j === k) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); }); };
    STAGE.audio.on = CORE.opt('ton'); FX.stimme.on = CORE.opt('sprache');
    // Zeitdruck: läuft, solange gespielt wird (nicht im Menü und nicht während des Auftrags); bei null zählen die offenen Aufgaben als falsch
    clearInterval(uhr);
    const zeit = () => { const e = $('hud-time'), r = st.rest; e.hidden = !mitZeit; if(mitZeit){ e.textContent = Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0'); e.classList.toggle('knapp', r <= 30); } };
    zeit();
    if(mitZeit) uhr = setInterval(() => {
      if(!run || !$('menu').hidden || !$('result').hidden || !$('brief').hidden || document.hidden) return;
      st.rest--; zeit(); if(st.rest > 0) return;
      clearInterval(uhr); if(qDone){ const f = qDone; qDone = null; schliesse(); f(null); }
      st.fehler += n - st.done; st.done = n; st.combo = 0; hud(); STAGE.sfx('bad'); result(st, true);
    }, 1000);
    const karte = $('karte'), zeichne = FX.minikarte(karte); karte.hidden = !CORE.opt('karte') || stufe === 'ernst';
    try{ run = (window.MISSIONS[mis.id] || window.MISSIONS.welt).start({
      canvas: $('stage'), level: L, welt: data.welt, licht: L.licht, fx: CORE.opt('fx'),
      note: t => { $('note').hidden = !t; $('note').textContent = t || ''; if(t) $('tip').hidden = true; }, ui: { joy:$('joy'), act:$('act'), up:$('up'), down:$('down'), info:$('info') },
      karte: (b, boxes, punkte, ich) => { if(!karte.hidden) zeichne(b, boxes, punkte, ich); },
      stufe, phase,
      ask: (a, ort, modell) => ask(a, a.optionen || (data.optionen && data.optionen[a.opt]), L.pruefung || stufe === 'ernst', modell),
      // Einsatz: Station blieb zu lange liegen (weg = Nebenmeldung ist verfallen)
      verzug(a, weg){ lageZ(weg ? -10 : -8); },
      // Einsatz: Folgeschritt nach einer schlechten Entscheidung; er bringt keine Punkte, nur die Lage ändert sich
      folge(tries, a, res){ lageZ(tries === 1 ? 6 : tries === 2 ? -2 : -8); st.log.push({ a, tries, res, frei:true }); STAGE.sfx(tries === 1 ? 'ok' : tries === 2 ? 'halb' : 'bad'); blitz(tries); },
      count(tries, a, res){
        st.done++; st.log.push({ a, tries, res });
        if(L.szenario && !(res && res.verpasst)) lageZ(tries === 1 ? 8 : tries === 2 ? -2 : -14);
        if(tries === 1){ st.combo++; st.pts += 100 + (st.combo >= 3 && !L.pruefung ? 20 : 0); }
        else { st.combo = 0; st.fehler++; if(tries === 2) st.pts += 50; if(a) st.falsch.push(a); }
        STAGE.sfx(tries === 1 ? 'ok' : tries === 2 ? 'halb' : 'bad');
        if(tries > 1 && CORE.opt('vib') && navigator.vibrate) navigator.vibrate(tries === 2 ? 40 : [60, 50, 60]);
        blitz(tries);
        // Wiederholung: Fehler vormerken; in der Wiederholung selbst rückt Gekonntes weiter nach hinten
        if(a && !L.szenario && a.typ !== 'stadt'){ const m = a._m || mis.id, l = a._m ? a._l : lvl, f = a._f || a.frage; if(tries > 1) CORE.merke(m, l, f); else if(modus === 'wdh') CORE.gekonnt(m, l, f); }
        hud();
      },
      finish(){ clearInterval(uhr); setTimeout(() => result(st), 900); },
      menu, fade
    }); }catch(e){ console.warn('3D-Start fehlgeschlagen', e); run = null; $('nogl').hidden = false; return; }
    run.stage.setQuality(CORE.opt('qual')); run.stage.input.sens = CORE.opt('sens');
    wake(true); auftrag(L); fpsZeigen();
    window.GAME_RUN = run; window.GAME_ST = st;                               // für die automatische Prüfung (game/tests)
  }
  // Auftrag: Wer spricht und worum geht es. Die Kamera fliegt währenddessen heran; gespielt wird nach „Los geht’s“
  function auftrag(L){
    const los = () => { $('brief').hidden = true; FX.sprich(''); if(run && run.halt) run.halt(false); clearTimeout(tipT); if(coach()) return; $('tip').hidden = false; tipT = setTimeout(() => { $('tip').hidden = true; }, 9000); };
    if(!L.auftrag) return los();
    const P = person(L.auftrag.p);
    $('brief-wer').innerHTML = P ? kopf(P) : esc(L.auftrag.wer); $('brief-wer').className = P ? 'q-wer' : 'kick'; $('brief-text').textContent = L.auftrag.text; $('brief').hidden = false; $('brief-ok').onclick = los;
    if(run.halt) run.halt(true); FX.sprich(L.auftrag.text, P && P.stimme); $('brief-ok').focus({ preventScroll:true });
  }
  /* Feste Figuren eines Einsatzes: Gesicht (gezeichnet), Name, Rolle und eigene Stimmlage */
  function person(id){
    const L = lauf && lauf.L, P = id && L && L.personen ? L.personen.find(x => x.id === id) : null; if(!P) return null;
    if(!P.stimme){ let h = 0; for(const c of P.name) h = (h * 31 + c.charCodeAt(0)) >>> 0; const frau = /^Frau\b/.test(P.name); P.h = h; P.frau = frau; P.stimme = { pitch:(frau ? 1.2 : 0.8) + (h % 5) * 0.04, rate:0.96 + (h % 4) * 0.03 }; }
    return P;
  }
  function gesicht(P){
    const h = P.h, haut = ['#f1c9a5', '#e3b088', '#c98d5e', '#f6d7b8'][h % 4], haar = ['#2a1d14', '#5b3a22', '#8a8a8a', '#c9a45c', '#141414'][(h >> 3) % 5], jacke = ['#1f3f6f', '#7a2e22', '#3f5f4a', '#4a4f58'][(h >> 5) % 4];
    return '<svg class="av" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="' + jacke + '" opacity=".25"/><path d="M5 48c1-11 9-15 19-15s18 4 19 15z" fill="' + jacke + '"/><path d="M19 30h10v6l-5 3-5-3z" fill="' + haut + '"/>'
      + (P.frau ? '<path d="M11 22c0-9 5-15 13-15s13 6 13 15v9c0 2-3 3-5 2V20H16v13c-2 1-5 0-5-2z" fill="' + haar + '"/>' : '')
      + '<circle cx="24" cy="21" r="10.5" fill="' + haut + '"/><path d="M13.5 19c1-7 5-10 10.5-10s9.5 3 10.5 10c-3-3-7-4.500-10.500-4.500S16.500 16 13.500 19z" fill="' + haar + '"/>'
      + '<circle cx="20" cy="21.5" r="1.3" fill="#2a2a2a"/><circle cx="28" cy="21.5" r="1.3" fill="#2a2a2a"/><path d="M20.5 26.500c2 1.600 5 1.600 7 0" fill="none" stroke="#7a4a3a" stroke-width="1.300" stroke-linecap="round"/></svg>';
  }
  const kopf = P => gesicht(P) + '<span><b>' + esc(P.name) + '</b>' + esc(P.rolle) + '</span>';

  /* Einführung beim ersten Spiel: vier kurze Schritte, die sich selbst abhaken; überspringbar */
  function coach(){
    clearInterval(coachT); $('coach').hidden = true;
    if(CORE.opt('tut') || !run || !run._pos || !run._stage) return false;
    const p0 = { x:run._pos.x, z:run._pos.z }, y0 = run._stage.input.yaw; let k = 0;
    const S = [
      ['Laufen', 'Zieh den Stick unten links oder drück die Tasten W, A, S, D.', () => Math.hypot(run._pos.x - p0.x, run._pos.z - p0.z) > 1.2],
      ['Umsehen', 'Zieh mit dem Finger oder mit der Maus über das Bild. So dreht sich die Kamera.', () => Math.abs(run._stage.input.yaw - y0) > 0.3],
      ['Station finden', 'Geh zu einer leuchtenden Säule. Der Pfeil am Boden zeigt den Weg.', () => !$('act').hidden],
      ['Ansprechen', 'Tipp auf den Knopf unten rechts oder drück die Taste E.', () => !$('sheet').hidden || !$('note').hidden]
    ];
    const ende = () => { clearInterval(coachT); $('coach').hidden = true; CORE.setOpt('tut', true); };
    const zeige = () => { $('coach-n').textContent = 'Einführung · Schritt ' + (k + 1) + ' von ' + S.length + ' · ' + S[k][0]; $('coach-t').textContent = S[k][1]; };
    $('coach-x').hidden = false; $('coach-x').onclick = ende; zeige(); $('coach').hidden = false;
    coachT = setInterval(() => {
      if(!run || !run._pos) return ende(); if(!$('menu').hidden) return;
      while(k < S.length && S[k][2]()) k++;
      if(k >= S.length){ clearInterval(coachT); CORE.setOpt('tut', true); $('coach-n').textContent = 'Einführung beendet'; $('coach-t').textContent = 'Das war alles. Viel Erfolg.'; $('coach-x').hidden = true; coachT = setTimeout(() => { $('coach').hidden = true; }, 2200); }
      else zeige();
    }, 250);
    return true;
  }
  // Bildrate anzeigen (Einstellung): hilft, die Leistung auf dem eigenen Gerät einzuschätzen
  function fpsZeigen(){
    clearInterval(fpsT); const e = $('fps'), an = CORE.opt('fps') && !!run; e.hidden = !an; if(!an) return;
    let f0 = run.stage.frames(), t0 = performance.now(); e.textContent = '… Bilder/s';
    fpsT = setInterval(() => { if(!run) return; const f = run.stage.frames(), t = performance.now(); if($('menu').hidden) e.textContent = Math.round((f - f0) * 1000 / (t - t0)) + ' Bilder/s · Auflösung ×' + (Math.round(run.stage.pixelRatio() * 100) / 100) + ' · Effekte ' + run.stage.effekte(); f0 = f; t0 = t; }, 1000);
  }

  // Kurzes Aufleuchten am Bildrand: grün bei richtig, rot bei falsch
  function blitz(tries){ const b = $('blitz'); b.classList.toggle('gut', tries === 1); b.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => b.classList.remove('on'))); }
  // Geschosswechsel: kurz abblenden, umschalten, aufblenden
  function fade(fn){ const f = $('fade'); f.classList.add('on'); setTimeout(() => { fn(); f.classList.remove('on'); }, 170); }
  // Bildschirm bleibt beim Spielen an (wenn der Browser es erlaubt)
  let lock = null;
  function wake(on){ try{ if(on && navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { lock = l; }).catch(() => {}); else if(lock){ lock.release().catch(() => {}); lock = null; } }catch(e){} }

  /* ---------- Pausenmenü und Einstellungen ---------- */
  function menu(){
    if(!run || !$('sheet').hidden || !$('result').hidden) return;
    if(!$('menu').hidden) return resume();
    run.pause(true); FX.sprich('');
    $('o-ton').checked = CORE.opt('ton'); $('o-vib').checked = CORE.opt('vib'); $('o-qual').value = CORE.opt('qual'); $('o-sens').value = CORE.opt('sens');
    $('o-sprache').checked = CORE.opt('sprache'); $('o-karte').checked = CORE.opt('karte'); $('o-fx').value = CORE.opt('fx'); $('o-fps').checked = CORE.opt('fps'); $('m-tut').hidden = !run._pos;
    $('m-full').hidden = !document.documentElement.requestFullscreen; $('m-restart').hidden = modus !== 'mission';
    $('menu').hidden = false; $('m-resume').focus();
  }
  function resume(){ $('menu').hidden = true; if(run) run.pause(false); }
  const zurueck = () => { stop(); if(modus === 'mission') levels(); else home(); };
  $('btn-menu').onclick = menu; $('m-resume').onclick = resume;
  $('m-restart').onclick = () => { $('menu').hidden = true; play(lvl); };
  $('m-exit').onclick = () => { $('menu').hidden = true; zurueck(); };
  $('m-full').onclick = () => { try{ if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); }catch(e){} };
  $('o-ton').onchange = e => { CORE.setOpt('ton', e.target.checked); STAGE.audio.on = e.target.checked; if(e.target.checked) STAGE.sfx('ok'); };
  $('o-vib').onchange = e => CORE.setOpt('vib', e.target.checked);
  $('o-sprache').onchange = e => { CORE.setOpt('sprache', e.target.checked); FX.stimme.on = e.target.checked; if(!e.target.checked) FX.sprich(''); };
  $('o-karte').onchange = e => { CORE.setOpt('karte', e.target.checked); $('karte').hidden = !e.target.checked || (lauf && lauf.stufe === 'ernst'); };
  $('o-fps').onchange = e => { CORE.setOpt('fps', e.target.checked); fpsZeigen(); };
  $('m-tut').onclick = () => { CORE.setOpt('tut', false); resume(); coach(); };
  $('o-fx').onchange = e => { CORE.setOpt('fx', e.target.value); if(run) run.stage.setFx(e.target.value); };
  $('o-qual').onchange = e => { CORE.setOpt('qual', e.target.value); if(run) run.stage.setQuality(e.target.value); };
  $('o-sens').oninput = e => { const v = +e.target.value; CORE.setOpt('sens', v); if(run) run.stage.input.sens = v; };
  window.addEventListener('keydown', e => { if(e.key === 'Escape' && !$('menu').hidden){ e.stopImmediatePropagation(); resume(); } }, true);
  document.addEventListener('visibilitychange', () => { if(document.hidden && run && $('menu').hidden && $('sheet').hidden && $('result').hidden) menu(); else if(!document.hidden && run) wake(true); });
  $('nogl-ok').onclick = () => { $('nogl').hidden = true; zurueck(); };

  function stop(){ wake(false); clearInterval(uhr); clearInterval(qUhr); clearInterval(fpsT); clearInterval(coachT); clearTimeout(coachT); $('coach').hidden = true; $('fps').hidden = true; FX.sprich(''); $('menu').hidden = true; $('note').hidden = true; $('brief').hidden = true; $('rec').hidden = true; if(run){ run.dispose(); run = null; } if(qDone){ const f = qDone; qDone = null; f(null); } }

  /* ---------- Fragen ----------
     Wertung: erster Versuch 100 Punkte, zweiter 50, danach wird die Lösung gezeigt (in der Prüfung gibt es nur einen Versuch).
     mc = eine Antwort · multi = mehrere ankreuzen und prüfen · reihe = in der richtigen Reihenfolge antippen
     statement = vier von sechs Sätzen in sinnvoller Reihenfolge, gegen die Zeit · bausteine = je Feld einen Textbaustein wählen
     gespraech = Gespräch in mehreren Zügen mit Stimmungsanzeige · budget = Posten wählen, ohne den Betrag zu überschreiten
     entscheidung = eine Wahl, die gilt: jede Option hat einen Wert (2 richtig, 1 vertretbar, 0 falsch) und eine Folge
     stadt = Wachen auf dem Stadtmodell setzen (Erreichungsgrad und Budget) · karte = taktische Zeichen in die Lagekarte eintragen
     Stufe „Lernen“: Tipp-Knopf (mit Tipp zählt die Aufgabe höchstens halb) */
  let qDone = null, qUhr = 0;
  function schliesse(){ clearInterval(qUhr); $('sheet').hidden = true; $('rec').hidden = true; FX.sprich(''); }
  function ask(a, optionen, einmal, modell){
    return new Promise(res => {
      const typ = a.typ || 'mc', box = $('q-opts'), hint = $('q-hint'), check = $('q-check'), bild = $('q-bild'), MAX = einmal ? 1 : 2, tipp = $('q-tipp'), lernen = !!lauf && lauf.stufe === 'lernen';
      let tries = 0, fertig = false, folge = [], wahl = null, mitTipp = false;
      const P = person(a.wer); $('q-wer').hidden = !P; $('q-wer').innerHTML = P ? kopf(P) : ''; $('sheet').classList.toggle('dock', typ === 'stadt' && !!modell);
      tipp.hidden = true; tipp.onclick = null; box.onclick = null; check.onclick = null;
      qDone = res; $('tip').hidden = true; clearInterval(qUhr);
      $('q-title').textContent = a.frage; $('q-fb').hidden = true; $('q-close').hidden = false; check.hidden = true; check.disabled = false; check.textContent = 'Prüfen'; hint.hidden = true; hint.className = 'src';
      bild.hidden = !a.bild; bild.innerHTML = a.bild || '';                                   // Bilder stammen aus den eigenen Spieldaten (game/data)
      const hinweis = t => { hint.hidden = !t; hint.textContent = t || ''; };
      const nochmal = () => hinweis(einmal ? '' : 'Noch nicht richtig. Du hast einen weiteren Versuch.');
      // Abschluss: Lösung zeigen, Erklärung, Quelle und Link ins Kapitel
      const abschluss = text => {
        fertig = true; clearInterval(qUhr); $('rec').hidden = true; $('q-close').hidden = true; check.hidden = true; hint.hidden = true; tipp.hidden = true;
        box.querySelectorAll('.opt').forEach(b => { b.disabled = true; });
        $('q-fbt').textContent = text;
        $('q-src').textContent = 'Quelle: ' + a.quelle;
        const v = /\bv-[a-z0-9-]+/.exec(a.quelle || ''), m = CORE.MISSIONS.find(x => x.id === (a._m || mis.id)), ziel = v ? v[0] : m && m.kapitel, link = $('q-link');
        link.hidden = !ziel; if(ziel) link.href = '../index.html#' + ziel;
        $('q-fb').hidden = false; $('q-next').focus({ preventScroll:true });
      };
      const ende = (ok, loesung) => {
        if(!ok) tries = 3; const halb = ok && mitTipp && tries === 1; if(halb) tries = 2;
        abschluss((ok ? (halb ? 'Richtig, mit Tipp (halbe Punkte). ' : tries === 1 ? 'Richtig. ' : 'Richtig im zweiten Versuch. ') : (loesung ? loesung + ' ' : '')) + (a.erkl || ''));
      };
      const tippAn = fn => { if(!lernen) return; tipp.hidden = false; tipp.onclick = () => { mitTipp = true; tipp.hidden = true; fn(); }; };
      const urteil = (ok, loesung, neu) => { tries++; if(ok) return ende(true); if(tries >= MAX) return ende(false, loesung); nochmal(); if(neu) neu(); };

      if(typ === 'bausteine'){
        box.innerHTML = '<p class="fall">' + esc(a.fall) + '</p>' + a.felder.map((f, i) => '<div class="grp" data-f="' + i + '"><p class="grp-t">' + esc(f.name) + '</p>' + f.optionen.map((o, k) => '<button class="opt" data-k="' + k + '">' + esc(o) + '</button>').join('') + '</div>').join('');
        check.hidden = false; check.textContent = 'Stellungnahme abgeben';
        box.onclick = e => { const b = e.target.closest('.opt'); if(!b || b.disabled || fertig) return; b.parentNode.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === b)); b.parentNode.classList.remove('falsch'); };
        check.onclick = () => {
          const grp = [...box.querySelectorAll('.grp')], wahl = grp.map((g, i) => { const s = g.querySelector('.opt.sel'); return s ? a.felder[i].optionen[+s.dataset.k] : null; });
          if(wahl.includes(null)) return hinweis('Wähle für jedes Feld einen Baustein.');
          const falsch = wahl.map((w, i) => w !== a.felder[i].richtig);
          urteil(!falsch.includes(true), 'Die richtigen Bausteine sind markiert.', () => grp.forEach((g, i) => g.classList.toggle('falsch', falsch[i])));
          if(fertig) grp.forEach((g, i) => g.querySelectorAll('.opt').forEach(b => { const t = a.felder[i].optionen[+b.dataset.k]; b.classList.remove('sel'); if(t === a.felder[i].richtig) b.classList.add('yes'); else if(t === wahl[i]) b.classList.add('no'); }));
        };
      }
      else if(typ === 'gespraech'){
        let zug = 0, miss = 0, laune = 2;                 // Stimmung 0 (schlecht) bis 4 (gut)
        const meter = () => '<div class="stimmung"><span>Stimmung</span><div><i class="' + (laune >= 3 ? '' : laune === 2 ? 'mittel' : 'schlecht') + '" style="width:' + (10 + laune * 22.5) + '%"></i></div></div>';
        const zeige = () => {
          const z = a.zuege[zug];
          box.innerHTML = '<p class="fall">' + esc(a.lage) + '</p>' + meter() + '<p class="blase"><b>' + esc(a.rolle) + '</b>„' + esc(z.sagt) + '“</p>' + z.optionen.map((o, k) => '<button class="opt" data-k="' + k + '">„' + esc(o.t) + '“</button>').join('');
          FX.sprich(z.sagt);
        };
        box.onclick = e => {
          const b = e.target.closest('.opt'); if(!b || b.disabled || fertig) return;
          const z = a.zuege[zug], o = z.optionen[+b.dataset.k]; box.querySelectorAll('.opt').forEach(x => { x.disabled = true; if(z.optionen[+x.dataset.k].gut) x.classList.add('yes'); }); FX.sprich('');
          if(o.gut) laune = Math.min(4, laune + 1); else { b.classList.add('no'); miss++; laune = Math.max(0, laune - 1); STAGE.sfx('bad'); }
          box.querySelector('.stimmung').outerHTML = meter();
          box.insertAdjacentHTML('beforeend', '<p class="urteil ' + (o.gut ? 'gut' : 'schlecht') + '">' + esc(o.ich) + '.</p>');
          const letzter = zug === a.zuege.length - 1;
          if(letzter){ tries = miss === 0 ? 1 : miss === 1 ? 2 : 3; ende(miss <= 1, miss > 1 ? 'Das Gespräch ist entgleist.' : ''); if(miss === 1) $('q-fbt').textContent = 'Fast: eine Antwort hat das Gespräch gestört. ' + (a.erkl || ''); }
          else { check.hidden = false; check.textContent = 'Weiter im Gespräch'; check.onclick = () => { check.hidden = true; zug++; zeige(); }; }
        };
        zeige();
      }
      else if(typ === 'budget'){
        const eur = v => fmt(v) + ' T€';
        box.innerHTML = '<p class="fall">' + esc(a.fall) + '</p>' + a.posten.map((p, i) => '<button class="opt" data-i="' + i + '"><span class="kosten">' + eur(p.kosten) + '</span>' + esc(p.t) + '</button>').join('') + '<p class="summe" id="q-sum"></p>';
        const btns = [...box.querySelectorAll('.opt')], sum = () => btns.filter(b => b.classList.contains('sel')).reduce((s, b) => s + a.posten[+b.dataset.i].kosten, 0);
        const zeige = () => { const s = sum(), e = $('q-sum'); e.innerHTML = '<span>Gewählt: ' + eur(s) + '</span><span>Freigegeben: ' + eur(a.budget) + '</span>'; e.classList.toggle('ueber', s > a.budget); check.disabled = s > a.budget || s === 0; };
        check.hidden = false; check.textContent = 'Anmelden'; zeige();
        box.onclick = e => { const b = e.target.closest('.opt'); if(!b || b.disabled || fertig) return; b.classList.toggle('sel'); zeige(); };
        check.onclick = () => {
          const sel = btns.filter(b => b.classList.contains('sel')).map(b => a.posten[+b.dataset.i].t);
          urteil(sel.length === a.richtig.length && sel.every(x => a.richtig.includes(x)), 'Die richtige Auswahl ist markiert.');
          if(fertig) btns.forEach(b => { const t = a.posten[+b.dataset.i].t, r = a.richtig.includes(t); if(r) b.classList.add('yes'); else if(b.classList.contains('sel')) b.classList.add('no'); b.classList.remove('sel'); });
        };
      }
      else if(typ === 'entscheidung'){
        const opts = a.optionen.slice(); for(let i = opts.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)), t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
        const beste = a.optionen.find(o => o.wert === 2);
        box.innerHTML = opts.map((o, k) => '<button class="opt" data-k="' + k + '">' + esc(o.t) + '</button>').join('');
        hinweis('Deine Wahl gilt sofort und hat Folgen.'); FX.sprich(a.frage, P && P.stimme);
        tippAn(() => { const b = [...box.querySelectorAll('.opt')].find(x => opts[+x.dataset.k].wert === 0); if(b){ b.disabled = true; b.classList.add('weg'); } hinweis('Tipp: Eine falsche Möglichkeit ist gestrichen.'); });
        box.onclick = e => {
          const b = e.target.closest('.opt'); if(!b || b.disabled || fertig) return;
          const o = opts[+b.dataset.k]; wahl = o; tries = o.wert === 2 ? (mitTipp ? 2 : 1) : o.wert === 1 ? 2 : 3; FX.sprich('');
          box.querySelectorAll('.opt').forEach(x => { if(opts[+x.dataset.k] === beste) x.classList.add('yes'); });
          if(o.wert === 1) b.classList.add('halb'); else if(o.wert === 0) b.classList.add('no');
          const satz = P && o.wert !== 1 ? (o.wert === 2 ? P.gut : P.schlecht) : null;
          if(satz && satz.length){ const t = satz[Math.floor(Math.random() * satz.length)]; box.insertAdjacentHTML('beforeend', '<p class="blase"><b>' + esc(P.name) + '</b>„' + esc(t) + '“</p>'); FX.sprich(t, P.stimme); }
          abschluss((o.wert === 2 ? (mitTipp ? 'Gute Entscheidung, mit Tipp (halbe Punkte). ' : 'Gute Entscheidung. ') : o.wert === 1 ? 'Vertretbar, aber nicht die beste Wahl. ' : 'Das war die falsche Entscheidung. ') + (o.folge || '') + (o.wert < 2 ? ' Besser wäre: ' + beste.t.replace(/\.$/, '') + '.' : '') + ' ' + (a.erkl || ''));
        };
      }
      else if(typ === 'stadt'){
        const eur = v => fmt(v) + ' T€', sel = [], gew = a.orte.reduce((x, o) => x + o.gewicht, 0);
        const nah = (p, o) => Math.hypot(p.x - o.x, p.y - o.y) <= a.radius, deckung = s => a.orte.map(o => (a.bestand || []).some(p => nah(p, o)) || s.some(i => nah(a.standorte[i], o)));
        const quote = s => { const d = deckung(s); return Math.round(a.orte.reduce((x, o, i) => x + (d[i] ? o.gewicht : 0), 0) / gew * 100); };
        const kosten = s => s.reduce((x, i) => x + a.standorte[i].kosten, 0), passt = s => quote(s) >= a.ziel && kosten(s) <= a.budget;
        // günstigste Lösung, die das Ziel erreicht (alle Kombinationen durchprobieren; es sind nur wenige Standorte)
        const loesung = () => { let b = null; for(let m = 0; m < (1 << a.standorte.length); m++){ const s = a.standorte.map((x, i) => i).filter(i => m >> i & 1); if(passt(s) && (!b || kosten(s) < kosten(b))) b = s; } return b || []; };
        box.innerHTML = '<p class="fall">' + esc(a.fall) + '</p>' + a.standorte.map((p, i) => '<button class="opt" data-i="' + i + '" aria-pressed="false"><span class="kosten">' + eur(p.kosten) + '</span>Standort ' + esc(p.n) + ': ' + esc(p.t) + '</button>').join('') + '<p class="summe" id="q-sum"></p>';
        const btns = [...box.querySelectorAll('.opt')];
        const zeige = () => { const q = quote(sel), k = kosten(sel), e = $('q-sum'); btns.forEach((b, i) => { b.classList.toggle('sel', sel.includes(i)); b.setAttribute('aria-pressed', sel.includes(i)); });
          e.innerHTML = '<span>Erreicht: ' + q + ' % (Ziel ' + a.ziel + ' %)</span><span>Kosten: ' + eur(k) + ' von ' + eur(a.budget) + '</span>'; e.classList.toggle('ueber', k > a.budget); check.disabled = !sel.length; if(modell) modell.zeige(sel, deckung(sel)); };
        const schalte = i => { if(fertig) return; const k = sel.indexOf(i); if(k >= 0) sel.splice(k, 1); else sel.push(i); STAGE.sfx('step'); zeige(); };
        hinweis(modell ? 'Tippe im Stadtmodell oder in der Liste auf einen Standort, um dort eine Wache zu setzen. Der grüne Kreis zeigt, was sie in der Hilfsfrist erreicht.' : 'Wähle die Standorte für neue Wachen.');
        check.hidden = false; check.textContent = 'Planung vorlegen'; zeige(); if(modell) modell.onTap = schalte;
        box.onclick = e => { const b = e.target.closest('.opt'); if(b && !b.disabled) schalte(+b.dataset.i); };
        check.onclick = () => {
          const ok = passt(sel), b = loesung();
          urteil(ok, 'Eine Lösung im Budget: ' + b.map(i => 'Standort ' + a.standorte[i].n).join(' und ') + '.', () => hinweis(kosten(sel) > a.budget ? 'Das Budget ist überschritten. Du hast einen weiteren Versuch.' : 'Der Erreichungsgrad liegt unter dem Ziel. Du hast einen weiteren Versuch.'));
          if(fertig && !ok){ sel.length = 0; b.forEach(i => sel.push(i)); zeige(); }
        };
      }
      else if(typ === 'karte'){
        let hand = null; const liegt = a.plaetze.map(() => null), Z = id => a.zeichen.find(z => z.id === id);
        const zsvg = (z, k) => '<svg class="lk-z" viewBox="-16 -16 32 32" width="' + k + '" height="' + k + '" aria-hidden="true">' + z.svg + '</svg>';
        box.innerHTML = '<p class="fall">' + esc(a.fall) + '</p><div class="lk"><svg viewBox="0 0 320 200" role="img" aria-label="Lagekarte mit ' + a.plaetze.length + ' nummerierten Plätzen">' + a.plan
          + a.plaetze.map((p, i) => '<g class="lk-p" data-p="' + i + '" transform="translate(' + p.x + ' ' + p.y + ')"><circle r="15"/><text y="5" text-anchor="middle">' + (i + 1) + '</text><g class="lk-in"></g></g>').join('') + '</svg></div>'
          + '<div class="lk-l">' + a.plaetze.map((p, i) => '<button class="opt lk-pb" data-p="' + i + '"><b>' + (i + 1) + '</b><span>' + esc(p.t) + '</span><i></i></button>').join('') + '</div>'
          + '<p class="grp-t lk-tt">Zeichen</p><div class="lk-tray">' + a.zeichen.map(z => '<button class="opt lk-t" data-z="' + z.id + '" aria-pressed="false">' + zsvg(z, 34) + '<span>' + esc(z.n) + '</span></button>').join('') + '</div>';
        hinweis('Wähle unten ein Zeichen und tippe dann auf den Platz in der Karte oder in der Liste. Ein Zeichen kann mehrmals vorkommen.');
        const male = () => a.plaetze.forEach((p, i) => { const z = liegt[i] && Z(liegt[i]), g = box.querySelector('.lk-p[data-p="' + i + '"]'), b = box.querySelector('.lk-pb[data-p="' + i + '"]');
          g.classList.toggle('voll', !!z); g.querySelector('.lk-in').innerHTML = z ? z.svg : ''; b.querySelector('i').innerHTML = z ? zsvg(z, 26) : ''; b.setAttribute('aria-label', (i + 1) + ': ' + p.t + (z ? ', eingetragen: ' + z.n : ', noch leer')); });
        male(); check.hidden = false; check.textContent = 'Lagekarte prüfen';
        box.onclick = e => {
          if(fertig) return; const t = e.target.closest('.lk-t'), p = e.target.closest('[data-p]');
          if(t){ hand = t.dataset.z; box.querySelectorAll('.lk-t').forEach(x => { x.classList.toggle('sel', x === t); x.setAttribute('aria-pressed', x === t); }); return; }
          if(p){ const i = +p.dataset.p; if(!hand) return hinweis('Wähle zuerst unten ein Zeichen.'); liegt[i] = hand; box.querySelectorAll('[data-p="' + i + '"]').forEach(x => x.classList.remove('falsch')); STAGE.sfx('step'); male(); }
        };
        check.onclick = () => {
          if(liegt.includes(null)) return hinweis('Trage für jeden Platz ein Zeichen ein.');
          const falsch = liegt.map((z, i) => z !== a.plaetze[i].richtig);
          urteil(!falsch.includes(true), 'Die richtigen Zeichen sind jetzt eingetragen.', () => falsch.forEach((f, i) => box.querySelectorAll('[data-p="' + i + '"]').forEach(x => x.classList.toggle('falsch', f))));
          if(fertig){ a.plaetze.forEach((p, i) => { box.querySelectorAll('[data-p="' + i + '"]').forEach(x => { x.classList.remove('falsch'); x.classList.add(falsch[i] ? 'neu' : 'gut'); }); liegt[i] = p.richtig; }); male(); }
        };
      }
      else {
        const stm = typ === 'statement', voll = stm ? a.richtig.length : optionen.length;
        if(typ === 'multi') hinweis('Mehrere Antworten können richtig sein. Wähle alle richtigen und tippe auf „Prüfen“.');
        else if(typ === 'reihe') hinweis('Tippe die Antworten in der richtigen Reihenfolge an.');
        check.hidden = typ !== 'multi';
        box.innerHTML = (stm ? '<div class="zeitb"><i id="q-zeit"></i></div>' : '') + optionen.map((o, i) => '<button class="opt" data-i="' + i + '">' + esc(o) + '</button>').join('');
        const btns = [...box.querySelectorAll('.opt')], text = b => optionen[+b.dataset.i];
        const zeichne = () => btns.forEach(b => { const k = folge.indexOf(+b.dataset.i); b.textContent = (k >= 0 ? (k + 1) + '. ' : '') + text(b); b.classList.toggle('sel', k >= 0); });
        const loese = () => {
          if(typ === 'mc') btns.forEach(b => { if(text(b) === a.richtig) b.classList.add('yes'); });
          else if(typ === 'multi') btns.forEach(b => { const r = a.richtig.includes(text(b)); if(r) b.classList.add('yes'); else if(b.classList.contains('sel')) b.classList.add('no'); b.classList.remove('sel'); });
          else box.innerHTML = a.richtig.map((o, i) => '<button class="opt yes" disabled>' + (i + 1) + '. ' + esc(o) + '</button>').join('');
        };
        const los = typ === 'mc' ? 'Richtig wäre: ' + a.richtig + '.' : typ === 'multi' ? 'Richtig wäre: ' + a.richtig.join('; ') + '.' : 'Die richtige Reihenfolge steht oben.';
        const werte = ok => { urteil(ok, los, () => { folge = []; if(typ !== 'multi') zeichne(); if(stm && !lernen) takt(); }); if(fertig) loese(); };
        // Statement: Aufnahme läuft, die Zeit ist knapp; läuft sie ab, zählt das als Fehlversuch
        let rest = 0;
        const takt = () => { rest = a.zeit; clearInterval(qUhr); const bar = $('q-zeit'); bar.style.width = '100%'; bar.className = '';
          qUhr = setInterval(() => { if(!$('menu').hidden || document.hidden) return; rest--; bar.style.width = Math.max(0, rest / a.zeit * 100) + '%'; bar.className = rest <= 15 ? 'knapp' : ''; if(rest <= 0){ clearInterval(qUhr); STAGE.sfx('bad'); werte(false); if(!fertig) hinweis('Die Zeit ist um. Du hast einen weiteren Versuch.'); } }, 1000); };
        if(stm){ $('rec').hidden = false; if(lernen) $('q-zeit').parentNode.hidden = true; else takt(); }
        if(typ === 'mc') tippAn(() => { btns.filter(b => text(b) !== a.richtig && !b.disabled).slice(0, Math.max(1, btns.length - 2)).forEach(b => { b.disabled = true; b.classList.add('weg'); }); hinweis('Tipp: Es bleiben zwei Möglichkeiten.'); });
        else if(typ === 'multi') tippAn(() => hinweis('Tipp: ' + a.richtig.length + ' Antworten sind richtig.'));
        else tippAn(() => hinweis('Tipp: Am Anfang steht „' + a.richtig[0] + '“.'));
        box.onclick = e => {
          const b = e.target.closest('.opt'); if(!b || b.disabled || fertig) return;
          if(typ === 'mc'){ if(text(b) === a.richtig){ tries++; ende(true); loese(); } else { b.classList.add('no'); b.disabled = true; werte(false); } }
          else if(typ === 'multi') b.classList.toggle('sel');
          else {
            const i = +b.dataset.i, k = folge.indexOf(i); if(k >= 0) folge = folge.slice(0, k); else folge.push(i);
            zeichne(); if(folge.length === voll) werte(folge.every((x, n) => optionen[x] === a.richtig[n]));
          }
        };
        check.onclick = () => {
          const sel = btns.filter(b => b.classList.contains('sel')).map(text); if(!sel.length) return;
          werte(sel.length === a.richtig.length && sel.every(x => a.richtig.includes(x)));
        };
      }
      const close = v => { schliesse(); qDone = null; res(v); };
      $('q-next').onclick = () => close({ tries, wahl, dann:wahl && wahl.dann });
      $('q-close').onclick = () => close(null);
      $('sheet').hidden = false; $('sheet').scrollTop = 0;
    });
  }

  /* ---------- Auswertung ---------- */
  function result(st, zeitAus){
    if(run) run.pause(true);
    const L = data.level[lvl], liste = $('r-liste'); let neu = [], ok = true, last = true;
    liste.hidden = true; $('r-story').textContent = ''; $('r-again').hidden = false; $('r-sum').hidden = true; clearInterval(coachT); $('coach').hidden = true;
    if(modus === 'mission'){
      const stand = st.lage === null ? '' : st.lage >= 70 ? 'gut' : st.lage >= 40 ? 'mittel' : 'schlecht';
      const r = CORE.finish(mis.id, lvl, st.pts, st.max, st.fehler, { ernst:st.stufe === 'ernst', gut:stand === 'gut' }); neu = r.neu; ok = r.ok; last = lvl + 1 >= data.level.length;
      $('r-kick').textContent = 'Level ' + (lvl + 1) + ' · ' + L.titel;
      $('r-title').textContent = ok ? (st.fehler === 0 ? 'Fehlerfrei bestanden' : 'Bestanden') : 'Noch nicht bestanden';
      if(L.ende) $('r-story').textContent = stand ? L.lage.name + ': ' + st.lage + ' von 100. ' + (L.ende[stand] || L.ende.schlecht) : ok ? L.ende.gut : L.ende.schlecht;
      $('r-note').textContent = ok
        ? (r.rekord ? 'Neuer Bestwert. ' : '') + (last ? 'Das war das letzte Level dieser Mission.' : 'Das nächste Level ist frei.')
        : (zeitAus ? 'Die Zeit ist abgelaufen. ' : '') + 'Zum Bestehen brauchst du ' + fmt(Math.ceil(st.max * CORE.PASS)) + ' Punkte. Was nicht im ersten Versuch saß, wartet in der Wiederholung auf dich.';
    } else if(modus === 'wdh'){
      neu = CORE.trainiert(); const n = L.aufgaben.length, gut = n - st.fehler;
      $('r-kick').textContent = 'Training'; $('r-title').textContent = 'Wiederholung beendet';
      $('r-note').textContent = gut + ' von ' + n + ' im ersten Versuch gekonnt. Gekonntes kommt in größerem Abstand wieder, der Rest ist sofort wieder fällig.';
      $('r-again').hidden = true;
    } else {
      const n = L.aufgaben.length, gut = n - st.fehler, p = Math.round(gut / n * 100), note = p >= 92 ? 1 : p >= 81 ? 2 : p >= 67 ? 3 : p >= 50 ? 4 : p >= 30 ? 5 : 6;
      const wort = ['sehr gut', 'gut', 'befriedigend', 'ausreichend', 'mangelhaft', 'ungenügend'][note - 1], r = CORE.pruefung(p, Math.round((Date.now() - st.t0) / 1000), note); neu = r.neu; ok = note <= 4;
      $('r-kick').textContent = 'Prüfung'; $('r-title').textContent = 'Note ' + note + ' (' + wort + ')';
      $('r-note').textContent = (zeitAus ? 'Die Zeit ist abgelaufen. ' : '') + gut + ' von ' + n + ' richtig, das sind ' + p + ' %.' + (r.rekord ? ' Neuer Bestwert.' : '') + ' Notenschlüssel des Spiels: ab 92 % Note 1, ab 81 % Note 2, ab 67 % Note 3, ab 50 % Note 4.';
    }
    nachbesprechung(st, L);
    if(ok) STAGE.sfx('win');
    $('r-pts').textContent = fmt(st.pts); $('r-max').textContent = fmt(st.max);
    $('r-next').hidden = modus !== 'mission' || !ok || last;
    $('st-total').textContent = fmt(CORE.total()); $('st-serie').textContent = CORE.serie();
    $('result').hidden = false;
  }
  /* Nachbesprechung: was gut war, was fehlte, mit Lösung, Begründung und Link ins Kapitel.
     Im Einsatz stehen alle Entscheidungen in ihrer Reihenfolge, sonst nur, was nicht im ersten Versuch saß. */
  function loesungText(a){
    if(a.typ === 'entscheidung') return (a.optionen.find(o => o.wert === 2) || {}).t || '';
    if(a.typ === 'bausteine') return a.felder.map(f => f.richtig).join(' · ');
    if(a.typ === 'bringen') return a.erkl || '';
    if(a.typ === 'karte') return a.plaetze.map((p, i) => (i + 1) + ': ' + (a.zeichen.find(z => z.id === p.richtig) || {}).n).join(' · ');
    if(Array.isArray(a.richtig)) return a.richtig.join(a.typ === 'reihe' || a.typ === 'statement' ? ' → ' : '; ');
    return a.richtig || '';
  }
  function nachbesprechung(st, L){
    const log = st.log || [], n1 = log.filter(e => !e.frei && e.tries === 1).length, n2 = log.filter(e => !e.frei && e.tries === 2).length, n3 = log.filter(e => !e.frei && e.tries > 2).length;
    if(!log.length) return;
    const sum = $('r-sum'); sum.hidden = false;
    sum.textContent = L.szenario ? 'Nachbesprechung: ' + n1 + ' gute Entscheidungen, ' + n2 + ' vertretbare, ' + n3 + ' falsche oder verpasste.' : 'Nachbesprechung: ' + n1 + ' im ersten Versuch, ' + n2 + ' im zweiten, ' + n3 + ' nicht gelöst.';
    const kurz = t => { t = String(t || ''); return t.length > 150 ? t.slice(0, 147) + '…' : t; };
    const zeigen = L.szenario ? log : log.filter(e => e.tries > 1); if(!zeigen.length) return;
    $('r-liste').hidden = false;
    $('r-liste').innerHTML = zeigen.map(e => {
      const a = e.a, art = e.tries === 1 ? 'gut' : e.tries === 2 ? 'halb' : 'schlecht', v = /\bv-[a-z0-9-]+/.exec(a.quelle || ''), m = CORE.MISSIONS.find(x => x.id === (a._m || mis.id)), ziel = v ? v[0] : m && m.kapitel, lsg = loesungText(a);
      const wort = e.res && e.res.verpasst ? 'Frist verpasst' : a.typ === 'entscheidung' ? (e.tries === 1 ? 'Gut entschieden' : e.tries === 2 ? 'Vertretbar' : 'Falsch entschieden') : e.tries === 1 ? 'Richtig' : e.tries === 2 ? 'Im zweiten Versuch' : 'Nicht gelöst';
      return '<li class="' + art + '"><span class="r-w">' + wort + (e.frei ? ' · Folge deiner Wahl' : a.phase ? ' · ' + esc(a.phase) : '') + '</span><b>' + esc(kurz(a.frage)) + '</b>'
        + (e.res && e.res.wahl ? '<span>Deine Wahl: ' + esc(e.res.wahl.t) + '</span>' : '')
        + (e.tries > 1 && lsg ? '<span>Richtig: ' + esc(lsg) + '</span>' : '')
        + (e.tries > 1 && a.erkl && a.typ !== 'bringen' ? '<span>' + esc(a.erkl) + '</span>' : '')
        + (e.tries > 1 && ziel ? '<a href="../index.html#' + ziel + '" target="_blank" rel="noopener">Im Kapitel nachlesen</a>' : '') + '</li>';
    }).join('');
  }
  $('r-again').onclick = () => { if(modus === 'pruefung'){ stop(); training('pruefung'); } else play(lvl); };
  $('r-next').onclick = () => play(lvl + 1);
  $('r-list').onclick = zurueck;

  $('btn-back').onclick = () => { if(screen === 'play') zurueck(); else if(screen === 'home') location.href = '../index.html' + (VON ? '#' + VON : ''); else home(); };
  home();
  // Aus der Lern-App direkt in eine Mission springen: ?m=<Mission>&von=<Ansicht der App>
  if(PAR.get('m')) mission(PAR.get('m'));
  // Offline: denselben Service Worker wie die Lern-App nutzen
  if('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('../sw.js').catch(() => {});
})();
