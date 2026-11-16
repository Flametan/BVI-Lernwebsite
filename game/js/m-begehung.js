/* Mission „Begehung“: Man läuft als Einsatzkraft durch das Gebäude (dritte Person), steigt die Treppen wirklich hoch und runter
   und prüft an den Leuchtsäulen Türen, Wände, Decken und Treppen. Aufgaben und Lösungen stehen in game/data/begehung.json.
   Grundriss je Geschoss (Meter): x 0–26, z 0–12; Treppenraum x 0–5, notwendiger Flur x 5–9, Trenn- oder Brandwand bei x 18.
   Treppe: zweiläufig im Treppenraum (Lauf A links, Lauf B rechts, z 7,4–10,8). Gerade Geschosse steigen in A nach Süden,
   ungerade in B nach Norden; der Lauf des unteren Geschosses ist im oberen das Treppenloch. Gezeichnet wird immer nur ein Geschoss. */
(window.MISSIONS = window.MISSIONS || {}).begehung = (function(){
  const W = 26, DP = 12, FH = 3.0, WH = 2.7, TH = 0.25, XS = 5, XF = 9, XT = 18, R = 0.4, SPEED = 4.6;
  const ZN = 7.4, ZS = 10.8, LEN = ZS - ZN, BAND = { A:[0.125, 2.44], B:[2.56, 4.875] }, STUFEN = 12;
  const FARBE = { offen:'#f59e0b', ok:'#1f9d55', halb:'#b7791f', falsch:'#c53030' };
  // Wo die Leuchtsäule einer Aufgabe steht und wie das Bauteil heißt
  const ORT = {
    tuer_tr:[XS, 6, 'Tür'], tuer_ne:[XF, 6, 'Tür'], tuer_trenn:[XT, 6, 'Tür'],
    wand_tr:[XS + 0.75, 2.5, 'Wand Treppenraum'], wand_flur:[XF + 0.75, 2.5, 'Flurwand'], wand_trenn:[XT - 0.8, 2.5, 'Trennwand'], wand_brand:[XT - 0.9, 2.5, 'Brandwand'],
    wand_tragend:[15, 0.85, 'Tragende Wand'], decke:[13, 8.4, 'Decke'], treppe:[2.5, 6.3, 'Treppe'], flur:[7, 9.6, 'Flur'],
    fenster:[12, 0.85, 'Fenster'], tr_fenster:[2.5, 0.85, 'Fenster'], rauchabzug:[2.5, 3.4, 'Rauchabzug'], brand_dach:[XT - 0.9, 9.6, 'Brandwand am Dach']
  };
  const upBand = g => (g % 2 === 0 ? 'A' : 'B');
  const steigt = (k, z) => (k % 2 === 0 ? (z - ZN) / LEN : (ZS - z) / LEN);      // Anteil der Höhe auf dem Lauf des Geschosses k

  function start(ctx){
    const L = ctx.level, ui = ctx.ui, st = STAGE.create(ctx.canvas, ui), sc = st.scene, n = L.geschosse.length;
    const S = STAGE.surf, Mt = STAGE.mat;
    const braucht = (g, teil) => L.aufgaben.some(a => a.g === g && a.teil === teil);
    function mesh(geo, m, x, y, z, parent, cast){ const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast !== false; o.receiveShadow = true; parent.add(o); return o; }
    const quader = (parent, x1, z1, x2, z2, y0, h, m, cast) => mesh(new THREE.BoxGeometry(x2 - x1, h, z2 - z1), m, (x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2, parent, cast);

    /* ---------- Treppenlauf des Geschosses k (steht in k unten und hängt in k + 1 als Loch darunter) ---------- */
    const mStufe = S('beton', 1, 0.3, { color:STAGE.C('#d6d9dd') }), mWange = Mt('#6d737c'), mRohr = Mt('#c9ced6', { metalness:0.7, roughness:0.3 });
    function lauf(k, y0){
      const g = new THREE.Group(), b = BAND[upBand(k)], auf = k % 2 === 0, t = LEN / STUFEN, th = Math.atan2(FH, LEN) * (auf ? -1 : 1), sl = Math.hypot(FH, LEN);
      for(let j = 0; j < STUFEN; j++){
        const zc = auf ? ZN + (j + 0.5) * t : ZS - (j + 0.5) * t, top = (j + 1) * FH / STUFEN;
        mesh(new THREE.BoxGeometry(b[1] - b[0] - 0.1, 0.24, t + 0.03), mStufe, (b[0] + b[1]) / 2, top - 0.12, zc, g);
      }
      [b[0] + 0.04, b[1] - 0.04].forEach(x => { mesh(new THREE.BoxGeometry(0.07, 0.42, sl), mWange, x, FH / 2 - 0.12, (ZN + ZS) / 2, g).rotation.x = th; });
      mesh(new THREE.CylinderGeometry(0.03, 0.03, sl, 8), mRohr, 2.5, FH / 2 + 1.0, (ZN + ZS) / 2, g).rotation.x = th + Math.PI / 2;
      for(let i = 0; i <= 3; i++){ const f = i / 3, z = auf ? ZN + f * LEN : ZS - f * LEN; mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.0, 6), mRohr, 2.5, f * FH + 0.5, z, g); }
      g.position.y = y0; return g;
    }

    /* ---------- Geschosse bauen ---------- */
    const floors = L.geschosse.map((G, g) => {
      const grp = new THREE.Group(), boxes = [], faders = [], doors = [], name = G.name.toLowerCase(), keller = g === 0;
      const mWand = S('putz', 3, 1), mKante = Mt('#4b4f57');
      function wand(x1, z1, x2, z2, m, hoch){
        const h = hoch || WH, o = quader(grp, x1, z1, x2, z2, 0, h, (m || mWand).clone()); o.material.transparent = true;
        quader(o, -(x2 - x1) / 2, -(z2 - z1) / 2, (x2 - x1) / 2, (z2 - z1) / 2, h / 2, 0.035, mKante, false);        // dunkle Schnittkante oben
        boxes.push({ x1, x2, z1, z2 }); faders.push(o); return o;
      }
      const wallZ = (x, z1, z2, m, th) => wand(x - (th || TH) / 2, z1, x + (th || TH) / 2, z2, m);
      const wallX = (z, x1, x2, m) => wand(x1, z - TH / 2, x2, z + TH / 2, m);
      const mBlatt = S('holz', 1, 1, { color:STAGE.C('#c79a6b') }), mZarge = Mt('#5a5f68'), mGriff = Mt('#d5d9de', { metalness:0.8, roughness:0.25 });
      function divider(x, tuer, m, th){                 // Wand quer durch das Geschoss, auf Wunsch mit Tür bei z = 6
        if(!tuer){ wallZ(x, 0, DP, m, th); return; }
        wallZ(x, 0, 5.2, m, th); wallZ(x, 6.8, DP, m, th);
        const d = (th || TH) + 0.06; quader(grp, x - d / 2, 5.14, x + d / 2, 5.22, 0, 2.2, mZarge); quader(grp, x - d / 2, 6.78, x + d / 2, 6.86, 0, 2.2, mZarge); quader(grp, x - d / 2, 5.14, x + d / 2, 6.86, 2.16, 0.1, mZarge);
        const piv = new THREE.Group(); piv.position.set(x, 0, 5.22); grp.add(piv);
        mesh(new THREE.BoxGeometry(0.06, 2.12, 1.54), mBlatt, 0, 1.08, 0.78, piv);
        mesh(new THREE.SphereGeometry(0.04, 8, 6), mGriff, 0.07, 1.05, 1.4, piv); mesh(new THREE.SphereGeometry(0.04, 8, 6), mGriff, -0.07, 1.05, 1.4, piv);
        doors.push({ piv, x, z:6, a:0, o:0 });
      }
      // Böden (20 cm stark, Oberkante bei 0); im Treppenraum bleibt das Loch über dem Lauf des unteren Geschosses offen
      const boden = (x1, z1, x2, z2, m) => quader(grp, x1, z1, x2, z2, -0.2, 0.2, m, false);
      const mTr = S('fliese', 2.5, 2.5), loch = g > 0 ? upBand(g - 1) : null;
      boden(0, 0, XS, ZN, mTr); boden(0, ZS, XS, DP, mTr); boden(2.44, ZN, 2.56, ZS, mTr);
      if(loch !== 'A') boden(0, ZN, 2.44, ZS, mTr); if(loch !== 'B') boden(2.56, ZN, XS, ZS, mTr);
      const art = keller ? 'beton' : /büro/.test(name) ? 'teppich' : /wohn/.test(name) ? 'holz' : /laden/.test(name) ? 'fliese' : 'estrich';
      const mRaum = S(art, art === 'holz' ? 5 : 9, art === 'holz' ? 6 : 5);
      if(G.flur){ boden(XS, 0, XF, DP, S('fliese', 2, 6, { color:STAGE.C('#f0dba6') })); boden(XF, 0, W, DP, mRaum); } else boden(XS, 0, W, DP, mRaum);
      // Wände
      const mAussen = S('putz', 6, 1, { color:STAGE.C(keller ? '#b9b6b0' : '#efe6d6') });
      wallX(0, 0, W, mAussen); wallX(DP, 0, W, mAussen); wallZ(0, TH / 2, DP - TH / 2, mAussen); wallZ(W, TH / 2, DP - TH / 2, mAussen);
      divider(XS, true);
      if(G.flur) divider(XF, true);
      const mBrand = S('ziegel', 4, 1.5);
      if(L.brand) divider(XT, braucht(g, 'tuer_trenn'), mBrand, 0.5); else if(G.trenn) divider(XT, braucht(g, 'tuer_trenn'));
      if(!keller){
        const mRahmen = Mt('#f4f4f1'), mGlas = Mt('#9ccbf0', { roughness:0.08, metalness:0.4, transparent:true, opacity:0.75 });
        [[12, 1.6], [2.5, 1.0], [22, 1.6], [16.5, 1.2]].forEach(([x, w]) => { quader(grp, x - w / 2 - 0.07, -0.16, x + w / 2 + 0.07, 0.16, 0.93, 1.34, mRahmen, false); quader(grp, x - w / 2, -0.18, x + w / 2, 0.18, 1.0, 1.2, mGlas, false); quader(grp, x - 0.025, -0.19, x + 0.025, 0.19, 1.0, 1.2, mRahmen, false); });
      }
      // Treppe: eigener Lauf nach oben, Lauf des unteren Geschosses im Loch, Geländer an den gesperrten Enden
      if(g < n - 1) grp.add(lauf(g, 0)); if(g > 0) grp.add(lauf(g - 1, -FH));
      boxes.push({ x1:2.44, x2:2.56, z1:ZN, z2:ZS });
      const zGel = g % 2 === 0 ? ZS : ZN;
      [[g < n - 1, upBand(g)], [g > 0, loch]].forEach(([da, b]) => { if(!da) return; const r = BAND[b]; quader(grp, r[0], zGel - 0.03, r[1], zGel + 0.03, 0.95, 0.06, mRohr, false); quader(grp, r[0], zGel - 0.02, r[1], zGel + 0.02, 0.45, 0.04, mRohr, false); [r[0] + 0.05, (r[0] + r[1]) / 2, r[1] - 0.05].forEach(x => quader(grp, x - 0.025, zGel - 0.025, x + 0.025, zGel + 0.025, 0, 0.98, mRohr, false)); });
      einrichten(grp, boxes, name, L.brand || G.trenn, !!G.flur, keller);
      const lb = STAGE.label(G.name, { color:'#ffffff', bg:'rgba(20,24,32,.78)', h:0.5 }); lb.position.set(2.5, 3.3, 1.6); grp.add(lb);
      grp.visible = false; sc.add(grp);
      return { grp, boxes, faders, doors };
    });

    /* Möbel: eine Sperrfläche je Möbelgruppe, Einzelteile nur fürs Auge */
    function einrichten(grp, boxes, name, geteilt, flur, keller){
      const q = (x1, z1, x2, z2, y0, h, m) => quader(grp, x1, z1, x2, z2, y0, h, m), sperre = (x1, z1, x2, z2) => boxes.push({ x1, x2, z1, z2 });
      const holz = S('holz', 1, 1), dunkel = Mt('#22262c'), metall = Mt('#8b949f', { metalness:0.6, roughness:0.4 }), stoff = Mt('#4f6f95'), weiss = Mt('#f1f1ee'), gruen = Mt('#3f8a45'), ton = Mt('#a5673f');
      const pflanze = (x, z) => { mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 10), ton, x, 0.2, z, grp); mesh(new THREE.IcosahedronGeometry(0.42, 1), gruen, x, 0.85, z, grp); sperre(x - 0.2, z - 0.2, x + 0.2, z + 0.2); };
      const kiste = (x, z, s, h) => { q(x - s / 2, z - s / 2, x + s / 2, z + s / 2, 0, h, holz); sperre(x - s / 2, z - s / 2, x + s / 2, z + s / 2); };
      const max = geteilt ? XT - 1.2 : W - 0.6, x0 = flur ? XF + 1.2 : XS + 1.2;
      if(/büro/.test(name)){
        [[x0 + 1.6, 10.2], [x0 + 5.2, 10.2], [x0 + 1.6, 3.6]].forEach(([x, z]) => {
          q(x - 0.85, z - 0.4, x + 0.85, z + 0.4, 0.7, 0.05, holz); q(x - 0.83, z - 0.38, x - 0.78, z + 0.38, 0, 0.7, metall); q(x + 0.78, z - 0.38, x + 0.83, z + 0.38, 0, 0.7, metall);
          q(x - 0.3, z + 0.15, x + 0.3, z + 0.19, 0.85, 0.36, dunkel); q(x - 0.04, z + 0.14, x + 0.04, z + 0.2, 0.75, 0.1, dunkel); q(x - 0.25, z - 0.2, x + 0.15, z - 0.05, 0.75, 0.02, dunkel);
          q(x - 0.24, z - 1.0, x + 0.24, z - 0.55, 0.42, 0.08, stoff); q(x - 0.24, z - 1.05, x + 0.24, z - 0.98, 0.5, 0.5, stoff); mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), metall, x, 0.21, z - 0.78, grp);
          sperre(x - 0.85, z - 1.05, x + 0.85, z + 0.4);
        });
        q(max - 0.5, 1, max, 4.4, 0, 1.9, weiss); for(let i = 0; i < 4; i++) q(max - 0.52, 1.1, max - 0.5, 4.3, 0.3 + i * 0.42, 0.04, dunkel); sperre(max - 0.5, 1, max, 4.4);
        pflanze(x0 + 4, 1.2);
      } else if(/wohn/.test(name)){
        q(x0 + 0.8, 10.6, x0 + 3.2, 11.5, 0, 0.42, stoff); q(x0 + 0.8, 11.3, x0 + 3.2, 11.55, 0.42, 0.45, stoff); q(x0 + 0.8, 10.6, x0 + 1.02, 11.5, 0.42, 0.22, stoff); q(x0 + 2.98, 10.6, x0 + 3.2, 11.5, 0.42, 0.22, stoff); sperre(x0 + 0.8, 10.6, x0 + 3.2, 11.55);
        q(x0 + 0.6, 8.4, x0 + 3.4, 10.2, 0, 0.02, Mt('#9a4b3c')); q(x0 + 1.4, 9, x0 + 2.6, 9.6, 0.38, 0.05, holz); sperre(x0 + 1.4, 9, x0 + 2.6, 9.6);
        q(x0 + 5, 9.6, x0 + 6.5, 10.6, 0.72, 0.05, holz); [[5.05, 9.65], [6.4, 9.65], [5.05, 10.5], [6.4, 10.5]].forEach(([a, b]) => q(x0 + a, b, x0 + a + 0.06, b + 0.06, 0, 0.72, holz)); sperre(x0 + 5, 9.6, x0 + 6.5, 10.6);
        const bx = Math.min(max - 2.2, 21.5); q(bx, 1, bx + 2.1, 2.7, 0, 0.3, holz); q(bx + 0.05, 1.05, bx + 2.05, 2.65, 0.3, 0.2, weiss); q(bx + 0.1, 1.15, bx + 0.6, 2.55, 0.5, 0.1, weiss); q(bx - 0.06, 1, bx, 2.7, 0, 0.9, holz); sperre(bx - 0.06, 1, bx + 2.1, 2.7);
        pflanze(x0 + 4.2, 1.2);
      } else if(/laden/.test(name)){
        q(x0 + 0.6, 10.3, x0 + 3.8, 11, 0, 1.0, holz); q(x0 + 0.55, 10.25, x0 + 3.85, 11.05, 1.0, 0.05, weiss); q(x0 + 1, 10.45, x0 + 1.5, 10.85, 1.05, 0.3, dunkel); sperre(x0 + 0.55, 10.25, x0 + 3.85, 11.05);
        const farben = ['#c0392b', '#2e86c1', '#f1c40f', '#27ae60', '#8e44ad'].map(c => Mt(c));
        [x0 + 8, x0 + 10.4, x0 + 12.8, x0 + 15.2].forEach((x, i) => { if(x > max - 0.5) return; q(x - 0.3, 2, x + 0.3, 5.2, 0, 1.9, metall); for(let r = 0; r < 4; r++) for(let k = 0; k < 5; k++) q(x - 0.34, 2.15 + k * 0.6, x + 0.34, 2.6 + k * 0.6, 0.25 + r * 0.42, 0.3, farben[(i + r + k) % 5]); sperre(x - 0.34, 2, x + 0.34, 5.2); });
      } else if(keller){
        [[x0 + 1, 10.6, 1, 0.9], [x0 + 2.1, 10.8, 0.8, 0.7], [x0 + 1.4, 10.7, 0.6, 0.6]].forEach((k, i) => { if(i < 2) kiste(k[0], k[1], k[2], k[3]); else q(k[0] - 0.3, k[1] - 0.3, k[0] + 0.3, k[1] + 0.3, 0.9, 0.5, holz); });
        mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.7, 16), Mt('#b33a2e', { metalness:0.4, roughness:0.5 }), x0 + 6, 0.85, 10.6, grp); sperre(x0 + 5.45, 10.05, x0 + 6.55, 11.15);
        mesh(new THREE.CylinderGeometry(0.06, 0.06, Math.max(2, max - x0), 8), metall, (x0 + max) / 2, 2.4, 11.6, grp).rotation.z = Math.PI / 2;
        q(Math.min(max - 0.5, 21), 1, Math.min(max, 21.5), 4.4, 0, 1.9, metall); sperre(Math.min(max - 0.5, 21), 1, Math.min(max, 21.5), 4.4);
      } else {
        kiste(x0 + 1, 10.6, 1, 0.8); kiste(x0 + 2.2, 10.8, 0.7, 0.6); kiste(x0 + 6, 10.6, 0.9, 1.0);
        [x0 + 3, x0 + 8, x0 + 12].forEach(x => { if(x < max) mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.1, 12), Mt('#e6c66a'), x, 0.28, 2.2, grp).rotation.z = Math.PI / 2; });
        for(let x = x0 + 1.5; x < max; x += 4) mesh(new THREE.BoxGeometry(0.16, 0.2, DP - 0.6), holz, x, 2.6, DP / 2, grp);
      }
    }

    /* ---------- Außenwelt (Geländehöhe = Fußboden des Erdgeschosses) ---------- */
    const out = new THREE.Group(); sc.add(out);
    (function welt(){
      const flaeche = (x1, z1, x2, z2, y, m) => { const o = mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), m, (x1 + x2) / 2, y, (z1 + z2) / 2, out, false); o.rotation.x = -Math.PI / 2; return o; };
      const gras = (x1, z1, x2, z2) => flaeche(x1, z1, x2, z2, -0.02, S('gras', (x2 - x1) / 5, (z2 - z1) / 5));
      gras(-220, -220, -0.3, 240); gras(W + 0.3, -220, 250, 240); gras(-0.3, -220, W + 0.3, -0.3); gras(-0.3, DP + 0.3, W + 0.3, 240);
      const pfl = (x1, z1, x2, z2) => flaeche(x1, z1, x2, z2, 0.01, S('pflaster', (x2 - x1) / 2, (z2 - z1) / 2));
      pfl(-2.2, -2.2, -0.3, DP + 2.2); pfl(W + 0.3, -2.2, W + 2.2, DP + 2.2); pfl(-0.3, -2.2, W + 0.3, -0.3); pfl(-0.3, DP + 0.3, W + 0.3, DP + 2.2); pfl(1.4, DP + 2.2, 3.6, 19.5);
      pfl(-110, 19.5, 140, 22); flaeche(-110, 22, 140, 30, 0.0, S('asphalt', 60, 2)); pfl(-110, 30, 140, 32.5);
      const weiss = Mt('#e8e8e4'), kante = Mt('#8d8f92');
      for(let x = -105; x < 138; x += 7) quader(out, x, 25.9, x + 3, 26.1, 0, 0.012, weiss, false);
      quader(out, -110, 21.9, 140, 22.05, 0, 0.14, kante, false); quader(out, -110, 29.95, 140, 30.1, 0, 0.14, kante, false);
      // Hecke und Bäume
      const hecke = Mt('#2f6b35'), stamm = Mt('#5b4332'), laub = ['#3f8f45', '#4d9a4a', '#35803f', '#5aa552'].map(c => Mt(c));
      quader(out, -8, 18.4, 0.8, 19.2, 0, 1.0, hecke); quader(out, 4.2, 18.4, 34, 19.2, 0, 1.0, hecke); quader(out, -8, -9, -7.2, 18.4, 0, 1.0, hecke); quader(out, 33.2, -9, 34, 18.4, 0, 1.0, hecke);
      function baum(x, z, s){
        mesh(new THREE.CylinderGeometry(0.16 * s, 0.26 * s, 3 * s, 8), stamm, x, 1.5 * s, z, out);
        [[0, 4.1, 0, 1.75], [0.9, 3.5, 0.4, 1.25], [-0.8, 3.6, -0.5, 1.3], [0.2, 5.1, -0.2, 1.2]].forEach((b, i) => mesh(new THREE.IcosahedronGeometry(b[3] * s, 1), laub[(i + (x | 0) + 40) % 4], x + b[0] * s, b[1] * s, z + b[2] * s, out));
      }
      for(let x = -96; x <= 130; x += 11) baum(x, 31.3, 0.95 + ((x * 7) % 5 + 5) % 5 * 0.06);
      [[-14, 6, 1.2], [-17, -12, 1.4], [-3, -13, 1.1], [9, -16, 1.5], [21, -12, 1.2], [31, -15, 1.35], [42, 2, 1.25], [40, -10, 1.1], [-22, 14, 1.3], [44, 15, 1.2], [-30, -4, 1.5], [55, -14, 1.4]].forEach(b => baum(b[0], b[1], b[2]));
      // Nachbarhäuser
      function haus(x, z, w, d, h, dach, farbe){
        const m = S('fassade', Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 6)), { color:STAGE.C(farbe) });
        quader(out, x, z, x + w, z + d, 0, h, m);
        const r = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.4, dach, 4), S('ziegel', 4, 2), x + w / 2, h + dach / 2, z + d / 2, out); r.rotation.y = Math.PI / 4; r.scale.set(1, 1, d / w * 1.0 + 0.2);
      }
      haus(-34, 38, 18, 12, 10, 3.5, '#f0e2c8'); haus(-10, 39, 16, 11, 13, 3, '#e9d9d0'); haus(12, 38, 20, 13, 9.5, 3.5, '#dfe6ea'); haus(38, 39, 15, 11, 12.5, 3, '#f1e9c9'); haus(60, 38, 19, 12, 10, 3.5, '#e6d3bd'); haus(-62, 39, 20, 12, 12, 3.2, '#e3e0d6');
      haus(-40, -6, 14, 12, 9.5, 3, '#ecdcc6'); haus(52, -4, 15, 13, 12.5, 3.2, '#e2e7dd'); haus(-5, -42, 22, 13, 10, 3.5, '#eadfce'); haus(28, -44, 16, 12, 13, 3, '#e6ded2');
      // Laternen und Hydrant
      const mast = Mt('#3c4046', { metalness:0.6, roughness:0.4 }), licht = Mt('#fff3c4', { emissive:STAGE.C('#ffe9a0'), emissiveIntensity:1.2 });
      for(let x = -84; x <= 120; x += 24){ mesh(new THREE.CylinderGeometry(0.07, 0.1, 6, 8), mast, x, 3, 21.2, out); quader(out, x - 0.06, 21.2, x + 0.06, 22.6, 5.9, 0.1, mast); quader(out, x - 0.16, 22.2, x + 0.16, 22.7, 5.78, 0.12, licht, false); }
      mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.7, 10), Mt('#c62d22'), 6.5, 0.35, 20.3, out); mesh(new THREE.SphereGeometry(0.14, 10, 8), Mt('#c62d22'), 6.5, 0.72, 20.3, out);
      // Löschfahrzeug vor dem Haus
      (function hlf(x, z){
        const rot = Mt('#c4261c', { roughness:0.35, metalness:0.2 }), glas = Mt('#1d2b3a', { roughness:0.1, metalness:0.6 }), rad = Mt('#151515'), felge = Mt('#c8ccd1', { metalness:0.7, roughness:0.3 }), blau = Mt('#2b6cff', { emissive:STAGE.C('#1b4fd6'), emissiveIntensity:1.5 });
        quader(out, x, z, x + 2.3, z + 2.5, 0.75, 2.05, rot); quader(out, x + 2.35, z, x + 7.6, z + 2.5, 0.75, 2.35, rot); quader(out, x, z + 0.02, x + 7.6, z + 2.48, 0.45, 0.32, Mt('#2a2d31'));
        quader(out, x - 0.03, z + 0.2, x + 0.02, z + 2.3, 1.75, 0.85, glas); quader(out, x + 0.35, z - 0.03, x + 1.95, z + 2.53, 1.8, 0.75, glas);
        quader(out, x - 0.02, z - 0.02, x + 7.62, z + 2.52, 1.3, 0.16, weiss); quader(out, x - 0.12, z + 0.1, x + 0.05, z + 2.4, 0.5, 0.35, felge);
        [[2.7, 0.9], [3.95, 0.9], [5.2, 0.9], [6.4, 0.9]].forEach(([a]) => { quader(out, x + a, z - 0.03, x + a + 1.05, z + 2.53, 1.55, 1.35, Mt('#b9bec5', { metalness:0.6, roughness:0.4 })); });
        [[1.3, 0], [6.1, 0], [1.3, 2.5], [6.1, 2.5]].forEach(([a, b]) => { const r = mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.34, 18), rad, x + a, 0.52, z + b, out); r.rotation.x = Math.PI / 2; const f = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.36, 12), felge, x + a, 0.52, z + b, out); f.rotation.x = Math.PI / 2; });
        quader(out, x + 0.5, z + 0.3, x + 1.9, z + 0.55, 2.8, 0.16, blau); quader(out, x + 0.5, z + 1.95, x + 1.9, z + 2.2, 2.8, 0.16, blau);
        quader(out, x + 2.6, z + 0.5, x + 7.4, z + 0.62, 3.12, 0.08, felge); quader(out, x + 2.6, z + 1.1, x + 7.4, z + 1.22, 3.12, 0.08, felge); for(let i = 0; i < 12; i++) quader(out, x + 2.7 + i * 0.4, z + 0.5, x + 2.76 + i * 0.4, z + 1.22, 3.14, 0.05, felge, false);
      })(9, 22.6);
      // Autos
      [[-16, 27.2, '#2f5d8a'], [38, 22.5, '#8a8f96'], [-44, 22.5, '#7a2f2f']].forEach(([x, z, c]) => { const lack = Mt(c, { roughness:0.3, metalness:0.4 }); quader(out, x, z, x + 4.3, z + 1.8, 0.35, 0.65, lack); quader(out, x + 1, z + 0.08, x + 3.4, z + 1.72, 1.0, 0.55, Mt('#1d2b3a', { roughness:0.1, metalness:0.6 })); [[0.9, 0], [3.4, 0], [0.9, 1.8], [3.4, 1.8]].forEach(([a, b]) => { mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14), Mt('#151515'), x + a, 0.34, z + b, out).rotation.x = Math.PI / 2; }); });
      // Hügel am Horizont
      [[-150, -170, 90], [20, -210, 120], [170, -150, 100], [-200, 60, 110], [210, 80, 120], [40, 220, 130]].forEach(h => { const o = mesh(new THREE.SphereGeometry(h[2], 20, 10), Mt('#5f8a5a'), h[0], -h[2] * 0.72, h[1], out, false); o.receiveShadow = false; });
    })();
    // Baukörper unter dem gezeigten Geschoss (wird je nach Geschoss gestreckt)
    const mRumpf = S('fassade', 5, 1), rumpf = mesh(new THREE.BoxGeometry(W + 0.24, 1, DP + 0.24), mRumpf, W / 2, 0, DP / 2, sc);

    /* ---------- Aufgaben: Leuchtsäule und Schild am Bauteil ---------- */
    const tasks = L.aufgaben.map((a, i) => {
      const o = ORT[a.teil]; if(!o || !floors[a.g]){ console.error('Bauteil fehlt', a.g, a.teil); return null; }
      const b = STAGE.beam(FARBE.offen); b.position.set(o[0], 0, o[1]); floors[a.g].grp.add(b);
      const lb = STAGE.label(o[2], { color:'#ffffff', bg:'rgba(20,24,32,.78)', h:0.4 }); lb.position.set(o[0], 3.25, o[1]); floors[a.g].grp.add(lb);
      return { a, i, g:a.g, x:o[0], z:o[1], beam:b, state:null };
    }).filter(Boolean);
    let left = tasks.length;

    /* ---------- Figur, Treppe, Kamera, Ablauf ---------- */
    const fig = STAGE.figure(); sc.add(fig);
    const pfeil = STAGE.arrow(FARBE.offen); sc.add(pfeil); let stepT = 0;
    const pos = { x:2.5, z:4.6, y:0 }; let cur = Math.min(1, n - 1), shown = -1, face = Math.PI, near = null, busy = false, uiKey = '';
    const tgt = new THREE.Vector3(pos.x, 1.2, pos.z), ray = new THREE.Raycaster(), tmp = new THREE.Vector3(); let faded = [], tick = 0;

    // In welchem Lauf steht die Stelle (x, z) im Geschoss g? up = eigener Lauf nach oben, down = Lauf des unteren Geschosses
    function zone(x, z, g){
      if(z <= ZN || z >= ZS || x >= XS - TH / 2) return null;
      const b = x < 2.5 ? 'A' : 'B';
      if(g < n - 1 && b === upBand(g)) return { k:g, dir:1 };
      if(g > 0 && b === upBand(g - 1)) return { k:g - 1, dir:-1 };
      return null;
    }
    // Einen Lauf betritt man nur am offenen Ende: gerade Geschosse von Norden, ungerade von Süden
    const einstieg = (zAlt, g) => (g % 2 === 0 ? zAlt <= ZN : zAlt >= ZS);
    function schritt(dx, dz){
      const B = floors[cur].boxes;
      if(dx && !STAGE.blocked(pos.x + dx, pos.z, R, B)){ const a = zone(pos.x, pos.z, cur), b = zone(pos.x + dx, pos.z, cur); if(!(b && !a)) pos.x += dx; }
      if(dz && !STAGE.blocked(pos.x, pos.z + dz, R, B)){
        const a = zone(pos.x, pos.z, cur), b = zone(pos.x, pos.z + dz, cur);
        if(b && !a && !einstieg(pos.z, cur)) return;
        pos.z += dz;
        if(a && !b){                                     // Lauf verlassen: am fernen Ende ist man im nächsten Geschoss
          const fern = cur % 2 === 0 ? pos.z >= ZS : pos.z <= ZN;
          if(fern){ cur += a.dir; pos.y -= a.dir * FH; tgt.y -= a.dir * FH; uiKey = ''; }
        }
      }
    }
    function zeige(g){
      if(g === shown) return; shown = g;
      floors.forEach((f, i) => { f.grp.visible = i === g; }); faded.forEach(m => { m.material.opacity = 1; }); faded = [];
    }

    function refreshUi(){
      const offenHier = tasks.filter(t => t.g === cur && t.state === null).length, sonst = left - offenHier;
      const key = [cur, near ? near.i : -1, offenHier, left].join('|'); if(key === uiKey) return; uiKey = key;
      ui.info.textContent = L.geschosse[cur].name + ' · hier offen: ' + offenHier + (sonst ? ' · andere Geschosse: ' + sonst : '');
      ui.act.hidden = !near; if(near) ui.act.textContent = 'Prüfen: ' + ORT[near.a.teil][2];
    }
    async function pruefen(){
      if(busy || !near) return;
      const t = near; busy = true; st.pause(true);
      const res = await ctx.ask(t.a);                    // { tries } oder null, wenn die Frage geschlossen wurde
      busy = false; st.pause(false); if(!res) return;
      t.state = res.tries; t.beam.setColor(FARBE[res.tries === 1 ? 'ok' : res.tries === 2 ? 'halb' : 'falsch'], false);
      near = null; uiKey = ''; ctx.count(res.tries);
      if(--left === 0) ctx.finish();
    }
    st.input.action = pruefen; st.input.key = k => { if(k === 'Escape' || k === 'p') ctx.menu(); };
    ui.act.onclick = pruefen; ui.up.hidden = ui.down.hidden = true;

    st.start((dt, time) => {
      const inp = st.input, sy = Math.sin(inp.yaw), cy = Math.cos(inp.yaw);
      let zn = zone(pos.x, pos.z, cur);
      // Bewegung relativ zur Kamera: vorwärts = von der Kamera weg; auf der Treppe langsamer
      const v = SPEED * (zn ? 0.55 : 1), vx = (cy * inp.mx - sy * inp.my) * v, vz = (-sy * inp.mx - cy * inp.my) * v, sp = Math.hypot(vx, vz);
      if(sp > 0.05){
        const z0 = pos.z; schritt(vx * dt, vz * dt); zn = zone(pos.x, pos.z, cur);
        let d = Math.atan2(vx, vz) - face; d = Math.atan2(Math.sin(d), Math.cos(d)); face += d * Math.min(1, dt * 12);
        if((stepT -= dt) <= 0){ stepT = zn ? 0.3 : 0.36; STAGE.sfx(zn ? 'stairs' : 'step'); }
        fig.userData.steig = zn ? Math.sign((pos.z - z0) * (zn.k % 2 === 0 ? 1 : -1)) : 0;
      } else fig.userData.steig = 0;
      // Höhe: auf dem Lauf stufenweise (leicht geglättet), sonst auf dem Boden
      let h = 0;
      if(zn){ const f = Math.max(0, Math.min(1, steigt(zn.k, pos.z))), stufe = Math.floor(f * STUFEN + 0.5) / STUFEN; h = (zn.k - cur) * FH + (stufe * 0.6 + f * 0.4) * FH; }
      pos.y += (h - pos.y) * Math.min(1, dt * 18);
      zeige(Math.max(0, Math.min(n - 1, cur + (pos.y > FH / 2 ? 1 : pos.y < -FH / 2 ? -1 : 0))));
      const off = (shown - cur) * FH, F = floors[shown];
      F.grp.position.y = off; out.position.y = (1 - cur) * FH;
      const rh = Math.max(0, (shown - 1) * FH); rumpf.visible = rh > 0; if(rumpf.visible){ rumpf.scale.y = rh; rumpf.position.y = off - 0.2 - rh / 2; mRumpf.map.repeat.y = Math.max(1, Math.round(rh / 3)); }
      fig.position.set(pos.x, pos.y, pos.z); fig.rotation.y = face; fig.animate(dt, sp, fig.userData.steig || 0);
      F.doors.forEach(d => { const open = Math.hypot(pos.x - d.x, pos.z - d.z) < 2.3 ? 1.5 : 0; if(open && !d.o) STAGE.sfx('door'); d.o = open; d.a += (open - d.a) * Math.min(1, dt * 7); d.piv.rotation.y = d.a; });
      // Nächste offene Aufgabe (zum Prüfen) und Ziel des Richtungspfeils
      near = null; let best = 2.1, zx = null, zz = 0, bd = 1e9, oben = false, unten = false;
      tasks.forEach(t => {
        t.beam.userData.mat.uniforms.uTime.value = time; if(t.state !== null) return;
        if(t.g > cur) oben = true; else if(t.g < cur) unten = true;
        else { const d = Math.hypot(pos.x - t.x, pos.z - t.z); if(d < best && !zn){ best = d; near = t; } if(d < bd){ bd = d; zx = t.x; zz = t.z; } }
      });
      if(zx === null && (oben || unten)){ const b = BAND[oben ? upBand(cur) : upBand(cur - 1)]; zx = (b[0] + b[1]) / 2; zz = cur % 2 === 0 ? ZN - 0.4 : ZS + 0.4; bd = Math.hypot(pos.x - zx, pos.z - zz); }
      pfeil.visible = zx !== null && bd > 1.6 && !zn;
      if(pfeil.visible){ const a = Math.atan2(zx - pos.x, zz - pos.z); pfeil.position.set(pos.x + Math.sin(a) * 1.1, pos.y + 0.07, pos.z + Math.cos(a) * 1.1); pfeil.rotation.y = a; }
      refreshUi();
      // Kamera folgt weich hinter und über der Figur; Sonne und Himmel wandern mit
      const kf = Math.min(1, dt * 8); tgt.x += (pos.x - tgt.x) * kf; tgt.z += (pos.z - tgt.z) * kf; tgt.y += (pos.y + 1.2 - tgt.y) * kf;
      const cp = Math.cos(inp.pitch), d = inp.dist;
      st.camera.position.set(tgt.x + sy * cp * d, tgt.y + Math.sin(inp.pitch) * d, tgt.z + cy * cp * d); st.camera.lookAt(tgt); st.follow(tgt);
      // Wände zwischen Kamera und Figur werden durchsichtig (jeden dritten Durchlauf geprüft)
      if(++tick % 3 === 0){
        tmp.set(pos.x, pos.y + 1.3, pos.z); const len = tmp.distanceTo(st.camera.position);
        ray.set(st.camera.position, tmp.sub(st.camera.position).normalize()); ray.far = len - 0.4;
        const hit = ray.intersectObjects(F.faders, false).map(x => x.object);
        faded.forEach(m => { if(!hit.includes(m)) m.material.opacity = 1; }); hit.forEach(m => { m.material.opacity = 0.16; }); faded = hit;
      }
    });

    return {
      dispose(){ ui.act.hidden = true; ui.act.onclick = null; st.dispose(); },
      pause: v => st.pause(v), stage:st,
      // für die automatische Prüfung
      _stage:st, _pos:pos, _tasks:tasks, _floor:() => cur, _shown:() => shown,
      _goto(i){ const t = tasks[i]; cur = t.g; pos.x = t.x; pos.z = t.z; pos.y = 0; tgt.set(pos.x, 1.2, pos.z); uiKey = ''; }
    };
  }
  return { start };
})();
