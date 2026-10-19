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

  for (const e of errors) fails.push('JavaScript-Fehler: ' + e);
  await browser.close();
  if (fails.length) { console.error('FEHLER:\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log(`OK: ${checks} Prüfungen der App-Logik bestanden`);
})();
