/* ===== Brandschutzplaner: Plan, Analyse, Prüfregeln (reine Logik) ===== */
const INF=1e9, SQ2=Math.SQRT2;
const DN=['','DS','RS','T30-DS','T30-RS','Ausgang'];
const SAT=[[],[1,2,3,4],[2,4],[3,4],[4]];   // geforderte Tür -> zulässige Türen
const fm=(x,d)=>{d=d==null?1:d;const k=Math.pow(10,d);return (Math.round(x*k)/k).toFixed(d).replace('.',',');};
const WK={NONE:0,TRENN:1,BRAND:2,AUSSEN:3,FLUR:4,NTR:5};
const TYPES={
 std:{id:'std',name:'Standardgebäude',kurz:'Standard',sub:'Abschnitte 04 und 05',W:40,H:18,flur:'Flur',uses:['Nutzungseinheit','Werkstatt','Kellerraum','Lager im Keller'],short:['NE','Werkstatt','Keller','Lager'],ucol:['#d3dcef','#f1d2a6','#c8c4c0','#d9c8a2'],gang:false,hasFlur:true,rr:false},
 vk:{id:'vk',name:'Verkaufsstätte',kurz:'Verkauf',sub:'Abschnitt 07 · MVKVO',W:64,H:34,flur:'Ladenstraße',uses:['Verkaufsraum','Sonstiger Raum'],short:['Verkauf','Sonstiges'],ucol:['#f2d9c4','#cfd3da'],gang:true,hasFlur:true,rr:true},
 bh:{id:'bh',name:'Beherbergungsstätte',kurz:'Hotel',sub:'Abschnitt 08 · MBeVO',W:44,H:18,flur:'Flur',uses:['Beherbergungsraum','Gastraum','Sonstiger Raum'],short:['Zimmer','Gastraum','Sonstiges'],ucol:['#cfe0f5','#e2d3f1','#cfd3da'],gang:false,hasFlur:true,rr:false},
 ind:{id:'ind',name:'Industriebau',kurz:'Industrie',sub:'Abschnitt 09 · MIndBauRL',W:64,H:32,flur:'',uses:['Halle'],short:['Halle'],ucol:['#d4d8df'],gang:true,hasFlur:false,rr:true},
 gar:{id:'gar',name:'Garage',kurz:'Garage',sub:'Abschnitt 10 · M-GarVO',W:56,H:28,flur:'',uses:['Stellplatzfläche'],short:['Stellplätze'],ucol:['#b9bfca'],gang:false,hasFlur:false,rr:true}};
const DEFO={std:{gk:4,kg:0},vk:{eg:1,spr:0},bh:{betten:40,alarm:1,sibel:1,plan:1,bma:0,bso:0},ind:{h:5,alarm:0},gar:{offen:0,ober:1,spr:0,abl:0,ent:0,bma:0}};

/* ---------- Plan ---------- */
function makePlan(type,W,H,maskFn){
  const n=W*H,p={type,W,H,mask:new Uint8Array(n),zone:new Uint8Array(n),gang:new Uint8Array(n),use:new Uint8Array(n),
    wv:new Uint8Array((W+1)*H),dv:new Uint8Array((W+1)*H),wh:new Uint8Array(W*(H+1)),dh:new Uint8Array(W*(H+1))};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)p.mask[x+W*y]=(!maskFn||maskFn(x,y))?1:0;
  return p;
}
function clonePlan(p){const q=Object.assign({},p);['mask','zone','gang','use','wv','dv','wh','dh'].forEach(k=>{q[k]=p[k].slice();});return q;}
const inside=(p,x,y)=>x>=0&&y>=0&&x<p.W&&y<p.H&&p.mask[x+p.W*y]===1;
function edge(p,vert,x,y){
  const W=p.W,ax=vert?x-1:x,ay=vert?y:y-1;
  const A=inside(p,ax,ay),B=inside(p,x,y),i=vert?x+(W+1)*y:x+W*y;
  const uw=vert?p.wv[i]:p.wh[i],ud=vert?p.dv[i]:p.dh[i];
  let w=0;
  if(A!==B)w=3;
  else if(A){w=uw;const za=p.zone[ax+W*ay],zb=p.zone[x+W*y];
    if(za!==zb){const zz=(za===2||zb===2)?5:4;if(w!==2)w=zz;}}
  return {i,w,d:w?ud:0,A,B,ax,ay,bx:x,by:y,vert,x,y};
}
function setWall(p,vert,x,y,k){
  const e=edge(p,vert,x,y);if(!e.A||!e.B)return false;
  if(vert){p.wv[e.i]=k;p.dv[e.i]=0;}else{p.wh[e.i]=k;p.dh[e.i]=0;}return true;
}
function setDoor(p,vert,x,y,t){
  const e=edge(p,vert,x,y);if(!e.A&&!e.B)return false;
  if(t===0){if(vert)p.dv[e.i]=0;else p.dh[e.i]=0;return true;}
  if(e.w===0)return false;
  if(e.w===3&&t!==5)return false;
  if(e.w!==3&&t===5)return false;
  if(vert)p.dv[e.i]=t;else p.dh[e.i]=t;return true;
}
function eraseEdge(p,vert,x,y){const e=edge(p,vert,x,y);if(!e.A&&!e.B)return;if(vert){if(e.A&&e.B)p.wv[e.i]=0;p.dv[e.i]=0;}else{if(e.A&&e.B)p.wh[e.i]=0;p.dh[e.i]=0;}}
/* Hilfen zum Aufbauen von Plänen (Eckpunkt-Koordinaten bei Linien, Zellkoordinaten bei Flächen) */
function lineEdges(x0,y0,x1,y1){const o=[];if(y0===y1){const a=Math.min(x0,x1),b=Math.max(x0,x1);for(let x=a;x<b;x++)o.push([false,x,y0]);}
  else if(x0===x1){const a=Math.min(y0,y1),b=Math.max(y0,y1);for(let y=a;y<b;y++)o.push([true,x0,y]);}return o;}
function pWall(p,x0,y0,x1,y1,k){lineEdges(x0,y0,x1,y1).forEach(e=>setWall(p,e[0],e[1],e[2],k==null?1:k));return p;}
function pDoor(p,x0,y0,x1,y1,t){lineEdges(x0,y0,x1,y1).forEach(e=>setDoor(p,e[0],e[1],e[2],t));return p;}
function pZone(p,x0,y0,x1,y1,z){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(inside(p,x,y)){p.zone[x+p.W*y]=z;if(z!==0)p.gang[x+p.W*y]=0;}return p;}
function pUse(p,x0,y0,x1,y1,u){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(inside(p,x,y))p.use[x+p.W*y]=u;return p;}
function pGang(p,x0,y0,x1,y1){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(inside(p,x,y)&&p.zone[x+p.W*y]===0)p.gang[x+p.W*y]=1;return p;}

/* ---------- Binärheap ---------- */
function Heap(){this.k=[];this.v=[];}
Heap.prototype.push=function(k,v){const K=this.k,V=this.v;let i=K.length;K.push(k);V.push(v);while(i>0){const q=(i-1)>>1;if(K[q]<=K[i])break;[K[q],K[i]]=[K[i],K[q]];[V[q],V[i]]=[V[i],V[q]];i=q;}};
Heap.prototype.pop=function(){const K=this.k,V=this.v,r=[K[0],V[0]],lk=K.pop(),lv=V.pop();if(K.length){K[0]=lk;V[0]=lv;let i=0;for(;;){let l=2*i+1,rr=l+1,m=i;if(l<K.length&&K[l]<K[m])m=l;if(rr<K.length&&K[rr]<K[m])m=rr;if(m===i)break;[K[m],K[i]]=[K[i],K[m]];[V[m],V[i]]=[V[i],V[m]];i=m;}}return r;};
Heap.prototype.size=function(){return this.k.length;};

/* ---------- Analyse ---------- */
function stepOK(A,x,y,dx,dy){
  const W=A.W,nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=A.H)return false;
  const c=x+W*y,n=nx+W*ny;if(!A.inn[n]||!A.inn[c])return false;
  if(dx===1)return A.pr[c]===1;if(dx===-1)return A.pr[n]===1;if(dy===1)return A.pd[c]===1;return A.pd[n]===1;
}
/* Mehrquellen-Dijkstra (Achtnachbarn, Oktil). sources: [{c,d0,id}] ; allow(c) */
function field(A,sources,allow){
  const N=A.N,W=A.W,dist=new Float64Array(N).fill(INF),par=new Int32Array(N).fill(-1),src=new Int32Array(N).fill(-1),hp=new Heap();
  sources.forEach(s=>{if(allow(s.c)&&s.d0<dist[s.c]){dist[s.c]=s.d0;src[s.c]=s.id;par[s.c]=-1;hp.push(s.d0,s.c);}});
  const D=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(hp.size()){const t=hp.pop(),d=t[0],c=t[1];if(d>dist[c])continue;const x=c%W,y=(c/W)|0;
    for(let k=0;k<8;k++){const dx=D[k][0],dy=D[k][1],nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=A.H)continue;const n=nx+W*ny;if(!allow(n))continue;
      let cost=1;
      if(dx&&dy){if(!(stepOK(A,x,y,dx,0)&&stepOK(A,x,y,0,dy)&&stepOK(A,x+dx,y,0,dy)&&stepOK(A,x,y+dy,dx,0)))continue;
        if(!allow(x+dx+W*y)||!allow(x+W*(y+dy)))continue;cost=SQ2;}
      else if(!stepOK(A,x,y,dx,dy))continue;
      const nd=d+cost;if(nd<dist[n]-1e-6){dist[n]=nd;par[n]=c;src[n]=src[c];hp.push(nd,n);}}}
  return {dist,par,src};
}
function maxflow(g,E,cap0,s,t,lim){
  const cap=cap0.slice();let f=0;
  while(f<lim){const prev=new Int32Array(g.length).fill(-1),seen=new Uint8Array(g.length);const q=[s];seen[s]=1;
    for(let qi=0;qi<q.length&&!seen[t];qi++){const u=q[qi];for(const ei of g[u]){const v=E[ei];if(cap[ei]>0&&!seen[v]){seen[v]=1;prev[v]=ei;q.push(v);}}}
    if(!seen[t])break;let v=t;while(v!==s){const ei=prev[v];cap[ei]--;cap[ei^1]++;v=E[ei^1];}f++;}
  return f;
}
function analyze(p,o){
  const W=p.W,H=p.H,N=W*H,T=TYPES[p.type];
  const A={p,o,W,H,N,T,inn:p.mask};
  /* Kanten */
  const wR=new Uint8Array(N),wD=new Uint8Array(N),pr=new Uint8Array(N),pd=new Uint8Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=x+W*y;if(!p.mask[c])continue;
    if(x+1<W&&p.mask[c+1]){const e=edge(p,true,x+1,y);wR[c]=e.w;pr[c]=(e.w===0||e.d>0)?1:0;}
    if(y+1<H&&p.mask[c+W]){const e=edge(p,false,x,y+1);wD[c]=e.w;pd[c]=(e.w===0||e.d>0)?1:0;}}
  A.pr=pr;A.pd=pd;A.wR=wR;A.wD=wD;
  /* Komponenten */
  const comp=new Int32Array(N).fill(-1),comps=[];
  for(let s=0;s<N;s++){if(!p.mask[s]||comp[s]>=0)continue;const id=comps.length,st=[s];comp[s]=id;const cells=[];
    while(st.length){const c=st.pop();cells.push(c);const x=c%W,y=(c/W)|0;
      if(x+1<W&&p.mask[c+1]&&wR[c]===0&&comp[c+1]<0){comp[c+1]=id;st.push(c+1);}
      if(x>0&&p.mask[c-1]&&wR[c-1]===0&&comp[c-1]<0){comp[c-1]=id;st.push(c-1);}
      if(y+1<H&&p.mask[c+W]&&wD[c]===0&&comp[c+W]<0){comp[c+W]=id;st.push(c+W);}
      if(y>0&&p.mask[c-W]&&wD[c-W]===0&&comp[c-W]<0){comp[c-W]=id;st.push(c-W);}}
    let x0=W,y0=H,x1=-1,y1=-1,sx=0,sy=0,per=false;const uc=[0,0,0,0,0,0];
    cells.forEach(c=>{const x=c%W,y=(c/W)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;sx+=x+0.5;sy+=y+0.5;uc[p.use[c]]++;
      if(!inside(p,x-1,y)||!inside(p,x+1,y)||!inside(p,x,y-1)||!inside(p,x,y+1))per=true;});
    let use=0;for(let u=1;u<6;u++)if(uc[u]>uc[use])use=u;
    comps.push({id,zone:p.zone[s],cells,area:cells.length,x0,y0,x1,y1,cx:sx/cells.length,cy:sy/cells.length,use,per});}
  A.comp=comp;A.comps=comps;
  /* Namen */
  const plainCount=(rs,c)=>rs.filter(r=>r.use===c.use).length;
  const rooms=comps.filter(c=>c.zone===0).sort((a,b)=>(Math.round(a.cy/6)*1000+a.cx)-(Math.round(b.cy/6)*1000+b.cx));
  const cnt={};rooms.forEach(c=>{const u=T.uses[c.use]||T.uses[0];cnt[u]=(cnt[u]||0)+1;c.name=u+' '+cnt[u];c.uname=u;c.sname=(T.short[c.use]||T.short[0])+(plainCount(rooms,c)>1?' '+cnt[u]:'');});
  comps.filter(c=>c.zone===1).forEach((c,i)=>{c.name=T.flur+(comps.filter(d=>d.zone===1).length>1?' '+(i+1):'');});
  comps.filter(c=>c.zone===2).forEach((c,i)=>{c.name='Treppenraum '+String.fromCharCode(65+i);});
  A.rooms=rooms;
  /* Türgruppen */
  const dg=[];
  for(let x=0;x<=W;x++){let cur=null;for(let y=0;y<H;y++){const e=edge(p,true,x,y);
    if((e.A||e.B)&&e.d>0){const a=e.A?comp[e.ax+W*e.ay]:-1,b=e.B?comp[x+W*y]:-1;
      if(cur&&cur.d===e.d&&cur.a===a&&cur.b===b&&cur.last===y-1&&cur.w===e.w){cur.last=y;cur.n++;cur.es.push(e);}
      else{cur={vert:true,line:x,s:y,last:y,d:e.d,w:e.w,a,b,n:1,es:[e]};dg.push(cur);}}}}
  for(let y=0;y<=H;y++){let cur=null;for(let x=0;x<W;x++){const e=edge(p,false,x,y);
    if((e.A||e.B)&&e.d>0){const a=e.A?comp[e.ax+W*e.ay]:-1,b=e.B?comp[x+W*y]:-1;
      if(cur&&cur.d===e.d&&cur.a===a&&cur.b===b&&cur.last===x-1&&cur.w===e.w){cur.last=x;cur.n++;cur.es.push(e);}
      else{cur={vert:false,line:y,s:x,last:x,d:e.d,w:e.w,a,b,n:1,es:[e]};dg.push(cur);}}}}
  dg.forEach(g=>{const m=(g.s+g.last+1)/2;g.cx=g.vert?g.line:m;g.cz=g.vert?m:g.line;g.width=g.n;
    const za=g.a>=0?comps[g.a].zone:-1,zb=g.b>=0?comps[g.b].zone:-1;g.za=za;g.zb=zb;
    g.out=(g.a<0||g.b<0);g.ntr=(!g.out)&&(za===2||zb===2)&&za!==zb;});
  A.dg=dg;
  /* Ziele für Lauflinie: Ausgang oder Tür in Treppenraum */
  const srcs=[],srcOK=[];
  dg.forEach((g,gi)=>{if(!(g.out||g.ntr))return;
    g.es.forEach(e=>{let cell,nx,nz;
      if(g.out){const inA=e.A;cell=inA?e.ax+W*e.ay:e.bx+W*e.by;
        if(g.vert){nx=inA?1:-1;nz=0;}else{nx=0;nz=inA?1:-1;}}
      else{const aN=comps[g.a].zone===2;cell=aN?e.bx+W*e.by:e.ax+W*e.ay; // Zelle auf der Nicht-Treppenraum-Seite
        const nSide=aN; // Richtung zum Treppenraum
        if(g.vert){nx=nSide?-1:1;nz=0;}else{nx=0;nz=nSide?-1:1;}}
      if(comps[comp[cell]].zone===2)return;
      const ex=e.vert?e.x:e.x+0.5,ez=e.vert?e.y+0.5:e.y;
      srcs.push({c:cell,d0:0.5,id:srcs.length,g:gi,ex,ez,nx,nz,kind:g.out?'out':'ntr'});});});
  A.srcs=srcs;
  const notNtr=c=>p.mask[c]===1&&p.zone[c]!==2;
  A.fAll=field(A,srcs,notNtr);
  A.fNtr=field(A,srcs.filter(s=>s.kind==='ntr'),notNtr);
  /* Flur-Netzwerke */
  const fl=comps.filter(c=>c.zone===1),uf={};fl.forEach(c=>{uf[c.id]=c.id;});
  const fnd=a=>{while(uf[a]!==a){uf[a]=uf[uf[a]];a=uf[a];}return a;};
  dg.forEach(g=>{if(g.za===1&&g.zb===1)uf[fnd(g.a)]=fnd(g.b);});
  const nets={};fl.forEach(c=>{const r=fnd(c.id);(nets[r]=nets[r]||{id:r,comps:[],cells:[],exits:[]}).comps.push(c);c.net=r;});
  A.nets=Object.keys(nets).map(k=>nets[k]);
  A.nets.forEach(n=>{n.comps.forEach(c=>c.cells.forEach(x=>n.cells.push(x)));});
  srcs.forEach(s=>{const k=comp[s.c];if(comps[k].zone===1){const n=nets[comps[k].net];let ex=n.exits.find(e=>e.g===s.g);if(!ex){ex={g:s.g,src:[],x:s.ex,z:s.ez,kind:s.kind};n.exits.push(ex);}ex.src.push(s.c);}});
  const flurOnly=c=>p.mask[c]===1&&p.zone[c]===1;
  A.nets.forEach(n=>{
    const sr=[];n.exits.forEach((e,i)=>e.src.forEach(c=>sr.push({c,d0:0.5,id:i})));
    n.f=field(A,sr,flurOnly);
    n.twoDir=false;
    if(n.exits.length>=2){const e0=n.exits[0],f0=field(A,e0.src.map(c=>({c,d0:0,id:0})),flurOnly);
      for(let i=1;i<n.exits.length;i++){let m=INF;n.exits[i].src.forEach(c=>{if(f0.dist[c]<m)m=f0.dist[c];});if(m>=4)n.twoDir=true;}}
    let far=-1,fd=-1;n.cells.forEach(c=>{const d=n.f.dist[c];if(d<INF&&d>fd){fd=d;far=c;}});
    n.far=far;n.maxd=fd;n.unreach=n.cells.some(c=>n.f.dist[c]>=INF);
  });
  /* Rauchabschnitte (Flurabschnitte): Durchmesser */
  fl.forEach(c=>{
    const only=x=>comp[x]===c.id;
    const f1=field(A,[{c:c.cells[0],d0:0,id:0}],only);let a=c.cells[0],da=-1;c.cells.forEach(x=>{if(f1.dist[x]<INF&&f1.dist[x]>da){da=f1.dist[x];a=x;}});
    const f2=field(A,[{c:a,d0:0,id:0}],only);let b=a,db=-1;c.cells.forEach(x=>{if(f2.dist[x]<INF&&f2.dist[x]>db){db=f2.dist[x];b=x;}});
    c.rlen=(c.area===(c.x1-c.x0+1)*(c.y1-c.y0+1))?Math.max(c.x1-c.x0+1,c.y1-c.y0+1):db+1;c.rmid=[((a%W)+(b%W))/2+0.5,(((a/W)|0)+((b/W)|0))/2+0.5];
  });
  /* Rettungsweg-Fluss (zwei unabhängige Rettungswege) */
  const nC=comps.length,SINK=nC,g=[];for(let i=0;i<=nC;i++)g.push([]);const E=[],cap0=[];
  const addE=(a,b,c)=>{g[a].push(E.length);E.push(b);cap0.push(c);g[b].push(E.length);E.push(a);cap0.push(c);};
  dg.forEach(q=>{
    if(q.out){addE(q.a>=0?q.a:q.b,SINK,1);return;}
    if(q.ntr){addE(q.a,q.b,1);return;}
    if(q.za===1&&q.zb===1)addE(q.a,q.b,9);
    else if((q.za===0&&q.zb===1)||(q.za===1&&q.zb===0))addE(q.a,q.b,2);
    else if(q.za===0&&q.zb===0&&T.rr)addE(q.a,q.b,1);});
  comps.forEach(c=>{if(c.zone===2)addE(c.id,SINK,1);});
  comps.forEach(c=>{if(c.zone!==2)c.flow=maxflow(g,E,cap0,c.id,SINK,2);});
  /* Erreichbarkeit / Weglängen je Komponente */
  comps.forEach(c=>{if(c.zone===2)return;let d=-1,far=-1,un=0;c.cells.forEach(x=>{const v=A.fAll.dist[x];if(v>=INF){un++;return;}if(v>d){d=v;far=x;}});c.dmax=d;c.far=far;c.unreach=un;});
  /* Brandabschnitte */
  const bc=new Int32Array(N).fill(-1),bcs=[];
  for(let s=0;s<N;s++){if(!p.mask[s]||bc[s]>=0)continue;const id=bcs.length,st=[s];bc[s]=id;let n=0,x0=W,y0=H,x1=-1,y1=-1,sx=0,sy=0;
    while(st.length){const c=st.pop();n++;const x=c%W,y=(c/W)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;sx+=x+0.5;sy+=y+0.5;
      if(x+1<W&&p.mask[c+1]&&wR[c]!==2&&bc[c+1]<0){bc[c+1]=id;st.push(c+1);}
      if(x>0&&p.mask[c-1]&&wR[c-1]!==2&&bc[c-1]<0){bc[c-1]=id;st.push(c-1);}
      if(y+1<H&&p.mask[c+W]&&wD[c]!==2&&bc[c+W]<0){bc[c+W]=id;st.push(c+W);}
      if(y>0&&p.mask[c-W]&&wD[c-W]!==2&&bc[c-W]<0){bc[c-W]=id;st.push(c-W);}}
    bcs.push({id,area:n,bw:x1-x0+1,bh:y1-y0+1,cx:sx/n,cy:sy/n,x0,y0,x1,y1});}
  A.bcs=bcs;
  /* Brandwandsegmente und Innenecken */
  const bws=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=x+W*y;if(!p.mask[c])continue;
    if(x+1<W&&p.mask[c+1]&&wR[c]===2)bws.push([x+1,y,x+1,y+1]);
    if(y+1<H&&p.mask[c+W]&&wD[c]===2)bws.push([x,y+1,x+1,y+1]);}
  A.bws=bws;
  const ecken=[];
  for(let vy=1;vy<H;vy++)for(let vx=1;vx<W;vx++){const k=(inside(p,vx-1,vy-1)?1:0)+(inside(p,vx,vy-1)?1:0)+(inside(p,vx-1,vy)?1:0)+(inside(p,vx,vy)?1:0);if(k===3)ecken.push([vx,vy]);}
  A.ecken=ecken;
  const segDist=(px,py,s)=>{const dx=s[2]-s[0],dy=s[3]-s[1],l=dx*dx+dy*dy;let t=l?((px-s[0])*dx+(py-s[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(s[0]+t*dx),py-(s[1]+t*dy));};
  /* Gang (Hauptgang) */
  let gcells=[];for(let c=0;c<N;c++)if(p.mask[c]&&p.gang[c]&&p.zone[c]===0)gcells.push(c);
  let gmin=INF,gmc=-1;
  gcells.forEach(c=>{const x=c%W,y=(c/W)|0;let rx=1,ry=1;
    for(let i=x-1;i>=0&&p.gang[i+W*y]&&p.zone[i+W*y]===0;i--)rx++;for(let i=x+1;i<W&&p.gang[i+W*y]&&p.zone[i+W*y]===0;i++)rx++;
    for(let j=y-1;j>=0&&p.gang[x+W*j]&&p.zone[x+W*j]===0;j--)ry++;for(let j=y+1;j<H&&p.gang[x+W*j]&&p.zone[x+W*j]===0;j++)ry++;
    const lw=Math.min(rx,ry);if(lw<gmin){gmin=lw;gmc=c;}});
  A.gcells=gcells;A.gmin=gmin;A.gmc=gmc;
  A.fG=field(A,gcells.map(c=>({c,d0:0,id:0})),c=>p.mask[c]===1&&p.zone[c]===0);
  /* Breite eines Flurs/einer Ladenstraße (kleinste lokale Breite) */
  const compWidth=cc=>{let m=INF,mc=-1;cc.cells.forEach(c=>{const x=c%W,y=(c/W)|0;let rx=1,ry=1;
    for(let i=x-1;i>=0&&comp[i+W*y]===cc.id;i--)rx++;for(let i=x+1;i<W&&comp[i+W*y]===cc.id;i++)rx++;
    for(let j=y-1;j>=0&&comp[x+W*j]===cc.id;j--)ry++;for(let j=y+1;j<H&&comp[x+W*j]===cc.id;j++)ry++;
    const lw=Math.min(rx,ry);if(lw<m){m=lw;mc=c;}});return {w:m,c:mc};};
  /* Hilfsfunktionen für Messlinien */
  const cxz=c=>[c%W+0.5,((c/W)|0)+0.5];
  const pathFrom=(c)=>{const pts=[];let k=c,gd=0;while(k>=0&&gd++<6000){pts.push(cxz(k));if(A.fAll.par[k]<0)break;k=A.fAll.par[k];}
    const s=srcs[A.fAll.src[k]];if(s){const r=s.kind==='out'?2.2:1.6;pts.push([s.ex,s.ez],[s.ex+s.nx*r,s.ez+s.nz*r]);}return pts;};
  const flurPath=(n,c)=>{const pts=[];let k=c,gd=0;while(k>=0&&gd++<6000){pts.push(cxz(k));if(n.f.par[k]<0)break;k=n.f.par[k];}
    const ex=n.exits[n.f.src[k]];if(ex)pts.push([ex.x,ex.z]);return pts;};
  A.pathFrom=pathFrom;
  /* ---------- Prüfregeln ---------- */
  const checks=[],lines=[];A.checks=checks;A.lines=lines;
  const chk=(id,title,ref,ok,detail,issues,hint,kind)=>{checks.push({id,title,ref,ok,detail,issues:issues||[],hint:hint||'',kind:kind||'req'});};
  const iss=(x,z,txt,grp,ex)=>Object.assign({x,z,txt,grp},ex||{});
  const plain=rooms.filter(c=>c.zone===0);
  const cen=[W/2,H/2];
  const hasNet=(a,b)=>a===b;
  /* Gemeinsame Bausteine */
  const stichCheck=(ref,lim)=>{
    const is=[];let worst=0,anyNet=false,allTwo=true;
    A.nets.forEach(n=>{anyNet=true;
      if(n.exits.length===0){is.push(iss(n.cells.reduce((s,c)=>s+c%W,0)/n.cells.length+0.5,n.cells.reduce((s,c)=>s+((c/W)|0),0)/n.cells.length+0.5,'Flur ohne Treppenraum oder Ausgang','stich:'+n.id,{blk:'spot',r:3}));allTwo=false;return;}
      if(n.twoDir)return;
      allTwo=false;const len=n.maxd+0.5;if(len>worst)worst=len;
      const fc=cxz(n.far);
      lines.push({pts:flurPath(n,n.far),len,lim,bad:len>lim,label:'Stichflur',net:n.id});
      if(len>lim)is.push(iss(fc[0],fc[1],'Stichflur '+fm(len)+' m (max. '+lim+' m)','stich:'+n.id,{blk:'spot',r:3}));});
    let detail=!anyNet?'Kein Flur geplant':(allTwo?'Alle Flure haben zwei Fluchtrichtungen':'Längster Stichflur '+fm(worst)+' m'+(is.length?' (max. '+lim+' m)':''));
    chk('stich','Stichflure ≤ '+lim+' m',ref,!is.length,detail,is,'Zweiten Treppenraum oder Ausgang am anderen Flurende setzen oder den Flur kürzen. Ein Stichflur hat nur eine Fluchtrichtung.');
  };
  const doorReq=(q)=>{
    if(q.out||q.w===2)return 0;
    const za=q.za,zb=q.zb,ra=q.a>=0?comps[q.a]:null,rb=q.b>=0?comps[q.b]:null;
    const rm=za===0?ra:(zb===0?rb:null);
    if(p.type==='std'){
      if(q.ntr)return 2;
      if(za===1&&zb===1)return 2;
      if(za===0&&zb===0)return 3;
      if(rm){const u=rm.use;if(u===0)return rm.area>200?4:1;if(u===1||u===2)return 4;if(u===3)return 3;}
    }
    if(p.type==='bh'){
      if(q.ntr)return 2;
      if(rm&&((za===0&&zb===1)||(za===1&&zb===0))){return (rm.use===0||rm.use===1)?2:0;}
    }
    return 0;};
  const doorWhy=(q)=>{const za=q.za,zb=q.zb,ra=q.a>=0?comps[q.a]:null,rb=q.b>=0?comps[q.b]:null;const rm=za===0?ra:(zb===0?rb:null);
    if(q.ntr)return 'Tür zum Treppenraum';if(za===1&&zb===1)return 'Rauchabschnitt-Tür';if(za===0&&zb===0)return 'Tür in der Trennwand';
    if(rm)return 'Tür zu '+rm.name+(p.type==='std'&&rm.use===0&&rm.area>200?' (> 200 m²)':'');return 'Tür';};
  const tuerCheck=(ref)=>{
    const is=[];let n=0;
    dg.forEach((q,gi)=>{const r=doorReq(q);if(!r)return;n++;if(!SAT[r].includes(q.d))is.push(iss(q.cx,q.cz,doorWhy(q)+': '+DN[r]+' gefordert, vorhanden '+DN[q.d],'tuer:'+gi,{blk:'spot',r:2.2}));});
    chk('tuer','Türanforderungen',ref,!is.length,n?((n-is.length)+' von '+n+' Türen richtig'):'Noch keine Tür zu prüfen',is,
      p.type==='std'?'Nutzungseinheit: DS · Treppenraum: RS · Keller-Lager: T30-DS · Keller, Werkstatt, NE > 200 m²: T30-RS · Tür in der Trennwand: T30-DS.':'Zu Beherbergungsräumen, Gasträumen und Treppenräumen: RS. Raum mit dem Werkzeug Nutzung zuordnen.');
  };
  const baCheck=(ref,limFn,title,hint)=>{
    const is=[];let worst=0;
    bcs.forEach(b=>{const lim=limFn(b);const bad=b.area>lim.a||(lim.s&&(b.bw>lim.s||b.bh>lim.s));if(b.area>worst)worst=b.area;
      if(bad)is.push(iss(b.cx,b.cy,'Brandabschnitt '+b.area+' m²'+(lim.s?' ('+b.bw+' m × '+b.bh+' m)':'')+', erlaubt '+(lim.a>=1000?String(lim.a).replace(/\B(?=(\d{3})+$)/g,'.'):lim.a)+' m²'+(lim.s?' und '+lim.s+' m Kantenlänge':''),'ba:'+b.id,{blk:null,r:5}));});
    chk('ba',title,ref,!is.length,'Größter Brandabschnitt '+worst+' m²'+(bcs.length>1?' ('+bcs.length+' Abschnitte)':''),is,hint);
  };
  const luftOf=(room)=>{  // Luftlinie bis zu einem Ausgang des Raums (Tür zu Flur/Treppenraum/Freiem)
    const tg=[];dg.forEach(q=>{if(q.a!==room.id&&q.b!==room.id)return;const o2=q.a===room.id?q.b:q.a;if(o2>=0&&comps[o2].zone===0)return;
      q.es.forEach(e=>{tg.push({ex:e.vert?e.x:e.x+0.5,ez:e.vert?e.y+0.5:e.y});});});
    let worst=-1,wc=-1,wt=null;
    room.cells.forEach(c=>{const x=c%W+0.5,y=((c/W)|0)+0.5;let m=INF,mt=null;tg.forEach(s=>{const d=Math.hypot(s.ex-x,s.ez-y);if(d<m){m=d;mt=s;}});if(m>worst){worst=m;wc=c;wt=mt;}});
    return {worst,wc,wt};};
  const lenCheck=(id,title,ref,limOf,hint,rs,labelFn)=>{
    const is=[];let wmax=0,bad=0;
    rs.forEach(c=>{const lim=limOf(c);c.lim=lim;
      if(c.unreach>0&&c.dmax<0){is.push(iss(c.cx,c.cy,c.name+': kein Weg zu einem Ausgang oder Treppenraum',id+':'+c.id,{blk:'room',room:c.id,r:3}));bad++;return;}
      if(c.far<0)return;
      const d=c.dmax+0.5;if(d>wmax)wmax=d;
      let okc=d<=lim.v;if(!okc&&lim.alt){const fc=cxz(c.far);void fc;
        let allOk=true;c.cells.forEach(x=>{const a=A.fAll.dist[x]+0.5,b=A.fNtr.dist[x]+0.5;if(!(a<=lim.v||b<=lim.alt))allOk=false;});okc=allOk;}
      const pts=pathFrom(c.far);lines.push({pts,len:d,lim:lim.alt&&okc?lim.alt:lim.v,bad:!okc,label:labelFn?labelFn(c):'Rettungsweg',room:c.id});
      if(!okc){const fc=cxz(c.far);is.push(iss(fc[0],fc[1],c.name+': '+fm(d)+' m bis Ausgang/Treppenraum (max. '+lim.v+' m)',id+':'+c.id,{blk:'len',room:c.id,lim:lim.v,r:3}));bad++;}
      if(c.unreach>0&&c.dmax>=0){const ux=c.cells.find(x=>A.fAll.dist[x]>=INF);const uc=cxz(ux);is.push(iss(uc[0],uc[1],c.name+': Teil der Fläche ohne Weg zum Ausgang',id+':'+c.id+'u',{blk:'room',room:c.id,r:3}));}
    });
    chk(id,title,ref,!is.length,rs.length?'Längster Weg '+fm(wmax)+' m':'Keine Räume',is,hint);
  };
  const rw2Check=(ref,rs,needFn,hint,title)=>{
    const is=[];let ok=0;
    rs.forEach(c=>{const need=needFn(c);const f=c.flow;const okc=f>=need||(p.type==='std'&&c.per&&f>=1&&need===2);
      if(okc)ok++;else is.push(iss(c.cx,c.cy,f===0?c.name+': kein Rettungsweg (Tür oder Ausgang fehlt)':c.name+': nur ein baulicher Rettungsweg',  'rw2',{blk:'room',room:c.id,r:3.5}));});
    chk('rw2',title||'Zwei unabhängige Rettungswege',ref,!is.length&&rs.length>0,rs.length?ok+' von '+rs.length+' mit ausreichenden Rettungswegen':'Noch keine Räume',is,hint);
  };
  const equipCheck=(ref,items)=>{
    const miss=items.filter(i=>i.req&&!i.on);
    chk('tech','Anlagentechnik und Organisation',ref,!miss.length,(items.filter(i=>i.req).length-miss.length)+' von '+items.filter(i=>i.req).length+' Pflichtpunkten erfüllt'+(miss.length?'. Es fehlt: '+miss.map(i=>i.n).join(', '):''),
      miss.map(i=>iss(cen[0],cen[1],'Fehlt: '+i.n,'tech:'+i.n,{noPos:1})),'Im Reiter Plan unter Ausstattung einschalten.');
  };
  /* ---------- je Gebäudetyp ---------- */
  if(p.type==='std'){
    rw2Check('04 · Rettungswege',plain,c=>2,'Jede Nutzungseinheit braucht eine Tür zum Flur und der Flur zwei Fluchtrichtungen (Treppenräume oder Ausgänge). Räume an der Außenwand: 2. RW = Anleiterstelle.');
    stichCheck('04 · Rettungsweglängen',15);
    {const is=[];let worst=0;fl.forEach(c=>{if(c.rlen>worst)worst=c.rlen;if(c.rlen>30)is.push(iss(c.rmid[0],c.rmid[1],c.name+': Rauchabschnitt '+fm(c.rlen)+' m (max. 30 m)','rauch:'+c.id,{blk:'spot',r:4}));});
     chk('rauch','Rauchabschnitte ≤ 30 m (RS-Türen)','04 · Rettungsweglängen',!is.length,fl.length?'Längster Abschnitt '+fm(worst)+' m':'Kein Flur geplant',is,'Rauchabschnitt-Tür (RS) quer in den Flur setzen, damit jeder Abschnitt höchstens 30 m lang ist.');}
    tuerCheck('04 · Notwendige Flure, Türen');
    baCheck('05 · Brandabschnitte',b=>({a:1600,s:40}),'Brandabschnitt ≤ 40 m × 40 m (1.600 m²)','Brandwand (REIM 90) einziehen, die den Abschnitt teilt.');
    {const is=[];ecken.forEach((e,i)=>{let m=INF;bws.forEach(s=>{const d=segDist(e[0],e[1],s);if(d<m)m=d;});if(m<5)is.push(iss(e[0],e[1],'Brandwand nur '+fm(m)+' m von der Innenecke (min. 5 m)','eck:'+i,{blk:null,r:3}));});
     chk('eck','Brandwand ≥ 5 m von Innenecken','05 · Brandwände',!is.length,!bws.length?'Keine Brandwand geplant':(!ecken.length?'Grundriss ohne Innenecke':(is.length?'Zu nah an einer Innenecke':'Abstand eingehalten')),is,'Brandwand mindestens 5 m von der Innenecke entfernt anordnen.');}
    {let md=0;plain.forEach(c=>{if(c.dmax+0.5>md)md=c.dmax+0.5;plain.forEach(()=>{});if(c.far>=0)lines.push({pts:pathFrom(c.far),len:c.dmax+0.5,lim:null,bad:false,label:'Rettungsweg',room:c.id});});
     chk('rwl','Rettungsweglänge (Messlinie)','04 · Rettungswege',true,'Längster Weg '+fm(md)+' m bis zum Treppenraum. Für Standardgebäude nennt die Lernseite hier keinen Grenzwert.',[],'','info');}
    {const gk=o.gk,kg=o.kg;const tr=gk<=2?(kg?30:0):gk===3?(kg?90:30):gk===4?(kg?90:60):90;
     const nm=r=>r===0?'keine Anforderung':r===30?'feuerhemmend (F30)':r===60?'hochfeuerhemmend (F60)':'feuerbeständig (F90)';
     chk('bt','Bauteile GK '+gk+' · '+(kg?'Kellergeschoss':'Obergeschoss'),'05 · Baulicher Brandschutz',true,'Tragende Wände, Stützen, Decken: '+nm(tr)+'. Trennwände mindestens wie das Geschoss, jedoch mind. F30'+(tr>30?' (hier F'+tr+')':'')+'. Treppenraumwände: '+(gk===3?'feuerhemmend (F30)':gk===4?'hochfeuerhemmend, mech. beansprucht (F60-M)':gk===5?'Bauart einer Brandwand':'nach GK')+'. Brandwand: REIM 90 (F90-A-M).',[],'','info');}
  }
  if(p.type==='vk'){
    rw2Check('07 · Rettungswege',comps.filter(c=>c.zone!==2),c=>2,'Jeder Verkaufsraum, Aufenthaltsraum und jede Ladenstraße braucht mindestens zwei voneinander unabhängige Rettungswege (Ausgänge oder Treppenräume).');
    {const is=[];let wmax=0,n=0;plain.filter(c=>c.use===0).forEach(c=>{n++;const r=luftOf(c);if(r.worst>wmax)wmax=r.worst;
       const fc=cxz(r.wc);if(r.wt)lines.push({pts:[fc,[r.wt.ex,r.wt.ez]],len:r.worst,lim:25,bad:r.worst>25,label:'Luftlinie',air:true,room:c.id});
       if(r.worst>25||!r.wt)is.push(iss(fc[0],fc[1],c.name+': '+(r.wt?fm(r.worst)+' m Luftlinie (max. 25 m)':'kein Ausgang oder Treppenraum erreichbar'),'luft:'+c.id,{blk:'room',room:c.id,r:3}));});
     chk('luft','Verkaufsraum: Luftlinie ≤ 25 m','07 · Rettungswege',!is.length,n?'Größte Luftlinie '+fm(wmax)+' m':'Kein Verkaufsraum',is,'Gemessen bis zum nächsten Ausgang des Verkaufsraums (Tür zur Ladenstraße, zum Treppenraum oder ins Freie; vereinfachte Darstellung). Weitere Türen näher an den entferntesten Punkt setzen.');}
    lenCheck('lauf','Ladenstraße und sonstige Räume: Lauflinie ≤ 35 m','07 · Rettungswege',c=>o.spr?{v:35,alt:105}:{v:35},'Mit Sprinkler, über Treppenraum und 1. RW über die Ladenstraße sind 105 m erlaubt (Schalter Sprinkler im Reiter Plan). Sonst Ausgänge/Treppenräume enger setzen.',
      comps.filter(c=>c.zone===1||(c.zone===0&&c.use===1)),c=>c.zone===1?T.flur:'Lauflinie');
    {const is=[];let n=0;dg.forEach((q,gi)=>{const ra=q.a>=0?comps[q.a]:null,rb=q.b>=0?comps[q.b]:null;
       const vr=(ra&&ra.zone===0&&ra.use===0)?ra:((rb&&rb.zone===0&&rb.use===0)?rb:null);if(!vr)return;
       const other=vr===ra?rb:ra;if(other&&other.zone===0)return;n++;
       const need=vr.area<=500?1:2;if(q.width<need)is.push(iss(q.cx,q.cz,'Ausgang aus '+vr.name+': '+q.width+' m breit, mind. '+fm(need,2)+' m'+(need===1?' (Raum ≤ 500 m²)':''),'ausg:'+gi,{blk:'spot',r:2.5}));});
     chk('ausg','Ausgänge aus Verkaufsräumen ≥ 2,00 m','07 · Rettungswegbreiten',!is.length,n?(n-is.length)+' von '+n+' Ausgängen breit genug':'Noch kein Ausgang',is,'Türen mit dem Werkzeug Tür entlang der Wand ziehen: jede Zelle ist 1 m breit. Ausnahme: Verkaufsraum ≤ 500 m² darf 1,00 m.');}
    {const is=[];let n=0;fl.forEach(c=>{n++;const w=compWidth(c);if(w.w<5){const cc=cxz(w.c);is.push(iss(cc[0],cc[1],c.name+' nur '+w.w+' m breit (mind. 5,00 m)','laden:'+c.id,{blk:'spot',r:3}));}});
     if(gcells.length&&gmin<2){const cc=cxz(gmc);is.push(iss(cc[0],cc[1],'Hauptgang nur '+gmin+' m breit (mind. 2,00 m)','gang',{blk:'spot',r:3}));}
     chk('laden','Ladenstraße ≥ 5,00 m · Hauptgang ≥ 2,00 m','07 · Rettungswegbreiten',!is.length,fl.length?'Schmalste Ladenstraße '+Math.min.apply(null,fl.map(c=>compWidth(c).w))+' m':'Keine Ladenstraße',is,'Flur-Fläche breiter malen (Ladenstraße mind. 5 m), Hauptgänge mind. 2 m.');}
    baCheck('07 · Brandabschnitte',b=>({a:o.eg?(o.spr?10000:3000):(o.spr?5000:1500)}),o.eg?'Brandabschnitt erdgeschossig ≤ '+(o.spr?'10.000':'3.000')+' m²':'Brandabschnitt je Geschoss ≤ '+(o.spr?'5.000':'1.500')+' m²','Brandwand (REIM 90) einziehen oder Sprinkleranlage einschalten (Reiter Plan).');
    {const big=bcs.some(b=>b.area>3000),need=!(o.eg&&!big);
     chk('spr','Sprinkleranlage','07 · Besondere Einrichtungen',!(need&&!o.spr),need?(o.spr?'Pflicht, vorhanden':'Pflicht, fehlt'):'Ausnahme: erdgeschossig und Brandabschnitt ≤ 3.000 m²',need&&!o.spr?[iss(cen[0],cen[1],'Sprinkleranlage fehlt','spr',{noPos:1})]:[],'Im Reiter Plan Sprinkleranlage einschalten.');}
    chk('einr','Weitere Pflichten (nicht planbar)','07 · Besondere Einrichtungen',true,'BMA mit automatischen Meldern zur Feuerwehr · Rauch- und Wärmeabzug (Verkaufsräume > 50 m², Lager > 200 m², Ladenstraßen) · Wandhydranten Typ F · Brandschutzbeauftragter.',[],'','info');
  }
  if(p.type==='bh'){
    rw2Check('08 · Rettungswege',plain.filter(c=>c.use===0),c=>2,'Je Beherbergungsraum zwei unabhängige Rettungswege: 1. RW notwendige Treppe, 2. RW zweite Treppe oder Außentreppe (Ausgang). Flur mit zwei Fluchtrichtungen. Anleiterung (bis 60 Gastbetten) wird hier nicht angenommen.');
    stichCheck('08 · Rettungswege',15);
    tuerCheck('08 · Türen in notwendigen Fluren');
    {const b=o.betten>60;const L=[{n:'Alarmierungseinrichtung',on:o.alarm,req:1},{n:'Sicherheitsbeleuchtung',on:o.sibel,req:1},{n:'Rettungswegplan im Zimmer',on:o.plan,req:1},{n:'Brandmeldeanlage',on:o.bma,req:b},{n:'Brandschutzordnung + Feuerwehrpläne',on:o.bso,req:b}];equipCheck('08 · Anlagentechnik, Organisation',L);}
    {let md=0;plain.forEach(c=>{if(c.far>=0){md=Math.max(md,c.dmax+0.5);lines.push({pts:pathFrom(c.far),len:c.dmax+0.5,lim:null,bad:false,label:'Rettungsweg',room:c.id});}});
     chk('tbr','Türen nicht versperrt','08 · Türen',true,'Türen in Rettungswegen dürfen nicht versperrt sein und müssen von innen leicht zu öffnen sein.',[],'','info');}
  }
  const hallLimit=()=>o.alarm?(o.h>=10?70:50):(o.h>=10?50:35);
  if(p.type==='ind'){
    const area=plain.reduce((s,c)=>s+c.area,0);
    {const is=[];let ok=0;plain.forEach(c=>{const big=c.area>1600;let okc=c.flow>=(big?2:1);let note='';
       if(big&&okc){const tg=dg.filter(q=>(q.out||q.ntr)&&(q.a===c.id||q.b===c.id));let opp=false;
         for(let i=0;i<tg.length&&!opp;i++)for(let j=i+1;j<tg.length&&!opp;j++){const ax=tg[i].cx-c.cx,az=tg[i].cz-c.cy,bx=tg[j].cx-c.cx,bz=tg[j].cz-c.cy;const la=Math.hypot(ax,az),lb=Math.hypot(bx,bz);if(la>0&&lb>0&&(ax*bx+az*bz)/(la*lb)<=-0.5)opp=true;}
         if(!opp){okc=false;note='Rettungswege nicht entgegengesetzt';}}
       if(okc)ok++;else is.push(iss(c.cx,c.cy,c.name+': '+(note||(c.flow===0?'kein Rettungsweg':'nur ein baulicher Rettungsweg bei '+c.area+' m²')),'rw2',{blk:'room',room:c.id,r:4}));});
     chk('rw2','Zwei entgegengesetzte Rettungswege ab > 1.600 m²','09 · Rettungswege',!is.length&&plain.length>0,plain.length?'Grundfläche '+area+' m²'+(area>1600?' (über 1.600 m²: zwei entgegengesetzte RW)':''):'Keine Halle',is,'Ausgänge auf gegenüberliegenden Seiten der Halle setzen (Winkel von der Hallenmitte mindestens 120°).');}
    lenCheck('rwl','Rettungsweglänge ≤ '+hallLimit()+' m','09 · Rettungsweglängen',c=>({v:hallLimit()}),'Raumhöhe '+o.h+' m, '+(o.alarm?'mit':'ohne')+' Alarmierungsanlage: '+hallLimit()+' m. Mehr Ausgänge setzen oder Alarmierungsanlage einschalten.',plain,c=>'Rettungsweg');
    {const is=[];let wmax=0;
     if(!gcells.length&&plain.length)is.push(iss(cen[0],cen[1],'Kein Hauptgang geplant','hg15',{noPos:1}));
     else{let wc=-1,wd=-1;plain.forEach(c=>c.cells.forEach(x=>{const d=A.fG.dist[x];if(d>=INF){if(wd<INF){wd=INF;wc=x;}}else if(d>wd&&wd<INF){wd=d;wc=x;}}));
       wmax=wd;if(wd>15){const cc=cxz(wc);is.push(iss(cc[0],cc[1],wd>=INF?'Stelle ohne Weg zum Hauptgang':fm(wd)+' m bis zum Hauptgang (max. 15 m)','hg15',{blk:'spot',r:4}));
         if(wd<INF)lines.push({pts:(()=>{const pts=[];let k=wc,gd=0;while(k>=0&&gd++<500){pts.push(cxz(k));if(A.fG.par[k]<0)break;k=A.fG.par[k];}return pts;})(),len:wd,lim:15,bad:true,label:'zum Hauptgang'});}}
     chk('hg15','Von jeder Stelle ≤ 15 m bis zum Hauptgang','09 · Rettungswege',!is.length,gcells.length?(wmax>=INF?'Nicht erreichbar':'Weiteste Stelle '+fm(wmax)+' m'):'Hauptgang fehlt',is,'Hauptgang mit dem Werkzeug Gang einzeichnen, sodass keine Stelle weiter als 15 m entfernt ist.');}
    {const is=[];if(gcells.length&&gmin<2){const cc=cxz(gmc);is.push(iss(cc[0],cc[1],'Hauptgang nur '+gmin+' m breit (mind. 2,00 m)','gang',{blk:'spot',r:3}));}
     chk('hgb','Hauptgang ≥ 2,00 m breit','09 · Rettungswege',!is.length&&gcells.length>0,gcells.length?'Schmalste Stelle '+gmin+' m':'Hauptgang fehlt',is,'Gang mindestens 2 Zellen (2 m) breit malen.');}
    chk('bba','Brandabschnitte und Sicherheitskategorie','09 · Brandabschnitte',true,'Die Größe von Brandabschnitt/Brandbekämpfungsabschnitt hängt von der Sicherheitskategorie K1–K4 oder dem Rechenverfahren ab (hier nicht geprüft). Ab Grundfläche > 5.000 m²: Umfahrung für Feuerwehrfahrzeuge.',[],'','info');
  }
  if(p.type==='gar'){
    const nutz=plain.reduce((s,c)=>s+c.area,0),klasse=nutz<=100?'Kleingarage':nutz<=1000?'Mittelgarage':'Großgarage';
    const closed=!o.offen;
    rw2Check('10 · Rettungswege',plain,c=>{if(nutz<=100)return 1;if(o.ober&&c.dmax>=0&&c.dmax+0.5<=10)return 1;return 2;},klasse+' ('+nutz+' m²): '+(nutz>100?'mindestens zwei unabhängige bauliche Rettungswege je Geschoss. Ausnahme: oberirdisch mit Ausgang ≤ 10 m.':'ein Rettungsweg genügt.'),'Zwei unabhängige bauliche Rettungswege je Geschoss (Treppenraum oder Ausgang).');
    lenCheck('rwl','Rettungsweglänge ≤ '+(o.offen?50:35)+' m ('+(o.offen?'offene':'geschlossene')+' Garage)','10 · Rettungswege',c=>({v:o.offen?50:35}),'Offene Garagen 50 m, geschlossene 35 m bis Ausgang oder Treppenraum. Weitere Ausgänge/Treppenräume setzen.',plain,c=>'Rettungsweg');
    if(!o.offen)baCheck('10 · Brandabschnitte',b=>({a:o.ober?5000:(o.spr?5000:2500)}),'Brandabschnitt ≤ '+(o.ober?'5.000':(o.spr?'5.000 (mit Sprinkler)':'2.500'))+' m²','Brandwand einziehen'+(o.ober?'':' oder Sprinkler einschalten (Verdoppelung)')+'.');
    else chk('ba','Brandabschnitt','10 · Brandabschnitte',true,'Für offene Garagen nennt die Lernseite keine Abschnittsgröße.',[],'','info');
    {const need=closed&&nutz>100;chk('abl','Maschinelle Abluftanlage','10 · Anlagentechnik',!(need&&!o.abl),need?(o.abl?'Pflicht, vorhanden':'Pflicht, fehlt'):'Nur bei geschlossenen Mittel- und Großgaragen',need&&!o.abl?[iss(cen[0],cen[1],'Abluftanlage fehlt','abl',{noPos:1})]:[],'Im Reiter Plan einschalten.');}
    {const need=nutz>1000;chk('ent','Entrauchung (10-facher Luftwechsel/h)','10 · Anlagentechnik',!(need&&!o.ent),need?(o.ent?'Pflicht, vorhanden':'Pflicht, fehlt'):'Nur bei Großgaragen (> 1.000 m²)',need&&!o.ent?[iss(cen[0],cen[1],'Entrauchung fehlt','ent',{noPos:1})]:[],'Im Reiter Plan einschalten.');}
    {const need=closed&&nutz>2500;chk('bma','Brandmeldeanlage','10 · Anlagentechnik',!(need&&!o.bma),need?(o.bma?'Pflicht, vorhanden':'Pflicht, fehlt'):'Nur bei geschlossener Großgarage > 2.500 m²',need&&!o.bma?[iss(cen[0],cen[1],'BMA fehlt','bma',{noPos:1})]:[],'Im Reiter Plan einschalten.');}
  }
  A.score={req:checks.filter(c=>c.kind==='req').length,ok:checks.filter(c=>c.kind==='req'&&c.ok).length};
  A.allOk=A.score.ok===A.score.req;
  A.issues=[];checks.forEach(c=>{if(c.kind==='req'&&!c.ok)c.issues.forEach(i=>{i.check=c.id;A.issues.push(i);});});
  return A;
}
/* ===== Startpläne, Fehlerpläne, Aufgaben ===== */
function planStd(){const p=makePlan('std',40,18);
  pZone(p,4,8,35,10,1);pZone(p,0,8,3,10,2);pZone(p,36,8,39,10,2);
  [10,20,30].forEach(x=>{pWall(p,x,0,x,8);pWall(p,x,11,x,18);});
  [6,15,25,32].forEach(x=>{pDoor(p,x,8,x+1,8,1);pDoor(p,x,11,x+1,11,1);});
  pDoor(p,4,8,4,11,2);pDoor(p,36,8,36,11,2);
  pWall(p,20,8,20,11);pDoor(p,20,8,20,11,2);
  pUse(p,20,11,29,17,1);pDoor(p,25,11,26,11,4);
  return p;}
function planStdL(){const p=makePlan('std',44,24,(x,y)=>!(x>=28&&y>=10));
  pZone(p,4,4,39,6,1);pZone(p,12,7,14,19,1);pZone(p,0,4,3,6,2);pZone(p,40,4,43,6,2);pZone(p,11,20,15,23,2);
  pWall(p,14,0,14,4);pWall(p,33,0,33,4);pWall(p,33,7,33,10);pWall(p,0,15,12,15);pWall(p,15,15,28,15);
  pWall(p,28,0,28,10,2);
  [[6,4],[20,4],[30,4],[37,4]].forEach(a=>pDoor(p,a[0],a[1],a[0]+1,a[1],1));[[30,7],[37,7]].forEach(a=>pDoor(p,a[0],a[1],a[0]+1,a[1],1));
  [10,17].forEach(y=>pDoor(p,12,y,12,y+1,1));[10,17].forEach(y=>pDoor(p,15,y,15,y+1,1));
  pDoor(p,4,4,4,7,2);pDoor(p,40,4,40,7,2);pDoor(p,12,20,15,20,2);pDoor(p,28,4,28,7,2);pWall(p,12,7,15,7);pDoor(p,12,7,15,7,2);
  return p;}
function planBh(){const p=makePlan('bh',44,18);
  pZone(p,4,8,39,9,1);pZone(p,0,7,3,10,2);pZone(p,40,7,43,10,2);
  [8,16,24,32].forEach(x=>pWall(p,x,0,x,8));[8,16,32].forEach(x=>pWall(p,x,10,x,18));
  [5,11,19,27,35].forEach(x=>pDoor(p,x,8,x+1,8,2));
  [5,11,35].forEach(x=>pDoor(p,x,10,x+1,10,2));
  pDoor(p,19,10,21,10,2);pDoor(p,27,10,28,10,2);
  pUse(p,16,10,31,17,1);
  pDoor(p,4,8,4,10,2);pDoor(p,40,8,40,10,2);
  return p;}
function planVk(lad,wide){const p=makePlan('vk',64,34);lad=lad||[14,19];
  pZone(p,0,lad[0],63,lad[1],1);
  const a=lad[0],b=lad[1]+1;
  pWall(p,21,0,21,a);pWall(p,42,0,42,a);
  pDoor(p,10,a,12,a,1);pDoor(p,31,a,33,a,1);pDoor(p,52,a,54,a,1);
  if(!wide)pWall(p,32,b,32,34);
  pUse(p,0,b,31,33,0);pUse(p,32,b,63,33,wide?0:1);
  pDoor(p,15,b,wide?16:17,b,1);if(!wide)pDoor(p,47,b,48,b,1);
  pDoor(p,0,lad[0],0,b,5);pDoor(p,64,lad[0],64,b,5);
  if(!wide)pDoor(p,56,34,58,34,5);
  return p;}
function planInd(){const p=makePlan('ind',64,32);
  pGang(p,0,15,63,16);
  pDoor(p,0,15,0,17,5);pDoor(p,64,15,64,17,5);
  [15,47].forEach(x=>{pDoor(p,x,0,x+2,0,5);pDoor(p,x,32,x+2,32,5);});
  return p;}
function planGar(){const p=makePlan('gar',56,28);
  pZone(p,0,12,3,15,2);pZone(p,52,12,55,15,2);pZone(p,26,0,29,3,2);pZone(p,26,24,29,27,2);
  pDoor(p,4,13,4,15,1);pDoor(p,52,13,52,15,1);pDoor(p,27,4,29,4,1);pDoor(p,27,24,29,24,1);
  return p;}
function emptyPlan(type,W,H,maskFn){return makePlan(type,W,H,maskFn);}
function startPlan(type,variant){if(type==='std'&&variant==='l')return planStdL();return {std:planStd,bh:planBh,vk:()=>planVk(),ind:planInd,gar:planGar}[type]();}
function erase(p,x0,y0,x1,y1){lineEdges(x0,y0,x1,y1).forEach(e=>eraseEdge(p,e[0],e[1],e[2]));}
function fehlerStd(){const p=planStd();erase(p,20,8,20,11);pDoor(p,4,8,4,11,1);pDoor(p,25,11,26,11,1);erase(p,25,8,26,8);return p;}
function fehlerBh(){const p=planBh();erase(p,40,8,40,10);pDoor(p,11,8,12,8,1);pDoor(p,4,8,4,10,1);return p;}
function fehlerVk(){const p=planVk([15,18],true);pDoor(p,15,19,16,19,0);pDoor(p,15,19,16,19,1);return p;}
function lShape(W,H,cw,ch){return (x,y)=>!(x>=cw&&y>=ch);}
const TASKS=[
 {id:'f1',kind:'find',title:'Bürogeschoss prüfen',sub:'Standardgebäude · 4 Fehler',type:'std',opts:{gk:4,kg:0},make:fehlerStd,
  intro:'Dieser Plan hat Mängel bei Rettungswegen und Türen. Tippe die Stellen an, die dir falsch vorkommen, und gib dann ab.'},
 {id:'f2',kind:'find',title:'Hotel prüfen',sub:'Beherbergungsstätte · 4 Fehler',type:'bh',opts:{betten:40,alarm:1,sibel:1,plan:1,bma:0,bso:0},make:fehlerBh,
  intro:'In diesem Hotelgeschoss stimmt etwas mit Rettungswegen und Türen nicht. Finde alle Verstöße.'},
 {id:'f3',kind:'find',title:'Markt prüfen',sub:'Verkaufsstätte · Breiten und Wege',type:'vk',opts:{eg:1,spr:0},make:fehlerVk,
  intro:'Ein Markt im Erdgeschoss. Achte auf Breiten, Ausgänge und Entfernungen.'},
 {id:'b1',kind:'build',title:'Bürogeschoss 44 m',sub:'Standardgebäude · Länge 44 m, Tiefe 18 m',type:'std',opts:{gk:4,kg:0},W:44,H:18,
  text:'Plane ein Geschoss mit 44 m Länge: mindestens 4 Nutzungseinheiten mit Flur, alle Prüfungen müssen bestehen.',
  req:A=>({ok:A.rooms.filter(c=>c.area>=12).length>=4,txt:'Mindestens 4 Nutzungseinheiten (Räume)',v:A.rooms.filter(c=>c.area>=12).length+' Räume'}),
  bonus:A=>({ok:A.rooms.filter(c=>c.area>=12).length>=6,txt:'Bonus: mindestens 6 Nutzungseinheiten',v:A.rooms.filter(c=>c.area>=12).length+' Räume'})},
 {id:'b2',kind:'build',title:'Produktionshalle',sub:'Industriebau · 60 m × 30 m, Höhe 5 m',type:'ind',opts:{h:5,alarm:0},W:60,H:30,
  text:'Plane die Halle (60 m × 30 m = 1.800 m², Raumhöhe 5 m, ohne Alarmierungsanlage) so, dass alles besteht.',
  req:A=>({ok:true,txt:'Halle 60 m × 30 m',v:''}),
  bonus:A=>{const n=A.dg.filter(q=>q.out||q.ntr).length;return {ok:n<=4&&n>0,txt:'Bonus: höchstens 4 Ausgänge',v:n+' Ausgänge'};}},
 {id:'b3',kind:'build',title:'Tiefgarage',sub:'Garage · 50 m × 30 m, geschlossen',type:'gar',opts:{offen:0,ober:0,spr:0,abl:0,ent:0,bma:0},W:50,H:30,
  text:'Plane eine geschlossene, unterirdische Garage (50 m × 30 m = 1.500 m²) so, dass alles besteht.',
  req:A=>({ok:true,txt:'Garage 50 m × 30 m',v:''}),
  bonus:A=>{const n=A.dg.filter(q=>q.out||q.ntr).length;return {ok:n<=4&&n>0,txt:'Bonus: höchstens 4 Ausgänge/Treppenräume',v:n+' Ausgänge'};}}];
/* ===== three.js-Szene: 3D-Grundriss, Werkzeuge, Messlinien, Evakuierung ===== */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const DCOL=[0,0x6ea8ff,0x3fd6c6,0xffb340,0xff6f4a,0x3fe08a];
const DCSS=['','#6ea8ff','#3fd6c6','#ffb340','#ff6f4a','#3fe08a'];
const WTH=[0,0.22,0.46,0.36,0.18,0.28], WHT=[0,2.0,2.35,2.4,1.92,2.15], WCOL=[0,0xe9edf5,0xc2452d,0x5a6c8f,0xdcd2b4,0x58c47d];
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function Acc(){this.p=[];this.n=[];this.i=[];}
Acc.prototype.box=function(x0,x1,y0,y1,z0,z1){
  const p=this.p,n=this.n,idx=this.i,b=p.length/3;
  const F=[[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],0,0,1],[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],0,0,-1],
    [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],1,0,0],[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],-1,0,0],
    [[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],0,1,0]];
  F.forEach((f,k)=>{const o=p.length/3;for(let j=0;j<4;j++){p.push(f[j][0],f[j][1],f[j][2]);n.push(f[4],f[5],f[6]);}idx.push(o,o+1,o+2,o,o+2,o+3);});
};
Acc.prototype.mesh=function(mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setIndex(this.i);return new THREE.Mesh(g,mat);};
function disposeGroup(g){while(g.children.length){const c=g.children[0];g.remove(c);if(c.children&&c.children.length)disposeGroup(c);if(c.geometry)c.geometry.dispose();
  if(c.material){if(c.material.map&&!c.material.map.keepMe)c.material.map.dispose();if(!c.material.userData||!c.material.userData.keep)c.material.dispose();}}}
function labelSprite(txt,o){
  o=o||{};const fs=o.fs||34,c=document.createElement('canvas'),x=c.getContext('2d');x.font='700 '+fs+'px "Segoe UI",Arial,sans-serif';
  const tw=Math.ceil(x.measureText(txt).width)+(o.dot?fs*0.9:0)+fs*0.9,hh=Math.round(fs*1.75);c.width=tw;c.height=hh;
  x.font='700 '+fs+'px "Segoe UI",Arial,sans-serif';x.fillStyle=o.bg||'rgba(13,21,34,0.82)';
  const r=hh/2-3;x.beginPath();if(x.roundRect)x.roundRect(2,3,tw-4,hh-6,r);else x.rect(2,3,tw-4,hh-6);x.fill();
  if(o.bd){x.lineWidth=3;x.strokeStyle=o.bd;x.stroke();}
  let tx=fs*0.45;if(o.dot){x.fillStyle=o.dot;x.beginPath();x.arc(fs*0.75,hh/2,fs*0.24,0,7);x.fill();tx=fs*1.2;}
  x.fillStyle=o.fg||'#fff';x.textBaseline='middle';x.fillText(txt,tx,hh/2+1);
  const tex=new THREE.CanvasTexture(c);tex.minFilter=THREE.LinearFilter;
  const m=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false,sizeAttenuation:false});
  const s=new THREE.Sprite(m);s.userData.px=o.px||15;s.userData.lod=o.lod||0;s.userData.ar=tw/hh;s.scale.set(0.02*tw/hh,0.02,1);s.renderOrder=30;return s;
}
function ribbon(pts,w,y,period){
  const pos=[],uv=[],idx=[];let acc=0;
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<1e-6)continue;
    const nx=-dz/l*w/2,nz=dx/l*w/2,o=pos.length/3;
    pos.push(a[0]+nx,y,a[1]+nz,a[0]-nx,y,a[1]-nz,b[0]-nx,y,b[1]-nz,b[0]+nx,y,b[1]+nz);
    uv.push(acc/period,0,acc/period,1,(acc+l)/period,1,(acc+l)/period,0);idx.push(o,o+2,o+1,o,o+3,o+2);acc+=l;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g;
}
function dashTex(col){
  const c=document.createElement('canvas');c.width=64;c.height=8;const x=c.getContext('2d');x.fillStyle=col;x.fillRect(0,0,38,8);
  const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.ClampToEdgeWrapping;t.keepMe=true;return t;
}
function simplify(pts){const o=[pts[0]];for(let i=1;i<pts.length-1;i++){const a=o[o.length-1],b=pts[i],c=pts[i+1];
    const cr=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);if(Math.abs(cr)>1e-6)o.push(b);}o.push(pts[pts.length-1]);return o;}

function createScene(canvas,host,cb){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const bgCol=()=>{try{return new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#0d1522');}catch(e){return new THREE.Color(0x0d1522);}};const scene=new THREE.Scene();scene.background=bgCol();
  const camera=new THREE.PerspectiveCamera(36,1,2,400);
  scene.add(new THREE.HemisphereLight(0xe3ebff,0x3a4259,1.0));
  const sun=new THREE.DirectionalLight(0xfff0dc,0.8);sun.position.set(-18,40,24);scene.add(sun);
  const planG=new THREE.Group(),lineG=new THREE.Group(),issG=new THREE.Group(),markG=new THREE.Group(),ovl=new THREE.Group(),perG=new THREE.Group();
  scene.add(planG,lineG,issG,markG,ovl,perG);
  window.addEventListener('embtheme',()=>{scene.background=bgCol();try{S.dirty=true;}catch(e){}});
  const S={plan:null,A:null,W:40,H:18,tool:'view',sub:0,snap:1,locked:false,showLines:true,showIssues:true,dirty:true,aspect:1,marks:[],reveal:null,sel:null,time:0,evac:null,labels:true};
  const cam={theta:-0.32,phi:0.78,zoom:1,tx:0,tz:0};let goal=null;
  const dashMats={};
  [['ok','#35d07f'],['bad','#ff5a47'],['info','#8cb8ff']].forEach(a=>{dashMats[a[0]]=new THREE.MeshBasicMaterial({map:dashTex(a[1]),transparent:true,depthWrite:false});dashMats[a[0]].userData.keep=true;});
  /* ---------- Kamera ---------- */
  function fitDist(th,ph){const t=Math.tan(camera.fov*Math.PI/360),W=S.W,H=S.H;
    const ew=Math.abs(W*Math.cos(th))+Math.abs(H*Math.sin(th)),eh=Math.abs(W*Math.sin(th))+Math.abs(H*Math.cos(th));
    const w=ew+6,h=eh*Math.cos(ph)+2.6*Math.sin(ph)+6;
    return Math.max((h/2)/t,(w/2)/(t*S.aspect))*1.04;}
  function baseDist(){return fitDist(homeTheta('2d'),0.02);}
  function zoom3(){return Math.min(1.6,1.1*fitDist(homeTheta('3d'),0.78)/baseDist());}
  function homeTheta(mode){const por=S.aspect<1.1&&S.W>=S.H*1.3;return por?(mode==='2d'?-Math.PI/2:-1.38):(mode==='2d'?0:-0.32);}
  function applyCam(){const r=baseDist()*cam.zoom,sp=Math.sin(cam.phi);
    camera.position.set(cam.tx+r*sp*Math.sin(cam.theta),r*Math.cos(cam.phi),cam.tz+r*sp*Math.cos(cam.theta));
    camera.lookAt(cam.tx,0,cam.tz);camera.updateMatrixWorld();}
  function relabel(root){const ch=Math.max(canvas.clientHeight,50);root.traverse(o=>{if(o.isSprite&&o.userData.px){const hh=o.userData.px/(ch*1.54*0.9);o.scale.set(hh*o.userData.ar,hh,1);}});S.dirty=true;}
  function setSize(){const w=host.clientWidth||300,h=host.clientHeight||300;renderer.setSize(w,h,false);S.aspect=w/h;camera.aspect=S.aspect;camera.updateProjectionMatrix();relabel(scene);S.dirty=true;}
  const ro=new ResizeObserver(setSize);ro.observe(host);setSize();
  function fly(g){goal=Object.assign({},cam,g);S.dirty=true;}
  /* ---------- Hilfen ---------- */
  const w2x=px=>px-S.W/2,w2z=pz=>pz-S.H/2;
  const ray=new THREE.Raycaster();
  function pickPlane(cx,cy){const r=canvas.getBoundingClientRect();const v=new THREE.Vector2(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);
    ray.setFromCamera(v,camera);const o=ray.ray.origin,d=ray.ray.direction;if(Math.abs(d.y)<1e-5)return null;const t=-o.y/d.y;if(t<0)return null;
    return {px:o.x+d.x*t+S.W/2,pz:o.z+d.z*t+S.H/2};}
  function ppm(){return canvas.clientHeight/(2*baseDist()*cam.zoom*Math.tan(camera.fov*Math.PI/360))*(1);}
  const snapV=(px,pz)=>{const s=S.snap,W=S.W,H=S.H;let x=Math.round(px/s)*s,z=Math.round(pz/s)*s;if(Math.abs(px-W)<s/2)x=W;if(Math.abs(pz-H)<s/2)z=H;return [clamp(x,0,W),clamp(z,0,H)];};
  function nearEdge(px,pz,filter,thr){
    const p=S.plan,cands=[];const ry=Math.round(pz),rx=Math.round(px);
    [ry-1,ry,ry+1].forEach(y=>{const x=Math.floor(px);cands.push({vert:false,x,y});});
    [rx-1,rx,rx+1].forEach(x=>{const y=Math.floor(pz);cands.push({vert:true,x,y});});
    let best=null,bd=1e9;
    cands.forEach(c=>{if(c.x<0||c.y<0||(c.vert?(c.x>S.W||c.y>=S.H):(c.x>=S.W||c.y>S.H)))return;
      const e=edge(p,c.vert,c.x,c.y);if(!e.A&&!e.B)return;if(filter&&!filter(e))return;
      const ax=c.vert?c.x:c.x,az=c.vert?c.y:c.y,bx=c.vert?c.x:c.x+1,bz=c.vert?c.y+1:c.y;
      const tx=clamp(px,ax,bx),tz=clamp(pz,az,bz),d=Math.hypot(px-tx,pz-tz);if(d<bd){bd=d;best=c;}});
    return best&&bd<=thr?best:null;}
  const thrM=()=>clamp(26/Math.max(ppm(),1),0.45,3.5);
  /* ---------- Überlagerungen (Vorschau) ---------- */
  const mBar=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffa412,transparent:true,opacity:0.9,depthTest:false}));mBar.renderOrder=25;mBar.visible=false;ovl.add(mBar);
  const mRect=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffa412,transparent:true,opacity:0.45,depthTest:false,side:THREE.DoubleSide}));mRect.rotation.x=-Math.PI/2;mRect.renderOrder=24;mRect.visible=false;ovl.add(mRect);
  const mDot=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.12,16),new THREE.MeshBasicMaterial({color:0xffa412,depthTest:false}));mDot.renderOrder=26;mDot.visible=false;ovl.add(mDot);
  const mRing=new THREE.Mesh(new THREE.RingGeometry(0.45,0.6,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8,depthTest:false,side:THREE.DoubleSide}));mRing.rotation.x=-Math.PI/2;mRing.renderOrder=26;mRing.visible=false;ovl.add(mRing);
  let mLab=null;
  function hideOvl(){mBar.visible=mRect.visible=mDot.visible=mRing.visible=false;if(mLab){ovl.remove(mLab);mLab.material.map.dispose();mLab.material.dispose();mLab=null;}S.dirty=true;}
  function setLab(txt,x,z,col){if(mLab&&mLab.userData.txt===txt){mLab.position.set(x,2.9,z);return;}
    if(mLab){ovl.remove(mLab);mLab.material.map.dispose();mLab.material.dispose();}
    mLab=labelSprite(txt,{fs:30,bg:'rgba(13,21,34,0.9)',bd:col,px:17});mLab.userData.txt=txt;mLab.position.set(x,2.9,z);ovl.add(mLab);relabel(mLab);}
  function showBar(a,b,col,h,th){const x0=w2x(a[0]),z0=w2z(a[1]),x1=w2x(b[0]),z1=w2z(b[1]);const l=Math.hypot(x1-x0,z1-z0);
    mBar.material.color.set(col);mBar.visible=true;mBar.scale.set(Math.abs(x1-x0)+th,h,Math.abs(z1-z0)+th);mBar.position.set((x0+x1)/2,h/2,(z0+z1)/2);return l;}
  function showRect(x0,z0,x1,z1,col){mRect.material.color.set(col);mRect.visible=true;mRect.scale.set(Math.max(0.01,x1-x0),Math.max(0.01,z1-z0),1);mRect.position.set(w2x((x0+x1)/2),0.09,w2z((z0+z1)/2));}
  function showDot(x,z,col){mDot.material.color.set(col);mDot.visible=true;mDot.position.set(w2x(x),0.1,w2z(z));}
  /* ---------- Plan aufbauen ---------- */
  let floorTex=null;
  const gtc=document.createElement('canvas');gtc.width=gtc.height=32;{const g=gtc.getContext('2d');g.strokeStyle='rgba(15,25,45,0.30)';g.lineWidth=2;g.strokeRect(0,0,32,32);}
  const gridTex=new THREE.CanvasTexture(gtc);gridTex.wrapS=gridTex.wrapT=THREE.RepeatWrapping;gridTex.anisotropy=8;gridTex.keepMe=true;
  const gridMat=new THREE.MeshBasicMaterial({map:gridTex,transparent:true,depthWrite:false,opacity:0});gridMat.userData.keep=true;
  const gridMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),gridMat);gridMesh.rotation.x=-Math.PI/2;gridMesh.position.y=0.03;gridMesh.renderOrder=1;scene.add(gridMesh);
  function paintFloor(){
    const p=S.plan,A=S.A,W=S.W,H=S.H,T=TYPES[p.type],K=16,M=3,c=document.createElement('canvas');c.width=(W+2*M)*K;c.height=(H+2*M)*K;const x=c.getContext('2d');
    x.fillStyle='#16213a';x.fillRect(0,0,c.width,c.height);
    const px=u=>(u+M)*K;
    x.fillStyle='#8da2c4';x.font='600 '+Math.round(K*0.72)+'px "Segoe UI",Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';
    x.strokeStyle='rgba(141,162,196,.55)';x.lineWidth=1.5;
    for(let u=0;u<=W;u+=5){x.beginPath();x.moveTo(px(u),px(0)-6);x.lineTo(px(u),px(0)-1);x.stroke();x.fillText(String(u),px(u),px(0)-K*0.95);}
    for(let v=0;v<=H;v+=5){x.beginPath();x.moveTo(px(0)-6,px(v));x.lineTo(px(0)-1,px(v));x.stroke();x.fillText(String(v),px(0)-K*1.2,px(v));}
    x.textAlign='left';x.fillText('m',px(W)+K*0.3,px(0)-K*0.95);
    const comp=A.comp,cols={};
    for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){const c0=xx+W*yy;if(!p.mask[c0])continue;const cp=A.comps[comp[c0]];let col;
      if(cp.zone===1)col='#f0e5c3';else if(cp.zone===2)col='#8ed8a6';else{col=T.ucol[cp.use]||T.ucol[0];}
      if(cp.zone===0){const k=cp.id%3;if(k===1)col=shade(col,-5);else if(k===2)col=shade(col,5);}
      x.fillStyle=col;x.fillRect(px(xx),px(yy),K+0.6,K+0.6);}
    // Gang
    for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){const c0=xx+W*yy;if(p.mask[c0]&&p.gang[c0]){x.fillStyle='rgba(255,196,40,.55)';x.fillRect(px(xx),px(yy),K+0.6,K+0.6);}}
    // Treppenräume: Stufen
    A.comps.forEach(cp=>{if(cp.zone!==2)return;x.strokeStyle='rgba(20,90,50,.6)';x.lineWidth=2;const wide=(cp.x1-cp.x0)>=(cp.y1-cp.y0);
      if(wide){for(let u=cp.x0+0.5;u<=cp.x1+1;u+=0.5){x.beginPath();x.moveTo(px(u),px(cp.y0)+3);x.lineTo(px(u),px(cp.y1+1)-3);x.stroke();}}
      else{for(let v=cp.y0+0.5;v<=cp.y1+1;v+=0.5){x.beginPath();x.moveTo(px(cp.x0)+3,px(v));x.lineTo(px(cp.x1+1)-3,px(v));x.stroke();}}});
    // Raster
    x.lineWidth=1;
    for(let u=0;u<=W;u++){x.strokeStyle=u%10===0?'rgba(15,25,45,.30)':u%5===0?'rgba(15,25,45,.20)':'rgba(0,0,0,0)';x.beginPath();x.moveTo(px(u)+0.5,px(0));x.lineTo(px(u)+0.5,px(H));x.stroke();}
    for(let v=0;v<=H;v++){x.strokeStyle=v%10===0?'rgba(15,25,45,.30)':v%5===0?'rgba(15,25,45,.20)':'rgba(0,0,0,0)';x.beginPath();x.moveTo(px(0),px(v)+0.5);x.lineTo(px(W),px(v)+0.5);x.stroke();}
    // Außerhalb des Grundrisses (Winkelbau) abdunkeln
    for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++)if(!p.mask[xx+W*yy]){x.fillStyle='#16213a';x.fillRect(px(xx)-0.5,px(yy)-0.5,K+1.2,K+1.2);}
    // Maßstabsbalken
    const sb=Math.min(10,Math.floor(W/4/5)*5||5),bx=px(0),by=px(H)+K*1.2;x.fillStyle='#8da2c4';x.fillRect(bx,by,sb*K,4);x.fillRect(bx,by-5,3,14);x.fillRect(bx+sb*K-3,by-5,3,14);
    x.textAlign='left';x.fillText(sb+' m',bx+sb*K+8,by+2);
    if(floorTex)floorTex.dispose();floorTex=new THREE.CanvasTexture(c);floorTex.anisotropy=8;floorTex.minFilter=THREE.LinearMipmapLinearFilter;return floorTex;
  }
  function shade(hex,d){const n=parseInt(hex.slice(1),16);const r=clamp((n>>16)+d,0,255),g=clamp(((n>>8)&255)+d,0,255),b=clamp((n&255)+d,0,255);return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}
  const matCache={};
  const LM=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
  function rebuild(){
    disposeGroup(planG);disposeGroup(lineG);disposeGroup(issG);
    const p=S.plan,A=S.A,W=S.W,H=S.H;
    // Sockel
    const base=new Acc();
    for(let y=0;y<H;y++){let x=0;while(x<W){if(!p.mask[x+W*y]){x++;continue;}let x1=x;while(x1<W&&p.mask[x1+W*y])x1++;base.box(w2x(x),w2x(x1),-0.9,-0.35,w2z(y),w2z(y+1));x=x1;}}
    planG.add(base.mesh(LM(0x24324d)));
    gridMesh.scale.set(W,H,1);gridTex.repeat.set(W,H);
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(W+6,H+6),new THREE.MeshBasicMaterial({map:paintFloor(),polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8}));fl.rotation.x=-Math.PI/2;fl.position.y=0.0;planG.add(fl);
    // Wände
    const acc={};const get=k=>acc[k]||(acc[k]=new Acc());
    const doorsA=new Acc(),thrA={};const dgmap=[];
    const runs=(vert)=>{const L1=vert?W:H,L2=vert?H:W;
      for(let a=0;a<=L1;a++){let run=null;
        for(let b=0;b<=L2;b++){let k=0,d=0;
          if(b<L2){const e=vert?edge(p,true,a,b):edge(p,false,b,a);if(e.A||e.B){k=e.w;d=e.d;}}
          if(run&&(k!==run.k||d>0||b===L2)){const t=WTH[run.k],h=WHT[run.k];
            const u0=run.s-t/2,u1=b+t/2,v0=a-t/2,v1=a+t/2;
            if(vert)get('w'+run.k).box(w2x(v0),w2x(v1),0,h,w2z(u0),w2z(u1));else get('w'+run.k).box(w2x(u0),w2x(u1),0,h,w2z(v0),w2z(v1));
            run=null;}
          if(b<L2&&k>0&&d===0&&!run)run={k,s:b};
          if(b<L2&&d>0){ /* Tür-Panel */
            const t=WTH[k]+0.06,col=DCOL[d];const key='d'+d;const A2=get(key);
            if(vert)A2.box(w2x(a-t/2),w2x(a+t/2),0.0,1.85,w2z(b),w2z(b+1));else A2.box(w2x(b),w2x(b+1),0.0,1.85,w2z(a-t/2),w2z(a+t/2));
            const T2=get('s'+d),tt=WTH[k]+0.5;
            if(vert)T2.box(w2x(a-tt/2),w2x(a+tt/2),0.0,0.07,w2z(b),w2z(b+1));else T2.box(w2x(b),w2x(b+1),0.0,0.07,w2z(a-tt/2),w2z(a+tt/2));
          }}}};
    runs(true);runs(false);
    Object.keys(acc).forEach(k=>{const kind=k[0],i=+k.slice(1);let m;
      if(kind==='w')m=LM(WCOL[i]);else if(kind==='d')m=new THREE.MeshLambertMaterial({color:DCOL[i],transparent:true,opacity:0.62,emissive:DCOL[i],emissiveIntensity:0.25});else m=new THREE.MeshBasicMaterial({color:DCOL[i]});
      planG.add(acc[k].mesh(m));});
    // Beschriftungen
    A.rooms.forEach(c=>{if(c.area<24)return;const s=labelSprite(c.sname+' · '+c.area+' m²',{fs:28,bg:'rgba(20,30,50,.66)',px:15,lod:6});s.position.set(w2x(c.cx),0.3,w2z(c.cy));s.userData.lab=1;planG.add(s);});
    A.comps.forEach(c=>{if(c.zone===1&&c.area>=4){const s=labelSprite(c.name,{fs:26,bg:'rgba(120,98,40,.78)',px:14,lod:8});s.position.set(w2x(c.cx),0.3,w2z(c.cy));s.userData.lab=1;planG.add(s);}
      if(c.zone===2){const s=labelSprite('Treppenraum',{fs:24,bg:'rgba(26,110,64,.85)',px:14,lod:8});s.position.set(w2x(c.cx),0.3,w2z(c.cy));s.userData.lab=1;planG.add(s);}});
    A.dg.forEach(q=>{const t=DN[q.d]+(q.width>1&&(q.d===5||q.width>=2)?' · '+q.width+' m':'');const s=labelSprite(t,{fs:24,bg:'rgba(10,16,28,.88)',dot:DCSS[q.d],px:13,lod:13});s.position.set(w2x(q.cx),2.7,w2z(q.cz));s.userData.lab=1;planG.add(s);});
    // Brandwand-Beschriftung
    if(A.bws.length){const s=labelSprite('REIM 90',{fs:24,bg:'rgba(150,40,25,.92)',px:13,lod:9});const b=A.bws[Math.floor(A.bws.length/2)];s.position.set(w2x((b[0]+b[2])/2),2.9,w2z((b[1]+b[3])/2));s.userData.lab=1;planG.add(s);}
    // Messlinien
    A.lines.forEach(l=>{if(!l.pts||l.pts.length<2)return;const pts=simplify(l.pts).map(q=>[w2x(q[0]),w2z(q[1])]);
      const g=ribbon(pts,0.34,0.14,2.4);const m=new THREE.Mesh(g,dashMats[l.lim==null?'info':(l.bad?'bad':'ok')]);m.renderOrder=6;lineG.add(m);
      const a=pts[0];const col=l.lim==null?'#8cb8ff':(l.bad?'#ff5a47':'#35d07f');
      const lab=labelSprite(fm(l.len)+' m'+(l.lim!=null?' / '+l.lim:''),{fs:26,bg:'rgba(10,16,28,.9)',bd:col,px:15,lod:12});lab.position.set(a[0],1.2,a[1]);lineG.add(lab);
      const dot=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.15,14),new THREE.MeshBasicMaterial({color:new THREE.Color(col)}));dot.position.set(a[0],0.12,a[1]);lineG.add(dot);});
    // Verstoß-Markierungen
    S.pulse=[];
    A.issues.forEach(i=>{if(i.noPos)return;const g=new THREE.Group();g.position.set(w2x(i.x),0,w2z(i.z));
      const rm=()=>new THREE.Mesh(new THREE.RingGeometry(0.75,1.0,32),new THREE.MeshBasicMaterial({color:0xff4d3a,transparent:true,opacity:0.9,side:THREE.DoubleSide,depthWrite:false}));
      const r1=rm(),r2=rm();[r1,r2].forEach(r=>{r.rotation.x=-Math.PI/2;r.position.y=0.16;g.add(r);});
      const core=new THREE.Mesh(new THREE.CircleGeometry(0.62,24),new THREE.MeshBasicMaterial({color:0xff4d3a,transparent:true,opacity:0.5,side:THREE.DoubleSide,depthWrite:false}));core.rotation.x=-Math.PI/2;core.position.y=0.15;g.add(core);
      const pin=new THREE.Mesh(new THREE.ConeGeometry(0.42,1.1,12),new THREE.MeshBasicMaterial({color:0xff4d3a}));pin.rotation.x=Math.PI;pin.position.y=2.2;g.add(pin);
      const ball=new THREE.Mesh(new THREE.SphereGeometry(0.3,12,8),new THREE.MeshBasicMaterial({color:0xffffff}));ball.position.y=3.0;g.add(ball);
      g.userData={r1,r2,pin,ball,i};issG.add(g);S.pulse.push(g);});
    issG.visible=S.showIssues;lineG.visible=S.showLines;
    S.lastPpm=null;
    relabel(planG);relabel(lineG);S.dirty=true;
  }
  /* ---------- Marker (Finde-die-Fehler) ---------- */
  function rebuildMarks(){
    disposeGroup(markG);
    S.marks.forEach((m,k)=>{const g=new THREE.Group();g.position.set(w2x(m.x),0,w2z(m.z));
      const ring=new THREE.Mesh(new THREE.RingGeometry(0.9,1.2,28),new THREE.MeshBasicMaterial({color:0xffa412,side:THREE.DoubleSide,depthTest:false,transparent:true}));ring.rotation.x=-Math.PI/2;ring.position.y=0.2;ring.renderOrder=22;g.add(ring);
      const pin=new THREE.Mesh(new THREE.ConeGeometry(0.4,1.0,10),new THREE.MeshBasicMaterial({color:0xffa412,depthTest:false}));pin.rotation.x=Math.PI;pin.position.y=1.6;pin.renderOrder=22;g.add(pin);
      const l=labelSprite(String(k+1),{fs:30,bg:'rgba(255,164,18,.95)',fg:'#241503',px:17});l.position.y=2.6;g.add(l);markG.add(g);});
    if(S.reveal)S.reveal.forEach(r=>{const g=new THREE.Group();g.position.set(w2x(r.x),0,w2z(r.z));const col=r.found?0x35d07f:0xff4d3a;
      const ring=new THREE.Mesh(new THREE.RingGeometry(1.1,1.5,32),new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide,depthTest:false,transparent:true,opacity:0.95}));ring.rotation.x=-Math.PI/2;ring.position.y=0.22;ring.renderOrder=23;g.add(ring);
      const l=labelSprite(r.found?'gefunden':'übersehen',{fs:26,bg:r.found?'rgba(30,140,80,.95)':'rgba(190,50,35,.95)',px:15});l.position.y=2.4;g.add(l);markG.add(g);});
    relabel(markG);S.dirty=true;
  }
  /* ---------- Eingabe ---------- */
  canvas.style.touchAction='none';canvas.addEventListener('contextmenu',e=>e.preventDefault());
  const ptrs=new Map();let drag=null,pinch=null,orbit=null,t0=0,sp0=null;
  const rectOf=(v0,v1)=>({x0:Math.min(v0[0],v1[0]),x1:Math.max(v0[0],v1[0]),z0:Math.min(v0[1],v1[1]),z1:Math.max(v0[1],v1[1])});
  const bt=()=>S.tool!=='view'&&!S.locked&&S.plan;
  const fDoor=e=>e.w>0&&(e.w!==3);          // Tür in Innenwand
  const fOut=e=>e.A!==e.B;                  // Außenkante
  const fAny=e=>true;
  const fWallErase=e=>(e.w>0&&e.w!==3)||e.d>0;
  const fRauch=e=>{if(!(e.A&&e.B))return false;const p=S.plan;return p.zone[e.ax+S.W*e.ay]===1&&p.zone[e.bx+S.W*e.by]===1;};
  function toolEdgeFilter(){const t=S.tool;return t==='door'?fDoor:t==='out'?fOut:t==='rauch'?fRauch:t==='erase'?fWallErase:fAny;}
  const TCOL={wall:0xe9edf5,brand:0xff5a3d,flur:0xf0d58a,ntr:0x58c47d,gang:0xffc428,use:0xffa412,erase:0xff4d3a,mark:0xffa412};
  function describe(d,pt){ /* Vorschau und Aktion aus Ziehzustand bestimmen */
    const t=S.tool;
    if(t==='wall'||t==='brand'){
      const v0=d.v0,v1=snapV(pt.px,pt.pz);let v=v1;const dx=Math.abs(v1[0]-v0[0]),dz=Math.abs(v1[1]-v0[1]);
      if(dx>=dz)v=[v1[0],v0[1]];else v=[v0[0],v1[1]];
      if(v[0]===v0[0]&&v[1]===v0[1]){
        const e=nearEdge(pt.px,pt.pz,e=>e.A&&e.B,thrM());
        if(e){const a=e.vert?[e.x,e.y]:[e.x,e.y],b=e.vert?[e.x,e.y+1]:[e.x+1,e.y];return {act:{t,edges:[[e.vert,e.x,e.y]]},prev:{kind:'bar',a,b,len:1}};}
        return {act:null,prev:{kind:'dot',v:v0}};}
      return {act:{t,edges:lineEdges(v0[0],v0[1],v[0],v[1])},prev:{kind:'bar',a:v0,b:v,len:Math.abs(v[0]-v0[0])+Math.abs(v[1]-v0[1])}};}
    if(t==='door'||t==='out'||t==='rauch'||t==='erase'&&d.e0){
      const e0=d.e0;if(!e0)return {act:null,prev:null};
      if(t==='rauch')return {act:{t,edge:e0},prev:{kind:'edge',e:e0}};
      let a,b;if(e0.vert){const i=clamp(Math.floor(pt.pz),0,S.H-1);const lo=Math.min(e0.y,i),hi=Math.max(e0.y,i);a=lo;b=hi;}else{const i=clamp(Math.floor(pt.px),0,S.W-1);const lo=Math.min(e0.x,i),hi=Math.max(e0.x,i);a=lo;b=hi;}
      const edges=[];for(let k=a;k<=b;k++)edges.push([e0.vert,e0.vert?e0.x:k,e0.vert?k:e0.y]);
      const A0=e0.vert?[e0.x,a]:[a,e0.y],B0=e0.vert?[e0.x,b+1]:[b+1,e0.y];
      return {act:{t,edges,sub:S.sub},prev:{kind:'bar',a:A0,b:B0,len:b-a+1,thin:true}};}
    if(t==='flur'||t==='ntr'||t==='gang'||t==='erase'||t==='use'){
      const v1=snapV(pt.px,pt.pz),v0=d.v0;
      if(t==='use'){const cx=Math.floor(pt.px),cz=Math.floor(pt.pz);if(!inside(S.plan,cx,cz))return {act:null,prev:null};return {act:{t,cell:[cx,cz],sub:S.sub},prev:{kind:'cell',x:cx,z:cz}};}
      if(v0[0]===v1[0]&&v0[1]===v1[1]){ // Tipp
        const cx=clamp(Math.floor(pt.px),0,S.W-1),cz=clamp(Math.floor(pt.pz),0,S.H-1);
        if(t==='ntr'){const x0=clamp(cx-1,0,S.W-4),z0=clamp(cz-1,0,S.H-4);return {act:{t,rect:{x0,x1:x0+4,z0,z1:z0+4}},prev:{kind:'rect',r:{x0,x1:x0+4,z0,z1:z0+4}}};}
        return {act:{t,rect:{x0:cx,x1:cx+1,z0:cz,z1:cz+1}},prev:{kind:'rect',r:{x0:cx,x1:cx+1,z0:cz,z1:cz+1}}};}
      const r=rectOf(v0,v1);return {act:{t,rect:r},prev:{kind:'rect',r}};}
    return {act:null,prev:null};
  }
  function showPrev(pv,col,th){
    if(!pv){hideOvl();return;}
    mBar.visible=mRect.visible=mDot.visible=mRing.visible=false;
    if(pv.kind==='bar'){const l=showBar(pv.a,pv.b,col,pv.thin?0.3:S.tool==='brand'?2.3:1.6,pv.thin?0.5:0.5);setLab(fm(pv.len,0)+' m',w2x((pv.a[0]+pv.b[0])/2),w2z((pv.a[1]+pv.b[1])/2),'#'+new THREE.Color(col).getHexString());}
    else if(pv.kind==='dot'){showDot(pv.v[0],pv.v[1],col);}
    else if(pv.kind==='edge'){const e=pv.e;const a=e.vert?[e.x,e.y]:[e.x,e.y],b=e.vert?[e.x,e.y+1]:[e.x+1,e.y];showBar(a,b,col,0.3,0.55);}
    else if(pv.kind==='rect'){const r=pv.r;showRect(r.x0,r.z0,r.x1,r.z1,col);const w=r.x1-r.x0,h=r.z1-r.z0;setLab(w+' × '+h+' m',w2x((r.x0+r.x1)/2),w2z((r.z0+r.z1)/2),'#'+new THREE.Color(col).getHexString());}
    else if(pv.kind==='cell'){showRect(pv.x,pv.z,pv.x+1,pv.z+1,col);}
    S.dirty=true;
  }
  function toolColor(){const t=S.tool;if(t==='door'||t==='out')return DCOL[t==='out'?5:S.sub+1]||0xffa412;if(t==='rauch')return DCOL[2];return TCOL[t]||0xffa412;}
  canvas.addEventListener('pointerdown',e=>{
    canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY});goal=null;
    if(ptrs.size===2){drag=null;orbit=null;hideOvl();const a=[...ptrs.values()];pinch={d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),z:cam.zoom,cx:(a[0].x+a[1].x)/2,cy:(a[0].y+a[1].y)/2};return;}
    if(ptrs.size>2)return;
    t0=performance.now();
    if(e.button===2){orbit={mode:'orbit'};return;}if(e.button===1){orbit={mode:'pan'};return;}
    if(bt()&&S.tool!=='mark'){
      const pt=pickPlane(e.clientX,e.clientY);if(!pt){return;}
      const d={v0:snapV(pt.px,pt.pz),e0:null,moved:0};
      const tl=S.tool;if(tl==='door'||tl==='out'||tl==='rauch'||tl==='erase'){d.e0=nearEdge(pt.px,pt.pz,toolEdgeFilter(),thrM());
        if(tl==='erase'&&!d.e0){d.cellErase=true;}}
      if(tl==='door'||tl==='out'||tl==='rauch'){if(!d.e0){drag=null;orbit={mode:'orbit',lazy:true};return;}}
      drag=d;const r=describe(d,pt);showPrev(r.prev,toolColor());return;}
    if(S.tool==='mark'&&S.plan&&!S.locked){drag={mark:true};return;}
    orbit={mode:'orbit'};
  });
  canvas.addEventListener('pointermove',e=>{
    const p=ptrs.get(e.pointerId);
    if(!p){ // Hover (Desktop)
      if(e.pointerType==='mouse'&&bt()&&!drag&&S.tool!=='view'&&S.tool!=='mark'){const pt=pickPlane(e.clientX,e.clientY);if(!pt)return;const t=S.tool;
        if(t==='wall'||t==='brand'){const v=snapV(pt.px,pt.pz);showPrev({kind:'dot',v},toolColor());}
        else if(t==='door'||t==='out'||t==='rauch'||t==='erase'){const ed=nearEdge(pt.px,pt.pz,toolEdgeFilter(),thrM());if(ed)showPrev({kind:'edge',e:ed},toolColor());else if(t==='erase'){const cx=Math.floor(pt.px),cz=Math.floor(pt.pz);if(inside(S.plan,cx,cz))showPrev({kind:'cell',x:cx,z:cz},toolColor());else hideOvl();}else hideOvl();}
        else if(t==='use'||t==='flur'||t==='ntr'||t==='gang'){const cx=Math.floor(pt.px),cz=Math.floor(pt.pz);if(inside(S.plan,cx,cz))showPrev({kind:'cell',x:cx,z:cz},toolColor());else hideOvl();}}
      return;}
    const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(pinch&&ptrs.size===2){const a=[...ptrs.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
      cam.zoom=clamp(pinch.z*pinch.d/Math.max(d,1),0.12,1.5);
      const cx=(a[0].x+a[1].x)/2,cy=(a[0].y+a[1].y)/2;panBy(cx-pinch.cx,cy-pinch.cy);pinch.cx=cx;pinch.cy=cy;S.dirty=true;return;}
    if(drag&&!drag.mark){const pt=pickPlane(e.clientX,e.clientY);if(!pt)return;drag.moved+=Math.abs(dx)+Math.abs(dy);const r=describe(drag,pt);drag.cur=r;
      if(S.tool==='erase'&&drag.e0==null){drag.v1=snapV(pt.px,pt.pz);const rr=rectOf(drag.v0,drag.v1);if(drag.v0[0]===drag.v1[0]&&drag.v0[1]===drag.v1[1]){const cx=Math.floor(pt.px),cz=Math.floor(pt.pz);showPrev({kind:'cell',x:cx,z:cz},toolColor());drag.cur={act:{t:'erase',cell:[cx,cz]}};}else{showPrev({kind:'rect',r:rr},toolColor());drag.cur={act:{t:'erase',rect:rr}};}return;}
      showPrev(r.prev,toolColor());return;}
    if(drag&&drag.mark){drag.moved=(drag.moved||0)+Math.abs(dx)+Math.abs(dy);return;}
    if(orbit){
      if(orbit.lazy&&Math.abs(e.clientX-p.sx)+Math.abs(e.clientY-p.sy)<5)return;
      if(orbit.mode==='pan')panBy(dx,dy);else{cam.theta-=dx*0.0075;cam.phi=clamp(cam.phi-dy*0.0055,0.02,1.25);}
      S.dirty=true;}
  });
  function panBy(dx,dy){const k=1/Math.max(ppm(),1),s=Math.sin(cam.theta),c=Math.cos(cam.theta),ty=Math.max(Math.cos(cam.phi),0.3);
    cam.tx+=-c*dx*k-s*dy*k/ty;cam.tz+=s*dx*k-c*dy*k/ty;
    cam.tx=clamp(cam.tx,-S.W,S.W);cam.tz=clamp(cam.tz,-S.H,S.H);}
  const up=e=>{
    const had=ptrs.get(e.pointerId);ptrs.delete(e.pointerId);
    if(pinch&&ptrs.size<2){pinch=null;if(ptrs.size===1){const q=[...ptrs.values()][0];q.sx=q.x;q.sy=q.y;}return;}
    if(!had)return;
    if(drag&&ptrs.size===0){const d=drag;drag=null;
      if(e.type==='pointercancel'){hideOvl();return;}
      if(d.mark){if((d.moved||0)<10&&performance.now()-t0<700){const pt=pickPlane(e.clientX,e.clientY);if(pt)cb.mark(pt.px,pt.pz);}return;}
      const pt=pickPlane(e.clientX,e.clientY);let r=d.cur;if(!r&&pt)r=describe(d,pt);
      if(pt&&(!r||!r.act)){r=describe(d,pt);}
      if(S.tool==='erase'&&!d.e0&&pt&&(!d.cur)){r={act:{t:'erase',cell:[Math.floor(pt.px),Math.floor(pt.pz)]}};}
      hideOvl();
      if(r&&r.act)cb.action(r.act);return;}
    if(orbit&&ptrs.size===0){orbit=null;}
  };
  canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',e=>{e.preventDefault();goal=null;cam.zoom=clamp(cam.zoom*Math.exp(e.deltaY*0.0012),0.12,1.5);S.dirty=true;},{passive:false});
  /* ---------- Evakuierung ---------- */
  const personG=new THREE.Group();scene.add(personG);
  const pCol=[0x6aa8ff,0xffc24a,0xb08cff,0x5fe0b0,0xff9ac2,0x9bd7ff];
  function startEvac(){
    stopEvac(true);const A=S.A,p=S.plan,W=S.W,rnd=mulberry(1234+A.rooms.length*7+A.dg.length);const list=[];
    A.rooms.forEach(c=>{const n=c.area>400?clamp(Math.round(c.area/70),8,26):clamp(Math.round(c.area/45),1,6);const cells=c.cells;
      for(let k=0;k<n;k++){let cell;if(k===0&&c.far>=0)cell=c.far;else if(k===1&&c.far<0)cell=cells[Math.floor(rnd()*cells.length)];else cell=cells[Math.floor(rnd()*cells.length)];
        list.push({cell,room:c.id});}});
    while(list.length>80)list.splice(Math.floor(rnd()*list.length),1);
    const persons=[];
    list.forEach((it,k)=>{
      const unreach=A.fAll.dist[it.cell]>=INF;let pts;
      const sx=it.cell%W+0.25+rnd()*0.5,sz=((it.cell/W)|0)+0.25+rnd()*0.5;
      if(unreach)pts=[[sx,sz],[sx,sz+0.01]];else{pts=A.pathFrom(it.cell);pts[0]=[sx,sz];}
      const seg=[0];for(let i=1;i<pts.length;i++)seg.push(seg[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
      const L=seg[seg.length-1];let stop=Infinity,why='';
      if(unreach){stop=0;why='kein Weg';}
      A.issues.forEach(is=>{if(is.noPos)return;
        if(is.blk==='room'&&is.room===it.room){if(0.5*L<stop){stop=0.5*L;why=is.txt;}}
        else if(is.blk==='len'&&is.room===it.room&&L>is.lim){if(is.lim*0.97<stop){stop=is.lim*0.97;why=is.txt;}}
        else if(is.blk==='spot'){const r=is.r||2.5;for(let i=0;i<pts.length;i++){if(Math.hypot(pts[i][0]-is.x,pts[i][1]-is.z)<r){const d=seg[i];if(d<stop){stop=d;why=is.txt;}break;}}}});
      const g=new THREE.Group();const col=pCol[k%pCol.length];
      const body=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.3,0.95,10),new THREE.MeshLambertMaterial({color:col}));body.position.y=0.5;g.add(body);
      const head=new THREE.Mesh(new THREE.SphereGeometry(0.24,10,8),new THREE.MeshLambertMaterial({color:0xffe0c2}));head.position.y=1.2;g.add(head);
      g.scale.setScalar(2.0);g.position.set(w2x(sx),0,w2z(sz));personG.add(g);
      persons.push({g,body,pts,seg,L,stop,why,v:1.15+rnd()*0.3,col,done:false,stuck:false,t:0,smoke:null});});
    S.evac={persons,t:0,running:true,last:0,speed:4,finished:false};S.dirty=true;
  }
  function stopEvac(silent){S.evac=null;disposeGroup(personG);S.dirty=true;if(!silent)cb.evac(null);}
  function posAt(P,d){const s=P.seg,pt=P.pts;if(d<=0)return pt[0];if(d>=P.L)return pt[pt.length-1];let i=1;while(i<s.length&&s[i]<d)i++;const a=pt[i-1],b=pt[i],u=(d-s[i-1])/Math.max(s[i]-s[i-1],1e-6);return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];}
  function stepEvac(dt){const E=S.evac;if(!E||!E.running)return;E.t+=dt*E.speed;let out=0,stuck=0,go=0,maxT=0;
    E.persons.forEach(P=>{if(P.done){out++;maxT=Math.max(maxT,P.L/P.v);return;}
      const d=Math.min(E.t*P.v,P.stop,P.L);const q=posAt(P,d);P.g.position.set(w2x(q[0]),0,w2z(q[1]));
      if(E.t*P.v>=P.L){P.done=true;P.g.visible=false;out++;maxT=Math.max(maxT,P.L/P.v);return;}
      if(E.t*P.v>=P.stop){if(!P.stuck){P.stuck=true;P.body.material.color.set(0xff4d3a);
          const sm=new THREE.Mesh(new THREE.SphereGeometry(1.1,12,8),new THREE.MeshBasicMaterial({color:0x6b7280,transparent:true,opacity:0.45,depthWrite:false}));sm.position.set(0,0.9,0);P.g.add(sm);P.smoke=sm;P.g.userData.ring=1;}
        stuck++;}else go++;});
    const total=E.persons.length;const fin=go===0;
    if(performance.now()-E.last>90||fin){E.last=performance.now();
      const longest=Math.max.apply(null,E.persons.filter(P=>P.done).map(P=>P.L).concat([0]));
      cb.evac({t:Math.min(E.t,maxT>0&&fin?maxT:E.t),total,out,stuck,go,done:fin,longest,maxT,why:E.persons.filter(P=>P.stuck&&P.why).map(P=>P.why).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4)});}
    if(fin&&!E.finished){E.finished=true;E.running=false;}
    S.dirty=true;}
  /* ---------- Rendern ---------- */
  let raf=0,last=performance.now();
  function frame(now){
    raf=requestAnimationFrame(frame);const forced=S.dirty||goal||(S.evac&&S.evac.running)||drag||pinch||orbit;if(!forced&&now-(S.lastR||0)<30)return;S.lastR=now;const dt=Math.min(0.05,(now-last)/1000);last=now;S.time+=dt;let need=S.dirty;
    if(goal){const k=1-Math.exp(-dt*5);['theta','phi','zoom','tx','tz'].forEach(a=>{cam[a]+=(goal[a]-cam[a])*k;});
      if(['theta','phi','zoom','tx','tz'].every(a=>Math.abs(goal[a]-cam[a])<0.004))goal=null;need=true;}
    if(S.evac&&S.evac.running){stepEvac(dt);need=true;}
    if(S.evac){S.evac.persons.forEach(P=>{if(P.stuck&&P.smoke){const s=1+0.12*Math.sin(S.time*5+P.L);P.smoke.scale.setScalar(s);need=true;}});}
    if(S.showIssues&&S.pulse&&S.pulse.length){S.pulse.forEach((g,k)=>{const u=(S.time*0.9+k*0.13)%1,u2=(u+0.5)%1,U=g.userData;
        U.r1.scale.setScalar(0.7+u*1.9);U.r1.material.opacity=0.9*(1-u);U.r2.scale.setScalar(0.7+u2*1.9);U.r2.material.opacity=0.9*(1-u2);
        const sel=S.sel&&Math.hypot(S.sel.x-U.i.x,S.sel.z-U.i.z)<0.01;const bob=Math.sin(S.time*3+k)*0.15;U.pin.position.y=2.2+bob+(sel?0.4:0);U.ball.position.y=3.0+bob+(sel?0.4:0);U.pin.scale.setScalar(sel?1.35:1);});need=true;}
    if(S.showLines&&S.A&&S.A.lines.length){Object.keys(dashMats).forEach(k=>{dashMats[k].map.offset.x=-(S.time*0.45)%1;});need=true;}
    if(S.marks.length||S.reveal)need=true;
    if(need){S.dirty=false;applyCam();const pp=ppm();gridMat.opacity=clamp((pp-19)/10,0,1)*0.6;if(Math.abs(pp-S.lastPpm)>0.3||S.lastPpm==null){S.lastPpm=pp;planG.traverse(o=>{if(o.isSprite&&o.userData.lod)o.visible=S.labels&&pp>=o.userData.lod;});lineG.traverse(o=>{if(o.isSprite&&o.userData.lod)o.visible=pp>=o.userData.lod;});}renderer.render(scene,camera);}
  }
  raf=requestAnimationFrame(frame);
  /* ---------- API ---------- */
  const api={
    setPlan(plan,A){const first=!S.plan||S.W!==plan.W||S.H!==plan.H||S.plan.type!==plan.type;S.plan=plan;S.A=A;S.W=plan.W;S.H=plan.H;rebuild();
      if(first){cam.tx=0;cam.tz=0;cam.theta=homeTheta('3d');cam.phi=0.78;cam.zoom=zoom3();S.dirty=true;}},
    setTool(tool,sub,snap,locked){S.tool=tool;S.sub=sub||0;S.snap=snap||1;S.locked=!!locked;canvas.style.cursor=(tool==='view'||locked)?'grab':'crosshair';hideOvl();},
    setShow(lines,issues,labels){S.showLines=lines;S.showIssues=issues;S.labels=labels!==false;lineG.visible=lines;issG.visible=issues;S.lastPpm=null;S.dirty=true;},
    setMarks(m,reveal){S.marks=m;S.reveal=reveal||null;rebuildMarks();},
    select(i){S.sel=i;S.dirty=true;},
    view(mode){fly(mode==='2d'?{theta:homeTheta('2d'),phi:0.02,zoom:1,tx:0,tz:0}:{theta:homeTheta('3d'),phi:0.78,zoom:zoom3(),tx:0,tz:0});},
    rotate(d){fly({theta:cam.theta+d});},
    focus(x,z,zm){fly({tx:clamp(w2x(x),-S.W,S.W),tz:clamp(w2z(z),-S.H,S.H),zoom:zm||0.55});},
    fit(){fly({tx:0,tz:0,zoom:cam.phi<0.3?1:zoom3()});},
    startEvac,stopEvac,
    toScreen(px,pz){applyCam();const v=new THREE.Vector3(px-S.W/2,0,pz-S.H/2).project(camera);const r=canvas.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};},
    scene:scene,
    dbg(){return {pp:ppm(),op:gridMat.opacity,z:cam.zoom,bd:baseDist()};},
    snapshot(){S.dirty=true;applyCam();renderer.render(scene,camera);},
    dispose(){cancelAnimationFrame(raf);ro.disconnect();renderer.dispose();}
  };
  return api;
}
/* ===== Oberfläche (React) ===== */
const h=React.createElement;
const {useState,useEffect,useRef,useMemo,useCallback}=React;
const IC={
 view:'M12 5C6 5 2.5 12 2.5 12S6 19 12 19s9.5-7 9.5-7S18 5 12 5zM12 8.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7z',
 wall:'M3 9h18v6H3z',
 brand:'M3 5h18v14H3zM3 12h18M9 5v7M15 12v7M6 12v7',
 door:'M7 21V3h10v18M5 21h14M14 12h.01',
 rauch:'M5 21V3h9v18M3 21h13M18 8c1.6 1.2 1.6 2.4 0 3.6s-1.6 2.4 0 3.6',
 out:'M10 4H5v16h5M14 8l4 4-4 4M8 12h10',
 flur:'M3 7h18M3 17h18M7 12h2M12 12h2M17 12h2',
 ntr:'M3 20h5v-5h5v-5h5V5h3',
 gang:'M4 8h16M4 16h16M8 8l-2 8M13 8l-2 8M18 8l-2 8',
 use:'M3 12V4h8l9 9-8 8zM7.5 8.5h.01',
 erase:'M14 4l6 6-9 9H6l-3-3zM8.5 9.5l6 6',
 undo:'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',
 play:'M7 4l13 8-13 8z',
 stop:'M6 6h12v12H6z',
 d3:'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
 d2:'M4 4h16v16H4zM4 12h16M12 4v8',
 rotL:'M5 12a7 7 0 017-7 7 7 0 015 2M17 3v5h-5M19 12a7 7 0 01-7 7 7 7 0 01-5-2M7 21v-5h5',
 rotR:'M19 12a7 7 0 00-7-7 7 7 0 00-5 2M7 3v5h5M5 12a7 7 0 007 7 7 7 0 005-2M17 21v-5h-5',
 ruler:'M3 17L17 3l4 4L7 21zM8 12l2 2M11 9l2 2M14 6l2 2',
 warn:'M12 3l10 18H2zM12 10v5M12 18h.01',
 check:'M5 12.5l4.5 4.5L19 7',
 cross:'M6 6l12 12M18 6L6 18',
 flag:'M5 21V4M5 4h12l-2 4 2 4H5',
 help:'M9 9a3 3 0 116 0c0 2-3 2.2-3 5M12 18h.01',
 tag:'M4 4h16v10H4zM8 18h8',
 fit:'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
 info:'M12 8h.01M11 12h1v5h1',
 std:'M5 21V5h9v16M14 9h5v12M8 9h3M8 13h3M8 17h3',
 vk:'M3 4h3l2 11h10l2-8H7M9 20h.01M17 20h.01',
 bh:'M3 18V7M3 14h18v4M21 14v-3a3 3 0 00-3-3h-7v6',
 ind:'M3 21V10l6 4v-4l6 4V6h6v15z',
 gar:'M4 17l2-6h12l2 6v3h-3v-2H7v2H4zM7 14h.01M17 14h.01',
 list:'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
 task:'M5 4h14v17l-7-4-7 4zM9 9l2 2 4-4',
 gear:'M12 8.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
 chev:'M9 6l6 6-6 6',
 pin:'M12 21s-6-6-6-11a6 6 0 1112 0c0 5-6 11-6 11zM12 7.5v.01'
};
function Ic(p){const d=IC[p.n]||'';const fill=(p.n==='play'||p.n==='stop'||p.n==='wall')?'currentColor':'none';
  return h('svg',{viewBox:'0 0 24 24',width:p.s||22,height:p.s||22,fill:fill,stroke:'currentColor',strokeWidth:p.n==='wall'?1:2,strokeLinecap:'round',strokeLinejoin:'round',className:p.c,'aria-hidden':'true'},h('path',{d:d}));}
function Stars(p){const n=p.n||0,s=p.s||16;return h('span',{className:'stars'},[0,1,2].map(i=>h('svg',{key:i,viewBox:'0 0 24 24',width:s,height:s,className:i<n?'st on':'st'},h('path',{d:'M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z'}))));}
function B(txt){return String(txt).split('**').map((s,i)=>i%2?h('b',{key:i},s):s);}

const TOOLDEF=[
 {k:'view',n:'Ansicht',s:'Ansicht',hint:'Ziehen dreht die Ansicht, zwei Finger zoomen und verschieben.'},
 {k:'wall',n:'Trennwand',s:'Wand',hint:'Von Punkt zu Punkt ziehen (min. F30). Tippen auf eine Kante setzt oder entfernt ein 1-m-Stück.'},
 {k:'brand',n:'Brandwand',s:'Brandw.',hint:'Brandwand REIM 90 (F90-A-M) ziehen: teilt Brandabschnitte, 0,30 m über Dach, ≥ 5 m von Innenecken.'},
 {k:'door',n:'Tür',s:'Tür',hint:'Wähle den Türtyp. Tippe auf eine Wand oder ziehe entlang der Wand für breitere Türen (1 m je Feld).'},
 {k:'rauch',n:'Rauchtür',s:'Rauchtür',hint:'Tippe auf den Flur: Eine RS-Tür wird über die ganze Flurbreite gesetzt und teilt den Rauchabschnitt.'},
 {k:'out',n:'Ausgang',s:'Ausgang',hint:'Ziehe an der Außenwand entlang: Ausgang ins Freie (1 m je Feld).'},
 {k:'flur',n:'Flur',s:'Flur',hint:'Rechteck aufziehen: Flächen werden zu notwendigem Flur.'},
 {k:'ntr',n:'Treppenraum',s:'Treppe',hint:'Tippen setzt einen Treppenraum (4 × 4 m), Ziehen zeichnet ein Rechteck. Tür nicht vergessen.'},
 {k:'gang',n:'Hauptgang',s:'Gang',hint:'Hauptgang als Streifen einzeichnen (mind. 2 m breit).'},
 {k:'use',n:'Nutzung',s:'Nutzung',hint:'Wähle die Nutzung und tippe auf einen Raum.'},
 {k:'erase',n:'Radierer',s:'Radierer',hint:'Auf Wand/Tür tippen oder entlangziehen löscht sie. Auf Fläche ziehen setzt zurück zu Raum.'}];
function toolsFor(T){return TOOLDEF.filter(t=>{if(t.k==='rauch')return T.id==='std';if(t.k==='flur')return T.hasFlur;if(t.k==='gang')return T.gang;if(t.k==='use')return T.uses.length>1;return true;}).map(t=>t.k==='flur'?Object.assign({},t,{n:T.flur,s:T.flur==='Ladenstraße'?'Straße':'Flur'}):t);}
const DOORNAMES=['DS','RS','T30-DS','T30-RS'];
/* ---------- Speicher ---------- */
function loadStars(){try{return JSON.parse(localStorage.getItem('bvi_planer_stars')||'{}')||{};}catch(e){return {};}}
function saveStars(o){try{localStorage.setItem('bvi_planer_stars',JSON.stringify(o));}catch(e){}}
/* ---------- Fehlersuche: Auswertung ---------- */
function scoreFind(A,marks){
  const groups={};A.issues.forEach(i=>{if(i.noPos)return;(groups[i.grp]=groups[i.grp]||{id:i.grp,check:i.check,items:[]}).items.push(i);});
  const gl=Object.keys(groups).map(k=>groups[k]);
  const used=new Set();const falseM=[];
  marks.forEach((m,mi)=>{let best=null,bd=1e9;gl.forEach(g=>{g.items.forEach(i=>{const d=Math.hypot(m.x-i.x,m.z-i.z);const lim=(i.r||3)+2.5;if(d<=lim&&d<bd){bd=d;best=g;}});});
    if(best)used.add(best.id);else falseM.push(mi);});
  gl.forEach(g=>{g.found=used.has(g.id);});
  const found=gl.filter(g=>g.found).length,total=gl.length;
  let stars=0;if(total>0){if(found===total&&falseM.length<=1)stars=3;else if(found/total>=0.66)stars=2;else if(found>=1)stars=1;}
  return {groups:gl,found,total,falseM,stars};
}
function rauchEdges(p,e0){ // Kanten quer über die Flurbreite
  const out=[];const W=p.W,H=p.H;const isFl=(x,y)=>inside(p,x,y)&&p.zone[x+W*y]===1;
  if(e0.vert){ // Kante zwischen (x-1,y) und (x,y): läuft entlang y
    const x=e0.x;let y=e0.y;while(isFl(x-1,y)&&isFl(x,y-1)&&false)y--;
    let a=e0.y;while(isFl(x-1,a-1)&&isFl(x,a-1))a--;let b=e0.y;while(isFl(x-1,b+1)&&isFl(x,b+1))b++;
    for(let y2=a;y2<=b;y2++)out.push([true,x,y2]);}
  else{const y=e0.y;let a=e0.x;while(isFl(a-1,y-1)&&isFl(a-1,y))a--;let b=e0.x;while(isFl(b+1,y-1)&&isFl(b+1,y))b++;
    for(let x2=a;x2<=b;x2++)out.push([false,x2,y]);}
  return out;}

const css=`
:root{--bg:#0c1424;--pn:var(--card,#141f33);--pn2:var(--soft,#1b2a42);--tx:var(--ink,#eef2f8);--mu:var(--mute,#9aa9c0);--ac:var(--or,#ffa412);--ok:#35d07f;--bad:#ff5a47;--ln:var(--line,rgba(255,255,255,.09));--blue:#6ea8ff}
body{background:var(--bg);color:var(--tx);-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.app{display:flex;flex-direction:column;height:100%;height:100dvh}
.left{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;min-width:0}
.stage{position:relative;flex:1 1 auto;min-height:0;overflow:hidden}
.stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.dock{flex:0 0 auto;background:var(--pn);border-top:1px solid var(--ln);padding:6px 8px 6px;position:relative;z-index:3}
.subbar{display:flex;gap:6px;align-items:center;overflow-x:auto;padding:2px 2px 6px;min-height:40px;scrollbar-width:none}
.subbar::-webkit-scrollbar,.tools::-webkit-scrollbar{display:none}
.subbar .hintt{font-size:12.5px;color:var(--mu);line-height:1.3;flex:1;min-width:0}
.pill{flex:none;min-height:36px;padding:0 12px;border-radius:18px;border:1.5px solid var(--ln);background:var(--pn2);color:var(--tx);font:600 13px/1 inherit;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.pill.on{border-color:var(--c,var(--ac));background:color-mix(in srgb,var(--c,var(--ac)) 22%,transparent);color:#fff}
.pill i{width:10px;height:10px;border-radius:50%;background:var(--c,var(--ac));display:inline-block}
.tools{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.tool .l{display:none}
.tool{flex:1 0 60px;min-width:60px;min-height:54px;border:0;border-radius:14px;background:transparent;color:var(--mu);font:600 11px/1.1 inherit;font-family:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;padding:4px 2px}
.tool.on{background:rgba(255,164,18,.17);color:var(--ac);box-shadow:inset 0 0 0 1.5px rgba(255,164,18,.55)}
.tool:active{background:rgba(255,255,255,.08)}
.panel{flex:0 0 auto;height:36%;display:flex;flex-direction:column;background:var(--pn);border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.35);position:relative;z-index:4;transition:height .25s}
.panel.min{height:62px}
.pbody{flex:1;overflow:auto;padding:12px 14px 10px;-webkit-overflow-scrolling:touch;user-select:text;-webkit-user-select:text}
.panel.min .pbody{display:none}
.tabs{order:2;display:flex;gap:6px;padding:6px 10px calc(6px + env(safe-area-inset-bottom));border-top:1px solid var(--ln)}
.tab{flex:1;min-height:48px;border:0;border-radius:14px;background:transparent;color:var(--mu);font:600 13px/1.1 inherit;font-family:inherit;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:7px;cursor:pointer}
.tab.on{background:rgba(255,164,18,.15);color:var(--ac)}
.tab .bd{min-width:20px;height:20px;border-radius:10px;background:var(--bad);color:#fff;font-size:12px;display:inline-flex;align-items:center;justify-content:center;padding:0 5px}
.tab .bd.g{background:var(--ok);color:#06210f}
@media(min-width:900px){
 .app{flex-direction:row}
 .panel{height:100%;width:430px;border-radius:0;order:2;box-shadow:-10px 0 30px rgba(0,0,0,.3)}
 .panel.min{height:100%}.panel.min .pbody{display:block}
 .tabs{order:0;border-top:0;border-bottom:1px solid var(--ln);padding:12px}
 .pbody{padding:16px 18px}
 .tool{flex:1 0 66px}.tool .l{display:inline}.tool .s{display:none}.rb{width:44px;height:44px}
 .minbtn{display:none!important}
}
h2{margin:0 0 6px;font-size:18px;line-height:1.2}h3{margin:14px 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mu);font-weight:700}
p{margin:0 0 10px;line-height:1.45;font-size:14.5px}
.mu{color:var(--mu)}
.card{background:var(--pn2);border-radius:16px;padding:13px;margin-bottom:10px;border:1px solid var(--ln)}
.btn{min-height:46px;border-radius:14px;border:0;font:700 15px inherit;font-family:inherit;padding:0 18px;cursor:pointer;background:var(--ac);color:#241503;display:inline-flex;align-items:center;justify-content:center;gap:8px}
.btn.sec{background:var(--pn2);color:var(--tx);border:1px solid var(--ln)}
.btn:disabled{opacity:.45;cursor:default}
.btn.big{width:100%;min-height:52px;font-size:16px}
.btn.green{background:var(--ok);color:#052013}
.btn.red{background:var(--bad);color:#fff}
.hud{position:absolute;z-index:3;display:flex;gap:7px}
.hud.tl{left:10px;top:10px;flex-direction:column;align-items:flex-start;max-width:calc(100% - 76px)}
.hud.tr{right:10px;top:10px;flex-direction:column}
.hud.bl{left:10px;bottom:10px}
.hud.br{right:10px;bottom:10px;flex-direction:column}
.rb{width:40px;height:40px;border-radius:14px;border:0;background:rgba(12,20,36,.78);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(5px);box-shadow:0 2px 10px rgba(0,0,0,.35);padding:0}
.rb.on{background:var(--ac);color:#241503}
.rb:disabled{opacity:.4}
.chip{color:#fff;background:rgba(12,20,36,.78);backdrop-filter:blur(5px);border-radius:12px;padding:7px 11px;font-size:13px;font-weight:700;line-height:1.2;box-shadow:0 2px 10px rgba(0,0,0,.35);max-width:100%}
.chip small{display:block;font-weight:500;color:var(--mu);font-size:11.5px}
.chip.tk{border:1.5px solid var(--ac);cursor:pointer}
.score{display:flex;align-items:center;gap:9px;background:rgba(12,20,36,.82);backdrop-filter:blur(5px);border-radius:16px;padding:7px 12px 7px 8px;font-weight:800;font-size:14px;cursor:pointer;border:0;color:#fff;font-family:inherit;box-shadow:0 2px 10px rgba(0,0,0,.35);min-height:44px}
.ring{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;background:conic-gradient(var(--rc) calc(var(--p)*1%),rgba(255,255,255,.14) 0)}
.ring span{width:22px;height:22px;border-radius:50%;background:#0f1a2e;display:flex;align-items:center;justify-content:center}
.toast{position:absolute;left:50%;top:66px;transform:translateX(-50%);background:#0b1220;border:1px solid var(--ac);color:#fff;border-radius:14px;padding:10px 14px;font-size:13.5px;font-weight:600;z-index:6;max-width:88%;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.45);pointer-events:none}
.sumbar{height:10px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden;margin:8px 0}.sumbar>div{height:100%;border-radius:5px;transition:width .3s}
.ck{padding:0;overflow:hidden}
.ckh{display:flex;gap:11px;align-items:flex-start;padding:11px 12px;cursor:pointer;min-height:56px;width:100%;border:0;background:transparent;color:inherit;font-family:inherit;text-align:left}
.dotk{flex:none;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:1px}
.dotk.ok{background:rgba(53,208,127,.2);color:var(--ok)}.dotk.no{background:rgba(255,90,71,.22);color:var(--bad)}.dotk.in{background:rgba(110,168,255,.18);color:var(--blue)}
.ckt{flex:1;min-width:0}.ckt b{display:block;font-size:14.5px;line-height:1.25}.ckt span{display:block;font-size:12.8px;color:var(--mu);margin-top:2px;line-height:1.35}
.ck.bad .ckt span{color:#ff9a8c}.ck.good .ckt span{color:#8fe5b5}
.ref{display:inline-block;font-size:11px;font-weight:700;color:var(--blue);background:rgba(110,168,255,.13);border-radius:8px;padding:2px 7px;margin-top:5px}
.ckb{padding:0 12px 12px 51px;font-size:13.5px;line-height:1.45}
.iss{display:flex;gap:8px;align-items:center;border-top:1px solid var(--ln);padding:7px 0;font-size:13px;color:#ffb3a8}
.iss button{flex:none}
.sm{min-height:36px;padding:0 12px;font-size:13px;border-radius:12px}
.stat{display:flex;gap:8px;margin:8px 0}
.stat>div{flex:1;background:rgba(0,0,0,.2);border-radius:12px;padding:8px 10px;min-width:0}
.stat small{display:block;color:var(--mu);font-size:11px}.stat b{font-size:17px}
.msg{border-radius:14px;padding:11px 13px;font-weight:700;margin:8px 0;font-size:14.5px;line-height:1.35}
.msg.g{background:rgba(53,208,127,.16);color:#6ff0a8;border:1px solid rgba(53,208,127,.4)}
.msg.r{background:rgba(255,90,71,.15);color:#ff9d88;border:1px solid rgba(255,90,71,.4)}
.msg.o{background:rgba(255,164,18,.14);color:#ffc462;border:1px solid rgba(255,164,18,.4)}
.msg.n{background:rgba(255,255,255,.05);color:var(--mu);border:1px solid var(--ln);font-weight:500}
.msg li{margin-left:16px;font-weight:500}
.typeg{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}
.typec{border:1.5px solid var(--ln);background:var(--pn2);color:var(--tx);border-radius:14px;padding:10px 6px;min-height:76px;font:700 13px/1.2 inherit;font-family:inherit;cursor:pointer;display:flex;flex-direction:column;gap:5px;align-items:center;justify-content:center;text-align:center}
.typec small{font-weight:500;color:var(--mu);font-size:11px}
.typec.on{border-color:var(--ac);background:rgba(255,164,18,.12)}
.seg{display:flex;background:rgba(0,0,0,.25);border-radius:12px;padding:3px;gap:3px}
.seg button{flex:1;min-height:40px;border:0;border-radius:10px;background:transparent;color:var(--mu);font:700 13.5px inherit;font-family:inherit;cursor:pointer}
.seg button.on{background:var(--ac);color:#241503}
.sw{display:flex;align-items:center;gap:12px;min-height:50px;padding:6px 0;cursor:pointer;border-bottom:1px solid var(--ln);width:100%;border-left:0;border-right:0;border-top:0;background:transparent;color:inherit;font-family:inherit;text-align:left}
.sw:last-child{border-bottom:0}
.sw .t{flex:1;font-size:14px;font-weight:600}.sw .t small{display:block;color:var(--mu);font-weight:500;font-size:12px;margin-top:1px}
.tg{width:50px;height:28px;border-radius:14px;background:#3a4a63;position:relative;flex:none;transition:background .2s}
.tg:after{content:"";position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}
.tg.on{background:var(--ok)}.tg.on:after{transform:translateX(22px)}
.lab{font-size:12.5px;color:var(--mu);margin:10px 0 5px;font-weight:600}
.st{fill:rgba(255,255,255,.18)}.st.on{fill:#ffc23a}.stars{display:inline-flex;gap:2px}
.tkc{display:flex;gap:11px;align-items:center;width:100%;border:1.5px solid var(--ln);background:var(--pn2);color:var(--tx);border-radius:14px;padding:11px 12px;margin-bottom:8px;cursor:pointer;text-align:left;font-family:inherit;min-height:62px}
.tkc.on{border-color:var(--ac)}.tkc b{display:block;font-size:14.5px}.tkc small{color:var(--mu);font-size:12.3px}
.tkc .ico{flex:none;width:38px;height:38px;border-radius:12px;background:rgba(255,164,18,.14);color:var(--ac);display:flex;align-items:center;justify-content:center}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ob{position:absolute;inset:0;background:rgba(5,9,16,.6);z-index:20;display:flex;align-items:center;justify-content:center;padding:18px}
.obc{background:var(--pn);border:1px solid var(--ln);border-radius:20px;padding:18px;max-width:430px;width:100%;max-height:100%;overflow:auto}
.obc ol{margin:0 0 12px;padding-left:20px}.obc li{margin:7px 0;font-size:14.5px;line-height:1.4}
.legend{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12px;color:var(--mu);margin:2px 0 8px}.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
`;
function Seg(p){return h('div',{className:'seg'},p.o.map(o=>h('button',{key:o[0],className:p.v===o[0]?'on':'',onClick:()=>p.on(o[0])},o[1])));}
function Sw(p){return h('button',{className:'sw',onClick:()=>p.on(p.v?0:1),role:'switch','aria-checked':!!p.v},h('span',{className:'t'},p.t,p.d?h('small',null,p.d):null),h('span',{className:'tg'+(p.v?' on':'')}));}
const START_OPTS=Object.assign({},DEFO,{gar:{offen:0,ober:0,spr:0,abl:1,ent:1,bma:0}});
const uwOf=(p,e)=>e[0]?p.wv[e[1]+(p.W+1)*e[2]]:p.wh[e[1]+p.W*e[2]];
function App(){
  const [typeId,setTypeId]=useState('std');
  const planRef=useRef(null);if(!planRef.current)planRef.current=startPlan('std');
  const [ver,setVer]=useState(0);
  const [opts,setOpts]=useState(()=>Object.assign({},START_OPTS.std));
  const undo=useRef([]);
  const [tool,setTool]=useState('view'),[doorSub,setDoorSub]=useState(0),[useSub,setUseSub]=useState(0),[snap,setSnap]=useState(1);
  const [tab,setTab]=useState('pruefer'),[min,setMin]=useState(false);
  const [showLines,setShowLines]=useState(true),[showIss,setShowIss]=useState(true),[view3d,setView3d]=useState(true);
  const [variant,setVariant]=useState('r'),[ev,setEv]=useState(null),[toast,setToast]=useState(''),[open,setOpen]=useState(null),[intro,setIntro]=useState(true),[help,setHelp]=useState(false);
  const [task,setTask]=useState(null),[stars,setStars]=useState(loadStars);
  const A=useMemo(()=>analyze(planRef.current,opts),[ver,opts]);
  const Aref=useRef(A);Aref.current=A;
  const canvasRef=useRef(null),hostRef=useRef(null),sc=useRef(null),cbs=useRef({}),toastT=useRef(0),issIdx=useRef({});
  const T=TYPES[typeId];
  const say=useCallback(m=>{setToast(m);clearTimeout(toastT.current);toastT.current=setTimeout(()=>setToast(''),2800);},[]);
  /* Szene */
  useEffect(()=>{const s=createScene(canvasRef.current,hostRef.current,{action:a=>cbs.current.action(a),mark:(x,z)=>cbs.current.mark(x,z),evac:i=>cbs.current.evac(i)});
    sc.current=s;s.setPlan(planRef.current,Aref.current);window.__sc=s;return()=>s.dispose();},[]);
  useEffect(()=>{sc.current&&sc.current.setPlan(planRef.current,A);},[A]);
  const phase=task?task.phase:null;
  const searching=phase==='search',reviewing=phase==='review';
  const effTool=reviewing?'view':searching?(tool==='view'?'view':'mark'):tool;
  useEffect(()=>{sc.current&&sc.current.setTool(effTool,effTool==='door'?doorSub:effTool==='use'?useSub:0,snap,reviewing);},[effTool,doorSub,useSub,snap,reviewing]);
  useEffect(()=>{sc.current&&sc.current.setShow(showLines&&!searching,showIss&&!searching,true);},[showLines,showIss,searching,A]);
  useEffect(()=>{if(!sc.current)return;const rv=task&&task.res?task.res.groups.map(g=>({x:g.items[0].x,z:g.items[0].z,found:g.found})):null;sc.current.setMarks(task&&task.marks?task.marks:[],rv);},[task]);
  useEffect(()=>{if(task&&task.res)return;},[task]);
  /* Plan ändern */
  const commit=useCallback(fn=>{setIntro(false);const np=clonePlan(planRef.current);const r=fn(np);if(r===false)return false;
    undo.current.push(planRef.current);if(undo.current.length>40)undo.current.shift();planRef.current=np;setVer(v=>v+1);
    sc.current&&sc.current.stopEvac(true);setEv(null);return true;},[]);
  const doUndo=()=>{const pv=undo.current.pop();if(!pv)return;planRef.current=pv;setVer(v=>v+1);sc.current&&sc.current.stopEvac(true);setEv(null);};
  const loadPlan=(id,plan,o)=>{setTypeId(id);planRef.current=plan;undo.current=[];setOpts(o);setVer(v=>v+1);setEv(null);sc.current&&sc.current.stopEvac(true);setOpen(null);issIdx.current={};
    setTimeout(()=>sc.current&&sc.current.view(view3d?'3d':'2d'),30);};
  const selectType=(id,vr)=>{setTask(null);const v=id==='std'?(vr||variant):'r';if(id==='std')setVariant(v);loadPlan(id,startPlan(id,v),Object.assign({},START_OPTS[id]));setTool('view');say(id==='std'&&v==='l'?'Winkelbau geladen: Die Brandwand liegt zu nah an der Innenecke.':TYPES[id].name+': Startplan geladen');};
  const emptyOf=()=>{setTask(null);const t=TYPES[typeId];commit(p=>{const q=makePlan(typeId,p.W,p.H,(x,y)=>p.mask[x+p.W*y]===1);Object.keys(q).forEach(k=>{p[k]=q[k];});return true;});say('Leeres Geschoss. Plane Wände, Flur und Ausgänge.');};
  const resetStart=()=>{if(task&&task.kind==='build'){const t=TASKS.find(x=>x.id===task.id);loadPlan(t.type,emptyPlan(t.type,t.W,t.H),Object.assign({},t.opts));return;}
    if(task&&task.kind==='find'){startTask(TASKS.find(x=>x.id===task.id));return;}loadPlan(typeId,startPlan(typeId,variant),Object.assign({},START_OPTS[typeId]));};
  cbs.current.action=a=>{
    const p0=planRef.current;let msg=null;
    const r=commit(p=>{
      if(a.t==='wall'||a.t==='brand'){const k=a.t==='wall'?1:2;const es=a.edges.filter(e=>{const ed=edge(p,e[0],e[1],e[2]);return ed.A&&ed.B;});if(!es.length)return false;
        const same=es.every(e=>uwOf(p,e)===k&&edge(p,e[0],e[1],e[2]).d===0);es.forEach(e=>setWall(p,e[0],e[1],e[2],same?0:k));return true;}
      if(a.t==='door'){const t=[1,2,3,4][a.sub];const es=a.edges.filter(e=>{const ed=edge(p,e[0],e[1],e[2]);return ed.w>0&&ed.w!==3;});
        if(!es.length){msg='Eine Tür braucht eine Wand. Tippe auf eine Wand zwischen zwei Bereichen.';return false;}
        const same=es.every(e=>edge(p,e[0],e[1],e[2]).d===t);es.forEach(e=>setDoor(p,e[0],e[1],e[2],same?0:t));return true;}
      if(a.t==='out'){const es=a.edges.filter(e=>{const ed=edge(p,e[0],e[1],e[2]);return ed.w===3;});
        if(!es.length){msg='Ein Ausgang gehört in die Außenwand.';return false;}
        const same=es.every(e=>edge(p,e[0],e[1],e[2]).d===5);es.forEach(e=>setDoor(p,e[0],e[1],e[2],same?0:5));return true;}
      if(a.t==='rauch'){const es=rauchEdges(p,a.edge);if(!es.length){msg='Die Rauchtür gehört quer in einen Flur.';return false;}
        const same=es.every(e=>{const ed=edge(p,e[0],e[1],e[2]);return ed.d===2&&uwOf(p,e)===1;});
        es.forEach(e=>{if(same){setWall(p,e[0],e[1],e[2],0);}else{setWall(p,e[0],e[1],e[2],1);setDoor(p,e[0],e[1],e[2],2);}});return true;}
      if(a.t==='flur'||a.t==='ntr'){const z=a.t==='flur'?1:2;const r=a.rect;let n=0;for(let y=r.z0;y<r.z1;y++)for(let x=r.x0;x<r.x1;x++)if(inside(p,x,y)){p.zone[x+p.W*y]=z;p.gang[x+p.W*y]=0;n++;}
        if(!n)return false;if(z===2)msg='Treppenraum gesetzt. Jetzt eine RS-Tür vom Flur aus einbauen.';return true;}
      if(a.t==='gang'){const r=a.rect;const cells=[];for(let y=r.z0;y<r.z1;y++)for(let x=r.x0;x<r.x1;x++)if(inside(p,x,y)&&p.zone[x+p.W*y]===0)cells.push(x+p.W*y);
        if(!cells.length)return false;const same=cells.every(c=>p.gang[c]===1);cells.forEach(c=>{p.gang[c]=same?0:1;});return true;}
      if(a.t==='erase'){let ch=false;
        if(a.edges){a.edges.forEach(e=>{eraseEdge(p,e[0],e[1],e[2]);ch=true;});}
        else{const r=a.rect||{x0:a.cell[0],x1:a.cell[0]+1,z0:a.cell[1],z1:a.cell[1]+1};for(let y=r.z0;y<r.z1;y++)for(let x=r.x0;x<r.x1;x++)if(inside(p,x,y)){const c=x+p.W*y;if(p.zone[c]||p.gang[c])ch=true;p.zone[c]=0;p.gang[c]=0;}}
        return ch;}
      if(a.t==='use'){const A0=Aref.current,c=a.cell[0]+p.W*a.cell[1];const cp=A0.comps[A0.comp[c]];if(!cp||cp.zone!==0){msg='Die Nutzung gilt nur für Räume.';return false;}
        cp.cells.forEach(i=>{p.use[i]=a.sub;});msg=cp.name.replace(/ \d+$/,'')+' → '+T.uses[a.sub];return true;}
      return false;});
    if(msg)say(msg);
  };
  cbs.current.evac=i=>setEv(i);
  cbs.current.mark=(px,pz)=>{setTask(tk=>{if(!tk||tk.phase!=='search')return tk;const ms=tk.marks.slice();const k=ms.findIndex(m=>Math.hypot(m.x-px,m.z-pz)<2.5);if(k>=0)ms.splice(k,1);else if(ms.length<12)ms.push({x:px,z:pz});return Object.assign({},tk,{marks:ms});});};
  /* Aufgaben */
  const startTask=t=>{
    setIntro(false);
    if(t.kind==='find'){loadPlan(t.type,t.make(),Object.assign({},t.opts));setTask({id:t.id,kind:'find',phase:'search',marks:[],res:null});setTool('mark');setTab('aufgaben');setMin(false);}
    else{loadPlan(t.type,emptyPlan(t.type,t.W,t.H),Object.assign({},t.opts));setTask({id:t.id,kind:'build',phase:'run'});setTool('wall');setTab('pruefer');setMin(false);}
  };
  const submitFind=()=>{const res=scoreFind(Aref.current,task.marks);const st=Object.assign({},stars);st[task.id]=Math.max(st[task.id]||0,res.stars);saveStars(st);setStars(st);setTask(Object.assign({},task,{phase:'review',res}));setTool('view');};
  const endTask=()=>{setTask(null);setTool('view');};
  const tinfo=useMemo(()=>{if(!task||task.kind!=='build')return null;const t=TASKS.find(x=>x.id===task.id);const rq=t.req(A),bn=t.bonus(A);return {t,rq,bn,pass:A.allOk&&rq.ok};},[A,task]);
  const evOk=ev&&ev.done&&ev.stuck===0;
  const curStars=tinfo?(tinfo.pass?(evOk?(tinfo.bn.ok?3:2):1):0):0;
  useEffect(()=>{if(tinfo&&curStars>0){const id=task.id;setStars(s=>{if((s[id]||0)>=curStars)return s;const n=Object.assign({},s);n[id]=curStars;saveStars(n);return n;});}},[curStars]);
  /* Tabs */
  const mobile=()=>window.innerWidth<900;
  const clickTab=k=>{if(tab===k&&mobile())setMin(m=>!m);else{setTab(k);setMin(false);}};
  const focusIssue=i=>{if(!sc.current||i.noPos)return;sc.current.select(i);sc.current.focus(i.x,i.z,0.5);if(mobile())setMin(true);};
  const toggleView=()=>{const n=!view3d;setView3d(n);sc.current.view(n?'3d':'2d');};
  /* Fehler im Plan in Auswahlliste */
  const sel=TOOLDEF.find(t=>t.k===effTool)||TOOLDEF[0];
  const tools=toolsFor(T);
  const nbad=A.score.req-A.score.ok;
  const evStart=()=>{setEv({t:0,total:0,out:0,stuck:0,go:0,done:false,longest:0,why:[]});sc.current.startEvac();};
  const evStop=()=>{sc.current.stopEvac();setEv(null);};
  /* ---------- Dock ---------- */
  const dockSub=()=>{
    if(searching)return h('div',{className:'subbar'},h('span',{className:'hintt'},effTool==='mark'?'Tippe auf Stellen, die gegen die Regeln verstoßen. Erneut tippen entfernt die Markierung.':'Dreh die Ansicht und suche Fehler. Wähle Markieren, um Fehler zu setzen.'));
    if(reviewing)return h('div',{className:'subbar'},h('span',{className:'hintt'},'Auswertung: grün gefunden, rot übersehen.'));
    if(effTool==='door')return h('div',{className:'subbar'},DOORNAMES.map((n,i)=>h('button',{key:n,className:'pill'+(doorSub===i?' on':''),style:{'--c':DCSS[i+1]},onClick:()=>setDoorSub(i)},h('i'),n)),h('span',{className:'hintt',style:{flex:'none',whiteSpace:'nowrap'}},['dichtschließend','rauchdicht','feuerhemmend, dichtschließend','feuerhemmend, rauchdicht'][doorSub]));
    if(effTool==='use')return h('div',{className:'subbar'},T.uses.map((n,i)=>h('button',{key:n,className:'pill'+(useSub===i?' on':''),style:{'--c':T.ucol[i]},onClick:()=>setUseSub(i)},h('i'),n)));
    const sn=['wall','brand','flur','ntr','gang'].includes(effTool);
    return h('div',{className:'subbar'},h('span',{className:'hintt'},sel.hint),sn?h('button',{className:'pill'+(snap===5?' on':''),onClick:()=>setSnap(snap===5?1:5)},'Raster ',snap,' m'):null);};
  const dock=h('div',{className:'dock'},dockSub(),
    h('div',{className:'tools'},searching?[
        h('button',{key:'v',className:'tool'+(effTool==='view'?' on':''),onClick:()=>setTool('view')},h(Ic,{n:'view'}),'Ansicht'),
        h('button',{key:'m',className:'tool'+(effTool==='mark'?' on':''),onClick:()=>setTool('mark')},h(Ic,{n:'flag'}),'Markieren'),
        h('button',{key:'u',className:'tool',onClick:()=>setTask(tk=>Object.assign({},tk,{marks:tk.marks.slice(0,-1)})),disabled:!task.marks.length},h(Ic,{n:'undo'}),'Zurück'),
        h('button',{key:'a',className:'btn',style:{flex:'1 0 150px',minHeight:50,alignSelf:'center'},disabled:!task.marks.length,onClick:submitFind},'Abgeben ('+task.marks.length+')')]
      :reviewing?[h('button',{key:'v',className:'tool on'},h(Ic,{n:'view'}),'Ansicht')]
      :tools.map(t=>h('button',{key:t.k,className:'tool'+(effTool===t.k?' on':''),onClick:()=>setTool(t.k)},h(Ic,{n:t.k}),h('span',{className:'l'},t.n),h('span',{className:'s'},t.s)))));
  /* ---------- HUD ---------- */
  const sumPct=Math.round(100*A.score.ok/Math.max(1,A.score.req));
  const rc=A.allOk?'#35d07f':nbad>=3?'#ff5a47':'#ffa412';
  const hud=[
    h('div',{key:'tl',className:'hud tl'},
      h('div',{className:'chip'},T.name,h('small',null,planRef.current.W+' m × '+planRef.current.H+' m · '+T.sub)),
      task?h('button',{className:'chip tk',style:{color:'#fff',font:'inherit',fontWeight:700,textAlign:'left'},onClick:()=>{setTab(task.kind==='find'?'aufgaben':'pruefer');setMin(false);}},(task.kind==='find'?'Finde die Fehler':'Bauaufgabe'),h('small',null,(TASKS.find(x=>x.id===task.id)||{}).title)):null),
    h('div',{key:'tr',className:'hud tr'},
      h('button',{className:'rb',onClick:doUndo,disabled:!undo.current.length||reviewing||searching,'aria-label':'Rückgängig',title:'Rückgängig'},h(Ic,{n:'undo'})),
      h('button',{className:'rb',onClick:toggleView,'aria-label':'Ansicht 2D oder 3D',title:view3d?'Draufsicht':'3D-Ansicht'},h(Ic,{n:view3d?'d2':'d3'})),
      h('button',{className:'rb',onClick:()=>sc.current.rotate(Math.PI/4),'aria-label':'Ansicht drehen',title:'Drehen'},h(Ic,{n:'rotR'})),
      h('button',{className:'rb'+(showLines?' on':''),onClick:()=>setShowLines(!showLines),'aria-label':'Messlinien',title:'Messlinien'},h(Ic,{n:'ruler'})),
      h('button',{className:'rb'+(showIss?' on':''),onClick:()=>setShowIss(!showIss),'aria-label':'Verstöße markieren',title:'Verstöße'},h(Ic,{n:'warn'})),
      h('button',{className:'rb',onClick:()=>setHelp(true),'aria-label':'Hilfe'},h(Ic,{n:'help'}))),
    searching||reviewing?null:h('div',{key:'bl',className:'hud bl'},
      h('button',{className:'score',onClick:()=>{setTab('pruefer');setMin(false);},'aria-label':'Prüfer öffnen'},h('span',{className:'ring',style:{'--p':sumPct,'--rc':rc}},h('span',null,A.score.ok)),
        A.allOk?'Abnahme bestanden':nbad+' von '+A.score.req+' Prüfungen offen')),
    searching||reviewing?null:h('div',{key:'br',className:'hud br'},
      ev&&!ev.done?h('button',{className:'btn red',style:{minHeight:46},onClick:evStop},h(Ic,{n:'stop',s:18}),'Stoppen')
        :h('button',{className:'btn green',style:{minHeight:46,boxShadow:'0 4px 14px rgba(0,0,0,.4)'},onClick:evStart},h(Ic,{n:'play',s:18}),ev?'Nochmal':'Evakuierung'))];
  /* ---------- Panel: Prüfer ---------- */
  const checkCard=c=>{
    const isInfo=c.kind==='info',st=isInfo?'in':c.ok?'ok':'no',op=open===c.id;
    return h('div',{key:c.id,className:'card ck '+(isInfo?'':c.ok?'good':'bad')},
      h('button',{className:'ckh',onClick:()=>setOpen(op?null:c.id),'aria-expanded':op},
        h('span',{className:'dotk '+st},h(Ic,{n:isInfo?'info':c.ok?'check':'cross',s:18})),
        h('span',{className:'ckt'},h('b',null,c.title),h('span',null,c.detail),h('span',{className:'ref'},'Lernseite '+c.ref))),
      op?h('div',{className:'ckb'},
        c.hint?h('p',{className:'mu',style:{marginBottom:6}},B(c.hint)):null,
        c.issues.map((i,k)=>h('div',{key:k,className:'iss'},h('span',{style:{flex:1}},i.txt),i.noPos?null:h('button',{className:'btn sec sm',onClick:()=>focusIssue(i)},h(Ic,{n:'pin',s:16}),'Zeigen')))):null);};
  const evCard=()=>{
    const e=ev;
    return h('div',{className:'card'},h('h2',null,'Evakuierung'),
      !e?h('p',{className:'mu'},'Personen laufen aus allen Räumen auf dem kürzesten Weg zum nächsten Treppenraum oder Ausgang. Wo der Plan gegen eine Regel verstößt, bleiben sie hängen.')
      :h('div',{className:'stat'},h('div',null,h('small',null,'Draußen'),h('b',null,e.out+' / '+e.total)),h('div',null,h('small',null,'Zeit'),h('b',null,Math.round(e.t)+' s')),h('div',null,h('small',null,'Hängen'),h('b',{style:{color:e.stuck?'#ff8a78':'inherit'}},e.stuck))),
      e&&e.done?(e.stuck===0?h('div',{className:'msg g'},'Alle '+e.total+' Personen sind nach '+Math.round(e.maxT||e.t)+' s draußen. Längster Weg '+fm(e.longest,0)+' m.')
        :h('div',{className:'msg r'},e.stuck+' von '+e.total+' Personen kommen nicht heraus:',h('ul',{style:{margin:'6px 0 0',padding:0}},e.why.map((w,i)=>h('li',{key:i},w))))):null,
      ev&&!ev.done?h('button',{className:'btn red big',onClick:evStop},'Stoppen'):h('button',{className:'btn green big',onClick:evStart},h(Ic,{n:'play',s:18}),e?'Noch einmal starten':'Evakuierung starten'));};
  const pruefer=()=>{
    if(searching)return h('div',null,h('div',{className:'msg o'},'Prüfer verdeckt'),h('p',{className:'mu'},'Im Suchmodus siehst du das Ergebnis erst nach dem Abgeben. Wechsle zum Reiter Aufgaben.'));
    return h('div',null,
      intro&&!task?h('div',{className:'card',style:{borderColor:'rgba(255,164,18,.5)',padding:'10px 12px'}},h('div',{className:'row',style:{flexWrap:'nowrap',alignItems:'flex-start'}},h('p',{style:{margin:0,flex:1,fontSize:13.5}},B('**Planen:** Werkzeug unten wählen, im Plan ziehen oder tippen. Der **Prüfer** zeigt live rot und grün, **Evakuierung** testet den Plan.')),h('button',{className:'rb',style:{background:'transparent',color:'var(--mu)',width:32,height:32,flex:'none'},onClick:()=>setIntro(false),'aria-label':'Schließen'},h(Ic,{n:'cross',s:16})))):null,
      tinfo?h('div',{className:'card',style:{borderColor:'var(--ac)'}},h('div',{className:'row',style:{justifyContent:'space-between'}},h('h2',null,tinfo.t.title),h(Stars,{n:curStars,s:20})),
        h('p',{className:'mu'},tinfo.t.text),
        h('div',{className:'ck'},[tinfo.rq,tinfo.bn].map((r,i)=>h('div',{key:i,className:'row',style:{padding:'4px 0',fontSize:13.5}},h('span',{className:'dotk '+(r.ok?'ok':'no'),style:{width:22,height:22}},h(Ic,{n:r.ok?'check':'cross',s:14})),h('span',{style:{flex:1}},r.txt),h('span',{className:'mu'},r.v)))),
        h('div',{className:'legend'},h('span',null,'1 Stern: alle Prüfungen bestanden'),h('span',null,'2 Sterne: Evakuierung ohne Hänger'),h('span',null,'3 Sterne: zusätzlich Bonus')),
        tinfo.pass&&curStars<2?h('div',{className:'msg o'},'Plan steht! Starte die Evakuierung für den 2. Stern.'):null,
        curStars>=2?h('div',{className:'msg g'},curStars===3?'Drei Sterne. Alle Ziele erreicht.':'Zwei Sterne. Für den dritten fehlt der Bonus.'):null):null,
      h('div',{className:'card'},h('div',{className:'row',style:{justifyContent:'space-between'}},h('h2',{style:{margin:0}},A.allOk?'Plan abnahmefähig':A.score.ok+' von '+A.score.req+' Prüfungen bestanden'),h('span',{className:'ring',style:{'--p':sumPct,'--rc':rc,width:38,height:38}},h('span',{style:{width:28,height:28}},sumPct+'%'))),
        h('div',{className:'sumbar'},h('div',{style:{width:sumPct+'%',background:rc}})),
        h('p',{className:'mu',style:{margin:0,fontSize:13}},A.allOk?'Der Prüfer hat keine Mängel gefunden. Teste den Plan mit der Evakuierung.':'Tippe auf eine Prüfung: Regel, Mangel und Stelle im Plan.')),
      evCard(),
      h('h3',null,'Prüfungen'),A.checks.filter(c=>c.kind==='req').map(checkCard),
      A.checks.some(c=>c.kind==='info')?h('h3',null,'Hinweise'):null,A.checks.filter(c=>c.kind==='info').map(checkCard),
      h('p',{className:'mu',style:{fontSize:12,marginTop:10}},'Vereinfachte Darstellung: Raster 1 m, Weglängen als Lauflinie. Alle Grenzwerte stammen aus der Lernseite Vorbeugender Brandschutz.'));};
  /* ---------- Panel: Plan ---------- */
  const settings=()=>{
    const o=opts,set=(k,v)=>setOpts(Object.assign({},o,{[k]:v}));
    if(typeId==='std')return h('div',null,h('div',{className:'lab'},'Gebäudeklasse'),h(Seg,{o:[[3,'GK 3'],[4,'GK 4'],[5,'GK 5']],v:o.gk,on:v=>set('gk',v)}),h('div',{className:'lab'},'Geschoss'),h(Seg,{o:[[0,'Obergeschoss'],[1,'Kellergeschoss']],v:o.kg,on:v=>set('kg',v)}));
    if(typeId==='vk')return h('div',null,h('div',{className:'lab'},'Lage der Verkaufsstätte'),h(Seg,{o:[[1,'Erdgeschossig'],[0,'Sonstige']],v:o.eg,on:v=>set('eg',v)}),h('div',{style:{marginTop:8}},h(Sw,{t:'Sprinkleranlage',d:'größere Brandabschnitte, 105 m über Treppenraum',v:o.spr,on:v=>set('spr',v)})));
    if(typeId==='bh')return h('div',null,h('div',{className:'lab'},'Gastbetten'),h(Seg,{o:[[40,'bis 60'],[80,'über 60']],v:o.betten,on:v=>set('betten',v)}),h('div',{style:{marginTop:8}},
        h(Sw,{t:'Alarmierungseinrichtung',v:o.alarm,on:v=>set('alarm',v)}),h(Sw,{t:'Sicherheitsbeleuchtung',d:'Flure, Treppenräume, Zeichen',v:o.sibel,on:v=>set('sibel',v)}),h(Sw,{t:'Rettungswegplan im Zimmer',v:o.plan,on:v=>set('plan',v)}),
        h(Sw,{t:'Brandmeldeanlage',d:'ab über 60 Gastbetten Pflicht',v:o.bma,on:v=>set('bma',v)}),h(Sw,{t:'Brandschutzordnung + Feuerwehrpläne',d:'ab über 60 Gastbetten Pflicht',v:o.bso,on:v=>set('bso',v)})));
    if(typeId==='ind')return h('div',null,h('div',{className:'lab'},'Raumhöhe'),h(Seg,{o:[[5,'5 m'],[10,'10 m']],v:o.h,on:v=>set('h',v)}),h('div',{style:{marginTop:8}},h(Sw,{t:'Alarmierungsanlage',d:'ohne: 35/50 m · mit: 50/70 m',v:o.alarm,on:v=>set('alarm',v)})));
    if(typeId==='gar')return h('div',null,h('div',{className:'lab'},'Bauart'),h(Seg,{o:[[0,'Geschlossen'],[1,'Offen']],v:o.offen,on:v=>set('offen',v)}),h('div',{className:'lab'},'Lage'),h(Seg,{o:[[1,'Oberirdisch'],[0,'Unterirdisch']],v:o.ober,on:v=>set('ober',v)}),
      h('div',{style:{marginTop:8}},h(Sw,{t:'Sprinkleranlage',d:'Verdoppelung der Abschnittsgröße',v:o.spr,on:v=>set('spr',v)}),h(Sw,{t:'Maschinelle Abluftanlage',v:o.abl,on:v=>set('abl',v)}),h(Sw,{t:'Entrauchung (10-facher Luftwechsel)',v:o.ent,on:v=>set('ent',v)}),h(Sw,{t:'Brandmeldeanlage',v:o.bma,on:v=>set('bma',v)})));
    return null;};
  const planTab=()=>h('div',null,
    h('h3',{style:{marginTop:0}},'Gebäudetyp'),
    h('div',{className:'typeg'},Object.keys(TYPES).map(id=>h('button',{key:id,className:'typec'+(typeId===id?' on':''),onClick:()=>selectType(id)},h(Ic,{n:id,s:26}),TYPES[id].kurz==='Hotel'?'Beherbergung':TYPES[id].name,h('small',null,TYPES[id].sub)))),
    typeId==='std'?h('div',null,h('div',{className:'lab'},'Grundriss'),h(Seg,{o:[['r','Rechteck'],['l','Winkelbau']],v:variant,on:v=>selectType('std',v)})):null,
    h('h3',null,'Einstellungen'),settings(),
    h('h3',null,'Plan'),
    h('div',{className:'row'},h('button',{className:'btn sec',onClick:resetStart},'Startplan neu laden'),h('button',{className:'btn sec',onClick:emptyOf},'Leeres Geschoss')),
    h('div',{className:'lab'},'Raster beim Zeichnen'),h(Seg,{o:[[1,'1 m'],[5,'5 m']],v:snap,on:setSnap}),
    h('h3',null,'Legende'),
    h('div',{className:'legend'},[['#c2452d','Brandwand REIM 90'],['#e9edf5','Trennwand'],['#5a6c8f','Außenwand'],['#58c47d','Treppenraum'],['#f0e5c3',T.hasFlur?T.flur:'Fläche'],['#6ea8ff','Tür DS'],['#3fd6c6','Tür RS'],['#ffb340','Tür T30-DS'],['#ff6f4a','Tür T30-RS'],['#3fe08a','Ausgang']].map((a,i)=>h('span',{key:i},h('i',{style:{background:a[0]}}),a[1]))),
    h('p',{className:'mu',style:{fontSize:12.5}},'Vereinfachte Darstellung. Maße in Metern, Raster 1 m. Die Werte folgen der Lernseite: '+T.sub+'.'));
  /* ---------- Panel: Aufgaben ---------- */
  const total=Object.keys(stars).reduce((s,k)=>s+(stars[k]||0),0);
  const taskCard=t=>h('button',{key:t.id,className:'tkc'+(task&&task.id===t.id?' on':''),onClick:()=>startTask(t)},h('span',{className:'ico'},h(Ic,{n:t.kind==='find'?'flag':t.type,s:22})),h('span',{style:{flex:1,minWidth:0}},h('b',null,t.title),h('small',null,t.sub)),h(Stars,{n:stars[t.id]||0,s:17}));
  const active=()=>{
    if(!task)return null;const t=TASKS.find(x=>x.id===task.id);
    if(task.kind==='build')return h('div',{className:'card',style:{borderColor:'var(--ac)'}},h('h2',null,t.title),h('p',null,t.text),h('button',{className:'btn sec sm',onClick:endTask},'Aufgabe beenden'));
    if(task.phase==='search')return h('div',{className:'card',style:{borderColor:'var(--ac)'}},h('h2',null,t.title),h('p',null,t.intro),h('div',{className:'msg n'},task.marks.length+' Markierung'+(task.marks.length===1?'':'en')+' gesetzt. Prüfer und Verstöße sind verdeckt.'),
      h('div',{className:'row'},h('button',{className:'btn',disabled:!task.marks.length,onClick:submitFind},'Abgeben'),h('button',{className:'btn sec',onClick:endTask},'Abbrechen')));
    const r=task.res;
    return h('div',{className:'card',style:{borderColor:'var(--ac)'}},h('div',{className:'row',style:{justifyContent:'space-between'}},h('h2',{style:{margin:0}},r.found+' von '+r.total+' Fehlern gefunden'),h(Stars,{n:r.stars,s:24})),
      r.falseM.length?h('div',{className:'msg o'},r.falseM.length+' Markierung'+(r.falseM.length===1?'':'en')+' ohne Fehler.'):null,
      r.groups.map((g,i)=>{const c=A.checks.find(x=>x.id===g.check)||{};return h('div',{key:i,className:'card',style:{marginBottom:8,padding:'10px 12px',background:'rgba(0,0,0,.18)'}},
        h('div',{className:'row',style:{flexWrap:'nowrap',alignItems:'flex-start'}},h('span',{className:'dotk '+(g.found?'ok':'no')},h(Ic,{n:g.found?'check':'cross',s:16})),h('div',{style:{flex:1,minWidth:0}},h('b',{style:{fontSize:14}},g.found?'Gefunden: ':'Übersehen: ',c.title),
          h('div',{className:'mu',style:{fontSize:13,marginTop:2}},g.items[0].txt),h('span',{className:'ref'},'Lernseite '+(c.ref||'')),c.hint?h('div',{style:{fontSize:12.8,marginTop:5,color:'#c8d3e6'}},B(c.hint)):null),
          h('button',{className:'btn sec sm',onClick:()=>focusIssue(g.items[0])},h(Ic,{n:'pin',s:16}))))}),
      h('div',{className:'row',style:{marginTop:6}},h('button',{className:'btn',onClick:()=>{setTask(Object.assign({},task,{phase:'fix',marks:[],res:null}));setTool('door');say('Jetzt darfst du den Plan reparieren.');}},'Mängel beheben'),h('button',{className:'btn sec',onClick:()=>startTask(t)},'Nochmal'),h('button',{className:'btn sec',onClick:endTask},'Fertig')));};
  const aufTab=()=>h('div',null,
    task&&task.kind==='find'&&task.phase==='fix'?h('div',{className:'card',style:{borderColor:'var(--ac)'}},h('h2',null,'Mängel beheben'),h('p',null,'Repariere den Plan, bis der Prüfer alles grün zeigt.'),A.allOk?h('div',{className:'msg g'},'Repariert. Der Plan ist abnahmefähig.'):h('div',{className:'msg o'},nbad+' Prüfung'+(nbad===1?'':'en')+' noch offen.'),h('button',{className:'btn sec sm',onClick:endTask},'Beenden')):active(),
    h('div',{className:'row',style:{justifyContent:'space-between',marginBottom:6}},h('h3',{style:{margin:0}},'Finde die Fehler'),h('span',{className:'mu',style:{fontSize:12}},total+' von 18 Sternen')),
    TASKS.filter(t=>t.kind==='find').map(taskCard),
    h('h3',null,'Bauaufgaben'),TASKS.filter(t=>t.kind==='build').map(taskCard),
    h('p',{className:'mu',style:{fontSize:12.5,marginTop:10}},'Fehlersuche: bis zu drei Sterne für gefundene Mängel. Bauaufgabe: ein Stern für den bestandenen Plan, zwei mit erfolgreicher Evakuierung, drei mit Bonusziel.'));
  const body=tab==='pruefer'?pruefer():tab==='plan'?planTab():aufTab();
  const panel=h('div',{className:'panel'+(min?' min':'')},
    h('div',{className:'pbody'},body),
    h('div',{className:'tabs'},
      h('button',{className:'tab'+(tab==='pruefer'?' on':''),onClick:()=>clickTab('pruefer')},h(Ic,{n:'list',s:20}),'Prüfer',searching?null:h('span',{className:'bd'+(A.allOk?' g':'')},A.allOk?'OK':nbad)),
      h('button',{className:'tab'+(tab==='plan'?' on':''),onClick:()=>clickTab('plan')},h(Ic,{n:'gear',s:20}),'Plan'),
      h('button',{className:'tab'+(tab==='aufgaben'?' on':''),onClick:()=>clickTab('aufgaben')},h(Ic,{n:'task',s:20}),'Aufgaben')));
  const helpEl=help?h('div',{className:'ob',onClick:()=>setHelp(false)},h('div',{className:'obc',onClick:e=>e.stopPropagation()},h('h2',null,'Bedienung'),
    h('ol',null,h('li',null,B('**Werkzeug** unten wählen. Wände und Flure zieht man von Punkt zu Punkt, Türen und Ausgänge setzt man per Tippen auf die Wand.')),
      h('li',null,B('**Ansicht**: Ziehen dreht, Pinch oder Mausrad zoomt, zwei Finger verschieben. Rechte Maustaste dreht immer.')),
      h('li',null,B('**Prüfer** zeigt live, welche Regeln der Lernseite erfüllt sind. Rote Pulse markieren die Stellen.')),
      h('li',null,B('**Messlinien** zeigen den Rettungsweg zum nächsten Treppenraum oder Ausgang.')),
      h('li',null,B('**Evakuierung** schickt Personen los. Bei Verstößen bleiben sie hängen.'))),
    h('button',{className:'btn big',onClick:()=>setHelp(false)},'Verstanden'))):null;
  return h('div',{className:'app'},
    h('div',{className:'left'},
      h('div',{className:'stage',ref:hostRef},h('canvas',{ref:canvasRef}),hud,toast?h('div',{className:'toast'},toast):null,helpEl),
      dock),
    panel);
}
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
ReactDOM.createRoot?ReactDOM.createRoot(document.getElementById('root')).render(h(App)):ReactDOM.render(h(App),document.getElementById('root'));
