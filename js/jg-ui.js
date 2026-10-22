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
    root.innerHTML=(master?'':'<div class="m-list m-glow"><button class="m-row m-go" id="jg-help"><span class="m-tx"><span class="m-t1">So funktioniert dein Jahrgang</span><span class="m-t2">Warum es die Seite gibt und wie du sie nutzt</span></span></button></div>')+'<div class="m-list"><div class="m-row m-static m-wrap"><span class="m-tx"><span class="m-t1">Mein Jahrgang</span><span class="m-t2">'+(master?'Der Master: alle Inhalte der App':'Kopie des Masters mit eigenen Änderungen – neue Inhalte und Verbesserungen vom Master kommen automatisch')+'</span></span><select id="jg-sel" class="m-input" aria-label="Jahrgang">'+opts+'</select></div>'
      +(master?'':'<button class="m-row m-go" id="jg-setup"><span class="m-tx"><span class="m-t1">Jahrgang einrichten</span><span class="m-t2">Checkliste: Stundenpläne, Link, Standorte, Lernkarten</span></span></button><button class="m-row" id="jg-exp"><span class="m-tx"><span class="m-t1">Jahrgang exportieren</span><span class="m-t2">Eine Datei mit allen Änderungen deines Jahrgangs, zum Weitergeben per WhatsApp</span></span></button>'
      +'<label class="m-row" for="jg-imp" style="cursor:pointer"><span class="m-tx"><span class="m-t1">Jahrgang importieren</span><span class="m-t2">Eine Datei von jemandem aus deinem Jahrgang oder vom Jahrgang davor</span></span><input type="file" id="jg-imp" accept=".json,application/json" hidden></label>'
      +(loc?'<button class="m-row" id="jg-dis"><span class="m-tx"><span class="m-t1">Meine Änderungen verwerfen</span><span class="m-t2">Zurück zum Stand des Masters (mit Rückgängig)</span></span></button>':''))
      +'</div>'+(master?'':'<p class="m-note" style="padding:0 4px">'+NOTICE+'</p>');
    $(root,'#jg-sel').onchange=e=>{ JG.set(e.target.value); };
    if(!master){
      $(root,'#jg-help').onclick=()=>help(false);
      $(root,'#jg-setup').onclick=checklist;
      $(root,'#jg-exp').onclick=exportFile;
      $(root,'#jg-imp').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(f) importFile(f); };
    }
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
  // Datei einlesen: erst ansehen und nachfragen (Jahrgang der Datei, Ergänzen oder Stand ersetzen)
  function importFile(file){
    const r=new FileReader();
    r.onload=()=>{
      const text=String(r.result), info=JG.peek(text);
      if(!info){ TOAST.show('Das ist keine Änderungsdatei dieser App',{type:'info'}); return; }
      const mine=JG.labelOf(JG.current()), other=info.label&&info.label!==mine;
      const parts=[]; if(info.erg) parts.push(info.erg+' Ergänzungen/Kapitel'); if(info.pruefungen) parts.push(info.pruefungen+' Prüfungen'); if(info.plan) parts.push(info.plan+' Pläne'); if(info.reiter) parts.push(info.reiter+' Reiter'); if(info.karten) parts.push(info.karten+' Lernkarten');
      const m=modal('Jahrgang importieren','<p class="jg-p">Die Datei stammt aus <b>'+E(info.label||'einem Jahrgang')+'</b>'+(parts.length?' und enthält '+E(parts.join(', '))+'.':'.')+' Du bist in <b>'+E(mine)+'</b>.</p>'
        +(other?'<p class="jg-warn" style="margin:8px 0">Die Datei gehört zu einem anderen Jahrgang. Du kannst sie trotzdem importieren, zum Beispiel um von einem früheren Stand zu starten.</p>':'')
        +'<label class="jg-chk" style="display:block;margin:10px 0"><input type="radio" name="jg-mode" value="add" checked> <b>Ergänzen</b> (empfohlen)<span class="m-t2" style="display:block;margin-left:24px">Fügt hinzu und ändert, was in der Datei steht. Eigenes, das nicht in der Datei steht, bleibt erhalten. Gelöschtes aus der Datei kommt dadurch nicht wieder weg.</span></label>'
        +'<label class="jg-chk" style="display:block;margin:10px 0"><input type="radio" name="jg-mode" value="replace"> <b>Stand ersetzen</b><span class="m-t2" style="display:block;margin-left:24px">Dein Jahrgang wird genau wie die Datei: auch Gelöschtes und Eigenes, das nicht in der Datei steht, verschwindet. Mit Rückgängig.</span></label>'
        +'<button class="btn btn-gold" id="jg-imp-go" type="button" style="margin-top:8px">Importieren</button>');
      $(m.body,'#jg-imp-go').onclick=async()=>{
        const mode=m.body.querySelector('input[name=jg-mode]:checked').value, prev=JG.snapshot();
        try{
          const n=await JG.importJson(text,mode); m.close();
          const done=[]; if(n.erg) done.push(n.erg+' Ergänzungen'); if(n.pruefungen) done.push(n.pruefungen+' Prüfungen'); if(n.plan) done.push('Plan mit '+n.plan+' Terminen');
          TOAST.show((mode==='replace'?'Stand ersetzt: ':'Importiert: ')+(done.join(', ')||'keine neuen Inhalte'),{type:'ok',undo:()=>JG.restore(prev)});
        }catch(e){ m.close(); TOAST.show('Das ist keine Änderungsdatei dieser App',{type:'info'}); }
      };
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
  const lessonLike=pc=>!!pc&&!!pc.querySelector('.sec-h,.acc-item,.info-card,.acc-list');
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
    const chs=[...pc.querySelectorAll('.acc-item:not(.jg-kap)')];
    chs.forEach(el=>add(el,'a',($(el,'.acc-title')||el).textContent));
    pc.querySelectorAll('.info-card,.def-box').forEach(el=>{ if(!el.closest('.acc-item')) blk(el); });
    chs.forEach(d=>{ const b=bodyOf(d); if(b) b.querySelectorAll('.info-card,.def-box').forEach(blk); });
    return out;
  }
  const chapterKey=(vid,d)=>{ if(d.classList.contains('jg-kap')) return ''; const v=document.getElementById(vid), p=v&&parts(v.dataset.jg||vid,v.querySelector('.pc')).find(x=>x.el===d); return p?p.key:''; };
  const btns=ed=>ed?'<span><button type="button" class="jg-ed" aria-label="Ergänzung bearbeiten">Bearbeiten</button><button type="button" class="jg-dl" aria-label="Ergänzung löschen">Löschen</button></span>':'';
  const ergHtml=(e,ed)=>'<div class="m-card jg-e" data-id="'+E(e.id)+'"><div class="jg-eh"><b>'+E(e.titel||'Ergänzung')+'</b>'+btns(ed)+'</div>'+para(e.text)+(e.bild?'<img class="jg-img" data-b="'+E(e.bild)+'" alt="Bild zur Ergänzung">':'')+'</div>';
  // Eigenes Kapitel: erscheint wie ein mitgeliefertes Kapitel in der Gliederung
  function kapEl(e,n,ed){
    const det=document.createElement('details'); det.className='acc-item jg-kap';
    det.innerHTML='<summary><span class="acc-num">'+String(n).padStart(2,'0')+'</span><span class="acc-title">'+E(e.titel)+'</span><span class="acc-arrow">›</span></summary><div class="acc-body"><div class="jg-e jg-ek" data-id="'+E(e.id)+'">'+(ed?'<div class="jg-eh"><b></b>'+btns(true)+'</div>':'')+para(e.text)+(e.bild?'<img class="jg-img" data-b="'+E(e.bild)+'" alt="Bild zum Kapitel">':'')+'</div></div>';
    return det;
  }
  // Logische Seiten-ID: eigene Reiter nutzen eine gemeinsame Ansicht mit wechselnder Kennung
  const pageOf=v=>v.dataset.jg||v.id;
  let editPage=null;
  const ADD='<button type="button" class="jg-plus jg-add" data-k="';
  const RT_ICON='<svg class="tc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M8 8h6M8 12h6"/></svg>';
  function mount(vid){
    const v=document.getElementById(vid); if(!v||v.hasAttribute('data-nojg')) return;
    const pc=v.querySelector('.pc'); if(!pc) return;
    const id=pageOf(v);
    [pc,...document.querySelectorAll('.lp-win')].forEach(r=>r.querySelectorAll('.jg-ctl,.jg-erg-k,.jg-kap,.jg-qbox,.jg-erg,.jg-rt').forEach(x=>x.remove()));
    const master=JG.isMaster(), isEx=!!JG.examOf(id);
    const tiles=[...pc.querySelectorAll('.topic-card,.glass-tile')];
    const hub=tiles.length>=2&&!pc.querySelector('.acc-item');
    const lesson=!hub&&lessonLike(pc);
    if(master||(!lesson&&!isEx&&!hub)){ if(master) editPage=null; pc.classList.remove('jg-ed-on'); if(typeof LP!=='undefined'&&LP.refresh) LP.refresh(vid); return; }
    const ed=editPage===vid; pc.classList.toggle('jg-ed-on',ed);
    const d=JG.data(), gone=new Set(d.ausg), mine=new Set(JG.local().ausg);
    let all=[];
    if(hub){
      // Übersichtsseite: Reiter ausblenden und eigene Reiter anlegen
      const grid=tiles[0].parentNode, cls=tiles[0].className.split(/\s+/)[0];
      d.reiter.filter(r=>r.seite===id).sort((a,b)=>a.ts-b.ts).forEach(r=>{
        const t=document.createElement('div'); t.className=cls+' jg-rt'; t.dataset.r=r.id;
        t.innerHTML=cls==='glass-tile'?RT_ICON.replace('tc-icon','tile-icon')+'<div class="tile-name">'+E(r.titel)+'</div><div class="tile-desc">'+E(r.beschr||'Eigener Reiter')+'</div>':RT_ICON+'<div class="tc-name">'+E(r.titel)+'</div><div class="tc-sub">'+E(r.beschr||'Eigener Reiter')+'</div>';
        grid.appendChild(t);
      });
      [...pc.querySelectorAll('.topic-card,.glass-tile')].filter(t=>!t.classList.contains('jg-rt')).forEach(el=>{
        const n=$(el,'.tc-name,.tile-name'), b=hash((n?n.textContent:el.textContent).replace(/\s+/g,' ').trim().slice(0,200));
        all.push({el,kind:'t',key:id+'|t|'+b});
      });
      all.forEach(p=>p.el.classList.toggle('jg-gone',gone.has(p.key)));
      if(ed){
        all.forEach(p=>{ if(gone.has(p.key)) return; const b=document.createElement('button'); b.type='button'; b.className='jg-ctl jg-bx jg-tx'; b.dataset.key=p.key; b.setAttribute('aria-label','Reiter löschen'); b.textContent='✕'; p.el.insertBefore(b,p.el.firstChild); });
        pc.querySelectorAll('.jg-rt').forEach(t=>{ const b=document.createElement('button'); b.type='button'; b.className='jg-ctl jg-bx jg-tx jg-rx'; b.dataset.r=t.dataset.r; b.setAttribute('aria-label','Reiter löschen'); b.textContent='✕'; t.insertBefore(b,t.firstChild); });
        const box=document.createElement('div'); box.className='jg-erg'; box.innerHTML=ADD+'reiter"><span>+</span> Eigener Reiter</button><div class="m-note">Tippe einen eigenen Reiter an, um ihn zu bearbeiten. Mit ✕ blendest du Reiter aus.</div>'; pc.appendChild(box);
      }
    } else {
      const list=pc.querySelector('.acc-list:not(.acc-cards)');
      const kaps=d.erg.filter(e=>e.seite===id&&e.typ==='kapitel').sort((a,b)=>a.ts-b.ts);
      if(list) kaps.forEach(e=>list.appendChild(kapEl(e,list.querySelectorAll(':scope > .acc-item').length+1,ed)));
      all=parts(id,pc);
      all.forEach(p=>p.el.classList.toggle('jg-gone',gone.has(p.key)));
      const ks=new Map(all.filter(p=>p.kind==='a'&&!gone.has(p.key)).map(p=>[p.kap,p]));
      // Ergänzungen: in ihrem Kapitel, sonst unten auf der Seite
      const items=d.erg.filter(e=>e.seite===id&&e.typ!=='kapitel').sort((a,b)=>a.ts-b.ts), rest=items.filter(e=>!(e.kap&&ks.has(e.kap)));
      ks.forEach((p,kap)=>{
        const body=bodyOf(p.el); if(!body) return;
        const own=items.filter(e=>e.kap===kap);
        if(own.length){ const w=document.createElement('div'); w.className='jg-erg-k'; w.innerHTML=own.map(e=>ergHtml(e,ed)).join(''); body.appendChild(w); }
        if(ed&&!isEx){ const b=document.createElement('button'); b.type='button'; b.className='jg-plus jg-ctl jg-in'; b.dataset.kap=kap; b.innerHTML='<span>+</span> Ergänzung in diesem Kapitel'; body.appendChild(b); }
      });
      if(ed) all.forEach(p=>{
        if(gone.has(p.key)) return;
        const b=document.createElement('button'); b.type='button'; b.className='jg-ctl '+(p.kind==='a'?'jg-cx':'jg-bx'); b.dataset.key=p.key;
        b.setAttribute('aria-label',p.kind==='a'?'Kapitel löschen':'Block löschen'); b.textContent='✕';
        if(p.kind==='a'){ const s=$(p.el,'summary'); if(s) s.insertBefore(b,$(s,'.acc-arrow')); } else p.el.insertBefore(b,p.el.firstChild);
      });
      // Seite unten: bestehende Ergänzungen und (nur im Bearbeiten-Modus) „Eigenes Kapitel“
      const addKap=ed&&lesson&&!isEx&&!!list;
      if(rest.length||addKap){
        const box=document.createElement('div'); box.className='jg-erg';
        box.innerHTML=(rest.length?'<div class="m-sec">Eigene Ergänzungen</div>':'')+rest.map(e=>ergHtml(e,ed)).join('')+(addKap?ADD+'kap"><span>+</span> Eigenes Kapitel</button>':'');
        pc.appendChild(box);
      }
      // Eigene Fragen auf einer Prüfungsseite
      if(isEx){
        const p=d.pr.hinzu.find(x=>x.seite===id);
        if(p||ed){
          const q=document.createElement('div'); q.className='jg-qbox';
          q.innerHTML='<div class="m-sec">Eigene Fragen</div>'+(p
            ?'<div class="m-card"><div class="m-t1">'+p.fragen.length+' eigene '+(p.fragen.length===1?'Frage':'Fragen')+'</div><div class="m-t2">'+E(p.fragen.slice(0,3).map(f=>f.q).join(' · ').slice(0,160))+'</div><div class="jg-tools2" style="margin-top:10px"><button type="button" class="btn btn-gold jg-qpl" data-p="'+p.id+'">Üben</button>'+(ed?'<button type="button" class="btn btn-ghost jg-qed" data-p="'+p.id+'">Bearbeiten oder entfernen</button>':'')+'</div></div>':'')
            +(ed&&!p?ADD+'frage"><span>+</span> Eigene Frage hinzufügen</button>':'');
          pc.appendChild(q);
        }
      }
    }
    const n=all.filter(p=>mine.has(p.key)).length;
    const bar=document.createElement('div'); bar.className='jg-bar jg-ctl';
    bar.innerHTML='<button type="button" class="btn btn-ghost jg-be">'+(ed?'Fertig':'Seite bearbeiten')+'</button>'+(n?'<button type="button" class="btn btn-ghost jg-br">'+n+' gelöschte wiederherstellen</button>':'');
    pc.insertBefore(bar,pc.firstChild);
    fillImages(pc);
    if(typeof LP!=='undefined'&&LP.refresh) LP.refresh(vid);
  }
  // Ausgeblendete Elemente einer Seite (für die Suche, ohne die Seite zu verändern)
  function goneEls(vid){
    const v=document.getElementById(vid); if(!v||JG.isMaster()) return [];
    const pc=v.querySelector('.pc'); if(!pc) return [];
    const id=v.dataset.jg||vid, gone=new Set(JG.data().ausg.filter(k=>k.startsWith(id+'|')));
    if(!gone.size) return [];
    const tiles=[...pc.querySelectorAll('.topic-card,.glass-tile')];
    if(tiles.length>=2&&!pc.querySelector('.acc-item'))
      return tiles.filter(el=>{ const n=$(el,'.tc-name,.tile-name'); return gone.has(id+'|t|'+hash((n?n.textContent:el.textContent).replace(/\s+/g,' ').trim().slice(0,200))); });
    return parts(id,pc).filter(p=>gone.has(p.key)).map(p=>p.el);
  }
  function delPart(key){
    const l=JG.local(), prev=JSON.stringify(l);
    if(!l.ausg.includes(key)) l.ausg.push(key);
    JG.saveLocal(l);
    TOAST.show(({a:'Kapitel',b:'Block',t:'Reiter'})[key.split('|')[1]]+' gelöscht',{type:'ok',undo:()=>JG.saveLocal(JSON.parse(prev))});
  }
  function restoreParts(id){
    const l=JG.local(), prev=JSON.stringify(l), n=l.ausg.filter(k=>k.startsWith(id+'|')).length;
    l.ausg=l.ausg.filter(k=>!k.startsWith(id+'|')); JG.saveLocal(l);
    TOAST.show(n+' gelöschte Inhalte sind wieder da',{type:'ok',undo:()=>JG.saveLocal(JSON.parse(prev))});
  }
  // Eigener Reiter: anlegen/bearbeiten, löschen, öffnen
  function reiterEditor(seite,id){
    const cur=id?JG.data().reiter.find(r=>r.id===id):null;
    const m=modal(cur?'Reiter bearbeiten':'Eigener Reiter','<label class="jg-l">Name<input type="text" id="jg-rn" class="m-input" maxlength="60" value="'+E(cur?cur.titel:'')+'"></label><label class="jg-l">Kurzbeschreibung (freiwillig)<input type="text" id="jg-rb" class="m-input" maxlength="140" value="'+E(cur?cur.beschr:'')+'"></label><p class="m-note" style="padding:0;margin:8px 0">Den Inhalt füllst du danach auf der Seite des Reiters mit „Seite bearbeiten“ und „Eigenes Kapitel“.</p><button class="btn btn-gold" id="jg-rs" type="button">Speichern</button>');
    $(m.body,'#jg-rs').onclick=()=>{
      const titel=$(m.body,'#jg-rn').value.trim(); if(!titel){ TOAST.show('Bitte dem Reiter einen Namen geben',{type:'info'}); return; }
      const l=JG.local(), it={id:cur?cur.id:JG.newId(),seite:cur?cur.seite:seite,titel,beschr:$(m.body,'#jg-rb').value.trim(),ts:cur?cur.ts:Date.now()}, i=l.reiter.findIndex(r=>r.id===it.id);
      if(i>=0) l.reiter[i]=it; else l.reiter.push(it);
      JG.saveLocal(l); m.close(); TOAST.show('Reiter gespeichert',{type:'ok'});
    };
  }
  function delReiter(id){
    const l=JG.local(), prev=JSON.stringify(l), pid='v-r-'+id;
    l.reiter=l.reiter.filter(r=>r.id!==id); l.erg=l.erg.filter(e=>e.seite!==pid);
    JG.saveLocal(l); TOAST.show('Reiter gelöscht',{type:'ok',undo:()=>JG.saveLocal(JSON.parse(prev))});
  }
  function openReiter(id){
    const r=JG.data().reiter.find(x=>x.id===id), v=document.getElementById('v-jg-reiter'); if(!r||!v) return;
    v.dataset.jg='v-r-'+id; editPage=null;
    const eb=$(v,'.page-eyebrow'), tt=$(v,'.page-title'), ld=$(v,'.page-lead');
    if(eb) eb.textContent='Eigener Reiter'; if(tt) tt.textContent=r.titel; if(ld) ld.textContent=r.beschr||'Eigene Kapitel für diesen Reiter.';
    NAV.go('v-jg-reiter',r.titel);
  }
  document.addEventListener('click',e=>{
    const v=document.querySelector('.view.active'); if(!v||!e.target.closest) return;
    const pid=pageOf(v);
    const x=e.target.closest('.jg-cx,.jg-bx');
    if(x){ e.preventDefault(); e.stopPropagation(); if(x.dataset.r) delReiter(x.dataset.r); else if(x.dataset.key) delPart(x.dataset.key); return; }
    const tile=e.target.closest('.topic-card,.glass-tile');
    if(tile&&v.querySelector('.pc.jg-ed-on')){   // im Bearbeiten-Modus öffnen Reiter nicht, eigene lassen sich bearbeiten
      e.preventDefault(); e.stopPropagation(); if(tile.dataset.r) reiterEditor(null,tile.dataset.r); return;
    }
    const rt=e.target.closest('.jg-rt'); if(rt){ e.preventDefault(); e.stopPropagation(); openReiter(rt.dataset.r); return; }
    const inb=e.target.closest('.jg-in'); if(inb){ ergEditor(pid,null,inb.dataset.kap); return; }
    if(e.target.closest('.jg-be')){ editPage=editPage===v.id?null:v.id; mount(v.id); return; }
    if(e.target.closest('.jg-br')){ restoreParts(pid); return; }
    const ad=e.target.closest('.jg-add');
    if(ad){ const k=ad.dataset.k; if(k==='frage') examEditor(null,null,pid); else if(k==='reiter') reiterEditor(pid); else ergEditor(pid,null,null,'kapitel'); return; }
    const qp=e.target.closest('.jg-qpl'); if(qp){ openExam(qp.dataset.p); return; }
    const qe=e.target.closest('.jg-qed'); if(qe){ examEditor(qe.dataset.p,null,pid); return; }
    const c=e.target.closest('.jg-e'); if(!c) return;
    if(e.target.closest('.jg-ed')) ergEditor(pid,c.dataset.id);
    else if(e.target.closest('.jg-dl')){
      const l=JG.local(), i=l.erg.findIndex(x=>x.id===c.dataset.id);
      if(i<0){ TOAST.show('Dieser Inhalt kommt vom Jahrgang und lässt sich nur in der Jahrgangs-Datei ändern',{type:'info'}); return; }
      const prev=JSON.stringify(l); l.erg.splice(i,1); JG.saveLocal(l);
      TOAST.show('Gelöscht',{type:'ok',undo:()=>{ JG.saveLocal(JSON.parse(prev)); }});
    }
  },true);
  // Ergänzung in einem Kapitel (nur Text und Bild) oder ganzes eigenes Kapitel
  function ergEditor(seite,id,kap,mode){
    const cur=id?JG.data().erg.find(e=>e.id===id):null;
    const typ=cur?(cur.typ==='kapitel'?'kapitel':'text'):(mode==='kapitel'?'kapitel':'text'), isKap=typ==='kapitel';
    const html='<label class="jg-l">'+(isKap?'Titel des Kapitels':'Überschrift')+'<input type="text" id="jg-et" class="m-input" maxlength="120" value="'+E(cur?cur.titel:'')+'"></label>'
      +'<label class="jg-l">Text<textarea id="jg-ex" class="m-input" rows="8" maxlength="20000" placeholder="Text eingeben oder aus einem Bild einlesen">'+E(cur?cur.text:'')+'</textarea></label><div class="jg-ocr-w"></div><div id="jg-ep" class="jg-ep"></div>'
      +'<p class="m-note" style="padding:0;margin:8px 0">'+NOTICE+'</p><button class="btn btn-gold" id="jg-es" type="button">Speichern</button>';
    const m=modal(cur?(isKap?'Kapitel bearbeiten':'Ergänzung bearbeiten'):(isKap?'Eigenes Kapitel':'Ergänzung in diesem Kapitel'),html);
    let imgData=null, imgId=cur&&cur.bild||null;
    const prev=$(m.body,'#jg-ep'), tx=$(m.body,'#jg-ex');
    if(imgId) JG.img.get(imgId).then(u=>{ if(u) prev.innerHTML='<img src="'+u+'" alt="" class="jg-img">'; });
    ocrPicker($(m.body,'.jg-ocr-w'),async(t,f)=>{
      tx.value=(tx.value?tx.value.trim()+'\n\n':'')+t.trim();
      const s=await shrink(f,1280,.7); imgData=s.dataUrl; prev.innerHTML='<img src="'+imgData+'" alt="" class="jg-img">';
    });
    $(m.body,'#jg-es').onclick=async()=>{
      const titel=$(m.body,'#jg-et').value.trim(), text=tx.value.trim();
      if(isKap&&!titel){ TOAST.show('Bitte dem Kapitel einen Titel geben',{type:'info'}); return; }
      if(!titel&&!text&&!imgData&&!imgId){ TOAST.show('Bitte Überschrift, Text oder Bild eingeben',{type:'info'}); return; }
      let bild=imgId;
      if(imgData){ bild=JG.newId(); try{ await JG.img.put(bild,imgData); }catch(e){ bild=null; TOAST.show('Das Bild konnte nicht gespeichert werden',{type:'info'}); } }
      const item={id:cur?cur.id:JG.newId(),seite,typ,kap:isKap?null:(cur?cur.kap:(kap||null)),titel,text,bild,ts:cur?cur.ts:Date.now()};
      const l=JG.local(), i=l.erg.findIndex(x=>x.id===item.id);
      if(i>=0) l.erg[i]=item; else l.erg.push(item);
      JG.saveLocal(l); m.close(); TOAST.show(isKap?'Kapitel gespeichert':'Ergänzung gespeichert',{type:'ok'});
    };
  }

  // ── Eigene Prüfungen: Liste, Editor, Übungsmodus ──
  let editing=false;
  const isEditing=()=>editing;
  function toggleEdit(){ editing=!editing; SHELL.renderExam(); }
  function setRel(id){
    if(JG.isMaster()) return;
    const l=JG.local(); l.rel[id]=!JG.rel(id); JG.saveLocal(l);
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
  const QT=[['sc','Single-Choice'],['mc','Multiple-Choice'],['text','Freitext']];
  const isOn=(q,k)=>q.typ==='mc'?(Array.isArray(q.c)&&q.c.includes(k)):q.c===k;
  const qHtml=(q,i)=>{
    const t=q.typ||'sc';
    return '<div class="jg-q" data-i="'+i+'"><div class="jg-qh"><b>Frage '+(i+1)+'</b><button type="button" class="jg-qd" aria-label="Frage löschen">✕</button></div>'
      +'<div class="m-seg jg-qty" role="group" aria-label="Art der Frage">'+QT.map(([k,l])=>'<button type="button" data-t="'+k+'" class="'+(t===k?'active':'')+'" aria-pressed="'+(t===k)+'">'+l+'</button>').join('')+'</div>'
      +'<textarea class="m-input jg-qt" rows="2" maxlength="600" placeholder="Frage" aria-label="Frage">'+E(q.q)+'</textarea>'
      +(t==='text'
        ?'<textarea class="m-input jg-qa2" rows="3" maxlength="2000" placeholder="Musterlösung" aria-label="Musterlösung">'+E(q.a||'')+'</textarea>'
        :[0,1,2,3].map(k=>'<label class="jg-o'+(isOn(q,k)?' on':'')+'"><input type="'+(t==='mc'?'checkbox':'radio')+'" name="c'+i+'" value="'+k+'"'+(isOn(q,k)?' checked':'')+' aria-label="Richtige Antwort"><input type="text" class="m-input" maxlength="300" placeholder="Antwort '+(k+1)+'" aria-label="Antwort '+(k+1)+'" value="'+E((q.o||[])[k]||'')+'"></label>').join(''))
      +'<textarea class="m-input jg-qe" rows="2" maxlength="1200" placeholder="Erklärung (optional)" aria-label="Erklärung">'+E(q.e||'')+'</textarea>'+(q.warn?'<div class="jg-warn">Bitte prüfen: erkannte Frage, Antworten und die richtige Antwort</div>':'')+'</div>';
  };
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
  function examEditor(id,preTab,seite){
    const cur=id?JG.data().pr.hinzu.find(p=>p.id===id):null;
    seite=seite||(cur&&cur.seite)||null;
    const info=seite?JG.examOf(seite):null;
    let qs=cur?cur.fragen.map(f=>({...f})):[];
    const m=modal(cur?'Prüfung bearbeiten':'Prüfung hinzufügen','<label class="jg-l">Reiter<select id="jg-tab" class="m-input">'+JG.TABS.map(t=>'<option value="'+t[0]+'"'+((cur?cur.tab:preTab||'idf')===t[0]?' selected':'')+'>'+E(t[1])+'</option>').join('')+'</select></label><label class="jg-l">Name der Prüfung<input type="text" id="jg-pt" class="m-input" maxlength="100" value="'+E(cur?cur.titel:'')+'" placeholder="z. B. Klausur 02/2027"></label><div class="jg-ocr-w"></div><div id="jg-qs"></div><button class="btn btn-ghost" id="jg-qa" type="button">+ Frage</button><p class="m-note" style="padding:0;margin:8px 0">'+NOTICE+'</p><button class="btn btn-gold" id="jg-ps" type="button">Speichern</button>','jg-wide');
    if(info){ const t=$(m.body,'#jg-tab'),n=$(m.body,'#jg-pt'); [t,n].forEach(x=>{ if(x&&x.closest('label')) x.closest('label').style.display='none'; }); if(t) t.value=info.tab; if(n) n.value='Eigene Fragen · '+info.titel; }
    const box=$(m.body,'#jg-qs'), draw=()=>{ box.innerHTML=qs.map(qHtml).join('')||'<div class="cu-empty">Noch keine Fragen – mit „+ Frage“ anfangen oder ein Foto einlesen.</div>'; };
    const sync=()=>{ box.querySelectorAll('.jg-q').forEach(el=>{
      const i=+el.dataset.i,q=qs[i]; if(!q) return; q.typ=q.typ||'sc'; q.q=$(el,'.jg-qt').value; q.e=$(el,'.jg-qe').value;
      if(q.typ==='text'){ q.a=$(el,'.jg-qa2').value; return; }
      q.o=[...el.querySelectorAll('.jg-o input[type=text]')].map(x=>x.value);
      const ch=[...el.querySelectorAll('.jg-o input:not([type=text])')].filter(x=>x.checked).map(x=>+x.value);
      q.c=q.typ==='mc'?ch:(ch.length?ch[0]:-1);
    }); };
    draw();
    ocrPicker($(m.body,'.jg-ocr-w'),t=>{ sync(); const d=parseQuestions(t); if(!d.length){ TOAST.show('Es wurden keine Fragen mit Antworten (a) b) c) …) erkannt – bitte von Hand eingeben',{type:'info'}); return; } qs.push(...d); draw(); TOAST.show(d.length+' Fragen erkannt – bitte prüfen und die richtige Antwort wählen',{type:'info'}); });
    m.body.addEventListener('change',e=>{ if(e.target.matches('input[type=radio]')){ const l=e.target.closest('.jg-q'); l.querySelectorAll('.jg-o').forEach(x=>x.classList.toggle('on',x.contains(e.target))); } else if(e.target.matches('input[type=checkbox]')){ e.target.closest('.jg-o').classList.toggle('on',e.target.checked); } });
    m.body.addEventListener('click',e=>{
      const tb=e.target.closest('.jg-qty button');
      if(tb){ sync(); const q=qs[+tb.closest('.jg-q').dataset.i], t=tb.dataset.t, cur0=q.typ||'sc'; if(t!==cur0){ if(t==='mc') q.c=q.c>=0&&typeof q.c==='number'?[q.c]:[]; else if(t==='sc') q.c=Array.isArray(q.c)&&q.c.length?q.c[0]:-1; q.typ=t; } draw(); return; }
      if(e.target.closest('#jg-qa')){ sync(); qs.push({q:'',typ:'sc',o:['','','',''],c:-1,e:''}); draw(); box.lastElementChild.querySelector('.jg-qt').focus(); }
      else if(e.target.closest('.jg-qd')){ sync(); qs.splice(+e.target.closest('.jg-q').dataset.i,1); draw(); }
      else if(e.target.closest('#jg-ps')){
        sync();
        const titel=$(m.body,'#jg-pt').value.trim(), tab=$(m.body,'#jg-tab').value, fr=[]; let bad=0;
        qs.forEach(q=>{
          const typ=q.typ||'sc';
          if(typ==='text'){
            if(!q.q.trim()&&!(q.a||'').trim()) return;
            if(!q.q.trim()||!(q.a||'').trim()){ bad++; return; }
            fr.push({q:q.q.trim(),typ,o:[],c:-1,a:q.a.trim(),e:(q.e||'').trim()}); return;
          }
          const idx=[]; q.o.forEach((o,k)=>{ if(o.trim()) idx.push(k); });
          const opts=idx.map(k=>q.o[k].trim());
          if(!q.q.trim()&&!opts.length) return;
          if(typ==='mc'){
            const cs=(Array.isArray(q.c)?q.c:[]).map(k=>idx.indexOf(k)).filter(k=>k>=0);
            if(!q.q.trim()||opts.length<2||!cs.length){ bad++; return; }
            fr.push({q:q.q.trim(),typ,o:opts,c:cs,a:'',e:(q.e||'').trim()}); return;
          }
          const c=idx.indexOf(q.c);
          if(!q.q.trim()||opts.length<2||c<0){ bad++; return; }
          fr.push({q:q.q.trim(),typ,o:opts,c,a:'',e:(q.e||'').trim()});
        });
        if(!titel){ TOAST.show('Bitte der Prüfung einen Namen geben',{type:'info'}); return; }
        if(bad){ TOAST.show(bad+' Fragen sind unvollständig: Frage und Antwort (bei Auswahlfragen mindestens 2 Antworten und die richtige Antwort) angeben',{type:'info'}); return; }
        if(!fr.length&&!info){ TOAST.show('Bitte mindestens eine Frage eingeben',{type:'info'}); return; }
        const l=JG.local(), item={id:cur?cur.id:JG.newId(),tab:info?info.tab:tab,seite,titel,fragen:fr,ts:cur?cur.ts:Date.now()}, i=l.pr.hinzu.findIndex(p=>p.id===item.id);
        if(!fr.length){ if(i>=0) l.pr.hinzu.splice(i,1); JG.saveLocal(l); m.close(); TOAST.show('Eigene Fragen entfernt',{type:'ok'}); return; }
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
        +(wrong.length?'<div class="m-t2">Zum Nacharbeiten:</div>'+wrong.map(r=>'<div class="jg-wr"><b>'+E(r.q.q)+'</b><div>Richtig: '+E(r.q.typ==='text'?r.q.a:r.q.typ==='mc'?r.q.c.map(k=>r.q.o[k]).join(' · '):r.q.o[r.q.c])+'</div>'+(r.q.e?'<div class="m-t2">'+E(r.q.e)+'</div>':'')+'</div>').join(''):'<div class="m-t2">Alles richtig!</div>')
        +'<button class="btn btn-gold" id="jg-again" type="button" style="margin-top:12px">Nochmal</button></div>';
      $(el,'#jg-again').onclick=()=>{ P.i=0; P.res=[]; P.ans=null; drawExam(); }; return;
    }
    const q=p.fragen[P.i], t=q.typ||'sc', done=P.ans!==null;
    const head='<div class="m-card"><div class="m-t2">Frage '+(P.i+1)+' von '+n+'</div><div class="m-bar" style="margin:8px 0 12px"><i style="width:'+Math.round(P.i/n*100)+'%"></i></div><div class="m-t1" style="white-space:pre-wrap">'+E(q.q)+'</div>';
    const exp=q.e?'<div class="m-t2">'+E(q.e)+'</div>':'', nextBtn='<button class="btn btn-gold" id="jg-next" type="button">'+(P.i+1>=n?'Ergebnis':'Weiter')+'</button>';
    if(t==='text'){
      el.innerHTML=head+(done?'<div class="jg-fb ok"><b>Musterlösung</b><div style="white-space:pre-wrap">'+E(q.a)+'</div>'+exp+'</div><div class="jg-tools2" style="margin-top:10px"><button class="btn btn-gold" id="jg-know" type="button">Gewusst</button><button class="btn btn-ghost" id="jg-nope" type="button">Nicht gewusst</button></div>':'<button class="btn btn-gold" id="jg-show" type="button" style="margin-top:12px">Musterlösung zeigen</button>')+'</div>';
      const sh=$(el,'#jg-show'); if(sh) sh.onclick=()=>{ P.ans=true; drawExam(); };
      const rec=ok=>{ P.res.push({q,ok}); P.i++; P.ans=null; drawExam(); };
      const kn=$(el,'#jg-know'), np=$(el,'#jg-nope'); if(kn) kn.onclick=()=>rec(true); if(np) np.onclick=()=>rec(false);
      return;
    }
    if(t==='mc'){
      const sel=Array.isArray(P.ans)?P.ans:[], good=q.c;
      el.innerHTML=head+'<div class="m-t2">Mehrere Antworten können richtig sein</div><div class="jg-opts">'+q.o.map((o,k)=>'<label class="jg-opt'+(done?(good.includes(k)?' ok':sel.includes(k)?' bad':''):'')+'"><input type="checkbox" value="'+k+'"'+(sel.includes(k)?' checked':'')+(done?' disabled':'')+'> '+E(o)+'</label>').join('')+'</div>'
        +(done?'<div class="'+(sel.length===good.length&&good.every(k=>sel.includes(k))?'jg-fb ok':'jg-fb bad')+'">'+(sel.length===good.length&&good.every(k=>sel.includes(k))?'Richtig.':'Nicht ganz – richtig: '+E(good.map(k=>q.o[k]).join(' · ')))+exp+'</div>'+nextBtn:'<button class="btn btn-gold" id="jg-chk2" type="button" style="margin-top:12px">Antwort prüfen</button>')+'</div>';
      const ck=$(el,'#jg-chk2'); if(ck) ck.onclick=()=>{ const s=[...el.querySelectorAll('input:checked')].map(x=>+x.value); if(!s.length){ TOAST.show('Bitte mindestens eine Antwort wählen',{type:'info'}); return; } P.ans=s; P.res.push({q,ok:s.length===good.length&&good.every(k=>s.includes(k))}); A11Y.say(P.res[P.res.length-1].ok?'Richtig.':'Falsch.'); drawExam(); };
    } else {
      el.innerHTML=head+'<div class="jg-opts">'+q.o.map((o,k)=>'<button type="button" class="jg-opt'+(done?(k===q.c?' ok':k===P.ans?' bad':''):'')+'" data-k="'+k+'"'+(done?' disabled':'')+'>'+E(o)+'</button>').join('')+'</div>'
        +(done?'<div class="'+(P.ans===q.c?'jg-fb ok':'jg-fb bad')+'">'+(P.ans===q.c?'Richtig.':'Falsch – richtig ist: '+E(q.o[q.c]))+exp+'</div>'+nextBtn:'')+'</div>';
      el.querySelectorAll('.jg-opt').forEach(b=>b.onclick=()=>{ P.ans=+b.dataset.k; P.res.push({q,ok:P.ans===q.c}); A11Y.say(P.ans===q.c?'Richtig.':'Falsch.'); drawExam(); });
    }
    const nx=$(el,'#jg-next'); if(nx) nx.onclick=()=>{ P.i++; P.ans=null; drawExam(); nx.blur(); };
  }

  // ── Jahrgang einrichten: Lehrgangs-Link, Standorte, Lernkarten und die Checkliste dazu ──
  const ORT0={ibk:['IBK','Heyrothsberge'],vak:['VAk','Berlin'],feuak:['FeuAK','Hamburg'],idf:['IdF','Münster']};
  function names(){
    const o=JG.data().orte;
    document.querySelectorAll('.page-eyebrow,.tile-name,#m-exam-list .m-sec,.lp-eb').forEach(el=>{
      if(el.children.length) return;
      if(el.dataset.o===undefined) el.dataset.o=/(IBK Heyrothsberge|VAk Berlin|FeuAK Hamburg|IdF Münster)/.test(el.textContent)?el.textContent:'';
      if(!el.dataset.o) return;
      let t=el.dataset.o; Object.keys(ORT0).forEach(k=>{ if(o[k]) t=t.split(ORT0[k][0]+' '+ORT0[k][1]).join(ORT0[k][0]+' '+o[k]); });
      if(el.textContent!==t) el.textContent=t;
    });
  }
  function syncCards(){
    if(typeof FLASHCARD_DATA==='undefined') return;
    for(let i=FLASHCARD_DATA.length-1;i>=0;i--) if(FLASHCARD_DATA[i].jg) FLASHCARD_DATA.splice(i,1);
    const h=t=>E(t).replace(/\n/g,'<br>');
    JG.data().karten.forEach(k=>FLASHCARD_DATA.push({id:'jg'+k.id,cat:k.modul+' · Jahrgang',q:h(k.q),a:h(k.a),jg:true}));
    try{ if(typeof FC!=='undefined') FC.syncFilters(); if(typeof SHELL!=='undefined') SHELL.renderFcSide(); }catch(e){}
  }
  const saveField=(f,v,msg)=>{ const l=JG.local(); f(l,v); JG.saveLocal(l); if(msg) TOAST.show(msg,{type:'ok'}); };

  function linkEditor(){
    const cur=JG.data().links.cloud||{titel:'Lehrgangs-Cloud',url:'',hinweis:''};
    const m=modal('Lehrgangs-Link','<p class="jg-p">Ein Link auf der Startseite, z. B. zur Cloud mit den Unterlagen. Schreib keine Passwörter hinein.</p><label class="jg-l">Titel<input type="text" id="jg-lt" class="m-input" maxlength="60" value="'+E(cur.titel)+'"></label><label class="jg-l">Adresse (https://…)<input type="url" id="jg-lu" class="m-input" maxlength="500" placeholder="https://" value="'+E(cur.url)+'"></label><label class="jg-l">Hinweis (freiwillig)<input type="text" id="jg-lh" class="m-input" maxlength="140" value="'+E(cur.hinweis)+'"></label><button class="btn btn-gold" id="jg-ls" type="button">Speichern</button>');
    $(m.body,'#jg-ls').onclick=()=>{
      const url=$(m.body,'#jg-lu').value.trim();
      if(!url){ saveField(l=>{ delete l.links.cloud; },null,'Link entfernt'); m.close(); return; }
      if(!/^https:\/\/[^\s"'<>]{3,500}$/.test(url)){ TOAST.show('Bitte eine Adresse mit https:// eingeben',{type:'info'}); return; }
      saveField(l=>{ l.links.cloud={url,titel:$(m.body,'#jg-lt').value.trim()||'Lehrgangs-Link',hinweis:$(m.body,'#jg-lh').value.trim()}; },null,'Link gespeichert'); m.close();
    };
  }
  function orteEditor(){
    const o=JG.data().orte, L={ibk:'IBK',vak:'VAk',feuak:'FeuAK',idf:'IdF'};
    const m=modal('Standorte','<p class="jg-p">Wo findet der Abschnitt statt? Der Name ersetzt den Ort in Überschriften, Kacheln und Prüfungs-Reitern.</p>'+Object.keys(L).map(k=>'<label class="jg-l">'+L[k]+' – Standard: '+ORT0[k][1]+'<input type="text" class="m-input jg-ort" data-k="'+k+'" maxlength="40" placeholder="'+ORT0[k][1]+'" value="'+E(o[k]||'')+'"></label>').join('')+'<button class="btn btn-gold" id="jg-os" type="button" style="margin-top:12px">Speichern</button>');
    $(m.body,'#jg-os').onclick=()=>{ saveField(l=>{ l.orte={}; m.body.querySelectorAll('.jg-ort').forEach(x=>{ const v=x.value.replace(/[<>]/g,'').trim(); if(v) l.orte[x.dataset.k]=v; }); },null,'Standorte gespeichert'); m.close(); };
  }
  function kartenEditor(){
    let edit=null;
    const m=modal('Lernkarten des Jahrgangs','<p class="jg-p">Diese Karten gehören zum Jahrgang und stehen in der Jahrgangs-Datei. Du findest sie bei den Lernkarten.</p><div id="jg-kl"></div><label class="jg-l">Modul<select id="jg-km" class="m-input">'+['GAL','SFS','HLFS','IBK','VAk','FeuAK','IdF'].map(x=>'<option>'+x+'</option>').join('')+'</select></label><label class="jg-l">Frage<textarea id="jg-kq" class="m-input" rows="2" maxlength="600"></textarea></label><label class="jg-l">Antwort<textarea id="jg-ka" class="m-input" rows="3" maxlength="1500"></textarea></label><button class="btn btn-gold" id="jg-ks" type="button" style="margin-top:8px">Karte speichern</button>');
    const draw=()=>{ const a=JG.data().karten; $(m.body,'#jg-kl').innerHTML=a.map(k=>'<div class="cu-item" data-id="'+E(k.id)+'"><div><b>'+E(k.modul)+'</b> '+E(k.q)+'</div><span><button type="button" class="jg-ke">Bearbeiten</button><button type="button" class="jg-kd">Löschen</button></span></div>').join('')||'<div class="cu-empty">Noch keine Karten.</div>'; };
    draw();
    m.body.addEventListener('click',e=>{
      const it=e.target.closest('.cu-item');
      if(e.target.closest('.jg-ke')&&it){ const k=JG.data().karten.find(x=>x.id===it.dataset.id); if(k){ edit=k.id; $(m.body,'#jg-km').value=k.modul; $(m.body,'#jg-kq').value=k.q; $(m.body,'#jg-ka').value=k.a; } }
      else if(e.target.closest('.jg-kd')&&it){ const l=JG.local(), prev=JSON.stringify(l); l.karten=l.karten.filter(x=>x.id!==it.dataset.id); JG.saveLocal(l); draw(); TOAST.show('Karte gelöscht',{type:'ok',undo:()=>{ JG.saveLocal(JSON.parse(prev)); draw(); }}); }
      else if(e.target.closest('#jg-ks')){
        const q=$(m.body,'#jg-kq').value.trim(), a=$(m.body,'#jg-ka').value.trim();
        if(!q||!a){ TOAST.show('Bitte Frage und Antwort eintragen',{type:'info'}); return; }
        const l=JG.local(), k={id:edit||JG.newId(),modul:$(m.body,'#jg-km').value,q,a}, i=l.karten.findIndex(x=>x.id===k.id);
        if(i>=0) l.karten[i]=k; else l.karten.push(k);
        JG.saveLocal(l); edit=null; $(m.body,'#jg-kq').value=''; $(m.body,'#jg-ka').value=''; draw(); TOAST.show('Karte gespeichert',{type:'ok'});
      }
    });
  }
  // Checkliste für neue Jahrgänge
  let chk=null;
  function checklist(){
    const draw=()=>{
      const d=JG.data(), pl=['ibk','vak','feuak','idf','idf2'].filter(k=>d.plane[k]).length, rn=d.pr.hinzu.length;
      const item=(ok,t,s,b,act)=>'<div class="jg-ck-i"><span class="m-tx"><span class="m-t1">'+t+'</span><span class="m-t2">'+s+'</span></span><button type="button" class="btn btn-ghost" data-a="'+act+'">'+b+'</button></div>';
      chk.m.body.innerHTML='<p class="jg-p">Mach aus der Kopie des Masters deinen Jahrgang. Alles ist freiwillig – am Ende exportierst du die Datei und schickst sie weiter.</p>'
        +item(pl>0,'Stundenpläne',pl+' von 5 Plänen (IBK, VAk, FeuAK, IdF Gruppe 1 und 2)','Öffnen','plan')
        +item(!!d.links.cloud,'Lehrgangs-Link',d.links.cloud?E(d.links.cloud.titel):'Noch keiner – z. B. Cloud mit den Unterlagen','Bearbeiten','link')
        +item(Object.keys(d.orte).length>0,'Standorte',Object.keys(d.orte).length?Object.keys(d.orte).map(k=>E(d.orte[k])).join(', '):'Standard: Heyrothsberge, Berlin, Hamburg, Münster','Bearbeiten','orte')
        +item(d.karten.length>0,'Lernkarten',d.karten.length+' Karten des Jahrgangs','Bearbeiten','karten')
        +item(rn>0||d.pr.weg.length>0||Object.keys(d.rel).length>0,'Prüfungen',rn+' eigene, '+d.pr.weg.length+' ausgeblendet','Öffnen','pruef')
        +item(d.erg.length>0||d.ausg.length>0,'Lernseiten',d.erg.length+' Ergänzungen und Kapitel, '+d.ausg.length+' ausgeblendet','Öffnen','lern')
        ;
    };
    chk={m:modal('Jahrgang einrichten','',''),draw}; draw();
    chk.m.body.addEventListener('click',e=>{
      const b=e.target.closest('button[data-a]'); if(!b) return; const a=b.dataset.a;
      if(a==='link') linkEditor(); else if(a==='orte') orteEditor(); else if(a==='karten') kartenEditor();
      else { chk.m.close(); if(a==='plan') NAV.tab('v-plan','Stundenplan'); else if(a==='pruef') NAV.tab('v-pruefung','Prüfung'); else NAV.go('v-jahr1','1. Jahr'); }
    });
  }

  // Erklärseite: nach der Ersteinrichtung mit „Verstanden“-Knopf, aus den Einstellungen ohne
  function help(first){
    const b=document.getElementById('jg-help-ok'); if(b) b.hidden=!first;
    NAV.go('v-jg-hilfe','So funktioniert dein Jahrgang');
  }
  function helpDone(){ const b=document.getElementById('jg-help-ok'); if(b) b.hidden=true; NAV.tab('v-home','Start'); }

  // Bei Änderungen am Jahrgang alles Betroffene neu zeichnen
  JG.on(()=>{
    settings();
    const a=document.querySelector('.view.active'); if(a) mount(a.id);
    if(a&&a.id==='v-pruefung') SHELL.renderExam();
    if(a&&a.id==='v-home') SHELL.renderHome();
    syncCards(); names();
    if(typeof SEARCH!=='undefined'&&SEARCH.reset) SEARCH.reset();
    if(chk&&chk.m.body.isConnected) chk.draw();
    if(typeof SHELL!=='undefined') SHELL.syncSettings&&SHELL.syncSettings();
  });
  settings();
  JG.load();

  return { settings, mount, goneEls, chapterKey, names, checklist, openReiter, help, helpDone, closeTop, planEditor, planPhoto, parsePlanText, parseQuestions, ocr, isEditing, toggleEdit, setRel, delExam, restoreExams,
    examEditor, openExam, notice:NOTICE };
})();
