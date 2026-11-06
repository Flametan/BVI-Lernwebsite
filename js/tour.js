/* ======================================================================
   TOUR – „App vorstellen“: Spotlight-Rundgang durch Startseite, Tabs, Lernkarten und Einstellungen
   Start: Einstellungen → „App vorstellen“. Esc beendet, Pfeiltasten blättern.
====================================================================== */
const TOUR=(function(){
  const $=(s,r)=>(r||document).querySelector(s);
  const vis=e=>e&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
  // Tab-Knopf: Tab-Leiste (Handy/Tablet) oder Seitenleiste (PC) – je nachdem, was gerade sichtbar ist
  const tabEl=id=>{
    const bar=[...document.querySelectorAll('#m-tabbar [data-tabs]')].find(b=>(b.dataset.tabs||'').split(' ').includes(id)&&vis(b));
    if(bar) return bar;
    const rail=$('#m-rail [data-tab="'+id+'"]'); return vis(rail)?rail:null;
  };
  // Ziel kann ein Element oder eine Liste sein (dann gilt der gemeinsame Rahmen aller sichtbaren Elemente)
  const rectOf=t=>{ const els=(Array.isArray(t)?t:[t]).filter(vis); if(!els.length) return null; let l=1e9,tp=1e9,r=-1e9,b=-1e9; els.forEach(e=>{ const q=e.getBoundingClientRect(); l=Math.min(l,q.left); tp=Math.min(tp,q.top); r=Math.max(r,q.right); b=Math.max(b,q.bottom); }); return {left:l,top:tp,right:r,bottom:b,width:r-l,height:b-tp}; };
  const accOf=id=>()=>{ const h=document.getElementById(id); return h&&h.closest('.m-acc'); };
  const home=()=>NAV.home(), tab=(v,l)=>()=>NAV.tab(v,l);
  const ALL=[
    {t:'Willkommen in der App',x:'Hier lernst du für B VI: Lernseiten, Prüfungen, Lernkarten und Stundenplan an einem Ort. Die Tour zeigt dir in 2 Minuten alles Wichtige.',go:home,target:null},
    {t:'Deine Startseite',x:'Oben begrüßt dich die App und zeigt Datum und die nächste Unterrichtseinheit. Von hier aus kommst du überall hin.',go:home,target:()=>$('#v-home .m-hello')},
    {t:'Dein Lernstoff',x:'Jeder Lehrgangsort hat einen Ring mit deinem Fortschritt in Prozent. Oben rechts wechselst du zwischen dem 2. und 1. Jahr. Antippen öffnet die Lernseiten.',go:home,target:()=>[$('#v-home .m-seg2'),...document.querySelectorAll('#v-home .m-yl')]},
    {t:'Deine Lernzeit',x:'Das Diagramm zeigt, wie viele Minuten du diese Woche gelernt hast. So behältst du dein Tagesziel im Blick.',go:home,target:()=>$('#v-home .m-chart2')},
    {t:'Tab: Start',x:'Mit „Start“ kommst du jederzeit zurück auf diese Seite.',go:home,target:()=>tabEl('start')},
    {t:'Tab: Stundenplan',x:'Der Stundenplan zeigt jede Woche mit Räumen, Pausen und dem Speiseplan. Änderungen kannst du selbst eintragen.',go:tab('v-plan','Stundenplan'),target:()=>tabEl('plan')},
    {t:'Tab: Prüfung',x:'Der große Knopf in der Mitte führt zu den Klausuren, Altklausuren und dem Simulator. Der Stern ★ markiert, welche Prüfungen für Einsatzfahrt und Lernkarten wichtig sind.',go:tab('v-pruefung','Prüfung'),target:()=>tabEl('exam')},
    {t:'Laufbahnprüfung',x:'Hier stehen die Eingrenzungen mit Lösungen von mir. Sie dürfen gerne verbessert werden.',go:tab('v-pruefung','Prüfung'),when:()=>typeof JG!=='undefined'&&JG.isMaster(),target:()=>$('#m-exam-list .jg-rw.lbg')||$('#m-exam-list .jg-rw')},
    {t:'Tab: Lernkarten',x:'Lernkarten üben mit Wiederholung: Du siehst die Frage, deckst die Antwort auf und sagst, ob du sie wusstest.',go:tab('v-flashcards','Lernkarten'),target:()=>tabEl('cards')},
    {t:'Karte und Antwort',x:'Tippe auf die Karte, um die Antwort zu sehen. Danach „Gewusst“ oder „Nicht gewusst“ – oder wische die Karte zur Seite. Gewusste Karten kommen später wieder.',go:()=>{ NAV.tab('v-flashcards','Lernkarten'); try{ if(!$('#v-flashcards .fc-outer')&&typeof FC!=='undefined') FC.start(); }catch(e){} },target:()=>$('#v-flashcards .fc-outer')||$('#fc-container')},
    {t:'Karten filtern',x:'Hier wählst du, welche Karten du üben willst, zum Beispiel nur ein Fach oder nur fällige Karten.',go:tab('v-flashcards','Lernkarten'),target:()=>$('#v-flashcards .fc-filter-row')||$('#v-flashcards .pc')},
    {t:'Tab: Pausenraum',x:'Im Pausenraum warten Spiele wie die Einsatzfahrt – mit Fragen aus den Prüfungen, die du mit ★ als wichtig markiert hast.',go:tab('v-pause','Pausenraum'),target:()=>tabEl('pause')},
    {t:'Tab: Einstellungen',x:'Hier stellst du Aussehen, Lernziele und Erinnerungen ein und sicherst deine Daten. Diese Tour findest du hier unter „App vorstellen“.',go:tab('v-settings','Einstellungen'),target:()=>tabEl('settings')},
    {t:'Lehrgang',x:'Hier wählst du deinen Lehrgang. Für andere Lehrgänge kannst du eigene Inhalte ergänzen und selbst festlegen, welche Prüfungen mit ★ wichtig sind.',go:tab('v-settings','Einstellungen'),target:accOf('acc-lg-h')},
    {t:'Aussehen',x:'Farbschema (Dunkel, Hell, Beige), Akzentfarbe, Schriftgröße und die Navigationsleiste unten richtest du hier ein.',go:tab('v-settings','Einstellungen'),target:accOf('acc-dar-h')},
    {t:'Lernen &amp; Erinnerung',x:'Dein Tagesziel, der Timer bei Klausuren, der Termin der nächsten Klausur und eine tägliche Erinnerung zur Uhrzeit deiner Wahl.',go:tab('v-settings','Einstellungen'),target:accOf('acc-ler-h')},
    {t:'Daten &amp; Werkzeuge',x:'Hier sicherst du deine Daten und spielst sie wieder ein. Außerdem findest du Notizen, Lesezeichen, Pomodoro-Timer und die Abkürzungen.',go:tab('v-settings','Einstellungen'),target:accOf('acc-dat-h')},
    {t:'Tour jederzeit wiederholen',x:'Du kannst die Tour in den Einstellungen so oft starten, wie du willst.',go:tab('v-settings','Einstellungen'),target:()=>$('#set-tour')},
    {t:'Fertig – viel Erfolg!',x:'Das war alles Wichtige. Los geht’s mit deinem Lehrgang.',go:home,target:null,end:true}
  ];
  let STEPS=ALL;
  let i=-1, root=null, hole=null, tip=null, busy=0, from=null;

  function build(){
    root=document.createElement('div'); root.id='tour'; root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true'); root.setAttribute('aria-label','App-Tour');
    root.innerHTML='<div class="tour-hole" id="tour-hole"></div><div class="tour-tip" id="tour-tip" aria-live="polite"></div>';
    document.body.appendChild(root); hole=$('#tour-hole'); tip=$('#tour-tip');
    root.addEventListener('click',e=>{ const b=e.target.closest('[data-tour]'); if(!b) return; const a=b.dataset.tour; if(a==='next') go(i+1); else if(a==='prev') go(i-1); else if(a==='again') go(0); else close(); });
    window.addEventListener('resize',()=>{ if(i>=0) place(); });
    document.addEventListener('keydown',e=>{ if(i<0) return; if(e.key==='Escape'){ e.preventDefault(); close(); } else if(e.key==='ArrowRight'){ e.preventDefault(); go(i+1); } else if(e.key==='ArrowLeft'&&i>0){ e.preventDefault(); go(i-1); } },true);
  }

  function place(){
    const s=STEPS[i]; if(!s||!tip) return;
    const rr=s.target&&rectOf(s.target()), W=innerWidth, H=innerHeight;
    const th=tip.offsetHeight, tw=Math.min(380,W-28);
    tip.style.width=tw+'px';
    if(rr){
      const r=rr, pad=8;
      const L=Math.max(4,r.left-pad), T=Math.max(4,r.top-pad), Wd=Math.min(W-8,r.width+2*pad), Ht=Math.min(H-8,r.height+2*pad);
      hole.style.cssText='left:'+L+'px;top:'+T+'px;width:'+Wd+'px;height:'+Ht+'px;opacity:1';
      let left, top;
      if(r.right<140&&W>=1100){ left=r.right+pad+16; top=Math.max(12,Math.min(H-th-12,r.top+r.height/2-th/2)); }   // Seitenleiste: Karte rechts daneben
      else {
        left=Math.max(14,Math.min(W-tw-14,r.left+r.width/2-tw/2));
        const below=T+Ht+14, above=T-th-14;
        top=(T>H/2||below+th>H-10)?Math.max(12,above):below;
        if(top<12) top=Math.min(H-th-12,below);
      }
      tip.style.left=left+'px'; tip.style.top=top+'px'; tip.style.right='auto';
    } else {
      hole.style.cssText='left:'+(W/2)+'px;top:'+(H/2)+'px;width:0;height:0;opacity:0';
      tip.style.left=Math.round((W-tw)/2)+'px'; tip.style.top=Math.round((H-th)/2)+'px'; tip.style.right='auto';
    }
  }

  function render(){
    const s=STEPS[i], last=i===STEPS.length-1;
    const dots=STEPS.map((_,k)=>'<i class="'+(k===i?'on':'')+'"></i>').join('');
    tip.innerHTML='<div class="tour-st">Schritt '+(i+1)+' von '+STEPS.length+'</div><h3>'+s.t+'</h3><p>'+s.x+'</p><div class="tour-nav"><div class="tour-dots" aria-hidden="true">'+dots+'</div>'
      +(i>0&&!last?'<button type="button" class="tour-b2" data-tour="prev">Zurück</button>':'')
      +(last?'<button type="button" class="tour-b2" data-tour="again">Nochmal</button>':'<button type="button" class="tour-b3" data-tour="skip">Überspringen</button>')
      +'<button type="button" class="tour-b1" data-tour="next">'+(last?'Fertig':'Weiter')+'</button></div>';
  }

  function go(n){
    if(busy) return;
    if(n<0) n=0;
    if(n>=STEPS.length){ close(); return; }
    busy=1; i=n; const s=STEPS[i];
    if(i===STEPS.length-1){ try{ localStorage.setItem('bvi_tour_done','1'); }catch(e){} }   // Tour bis zum Ende gesehen: Karte auf der Startseite entfällt
    try{ s.go&&s.go(); }catch(e){}
    document.documentElement.classList.add('tour-lock');
    setTimeout(()=>{
      const t=s.target&&s.target(), el=Array.isArray(t)?t.find(vis):t;
      if(el&&el.scrollIntoView&&vis(el)){ const r=el.getBoundingClientRect(); if(r.top<70||r.bottom>innerHeight-80) el.scrollIntoView({block:'center'}); }
      root.classList.add('on'); render();
      requestAnimationFrame(()=>{ place(); busy=0; const nb=$('.tour-b1',root); if(nb) nb.focus({preventScroll:true}); });
    },i===n&&s.go?380:120);
  }

  function close(){
    if(!root) return;
    root.classList.remove('on'); hole.style.opacity='0'; document.documentElement.classList.remove('tour-lock');
    const wasEnd=i===STEPS.length-1; i=-1; busy=0;
    if(!wasEnd){ if(from==='home') NAV.home(); else NAV.tab('v-settings','Einstellungen'); }   // abgebrochen: zurück dorthin, wo die Tour gestartet wurde
  }

  return {
    start(origin){ if(!root) build(); from=origin==='home'?'home':'settings'; STEPS=ALL.filter(s=>!s.when||s.when()); setTimeout(()=>go(0),80); },
    done(){ try{ return localStorage.getItem('bvi_tour_done')==='1'; }catch(e){ return false; } },
    dismiss(){ try{ localStorage.setItem('bvi_tour_done','1'); }catch(e){} const c=document.getElementById('tour-home'); if(c) c.remove(); },
    close, go, steps:()=>STEPS.length
  };
})();
window.TOUR=TOUR;
