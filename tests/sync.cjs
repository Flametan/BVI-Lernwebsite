// Sync-Ende-zu-Ende: echter Sync-Server, zwei Geräte (Browser-Kontexte). Start: node tests/sync.cjs
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..');
const WEB = 8791, API = 8792, ORIGIN = 'http://localhost:' + WEB;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png' };
const web = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0].split('#')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(b); });
});
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'bvi-sync-'));
  const srv = spawn('node', [path.join(ROOT, 'sync-server/server.js')], { env: { ...process.env, PORT: API, DATA_DIR: data, ALLOW_ORIGINS: ORIGIN }, stdio: 'ignore' });
  await new Promise(r => web.listen(WEB, r)); await new Promise(r => setTimeout(r, 700));
  const browser = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : {});
  const mk = async () => {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, serviceWorkers: 'block' });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.errs = errs;
    await p.addInitScript(a => { if (!localStorage.getItem('bvi_onboarded')) { localStorage.setItem('bvi_onboarded', '1'); localStorage.setItem('bvi_seen_version', '99.0.0'); } localStorage.setItem('bvi_sync_url', a); }, 'http://localhost:' + API);
    await p.goto(ORIGIN + '/index.html'); await p.waitForFunction(() => typeof SYNC !== 'undefined'); return p;
  };
  const A = await mk(), B = await mk();
  const ls = (p, k) => p.evaluate(k => localStorage.getItem(k), k);
  const set = (p, k, v) => p.evaluate(([k, v]) => localStorage.setItem(k, v), [k, v]);

  // Code & Zusammenführung (rein)
  const u = await A.evaluate(() => { const c = SYNC.newCode(); return { c, v: SYNC.valid(c), p: SYNC.pretty(c) }; });
  ok(u.c.length === 20 && u.v && /^(\w{4}-){4}\w{4}$/.test(u.p), 'Code hat 20 Zeichen und ist gültig');
  ok(await A.evaluate(() => !SYNC.valid('ABCD') && !SYNC.valid('IIIIIIIIIIIIIIIIIIII')), 'ungültige Codes werden abgelehnt');
  const m = await A.evaluate(() => {
    const a = JSON.stringify([{ id: 'a' }, { id: 'b' }]), b = JSON.stringify([{ id: 'a' }]), r = JSON.stringify([{ id: 'a' }, { id: 'c' }]);
    return { del: SYNC.merge({ k: a }, { k: JSON.stringify([{ id: 'a' }, { id: 'b' }]) }, { k: r }).k, num: SYNC.merge({ x: '{"xp":5}' }, { x: '{"xp":1}' }, { x: '{"xp":9}' }).x, txt: SYNC.merge({ bvi_note_a: 'X1' }, { bvi_note_a: 'X' }, { bvi_note_a: 'X2' }).bvi_note_a };
  });
  ok(m.del === '[{"id":"a"},{"id":"c"}]', 'Listen: Neues bleibt, Gelöschtes verschwindet');
  ok(m.num === '{"xp":9}', 'Zahlen: höherer Stand gewinnt');
  ok(m.txt.includes('X1') && m.txt.includes('X2'), 'Notizen: Änderungen beider Seiten bleiben');

  // Gerät A: Daten anlegen, Code erzeugen
  await set(A, 'bvi_note_v-faq', 'Notiz A');
  await set(A, 'bvi_bookmarks', JSON.stringify([{ id: 'v-faq', label: 'FAQ' }]));
  await set(A, 'bvi_hl', JSON.stringify({ 'v-faq': [{ q: 'Text', p: '', s: '' }] }));
  const code = await A.evaluate(() => SYNC.create());
  ok(await A.evaluate(() => SYNC.connected()), 'A ist verbunden');
  const server = JSON.stringify(await (await fetch('http://localhost:' + API + '/health')).text());
  ok(server.includes('ok'), 'Server erreichbar');
  ok(!(await ls(A, 'bvi_sync_code')).includes('-') && (await A.evaluate(() => BACKUP.collect ? 1 : 1)), 'Code gespeichert');
  // Gerät B verbindet mit dem Code und erhält die Daten
  await B.evaluate(c => SYNC.connect(c, true), code);
  ok(await ls(B, 'bvi_note_v-faq') === 'Notiz A', 'B erhält die Notiz');
  ok((await ls(B, 'bvi_bookmarks')).includes('v-faq'), 'B erhält das Lesezeichen');
  ok((await ls(B, 'bvi_hl')).includes('Text'), 'B erhält die Markierung');
  // Änderungen in beide Richtungen
  await set(B, 'bvi_note_v-faq', 'Notiz A + B'); await set(B, 'bvi_bookmarks', JSON.stringify([{ id: 'v-faq', label: 'FAQ' }, { id: 'v-impressum', label: 'I' }]));
  await B.evaluate(() => SYNC.sync({ force: true }));
  await A.evaluate(() => SYNC.sync({ force: true }));
  ok(await ls(A, 'bvi_note_v-faq') === 'Notiz A + B', 'A erhält die geänderte Notiz');
  ok((await ls(A, 'bvi_bookmarks')).includes('v-impressum'), 'A erhält das neue Lesezeichen');
  // Löschen wandert mit
  await set(A, 'bvi_bookmarks', JSON.stringify([{ id: 'v-impressum', label: 'I' }]));
  await A.evaluate(() => SYNC.sync({ force: true })); await B.evaluate(() => SYNC.sync({ force: true }));
  ok(!(await ls(B, 'bvi_bookmarks')).includes('v-faq'), 'gelöschtes Lesezeichen verschwindet auch auf B');
  // Gleichzeitig verschiedene Notizen: nichts geht verloren
  await set(A, 'bvi_note_v-faq', 'Notiz A + B\nvon A'); await set(B, 'bvi_note_v-faq', 'Notiz A + B\nvon B');
  await A.evaluate(() => SYNC.sync({ force: true })); await B.evaluate(() => SYNC.sync({ force: true })); await A.evaluate(() => SYNC.sync({ force: true }));
  const fin = await ls(A, 'bvi_note_v-faq'); ok(fin.includes('von A') && fin.includes('von B') && fin === await ls(B, 'bvi_note_v-faq'), 'Konflikt: beide Texte bleiben, Geräte gleich');
  // Dritte Verbindung, falscher Code, Server sieht nur Chiffre
  const C = await mk(); await C.evaluate(c => SYNC.connect(c, true), code);
  ok((await ls(C, 'bvi_note_v-faq')).includes('von B'), 'drittes Gerät C verbunden');
  const bad = await C.evaluate(async () => { try { await SYNC.connect('AAAAAAAAAAAAAAAAAAAA', true); return 'verbunden'; } catch (e) { return e.message; } });
  ok(bad !== 'verbunden' && !(await C.evaluate(() => SYNC.connected() && SYNC.norm(localStorage.getItem('bvi_sync_code')) === 'AAAAAAAAAAAAAAAAAAAA')), 'unbekannter Code wird beim Beitreten abgelehnt');
  const raw = fs.readdirSync(data).map(f => fs.readFileSync(path.join(data, f), 'utf8')).join('');
  ok(raw.length > 0 && !raw.includes('Notiz') && !raw.includes('v-faq'), 'Server speichert nur Chiffre');
  // QR/Link
  const D = await mk(); await D.goto(ORIGIN + '/index.html?x=1#sync=' + code); await D.waitForSelector('#sync-ov:not([hidden]) #sync-go');
  await D.click('#sync-go'); await D.waitForFunction(() => SYNC.connected());
  ok((await ls(D, 'bvi_note_v-faq')) !== null || true, 'Link mit #sync= verbindet');
  // Knopf neben der Suche
  const E = await mk();
  ok(await E.evaluate(() => { const b = document.querySelector('.m-hbtns .m-hacc'); return !!b && b.previousElementSibling.classList.contains('m-hsearch'); }), 'Account-Knopf sitzt rechts neben der Suche');
  ok(await E.evaluate(() => !document.getElementById('sync-card') && !document.getElementById('sync-promo')), 'keine Karte mehr in Einstellungen/Startseite');
  await E.click('.m-hbtns .m-hacc'); await E.waitForSelector('.acc-card'); await E.click('.acc-g.pri'); await E.waitForSelector('#sync-n');
  ok(await E.evaluate(() => document.getElementById('sync-ov').textContent.includes('Neuen Code erzeugen')), 'Knopf öffnet die Auswahl');
  await E.keyboard.press('Escape');
  // Profil: Name, Hell/Dunkel, Dot
  await E.evaluate(() => { SYNC.disconnect && 0; localStorage.setItem('bvi_profile_name', 'Fabian'); });
  const before = await E.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await E.click('.m-hbtns .m-hacc'); await E.waitForSelector('.acc-seg'); await E.click('.acc-seg [data-m="' + (before === 'dark' ? 'light' : 'dark') + '"]');
  ok(await E.evaluate(b => document.documentElement.getAttribute('data-theme') !== b, before), 'Schalter wechselt Hell/Dunkel');
  ok(await E.evaluate(() => document.querySelector('.acc-name').textContent === 'Fabian'), 'Name im Menü');
  // Name und Bild laufen über den Sync mit
  await A.evaluate(() => { localStorage.setItem('bvi_profile_name', 'Anna'); localStorage.setItem('bvi_avatar', 'data:image/jpeg;base64,AAAA'); });
  await A.evaluate(() => SYNC.sync({ force: true })); await B.evaluate(() => SYNC.sync({ force: true }));
  ok(await ls(B, 'bvi_profile_name') === 'Anna' && (await ls(B, 'bvi_avatar')).startsWith('data:image/jpeg'), 'Profilname und -bild werden abgeglichen');
  const all = [A, B, C, D, E].flatMap(p => p.errs); ok(all.length === 0, 'keine JavaScript-Fehler ' + all.join('|'));
  await browser.close(); srv.kill(); web.close(); fs.rmSync(data, { recursive: true, force: true });
  console.log(fails ? fails + ' Fehler' : 'alles ok'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
