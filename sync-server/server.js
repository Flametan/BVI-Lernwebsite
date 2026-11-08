'use strict';
/*
 * B VI Sync-Dienst: speichert pro Sync-Code einen verschlüsselten Datenblock.
 * Der Server sieht nie Klartext: Die App verschlüsselt auf dem Gerät. Es gibt keine Konten, keine Namen, keine Mailadressen.
 *
 *   GET    /health            → "ok"
 *   GET    /v1/blob/<id>      → { version, updatedAt, data }      Kopfzeile X-Sync-Token nötig
 *   PUT    /v1/blob/<id>      → { version, updatedAt }            Kopfzeilen X-Sync-Token, If-Match (Version, 0 = neu)
 *   DELETE /v1/blob/<id>      → 204                               Kopfzeile X-Sync-Token
 *
 * <id> und Token werden in der App aus dem Sync-Code abgeleitet. Ohne den Code kommt niemand an die Daten.
 * Umgebungsvariablen: siehe CONFIG unten.
 */
const http = require('http');
const fs = require('fs');
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

  const count = () => fs.readdirSync(cfg.dataDir).filter(f => f.endsWith('.json')).length;
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
  function readBody(req, res, cb) {
    const chunks = []; let n = 0, dead = false;
    req.on('data', c => { if (dead) return; n += c.length; if (n > cfg.maxBody) { dead = true; send(res, 413, { error: 'zu groß' }); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => { if (!dead) cb(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', () => {});
  }
  const load = id => { try { return JSON.parse(fs.readFileSync(file(id), 'utf8')); } catch (e) { return null; } };
  function save(id, rec) { const tmp = file(id) + '.' + process.pid + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(rec)); fs.renameSync(tmp, file(id)); }

  const server = http.createServer((req, res) => {
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
    const rec = load(id);
    const bad = () => { h.fails++; return send(res, 403, { error: 'kein Zugriff' }); };

    if (req.method === 'GET') {
      if (!rec) return send(res, 404, { error: 'unbekannt' });
      if (!eqHex(rec.tokenHash, th)) return bad();
      return send(res, 200, { version: rec.version, updatedAt: rec.updatedAt, data: rec.data });
    }
    if (req.method === 'DELETE') {
      if (!rec) return send(res, 204);
      if (!eqHex(rec.tokenHash, th)) return bad();
      try { fs.unlinkSync(file(id)); } catch (e) {}
      return send(res, 204);
    }
    if (req.method === 'PUT') {
      const ifm = Number(req.headers['if-match']);
      if (!Number.isInteger(ifm) || ifm < 0) return send(res, 428, { error: 'If-Match fehlt' });
      return readBody(req, res, raw => {
        let data; try { const j = JSON.parse(raw); data = j && j.data; } catch (e) { return send(res, 400, { error: 'kein JSON' }); }
        if (typeof data !== 'string' || !data.length) return send(res, 400, { error: 'data fehlt' });
        const cur = load(id);
        if (cur && !eqHex(cur.tokenHash, th)) return bad();
        const curV = cur ? cur.version : 0;
        if (ifm !== curV) return send(res, 409, { error: 'Version veraltet', version: curV, updatedAt: cur && cur.updatedAt, data: cur && cur.data });
        if (!cur && count() >= cfg.maxBlobs) return send(res, 507, { error: 'Speicher voll' });
        const out = { tokenHash: th, version: curV + 1, updatedAt: new Date().toISOString(), data };
        try { save(id, out); } catch (e) { console.error('Speichern fehlgeschlagen:', e.message); return send(res, 500, { error: 'Speichern auf dem Server nicht möglich (Schreibrechte im Datenordner prüfen)' }); }
        return send(res, 200, { version: out.version, updatedAt: out.updatedAt });
      });
    }
    return send(res, 405, { error: 'Methode nicht erlaubt' });
  });

  // ungenutzte Blöcke aufräumen (beim Start und danach täglich)
  function sweep() {
    const limit = Date.now() - cfg.expireDays * 86400000;
    for (const f of fs.readdirSync(cfg.dataDir)) {
      if (!f.endsWith('.json')) continue;
      try { if (fs.statSync(path.join(cfg.dataDir, f)).mtimeMs < limit) fs.unlinkSync(path.join(cfg.dataDir, f)); } catch (e) {}
    }
  }
  sweep(); setInterval(sweep, 86400000).unref();
  return server;
}

module.exports = { createServer, config };
if (require.main === module) {
  const cfg = config(process.env);
  createServer(cfg).listen(cfg.port, '0.0.0.0', () => console.log('B VI Sync-Dienst läuft auf Port ' + cfg.port));
}
