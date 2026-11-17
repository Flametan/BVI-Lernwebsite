/* ======================================================================
   FRAGE DES TAGES – drei Prüfungsfragen, jeden Tag neu, für alle gleich
   Fragen kommen aus PAUSE (FAHRT.questions: Laufbahn-Prüfungsfragen).
   Serie: Tage in Folge mit mindestens einer Teilnahme (localStorage 'bvi_pause_best').
====================================================================== */
const TAGESFRAGE=(function(){
  'use strict';
  const BKEY='bvi_pause_best',SKEY='bvi_tagesfrage_';
  let el=null,src=null;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const get=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
  const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  const pad=n=>('0'+n).slice(-2);
  const dstr=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const today=()=>dstr(new Date());
  const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return dstr(d);};
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
  const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};
  const say=m=>{if(typeof A11Y!=='undefined')A11Y.say(m);};
  const STYLE='tf2-style';
  function css(){if(document.getElementById(STYLE))return;const s=document.createElement('style');s.id=STYLE;
    s.textContent='.tfd-card{max-width:620px;margin:0 auto}.tfd-days{display:flex;gap:6px;justify-content:center;margin:2px 0 10px}.tfd-days i{width:26px;height:6px;border-radius:4px;background:var(--m-line,#444)}.tfd-days i.on{background:var(--m-accent,#ffa31a)}.tfd-days i.bad{background:#e5483b}.tfd-streak{display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;color:var(--m-accent,#ffa31a)}.tfd-streak svg{width:20px;height:20px}';
    document.head.appendChild(s);}
  // Streak-Logik: Serie zählt Tage in Folge; wer gestern nicht war, startet bei 1
  function recStreak(){const b=get(BKEY,{}),o=b.tagesfrage&&typeof b.tagesfrage==='object'?b.tagesfrage:{streak:0,last:'',max:0},t=today();
    if(o.last===t)return o;
    o.streak=o.last===yesterday()?(o.streak||0)+1:1;o.last=t;o.max=Math.max(o.max||0,o.streak);b.tagesfrage=o;set(BKEY,b);if(typeof PAUSE!=='undefined') PAUSE.addScore('tagesfrage',o.streak);return o;}
  function pickQs(){const all=(src&&src.questions?src.questions():[]).filter(q=>q.o&&q.o.length>=3&&q.q&&q.q.length<260&&q.o.every(o=>String(o).length<220));
    if(all.length<3)return[];
    const R=rng(hash('bvi-tag-'+today())),A=all.slice().sort((x,y)=>{const a=hash(x.q),b=hash(y.q);return a<b?-1:a>b?1:0;}),out=[];
    while(out.length<3&&A.length){const i=Math.floor(R()*A.length),q=A.splice(i,1)[0];if(!out.some(x=>x.q===q.q))out.push(q);}
    return out.map(q=>{const idx=q.o.map((_,i)=>i);for(let i=idx.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}return{m:q.m,src:q.src,q:q.q,e:q.e||'',o:idx.map(i=>q.o[i]),c:idx.indexOf(q.c)};});}
  function datum(){return new Date().toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});}
  function render(st,qs){
    const L='ABCDE',done=st.i>=qs.length;
    if(done){const right=st.res.filter(Boolean).length,rec=recStreak();
      const msg=right===3?'Alle drei richtig. Starker Tag.':right===2?'Zwei von drei richtig.':right===1?'Einer von drei richtig.':'Heute leider keine Frage richtig.';
      el.innerHTML=`<div class="pz-card tfd-card"><div class="pz-lbl"><span>Frage des Tages</span><b>${esc(datum())}</b></div><div class="pz-big-n">${right} von 3</div><div class="pz-center">${msg}</div><div class="tfd-streak"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2s5 4.6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3 1-6 1-8z"/></svg>${rec.streak} ${rec.streak===1?'Tag':'Tage'} in Folge</div><div class="tfd-days">${qs.map((_,i)=>`<i class="${st.res[i]?'on':'bad'}"></i>`).join('')}</div>${st.res.some(r=>!r)?`<div class="pz-lbl"><span>Zum Nacharbeiten</span></div><ul class="pz-res">${qs.filter((_,i)=>!st.res[i]).map(q=>`<li>${esc(q.q)}<br><small>Richtig: ${esc(q.o[q.c])}</small></li>`).join('')}</ul>`:''}<div class="pz-center"><small>Morgen gibt es drei neue Fragen. Heute sehen alle dieselben.</small></div></div>`;
      set(SKEY+today(),{res:st.res});say('Fertig, '+right+' von 3 richtig');return;}
    const q=qs[st.i];
    el.innerHTML=`<div class="pz-card tfd-card"><div class="pz-lbl"><span>Frage des Tages · ${esc(datum())}</span><b>${st.i+1}/3</b></div><div class="tfd-days">${qs.map((_,i)=>`<i class="${i<st.i?(st.res[i]?'on':'bad'):i===st.i?'on':''}"></i>`).join('')}</div><div class="pz-lbl"><span>${esc(q.m)} · ${esc(q.src)}</span></div><div class="pz-qt">${esc(q.q)}</div>${q.o.map((o,i)=>`<button class="pz-opt" data-k="${i}"><i>${L[i]}</i><span>${esc(o)}</span></button>`).join('')}<div class="pz-fbx"></div></div>`;
    el.querySelectorAll('.pz-opt').forEach(b=>b.onclick=()=>{
      const k=+b.dataset.k,ok=k===q.c;el.querySelectorAll('.pz-opt').forEach(x=>x.style.pointerEvents='none');
      el.querySelector(`[data-k="${q.c}"]`).classList.add('ok');if(!ok)b.classList.add('bad');say(ok?'Richtig':'Falsch');
      st.res[st.i]=ok;
      const fb=el.querySelector('.pz-fbx');fb.innerHTML=`<div class="pz-fb ${ok?'g':'r'}"><b>${ok?'Richtig':'Leider falsch'}</b>${q.e?'<br>'+esc(q.e):''}</div><button class="pz-pri">${st.i<qs.length-1?'Nächste Frage':'Ergebnis'}</button>`;
      fb.querySelector('.pz-pri').onclick=()=>{st.i++;render(st,qs);};
      const p=fb.querySelector('.pz-pri');if(p&&p.focus)p.focus();});
  }
  function start(body,source){css();el=body;src=source||src;
    const qs=pickQs();
    if(!qs.length){el.innerHTML='<div class="pz-card"><div class="pz-center">Heute gibt es noch keine Fragen. Bitte später wieder vorbeischauen.</div></div>';return;}
    const saved=get(SKEY+today(),null);
    // heute schon gespielt: Ergebnis zeigen, nicht noch einmal (sonst ließe sich die Serie nicht verdienen, aber auch nicht verfälschen)
    if(saved&&Array.isArray(saved.res)&&saved.res.length===qs.length){render({i:qs.length,res:saved.res},qs);return;}
    render({i:0,res:[]},qs);
  }
  return{start,stop(){el=null;}};
})();
