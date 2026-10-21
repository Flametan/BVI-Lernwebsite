/* ======================================================================
   JGUI – Oberfläche für Jahrgänge: Einstellungen, Stundenplan-Editor, Ergänzungen („+“ auf Lernseiten),
   eigene Prüfungen, Texterkennung (OCR) aus Fotos und Screenshots
   Alles läuft auf dem Gerät; die Texterkennung lädt beim ersten Mal die Bibliothek (Internet nötig).
====================================================================== */
const JGUI=(function(){
  const E=t=>String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const $=(r,s)=>r.querySelector(s);
  const NOTICE='<b>Hinweis:</b> Du bist selbst für die Inhalte verantwortlich, die du hinzufügst und weitergibst. Lade keine urheberrechtlich geschützten Unterlagen (z. B. Folien oder Skripte der Dozenten) hoch, wenn du dafür keine Erlaubnis hast.';

  // ── Fenster ──
  const stack=[];
  function modal(title,html,cls){
    const ov=document.createElement('div'); ov.className='jg-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label',title);
    ov.innerHTML='<div class="jg-card '+(cls||'')+'"><button class="sh-x" aria-label="Schließen" type="button">×</button><div class="sh-t">'+E(title)+'</div><div class="jg-body">'+html+'</div></div>';
    document.body.appendChild(ov); stack.push(ov);
    const m={ov,body:$(ov,'.jg-body'),close(){ const i=stack.indexOf(ov); if(i>=0) stack.splice(i,1); ov.remove(); }};
    ov.addEventListener('click',e=>{ if(e.target===ov||e.target.closest('.sh-x')) m.close(); });
    setTimeout(()=>{ const f=ov.querySelector('input:not([type=file]):not([type=radio]),textarea,select,button.btn'); if(f&&!ov.contains(document.activeElement)) f.focus({preventScroll:true}); },30);
    return m;
  }
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&stack.length){ e.preventDefault(); stack[stack.length-1].querySelector('.sh-x').click(); } });
  const closeTop=()=>{ if(!stack.length) return false; stack[stack.length-1].querySelector('.sh-x').click(); return true; };

  // ── Bilder: verkleinern ──
  function readImage(file,max){
    return new Promise((ok,fail)=>{
      const url=URL.createObjectURL(file), im=new Image();
      im.onload=()=>{ URL.revokeObjectURL(url); ok(im); };
      im.onerror=()=>{ URL.revokeObjectURL(url); fail(new Error('image')); };
      im.src=url;
    });
  }
  async function shrink(file,max,q){
    const im=await readImage(file), f=Math.min(1,max/Math.max(im.width,im.height)), c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(im.width*f)); c.height=Math.max(1,Math.round(im.height*f));
    const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(im,0,0,c.width,c.height);
    return {canvas:c,dataUrl:c.toDataURL('image/jpeg',q||.72)};
  }

  // ── Texterkennung (Tesseract.js, deutsch) ──
  let tessP=null;
  function loadTess(){
    if(window.Tesseract) return Promise.resolve();
    return tessP||(tessP=new Promise((ok,fail)=>{
      const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      s.onload=ok; s.onerror=()=>{ tessP=null; fail(new Error('load')); }; document.head.appendChild(s);
    }));
  }
  async function ocr(file,onProgress){
    await loadTess();
    const {canvas}=await shrink(file,2200,.9);
    const g=canvas.getContext('2d'), d=g.getImageData(0,0,canvas.width,canvas.height), p=d.data;   // Graustufen mit mehr Kontrast
    for(let i=0;i<p.length;i+=4){ let v=.299*p[i]+.587*p[i+1]+.114*p[i+2]; v=Math.max(0,Math.min(255,(v-128)*1.25+128)); p[i]=p[i+1]=p[i+2]=v; }
    g.putImageData(d,0,0);
    const r=await Tesseract.recognize(canvas,'deu',{logger:m=>{ if(onProgress&&typeof m.progress==='number') onProgress(m.status,m.progress); }});
    return String(r.data.text||'');
  }
  // Fenster zum Einlesen: Datei wählen → Fortschritt → Text; onText bekommt den erkannten Text
  function ocrPicker(root,onText){
    const box=document.createElement('div'); box.className='jg-ocr';
    box.innerHTML='<label class="btn btn-ghost jg-file">Foto oder Screenshot wählen<input type="file" accept="image/*" hidden></label><span class="jg-ocr-s"></span>';
    root.appendChild(box);
    const inp=$(box,'input'), st=$(box,'.jg-ocr-s');
    inp.onchange=async()=>{
      const f=inp.files[0]; inp.value=''; if(!f) return;
      st.textContent='Texterkennung startet … beim ersten Mal wird dafür etwas nachgeladen (Internet nötig)';
      try{
        const t=await ocr(f,(s,p)=>{ st.textContent='Texterkennung: '+Math.round(p*100)+' %'; });
        st.textContent=t.trim()?'Fertig – bitte prüfen und ausbessern':'Es wurde kein Text erkannt';
        if(t.trim()) onText(t,f);
      }catch(e){ st.textContent='Die Texterkennung konnte nicht geladen werden – bitte Verbindung prüfen oder den Text selbst eingeben'; }
    };
    return box;
  }

  // ── Einstellungen: Gruppe „Lehrgang“ ──
  function settings(){
    const root=document.getElementById('jg-settings'); if(!root) return;
    const cur=JG.current(), list=JG.list();
    const opts=list.map(j=>'<option value="'+j.id+'"'+(j.id===cur?' selected':'')+'>'+E(j.label)+(j.id===JG.MASTER?' (Master)':'')+'</option>').join('');
    const master=JG.isMaster(), loc=JG.hasLocal();
    root.innerHTML='<div class="m-row m-static m-wrap"><span class="m-tx"><span class="m-t1">Mein Jahrgang</span><span class="m-t2">'+(master?'Der Master: alle Inhalte der App':'Kopie des Masters mit eigenen Änderungen – neue Inhalte und Verbesserungen vom Master kommen automatisch')+'</span></span><select id="jg-sel" class="m-input" aria-label="Jahrgang">'+opts+'</select></div>'
      +'<button class="m-row" id="jg-exp"><span class="m-tx"><span class="m-t1">Änderungen exportieren</span><span class="m-t2">Eine Datei mit Plan, Ergänzungen und Prüfungen, zum Weitergeben per WhatsApp</span></span></button>'
      +'<label class="m-row" for="jg-imp" style="cursor:pointer"><span class="m-tx"><span class="m-t1">Änderungen einlesen</span><span class="m-t2">Eine Datei von jemandem aus deinem Jahrgang</span></span><input type="file" id="jg-imp" accept=".json,application/json" hidden></label>'
      +(loc?'<button class="m-row" id="jg-dis"><span class="m-tx"><span class="m-t1">Meine Änderungen verwerfen</span><span class="m-t2">Zurück zum Stand des Masters (mit Rückgängig)</span></span></button>':'')
      +'<p class="m-note" style="padding:10px 16px 14px">'+NOTICE+'</p>';
    $(root,'#jg-sel').onchange=e=>{ JG.set(e.target.value); };
    $(root,'#jg-exp').onclick=exportFile;
    $(root,'#jg-imp').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(f) importFile(f); };
    const d=$(root,'#jg-dis'); if(d) d.onclick=()=>{ if(!confirm('Alle eigenen Änderungen dieses Jahrgangs verwerfen?\n\nDer Plan, deine Ergänzungen, hinzugefügte und ausgeblendete Prüfungen sind danach weg.')) return; const prev=JG.discard(); TOAST.show('Änderungen verworfen',{type:'ok',undo:()=>JG.restore(prev)}); };
  }
  async function exportFile(){
    const text=await JG.exportJson(), id=JG.current();
    const name='bvi-'+id+'.json';
    try{
      const f=new File([text],name,{type:'application/json'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f],title:'B VI – Änderungen',text:'Änderungen für '+JG.labelOf(id)}); return; }
    }catch(e){ if(e&&e.name==='AbortError') return; }
    FILES.save(name,'application/json',text);
  }
  function importFile(file){
    const r=new FileReader();
    r.onload=async()=>{
      try{
        const n=await JG.importJson(String(r.result));
        const parts=[]; if(n.erg) parts.push(n.erg+' Ergänzungen'); if(n.pruefungen) parts.push(n.pruefungen+' Prüfungen'); if(n.plan) parts.push('Plan mit '+n.plan+' Terminen');
        TOAST.show('Eingelesen: '+(parts.join(', ')||'keine neuen Inhalte'),{type:'ok'});
      }catch(e){ TOAST.show('Das ist keine Änderungsdatei dieser App',{type:'info'}); }
    };
    r.readAsText(file);
  }

  // ── Stundenplan: Termine eingeben, ausbessern, aus Foto ──
  const pad=n=>String(n).padStart(2,'0');
  const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
  function planRows(){
    const p=IDF_PLAN.getPlan(); return p?p.ev.filter(e=>!e.ad).map(e=>{ const s=new Date(e.s),en=new Date(e.e); return {date:ymd(s),start:hm(s),end:hm(en),t:e.t,r:e.r}; }):[];
  }
  function planEditor(drafts){
    const rows=planRows(), add=drafts||[];
    const rowHtml=(r,i)=>'<div class="jg-row'+(r.warn?' warn':'')+'" data-i="'+i+'"><input type="date" class="m-input" value="'+E(r.date)+'" aria-label="Datum"><input type="time" class="m-input" value="'+E(r.start)+'" aria-label="Beginn"><input type="time" class="m-input" value="'+E(r.end)+'" aria-label="Ende"><input type="text" class="m-input jg-t" value="'+E(r.t)+'" placeholder="Titel" aria-label="Titel" maxlength="140"><input type="text" class="m-input jg-r" value="'+E(r.r)+'" placeholder="Raum" aria-label="Raum" maxlength="60"><button type="button" class="jg-rep" title="Für die nächsten Wochen kopieren" aria-label="Wochen kopieren">↻</button><button type="button" class="jg-del" aria-label="Termin löschen">✕</button></div>';
    const m=modal('Stundenplan bearbeiten','<p class="jg-p">Ändere Termine, lösche sie oder füge neue hinzu. ↻ kopiert einen Termin auf die folgenden Wochen.</p><div class="jg-tools"><label class="jg-p">Wochen beim Kopieren <input type="number" id="jg-wk" class="m-input" value="4" min="1" max="30" style="width:64px"></label><button class="btn btn-ghost" id="jg-add" type="button">+ Termin</button></div><div id="jg-rows" class="jg-rows"></div><button class="btn btn-gold" id="jg-save" type="button">Speichern</button>','jg-wide');
    const box=$(m.body,'#jg-rows'); let data=[...rows,...add];
    const draw=()=>{ data.sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)); box.innerHTML=data.slice(0,500).map(rowHtml).join('')||'<div class="cu-empty">Noch keine Termine – mit „+ Termin“ anfangen.</div>'; };
    const sync=()=>{ box.querySelectorAll('.jg-row').forEach(el=>{ const i=+el.dataset.i,r=data[i]; if(!r) return; const v=el.querySelectorAll('input'); r.date=v[0].value; r.start=v[1].value; r.end=v[2].value; r.t=v[3].value; r.r=v[4].value; }); };
    draw();
    m.body.addEventListener('click',e=>{
      const row=e.target.closest('.jg-row'), i=row?+row.dataset.i:-1;
      if(e.target.closest('.jg-del')&&i>=0){ sync(); data.splice(i,1); draw(); }
      else if(e.target.closest('.jg-rep')&&i>=0){ sync(); const r=data[i], n=Math.max(1,Math.min(30,+$(m.body,'#jg-wk').value||4)), d0=new Date(r.date+'T00:00'); if(isNaN(d0)) return; for(let k=1;k<=n;k++){ const d=new Date(d0); d.setDate(d.getDate()+7*k); data.push({...r,date:ymd(d),warn:false}); } draw(); }
      else if(e.target.closest('#jg-add')){ sync(); const l=data[data.length-1], d=l?l.date:ymd(new Date()); data.push({date:d,start:l?l.start:'08:00',end:l?l.end:'09:30',t:'',r:l?l.r:''}); draw(); box.lastElementChild&&box.lastElementChild.querySelector('.jg-t').focus(); }
      else if(e.target.closest('#jg-save')){
        sync();
        const ev=[]; let bad=0;
        data.forEach(r=>{
          if(!r.t.trim()&&!r.date) return;
          const s=new Date(r.date+'T'+(r.start||'')), en=new Date(r.date+'T'+(r.end||''));
          if(!r.t.trim()||isNaN(s)||isNaN(en)||en<=s){ bad++; return; }
          ev.push({s:s.getTime(),e:en.getTime(),t:r.t.trim().slice(0,140),r:(r.r||'').trim().slice(0,60),n:'',ad:0});
        });
        const keepAd=(IDF_PLAN.getPlan()?IDF_PLAN.getPlan().ev:[]).filter(e=>e.ad);
        if(bad&&!confirm(bad+' Zeilen sind unvollständig (Datum, Zeit und Titel nötig) und werden nicht gespeichert. Trotzdem speichern?')) return;
        if(!ev.length&&!keepAd.length){ TOAST.show('Keine gültigen Termine zum Speichern',{type:'info'}); return; }
        const old=IDF_PLAN.getPlan();
        IDF_PLAN.savePlan({name:(old&&old.name)||'Mein Stundenplan',ev:[...ev,...keepAd].sort((a,b)=>a.s-b.s),at:Date.now()});
        m.close(); TOAST.show(ev.length+' Termine gespeichert',{type:'ok'});
      }
    });
    return m;
  }
  // Datum/Zeit/Raum aus erkanntem Text herauslesen (bestmöglich, der Nutzer bessert im Editor nach)
  function parsePlanText(text,now){
    now=now||new Date();
    const out=[]; let cur=null;
    const lines=String(text).split('\n').map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean);
    const dRe=/(\d{1,2})\s?\.\s?(\d{1,2})\s?\.(?:\s?(\d{4}|\d{2}))?/, tRe=/(\d{1,2})\s?[:.]\s?(\d{2})\s?(?:-|–|—|bis)\s?(\d{1,2})\s?[:.]\s?(\d{2})/;
    const year=(d,mo,y)=>{ if(y){ y=+y; return y<100?2000+y:y; } let c=now.getFullYear(); const t=new Date(c,mo-1,d); if(t<new Date(now.getTime()-60*864e5)) c++; return c; };
    lines.forEach((l,i)=>{
      const dm=dRe.exec(l); let line=l;
      if(dm&&+dm[1]>=1&&+dm[1]<=31&&+dm[2]>=1&&+dm[2]<=12){ cur=new Date(year(+dm[1],+dm[2],dm[3]),+dm[2]-1,+dm[1]); line=line.replace(dm[0],' '); }
      const tm=tRe.exec(line); if(!tm) return;
      const sh=+tm[1],sm=+tm[2],eh=+tm[3],em=+tm[4]; if(sh>23||eh>23||sm>59||em>59) return;
      let rest=line.replace(tm[0],' ').replace(/\s+/g,' ').trim(), room='';
      const rm=/(?:Raum|Rm\.?|R\.)\s?([A-Za-z0-9ÄÖÜäöü.\-/]+)/.exec(rest); if(rm){ room=rm[1]; rest=rest.replace(rm[0],' ').trim(); }
      rest=rest.replace(/^[\s\-–—|:,;]+|[\s\-–—|:,;]+$/g,'');
      if(!rest&&lines[i+1]&&!tRe.test(lines[i+1])&&!dRe.test(lines[i+1])) rest=lines[i+1];
      out.push({date:cur?ymd(cur):ymd(now),start:pad(sh)+':'+pad(sm),end:pad(eh)+':'+pad(em),t:rest.slice(0,140),r:room,warn:!cur||!rest});
    });
    return out;
  }
  function planPhoto(){
    const m=modal('Stundenplan aus Foto oder Screenshot','<p class="jg-p">Mach ein gerades, gut lesbares Foto oder einen Screenshot des Plans. Die erkannten Termine kannst du danach im Formular ausbessern.</p><div id="jg-ph"></div><p class="m-note" style="padding:0">'+NOTICE+'</p>');
    ocrPicker($(m.body,'#jg-ph'),text=>{
      const d=parsePlanText(text);
      if(!d.length){ TOAST.show('Es wurden keine Zeiten wie „08:00 - 09:30“ erkannt – bitte Termine von Hand eingeben',{type:'info'}); return; }
      m.close(); planEditor(d); TOAST.show(d.length+' Termine erkannt – bitte prüfen',{type:'info'});
    });
  }

  // ── Ergänzungen auf Lernseiten („+“) ──
  const lessonLike=pc=>!!pc&&!!pc.querySelector('.sec-h,.acc-item,.info-card');
  function para(t){ return String(t||'').split(/\n{2,}/).map(p=>'<p>'+E(p).replace(/\n/g,'<br>')+'</p>').join(''); }
  async function fillImages(root){
    for(const im of root.querySelectorAll('img[data-b]')){ const u=await JG.img.get(im.dataset.b); if(u) im.src=u; else im.remove(); }
  }
  const hash=s=>{ let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36); };
  // Kapitel (a) und Blöcke (b) einer Seite mit stabiler Kennung aus ihrem Text (bleibt bei Umsortieren gleich).
  // Der Inhalt eines gerade geöffneten Kapitels liegt im Lesefenster; bodyOf findet ihn dort.
  const bodyOf=d=>{ const b=$(d,'.acc-body'); if(b) return b; const h=typeof LP!=='undefined'&&LP.held&&LP.held(); return h&&h.d===d?h.body:null; };
  function parts(id,pc){
    const seen={}, out=[];
    const add=(el,kind,txt)=>{
      const b=hash(txt.replace(/\s+/g,' ').trim().slice(0,200)), n=seen[kind+b]=(seen[kind+b]||0)+1;
      out.push({el,kind,kap:b+(n>1?'~'+n:''),key:id+'|'+kind+'|'+b+(n>1?'~'+n:'')});
    };
    const blk=el=>{ if(el.closest('.jg-erg,.jg-e')) return; const t=$(el,'.info-card-title,.def-box-label'); add(el,'b',(t?t.textContent:'')+'|'+el.textContent.slice(0,80)); };
    const chs=[...pc.querySelectorAll('.acc-item')];
    chs.forEach(el=>add(el,'a',($(el,'.acc-title')||el).textContent));
    pc.querySelectorAll('.info-card,.def-box').forEach(el=>{ if(!el.closest('.acc-item')) blk(el); });
    chs.forEach(d=>{ const b=bodyOf(d); if(b) b.querySelectorAll('.info-card,.def-box').forEach(blk); });
    return out;
  }
  const chapterKey=(id,d)=>{ const v=document.getElementById(id), p=v&&parts(id,v.querySelector('.pc')).find(x=>x.el===d); return p?p.key:''; };
  const ergHtml=e=>'<div class="m-card jg-e" data-id="'+E(e.id)+'"><div class="jg-eh"><b>'+E(e.titel||'Ergänzung')+'</b><span><button type="button" class="jg-ed" aria-label="Ergänzung bearbeiten">Bearbeiten</button><button type="button" class="jg-dl" aria-label="Ergänzung löschen">Löschen</button></span></div>'+para(e.text)+(e.bild?'<img class="jg-img" data-b="'+E(e.bild)+'" alt="Bild zur Ergänzung">':'')+'</div>';
  let editPage=null;
  function mount(id){
    const v=document.getElementById(id); if(!v) return;
    const pc=v.querySelector('.pc'); if(!lessonLike(pc)) return;
    [pc,...document.querySelectorAll('.lp-win')].forEach(r=>r.querySelectorAll('.jg-ctl,.jg-erg-k').forEach(x=>x.remove()));
    pc.classList.toggle('jg-ed-on',editPage===id);
    const d=JG.data(), gone=new Set(d.ausg), mine=new Set(JG.local().ausg), all=parts(id,pc);
    all.forEach(p=>p.el.classList.toggle('jg-gone',gone.has(p.key)));
    const ed=editPage===id, ks=new Map(all.filter(p=>p.kind==='a'&&!gone.has(p.key)).map(p=>[p.kap,p]));
    // Ergänzungen: in ihrem Kapitel, sonst unten auf der Seite
    const items=d.erg.filter(e=>e.seite===id).sort((a,b)=>a.ts-b.ts), rest=items.filter(e=>!(e.kap&&ks.has(e.kap)));
    ks.forEach((p,kap)=>{
      const body=bodyOf(p.el); if(!body) return;
      const own=items.filter(e=>e.kap===kap);
      if(own.length){ const w=document.createElement('div'); w.className='jg-erg-k'; w.innerHTML=own.map(ergHtml).join(''); body.appendChild(w); }
      if(ed){ const b=document.createElement('button'); b.type='button'; b.className='jg-plus jg-ctl jg-in'; b.dataset.kap=kap; b.innerHTML='<span>+</span> Ergänzung in diesem Kapitel'; body.appendChild(b); }
    });
    if(ed) all.forEach(p=>{
      if(gone.has(p.key)) return;
      const b=document.createElement('button'); b.type='button'; b.className='jg-ctl '+(p.kind==='a'?'jg-cx':'jg-bx'); b.dataset.key=p.key;
      b.setAttribute('aria-label',p.kind==='a'?'Kapitel löschen':'Block löschen'); b.textContent='✕';
      if(p.kind==='a'){ const s=$(p.el,'summary'); if(s) s.insertBefore(b,$(s,'.acc-arrow')); } else p.el.insertBefore(b,p.el.firstChild);
    });
    let box=pc.querySelector(':scope > .jg-erg');
    if(!box){ box=document.createElement('div'); box.className='jg-erg'; pc.appendChild(box); }
    box.innerHTML=(rest.length?'<div class="m-sec">Eigene Ergänzungen</div>':'')+rest.map(ergHtml).join('')
      +'<button type="button" class="jg-plus" aria-label="Eigene Ergänzung hinzufügen"><span>+</span> Eigene Ergänzung</button>';
    const n=all.filter(p=>mine.has(p.key)).length;
    const bar=document.createElement('div'); bar.className='jg-bar jg-ctl';
    bar.innerHTML='<button type="button" class="btn btn-ghost jg-be">'+(ed?'Fertig':'Seite bearbeiten')+'</button>'+(n?'<button type="button" class="btn btn-ghost jg-br">'+n+' gelöschte wiederherstellen</button>':'');
    pc.insertBefore(bar,pc.firstChild);
    fillImages(pc);
    if(typeof LP!=='undefined'&&LP.refresh) LP.refresh(id);
  }
  function delPart(key){
    const l=JG.local(), prev=JSON.stringify(l);
    if(!l.ausg.includes(key)) l.ausg.push(key);
    JG.saveLocal(l);
    TOAST.show(key.split('|')[1]==='a'?'Kapitel gelöscht':'Block gelöscht',{type:'ok',undo:()=>JG.saveLocal(JSON.parse(prev))});
  }
  function restoreParts(id){
    const l=JG.local(), prev=JSON.stringify(l), n=l.ausg.filter(k=>k.startsWith(id+'|')).length;
    l.ausg=l.ausg.filter(k=>!k.startsWith(id+'|')); JG.saveLocal(l);
    TOAST.show(n+' gelöschte Inhalte sind wieder da',{type:'ok',undo:()=>JG.saveLocal(JSON.parse(prev))});
  }
  document.addEventListener('click',e=>{
    const v=document.querySelector('.view.active'); if(!v||!e.target.closest) return;
    const x=e.target.closest('.jg-cx,.jg-bx');
    if(x){ e.preventDefault(); e.stopPropagation(); delPart(x.dataset.key); return; }
    const inb=e.target.closest('.jg-in'); if(inb){ ergEditor(v.id,null,inb.dataset.kap); return; }
    if(e.target.closest('.jg-be')){ editPage=editPage===v.id?null:v.id; mount(v.id); return; }
    if(e.target.closest('.jg-br')){ restoreParts(v.id); return; }
    if(e.target.closest('.jg-plus')) ergEditor(v.id);
    const c=e.target.closest('.jg-e'); if(!c) return;
    if(e.target.closest('.jg-ed')) ergEditor(v.id,c.dataset.id);
    else if(e.target.closest('.jg-dl')){
      const l=JG.local(), i=l.erg.findIndex(x=>x.id===c.dataset.id);
      if(i<0){ TOAST.show('Diese Ergänzung kommt vom Jahrgang und lässt sich nur in der Jahrgangs-Datei ändern',{type:'info'}); return; }
      const prev=JSON.stringify(l); l.erg.splice(i,1); JG.saveLocal(l);
      TOAST.show('Ergänzung gelöscht',{type:'ok',undo:()=>{ JG.saveLocal(JSON.parse(prev)); }});
    }
  },true);
  function ergEditor(seite,id,kap){
    const cur=id?JG.data().erg.find(e=>e.id===id):null;
    const m=modal(cur?'Ergänzung bearbeiten':'Eigene Ergänzung','<label class="jg-l">Überschrift<input type="text" id="jg-et" class="m-input" maxlength="120" value="'+E(cur?cur.titel:'')+'"></label><label class="jg-l">Text<textarea id="jg-ex" class="m-input" rows="8" maxlength="20000" placeholder="Text eingeben oder aus einem Bild einlesen">'+E(cur?cur.text:'')+'</textarea></label><div class="jg-ocr-w"></div><div id="jg-ep" class="jg-ep"></div><label class="jg-chk"><input type="checkbox" id="jg-keep" checked> Bild zusätzlich anzeigen</label><p class="m-note" style="padding:0;margin:8px 0">'+NOTICE+'</p><button class="btn btn-gold" id="jg-es" type="button">Speichern</button>');
    let imgData=null, imgId=cur&&cur.bild||null;
    const prev=$(m.body,'#jg-ep'), tx=$(m.body,'#jg-ex');
    if(imgId) JG.img.get(imgId).then(u=>{ if(u) prev.innerHTML='<img src="'+u+'" alt="" class="jg-img">'; });
    ocrPicker($(m.body,'.jg-ocr-w'),async(t,f)=>{
      tx.value=(tx.value?tx.value.trim()+'\n\n':'')+t.trim();
      const s=await shrink(f,1280,.7); imgData=s.dataUrl; prev.innerHTML='<img src="'+imgData+'" alt="" class="jg-img">';
    });
    $(m.body,'#jg-es').onclick=async()=>{
      const titel=$(m.body,'#jg-et').value.trim(), text=tx.value.trim();
      if(!titel&&!text&&!imgData&&!imgId){ TOAST.show('Bitte Überschrift, Text oder Bild eingeben',{type:'info'}); return; }
      const keep=$(m.body,'#jg-keep').checked;
      let bild=keep?imgId:null;
      if(imgData&&keep){ bild=JG.newId(); try{ await JG.img.put(bild,imgData); }catch(e){ bild=null; TOAST.show('Das Bild konnte nicht gespeichert werden',{type:'info'}); } }
      const l=JG.local(), item={id:cur?cur.id:JG.newId(),seite,kap:cur?cur.kap:(kap||null),titel,text,bild,ts:cur?cur.ts:Date.now()}, i=l.erg.findIndex(x=>x.id===item.id);
      if(i>=0) l.erg[i]=item; else l.erg.push(item);
      JG.saveLocal(l); m.close(); TOAST.show('Ergänzung gespeichert',{type:'ok'});
    };
  }

  // ── Eigene Prüfungen: Liste, Editor, Übungsmodus ──
  let editing=false;
  const isEditing=()=>editing;
  function toggleEdit(){ editing=!editing; SHELL.renderExam(); }
  function setRel(id){
    const l=JG.local(), n=new Set(JG.data().nrel||[]); if(n.has(id)) n.delete(id); else n.add(id);
    l.nrel=[...n]; JG.saveLocal(l);
  }
  function delExam(id){
    const l=JG.local(), prev=JSON.stringify(l), i=l.pr.hinzu.findIndex(p=>p.id===id);
    if(i>=0) l.pr.hinzu.splice(i,1); else if(!l.pr.weg.includes(id)) l.pr.weg.push(id);
    JG.saveLocal(l);
    TOAST.show('Prüfung entfernt',{type:'ok',undo:()=>JG.saveLocal(JSON.parse(prev))});
  }
  function restoreExams(){
    const l=JG.local(); const prev=JSON.stringify(l);
    l.pr.weg=[]; JG.saveLocal(l);
    TOAST.show('Ausgeblendete Prüfungen sind wieder da',{type:'ok',undo:()=>JG.saveLocal(JSON.parse(prev))});
  }
  const qHtml=(q,i)=>'<div class="jg-q" data-i="'+i+'"><div class="jg-qh"><b>Frage '+(i+1)+'</b><button type="button" class="jg-qd" aria-label="Frage löschen">✕</button></div><textarea class="m-input jg-qt" rows="2" maxlength="600" placeholder="Frage" aria-label="Frage">'+E(q.q)+'</textarea>'
    +[0,1,2,3].map(k=>'<label class="jg-o'+(q.c===k?' on':'')+'"><input type="radio" name="c'+i+'" value="'+k+'"'+(q.c===k?' checked':'')+' aria-label="Richtige Antwort"><input type="text" class="m-input" maxlength="300" placeholder="Antwort '+(k+1)+'" aria-label="Antwort '+(k+1)+'" value="'+E((q.o||[])[k]||'')+'"></label>').join('')
    +'<textarea class="m-input jg-qe" rows="2" maxlength="1200" placeholder="Erklärung (optional)" aria-label="Erklärung">'+E(q.e||'')+'</textarea>'+(q.warn?'<div class="jg-warn">Bitte prüfen: erkannte Frage, Antworten und die richtige Antwort</div>':'')+'</div>';
  function parseQuestions(text){
    const lines=String(text).split('\n').map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean), qs=[]; let q=null, opt=null;
    const optRe=/^[(\[]?([a-eA-E1-5])[).\]:]\s+(.+)$/, qRe=/^(\d{1,3})\s?[.)]\s+(.+)$/;
    const push=()=>{ if(q&&q.o.length>=2) qs.push({q:q.q.trim(),o:q.o.slice(0,4),c:-1,e:'',warn:true}); q=null; opt=null; };
    lines.forEach(l=>{
      const qm=qRe.exec(l), om=optRe.exec(l);
      if(qm&&!(om&&q&&q.o.length&&!/\?$/.test(l))){ push(); q={q:qm[2],o:[]}; return; }
      if(om&&q){ q.o.push(om[2]); opt=q.o.length-1; return; }
      if(!q){ if(/\?$/.test(l)) q={q:l,o:[]}; return; }
      if(opt!==null&&q.o.length) q.o[opt]+=' '+l; else q.q+=' '+l;
    });
    push(); return qs;
  }
  function examEditor(id,preTab){
    const cur=id?JG.data().pr.hinzu.find(p=>p.id===id):null;
    let qs=cur?cur.fragen.map(f=>({...f})):[];
    const m=modal(cur?'Prüfung bearbeiten':'Prüfung hinzufügen','<label class="jg-l">Reiter<select id="jg-tab" class="m-input">'+JG.TABS.map(t=>'<option value="'+t[0]+'"'+((cur?cur.tab:preTab||'idf')===t[0]?' selected':'')+'>'+E(t[1])+'</option>').join('')+'</select></label><label class="jg-l">Name der Prüfung<input type="text" id="jg-pt" class="m-input" maxlength="100" value="'+E(cur?cur.titel:'')+'" placeholder="z. B. Klausur 02/2027"></label><div class="jg-ocr-w"></div><div id="jg-qs"></div><button class="btn btn-ghost" id="jg-qa" type="button">+ Frage</button><p class="m-note" style="padding:0;margin:8px 0">'+NOTICE+'</p><button class="btn btn-gold" id="jg-ps" type="button">Speichern</button>','jg-wide');
    const box=$(m.body,'#jg-qs'), draw=()=>{ box.innerHTML=qs.map(qHtml).join('')||'<div class="cu-empty">Noch keine Fragen – mit „+ Frage“ anfangen oder ein Foto einlesen.</div>'; };
    const sync=()=>{ box.querySelectorAll('.jg-q').forEach(el=>{ const i=+el.dataset.i,q=qs[i]; if(!q) return; q.q=$(el,'.jg-qt').value; q.o=[...el.querySelectorAll('.jg-o input[type=text]')].map(x=>x.value); const r=el.querySelector('input[type=radio]:checked'); q.c=r?+r.value:-1; q.e=$(el,'.jg-qe').value; }); };
    draw();
    ocrPicker($(m.body,'.jg-ocr-w'),t=>{ sync(); const d=parseQuestions(t); if(!d.length){ TOAST.show('Es wurden keine Fragen mit Antworten (a) b) c) …) erkannt – bitte von Hand eingeben',{type:'info'}); return; } qs.push(...d); draw(); TOAST.show(d.length+' Fragen erkannt – bitte prüfen und die richtige Antwort wählen',{type:'info'}); });
    m.body.addEventListener('change',e=>{ if(e.target.matches('input[type=radio]')){ const l=e.target.closest('.jg-q'); l.querySelectorAll('.jg-o').forEach(x=>x.classList.toggle('on',x.contains(e.target))); } });
    m.body.addEventListener('click',e=>{
      if(e.target.closest('#jg-qa')){ sync(); qs.push({q:'',o:['','','',''],c:-1,e:''}); draw(); box.lastElementChild.querySelector('.jg-qt').focus(); }
      else if(e.target.closest('.jg-qd')){ sync(); qs.splice(+e.target.closest('.jg-q').dataset.i,1); draw(); }
      else if(e.target.closest('#jg-ps')){
        sync();
        const titel=$(m.body,'#jg-pt').value.trim(), tab=$(m.body,'#jg-tab').value, fr=[]; let bad=0;
        qs.forEach(q=>{
          const idx=[]; q.o.forEach((o,k)=>{ if(o.trim()) idx.push(k); });
          const opts=idx.map(k=>q.o[k].trim()), c=idx.indexOf(q.c);
          if(!q.q.trim()&&!opts.length) return;
          if(!q.q.trim()||opts.length<2||c<0){ bad++; return; }
          fr.push({q:q.q.trim(),o:opts,c,e:(q.e||'').trim()});
        });
        if(!titel){ TOAST.show('Bitte der Prüfung einen Namen geben',{type:'info'}); return; }
        if(bad){ TOAST.show(bad+' Fragen sind unvollständig: Frage, mindestens 2 Antworten und die richtige Antwort wählen',{type:'info'}); return; }
        if(!fr.length){ TOAST.show('Bitte mindestens eine Frage eingeben',{type:'info'}); return; }
        const l=JG.local(), item={id:cur?cur.id:JG.newId(),tab,titel,fragen:fr,ts:cur?cur.ts:Date.now()}, i=l.pr.hinzu.findIndex(p=>p.id===item.id);
        if(i>=0) l.pr.hinzu[i]=item; else l.pr.hinzu.push(item);
        JG.saveLocal(l); m.close(); TOAST.show('Prüfung gespeichert',{type:'ok'});
      }
    });
  }
  // Übungsmodus für eine eigene Prüfung
  let P=null;
  function openExam(id){
    const p=JG.data().pr.hinzu.find(x=>x.id===id); if(!p) return;
    P={p,i:0,res:[],ans:null}; NAV.go('v-jg-pruefung',p.titel); drawExam();
  }
  function drawExam(){
    const el=document.getElementById('jg-pruefung-body'); if(!el||!P) return;
    const {p}=P, n=p.fragen.length;
    const eb=document.querySelector('#v-jg-pruefung .page-eyebrow'), tt=document.querySelector('#v-jg-pruefung .page-title');
    if(eb) eb.textContent=(JG.TABS.find(t=>t[0]===p.tab)||[])[1]||'Eigene Prüfung'; if(tt) tt.textContent=p.titel;
    if(P.i>=n){
      const ok=P.res.filter(r=>r.ok).length, wrong=P.res.filter(r=>!r.ok);
      el.innerHTML='<div class="m-card"><div class="m-t1">'+ok+' von '+n+' richtig</div><div class="m-bar" style="margin:10px 0"><i style="width:'+Math.round(ok/n*100)+'%"></i></div>'
        +(wrong.length?'<div class="m-t2">Zum Nacharbeiten:</div>'+wrong.map(r=>'<div class="jg-wr"><b>'+E(r.q.q)+'</b><div>Richtig: '+E(r.q.o[r.q.c])+'</div>'+(r.q.e?'<div class="m-t2">'+E(r.q.e)+'</div>':'')+'</div>').join(''):'<div class="m-t2">Alles richtig!</div>')
        +'<button class="btn btn-gold" id="jg-again" type="button" style="margin-top:12px">Nochmal</button></div>';
      $(el,'#jg-again').onclick=()=>{ P.i=0; P.res=[]; P.ans=null; drawExam(); }; return;
    }
    const q=p.fragen[P.i], done=P.ans!==null;
    el.innerHTML='<div class="m-card"><div class="m-t2">Frage '+(P.i+1)+' von '+n+'</div><div class="m-bar" style="margin:8px 0 12px"><i style="width:'+Math.round(P.i/n*100)+'%"></i></div><div class="m-t1" style="white-space:pre-wrap">'+E(q.q)+'</div>'
      +'<div class="jg-opts">'+q.o.map((o,k)=>'<button type="button" class="jg-opt'+(done?(k===q.c?' ok':k===P.ans?' bad':''):'')+'" data-k="'+k+'"'+(done?' disabled':'')+'>'+E(o)+'</button>').join('')+'</div>'
      +(done?'<div class="'+(P.ans===q.c?'jg-fb ok':'jg-fb bad')+'">'+(P.ans===q.c?'Richtig.':'Falsch – richtig ist: '+E(q.o[q.c]))+(q.e?'<div class="m-t2">'+E(q.e)+'</div>':'')+'</div><button class="btn btn-gold" id="jg-next" type="button">'+(P.i+1>=n?'Ergebnis':'Weiter')+'</button>':'')+'</div>';
    el.querySelectorAll('.jg-opt').forEach(b=>b.onclick=()=>{ P.ans=+b.dataset.k; P.res.push({q,ok:P.ans===q.c}); A11Y.say(P.ans===q.c?'Richtig.':'Falsch.'); drawExam(); });
    const nx=$(el,'#jg-next'); if(nx) nx.onclick=()=>{ P.i++; P.ans=null; drawExam(); nx.blur(); };
  }

  // Bei Änderungen am Jahrgang alles Betroffene neu zeichnen
  JG.on(()=>{
    settings();
    const a=document.querySelector('.view.active'); if(a) mount(a.id);
    if(a&&a.id==='v-pruefung') SHELL.renderExam();
    if(typeof SHELL!=='undefined') SHELL.syncSettings&&SHELL.syncSettings();
  });
  settings();
  JG.load();

  return { settings, mount, chapterKey, closeTop, planEditor, planPhoto, parsePlanText, parseQuestions, ocr, isEditing, toggleEdit, setRel, delExam, restoreExams,
    examEditor, openExam, notice:NOTICE };
})();
