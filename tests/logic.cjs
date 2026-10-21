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
  ok('Befehlspalette: Kapitel und Aktionen', dk.pal.includes('Kapitel dieser Seite') && dk.pal.includes('Aktionen'));
  ok('Lernkarten-Fenster ein- und ausblendbar', dk.prac && dk.pracOff);
  ok('Fokus-Lesemodus mit Pfeiltasten und Esc', dk.focus && /02 \/ 07/.test(dk.next) && dk.closed);
  await page.setViewportSize({ width: 390, height: 844 });

  // ── Kleine Pause: Startseiten-Karte, Spiele, Einsatzfahrt ──
  const pz = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), r = {};
    NAV.home(); await w(300);
    r.card = (document.querySelector('#m-home .m-pause .m-t2') || {}).textContent || '';
    r.quips = PAUSE_LOADER.QUIPS.length;
    r.emoji = PAUSE_LOADER.QUIPS.some(q => /\p{Extended_Pictographic}/u.test(q));
    NAV.go('v-pause', 'Kleine Pause'); await PAUSE_LOADER.load(); await w(300);
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
  ok('Kleine Pause: Karte auf der Startseite mit Satz', pz.card.length > 10);
  eq('Kleine Pause: 50 Sätze ohne Emojis', [pz.quips, pz.emoji], [50, false]);
  eq('Kleine Pause: 7 Einträge (Einsatzfahrt, Duell und fünf weitere Spiele)', pz.games, 7);
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

  for (const e of errors) fails.push('JavaScript-Fehler: ' + e);
  await browser.close();
  if (fails.length) { console.error('FEHLER:\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log(`OK: ${checks} Prüfungen der App-Logik bestanden`);
})();
