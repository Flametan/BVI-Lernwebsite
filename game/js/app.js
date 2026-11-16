/* IdF-Spiel – Oberfläche: Startbildschirm mit Training, Levelwahl, Spielansicht mit Auftrag, Fragen in mehreren Arten,
   Auswertung, Wiederholung, Prüfung und Bestenliste. */
(function(){
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const fmt = n => n.toLocaleString('de-DE');
  const PAR = new URLSearchParams(location.search), VON = /^v-[a-z0-9-]+$/.test(PAR.get('von') || '') ? PAR.get('von') : null;
  let screen = 'home', mis = null, data = null, lvl = 0, run = null, tipT = 0, uhr = 0, modus = 'mission';
  const SG = ['S1 Personal', 'S2 Lage', 'S3 Einsatz', 'S4 Versorgung', 'S5 Presse', 'S6 IuK'];
  const TRAIN = { wdh:{ id:'wdh', thema:'Training', titel:'Wiederholung', welt:true }, pruefung:{ id:'pruefung', thema:'Training', titel:'Prüfung', welt:true } };

  function show(name){
    screen = name;
    ['home', 'levels', 'play', 'rang'].forEach(s => { $(s).hidden = s !== name; });
    $('btn-back').hidden = name === 'home'; $('btn-menu').hidden = name !== 'play';
    $('top-kick').textContent = name === 'home' ? 'IdF Münster' : name === 'rang' ? 'Training' : mis.thema;
    $('top-title').textContent = name === 'home' ? 'IdF-Spiel' : name === 'rang' ? 'Bestenliste' : name === 'levels' ? mis.titel : modus === 'mission' ? 'Level ' + (lvl + 1) + ' · ' + data.level[lvl].titel : mis.titel;
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
  function home(){
    const d = $('daily'), done = CORE.dailyDone();
    d.className = 'daily' + (done ? ' done' : '');
    d.textContent = done ? 'Tagesziel geschafft. Serie: ' + CORE.serie() + (CORE.serie() === 1 ? ' Tag.' : ' Tage.') : 'Tagesziel: Spiele heute ein Level, eine Wiederholung oder eine Prüfung.';
    const f = CORE.faellig().length, w = CORE.woche(), pb = CORE.pruefBest();
    $('training').innerHTML =
      '<button class="card" data-t="wdh"' + (f ? '' : ' disabled') + '><span class="kick">Fehler aufholen</span><h3>Wiederholung</h3><p>' + (f ? (f === 1 ? 'Eine Aufgabe ist fällig.' : f + ' Aufgaben sind fällig.') + ' Was du kannst, kommt in größerem Abstand wieder.' : 'Nichts fällig. Aufgaben, die du in einem Level falsch löst, landen hier.') + '</p><div class="meta"><span>' + (f ? 'Bis zu 10 Aufgaben' : '') + '</span></div></button>'
      + '<button class="card" data-t="pruefung"><span class="kick">Alle Themen</span><h3>Prüfung</h3><p>20 gemischte Fragen, 15 Minuten, ein Versuch je Frage. Am Ende gibt es eine Note.</p><div class="meta"><span>' + (pb ? 'Bestwert ' + pb + ' %' : 'Noch nicht abgelegt') + '</span></div></button>'
      + '<div class="card info-c"><span class="kick">Wochenaufgabe</span><h3>' + esc(w.mission.titel) + '</h3><p>Bestehe in dieser Woche drei Level dieser Mission.</p><div class="wbar"><i style="width:' + Math.round(Math.min(1, w.n / w.ziel) * 100) + '%"></i></div><div class="meta"><span>' + Math.min(w.n, w.ziel) + ' / ' + w.ziel + (w.n >= w.ziel ? ' · geschafft' : '') + '</span></div></div>'
      + '<button class="card" data-t="rang"><span class="kick">Auf diesem Gerät</span><h3>Bestenliste</h3><p>Die besten Läufe in den Leveln und in der Prüfung.</p><div class="meta"><span></span></div></button>';
    $('missions').innerHTML = CORE.MISSIONS.map(m => {
      const p = CORE.passed(m.id);
      return '<button class="card" data-m="' + m.id + '"' + (m.bereit ? '' : ' disabled') + '>'
        + '<span class="kick">' + esc(m.thema) + '</span><h3>' + esc(m.titel) + '</h3><p>' + esc(m.text) + '</p>'
        + '<div class="bar"><i style="width:' + Math.round(p / m.levels * 100) + '%"></i></div><div class="meta"><span>Level ' + p + ' / ' + m.levels + '</span><span>Bestwert ' + fmt(CORE.best(m.id)) + '</span></div>'
        + '</button>';
    }).join('');
    const have = CORE.badges();
    $('badges').innerHTML = Object.keys(CORE.BADGES).map(k => badge(k, have.includes(k))).join('');
    if(VON){ $('app-link').href = '../index.html#' + VON; $('app-link').textContent = VON === 'v-pause' ? 'Zurück zum Pausenraum' : 'Zurück zum Kapitel in der Lern-App'; }
    modus = 'mission'; show('home');
  }
  function badge(k, on){ const b = CORE.BADGES[k]; return '<div class="badge' + (on ? ' on' : '') + '"><b>' + esc(b.titel) + '</b>' + esc(b.text) + '</div>'; }

  async function mission(id){
    const m = CORE.MISSIONS.find(x => x.id === id); if(!m) return;
    try{ const [d] = await Promise.all([lade(m.id), script('js/m-' + (m.welt ? 'welt' : m.id) + '.js')]); mis = m; data = d; modus = 'mission'; levels(); }catch(err){ fehler(); }
  }
  $('missions').addEventListener('click', e => { const c = e.target.closest('.card'); if(c && !c.disabled) mission(c.dataset.m); });
  $('training').addEventListener('click', e => {
    const c = e.target.closest('button.card'); if(!c || c.disabled) return;
    if(c.dataset.t === 'rang') rang(); else training(c.dataset.t);
  });

  /* ---------- Training: Wiederholung fälliger Aufgaben, Prüfung über alle Themen ---------- */
  async function training(art){
    try{
      const ids = CORE.MISSIONS.map(m => m.id), alle = await Promise.all(ids.map(lade)); await script('js/m-welt.js');
      let aufgaben = [], L;
      if(art === 'wdh'){
        CORE.faellig().forEach(e => {
          const d = DATEN[e.m], lv = d && d.level[e.l], a = lv && lv.aufgaben.find(x => x.frage === e.f);
          if(a) aufgaben.push(wandle(e.m, d, e.l, a)); else CORE.vergiss(e.m, e.l, e.f);          // Aufgabe gibt es nicht mehr
        });
        aufgaben = aufgaben.slice(0, 10); if(!aufgaben.length) return home();
        L = { titel:'Wiederholung', steckbrief:'Diese Aufgaben hast du zuletzt nicht im ersten Versuch gelöst.', aufgaben, licht:'morgen',
          auftrag:{ wer:'Tutorin', text:'Schön, dass du dranbleibst. Hier warten die Aufgaben, bei denen es zuletzt gehakt hat. Was du heute kannst, lasse ich länger ruhen.' } };
      } else {
        const pool = []; ids.forEach((m, i) => alle[i].level.forEach((lv, l) => lv.aufgaben.forEach(a => { const o = wandle(m, alle[i], l, a); if(['mc', 'multi', 'reihe'].includes(o.typ)) pool.push(o); })));
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
        + '<span class="no">' + (i + 1) + '</span><span class="lt"><b>' + esc(L.titel) + '</b><span>' + (open ? esc(L.steckbrief) : 'Wird frei, wenn Level ' + i + ' bestanden ist.') + '</span></span>'
        + '<span class="pt">' + (r ? fmt(r.best) + ' P.' : '') + '</span></button>';
    }).join('');
    show('levels');
  }
  $('lv-list').addEventListener('click', e => { const b = e.target.closest('.lv'); if(b && !b.disabled) play(+b.dataset.l); });

  /* ---------- Spielen ---------- */
  function play(i){
    lvl = i; stop();
    const L = data.level[i], n = L.aufgaben.length;
    const st = { pts:0, done:0, combo:0, fehler:0, max:n * 100, falsch:[], t0:Date.now(), rest:L.zeit || 0 };
    $('hud-s').textContent = L.steckbrief; $('result').hidden = true; $('sheet').hidden = true; $('note').hidden = true; $('rec').hidden = true;
    $('tip').textContent = 'Lauf mit dem Stick oder mit WASD zu einer Leuchtsäule und drück den Knopf oder die Taste E. Ziehen dreht die Kamera.' + (mis.welt ? '' : ' Über die Treppe kommst du in die anderen Geschosse.');
    $('tip').hidden = true; clearTimeout(tipT);
    show('play');
    const hud = () => {
      $('hud-prog').textContent = st.done + ' / ' + n; $('hud-pts').textContent = fmt(st.pts);
      $('hud-combo').hidden = st.combo < 3; $('hud-combo').textContent = 'Serie ×' + st.combo;
    };
    hud();
    STAGE.audio.on = CORE.opt('ton'); FX.stimme.on = CORE.opt('sprache');
    // Zeitdruck: läuft, solange gespielt wird (nicht im Menü und nicht während des Auftrags); bei null zählen die offenen Aufgaben als falsch
    clearInterval(uhr);
    const zeit = () => { const e = $('hud-time'), r = st.rest; e.hidden = !L.zeit; if(L.zeit){ e.textContent = Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0'); e.classList.toggle('knapp', r <= 30); } };
    zeit();
    if(L.zeit) uhr = setInterval(() => {
      if(!run || !$('menu').hidden || !$('result').hidden || !$('brief').hidden || document.hidden) return;
      st.rest--; zeit(); if(st.rest > 0) return;
      clearInterval(uhr); if(qDone){ const f = qDone; qDone = null; schliesse(); f(null); }
      st.fehler += n - st.done; st.done = n; st.combo = 0; hud(); STAGE.sfx('bad'); result(st, true);
    }, 1000);
    const karte = $('karte'), zeichne = FX.minikarte(karte); karte.hidden = !CORE.opt('karte');
    try{ run = (window.MISSIONS[mis.id] || window.MISSIONS.welt).start({
      canvas: $('stage'), level: L, welt: data.welt, licht: L.licht, fx: CORE.opt('fx'),
      note: t => { $('note').hidden = !t; $('note').textContent = t || ''; if(t) $('tip').hidden = true; }, ui: { joy:$('joy'), act:$('act'), up:$('up'), down:$('down'), info:$('info') },
      karte: (b, boxes, punkte, ich) => { if(!karte.hidden) zeichne(b, boxes, punkte, ich); },
      ask: (a, ort) => ask(a, a.optionen || (data.optionen && data.optionen[a.opt]), L.pruefung),
      count(tries, a){
        st.done++;
        if(tries === 1){ st.combo++; st.pts += 100 + (st.combo >= 3 && !L.pruefung ? 20 : 0); }
        else { st.combo = 0; st.fehler++; if(tries === 2) st.pts += 50; if(a) st.falsch.push(a); }
        STAGE.sfx(tries === 1 ? 'ok' : tries === 2 ? 'halb' : 'bad');
        if(tries > 1 && CORE.opt('vib') && navigator.vibrate) navigator.vibrate(tries === 2 ? 40 : [60, 50, 60]);
        blitz(tries);
        // Wiederholung: Fehler vormerken; in der Wiederholung selbst rückt Gekonntes weiter nach hinten
        if(a){ const m = a._m || mis.id, l = a._m ? a._l : lvl, f = a._f || a.frage; if(tries > 1) CORE.merke(m, l, f); else if(modus === 'wdh') CORE.gekonnt(m, l, f); }
        hud();
      },
      finish(){ clearInterval(uhr); setTimeout(() => result(st), 900); },
      menu, fade
    }); }catch(e){ console.warn('3D-Start fehlgeschlagen', e); run = null; $('nogl').hidden = false; return; }
    run.stage.setQuality(CORE.opt('qual')); run.stage.input.sens = CORE.opt('sens');
    wake(true); auftrag(L);
    window.GAME_RUN = run;                               // für die automatische Prüfung (game/tests)
  }
  // Auftrag: Wer spricht und worum geht es. Die Kamera fliegt währenddessen heran; gespielt wird nach „Los geht’s“
  function auftrag(L){
    const los = () => { $('brief').hidden = true; FX.sprich(''); if(run && run.halt) run.halt(false); $('tip').hidden = false; clearTimeout(tipT); tipT = setTimeout(() => { $('tip').hidden = true; }, 9000); };
    if(!L.auftrag) return los();
    $('brief-wer').textContent = L.auftrag.wer; $('brief-text').textContent = L.auftrag.text; $('brief').hidden = false; $('brief-ok').onclick = los;
    if(run.halt) run.halt(true); FX.sprich(L.auftrag.text); $('brief-ok').focus({ preventScroll:true });
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
    $('o-sprache').checked = CORE.opt('sprache'); $('o-karte').checked = CORE.opt('karte'); $('o-fx').value = CORE.opt('fx');
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
  $('o-karte').onchange = e => { CORE.setOpt('karte', e.target.checked); $('karte').hidden = !e.target.checked; };
  $('o-fx').onchange = e => { CORE.setOpt('fx', e.target.value); if(run) run.stage.setFx(e.target.value); };
  $('o-qual').onchange = e => { CORE.setOpt('qual', e.target.value); if(run) run.stage.setQuality(e.target.value); };
  $('o-sens').oninput = e => { const v = +e.target.value; CORE.setOpt('sens', v); if(run) run.stage.input.sens = v; };
  window.addEventListener('keydown', e => { if(e.key === 'Escape' && !$('menu').hidden){ e.stopImmediatePropagation(); resume(); } }, true);
  document.addEventListener('visibilitychange', () => { if(document.hidden && run && $('menu').hidden && $('sheet').hidden && $('result').hidden) menu(); else if(!document.hidden && run) wake(true); });
  $('nogl-ok').onclick = () => { $('nogl').hidden = true; zurueck(); };

  function stop(){ wake(false); clearInterval(uhr); clearInterval(qUhr); FX.sprich(''); $('menu').hidden = true; $('note').hidden = true; $('brief').hidden = true; $('rec').hidden = true; if(run){ run.dispose(); run = null; } if(qDone){ const f = qDone; qDone = null; f(null); } }

  /* ---------- Fragen ----------
     Wertung: erster Versuch 100 Punkte, zweiter 50, danach wird die Lösung gezeigt (in der Prüfung gibt es nur einen Versuch).
     mc = eine Antwort · multi = mehrere ankreuzen und prüfen · reihe = in der richtigen Reihenfolge antippen
     statement = vier von sechs Sätzen in sinnvoller Reihenfolge, gegen die Zeit · bausteine = je Feld einen Textbaustein wählen
     gespraech = Gespräch in mehreren Zügen mit Stimmungsanzeige · budget = Posten wählen, ohne den Betrag zu überschreiten */
  let qDone = null, qUhr = 0;
  function schliesse(){ clearInterval(qUhr); $('sheet').hidden = true; $('rec').hidden = true; FX.sprich(''); }
  function ask(a, optionen, einmal){
    return new Promise(res => {
      const typ = a.typ || 'mc', box = $('q-opts'), hint = $('q-hint'), check = $('q-check'), bild = $('q-bild'), MAX = einmal ? 1 : 2;
      let tries = 0, fertig = false, folge = [];
      qDone = res; $('tip').hidden = true; clearInterval(qUhr);
      $('q-title').textContent = a.frage; $('q-fb').hidden = true; $('q-close').hidden = false; check.hidden = true; check.disabled = false; check.textContent = 'Prüfen'; hint.hidden = true; hint.className = 'src';
      bild.hidden = !a.bild; bild.innerHTML = a.bild || '';                                   // Bilder stammen aus den eigenen Spieldaten (game/data)
      const hinweis = t => { hint.hidden = !t; hint.textContent = t || ''; };
      const nochmal = () => hinweis(einmal ? '' : 'Noch nicht richtig. Du hast einen weiteren Versuch.');
      // Abschluss: Lösung zeigen, Erklärung, Quelle und Link ins Kapitel
      const ende = (ok, loesung) => {
        fertig = true; clearInterval(qUhr); $('rec').hidden = true; $('q-close').hidden = true; check.hidden = true; hint.hidden = true; if(!ok) tries = 3;
        box.querySelectorAll('.opt').forEach(b => { b.disabled = true; });
        $('q-fbt').textContent = (ok ? (tries === 1 ? 'Richtig. ' : 'Richtig im zweiten Versuch. ') : (loesung ? loesung + ' ' : '')) + (a.erkl || '');
        $('q-src').textContent = 'Quelle: ' + a.quelle;
        const v = /\bv-[a-z0-9-]+/.exec(a.quelle || ''), m = CORE.MISSIONS.find(x => x.id === (a._m || mis.id)), ziel = v ? v[0] : m && m.kapitel, link = $('q-link');
        link.hidden = !ziel; if(ziel) link.href = '../index.html#' + ziel;
        $('q-fb').hidden = false; $('q-next').focus({ preventScroll:true });
      };
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
        const werte = ok => { urteil(ok, los, () => { folge = []; if(typ !== 'multi') zeichne(); if(stm) takt(); }); if(fertig) loese(); };
        // Statement: Aufnahme läuft, die Zeit ist knapp; läuft sie ab, zählt das als Fehlversuch
        let rest = 0;
        const takt = () => { rest = a.zeit; clearInterval(qUhr); const bar = $('q-zeit'); bar.style.width = '100%'; bar.className = '';
          qUhr = setInterval(() => { if(!$('menu').hidden || document.hidden) return; rest--; bar.style.width = Math.max(0, rest / a.zeit * 100) + '%'; bar.className = rest <= 15 ? 'knapp' : ''; if(rest <= 0){ clearInterval(qUhr); STAGE.sfx('bad'); werte(false); if(!fertig) hinweis('Die Zeit ist um. Du hast einen weiteren Versuch.'); } }, 1000); };
        if(stm){ $('rec').hidden = false; takt(); }
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
      $('q-next').onclick = () => close({ tries });
      $('q-close').onclick = () => close(null);
      $('sheet').hidden = false; $('sheet').scrollTop = 0;
    });
  }

  /* ---------- Auswertung ---------- */
  function result(st, zeitAus){
    if(run) run.pause(true);
    const L = data.level[lvl], liste = $('r-liste'); let neu = [], ok = true, last = true;
    liste.hidden = true; $('r-story').textContent = ''; $('r-again').hidden = false;
    if(modus === 'mission'){
      const r = CORE.finish(mis.id, lvl, st.pts, st.max, st.fehler); neu = r.neu; ok = r.ok; last = lvl + 1 >= data.level.length;
      $('r-kick').textContent = 'Level ' + (lvl + 1) + ' · ' + L.titel;
      $('r-title').textContent = ok ? (st.fehler === 0 ? 'Fehlerfrei bestanden' : 'Bestanden') : 'Noch nicht bestanden';
      if(L.ende) $('r-story').textContent = ok ? L.ende.gut : L.ende.schlecht;
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
      if(st.falsch.length){ liste.hidden = false; liste.innerHTML = st.falsch.map(a => '<li><b>' + esc(a.frage) + '</b><br>' + esc(Array.isArray(a.richtig) ? a.richtig.join(a.typ === 'reihe' ? ' → ' : '; ') : a.richtig) + '</li>').join(''); }
    }
    if(ok) STAGE.sfx('win');
    $('r-pts').textContent = fmt(st.pts); $('r-max').textContent = fmt(st.max);
    $('r-badges').innerHTML = neu.map(k => badge(k, true)).join('');
    $('r-next').hidden = modus !== 'mission' || !ok || last;
    $('st-total').textContent = fmt(CORE.total()); $('st-serie').textContent = CORE.serie();
    $('result').hidden = false;
  }
  $('r-again').onclick = () => { if(modus === 'pruefung'){ stop(); training('pruefung'); } else play(lvl); };
  $('r-next').onclick = () => play(lvl + 1);
  $('r-list').onclick = zurueck;

  $('btn-back').onclick = () => { if(screen === 'play') zurueck(); else home(); };
  home();
  // Aus der Lern-App direkt in eine Mission springen: ?m=<Mission>&von=<Ansicht der App>
  if(PAR.get('m')) mission(PAR.get('m'));
  // Offline: denselben Service Worker wie die Lern-App nutzen
  if('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('../sw.js').catch(() => {});
})();
