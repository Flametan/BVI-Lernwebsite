/* Missionen in einer begehbaren Welt auf einer Ebene (alle außer der Begehung):
   Stabsraum, Brandschutzdienststelle, Einsatzstelle, Lagezentrum, Flugfeld, Wache, Hörsaal, Planungsbüro.
   Die Aufgaben stehen an Stationen (Leuchtsäulen). Aufgabenarten: Frage (mc, multi, reihe) oder „bringen“
   (Meldung am Sichter holen und zum zuständigen Sachgebiet tragen). Daten: game/data/<mission>.json, Feld „welt“ wählt die Kulisse.
   Einsatz (Level mit „szenario“): Die Schritte folgen fest aufeinander, jeweils an einer Station; eine schlechte Entscheidung kann einen
   Folgeschritt auslösen, Nebenmeldungen treffen nach einer Zeit von selbst ein und haben eine Frist.
   Aufgabenart „stadt“: Über dem Raum erscheint ein Stadtmodell, auf dem Wachen gesetzt werden. */
(window.MISSIONS = window.MISSIONS || {}).welt = (function(){
  const WH = 2.7, TH = 0.25, R = 0.4, SPEED = 4.8;
  const FARBE = { offen:'#f59e0b', ok:'#1f9d55', halb:'#b7791f', falsch:'#c53030', ziel:'#2f7de1' };

  function start(ctx){
    const L = ctx.level, ui = ctx.ui, st = STAGE.create(ctx.canvas, ui, { licht:ctx.licht, fx:ctx.fx }), sc = st.scene, S = STAGE.surf, Mt = STAGE.mat, C = STAGE.C;
    const boxes = [], faders = [], npcs = [], laeufer = [], takt = [], ao = (x1, z1, x2, z2, k, rand) => STAGE.schatten(sc, x1, z1, x2, z2, k, rand);
    const schirm = Mt('#0f1722', { emissive:C('#3f78c8'), emissiveIntensity:0.9, roughness:0.3 });      // leuchtende Bildschirme
    function mesh(geo, m, x, y, z, cast){ const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast !== false; o.receiveShadow = true; sc.add(o); return o; }
    const q = (x1, z1, x2, z2, y0, h, m, cast) => mesh(new THREE.BoxGeometry(x2 - x1, h, z2 - z1), m, (x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2, cast);
    const sperre = (x1, z1, x2, z2) => boxes.push({ x1, x2, z1, z2 });
    const flaeche = (x1, z1, x2, z2, y, m) => { const o = mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), m, (x1 + x2) / 2, y, (z1 + z2) / 2, false); o.rotation.x = -Math.PI / 2; return o; };
    const M = { holz:S('holz', 1, 1), dunkel:Mt('#22262c'), metall:Mt('#8b949f', { metalness:0.6, roughness:0.4 }), stoff:Mt('#4f6f95'), weiss:Mt('#f1f1ee'), gruen:Mt('#3f8a45'), ton:Mt('#a5673f'),
      rot:Mt('#c4261c', { roughness:0.35, metalness:0.2 }), glas:Mt('#1d2b3a', { roughness:0.1, metalness:0.6 }), rad:Mt('#151515'), felge:Mt('#c8ccd1', { metalness:0.7, roughness:0.3 }), kante:Mt('#4b4f57'), stamm:Mt('#5b4332') };
    const laub = ['#3f8f45', '#4d9a4a', '#35803f', '#5aa552'].map(c => Mt(c));

    /* ---------- Bausteine ---------- */
    function wand(x1, z1, x2, z2, m){
      const o = q(x1, z1, x2, z2, 0, WH, (m || S('putz', 3, 1)).clone()); o.material.transparent = true;
      const k = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, 0.035, z2 - z1), M.kante); k.position.y = WH / 2 + 0.018; o.add(k);
      sperre(x1, z1, x2, z2); faders.push(o); ao(x1, z1, x2, z2, 0.34, 0.3); return o;
    }
    // Raum mit Tür in der Südwand (2 m breit, offen); Boden nach Art
    function raum(w, d, boden, rx, rz, aussen){
      q(0, 0, w, d, -0.2, 0.2, S(boden, rx || w / 2, rz || d / 2), false);
      const ma = S('putz', 6, 1, { color:C(aussen || '#efe6d6') }), t = TH / 2, tx = w / 2;
      wand(0, -t, w, t, ma); wand(-t, t, t, d - t, ma); wand(w - t, t, w + t, d - t, ma); wand(0, d - t, tx - 1, d + t, ma); wand(tx + 1, d - t, w, d + t, ma);
      const mr = Mt('#f4f4f1'), mg = Mt('#9ccbf0', { roughness:0.08, metalness:0.4, transparent:true, opacity:0.75 });
      for(let x = 3; x < w - 2; x += 4.5){ q(x - 0.87, -0.16, x + 0.87, 0.16, 0.93, 1.34, mr, false); q(x - 0.8, -0.18, x + 0.8, 0.18, 1.0, 1.2, mg, false); }
      umgebung(w, d); st.quellen.staub(1, 1, w - 1, d - 1, 2.4, 46);
      st.lampe(w * 0.28, 2.5, d * 0.5); st.lampe(w * 0.72, 2.5, d * 0.5);
      return { w, d, start:{ x:tx, z:d - 1.6 }, grenzen:{ x1:-1, z1:-1, x2:w + 1, z2:d + 2.5 } };
    }
    function baum(x, z, s){
      mesh(new THREE.CylinderGeometry(0.16 * s, 0.26 * s, 3 * s, 8), M.stamm, x, 1.5 * s, z);
      [[0, 4.1, 0, 1.75], [0.9, 3.5, 0.4, 1.25], [-0.8, 3.6, -0.5, 1.3], [0.2, 5.1, -0.2, 1.2]].forEach((b, i) => mesh(new THREE.IcosahedronGeometry(b[3] * s, 1), laub[(i + Math.abs(x | 0)) % 4], x + b[0] * s, b[1] * s, z + b[2] * s));
    }
    function haus(x, z, w, d, h, farbe){
      q(x, z, x + w, z + d, 0, h, S('fassade', Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 6)), { color:C(farbe) }));
      const r = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.4, 3.2, 4), S('ziegel', 4, 2), x + w / 2, h + 1.6, z + d / 2); r.rotation.y = Math.PI / 4;
    }
    // Umgebung eines Gebäudes: Wiese (mit Aussparung), Pflaster, Bäume, Nachbarhäuser, Hügel
    function umgebung(w, d){
      const gras = (x1, z1, x2, z2) => flaeche(x1, z1, x2, z2, -0.02, S('gras', (x2 - x1) / 5, (z2 - z1) / 5));
      gras(-200, -200, -0.3, 220); gras(w + 0.3, -200, w + 220, 220); gras(-0.3, -200, w + 0.3, -0.3); gras(-0.3, d + 0.3, w + 0.3, 220);
      const pfl = (x1, z1, x2, z2) => flaeche(x1, z1, x2, z2, 0.01, S('pflaster', (x2 - x1) / 2, (z2 - z1) / 2));
      pfl(-2, -2, -0.3, d + 2); pfl(w + 0.3, -2, w + 2, d + 2); pfl(-0.3, -2, w + 0.3, -0.3); pfl(-0.3, d + 0.3, w + 0.3, d + 2); pfl(w / 2 - 1.2, d + 2, w / 2 + 1.2, d + 12);
      [[-9, 4, 1.2], [-12, -9, 1.4], [w / 2, -11, 1.3], [w + 9, -8, 1.2], [w + 11, 6, 1.35], [w + 8, d + 9, 1.1], [-10, d + 8, 1.3], [w / 2 - 9, d + 13, 1.2], [w / 2 + 10, d + 14, 1.25]].forEach(b => baum(b[0], b[1], b[2]));
      haus(-36, -4, 16, 12, 10, '#ecdcc6'); haus(w + 20, -6, 16, 13, 12, '#e2e7dd'); haus(w / 2 - 12, -40, 22, 13, 11, '#eadfce'); haus(w / 2 - 30, d + 30, 18, 12, 10, '#f0e2c8'); haus(w / 2 + 10, d + 30, 18, 12, 12.5, '#dfe6ea');
      huegel();
    }
    function huegel(){ [[-150, -170, 90], [20, -210, 120], [170, -150, 100], [-200, 60, 110], [210, 80, 120], [40, 220, 130]].forEach(h => { const o = mesh(new THREE.SphereGeometry(h[2], 20, 10), Mt('#5f8a5a'), h[0], -h[2] * 0.72, h[1], false); o.receiveShadow = false; }); }
    function tisch(x, z, w, d, m){ q(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0.7, 0.05, m || M.holz); q(x - w / 2 + 0.03, z - d / 2 + 0.03, x - w / 2 + 0.09, z + d / 2 - 0.03, 0, 0.7, M.metall); q(x + w / 2 - 0.09, z - d / 2 + 0.03, x + w / 2 - 0.03, z + d / 2 - 0.03, 0, 0.7, M.metall); sperre(x - w / 2, z - d / 2, x + w / 2, z + d / 2); ao(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0.42, 0.22); }
    function monitor(x, z, nachSueden){ const s = nachSueden ? 1 : -1; q(x - 0.3, z - 0.02, x + 0.3, z + 0.02, 0.88, 0.36, M.dunkel); q(x - 0.27, z + s * 0.021, x + 0.27, z + s * 0.03, 0.91, 0.3, schirm, false); q(x - 0.04, z - 0.03, x + 0.04, z + 0.03, 0.75, 0.13, M.dunkel); q(x - 0.25, z + s * 0.18, x + 0.2, z + s * 0.32, 0.75, 0.02, M.dunkel); }
    function stuhl(x, z, m){ q(x - 0.24, z - 0.24, x + 0.24, z + 0.24, 0.42, 0.08, m || M.stoff); mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), M.metall, x, 0.21, z); }
    function regal(x1, z1, x2, z2, bunt){ q(x1, z1, x2, z2, 0, 1.9, M.weiss); sperre(x1, z1, x2, z2); ao(x1, z1, x2, z2, 0.4, 0.25); const f = ['#8a2f2f', '#2f5d8a', '#3f7a45', '#b08a2e', '#5b4a7a'].map(c => Mt(c)), lang = x2 - x1 > z2 - z1;
      for(let r = 0; r < 4; r++) for(let k = 0; k < 6; k++){ const u = k / 6; if(lang) q(x1 + 0.08 + u * (x2 - x1 - 0.16), z2 - 0.02, x1 + 0.08 + (u + 0.14) * (x2 - x1 - 0.16), z2 + 0.03, 0.25 + r * 0.42, 0.3, bunt === false ? M.metall : f[(r + k) % 5], false); else q(x2 - 0.02, z1 + 0.08 + u * (z2 - z1 - 0.16), x2 + 0.03, z1 + 0.08 + (u + 0.14) * (z2 - z1 - 0.16), 0.25 + r * 0.42, 0.3, f[(r + k) % 5], false); } }
    function pflanze(x, z){ mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 10), M.ton, x, 0.2, z); mesh(new THREE.IcosahedronGeometry(0.42, 1), M.gruen, x, 0.85, z); sperre(x - 0.2, z - 0.2, x + 0.2, z + 0.2); ao(x - 0.2, z - 0.2, x + 0.2, z + 0.2, 0.4, 0.2); }
    // Tafel oder Bildschirm an der Wand: Titel und angedeuteter Inhalt, im Browser gezeichnet
    function tafel(x, y, z, w, h, titel, art, rotY){
      const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const g = c.getContext('2d'), H = c.height;
      g.fillStyle = art === 'karte' ? '#b9d3c0' : art === 'kreide' ? '#24402f' : '#14202e'; g.fillRect(0, 0, 512, H);
      if(art === 'karte'){ g.fillStyle = '#8fb8d8'; g.beginPath(); g.ellipse(150, H * 0.6, 120, 60, 0.4, 0, 7); g.fill(); g.strokeStyle = '#6f8f76'; g.lineWidth = 3; for(let i = 0; i < 7; i++){ g.beginPath(); g.moveTo(40 + i * 70, 20); g.bezierCurveTo(90 + i * 60, H * 0.4, 20 + i * 80, H * 0.7, 80 + i * 66, H - 20); g.stroke(); } [['#c53030', 300, 0.35], ['#f59e0b', 220, 0.55], ['#2f7de1', 380, 0.7]].forEach(k => { g.fillStyle = k[0]; g.beginPath(); g.arc(k[1], H * k[2], 14, 0, 7); g.fill(); }); }
      else if(art === 'balken'){ [0.5, 0.75, 0.4, 0.9, 0.62].forEach((v, i) => { g.fillStyle = ['#f59e0b', '#2f7de1', '#1f9d55', '#c53030', '#8e44ad'][i]; g.fillRect(60 + i * 84, H - 30 - v * (H - 120), 54, v * (H - 120)); }); }
      else { g.fillStyle = art === 'kreide' ? 'rgba(255,255,255,.75)' : 'rgba(140,190,255,.7)'; for(let i = 0; i < 6; i++) g.fillRect(40, 90 + i * (H - 120) / 6, 180 + ((i * 97) % 240), 10); }
      g.fillStyle = art === 'karte' ? '#1c2a22' : '#ffffff'; g.font = '700 40px Roboto, system-ui, sans-serif'; g.fillText(titel, 30, 56);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
      const rahmen = mesh(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.06), M.dunkel, x, y, z, false), bild = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map:t, toneMapped:false })); bild.position.z = 0.035; rahmen.add(bild); rahmen.rotation.y = rotY || 0; return rahmen;
    }
    function npc(x, z, rot, opt){ const f = STAGE.figure(opt); f.position.set(x, 0, z); f.rotation.y = rot || 0; f.userData.rot = rot || 0; sc.add(f); npcs.push(f); sperre(x - 0.3, z - 0.3, x + 0.3, z + 0.3); ao(x - 0.22, z - 0.22, x + 0.22, z + 0.22, 0.38, 0.16); return f; }
    // Figur, die eine Runde über Wegpunkte läuft und an jedem kurz stehen bleibt; sie hält an, wenn die Spielfigur im Weg steht
    function geher(punkte, opt, tempo){ const f = STAGE.figure(opt); f.position.set(punkte[0][0], 0, punkte[0][1]); sc.add(f); const sh = ao(-0.22, -0.22, 0.22, 0.22, 0.34, 0.16); laeufer.push({ f, p:punkte, i:1 % punkte.length, v:tempo || 1.25, warte:Math.random() * 2, sp:0, sh }); return f; }
    const ZIV = [{ zivil:true, jacke:'#7a3b3b', hose:'#2b2f3a', haar:'#2a1d14' }, { zivil:true, jacke:'#3b6a7a', hose:'#3a3a3a', haar:'#c9a45c' }, { zivil:true, jacke:'#5b5f66', hose:'#1f2733', haar:'#6b4a2f' }, { zivil:true, jacke:'#8a7a3b', hose:'#2b2f3a', haar:'#141414' }, { zivil:true, jacke:'#4a3b7a', hose:'#3a342e', haar:'#8a8a8a' }];
    const DIENST = { leicht:true };
    function arbeitsplatz(x, z, nachSueden, opt){ const s = nachSueden ? 1 : -1; tisch(x, z, 1.7, 0.8); monitor(x, z - s * 0.15, nachSueden); stuhl(x, z - s * 0.85); npc(x, z - s * 0.85, nachSueden ? 0 : Math.PI, opt || DIENST); }
    function fahrzeug(x, z, lang, hoch, lack, blau){
      q(x, z, x + lang, z + 2.4, 0.5, hoch, lack); q(x, z + 0.02, x + lang, z + 2.38, 0.3, 0.25, Mt('#2a2d31')); q(x - 0.03, z + 0.2, x + 0.02, z + 2.2, 0.5 + hoch * 0.5, hoch * 0.4, M.glas); q(x + 0.3, z - 0.03, x + 1.9, z + 2.43, 0.5 + hoch * 0.5, hoch * 0.4, M.glas);
      q(x - 0.02, z - 0.02, x + lang + 0.02, z + 2.42, 0.5 + hoch * 0.3, 0.14, M.weiss);
      [[1.2, 0], [lang - 1.3, 0], [1.2, 2.4], [lang - 1.3, 2.4]].forEach(([a, b]) => { mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.32, 16), M.rad, x + a, 0.5, z + b).rotation.x = Math.PI / 2; mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.34, 10), M.felge, x + a, 0.5, z + b).rotation.x = Math.PI / 2; });
      if(blau){ const b1 = Mt('#2b6cff', { emissive:C('#2a6bff'), emissiveIntensity:1.5 }), b2 = b1.clone(); q(x + 0.5, z + 0.3, x + 1.8, z + 0.55, 0.5 + hoch, 0.16, b1, false); q(x + 0.5, z + 1.85, x + 1.8, z + 2.1, 0.5 + hoch, 0.16, b2, false); st.blink(b1, 0); st.blink(b2, 0.5); }
      sperre(x, z, x + lang, z + 2.4); ao(x, z, x + lang, z + 2.4, 0.5, 0.3);
    }
    // Freigelände: Boden, Zaun als Grenze, Bäume und Häuser am Rand
    function gelaende(x1, z1, x2, z2, boden){
      flaeche(-220, -220, 260, 260, -0.03, S('gras', 90, 90)); flaeche(x1, z1, x2, z2, 0, S(boden, (x2 - x1) / 3, (z2 - z1) / 3));
      const zaun = Mt('#7d848d', { metalness:0.5, roughness:0.5 });
      [[x1 - 0.1, z1 - 0.1, x2 + 0.1, z1], [x1 - 0.1, z2, x2 + 0.1, z2 + 0.1], [x1 - 0.1, z1, x1, z2], [x2, z1, x2 + 0.1, z2]].forEach(b => { q(b[0], b[1], b[2], b[3], 0, 1.1, zaun, false); sperre(b[0], b[1], b[2], b[3]); });
      for(let x = x1 - 8; x <= x2 + 8; x += 9){ baum(x, z1 - 6 - ((x * 3) % 4 + 4) % 4, 1.2); baum(x + 4, z2 + 7 + ((x * 5) % 3 + 3) % 3, 1.15); }
      haus(x1 - 30, z1 + 2, 16, 12, 10, '#ecdcc6'); haus(x2 + 14, z1 + 4, 16, 13, 12, '#e2e7dd'); haus((x1 + x2) / 2 - 30, z2 + 22, 18, 12, 10, '#f0e2c8'); haus((x1 + x2) / 2 + 8, z2 + 22, 18, 12, 12.5, '#dfe6ea');
      huegel(); W_GRENZEN = { x1, z1, x2, z2 };
    }
    let W_GRENZEN = null;

    /* ---------- Kulissen: liefern Startpunkt und Stationen ---------- */
    const WELT = {
      stab(){
        const r = raum(22, 14, 'teppich', 8, 5);
        q(9, 6, 13, 8, 0, 0.75, M.metall); flaeche(9.05, 6.05, 12.95, 7.95, 0.76, new THREE.MeshBasicMaterial({ map:tafel(0, -50, 0, 4, 2, 'Lage', 'karte').children[0].material.map, toneMapped:false })); sperre(9, 6, 13, 8);
        tafel(11, 1.75, 0.16, 5.2, 1.7, 'Lagekarte', 'karte'); tafel(4.2, 1.7, 0.16, 2.6, 1.3, 'Kräfteübersicht', 'liste'); tafel(17.8, 1.7, 0.16, 2.6, 1.3, 'Einsatztagebuch', 'liste');
        const P = { S1:[3.2, 3.4], S2:[7.6, 3.4], S3:[14.4, 3.4], S4:[18.8, 3.4], S5:[18.8, 10.4], S6:[3.2, 10.4] }, NAME = { S1:'S1 Personal', S2:'S2 Lage', S3:'S3 Einsatz', S4:'S4 Versorgung', S5:'S5 Presse', S6:'S6 IuK' }, desks = {};
        Object.keys(P).forEach(k => { const [x, z] = P[k], oben = z < 7; arbeitsplatz(x, oben ? z - 0.9 : z + 0.9, oben); desks[k] = { n:NAME[k], x, z:oben ? z + 0.35 : z - 0.35 }; });
        tisch(7, 12.2, 1.6, 0.8); npc(7, 13.1, Math.PI, DIENST); npc(11, 4.6, 0, DIENST); npc(15.6, 7, -Math.PI / 2, DIENST); pflanze(20.8, 6.8); pflanze(1.2, 6.8);
        geher([[5, 8.9], [16.6, 8.9], [16.6, 5.45], [5.4, 5.45]], DIENST); geher([[19.6, 7], [14.4, 9.2], [19.6, 8.6]], { leicht:true, jacke:'#3a4a5c' }, 1.0);
        return { start:r.start, grenzen:r.grenzen, desks, sichter:{ n:'Sichter', x:7, z:11.2 },
          spots:[['Leiter des Stabes', 11, 5.3], ['Lagekarte', 11, 1.5], ['Lagetisch', 13.9, 7.6], ['Fachberater', 15.6, 11.6], ['Verbindungsperson', 5.2, 7], ['Einsatzleiter', 8.1, 7.2], ['Leitstelle', 17.2, 7]] };
      },
      amt(){
        const r = raum(18, 12, 'teppich', 7, 5);
        arbeitsplatz(3.2, 2.2, true, ZIV[1]); arbeitsplatz(7.4, 2.2, true, ZIV[2]); tisch(9, 6.4, 3, 1.5); q(8.2, 5.9, 9.8, 6.9, 0.76, 0.01, M.weiss, false);
        [[8.5, 6.2, 0.5, 0.4], [9.1, 6.5, 0.35, 0.7], [9.5, 6.1, 0.3, 0.3]].forEach(b => q(b[0], b[1], b[0] + b[2], b[1] + b[2], 0.77, b[3], Mt('#d8d2c4')));
        regal(0.2, 5, 0.7, 9.5); regal(13.5, 0.2, 17.2, 0.7); tisch(14.6, 9.6, 2.2, 1.1); npc(14.6, 10.6, Math.PI, ZIV[0]); pflanze(16.8, 5.5); tafel(11.5, 1.7, 0.16, 2.6, 1.3, 'Fristen', 'liste');
        geher([[5, 4.7], [12, 4.7], [12, 8.9], [5, 8.9]], ZIV[4], 1.1);
        return { start:r.start, grenzen:r.grenzen, spots:[['Posteingang', 3.2, 3.5], ['Plantisch', 9, 7.7], ['Bauakte', 14.6, 8.5], ['Kollege', 7.4, 3.5], ['Planarchiv', 1.5, 7.2], ['Vorschriften', 15.4, 1.6], ['Modell', 11.2, 6.4]] };
      },
      lagezentrum(){
        const r = raum(20, 13, 'teppich', 8, 5, '#dfe3e8');
        q(7.5, 5.4, 12.5, 7.6, 0, 0.75, M.metall); flaeche(7.55, 5.45, 12.45, 7.55, 0.76, new THREE.MeshBasicMaterial({ map:tafel(0, -50, 0, 5, 2.2, 'Deutschland', 'karte').children[0].material.map, toneMapped:false })); sperre(7.5, 5.4, 12.5, 7.6);
        tafel(10, 1.75, 0.16, 6, 1.7, 'Lagebild', 'karte'); tafel(3.4, 1.7, 0.16, 2.6, 1.3, 'Warnstufen', 'balken'); tafel(16.6, 1.7, 0.16, 2.6, 1.3, 'MoWaS', 'liste');
        arbeitsplatz(3, 3.2, true); arbeitsplatz(17, 3.2, true); arbeitsplatz(3, 10.6, false); arbeitsplatz(17, 10.6, false, { leicht:true, jacke:'#4a5a3a', hose:'#3d4a30' }); npc(13.4, 6.5, -Math.PI / 2, DIENST);
        mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 8), M.metall, 6.2, 1.1, 11.6); mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.3, 12), M.rot, 6.2, 2.3, 11.6); sperre(6, 11.4, 6.4, 11.8);
        geher([[5.6, 4.7], [14.6, 4.7], [14.6, 8.9], [5.6, 8.9]], DIENST); geher([[15.6, 11.6], [9, 11.4], [9, 9.4]], { leicht:true, jacke:'#4a5a3a', hose:'#3d4a30' }, 1.0);
        return { start:r.start, grenzen:r.grenzen, spots:[['Lagetisch', 10, 8.3], ['Lagebild', 10, 1.5], ['Warnzentrale', 3, 4.6], ['MoWaS-Platz', 17, 4.6], ['Länder', 3, 9.2], ['Bundeswehr', 17, 9.2], ['Sirene', 7.2, 11.2], ['BBK', 13.4, 5]] };
      },
      wache(){
        const r = raum(18, 12, 'holz', 5, 6);
        arbeitsplatz(3, 2.2, true); regal(0.2, 4.5, 0.7, 8); tisch(9, 6, 3.2, 1.4); [[7.8, 4.9], [9, 4.9], [10.2, 4.9], [7.8, 7.1], [9, 7.1], [10.2, 7.1]].forEach(s => stuhl(s[0], s[1]));
        npc(9, 4.9, 0, DIENST); npc(10.2, 7.1, Math.PI, DIENST); npc(7.8, 7.1, Math.PI, DIENST);
        tafel(9, 1.6, 0.16, 1.6, 1.9, 'Dienstplan', 'liste'); q(13.5, 0.2, 17.6, 0.85, 0, 0.9, M.weiss); sperre(13.5, 0.2, 17.6, 0.85); q(14, 0.3, 14.5, 0.7, 0.9, 0.35, M.dunkel); mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 10), M.rot, 16.4, 1.03, 0.5);
        for(let i = 0; i < 4; i++){ q(17.2, 3.4 + i * 0.75, 17.8, 4.1 + i * 0.75, 0, 1.9, i % 2 ? M.metall : Mt('#5b6875')); } sperre(17.2, 3.4, 17.8, 6.4);
        q(3.6, 9.4, 5.8, 10.3, 0, 0.42, M.stoff); q(3.6, 10.1, 5.8, 10.35, 0.42, 0.45, M.stoff); sperre(3.6, 9.4, 5.8, 10.35); npc(14, 9.4, -2.2, DIENST); pflanze(16.8, 10.8);
        geher([[5.6, 3.6], [13, 3.6], [13, 8.7], [5.6, 8.7]], DIENST); geher([[15.6, 3.2], [15.6, 7.6]], null, 1.0);
        return { start:r.start, grenzen:r.grenzen, spots:[['Wachleiter', 3, 3.5], ['Besprechung', 11.6, 6], ['Dienstplan', 9, 1.6], ['Küche', 15.5, 1.8], ['Kollege', 13.2, 8.8], ['Sofaecke', 4.7, 8.6], ['Spinde', 16.2, 4.9]] };
      },
      hoersaal(){
        const r = raum(20, 13, 'holz', 6, 7, '#e6dfd2');
        tafel(10, 1.75, 0.16, 7, 1.8, '§ Recht', 'kreide'); q(9.2, 2.2, 10.8, 2.9, 0, 1.05, M.holz); sperre(9.2, 2.2, 10.8, 2.9); npc(10, 1.6, 0, ZIV[2]);
        [5, 7.2, 9.4].forEach((z, i) => { [[2, 8.2], [11.8, 18]].forEach(([a, b]) => { q(a, z, b, z + 0.45, 0.68, 0.06, M.holz); q(a, z + 0.38, b, z + 0.45, 0, 0.68, M.holz); q(a, z + 0.75, b, z + 1.15, 0.4, 0.06, M.stoff); sperre(a, z, b, z + 1.15); });
          npc(4 + i * 1.3, 5.95 + i * 2.2, Math.PI, ZIV[i]); npc(14 + i, 5.95 + i * 2.2, Math.PI, ZIV[(i + 3) % 5]); });
        regal(19.3, 1.5, 19.8, 5); pflanze(1, 1.2);
        geher([[9.4, 3.7], [9.4, 11.3], [10.6, 11.3], [10.6, 3.7]], ZIV[1], 0.9); geher([[1.2, 3.4], [1.2, 11]], ZIV[3], 1.0);
        return { start:r.start, grenzen:r.grenzen, spots:[['Rednerpult', 10, 3.6], ['Tafel', 5.5, 1.4], ['Gesetzessammlung', 18.4, 3.2], ['Reihe 1', 10, 5.4], ['Reihe 2', 10, 7.6], ['Reihe 3', 10, 9.8], ['Fenster', 14.5, 1.4], ['Ausgang', 7.5, 11.6]] };
      },
      planung(){
        const r = raum(18, 12, 'teppich', 7, 5, '#e9e4da');
        q(7, 4.8, 11, 7.2, 0, 0.75, M.metall); q(7.05, 4.85, 10.95, 7.15, 0.75, 0.02, Mt('#7fa56f'), false); sperre(7, 4.8, 11, 7.2);
        for(let i = 0; i < 22; i++){ const x = 7.3 + (i * 37 % 34) / 10, z = 5.05 + (i * 53 % 19) / 10, h = 0.12 + (i * 29 % 30) / 100; q(x, z, x + 0.22, z + 0.22, 0.77, h, Mt(['#d9d3c6', '#c9b8a0', '#b9c4cf', '#e0d2b8'][i % 4])); }
        q(8.6, 5.7, 9.1, 6.1, 0.77, 0.3, M.rot);
        tafel(9, 1.7, 0.16, 3.4, 1.5, 'Kennzahlen', 'balken'); tafel(3.4, 1.7, 0.16, 2.4, 1.3, 'Haushalt', 'liste'); tafel(17.84, 1.7, 6.5, 2.6, 1.3, 'Projektplan', 'liste', -Math.PI / 2);
        arbeitsplatz(3.2, 9.9, false, ZIV[3]); arbeitsplatz(13.4, 10, false, ZIV[4]); regal(13.5, 0.2, 17.2, 0.7); pflanze(1.1, 5.5);
        geher([[5.6, 3.5], [12.4, 3.5], [12.4, 8.5], [5.6, 8.5]], ZIV[0], 1.1);
        return { start:r.start, grenzen:r.grenzen, spots:[['Stadtmodell', 9, 8], ['Haushaltsplan', 3.4, 1.5], ['Kennzahlen', 9, 1.5], ['Vergabeakte', 15.4, 1.6], ['Projektwand', 16.6, 6.5], ['Kämmerei', 3.2, 8.5], ['Dezernat', 13.4, 8.6]] };
      },
      einsatz(){
        gelaende(-4, -2, 34, 22, 'pflaster'); flaeche(-4, 13, 34, 20.5, 0.012, S('asphalt', 14, 2));
        q(7, -1.6, 21, 3.4, 0, 9, S('fassade', 3, 2, { color:C('#e6d3bd') })); sperre(7, -1.6, 21, 3.4);
        const glut = Mt('#ff8a2a', { emissive:C('#ff5a0a'), emissiveIntensity:2.2 });
        [[10, 5.2], [14, 5.2], [16.6, 2.4]].forEach(f => { q(f[0], 3.38, f[0] + 1.4, 3.46, f[1], 1.5, glut, false); st.quellen.feuer(f[0] + 0.7, f[1] + 0.4, 3.55, 0.55); });
        st.quellen.rauch(11, 7, 3.2, 1.2, 4); st.quellen.rauch(15, 7.2, 3.2, 1.6, 5); st.quellen.rauch(17.4, 4.4, 3.4, 0.8, 3);
        const schein = new THREE.PointLight(C('#ff7a2a'), 1.6, 22, 2); schein.position.set(14, 5, 6); sc.add(schein); takt.push((dt, t) => { schein.intensity = 1.5 + Math.sin(t * 11) * 0.3 + Math.sin(t * 23.7) * 0.25; });
        fahrzeug(1, 14, 7.6, 2.3, M.rot, true); fahrzeug(23.5, 14.2, 5.2, 1.9, M.rot, true);
        const band = Mt('#e9d21f'); for(let x = 0; x <= 30; x += 3){ mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 6), M.metall, x, 0.5, 6.2); if(x < 30) q(x, 6.19, x + 3, 6.21, 0.86, 0.07, x % 6 ? band : M.rot, false); } sperre(-4, 6.1, 34, 6.3);
        const orte = [[4, 8.6], [9.5, 9.4], [15, 8.6], [20.5, 9.4], [26, 8.6]];
        orte.forEach((o, i) => { npc(o[0], o[1], Math.PI * 0.95 + i * 0.07, ZIV[i]); if(i % 2 === 0){ [-0.2, 0, 0.2].forEach(d => { const b = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 5), M.dunkel, o[0] + 0.9 + d, 0.68, o[1] - 0.2); b.rotation.z = d * 0.6; }); q(o[0] + 0.75, o[1] - 0.38, o[0] + 1.05, o[1] - 0.05, 1.36, 0.2, M.dunkel); } });
        npc(12, 5, 0, null); npc(18, 4.8, 0.3, null); geher([[8.6, 4.15], [20.2, 4.15]], null, 1.5);
        geher([[-2, 10.9], [32, 10.9], [32, 12], [-2, 12]], ZIV[3], 1.2); geher([[31, 11.4], [0, 11.4]], ZIV[1], 1.05); npc(28.5, 7.2, Math.PI, ZIV[4]); npc(1.5, 7.3, Math.PI, ZIV[2]);
        const lb = ['Reporterin', 'Kamerateam', 'Radio', 'Zeitung', 'Fotograf'];
        return { start:{ x:15, z:16.5 }, rec:true, spots:orte.map((o, i) => [lb[i], o[0], o[1] + 1.3]).concat([['Einsatzleitwagen', 26, 17.6], ['Löschfahrzeug', 4.8, 17.6]]) };
      },
      flugfeld(){
        gelaende(-8, -10, 48, 24, 'asphalt');
        for(let x = -6; x < 46; x += 6) q(x, 20.9, x + 3, 21.1, 0, 0.012, M.weiss, false);
        const rumpf = Mt('#e9ecef', { roughness:0.35, metalness:0.3 });
        const f = mesh(new THREE.CylinderGeometry(2.1, 2.1, 24, 20), rumpf, 20, 3, -3); f.rotation.z = Math.PI / 2; mesh(new THREE.SphereGeometry(2.1, 20, 14), rumpf, 32, 3, -3).scale.set(1.6, 1, 1); mesh(new THREE.ConeGeometry(2.1, 6, 20), rumpf, 5, 3.3, -3).rotation.z = Math.PI / 2;
        q(16, -16, 22, 10, 3.9, 0.35, rumpf); q(4.5, -7, 7.5, 1, 4, 0.25, rumpf); q(4.6, -3.2, 8, -2.8, 4, 4.4, Mt('#1f3f8f')); [[19, -10], [19, 4]].forEach(e => { mesh(new THREE.CylinderGeometry(0.85, 0.85, 3, 14), M.metall, e[0], 2.9, e[1]).rotation.z = Math.PI / 2; });
        q(24, -1.2, 27, 2.6, 0, 0.9, M.metall); q(24, -1.2, 27, -1, 0.9, 1.2, M.metall, false); sperre(4, -5.2, 34, 2.6);
        const cf = ['#b33a2e', '#2f5d8a', '#3f7a45', '#b08a2e'].map(c => Mt(c, { metalness:0.3, roughness:0.6 }));
        [[-4, 8, 0], [-4, 11, 1], [-4, 8, 2, 2.6], [2.5, 8, 3], [2.5, 11, 0]].forEach(k => { q(k[0], k[1], k[0] + 6, k[1] + 2.4, k[3] || 0, 2.6, cf[k[2]]); }); sperre(-4, 8, 8.5, 13.4);
        const zelt = Mt('#e7e2d2'); [[34, 8], [40, 8]].forEach(z => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(4.6, 0); sh.lineTo(4.6, 1.8); sh.lineTo(2.3, 3); sh.lineTo(0, 1.8); sh.closePath(); const m = mesh(new THREE.ExtrudeGeometry(sh, { depth:5, bevelEnabled:false }), zelt, z[0], 0, z[1]); sperre(z[0], z[1], z[0] + 4.6, z[1] + 5); });
        const fc = document.createElement('canvas'); fc.width = 192; fc.height = 128; const g = fc.getContext('2d'); g.fillStyle = '#1f3f9f'; g.fillRect(0, 0, 192, 128); g.fillStyle = '#ffd42a'; for(let i = 0; i < 12; i++){ g.beginPath(); g.arc(96 + Math.cos(i * Math.PI / 6) * 40, 64 + Math.sin(i * Math.PI / 6) * 40, 6, 0, 7); g.fill(); }
        const ft = new THREE.CanvasTexture(fc); ft.encoding = THREE.sRGBEncoding;
        [26, 29].forEach(x => { mesh(new THREE.CylinderGeometry(0.05, 0.06, 6, 8), M.metall, x, 3, 18); const fl = mesh(new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshBasicMaterial({ map:ft, side:THREE.DoubleSide, toneMapped:false }), x + 0.95, 5.3, 18, false); sperre(x - 0.1, 17.9, x + 0.1, 18.1); });
        fahrzeug(12, 15.5, 6.4, 2.1, Mt('#1f4f9f', { roughness:0.4 })); fahrzeug(20, 15.8, 7, 2.3, M.rot, true);
        (function heli(x, z){
          const lack = Mt('#f2a81d', { roughness:0.35, metalness:0.3 }); mesh(new THREE.SphereGeometry(1.5, 18, 12), lack, x, 1.9, z).scale.set(1.7, 1, 1); mesh(new THREE.SphereGeometry(1.1, 14, 10), M.glas, x + 1.5, 2.0, z).scale.set(1.2, 0.9, 0.95);
          const heck = mesh(new THREE.CylinderGeometry(0.16, 0.42, 5, 10), lack, x - 4.4, 2.2, z); heck.rotation.z = -Math.PI / 2 + 0.08; q(x - 7.1, z - 0.06, x - 6.5, z + 0.06, 2.1, 1.3, lack);
          [-0.9, 0.9].forEach(d => { const k = mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 6), M.metall, x, 0.12, z + d); k.rotation.z = Math.PI / 2; mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), M.metall, x + 0.9, 0.55, z + d * 0.9); mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), M.metall, x - 0.9, 0.55, z + d * 0.9); });
          mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), M.metall, x, 3.6, z);
          const rotor = new THREE.Group(); rotor.position.set(x, 3.95, z); sc.add(rotor); [0, 1].forEach(i => { const b = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.05, 0.34), M.dunkel); b.rotation.y = i * Math.PI / 2; b.castShadow = true; rotor.add(b); });
          const hr = new THREE.Group(); hr.position.set(x - 6.8, 2.9, z + 0.16); sc.add(hr); hr.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.9, 0.04), M.dunkel));
          takt.push(dt => { rotor.rotation.y += dt * 13; hr.rotation.z += dt * 21; }); st.quellen.wirbel(x, z, 6.5); sperre(x - 7.4, z - 1.7, x + 3.2, z + 1.7); ao(x - 3, z - 1.6, x + 3, z + 1.6, 0.45, 0.5);
        })(42, 19.6);
        npc(30.5, 6, 0.4, DIENST); npc(36.3, 14, 0, { leicht:true, jacke:'#1f4f9f', hose:'#1c2c4a' }); geher([[29.4, 4.6], [33.5, 6.6]], DIENST, 1.2); geher([[10, 13.6], [31, 13.6]], { leicht:true, jacke:'#4a5a3a', hose:'#3d4a30' }, 1.3); geher([[-5, 16.5], [-5, 22], [9, 22]], ZIV[0], 1.1); npc(11, 5, 0.2, null); npc(1, 14.6, 0.5, ZIV[2]);
        return { start:{ x:20, z:19 }, spots:[['Flugzeug', 20, 4.2], ['Laderampe', 28.6, 3.7], ['Container', 2, 14.8], ['OSOCC-Zelt', 36.3, 15.2], ['EU-Flagge', 27.5, 19.2], ['Modul-Fahrzeug', 15, 19.4], ['Registrierung', 30.5, 7.3], ['Hilfsgüter', 10, 6.3]] };
      }
    };
    const W = (WELT[ctx.welt] || WELT.amt)(), G = W.grenzen || W_GRENZEN;

    /* ---------- Stationen und Aufgaben ---------- */
    const marke = (n, x, z, farbe) => { const b = STAGE.beam(farbe); b.position.set(x, 0, z); sc.add(b); const lb = STAGE.label(n, { color:'#ffffff', bg:'rgba(20,24,32,.78)', h:0.4 }); lb.position.set(x, 3.25, z); sc.add(lb); return { n, x, z, beam:b, lb, queue:[] }; };
    const spots = W.spots.map(s => marke(s[0], s[1], s[2], FARBE.offen));
    const fragen = L.aufgaben.filter(a => a.typ !== 'bringen'), meld = L.aufgaben.filter(a => a.typ === 'bringen');
    const SZ = L.szenario ? { haupt:L.aufgaben.slice(), ein:(L.eingang || []).slice().sort((a, b) => a.nach - b.nach), t:0, los:false } : null, fristen = new Map();
    const ort = n => spots.find(s => s.n === n) || spots[0];
    if(SZ) L.aufgaben.forEach(a => { a._kette = true; }); else fragen.forEach((a, i) => (a.ort ? ort(a.ort) : spots[i % spots.length]).queue.push(a));
    let sichter = null, desks = {};
    if(meld.length){ sichter = marke(W.sichter.n, W.sichter.x, W.sichter.z, FARBE.offen); sichter.queue = meld.slice(); Object.keys(W.desks).forEach(k => { const d = W.desks[k]; desks[k] = marke(d.n, d.x, d.z, FARBE.ziel); }); }
    let left = L.aufgaben.length + (SZ ? SZ.ein.length : 0), trage = null, fehlv = 0, letzte = 'offen', noteT = 0;
    const offen = () => spots.some(s => s.queue.length) || !!(sichter && sichter.queue.length);
    const melde = (t, ms) => { clearTimeout(noteT); ctx.note(t); noteT = setTimeout(() => ctx.note(null), ms || 6000); };
    // Einsatz: Aufgabe an ihre Station legen; mit Frist nur außerhalb der Stufe „Lernen“
    function stelle(a){
      const s = ort(a.ort); s.queue.push(a); s.fertig = false; s.beam.setColor(FARBE.offen, false); s.lb.visible = true;
      if(a.frist && ctx.stufe !== 'lernen') fristen.set(a, { rest:a.frist, s, aus:false });
      uiKey = ''; zeigen();
    }
    function naechster(){
      const a = SZ.haupt.shift();
      if(a){ stelle(a); if(ctx.phase) ctx.phase(a.phase); } else SZ.ein.splice(0).forEach(stelle);     // Hauptstrang fertig: offene Nebenmeldungen kommen sofort
    }
    function kommt(e){ stelle(e); STAGE.sfx('door'); melde('Neue Meldung: Station „' + ort(e.ort).n + '“' + (fristen.has(e) ? ' (Frist ' + Math.round(e.frist) + ' Sekunden)' : '') + '.'); }
    function verfall(a, f){
      f.aus = true; STAGE.sfx('bad');
      if(a._kette){ f.s.beam.setColor(FARBE.falsch, true); ctx.verzug(a, false); melde('Die Station „' + f.s.n + '“ wartet schon zu lange. Das kostet Vertrauen.'); return; }
      const i = f.s.queue.indexOf(a); if(i >= 0) f.s.queue.splice(i, 1); fristen.delete(a);
      if(!f.s.queue.length){ f.s.fertig = true; f.s.beam.setColor(FARBE.falsch, false); }
      melde('Frist verpasst: Die Meldung an der Station „' + f.s.n + '“ blieb liegen.'); ctx.verzug(a, true); ctx.count(3, a, { verpasst:true }); left--; uiKey = ''; zeigen(); fertig();
    }
    function fertig(){ if(left <= 0 && !offen()){ clearTimeout(noteT); ctx.note(null); ctx.finish(); } }
    function zeigen(){
      spots.concat(sichter ? [sichter] : []).forEach(s => { const an = s.queue.length > 0; s.beam.visible = an && !trage; s.lb.visible = an || s === sichter; if(!an && s.fertig) { s.beam.visible = !trage; } });
      Object.keys(desks).forEach(k => { desks[k].beam.visible = !!trage; });
    }
    spots.forEach(s => { if(!s.queue.length){ s.beam.visible = false; s.lb.visible = false; } });
    zeigen();

    const fig = STAGE.figure(); sc.add(fig);
    const figS = ao(-0.24, -0.24, 0.24, 0.24, 0.4, 0.18);
    const pfeil = STAGE.arrow(FARBE.offen); sc.add(pfeil); let stepT = 0;
    const pos = { x:W.start.x, z:W.start.z }; let face = Math.PI, near = null, busy = false, uiKey = '', gespiegelt = false;
    const tgt = new THREE.Vector3(pos.x, 1.2, pos.z), ray = new THREE.Raycaster(), tmp = new THREE.Vector3(); let faded = [], tick = 0;

    function erledigt(s, tries, res){
      const a = s.queue.shift(); letzte = tries === 1 ? 'ok' : tries === 2 ? 'halb' : 'falsch'; fristen.delete(a);
      if(!s.queue.length){ s.fertig = true; s.beam.setColor(FARBE[letzte], false); }
      st.feier(pos.x, 1.6, pos.z, tries);
      if(a._frei) ctx.folge(tries, a, res); else { ctx.count(tries, a, res); left--; }
      // Einsatz: Nach einer schlechten Entscheidung folgt erst die Schadensbegrenzung, sonst der nächste Schritt
      if(SZ && a._kette){ if(res && res.dann) stelle(Object.assign({}, res.dann, { _kette:true, _frei:true, phase:a.phase })); else naechster(); }
      uiKey = ''; zeigen(); fertig();
    }
    async function aktion(){
      if(busy || !near || st.imAnflug() || !st.input.frei) return;
      const s = near;
      if(s === sichter && !trage && s.queue.length){
        trage = s.queue[0]; fehlv = 0; STAGE.sfx('door'); ctx.note('Meldung: „' + trage.frage + '“ Bring sie zum zuständigen Sachgebiet.'); uiKey = ''; zeigen(); return;
      }
      if(trage && s.desk){
        if(s.desk === trage.ziel){ const t = fehlv + 1; trage = null; clearTimeout(noteT); ctx.note(null); erledigt(sichter, t); return; }
        fehlv++; STAGE.sfx('bad');
        if(fehlv >= 2){ const z = trage.ziel; trage = null; ctx.note('Zuständig war ' + W.desks[z].n + '.'); setTimeout(() => { if(!trage) ctx.note(null); }, 3500); erledigt(sichter, 3); }
        else ctx.note(s.n + ' ist nicht zuständig. Noch ein Versuch: „' + trage.frage + '“');
        return;
      }
      if(!s.queue.length || trage) return;
      // Frage: Die Welt läuft weiter, die Figur bleibt stehen, die Kamera schwenkt zur Station
      busy = true; st.halt(true); st.fokus(s.x, s.z); face = Math.atan2(s.x - pos.x, s.z - pos.z) || face;
      const a = s.queue[0], modell = a.typ === 'stadt' ? stadtAuf(a) : null;
      const res = await ctx.ask(a, s.n, modell);          // { tries } oder null, wenn die Frage geschlossen wurde
      if(modell) modell.weg();
      busy = false; st.halt(false); st.fokus(null); if(res) erledigt(s, res.tries, res);
    }
    Object.keys(desks).forEach(k => { desks[k].desk = k; });

    /* ---------- Stadtmodell (Aufgabenart „stadt“): hoch über dem Raum, die Kamera schaut von oben darauf ----------
       Koordinaten der Daten: x 0–100, y 0–75 (gleicher Maßstab). Die Auswahl und die Wertung macht die Oberfläche (app.js);
       hier wird nur gezeichnet: Stadtteile, mögliche Standorte, gesetzte Wachen mit ihrem Einsatzbereich. */
    function stadtAuf(a){
      const g = new THREE.Group(), Y = 40, K = 0.12, cx = pos.x, cz = pos.z, alle = [], v = new THREE.Vector3();
      const P = (x, y) => [(x - 50) * K, (y - 37.5) * K];
      const add = (geo, m, x, y, z, sch) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = sch !== false; o.receiveShadow = true; g.add(o); alle.push(o); return o; };
      g.position.set(cx, Y, cz);
      add(new THREE.CylinderGeometry(46, 46, 0.2, 40), Mt('#2b3038'), 0, -0.5, 0, false);
      add(new THREE.BoxGeometry(12.8, 0.3, 9.8), Mt('#4a4f58'), 0, -0.16, 0);
      add(new THREE.BoxGeometry(12.2, 0.04, 9.2), Mt('#8fae7c'), 0, 0.01, 0, false);
      const str = Mt('#d8d4c8'), wasser = Mt('#6ea3d6', { roughness:0.2, metalness:0.3 });
      [[-3.6, 0, 0.16, 9.2], [1.2, 0, 0.16, 9.2], [4.4, 0, 0.16, 9.2], [0, -2.2, 12.2, 0.16], [0, 1.6, 12.2, 0.16]].forEach(b => add(new THREE.BoxGeometry(b[2], 0.02, b[3]), str, b[0], 0.04, b[1], false));
      (a.fluss || []).forEach(f => { const p1 = P(f[0], f[1]), p2 = P(f[2], f[3]), o = add(new THREE.BoxGeometry(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), 0.03, 0.42), wasser, (p1[0] + p2[0]) / 2, 0.045, (p1[1] + p2[1]) / 2, false); o.rotation.y = -Math.atan2(p2[1] - p1[1], p2[0] - p1[0]); });
      const orte = a.orte.map((o, i) => {
        const [x, z] = P(o.x, o.y), m = Mt('#d9d3c6'), n = 4 + o.gewicht * 3;
        for(let k = 0; k < n; k++){ const w = 0.2 + ((k * 37 + i * 11) % 5) * 0.035, h = 0.16 + ((k * 53 + i * 7) % 7) * 0.07, r = 0.25 + (k % 4) * 0.2, wk = k * 2.4 + i; add(new THREE.BoxGeometry(w, h, w), m, x + Math.cos(wk) * r, 0.03 + h / 2, z + Math.sin(wk) * r); }
        const lb = STAGE.label(o.n, { color:'#ffffff', bg:'rgba(20,24,32,.78)', h:0.34 }); lb.position.set(x, 1.15, z); g.add(lb); alle.push(lb);
        return { m, lb };
      });
      const blau = Mt('#2f7de1'), rot = Mt('#c4261c', { roughness:0.4 }), kreisG = new THREE.CircleGeometry(a.radius * K, 40);
      const sto = a.standorte.map(s => {
        const [x, z] = P(s.x, s.y), sockel = add(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 16), blau, x, 0.09, z), wache = add(new THREE.BoxGeometry(0.46, 0.5, 0.46), rot, x, 0.3, z);
        const kreis = add(kreisG, new THREE.MeshBasicMaterial({ color:C('#1f9d55'), transparent:true, opacity:0.3, depthWrite:false }), x, 0.07, z, false); kreis.rotation.x = -Math.PI / 2; kreis.receiveShadow = false;
        const lb = STAGE.label(s.n, { color:'#ffffff', bg:'rgba(47,125,225,.92)', h:0.42 }); lb.position.set(x, 0.75, z); g.add(lb); alle.push(lb);
        wache.visible = kreis.visible = false; return { x, z, wache, kreis };
      });
      // bestehende Wachen: stehen fest und decken ihren Bereich immer ab
      (a.bestand || []).forEach(s => {
        const [x, z] = P(s.x, s.y); add(new THREE.BoxGeometry(0.5, 0.56, 0.5), rot, x, 0.31, z);
        const kreis = add(kreisG, new THREE.MeshBasicMaterial({ color:C('#c4261c'), transparent:true, opacity:0.2, depthWrite:false }), x, 0.06, z, false); kreis.rotation.x = -Math.PI / 2; kreis.receiveShadow = false;
        const lb = STAGE.label(s.n, { color:'#ffffff', bg:'rgba(196,38,28,.92)', h:0.36 }); lb.position.set(x, 0.95, z); g.add(lb); alle.push(lb);
      });
      // am breiten Bildschirm schwebt die Frage rechts: das Modell rückt nach links, damit es frei bleibt
      const breit = window.innerWidth >= 900; sc.add(g); ctx.fade(() => st.aufsicht({ x:cx + (breit ? 3.6 : 0), y:Y, z:cz + 0.5, d:breit ? 14 : 12.5 }));
      const h = {
        onTap:null,
        // sel = gewählte Standorte (Index), gedeckt = je Stadtteil true/false
        zeige(sel, gedeckt){ sto.forEach((s, i) => { s.wache.visible = s.kreis.visible = sel.includes(i); }); orte.forEach((o, i) => o.m.color.set(gedeckt[i] ? '#8fd3a0' : '#d9d3c6')); },
        weg(){ st.input.tap = null; ctx.fade(() => { st.aufsicht(null); sc.remove(g); alle.forEach(o => { if(o.geometry && o.geometry !== kreisG) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); kreisG.dispose(); }); }
      };
      st.input.tap = (px, py) => {
        const r = ctx.canvas.getBoundingClientRect(); let best = 60, bi = -1;
        sto.forEach((s, i) => { v.set(cx + s.x, Y + 0.3, cz + s.z).project(st.camera); const d = Math.hypot(r.left + (v.x + 1) / 2 * r.width - px, r.top + (1 - v.y) / 2 * r.height - py); if(d < best){ best = d; bi = i; } });
        if(bi >= 0 && h.onTap) h.onTap(bi);
      };
      return h;
    }
    st.input.action = aktion; st.input.key = k => { if(k === 'Escape' || k === 'p') ctx.menu(); };
    ui.act.onclick = aktion; ui.up.hidden = ui.down.hidden = true;

    function refreshUi(){
      let fk = 0; fristen.forEach(f => { if(!f.aus) fk += Math.ceil(f.rest); });
      const key = [near ? near.n : '', left, trage ? 1 : 0, fk].join('|'); if(key === uiKey) return; uiKey = key;
      let knapp = null; fristen.forEach(f => { if(!f.aus && (!knapp || f.rest < knapp.rest)) knapp = f; });
      ui.info.textContent = 'Offen: ' + left + (trage ? ' · Meldung in der Hand' : '') + (knapp ? ' · Frist „' + knapp.s.n + '“: ' + Math.max(0, Math.ceil(knapp.rest)) + ' s' : '');
      ui.act.hidden = !near; if(near) ui.act.textContent = near === sichter ? 'Meldung holen' : near.desk ? 'Abgeben bei ' + near.n : 'Ansprechen: ' + near.n;
    }

    st.start((dt, time) => {
      const inp = st.input, sy = Math.sin(inp.yaw), cy = Math.cos(inp.yaw);
      const vx = (cy * inp.mx - sy * inp.my) * SPEED, vz = (-sy * inp.mx - cy * inp.my) * SPEED, sp = Math.hypot(vx, vz);
      if(sp > 0.05){
        if(!STAGE.blocked(pos.x + vx * dt, pos.z, R, boxes)) pos.x += vx * dt; if(!STAGE.blocked(pos.x, pos.z + vz * dt, R, boxes)) pos.z += vz * dt;
        let d = Math.atan2(vx, vz) - face; d = Math.atan2(Math.sin(d), Math.cos(d)); face += d * Math.min(1, dt * 12);
        if((stepT -= dt) <= 0){ stepT = 0.36; STAGE.sfx('step'); }
      }
      let fr = face - fig.rotation.y; fr = Math.atan2(Math.sin(fr), Math.cos(fr)); fig.rotation.y += fr * Math.min(1, dt * 14);
      fig.position.set(pos.x, 0, pos.z); fig.animate(dt, sp, 0); figS.position.x = pos.x; figS.position.z = pos.z;
      // Stehende Figuren drehen sich zur Spielfigur, wenn sie nah ist
      for(let i = 0; i < npcs.length; i++){ const f = npcs[i]; f.animate(dt, 0, 0); const dx = pos.x - f.position.x, dz = pos.z - f.position.z; let r = (dx * dx + dz * dz < 7.5 ? Math.atan2(dx, dz) : f.userData.rot) - f.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); if(Math.abs(r) > 0.01) f.rotation.y += r * Math.min(1, dt * 4); }
      // Laufende Figuren: Wegpunkt für Wegpunkt, mit kurzen Pausen; sie warten, wenn die Spielfigur vor ihnen steht
      for(let i = 0; i < laeufer.length; i++){
        const l = laeufer[i], f = l.f, t = l.p[l.i], dx = t[0] - f.position.x, dz = t[1] - f.position.z, d = Math.hypot(dx, dz), px = pos.x - f.position.x, pz = pos.z - f.position.z; let v = 0;
        if(l.warte > 0) l.warte -= dt;
        else if(d < 0.08){ l.i = (l.i + 1) % l.p.length; l.warte = 0.5 + Math.random() * 2.4; }
        else if(px * px + pz * pz > 1.3 || dx * px + dz * pz < 0){ v = l.v; const k = Math.min(d, v * dt) / d; f.position.x += dx * k; f.position.z += dz * k; let r = Math.atan2(dx, dz) - f.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); f.rotation.y += r * Math.min(1, dt * 8); }
        f.animate(dt, v, 0); l.sh.position.x = f.position.x; l.sh.position.z = f.position.z;
      }
      for(let i = 0; i < takt.length; i++) takt[i](dt, time);
      // Einsatz: Die Zeit läuft ab „Los geht’s“. Nebenmeldungen treffen ein; Fristen laufen nicht, solange eine Frage offen ist
      if(SZ){
        if(!SZ.los && inp.frei && !st.imAnflug()){ SZ.los = true; naechster(); }
        if(SZ.los){
          SZ.t += dt; while(SZ.ein.length && SZ.ein[0].nach <= SZ.t) kommt(SZ.ein.shift());
          if(!busy) fristen.forEach((f, a) => { if(f.aus) return; f.rest -= dt; if(f.rest <= 15 && !f.rot){ f.rot = true; f.s.beam.setColor(FARBE.falsch, true); } if(f.rest <= 0) verfall(a, f); });
        }
      }
      // Nächste Station in Reichweite und Ziel des Richtungspfeils
      near = null; let best = 2.2, zx = null, zz = 0, bd = 1e9;
      const aktiv = trage ? Object.keys(desks).map(k => desks[k]) : spots.concat(sichter ? [sichter] : []).filter(s => s.queue.length);
      aktiv.forEach(s => { const d = Math.hypot(pos.x - s.x, pos.z - s.z); if(d < best){ best = d; near = s; } if(!trage && d < bd){ bd = d; zx = s.x; zz = s.z; } });
      spots.forEach(s => { s.beam.userData.mat.uniforms.uTime.value = time; }); if(sichter) sichter.beam.userData.mat.uniforms.uTime.value = time; Object.keys(desks).forEach(k => { desks[k].beam.userData.mat.uniforms.uTime.value = time; });
      pfeil.visible = zx !== null && bd > 2.6 && !busy && ctx.stufe !== 'ernst';
      if(pfeil.visible){ const a = Math.atan2(zx - pos.x, zz - pos.z), w = 1.1 + Math.sin(time * 5) * 0.12; pfeil.position.set(pos.x + Math.sin(a) * w, 0.07, pos.z + Math.cos(a) * w); pfeil.rotation.y = a; }
      refreshUi();
      const kf = Math.min(1, dt * 8); tgt.x += (pos.x - tgt.x) * kf; tgt.z += (pos.z - tgt.z) * kf;
      if(!gespiegelt && time > 0.05){ gespiegelt = true; fig.visible = false; st.spiegeln(G ? (G.x1 + G.x2) / 2 : pos.x, 1.5, G ? (G.z1 + G.z2) / 2 : pos.z); fig.visible = true; }
      st.cam(tgt, dt);
      if(++tick % 3 === 0 && faders.length){
        tmp.set(pos.x, 1.3, pos.z); const len = tmp.distanceTo(st.camera.position);
        ray.set(st.camera.position, tmp.sub(st.camera.position).normalize()); ray.far = len - 0.4;
        const hit = ray.intersectObjects(faders, false).map(x => x.object);
        faded.forEach(m => { if(!hit.includes(m)) m.material.opacity = 1; }); hit.forEach(m => { m.material.opacity = 0.16; }); faded = hit;
      }
      if(tick % 6 === 0 && ctx.karte && G) ctx.karte(G, boxes, aktiv.map(s => ({ x:s.x, z:s.z, c:trage ? FARBE.ziel : FARBE.offen })), { x:pos.x, z:pos.z, rot:face });
    });

    return {
      dispose(){ clearTimeout(noteT); ui.act.hidden = true; ui.act.onclick = null; st.dispose(); },
      pause: v => st.pause(v), halt: v => st.halt(v), stage:st, rec:!!W.rec,
      // für die automatische Prüfung: Stationen mit offenen Aufgaben, Sichter, Schreibtische; Figur an eine Station stellen
      _stage:st, _pos:pos, _boxes:boxes,
      _check(){ const alle = spots.concat(sichter ? [sichter] : [], Object.keys(desks).map(k => desks[k]), [{ n:'Start', x:W.start.x, z:W.start.z }]); return alle.filter(x => STAGE.blocked(x.x, x.z, R, boxes)).map(x => x.n); },
      _next(){ if(trage) return { typ:'abgeben', ziel:trage.ziel }; if(sichter && sichter.queue.length) return { typ:'holen' }; const s = spots.find(x => x.queue.length); return s ? { typ:'frage', a:s.queue[0], n:s.n } : null; },
      _goto(was, ziel){ const s = was === 'holen' ? sichter : was === 'abgeben' ? desks[ziel] : spots.find(x => x.queue.length); pos.x = s.x; pos.z = s.z; tgt.set(pos.x, 1.2, pos.z); uiKey = ''; near = null; return s.n; },
      _near: () => (near ? near.n : null), _sz:SZ, _fristen:fristen, _vor: sek => { if(SZ) SZ.t += sek; }, _ablauf: () => fristen.forEach(f => { if(!f.aus) f.rest = 0.01; })
    };
  }
  return { start };
})();
