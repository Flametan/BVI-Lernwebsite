'use strict';
/*
 * B VI Ranking und Wochenduell (gehört zum Sync-Dienst, eigene Datei rank.dat im Datenordner – bewusst ohne .json,
 * damit sie nicht als Sync-Datenblock gezählt wird).
 *
 * Alle Listen gelten je Jahrgang (Lehrgang): Die Kennung (jg, z. B. BRef-04-2025_AB-04-2026) kommt vom Gerät. Fehlt sie, gilt der Master.
 *
 *   PUT    /v1/rank/<id>               { name, jg, xp, week:{k:'2026-W47', xp}, av? }   Meldung, legt den Spieler beim ersten Mal an
 *   GET    /v1/rank/<id>?board=week|all[&jg=<Jahrgang>]                      Top 20 des Jahrgangs, eigener Platz
 *   GET    /v1/rank/<id>/duels                                                eigene Duelle mit Zwischenstand
 *   POST   /v1/rank/<id>/duel          { name }                               Herausforderung
 *   POST   /v1/rank/<id>/duel/<did>    { action: accept | decline | cancel }
 *   PUT    /v1/rank/<id>/games         { jg, g:{ <Spiel>:<Bestwert>, ... } }  beste Werte der Pausenspiele im Jahrgang (nur Teilnehmer)
 *   GET    /v1/rank/<id>/games?b=<Spiel>[&w=1][&jg=<Jahrgang>]                Top 20 des Spiels (w=1: nur diese Woche), eigener Platz
 *   GET    /v1/rank/<id>/games?all=1[&jg=<Jahrgang>]                          mein Platz in allen Listen (gesamt und Woche)
 *   (PUT games nimmt zusätzlich w:{k:<Woche>,g:{...}} mit den Wochenbestwerten)
 *   DELETE /v1/rank/<id>                                                      Teilnahme beenden (Spieler und Duelle weg)
 * Kopfzeile X-Rank-Token (zufällig, nur auf dem Gerät). Gespeichert wird nur ein Hash davon.
 */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');

const ID_RE = /^[a-f0-9]{32}$/;
const MASTER = 'BRef-04-2025_AB-04-2026';   // der bisherige Jahrgang: ältere Einträge und Geräte ohne Angabe gehören dorthin
const JG_RE = /^BRef-\d\d-\d{4}_AB-\d\d-\d{4}$/;
const MAX_JG = 12;   // so viele Jahrgänge pro Spieler genügen (zwei pro Jahr)
const jgOf = v => (typeof v === 'string' && JG_RE.test(v) ? v : MASTER);
const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,18}[\p{L}\p{N}]$/u;   // 3–20 Zeichen
const AV_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]{20,6000}$/;   // kleines Vorschaubild
// Pausenspiele: erlaubte Listen mit Höchstwert (Punkte, Serien) oder Zeitgrenzen in Sekunden (t: niedriger ist besser)
const GAMES = { fahrt: { max: 6000 }, duell: { max: 2000 }, lueckentext: { max: 200 }, reihenfolge: { max: 5000 }, hangman: { max: 5000 }, kreuzwort: { max: 4000 },
  'mahjong:leicht': { t: [15, 86400] }, 'mahjong:mittel': { t: [20, 86400] }, 'mahjong:pyramide': { t: [25, 86400] }, 'mahjong:burg': { t: [30, 86400] }, 'mahjong:festung': { t: [40, 86400] }, 'sudoku:leicht': { t: [20, 86400] }, 'sudoku:mittel': { t: [30, 86400] }, 'sudoku:schwer': { t: [40, 86400] },
  tetris: { max: 2000000 }, solitaer: { max: 100000 }, g2048: { max: 4000000 }, snake: { max: 100000 },
  'minesweeper:leicht': { t: [1, 86400] }, 'minesweeper:mittel': { t: [3, 86400] }, 'minesweeper:schwer': { t: [8, 86400] }, 'minesweeper:sehr': { t: [15, 86400] } };
const gameOk = (k, v) => Object.prototype.hasOwnProperty.call(GAMES, k) && Number.isInteger(v) && (GAMES[k].t ? v >= GAMES[k].t[0] && v <= GAMES[k].t[1] : v >= 1 && v <= GAMES[k].max);
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const eqHex = (a, b) => { try { return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex')); } catch (e) { return false; } };

// ISO-Woche (z. B. 2026-W47) in der Zeitzone des Lehrgangs
function isoWeek(date, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).map(x => [x.type, x.value]));
  const t = new Date(Date.UTC(+p.year, +p.month - 1, +p.day)), n = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - n);
  const y = t.getUTCFullYear();
  return y + '-W' + String(Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7)).padStart(2, '0');
}
const weekday = (date, tz) => ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 })[new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(date)];
const wkNum = k => { const m = /^(\d{4})-W(\d{2})$/.exec(k || ''); return m ? +m[1] * 53 + +m[2] : 0; };

function create(cfg, ctx) {
  const tz = cfg.rankTz, file = path.join(cfg.dataDir, 'rank.dat');
  const block = cfg.rankBlock;
  let db = { players: {}, duels: {} };
  try { db = JSON.parse(fs.readFileSync(file, 'utf8')); db.players = db.players || {}; db.duels = db.duels || {}; } catch (e) {}
  const nameKey = n => n.toLocaleLowerCase('de-DE');
  const byName = new Map(Object.entries(db.players).map(([id, p]) => [nameKey(p.name), id]));
  // Speichern: Anfragen sammeln, höchstens ein Schreibvorgang gleichzeitig
  let dirty = false, pending = null;
  function flush() {
    if (!pending) pending = (async () => {
      try { while (dirty) { dirty = false; const tmp = file + '.' + process.pid + '.tmp'; await fsp.writeFile(tmp, JSON.stringify(db)); await fsp.rename(tmp, file); } }
      catch (e) { console.error('rank.dat nicht beschreibbar:', e.message); }
      pending = null;
    })();
    return pending;
  }
  const persist = () => { dirty = true; flush(); };
  const now = () => new Date();
  const curWk = () => isoWeek(now(), tz);
  const nextWk = () => isoWeek(new Date(Date.now() + 7 * 864e5), tz);
  // Woche, in der ein neues Duell läuft: bis Donnerstag die laufende, danach die nächste
  const duelWk = () => weekday(now(), tz) <= 4 ? curWk() : nextWk();
  const weekXp = (p, k) => p.week && p.week.k === k ? p.week.xp : (p.prev && p.prev.k === k ? p.prev.xp : 0);

  function cleanName(raw) {
    const n = String(raw || '').normalize('NFC').trim().replace(/\s+/g, ' ');
    if (!NAME_RE.test(n)) return null;
    const low = nameKey(n);
    if (block.some(w => low.includes(w))) return null;
    return n;
  }
  // Spielwerte eines Spielers je Jahrgang: der Master nutzt die bisherigen Felder g und w, die übrigen liegen unter gj
  const gOf = (q, jg) => jg === MASTER ? q.g : (q.gj && q.gj[jg] ? q.gj[jg].g : undefined);
  const wOf = (q, jg) => jg === MASTER ? q.w : (q.gj && q.gj[jg] ? q.gj[jg].w : undefined);
  function slot(q, jg) {
    if (jg === MASTER) return { get g() { return q.g = q.g || {}; }, get w() { return q.w; }, set w(v) { q.w = v; } };
    q.gj = q.gj || {};
    if (!q.gj[jg]) { if (Object.keys(q.gj).length >= MAX_JG) return null; q.gj[jg] = { g: {}, w: null }; }
    return q.gj[jg];
  }
  const jgParam = (url, p) => url.searchParams.has('jg') ? jgOf(url.searchParams.get('jg')) : jgOf(p.jg);
  const num = (v, max) => Number.isInteger(v) && v >= 0 && v <= max ? v : null;

  function prune() {
    const old = wkNum(curWk()) - 3;
    for (const [id, d] of Object.entries(db.duels)) if (wkNum(d.wk) < old || !db.players[d.a] || !db.players[d.b]) delete db.duels[id];
    const limit = Date.now() - cfg.expireDays * 864e5;
    for (const [id, p] of Object.entries(db.players)) if (p.seen < limit) { byName.delete(nameKey(p.name)); delete db.players[id]; }
  }
  setInterval(() => { prune(); persist(); }, 86400000).unref();

  const view = (p, k) => ({ name: p.name, xp: k ? weekXp(p, k) : p.xp });
  function board(kind, id, jg) {
    const k = curWk();
    const rows = Object.entries(db.players)
      .filter(([pid, p]) => pid === id || jgOf(p.jg) === jg)
      .map(([pid, p]) => ({ pid, name: p.name, av: p.av || null, tx: p.xp, xp: kind === 'week' ? weekXp(p, k) : p.xp }))
      .filter(r => r.xp > 0 || r.pid === id)
      .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, 'de'));
    const me = rows.findIndex(r => r.pid === id);
    return { board: kind, week: k, total: rows.length, top: rows.slice(0, 20).map((r, i) => ({ place: i + 1, name: r.name, av: r.av, tx: r.tx, xp: r.xp, me: r.pid === id })), me: me < 0 ? null : { place: me + 1, xp: rows[me].xp } };
  }
  function duelsOf(id) {
    const k = curWk(), out = [];
    for (const [did, d] of Object.entries(db.duels)) {
      if (d.a !== id && d.b !== id) continue;
      const me = db.players[id], opp = db.players[d.a === id ? d.b : d.a];
      if (!opp) continue;
      const m = weekXp(me, d.wk), o = weekXp(opp, d.wk);
      const over = wkNum(d.wk) < wkNum(k);
      let status = d.status;
      if (status === 'pending' && over) status = 'expired';
      else if (status === 'active' && over) status = 'done';
      out.push({ id: did, wk: d.wk, status, mine: d.a === id, me: m, opp: o, oppName: opp.name, oppAv: opp.av || null, result: status === 'done' ? (m > o ? 'win' : m < o ? 'lose' : 'draw') : undefined });
    }
    return out.sort((a, b) => wkNum(b.wk) - wkNum(a.wk));
  }

  async function handle(req, res, url, io) {
    const { send, readBody } = io;
    const m = /^\/v1\/rank\/([^/]+)(?:\/(duels|duel|games)(?:\/([a-f0-9]{16}))?)?$/.exec(url.pathname);
    if (!m) return send(res, 404, { error: 'nicht gefunden' });
    const id = m[1], sub = m[2], did = m[3], token = String(req.headers['x-rank-token'] || '');
    if (!ID_RE.test(id) || !TOKEN_RE.test(token)) return send(res, 400, { error: 'ungültige Angaben' });
    const th = sha(token), p = db.players[id];
    const bad = () => { io.fail(); return send(res, 403, { error: 'kein Zugriff' }); };
    if (p && !eqHex(p.tokenHash, th)) return bad();

    if (!sub && req.method === 'PUT') {
      const raw = await readBody(req, res); if (raw === null) return;
      let j; try { j = JSON.parse(raw); } catch (e) { return send(res, 400, { error: 'kein JSON' }); }
      const name = cleanName(j && j.name), xp = num(j && j.xp, cfg.rankMaxXp);
      const wk = j && j.week, wxp = wk && num(wk.xp, cfg.rankMaxWeek), k = wk && wk.k;
      if (!name) return send(res, 422, { error: 'Name ungültig (3–20 Zeichen: Buchstaben, Ziffern, Leerzeichen, . _ -)' });
      if (xp === null || wxp === null || ![curWk(), nextWk(), isoWeek(new Date(Date.now() - 7 * 864e5), tz)].includes(k)) return send(res, 422, { error: 'Werte ungültig' });
      const av = j.av === undefined ? undefined : (j.av === null ? null : (typeof j.av === 'string' && AV_RE.test(j.av) ? j.av : false));
      if (av === false) return send(res, 422, { error: 'Bild ungültig' });
      const owner = byName.get(nameKey(name));
      if (owner && owner !== id) return send(res, 409, { error: 'Name schon vergeben' });
      if (!p && Object.keys(db.players).length >= cfg.rankMaxPlayers) return send(res, 507, { error: 'Ranking voll' });
      const t = Date.now();
      if (p) {
        // Plausibilität: höchstens so viele Punkte wie an einem sehr fleißigen Tag je vergangenem Tag
        const days = Math.ceil((t - p.seen) / 864e5) + 1, room = cfg.rankDayXp * days;
        // catchup: Gerät mit dem eigenen (token-geprüften) Konto meldet einen höheren Stand nach, z. B. nach neuer Anmeldung am PC
        if (j.catchup !== true && (xp > p.xp + room || (k === p.week.k && wxp > p.week.xp + room))) return send(res, 422, { error: 'Punkte unplausibel' });
        if (wkNum(k) > wkNum(p.week.k)) { p.prev = p.week; p.week = { k, xp: wxp }; }
        else if (k === p.week.k) p.week.xp = wxp;
        if (name !== p.name) { byName.delete(nameKey(p.name)); p.name = name; byName.set(nameKey(name), id); }
        if (av !== undefined) p.av = av;
        p.xp = xp; p.seen = t; p.jg = jgOf(j.jg);
      } else {
        db.players[id] = { name, jg: jgOf(j.jg), av: av || null, tokenHash: th, xp, week: { k, xp: wxp }, prev: null, seen: t };
        byName.set(nameKey(name), id);
      }
      persist();
      return send(res, 200, { ok: true, week: curWk() });
    }
    if (!p) return send(res, 404, { error: 'unbekannt' });
    p.seen = Date.now();

    if (sub === 'games' && req.method === 'PUT') {
      const raw = await readBody(req, res); if (raw === null) return;
      let j; try { j = JSON.parse(raw); } catch (e) { return send(res, 400, { error: 'kein JSON' }); }
      const g = j && j.g;
      if (!g || typeof g !== 'object' || Array.isArray(g) || Object.keys(g).length > 30) return send(res, 422, { error: 'Werte ungültig' });
      const better = (k, v, old) => old == null || (GAMES[k].t ? v < old : v > old);
      const sl = slot(p, jgOf(j.jg)); if (!sl) return send(res, 422, { error: 'Zu viele Jahrgänge' });
      for (const [k, v] of Object.entries(g)) if (gameOk(k, v) && better(k, v, sl.g[k])) sl.g[k] = v;   // ungültige Einträge werden übersprungen, damit ein einzelner Wert nicht alle blockiert
      // Wochenwerte: nur für die laufende Woche, eine neue Woche beginnt leer
      const w = j.w;
      if (w && typeof w === 'object' && w.k === curWk() && w.g && typeof w.g === 'object' && !Array.isArray(w.g) && Object.keys(w.g).length <= 30) {
        if (!sl.w || sl.w.k !== w.k) sl.w = { k: w.k, g: {} };
        for (const [k, v] of Object.entries(w.g)) if (gameOk(k, v) && better(k, v, sl.w.g[k])) sl.w.g[k] = v;
      }
      persist(); return send(res, 200, { ok: true });
    }
    if (sub === 'games' && req.method === 'GET') {
      const wk = curWk(), jg = jgParam(url, p);
      const rowsOf = (b, weekly) => {
        const low = !!GAMES[b].t;
        return Object.entries(db.players)
          .map(([pid, q]) => ({ pid, name: q.name, av: q.av || null, v: weekly ? (wOf(q, jg) && wOf(q, jg).k === wk && wOf(q, jg).g ? wOf(q, jg).g[b] : null) : (gOf(q, jg) ? gOf(q, jg)[b] : null) }))
          .filter(r => r.v != null)
          .sort((x, y) => (low ? x.v - y.v : y.v - x.v) || x.name.localeCompare(y.name, 'de'));
      };
      // Überblick über alle Listen: mein Platz je Spiel (gesamt und diese Woche), wer direkt vor mir liegt
      if (url.searchParams.get('all') === '1') {
        const out = {};
        for (const b of Object.keys(GAMES)) {
          const r = rowsOf(b, false), i = r.findIndex(x => x.pid === id);
          if (i < 0) continue;
          const wr = rowsOf(b, true), wi = wr.findIndex(x => x.pid === id);
          out[b] = { place: i + 1, total: r.length, v: r[i].v, above: i > 0 ? r[i - 1].name : null, wplace: wi < 0 ? null : wi + 1, wtotal: wr.length };
        }
        return send(res, 200, { week: wk, boards: out });
      }
      const b = url.searchParams.get('b') || '';
      if (!Object.prototype.hasOwnProperty.call(GAMES, b)) return send(res, 422, { error: 'Spiel unbekannt' });
      const rows = rowsOf(b, url.searchParams.get('w') === '1');
      const me = rows.findIndex(r => r.pid === id);
      return send(res, 200, { board: b, total: rows.length, top: rows.slice(0, 20).map((r, i) => ({ place: i + 1, name: r.name, av: r.av, v: r.v, me: r.pid === id })), me: me < 0 ? null : { place: me + 1, v: rows[me].v } });
    }

    if (!sub && req.method === 'GET') {
      const kind = url.searchParams.get('board') === 'all' ? 'all' : 'week';
      return send(res, 200, board(kind, id, jgParam(url, p)));
    }
    if (!sub && req.method === 'DELETE') {
      byName.delete(nameKey(p.name)); delete db.players[id];
      for (const [d, x] of Object.entries(db.duels)) if (x.a === id || x.b === id) delete db.duels[d];
      persist(); return send(res, 204);
    }
    if (sub === 'duels' && req.method === 'GET') { prune(); return send(res, 200, { week: curWk(), duelWeek: duelWk(), duels: duelsOf(id) }); }
    if (sub === 'duel' && !did && req.method === 'POST') {
      const raw = await readBody(req, res); if (raw === null) return;
      let j; try { j = JSON.parse(raw); } catch (e) { return send(res, 400, { error: 'kein JSON' }); }
      const oid = byName.get(nameKey(String(j && j.name || '').normalize('NFC').trim().replace(/\s+/g, ' ')));
      if (!oid) return send(res, 404, { error: 'Dieser Name ist im Ranking nicht zu finden' });
      if (oid === id) return send(res, 422, { error: 'Du kannst dich nicht selbst herausfordern' });
      const wk = duelWk(), mine = duelsOf(id).filter(d => d.status === 'pending' || d.status === 'active');
      if (mine.length >= cfg.rankMaxDuels) return send(res, 422, { error: 'Zu viele offene Duelle' });
      if (Object.values(db.duels).some(d => d.wk === wk && d.status !== 'declined' && ((d.a === id && d.b === oid) || (d.a === oid && d.b === id)))) return send(res, 409, { error: 'Zwischen euch läuft schon ein Duell für diese Woche' });
      const d = crypto.randomBytes(8).toString('hex');
      db.duels[d] = { a: id, b: oid, wk, status: 'pending', at: Date.now() };
      persist(); return send(res, 201, { id: d, wk });
    }
    if (sub === 'duel' && did && req.method === 'POST') {
      const raw = await readBody(req, res); if (raw === null) return;
      let j; try { j = JSON.parse(raw); } catch (e) { return send(res, 400, { error: 'kein JSON' }); }
      const d = db.duels[did];
      if (!d || (d.a !== id && d.b !== id)) return send(res, 404, { error: 'Duell nicht gefunden' });
      if (wkNum(d.wk) < wkNum(curWk())) return send(res, 422, { error: 'Das Duell ist beendet' });
      const a = j && j.action;
      if (a === 'accept' && d.status === 'pending' && d.b === id) d.status = 'active';
      else if (a === 'decline' && d.status === 'pending' && d.b === id) d.status = 'declined';
      else if (a === 'cancel' && d.a === id && d.status === 'pending') delete db.duels[did];
      else return send(res, 422, { error: 'Aktion nicht möglich' });
      persist(); return send(res, 200, { ok: true });
    }
    return send(res, 405, { error: 'Methode nicht erlaubt' });
  }
  prune();
  return { handle, flush: () => { dirty = true; return flush(); } };
}
module.exports = { create, isoWeek };
