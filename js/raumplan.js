/* ======================================================================
   Raumplan IdF Münster in 3D (Stundenplan): Tipp auf eine Einheit mit Raum öffnet das Gelände, das passende Gebäude leuchtet.
   Wird erst beim ersten Tipp geladen (zusammen mit js/three.min.js) und danach vom Service Worker zwischengespeichert.
   Das Gelände ist nach dem Raumplan-Aushang des Instituts nachgezeichnet; die Gebäudehöhen sind geschätzt.
   ====================================================================== */
const RAUMPLAN=(function(){
'use strict';

/* ---------- Gelände (nachgezeichnet nach dem Aushang) ---------- */
var G=(function(){
  // Rohkoordinaten stammen aus dem Foto und werden in den kleinen Raum umgerechnet
  function T(x,y){ return [Math.round((x-18)*0.72*10)/10, Math.round((y-410)*0.72*10)/10]; }
  function P(a){ return a.map(function(p){ return T(p[0],p[1]); }); }
  function rect(x1,y1,x2,y2){ return [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]; }
  function rot(cx,cy,w,h,deg){ var a=deg*Math.PI/180, c=Math.cos(a), s=Math.sin(a); return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(function(p){ return [cx+p[0]*c-p[1]*s, cy+p[0]*s+p[1]*c]; }); }
  function centroid(pts){ var x=0,y=0; pts.forEach(function(p){ x+=p[0]; y+=p[1]; }); return [x/pts.length,y/pts.length]; }
  var B=[ // id, kind, col, Foto-Polygon, Beschriftung (Foto) – leer = Schwerpunkt
    ['B4','B','yellow',rot(538,592,104,78,40)],
    ['B3','B','brown',rot(450,650,70,62,40)],
    ['B2','B','brown',rot(385,770,118,138,40)],
    ['B1','B','red',rot(548,858,86,86,42)],
    ['C','C','red',[[105,905],[212,800],[246,832],[226,852],[226,945],[150,945]],[170,893]],
    ['M6','M','orange',rect(275,945,340,985),[308,962]],
    ['A3','A','red',[[433,950],[515,950],[515,1046],[373,1046],[373,1000],[433,1000]],[465,1006]],
    ['A1','A','yellow',rect(522,1028,588,1060),[565,1044]],
    ['A2','A','yellow',rect(487,1010,520,1116),[503,1085]],
    ['A4','A','orange',rect(318,985,360,1160),[340,1075]],
    ['A8','A','orange',[[318,1160],[360,1160],[360,1255],[605,1255],[605,1300],[318,1300]],[338,1232]],
    ['A6','A','orange',rect(570,1178,604,1286),[587,1243]],
    ['A9','A','orange',rect(468,1330,496,1384),[483,1347]],
    ['A7','A','yellow',rect(612,1342,652,1386),[633,1362]]
  ].map(function(b){ var pts=P(b[3]), c=b[4]?T(b[4][0],b[4][1]):centroid(pts); return {id:b[0],kind:b[1],col:b[2],pts:pts,lx:c[0],ly:c[1]}; });
  var PK=[ // Parkplätze (blau), Foto-Polygone
    rot(600,552,92,92,40), rot(362,598,76,30,-48), rot(432,612,30,26,35), rot(240,740,52,30,-48), rot(322,886,96,50,0),
    rot(84,940,56,30,0), rot(240,855,36,40,-45), rot(628,762,60,50,40), rot(608,808,60,28,40), rect(565,1140,645,1160)
  ].map(P);
  var HATCH=[rect(258,1304,464,1386),rect(483,1306,598,1386)].map(P);
  var BIKE=P(rect(698,1175,722,1385));
  var CANAL=P([[336,430],[378,468],[62,806],[20,764]]);
  var SITE=P([[545,426],[768,612],[738,1428],[672,1428],[675,940],[102,950],[26,912],[300,640],[470,470]]);
  var PLAZA=P([[470,630],[640,660],[665,715],[650,880],[430,905],[300,885],[250,830],[330,700]]);
  var GREEN=[rect(48,960,222,1112),rect(48,1130,222,1270),rect(48,1288,222,1380),rect(262,985,310,1195),rect(582,975,662,1135),rect(385,1075,470,1175),rect(262,1210,300,1245),rect(500,1190,568,1245),rect(615,1180,660,1240)].map(P);
  var STOPS=[T(580,1405),T(532,1495)];
  var P2=P(rect(468,708,500,738));
  var HOUSE={id:'Info',pt:T(538,1060)};   // „i“ am Eingang A1/A2
  function bOf(room){
    var m=/^([A-Za-z]\d?)-/.exec(String(room).trim()); return m?m[1].toUpperCase():null;
  }
  // "B1-106, A3-25" -> [{room:'B1-106',b:'B1'},{room:'A3-25',b:'A3'}]
  function parseRooms(s){ return String(s||'').split(/[,;]/).map(function(x){ return x.trim(); }).filter(Boolean).map(function(r){ return {room:r,b:bOf(r)}; }).filter(function(x){ return x.b&&B.some(function(b){ return b.id===x.b; }); }); }
  var W=T(860,1570);
  return {w:Math.ceil(W[0]),h:Math.ceil(W[1]),buildings:B,parking:PK,hatch:HATCH,bike:BIKE,canal:CANAL,site:SITE,plaza:PLAZA,green:GREEN,stops:STOPS,p2:P2,info:HOUSE.pt,
    road:{from:T(115,1418),to:T(695,1470),label:T(400,1458)}, canalLabel:T(195,610), streetLabel:T(410,1462), verfuerth:T(240,1185), bOf:bOf, parseRooms:parseRooms, T:T};
})();

/* ---------- 3D ---------- */
var HEIGHTS={A1:9,A2:14,A3:17,A4:15,A6:11,A7:6,A8:15,A9:7,B1:24,B2:21,B3:12,B4:15,C:17,M6:11};
function hex(n){return new THREE.Color(n);}
var PAL={
 light:{ground:0xdde3e6,site:0xc4cf92,plaza:0xe0ded6,green:0xaebf62,canal:0xa4cde0,road:0x8f949a,park:0x5a88c0,parkhaus:0x3f6ca6,bike:0x2f5f95,hatch:0x86aad4,p2:0x22487f,
  red:0xd6453d,orange:0xe2762c,yellow:0xf1bf3b,brown:0x8d5b3d,t1:0x4f8a3c,t2:0x6aa04a,trunk:0x6b4f35,pole:0x6d7278,sign:0xf5d90a,info:0xffffff,
  sky:0xffffff,gnd:0x8a8f80,hi:0.62,sun:0.42,dimMix:0xdde3e6,dimAmt:0.62},
 dark:{ground:0x151a20,site:0x2c3622,plaza:0x2b2d30,green:0x35472b,canal:0x1e3a4d,road:0x3a3d42,park:0x2d5081,parkhaus:0x24426e,bike:0x244a76,hatch:0x37597f,p2:0x16335c,
  red:0xc2423b,orange:0xd06a27,yellow:0xd8ab33,brown:0x86583b,t1:0x356230,t2:0x427339,trunk:0x4a3826,pole:0x8a9098,sign:0xe8c80a,info:0xffffff,
  sky:0x9fb0c8,gnd:0x20262c,hi:0.8,sun:0.4,dimMix:0x151a20,dimAmt:0.66}
};
var ORANGE=new THREE.Color(0xf47c06);
var CX=G.w/2, CZ=G.h/2;
var FOV=38, TANH=Math.tan(FOV*Math.PI/360);
var EL_TILT=0.92, EL_TOP=1.53, AZ0=-0.32;
var reduced=false; try{reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}

function wp(p){return [p[0]-CX,p[1]-CZ];}
function shapeOf(pts){var s=new THREE.Shape();pts.forEach(function(p,i){var q=wp(p);if(i)s.lineTo(q[0],-q[1]);else s.moveTo(q[0],-q[1]);});return s;}
function ext(pts,depth){var g=new THREE.ExtrudeGeometry(shapeOf(pts),{depth:depth,bevelEnabled:false});g.rotateX(-Math.PI/2);return g;}
function bboxOf(pts){var a=1e9,b=1e9,c=-1e9,d=-1e9;pts.forEach(function(p){a=Math.min(a,p[0]);b=Math.min(b,p[1]);c=Math.max(c,p[0]);d=Math.max(d,p[1]);});return {x1:a,y1:b,x2:c,y2:d};}
function pip(pt,poly){var x=pt[0],y=pt[1],ins=false;for(var i=0,j=poly.length-1;i<poly.length;j=i++){var xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))ins=!ins;}return ins;}
// zusammenführen: Geometrien mit Vertexfarben in eine einzige
function Merger(){this.pos=[];this.nor=[];this.col=[];}
Merger.prototype.add=function(geo,color,dy){
  var g=geo.index?geo.toNonIndexed():geo; var p=g.attributes.position.array,n=g.attributes.normal.array;
  for(var i=0;i<p.length;i+=3){this.pos.push(p[i],p[i+1]+(dy||0),p[i+2]);this.nor.push(n[i],n[i+1],n[i+2]);this.col.push(color.r,color.g,color.b);}
  if(g!==geo)g.dispose(); geo.dispose();
};
Merger.prototype.mesh=function(){
  var g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(this.pos,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(this.nor,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.col,3));
  return new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));
};
function rng(seed){return function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}

/* ---------- 3D-Steuerung (imperativ, three.js) ---------- */
var ctl={
  ok:null, nodes:{}, groups:[], bl:{}, picked:null, dark:false, host:null, cb:{}, running:false, W:1,H:1,
  cur:{tx:0,tz:0,dist:1500,az:AZ0,el:1.0}, goal:{tx:0,tz:0,dist:1500,az:AZ0,el:EL_TILT}, focus:[], pulseUntil:0, lastRender:0, lastT:0,
  init:function(){
    if(this.ok!==null)return this.ok;
    try{
      var r=new THREE.WebGLRenderer({antialias:true,powerPreference:'default'});
      r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
      this.renderer=r; this.scene=new THREE.Scene();
      this.camera=new THREE.PerspectiveCamera(FOV,1,10,6000);
      this.hemi=new THREE.HemisphereLight(0xffffff,0x888888,0.8); this.sun=new THREE.DirectionalLight(0xffffff,0.8); this.sun.position.set(-300,500,400);
      this.scene.add(this.hemi,this.sun);
      this.ray=new THREE.Raycaster(); this.root=new THREE.Group(); this.scene.add(this.root);
      this.build(this.dark?PAL.dark:PAL.light); this.ok=true;
    }catch(e){this.ok=false;}
    return this.ok;
  },
  build:function(P){
    var self=this, root=this.root;
    while(root.children.length){var o=root.children.pop(); if(o.geometry)o.geometry.dispose(); if(o.material)o.material.dispose();}
    this.P=P; this.scene.background=hex(P.ground);
    this.hemi.color.setHex(P.sky); this.hemi.groundColor.setHex(P.gnd); this.hemi.intensity=P.hi; this.sun.intensity=P.sun;
    var gp=new THREE.Mesh(new THREE.PlaneGeometry(8000,8000).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:P.ground})); gp.position.y=-0.5; root.add(gp);
    // flache Formen (eine Mesh, Vertexfarben)
    var m=new Merger(), top=2.5;
    function flat(pts,base,d,c){m.add(ext(pts,d),hex(c),base);}
    flat(G.site,0,top,P.site);
    flat(G.canal,0,1.2,P.canal);
    var rd=G.road, dx=rd.to[0]-rd.from[0], dy=rd.to[1]-rd.from[1], L=Math.sqrt(dx*dx+dy*dy), nx=-dy/L*14, ny=dx/L*14;
    flat([[rd.from[0]+nx,rd.from[1]+ny],[rd.to[0]+nx,rd.to[1]+ny],[rd.to[0]-nx,rd.to[1]-ny],[rd.from[0]-nx,rd.from[1]-ny]],0,1.2,P.road);
    for(var i=1;i<=7;i++){var a=(i-.5)/7.5,b=a+0.045; flat([[rd.from[0]+dx*a+2*nx/14,rd.from[1]+dy*a+2*ny/14],[rd.from[0]+dx*b+2*nx/14,rd.from[1]+dy*b+2*ny/14],[rd.from[0]+dx*b-2*nx/14,rd.from[1]+dy*b-2*ny/14],[rd.from[0]+dx*a-2*nx/14,rd.from[1]+dy*a-2*ny/14]],1.2,.15,0xe8e8e0);}
    flat(G.plaza,top,.4,P.plaza);
    G.green.forEach(function(g){flat(g,top,.6,P.green);});
    G.hatch.forEach(function(g){flat(g,top,.7,P.hatch);});
    G.parking.forEach(function(g,i){ if(i===0)flat(g,0,12,P.parkhaus); else flat(g,top,.8,P.park);});
    flat(G.bike,top,.8,P.bike);
    flat(G.p2,top,1.4,P.p2);
    root.add(m.mesh());
    // Bäume
    var t=new Merger(), R=rng(7), c1=hex(P.t1), c2=hex(P.t2), ct=hex(P.trunk), polys=G.buildings.map(function(b){return b.pts;}).concat(G.parking);
    function tree(x,y,k){
      var s=(0.8+R()*0.6)*0.62, q=wp([x,y]); var tg=new THREE.CylinderGeometry(.9*s,1.1*s,5*s,5); tg.translate(q[0],top+2.5*s,q[1]); t.add(tg,ct,0);
      if(k){var cg=new THREE.ConeGeometry(4.6*s,12*s,6); cg.translate(q[0],top+5*s+6*s,q[1]); t.add(cg,c1,0);}
      else{var sg=new THREE.IcosahedronGeometry(5.5*s,0); sg.translate(q[0],top+5*s+4*s,q[1]); t.add(sg,c2,0);}
    }
    G.green.forEach(function(g){var bb=bboxOf(g),n=Math.max(2,Math.round((bb.x2-bb.x1)*(bb.y2-bb.y1)/1700));
      for(var i=0;i<n;i++){var x=bb.x1+6+R()*(bb.x2-bb.x1-12),y=bb.y1+6+R()*(bb.y2-bb.y1-12),bad=false;
        for(var j=0;j<polys.length;j++){if(pip([x,y],polys[j])){bad=true;break;}} if(!bad)tree(x,y,R()<.45);}});
    var edge=[[0.18,0.2],[0.12,0.3],[0.2,0.1]]; // einige Bäume entlang Kanal/Rand
    for(var e=0;e<16;e++){var u=R(); var cx=G.canal; var x=cx[3][0]+(cx[2][0]-cx[3][0])*u+20, y=cx[3][1]+(cx[2][1]-cx[3][1])*u-18; if(pip([x,y],G.site))tree(x,y,R()<.5);}
    root.add(t.mesh());
    // Haltestellen & Info
    var st=new Merger(), cp=hex(P.pole), cs=hex(P.sign);
    G.stops.forEach(function(s){var q=wp(s); var pg=new THREE.CylinderGeometry(.9,.9,16,6); pg.translate(q[0],8,q[1]); st.add(pg,cp,0); var bg=new THREE.BoxGeometry(8,8,1.4); bg.translate(q[0],17,q[1]); st.add(bg,cs,0);});
    var iq=wp(G.info); var ip=new THREE.CylinderGeometry(.8,.8,8,6); ip.translate(iq[0],top+4,iq[1]); st.add(ip,cp,0); var ib=new THREE.SphereGeometry(3.6,10,8); ib.translate(iq[0],top+10,iq[1]); st.add(ib,hex(P.info),0);
    root.add(st.mesh());
    // Gebäude (je eine Mesh, damit sie einzeln leuchten/anheben können)
    var old=this.bl; this.bl={}; var bl=this.bl;
    G.buildings.forEach(function(b){
      var ht=HEIGHTS[b.id]||12, geo=ext(b.pts,ht), base=hex(P[b.col]);
      var mat=new THREE.MeshLambertMaterial({color:base.clone(),emissive:0xff7a00,emissiveIntensity:0});
      var mesh=new THREE.Mesh(geo,mat); mesh.userData.id=b.id; root.add(mesh);
      var o=old[b.id]||{}, q=wp([b.lx,b.ly]);
      bl[b.id]={wpts:b.pts.map(wp),id:b.id,mesh:mesh,mat:mat,base:base,h:ht,lx:q[0],lz:q[1],tgt:o.tgt||0,tgtG:o.tgtG||0,pick:o.pick||0,pickG:o.pickG||0,dim:o.dim||0,dimG:o.dimG||0,sy:o.sy||1};
    });
    this.applyState(true); this.requestRender();
  },
  setDark:function(d){ if(this.dark===d&&this.P)return; this.dark=d; if(this.ok)this.build(d?PAL.dark:PAL.light); },
  applyState:function(snap){
    var self=this, has=this.groups.length>0;
    G.buildings.forEach(function(b){var s=self.bl[b.id]; if(!s)return;
      var isT=self.groups.some(function(g){return g.b===b.id;}), isP=self.picked===b.id;
      s.tgtG=isT?1:0; s.pickG=isP?1:0; s.dimG=(has&&!isT&&!isP)?1:0;
      if(snap){s.tgt=s.tgtG;s.pick=s.pickG;s.dim=s.dimG;}
    });
    this.paint();
  },
  paint:function(t){
    var P=this.P, dm=hex(P.dimMix), pulse=this.pulseUntil>(t||performance.now())?(0.5+0.5*Math.sin((t||performance.now())/1000*4.2)):0.55;
    for(var id in this.bl){var s=this.bl[id];
      s.mat.color.copy(s.base).lerp(dm,s.dim*P.dimAmt).lerp(ORANGE,s.tgt);
      s.mat.emissiveIntensity=s.tgt*(0.12+0.3*pulse);
      s.sy=1+0.14*s.tgt+0.05*s.pick; s.mesh.scale.y=s.sy;
    }
  },
  setTargets:function(groups){
    this.groups=groups; this.pulseUntil=performance.now()+14000; this.picked=null; this.applyState(false); this.requestRender();
  },
  attach:function(host,cb){
    this.host=host; this.cb=cb; host.appendChild(this.renderer.domElement);
    var self=this, el=this.renderer.domElement, ps={}, drag=null;
    this.measure();
    if(window.ResizeObserver){this.ro=new ResizeObserver(function(){self.measure();self.requestRender();});this.ro.observe(host);}
    function pcount(){return Object.keys(ps).length;}
    function span(){var k=Object.keys(ps);var a=ps[k[0]],b=ps[k[1]];return {d:Math.hypot(a.x-b.x,a.y-b.y)||1,x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
    this.h_down=function(e){
      try{host.setPointerCapture(e.pointerId);}catch(x){}
      ps[e.pointerId]={x:e.clientX,y:e.clientY};
      drag={sx:e.clientX,sy:e.clientY,t:performance.now(),moved:false,pan:e.button===2||e.shiftKey||e.ctrlKey};
      if(pcount()===2){var s=span();drag.pinch={d:s.d,x:s.x,y:s.y,dist:self.goal.dist};drag.moved=true;}
      host.parentNode.classList.add('drag');
    };
    this.h_move=function(e){
      if(!ps[e.pointerId])return; var o=ps[e.pointerId], dx=e.clientX-o.x, dy=e.clientY-o.y; ps[e.pointerId]={x:e.clientX,y:e.clientY};
      if(!drag)return;
      if(pcount()>=2){var s=span(); if(drag.pinch){ self.setDist(drag.pinch.dist*drag.pinch.d/s.d,true); self.pan(s.x-drag.pinch.x,s.y-drag.pinch.y); drag.pinch.x=s.x;drag.pinch.y=s.y;} return;}
      if(!drag.moved&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)<6)return;
      drag.moved=true;
      if(drag.pan){self.pan(dx,dy);}
      else{var g=self.goal,c=self.cur; g.az-=dx*0.0085; g.el=Math.max(0.35,Math.min(EL_TOP,g.el+dy*0.006)); c.az=g.az; c.el=g.el; self.viewChanged();}
      self.requestRender();
    };
    this.h_up=function(e){
      var had=ps[e.pointerId]; delete ps[e.pointerId];
      if(pcount()===1&&drag){drag.pinch=null; var k=Object.keys(ps)[0]; drag.sx=ps[k].x;drag.sy=ps[k].y;}
      if(pcount()===0){host.parentNode.classList.remove('drag');
        if(drag&&had&&!drag.moved&&e.type==='pointerup'&&performance.now()-drag.t<700){self.pickAt(e.clientX,e.clientY);}
        drag=null;}
    };
    this.h_wheel=function(e){e.preventDefault(); self.setDist(self.goal.dist*Math.exp(e.deltaY*0.0016));};
    this.h_ctx=function(e){e.preventDefault();};
    host.addEventListener('pointerdown',this.h_down); host.addEventListener('pointermove',this.h_move);
    host.addEventListener('pointerup',this.h_up); host.addEventListener('pointercancel',this.h_up);
    host.addEventListener('wheel',this.h_wheel,{passive:false}); host.addEventListener('contextmenu',this.h_ctx);
  },
  detach:function(){
    var host=this.host; if(!host)return;
    host.removeEventListener('pointerdown',this.h_down); host.removeEventListener('pointermove',this.h_move);
    host.removeEventListener('pointerup',this.h_up); host.removeEventListener('pointercancel',this.h_up);
    host.removeEventListener('wheel',this.h_wheel); host.removeEventListener('contextmenu',this.h_ctx);
    if(this.ro)this.ro.disconnect(); if(this.renderer.domElement.parentNode===host)host.removeChild(this.renderer.domElement);
    this.host=null; this.cb={}; this.groups=[]; this.picked=null; this.applyState(true);
  },
  measure:function(){
    if(!this.host)return; var r=this.host.getBoundingClientRect(); var w=Math.max(1,Math.round(r.width)),hh=Math.max(1,Math.round(r.height));
    this.W=w;this.H=hh; this.renderer.setSize(w,hh,false); this.renderer.domElement.style.width='100%'; this.renderer.domElement.style.height='100%';
    this.camera.aspect=w/hh; this.camera.updateProjectionMatrix(); this.maxDist=this.fitDist(G.w/2+20,G.h/2+20)*1.1;
  },
  fitDist:function(hw,hh){var a=this.W/this.H; return Math.max(hh/TANH,hw/(TANH*a))*1.0;},
  setDist:function(d,both){var g=this.goal; g.dist=Math.max(75,Math.min(this.maxDist||2500,d)); if(both)this.cur.dist=g.dist; this.requestRender();},
  zoom:function(f){this.setDist(this.goal.dist*f);},
  pan:function(dx,dy){
    var g=this.goal,c=this.cur, s=2*c.dist*TANH/this.H, ca=Math.cos(c.az), sa=Math.sin(c.az);
    var rx=ca, rz=-sa, fx=-sa, fz=-ca; var lim=G.w*0.6,limz=G.h*0.6;
    g.tx=Math.max(-lim,Math.min(lim,g.tx-rx*dx*s+fx*dy*s*1/Math.max(Math.sin(c.el),.4))); g.tz=Math.max(-limz,Math.min(limz,g.tz-rz*dx*s+fz*dy*s/Math.max(Math.sin(c.el),.4)));
    c.tx=g.tx;c.tz=g.tz; this.requestRender();
  },
  focusOn:function(ids,opts){
    opts=opts||{}; this.focus=ids; var a=1e9,b=1e9,c=-1e9,d=-1e9;
    ids.forEach(function(id){var bb=G.buildings.filter(function(x){return x.id===id;})[0]; if(!bb)return; var q=bboxOf(bb.pts); a=Math.min(a,q.x1);b=Math.min(b,q.y1);c=Math.max(c,q.x2);d=Math.max(d,q.y2);});
    var g=this.goal;
    if(a>1e8){g.tx=0;g.tz=0;g.dist=this.maxDist/1.1;}
    else{var p1=wp([a,b]),p2=wp([c,d]); g.tx=(p1[0]+p2[0])/2; g.tz=(p1[1]+p2[1])/2;
      var hw=(p2[0]-p1[0])/2+60, hh=(p2[1]-p1[1])/2+60; g.dist=Math.max(110,this.fitDist(Math.max(hw,hh*0.8),Math.max(hh,hw*0.8))*1.12);}
    g.dist=Math.min(g.dist,this.maxDist);
    if(opts.az!==undefined)g.az=opts.az; if(opts.el!==undefined)g.el=opts.el;
    this.viewChanged(); this.requestRender();
  },
  openOn:function(ids){
    var c=this.cur; c.tx=0;c.tz=0;c.dist=this.maxDist||1500;c.az=AZ0*1.0;c.el=1.1; this.goal.az=AZ0; this.goal.el=EL_TILT;
    this.focusOn(ids,{az:AZ0,el:EL_TILT});
    if(reduced){for(var k in this.goal)this.cur[k]=this.goal[k];}
  },
  reset:function(){this.focusOn(this.focus,{az:AZ0,el:EL_TILT});},
  setView:function(top){this.goal.el=top?EL_TOP:EL_TILT; if(top&&Math.abs(this.goal.az)>0.01&&Math.abs(this.goal.az)<1.2)this.goal.az=0; this.viewChanged(); this.requestRender();},
  viewChanged:function(){var t=this.goal.el>1.2; if(t!==this._top){this._top=t; if(this.cb.onView)this.cb.onView(t);}},
  setPicked:function(id){this.picked=id; this.applyState(false); this.requestRender();},
  pickAt:function(x,y){
    var r=this.renderer.domElement.getBoundingClientRect(); var v=new THREE.Vector2(((x-r.left)/r.width)*2-1,-((y-r.top)/r.height)*2+1);
    this.ray.setFromCamera(v,this.camera); var ms=[]; for(var id in this.bl)ms.push(this.bl[id].mesh);
    var hit=this.ray.intersectObjects(ms,false)[0]; var id2=hit?hit.object.userData.id:null;
    if(this.cb.onPick)this.cb.onPick(id2);
  },
  requestRender:function(){ if(this.running||!this.ok||!this.host)return; this.running=true; var self=this; requestAnimationFrame(function f(t){self.frame(t,f);}); },
  frame:function(t,f){
    var self=this; if(!this.host){this.running=false;return;}
    var dt=Math.min(0.06,Math.max(0.001,(t-(this.lastT||t))/1000)); this.lastT=t;
    var k=reduced?1:1-Math.exp(-dt*4.2), busy=false, c=this.cur, g=this.goal;
    ['tx','tz','dist','el'].forEach(function(key){var d=g[key]-c[key]; var tol=key==='dist'?g.dist*0.002:(key==='el'?0.002:0.15); if(Math.abs(d)>tol){c[key]+=d*k;busy=true;}else c[key]=g[key];});
    var da=g.az-c.az; if(Math.abs(da)>0.002){c.az+=da*k;busy=true;}else c.az=g.az;
    var k2=reduced?1:1-Math.exp(-dt*6);
    for(var id in this.bl){var s=this.bl[id];
      ['tgt','pick','dim'].forEach(function(n){var d=s[n+'G']-s[n]; if(Math.abs(d)>0.004){s[n]+=d*k2;busy=true;}else s[n]=s[n+'G'];});}
    var pulsing=!reduced&&this.pulseUntil>t;
    if(!(pulsing&&!busy&&t-this.lastRender<33)){
      this.paint(t); this.lastRender=t;
      var co=Math.cos(c.el),p=this.camera.position;
      p.set(c.tx+c.dist*Math.sin(c.az)*co,c.dist*Math.sin(c.el),c.tz+c.dist*Math.cos(c.az)*co); this.camera.lookAt(c.tx,0,c.tz);
      this.camera.near=Math.max(10,c.dist*0.08); this.camera.far=c.dist*6+3000; this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene,this.camera); this.layout();
    }
    if(busy||pulsing){requestAnimationFrame(f);} else {this.running=false; if(this.pulseUntil&&this.pulseUntil<=t){this.pulseUntil=0;this.paint(t);this.renderer.render(this.scene,this.camera);}}
  },
  topOf:function(s,proj){
    var pts=s.wpts, mx=1e9,Mx=-1e9;
    var q0=proj(s.lx,s.h*s.sy,s.lz), top=1e9;
    for(var i=0;i<pts.length;i++){var q=proj(pts[i][0],s.h*s.sy,pts[i][1]); if(q.y<top)top=q.y; mx=Math.min(mx,q.x);Mx=Math.max(Mx,q.x);}
    return {x:(mx+Mx)/2,y:top,ok:q0.ok};
  },
  layout:function(){
    var self=this,W=this.W,H=this.H,cam=this.camera,nodes=this.nodes,placed=[],v=new THREE.Vector3();
    function proj(x,y,z){v.set(x,y,z).project(cam);return {x:(v.x+1)/2*W,y:(1-v.y)/2*H,ok:v.z<1};}
    function hit(r){for(var i=0;i<placed.length;i++){var q=placed[i];if(r.x<q.x+q.w+3&&r.x+r.w+3>q.x&&r.y<q.y+q.h+3&&r.y+r.h+3>q.y)return true;}return false;}
    function put(n,x,y,show){n.style.transform='translate3d('+Math.round(x)+'px,'+Math.round(y)+'px,0)';n.style.visibility=show?'visible':'hidden';}
    var tset={};
    this.groups.forEach(function(g){tset[g.b]=1;});
    var gs=this.groups.map(function(g){var s=self.bl[g.b],n=nodes['g:'+g.b]; if(!s||!n)return null;
      var p=self.topOf(s,proj), cnt=Math.max(1,g.labels.length), w=0; g.labels.forEach(function(l){w=Math.max(w,l.length*8.4+26);});
      n.style.width=w+'px'; return {g:g,n:n,p:p,w:w,h:cnt*28+(cnt-1)*4};}).filter(Boolean);
    gs.sort(function(a,b){return b.p.y-a.p.y;});
    gs.forEach(function(o){
      var x=Math.max(6,Math.min(W-o.w-6,o.p.x-o.w/2)), y=o.p.y-o.h-10, tries=0, r;
      for(;;){ y=Math.max(6,Math.min(H-o.h-70,y)); r={x:x,y:y,w:o.w,h:o.h}; if(!hit(r)||tries>10)break; y-=o.h+10; tries++; if(y<6){y=o.p.y+14;} }
      placed.push(r); put(o.n,x,y,true);
    });
    var order=[]; if(this.picked)order.push(this.picked); G.buildings.forEach(function(b){if(b.id!==self.picked)order.push(b.id);});
    order.forEach(function(id){var n=nodes['b:'+id],s=self.bl[id]; if(!n||!s)return;
      if(tset[id]){put(n,0,0,false);return;}
      var p=proj(s.lx,s.h*s.sy+1,s.lz), w=id.length*7+14, r={x:p.x-w/2,y:p.y-10,w:w,h:20};
      var ok=p.ok&&r.x>2&&r.y>2&&r.x+w<W-2&&r.y<H-2&&!hit(r); n.classList.toggle('pk',id===self.picked);
      if(ok||id===self.picked){placed.push(r);} put(n,r.x,r.y,ok||id===self.picked);});
    [['p:canal',G.canalLabel,0,150],['p:street',G.streetLabel,0,150],['p:info',G.info,13,22]].forEach(function(a){var n=nodes[a[0]]; if(!n)return;
      var q=wp(a[1]),p=proj(q[0],a[2],q[1]),w=a[3],r={x:p.x-w/2,y:p.y-10,w:w,h:20}; var ok=p.ok&&r.x>2&&r.x+w<W-2&&r.y>2&&r.y<H-2&&!hit(r); if(ok)placed.push(r); put(n,r.x,r.y,ok);});
  }
};

/* ---------- Oberfläche ---------- */
var ov=null, dlg=null, ret=null, state=null, T=null, onKey=null;
var esc=function(t){ return String(t).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
function isDark(){ return document.documentElement.getAttribute('data-theme')==='dark'; }
// rooms: [{room:'B1-106', b:'B1'}], building: 'C' (nur ein Gebäude ohne Raum)
function targetsOf(info){
  var groups=[], items=[];
  (info.rooms||[]).forEach(function(r){ var g=groups.filter(function(x){ return x.b===r.b; })[0]; if(!g){ g={b:r.b,labels:[]}; groups.push(g); } g.labels.push('Raum '+r.room); items.push({label:'Raum '+r.room,b:r.b,key:r.room}); });
  if(!groups.length&&info.building){ groups.push({b:info.building,labels:['Gebäude '+info.building]}); items.push({label:'Gebäude '+info.building,b:info.building,key:info.building}); }
  return {groups:groups,items:items};
}
var LEG=[['#ff9a1f','Zielgebäude (leuchtet orange, leicht angehoben)'],['#d6453d','Rot: C, B1, A3'],['#e2762c','Orange: M6, A4, A6, A8, A9'],['#f1bf3b','Gelb: B4, A1, A2, A7'],['#8d5b3d','Braun: B2, B3'],['#5a88c0','Parkplatz, Parkhaus (blau)'],['#aebf62','Rasen und Wege'],['#a4cde0','Dortmund-Ems-Kanal'],['#2f5f95','Fahrradweg']];
function q(sel){ return dlg.querySelector(sel); }
function paintUi(){
  var s=state, pk=s.picked, rooms=pk?T.items.filter(function(i){ return i.b===pk; }).map(function(i){ return i.key; }):[];
  var t=q('.rp-toast'); if(t){ t.hidden=!pk; t.textContent=pk?'Gebäude '+pk+(rooms.length?' · '+(rooms.length>1?'Räume ':'Raum ')+rooms.join(', '):''):''; }
  dlg.querySelectorAll('.rp-chip').forEach(function(b){ b.setAttribute('aria-pressed',String(+b.dataset.i===s.active)); });
  var v=q('[data-a="view"]'); if(v){ v.textContent=s.top?'Schrägansicht':'Draufsicht'; v.setAttribute('aria-label',v.textContent); }
  var lg=q('[data-a="legend"]'); if(lg) lg.setAttribute('aria-expanded',String(s.legend)); var l=q('.rp-legend'); if(l) l.hidden=!s.legend;
  dlg.querySelectorAll('.rp-rchip').forEach(function(c){ var a=s.active>=0?T.items[s.active]:null; c.classList.toggle('on',!!a&&a.label===c.dataset.l&&a.b===c.dataset.b); });
}
function select(i){ state.active=i; state.picked=null; if(ctl.ok){ ctl.setPicked(null); ctl.focusOn(i<0?T.groups.map(function(g){ return g.b; }):[T.items[i].b]); } paintUi(); }
function pick(id,fly){ state.picked=id; if(ctl.ok){ ctl.setPicked(id); if(fly) ctl.focusOn([id]); } paintUi(); }
function build(info){
  var bids=T.groups.map(function(g){ return g.b; }), multi=T.items.length>1, gl=state.gl;
  var chips='<span class="rp-lab">'+(multi?'Räume':'Raum')+'</span>'+(multi?'<button type="button" class="rp-chip" data-i="-1" aria-pressed="false">Alle</button>':'')+T.items.map(function(it,i){ return '<button type="button" class="rp-chip" data-i="'+i+'" aria-pressed="false" aria-label="'+esc(it.label)+', Gebäude '+it.b+' anzeigen">'+esc(it.label.replace(/^(Raum|Gebäude) /,''))+'</button>'; }).join('');
  var labels='<div class="rp-labels" aria-hidden="true">'+G.buildings.map(function(b){ return '<span class="rp-bid" data-n="b:'+b.id+'">'+b.id+'</span>'; }).join('')+'<span class="rp-poi" data-n="p:canal">Dortmund-Ems-Kanal</span><span class="rp-poi" data-n="p:street">Wolbecker Straße</span><span class="rp-poi i" data-n="p:info">i</span>'
    +T.groups.map(function(g){ return '<div class="rp-grp" data-n="g:'+g.b+'">'+g.labels.map(function(l){ return '<span class="rp-rchip" data-l="'+esc(l)+'" data-b="'+g.b+'">'+esc(l)+'</span>'; }).join('')+'</div>'; }).join('')+'</div>';
  var plan;
  if(gl===false) plan='<div class="rp-nogl"><div class="rp-warn" role="alert">Die 3D-Ansicht wird auf diesem Gerät nicht unterstützt (WebGL fehlt). Die Gebäude der Einheit: <b>'+bids.join(', ')+'</b>.</div><h3>Alle Gebäude</h3><div class="rp-blist">'+G.buildings.map(function(b){ return '<span class="rp-chip'+(bids.indexOf(b.id)>=0?' tg':'')+'">Gebäude '+b.id+'</span>'; }).join('')+'</div></div>';
  else plan='<div class="rp-host" role="img" aria-label="Dreidimensionale Karte des Geländes. Zielgebäude: '+bids.join(', ')+'. Ziehen dreht die Ansicht, Mausrad oder Zwei-Finger-Geste zoomt."></div>'+labels+'<div class="rp-toast" role="status" hidden></div>'
    +'<div class="rp-ctrls"><button type="button" class="rp-cb sq" data-a="in" aria-label="Vergrößern">+</button><button type="button" class="rp-cb sq" data-a="out" aria-label="Verkleinern">−</button></div>'
    +'<div class="rp-ctrls2"><button type="button" class="rp-cb" data-a="reset">Zurücksetzen</button><button type="button" class="rp-cb" data-a="view">Draufsicht</button><button type="button" class="rp-cb" data-a="legend" aria-expanded="false" aria-controls="rp-legend">Legende</button></div>'
    +'<div class="rp-legend" id="rp-legend" role="region" aria-label="Legende" hidden><h3>Legende</h3><ul>'+LEG.map(function(a){ return '<li><span class="rp-sw" style="background:'+a[0]+'"></span>'+a[1]+'</li>'; }).join('')+'<li><span class="rp-sw round" style="background:#f5d90a"></span>Haltestelle (gelbes Schild am Mast)</li><li><span class="rp-sw round" style="background:#fff"></span>Info am Eingang A1/A2</li></ul></div>';
  var kb='<div class="rp-sr"><p>Gebäudeliste für die Tastatur</p><ul>'+G.buildings.map(function(b){ return '<li><button type="button" data-b="'+b.id+'" aria-label="Gebäude '+b.id+(bids.indexOf(b.id)>=0?', Ziel dieser Einheit':'')+'">Gebäude '+b.id+'</button></li>'; }).join('')+'</ul></div>';
  ov.innerHTML='<div class="rp-dlg" role="dialog" aria-modal="true" aria-label="'+esc(info.title)+', Raumplan"><div class="rp-head"><div class="rp-ht"><div class="rp-time">'+esc(info.time||'')+'</div><div class="rp-title">'+esc(info.title)+'</div></div><button type="button" class="rp-close" data-a="close" aria-label="Schließen">Schließen</button></div>'
    +'<div class="rp-plan">'+plan+kb+'</div><div class="rp-chips" role="group" aria-label="Räume dieser Einheit">'+chips+'</div></div>';
  dlg=ov.querySelector('.rp-dlg');
}
function open(info,from){
  close(true); ret=from||document.activeElement; T=targetsOf(info); if(!T.groups.length) return;
  state={gl:null,top:false,legend:false,picked:null,active:T.items.length===1?0:-1};
  ov=document.createElement('div'); ov.className='rp-back'; document.body.appendChild(ov);
  var ok=ctl.init(); state.gl=ok; build(info); document.body.classList.add('rp-lock');
  var host=q('.rp-host');
  if(ok&&host){
    q('.rp-labels').querySelectorAll('[data-n]').forEach(function(n){ ctl.nodes[n.dataset.n]=n; });
    ctl.attach(host,{onPick:function(id){ pick(id,false); },onView:function(t){ state.top=t; paintUi(); }});
    ctl.setDark(isDark()); ctl.setTargets(T.groups); ctl.openOn(T.groups.map(function(g){ return g.b; }));
  }
  paintUi();
  ov.addEventListener('click',function(e){
    if(e.target===ov){ close(); return; }
    var b=e.target.closest('button'); if(!b) return;
    var a=b.dataset.a;
    if(a==='close') close();
    else if(a==='in') ctl.zoom(0.7); else if(a==='out') ctl.zoom(1/0.7);
    else if(a==='reset'){ ctl.reset(); select(state.active); }
    else if(a==='view') ctl.setView(!state.top);
    else if(a==='legend'){ state.legend=!state.legend; paintUi(); }
    else if(b.classList.contains('rp-chip')&&b.dataset.i!=null) select(+b.dataset.i);
    else if(b.dataset.b) pick(b.dataset.b,true);
  });
  var kbs=ov.querySelector('.rp-sr'); if(kbs) kbs.addEventListener('focusin',function(e){ var b=e.target.closest('button[data-b]'); if(b) pick(b.dataset.b,false); });
  onKey=function(e){
    if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); close(); return; }
    if(e.key==='Tab'&&dlg){ var f=dlg.querySelectorAll('button:not([disabled])'); if(!f.length) return; var a=f[0], z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey&&document.activeElement===z){ e.preventDefault(); a.focus(); } }
  };
  document.addEventListener('keydown',onKey,true);
  var cb=q('.rp-close'); if(cb) cb.focus({preventScroll:true});
  if(typeof A11Y!=='undefined') A11Y.say('Raumplan geöffnet: '+T.items.map(function(i){ return i.label; }).join(', '));
}
function close(quiet){
  if(!ov) return;
  if(ctl.ok&&ctl.host) ctl.detach();
  document.removeEventListener('keydown',onKey,true); ov.remove(); ov=null; dlg=null; state=null; onKey=null;
  document.body.classList.remove('rp-lock');
  if(!quiet&&ret&&ret.isConnected) try{ ret.focus({preventScroll:true}); }catch(e){}
}
return {open:open,close:close,isOpen:function(){ return !!ov; },_ctl:ctl,_geo:G};
})();
