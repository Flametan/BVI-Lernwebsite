/* IdF-Spiel – gemeinsame 3D-Grundlage für alle Missionen (Three.js r128):
   Bühne mit Spielschleife, Licht und Schatten, Steuerung (Stick, Tastatur, Maus, Gamepad), modellierte Spielfigur,
   Oberflächen (im Browser erzeugte Texturen), Himmel- und Leuchtsäulen-Shader, Ton und Kollision.
   Leistung: Pixel-Ratio passt sich an (0,75 bis 1,5), Schatten schalten sich bei zu niedriger Bildrate ab. */
const STAGE = (function(){
  function css(name, fb){ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; }
  const C = hex => new THREE.Color(hex).convertSRGBToLinear();      // Farben sind sRGB gemeint, gerechnet wird linear

  /* ---------- Shader: Himmel mit Sonne und ziehenden Wolken, Leuchtsäule ---------- */
  const SKY = {
    vs: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fs: 'uniform vec3 uSun; uniform float uTime; varying vec3 vD;'
      + 'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }'
      + 'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }'
      + 'float fbm(vec2 p){ float a = 0.5, s = 0.0; for(int i=0;i<4;i++){ s += a*n(p); p *= 2.03; a *= 0.5; } return s; }'
      + 'void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.0);'
      + ' vec3 col = mix(vec3(0.74,0.84,0.93), vec3(0.20,0.45,0.82), pow(y, 0.55));'
      + ' float s = max(dot(d, normalize(uSun)), 0.0); col += vec3(1.0,0.85,0.6) * (pow(s, 350.0)*1.6 + pow(s, 9.0)*0.22);'
      + ' if(d.y > 0.02){ vec2 uv = d.xz / (d.y + 0.12) * 1.4 + vec2(uTime*0.012, 0.0); float c = smoothstep(0.50, 0.78, fbm(uv)); col = mix(col, vec3(1.0), c * smoothstep(0.02, 0.22, d.y) * 0.9); }'
      + ' col = mix(vec3(0.80,0.86,0.90), col, smoothstep(-0.05, 0.12, d.y)); gl_FragColor = vec4(col, 1.0); }'
  };
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
    return g;
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
    return new THREE.MeshStandardMaterial(Object.assign({ map:t, roughness:0.92, metalness:0 }, opt || {}));
  }
  const mat = (hex, opt) => new THREE.MeshStandardMaterial(Object.assign({ color:C(hex), roughness:0.85, metalness:0 }, opt || {}));

  // Text als Schild, das immer zur Kamera zeigt
  function label(text, opt){
    opt = opt || {};
    const c = document.createElement('canvas'), F = '600 44px Roboto, system-ui, sans-serif'; let x = c.getContext('2d'); x.font = F;
    const w = Math.ceil(x.measureText(text).width) + 40; c.width = w; c.height = 68; x = c.getContext('2d');
    if(opt.bg){ x.fillStyle = opt.bg; if(x.roundRect){ x.beginPath(); x.roundRect(0, 0, w, 68, 18); x.fill(); } else x.fillRect(0, 0, w, 68); }
    x.font = F; x.fillStyle = opt.color || '#222'; x.textBaseline = 'middle'; x.fillText(text, 20, 36);
    const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, depthTest:false, transparent:true, toneMapped:false, fog:false }));
    const h = opt.h || 0.5; s.scale.set(h * w / 68, h, 1); s.renderOrder = 5;
    return s;
  }

  // Richtungspfeil am Boden (zeigt zur nächsten Aufgabe oder zur Treppe)
  function arrow(color){
    const sh = new THREE.Shape(); sh.moveTo(0, 0.55); sh.lineTo(0.3, 0); sh.lineTo(0.1, 0); sh.lineTo(0.1, -0.35); sh.lineTo(-0.1, -0.35); sh.lineTo(-0.1, 0); sh.lineTo(-0.3, 0); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.9, side:THREE.DoubleSide, depthTest:false, toneMapped:false }));
    m.rotation.x = Math.PI / 2; m.renderOrder = 4; const g = new THREE.Group(); g.add(m); return g;   // Spitze zeigt nach +z, gedreht wird um die Hochachse
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
  function figure(){
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const M = { jacke:mat('#1b2740', { roughness:0.8 }), hose:mat('#182236', { roughness:0.85 }), reflex:mat('#e8d23a', { roughness:0.4, emissive:C('#5a4f08') }), silber:mat('#d9dde2', { roughness:0.35, metalness:0.5 }),
      haut:mat('#e0b08c', { roughness:0.7 }), helm:mat('#d8e04a', { roughness:0.3 }), leder:mat('#2a2622', { roughness:0.7 }), stiefel:mat('#141414', { roughness:0.6 }), flasche:mat('#e3b81f', { roughness:0.35, metalness:0.3 }), dunkel:mat('#15171a', { roughness:0.5 }) };
    const add = (geo, m, x, y, z, parent, sx, sy, sz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if(sx) o.scale.set(sx, sy, sz); o.castShadow = true; (parent || body).add(o); return o; };
    const cyl = (rt, rb, h, s) => new THREE.CylinderGeometry(rt, rb, h, s || 14), sph = (r, w, h) => new THREE.SphereGeometry(r, w || 16, h || 12);
    // Rumpf
    add(cyl(0.2, 0.165, 0.5), M.jacke, 0, 1.3, 0, null, 1, 1, 0.68);
    add(cyl(0.17, 0.175, 0.22), M.jacke, 0, 0.99, 0, null, 1, 1, 0.72);
    add(cyl(0.178, 0.178, 0.05), M.leder, 0, 1.07, 0, null, 1, 1, 0.72); add(new THREE.BoxGeometry(0.06, 0.05, 0.02), M.silber, 0, 1.07, 0.13);
    [1.16, 1.42].forEach(y => { add(cyl(0.2, 0.196, 0.045), M.reflex, 0, y, 0, null, 1, 1, 0.7); add(cyl(0.201, 0.2, 0.014), M.silber, 0, y, 0, null, 1, 1, 0.7); });
    add(cyl(0.085, 0.105, 0.07), M.jacke, 0, 1.58, 0);                                    // Kragen
    add(sph(0.1), M.jacke, -0.24, 1.5, 0); add(sph(0.1), M.jacke, 0.24, 1.5, 0);          // Schultern
    // Kopf und Helm
    const kopf = new THREE.Group(); kopf.position.set(0, 1.71, 0); body.add(kopf);
    add(cyl(0.05, 0.055, 0.08), M.haut, 0, -0.1, 0, kopf); add(sph(0.108), M.haut, 0, 0, 0, kopf, 1, 1.12, 1);
    add(sph(0.014, 8, 6), M.dunkel, -0.04, 0.015, 0.098, kopf); add(sph(0.014, 8, 6), M.dunkel, 0.04, 0.015, 0.098, kopf);
    add(new THREE.SphereGeometry(0.142, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), M.helm, 0, 0.03, 0, kopf);
    add(new THREE.BoxGeometry(0.03, 0.05, 0.24), M.helm, 0, 0.165, 0, kopf); add(cyl(0.152, 0.158, 0.018, 18), M.helm, 0, 0.012, 0, kopf);
    add(cyl(0.146, 0.146, 0.03, 18), M.reflex, 0, 0.05, 0, kopf); add(new THREE.BoxGeometry(0.24, 0.15, 0.02), M.leder, 0, -0.07, -0.135, kopf).rotation.x = -0.25;
    add(new THREE.BoxGeometry(0.2, 0.05, 0.02), M.dunkel, 0, 0.07, 0.135, kopf).rotation.x = -0.3;   // hochgeklapptes Visier
    // Atemschutzgerät
    add(new THREE.BoxGeometry(0.26, 0.4, 0.03), M.dunkel, 0, 1.3, -0.15); add(cyl(0.075, 0.075, 0.42), M.flasche, 0, 1.3, -0.23); add(sph(0.075), M.flasche, 0, 1.51, -0.23); add(cyl(0.025, 0.025, 0.06, 8), M.silber, 0, 1.07, -0.23);
    add(new THREE.BoxGeometry(0.05, 0.42, 0.02), M.dunkel, -0.12, 1.33, 0.135); add(new THREE.BoxGeometry(0.05, 0.42, 0.02), M.dunkel, 0.12, 1.33, 0.135);
    add(new THREE.BoxGeometry(0.06, 0.1, 0.04), M.dunkel, 0.13, 1.42, 0.16);              // Funkgerät
    // Gliedmaßen: Oberteil am Gelenk, Unterteil am zweiten Gelenk
    function glied(x, y, l1, l2, r, m1, hand){
      const o = new THREE.Group(); o.position.set(x, y, 0); body.add(o);
      add(cyl(r, r * 0.9, l1), m1, 0, -l1 / 2, 0, o); add(sph(r * 0.95, 10, 8), m1, 0, -l1, 0, o);
      const u = new THREE.Group(); u.position.y = -l1; o.add(u);
      add(cyl(r * 0.9, r * 0.8, l2), m1, 0, -l2 / 2, 0, u);
      if(hand){ add(cyl(r * 0.93, r * 0.9, 0.04), M.reflex, 0, -l2 * 0.72, 0, u); add(sph(0.062, 10, 8), M.leder, 0, -l2 - 0.03, 0, u); }
      else { add(cyl(r * 0.94, r * 0.9, 0.04), M.reflex, 0, -l2 * 0.55, 0, u); add(new THREE.BoxGeometry(0.13, 0.14, 0.17), M.stiefel, 0, -l2 - 0.02, 0, u); add(new THREE.BoxGeometry(0.13, 0.08, 0.14), M.stiefel, 0, -l2 - 0.05, 0.13, u); add(new THREE.BoxGeometry(0.135, 0.025, 0.31), M.dunkel, 0, -l2 - 0.095, 0.06, u); }
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
  function create(canvas, ui){
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });   // wirft, wenn das Gerät kein WebGL kann
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 1, 0.1, 600);
    scene.fog = new THREE.Fog(C('#cfdbe6'), 70, 260);
    const sunDir = new THREE.Vector3(0.55, 0.78, 0.42).normalize();
    const skyMat = new THREE.ShaderMaterial({ vertexShader:SKY.vs, fragmentShader:SKY.fs, side:THREE.BackSide, depthWrite:false, fog:false, uniforms:{ uSun:{ value:sunDir }, uTime:{ value:0 } } });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat); sky.frustumCulled = false; scene.add(sky);
    scene.add(new THREE.HemisphereLight(C('#cfe2ff'), C('#7a6f5f'), 0.62));
    const sun = new THREE.DirectionalLight(C('#fff1d8'), 1.9); sun.castShadow = true; scene.add(sun); scene.add(sun.target);
    const sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 120; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
    // Sonne und Himmel folgen dem Blickziel, damit der Schatten dort scharf bleibt
    function follow(t){ sun.target.position.copy(t); sun.position.copy(t).addScaledVector(sunDir, 55); sky.position.copy(camera.position); }

    /* Qualität: „auto“ senkt bei schwacher Bildrate erst die Auflösung, dann die Schatten; „niedrig“ und „hoch“ sind fest */
    const DPR = window.devicePixelRatio || 1; let qual = 'auto', pr = Math.min(DPR, 1.5), acc = 0, cnt = 0, gut = 0;
    function shadows(on, size){ renderer.shadowMap.enabled = on; sun.castShadow = on; if(size && sun.shadow.mapSize.x !== size){ sun.shadow.mapSize.set(size, size); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; } } scene.traverse(o => { if(o.material) o.material.needsUpdate = true; }); }
    function resize(){ const w = canvas.clientWidth, h = canvas.clientHeight; if(!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    function setQuality(q){
      qual = q; pr = q === 'niedrig' ? Math.min(DPR, 0.75) : q === 'hoch' ? Math.min(DPR, 2) : Math.min(DPR, 1.5);
      renderer.setPixelRatio(pr); shadows(q !== 'niedrig', q === 'hoch' ? 2048 : 1024); resize();
    }
    function adapt(dt){
      if(qual !== 'auto') return; acc += dt; if(++cnt < 60) return;
      const fps = cnt / acc; acc = cnt = 0;
      if(fps < 27){ gut = 0; if(pr > 0.75){ pr = Math.max(0.75, pr - 0.25); renderer.setPixelRatio(pr); resize(); } else if(renderer.shadowMap.enabled) shadows(false); }
      else if(fps > 55 && pr < Math.min(DPR, 1.5) && ++gut >= 4){ pr = Math.min(DPR, 1.5, pr + 0.25); gut = 0; renderer.setPixelRatio(pr); resize(); }
    }
    renderer.setPixelRatio(pr); sun.shadow.mapSize.set(1024, 1024);
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

    /* Steuerung: Bewegung (Stick, WASD/Pfeile, Gamepad), Kamera (Ziehen, Zoom), Aktion (E, Enter, Knopf) */
    const input = { mx:0, my:0, yaw:0.5, pitch:0.62, dist:8.5, sens:1, action:null, key:null };
    const keys = new Set();
    function kd(e){
      if(e.target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) && (e.key === ' ' || e.key === 'Enter')) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys.add(k);
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if(!e.repeat){ if((k === 'e' || k === 'Enter' || k === ' ') && input.action) input.action(); else if(input.key) input.key(k); }
    }
    function ku(e){ keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const blur = () => keys.clear(); window.addEventListener('blur', blur);

    const pts = new Map(); let pinch = 0;
    const clampP = v => Math.max(0.22, Math.min(1.35, v)), clampD = v => Math.max(4.5, Math.min(18, v));
    function pd(e){ canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x:e.clientX, y:e.clientY }); pinch = 0; }
    function pm(e){
      const p = pts.get(e.pointerId); if(!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if(pts.size === 1){ input.yaw -= dx * 0.008 * input.sens; input.pitch = clampP(input.pitch + dy * 0.005 * input.sens); }
      else if(pts.size === 2){ const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); if(pinch) input.dist = clampD(input.dist * pinch / d); pinch = d; }
    }
    function pu(e){ pts.delete(e.pointerId); pinch = 0; }
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
    function jd(e){ jid = e.pointerId; joy.setPointerCapture(jid); jset(e); e.preventDefault(); }
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
      if(!paused && !lost && !document.hidden){ time += dt; frames++; readMove(dt); skyMat.uniforms.uTime.value = time; if(update) update(dt, time); renderer.render(scene, camera); adapt(dt); }
      else if(!lost && !document.hidden) gamepad(0);          // im Menü weiter auf Start hören
      raf = requestAnimationFrame(frame);
    }
    function start(fn){ update = fn; last = performance.now(); if(!raf) raf = requestAnimationFrame(frame); }
    function pause(v){ paused = v; if(v){ keys.clear(); jx = jy = 0; if(knob) knob.style.transform = ''; } }

    function dispose(){
      dead = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur);
      canvas.removeEventListener('pointerdown', pd); canvas.removeEventListener('pointermove', pm); canvas.removeEventListener('pointerup', pu); canvas.removeEventListener('pointercancel', pu);
      canvas.removeEventListener('wheel', wh); canvas.removeEventListener('webglcontextlost', cl); canvas.removeEventListener('webglcontextrestored', cr);
      if(joy){ joy.removeEventListener('pointerdown', jd); joy.removeEventListener('pointermove', jm); joy.removeEventListener('pointerup', ju); joy.removeEventListener('pointercancel', ju); }
      scene.traverse(x => { if(x.geometry) x.geometry.dispose(); if(x.material){ if(x.material.map) x.material.map.dispose(); x.material.dispose(); } });
      if(sun.shadow.map) sun.shadow.map.dispose(); renderer.dispose();
    }
    return { scene, camera, renderer, input, start, pause, dispose, setQuality, follow, frames: () => frames, pixelRatio: () => pr };
  }

  /* Kollision: Figur als Kreis (Radius r) gegen Quader { x1, x2, z1, z2 } */
  function blocked(x, z, r, boxes){
    for(let i = 0; i < boxes.length; i++){ const b = boxes[i]; if(x > b.x1 - r && x < b.x2 + r && z > b.z1 - r && z < b.z2 + r) return true; }
    return false;
  }

  return { create, label, css, beam, figure, blocked, arrow, sfx, audio:AUDIO, surf, mat, C };
})();
