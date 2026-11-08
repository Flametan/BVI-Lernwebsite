'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { createServer, config } = require('../server.js');

const ID = 'a'.repeat(32), TOKEN = 'T'.repeat(43), OTHER = 'U'.repeat(43);
async function boot(env = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bvisync-'));
  const cfg = config({ DATA_DIR: dir, ALLOW_ORIGINS: 'https://flametan.github.io', ...env });
  const srv = createServer(cfg);
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  return { base, srv, dir, close: () => new Promise(r => srv.close(r)) };
}
const put = (b, id, tok, ver, data) => fetch(b + '/v1/blob/' + id, { method: 'PUT', headers: { 'X-Sync-Token': tok, 'If-Match': String(ver), 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
const get = (b, id, tok) => fetch(b + '/v1/blob/' + id, { headers: { 'X-Sync-Token': tok } });

test('Anlegen, Lesen, Aktualisieren', async () => {
  const s = await boot();
  assert.equal((await fetch(s.base + '/health')).status, 200);
  assert.equal((await get(s.base, ID, TOKEN)).status, 404);
  let r = await put(s.base, ID, TOKEN, 0, 'Daten1'); assert.equal(r.status, 200); assert.equal((await r.json()).version, 1);
  r = await get(s.base, ID, TOKEN); const j = await r.json(); assert.equal(j.data, 'Daten1'); assert.equal(j.version, 1);
  r = await put(s.base, ID, TOKEN, 1, 'Daten2'); assert.equal((await r.json()).version, 2);
  await s.close();
});
test('Falsches Token wird abgelehnt, Daten bleiben', async () => {
  const s = await boot();
  await put(s.base, ID, TOKEN, 0, 'x');
  assert.equal((await get(s.base, ID, OTHER)).status, 403);
  assert.equal((await put(s.base, ID, OTHER, 1, 'y')).status, 403);
  assert.equal((await (await get(s.base, ID, TOKEN)).json()).data, 'x');
  await s.close();
});
test('Veraltete Version gibt 409 mit dem aktuellen Stand', async () => {
  const s = await boot();
  await put(s.base, ID, TOKEN, 0, 'a'); await put(s.base, ID, TOKEN, 1, 'b');
  const r = await put(s.base, ID, TOKEN, 1, 'c'); assert.equal(r.status, 409);
  const j = await r.json(); assert.equal(j.version, 2); assert.equal(j.data, 'b');
  assert.equal((await put(s.base, ID, TOKEN, 0, 'd')).status, 409);
  await s.close();
});
test('Ungültige Angaben, fehlende If-Match, kaputtes JSON', async () => {
  const s = await boot();
  assert.equal((await get(s.base, 'zz', TOKEN)).status, 400);
  assert.equal((await get(s.base, ID, 'kurz')).status, 400);
  let r = await fetch(s.base + '/v1/blob/' + ID, { method: 'PUT', headers: { 'X-Sync-Token': TOKEN }, body: '{}' }); assert.equal(r.status, 428);
  r = await fetch(s.base + '/v1/blob/' + ID, { method: 'PUT', headers: { 'X-Sync-Token': TOKEN, 'If-Match': '0' }, body: 'kein json' }); assert.equal(r.status, 400);
  r = await fetch(s.base + '/v1/blob/' + ID, { method: 'PUT', headers: { 'X-Sync-Token': TOKEN, 'If-Match': '0' }, body: JSON.stringify({ data: 5 }) }); assert.equal(r.status, 400);
  assert.equal((await fetch(s.base + '/nix')).status, 404);
  await s.close();
});
test('Zu große Datenblöcke werden abgewiesen', async () => {
  const s = await boot({ MAX_BODY: '200' });
  let r; try { r = await put(s.base, ID, TOKEN, 0, 'x'.repeat(1000)); } catch (e) { r = { status: 413 }; }
  assert.equal(r.status, 413);
  await s.close();
});
test('Löschen braucht das Token', async () => {
  const s = await boot();
  await put(s.base, ID, TOKEN, 0, 'x');
  assert.equal((await fetch(s.base + '/v1/blob/' + ID, { method: 'DELETE', headers: { 'X-Sync-Token': OTHER } })).status, 403);
  assert.equal((await fetch(s.base + '/v1/blob/' + ID, { method: 'DELETE', headers: { 'X-Sync-Token': TOKEN } })).status, 204);
  assert.equal((await get(s.base, ID, TOKEN)).status, 404);
  await s.close();
});
test('Sperre nach Fehlversuchen und Anfragen-Limit', async () => {
  const s = await boot({ FAIL_PER_MIN: '3', RATE_PER_MIN: '50' });
  await put(s.base, ID, TOKEN, 0, 'x');
  for (let i = 0; i < 3; i++) assert.equal((await get(s.base, ID, OTHER)).status, 403);
  assert.equal((await get(s.base, ID, TOKEN)).status, 429);
  await s.close();
  const t = await boot({ RATE_PER_MIN: '5' });
  let last; for (let i = 0; i < 8; i++) last = (await get(t.base, ID, TOKEN)).status;
  assert.equal(last, 429); await t.close();
});
test('Speichergrenze für neue Blöcke', async () => {
  const s = await boot({ MAX_BLOBS: '2' });
  assert.equal((await put(s.base, '1'.repeat(32), TOKEN, 0, 'a')).status, 200);
  assert.equal((await put(s.base, '2'.repeat(32), TOKEN, 0, 'a')).status, 200);
  assert.equal((await put(s.base, '3'.repeat(32), TOKEN, 0, 'a')).status, 507);
  assert.equal((await put(s.base, '1'.repeat(32), TOKEN, 1, 'b')).status, 200);   // bestehende dürfen weiter schreiben
  await s.close();
});
test('CORS: nur erlaubte Herkunft', async () => {
  const s = await boot();
  let r = await fetch(s.base + '/v1/blob/' + ID, { method: 'OPTIONS', headers: { Origin: 'https://flametan.github.io' } });
  assert.equal(r.status, 204); assert.equal(r.headers.get('access-control-allow-origin'), 'https://flametan.github.io');
  r = await fetch(s.base + '/health', { headers: { Origin: 'https://boese.example' } });
  assert.equal(r.headers.get('access-control-allow-origin'), null);
  await s.close();
});
test('Aufbewahrung: alter Block wird beim Start gelöscht', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bvisync-')); const f = path.join(dir, ID + '.json');
  fs.writeFileSync(f, '{}'); const old = new Date(Date.now() - 500 * 86400000); fs.utimesSync(f, old, old);
  const srv = createServer(config({ DATA_DIR: dir, EXPIRE_DAYS: '400' }));
  assert.equal(fs.existsSync(f), false); srv.close();
});
