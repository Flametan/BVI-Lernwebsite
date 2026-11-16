/* Mission „Begehung“: Man läuft als Einsatzkraft durch das Gebäude (dritte Person), wechselt über die Treppe das Geschoss
   und prüft an den Leuchtsäulen Türen, Wände, Decken und Treppen. Aufgaben und Lösungen stehen in game/data/begehung.json.
   Grundriss je Geschoss (Meter): x 0–26, z 0–12; Treppenraum x 0–5, notwendiger Flur x 5–9, Trenn- oder Brandwand bei x 18. */
(window.MISSIONS = window.MISSIONS || {}).begehung = (function(){
  const W = 26, DP = 12, WH = 2.7, TH = 0.25, XS = 5, XF = 9, XT = 18, R = 0.4, SPEED = 4.6;
  const COL = { wand:0xdfe2e7, tuer:0x9a6a3a, brand:0xc8695a, fenster:0x8fc3ea, holz:0xb08a5a, metall:0x8d96a3, stoff:0x5f7fa6, stufe:0xaab2bc };
  const FARBE = { offen:'#f59e0b', ok:'#1f9d55', halb:'#b7791f', falsch:'#c53030' };
  // Wo die Leuchtsäule einer Aufgabe steht und wie das Bauteil heißt
  const ORT = {
    tuer_tr:[XS, 6, 'Tür'], tuer_ne:[XF, 6, 'Tür'], tuer_trenn:[XT, 6, 'Tür'],
    wand_tr:[XS + 0.75, 2.5, 'Wand Treppenraum'], wand_flur:[XF + 0.75, 2.5, 'Flurwand'], wand_trenn:[XT - 0.8, 2.5, 'Trennwand'], wand_brand:[XT - 0.9, 2.5, 'Brandwand'],
    wand_tragend:[15, 0.85, 'Tragende Wand'], decke:[13, 8.4, 'Decke'], treppe:[2.5, 8.2, 'Treppe'], flur:[7, 9.6, 'Flur'],
    fenster:[12, 0.85, 'Fenster'], tr_fenster:[2.5, 0.85, 'Fenster'], rauchabzug:[2.5, 3.4, 'Rauchabzug'], brand_dach:[XT - 0.9, 9.6, 'Brandwand am Dach']
  };

  function start(ctx){
    const L = ctx.level, ui = ctx.ui, st = STAGE.create(ctx.canvas, ui), sc = st.scene;
    const braucht = (g, teil) => L.aufgaben.some(a => a.g === g && a.teil === teil);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), STAGE.tile(STAGE.css('--ground', '#9fb39a'), 4));
    ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, -0.06, DP / 2); sc.add(ground);

    /* ---------- Geschosse bauen ---------- */
    const floors = L.geschosse.map((G, g) => {
      const grp = new THREE.Group(), boxes = [], faders = [], doors = [];
      const lam = c => new THREE.MeshLambertMaterial({ color:c, transparent:true });
      function solid(x1, z1, x2, z2, h, color, y0, fade){
        const m = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, h, z2 - z1), lam(color));
        m.position.set((x1 + x2) / 2, (y0 || 0) + h / 2, (z1 + z2) / 2); grp.add(m); boxes.push({ x1, x2, z1, z2 }); if(fade) faders.push(m); return m;
      }
      const wallZ = (x, z1, z2, c, th) => solid(x - (th || TH) / 2, z1, x + (th || TH) / 2, z2, WH, c || COL.wand, 0, true);
      const wallX = (z, x1, x2, c) => solid(x1, z - TH / 2, x2, z + TH / 2, WH, c || COL.wand, 0, true);
      function divider(x, tuer, c, th){                 // Wand quer durch das Geschoss, auf Wunsch mit Tür bei z = 6
        if(!tuer){ wallZ(x, 0, DP, c, th); return; }
        wallZ(x, 0, 5.2, c, th); wallZ(x, 6.8, DP, c, th);
        const piv = new THREE.Group(); piv.position.set(x, 0, 5.2); grp.add(piv);
        const blatt = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.15, 1.6), lam(COL.tuer)); blatt.position.set(0, 1.075, 0.8); piv.add(blatt);
        doors.push({ piv, x, z:6, a:0 });
      }
      // Boden: Treppenraum, Flur und Nutzung in eigenen Farben (Kachel-Shader)
      const boden = (x1, x2, color, size) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, DP), STAGE.tile(color, size)); m.rotation.x = -Math.PI / 2; m.position.set((x1 + x2) / 2, 0, DP / 2); grp.add(m); };
      const keller = g === 0;
      boden(0, XS, keller ? '#8e9299' : '#c9ccd2', 1); boden(XS, G.flur ? XF : W, G.flur ? '#ecd08a' : (keller ? '#a3a6ab' : '#d8cdb8'), G.flur ? 1 : 1.5);
      if(G.flur) boden(XF, W, keller ? '#a3a6ab' : '#d8cdb8', 1.5);
      wallX(0, 0, W); wallX(DP, 0, W); wallZ(0, 0, DP); wallZ(W, 0, DP);
      divider(XS, true);
      if(G.flur) divider(XF, true);
      if(L.brand) divider(XT, braucht(g, 'tuer_trenn'), COL.brand, 0.5);
      else if(G.trenn) divider(XT, braucht(g, 'tuer_trenn'));
      if(!keller){
        const f = (x, w) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, TH + 0.08), lam(COL.fenster)); m.position.set(x, 1.6, 0); grp.add(m); };
        f(12, 1.6); f(2.5, 1.0); f(22, 1.6);
      }
      for(let i = 0; i < 6; i++){                        // Treppe (nur Anblick): hier wechselt man das Geschoss
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2 + i * 0.22, 2.2), lam(COL.stufe)); s.position.set(0.9 + i * 0.6, (0.2 + i * 0.22) / 2, 10.5); grp.add(s);
      }
      einrichten(G.name, solid, L.brand || G.trenn);
      const lb = STAGE.label(G.name, { color:'#ffffff', bg:'rgba(20,24,32,.78)', h:0.55 }); lb.position.set(2.5, 3.4, 10.5); grp.add(lb);
      grp.visible = false; sc.add(grp);
      return { grp, boxes, faders, doors };
    });
    function einrichten(name, solid, geteilt){
      const n = name.toLowerCase(), max = geteilt ? 17 : 25;
      if(/büro/.test(n)){ [[11, 10.3], [14.5, 10.3], [11, 3.6]].forEach(([x, z]) => { solid(x - 0.8, z - 0.4, x + 0.8, z + 0.4, 0.75, COL.holz); solid(x - 0.3, z - 0.08, x + 0.3, z + 0.08, 0.45, 0x23262b, 0.75); }); }
      else if(/wohn/.test(n)){ solid(10.2, 10.6, 12.4, 11.5, 0.8, COL.stoff); solid(14.6, 9.8, 15.8, 11, 0.72, COL.holz); solid(Math.min(max - 2.4, 22), 2, Math.min(max - 0.4, 24), 3.7, 0.5, COL.stoff); }
      else if(/laden/.test(n)){ solid(10.4, 10.3, 13.6, 11, 1.0, COL.holz); [20, 22.2, 24.2].forEach(x => { if(x < max) solid(x - 0.25, 2, x + 0.25, 5, 1.8, COL.metall); }); }
      else { solid(10.4, 10.2, 11.4, 11.2, 0.9, COL.holz); solid(11.6, 10.5, 12.4, 11.3, 0.7, COL.holz); solid(15.6, 10.3, 16.6, 11.3, 1.1, COL.metall); }
    }

    /* ---------- Aufgaben: Leuchtsäule und Schild am Bauteil ---------- */
    const tasks = L.aufgaben.map((a, i) => {
      const o = ORT[a.teil]; if(!o || !floors[a.g]){ console.error('Bauteil fehlt', a.g, a.teil); return null; }
      const b = STAGE.beam(FARBE.offen); b.position.set(o[0], 0, o[1]); floors[a.g].grp.add(b);
      const lb = STAGE.label(o[2], { color:'#ffffff', bg:'rgba(20,24,32,.78)', h:0.42 }); lb.position.set(o[0], 3.5, o[1]); floors[a.g].grp.add(lb);
      return { a, i, g:a.g, x:o[0], z:o[1], beam:b, state:null };
    }).filter(Boolean);
    let left = tasks.length;

    /* ---------- Figur, Kamera, Ablauf ---------- */
    const fig = STAGE.figure(); sc.add(fig);
    const pfeil = STAGE.arrow(FARBE.offen); sc.add(pfeil); let stepT = 0;
    const pos = { x:2.5, z:5.2 }; let cur = Math.min(1, floors.length - 1), face = 0, near = null, onStairs = false, busy = false, uiKey = '';
    const tgt = new THREE.Vector3(pos.x, 1.2, pos.z), ray = new THREE.Raycaster(), tmp = new THREE.Vector3(); let faded = [], tick = 0;
    function setFloor(n){ if(n < 0 || n >= floors.length) return; floors.forEach((f, i) => { f.grp.visible = i === n; }); cur = n; faded.forEach(m => { m.material.opacity = 1; }); faded = []; uiKey = ''; }
    setFloor(cur);

    function refreshUi(){
      const offenHier = tasks.filter(t => t.g === cur && t.state === null).length;
      const sonst = left - offenHier;
      const key = [cur, near ? near.i : -1, onStairs, offenHier, left].join('|'); if(key === uiKey) return; uiKey = key;
      ui.info.textContent = L.geschosse[cur].name + ' · hier offen: ' + offenHier + (sonst ? ' · andere Geschosse: ' + sonst : '');
      ui.act.hidden = !near; if(near) ui.act.textContent = 'Prüfen: ' + ORT[near.a.teil][2];
      ui.up.hidden = !(onStairs && cur < floors.length - 1); ui.down.hidden = !(onStairs && cur > 0);
      if(!ui.up.hidden) ui.up.textContent = '▲ ' + L.geschosse[cur + 1].name; if(!ui.down.hidden) ui.down.textContent = '▼ ' + L.geschosse[cur - 1].name;
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
    function wechsel(n){ if(!onStairs || busy || n < 0 || n >= floors.length) return; STAGE.sfx('stairs'); ctx.fade(() => setFloor(n)); }
    const hoch = () => wechsel(cur + 1), runter = () => wechsel(cur - 1);
    st.input.action = pruefen; st.input.key = k => { if(k === 'r') hoch(); else if(k === 'f') runter(); else if(k === 'Escape' || k === 'p') ctx.menu(); };
    ui.act.onclick = pruefen; ui.up.onclick = hoch; ui.down.onclick = runter;

    st.start((dt, time) => {
      const F = floors[cur], inp = st.input, sy = Math.sin(inp.yaw), cy = Math.cos(inp.yaw);
      // Bewegung relativ zur Kamera: vorwärts = von der Kamera weg
      const vx = (cy * inp.mx - sy * inp.my) * SPEED, vz = (-sy * inp.mx - cy * inp.my) * SPEED, sp = Math.hypot(vx, vz);
      if(sp > 0.05){
        STAGE.moveCircle(pos, vx * dt, vz * dt, R, F.boxes);
        let d = Math.atan2(vx, vz) - face; d = Math.atan2(Math.sin(d), Math.cos(d)); face += d * Math.min(1, dt * 12);
        if((stepT -= dt) <= 0){ stepT = 0.36; STAGE.sfx('step'); }
      }
      fig.position.set(pos.x, 0, pos.z); fig.rotation.y = face; fig.animate(dt, sp);
      F.doors.forEach(d => { const open = Math.hypot(pos.x - d.x, pos.z - d.z) < 2.3 ? 1.45 : 0; if(open && !d.o) STAGE.sfx('door'); d.o = open; d.a += (open - d.a) * Math.min(1, dt * 7); d.piv.rotation.y = d.a; });
      near = null; let best = 2.1;
      tasks.forEach(t => { t.beam.userData.mat.uniforms.uTime.value = time; if(t.g === cur && t.state === null){ const d = Math.hypot(pos.x - t.x, pos.z - t.z); if(d < best){ best = d; near = t; } } });
      onStairs = pos.x < 4.7 && pos.z > 8.9;
      // Pfeil vor der Figur: zur nächsten offenen Aufgabe im Geschoss, sonst zur Treppe
      let zx = null, zz = 0, bd = 1e9;
      tasks.forEach(t => { if(t.g === cur && t.state === null){ const d = Math.hypot(pos.x - t.x, pos.z - t.z); if(d < bd){ bd = d; zx = t.x; zz = t.z; } } });
      if(zx === null && left > 0 && !onStairs){ zx = 2.5; zz = 10.2; bd = Math.hypot(pos.x - zx, pos.z - zz); }
      pfeil.visible = zx !== null && bd > 2.4;
      if(pfeil.visible){ const a = Math.atan2(zx - pos.x, zz - pos.z); pfeil.position.set(pos.x + Math.sin(a) * 1.1, 0.07, pos.z + Math.cos(a) * 1.1); pfeil.rotation.y = a; }
      refreshUi();
      // Kamera folgt weich hinter und über der Figur
      tgt.x += (pos.x - tgt.x) * Math.min(1, dt * 8); tgt.z += (pos.z - tgt.z) * Math.min(1, dt * 8);
      const cp = Math.cos(inp.pitch), d = inp.dist;
      st.camera.position.set(tgt.x + sy * cp * d, 1.2 + Math.sin(inp.pitch) * d, tgt.z + cy * cp * d); st.camera.lookAt(tgt);
      // Wände zwischen Kamera und Figur werden durchsichtig (jeden dritten Durchlauf geprüft)
      if(++tick % 3 === 0){
        tmp.set(pos.x, 1.3, pos.z); const len = tmp.distanceTo(st.camera.position);
        ray.set(st.camera.position, tmp.sub(st.camera.position).normalize()); ray.far = len - 0.4;
        const hit = ray.intersectObjects(F.faders, false).map(h => h.object);
        faded.forEach(m => { if(!hit.includes(m)) m.material.opacity = 1; }); hit.forEach(m => { m.material.opacity = 0.2; }); faded = hit;
      }
    });

    return {
      dispose(){ ui.act.hidden = ui.up.hidden = ui.down.hidden = true; ui.act.onclick = ui.up.onclick = ui.down.onclick = null; st.dispose(); },
      // für die automatische Prüfung
      pause: v => st.pause(v), stage:st,
      _stage:st, _pos:pos, _tasks:tasks, _floor:() => cur, _goto(i){ const t = tasks[i]; setFloor(t.g); pos.x = t.x + (t.x < 1 ? 0.6 : 0); pos.z = t.z; }
    };
  }
  return { start };
})();
