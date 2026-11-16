/* IdF-Spiel – gemeinsame 3D-Grundlage für alle Missionen (Three.js):
   Bühne mit Spielschleife, Steuerung (Stick, Tastatur, Kamera ziehen), Spielfigur in der dritten Person,
   Kollision gegen Quader und drei eigene Shader (Himmel, Leuchtsäule, gekachelter Boden).
   Leistung: Pixel-Ratio höchstens 1,5, keine Schatten, nur das aktuelle Geschoss wird gezeichnet. */
const STAGE = (function(){
  function css(name, fb){ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; }

  /* ---------- Shader ---------- */
  const SKY = {
    vs: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fs: 'uniform vec3 uTop; uniform vec3 uBot; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y*0.5+0.5,0.0,1.0); gl_FragColor = vec4(mix(uBot,uTop,smoothstep(0.35,0.95,h)),1.0); }'
  };
  const BEAM = {
    vs: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fs: 'uniform float uTime; uniform vec3 uColor; uniform float uPulse; varying vec2 vUv;'
      + 'void main(){ float fade = pow(1.0 - vUv.y, 1.6); float wave = 0.6 + 0.4*sin(vUv.y*16.0 - uTime*5.0);'
      + ' float a = fade * mix(0.55, wave, uPulse); gl_FragColor = vec4(uColor, a*0.85); }'
  };
  const TILE = {
    vs: 'varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fs: 'uniform vec3 uColor; uniform float uSize; varying vec2 vW;'
      + 'void main(){ vec2 c = vW / uSize; vec2 g = abs(fract(c) - 0.5); float line = smoothstep(0.46, 0.5, max(g.x, g.y));'
      + ' float chk = mod(floor(c.x) + floor(c.y), 2.0); vec3 col = uColor * (0.94 + 0.06*chk); gl_FragColor = vec4(mix(col, col*0.78, line), 1.0); }'
  };
  function sky(){
    const m = new THREE.ShaderMaterial({ vertexShader:SKY.vs, fragmentShader:SKY.fs, side:THREE.BackSide, depthWrite:false,
      uniforms:{ uTop:{ value:new THREE.Color(css('--sky-top', '#7fb2e5')) }, uBot:{ value:new THREE.Color(css('--sky-bot', '#e8eef5')) } } });
    return new THREE.Mesh(new THREE.SphereGeometry(180, 24, 12), m);
  }
  function tile(color, size){
    return new THREE.ShaderMaterial({ vertexShader:TILE.vs, fragmentShader:TILE.fs, uniforms:{ uColor:{ value:new THREE.Color(color) }, uSize:{ value:size || 1 } } });
  }
  // Leuchtsäule über einer Aufgabe: pulsiert, solange die Aufgabe offen ist
  function beam(color){
    const mat = new THREE.ShaderMaterial({ vertexShader:BEAM.vs, fragmentShader:BEAM.fs, transparent:true, depthWrite:false, side:THREE.DoubleSide,
      uniforms:{ uTime:{ value:0 }, uColor:{ value:new THREE.Color(color) }, uPulse:{ value:1 } } });
    const g = new THREE.Group();
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 3.2, 20, 1, true), mat); col.position.y = 1.6; g.add(col);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.68, 28), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.9, side:THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; g.add(ring);
    g.userData = { mat, ring };
    g.setColor = (c, pulse) => { mat.uniforms.uColor.value.set(c); mat.uniforms.uPulse.value = pulse ? 1 : 0; ring.material.color.set(c); };
    return g;
  }

  // Text als Schild, das immer zur Kamera zeigt
  function label(text, opt){
    opt = opt || {};
    const c = document.createElement('canvas'), F = '600 44px Roboto, system-ui, sans-serif'; let x = c.getContext('2d'); x.font = F;
    const w = Math.ceil(x.measureText(text).width) + 40; c.width = w; c.height = 68; x = c.getContext('2d');
    if(opt.bg){ x.fillStyle = opt.bg; if(x.roundRect){ x.beginPath(); x.roundRect(0, 0, w, 68, 18); x.fill(); } else x.fillRect(0, 0, w, 68); }
    x.font = F; x.fillStyle = opt.color || '#222'; x.textBaseline = 'middle'; x.fillText(text, 20, 36);
    const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, depthTest:false, transparent:true }));
    const h = opt.h || 0.5; s.scale.set(h * w / 68, h, 1); s.renderOrder = 5;
    return s;
  }

  /* ---------- Spielfigur: Einsatzkraft aus einfachen Formen, mit Laufbewegung ---------- */
  function figure(){
    const g = new THREE.Group(), L = c => new THREE.MeshLambertMaterial({ color:c });
    const part = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (parent || g).add(m); return m; };
    const blau = L(0x1d2a44), gelb = L(0xf2c230), haut = L(0xe2b48f), hell = L(0xe9e9e4);
    part(new THREE.BoxGeometry(0.62, 0.74, 0.36), blau, 0, 1.18, 0);                       // Jacke
    part(new THREE.BoxGeometry(0.64, 0.09, 0.38), gelb, 0, 1.02, 0);                       // Reflexstreifen
    part(new THREE.BoxGeometry(0.64, 0.09, 0.38), gelb, 0, 1.36, 0);
    part(new THREE.SphereGeometry(0.19, 14, 10), haut, 0, 1.74, 0);                        // Kopf
    part(new THREE.SphereGeometry(0.235, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hell, 0, 1.78, 0); // Helm
    part(new THREE.BoxGeometry(0.34, 0.06, 0.2), hell, 0, 1.74, -0.24);                    // Nackenschutz
    const limb = (x, y, h, mat) => { const p = new THREE.Group(); p.position.set(x, y, 0); g.add(p); part(new THREE.BoxGeometry(0.2, h, 0.22), mat, 0, -h / 2, 0, p); return p; };
    const aL = limb(-0.43, 1.52, 0.66, blau), aR = limb(0.43, 1.52, 0.66, blau), bL = limb(-0.17, 0.82, 0.82, blau), bR = limb(0.17, 0.82, 0.82, blau);
    let ph = 0;
    g.animate = (dt, speed) => {
      ph += dt * (4 + speed * 2.2);
      const a = Math.sin(ph) * Math.min(1, speed / 3) * 0.75;
      bL.rotation.x = a; bR.rotation.x = -a; aL.rotation.x = -a * 0.8; aR.rotation.x = a * 0.8;
    };
    return g;
  }

  /* ---------- Bühne ---------- */
  function create(canvas, ui){
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
    scene.add(sky());
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8f96, 0.95));
    const sun = new THREE.DirectionalLight(0xffffff, 0.6); sun.position.set(8, 16, 10); scene.add(sun);

    function resize(){ const w = canvas.clientWidth, h = canvas.clientHeight; if(!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

    /* Steuerung: Bewegung (Stick oder WASD/Pfeile), Kamera (Ziehen, Zoom), Aktion (E, Enter, Knopf) */
    const input = { mx:0, my:0, yaw:0.5, pitch:0.66, dist:8.5, action:null, key:null };
    const keys = new Set();
    function kd(e){
      if(e.target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) && e.key !== 'Escape') { if(e.key === ' ' || e.key === 'Enter') return; }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys.add(k);
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if(!e.repeat){ if((k === 'e' || k === 'Enter' || k === ' ') && input.action) input.action(); else if(input.key) input.key(k); }
    }
    function ku(e){ keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const blur = () => keys.clear(); window.addEventListener('blur', blur);

    const pts = new Map(); let pinch = 0;
    function pd(e){ canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x:e.clientX, y:e.clientY }); pinch = 0; }
    function pm(e){
      const p = pts.get(e.pointerId); if(!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if(pts.size === 1){ input.yaw -= dx * 0.008; input.pitch = Math.max(0.3, Math.min(1.35, input.pitch + dy * 0.005)); }
      else if(pts.size === 2){ const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); if(pinch) input.dist = Math.max(5, Math.min(18, input.dist * pinch / d)); pinch = d; }
    }
    function pu(e){ pts.delete(e.pointerId); pinch = 0; }
    function wh(e){ e.preventDefault(); input.dist = Math.max(5, Math.min(18, input.dist * (e.deltaY > 0 ? 1.1 : 0.9))); }
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

    function readMove(){
      let x = jx, y = jy;
      if(keys.has('a') || keys.has('ArrowLeft')) x -= 1; if(keys.has('d') || keys.has('ArrowRight')) x += 1;
      if(keys.has('w') || keys.has('ArrowUp')) y += 1; if(keys.has('s') || keys.has('ArrowDown')) y -= 1;
      const l = Math.hypot(x, y); if(l > 1){ x /= l; y /= l; }
      input.mx = x; input.my = y;
    }

    /* Spielschleife: läuft nur, solange gespielt wird (nicht bei offener Frage oder verdecktem Fenster) */
    let raf = 0, last = 0, update = null, paused = false, dead = false, time = 0, frames = 0;
    function frame(t){
      raf = 0; if(dead) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      if(!paused && !document.hidden){ time += dt; frames++; readMove(); if(update) update(dt, time); renderer.render(scene, camera); }
      raf = requestAnimationFrame(frame);
    }
    function start(fn){ update = fn; last = performance.now(); if(!raf) raf = requestAnimationFrame(frame); }
    function pause(v){ paused = v; if(v){ keys.clear(); jx = jy = 0; if(knob) knob.style.transform = ''; } }

    function dispose(){
      dead = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur);
      canvas.removeEventListener('pointerdown', pd); canvas.removeEventListener('pointermove', pm); canvas.removeEventListener('pointerup', pu); canvas.removeEventListener('pointercancel', pu);
      canvas.removeEventListener('wheel', wh);
      if(joy){ joy.removeEventListener('pointerdown', jd); joy.removeEventListener('pointermove', jm); joy.removeEventListener('pointerup', ju); joy.removeEventListener('pointercancel', ju); }
      scene.traverse(x => { if(x.geometry) x.geometry.dispose(); if(x.material){ if(x.material.map) x.material.map.dispose(); x.material.dispose(); } });
      renderer.dispose();
    }
    return { scene, camera, renderer, input, start, pause, dispose, frames: () => frames };
  }

  /* Bewegung mit Kollision: Figur als Kreis (Radius r) gegen Quader { x1, x2, z1, z2 }; x und z getrennt, damit man an Wänden entlanggleitet */
  function blocked(x, z, r, boxes){
    for(let i = 0; i < boxes.length; i++){ const b = boxes[i]; if(x > b.x1 - r && x < b.x2 + r && z > b.z1 - r && z < b.z2 + r) return true; }
    return false;
  }
  function moveCircle(pos, dx, dz, r, boxes){
    if(dx && !blocked(pos.x + dx, pos.z, r, boxes)) pos.x += dx;
    if(dz && !blocked(pos.x, pos.z + dz, r, boxes)) pos.z += dz;
  }

  return { create, label, css, tile, beam, figure, moveCircle };
})();
