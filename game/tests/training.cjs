/* IdF-Spiel – Training (Playwright): Wiederholung fälliger Aufgaben (aus Begehung, Stab und Quiz), Prüfung mit 20 Fragen und Note, Bestenliste.
   Aufruf: python3 -m http.server 8765 (im Repo-Ordner), dann node game/tests/training.cjs [Ordner für Screenshots] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const S = process.argv[2] || require('os').tmpdir();
const D = m => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', m + '.json'), 'utf8'));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); let bad = 0;
  const ctx = await b.newContext({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', x => { if (x.type() === 'error') errs.push(x.text()); }); p.on('pageerror', e => errs.push('PAGE ' + e.message));
  // Vier fällige Aufgaben: Begehung, Meldung im Stab, Quizfrage, Gespräch; dazu eine, die es nicht mehr gibt (wird verworfen), und eine, die erst später fällig ist
  const w = {}, add = (m, l, f, d) => { w[m + '|' + l + '|' + f] = { m, l, f, s: 0, d: d || '2020-01-01' }; };
  add('begehung', 0, D('begehung').level[0].aufgaben[0].frage); add('stab', 0, D('stab').level[0].aufgaben[0].frage); add('vak', 1, D('vak').level[1].aufgaben[2].frage);
  add('ibk', 0, D('ibk').level[0].aufgaben.find(a => a.typ === 'gespraech').frage); add('vak', 0, 'Diese Frage gibt es nicht mehr'); add('vak', 2, D('vak').level[2].aufgaben[0].frage, '2999-01-01');
  await p.addInitScript(w => { if (!localStorage.getItem('bvi_game_v1')) localStorage.setItem('bvi_game_v1', JSON.stringify({ v: 1, m: {}, badges: [], tag: { last: '', serie: 0 }, opt: { fx: 'aus', sprache: false, name: 'Test' }, wdh: w })); }, w);
  const pick = async t => { const i = await p.evaluate(t => [...document.querySelectorAll('#q-opts .opt')].findIndex(b => (b.textContent === t || b.textContent.replace(/^\d+\. /, '') === t)), t); if (i < 0) throw new Error('Option fehlt: ' + t); await p.click('#q-opts .opt >> nth=' + i); };
  async function durchlauf() {
    await p.waitForFunction(() => window.GAME_RUN && window.GAME_RUN._stage.frames() > 2, null, { timeout: 40000 });
    await p.click('#brief-ok'); let n = 0;
    for (let guard = 0; guard < 40; guard++) {
      const nx = await p.evaluate(() => window.GAME_RUN._next()); if (!nx) break;
      const name = await p.evaluate(x => window.GAME_RUN._goto(x.typ, x.ziel), nx);
      await p.waitForFunction(n => window.GAME_RUN._near() === n && !document.getElementById('act').hidden, name, { timeout: 30000, polling: 50 });
      await p.keyboard.press('e'); await p.waitForSelector('#sheet:not([hidden])'); const a = nx.a; n++;
      if (a.typ === 'mc') await pick(a.richtig);
      else if (a.typ === 'multi') { for (const t of a.richtig) await pick(t); await p.click('#q-check'); }
      else if (a.typ === 'gespraech') { for (let z = 0; z < a.zuege.length; z++) { await p.click('#q-opts .opt >> nth=' + a.zuege[z].optionen.findIndex(o => o.gut)); if (z < a.zuege.length - 1) await p.click('#q-check'); } }
      else for (const t of a.richtig) await pick(t);
      await p.waitForSelector('#q-fb:not([hidden])'); if (!/^Richtig\. /.test(await p.textContent('#q-fbt'))) errs.push('nicht als richtig gewertet: ' + a.frage);
      await p.click('#q-next');
    }
    await p.waitForSelector('#result:not([hidden])', { timeout: 15000 }); return n;
  }
  try {
    await p.goto('http://localhost:8765/game/index.html'); await p.waitForSelector('#training .card');
    const vorher = await p.textContent('#training .card[data-t="wdh"] p'); await p.screenshot({ path: S + '/t-home.png' });
    await p.click('#training .card[data-t="wdh"]'); const nW = await durchlauf(); const tW = await p.textContent('#r-title'); await p.screenshot({ path: S + '/t-wdh.png' });
    await p.click('#r-list'); const nachher = await p.textContent('#training .card[data-t="wdh"] p');
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('bvi_game_v1')));
    const stufen = Object.values(st.wdh).filter(e => e.d < '2999').map(e => e.s).join('');
    await p.click('#training .card[data-t="pruefung"]'); const nP = await durchlauf(); const tP = await p.textContent('#r-title'); await p.screenshot({ path: S + '/t-pruefung.png' });
    await p.click('#r-list'); await p.click('#training .card[data-t="rang"]'); const rang = await p.textContent('#rang-p li'); await p.screenshot({ path: S + '/t-rang.png' });
    const ok = /^5 Aufgaben sind fällig/.test(vorher) && nW === 4 && tW === 'Wiederholung beendet' && /^Nichts fällig/.test(nachher) && stufen === '1111' && nP === 20 && tP === 'Note 1 (sehr gut)' && /Test.*100 %.*Note 1/.test(rang) && !errs.length;
    if (!ok) bad++;
    console.log((ok ? 'OK   ' : 'FEHLER ') + 'training', JSON.stringify({ vorher, nW, tW, nachher, stufen, nP, tP, rang, errs }));
  } catch (e) { bad++; console.log('FEHLER training', e.message.split('\n')[0], JSON.stringify(errs)); await p.screenshot({ path: S + '/t-fehler.png' }); }
  await b.close(); process.exit(bad ? 1 : 0);
})();
