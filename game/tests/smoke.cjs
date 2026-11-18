const { chromium, devices } = require('playwright');
/* IdF-Spiel – automatischer Durchlauf (Playwright): Start, Auftrag, Laufen, Kollision, Treppe, Menü, alle Aufgaben von Level 1, Speichern, Wiederholung vorgemerkt.
   Aufruf: python3 -m http.server 8765 (im Repo-Ordner), dann node game/tests/smoke.cjs [Ordner für Screenshots] */
const S = process.argv[2] || require('os').tmpdir();
let bad = 0;
// Taste halten, bis die Bedingung gilt (unabhängig von der Bildrate; Software-Grafik im Test ist langsam)
async function hold(p, key, cond, max){ await p.keyboard.down(key); try{ await p.waitForFunction(cond, null, { timeout: max || 40000, polling: 100 }); return true; }catch(e){ return false; } finally { await p.keyboard.up(key); } }
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [nm, opt] of [['phone', { viewport: { width: 412, height: 800 }, colorScheme: 'dark', hasTouch: true, isMobile: true }], ['desk', { viewport: { width: 1280, height: 800 }, colorScheme: 'light' }]]) {
    const ctx = await b.newContext({ ...opt, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGE ' + e.message));
    await p.goto('http://localhost:8765/game/index.html'); await p.waitForTimeout(500);
    const cards = await p.locator('#missions .card').count(), train = await p.locator('#training .pill').count();
    await p.screenshot({ path: S + '/g-home-' + nm + '.png' });
    await p.click('.card[data-m="begehung"]'); await p.waitForSelector('.lv');
    const locked = await p.locator('.lv[disabled]').count();
    await p.click('.lv >> nth=0'); await p.waitForFunction(() => window.GAME_RUN && window.GAME_RUN._stage.frames() > 2, null, { timeout: 40000 }); await p.waitForTimeout(800);
    const brief = await p.isVisible('#brief') && (await p.textContent('#brief-text')).length > 20;
    await p.screenshot({ path: S + '/g-play-' + nm + '.png' });
    await p.click('#brief-ok'); await p.keyboard.press('Shift');       // Auftrag bestätigen, Kamerafahrt abkürzen
    await p.waitForFunction(() => !window.GAME_RUN._stage.imAnflug(), null, { timeout: 40000 });
    // Laufen: Taste W halten, die Figur muss sich bewegen; gegen die Wand darf sie nicht hindurch
    const p0 = await p.evaluate(() => ({ ...window.GAME_RUN._pos }));
    await p.evaluate(() => { window.GAME_RUN._stage.input.yaw = 0; });
    await hold(p, 'w', () => window.GAME_RUN._pos.z < 3.4);
    const p1 = await p.evaluate(() => ({ ...window.GAME_RUN._pos }));
    await hold(p, 'a', () => window.GAME_RUN._pos.x < 0.56, 15000);
    const p2 = await p.evaluate(() => ({ ...window.GAME_RUN._pos }));
    const f0 = await p.evaluate(() => window.GAME_RUN._stage.frames()); await p.waitForTimeout(1000);
    const fps = (await p.evaluate(() => window.GAME_RUN._stage.frames())) - f0;
    // Pausenmenü: Esc hält an, Einstellungen werden gespeichert, Weiter läuft weiter
    await p.keyboard.press('Escape'); await p.waitForTimeout(150); const menu = await p.isVisible('#menu');
    const fa = await p.evaluate(() => window.GAME_RUN._stage.frames()); await p.waitForTimeout(500); const fb2 = await p.evaluate(() => window.GAME_RUN._stage.frames());
    await p.selectOption('#o-qual', 'niedrig'); const pr = await p.evaluate(() => window.GAME_RUN._stage.pixelRatio());
    await p.selectOption('#o-qual', 'auto'); await p.click('#m-resume'); await p.waitForTimeout(1500);
    const fc = await p.evaluate(() => window.GAME_RUN._stage.frames());
    const menuOk = menu && fb2 === fa && fc > fb2 && pr <= 0.75;
    // Treppe: die Figur läuft den Lauf hoch (Höhe steigt, dann nächstes Geschoss) und wieder herunter
    await p.evaluate(() => { const r = window.GAME_RUN; r._stage.input.yaw = 0; r._pos.x = 3.7; r._pos.z = 11.3; }); await p.waitForTimeout(200);
    const fl0 = await p.evaluate(() => window.GAME_RUN._floor());
    await hold(p, 'w', () => window.GAME_RUN._pos.y > 1.2); const yMid = await p.evaluate(() => window.GAME_RUN._pos.y);
    await p.screenshot({ path: S + '/g-stairs-' + nm + '.png' });
    await hold(p, 'w', () => window.GAME_RUN._floor() === 2 && window.GAME_RUN._pos.z < 7.2);
    const fl1 = await p.evaluate(() => window.GAME_RUN._floor());
    await hold(p, 's', () => window.GAME_RUN._floor() === 1);
    const fl2 = await p.evaluate(() => window.GAME_RUN._floor()); const upVis = yMid > 1.2 && fl2 === fl0;
    // Aufgaben: zur Säule stellen und prüfen
    const n = await p.evaluate(() => window.GAME_RUN._tasks.length); let q = '', fb = '';
    for (let i = 0; i < n; i++) {
      await p.evaluate(i => window.GAME_RUN._goto(i), i); await p.waitForSelector('#act:not([hidden])', { timeout: 8000 }).catch(() => {});
      if (!(await p.isVisible('#act'))) { errs.push('Aufgabe ' + i + ': kein Prüfen-Knopf'); continue; }
      if (i === 0) { await p.screenshot({ path: S + '/g-near-' + nm + '.png' }); await p.click('#act'); } else await p.keyboard.press('e');
      await p.waitForSelector('#sheet:not([hidden])');
      const a = await p.evaluate(i => window.GAME_RUN._tasks[i].a, i);
      if (i === 0) { q = await p.textContent('#q-title'); await p.screenshot({ path: S + '/g-ask-' + nm + '.png' }); await p.click('.opt:text-is("DS")'); }
      await p.click('.opt:text-is("' + a.richtig + '")'); if (i === 0) fb = await p.textContent('#q-fbt');
      await p.click('#q-next'); await p.waitForTimeout(100);
    }
    await p.waitForSelector('#result:not([hidden])', { timeout: 15000 }).catch(() => {});
    const res = await p.isVisible('#result'), title = res ? await p.textContent('#r-title') : '', rp = res ? await p.textContent('#r-pts') : '', story = res ? await p.textContent('#r-story') : '';
    await p.screenshot({ path: S + '/g-result-' + nm + '.png' });
    await p.reload(); await p.waitForTimeout(400);
    const total = await p.textContent('#st-total'), badges = 0;
    const wdh = await p.getAttribute('#training .pill[data-t="wdh"]', 'title');      // die erste Aufgabe war im ersten Versuch falsch: Sie ist jetzt zur Wiederholung fällig
    await p.click('.card[data-m="begehung"]'); await p.waitForSelector('.lv');
    const locked2 = await p.locator('.lv[disabled]').count();
    const ok = cards === 9 && train === 4 && brief && story.length > 10 && /^Eine Aufgabe ist fällig/.test(wdh) && locked === 4 && p1.z < p0.z - 1 && p2.x > 0.5 && p2.x < 0.85 && menuOk && upVis && fl1 === fl0 + 1 && res && title === 'Bestanden' && total === '850' && locked2 === 3 && !errs.length;
    if(!ok) bad++;
    console.log((ok ? 'OK   ' : 'FEHLER ') + nm, JSON.stringify({ cards, train, brief, story, wdh, locked, p0, p1, p2, fps, menuOk, upVis, yMid, fl0, fl1, fl2, q, fb, res, title, rp, total, badges, locked2, errs }));
    await ctx.close();
  }
  await b.close();
  process.exit(bad ? 1 : 0);
})();
