/* IdF-Spiel – gemeinsame 3D-Grundlage für alle Missionen (Three.js r128):
   Bühne mit Spielschleife, Licht und Schatten, Steuerung (Stick, Tastatur, Maus, Gamepad), modellierte Spielfigur,
   Oberflächen (im Browser erzeugte Texturen), Leuchtsäulen-Shader, Ton und Kollision, Kameraführung (Anflug, Schwenk zur Aufgabe).
   Effekte (Himmel, Licht, Nachbearbeitung, Partikel, Spiegelungen) kommen aus fx.js.
   Leistung: Pixel-Ratio passt sich an (0,75 bis 1,5); bei zu niedriger Bildrate fallen erst die Effekte, dann die Schatten weg. */
const STAGE = (function(){
  function css(name, fb){ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; }
  const C = hex => new THREE.Color(hex).convertSRGBToLinear();      // Farben sind sRGB gemeint, gerechnet wird linear

  /* ---------- Shader: Leuchtsäule ---------- */
  let NASS = false;                                       // Regen: Asphalt und Pflaster glänzen
  const ebene1 = o => { o.traverse(x => x.layers.set(1)); return o; };   // Schilder, Säulen, Pfeile: nicht im Tiefenbild und nicht in Spiegelungen
  const BEAM = {
    vs: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fs: 'uniform float uTime; uniform vec3 uColor; uniform float uPulse; varying vec2 vUv;'
      + 'void main(){ float fade = pow(1.0 - vUv.y, 1.6); float wave = 0.6 + 0.4*sin(vUv.y*16.0 - uTime*5.0);'
      + ' float a = fade * mix(0.55, wave, uPulse); gl_FragColor = vec4(uColor, a*0.85); }'
  };
  // Leuchtsäule über einer Aufgabe: pulsiert, solange die Aufgabe offen ist
  function beam(color){
    const mat = new THREE.ShaderMaterial({ vertexShader:BEAM.vs, fragmentShader:BEAM.fs, transparent:true, depthWrite:false, side:THREE.DoubleSide,
      uniforms:{ uTime:{ value:0 }, uColor:{ value:new THREE.Color(color) }, uPulse:{ value:1 } } });
    const g = new THREE.Group();
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 3.0, 20, 1, true), mat); col.position.y = 1.5; g.add(col);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.68, 28), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.9, side:THREE.DoubleSide, toneMapped:false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; g.add(ring);
    g.userData = { mat, ring };
    g.setColor = (c, pulse) => { mat.uniforms.uColor.value.set(c); mat.uniforms.uPulse.value = pulse ? 1 : 0; ring.material.color.set(c); };
    return ebene1(g);
  }

  /* ---------- Oberflächen: kleine Texturen, im Browser gezeichnet (keine Bilddateien) ---------- */
  const TEX = {};
  function tex(kind){
    if(TEX[kind]) return TEX[kind];
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    const rnd = (() => { let s = kind.length * 7919 + 13; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const speck = (n, a, l) => { for(let i = 0; i < n; i++){ x.fillStyle = 'rgba(' + (rnd() < 0.5 ? '0,0,0' : '255,255,255') + ',' + (rnd() * a) + ')'; x.fillRect(rnd() * S, rnd() * S, l || 2, l || 2); } };
    const base = { fliese:'#c9ccd0', holz:'#b58a5c', beton:'#9a9da1', teppich:'#6e7f96', putz:'#e9e6df', gras:'#4f7a3d', asphalt:'#3d4045', pflaster:'#a9a69f', ziegel:'#a2543f', fassade:'#d9d3c6', estrich:'#b9b3a6' }[kind] || '#cccccc';
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    if(kind === 'fliese'){ speck(260, 0.05); x.strokeStyle = 'rgba(70,74,80,.55)'; x.lineWidth = 2; for(let i = 0; i <= 2; i++){ x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, S); x.moveTo(0, i * 64); x.lineTo(S, i * 64); x.stroke(); } }
    else if(kind === 'holz'){ for(let r = 0; r < 4; r++){ x.fillStyle = 'rgba(' + (rnd() < 0.5 ? '60,35,10' : '255,225,180') + ',' + (0.05 + rnd() * 0.1) + ')'; x.fillRect(0, r * 32, S, 32); for(let i = 0; i < 26; i++){ x.fillStyle = 'rgba(70,40,15,' + rnd() * 0.12 + ')'; x.fillRect(0, r * 32 + rnd() * 32, S, 1); } x.fillStyle = 'rgba(40,22,8,.5)'; x.fillRect(0, r * 32, S, 1.5); x.fillRect((r * 53) % S, r * 32, 1.5, 32); } }
    else if(kind === 'ziegel'){ speck(400, 0.1); x.fillStyle = 'rgba(225,215,200,.8)'; for(let r = 0; r < 8; r++){ x.fillRect(0, r * 16, S, 2); for(let k = 0; k < 4; k++) x.fillRect(k * 32 + (r % 2) * 16, r * 16, 2, 16); } }
    else if(kind === 'pflaster'){ speck(500, 0.08); x.strokeStyle = 'rgba(60,60,60,.45)'; x.lineWidth = 1.5; for(let r = 0; r < 4; r++){ x.beginPath(); x.moveTo(0, r * 32); x.lineTo(S, r * 32); x.stroke(); for(let k = 0; k < 2; k++){ x.beginPath(); x.moveTo(k * 64 + (r % 2) * 32, r * 32); x.lineTo(k * 64 + (r % 2) * 32, r * 32 + 32); x.stroke(); } } }
    else if(kind === 'gras'){ for(let i = 0; i < 1800; i++){ x.fillStyle = 'rgba(' + (30 + rnd() * 70 | 0) + ',' + (95 + rnd() * 90 | 0) + ',' + (25 + rnd() * 40 | 0) + ',.5)'; x.fillRect(rnd() * S, rnd() * S, 1.5, 3 + rnd() * 3); } }
    else if(kind === 'fassade'){ speck(300, 0.04); for(let r = 0; r < 2; r++) for(let k = 0; k < 2; k++){ x.fillStyle = '#5b6470'; x.fillRect(k * 64 + 14, r * 64 + 14, 36, 40); x.fillStyle = rnd() < 0.3 ? '#f2dc9a' : '#8fb3d6'; x.fillRect(k * 64 + 17, r * 64 + 17, 30, 34); x.fillStyle = '#5b6470'; x.fillRect(k * 64 + 31, r * 64 + 17, 2, 34); x.fillStyle = '#c4bdb0'; x.fillRect(k * 64 + 11, r * 64 + 54, 42, 4); } }
    else speck(kind === 'asphalt' ? 900 : 500, kind === 'putz' ? 0.035 : 0.09);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return (TEX[kind] = t);
  }
  // Material mit Textur; rx, ry = Wiederholungen
  function surf(kind, rx, ry, opt){
    const t = tex(kind).clone(); t.needsUpdate = true; t.repeat.set(rx || 1, ry || rx || 1);
    // Glatte Böden spiegeln leicht; bei Regen glänzen auch Asphalt und Pflaster
    const glatt = kind === 'fliese' ? [0.4, 0.16] : kind === 'holz' ? [0.55, 0.12] : NASS && (kind === 'asphalt' || kind === 'pflaster') ? [0.3, 0.5] : null;
    const m = new THREE.MeshStandardMaterial(Object.assign({ map:t, roughness:glatt ? glatt[0] : 0.92, metalness:0 }, opt || {}));
    if(glatt) m.userData.spiegel = glatt[1];
    return m;
  }
  const mat = (hex, opt) => new THREE.MeshStandardMaterial(Object.assign({ color:C(hex), roughness:0.85, metalness:0 }, opt || {}));

  // Text als Schild, das immer zur Kamera zeigt; direkt vor der Kamera blendet es sich aus (sonst füllt es das Bild)
  let SCHILDER = [];
  function label(text, opt){
    opt = opt || {};
    const c = document.createElement('canvas'), F = '600 44px Roboto, system-ui, sans-serif'; let x = c.getContext('2d'); x.font = F;
    const w = Math.ceil(x.measureText(text).width) + 40; c.width = w; c.height = 68; x = c.getContext('2d');
    if(opt.bg){ x.fillStyle = opt.bg; if(x.roundRect){ x.beginPath(); x.roundRect(0, 0, w, 68, 18); x.fill(); } else x.fillRect(0, 0, w, 68); }
    x.font = F; x.fillStyle = opt.color || '#222'; x.textBaseline = 'middle'; x.fillText(text, 20, 36);
    const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, depthTest:false, transparent:true, toneMapped:false, fog:false }));
    const h = opt.h || 0.5; s.scale.set(h * w / 68, h, 1); s.renderOrder = 5; s.layers.set(1); SCHILDER.push(s);
    return s;
  }

  // Richtungspfeil am Boden (zeigt zur nächsten Aufgabe oder zur Treppe)
  function arrow(color){
    const sh = new THREE.Shape(); sh.moveTo(0, 0.55); sh.lineTo(0.3, 0); sh.lineTo(0.1, 0); sh.lineTo(0.1, -0.35); sh.lineTo(-0.1, -0.35); sh.lineTo(-0.1, 0); sh.lineTo(-0.3, 0); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.9, side:THREE.DoubleSide, depthTest:false, toneMapped:false }));
    m.rotation.x = Math.PI / 2; m.renderOrder = 4; const g = new THREE.Group(); g.add(m); return ebene1(g);   // Spitze zeigt nach +z, gedreht wird um die Hochachse
  }

  /* ---------- Ton: kurze Klänge aus dem Browser (WebAudio), keine Dateien ---------- */
  const AUDIO = { on:true, ctx:null };
  function tone(f1, f2, dur, type, vol, at){
    const c = AUDIO.ctx, t = c.currentTime + (at || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); if(f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const SFX = {
    step:() => tone(95, 70, 0.06, 'triangle', 0.07), door:() => tone(210, 130, 0.2, 'sawtooth', 0.035), stairs:() => tone(140, 100, 0.05, 'triangle', 0.08),
    ok:() => { tone(660, 660, 0.1, 'sine', 0.12); tone(990, 990, 0.16, 'sine', 0.12, 0.1); }, halb:() => tone(560, 560, 0.16, 'sine', 0.11),
    bad:() => tone(190, 120, 0.28, 'square', 0.06), win:() => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.18, 'sine', 0.12, i * 0.12))
  };
  function sfx(name){
    if(!AUDIO.on) return;
    try{
      if(!AUDIO.ctx){ const A = window.AudioContext || window.webkitAudioContext; if(!A) return; AUDIO.ctx = new A(); }
      if(AUDIO.ctx.state === 'suspended') AUDIO.ctx.resume();
      SFX[name] && SFX[name]();
    }catch(e){}
  }

  /* ---------- Spielfigur: Einsatzkraft mit Helm, Jacke, Atemschutzgerät; Hüfte, Knie, Schulter und Ellbogen sind Gelenke ---------- */
  // opt.leicht: Dienstkleidung ohne Helm und Atemschutzgerät; opt.zivil: Zivilkleidung (jacke, hose, haar als Farben)
  function figure(opt){
    opt = opt || {}; const ohne = opt.zivil || opt.leicht;
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const M = { jacke:mat(opt.jacke || '#1b2740', { roughness:0.8 }), hose:mat(opt.hose || '#182236', { roughness:0.85 }), reflex:mat('#e8d23a', { roughness:0.4, emissive:C('#5a4f08') }), silber:mat('#d9dde2', { roughness:0.35, metalness:0.5 }),
      haut:mat('#e0b08c', { roughness:0.7 }), helm:mat('#d8e04a', { roughness:0.3 }), leder:mat('#2a2622', { roughness:0.7 }), stiefel:mat('#141414', { roughness:0.6 }), flasche:mat('#e3b81f', { roughness:0.35, metalness:0.3 }), dunkel:mat('#15171a', { roughness:0.5 }) };
    const add = (geo, m, x, y, z, parent, sx, sy, sz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if(sx) o.scale.set(sx, sy, sz); o.castShadow = true; (parent || body).add(o); return o; };
    const cyl = (rt, rb, h, s) => new THREE.CylinderGeometry(rt, rb, h, s || 14), sph = (r, w, h) => new THREE.SphereGeometry(r, w || 16, h || 12);
    // Rumpf
    add(cyl(0.2, 0.165, 0.5), M.jacke, 0, 1.3, 0, null, 1, 1, 0.68);
    add(cyl(0.17, 0.175, 0.22), M.jacke, 0, 0.99, 0, null, 1, 1, 0.72);
    add(cyl(0.178, 0.178, 0.05), M.leder, 0, 1.07, 0, null, 1, 1, 0.72); add(new THREE.BoxGeometry(0.06, 0.05, 0.02), M.silber, 0, 1.07, 0.13);
    if(!opt.zivil) [1.16, 1.42].forEach(y => { add(cyl(0.2, 0.196, 0.045), M.reflex, 0, y, 0, null, 1, 1, 0.7); add(cyl(0.201, 0.2, 0.014), M.silber, 0, y, 0, null, 1, 1, 0.7); });
    add(cyl(0.085, 0.105, 0.07), M.jacke, 0, 1.58, 0);                                    // Kragen
    add(sph(0.1), M.jacke, -0.24, 1.5, 0); add(sph(0.1), M.jacke, 0.24, 1.5, 0);          // Schultern
    // Kopf und Helm
    const kopf = new THREE.Group(); kopf.position.set(0, 1.71, 0); body.add(kopf);
    add(cyl(0.05, 0.055, 0.08), M.haut, 0, -0.1, 0, kopf); add(sph(0.108), M.haut, 0, 0, 0, kopf, 1, 1.12, 1);
    add(sph(0.014, 8, 6), M.dunkel, -0.04, 0.015, 0.098, kopf); add(sph(0.014, 8, 6), M.dunkel, 0.04, 0.015, 0.098, kopf);
    if(ohne) add(new THREE.SphereGeometry(0.116, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(opt.haar || '#3a2a1c', { roughness:0.9 }), 0, 0.012, -0.008, kopf, 1, 1.1, 1.05);
    else {
    add(new THREE.SphereGeometry(0.142, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), M.helm, 0, 0.03, 0, kopf);
    add(new THREE.BoxGeometry(0.03, 0.05, 0.24), M.helm, 0, 0.165, 0, kopf); add(cyl(0.152, 0.158, 0.018, 18), M.helm, 0, 0.012, 0, kopf);
    add(cyl(0.146, 0.146, 0.03, 18), M.reflex, 0, 0.05, 0, kopf); add(new THREE.BoxGeometry(0.24, 0.15, 0.02), M.leder, 0, -0.07, -0.135, kopf).rotation.x = -0.25;
    add(new THREE.BoxGeometry(0.2, 0.05, 0.02), M.dunkel, 0, 0.07, 0.135, kopf).rotation.x = -0.3;   // hochgeklapptes Visier
    }
    // Atemschutzgerät
    if(!ohne){
    add(new THREE.BoxGeometry(0.26, 0.4, 0.03), M.dunkel, 0, 1.3, -0.15); add(cyl(0.075, 0.075, 0.42), M.flasche, 0, 1.3, -0.23); add(sph(0.075), M.flasche, 0, 1.51, -0.23); add(cyl(0.025, 0.025, 0.06, 8), M.silber, 0, 1.07, -0.23);
    add(new THREE.BoxGeometry(0.05, 0.42, 0.02), M.dunkel, -0.12, 1.33, 0.135); add(new THREE.BoxGeometry(0.05, 0.42, 0.02), M.dunkel, 0.12, 1.33, 0.135);
    add(new THREE.BoxGeometry(0.06, 0.1, 0.04), M.dunkel, 0.13, 1.42, 0.16);              // Funkgerät
    }
    // Gliedmaßen: Oberteil am Gelenk, Unterteil am zweiten Gelenk
    function glied(x, y, l1, l2, r, m1, hand){
      const o = new THREE.Group(); o.position.set(x, y, 0); body.add(o);
      add(cyl(r, r * 0.9, l1), m1, 0, -l1 / 2, 0, o); add(sph(r * 0.95, 10, 8), m1, 0, -l1, 0, o);
      const u = new THREE.Group(); u.position.y = -l1; o.add(u);
      add(cyl(r * 0.9, r * 0.8, l2), m1, 0, -l2 / 2, 0, u);
      if(hand){ if(!opt.zivil) add(cyl(r * 0.93, r * 0.9, 0.04), M.reflex, 0, -l2 * 0.72, 0, u); add(sph(0.062, 10, 8), opt.zivil ? M.haut : M.leder, 0, -l2 - 0.03, 0, u); }
      else { if(!opt.zivil) add(cyl(r * 0.94, r * 0.9, 0.04), M.reflex, 0, -l2 * 0.55, 0, u); add(new THREE.BoxGeometry(0.13, 0.14, 0.17), M.stiefel, 0, -l2 - 0.02, 0, u); add(new THREE.BoxGeometry(0.13, 0.08, 0.14), M.stiefel, 0, -l2 - 0.05, 0.13, u); add(new THREE.BoxGeometry(0.135, 0.025, 0.31), M.dunkel, 0, -l2 - 0.095, 0.06, u); }
      return { o, u };
    }
    const aL = glied(-0.285, 1.5, 0.3, 0.27, 0.064, M.jacke, true), aR = glied(0.285, 1.5, 0.3, 0.27, 0.064, M.jacke, true);
    const bL = glied(-0.105, 0.9, 0.41, 0.38, 0.086, M.hose), bR = glied(0.105, 0.9, 0.41, 0.38, 0.086, M.hose);
    let ph = 0, k = 0;
    // speed in m/s; steigung > 0: Treppe hoch (Knie höher), < 0: runter
    g.animate = (dt, speed, steigung) => {
      const ziel = Math.min(1, speed / 3); k += (ziel - k) * Math.min(1, dt * 10); ph += dt * (3.2 + speed * 2.1);
      const s = Math.sin(ph), c = Math.cos(ph), up = steigung > 0 ? 0.5 : 0;
      bL.o.rotation.x = -s * 0.62 * k - up * k * Math.max(0, s); bR.o.rotation.x = s * 0.62 * k - up * k * Math.max(0, -s);
      bL.u.rotation.x = (Math.max(0, c) * 0.95 + up * Math.max(0, s)) * k; bR.u.rotation.x = (Math.max(0, -c) * 0.95 + up * Math.max(0, -s)) * k;
      aL.o.rotation.x = s * 0.55 * k; aR.o.rotation.x = -s * 0.55 * k; aL.o.rotation.z = -0.06; aR.o.rotation.z = 0.06;
      aL.u.rotation.x = -(0.25 + Math.max(0, s) * 0.5) * k - 0.08; aR.u.rotation.x = -(0.25 + Math.max(0, -s) * 0.5) * k - 0.08;
      body.position.y = Math.abs(c) * 0.035 * k + Math.sin(ph * 0.35) * 0.004 * (1 - k); body.rotation.x = 0.07 * k + (steigung > 0 ? 0.1 : steigung < 0 ? -0.04 : 0) * k;
      body.rotation.z = s * 0.025 * k; kopf.rotation.y = Math.sin(ph * 0.21) * 0.12 * (1 - k);
    };
    g.animate(0, 0, 0);
    return g;
  }

  /* ---------- Bühne ---------- */
  // opt.licht = Name einer Lichtstimmung aus FX.LICHT; opt.fx = 'aus' | 'mittel' | 'hoch'; opt.anflug = false schaltet die Kamerafahrt ab
  function create(canvas, ui, opt){
    opt = opt || {}; const L = FX.LICHT[opt.licht] || FX.LICHT.tag; NASS = !!L.nass; SCHILDER = [];
    const schilder = SCHILDER, wp = new THREE.Vector3();
    const ruhig = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });   // wirft, wenn das Gerät kein WebGL kann
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = L.exp;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 1, 0.1, 600); camera.layers.enable(1);
    scene.fog = new THREE.Fog(C(L.fog), L.fogN, L.fogF);
    const sunDir = new THREE.Vector3().fromArray(L.sun).normalize();
    const skyMat = FX.himmel(L);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat); sky.frustumCulled = false; scene.add(sky);
    scene.add(new THREE.HemisphereLight(C(L.hemiS), C(L.hemiG), L.hemiI));
    const sun = new THREE.DirectionalLight(C(L.sunCol), L.sunI); sun.castShadow = true; scene.add(sun); scene.add(sun.target);
    const sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 120; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04; sun.shadow.radius = 2.2;
    // Sonne und Himmel folgen dem Blickziel, damit der Schatten dort scharf bleibt
    function follow(t){ sun.target.position.copy(t); sun.position.copy(t).addScaledVector(sunDir, 55); sky.position.copy(camera.position); }
    // Partikel und Wetter
    const quellen = FX.quellen(scene), regen = L.regen ? FX.regen(scene) : null;
    // Lampen für die Dämmerung (höchstens drei, ohne Schatten) und blinkende Lichter (Blaulicht)
    let lampen = 0; const blinker = [];
    function lampe(x, y, z, farbe, kraft){ if(!L.lampen || lampen >= 3) return null; lampen++; const p = new THREE.PointLight(C(farbe || '#ffd9a0'), kraft || 1.1, 16, 2); p.position.set(x, y, z); scene.add(p); return p; }
    const blink = (m, versatz) => blinker.push({ m, v:versatz || 0 });

    /* Qualität: „auto“ senkt bei schwacher Bildrate erst die Auflösung, dann die Effekte, dann die Schatten; „niedrig“ und „hoch“ sind fest.
       Effekte: aus = direkt zeichnen; mittel = Bloom und Vignette; hoch = zusätzlich Tiefenunschärfe im Hintergrund */
    const DPR = window.devicePixelRatio || 1; let qual = 'auto', pr = Math.min(DPR, 1.5), acc = 0, cnt = 0, gut = 0, fx = opt.fx || 'mittel', fxAuto = true, post = null, cube = null, focus = 8;
    function shadows(on, size){ renderer.shadowMap.enabled = on; sun.castShadow = on; if(size && sun.shadow.mapSize.x !== size){ sun.shadow.mapSize.set(size, size); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; } } scene.traverse(o => { if(o.material) o.material.needsUpdate = true; }); }
    function resize(){ const w = canvas.clientWidth, h = canvas.clientHeight; if(!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); FX.scale.value = h * pr / (2 * Math.tan(camera.fov * Math.PI / 360)); }
    function setQuality(q){
      qual = q; pr = q === 'niedrig' ? Math.min(DPR, 0.75) : q === 'hoch' ? Math.min(DPR, 2) : Math.min(DPR, 1.5);
      renderer.setPixelRatio(pr); shadows(q !== 'niedrig', q === 'hoch' ? 2048 : 1024); resize();
    }
    function setFx(v){ fx = v; fxAuto = true; if(v === 'aus' && post){ post.dispose(); post = null; } }
    function adapt(dt){
      if(qual !== 'auto') return; acc += dt; if(++cnt < 60) return;
      const fps = cnt / acc; acc = cnt = 0;
      if(fps < 27){ gut = 0; if(pr > 0.75){ pr = Math.max(0.75, pr - 0.25); renderer.setPixelRatio(pr); resize(); } else if(fxAuto && fx !== 'aus'){ fxAuto = false; } else if(renderer.shadowMap.enabled) shadows(false); }
      else if(fps > 55 && pr < Math.min(DPR, 1.5) && ++gut >= 4){ pr = Math.min(DPR, 1.5, pr + 0.25); gut = 0; renderer.setPixelRatio(pr); resize(); }
    }
    function draw(){
      if(fx === 'aus' || !fxAuto){ renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
      if(!post) post = FX.post(renderer);
      post.render(scene, camera, { dof:fx === 'hoch', focus });
    }
    // Umgebung einmal aufnehmen, damit Glas, Metall, Lack und glatte Böden spiegeln (nicht in der niedrigen Stufe)
    function spiegeln(x, y, z){ if(qual === 'niedrig' || fx === 'aus') return; try{ if(cube) cube.dispose(); cube = FX.spiegel(renderer, scene, x, y, z); renderer.setRenderTarget(null); }catch(e){ console.warn('Spiegelung nicht möglich', e); } }
    renderer.setPixelRatio(pr); sun.shadow.mapSize.set(1024, 1024);
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

    /* Steuerung: Bewegung (Stick, WASD/Pfeile, Gamepad), Kamera (Ziehen, Zoom), Aktion (E, Enter, Knopf) */
    const input = { mx:0, my:0, yaw:0.5, pitch:0.62, dist:8.5, sens:1, action:null, key:null, tap:null, frei:true };
    const regie = { intro:0, dur:3.6, fAn:false, fx:0, fz:0, f:0, shake:0, nick:0 }, look = new THREE.Vector3();
    const kurz = () => { if(regie.intro > 0.45) regie.intro = 0.45; };          // Kamerafahrt mit einer Eingabe abkürzen
    const keys = new Set();
    function kd(e){
      if(e.target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) && (e.key === ' ' || e.key === 'Enter')) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys.add(k); kurz();
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if(!e.repeat){ if((k === 'e' || k === 'Enter' || k === ' ') && input.action) input.action(); else if(input.key) input.key(k); }
    }
    function ku(e){ keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const blur = () => keys.clear(); window.addEventListener('blur', blur);

    const pts = new Map(); let pinch = 0;
    const clampP = v => Math.max(0.22, Math.min(1.35, v)), clampD = v => Math.max(4.5, Math.min(18, v));
    function pd(e){ kurz(); canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x:e.clientX, y:e.clientY, x0:e.clientX, y0:e.clientY, t:performance.now() }); pinch = 0; }
    function pm(e){
      const p = pts.get(e.pointerId); if(!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if(auf) return;                                                  // Aufsicht (Stadtmodell): Kamera steht fest
      if(pts.size === 1){ input.yaw -= dx * 0.008 * input.sens; input.pitch = clampP(input.pitch + dy * 0.005 * input.sens); }
      else if(pts.size === 2){ const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); if(pinch) input.dist = clampD(input.dist * pinch / d); pinch = d; }
    }
    // Kurzes Antippen ohne Ziehen meldet die Stelle im Bild (für das Stadtmodell)
    function pu(e){ const p = pts.get(e.pointerId); pts.delete(e.pointerId); pinch = 0; if(p && e.type === 'pointerup' && input.tap && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 10 && performance.now() - p.t < 500) input.tap(e.clientX, e.clientY); }
    function wh(e){ e.preventDefault(); input.dist = clampD(input.dist * (e.deltaY > 0 ? 1.1 : 0.9)); }
    canvas.addEventListener('pointerdown', pd); canvas.addEventListener('pointermove', pm); canvas.addEventListener('pointerup', pu); canvas.addEventListener('pointercancel', pu);
    canvas.addEventListener('wheel', wh, { passive:false });

    // Stick (Touch): Knopf folgt dem Finger, Ausschlag höchstens 44 px
    const joy = ui && ui.joy, knob = joy && joy.firstElementChild; let jid = null, jx = 0, jy = 0;
    function jset(e){
      const r = joy.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const l = Math.hypot(dx, dy), m = 44; if(l > m){ dx *= m / l; dy *= m / l; }
      jx = dx / m; jy = -dy / m; knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    }
    function jd(e){ kurz(); jid = e.pointerId; joy.setPointerCapture(jid); jset(e); e.preventDefault(); }
    function jm(e){ if(e.pointerId === jid) jset(e); }
    function ju(e){ if(e.pointerId !== jid) return; jid = null; jx = jy = 0; knob.style.transform = ''; }
    if(joy){ joy.addEventListener('pointerdown', jd); joy.addEventListener('pointermove', jm); joy.addEventListener('pointerup', ju); joy.addEventListener('pointercancel', ju); }

    // Gamepad: linker Stick läuft, rechter dreht die Kamera, A prüft, Start öffnet das Menü
    const gpWas = {};
    function gamepad(dt){
      const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null; if(!gp) return [0, 0];
      const dz = v => Math.abs(v) > 0.2 ? v : 0, ax = gp.axes;
      input.yaw -= dz(ax[2] || 0) * 2.4 * dt * input.sens; input.pitch = clampP(input.pitch + dz(ax[3] || 0) * 1.4 * dt * input.sens);
      const edge = (i, fn) => { const d = !!(gp.buttons[i] && gp.buttons[i].pressed); if(d && !gpWas[i]) fn(); gpWas[i] = d; };
      edge(0, () => input.action && input.action()); edge(9, () => input.key && input.key('Escape'));
      return [dz(ax[0] || 0), -dz(ax[1] || 0)];
    }
    function readMove(dt){
      const g = gamepad(dt); let x = jx + g[0], y = jy + g[1];
      if(keys.has('a') || keys.has('ArrowLeft')) x -= 1; if(keys.has('d') || keys.has('ArrowRight')) x += 1;
      if(keys.has('w') || keys.has('ArrowUp')) y += 1; if(keys.has('s') || keys.has('ArrowDown')) y -= 1;
      const l = Math.hypot(x, y); if(l > 1){ x /= l; y /= l; }
      if(!input.frei || regie.intro > 0.45){ x = 0; y = 0; }             // während Kamerafahrt, Auftrag oder Frage bleibt die Figur stehen
      input.mx = x; input.my = y;
    }

    /* Spielschleife: läuft nur, solange gespielt wird (nicht bei offener Frage, im Menü oder bei verdecktem Fenster) */
    let raf = 0, last = 0, update = null, paused = false, dead = false, time = 0, frames = 0, lost = false;
    // Bricht der Grafik-Kontext ab (Speicherdruck, App im Hintergrund), wird angehalten und danach weitergemacht
    const cl = e => { e.preventDefault(); lost = true; }, cr = () => { lost = false; };
    canvas.addEventListener('webglcontextlost', cl); canvas.addEventListener('webglcontextrestored', cr);
    function frame(t){
      raf = 0; if(dead) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      if(!paused && !lost && !document.hidden){
        time += dt; frames++; readMove(dt); skyMat.uniforms.uTime.value = time; if(update) update(dt, time);
        quellen.step(dt); if(regen) regen.step(dt, look.x, look.z);
        for(let i = 0; i < schilder.length; i++){ const s = schilder[i]; if(s.visible) s.material.opacity = Math.max(0, Math.min(1, (s.getWorldPosition(wp).distanceTo(camera.position) - 2.4) / 1.8)); }
        for(let i = 0; i < blinker.length; i++){ const b = blinker[i]; b.m.emissiveIntensity = ((time * 2.4 + b.v) % 1) < 0.45 ? 2.6 : 0.25; }
        draw(); adapt(dt);
      }
      else if(!lost && !document.hidden) gamepad(0);          // im Menü weiter auf Start hören
      raf = requestAnimationFrame(frame);
    }
    function start(fn){ update = fn; last = performance.now(); regie.intro = opt.anflug === false || ruhig ? 0 : regie.dur; if(!raf) raf = requestAnimationFrame(frame); }
    /* Kamera: folgt dem Ziel tgt hinter und über der Figur. Zu Beginn fliegt sie aus der Höhe heran, bei einer Aufgabe schwenkt sie
       sanft zur Station (fokus), bei richtiger Antwort nickt sie kurz, bei falscher wackelt sie. */
    let auf = null;
    function cam(tgt, dt){
      if(auf){ camera.position.set(auf.x, auf.y + auf.d * 0.86, auf.z + auf.d * 0.62); look.set(auf.x, auf.y, auf.z); camera.lookAt(look); follow(look); focus = auf.d; return; }
      dt = dt || 0.016; let yaw = input.yaw, pitch = input.pitch, d = input.dist, lx = tgt.x, ly = tgt.y, lz = tgt.z;
      if(regie.intro > 0){ regie.intro = Math.max(0, regie.intro - dt); const u = regie.intro / regie.dur, e = u * u * (3 - 2 * u); yaw += e * 1.9; d *= 1 + e * 2.6; pitch += (0.98 - pitch) * e; ly += e * 1.4; }
      regie.f += ((regie.fAn ? 1 : 0) - regie.f) * Math.min(1, dt * 3.4);
      if(regie.f > 0.002){ lx += (regie.fx - lx) * 0.5 * regie.f; lz += (regie.fz - lz) * 0.5 * regie.f; d *= 1 - 0.3 * regie.f; pitch += (0.42 - pitch) * 0.4 * regie.f; }
      if(regie.nick > 0){ regie.nick = Math.max(0, regie.nick - dt); pitch += Math.sin((0.5 - regie.nick) * Math.PI * 4) * 0.03 * (regie.nick / 0.5); }
      const cp = Math.cos(pitch);
      camera.position.set(lx + Math.sin(yaw) * cp * d, ly + Math.sin(pitch) * d, lz + Math.cos(yaw) * cp * d);
      if(regie.shake > 0){ regie.shake = Math.max(0, regie.shake - dt); const a = regie.shake * 0.45; camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a; }
      look.set(lx, ly, lz); camera.lookAt(look); follow(look); focus = d;
    }
    const fokus = (x, z) => { regie.fAn = x !== null && x !== undefined; if(regie.fAn){ regie.fx = x; regie.fz = z; } };
    // Rückmeldung in der Welt: 1 = richtig (Konfetti, Nicken), 2 = zweiter Versuch (Funken), 3 = falsch (Wackeln)
    function feier(x, y, z, tries){
      if(tries === 1){ quellen.konfetti(x, y, z); regie.nick = ruhig ? 0 : 0.5; }
      else if(tries === 2) quellen.funken(x, y, z, 22, 1, 0.8, 0.25);
      else { quellen.funken(x, y, z, 18, 1, 0.25, 0.2); regie.shake = ruhig ? 0 : 0.4; }
    }
    function pause(v){ paused = v; if(v){ keys.clear(); jx = jy = 0; if(knob) knob.style.transform = ''; } }

    function dispose(){
      dead = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur);
      canvas.removeEventListener('pointerdown', pd); canvas.removeEventListener('pointermove', pm); canvas.removeEventListener('pointerup', pu); canvas.removeEventListener('pointercancel', pu);
      canvas.removeEventListener('wheel', wh); canvas.removeEventListener('webglcontextlost', cl); canvas.removeEventListener('webglcontextrestored', cr);
      if(joy){ joy.removeEventListener('pointerdown', jd); joy.removeEventListener('pointermove', jm); joy.removeEventListener('pointerup', ju); joy.removeEventListener('pointercancel', ju); }
      scene.traverse(x => { if(x.geometry) x.geometry.dispose(); if(x.material){ if(x.material.map) x.material.map.dispose(); x.material.dispose(); } });
      if(sun.shadow.map) sun.shadow.map.dispose(); if(post) post.dispose(); if(cube) cube.dispose(); renderer.dispose();
    }
    return { scene, camera, renderer, input, start, pause, dispose, setQuality, setFx, follow, cam, fokus, feier, spiegeln, lampe, blink, quellen, licht:L,
      halt: v => { input.frei = !v; }, aufsicht: a => { auf = a || null; }, imAnflug: () => regie.intro > 0.45, frames: () => frames, pixelRatio: () => pr, effekte: () => (fx === 'aus' || !fxAuto ? 'aus' : fx) };
  }

  /* Kollision: Figur als Kreis (Radius r) gegen Quader { x1, x2, z1, z2 } */
  function blocked(x, z, r, boxes){
    for(let i = 0; i < boxes.length; i++){ const b = boxes[i]; if(x > b.x1 - r && x < b.x2 + r && z > b.z1 - r && z < b.z2 + r) return true; }
    return false;
  }

  return { create, label, css, beam, figure, blocked, arrow, sfx, audio:AUDIO, surf, mat, C, schatten:FX.bodenschatten };
})();
