'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { createServer, config } = require('../server.js');
const { isoWeek } = require('../rank.js');

const A = 'a'.repeat(32), B = 'b'.repeat(32), C = 'c'.repeat(32), TA = 'A'.repeat(43), TB = 'B'.repeat(43);
async function boot(env = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bvirank-'));
  const srv = createServer(config({ DATA_DIR: dir, RANK_BLOCK: 'dummkopf', ...env }));
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const call = (method, p, tok, body) => fetch(base + '/v1/rank/' + p, { method, headers: { 'X-Rank-Token': tok, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  return { call, srv, dir, close: () => new Promise(r => srv.close(r)) };
}
const wk = () => isoWeek(new Date(), 'Europe/Berlin');
const rep = (s, id, tok, name, xp, w) => s.call('PUT', id, tok, { name, xp, week: { k: wk(), xp: w } });

test('Anmelden, Name eindeutig, Liste', async () => {
  const s = await boot();
  assert.equal((await rep(s, A, TA, 'Anna', 300, 120)).status, 200);
  assert.equal((await rep(s, B, TB, 'anna', 100, 10)).status, 409);          // Name schon vergeben (Groß/Klein egal)
  assert.equal((await rep(s, B, TB, 'Ben', 500, 60)).status, 200);
  let j = await (await s.call('GET', A + '?board=week', TA)).json();
  assert.deepEqual(j.top.map(x => x.name), ['Anna', 'Ben']); assert.equal(j.me.place, 1);
  j = await (await s.call('GET', A + '?board=all', TA)).json();
  assert.deepEqual(j.top.map(x => x.name), ['Ben', 'Anna']); assert.equal(j.me.place, 2);
  await s.close();
});
test('Falsches Token, ungültiger und gesperrter Name, unplausible Punkte', async () => {
  const s = await boot();
  await rep(s, A, TA, 'Anna', 100, 10);
  assert.equal((await s.call('GET', A + '?board=all', TB)).status, 403);
  assert.equal((await rep(s, B, TB, 'x', 1, 1)).status, 422);
  assert.equal((await rep(s, B, TB, 'Du Dummkopf', 1, 1)).status, 422);
  assert.equal((await rep(s, A, TA, 'Anna', 90000, 10)).status, 422);        // Sprung weit über dem Tageslimit
  assert.equal((await rep(s, A, TA, 'Anna', 200, 9000)).status, 422);        // Wochenwert über dem Maximum
  await s.close();
});
test('Vorschaubild wird gespeichert und angezeigt, ungültiges abgelehnt', async () => {
  const s = await boot(); const av = 'data:image/jpeg;base64,' + 'QUJD'.repeat(20);
  assert.equal((await s.call('PUT', A, TA, { name: 'Anna', xp: 1, week: { k: wk(), xp: 1 }, av: 'data:text/html;base64,AAAA' })).status, 422);
  assert.equal((await s.call('PUT', A, TA, { name: 'Anna', xp: 5, week: { k: wk(), xp: 5 }, av })).status, 200);
  await rep(s, A, TA, 'Anna', 6, 6);                                          // ohne av: bleibt erhalten
  assert.equal((await (await s.call('GET', A + '?board=all', TA)).json()).top[0].av, av);
  await s.close();
});
test('Teilnahme beenden', async () => {
  const s = await boot();
  await rep(s, A, TA, 'Anna', 100, 10);
  assert.equal((await s.call('DELETE', A, TA)).status, 204);
  assert.equal((await s.call('GET', A + '?board=all', TA)).status, 404);
  assert.equal((await rep(s, B, TB, 'Anna', 100, 10)).status, 200);          // Name wieder frei
  await s.close();
});
test('Duell: herausfordern, annehmen, Zwischenstand', async () => {
  const s = await boot();
  await rep(s, A, TA, 'Anna', 300, 100); await rep(s, B, TB, 'Ben', 300, 40); await rep(s, C, 'C'.repeat(43), 'Cem', 1, 1);
  assert.equal((await s.call('POST', A + '/duel', TA, { name: 'Anna' })).status, 422);
  assert.equal((await s.call('POST', A + '/duel', TA, { name: 'Nobody' })).status, 404);
  let r = await s.call('POST', A + '/duel', TA, { name: 'ben' }); assert.equal(r.status, 201); const { id } = await r.json();
  assert.equal((await s.call('POST', A + '/duel', TA, { name: 'Ben' })).status, 409);
  assert.equal((await s.call('POST', A + '/duel/' + id, TA, { action: 'accept' })).status, 422);   // Herausforderer darf nicht selbst annehmen
  assert.equal((await s.call('POST', B + '/duel/' + id, TB, { action: 'accept' })).status, 200);
  assert.equal((await s.call('POST', C + '/duel/' + id, 'C'.repeat(43), { action: 'accept' })).status, 404);  // Dritte sehen das Duell nicht
  const j = await (await s.call('GET', B + '/duels', TB)).json();
  assert.equal(j.duels.length, 1); assert.equal(j.duels[0].status, 'active'); assert.equal(j.duels[0].me, 40); assert.equal(j.duels[0].opp, 100); assert.equal(j.duels[0].oppName, 'Anna');
  await s.close();
});
test('Daten bleiben nach Neustart erhalten', async () => {
  const s = await boot();
  await rep(s, A, TA, 'Anna', 100, 10); await s.srv.flushRank(); const dir = s.dir; await s.close();
  const srv = createServer(config({ DATA_DIR: dir })); await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const r = await fetch('http://127.0.0.1:' + srv.address().port + '/v1/rank/' + A + '?board=all', { headers: { 'X-Rank-Token': TA } });
  assert.equal((await r.json()).top[0].name, 'Anna'); srv.close();
});
test('rank.dat zählt nicht als Sync-Block', async () => {
  const s = await boot(); await rep(s, A, TA, 'Anna', 1, 1); await s.srv.flushRank();
  assert.ok(fs.existsSync(path.join(s.dir, 'rank.dat'))); assert.ok(!fs.readdirSync(s.dir).some(f => f.endsWith('.json')));
  await s.close();
});
