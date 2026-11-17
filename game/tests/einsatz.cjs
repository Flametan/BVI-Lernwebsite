/* Simulationen – Level 6 „Einsatz“ (Playwright): zusammenhängender Fall mit Entscheidungen, Folgen und Meldungen mit Frist.
   Je Mission drei Läufe: gut (immer die beste Wahl), schlecht (immer die schlechteste Wahl, Folgeschritte werden abgearbeitet),
   frist (Nebenmeldungen verfallen lassen). Geprüft: Level endet, Punkte, Lage-Anzeige, Nachbesprechung, keine Fehler in der Konsole.
   Aufruf: python3 -m http.server 8765 (im Repo-Ordner), dann node game/tests/einsatz.cjs [Ordner für Screenshots] [Missionen mit Komma] [Läufe mit Komma] */
const { chromium } = require('playwright');
const S = process.argv[2] || require('os').tmpdir();
const MS = (process.argv[3] || 'stellungnahme,stab,presse,lage,ucpm,ibk,vak,feuak').split(',');
const LAEUFE = (process.argv[4] || 'gut,schlecht,frist').split(',');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); let bad = 0;
  for (const m of MS) for (const lauf of LAEUFE) {
    const ctx = await b.newContext({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', x => { if (x.type() === 'error') errs.push(x.text()); }); p.on('pageerror', e => errs.push('PAGE ' + e.message));
    await p.addInitScript(() => { const ms = {}; ['stellungnahme', 'stab', 'presse', 'lage', 'ucpm', 'ibk', 'vak', 'feuak'].forEach(k => { ms[k] = {}; for (let i = 0; i < 5; i++) ms[k][i] = { best: 1, ok: true }; });
      localStorage.setItem('bvi_game_v1', JSON.stringify({ v: 1, m: ms, badges: ['erste'], tag: { last: '', serie: 0 } })); localStorage.setItem('bvi_game_opt', JSON.stringify({ fx: 'aus', sprache: false, tut: true, stufe: 'normal' })); });
    await p.goto('http://localhost:8765/game/index.html?m=' + m); await p.waitForSelector('.lv'); await p.click('.lv >> nth=5');
    await p.waitForFunction(() => window.GAME_RUN && window.GAME_RUN._stage.frames() > 2, null, { timeout: 40000 });
    if (await p.isVisible('#brief')) { if (lauf === 'gut') await p.screenshot({ path: S + '/e-' + m + '-auftrag.png' }); await p.click('#brief-ok'); }
    let n = 0, folgen = 0, shot = false;
    try {
      for (let guard = 0; guard < 400; guard++) {
        if (await p.isVisible('#result')) break;
        const nx = await p.evaluate(() => window.GAME_RUN._next());
        if (!nx) { await p.evaluate(() => window.GAME_RUN._vor(30)); await p.waitForTimeout(250); continue; }
        if (lauf === 'frist' && !nx.a._kette) { await p.evaluate(() => window.GAME_RUN._ablauf()); await p.waitForTimeout(300); continue; }
        if (nx.a.ort !== nx.n) errs.push('Station fehlt: ' + nx.a.ort + ' (liegt an ' + nx.n + ')');
        const name = await p.evaluate(x => window.GAME_RUN._goto(x.typ, x.ziel), nx);
        await p.waitForFunction(n => window.GAME_RUN._near() === n && !document.getElementById('act').hidden, name, { timeout: 30000, polling: 50 });
        await p.keyboard.press('e'); await p.waitForSelector('#sheet:not([hidden])'); const a = nx.a; n++; if (a._frei) folgen++;
        if (!shot && a.typ === 'entscheidung' && n === 2) { await p.waitForTimeout(500); await p.screenshot({ path: S + '/e-' + m + '-' + lauf + '-frage.png' }); }
        const klick = async t => { const i = await p.evaluate(t => [...document.querySelectorAll('#q-opts .opt')].findIndex(b => !b.disabled && (b.textContent === t || b.textContent.replace(/^\d+\. /, '') === t)), t); if (i < 0) throw new Error('Option fehlt: ' + t); await p.click('#q-opts .opt >> nth=' + i); };
        if (a.typ === 'entscheidung') { const w = lauf === 'schlecht' ? 0 : 2; await klick(a.optionen.find(o => o.wert === w).t); }
        else if (a.typ === 'mc') await klick(a.richtig);
        else if (a.typ === 'multi') { for (const t of a.richtig) await klick(t); await p.click('#q-check'); }
        else for (const t of a.richtig) await klick(t);
        await p.waitForSelector('#q-fb:not([hidden])');
        if (!shot && a.typ === 'entscheidung' && n === 2) { shot = true; await p.screenshot({ path: S + '/e-' + m + '-' + lauf + '-folge.png' }); }
        await p.click('#q-next');
      }
    } catch (e) { errs.push('ABBRUCH ' + e.message.split('\n')[0]); }
    await p.waitForSelector('#result:not([hidden])', { timeout: 15000 }).catch(() => {});
    const r = await p.isVisible('#result') ? await p.evaluate(() => ({ title: document.getElementById('r-title').textContent, pts: document.getElementById('r-pts').textContent, sum: document.getElementById('r-sum').textContent, liste: document.querySelectorAll('#r-liste li').length, lage: window.GAME_ST.lage })) : null;
    if (r) await p.screenshot({ path: S + '/e-' + m + '-' + lauf + '-ende.png' });
    let ok = !!r && !errs.length && r.liste > 0;
    if (ok && lauf === 'gut') ok = r.title === 'Fehlerfrei bestanden' && r.lage >= 70 && folgen === 0;
    if (ok && lauf === 'schlecht') ok = r.lage < 40 && /nicht/i.test(r.title);
    if (ok && lauf === 'frist') ok = /verpasst/.test(r.sum) && r.lage < 100;
    if (!ok) bad++;
    console.log((ok ? 'OK   ' : 'FEHLER ') + m + ' ' + lauf, JSON.stringify({ aufgaben: n, folgen, r, errs }));
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
