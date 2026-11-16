/* IdF-Spiel – Durchlauf aller Welt-Missionen (Playwright): Level 1 jeder Mission starten, Stationen auf freie Lage prüfen,
   alle Aufgaben über die Oberfläche richtig lösen (Auswahl, Mehrfachauswahl, Reihenfolge, Meldung bringen), Ergebnis prüfen.
   Aufruf: python3 -m http.server 8765 (im Repo-Ordner), dann node game/tests/welten.cjs [Ordner für Screenshots] */
const { chromium } = require('playwright');
const S = process.argv[2] || require('os').tmpdir();
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); let bad = 0;
  for (const m of ['stellungnahme', 'stab', 'presse', 'lage', 'ucpm', 'ibk', 'vak', 'feuak']) {
    const ctx = await b.newContext({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', x => { if (x.type() === 'error') errs.push(x.text()); }); p.on('pageerror', e => errs.push('PAGE ' + e.message));
    await p.goto('http://localhost:8765/game/index.html'); await p.waitForTimeout(300);
    await p.click('.card[data-m="' + m + '"]'); await p.waitForSelector('.lv'); await p.click('.lv >> nth=0');
    await p.waitForFunction(() => window.GAME_RUN && window.GAME_RUN._stage.frames() > 2, null, { timeout: 30000 });
    const blocked = await p.evaluate(() => window.GAME_RUN._check());
    await p.screenshot({ path: S + '/w-' + m + '.png' });
    let n = 0;
    for (let guard = 0; guard < 40; guard++) {
      const nx = await p.evaluate(() => window.GAME_RUN._next()); if (!nx) break;
      const name = await p.evaluate(x => window.GAME_RUN._goto(x.typ, x.ziel), nx);
      await p.waitForFunction(n => window.GAME_RUN._near() === n && !document.getElementById('act').hidden, name, { timeout: 20000, polling: 50 });
      await p.keyboard.press('e');
      if (nx.typ !== 'frage') { await p.waitForFunction(t => { const x = window.GAME_RUN._next(); return !x || x.typ !== t; }, nx.typ, { timeout: 20000, polling: 50 }); if (nx.typ === 'abgeben') n++; continue; }
      await p.waitForSelector('#sheet:not([hidden])'); const a = nx.a; n++;
      const pick = async t => { const i = await p.evaluate(t => [...document.querySelectorAll('#q-opts .opt')].findIndex(b => b.textContent.replace(/^\d+\. /, '') === t), t); if (i < 0) throw new Error('Option fehlt: ' + t); await p.click('#q-opts .opt >> nth=' + i); };
      if (a.typ === 'mc') await pick(a.richtig);
      else if (a.typ === 'multi') { for (const t of a.richtig) await pick(t); await p.click('#q-check'); }
      else for (const t of a.richtig) await pick(t);
      await p.waitForSelector('#q-fb:not([hidden])'); const fb = await p.textContent('#q-fbt'); if (!/^Richtig\. /.test(fb)) errs.push('nicht als richtig gewertet: ' + a.frage);
      await p.click('#q-next');
    }
    await p.waitForSelector('#result:not([hidden])', { timeout: 15000 }).catch(() => {});
    const title = await p.isVisible('#result') ? await p.textContent('#r-title') : '';
    const ok = !blocked.length && !errs.length && title === 'Fehlerfrei bestanden'; if (!ok) bad++;
    console.log((ok ? 'OK   ' : 'FEHLER ') + m, JSON.stringify({ aufgaben: n, blocked, title, errs }));
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
