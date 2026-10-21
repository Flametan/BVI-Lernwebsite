/* Einsatzfahrt-Duell: zwei Spieler verbinden sich (Kurzcode), spielen, Revanche, Abbruch */
const { chromium } = require('playwright');
const EXEC = process.env.PW_EXEC, URL = process.env.APP_URL || 'http://localhost:8765/';
const fails = []; let checks = 0;
const ok = (n, c) => { checks++; if (!c) fails.push(n); };
const eq = (n, a, b) => ok(n + ' (ist: ' + JSON.stringify(a) + ')', JSON.stringify(a) === JSON.stringify(b));
(async () => {
  const browser = await chromium.launch({ ...(EXEC ? { executablePath: EXEC } : {}), args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const errors = [];
  const mk = async name => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const p = await ctx.newPage(); p.setDefaultTimeout(25000);
    p.on('pageerror', e => errors.push(name + ': ' + e.message));
    await p.addInitScript(n => { localStorage.setItem('bvi_onboarded', '1'); localStorage.setItem('bvi_duell_name', JSON.stringify(n)); localStorage.setItem('bvi_duell_stun', 'false'); }, name);
    await p.goto(URL); await p.waitForTimeout(800);
    await p.evaluate(() => NAV.go('v-pause', 'x')); await p.evaluate(() => PAUSE_LOADER.load()); await p.waitForTimeout(300);
    await p.evaluate(() => PAUSE.open('duell')); await p.waitForSelector('[data-a="host"]');
    return p;
  };
  const A = await mk('Max'), B = await mk('Lena');
  // Verbindung per Kurzcode (Kamera gibt es im Test nicht)
  await A.click('[data-a="host"]'); await A.waitForSelector('textarea.pz-code');
  const c1 = await A.inputValue('textarea.pz-code');
  ok('Verbindungscode ist kurz genug für einen QR-Code', c1.startsWith('D1~') && c1.length < 400);
  // QR-Code lässt sich wieder auslesen (gleicher Weg wie der Kamera-Scan)
  const qrOk = await A.evaluate(async code => {
    await new Promise((r, f) => { const s = document.createElement('script'); s.src = 'js/jsqr.min.js'; s.onload = r; s.onerror = f; document.body.appendChild(s); });
    const svg = document.querySelector('#qr svg'); const w = 480;
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.outerHTML.replace('<svg', '<svg width="' + w + '" height="' + w + '"')); await img.decode();
    const cv = document.createElement('canvas'); cv.width = cv.height = w; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, w); x.drawImage(img, 0, 0, w, w);
    const d = x.getImageData(0, 0, w, w), r = jsQR(d.data, w, w); return !!r && r.data === code;
  }, c1);
  ok('QR-Code enthält genau den Verbindungscode', qrOk);
  await A.click('[data-a="next1"]'); await A.waitForSelector('#pc');
  ok('Vor dem Scan wird erst gefragt: „Kamera starten“ (kein automatischer Zugriff)', await A.locator('[data-a="cam"]').count() === 1 && await A.locator('.pz-scan video').count() === 0);
  // Kamera: nach Tipp auf „Kamera starten“ läuft die Vorschau; bei verweigertem Zugriff erscheint eine verständliche Meldung
  await A.click('[data-a="cam"]'); await A.waitForSelector('.pz-scan video');
  ok('Kamera-Vorschau läuft nach dem Tipp', await A.locator('.pz-scan video').count() === 1);
  await A.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })); });
  await A.evaluate(() => DUELL._stopScan && DUELL._stopScan());
  await A.click('[data-a="cancel"]'); await A.waitForSelector('[data-a="host"]'); await A.click('[data-a="host"]'); await A.waitForSelector('textarea.pz-code');
  await A.click('[data-a="next1"]'); await A.click('[data-a="cam"]'); await A.waitForSelector('#se b');
  ok('Verweigerte Kamera: Meldung nennt den Weg in die Einstellungen', (await A.innerText('#se')).includes('Berechtigungen') && await A.locator('[data-a="cam"]').isVisible());
  await A.reload(); await A.waitForTimeout(800); await A.evaluate(() => NAV.go('v-pause', 'x')); await A.evaluate(() => PAUSE_LOADER.load()); await A.evaluate(() => PAUSE.open('duell')); await A.waitForSelector('[data-a="host"]');
  await A.click('[data-a="host"]'); await A.waitForSelector('textarea.pz-code');
  const c1b = await A.inputValue('textarea.pz-code');
  const png = await A.evaluate(async () => { const svg = document.querySelector('#qr svg'); const w = 600; const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.outerHTML.replace('<svg', '<svg width="' + w + '" height="' + w + '"')); await img.decode(); const cv = document.createElement('canvas'); cv.width = cv.height = w + 80; const x = cv.getContext('2d'); x.fillStyle = '#ccc'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(img, 40, 40, w, w); return cv.toDataURL('image/png').split(',')[1]; });
  await A.click('[data-a="next1"]'); await A.waitForSelector('#pc');
  // Foto statt Live-Kamera: der QR-Code von Spieler 1 wird als Bild aufgenommen und gelesen
  await B.click('[data-a="join"]'); await B.waitForSelector('#ph', { state: 'attached' });
  ok('Foto-Auswahl ist neben der Live-Kamera angeboten', await B.locator('[data-a="photo"]').count() === 1);
  await B.setInputFiles('#ph', { name: 'qr.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await B.waitForSelector('textarea.pz-code'); const c2 = await B.inputValue('textarea.pz-code');
  await A.fill('#pc', c2); await A.click('[data-a="paste"]');
  await A.waitForSelector('[data-a="go"]', { timeout: 30000 }); await B.waitForSelector('[data-a="ready"]');
  ok('Beide Spieler sind in der Lobby', (await A.innerText('.pz-card')).includes('MAX GEGEN LENA') || /Max gegen Lena/i.test(await A.innerText('.pz-card')));
  await B.click('[data-a="ready"]'); await A.waitForFunction(() => !document.querySelector('[data-a="go"]').disabled);
  await A.click('[data-a="n"][data-v="10"]');
  await A.waitForFunction(() => document.querySelector('[data-a="go"]').disabled);   // geänderte Einstellung muss bestätigt werden
  await B.waitForSelector('[data-a="ready"]'); await B.click('[data-a="ready"]');
  await A.waitForFunction(() => !document.querySelector('[data-a="go"]').disabled);
  await A.click('[data-a="go"]');
  await A.waitForSelector('[data-a="ans"]', { timeout: 20000 }); await B.waitForSelector('[data-a="ans"]', { timeout: 20000 });
  const st = await Promise.all([A, B].map(p => p.evaluate(() => { const s = PAUSE._fahrt()._state(); return { n: s.qs.length, sig: s.qs.map(q => q.q.slice(0, 25) + '|' + q.c).join('~'), hf: s.hf }; })));
  eq('Fragenzahl 10 auf beiden Geräten', [st[0].n, st[1].n], [10, 10]);
  ok('Gleiche Fragen in gleicher Reihenfolge und Antwortposition', st[0].sig === st[1].sig);
  eq('Hilfsfrist wächst mit der Fragenzahl (60 s je Frage + 60 s + 30 s)', st[0].hf, 60 * 11 + 30);
  const play = async (p, good) => {
    for (let i = 0; i < 10; i++) {
      await p.waitForSelector('[data-a="ans"]:not([disabled])', { timeout: 20000 });
      const pick = await p.evaluate(g => { const s = PAUSE._fahrt()._state(), q = s.qs[s.qi]; return g ? q.c : (q.c + 1) % q.o.length; }, good);
      await p.click(`[data-a="ans"][data-v="${pick}"]`); await p.waitForTimeout(80); await p.click('[data-a="next"]');
    }
  };
  await Promise.all([play(A, true), play(B, false)]);
  await A.waitForSelector('table.pz-vs', { timeout: 30000 }); await B.waitForSelector('table.pz-vs', { timeout: 30000 });
  const ta = await A.innerText('.pz-fp'), tb = await B.innerText('.pz-fp');
  ok('Sieger sieht „Du gewinnst!“', ta.includes('Du gewinnst!'));
  ok('Verlierer sieht den Sieger', tb.includes('Max gewinnt.'));
  ok('Wertung: 10 richtig = 1300 Punkte, 0 richtig = 0', /1300/.test(ta) && /\t0\b/.test(ta));
  ok('Bilanz 1 : 0 beim Sieger und 0 : 1 beim Verlierer', ta.includes('1 : 0') && tb.includes('0 : 1'));
  // Revanche mit neuen Fragen
  await A.click('[data-a="rematch"]'); await B.waitForSelector('[data-a="rematch"]'); await B.click('[data-a="rematch"]');
  await A.waitForSelector('[data-a="ans"]', { timeout: 20000 }); await B.waitForSelector('[data-a="ans"]', { timeout: 20000 });
  const s2 = await Promise.all([A, B].map(p => p.evaluate(() => PAUSE._fahrt()._state().qs.map(q => q.q.slice(0, 25) + '|' + q.c).join('~'))));
  ok('Revanche: gleiche Fragen auf beiden Geräten', s2[0] === s2[1]);
  ok('Revanche: andere Fragen als in der ersten Runde', s2[0] !== st[0].sig);
  // Zeitlimit pro Frage: nach 30 s gilt die Frage als falsch
  await A.evaluate(() => { PAUSE._fahrt()._state().askT0 -= 31000; });
  await A.waitForSelector('.pz-fb.r', { timeout: 5000 });
  ok('Zeitlimit: Frage nach 30 s als falsch gewertet', (await A.innerText('.pz-fp')).includes('Zeit abgelaufen'));
  // Aufgabe: B verlässt das Duell, A gewinnt
  await B.evaluate(() => DUELL.stop()); await A.waitForTimeout(600);
  ok('Aufgabe des Gegners: Sieg durch Aufgabe', (await A.innerText('.pz-fp')).includes('Lena hat aufgegeben'));
  for (const e of errors) fails.push('JavaScript-Fehler: ' + e);
  await browser.close();
  if (fails.length) { console.error('FEHLER:\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log(`OK: ${checks} Prüfungen des Duells bestanden`);
})().catch(e => { console.error('TESTFEHLER', e.message); process.exit(1); });
