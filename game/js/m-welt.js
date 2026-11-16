/* Missionen in einer begehbaren Welt auf einer Ebene (alle außer der Begehung):
   Stabsraum, Brandschutzdienststelle, Einsatzstelle, Lagezentrum, Flugfeld, Wache, Hörsaal, Planungsbüro.
   Die Aufgaben stehen an Stationen (Leuchtsäulen). Aufgabenarten: Frage (mc, multi, reihe) oder „bringen“
   (Meldung am Sichter holen und zum zuständigen Sachgebiet tragen). Daten: game/data/<mission>.json, Feld „welt“ wählt die Kulisse. */
(window.MISSIONS = window.MISSIONS || {}).welt = (function(){
  const WH = 2.7, TH = 0.25, R = 0.4, SPEED = 4.8;
  const FARBE = { offen:'#f59e0b', ok:'#1f9d55', halb:'#b7791f', falsch:'#c53030', ziel:'#2f7de1' };

  function start(ctx){
    const L = ctx.level, ui = ctx.ui, st = STAGE.create(ctx.canvas, ui), sc = st.scene, S = STAGE.surf, Mt = STAGE.mat, C = STAGE.C;
    const boxes = [], faders = [], npcs = [];
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
      sperre(x1, z1, x2, z2); faders.push(o); return o;
    }
    // Raum mit Tür in der Südwand (2 m breit, offen); Boden nach Art
    function raum(w, d, boden, rx, rz, aussen){
      q(0, 0, w, d, -0.2, 0.2, S(boden, rx || w / 2, rz || d / 2), false);
      const ma = S('putz', 6, 1, { color:C(aussen || '#efe6d6') }), t = TH / 2, tx = w / 2;
      wand(0, -t, w, t, ma); wand(-t, t, t, d - t, ma); wand(w - t, t, w + t, d - t, ma); wand(0, d - t, tx - 1, d + t, ma); wand(tx + 1, d - t, w, d + t, ma);
      const mr = Mt('#f4f4f1'), mg = Mt('#9ccbf0', { roughness:0.08, metalness:0.4, transparent:true, opacity:0.75 });
      for(let x = 3; x < w - 2; x += 4.5){ q(x - 0.87, -0.16, x + 0.87, 0.16, 0.93, 1.34, mr, false); q(x - 0.8, -0.18, x + 0.8, 0.18, 1.0, 1.2, mg, false); }
      umgebung(w, d);
      return { w, d, start:{ x:tx, z:d - 1.6 } };
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
    function tisch(x, z, w, d, m){ q(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0.7, 0.05, m || M.holz); q(x - w / 2 + 0.03, z - d / 2 + 0.03, x - w / 2 + 0.09, z + d / 2 - 0.03, 0, 0.7, M.metall); q(x + w / 2 - 0.09, z - d / 2 + 0.03, x + w / 2 - 0.03, z + d / 2 - 0.03, 0, 0.7, M.metall); sperre(x - w / 2, z - d / 2, x + w / 2, z + d / 2); }
    function monitor(x, z, nachSueden){ const s = nachSueden ? 1 : -1; q(x - 0.3, z - 0.02, x + 0.3, z + 0.02, 0.88, 0.36, M.dunkel); q(x - 0.04, z - 0.03, x + 0.04, z + 0.03, 0.75, 0.13, M.dunkel); q(x - 0.25, z + s * 0.18, x + 0.2, z + s * 0.32, 0.75, 0.02, M.dunkel); }
    function stuhl(x, z, m){ q(x - 0.24, z - 0.24, x + 0.24, z + 0.24, 0.42, 0.08, m || M.stoff); mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), M.metall, x, 0.21, z); }
    function regal(x1, z1, x2, z2, bunt){ q(x1, z1, x2, z2, 0, 1.9, M.weiss); sperre(x1, z1, x2, z2); const f = ['#8a2f2f', '#2f5d8a', '#3f7a45', '#b08a2e', '#5b4a7a'].map(c => Mt(c)), lang = x2 - x1 > z2 - z1;
      for(let r = 0; r < 4; r++) for(let k = 0; k < 6; k++){ const u = k / 6; if(lang) q(x1 + 0.08 + u * (x2 - x1 - 0.16), z2 - 0.02, x1 + 0.08 + (u + 0.14) * (x2 - x1 - 0.16), z2 + 0.03, 0.25 + r * 0.42, 0.3, bunt === false ? M.metall : f[(r + k) % 5], false); else q(x2 - 0.02, z1 + 0.08 + u * (z2 - z1 - 0.16), x2 + 0.03, z1 + 0.08 + (u + 0.14) * (z2 - z1 - 0.16), 0.25 + r * 0.42, 0.3, f[(r + k) % 5], false); } }
    function pflanze(x, z){ mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 10), M.ton, x, 0.2, z); mesh(new THREE.IcosahedronGeometry(0.42, 1), M.gruen, x, 0.85, z); sperre(x - 0.2, z - 0.2, x + 0.2, z + 0.2); }
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
    function npc(x, z, rot, opt){ const f = STAGE.figure(opt); f.position.set(x, 0, z); f.rotation.y = rot || 0; sc.add(f); npcs.push(f); sperre(x - 0.3, z - 0.3, x + 0.3, z + 0.3); return f; }
    const ZIV = [{ zivil:true, jacke:'#7a3b3b', hose:'#2b2f3a', haar:'#2a1d14' }, { zivil:true, jacke:'#3b6a7a', hose:'#3a3a3a', haar:'#c9a45c' }, { zivil:true, jacke:'#5b5f66', hose:'#1f2733', haar:'#6b4a2f' }, { zivil:true, jacke:'#8a7a3b', hose:'#2b2f3a', haar:'#141414' }, { zivil:true, jacke:'#4a3b7a', hose:'#3a342e', haar:'#8a8a8a' }];
    const DIENST = { leicht:true };
    function arbeitsplatz(x, z, nachSueden, opt){ const s = nachSueden ? 1 : -1; tisch(x, z, 1.7, 0.8); monitor(x, z - s * 0.15, nachSueden); stuhl(x, z - s * 0.85); npc(x, z - s * 0.85, nachSueden ? 0 : Math.PI, opt || DIENST); }
    function fahrzeug(x, z, lang, hoch, lack, blau){
      q(x, z, x + lang, z + 2.4, 0.5, hoch, lack); q(x, z + 0.02, x + lang, z + 2.38, 0.3, 0.25, Mt('#2a2d31')); q(x - 0.03, z + 0.2, x + 0.02, z + 2.2, 0.5 + hoch * 0.5, hoch * 0.4, M.glas); q(x + 0.3, z - 0.03, x + 1.9, z + 2.43, 0.5 + hoch * 0.5, hoch * 0.4, M.glas);
      q(x - 0.02, z - 0.02, x + lang + 0.02, z + 2.42, 0.5 + hoch * 0.3, 0.14, M.weiss);
      [[1.2, 0], [lang - 1.3, 0], [1.2, 2.4], [lang - 1.3, 2.4]].forEach(([a, b]) => { mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.32, 16), M.rad, x + a, 0.5, z + b).rotation.x = Math.PI / 2; mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.34, 10), M.felge, x + a, 0.5, z + b).rotation.x = Math.PI / 2; });
      if(blau){ const b = Mt('#2b6cff', { emissive:C('#1b4fd6'), emissiveIntensity:1.5 }); q(x + 0.5, z + 0.3, x + 1.8, z + 0.55, 0.5 + hoch, 0.16, b); q(x + 0.5, z + 1.85, x + 1.8, z + 2.1, 0.5 + hoch, 0.16, b); }
      sperre(x, z, x + lang, z + 2.4);
    }
    // Freigelände: Boden, Zaun als Grenze, Bäume und Häuser am Rand
    function gelaende(x1, z1, x2, z2, boden){
      flaeche(-220, -220, 260, 260, -0.03, S('gras', 90, 90)); flaeche(x1, z1, x2, z2, 0, S(boden, (x2 - x1) / 3, (z2 - z1) / 3));
      const zaun = Mt('#7d848d', { metalness:0.5, roughness:0.5 });
      [[x1 - 0.1, z1 - 0.1, x2 + 0.1, z1], [x1 - 0.1, z2, x2 + 0.1, z2 + 0.1], [x1 - 0.1, z1, x1, z2], [x2, z1, x2 + 0.1, z2]].forEach(b => { q(b[0], b[1], b[2], b[3], 0, 1.1, zaun, false); sperre(b[0], b[1], b[2], b[3]); });
      for(let x = x1 - 8; x <= x2 + 8; x += 9){ baum(x, z1 - 6 - ((x * 3) % 4 + 4) % 4, 1.2); baum(x + 4, z2 + 7 + ((x * 5) % 3 + 3) % 3, 1.15); }
      haus(x1 - 30, z1 + 2, 16, 12, 10, '#ecdcc6'); haus(x2 + 14, z1 + 4, 16, 13, 12, '#e2e7dd'); haus((x1 + x2) / 2 - 30, z2 + 22, 18, 12, 10, '#f0e2c8'); haus((x1 + x2) / 2 + 8, z2 + 22, 18, 12, 12.5, '#dfe6ea');
      huegel();
    }

    /* ---------- Kulissen: liefern Startpunkt und Stationen ---------- */
    const WELT = {
      stab(){
        const r = raum(22, 14, 'teppich', 8, 5);
        q(9, 6, 13, 8, 0, 0.75, M.metall); flaeche(9.05, 6.05, 12.95, 7.95, 0.76, new THREE.MeshBasicMaterial({ map:tafel(0, -50, 0, 4, 2, 'Lage', 'karte').children[0].material.map, toneMapped:false })); sperre(9, 6, 13, 8);
        tafel(11, 1.75, 0.16, 5.2, 1.7, 'Lagekarte', 'karte'); tafel(4.2, 1.7, 0.16, 2.6, 1.3, 'Kräfteübersicht', 'liste'); tafel(17.8, 1.7, 0.16, 2.6, 1.3, 'Einsatztagebuch', 'liste');
        const P = { S1:[3.2, 3.4], S2:[7.6, 3.4], S3:[14.4, 3.4], S4:[18.8, 3.4], S5:[18.8, 10.4], S6:[3.2, 10.4] }, NAME = { S1:'S1 Personal', S2:'S2 Lage', S3:'S3 Einsatz', S4:'S4 Versorgung', S5:'S5 Presse', S6:'S6 IuK' }, desks = {};
        Object.keys(P).forEach(k => { const [x, z] = P[k], oben = z < 7; arbeitsplatz(x, oben ? z - 0.9 : z + 0.9, oben); desks[k] = { n:NAME[k], x, z:oben ? z + 0.35 : z - 0.35 }; });
        tisch(7, 12.2, 1.6, 0.8); npc(7, 13.1, Math.PI, DIENST); npc(11, 4.6, 0, DIENST); npc(15.6, 7, -Math.PI / 2, DIENST); pflanze(20.8, 6.8); pflanze(1.2, 6.8);
        return { start:r.start, desks, sichter:{ n:'Sichter', x:7, z:11.2 },
          spots:[['Leiter des Stabes', 11, 5.3], ['Lagekarte', 11, 1.5], ['Lagetisch', 13.9, 7.6], ['Fachberater', 15.6, 11.6], ['Verbindungsperson', 5.2, 7], ['Einsatzleiter', 8.1, 7.2], ['Leitstelle', 17.2, 7]] };
      },
      amt(){
        const r = raum(18, 12, 'teppich', 7, 5);
        arbeitsplatz(3.2, 2.2, true, ZIV[1]); arbeitsplatz(7.4, 2.2, true, ZIV[2]); tisch(9, 6.4, 3, 1.5); q(8.2, 5.9, 9.8, 6.9, 0.76, 0.01, M.weiss, false);
        [[8.5, 6.2, 0.5, 0.4], [9.1, 6.5, 0.35, 0.7], [9.5, 6.1, 0.3, 0.3]].forEach(b => q(b[0], b[1], b[0] + b[2], b[1] + b[2], 0.77, b[3], Mt('#d8d2c4')));
        regal(0.2, 5, 0.7, 9.5); regal(13.5, 0.2, 17.2, 0.7); tisch(14.6, 9.6, 2.2, 1.1); npc(14.6, 10.6, Math.PI, ZIV[0]); pflanze(16.8, 5.5); tafel(11.5, 1.7, 0.16, 2.6, 1.3, 'Fristen', 'liste');
        return { start:r.start, spots:[['Posteingang', 3.2, 3.5], ['Plantisch', 9, 7.7], ['Bauakte', 14.6, 8.5], ['Kollege', 7.4, 3.5], ['Planarchiv', 1.5, 7.2], ['Vorschriften', 15.4, 1.6], ['Modell', 11.2, 6.4]] };
      },
      lagezentrum(){
        const r = raum(20, 13, 'teppich', 8, 5, '#dfe3e8');
        q(7.5, 5.4, 12.5, 7.6, 0, 0.75, M.metall); flaeche(7.55, 5.45, 12.45, 7.55, 0.76, new THREE.MeshBasicMaterial({ map:tafel(0, -50, 0, 5, 2.2, 'Deutschland', 'karte').children[0].material.map, toneMapped:false })); sperre(7.5, 5.4, 12.5, 7.6);
        tafel(10, 1.75, 0.16, 6, 1.7, 'Lagebild', 'karte'); tafel(3.4, 1.7, 0.16, 2.6, 1.3, 'Warnstufen', 'balken'); tafel(16.6, 1.7, 0.16, 2.6, 1.3, 'MoWaS', 'liste');
        arbeitsplatz(3, 3.2, true); arbeitsplatz(17, 3.2, true); arbeitsplatz(3, 10.6, false); arbeitsplatz(17, 10.6, false, { leicht:true, jacke:'#4a5a3a', hose:'#3d4a30' }); npc(13.4, 6.5, -Math.PI / 2, DIENST);
        mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 8), M.metall, 6.2, 1.1, 11.6); mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.3, 12), M.rot, 6.2, 2.3, 11.6); sperre(6, 11.4, 6.4, 11.8);
        return { start:r.start, spots:[['Lagetisch', 10, 8.3], ['Lagebild', 10, 1.5], ['Warnzentrale', 3, 4.6], ['MoWaS-Platz', 17, 4.6], ['Länder', 3, 9.2], ['Bundeswehr', 17, 9.2], ['Sirene', 7.2, 11.2], ['BBK', 13.4, 5]] };
      },
      wache(){
        const r = raum(18, 12, 'holz', 5, 6);
        arbeitsplatz(3, 2.2, true); regal(0.2, 4.5, 0.7, 8); tisch(9, 6, 3.2, 1.4); [[7.8, 4.9], [9, 4.9], [10.2, 4.9], [7.8, 7.1], [9, 7.1], [10.2, 7.1]].forEach(s => stuhl(s[0], s[1]));
        npc(9, 4.9, 0, DIENST); npc(10.2, 7.1, Math.PI, DIENST); npc(7.8, 7.1, Math.PI, DIENST);
        tafel(9, 1.6, 0.16, 1.6, 1.9, 'Dienstplan', 'liste'); q(13.5, 0.2, 17.6, 0.85, 0, 0.9, M.weiss); sperre(13.5, 0.2, 17.6, 0.85); q(14, 0.3, 14.5, 0.7, 0.9, 0.35, M.dunkel); mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 10), M.rot, 16.4, 1.03, 0.5);
        for(let i = 0; i < 4; i++){ q(17.2, 3.4 + i * 0.75, 17.8, 4.1 + i * 0.75, 0, 1.9, i % 2 ? M.metall : Mt('#5b6875')); } sperre(17.2, 3.4, 17.8, 6.4);
        q(3.6, 9.4, 5.8, 10.3, 0, 0.42, M.stoff); q(3.6, 10.1, 5.8, 10.35, 0.42, 0.45, M.stoff); sperre(3.6, 9.4, 5.8, 10.35); npc(14, 9.4, -2.2, DIENST); pflanze(16.8, 10.8);
        return { start:r.start, spots:[['Wachleiter', 3, 3.5], ['Besprechung', 11.6, 6], ['Dienstplan', 9, 1.6], ['Küche', 15.5, 1.8], ['Kollege', 13.2, 8.8], ['Sofaecke', 4.7, 8.6], ['Spinde', 16.2, 4.9]] };
      },
      hoersaal(){
        const r = raum(20, 13, 'holz', 6, 7, '#e6dfd2');
        tafel(10, 1.75, 0.16, 7, 1.8, '§ Recht', 'kreide'); q(9.2, 2.2, 10.8, 2.9, 0, 1.05, M.holz); sperre(9.2, 2.2, 10.8, 2.9); npc(10, 1.6, 0, ZIV[2]);
        [5, 7.2, 9.4].forEach((z, i) => { [[2, 8.2], [11.8, 18]].forEach(([a, b]) => { q(a, z, b, z + 0.45, 0.68, 0.06, M.holz); q(a, z + 0.38, b, z + 0.45, 0, 0.68, M.holz); q(a, z + 0.75, b, z + 1.15, 0.4, 0.06, M.stoff); sperre(a, z, b, z + 1.15); });
          npc(4 + i * 1.3, 5.95 + i * 2.2, Math.PI, ZIV[i]); npc(14 + i, 5.95 + i * 2.2, Math.PI, ZIV[(i + 3) % 5]); });
        regal(19.3, 1.5, 19.8, 5); pflanze(1, 1.2);
        return { start:r.start, spots:[['Rednerpult', 10, 3.6], ['Tafel', 5.5, 1.4], ['Gesetzessammlung', 18.4, 3.2], ['Reihe 1', 10, 5.4], ['Reihe 2', 10, 7.6], ['Reihe 3', 10, 9.8], ['Fenster', 14.5, 1.4], ['Ausgang', 7.5, 11.6]] };
      },
      planung(){
        const r = raum(18, 12, 'teppich', 7, 5, '#e9e4da');
        q(7, 4.8, 11, 7.2, 0, 0.75, M.metall); q(7.05, 4.85, 10.95, 7.15, 0.75, 0.02, Mt('#7fa56f'), false); sperre(7, 4.8, 11, 7.2);
        for(let i = 0; i < 22; i++){ const x = 7.3 + (i * 37 % 34) / 10, z = 5.05 + (i * 53 % 19) / 10, h = 0.12 + (i * 29 % 30) / 100; q(x, z, x + 0.22, z + 0.22, 0.77, h, Mt(['#d9d3c6', '#c9b8a0', '#b9c4cf', '#e0d2b8'][i % 4])); }
        q(8.6, 5.7, 9.1, 6.1, 0.77, 0.3, M.rot);
        tafel(9, 1.7, 0.16, 3.4, 1.5, 'Kennzahlen', 'balken'); tafel(3.4, 1.7, 0.16, 2.4, 1.3, 'Haushalt', 'liste'); tafel(17.84, 1.7, 6.5, 2.6, 1.3, 'Projektplan', 'liste', -Math.PI / 2);
        arbeitsplatz(3.2, 9.9, false, ZIV[3]); arbeitsplatz(13.4, 10, false, ZIV[4]); regal(13.5, 0.2, 17.2, 0.7); pflanze(1.1, 5.5);
        return { start:r.start, spots:[['Stadtmodell', 9, 8], ['Haushaltsplan', 3.4, 1.5], ['Kennzahlen', 9, 1.5], ['Vergabeakte', 15.4, 1.6], ['Projektwand', 16.6, 6.5], ['Kämmerei', 3.2, 8.5], ['Dezernat', 13.4, 8.6]] };
      },
      einsatz(){
        gelaende(-4, -2, 34, 22, 'pflaster'); flaeche(-4, 13, 34, 20.5, 0.012, S('asphalt', 14, 2));
        q(7, -1.6, 21, 3.4, 0, 9, S('fassade', 3, 2, { color:C('#e6d3bd') })); sperre(7, -1.6, 21, 3.4);
        const glut = Mt('#ff8a2a', { emissive:C('#ff5a0a'), emissiveIntensity:1.6 }), rauch = Mt('#3a3a3c', { transparent:true, opacity:0.82 });
        [[10, 5.2], [14, 5.2], [16.6, 2.4]].forEach(f => q(f[0], 3.38, f[0] + 1.4, 3.46, f[1], 1.5, glut, false));
        [[11, 8.6, 2.6, 1.6], [13.5, 10.6, 3, 2.1], [15, 13, 2.2, 2.6], [17.4, 9.2, 3, 1.5], [12.2, 15.4, 1.2, 2.9]].forEach(k => { const o = mesh(new THREE.SphereGeometry(k[3], 12, 9), rauch, k[0], k[1], k[2], false); o.receiveShadow = false; });
        fahrzeug(1, 14, 7.6, 2.3, M.rot, true); fahrzeug(23.5, 14.2, 5.2, 1.9, M.rot, true);
        const band = Mt('#e9d21f'); for(let x = 0; x <= 30; x += 3){ mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 6), M.metall, x, 0.5, 6.2); if(x < 30) q(x, 6.19, x + 3, 6.21, 0.86, 0.07, x % 6 ? band : M.rot, false); } sperre(-4, 6.1, 34, 6.3);
        const orte = [[4, 8.6], [9.5, 9.4], [15, 8.6], [20.5, 9.4], [26, 8.6]];
        orte.forEach((o, i) => { npc(o[0], o[1], Math.PI * 0.95 + i * 0.07, ZIV[i]); if(i % 2 === 0){ [-0.2, 0, 0.2].forEach(d => { const b = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 5), M.dunkel, o[0] + 0.9 + d, 0.68, o[1] - 0.2); b.rotation.z = d * 0.6; }); q(o[0] + 0.75, o[1] - 0.38, o[0] + 1.05, o[1] - 0.05, 1.36, 0.2, M.dunkel); } });
        npc(12, 5, 0, null); npc(18, 4.8, 0.3, null);
        const lb = ['Reporterin', 'Kamerateam', 'Radio', 'Zeitung', 'Fotograf'];
        return { start:{ x:15, z:16.5 }, spots:orte.map((o, i) => [lb[i], o[0], o[1] + 1.3]).concat([['Einsatzleitwagen', 26, 17.6], ['Löschfahrzeug', 4.8, 17.6]]) };
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
        npc(30.5, 6, 0.4, DIENST); npc(36.3, 14, 0, { leicht:true, jacke:'#1f4f9f', hose:'#1c2c4a' }); npc(11, 5, 0.2, null); npc(1, 14.6, 0.5, ZIV[2]);
        return { start:{ x:20, z:19 }, spots:[['Flugzeug', 20, 4.2], ['Laderampe', 28.6, 3.7], ['Container', 2, 14.8], ['OSOCC-Zelt', 36.3, 15.2], ['EU-Flagge', 27.5, 19.2], ['Modul-Fahrzeug', 15, 19.4], ['Registrierung', 30.5, 7.3], ['Hilfsgüter', 10, 6.3]] };
      }
    };
    const W = (WELT[ctx.welt] || WELT.amt)();

    /* ---------- Stationen und Aufgaben ---------- */
    const marke = (n, x, z, farbe) => { const b = STAGE.beam(farbe); b.position.set(x, 0, z); sc.add(b); const lb = STAGE.label(n, { color:'#ffffff', bg:'rgba(20,24,32,.78)', h:0.4 }); lb.position.set(x, 3.25, z); sc.add(lb); return { n, x, z, beam:b, lb, queue:[] }; };
    const spots = W.spots.map(s => marke(s[0], s[1], s[2], FARBE.offen));
    const fragen = L.aufgaben.filter(a => a.typ !== 'bringen'), meld = L.aufgaben.filter(a => a.typ === 'bringen');
    fragen.forEach((a, i) => spots[i % spots.length].queue.push(a));
    let sichter = null, desks = {};
    if(meld.length){ sichter = marke(W.sichter.n, W.sichter.x, W.sichter.z, FARBE.offen); sichter.queue = meld.slice(); Object.keys(W.desks).forEach(k => { const d = W.desks[k]; desks[k] = marke(d.n, d.x, d.z, FARBE.ziel); }); }
    let left = L.aufgaben.length, trage = null, fehlv = 0, letzte = 'offen';
    function zeigen(){
      spots.concat(sichter ? [sichter] : []).forEach(s => { const an = s.queue.length > 0; s.beam.visible = an && !trage; s.lb.visible = an || s === sichter; if(!an && s.fertig) { s.beam.visible = !trage; } });
      Object.keys(desks).forEach(k => { desks[k].beam.visible = !!trage; });
    }
    spots.forEach(s => { if(!s.queue.length){ s.beam.visible = false; s.lb.visible = false; } });
    zeigen();

    const fig = STAGE.figure(); sc.add(fig);
    const pfeil = STAGE.arrow(FARBE.offen); sc.add(pfeil); let stepT = 0;
    const pos = { x:W.start.x, z:W.start.z }; let face = Math.PI, near = null, busy = false, uiKey = '';
    const tgt = new THREE.Vector3(pos.x, 1.2, pos.z), ray = new THREE.Raycaster(), tmp = new THREE.Vector3(); let faded = [], tick = 0;

    function erledigt(s, tries){
      s.queue.shift(); letzte = tries === 1 ? 'ok' : tries === 2 ? 'halb' : 'falsch';
      if(!s.queue.length){ s.fertig = true; s.beam.setColor(FARBE[letzte], false); }
      uiKey = ''; zeigen(); ctx.count(tries); if(--left === 0){ ctx.note(null); ctx.finish(); }
    }
    async function aktion(){
      if(busy || !near) return;
      const s = near;
      if(s === sichter && !trage && s.queue.length){
        trage = s.queue[0]; fehlv = 0; STAGE.sfx('door'); ctx.note('Meldung: „' + trage.frage + '“ Bring sie zum zuständigen Sachgebiet.'); uiKey = ''; zeigen(); return;
      }
      if(trage && s.desk){
        if(s.desk === trage.ziel){ const t = fehlv + 1; trage = null; ctx.note(null); erledigt(sichter, t); return; }
        fehlv++; STAGE.sfx('bad');
        if(fehlv >= 2){ const z = trage.ziel; trage = null; ctx.note('Zuständig war ' + W.desks[z].n + '.'); setTimeout(() => { if(!trage) ctx.note(null); }, 3500); erledigt(sichter, 3); }
        else ctx.note(s.n + ' ist nicht zuständig. Noch ein Versuch: „' + trage.frage + '“');
        return;
      }
      if(!s.queue.length || trage) return;
      busy = true; st.pause(true);
      const res = await ctx.ask(s.queue[0]);              // { tries } oder null, wenn die Frage geschlossen wurde
      busy = false; st.pause(false); if(res) erledigt(s, res.tries);
    }
    Object.keys(desks).forEach(k => { desks[k].desk = k; });
    st.input.action = aktion; st.input.key = k => { if(k === 'Escape' || k === 'p') ctx.menu(); };
    ui.act.onclick = aktion; ui.up.hidden = ui.down.hidden = true;

    function refreshUi(){
      const key = [near ? near.n : '', left, trage ? 1 : 0].join('|'); if(key === uiKey) return; uiKey = key;
      ui.info.textContent = 'Offen: ' + left + (trage ? ' · Meldung in der Hand' : '');
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
      fig.position.set(pos.x, 0, pos.z); fig.rotation.y = face; fig.animate(dt, sp, 0); npcs.forEach(f => f.animate(dt, 0, 0));
      // Nächste Station in Reichweite und Ziel des Richtungspfeils
      near = null; let best = 2.2, zx = null, zz = 0, bd = 1e9;
      const aktiv = trage ? Object.keys(desks).map(k => desks[k]) : spots.concat(sichter ? [sichter] : []).filter(s => s.queue.length);
      aktiv.forEach(s => { const d = Math.hypot(pos.x - s.x, pos.z - s.z); if(d < best){ best = d; near = s; } if(!trage && d < bd){ bd = d; zx = s.x; zz = s.z; } });
      spots.forEach(s => { s.beam.userData.mat.uniforms.uTime.value = time; }); if(sichter) sichter.beam.userData.mat.uniforms.uTime.value = time; Object.keys(desks).forEach(k => { desks[k].beam.userData.mat.uniforms.uTime.value = time; });
      pfeil.visible = zx !== null && bd > 2.6;
      if(pfeil.visible){ const a = Math.atan2(zx - pos.x, zz - pos.z); pfeil.position.set(pos.x + Math.sin(a) * 1.1, 0.07, pos.z + Math.cos(a) * 1.1); pfeil.rotation.y = a; }
      refreshUi();
      const kf = Math.min(1, dt * 8); tgt.x += (pos.x - tgt.x) * kf; tgt.z += (pos.z - tgt.z) * kf;
      const cp = Math.cos(inp.pitch), d = inp.dist;
      st.camera.position.set(tgt.x + sy * cp * d, tgt.y + Math.sin(inp.pitch) * d, tgt.z + cy * cp * d); st.camera.lookAt(tgt); st.follow(tgt);
      if(++tick % 3 === 0 && faders.length){
        tmp.set(pos.x, 1.3, pos.z); const len = tmp.distanceTo(st.camera.position);
        ray.set(st.camera.position, tmp.sub(st.camera.position).normalize()); ray.far = len - 0.4;
        const hit = ray.intersectObjects(faders, false).map(x => x.object);
        faded.forEach(m => { if(!hit.includes(m)) m.material.opacity = 1; }); hit.forEach(m => { m.material.opacity = 0.16; }); faded = hit;
      }
    });

    return {
      dispose(){ ui.act.hidden = true; ui.act.onclick = null; st.dispose(); },
      pause: v => st.pause(v), stage:st,
      // für die automatische Prüfung: Stationen mit offenen Aufgaben, Sichter, Schreibtische; Figur an eine Station stellen
      _stage:st, _pos:pos, _boxes:boxes,
      _check(){ const alle = spots.concat(sichter ? [sichter] : [], Object.keys(desks).map(k => desks[k]), [{ n:'Start', x:W.start.x, z:W.start.z }]); return alle.filter(x => STAGE.blocked(x.x, x.z, R, boxes)).map(x => x.n); },
      _next(){ if(trage) return { typ:'abgeben', ziel:trage.ziel }; if(sichter && sichter.queue.length) return { typ:'holen' }; const s = spots.find(x => x.queue.length); return s ? { typ:'frage', a:s.queue[0], n:s.n } : null; },
      _goto(was, ziel){ const s = was === 'holen' ? sichter : was === 'abgeben' ? desks[ziel] : spots.find(x => x.queue.length); pos.x = s.x; pos.z = s.z; tgt.set(pos.x, 1.2, pos.z); uiKey = ''; near = null; return s.n; },
      _near: () => (near ? near.n : null)
    };
  }
  return { start };
})();
