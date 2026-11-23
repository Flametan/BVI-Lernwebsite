/* Gefühl der Bedienung: sofortiges Druck-Feedback, Feder (Dämpfung 0,8, ca. 1,5 % Überschwingen),
   Schwung nach dem Loslassen und unterbrechbare Seitenwechsel. Alles optional: ohne Element.animate bleibt es beim bisherigen CSS. */
const FEEL=(function(){
  const WA=typeof Element!=='undefined'&&typeof Element.prototype.animate==='function';
  const rm=()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
  const SPRING_L='linear(0,0.0461,0.1541,0.2893,0.429,0.5596,0.6736,0.7684,0.8437,0.9012,0.9434,0.973,0.9927,1.0049,1.0116,1.0146,1.0151,1.0141,1.0124,1.0103,1.0082,1.0062,1.0046,1.0032,1.0021,1.0013,1)';
  let SPRING='cubic-bezier(.34,1.3,.64,1)';
  try{ if(CSS.supports('animation-timing-function',SPRING_L)) SPRING=SPRING_L; }catch(e){}
  const SPRING_MS=550;
  if(WA) document.documentElement.classList.add('wa');

  /* 01 Druck-Feedback: skaliert im selben Moment, in dem der Finger aufsetzt (0 ms), und federt beim Loslassen zurück */
  const PRESS='button,[role=button],a[href],.m-row,.glass-tile,.topic-card,.fcs-row';
  const SKIP='.m-tab,.m-tab-center,.m-ri,.m-ham,.m-hsearch,.m-tb-search,.m-ringbtn,.m-modrow,.pz-game,.pz-tile,.sh-app,.acc-g,.fc-rb,.m-ha-exam,.m-ha-set,[data-nopress],:disabled,[aria-disabled=true]';
  const runs=new WeakMap();
  let cur=null, px=0, py=0;
  const num=v=>{ const n=parseFloat(v); return isFinite(n)?n:1; };
  function release(){
    const t=cur; if(!t) return; cur=null;
    const from=num(t.style.scale); t.style.scale='';
    if(rm()) return;
    const a=t.animate([{scale:from},{scale:1}],{duration:SPRING_MS,easing:SPRING});
    runs.set(t,a);
    const done=()=>{ if(runs.get(t)===a) runs.delete(t); };
    a.onfinish=done; a.oncancel=done;
  }
  if(WA){
    document.addEventListener('pointerdown',e=>{
      if(e.button>0||rm()) return;
      const t=e.target.closest&&e.target.closest(PRESS);
      if(!t||t.matches(SKIP)||t.closest('[data-nopress]')) return;
      if(getComputedStyle(t).touchAction==='none') return;   // Spielfelder und ziehbare Elemente (Solitär-Karten, Lernkarte) bleiben unberührt
      const r=t.getBoundingClientRect(), m=Math.max(r.width,r.height);
      if(m<8||m>520) return;
      if(cur) release();
      const s=1-Math.min(.06,Math.max(.012,6/m));
      const run=runs.get(t); let now=1;
      if(run){ now=num(getComputedStyle(t).scale); run.cancel(); runs.delete(t); }
      t.style.scale=String(Math.min(s,now));
      cur=t; px=e.clientX; py=e.clientY;
    },{passive:true,capture:true});
    document.addEventListener('pointermove',e=>{ if(cur&&Math.abs(e.clientX-px)+Math.abs(e.clientY-py)>10) release(); },{passive:true,capture:true});
    ['pointerup','pointercancel','dragstart'].forEach(ev=>document.addEventListener(ev,release,{passive:true,capture:true}));
    window.addEventListener('scroll',release,{passive:true,capture:true});
  }

  /* 03 Schwung: der Finger gibt die Anfangsgeschwindigkeit vor (px/ms), danach bremst es exponentiell ab.
     Ein Schnipser mit 2 px/ms gleitet etwa 1000 px weit (Verzögerungsrate 0,998 pro ms wie bei iOS). */
  const RATE=.998, TAU=-1/Math.log(RATE);
  const project=v=>v*TAU;
  function glide(el,o){
    // o: {from,to,v,at:x=>transform, opacity:[a,b], min,max}
    const D=o.to-o.from; if(!WA||rm()||!D){ el.style.transform=o.at(o.to); if(o.opacity) el.style.opacity=String(o.opacity[1]); return Promise.resolve(); }
    const dir=D>0?1:-1, v=Math.max(.3,Math.abs(o.v||0)), L=Math.abs(D);
    let T=Math.min(o.max||420,Math.max(o.min||140,2*L/v));
    const a=Math.max(1,v*T/L);               // Verhältnis Anfangstempo zu mittlerem Tempo
    let lo=0,hi=40; for(let i=0;i<30;i++){ const k=(lo+hi)/2; (k/(1-Math.exp(-k))<a)?lo=k:hi=k; }
    const k=(lo+hi)/2, N=14, f=[];
    for(let i=0;i<=N;i++){ const p=i/N, e=k<.01?p:(1-Math.exp(-k*p))/(1-Math.exp(-k)); f.push({offset:p,transform:o.at(o.from+D*e)}); if(o.opacity) f[i].opacity=String(o.opacity[0]+(o.opacity[1]-o.opacity[0])*p); }
    el.style.transform=o.at(o.to); if(o.opacity) el.style.opacity=String(o.opacity[1]);
    const an=el.animate(f,{duration:T,easing:'linear'});
    return an.finished.catch(()=>{});
  }

  /* 05 Seitenwechsel, die sich jederzeit unterbrechen lassen: wer mitten in der Bewegung wieder tippt,
     startet sofort die nächste, und zwar mit der Helligkeit, die der Bildschirm gerade hatte */
  let navA=null, navEl=null;
  function pre(){
    let o=0;
    if(navA&&navEl){ try{ if(navA.playState==='running') o=Math.min(.9,num(getComputedStyle(navEl).opacity)); }catch(e){} try{ navA.cancel(); }catch(e){} }
    navA=null; navEl=null; return o;
  }
  function enter(el,dir,o){
    if(!WA||rm()) return;
    const dx=(dir==='back'?-1:1)*28*(1-o);
    const a=el.animate([{opacity:o,transform:'translateX('+dx+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:Math.round(Math.max(130,220*(1-o))),easing:'cubic-bezier(.2,.8,.2,1)'});
    navA=a; navEl=el;
    const done=()=>{ if(navA===a){ navA=null; navEl=null; } };
    a.onfinish=done; a.oncancel=done;
  }

  return {SPRING,SPRING_MS,project,glide,pre,enter,spring:ms=>' '+(ms||SPRING_MS)+'ms '+SPRING};
})();
