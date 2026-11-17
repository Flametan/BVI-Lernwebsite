/* Simulationen – Stufen, Einführung, Bildrate, Abgleich (Playwright).
   Geprüft: Einführung beim ersten Start (und nur dann), Stufe „Lernen“ (Tipp-Knopf, keine Frist), Stufe „Ernstfall“ (ein Versuch, keine Minikarte),
   Anzeige der Bildrate, Zusammenführen zweier Spielstände in js/sync.js.
   Aufruf: python3 -m http.server 8765 (im Repo-Ordner), dann node game/tests/stufen.cjs [Ordner für Screenshots] */
const { chromium, devices } = require('playwright');
const S = process.argv[2] || require('os').tmpdir();
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); let bad = 0;
  const melde = (ok, was, info) => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'FEHLER ') + was, info === undefined ? '' : JSON.stringify(info)); };
  const neu = async (opt, dev) => {
    const ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, dev || { viewport: { width: 1100, height: 700 }, deviceScaleFactor: 1 })); const p = await ctx.newPage(); p.errs = [];
    p.on('console', x => { if (x.type() === 'error') p.errs.push(x.text()); }); p.on('pageerror', e => p.errs.push('PAGE ' + e.message));
    await p.addInitScript(([opt]) => { const ms = { stab: {} }; for (let i = 0; i < 5; i++) ms.stab[i] = { best: 1, ok: true };
      localStorage.setItem('bvi_game_v1', JSON.stringify({ v: 1, m: ms, badges: ['erste'], tag: { last: '', serie: 0 } })); localStorage.setItem('bvi_game_opt', JSON.stringify(opt)); }, [opt]);
    await p.goto('http://localhost:8765/game/index.html?m=stab'); await p.waitForSelector('.lv'); return p;
  };
  const start = async (p, lv) => { await p.click('.lv >> nth=' + lv); await p.waitForFunction(() => window.GAME_RUN && window.GAME_RUN._stage.frames() > 2, null, { timeout: 40000 }); if (await p.isVisible('#brief')) await p.click('#brief-ok'); };
  const hin = async p => { let nx = null; for (let i = 0; i < 40 && !nx; i++) { nx = await p.evaluate(() => window.GAME_RUN._next()); if (!nx) await p.waitForTimeout(250); }
    const name = await p.evaluate(x => window.GAME_RUN._goto(x.typ, x.ziel), nx); await p.waitForFunction(n => window.GAME_RUN._near() === n && !document.getElementById('act').hidden, name, { timeout: 30000, polling: 50 });
    await p.keyboard.press('e'); await p.waitForSelector('#sheet:not([hidden])'); return nx.a; };

  // 1 Einführung beim ersten Start, auf dem Handy
  let p = await neu({ fx: 'aus', sprache: false }, devices['iPhone 13']);
  await p.screenshot({ path: S + '/st-stufe-wahl.png' });
  melde(await p.locator('#lv-stufe button').count() === 3, 'Stufenwahl sichtbar');
  await start(p, 5); await p.waitForSelector('#coach:not([hidden])', { timeout: 8000 }).catch(() => {});
  melde(await p.isVisible('#coach'), 'Einführung erscheint beim ersten Start', await p.textContent('#coach-n').catch(() => ''));
  await p.screenshot({ path: S + '/st-einfuehrung.png' });
  await p.click('#coach-x'); melde(!(await p.isVisible('#coach')) && await p.evaluate(() => JSON.parse(localStorage.getItem('bvi_game_opt')).tut === true), 'Einführung lässt sich überspringen und kommt nicht wieder');
  melde(!p.errs.length, 'keine Fehler (Handy)', p.errs); await p.context().close();

  // 2 Lernen: Tipp-Knopf, keine Frist
  p = await neu({ fx: 'aus', sprache: false, tut: true, stufe: 'lernen' }); await start(p, 5);
  let a = await hin(p);
  melde(await p.isVisible('#q-tipp'), 'Lernen: Tipp-Knopf sichtbar'); melde(await p.evaluate(() => window.GAME_RUN._fristen.size === 0), 'Lernen: keine Fristen');
  await p.click('#q-tipp'); melde(await p.locator('#q-opts .opt.weg').count() === 1, 'Lernen: Tipp streicht eine falsche Möglichkeit'); await p.screenshot({ path: S + '/st-lernen.png' });
  const i2 = await p.evaluate(t => [...document.querySelectorAll('#q-opts .opt')].findIndex(x => x.textContent === t), a.optionen.find(o => o.wert === 2).t); await p.click('#q-opts .opt >> nth=' + i2);
  await p.waitForSelector('#q-fb:not([hidden])'); melde(/halbe Punkte/.test(await p.textContent('#q-fbt')), 'Lernen: mit Tipp halbe Punkte');
  melde(!p.errs.length, 'keine Fehler (Lernen)', p.errs); await p.context().close();

  // 3 Ernstfall: keine Minikarte, ein Versuch, Bildrate
  p = await neu({ fx: 'aus', sprache: false, tut: true, stufe: 'ernst', fps: true, karte: true }); await start(p, 1);
  melde(!(await p.isVisible('#karte')), 'Ernstfall: keine Minikarte'); await p.waitForTimeout(1500);
  melde(await p.isVisible('#fps') && /\d/.test(await p.textContent('#fps')), 'Bildrate wird angezeigt', await p.textContent('#fps'));
  a = await hin(p);
  if (a.typ === 'mc') { const i = await p.evaluate(r => [...document.querySelectorAll('#q-opts .opt')].findIndex(x => x.textContent !== r), a.richtig); await p.click('#q-opts .opt >> nth=' + i);
    await p.waitForSelector('#q-fb:not([hidden])', { timeout: 4000 }).catch(() => {}); melde(await p.isVisible('#q-fb'), 'Ernstfall: nach einem Fehlversuch ist die Aufgabe entschieden'); }
  else melde(true, 'Ernstfall: erste Aufgabe ist keine Auswahlfrage, Prüfung übersprungen', a.typ);
  await p.screenshot({ path: S + '/st-ernst.png' }); melde(!p.errs.length, 'keine Fehler (Ernstfall)', p.errs); await p.context().close();

  // 4 Abgleich: zwei Spielstände zusammenführen
  const ctx = await b.newContext({ serviceWorkers: 'block' }); p = await ctx.newPage(); await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => typeof SYNC !== 'undefined');
  const r = await p.evaluate(() => {
    const A = { v: 1, m: { stab: { 0: { best: 500, ok: true }, 1: { best: 100, ok: false } } }, badges: ['erste'], tag: { last: '2026-11-10', serie: 2 }, rang: { level: [{ n: 'A', d: '2026-11-10', p: 500, w: 'x' }] } };
    const B = { v: 1, m: { stab: { 0: { best: 300, ok: false }, 1: { best: 400, ok: true, ernst: true } } }, badges: ['erste', 'stab'], tag: { last: '2026-11-12', serie: 1 }, rang: { level: [{ n: 'B', d: '2026-11-12', p: 400, w: 'y' }, { n: 'A', d: '2026-11-10', p: 500, w: 'x' }] } };
    const out = SYNC.merge({ bvi_game_v1: JSON.stringify(A) }, {}, { bvi_game_v1: JSON.stringify(B) }); return { g: JSON.parse(out.bvi_game_v1), track: SYNC.TRACK.test('bvi_game_v1'), opt: SYNC.TRACK.test('bvi_game_opt') };
  });
  const g = r.g, s = g.m.stab;
  melde(r.track && !r.opt, 'Abgleich: Spielstand wird abgeglichen, Geräte-Einstellungen nicht');
  melde(s[0].best === 500 && s[0].ok === true && s[1].best === 400 && s[1].ok === true && s[1].ernst === true, 'Abgleich: bestanden bleibt bestanden, Bestwert gewinnt', s);
  melde(g.rang.level.length === 2 && g.rang.level[0].p === 500 && g.badges.includes('stab'), 'Abgleich: Bestenlisten zusammengelegt, ohne Doppelte', g.rang.level);
  await ctx.close(); await b.close(); process.exit(bad ? 1 : 0);
})();
