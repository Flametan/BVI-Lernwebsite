'use strict';
/*
 * B VI Sync-Dienst: speichert pro Sync-Code einen verschlüsselten Datenblock.
 * Der Server sieht nie Klartext: Die App verschlüsselt auf dem Gerät. Es gibt keine Konten, keine Namen, keine Mailadressen.
 *
 *   GET    /health            → "ok"
 *   GET    /v1/blob/<id>      → { version, updatedAt, data }      Kopfzeile X-Sync-Token nötig
 *   GET    /v1/blob/<id>?have=<Version> → { version, updatedAt, unchanged:true } ohne Daten, wenn die Version noch stimmt
 *   PUT    /v1/blob/<id>      → { version, updatedAt }            Kopfzeilen X-Sync-Token, If-Match (Version, 0 = neu)
 *   DELETE /v1/blob/<id>      → 204                               Kopfzeile X-Sync-Token
 *
 * <id> und Token werden in der App aus dem Sync-Code abgeleitet. Ohne den Code kommt niemand an die Daten.
 * Umgebungsvariablen: siehe CONFIG unten.
 */
const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');

function config(env) {
  const num = (k, d) => { const v = Number(env[k]); return Number.isFinite(v) && v > 0 ? v : d; };
  return {
    port: num('PORT', 8787),
    dataDir: env.DATA_DIR || path.join(__dirname, 'data'),
    maxBody: num('MAX_BODY', 1024 * 1024),               // Bytes je Datenblock
    maxBlobs: num('MAX_BLOBS', 5000),                    // Anzahl Datenblöcke insgesamt
    ratePerMin: num('RATE_PER_MIN', 120),                // Anfragen je IP und Minute
    failPerMin: num('FAIL_PER_MIN', 10),                 // falsche Token je IP und Minute, danach gesperrt
    expireDays: num('EXPIRE_DAYS', 400),                 // ungenutzte Blöcke werden nach so vielen Tagen gelöscht
    allowOrigins: (env.ALLOW_ORIGINS || 'https://flametan.github.io').split(',').map(s => s.trim()).filter(Boolean),
    trustProxy: env.TRUST_PROXY === '1'                  // hinter Tunnel/Proxy: X-Forwarded-For für die IP nutzen
  };
}

const ID_RE = /^[a-f0-9]{32}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const eqHex = (a, b) => { try { return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex')); } catch (e) { return false; } };

function createServer(cfg) {
  fs.mkdirSync(cfg.dataDir, { recursive: true });
  try { const t = path.join(cfg.dataDir, '.write-test'); fs.writeFileSync(t, 'x'); fs.unlinkSync(t); } catch (e) { console.error('ACHTUNG: Datenordner nicht beschreibbar (' + e.message + ') – z. B. sudo chown -R 1000:1000 <Ordner>'); }
  const file = id => path.join(cfg.dataDir, id + '.json');
  const hits = new Map();       // ip -> { start, n, fails }

  // Namen der vorhandenen Blöcke und Kopfdaten der zuletzt benutzten im Speicher: so braucht es kein Verzeichnis-Lesen und selten ein Lesen der Datei
  const names = new Set(fs.readdirSync(cfg.dataDir).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)));
  const count = () => names.size;
  const meta = new Map();       // id -> { tokenHash, version, updatedAt }
  const META_MAX = 2000;
  const remember = (id, rec) => { meta.delete(id); meta.set(id, { tokenHash: rec.tokenHash, version: rec.version, updatedAt: rec.updatedAt }); if (meta.size > META_MAX) meta.delete(meta.keys().next().value); };
  // je Datenblock nacheinander: Lesen, Prüfen und Schreiben dürfen sich bei gleichzeitigen Anfragen nicht überholen
  const locks = new Map();
  function withLock(id, fn) {
    const prev = locks.get(id) || Promise.resolve();
    const next = prev.then(fn, fn);
    const tail = next.catch(() => {}).then(() => { if (locks.get(id) === tail) locks.delete(id); });
    locks.set(id, tail);
    return next;
  }
  function ipOf(req) {
    if (cfg.trustProxy) { const x = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(); if (x) return x; }
    return req.socket.remoteAddress || 'unknown';
  }
  function slot(ip) {
    const now = Date.now(); let h = hits.get(ip);
    if (!h || now - h.start > 60000) { h = { start: now, n: 0, fails: 0 }; hits.set(ip, h); }
    return h;
  }
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now - v.start > 120000) hits.delete(k); }, 60000).unref();

  function cors(req, res) {
    const o = req.headers.origin;
    if (o && (cfg.allowOrigins.includes('*') || cfg.allowOrigins.includes(o))) {
      res.setHeader('Access-Control-Allow-Origin', cfg.allowOrigins.includes('*') ? '*' : o);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Sync-Token,If-Match');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  function send(res, code, obj) {
    const body = obj === undefined ? '' : (typeof obj === 'string' ? obj : JSON.stringify(obj));
    res.writeHead(code, { 'Content-Type': typeof obj === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  }
  function readBody(req, res) {
    return new Promise(resolve => {
      const chunks = []; let n = 0, dead = false;
      req.on('data', c => { if (dead) return; n += c.length; if (n > cfg.maxBody) { dead = true; send(res, 413, { error: 'zu groß' }); req.destroy(); resolve(null); return; } chunks.push(c); });
      req.on('end', () => { if (!dead) resolve(Buffer.concat(chunks).toString('utf8')); });
      req.on('error', () => resolve(null));
    });
  }
  // Kopfdaten (aus dem Speicher, sonst aus der Datei) und der ganze Block
  async function head(id) {
    if (!names.has(id)) return null;
    if (meta.has(id)) { const m = meta.get(id); remember(id, m); return m; }
    const rec = await full(id); return rec ? meta.get(id) : null;
  }
  async function full(id) {
    if (!names.has(id)) return null;
    try { const rec = JSON.parse(await fsp.readFile(file(id), 'utf8')); remember(id, rec); return rec; } catch (e) { return null; }
  }
  async function save(id, rec) {
    const tmp = file(id) + '.' + process.pid + '.' + Date.now() + '.tmp';
    await fsp.writeFile(tmp, JSON.stringify(rec)); await fsp.rename(tmp, file(id));
    names.add(id); remember(id, rec);
  }

  async function handle(req, res) {
    cors(req, res);
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/health') return send(res, 200, 'ok');
    const m = /^\/v1\/blob\/([^/]+)$/.exec(url.pathname);
    if (!m) return send(res, 404, { error: 'nicht gefunden' });

    const h = slot(ipOf(req));
    if (h.fails >= cfg.failPerMin) return send(res, 429, { error: 'zu viele Fehlversuche' });
    if (++h.n > cfg.ratePerMin) return send(res, 429, { error: 'zu viele Anfragen' });

    const id = m[1], token = String(req.headers['x-sync-token'] || '');
    if (!ID_RE.test(id) || !TOKEN_RE.test(token)) return send(res, 400, { error: 'ungültige Angaben' });
    const th = sha(token);
    const bad = () => { h.fails++; return send(res, 403, { error: 'kein Zugriff' }); };

    if (req.method === 'GET') {
      const hd = await head(id);
      if (!hd) return send(res, 404, { error: 'unbekannt' });
      if (!eqHex(hd.tokenHash, th)) return bad();
      const have = Number(url.searchParams.get('have'));
      if (Number.isInteger(have) && have > 0 && have === hd.version) return send(res, 200, { version: hd.version, updatedAt: hd.updatedAt, unchanged: true });
      const rec = await full(id);
      if (!rec) return send(res, 404, { error: 'unbekannt' });
      return send(res, 200, { version: rec.version, updatedAt: rec.updatedAt, data: rec.data });
    }
    if (req.method === 'DELETE') {
      return withLock(id, async () => {
        const hd = await head(id);
        if (!hd) return send(res, 204);
        if (!eqHex(hd.tokenHash, th)) return bad();
        try { await fsp.unlink(file(id)); } catch (e) {}
        names.delete(id); meta.delete(id);
        return send(res, 204);
      });
    }
    if (req.method === 'PUT') {
      const ifm = Number(req.headers['if-match']);
      if (!Number.isInteger(ifm) || ifm < 0) return send(res, 428, { error: 'If-Match fehlt' });
      const raw = await readBody(req, res); if (raw === null) return;
      let data; try { const j = JSON.parse(raw); data = j && j.data; } catch (e) { return send(res, 400, { error: 'kein JSON' }); }
      if (typeof data !== 'string' || !data.length) return send(res, 400, { error: 'data fehlt' });
      return withLock(id, async () => {
        const cur = await head(id);
        if (cur && !eqHex(cur.tokenHash, th)) return bad();
        const curV = cur ? cur.version : 0;
        if (ifm !== curV) { const f = cur && await full(id); return send(res, 409, { error: 'Version veraltet', version: curV, updatedAt: cur && cur.updatedAt, data: f ? f.data : undefined }); }
        if (!cur && count() >= cfg.maxBlobs) return send(res, 507, { error: 'Speicher voll' });
        const out = { tokenHash: th, version: curV + 1, updatedAt: new Date().toISOString(), data };
        try { await save(id, out); } catch (e) { console.error('Speichern fehlgeschlagen:', e.message); return send(res, 500, { error: 'Speichern auf dem Server nicht möglich (Schreibrechte im Datenordner prüfen)' }); }
        return send(res, 200, { version: out.version, updatedAt: out.updatedAt });
      });
    }
    return send(res, 405, { error: 'Methode nicht erlaubt' });
  }
  const server = http.createServer((req, res) => {
    handle(req, res).catch(e => { console.error('Fehler:', e && e.message); if (!res.headersSent) send(res, 500, { error: 'Serverfehler' }); else res.end(); });
  });

  // ungenutzte Blöcke aufräumen (beim Start einmal sofort, danach täglich ohne den Server zu blockieren)
  async function sweep() {
    const limit = Date.now() - cfg.expireDays * 86400000;
    for (const id of [...names]) {
      try {
        const st = await fsp.stat(file(id));
        if (st.mtimeMs < limit) { await fsp.unlink(file(id)); names.delete(id); meta.delete(id); }
      } catch (e) {}
    }
  }
  for (const f of fs.readdirSync(cfg.dataDir)) {
    if (!f.endsWith('.json')) continue;
    try { if (fs.statSync(path.join(cfg.dataDir, f)).mtimeMs < Date.now() - cfg.expireDays * 86400000) { fs.unlinkSync(path.join(cfg.dataDir, f)); names.delete(f.slice(0, -5)); } } catch (e) {}
  }
  setInterval(() => { sweep().catch(() => {}); }, 86400000).unref();
  return server;
}

module.exports = { createServer, config };
if (require.main === module) {
  const cfg = config(process.env);
  createServer(cfg).listen(cfg.port, '0.0.0.0', () => console.log('B VI Sync-Dienst läuft auf Port ' + cfg.port));
}
