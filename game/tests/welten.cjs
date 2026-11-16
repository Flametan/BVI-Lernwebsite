/* IdF-Spiel – Durchlauf aller Welt-Missionen (Playwright): Level starten, Stationen auf freie Lage prüfen, alle Aufgaben über die
   Oberfläche richtig lösen (Auswahl, Mehrfachauswahl, Reihenfolge, Meldung bringen, Textbausteine, Gespräch, Budget, Statement), Ergebnis prüfen.
   Aufruf: python3 -m http.server 8765 (im Repo-Ordner), dann
   node game/tests/welten.cjs [Ordner für Screenshots] [Level 1 bis 5, mit Komma; Standard 1] [Missionen mit Komma] [Effekte: aus|mittel|hoch; Standard aus] */
const { chromium } = require('playwright');
const S = process.argv[2] || require('os').tmpdir();
const LV = (process.argv[3] || '1').split(',').map(x => +x - 1);
const MS = (process.argv[4] || 'stellungnahme,stab,presse,lage,ucpm,ibk,vak,feuak').split(',');
const FXL = process.argv[5] || 'aus';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); let bad = 0;
  for (const m of MS) for (const lv of LV) {
    const ctx = await b.newContext({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', x => { if (x.type() === 'error') errs.push(x.text()); }); p.on('pageerror', e => errs.push('PAGE ' + e.message));
    // Alle Level freischalten, Effekte nach Wunsch (ohne Effekte läuft die Software-Grafik des Tests schneller)
    await p.addInitScript(([fx]) => { const ms = {}; ['stellungnahme', 'stab', 'presse', 'lage', 'ucpm', 'ibk', 'vak', 'feuak', 'begehung'].forEach(k => { ms[k] = {}; for (let i = 0; i < 5; i++) ms[k][i] = { best: 1, ok: true }; });
      localStorage.setItem('bvi_game_v1', JSON.stringify({ v: 1, m: ms, badges: ['erste'], tag: { last: '', serie: 0 }, opt: { fx, sprache: false } })); }, [FXL]);
    await p.goto('http://localhost:8765/game/index.html?m=' + m); await p.waitForSelector('.lv'); await p.click('.lv >> nth=' + lv);
    await p.waitForFunction(() => window.GAME_RUN && window.GAME_RUN._stage.frames() > 2, null, { timeout: 40000 });
    if (await p.isVisible('#brief')) await p.click('#brief-ok');
    const blocked = await p.evaluate(() => window.GAME_RUN._check());
    await p.waitForTimeout(600); await p.screenshot({ path: S + '/w-' + m + '-' + (lv + 1) + '.png' });
    let n = 0;
    const idx = async (sel, t) => { const i = await p.evaluate(([sel, t]) => [...document.querySelectorAll(sel)].findIndex(b => b.textContent.replace(/^\d+\. /, '').replace(/^„|“$/g, '') === t || b.lastChild.textContent === t), [sel, t]); if (i < 0) throw new Error('Option fehlt: ' + t); return i; };
    const pick = async t => p.click('#q-opts .opt >> nth=' + await idx('#q-opts .opt', t));
    try {
      for (let guard = 0; guard < 60; guard++) {
        const nx = await p.evaluate(() => window.GAME_RUN._next()); if (!nx) break;
        const name = await p.evaluate(x => window.GAME_RUN._goto(x.typ, x.ziel), nx);
        await p.waitForFunction(n => window.GAME_RUN._near() === n && !document.getElementById('act').hidden, name, { timeout: 30000, polling: 50 });
        await p.keyboard.press('e');
        if (nx.typ !== 'frage') { await p.waitForFunction(t => { const x = window.GAME_RUN._next(); return !x || x.typ !== t; }, nx.typ, { timeout: 30000, polling: 50 }); if (nx.typ === 'abgeben') n++; continue; }
        await p.waitForSelector('#sheet:not([hidden])'); const a = nx.a; n++;
        if (a.typ === 'mc') await pick(a.richtig);
        else if (a.typ === 'multi') { for (const t of a.richtig) await pick(t); await p.click('#q-check'); }
        else if (a.typ === 'bausteine') { for (let f = 0; f < a.felder.length; f++) await p.click('#q-opts .grp >> nth=' + f + ' >> .opt >> nth=' + a.felder[f].optionen.indexOf(a.felder[f].richtig)); await p.click('#q-check'); }
        else if (a.typ === 'gespraech') { for (let z = 0; z < a.zuege.length; z++) { await p.click('#q-opts .opt >> nth=' + a.zuege[z].optionen.findIndex(o => o.gut)); if (z < a.zuege.length - 1) await p.click('#q-check'); } }
        else if (a.typ === 'budget') { for (const t of a.richtig) await p.click('#q-opts .opt >> nth=' + a.posten.findIndex(x => x.t === t)); await p.click('#q-check'); }
        else for (const t of a.richtig) await pick(t);                                        // reihe, statement
        await p.waitForSelector('#q-fb:not([hidden])'); const fb = await p.textContent('#q-fbt'); if (!/^Richtig\. /.test(fb)) errs.push('nicht als richtig gewertet: ' + a.frage);
        await p.click('#q-next');
      }
    } catch (e) { errs.push('ABBRUCH ' + e.message.split('\n')[0]); }
    await p.waitForSelector('#result:not([hidden])', { timeout: 15000 }).catch(() => {});
    const title = await p.isVisible('#result') ? await p.textContent('#r-title') : '';
    const fps = await p.evaluate(() => window.GAME_RUN ? window.GAME_RUN._stage.effekte() : '');
    const ok = !blocked.length && !errs.length && title === 'Fehlerfrei bestanden'; if (!ok) bad++;
    console.log((ok ? 'OK   ' : 'FEHLER ') + m + ' ' + (lv + 1), JSON.stringify({ aufgaben: n, blocked, title, fx: fps, errs }));
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
