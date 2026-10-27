/* ===== Brandsimulation (reine Logik) ===== */
const INF=1e9, NF=5, FH=2.4, IH=2.15;
const nid=(f,k)=>f*4+k;           // k: 0=Raum A, 1=Raum B, 2=Flur, 3=Treppenraum
const nfloor=n=>Math.floor(n/4), nkind=n=>n%4;
const sY=f=>(f-1)*FH;             // Oberkante Fussboden
const FLOORNAME=['Keller','Erdgeschoss','1. Obergeschoss','2. Obergeschoss','Dachgeschoss'];
const FLOORSHORT=['Keller','EG','1. OG','2. OG','DG'];
const ROOMS=[ // [Name, Aufenthaltsraum?]
 [['Lagerraum',0],['Abstellraum',0]],
 [['Verkaufsraum',1],['Büroraum',1]],
 [['Küche',1],['Schlafraum',1]],
 [['Wohnraum',1],['Büroraum',1]],
 [['Wohnraum',1],['Sanitärraum',0]]];
function nodeLabel(n){const f=nfloor(n),k=nkind(n);return k<2?ROOMS[f][k][0]+' ('+FLOORSHORT[f]+')':k===2?'Flur ('+FLOORSHORT[f]+')':'Treppenraum ('+FLOORSHORT[f]+')';}
function buildEdges(p){
  const E=[],m=p.fac?1.7:1,add=(a,b,fire,smoke)=>E.push({a,b,fire,smoke});
  for(let f=0;f<NF;f++){
    const A=nid(f,0),B=nid(f,1),F=nid(f,2),S=nid(f,3);
    add(A,B,p.wall?INF:8*m,p.wall?INF:3); add(B,A,p.wall?INF:8*m,p.wall?INF:3);
    [A,B].forEach(r=>{add(r,F,p.wall?INF:6*m,3);add(F,r,p.wall?INF:7*m,p.wall?INF:4);});
    add(F,S,p.door?INF:10*m,p.door?INF:3); add(S,F,p.door?INF:8*m,p.door?INF:3);
    if(f<NF-1){
      add(S,nid(f+1,3),5*m,p.rwa?4:2); add(nid(f+1,3),S,14*m,10);
      [0,1].forEach(c=>add(nid(f,c),nid(f+1,c),p.fac?INF:12,INF));
    }
  }
  return E;
}
function dijkstra(n0,E,cost){
  const d=new Array(20).fill(INF);d[n0]=0;const done=new Array(20).fill(false);
  for(let i=0;i<20;i++){let u=-1;for(let j=0;j<20;j++)if(!done[j]&&(u<0||d[j]<d[u]))u=j;if(u<0||d[u]>=INF)break;done[u]=true;
    E.forEach(e=>{if(e.a===u){const c=cost(e);if(c<INF&&d[u]+c<d[e.b])d[e.b]=d[u]+c;}});}
  return d;
}
function computeSim(origin,prot){
  const E=buildEdges(prot);
  const tf=dijkstra(origin,E,e=>e.fire), ts=dijkstra(origin,E,e=>Math.min(e.fire,e.smoke));
  return {origin,prot,tf,ts};
}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function dens(sim,n,t){ if(!sim||sim.ts[n]>=INF)return 0; const k=clamp((t-sim.ts[n])/5,0,1);
  return k*((nkind(n)===3&&sim.prot.rwa)?0.35:1); }
function fint(sim,n,t){ if(!sim||sim.tf[n]>=INF)return 0; return clamp((t-sim.tf[n])/4,0,1); }
/* Ereignisse fuer die Anzeige (bis Minute t) */
function simEvents(sim,t){
  const ev=[],o=sim.origin,of=nfloor(o),p=sim.prot;
  ev.push({t:0,c:'r',x:'Minute 0: Brand im Raum '+nodeLabel(o)});
  const seenFloor={[of]:1};
  const order=[...Array(20).keys()].filter(n=>n!==o&&sim.tf[n]<INF).sort((a,b)=>sim.tf[a]-sim.tf[b]);
  order.forEach(n=>{const f=nfloor(n),k=nkind(n),m=Math.round(sim.tf[n]);
    if(f!==of&&!seenFloor[f]){seenFloor[f]=1;ev.push({t:sim.tf[n],c:'r',x:'Minute '+m+': Feuer greift auf Geschoss '+FLOORSHORT[f]+' über'});}
    else if(k===3&&f===of&&!seenFloor.S){seenFloor.S=1;ev.push({t:sim.tf[n],c:'r',x:'Minute '+m+': Feuer im Treppenraum'});}
    else if(k<2&&f===of&&!seenFloor.N){seenFloor.N=1;ev.push({t:sim.tf[n],c:'r',x:'Minute '+m+': Feuer im Nachbarraum'});}
  });
  const flo=nid(of,2),st=nid(of,3);
  if(sim.ts[flo]<INF)ev.push({t:sim.ts[flo],c:'o',x:'Minute '+Math.round(sim.ts[flo])+': Rauch im Flur'});
  if(p.door&&sim.ts[flo]<INF)ev.push({t:sim.ts[flo]+1,c:'g',x:'Rauchdichte Tür hält: Treppenraum bleibt rauchfrei'});
  else if(sim.ts[st]<INF)ev.push({t:sim.ts[st],c:'r',x:'Minute '+Math.round(sim.ts[st])+': Rauch im Treppenraum'+(p.rwa?' (Rauchabzug hält ihn dünn)':'')});
  const nb=nid(of,nkind(o)===0?1:0);
  if(p.wall)ev.push({t:1,c:'g',x:'Feuerbeständige Trennwand hält: Feuer bleibt im Brandraum'});
  if(p.fac&&nfloor(o)<NF-1)ev.push({t:1,c:'g',x:'Nichtbrennbare Fassade: kein Feuer nach oben außen'});
  return ev.filter(e=>e.t<=t+0.001).sort((a,b)=>a.t-b.t);
}
function simStatus(sim,t){
  let burn=0,smoke=0;for(let n=0;n<20;n++){if(fint(sim,n,t)>0.05)burn++;if(dens(sim,n,t)>0.15)smoke++;}
  let stairSmoke=0;for(let f=0;f<NF;f++)stairSmoke=Math.max(stairSmoke,dens(sim,nid(f,3),t));
  const fl=new Set();for(let n=0;n<20;n++)if(fint(sim,n,t)>0.05)fl.add(nfloor(n));
  const maxT=Math.max.apply(null,sim.tf.filter(x=>x<INF)), more=sim.tf.filter(x=>x<INF).length;
  return {burn,smoke,stairSmoke,floors:fl.size,finite:more,maxT,done:t>=maxT+4};
}
/* ===== three.js-Szene ===== */
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const HOTPOS=[V3(0.1,sY(3)+1.05,-2.7),V3(-2.2,sY(2)+2.3,0.6),V3(3.0,sY(2)+0.4,1.9),V3(8.0,2.6,8.0)];
const HOTCAM=[
  {tx:0.1,ty:sY(3)+1.0,tz:-1.5,zoom:0.78,theta:-0.35,phi:1.5},
  {tx:-1.0,ty:sY(2)+1.1,tz:0.6,zoom:0.7,theta:-0.7,phi:1.45},
  {tx:1.5,ty:4.4,tz:0,zoom:0.95,theta:-0.45,phi:1.4},
  {tx:2.5,ty:1.8,tz:4.0,zoom:0.9,theta:-0.55,phi:1.38}];
const HOME={tx:0,ty:4.4,tz:0,zoom:1,theta:-0.5,phi:1.4};
const NODEVOL=n=>{const f=nfloor(n),k=nkind(n),y=sY(f);
  const c=[[-4.35,-1.3,4.3,3.8],[0.1,-1.3,4.6,3.8],[-2.05,1.9,8.9,2.6],[4.45,0,4.1,6.4]][k];
  return {cx:c[0],cz:c[1],sx:c[2],sz:c[3],y0:y,h:IH};};
/* Fluchtweg als Punktliste [x,y,z,Knoten] */
function routeFor(n){
  const f=nfloor(n),k=nkind(n),v=NODEVOL(n),P=[];
  const doorX=k===0?-4.3:0.1;
  P.push([v.cx,sY(f),v.cz+0.4,n],[doorX,sY(f),0.5,n],[doorX,sY(f),1.7,nid(f,2)],[1.6,sY(f),1.9,nid(f,2)],[2.8,sY(f),1.9,nid(f,3)]);
  for(let g=f;g>=1;g--){const s=sY(g);
    P.push([3.3,s,1.9,nid(g,3)],[5.7,s-1.2,1.9,nid(g,3)],[5.8,s-1.2,0,nid(g,3)],[5.7,s-1.2,-1.8,nid(g,3)],[3.3,s-2.4,-1.8,nid(g-1,3)],[2.8,s-2.4,-1.8,nid(g-1,3)]);
    if(g>1)P.push([2.8,s-2.4,1.9,nid(g-1,3)]);}
  P.push([2.9,0,1.9,nid(1,3)],[2.9,0,3.8,nid(1,3)],[2.9,0,6.4,-1]);
  return P;
}
function createScene(canvas,host,cb){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const bgCol=()=>{try{return new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#0d1522');}catch(e){return new THREE.Color(0x0d1522);}};const scene=new THREE.Scene();scene.background=bgCol();scene.fog=new THREE.Fog(bgCol(),50,110);window.addEventListener('embtheme',()=>{const c=bgCol();scene.background=c;scene.fog.color.copy(c);try{S.dirty=true;}catch(e){}});
  const camera=new THREE.PerspectiveCamera(38,1,0.1,250);
  scene.add(new THREE.HemisphereLight(0xcfdcff,0x3a2c22,1.0));
  const sun=new THREE.DirectionalLight(0xfff0dc,0.75);sun.position.set(-10,18,16);scene.add(sun);
  const fireLight=new THREE.PointLight(0xff6a1a,0,14,1.6);scene.add(fireLight);
  const mats={};const M=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
  const B=(w,h,l,x,y,z,mat,par)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),mat);m.position.set(x,y,z);(par||scene).add(m);return m;};
  const bld=new THREE.Group();scene.add(bld);
  /* ---------- Umgebung ---------- */
  const soil=M(0x5b4636),grass=M(0x2d5a3d),road=M(0x2b3340);
  [[-45.5,-39,39,45.5-6.5,-45,3.3],[6.5,-39,39,45,-45,3.3]].forEach(()=>{});
  const L=B(39,2.65,48.3,-26,-1.325,-20.85+0,soil);       // links
  const R=B(39,2.65,48.3,26,-1.325,-20.85,soil);          // rechts
  const BK=B(13,2.65,42,0,-1.325,-24.2,soil);              // hinten
  B(39,0.06,48.3,-26,0.02,-20.85,grass);B(39,0.06,48.3,26,0.02,-20.85,grass);B(13,0.06,42,0,0.02,-24.2,grass);
  B(120,0.2,60,0,-0.1,38,grass);   // Rasen vorn
  B(120,0.05,5,0,0.03,12,road);
  for(let i=-5;i<6;i++)B(1.4,0.02,0.18,i*5,0.07,12,M(0xdcdcdc));
  /* ---------- Gebaeude ---------- */
  const floorMat=M(0xe7dfcf),ceilMat=M(0xd9d2c3),wallMat=M(0xd5dbe5),glassMat=new THREE.MeshBasicMaterial({color:0x7fb6e8});
  const frameMat=M(0x9aa6b8);
  const fade=[];   // Waende, die bei Blick von aussen verblassen
  const mkFade=(c)=>{const m=M(c,{transparent:true});return m;};
  const sideMat=mkFade(0xdfe6ee), backMat=mkFade(0xdfe6ee), rightMat=mkFade(0xdfe6ee);
  const clad=M(0xc98a4b,{transparent:true});   // Fassade: brennbar / nichtbrennbar
  const cladL=[],cladB=[];
  const facadeMats=[];
  const wallsReg=[],floorTints=[];
  const stairSlabMat=M(0xc7c0b0);
  for(let f=0;f<NF;f++){
    const y=sY(f);
    // Decke/Boden
    if(f===0){B(13.4,0.25,6.5,0,y-0.125,0,floorMat);}
    else{ B(9.7,0.25,6.5,-1.65,y-0.125,0,floorMat); B(0.8,0.25,6.5,2.8,y-0.125,0,floorMat); B(0.8,0.25,6.5,6.1,y-0.125,0,floorMat); }
    // Fassadenstuecke aussen (links + hinten) je Geschoss
    const cl=B(0.18,IH,6.5,-6.74,y+IH/2,0,clad);cladL.push(cl);
    const cb=B(13.4,IH,0.18,0,y+IH/2,-3.4,clad);cladB.push(cb);
    // Waende links (mit Fenstern)
    const lw=B(0.2,IH,6.5,-6.6,y+IH/2,0,sideMat);
    const bw=B(13.2,IH,0.2,0,y+IH/2,-3.3,backMat);
    const rw=B(0.2,IH,6.4,6.6,y+IH/2,0,rightMat);
    if(f>0){
      B(0.06,1.1,1.8,-6.47,y+1.2,-1.3,glassMat);B(0.06,1.1,1.5,-6.47,y+1.2,1.9,glassMat);
      B(1.8,1.1,0.06,-4.35,y+1.2,-3.17,glassMat);B(1.8,1.1,0.06,0.1,y+1.2,-3.17,glassMat);B(0.9,0.9,0.06,4.45,y+1.3,-3.17,glassMat);
    }
    // Raumtrennung A|B (Trennwand/Brandwand)
    const tw=B(0.2,IH,6.4,-2.2,y+IH/2,-0.0,M(0xd5dbe5));
    wallsReg.push({m:tw,kind:'trenn',a:nid(f,0),b:nid(f,1),f,sx:1});
    // Waende Raum|Flur (halbtransparent, mit Tueren)
    const partMat=M(0xaebbd0,{transparent:true,opacity:0.30,depthWrite:false});
    const mkPart=(x0,x1)=>{const w=B(x1-x0,IH,0.1,(x0+x1)/2,y+IH/2,0.6,partMat);return w;};
    mkPart(-6.5,-4.85);mkPart(-3.75,-2.2);mkPart(-2.2,-0.4);mkPart(0.6,2.4);
    const pm={m:partMat,kind:'part',a:nid(f,0),b:nid(f,2),b2:nid(f,1)};wallsReg.push(pm);
    [-4.3,0.1].forEach(dx=>{B(1.2,0.1,0.14,dx,y+2.0,0.6,frameMat);B(0.1,2.0,0.14,dx-0.55,y+1.0,0.6,frameMat);B(0.1,2.0,0.14,dx+0.55,y+1.0,0.6,frameMat);
      const dl=B(0.08,1.95,0.9,dx+0.5,y+0.97,0.98,M(0x8a6a4a));dl.rotation.y=0; dl.position.set(dx+0.5,y+0.97,1.0);});
    // Treppenraum-Wand mit Tuer
    const sw=new THREE.Group();bld.add(sw);
    B(0.18,IH,3.8,2.4,y+IH/2,-1.3,M(0xc2cbd9),sw);B(0.18,0.35,1.5,2.4,y+IH-0.17,1.9,M(0xc2cbd9),sw);B(0.18,IH,0.55,2.4,y+IH/2,2.93,M(0xc2cbd9),sw);B(0.18,IH,0.35,2.4,y+IH/2,1.0,M(0xc2cbd9),sw);
    B(0.2,0.1,1.2,2.4,y+1.95,1.9,frameMat);
    const doorMat=M(0x9b6a3c,{emissive:0x000000});
    const dg=new THREE.BoxGeometry(0.08,1.9,1.05);dg.translate(0,0,0.525);const door=new THREE.Mesh(dg,doorMat);door.position.set(2.4,y+0.95,1.375);bld.add(door);
    wallsReg.push({m:doorMat,kind:'door',a:nid(f,2),b:nid(f,3),f,door});
    // Treppe
    if(f>=1){const s=y;
      const slab=(p0,p1,w,z)=>{const dx=p1[0]-p0[0],dy=p1[1]-p0[1],len=Math.hypot(dx,dy);const m=new THREE.Mesh(new THREE.BoxGeometry(len,0.14,w),stairSlabMat);
        m.position.set((p0[0]+p1[0])/2,(p0[1]+p1[1])/2-0.07,z);m.rotation.z=Math.atan2(dy,dx);bld.add(m);
        for(let i=1;i<7;i++){const t=i/7;B(0.05,0.03,w,p0[0]+dx*t,p0[1]+dy*t+0.0,z,M(0x8f8a7e),bld);}};
      slab([3.2,s],[5.6,s-1.2],1.5,1.9);slab([5.6,s-1.2],[3.2,s-2.4],1.5,-1.8);
      B(1.2,0.14,6.2,5.9,s-1.27,0,stairSlabMat,bld);
      B(0.7,0.14,6.2,2.75,s-0.07-0,0,stairSlabMat,bld);   // Podest am Geschoss
    }
    // Bodenmarkierung Aufenthaltsraum (Tint)
    [0,1].forEach(k=>{const v=NODEVOL(nid(f,k));const t=new THREE.Mesh(new THREE.PlaneGeometry(v.sx-0.2,v.sz-0.2),new THREE.MeshBasicMaterial({color:ROOMS[f][k][1]?0x2e9a52:0x7d8794,transparent:true,opacity:0.5,depthWrite:false}));
      t.rotation.x=-Math.PI/2;t.position.set(v.cx,y+0.03,v.cz);t.visible=false;bld.add(t);floorTints.push(t);});
    // Labels
    const lab=(txt,x,yy,z,col,sc)=>{const s=labelSprite(txt,col);s.position.set(x,yy,z);if(sc)s.scale.multiplyScalar(sc);bld.add(s);return s;};
    [0,1].forEach(k=>{const v=NODEVOL(nid(f,k));const sp=lab(ROOMS[f][k][0],v.cx,y+0.55,v.cz+0.9,ROOMS[f][k][1]?'#3fb36a':'#8d98a8');sp.userData.room=1;sp.userData.k=ROOMS[f][k][1];});
    lab('Flur',-2.05,y+0.5,2.0,'#8d98a8',0.8);if(f===1)lab('Treppenraum',4.5,y+1.9,2.4,'#8d98a8',0.85);
    // Geschossname
    const fl=labelSprite(FLOORSHORT[f],'#ffa412');fl.position.set(-8.2,y+1.2,2.0);fl.scale.multiplyScalar(0.9);bld.add(fl);
  }
  // Keller: Stein-Decke zu Boden Keller
  // Dach
  const topY=sY(4)+IH;
  B(13.4,0.25,6.5,0,topY+0.125,0,floorMat);   // Decke DG (fuer Treppe offen? Dach darueber)
  const roofMat=M(0xb5543a);const rp=(sx)=>{const len=Math.hypot(6.9,2.3);const m=B(len,0.22,7.2,sx*3.4,topY+0.25+1.15,0,roofMat);m.rotation.z=-sx*Math.atan2(2.3,6.9);return m;};
  rp(1);rp(-1);
  const gs=new THREE.Shape();gs.moveTo(-6.9,0);gs.lineTo(6.9,0);gs.lineTo(0,2.3);gs.lineTo(-6.9,0);
  const gable=new THREE.Mesh(new THREE.ExtrudeGeometry(gs,{depth:0.2,bevelEnabled:false}),M(0xdfe6ee));gable.position.set(0,topY+0.25,-3.4);bld.add(gable);
  // Rauchabzug
  const rwaPivot=new THREE.Group();rwaPivot.position.set(3.4,topY+0.25+1.15+0.15+0.05,0);rwaPivot.rotation.z=-Math.atan2(2.3,6.9)*0+0;bld.add(rwaPivot);
  const rwaLid=B(1.3,0.1,1.3,0.65,0.05,0,M(0x2d86d6),rwaPivot);rwaLid.position.x=0.65;
  rwaPivot.position.set(3.0,topY+0.25+2.3*(1-3.0/6.9)+0.14,0);
  const rwaBase=B(1.4,0.18,1.5,3.7,topY+0.25+2.3*(1-3.7/6.9)+0.06,0,M(0x555e6e));rwaBase.rotation.z=-Math.atan2(2.3,6.9);
  // Zufahrt/Ausgang
  const exitFrame=M(0x27c26a);
  B(0.12,2.1,0.12,2.5,1.05,3.3,exitFrame);B(0.12,2.1,0.12,3.5,1.05,3.3,exitFrame);B(1.1,0.12,0.12,3.0,2.1,3.3,exitFrame);
  const ex=labelSprite('Ausgang','#27c26a');ex.position.set(3.0,2.65,3.4);ex.scale.multiplyScalar(0.9);bld.add(ex);
  const assembly=new THREE.Mesh(new THREE.CircleGeometry(1.5,24),new THREE.MeshBasicMaterial({color:0x27c26a,transparent:true,opacity:0.45}));assembly.rotation.x=-Math.PI/2;assembly.position.set(2.9,0.06,6.6);scene.add(assembly);
  const asl=labelSprite('Sammelplatz','#27c26a');asl.position.set(2.9,1.3,6.6);asl.scale.multiplyScalar(0.9);scene.add(asl);
  // Baeume
  [[-11,-1],[12,-5],[-13,8],[15,3]].forEach(p=>{B(0.3,1.1,0.3,p[0],0.55,p[1],M(0x6b4a2f));const c=new THREE.Mesh(new THREE.ConeGeometry(1.3,3,6),M(0x2f7a4a));c.position.set(p[0],2.5,p[1]);scene.add(c);});
  // Feuerwehr: Aufstellflaeche, Fahrzeug, Hydrant
  const area=new THREE.Mesh(new THREE.PlaneGeometry(9,4),new THREE.MeshBasicMaterial({color:0xf2c230,transparent:true,opacity:0.28}));area.rotation.x=-Math.PI/2;area.position.set(8,0.05,8);scene.add(area);
  const truck=new THREE.Group();truck.position.set(8,0,8.2);truck.rotation.y=-0.12;scene.add(truck);
  const red=M(0xd1332b);
  B(4.4,1.3,1.8,0.2,1.0,0,red,truck);B(1.5,1.2,1.8,-2.4,0.95,0,red,truck);B(0.1,0.5,1.5,-3.17,1.25,0,new THREE.MeshBasicMaterial({color:0x9ed0ff}),truck);
  B(4.4,0.14,1.82,0.2,1.0,0,M(0xf2f2f2),truck);B(3.6,0.14,0.5,0.4,1.8,0,M(0xaab2bd),truck);
  [[-2.4,0.8],[-2.4,-0.8],[1.5,0.8],[1.5,-0.8]].forEach(w=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.3,10),M(0x1b1f27));c.rotation.x=Math.PI/2;c.position.set(w[0],0.42,w[1]);truck.add(c);});
  const beacon=B(0.4,0.2,0.5,-2.4,1.65,0,new THREE.MeshBasicMaterial({color:0x3aa0ff}),truck);
  const hyd=new THREE.Group();hyd.position.set(-8.8,0,5.6);scene.add(hyd);
  const hc=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,0.9,8),red);hc.position.y=0.45;hyd.add(hc);
  const hh=new THREE.Mesh(new THREE.SphereGeometry(0.26,8,6),red);hh.position.y=0.95;hyd.add(hh);
  const hl=labelSprite('Hydrant','#d1332b');hl.position.set(-8.8,1.9,5.6);hl.scale.multiplyScalar(0.75);scene.add(hl);
  const tl=labelSprite('Feuerwehrzufahrt','#f2c230');tl.position.set(8,3.1,8.2);tl.scale.multiplyScalar(1.0);scene.add(tl);
  /* ---------- Hotspot-Dekor ---------- */
  const deco=[new THREE.Group(),new THREE.Group(),new THREE.Group(),new THREE.Group()];deco.forEach(d=>{d.visible=false;scene.add(d);});
  // 0 Steckdose / Zuendquelle (Mehrfachstecker immer da)
  const sy3=sY(3);
  B(1.4,0.16,0.24,0.1,sy3+0.4,-3.0,M(0x30363f));B(0.16,0.16,0.14,-0.35,sy3+0.4,-2.9,M(0xffffff));B(0.16,0.16,0.14,0.45,sy3+0.4,-2.9,M(0xffffff));B(0.3,0.3,0.06,0.1,sy3+0.6,-3.17,M(0xf2efe6));
  const spark=new THREE.Mesh(new THREE.OctahedronGeometry(0.22,0),new THREE.MeshBasicMaterial({color:0xffd23f}));spark.position.set(0.1,sy3+0.78,-2.9);deco[0].add(spark);
  const sparkGlow=new THREE.Mesh(new THREE.SphereGeometry(1.2,12,8),new THREE.MeshBasicMaterial({color:0xff7a1a,transparent:true,opacity:0.3,blending:THREE.AdditiveBlending,depthWrite:false}));sparkGlow.position.copy(spark.position);deco[0].add(sparkGlow);
  const sparkLabel=labelSprite('Zündquelle','#ffd23f');sparkLabel.position.set(0.1,sy3+1.75,-2.5);deco[0].add(sparkLabel);
  // 1 Schutz-Schild Trennwand + Tuer
  const shMat=new THREE.MeshBasicMaterial({color:0x35d07f,transparent:true,opacity:0.3,depthWrite:false,blending:THREE.AdditiveBlending});
  const sh1=new THREE.Mesh(new THREE.BoxGeometry(0.6,IH+0.1,6.5),shMat);sh1.position.set(-2.2,sY(2)+IH/2,0);deco[1].add(sh1);
  const sh2=new THREE.Mesh(new THREE.BoxGeometry(0.6,2.2,1.4),shMat);sh2.position.set(2.4,sY(2)+1.1,1.9);deco[1].add(sh2);
  const l1=labelSprite('Trennwand','#35d07f');l1.position.set(-2.2,sY(2)+2.6,2.3);deco[1].add(l1);
  const l2=labelSprite('rauchdichte Tür','#35d07f');l2.position.set(2.4,sY(2)+2.75,2.5);deco[1].add(l2);
  // 2 Rettungsweg: Tube + Pfeil am Fenster
  const rP=routeFor(nid(4,0));const rCurve=new THREE.CurvePath();for(let i=0;i<rP.length-1;i++)rCurve.add(new THREE.LineCurve3(V3(rP[i][0],rP[i][1]+0.25,rP[i][2]),V3(rP[i+1][0],rP[i+1][1]+0.25,rP[i+1][2])));
  const rdots=[];const dotM=new THREE.MeshBasicMaterial({color:0x35d07f});for(let i=0;i<26;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(0.11,6,5),dotM);deco[2].add(d);rdots.push(d);}
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(0.35,0.9,6),new THREE.MeshBasicMaterial({color:0x35d07f}));arrow.rotation.z=Math.PI/2;arrow.position.set(-7.6,sY(4)+1.25,-1.3);deco[2].add(arrow);
  const rl=labelSprite('Rettungsweg: Treppenraum','#35d07f');rl.position.set(4.3,sY(4)+2.9,2.4);deco[2].add(rl);
  const rl2=labelSprite('Fenster: zweiter Rettungsweg','#35d07f');rl2.position.set(-8.4,sY(4)+2.3,-1.3);deco[2].add(rl2);
  // 3 Wasserstrahl + Schlauch
  const hose=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-8.6,0.15,5.6),V3(-4,0.15,7.5),V3(2,0.15,7.2),V3(6,0.15,8.2)]),24,0.1,5),M(0xf2c230));deco[3].add(hose);
  const wdots=[];const wM=new THREE.MeshBasicMaterial({color:0x6cc3ff});for(let i=0;i<18;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(0.13,6,5),wM);deco[3].add(d);wdots.push(d);}
  const wCurve=new THREE.QuadraticBezierCurve3(V3(6.2,2.1,7.6),V3(2,7,6),V3(-4.4,sY(2)+1.2,3.4));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.8,0.07,6,36),new THREE.MeshBasicMaterial({color:0xf2c230}));ring.rotation.x=Math.PI/2;ring.position.set(8,0.1,8.2);deco[3].add(ring);
  /* ---------- Feuer & Rauch pro Knoten ---------- */
  const flameO=new THREE.MeshBasicMaterial({color:0xff6a14}),flameY=new THREE.MeshBasicMaterial({color:0xffd23f});
  const flameGeo=new THREE.ConeGeometry(0.28,1,5);
  const nodes=[];
  const smokeBase=new THREE.Color(0x474c56);
  for(let n=0;n<20;n++){
    const v=NODEVOL(n),k=nkind(n),g=new THREE.Group();g.position.set(v.cx,v.y0,v.cz);scene.add(g);
    const cones=[];const cnt=k<2?6:k===2?5:3;
    for(let i=0;i<cnt;i++){const big=i%2===0;const c=new THREE.Mesh(flameGeo,big?flameO:flameY);
      const rx=(k===2?v.sx*0.35:k===3?1.1:v.sx*0.28),rz=(k===2?0.5:k===3?1.4:v.sz*0.25);
      c.userData={px:(Math.random()*2-1)*rx,pz:(Math.random()*2-1)*rz,ph:Math.random()*6,sc:big?1:0.65};c.position.set(c.userData.px,0,c.userData.pz);g.add(c);cones.push(c);}
    const glow=new THREE.Mesh(new THREE.SphereGeometry(k<2?1.7:k===2?1.4:1.2,12,8),new THREE.MeshBasicMaterial({color:0xff5a10,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.y=0.9;g.add(glow);
    const smat=new THREE.MeshLambertMaterial({color:0x474c56,transparent:true,opacity:0,depthWrite:false});
    const sbox=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),smat);sbox.visible=false;scene.add(sbox);
    const pmat=new THREE.MeshLambertMaterial({color:0x5b606a,transparent:true,opacity:0.4,depthWrite:false});
    const puffs=[];for(let i=0;i<(k===3?3:5);i++){const p=new THREE.Mesh(new THREE.IcosahedronGeometry(0.5,0),pmat);p.userData={ph:Math.random(),px:(Math.random()*2-1)*v.sx*0.3,pz:(Math.random()*2-1)*v.sz*0.3};p.visible=false;scene.add(p);puffs.push(p);}
    nodes.push({n,v,g,cones,glow,smat,sbox,puffs});
  }
  // Fensterflammen aussen (links, Spalte A) 
  const winFlames=[];for(let f=1;f<NF;f++){const cs=[];for(let i=0;i<3;i++){const c=new THREE.Mesh(flameGeo,i===1?flameY:flameO);c.visible=false;c.userData.ph=Math.random()*6;c.position.set(-7.1,sY(f)+1.0+ (i-1)*0.0,-1.3+(i-1)*0.45);scene.add(c);cs.push(c);}winFlames.push(cs);}
  /* ---------- Raum-Picking ---------- */
  const picks=[];const pickMat=new THREE.MeshBasicMaterial({visible:false});
  for(let n=0;n<20;n++)if(nkind(n)<2){const v=NODEVOL(n);const pm=new THREE.Mesh(new THREE.BoxGeometry(v.sx-0.1,v.h,v.sz-0.1),pickMat);pm.position.set(v.cx,v.y0+v.h/2,v.cz);pm.userData.node=n;scene.add(pm);picks.push(pm);}
  /* ---------- Figuren ---------- */
  const PEOPLE=[{name:'Mia',node:nid(3,0),col:0xffc93c,spd:1},{name:'Jonas',node:nid(3,1),col:0x5db7ff,spd:1},{name:'Lena',node:nid(2,1),col:0xff7fb0,spd:1},{name:'Opa Karl',node:nid(4,0),col:0xb58cff,spd:0.7}];
  const persons=PEOPLE.map((d,i)=>{const g=new THREE.Group();const mat=M(d.col);
    const bd=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.22,0.6,8),mat);bd.position.y=0.38;g.add(bd);
    const t=new THREE.Mesh(new THREE.SphereGeometry(0.21,8,6),mat);t.position.y=0.68;g.add(t);const b2=new THREE.Mesh(new THREE.SphereGeometry(0.22,8,6),mat);b2.position.y=0.1;g.add(b2);
    const hd=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,6),M(0xf2d3b3));hd.position.y=0.98;g.add(hd);
    const v=NODEVOL(d.node);const sx=v.cx+(i%2?0.7:-0.6),sz=v.cz-0.2+(i>1?0.4:0);g.position.set(sx,sY(nfloor(d.node)),sz);g.scale.setScalar(1.35);g.visible=false;scene.add(g);
    const ring=new THREE.Mesh(new THREE.RingGeometry(0.35,0.5,20),new THREE.MeshBasicMaterial({color:d.col,transparent:true,opacity:0.8,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=0.04;g.add(ring);
    return {def:d,g,mat,ring,home:V3(sx,sY(nfloor(d.node)),sz),state:'wait',path:null,seg:0,pos:0,t0:0,tEnd:0,cause:null,at:-1};});
  const routeGroup=new THREE.Group();scene.add(routeGroup);
  function showRoute(i){ while(routeGroup.children.length)routeGroup.remove(routeGroup.children[0]);
    if(i==null||i<0)return; const P=routeFor(persons[i].def.node);const pts=[V3(persons[i].home.x,persons[i].home.y+0.25,persons[i].home.z)].concat(P.map(p=>V3(p[0],p[1]+0.25,p[2])));
    const cp=new THREE.CurvePath();for(let j=0;j<pts.length-1;j++)cp.add(new THREE.LineCurve3(pts[j],pts[j+1]));
    const tube=new THREE.Mesh(new THREE.TubeGeometry(cp,pts.length*4,0.07,5),new THREE.MeshBasicMaterial({color:0x35d07f,transparent:true,opacity:0.9}));routeGroup.add(tube);
    const endm=new THREE.Mesh(new THREE.ConeGeometry(0.3,0.7,6),new THREE.MeshBasicMaterial({color:0x35d07f}));endm.position.copy(pts[pts.length-1]).add(V3(0,0.5,0));endm.rotation.x=Math.PI;routeGroup.add(endm);}
  /* ---------- Zustand ---------- */
  const cam={theta:HOME.theta,phi:HOME.phi,zoom:1,tx:HOME.tx,ty:HOME.ty,tz:HOME.tz};let goal=null;
  const S={mode:0,sel:-1,showAR:false,sim:null,t:0,prot:{},dirty:true,aspect:1,hotEls:[],game:{run:false,t:0,sim:null,prot:null},time:0};
  function setSize(){const w=host.clientWidth||300,h=host.clientHeight||300;renderer.setSize(w,h,false);camera.aspect=w/h;S.aspect=w/h;camera.updateProjectionMatrix();S.dirty=true;}
  const ro=new ResizeObserver(setSize);ro.observe(host);setSize();
  function applyCam(){const base=Math.max(29,27/S.aspect)*1.05;const r=base*cam.zoom;
    camera.position.set(cam.tx+r*Math.sin(cam.phi)*Math.sin(cam.theta),cam.ty+r*Math.cos(cam.phi),cam.tz+r*Math.sin(cam.phi)*Math.cos(cam.theta));
    camera.lookAt(cam.tx,cam.ty,cam.tz);camera.updateMatrixWorld();
    // Waende blenden, wenn man von aussen auf sie blickt
    const lk=S.aspect<1?1.45:1;LABELS.forEach(l=>{if(!l.userData.bw){l.userData.bw=l.scale.x;l.userData.bh=l.scale.y;}});LABELS.forEach(l=>l.scale.set(l.userData.bw*lk,l.userData.bh*lk,1));const cp=camera.position;const o=(m,v)=>{if(m.opacity!==v){m.opacity=v;m.transparent=true;m.depthWrite=v>0.9;}};
    const aL=cp.x<-6.6?(1-clamp((-6.6-cp.x)/6,0,1)*0.85):1; // linke Wand ist nur von aussen sichtbar -> blendet, wenn Kamera links ausserhalb
    o(sideMat,1);o(clad,1);
    const leftOut=cp.x<-6.7, backOut=cp.z<-3.5, rightOut=cp.x>6.7;
    sideMat.opacity=1;backMat.opacity=backOut?0.18:1;rightMat.opacity=rightOut?0.18:1;
    const lo=(cp.x<-7&&Math.abs(cp.z)<12)?0.2:1;sideMat.opacity=lo;
    clad.opacity=Math.min(lo,backOut?0.2:1);
    [sideMat,backMat,rightMat,clad].forEach(m=>{m.transparent=true;m.depthWrite=m.opacity>0.9;});
    cladL.forEach(c=>c.visible=true);
  }
  function fly(g){goal=Object.assign({},g);S.dirty=true;}
  /* ---------- Eingabe ---------- */
  canvas.style.touchAction='none';
  const ptrs=new Map();let pinch0=0,zoom0=1,moved=0,t0=0,startPt=null;
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptrs.size===1){moved=0;t0=performance.now();startPt={x:e.clientX,y:e.clientY};}
    if(ptrs.size===2){const a=[...ptrs.values()];pinch0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);zoom0=cam.zoom;moved=99;}});
  canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;
    if(ptrs.size===1){const dx=e.clientX-p.x,dy=e.clientY-p.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6){goal=null;cam.theta=clamp(cam.theta-dx*0.0075,-3,3);cam.phi=clamp(cam.phi-dy*0.005,0.8,1.72);S.dirty=true;}}
    p.x=e.clientX;p.y=e.clientY;
    if(ptrs.size===2){const a=[...ptrs.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);goal=null;cam.zoom=clamp(zoom0*pinch0/Math.max(d,1),0.22,1.35);S.dirty=true;}});
  const up=e=>{const had=ptrs.has(e.pointerId);ptrs.delete(e.pointerId);
    if(had&&e.type==='pointerup'&&ptrs.size===0&&moved<=6&&performance.now()-t0<600)pick(e.clientX,e.clientY);if(ptrs.size===0)moved=0;};
  canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',e=>{e.preventDefault();goal=null;cam.zoom=clamp(cam.zoom*Math.exp(e.deltaY*0.0012),0.22,1.35);S.dirty=true;},{passive:false});
  const ray=new THREE.Raycaster(),mp=new THREE.Vector2();
  function pick(cx,cy){const r=canvas.getBoundingClientRect();mp.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(mp,camera);
    const hit=ray.intersectObjects(picks,false);if(hit.length)cb.onPickRoom&&cb.onPickRoom(hit[0].object.userData.node);}
  /* ---------- Frame ---------- */
  const tmp=V3(0,0,0);let last=performance.now(),raf=0,lastGameCb=0;
  function viewSim(){return S.mode===2?S.game.sim:S.sim;}
  function viewT(){return S.mode===2?S.game.t:S.t;}
  function updateVisuals(time){
    const sim=viewSim(),t=viewT();let anyFire=false,maxFi=0,maxN=-1;
    const prot=sim?sim.prot:{};
    nodes.forEach(nd=>{const fi=fint(sim,nd.n,t),dn=dens(sim,nd.n,t);
      nd.g.visible=fi>0.01;
      if(fi>0.01){anyFire=true;if(fi>maxFi){maxFi=fi;maxN=nd.n;}
        nd.cones.forEach(c=>{const u=c.userData,fl=0.75+0.25*Math.sin(time*9+u.ph)+0.12*Math.sin(time*17+u.ph*2);const h=(1.1+0.5*fl)*fi*u.sc*(nkind(nd.n)>=2?0.7:1);
          c.scale.set(fi*u.sc*(0.9+0.2*fl),Math.max(h,0.01),fi*u.sc*(0.9+0.2*fl));c.position.set(u.px+Math.sin(time*3+u.ph)*0.08,h*0.5,u.pz);});
        nd.glow.material.opacity=0.2*fi*(0.8+0.2*Math.sin(time*7+nd.n));}
      const v=nd.v;const dd=dn;nd.sbox.visible=dd>0.01;
      if(dd>0.01){const h=IH*(0.18+0.82*dd);nd.sbox.scale.set(v.sx-0.08,h,v.sz-0.08);nd.sbox.position.set(v.cx,v.y0+IH-h/2,v.cz);nd.smat.opacity=0.05+0.27*dd;
        nd.puffs.forEach(p=>{const u=p.userData;const ph=(time*0.28+u.ph)%1;p.visible=dd>0.12;p.scale.setScalar((0.5+ph*1.2)*(0.5+dd)*(nkind(nd.n)===3?0.9:1));
          p.position.set(v.cx+u.px+Math.sin(ph*5+u.ph*9)*0.35,v.y0+0.3+ph*(IH-0.3),v.cz+u.pz);});}
      else nd.puffs.forEach(p=>p.visible=false);
    });
    // Fenster-Flammen aussen
    winFlames.forEach((cs,i)=>{const f=i+1;const fi=fint(sim,nid(f,0),t);const show=fi>=1&&sim&&t-sim.tf[nid(f,0)]>5;cs.forEach((c,j)=>{c.visible=!!show;if(show){const fl=0.8+0.25*Math.sin(time*10+c.userData.ph);c.scale.set(0.9,1.2*fl,0.9);c.position.y=sY(f)+1.5+0.6*fl*0.5;}});});
    // Feuerlicht
    if(anyFire){const nd=nodes[maxN];fireLight.visible=true;fireLight.position.set(nd.v.cx,nd.v.y0+1.2,nd.v.cz+1.2);fireLight.intensity=1.6*maxFi*(0.85+0.15*Math.sin(time*11));}else{fireLight.intensity=0;}
    // Waende einfaerben
    const col=new THREE.Color();
    wallsReg.forEach(w=>{
      if(w.kind==='trenn'){const fa=fint(sim,w.a,t)>0.05||fint(sim,w.b,t)>0.05;const both=fint(sim,w.a,t)>0.3&&fint(sim,w.b,t)>0.3;
        const mat=w.m.material;let c=prot.wall?0x8fa5cc:0xd5dbe5,e=0;
        if(prot.wall&&fa){c=0x58d78a;e=0.45;}else if(!prot.wall&&both){c=0xe0502a;e=0.5;}else if(!prot.wall&&fa){c=0xe9a07a;e=0.15;}
        mat.color.setHex(c);mat.emissive.setHex(e?(c===0x58d78a?0x1f8a4c:0x8a2a10):0);mat.emissiveIntensity=e;w.m.scale.x=prot.wall?2.2:1;}
      else if(w.kind==='door'){const m=w.m;const flurD=dens(sim,w.a,t),stD=dens(sim,w.b,t);let c=prot.door?0x4fa3c9:0x9b6a3c,e=0x000000;
        if(prot.door&&flurD>0.2){c=0x58d78a;e=0x1f8a4c;}else if(!prot.door&&stD>0.3){c=0xd65a3a;e=0x6a1c0a;}
        m.color.setHex(c);m.emissive.setHex(e);
        // Tuer offen / zu
        w.door.rotation.y=prot.door?0:1.3;}
      else if(w.kind==='part'){const fa=fint(sim,w.a,t)>0.05||fint(sim,w.b2,t)>0.05;w.m.color.setHex(prot.wall&&fa?0x58d78a:0xaebbd0);w.m.opacity=prot.wall&&fa?0.5:0.3;}
    });
    // Tuerblatt-Drehpunkt: Tuer offen -> Blatt steht schraeg an der Wand
    // Fassade
    clad.color.setHex(prot.fac?0xe2e6ea:0xc98a4b);
    cladL.forEach((c,f)=>{});
    // Rauchabzug
    const open=!!prot.rwa&&(sim!=null);rwaPivot.rotation.z=open?0.9:0;
    // Fassade leuchtet, wenn Raum A/B brennt und Fassade brennbar
    let facGlow=0;if(sim&&!prot.fac){for(let f=1;f<NF;f++)if(fint(sim,nid(f,0),t)>=1)facGlow=Math.max(facGlow,(t-sim.tf[nid(f,0)])/8);}
    clad.emissive.setHex(facGlow>0?0x9a2a0a:0);clad.emissiveIntensity=clamp(facGlow,0,1)*0.8;
    return anyFire||nodes.some(n=>n.sbox.visible);
  }
  function updateHot(time){
    for(let i=0;i<4;i++){const el=S.hotEls[i];if(!el)continue;
      if(S.mode!==0){el.style.display='none';continue;}
      tmp.copy(HOTPOS[i]).project(camera);const w=host.clientWidth,h=host.clientHeight;
      if(tmp.z>1){el.style.display='none';continue;}el.style.display='';
      el.style.transform='translate('+((tmp.x+1)/2*w).toFixed(1)+'px,'+((1-tmp.y)/2*h).toFixed(1)+'px)';}
  }
  const gameCb=(force)=>{const now=performance.now();if(!force&&now-lastGameCb<200)return;lastGameCb=now;
    cb.onGame&&cb.onGame({t:S.game.t,run:S.game.run,persons:persons.map(p=>({state:p.state,cause:p.cause,at:p.at,pos:p.pos})),stair:(()=>{let m=0;for(let f=0;f<NF;f++)m=Math.max(m,dens(S.game.sim,nid(f,3),S.game.t));return m;})(),over:S.game.over});};
  const GAME_MIN_PER_S=0.8, WALK=3.0;
  function updateGame(dt){const G=S.game;if(!G.run)return false;
    G.t+=dt*GAME_MIN_PER_S;let busy=false;
    persons.forEach(p=>{
      const sim=G.sim;
      if(p.state==='wait'){ if(dens(sim,p.def.node,G.t)>=0.8||fint(sim,p.def.node,G.t)>0.2){p.state='dead';p.cause={kind:'room',node:p.def.node};p.at=G.t;} else busy=true; }
      if(p.state==='go'){ busy=true;
        const P=p.path;let remain=dt*WALK*p.def.spd;
        while(remain>0&&p.seg<P.length-1){const a=P[p.seg],b=P[p.seg+1];const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz)||0.001;const left=len*(1-p.pos);
          if(remain>=left){remain-=left;p.seg++;p.pos=0;}else{p.pos+=remain/len;remain=0;}}
        const a=P[p.seg],b=P[Math.min(p.seg+1,P.length-1)];p.g.position.set(a[0]+(b[0]-a[0])*p.pos,a[1]+(b[1]-a[1])*p.pos,a[2]+(b[2]-a[2])*p.pos);
        const dxm=b[0]-a[0],dzm=b[2]-a[2];if(Math.abs(dxm)+Math.abs(dzm)>0.01)p.g.rotation.y=Math.atan2(dxm,dzm);
        p.g.position.y+=Math.abs(Math.sin(S.time*9))*0.06;
        const node=P[Math.min(p.seg+1,P.length-1)][3]>=0?(p.pos>0.5?P[Math.min(p.seg+1,P.length-1)][3]:P[p.seg][3]):-1;
        if(node>=0&&(dens(sim,node,G.t)>=0.65||fint(sim,node,G.t)>0.2)){p.state='dead';p.cause={kind:nkind(node)===3?'stair':nkind(node)===2?'flur':'room',node};p.at=G.t;}
        else if(p.seg>=P.length-1){p.state='safe';p.at=G.t;}
      }
      p.mat.color.setHex(p.state==='dead'?0x555b66:p.def.col);p.ring.visible=p.state==='wait';p.ring.material.opacity=0.5+0.4*Math.sin(S.time*5);
      if(p.state==='wait')p.g.position.y=p.home.y+Math.abs(Math.sin(S.time*3+p.def.node))*0.05;
    });
    const unresolved=persons.some(p=>p.state==='wait'||p.state==='go');
    if(!unresolved||G.t>=40){G.run=false;G.over=true;persons.forEach(p=>{if(p.state==='wait'||p.state==='go'){p.state='dead';p.cause={kind:p.state==='go'?'time':'unsent'};p.at=G.t;}});gameCb(true);return false;}
    gameCb(false);return busy||true;
  }
  const api={
    setHotEls(els){S.hotEls=els;S.dirty=true;},
    setMode(m){S.mode=m;persons.forEach(p=>p.g.visible=m===2);deco.forEach((d,i)=>d.visible=m===0&&S.sel===i);floorTints.forEach(t=>t.visible=m===0&&S.showAR);showRoute(null);S.dirty=true;if(m===0||m===1)fly(HOME);if(m===2)fly(HOME);},
    home(){fly(HOME);},
    selectHot(i){S.sel=i;deco.forEach((d,j)=>d.visible=S.mode===0&&i===j);if(i>=0&&i<4)fly(HOTCAM[i]);else fly(HOME);S.dirty=true;},
    setAR(v){S.showAR=v;floorTints.forEach(t=>t.visible=S.mode===0&&v);S.dirty=true;},
    setSim(sim,t){S.sim=sim;S.t=t;S.dirty=true;},
    gameReset(prot){const sim=computeSim(nid(2,0),prot);Object.assign(S.game,{run:false,over:false,t:0,sim,prot});
      persons.forEach(p=>{p.state='wait';p.seg=0;p.pos=0;p.path=null;p.cause=null;p.at=-1;p.g.position.copy(p.home);p.g.rotation.y=0;});showRoute(null);S.dirty=true;gameCb(true);},
    gameStart(){S.game.run=true;S.game.over=false;S.dirty=true;},
    gameEnd(){S.game.t=Math.max(S.game.t,0);S.game.t=40;updateGame(0.001);S.dirty=true;},
    preview(i){showRoute(i);S.dirty=true;},
    send(i){const p=persons[i];if(!p||p.state!=='wait'||!S.game.run)return false;p.path=[[p.home.x,p.home.y,p.home.z,p.def.node]].concat(routeFor(p.def.node));p.seg=0;p.pos=0;p.state='go';showRoute(i);S.dirty=true;gameCb(true);return true;},
    screenOf(n){applyCam();const v=NODEVOL(n);const p=V3(v.cx,v.y0+1,v.cz).project(camera);const r=canvas.getBoundingClientRect();return {x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height};},
    personNode(i){return persons[i].def.node;},
    dispose(){cancelAnimationFrame(raf);ro.disconnect();renderer.dispose();}
  };
  function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(0.05,(now-last)/1000);last=now;S.time+=dt;
    let need=S.dirty;S.dirty=false;
    if(goal){const k=1-Math.exp(-dt*3.6);['theta','phi','zoom','tx','ty','tz'].forEach(a=>{cam[a]+=(goal[a]-cam[a])*k;});
      if(['theta','phi','zoom','tx','ty','tz'].every(a=>Math.abs(goal[a]-cam[a])<0.004))goal=null;need=true;}
    if(S.mode===2&&updateGame(dt))need=true;
    const vs=viewSim();let fire=false;
    if(vs||S.mode===0||need){fire=updateVisuals(S.time);}
    if(fire)need=true;
    if(S.mode===0){const sel=S.sel;if(sel>=0){need=true;const pu=0.5+0.5*Math.sin(S.time*4);
      if(sel===0){spark.rotation.y+=dt*3;spark.scale.setScalar(0.8+0.5*pu);sparkGlow.material.opacity=0.15+0.3*pu;}
      if(sel===1){shMat.opacity=0.12+0.3*pu;}
      if(sel===2){const L=rCurve.getLength();rdots.forEach((d,i)=>{const u=((S.time*0.07+i/rdots.length)%1);d.position.copy(rCurve.getPoint(u));});arrow.position.x=-7.6-0.25*pu;}
      if(sel===3){wdots.forEach((d,i)=>{const u=((S.time*0.7+i/wdots.length)%1);wCurve.getPoint(u,d.position);});ring.scale.setScalar(1+0.04*pu);}
    }}
    persons.forEach(p=>{if(p.state==='wait'&&S.mode===2)need=true;});
    if(need){applyCam();updateHot(S.time);renderer.render(scene,camera);}
    else if(S.mode===0){/* ruhend */}
  }
  raf=requestAnimationFrame(frame);
  // Hotspots bei Kamerabewegung immer aktuell (need deckt das ab)
  return api;
}
const LABELS=[];
function labelSprite(txt,col){
  const c=document.createElement('canvas');c.width=320;c.height=72;const x=c.getContext('2d');
  x.font='600 30px "Segoe UI",Arial,sans-serif';const w=Math.min(300,x.measureText(txt).width+44);
  x.fillStyle='rgba(13,21,34,0.78)';const rx=(320-w)/2;x.beginPath();x.roundRect?x.roundRect(rx,10,w,52,26):x.rect(rx,10,w,52);x.fill();
  x.fillStyle=col;x.beginPath();x.arc(rx+22,36,8,0,7);x.fill();
  x.fillStyle='#fff';x.textBaseline='middle';x.textAlign='left';x.fillText(txt,rx+38,37);
  const tex=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));
  s.scale.set(2.5,0.56,1);s.renderOrder=20;LABELS.push(s);return s;
}
/* ===== Oberflaeche (React) ===== */
const h=React.createElement;
const {useState,useEffect,useRef,useMemo,useCallback}=React;
const EARL=[
 {k:'E',name:'Entstehung',col:'#3f9a54',satz:'Der Entstehung eines Brandes wird vorgebeugt.',
  sehen:'Ein überlasteter Mehrfachstecker ist eine **Zündquelle**. Vorbeugen heißt: Zündquellen vermeiden, bevor ein Brand entsteht.'},
 {k:'A',name:'Ausbreitung',col:'#e58a00',satz:'Der Ausbreitung von Feuer und Rauch wird vorgebeugt.',
  sehen:'**Trennwand** (Brandwand) und **rauchdichte Tür** halten Feuer und Rauch im Brandabschnitt. Verschiedene Nutzungseinheiten werden baulich getrennt.'},
 {k:'R',name:'Rettung',col:'#2f78d1',satz:'Bei einem Brand ist die Rettung von Menschen und Tieren möglich.',
  sehen:'Der **Treppenraum** ist der Rettungsweg und muss rauchfrei bleiben. Das Fenster ist der zweite Rettungsweg (Allgemeinwissen, kein Prüfungsstoff).'},
 {k:'L',name:'Löschen',col:'#a8201a',satz:'Bei einem Brand sind wirksame Löscharbeiten möglich.',
  sehen:'Die Feuerwehr braucht **Zufahrt** und **Aufstellfläche** sowie **Löschwasser** (Hydrant). Nur so sind wirksame Löscharbeiten möglich.'}];
const PROT=[
 {k:'wall',t:'Trennwand feuerbeständig',d:'hält Feuer im Raum'},
 {k:'door',t:'Rauchdichte Tür zum Treppenraum',d:'hält Rauch und Feuer draußen'},
 {k:'fac',t:'Nichtbrennbare Fassade und Baustoffe',d:'kein Feuer außen nach oben'},
 {k:'rwa',t:'Rauchabzug im Treppenraum',d:'hält den Rauch dünn'}];
function B(txt){return String(txt).split('**').map((s,i)=>i%2?h('b',{key:i},s):s);}
const css=`
:root{--bg:#0d1522;--pn:var(--card,#162132);--pn2:var(--soft,#1d2b40);--tx:var(--ink,#eef2f8);--mu:var(--mute,#9aa8bd);--ac:var(--or,#ffa412);--ok:#35d07f;--bad:#ff6a4d;--ln:var(--line,rgba(255,255,255,.09))}
body{background:var(--bg);color:var(--tx);-webkit-tap-highlight-color:transparent}
.app{display:flex;flex-direction:column;height:100%;height:100dvh}
.stage{position:relative;flex:1 1 auto;min-height:0;overflow:hidden}
.stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}
.panel{flex:0 0 auto;height:46%;display:flex;flex-direction:column;background:var(--pn);border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.35);position:relative;z-index:2}
.pbody{flex:1;overflow:auto;padding:14px 16px 10px;-webkit-overflow-scrolling:touch}
.tabs{order:2;display:flex;gap:6px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));border-top:1px solid var(--ln)}
.tab{flex:1;min-height:48px;border:0;border-radius:14px;background:transparent;color:var(--mu);font:600 13px/1.1 inherit;font-family:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer}
.tab svg{width:22px;height:22px}
.tab.on{background:rgba(255,164,18,.15);color:var(--ac)}
@media(min-width:900px){
 .app{flex-direction:row}
 .panel{height:100%;width:420px;border-radius:0;order:2;box-shadow:-10px 0 30px rgba(0,0,0,.3)}
 .tabs{order:0;border-top:0;border-bottom:1px solid var(--ln);padding:12px}
 .tab{flex-direction:row;gap:8px;font-size:14px}
 .pbody{padding:18px 20px}
}
h2{margin:0 0 6px;font-size:19px;line-height:1.2}
p{margin:0 0 10px;line-height:1.45;font-size:15px}
.mu{color:var(--mu)}
.card{background:var(--pn2);border-radius:16px;padding:14px;margin-bottom:12px;border:1px solid var(--ln)}
.quote{border-left:4px solid var(--c,var(--ac));padding:6px 0 6px 12px;font-size:16px;font-weight:600;margin:8px 0 10px;line-height:1.35}
.btn{min-height:46px;border-radius:14px;border:0;font:700 15px inherit;font-family:inherit;padding:0 18px;cursor:pointer;background:var(--ac);color:#241503}
.btn.sec{background:var(--pn2);color:var(--tx);border:1px solid var(--ln)}
.btn:disabled{opacity:.45;cursor:default}
.btn.big{width:100%;min-height:52px;font-size:16px}
.chips{position:absolute;left:10px;top:10px;display:flex;gap:6px;z-index:3}
.chip{width:40px;height:40px;border-radius:12px;border:2px solid var(--c);background:rgba(13,21,34,.78);color:#fff;font:800 18px inherit;font-family:inherit;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(4px);transition:all .25s}
.chip.on{background:var(--c);border-color:#fff3;box-shadow:0 0 14px var(--c)}
.chip.sel{transform:scale(1.12)}
.topr{position:absolute;right:10px;top:10px;display:flex;gap:6px;z-index:3}
.ibtn{min-width:44px;height:44px;border-radius:12px;border:0;background:rgba(13,21,34,.72);color:#fff;font:700 13px inherit;font-family:inherit;padding:0 12px;cursor:pointer;backdrop-filter:blur(4px)}
.hint{position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:12px;color:#9fb0c8;pointer-events:none;z-index:2}
.hot{position:absolute;left:0;top:0;z-index:3;pointer-events:none;will-change:transform}
.hot button{pointer-events:auto;position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;border:0;background:transparent;cursor:pointer;padding:0}
.hot .core{position:absolute;left:10px;top:10px;width:32px;height:32px;border-radius:50%;background:var(--c);color:#fff;font:800 16px inherit;font-family:inherit;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px #fff9,0 0 18px 4px var(--c)}
.hot .pulse{position:absolute;left:4px;top:4px;width:44px;height:44px;border-radius:50%;border:3px solid var(--c);animation:pl 1.8s ease-out infinite;opacity:0}
.hot.done .pulse{animation:none}
.hot.sel .core{transform:scale(1.2)}
@keyframes pl{0%{transform:scale(.7);opacity:.9}100%{transform:scale(1.9);opacity:0}}
.prog{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.dots{display:flex;gap:6px}.dot{width:12px;height:12px;border-radius:50%;background:#34445d}.dot.on{background:var(--ok)}
.sw{display:flex;align-items:center;gap:12px;min-height:48px;padding:6px 0;cursor:pointer;border-bottom:1px solid var(--ln)}
.sw:last-child{border-bottom:0}
.sw .t{flex:1}.sw .t b{display:block;font-size:14px}.sw .t span{font-size:12px;color:var(--mu)}
.tg{width:50px;height:28px;border-radius:14px;background:#3a4a63;position:relative;flex:none;transition:background .2s}
.tg:after{content:"";position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}
.tg.on{background:var(--ok)}.tg.on:after{transform:translateX(22px)}
.row{display:flex;gap:10px;align-items:center}
input[type=range]{flex:1;accent-color:var(--ac);height:36px;min-width:0}
.stat{display:flex;gap:8px;margin:8px 0}
.stat>div{flex:1;background:var(--pn2);border-radius:12px;padding:8px 10px;border:1px solid var(--ln);min-width:0}
.stat small{display:block;color:var(--mu);font-size:11px}.stat b{font-size:16px}
.msg{border-radius:14px;padding:11px 13px;font-weight:700;margin:8px 0;font-size:15px;line-height:1.3}
.msg.g{background:rgba(53,208,127,.16);color:#6ff0a8;border:1px solid rgba(53,208,127,.4)}
.msg.r{background:rgba(255,106,77,.15);color:#ff9d88;border:1px solid rgba(255,106,77,.4)}
.msg.o{background:rgba(255,164,18,.14);color:#ffc462;border:1px solid rgba(255,164,18,.4)}
.msg.n{background:var(--pn2);color:var(--mu);border:1px solid var(--ln);font-weight:500}
.ev{font-size:13px;color:var(--mu);margin:3px 0;padding-left:14px;position:relative}
.ev:before{content:"";position:absolute;left:0;top:6px;width:7px;height:7px;border-radius:50%;background:var(--c)}
.ev.r{--c:#ff6a4d}.ev.o{--c:#ffa412}.ev.g{--c:#35d07f}
.badge{display:inline-flex;align-items:center;gap:6px;border-radius:10px;padding:5px 9px;font-size:12px;font-weight:700;background:var(--pn2);border:1px solid var(--ln)}
.pr{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--ln)}
.pr:last-child{border:0}
.pr .av{width:14px;height:34px;border-radius:7px;flex:none}
.pr .nm{flex:1;min-width:0}.pr .nm b{display:block;font-size:14px}.pr .nm span{font-size:12px;color:var(--mu)}
.pr .btn{min-height:44px;padding:0 14px;font-size:14px}
.st{font-size:12px;font-weight:700;border-radius:8px;padding:4px 8px}
.st.safe{background:rgba(53,208,127,.2);color:#6ff0a8}.st.dead{background:rgba(255,106,77,.2);color:#ff9d88}.st.go{background:rgba(47,120,209,.25);color:#8cc0ff}
.clock{position:absolute;left:50%;top:10px;transform:translateX(-50%);background:rgba(13,21,34,.78);border-radius:14px;padding:6px 16px;text-align:center;z-index:3;backdrop-filter:blur(4px);pointer-events:none}
.clock b{font-size:22px;display:block;line-height:1.1}.clock small{font-size:11px;color:var(--mu)}
.stars{display:flex;gap:6px;justify-content:center;margin:6px 0 10px}
.stars svg{width:44px;height:44px}
.qopt{display:flex;gap:8px;margin-top:8px}
.qopt .btn{flex:1;padding:0;min-height:48px}
.legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--mu);margin-top:8px}
.legend i{display:inline-block;width:12px;height:12px;border-radius:4px;vertical-align:-2px;margin-right:5px}
.ok{color:var(--ok)}.bd{color:var(--bad)}
`;
function Star({on}){return h('svg',{viewBox:'0 0 24 24'},h('path',{d:'M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z',fill:on?'#ffc83d':'#2c3a50',stroke:on?'#ffa412':'#3a4a63',strokeWidth:1.2,strokeLinejoin:'round'}));}
const ICON={
 e:h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},h('circle',{cx:12,cy:12,r:9}),h('path',{d:'M15.5 8.5l-2 5-5 2 2-5z'})),
 b:h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},h('path',{d:'M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 2 1 2 0-3-1-4 1-7z'}),h('path',{d:'M7 21h10'})),
 a:h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},h('circle',{cx:14,cy:4.5,r:2}),h('path',{d:'M10 21l2-6-3-2 1-5 4 2 3 2M8 10l-3 3M12 15l4 3'}))};
function Switch({on,onChange,t,d,disabled}){return h('div',{className:'sw',role:'switch','aria-checked':on,tabIndex:0,style:disabled?{opacity:.5,pointerEvents:'none'}:null,onClick:()=>onChange(!on),onKeyDown:e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();onChange(!on);}}},
  h('div',{className:'t'},h('b',null,t),h('span',null,d)),h('div',{className:'tg'+(on?' on':'')}));}
function ProtSwitches({prot,setProt,disabled}){return h('div',{className:'card',style:{padding:'4px 14px'}},PROT.map(p=>h(Switch,{key:p.k,on:!!prot[p.k],t:p.t,d:p.d,disabled,onChange:v=>setProt(Object.assign({},prot,{[p.k]:v}))})));}

const QUIZ=[
 {s:'Der Mehrfachstecker ist gegen Überlast gesichert und wird nicht abgedeckt.',a:0},
 {s:'Die feuerbeständige Trennwand hält das Feuer im Brandraum.',a:1},
 {s:'Der Treppenraum bleibt durch die rauchdichte Tür frei, alle kommen heraus.',a:2},
 {s:'Die Feuerwehr hat Zufahrt und Hydrant und kann wirksam löschen.',a:3}];

function ExploreTab({st,setSt,scene}){
  const {sel,found,showAR,room}=st;const n=found.filter(Boolean).length;
  const info=sel>=0?EARL[sel]:null;
  return h('div',null,
    h('div',{className:'prog'},h('b',null,n+' von 4 entdeckt'),h('div',{className:'dots'},found.map((f,i)=>h('div',{key:i,className:'dot'+(f?' on':'')})))),
    info?h('div',{className:'card',style:{'--c':info.col,borderColor:info.col}},
      h('div',{className:'row'},h('div',{style:{width:36,height:36,borderRadius:11,background:info.col,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:19}},info.k),h('h2',{style:{margin:0}},info.name+' (§ 14 MBO)')),
      h('div',{className:'quote'},'„'+info.satz+'“'),h('p',null,B(info.sehen)))
    :h('div',{className:'card'},h('h2',null,'Erkunde das Haus'),h('p',{className:'mu'},'Tippe auf die leuchtenden Punkte am Haus oder auf E, A, R, L. Ziehen dreht, Pinch zoomt.')),
    n===4?h('div',{className:'msg g'},'4 von 4 Zielen erkannt: E – A – R – L. Jetzt siehst du, wie Feuer sich ausbreitet.'):null,
    n===4?h('button',{className:'btn big',onClick:()=>setSt(s=>Object.assign({},s,{goto:1}))},'Weiter: Brand ausbreiten'):null,
    h('div',{className:'card',style:{marginTop:12}},
      h(Switch,{on:showAR,t:'Aufenthaltsräume markieren',d:'§ 2 Abs. 7 MBO: Räume, bestimmt oder geeignet zum nicht nur vorübergehenden Aufenthalt',onChange:v=>{setSt(s=>Object.assign({},s,{showAR:v,room:null}));scene.current&&scene.current.setAR(v);}}),
      showAR?h('div',null,h('div',{className:'legend'},h('span',null,h('i',{style:{background:'#2e9a52'}}),'Aufenthaltsraum'),h('span',null,h('i',{style:{background:'#7d8794'}}),'kein Aufenthaltsraum')),
        h('p',{className:'mu',style:{marginTop:8,fontSize:13}},room!=null?B('**'+nodeLabel(room).replace(/ \(.*/,'')+'**: '+(ROOMS[nfloor(room)][nkind(room)][1]?'Aufenthaltsraum (z. B. Wohn-, Schlaf-, Büro-, Verkaufsraum, Küche).':'kein Aufenthaltsraum (Lager-, Abstell-, Sanitärraum und andere Nebenräume). Auch Flur und Treppenraum sind keine Aufenthaltsräume.')):'Tippe einen Raum im Haus an.')):null));
}

function BrandTab({st,setSt,scene,prot,setProt}){
  const {origin,t,playing}=st.b;
  const sim=useMemo(()=>origin>=0?computeSim(origin,prot):null,[origin,prot]);
  useEffect(()=>{scene.current&&scene.current.setSim(sim,t);},[sim,t]);
  const stt=sim?simStatus(sim,t):null;const ev=sim?simEvents(sim,t):[];
  const setB=p=>setSt(s=>Object.assign({},s,{b:Object.assign({},s.b,p)}));
  let msg=null;
  if(!sim)msg=h('div',{className:'msg n'},'Tippe einen Raum im Haus an: dort bricht ein Feuer aus.');
  else{const last=ev.filter(e=>e.c!=='g').slice(-1)[0];
    const holds=ev.filter(e=>e.c==='g').slice(-1)[0];
    const spreadOver=stt.floors>1;
    if(t>=sim.tf.filter(x=>x<INF).reduce((a,b)=>Math.max(a,b),0)+3&&stt.burn<=2&&(prot.wall||prot.door||prot.fac))msg=h('div',{className:'msg g'},'Ausbreitung gestoppt: '+(holds?holds.x:'Das Feuer bleibt begrenzt.'));
    else if(spreadOver){const fe=ev.filter(e=>/Geschoss/.test(e.x)).slice(-1)[0];msg=h('div',{className:'msg r'},fe?fe.x.replace(/^Minute \d+: /,''):'Feuer breitet sich aus');}
    else if(holds)msg=h('div',{className:'msg g'},holds.x);
    else msg=h('div',{className:'msg o'},last?last.x:'Feuer brennt');}
  const free=stt?stt.stairSmoke<0.15:true;
  return h('div',null,
    !sim?h('div',{className:'card'},h('h2',null,'Brand ausbreiten'),h('p',{className:'mu'},'Schalte unten Schutzmaßnahmen an oder aus. Tippe dann einen Raum an und starte die Zeit.')):null,
    h('div',{className:'card',style:{padding:'12px 14px'}},
      h('div',{className:'row'},
        h('button',{className:'btn',style:{width:92},disabled:!sim,onClick:()=>{if(t>=120)setB({t:0,playing:true});else setB({playing:!playing});}},playing?'Pause':(t>=120?'Neu':'Start')),
        h('input',{type:'range',min:0,max:120,step:1,value:Math.round(t),disabled:!sim,'aria-label':'Zeit in Minuten',onChange:e=>setB({t:+e.target.value,playing:false})}),
        h('b',{style:{width:62,textAlign:'right'}},Math.round(t)+' min'))),
    sim?h('div',null,msg,
      h('div',{className:'stat'},h('div',null,h('small',null,'betroffen'),h('b',null,stt.burn+' Feuer · '+stt.smoke+' Rauch')),h('div',null,h('small',null,'Geschosse mit Feuer'),h('b',null,stt.floors)),
        ),
      h('div',{className:'row',style:{flexWrap:'wrap',marginBottom:8}},
        h('span',{className:'badge',style:{color:stt.burn>2||stt.floors>1?'#ff9d88':'#6ff0a8'}},'A Ausbreitung: '+(stt.floors>1?'greift über':stt.burn>2?'läuft':'begrenzt')),
        h('span',{className:'badge',style:{color:free?'#6ff0a8':'#ff9d88'}},'R Treppenraum: '+(free?'rauchfrei':stt.stairSmoke<0.5?'dünner Rauch':'verraucht'))),
      ev.slice(-3).reverse().map((e,i)=>h('div',{key:i,className:'ev '+e.c},e.x))):null,
    h('div',{style:{margin:'10px 0 6px'}},h('b',null,'Schutzmaßnahmen')),
    h(ProtSwitches,{prot,setProt}),
    sim?h('button',{className:'btn sec',onClick:()=>setB({origin:-1,t:0,playing:false})},'Anderen Raum wählen'):null);
}

function GameTab({st,setSt,scene,prot,setProt}){
  const g=st.g,gs=g.state;const setG=p=>setSt(s=>Object.assign({},s,{g:Object.assign({},s.g,p)}));
  const P=[['Mia','2. OG, Wohnraum'],['Jonas','2. OG, Büroraum'],['Lena','1. OG, Schlafraum'],['Opa Karl','DG, Wohnraum']];
  const cols=['#ffc93c','#5db7ff','#ff7fb0','#b58cff'];
  const people=gs.persons;
  const saved=people.filter(p=>p.state==='safe').length;
  const lastT=Math.max.apply(null,people.map(p=>p.state==='safe'?p.at:0));
  const stars=saved===4?(lastT<=14?3:2):saved>=3?2:saved>=2?1:0;
  const score=saved*100+(saved===4?Math.max(0,Math.round((20-lastT)*5)):0);
  const phase=g.phase;
  const stairBad=gs.stair>=0.5;
  const reason=p=>{const c=p.cause;if(!c)return '';
    if(c.kind==='stair')return 'Der Treppenraum war verraucht'+(prot.door?'.':': ohne rauchdichte Tür füllt Rauch den Treppenraum wie einen Kamin.');
    if(c.kind==='flur')return 'Der Flur im Brandgeschoss war schon verraucht: zu spät losgegangen.';
    if(c.kind==='room')return 'Im Raum vom Rauch eingeholt: zu spät losgeschickt.';
    if(c.kind==='unsent')return 'Nicht losgeschickt.';return 'Zeit abgelaufen.';};
  const start=()=>{scene.current.gameStart();setG({phase:'run'});};
  const send=i=>{if(phase==='run')scene.current.send(i);else scene.current.preview(i);};
  useEffect(()=>{if(phase==='run'&&gs.over)setG({phase:'result'});},[gs.over,phase]);
  useEffect(()=>{st.gSend&&0;},[]);
  const q=g.q;
  if(phase==='setup'||phase==='run')return h('div',null,
    h('div',{className:'card'},h('h2',null,phase==='setup'?'Bring alle Menschen raus':'Schnell: schicke alle los!'),
      h('p',null,phase==='setup'?B('In der **Küche im 1. OG** brennt es. Vier Personen sind im Haus. Stelle den Schutz ein, tippe einen Raum zum Ansehen des Fluchtwegs und starte dann.'):B('Tippe auf eine Person oder ihren Raum: sie läuft über **Flur** und **Treppenraum** nach draußen. Rauch macht den Weg unpassierbar.'))),
    phase==='setup'?h(ProtSwitches,{prot,setProt}):h('div',{className:'stat'},h('div',null,h('small',null,'Treppenraum'),h('b',{className:stairBad?'bd':'ok'},stairBad?'verraucht':gs.stair>0.1?'dünner Rauch':'rauchfrei')),h('div',null,h('small',null,'gerettet'),h('b',null,saved+' von 4'))),
    h('div',{className:'card',style:{padding:'4px 14px'}},P.map((p,i)=>{const s=people[i]||{state:'wait'};
      return h('div',{className:'pr',key:i},h('div',{className:'av',style:{background:cols[i]}}),h('div',{className:'nm'},h('b',null,p[0]),h('span',null,p[1])),
        s.state==='wait'?h('button',{className:'btn',onClick:()=>send(i)},phase==='run'?'Los!':'Weg zeigen'):
        h('span',{className:'st '+(s.state==='safe'?'safe':s.state==='dead'?'dead':'go')},s.state==='safe'?'gerettet':s.state==='dead'?'verraucht':'läuft'));})),
    phase==='setup'?h('button',{className:'btn big',onClick:start},'Alarm: Zeit starten'):h('button',{className:'btn sec big',onClick:()=>scene.current.gameEnd()},'Auswertung jetzt'));
  if(phase==='result')return h('div',null,
    h('div',{className:'card'},h('div',{className:'stars'},[0,1,2].map(i=>h(Star,{key:i,on:i<stars}))),
      h('h2',{style:{textAlign:'center'}},saved+' von 4 gerettet · '+score+' Punkte'),
      h('p',{className:'mu',style:{textAlign:'center'}},stars===3?'Alle gerettet und schnell.':stars===2?'Gut gemacht.':'Versuche es mit mehr Schutz.')),
    h('div',{className:'card',style:{padding:'4px 14px'}},people.map((p,i)=>h('div',{className:'pr',key:i},h('div',{className:'av',style:{background:cols[i],opacity:p.state==='safe'?1:.4}}),h('div',{className:'nm'},h('b',null,P[i][0]+(p.state==='safe'?' – gerettet in Minute '+Math.round(p.at):' – nicht gerettet')),h('span',null,p.state==='safe'?'Weg über den rauchfreien Treppenraum.':reason(p)))))),
    h('div',{className:'card',style:{'--c':'#2f78d1',borderColor:'#2f78d1'}},h('b',{style:{color:'#8cc0ff'}},'Warum Rettung (R) und Ausbreitung (A) zusammengehören'),
      h('p',{style:{marginTop:6}},B(prot.door?'Die **rauchdichte Tür** hielt den Rauch aus dem **Treppenraum**. Er bleibt der sichere **Rettungsweg**: Ziel R hängt an Ziel A.':'Ohne **rauchdichte Tür** zog der Rauch in den **Treppenraum** und stieg nach oben. Ein verrauchter Treppenraum ist kein Rettungsweg mehr. Er muss **rauchfrei** bleiben.'))),
    h('div',{className:'row'},h('button',{className:'btn sec',style:{flex:1},onClick:()=>{scene.current.gameReset(prot);setG({phase:'setup'});}},'Nochmal'),h('button',{className:'btn',style:{flex:1},onClick:()=>setG({phase:'quiz',q:{i:0,ans:null,ok:0}})},'Zum Quiz')));
  // Quiz
  if(q.i>=QUIZ.length)return h('div',null,h('div',{className:'card',style:{textAlign:'center'}},h('div',{className:'stars'},[0,1,2,3].map(i=>h(Star,{key:i,on:i<q.ok}))),h('h2',null,q.ok+' von 4 Zielen erkannt'),
    h('p',{className:'mu'},q.ok===4?'Perfekt: E – A – R – L sitzt.':'Schau dir die Ziele noch einmal im Haus an.')),
    h('button',{className:'btn sec big',onClick:()=>{scene.current.gameReset(prot);setG({phase:'setup'});}},'Aufgabe wiederholen'));
  const cur=QUIZ[q.i];
  return h('div',null,h('div',{className:'card'},h('small',{className:'mu'},'Frage '+(q.i+1)+' von 4'),h('h2',{style:{fontSize:17,marginTop:4}},'Welches Ziel passt?'),h('p',null,'„'+cur.s+'“'),
    h('div',{className:'qopt'},EARL.map((e,i)=>h('button',{key:i,className:'btn',disabled:q.ans!=null,style:{background:q.ans!=null&&i===cur.a?'#35d07f':q.ans===i?'#ff6a4d':e.col,color:'#fff',opacity:q.ans!=null&&i!==cur.a&&q.ans!==i?.4:1},onClick:()=>setG({q:Object.assign({},q,{ans:i,ok:q.ok+(i===cur.a?1:0)})})},e.k))),
    q.ans!=null?h('div',{className:'msg '+(q.ans===cur.a?'g':'r'),style:{marginTop:12}},(q.ans===cur.a?'Richtig: ':'Falsch: ')+EARL[cur.a].name+'. '+EARL[cur.a].satz):null),
    q.ans!=null?h('button',{className:'btn big',onClick:()=>setG({q:Object.assign({},q,{i:q.i+1,ans:null})})},q.i===3?'Ergebnis':'Weiter'):null);
}

function App(){
  const canvasRef=useRef(null),hostRef=useRef(null),scene=useRef(null),hotRefs=useRef([]);
  const [mode,setMode]=useState(0);
  const [prot,setProt]=useState({wall:false,door:false,fac:false,rwa:false});
  const [st,setSt]=useState({sel:-1,found:[false,false,false,false],showAR:false,room:null,
    b:{origin:-1,t:0,playing:false},
    g:{phase:'setup',q:{i:0,ans:null,ok:0},state:{persons:[],stair:0,t:0,over:false}}});
  const stRef=useRef(st);stRef.current=st;const modeRef=useRef(mode);modeRef.current=mode;
  useEffect(()=>{
    const s=createScene(canvasRef.current,hostRef.current,{
      onPickRoom:n=>{const m=modeRef.current;
        if(m===0){if(stRef.current.showAR)setSt(x=>Object.assign({},x,{room:n}));}
        else if(m===1){setSt(x=>Object.assign({},x,{b:{origin:n,t:0,playing:true}}));}
        else if(m===2){const idx=[nid(3,0),nid(3,1),nid(2,1),nid(4,0)].indexOf(n);if(idx>=0){const g=stRef.current.g;if(g.phase==='run')s.send(idx);else if(g.phase==='setup')s.preview(idx);}}},
      onGame:gs=>setSt(x=>Object.assign({},x,{g:Object.assign({},x.g,{state:gs})}))});
    scene.current=s;s.setHotEls(hotRefs.current);
    window.__scene=s;
    return()=>s.dispose();},[]);
  // Modus wechseln
  useEffect(()=>{const s=scene.current;if(!s)return;s.setMode(mode);
    if(mode===0){s.setSim(null,0);s.selectHot(-1);setSt(x=>Object.assign({},x,{sel:-1}));}
    if(mode===1){setSt(x=>Object.assign({},x,{b:{origin:-1,t:0,playing:false}}));s.setSim(null,0);}
    if(mode===2){s.gameReset(prot);setSt(x=>Object.assign({},x,{g:Object.assign({},x.g,{phase:'setup',q:{i:0,ans:null,ok:0}})}));}
  },[mode]);
  // Schutz in Aufgabe -> neu aufsetzen
  useEffect(()=>{if(mode===2&&st.g.phase==='setup'&&scene.current)scene.current.gameReset(prot);},[prot]);
  // Zeit laufen lassen (Brand-Modus)
  useEffect(()=>{if(!st.b.playing)return;let last=performance.now(),id;
    const tick=now=>{const dt=Math.min(.1,(now-last)/1000);last=now;
      setSt(x=>{if(!x.b.playing)return x;const t=Math.min(120,x.b.t+dt*3);return Object.assign({},x,{b:Object.assign({},x.b,{t,playing:t<120})});});id=requestAnimationFrame(tick);};
    id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[st.b.playing]);
  useEffect(()=>{if(st.goto!=null){setMode(st.goto);setSt(x=>Object.assign({},x,{goto:null}));}},[st.goto]);
  const select=i=>{setSt(x=>{const f=x.found.slice();f[i]=true;return Object.assign({},x,{sel:i,found:f});});scene.current&&scene.current.selectHot(i);};
  const tabs=[['Erkunden','e'],['Brand','b'],['Aufgabe','a']];
  const bodyRef=useRef(null);useEffect(()=>{if(bodyRef.current)bodyRef.current.scrollTop=0;},[mode,st.sel]);
  const hudMin=mode===1&&st.b.origin>=0?Math.round(st.b.t):mode===2?Math.round(st.g.state.t||0):null;
  return h('div',{className:'app'},h('style',null,css),
    h('div',{className:'stage',ref:hostRef},h('canvas',{ref:canvasRef}),
      h('div',{className:'chips'},EARL.map((e,i)=>h('button',{key:i,className:'chip'+(st.found[i]?' on':'')+(st.sel===i&&mode===0?' sel':''),style:{'--c':e.col},'aria-label':e.name,title:e.name,onClick:()=>{if(mode!==0)setMode(0);setTimeout(()=>select(i),mode!==0?60:0);}},e.k))),
      h('div',{className:'topr'},h('button',{className:'ibtn',onClick:()=>{scene.current.home();if(mode===0){scene.current.selectHot(-1);setSt(x=>Object.assign({},x,{sel:-1}));}}},'Ganzes Haus')),
      hudMin!=null?h('div',{className:'clock'},h('small',null,'Minute'),h('b',null,hudMin)):null,
      EARL.map((e,i)=>h('div',{key:i,className:'hot'+(st.found[i]?' done':'')+(st.sel===i?' sel':''),style:{'--c':e.col,display:'none'},ref:el=>{hotRefs.current[i]=el;}},h('div',{className:'pulse'}),
        h('button',{'aria-label':e.name,onClick:()=>select(i)},h('div',{className:'core'},e.k)))),
      h('div',{className:'hint'},mode===0?'Ziehen: drehen · Pinch/Rad: zoomen':mode===1?'Tippe einen Raum an: dort bricht ein Feuer aus':'Tippe eine Person oder ihren Raum')),
    h('div',{className:'panel'},
      h('div',{className:'tabs',role:'tablist'},tabs.map((t,i)=>h('button',{key:i,role:'tab','aria-selected':mode===i,className:'tab'+(mode===i?' on':''),onClick:()=>setMode(i)},ICON[t[1]],t[0]))),
      h('div',{className:'pbody',ref:bodyRef},
        mode===0?h(ExploreTab,{st,setSt,scene}):mode===1?h(BrandTab,{st,setSt,scene,prot,setProt}):h(GameTab,{st,setSt,scene,prot,setProt}))));
}
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
