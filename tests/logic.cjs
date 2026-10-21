// Prüft die Logik der App im Browser: Stundenplan, Suche, Lernkarten, Fortschritt, Lernzeit.
// Start: node logic.cjs [Basis-URL]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8765/index.html';
const EXEC = process.env.PW_EXEC || undefined;

const fails = [];
let checks = 0;
const eq = (name, got, want) => {
  checks++;
  if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`${name}: erwartet ${JSON.stringify(want)}, bekommen ${JSON.stringify(got)}`);
};
const ok = (name, cond, info = '') => { checks++; if (!cond) fails.push(`${name} ${info}`); };

(async () => {
  const browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { localStorage.setItem('bvi_onboarded', '1'); localStorage.setItem('idf_plan_grp', 'g1'); });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof NAV !== 'undefined');

  // ── Stundenplan ──
  const plan = await page.evaluate(() => {
    const at = s => { const n = IDF_PLAN.next(new Date(s)); return n && { state: n.state, title: n.title }; };
    const ics = IDF_PLAN.ics();
    return {
      mon08: at('2026-10-26T08:00'),
      mon0930: at('2026-10-26T09:30'),
      afterModule: at('2027-01-15T10:00'),
      count: ics.count,
      group: ics.group,
      head: ics.text.split('\r\n')[0],
      longLine: ics.text.split('\r\n').some(l => new TextEncoder().encode(l).length > 75),
    };
  });
  eq('Plan: laufende Einheit am Montag 08:00', plan.mon08, { state: 'now', title: 'Anreise' });
  eq('Plan: nächste Einheit am Montag 09:30', plan.mon0930.state, 'next');
  eq('Plan: nach dem Modul keine Einheit', plan.afterModule, null);
  ok('Plan: Kalenderdatei hat Einträge', plan.count > 40, String(plan.count));
  eq('Plan: Kalender beginnt korrekt', plan.head, 'BEGIN:VCALENDAR');
  ok('Plan: keine Kalenderzeile über 75 Byte', !plan.longLine);

  // Erreichbarkeiten: in jeder Woche mit Vorwahl
  const tel = await page.evaluate(() => {
    NAV.tab('v-plan', 'x');
    const rows = [];
    for (let i = 0; i < 9; i++) {
      rows.push([...document.querySelectorAll('.idf-tel-row a')].map(a => a.textContent));
      IDF_PLAN._nav(1);
    }
    return rows;
  });
  ok('Plan: 9 Wochen mit Erreichbarkeiten', tel.length === 9 && tel.every(r => r.length >= 3));
  ok('Plan: alle Nummern mit Vorwahl', tel.flat().every(n => /^0\d{2,4} /.test(n)), JSON.stringify(tel.flat().filter(n => !/^0\d{2,4} /.test(n))));

  // ── Gruppe wechseln ──
  const grp = await page.evaluate(() => { IDF_PLAN._grp('g2'); const a = IDF_PLAN.summary().thema; IDF_PLAN._grp('g1'); return a; });
  ok('Plan: Gruppe 2 liefert ein Thema', typeof grp === 'string' && grp.length > 2);

  // ── Lernzeit ──
  const months = await page.evaluate(() => USAGE.months(12));
  eq('Lernzeit: 12 Monate', months.length, 12);
  const now = new Date();
  eq('Lernzeit: letzter Monat ist der aktuelle', [months[11].y, months[11].m], [now.getFullYear(), now.getMonth()]);

  // ── Suche ──
  const search = await page.evaluate(async () => {
    const run = async q => {
      SEARCH.open();
      const i = document.getElementById('search-input'); i.value = q; SEARCH.query(q);
      await new Promise(r => setTimeout(r, 400));
      return [...document.querySelectorAll('#search-results .sr-title')].map(e => e.textContent);
    };
    return { exact: await run('Atemschutz'), typo: await run('Atemschuz'), umlaut: await run('Ubung') };
  });
  ok('Suche: genauer Treffer', search.exact.length > 0);
  ok('Suche: Tippfehler „Atemschuz“ findet Atemschutz', search.typo.some(t => /atemschutz/i.test(t)));
  ok('Suche: „Ubung“ findet etwas', search.umlaut.length > 0);

  // ── Lernkarten: schwer, schwach, eigene Karten ──
  const fc = await page.evaluate(() => {
    SEARCH.close();
    NAV.tab('v-flashcards', 'x');
    FC.start();
    return new Promise(res => setTimeout(() => {
      FC.flip(); FC.answer(false);
      FC.flip(); FC.answer('hard');
      FC.flip(); FC.answer(true);
      const weak = FC.weakCount();
      FC.showWeak();
      setTimeout(() => res({ weak, pos: document.querySelector('.fc-pos')?.textContent }), 700);
    }, 700));
  });
  eq('Lernkarten: zwei schwache Karten', fc.weak, 2);
  ok('Lernkarten: Filter „Schwach“ zeigt 2 Karten', /von 2$/.test(fc.pos || ''), fc.pos);

  const own = await page.evaluate(() => {
    const before = FLASHCARD_DATA.length;
    CUSTOM.open();
    document.getElementById('cu-q').value = 'Testfrage <b>?</b>';
    document.getElementById('cu-a').value = 'Antwort';
    document.getElementById('cu-save').click();
    return { grew: FLASHCARD_DATA.length === before + 1, saved: JSON.parse(localStorage.getItem('bvi_fc_custom')).length };
  });
  ok('Eigene Karte: wird angelegt', own.grew && own.saved === 1);

  // ── Fortschritt: Sammelkacheln ──
  const hub = await page.evaluate(() => {
    ['v-feuak-bedarfsplanung', 'v-feuak-rdbp', 'v-feuak-katsbp'].forEach(v => NAV.go(v, v));
    NAV.tab('v-feuak', 'x');
    const card = [...document.querySelectorAll('.topic-card')].find(c => (c.getAttribute('onclick') || '').includes("'v-feuak-bp-hub'"));
    return !!(card && card.querySelector('.tc-check'));
  });
  ok('Fortschritt: Sammelkachel Bedarfsplanung bekommt den Haken', hub);

  // ── Farbschema ──
  const theme = await page.evaluate(() => { THEME.set('light'); const a = document.documentElement.dataset.theme; THEME.set('dark'); return [a, document.documentElement.dataset.theme]; });
  eq('Farbschema schaltet um', theme, ['light', 'dark']);

  // ── IdF-Quiz: Mehrfachauswahl zählt nur ganz richtig ──
  const idfq = await page.evaluate(() => {
    NAV.go('v-idf-altklausur', 'IdF');
    IDFQ.setTypeFilter('multi');
    const cur = () => IDF_QUIZ_Q.find(x => x.q === document.getElementById('quiz-q-idf').textContent);
    const res = {};
    let q = cur();
    q.correct.slice(0, -1).forEach(i => IDFQ._toggle(i));            // eine richtige fehlt
    if (q.correct.length === 1) IDFQ._toggle(q.opts.findIndex((_, i) => !q.correct.includes(i))); // sonst eine falsche
    IDFQ._check();
    res.partial = JSON.parse(localStorage.getItem('bvi_idfq_mastery'))[q.id];
    IDFQ.next();
    q = cur();
    q.correct.forEach(i => IDFQ._toggle(i));
    IDFQ._check();
    res.full = JSON.parse(localStorage.getItem('bvi_idfq_mastery'))[q.id];
    res.vakUntouched = localStorage.getItem('bvi_quiz_mastery');
    IDFQ.setMode('exam');
    res.examQs = document.querySelectorAll('#quiz-exam-questions-idf .quiz-exam-q').length;
    res.boxes = document.querySelectorAll('#quiz-exam-questions-idf input[type=checkbox]').length > 0;
    IDFQ.setMode('learn');
    return res;
  });
  eq('IdF-Quiz: teilweise richtig zählt als falsch', idfq.partial, 'err');
  eq('IdF-Quiz: ganz richtig zählt', idfq.full, 'ok');
  eq('IdF-Quiz: Prüfung hat 25 Fragen', idfq.examQs, 25);
  ok('IdF-Quiz: Prüfung nutzt Kontrollkästchen', idfq.boxes);
  ok('IdF-Quiz: VAk-Lernstand bleibt unberührt', idfq.vakUntouched === null);

  // ── Lernseiten: Überblick, Kapitel-Fenster, Zurück ──
  const lp = await page.evaluate(async () => {
    NAV.go('v-vak-verwaltungsrecht', 'VR');
    await new Promise(r => setTimeout(r, 300));
    const v = document.getElementById('v-vak-verwaltungsrecht'), res = {};
    res.cards = v.querySelectorAll('.lp-card').length;
    v.querySelector('.lp-card[data-i="2"]').click();
    res.open = LP.isOpen();
    res.bodyMoved = !!document.querySelector('.lp-wbody .acc-body');
    document.querySelector('.lp-next').click();
    res.chapter = document.querySelector('.lp-eb').textContent;
    NAV.back();
    res.closed = !LP.isOpen();
    res.bodyBack = v.querySelectorAll('details.acc-item > .acc-body').length;
    res.read = JSON.parse(localStorage.getItem('bvi_checks_v-vak-verwaltungsrecht') || '{}');
    return res;
  });
  eq('Lernseite: sieben Kapitelkarten', lp.cards, 7);
  ok('Lernseite: Kapitel öffnet im Fenster', lp.open && lp.bodyMoved);
  eq('Lernseite: Weiter öffnet nächstes Kapitel', lp.chapter, 'Kapitel 04 / 07');
  ok('Lernseite: Zurück schließt das Fenster und gibt den Inhalt zurück', lp.closed && lp.bodyBack === 7);
  ok('Lernseite: geöffnete Kapitel gelten als gelesen', Object.keys(lp.read).length >= 2);

  // ── Suche springt ins Kapitel, Vorlesefunktion ist entfernt ──
  const sj = await page.evaluate(async () => {
    NAV.home();
    SEARCH.open();
    const inp = document.getElementById('search-input'); inp.value = 'Untätigkeitsklage'; SEARCH.query(inp.value);
    await new Promise(r => setTimeout(r, 600));
    const hit = document.querySelector('#search-results [onclick*="SEARCH.go"]'); hit && hit.click();
    await new Promise(r => setTimeout(r, 700));
    return { view: document.querySelector('.view.active').id, win: LP.isOpen(), eb: document.querySelector('.lp-eb')?.textContent, tts: typeof TTS, btn: !!document.getElementById('m-tts') };
  });
  eq('Suche: öffnet die passende Lernseite', sj.view, 'v-vak-verwaltungsrecht');
  ok('Suche: springt ins Kapitel', sj.win && /Kapitel 0\d \/ 07/.test(sj.eb || ''));
  ok('Vorlesefunktion entfernt', sj.tts === 'undefined' && !sj.btn);

  // ── Desktop: Befehlspalette, Fokus-Lesemodus, Lernkarten-Fenster ──
  await page.setViewportSize({ width: 1280, height: 860 });
  const dk = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    NAV.go('v-vak-verwaltungsrecht', 'VR'); await w(400);
    r.btns = ['m-practice', 'm-focus'].map(i => !document.getElementById(i).classList.contains('hidden'));
    SEARCH.open(); await w(100);
    r.pal = [...document.querySelectorAll('#search-results .sr-group')].map(e => e.textContent);
    SEARCH.close();
    localStorage.removeItem('bvi_lp_prac');
    LP.togglePractice(true); await w(100);
    r.prac = document.body.classList.contains('lp-prac') && !!document.querySelector('#lp-practice .lpp-card');
    LP.togglePractice(false); await w(50);
    r.pracOff = !document.body.classList.contains('lp-prac');
    LP.focusMode(); await w(100);
    r.focus = LP.isOpen() && document.querySelector('.lp-win').classList.contains('focus');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await w(50);
    r.next = document.querySelector('.lp-eb').textContent;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await w(100);
    r.closed = !LP.isOpen();
    return r;
  });
  eq('Desktop: Knöpfe Üben und Fokus sichtbar', dk.btns, [true, true]);
  ok('Suche: Kapitel der Seite, keine Aktionen', dk.pal.includes('Kapitel dieser Seite') && !dk.pal.includes('Aktionen'));
  ok('Suche: keine Filterleiste', !(await page.evaluate(() => !!document.querySelector('.sf-btn,.search-filter-row'))));
  ok('Lernkarten-Fenster ein- und ausblendbar', dk.prac && dk.pracOff);
  ok('Fokus-Lesemodus mit Pfeiltasten und Esc', dk.focus && /02 \/ 07/.test(dk.next) && dk.closed);
  await page.setViewportSize({ width: 390, height: 844 });

  // ── Pausenraum: Startseiten-Karte, Spiele, Einsatzfahrt ──
  const pz = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    NAV.home(); await w(300);
    r.home = [...document.querySelectorAll('#m-home .m-row .m-t1')].map(e => e.textContent);
    r.tabs = [...document.querySelectorAll('#m-tabbar [data-tab]')].map(b => b.textContent.trim());
    r.quips = PAUSE_LOADER.QUIPS.length;
    r.emoji = PAUSE_LOADER.QUIPS.some(q => /\p{Extended_Pictographic}/u.test(q));
    NAV.go('v-pause', 'Pausenraum'); await PAUSE_LOADER.load(); await w(300);
    r.card = (document.getElementById('pause-quip') || {}).textContent || '';
    r.games = document.querySelectorAll('#pause-root [data-g]').length;
    r.modes = [];
    for (const m of ['allg', 'fw', 'beides']) {
      document.querySelector(`#pause-root [data-m="${m}"]`).click(); await w(50);
      const res = {};
      for (const g of ['quiz', 'tf', 'word', 'num', 'mem']) {
        PAUSE.open(g); await w(60);
        res[g] = !document.querySelector('#pause-root .pz-body').textContent.includes('noch keine Inhalte');
        if (g === 'quiz') { document.querySelector('#pause-root .pz-opt').click(); await w(50); res.quizFb = !!document.querySelector('#pause-root .pz-fb'); }
        if (g === 'word') { 'ABCDE'.split('').forEach(k => document.querySelector(`#pause-root [data-k="${k}"]`).click()); document.querySelector('#pause-root [data-k="ENTER"]').click(); await w(30); res.wordRow = document.querySelectorAll('#pause-root .pz-wc.gr,#pause-root .pz-wc.ye,#pause-root .pz-wc.xx').length; }
        if (g === 'mem') res.memCards = document.querySelectorAll('#pause-root .pz-mc').length;
        history.back(); await w(150);
        res[g + 'Back'] = document.querySelector('.view.active').id === 'v-pause' && !!document.querySelector('#pause-root [data-g]');
      }
      r.modes.push(res);
    }
    PAUSE.open('fahrt'); await w(100);
    document.querySelector('#pause-root [data-a="route"]').click(); await w(30);
    document.querySelector('#pause-root [data-a="go"][data-v="B"]').click();
    let n = 0;
    for (let i = 0; i < 6; i++) {
      for (let k = 0; k < 60 && !document.querySelector('#pause-root [data-a="ans"]:not([disabled])'); k++) await w(100);
      const st = PAUSE._fahrt()._state(), q = st.qs[st.qi];
      document.querySelector(`#pause-root [data-a="ans"][data-v="${(q.c + 1) % q.o.length}"]`).click(); n++; await w(30);
      document.querySelector('#pause-root [data-a="next"]').click();
    }
    for (let k = 0; k < 60 && PAUSE._fahrt()._state().phase !== 'end'; k++) await w(100);
    const st = PAUSE._fahrt()._state();
    r.fahrt = { n, phase: st.phase, win: st.win, t: Math.round(st.t), opts: st.qs.every(q => q.o.length === 4) };
    NAV.back(); await w(200);
    r.backToHub = !!document.querySelector('#pause-root [data-g]');
    NAV.home(); await w(200);
    r.left = document.querySelector('#pause-root').innerHTML === '';
    return r;
  });
  ok('Pausenraum: Satz unter der Überschrift', pz.card.length > 10);
  ok('Startseite: Lernkarten ja, Pausenraum-Karte nein', pz.home.includes('Lernkarten') && !pz.home.includes('Pausenraum'));
  ok('Tab-Leiste: Pausenraum statt Lernkarten', pz.tabs.some(x => x.includes('Pausenraum')) && !pz.tabs.some(x => x.includes('Lernkarten')));
  eq('Pausenraum: 50 Sätze ohne Emojis', [pz.quips, pz.emoji], [50, false]);
  eq('Pausenraum: 7 Einträge (Einsatzfahrt, Duell und fünf weitere Spiele)', pz.games, 7);
  ok('Spiele haben Inhalte in allen drei Modi', pz.modes.every(m => m.quiz && m.tf && m.word && m.num && m.mem));
  ok('Zurück im Spiel führt zur Spieleauswahl (Browser-Zurück)', pz.modes.every(m => m.quizBack && m.tfBack && m.wordBack && m.numBack && m.memBack));
  ok('Quizleiter, Wörter-Raten, Memory reagieren', pz.modes.every(m => m.quizFb && m.wordRow === 5 && m.memCards === 12));
  ok('Einsatzfahrt Ring: 6 Fragen, 4 Optionen, verloren bei 6 Fehlern', pz.fahrt.n === 6 && pz.fahrt.phase === 'end' && pz.fahrt.win === false && pz.fahrt.t > 480 && pz.fahrt.opts);
  ok('Zurück im Spiel führt zur Spieleliste, Verlassen stoppt', pz.backToHub && pz.left);

  // ── Farbsystem: Kontrast der Text- und Hintergrundnamen (WCAG AA) in beiden Designs ──
  const ct = await page.evaluate(async () => {
    const out = {};
    for (const th of ['dark', 'light']) {
      document.documentElement.setAttribute('data-theme', th);
      await new Promise(r => setTimeout(r, 50));
      const rgb = n => { const t = document.createElement('i'); t.style.color = 'var(' + n + ')'; document.body.appendChild(t); const m = getComputedStyle(t).color.match(/[\d.]+/g).map(Number); t.remove(); return m; };
      const lin = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
      const L = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
      const cr = (f, b) => { const x = L(f), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
      const bad = [];
      for (const fg of ['--text-primary', '--text-secondary', '--text-tertiary', '--brand-text'])
        for (const bg of ['--bg-page', '--bg-surface']) { const c = cr(rgb(fg), rgb(bg)); if (c < 4.5) bad.push(fg + ' auf ' + bg + ' ' + c.toFixed(2)); }
      const c2 = cr(rgb('--brand-on-primary'), rgb('--brand-primary')); if (c2 < 4.5) bad.push('Text auf Akzent ' + c2.toFixed(2));
      out[th] = bad;
    }
    document.documentElement.removeAttribute('data-theme');
    return out;
  });
  eq('Kontrast der Farbnamen in Dunkel und Hell (AA)', [ct.dark, ct.light], [[], []]);

  // ── Barrierefreiheit: Hauptbereich, Dialoge, Live-Ansage, Feldnamen, Fokus, Schriftgrößen ──
  const ax = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    NAV.home(); await w(300);
    r.mains = document.querySelectorAll('[role="main"]').length;
    r.dialogs = ['search-overlay', 'changelog-modal', 'onboarding-overlay', 'pomodoro-overlay', 'shortcuts-overlay', 'notes-overlay'].every(id => { const e = document.getElementById(id); return e.getAttribute('role') === 'dialog' && e.getAttribute('aria-modal') === 'true' && e.getAttribute('aria-label'); });
    TOAST.show('Test-Meldung'); await w(300);
    r.live = document.getElementById('a11y-live').textContent;
    r.skip = !!document.querySelector('.skip-link');
    NAV.go('v-abkuerzungen', 'x'); await w(300);
    r.abk = document.getElementById('abk-search').getAttribute('aria-label');
    // Fokusrahmen: ein per Tastatur fokussierter Knopf bekommt einen sichtbaren Rahmen
    const b = document.querySelector('.view.active button'); b.focus(); r.focusStyle = getComputedStyle(b).outlineStyle;
    return r;
  });
  eq('Genau ein Hauptbereich', ax.mains, 1);
  ok('Sechs Fenster haben Dialog-Rolle, aria-modal und Beschriftung', ax.dialogs);
  eq('Meldungen werden angesagt', ax.live, 'Test-Meldung');
  ok('Sprunglink vorhanden', ax.skip);
  ok('Abkürzungs-Suche hat einen Namen', ax.abk === 'Abkürzungen durchsuchen');
  const css = await page.evaluate(async () => { const t = await (await fetch('css/style.css')).text(); return { rm: /prefers-reduced-motion:reduce\)\{\s*html\{scroll-behavior:auto!important/.test(t), fv: /:focus-visible\{outline:2px solid/.test(t), coarse: /Klickflächen auf Touch-Geräten mindestens 44 px/.test(t) }; });
  ok('CSS: Bewegung reduzieren, Fokusrahmen und 44-px-Klickflächen vorhanden', css.rm && css.fv && css.coarse);

  // ── Einstellungen: Gruppen klappen auf, nur eine ist offen, Spende bleibt sichtbar ──
  const acc = await page.evaluate(async () => {
    NAV.go('v-settings', 'Einstellungen'); await new Promise(r => setTimeout(r, 300));
    const hs = [...document.querySelectorAll('#v-settings .m-acc-h')], r = { n: hs.length };
    r.closed = hs.every(h => document.getElementById(h.getAttribute('aria-controls')).hidden);
    document.getElementById('acc-dar-h').click(); document.getElementById('acc-ler-h').click();
    r.open = hs.map(h => h.id === 'acc-ler-h' ? h.getAttribute('aria-expanded') : h.getAttribute('aria-expanded'));
    r.vis = document.getElementById('m-timers-toggle').offsetParent !== null;
    r.sub = document.getElementById('acc-ler-sub').textContent;
    r.donate = !!document.querySelector('#v-settings .m-donate') && !document.querySelector('#v-settings .m-acc .m-donate');
    return r;
  });
  eq('Einstellungen: sieben Gruppen, zu Beginn zugeklappt', [acc.n, acc.closed], [7, true]);
  eq('Einstellungen: nur eine Gruppe offen', acc.open.filter(x => x === 'true').length, 1);
  ok('Einstellungen: Inhalt der offenen Gruppe sichtbar, Kurzinfo gefüllt', acc.vis && /^Tagesziel \d+ min/.test(acc.sub));
  ok('Einstellungen: Spende liegt außerhalb der Gruppen', acc.donate);

  // ── Android-Startsymbol folgt Akzentfarbe und Farbschema ──
  const icons = await page.evaluate(() => {
    const calls = []; window.BVIAndroid = { setIcon: n => calls.push(n) };
    ACCENT.set('#3E8EF7'); THEME.set('light'); THEME.set('dark'); ACCENT.set('#FFA412');
    delete window.BVIAndroid; THEME.set('dark');
    return calls;
  });
  eq('Startsymbol: Farbe und hell/dunkel', icons, ['blue', 'blue_light', 'blue', 'orange']);

  // ── Einstellungen: jede Zeile in „Daten“ hat einen Trennstrich; Erste-Schritte nennt den Pausenraum ──
  const dat = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#acc-dat-b .m-row')];
    const sep = rows.slice(1).map(r => r.previousElementSibling && r.previousElementSibling.classList.contains('m-row'));
    const ob = document.getElementById('onboarding-overlay').textContent;
    return { sep, pause: /Pausenraum/.test(ob), karten: /Bereich\s*Lernkarten|, Lernkarten/.test(ob) };
  });
  ok('Daten: Trennstrich vor jeder Zeile', dat.sep.length === 4 && dat.sep.every(Boolean));
  ok('Erste Schritte: Pausenraum statt Lernkarten', dat.pause && !dat.karten);

  // ── Spende ist als ganze Karte ein Link; Startseiten-Satz wechselt bei jedem Aufrufen ──
  const dq = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    const d = document.querySelector('#v-settings .m-donate');
    const seen = new Set();
    for (let i = 0; i < 8; i++) { NAV.go('v-settings', 'x'); await w(60); NAV.home(); await w(120); seen.add(document.querySelector('.m-quip').textContent); }
    const a = document.querySelector('.m-quip').textContent; SHELL.renderHome(); const b = document.querySelector('.m-quip').textContent;
    return { tag: d.tagName, href: /paypal\.me/.test(d.href), note: d.contains(d.querySelector('.m-note')), many: seen.size, same: a === b };
  });
  ok('Spende: ganze Karte ist ein Link', dq.tag === 'A' && dq.href && dq.note);
  ok('Startseite: Satz wechselt beim erneuten Aufrufen, bleibt beim Neuzeichnen', dq.many >= 4 && dq.same);

  // ── Fehlerbehebungen aus dem Bugtest ──
  const bf = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    // j und f in Textfeldern auf der Lernkarten-Seite
    NAV.tab('v-flashcards', 'Lernkarten'); await w(300);
    CUSTOM.open(); await w(200);
    const q = document.getElementById('cu-q'); q.focus();
    r.jTyped = q.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true, cancelable: true }));   // true = nicht abgefangen
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await w(100);
    // Lesezeichen und Verlauf in der Suche klickbar (kein kaputtes onclick)
    NAV.go('v-gal-organisation', 'GAL'); await w(300);
    BOOKMARKS.toggle ? 0 : 0;
    localStorage.setItem('bvi_bookmarks', JSON.stringify([{ id: 'v-gal-organisation', label: 'GAL "Organisation"' }]));
    localStorage.setItem('bvi_search_hist', JSON.stringify(['Glasl "x"']));
    SEARCH.open(); await w(250);
    const bk = document.querySelector('#search-results .bk-item');
    r.bkOnclick = !!bk && /SEARCH\.goBk\(/.test(bk.getAttribute('onclick')) && bk.getAttribute('onclick').includes('Organisation');
    NAV.home(); await w(100); bk && bk.click(); await w(300);
    r.bkNav = document.querySelector('.view.active').id;
    // Esc schließt nur das oberste Fenster
    POMO.open(); await w(100); SEARCH.open(); await w(100);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await w(100);
    r.escOne = [document.getElementById('search-overlay').classList.contains('hidden'), document.getElementById('pomodoro-overlay').classList.contains('hidden')];
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await w(100);
    r.escTwo = document.getElementById('pomodoro-overlay').classList.contains('hidden');
    // Notiz bleibt auf der Seite, auf der sie geschrieben wurde
    NAV.go('v-gal-organisation', 'GAL'); await w(300);
    localStorage.removeItem('bvi_note_v-gal-organisation'); localStorage.removeItem('bvi_note_v-settings');
    NOTES.open(); await w(100);
    const ta = document.getElementById('notes-textarea'); ta.value = 'Testnotiz'; ta.dispatchEvent(new Event('input'));
    NAV.go('v-settings', 'x'); await w(300);
    r.note = [localStorage.getItem('bvi_note_v-gal-organisation'), localStorage.getItem('bvi_note_v-settings')];
    localStorage.removeItem('bvi_note_v-gal-organisation');
    // Android-Zurück-Taste
    NAV.home(); await w(200);
    r.back = [window.bviBack()];
    NAV.go('v-gal-organisation', 'GAL'); await w(200);
    SEARCH.open(); await w(100);
    r.back.push(window.bviBack()); r.back.push(window.bviBack());
    return r;
  });
  ok('Textfeld: Taste „j“ wird nicht verschluckt', bf.jTyped === true);
  ok('Suche: Lesezeichen-Eintrag hat gültigen onclick und öffnet die Seite', bf.bkOnclick && bf.bkNav === 'v-gal-organisation');
  eq('Esc schließt nur das oberste Fenster', [bf.escOne, bf.escTwo], [[true, false], true]);
  eq('Notiz bleibt auf ihrer Seite', bf.note, ['Testnotiz', null]);
  eq('Android-Zurück: Startseite verlassen, Fenster zuerst schließen, dann zurück', bf.back, ['exit', 'handled', 'back']);

  // Sicherung: falsch geformte oder gefährliche Werte werden beim Einspielen aussortiert
  const bi = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    const data = { bvi_bookmarks: 'null', bvi_progress: '[1]', bvi_usage: '"x"', bvi_fc_custom: JSON.stringify([{ id: 'own1', cat: 'IdF · Eigene Karte', q: '<img src=x onerror=alert(1)>', a: 'ok' }, { id: '"><b>', q: 'x', a: 'y' }]), bvi_note_v_home: 'x', 'bvi_note_<img>': 'x', bvi_font_size: 'lg', bvi_et_end: '1' };
    window.confirm = () => false;   // nur die Aufbereitung prüfen, nichts schreiben
    let shown = null; const t = TOAST.show; TOAST.show = m => { shown = m; };
    const f = new File([JSON.stringify({ app: 'bvi-lernwebsite', exported: 'quatsch', data })], 'x.json');
    const inp = document.createElement('input'); Object.defineProperty(inp, 'files', { value: [f] });
    BACKUP.import(inp); await w(300); TOAST.show = t;
    return { shown };
  });
  ok('Sicherung: kaputte Datei bringt keinen Fehler', bi.shown === null || typeof bi.shown === 'string');
  const ac = await page.evaluate(() => { const c = ['#FFA412', '#C9A84C', '#E5484D', '#3E8EF7', '#3DBE7A']; const lum = h => { const n = parseInt(h.slice(1), 16), f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(n >> 16 & 255) + .7152 * f(n >> 8 & 255) + .0722 * f(n & 255); }; const out = []; c.forEach(h => { ACCENT.set(h); const on = getComputedStyle(document.documentElement).getPropertyValue('--m-on-accent').trim(); const L = lum(h), o = on === '#111' ? .0056 : 1; out.push(((Math.max(L, o) + .05) / (Math.min(L, o) + .05)) >= 4.5); }); ACCENT.set('#FFA412'); return out; });
  eq('Akzentfarben: Schrift auf Akzentfläche erreicht 4,5:1', ac, [true, true, true, true, true]);

  // ── Stundenplan folgt dem Datum, solange nicht selbst geblättert wurde ──
  const pf = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), Real = Date, r = {};
    let off = 0; const base = Real.now();
    window.Date = class extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + off); } static now() { return Real.now() + off; } };
    const setNow = iso => { off = Real.parse(iso) - Real.now(); };
    const snap = () => document.getElementById('plan-inner').innerText.slice(0, 400);
    setNow('2026-10-27T10:00:00'); NAV.go('v-plan', 'Stundenplan'); await w(400);
    const s1 = snap();
    setNow('2026-11-03T10:00:00'); document.dispatchEvent(new Event('visibilitychange')); await w(300);
    const s2 = snap(); r.followed = s1 !== s2;
    IDF_PLAN._nav(-1); await w(100); const s3 = snap();
    setNow('2026-11-10T10:00:00'); document.dispatchEvent(new Event('visibilitychange')); await w(300);
    r.manualKept = snap() === s3;
    NAV.home(); await w(100); NAV.go('v-plan', 'Stundenplan'); await w(400);
    r.resetOnShow = snap() !== s3;
    window.Date = Real;
    return r;
  });
  eq('Stundenplan: springt bei Datumswechsel zur aktuellen Woche, nach eigenem Blättern nicht', pf, { followed: true, manualKept: true, resetOnShow: true });

  // ── Woche/Monate: nur die Diagrammkarte wird ersetzt, der Rest der Startseite bleibt (keine neuen Animationen) ──
  const rg = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    NAV.home(); await w(300);
    const hello = document.querySelector('#v-home .m-hello'), mods = document.querySelector('#v-home .m-mods');
    SHELL.setRange('month'); await w(100);
    const r = { same: hello === document.querySelector('#v-home .m-hello') && mods === document.querySelector('#v-home .m-mods'), bars: document.querySelectorAll('#v-home .m-chart2 .m-pc').length };
    SHELL.setRange('week'); await w(100);
    r.back = document.querySelectorAll('#v-home .m-chart2 .m-pc').length;
    return r;
  });
  eq('Woche/Monate ersetzt nur das Diagramm', rg, { same: true, bars: 12, back: 7 });

  // ── Markierung → eigene Lernkarte ──
  await page.setViewportSize({ width: 1280, height: 860 });
  const hc = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    NAV.go('v-vak-verwaltungsrecht', 'VR'); await w(500);
    const p = [...document.querySelectorAll('#v-vak-verwaltungsrecht .acc-body p')].find(e => e.textContent.trim().length > 40);
    p.closest('details') && (p.closest('details').open = true);
    const rg = document.createRange(); rg.selectNodeContents(p); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
    document.dispatchEvent(new Event('selectionchange')); await w(400);
    const btn = document.querySelector('#m-hl-bar [data-a="card"]');
    r.btn = !!btn && !btn.hidden;
    btn && btn.click(); await w(200);
    const box = document.getElementById('cu-a');
    r.filled = !!box && box.value.length > 20 && box.value.trim() === p.textContent.replace(/\s+/g, ' ').trim().slice(0, 1500);
    r.mod = document.getElementById('cu-m').value;
    CUSTOM.close(); await w(100);
    return r;
  });
  eq('Markierung: „Als Lernkarte“ füllt Antwort und Modul vor', hc, { btn: true, filled: true, mod: 'VAk' });
  await page.setViewportSize({ width: 390, height: 844 });

  // ── Android-Widgets: Stundenplan-Einheiten für die App ──
  const wu = await page.evaluate(() => {
    let sent = null; window.BVIAndroid = { setSchedule: j => { sent = j; }, setWidgetStyle: () => {}, setIcon: () => {} };
    IDF_PLAN.pushWidget(); const u = JSON.parse(sent || '[]'); delete window.BVIAndroid;
    return { n: u.length, ok: u.every(x => x.s < x.e && typeof x.t === 'string' && 'r' in x), sorted: u.every((x, i) => !i || u[i - 1].s <= x.s) };
  });
  ok('Widget-Daten: Einheiten mit Beginn, Ende, Titel, Raum', wu.n > 20 && wu.ok && wu.sorted);

  // ── Abkürzungen antippen; Lernkarten teilen (Link und Code) ──
  const ab = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    NAV.go('v-hlfs-stab', 'Stab'); await w(500);
    const sp = document.querySelector('#v-hlfs-stab .abk-t');
    r.marked = !!sp; r.noDouble = (() => { const k = [...document.querySelectorAll('#v-hlfs-stab .abk-t')].map(e => e.dataset.k); return k.length > 1 && new Set(k).size === k.length; })();   // jede Abkürzung nur einmal je Seite
    sp.click(); await w(100);
    const pop = document.getElementById('abk-pop'); r.pop = !pop.hidden && pop.textContent.includes(sp.dataset.k);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await w(50); r.closed = pop.hidden;
    return r;
  });
  eq('Abkürzungen: jede nur beim ersten Vorkommen je Seite, Tipp zeigt Erläuterung', ab, { marked: true, noDouble: true, pop: true, closed: true });
  const sh = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    localStorage.removeItem('bvi_fc_custom'); CUSTOM.open(); await w(200);
    for (const [q, a] of [['Was ist <b>A</b>?', 'Antwort & Umlaute äöü'], ['Zweite Frage', 'x'.repeat(900)]]) { document.getElementById('cu-q').value = q; document.getElementById('cu-a').value = a; document.getElementById('cu-save').click(); }
    await w(100);
    r.n1 = JSON.parse(localStorage.getItem('bvi_fc_custom')).length;
    let link = null; Object.defineProperty(navigator, 'share', { value: o => { link = o.url; return Promise.resolve(); }, configurable: true });
    document.getElementById('cu-share').click(); await w(500);
    r.link = !!link && link.includes('?karten=BVIK');
    r.noMail = !document.getElementById('cu-mail');
    // andere Karten übernehmen: erst löschen, dann den Link einlesen
    localStorage.removeItem('bvi_fc_custom'); FLASHCARD_DATA.splice(FLASHCARD_DATA.findIndex(c => c.own), FLASHCARD_DATA.filter(c => c.own).length);
    document.getElementById('cu-code').value = 'Hier meine Karten: ' + link; document.getElementById('cu-fromcode').click(); await w(500);
    const back = JSON.parse(localStorage.getItem('bvi_fc_custom') || '[]'); r.n2 = back.length; r.q = back[0] && back[0].q;
    document.getElementById('cu-code').value = link; document.getElementById('cu-fromcode').click(); await w(300);
    r.dupe = JSON.parse(localStorage.getItem('bvi_fc_custom')).length;
    localStorage.removeItem('bvi_fc_custom'); CUSTOM.close(); delete navigator.share;
    return r;
  });
  eq('Lernkarten teilen: Link, Übernehmen, keine Doppelten, ohne E-Mail', sh, { n1: 2, link: true, noMail: true, n2: 2, q: 'Was ist &lt;b&gt;A&lt;/b&gt;?', dupe: 2 });

  // ── Eigener Stundenplan aus einer Kalenderdatei (.ics) ──
  const pi = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    const y = new Date().getFullYear() + 1, d = `${y}0106`;   // ein Dienstag/Montag im nächsten Jahr, damit "als Nächstes" etwas findet
    const ics = ['BEGIN:VCALENDAR', 'X-WR-CALNAME:Test-Plan', 'BEGIN:VEVENT', 'DTSTART:' + d + 'T080000', 'DTEND:' + d + 'T093000', 'SUMMARY:Mathe\\, Teil 1', 'LOCATION:Raum 12', 'RRULE:FREQ=WEEKLY;COUNT=3', 'END:VEVENT',
      'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:' + y + '0107', 'SUMMARY:Ausflug', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const res = IDF_PLAN.parseIcs(ics);
    r.parsed = [res.name, res.ev.length, res.ev[0].t, res.ev[0].r, (() => { const m = res.ev.filter(e => e.t.startsWith('Mathe')); return m[1].s - m[0].s === 7 * 864e5; })(), res.ev.some(e => e.ad === 1)];
    const f = new File([ics], 'x.ics');
    NAV.go('v-plan', 'Stundenplan'); await w(300);
    IDF_PLAN.importIcs(f); await w(500);
    r.custom = IDF_PLAN.isCustom();
    r.shown = /Mathe, Teil 1/.test(document.getElementById('plan-inner').innerText) || document.getElementById('plan-inner').innerText.length > 100;
    r.next = (IDF_PLAN.next() || {}).title;
    let sent = null; window.BVIAndroid = { setSchedule: j => { sent = j; }, setWidgetStyle() {}, setIcon() {} };
    IDF_PLAN.pushWidget(); const u = JSON.parse(sent || '[]'); delete window.BVIAndroid;
    r.units = [u.length, u.every(x => x.x === 1), u[0] && u[0].r];
    r.ics = /X-WR-CALNAME:Test-Plan/.test(IDF_PLAN.ics().text);
    IDF_PLAN.useSource('idf'); await w(300);
    r.back = [IDF_PLAN.isCustom(), /Gruppe 1/.test(document.getElementById('plan-inner').innerText)];
    localStorage.removeItem('bvi_plan_custom'); localStorage.setItem('bvi_plan_src', 'idf');
    return r;
  });
  eq('Eigener Plan: lesen, anzeigen, Widget-Daten, Export, zurück zum IdF-Plan', pi, { parsed: ['Test-Plan', 4, 'Mathe, Teil 1', 'Raum 12', true, true], custom: true, shown: true, next: 'Mathe, Teil 1', units: [3, true, 'Raum 12'], ics: true, back: [false, true] });

  // ── Jahrgänge: Liste, Master plus eigene Änderungen, Plan, Ergänzungen, Prüfungen, Glow, Export/Import ──
  const jl = await page.evaluate(() => {
    const L = d => JG.list(d), lab = l => l.map(x => x.label);
    return { a: lab(L(new Date(2026, 9, 21)))[0], b: lab(L(new Date(2026, 8, 30)))[0], c: lab(L(new Date(2039, 5, 15)))[0], n39: L(new Date(2039, 5, 15)).length, last: lab(L(new Date(2026, 9, 21))).pop(), master: JG.isMaster() };
  });
  eq('Jahrgangsliste endet beim neuesten begonnenen Jahrgang', jl, { a: 'BRef 10/2026 - AB 10/2027', b: 'BRef 04/2026 - AB 04/2027', c: 'BRef 04/2039 - AB 04/2040', n39: 29, last: 'BRef 04/2025 - AB 04/2026', master: true });
  const pt = await page.evaluate(() => {
    const d = JGUI.parsePlanText('Montag 26.10.\n08:00 - 09:30 Vorbeugender Brandschutz Raum B1-106\n09:45-11:15\nStabsarbeit\nDienstag 27.10.2026\n08:00 bis 09:30 Recht', new Date(2026, 9, 20));
    const q = JGUI.parseQuestions('1. Was ist ein ELW?\na) Einsatzleitwagen\nb) Löschfahrzeug\nc) Rüstwagen\n2. Welche Frist gilt?\nA. 35 Tage\nB. 52 Tage');
    return { n: d.length, first: [d[0].date, d[0].start, d[0].end, d[0].t, d[0].r], second: d[1].t, third: d[2].date, q: [q.length, q[0].q, q[0].o.length, q[0].c, q[1].o[1]] };
  });
  eq('Texterkennung: Termine und Fragen aus Text lesen', pt, { n: 3, first: ['2026-10-26', '08:00', '09:30', 'Vorbeugender Brandschutz', 'B1-106'], second: 'Stabsarbeit', third: '2026-10-27', q: [2, 'Was ist ein ELW?', 3, -1, '52 Tage'] });
  const jg = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {}, id = JG.list()[0].id;
    localStorage.removeItem('bvi_jgd_' + id);
    JG.set(id); await w(400);
    r.cur = JG.current() === id && !JG.isMaster();
    NAV.go('v-plan', 'Stundenplan'); await w(400);
    r.empty = /Noch kein Stundenplan/.test(document.getElementById('plan-inner').innerText) && IDF_PLAN.next() === null;
    // Plan von Hand eingeben
    JGUI.planEditor(); await w(200);
    document.getElementById('jg-add').click(); await w(100);
    const y = new Date().getFullYear() + 1, row = document.querySelector('.jg-row'), v = row.querySelectorAll('input');
    v[0].value = y + '-03-02'; v[1].value = '08:00'; v[2].value = '09:30'; v[3].value = 'Mathe <b>x</b>'; v[4].value = 'A1';
    document.getElementById('jg-save').click(); await w(400);
    r.plan = IDF_PLAN.isCustom() && !!IDF_PLAN.getPlan() && IDF_PLAN.getPlan().ev.length === 1 && IDF_PLAN.next().title.startsWith('Mathe');
    r.active = JG.data().aktiv === 'idf';
    // zweiter Abschnitt (VAk) mit eigenem Plan: erst nach „Als aktiv markieren“ nutzen ihn Startseite und Widgets
    IDF_PLAN.viewTab('vak'); await w(200);
    r.vakEmpty = /Noch kein Stundenplan für VAk/.test(document.getElementById('plan-inner').innerText);
    JGUI.planEditor(); await w(150); document.getElementById('jg-add').click(); await w(80);
    { const v2 = document.querySelector('.jg-row').querySelectorAll('input'); v2[0].value = y + '-03-02'; v2[1].value = '10:00'; v2[2].value = '11:00'; v2[3].value = 'Recht'; v2[4].value = 'B2'; }
    document.getElementById('jg-save').click(); await w(400);
    r.stillIdf = IDF_PLAN.next().title.startsWith('Mathe') && JSON.parse((() => { let s = null; window.BVIAndroid = { setSchedule: j => { s = j; }, setWidgetStyle() {}, setIcon() {} }; IDF_PLAN.pushWidget(); delete window.BVIAndroid; return s; })())[0].t.startsWith('Mathe');
    document.querySelector('.idf-act .btn-gold').click(); await w(400);
    r.nowVak = JG.data().aktiv === 'vak' && IDF_PLAN.next().title === 'Recht';
    IDF_PLAN.viewTab('idf'); await w(200);
    r.viewIdf = /Mathe/.test(document.getElementById('plan-inner').innerText) && IDF_PLAN.next().title === 'Recht';   // angezeigt: IdF, aktiv: VAk
    IDF_PLAN.setActive('idf'); await w(200);
    r.noHtml = !document.getElementById('plan-inner').innerHTML.includes('<b>x</b>');
    // Ergänzung auf einer Lernseite
    NAV.go('v-vak-verwaltungsrecht', 'VR'); await w(500);
    r.noPlusBefore = !document.querySelector('#v-vak-verwaltungsrecht .jg-add');
    document.querySelector('#v-vak-verwaltungsrecht .jg-be').click(); await w(200);
    document.querySelector('#v-vak-verwaltungsrecht .jg-add[data-k=erg]').click(); await w(200);
    document.getElementById('jg-et').value = 'Merksatz'; document.getElementById('jg-ex').value = 'Zeile 1\n\n<img src=x onerror=alert(1)>'; document.getElementById('jg-es').click(); await w(500);
    const e = document.querySelector('#v-vak-verwaltungsrecht .jg-e');
    r.erg = !!e && e.textContent.includes('Merksatz') && !e.querySelector('img[src="x"]');
    const l = JG.local(); r.ergSaved = l.erg.length === 1;
    e.querySelector('.jg-dl').click(); await w(300);
    r.ergDel = JG.local().erg.length === 0 && !document.querySelector('#v-vak-verwaltungsrecht .jg-e');
    // Prüfung hinzufügen, üben, entfernen, Glow
    NAV.tab('v-pruefung', 'Prüfung'); await w(400);
    r.tabs = document.querySelectorAll('#m-exam-list .m-col').length;
    JGUI.examEditor(null, 'vak'); await w(200);
    document.getElementById('jg-pt').value = 'Testprüfung';
    document.getElementById('jg-qa').click(); await w(50);
    let q = document.querySelector('.jg-q'); q.querySelector('.jg-qt').value = 'Was ist 1+1?';
    const os = q.querySelectorAll('.jg-o input[type=text]'); os[0].value = '1'; os[1].value = '2'; os[2].value = '3';
    q.querySelectorAll('input[type=radio]')[1].click();
    document.getElementById('jg-ps').click(); await w(500);
    r.own = /Testprüfung/.test(document.getElementById('m-exam-list').innerText);
    JGUI.openExam(JG.data().pr.hinzu[0].id); await w(400);
    document.querySelectorAll('.jg-opt')[1].click(); await w(100);
    r.ans = !!document.querySelector('.jg-opt.ok') && /Richtig/.test(document.querySelector('.jg-fb').textContent);
    NAV.tab('v-pruefung', 'Prüfung'); await w(300);
    JGUI.toggleEdit(); await w(200);
    const del = [...document.querySelectorAll('.jg-x')].length; r.xs = del > 3;
    JGUI.delExam('v-laufbahn-2023'); await w(300);
    r.hidden = !/Dez 2023/.test(document.getElementById('m-exam-list').innerText);
    JGUI.restoreExams(); await w(300);
    r.back = /Dez 2023/.test(document.getElementById('m-exam-list').innerText);
    // Glow: nur Reiter mit Glow liefern Module für Einsatzfahrt/Duell
    // einzelne Prüfung antippen (Bearbeiten-Modus): ★ wechselt, nicht der ganze Block
    const row0 = document.querySelector('.jg-rw'); const was = row0.classList.contains('hot');
    row0.querySelector('.m-row').click(); await w(300);
    r.tap = document.querySelector('.jg-rw').classList.contains('hot') === !was;
    document.querySelector('.jg-rw .m-row').click(); await w(300);
    ['v-klausur-0826', 'v-klausurfragen', 'v-eingrenzung-klausur', 'v-feuak-altklausur', 'v-simulator'].forEach(id => { if (JG.rel(id)) JGUI.setRel(id); }); await w(200);
    await PAUSE_LOADER.load();
    const F = PAUSE._fahrt();
    r.mods = F.MODS.map(m => m[0]).join(',');
    r.custom = F.questions().some(x => x.custom && x.m === 'VAk') && !F.baseQuestions().some(x => x.custom);
    JGUI.toggleEdit();
    // Export, Verwerfen, Import
    const txt = await JG.exportJson(), j = JSON.parse(txt);
    r.exp = j.format === 'bvi-jahrgang' && j.pr.hinzu.length === 1 && typeof j.rel === 'object' && j.plane.idf.ev.length === 1 && j.plane.vak.ev.length === 1 && j.aktiv === 'idf';
    JG.discard(); await w(100); r.disc = !JG.hasLocal();
    const n = await JG.importJson(txt); r.imp = n.pruefungen === 1 && n.plan === 2 && JG.hasLocal();
    let bad = false; try{ await JG.importJson('{"format":"x"}'); }catch(e){ bad = true; } r.bad = bad;
    // zurück zum Master
    JG.discard(); JG.set(JG.MASTER); await w(300); r.master = JG.isMaster() && IDF_PLAN.next() !== null;
    return r;
  });
  eq('Jahrgang: leerer Plan, Plan-Formular, Abschnitte, Ergänzung, eigene Prüfung, Glow, Export/Import', jg, { cur: true, empty: true, plan: true, active: true, vakEmpty: true, stillIdf: true, nowVak: true, viewIdf: true, noHtml: true, noPlusBefore: true, erg: true, ergSaved: true, ergDel: true, tabs: 5, own: true, ans: true, xs: true, hidden: true, back: true, tap: true, mods: 'VAk,IdF', custom: true, exp: true, disc: true, imp: true, bad: true, master: true });

  // ── Inhaltsseiten: Kapitel/Blöcke löschen, im Kapitel ergänzen, wiederherstellen ──
  const ch = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    JG.set(JG.list()[0].id); await w(300); JG.discard(); NAV.go('v-vak-verwaltungsrecht', 'VR'); await w(500);
    const pc = document.querySelector('#v-vak-verwaltungsrecht .pc'), n0 = pc.querySelectorAll('.acc-item:not(.jg-gone)').length;
    pc.querySelector('.jg-be').click(); await w(200);
    r.ctl = document.querySelectorAll('#v-vak-verwaltungsrecht .acc-item .jg-cx').length === n0 && document.querySelectorAll('#v-vak-verwaltungsrecht .jg-bx').length > 3;
    // Ergänzung im 2. Kapitel
    document.querySelectorAll('#v-vak-verwaltungsrecht .jg-in')[1].click(); await w(200);
    document.getElementById('jg-et').value = 'Mein Zusatz'; document.getElementById('jg-ex').value = 'Text'; document.getElementById('jg-es').click(); await w(500);
    r.inChap = !!document.querySelectorAll('#v-vak-verwaltungsrecht .acc-item')[1].querySelector('.jg-erg-k .jg-e');
    // Kapitel und Block löschen
    document.querySelector('#v-vak-verwaltungsrecht .jg-cx').click(); await w(300);
    r.gone = document.querySelectorAll('#v-vak-verwaltungsrecht .acc-item:not(.jg-gone)').length === n0 - 1;
    const b0 = document.querySelectorAll('#v-vak-verwaltungsrecht .info-card:not(.jg-gone)').length;
    document.querySelector('#v-vak-verwaltungsrecht .acc-item:not(.jg-gone) .jg-bx').click(); await w(300);
    r.block = document.querySelectorAll('#v-vak-verwaltungsrecht .info-card:not(.jg-gone)').length === b0 - 1 || document.querySelectorAll('#v-vak-verwaltungsrecht .def-box.jg-gone').length === 1;
    r.restoreBtn = /2 gelöschte/.test(document.querySelector('#v-vak-verwaltungsrecht .jg-br').textContent);
    document.querySelector('#v-vak-verwaltungsrecht .jg-br').click(); await w(300);
    r.back = document.querySelectorAll('#v-vak-verwaltungsrecht .jg-gone').length === 0 && n0 === document.querySelectorAll('#v-vak-verwaltungsrecht .acc-item').length;
    const j = JSON.parse(await JG.exportJson()); r.exp = Array.isArray(j.ausg) && !!j.erg[0].kap;
    JG.discard(); JG.set(JG.MASTER); await w(300);
    return r;
  });
  eq('Inhaltsseiten: Kapitel und Blöcke löschen, im Kapitel ergänzen, wiederherstellen', ch, { ctl: true, inChap: true, gone: true, block: true, restoreBtn: true, back: true, exp: true });

  // ── Master: nichts bearbeitbar, Farbverlauf nur bei den hervorgehobenen Prüfungen ──
  const ma = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    JG.set(JG.MASTER); await w(300);
    NAV.go('v-vak-verwaltungsrecht', 'VR'); await w(500);
    r.lesson = !document.querySelector('#v-vak-verwaltungsrecht .jg-be, #v-vak-verwaltungsrecht .jg-plus, #v-vak-verwaltungsrecht .jg-erg');
    NAV.tab('v-pruefung', 'Prüfung'); await w(400);
    r.exam = !document.querySelector('#m-exam-list .jg-tools2') && !document.querySelector('#m-exam-list .jg-plus');
    r.hot = document.querySelectorAll('#m-exam-list .jg-rw.hot').length;
    r.rows = document.querySelectorAll('#m-exam-list .jg-rw').length;
    NAV.go('v-settings', 'E'); await w(300);
    r.set = !document.getElementById('jg-exp') && !document.getElementById('jg-imp');
    NAV.go('v-plan', 'P'); await w(400);
    r.plan = !/Foto oder Screenshot|Termine von Hand|Kalenderdatei \(\.ics\)/.test(document.getElementById('v-plan').innerText);
    return r;
  });
  eq('Master: keine Bearbeitungsfelder, Farbverlauf nur bei hervorgehobenen Prüfungen', ma, { lesson: true, exam: true, hot: 6, rows: 12, set: true, plan: true });

  // ── Eigene Fragen direkt in einer Klausur; IdF-Pläne für Gruppe 1 und 2 ──
  const eq2 = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    JG.set(JG.list()[0].id); await w(300); JG.discard();
    NAV.go('v-vak-altklausur', 'VAk'); await w(600);
    r.noBtnBefore = !document.querySelector('#v-vak-altklausur .jg-add');
    document.querySelector('#v-vak-altklausur .jg-be').click(); await w(200);
    r.btn = !!document.querySelector('#v-vak-altklausur .jg-qbox .jg-add');
    document.querySelector('#v-vak-altklausur .jg-qbox .jg-add').click(); await w(200);
    r.onlyQ = !!document.getElementById('jg-pt') && !document.getElementById('jg-et');
    r.hideName = document.getElementById('jg-pt').closest('label').style.display === 'none';
    document.getElementById('jg-qa').click(); await w(50);
    const q = document.querySelector('.jg-q'); q.querySelector('.jg-qt').value = 'Eigene Klausurfrage?';
    const os = q.querySelectorAll('.jg-o input[type=text]'); os[0].value = 'A'; os[1].value = 'B';
    q.querySelectorAll('input[type=radio]')[0].click();
    document.getElementById('jg-ps').click(); await w(500);
    const p = JG.data().pr.hinzu[0];
    r.saved = !!p && p.seite === 'v-vak-altklausur' && p.tab === 'vak' && /1 eigene Frage/.test(document.querySelector('#v-vak-altklausur .jg-qbox').innerText);
    NAV.tab('v-pruefung', 'Prüfung'); await w(300);
    r.notListed = !/Eigene Klausurfrage|Eigene Fragen ·/.test(document.getElementById('m-exam-list').innerText);
    await PAUSE_LOADER.load();
    r.feeds = PAUSE._fahrt().questions().some(x => x.custom && x.q === 'Eigene Klausurfrage?');
    JGUI.setRel('v-vak-altklausur'); await w(100);
    r.offWhenIrrelevant = !PAUSE._fahrt().questions().some(x => x.custom && x.q === 'Eigene Klausurfrage?');
    JGUI.setRel('v-vak-altklausur');
    JGUI.examEditor(p.id, null, 'v-vak-altklausur'); await w(200);
    document.querySelector('.jg-qd').click(); await w(50); document.getElementById('jg-ps').click(); await w(400);
    r.removed = JG.data().pr.hinzu.length === 0;
    // IdF: zwei Pläne
    NAV.tab('v-plan', 'Plan'); await w(300);
    const mk = (d, t) => ({ name: t, ev: [{ s: new Date(2099, 0, d, 8, 0).getTime(), e: new Date(2099, 0, d, 9, 0).getTime(), t, r: '', n: '', ad: 0 }] });
    IDF_PLAN.viewTab('idf', true); IDF_PLAN.savePlan(mk(5, 'G1-Termin')); await w(200);
    r.grpUi = !!document.querySelector('#v-plan .idf-gr') && document.querySelectorAll('#v-plan .idf-gr button').length === 2;
    IDF_PLAN.viewTab('idf2', true); IDF_PLAN.savePlan(mk(6, 'G2-Termin')); await w(200);
    const d = JG.data(); r.two = d.plane.idf.ev[0].t === 'G1-Termin' && d.plane.idf2.ev[0].t === 'G2-Termin';
    IDF_PLAN.viewTab('idf'); await w(200); r.back2 = /Gruppe 2/.test(document.querySelector('#v-plan .idf-gr .active').textContent);
    IDF_PLAN.setActive('idf2'); await w(200); const nx = IDF_PLAN.next(); r.act2 = !!nx && /G2-Termin/.test(JSON.stringify(nx));
    JG.discard(); JG.set(JG.MASTER); await w(300);
    return r;
  });
  eq('Eigene Fragen in Klausuren; IdF-Pläne für Gruppe 1 und 2', eq2, { noBtnBefore: true, btn: true, onlyQ: true, hideName: true, saved: true, notListed: true, feeds: true, offWhenIrrelevant: true, removed: true, grpUi: true, two: true, back2: true, act2: true });

  // ── Auswahlfragen, eigenes Kapitel, Jahrgang einrichten (Termine, Link, Standorte, Lernkarten) ──
  const su = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    const setv = (id, v) => { const el = document.getElementById(id); el.value = v; };
    JG.set(JG.list()[0].id); await w(300); JG.discard();
    NAV.go('v-vak-verwaltungsrecht', 'VR'); await w(600);
    document.querySelector('#v-vak-verwaltungsrecht .jg-be').click(); await w(200);
    // Single-Choice
    document.querySelector('#v-vak-verwaltungsrecht .jg-add[data-k=erg]').click(); await w(200);
    document.querySelector('.jg-ty [data-t=sc]').click(); await w(50);
    setv('jg-cq', 'Was ist 2+2?'); const ot = document.querySelectorAll('.jg-ot'); ot[0].value = '3'; ot[1].value = '4'; ot[2].value = '5';
    document.querySelectorAll('.jg-ok')[1].click(); document.getElementById('jg-ce').value = 'Rechnen'; document.getElementById('jg-es').click(); await w(400);
    let card = document.querySelector('#v-vak-verwaltungsrecht .jg-ch');
    card.querySelectorAll('input')[0].click(); card.querySelector('.jg-ck').click(); await w(100);
    r.scBad = card.querySelector('.jg-cf').classList.contains('bad');
    card.querySelectorAll('input')[1].click(); card.querySelector('.jg-ck').click(); await w(100);
    r.scOk = card.querySelector('.jg-cf').classList.contains('ok') && card.querySelector('input').type === 'radio';
    // Multiple-Choice
    document.querySelector('#v-vak-verwaltungsrecht .jg-add[data-k=erg]').click(); await w(200);
    document.querySelector('.jg-ty [data-t=mc]').click(); await w(50);
    setv('jg-cq', 'Welche sind Primzahlen?'); const o2 = document.querySelectorAll('.jg-ot'); o2[0].value = '2'; o2[1].value = '4'; o2[2].value = '5';
    document.querySelectorAll('.jg-ok')[0].click(); document.querySelectorAll('.jg-ok')[2].click(); document.getElementById('jg-es').click(); await w(400);
    const l = JG.data().erg.filter(e => e.typ === 'mc')[0];
    r.mc = !!l && l.c.length === 2 && JSON.stringify(l.c) === '[0,2]';
    // Eigenes Kapitel
    document.querySelector('#v-vak-verwaltungsrecht .jg-add[data-k=kap]').click(); await w(200);
    r.kapNoTypes = !document.querySelector('.jg-ty');
    setv('jg-et', 'Mein Kapitel'); setv('jg-ex', 'Inhalt'); document.getElementById('jg-es').click(); await w(500);
    r.kap = !!document.querySelector('#v-vak-verwaltungsrecht .acc-item.jg-kap');
    // Einrichten: Termine
    JGUI.checklist(); await w(200);
    document.querySelector('.jg-ck-i button[data-a=termine]').click(); await w(200);
    document.getElementById('jg-tm-add').click(); await w(50);
    document.querySelector('.jg-td').value = '2099-05-04'; document.querySelector('.jg-tn').value = 'Meine Klausur'; document.getElementById('jg-tm-s').click(); await w(300);
    r.termine = JG.data().termine.length === 1;
    NAV.tab('v-pruefung', 'Prüfung'); await w(500);
    r.countdown = /Meine Klausur/.test(document.getElementById('m-countdown').innerText);
    NAV.tab('v-home', 'Start'); await w(500);
    // Link
    r.noCloud = !document.querySelector('#m-home .m-cloud');
    document.querySelector('.jg-ck-i button[data-a=link]').click(); await w(200);
    setv('jg-lu', 'http://unsicher.de'); document.getElementById('jg-ls').click(); await w(100);
    r.httpsOnly = !JG.data().links.cloud;
    setv('jg-lu', 'https://beispiel.de/cloud'); setv('jg-lt', 'Unsere Cloud'); document.getElementById('jg-ls').click(); await w(400);
    r.cloud = !!document.querySelector('#m-home .m-cloud a[href="https://beispiel.de/cloud"]') && /Unsere Cloud/.test(document.querySelector('#m-home .m-cloud').innerText);
    // Standorte
    document.querySelector('.jg-ck-i button[data-a=orte]').click(); await w(200);
    document.querySelector('.jg-ort[data-k=vak]').value = 'Köln'; document.getElementById('jg-os').click(); await w(300);
    NAV.go('v-jahr2', '2. Jahr'); await w(500);
    r.orte = [...document.querySelectorAll('#v-jahr2 .tile-name')].some(x => x.textContent === 'VAk Köln');
    // Lernkarten
    document.querySelector('.jg-ck-i button[data-a=karten]').click(); await w(200);
    setv('jg-kq', 'Testfrage?'); setv('jg-ka', 'Testantwort'); document.getElementById('jg-ks').click(); await w(300);
    r.karte = JG.data().karten.length === 1 && FLASHCARD_DATA.some(c => c.jg && /Testfrage/.test(c.q));
    // Export enthält alles; Verwerfen räumt auf
    const j = JSON.parse(await JG.exportJson());
    r.exp = j.termine.length === 1 && !!j.links.cloud && j.orte.vak === 'Köln' && j.karten.length === 1 && j.erg.some(e => e.typ === 'mc') && j.erg.some(e => e.typ === 'kapitel');
    JG.discard(); await w(300);
    r.clean = !FLASHCARD_DATA.some(c => c.jg) && JG.data().termine.length === 0;
    JG.set(JG.MASTER); await w(300);
    return r;
  });
  eq('Auswahlfragen, Kapitel, Jahrgang einrichten', su, { scBad: true, scOk: true, mc: true, kapNoTypes: true, kap: true, termine: true, countdown: true, noCloud: true, httpsOnly: true, cloud: true, orte: true, karte: true, exp: true, clean: true });

  // ── Veröffentlichte Jahrgangs-Datei (jahrgaenge/<ID>.json) wird mit den eigenen Änderungen zusammengeführt ──
  const jid = await page.evaluate(() => JG.list()[0].id);
  await page.route('**/jahrgaenge/' + jid + '.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ format: 'bvi-jahrgang', v: 1, erg: [{ id: 'pub1', seite: 'v-vak-verwaltungsrecht', titel: 'Vom Jahrgang', text: '<script>x</script>' }], pr: { hinzu: [], weg: ['v-laufbahn-2023'] }, rel: { 'v-vak-altklausur': false } }) }));
  const pu = await page.evaluate(async id => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    localStorage.removeItem('bvi_jgd_' + id); JG.set(id); await w(800);
    const d = JG.data(), r = { erg: d.erg.map(e => e.id), weg: d.pr.weg, rel: JG.rel('v-vak-altklausur'), relOther: JG.rel('v-vak-fallbearbeitung') };
    NAV.go('v-vak-verwaltungsrecht', 'VR'); await w(500);
    r.shown = !!document.querySelector('#v-vak-verwaltungsrecht .jg-e') && !document.querySelector('#v-vak-verwaltungsrecht .jg-e script');
    JG.set(JG.MASTER); await w(300);
    return r;
  }, jid);
  eq('Jahrgangs-Datei aus dem Ordner wird übernommen', pu, { erg: ['pub1'], weg: ['v-laufbahn-2023'], rel: false, relOther: true, shown: true });
  await page.unroute('**/jahrgaenge/' + jid + '.json');

  // ── Startseiten-Diagramm passt auf dem Touch-Handy in die Karte (Woche und Monate) ──
  const tctx = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
  const tp = await tctx.newPage();
  await tp.addInitScript(() => localStorage.setItem('bvi_onboarded', '1'));
  await tp.goto(BASE, { waitUntil: "load" });
  await tp.waitForTimeout(800);
  const chart = {};
  for (const m of ['Woche', 'Monate']) {
    chart[m] = await tp.evaluate(async m => {
      [...document.querySelectorAll('.m-seg button')].find(b => b.textContent.trim() === m).click();
      await new Promise(r => setTimeout(r, 300));
      const pl = document.querySelector('.m-plot'), pr = pl.getBoundingClientRect();
      return [...pl.querySelectorAll('.m-pc')].filter(e => { const q = e.getBoundingClientRect(); return q.right > pr.right + 1 || q.left < pr.left - 1 || q.right > innerWidth; }).length;
    }, m);
  }
  eq('Diagramm Woche/Monate ragt nicht über den Rand (Touch, 360 px)', chart, { Woche: 0, Monate: 0 });
  await tctx.close();

  for (const e of errors) fails.push('JavaScript-Fehler: ' + e);
  await browser.close();
  if (fails.length) { console.error('FEHLER:\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log(`OK: ${checks} Prüfungen der App-Logik bestanden`);
})();
