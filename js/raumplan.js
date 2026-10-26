/* ======================================================================
   Raumplan IdF Münster in 3D (Stundenplan): Tipp auf eine Einheit mit Raum öffnet das Gelände, das passende Gebäude leuchtet.
   Wird erst beim ersten Tipp geladen (zusammen mit js/three.min.js) und danach vom Service Worker zwischengespeichert.
   Das Gelände ist nach dem Raumplan-Aushang des Instituts nachgezeichnet; die Gebäudehöhen sind geschätzt.
   ====================================================================== */
const RAUMPLAN=(function(){
'use strict';

/* ---------- Gelände (nachgezeichnet nach der Übersichtskarte des Instituts) ---------- */
var G={"w":627,"h":928,"buildings":[{"id":"C","kind":"C","col":"coral","pts":[[220.9,353.3],[265.6,385.5],[232.3,494.1],[178.1,498.7],[122.9,461.0]],"lx":195.1,"ly":453.0},{"id":"A3","kind":"A","col":"coral","pts":[[358.7,510.8],[406.6,471.5],[434.5,474.7],[446.9,512.1],[437.5,552.0],[402.0,560.3],[361.9,551.1]],"lx":406.9,"ly":520.3},{"id":"B1","kind":"B","col":"coral","pts":[[425.4,421.6],[451.3,376.0],[497.6,412.6],[458.5,450.7]],"lx":459.3,"ly":413.9},{"id":"A7","kind":"A","col":"coral","pts":[[540.5,761.1],[541.4,786.4],[509.0,793.5],[508.2,767.7]],"lx":520.1,"ly":778.2},{"id":"B2","kind":"B","col":"gray","pts":[[313.5,286.5],[416.9,371.7],[425.5,397.9],[382.6,448.8],[261.7,339.6]],"lx":377.8,"ly":389.9},{"id":"B3","kind":"B","col":"gray","pts":[[414.9,216.5],[431.9,232.3],[437.2,256.0],[393.4,306.0],[343.4,265.5],[389.1,211.4]],"lx":403.3,"ly":245.7},{"id":"B4","kind":"B","col":"red","pts":[[412.7,200.1],[465.0,172.2],[540.7,248.6],[503.7,287.7]],"lx":467.8,"ly":214.0},{"id":"M6","kind":"M","col":"blue","pts":[[349.3,460.9],[350.1,517.1],[295.2,519.6],[294.8,461.6]],"lx":322.4,"ly":492.1},{"id":"A4","kind":"A","col":"blue","pts":[[361.7,633.7],[327.5,640.3],[316.3,519.4],[350.4,515.2]],"lx":334.6,"ly":535.3},{"id":"A6","kind":"A","col":"blue","pts":[[525.6,629.6],[524.0,712.1],[491.7,715.6],[493.6,631.4]],"lx":508.3,"ly":693.2},{"id":"A8","kind":"A","col":"blue","pts":[[323.3,639.7],[336.8,779.8],[526.0,746.8],[524.9,711.4],[373.5,737.3],[361.8,632.0]],"lx":356.7,"ly":753.5},{"id":"A9","kind":"A","col":"blue","pts":[[453.5,753.5],[448.4,777.2],[417.0,774.6],[422.4,750.4]],"lx":431.6,"ly":763.7},{"id":"A2","kind":"A","col":"teal","pts":[[473.8,518.9],[476.6,623.1],[445.3,626.6],[442.8,520.5]],"lx":460.7,"ly":608.2},{"id":"A1","kind":"A","col":"teal","pts":[[518.9,525.8],[519.7,551.2],[475.3,554.4],[474.6,528.2]],"lx":487.1,"ly":540.5}],"parking":[[[459.0,161.6],[541.0,244.8],[581.4,199.7],[561.7,174.1],[549.6,169.9],[498.1,122.4]],[[85.9,503.9],[85.9,508.5],[111.9,526.4],[117.1,526.2],[121.4,522.2],[121.4,518.5],[97.4,502.0],[89.5,500.8]],[[106.4,482.2],[109.8,488.9],[151.0,515.0],[159.3,516.2],[162.6,512.4],[162.6,508.7],[147.8,498.2],[136.1,497.8],[127.8,486.2],[116.8,479.0],[110.8,478.3]],[[228.5,436.6],[235.3,442.2],[239.8,442.2],[264.9,414.1],[264.9,411.3],[259.1,406.5],[254.6,405.7],[228.5,433.8]],[[244.8,331.2],[249.3,332.2],[296.2,279.2],[296.8,271.5],[289.2,273.4],[242.6,325.7]],[[263.6,432.5],[265.1,442.1],[335.6,442.5],[334.8,434.6],[323.9,433.3],[317.5,420.6],[277.3,419.6],[276.7,430.5]],[[330.4,235.8],[339.1,237.4],[413.5,152.9],[403.9,153.1]],[[341.3,259.7],[345.9,258.9],[378.7,221.6],[379.8,213.2],[376.1,213.3],[340.0,255.1]],[[403.5,193.5],[407.8,197.6],[410.9,198.1],[418.5,190.8],[419.6,186.3],[418.4,186.1],[414.1,181.3],[411.7,181.0],[403.4,189.9]],[[456.4,347.2],[462.3,350.5],[483.8,324.5],[483.7,321.5],[478.0,318.2],[456.3,344.2]],[[463.2,361.4],[463.9,368.0],[504.5,402.7],[507.9,403.3],[511.1,399.9],[509.9,396.3],[468.3,361.0]],[[491.0,339.6],[481.2,350.9],[481.3,353.3],[506.5,375.6],[509.8,376.3],[512.4,372.9],[511.9,355.4],[494.3,339.8]],[[503.3,309.6],[505.5,310.3],[505.6,313.2],[509.5,315.8],[514.4,315.6],[514.2,309.9],[517.4,309.5],[517.9,306.1],[513.9,301.2],[509.6,300.3],[509.1,301.4],[505.8,301.1],[503.7,303.3]],[[549.8,645.4],[553.0,691.1],[560.6,691.1],[558.0,646.7],[556.8,644.4]]],"hatch":[[[331.1,778.0],[340.7,810.4],[373.3,811.4],[374.5,802.7],[379.3,801.0],[378.8,812.3],[398.2,812.3],[407.2,766.3],[376.7,770.8],[377.6,781.1],[372.9,782.7],[371.3,771.1]],[[412.1,814.8],[439.7,816.2],[440.1,806.0],[444.5,804.3],[444.8,817.1],[456.7,816.5],[462.6,781.0],[443.9,779.5],[444.5,803.0],[440.1,804.6],[437.0,778.2],[417.8,776.6]]],"bike":[[555.4,757.5],[550.7,624.5],[563.5,622.9],[568.3,754.8]],"canal":[[-53.3,409.9],[369.9,-27.9],[428.1,28.4],[4.9,466.2]],"site":[[596.4,246.6],[584.9,897.3],[168.7,852.6],[97.3,767.8],[80.1,647.3],[56.7,432.8],[396.5,81.3],[588.3,120.5]],"plaza":[],"green":[[[81.4,625.3],[257.5,608.3],[239.2,527.8],[81.5,504.1],[138.8,477.8],[120.4,456.6],[298.0,239.3],[408.6,146.8],[374.9,110.7],[56.7,432.8]],[[80.1,647.3],[97.3,767.8],[304.5,781.6],[259.9,626.7]],[[152.0,493.6],[155.2,500.9],[173.2,509.0],[188.5,508.5],[191.7,501.1],[222.3,500.1],[222.3,497.3],[187.8,497.7],[183.7,501.4],[178.1,501.6],[157.8,487.6],[153.7,487.7]],[[161.4,798.5],[174.0,806.3],[315.7,814.9],[309.8,803.8],[176.6,794.2]],[[168.7,852.6],[584.9,897.3]],[[262.4,505.7],[269.8,508.9],[266.6,459.3],[333.1,459.8],[333.7,454.4],[322.7,450.6],[256.3,450.4],[253.3,465.0]],[[268.3,519.4],[276.9,608.7],[294.9,676.9],[301.5,684.5],[325.1,682.0],[322.2,599.0],[307.2,592.7],[294.1,560.4],[297.4,523.6]],[[308.2,706.3],[306.1,715.2],[324.0,775.1],[332.5,774.2],[327.5,703.5]],[[310.1,518.2],[307.3,521.1],[312.1,580.5],[315.7,589.2],[320.0,590.2],[314.4,520.1]],[[338.6,814.5],[341.6,821.0],[390.5,827.3],[395.1,826.2],[397.0,822.3],[395.6,815.7]],[[354.2,473.3],[356.7,508.2],[388.2,507.6],[388.0,501.7],[360.5,500.8],[356.8,473.2]],[[372.3,573.7],[379.4,689.0],[397.8,682.9],[381.0,699.7],[381.8,711.9],[436.1,708.6],[435.1,667.7],[426.3,665.6],[432.1,643.8],[426.9,574.6]],[[399.0,440.4],[400.4,444.2],[420.4,447.3],[422.5,458.0],[462.8,458.1],[441.4,435.3],[436.9,424.2],[431.6,426.6],[429.4,438.4],[424.6,443.5],[415.3,442.2],[409.5,430.3]],[[396.5,81.3],[469.2,142.2],[498.0,119.1],[585.2,196.6],[535.3,333.1],[563.5,770.2],[553.7,338.2],[596.4,246.6],[588.3,120.5]],[[408.4,828.1],[477.5,837.8],[491.1,827.9],[499.9,841.7],[542.2,844.7],[540.3,788.6],[508.4,792.4],[507.0,765.4],[538.8,760.8],[537.8,745.2],[464.5,757.4],[461.0,742.8],[442.5,745.5],[453.9,752.1],[451.4,775.9],[465.0,779.2],[459.2,818.6],[413.4,818.0]],[[415.4,384.0],[424.7,392.3],[453.4,367.6],[499.9,412.7],[477.7,429.3],[469.5,447.6],[485.4,459.0],[520.6,456.7],[518.0,412.3],[454.6,367.0],[457.7,350.9],[437.9,363.9],[424.6,357.8]],[[439.7,541.6],[432.0,554.9],[438.9,643.0],[459.1,643.1],[441.2,659.1],[455.2,678.1],[444.7,705.3],[485.9,703.2],[483.7,645.8],[464.5,641.2],[481.3,624.5],[476.5,554.9],[476.0,624.4],[450.2,626.7]],[[436.9,474.1],[437.9,489.1],[447.5,490.1],[449.3,513.9],[453.5,513.7],[459.7,500.9],[466.2,476.5],[463.2,474.1]],[[476.6,475.0],[461.9,517.0],[469.3,526.0],[520.1,526.3],[521.4,552.3],[501.8,553.7],[494.7,564.8],[527.1,589.7],[519.6,477.6]],[[532.9,698.7],[534.5,696.6],[533.5,665.5],[530.0,661.0],[525.5,661.7],[524.5,664.9],[526.6,694.1],[523.2,695.3],[522.8,699.1]]],"stops":[[405.2,868.0],[490.8,837.9]],"p2":[],"info":[492.7,553.8],"road":{"from":[158.6,841.4],"to":[582.3,898.1]},"canalLabel":[160.6,247.6],"streetLabel":[370.4,869.8],"poi":[{"k":"P1","pt":[282.2,403.5]},{"k":"P2","pt":[437.2,305.6]},{"k":"P3","pt":[411.3,456.8]},{"k":"P4","pt":[506.5,614.1]},{"k":"P5","pt":[185.2,527.5]},{"k":"P6","pt":[310.4,251.5]},{"k":"P7","pt":[500.4,163.3]},{"k":"S1","pt":[434.1,648.8]},{"k":"S2","pt":[318.8,404.1]},{"k":"S3","pt":[456.9,277.5]}]};

/* ---------- 3D ---------- */
var HEIGHTS={A1:9,A2:9,A3:17,A4:14,A6:10,A7:6,A8:13,A9:7,B1:20,B2:22,B3:19,B4:20,C:17,M6:11};
function hex(n){return new THREE.Color(n);}
var PAL={
 light:{ground:0xdde3e6,site:0xe3e5dc,plaza:0xe3e5dc,green:0xaab55a,canal:0xa4cde0,road:0x8f949a,park:0x7b6fb0,parkhaus:0x5e5096,bike:0x7b6fb0,hatch:0xa79bd6,p2:0x22487f,
  coral:0xe58a73,gray:0x7a7573,red:0xd2463f,blue:0x5fb0e3,teal:0x5fc09a,t1:0x4f8a3c,t2:0x6aa04a,trunk:0x6b4f35,pole:0x6d7278,sign:0xf5d90a,info:0xffffff,
  sky:0xffffff,gnd:0x8a8f80,hi:0.62,sun:0.42,dimMix:0xdde3e6,dimAmt:0.62},
 dark:{ground:0x151a20,site:0x2a2d30,plaza:0x2a2d30,green:0x3a4a2c,canal:0x1e3a4d,road:0x3a3d42,park:0x4a4478,parkhaus:0x3a3262,bike:0x4a4478,hatch:0x5c5590,p2:0x16335c,
  coral:0xc07360,gray:0x6a6665,red:0xb83e38,blue:0x4b8fbd,teal:0x4a9c7d,t1:0x356230,t2:0x427339,trunk:0x4a3826,pole:0x8a9098,sign:0xe8c80a,info:0xffffff,
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
    if(G.plaza.length)flat(G.plaza,top,.4,P.plaza);
    G.green.forEach(function(g){flat(g,top,.6,P.green);});
    G.hatch.forEach(function(g){flat(g,top,.7,P.hatch);});
    G.parking.forEach(function(g,i){ if(i===0)flat(g,0,22,P.parkhaus); else flat(g,top,.8,P.park);});
    flat(G.bike,top,.8,P.bike);
    root.add(m.mesh());
    // Bäume
    var t=new Merger(), R=rng(7), c1=hex(P.t1), c2=hex(P.t2), ct=hex(P.trunk), polys=G.buildings.map(function(b){return b.pts;}).concat(G.parking);
    function tree(x,y,k){
      var s=(0.8+R()*0.6)*0.62, q=wp([x,y]); var tg=new THREE.CylinderGeometry(.9*s,1.1*s,5*s,5); tg.translate(q[0],top+2.5*s,q[1]); t.add(tg,ct,0);
      if(k){var cg=new THREE.ConeGeometry(4.6*s,12*s,6); cg.translate(q[0],top+5*s+6*s,q[1]); t.add(cg,c1,0);}
      else{var sg=new THREE.IcosahedronGeometry(5.5*s,0); sg.translate(q[0],top+5*s+4*s,q[1]); t.add(sg,c2,0);}
    }
    G.green.forEach(function(g){var bb=bboxOf(g),n=Math.max(2,Math.round((bb.x2-bb.x1)*(bb.y2-bb.y1)/1300));
      for(var i=0;i<n;i++){var x=bb.x1+6+R()*(bb.x2-bb.x1-12),y=bb.y1+6+R()*(bb.y2-bb.y1-12),bad=false;
        if(!pip([x,y],g))bad=true; for(var j=0;j<polys.length&&!bad;j++){if(pip([x,y],polys[j])){bad=true;break;}} if(!bad)tree(x,y,R()<.45);}});
    var cc=G.canal, ix=cc[3][0], iy=cc[3][1], jx=cc[2][0], jy=cc[2][1], ln=Math.hypot(jx-ix,jy-iy)||1, ux=(jx-ix)/ln, uy=(jy-iy)/ln;
    for(var e=0;e<14;e++){var u=R()*ln; var x=ix+ux*u-uy*18, y=iy+uy*u+ux*18; if(pip([x,y],G.site))tree(x,y,R()<.5);}
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
    G.poi.forEach(function(o){var n=nodes['q:'+o.k]; if(!n)return; var q=wp(o.pt),p=proj(q[0],4,q[1]),w=o.k.length*8+12,r={x:p.x-w/2,y:p.y-9,w:w,h:18}; var ok=p.ok&&r.x>2&&r.x+w<W-2&&r.y>2&&r.y<H-2&&!hit(r); if(ok)placed.push(r); put(n,r.x,r.y,ok);});
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
var LEG=[['#ff9a1f','Zielgebäude (leuchtet orange, leicht angehoben)'],['#e58a73','Unterrichtsgebäude: C, A3, B1 · A7 mit Pforte'],['#d2463f','Sporthalle: B4'],['#7a7573','Werkstatt, Fahrzeughalle: B2, B3'],['#5fb0e3','Blau: M6, A4, A6, A8, A9'],['#5fc09a','Grün: A1 (Anmeldung), A2'],['#7b6fb0','Parkplätze P1 bis P7, Parkhaus (dunkler)'],['#2f8f5f','Sammelplätze S1 bis S3'],['#aab55a','Rasen'],['#a4cde0','Dortmund-Ems-Kanal']];
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
  var labels='<div class="rp-labels" aria-hidden="true">'+G.buildings.map(function(b){ return '<span class="rp-bid" data-n="b:'+b.id+'">'+b.id+'</span>'; }).join('')+'<span class="rp-poi" data-n="p:canal">Dortmund-Ems-Kanal</span><span class="rp-poi" data-n="p:street">Wolbecker Straße</span><span class="rp-poi i" data-n="p:info">i</span>'+G.poi.map(function(o){ return '<span class="rp-poi q'+(o.k[0]==='S'?' s':'')+'" data-n="q:'+o.k+'">'+o.k+'</span>'; }).join('')
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
