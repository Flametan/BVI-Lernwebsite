/* IdF-Spiel – Effekte für alle Missionen (Three.js r128, ohne Zusatzbibliotheken):
   Nachbearbeitung (Bloom, Vignette, Tiefenunschärfe), Lichtstimmungen (Tageszeit, Wetter), Partikel (Staub, Rauch, Feuer, Konfetti, Regen),
   Spiegelungen (einmal aufgenommene Umgebung), weiche Bodenschatten, Minikarte und Sprachausgabe.
   Alles ist abschaltbar: Die Bühne (scene.js) ruft nur auf, was die gewählte Effektstufe erlaubt. */
const FX = (function(){
  const C = hex => new THREE.Color(hex).convertSRGBToLinear();

  /* ---------- Lichtstimmungen: Sonne, Himmel, Nebel, Belichtung ---------- */
  const LICHT = {
    tag:        { name:'Tag',        sun:[0.55, 0.78, 0.42],  sunCol:'#fff1d8', sunI:1.9,  hemiS:'#cfe2ff', hemiG:'#7a6f5f', hemiI:0.62, fog:'#cfdbe6', fogN:70, fogF:260, top:[0.20, 0.45, 0.82], hor:[0.74, 0.84, 0.93], wolke:[1, 1, 1],          decke:0.45, exp:0.9 },
    morgen:     { name:'Morgen',     sun:[0.80, 0.30, 0.38],  sunCol:'#ffd3a3', sunI:1.65, hemiS:'#e2e6f5', hemiG:'#8a7a6a', hemiI:0.6,  fog:'#ead9cf', fogN:38, fogF:180, top:[0.30, 0.50, 0.82], hor:[0.99, 0.80, 0.68], wolke:[1, 0.93, 0.88],    decke:0.35, exp:0.92 },
    abend:      { name:'Abend',      sun:[-0.76, 0.24, 0.46], sunCol:'#ff9c50', sunI:1.75, hemiS:'#cdb9cc', hemiG:'#6a5a4f', hemiI:0.52, fog:'#dcae90', fogN:50, fogF:220, top:[0.20, 0.28, 0.58], hor:[1.0, 0.60, 0.34],  wolke:[1, 0.76, 0.62],    decke:0.45, exp:0.95 },
    daemmerung: { name:'Dämmerung',  sun:[-0.42, 0.55, -0.6], sunCol:'#a9bdec', sunI:0.62, hemiS:'#6c80b8', hemiG:'#353a48', hemiI:0.62, fog:'#2a3550', fogN:40, fogF:200, top:[0.03, 0.05, 0.15], hor:[0.22, 0.26, 0.44], wolke:[0.30, 0.34, 0.48], decke:0.3,  exp:1.08, sterne:1, lampen:true },
    regen:      { name:'Regen',      sun:[0.30, 0.85, 0.30],  sunCol:'#d3d9e0', sunI:0.75, hemiS:'#c6ced8', hemiG:'#6c6f72', hemiI:0.88, fog:'#a9b2bc', fogN:24, fogF:140, top:[0.44, 0.49, 0.55], hor:[0.66, 0.70, 0.74], wolke:[0.60, 0.63, 0.67], decke:1,    exp:0.92, regen:true, nass:true }
  };

  const SKY = {
    vs: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fs: 'uniform vec3 uSun; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uWolke; uniform vec3 uSunCol; uniform float uDecke; uniform float uSterne; uniform float uTime; varying vec3 vD;'
      + 'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }'
      + 'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }'
      + 'float fbm(vec2 p){ float a = 0.5, s = 0.0; for(int i=0;i<4;i++){ s += a*n(p); p *= 2.03; a *= 0.5; } return s; }'
      + 'void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.0);'
      + ' vec3 col = mix(uHor, uTop, pow(y, 0.55));'
      + ' if(uSterne > 0.0){ vec2 g = d.xz / (d.y + 0.35) * 90.0; float st = step(0.9975, h(floor(g))) * smoothstep(0.05, 0.3, d.y); col += vec3(st) * uSterne * (0.6 + 0.4*sin(uTime*2.0 + h(floor(g))*40.0)); }'
      + ' float s = max(dot(d, normalize(uSun)), 0.0); col += uSunCol * (pow(s, 350.0)*1.6 + pow(s, 9.0)*0.22) * (1.0 - uDecke*uDecke);'
      + ' if(d.y > 0.02){ vec2 uv = d.xz / (d.y + 0.12) * 1.4 + vec2(uTime*0.012, 0.0); float c = smoothstep(mix(0.62, 0.18, uDecke), mix(0.86, 0.55, uDecke), fbm(uv)); col = mix(col, uWolke, c * smoothstep(0.02, 0.22, d.y) * 0.9); }'
      + ' col = mix(uHor, col, smoothstep(-0.05, 0.12, d.y)); gl_FragColor = vec4(col, 1.0); }'
  };
  function himmel(L){
    return new THREE.ShaderMaterial({ vertexShader:SKY.vs, fragmentShader:SKY.fs, side:THREE.BackSide, depthWrite:false, fog:false, uniforms:{
      uSun:{ value:new THREE.Vector3().fromArray(L.sun).normalize() }, uTop:{ value:new THREE.Vector3().fromArray(L.top) }, uHor:{ value:new THREE.Vector3().fromArray(L.hor) },
      uWolke:{ value:new THREE.Vector3().fromArray(L.wolke) }, uSunCol:{ value:new THREE.Vector3(1.0, 0.85, 0.6) }, uDecke:{ value:L.decke }, uSterne:{ value:L.sterne || 0 }, uTime:{ value:0 } } });
  }

  /* ---------- Nachbearbeitung: Szene in ein Zwischenbild, weichzeichnen (ein Viertel der Auflösung), zusammensetzen ---------- */
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  function post(renderer){
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null), qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); qs.add(quad); quad.frustumCulled = false;
    const sm = (fs, u) => new THREE.ShaderMaterial({ vertexShader:VS, fragmentShader:fs, uniforms:u, depthTest:false, depthWrite:false });
    const mDown = sm('uniform sampler2D t; uniform vec2 px; uniform float uMask; varying vec2 vUv;'
      + 'void main(){ vec4 c = (texture2D(t, vUv + px*vec2(-0.5,-0.5)) + texture2D(t, vUv + px*vec2(0.5,-0.5)) + texture2D(t, vUv + px*vec2(-0.5,0.5)) + texture2D(t, vUv + px*vec2(0.5,0.5))) * 0.25;'
      + ' if(uMask > 0.5){ float m = max(c.r, max(c.g, c.b)); c.a = smoothstep(0.9, 1.0, m); } gl_FragColor = c; }', { t:{ value:null }, px:{ value:new THREE.Vector2() }, uMask:{ value:0 } });
    const mBlur = sm('uniform sampler2D t; uniform vec2 d; varying vec2 vUv;'
      + 'void main(){ vec4 c = texture2D(t, vUv) * 0.227; c += (texture2D(t, vUv + d*1.385) + texture2D(t, vUv - d*1.385)) * 0.316; c += (texture2D(t, vUv + d*3.231) + texture2D(t, vUv - d*3.231)) * 0.0705; gl_FragColor = c; }', { t:{ value:null }, d:{ value:new THREE.Vector2() } });
    const mOut = sm('uniform sampler2D t; uniform sampler2D tb; uniform sampler2D td; uniform float uBloom; uniform float uVig; uniform float uDof; uniform float uFocus; uniform float uNear; uniform float uFar; varying vec2 vUv;'
      + 'float tiefe(vec2 uv){ float z = dot(texture2D(td, uv), vec4(1.0/16777216.0, 1.0/65536.0, 1.0/256.0, 1.0) * (255.0/256.0)); return -(uNear*uFar) / ((uFar - uNear)*z - uFar); }'
      + 'void main(){ vec3 col = texture2D(t, vUv).rgb; vec4 b = texture2D(tb, vUv);'
      + ' if(uDof > 0.0){ float k = smoothstep(uFocus*2.2, uFocus*6.0, tiefe(vUv)) * uDof; col = mix(col, b.rgb, k); }'
      + ' col += b.rgb * b.a * uBloom;'
      + ' col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.07);'
      + ' float v = length((vUv - 0.5) * vec2(1.0, 0.85)); col *= 1.0 - uVig * smoothstep(0.40, 0.95, v);'
      + ' gl_FragColor = vec4(col, 1.0); }', { t:{ value:null }, tb:{ value:null }, td:{ value:null }, uBloom:{ value:0.75 }, uVig:{ value:0.42 }, uDof:{ value:0 }, uFocus:{ value:8 }, uNear:{ value:0.1 }, uFar:{ value:600 } });
    const mDepth = new THREE.MeshDepthMaterial({ depthPacking:THREE.RGBADepthPacking });
    let W = 0, H = 0, rt = null, h1 = null, qa = null, qb = null, dep = null;
    const ziel = (w, h, opt) => { const r = new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), Object.assign({ minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, depthBuffer:false, stencilBuffer:false }, opt || {})); r.texture.generateMipmaps = false; return r; };
    function frei(){ [rt, h1, qa, qb, dep].forEach(r => r && r.dispose()); rt = h1 = qa = qb = dep = null; }
    function groesse(){
      const v = renderer.getDrawingBufferSize(new THREE.Vector2()); if(v.x === W && v.y === H && rt) return; W = v.x; H = v.y; frei();
      if(renderer.capabilities.isWebGL2){ rt = new THREE.WebGLMultisampleRenderTarget(W, H, { minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, stencilBuffer:false }); rt.samples = 4; }
      else rt = ziel(W, H, { depthBuffer:true });
      rt.texture.encoding = THREE.sRGBEncoding; rt.texture.generateMipmaps = false;
      h1 = ziel(W >> 1, H >> 1); qa = ziel(W >> 2, H >> 2); qb = ziel(W >> 2, H >> 2);
      dep = ziel(W >> 2, H >> 2, { depthBuffer:true, minFilter:THREE.NearestFilter, magFilter:THREE.NearestFilter });
    }
    function pass(m, to){ quad.material = m; renderer.setRenderTarget(to); renderer.render(qs, qc); }
    function render(scene, camera, o){
      groesse();
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      const sh = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
      if(o.dof){                                           // Tiefenbild ohne Schilder, Leuchtsäulen und Partikel (Ebene 1)
        const mask = camera.layers.mask; camera.layers.set(0); scene.overrideMaterial = mDepth;
        renderer.setRenderTarget(dep); renderer.render(scene, camera);
        scene.overrideMaterial = null; camera.layers.mask = mask;
      }
      mDown.uniforms.t.value = rt.texture; mDown.uniforms.px.value.set(1 / W, 1 / H); mDown.uniforms.uMask.value = 1; pass(mDown, h1);
      mDown.uniforms.t.value = h1.texture; mDown.uniforms.px.value.set(2 / W, 2 / H); mDown.uniforms.uMask.value = 0; pass(mDown, qa);
      for(let i = 1; i <= 2; i++){
        mBlur.uniforms.t.value = qa.texture; mBlur.uniforms.d.value.set(4 * i / W, 0); pass(mBlur, qb);
        mBlur.uniforms.t.value = qb.texture; mBlur.uniforms.d.value.set(0, 4 * i / H); pass(mBlur, qa);
      }
      const u = mOut.uniforms; u.t.value = rt.texture; u.tb.value = qa.texture; u.td.value = dep.texture; u.uDof.value = o.dof ? 0.9 : 0; u.uFocus.value = o.focus || 8; u.uNear.value = camera.near; u.uFar.value = camera.far;
      pass(mOut, null); renderer.shadowMap.autoUpdate = sh;
    }
    return { render, dispose(){ frei(); [mDown, mBlur, mOut, mDepth].forEach(m => m.dispose()); quad.geometry.dispose(); } };
  }

  /* ---------- Spiegelungen: Umgebung einmal aufnehmen und glatten Flächen mitgeben ---------- */
  function spiegel(renderer, scene, x, y, z){
    const crt = new THREE.WebGLCubeRenderTarget(128, { format:THREE.RGBAFormat, generateMipmaps:true, minFilter:THREE.LinearMipmapLinearFilter, encoding:THREE.sRGBEncoding });
    const cc = new THREE.CubeCamera(0.3, 500, crt); cc.position.set(x, y, z);
    const sh = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false; cc.update(renderer, scene); renderer.shadowMap.autoUpdate = sh;
    scene.traverse(o => {
      const m = o.material; if(!m || !m.isMeshStandardMaterial || m.envMap) return;
      const s = m.userData.spiegel || (m.metalness >= 0.25 ? 0.8 : m.roughness <= 0.45 ? 0.35 : 0); if(!s) return;
      m.envMap = crt.texture; m.envMapIntensity = s; m.needsUpdate = true;
    });
    return crt;
  }

  /* ---------- Weiche Bodenschatten (angedeutete Umgebungsverdunklung unter Möbeln und an Wänden) ---------- */
  let TB = null, TS = null;
  function schattenTex(streifen){
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    if(streifen){ const l = g.createLinearGradient(0, 0, 0, 64); l.addColorStop(0, 'rgba(0,0,0,0)'); l.addColorStop(0.5, 'rgba(0,0,0,1)'); l.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = l; g.fillRect(0, 0, 64, 64); }
    else { g.filter = 'blur(7px)'; g.fillStyle = '#000'; g.fillRect(14, 14, 36, 36); if(g.filter !== 'blur(7px)'){ g.clearRect(0, 0, 64, 64); const r = g.createRadialGradient(32, 32, 6, 32, 32, 31); r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); } }
    return new THREE.CanvasTexture(c);
  }
  // Rechteck x1..x2, z1..z2 (Grundfläche des Gegenstands); rand = wie weit der Schatten übersteht
  function bodenschatten(parent, x1, z1, x2, z2, staerke, rand, y){
    rand = rand === undefined ? 0.35 : rand; const w = x2 - x1, d = z2 - z1, lang = Math.max(w, d) > Math.min(w, d) * 6;
    const t = lang ? (TS || (TS = schattenTex(true))) : (TB || (TB = schattenTex(false)));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map:t, color:0x000000, transparent:true, opacity:staerke || 0.4, depthWrite:false, toneMapped:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 }));
    m.rotation.x = -Math.PI / 2; m.position.set((x1 + x2) / 2, y === undefined ? 0.018 : y, (z1 + z2) / 2);
    if(lang && w > d){ m.scale.set(w, d + rand * 2.4, 1); } else if(lang){ m.rotation.z = Math.PI / 2; m.scale.set(d, w + rand * 2.4, 1); } else m.scale.set((w + rand * 2) * 1.5, (d + rand * 2) * 1.5, 1);
    m.renderOrder = 1; m.userData.ao = true; parent.add(m); return m;
  }

  /* ---------- Partikel: Punkte mit eigener Größe, Farbe und Lebensdauer ---------- */
  const U_SCALE = { value:600 };                          // Punktgröße in Pixeln je Meter in einem Meter Abstand; setzt die Bühne
  const PVS = 'attribute float aSize; attribute vec4 aCol; uniform float uScale; varying vec4 vCol; void main(){ vCol = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / max(0.2, -mv.z); gl_Position = projectionMatrix * mv; }';
  const PFS = 'varying vec4 vCol; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.12, d) * vCol.a; if(a < 0.004) discard; gl_FragColor = vec4(vCol.rgb, a); }';
  function partikel(scene, max, add){
    const P = new Float32Array(max * 3), K = new Float32Array(max * 4), Z = new Float32Array(max), V = new Float32Array(max * 3), D = new Float32Array(max * 8);   // D: life, ttl, s0, s1, a, grav, drag, frei
    const geo = new THREE.BufferGeometry();
    const aP = new THREE.BufferAttribute(P, 3), aK = new THREE.BufferAttribute(K, 4), aZ = new THREE.BufferAttribute(Z, 1);
    [aP, aK, aZ].forEach(a => a.setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('position', aP); geo.setAttribute('aCol', aK); geo.setAttribute('aSize', aZ);
    const mat = new THREE.ShaderMaterial({ vertexShader:PVS, fragmentShader:PFS, uniforms:{ uScale:U_SCALE }, transparent:true, depthWrite:false, blending:add ? THREE.AdditiveBlending : THREE.NormalBlending });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.layers.set(1); pts.renderOrder = 6; scene.add(pts);
    let next = 0, alive = 0;
    function spawn(x, y, z, vx, vy, vz, ttl, s0, s1, r, g, b, a, grav, drag){
      const i = next; next = (next + 1) % max;
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; V[i * 3] = vx; V[i * 3 + 1] = vy; V[i * 3 + 2] = vz;
      K[i * 4] = r; K[i * 4 + 1] = g; K[i * 4 + 2] = b; K[i * 4 + 3] = 0;
      const j = i * 8; D[j] = 0; D[j + 1] = ttl; D[j + 2] = s0; D[j + 3] = s1; D[j + 4] = a; D[j + 5] = grav || 0; D[j + 6] = drag || 0;
    }
    function step(dt){
      alive = 0;
      for(let i = 0; i < max; i++){
        const j = i * 8, ttl = D[j + 1]; if(ttl <= 0) continue;
        const life = (D[j] += dt); if(life >= ttl){ D[j + 1] = 0; Z[i] = 0; K[i * 4 + 3] = 0; continue; }
        alive++; const k = life / ttl, dr = Math.max(0, 1 - D[j + 6] * dt);
        V[i * 3 + 1] += D[j + 5] * dt; V[i * 3] *= dr; V[i * 3 + 1] *= dr; V[i * 3 + 2] *= dr;
        P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt;
        Z[i] = D[j + 2] + (D[j + 3] - D[j + 2]) * k; K[i * 4 + 3] = D[j + 4] * Math.min(1, k * 7) * Math.min(1, (1 - k) * 2.2);
      }
      aP.needsUpdate = aK.needsUpdate = aZ.needsUpdate = true; pts.visible = alive > 0;
    }
    return { spawn, step, obj:pts, alive:() => alive };
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  // Fertige Quellen; jede liefert eine Funktion step(dt), die die Bühne in jedem Bild aufruft
  function quellen(scene){
    let hell = null, weich = null;                        // zwei gemeinsame Systeme: leuchtend (additiv) und deckend
    const H = () => hell || (hell = partikel(scene, 420, true)), Wk = () => weich || (weich = partikel(scene, 300, false));
    const list = [];
    const api = {
      step(dt){ for(let i = 0; i < list.length; i++) list[i](dt); if(hell) hell.step(dt); if(weich) weich.step(dt); },
      // Staub im Licht: wenige helle Punkte, die langsam schweben
      staub(x1, z1, x2, z2, h, n){ const p = H(); let t = 0; const neu = () => p.spawn(rnd(x1, x2), rnd(0.3, h), rnd(z1, z2), rnd(-0.05, 0.05), rnd(-0.02, 0.05), rnd(-0.05, 0.05), rnd(5, 9), 0.035, 0.05, 1, 0.95, 0.8, rnd(0.2, 0.5), 0, 0);
        for(let i = 0; i < (n || 40); i++) neu(); list.push(dt => { t += dt * (n || 40) / 7; while(t > 1){ t--; neu(); } }); },
      // Rauch: dunkle, wachsende Ballen, die aufsteigen und nach x abdriften
      rauch(x, y, z, breit, menge){ const p = Wk(); let t = 0; list.push(dt => { t += dt * (menge || 5); while(t > 1){ t--; const g = rnd(0.12, 0.26); p.spawn(x + rnd(-breit, breit), y, z + rnd(-0.3, 0.3), rnd(0.2, 0.9), rnd(1.3, 2.4), rnd(-0.2, 0.2), rnd(4, 6.5), rnd(1.2, 1.8), rnd(5, 7.5), g, g, g + 0.01, rnd(0.35, 0.55), 0, 0.12); } }); },
      // Feuer: Flammen (groß, kurz) und Funken (klein, steigen)
      feuer(x, y, z, breit){ const p = H(); let t = 0, f = 0; list.push(dt => {
        t += dt * 16; while(t > 1){ t--; p.spawn(x + rnd(-breit, breit), y + rnd(0, 0.4), z + rnd(-0.1, 0.25), rnd(-0.2, 0.2), rnd(1.4, 2.8), rnd(0, 0.3), rnd(0.45, 0.8), rnd(0.9, 1.5), 0.25, 1, rnd(0.35, 0.6), 0.08, 0.5, 0, 0.5); }
        f += dt * 7; while(f > 1){ f--; p.spawn(x + rnd(-breit, breit), y + 0.5, z + 0.2, rnd(-0.8, 0.8), rnd(2.5, 5), rnd(-0.4, 0.8), rnd(1, 2.2), 0.09, 0.03, 1, 0.7, 0.25, 0.95, -1.2, 0.3); } }); },
      // Aufgewirbelter Staub im Kreis (Rotorwind)
      wirbel(x, z, r){ const p = Wk(); let t = 0; list.push(dt => { t += dt * 14; while(t > 1){ t--; const a = rnd(0, 6.283), d = rnd(r * 0.5, r); p.spawn(x + Math.cos(a) * d, 0.15, z + Math.sin(a) * d, Math.cos(a) * 3 - Math.sin(a) * 2.5, rnd(0.2, 0.9), Math.sin(a) * 3 + Math.cos(a) * 2.5, rnd(0.9, 1.6), 0.5, 1.9, 0.72, 0.66, 0.55, 0.22, 0, 0.9); } }); },
      // Einmalige Stöße
      konfetti(x, y, z, n){ const p = Wk(), F = [[0.96, 0.62, 0.04], [0.12, 0.62, 0.33], [0.18, 0.49, 0.88], [0.9, 0.25, 0.3], [0.98, 0.85, 0.2], [0.6, 0.35, 0.8]];
        for(let i = 0; i < (n || 46); i++){ const c = F[i % F.length], a = rnd(0, 6.283), s = rnd(1.2, 3.4); p.spawn(x, y, z, Math.cos(a) * s, rnd(3, 6.2), Math.sin(a) * s, rnd(1.1, 1.9), rnd(0.1, 0.16), 0.08, c[0], c[1], c[2], 1, -9, 1.1); } },
      funken(x, y, z, n, r, g, b){ const p = H(); for(let i = 0; i < (n || 26); i++){ const a = rnd(0, 6.283), s = rnd(0.6, 2.6); p.spawn(x, y, z, Math.cos(a) * s, rnd(1, 3.6), Math.sin(a) * s, rnd(0.5, 1), 0.11, 0.02, r, g, b, 1, -5, 0.6); } }
    };
    return api;
  }
  // Regen: kurze Striche in einem Kasten, der mit der Figur mitwandert
  function regen(scene){
    const N = 520, B = 34, HH = 16, P = new Float32Array(N * 6), o = new Float32Array(N * 3);
    for(let i = 0; i < N; i++){ o[i * 3] = rnd(-B / 2, B / 2); o[i * 3 + 1] = rnd(0, HH); o[i * 3 + 2] = rnd(-B / 2, B / 2); }
    const geo = new THREE.BufferGeometry(), a = new THREE.BufferAttribute(P, 3); a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('position', a);
    const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color:0xc9d6e4, transparent:true, opacity:0.42, depthWrite:false, fog:false, toneMapped:false })); l.frustumCulled = false; l.layers.set(1); l.renderOrder = 6; scene.add(l);
    return { obj:l, step(dt, cx, cz){
      for(let i = 0; i < N; i++){ let y = o[i * 3 + 1] - 21 * dt; if(y < 0) y += HH; o[i * 3 + 1] = y; const x = cx + o[i * 3] + y * 0.08, z = cz + o[i * 3 + 2], j = i * 6; P[j] = x; P[j + 1] = y; P[j + 2] = z; P[j + 3] = x + 0.045; P[j + 4] = y + 0.55; P[j + 5] = z; }
      a.needsUpdate = true; } };
  }

  /* ---------- Minikarte: Wände, Aufgaben und die eigene Position (Norden oben) ---------- */
  function minikarte(canvas){
    const g = canvas.getContext('2d'); let key = '';
    // b = { x1, z1, x2, z2 }, boxes = Sperrflächen, punkte = [{ x, z, c }], ich = { x, z, rot }
    return function zeichne(b, boxes, punkte, ich){
      const css = getComputedStyle(canvas), fg = css.getPropertyValue('--fg').trim() || '#222', wand = css.getPropertyValue('--muted').trim() || '#777', akz = css.getPropertyValue('--accent').trim() || '#b45309';
      const bw = b.x2 - b.x1, bd = b.z2 - b.z1, Wc = 132, Hc = Math.round(Math.max(60, Math.min(132, Wc * bd / bw))), dpr = Math.min(2, window.devicePixelRatio || 1), k = Wc + 'x' + Hc;
      if(k !== key){ key = k; canvas.width = Wc * dpr; canvas.height = Hc * dpr; canvas.style.width = Wc + 'px'; canvas.style.height = Hc + 'px'; }
      const s = Math.min((Wc - 8) / bw, (Hc - 8) / bd), ox = (Wc - bw * s) / 2, oz = (Hc - bd * s) / 2, X = x => ox + (x - b.x1) * s, Z = z => oz + (z - b.z1) * s;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wc, Hc);
      g.fillStyle = wand; g.globalAlpha = 0.55;
      for(let i = 0; i < boxes.length; i++){ const q = boxes[i]; if(q.x2 < b.x1 || q.x1 > b.x2 || q.z2 < b.z1 || q.z1 > b.z2) continue; g.fillRect(X(q.x1), Z(q.z1), Math.max(1, (q.x2 - q.x1) * s), Math.max(1, (q.z2 - q.z1) * s)); }
      g.globalAlpha = 1;
      punkte.forEach(p => { g.fillStyle = p.c || akz; g.beginPath(); g.arc(X(p.x), Z(p.z), 3.4, 0, 6.3); g.fill(); });
      g.save(); g.translate(X(ich.x), Z(ich.z)); g.rotate(-ich.rot); g.fillStyle = fg; g.beginPath(); g.moveTo(0, 6); g.lineTo(4.4, -4.5); g.lineTo(0, -2); g.lineTo(-4.4, -4.5); g.closePath(); g.fill(); g.restore();
    };
  }

  /* ---------- Sprachausgabe mit der Stimme des Browsers (deutsch), abschaltbar ---------- */
  const STIMME = { on:true };
  function sprich(text){
    try{
      const sy = window.speechSynthesis; if(!sy) return; sy.cancel(); if(!STIMME.on || !text) return;
      const u = new SpeechSynthesisUtterance(String(text).replace(/[„“”"]/g, '')); u.lang = 'de-DE'; u.rate = 1.02;
      const v = sy.getVoices().find(x => /^de/i.test(x.lang)); if(v) u.voice = v;
      sy.speak(u);
    }catch(e){}
  }

  return { LICHT, himmel, post, spiegel, bodenschatten, quellen, regen, minikarte, sprich, stimme:STIMME, scale:U_SCALE, C };
})();
