// Erzeugt die Kalender-Abo-Dateien des Stundenplans (data/stundenplan-gruppe1.ics und -gruppe2.ics)
// aus der App selbst – inklusive der Änderungen aus data/plan-overrides.json.
// Start: node gen-ics.cjs   (läuft beim Veröffentlichen der Seite, die Dateien werden nicht eingecheckt)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };

(async () => {
  const srv = http.createServer((q, r) => {
    let f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
    if (f.endsWith(path.sep) || f === root) f = path.join(f, 'index.html');
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const base = 'http://127.0.0.1:' + srv.address().port + '/index.html';
  const browser = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : {});
  let bad = 0;
  for (const g of ['g1', 'g2']) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', timezoneId: 'Europe/Berlin', locale: 'de-DE' });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const page = await ctx.newPage();
    await page.addInitScript(gr => { localStorage.setItem('bvi_onboarded', '1'); localStorage.setItem('idf_plan_grp', gr); }, g);
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof IDF_PLAN !== 'undefined');
    await page.waitForTimeout(1500);   // Änderungen vom Institut laden
    const r = await page.evaluate(() => IDF_PLAN.ics());
    if (!r || r.count < 20) { console.error('Zu wenige Termine für ' + g + ': ' + (r && r.count)); bad++; continue; }
    // Abo-Hinweise für Kalender-Programme: alle paar Stunden neu abrufen
    const text = r.text.replace('METHOD:PUBLISH\r\n', 'METHOD:PUBLISH\r\nREFRESH-INTERVAL;VALUE=DURATION:PT6H\r\nX-PUBLISHED-TTL:PT6H\r\nX-WR-TIMEZONE:Europe/Berlin\r\n');
    const out = path.join(root, 'data', 'stundenplan-gruppe' + g[1] + '.ics');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, text);
    console.log(path.relative(root, out) + ': ' + r.count + ' Termine');
    await ctx.close();
  }
  await browser.close();
  srv.close();
  process.exit(bad ? 1 : 0);
})();
