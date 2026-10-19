// Öffnet jede Ansicht der App in Handy- und Desktop-Größe und prüft auf JavaScript-Fehler
// und seitlichen Überlauf. Start: node smoke.cjs [Basis-URL]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8765/index.html';
const EXEC = process.env.PW_EXEC || undefined;

(async () => {
  const browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
  const problems = [];
  let views = 0;

  for (const [name, vp, mobile] of [
    ['Handy', { width: 390, height: 844 }, true],
    ['Tablet', { width: 820, height: 1180 }, true],
    ['Desktop', { width: 1440, height: 900 }, false],
  ]) {
    const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block' });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(() => {
      localStorage.setItem('bvi_onboarded', '1');
      localStorage.setItem('bvi_seen_version', '0.0.0');
    });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const ids = await page.evaluate(() => [...document.querySelectorAll('.view')].map(v => v.id));
    for (const id of ids) {
      await page.evaluate(i => NAV.go(i, i), id);
      await page.waitForTimeout(60);
      views++;
      if (name === 'Handy') {
        const w = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (w > 1) problems.push(`${name}: ${id} ragt ${w}px über den Rand`);
      }
    }
    for (const fn of ['SEARCH.open()', 'SEARCH.close()', 'STATS.open()', 'STATS.close()', 'POMO.open()', 'POMO.close()', 'CHANGELOG.open()', 'CHANGELOG.close()']) {
      await page.evaluate(fn).catch(e => errors.push(`${fn}: ${e.message}`));
    }
    // Farbschema umschalten und Bild-Vergrößerung öffnen
    for (const m of ['light', 'dark', 'system']) {
      await page.evaluate(m => THEME.set(m), m).catch(e => errors.push(`THEME ${m}: ${e.message}`));
      const th = await page.evaluate(() => document.documentElement.dataset.theme);
      if (m !== 'system' && th !== m) errors.push(`Farbschema ${m} nicht gesetzt (${th})`);
    }
    await page.evaluate(() => {
      NAV.go('v-gal-atemschutz', 'x');
      document.querySelector('#v-gal-atemschutz details').open = true;
      document.querySelector('#v-gal-atemschutz img.pdf-img').click();
    });
    if (!(await page.evaluate(() => LIGHTBOX.isOpen()))) errors.push('Bild-Vergrößerung öffnet nicht');
    await page.evaluate(() => LIGHTBOX.close(true));
    for (const e of [...new Set(errors)]) problems.push(`${name}: ${e}`);
    await ctx.close();
  }

  await browser.close();
  if (problems.length) {
    console.error('FEHLER:\n - ' + problems.join('\n - '));
    process.exit(1);
  }
  console.log(`OK: ${views} Ansichten in 3 Größen ohne Fehler`);
})();
