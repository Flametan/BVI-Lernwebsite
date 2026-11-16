const { chromium, devices } = require('playwright');
/* IdF-Spiel – automatischer Durchlauf (Playwright): Start, Laufen, Kollision, Treppe, Menü, alle Aufgaben von Level 1, Speichern.
   Aufruf: python3 -m http.server 8765 (im Repo-Ordner), dann node game/tests/smoke.cjs [Ordner für Screenshots] */
const S = process.argv[2] || require('os').tmpdir();
let bad = 0;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [nm, opt] of [['phone', { viewport: { width: 412, height: 800 }, colorScheme: 'dark', hasTouch: true, isMobile: true }], ['desk', { viewport: { width: 1280, height: 800 }, colorScheme: 'light' }]]) {
    const ctx = await b.newContext({ ...opt, deviceScaleFactor: 2, serviceWorkers: 'block' });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGE ' + e.message));
    await p.goto('http://localhost:8765/game/index.html'); await p.waitForTimeout(500);
    const cards = await p.locator('.card').count();
    await p.screenshot({ path: S + '/g-home-' + nm + '.png' });
    await p.click('.card[data-m="begehung"]'); await p.waitForSelector('.lv');
    const locked = await p.locator('.lv[disabled]').count();
    await p.click('.lv >> nth=0'); await p.waitForTimeout(1200);
    await p.screenshot({ path: S + '/g-play-' + nm + '.png' });
    // Laufen: Taste W halten, die Figur muss sich bewegen; gegen die Wand darf sie nicht hindurch
    const p0 = await p.evaluate(() => ({ ...window.GAME_RUN._pos }));
    await p.keyboard.down('w'); await p.waitForTimeout(700); await p.keyboard.up('w');
    const p1 = await p.evaluate(() => ({ ...window.GAME_RUN._pos }));
    await p.keyboard.down('a'); await p.waitForTimeout(2500); await p.keyboard.up('a');
    const p2 = await p.evaluate(() => ({ ...window.GAME_RUN._pos }));
    const f0 = await p.evaluate(() => window.GAME_RUN._stage.frames()); await p.waitForTimeout(1000);
    const fps = (await p.evaluate(() => window.GAME_RUN._stage.frames())) - f0;
    // Pausenmenü: Esc hält an, Einstellungen werden gespeichert, Weiter läuft weiter
    await p.keyboard.press('Escape'); await p.waitForTimeout(150); const menu = await p.isVisible('#menu');
    const fa = await p.evaluate(() => window.GAME_RUN._stage.frames()); await p.waitForTimeout(300); const fb2 = await p.evaluate(() => window.GAME_RUN._stage.frames());
    await p.selectOption('#o-qual', 'niedrig'); const pr = await p.evaluate(() => window.GAME_RUN._stage.pixelRatio());
    await p.selectOption('#o-qual', 'auto'); await p.click('#m-resume'); await p.waitForTimeout(300);
    const fc = await p.evaluate(() => window.GAME_RUN._stage.frames());
    const menuOk = menu && fb2 === fa && fc > fb2 && pr <= 0.75;
    // Treppe: Geschoss wechseln
    await p.evaluate(() => { const r = window.GAME_RUN; r._pos.x = 2.5; r._pos.z = 10; }); await p.waitForTimeout(200);
    const fl0 = await p.evaluate(() => window.GAME_RUN._floor()); const upVis = await p.isVisible('#up');
    await p.click('#up'); await p.waitForTimeout(450); const fl1 = await p.evaluate(() => window.GAME_RUN._floor());
    // Aufgaben: zur Säule stellen und prüfen
    const n = await p.evaluate(() => window.GAME_RUN._tasks.length); let q = '', fb = '';
    for (let i = 0; i < n; i++) {
      await p.evaluate(i => window.GAME_RUN._goto(i), i); await p.waitForTimeout(200);
      if (!(await p.isVisible('#act'))) { errs.push('Aufgabe ' + i + ': kein Prüfen-Knopf'); continue; }
      if (i === 0) { await p.screenshot({ path: S + '/g-near-' + nm + '.png' }); await p.click('#act'); } else await p.keyboard.press('e');
      await p.waitForSelector('#sheet:not([hidden])');
      const a = await p.evaluate(i => window.GAME_RUN._tasks[i].a, i);
      if (i === 0) { q = await p.textContent('#q-title'); await p.screenshot({ path: S + '/g-ask-' + nm + '.png' }); await p.click('.opt:text-is("DS")'); }
      await p.click('.opt:text-is("' + a.richtig + '")'); if (i === 0) fb = await p.textContent('#q-fbt');
      await p.click('#q-next'); await p.waitForTimeout(100);
    }
    await p.waitForTimeout(700);
    const res = await p.isVisible('#result'), title = res ? await p.textContent('#r-title') : '', rp = res ? await p.textContent('#r-pts') : '';
    await p.screenshot({ path: S + '/g-result-' + nm + '.png' });
    await p.reload(); await p.waitForTimeout(400);
    const total = await p.textContent('#st-total'), badges = await p.locator('.badge.on').count();
    await p.click('.card[data-m="begehung"]'); await p.waitForSelector('.lv');
    const locked2 = await p.locator('.lv[disabled]').count();
    const ok = cards === 9 && locked === 4 && p1.z < p0.z - 1 && p2.x > 0.5 && menuOk && upVis && fl1 === fl0 + 1 && res && title === 'Bestanden' && total === '850' && badges === 1 && locked2 === 3 && !errs.length;
    if(!ok) bad++;
    console.log((ok ? 'OK   ' : 'FEHLER ') + nm, JSON.stringify({ cards, locked, p0, p1, p2, fps, menuOk, upVis, fl0, fl1, q, fb, res, title, rp, total, badges, locked2, errs }));
    await ctx.close();
  }
  await b.close();
  process.exit(bad ? 1 : 0);
})();
