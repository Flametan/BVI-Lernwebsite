/* ======================================================================
   BRANDHAUS-RATEN – Pausenraum (Galgenmännchen mit Fachbegriffen im Feuerwehr-Look)
   Statt Galgen: Ein Haus brennt, die Leiter baut sich in 7 Schritten ab.
   Wird erst beim Öffnen des Spiels geladen. Rekord: längste Serie gelöster Begriffe.
====================================================================== */
const HANGMAN=(function(){
  'use strict';
  const BKEY='bvi_pause_best', MAXERR=7, STYLE_ID='hm-style';
  const KEYS='ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'.split('');

  /* Format: Begriff|Kategorie|optionale Erklärung (nur wo aus den Lernkarten der App belegt) */
  const RAW=[
    /* Brandschutz */
    'Brandwand|Brandschutz|Kurzzeichen z. B. REI 90-M: R tragend, E raumabschließend, I isolierend, M gegen Stoßbeanspruchung, 90 Minuten Feuerwiderstand.',
    'Brandlast|Brandschutz','Brandabschnitt|Brandschutz','Rauchabzug|Brandschutz','Rauchmelder|Brandschutz',
    'Sprinkleranlage|Brandschutz','Brandmeldeanlage|Brandschutz','Rettungsweg|Brandschutz',
    'Sonderbau|Baurecht und Brandschutz','Gebäudeklasse|Baurecht und Brandschutz','Feuerwiderstand|Brandschutz',
    'Brandklasse|Brandschutz','Feuerwehraufzug|Brandschutz','Aufstellfläche|Brandschutz','Feuerwehrzufahrt|Brandschutz',
    'Entrauchung|Brandschutz','Löschanlage|Brandschutz','Steigleitung|Brandschutz','Rauchschutztür|Brandschutz',
    'Wandhydrant|Brandschutz','Löschmittel|Brandschutz','Schaummittel|Brandschutz','Löschpulver|Brandschutz',
    'Feuerlöscher|Brandschutz','Hydrant|Löschwasserversorgung','Löschwasser|Löschwasserversorgung',
    'Unterflurhydrant|Löschwasserversorgung','Überflurhydrant|Löschwasserversorgung','Brandausbreitung|Brandlehre',
    'Brandverlauf|Brandlehre','Baugenehmigung|Baurecht','Bauordnung|Baurecht',
    /* Brandlehre */
    'Flashover|Brandlehre','Backdraft|Brandlehre|Bei Verdacht gilt: keine Überdruckbelüftung, Öffnungen bleiben geschlossen (Antiventilation).',
    'Explosionsgrenze|Brandlehre','Flammpunkt|Brandlehre','Zündtemperatur|Brandlehre','Selbstentzündung|Brandlehre',
    'Wärmestrahlung|Brandlehre','Wärmeleitung|Brandlehre','Rauchgas|Brandlehre','Oxidation|Brandlehre',
    'Verbrennung|Brandlehre','Kohlenmonoxid|Brandlehre, Atemgift','Kohlendioxid|Brandlehre','Blausäure|Brandlehre, Atemgift',
    'Stickstoff|Brandlehre','Sauerstoff|Brandlehre','Atemgift|Brandlehre',
    /* Einsatztaktik und Einsatzführung */
    'Atemschutz|Einsatztaktik','Pressluftatmer|Atemschutz','Dekontamination|Einsatztaktik','Menschenrettung|Einsatztaktik',
    'Brandbekämpfung|Einsatztaktik','Evakuierung|Einsatztaktik','Absperrung|Einsatztaktik','Gefahrenbereich|Einsatztaktik',
    'Gefahrgut|Einsatztaktik','Gefahrstoff|Einsatztaktik','Absturzsicherung|Einsatztaktik','Einsatztaktik|Einsatzführung',
    'Einsatzleiter|Einsatzführung|Trägt die Gesamtverantwortung für die Einsatzdurchführung im operativ-taktischen Bereich.',
    'Einsatzabschnitt|Einsatzführung','Einsatzstelle|Einsatzführung','Einsatztagebuch|Einsatzführung','Einsatzbefehl|Einsatzführung',
    'Einsatzmittel|Einsatzführung','Lagekarte|Einsatzführung','Lagefeststellung|Einsatzführung','Lageerkundung|Einsatzführung',
    'Führungsvorgang|Einsatzführung','Meldekopf|Einsatzführung','Alarmierung|Einsatzführung','Alarmplan|Einsatzführung',
    'Führungsstab|Stabsarbeit|Gliederung nach FwDV 100: S1 Personal/Innerer Dienst, S2 Lage, S3 Einsatz, S4 Versorgung, S5 Presse- und Medienarbeit, S6 Informations- und Kommunikationswesen.',
    'Stabsarbeit|Stabsarbeit','Logistik|Stabsarbeit','Verpflegung|Stabsarbeit',
    'Hilfsfrist|Bedarfsplanung','Eintreffzeit|Bedarfsplanung','Schutzziel|Bedarfsplanung','Bedarfsplan|Bedarfsplanung',
    'Leitstelle|Organisation','Gruppenführer|Funktion','Zugführer|Funktion','Brandmeister|Dienstgrad',
    'Berufsfeuerwehr|Organisation','Werkfeuerwehr|Organisation','Pflichtfeuerwehr|Organisation','Jugendfeuerwehr|Organisation',
    'Angriffstrupp|Truppfunktion','Wassertrupp|Truppfunktion','Schlauchtrupp|Truppfunktion',
    'Rettungsdienst|Organisation','Notarzt|Rettungsdienst','Triage|Rettungsdienst','Sichtung|Rettungsdienst','Krankentransport|Rettungsdienst',
    'Zivilschutz|Gefahrenabwehr','Gefahrenabwehr|Gefahrenabwehr',
    /* Geräte und Fahrzeuge */
    'Wärmebildkamera|Gerät','Strahlrohr|Gerät','Schaumrohr|Gerät','Verteiler|Gerät','Saugschlauch|Gerät','Druckschlauch|Gerät',
    'Tragkraftspritze|Gerät','Drehleiter|Fahrzeug','Löschfahrzeug|Fahrzeug','Rüstwagen|Fahrzeug','Gerätewagen|Fahrzeug',
    'Schlauchwagen|Fahrzeug','Abrollbehälter|Fahrzeug',
    /* Verwaltungs- und Vollstreckungsrecht */
    'Verwaltungsakt|Verwaltungsrecht|Hoheitliche Maßnahme einer Behörde auf dem Gebiet des öffentlichen Rechts mit Regelung eines Einzelfalls und unmittelbarer Außenwirkung (§ 35 VwVfG).',
    'Ermessen|Verwaltungsrecht|Erkennbar in einer Norm typischerweise an „kann“ oder „darf“. „Muss“ oder „ist“ weisen auf eine gebundene Entscheidung hin.',
    'Rechtsgrundlage|Verwaltungsrecht','Amtshilfe|Verwaltungsrecht|Ergänzende Hilfe auf Ersuchen einer anderen Behörde (§ 4 VwVfG, Art. 35 GG).',
    'Widerspruch|Rechtsschutz|Hat gegen einen belastenden Verwaltungsakt aufschiebende Wirkung (§ 80 Abs. 1 VwGO).',
    'Anhörung|Verwaltungsrecht|Erfolgt vor dem Verwaltungsakt (§ 28 VwVfG); bei Gefahr im Verzug kann sie entfallen (§ 28 Abs. 2 VwVfG).',
    'Zwangsmittel|Verwaltungsvollstreckung|Zwangsgeld, Ersatzvornahme und unmittelbarer Zwang (§ 9 Abs. 1 VwVG).',
    'Ersatzvornahme|Verwaltungsvollstreckung','Zwangsgeld|Verwaltungsvollstreckung','Kostenersatz|Verwaltungsrecht',
    'Sofortvollzug|Verwaltungsvollstreckung|Vollzug ohne vorherigen Verwaltungsakt (Realakt, letzter Ausweg bei akuter Gefahr).',
    'Nebenbestimmung|Verwaltungsrecht|Regelung, die den Verwaltungsakt inhaltlich oder zeitlich einschränkt (§ 36 VwVfG).',
    'Auflage|Verwaltungsrecht','Rücknahme|Verwaltungsrecht','Widerruf|Verwaltungsrecht','Sachverhalt|Verwaltungsrecht',
    'Rechtsverordnung|Rechtsquellen','Satzung|Rechtsquellen','Zuständigkeit|Verwaltungsrecht','Delegation|Verwaltung','Weisung|Verwaltung',
    /* Staatsrecht */
    'Grundgesetz|Staatsrecht|Verkündet am 23.05.1949, in Kraft getreten am 24.05.1949.',
    'Gewaltenteilung|Staatsrecht|Gliederung in Legislative, Exekutive und Judikative, aber ohne strikte Trennung: Gewaltenverschränkung mit wechselseitiger Kontrolle.',
    /* Dienst- und Beamtenrecht */
    'Beamtenrecht|Dienstrecht','Besoldung|Dienstrecht','Besoldungsgruppe|Dienstrecht','Beihilfe|Dienstrecht','Dienstherr|Dienstrecht',
    'Fürsorgepflicht|Dienstrecht','Verschwiegenheit|Dienstrecht','Amtshaftung|Dienstrecht','Disziplinarrecht|Dienstrecht',
    'Ernennung|Dienstrecht','Beförderung|Dienstrecht','Beurteilung|Dienstrecht',
    'Bestenauslese|Dienstrecht|Auswahl nach Eignung, Befähigung und fachlicher Leistung (Art. 33 Abs. 2 GG).',
    'Remonstration|Dienstrecht','Dienstpflicht|Dienstrecht','Ruhestand|Dienstrecht','Personalrat|Personalvertretung',
    /* Haushalt und Vergabe */
    'Haushaltsplan|Haushalt','Haushaltsrecht|Haushalt','Vergaberecht|Haushalt und Vergabe','Ausschreibung|Vergabe'
  ];
  const WORDS=(function(){
    const seen=new Set(), out=[];
    RAW.forEach(function(r){
      const p=r.split('|'), w=p[0].toUpperCase();
      if(w.length<5||w.length>16||!/^[A-ZÄÖÜ]+$/.test(w)||seen.has(w)) return;
      seen.add(w); out.push({w:w,show:p[0],cat:p[1]||'',exp:p[2]||''});
    });
    return out;
  })();

  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const lget=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
  const lset=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  const say=m=>{ if(typeof A11Y!=='undefined') A11Y.say(m); };
  const getBest=()=>{ const b=lget(BKEY,{}); return (b&&+b.hangman)||0; };
  const setBest=n=>{ const b=lget(BKEY,{}); const o=(b&&typeof b==='object')?b:{}; o.hangman=n; lset(BKEY,o); };

  let root=null, ui={}, G=null, kd=null, ft=null;

  function css(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=
'.hm-wrap{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:12px;color:var(--m-fg,#eee);}'
+'.hm-top{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}'
+'.hm-st{background:var(--m-card,#222);border-radius:14px;padding:8px 6px;text-align:center;min-width:0;}'
+'.hm-st b{display:block;font-size:1.25rem;font-weight:800;line-height:1.2;color:var(--m-fg,#eee);}'
+'.hm-st span{display:block;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--m-muted,#999);font-weight:700;}'
+'.hm-scene{background:var(--m-card,#222);border-radius:18px;padding:8px 8px 4px;position:relative;}'
+'.hm-svg{display:block;width:100%;height:auto;max-height:240px;}'
+'.hm-meter{display:flex;gap:4px;margin:2px 4px 6px;}.hm-meter i{flex:1;height:6px;border-radius:3px;background:var(--m-raised,#333);transition:background .3s;}'
+'.hm-meter i.on{background:#ff5a1f;}.hm-meter i.on.late{background:#e5484d;}'
+'.hm-wall{fill:var(--m-raised,#333);stroke:var(--m-line,#555);stroke-width:2;}'
+'.hm-roof{fill:var(--m-line,#555);}.hm-win{fill:var(--m-bg,#111);stroke:var(--m-line,#555);stroke-width:2;}'
+'.hm-door{fill:var(--m-bg,#111);stroke:var(--m-line,#555);stroke-width:2;}'
+'.hm-ground{stroke:var(--m-line,#555);stroke-width:3;stroke-linecap:round;}'
+'.hm-rail{stroke:var(--m-muted,#999);stroke-width:3;stroke-linecap:round;}.hm-rung{stroke:var(--m-accent,#ffa31a);stroke-width:3;stroke-linecap:round;}'
+'.hm-lad{transition:opacity .4s,transform .4s;}.hm-lad.gone{opacity:0;transform:translateY(8px);}'
+'.hm-f{opacity:0;transition:opacity .35s;pointer-events:none;}.hm-f.on{opacity:1;}'
+'.hm-f path{transform-box:fill-box;transform-origin:50% 100%;animation:hmflick 1.1s ease-in-out infinite alternate;}'
+'.hm-f path.b{animation-duration:.8s;animation-delay:-.3s;}'
+'@keyframes hmflick{from{transform:scale(1,1);}to{transform:scale(.93,1.12);}}'
+'.hm-smoke{opacity:0;transition:opacity .5s;fill:var(--m-muted,#999);}.hm-smoke.on{opacity:.45;}'
+'.hm-smoke circle{animation:hmsmoke 3s ease-in-out infinite alternate;}'
+'.hm-smoke circle:nth-child(2){animation-delay:-1s;}.hm-smoke circle:nth-child(3){animation-delay:-2s;}'
+'@keyframes hmsmoke{from{transform:translateY(0);}to{transform:translateY(-6px);}}'
+'.hm-won .hm-f{opacity:0;}.hm-won .hm-smoke{opacity:0;}'
+'.hm-spray{fill:none;stroke:#4aa8ff;stroke-width:3;stroke-linecap:round;stroke-dasharray:3 6;opacity:0;transition:opacity .4s;}.hm-won .hm-spray{opacity:1;}'
+'.hm-card{background:var(--m-card,#222);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px;}'
+'.hm-hint{text-align:center;color:var(--m-muted,#999);font-size:.9rem;}.hm-hint b{color:var(--m-accent-fg,var(--m-accent,#ffa31a));}'
+'.hm-word{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;}'
+'.hm-c{width:clamp(20px,6.2vw,28px);height:clamp(32px,9vw,40px);border-radius:8px;background:var(--m-raised,#333);border-bottom:3px solid var(--m-line,#555);display:grid;place-items:center;font-weight:800;font-size:clamp(1rem,4.6vw,1.4rem);color:var(--m-fg,#eee);}'
+'.hm-c.hit{border-bottom-color:var(--pz-ok,#2fae6b);}.hm-c.joker{border-bottom-color:var(--m-accent,#ffa31a);}'
+'.hm-c.miss{color:#ff6b6b;border-bottom-color:var(--pz-bad,#e5484d);}'
+'.hm-c.pop{animation:hmpop .3s;}@keyframes hmpop{from{transform:scale(.6);}to{transform:scale(1);}}'
+'.hm-kb{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;}'
+'@media(min-width:460px){.hm-kb{grid-template-columns:repeat(10,minmax(0,1fr));}}'
+'.hm-k{height:44px;border-radius:10px;border:2px solid transparent;background:var(--m-raised,#333);color:var(--m-fg,#eee);font-family:inherit;font-weight:800;font-size:1rem;cursor:pointer;padding:0;touch-action:manipulation;}'
+'.hm-k:focus-visible,.hm-wrap button:focus-visible{outline:3px solid var(--m-accent,#ffa31a);outline-offset:2px;}'
+'.hm-k.hit{background:color-mix(in srgb,var(--pz-ok,#2fae6b) 55%,var(--m-raised,#333));border-color:var(--pz-ok,#2fae6b);}'
+'.hm-k.miss{opacity:.4;text-decoration:line-through;border-color:var(--pz-bad,#e5484d);}'
+'.hm-k:disabled{cursor:default;}'
+'.hm-act{display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;}'
+'.hm-act button{min-height:44px;}'
+'.hm-res{display:flex;flex-direction:column;gap:8px;}.hm-res h3{margin:0;font-size:1.05rem;}'
+'.hm-term{font-size:1.25rem;font-weight:800;letter-spacing:.02em;}'
+'.hm-res p{margin:0;line-height:1.45;font-size:.92rem;color:var(--m-muted,#999);}'
+'.hm-res .pz-pri{min-height:46px;}'
+'.hm-start{align-items:center;text-align:center;gap:12px;padding:22px 16px;}'
+'.hm-start h3{margin:0;font-size:1.3rem;}.hm-start p{margin:0;color:var(--m-muted,#999);line-height:1.45;font-size:.92rem;}'
+'.hm-start .pz-pri{align-self:stretch;min-height:48px;}'
+'@media(prefers-reduced-motion:reduce){.hm-f path,.hm-smoke circle,.hm-c.pop{animation:none!important;}.hm-f,.hm-lad,.hm-smoke,.hm-spray,.hm-meter i{transition:none!important;}}';
    document.head.appendChild(s);
  }

  const FL='M0 0C-11 0 -12 -12 -6 -20C-5 -14 -2 -13 -1 -13C-3 -20 1 -28 4 -31C4 -22 12 -18 11 -8C10 -2 6 0 0 0Z';
  function flame(x,y,sc,at){
    return '<g class="hm-f" data-at="'+at+'" transform="translate('+x+' '+y+') scale('+sc+')"><path d="'+FL+'" fill="#ff5a1f"/><path class="b" d="'+FL+'" fill="#ffa31a" transform="scale(.62)"/></g>';
  }
  function svg(){
    let lad='';
    for(let s=0;s<4;s++){
      const y0=140-24*(s+1), y1=y0+24;
      lad+='<g class="hm-lad" data-gone="'+(7-s)+'"><line class="hm-rail" x1="26" y1="'+y0+'" x2="26" y2="'+y1+'"/><line class="hm-rail" x1="50" y1="'+y0+'" x2="50" y2="'+y1+'"/>'
        +'<line class="hm-rung" x1="26" y1="'+(y0+4)+'" x2="50" y2="'+(y0+4)+'"/><line class="hm-rung" x1="26" y1="'+(y0+16)+'" x2="50" y2="'+(y0+16)+'"/></g>';
    }
    return '<svg class="hm-svg" viewBox="0 0 240 150" role="img" aria-label="Ein Haus mit Leiter; je Fehler wächst das Feuer und die Leiter wird kürzer" focusable="false">'
      +'<line class="hm-ground" x1="8" y1="142" x2="232" y2="142"/>'
      +'<polygon class="hm-roof" points="62,62 125,18 188,62"/><rect class="hm-wall" x="70" y="62" width="110" height="80"/>'
      +'<rect class="hm-win" x="82" y="78" width="24" height="26" rx="2"/><rect class="hm-win" x="144" y="78" width="24" height="26" rx="2"/>'
      +'<rect class="hm-door" x="113" y="104" width="24" height="38" rx="2"/>'
      +lad
      +'<g class="hm-smoke" data-at="3"><circle cx="152" cy="64" r="9"/><circle cx="160" cy="52" r="12"/><circle cx="170" cy="38" r="15"/></g>'
      +flame(94,104,.8,1)+flame(156,104,1,2)+flame(125,52,.9,4)+flame(96,60,1,5)+flame(154,60,1.1,5)
      +flame(125,140,1.15,6)+flame(88,142,1.3,6)+flame(160,142,1.3,7)+flame(125,40,1.9,7)+flame(100,100,1.5,7)+flame(150,100,1.5,7)
      +'<path class="hm-spray" d="M206 138C190 110 160 96 134 100"/>'
      +'</svg>';
  }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function refill(last){
    G.order=shuffle(WORDS.map((_,i)=>i)); G.pos=0;
    if(last!=null&&G.order.length>1&&G.order[0]===last){ const j=1+Math.floor(Math.random()*(G.order.length-1)); const t=G.order[0]; G.order[0]=G.order[j]; G.order[j]=t; }
  }
  function newSeries(){
    G={order:[],pos:0,streak:0,solved:0,startBest:getBest(),cheered:false,rec:false,round:null,last:null,note:''};
    refill(null);
  }
  function nextRound(){
    let note='';
    if(G.pos>=G.order.length){ refill(G.last); note='Alle '+WORDS.length+' Begriffe waren dran, die Liste ist neu gemischt.'; }
    const idx=G.order[G.pos++]; G.last=idx; G.note=note;
    G.round={word:WORDS[idx],used:{},miss:0,joker:false,jokerLetters:{},over:false,won:false};
    drawRound();
    say('Neuer Begriff. Kategorie '+G.round.word.cat+'. '+G.round.word.w.length+' Buchstaben.');
  }

  function start(el){
    stop(); root=el; css(); newSeries(); showStart();
    kd=onKey; document.addEventListener('keydown',kd);
  }
  function stop(){
    if(kd){ document.removeEventListener('keydown',kd); kd=null; }
    clearTimeout(ft); ft=null;
    if(root){ root.removeEventListener('click',onClick); root.innerHTML=''; }
    root=null; ui={}; G=null;
  }

  function showStart(){
    root.removeEventListener('click',onClick); root.addEventListener('click',onClick);
    const best=getBest();
    root.innerHTML='<div class="hm-wrap"><div class="hm-card hm-start">'
      +'<div class="hm-scene" style="width:100%;box-sizing:border-box">'+svg()+'</div>'
      +'<h3>Das Haus brennt</h3>'
      +'<p>Rate den Fachbegriff, bevor das Feuer das Haus erreicht. Jeder falsche Buchstabe lässt die Flammen wachsen und die Leiter kürzer werden. Nach 7 Fehlern ist der Begriff verloren. Ein Hinweis-Joker pro Begriff deckt einen Buchstaben auf, zählt aber als Fehler.</p>'
      +'<p><b>Rekord: '+(best?'Serie '+best:'noch keiner')+'</b> &middot; '+WORDS.length+' Begriffe</p>'
      +'<button type="button" class="pz-pri" data-a="new">Neues Spiel</button></div></div>';
    const b=root.querySelector('[data-a="new"]'); if(b) b.focus({preventScroll:true});
  }

  function skeleton(){
    root.innerHTML='<div class="hm-wrap">'
      +'<div class="hm-top"><div class="hm-st"><b data-r="streak">0</b><span>Serie</span></div><div class="hm-st"><b data-r="best">0</b><span>Rekord</span></div><div class="hm-st"><b data-r="left">0</b><span>Offen</span></div></div>'
      +'<div class="hm-scene" data-r="scene">'+svg()+'<div class="hm-meter" data-r="meter" aria-hidden="true"></div></div>'
      +'<div class="hm-card"><div class="hm-hint" data-r="hint"></div><div class="hm-word" data-r="word"></div>'
      +'<div data-r="play"><div class="hm-kb" role="group" aria-label="Buchstaben" data-r="kb"></div>'
      +'<div class="hm-act" style="margin-top:10px"><button type="button" class="pz-sec2" data-a="joker" aria-label="Hinweis-Joker: deckt einen Buchstaben auf und zählt als Fehler">Hinweis-Joker</button><button type="button" class="pz-sec2" data-a="new">Neues Spiel</button></div></div>'
      +'<div class="hm-res" data-r="res" hidden></div></div></div>';
    ui={};
    root.querySelectorAll('[data-r]').forEach(n=>{ ui[n.getAttribute('data-r')]=n; });
    ui.meter.innerHTML=new Array(MAXERR+1).join('<i></i>');
    ui.kb.innerHTML=KEYS.map(k=>'<button type="button" class="hm-k" data-k="'+k+'" aria-label="Buchstabe '+k+'">'+k+'</button>').join('');
  }

  function drawRound(){
    skeleton(); const R=G.round;
    ui.hint.innerHTML='Hinweis: <b>'+esc(R.word.cat)+'</b> &middot; '+R.word.w.length+' Buchstaben'+(G.note?'<br>'+esc(G.note):'');
    ui.word.innerHTML=R.word.w.split('').map(()=>'<span class="hm-c"></span>').join('');
    paint(); setLive();
  }
  function setLive(){
    const R=G.round; const spoken=R.word.w.split('').map(ch=>R.used[ch]||R.over?ch:'Lücke').join(', ');
    ui.word.setAttribute('aria-label','Begriff: '+spoken);
  }

  /* Zeichnet Fehlerzähler, Haus und Tasten passend zum Zustand */
  function paint(){
    const R=G.round, e=R.miss;
    ui.streak.textContent=G.streak; ui.best.textContent=Math.max(getBest(),0);
    ui.left.textContent=Math.max(MAXERR-e,0);
    ui.scene.classList.toggle('hm-won',R.over&&R.won);
    ui.scene.querySelectorAll('[data-at]').forEach(n=>n.classList.toggle('on',e>=+n.getAttribute('data-at')));
    ui.scene.querySelectorAll('[data-gone]').forEach(n=>n.classList.toggle('gone',e>=+n.getAttribute('data-gone')));
    ui.meter.querySelectorAll('i').forEach((n,i)=>{ n.classList.toggle('on',i<e); n.classList.toggle('late',i<e&&i>=4); });
    ui.kb.querySelectorAll('.hm-k').forEach(b=>{
      const k=b.getAttribute('data-k'), u=R.used[k];
      b.classList.toggle('hit',u==='hit'); b.classList.toggle('miss',u==='miss');
      b.disabled=!!u||R.over;
      b.setAttribute('aria-label','Buchstabe '+k+(u==='hit'?', richtig':u==='miss'?', falsch':''));
    });
    const cells=ui.word.children;
    R.word.w.split('').forEach((ch,i)=>{
      const c=cells[i], known=!!R.used[ch]&&R.used[ch]==='hit';
      let cls='hm-c', t='';
      if(known){ cls+=R.jokerLetters[ch]?' joker':' hit'; t=ch; }
      else if(R.over){ cls+=' miss'; t=ch; }
      if(c.textContent!==t&&t) cls+=' pop';
      c.className=cls; c.textContent=t;
    });
    const jb=root.querySelector('[data-a="joker"]');
    if(jb){ jb.disabled=R.over||R.joker||R.miss>=MAXERR-1; jb.textContent=R.joker?'Joker benutzt':'Hinweis-Joker'; }
    setLive();
  }

  function complete(R){ return R.word.w.split('').every(ch=>R.used[ch]==='hit'); }

  function guess(k,viaJoker){
    if(!root||!G||!G.round||G.round.over) return;
    const R=G.round; if(R.used[k]) return;
    if(R.word.w.indexOf(k)>=0){
      R.used[k]='hit'; if(viaJoker) R.jokerLetters[k]=true;
    } else {
      R.used[k]='miss'; R.miss++;
    }
    const hit=R.used[k]==='hit';
    if(!viaJoker) say((hit?k+' ist richtig. ':k+' ist falsch. ')+(hit?'':'Noch '+(MAXERR-R.miss)+' Fehler frei.'));
    if(complete(R)){ finish(true); }
    else if(R.miss>=MAXERR){ finish(false); }
    else paint();
  }
  function joker(){
    if(!G||!G.round) return; const R=G.round;
    if(R.over||R.joker||R.miss>=MAXERR-1) return;
    const hidden=R.word.w.split('').filter(ch=>R.used[ch]!=='hit');
    const pool=hidden.filter((c,i)=>hidden.indexOf(c)===i); if(!pool.length) return;
    const k=pool[Math.floor(Math.random()*pool.length)];
    R.joker=true; R.miss++; R.used[k]='hit'; R.jokerLetters[k]=true;
    say('Hinweis: Der Buchstabe '+k+' kommt vor. Das zählt als Fehler. Noch '+(MAXERR-R.miss)+' Fehler frei.');
    if(complete(R)) finish(true); else paint();
  }

  function finish(won){
    const R=G.round; R.over=true; R.won=won;
    const W=R.word; let head, cls, extra='';
    if(won){
      G.streak++; G.solved++;
      if(G.streak>getBest()){ setBest(G.streak); G.rec=true; }
      if(G.rec&&G.startBest>0&&!G.cheered&&typeof GAME!=='undefined'){ G.cheered=true; GAME.cheer('spiel','Begriffe raten','Serie '+G.streak); }
      head='Richtig, Brand gelöscht!'; cls='g';
      extra=(G.rec?'<p><b>Neuer Rekord: Serie '+G.streak+'</b></p>':'<p>Serie: '+G.streak+' Begriffe in Folge.</p>');
    } else {
      const was=G.streak; G.streak=0; G.cheered=false; G.startBest=getBest(); G.rec=false;
      head='Das Haus brennt, der Begriff war:'; cls='r';
      extra='<p>'+(was?'Deine Serie endet bei '+was+'. ':'')+'Mit dem nächsten Begriff startet eine neue Serie.</p>';
    }
    paint(); ui.play.hidden=true;
    const rest=G.order.length-G.pos;
    ui.res.hidden=false;
    ui.res.innerHTML='<div class="pz-fb '+cls+'" role="status"><h3>'+head+'</h3></div>'
      +'<div class="hm-term">'+esc(W.show)+'</div>'
      +'<p>Kategorie: '+esc(W.cat)+'</p>'
      +(W.exp?'<p>'+esc(W.exp)+'</p>':'')+extra
      +'<button type="button" class="pz-pri" data-a="next">Nächster Begriff'+(rest>0?'':' (Liste neu mischen)')+'</button>'
      +'<button type="button" class="pz-sec2" data-a="new">Neues Spiel</button>';
    say((won?'Richtig. ':'Verloren. ')+'Der Begriff war '+W.show+'. '+(W.exp?W.exp:'Kategorie '+W.cat+'.'));
    clearTimeout(ft); ft=setTimeout(function(){ const b=root&&root.querySelector('[data-a="next"]'); if(b) b.focus({preventScroll:true}); },60);
  }

  function onClick(ev){
    const t=ev.target.closest('[data-k],[data-a]'); if(!t||!root||!root.contains(t)) return;
    if(t.hasAttribute('data-k')){ if(G&&G.round) guess(t.getAttribute('data-k')); return; }
    const a=t.getAttribute('data-a');
    if(a==='new'){ newSeries(); nextRound(); }
    else if(a==='next'){ if(G&&G.round&&G.round.over) nextRound(); }
    else if(a==='joker') joker();
  }

  function onKey(ev){
    if(!root||!root.isConnected){ stop(); return; }
    if(ev.ctrlKey||ev.metaKey||ev.altKey||ev.isComposing) return;
    const tg=ev.target&&ev.target.tagName; if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT') return;
    if(!G||!G.round){ return; }
    const R=G.round;
    if(R.over){
      if((ev.key==='Enter'||ev.key===' ')&&!(document.activeElement&&document.activeElement.tagName==='BUTTON')){ ev.preventDefault(); nextRound(); }
      return;
    }
    if(ev.key&&ev.key.length===1){
      const k=ev.key.toUpperCase();
      if(KEYS.indexOf(k)>=0){ ev.preventDefault(); guess(k); }
    }
  }

  return { start:start, stop:stop };
})();
