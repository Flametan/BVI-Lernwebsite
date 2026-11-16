/* IdF-Spiel – Oberfläche: Startbildschirm, Levelwahl, Spielansicht, Fragen und Auswertung. */
(function(){
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const fmt = n => n.toLocaleString('de-DE');
  let screen = 'home', mis = null, data = null, lvl = 0, run = null, tipT = 0;

  function show(name){
    screen = name;
    ['home', 'levels', 'play'].forEach(s => { $(s).hidden = s !== name; });
    $('btn-back').hidden = name === 'home'; $('btn-menu').hidden = name !== 'play';
    $('top-kick').textContent = name === 'home' ? 'IdF Münster' : mis.thema;
    $('top-title').textContent = name === 'home' ? 'IdF-Spiel' : name === 'levels' ? mis.titel : 'Level ' + (lvl + 1) + ' · ' + data.level[lvl].titel;
    $('st-total').textContent = fmt(CORE.total()); $('st-serie').textContent = CORE.serie();
  }

  /* ---------- Startbildschirm ---------- */
  function home(){
    const d = $('daily'), done = CORE.dailyDone();
    d.className = 'daily' + (done ? ' done' : '');
    d.textContent = done ? 'Tagesziel geschafft. Serie: ' + CORE.serie() + (CORE.serie() === 1 ? ' Tag.' : ' Tage.') : 'Tagesziel: Spiele heute ein Level.';
    $('missions').innerHTML = CORE.MISSIONS.map(m => {
      const p = CORE.passed(m.id);
      return '<button class="card" data-m="' + m.id + '"' + (m.bereit ? '' : ' disabled') + '>'
        + '<span class="kick">' + esc(m.thema) + '</span><h3>' + esc(m.titel) + '</h3><p>' + esc(m.text) + '</p>'
        + (m.bereit
          ? '<div class="bar"><i style="width:' + Math.round(p / m.levels * 100) + '%"></i></div><div class="meta"><span>Level ' + p + ' / ' + m.levels + '</span><span>Bestwert ' + fmt(CORE.best(m.id)) + '</span></div>'
          : '<div class="meta"><span class="tag">In Arbeit</span></div>')
        + '</button>';
    }).join('');
    const have = CORE.badges();
    $('badges').innerHTML = Object.keys(CORE.BADGES).map(k => badge(k, have.includes(k))).join('');
    show('home');
  }
  function badge(k, on){ const b = CORE.BADGES[k]; return '<div class="badge' + (on ? ' on' : '') + '"><b>' + esc(b.titel) + '</b>' + esc(b.text) + '</div>'; }

  $('missions').addEventListener('click', async e => {
    const c = e.target.closest('.card'); if(!c || c.disabled) return;
    mis = CORE.MISSIONS.find(m => m.id === c.dataset.m);
    try{
      const [d] = await Promise.all([fetch('data/' + mis.id + '.json').then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }), script('js/m-' + mis.id + '.js')]);
      data = d; levels();
    }catch(err){ $('daily').className = 'daily'; $('daily').textContent = 'Die Mission konnte nicht geladen werden. Bitte prüfe die Verbindung und versuche es erneut.'; }
  });
  function script(src){
    return new Promise((ok, no) => {
      if(document.querySelector('script[src="' + src + '"]')) return ok();
      const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s);
    });
  }

  /* ---------- Levelwahl ---------- */
  function levels(){
    $('lv-text').textContent = mis.text;
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
    const st = { pts:0, done:0, combo:0, fehler:0, max:n * 100 };
    $('hud-s').textContent = L.steckbrief; $('result').hidden = true; $('sheet').hidden = true; $('tip').hidden = false;
    clearTimeout(tipT); tipT = setTimeout(() => { $('tip').hidden = true; }, 9000);
    show('play');
    const hud = () => {
      $('hud-prog').textContent = st.done + ' / ' + n; $('hud-pts').textContent = fmt(st.pts);
      $('hud-combo').hidden = st.combo < 3; $('hud-combo').textContent = 'Serie ×' + st.combo;
    };
    hud();
    STAGE.audio.on = CORE.opt('ton');
    try{ run = window.MISSIONS[mis.id].start({
      canvas: $('stage'), level: L, ui: { joy:$('joy'), act:$('act'), up:$('up'), down:$('down'), info:$('info') },
      ask: a => ask(a, a.optionen || data.optionen[a.opt]),
      count(tries){
        st.done++;
        if(tries === 1){ st.combo++; st.pts += 100 + (st.combo >= 3 ? 20 : 0); }
        else { st.combo = 0; st.fehler++; if(tries === 2) st.pts += 50; }
        STAGE.sfx(tries === 1 ? 'ok' : tries === 2 ? 'halb' : 'bad');
        if(tries > 1 && CORE.opt('vib') && navigator.vibrate) navigator.vibrate(tries === 2 ? 40 : [60, 50, 60]);
        hud();
      },
      finish(){ setTimeout(() => result(st), 350); },
      menu, fade
    }); }catch(e){ console.warn('3D-Start fehlgeschlagen', e); run = null; $('nogl').hidden = false; return; }
    run.stage.setQuality(CORE.opt('qual')); run.stage.input.sens = CORE.opt('sens');
    wake(true);
    window.GAME_RUN = run;                               // für die automatische Prüfung (game/tests)
  }
  // Geschosswechsel: kurz abblenden, umschalten, aufblenden
  function fade(fn){ const f = $('fade'); f.classList.add('on'); setTimeout(() => { fn(); f.classList.remove('on'); }, 170); }
  // Bildschirm bleibt beim Spielen an (wenn der Browser es erlaubt)
  let lock = null;
  function wake(on){ try{ if(on && navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { lock = l; }).catch(() => {}); else if(lock){ lock.release().catch(() => {}); lock = null; } }catch(e){} }

  /* ---------- Pausenmenü und Einstellungen ---------- */
  function menu(){
    if(!run || !$('sheet').hidden || !$('result').hidden) return;
    if(!$('menu').hidden) return resume();
    run.pause(true);
    $('o-ton').checked = CORE.opt('ton'); $('o-vib').checked = CORE.opt('vib'); $('o-qual').value = CORE.opt('qual'); $('o-sens').value = CORE.opt('sens');
    $('m-full').hidden = !document.documentElement.requestFullscreen;
    $('menu').hidden = false; $('m-resume').focus();
  }
  function resume(){ $('menu').hidden = true; if(run) run.pause(false); }
  $('btn-menu').onclick = menu; $('m-resume').onclick = resume;
  $('m-restart').onclick = () => { $('menu').hidden = true; play(lvl); };
  $('m-exit').onclick = () => { $('menu').hidden = true; stop(); levels(); };
  $('m-full').onclick = () => { try{ if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); }catch(e){} };
  $('o-ton').onchange = e => { CORE.setOpt('ton', e.target.checked); STAGE.audio.on = e.target.checked; if(e.target.checked) STAGE.sfx('ok'); };
  $('o-vib').onchange = e => CORE.setOpt('vib', e.target.checked);
  $('o-qual').onchange = e => { CORE.setOpt('qual', e.target.value); if(run) run.stage.setQuality(e.target.value); };
  $('o-sens').oninput = e => { const v = +e.target.value; CORE.setOpt('sens', v); if(run) run.stage.input.sens = v; };
  window.addEventListener('keydown', e => { if(e.key === 'Escape' && !$('menu').hidden){ e.stopImmediatePropagation(); resume(); } }, true);
  document.addEventListener('visibilitychange', () => { if(document.hidden && run && $('menu').hidden && $('sheet').hidden && $('result').hidden) menu(); else if(!document.hidden && run) wake(true); });
  $('nogl-ok').onclick = () => { $('nogl').hidden = true; levels(); };

  function stop(){ wake(false); $('menu').hidden = true; if(run){ run.dispose(); run = null; } if(qDone){ const f = qDone; qDone = null; f(null); } }

  /* Frage: erster Versuch 100 Punkte, zweiter 50, danach wird die Lösung gezeigt */
  let qDone = null;
  function ask(a, optionen){
    return new Promise(res => {
      let tries = 0, fertig = false;
      qDone = res; $('tip').hidden = true;
      $('q-title').textContent = a.frage; $('q-fb').hidden = true; $('q-close').hidden = false;
      const box = $('q-opts');
      box.innerHTML = optionen.map(o => '<button class="opt">' + esc(o) + '</button>').join('');
      const ende = ok => {
        fertig = true; $('q-close').hidden = true;
        box.querySelectorAll('.opt').forEach(b => { b.disabled = true; if(b.textContent === a.richtig) b.classList.add('yes'); });
        $('q-fbt').textContent = (ok ? (tries === 1 ? 'Richtig. ' : 'Richtig im zweiten Versuch. ') : 'Richtig wäre: ' + a.richtig + '. ') + a.erkl;
        $('q-src').textContent = 'Quelle: ' + a.quelle; $('q-fb').hidden = false; $('q-next').focus();
      };
      box.onclick = e => {
        const b = e.target.closest('.opt'); if(!b || b.disabled || fertig) return;
        tries++;
        if(b.textContent === a.richtig) ende(true);
        else { b.classList.add('no'); b.disabled = true; if(tries >= 2){ tries = 3; ende(false); } }
      };
      const close = v => { $('sheet').hidden = true; qDone = null; res(v); };
      $('q-next').onclick = () => close({ tries });
      $('q-close').onclick = () => close(null);
      $('sheet').hidden = false;
    });
  }

  function result(st){
    const r = CORE.finish(mis.id, lvl, st.pts, st.max, st.fehler);
    if(run) run.pause(true); if(r.ok) STAGE.sfx('win');
    const last = lvl + 1 >= data.level.length;
    $('r-kick').textContent = 'Level ' + (lvl + 1) + ' · ' + data.level[lvl].titel;
    $('r-title').textContent = r.ok ? (st.fehler === 0 ? 'Fehlerfrei bestanden' : 'Bestanden') : 'Noch nicht bestanden';
    $('r-pts').textContent = fmt(st.pts); $('r-max').textContent = fmt(st.max);
    $('r-note').textContent = r.ok
      ? (r.rekord ? 'Neuer Bestwert. ' : '') + (last ? 'Das war das letzte Level dieser Mission.' : 'Das nächste Level ist frei.')
      : 'Zum Bestehen brauchst du ' + fmt(Math.ceil(st.max * CORE.PASS)) + ' Punkte. Schau dir die Erklärungen an und versuch es noch einmal.';
    $('r-badges').innerHTML = r.neu.map(k => badge(k, true)).join('');
    $('r-next').hidden = !r.ok || last;
    $('st-total').textContent = fmt(CORE.total()); $('st-serie').textContent = CORE.serie();
    $('result').hidden = false;
  }
  $('r-again').onclick = () => play(lvl);
  $('r-next').onclick = () => play(lvl + 1);
  $('r-list').onclick = () => { stop(); levels(); };

  $('btn-back').onclick = () => { if(screen === 'play'){ stop(); levels(); } else home(); };
  home();
  // Offline: denselben Service Worker wie die Lern-App nutzen
  if('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('../sw.js').catch(() => {});
})();
