/* ============================================================
   MEDAILLEN-MOMENT: Gold, Silber oder Bronze als 3D-Medaille (three.js)
   Wird erst beim ersten Gewinn eines Platzes 1 bis 3 geladen (js/pause.js → MEDAL.show),
   three.js (js/three.min.js) erst dann. Ohne WebGL oder bei „Bewegung reduzieren“ erscheint
   statt der 3D-Szene die flache Medaille. Die 3D-Szene läuft nur, solange das Fenster offen ist.
   ============================================================ */
const MEDAL=(function(){
  const COL={1:{a:'#fff1a8',b:'#f5b301',c:'#8a5a00',n:'Gold'},2:{a:'#ffffff',b:'#b8bfc9',c:'#555d6b',n:'Silber'},3:{a:'#ffd2a1',b:'#cd7f32',c:'#6b3410',n:'Bronze'}};
  const COUNT={1:140,2:90,3:64};
  let cur=null,jsP=null;
  const loadThree=()=>window.THREE?Promise.resolve():(jsP||(jsP=new Promise((ok,no)=>{const x=document.createElement('script');x.src='js/three.min.js';x.onload=ok;x.onerror=()=>{jsP=null;x.remove();no();};document.body.appendChild(x);})));
  const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};

  function faceTex(n,bump){
    const s=512,c=document.createElement('canvas');c.width=c.height=s;const g=c.getContext('2d'),k=COL[n];
    if(bump){g.fillStyle='#000';g.fillRect(0,0,s,s);g.strokeStyle='#888';g.lineWidth=14;g.beginPath();g.arc(s/2,s/2,196,0,7);g.stroke();g.fillStyle='#fff';g.font='800 300px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowColor='#fff';g.shadowBlur=10;g.fillText(n,s/2,s/2+14);}
    else{const r=g.createRadialGradient(s*.38,s*.34,20,s/2,s/2,s*.62);r.addColorStop(0,k.a);r.addColorStop(.55,k.b);r.addColorStop(1,k.c);g.fillStyle=r;g.fillRect(0,0,s,s);g.strokeStyle=k.c;g.globalAlpha=.55;g.lineWidth=10;g.beginPath();g.arc(s/2,s/2,196,0,7);g.stroke();g.globalAlpha=1;g.fillStyle=k.c;g.font='800 300px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(n,s/2,s/2+14);}
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
  }
  function envMap(r){
    const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);
    gr.addColorStop(0,'#cfd8ff');gr.addColorStop(.5,'#6b6258');gr.addColorStop(1,'#1a1612');g.fillStyle=gr;g.fillRect(0,0,512,256);
    g.fillStyle='#fff';g.fillRect(60,50,110,60);g.fillRect(300,40,150,40);g.fillStyle='#ffe2b0';g.fillRect(200,120,60,90);
    const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;const p=new THREE.PMREMGenerator(r),e=p.fromEquirectangular(t).texture;p.dispose();t.dispose();return e;
  }

  function close(){if(!cur)return;const c=cur;cur=null;c.stop();c.ov.classList.remove('show');setTimeout(()=>c.ov.remove(),350);document.removeEventListener('keydown',c.key,true);if(c.prev&&c.prev.isConnected)try{c.prev.focus();}catch(e){}}

  // n = 1..3, title/sub = Texte, flat = flache Medaille (SVG) für die Rückfallansicht
  function show(n,title,sub,flat){
    close();if(!COL[n])return;
    const ov=document.createElement('div');ov.className='md-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',COL[n].n+'medaille');
    ov.innerHTML='<div class="md-flat" hidden></div><div class="md-txt"><h3></h3><small></small><button class="md-x" type="button">Weiter</button></div>';
    ov.querySelector('h3').textContent=title;ov.querySelector('small').textContent=sub||'';
    const txt=ov.querySelector('.md-txt'),btn=ov.querySelector('.md-x'),fl=ov.querySelector('.md-flat');
    const c={ov,prev:document.activeElement,stop(){},key:null};cur=c;
    c.key=e=>{if(e.key==='Escape'){e.stopPropagation();close();}else if(e.key==='Tab'){e.preventDefault();btn.focus();}};
    document.addEventListener('keydown',c.key,true);
    btn.onclick=close;ov.addEventListener('click',e=>{if(e.target===ov||e.target===fl)close();});
    document.body.appendChild(ov);requestAnimationFrame(()=>{ov.classList.add('show');});btn.focus({preventScroll:true});
    const flatView=()=>{fl.innerHTML=flat||'';fl.hidden=false;fl.classList.add('md-pop');setTimeout(()=>{if(cur===c)txt.classList.add('in');},reduced()?0:500);};
    if(reduced()){flatView();return;}
    loadThree().then(()=>{if(cur!==c)return;
      const cv=document.createElement('canvas');ov.insertBefore(cv,ov.firstChild);
      let rd;try{rd=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});}catch(e){cv.remove();flatView();return;}
      run(c,n,rd,cv,txt);
    }).catch(()=>{if(cur===c)flatView();});
  }

  function run(c,n,rd,cv,txt){
    const k=COL[n],ov=c.ov;let W=ov.clientWidth||innerWidth,H=ov.clientHeight||innerHeight,pr=Math.min(devicePixelRatio||1,2);
    rd.setPixelRatio(pr);rd.setSize(W,H,false);rd.toneMapping=THREE.ACESFilmicToneMapping;rd.toneMappingExposure=1.15;
    const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,W/H,.1,60);
    const fit=()=>{const th=Math.tan(16*Math.PI/180)*(W/H);cam.position.set(0,.5,Math.max(12.5,1.95/th));cam.aspect=W/H;cam.updateProjectionMatrix();};fit();
    sc.environment=envMap(rd);
    const key=new THREE.DirectionalLight(0xffffff,1.6);key.position.set(3,4,6);sc.add(key);
    const sweep=new THREE.PointLight(0xffffff,0,9,2);sweep.position.set(-5,1,3.5);sc.add(sweep);
    const map=faceTex(n,false),bump=faceTex(n,true);
    const metal=new THREE.MeshStandardMaterial({color:k.b,metalness:1,roughness:.28}),face=new THREE.MeshStandardMaterial({map:map,bumpMap:bump,bumpScale:5,metalness:.95,roughness:.3}),rib=new THREE.MeshStandardMaterial({color:0x9b1313,roughness:.85,metalness:0,side:THREE.DoubleSide});
    const G=new THREE.Group(),coin=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,.24,96),metal);coin.rotation.x=Math.PI/2;G.add(coin);
    const fg=new THREE.CircleGeometry(1.49,96);[1,-1].forEach(d=>{const f=new THREE.Mesh(fg,face);f.position.z=.121*d;if(d<0)f.rotation.y=Math.PI;G.add(f);});
    const rimG=new THREE.TorusGeometry(1.5,.1,32,128),ringG=new THREE.TorusGeometry(.2,.06,16,40),ribG=new THREE.BoxGeometry(.62,2.3,.05);
    G.add(new THREE.Mesh(rimG,metal));const rt=new THREE.Mesh(ringG,metal);rt.position.y=1.72;G.add(rt);
    [-1,1].forEach(s=>{const m=new THREE.Mesh(ribG,rib);m.position.set(s*.5,2.85,-.05);m.rotation.z=-s*.26;G.add(m);});
    G.scale.setScalar(.0001);G.position.y=.9;sc.add(G);
    // Konfetti mit Schwerkraft und Luftwiderstand
    const N=COUNT[n],cg=new THREE.PlaneGeometry(.16,.26),cm=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),conf=new THREE.InstancedMesh(cg,cm,N),tint=[k.a,k.b,'#ffffff',k.b],P=[],dm=new THREE.Object3D();
    for(let i=0;i<N;i++){const a=Math.random()*6.28,sp=3+Math.random()*7;P.push({x:0,y:.9,z:0,vx:Math.cos(a)*sp*.8,vy:3+Math.random()*7,vz:Math.sin(a)*sp*.5,rx:Math.random()*6,ry:Math.random()*6,wx:(Math.random()-.5)*14,wy:(Math.random()-.5)*14,s:.7+Math.random()*.7});conf.setColorAt(i,new THREE.Color(tint[i%4]));}
    conf.visible=false;sc.add(conf);
    let t0=performance.now(),last=t0,mx=0,my=0,shown=false,done=false,frames=0,acc=0,raf=0;
    const onmove=e=>{const r=cv.getBoundingClientRect();mx=((e.clientX-r.left)/r.width-.5)*2;my=((e.clientY-r.top)/r.height-.5)*2;};
    cv.addEventListener('pointermove',onmove);
    const onres=()=>{W=ov.clientWidth||innerWidth;H=ov.clientHeight||innerHeight;rd.setSize(W,H,false);fit();};addEventListener('resize',onres);
    const ease=u=>1-Math.pow(1-u,4);
    function tick(now){
      if(done)return;raf=requestAnimationFrame(tick);
      const t=(now-t0)/1000,dt=Math.min((now-last)/1000,.05);last=now;
      // Rechenlast messen: ruckelt es auf schwachen Geräten, sinken Auflösung und Konfettimenge
      if(frames<40&&t>.2){frames++;acc+=dt;if(frames===40&&acc/40>.03){rd.setPixelRatio(1);rd.setSize(W,H,false);conf.count=Math.ceil(N/2);}}
      const ts=Math.max(t-.1,0),s1=ts<=0?0:1-Math.exp(-5.5*ts)*Math.cos(13*ts);G.scale.setScalar(Math.max(s1,.0001));
      const u=Math.min(Math.max((t-.1)/1.9,0),1),spin=(1-ease(u))*Math.PI*6,idle=u>=1?Math.sin((t-2)*1.1)*.18:0;
      G.rotation.y+=((spin+idle+mx*.35)-G.rotation.y)*(u<1?1:Math.min(dt*9,1));
      G.rotation.x+=((u>=1?-my*.22+Math.sin((t-2)*.9)*.06:Math.sin(t*5)*.18*(1-u))-G.rotation.x)*Math.min(dt*10,1);
      G.position.y=.9+(u>=1?Math.sin((t-2)*1.6)*.06:(1-u)*.25);
      const sw=(t-1.5)/.9;sweep.intensity=sw>0&&sw<1?Math.sin(sw*Math.PI)*60:0;sweep.position.x=-5+Math.min(Math.max(sw,0),1)*10;
      if(t>.35){conf.visible=true;const c0=t-.35,drag=Math.exp(-1.6*dt);
        for(let i=0;i<N;i++){const p=P[i];p.vy-=9*dt;p.vx*=drag;p.vz*=drag;if(p.vy<-3.2)p.vy*=Math.exp(-3*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rx+=p.wx*dt;p.ry+=p.wy*dt;
          dm.position.set(p.x,p.y,p.z);dm.rotation.set(p.rx,p.ry,0);const f=Math.min(Math.max((c0-2.8)/.8,0),1);dm.scale.setScalar(p.s*(1-f)+.0001);dm.updateMatrix();conf.setMatrixAt(i,dm.matrix);}
        conf.instanceMatrix.needsUpdate=true;}
      if(t>1.4&&!shown){shown=true;txt.classList.add('in');}
      rd.render(sc,cam);
    }
    raf=requestAnimationFrame(tick);
    c.stop=()=>{done=true;cancelAnimationFrame(raf);cv.removeEventListener('pointermove',onmove);removeEventListener('resize',onres);
      [map,bump,metal,face,rib,cm,fg,rimG,ringG,ribG,cg,coin.geometry,conf].forEach(x=>{try{x.dispose();}catch(e){}});sc.environment.dispose();rd.dispose();rd.forceContextLoss();};
  }
  return {show,close};
})();
