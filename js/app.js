/* ======================================================================
   NAVIGATIONS-ENGINE
   NAV.go(id, label) · NAV.back() · NAV.home() · NAV.jumpTo(idx)
====================================================================== */
const _NAVY_VIEWS = new Set(['v-simulator','v-flashcards','v-abkuerzungen','v-app','v-klausurfragen','v-klausur-0826','v-laufbahn-2023','v-laufbahn-2026']);
const _GOLD_VIEWS = new Set(['v-vak-klausurvorbereitung','v-feuak-bp-hub','v-feuak-analyse']);

/* ── Speicher absichern: voller oder gesperrter localStorage darf die App nicht lahmlegen ── */
(function(){
  let warned=0;
  function warn(){ if(Date.now()-warned<8000) return; warned=Date.now(); try{ TOAST.show('Speicher voll oder gesperrt – Änderungen werden nicht gespeichert'); }catch(e){} }
  let ls; try{ ls=window.localStorage; void ls.length; }catch(e){ ls=null; }
  if(!ls){   // Zugriff verweigert (z. B. alle Website-Daten blockiert): Speicher nur für diese Sitzung
    const m=new Map(), mem={ getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>{ m.set(String(k),String(v)); }, removeItem:k=>{ m.delete(k); }, clear:()=>m.clear(), key:i=>[...m.keys()][i]??null, get length(){ return m.size; } };
    try{ Object.defineProperty(window,'localStorage',{value:mem,configurable:true}); }catch(e){}
    return;
  }
  const P=Storage.prototype, si=P.setItem, gi=P.getItem, ri=P.removeItem;
  P.setItem=function(k,v){ try{ si.call(this,k,v); }catch(e){ warn(); } };
  P.getItem=function(k){ try{ return gi.call(this,k); }catch(e){ return null; } };
  P.removeItem=function(k){ try{ ri.call(this,k); }catch(e){} };
})();

const NAV = (function(){
  let stack = [];
  let _dir = 'forward';
  let _activeEl = null; // cached active view element – avoids O(90) DOM scan per navigation

  function show(id){
    // O(2) view swap: deactivate previous, activate next
    if(!_activeEl) _activeEl = document.querySelector('.view.active');
    const next = document.getElementById(id);
    if(_activeEl && _activeEl !== next) _activeEl.classList.remove('active','nav-forward','nav-back');
    if(next){
      next.classList.remove('nav-forward','nav-back');
      void next.offsetWidth;
      next.classList.add('active', _dir==='back'?'nav-back':'nav-forward');
      _activeEl = next;
    }
    window.scrollTo({top:0,behavior:'instant'});
    const isContentPage = (id.split('-').length > 2 && !_GOLD_VIEWS.has(id)) || _NAVY_VIEWS.has(id);
    if(typeof NOTES!=='undefined') NOTES.setView(id);
    if(typeof BOOKMARKS!=='undefined') BOOKMARKS.setView(id);
    SHELL.onShow(id, isContentPage, stack);
    if(id==='v-plan') IDF_PLAN.render();
    if(id==='v-app') INSTALL.render();
    ETIMER.mount(id);
    if(id==='v-flashcards'){ FC.syncFilters(); SHELL.renderFcSide(); }
    if(id==='v-home'){ SHELL.newQuip(); SHELL.renderHome(); }
    if(id==='v-pruefung') SHELL.renderExam();
    if(typeof JGUI!=='undefined'&&JGUI.names) setTimeout(JGUI.names,0);
    if(id==='v-settings') SHELL.syncSettings();
    if(id==='v-notizen') SHELL.renderNotes();
    if(id==='v-abkuerzungen') ABK.init();
    if(id==='v-vak-altklausur') QUIZ.init();
    if(id==='v-idf-altklausur') IDFQ.init();
    if(id==='v-klausurfragen') KF_QUIZ.init();
    if(id==='v-klausur') KLAUSUR_HUB.render();
    if(id==='v-vak-fallbearbeitung') FALLBEARBEITUNG.init();
    if(id==='v-simulator'){ SIM._refreshCards(); if(_dir==='back'&&!document.getElementById('sim-game-wrap').classList.contains('hidden')){ SIM._pushed=false; SIM.backToMenu(); } }
    if(id==='v-app' && window._isChromium){
      const w = document.getElementById('apk-chromium-warn');
      if(w) w.classList.remove('hidden');
    }
    if(typeof PROGRESS!=='undefined') PROGRESS.track(id);
    if(typeof RELATED!=='undefined'&&RELATED[id]){const _v=document.getElementById(id);if(_v&&!_v.querySelector('.related-topics')){const _pc=_v.querySelector('.pc');if(_pc){const _d=document.createElement('div');_d.className='related-topics';_d.innerHTML='<div class="related-label">Verwandte Themen</div><div class="related-chips">'+RELATED[id].map(([rid,rl])=>'<button class="related-chip" onclick="NAV.go(\''+rid+'\',\''+rl+'\')">'+rl+'</button>').join('')+'</div>';_pc.appendChild(_d);}}}
    updateReadProgress();
    CHECKS.init(id);
    if(typeof TB!=='undefined') TB.init(id);
    if(typeof LP!=='undefined'){ LP.onShow(id); LP.init(id); }
    PAUSE_LOADER.onShow(id);
    A11Y.onShow();
    if(isContentPage){ ABKTIP.apply(id); if(typeof JGUI!=='undefined') JGUI.mount(id); }
    // Update URL for direct linking
    const url=new URL(location.href);
    if(id==='v-home') url.searchParams.delete('id'); else url.searchParams.set('id',id);
    history.replaceState(history.state,'',url.pathname+(url.search==='?'||url.search===''?'':url.search));
    // Recently visited
    if(typeof RECENT!=='undefined') RECENT.track(id);
  }

  return {
    go(id,label){ _dir='forward'; stack.push({id,label}); history.pushState({stack:[...stack]},''); show(id); },
    back(){ if(typeof LP!=='undefined'&&LP.isOpen()){ LP.back(); return; } if(typeof PAUSE!=='undefined'&&_activeEl&&_activeEl.id==='v-pause'&&PAUSE.back()) return; if(!stack.length) return; _dir='back'; stack.pop(); show(stack.length?stack[stack.length-1].id:'v-home'); },
    jumpTo(idx){ _dir=idx<stack.length-1?'back':'forward'; stack=stack.slice(0,idx+1); history.pushState({stack:[...stack]},''); show(idx>=0?stack[idx].id:'v-home'); },
    home(){ _dir='back'; stack=[]; history.pushState({home:true},''); show('v-home'); },
    tab(id,label){ _dir='forward'; stack=[{id,label}]; history.pushState({stack:[...stack]},''); show(id); },
    depth(){ return stack.length; },
    _restoreStack(s){ _dir='back'; stack=s; show(s.length?s[s.length-1].id:'v-home'); }
  };
})();

history.replaceState({home:true},'');
window.addEventListener('popstate',function(e){
  if(typeof LIGHTBOX!=='undefined'&&LIGHTBOX.isOpen()){ LIGHTBOX.close(true); return; }
  if(typeof OVL!=='undefined'&&OVL.onPop(e,NAV.depth())) return;
  if(e.state&&e.state.stack){
    // Restore stack from state and show the top view
    const s=e.state.stack;
    NAV._restoreStack(s);
  } else {
    NAV._restoreStack([]);
  }
});

/* ======================================================================
   SIMULATOR ENGINE – 8 SZENARIEN
   ======================================================================
   STRUKTUR EINES KNOTENS:
     phase      {1-4}    – Phasenleiste
     title      {string} – Szenentitel
     scene      {string} – HTML-Situationsbeschreibung
     question   {string} – Entscheidungsfrage
     options    {Array}  – Auswahlmöglichkeiten:
       letter     : Beschriftung
       text       : Anzeigetext
       quality    : 'good'|'neutral'|'bad'|'restart'
       scoreDelta : Punktveränderung (±)
       feedback   : Konsequenzbeschreibung
       theory     : Theoretische Einordnung
       next       : ID des nächsten Knotens
     isEnd      {bool}   – Endknoten → Auswertungsscreen
     endScore   {string} – 'good'|'neutral'|'bad'

   UM EIN NEUES SZENARIO ZU ERGÄNZEN:
     1. Im SCENARIOS-Objekt einen neuen Key anlegen
     2. Startknoten definieren (wird automatisch als 'start' gesucht)
     3. Knoten via next verketten · isEnd+endScore für Abschluss setzen
====================================================================== */
const SCENARIOS = {

/* ------------------------------------------------------------------
   SZENARIO 1: SCHMIDT / MÜLLER (Generationenkonflikt)
------------------------------------------------------------------ */
schmidt: {
  label: 'Szenario 01 – Konflikt Schmidt / Müller',
  start: 'start',
  nodes: {
    'start':{ phase:1, title:'🚨 08:15 – Büro des B-Dienstes',
      scene:`<p>Dein Stellvertreter: <em>„OBM Fritz Schmidt (52 J., 30 Dienstjahre, Ausbilder) hat WAL Müller lautstark vor der Mannschaft konfrontiert. Thema: Monatelange RD-Einteilung trotz BrK-Qualifikation. Gespräch eskaliert, Schmidt gegangen. Heute: Eisstimmung."</em></p><div class="scene-ib"><strong>Deine Rolle:</strong> B-Dienst – Gesamtverantwortung für diese Wache.</div>`,
      question:'Was ist dein erster Schritt?',
      options:[
        {letter:'A',text:'Faktenerhebung: Schichtpläne (3 Monate), Qualifikationen, Rücksprache WAL – vor jeder Handlung.',quality:'good',scoreDelta:+20,theory:'Führungsprinzip: Situationsanalyse vor Handlung. Erwachsenen-Ich (ErI) – sachliche Informationsbeschaffung.',feedback:'Proaktiv und faktenbasiert – der einzig richtige erste Schritt!',next:'p1_analyse'},
        {letter:'B',text:'Müller sofort anrufen: „Schmidt kommt ab morgen zurück in BrK-Schichten – Ende."',quality:'bad',scoreDelta:-15,theory:'Kritisches EI (kEI→aKI): Symptombehandlung ohne Analyse. Müllers Autorität wird übergangen.',feedback:'Reaktives Handeln ohne Fakten – Führungsversagen.',next:'p1_schnellfix'},
        {letter:'C',text:'Beide sofort gemeinsam ins Büro: „Das klären wir jetzt."',quality:'bad',scoreDelta:-10,theory:'Glasl: Konfrontation ohne Einzelgespräche eskaliert den Konflikt weiter.',feedback:'Ohne Vorbereitung eskaliert das sofort.',next:'p1_konfrontation'},
        {letter:'D',text:'Abwarten – solche Spannungen lösen sich meist von selbst.',quality:'bad',scoreDelta:-20,theory:'Glasl: Passivität bei Stufe 2–3 führt sicher zu Koalitionsbildung (Stufe 4).',feedback:'Untätigkeit ist keine Führungsstrategie.',next:'p1_abwarten'}
      ]},
    'p1_schnellfix':{ phase:1, title:'⚡ Schnell-Lösung – Rebound-Effekt',
      scene:`<p>Müller am Telefon: <em>„Das können Sie nicht einfach entscheiden! Drei Langzeitkranke – ich hatte keine andere Wahl!"</em></p><div class="scene-ib warn"><strong>Bewertung:</strong> Reaktion ohne Fakten untergräbt Müllers Autorität. Das Kernproblem bleibt ungelöst.</div>`,
      question:'Du erkennst deinen Fehler. Was jetzt?',
      options:[
        {letter:'A',text:'Entschuldigung bei Müller, Rücknahme der Entscheidung, Neustart mit Faktenerhebung.',quality:'good',scoreDelta:+5,theory:'Fehlerkultur (BGM): Eigene Fehler korrigieren ist Führungsstärke.',feedback:'Mutige Korrektur – du rettest das Vertrauen.',next:'p1_analyse'},
        {letter:'B',text:'An der Entscheidung festhalten – ich bin der B-Dienst.',quality:'bad',scoreDelta:-20,theory:'Glasl 4–5: Beharren aus Prestigegründen. Müller sucht Koalitionspartner.',feedback:'Führungskrise vorprogrammiert.',next:'p1_eskalation'}
      ]},
    'p1_abwarten':{ phase:1, title:'⏳ 48h später – Lager bilden sich',
      scene:`<p>Schmidt: krankgemeldet. Zwei Kollegen offen hinter Schmidt, Jüngere hinter Müller. Dein Vorgesetzter: <em>„Was ist auf Wache 2 los?"</em></p><div class="scene-ib warn"><strong>Glasl-Stufe 4:</strong> Koalitionsbildung durch Untätigkeit. Externe Moderation empfohlen.</div>`,
      question:'Du musst jetzt handeln.',
      options:[{letter:'A',text:'Sofortige Sachverhaltserhebung, Einzelgespräche, ggf. Personalrat einbeziehen.',quality:'neutral',scoreDelta:-5,theory:'Spät aber richtig. Ab Glasl-Stufe 4 externe Moderation sinnvoll.',feedback:'Richtig – aber 48 Stunden zu spät.',next:'p1_analyse'}]},
    'p1_konfrontation':{ phase:1, title:'💥 Unvorbereitetes Gespräch',
      scene:`<p>Nach 45 Sekunden: Schmidt beginnt, Müller unterbricht. Dir fehlen Fakten und Regeln.</p><div class="scene-ib warn"><strong>TA:</strong> Beide im aKI – kein ErI in Sicht.</div>`,
      question:'Wie reagierst du?',
      options:[
        {letter:'A',text:'Gespräch abbrechen: „Heute sind wir nicht bereit. Wir vertagen." Dann Fakten erheben.',quality:'good',scoreDelta:+5,theory:'Deeskalation: Bewusstes Stoppen ist Führungsstärke.',feedback:'Mutig und richtig gestoppt.',next:'p1_analyse'},
        {letter:'B',text:'Als Moderator versuchen, das Gespräch auf die Sachebene zu zwingen.',quality:'bad',scoreDelta:-12,theory:'Ohne Vorbereitung und Regeln scheitert jede Moderation.',feedback:'Das Gespräch eskaliert vollends.',next:'p1_eskalation'}
      ]},
    'p1_eskalation':{ phase:1, title:'🔴 Eskalation – Glasl 4–5', isEnd:true, endScore:'bad',
      scene:`<p>Situation außer Kontrolle. Schmidt krankgemeldet, Müller hat Beschwerde eingereicht. Du wirst einbestellt.</p><div class="scene-ib err"><strong>Spielende – Führungsversagen.</strong> Frühes, faktenbasiertes Handeln ist der Schlüssel.</div>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'start'}]},
    'p1_analyse':{ phase:1, title:'🔍 Faktenerhebung – Ergebnis',
      scene:`<p>Erkenntnisse:<ul class="scene-list"><li>Schmidt: <strong>78% im RD</strong> der letzten 3 Monate</li><li>Müller: <strong>drei Langzeitkranke</strong> gleichzeitig – operativer Engpass</li><li>Schmidt: Qualifikation GrF BrK, <strong>15 Jahre Ausbilder</strong></li><li>Schmidt wurde <strong>nie vorab informiert</strong></li><li>Kein MAG in dieser Dienstzeit</li></ul></p><div class="scene-ib"><strong>Schulz von Thun:</strong> Müller handelte sachlich korrekt, ignorierte die Beziehungsebene. Schmidt empfing: „Du bist mir egal."</div>`,
      question:'Wie beginnst du Phase 2?',
      options:[
        {letter:'A',text:'Zuerst Einzelgespräch mit Schmidt: vollständig zuhören.',quality:'good',scoreDelta:+15,theory:'Goldstandard: Einzelgespräche vor Mediationsgespräch. Gibt jeder Partei Raum ohne Druck.',feedback:'Goldstandard der Konfliktmoderation!',next:'p2_schmidt'},
        {letter:'B',text:'Zuerst Einzelgespräch mit Müller.',quality:'neutral',scoreDelta:+8,theory:'Vertretbar, aber Schmidt als verletzte Partei zuerst ist stärkeres Empathiesignal.',feedback:'In Ordnung – aber Schmidt wartet länger.',next:'p2_mueller_erst'}
      ]},
    'p2_mueller_erst':{ phase:2, title:'🗣️ Einzelgespräch – WAL Müller',
      scene:`<p>Müller: <em>„Ich habe nach Bedarf gehandelt. Drei Kranke gleichzeitig – Schmidt ist für beides qualifiziert. Ich dachte, er versteht das."</em></p><div class="scene-ib"><strong>Watzlawick Axiom 2:</strong> Müller handelte sachlich (Inhaltsaspekt), ignorierte den Beziehungsaspekt vollständig.</div>`,
      question:'Wie reagierst du?',
      options:[
        {letter:'A',text:'"Herr Müller, die sachliche Entscheidung war nachvollziehbar. Was wäre anders gewesen, wenn Sie Schmidt vorab kurz informiert hätten?"',quality:'good',scoreDelta:+12,theory:'ErI→ErI: Du würdigst die Sachentscheidung und öffnest Selbstreflexion ohne Beschämung.',feedback:'Sehr gut – du erzeugst Erkenntnis ohne Anklage.',next:'p2_schmidt'},
        {letter:'B',text:'"Das war ein Führungsfehler. Sie hätten Schmidt informieren müssen."',quality:'bad',scoreDelta:-8,theory:'kEI: Beschämung führt zu Abwehrhaltung im Mediationsgespräch.',feedback:'Sachlich richtig, falscher Ton.',next:'p2_schmidt'}
      ]},
    'p2_schmidt':{ phase:2, title:'🗣️ Einzelgespräch – OBM Schmidt',
      scene:`<p>Schmidt, Arme verschränkt: <em>„Ich nehme an, Sie wollen mir erklären, warum ich Unrecht habe."</em></p><div class="scene-ib"><strong>TA:</strong> Schmidt im aKI (rebellisch) – erwartet kEI. Diese Erwartung gilt es zu durchbrechen.</div>`,
      question:'Wie eröffnest du?',
      options:[
        {letter:'A',text:'"Herr Schmidt, ich bin hier um zuzuhören. Erzählen Sie mir, was Sie in den letzten Monaten erlebt haben."',quality:'good',scoreDelta:+20,theory:'ErI→ErI: Offene Frage durchbricht aKI-Erwartung. Psychologische Sicherheit (BELLA-B).',feedback:'Perfekte Eröffnung. Schmidt öffnet sich.',next:'p2_zuhoeren'},
        {letter:'B',text:'"Herr Schmidt, Ihr Verhalten gestern war problematisch – aber ich verstehe Ihre Frustration."',quality:'bad',scoreDelta:-10,theory:'Das „Aber" negiert die Empathie vollständig. Schmidt bleibt im aKI.',feedback:'„Aber" zerstört das Zuhörangebot.',next:'p2_verschlossen'},
        {letter:'C',text:'"Machen Sie sich keine Sorgen – das kriegen wir hin."',quality:'bad',scoreDelta:-15,theory:'nEI: Bagatellisierung. Schmidts verletzter Berufsstolz nicht ernst genommen.',feedback:'Schmidt fühlt sich nicht ernst genommen.',next:'p2_verschlossen'}
      ]},
    'p2_verschlossen':{ phase:2, title:'🚪 Schmidt schließt sich ab',
      scene:`<p>Einsilbige Antworten. Nach 12 Min: <em>„Wenn das alles ist…"</em></p><div class="scene-ib warn"><strong>Bewertung:</strong> Chance verpasst. Mediation wird deutlich schwieriger.</div>`,
      question:'Wie rettest du das Gespräch?',
      options:[
        {letter:'A',text:'"Herr Schmidt – Stopp. Ich habe das falsch angefangen. Ich möchte wirklich verstehen, was Sie erlebt haben."',quality:'good',scoreDelta:+6,theory:'Selbstkorrektur in Echtzeit: Authentisches Eingestehen erzeugt Vertrauen.',feedback:'Mutig und richtig. Schmidt öffnet sich zögernd.',next:'p2_zuhoeren'},
        {letter:'B',text:'Schmidt gehen lassen und Mediation trotzdem ansetzen.',quality:'bad',scoreDelta:-15,theory:'Ohne Vertrauen bleibt Mediation oberflächlich.',feedback:'Grundlage für echte Mediation fehlt.',next:'p3_schlecht'}
      ]},
    'p2_zuhoeren':{ phase:2, title:'👂 Schmidt öffnet sich',
      scene:`<p>Schmidt: <em>„15 Jahre war ich Ausbilder. Letzte Woche hat mich ein Azubi im RD eingewiesen – vor der Mannschaft. Niemand hat mal ‚Fritz, wir brauchen dich kurz' gesagt. Ich wurde umgestellt wie ein Möbelstück."</em></p><div class="scene-ib"><strong>Schulz von Thun (4 Seiten):</strong><br>· Sache: „Zu viel RD-Einteilung"<br>· <em>Selbstoffenbarung (Kern):</em> „Ich bin entwürdigt und wertlos"<br>· Beziehung: „Du respektierst mich nicht"<br>· Appell: „Erkenne meinen Wert!"</div>`,
      question:'Welche Ebene ist Schmidts Kernbotschaft?',
      options:[
        {letter:'A',text:'Sachebene: Schmidt will mehr BrK-Einsätze.',quality:'bad',scoreDelta:-5,theory:'Nur Oberfläche – Sachebene-Lösungen lösen den emotionalen Kern nicht.',feedback:'Zu oberflächlich.',next:'p2_vertiefung'},
        {letter:'B',text:'Selbstoffenbarungsebene: Schmidts Identität als Fachkraft ist verletzt.',quality:'good',scoreDelta:+20,theory:'Schulz von Thun: Die Selbstoffenbarung trägt die emotionale Wahrheit. Erst wenn anerkannt, wirkt die Sachlösung.',feedback:'Exzellente Analyse – du hast das eigentliche Problem gefunden.',next:'p2_abschluss'},
        {letter:'C',text:'Appell: Schmidt will Dienstplanänderung.',quality:'neutral',scoreDelta:+5,theory:'Appell sichtbar, aber Folge des verletzten Selbstwerts.',feedback:'Teilrichtig – nicht tief genug.',next:'p2_vertiefung'}
      ]},
    'p2_vertiefung':{ phase:2, title:'🔎 Vertiefung',
      scene:`<p>Du hast die Oberfläche, aber nicht den Kern erfasst.</p><div class="scene-ib"><strong>Tipp:</strong> „Ich werde benachteiligt" bedeutet auf der Selbstoffenbarungsebene: „Ich fühle mich als Person nicht wertgeschätzt."</div>`,
      question:'',
      options:[{letter:'A',text:'"Ich höre die Einteilung. Aber ich höre auch: Sie fühlen sich als Person nicht wertgeschätzt – ist das richtig?"',quality:'good',scoreDelta:+12,theory:'Paraphrase der Selbstoffenbarungsebene: Schmidt fühlt sich verstanden.',feedback:'Gut nachgebessert. Schmidt: „Ja. Genau das."',next:'p2_abschluss'}]},
    'p2_abschluss':{ phase:2, title:'✅ Basis gelegt',
      scene:`<p>Schmidt: <em>„Ich bin nicht nachtragend. Wenn künftig kommuniziert wird – ziehe ich mit."</em></p><p>Schmidt agiert jetzt aus dem ErI. Basis für Mediation gelegt.</p>`,
      question:'Wie bereitest du die Mediation vor?',
      options:[
        {letter:'A',text:'Drei klare Spielregeln (Ich-Botschaften, nicht unterbrechen, lösungsorientiert), neutraler Raum, beide vorab informiert.',quality:'good',scoreDelta:+15,theory:'Mediationsvorbereitung: Regeln schaffen psychologische Sicherheit.',feedback:'Professionelle Vorbereitung!',next:'p3_gut'},
        {letter:'B',text:'Gute Stimmung nutzen und spontan einladen.',quality:'neutral',scoreDelta:+3,theory:'Ohne Regeln können alte Muster unter Druck zurückkehren.',feedback:'Möglich, aber riskant.',next:'p3_okay'}
      ]},
    'p3_gut':{ phase:3, title:'🤝 Mediation – Gut vorbereitet',
      scene:`<p>Regeln bekannt, Atmosphäre respektvoll. Müller erklärt sachlich. Schmidt: <em>„Ein Gespräch vorher wäre drin gewesen!"</em></p><div class="scene-ib"><strong>Karpman:</strong> Schmidt tendiert zur Opferrolle, Müller unbewusst in die Verfolgerposition.</div>`,
      question:'Schmidt spricht emotional. Wie moderierst du?',
      options:[
        {letter:'A',text:'"Herr Müller – was wäre konkret anders gewesen, wenn Sie Schmidt vorab informiert hätten?"',quality:'good',scoreDelta:+15,theory:'ErI-Frage ohne Anklage. Müller zur Selbsterkenntnis führen, ohne Partei zu ergreifen.',feedback:'Souveräne Moderation.',next:'p3_kernmoment'},
        {letter:'B',text:'"Herr Schmidt hat recht – das war schlechte Kommunikation, Herr Müller."',quality:'bad',scoreDelta:-10,theory:'Parteinahme: Du verlässt die neutrale Moderatorenrolle.',feedback:'Müller geht in Abwehr.',next:'p3_schlecht'},
        {letter:'C',text:'"Das können wir nicht mehr ändern – schauen wir nach vorne."',quality:'neutral',scoreDelta:+3,theory:'Zu hastig – Schmidts Bedürfnis nach Anerkennung übersprungen.',feedback:'Gespräch geht weiter, Schmidt nicht gehört.',next:'p3_kernmoment'}
      ]},
    'p3_okay':{ phase:3, title:'🤝 Spontaner Start',
      scene:`<p>Schmidt unterbricht Müller ohne Regeln.</p>`,
      question:'Schmidt unterbricht. Wie reagierst du?',
      options:[{letter:'A',text:'Regeln jetzt einführen: „Einer redet, der andere hört zu – einverstanden?"',quality:'good',scoreDelta:+8,theory:'Nachträgliche Strukturgebung: besser jetzt als nie.',feedback:'Gut gerettet.',next:'p3_kernmoment'}]},
    'p3_kernmoment':{ phase:3, title:'💬 Der entscheidende Moment',
      scene:`<p>Müller nach einer Pause: <em>„Herr Schmidt… ich hätte Ihnen das erklären müssen. Das war mein Fehler."</em></p><p>Stille. Schmidt schaut auf.</p><div class="scene-ib"><strong>TA:</strong> Müller im ErI – übernimmt Verantwortung. Schmidt kann jetzt aus dem ErI antworten.</div>`,
      question:'Wie nutzt du diesen Moment?',
      options:[
        {letter:'A',text:'"Herr Schmidt – was möchten Sie Herrn Müller darauf antworten?"',quality:'good',scoreDelta:+15,theory:'Minimalintervention: Dieser Moment gehört den Beteiligten.',feedback:'Brillant. Schmidt: „Danke. Das höre ich gerne."',next:'p3_vereinbarung'},
        {letter:'B',text:'"Das ist ein wichtiger Schritt. Herr Müller hat Verantwortung übernommen."',quality:'neutral',scoreDelta:+5,theory:'Gut gemeint, unterbricht aber einen kostbaren Moment.',feedback:'Etwas zu viel Moderation.',next:'p3_vereinbarung'}
      ]},
    'p3_schlecht':{ phase:3, title:'💔 Mediation gescheitert',
      scene:`<p>Eskaliert. Schmidt hat Büro verlassen. Glasl Stufe 5.</p><div class="scene-ib warn"><strong>Glasl 5:</strong> Externe Mediation jetzt zwingend.</div>`,
      question:'Nächster Schritt?',
      options:[{letter:'A',text:'Externe Mediation beauftragen (Personalrat, Betriebspsychologe).',quality:'neutral',scoreDelta:-5,theory:'Ab Glasl-Stufe 4–5 externe Intervention korrekt.',feedback:'Richtig erkannt – aber teuer erkauft.',next:'p4_massnahmen'}]},
    'p3_vereinbarung':{ phase:3, title:'📋 Ergebnissicherung',
      scene:`<p>Schmidt: „Wenn das künftig so läuft – bin ich dabei." Müller: „Ich werde künftig das Gespräch suchen."</p><div class="scene-ib"><strong>Glasl:</strong> Rückkehr zu Stufe 1 – Win-Win.</div>`,
      question:'Wie sicherst du das Ergebnis?',
      options:[
        {letter:'A',text:'Schriftliche Vereinbarung: Maßnahmen, Zeitplan, Verantwortlichkeiten – beide unterschreiben.',quality:'good',scoreDelta:+15,theory:'Verbindlichkeit schafft Nachhaltigkeit. Mündliche Vereinbarungen verblassen.',feedback:'Professionelle Ergebnissicherung!',next:'p4_massnahmen'},
        {letter:'B',text:'Handschlag reicht – beide sind Profis.',quality:'bad',scoreDelta:-8,theory:'Beim nächsten Stressor ohne externen Anker: alte Muster kehren zurück.',feedback:'Zu informell.',next:'p4_massnahmen'}
      ]},
    'p4_massnahmen':{ phase:4, title:'🏗️ Strukturelle Maßnahmen',
      scene:`<p>Amtsleitung erwartet Konzept zur Prävention künftiger Konflikte.</p><div class="scene-ib"><strong>BGM:</strong> Konflikt ist Symptom systemischer Probleme – fehlende Kommunikationskultur, mangelnde Wertschätzung erfahrener Kräfte.</div>`,
      question:'Dein Maßnahmenpaket?',
      options:[
        {letter:'A',text:'Monatliche Dienstbesprechungen einführen.',quality:'bad',scoreDelta:-12,theory:'Zu oberflächlich: Ein Instrument ohne strukturelle Tiefe.',feedback:'Das strukturelle Problem bleibt.',next:'p4_mittel'},
        {letter:'B',text:'Umfassendes Paket: Mentoring-Rolle für Schmidt, transparenter Dienstplan-Review-Prozess, BGM-Stressprävention, Onboarding-Konzept mit Erfahrenen als Mentoren.',quality:'good',scoreDelta:+25,theory:'Alle 4 BGM-Säulen (Gesundheit, Werte, Arbeitsbedingungen, Kompetenz). Schmidt von Problem zu Ressource. SMART-Ziele anwendbar.',feedback:'Exzellentes nachhaltiges Konzept!',next:'p4_gut'},
        {letter:'C',text:'PSNV-Schulungen als teambildende Maßnahme.',quality:'neutral',scoreDelta:+6,theory:'Sinnvoll, aber als alleinige Antwort unzureichend.',feedback:'Sinnvoll, allein nicht ausreichend.',next:'p4_mittel'}
      ]},
    'p4_gut':{ phase:4, isEnd:true, endScore:'good', title:'🏆 Hervorragend bestanden!',
      scene:`<p>Amtsleitung nimmt das Konzept an. Schmidt übernimmt Mentoring-Rolle. Müller etabliert transparente Kommunikation. Drei Monate später: <em>„Seit ich die Neuen ausbilde, macht der Dienst wieder Spaß. Danke."</em></p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'start'}]},
    'p4_mittel':{ phase:4, isEnd:true, endScore:'neutral', title:'🥈 Befriedigend – Potenzial vorhanden',
      scene:`<p>Akuter Konflikt gelöst. Sechs Monate später: ähnliche Spannungen. Amtsleitung mahnt dauerhaftere Konzepte an.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'start'}]}
  }
},

/* ------------------------------------------------------------------
   SZENARIO 2: RESSOURCEN-DILEMMA
------------------------------------------------------------------ */
ressourcen: {
  label: 'Szenario 02 – Ressourcen-Dilemma',
  start: 'r_start',
  nodes: {
    'r_start':{ phase:1, title:'🔥 22:47 Uhr – Leitstelle meldet zwei simultane Großlagen',
      scene:`<p><strong>Lage A:</strong> Wohnhausbrand, 4-geschossig, Vollbrand 3. OG, 2 Personen noch vermisst (Meldung Nachbar). <strong>Lage B:</strong> Gefahrgutunfall BAB, LKW mit Chlorgas-Behälter, Leck, 500m Sicherheitsbereich, keine Verletzten gemeldet.</p><p>Verfügbar: <strong>eine Staffel</strong>, <strong>ein HLF</strong>, kein TLF vor Ort, Nachbaralarmierung läuft (ETA 18 Min).</p><div class="scene-ib"><strong>Deine Rolle:</strong> Du bist der B-Dienst und einzige Führungsperson auf der Leitstelle. Entscheidung jetzt.</div>`,
      question:'Welche Priorität setzt du?',
      options:[
        {letter:'A',text:'Staffel sofort zum Wohnhausbrand (Personenrettung Priorität). Gefahrgut: Nachbarn alarmieren, Sperrbereich durch Polizei sichern, eigene Kräfte erst bei Eintreffen Verstärkung.',quality:'good',scoreDelta:+25,theory:'Führungsprinzip: Leben vor Sachwerten. FwDV 3: Menschenrettung hat absoluten Vorrang. Gefahrgut ohne Leck-Progression und ohne bestätigte Verletzte kann mit Absperrung initial überbrückt werden.',feedback:'Richtig priorisiert – Menschen retten hat immer Vorrang.',next:'r_einsatz'},
        {letter:'B',text:'Staffel aufteilen: 3 Mann zum Brand, 3 Mann Gefahrgut.',quality:'bad',scoreDelta:-15,theory:'FwDV: Staffel ist die kleinste taktische Einheit. Aufteilung gefährdet beide Gruppen und ist taktisch kontraproduktiv. Kein Angriffstrupp unter UPA.',feedback:'Gefährlich – unter Normbesatzung sind beide Gruppen nicht handlungsfähig.',next:'r_fehler'},
        {letter:'C',text:'Gefahrgut zuerst – unkontrolliertes Chlorgas ist die größere Gefahr für viele Menschen.',quality:'bad',scoreDelta:-10,theory:'Nachvollziehbar, aber: 2 bestätigte Vermisste im Wohnhaus sind eine unmittelbare Lebensgefahr. Gefahrgut ist durch Sperrzone und Evakuierung initial beherrschbar.',feedback:'Die bestätigten Vermissten im Wohnhaus werden nicht gerettet – moralisch nicht vertretbar.',next:'r_fehler'}
      ]},
    'r_einsatz':{ phase:2, title:'🚒 Wohnhausbrand – erste Erkenntnisse',
      scene:`<p>Staffel vor Ort. GF Bericht: <em>„Feuer im 3. OG, Treppenhaus verraucht. Nachbar meldet: zwei Kinder im 2. OG. Treppenhaus nicht begehbar."</em></p><p>Verstärkung ETA: noch 12 Minuten. Drehleiter: ETA 8 Minuten.</p>`,
      question:'Deine Führungsanweisung?',
      options:[
        {letter:'A',text:'Rettung über Leiter an der Außenfassade 2. OG vorbereiten. Trupps sichern, Löschangriff parallel, Drehleiter Treffpunkt bestätigen. Gefahrgut: Polizei bestätigt Sperrzone, Fachberater-Anforderung läuft.',quality:'good',scoreDelta:+20,theory:'Parallele Führung: Aktive Maßnahmen für unmittelbare Lage + vorausschauende Planung für Lage B. Ressourcenmanagement unter Druck.',feedback:'Exzellente Führung unter Zeitdruck – parallele Maßnahmen optimal koordiniert.',next:'r_entscheidung'},
        {letter:'B',text:'Alle Ressourcen auf Rettung. Gefahrgut komplett ausblenden bis Verstärkung da.',quality:'neutral',scoreDelta:+8,theory:'Vertretbar bei unmittelbarer Lebensgefahr, aber Gefahrgut kann sich entwickeln – Monitoring mindestens sicherstellen.',feedback:'Richtige Priorität, aber Gefahrgut vollständig ausblenden ist riskant.',next:'r_entscheidung'}
      ]},
    'r_fehler':{ phase:2, title:'⚠️ Führungsfehler – Kurskorrektur nötig',
      scene:`<p>Deine initiale Entscheidung hat Probleme verursacht. Eine Korrektur ist nötig.</p><div class="scene-ib warn"><strong>Hinweis:</strong> Im Einsatz sind Kurskorrekturen möglich und manchmal notwendig – aber sie kosten Zeit.</div>`,
      question:'Wie korrigierst du?',
      options:[{letter:'A',text:'Sofortige Neubewertung: Staffel vollständig zum Wohnhausbrand, Gefahrgut über Polizei absichern.',quality:'neutral',scoreDelta:+5,theory:'Kurskorrektur kostet Zeit, ist aber der richtige Schritt.',feedback:'Richtige Korrektur – Zeit geht verloren.',next:'r_entscheidung'}]},
    'r_entscheidung':{ phase:3, title:'⏱️ Verstärkung trifft ein – Gesamtlage bewerten',
      scene:`<p>Kinder wurden gerettet (über externe Leiter). Brand unter Kontrolle. Gefahrgut: Chlorgas-Leck hat zugenommen, Windrichtung ungünstig – 200 weitere Bewohner betroffen.</p><div class="scene-ib"><strong>Führungsaufgabe jetzt:</strong> Ressourcenzuteilung für die nächste Phase.</div>`,
      question:'Wie verteilst du die Einsatzkräfte?',
      options:[
        {letter:'A',text:'Brandbekämpfung: 1. Zug. Gefahrgut: 2. Zug (Spezialkräfte voraus). Evakuierung: Polizei + Rettungsdienst. Führung: klare Sektorenbildung mit eigenem Einsatzleiter je Abschnitt.',quality:'good',scoreDelta:+20,theory:'Führungsprinzip: Dezentralisierung unter klarer Gesamtkoordination. Sektorenführung entlastet den B-Dienst und ermöglicht parallele Handlungsfähigkeit.',feedback:'Professionelle Ressourcenzuteilung – Sektoren klar definiert.',next:'r_nachbereitung'},
        {letter:'B',text:'Alle Kräfte erst Brand fertig löschen, dann Gefahrgut.',quality:'bad',scoreDelta:-10,theory:'Sequentielles Denken bei simultanen Lagen ist gefährlich. Gefahrgut kann exponentiell werden.',feedback:'Gefahrgut-Lage eskaliert während Brand bekämpft wird.',next:'r_nachbereitung'}
      ]},
    'r_nachbereitung':{ phase:4, title:'📋 Einsatznachbereitung',
      scene:`<p>Beide Lagen beherrscht. Alle Personen gerettet. Gefahrgut gesichert. Keine eigenen Kräfte verletzt.</p>`,
      question:'Was ist dein wichtigster nächster Schritt als Führungskraft?',
      options:[
        {letter:'A',text:'Strukturierte Nachbesprechung (Demobilisation) für alle Einsatzkräfte. Erkenntnisse dokumentieren. PSNV-Angebot für beteiligte Kräfte.',quality:'good',scoreDelta:+15,theory:'PSNV: Sekundäre PSNV für Einsatzkräfte nach belastenden Lagen. Lessons-Learned für Organisationslernen.',feedback:'Vorbildlich – technisch und psychosozial.',next:'r_ende_gut'},
        {letter:'B',text:'Kurzen Dank aussprechen und Kräfte nach Hause schicken.',quality:'neutral',scoreDelta:+3,theory:'Menschlich verständlich, aber ohne strukturierte Nachbesprechung gehen Erkenntnisse verloren.',feedback:'Gut gemeint, aber Lernchance und PSNV verpasst.',next:'r_ende_mittel'}
      ]},
    'r_ende_gut':{ phase:4, isEnd:true, endScore:'good', title:'🏆 Exzellente Einsatzführung!',
      scene:`<p>Beide Lagen erfolgreich bewältigt. Alle Personen gerettet. Strukturierte Nachbereitung abgeschlossen. Lessons Learned für künftige Paralleleinsätze dokumentiert.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'r_start'}]},
    'r_ende_mittel':{ phase:4, isEnd:true, endScore:'neutral', title:'🥈 Befriedigend',
      scene:`<p>Einsatz bewältigt, Verluste vermieden. Strukturelle Optimierungspotenziale nicht genutzt.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'r_start'}]}
  }
},

/* ------------------------------------------------------------------
   SZENARIO 3: FÜHRUNGSFEHLER IM STAB
------------------------------------------------------------------ */
stab: {
  label: 'Szenario 03 – Führungsfehler im Stab',
  start: 's_start',
  nodes: {
    's_start':{ phase:1, title:'🏛️ Stab – 14:30 Uhr – Chemieunfall · 3. Stunde',
      scene:`<p>Großschadenslage: Chemiewerk, Ammoniakaustritt, 800 Verletzte, Massenanfall. Im Stabsraum eskaliert seit 20 Minuten ein Streit: S3 (OBM Kaufmann) und Einsatzleiter Rettungsdienst (Dr. Weber) sind offen in Konflikt über die Triage-Priorisierung.</p><p>Kaufmann: <em>„Wir brauchen die Rettungswagen für die T1-Patienten – nicht für diese sinnlosen T3-Transporte!"</em> Dr. Weber: <em>„Sie haben keine medizinische Ausbildung und haben hier rein gar nichts zu entscheiden!"</em></p><div class="scene-ib"><strong>Watzlawick Axiom 1:</strong> Beide kommunizieren – auch ihr Schweigen wäre eine Botschaft. Der Stab funktioniert gerade nicht.</div>`,
      question:'Wie reagierst du als B-Dienst?',
      options:[
        {letter:'A',text:'Unmittelbar: laut und klar: „Stopp. Beide. Jetzt." – Ruhe herstellen, dann kurze Auszeit von 5 Minuten anordnen, beide separat kurz sprechen.',quality:'good',scoreDelta:+20,theory:'Watzlawick: „Man kann nicht nicht kommunizieren." Deine Intervention sendet sofort die Botschaft: Diese Führungskultur toleriere ich nicht. 5 Min Pause reduziert Kortisolspiegel.',feedback:'Richtig und mutig. Der Stab atmet durch.',next:'s_deeskalation'},
        {letter:'B',text:'Das Gespräch weiter beobachten – vielleicht löst es sich von selbst.',quality:'bad',scoreDelta:-15,theory:'Glasl: Passivität bei Stufe 4–5 lässt den Konflikt weiter eskalieren. Im Stab ist das existenzgefährdend für die Einsatzführung.',feedback:'Der Stab ist dysfunktional. Führungsversagen.',next:'s_eskalation'},
        {letter:'C',text:'Dr. Weber Recht geben – er hat die medizinische Expertise.',quality:'bad',scoreDelta:-10,theory:'Parteinahme zerstört die Neutralität der Stabsführung. Kaufmann verliert jede Legitimation.',feedback:'Parteinahme vergiftet das Stabsklima dauerhaft.',next:'s_fehler'}
      ]},
    's_deeskalation':{ phase:2, title:'⏸️ 5-Minuten-Auszeit',
      scene:`<p>Du hast kurz mit beiden einzeln gesprochen. Kaufmann: <em>„Ich mache mir Sorgen, dass die falschen Patienten priorisiert werden."</em> Dr. Weber: <em>„Ich fühle mich in meiner Fachkompetenz übergangen."</em></p><div class="scene-ib"><strong>Schulz von Thun Selbstoffenbarung:</strong> Kaufmann → Sorge um Einsatzerfolg. Weber → verletzter Expertenstolz. Sachkonflikt als Deckmantel für Beziehungskonflikt.</div>`,
      question:'Wie steuerst du das Gespräch beim Neustart?',
      options:[
        {letter:'A',text:'"Gentlemen – wir haben 800 Patienten. Ihre fachlichen Einschätzungen brauchen wir beide. Ich schlage vor: Dr. Weber definiert die medizinische Triage-Reihenfolge, Herr Kaufmann koordiniert die Fahrzeugzuteilung. Entscheidungsprozess klar?"',quality:'good',scoreDelta:+25,theory:'Rollenklarheit nach Watzlawick Axiom 2: Beziehungsaspekt klären (wer entscheidet was) bevor Sachfragen gelöst werden können. Beide Expertisen werden legitimiert.',feedback:'Exzellent. Klare Rollenverteilung – Stab funktioniert wieder.',next:'s_zusammenarbeit'},
        {letter:'B',text:'"Bitte keine persönlichen Angriffe mehr – das ist eine Dienstanweisung."',quality:'neutral',scoreDelta:+8,theory:'Symptombehandlung: Der Rollenkonflikt bleibt ungelöst. Funktioniert kurzfristig, aber der Stab ist weiter fragil.',feedback:'Kurzfristig Ruhe, aber der Konflikt schwelt weiter.',next:'s_zusammenarbeit'}
      ]},
    's_fehler':{ phase:2, title:'⚠️ Parteinahme – Kurskorrektur',
      scene:`<p>Kaufmann hat den Stabsraum verlassen. S3-Funktion unbesetzt. Einsatz läuft weiter.</p><div class="scene-ib warn"><strong>Glasl 5:</strong> Durch Parteinahme wurde der Konflikt eskaliert statt gelöst.</div>`,
      question:'Sofortmaßnahme?',
      options:[{letter:'A',text:'Kaufmann zurückholen, Entschuldigung für Parteinahme, klare Rollenverteilung definieren.',quality:'neutral',scoreDelta:+5,theory:'Korrektur ist möglich und notwendig. Kostet Zeit und Vertrauen.',feedback:'Richtige Korrektur – verzögert.',next:'s_zusammenarbeit'}]},
    's_eskalation':{ phase:2, title:'💥 Stab dysfunktional',
      scene:`<p>Der Streit greift auf andere Stabsmitglieder über. S4 und Fachberater Gesundheit schweigen aus Unsicherheit. Koordination bricht zusammen.</p><div class="scene-ib err"><strong>Mehrabian:</strong> Die nonverbale Eskalation (Lautstärke, Körpersprache) sendet an alle: Dieser Stab ist nicht sicher. 55% der Botschaft ist Körpersprache.</div>`,
      question:'Notfall-Intervention?',
      options:[{letter:'A',text:'"Stab – alle stoppen. Ich übernehme Gesamtleitung direkt bis wir Rollenklarheit haben." Beiden Streitenden Auszeit befehlen.',quality:'neutral',scoreDelta:-5,theory:'Autoritäre Übernahme als letztes Mittel. Verliert Vertrauen, ist aber besser als Dysfunktion.',feedback:'Notlösung – besser als Chaos, aber teuer.',next:'s_zusammenarbeit'}]},
    's_zusammenarbeit':{ phase:3, title:'⚙️ Stab funktioniert – neue Herausforderung',
      scene:`<p>Rollenverteilung klar. Stab arbeitet wieder. Neue Meldung: Ein weiterer Fachberater (FB Chemie, ext.) widerspricht der aktuellen Schutzmaßnahmenentscheidung öffentlich im Stabsraum.</p>`,
      question:'Wie gehst du damit um?',
      options:[
        {letter:'A',text:'FB Chemie hat 2 Minuten, seinen Einwand sachlich zu begründen. Dann Entscheidung im Stabskreis. Dissens dokumentieren, aber Entscheidung fällen.',quality:'good',scoreDelta:+15,theory:'Partizipative Entscheidung mit klarem Zeitrahmen. Expertise einbeziehen, aber Handlungsfähigkeit erhalten.',feedback:'Professionell – Expertise gehört, Entscheidung getroffen.',next:'s_ende_gut'},
        {letter:'B',text:'Einwand ignorieren – keine Zeit für Diskussionen.',quality:'bad',scoreDelta:-10,theory:'Expertise-Ignoranz: FB Chemie könnte einen lebensrettenden Hinweis haben. Arroganz des Führers.',feedback:'Riskant – der Hinweis könnte entscheidend gewesen sein.',next:'s_ende_mittel'}
      ]},
    's_ende_gut':{ phase:4, isEnd:true, endScore:'good', title:'🏆 Vorbildliche Stabsführung!',
      scene:`<p>Einsatz erfolgreich koordiniert. Stab hat trotz interpersonellem Konflikt funktioniert. Deine Moderationsleistung hat die Einsatzführung gerettet. Lessons Learned: Rollenklärung zu Beginn jeder Stabsarbeit.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'s_start'}]},
    's_ende_mittel':{ phase:4, isEnd:true, endScore:'neutral', title:'🥈 Befriedigend',
      scene:`<p>Einsatz bewältigt. Stabskonflikt eskaliert, aber durch Intervention beendet. Entscheidungsqualität durch ignorierten Einwand möglicherweise beeinträchtigt.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'s_start'}]}
  }
},

/* ------------------------------------------------------------------
   SZENARIO 4: DISZIPLINARISCHER GRENZFALL
------------------------------------------------------------------ */
disziplin: {
  label: 'Szenario 04 – Disziplinarischer Grenzfall',
  start: 'd_start',
  nodes: {
    'd_start':{ phase:1, title:'🔍 Dienstag, 09:15 – Verdachtsmeldung',
      scene:`<p>WAL Fischer meldet sich diskret: <em>„Ich muss Sie sprechen. OBM Klaus Berger (22 Dienstjahre, bisher tadellos, 2 Auszeichnungen, bekannt für Vorbildfunktion) soll in den letzten Wochen dreimal während der Dienstzeit in der Feuerwache Alkohol konsumiert haben. Ich selbst habe ihn gestern leicht benebelt wahrgenommen. Kein Einsatz war betroffen."</em></p><div class="scene-ib"><strong>Dilemma:</strong> Fürsorge gegenüber einem langjährigen, verdienten Mitarbeiter vs. gesetzliche Pflichten und Sicherheitsverantwortung. Du als B-Dienst trägst die Verantwortung.</div>`,
      question:'Was ist dein unmittelbarer erster Schritt?',
      options:[
        {letter:'A',text:'Fischer genau befragen: Was hat er wann konkret wahrgenommen? Gibt es weitere Zeugen? Sachverhalt so präzise wie möglich dokumentieren, bevor jede Handlung.',quality:'good',scoreDelta:+20,theory:'Führungsprinzip: Verdacht ≠ Beweis. Vor Handlung genaue Faktenerhebung. Unschuldsvermutung. Keine voreiligen Schlüsse – auch bei Dienstpflichtverletzungen.',feedback:'Professionell – Fakten zuerst.',next:'d_fakten'},
        {letter:'B',text:'Berger sofort in die Pause schicken und ankündigen: „Wir müssen reden."',quality:'bad',scoreDelta:-10,theory:'Ohne gesicherte Fakten ist eine Konfrontation unklug und rechtlich heikel. Vorwurf könnte nicht zutreffen.',feedback:'Vorschnell – ohne Fakten angreifbar.',next:'d_voreschnell'},
        {letter:'C',text:'Abwarten und beobachten – ohne Beweis kann ich nicht handeln.',quality:'bad',scoreDelta:-15,theory:'Als Führungskraft hast du Fürsorgepflicht UND Sicherheitsverantwortung. Inaktivität bei konkretem Verdacht ist Pflichtverletzung.',feedback:'Untätigkeit ist hier keine Option.',next:'d_abwarten'}
      ]},
    'd_fakten':{ phase:1, title:'📋 Faktenerhebung',
      scene:`<p>Fischer: <em>„Dreimal in 2 Wochen. Dienstag, Donnerstag, letzten Montag. Immer nachmittags. Ich habe Alkoholgeruch wahrgenommen. Kollege Krause hat ihn einmal schwankend gesehen."</em></p><p>Du sprichst diskret mit Krause – bestätigt Beobachtung vom Montag.</p><div class="scene-ib"><strong>Rechtslage:</strong> Alkohol im Dienst: Verstoß gegen Dienstpflichten (Beamtenrecht). Du als Vorgesetzter musst tätig werden. Gleichzeitig: § 84 SGB IX – bei Suchtproblemen Fürsorgepflicht und BEM-Option.</div>`,
      question:'Wie gehst du weiter vor?',
      options:[
        {letter:'A',text:'Berger zu einem Vier-Augen-Gespräch einladen – noch heute, nicht morgen. Ton: besorgt, nicht anklagend. Beobachtungen nennen, Berger Möglichkeit zur Stellungnahme geben.',quality:'good',scoreDelta:+25,theory:'Führungsfürsorge: Erst das direkte Gespräch, bevor formale Verfahren eingeleitet werden. ErI-Kommunikation: Beobachtungen benennen (B4), keine Voraburteile.',feedback:'Mustergültig – Fürsorge und Pflicht in Balance.',next:'d_gespraech'},
        {letter:'B',text:'Direkt Meldung an die Amtsleitung und Personalstelle mit allem was du weißt.',quality:'neutral',scoreDelta:+5,theory:'Formal korrekt, aber ohne vorheriges Fürsorgegespräch oft unverhältnismäßig bei erstem konkreten Verdacht.',feedback:'Formal richtig, aber die Chance auf frühzeitige Hilfe verpasst.',next:'d_gespraech'},
        {letter:'C',text:'Berger zum freiwilligen Alkoholtest auffordern.',quality:'bad',scoreDelta:-10,theory:'Rechtlich äußerst heikel: Freiwilligkeit ist keine echte Freiwilligkeit in Hierarchien. Ohne klare Rechtsgrundlage angreifbar.',feedback:'Rechtlich heikel und vertrauensschädigend.',next:'d_gespraech'}
      ]},
    'd_voreschnell':{ phase:1, title:'⚠️ Vorschnelle Konfrontation',
      scene:`<p>Berger ist verletzt und fühlt sich ungerecht behandelt: <em>„Ich verstehe das nicht – auf was stützen Sie das?"</em></p><div class="scene-ib warn"><strong>Führungsfehler:</strong> Ohne Fakten zu konfrontieren verletzt das Vertrauen und schwächt die spätere rechtliche Position.</div>`,
      question:'Kurskorrektur?',
      options:[{letter:'A',text:'Ehrlich eingestehen: „Ich habe zu wenig gesicherte Informationen. Lassen Sie uns das Gespräch formell und korrekt führen." Termin vereinbaren.',quality:'neutral',scoreDelta:+5,theory:'Selbstkorrektur rettet die Situation teilweise – Vertrauen ist beschädigt.',feedback:'Mutige Korrektur. Vertrauen beschädigt, aber besser als Eskalation.',next:'d_gespraech'}]},
    'd_abwarten':{ phase:1, title:'⏳ Konsequenzen der Untätigkeit',
      scene:`<p>3 Tage später: Berger fährt mit dem Einsatzfahrzeug unter Alkoholeinfluss. Kein Unfall, aber Kameraden berichten es sofort. Du wirst von der Amtsleitung einbestellt.</p><div class="scene-ib err"><strong>Führungsversagen:</strong> Bekannter Verdacht, keine Maßnahmen → Pflichtverletzung als Vorgesetzter.</div>`,
      question:'Jetzt?',
      options:[{letter:'A',text:'Vollständige Offenlegung gegenüber Amtsleitung. Eigenverantwortung eingestehen. Sofortmaßnahmen einleiten.',quality:'neutral',scoreDelta:-5,theory:'Konsequente Offenlegung rettet die rechtliche Position teilweise.',feedback:'Spät, aber der einzig richtige Schritt jetzt.',next:'d_gespraech'}]},
    'd_gespraech':{ phase:2, title:'🗣️ Vier-Augen-Gespräch mit OBM Berger',
      scene:`<p>Berger sitzt dir gegenüber, blass. Nach deiner ruhigen Schilderung der Beobachtungen: lange Pause. Dann: <em>„Meine Frau hat uns verlassen. Vor 6 Wochen. Ich… ich komme nicht gut damit klar."</em></p><div class="scene-ib"><strong>TA – Ichzustand Berger:</strong> Jetzt klar im verletzten Kind-Ich. Das Gespräch hat eine völlig andere Dimension bekommen. Fürsorgepflicht tritt stärker in den Vordergrund.</div>`,
      question:'Wie reagierst du auf diese Offenbarung?',
      options:[
        {letter:'A',text:'Pause. Echte Empathie zeigen: „Das tut mir leid – das ist sehr viel für einen Menschen." Dann klar: „Ich muss Sie gleichzeitig auf meine Pflichten hinweisen. Und auf Hilfsangebote, die wir haben."',quality:'good',scoreDelta:+25,theory:'BELLA-E (Erfassen) + BELLA-L (Linderung): Menschliche Dimension erkennen, ohne die dienstliche Pflicht aufzugeben. Das ist der schwerste Moment in der Führung.',feedback:'Vorbildlich – menschlich und pflichtgemäß zugleich.',next:'d_hilfsangebote'},
        {letter:'B',text:'Sofort: „Das ist schwerwiegend – ich muss das melden."',quality:'bad',scoreDelta:-10,theory:'Die menschliche Dimension vollständig ignorieren. Berger wird sich nicht öffnen und keine Hilfe annehmen.',feedback:'Berger schließt sich sofort wieder. Chance auf echte Hilfe vertan.',next:'d_formal'},
        {letter:'C',text:'Das Gespräch auf reinen Trost beschränken und das Dienstliche später besprechen.',quality:'bad',scoreDelta:-8,theory:'Karpman-Retter: Das klingt mitfühlend, ist aber eine Vermeidung der Führungsverantwortung.',feedback:'Fürsorge ohne Pflicht schützt Berger und andere nicht.',next:'d_hilfsangebote'}
      ]},
    'd_hilfsangebote':{ phase:3, title:'🤝 Hilfsangebote und formale Schritte',
      scene:`<p>Berger hört zu. Du hast gleichzeitig Verständnis gezeigt und Klarheit hergestellt. Er wirkt erleichtert, dass es ausgesprochen ist.</p>`,
      question:'Was bietest du konkret an?',
      options:[
        {letter:'A',text:'EAP-Angebot vorstellen, Betriebsarzt empfehlen, temporäre Einschränkung von Fahrzeugführung bis zur Klärung, BEM-Gespräch anbieten, Amtsleitung informieren (mit Bergers Wissen). Alles dokumentieren.',quality:'good',scoreDelta:+20,theory:'Vollständiges Hilfspaket: EAP (niedrigschwellig), Betriebsarzt (professionell), BEM (§ 84 SGB IX), temporäre Maßnahme (Sicherheit), Transparenz (Pflicht). Suchtgefährdung ≠ sofortiges Disziplinarverfahren.',feedback:'Perfekte Balance aus Fürsorge und Pflicht.',next:'d_dokumentation'},
        {letter:'B',text:'Berger sagen, das bleibt unter uns, wenn er aufhört.',quality:'bad',scoreDelta:-20,theory:'Vertuschen ist eine schwere Dienstpflichtverletzung und ignoriert die Sicherheitsverantwortung gegenüber Kameraden.',feedback:'Das ist eine Pflichtverletzung – und keine Fürsorge.',next:'d_dokumentation'}
      ]},
    'd_formal':{ phase:3, title:'📄 Formales Verfahren',
      scene:`<p>Berger hat sich verschlossen. Formales Disziplinarverfahren läuft. Berger nimmt keine Hilfe an.</p><div class="scene-ib warn"><strong>Bewertung:</strong> Formal korrekt, menschlich eine verpasste Chance. Führung ist mehr als Regelanwendung.</div>`,
      question:'Lässt sich noch etwas retten?',
      options:[{letter:'A',text:'Parallel zum Verfahren: erneuter Kontakt, EAP-Info weitergeben, Betriebsarzt einschalten.',quality:'neutral',scoreDelta:+8,theory:'Spät, aber möglich. Fürsorge endet nicht mit dem Disziplinarverfahren.',feedback:'Noch möglich – Berger die Tür offen lassen.',next:'d_dokumentation'}]},
    'd_dokumentation':{ phase:4, title:'📋 Dokumentation &amp; Abschluss',
      scene:`<p>Du hast alle Schritte transparent dokumentiert. Amtsleitung ist informiert. Berger hat das EAP-Angebot angenommen und ist temporär vom Fahrzeugdienst entbunden.</p>`,
      question:'Was ist deine abschließende Führungsreflexion?',
      options:[
        {letter:'A',text:'Lessons Learned: Für die Wache ein anonymes Beratungsangebot bekannter machen. Führungskräfte-Schulung zu Suchtproblematik und Frühintervention.',quality:'good',scoreDelta:+15,theory:'Organisationales Lernen: Aus dem Einzelfall systemische Maßnahmen ableiten. BGM-Prävention stärken.',feedback:'Exzellent – vom Einzelfall zur Systemverbesserung.',next:'d_ende_gut'},
        {letter:'B',text:'Fall abschließen und hoffen, dass Berger sich erholt.',quality:'neutral',scoreDelta:+3,theory:'Reaktiv statt präventiv. Die nächste Situation kommt ohne Systemverbesserung.',feedback:'Verständlich, aber Chance zur Systemverbesserung ungenutzt.',next:'d_ende_mittel'}
      ]},
    'd_ende_gut':{ phase:4, isEnd:true, endScore:'good', title:'🏆 Vorbildliche Führungsfürsorge',
      scene:`<p>Berger hat die Therapie begonnen. Die Wache hat ein neues anonymes EAP-Informationsformat. Du hast gezeigt: <strong>Fürsorge und Pflicht schließen sich nicht aus – sie bedingen einander.</strong></p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'d_start'}]},
    'd_ende_mittel':{ phase:4, isEnd:true, endScore:'neutral', title:'🥈 Befriedigend – Potenzial ungenutzt',
      scene:`<p>Berger ist in Behandlung. Formale Pflichten erfüllt. Systemische Prävention nicht gestärkt.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'d_start'}]}
  }
}

,

/* ------------------------------------------------------------------
   SZENARIO 5: DER „ALPHA"-FACHBERATER
   Anti-length-bias: Korrekte Antwort häufig die KÜRZERE
------------------------------------------------------------------ */
alpha: {
  label: 'Szenario 05 – Der „Alpha"-Fachberater',
  start: 'a_start',
  nodes: {
    'a_start':{ phase:1, title:'🧪 Chemiewerk – 11:22 Uhr – Lagebesprechung im Freien',
      scene:`<p>Ammoniak-Austritt, 120 kg freigesetzt. Deine GAMS-Lagebewertung hat eine Absperrgrenze von 100 m ergeben. Du hältst gerade das Einsatz-Briefing vor zwei Staffeln, als Dipl.-Ing. Dr. Lehmann (werkseigener Sicherheitsingenieur, Schutzkleidung Stufe 2) dazwischenfährt:</p><p><em>„Stopp! Diese 100-Meter-Grenze ist völlig unzureichend. Bei diesem Windvektor und der Behältergröße brauchen wir mindestens 300 Meter. Ich kenne diese Anlage seit 15 Jahren – ich verlange, dass Sie das jetzt korrigieren."</em></p><div class="scene-ib"><strong>Deine Ausgangslage:</strong> 22 Einsatzkräfte warten. Medien sind 80 m entfernt. Der Werksleiter nickt Dr. Lehmann zu. Deine Staffeln warten auf deinen Befehl.</div>`,
      question:'Wie reagierst du in den nächsten 30 Sekunden?',
      options:[
        {letter:'A',text:'„Dr. Lehmann – Einwand aufgenommen. Wir klären das sofort." Kurze Handgeste ans Team: Warteposition. Zwei Schritte zur Seite.',quality:'good',scoreDelta:+25,theory:'TA – Erwachsenen-Ich: Keine Eskalation, keine Kapitulation. Expertise wird gewürdigt, Führungshoheit bleibt. Watzlawick Axiom 2: Beziehungsaspekt (wer entscheidet) muss zuerst geklärt werden – aber nicht öffentlich.',feedback:'Exakt richtig: Kurz, klar, gesichtswahrend für beide Seiten.',next:'a_privat'},
        {letter:'B',text:'Erklärst dem gesamten Team ruhig und detailliert: Nach GAMS-Regel und FwDV 500 sind 100 m für NH₃ der korrekte Ausgangswert. Du erläuterst die Windkorrektur, die Leckrate, den Konzentrationsgradient. Dr. Lehmann soll dann seine abweichende Einschätzung vor allen begründen.',quality:'bad',scoreDelta:-15,theory:'Öffentliche Fachdebatte während eines laufenden Einsatzes: bindet Zeit, beschädigt Führungsautorität (beide Seiten), verwirrt die Mannschaft. Kein Führungsformat für diese Situation.',feedback:'Sachlich vielleicht korrekt – situativ eine Katastrophe. Die Mannschaft braucht Entscheidung, keine Diskussion.',next:'a_privat'},
        {letter:'C',text:'Ignorierst Dr. Lehmann und fährst mit dem Briefing fort: „Wir haben unsere Messung – weitermachen."',quality:'bad',scoreDelta:-20,theory:'Expertise-Ignoranz bei Gefahrstoffeinsatz: potentiell lebensbedrohlich. Fachberater wurden genau für diesen Zweck autorisiert. Arroganz der Führungskraft kann hier Menschen töten.',feedback:'Gefährlich und arrogant. Was, wenn er recht hat?',next:'a_privat'},
        {letter:'D',text:'Bittest Dr. Lehmann, die restliche Einweisung selbst zu übernehmen, da er die Anlage besser kennt.',quality:'bad',scoreDelta:-18,theory:'Führungsabgabe an externen Experten ohne rechtliche Grundlage. Einsatzleitung kraft Gesetz (FwG) ist nicht delegierbar an Dritte außerhalb der Führungsstruktur.',feedback:'Einsatzleitung kraft Gesetz ist nicht übertragbar. Du gibst die Kontrolle auf.',next:'a_privat'}
      ]},
    'a_privat':{ phase:2, title:'🗣️ Unter vier Augen – 3 Minuten',
      scene:`<p>Ihr steht 10 m vom Team entfernt. Dr. Lehmann legt dar: <em>„Das Leck ist im Druckbereich 3. Die Freisetzungsrate ist mindestens doppelt so hoch wie Ihr Ausgangswert. Ich habe die aktuellen Anlagendaten. 300 m ist das Minimum."</em></p><p>Du siehst: Er hat ein Tablet mit Anlagenschema und Messdaten. Sein Argument klingt technisch fundiert.</p><div class="scene-ib"><strong>Rechtliche Lage:</strong> Einsatzleitung liegt bei dir (FwG). Dr. Lehmann hat keine Befehlsgewalt – aber Expertise. Fachberater-Status muss formal festgestellt werden.</div>`,
      question:'Wie gehst du mit seiner Expertise um?',
      options:[
        {letter:'A',text:'Hörst aufmerksam zu, prüfst das Tablet, fragst: „Wie sicher sind diese Messdaten?" Wenn plausibel: Absperrgrenze sofort auf 300 m erweitern und ihn als offiziellen Fachberater in die Führungsstruktur einbinden.',quality:'good',scoreDelta:+20,theory:'Partizipative Entscheidung unter Zeitdruck: Expertise prüfen und integrieren ist kein Zeichen von Schwäche, sondern von professioneller Urteilskraft. Fachberater-Einbindung ist in FwDV 100 vorgesehen.',feedback:'Richtig: Expertise eingeholt, Entscheidung selbst getroffen, Fachberater formal eingebunden.',next:'a_einbinden'},
        {letter:'B',text:'Bleibst bei 100 m. Du bist der Einsatzleiter kraft Gesetzes. Seine Meinung ist interessant, aber du hast das GAMS-Schema korrekt angewandt. Wenn er weiter eskaliert, wird der Werksleiter angewiesen, ihn von der Einsatzstelle zu entfernen.',quality:'bad',scoreDelta:-15,theory:'Sturheit gegenüber valider Expertise bei Gefahrstoffeinsatz: die GAMS-Regel ist ein Einstiegspunkt, kein absoluter Wert. Fachberater-Einschätzungen zu ignorieren kann tödlich sein.',feedback:'Prinzipientreue ohne Urteilsvermögen ist Sturheit. Der Einsatz könnte eskalieren.',next:'a_einbinden'},
        {letter:'C',text:'Übergibst ihm die Einsatzleitung vollständig: „Sie kennen die Anlage. Sie übernehmen."',quality:'bad',scoreDelta:-20,theory:'Einsatzleitung ist hoheitliche Aufgabe kraft FwG – nicht übertragbar an Externe. Haftung, Versicherungsschutz, Befehlsstruktur würden zusammenbrechen.',feedback:'Keine Option. Rechtlich unmöglich, praktisch chaotisch.',next:'a_einbinden'}
      ]},
    'a_einbinden':{ phase:3, title:'🔄 Neuausrichtung – zurück zur Mannschaft',
      scene:`<p>Du hast die Daten geprüft. Dr. Lehmanns Argument ist stichhaltig. Absperrgrenze wird auf 300 m erweitert. Jetzt musst du das kommunizieren – mit 22 Kräften, die zugehört haben, und Medien im Blickfeld.</p>`,
      question:'Wie kommunizierst du die Lageänderung?',
      options:[
        {letter:'A',text:'„Lagemeldung aktualisiert: Absperrbereich 300 Meter. Dr. Lehmann ist ab sofort Fachberater Chemie in meiner Führungsstruktur – technische Einschätzungen laufen über ihn zu mir. Taktische Entscheidungen treffe ich. Einsatzabschnitte wie besprochen – VOR!"',quality:'good',scoreDelta:+20,theory:'Klare Rollenverteilung: Fachberater berät, Einsatzleiter entscheidet. Keine Entschuldigung, keine Erklärung des Irrtums – sachliche Lageaktualisierung. Das ist Führungsstärke, nicht Schwäche.',feedback:'Professionell und präzise. Rollenklarheit für alle hergestellt.',next:'a_ende_gut'},
        {letter:'B',text:'Erklärst ausführlich den Denkfehler in deiner ursprünglichen GAMS-Anwendung, lobst Dr. Lehmann öffentlich für die Korrektur, bittest die Mannschaft um Verständnis und sicherst zu, beim nächsten Einsatz den Werksingenieur früher einzubinden.',quality:'bad',scoreDelta:-10,theory:'Öffentliche Selbstzerfleischung schwächt die Führungsautorität dauerhaft. Kräfte brauchen Vertrauen in die Führung – nicht die Gewissheit, dass sie irrt und das zugibt.',feedback:'Gut gemeint, aber Autorität dauerhaft beschädigt. Kräfte zweifeln beim nächsten Befehl.',next:'a_ende_mittel'},
        {letter:'C',text:'Gibst die neue Grenze bekannt ohne Erläuterung. Dr. Lehmann soll einfach schweigen.',quality:'bad',scoreDelta:-8,theory:'Fehlende Einbindung des Fachberaters in die Führungsstruktur: die Expertise wird genutzt, aber der Experte bleibt unklar positioniert – Konfliktpotenzial bleibt bestehen.',feedback:'Halbherzig. Die Spannung bleibt – beim nächsten Widerspruch eskaliert es wieder.',next:'a_ende_mittel'}
      ]},
    'a_ende_gut':{ phase:4, isEnd:true, endScore:'good', title:'🏆 Meisterklasse: Expertise integriert',
      scene:`<p>Die Absperrzone hält. Keine Verletzten. Dr. Lehmann arbeitet effektiv als Fachberater. Einsatz abgeschlossen. Im Nachgespräch: <em>„Sie haben das richtig gemacht. Ich hatte erwartet, dass Sie sich querstellen."</em> – Dr. Lehmann.</p><p>Deine Führungsleistung: Expertise anerkannt ohne Führungshoheit abzugeben. Das ist der Unterschied zwischen Ego-Führung und professioneller Führung.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'a_start'}]},
    'a_ende_mittel':{ phase:4, isEnd:true, endScore:'neutral', title:'🥈 Befriedigend – Lernpotenzial erkannt',
      scene:`<p>Einsatz bewältigt. Dr. Lehmanns Expertise wurde genutzt, aber die Führungsdarstellung war suboptimal. Kräfte zeigen beim nächsten Einsatz leichte Unsicherheit.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'a_start'}]}
  }
},

/* ------------------------------------------------------------------
   SZENARIO 6: POLITISCHE DRUCKSITUATION
   Anti-length-bias: Korrekte Antwort ist in Phase 1 die KÜRZESTE
------------------------------------------------------------------ */
politik: {
  label: 'Szenario 06 – Politische Drucksituation',
  start: 'pol_start',
  nodes: {
    'pol_start':{ phase:1, title:'🏛️ 16:40 Uhr – Wohnhausbrand mit Übergriff auf Rathaus',
      scene:`<p>Vollbrand eines Altstadthauses. Feuer droht auf das angrenzende historische Rathaus (18. Jh., unlösbar, akute Einsturzgefahr im 1. OG) überzugreifen. Rettungsgasse freigehalten – aber: <strong>im Wohnhaus sind laut Nachbarin noch zwei Bewohner</strong>, deren Schicksal unklar ist.</p><p>Bürgermeister Hartmann (55, Kommunalwahl in 3 Wochen) steht 5 m hinter der Absperrung, sein Pressesprecher filmt. Er tritt auf dich zu:</p><p><em>„Herr Brandamtmann – ich verlange, dass Sie sofort alle verfügbaren Kräfte auf das Rathaus konzentrieren. Das ist 400 Jahre Geschichte. Das Wohnhaus ist versichert."</em></p>`,
      question:'Deine unmittelbare Reaktion?',
      options:[
        {letter:'A',text:'Kurz und ohne Diskussion: „Menschenleben haben Vorrang. Alles andere danach." Dann Blickkontakt zum Pressesprecher: „Bitte verlassen Sie jetzt die Einsatzstelle – das ist eine Anweisung."',quality:'good',scoreDelta:+25,theory:'Einsatzleitung kraft Gesetz (FwG): Der Einsatzleiter hat vor Ort alle Weisungsbefugnisse – unabhängig von politischer Stellung. Klare Priorisierung nach FwDV 100: Menschenrettung vor Sachwertschutz. Keine inhaltliche Debatte mit Unbefugten während des laufenden Einsatzes.',feedback:'Richtig – kurz, klar, rechtssicher. Keine Diskussion nötig.',next:'pol_druck'},
        {letter:'B',text:'Erklärst dem Bürgermeister geduldig die taktischen Überlegungen, die rechtliche Grundlage der Einsatzleitung, die Priorisierungsmatrix nach FwDV 100 und dass du sein Anliegen verstehst, aber gemäß Lagebeurteilung handeln musst.',quality:'neutral',scoreDelta:+5,theory:'Inhaltlich korrekt, situativ falsch: Jede Erklärungsminute ist eine Minute weniger für die Rettung. Außerdem: Erklärungen suggerieren, dass politischer Druck grundsätzlich diskutiert werden kann.',feedback:'Korrekt in der Substanz – aber du verlierst wertvolle Zeit und signalisierst Verhandlungsbereitschaft.',next:'pol_druck'},
        {letter:'C',text:'Ignorierst ihn vollständig ohne Reaktion.',quality:'bad',scoreDelta:-12,theory:'Aktives Ignorieren eines Bürgermeisters am Einsatzort schafft politischen Flächenbrand. Die Situation eskaliert auf anderem Wege – Anrufe bei Vorgesetzten, Presseerklärungen.',feedback:'Der Politiker verschwindet nicht – er eskaliert auf anderem Wege.',next:'pol_druck'},
        {letter:'D',text:'Lässt dich von der Situation unter Druck setzen und gibst zwei Trupps zur Rathaussicherung ab, um den Bürgermeister zu beruhigen – mit dem Gedanken, notfalls zurückzurufen.',quality:'bad',scoreDelta:-20,theory:'Politischem Druck nachgeben gefährdet die vermissten Bewohner direkt. Das ist kein Kompromiss – das ist Führungsversagen mit potentiell tödlichen Konsequenzen.',feedback:'Kapitulation unter Druck. Die zwei vermissten Bewohner zahlen den Preis.',next:'pol_druck'}
      ]},
    'pol_druck':{ phase:2, title:'📱 Eskalation – Anruf beim Amtsleiter',
      scene:`<p>Bürgermeister Hartmann hat deinen Amtsleiter OBD Fischer auf dem Handy. Fischer ruft dich an: <em>„Hartmann macht Druck. Was ist die Lage? Er sagt, du weigerst dich, das Rathaus zu priorisieren."</em></p><p>Parallel: Truppmann Vogel meldet: <em>„Wir haben Bewegung im 2. OG Wohnhaus gesehen."</em></p>`,
      question:'Wie managst du jetzt zwei Baustellen gleichzeitig?',
      options:[
        {letter:'A',text:'An Fischer: „Ich priorisiere die bestätigten Vermissten im Wohnhaus. Das Rathaus wird geschützt, soweit möglich. Ich rufe in 10 Minuten zurück." Dann sofort weiter: Truppmann Vogel nach Details fragen, Rettungsmaßnahmen koordinieren.',quality:'good',scoreDelta:+20,theory:'Führungsprinzip: Kurze Lagedarstellung an vorgesetzte Stelle, dann sofort zurück in den Einsatz. Keine ausgedehnte politische Kommunikation während aktiver Rettungsmaßnahme. Fischer kann Hartmann bremsen.',feedback:'Richtig priorisiert: Einsatz zuerst, Rückmeldung danach.',next:'pol_rettung'},
        {letter:'B',text:'Nimmst dir 5 Minuten, um Fischer ein vollständiges Lagebild zu geben: aktuelle Kräftedisposition, Taktik, rechtliche Grundlage, Begründung der Priorisierung. Damit Fischer Hartmann vollständig informiert beruhigen kann.',quality:'bad',scoreDelta:-15,theory:'5 Minuten Kommunikation statt Einsatz während einer aktiven Personenrettung: Das kostet möglicherweise Menschenleben. Kurze Statusmeldung reicht – Details danach.',feedback:'Fünf Minuten – die Bewegung im 2. OG braucht sofort eine Reaktion.',next:'pol_rettung'},
        {letter:'C',text:'Bittest Fischer, einen Pressesprecher zu entsenden, der den Bürgermeister betreut.',quality:'neutral',scoreDelta:+8,theory:'Sinnvolle Maßnahme – aber als alleinige Antwort unvollständig. Fischer muss wissen, wie du entscheidest und warum.',feedback:'Sinnvoll, aber Fischer braucht trotzdem ein Lagebild von dir.',next:'pol_rettung'}
      ]},
    'pol_rettung':{ phase:3, title:'🚒 Personenrettung abgeschlossen',
      scene:`<p>Beide Bewohner aus dem 2. OG gerettet. Brandschutzriegelmaßnahmen: Rathaus zu 70% gesichert, Turm reparierbar. Bürgermeister Hartmann steht jetzt bei den Kameras: <em>„Ich bin froh, dass die Feuerwehr gute Arbeit geleistet hat. Ich hatte von Anfang an das Wohl der Menschen im Blick."</em></p><div class="scene-ib"><strong>Jetzt:</strong> Du wirst direkt von einem Journalisten befragt: „Stimmt es, dass der Bürgermeister Einfluss auf Ihre Entscheidungen genommen hat?"</div>`,
      question:'Wie antwortest du dem Journalisten?',
      options:[
        {letter:'A',text:'„Die Einsatzentscheidungen liegen allein beim Einsatzleiter – das ist rechtlich so geregelt und so wurde hier gehandelt." Keine weitere Kommentierung politischer Vorgänge.',quality:'good',scoreDelta:+15,theory:'Mediale Reaktion: sachlich, korrekt, ohne politische Kontroverse. Keine Bestätigung, keine Dementi – nur der rechtliche Fakt. Das schützt dich und die Institution.',feedback:'Professionell, rechtssicher und unpolemisch.',next:'pol_nachbereitung'},
        {letter:'B',text:'Nutzt die Gelegenheit, den öffentlichen Druck des Bürgermeisters transparent zu machen – die Öffentlichkeit sollte wissen, was Einsatzleiter tatsächlich aushalten.',quality:'bad',scoreDelta:-15,theory:'Öffentliche Kritik am politischen Auftraggeber durch den nachgeordneten Beamten: institutioneller Flächenbrand, Loyalitätsverletzung, schadet der Feuerwehr insgesamt.',feedback:'Verständlich menschlich – institutionell eine Katastrophe.',next:'pol_nachbereitung'},
        {letter:'C',text:'Antwortest gar nicht und wende dich ab.',quality:'bad',scoreDelta:-8,theory:'Schweigen wird als Bestätigung der Frage interpretiert. In Mediensituationen: kurze, klare Positionierung ist Pflicht.',feedback:'Schweigen wirkt schuldbewusst – oder als Bestätigung.',next:'pol_nachbereitung'}
      ]},
    'pol_nachbereitung':{ phase:4, title:'📋 Nachbereitung – Dokumentation und Prävention',
      scene:`<p>Amtsleiter Fischer bittet um Einsatzbericht. Gleichzeitig möchte er wissen: Wie verhindert man künftig, dass politischer Druck am Einsatzort eskaliert?</p>`,
      question:'Dein Vorschlag für die Nachbereitung?',
      options:[
        {letter:'A',text:'Lückenlose Dokumentation des politischen Eingriffversuchs (Zeitpunkt, Wortlaut, Kontext). Vorschlag: SOP für Bürgermeister-Kontakt bei Großeinsätzen – dedizierter Verbindungsbeamter, der Politiker vom Einsatzleiter fernhält.',quality:'good',scoreDelta:+15,theory:'Dokumentation schützt die Einsatzleitung rechtlich. SOP für politische Kontakte ist internationaler Standard bei Großeinsätzen (NIMS, BOS-Empfehlungen). Präventiver Führungsansatz.',feedback:'Exzellent: Dokumentation + Systemlösung für die Zukunft.',next:'pol_ende_gut'},
        {letter:'B',text:'Bericht schreiben ohne Erwähnung des politischen Drucks – das intern zu eskalieren schadet dem Betriebsfrieden.',quality:'bad',scoreDelta:-12,theory:'Fehlende Dokumentation schützt den nächsten Einsatzleiter nicht. Beim nächsten Einsatz wiederholt sich das Szenario ohne institutionelle Antwort.',feedback:'Kurzfristiger Frieden, langfristiges strukturelles Problem.',next:'pol_ende_mittel'},
        {letter:'C',text:'Schuldigen-Analyse: Die politische Einmischung formal als Dienstaufsichtsbeschwerde einreichen.',quality:'neutral',scoreDelta:+5,theory:'Formal möglich, aber eskalativ und für die Führungsbeziehung kontraproduktiv. Dokumentation und SOP sind der bessere Weg.',feedback:'Rechtlich möglich – aber das Verhältnis zur Kommunalpolitik wird dauerhaft beschädigt.',next:'pol_ende_mittel'}
      ]},
    'pol_ende_gut':{ phase:4, isEnd:true, endScore:'good', title:'🏆 Politischer Druck – souverän bewältigt',
      scene:`<p>Beide Bewohner gerettet. Rathaus teilweise erhalten. Einsatzführung war zu keinem Zeitpunkt kompromittiert. Deine Dokumentation und der SOP-Vorschlag werden als Best Practice übernommen. Bürgermeister Hartmann: kein weiteres Wort der Kritik.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'pol_start'}]},
    'pol_ende_mittel':{ phase:4, isEnd:true, endScore:'neutral', title:'🥈 Einsatz bewältigt – Systemlücken offen',
      scene:`<p>Menschen gerettet. Einsatz abgeschlossen. Aber der politische Druck wurde nicht dokumentiert und die strukturelle Lösung fehlt. Beim nächsten Einsatz wiederholt sich das Szenario.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'pol_start'}]}
  }
},

/* ------------------------------------------------------------------
   SZENARIO 7: INFORMATIONSBLOCKADE IM STAB (S3/S2)
   Anti-length-bias: Korrekte Antwort in Phase 2 extrem kurz
------------------------------------------------------------------ */
stab2: {
  label: 'Szenario 07 – Informationsblockade im Stab',
  start: 'i_start',
  nodes: {
    'i_start':{ phase:1, title:'🌲 Waldbrand-Großlage – 3. Einsatzstunde – Stabsraum',
      scene:`<p>Waldbrand, 340 ha, Windstärke zunehmt auf 6 Bft. Im Stabsraum: Dein S4 (Logistik) tritt zu dir: <em>„Ich kann meinen Job nicht machen. S3 Kraft und S2 Sommer reden nicht miteinander – seit heute Morgen. S2 aktualisiert die Lagekarte nicht mit Infos aus S3s Sektor. S3 meldet seine Kräftepositionen nur an mich, nicht an S2."</em></p><p>Du schaust auf die Lagekarte: Sie ist 40 Minuten alt. Der Wind dreht gerade. Das taktische Lagebild ist unvollständig – und das weiß nur du.</p><div class="scene-ib"><strong>Risikobewertung:</strong> Bei drehendem Wind + unvollständige Lagekarte = potentiell eingeschlossene Einsatzkräfte im Sektor 3. Zeit: kritisch.</div>`,
      question:'Dein sofortiger erster Schritt?',
      options:[
        {letter:'A',text:'Holst S3 Kraft und S2 Sommer sofort gemeinsam an die Lagekarte. Direkte Ansage: „Ich brauche in 90 Sekunden ein vollständiges Lagebild. Jetzt." Dann selbst moderieren.',quality:'good',scoreDelta:+22,theory:'Zeitkritische Lage: Keine Einzelgespräche, keine Mediation – sofortige gemeinsame Lagerekonstruktion. Führungsprinzip FwDV 100: Kontrolle der Lagekarte ist Kernpflicht des Einsatzleiters.',feedback:'Richtig: 90 Sekunden für ein vollständiges Bild. Leben hängen davon ab.',next:'i_klärung'},
        {letter:'B',text:'Rufst S3 und S2 einzeln zu dir, hörst beide Seiten an, versuchst den Hintergrund des persönlichen Konflikts zu verstehen, bevor du entscheidest wie du eingreifst.',quality:'bad',scoreDelta:-18,theory:'Einzelgespräche bei zeitkritischer Sicherheitslage: Die Lagekarte altert weiterhin. Jede Minute ohne valides Lagebild erhöht das Risiko für Einsatzkräfte im Außensektor.',feedback:'Der Wind dreht jetzt. Einzelgespräche sind Luxus, den du nicht hast.',next:'i_klärung'},
        {letter:'C',text:'Übertragst die Lagebild-Pflicht vorübergehend an S4 – der soll alle Informationen zusammenführen.',quality:'bad',scoreDelta:-10,theory:'Lagebild ist Kernaufgabe S2 – S4 hat keine Ausbildung, Werkzeuge oder Kapazität dafür. Symptombehandlung statt Ursachenklärung.',feedback:'S4 ist überfordert. Das Lagebild bleibt unvollständig.',next:'i_klärung'}
      ]},
    'i_klärung':{ phase:2, title:'⚡ Konfrontation an der Lagekarte',
      scene:`<p>Beide stehen vor dir. Lagekarte dazwischen. S3 Kraft: <em>„Ich gebe meine Positionsdaten nicht ein, wenn Sommer sie für seine eigenen Entscheidungen nutzt ohne mich."</em> S2 Sommer: <em>„Kraft hat mir heute Morgen vor allen eine Entscheidung weggenommen. Das mache ich nicht mit."</em></p><p>Die Lagekarte ist jetzt 52 Minuten alt. Im Sektor 3 sind 14 Einsatzkräfte ohne aktuelle Rückmeldung.</p>`,
      question:'Was sagst du – in maximal zwei Sätzen?',
      options:[
        {letter:'A',text:'„Das klären wir nach dem Einsatz. Jetzt: S2 trägt alle verfügbaren Daten ein, S3 meldet Positionen alle 10 Minuten an S2. Sofort." Dann: Blickkontakt zu beiden – keine weiteren Worte.',quality:'good',scoreDelta:+25,theory:'Minimale Intervention, maximale Wirkung. Glasl: Bei zeitkritischer Lage ist Beziehungskonflikt-Mediation NICHT das Führungsformat – Aufgabendisziplin kommt zuerst. Konfliktklärung danach.',feedback:'Perfekt: zwei Sätze, klare Rollen, kein Wort zu viel.',next:'i_umsetzung'},
        {letter:'B',text:'Nutzt die Situation, um beiden klarzumachen, was professionelles Stabsverhalten bedeutet: Du erklärst die Grundsätze der Stabsarbeit nach FwDV 100, zitierst Watzlawicks Axiom zur Beziehungsebene, erläuterst Glasls Eskalationsmodell, und machst deutlich, dass persönliche Konflikte in einer Stabsarbeit keinen Platz haben.',quality:'bad',scoreDelta:-18,theory:'Lehrervortrag bei Sicherheitsnotfall: Die 14 Kräfte in Sektor 3 brauchen kein Watzlawick – sie brauchen eine aktuelle Lagekarte. Führen bedeutet Prioritäten setzen.',feedback:'Bildungsarbeit im falschen Moment. 14 Kräfte warten auf das Lagebild.',next:'i_umsetzung'},
        {letter:'C',text:'Versetzt S3 Kraft sofort in eine andere Funktion (S6 Kommunikation), bis der Konflikt gelöst ist.',quality:'bad',scoreDelta:-12,theory:'Personalmaßnahme in Hochphase einer Großlage: S3 ist für Einsatzführung unverzichtbar. Versetzung schafft ein größeres Problem als es löst.',feedback:'S3 an der kritischsten Stelle abzuziehen ist keine Lösung.',next:'i_umsetzung'}
      ]},
    'i_umsetzung':{ phase:3, title:'📡 Lagebild aktualisiert – neue Herausforderung',
      scene:`<p>Lagekarte ist aktuell. Sektor 3 – Entwarnung: Kräfte repositioniert. Wind hat auf 7 Bft zugenommen. Jetzt meldet ein externer Fachberater (Sachverständiger Forst, Bayerische Forstverwaltung) eine abweichende Windprognose von der des DWD: Erwartete Windstärke 9 Bft in 40 Minuten. S3 Kraft lehnt die Einschätzung ab: „Unsere Wetterdaten sind aktuell. Der Forst liegt falsch."</p><div class="scene-ib"><strong>Implikation:</strong> Bei 9 Bft sind zwei Löschfahrzeuge in Sektor 2 möglicherweise exponiert. Frühzeitige Repositionierung kostet taktische Tiefe, aber schützt Einsatzkräfte.</div>`,
      question:'Wie entscheidest du?',
      options:[
        {letter:'A',text:'Ordnest sofortige Repositionierung beider Fahrzeuge an. Der Fachberater Forst hat lokales Expertenwissen, das DWD-Daten nicht abbilden können. Im Zweifel: Kräfteschutz.',quality:'good',scoreDelta:+18,theory:'Fachberater-Einschätzung integrieren, im Zweifel zugunsten Kräfteschutz entscheiden. Führungsprinzip: Unsicherheit geht zu Lasten der Sicherheit, nie zu Lasten der Einsatzkräfte.',feedback:'Richtig: Im Zweifel für die Sicherheit der Kräfte.',next:'i_abschluss'},
        {letter:'B',text:'Organisierst eine Kurzkonferenz mit S2 (Wetter), S3 (Taktik), Fachberater Forst und DWD-Kontakt, um die Datenlage zu klären, bevor du eine Entscheidung triffst.',quality:'neutral',scoreDelta:+5,theory:'Sorgfalt ist wichtig – aber 40 Minuten sind bei 7 Bft wenig Zeit. Konferenz bindet alle Schlüsselpersonen.',feedback:'Sorgfältig, aber zeitkritisch. In 40 Minuten kann viel passieren.',next:'i_abschluss'},
        {letter:'C',text:'Stimmst S3 zu – eure eigenen DWD-Daten sind aktueller als die Einschätzung eines externen Forstexperten ohne Zugang zu euren Wetterstationen.',quality:'bad',scoreDelta:-15,theory:'Lokales Expertenwissen (Fachberater Forst) und meteorologische Modelle bilden Verschiedenes ab. Wer bei Fachberater-Warnungen auf eigene Einschätzung besteht, verletzt das Prinzip der Expertise-Integration.',feedback:'Wenn er recht hat: zwei Fahrzeuge, möglicherweise eingekesselt.',next:'i_abschluss'}
      ]},
    'i_abschluss':{ phase:4, title:'🔎 Einsatznachbesprechung – der Stabskonflikt',
      scene:`<p>Waldbrand unter Kontrolle. Keine Kräfteverluste. Jetzt: die strukturelle Frage. S3 Kraft und S2 Sommer sitzen sich im Nachgespräch schweigend gegenüber. Amtsleiter fragt dich: „Was war da heute los, und wie verhinderst du das?"</p>`,
      question:'Deine Antwort und dein Konzept?',
      options:[
        {letter:'A',text:'Sachliche Darstellung: Informationsblockade durch persönlichen Konflikt hat das Lagebild verzögert. Maßnahmen: 1. Pflichtgespräch beider Beteiligten mit Führungskraft. 2. Mediationsangebot. 3. SOP für Stabsarbeit: Informationspflichten sind nicht verhandelbar – schriftlich fixiert.',quality:'good',scoreDelta:+20,theory:'Systemische Antwort: Einzelkonflikt zum Anlass nehmen, Strukturen zu festigen. SOP für Informationspflichten ist Standard in professionellen Stabsorganisationen.',feedback:'Vollständig: Ursache, Konsequenz, Prävention.',next:'i_ende_gut'},
        {letter:'B',text:'Gibst zu, dass du den Konflikt früher hätten erkennen müssen, und entschuldigst dich beim Amtsleiter für das verzögerte Lagebild.',quality:'neutral',scoreDelta:+3,theory:'Selbstkritik ist wertvoll – aber ohne Systemlösung ist es nur persönliche Buße. Der nächste Stab wird dasselbe Problem haben.',feedback:'Ehrlich, aber ohne Konsequenzen.',next:'i_ende_mittel'},
        {letter:'C',text:'Empfiehlst dem Amtsleiter ein Rotationsprinzip: S2 und S3 werden künftig nie gemeinsam in einem Stab eingeteilt.',quality:'bad',scoreDelta:-8,theory:'Personalrotation als Dauerreaktion: begrenzt die Verfügbarkeit von qualifiziertem Personal und löst den Konflikt nicht.',feedback:'Dauerhaft unpraktisch und löst den Konflikt nicht.',next:'i_ende_mittel'}
      ]},
    'i_ende_gut':{ phase:4, isEnd:true, endScore:'good', title:'🏆 Stabsführung unter Extrembedingungen',
      scene:`<p>Waldbrand bezwungen. Keine Kräfteverluste. Informationsblockade frühzeitig erkannt und beendet. SOP für Stabsinformationspflichten wird für alle BOS übernommen. Amtsleiter: <em>„Das war knapp. Aber Sie haben die richtigen Entscheidungen getroffen."</em></p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'i_start'}]},
    'i_ende_mittel':{ phase:4, isEnd:true, endScore:'neutral', title:'🥈 Einsatz bewältigt – strukturelle Lücken',
      scene:`<p>Einsatz ohne Kräfteverluste. Die Informationsblockade wurde beendet, aber die strukturelle Antwort bleibt unvollständig. Beim nächsten Einsatz: dasselbe Risiko.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'i_start'}]}
  }
},

/* ------------------------------------------------------------------
   SZENARIO 8: AKUTE BELASTUNGSREAKTION NACH EINSATZ
   Anti-length-bias: Korrekte Antwort in Phase 2 die KÜRZESTE
------------------------------------------------------------------ */
belastung: {
  label: 'Szenario 08 – Akute Belastungsreaktion',
  start: 'bl_start',
  nodes: {
    'bl_start':{ phase:1, title:'🚗 VU mit Kindstod – Aufräumphase, 14:55 Uhr',
      scene:`<p>Schwerer VU auf der B27, PKW-Transporter, zwei Kinder (4 und 7 Jahre) wurden trotz sofortiger Reanimation nicht gerettet. Einsatz dauerte 2:40 Stunden. Du bist der B-Dienst vor Ort.</p><p>Dein Stellvertreter tritt leise zu dir: <em>„ZF Haas – Hinterfahrzeug. Er sitzt neben dem Fahrzeug auf der Leitplanke. Ich habe ihn angesprochen, er sagt: er bleibt. Er zittert leicht. Er schaut ins Leere."</em></p><div class="scene-ib"><strong>ZF Haas:</strong> 18 Dienstjahre, zwei Auszeichnungen, bekannt als stabiler und ruhiger Führer. Keine psychische Auffälligkeit in der Vergangenheit.</div>`,
      question:'Dein erster Schritt?',
      options:[
        {letter:'A',text:'Gehst selbst zu ihm. Setzt dich neben ihn auf die Leitplanke. Kein Befehl, keine Diagnose. Erstmal ankommen.',quality:'good',scoreDelta:+25,theory:'BELLA-Konzept Phase 1: Beobachten und Kontakt aufnehmen. Physisches Gleichsetzen (gleiche Höhe) signalisiert Augenhöhe, kein hierarchisches Gefälle. Keine sofortige Handlungsaufforderung.',feedback:'Richtig: Körpersprache vor Worten. Menschliche Präsenz ist die erste Intervention.',next:'bl_kontakt'},
        {letter:'B',text:'Organisierst zunächst: PSNV-Team alarmieren, Dokumentation beginnen, Dienstgruppenleiter informieren, Ablösekräfte für die restliche Aufräumarbeit anfordern – dann zu Haas.',quality:'bad',scoreDelta:-12,theory:'Verwaltungshandeln vor menschlichem Kontakt: Haas wartet allein, während Bürokratie läuft. Akute Belastungsreaktion erfordert sofortige menschliche Präsenz – Bürokratie danach.',feedback:'Er sitzt allein auf der Leitplanke, während du organisierst.',next:'bl_kontakt'},
        {letter:'C',text:'Rufst Haas direkt: „Haas – kommen Sie bitte sofort zu mir ins Fahrzeug."',quality:'bad',scoreDelta:-15,theory:'Befehlston bei akuter Belastungsreaktion: Der Befehlsreflex kann das letzte Stück Selbstkontrolle von Haas brüchig machen. Akute Stressreaktion ≠ Gehorsamkeitsproblem.',feedback:'Befehl in dieser Situation: er pariert ihn, zerbricht aber von innen.',next:'bl_kontakt'},
        {letter:'D',text:'Schickst seinen direkten Kollegen Bruckner zu ihm – der kennt Haas besser als du.',quality:'neutral',scoreDelta:+5,theory:'Peer-Unterstützung ist wertvoll – aber als B-Dienst trägst du die Führungsverantwortung. Eine Delegation des Erstkontakts sendet das falsche Signal: die Führungskraft kommt nicht selbst.',feedback:'Gut gemeint – aber du als Führungskraft musst zuerst kommen.',next:'bl_kontakt'}
      ]},
    'bl_kontakt':{ phase:2, title:'🤝 Seite an Seite auf der Leitplanke',
      scene:`<p>Du sitzt neben Haas. 30 Sekunden Schweigen. Dann: <em>„Ich kann nicht weg. Die anderen brauchen mich noch."</em></p><p>Sein Atem ist flach. Hände zittern minimal. Er schaut auf die Unfallstelle, nicht dich an.</p><div class="scene-ib"><strong>BELLA Phase 2 – Lauschen:</strong> Er kommuniziert nicht seinen Zustand, sondern seine Pflichtbindung. Das ist typisch für erfahrene Einsatzkräfte: Fürsorge für andere als Distanzierungsstrategie vom eigenen Erleben.</div>`,
      question:'Was sagst du als nächstes?',
      options:[
        {letter:'A',text:'„Haas – ich sehe Sie. Ich übernehme jetzt."',quality:'good',scoreDelta:+25,theory:'BELLA Phase 3: Lindern durch klare Übernahme. Kein Mitleid, keine Diagnose – Führungsübernahme als Entlastungsangebot. Die kürzeste Aussage ist hier die stärkste. Haas muss wissen: er darf jetzt loslassen.',feedback:'Sechs Worte. Genau richtig. Er muss nicht mehr funktionieren.',next:'bl_ablösung'},
        {letter:'B',text:'„Haas, ich verstehe Ihr Pflichtbewusstsein, und das zeichnet Sie aus. Aber ich muss Ihnen sagen, dass das, was Sie gerade zeigen, klassische Anzeichen einer akuten Belastungsreaktion sind. Forschung zeigt, dass frühzeitige Intervention Langzeitschäden deutlich reduziert. Es wäre das Beste für Sie und Ihre Kameraden, wenn Sie jetzt Abstand nehmen."',quality:'bad',scoreDelta:-15,theory:'Psychologischer Vortrag als Gesprächseinstieg: Haas hört nicht zu – er ist in einem Stressrespons-Zustand, der rationale Informationsverarbeitung einschränkt. Zahlen und Forschung erreichen ihn gerade nicht.',feedback:'Er hört nichts davon. Der Kortisol-Spiegel verhindert rationale Verarbeitung.',next:'bl_ablösung'},
        {letter:'C',text:'„Was genau ist gerade passiert – können Sie es mir beschreiben?"',quality:'bad',scoreDelta:-10,theory:'Nachfragen zum Trauma: Retraumatisierungsrisiko. Bei akuter Belastungsreaktion ist das Ereignis wiederholen oder Beschreiben kontraindiziert. Stattdessen: Sicherheit und Orientierung.',feedback:'Er muss es nicht nochmals durchleben. Das schadet.',next:'bl_ablösung'},
        {letter:'D',text:'„Haas, das war heute schwer. Für jeden von uns. Ich setze jetzt Bruckner als ZF ein – Sie können gehen."',quality:'neutral',scoreDelta:+8,theory:'Pragmatische Ablösung: korrekte Richtung, aber ohne echte Kontaktaufnahme fühlt sich die Ablösung nach Abschiebung an. Haas braucht das Gefühl: jemand sieht ihn, nicht nur seine Funktion.',feedback:'Richtige Entscheidung, falsche Ausführung. Er fühlt sich abgeschoben.',next:'bl_ablösung'}
      ]},
    'bl_ablösung':{ phase:3, title:'🏥 Ablösung – und das PSNV-Angebot',
      scene:`<p>Haas steht auf. Er nickt. Du spürst: Er vertraut dir gerade. Dann, leise: <em>„Ich brauche keine Psychos."</em></p><p>Du hast jetzt einen Peer-Unterstützer (Kamerad Weinert, ausgebildeter PSNV-Ersthelfer) bereit. Wie bringst du das PSNV-Angebot?</p>`,
      question:'Wie sorgst du für die Übergabe?',
      options:[
        {letter:'A',text:'„Das ist kein Zeichen von Schwäche – ich habe ihn selbst genutzt. Ich bitte Sie um ein erstes Gespräch mit Weinert. Danach entscheiden Sie selbst."',quality:'good',scoreDelta:+20,theory:'Selbstoffenbarung als Führungsinstrument: eigene Inanspruchnahme von PSNV normalisiert die Hilfe. Autonomie erhalten (danach entscheiden) reduziert Widerstand. PSNV-Stigma ist die größte Barriere.',feedback:'Richtig: Normalisierung + Autonomie. Er fühlt sich nicht pathologisiert.',next:'bl_nachsorge'},
        {letter:'B',text:'Akzeptierst sein Nein: „Wenn Sie das so sehen – hier ist die Nummer des EAP, falls Sie später doch möchten." Und lässt ihn fahren.',quality:'bad',scoreDelta:-15,theory:'Akute Belastungsreaktion: Autonomierespekt ist wichtig, aber alleinige Heimfahrt nach psychischem Ausnahmezustand ist nicht vertretbar. Haas sollte nicht allein sein – auch wenn er das sagt.',feedback:'Er fährt allein nach Hause. Das ist nicht fürsorglich – das ist Wegschauen.',next:'bl_nachsorge'},
        {letter:'C',text:'Erklärst ausführlich das PSNV-Programm: Kostenfreiheit, Vertraulichkeit, Forschungslage zu PTSD bei Ersthelfern, Unterschied zwischen akuter Belastungsreaktion und Posttraumatischer Belastungsstörung, Statistiken zu Langzeitfolgen und den Mehrwert von Frühintervention.',quality:'bad',scoreDelta:-10,theory:'Informationsflut bei Widerstand: Haas hat gerade entschieden NEIN gesagt. Jede Information, die jetzt kommt, ist Gegendruck – und stärkt seinen Widerstand.',feedback:'Mehr Information verstärkt seinen Widerstand.',next:'bl_nachsorge'},
        {letter:'D',text:'Stellst Weinert einfach vor: „Das ist Weinert, er fährt jetzt mit dir." – ohne Erklärung.',quality:'neutral',scoreDelta:+8,theory:'Pragmatisch und schützt Haas vor der Heimfahrt allein – aber ohne Erklärung wirkt es wie Kontrolle, nicht Fürsorge.',feedback:'Schutz ohne Erklärung. Besser als allein – aber Haas fühlt sich nicht gehört.',next:'bl_nachsorge'}
      ]},
    'bl_nachsorge':{ phase:4, title:'📋 Nächste Schicht – Führungsfolgepflicht',
      scene:`<p>Haas hat das Erstgespräch mit Weinert angenommen. Morgen beginnt seine nächste Schicht. Amtsarzt hat keine formale Einschränkung ausgesprochen. Wie gehst du vor?</p>`,
      question:'Dein Nachsorgeprozess?',
      options:[
        {letter:'A',text:'Persönliches Check-in mit Haas vor Schichtbeginn – nicht im Beisein anderer. Kurze Rückmeldung: Wie geht es? Ist er dienstfähig? Kein Druck zur Antwort. Schickt ihm das EAP nochmals. Dokumentiert den Vorfall und Nachsorgemaßnahmen.',quality:'good',scoreDelta:+20,theory:'Führungsfolgepflicht: PSNV ist kein einmaliges Angebot. Persönliches Check-in unter vier Augen schützt vor Gesichtsverlust. Dokumentation schützt beide Seiten.',feedback:'Vollständig: menschlich, diskret, dokumentiert.',next:'bl_ende_gut'},
        {letter:'B',text:'Wartest ab, ob Haas sich meldet – du willst ihn nicht unter Druck setzen.',quality:'bad',scoreDelta:-12,theory:'Passive Nachsorge: Erfahrene Einsatzkräfte melden sich oft nicht von selbst – der Antreiber „Sei stark" verhindert das. Aktive Führungsfolgepflicht ist notwendig.',feedback:'Er meldet sich nicht. Du hörst nichts – bis zum nächsten Einsatz.',next:'bl_ende_mittel'},
        {letter:'C',text:'Informierst das gesamte Team in der Dienstbesprechung über den Vorfall und PSNV-Möglichkeiten – als kollektives Awareness-Erlebnis.',quality:'bad',scoreDelta:-15,theory:'Öffentliche Erwähnung ohne Haas Einwilligung: Datenschutzverstoß, Vertrauensbruch, Stigmatisierung. Haas verliert das Vertrauen in die Führung.',feedback:'Haas wird nie wieder offen mit dir sein.',next:'bl_ende_mittel'}
      ]},
    'bl_ende_gut':{ phase:4, isEnd:true, endScore:'good', title:'🏆 Führungsfürsorge auf höchstem Niveau',
      scene:`<p>Haas nimmt eine kurze Auszeit in Absprache mit dem Betriebsarzt. Drei Wochen später kehrt er zurück – und spricht bei einer internen Fortbildung freiwillig über den Einsatz. Deine Fürsorge hat einen erfahrenen Einheitsführer gehalten. <em>„Ich hätte hingeschmissen, wenn Sie damals nicht gekommen wären."</em></p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'bl_start'}]},
    'bl_ende_mittel':{ phase:4, isEnd:true, endScore:'neutral', title:'🥈 Einsatz bewältigt – Haas\' Zustand offen',
      scene:`<p>Haas erscheint zur nächsten Schicht. Er wirkt distanziert. Kein weiteres Gespräch. Zwei Monate später: Krankmeldung wegen „Erschöpfung". Eine frühere Intervention hätte das möglicherweise verhindert.</p>`,
      options:[{letter:'↺',text:'Szenario neu starten',quality:'restart',next:'bl_start'}]}
  }
}

}; // Ende SCENARIOS

/* ======================================================================
   SIMULATOR CORE ENGINE
====================================================================== */
const SIM = {
  score: 100,
  nodeId: null,
  currentScenario: null,

  loadScenario(key){
    this.currentScenario = key;
    this.score = 100;
    this.nodeId = SCENARIOS[key].start;
    document.getElementById('sim-menu-wrap').classList.add('hidden');
    document.getElementById('sim-game-wrap').classList.remove('hidden');
    document.getElementById('sim-scenario-label').textContent = SCENARIOS[key].label;
    this.renderNode(this.nodeId);
    this.syncUI();
    // Szenario als eigener Schritt im Verlauf: Zurück (Kopfzeile, Wischen, Gerätetaste) führt zur Szenario-Übersicht
    if(!this._pushed){ this._pushed=true; NAV.go('v-simulator',SCENARIOS[key].label); }
  },

  // „← Szenarien“: über den Verlauf zurück, damit dieser stimmt
  exitToMenu(){
    if(this._pushed){ this._pushed=false; NAV.back(); } else this.backToMenu();
  },

  _simLoad(){ try{return JSON.parse(localStorage.getItem('bvi_sim')||'{}');}catch{return{};} },
  _simSave(d){ try{localStorage.setItem('bvi_sim',JSON.stringify(d));}catch{} },

  backToMenu(){
    document.getElementById('sim-game-wrap').classList.add('hidden');
    document.getElementById('sim-menu-wrap').classList.remove('hidden');
    document.getElementById('sim-stage').innerHTML = '';
    this.syncScore();
    this.syncPhase(0);
    this._refreshCards();
  },

  _refreshCards(){
    const data=this._simLoad();
    document.querySelectorAll('.sc-card[data-scenario]').forEach(card=>{
      const key=card.dataset.scenario;
      const d=data[key];
      let badge=card.querySelector('.sc-done-badge');
      if(d&&d.plays>0){
        if(!badge){badge=mk('div','sc-done-badge');card.appendChild(badge);}
        badge.textContent='✓ '+d.plays+'× · Beste: '+d.best+' Pkt';
      }
    });
  },

  restart(){
    if(!this.currentScenario) return;
    this.score = 100;
    this.nodeId = SCENARIOS[this.currentScenario].start;
    document.getElementById('sim-stage').innerHTML = '';
    this.renderNode(this.nodeId);
    this.syncUI();
  },

  renderNode(id){
    const nodes = SCENARIOS[this.currentScenario].nodes;
    const node = nodes[id];
    if(!node){ console.warn('[SIM] Unbekannter Knoten:', id); return; }
    this.nodeId = id;
    this.syncPhase(node.phase);
    const stage = document.getElementById('sim-stage');
    stage.innerHTML = '';
    if(node.isEnd){ this.renderEnd(node); return; }

    const hdr = mk('div','scene-hdr');
    hdr.innerHTML = `<span class="scene-title">${node.title}</span><span class="scene-ph">Phase ${node.phase}/4</span>`;

    const body = mk('div','scene-body');
    body.innerHTML = node.scene;

    const q = mk('div','scene-q');
    q.textContent = node.question;

    const opts = mk('div','opts-wrap');
    opts.id = 'sim-opts';
    (node.options||[]).forEach(opt => {
      const btn = mk('button',`opt-btn${opt.quality==='restart'?' restart':''}`);
      btn.innerHTML = `<span class="opt-ltr">${opt.letter}</span><span>${xss(opt.text)}</span>`;
      btn.addEventListener('click', () => this.pick(opt));
      opts.appendChild(btn);
    });

    stage.append(hdr, body, q, opts);
    stage.scrollIntoView({behavior:'smooth',block:'nearest'});
  },

  pick(opt){
    if(opt.quality === 'restart'){ this.restart(); return; }
    this.score = Math.max(0, Math.min(100, this.score + (opt.scoreDelta||0)));
    this.syncScore();
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);

    const optsEl = document.getElementById('sim-opts');
    if(optsEl){
      const icons = {good:'✅',neutral:'⚠️',bad:'❌'};
      const fb = mk('div',`fb-box ${opt.quality}`);
      fb.innerHTML = `<strong>${icons[opt.quality]||''} ${xss(opt.feedback)}</strong>${opt.theory?`<div class="fb-theory">📚 ${xss(opt.theory)}</div>`:''}`;
      optsEl.after(fb);
      const cont = mk('button','cont-btn');
      cont.textContent = 'Weiter →';
      cont.addEventListener('click', () => { if(opt.next) this.renderNode(opt.next); });
      fb.after(cont);
    }
  },

  renderEnd(node){
    const stage = document.getElementById('sim-stage');
    const icons = {good:'🏆',neutral:'🥈',bad:'🔴'};
    const score = node.endScore==='bad' ? Math.min(this.score,30) : this.score;
    const wrap = mk('div','sim-end');
    wrap.innerHTML = `
      <div class="sim-end-icon">${icons[node.endScore]||'🎯'}</div>
      <div class="sim-end-title">${node.title}</div>
      <div class="scene-body" style="text-align:left;max-width:500px;margin:0 auto 1.5rem">${node.scene}</div>
      <div class="score-big ${node.endScore}">${score}</div>
      <div class="score-big-sub">Führungspunkte / 100</div>`;
    (node.options||[]).forEach(opt => {
      const btn = mk('button','btn btn-red');
      btn.textContent = opt.text;
      btn.style.marginTop = '.5rem';
      btn.addEventListener('click',() => this.restart());
      wrap.appendChild(btn);
    });
    const menuBtn = mk('button','btn sim-back-btn');
    menuBtn.textContent = '← Zur Übersicht';
    menuBtn.addEventListener('click',() => this.exitToMenu());
    wrap.appendChild(menuBtn);
    stage.innerHTML = '';
    stage.appendChild(wrap);
    // Track completion
    const data=this._simLoad();
    const key=this.currentScenario;
    if(!data[key])data[key]={plays:0,best:0};
    data[key].plays++;data[key].best=Math.max(data[key].best,score);
    this._simSave(data);
  },

  syncScore(){
    const f=document.getElementById('score-fill');
    const v=document.getElementById('score-val');
    if(f) f.style.width = this.score+'%';
    if(v) v.textContent = this.score;
  },
  syncPhase(cur){
    for(let i=1;i<=4;i++){
      const el=document.getElementById(`ps-${i}`);
      if(!el) continue;
      el.classList.remove('active','done');
      if(i<cur) el.classList.add('done');
      if(i===cur) el.classList.add('active');
    }
  },
  syncUI(){ this.syncScore(); }
};

/* ======================================================================
   HILFSFUNKTIONEN
====================================================================== */
function mk(tag,cls){ const e=document.createElement(tag); e.className=cls; return e; }
function xss(s){ if(!s) return ''; const d=document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

/* ======================================================================
   FLASHCARD-DATEN
====================================================================== */
const FLASHCARD_DATA = [
  {id:'f01',cat:'SFS · Taktik',q:'Was ist der Führungsvorgang nach FwDV 100?',a:'Ein <strong>kontinuierlicher Kreislauf</strong> aus Lagefeststellung → Planung (Entschluss/Beurteilung) → Befehlsgebung → Kontrolle. Nicht statisch – wird bei neuen Informationen erneut durchlaufen.'},
  {id:'f02',cat:'SFS · Taktik',q:'Was bedeutet die Abkürzung MELDEN?',a:'<strong>M</strong>eldender · <strong>E</strong>insatzstelle · <strong>L</strong>age · <strong>D</strong>urchgeführte Maßnahmen · <strong>E</strong>inheiten im Einsatz · <strong>N</strong>achforderungen'},
  {id:'f03',cat:'SFS · Taktik',q:'Was bedeutet STOP bei der Gefahrenabwehr?',a:'<strong>S</strong>ubstitution · <strong>T</strong>echnische Lösung · <strong>O</strong>rganisatorisch · <strong>P</strong>ersönliche Maßnahme (Priorität nimmt ab!)'},
  {id:'f04',cat:'SFS · Taktik',q:'Was sind die 4A der Gefahrenmatrix (4A-C-4E)?',a:'<strong>A</strong>temgifte · <strong>A</strong>ngstreaktionen · <strong>A</strong>usbreitung · <strong>A</strong>tomare Gefahren (Gefahren für Personen, Tiere, Umwelt)'},
  {id:'f05',cat:'SFS · Taktik',q:'Was sind die 4E der Gefahrenmatrix?',a:'<strong>E</strong>rkrankung/Verletzung · <strong>E</strong>xplosion · <strong>E</strong>lektrizität · <strong>E</strong>insturz (Gefahren für Kräfte & Geräte)'},
  {id:'f06',cat:'SFS · Taktik',q:'Welche Stärke hat eine Gruppe nach FwDV 3?',a:'<strong>1/8 – 1/9</strong>: Gruppenführer, Melder, Maschinist, Angriffstrupp (2), Wassertrupp (2), Schlauchtrupp (2). Typisches Fahrzeug: LF 10 oder LF 20.'},
  {id:'f07',cat:'SFS · Taktik',q:'Was sind die Führungsstufen A–D?',a:'<strong>A:</strong> Führen ohne Führungseinheit (bis 2 Gruppen) · <strong>B:</strong> Mit örtlicher Führungseinheit (Zug) · <strong>C:</strong> Mit Führungsgruppe (Verband) · <strong>D:</strong> Mit Führungsgruppe/-stab (B VI)'},
  {id:'f08',cat:'SFS · Taktik',q:'Was sind die 3 Lagen bei der Lagefeststellung?',a:'<strong>Allgemeine Lage:</strong> Zeit, Ort, Wetter · <strong>Schadenslage:</strong> Schaden, Objekt, Umfang · <strong>Eigene Lage:</strong> Führung, Kräfte, Mittel'},
  {id:'f09',cat:'SFS · Methodik',q:'Was sind die 5 Phasen des AVIVA-Modells?',a:'<strong>A</strong>nkommen & Einstimmen · <strong>V</strong>orwissen aktivieren · <strong>I</strong>nformieren · <strong>V</strong>erarbeiten · <strong>A</strong>uswerten'},
  {id:'f10',cat:'SFS · Methodik',q:'Aus welchen Komponenten besteht ein Lernziel?',a:'Einer <strong>Handlungskomponente</strong> (messbares Verb) + einer <strong>Inhaltskomponente</strong> (Substantiv). Kein „können", „wissen" oder „kennen"!'},
  {id:'f11',cat:'SFS · Methodik',q:'Was sind die 3 Lernzielbereiche nach Bloom?',a:'<strong>Kognitiv</strong> (Wissen/Verstehen) · <strong>Psychomotorisch</strong> (Praktische Fertigkeiten) · <strong>Affektiv</strong> (Einstellungen/Werte)'},
  {id:'f12',cat:'SFS · Methodik',q:'Welche 4 Stufen hat die 4-Stufen-Methode?',a:'1. <strong>Vorbereiten</strong> (Lernziel nennen) · 2. <strong>Vorführen</strong> (Ausbilder zeigt & erklärt) · 3. <strong>Nachmachen</strong> (TN führt durch) · 4. <strong>Üben</strong> (selbstständige Anwendung)'},
  {id:'f13',cat:'SFS · Methodik',q:'Was ist ein UVP?',a:'<strong>Unterrichtsvorbereitungsplan</strong> – strukturierter Plan mit Lernzielen, Methoden, Medien und Zeitplanung. Regelkreis: Analyse → Struktur → Durchführung → Kontrolle.'},
  {id:'f14',cat:'SFS · Methodik',q:'Wie ist die Lernzielhierarchie aufgebaut?',a:'<strong>Leitziele</strong> (übergeordnet) → <strong>Richtziele</strong> (Lernbereich/Fach) → <strong>Grobziele</strong> (Unterrichtseinheit) → <strong>Feinziele</strong> (operationalisierbar & prüfbar)'},
  {id:'f15',cat:'SFS · Recht',q:'Was besagt die Normenpyramide?',a:'Höherrangiges Recht bricht niederrangiges: <strong>EU-Recht > GG > Bundesgesetze > Landesgesetze > Rechtsverordnungen > Satzungen > Verwaltungsvorschriften</strong>'},
  {id:'f16',cat:'SFS · Recht',q:'Was bedeuten „Muss", „Soll" und „Kann" im FW-Recht?',a:'<strong>Muss</strong> = zwingend · <strong>Soll</strong> = Regelfall, nur ausnahmsweise abweichbar · <strong>Kann</strong> = Ermessen des Handelnden'},
  {id:'f17',cat:'SFS · Recht',q:'Wann liegt Einsatzleitung kraft Gesetzes vor?',a:'Der zuerst eintreffende Einheitsführer übernimmt automatisch die Einsatzleitung – ohne ausdrückliche Ernennung, solange kein ranghöherer Einsatzleiter eingetroffen ist.'},
  {id:'f18',cat:'HLFS · Führung',q:'Was bedeutet GAMS?',a:'<strong>G</strong>efahr erkennen · <strong>A</strong>bsperrung einrichten · <strong>M</strong>enschen retten · <strong>S</strong>pezialkräfte anfordern (erste Maßnahmen an GABC-Einsatzstellen)'},
  {id:'f19',cat:'HLFS · Führung',q:'Was ist die EIMER-Regel?',a:'<strong>E</strong>insatzgrenzen festlegen · <strong>I</strong>nformationen beschaffen · <strong>M</strong>aßnahmen abstimmen · <strong>E</strong>rkundung fortsetzen · <strong>R</strong>ückmeldung erstatten'},
  {id:'f20',cat:'HLFS · Führung',q:'Was unterscheidet Zug- und Verbandsführer?',a:'<strong>Zugführer:</strong> Führt 2–3 Gruppen, Führungsstufe B · <strong>Verbandsführer:</strong> Führt mehrere Züge, Führungsstufe C, mit Führungsgruppe, zuständig für einen Einsatzabschnitt.'},
  {id:'f21',cat:'HLFS · GABC',q:'Welche Körperschutzformen gibt es nach FwDV 500?',a:'<strong>Form 1:</strong> Feuerwehrschutzkleidung + umluftunabhängiger Atemschutz (ggf. Kontaminationsschutzhaube) · <strong>Form 2:</strong> Form 1 + Kontaminationsschutzanzug (Spritzschutz) · <strong>Form 3:</strong> gasdichter Chemikalienschutzanzug (CSA) mit innenliegendem Atemschutz'},
  {id:'f22',cat:'HLFS · GABC',q:'Was sind die Absperrgrenzen bei GABC-Einsätzen?',a:'<strong>Innere Absperrung:</strong> Gefahrenbereich (nur Einsatzkräfte mit PSA) · <strong>Äußere Absperrung:</strong> Einsatzbereich (kein Publikum). Mindestabstand je nach Stoff.'},
  {id:'f23',cat:'HLFS · GABC',q:'Was sind die 3 Dekontaminationsstufen?',a:'<strong>Dekon P:</strong> Personendekontamination · <strong>Dekon G:</strong> Gerätedekontamination · <strong>Dekon V:</strong> Verletzten-Dekontamination (ggf. Notdekon vorab)'},
  {id:'f24',cat:'HLFS · MANV',q:'Was sind die MANV-Sichtungskategorien?',a:'<strong>SK I:</strong> Lebensrettende Sofortmaßnahmen · <strong>SK II:</strong> Schwerverletzt, Behandlung aufschiebbar · <strong>SK III:</strong> Leichtverletzt · <strong>SK IV:</strong> Ohne Überlebenschance'},
  {id:'f25',cat:'HLFS · MANV',q:'Was ist der OLRD?',a:'<strong>Organisatorischer Leitender Rettungsdienst</strong> – koordiniert die medizinische Versorgung am MANV. Bildet mit dem LNA (Leitender Notarzt) die medizinische Einsatzleitung.'},
  {id:'f26',cat:'HLFS · MANV',q:'Welche Bereiche werden am MANV eingerichtet?',a:'<strong>Patientenablage (PA)</strong> · <strong>Behandlungsplatz (BHP)</strong> mit SK I–IV-Bereichen · <strong>Verletztensammelstelle</strong> · <strong>Transportorganisation</strong>'},
  {id:'f27',cat:'HLFS · Stab',q:'Was sind die Sachgebiete S1–S6 im Stab?',a:'<strong>S1:</strong> Personal · <strong>S2:</strong> Lage · <strong>S3:</strong> Einsatz · <strong>S4:</strong> Versorgung · <strong>S5:</strong> Presse/Medien · <strong>S6:</strong> IuK'},
  {id:'f28',cat:'HLFS · Stab',q:'Ab welcher Führungsstufe wird ein Stab gebildet?',a:'Ab <strong>Führungsstufe D</strong> (mehrere Verbände / B VI). Besteht aus: Leiter des Stabs, S1–S6, Verbindungspersonen und Fachdienst-Verbindungsführer.'},
  {id:'f29',cat:'HLFS · Stab',q:'Was ist eine TEL?',a:'<strong>Technische Einsatzleitung</strong> – mobile Führungseinrichtung ab Führungsstufe C/D. Besteht aus: Führungsfahrzeug/-container, IuK-Einheit und Stab (S1–S6).'},
  {id:'f30',cat:'HLFS · Tunnel',q:'Warum sind Tunnelbrände besonders gefährlich?',a:'<strong>Kamineffekt/Druckdifferenz</strong> · Eingeschlossene Personen · Verrauchung über weite Strecken · Eingeschränkte Rettungswege · Hitzestau · Infrastrukturausfall.'},
  {id:'f31',cat:'HLFS · Tunnel',q:'Welche Ventilationsstrategien gibt es im Tunnel?',a:'<strong>Longitudinal:</strong> Längsventilation (Strömung in Fahrtrichtung) · <strong>Transversal:</strong> Querventilation (Zuluft/Abluft getrennt) · Brandrauchverdünnung durch Überdruck.'},
  {id:'f32',cat:'HLFS · Vorbeugen',q:'Was sind die 3 Säulen des vorbeugenden Brandschutzes?',a:'<strong>Baulich:</strong> Brandwände, Trennwände, Rettungswege · <strong>Anlagentechnisch:</strong> Sprinkler, RWA, BMA · <strong>Organisatorisch:</strong> Evakuierungsplan, Brandschutzbeauftragter'},
  {id:'f33',cat:'HLFS · Führung',q:'Was sind die 8 Führungsfragen nach FwDV 100?',a:'Lage? – Auftrag? – Eigene Möglichkeiten? – Entschluss? – Befehl? – Rückmeldung? – Kontrolle? – Neue Lage? <strong>(Kreislauf!)</strong>'},
  {id:'f34',cat:'IBK · TA',q:'Was sind die 3 Ich-Zustände nach Eric Berne?',a:'<strong>Eltern-Ich (EI):</strong> Kritisch kEI / fürsorglich fEI · <strong>Erwachsenen-Ich (ErI):</strong> Sachlich, rational · <strong>Kind-Ich (KI):</strong> Spontan, angepasst oder rebellisch'},
  {id:'f35',cat:'IBK · TA',q:'Was ist eine komplementäre Transaktion?',a:'Kommunikation verläuft <strong>parallel</strong> – der angesprochene Ich-Zustand antwortet (z.B. ErI→ErI). Kann <strong>unbegrenzt</strong> weitergehen; kein Konflikt.'},
  {id:'f36',cat:'IBK · TA',q:'Was ist eine gekreuzte Transaktion?',a:'Antwort aus einem <strong>anderen als dem angesprochenen</strong> Ich-Zustand → <strong>Kommunikationsabbruch</strong>. Beispiel: ErI-Frage → kEI-Antwort = Konflikt.'},
  {id:'f37',cat:'IBK · TA',q:'Was sind die 4 Grundpositionen nach der TA?',a:'Ich OK / Du OK (gesund) · Ich OK / Du nicht OK · Ich nicht OK / Du OK · Ich nicht OK / Du nicht OK (tiefste Krise)'},
  {id:'f38',cat:'IBK · TA',q:'Was sind die 5 „Antreiber" nach Taibi Kahler?',a:'<strong>Sei perfekt!</strong> · <strong>Beeil dich!</strong> · <strong>Streng dich an!</strong> · <strong>Mach es allen recht!</strong> · <strong>Sei stark!</strong> (unbewusste Glaubenssätze unter Stress)'},
  {id:'f39',cat:'IBK · Konflikt',q:'Welche 9 Stufen hat Glasls Eskalationsmodell?',a:'Stufe 1–3: Win-win möglich · 4–6: Win-lose (Moderation nötig) · 7–9: Lose-lose (nur externe Machteingriffe helfen). Ab Stufe 4: Koalitionsbildung.'},
  {id:'f40',cat:'IBK · Konflikt',q:'Was ist das Karpman-Dreieck?',a:'Dynamik zwischen 3 Rollen: <strong>Verfolger</strong> (Täter) · <strong>Retter</strong> (Helfer) · <strong>Opfer</strong>. Rollen sind austauschbar. Ziel: Alle in die Erwachsenenrolle führen.'},
  {id:'f41',cat:'IBK · Konflikt',q:'Was besagen die 5 Axiome von Watzlawick?',a:'1. Man kann nicht nicht kommunizieren · 2. Inhalts- & Beziehungsaspekt · 3. Interpunktion der Ereignisfolge · 4. Digital & analog · 5. Symmetrisch & komplementär'},
  {id:'f42',cat:'IBK · Konflikt',q:'Was ist die Mehrabian-Formel?',a:'Kommunikationswirkung: <strong>7% Worte</strong> · <strong>38% Tonfall/Stimme</strong> · <strong>55% Körpersprache</strong>. Gilt bei emotionalen/widersprüchlichen Nachrichten – nicht bei reiner Sachinformation!'},
  {id:'f43',cat:'IBK · Konflikt',q:'Was sind die 4 Seiten einer Nachricht (Schulz von Thun)?',a:'<strong>Sachinhalt</strong> (Information) · <strong>Selbstoffenbarung</strong> (was ich von mir zeige) · <strong>Beziehungshinweis</strong> (wie ich zu dir stehe) · <strong>Appell</strong> (was ich will)'},
  {id:'f44',cat:'IBK · Stress',q:'Was bedeutet das S-O-R-K-C-Modell?',a:'<strong>S</strong>timulus → <strong>O</strong>rganismus (intern) → <strong>R</strong>eaktion → <strong>K</strong>onsequenz → <strong>C</strong>ontingenz. Stress entsteht durch die interne Bewertung, nicht nur durch den Reiz!'},
  {id:'f45',cat:'IBK · Stress',q:'Was ist der Flow-Kanal nach Csikszentmihalyi?',a:'Optimaler Zustand wenn <strong>Anforderungen = Fähigkeiten</strong>. Zu niedrig → Langeweile. Zu hoch → Angst/Stress. Flow: vollständige Absorption, Zeitverlust, hohe Leistung.'},
  {id:'f46',cat:'IBK · Stress',q:'Was sind die 3 Ebenen des biopsychosozialen Modells?',a:'<strong>Biologisch:</strong> körperliche Belastung, Erkrankung · <strong>Psychologisch:</strong> kognitive Bewertung, Persönlichkeit · <strong>Sozial:</strong> Arbeitsklima, soziale Unterstützung'},
  {id:'f47',cat:'IBK · Stress',q:'Was ist das JD-R-Modell?',a:'<strong>Job Demands-Resources:</strong> Hohe Anforderungen + geringe Ressourcen → Burnout-Risiko. Hohe Ressourcen puffern Anforderungen ab und fördern Engagement.'},
  {id:'f48',cat:'IBK · PSNV',q:'Was ist die Alarmierungsformel im PSNV?',a:'<strong>Wer – Wo – Was – Wann – Wie viele – Warnung vor Gefahren</strong> (6 W). Strukturierte Kommunikation bei psychosozialer Notfallversorgung.'},
  {id:'f49',cat:'IBK · PSNV',q:'Was ist Demobilisation?',a:'Strukturierter Abschluss nach Belastungseinsätzen: kurze Zusammenfassung, erste Verarbeitung im Team, Hinweis auf Normalreaktionen und weiterführende Hilfe. Kein Debriefing!'},
  {id:'f50',cat:'IBK · PSNV',q:'Was besagt das BELLA-Konzept?',a:'<strong>B</strong>eziehung herstellen · <strong>E</strong>rfassen der Situation · <strong>L</strong>indern akuter Belastung · <strong>L</strong>angfristig stabilisieren · <strong>A</strong>bklären weiterer Hilfe'},
  {id:'f51',cat:'IBK · BGM',q:'Was sind die 6 Dimensionen des PERMA-H-Modells?',a:'<strong>P</strong>ositive Emotionen · <strong>E</strong>ngagement · <strong>R</strong>elationships · <strong>M</strong>eaning (Sinn) · <strong>A</strong>ccomplishment · <strong>H</strong>ealth (Gesundheit)'},
  {id:'f52',cat:'IBK · BGM',q:'Was ist Salutogenese nach Antonovsky?',a:'Fokus auf <strong>gesundheitserhaltende Faktoren</strong> statt Krankheitsursachen. Kernkonzept: <strong>Kohärenzgefühl</strong> (Verstehbarkeit + Handhabbarkeit + Bedeutsamkeit).'},
  {id:'f53',cat:'IBK · BGM',q:'Was sind die 3 Dimensionen von Burnout nach Maslach?',a:'<strong>Emotionale Erschöpfung</strong> · <strong>Depersonalisation</strong> (Zynismus, innere Distanzierung) · <strong>Reduzierte persönliche Leistungsfähigkeit</strong>'},
  {id:'f54',cat:'IBK · BGM',q:'Was sind die 3 Säulen des BGM?',a:'<strong>Betriebliche Gesundheitsförderung (BGF)</strong> · <strong>Arbeitsschutz/Arbeitssicherheit</strong> · <strong>Betriebliches Eingliederungsmanagement (BEM)</strong>'},
  {id:'f55',cat:'IBK · PM',q:'Was ist der kritische Pfad (CPM)?',a:'Die längste Kette von Vorgängen im Netzplan <strong>ohne Puffer</strong>. Bestimmt die Gesamtprojektdauer. Jede Verzögerung am kritischen Pfad verzögert das gesamte Projekt.'},
  {id:'f56',cat:'IBK · PM',q:'Was ist ein Stakeholder-Mapping?',a:'Analyse der Projektbeteiligten nach <strong>Einfluss (Macht)</strong> und <strong>Interesse</strong>. 4-Felder-Matrix: High/High = eng einbeziehen · Low/Low = beobachten.'},
  {id:'f57',cat:'IBK · PM',q:'Was sind die 4 Felder der Risikomatrix?',a:'Eintrittswahrscheinlichkeit × Schadensausmaß: <strong>Hoch/Hoch:</strong> Sofortmaßnahme · <strong>Hoch/Niedrig:</strong> Prozess verbessern · <strong>Niedrig/Hoch:</strong> Notfallplan · <strong>Niedrig/Niedrig:</strong> Akzeptieren'},
  {id:'f58',cat:'IBK · Zeit',q:'Was ist die ALPEN-Methode?',a:'<strong>A</strong>ufgaben aufschreiben · <strong>L</strong>änge schätzen · <strong>P</strong>uffer einplanen (60/40-Regel) · <strong>E</strong>ntscheidungen/Prioritäten · <strong>N</strong>achkontrollieren'},
  {id:'f59',cat:'IBK · Zeit',q:'Was ist das Pareto-Prinzip im Zeitmanagement?',a:'<strong>80% des Ergebnisses</strong> wird mit <strong>20% des Aufwands</strong> erzielt. Fokus auf die wichtigsten 20% der Aufgaben statt alles gleichwertig zu behandeln.'},
  {id:'f60',cat:'IBK · Zeit',q:'Was bedeutet „Eat the Frog"?',a:'Die <strong>unangenehmste, wichtigste Aufgabe zuerst</strong> erledigen. Verhindert Aufschieben und schafft mentale Freiheit für den Rest des Tages (nach Mark Twain).'},
  {id:'f61',cat:'IBK · Zeit',q:'Was ist Deep Work nach Cal Newport?',a:'Zustand der <strong>ablenkungsfreien Konzentration</strong> auf kognitive Hochleistungsaufgaben. Gegenteil: Shallow Work (E-Mails, Meetings). Bestimmt professionelle Qualität.'},
  {id:'g01',cat:'GAL · Brandlehre',q:'Welche vier Komponenten bilden das Branddreieck/Tetraeder und welche kommt beim Tetraeder hinzu?',a:'<strong>Branddreieck:</strong> Brennstoff, Sauerstoff, Energie (Zündquelle).<br><strong>Brand-Tetraeder ergänzt:</strong> ungestörte Kettenreaktion (Radikalkette). Löscheffekte zielen auf das Entfernen mindestens einer Komponente.'},
  {id:'g02',cat:'GAL · Brandlehre',q:'Nenne die Brandklassen A-F mit jeweils einem Beispielstoff.',a:'<ul><li><strong>A</strong> - feste, glutbildende Stoffe (Holz, Papier)</li><li><strong>B</strong> - flüssige/verflüssigende Stoffe (Benzin, Wachs)</li><li><strong>C</strong> - Gase (Propan, Erdgas)</li><li><strong>D</strong> - Metalle (Mg, Na, Al)</li><li><strong>F</strong> - Speisefette/-öle in Frittiergeräten</li></ul>'},
  {id:'g03',cat:'GAL · Brandlehre',q:'Was ist ein Flash-Over und welche Vorzeichen warnen davor?',a:'<strong>Flash-Over (Raumdurchzündung):</strong> alle brennbaren Oberflächen erreichen Zündtemperatur und entzünden sich nahezu gleichzeitig.<br><strong>Vorzeichen:</strong> rollende Rauchwalzen unter der Decke, Pyrolysegasflammen ("Engelshaare"), schnell steigende Deckentemperatur (&gt;500 °C), Pfeifen/Saugen an Öffnungen.'},
  {id:'g04',cat:'GAL · Brandlehre',q:'Was passiert bei einem Backdraft und wie unterscheidet er sich vom Flash-Over?',a:'<strong>Backdraft (Rauchgasexplosion):</strong> in einem schwelenden, sauerstoffarmen Raum entzündet sich das fette Rauchgas-Luftgemisch nach plötzlicher Luftzufuhr (Türöffnung) schlagartig.<br><strong>Unterschied:</strong> Flash-Over braucht Sauerstoff und Hitze; Backdraft braucht zusätzlich die plötzliche Belüftung eines unterventilierten Raumes.'},
  {id:'g05',cat:'GAL · Brandlehre',q:'Was bedeutet BLEVE und wie entsteht sie?',a:'<strong>BLEVE = Boiling Liquid Expanding Vapour Explosion.</strong><br>Verflüssigtes Gas in einem geschlossenen Behälter erwärmt sich. Bei Druckverlust verdampft die überhitzte Flüssigkeit schlagartig, das Gas-Luftgemisch entzündet sich. Folge: Druckwelle + Feuerball (50-150 m Radius bei Propan).'},
  {id:'g06',cat:'GAL · Brandlehre',q:'Welche Löschwirkungen kennst du und ordne Wasser, CO2 und ABC-Pulver zu.',a:'<strong>Wirkungen:</strong> Abkühlen, Ersticken, Verdünnen, Inhibition (Kettenabbruch).<br><ul><li>Wasser → <strong>Abkühlen</strong></li><li>CO2 → <strong>Ersticken</strong> (Sauerstoffverdrängung)</li><li>ABC-Pulver → <strong>Inhibition</strong> (antikatalytisch)</li></ul>'},
  {id:'g07',cat:'GAL · Brandlehre',q:'Welche drei Mechanismen der Wärmeübertragung sind im Einsatz relevant?',a:'<strong>1. Wärmeleitung</strong> (Kondukion) - durch Festkörper, z. B. Stahlträger.<br><strong>2. Konvektion</strong> - mit heißer Strömung, Treppenraum, Rauchgas.<br><strong>3. Wärmestrahlung</strong> - elektromagnetisch, über freie Strecke, gefährlich für Nachbargebäude.'},
  {id:'g08',cat:'GAL · Brandlehre',q:'Nenne die vier Phasen eines Zimmerbrandes.',a:'<strong>1. Entstehungsphase</strong> - lokal, kühl, sauerstoffreich.<br><strong>2. Wachstumsphase</strong> - rapider Temperaturanstieg, Rauchschicht bildet sich.<br><strong>3. Vollbrandphase</strong> - nach Flash-Over, alle Stoffe brennen, &gt;1000 °C.<br><strong>4. Abklingphase</strong> - Brennstoff verbraucht, Temperatur sinkt.'},
  {id:'g09',cat:'GAL · Atemschutz',q:'Welche Bauarten von Pressluftatmern werden in der Feuerwehr eingesetzt?',a:'<ul><li><strong>1-Flaschen-PA</strong> 6,8 L / 300 bar (Standard)</li><li><strong>2-Flaschen-PA</strong> 2x4 L oder 2x6 L (Langzeit)</li><li><strong>Regenerationsgerät</strong> (Kreislaufgerät) für Langzeit/Grube</li><li><strong>Druckluftschlauchgerät</strong> für Werks- und Spezialeinsatz</li></ul>'},
  {id:'g10',cat:'GAL · Atemschutz',q:'Wie berechnet man die verfügbare Atemluft eines PA (Faustformel)?',a:'<strong>Vorrat (L) = Flaschenvolumen × Fülldruck.</strong><br>Beispiel: 6,8 L × 300 bar = 2.040 L.<br>Abzug: Sicherheitsreserve (~1/3 + Warndruck 55 bar). Einsatzzeit ≈ Vorrat / Atemminutenvolumen (40-80 L/min bei schwerer Arbeit).'},
  {id:'g11',cat:'GAL · Atemschutz',q:'Was regelt die FwDV 7 zum Truppgrundsatz?',a:'<strong>Mindeststärke:</strong> Trupp (3 Personen: TrFue + 2 TrM).<br><strong>Truppzusammenhalt</strong> durchgehend wahren - keine Trennung im Innenangriff. <strong>Sicherheitstrupp</strong> in gleicher Stärke und Ausrüstung steht bereit, überwacht durch ASGW.'},
  {id:'g12',cat:'GAL · Atemschutz',q:'Welche Aufgabe hat der Sicherheitstrupp im Atemschutzeinsatz?',a:'<strong>Bereitstellung am Einsatzort</strong> in voller PSA und mit funktionsbereitem PA.<br>Aufgaben: <strong>Rettung des Angriffstrupps</strong> bei Notfall, Bereitstellung Reserveluft, Kommunikation mit ASGW. Einsatz nur auf Befehl.'},
  {id:'g13',cat:'GAL · Atemschutz',q:'Welche physiologischen Wirkungen haben CO und HCN im Brandrauch?',a:'<strong>CO:</strong> bindet 250x stärker an Hämoglobin als O2 → innere Erstickung; Symptome: Kopfschmerz, Schwindel, kirschrote Haut.<br><strong>HCN (Blausäure):</strong> blockiert Atmungskette (Zytochrom-Oxidase) → Zellgifterstickung; entsteht bei Polyurethan-, Woll- und Seidenbrand.'},
  {id:'g14',cat:'GAL · Atemschutz',q:'Wann ertönt der Warndruckpfiff und was ist zu tun?',a:'<strong>Warndruck</strong> bei ca. <strong>55 bar</strong> (~1/3 Restvorrat) - akustisches Signal.<br><strong>Reaktion:</strong> sofortiger Rückzugsbefehl über Funk, geordneter Ausstieg im Trupp; Sicherheitstrupp vorinformieren.'},
  {id:'g15',cat:'GAL · Atemschutz',q:'Was ist die G 26 Untersuchung und welche Stufen gibt es?',a:'<strong>G 26 - arbeitsmedizinische Vorsorge für Atemschutzgeräteträger.</strong><br><ul><li><strong>G 26.1</strong> leichte Filtermasken</li><li><strong>G 26.2</strong> mittelschwere Geräte</li><li><strong>G 26.3</strong> PA, Regenerationsgeräte</li></ul>Gültigkeit i. d. R. <strong>3 Jahre</strong> (ab 50: 1-2 Jahre).'},
  {id:'g16',cat:'GAL · Atemschutz',q:'Wie funktioniert ein Regenerationsgerät (Kreislaufgerät)?',a:'Geschlossenes Atemsystem: ausgeatmete Luft wird in einem <strong>CO2-Absorber</strong> (Natronkalk oder KO2) gereinigt; Sauerstoff aus Druckflasche oder Chemikalpatrone wird nachgespeist. <strong>Einsatzzeit 2-4 h</strong>, ideal für Tunnel, U-Bahn, Bergwerk.'},
  {id:'g17',cat:'GAL · Beamtenrecht',q:'Welche Grundpflichten regeln §§ 34-37 BeamtStG?',a:'<ul><li><strong>§ 34</strong> volle Hingabe an den Beruf, achtungs- und vertrauenswürdiges Verhalten</li><li><strong>§ 35</strong> Folge- und Beratungspflicht gegenüber Vorgesetzten</li><li><strong>§ 36</strong> Verantwortung für Rechtmäßigkeit (Remonstration)</li><li><strong>§ 37</strong> Verschwiegenheitspflicht (auch nach Dienstende)</li></ul>'},
  {id:'g18',cat:'GAL · Beamtenrecht',q:'Was besagt das Alimentationsprinzip?',a:'<strong>Hergebrachter Grundsatz</strong> (Art. 33 V GG). Der Dienstherr hat dem Beamten und seiner Familie <strong>lebenslang amtsangemessenen Unterhalt</strong> zu gewähren (Besoldung, Beihilfe, Versorgung). Dafür schuldet der Beamte volle Hingabe.'},
  {id:'g19',cat:'GAL · Beamtenrecht',q:'Welche Disziplinarmaßnahmen sind nach Disziplinargesetz möglich?',a:'<strong>Aufsteigend nach Schwere:</strong><ul><li>Verweis</li><li>Geldbuße (bis 1 Monatsgehalt)</li><li>Kürzung der Dienstbezüge (max. 1/5, bis 3 Jahre)</li><li>Zurückstufung</li><li>Entfernung aus dem Beamtenverhältnis</li><li>Ruhegehaltskürzung / Aberkennung (Ruheständler)</li></ul>'},
  {id:'g20',cat:'GAL · Beamtenrecht',q:'Welche Laufbahngruppen kennt das Beamtenrecht?',a:'<ul><li><strong>Einfacher Dienst</strong> (kaum noch besetzt)</li><li><strong>Mittlerer Dienst</strong> - Brandmeister, A 6-A 9</li><li><strong>Gehobener Dienst</strong> - Brandinspektor bis Brandoberamtsrat, A 9-A 13</li><li><strong>Höherer Dienst</strong> - Brandrat aufwärts, A 13-B</li></ul>'},
  {id:'g21',cat:'GAL · Beamtenrecht',q:'Welche Arten von Beamtenverhältnissen gibt es?',a:'<ul><li><strong>Auf Widerruf</strong> - Vorbereitungsdienst</li><li><strong>Auf Probe</strong> - i. d. R. 3 Jahre</li><li><strong>Auf Lebenszeit</strong> - Hauptregelfall</li><li><strong>Auf Zeit</strong> - z. B. Wahlbeamte</li><li><strong>Ehrenbeamter</strong> - ehrenamtliche Funktion</li></ul>'},
  {id:'g22',cat:'GAL · Brandbekämpfung',q:'Welche taktischen Unterschiede gelten zwischen Innen- und Aussenangriff?',a:'<strong>Innenangriff:</strong> PA-Pflicht, HSR/C-Rohr, Truppstärke, Sicherheitstrupp, defensives Löschen wegen Flash-Over-Gefahr.<br><strong>Aussenangriff:</strong> kein PA-Zwang, B-Rohre, hoher Wasserdurchsatz, Riegelstellung gegen Brandausbreitung.'},
  {id:'g23',cat:'GAL · Brandbekämpfung',q:'Welche Strahlrohrmodi am Hohlstrahlrohr (HSR) gibt es?',a:'<ul><li><strong>Vollstrahl</strong> - max. Wurfweite</li><li><strong>Sprühstrahl 30-60°</strong> - Brandbekämpfung</li><li><strong>Mannschutzkegel ~90°</strong> - Schutz des Trupps</li></ul>Zusätzlich variabler Durchfluss (100/200/400 L/min) und Impulsprühstoß-Technik.'},
  {id:'g24',cat:'GAL · Brandbekämpfung',q:'Welche Voraussetzungen und Vorteile hat die Überdruckbelüftung (UDB)?',a:'<strong>Voraussetzungen:</strong> definierte Zu-/Ablufföffnung, kein Backdraft-Risiko, abgestimmter Löschangriff.<br><strong>Vorteile:</strong> bessere Sicht, sinkende Temperatur, zügiger Innenangriff, erleichterte Personenrettung, gezielter Rauchabzug.'},
  {id:'g25',cat:'GAL · Brandbekämpfung',q:'Warum darf ein Fettbrand (Klasse F) nie mit Wasser gelöscht werden?',a:'Wasser verdampft im heißen Fett (&gt;300 °C) schlagartig (<strong>1700-fache Volumenzunahme</strong>) → <strong>Fettexplosion</strong> mit Feuerball.<br><strong>Richtig:</strong> Brandklasse-F-Löscher, Deckel auf, Stromzufuhr aus.'},
  {id:'g26',cat:'GAL · Brandbekämpfung',q:'Welche Warnzeichen weisen auf Flash-Over hin?',a:'<ul><li>Rasch fallende Rauchschichtgrenze</li><li>Pyrolysegasflammen unter der Decke (Engelshaare)</li><li>Stark schwarzer, fetter Rauch unter Druck</li><li>Schnell steigende Hitze, schmelzende Kunststoffe</li><li>Pfeifen / Strömungsgeräusche</li></ul>'},
  {id:'g27',cat:'GAL · Brandbekämpfung',q:'Welche Warnzeichen deuten auf einen drohenden Backdraft hin?',a:'<ul><li>Gelblich-bräunliche Glasscheiben (Russablagerungen)</li><li>Pulsierende Rauchaustritte ("atmendes" Gebäude)</li><li>Heiße Türen ohne sichtbare Flammen</li><li>Pfeifen / Sauggeräusche an Spalten</li><li>Sehr heißer Rauch unter Druck</li></ul>'},
  {id:'g28',cat:'GAL · Einsatztechnik',q:'Welche Druckschlauchtypen sind in der Feuerwehr genormt?',a:'<ul><li><strong>A 110</strong> mm - Saug-/Hauptleitung</li><li><strong>B 75</strong> mm - Verteilerzulauf, Förderung</li><li><strong>C 42 / C 52</strong> mm - Angriff</li><li><strong>D 25</strong> mm - Kleinlöschmittel, Waldbrand</li><li><strong>S</strong> - Saugschlauch, formstabil</li></ul>'},
  {id:'g29',cat:'GAL · Einsatztechnik',q:'Faustformel für Druckverlust in B-Schläuchen.',a:'<strong>~0,1 bar pro 100 m B je 100 L/min Förderstrom.</strong><br>Beispiel: 800 L/min über 200 m B → 0,1 × 8 × 2 ≈ 1,6 bar. Plus Höhe (1 bar je 10 m) und Strahlrohrdruck (5 bar HSR).'},
  {id:'g30',cat:'GAL · Einsatztechnik',q:'Mit welchem Mundstückdruck arbeiten gängige Strahlrohre?',a:'<ul><li>Hohlstrahlrohr <strong>5-7 bar</strong></li><li>CM-Rohr 4-5 bar</li><li>BM-Rohr 5 bar</li><li>Wasserwerfer 8-10 bar</li></ul>Ausgangsdruck Pumpe = Mundstückdruck + Druckverlust + Höhendruck.'},
  {id:'g31',cat:'GAL · Einsatztechnik',q:'Welche Schaummittelarten gibt es und wofür sind sie geeignet?',a:'<ul><li><strong>MBS</strong> - Mehrbereichsschaum, A+B</li><li><strong>AFFF</strong> - Filmbildner, B (Mineralöle)</li><li><strong>AR-AFFF</strong> - alkoholbeständig, polare Lösungsmittel</li><li><strong>Class A Foam</strong> - feste Stoffe, Waldbrand</li></ul>Verschäumungszahl: schwer &lt;20, mittel 20-200, leicht &gt;200.'},
  {id:'g32',cat:'GAL · Einsatztechnik',q:'Welche Hydrantenarten gibt es und wie werden sie gekennzeichnet?',a:'<ul><li><strong>Unterflur</strong> - Straßenoberfläche, Schild "H" auf weiß</li><li><strong>Überflur</strong> - Standhydrant mit B-/A-Abgängen</li><li><strong>Wandhydrant</strong> - Gebäude (Steigleitung trocken/nass)</li></ul>Schildangaben: Nennweite, Lage, Entfernung in Metern.'},
  {id:'g33',cat:'GAL · Erste Hilfe',q:'Wie lautet das ABCDE-Schema in der präklinischen Versorgung?',a:'<ul><li><strong>A</strong> Airway (Atemweg/HWS)</li><li><strong>B</strong> Breathing (Atmung)</li><li><strong>C</strong> Circulation (Kreislauf, Blutung stillen)</li><li><strong>D</strong> Disability (Neurostatus, GCS, BZ)</li><li><strong>E</strong> Exposure/Environment (entkleiden, Wärmeerhalt)</li></ul>'},
  {id:'g34',cat:'GAL · Erste Hilfe',q:'Wie ist das Verhältnis von Herzdruckmassage zu Beatmung bei der CPR Erwachsener?',a:'<strong>30:2</strong> - 30 Kompressionen + 2 Beatmungen. Frequenz <strong>100-120/min</strong>, Tiefe <strong>5-6 cm</strong>, vollständige Entlastung. Kind ggf. 15:2 bei zwei Helfern.'},
  {id:'g35',cat:'GAL · Erste Hilfe',q:'Welche Grundschritte gelten beim AED-Einsatz?',a:'<ul><li>Gerät ein, Anweisungen folgen.</li><li>Patient trocknen, Brust entblößen.</li><li>Elektroden rechts oben sternal / links lateral.</li><li>Analyse - niemand berührt den Patienten.</li><li>Schock auf Anweisung, sofort CPR 30:2 weiter.</li></ul>'},
  {id:'g36',cat:'GAL · Erste Hilfe',q:'Welche Schockarten unterscheidet die Notfallmedizin?',a:'<ul><li><strong>Hypovolämisch</strong> - Volumenverlust</li><li><strong>Kardiogen</strong> - Herzpumpversagen</li><li><strong>Obstruktiv</strong> - Spannungspneumothorax, Lungenembolie</li><li><strong>Distributiv</strong> - septisch, anaphylaktisch, neurogen</li></ul>Symptome: kalte feuchte Haut, Tachykardie, Hypotonie.'},
  {id:'g37',cat:'GAL · Erste Hilfe',q:'Wie berechnet man die verbrannte Körperoberfläche nach der 9er-Regel?',a:'<strong>Erwachsener:</strong> Kopf 9 %, je Arm 9 %, je Bein 18 %, Rumpf vorn/hinten je 18 %, Genital 1 %.<br><strong>Kleinflächen:</strong> Handfläche ≈ 1 %. <strong>Kritisch:</strong> Erwachsener &gt;15 % KOF, Kind &gt;10 %.'},
  {id:'g38',cat:'GAL · GABC',q:'Was steckt hinter der GAMS-Regel?',a:'<ul><li><strong>G</strong> - Gefahr erkennen</li><li><strong>A</strong> - Absperren</li><li><strong>M</strong> - Menschenrettung</li><li><strong>S</strong> - Spezialkräfte alarmieren (GW-G, Umweltzug, Fachberater)</li></ul>Immer als Erstmaßnahme im GABC-Einsatz.'},
  {id:'g39',cat:'GAL · GABC',q:'Welche Bedeutung haben die GHS-Piktogramme GHS01, GHS02 und GHS06?',a:'<ul><li><strong>GHS01</strong> explosionsgefährlich (Bombe)</li><li><strong>GHS02</strong> entzündbar (Flamme)</li><li><strong>GHS06</strong> akut toxisch (Totenkopf)</li></ul>Weitere: GHS03 oxidierend, 04 Druckgas, 05 ätzend, 07 Gesundheit, 08 chronisch (CMR), 09 umweltgefährdend.'},
  {id:'g40',cat:'GAL · GABC',q:'Wie sind die ADR-Gefahrgutklassen 1-9 grob gegliedert?',a:'<ul><li>1 Explosive Stoffe</li><li>2 Gase</li><li>3 Entzündbare Flüssigkeiten</li><li>4 Entzündbare Feststoffe</li><li>5 Oxidierende / Peroxide</li><li>6 Giftige / ansteckungsgefährlich</li><li>7 Radioaktiv</li><li>8 Ätzend</li><li>9 Verschiedene (z. B. Li-Akku)</li></ul>'},
  {id:'g41',cat:'GAL · GABC',q:'Welche Körperschutzformen kennt der Feuerwehrdienst?',a:'<ul><li><strong>Form 1</strong> Feuerwehrschutzkleidung + umluftunabhängiger Atemschutz</li><li><strong>Form 2</strong> Form 1 + Kontaminationsschutzanzug (Spritzschutz)</li><li><strong>Form 3 (CSA)</strong> gasdichter Chemikalienschutzanzug + PA innen</li></ul>Auswahl nach Stoff, Konzentration, Expositionszeit, Schutzziel.'},
  {id:'g42',cat:'GAL · GABC',q:'Welche Dekon-Stufen kennt die FwDV 500?',a:'<ul><li><strong>Stufe I - Notdekon</strong> (Wassersprühnebel, Lebensrettung)</li><li><strong>Stufe II - Standarddekon</strong> (PSA-Reinigung am Dekon-Platz)</li><li><strong>Stufe III - Dekon V</strong> (Verletztendekon mit medizinischer Versorgung)</li></ul>Aufbau am Übergang Gefahren-/Absperrbereich, immer in Windrichtung "rein-raus".'},
  {id:'g43',cat:'GAL · Fahrzeuge',q:'Welche Kenndaten hat ein HLF 20 nach DIN 14530-27?',a:'<ul><li>Mannschaft <strong>1/8</strong></li><li>Pumpe <strong>FPN 10-2000</strong> (2.000 L/min bei 10 bar)</li><li>Löschwasser <strong>1.600 L</strong>, Schaummittel 120 L</li><li>4 PA, hydr. Rettungssatz, 13 kVA-Stromerzeuger, Lichtmast, Tauchpumpe</li><li>Zul. Gesamtmasse 16 t</li></ul>'},
  {id:'g44',cat:'GAL · Fahrzeuge',q:'Was bedeutet die Pumpenbezeichnung FPN 10-2000?',a:'<strong>F</strong>euerlösch<strong>p</strong>umpe <strong>N</strong>iederdruck (bis 10 bar), Nennleistung <strong>2.000 L/min bei 10 bar</strong> und 3 m geodätischer Saughöhe.<br>FPH = Hochdruckpumpe (40 bar). Größen: 500, 750, 1000, 1500, 2000, 3000, 4000.'},
  {id:'g45',cat:'GAL · Fahrzeuge',q:'Welche Leistungsdaten hat eine DLK 23-12?',a:'<strong>Drehleiter mit Korb, 23 m Nennrettungshöhe bei 12 m Ausladung.</strong><br>Korbnutzlast 270 kg (3 Pers.), Mannschaft 1/2, Werfer 2.500 L/min im Korb. Anleitern bis ca. 8. OG.'},
  {id:'g46',cat:'GAL · HBKG',q:'Welche Aufgaben weist §§ 1-3 HBKG der Gemeinde zu?',a:'<strong>§ 1</strong> Schutz der Bevölkerung vor Bränden, Unglücksfällen und Notständen.<br><strong>§ 2</strong> Begriffsbestimmungen (Brand-, ABC-, Katastrophenschutz).<br><strong>§ 3</strong> Aufgaben des allgemeinen Brandschutzes - <strong>Pflichtaufgabe der Gemeinde</strong>.'},
  {id:'g47',cat:'GAL · HBKG',q:'Was regelt § 10 HBKG zur Pflichtfeuerwehr?',a:'Reichen FF und BF nicht aus, ordnet die Gemeinde eine <strong>Pflichtfeuerwehr</strong> an. Heranziehung von Einwohnern (18-50, geeignet). <strong>Ultima Ratio</strong>, in Hessen praktisch selten.'},
  {id:'g48',cat:'GAL · HBKG',q:'Was regelt § 17 HBKG zur Freistellung von der Arbeit?',a:'FF-Angehörige sind für <strong>Einsatz, Aus- und Fortbildung freizustellen</strong>. Arbeitgeber zahlt Lohn weiter und bekommt die Kosten von der Gemeinde erstattet. Kündigungsschutz wegen FW-Dienst.'},
  {id:'g49',cat:'GAL · HBKG',q:'Was regelt § 61 HBKG zum Kostenersatz?',a:'Grundsatz: FW-Leistungen sind <strong>unentgeltlich</strong>.<br><strong>Ausnahmen:</strong> vorsätzlich/grob fahrlässig herbeigeführte Einsätze, Anlagenbetreiber, böswillige Falschalarme, TH außerhalb Brandbekämpfung, BAB-Einsätze.'},
  {id:'g50',cat:'GAL · Beihilfe',q:'Welche Beihilfebemessungssätze gelten in Hessen?',a:'<ul><li><strong>Beamter</strong> 50 %</li><li><strong>Beamter mit 2+ Kindern</strong> 70 %</li><li><strong>Ehegatte/Partner</strong> 70 %</li><li><strong>Kinder</strong> 80 %</li><li><strong>Versorgungsempfänger</strong> 70 %</li></ul>Restkosten über private KV (Anwartschaft).'},
  {id:'g51',cat:'GAL · Beihilfe',q:'Welche Aufwendungen sind grundsätzlich beihilfefähig?',a:'<strong>Notwendige und wirtschaftlich angemessene Krankheitsaufwendungen:</strong> ärztliche/zahnärztliche Leistungen (GOAE/GOZ), Arzneimittel, Krankenhaus, Heilmittel, Hilfsmittel, Pflege, Geburt.<br>Nicht beihilfefähig: Schönheits-OP, Lifestyle-Präparate, IGeL ohne med. Indikation.'},
  {id:'g52',cat:'GAL · Beihilfe',q:'Was ist die Kostendämpfungspauschale (KDP) in Hessen?',a:'Jährlicher Selbstbehalt nach Besoldungsgruppe (A 7 ~100 €, A 12 ~300 €, B ~750 €). Wird vor Auszahlung der Beihilfe abgezogen. <strong>Sinn:</strong> eigenverantwortliche Kostenkontrolle, Haushaltsentlastung.'},
  {id:'g53',cat:'GAL · Beihilfe',q:'Wo liegt der Unterschied zwischen BBhV und HBeihVO?',a:'<strong>BBhV</strong> - Bundesbeihilfeverordnung, gilt für <strong>Bundesbeamte</strong>.<br><strong>HBeihVO</strong> - Hessische Beihilfenverordnung, gilt für <strong>Landes-/Kommunalbeamte in Hessen</strong>.<br>Strukturell ähnlich, aber unterschiedliche Sätze, KDP und Ausschlusskataloge.'},
  {id:'g54',cat:'GAL · Kartenkunde',q:'Welchen Massstab hat die TK 25 und was bedeutet das praktisch?',a:'<strong>TK 25 = 1:25.000.</strong> 1 cm Karte = 250 m Natur, 4 cm = 1 km. Standardkarte für Feuerwehr, Bundeswehr, Katastrophenschutz. Höhenlinien 10 m, hohe Detaildichte.'},
  {id:'g55',cat:'GAL · Kartenkunde',q:'Wie liest man eine UTM-Koordinate (z. B. 32U 477892 5544123)?',a:'<ul><li><strong>32U</strong> UTM-Zone (32 = 6°-12° E, U ~48° N)</li><li><strong>477892</strong> Easting (Ostwert, m)</li><li><strong>5544123</strong> Northing (Nordwert vom Äquator, m)</li></ul>Reihenfolge: <strong>"Erst Rechts, dann Hoch"</strong>. Genauigkeit 1 m.'},
  {id:'g56',cat:'GAL · Kartenkunde',q:'Wie ist die MGRS-Koordinate aufgebaut?',a:'<strong>MGRS</strong> basiert auf UTM. Beispiel <strong>32U MV 7892 4123</strong>:<ul><li>32U UTM-Zone</li><li>MV 100-km-Quadrat</li><li>7892 Easting (4 Stellen = 10 m)</li><li>4123 Northing (4 Stellen = 10 m)</li></ul>Mit 6+6 Stellen: 1 m Genauigkeit.'},
  {id:'g57',cat:'GAL · Knoten',q:'Wofür wird der doppelte Achtknoten verwendet?',a:'Als <strong>Sicherheitsknoten und Anschlagschlinge</strong> am Seilende: Einbinden von Karabinern, Sicherung von Personen/Gerät. <strong>Vorteil:</strong> leicht zu prüfen, Wirkungsgrad 70-80 %, gut zu lösen.'},
  {id:'g58',cat:'GAL · Knoten',q:'Wofür dient der Pfahlstich im Feuerwehrdienst?',a:'Als <strong>Rettungsschlinge</strong> - <strong>zieht sich nicht zu</strong>. Doppelter Pfahlstich: Brust-/Hüftschlinge zur Höhenrettung. Wirkungsgrad ~75 %. Wird zunehmend durch genormte Rettungsgurte ergänzt.'},
  {id:'g59',cat:'GAL · Knoten',q:'Wann sichert man einen Mastwurf mit halbem Schlag?',a:'Bei <strong>wechselnder Belastung</strong> oder Längszug auf den Pfosten kann sich der Mastwurf lösen. Deshalb: <strong>Sicherungsstich (halber Schlag)</strong> am losen Ende - z. B. bei Strahlrohrsicherung, am Karabiner oder am Anschlagpunkt.'},
  {id:'g60',cat:'GAL · Geräteprüfung',q:'Was schreibt die DGUV V 49 zur Prüfung von FW-Geräten vor?',a:'<strong>DGUV Vorschrift 49 (FW)</strong>: regelmäßige Prüfung aller FW-spezifischen Arbeitsmittel durch <strong>befähigte Person</strong>. Typische Fristen: PA-Gerät halbjährlich + nach Einsatz; Leitern jährlich; hydr. Rettungssatz jährlich; HSR/Schläuche jährlich; alle Prüfungen dokumentieren (Prüfkarte/Gerätebuch).'},

  /* ── VAk Berlin ────────────────────────────────────────── */
  {id:'v01',cat:'VAk · Jur. Denken',q:'Was unterscheidet öffentliches Recht und Privatrecht?',a:'<strong>Öffentliches Recht:</strong> Über-/Unterordnungsverhältnis (Staat ↔ Bürger) – umfasst Verwaltungsrecht, Beamtenrecht, Feuerwehrrecht.<br><strong>Privatrecht:</strong> Gleichordnungsverhältnis zwischen Bürger und Bürger.'},
  {id:'v02',cat:'VAk · Jur. Denken',q:'Welche vier Arten von Rechtsnormen gibt es?',a:'<strong>Tatbestandsnormen (WENN):</strong> Voraussetzung für staatliches Handeln.<br><strong>Rechtsfolgenormen (DANN):</strong> Erlaubnis zum Handeln.<br><strong>Hilfsnormen:</strong> Legaldefinitionen.<br><strong>Gegennormen:</strong> Ausnahmen vom Grundsatz.'},
  {id:'v03',cat:'VAk · Jur. Denken',q:'Wie ist die Rechtsquellenhierarchie gegliedert?',a:'GG → Formelle Bundesgesetze → Materielle Bundesgesetze → Landesverfassungen → Formelle Landesgesetze → Materielle Landesgesetze.<br><strong>Grundsätze:</strong> Höherrangiges bricht niederrangiges Recht; Spezialgesetz geht vor allgemeinem Gesetz.'},
  {id:'v04',cat:'VAk · Jur. Denken',q:'Was bedeuten Entschließungsermessen und Auswahlermessen?',a:'<strong>Entschließungsermessen:</strong> Behörde kann entscheiden, ob sie tätig wird (Ausnahme: Ermessensreduzierung auf null bei erheblicher Gefahr).<br><strong>Auswahlermessen:</strong> Behörde wählt aus mehreren geeigneten Mitteln das am wenigsten belastende.<br><strong>Gebundene Entscheidung:</strong> bei „hat"/„muss" – kein Ermessen.'},
  {id:'v05',cat:'VAk · Jur. Denken',q:'Welche 4 Stufen hat der Grundsatz der Verhältnismäßigkeit?',a:'<strong>1. Legitimes Ziel</strong> – gesetzlicher Auftrag vorhanden.<br><strong>2. Geeignetheit</strong> – Mittel kann Ziel erreichen.<br><strong>3. Erforderlichkeit</strong> – mildestes geeignetes Mittel wählen.<br><strong>4. Angemessenheit</strong> – Maßnahme steht in vertretbarem Verhältnis zum Nutzen.'},
  {id:'v06',cat:'VAk · Jur. Denken',q:'Was sind die vier Bestandteile des Gutachtenstils (O·D·S·K)?',a:'<strong>O – Obersatz (Fallfrage):</strong> Rechtsfrage als offene Hypothese formulieren, Ergebnis nicht vorwegnehmen. Formel: „Fraglich ist, ob …"<br><strong>D – Definition:</strong> Norminhalt erläutern; bei unbestimmten Rechtsbegriffen (z. B. „Gefahr") nach Wortlaut, Systematik und Zweck auslegen.<br><strong>S – Subsumtion:</strong> Sachverhalt unter die Tatbestandsmerkmale subsumieren. Formel: „Im vorliegenden Fall …"<br><strong>K – Konklusion:</strong> Ergebnis knapp zusammenfassen und Fallfrage beantworten. Formel: „Mithin …" / „Folglich …"<br><br><strong>Merkhilfe:</strong> „Ohne Dich Sind Klausuren (sinnlos)"<br><strong>vs. Urteilsstil:</strong> Gutachtenstil = Ergebnis offen bis zum Schluss; Urteilsstil = Ergebnis steht am Anfang (typisch für Bescheide/Urteile).'},
  {id:'v63',cat:'VAk · Verwaltungsrecht',q:'Was ist ein Verwaltungsakt (VA) und welche Merkmale muss er erfüllen?',a:'Ein VA ist eine <strong>hoheitliche Maßnahme einer Behörde</strong> auf dem Gebiet des öffentlichen Rechts zur <strong>Regelung eines Einzelfalls mit Außenwirkung</strong>.<br>Inhalt: muss hinreichend bestimmt sein (Wer, Was, Wann, Wo, Wie); schriftlicher VA enthält Begründung + Rechtsbehelfsbelehrung (Frist 1 Monat).'},
  {id:'v07',cat:'VAk · Verwaltungsrecht',q:'Welche Nebenbestimmungen kann ein VA enthalten?',a:'<strong>Befristung</strong> (zeitl. Bindung) · <strong>Bedingung</strong> (Wirksamkeit an Ereignis geknüpft) · <strong>Widerrufsvorbehalt</strong> · <strong>Auflage</strong> (Tun/Dulden/Unterlassen auferlegt) · <strong>Auflagenvorbehalt</strong> (spätere Auflage vorbehalten).'},
  {id:'v08',cat:'VAk · Verwaltungsrecht',q:'Was bewirkt ein Widerspruch gegen einen VA und wann entfällt diese Wirkung?',a:'Ein Widerspruch hat grundsätzlich <strong>aufschiebende Wirkung</strong> – Bürger muss VA nicht befolgen, Behörde darf nicht vollstrecken.<br>Entfällt durch: <strong>Anordnung der sofortigen Vollziehung</strong> (schriftl. Begründung des besonderen öffentlichen Interesses erforderlich).'},
  {id:'v09',cat:'VAk · Verwaltungsrecht',q:'Welche 3 Zwangsmittel der Verwaltungsvollstreckung gibt es?',a:'<strong>Ersatzvornahme:</strong> Behörde lässt vertretbare Handlung durch Dritten auf Kosten des Pflichtigen vornehmen.<br><strong>Zwangsgeld:</strong> bei unvertretbaren Handlungen, keine Sanktion.<br><strong>Unmittelbarer Zwang:</strong> körperliche Gewalt durch Hilfsmittel oder Waffen.'},
  {id:'v10',cat:'VAk · Staatsrecht',q:'Was enthält Art. 20 GG (Staatsfundamentalnormen)?',a:'<strong>Art. 20 I GG:</strong> Republik · Demokratie (Volkssouveränität, Mehrheitsprinzip) · Sozialstaat · Bundesstaat (Föderalismus, Subsidiarität).<br><strong>Art. 20 III GG:</strong> Rechtsstaat (Rechtsgebundenheit, Rechtssicherheit, Rechtsgleichheit, Rechtsschutz).<br><strong>Art. 79 III GG:</strong> Ewigkeitsklausel – dieser Kern ist verfassungsänderungsfest.'},
  {id:'v11',cat:'VAk · Staatsrecht',q:'Wie ist die Gewaltenteilung im GG aufgebaut?',a:'<strong>Legislative:</strong> Gesetzgebung – Bundestag, Bundesrat, Landtage.<br><strong>Exekutive:</strong> Gubernative (Regierung) + Administrative (Verwaltung).<br><strong>Judikative:</strong> Gerichte.<br>Gewaltenteilung = Teilung + gegenseitige Kontrolle + Föderalismus (horizontal + vertikal).'},
  {id:'v12',cat:'VAk · Staatsrecht',q:'Welche Aufgaben haben die Bundesorgane?',a:'<strong>Bundestag:</strong> Gesetzgebung, Wahlen, Kontrolle (direkt gewählt).<br><strong>Bundesrat:</strong> Ländervertretung (durch Länderregierungen).<br><strong>Bundespräsident:</strong> völkerrechtl. Vertretung, schlägt BK vor (Wahl alle 5 J. durch BV).<br><strong>BVerfG:</strong> Hüterin der Verfassung, 2 Senate à 8 Richter (½ BT, ½ BR).'},
  {id:'v13',cat:'VAk · Staatsrecht',q:'Welche 6 Wahlrechtsgrundsätze schreibt Art. 38 GG vor?',a:'<strong>Allgemein · Unmittelbar · Frei · Gleich · Geheim · Öffentlich</strong> (letzteres durch BVerfG aus Art. 38 i.V.m. Art. 20 GG entwickelt).<br>5 %-Hürde (Bundeswahlgesetz): verhindert Parlamentszersplitterung; Ausnahmen: Grundmandatsklausel + nationale Minderheiten.'},
  {id:'v14',cat:'VAk · Einsatzrecht',q:'Was ist eine „konkrete Gefahr" im Einsatzrecht?',a:'Eine Situation, bei der bei <strong>objektiv betrachtetem, ungehindertem Fortgang in absehbarer Zeit mit hinreichender Wahrscheinlichkeit</strong> ein Schaden an einem Schutzgut eintritt.<br><strong>Anscheinsgefahr:</strong> Gefahr erscheint real, ist es aber nicht – Maßnahmen sofort beenden wenn erkannt.<br><strong>Scheingefahr:</strong> nur subjektiv angenommen.'},
  {id:'v15',cat:'VAk · Einsatzrecht',q:'Wer ist Verhaltens-, Zustands- und Nichtstörer?',a:'<strong>Verhaltensstörer:</strong> Person, die durch ihr Verhalten die Gefahr verursacht.<br><strong>Zustandsstörer:</strong> Person, die für einen gefährlichen Zustand verantwortlich ist.<br><strong>Nichtstörer:</strong> weder Verhaltens- noch Zustandsstörer – Maßnahmen nur wenn kein Störer verfügbar, auf Minimum begrenzen.'},
  {id:'v16',cat:'VAk · Einsatzrecht',q:'Wann liegt Amtshaftung vor und wann haftet der Beamte persönlich?',a:'Amtshaftung: Beamter verletzt Amtspflicht vorsätzlich oder fahrlässig → <strong>Haftung wird auf den Staat übergeleitet</strong>.<br>Regress im Innenverhältnis: Rückgriff auf Beamten bei <strong>Vorsatz oder grober Fahrlässigkeit</strong> (z.B. fehlende Erkundung, Übernahme nicht beherrschter Funktionen).'},
  {id:'v17',cat:'VAk · Einsatzrecht',q:'Was sind die 3 Handlungsformen der Feuerwehr?',a:'<strong>Verwaltungsakt (VA):</strong> hoheitliche Regelung mit Außenwirkung (z.B. Absperrung anordnen).<br><strong>Realakt:</strong> unmittelbares Tätigwerden ohne Regelungswirkung (z.B. löschen).<br><strong>Privatrechtlich:</strong> bei nicht hoheitlichen Aufgaben (z.B. Fahrzeugbeschaffung) – dann keine Amtshaftung.'},
  {id:'v18',cat:'VAk · Dienstrecht',q:'Wie wird ein Beamtenverhältnis begründet und auf welchen Wegen endet es?',a:'<strong>Begründung:</strong> durch Ernennung (Aushändigung Ernennungsurkunde).<br><strong>Ende kraft Gesetzes:</strong> Verlust Staatsangehörigkeit, Eintritt in anderen Dienst.<br><strong>Ende kraft VA:</strong> Diensteidesverweigerung, Entlassung auf schriftliches Verlangen.<br><strong>Sonstige:</strong> Entfernung als Disziplinarmaßnahme, Verlust kraft Strafurteil.'},
  {id:'v19',cat:'VAk · Dienstrecht',q:'Was sind die Grundpflichten eines Beamten?',a:'<strong>Staatspolitisch:</strong> Verfassungstreue, Mäßigungspflicht.<br><strong>Amtsbezogen:</strong> voller persönlicher Einsatz, Neutralität, Verschwiegenheit, Remonstrationspflicht.<br><strong>Gegenüber Vorgesetzten:</strong> Folge-, Beratungs-, Unterstützungspflicht.<br><strong>Außerdienstlich:</strong> achtungswürdiges Verhalten.'},
  {id:'v20',cat:'VAk · Dienstrecht',q:'Was ist ein Dienstvergehen und welche Disziplinarmaßnahmen gibt es?',a:'<strong>Dienstvergehen:</strong> schuldhafte Verletzung von Dienstpflichten (Treuepflicht, Folgepflicht, Verschwiegenheit etc.).<br><strong>Maßnahmen aufsteigend:</strong> Verweis → Geldbuße (bis 1 Monatsgeh.) → Kürzung Dienstbezüge → Zurückstufung → Entfernung aus dem Beamtenverhältnis.'},

  /* ── FeuAK Hamburg ─────────────────────────────────────── */
  {id:'h01',cat:'FeuAK · VWL',q:'Wie unterscheiden sich Mikro- und Makroökonomie in 4 Dimensionen?',a:'<strong>1. Untersuchungsobjekt:</strong> Mikro = einzelne Akteure (Haushalte, Betriebe); Makro = wirtschaftliches Gesamtsystem.<br><strong>2. Zielgröße:</strong> Mikro = individuelle Preise und Marktgleichgewichte; Makro = Aggregate wie Inflation und Wirtschaftswachstum.<br><strong>3. Perspektive:</strong> Mikro = Lupe auf den Markt; Makro = Vogelperspektive auf den Staat.<br><strong>4. Interdependenz:</strong> Mikro erklärt das Fundament; Makro dessen Gesamtwirkung auf die Volkswirtschaft.'},
  {id:'h02',cat:'FeuAK · VWL',q:'Was sind Opportunitätskosten? Nennen Sie 3 Feuerwehr-Kontexte.',a:'<strong>Definition:</strong> Kosten einer Entscheidung = Wert der besten entgangenen Alternative.<br><strong>1. Berufsfeuerwehr im Einsatz:</strong> Bereitstellungskosten (dauerhaftes Vorhalten), Alternativkosten (Steuergelder fehlen für Schulen/Straßen), Produktivitätsausfall.<br><strong>2. Großveranstaltungen:</strong> FW-Kräfte am Stadion gebunden → fehlen im restlichen Stadtgebiet → kostenpflichtige Abstimmung mit Nachbarkreisen.<br><strong>3. Ehrenamt (FF):</strong> Kameraden im Einsatz = fehlende Arbeitskraft → volkswirtschaftlicher Produktivitätsverlust und Belastung für Arbeitgeber.'},
  {id:'h03',cat:'FeuAK · VWL',q:'Welche 4 Kernbereiche umfasst die Volkswirtschaftslehre?',a:'<strong>1. Ressourcenallokation:</strong> Wie werden knappe Güter effizient verteilt?<br><strong>2. Marktmechanismen:</strong> Analyse des Zusammenspiels von Angebot und Nachfrage.<br><strong>3. Wirtschaftspolitik:</strong> Staatliche Eingriffe zur Stärkung der volkswirtschaftlichen Stabilität.<br><strong>4. Wohlstandsmaximierung:</strong> Steigerung des gesellschaftlichen Nutzens als übergeordnetes Ziel.'},
  {id:'h04',cat:'FeuAK · VWL',q:'Warum ist Brandschutz ein öffentliches Gut? Erläutern Sie die 2 Eigenschaften und das Trittbrettfahrer-Problem.',a:'<strong>Nicht-Ausschließbarkeit:</strong> Die Feuerwehr hilft jedem – unabhängig davon, ob er Steuern zahlt oder nicht.<br><strong>Nicht-Rivalität:</strong> Schutz für eine Bürger schmälert nicht die Sicherheit des Nachbarn.<br><strong>Trittbrettfahrer-Problem:</strong> Da alle profitieren, würde freiwillig kaum jemand zahlen → Unterversorgung durch Markt.<br><strong>Folge:</strong> Brandschutz muss zwingend gemeinschaftlich (staatlich) finanziert werden – er kann nicht dem freien Markt überlassen werden.'},
  {id:'h05',cat:'FeuAK · VWL',q:'Worin unterscheiden sich VWL und BWL? Nennen Sie 4 Dimensionen.',a:'<strong>1. Betrachtungsperspektive:</strong> VWL = gesamte Wirtschaft (Makro-Ebene); BWL = einzelnes Unternehmen (Mikro-Ebene).<br><strong>2. Zielsetzung:</strong> VWL = gesellschaftlicher Wohlstand; BWL = betrieblicher Gewinn.<br><strong>3. Markt vs. Betrieb:</strong> VWL erforscht Märkte und Preise; BWL steuert interne Prozesse wie Marketing und Logistik.<br><strong>4. Akteure:</strong> VWL lenkt Staaten und Wirtschaftspolitik; BWL berät Manager.'},
  {id:'h09',cat:'FeuAK · Haushalt',q:'Was ist das Neue Steuerungsmodell (NSM) und welche Kernelemente hat es?',a:'NSM = Konzept zur <strong>Steigerung der Leistungsfähigkeit der Verwaltung</strong> durch Kostentransparenz, Wirtschaftlichkeit und Ergebnisorientierung.<br><strong>Kernelemente:</strong> Doppik, Produktorientierung, Budgetierung, dezentrale Ressourcenverantwortung, KLR, Controlling, Prozessoptimierung, Qualitätsmanagement.'},
  {id:'h10',cat:'FeuAK · Haushalt',q:'Welche 3 Säulen bilden das Rechnungssystem im NSM?',a:'<strong>Liquiditätsrechnung:</strong> tatsächliche Geldflüsse (Einnahmen/Ausgaben) – ähnlich Kameralistik.<br><strong>Ergebnisrechnung:</strong> alle Aufwendungen und Erträge einer Periode (Ressourcenverbrauch).<br><strong>Bilanz (Vermögensrechnung):</strong> Gegenüberstellung Aktiva und Passiva zum Stichtag.'},
  {id:'h11',cat:'FeuAK · Haushalt',q:'Was leisten Kostenträger-, Kostenstellen- und Kostenartenrechnung?',a:'<strong>Kostenträgerrechnung:</strong> Was kostet ein Produkt/eine Leistung? (z.B. Rettungsdiensteinsatz)<br><strong>Kostenstellenrechnung:</strong> Was kostet eine Organisationseinheit? (z.B. Wache)<br><strong>Kostenartenrechnung:</strong> Welche Kostenart (Personal, Material, Abschreibung) fällt insgesamt an?'},
  {id:'h12',cat:'FeuAK · Haushalt',q:'Welche 4 Einnahmewege (Subsidiarität) kennt das kommunale Haushaltsrecht?',a:'<strong>1. Allgemeine Deckungsmittel</strong> (Finanzausgleiche, Gemeindeanteil Bundessteuer, Mieten/Pachten).<br><strong>2. Leistungsgebundene Einnahmen</strong> (Gebühren, zweckgeb. Zuschüsse).<br><strong>3. Gemeindesteuern</strong> (Gewerbe-, Grundsteuer, Hundesteuer).<br><strong>4. Kredite</strong> (nachrangig).'},
  {id:'h13',cat:'FeuAK · Haushalt',q:'Was ist bei vorläufiger Haushaltsführung erlaubt – und was nicht?',a:'<strong>Erlaubt:</strong> rechtl. verpflichtete Ausgaben (Verträge, Gehälter, Gefahrenabwehr), Dienstbetrieb (Kraftstoff), begonnene Investitionen fortführen, Einnahmen erzielen.<br><strong>Nicht erlaubt:</strong> sonstige Ausgaben, neue erhebliche Investitionen beginnen, neue Stellen besetzen.'},
  {id:'h16',cat:'FeuAK · Vergabe',q:'Welche 8 Grundsätze des Vergaberechts gibt es?',a:'<strong>1</strong> Wettbewerb (mind. 3 Anbieter) · <strong>2</strong> Transparenz · <strong>3</strong> Verhältnismäßigkeit · <strong>4</strong> Gleichbehandlung · <strong>5</strong> Strategische Ziele · <strong>6</strong> Mittelstandsfreundlichkeit (Losaufteilung) · <strong>7</strong> Elektronische Mittel · <strong>8</strong> Rechtsanspruch auf Einhaltung.'},
  {id:'h24',cat:'FeuAK · PM',q:'Was ist eine Stakeholderanalyse und welche Gruppen unterscheidet man?',a:'Stakeholder = alle Anspruchsgruppen, die das Unternehmen beeinflussen oder von ihm betroffen sind.<br><strong>Intern:</strong> Eigenkapitalgeber, Arbeitnehmer, Management.<br><strong>Extern:</strong> Fremdkapitalgeber, Kunden, Lieferanten, Staat, Öffentlichkeit.<br>Stakeholder-Matrix: Einfluss × Interesse → enge Einbeziehung bei High/High.'},
  {id:'h25',cat:'FeuAK · Bedarfsplanung',q:'Was sind die 3 Szenarientypen in der Bedarfsplanung?',a:'<strong>Best-Case-Szenario:</strong> günstigste Annahmen über zukünftige Entwicklung.<br><strong>Worst-Case-Szenario:</strong> ungünstigste Annahmen.<br><strong>Realistic-Case-Szenario:</strong> wahrscheinlichste Entwicklung als Planungsgrundlage. Szenarienanalyse reduziert Fehlentscheidungsrisiko bei langfristiger Personalplanung.'},

  /* ── IdF Münster ────────────────────────────────────────── */
  {id:'i01',cat:'IdF · Brandschutz',q:'Welche 4 Schutzziele des Brandschutzes definiert § 14 MBO?',a:'<strong>1. Entstehung</strong> eines Brandes vorbeugen (konstruktive Maßnahmen).<br><strong>2. Ausbreitung</strong> von Feuer und Rauch vorbeugen (Brandabschnitte, Brandwände).<br><strong>3. Rettung</strong> von Menschen und Tieren ermöglichen (Rettungswege).<br><strong>4. Wirksame Löschmaßnahmen</strong> ermöglichen (Zufahrten, Aufstellflächen, Löschwasser).'},
  {id:'i02',cat:'IdF · Brandschutz',q:'Welche 5 Gebäudeklassen kennt die MBO und wie sind sie abgegrenzt?',a:'<strong>GK 1a:</strong> freistehend, OKFF ≤ 7 m, max. 2 NE, ANE ≤ 400 m².<br><strong>GK 1b:</strong> freistehend, land-/forstwirtschaftl.<br><strong>GK 2:</strong> nicht freistehend, ≤ 7 m, max. 2 NE, ANE ≤ 400 m².<br><strong>GK 3:</strong> sonstige, ≤ 7 m.<br><strong>GK 4:</strong> ≤ 13 m, ANE ≤ 400 m².<br><strong>GK 5:</strong> > 13 m, alle sonstigen inkl. unterirdisch.'},
  {id:'i03',cat:'IdF · Brandschutz',q:'Welche Sonderbautatbestände (§ 2 Abs. 4 MBO) sind für die Feuerwehr besonders relevant?',a:'<strong>Hochhäuser</strong> (OKFF > 22 m) → MHHR.<br><strong>Verkaufsstätten</strong> (> 800 m², ab 2.000 m²) → MVKVO.<br><strong>Versammlungsstätten</strong> (> 100 P., ab 200 P.) → MVStättVO.<br><strong>Beherbergungsstätten</strong> (> 12 Gastbetten) → MBeVO.<br><strong>Krankenhäuser</strong> → MKhVO.<br><strong>Industriebauten</strong> → MIndBauRL.'},
  {id:'i04',cat:'IdF · Brandschutz',q:'Welche besonderen Anforderungen stellt die MHHR an Hochhäuser (OKFF > 22 m)?',a:'<strong>Rettungswege:</strong> max. 35 m bis NTR; Stichflure max. 15 m.<br><strong>Sicherheitstreppenräume</strong> ab h > 60 m: alle NTR als STR, F120-Wände.<br><strong>Pflichtausstattung:</strong> Feuerwehraufzug · nasse Steigleitungen (3 × 200 L/min) · BMA · Druckbelüftungsanlage · ELA · automatische Feuerlöschanlage.'},
  {id:'i05',cat:'IdF · Brandschutz',q:'Was schreibt die MVKVO für Verkaufsstätten > 2.000 m² vor?',a:'<strong>Rettungswege:</strong> ≤ 25 m (Luftlinie) bis NTR aus Verkaufsraum; Ladenstraßen ≤ 35 m; Hauptgänge mind. 2 m, Ladenstraßen mind. 5 m.<br><strong>Pflicht:</strong> Sprinkleranlage, BMA, RWA, Wandhydranten Typ F, Brandschutzbeauftragter.<br>Brandabschnitte: ohne Sprinkler ≤ 3.000 m², mit Sprinkler ≤ 10.000 m² (EG).'},
  {id:'i06',cat:'IdF · Brandschutz',q:'Ab wann gilt die MBeVO und welche Kernanforderungen stellt sie?',a:'Ab <strong>mehr als 12 Gastbetten</strong>.<br><strong>2 unabhängige RW</strong> je Beherbergungsraum; bei ≤ 60 Gastbetten kann 2. RW durch Anleiterung ersetzt werden.<br><strong>Türen:</strong> RS (rauchdicht, selbstschließend).<br><strong>Technik:</strong> Alarmierungseinrichtung; BMA ab > 60 Gastbetten; Sicherheitsbeleuchtung.<br><strong>Org.:</strong> Rettungswegplan im Zimmer, ab > 60 Betten Brandschutzordnung.'},
  {id:'i07',cat:'IdF · Brandschutz',q:'Welche 4 Sicherheitskategorien (K1–K4) kennt die MIndBauRL?',a:'<strong>K 1:</strong> Keine besonderen Maßnahmen.<br><strong>K 2:</strong> Brandmeldeanlage.<br><strong>K 3.4:</strong> BMA + Werkfeuerwehr in Staffelstärke.<br><strong>K 4:</strong> BMA + automatische Feuerlöschanlage.<br>Ab Grundfläche > 5.000 m²: Umfahrung für Feuerwehrfahrzeuge erforderlich.'},
  {id:'i08',cat:'IdF · Brandschutz',q:'Wie unterscheiden sich die Garagentypen nach M-GarVO und welche Pflichten treffen Großgaragen?',a:'<strong>Kleingarage:</strong> bis 100 m² · <strong>Mittelgarage:</strong> 100–1.000 m² · <strong>Großgarage:</strong> > 1.000 m².<br><strong>Großgaragen:</strong> mind. 2 unabh. bauliche RW, maschinelle Entrauchung (10-facher Luftwechsel/h), BMA ab > 2.500 m² geschlossen, Brandabschnitte max. 5.000 m² (oberird. geschlossen).'},
  {id:'i09',cat:'IdF · Stabsarbeit',q:'Was ist der Unterschied zwischen Großeinsatzlage und Katastrophe nach BHKG?',a:'<strong>Großeinsatzlage:</strong> erheblicher Koordinierungsbedarf, rückwärtige Unterstützung erforderlich, die eine kreisangehörige Gemeinde nicht mehr leisten kann.<br><strong>Katastrophe:</strong> ungewöhnliches Ausmaß – wirksame Begegnung nur durch <strong>einheitliche Gesamtleitung</strong> der zuständigen Katastrophenschutzbehörde möglich.'},
  {id:'i10',cat:'IdF · Stabsarbeit',q:'Welche zwei Stäbe gibt es im Zwei-Stäbe-Modell und was sind ihre Aufgaben?',a:'<strong>Operativ-taktische Einsatzleitung (EL):</strong> führt den Einsatz operativ-taktisch; Befehlsgewalt über alle Einsatzkräfte der nPol. Gefahrenabwehr.<br><strong>Administrativ-organisatorischer Krisenstab (KS):</strong> rechtliche, finanzielle und politische Aufgaben; nur in Kreisen und kreisfreien Städten; Einberufung durch HVB.'},
  {id:'i11',cat:'IdF · Stabsarbeit',q:'Welche Aufgaben haben die Sachgebiete S1 bis S6?',a:'<strong>S1 Personal/Inn. Dienst:</strong> Alarmierung, Kräfteübersichten, Stabsorganisation.<br><strong>S2 Lage:</strong> Lagekarte, Einsatztagebuch, Lagemeldungen.<br><strong>S3 Einsatz:</strong> Lagebeurteilung, Entschluss, Befehle, Absperrungen.<br><strong>S4 Versorgung:</strong> Verpflegung, Unterkünfte, Eigenschutz, Verbrauchsgüter.<br><strong>S5 Presse:</strong> Medienarbeit, Bevölkerungswarnung.<br><strong>S6 IuK:</strong> Kommunikationskonzept, IuK-Technik.'},
  {id:'i12',cat:'IdF · Stabsarbeit',q:'Welche 7 Punkte umfasst die Arbeitsaufnahme des Stabes?',a:'<strong>1</strong> Einsatzraum strukturieren (S3) · <strong>2</strong> Bereitstellungsraum festlegen (S1 & S3) · <strong>3</strong> Eigenschutz veranlassen (S4) · <strong>4</strong> Grundschutz zuweisen (S3) · <strong>5</strong> Kommunikation schaffen (S3/S6) · <strong>6</strong> Vorhandene Kräfte einsetzen (S1 & S3) · <strong>7</strong> Nachforderung kalkulieren (S1 & S3).'},
  {id:'i13',cat:'IdF · Stabsarbeit',q:'Was ist das Einsatztagebuch und wie funktioniert der Vierfach-Nachrichtenvordruck?',a:'<strong>Einsatztagebuch:</strong> urkundlicher, chronologischer Nachweis aller Entscheidungen und Maßnahmen – gerichtsfeste Dokumentation.<br><strong>Farben:</strong> 🟡 Gelb → Nachweisung | 🔴 Rot → immer S2 | ⬜ Weiß → beim Verfasser | 🟢 Grün → inhaltsbezogen zurück an Verfasser.'},
  {id:'i14',cat:'IdF · Stabsarbeit',q:'Was ist der Krisenstab NRW und wie ist er strukturiert?',a:'Gibt es nur in <strong>Kreisen und kreisfreien Städten</strong>; untergeordnete Kommunen haben einen <strong>SAE (Stab für außergewöhnliche Ereignisse)</strong>.<br><strong>Struktur:</strong> Leiter des Stabes · BuMA (Bevölkerungswarnung & Medienarbeit) · KGS (Koordinierungsgruppe: Lage/Doku/Innerer Dienst).<br>Ständige Mitglieder: Sicherheit, Umwelt, Soziales, Gesundheit, Polizei.'},
  {id:'i15',cat:'IdF · Presse',q:'Welche rechtliche Grundlage regelt die Pressearbeit der Feuerwehr?',a:'<strong>§ 4 Landespressegesetz (LPG):</strong> Behörden müssen auf konkrete Anfragen erschöpfende Auskünfte geben.<br><strong>§ 43 Landesbeamtengesetz (LBG):</strong> Behördenleitung entscheidet, wer Auskünfte erteilt (delegierbar auf Pressesprecher/EL).<br>Kein Anspruch auf Sofortherausgabe von Rohdaten; ausgewertete Infos innerhalb 1 Monat.'},
  {id:'i16',cat:'IdF · Presse',q:'Welche 8 Grundsätze gelten für die Pressearbeit an der Einsatzstelle?',a:'<strong>Keine</strong> Aussagen zu Schuldfragen · <strong>Keine</strong> Personalien preisgeben · <strong>Keine</strong> wertenden Aussagen · Vermutungen kennzeichnen · Wahrheitsgetreu antworten · Statements erst wenn Einsatz es zulässt · Presse darf fotografieren (Pressekodex) · Presse darf <strong>nicht</strong> behindert oder gefährdet werden.'},
  {id:'i17',cat:'IdF · Presse',q:'Was ist die BuMA und wann übernimmt sie die Führung der Medienarbeit?',a:'<strong>BuMA = Bevölkerungswarnung und Medienarbeit</strong> im administrativ-organisatorischen Krisenstab.<br>Aufgaben: aktive Medienarbeit, Bevölkerungsinformation, Bürgertelefon, Koordination aller Medieninformationen.<br>Bei <strong>Arbeitsaufnahme des Krisenstabes</strong> geht das gesamte Meldewesen und S5 der Einsatzleitung auf die BuMA über.'},

  /* ── IBK Heyrothsberge – Zusatzkarten ── */
  {id:'f62',cat:'IBK · TA',q:'Was ist eine verdeckte Transaktion?',a:'Eine Transaktion auf <strong>zwei Ebenen gleichzeitig</strong>: die soziale (manifeste) Ebene und die psychologische (latente) Ebene. Die versteckte Botschaft steuert die eigentliche Reaktion (Manipulation). Erkennbar z.B. an Tonfall oder Körpersprache, die vom Wortinhalt abweichen.'},
  {id:'f63',cat:'IBK · TA',q:'Was sind Streicheleinheiten (Strokes) in der Transaktionsanalyse?',a:'Einheiten sozialer Anerkennung:<br><strong>Positive Strokes:</strong> Lob, Wertschätzung → nähren das Kind-Ich.<br><strong>Negative Strokes:</strong> Kritik, Abwertung.<br><strong>Konditionierte Strokes:</strong> nur bei bestimmtem Verhalten.<br>Mangel erzeugt Stroke-Hunger → führt zu dysfunktionalen Verhaltensweisen.'},
  {id:'f64',cat:'IBK · Konflikt',q:'Welche 4 Ursachen von Konflikten gibt es?',a:'<strong>1. Bewertungskonflikt:</strong> unterschiedliche Werte und Normen.<br><strong>2. Beurteilungskonflikt:</strong> unterschiedliche Wahrnehmung derselben Fakten.<br><strong>3. Verteilungskonflikt:</strong> Konkurrenz um knappe Ressourcen (Geld, Macht, Zeit).<br><strong>4. Beziehungskonflikt:</strong> persönliche Antipathie, gestörtes Vertrauensverhältnis.'},
  {id:'f65',cat:'IBK · Konflikt',q:'Wie unterscheiden sich heiße und kalte Konflikte?',a:'<strong>Heißer Konflikt:</strong> offen ausgetragen, emotional aufgeladen, lautstark, hohe Energie; Parteien suchen direkte Konfrontation.<br><strong>Kalter Konflikt:</strong> verdeckt, passiv-aggressiv, schweigend, resigniert; Parteien meiden Konfrontation – oft gefährlicher wegen mangelnder Sichtbarkeit.'},
  {id:'f66',cat:'IBK · Konflikt',q:'Was besagt die B4-Regel für Führungskräfte bei Fehlverhalten?',a:'Strukturiertes Vorgehen:<br><strong>1. Beobachten</strong> (konkrete Wahrnehmung ohne Interpretation)<br><strong>2. Belehren</strong> (informieren, Erwartung klären)<br><strong>3. Beobachten</strong> (Verhalten nach Gespräch prüfen)<br><strong>4. Bestrafen</strong> (disziplinarische Maßnahme bei Nichtänderung)<br>Maßnahmen stets verhältnismäßig und dokumentiert.'},
  {id:'f67',cat:'IBK · Stress',q:'Was unterscheidet Distress und Eustress nach Selye?',a:'<strong>Eustress (positiv):</strong> kurzfristige Aktivierung, motivierend, steigert Leistungsfähigkeit (z.B. Wettkampf).<br><strong>Distress (negativ):</strong> anhaltende Überforderung, schädlich, führt zu körperlichen und psychischen Beschwerden.<br>Stress per se ist keine Krankheit – erst chronischer Distress wird pathogen.'},
  {id:'f68',cat:'IBK · Stress',q:'Was besagt das transaktionale Stressmodell nach Lazarus?',a:'Stress entsteht durch <strong>kognitive Bewertung</strong>, nicht durch den Reiz selbst:<br><strong>Primäre Bewertung:</strong> „Ist das für mich bedrohlich?" (irrelevant / günstig / stressend)<br><strong>Sekundäre Bewertung:</strong> „Habe ich Ressourcen zur Bewältigung?" (Copingpotenzial)<br><strong>Neubewertung:</strong> laufende Anpassung.<br>Implikation: Resilienztraining setzt bei der Bewertung an.'},
  {id:'f69',cat:'IBK · BGM',q:'Was sind die 6 Gesundheitsdimensionen und wie lautet die WHO-Definition?',a:'<strong>WHO 1948:</strong> „Gesundheit ist ein Zustand vollkommenen körperlichen, geistigen und sozialen Wohlbefindens, nicht nur die Abwesenheit von Krankheit."<br><strong>6 Dimensionen:</strong> 1. Körperlich · 2. Psychisch/Emotional · 3. Sozial · 4. Sinnhaftigkeit/Spirituell · 5. Gesellschaftlich · 6. Ökologisch.'},
  {id:'f70',cat:'IBK · BGM',q:'Was ist der Public-Health-Action-Cycle und welche 5 Phasen hat er?',a:'Planungsmodell für Gesundheitsmanagement:<br><strong>1. Assessment:</strong> Bestandsaufnahme (Daten, Bedarf)<br><strong>2. Policy Development:</strong> Ziele und Strategien festlegen<br><strong>3. Assurance:</strong> Umsetzung<br><strong>4. Evaluation:</strong> Wirkungsmessung<br><strong>5. Reassessment:</strong> Anpassung → Kreislauf.'},
  {id:'f71',cat:'IBK · BGM',q:'Welche 5 Phasen hat die Burnout-Entwicklung nach Freudenberger?',a:'<strong>1. Enthusiasmus:</strong> übermäßiger Einsatz, hohe Ideale.<br><strong>2. Stagnation:</strong> Enttäuschung, Bedürfnisse fehlen.<br><strong>3. Frustration:</strong> Sinnverlust, erste körperliche Symptome.<br><strong>4. Apathie:</strong> emotionale Taubheit, Zynismus.<br><strong>5. Burnout:</strong> totaler Zusammenbruch, Handlungsunfähigkeit.'},
  {id:'f72',cat:'IBK · BGM',q:'Was sind EAP, MBSR und Präsentismus?',a:'<strong>EAP (Employee Assistance Program):</strong> vertrauliches Beratungsangebot für Mitarbeiter bei privaten/beruflichen Problemen.<br><strong>MBSR (Mindfulness-Based Stress Reduction):</strong> achtsamkeitsbasiertes Stressreduktionsprogramm nach Kabat-Zinn (8-Wochen-Kurs).<br><strong>Präsentismus:</strong> Erscheinen am Arbeitsplatz trotz Krankheit – verursacht mehr Produktivitätsverlust als Absentismus.'},
  {id:'f73',cat:'IBK · BGM',q:'Was schreibt § 84 SGB IX zum Betrieblichen Eingliederungsmanagement (BEM) vor?',a:'BEM ist <strong>Pflicht für Arbeitgeber</strong> ab <strong>mehr als 6 Wochen Arbeitsunfähigkeit</strong> (zusammenhängend oder wiederholt) innerhalb eines Jahres.<br>Ziel: Arbeitsunfähigkeit überwinden, erneutem Auftreten vorbeugen, Arbeitsplatz erhalten.<br>Freiwillig für Arbeitnehmer. Betriebsrat/Personalrat wirkt mit.'},
  {id:'f74',cat:'IBK · PM',q:'Was beschreibt die SMART-Formel für Ziele?',a:'<strong>S</strong>pezifisch – konkret und klar formuliert.<br><strong>M</strong>essbar – mit Kennzahlen überprüfbar.<br><strong>A</strong>ttraktiv/Akzeptiert – motivierend, von Beteiligten getragen.<br><strong>R</strong>ealistisch – erreichbar mit vorhandenen Mitteln.<br><strong>T</strong>erminiert – klares Datum/Frist gesetzt.<br>Häufige Fehler: vage Formulierungen, fehlende Kennzahlen, kein Termin.'},
  {id:'f75',cat:'IBK · PM',q:'Was ist eine RACI-Matrix und wofür wird sie verwendet?',a:'Werkzeug zur <strong>Klärung von Verantwortlichkeiten</strong> in Projekten:<br><strong>R</strong>esponsible – führt die Aufgabe aus.<br><strong>A</strong>ccountable – trägt Gesamtverantwortung (nur 1 Person je Aufgabe).<br><strong>C</strong>onsulted – wird vor der Entscheidung befragt (2-Wege).<br><strong>I</strong>nformed – wird informiert (1-Wege).'},
  {id:'f76',cat:'IBK · PM',q:'Welche 4 Strategien gibt es im Risikomanagement?',a:'<strong>1. Vermeiden:</strong> risikoauslösende Aktivität nicht durchführen.<br><strong>2. Minimieren/Reduzieren:</strong> Eintrittswahrscheinlichkeit oder Schadensausmaß senken.<br><strong>3. Übertragen:</strong> Risiko auf Dritte verlagern (Versicherung, Subunternehmer).<br><strong>4. Akzeptieren:</strong> Risiko bewusst tragen, ggf. Rücklagen bilden.'},
  {id:'f77',cat:'IBK · PM',q:'Was kennzeichnet agiles Führen und welche Methoden gehören dazu?',a:'Agiles Führen reagiert flexibel auf Veränderungen durch kurze Feedbackzyklen:<br><strong>Daily Standup:</strong> tägliche Kurzabstimmung (max. 15 min).<br><strong>Kanban-Board:</strong> visualisiert Aufgabenstatus (To do / In Progress / Done).<br><strong>Retrospektive:</strong> Verbesserungsschleife nach jedem Sprint.<br><strong>Auftragstaktik:</strong> Ziel vorgeben, nicht den Weg.'},
  {id:'f78',cat:'IBK · Zeit',q:'Wie ist die Eisenhower-Matrix aufgebaut?',a:'2×2-Matrix nach Dringlichkeit und Wichtigkeit:<br><strong>Q1 Dringend + Wichtig:</strong> sofort erledigen (Krisen, Deadlines).<br><strong>Q2 Nicht dringend + Wichtig:</strong> planen/terminieren (Strategie, Weiterentwicklung).<br><strong>Q3 Dringend + Nicht wichtig:</strong> delegieren (Unterbrechungen, Routinemails).<br><strong>Q4 Nicht dringend + Nicht wichtig:</strong> eliminieren (Ablenkungen).'},
  {id:'f79',cat:'IBK · Zeit',q:'Was besagt das Parkinsonsche Gesetz?',a:'„<strong>Arbeit dehnt sich aus, um die verfügbare Zeit zu füllen.</strong>" (Cyril Northcote Parkinson, 1955)<br>Konsequenz: Aufgaben ohne Frist dauern tendenziell zu lange. Lösung: realistische Fristen setzen, Zeitblöcke definieren – ähnlich der ALPEN-Methode.'},

  /* ── VAk Berlin – Zusatzkarten ── */
  {id:'v21',cat:'VAk · Verwaltungsrecht',q:'Welche 3 Ermessensfehler kann eine Behörde begehen?',a:'<strong>1. Ermessensüberschreitung:</strong> Behörde wählt eine Rechtsfolge, die das Gesetz nicht vorsieht.<br><strong>2. Ermessensfehlgebrauch:</strong> sachfremde Erwägungen, Willkür, Verstoß gegen Gleichbehandlung.<br><strong>3. Ermessensunterschreitung (Nichtgebrauch):</strong> Behörde erkennt nicht, dass sie Ermessen hat, und entscheidet schematisch.'},
  {id:'v22',cat:'VAk · Verwaltungsrecht',q:'Wie läuft das Widerspruchsverfahren ab?',a:'<strong>Frist:</strong> 1 Monat ab Bekanntgabe des VA (ohne Belehrung: 1 Jahr).<br><strong>Verfahren:</strong> schriftlicher Widerspruch → Ausgangsbehörde prüft (Abhilfe?) → ggf. Widerspruchsbehörde entscheidet → Widerspruchsbescheid.<br>Ergebnis: Aufhebung, Abänderung oder Zurückweisung → dann Klage beim VG möglich.'},
  {id:'v23',cat:'VAk · Verwaltungsrecht',q:'Was unterscheidet Anfechtungsklage und Verpflichtungsklage?',a:'<strong>Anfechtungsklage (§ 42 I VwGO):</strong> Aufhebung eines belastenden VA (Abrissanordnung, Bußgeld).<br><strong>Verpflichtungsklage (§ 42 I Alt.2 VwGO):</strong> Erlass eines abgelehnten begünstigenden VA (Baugenehmigung, Zulassung).<br><strong>Allgemeine Leistungsklage:</strong> auf reales Handeln/Unterlassen ohne VA – z.B. Akteneinsicht.'},
  {id:'v24',cat:'VAk · Staatsrecht',q:'Was schützen Art. 1, 2 und 3 GG?',a:'<strong>Art. 1 GG – Menschenwürde:</strong> unantastbar, nicht einschränkbar, Grundlage aller Grundrechte.<br><strong>Art. 2 GG – Allg. Handlungsfreiheit / körperl. Unversehrtheit:</strong> einschränkbar durch Gesetz.<br><strong>Art. 3 GG – Gleichheitssatz:</strong> Gleichbehandlung vor dem Gesetz; Art. 3 III: keine Diskriminierung wegen Geschlecht, Abstammung, Rasse, Sprache, Glauben.'},
  {id:'v25',cat:'VAk · Staatsrecht',q:'Wann und wie können Grundrechte eingeschränkt werden?',a:'Nur durch <strong>Gesetz oder aufgrund eines Gesetzes</strong> (Gesetzesvorbehalt). Grenzen:<br><strong>1. Legitimes Ziel</strong> (Gemeinwohlinteresse).<br><strong>2. Verhältnismäßigkeit</strong> (Geeignetheit, Erforderlichkeit, Angemessenheit).<br><strong>3. Wesensgehaltsgarantie</strong> (Art. 19 II GG): Kernbereich des Grundrechts bleibt stets unberührt.'},
  {id:'v26',cat:'VAk · Staatsrecht',q:'Wie ist die Gesetzgebungszuständigkeit zwischen Bund und Ländern verteilt?',a:'<strong>Art. 70 GG:</strong> Länder haben Kompetenz, soweit GG nichts anderes bestimmt.<br><strong>Art. 71 GG – ausschließliche Bundesgesetzgebung:</strong> nur Bund (auswärtige Angelegenheiten, Währung).<br><strong>Art. 72/74 GG – konkurrierende Gesetzgebung:</strong> Bund und Länder; Bund hat Vorrang bei Bedarf nach bundeseinheitlicher Regelung (Straßenverkehr, Bürgerl. Recht).'},
  {id:'v27',cat:'VAk · Staatsrecht',q:'Wie läuft das Gesetzgebungsverfahren nach Art. 76–82 GG ab?',a:'<strong>Einbringen</strong> (BT, BReg, BR) → <strong>1. Lesung BT</strong> → <strong>Ausschussberatung</strong> → <strong>2. + 3. Lesung + Abstimmung</strong> → <strong>BR-Zustimmung</strong> (Einspruchs- oder Zustimmungsgesetz) → <strong>Gegenzeichnung BKin</strong> → <strong>Ausfertigung durch BPräs</strong> → <strong>Verkündung im BGBl.</strong> → Inkrafttreten.'},
  {id:'v28',cat:'VAk · Dienstrecht',q:'Was ist die Remonstrationspflicht und welche Folgen hat sie?',a:'Nach <strong>§ 36 BeamtStG</strong> muss der Beamte den Vorgesetzten auf rechtliche Bedenken hinweisen, wenn ein Befehl gesetzwidrig erscheint.<br>Beharrt der Vorgesetzte (schriftlich): Beamter muss folgen und ist <strong>von der persönlichen Verantwortung befreit</strong>.<br>Ausnahme: offensichtlich rechtswidrige, strafbare Befehle → kein Befolgen.'},
  {id:'v29',cat:'VAk · Dienstrecht',q:'Welchen Umfang hat die Verschwiegenheitspflicht nach § 37 BeamtStG?',a:'Beamte haben über dienstlich bekannt gewordene Angelegenheiten <strong>Verschwiegenheit zu wahren</strong>.<br>Gilt auch <strong>nach Beendigung</strong> des Beamtenverhältnisses.<br><strong>Ausnahmen:</strong> offenkundige Tatsachen, Mitteilungen an Strafverfolgungsbehörden, Befreiung durch Dienstherr.<br>Verletzung: Dienstvergehen, ggf. strafbar (§ 353b StGB).'},
  {id:'v30',cat:'VAk · Dienstrecht',q:'Was ist bei Nebentätigkeiten von Beamten zu beachten?',a:'Grundsätzlich <strong>genehmigungspflichtig</strong> oder anzeigepflichtig (je nach Landesrecht).<br><strong>Versagungsgründe:</strong> Beeinträchtigung des Hauptamts, Interessenkonflikt, erheblicher Zeitaufwand, Ansehen der Behörde gefährdet.<br><strong>Ohne Genehmigung:</strong> Ehrenamt, geringe Aufwandsentschädigungen unterhalb gesetzlicher Freigrenze.'},
  {id:'v31',cat:'VAk · Einsatzrecht',q:'Was unterscheidet Legalitätsprinzip und Opportunitätsprinzip?',a:'<strong>Legalitätsprinzip:</strong> Behörde MUSS tätig werden, wenn Tatbestand erfüllt ist (gebundene Entscheidung). Gilt im Strafrecht: Staatsanwaltschaft muss ermitteln.<br><strong>Opportunitätsprinzip:</strong> Behörde KANN tätig werden (Ermessen). Gilt im Ordnungsrecht.<br>Ermessensreduzierung auf null = Opportunität kippt zur Legalität.'},
  {id:'v32',cat:'VAk · Einsatzrecht',q:'Wie unterscheiden sich Polizei und allgemeines Ordnungsrecht?',a:'<strong>Polizei:</strong> Gefahrenabwehr, wenn Handeln nicht aufschiebbar (Eilkompetenz).<br><strong>Ordnungsbehörden:</strong> fachspezifische Gefahrenabwehr (Baurecht, Lebensmittelrecht, Feuerschutz).<br><strong>Subsidiarität:</strong> Polizei tritt zurück, wenn Ordnungsbehörde rechtzeitig handeln kann.<br>Feuerwehr = Sonderordnungsbehörde im Bereich Brandschutz/Hilfeleistung.'},
  {id:'v33',cat:'VAk · Einsatzrecht',q:'Was ist Amtshilfe und wann ist die Feuerwehr dazu verpflichtet?',a:'<strong>Art. 35 GG / § 4 VwVfG:</strong> Behörden leisten sich gegenseitig Hilfe.<br><strong>Verpflichtung:</strong> wenn eine andere Behörde die Hilfe anfordert und Feuerwehr die Maßnahmen durchführen kann.<br><strong>Grenzen:</strong> eigene Aufgaben dürfen nicht unzumutbar beeinträchtigt werden; Handlung nach eigenem Recht (kein Kompetenztransfer).'},

  /* ── VAk Berlin – Batch 2 ── */
  {id:'v34',cat:'VAk · Verwaltungsrecht',q:'Was unterscheidet unmittelbare und mittelbare Staatsverwaltung?',a:'<strong>Unmittelbare Verwaltung:</strong> der Staat/die Gemeinde selbst handelt. Kommunen nehmen Aufgaben im eigenen oder übertragenen Wirkungskreis wahr (Selbstverwaltung, Pflichtaufgaben, Pflichtaufgaben zur Erfüllung nach Weisung).<br><strong>Mittelbare Verwaltung:</strong> eigenständige Rechtsträger handeln – Körperschaften (Mitglieder), Anstalten (Nutzer), Stiftungen des öffentlichen Rechts, Beliehene (übertragene hoheitliche Aufgaben).'},
  {id:'v35',cat:'VAk · Verwaltungsrecht',q:'Welche Grundsätze des Verwaltungshandelns gelten?',a:'<strong>Gesetzmäßigkeit:</strong> Vorrang des Gesetzes (kein Handeln gegen Gesetz) + Vorbehalt des Gesetzes (kein Handeln ohne Gesetz).<br><strong>Gleichbehandlung:</strong> Diskriminierungsgebot (Gleiches gleich behandeln) + Differenzierungsgebot (Ungleiches ungleich behandeln); Ungleichbehandlung nur mit sachlichem Grund.<br><strong>Ermessen:</strong> Entschließungs- und Auswahlermessen.<br><strong>Verhältnismäßigkeit:</strong> Ziel – Geeignetheit – Erforderlichkeit – Angemessenheit.'},
  {id:'v36',cat:'VAk · Verwaltungsrecht',q:'Wie wird ein Verwaltungsverfahren eingeleitet und welche Zuständigkeit gilt?',a:'<strong>Von Amts wegen (Offizialprinzip):</strong> Entschließungsermessen und Legalitätsprinzip – Behörde handelt ohne Antrag.<br><strong>Auf Antrag (Dispositionsprinzip):</strong> Bürger stellt Antrag.<br><strong>Sachliche Zuständigkeit:</strong> Aufgabenzuweisung durch Gesetz.<br><strong>Örtliche Zuständigkeit.</strong><br><strong>Instanzielle Zuständigkeit:</strong> innerhalb des Behördenaufbaus.<br><strong>Anhörung:</strong> erforderlich bei belastenden Entscheidungen; kann bei Gefahr im Verzug entfallen; fehlerhafte Anhörung kann geheilt werden.'},
  {id:'v37',cat:'VAk · Verwaltungsrecht',q:'Wie wird ein Verwaltungsakt bekanntgegeben?',a:'Ein VA wird mit Bekanntgabe wirksam (Widerspruchsfrist: 1 Monat).<br><strong>Einfache Bekanntgabe:</strong> per Post – gilt am 4. Tag als zugestellt.<br><strong>Öffentliche Bekanntgabe:</strong> ortsüblich – gilt nach 2 Wochen als bekanntgegeben.<br><strong>Förmliche Bekanntgabe:</strong> nach Verwaltungszustellungsgesetz – PZU, Einschreiben, Empfangsbekenntnis.'},
  {id:'v38',cat:'VAk · Verwaltungsrecht',q:'Wie läuft die Verwaltungsvollstreckung in 3 Stufen ab?',a:'<strong>Voraussetzung:</strong> durchzusetzender VA muss unanfechtbar sein oder sofortige Vollziehung angeordnet haben oder keine aufschiebende Wirkung haben.<br><strong>Stufe 1 – Androhung:</strong> im VA selbst oder als eigener VA; qualifizierte Zustellung erforderlich.<br><strong>Stufe 2 – Festsetzung:</strong> eigener VA.<br><strong>Stufe 3 – Durchführung:</strong> Realakt (Ersatzvornahme / Zwangsgeld / Unmittelbarer Zwang).'},
  {id:'v39',cat:'VAk · Staatsrecht',q:'Was braucht ein Staat und welche Staatsformen gibt es?',a:'<strong>3 Elemente eines Staates:</strong> Staatsgebiet, Staatsvolk, Staatsgewalt (heute ergänzt: Effektivität).<br><strong>Staatsformen:</strong> Monarchie (absolut, aufgeklärt, konstitutionell, parlamentarisch), Republik (parlamentarisch, präsidentiell, Volksrepublik), Diktatur.<br><strong>Regierungsformen:</strong> Diktatur (autoritär/totalitär) vs. Demokratie (direkt oder repräsentativ).'},
  {id:'v40',cat:'VAk · Staatsrecht',q:'Welche 3 Sicherungsmechanismen schützen die Staatsfundamentalnormen des GG?',a:'<strong>1. Homogenitätsklausel (Art. 28 I GG):</strong> Bundesländer müssen republikanische, demokratische und soziale Grundsätze einhalten.<br><strong>2. Ewigkeitsklausel (Art. 79 III GG):</strong> Kern der Staatsfundamentalnormen (Art. 1 und 20 GG) ist verfassungsänderungsfest – selbst eine verfassungsändernde Mehrheit kann ihn nicht beseitigen.<br><strong>3. Strukturversicherungsklausel (Art. 23 I GG):</strong> Die EU muss demokratischen, rechtsstaatlichen und sozialen Grundsätzen entsprechen.'},
  {id:'v41',cat:'VAk · Staatsrecht',q:'Wie ist der Bundesrat zusammengesetzt und was sind seine Aufgaben?',a:'<strong>Zusammensetzung:</strong> Vertreter der Bundesländer (benannt durch Länderregierungen); Sitzverteilung gemäß Art. 51 II GG (3–6 Stimmen je nach Einwohnerzahl).<br><strong>Vorsitz:</strong> Bundesratspräsident (wechselt zum 1.11., vertritt den Bundespräsidenten).<br><strong>Aufgaben:</strong> Mitwirkung bei der Bundesgesetzgebung (Einspruchs- oder Zustimmungsgesetz), Interessenvertretung der Länder, Mitwirkung bei Verordnungen und EU-Angelegenheiten.'},
  {id:'v42',cat:'VAk · Einsatzrecht',q:'Welche Grundrechte sind im Feuerwehreinsatz besonders relevant?',a:'<strong>Art. 2 Abs. 1 i.V.m. Art. 1 Abs. 1 GG:</strong> Informationelle Selbstbestimmung – einschränkbar gem. §48 BHKG.<br><strong>Art. 2 Abs. 2 S. 1 GG:</strong> Recht auf körperliche Unversehrtheit – z.B. bei Zwangsmaßnahmen.<br><strong>Art. 2 Abs. 2 S. 2 GG:</strong> Freiheit der Person – z.B. bei Sperrmaßnahmen.<br><strong>Art. 13 GG:</strong> Unverletzlichkeit der Wohnung – Betretensrecht gem. §44 Abs. 2 BHKG i.V.m. Art. 13 Abs. 7 GG.<br><em>(Zitiergebot gem. §48 BHKG; Art. 1 Abs. 1 GG ist absolut unantastbar – kein Eingriff möglich)</em>'},
  {id:'v43',cat:'VAk · Einsatzrecht',q:'Welche 5 Fragen prüft man, ob die Feuerwehr handeln muss/darf?',a:'<strong>1. Aufgabenzuweisung:</strong> Hat die Feuerwehr durch Feuerwehrgesetz einen Auftrag?<br><strong>2. Konkrete Gefahr:</strong> Liegt eine konkrete Gefahr für ein Schutzgut vor?<br><strong>3. Handlungsverpflichtung:</strong> Besteht eine Pflicht zum Einschreiten?<br><strong>4. Befugnis:</strong> Liegt eine gesetzliche Eingriffsbefugnis vor?<br><strong>5. Rechtmäßigkeit:</strong> Muss das Handeln rechtmäßig sein (Verhältnismäßigkeit, Zuständigkeit).'},
  {id:'v44',cat:'VAk · Einsatzrecht',q:'Welche Rechte und Pflichten hat die Bevölkerung gegenüber der Feuerwehr?',a:'<strong>Unmittelbare Pflichten:</strong> Pflicht zur Gefahrenvermeidung, Meldepflicht, Hilfeleistungspflicht (Heranziehen von Personen und Sachmitteln).<br><strong>Mittelbare Pflichten (Duldungspflichten):</strong> Entfernen störender Gegenstände, Zutritts- und Betretensrecht dulden, Duldungsverpflichtung auch für Nachbargrundstücke.<br>Nicht nachkommen kann <strong>Ordnungswidrigkeit</strong> nach Feuerwehrgesetz sein. Verhältnismäßigkeit immer beachten!'},
  {id:'v45',cat:'VAk · Einsatzrecht',q:'Wann ist eine strafrechtliche Handlung der Feuerwehr gerechtfertigt?',a:'Verwirklicht die Feuerwehr einen Straftatbestand, ist sie in <strong>persönlicher Verantwortung</strong> (i.d.R. fahrlässig).<br><strong>Rechtfertigung möglich, wenn:</strong><br>1. Eine Gefahr für Leib, Leben, Freiheit, Ehre, Eigentum oder ein anderes Rechtsgut bestand.<br>2. Das geschützte Interesse das beeinträchtigte <strong>wesentlich überwiegt</strong>.<br>→ Dann bleibt die Verwirklichung des Straftatbestands <strong>straffrei</strong>.'},
  {id:'v46',cat:'VAk · Dienstrecht',q:'Was sind die 3 Einstellungskriterien nach Art. 33 II GG und was ist der Bewerberverfahrensanspruch?',a:'<strong>Art. 33 II GG – Bestenauslese:</strong><br><strong>1. Eignung:</strong> persönliche, charakterliche, gesundheitliche Eigenschaften.<br><strong>2. Befähigung:</strong> fachliches Wissen und Können für die Laufbahn.<br><strong>3. Fachliche Leistung:</strong> bisherige Arbeitsleistung (dienstliche Beurteilungen).<br><strong>Bewerberverfahrensanspruch:</strong> leistungsgerechte Einbeziehung aller; bei Gleichstand Hilfskriterien; nach Auswahl 2-wöchige Wartefrist (Ämterstabilität); Grundsatz: Stellenausschreibungspflicht.'},
  {id:'v47',cat:'VAk · Dienstrecht',q:'Welche 3 Beurteilungsarten gibt es und wann werden sie eingesetzt?',a:'<strong>1. Regelbeurteilung:</strong> periodisch für alle Beamten; Standardform; Grundlage für Beförderungsentscheidungen.<br><strong>2. Anlassbeurteilung:</strong> wenn keine aktuelle, vergleichbare Regelbeurteilung vorliegt und eine Auswahlentscheidung ansteht.<br><strong>3. Probezeitbeurteilung:</strong> prüft Bewährung nach Eignung, Befähigung und fachlicher Leistung vor Übernahme in das Beamtenverhältnis auf Lebenszeit.'},
  {id:'v48',cat:'VAk · Dienstrecht',q:'Welche 5 Disziplinarmaßnahmen gibt es aufsteigend nach Schwere?',a:'<strong>1. Verweis:</strong> leichtes Dienstvergehen, keine/geringe Vertrauenseinschränkung.<br><strong>2. Geldbuße:</strong> leichtes bis mittelschweres Vergehen.<br><strong>3. Kürzung der Dienstbezüge:</strong> mittelschweres Vergehen, erhebliche Vertrauensbeeinträchtigung.<br><strong>4. Zurückstufung:</strong> mittelschweres bis schweres Vergehen, Vertrauen nachhaltig erschüttert.<br><strong>5. Entfernung aus dem Beamtenverhältnis:</strong> schweres Vergehen, Vertrauen endgültig verloren.'},
  {id:'v49',cat:'VAk · Dienstrecht',q:'Wie läuft ein Disziplinarverfahren in 4 Schritten ab?',a:'<strong>1. Verdacht:</strong> Vorermittlungen, Kenntnis durch Vorgesetzte/Beschwerde; Einleitung von Amts wegen oder auf Antrag des Beamten.<br><strong>2. Einleitungsverfügung:</strong> Unterrichtung und Belehrung des Betroffenen, Anhörung, Rechtsbeistand.<br><strong>3. Ermittlung:</strong> Ermittlungsführer erhebt Beweis; Aussetzung bei laufendem Strafverfahren.<br><strong>4. Abschluss:</strong> Einstellung (mit/ohne Dienstvergehen), Disziplinarverfügung, ggf. Klage beim VG.'},

  /* ── VAk Berlin – 9-Punkte-Schema (Batch 3) ── */
  {id:'v50',cat:'VAk · Einsatzrecht',q:'Was sind die 9 Schritte des Fallbearbeitungsschemas für den Feuerwehreinsatz (BHKG/OBG NRW)?',a:'<strong>1. Ermächtigungsgrundlage</strong> – Auf welche Rechtsgrundlage stützt die Feuerwehr ihr Handeln? VA oder Realakt?<br><strong>2. Zuständigkeit</strong> – sachlich, örtlich, instanziell; Verfahrensanforderungen.<br><strong>3. Gefahr</strong> – Vorliegen einer konkreten, abstrakten oder Anscheinsgefahr.<br><strong>4. Störerauswahl</strong> – Verhaltensstörer (§17 OBG), Zustandsstörer (§18 OBG), Nichtstörer (§19 OBG).<br><strong>5. Ermessen</strong> – Entschließungs- und Auswahlermessen; Reduktion auf Null?<br><strong>6. Verhältnismäßigkeit</strong> – legitimer Zweck, Geeignetheit, Erforderlichkeit, Angemessenheit.<br><strong>7. Rechtsfolge</strong> – Inhalt des VA (W-Fragen) oder des Realakts.<br><strong>8. Kosten- und Entschädigungsfragen</strong> – §45 BHKG (Nichtstörer).<br><strong>9. Dokumentation u. Sicherung</strong> – §34 Abs.1 BHKG; Übergabe an zuständige Stelle.'},
  {id:'v51',cat:'VAk · Einsatzrecht',q:'Wie unterscheiden sich VA und Realakt in der Fallprüfung des 9-Punkte-Schemas?',a:'<strong>Verwaltungsakt (VA, §35 VwVfG):</strong> Alle 6 Merkmale prüfen (hoheitlich, Behörde, öffentliches Recht, Regelung, Einzelfall, Außenwirkung) → alle 9 Prüfungsschritte.<br><strong>Realakt:</strong> Schlichtes Verwaltungshandeln ohne Regelungscharakter (z.B. löschen, Türöffnung ohne Adressat) → Schritte 1–3 materiell ausreichend; Schritte 4–7 (Störer, Ermessen, Verhältnismäßigkeit, Rechtsfolge) entfallen. Schritte 8–9 gelten immer.<br><strong>Abgrenzung:</strong> Wird eine Person angesprochen und etwas angeordnet? → VA. Kein Adressat vorhanden oder möglich? → Realakt.<br><strong>Sonderfall Allgemeinverfügung (§35 S.2 VwVfG):</strong> VA an unbestimmten Personenkreis – z.B. Absperrung einer Zone.'},
  {id:'v52',cat:'VAk · Einsatzrecht',q:'Welche Verfahrensrechte entfallen bei Gefahr im Verzug (§28 Abs.2 Nr.1 VwVfG)?',a:'Im Regelfall gilt vor jedem belastenden VA eine <strong>Anhörungspflicht</strong> (§28 Abs.1 VwVfG).<br><strong>Bei Gefahr im Verzug (§28 Abs.2 Nr.1 VwVfG)</strong> kann die Anhörung entfallen – Gründe sind zu dokumentieren.<br>Außerdem zulässig im Feuerwehreinsatz:<br>• <strong>Mündlicher VA</strong> (§37 Abs.2 VwVfG)<br>• <strong>Keine Begründungspflicht</strong> (§39 Abs.1 S.1 VwVfG – bei mündlichem VA)<br>• <strong>Mündliche Bekanntgabe</strong> (§41 Abs.1 VwVfG)<br><strong>Merke:</strong> Formale Anforderungen reduzieren sich bei Gefahr – materielle Anforderungen (Verhältnismäßigkeit, Rechtsgrundlage) bleiben unverändert bestehen.'},
  {id:'v53',cat:'VAk · Einsatzrecht',q:'Was ist eine Anscheinsgefahr und wie wirkt sie auf die Rechtmäßigkeit der Maßnahme?',a:'<strong>Anscheinsgefahr:</strong> Ex-ante erscheint eine konkrete Gefahr als hinreichend wahrscheinlich; ex-post stellt sich heraus, dass keine reale Gefahr bestand.<br><strong>Beispiel:</strong> Türöffnung wegen piependen Rauchmelders um 02:15 Uhr + älterer alleinlebender Bewohner – Wohnung leer, leere Batterie.<br><strong>Maßstab:</strong> sorgfältiger, sachkundiger Beamter zum Zeitpunkt des Handelns (ex-ante-Perspektive).<br><strong>Rechtsfolge:</strong> Maßnahme bleibt <strong>rechtmäßig</strong>, wenn Gefahrenprognose ex-ante vertretbar war.<br><strong>Abgrenzung Scheingefahr:</strong> Nur subjektiv angenommen, nicht objektivierbar → Maßnahme rechtswidrig.'},
  {id:'v54',cat:'VAk · Einsatzrecht',q:'Wann verdichtet sich das Entschließungsermessen der Feuerwehr zur Handlungspflicht (Null-Reduktion)?',a:'Entschließungsermessen (ob tätig werden?) ist grundsätzlich frei, verdichtet sich zur Pflicht wenn:<br><strong>1.</strong> Hochrangiges Rechtsgut bedroht (Leben, körperliche Unversehrtheit).<br><strong>2.</strong> Konkrete Gefahr (nicht bloß abstrakt) besteht.<br><strong>3.</strong> Keine zumutbaren Alternativen vorhanden.<br><strong>Rechtsgrundlagen:</strong> §1 Abs.1 Nr.1 BHKG (Pflichtaufgabe Brandschutz/Hilfeleistung), §1 Abs.1 OBG, §34 Abs.2 BHKG.<br><strong>Praktisch:</strong> Menschenleben in Gefahr = immer Handlungspflicht. Wirtschaftliche Interessen des Störers (z.B. Umsatzverlust) sind rechtlich ohne Belang.'},
  {id:'v55',cat:'VAk · Einsatzrecht',q:'Welche 3 Voraussetzungen braucht die Inanspruchnahme eines Nichtstörers (§19 OBG)?',a:'Ein <strong>Nichtstörer</strong> (weder §17- noch §18-OBG-Störer) darf nur in Anspruch genommen werden, wenn:<br><strong>1.</strong> Störer nicht rechtzeitig erreichbar oder Maßnahmen gegen ihn unzureichend.<br><strong>2.</strong> Gefahr sonst nicht abwendbar (keine andere zumutbare Maßnahme).<br><strong>3.</strong> Nichtstörer wird so wenig wie möglich belastet (Verhältnismäßigkeit besonders streng).<br><strong>Rechtsfolge:</strong> Entschädigungsanspruch gem. §45 Abs.2 BHKG gegen die Gemeinde – auch bei rechtmäßiger Inanspruchnahme.<br><strong>Beispiel:</strong> Nachbargrundstück als Aufstellfläche bei Gefahrgutunfall → Entschädigungsanspruch.'},
  {id:'v56',cat:'VAk · Einsatzrecht',q:'Was regelt §45 Abs.2 BHKG zum Entschädigungsanspruch des Nichtstörers?',a:'<strong>§45 Abs.2 BHKG:</strong> Wer als Nichtstörer (§19 OBG) in Anspruch genommen wurde, hat Anspruch auf <strong>angemessene Entschädigung</strong> durch die Gemeinde.<br><strong>Besonderheit:</strong> Anspruch besteht auch bei <strong>rechtmäßigem</strong> Handeln der Feuerwehr – verschuldensunabhängiger Aufopferungsanspruch.<br><strong>Kein Anspruch nach §45 BHKG</strong> bei: Störern (§§17, 18 OBG), Realakt ohne Adressat, fehlendem Nichtstörer-Status.<br><strong>Anspruchsgegner:</strong> Gemeinde (als Trägerin der Feuerwehr), nicht der Einsatzleiter persönlich.<br><strong>Merke:</strong> Störer haften; Nichtstörer werden entschädigt.'},
  {id:'v57',cat:'VAk · Verwaltungsrecht',q:'Was ist eine Allgemeinverfügung (§35 S.2 VwVfG) und wann liegt sie im Feuerwehreinsatz vor?',a:'<strong>§35 S.1 VwVfG:</strong> Individueller VA – bestimmter Adressat (z.B. Anordnung an konkrete Person).<br><strong>§35 S.2 VwVfG – Allgemeinverfügung:</strong> VA, der sich an einen nach allgemeinen Merkmalen bestimmten oder bestimmbaren Personenkreis richtet oder die öffentlich-rechtliche Eigenschaft einer Sache regelt.<br><strong>Beispiel Feuerwehreinsatz:</strong> Absperrung einer Gefahrenzone – richtet sich an alle Personen, die den Bereich betreten wollen → unbestimmter Personenkreis → Allgemeinverfügung.<br><strong>Bekanntgabe:</strong> mündlich an anwesende Personen oder durch sichtbare Absperrung.<br><strong>Merke:</strong> Absperren = Allgemeinverfügung; Anordnung an Einzelperson = individueller VA.'},
  {id:'v58',cat:'VAk · Einsatzrecht',q:'Wie wird ein mündlicher Verwaltungsakt im Einsatz nach den W-Fragen formuliert?',a:'Mündliche VAs (§37 Abs.2 VwVfG) müssen hinreichend bestimmt sein. Die <strong>W-Fragen</strong> strukturieren den Inhalt:<br><strong>Wer</strong> muss handeln/dulden? (Adressat)<br><strong>Was</strong> ist zu tun/zu unterlassen? (Inhalt)<br><strong>Wann</strong> / in welcher Frist? (Zeitpunkt)<br><strong>Wohin</strong> / wo? (Ort)<br><strong>Wie lange?</strong> (Dauer)<br>Beispiel: <em>„Sie verlassen jetzt sofort das Gebäude und begeben sich hinter die Absperrung – bis zur Freigabe durch die Feuerwehr."</em><br>Bei Weigerung: <strong>Unmittelbarer Zwang</strong> gem. §44 Abs.2 BHKG ohne vorherige Androhung zulässig (Gefahr im Verzug).'},
  {id:'v59',cat:'VAk · Einsatzrecht',q:'Was regelt §34 Abs.1 BHKG zur Dokumentationspflicht der Feuerwehr?',a:'<strong>§34 Abs.1 BHKG</strong> verpflichtet zur vollständigen Dokumentation jedes Einsatzes im <strong>Einsatzbericht</strong>.<br>Zu dokumentieren: Alarmierung, Lage, Maßnahmen mit Begründung, eingesetzte Rechtsgrundlagen, Zeitpunkte, handelnde Kräfte.<br><strong>Merkhilfe (latein):</strong> quis (Wer), quid (Was), quando (Wann), ubi (Wo), cur (Warum).<br><strong>Zweck:</strong><br>• Nachvollziehbarkeit und Rechtssicherheit<br>• Grundlage für Kostenersatz (§45 BHKG) und Entschädigungsansprüche<br>• Beweismittel bei Haftungsfragen<br>• Grundlage für Widerspruchs- und Klageverfahren<br><strong>Merke:</strong> Gute Dokumentation = Rechtssicherheit für Einsatzleiter und Gemeinde.'},
  {id:'v60',cat:'VAk · Einsatzrecht',q:'Was ist beim Verlassen der Einsatzstelle (Schritt 9: Sicherung) zu beachten?',a:'Beim Verlassen der Einsatzstelle gilt die Sicherungspflicht (§34 Abs.1 BHKG):<br><strong>§24 Abs.1 Nr.2 OBG:</strong> Weiterleitungspflicht bei fortbestehender Gefahr an die zuständige Behörde (Ordnungsamt, Baurechtsamt etc.).<br><strong>§43 Nr.1 PolG NRW:</strong> Polizei einschalten bei Straftatverdacht oder wenn keine andere Ordnungsbehörde rechtzeitig erreichbar ist.<br><strong>Praktische Maßnahmen:</strong><br>• Eigentümer/Betreiber benachrichtigen<br>• Beschädigte Zugänge provisorisch sichern<br>• Übergabe dokumentieren (§34 Abs.1 BHKG)<br>• Eigentümer auf Entschädigungsanspruch hinweisen (§45 BHKG)<br><strong>Merke:</strong> Keine Einsatzstelle ohne gesicherte Übergabe verlassen.'},
  {id:'v61',cat:'VAk · Einsatzrecht',q:'Wann ist unmittelbarer Zwang (§44 Abs.2 BHKG) ohne vorherige Androhung zulässig?',a:'Grundsatz Verwaltungsvollstreckung: <strong>Androhung → Festsetzung → Durchführung</strong>.<br><strong>Ausnahme – sofortiger Vollzug ohne Androhung:</strong> wenn Gefahr im Verzug vorliegt, d.h. das Zuwarten den Zweck gefährden würde.<br><strong>§44 Abs.2 BHKG</strong> ermächtigt die Feuerwehr zum unmittelbaren Zwang, wenn der VA nicht befolgt wird und Gefahr im Verzug besteht.<br><strong>Zulässige Mittel:</strong> körperliche Gewalt, Hilfsmittel (Brecheisen, Seilwinde), Schutzmaßnahmen – stets verhältnismäßig.<br><strong>Beispiel:</strong> Filialleiter verweigert Räumung trotz Gasgeruch → Feuerwehr räumt zwangsweise gem. §44 Abs.2 BHKG.<br><strong>Merke:</strong> Verhältnismäßigkeit gilt auch beim unmittelbaren Zwang.'},
  {id:'v62',cat:'VAk · Einsatzrecht',q:'Wie unterscheiden sich Verhaltensstörer (§17 OBG) und Zustandsstörer (§18 OBG) an Einsatzbeispielen?',a:'<strong>Verhaltensstörer (§17 OBG):</strong> Person, die durch aktives Tun oder pflichtwidriges Unterlassen die Gefahr unmittelbar verursacht.<br>Beispiele:<br>• Filialleiter verweigert Räumung (Unterlassen einer gebotenen Handlung)<br>• Fahrer des umgestürzten Lkw (hat durch Unfall die Gefahr kausal verursacht)<br><strong>Zustandsstörer (§18 OBG):</strong> Eigentümer oder Inhaber der tatsächlichen Gewalt über eine Sache, von der die Gefahr ausgeht.<br>Beispiele:<br>• Eigentümer des brennenden EV in der Tiefgarage<br>• Halter des Gefahrgut-Lkw (auslaufende Salzsäure)<br>• Betreiber des Supermarkts (gasführende Anlage)<br><strong>Auswahlermessen:</strong> Bei mehreren Störern richtet sich die Auswahl nach Effektivität – i.d.R. der vor Ort anwesende, handlungsfähige Störer.'},

  /* ── FeuAK Hamburg – Zusatzkarten ── */
  {id:'h26',cat:'FeuAK · VWL',q:'Wie funktioniert der Preismechanismus über Angebot und Nachfrage?',a:'<strong>Nachfragekurve:</strong> fallend – je höher der Preis, desto weniger wird nachgefragt.<br><strong>Angebotskurve:</strong> steigend – je höher der Preis, desto mehr wird angeboten.<br><strong>Gleichgewichtspreis:</strong> Schnittpunkt; Markt räumt sich selbst.<br>Verschiebungen: Einkommenszunahme → Nachfrage↑ → P↑ und Q↑; Kostensenkung → Angebot↑ → P↓ und Q↑.'},

  {id:'h28',cat:'FeuAK · VWL',q:'Was versteht man unter dem Modell „Staat als Nachtwächter" und welche Rolle spielt die Feuerwehr darin?',a:'<strong>Nachtwächterstaat:</strong> Klassisches VWL-Modell; der Staat beschränkt sich primär auf den Schutz der Bürger (innere Sicherheit, Eigentumsschutz).<br><strong>Rolle der Feuerwehr:</strong> Sie ist – wie Polizei und Justiz – eine Kernkompetenz dieser Staatsform.<br><strong>Basis für Wirtschaft:</strong> Unternehmen investieren nur dort, wo Eigentum vor Bränden und Katastrophen geschützt ist.<br><strong>Standortvorteil:</strong> Funktionierender Brandschutz schafft Vertrauen und wirtschaftliche Stabilität.'},
  {id:'h31',cat:'FeuAK · Haushalt',q:'Welche 6 Haushaltsgrundsätze gelten im kommunalen Haushaltsrecht?',a:'<strong>1. Vollständigkeit:</strong> alle Einnahmen und Ausgaben erfassen.<br><strong>2. Einheit:</strong> ein Haushaltsplan pro Periode.<br><strong>3. Öffentlichkeit:</strong> Haushalt öffentlich zugänglich.<br><strong>4. Jährlichkeit:</strong> gilt für ein Haushaltsjahr.<br><strong>5. Sparsamkeit und Wirtschaftlichkeit:</strong> Mittel optimal einsetzen.<br><strong>6. Vorherigkeit:</strong> Haushalt vor Beginn des HH-Jahres beschließen.'},
  {id:'h32',cat:'FeuAK · Haushalt',q:'Was ist Benchmarking im öffentlichen Sektor?',a:'<strong>Systematischer Vergleich</strong> von Prozessen, Leistungen und Kosten (Best-Practice-Vergleich).<br><strong>Arten:</strong> intern (abteilungsübergreifend), extern (andere Kommunen), funktional (branchenübergreifend).<br>Ziel: Effizienzlücken aufdecken, wirtschaftliches Handeln belegen.<br>Wichtig: Vergleichbarkeit sicherstellen (gleiche Kennzahlen, Kostenstrukturen).'},
  {id:'h33',cat:'FeuAK · Vergabe',q:'Welche Vergabeverfahrensarten gibt es oberhalb der EU-Schwellenwerte?',a:'<strong>1. Offenes Verfahren:</strong> unbegrenzte Bewerber, öffentliche Bekanntmachung (Standardverfahren).<br><strong>2. Nicht offenes Verfahren:</strong> nur ausgewählte Bieter.<br><strong>3. Verhandlungsverfahren:</strong> Verhandlungen mit Bietern (mit/ohne Bekanntmachung).<br><strong>4. Wettbewerblicher Dialog:</strong> komplexe Vorhaben, Lösungsoffenheit.<br><strong>5. Innovationspartnerschaft:</strong> F&E + Beschaffung in einem Verfahren.'},
  {id:'h34',cat:'FeuAK · Vergabe',q:'Was bedeutet MEAT und welche Kriterien fließen in die Zuschlagsentscheidung ein?',a:'<strong>MEAT = Most Economically Advantageous Tender</strong> (wirtschaftlich vorteilhaftestes Angebot).<br>Kriterien neben dem Preis: Qualität, technischer Wert, Funktionalität, Umwelteigenschaften, Betriebskosten, Kundendienst, Lieferdatum, Lebenszykluskosten.<br>Preis allein nur noch bei einfachen Lieferungen zulässig.'},
  {id:'h35',cat:'FeuAK · Vergabe',q:'Wie kann ein Bieter gegen Vergabeentscheidungen vorgehen?',a:'<strong>Rüge</strong> (§ 160 GWB): schriftlich, unverzüglich nach Kenntnis – Voraussetzung für Nachprüfung.<br><strong>Nachprüfantrag</strong> bei der Vergabekammer → Suspensiveffekt (kein Zuschlag).<br><strong>Sofortige Beschwerde</strong> beim OLG.<br>Unterhalb EU-Schwellenwerte: nur zivilrechtlicher Schadensersatz, kein Nachprüfverfahren.'},
  {id:'h39',cat:'FeuAK · PM',q:'Was ist ein Gantt-Diagramm und wie wird es eingesetzt?',a:'<strong>Balkendiagramm</strong> zur Projektplanung (Henry Gantt, 1910).<br>X-Achse: Zeit · Y-Achse: Vorgänge/Arbeitspakete. Balken zeigen Start, Ende und Dauer.<br><strong>Stärken:</strong> einfach verständlich, zeigt Parallelarbeiten und Zeitpuffer.<br><strong>Schwächen:</strong> Abhängigkeiten weniger gut als im Netzplan darstellbar; bei vielen Vorgängen unübersichtlich.'},
  {id:'h40',cat:'FeuAK · Bedarfsplanung',q:'Was ist die Schutzzielfestlegung und welche Rolle spielt die Hilfsfrist?',a:'<strong>Schutzziel:</strong> Mindeststandard, z.B. 8 Personen in 8–10 Minuten (je nach Bundesland).<br><strong>Hilfsfrist:</strong> Zeit von der Alarmierung bis zum Eintreffen der ersten Kräfte.<br><strong>Schutzzielerfüllungsgrad:</strong> Erreichung in mind. X % der Einsätze (typisch 80–90 %).<br>Basis für: Standortplanung, Fahrzeugausstattung, Personalstärke.'},
  {id:'h41',cat:'FeuAK · Bedarfsplanung',q:'Was umfasst die Personalbedarfsplanung im öffentlichen Dienst?',a:'<strong>Quantitativ:</strong> wie viele Stellen? (Aufgaben-, Zeitbedarfs-, Personalbestandsanalyse)<br><strong>Qualitativ:</strong> welche Qualifikationen werden benötigt?<br><strong>Zeitlich:</strong> kurzfristig (Urlaub/Krankheit), mittelfristig (Fluktuation), langfristig (Demografie).<br>Instrumente: Stellenplan, Nachfolgeplanung, Ausbildungsplanung, Beurteilungswesen.'},

  /* ── FeuAK – Altklausur-Karten h42–h60 ── */
  {id:'h42',cat:'FeuAK · BSC/QM',q:'Nennen Sie die 4 Perspektiven der Balanced Scorecard (BSC) und je ein FW-Beispiel.',a:'<strong>1. Finanzperspektive:</strong> Budgettreue, Kosten/Einsatz (Träger-Sicht).<br><strong>2. Kundenperspektive:</strong> Hilfsfristerfüllung, Bevölkerungszufriedenheit.<br><strong>3. Interne Prozessperspektive:</strong> Ausrückzeit, Fahrzeugverfügbarkeit, Ausbildungsstand.<br><strong>4. Lern-/Entwicklungsperspektive:</strong> Fortbildungsquote, Personalentwicklung, Innovation.<br>Alle 4 Perspektiven sind durch Ursache-Wirkungs-Ketten verknüpft.'},
  {id:'h44',cat:'FeuAK · Vergabe',q:'Welche EU-Schwellenwerte gelten für Kommunen ab 1.1.2026 und welche Fristen im offenen Verfahren?',a:'<strong>Ab 1.1.2026 (§106 GWB):</strong><br>· Liefer- & DL sonstige öAG (Kommunen): <strong>216.000 €</strong> (zuvor: 221.000 €)<br>· Sektorenauftraggeber / Verteidigung: 432.000 €<br>· Bauaufträge / Konzessionen: <strong>5.404.000 €</strong> (zuvor: 5.538.000 €)<br><strong>Auftragswert:</strong> Gesamtwert ohne USt.; bei Blockbeschaffung Gesamtwert aller Lose maßgeblich.<br><strong>Fristen offenes Verfahren:</strong> Standard 35 Tage (§ 15 VgV) · bei elektronischer Angebotsabgabe 30 Tage · Dringlichkeit 15 Tage.<br>Bekanntmachung: EU-Amtsblatt (TED).<br><em>Praxis FW: HLF 20 (700.000 €), DLK (900.000 €) liegen stets über dem Schwellenwert → EU-weites offenes Verfahren ist die Regel.</em>'},
  {id:'h46',cat:'FeuAK · VWL',q:'Erläutern Sie Minimal- und Maximalprinzip im taktischen Feuerwehrkontext.',a:'Beide sind Ausprägungen des <strong>ökonomischen Prinzips</strong> – taktische Effizienz bei Rettung und Brandbekämpfung.<br><strong>Minimalprinzip:</strong> Vorgegebenes Einsatzziel mit minimalem Mitteleinsatz erreichen.<br>&nbsp; → Beispiel: Brandbekämpfung mit geringstmöglichem Wasserschaden erzielen.<br><strong>Maximalprinzip:</strong> Vorhandene Kräfte (z. B. einen Löschtrupp) für maximalen Rettungserfolg einsetzen.<br>&nbsp; → Beispiel: Taktische Abwägung Ressourcensparsamkeit vs. maximale Wirkung an der Einsatzstelle.<br><strong>Ziel:</strong> Optimaler Schutz der Bevölkerung trotz limitierter Kapazitäten.'},
  {id:'h51',cat:'FeuAK · VWL',q:'Was ist „Swiftonomics"? Erläutern Sie Multiplikatoreffekt und Swiftflation.',a:'<strong>Swiftonomics:</strong> Phänomen der volkswirtschaftlichen Auswirkungen von Taylor Swifts Eras Tour – Lehrbeispiel für Ketteneffekte in der VWL.<br><strong>Multiplikatoreffekt:</strong> Konzertbesucher bringen Geld → fließt in Hotellerie, Transport, Einzelhandel → Ketteneffekt in der Gesamtwirtschaft.<br><strong>Swiftflation:</strong> Schlagartige Nachfrageexplosion → Preisanstieg bei Flügen und Hotels. In Schweden und Portugal kurzzeitig im nationalen Verbraucherpreisindex sichtbar.<br><strong>FW-Relevanz:</strong> Brandsicherheitswachen, Überstunden, gebundene Kräfte im Stadtgebiet, Opportunitätskosten.'},
  {id:'h52',cat:'FeuAK · Bedarfsplanung',q:'Welcher wesentliche Unterschied besteht zwischen den AGBF-Qualitätskriterien von 1998 und der Fortschreibung von 2015?',a:'<strong>Kernelemente gleichgeblieben:</strong> 10+6=16 Fu · 8+5=13 Min.<br><br><strong>Änderungen 2015:</strong><br>① Wissenschaftl.-mediz. Herleitung (Zeitkette/Flashover) entfallen.<br>② Einsatzmittel zu Eintreffzeit, Funktionsstärke, Erreichungsgrad ergänzt.<br>③ Erreichungsgrad <strong>95 % → 90 %</strong> (prakt.-math. Gründe).<br>④ Szenario: „Mehrzahl von Personen zu retten“ (explizit).<br>⑤ Formulierung: „Vernachlässigung Eigensicherung“ → „Zurückstellung Brandbekämpfung“.<br>⑥ Mind. 50 bemessungsrelevante Einsätze für Erreichungsgrad-Auswertung.'},
  {id:'h53',cat:'FeuAK · Bedarfsplanung',q:'Aus welchen 4 Elementen setzt sich das Planungsziel der AGBF-Qualitätskriterien zusammen?',a:'<strong>1. Standardschadensereignis:</strong> Kritischer Wohnungsbrand im Obergeschoss (Referenzszenario).<br><strong>2. Hilfsfrist:</strong> 1,5 Min. Gesprächsführung + 8 Min. Ausrücke-/Anfahrtszeit = 9,5 Min. gesamt.<br><strong>3. Funktionsstärke:</strong> 1. TE: 10 Kräfte nach 8 Min. / 2. TE: weitere 6 Kräfte nach 13 Min. → gesamt 16 Kräfte.<br><strong>4. Erreichungsgrad:</strong> 90 % (AGBF 2015) – Anteil der Einsätze, bei dem Hilfsfrist UND Funktionsstärke eingehalten werden.'},
  {id:'h54',cat:'FeuAK · VWL',q:'Was ist Knappheit als volkswirtschaftliches Grundproblem – und wie äußert sich das bei der Feuerwehr?',a:'<strong>Grundproblem:</strong> Ressourcen (Personal, Material, Zeit) sind immer limitiert – der Bedarf an Sicherheit ist theoretisch unbegrenzt.<br><strong>Kernkonflikt:</strong> Knappe Mittel vs. unvorhersehbar große Schadenslagen.<br><strong>FW-Konsequenz:</strong> Wirtschaftliches Handeln ist zwingend – die Feuerwehr muss mit dem Vorhandenen den größtmöglichen Schutz erzielen.<br><strong>Priorisierung:</strong> Knappheit erzwingt im Einsatz und im Verband harte Entscheidungen (Ressourcenallokation, Nachrangigkeit).'},
  {id:'h55',cat:'FeuAK · BSC/QM',q:'Was sind die 3 Säulen des Neuen Steuerungsmodells (NSM)?',a:'<strong>1. Dezentralisierung:</strong> Ressourcenverantwortung dorthin, wo Leistung erbracht wird (Fachbereich trägt eigene Kosten).<br><strong>2. Outputorientierung:</strong> Steuerung nicht nach Inputbudgets, sondern nach definierten Produkten und Leistungen mit Qualitätsstandards.<br><strong>3. Wettbewerb / Benchmarking:</strong> Leistungsvergleich intern und mit anderen Kommunen; Kontraktmanagement (Leistungsvereinbarungen).<br>Ziel: mehr Effizienz, Transparenz und Qualität im öffentlichen Sektor.'},
  {id:'h56',cat:'FeuAK · Haushalt',q:'Was bedeutet das Fremdmittelprinzip im kommunalen Haushaltswesen?',a:'Das Fremdmittelprinzip (Subsidiaritätsprinzip der Finanzierung) besagt: Kommunen sollen Investitionen vorrangig aus <strong>Eigenmitteln</strong> finanzieren, bevor sie Kredite aufnehmen (Fremdmittel).<br>Reihenfolge: Zuschüsse → Eigenmittel → Rücklagen → Kreditaufnahme.<br>Zweck: Haushaltsdisziplin, Generationengerechtigkeit, Begrenzung der Verschuldung.<br>Vgl. auch den Grundsatz der <strong>Sparsamkeit und Wirtschaftlichkeit</strong> (§ 75 GO NRW).'},
  {id:'h58',cat:'FeuAK · Bedarfsplanung',q:'Welche zwei IST-Analysen werden in der Rettungsdienstbedarfsplanung eingesetzt?',a:'<strong>1. Analyse der Hilfsfristerreichung:</strong> SOLL-IST-Vergleich des Erreichungsgrades; Auswertung <em>gesamt</em> vs. <em>ab zuständiger Wache</em> → Unterscheidung Ressourcenverfügbarkeits- vs. Standort-/Erreichbarkeitsproblem.<br><strong>2. Problemfeldanalyse:</strong> Quantifizierung der 3 Verursachungsbeiträge der Nicht-Erreichung: Standortstruktur/Verkehr · Ausrückzeit · Ressourcenverfügbarkeit → zielgerichtete, priorisierte Maßnahmenableitung. Ausrückzeit-Optimierungen schneller umsetzbar als Standortveränderungen.'},
  {id:'h59',cat:'FeuAK · Bedarfsplanung',q:'Was zeigt das KTW-Frequenzkurven-Diagramm und wie wird es genutzt?',a:'<strong>X-Achse:</strong> Tageszeit (00:00–24:00 Uhr, stündlich). <strong>Y-Achse:</strong> Anzahl rechnerisch gleichzeitig benötigter KTW.<br><strong>Kurvenform:</strong> Nachttal (0–6 Uhr) → Morgenanstieg (6–9 Uhr) → Tagespeak (9–16 Uhr) → Abendabfall (16–20 Uhr).<br><strong>Formel:</strong> Einsatzhäufigkeit × Einsatzdauer / 60 = benötigte KTW-Anzahl pro Stunde.<br><strong>Nutzung:</strong> zeitabhängiger Dienstplan (Schichtbesetzung); KTW frequenzabhängig (planbare Transporte) vs. RTW risikoabhängig (Erlang-Formel).'},

  /* ── FeuAK – Altklausur-Karten h61–h69 ── */
  {id:'h61',cat:'FeuAK · Haushalt',q:'Was sind die wesentlichen Besonderheiten des kommunalen Haushaltswesens im Vergleich zur Privatwirtschaft?',a:'<strong>Kein Gewinnziel:</strong> öffentlicher Auftrag der Daseinsvorsorge, nicht Gewinnmaximierung.<br><strong>Demokratische Legitimation:</strong> Haushalt als Satzung beschlossen (Gemeindeordnung).<br><strong>6 Haushaltsgrundsätze:</strong> Vollständigkeit · Einheit · Öffentlichkeit · Jährlichkeit · Sparsamkeit/Wirtschaftlichkeit · Vorherigkeit.<br><strong>Haushaltskreislauf:</strong> Aufstellung → Beratung → Beschluss → Vollzug → Jahresabschluss → Prüfung.<br><strong>Doppik-Struktur:</strong> Ergebnishaushalt (Ressourcenverbrauch, Abschreibungen, Pensionsrückstellungen) + Finanzhaushalt (Zahlungsströme).<br><strong>Haushaltssicherungskonzept (HSK)</strong> bei strukturellem Defizit.'},
  {id:'h62',cat:'FeuAK · BSC/QM',q:'Nennen Sie 5 Grundsätze des Qualitätsmanagements (QM) nach ISO 9001:2015.',a:'ISO 9001:2015 kennt 7 QM-Grundsätze; die 5 prüfungsrelevanten:<br><strong>1. Kundenorientierung:</strong> Bedürfnisse der Bevölkerung/Kunden erkennen und übertreffen.<br><strong>2. Führung:</strong> Führungskräfte schaffen gemeinsame Ziele, Ausrichtung und Engagement.<br><strong>3. Einbeziehung der Mitarbeiter:</strong> Mitarbeiter auf allen Ebenen befähigen und einbinden.<br><strong>4. Prozessorientierung:</strong> Aktivitäten als zusammenhängende Prozesse verstehen und steuern.<br><strong>5. Kontinuierliche Verbesserung (KVP):</strong> Ständige Verbesserung als dauerhaftes Organisationsziel.'},
  {id:'h63',cat:'FeuAK · BSC/QM',q:'Was sind Produkte, Kunden und Qualitätsmerkmale der Feuerwehr im Sinne des QM?',a:'<strong>Produkte:</strong> Abwehrender Brandschutz · Vorbeugender Brandschutz · Technische Hilfeleistung · Rettungsdienst · Aus- und Fortbildung.<br><strong>Kunden:</strong> Bevölkerung · Betriebe und Institutionen · Kommunalpolitik · andere Behörden · Versicherungen.<br><strong>Qualitätsmerkmale:</strong> Hilfsfristerfüllungsquote (90 % AGBF) · Funktionsstärke (10/16 EK) · Fachgerechtigkeit des Einsatzes · Schadensminimierung · Kundenzufriedenheit.'},
  {id:'h64',cat:'FeuAK · BSC/QM',q:'Welche Kennzahlen eignen sich für die BSC-Steuerung einer Berufsfeuerwehr?',a:'<strong>Finanzen:</strong> Kosten/Einsatz · Kostendeckungsgrad · Investitionsquote.<br><strong>Kunden:</strong> Hilfsfristerfüllungsquote (%) · Beschwerden · Zufriedenheitsbefragung.<br><strong>Prozesse:</strong> Ausrückzeit (Sek.) · Eintreffzeit (Min.) · Fahrzeugverfügbarkeit (%) · Einsatzdauer · Alarmierungsquote.<br><strong>Lernen/Entwicklung:</strong> Fortbildungsstunden/MA · AS-Geräteträgerquote (%) · Krankheitsquote (%) · Personalfluktuation · Beförderungsquote.'},
  {id:'h65',cat:'FeuAK · BSC/QM',q:'Was umfasst die strategische Personalplanung und welche Instrumente stehen zur Verfügung?',a:'Langfristige (5–10 Jahre) quantitative und qualitative Sicherung des Personalbedarfs.<br><strong>Bestandsanalyse:</strong> Altersstruktur · Qualifikationsmatrix · Laufbahnentwicklung.<br><strong>Bedarfsanalyse:</strong> Schutzziel, Risikoentwicklung, gesetzliche Mindestbesetzung.<br><strong>Lückenanalyse:</strong> Differenz Ist vs. Soll → Handlungsbedarf.<br><strong>Maßnahmen:</strong> Einstellungsplanung · Ausbildung · Beförderung · Versetzung · Ruhestandsplanung.<br><strong>Instrumente:</strong> Stellenplan · Personalentwicklungskonzept · Nachfolgeplanung · Mentoring · Potenzialbeurteilung.'},
  {id:'h66',cat:'FeuAK · Bedarfsplanung',q:'Welche Beschaffungsalternativen (Make-or-Buy) gibt es für ein HLF 20 und welche Bewertungskriterien sind relevant?',a:'<strong>Alternativen:</strong><br>1. <strong>Kauf:</strong> hohe Anschaffungskosten, volle Verfügbarkeit, Nutzungsdauer 15–25 J.<br>2. <strong>Leasing:</strong> niedrige Kapitalbelastung, Ratenzahlung, Rückgabe oder Kauf am Ende.<br>3. <strong>Interkommunale Zusammenarbeit:</strong> gemeinsame Beschaffung/Nutzung → Skaleneffekte.<br>4. <strong>Nutzungsgemeinschaft/Poolmodell:</strong> Kostenaufteilung nach Nutzung.<br><strong>Bewertungskriterien:</strong> Anschaffungskosten · Betriebskosten · Lebenszykluskosten (LCC) · Verfügbarkeit · Normkonformität (DIN EN 1846) · strategische Abhängigkeit · Refinanzierungszeitraum.'},
  {id:'h67',cat:'FeuAK · VWL',q:'Welche 5 Rollen hat der öffentliche Dienst im Wirtschaftskreislauf?',a:'<strong>1. Konsument- &amp; Steuerkraft:</strong> Mitarbeiter zahlen Steuern und kurbeln den privaten Konsum an.<br><strong>2. Staatskonsument:</strong> Beschafft Güter und Dienstleistungen direkt von der Privatwirtschaft (Fahrzeuge, Ausrüstung).<br><strong>3. Infrastruktur-Garant:</strong> Sichert die rechtlichen und physischen Grundlagen für wirtschaftliches Handeln.<br><strong>4. Ressourcen-Verteiler:</strong> Transformiert Steuergelder in öffentliche Güter und Dienstleistungen.<br><strong>5. Stabilitätsanker:</strong> Wirkt durch stetige Beschäftigung und Investitionen antizyklisch in Krisenzeiten.'},
  {id:'h68',cat:'FeuAK · VWL',q:'Warum ist die Feuerwehr ein Produktionsfaktor? Erläutern Sie den Begriff der indirekten Wertschöpfung.',a:'<strong>Produktionsfaktor:</strong> Sicherheit ist kein Luxus, sondern eine produktive Grundvoraussetzung – ohne verlässlichen Brandschutz kollabieren Lieferketten und Produktionsprozesse bei Unfällen.<br><strong>Indirekte Wertschöpfung:</strong> Die Feuerwehr produziert keine Güter, verhindert aber deren Zerstörung.<br><strong>Faktor Zeit:</strong> Schnelle Eingreifzeiten begrenzen Schäden auf ein Minimum.<br><strong>Betriebserhalt:</strong> Gelöschtes Firmengebäude = vermiedene Produktionsausfälle = gesicherte lokale Arbeitsplätze und Steuereinnahmen.<br><strong>Versicherungswirkung:</strong> Brandschutzauflagen senken Schadensrisiko → niedrigere Prämien für Unternehmen.'},

  /* ── FeuAK · VWL – Neue Karten Modul 3.3 h70–h77 ── */
  {id:'h70',cat:'FeuAK · VWL',q:'Was ist eine positive Externalität? Erläutern Sie das Beispiel Brandschutz und Nachbarhäuser.',a:'<strong>Externalität:</strong> Auswirkungen einer wirtschaftlichen Tätigkeit, die nicht im Preis enthalten sind.<br><strong>Positive Externalität durch Brandschutz:</strong> Ein gelöschtes Feuer schützt automatisch die Nachbarhäuser vor dem Übergreifen (Riegelstellung).<br><strong>Marktversagen:</strong> Der einzelne Hauseigentümer zahlt nur für seinen eigenen Schutz – der Nutzen für die Allgemeinheit ist aber viel größer. Freiwillig würde er diesen gesellschaftlichen Mehrwert nicht finanzieren.<br><strong>Rechtfertigung:</strong> Der staatliche Brandschutz sichert diese positiven Auswirkungen auf die Allgemeinheit ab.'},
  {id:'h71',cat:'FeuAK · VWL',q:'Was ist Ressourcenmanagement und welche 4 Kernelemente hat es?',a:'<strong>Ressourcenmanagement:</strong> Effiziente Steuerung von Personal, Sachmitteln und Finanzen zur Sicherung der Aufgabenerfüllung.<br><strong>1. Allokationsfunktion:</strong> Gezielter Einsatz von Ressourcen für Kernaufgaben.<br><strong>2. Nachhaltigkeit:</strong> Langfristige Substanzerhaltung statt kurzfristiger Budgeterschöpfung.<br><strong>3. Risiko-Vorsorge:</strong> Strategische Pufferbildung sichert Handlungsfähigkeit in Krisenzeiten.<br><strong>4. Steuerungstool:</strong> Verknüpft Haushaltsmittel mit messbaren Leistungszielen (Output-Orientierung).'},
  {id:'h72',cat:'FeuAK · VWL',q:'Was unterscheidet Effizienz von Effektivität im Haushaltsrecht? Nennen Sie das Sparsamkeitsgebot.',a:'<strong>Effizienz:</strong> Die Dinge <em>richtig</em> tun – optimales Verhältnis von eingesetzten Mitteln (Input) zu Ergebnis (Output).<br><strong>Effektivität:</strong> Die <em>richtigen</em> Dinge tun – Zielerreichung unabhängig vom Mitteleinsatz.<br><strong>Sparsamkeitsgebot:</strong> Gesetzliche Pflicht (§7 BHO/LHO), staatliche Aufgaben mit geringstmöglichem Finanzaufwand zu erfüllen.<br><strong>Nutzenmaximierung:</strong> Größtmöglicher gesellschaftlicher Ertrag aus Steuergeldern ist das übergeordnete Ziel.'},
  {id:'h73',cat:'FeuAK · VWL',q:'Was umfasst Personalökonomie bei der Feuerwehr? Nennen Sie 3 Spannungsfelder.',a:'<strong>Personalökonomie:</strong> Effiziente Steuerung und Bereitstellung der knappen Ressource Mensch.<br><strong>1. Vorhaltung vs. Auslastung:</strong> Teure Abwägung zwischen ständiger Einsatzbereitschaft und tatsächlichen Einsatzzahlen – Bereitschaftspersonal kostet auch ohne Einsatz.<br><strong>2. Ehrenamt vs. Hauptamt:</strong> Freiwillige Strukturen sparen enorme Haushaltsmittel, belasten aber Arbeitgeber durch kurzfristige Abwesenheiten.<br><strong>3. Taktischer Personaleinsatz:</strong> Optimale Besetzung (z. B. gesetzliche Mindeststärke), um maximalen Rettungserfolg zu garantieren.'},
  {id:'h74',cat:'FeuAK · VWL',q:'Was sind Skaleneffekte (Economies of Scale)? Nennen Sie Vor- und Nachteile für die Feuerwehr.',a:'<strong>Skaleneffekte:</strong> Kostenvorteile durch größere Mengen oder zentrale Strukturen.<br><strong>Vorteile:</strong><br>· Gemeinsamer Einkauf von Fahrzeugen oder Kleidung → niedrigerer Stückpreis<br>· Gemeinsame Leitstelle für mehrere Kreise → spart Betriebs- und Technikkosten<br><strong>Nachteile:</strong><br>· Möglicher Verlust an lokaler Flexibilität und schneller Reaktionsfähigkeit<br>· Längere Entscheidungswege zwischen Kooperationspartnern<br>· Hoher Abstimmungsaufwand bei zentralisierten Strukturen'},
  {id:'h75',cat:'FeuAK · VWL',q:'Was ist TCO (Total Cost of Ownership) und warum ist es für die Fahrzeugbeschaffung entscheidend?',a:'<strong>TCO = Total Cost of Ownership / Investitionsrechnung:</strong> Der Anschaffungspreis ist nur ein Teil der Wahrheit.<br><strong>Gesamte Lebenszykluskosten</strong> umfassen: Anschaffung + Wartung + Treibstoff + TÜV + Reparaturen + Aussonderung.<br><strong>Praxis:</strong> Folgekosten übertreffen oft die Kaufsumme. Teurere, robustere Fahrzeuge sind langfristig wirtschaftlicher.<br><strong>Nutzen:</strong> Schützt Kommunen vor unvorhersehbaren finanziellen Altlasten; ermöglicht seriöse Budgetplanung über mehrere Legislaturperioden.'},
  {id:'h76',cat:'FeuAK · VWL',q:'Was ist eine Kosten-Nutzen-Analyse (KNA) und welche gesetzliche Grundlage schreibt sie vor?',a:'<strong>KNA:</strong> Vergleicht alle anfallenden Kosten und erwarteten Nutzen eines Projekts in Geldwerten.<br><strong>Gesetzliche Grundlage:</strong> Haushaltsgrundsätzegesetz (HGrG) – bei finanzwirksamen Maßnahmen vorgeschrieben.<br><strong>Entscheidungshilfe:</strong> Objektiviert die Auswahl zwischen Investitionsalternativen.<br><strong>Makro-Blick:</strong> Erfasst neben direkten Ausgaben auch gesellschaftliche Wohlfahrtseffekte.<br><strong>Priorisierung:</strong> Verhindert Fehlinvestitionen durch Nachweis des langfristigen Mehrwerts.<br><strong>Beispiel:</strong> Ein 500.000 €-Fahrzeug, das einen Millionenbrand verhindert, ist volkswirtschaftlich rentabel.'},
  {id:'h77',cat:'FeuAK · VWL',q:'Was sind Grenzkosten der Sicherheit? Erläutern Sie das Ertragsgesetz und die Effizienzgrenze.',a:'<strong>Grenzkosten der Sicherheit:</strong> Abwägung zwischen Kosten zusätzlicher Ausrüstung/Maßnahmen und dem tatsächlich verhinderten Schaden.<br><strong>Ertragsgesetz:</strong> Ab einem bestimmten Punkt bringt mehr Budget kaum noch zusätzliche Sicherheit (z. B. das fünfte Spezialfahrzeug).<br><strong>Risikomanagement:</strong> Rationale Budgetierung statt dem Versuch, jedes theoretische Restrisiko extrem teuer zu eliminieren.<br><strong>Effizienzgrenze:</strong> Ab wann kostet zusätzliche Sicherheit mehr, als sie an potenziellem Schaden verhindert? Dort liegt das wirtschaftliche Optimum.<br><strong>Statistischer Wert:</strong> VWL nutzt den „statistischen Wert eines Menschenlebens" für Budgetentscheidungen – stößt aber an ethische Grenzen.'},

  /* ── FeuAK · PM – Neue Karten v2.19 h78–h94 (Reihenfolge: Abschnitt 01→02→03→04→05→10) ── */
  {id:'h78',cat:'FeuAK · PM',q:'Was ist das Wohlfahrtsdreieck und welche Rolle nimmt die Feuerwehr darin ein?',a:'Das Wohlfahrtsdreieck beschreibt drei gesellschaftliche Sektoren, zwischen denen Dienstleistungen der Daseinsvorsorge angesiedelt sind:<br><br><strong>Staat (Öffentlicher Sektor):</strong> Gesetzlicher Rahmen, Daseinsvorsorge, hoheitliche Aufgaben – die Feuerwehr ist originär hier angesiedelt.<br><strong>Markt (Privater Sektor):</strong> Gewinnorientierte Anbieter; durch New Public Management zunehmend auch im Bereich der Daseinsvorsorge präsent.<br><strong>Dritter Sektor (Gesellschaft):</strong> Non-Profit-Organisationen, Hilfsorganisationen, Freiwillige – Grenzen zu Staat und Markt sind fließend.<br><br><strong>Feuerwehr:</strong> Operiert an den Schnittstellen aller drei Bereiche. Seit den 1990er Jahren sind Grenzen zunehmend fließend.'},
  {id:'h79',cat:'FeuAK · PM',q:'Was ist Prosumption und welche 4 Dienstleistungstypen werden unterschieden?',a:'<strong>Prosumption:</strong> Kunstwort aus „Produzent" + „Konsument": Leistungserstellung erfolgt nur unter aktiver Mitwirkung des „Kunden". Ein unkooperativer Konsument kann den Leistungsprozess erheblich stören.<br><br><strong>4 Dienstleistungstypen:</strong><br><strong>Typ I – Person → Person:</strong> Immaterielle Leistung unter Kundenbeteiligung (Unternehmensberatung, Gesundheit, Erziehung).<br><strong>Typ II – Person → Objekt:</strong> Materielle Leistungsergebnisse unter Kundenbeteiligung → <em>wahrscheinliche Einordnung der Feuerwehr</em>.<br><strong>Typ III – Objekt → Objekt:</strong> Materielle Leistung, weitgehend autonom (Wäscherei, vorproduzierte Teile).<br><strong>Typ IV – Objekt → Person:</strong> Immaterielle Leistung, weitgehend autonom (Datenbankdienste, ÖPNV).<br><br><strong>Besonderheit FW:</strong> Situativ kann auch Typ I zutreffen – strategisches Management bei der Feuerwehr ist ein Sonderfall.'},
  {id:'h80',cat:'FeuAK · PM',q:'Welche 3 Wettbewerbsstrategien (Strategietypen) unterscheidet Porter und wie gelten sie für die Feuerwehr?',a:'<strong>1. Kostenführerstrategie:</strong> Ziel: Preisgünstigster Wettbewerber sein → Kostenvorteile durch Standardisierung und Skalierung.<br><strong>2. Differenzierungsstrategie:</strong> Ziel: Abhebung von Konkurrenzprodukten durch besondere Qualität oder Leistung.<br><strong>3. Nischenstrategie:</strong> Ziel: Ausrichtung auf ein eng bestimmtes Käufersegment.<br><br><strong>FW-Übertragung:</strong> Da die Feuerwehr ohne Markt agiert (kein Wettbewerb), sind Porters Strategietypen nur eingeschränkt anwendbar. Sie helfen jedoch, strategische <em>Effizienz</em>- und <em>Qualitätsziele</em> zu beschreiben.'},
  {id:'h81',cat:'FeuAK · PM',q:'Was ist die Strategiedefinition nach Gälweiler und welche Besonderheit gilt bei der Feuerwehr?',a:'<strong>Gälweiler:</strong> Organisationen handeln dann <strong>strategisch</strong>, wenn sie Erfolgspotenziale sichern oder aufbauen.<br><br><strong>Besonderheiten der Feuerwehr (ohne Markt):</strong><br>· <strong>Kein Wettbewerb:</strong> Kein Konkurrenzdruck – der Leistungsauftrag ist gesetzlich fixiert.<br>· <strong>Hohe Fremdsteuerung:</strong> Politische und gesellschaftliche Steuerung hinsichtlich Ausstattung und Erwartungshaltung.<br>· <strong>Strategieziel:</strong> Effizienzsteigerung, Qualitätsverbesserung und Zukunftssicherung statt Gewinnmaximierung.'},
  {id:'h82',cat:'FeuAK · PM',q:'Aus welchen 5 Ebenen besteht die Strategiehierarchie?',a:'<strong>1. Vision</strong> – Zukunftsbild: Wohin wollen wir? (normative Orientierung)<br><strong>2. Mission</strong> – Auftrag und Zweck der Organisation (warum existieren wir?)<br><strong>3. Strategie</strong> – langfristiger Handlungsplan zur Erreichung der Vision<br><strong>4. Operationalisierung</strong> – konkrete Maßnahmen, Projekte und Ziele<br><strong>5. Performance Measurements</strong> – Kennzahlen zur Messung der Zielerreichung<br><br><strong>Wesen des Strat. Mgmts.:</strong> Analyse (SWOT) → Prognose (VUKA/BANI) → Entscheidung.'},
  {id:'h83',cat:'FeuAK · PM',q:'Nennen Sie die 8 strategischen Handlungsfelder der Feuerwehr.',a:'<strong>1. Personal</strong> – Gewinnung, Bindung, Entwicklung; Nachwuchssicherung.<br><strong>2. Technologie</strong> – Digitalisierung, KI in der Leitstelle, smarte Sensorik, Telemedizin.<br><strong>3. Organisation</strong> – Strukturen, Prozesse, Schichtmodelle, Aufbauorganisation.<br><strong>4. Finanzierung</strong> – Haushaltssicherung, Umgang mit Haushaltsknappheit und Investitionsstau.<br><strong>5. Kommunikation</strong> – Interne/externe Kommunikation, Öffentlichkeitsarbeit, Stakeholder-Kommunikation.<br><strong>6. Kooperation</strong> – Zusammenarbeit mit Polizei, Rettungsdienst, Katastrophenschutz.<br><strong>7. Risikomanagement</strong> – Prospektive Risikoanalyse, Krisenmanagement, Einsatzbereitschaft.<br><strong>8. Nachhaltigkeit</strong> – ökologische, soziale und wirtschaftliche Nachhaltigkeit.'},
  {id:'h84',cat:'FeuAK · PM',q:'Was sind Nicht-Entscheidungen und welche 3 Typen gibt es?',a:'<strong>Nicht-Entscheidungen</strong> sind Entscheidungsprozesse, bei denen keine rationalen Abwägungen stattfinden. Sie sind als Führungsfehler zu vermeiden.<br><br><strong>1. Gefühlsgeleitet:</strong> Entscheidung basiert auf Emotionen statt auf Analyse.<br><strong>2. Traditionell:</strong> „Das haben wir immer so gemacht" – Tradition ersetzt rationale Prüfung der Alternativen.<br><strong>3. Routiniert:</strong> Automatisiertes Handeln ohne Reflexion – Routine verdrängt die bewusste Entscheidung.'},
  {id:'h85',cat:'FeuAK · PM',q:'Welche 3 Rationalitäten der Entscheidung werden in der Entscheidungstheorie unterschieden? Was ist Ambiguitätstoleranz?',a:'<strong>1. Formale Rationalität:</strong> Entscheidung nach klar definierten Regeln, Verfahren und Zuständigkeiten (Legitimation durch Verfahren).<br><strong>2. Ökonomische Rationalität:</strong> Entscheidung nach Kosten-Nutzen-Kalkül und Wirtschaftlichkeitsprinzip (Minimal-/Maximalprinzip).<br><strong>3. Politische Rationalität:</strong> Entscheidung nach Interessenlagen, Machtstrukturen und Kompromissbereitschaft.<br><br><strong>Ambiguitätstoleranz:</strong> Da keine Rationalität zu 100 % erfüllt werden kann, entstehen bei jeder Entscheidung Defizite. Entscheidungsträger müssen Entscheidungen treffen und gegenüber Dritten vertreten, die aus der Perspektive einzelner Rationalitäten bessere Alternativen hätten. Dafür benötigen sie eine ausgeprägte <strong>Ambiguitätstoleranz</strong> – die Fähigkeit, Mehrdeutigkeit und Unentscheidbarkeit auszuhalten, ohne in eine Nicht-Entscheidung zu verfallen.'},
  {id:'h86',cat:'FeuAK · PM',q:'Was ist die Nutzwertanalyse und wie funktioniert sie?',a:'Methode zur Bewertung von Alternativen anhand mehrerer <strong>gewichteter Kriterien</strong>.<br>Jede Alternative erhält einen <strong>Nutzwert</strong> als Summe aller gewichteten Einzelbewertungen.<br><br><strong>Ohne Ausschlusskriterium:</strong> Alle Alternativen werden bewertet – die Alternative mit dem höchsten Nutzwert gewinnt.<br><strong>Mit Ausschlusskriterium:</strong> Alternativen, die ein Mindestkriterium nicht erfüllen, werden vorab ausgeschieden; danach Nutzwertanalyse der verbleibenden Optionen.<br><br><strong>Vorteil:</strong> Macht komplexe Entscheidungen transparent und vergleichbar.'},
  {id:'h87',cat:'FeuAK · PM',q:'Aus welchen 3 Bestandteilen setzt sich eine strategische Vision zusammen?',a:'<strong>1. Hauptziel:</strong> Was wollen wir als Organisation erreichen? (inhaltliche Zielrichtung)<br><strong>2. Einschränkung:</strong> Welche Grenzen oder Rahmenbedingungen müssen eingehalten werden?<br><strong>3. Zeitangabe:</strong> Bis wann soll das Ziel erreicht werden? (zeitlicher Horizont)<br><br><strong>Normative Problematik:</strong> Eine Vision ist immer eine <em>normative Entscheidung</em>, die Werthaltungen und Prioritäten widerspiegelt – und daher angreifbar ist.'},
  {id:'h88',cat:'FeuAK · PM',q:'Welche 6 Entscheidungsarten der Unternehmensleitung werden unterschieden?',a:'<strong>1. Grundsatzentscheidung:</strong> Existenz, Ziele, Strategien, Führungsstil (z. B. Gründung, Fusion, kooperativer Führungsstil).<br><strong>2. Führungsprozessentscheidung:</strong> Planung, Realisierung, Kontrolle (z. B. Strategische Planung, Akquise, Strategische Kontrolle).<br><strong>3. Organisationsentscheidung:</strong> Leitungsorganisation, Organisationsform (z. B. Stab-Linien-Organisation).<br><strong>4. Bereichsentscheidung:</strong> Finanz-, Personal-, Marketingpolitik (z. B. Investitionsentscheidungen).<br><strong>5. Abschlussentscheidung:</strong> Jahresabschluss, Berichterstattung (z. B. Lagebericht, Bilanzpolitik).<br><strong>6. Sonstige Entscheidung:</strong> Vertretung, Datenschutz, Mitarbeiterentwicklung (z. B. Repräsentation nach außen).'},
  {id:'h89',cat:'FeuAK · PM',q:'Welche 10 Führungsrollen unterscheidet Mintzberg in 3 Rollenbündeln?',a:'<strong>Interpersonale Rollen:</strong><br>· <strong>Galionsfigur</strong> – repräsentative Funktion nach außen<br>· <strong>Anführer</strong> – Motivation und Führung der Mitarbeiter<br>· <strong>Vernetzer</strong> – Aufbau und Pflege externer Kontakte<br><br><strong>Informationsbezogene Rollen:</strong><br>· <strong>Beobachter</strong> – Sammlung und Auswertung von Informationen<br>· <strong>Verteiler</strong> – Weitergabe intern<br>· <strong>Sprecher</strong> – Weitergabe nach außen<br><br><strong>Entscheidungsbezogene Rollen:</strong><br>· <strong>Unternehmer</strong> – Initiierung von Veränderungen<br>· <strong>Störungsregulator</strong> – Reaktion auf unvorhergesehene Probleme<br>· <strong>Ressourcenzuteiler</strong> – Vergabe von Personal, Budget und Zeit<br>· <strong>Verhandlungsführer</strong> – Verhandlungen intern und extern'},
  {id:'h90',cat:'FeuAK · PM',q:'Welche 2 Führungseigenschaften beschreibt Clausewitz und was bedeuten sie?',a:'<strong>Coup d\'œil</strong> (Blick für das Wesentliche): Die Fähigkeit, in unübersichtlichen Situationen schnell und treffsicher das Entscheidende zu erkennen.<br><br><strong>Entschlossenheit</strong> (Umsetzungsstärke): Die Fähigkeit, trotz Unsicherheit und unvollständiger Information eine Entscheidung zu treffen und konsequent umzusetzen.<br><br><strong>FW-Relevanz:</strong> Beide Eigenschaften sind im Einsatz unverzichtbar – Lagebeurteilung unter Druck + sofortiges Handeln ohne Vollständigkeit aller Informationen.'},
  {id:'h91',cat:'FeuAK · PM',q:'Was beschreibt das VUKA-Modell und wie überträgt es sich auf die Feuerwehr?',a:'<strong>V</strong>olatilität – häufige, unerwartete Veränderungen im Umfeld.<br><strong>U</strong>nsicherheit – mangelnde Vorhersehbarkeit künftiger Entwicklungen.<br><strong>K</strong>omplexität – viele vernetzte Einflussfaktoren.<br><strong>A</strong>mbiguität – Unklarheit über Ursache-Wirkungs-Zusammenhänge.<br><br><strong>FW-Transfer:</strong><br>· Volatilität → neues Einsatzspektrum (Klimaereignisse, hybride Bedrohungen)<br>· Unsicherheit → demografischer Wandel, Fachkräftemangel<br>· Komplexität → Vernetzung mit Polizei, Rettungsdienst, Katastrophenschutz<br>· Ambiguität → unklare Verantwortlichkeiten bei Cyberangriffen, Pandemien'},
  {id:'h92',cat:'FeuAK · PM',q:'Was ist das BANI-Modell (Cascio 2020) und was unterscheidet es von VUKA?',a:'<strong>B</strong>rittle (spröde) – scheinbar stabile Systeme brechen plötzlich unter Druck zusammen.<br><strong>A</strong>nxious (ängstlich) – Angst vor Fehlentscheidungen hemmt das Handeln.<br><strong>N</strong>on-linear – kleine Ursachen führen zu unverhältnismäßig großen Wirkungen.<br><strong>I</strong>ncomprehensible – Komplexität übersteigt individuelle Verständnisfähigkeit.<br><br><strong>Unterschied:</strong> VUKA beschreibt die <em>Eigenschaften des Umfeldes</em>; BANI beschreibt die <em>menschliche Reaktion</em> darauf. Kombiniert (VUKABANI) bieten beide Modelle eine umfassende Grundlage für strategische Prognosearbeit.'},
  {id:'h93',cat:'FeuAK · PM',q:'Wie läuft die prospektive Risikoanalyse in 4 Schritten ab?',a:'<strong>Grundlage:</strong> Wertkette einer Feuerwache – Nutzenversprechen, Wertschöpfungskette, Ertragsmechanik.<br><br><strong>1. Suche der Indikatoren:</strong> Entscheidende Erfolgsfaktoren intern (Primäraktivitäten, Schlüsselressourcen) und extern (Personal-, Kapital-, Beschaffungs-, Absatzmarkt).<br><strong>2. Benotung:</strong> Note 1 (sehr gut) bis 5 (mangelhaft); externe Indikatoren: auch künftige Entwicklungen einbeziehen.<br><strong>3. Gewichtung:</strong> 30 Punkte auf alle Indikatoren verteilen. Je wichtiger, desto mehr Punkte; unabhängig von der Note.<br><strong>4. Ergebnisermittlung:</strong> Note × Gewichtung = Ergebnis. ≥ 11 Punkte: sehr bedenklich → Fragen an Geschäftsleitung. &lt; 4 Punkte: relativ unbedenklich.'},
  {id:'h94',cat:'FeuAK · PM',q:'Was sind exogene und endogene Treiber der Veränderung in der prospektiven Risikoanalyse?',a:'<strong>Exogene Treiber (von außen):</strong><br>· Demografischer Wandel – mehr Pflegebedarf, Fachkräftemangel<br>· Technologischer Fortschritt – Digitalisierung, KI, Big Data<br>· Klimawandel – Extremwetter, Hochwasser, Waldbrände<br>· Globalisierung – Lieferketten, Pandemien<br>· Sicherheitslage – Terrorismus, Cyberangriffe, hybride Bedrohungen<br><br><strong>Endogene Treiber (systemintern):</strong><br>· Finanzielle Rahmenbedingungen – Haushaltsknappheit, Investitionsstau<br>· Gesellschaftlicher Wertewandel – Transparenz, Partizipation<br>· Fachkräftemangel – Nachwuchsgewinnung, Konkurrenz Privatwirtschaft<br>· Kooperationsdruck – intersektorale Zusammenarbeit<br>· Politisch-rechtliche Rahmenbedingungen – NPM, EU-Vorgaben'},
  {id:'h95',cat:'FeuAK · Haushalt',q:'Was ist der kommunale Finanzausgleich – und was ist er ausdrücklich NICHT?',a:'Der Finanzausgleich gleicht <strong>Finanzkraftunterschiede</strong> zwischen Ländern bzw. Kommunen aus – er ist <strong>kein Defizitausgleich</strong>.<br><br><strong>Länderfinanzausgleich:</strong> Ausgleich zwischen Bundesländern aus dem Landessteueraufkommen; Ziel: gleichwertige Lebensbedingungen im Bundesgebiet.<br><strong>Kommunaler Finanzausgleich:</strong> Das Land leitet Mittel aus Landessteuern an finanzschwächere Kommunen weiter.<br><br><strong>Merke:</strong> Gemeindesteuern (Gewerbesteuer, Grundsteuer) sind ein <em>eigenständiger</em> Einnahmeweg der Kommunen – sie sind nicht Teil des Finanzausgleichs.'},
  {id:'h96',cat:'FeuAK · Haushalt',q:'Welche 5 Ebenen hat die Produktpyramide der Feuerwehr?',a:'<strong>1. Bereich</strong> – z. B. Dezernat Öffentliche Sicherheit und Ordnung<br><strong>2. Produktgruppe</strong> – z. B. Gefahrenabwehr / Feuerwehr<br><strong>3. Produkt</strong> – z. B. Brandschutz, Technische Hilfe, Rettungsdienst. Muss steuerungsrelevant und unter <em>eine</em> Verantwortung gestellt sein.<br><strong>4. Leistung</strong> – z. B. vorbeugender / abwehrender Brandschutz, Notfallversorgung<br><strong>5. Tätigkeit</strong> – z. B. Bescheide erstellen, Besichtigungen durchführen<br><br><strong>Zwei Steuerungsebenen:</strong> Strategisch = Haushalt als „Vertrag" zwischen Politik und Verwaltung · Operativ = KLR und internes Controlling auf Produkt-/Kostenstellenebene.'},
  {id:'h97',cat:'FeuAK · Haushalt',q:'Was sind Verpflichtungsermächtigungen (VE), Investitionsprogramm (IP) und Stellenplan?',a:'<strong>Verpflichtungsermächtigungen (VE):</strong> Haushalterisches Werkzeug – heute einen Vertrag unterschreiben für ein System, das erst in späteren Jahren geliefert und bezahlt wird. Sichert Planungssicherheit über das laufende Haushaltsjahr hinaus.<br><br><strong>Deckungsfähigkeit:</strong> Budgets können umgeschichtet werden (z. B. Helm-Budget für Stiefel nutzen).<br><strong>Übertragbarkeit:</strong> Nicht verbrauchte Mittel sichern auf das Folgejahr (Ermächtigungsübertragungen / „Reste").<br><br><strong>Investitionsprogramm (IP):</strong> Teil des Finanzhaushalts – 5-Jahres-Planung aller Investitionsvorhaben. Grundlage für VE. Großbeschaffungen müssen 5 Jahre im Voraus geplant sein.<br><strong>Stellenplan:</strong> Parlamentsermächtigung für jede Stelle – Beamten- und Beschäftigtenstellen getrennt. Neue Stellen erst besetzbar, wenn Stellenplan rechtskräftig ist.'},
  {id:'h98',cat:'FeuAK · Haushalt',q:'Was ist der Unterschied zwischen investiven und konsumtiven Ausgaben? Nennen Sie je 2 Beispiele.',a:'<strong>Investiv (Finanzhaushalt):</strong> Anschaffungen mit bleibendem Vermögenswert, langfristige Nutzung.<br>Beispiele: Feuerwehrfahrzeug · Gebäude · Software-Lizenzen (Vermögenswert)<br><br><strong>Konsumtiv (Ergebnishaushalt):</strong> Laufende Ausgaben, Verbrauchsgüter – kein bleibender Vermögenswert.<br>Beispiele: jährlicher Software-Support · TÜV-Prüfungen · Kraftstoff · Verbrauchsmaterial<br><br><strong>Praxis:</strong> Beim Kauf eines RTW ist das Fahrgestell <em>investiv</em>, die laufenden TÜV-Prüfungen und Medizingeräte-Eichungen sind <em>konsumtiv</em>.'},
  {id:'h99',cat:'FeuAK · Haushalt',q:'Was sind überplanmäßige und außerplanmäßige Ausgaben, und welche 3 Bedingungen gelten für ihre Genehmigung?',a:'<strong>Überplanmäßige Ausgaben:</strong> Haushaltsansatz ist nicht ausreichend – Mehrkosten entstehen bei einer schon geplanten Position.<br><strong>Außerplanmäßige Ausgaben:</strong> Die Ausgabe war im Haushalt gar nicht vorgesehen.<br><br><strong>Genehmigungsbedingungen (Kämmerer):</strong><br>1. Ausgabe war zum Zeitpunkt der Planung <em>nicht vorhersehbar</em><br>2. Ausgabe <em>muss</em> noch in diesem Haushaltsjahr stattfinden<br>3. <em>Deckung</em> muss gewährleistet sein<br><br><strong>„Todsünden" der Budgetierung:</strong> (1) Budget abschöpfen – Restmittel am Jahresende einziehen statt übertragen. (2) Budget kürzen – wer spart, bekommt im Folgejahr weniger. Beide zerstören den Sparanreiz und führen zu strategischem Dezemberausgeben.'},
  {id:'h100',cat:'FeuAK · Haushalt',q:'Wie unterscheiden sich Kameralistik und Doppik? Was sind Lebenszykluskosten?',a:'<strong>Kameralistik:</strong> Kassensteuerung – erfasst nur Ein- und Auszahlungen eines Haushaltsjahres. Zeigt Liquidität, vernachlässigt Vermögenswerte und Werteverzehr (Abschreibungen). Einfach und klar, greift bei komplexem Ressourcenmanagement zu kurz.<br><br><strong>Doppik:</strong> Kaufmännisches Prinzip – doppelte Buchführung mit Bilanz, Ergebnis- und Finanzrechnung. Erfasst periodengerechten Werteverzehr (Abschreibungen), zeigt tatsächliches Vermögen und Schulden, sichert Generationengerechtigkeit.<br><br><strong>Aufwand ≠ Ausgabe:</strong> Abschreibungen sind Aufwand (Ressourcenverbrauch), aber keine laufende Auszahlung.<br><br><strong>Lebenszykluskosten:</strong> Der Anschaffungspreis ist nur die Spitze des Eisbergs. Folgekosten (Wartung, TÜV, Reparaturen) machen den Großteil des Budgets aus und müssen bereits bei der Beschaffung eingeplant werden.'},
  {id:'h101',cat:'FeuAK · Haushalt',q:'Was ist Controlling in der Feuerwehr – intern vs. extern? Welche Kennzahlen sind steuerungsrelevant?',a:'Controlling = <strong>planen → kontrollieren → nachsteuern</strong>. Absolute Führungsaufgabe der FW-FK; bei größeren Feuerwehren eigene Stabstelle.<br><br><strong>Internes Controlling:</strong> Adressat: Fachbereichsleitung, Amtsleitung. Detaillierte operative Kennzahlen – z. B. Ausrückezeiten je Wache, Kosten je Einsatz, Budgetstand je Kostenstelle. Ermöglicht kurzfristiges Nachsteuern.<br><br><strong>Externes Controlling:</strong> Adressat: Politik, Bürgerschaft. Hochaggregierte Berichte – z. B. Schutzzielerreichungsgrad, Budgetstand, Haushaltsentwicklung. Grundlage für politische Entscheidungen.<br><br><strong>Strategische Bedeutung:</strong> Eine valide Zeitreihe von Kennzahlen ist das beste Argument in Ressourcenverteilungskämpfen. Bereiche ohne Kennzahlen verlieren bei Kürzungsdebatten.'},
  {id:'h102',cat:'FeuAK · Haushalt',q:'Welche 4 steuerungsrelevanten Teilprozesse der Gefahrenabwehr kennt das Prozessmanagement – und welche Kennzahlen leiten sich ab?',a:'<strong>1. Notrufannahme & Disposition</strong> – Kennzahlen: Zeit bis Annahme, Fehldispositionsrate, Parallelgespräche. Steuerungsrelevanz: Engpass bei hohem Aufkommen → Personalbedarf Leitstelle.<br><br><strong>2. Ausrückezeit</strong> – Zeit von Alarmierung bis Abfahrt. Abhängig von Wachbesetzung, Schichtstärke, Tageszeit. Direkt steuerungsrelevant für Schutzziele.<br><br><strong>3. Fahrzeit</strong> – Zeit von Abfahrt bis Eintreffen. Grundlage für Standortentscheidungen und Bedarfsplanung.<br><br><strong>4. Gesamtfrist (Schutzzielerreichung)</strong> – Notruf + Ausrückezeit + Fahrzeit = messbare Kenngröße, ob das Schutzmodell funktioniert.<br><br><strong>Merke:</strong> Nur wer Prozesse kennt, kann sie messen, steuern und daraus Kennzahlen ableiten.'},
  {id:'h103',cat:'FeuAK · Haushalt',q:'Was ist der PDCA-Regelkreis, und wie ist der Brandschutzbedarfsplan (BEP) als Qualitätsinstrument aufgebaut?',a:'<strong>PDCA-Regelkreis (QM als NSM-Element 8):</strong><br><strong>P</strong>lan – Problem analysieren, Lösung entwickeln.<br><strong>D</strong>o – Lösung realisieren (zunächst im Pilotmaßstab).<br><strong>C</strong>heck – Ergebnisse evaluieren, Zielerreichung prüfen.<br><strong>A</strong>ct – Erfolgreiche Lösung standardisieren; sonst neuer Zyklus.<br><br><strong>Brandschutzbedarfsplan (BEP):</strong> Fachliches Pendant zur mittelfristigen Haushaltsplanung.<br>· <strong>Schutzziele</strong> – politisch definierte Mindeststandards (z. B. „10 Kräfte in 8 Minuten bei 90 % der Lagen")<br>· <strong>Mengenbezugsgrößen</strong> – Einsatzzahlen, Einwohnerzahl, Fläche<br>· <strong>Maßnahmen & Kennzahl</strong> – Abarbeitungsgrad der BEP-Maßnahmen<br><br><strong>Empfehlung:</strong> BEP mit Haushalt verknüpfen – ohne Mittel nicht umsetzbar, ohne BEP fachlich nicht begründbar.'},
  {id:'h104',cat:'FeuAK · Haushalt',q:'Was muss bei der Markterkundung beachtet werden, und was ist bei Wartungsverträgen wichtig?',a:'<strong>Neutrales Leistungsverzeichnis:</strong> Bedarfe müssen exakt und <em>herstellerneutral</em> beschrieben werden. Es ist rechtswidrig, bestimmte Hersteller zu bevorzugen.<br>✅ Zulässig: Fahrzeugmessen besuchen, verschiedene Softwareanbieter einladen, funktionale Mindestanforderungen formulieren.<br>🚫 Verboten: Wettbewerbsverzerrende Absprachen mit Herstellern (Kartellverbot).<br><br><strong>Beispiel RTW:</strong> ❌ „Mercedes-Benz Sprinter mit Aufbau Firma X" · ✅ „Fahrgestell mind. 160 PS mit Kofferaufbau Mindestmaß X/Y/Z"<br><br><strong>Vertragsmanagement – Wartungsverträge:</strong><br>· Langfristige Bindung: Mittel über Jahre gebunden, potenzielle Kostensteigerungen beachten<br>· Rechtssicherheit: Compliance schützt vor Vergabefehlern<br>· Kostenkontrolle: transparente Verträge verhindern unvorhersehbare Folgekosten<br>· Spenden/Sponsoring: müssen über den Rat laufen (kommunale Annahmerichtlinien)'},
  {id:'h105',cat:'FeuAK · Haushalt',q:'Wer kontrolliert das Handeln der Feuerwehr, und nach welchen Kriterien prüft die Rechnungsprüfung?',a:'<strong>Kontrollinstitutionen:</strong><br>· Grundsätzlich jeder Mitarbeitende des öffentlichen Dienstes<br>· Innenrevision & Rechnungshof (nachgelagert, strikt)<br>· Parlament (Große Anfragen, Sonderkontrollausschüsse)<br>· Bürger (Anfragen gem. Transparenzgesetz)<br><br><strong>Vergabevermerk-Pflicht:</strong> Jede Vergabeentscheidung – vom abgelehnten Angebot bis zur Eilbeschaffung – muss lückenlos schriftlich nachvollziehbar sein.<br><br><strong>4 Prüfkriterien der Rechnungsprüfung:</strong><br>1. <strong>Rechtmäßigkeit</strong> – strikte Kontrolle aller Ausgaben<br>2. <strong>Budgeteinhaltung</strong> – Haushaltsansätze eingehalten?<br>3. <strong>Wirtschaftlichkeit</strong> – sparsam und zweckmäßig?<br>4. <strong>Haushaltsgrundsätze</strong> – Kernregeln eingehalten?<br><br><strong>Konsequenzen von Fehlern:</strong> Vergaberügen, Budgetsperren, Haftungsrisiken, Reputationsverlust.'},

  /* ── FeuAK · KatS-Bedarfsplanung ── */
  {id:'h106',cat:'FeuAK · KatS-Bedarfsplanung',q:'Welche zwei Methodiken werden im Bevölkerungsschutz unterschieden und warum?',a:'<strong>Quantitative Methodik</strong> – Anwendung bei Leitstelle, Rettungsdienst und Feuerwehr. Grundlage: Einsatzhäufigkeit / Duplizitätswahrscheinlichkeit; statistisch belastbare Grundgesamtheit ermöglicht Häufigkeitsauswertungen.<br><br><strong>Qualitative Methodik</strong> – Anwendung im <strong>Katastrophenschutz</strong>. Grundlage: Einzelereignisse mit individuellen Risikoparametern. Die geringe Eintrittsfrequenz von Katastrophen lässt keine statistisch valide Häufigkeitsberechnung zu → Szenarienbasiertes Vorgehen erforderlich.'},
  {id:'h107',cat:'FeuAK · KatS-Bedarfsplanung',q:'Beschreiben Sie den Katastrophenkreislauf und die Zuständigkeitsebenen im Bevölkerungsschutz.',a:'<strong>Katastrophenkreislauf (3 Phasen):</strong><br>1. <strong>Katastrophenvorsorge</strong> – Risikoanalyse, BAEP, Übungen, Vorratsbildung, Notunterkünfte<br>2. <strong>Katastrophenereignis</strong> – Rettungsmaßnahmen, Einsatz aller verfügbaren Ressourcen<br>3. <strong>Katastrophennachsorge</strong> – Schadensbeseitigung, Hilfe für Betroffene, Wiederherstellung<br><br><strong>Zuständigkeitsebenen:</strong><br>· <strong>Bund</strong> – Zivilschutz (ergänzende Ausstattung)<br>· <strong>Land</strong> – Obere KatS-Behörde (Koordination, Ressourcen)<br>· <strong>Landkreis/kreisfreie Stadt</strong> – Untere KatS-Behörde; zuständig für KatSBP, Feuerwehrbereitschaft, RD<br>· <strong>Kommunen</strong> – örtliche Feuerwehr und RD verbleiben in kommunaler Zuständigkeit (auch im Katastrophenfall)'},
  {id:'h108',cat:'FeuAK · KatS-Bedarfsplanung',q:'Nennen Sie die 5 Phasen der KatS-Bedarfsplanung nach Lülf+.',a:'<strong>1. Brainstorming</strong> – Alle denkbaren Szenarien sammeln: anthropogene, Natur- und konfliktbedingte Katastrophen; Leitfragen: KRITIS? Hochwasser? Georisiken?<br><br><strong>2. Szenarienauswahl</strong> – Reduktion auf ca. 5 relevanteste Szenarien via Risikomatrix (EW × Schadenshöhe); ergänzt um Velocity of Risk (VoR) → ermöglicht Wechsellader-/Dual-Use-Planung<br><br><strong>3. Szenarienfolgenbetrachtung</strong> – Betroffenheit und Leistungsfähigkeit je Szenario in Workshops; Ableitung der Fähigkeitsbedarfe je Schutzziel (Menschenleben, Gesundheit, Umwelt, Wirtschaft)<br><br><strong>4. Ableitung der Planungsziele</strong> – Aggregierung der Fähigkeitsbedarfe aus allen Szenarien zu übergeordneten Planungszielen<br><br><strong>5. Maßnahmenableitung</strong> – IST-Stand-Analyse → SOLL-IST-Vergleich → priorisierte Maßnahmenliste'},

  /* ── FeuAK · Stakeholderanalyse ── */
  {id:'h109',cat:'FeuAK · Stakeholderanalyse',q:'Erläutern Sie die Power-Interest-Matrix (Mendelow) mit den 4 Quadrantenstrategien.',a:'Die <strong>Power-Interest-Matrix (Mendelow, 1991)</strong> ordnet Stakeholder nach Macht (hoch/niedrig) und Interesse (hoch/niedrig) und leitet daraus Managementstrategien ab:<br><br><strong>Manage Closely</strong> (Macht↑ Interesse↑) – Schlüsselakteure: aktiv einbinden, Entscheidungen abstimmen, regelmäßiger Dialog<br><strong>Keep Satisfied</strong> (Macht↑ Interesse↓) – Schläfer mit Eskalationspotenzial: über Meilensteine informieren, keine unangenehmen Überraschungen<br><strong>Keep Informed</strong> (Macht↓ Interesse↑) – Engagierte Beobachter: transparent informieren, Bedenken ernst nehmen, als Fürsprecher entwickeln<br><strong>Monitor</strong> (Macht↓ Interesse↓) – Periphere Stakeholder: minimalem Aufwand beobachten, bei Machtänderung neu bewerten'},
  {id:'h110',cat:'FeuAK · Stakeholderanalyse',q:'Was sind die 3 Attribute und 7 Stakeholder-Typen des Salience-Modells (Mitchell/Agle/Wood 1997)?',a:'<strong>3 Attribute:</strong><br>· <strong>Macht (Power)</strong> – Einfluss auf Entscheidungen (formell: Weisungsrecht/Finanzhoheit; informell: Mediendruck)<br>· <strong>Legitimität (Legitimacy)</strong> – gesellschaftlich anerkannter Anspruch (Vertrag, Gesetz, Moral)<br>· <strong>Dringlichkeit (Urgency)</strong> – Forderungen erfordern sofortiges Handeln<br><br><strong>7 Stakeholder-Typen:</strong><br><em>Latente (1 Attribut):</em> Dormant (nur Macht) · Discretionary (nur Legitimität) · Demanding (nur Dringlichkeit)<br><em>Erwartende (2 Attribute):</em> Dominant (M+L) · Dangerous (M+D) · Dependent (L+D)<br><em>Definitiv (alle 3):</em> Höchste Salience → sofortiger Handlungsbedarf<br><br><strong>Dynamik:</strong> Stakeholder können zwischen Typen wechseln (z. B. Dormant → Definitiv durch Krise).'},
  {id:'h111',cat:'FeuAK · Stakeholderanalyse',q:'Nennen Sie die 4 Einbindungsgrade der Stakeholderkommunikation und beschreiben Sie den Aufbau eines Stakeholder-Registers.',a:'<strong>4 Einbindungsgrade (aufsteigend):</strong><br>I. <strong>Informieren</strong> – einseitige Kommunikation; kein Feedback vorgesehen (für Monitor/Keep Informed)<br>II. <strong>Konsultieren</strong> – Meinung einholen; Ergebnis fließt ein, Entscheidungshoheit bleibt bei der Organisation<br>III. <strong>Einbeziehen</strong> – aktive Mitgestaltung in Arbeitsgruppen; für Schlüsselakteure (Manage Closely)<br>IV. <strong>Kooperieren</strong> – gemeinsame Entscheidungsfindung und geteilte Verantwortung (z. B. Partnerbehörden)<br><br><strong>Stakeholder-Register (typische Felder):</strong><br>· <em>Stammdaten:</em> Name, Funktion, Kontakt, Gruppe (intern/extern)<br>· <em>Bewertung:</em> Macht (1–5), Interesse (1–5), Einstellung (positiv/neutral/kritisch)<br>· <em>Maßnahmen:</em> Einbindungsgrad, Kommunikationskanal, Frequenz, Verantwortlicher<br>→ Aus dem Register wird der <strong>Kommunikationsplan</strong> abgeleitet.'},

  /* ── FeuAK · Prospektive Risikoanalyse ── */
  {id:'h112',cat:'FeuAK · Prospektive Risikoanalyse',q:'Nennen Sie die 5 Phasen der Risikoanalyse und beschreiben Sie kurz die 4 Risikobewältigungsstrategien.',a:'<strong>5 Phasen der Risikoanalyse:</strong><br>1. <strong>Kontext festlegen</strong> – Ziel, Scope, Rahmenbedingungen, Beteiligte definieren<br>2. <strong>Risikoidentifikation</strong> – systematisch alle Risiken erfassen (Brainstorming, Wertkette, SWOT, PESTEL, Szenariotechnik, FMEA)<br>3. <strong>Risikoanalyse</strong> – je Risiko: Eintrittswahrscheinlichkeit (P) und Schadensausmaß (S) bestimmen (Skala 1–5)<br>4. <strong>Risikobewertung</strong> – Risikowert = P × S; Einordnung in Risikomatrix; Priorisierung nach Akzeptanzgrenzen<br>5. <strong>Maßnahmen & Monitoring</strong> – Bewältigungsstrategie wählen, implementieren, Restrisiko dokumentieren<br><br><strong>4 Bewältigungsstrategien:</strong><br>· <strong>Vermeiden</strong> – Ursache eliminieren · <strong>Reduzieren</strong> – P oder S senken<br>· <strong>Übertragen</strong> – z. B. Versicherung · <strong>Akzeptieren</strong> – Restrisiko bewusst tragen'},
  {id:'h113',cat:'FeuAK · Prospektive Risikoanalyse',q:'Erläutern Sie den Aufbau der Risikomatrix 5×5 und die Skalen für Eintrittswahrscheinlichkeit und Schadensausmaß.',a:'<strong>Risikomatrix:</strong> Risikowert = P × S (1–25). Je höher der Wert, desto dringlicher der Handlungsbedarf.<br><br><strong>Eintrittswahrscheinlichkeit (P):</strong><br>1 – Sehr unwahrscheinlich (&lt;1%/&gt;100 Jahre) · 2 – Unwahrscheinlich (1–10%) · 3 – Möglich (10–30%) · 4 – Wahrscheinlich (30–60%) · 5 – Sehr wahrscheinlich (&gt;60%/&lt;1 Jahr)<br><br><strong>Schadensausmaß (S):</strong><br>1 – Vernachlässigbar · 2 – Gering (kurzfristige Störung) · 3 – Moderat (länger andauernd) · 4 – Schwer (Personenschäden) · 5 – Katastrophal (Todesfall, Totalausfall)<br><br><strong>Instrumente zur Risikoidentifikation:</strong> Wertkette nach Porter, SWOT, PESTEL, Szenariotechnik, FMEA, Brainstorming/Checklisten'},

  /* ── FeuAK · Beschaffungsprozess (Detail) ── */
  {id:'h114',cat:'FeuAK · Beschaffungspraxis',q:'Was regelt die Losbildung (§97 GWB) und welche Vor-/Nachteile hat die Blockbeschaffung?',a:'<strong>Losbildung (§97 Abs. 4 GWB):</strong> Leistungen grundsätzlich aufgeteilt vergeben:<br>· <strong>Fachlose</strong> bei Fahrzeugbeschaffung: Los 1 Fahrgestell · Los 2 Aufbau · Los 3 Beladung<br>· Zusammenfassung zulässig bei technischen/wirtschaftlichen Gründen (Schnittstellenproblematik)<br>· DFV-AGBF: Fahrgestell + Aufbau dürfen als Gesamtlos vergeben werden<br><br><strong>Blockbeschaffung (Rahmenvertrag):</strong><br>· Laufzeit max. <strong>4 Jahre</strong>; Fahrzeuge bedarfsgerecht abrufen<br>· <em>Vorteile:</em> einheitliche Ausbildung, einfachere Wartung/Ersatzteilhaltung, Stückzahleffekte<br>· <em>Risiko:</em> bauartbedingte Mängel betreffen die gesamte Charge; Lieferzeiten erst nach Zuschlag bekannt'},
  {id:'h115',cat:'FeuAK · Beschaffungspraxis',q:'Beschreiben Sie die drei Abnahmestufen bei der Fahrzeugbeschaffung (Konstruktionsgespräch, Zwischenabnahme, Endabnahme).',a:'<strong>1. Konstruktionsgespräch (nach Zuschlag)</strong><br>· Auftragsklärungsgespräch zur Abstimmung offener Punkte<br>· AN legt Konstruktionspläne vor – mind. 1 Woche vorher zur Vorbereitung des AG<br>· Sonderwünsche nach Zuschlag nur noch in „geringem Umfang" möglich (§132 GWB)<br><br><strong>2. Zwischenabnahme / Rohbauabnahme</strong><br>· Fahrgestellabnahme bei Auslieferung an den Aufbauer<br>· Rohbauabnahme des Aufbaus – erste Überprüfung, noch Korrekturen möglich<br>· Von Teilabnahmen wird abgeraten (Gewährleistungsfrist beginnt zu laufen)<br><br><strong>3. Endabnahme</strong><br>· Abschließende Überprüfung → löst Zahlungspflicht aus<br>· Abnahmeteam: 4–6 Personen (PL, Werkstatt, Einsatzdienst)<br>· Fahrzeug entladen, Beladung prüfen, achsweise wiegen<br>· Alle Mängel dokumentieren; Einweisung erst nach mangelfreier Abnahme'},
  {id:'h116',cat:'FeuAK · Beschaffungspraxis',q:'Welche Schritte umfassen Inbetriebnahme und Aussonderung eines Feuerwehrfahrzeugs?',a:'<strong>Inbetriebnahme (am Technik-Standort):</strong><br>· Finale Mängelbehebung, Geräteprüfung, Funkgeräte-/UDS-Einbau<br>· Ergänzende Beladung, Inventarisierung im BMS (z. B. COSware)<br>· Multiplikatorenschulung / Einweisung der Einsatzkräfte und Werkstätten<br>· Offizielle Übergabe mit Amtsleitung, Politik, Fördermittelgebern (Presse-/Fototermin)<br><br><strong>Aussonderung (Altfahrzeug als kommunaler Vermögenswert):</strong><br>· <strong>Öffentliche Auktion</strong> – selbst oder über Plattformen (z. B. zoll-auktion.de)<br>· <strong>Direktverkauf</strong> zu Schätzpreis an andere Kommune → Ratsbeschluss erforderlich<br>· <strong>Spende</strong> als humanitäre Hilfe (z. B. Ukraine) → ebenfalls Ratsbeschluss<br>· <strong>Reservefahrzeug</strong> als Alternative zur Veräußerung'},

  /* ── IdF Münster – Zusatzkarten ── */
  {id:'i18',cat:'IdF · Brandschutz',q:'Was bedeuten die Feuerwiderstandsklassen F30/60/90/120 und die Kennbuchstaben R, E, I?',a:'Zahl = Mindestdauer der Feuerwiderstandsfähigkeit in Minuten.<br><strong>R (Resistance):</strong> Tragfähigkeit/Standsicherheit.<br><strong>E (Integrity):</strong> Raumabschluss (kein Feuer-/Rauchdurchgang).<br><strong>I (Insulation):</strong> Wärmedämmung (keine Übertragung auf Kaltseite).<br>Beispiel: REI 90 = alle drei Eigenschaften für mind. 90 min.'},
  {id:'i19',cat:'IdF · Brandschutz',q:'Was sind die Anforderungen an 1. und 2. Rettungsweg?',a:'<strong>1. Rettungsweg:</strong> baulich gesicherter Weg (Treppenraum, notwendiger Flur) → führt ins Freie.<br><strong>2. Rettungsweg:</strong> über Rettungsgeräte der FW (Leiter), Außentreppe oder zweiten baulichen RW.<br><strong>Grundsatz:</strong> 2 voneinander unabhängige RW je Nutzungseinheit.<br>Max. Länge notwendiger Flur: 35 m.'},
  {id:'i20',cat:'IdF · Brandschutz',q:'Welche Funktion haben Brandabschnitte und Brandwände?',a:'<strong>Brandabschnitte:</strong> begrenzen räumliche Ausbreitung; max. Fläche je nach Nutzung (Verkaufsstätte ≤ 3.000 m², mit Sprinkler ≤ 10.000 m²).<br><strong>Brandwand (§ 30 MBO):</strong> REI 90 + mechanisch robust, verhindert Brandübertragung auf Nachbargebäude.<br>Mind. alle 40 m (Industriebau nach MIndBauRL).'},
  {id:'i21',cat:'IdF · Brandschutz',q:'Was sind die Aufgaben des Brandschutzbeauftragten?',a:'Privatrechtliche Funktion für den Betreiber – keine hoheitlichen Aufgaben.<br><strong>Aufgaben:</strong> Brandschutzordnung (Teile A/B/C) erstellen · Räumungsübungen · Prüfung BS-Einrichtungen · Schulungen · Mitwirkung bei Baugenehmigungsverfahren · Begehungen · Dokumentation.<br><strong>Ausbildung:</strong> vfdb-Richtlinie 12-09/01, mind. 64 UE + Fortbildung.'},
  {id:'i22',cat:'IdF · Stabsarbeit',q:'Was ist ein SAE und wie unterscheidet er sich vom Krisenstab?',a:'<strong>SAE = Stab für außergewöhnliche Ereignisse</strong> – auf <strong>Gemeindeebene</strong>.<br><strong>Krisenstab</strong> – auf <strong>Kreis-/kreisfreier Stadtebene</strong> (Einberufung durch HVB).<br>SAE: Leiter (i.d.R. Bürgermeister) + Feuerwehr + Verwaltung + bedarfsweise Fachdienste.<br>SAE koordiniert für Gemeinde; Krisenstab trägt rechtliche/politische Gesamtverantwortung.'},
  {id:'i23',cat:'IdF · Stabsarbeit',q:'Was sind die Anforderungen an Lagemeldungen im Einsatz?',a:'Schema: <strong>Wer meldet – Was (Lage) – Wo – Wann – Eigene Maßnahmen – Anforderungen</strong>.<br><strong>Formen:</strong> Erstmeldung (sofort nach Eintreffen) · Folgemeldungen (in Abständen) · Schlussmeldung.<br>Alle Meldungen werden im <strong>Einsatztagebuch (ETB)</strong> dokumentiert (S2 führt ETB – rechtssichere Urkundsfunktion).'},
  {id:'i24',cat:'IdF · Stabsarbeit',q:'Was ist NINA und wie funktioniert das Bevölkerungswarnwesen?',a:'<strong>NINA = Notfall-Informations- und Nachrichten-App</strong> des BBK – Bevölkerung empfängt Warnungen auf Smartphone.<br><strong>Warn-Hierarchie:</strong> BBK/MoWaS (Bund) → Länder → Kreise → Gemeinden.<br><strong>Weitere Systeme:</strong> KATWARN, MoWaS, Sirenen, TV/Radio.<br>Nationaler Warntag: bundesweiter Probealarm (seit 2020 wieder etabliert).'},
  {id:'i25',cat:'IdF · Stabsarbeit',q:'Was kennzeichnet den Führungsrhythmus eines Stabes?',a:'Strukturierter Ablauf zur Informationsverarbeitung:<br><strong>1. Lagefilm aktualisieren</strong> (S2) → <strong>2. Lagebesprechung</strong> (alle SG) → <strong>3. Lagebeurteilung</strong> (S3) → <strong>4. Entschluss</strong> (Stableiter) → <strong>5. Befehle ausgeben</strong> → <strong>6. Ausführung überwachen</strong>.<br>Rhythmus alle 1–2 Stunden oder nach Lageverschlechterung.'},
  {id:'i26',cat:'IdF · Stabsarbeit',q:'Wie unterscheiden sich FF, BF, WF und AB rechtlich?',a:'<strong>FF (Freiwillige Feuerwehr):</strong> Ehrenamt, Pflichtaufgabe der Gemeinde.<br><strong>BF (Berufsfeuerwehr):</strong> hauptamtlich, ab 100.000 EW vorgeschrieben.<br><strong>WF (Werkfeuerwehr):</strong> privatrechtliche Betriebsfeuerwehr, ergänzt öff. FW, staatlich anerkannt.<br><strong>AB (Anerkannte Betriebsfeuerwehr):</strong> wie WF, aber mit Löschpflicht für das eigene Betriebsgelände.'},
  {id:'i27',cat:'IdF · Brandschutz',q:'Was ist eine Brandschutzordnung und welche 3 Teile hat sie?',a:'Regelt organisatorischen Brandschutz in Betrieben/Gebäuden (Basis: DIN 14096):<br><strong>Teil A:</strong> Kurzinformation für alle Personen (Aushang, DIN A4, bildhaft).<br><strong>Teil B:</strong> für Beschäftigte – detaillierte Verhaltensregeln + Prävention.<br><strong>Teil C:</strong> für Mitarbeiter mit Sonderaufgaben (Brandschutzhelfer, Evakuierungshelfer).'},
  {id:'i28',cat:'IdF · Presse',q:'Was ist die 30-70-100-Regel in der Krisenkommunikation?',a:'Faustregel zum Zeitpunkt von Kommunikation:<br><strong>Nach 30 min:</strong> ca. 30 % der Fakten bekannt → erste offizielle Stellungnahme (nicht schweigen!).<br><strong>Nach 70 min:</strong> ca. 70 % bekannt → Lagebericht.<br><strong>Nach 100 min:</strong> vollständige Darstellung möglich.<br>Lehre: Lieber schnell mit Vorläufigem als zu spät mit Vollständigem – Vakuum füllt sich mit Gerüchten.'},

  /* ── GAL – Zusatzkarten ── */
  {id:'g61',cat:'GAL · Führung',q:'Welche 4 Führungsstile unterscheidet Kurt Lewin?',a:'<strong>1. Autoritär:</strong> Führer entscheidet allein, gibt Anweisungen. Vorteil: klare Struktur, schnell. Nachteil: geringes Engagement.<br><strong>2. Demokratisch/kooperativ:</strong> Gruppe wirkt mit. Vorteil: hohe Motivation. Nachteil: zeitintensiv.<br><strong>3. Laissez-faire:</strong> kaum Führung, Gruppe handelt selbstständig – sinnvoll nur bei Experten.<br><strong>4. Situativ:</strong> Wechsel je nach Situation und Reifegrad.'},
  {id:'g62',cat:'GAL · Führung',q:'Was besagt das situative Führen nach Hersey und Blanchard?',a:'Führungsstil richtet sich nach dem <strong>Reifegrad (Readiness)</strong> der Geführten:<br><strong>R1 (nicht fähig, nicht willig):</strong> Dirigieren (aufgabenorientiert hoch).<br><strong>R2 (nicht fähig, willig):</strong> Trainieren (hoch/hoch).<br><strong>R3 (fähig, nicht willig):</strong> Partizipieren (niedrig/hoch).<br><strong>R4 (fähig und willig):</strong> Delegieren (niedrig/niedrig).'},
  {id:'g63',cat:'GAL · Führung',q:'Was ist Auftragstaktik und welche Voraussetzungen sind nötig?',a:'Führungsprinzip: <strong>Ziel vorgeben, nicht den Weg</strong>. Untergebene haben Entscheidungsfreiheit.<br><strong>Vorteile:</strong> flexible Reaktion, hohe Motivation, Dezentralisierung.<br><strong>Voraussetzungen:</strong> klare Auftragsformulierung (Was? Bis wann? Mit welchen Mitteln?) · Ausbildung und Kompetenz der Geführten · Vertrauen · Rückmeldung.'},
  {id:'g64',cat:'GAL · Führung',q:'Welche 5 Phasen der Teamentwicklung beschreibt Tuckman?',a:'<strong>1. Forming:</strong> Orientierungsphase, höfliche Zurückhaltung.<br><strong>2. Storming:</strong> Konflikte um Rollen und Einfluss.<br><strong>3. Norming:</strong> Regeln entstehen, Zusammenhalt wächst.<br><strong>4. Performing:</strong> leistungsstarke, effektive Zusammenarbeit.<br><strong>5. Adjourning:</strong> Auflösung des Teams, Abschluss.'},
  {id:'g65',cat:'GAL · Führung',q:'Wie ist ein Kritikgespräch strukturiert aufzubauen?',a:'<strong>6-Stufen-Modell:</strong><br>1. Sachlichen Rahmen herstellen (Zeit, Ort, Ruhe).<br>2. Sachverhalt schildern (konkret, ohne Vorwürfe).<br>3. Sichtweise des anderen einholen (aktiv zuhören).<br>4. Auswirkungen benennen.<br>5. Gemeinsam Lösung erarbeiten (Vereinbarung).<br>6. Positiv abschließen (Wertschätzung stärken).'},
  {id:'g66',cat:'GAL · Führung',q:'Was ist aktives Zuhören nach Carl Rogers?',a:'Technik der empathischen Gesprächsführung:<br><strong>1. Verbalisieren:</strong> Gefühle in eigenen Worten spiegeln.<br><strong>2. Paraphrasieren:</strong> Inhalt zusammenfassen.<br><strong>3. Nachfragen:</strong> offene Fragen stellen, Verständnis sichern.<br><strong>Körpersprache:</strong> Augenkontakt, zugewandte Haltung, keine Ablenkung.<br>Ziel: Vertrauen aufbauen, vollständige Information, Deeskalation.'},
  {id:'g67',cat:'GAL · FwDVen',q:'Welche Inhalte regeln FwDV 1, 2, 3, 7 und 100?',a:'<strong>FwDV 1:</strong> Grundtätigkeiten – Lösch- und Hilfeleistungseinsätze.<br><strong>FwDV 2:</strong> Ausbildung der Feuerwehren (Grundlagen).<br><strong>FwDV 3:</strong> Einheiten im Löscheinsatz (taktische Gliederung, Trupps).<br><strong>FwDV 7:</strong> Atemschutz (AS-Einsatz, Truppgrundsatz, Sicherheitstrupp).<br><strong>FwDV 100:</strong> Führung und Leitung im Einsatz (Führungsvorgang, Stäbe, Stufen A–D).'},
  {id:'g68',cat:'GAL · FwDVen',q:'Welche taktischen Einheiten gibt es und wie ist ihre Stärke?',a:'<strong>Trupp:</strong> 1/2 (Truppführer + 2 Truppmann = 3 Personen).<br><strong>Staffel:</strong> 1/5 (Staffelführer + 5 Mann = 6 Personen).<br><strong>Gruppe:</strong> 1/8 (Gruppenführer + 8 Mann = 9 Personen, grundtaktische Einheit).<br><strong>Zug:</strong> 1/20 (Zugführer + ca. 20 Mann ≈ 22 Personen mit Stab).'},
  {id:'g69',cat:'GAL · FwDVen',q:'Wie werden die Trupps einer Gruppe im Löscheinsatz eingesetzt?',a:'Nach FwDV 3:<br><strong>Angriffstrupp (ATr):</strong> dringt vor, Rettungs- und Löschmaßnahmen.<br><strong>Wassertrupp (WTr):</strong> baut Wasserversorgung auf, unterstützt ATr.<br><strong>Schlauchtrupp (SchlTr):</strong> verlegt Schlauchleitung, ggf. zweiter Angriff.<br><strong>Melder (Me):</strong> Verbindung zum Gruppenführer.<br><strong>Maschinist (Ma):</strong> bedient Pumpe und Fahrzeug.'},
  {id:'g70',cat:'GAL · GABC',q:'Welche Gefahrengruppen kennt die FwDV 500?',a:'<strong>Gefahrengruppe I:</strong> Tätigkeit ohne Sonderausrüstung möglich.<br><strong>Gefahrengruppe II:</strong> nur mit Sonderausrüstung, besonderer Überwachung und Dekontamination.<br><strong>Gefahrengruppe III:</strong> wie II, zusätzlich nur mit fachkundiger Person.<br><strong>Zusatzbuchstabe nach Stoffart:</strong> A radioaktiv, B biologisch, C chemisch (z. B. IIC).'},
  {id:'g71',cat:'GAL · GABC',q:'Wie unterscheiden sich Säuren und Laugen in ihren Wirkungen?',a:'<strong>Säuren (pH &lt; 7):</strong> protonabgebend, Koagulationsnekrose (Eiweißfällung), begrenzte Tiefenwirkung.<br><strong>Laugen/Basen (pH &gt; 7):</strong> protonaufnehmend, Kolliquationsnekrose (Einschmelzung), tiefe Wirkung – gefährlicher!<br><strong>Im Einsatz:</strong> nie Säure und Lauge zur Neutralisation mischen – mit Wasser spülen!'},
  {id:'g72',cat:'GAL · GABC',q:'Was ist die 4A-Regel im Strahlenschutz?',a:'<strong>A</strong>bstand halten (Intensität nimmt mit 1/r² ab).<br><strong>A</strong>ufenthaltsdauer begrenzen (Dosis = Dosisleistung × Zeit).<br><strong>A</strong>bschirmung nutzen (Blei, Beton, Wasser – je nach Strahlenart α/β/γ).<br><strong>A</strong>bschalten/Außerkontaktbringen (Quelle entfernen oder deaktivieren).<br>Je weiter weg, je kürzer, je abgeschirmt, desto besser.'},
  {id:'g73',cat:'GAL · GABC',q:'Was bedeuten die ADR-Verpackungsgruppen I, II und III?',a:'Klassifizierung nach Gefährlichkeitsgrad:<br><strong>Verpackungsgruppe I:</strong> sehr gefährlich – höchste Verpackungsanforderungen (z.B. CS2, Blausäure).<br><strong>Verpackungsgruppe II:</strong> gefährlich – mittlere Anforderungen (z.B. Benzol, konz. H2SO4).<br><strong>Verpackungsgruppe III:</strong> weniger gefährlich – geringste Anforderungen (z.B. Dieselkraftstoff).'},
  {id:'g74',cat:'GAL · Einsatztechnik',q:'Welche Verschäumungszahlen und Einsatzgebiete hat Schwer-, Mittel- und Leichtschaum?',a:'<strong>Schwerschaum (VZ &lt; 20):</strong> Schaumteppich auf Flüssigkeitsoberfläche – Brandklasse B (Tanklöschung).<br><strong>Mittelschaum (VZ 20–200):</strong> Kellerbrand, Hohlräume, Schachtabdichtung.<br><strong>Leichtschaum (VZ &gt; 200):</strong> Raumflutung (Tunnel, Schiffe, Lagerhallen), kaum feucht, geringes Gewicht.'},
  {id:'g75',cat:'GAL · Einsatztechnik',q:'Wie wirkt CO2 als Löschmittel und welche Grenzen hat es?',a:'<strong>Wirkung:</strong> Sauerstoffverdrängung (Erstickungseffekt) – ab ca. 30–35 Vol.-% CO2 erlischt das Feuer.<br><strong>Vorteile:</strong> rückstandsfrei, nicht leitfähig → ideal für EDV/Elektrik.<br><strong>Grenzen:</strong> kein Kühleffekt → Rückzündungsgefahr · Druckwelle schädigt Elektronik · nicht für Metall-, Fett- und Flächenbrände · Erstickungsgefahr für Menschen in geschlossenen Räumen.'},
  {id:'g76',cat:'GAL · Einsatztechnik',q:'Wie wirkt Pulver als Löschmittel und welche Arten gibt es?',a:'<strong>ABC-Pulver:</strong> Inhibition (Kettenabbruch) + Erstickung; für Brandklassen A (Oberflächeneffekt), B, C.<br><strong>BC-Pulver:</strong> Inhibition; für Flüssigkeits- und Gasbrände.<br><strong>D-Pulver:</strong> für Metallbrände (Na, Mg, Al) – bildet Schutzschicht.<br><strong>Nachteil aller Pulver:</strong> massive Verschmutzung, Sichtbehinderung, kein Kühleffekt – nie in EDV-Räumen.'},
  {id:'g77',cat:'GAL · PSA',q:'Welche Bestandteile umfasst die persönliche Schutzausrüstung (PSA) der Feuerwehr?',a:'Grundausstattung nach HuPF/DIN:<br><strong>1. Schutzjacke und -hose</strong> (HuPF Teil 1/2) – Hitzeschutz, Schnittfestigkeit.<br><strong>2. Schutzhandschuhe</strong> (EN 659) für Brandbekämpfung.<br><strong>3. Feuerwehrhelm</strong> (EN 443) mit Nackenschutz und Visier.<br><strong>4. Feuerwehrstiefel</strong> (EN 15090).<br><strong>5. Flammschutzhaube</strong> – schützt Gesicht/Hals beim Innenangriff.<br>Ergänzend: PA, CSA je nach Einsatz.'},
  {id:'g78',cat:'GAL · Leitern',q:'Welche Leiterarten kennt die Feuerwehr und was sind ihre Einsatzgrenzen?',a:'<strong>Steckleiter 4-tlg.:</strong> 8,4 m Gesamtlänge (1 A-Teil 9 Sprossen + 3 B-Teile je 7 Sprossen), Rettungshöhe ca. 8,9 m (2. OG), max. 2 Personen.<br><strong>Schiebleiter 3-tlg.:</strong> 14 m Einsatzlänge, Rettungshöhe 12,20 m (3. OG); Tragen und Aufstellen: 4 FA (2 Trupps).<br><strong>Hakenleiter:</strong> 4,4 m, 14 Sprossen (10 Steig + 3 Haken + 1 Deck), Stockwerküberwindung Fenster zu Fenster, 1 Person.<br><strong>Klappleiter:</strong> 3,0 m, 9 Sprossen, freistehend (A-Form), 1 Person.<br><strong>Drehleiter (DLK 23-12):</strong> 23 m Nennrettungshöhe (ca. 8. OG), motorisiert.<br>Sprossenabstand alle Leitern: 280 mm. Anlehnwinkel: 65–75°. Prüfung nach DGUV V 49 jährlich.'},
  {id:'g79',cat:'GAL · Maschinist',q:'Welche Aufgaben hat der Maschinist nach FwDV 3?',a:'<strong>Vor dem Ausrücken:</strong> Fahrzeugcheck (Fahrtüchtigkeit, Beladung).<br><strong>An der Einsatzstelle:</strong> Fahrzeug sichern, Pumpe aufbauen und betreiben (Druck halten, Tankstand überwachen).<br><strong>Wasserversorgung:</strong> Saugbetrieb aus Gewässer/Hydrant anlegen; Förderstrecken berechnen.<br><strong>Koordination:</strong> Kommunikation mit Gruppenführer/Wassertrupp; Einsatzstelle nur mit Auftrag verlassen.'},
  {id:'g80',cat:'GAL · Armaturen',q:'Welche Armaturen kennt die Feuerwehr und wofür dienen sie?',a:'<strong>Verteiler:</strong> B-Zulauf → 2 × C-Abgang; Durchflusssteuerung.<br><strong>Storz-Kupplung:</strong> genormte Schlauchkupplung (A/B/C/D-Größen), schnell kuppelbar.<br><strong>Sammelstück:</strong> 2 × B-Eingang → 1 × A-Ausgang; Mehrfachzuleitung Pumpe.<br><strong>Übergangsstück:</strong> zwischen verschiedenen Nennweiten.<br><strong>Druckbegrenzungsventil:</strong> schützt Schläuche vor Überdruck.'},
  {id:'g81',cat:'GAL · UVV',q:'Was regelt die DGUV Vorschrift 49 speziell für Feuerwehren?',a:'Zentrale Unfallverhütungsvorschrift für Feuerwehren:<br><strong>Pflichten der Gemeinde:</strong> sichere Arbeitsmittel, Unterweisungen, Prüfungen, PSA stellen.<br><strong>Prüffristen:</strong> Leitern/Hubrettungsgeräte jährlich · PA halbjährlich + nach Einsatz · Schutzkleidung nach Herstellerangabe.<br><strong>Besondere Regelungen:</strong> Mindestpersonalstärke, Sicherheitstrupp, Gefährdungsbeurteilung.'},
  {id:'g82',cat:'GAL · Staatsbürgerkunde',q:'Wie ist der Bundesstaat Deutschland aufgebaut (Föderalismus)?',a:'<strong>Vertikale Gewaltenteilung:</strong> Bund – Länder – Kommunen.<br><strong>Subsidiaritätsprinzip:</strong> untere Ebene löst Aufgaben selbst, soweit sie kann (Art. 28 GG).<br><strong>Bundesrat:</strong> Ländervertretung auf Bundesebene – Zustimmungsgesetze.<br><strong>Auftragsverwaltung:</strong> Länder vollziehen Bundesgesetze im Auftrag des Bundes (Art. 85 GG).<br>Vorteil: regionale Lösungen, Machtverteilung.'},
  {id:'g83',cat:'GAL · Staatsbürgerkunde',q:'Was ist kommunale Selbstverwaltung und welche Organe hat eine Gemeinde?',a:'Garantiert durch <strong>Art. 28 II GG</strong>: Gemeinden regeln eigene Angelegenheiten im Rahmen der Gesetze selbst.<br><strong>Gemeinderat/Stadtrat:</strong> gewähltes Hauptorgan, beschließt Satzungen und Haushalt.<br><strong>Bürgermeister/Landrat:</strong> Hauptverwaltungsbeamter, vollzieht Beschlüsse.<br><strong>Pflichtaufgaben:</strong> Brandschutz, Schule, Abwasser. <strong>Freiwillig:</strong> Kultur, Sport, Schwimmbad.'},
  {id:'g84',cat:'GAL · TH-Verkehr',q:'Welche Grundsätze gelten bei technischer Hilfeleistung nach Verkehrsunfällen?',a:'<strong>Erstmaßnahmen:</strong> Einsatzstelle sichern (Warndreieck 100/150/200 m), Zündung aus, Fahrzeug sichern.<br><strong>Patientenversorgung:</strong> ABCDE-Schema, Retter nicht gefährden.<br><strong>Taktisches Vorgehen:</strong> Beurteilung → Werkzeugzugang → Stabilisieren → patientenschonende Rettung (Dach weg, Türöffnung, Glasmanagement).<br>Regelwerk: FwDV 1 + vfdb-Richtlinie.'},
  {id:'g85',cat:'GAL · Kartenkunde',q:'Welche Koordinatensysteme werden im Feuerwehrdienst genutzt?',a:'<strong>UTM (Universal Transverse Mercator):</strong> internationaler Standard, 6°-Zonen, metrische Angabe (Easting/Northing).<br><strong>MGRS:</strong> militärisches Gitternetz auf UTM-Basis; kompakt (Buchstabenkennung + Ziffern).<br><strong>Gauß-Krüger:</strong> deutsches System (3°-Zonen, Rechts-/Hochwert), wird durch UTM ersetzt.<br><strong>WGS84:</strong> GPS-Referenzsystem (Dezimalgrad oder Grad/Min/Sek).'},
  {id:'g86',cat:'GAL · Personalvertretung',q:'Welche Beteiligungsrechte hat der Personalrat?',a:'<strong>Mitbestimmung (stärkstes Recht):</strong> Einstellung, Versetzung, BGM-Maßnahmen, Arbeitszeit, Urlaubsgrundsätze.<br><strong>Mitwirkung:</strong> Kündigung, Umsetzung, Beförderung.<br><strong>Anhörungsrecht:</strong> außerordentliche Kündigung.<br><strong>Informationsrecht:</strong> Haushaltspläne, Dienstvereinbarungen.<br>Rechtsgrundlagen: BPersVG (Bund), HPersVG (Hessen). Kein Weisungsrecht.'},
  {id:'g87',cat:'GAL · Einsatztechnik',q:'Wie wird eine Wärmebildkamera (WBK) eingesetzt und welche Grenzen hat sie?',a:'<strong>Einsatz:</strong> Personensuche im Rauch · Glutnestersuche nach Brand · Leckageortung (Gas/Wärme) · Nachlöschkontrolle.<br><strong>Grenzen:</strong> Flammen und Rauch blenden die Kamera · Glasscheiben/Folien blockieren IR-Strahlung (kein Durchsehen durch Glas) · kein Sehen durch Wände.<br>Immer ergänzend zum Trupp, nie als alleiniges Orientierungsmittel.'},
  {id:'g88',cat:'GAL · Atemschutz',q:'Wie werden Atemschutzgeräte grundsätzlich eingeteilt?',a:'<strong>Filtergeräte:</strong> reinigen Umgebungsluft – nur ab mind. 17 Vol.-% O2 und ohne IDLH (Immediately Dangerous to Life/Health).<br><strong>Behältergeräte:</strong> eigener Luftvorrat (PA mit Druckluftflasche).<br><strong>Schlauchanschlussgeräte:</strong> Luftzufuhr von außen per Schlauch (Werks-/Siloeinsatz).<br><strong>Regenerationsgeräte:</strong> Kreislauf (Atemkalk + O2-Nachspeisung) – bis 4 h Einsatzzeit.'},
  {id:'g89',cat:'GAL · Einsatztechnik',q:'Wie wird Wasser über lange Wegstrecken gefördert?',a:'<strong>B-Pendelverkehr:</strong> Tankwagen zwischen Entnahme und Einsatzstelle.<br><strong>Kettenbetrieb:</strong> mehrere Pumpen in Serie alle ~1.000 m.<br><strong>Offene B-Strecke:</strong> Schlauchleitung mit Zwischenpumpe; Druckverlust-Faustformel: 0,1 bar/100 m je 100 L/min.<br>Hohe Förderhöhe: Pumpenzwischendruck erhöhen; max. Schlauchbelastung PN 16 beachten.'},
  {id:'g90',cat:'GAL · Beamtenrecht',q:'Was sind Beurteilungen im Beamtenrecht und welche Rolle spielen sie?',a:'<strong>Regelbeurteilung:</strong> periodische Leistungsbewertung (alle 3–5 Jahre). Kategorien: Eignung, Befähigung, fachliche Leistung.<br><strong>Anlassbeurteilung:</strong> bei Beförderung, Versetzung oder Entlassung.<br><strong>Beförderung:</strong> Prinzip der Bestenauslese (Art. 33 II GG) – Eignung, Befähigung, fachliche Leistung maßgebend, nicht Dienstalter.<br>Beurteilungsspielraum des Dienstherrn, eingeschränkt gerichtlich überprüfbar.'}


];
// Eigene Karten aus dem Speicher dazunehmen
try{ JSON.parse(localStorage.getItem('bvi_fc_custom')||'[]').forEach(c=>{ if(c&&c.id&&c.q&&c.a) FLASHCARD_DATA.push({id:c.id,cat:c.cat,q:c.q,a:c.a,own:true}); }); }catch(e){}


/* ======================================================================
   PROGRESS – Lernfortschritt in LocalStorage
====================================================================== */
const PROGRESS = (function(){
  const GROUPS = {
    gal:  ['v-gal-organisation','v-gal-brandlehre','v-gal-fahrzeuge','v-gal-einsatz','v-gal-atemgifte','v-gal-atemschutz','v-gal-vb','v-gal-loeschlehre','v-gal-loeschmittel-schaum','v-gal-loeschwasserversorgung','v-gal-beamtenrecht','v-gal-beihilferecht','v-gal-brandbekaempfung','v-gal-einsatztechnik','v-gal-erstehilfe','v-gal-grundlagen','v-gal-fahrzeugnormung','v-gal-fuehrung','v-gal-fwdven','v-gal-gabc','v-gal-geraetepruefung','v-gal-hbkg','v-gal-kartenkunde','v-gal-knoten','v-gal-staatsbuerger','v-gal-th-verkehr','v-gal-leitern','v-gal-uvv','v-gal-waermebildkamera','v-gal-armaturen','v-gal-maschinist','v-gal-psa','v-gal-personalvertretungsrecht'],
    sfs:  ['v-sfs-fwdv3','v-sfs-methodik','v-sfs-rechtsgrundlagen','v-sfs-abc'],
    hlfs: ['v-hlfs-fuehrungsvorgang','v-hlfs-gabc','v-hlfs-tunnel','v-hlfs-vb','v-hlfs-manv','v-hlfs-zugfuehrer','v-hlfs-stab'],
    ibk:  ['v-ibk-ta','v-ibk-konflikt','v-ibk-stress','v-ibk-psnv','v-ibk-bgm','v-ibk-pm','v-ibk-zeit'],
    vak:  ['v-vak-jur-denken','v-vak-verwaltungsrecht','v-vak-staatsrecht','v-vak-einsatzrecht','v-vak-dienstrecht','v-vak-rettungsdienstrecht'],
    feuak:['v-feuak-vwl','v-feuak-haushalt','v-feuak-pm','v-feuak-bedarfsplanung','v-feuak-rdbp','v-feuak-katsbp','v-feuak-planspiel','v-feuak-qm','v-feuak-beschaffung','v-feuak-stakeholder','v-feuak-risikoanalyse'],
    idf:  ['v-idf-brandschutz','v-idf-stab','v-idf-presse'],
  };
  // Prüfungs-Karten (Quiz, Klausuren, Fallbearbeitung, Simulator): kein Haken, nicht im Fortschritt
  const EXAM_VIEWS = new Set(['v-vak-klausurvorbereitung','v-vak-altklausur','v-vak-klausurhinweise','v-vak-fallbearbeitung','v-feuak-altklausur','v-idf-altklausur','v-klausur','v-klausur-0826','v-klausurfragen','v-eingrenzung-klausur','v-simulator','v-laufbahn-2023','v-laufbahn-2026']);
  const LEAF_PARENT = {};
  Object.keys(GROUPS).forEach(g => GROUPS[g].forEach(v => { LEAF_PARENT[v] = g; }));

  function load(){ try{ return JSON.parse(localStorage.getItem('bvi_progress')||'{}'); }catch{ return {}; } }
  function save(d){ try{ localStorage.setItem('bvi_progress',JSON.stringify(d)); }catch{} }

  function track(viewId){
    if(!LEAF_PARENT[viewId]) return;
    const d = load(); d[viewId] = true; save(d);
    updateUI();
  }

  let _cardCache = null;

  // Sammelkacheln: Haken, sobald alle enthaltenen Themen besucht wurden
  const HUBS = {
    'v-feuak-bp-hub':['v-feuak-bedarfsplanung','v-feuak-rdbp','v-feuak-katsbp'],
    'v-feuak-analyse':['v-feuak-stakeholder','v-feuak-risikoanalyse']
  };

  function updateUI(){
    const visited = load();
    const allLeafs = Object.values(GROUPS).flat();
    const total = allLeafs.length;
    const done = allLeafs.filter(v=>visited[v]).length;

    if(!_cardCache) _cardCache = document.querySelectorAll('.topic-card');
    _cardCache.forEach(card => {
      const oc = card.getAttribute('onclick')||'';
      const m = oc.match(/NAV\.go\('([^']+)'/);
      if(!m) return;
      const vid = m[1];
      let chk = card.querySelector('.tc-check');
      if(EXAM_VIEWS.has(vid)){ if(chk) chk.remove(); return; }
      const hub = HUBS[vid];
      if(hub ? hub.every(v=>visited[v]) : visited[vid]){
        if(!chk){ chk = document.createElement('span'); chk.className='tc-check'; chk.textContent='✓'; card.style.position='relative'; card.appendChild(chk); }
      } else { if(chk) chk.remove(); }
    });
  }

  function counts(){ const v=load(),r={}; Object.keys(GROUPS).forEach(g=>{ r[g]={done:GROUPS[g].filter(x=>v[x]).length,total:GROUPS[g].length}; }); return r; }
  return { track, updateUI, counts, reset(){ localStorage.removeItem('bvi_progress'); updateUI(); } };
})();

/* ======================================================================
   SEARCH – Volltext-Suche über alle Views
====================================================================== */
const SEARCH = (function(){
  let idx = [], results = [], focusIdx = -1, _indexBuilt = false, _debounceTimer = null;
  const HIST_KEY='bvi_search_hist';
  function loadHist(){ try{ return JSON.parse(localStorage.getItem(HIST_KEY)||'[]'); }catch{ return []; } }
  function saveHist(q){ const h=loadHist().filter(x=>x!==q); h.unshift(q); localStorage.setItem(HIST_KEY,JSON.stringify(h.slice(0,5))); }

  const VIEW_LABELS = {
    'v-vak-altklausur':'VAk · Altklausur-Training',
    'v-gal-organisation':'GAL · Organisation','v-gal-brandlehre':'GAL · Brandlehre','v-gal-fahrzeuge':'GAL · Fahrzeuge','v-gal-einsatz':'GAL · Einsatz','v-gal-atemgifte':'GAL · Atemgifte','v-gal-atemschutz':'GAL · Atemschutz','v-gal-vb':'GAL · Vorbeugender Brandschutz','v-gal-beamtenrecht':'GAL · Beamtenrecht','v-gal-beihilferecht':'GAL · Beihilferecht','v-gal-brandbekaempfung':'GAL · Brandbekämpfung','v-gal-einsatztechnik':'GAL · Einsatztechnik','v-gal-erstehilfe':'GAL · Erste Hilfe','v-gal-grundlagen':'GAL · Naturwiss. Grundlagen','v-gal-fahrzeugnormung':'GAL · Fahrzeugnormung','v-gal-fuehrung':'GAL · Führung','v-gal-fwdven':'GAL · FwDVen','v-gal-gabc':'GAL · G-ABC Einsatz','v-gal-loeschlehre':'GAL · Löschlehre','v-gal-loeschmittel-schaum':'GAL · Löschmittel Schaum','v-gal-loeschwasserversorgung':'GAL · Löschwasserversorgung','v-gal-geraetepruefung':'GAL · Geräteprüfung','v-gal-hbkg':'GAL · HBKG','v-gal-kartenkunde':'GAL · Kartenkunde','v-gal-knoten':'GAL · Knoten & Stiche','v-gal-staatsbuerger':'GAL · Staatsbürgerkunde','v-gal-th-verkehr':'GAL · TH Verkehrsunfall','v-gal-leitern':'GAL · Tragbare Leitern','v-gal-uvv':'GAL · UVV','v-gal-waermebildkamera':'GAL · Wärmebildkamera','v-gal-armaturen':'GAL · Wasserführende Armaturen','v-gal-maschinist':'GAL · Maschinist','v-gal-psa':'GAL · Persönliche Schutzausrüstung','v-gal-personalvertretungsrecht':'GAL · Personalvertretungsrecht',
    'v-sfs-fwdv3':'SFS · Führung','v-sfs-methodik':'SFS · Methodik','v-sfs-rechtsgrundlagen':'SFS · Recht','v-sfs-abc':'SFS · Geräte/ABC',
    'v-hlfs-fuehrungsvorgang':'HLFS · Führungsvorgang','v-hlfs-gabc':'HLFS · GABC','v-hlfs-tunnel':'HLFS · Tunnel',
    'v-hlfs-vb':'HLFS · Vorbeugen','v-hlfs-manv':'HLFS · MANV','v-hlfs-zugfuehrer':'HLFS · Zugführer','v-hlfs-stab':'HLFS · Stab',
    'v-ibk-ta':'IBK · TA','v-ibk-konflikt':'IBK · Konflikt','v-ibk-stress':'IBK · Stress',
    'v-ibk-psnv':'IBK · PSNV','v-ibk-bgm':'IBK · BGM','v-ibk-pm':'IBK · PM','v-ibk-zeit':'IBK · Zeitmanagement',
    'v-vak-klausurvorbereitung':'VAk · Klausurvorbereitung','v-vak-jur-denken':'VAk · Juristisches Denken',
    'v-vak-verwaltungsrecht':'VAk · Allgemeines Verwaltungsrecht','v-vak-staatsrecht':'VAk · Staatsrecht',
    'v-vak-einsatzrecht':'VAk · Einsatzrecht','v-vak-dienstrecht':'VAk · Öffentliches Dienstrecht',
    'v-vak-klausurhinweise':'VAk · Klausurhinweise','v-vak-rettungsdienstrecht':'VAk · Rettungsdienstrecht','v-vak-fallbearbeitung':'VAk · Fallbearbeitung',
    'v-feuak-vwl':'FeuAK · VWL','v-feuak-haushalt':'FeuAK · Haushalt',
    'v-feuak-pm':'FeuAK · Strategisches Management',
    'v-feuak-bedarfsplanung':'FeuAK · Brandschutzbedarfsplanung',
    'v-feuak-rdbp':'FeuAK · RD-Bedarfsplanung',
    'v-feuak-katsbp':'FeuAK · KatS-Bedarfsplanung',
    'v-feuak-altklausur':'FeuAK · Altklausur-Training',
    'v-feuak-planspiel':'FeuAK · Planspiel MANV',
    'v-feuak-qm':'FeuAK · Qualitätsmanagement',
    'v-feuak-beschaffung':'FeuAK · Beschaffungspraxis',
    'v-feuak-stakeholder':'FeuAK · Stakeholder-Analyse',
    'v-feuak-risikoanalyse':'FeuAK · Prospektive Risikoanalyse',
    'v-idf-brandschutz':'IdF · Vorbeugender Brandschutz',
    'v-idf-stab':'IdF · Stabsarbeit',
    'v-idf-altklausur':'IdF · Altklausur-Quiz',
    'v-laufbahn-2023':'Laufbahnprüfung · Klausuren Dez 2023',
    'v-laufbahn-2026':'Laufbahnprüfung · Klausuren Juni 2026',
    'v-idf-presse':'IdF · Presse- & Öffentlichkeitsarbeit',
  };

  function stripHtml(s){ const d=document.createElement('div');d.innerHTML=s;return d.textContent||''; }

  // Nummer des Kapitels (Akkordeon-Abschnitt), in dem ein Element liegt; -1 = nicht in einem Kapitel
  function chOf(el){
    const d=el.closest('.acc-item'), v=el.closest('.view'); if(!d||!v) return -1;
    return [...v.querySelectorAll('.pc .acc-item')].indexOf(d);
  }
  function buildIndex(){
    if(_indexBuilt) return;
    _indexBuilt = true;
    idx = [];
    Object.keys(VIEW_LABELS).forEach(vid => {
      const el = document.getElementById(vid); if(!el) return;
      const lbl = VIEW_LABELS[vid];
      el.querySelectorAll('.sec-h,.tc-name,.page-title,.def-box-label').forEach(h => {
        const t = h.textContent.trim(); if(t.length < 3) return;
        idx.push({vid, lbl, title:t, snippet:'', boost:3, ch:chOf(h)});
      });
      el.querySelectorAll('.def-box p,.info-card p,.bl li,.step-desc,.hint p,.tc-sub,.ant-desc,.pillar ul li').forEach(p => {
        const t = p.textContent.trim(); if(t.length < 8) return;
        const hdr = p.closest('.info-card,.def-box,.step-item');
        const ttl = hdr ? (hdr.querySelector('.info-card-title,.def-box-label,.step-title')||{}).textContent||lbl : lbl;
        idx.push({vid, lbl, title:ttl.trim(), snippet:t.slice(0,400), boost:1, ch:chOf(p)});
      });
    });
    // Lernkarten in den Index aufnehmen
    FLASHCARD_DATA.forEach(c=>{
      const lbl='Lernkarten · '+c.cat;
      const aText=stripHtml(c.a);
      idx.push({vid:'v-flashcards',lbl,title:c.q,snippet:aText.slice(0,400),boost:2,isCard:true});
    });
  }

  // Attributwert für onclick="…" absichern (JSON enthält Anführungszeichen)
  const attr=t=>String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  // Treffer markieren, ohne HTML-Entitäten wie &amp; zu zerreißen
  function hl(text, q){
    const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
    return text.split(/(&(?:[a-z]+|#\d+);)/i).map((p,i)=>i%2?p:p.replace(re,'<mark>$1</mark>')).join('');
  }
  function contextSnippet(text, q, len=160){
    if(!text) return '';
    const terms=q.toLowerCase().split(/\s+/).filter(Boolean);
    const lower=text.toLowerCase();
    let best=-1;
    for(const t of terms){const p=lower.indexOf(t);if(p>=0&&(best<0||p<best))best=p;}
    if(best<0) return text.slice(0,len)+(text.length>len?'…':'');
    const start=Math.max(0,best-55);
    const end=Math.min(text.length,start+len);
    return(start>0?'…':'')+text.slice(start,end)+(end<text.length?'…':'');
  }

  // Umlaute und Akzente vereinheitlichen, damit „Ubung“ auch „Übung“ findet
  const norm=t=>String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ß/g,'ss');
  function lev(a,b,max){
    if(Math.abs(a.length-b.length)>max) return max+1;
    let prev=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      const cur=[i]; let rowMin=i;
      for(let j=1;j<=b.length;j++){
        cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
        if(cur[j]<rowMin) rowMin=cur[j];
      }
      if(rowMin>max) return max+1;
      prev=cur;
    }
    return prev[b.length];
  }
  // Tippfehler: ab 5 Buchstaben ein Fehler, ab 8 Buchstaben zwei Fehler erlaubt
  const wordsOf=t=>norm(t).split(/[^a-z0-9]+/).filter(x=>x.length>=4);
  function fuzzyIn(ws,t){
    if(t.length<5) return false;
    const max=t.length>=8?2:1;
    return ws.some(w=>lev(w,t,max)<=max);
  }
  function fuzzyHas(e,t){ return fuzzyIn(e.w||(e.w=wordsOf(e.title+' '+e.snippet)),t); }
  function noteEntries(){
    const out=[];
    try{
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(!k||!k.startsWith('bvi_note_')) continue;
        const text=(localStorage.getItem(k)||'').trim(); if(!text) continue;
        const vid=k.slice(9), lbl=VIEW_LABELS[vid]||vid;
        out.push({vid,lbl:'Notiz · '+lbl,title:text.split('\n')[0].slice(0,90),snippet:text.slice(0,400),boost:3,isNote:true});
      }
    }catch(e){}
    return out;
  }

  function doSearch(q){
    if(!q || q.length < 2) return [];
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const all = idx.concat(noteEntries());
    const hayOf=e=>e.h||(e.isNote?norm(e.title+' '+e.snippet+' '+e.lbl):(e.h=norm(e.title+' '+e.snippet+' '+e.lbl)));
    let scored = all.map(e => {
      const hay = hayOf(e);
      const score = terms.reduce((s,t) => s + (hay.includes(t) ? e.boost : 0), 0);
      return {...e, score};
    }).filter(e => e.score > 0);
    if(scored.length<4 && terms.some(t=>t.length>=5)){
      const have=new Set(scored.map(e=>e.vid+'|'+e.title));
      all.forEach(e=>{
        if(have.has(e.vid+'|'+e.title)) return;
        const hay=hayOf(e);
        const tw=wordsOf(e.title);
        const sc=terms.reduce((s,t)=>s+(hay.includes(t)?e.boost:(fuzzyHas(e,t)?e.boost*.6+(fuzzyIn(tw,t)?2:0):0)),0);
        if(sc>0) scored.push({...e,score:sc,fuzzy:true});
      });
    }
    scored.sort((a,b) => b.score-a.score);
    const seen = new Set();
    const uniq = scored.filter(e => { const k=e.vid+'|'+e.title; if(seen.has(k)) return false; seen.add(k); return true; });
    const pick=(f,n)=>uniq.filter(f).slice(0,n);
    return [
      ...pick(e=>e.isNote,4).map(e=>({...e,grp:'Notizen'})),
      ...pick(e=>!e.isCard&&!e.isNote,8).map(e=>({...e,grp:'Seiten und Themen'})),
      ...pick(e=>e.isCard,6).map(e=>({...e,grp:'Lernkarten'}))
    ];
  }

  // ── Kapitel der aktuellen Seite in der Suche ──
  function quick(q){
    const v=document.querySelector('.view.active'), vid=v&&v.id, out=[];
    const t=norm(q||'').trim();
    if(v){
      const its=[...v.querySelectorAll('.pc .acc-item')];
      its.forEach((d,i)=>{
        const ti=(d.querySelector('summary .acc-title,summary .acc-h')||d.querySelector('summary')).textContent.replace(/\s+/g,' ').trim();
        if(t?norm(ti).includes(t):i<8) out.push({grp:'Kapitel dieser Seite',lbl:String(i+1).padStart(2,'0'),title:ti,snippet:'',act:()=>LP.focus(vid,i),quick:true});
      });
    }
    return out.slice(0,t?14:16);
  }
  function quickHtml(items,q){
    let lastGrp='';
    return items.map((r,i)=>{
      const head=r.grp!==lastGrp?`<div class="sr-group">${r.grp}</div>`:''; lastGrp=r.grp;
      return head+`<div class="search-result" data-idx="${i}" onclick="SEARCH.go(${i})"><span class="sr-section">${xss(r.lbl)}</span><div><div class="sr-title">${q?hl(xss(r.title),q):xss(r.title)}</div></div></div>`;
    }).join('');
  }

  function renderBookmarks(){
    const el = document.getElementById('search-results'); if(!el) return;
    const bks = (typeof BOOKMARKS!=='undefined') ? BOOKMARKS.getAll() : [];
    const hist = loadHist();
    let html = '';
    if(bks.length) html+='<div class="bk-section"><div class="bk-section-title">⭐ Lesezeichen</div>'
      +bks.map(b=>`<div class="bk-item" onclick="SEARCH.goBk(${attr(JSON.stringify(b.id))},${attr(JSON.stringify(b.label||b.id))})">`
        +`<span class="bk-label">${xss(b.label||b.id)}</span>`
        +`<button class="bk-del" onclick="event.stopPropagation();SEARCH.removeBk(${attr(JSON.stringify(b.id))})" aria-label="Lesezeichen entfernen">✕</button>`
        +'</div>').join('')+'</div>';
    if(hist.length) html+='<div class="bk-section"><div class="bk-section-title">🕐 Zuletzt gesucht</div>'
      +hist.map(q=>`<div class="bk-item" onclick="SEARCH.runHist(${attr(JSON.stringify(q))})">`
        +`<span class="bk-label">${xss(q)}</span>`
        +`<button class="bk-del" onclick="event.stopPropagation();SEARCH.clearHist()" aria-label="Suchverlauf löschen">✕</button>`
        +'</div>').join('')+'</div>';
    if(!html) html='<div class="search-idle">Suchbegriff eingeben – z.&nbsp;B. <em>AVIVA</em>, <em>Glasl</em>, <em>MANV</em></div>';
    el.innerHTML=quickHtml(results,'')+html;
  }

  function render(q){
    const el = document.getElementById('search-results');
    if(!q){ results=quick(''); focusIdx=-1; renderBookmarks(); return; }
    results = [...quick(q), ...doSearch(q)];
    if(!results.length){ el.innerHTML='<div class="search-empty">Keine Treffer für <strong>'+xss(q)+'</strong></div>'; focusIdx=-1; return; }
    let lastGrp='';
    el.innerHTML = results.map((r,i)=>{
      const head=r.grp!==lastGrp?`<div class="sr-group">${r.grp}</div>`:''; lastGrp=r.grp;
      if(r.quick) return head+`<div class="search-result" data-idx="${i}" onclick="SEARCH.go(${i})"><span class="sr-section">${xss(r.lbl)}</span><div><div class="sr-title">${hl(xss(r.title),q)}</div></div></div>`;
      return head+`<div class="search-result" data-idx="${i}" onclick="SEARCH.go(${i})"><span class="sr-section">${xss(r.lbl)}</span><div><div class="sr-title">${hl(xss(r.title),q)}${r.fuzzy?' <i class="sr-fz">ähnlich</i>':''}</div>${r.snippet?`<div class="sr-snippet">${hl(xss(contextSnippet(r.snippet,q)),q)}</div>`:''}</div></div>`;
    }).join('');
    focusIdx = -1;
  }

  function setFocus(i){
    const items = document.querySelectorAll('#search-results .search-result');
    items.forEach(e=>e.classList.remove('sr-focus'));
    if(i>=0 && i<items.length){ items[i].classList.add('sr-focus'); items[i].scrollIntoView({block:'nearest'}); }
    focusIdx = i;
  }

  return {
    open(){
      buildIndex();
      document.getElementById('search-overlay').classList.remove('hidden');
      const inp = document.getElementById('search-input');
      inp.value = ''; inp.focus(); render('');
    },
    close(){ document.getElementById('search-overlay').classList.add('hidden'); results=[]; focusIdx=-1; },
    toggle(){ document.getElementById('search-overlay').classList.contains('hidden') ? this.open() : this.close(); },
    query(q){ clearTimeout(_debounceTimer); _debounceTimer = setTimeout(()=>render(q.trim()), 150); },
    goBk(id,label){ this.close(); NAV.go(id,label||id); },
    removeBk(id){ if(typeof BOOKMARKS!=='undefined') BOOKMARKS.remove(id); renderBookmarks(); },
    keydown(e){
      if(e.key==='Escape'){ this.close(); return; }
      if(e.key==='ArrowDown'){ e.preventDefault(); setFocus(Math.min(focusIdx+1,results.length-1)); return; }
      if(e.key==='ArrowUp'){ e.preventDefault(); setFocus(Math.max(focusIdx-1,0)); return; }
      if(e.key==='Enter' && focusIdx>=0){ this.go(focusIdx); return; }
    },
    go(i){
      const r = results[i]; if(!r) return;
      if(r.quick){ this.close(); setTimeout(r.act,60); return; }
      saveHist(document.getElementById('search-input').value.trim());
      this.close();
      const lbl = r.lbl.split('·').pop().trim();
      NAV.go(r.vid, lbl);
      if(r.ch>=0&&typeof LP!=='undefined') setTimeout(()=>LP.focus(r.vid,r.ch),80);
    },
    runHist(q){
      const inp=document.getElementById('search-input');
      if(inp){ inp.value=q; render(q); }
    },
    clearHist(){ localStorage.removeItem(HIST_KEY); renderBookmarks(); }
  };
})();

/* ======================================================================
   SETTINGS
====================================================================== */
/* ======================================================================
   TOAST
====================================================================== */
/* ======================================================================
   A11Y – Hilfen für Screenreader und Tastatur: Live-Ansage, Hauptbereich, Sprunglink
====================================================================== */
const A11Y=(function(){
  let t=0;
  return{
    // Text vorlesen lassen (höflich, unterbricht nichts); gleicher Text hintereinander wird erneut angesagt
    say(msg){ const el=document.getElementById('a11y-live'); if(!el) return; clearTimeout(t); el.textContent=''; t=setTimeout(()=>{ el.textContent=String(msg).replace(/<[^>]*>/g,'').trim(); },60); },
    // die sichtbare Seite ist der Hauptbereich (genau einer zur Zeit)
    onShow(){ document.querySelectorAll('.view[role="main"]').forEach(v=>v.removeAttribute('role')); const a=document.querySelector('.view.active'); if(a){ a.setAttribute('role','main'); a.setAttribute('aria-label',(a.querySelector('.page-title')?.textContent||'').trim()||'Inhalt'); } },
    skip(e){ e.preventDefault(); const a=document.querySelector('.view.active'); if(!a) return; a.setAttribute('tabindex','-1'); a.focus({preventScroll:false}); }
  };
})();

/* ======================================================================
   OVL – Fenster (Suche, Notiz, Pomodoro …): Fokus hinein und zurück, Tab bleibt im Fenster,
   Esc schließt nur das oberste, Zurück (Browser/Android) schließt das Fenster statt die Seite dahinter
====================================================================== */
const OVL=(function(){
  const DEFS={
    'search-overlay':()=>SEARCH.close(), 'shortcuts-overlay':()=>document.getElementById('shortcuts-overlay').classList.add('hidden'),
    'pomodoro-overlay':()=>POMO.close(), 'onboarding-overlay':()=>ONBOARD.close(),
    'quiz-mastery-modal':()=>QUIZ.closeMastery(), 'quiz-mastery-modal-idf':()=>IDFQ.closeMastery(),
    'notes-overlay':()=>NOTES.close(), 'changelog-modal':()=>CHANGELOG.close()
  };
  const order=[], opener={}; let skip=0;
  const el=id=>document.getElementById(id);
  const isOpen=id=>{ const e=el(id); return !!e&&!e.classList.contains('hidden'); };
  const top=()=>{ for(let i=order.length-1;i>=0;i--) if(isOpen(order[i])) return order[i]; return null; };
  const focusables=root=>[...root.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(e=>!e.disabled&&!e.hidden&&e.offsetParent!==null&&e.tabIndex>=0);
  function onChange(id){
    const e=el(id); if(!e) return;
    const open=isOpen(id), idx=order.indexOf(id);
    if(open&&idx<0){
      order.push(id); opener[id]=document.activeElement;
      setTimeout(()=>{ if(!isOpen(id)||e.contains(document.activeElement)) return; const f=focusables(e)[0]; if(f) f.focus({preventScroll:true}); },30);
    } else if(!open&&idx>=0){
      order.splice(idx,1); const o=opener[id]; delete opener[id];
      if(o&&o.isConnected&&o!==document.body&&!order.length) try{ o.focus({preventScroll:true}); }catch(err){}
    }
  }
  function init(){
    const mo=new MutationObserver(m=>m.forEach(r=>onChange(r.target.id)));
    Object.keys(DEFS).forEach(id=>{ const e=el(id); if(e){ mo.observe(e,{attributes:true,attributeFilter:['class']}); onChange(id); } });
    document.addEventListener('keydown',e=>{
      if(e.key!=='Tab') return;
      const t=top(); if(!t) return;
      const f=focusables(el(t)); if(!f.length) return;
      const a=document.activeElement, first=f[0], last=f[f.length-1];
      if(!el(t).contains(a)){ e.preventDefault(); first.focus(); }
      else if(e.shiftKey&&a===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey&&a===last){ e.preventDefault(); first.focus(); }
    },true);
  }
  return {
    init, top, any:()=>!!top(),
    closeTop(){ const t=top(); if(!t) return false; DEFS[t](); return true; },
    escape(e){ if(!OVL.closeTop()) return false; if(e) e.preventDefault(); return true; },
    // Browser-Zurück bei offenem Fenster: Fenster schließen und die Seite dahinter behalten
    onPop(e,depth){
      if(skip>0){ skip--; return true; }
      if(!OVL.closeTop()) return false;
      const n=(e.state&&e.state.stack)?e.state.stack.length:0;
      if(n<depth){ skip=1; try{ history.forward(); }catch(err){ skip=0; } }
      return true;
    }
  };
})();

// Zurück-Taste der Android-App: "handled" (Fenster/Kapitel geschlossen), "exit" (Startseite) oder "back"
window.bviBack=function(){
  if(typeof JGUI!=='undefined'&&JGUI.closeTop()) return 'handled';
  if(OVL.closeTop()) return 'handled';
  if(typeof LIGHTBOX!=='undefined'&&LIGHTBOX.isOpen()){ LIGHTBOX.close(); return 'handled'; }
  if(typeof LP!=='undefined'&&LP.isOpen()){ LP.back(); return 'handled'; }
  const v=document.querySelector('.view.active');
  return !v||v.id==='v-home'?'exit':'back';
};

const TOAST = (function(){
  let wrap;
  function container(){ if(!wrap){ wrap=document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); } return wrap; }
  return {
    show(msg, {type='',undo=null,duration=4200,label='Rückgängig'}={}){
      // gleiche Meldung nicht doppelt stapeln
      if([...container().querySelectorAll('.toast:not(.toast-out) .toast-msg')].some(e=>e.textContent===String(msg).replace(/<[^>]*>/g,''))) return;
      const t=document.createElement('div');
      t.className='toast'+(type?' toast-'+type:'');
      t.innerHTML=`<span class="toast-msg">${msg}</span>${undo?'<button class="toast-undo">'+label+'</button>':''}`;
      if(undo) t.querySelector('.toast-undo').addEventListener('click',()=>{ undo(); this.dismiss(t); });
      container().appendChild(t);
      A11Y.say(msg);
      t._timer=setTimeout(()=>this.dismiss(t),duration);
    },
    dismiss(t){
      clearTimeout(t._timer);
      t.classList.add('toast-out');
      t.addEventListener('animationend',()=>t.remove(),{once:true});
    }
  };
})();

const SETTINGS = (function(){
  return {
    resetTopics(){
      const snap=localStorage.getItem('bvi_progress');
      if(!confirm('Lernfortschritt wirklich zurücksetzen?')) return;
      PROGRESS.reset();
      TOAST.show('Themen-Fortschritt zurückgesetzt',{type:'ok',undo:()=>{ if(snap) localStorage.setItem('bvi_progress',snap); PROGRESS.updateUI(); }});
    },
    resetCards(){
      const snap=localStorage.getItem('bvi_fc');
      if(!confirm('Lernkarten-Lernstand wirklich zurücksetzen?')) return;
      localStorage.removeItem('bvi_fc');
      if(document.getElementById('v-flashcards').classList.contains('active')) FC.start();
      TOAST.show('Lernkarten zurückgesetzt',{type:'ok',undo:()=>{ if(snap) localStorage.setItem('bvi_fc',snap); }});
    },
    setFontSize(sz){
      document.documentElement.classList.remove('fs-sm','fs-lg','fs-xl');
      if(sz!=='md') document.documentElement.classList.add('fs-'+sz);
      localStorage.setItem('bvi_font_size',sz);
      this._restoreFsUI();
    },
    restoreFontSize(){ this.setFontSize(localStorage.getItem('bvi_font_size')||'md'); },
    _restoreFsUI(){
      const sz=localStorage.getItem('bvi_font_size')||'md';
      document.querySelectorAll('.fs-opt').forEach(b=>b.classList.toggle('active',b.dataset.sz===sz));
    },
    async toggleNotif(on){ if(typeof NOTIF!=='undefined') await NOTIF.setEnabled(on); },
    setNotifHour(h){ if(typeof NOTIF!=='undefined') NOTIF.setHour(h); }
  };
})();


/* ======================================================================
   NOTES – Seitennotizen (localStorage pro View)
====================================================================== */
const NOTES = (function(){
  let _view = null, _openKey = null, _prevNote = '', _undoTimer = null;
  const SKIP = new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz','v-plan','v-pruefung','v-settings','v-notizen']);
  function key(){ return _openKey||'bvi_note_'+(_view||'home'); }
  function getBtn(){
    if(!_view) return null;
    const v = document.getElementById(_view);
    return v ? v.querySelector('.page-notes-btn') : null;
  }
  function updateBtn(){
    const note = localStorage.getItem(key());
    const btn = getBtn();
    if(btn){
      btn.classList.toggle('pnb-active', !!note);
      const preview = btn.querySelector('.pnb-preview');
      if(preview) preview.textContent = note ? note.substring(0,80)+(note.length>80?'…':'') : 'Notiz hinzufügen…';
    }
    const has = !!(note && note.trim());
    document.getElementById('m-note')?.classList.toggle('fab-active', has);
  }
  function ensureWidget(){}
  return {
    setView(id){
      if(_openKey&&!document.getElementById('notes-overlay').classList.contains('hidden')) this.close();   // Text bleibt auf der Seite, auf der er geschrieben wurde
      _view = id; ensureWidget(); updateBtn();
    },
    open(){
      _openKey = 'bvi_note_'+(_view||'home');
      const ta = document.getElementById('notes-textarea');
      if(ta){ ta.value = localStorage.getItem(key())||''; if(!ta._live){ ta._live=true; ta.addEventListener('input',()=>{ if(_openKey){ if(ta.value.trim()) localStorage.setItem(_openKey,ta.value); else localStorage.removeItem(_openKey); } }); } }
      const lbl = document.getElementById('notes-page-lbl');
      if(lbl) lbl.textContent = document.querySelector('#'+_view+' .page-title')?.textContent?.trim()||'';
      document.getElementById('notes-overlay').classList.remove('hidden');
      if(ta) setTimeout(()=>ta.focus(),80);
    },
    close(){
      const ta = document.getElementById('notes-textarea');
      if(ta){ const v=ta.value.trim(); if(v) localStorage.setItem(key(),ta.value); else localStorage.removeItem(key()); }
      document.getElementById('notes-overlay').classList.add('hidden');
      _openKey = null;
      updateBtn();
    },
    toggle(){ document.getElementById('notes-overlay').classList.contains('hidden') ? this.open() : this.close(); },
    clear(){
      const ta=document.getElementById('notes-textarea'); if(!ta) return;
      _prevNote=ta.value;
      ta.value=''; localStorage.removeItem(key()); updateBtn();
      const bar=document.getElementById('notes-undo-bar');
      if(bar){ bar.style.display='flex'; bar.classList.remove('hidden'); clearTimeout(_undoTimer); _undoTimer=setTimeout(()=>bar.style.display='none',6000); }
    },
    undoClear(){
      const ta=document.getElementById('notes-textarea');
      const bar=document.getElementById('notes-undo-bar');
      if(ta&&_prevNote){ ta.value=_prevNote; localStorage.setItem(key(),_prevNote); updateBtn(); }
      if(bar) bar.style.display='none';
      clearTimeout(_undoTimer);
    },
    share(){
      const ta = document.getElementById('notes-textarea');
      const text = ta ? ta.value.trim() : '';
      if(!text){ TOAST.show('Keine Notiz zum Teilen'); return; }
      const title = 'Notiz – B VI Lernwebsite';
      if(navigator.share){
        navigator.share({title, text}).catch(()=>{});
      } else {
        navigator.clipboard.writeText(text)
          .then(()=>TOAST.show('In Zwischenablage kopiert',{type:'ok'}))
          .catch(()=>TOAST.show('Teilen nicht unterstützt'));
      }
    },
    exportAll(){
      const entries = [];
      for(const [k,v] of Object.entries(localStorage)){
        if(!k.startsWith('bvi_note_') || !v.trim()) continue;
        const id = k.replace('bvi_note_','');
        const label = id === 'home' ? 'Startseite' : id.replace(/^v-/,'').replace(/-/g,' ');
        entries.push('### '+label+'\n'+v.trim());
      }
      if(!entries.length){ TOAST.show('Keine Notizen vorhanden'); return; }
      FILES.save('bvi-notizen.txt','text/plain',entries.join('\n\n---\n\n'));
    }
  };
})();

/* ======================================================================
   BOOKMARKS – Lesezeichen (localStorage)
====================================================================== */
const BOOKMARKS = (function(){
  const KEY='bvi_bookmarks';
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } }
  function save(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch{} }
  function removeBk(id){ const d=load(),i=d.findIndex(b=>b.id===id); if(i>=0){d.splice(i,1);save(d);} }
  function syncFab(id){
    if(!id) return;
    const on=load().some(b=>b.id===id);
    document.getElementById('m-bm')?.classList.toggle('fab-active', on);
  }
  function renderPage(){
    const list=document.getElementById('bm-list');
    const empty=document.getElementById('bm-empty');
    if(!list) return;
    const d=load();
    if(!d.length){ list.innerHTML=''; empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');
    list.innerHTML='<div class="m-list">'+d.map(b=>{
      const eb=document.querySelector('#'+b.id+' .page-eyebrow')?.textContent?.trim()||'';
      return `<div class="m-row bm-row">
        <button class="bm-open" data-id="${xss(b.id)}" data-label="${xss(b.label||b.id)}"><span class="m-t1">${xss(b.label||b.id)}</span>${eb?`<span class="m-t2">${xss(eb)}</span>`:''}</button>
        <button class="bm-remove" data-id="${xss(b.id)}" aria-label="Lesezeichen entfernen"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>`;}).join('')+'</div>';
    list.querySelectorAll('.bm-open').forEach(btn=>{
      btn.addEventListener('click',()=>NAV.go(btn.dataset.id, btn.dataset.label));
    });
    list.querySelectorAll('.bm-remove').forEach(btn=>{
      btn.addEventListener('click',()=>{ removeBk(btn.dataset.id); renderPage(); });
    });
  }
  return {
    setView(id){ syncFab(id); if(id==='v-bookmarks') renderPage(); },
    toggle(id,label){
      if(!id) return;
      const d=load();
      const i=d.findIndex(b=>b.id===id);
      if(i>=0){ d.splice(i,1); TOAST.show('Lesezeichen entfernt'); }
      else { d.unshift({id,label:label||id}); TOAST.show('Lesezeichen gesetzt',{type:'ok'}); }
      save(d); syncFab(id);
    },
    getAll(){ return load(); },
    remove(id){ removeBk(id); },
    renderPage
  };
})();

/* ======================================================================
   LESEFORTSCHRITT
====================================================================== */
const NO_PROG = new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz','v-plan','v-pruefung','v-settings','v-notizen']);
function updateReadProgress(){
  const bar = document.getElementById('read-prog');
  const fill = document.getElementById('read-prog-fill');
  if(!bar||!fill) return;
  const active = document.querySelector('.view.active');
  const show = active && !NO_PROG.has(active.id);
  bar.classList.toggle('visible', show);
  if(!show){ fill.style.width='0%'; return; }
  const total = document.documentElement.scrollHeight - window.innerHeight;
  fill.style.width = (total>0 ? Math.min(100, window.scrollY/total*100) : 0)+'%';
}


/* ======================================================================
   CONFETTI
====================================================================== */
function launchConfetti(){
  let canvas = document.getElementById('confetti-canvas');
  if(!canvas){ canvas=document.createElement('canvas'); canvas.id='confetti-canvas'; document.body.appendChild(canvas); }
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const colors = ['#C9A84C','#E8C97A','#4ACD90','#6BAAD4','#E07070','#D4903A','#fff'];
  const particles = Array.from({length:120}, ()=>({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height - canvas.height,
    r: 4 + Math.random()*5,
    d: 2 + Math.random()*3,
    color: colors[Math.floor(Math.random()*colors.length)],
    tilt: Math.random()*10 - 5,
    tiltSpeed: 0.12 + Math.random()*0.1
  }));
  let frame=0, raf;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.y += p.d; p.tilt += p.tiltSpeed; p.x += Math.sin(frame*0.02)*1.2;
      ctx.beginPath(); ctx.fillStyle=p.color;
      ctx.ellipse(p.x+p.tilt,p.y,p.r*0.6,p.r,p.tilt*0.05,0,Math.PI*2);
      ctx.fill();
      if(p.y>canvas.height) p.y=-12;
    });
    frame++;
    if(frame<200) raf=requestAnimationFrame(draw); else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.remove(); }
  }
  if(raf) cancelAnimationFrame(raf);
  draw();
}

/* ======================================================================
   FC – Flashcard-Engine
====================================================================== */
const FC = (function(){
  const CATS = ['gal','sfs','hlfs','ibk','vak','feuak','idf'];
  let deck=[], curIdx=0, flipped=false, sess={known:0,unknown:0};
  let activeFilters = new Set(CATS);
  let _seen = [], _reviewPos = -1;

  const SR_DAYS = [0,1,3,7,14,30];

  function sm2(prev, quality){
    // quality: 0=nicht gewusst, 1=schwer, 2=gewusst
    let interval=prev.interval||1, ease=prev.ease||2.5, reps=prev.reps||0;
    if(quality===0) return {interval:1,ease,reps:0,nextReview:Date.now()+86400000};
    if(reps<=1) interval = quality===1 ? 3 : 7;
    else interval=Math.round(interval*ease);
    reps++;
    if(quality===1){ interval=Math.max(3,Math.round(interval*0.85)); ease=Math.max(1.3,ease-0.15); }
    else { ease=Math.min(2.5,ease+0.1); }
    interval=Math.max(1,Math.min(interval,365));
    return {interval,ease,reps,nextReview:Date.now()+interval*86400000};
  }

  function fcLoad(){
    try{
      const raw=JSON.parse(localStorage.getItem('bvi_fc')||'{}');
      const out={};
      for(const [k,v] of Object.entries(raw)){
        if(v===true) out[k]={interval:30,ease:2.5,reps:5,nextReview:0};
        else if(v && v.box!==undefined && v.interval===undefined)
          out[k]={interval:SR_DAYS[v.box]||1,ease:2.5,reps:v.box||0,nextReview:v.nextReview||0};
        else out[k]=v;
      }
      return out;
    }catch{ return {}; }
  }
  function fcSave(d){ try{ localStorage.setItem('bvi_fc',JSON.stringify(d)); }catch{} }
  function fcLoadStars(){ try{ return new Set(JSON.parse(localStorage.getItem('bvi_fc_stars')||'[]')); }catch{ return new Set(); } }
  function fcSaveStars(s){ try{ localStorage.setItem('bvi_fc_stars',JSON.stringify([...s])); }catch{} }
  function fcLoadWeak(){ try{ return new Set(JSON.parse(localStorage.getItem('bvi_fc_weak')||'[]')); }catch{ return new Set(); } }
  function fcSaveWeak(s){ try{ localStorage.setItem('bvi_fc_weak',JSON.stringify([...s])); }catch{} }
  function fcToggleStar(id){ const s=fcLoadStars(); if(s.has(id)) s.delete(id); else s.add(id); fcSaveStars(s); return s.has(id); }

  function getDeck(){
    if(activeFilters.has('starred')){
      const stars=fcLoadStars();
      return shuffle(FLASHCARD_DATA.filter(c=>stars.has(c.id)));
    }
    if(activeFilters.has('own')) return shuffle(FLASHCARD_DATA.filter(c=>c.own));
    if(activeFilters.has('weak')){
      const weak=fcLoadWeak();
      return shuffle(FLASHCARD_DATA.filter(c=>weak.has(c.id)));
    }
    const base = activeFilters.size===CATS.length ? [...FLASHCARD_DATA]
      : FLASHCARD_DATA.filter(c=>CATS.filter(f=>activeFilters.has(f)).some(f=>c.cat.toLowerCase().startsWith(f)));
    return shuffle(base);
  }

  function updateFilterButtons(){
    const known=fcLoad();
    const stars=fcLoadStars();
    const isStarred=activeFilters.has('starred')||activeFilters.has('weak')||activeFilters.has('own');
    const isWeak=activeFilters.has('weak');
    const isOwn=activeFilters.has('own');
    const ownN=FLASHCARD_DATA.filter(c=>c.own).length;
    const weakN=fcLoadWeak().size;
    const allSel=CATS.every(c=>activeFilters.has(c));
    const PRUEFUNG_CATS=['ibk','vak','feuak','idf'];
    const isPruefung=!isStarred&&PRUEFUNG_CATS.every(c=>activeFilters.has(c))&&activeFilters.size===PRUEFUNG_CATS.length;
    document.querySelectorAll('.fc-f-btn').forEach(b=>{
      const df=b.dataset.filter;
      const base=b.dataset.label||'';
      if(df==='all'){
        b.classList.toggle('active',allSel&&!isPruefung&&!isStarred);
        b.innerHTML=`<b>${base}</b><small>${FLASHCARD_DATA.length}</small>`;
      } else if(df==='starred'){
        b.classList.toggle('active',activeFilters.has('starred'));
        b.classList.toggle('hidden',stars.size===0&&!activeFilters.has('starred'));
        b.innerHTML=`<b>★ ${base}</b><small>${stars.size}</small>`;
      } else if(df==='own'){
        b.classList.toggle('active',isOwn);
        b.classList.toggle('hidden',ownN===0&&!isOwn);
        b.innerHTML=`<b>${base}</b><small>${ownN}</small>`;
      } else if(df==='weak'){
        b.classList.toggle('active',isWeak);
        b.classList.toggle('hidden',weakN===0&&!isWeak);
        b.innerHTML=`<b>${base}</b><small>${weakN}</small>`;
      } else if(df==='pruefung'){
        b.classList.toggle('active',isPruefung);
      } else if(df){
        const cats=FLASHCARD_DATA.filter(c=>c.cat.toLowerCase().startsWith(df));
        const knownCnt=cats.filter(c=>known[c.id]).length;
        b.classList.toggle('active',!allSel&&!isStarred&&activeFilters.has(df));
        b.innerHTML=`<b>${base}</b><small>${knownCnt}/${cats.length}</small>`;
      }
    });
  }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]; } return a; }

  function sizeCard(){
    const outer = document.querySelector('.fc-outer');
    if(!outer) return;
    let maxH = 0;
    outer.querySelectorAll('.fc-face').forEach(f => { maxH = Math.max(maxH, f.scrollHeight); });
    const capped = Math.max(Math.min(maxH, Math.floor(window.innerHeight * 0.72)), 180);
    outer.style.height = capped + 'px';
  }

  function setupSwipe(outer){
    if(!outer) return;
    let x0=0, y0=0, live=false, dx=0, pid=-1;
    const THR=80;
    const hOk=outer.querySelector('.fc-swipe-ok');
    const hNo=outer.querySelector('.fc-swipe-no');

    outer.addEventListener('pointerdown',e=>{
      x0=e.clientX; y0=e.clientY; live=true; dx=0; pid=e.pointerId;
      outer.setPointerCapture(e.pointerId);
    });

    outer.addEventListener('pointermove',e=>{
      if(!live||e.pointerId!==pid) return;
      dx=e.clientX-x0;
      const dy=e.clientY-y0;
      if(Math.abs(dy)>Math.abs(dx)+5){live=false;outer.style.transform='';return;}
      if(Math.abs(dx)<5) return;
      e.preventDefault();
      outer.style.transition='none';
      outer.style.transform=`translateX(${dx}px) rotate(${dx*0.06}deg)`;
      if(flipped){
        const p=Math.min(Math.abs(dx)/THR,1);
        hOk.style.opacity=dx>0?p:0; hNo.style.opacity=dx<0?p:0;
      }
    },{passive:false});

    outer.addEventListener('pointerup',e=>{
      if(e.pointerId!==pid||!live) return;
      live=false;
      outer.style.transition='';
      if(Math.abs(dx)<8){
        outer.style.transform=''; FC.flip();
      } else if(flipped&&Math.abs(dx)>=THR){
        const dir=dx>0?1:-1;
        outer.style.transition='transform .28s ease,opacity .28s ease';
        outer.style.transform=`translateX(${dir*window.innerWidth}px) rotate(${dir*25}deg)`;
        outer.style.opacity='0';
        setTimeout(()=>FC.answer(dx>0),260);
      } else {
        outer.style.transform=''; hOk.style.opacity='0'; hNo.style.opacity='0';
      }
    });

    outer.addEventListener('pointercancel',e=>{
      if(e.pointerId!==pid) return;
      live=false; outer.style.transform=''; outer.style.transition='';
      hOk.style.opacity='0'; hNo.style.opacity='0';
    });
  }

  function showSkeleton(){
    const box = document.getElementById('fc-container'); if(!box) return;
    box.innerHTML = `
      <div class="fc-skeleton-line fc-skeleton-stats"></div>
      <div class="fc-skeleton-line fc-skeleton-nav"></div>
      <div class="fc-skeleton-card"></div>
      <div class="fc-skeleton-ctrl">
        <div class="fc-skeleton-btn"></div>
        <div class="fc-skeleton-btn"></div>
      </div>`;
  }

  function renderCard(){
    const box = document.getElementById('fc-container'); if(!box) return;
    if(curIdx >= deck.length){ renderEnd(); return; }
    const card = deck[curIdx];
    const known = fcLoad();
    const card_e = known[card.id];
    const iVal=card_e?(card_e.interval||1):0;
    const ease_v=card_e?(card_e.ease||2.5):2.5;
    const reps_v=card_e?(card_e.reps||0):0;
    const iGood=reps_v>=2?Math.round(iVal*ease_v):7;
    const iHard=reps_v>=2?Math.max(3,Math.round(iVal*ease_v*0.85)):3;
    const stars=fcLoadStars();
    const isStarred=stars.has(card.id);
    box.innerHTML = `
      <div class="fc-nav">
        <button class="fc-back-btn" onclick="FC.back()" ${_seen.length===0?'disabled':''} aria-label="Vorherige Karte"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
        <span class="fc-pos">Karte ${curIdx+1} von ${deck.length}</span>
        <span class="fc-score">${sess.known} gewusst · ${sess.unknown} nochmal</span>
        <button class="fc-star-btn${isStarred?' starred':''}" onclick="FC.toggleStar('${card.id}')" aria-label="${isStarred?'Markierung entfernen':'Karte markieren'}"><svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg></button>
      </div>
      <div class="fc-progress"><i style="width:${deck.length?Math.round(curIdx/deck.length*100):0}%"></i></div>
      <div class="fc-outer">
        <div class="fc-inner" id="fc-inner">
          <div class="fc-face fc-front">
            <div class="fc-cat">${card.cat}</div>
            <div class="fc-q">${card.q}</div>
            <div class="fc-tap">Tippen zum Aufdecken</div>
          </div>
          <div class="fc-face fc-back">
            <div class="fc-cat">${card.cat}</div>
            <div class="fc-a">${card.a}</div>
          </div>
        </div>
        <div class="fc-swipe-ok">✓ Gewusst</div>
        <div class="fc-swipe-no">✗ Nicht gewusst</div>
      </div>
      <div class="fc-controls" id="fc-controls" style="display:none">
        <button class="fc-btn fc-no" onclick="FC.answer(false)">Nochmal<span class="fc-hint">gleich wieder</span></button>
        <button class="fc-btn fc-hard" onclick="FC.answer('hard')">Schwer<span class="fc-hint">in ${iHard} Tagen</span></button>
        <button class="fc-btn fc-yes" onclick="FC.answer(true)">Gewusst<span class="fc-hint">in ${iGood} Tagen</span></button>
      </div>`;
    flipped = false;
    requestAnimationFrame(()=>{ sizeCard(); setupSwipe(document.querySelector('.fc-outer')); });
  }

  function renderEnd(){
    const box = document.getElementById('fc-container'); if(!box) return;
    const known = fcLoad();
    const knownCnt = FLASHCARD_DATA.filter(c=>known[c.id]).length;
    if(deck.length===0){
      box.innerHTML=`<div class="fc-end"><div class="fc-end-ico">⭐</div><div class="fc-end-title">Keine Karten in dieser Auswahl</div><div class="fc-end-sub">Wähle eine andere Kategorie oder markiere zuerst Karten.</div><div style="display:flex;gap:.6rem;justify-content:center"><button class="btn btn-gold" onclick="FC.setFilter('all')">Alle Karten</button></div></div>`;
      return;
    }
    const pct = deck.length ? Math.round(sess.known/deck.length*100) : 0;
    const ico = pct>=80?'🏆':pct>=50?'📖':'🔄';
    const ttl = pct>=80?'Ausgezeichnet!':pct>=50?'Gut gemacht!':'Weiter üben!';
    if(pct>=80) launchConfetti();
    box.innerHTML = `
      <div class="fc-end">
        <div class="fc-end-ico">${ico}</div>
        <div class="fc-end-title">${ttl}</div>
        <div class="fc-end-sub">${sess.known} von ${deck.length} Karten gewusst (${pct}%).<br>Insgesamt <strong>${knownCnt}/${FLASHCARD_DATA.length}</strong> Begriffe dauerhaft gelernt.</div>
        <div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-gold" onclick="FC.start()">Neu mischen & wiederholen</button>
          <button class="btn btn-ghost" onclick="FC.resetKnown()">Lernstand zurücksetzen</button>
        </div>
      </div>`;
  }
  function renderReviewCard(){
    const box=document.getElementById('fc-container'); if(!box) return;
    const card=_seen[_reviewPos];
    const stars=fcLoadStars();
    const isStarred=stars.has(card.id);
    box.innerHTML=`
      <div class="fc-review-nav">
        <button class="fc-review-nav-btn" onclick="FC.back()" ${_reviewPos===0?'disabled':''}>← Ältere</button>
        <span class="fc-review-pos">Rückblick ${_reviewPos+1} / ${_seen.length}</span>
        <button class="fc-review-nav-btn" onclick="FC.forward()">Weiter →</button>
      </div>
      <div class="fc-review-card">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;">
          <span class="fc-review-badge">↩ Rückblick</span>
          <button class="fc-star-btn${isStarred?' starred':''}" onclick="FC.toggleStar('${card.id}')" title="${isStarred?'Markierung entfernen':'Markieren'}">⭐</button>
        </div>
        <div class="fc-cat">${card.cat}</div>
        <div class="fc-review-q">${card.q}</div>
        <hr class="fc-review-hr">
        <div class="fc-review-a">${card.a}</div>
      </div>
      <div style="text-align:center">
        <button class="btn btn-ghost" onclick="FC.forward()">↩ Zurück zur aktuellen Karte</button>
      </div>`;
  }

  return {
    start(){
      deck = getDeck(); curIdx=0; flipped=false; sess={known:0,unknown:0};
      _seen=[]; _reviewPos=-1;
      showSkeleton();
      setTimeout(renderCard, 320);
    },
    flip(){
      if(curIdx>=deck.length) return;
      flipped=!flipped;
      const inner=document.getElementById('fc-inner');
      const ctrl=document.getElementById('fc-controls');
      if(inner) inner.classList.toggle('flipped',flipped);
      if(ctrl) ctrl.style.display=flipped?'flex':'none';
    },
    // Karte außerhalb des Kartenstapels bewerten (z. B. im Übungs-Fenster neben der Lernseite)
    rateExternal(id,ok){
      const d=fcLoad();
      if(ok){ d[id]=sm2(d[id]||{},2); if(typeof STREAK!=='undefined') STREAK.record(); } else delete d[id];
      const weak=fcLoadWeak(); if(ok) weak.delete(id); else weak.add(id); fcSaveWeak(weak);
      fcSave(d); SHELL.renderFcSide();
    },
    answer(quality){
      if(!flipped||_reviewPos>=0) return;   // im Rückblick nicht die unsichtbare aktuelle Karte bewerten
      const q=quality===true?2:quality===false?0:1; // true=gut, false=wieder, 'hard'=schwer
      if(navigator.vibrate) navigator.vibrate(q>0?[30]:[20,50,20]);
      const card=deck[curIdx];
      _seen.push(card); _reviewPos=-1;
      const d=fcLoad();
      if(q===0){
        delete d[card.id]; sess.unknown++;
        const reps=card._reps||0;
        if(reps<2) deck.push(Object.assign({},card,{_reps:reps+1}));
      } else {
        d[card.id]=sm2(d[card.id]||{},q); sess.known++;
        if(typeof STREAK!=='undefined') STREAK.record();
      }
      const weak=fcLoadWeak(); if(q===2) weak.delete(card.id); else weak.add(card.id); fcSaveWeak(weak);
      fcSave(d); curIdx++; renderCard(); SHELL.renderFcSide();
    },
    setFilter(f){
      if(f==='starred'){
        activeFilters=activeFilters.has('starred')?new Set(CATS):new Set(['starred']);
      } else if(f==='own'){
        activeFilters=activeFilters.has('own')?new Set(CATS):new Set(['own']);
      } else if(f==='weak'){
        activeFilters=activeFilters.has('weak')?new Set(CATS):new Set(['weak']);
      } else if(f==='all'){
        activeFilters=new Set(CATS);
      } else if(f==='pruefung'){
        activeFilters=new Set(['ibk','vak','feuak','idf']);
        updateFilterButtons(); this.start(); return;
      } else {
        activeFilters.delete('starred'); activeFilters.delete('weak'); activeFilters.delete('own');
        if(activeFilters.size===CATS.length) activeFilters=new Set([f]);
        else if(activeFilters.has(f)){ activeFilters.delete(f); if(activeFilters.size===0) activeFilters=new Set(CATS); }
        else activeFilters.add(f);
      }
      updateFilterButtons();
      this.start();
    },
    back(){
      if(_seen.length===0) return;
      if(_reviewPos===-1) _reviewPos=_seen.length-1;
      else if(_reviewPos>0) _reviewPos--;
      else return;
      renderReviewCard();
    },
    forward(){
      if(_reviewPos===-1) return;
      _reviewPos++;
      if(_reviewPos>=_seen.length){ _reviewPos=-1; renderCard(); }
      else renderReviewCard();
    },
    toggleStar(id){
      const starred=fcToggleStar(id);
      const btn=document.querySelector('.fc-star-btn');
      if(btn) btn.classList.toggle('starred',starred);
      updateFilterButtons();
    },
    showWeak(){ activeFilters=new Set(['weak']); updateFilterButtons(); this.start(); },
    weakCount(){ return fcLoadWeak().size; },
    weakByModule(){
      const w=fcLoadWeak(), m={};
      FLASHCARD_DATA.forEach(c=>{ if(w.has(c.id)){ const k=c.cat.split(' · ')[0]; m[k]=(m[k]||0)+1; } });
      return m;
    },
    starCurrent(){
      const c=_reviewPos>=0?_seen[_reviewPos]:deck[curIdx];
      if(!c) return;
      this.toggleStar(c.id);
      TOAST.show(fcLoadStars().has(c.id)?'Karte markiert':'Markierung entfernt',{type:'ok'});
    },
    resetKnown(){
      const snap=localStorage.getItem('bvi_fc');
      if(!confirm('Lernkarten-Lernstand wirklich zurücksetzen?')) return;
      localStorage.removeItem('bvi_fc'); this.start();
      TOAST.show('Lernstand zurückgesetzt',{type:'ok',undo:()=>{ if(snap){ localStorage.setItem('bvi_fc',snap); this.start(); } }});
    },
    syncFilters(){ updateFilterButtons(); },
    resize(){ sizeCard(); },
    print(){
      const cards=[...new Map(getDeck().map(c=>[c.id,c])).values()];
      const rows=cards.map(c=>`<div class="pc"><div class="cat">${c.cat}</div><div class="q">${c.q}</div><hr/><div class="a">${c.a}</div></div>`).join('');
      const w=window.open('','_blank');
      if(!w){ TOAST.show('Das Druckfenster wurde blockiert – bitte Pop-ups erlauben'); return; }
      w.document.write(`<!DOCTYPE html><html><head><title>Lernkarten B VI</title><style>
        *{box-sizing:border-box;margin:0;padding:0;}body{font-family:sans-serif;padding:1rem;}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;}
        .pc{border:1px solid #ccc;border-radius:8px;padding:.85rem;page-break-inside:avoid;}
        .cat{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:.35rem;}
        .q{font-weight:700;font-size:.88rem;margin-bottom:.45rem;line-height:1.4;}
        hr{border:none;border-top:1px solid #eee;margin:.4rem 0;}
        .a{font-size:.78rem;color:#333;line-height:1.6;}
        @media print{.grid{grid-template-columns:1fr 1fr;}}
      </style></head><body><div class="grid">${rows}</div></body></html>`);
      w.document.close(); w.print();
    }
  };
})();

/* ======================================================================
   ABKÜRZUNGEN
====================================================================== */
const ABK = (function(){
  const DATA = [
    // Ausbildungseinrichtungen
    {s:'Ausbildungseinrichtungen',a:'GAL',f:'Grundausbildungslehrgang',d:'Basismodul der Laufbahnausbildung im höheren feuerwehrtechnischen Dienst'},
    {s:'Ausbildungseinrichtungen',a:'SFS',f:'Staatliche Feuerwehrschule Regensburg',d:'Bayerische Landesfeuerwehrschule, u.a. Gruppenführerlehrgang B3'},
    {s:'Ausbildungseinrichtungen',a:'HLFS',f:'Hessische Landesfeuerwehrschule',d:'Standort Kassel, Führungslehrgänge für BF und FF'},
    {s:'Ausbildungseinrichtungen',a:'IBK',f:'Institut für Brand- und Katastrophenschutz Heyrothsberge',d:'Sachsen-Anhalt; Lehrgang Führung, PSNV, BGM, Kommunikation'},
    {s:'Ausbildungseinrichtungen',a:'VAk',f:'Verwaltungsakademie Berlin',d:'Rechtliche und verwaltungsbezogene Ausbildungsmodule'},
    {s:'Ausbildungseinrichtungen',a:'FeuAK',f:'Feuerwehrakademie Hamburg',d:'Wirtschafts- und Managementlehrgänge für Führungskräfte'},
    {s:'Ausbildungseinrichtungen',a:'IdF',f:'Institut der Feuerwehr NRW',d:'Standort Münster; Brandschutz, Stabsarbeit, Öffentlichkeitsarbeit'},
    {s:'Ausbildungseinrichtungen',a:'BF',f:'Berufsfeuerwehr',d:'Hauptamtliche kommunale Feuerwehr'},
    {s:'Ausbildungseinrichtungen',a:'FF',f:'Freiwillige Feuerwehr',d:'Ehrenamtlich organisierte Feuerwehr'},
    {s:'Ausbildungseinrichtungen',a:'WF',f:'Werkfeuerwehr',d:'Betriebliche Feuerwehr in Unternehmen'},
    // Fahrzeuge
    {s:'Fahrzeuge',a:'LF',f:'Löschfahrzeug',d:'Genormtes Löschfahrzeug nach DIN 14530'},
    {s:'Fahrzeuge',a:'HLF',f:'Hilfeleistungslöschfahrzeug',d:'Kombinationsfahrzeug für Brand- und TH-Einsätze'},
    {s:'Fahrzeuge',a:'TLF',f:'Tanklöschfahrzeug',d:'Fahrzeug mit großem Löschwassertank, für wasserarme Gebiete'},
    {s:'Fahrzeuge',a:'DLK',f:'Drehleiter mit Korb',d:'Hubrettungsfahrzeug mit Rettungskorb, i.d.R. 23 m oder 32 m'},
    {s:'Fahrzeuge',a:'TM',f:'Teleskopmast',d:'Hubrettungsfahrzeug als Alternative zur DLK'},
    {s:'Fahrzeuge',a:'RW',f:'Rüstwagen',d:'Fahrzeug für technische Hilfeleistung, mit Seilwinde und Hebesatz'},
    {s:'Fahrzeuge',a:'GW',f:'Gerätewagen',d:'Transportfahrzeug für spezifische Ausrüstung (z.B. GW-G, GW-L, GW-Öl)'},
    {s:'Fahrzeuge',a:'ELW',f:'Einsatzleitwagen',d:'Führungsfahrzeug für den Einsatzleiter'},
    {s:'Fahrzeuge',a:'KdoW',f:'Kommandowagen',d:'Führungsfahrzeug für Führungskräfte (Pkw)'},
    {s:'Fahrzeuge',a:'MTW',f:'Mannschaftstransportwagen',d:'Transportfahrzeug für Personal und Material'},
    {s:'Fahrzeuge',a:'WLF',f:'Wechselladerfahrzeug',d:'Trägerfahrzeug für Abrollbehälter'},
    {s:'Fahrzeuge',a:'AB',f:'Abrollbehälter',d:'Wechselaufbau für WLF, z.B. AB-Schlauch, AB-Rüst, AB-Atemschutz'},
    {s:'Fahrzeuge',a:'MZF',f:'Mehrzweckfahrzeug',d:'Kleines Einsatzfahrzeug für vielfältige Aufgaben'},
    {s:'Fahrzeuge',a:'NEF',f:'Notarzteinsatzfahrzeug',d:'Pkw für den Notarzt zur schnellen Anfahrt'},
    {s:'Fahrzeuge',a:'RTW',f:'Rettungswagen',d:'Rettungsfahrzeug mit Intensivtransportmöglichkeit'},
    // Einsatztaktik
    {s:'Einsatztaktik & Organisation',a:'FwDV',f:'Feuerwehr-Dienstvorschrift',d:'Bundesweit gültige Vorschriften für den Feuerwehrdienst'},
    {s:'Einsatztaktik & Organisation',a:'FwDV 3',f:'FwDV 3 – Einheiten im Lösch- und Hilfeleistungseinsatz',d:'Regelt Taktik und Aufgaben von Staffel, Gruppe und Zug'},
    {s:'Einsatztaktik & Organisation',a:'TH',f:'Technische Hilfeleistung',d:'Einsatzart für nicht brennende Notlagen, z.B. Verkehrsunfall'},
    {s:'Einsatztaktik & Organisation',a:'MANV',f:'Massenanfall von Verletzten',d:'Besondere Einsatzlage mit vielen Verletzten; erfordert MANV-Konzept'},
    {s:'Einsatztaktik & Organisation',a:'VB',f:'Verbandsführung / Verband',d:'Taktische Einheit aus mehreren Zügen unter einem Verbandsführer'},
    {s:'Einsatztaktik & Organisation',a:'GABC',f:'Gefahren ABC',d:'Gefahrenklassen: Gefährliche Stoffe, Atomare, Biologische, Chemische Gefahren'},
    {s:'Einsatztaktik & Organisation',a:'ABC',f:'Atomare, Biologische, Chemische Gefahren',d:'Klassifizierung von Sonderschadenslagen'},
    {s:'Einsatztaktik & Organisation',a:'CBRN',f:'Chemical, Biological, Radiological, Nuclear',d:'Internationale Bezeichnung für ABC-Gefahrenlagen'},
    {s:'Einsatztaktik & Organisation',a:'GF',f:'Gruppenführer',d:'Führt eine Gruppe (1:8) im Einsatz'},
    {s:'Einsatztaktik & Organisation',a:'ZF',f:'Zugführer',d:'Führt einen Löschzug (mind. 2 Gruppen) im Einsatz'},
    {s:'Einsatztaktik & Organisation',a:'StF',f:'Staffelführer',d:'Führt eine Staffel (1:5) im Einsatz'},
    {s:'Einsatztaktik & Organisation',a:'Ma',f:'Maschinist',d:'Bedient und überwacht die feuerwehrtechnischen Geräte des Fahrzeugs'},
    {s:'Einsatztaktik & Organisation',a:'A-Tr',f:'Angriffstrupp',d:'Trupp zur Brandbekämpfung und Menschenrettung (unter PA)'},
    {s:'Einsatztaktik & Organisation',a:'W-Tr',f:'Wassertrupp',d:'Trupp zur Wasserversorgung und Sicherung des Angriffstrupps'},
    {s:'Einsatztaktik & Organisation',a:'S-Tr',f:'Sicherheitstrupp',d:'Trupp zur Sicherung und Rettung des Angriffstrupps'},
    {s:'Einsatztaktik & Organisation',a:'Schl-Tr',f:'Schlauchtrupp',d:'Trupp zur Herstellung der Wasserversorgung über längere Strecken'},
    {s:'Einsatztaktik & Organisation',a:'BOS',f:'Behörden und Organisationen mit Sicherheitsaufgaben',d:'Nutzer des Digitalfunks: Feuerwehr, Polizei, Rettungsdienst'},
    {s:'Einsatztaktik & Organisation',a:'ILS',f:'Integrierte Leitstelle',d:'Gemeinsame Leitstelle für Feuerwehr und Rettungsdienst'},
    {s:'Einsatztaktik & Organisation',a:'TETRA',f:'Terrestrial Trunked Radio',d:'Standard für den digitalen Behördenfunk (BOS-Digitalfunk)'},
    // Ausrüstung & Atemschutz
    {s:'Ausrüstung & Atemschutz',a:'PSA',f:'Persönliche Schutzausrüstung',d:'Gesamtheit der Schutzkleidung und -ausrüstung des Einsatzkräfte'},
    {s:'Ausrüstung & Atemschutz',a:'PA',f:'Pressluftatmer',d:'Atemschutzgerät mit Pressluft-Atemluft; Schutz gegen Atemgifte'},
    {s:'Ausrüstung & Atemschutz',a:'CSA',f:'Chemikalienschutzanzug',d:'Gasdichter Vollschutzanzug für Gefahrstoffeinsätze'},
    {s:'Ausrüstung & Atemschutz',a:'AS',f:'Atemschutz',d:'Oberbegriff für alle Maßnahmen zum Schutz der Atemwege'},
    {s:'Ausrüstung & Atemschutz',a:'ÜAS',f:'Atemschutzüberwachung',d:'Pflicht zur Überwachung von PA-Trägern im Einsatz (FwDV 7)'},
    {s:'Ausrüstung & Atemschutz',a:'UVV',f:'Unfallverhütungsvorschrift',d:'Vorschriften der Berufsgenossenschaften zur Unfallverhütung'},
    {s:'Ausrüstung & Atemschutz',a:'DGUV',f:'Deutsche Gesetzliche Unfallversicherung',d:'Dachverband der Berufsgenossenschaften und Unfallkassen'},
    // Brandlehre & Gefahrstoffe
    {s:'Brandlehre & Gefahrstoffe',a:'UEG',f:'Untere Explosionsgrenze',d:'Mindestkonzentration eines brennbaren Gases für eine Zündung'},
    {s:'Brandlehre & Gefahrstoffe',a:'OEG',f:'Obere Explosionsgrenze',d:'Maximalkonzentration eines brennbaren Gases für eine Zündung'},
    {s:'Brandlehre & Gefahrstoffe',a:'BLEVE',f:'Boiling Liquid Expanding Vapour Explosion',d:'Explosion eines überhitzten Druckbehälters mit siedender Flüssigkeit'},
    {s:'Brandlehre & Gefahrstoffe',a:'UVCE',f:'Unconfined Vapour Cloud Explosion',d:'Unkontrollierte Gaswolkenexplosion im Freien'},
    {s:'Brandlehre & Gefahrstoffe',a:'GHS',f:'Globally Harmonized System',d:'Weltweites System zur Einstufung und Kennzeichnung von Gefahrstoffen'},
    {s:'Brandlehre & Gefahrstoffe',a:'ADR',f:'Accord Dangereux Routier',d:'Europäisches Übereinkommen über den Straßentransport gefährlicher Güter'},
    {s:'Brandlehre & Gefahrstoffe',a:'GGVSEB',f:'Gefahrgutverordnung Straße, Eisenbahn und Binnenschifffahrt',d:'Nationales Recht für den Gefahrguttransport'},
    {s:'Brandlehre & Gefahrstoffe',a:'CO',f:'Kohlenmonoxid',d:'Farb- und geruchloses Atemgift; häufigstes Brandgas'},
    {s:'Brandlehre & Gefahrstoffe',a:'HCN',f:'Cyanwasserstoff (Blausäure)',d:'Hochtoxisches Gas bei Bränden von Kunststoffen und Wolle'},
    // Löschmittel
    {s:'Löschmittel',a:'AFFF',f:'Aqueous Film-Forming Foam',d:'Filmbildendes Schaummittel; legt Schutzfilm auf Flüssigkeitsoberfläche'},
    {s:'Löschmittel',a:'MBS',f:'Mehrbereichsschaummittel',d:'Universelles Schaummittel, erzeugt Leicht- bis Schwerschaum'},
    {s:'Löschmittel',a:'EBS',f:'Einbereichsschaummittel',d:'Schaummittel für einen definierten Verschäumungsbereich'},
    {s:'Löschmittel',a:'LP',f:'Leichtschaum',d:'Verschäumungszahl > 200; für Brandbekämpfung in geschlossenen Räumen'},
    {s:'Löschmittel',a:'MP',f:'Mittelschaum',d:'Verschäumungszahl 20–200; vielseitig einsetzbar'},
    {s:'Löschmittel',a:'SP',f:'Schwerschaum',d:'Verschäumungszahl < 20; für Flächenbrände (B-Brände)'},
    // Vorbeugender Brandschutz
    {s:'Vorbeugender Brandschutz',a:'MBO',f:'Musterbauordnung',d:'Modellbauordnung der Länder als Grundlage für die LBO'},
    {s:'Vorbeugender Brandschutz',a:'LBO',f:'Landesbauordnung',d:'Landesrechtliche Bauordnung mit Brandschutzanforderungen'},
    {s:'Vorbeugender Brandschutz',a:'BMA',f:'Brandmeldeanlage',d:'Automatische Anlage zur Branddetektion und Alarmierung'},
    {s:'Vorbeugender Brandschutz',a:'RWA',f:'Rauch- und Wärmeabzugsanlage',d:'Anlage zur Entrauchung bei Bränden in Gebäuden'},
    {s:'Vorbeugender Brandschutz',a:'SAA',f:'Sprachalarmanlage',d:'Anlage zur Evakuierungsdurchsage bei Brandgefahr'},
    {s:'Vorbeugender Brandschutz',a:'BSO',f:'Brandschutzordnung',d:'Regelwerk für Verhalten vor, während und nach einem Brand (Teil A–C)'},
    {s:'Vorbeugender Brandschutz',a:'VdS',f:'VdS Schadenverhütung',d:'Prüfinstitut für Brandschutz und Sicherheitstechnik'},
    {s:'Vorbeugender Brandschutz',a:'MLAR',f:'Muster-Lüftungsanlagen-Richtlinie',d:'Technische Anforderungen an Lüftungsanlagen im Brandschutz'},
    {s:'Vorbeugender Brandschutz',a:'VStättVO',f:'Versammlungsstättenverordnung',d:'Brandschutzanforderungen für Versammlungsstätten'},
    // Recht & Verwaltung
    {s:'Recht & Verwaltung',a:'GG',f:'Grundgesetz',d:'Verfassung der Bundesrepublik Deutschland'},
    {s:'Recht & Verwaltung',a:'BBG',f:'Bundesbeamtengesetz',d:'Regelt das Beamtenverhältnis auf Bundesebene'},
    {s:'Recht & Verwaltung',a:'BeamtStG',f:'Beamtenstatusgesetz',d:'Bundesrahmengesetz für den Status der Landesbeamten'},
    {s:'Recht & Verwaltung',a:'BHO',f:'Bundeshaushaltsordnung',d:'Vorschriften zur Aufstellung und Ausführung des Bundeshaushalts'},
    {s:'Recht & Verwaltung',a:'LHO',f:'Landeshaushaltsordnung',d:'Haushaltsrecht der Bundesländer'},
    {s:'Recht & Verwaltung',a:'VOB',f:'Vergabe- und Vertragsordnung für Bauleistungen',d:'Regelwerk für die Vergabe und Abwicklung von Bauaufträgen'},
    {s:'Recht & Verwaltung',a:'VgV',f:'Vergabeverordnung',d:'Umsetzung der EU-Vergaberichtlinien in nationales Recht'},
    {s:'Recht & Verwaltung',a:'HOAI',f:'Honorarordnung für Architekten und Ingenieure',d:'Regelt die Vergütung von Planungsleistungen'},
    {s:'Recht & Verwaltung',a:'TVöD',f:'Tarifvertrag für den öffentlichen Dienst',d:'Tarifrecht für Angestellte bei Bund und Kommunen'},
    {s:'Recht & Verwaltung',a:'BPersVG',f:'Bundespersonalvertretungsgesetz',d:'Mitbestimmungsrechte der Personalräte auf Bundesebene'},
    {s:'Recht & Verwaltung',a:'VwVfG',f:'Verwaltungsverfahrensgesetz',d:'Regelt das Verfahren der Behörden bei Verwaltungsentscheidungen'},
    {s:'Recht & Verwaltung',a:'VwGO',f:'Verwaltungsgerichtsordnung',d:'Verfahrensrecht für verwaltungsgerichtliche Klagen'},
    {s:'Recht & Verwaltung',a:'OVG',f:'Oberverwaltungsgericht',d:'Zweite Instanz der Verwaltungsgerichtsbarkeit der Länder'},
    {s:'Recht & Verwaltung',a:'BVerwG',f:'Bundesverwaltungsgericht',d:'Höchstes Gericht der allgemeinen Verwaltungsgerichtsbarkeit'},
    {s:'Recht & Verwaltung',a:'HBKG',f:'Hessisches Brand- und Katastrophenschutzgesetz',d:'Landesgesetz Hessen für Brandschutz und KatS (exemplarisch)'},
    // Psychosoziales & Führung
    {s:'Psychosoziales & Führung',a:'PSNV',f:'Psychosoziale Notfallversorgung',d:'Betreuung Betroffener und Einsatzkräfte nach belastenden Ereignissen'},
    {s:'Psychosoziales & Führung',a:'SbE',f:'Stressbearbeitung nach belastenden Einsätzen',d:'Strukturiertes Nachsorgeverfahren für Einsatzkräfte (Debriefing)'},
    {s:'Psychosoziales & Führung',a:'CISM',f:'Critical Incident Stress Management',d:'Internationales Konzept zur Einsatznachsorge und Prävention'},
    {s:'Psychosoziales & Führung',a:'PTBS',f:'Posttraumatische Belastungsstörung',d:'Psychische Störung nach extremen Belastungsereignissen'},
    {s:'Psychosoziales & Führung',a:'TA',f:'Transaktionsanalyse',d:'Psychologisches Modell zur Analyse von Kommunikation und Verhalten'},
    {s:'Psychosoziales & Führung',a:'BGM',f:'Betriebliches Gesundheitsmanagement',d:'Systematische Förderung von Gesundheit und Wohlbefinden im Betrieb'},
    {s:'Psychosoziales & Führung',a:'PM',f:'Projektmanagement',d:'Planung, Steuerung und Abschluss von zeitlich befristeten Vorhaben'},
    {s:'Psychosoziales & Führung',a:'SWOT',f:'Strengths, Weaknesses, Opportunities, Threats',d:'Stärken-Schwächen-Chancen-Risiken-Analyse im strategischen Management'},
    {s:'Psychosoziales & Führung',a:'SMART',f:'Spezifisch, Messbar, Attraktiv, Realistisch, Terminiert',d:'Methode zur Formulierung klarer Ziele'},
    {s:'Psychosoziales & Führung',a:'KVP',f:'Kontinuierlicher Verbesserungsprozess',d:'Dauerhaftes Streben nach Optimierung von Abläufen und Ergebnissen'},
    // Wirtschaft & Finanzen
    {s:'Wirtschaft & Finanzen',a:'VWL',f:'Volkswirtschaftslehre',d:'Wissenschaft von den gesamtwirtschaftlichen Zusammenhängen'},
    {s:'Wirtschaft & Finanzen',a:'BWL',f:'Betriebswirtschaftslehre',d:'Wissenschaft von den wirtschaftlichen Vorgängen in Unternehmen'},
    {s:'Wirtschaft & Finanzen',a:'KLR',f:'Kosten- und Leistungsrechnung',d:'Internes Rechnungswesen zur Erfassung von Kosten und Erlösen'},
    {s:'Wirtschaft & Finanzen',a:'ROI',f:'Return on Investment',d:'Kennzahl für die Rentabilität einer Investition'},
    {s:'Wirtschaft & Finanzen',a:'TCO',f:'Total Cost of Ownership',d:'Gesamtkosten über den gesamten Lebenszyklus eines Investitionsguts'},
    {s:'Wirtschaft & Finanzen',a:'EVA',f:'Earned Value Analysis',d:'Methode zur Projektfortschrittskontrolle durch Kostenwertanalyse'},
    {s:'Wirtschaft & Finanzen',a:'KGSt',f:'Kommunale Gemeinschaftsstelle für Verwaltungsmanagement',d:'Beratungsorganisation für kommunale Verwaltungen'},
    // Erste Hilfe & Rettung
    {s:'Erste Hilfe & Rettungsdienst',a:'HLW',f:'Herz-Lungen-Wiederbelebung',d:'Maßnahme bei Herz-Kreislauf-Stillstand (Thoraxkompression + Beatmung)'},
    {s:'Erste Hilfe & Rettungsdienst',a:'AED',f:'Automatischer Externer Defibrillator',d:'Gerät zur elektrischen Behandlung von Herzrhythmusstörungen'},
    {s:'Erste Hilfe & Rettungsdienst',a:'ABCDE',f:'Atemweg, Beatmung, Circulation, Disability, Exposure',d:'Systematischer Erstcheck nach Trauma- und Notfallalgorithmus'},
    {s:'Erste Hilfe & Rettungsdienst',a:'ERC',f:'European Resuscitation Council',d:'Europäischer Rat für Wiederbelebungsempfehlungen'},
    {s:'Erste Hilfe & Rettungsdienst',a:'NAW',f:'Notarztwagen',d:'Fahrzeug mit Notarzt und Rettungsassistent besetzt'},
    {s:'Erste Hilfe & Rettungsdienst',a:'KTW',f:'Krankentransportwagen',d:'Fahrzeug für nicht dringende Krankentransporte'},
    // Kartenkunde & Navigation
    {s:'Kartenkunde & Navigation',a:'UTM',f:'Universal Transverse Mercator',d:'Koordinatensystem für genaue Lageangaben auf topographischen Karten'},
    {s:'Kartenkunde & Navigation',a:'MGRS',f:'Military Grid Reference System',d:'Gitterkennzahl-Referenzsystem auf UTM-Basis'},
    {s:'Kartenkunde & Navigation',a:'GPS',f:'Global Positioning System',d:'US-amerikanisches satellitengestütztes Navigationssystem'},
    {s:'Kartenkunde & Navigation',a:'GIS',f:'Geographisches Informationssystem',d:'System zur Erfassung, Verwaltung und Analyse räumlicher Daten'},
    // Führung & Stabsarbeit
    {s:'Führung & Stabsarbeit',a:'FüGK',f:'Führungsgruppe Katastrophenschutz',d:'Führungsunterstützung auf Landkreisebene bei Großlagen'},
    {s:'Führung & Stabsarbeit',a:'GS',f:'Gemeinsamer Stab',d:'Gemeinsamer Führungsstab von BF/FF und KatS bei großen Einsatzlagen'},
    {s:'Führung & Stabsarbeit',a:'KatS',f:'Katastrophenschutz',d:'Staatliche Aufgabe: Schutz der Bevölkerung bei Großschadenlagen'},
    {s:'Führung & Stabsarbeit',a:'THW',f:'Technisches Hilfswerk',d:'Bundesbehörde für technische Nothilfe; ergänzt Feuerwehren bei Großlagen'},
    {s:'Führung & Stabsarbeit',a:'BBK',f:'Bundesamt für Bevölkerungsschutz und Katastrophenhilfe',d:'Koordiniert zivile Schutzmaßnahmen auf Bundesebene'},
    {s:'Führung & Stabsarbeit',a:'ICS',f:'Incident Command System',d:'Amerikanisches Führungssystem für Großlagen; Basis des NIMS'},
    {s:'Führung & Stabsarbeit',a:'NIMS',f:'National Incident Management System',d:'US-amerikanisches Rahmenwerk für standardisierte Einsatzführung'},
    {s:'Führung & Stabsarbeit',a:'SbE',f:'Stab für außergewöhnliche Ereignisse',d:'Katastrophenschutzstab der kommunalen Ebene'},
    {s:'Führung & Stabsarbeit',a:'UVP',f:'Umweltverträglichkeitsprüfung',d:'Behördliches Verfahren zur Bewertung von Umweltauswirkungen'},
    {s:'Führung & Stabsarbeit',a:'LÜKEX',f:'Länder- und Ressortübergreifende Krisenmanagementübung',d:'Bundesweite Stabsrahmenübung zur Stärkung des Krisenmanagements'},
    // Fahrzeuge (ergänzt)
    {s:'Fahrzeuge',a:'GW-AS',f:'Gerätewagen Atemschutz/Strahlenschutz',d:'Fahrzeug mit Reservegeräten und Technik für AS-Großlagen'},
    {s:'Fahrzeuge',a:'GW-L',f:'Gerätewagen Logistik',d:'Fahrzeug für Materialversorgung und Logistik im Einsatz'},
    {s:'Fahrzeuge',a:'GW-G',f:'Gerätewagen Gefahrgut',d:'Fahrzeug mit Spezialmittel und -ausrüstung für Gefahrstoffeinsätze'},
    {s:'Fahrzeuge',a:'ULF',f:'Unimog Löschfahrzeug',d:'Geländegängiges Löschfahrzeug auf Unimog-Basis'},
    {s:'Fahrzeuge',a:'FwDL',f:'Feuerwehrdrehleiter',d:'Ältere Bezeichnung für Drehleiter ohne Korb'},
    {s:'Fahrzeuge',a:'LF 10',f:'Löschgruppenfahrzeug 10',d:'Nach DIN 14530-5; Besatzung 1/8, Pumpe FPN 10-1000, 1.200 l Löschwasser'},
    {s:'Fahrzeuge',a:'HLF 20',f:'Hilfeleistungslöschgruppenfahrzeug 20',d:'Nach DIN 14530-27; 1.600 l Löschwasser, hydraulischer Rettungssatz'},
    // Ausrüstung & Atemschutz (ergänzt)
    {s:'Ausrüstung & Atemschutz',a:'FwDV 7',f:'FwDV 7 – Atemschutz',d:'Dienstvorschrift für Atemschutzeinsätze und Überwachungspflichten'},
    {s:'Ausrüstung & Atemschutz',a:'FwDV 1',f:'FwDV 1 – Grundtätigkeiten',d:'Dienstvorschrift für Lösch- und Hilfeleistungseinsätze (Truppmannausbildung)'},
    {s:'Ausrüstung & Atemschutz',a:'WBK',f:'Wärmebildkamera',d:'Infrarotkamera zur Lokalisierung von Personen und Brandherden'},
    {s:'Ausrüstung & Atemschutz',a:'PSA-ga',f:'PSA gegen Absturz',d:'Persönliche Schutzausrüstung gegen Absturz; Auffanggurt, Bandfalldämpfer'},
    // Recht & Verwaltung (ergänzt)
    {s:'Recht & Verwaltung',a:'BImSchG',f:'Bundesimmissionsschutzgesetz',d:'Schützt vor schädlichen Umwelteinwirkungen durch Luft, Lärm, Erschütterungen'},
    {s:'Recht & Verwaltung',a:'WHG',f:'Wasserhaushaltsgesetz',d:'Regelt den Schutz der Gewässer; Grundlage für Gewässerschutzeinsätze'},
    {s:'Recht & Verwaltung',a:'ChemG',f:'Chemikaliengesetz',d:'Regelwerk für Einstufung, Kennzeichnung und Schutzmaßnahmen bei Chemikalien'},
    {s:'Recht & Verwaltung',a:'SGB VII',f:'Sozialgesetzbuch VII – Gesetzliche Unfallversicherung',d:'Rechtliche Grundlage für Unfall- und Berufskrankheitenversicherung im öD'},
    {s:'Recht & Verwaltung',a:'GemO',f:'Gemeindeordnung',d:'Landesrechtliches Kommunalverfassungsgesetz; Grundlage kommunaler Feuerwehr'},
    {s:'Recht & Verwaltung',a:'VwZG',f:'Verwaltungszustellungsgesetz',d:'Regelt Zustellung von Verwaltungsakten und Bescheiden'},
    {s:'Recht & Verwaltung',a:'ROG',f:'Raumordnungsgesetz',d:'Bundesrahmengesetz für räumliche Gesamtplanung'},
    // Psychosoziales & Führung (ergänzt)
    {s:'Psychosoziales & Führung',a:'EAP',f:'Employee Assistance Program',d:'Betriebliches Hilfsangebot für psychische und soziale Belastungen'},
    {s:'Psychosoziales & Führung',a:'FüSt',f:'Führungsstil',d:'Art und Weise der Führung; transaktional, transformational, laissez-faire'},
    {s:'Psychosoziales & Führung',a:'MBO',f:'Management by Objectives',d:'Führungskonzept durch Zielvereinbarungen zwischen Führung und Mitarbeitern'},
    {s:'Psychosoziales & Führung',a:'OE',f:'Organisationsentwicklung',d:'Geplanter Wandel in Organisationen durch Lernprozesse und Partizipation'},
    {s:'Psychosoziales & Führung',a:'TZI',f:'Themenzentrierte Interaktion',d:'Gruppenarbeitsmethode von Ruth Cohn; Ich – Wir – Es – Globe'},
    // Einsatztaktik (ergänzt)
    {s:'Einsatztaktik & Organisation',a:'AVIVA',f:'Ankommen, Verschaffen, Informieren, Vorgehen, Abschließen',d:'Phasenmodell für den Lehrauftrag/Unterrichtsplanung; auch Einsatzführung'},
    {s:'Einsatztaktik & Organisation',a:'FüGr',f:'Führungsgruppe',d:'Stabselement zur Unterstützung der Einsatzleitung bei Großlagen'},
    {s:'Einsatztaktik & Organisation',a:'ELW 2',f:'Einsatzleitwagen 2',d:'Größerer Führungskomponenten-Einsatzleitwagen für Großschadenslagen'},
    {s:'Einsatztaktik & Organisation',a:'SEG',f:'Schnelleinsatzgruppe',d:'Vorbereitete Einheit für rasch verfügbaren Einsatz (z.B. SEG-San, SEG-Bet)'},
    {s:'Einsatztaktik & Organisation',a:'KFZ',f:'Kraftfahrzeug',d:'Allgemeine Bezeichnung für motorisierte Fahrzeuge im Feuerwehrbereich'},
    {s:'Einsatztaktik & Organisation',a:'TEL',f:'Technische Einsatzleitung',d:'Örtliche Führungsebene bei großen Schadenslagen'},
    {s:'Einsatztaktik & Organisation',a:'FwDV 100',f:'FwDV 100 – Führung und Leitung im Einsatz',d:'Grundlegende Dienstvorschrift für Führungsorganisation und Führungsvorgang'},
    // Hilfsorganisationen
    {s:'Hilfsorganisationen',a:'HiOrg',f:'Hilfsorganisation',d:'Oberbegriff für DRK, MHD, JUH, ASB, DLRG im Rettungsdienst und KatS'},
    {s:'Hilfsorganisationen',a:'DRK',f:'Deutsches Rotes Kreuz',d:'Hilfsorganisation; Träger des Rettungsdienstes in vielen Bundesländern'},
    {s:'Hilfsorganisationen',a:'BRK',f:'Bayerisches Rotes Kreuz',d:'Landesverband des DRK in Bayern; Träger von Rettungsdienst und KatS'},
    {s:'Hilfsorganisationen',a:'MHD',f:'Malteser Hilfsdienst',d:'Hilfsorganisation; Rettungsdienst, PSNV und Betreuungsdienste'},
    {s:'Hilfsorganisationen',a:'JUH',f:'Johanniter-Unfall-Hilfe',d:'Hilfsorganisation; Rettungsdienst und Betreuungsdienste'},
    {s:'Hilfsorganisationen',a:'ASB',f:'Arbeiter-Samariter-Bund',d:'Hilfsorganisation; Rettungsdienst und Katastrophenschutz'},
    {s:'Hilfsorganisationen',a:'DLRG',f:'Deutsche Lebens-Rettungs-Gesellschaft',d:'Wasserrettungsorganisation; Küstenrettung und Einsatzunterstützung'},
    // MANV & Massenanfall
    {s:'MANV & Massenanfall',a:'LNA',f:'Leitender Notarzt',d:'Ärztliche Einsatzleitung bei MANV; koordiniert alle medizinischen Maßnahmen'},
    {s:'MANV & Massenanfall',a:'OrgL',f:'Organisatorischer Leiter Rettungsdienst',d:'Nicht-ärztliche Führungskraft bei MANV; koordiniert Rettungskräfte'},
    {s:'MANV & Massenanfall',a:'BHP',f:'Behandlungsplatz',d:'Ort der medizinischen Erstversorgung bei MANV, unterteilt in Sichtungskategorien'},
    {s:'MANV & Massenanfall',a:'VSt',f:'Verletztensammelstelle',d:'Sammelpunkt für Verletzte vor Triage und Zuweisung zum BHP'},
    {s:'MANV & Massenanfall',a:'BTrp',f:'Betreuungsplatz',d:'Anlaufstelle für unverletzt-betroffene Personen nach MANV oder KatS'},
    {s:'MANV & Massenanfall',a:'DEKON-P',f:'Dekontaminationsplatz Personen',d:'Einrichtung zur Personendekontamination bei ABC-Lagen'},
    {s:'MANV & Massenanfall',a:'DEKON-G',f:'Dekontaminationsplatz Geräte',d:'Einrichtung zur Gerätedekontamination bei ABC-Lagen'},
    {s:'MANV & Massenanfall',a:'SK I-IV',f:'Sichtungskategorien I–IV',d:'I = sofort lebensrettend (rot) · II = dringend (gelb) · III = abwartend (grün) · IV = verstorben (schwarz)'},
    {s:'MANV & Massenanfall',a:'NA',f:'Notarzt',d:'Arzt mit notfallmedizinischer Zusatzausbildung; Einsatz an der Einsatzstelle'},
    {s:'MANV & Massenanfall',a:'RD',f:'Rettungsdienst',d:'Öffentliche Aufgabe zur präklinischen Notfallversorgung und zum Transport'},
    {s:'MANV & Massenanfall',a:'SEG-San',f:'Schnell-Einsatz-Gruppe Sanität',d:'Vorbereitete Gruppe der HiOrg für schnelle Unterstützung bei MANV'},
    {s:'MANV & Massenanfall',a:'SEG-Bet',f:'Schnell-Einsatz-Gruppe Betreuung',d:'Gruppe zur psychosozialen Betreuung und Versorgung Betroffener'},
    // Digitalfunk & Kommunikation
    {s:'Digitalfunk & Kommunikation',a:'FMS',f:'Fahrzeugmeldesystem',d:'Statusmeldungen im BOS-Funk: Status 1–8 (einsatzbereit, Anfahrt, Einsatzstelle …)'},
    {s:'Digitalfunk & Kommunikation',a:'TMO',f:'Trunked Mode Operation',d:'Netzbetrieb über TETRA-Basisstationen (Normalbetrieb BOS-Digitalfunk)'},
    {s:'Digitalfunk & Kommunikation',a:'DMO',f:'Direct Mode Operation',d:'Direktbetrieb Gerät zu Gerät ohne Netz; bei Netzausfall oder in Gebäuden'},
    {s:'Digitalfunk & Kommunikation',a:'HRT',f:'Hand Radio Terminal',d:'Tragbares TETRA-Digitalfunkgerät (Handfunkgerät) für Einsatzkräfte'},
    {s:'Digitalfunk & Kommunikation',a:'MRT',f:'Mobile Radio Terminal',d:'Im Fahrzeug fest eingebautes TETRA-Digitalfunkgerät'},
    {s:'Digitalfunk & Kommunikation',a:'GAN',f:'Gemeinsamer Ansatz Netzsteuerung',d:'Abstimmungsverfahren beim länderübergreifenden TETRA-BOS-Netz'},
    {s:'Digitalfunk & Kommunikation',a:'FuG',f:'Funkgerät',d:'Allgemeine Bezeichnung für ein Sende- und Empfangsgerät im Feuerwehrdienst'},
    {s:'Digitalfunk & Kommunikation',a:'EZV',f:'Einsatzstellenverteiler',d:'Anschlussverteiler für Signalleitungen und Kommunikation an der Einsatzstelle'},
    // Brandmeldetechnik
    {s:'Brandmeldetechnik',a:'BMZ',f:'Brandmeldezentrale',d:'Empfängt und verarbeitet Meldungen aller Brandmelder eines Objekts'},
    {s:'Brandmeldetechnik',a:'ÜE',f:'Übertragungseinrichtung',d:'Gerätetechnik zur Übertragung von BMA-Alarmen zur Leitstelle'},
    {s:'Brandmeldetechnik',a:'FBF',f:'Feuerwehr-Bedienfeld',d:'Bedienfeld für die Feuerwehr zur Steuerung der BMA und angeschlossener Anlagen'},
    {s:'Brandmeldetechnik',a:'FAT',f:'Feuerwehr-Anzeigetableau',d:'Zeigt der Feuerwehr Detailinformationen zur ausgelösten Meldergruppe'},
    {s:'Brandmeldetechnik',a:'FSD',f:'Feuerwehr-Schlüsseldepot',d:'Geprüfter Safe für Objektschlüssel; Zugang durch ILS-Alarmierung'},
    {s:'Brandmeldetechnik',a:'TAB',f:'Technische Anschlussbedingungen',d:'Örtliche Aufschaltbedingungen der Feuerwehr/ILS für BMA-Anlagen'},
    {s:'Brandmeldetechnik',a:'ELA',f:'Elektroakustische Anlage',d:'Anlage zur Alarmierung und Durchsage; oft kombiniert mit Sprachalarmanlagen'},
    {s:'Brandmeldetechnik',a:'MG',f:'Meldergruppe',d:'Zusammenfassung mehrerer Brandmelder zu einer adressierten Gruppe in der BMZ'},
    {s:'Brandmeldetechnik',a:'RAS',f:'Rauchansaugsystem',d:'Frühdetektionssystem mit aktiver Luftprobenentnahme; für Serverräume und Reinräume'},
    // Fahrzeuge – DIN 14011:2018 Ergänzungen
    {s:'Fahrzeuge',a:'MLF',f:'Mittleres Löschfahrzeug',d:'Löschfahrzeug mittlerer Größe nach DIN 14530-26; Besatzung 1:5, mind. 800 l Tank'},
    {s:'Fahrzeuge',a:'KLF',f:'Kleinlöschfahrzeug',d:'Kompaktes Löschfahrzeug nach DIN 14530-23; für beengte Verhältnisse und kleine FF'},
    {s:'Fahrzeuge',a:'TSF',f:'Tragkraftspritzenfahrzeug',d:'Fahrzeug zur Beförderung einer Tragkraftspritze (TS 8/8) und Mannschaft (1:5)'},
    {s:'Fahrzeuge',a:'TSF-W',f:'Tragkraftspritzenfahrzeug-Wasser',d:'TSF mit eingebautem Löschwassertank (750–1000 l); für wasserarme Gebiete'},
    {s:'Fahrzeuge',a:'HAB',f:'Hubarbeitsbühne',d:'Fahrzeug mit Arbeitsbühne zur Rettung und technischen Arbeit in der Höhe (kein Rettungskorb)'},
    {s:'Fahrzeuge',a:'SW',f:'Schlauchwagen',d:'Fahrzeug zur Beförderung großer Schlauchlängen (bis 2000 m B-Schlauch) für Fernwasserversorgung'},
    {s:'Fahrzeuge',a:'RTB',f:'Rettungsboot',d:'Boot für die Wasserrettung; einsatzbereit auf Trailer oder fest verlastet auf Fahrzeug'},
    {s:'Fahrzeuge',a:'MZB',f:'Mehrzweckboot',d:'Vielseitig einsetzbares Boot für Wasserrettung, Einsatztaucher und Materialversorgung'},
    // Ausrüstung & Atemschutz – DIN 14011:2018 Ergänzungen
    {s:'Ausrüstung & Atemschutz',a:'ASG',f:'Atemschutzgerät',d:'Oberbegriff für alle Geräte zum Schutz der Atemwege nach DIN 14011 (Abschn. 3.4.4)'},
    {s:'Ausrüstung & Atemschutz',a:'STK',f:'Schlauchtragekorb',d:'Korb zum Transport und geordneter Lagerung von Druckschläuchen (B- und C-Schlauch)'},
    {s:'Ausrüstung & Atemschutz',a:'EHZ',f:'Einfach wirkender Hydraulikzylinder',d:'Hydraulisches Hubgerät für technische Hilfeleistung (Teil des hydraulischen Rettungssatzes)'},
    // Vorbeugender Brandschutz – DIN 14011:2018 Ergänzungen
    {s:'Vorbeugender Brandschutz',a:'MRA',f:'Maschinelle Rauchabzugsanlage',d:'Aktive Entrauchungsanlage mit Ventilatoren; Unterform der RWA nach DIN EN 12101'},
    {s:'Vorbeugender Brandschutz',a:'NRA',f:'Natürliche Rauchabzugsanlage',d:'Passive Entrauchung durch Thermik und natürlichen Auftrieb; Unterform der RWA'},
    // Brandmeldetechnik – DIN 14011:2018 Ergänzungen
    {s:'Brandmeldetechnik',a:'FGB',f:'Feuerwehr-Gebäudefunkbedienfeld',d:'Bedienfeld zur Steuerung der Gebäudefunkanlage durch die Feuerwehr (DIN VDE 0800-174)'},
    // Einsatztaktik – DIN 14011:2018 Ergänzungen
    {s:'Einsatztaktik & Organisation',a:'BuK',f:'Brand unter Kontrolle',d:'Lagermeldung nach DIN 14011 (3.2.6.8): Ausbreitung des Brandes ist gestoppt'},
    // Löschmittel – DIN 14011:2018 Ergänzungen
    {s:'Löschmittel',a:'DZA',f:'Druckzumischanlage',d:'Fest installierte Anlage zur Zumischung von Schaummittel in den Löschwasserstrom'},
    {s:'Löschmittel',a:'DLS',f:'Druckluftschaumanlage',d:'Anlage zur Erzeugung von Druckluftschaum (CAFS); erhöhter Löscheffekt bei geringerem Wasserverbrauch'},
  ];

  let rendered = false;
  return {
    render(){
      if(rendered) return;
      const cards = document.getElementById('abk-cards');
      if(!cards) return;
      rendered = true;
      const sections = [...new Set(DATA.map(d=>d.s))];
      cards.innerHTML = sections.map(sec=>{
        const rows = DATA.filter(d=>d.s===sec).sort((a,b)=>a.a.localeCompare(b.a));
        return `<div class="abk-c-grp" data-sec="${sec}"><div class="abk-c-sec">${sec}</div><div class="abk-c-list">`
          + rows.map(r=>`<div class="abk-card" data-sec="${sec}" data-search="${(r.a+' '+r.f+' '+r.d).toLowerCase()}" onclick="this.classList.toggle('open')"><div class="abk-c-h"><span class="abk-c-ab">${r.a}</span><span class="abk-c-fu">${r.f}</span><span class="abk-c-ch">›</span></div><div class="abk-c-d">${r.d}</div></div>`).join('')
          + '</div></div>';
      }).join('');
    },
    filter(q){
      const term = q.trim().toLowerCase();
      const words = term ? term.split(/\s+/).filter(Boolean) : [];
      const crd = document.querySelectorAll('#abk-cards .abk-card');
      let vis = 0;
      crd.forEach(c=>{ const show = !words.length||words.every(w=>c.dataset.search.includes(w)); c.classList.toggle('hidden',!show); if(show) vis++; });
      document.querySelectorAll('#abk-cards .abk-c-grp').forEach(g=>{
        g.classList.toggle('hidden',![...crd].some(c=>c.dataset.sec===g.dataset.sec&&!c.classList.contains('hidden')));
      });
      const none = document.getElementById('abk-none'); if(none) none.classList.toggle('hidden',vis>0);
      const clr = document.getElementById('abk-clear'); if(clr) clr.classList.toggle('hidden',!term);
      const cnt = document.getElementById('abk-count');
      if(cnt) cnt.textContent = term ? `${vis} Treffer` : `${crd.length} Einträge`;
    },
    init(){ this.render(); document.getElementById('abk-search').value=''; this.filter(''); },
    data(){ return DATA; }
  };
})();

/* ======================================================================
   ABKTIP – Abkürzungen in Lernseiten antippen: Name und Erläuterung aus dem Abkürzungsverzeichnis
====================================================================== */
const ABKTIP=(function(){
  // zu allgemeine Kürzel nicht markieren (zu viele Fehltreffer)
  const SKIP=new Set(['Ma','SMART','CO','NA','PA','SP','OE','AS']);
  const BLOCK='script,style,textarea,input,select,a,button,summary,svg,h1,h2,h3,.abk-t,.acc-num,.page-title,.sec-h,.lj-src,.quiz-src,.m-hl,#m-hl-bar';
  let re=null, map=null, pop=null;
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function build(){
    if(re||map) return !!re;
    try{
      map=new Map();
      ABK.data().forEach(x=>{ if(x.a.length>=2&&!SKIP.has(x.a)&&!map.has(x.a)) map.set(x.a,x); });
      const keys=[...map.keys()].sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
      re=new RegExp('(?<![\\p{L}\\p{N}-])('+keys.join('|')+')(?![\\p{L}\\p{N}-])','gu');
    }catch(e){ re=null; }
    return !!re;
  }
  // jede Abkürzung auf der Seite nur beim ersten Vorkommen markieren (seen gilt für die ganze Seite)
  function wrapBlock(root,seen){
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.data.trim().length>1&&n.parentElement&&!n.parentElement.closest(BLOCK)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
    const nodes=[]; let n; while((n=w.nextNode())) nodes.push(n);
    nodes.forEach(node=>{
      re.lastIndex=0; const t=node.data; let m, last=0, frag=null;
      while((m=re.exec(t))){
        if(seen.has(m[1])) continue;
        seen.add(m[1]);
        frag=frag||document.createDocumentFragment();
        if(m.index>last) frag.appendChild(document.createTextNode(t.slice(last,m.index)));
        const sp=document.createElement('span'); sp.className='abk-t'; sp.dataset.k=m[1]; sp.tabIndex=0; sp.setAttribute('role','button'); sp.textContent=m[1];
        frag.appendChild(sp); last=m.index+m[1].length;
      }
      if(frag){ if(last<t.length) frag.appendChild(document.createTextNode(t.slice(last))); node.replaceWith(frag); }
    });
  }
  function apply(id){
    const v=document.getElementById(id); if(!v||v._abk||!v.querySelector('.pc')) return;
    v._abk=true;
    if(!build()) return;
    const pc=v.querySelector('.pc'), items=[...pc.querySelectorAll('.acc-item')];
    const seen=new Set();
    if(items.length) items.forEach(it=>wrapBlock(it,seen)); else wrapBlock(pc,seen);
  }
  function hide(){ if(pop) pop.hidden=true; }
  function show(el){
    const x=map&&map.get(el.dataset.k); if(!x) return;
    if(!pop){
      pop=document.createElement('div'); pop.id='abk-pop'; pop.hidden=true; pop.setAttribute('role','dialog'); pop.setAttribute('aria-label','Abkürzung');
      document.body.appendChild(pop);
      pop.addEventListener('click',e=>{ if(e.target.closest('[data-all]')){ hide(); NAV.go('v-abkuerzungen','Abkürzungen'); setTimeout(()=>{ const i=document.getElementById('abk-search'); if(i){ i.value=el.dataset.k; ABK.filter(el.dataset.k); } },120); } });
    }
    pop.innerHTML='<b>'+esc(x.a)+'</b> – '+esc(x.f)+(x.d?'<div class="abk-d">'+esc(x.d)+'</div>':'')+'<button type="button" data-all>Alle Abkürzungen ›</button>';
    pop.hidden=false;
    const r=el.getBoundingClientRect(), w=Math.min(320,innerWidth-24);
    pop.style.width=w+'px';
    pop.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+'px';
    const h=pop.offsetHeight, below=r.bottom+8+h<innerHeight-12;
    pop.style.top=(below?r.bottom+8:Math.max(12,r.top-8-h))+'px';
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest&&e.target.closest('.abk-t');
    if(t){ e.preventDefault(); show(t); return; }
    if(pop&&!pop.hidden&&!e.target.closest('#abk-pop')) hide();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') hide();
    if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('abk-t')){ e.preventDefault(); show(e.target); }
  });
  window.addEventListener('scroll',hide,{passive:true});
  return {apply,hide};
})();


/* ======================================================================
   CHROMIUM-ERKENNUNG – Warnung beim APK-Download
====================================================================== */
(function(){
  window._isChromium = !!window.chrome;
})();

/* ======================================================================
   INITIALISIERUNG
====================================================================== */
window.addEventListener('resize', () => {
  if(document.querySelector('.fc-outer')) FC.resize();
});

/* ======================================================================
   STREAK – tägliche Lernsträhne
====================================================================== */
const STREAK = (function(){
  function load(){ try{return JSON.parse(localStorage.getItem('bvi_streak')||'{}');}catch{return{};} }
  function save(d){ try{localStorage.setItem('bvi_streak',JSON.stringify(d));}catch{} }
  function todayStr(){ const n=new Date();return n.getFullYear()+'-'+(n.getMonth()+1)+'-'+n.getDate(); }
  return {
    record(){
      const d=load(),today=todayStr();
      if(d.lastStudy===today) return;
      const prev=new Date();prev.setDate(prev.getDate()-1);
      const yStr=prev.getFullYear()+'-'+(prev.getMonth()+1)+'-'+prev.getDate();
      d.current=d.lastStudy===yStr?(d.current||0)+1:1;
      d.longest=Math.max(d.longest||0,d.current);
      d.lastStudy=today;
      save(d);
    },
    get(){ return load(); }
  };
})();

/* ======================================================================
   NOTIF – Browser-Benachrichtigungen
====================================================================== */
const NOTIF = (function(){
  function prefs(){ try{return JSON.parse(localStorage.getItem('bvi_notif')||'{}');}catch{return{};} }
  function savePrefs(p){ try{localStorage.setItem('bvi_notif',JSON.stringify(p));}catch{} }
  const native=()=>!!(window.BVIAndroid&&window.BVIAndroid.setReminder);
  function syncToggle(){ const t=document.getElementById('m-notif-toggle'); if(t) t.checked=api.isEnabled(); }
  const api={
    async setEnabled(on){
      if(native()){
        // Android-App: echte Benachrichtigung, auch wenn die App geschlossen ist
        let r='ok'; try{ r=BVIAndroid.setReminder(!!on,api.hour()); }catch(e){ r='error'; }
        if(r==='ask') return !!prefs().enabled;
        savePrefs({...prefs(),enabled:!!on&&r==='ok'});
        if(on&&r==='ok') TOAST.show('Erinnerung gegen '+api.hour()+':00 Uhr aktiviert',{type:'ok'});
        return !!prefs().enabled;
      }
      if(!('Notification' in window)){ TOAST.show('Benachrichtigungen nicht unterstützt'); return false; }
      if(on){
        if(Notification.permission==='denied'){
          TOAST.show('Benachrichtigungen sind in deinem Browser blockiert. Erlaube sie über das Schloss-Symbol neben der Adresse (Website-Einstellungen) und schalte dann erneut ein.',{duration:9000});
          return false;
        }
        let r='denied';
        try{ r=await Notification.requestPermission(); }catch(e){}
        if(r!=='granted'){
          TOAST.show(r==='denied'?'Benachrichtigungen wurden abgelehnt. Du kannst sie über das Schloss-Symbol neben der Adresse wieder erlauben.':'Du hast die Abfrage geschlossen – bitte erlaube Benachrichtigungen, um erinnert zu werden.',{duration:8000});
          return false;
        }
        savePrefs({...prefs(),enabled:true});
        TOAST.show('Erinnerung aktiviert. Im Browser erscheint sie, wenn die App geöffnet ist; die Android-App erinnert auch bei geschlossener App.',{type:'ok',duration:8000}); return true;
      } else { savePrefs({...prefs(),enabled:false}); return false; }
    },
    // Antwort der Android-App auf die Berechtigungsabfrage
    _nativeResult(ok){
      savePrefs({...prefs(),enabled:!!ok});
      TOAST.show(ok?'Erinnerung gegen '+api.hour()+':00 Uhr aktiviert':'Benachrichtigungen wurden abgelehnt',{type:ok?'ok':undefined});
      syncToggle();
    },
    setHour(h){
      savePrefs({...prefs(),hour:parseInt(h,10)});
      if(native()&&prefs().enabled){ try{ BVIAndroid.setReminder(true,parseInt(h,10)); }catch(e){} }
    },
    hour(){ return prefs().hour||18; },
    isEnabled(){ const p=prefs(); return native()?!!p.enabled:(!!p.enabled&&'Notification' in window&&Notification.permission==='granted'); },
    check(){
      if(native()) return;
      const p=prefs(); if(!this.isEnabled()) return;
      const today=new Date().toDateString(); if(p.lastShown===today) return;
      if(new Date().getHours()<(p.hour||18)) return;
      try{ new Notification('B VI Lernwebsite 📚',{body:'Heute schon gelernt? Kurz Karten wiederholen!',icon:'./icons/icon-192.svg',tag:'bvi-daily'}); }catch{}
      savePrefs({...p,lastShown:today});
    }
  };
  return api;
})();

/* ======================================================================
   POMO – Pomodoro-Timer
====================================================================== */
const POMO=(function(){
  let _total=25*60, _rem=25*60, _running=false, _iv=null, _end=0;
  function fmt(s){ return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
  function tick(){ if(!_running) return; _rem=Math.max(0,Math.round((_end-Date.now())/1000)); render(); if(_rem<=0){ clearInterval(_iv); _running=false; done(); } }
  function render(){
    const d=document.getElementById('pomo-display'); if(d) d.textContent=fmt(_rem);
    const btn=document.getElementById('pomo-start'); if(btn) btn.textContent=_running?'Pause':'Start';
    document.getElementById('m-pomo')?.classList.toggle('hidden',!_running);
    const mt=document.getElementById('m-pomo-time');
    if(mt) mt.textContent=fmt(_rem);
  }
  function done(){
    render();
    TOAST.show('⏰ Zeit! Mach eine Pause.',{duration:6000});
    if(navigator.vibrate) navigator.vibrate([200,100,200]);
  }
  return {
    open(){ document.getElementById('pomodoro-overlay').classList.remove('hidden'); render(); },
    close(){ document.getElementById('pomodoro-overlay').classList.add('hidden'); },
    toggle(){
      if(_rem<=0) _rem=_total;   // nach Ablauf startet "Start" eine neue Runde
      _running=!_running;
      if(_running){ _end=Date.now()+_rem*1000; _iv=setInterval(tick,1000); } else clearInterval(_iv);
      render();
    },
    reset(){ clearInterval(_iv); _running=false; _rem=_total; render(); },
    setPreset(min,btn){
      clearInterval(_iv); _running=false;
      _total=min*60; _rem=_total;
      document.querySelectorAll('.pomo-preset').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      render();
    }
  };
})();

/* ======================================================================
   CHECKS – Abschnitte abhaken
====================================================================== */
const CHECKS=(function(){
  const SKIP=new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz','v-plan','v-pruefung','v-settings','v-notizen']);
  function key(id){ return 'bvi_checks_'+id; }
  function load(id){ try{ return JSON.parse(localStorage.getItem(key(id))||'{}'); }catch{ return {}; } }
  function save(id,d){ try{ localStorage.setItem(key(id),JSON.stringify(d)); }catch{} }
  return {
    init(id){
      if(SKIP.has(id)) return;
      const view=document.getElementById(id); if(!view) return;
      const checks=load(id);
      view.querySelectorAll('.acc-item summary').forEach((sum)=>{
        if(sum.querySelector('.acc-check')) return;
        const titleEl=sum.querySelector('.acc-title,.acc-h');
        const ck=(titleEl?titleEl.textContent:sum.textContent).trim().slice(0,80);
        const btn=document.createElement('button');
        btn.className='acc-check'+(checks[ck]?' checked':'');
        btn.title='Abgehakt'; btn.type='button';
        btn.innerHTML='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        btn.addEventListener('click',e=>{
          e.stopPropagation(); e.preventDefault();
          const d=load(id); d[ck]=!d[ck]; save(id,d);
          btn.classList.toggle('checked',!!d[ck]);
        });
        const arrow=sum.querySelector('.acc-arrow');
        if(arrow) sum.insertBefore(btn,arrow); else sum.appendChild(btn);
      });
    },
    // für LP: Lesestand je Kapitel abfragen bzw. setzen (gleicher Speicher wie die Haken)
    get(id,ck){ return !!load(id)[ck]; },
    set(id,ck,on){
      const d=load(id); d[ck]=!!on; save(id,d);
      const v=document.getElementById(id);
      v&&v.querySelectorAll('.acc-item summary').forEach(sum=>{
        const t=sum.querySelector('.acc-title,.acc-h');
        if(((t?t.textContent:sum.textContent).trim().slice(0,80))===ck) sum.querySelector('.acc-check')?.classList.toggle('checked',!!on);
      });
    }
  };
})();

/* ======================================================================
   TB – Tabellen am Handy: 2 Spalten als Begriff/Erklärung, 3–4 Spalten als Karten,
   ab 5 Spalten mit fester erster Spalte (reines CSS ab 700 px nicht nötig)
====================================================================== */
const TB=(function(){
  function init(id){
    const v=document.getElementById(id); if(!v) return;
    v.querySelectorAll('.pc table:not(.tb)').forEach(t=>{
      t.classList.add('tb');
      const rows=[...t.rows]; if(rows.length<2) { t.classList.add('tb-wide'); return; }
      const head=rows.find(r=>r.querySelector('th'))||rows[0];
      const hi=rows.indexOf(head);
      const spans=[...t.querySelectorAll('td,th')].some(c=>c.colSpan>1||c.rowSpan>1);
      const n=Math.max(...rows.map(r=>r.cells.length));
      head.classList.add('tb-head');
      const labels=[...head.cells].map(c=>c.textContent.replace(/\s+/g,' ').trim());
      rows.forEach((r,ri)=>{ if(ri===hi) return; [...r.cells].forEach((c,i)=>{ if(labels[i]) c.setAttribute('data-label',labels[i]); }); });
      const kind=spans?'wide':n===2?'dl':n<=4?'cards':'wide';
      t.classList.add('tb-'+kind);
      if(kind==='wide'){
        let w=t.parentElement;
        if(!w||!/auto|scroll/.test(getComputedStyle(w).overflowX)){ w=document.createElement('div'); t.parentNode.insertBefore(w,t); w.appendChild(t); }
        w.classList.add('tb-scroll');
        const hint=document.createElement('span'); hint.className='tb-hint'; hint.textContent='← wischen →'; w.appendChild(hint);
        { let q=0; w.addEventListener('scroll',()=>{ if(q) return; q=requestAnimationFrame(()=>{ q=0; hint.classList.toggle('gone',w.scrollLeft>8); }); },{passive:true}); }
        requestAnimationFrame(()=>{ if(w.scrollWidth<=w.clientWidth+4) hint.classList.add('gone'); });
      }
    });
  }
  return { init };
})();

/* ======================================================================
   LP – Lernseiten: Überblick mit Kapitelkarten, Kapitel-Fenster, Volltext
   (Handy/Tablet; ab 1100 px immer Volltext mit allen Abschnitten offen)
====================================================================== */
const LP=(function(){
  const mq=window.matchMedia('(min-width:1100px)');
  let win=null, cur=null, pushed=false, ignorePop=false;
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const items=v=>[...v.querySelectorAll('.pc .acc-item:not(.jg-gone)')];
  const ckOf=d=>{ const t=d.querySelector('summary .acc-title,summary .acc-h'); return (t?t.textContent:d.querySelector('summary').textContent).trim().slice(0,80); };
  const titleOf=d=>{ const t=d.querySelector('summary .acc-title,summary .acc-h'); return ((t?t.textContent:d.querySelector('summary').textContent)||'').replace(/\s+/g,' ').trim(); };
  const numOf=(d,i)=>d.querySelector('summary .acc-num')?.textContent.trim()||String(i+1).padStart(2,'0');
  function plain(body){
    const w=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);let out=[],n;
    while((n=w.nextNode())){ const t=n.nodeValue.replace(/\s+/g,' ').trim(); if(t) out.push(t); }
    return out.join(' ');
  }
  // Vorschau: erste Sätze/Stichpunkte des Kapitels, durch „·“ getrennt (statt aneinandergereihter Textknoten)
  function preview(body){
    const sel='p,li,.def-body,.step-desc';
    const out=[]; let n=0;
    body.querySelectorAll(sel).forEach(el=>{
      if(n>=170||el.querySelector(sel)||el.closest('table')) return;
      const t=el.textContent.replace(/\s+/g,' ').trim(); if(t.length<12) return;
      out.push(t.replace(/[.;:]$/,'')); n+=t.length;
    });
    let s=out.length?out.join(' · '):plain(body).replace(/ (?=[A-ZÄÖÜ])/g,' · ');
    if(s.length>170){ s=s.slice(0,170); const k=s.lastIndexOf(' '); s=(k>120?s.slice(0,k):s)+' …'; }
    return s;
  }
  function init(id){
    const v=document.getElementById(id); if(!v) return;
    if(v._lp){ apply(v); return; }
    const list=v.querySelector('.pc .acc-list:not(.acc-cards)'); if(!list||items(v).length<3) return;
    v._lp={id};
    const cards=document.createElement('div'); cards.className='lp-cards';
    list.parentNode.insertBefore(cards,list);
    cards.onclick=e=>{ const c=e.target.closest('.lp-card'); if(c) open(v,+c.dataset.i); };
    apply(v);
  }
  function apply(v){
    const wide=mq.matches, mode=wide?'voll':'ueber'; // Handy und Tablet: Kapitelkarten; Desktop: Volltext
    v.classList.add('lp-on'); v.classList.toggle('lp-ueber',mode==='ueber'); v.classList.toggle('lp-voll',mode==='voll');
    if(mode==='voll'){ items(v).forEach(d=>{ d.open=true; }); }
    if(mode==='ueber') render(v);
  }
  function render(v){
    const its=items(v), id=v._lp.id, box=v.querySelector('.lp-cards'); if(!box) return;
    const ed=typeof JGUI!=='undefined'&&!!v.querySelector('.pc.jg-ed-on');
    box.innerHTML=its.map((d,i)=>{
      const body=d.querySelector('.acc-body')||d.querySelector('.lp-held');
      const read=CHECKS.get(id,ckOf(d));
      const key=ed?JGUI.chapterKey(id,d):'', ctl=key?'<span class="jg-ctl jg-cx" role="button" tabindex="0" aria-label="Kapitel löschen" data-key="'+esc(key)+'">✕</span>':'';
      return '<button type="button" class="lp-card'+(read?' read':'')+'" data-i="'+i+'"><span class="acc-num">'+esc(numOf(d,i))+'</span><span class="t">'+esc(titleOf(d))+'</span>'+(read?'<span class="acc-pts">✓ gelesen</span>':'')+'<span class="pv">'+esc(body?preview(body):'')+'</span><span class="go">Kapitel öffnen ›</span>'+ctl+'</button>';
    }).join('');
  }
  function build(){
    win=document.createElement('div'); win.className='lp-win'; win.setAttribute('role','dialog'); win.setAttribute('aria-label','Kapitel');
    win.innerHTML='<div class="lp-wh"><button type="button" class="lp-wb-back" aria-label="Zurück zur Übersicht"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button><div class="lp-wt"><span class="lp-eb"></span><b></b></div>'
      +'<div class="m-tb-actions"><button type="button" class="lp-fm" aria-label="Schrift kleiner">A−</button><button type="button" class="lp-fp" aria-label="Schrift größer">A+</button><button type="button" class="lp-bm" aria-label="Lesezeichen setzen" onclick="SHELL.bookmark()"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>'
      +'<button type="button" class="lp-nt" aria-label="Notiz zu dieser Seite" onclick="NOTES.toggle()"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button></div></div>'
      +'<div class="lp-bar"><i></i></div><div class="lp-wbody"></div><div class="lp-pg"><button type="button" class="lp-prev">‹ Vorheriges Kapitel</button><button type="button" class="lp-next">Nächstes Kapitel ›</button></div>';
    win.querySelector('.lp-wb-back').onclick=()=>back();
    win.querySelector('.lp-fm').onclick=()=>fz(-1);
    win.querySelector('.lp-fp').onclick=()=>fz(1);
    { let q=0; win.querySelector('.lp-wbody').addEventListener('scroll',()=>{ if(q) return; q=requestAnimationFrame(()=>{ q=0; bar(); }); },{passive:true}); } // pro Frame höchstens einmal rechnen
    win.querySelector('.lp-prev').onclick=()=>go(cur.i-1);
    win.querySelector('.lp-next').onclick=()=>go(cur.i+1);
    const mo=new MutationObserver(sync);
    ['m-bm','m-note'].forEach(i=>{ const e=document.getElementById(i); if(e) mo.observe(e,{attributes:true,attributeFilter:['class']}); });
  }
  function sync(){
    if(!win) return;
    win.querySelector('.lp-bm').classList.toggle('fab-active',!!document.getElementById('m-bm')?.classList.contains('fab-active'));
    win.querySelector('.lp-nt').classList.toggle('fab-active',!!document.getElementById('m-note')?.classList.contains('fab-active'));
  }
  function give(){ // Inhalt zurück in sein Kapitel
    if(!cur||!cur.body) return;
    const d=items(cur.v)[cur.i]; if(d&&cur.body.parentNode!==d) d.appendChild(cur.body);
    cur.body.classList.remove('lp-held'); cur.body=null;
  }
  function load(i){
    const its=items(cur.v), d=its[i]; cur.i=i;
    const body=d.querySelector('.acc-body'); cur.body=body;
    const wb=win.querySelector('.lp-wbody'); wb.innerHTML='<h2 class="lp-h">'+esc(titleOf(d))+'</h2>'; wb.appendChild(body); body.classList.add('lp-held');
    win.querySelector('.lp-eb').textContent='Kapitel '+numOf(d,i)+' / '+String(its.length).padStart(2,'0');
    applyFz();
    win.querySelector('.lp-wt b').textContent=document.querySelector('#'+cur.v.id+' .page-title')?.textContent.trim()||'';
    win.querySelector('.lp-prev').classList.toggle('dis',i===0);
    win.querySelector('.lp-next').classList.toggle('dis',i===its.length-1);
    wb.scrollTop=0; CHECKS.set(cur.v._lp.id,ckOf(d),true); sync(); bar();
    if(typeof HL!=='undefined') HL.apply(cur.v.id);   // Markierungen im Kapitel-Fenster zeigen
  }
  // Fokus-Lesemodus: Fortschrittslinie (Kapitel + Lesestand im Kapitel) und Schriftgröße
  function bar(){
    if(!cur||!win) return;
    const wb=win.querySelector('.lp-wbody'), n=items(cur.v).length, f=wb.scrollHeight>wb.clientHeight?wb.scrollTop/(wb.scrollHeight-wb.clientHeight):1;
    win.querySelector('.lp-bar i').style.width=Math.min(100,(cur.i+f)/n*100)+'%';
  }
  const FZ=[15,16,18,20,22,24];
  function fzIdx(){ try{ const i=parseInt(localStorage.getItem('bvi_lp_fz'),10); return i>=0&&i<FZ.length?i:2; }catch(e){ return 2; } }
  function fz(d){ const i=Math.max(0,Math.min(FZ.length-1,fzIdx()+d)); try{ localStorage.setItem('bvi_lp_fz',String(i)); }catch(e){} applyFz(); }
  function applyFz(){ win&&win.style.setProperty('--lp-fz',FZ[fzIdx()]+'px'); }
  function open(v,i,opt){
    if(!win) build();
    const focus=!!(opt&&opt.focus);
    cur={v,i,body:null,focus};
    win.classList.toggle('focus',focus); v.classList.toggle('lp-focus',focus);
    v.appendChild(win); v.classList.add('lp-open'); document.documentElement.classList.add('lp-lock');
    const r=v.getBoundingClientRect(); win.style.setProperty('--lp-l',Math.max(0,r.left)+'px'); win.style.setProperty('--lp-w',r.width+'px');
    const tb=document.getElementById('m-tabbar'); if(tb&&tb.offsetHeight) win.style.setProperty('--lp-tb',tb.offsetHeight+'px'); // echte Höhe der Tab-Leiste: kein Durchscheinen der Ebene darunter
    load(i); win.classList.add('on');
    if(!pushed){ try{ history.pushState(Object.assign({},history.state||{},{lp:1}),''); pushed=true; }catch(e){} }
  }
  function go(i){ if(!cur||i<0||i>=items(cur.v).length) return; give(); load(i); }
  function close(silent){
    if(!cur) return;
    give(); const v=cur.v; win.classList.remove('on','focus'); v.classList.remove('lp-open','lp-focus'); document.documentElement.classList.remove('lp-lock'); cur=null;
    if(typeof HL!=='undefined') HL.apply(v.id);
    if(v.classList.contains('lp-ueber')) render(v);
    if(pushed){ pushed=false; if(!silent){ ignorePop=true; try{ history.back(); }catch(e){ ignorePop=false; } } }
  }
  function back(){ close(false); }
  window.addEventListener('popstate',e=>{
    if(ignorePop){ ignorePop=false; e.stopImmediatePropagation(); return; }
    if(cur){ close(true); e.stopImmediatePropagation(); }
  },true);
  document.addEventListener('keydown',e=>{
    if(!cur) return;
    if(e.key==='Escape'&&!e.defaultPrevented&&!OVL.any()) back();
    else if(cur.focus&&!/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'')){
      if(e.key==='ArrowRight') go(cur.i+1); else if(e.key==='ArrowLeft') go(cur.i-1);
    }
  });
  // ── Fokus-Lesemodus (Desktop) ──
  function focusMode(){
    const v=document.querySelector('.view.active'); if(!v||!v._lp) return;
    const its=items(v); let i=0;
    its.forEach((d,k)=>{ if(d.getBoundingClientRect().top<window.innerHeight*0.4) i=k; });
    open(v,i,{focus:true});
  }
  // ── Lernkarten-Fenster neben der Lernseite (Desktop): ein-/ausblendbar ──
  const PMAP={
    'v-gal-brandlehre':['GAL · Brandlehre'],'v-gal-atemschutz':['GAL · Atemschutz'],'v-gal-beamtenrecht':['GAL · Beamtenrecht'],'v-gal-brandbekaempfung':['GAL · Brandbekämpfung'],
    'v-gal-einsatztechnik':['GAL · Einsatztechnik'],'v-gal-erstehilfe':['GAL · Erste Hilfe'],'v-gal-gabc':['GAL · GABC'],'v-gal-fahrzeuge':['GAL · Fahrzeuge'],'v-gal-hbkg':['GAL · HBKG'],
    'v-gal-beihilferecht':['GAL · Beihilfe'],'v-gal-kartenkunde':['GAL · Kartenkunde'],'v-gal-knoten':['GAL · Knoten'],'v-gal-geraetepruefung':['GAL · Geräteprüfung'],'v-gal-fuehrung':['GAL · Führung'],
    'v-gal-fwdven':['GAL · FwDVen'],'v-gal-psa':['GAL · PSA'],'v-gal-leitern':['GAL · Leitern'],'v-gal-maschinist':['GAL · Maschinist'],'v-gal-armaturen':['GAL · Armaturen'],'v-gal-uvv':['GAL · UVV'],
    'v-gal-staatsbuerger':['GAL · Staatsbürgerkunde'],'v-gal-th-verkehr':['GAL · TH-Verkehr'],
    'v-sfs-fwdv3':['SFS · Taktik'],'v-sfs-methodik':['SFS · Methodik'],'v-sfs-rechtsgrundlagen':['SFS · Recht'],
    'v-hlfs-fuehrungsvorgang':['HLFS · Führung'],'v-hlfs-gabc':['HLFS · GABC'],'v-hlfs-manv':['HLFS · MANV'],'v-hlfs-stab':['HLFS · Stab'],'v-hlfs-tunnel':['HLFS · Tunnel'],'v-hlfs-vb':['HLFS · Vorbeugen'],
    'v-ibk-ta':['IBK · TA'],'v-ibk-konflikt':['IBK · Konflikt'],'v-ibk-stress':['IBK · Stress'],'v-ibk-psnv':['IBK · PSNV'],'v-ibk-bgm':['IBK · BGM'],'v-ibk-pm':['IBK · PM'],'v-ibk-zeit':['IBK · Zeit'],
    'v-vak-jur-denken':['VAk · Jur. Denken'],'v-vak-verwaltungsrecht':['VAk · Verwaltungsrecht'],'v-vak-staatsrecht':['VAk · Staatsrecht'],'v-vak-einsatzrecht':['VAk · Einsatzrecht'],'v-vak-dienstrecht':['VAk · Dienstrecht'],
    'v-feuak-vwl':['FeuAK · VWL'],'v-feuak-haushalt':['FeuAK · Haushalt'],'v-feuak-pm':['FeuAK · PM'],'v-feuak-bedarfsplanung':['FeuAK · Bedarfsplanung'],'v-feuak-katsbp':['FeuAK · KatS-Bedarfsplanung'],
    'v-feuak-qm':['FeuAK · BSC/QM'],'v-feuak-stakeholder':['FeuAK · Stakeholderanalyse'],'v-feuak-risikoanalyse':['FeuAK · Prospektive Risikoanalyse'],'v-feuak-beschaffung':['FeuAK · Beschaffungspraxis','FeuAK · Vergabe'],
    'v-idf-brandschutz':['IdF · Brandschutz'],'v-idf-stab':['IdF · Stabsarbeit'],'v-idf-presse':['IdF · Presse']
  };
  const cardsFor=id=>{ const c=PMAP[id]; return c&&typeof FLASHCARD_DATA!=='undefined'?FLASHCARD_DATA.filter(x=>c.includes(x.cat)):[]; };
  const PRKEY='bvi_lp_prac';
  let pr={id:null,list:[],i:0,flip:false,known:0}, panel=null;
  const prefPrac=()=>{ try{ return localStorage.getItem(PRKEY)==='1'; }catch(e){ return false; } };
  const shuf=a=>{ const r=[...a]; for(let i=r.length-1;i>0;i--){ const j=0|Math.random()*(i+1); [r[i],r[j]]=[r[j],r[i]]; } return r; };
  function drawPrac(){
    if(!panel) return;
    const c=pr.list[pr.i], n=pr.list.length;
    panel.innerHTML='<div class="lpp-h"><b>Üben</b><span>'+n+' Karten zu dieser Seite</span><button type="button" class="lpp-x" aria-label="Lernkarten ausblenden">✕</button></div>'
      +'<div class="lpp-bar"><i style="width:'+(n?pr.known/n*100:0)+'%"></i></div>'
      +(c?'<button type="button" class="lpp-card" aria-label="Karte umdrehen"><small>'+(pr.flip?'Antwort':'Frage')+' '+(pr.i+1)+' / '+n+'</small><div class="'+(pr.flip?'a':'q')+'">'+(pr.flip?c.a:c.q)+'</div></button>'
        +'<div class="lpp-act"><button type="button" class="lpp-no">Nochmal</button><button type="button" class="lpp-ok">Gewusst</button></div><p class="lpp-t">Antippen dreht die Karte um. Die Bewertung zählt auch bei den Lernkarten.</p>':'<p class="lpp-t">Keine Karten zu dieser Seite.</p>');
    panel.querySelector('.lpp-x').onclick=()=>togglePractice(false);
    const card=panel.querySelector('.lpp-card'); if(card) card.onclick=()=>{ pr.flip=!pr.flip; drawPrac(); };
    const rate=ok=>{ FC.rateExternal(c.id,ok); if(ok) pr.known=Math.min(n,pr.known+1); pr.i=(pr.i+1)%n; pr.flip=false; drawPrac(); };
    const ok=panel.querySelector('.lpp-ok'), no=panel.querySelector('.lpp-no'); if(ok) ok.onclick=()=>rate(true); if(no) no.onclick=()=>rate(false);
  }
  function applyPrac(id){
    const list=cardsFor(id);
    const on=!!list.length&&prefPrac()&&mq.matches;
    document.body.classList.toggle('lp-prac',on);
    if(!on){ panel&&panel.classList.remove('on'); return; }
    if(!panel){ panel=document.createElement('aside'); panel.id='lp-practice'; panel.setAttribute('aria-label','Lernkarten zu dieser Seite'); document.body.appendChild(panel); }
    if(pr.id!==id){ pr={id,list:shuf(list),i:0,flip:false,known:0}; }
    panel.classList.add('on'); drawPrac();
  }
  function togglePractice(force){
    const v=document.querySelector('.view.active'); if(!v) return;
    const on=typeof force==='boolean'?force:!prefPrac();
    try{ localStorage.setItem(PRKEY,on?'1':'0'); }catch(e){}
    applyPrac(v.id); tools(v.id);
  }
  // Knöpfe „Fokus“ und „Üben“ in der Kopfleiste nur auf passenden Seiten zeigen
  function tools(id){
    const v=document.getElementById(id), f=document.getElementById('m-focus'), p=document.getElementById('m-practice');
    if(f) f.classList.toggle('hidden',!(v&&v._lp));
    if(p){ const has=cardsFor(id).length>0; p.classList.toggle('hidden',!has); p.classList.toggle('fab-active',has&&prefPrac()); }
  }
  mq.addEventListener&&mq.addEventListener('change',()=>{ if(mq.matches&&cur) close(true); const v=document.querySelector('.view.active'); if(v&&v._lp) apply(v); });
  // Suche: direkt zum Kapitel – im Überblick (Handy/Tablet) im Kapitel-Fenster, sonst Abschnitt aufklappen und hinscrollen
  function focus(id,i){
    const v=document.getElementById(id); if(!v) return;
    const d=items(v)[i]; if(!d) return;
    if(v._lp&&v.classList.contains('lp-ueber')){ open(v,i); return; }
    d.open=true; d.scrollIntoView({block:'start',behavior:'smooth'});
  }
  return { init, refresh(id){ const v=document.getElementById(id); if(v&&v._lp&&v.classList.contains('lp-ueber')) render(v); }, held(){ return cur&&cur.body?{d:items(cur.v)[cur.i],body:cur.body}:null; }, focus, focusMode, togglePractice, canFocus:()=>{ const v=document.querySelector('.view.active'); return !!(v&&v._lp); }, canPractice:()=>cardsFor(document.querySelector('.view.active')?.id).length>0, isOpen:()=>!!cur, back,
    onShow(id){ if(cur) close(true); applyPrac(id); setTimeout(()=>tools(id),0); } };
})();

/* ======================================================================
   CUSTOM – Eigene Lernkarten
====================================================================== */
const CUSTOM=(function(){
  const KEY='bvi_fc_custom', MODS=['GAL','SFS','HLFS','IBK','VAk','FeuAK','IdF'];
  let box=null;
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const html=t=>esc(t.trim()).replace(/\n/g,'<br>');
  const load=()=>{ try{ const a=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(a)?a.filter(c=>c&&typeof c==='object'&&c.id&&typeof c.cat==='string'):[]; }catch(e){ return []; } };
  const save=a=>{ try{ localStorage.setItem(KEY,JSON.stringify(a)); }catch(e){} };
  function refresh(){ if(typeof FC!=='undefined') FC.syncFilters(); SHELL.renderFcSide(); }
  function list(){
    const el=box.querySelector('#cu-list'), a=load();
    el.innerHTML=a.length?a.map(c=>`<div class="cu-item"><div><b>${esc(c.cat.split(' · ')[0])}</b> ${c.q}</div><button aria-label="Karte löschen" data-id="${esc(c.id)}">Löschen</button></div>`).join(''):'<div class="cu-empty">Noch keine eigenen Karten.</div>';
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>remove(b.dataset.id));
  }
  function remove(id){
    save(load().filter(c=>c.id!==id));
    const i=FLASHCARD_DATA.findIndex(c=>c.id===id); if(i>=0) FLASHCARD_DATA.splice(i,1);
    // Lernstand, Stern und "schwer" der gelöschten Karte entfernen (sonst zählt sie weiter)
    try{
      const fc=JSON.parse(localStorage.getItem('bvi_fc')||'{}'); if(fc&&typeof fc==='object'&&id in fc){ delete fc[id]; localStorage.setItem('bvi_fc',JSON.stringify(fc)); }
      ['bvi_fc_stars','bvi_fc_weak'].forEach(k=>{ const a=JSON.parse(localStorage.getItem(k)||'[]'); if(Array.isArray(a)&&a.includes(id)) localStorage.setItem(k,JSON.stringify(a.filter(x=>x!==id))); });
    }catch(e){}
    list(); refresh();
    if(typeof FC!=='undefined'&&document.getElementById('v-flashcards').classList.contains('active')) FC.start();
  }
  function add(){
    const q=box.querySelector('#cu-q').value, a=box.querySelector('#cu-a').value, m=box.querySelector('#cu-m').value;
    if(!q.trim()||!a.trim()){ TOAST.show('Bitte Frage und Antwort eintragen',{type:'info'}); return; }
    const c={id:'own'+Date.now().toString(36),cat:m+' · Eigene Karte',q:html(q),a:html(a)};
    const all=load(); all.push(c); save(all);
    FLASHCARD_DATA.push({...c,own:true});
    box.querySelector('#cu-q').value=''; box.querySelector('#cu-a').value='';
    list(); refresh(); TOAST.show('Karte gespeichert',{type:'ok'});
    box.querySelector('#cu-q').focus();
  }
  const plain=h=>String(h).replace(/<br\s*\/?>/g,'\n').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  function exportCards(){
    const a=load();
    if(!a.length){ TOAST.show('Noch keine eigenen Karten zum Exportieren',{type:'info'}); return; }
    const data={app:'bvi-lernwebsite',typ:'eigene-karten',version:APP_VERSION,exportiert:new Date().toISOString(),
      karten:a.map(c=>({modul:c.cat.split(' · ')[0],frage:plain(c.q),antwort:plain(c.a)}))};
    const d=new Date(), p2=n=>String(n).padStart(2,'0');
    FILES.save('bvi-eigene-karten-'+d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+'.json','application/json',JSON.stringify(data,null,1));
  }
  // ── Kartenstapel teilen: Link oder Code (Karten stecken im Link selbst, nichts läuft über einen Server) ──
  const URL_APP='https://flametan.github.io/BVI-Lernwebsite/';
  const toB64u=u8=>{ let b=''; for(let i=0;i<u8.length;i+=8192) b+=String.fromCharCode.apply(null,u8.subarray(i,i+8192)); return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
  const fromB64u=t=>{ const b=atob(t.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((t.length+3)%4)); const u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; };
  async function pack(){
    const a=load(), bytes=new TextEncoder().encode(JSON.stringify({v:1,k:a.map(c=>[c.cat.split(' · ')[0],plain(c.q),plain(c.a)])}));
    if(typeof CompressionStream!=='undefined'){
      try{ return 'BVIK1.'+toB64u(new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer())); }catch(e){}
    }
    return 'BVIK0.'+toB64u(bytes);
  }
  async function unpack(text){
    const m=/BVIK([01])\.([A-Za-z0-9_-]+)/.exec(String(text||'')); if(!m) throw new Error('code');
    let bytes=fromB64u(m[2]);
    if(m[1]==='1') bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    const j=JSON.parse(new TextDecoder().decode(bytes));
    if(!j||!Array.isArray(j.k)) throw new Error('format');
    return j.k.slice(0,300).map(x=>({modul:x[0],frage:x[1],antwort:x[2]}));
  }
  // Karten zu den vorhandenen hinzufügen (gleiche Fragen im selben Modul werden übersprungen)
  function merge(items){
    const all=load(), have=new Set(all.map(c=>c.cat.split(' · ')[0]+'|'+plain(c.q).trim())); let n=0;
    items.forEach(k=>{
      const m=MODS.includes(k.modul)?k.modul:'GAL', q=String(k.frage||'').slice(0,500), a=String(k.antwort||'').slice(0,1500);
      if(!q.trim()||!a.trim()||have.has(m+'|'+q.trim())) return;
      have.add(m+'|'+q.trim());
      const c={id:'own'+Date.now().toString(36)+n,cat:m+' · Eigene Karte',q:html(q),a:html(a)};
      all.push(c); FLASHCARD_DATA.push({...c,own:true}); n++;
    });
    save(all); if(box) list(); refresh();
    return n;
  }
  async function fromCode(text,ask){
    let items;
    try{ items=await unpack(text); }catch(e){ TOAST.show('Das ist kein gültiger Karten-Link oder -Code',{type:'info'}); return; }
    if(!items.length){ TOAST.show('Keine Karten gefunden',{type:'info'}); return; }
    if(ask&&!confirm(items.length+' Lernkarten übernehmen?\n\nSie werden zu deinen eigenen Karten hinzugefügt.')) return;
    const n=merge(items);
    TOAST.show(n?n+' Karten importiert':'Alle Karten hatte ich schon',{type:n?'ok':'info'});
  }
  async function shareLink(){
    if(!load().length){ TOAST.show('Noch keine eigenen Karten zum Teilen',{type:'info'}); return null; }
    return URL_APP+'?karten='+await pack();
  }
  async function shareNow(){
    const link=await shareLink(); if(!link) return;
    const n=load().length;
    if(navigator.share){ try{ await navigator.share({title:'B VI – Lernkarten',text:'Meine '+n+' Lernkarten für B VI. Link öffnen, dann werden sie übernommen:',url:link}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
    try{ await navigator.clipboard.writeText(link); TOAST.show('Link kopiert – jetzt z. B. in WhatsApp einfügen',{type:'ok'}); }
    catch(e){ box.querySelector('#cu-code').value=link; TOAST.show('Link steht unten im Feld – bitte kopieren',{type:'info'}); }
  }
  async function showQr(){
    const link=await shareLink(); if(!link) return;
    const el=box.querySelector('#cu-qr');
    if(link.length>2300){ el.innerHTML='<div class="cu-empty">Zu viele Karten für einen QR-Code – bitte „Link teilen“ nutzen.</div>'; return; }
    try{ await APPSHARE.qr(el,link); el.innerHTML+='<div class="cu-empty" style="text-align:center">Mit der Kamera scannen, der Link öffnet B VI</div>'; }
    catch(e){ el.innerHTML='<div class="cu-empty">QR-Code konnte nicht erstellt werden – bitte „Link teilen“ nutzen.</div>'; }
  }
  function importCards(file){
    if(!file) return;
    const r=new FileReader();
    r.onload=()=>{
      try{
        const j=JSON.parse(r.result);
        if(j.typ!=='eigene-karten'||!Array.isArray(j.karten)) throw new Error('format');
        const n=merge(j.karten);
        TOAST.show(n?n+' Karten importiert':'Keine neuen Karten gefunden',{type:n?'ok':'info'});
      }catch(e){ TOAST.show('Datei nicht lesbar – bitte eine exportierte Kartendatei wählen',{type:'info'}); }
    };
    r.readAsText(file);
  }
  function build(){
    box=document.createElement('div'); box.id='cu-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Eigene Lernkarte');
    box.innerHTML='<div class="cu-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t">Eigene Lernkarte</div>'
      +'<label>Modul<select id="cu-m">'+MODS.map(m=>'<option>'+m+'</option>').join('')+'</select></label>'
      +'<label>Frage<textarea id="cu-q" rows="3" maxlength="500"></textarea></label>'
      +'<label>Antwort<textarea id="cu-a" rows="4" maxlength="1500"></textarea></label>'
      +'<button class="btn btn-gold" id="cu-save">Karte speichern</button>'
      +'<div class="cu-h">Meine Karten</div><div id="cu-list"></div>'
      +'<div class="cu-h">Karten teilen</div><div class="cu-io"><button class="btn btn-ghost" id="cu-share">Link teilen</button><button class="btn btn-ghost" id="cu-qrb">QR-Code zeigen</button></div><div id="cu-qr"></div>'
      +'<label>Link oder Code von jemand anderem<textarea id="cu-code" rows="2" placeholder="Link oder Code hier einfügen"></textarea></label><button class="btn btn-ghost" id="cu-fromcode">Karten übernehmen</button>'
      +'<div class="cu-io"><button class="btn btn-ghost" id="cu-exp">Als Datei speichern</button><label class="btn btn-ghost" for="cu-imp">Aus Datei laden</label><input type="file" id="cu-imp" accept=".json,application/json" hidden></div>'
      +'</div>';
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
    box.querySelector('#cu-save').onclick=add;
    box.querySelector('#cu-exp').onclick=exportCards;
    box.querySelector('#cu-share').onclick=shareNow;
    box.querySelector('#cu-qrb').onclick=showQr;
    box.querySelector('#cu-fromcode').onclick=()=>{ const t=box.querySelector('#cu-code').value; if(t.trim()) fromCode(t,false).then(()=>{ box.querySelector('#cu-code').value=''; }); };
    box.querySelector('#cu-imp').onchange=e=>{ importCards(e.target.files[0]); e.target.value=''; };
  }
  // pre: {a: vorbelegte Antwort, view: Seite, von der der Text stammt} – für „Als Lernkarte“ aus einer Markierung
  function open(pre){
    if(!box) build(); list(); box.hidden=false;
    if(pre){
      box.querySelector('#cu-a').value=String(pre.a||'').slice(0,1500);
      box.querySelector('#cu-q').value='';
      const m=({gal:'GAL',sfs:'SFS',hlfs:'HLFS',ibk:'IBK',vak:'VAk',feuak:'FeuAK',idf:'IdF'})[String(pre.view||'').split('-')[1]];
      if(m) box.querySelector('#cu-m').value=m;
    }
    box.querySelector('#cu-q').focus({preventScroll:true});
  }
  function close(){ if(box) box.hidden=true; }
  return {open,close,fromCode};
})();

/* ======================================================================
   WEAK – schwere Karten im Überblick
====================================================================== */
const WEAK=(function(){
  let box=null;
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function build(){
    box=document.createElement('div'); box.id='wk-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Nochmal üben');
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
  }
  function render(){
    const n=FC.weakCount(), by=FC.weakByModule();
    const chips=Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<span class="wk-chip">${esc(k)} <b>${v}</b></span>`).join('');
    box.innerHTML=`<div class="cu-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t" style="text-align:left;padding-right:36px">Nochmal üben</div>
      <div class="wk-sec"><div class="wk-h">Lernkarten</div>${n?`<div class="wk-n"><b>${n}</b> ${n===1?'Karte':'Karten'} mit „schwer“ oder „nicht gewusst“</div><div class="wk-chips">${chips}</div><button class="btn btn-gold" onclick="WEAK.cards()">Diese Karten üben</button>`:'<div class="wk-n m">Keine schweren Karten. Gut so!</div>'}</div>
      <div class="m-t2">Eine Karte verschwindet aus der Liste, sobald du sie als „gewusst“ beantwortest.</div></div>`;
  }
  function open(){ if(!box) build(); render(); box.hidden=false; box.querySelector('.sh-x').focus({preventScroll:true}); }
  function close(){ if(box) box.hidden=true; }
  return {
    open,close,
    cards(){ close(); NAV.tab('v-flashcards','Lernkarten'); FC.showWeak(); }
  };
})();

/* ======================================================================
   RECENT – Zuletzt besucht
====================================================================== */
const RECENT=(function(){
  const KEY='bvi_recent'; const MAX=5;
  const SKIP=new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz','v-plan','v-pruefung','v-settings','v-notizen']);
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } }
  function save(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch{} }
  return {
    track(id){
      if(SKIP.has(id)) return;
      const label=document.querySelector('#'+id+' .page-title')?.textContent?.trim()||id;
      const entries=load().filter(e=>e.id!==id);
      entries.unshift({id,label});
      save(entries.slice(0,MAX));
    },
    clear(){ save([]); },
    list(){ return load(); }
  };
})();

/* ======================================================================
   ONBOARD – Erste-Schritte-Overlay (einmalig)
====================================================================== */
const ONBOARD=(function(){
  const KEY='bvi_onboarded';
  let _step=0;
  const TOTAL=6;
  function syncSetup(){
    THEME.render(); ACCENT.render();
  }
  function setStep(n){
    _step=Math.max(0,Math.min(TOTAL-1,n));
    document.querySelectorAll('.ob-step').forEach((el,i)=>el.classList.toggle('active',i===_step));
    document.querySelectorAll('.ob-dot').forEach((el,i)=>el.classList.toggle('active',i===_step));
    const nextBtn=document.querySelector('.ob-next');
    if(nextBtn) nextBtn.textContent=_step===TOTAL-1?'Los geht\'s!':'Weiter →';
    if(_step===1) syncSetup();
  }
  return {
    init(){
      if(localStorage.getItem(KEY)) return;
      document.getElementById('onboarding-overlay')?.classList.remove('hidden');
    },
    next(){ if(_step<TOTAL-1){ setStep(_step+1); } else { this.close(); } },
    goto(n){ setStep(n); },
    close(){
      document.getElementById('onboarding-overlay')?.classList.add('hidden');
      localStorage.setItem(KEY,'1');
    }
  };
})();

/* ──────────────────────────────────────────────
   QUIZ – Altklausur Quiz
────────────────────────────────────────────────── */
function makeQuiz(cfg){
  const G=cfg.G,SFX=cfg.sfx||'',VIEW_ID=cfg.view,HTMLX=!!cfg.html,EXAM_MIN=cfg.minutes||60;
  const $=id=>document.getElementById(id+SFX);
  const $v=()=>document.getElementById(VIEW_ID);
  let self;
  const KEY_BM=cfg.keys.bm;
  const KEY_MASTERY=cfg.keys.mastery;
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  const Q=cfg.Q;

  let _mode='learn',_order=[],_cur=0,_answered=false,_filter='all',_catFilter='all',_inited=false;
  let _bookmarks=new Set(),_examAnswers={},_examSubmitted=false;
  let _masteryMap={},_sessionCorrect=0,_sessionWrong=0,_sessionSkipped=0,_retried=new Set();
  let _typeFilter='all',_posHistory={},_retriedCount=0,_examPendingSubmit=false,_filterOpen=false;
  let _examTimerInterval=null,_examTimeLeft=0,_msel=new Set(),_examQs=[];
  const setTxt=(el,t)=>{if(HTMLX)el.innerHTML=t;else el.textContent=t;};
  const corrSet=q=>new Set(q.type==='multi'?q.correct:[q.correct]);
  const sameSet=(a,b)=>a.size===b.size&&[...a].every(x=>b.has(x));
  const TYPE_LBL={mc:'Multiple Choice',tf:'Richtig / Falsch',multi:'Mehrfachauswahl',essay:'Freitextfrage'};
  const BASIS_LBL={protokoll:'Quelle: Prüfungsprotokoll',tab:'Quelle: IdF-Tab',web:'Quelle: Recherche',gemischt:'Quelle: Protokoll/Tab/Recherche'};
  function examOk(q){const a=_examAnswers[q.id];return q.type==='multi'?!!a&&sameSet(new Set(a),corrSet(q)):a===q.correct;}
  function markOpts(q,sel){const c=corrSet(q);$v().querySelectorAll('.quiz-opt').forEach((b,i)=>{b.disabled=true;b.classList.remove('sel');if(c.has(i)){b.classList.add('correct');if(!sel.has(i))b.classList.add('missed');}else if(sel.has(i))b.classList.add('wrong');});}
  function metaHtml(q){return (q.basis?'<span class="quiz-src-tag">'+(BASIS_LBL[q.basis]||'')+'</span>':'')+(q.unsicher?'<span class="quiz-src-tag quiz-src-warn">⚠ Antwort bitte prüfen</span>':'');}

  function startTimer(){
    if(document.documentElement.classList.contains('no-timers')) return;
    _examTimeLeft=EXAM_MIN*60;
    const bar=$('quiz-exam-timer-bar');
    if(bar)bar.classList.remove('hidden');
    updateTimerDisplay();
    clearInterval(_examTimerInterval);
    const end=Date.now()+_examTimeLeft*1000;   // Endzeitpunkt statt Herunterzählen: läuft auch bei gedrosselten Timern richtig
    _examTimerInterval=setInterval(()=>{_examTimeLeft=Math.max(0,Math.round((end-Date.now())/1000));updateTimerDisplay();if(_examTimeLeft<=0){clearInterval(_examTimerInterval);self.submitExam(true);}},1000);
  }
  function updateTimerDisplay(){
    const el=$('quiz-exam-time');if(!el)return;
    const m=Math.floor(_examTimeLeft/60),s=_examTimeLeft%60;
    el.textContent=m+':'+String(s).padStart(2,'0');
    const bar=$('quiz-exam-timer-bar');
    if(bar)bar.classList.toggle('qetb-urgent',_examTimeLeft<=300);
  }
  function stopTimer(){
    clearInterval(_examTimerInterval);_examTimerInterval=null;
    const bar=$('quiz-exam-timer-bar');
    if(bar)bar.classList.add('hidden');
  }

  const CAT_LABELS=cfg.catLabels||{};

  function loadBm(){try{const s=localStorage.getItem(KEY_BM);if(s)_bookmarks=new Set(JSON.parse(s));}catch(e){}}
  function saveBm(){try{localStorage.setItem(KEY_BM,JSON.stringify([..._bookmarks]));}catch(e){}}
  // Wiederholung nach Plan: richtig = nächste Stufe (1, 3, 7, 14, 30 Tage), falsch = Stufe 1 und sofort fällig
  const KEY_SRS=cfg.keys.srs, SRS_DAYS=[0,1,3,7,14,30];
  let _srs={};
  function loadSrs(){try{_srs=JSON.parse(localStorage.getItem(KEY_SRS)||'{}')||{};}catch(e){_srs={};}}
  function srsUpdate(id,ok){
    const cur=_srs[id]||{box:0};
    const box=ok?Math.min(5,(cur.box||0)+1):1;
    _srs[id]={box,due:ok?Date.now()+SRS_DAYS[box]*864e5:Date.now()};
    try{localStorage.setItem(KEY_SRS,JSON.stringify(_srs));}catch(e){}
  }
  const isDue=id=>!!_srs[id]&&_srs[id].due<=Date.now();
  function dueCount(){ loadSrs(); return Object.values(_srs).filter(x=>x&&x.due<=Date.now()).length; }
  function updateDueBtn(){const b=$('quiz-filter-due');if(b){const n=Q.filter(q=>isDue(q.id)).length;b.textContent='↻ Fällig'+(n?' ('+n+')':'');}}
  function loadMastery(){try{const s=localStorage.getItem(KEY_MASTERY);if(s)_masteryMap=JSON.parse(s);}catch(e){}}
  function saveMastery(){try{localStorage.setItem(KEY_MASTERY,JSON.stringify(_masteryMap));}catch(e){}}

  const KEY_STATS=cfg.keys.stats;
  function loadStats(){try{return JSON.parse(localStorage.getItem(KEY_STATS)||'{"sessions":[],"exams":[]}');}catch{return{sessions:[],exams:[]};}}
  function saveStats(d){try{localStorage.setItem(KEY_STATS,JSON.stringify(d));}catch{}}
  function recordSession(ok,err,skip){
    if(!ok&&!err&&!skip)return;
    const d=loadStats();
    d.sessions.push({ts:new Date().toISOString().slice(0,16),ok,err,skip});
    if(d.sessions.length>50)d.sessions=d.sessions.slice(-50);
    saveStats(d);
  }
  function recordExam(ok,total,pct,grade){
    const d=loadStats();
    d.exams.push({ts:new Date().toISOString().slice(0,16),ok,total,pct,grade});
    if(d.exams.length>20)d.exams=d.exams.slice(-20);
    saveStats(d);
  }
  function shuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=0|Math.random()*(i+1);[r[i],r[j]]=[r[j],r[i]];}return r;}
  function filteredIds(){let p=_filter==='bookmarked'?Q.filter(q=>_bookmarks.has(q.id)):_filter==='wrong'?Q.filter(q=>_masteryMap[q.id]==='err'):_filter==='due'?Q.filter(q=>isDue(q.id)):Q;if(_catFilter!=='all')p=p.filter(q=>q.cat===_catFilter);if(_typeFilter!=='all')p=p.filter(q=>q.type===_typeFilter);return p.map(q=>q.id);}
  function buildOrder(){_order=shuffle(filteredIds());_cur=0;_answered=false;_sessionCorrect=0;_sessionWrong=0;_sessionSkipped=0;_retried=new Set();_retriedCount=0;_posHistory={};hideSummary();renderFilterStatus();}
  function curQ(){return Q.find(q=>q.id===_order[_cur]);}

  function renderCatBar(){
    const bar=$('quiz-cat-bar');if(!bar)return;
    const cats=[...new Set(Q.map(q=>q.cat))];
    bar.innerHTML='<button class="quiz-cat-filter-btn'+(_catFilter==='all'?' active':'')+'" data-cat="all">Alle</button>'
      +cats.map(c=>'<button class="quiz-cat-filter-btn'+(_catFilter===c?' active':'')+'" data-cat="'+esc(c)+'">'+(CAT_LABELS[c]||esc(c))+'</button>').join('');
    bar.querySelectorAll('.quiz-cat-filter-btn').forEach(btn=>{btn.addEventListener('click',()=>{self.setCatFilter(btn.dataset.cat);});});
  }

  function renderMastery(){
    const grid=$('quiz-mastery-grid');if(!grid)return;
    grid.innerHTML=Q.map(q=>{const m=_masteryMap[q.id];return'<span class="qmd '+(m==='ok'?'qmd-ok':m==='err'?'qmd-err':'qmd-un')+'" title="'+esc(q.q.substring(0,60))+'"></span>';}).join('');
  }

  function renderMasteryCats(){
    const el=$('quiz-mastery-cats');if(!el)return;
    const cats=[...new Set(Q.map(q=>q.cat))];
    el.innerHTML=cats.map(cat=>{
      const qs=Q.filter(q=>q.cat===cat);
      const ok=qs.filter(q=>_masteryMap[q.id]==='ok').length;
      const err=qs.filter(q=>_masteryMap[q.id]==='err').length;
      const pct=Math.round((ok/qs.length)*100);
      return'<div class="quiz-mcat"><span class="quiz-mcat-name">'+(CAT_LABELS[cat]||esc(cat))+'</span><div class="quiz-mcat-bar"><div class="quiz-mcat-fill" style="width:'+pct+'%"></div></div><span class="quiz-mcat-stat"><span class="qmc-ok">'+ok+'✓</span> <span class="qmc-err">'+err+'✗</span> / '+qs.length+'</span></div>';
    }).join('');
  }

  function renderTypeBar(){
    const bar=$('quiz-type-bar');if(!bar)return;
    const types=[{k:'all',l:'Alle Typen'},{k:'mc',l:'Multiple Choice'},{k:'multi',l:'Mehrfachauswahl'},{k:'tf',l:'Richtig/Falsch'},{k:'essay',l:'Freitext'}].filter(t=>t.k==='all'||Q.some(q=>q.type===t.k));
    bar.innerHTML=types.map(t=>'<button class="quiz-cat-filter-btn'+(_typeFilter===t.k?' active':'')+'" data-type="'+t.k+'">'+t.l+'</button>').join('');
    bar.querySelectorAll('.quiz-cat-filter-btn').forEach(btn=>{btn.addEventListener('click',()=>{self.setTypeFilter(btn.dataset.type);});});
  }

  function renderFilterStatus(){
    const el=$('quiz-filter-status');
    const tog=$('qft-status');
    const count=filteredIds().length;
    updateDueBtn();
    const parts=[];
    if(_filter!=='all')parts.push(_filter==='bookmarked'?'★ Gemerkte':_filter==='due'?'↻ Fällig':'✗ Falsche');
    if(_catFilter!=='all')parts.push(CAT_LABELS[_catFilter]||_catFilter);
    if(_typeFilter!=='all')parts.push(TYPE_LBL[_typeFilter]||_typeFilter);
    const hasFilter=parts.length>0;
    if(el){
      el.innerHTML='<span class="qfs-count">'+count+' Frage'+(count!==1?'n':'')+'</span>'
        +(parts.length?'<span class="qfs-sep">·</span><span class="qfs-chips">'+parts.map(p=>'<span class="qfs-chip">'+esc(p)+'</span>').join('')+'</span>':'')
        +(hasFilter?'<button class="qfs-reset" onclick="'+G+'.clearFilters()">× leeren</button>':'');
    }
    if(tog){tog.textContent=hasFilter?parts.join(' · '):count+' Fragen';tog.className='qft-status'+(hasFilter?' qft-active':'');}
  }

  function initKeyboard(){
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){const m=$('quiz-mastery-modal');if(m&&!m.classList.contains('hidden')){self.closeMastery();return;}}
      if(_mode!=='learn'||!$v().classList.contains('active')||e.ctrlKey||e.metaKey||e.altKey||(typeof OVL!=='undefined'&&OVL.any()))return;
      const inText=e.target.matches('textarea,input,select,[contenteditable]');
      if(e.key===' '&&!inText&&!(e.target.closest&&e.target.closest('button,a,summary'))){   // Leertaste auf einem fokussierten Knopf klickt den Knopf
        e.preventDefault();
        const q=curQ();if(!q)return;
        if(_answered)self.next();else if(q.type==='essay')self._revealEssay();else if(q.type==='multi')self._check();
      }else if(e.key==='Backspace'&&!inText){
        if(_cur>0){e.preventDefault();self.back();}
      }else if(!inText&&['1','2','3','4','5','6'].includes(e.key)){
        const q=curQ();
        if(!_answered&&q&&(q.type==='mc'||q.type==='tf')){const idx=+e.key-1;if(idx<q.opts.length)self._answer(idx);}
        else if(!_answered&&q&&q.type==='multi'){const idx=+e.key-1;if(idx<q.opts.length)self._toggle(idx);}
      }
    });
  }

  function initTouch(){
    const card=$('quiz-learn-inner');if(!card)return;
    let sx=0,sy=0;
    card.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
    card.addEventListener('touchend',e=>{
      if(_mode!=='learn'||!curQ())return;
      const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
      if(Math.abs(dx)<50||Math.abs(dy)>Math.abs(dx)*0.75)return;
      if(dx<0){if(_answered)self.next();}else{if(_cur>0)self.back();}
    },{passive:true});
  }

  function showSummary(){
    recordSession(_sessionCorrect,_sessionWrong,_sessionSkipped);
    const inner=$('quiz-learn-inner'),summary=$('quiz-summary');
    if(inner)inner.classList.add('hidden');
    if(!summary)return;
    const mc=_sessionCorrect+_sessionWrong||1;
    const pct=Math.round((_sessionCorrect/mc)*100);
    const d=loadStats();
    const past=d.sessions.slice(0,-1);
    let cmpHtml='';
    if(past.length>0){
      const pastOk=past.reduce((s,x)=>s+(x.ok||0),0);
      const pastAns=past.reduce((s,x)=>s+(x.ok||0)+(x.err||0),0);
      const avg=pastAns?Math.round(pastOk/pastAns*100):0;
      const diff=pct-avg;
      const arrow=diff>0?'↑':diff<0?'↓':'→';
      const col=diff>0?'#22c55e':diff<0?'#ef4444':'var(--c-sub)';
      cmpHtml='<div class="quiz-summary-cmp"><span style="color:'+col+'">'+arrow+' '+(diff>0?'+':'')+diff+'%</span> zum Schnitt ('+avg+'%)</div>';
    }
    summary.innerHTML='<div class="quiz-summary-inner"><div class="quiz-summary-title">Runde abgeschlossen!</div><div class="quiz-summary-stats"><div class="quiz-stat quiz-stat-ok"><div class="quiz-stat-num">'+_sessionCorrect+'</div><div class="quiz-stat-label">Richtig</div></div><div class="quiz-stat quiz-stat-err"><div class="quiz-stat-num">'+_sessionWrong+'</div><div class="quiz-stat-label">Falsch</div></div><div class="quiz-stat quiz-stat-skip"><div class="quiz-stat-num">'+_sessionSkipped+'</div><div class="quiz-stat-label">Übersprungen</div></div></div><div class="quiz-summary-pct">'+pct+' % richtig (MC / R-F)</div>'+cmpHtml+'<button class="quiz-next-btn quiz-new-round-btn" onclick="'+G+'.newRound()">Neue Runde ↻</button></div>';
    summary.classList.remove('hidden');
  }

  function hideSummary(){
    const inner=$('quiz-learn-inner'),summary=$('quiz-summary');
    if(inner)inner.classList.remove('hidden');
    if(summary)summary.classList.add('hidden');
  }

  function renderLearn(){
    const q=curQ();
    if(!q){renderEmpty();return;}
    $('quiz-cat').textContent=q.cat;
    $('quiz-counter').textContent=(_cur+1)+' / '+_order.length;
    $('quiz-progress').style.width=((_cur/_order.length)*100)+'%';
    $('quiz-bm-btn').textContent=_bookmarks.has(q.id)?'★':'☆';
    const rt=$('quiz-retry-tag');if(rt)rt.textContent=_retriedCount>0?'+'+_retriedCount+' ↻':'';
    $('quiz-q').textContent=q.q;
    const im=$('quiz-img');if(im){im.innerHTML=q.img||'';im.classList.toggle('hidden',!q.img);}
    const mt=$('quiz-meta');if(mt)mt.innerHTML=metaHtml(q);
    _msel=new Set();
    const tb=$('quiz-type-badge');
    tb.textContent=TYPE_LBL[q.type]||'';
    tb.className='quiz-type-badge quiz-type-'+q.type;
    const opts=$('quiz-opts');
    if(q.type==='mc'){
      opts.innerHTML='<div class="quiz-opts">'+q.opts.map((o,i)=>'<button class="quiz-opt" onclick="'+G+'._answer('+i+')"><span class="quiz-opt-label">'+String.fromCharCode(97+i)+'</span><span class="quiz-opt-text">'+esc(o)+'</span></button>').join('')+'</div>';
    }else if(q.type==='tf'){
      opts.innerHTML='<div class="quiz-opts">'+q.opts.map((o,i)=>'<button class="quiz-opt quiz-tf-opt" onclick="'+G+'._answer('+i+')"><span class="quiz-opt-text">'+esc(o)+'</span></button>').join('')+'</div>';
    }else if(q.type==='multi'){
      opts.innerHTML='<div class="quiz-multi-hint">Mehrere Antworten möglich – alle richtigen müssen gewählt sein.</div><div class="quiz-opts">'+q.opts.map((o,i)=>'<button class="quiz-opt quiz-opt-multi" onclick="'+G+'._toggle('+i+')"><span class="quiz-opt-label quiz-opt-box">'+String.fromCharCode(97+i)+'</span><span class="quiz-opt-text">'+esc(o)+'</span></button>').join('')+'</div><button class="quiz-reveal-btn quiz-check-btn" onclick="'+G+'._check()">Antwort prüfen</button>';
    }else{
      opts.innerHTML='<textarea class="quiz-textarea" aria-label="Deine Antwort" id="quiz-ta'+SFX+'" placeholder="Schreibe deine Antwort hier..." rows="4"></textarea><button class="quiz-reveal-btn" onclick="'+G+'._revealEssay()">Lösung anzeigen</button>';
    }
    const exp=$('quiz-exp');exp.textContent='';exp.className='quiz-exp hidden';
    const noteEl=$('quiz-note');if(noteEl){noteEl.textContent='';noteEl.className='quiz-note hidden';}
    const hist=_posHistory[_cur];
    if(hist){
      _answered=true;
      if(q.type==='essay'){
        setTxt(exp,q.ref);exp.className='quiz-exp quiz-exp-ref';
        const rb=$v().querySelector('.quiz-reveal-btn');if(rb)rb.disabled=true;
      }else{
        markOpts(q,new Set(hist.sel||(hist.userIdx==null?[]:[hist.userIdx])));
        setTxt(exp,q.exp);exp.className=hist.correct?'quiz-exp quiz-exp-ok':'quiz-exp quiz-exp-err';
        if(q.note&&noteEl){noteEl.textContent=q.note;noteEl.className='quiz-note';}
      }
      $('quiz-skip').classList.add('hidden');
      $('quiz-next').classList.remove('hidden');
    }else{
      $('quiz-skip').classList.remove('hidden');
      $('quiz-next').classList.add('hidden');
      _answered=false;
    }
    const bb=$('quiz-back');if(bb)bb.classList.toggle('hidden',_cur===0);
  }

  function renderEmpty(){
    $('quiz-cat').textContent='';$('quiz-counter').textContent='';
    $('quiz-type-badge').textContent='';
    const msg=_filter==='bookmarked'?'Keine gemerkten Fragen für diesen Filter.':_filter==='wrong'?'Keine falsch beantworteten Fragen für diesen Filter.':(_catFilter!=='all'||_typeFilter!=='all'?'Keine Fragen für diesen Filter.':'Keine Fragen gefunden.');
    $('quiz-q').textContent=msg;
    $('quiz-opts').innerHTML='';$('quiz-exp').className='quiz-exp hidden';
    $('quiz-skip').classList.add('hidden');$('quiz-next').classList.add('hidden');
    $('quiz-progress').style.width='100%';
  }

  function renderExam(){
    _examAnswers={};_examSubmitted=false;_examPendingSubmit=false;
    const el=$('quiz-exam-questions');
    _examQs=cfg.examCount?shuffle(Q.filter(q=>q.type!=='essay')).slice(0,cfg.examCount):Q;
    el.innerHTML=_examQs.map((q,qi)=>{
      const isE=q.type==='essay';
      const optsH=isE
        ?'<div class="quiz-exam-essay-note">Freitextfrage – fließt nicht in die Bewertung ein</div><textarea class="quiz-textarea quiz-exam-ta" id="qeta-'+q.id+SFX+'" placeholder="Notizen..." rows="3"></textarea>'
        :(q.type==='multi'?'<div class="quiz-multi-hint">Mehrfachauswahl – alle richtigen Antworten wählen</div>':'')+q.opts.map((o,i)=>'<label class="quiz-exam-opt" id="qeol-'+q.id+'-'+i+SFX+'"><input type="'+(q.type==='multi'?'checkbox':'radio')+'" name="qe-'+q.id+SFX+'" value="'+i+'" onchange="'+G+(q.type==='multi'?'._examTog('+q.id+','+i+',this.checked)':'._examSel('+q.id+','+i+')')+'"><span class="quiz-exam-opt-label">'+(q.type==='tf'?(i===0?'R':'F'):String.fromCharCode(97+i))+'</span><span>'+esc(o)+'</span></label>').join('');
      return '<div class="quiz-exam-q" id="qeq-'+q.id+SFX+'"><div class="quiz-exam-q-header"><span class="quiz-exam-q-num" id="qeqn-'+q.id+SFX+'">Frage '+(qi+1)+'</span><span class="quiz-cat quiz-cat-sm">'+esc(q.cat)+'</span>'+(isE?'<span class="quiz-essay-tag">Freitext</span>':'')+'</div><div class="quiz-exam-q-text">'+esc(q.q)+'</div>'+(q.img?'<div class="quiz-img">'+q.img+'</div>':'')+'<div class="quiz-exam-opts" id="qeo-'+q.id+SFX+'">'+optsH+'</div><div class="quiz-exam-ref hidden" id="qee-'+q.id+SFX+'">'+(HTMLX?(isE?q.ref:q.exp):esc(isE?q.ref:q.exp))+'</div></div>';
    }).join('');
    $('quiz-exam-footer').classList.remove('hidden');
    $('quiz-result').classList.add('hidden');
    startTimer();
  }

  self={
    qs(){return Q;},
    init(){
      if(_inited)return;_inited=true;
      loadBm();loadMastery();loadSrs();buildOrder();renderCatBar();renderTypeBar();renderLearn();initKeyboard();initTouch();
    },
    setMode(m){
      _mode=m;
      $('quiz-learn').classList.toggle('hidden',m!=='learn');
      $('quiz-exam').classList.toggle('hidden',m!=='exam');
      $('quiz-mode-learn').classList.toggle('active',m==='learn');
      $('quiz-mode-exam').classList.toggle('active',m==='exam');
      if(m==='exam')renderExam();
      else{stopTimer();buildOrder();renderCatBar();renderTypeBar();renderLearn();}
    },
    _answer(idx){
      if(_answered)return;_answered=true;
      const q=curQ();const ok=idx===q.correct;
      markOpts(q,new Set([idx]));
      const exp=$('quiz-exp');
      setTxt(exp,q.exp);exp.className=ok?'quiz-exp quiz-exp-ok':'quiz-exp quiz-exp-err';A11Y.say((ok?'Richtig. ':'Falsch. ')+(q.exp||''));
      const noteEl2=$('quiz-note');if(q.note&&noteEl2){noteEl2.textContent=q.note;noteEl2.className='quiz-note';}
      $('quiz-skip').classList.add('hidden');$('quiz-next').classList.remove('hidden');
      _masteryMap[q.id]=ok?'ok':'err';saveMastery();srsUpdate(q.id,ok);updateDueBtn();
      _posHistory[_cur]={userIdx:idx,correct:ok};
      if(!ok&&!_retried.has(q.id)){_retried.add(q.id);_order.push(q.id);_retriedCount++;const rt=$('quiz-retry-tag');if(rt){rt.textContent='+'+_retriedCount+' ↻';rt.classList.add('qrt-flash');setTimeout(()=>rt.classList.remove('qrt-flash'),600);}}
      if(ok)_sessionCorrect++;else _sessionWrong++;
      renderMastery();renderMasteryCats();
    },
    _revealEssay(){
      if(_answered)return;_answered=true;
      const q=curQ();
      const exp=$('quiz-exp');setTxt(exp,q.ref);exp.className='quiz-exp quiz-exp-ref';
      $('quiz-skip').classList.add('hidden');$('quiz-next').classList.remove('hidden');
      const rb=$v().querySelector('.quiz-reveal-btn');if(rb)rb.disabled=true;
      if(!_masteryMap[q.id]||_masteryMap[q.id]==='err')_masteryMap[q.id]='ok';
      saveMastery();srsUpdate(q.id,true);updateDueBtn();_posHistory[_cur]={userIdx:null,correct:true};
      renderMastery();renderMasteryCats();
    },
    _toggle(i){
      if(_answered)return;
      if(_msel.has(i))_msel.delete(i);else _msel.add(i);
      $v().querySelectorAll('.quiz-opt')[i]?.classList.toggle('sel',_msel.has(i));
    },
    _check(){
      if(_answered)return;
      const q=curQ();if(!q||!_msel.size)return;
      _answered=true;
      const sel=new Set(_msel),ok=sameSet(sel,corrSet(q));
      markOpts(q,sel);
      const exp=$('quiz-exp');setTxt(exp,q.exp);exp.className=ok?'quiz-exp quiz-exp-ok':'quiz-exp quiz-exp-err';
      const noteEl=$('quiz-note');if(q.note&&noteEl){noteEl.textContent=q.note;noteEl.className='quiz-note';}
      const cb=$v().querySelector('.quiz-check-btn');if(cb)cb.disabled=true;
      $('quiz-skip').classList.add('hidden');$('quiz-next').classList.remove('hidden');
      _masteryMap[q.id]=ok?'ok':'err';saveMastery();srsUpdate(q.id,ok);updateDueBtn();
      _posHistory[_cur]={userIdx:null,sel:[...sel],correct:ok};
      if(!ok&&!_retried.has(q.id)){_retried.add(q.id);_order.push(q.id);_retriedCount++;const rt=$('quiz-retry-tag');if(rt)rt.textContent='+'+_retriedCount+' ↻';}
      if(ok)_sessionCorrect++;else _sessionWrong++;
      renderMastery();renderMasteryCats();
    },
    next(){_cur++;if(_cur>=_order.length){showSummary();return;}renderLearn();},
    skip(){_sessionSkipped++;_cur++;if(_cur>=_order.length){showSummary();return;}renderLearn();},
    newRound(){buildOrder();renderLearn();},
    toggleBookmark(){
      const q=curQ();if(!q)return;
      if(_bookmarks.has(q.id))_bookmarks.delete(q.id);else _bookmarks.add(q.id);
      saveBm();$('quiz-bm-btn').textContent=_bookmarks.has(q.id)?'★':'☆';
    },
    setFilter(f){
      _filter=f;
      $('quiz-filter-all').classList.toggle('active',f==='all');
      $('quiz-filter-bm').classList.toggle('active',f==='bookmarked');
      $('quiz-filter-wrong')?.classList.toggle('active',f==='wrong');
      $('quiz-filter-due')?.classList.toggle('active',f==='due');
      buildOrder();renderFilterStatus();renderLearn();
    },
    setCatFilter(cat){_catFilter=cat;renderCatBar();buildOrder();renderFilterStatus();renderLearn();},
    setTypeFilter(t){_typeFilter=t;renderTypeBar();buildOrder();renderFilterStatus();renderLearn();},
    toggleFilters(){
      _filterOpen=!_filterOpen;
      const body=$('quiz-filter-body');
      const chev=$('qft-chevron');
      if(body)body.classList.toggle('open',_filterOpen);
      if(chev)chev.style.transform=_filterOpen?'rotate(180deg)':'';
    },
    clearFilters(){
      _filter='all';_catFilter='all';_typeFilter='all';
      $('quiz-filter-all').classList.add('active');
      $('quiz-filter-bm').classList.remove('active');
      $('quiz-filter-wrong')?.classList.remove('active');
      $('quiz-filter-due')?.classList.remove('active');
      renderCatBar();renderTypeBar();renderFilterStatus();buildOrder();renderLearn();
    },
    back(){if(_cur>0){_cur--;renderLearn();}},
    dueCount,
    reshuffle(){buildOrder();renderLearn();},
    openMastery(){
      renderMastery();renderMasteryCats();
      const m=$('quiz-mastery-modal');
      if(m){m.classList.remove('hidden');document.body.style.overflow='hidden';}
    },
    closeMastery(){
      const m=$('quiz-mastery-modal');
      if(m){m.classList.add('hidden');document.body.style.overflow='';}
    },
    resetMastery(){
      if(!confirm('Lernstand für alle '+Q.length+' Fragen zurücksetzen?'))return;
      _masteryMap={};saveMastery();renderMastery();renderMasteryCats();
    },
    _examSel(qid,idx){_examAnswers[qid]=idx;},
    _examTog(qid,idx,on){const a=new Set(_examAnswers[qid]||[]);if(on)a.add(idx);else a.delete(idx);if(a.size)_examAnswers[qid]=[...a];else delete _examAnswers[qid];},
    submitExam(force){   // force: Zeit abgelaufen, ohne Rückfrage abgeben
      if(_examSubmitted)return;
      const unanswered=_examQs.filter(q=>q.type!=='essay'&&_examAnswers[q.id]===undefined);
      if(unanswered.length>0&&!_examPendingSubmit&&!force){
        unanswered.forEach(q=>{const el=$('qeq-'+q.id);if(el)el.classList.add('exam-q-unanswered');});
        const warn=$('quiz-exam-warn');
        if(warn){warn.textContent=unanswered.length+' Frage'+(unanswered.length!==1?'n':'')+' noch nicht beantwortet – nochmal klicken zum Abgeben.';warn.classList.remove('hidden');}
        const first=$('qeq-'+unanswered[0].id);
        if(first)first.scrollIntoView({behavior:'smooth',block:'center'});
        _examPendingSubmit=true;return;
      }
      _examSubmitted=true;_examPendingSubmit=false;stopTimer();
      let correct=0,total=0;
      _examQs.forEach(q=>{
        const ee=$('qee-'+q.id);if(ee)ee.classList.remove('hidden');
        if(q.type==='essay')return;
        total++;
        const sel=_examAnswers[q.id],ok=examOk(q),selS=new Set(q.type==='multi'?(sel||[]):[sel]),cS=corrSet(q);
        if(ok)correct++;
        q.opts.forEach((o,i)=>{const l=$('qeol-'+q.id+'-'+i);if(!l)return;if(cS.has(i))l.classList.add('exam-correct');else if(selS.has(i))l.classList.add('exam-wrong');});
        const eo=$('qeo-'+q.id);if(eo)eo.querySelectorAll('input').forEach(inp=>inp.disabled=true);
        const qel=$('qeq-'+q.id);if(qel)qel.classList.add(ok?'exam-q-correct':'exam-q-wrong');
      });
      const pct=Math.round((correct/total)*100);
      const grade=pct>=90?'Sehr gut':pct>=75?'Gut':pct>=60?'Befriedigend':pct>=50?'Ausreichend':'Nicht bestanden';
      recordExam(correct,total,pct,grade);
      const catBreakdown=[...new Set(_examQs.filter(q=>q.type!=='essay').map(q=>q.cat))].map(cat=>{
        const cq=_examQs.filter(q=>q.cat===cat&&q.type!=='essay');
        const cok=cq.filter(examOk).length;
        const cp=Math.round((cok/cq.length)*100);
        return'<div class="quiz-rcat"><span class="quiz-rcat-name">'+(CAT_LABELS[cat]||esc(cat))+'</span><div class="quiz-rcat-bar"><div class="quiz-rcat-fill'+(cp<60?' qrf-fail':'')+'" style="width:'+cp+'%"></div></div><span class="quiz-rcat-stat">'+cok+'/'+cq.length+'</span></div>';
      }).join('');
      const res=$('quiz-result');
      res.innerHTML='<div class="quiz-result-inner"><div class="quiz-result-title">Ergebnis</div><div class="quiz-result-score">'+correct+' / '+total+'</div><div class="quiz-result-pct '+(pct>=60?'grade-ok':'grade-fail')+'">'+pct+' %</div><div class="quiz-result-grade">'+grade+'</div><div class="quiz-result-bar"><div class="quiz-result-fill" style="width:'+pct+'%"></div></div><div class="quiz-result-cats">'+catBreakdown+'</div><p class="quiz-result-note">'+total+' bewertete Fragen (MC + R/F'+(Q.some(x=>x.type==='multi')?' + Mehrfachauswahl, nur ganz richtig zählt':'')+'). Freitextfragen nicht eingerechnet.<br>Scrolle nach oben, um alle Korrekturen zu sehen.</p><button class="quiz-retry-btn" onclick="'+G+'.setMode(\'exam\')">Nochmal versuchen</button></div>';
      res.classList.remove('hidden');
      $('quiz-exam-footer').classList.add('hidden');
      res.scrollIntoView({behavior:'smooth'});
    }
  };

  return self;
}
const QUIZ=makeQuiz({G:'QUIZ',view:'v-vak-altklausur',sfx:'',minutes:60,
  keys:{bm:'bvi_quiz_bm',mastery:'bvi_quiz_mastery',srs:'bvi_quiz_srs',stats:'bvi_quiz_stats'},
  catLabels:{'Staatsorganisationsrecht':'StaatsorgR','Allgemeines Verwaltungsrecht':'AllgVwR','Verwaltungsvollstreckung / Rechtsschutz':'Vollstr./RS','Beamten- und Disziplinarrecht':'BeamtR','Gefahrenabwehr / Feuerwehrrecht':'GefahrenabwR'},
  Q:[{"id":1,"cat":"Staatsorganisationsrecht","type":"essay","q":"Nennen Sie die Verfassungsorgane, die bei den einzelnen Phasen der Bundesgesetzgebung beteiligt sind oder beteiligt sein können (Gesetzesinitiative, Gesetzesberatung, Gesetzesbeschluss, Länderbeteiligung, Ausfertigung, Verkündung).","ref":"Gesetzesinitiative (Art. 76 I GG): Bundesregierung ✓, Bundesrat ✓, Bundestag ✓\nGesetzesberatung/1. Durchgang: Bundestag ✓, Bundesrat ✓ (Stellungnahme), Bundesregierung ✓\nGesetzesbeschluss (Art. 77 I GG): nur Bundestag ✓\nLänderbeteiligung/2. Durchgang (Art. 77 II ff.): Bundesrat ✓ (Zustimmung/Einspruch, ggf. Vermittlungsausschuss)\nAusfertigung (Art. 82 I GG): Bundespräsident ✓, Bundesregierung ✓ (Gegenzeichnung, Art. 58 GG)\nVerkündung im BGBl. (Art. 82 I GG): Bundespräsident ✓\nDas Bundesverfassungsgericht ist am regulären Gesetzgebungsverfahren nie beteiligt."},{"id":2,"cat":"Staatsorganisationsrecht","type":"essay","q":"Welche Auswirkungen haben Änderungen in den politischen Kräfteverhältnissen in den Landesparlamenten auf der Bundesebene? Erläutern Sie dies für die Wahl des Bundespräsidenten und für Grundgesetzänderungen.","ref":"Bundespräsidentenwahl: Die Bundesversammlung besteht zur Hälfte aus von den Landesparlamenten entsandten Mitgliedern (Art. 54 III GG); Mehrheitsverschiebungen in den Landtagen verschieben die Mehrheitsverhältnisse bei der Präsidentenwahl.\nGrundgesetzänderungen: Erforderlich sind zwei Drittel der Stimmen des Bundesrates (Art. 79 II GG); der Bundesrat besteht aus Mitgliedern der Landesregierungen (Art. 51 GG) – welche Koalitionen dort regieren, hängt von den Landtagswahlen ab."},{"id":3,"cat":"Staatsorganisationsrecht","type":"tf","q":"Grundrechte sind Abwehrrechte der Bürgerinnen und Bürger gegen den Staat.","opts":["Richtig","Falsch"],"correct":0,"exp":"Das ist ihre klassische Funktion gegenüber dem Staat."},{"id":4,"cat":"Staatsorganisationsrecht","type":"tf","q":"Gemeinderäte sind Bestandteile der vollziehenden Gewalt.","opts":["Richtig","Falsch"],"correct":0,"exp":"Trotz parlamentsähnlicher Struktur gehört die kommunale Selbstverwaltung nach Art. 28 II GG organisatorisch zur Exekutive, da es auf kommunaler Ebene keine eigene Gewaltenteilung gibt."},{"id":5,"cat":"Staatsorganisationsrecht","type":"tf","q":"Das Schulrecht fällt in die konkurrierende Gesetzgebungskompetenz des Bundes und der Länder.","opts":["Richtig","Falsch"],"correct":1,"exp":"Schulrecht ist Ländersache (Kulturhoheit der Länder); eine Bundeskompetenz nach Art. 70 ff. GG besteht dafür nicht."},{"id":6,"cat":"Staatsorganisationsrecht","type":"tf","q":"Der Bundeskanzler beziehungsweise die Bundeskanzlerin kann den Deutschen Bundestag auflösen.","opts":["Richtig","Falsch"],"correct":1,"exp":"Auflösen kann nur der Bundespräsident, und nur in den engen Fällen der Art. 63 IV oder Art. 68 GG."},{"id":7,"cat":"Staatsorganisationsrecht","type":"tf","q":"Der Bundeskanzler beziehungsweise die Bundeskanzlerin vertritt im Falle der Verhinderung den Bundespräsidenten.","opts":["Richtig","Falsch"],"correct":1,"exp":"Das übernimmt nach Art. 57 GG der Präsident des Bundesrates."},{"id":8,"cat":"Staatsorganisationsrecht","type":"tf","q":"Bundespräsident Steinmeier kann 2027 wiedergewählt werden.","opts":["Richtig","Falsch"],"correct":1,"exp":"Seine zweite Amtszeit endet am 18. März 2027, eine dritte Amtszeit in Folge schließt Art. 54 II GG aus."},{"id":9,"cat":"Staatsorganisationsrecht","type":"tf","q":"Autos sind vom Schutzbereich des Art. 13 Abs. 1 GG umfasst.","opts":["Richtig","Falsch"],"correct":1,"exp":"Art. 13 GG schützt die Wohnung; Kraftfahrzeuge fallen nach ständiger Rechtsprechung nicht darunter.","note":"Wohnmobile schon, obwohl sie ein KFZ sind. (Wohnwagen auch) – sie sind ein Raum des Rückzuges und der Privatsphäre."},{"id":10,"cat":"Staatsorganisationsrecht","type":"tf","q":"Alle Grundrechte sind im Rahmen der Regelungen des Grundgesetzes einschränkbar.","opts":["Richtig","Falsch"],"correct":1,"exp":"Die Menschenwürde (Art. 1 I GG) ist nach Art. 79 III GG unantastbar; vorbehaltlos gewährleistete Grundrechte wie Art. 4 I GG sind nur durch verfassungsimmanente Schranken einschränkbar."},{"id":11,"cat":"Staatsorganisationsrecht","type":"tf","q":"Die Wahlrechtsgrundsätze lauten Allgemein, Unmittelbar, Frei und Geheim.","opts":["Richtig","Falsch"],"correct":1,"exp":"Art. 38 I 1 GG nennt fünf Grundsätze; es fehlen die Gleichheit der Wahl und die Öffentlichkeit (durch BVerfG aus Art. 38 i.V.m. Art. 20 GG entwickelt)."},{"id":12,"cat":"Staatsorganisationsrecht","type":"tf","q":"Das Grundgesetz wurde am 23.05.1949 verkündet.","opts":["Richtig","Falsch"],"correct":0,"exp":"Verkündet wurde es am 23.05.1949. In Kraft getreten ist es erst am folgenden Tag, dem 24.05.1949."},{"id":13,"cat":"Staatsorganisationsrecht","type":"mc","q":"Was beschreibt das Entschließungsermessen?","opts":["Die Auswahl eines Mittels durch die Behörde","Die Entscheidung, ob die Behörde überhaupt tätig wird","Die Pflicht zur Anhörung des Betroffenen","Die Festlegung von Nebenbestimmungen"],"correct":1,"exp":"Das Entschließungsermessen betrifft nur die Frage, ob die Behörde tätig wird. Welches Mittel sie einsetzt, ist das davon zu unterscheidende Auswahlermessen."},{"id":14,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welches Kriterium gehört nicht zur Verhältnismäßigkeitsprüfung?","opts":["Legitimer Zweck","Geeignetheit","Rechtmäßigkeit","Angemessenheit"],"correct":2,"exp":"Die Prüfung umfasst legitimen Zweck, Geeignetheit, Erforderlichkeit und Angemessenheit. Die Rechtmäßigkeit ist keine eigene Stufe, sondern das Ergebnis der Prüfung."},{"id":15,"cat":"Staatsorganisationsrecht","type":"mc","q":"Woran erkennt man in einer Norm typischerweise Ermessensspielräume?","opts":["An der Verwendung von „muss\"","An der Verwendung von „kann\" oder „darf\"","An der Reihenfolge der Normabsätze","An der Länge des Gesetzestextes"],"correct":1,"exp":"„Kann\" oder „darf\" signalisieren Ermessen; „muss\" oder „ist\" weisen auf eine gebundene Entscheidung hin."},{"id":16,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Aussage zur Konkurrenzgesetzgebung ist korrekt?","opts":["Der Bund darf nur tätig werden, wenn die Länder zustimmen","Die Länder sind zuständig, bis der Bund tätig wird","Der Bund ist immer zuständig","Konkurrenzgesetzgebung betrifft nur das Steuerrecht"],"correct":1,"exp":"Das folgt aus Art. 72 I GG: Die Länder haben die Gesetzgebungsbefugnis, solange und soweit der Bund von seiner Zuständigkeit nicht durch Gesetz Gebrauch gemacht hat."},{"id":17,"cat":"Staatsorganisationsrecht","type":"mc","q":"Was bedeutet das Rechtsstaatsprinzip?","opts":["Es verpflichtet den Staat zu wirtschaftlicher Neutralität","Es garantiert rechtliche Unabhängigkeit","Es verbietet Gewaltenteilung","Es erlaubt Verwaltungshandeln ohne Gesetz"],"correct":1,"exp":"Die richterliche Unabhängigkeit (Art. 97 GG) ist eine anerkannte Ausprägung des Rechtsstaatsprinzips. Es umfasst vor allem die Bindung an Gesetz und Recht, den Vorbehalt des Gesetzes, Rechtssicherheit und Rechtsschutz."},{"id":18,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Aussage beschreibt das Prinzip der Gewaltenteilung im deutschen Grundgesetz zutreffend?","opts":["Die Legislative kontrolliert ausschließlich die Exekutive","Die Gewalten sind strikt getrennt und dürfen nicht zusammenwirken","Die Staatsgewalt ist in Legislative, Exekutive und Judikative gegliedert, mit funktionalen Überschneidungen","Die Judikative entscheidet nur über politische Fragen"],"correct":2,"exp":"Das deutsche Modell kennt keine strikte Trennung, sondern eine Gewaltenverschränkung mit wechselseitigen Kontrollmechanismen."},{"id":19,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche der folgenden Institutionen gehört nicht zu den (ständigen) Verfassungsorganen der Bundesrepublik Deutschland?","opts":["Der Bundesrat","Der Bundespräsident","Das Bundesverfassungsgericht","Die Bundesversammlung"],"correct":3,"exp":"Zu den fünf ständigen Verfassungsorganen zählen Bundestag, Bundesrat, Bundesregierung, Bundespräsident und Bundesverfassungsgericht. Die Bundesversammlung tritt nur bei Bedarf zur Präsidentenwahl zusammen."},{"id":20,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Aussage zur Bundesrat-Mitwirkung im Gesetzgebungsverfahren ist korrekt?","opts":["Der Bundesrat wirkt nur bei Finanzgesetzen mit","Der Bundesrat hat bei Zustimmungsgesetzen ein Vetorecht, das der Bundestag nicht überstimmen kann","Der Bundesrat ist am Gesetzgebungsverfahren nie beteiligt","Der Bundesrat kann nur beratende Stellungnahmen abgeben"],"correct":1,"exp":"Bei Zustimmungsgesetzen kommt das Gesetz ohne Zustimmung des Bundesrates nicht zustande. Das unterscheidet sie von Einspruchsgesetzen, bei denen der Bundestag einen Einspruch zurückweisen kann (Art. 77 IV GG)."},{"id":21,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Aussage zum Wahlgrundsatz der Gleichheit ist zutreffend?","opts":["Jede Stimme hat den gleichen Zähl- und Erfolgswert","Der Erfolgswert darf unterschiedlich sein, solange alle wählen dürfen","Wahlgleichheit gilt nur für Bundestagswahlen","Wahlgleichheit verlangt zwingend Mehrheitswahl"],"correct":0,"exp":"Das folgt aus Art. 38 I 1 GG: Jede Stimme hat denselben Zählwert und denselben Erfolgswert."},{"id":22,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was ist nach § 35 VwVfG ein Verwaltungsakt?","opts":["Eine Rechtsverordnung, die von einer obersten Bundesbehörde erlassen wird","Eine Maßnahme einer Behörde zur Regelung eines Einzelfalls auf dem Gebiet des öffentlichen Rechts mit Außenwirkung","Ein allgemeiner Erlass, der für eine unbestimmte Vielzahl von Fällen gilt","Eine innerdienstliche Anweisung ohne rechtliche Außenwirkung"],"correct":1,"exp":"So die Legaldefinition in § 35 S. 1 VwVfG."},{"id":23,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Welches der folgenden Merkmale muss ein Verwaltungsakt nach § 35 VwVfG erfüllen?","opts":["Er muss schriftlich erlassen sein","Er muss von einem Gericht stammen","Er muss eine Regelung enthalten","Er muss sich auf Zivilrecht beziehen"],"correct":2,"exp":"Der Regelungscharakter ist das zentrale Tatbestandsmerkmal des § 35 VwVfG."},{"id":24,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Welche Aussage trifft im Sinne des § 35 VwVfG am ehesten auf die „Außenwirkung\" eines Verwaltungsaktes zu?","opts":["Der Verwaltungsakt muss für die allgemeine Öffentlichkeit bestimmt sein","Der Verwaltungsakt betrifft ausschließlich interne Verwaltungsabläufe","Der Verwaltungsakt muss gegenüber einer außerhalb der Verwaltung stehenden Person rechtliche Wirkung entfalten","Die Außenwirkung meint, dass der Verwaltungsakt öffentlich bekannt gemacht werden muss"],"correct":2,"exp":"Außenwirkung bedeutet Rechtswirkung gegenüber einer außerhalb der Verwaltung stehenden Person."},{"id":25,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Welche der folgenden Maßnahmen stellt typischerweise keinen Verwaltungsakt im Sinne des § 35 VwVfG dar?","opts":["Eine Baugenehmigung für ein Wohnhaus","Die Versetzung eines Beamten in eine andere Dienststelle","Eine Straßenverkehrsbehörde stellt ein Halteverbotsschild auf","Eine Ministerin kündigt auf einer Pressekonferenz ein neues Gesetzesvorhaben an"],"correct":3,"exp":"Der Ankündigung fehlt die Regelung eines Einzelfalls – sie ist eine politische Aussage ohne unmittelbare Rechtswirkung. Das Halteverbotsschild gilt als Allgemeinverfügung."},{"id":26,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was ist vor dem Erlass eines belastenden Verwaltungsaktes grundsätzlich erforderlich?","opts":["Die Veröffentlichung im Amtsblatt","Die Genehmigung durch das Bundesministerium","Die Anhörung des Betroffenen","Die Zustimmung des Landtages"],"correct":2,"exp":"So § 28 I VwVfG."},{"id":27,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Wann kann auf eine Anhörung vor Erlass eines Verwaltungsaktes verzichtet werden?","opts":["Nie","Nur bei Gefahr im Verzug","Wenn dies durch Verwaltungsvorschriften vorgesehen ist","Wenn § 28 Abs. 2 VwVfG dies zulässt"],"correct":3,"exp":"§ 28 II VwVfG zählt mehrere Fallgruppen auf, etwa Gefahr im Verzug, Allgemeinverfügungen oder Massenverfahren – „nur bei Gefahr im Verzug\" wäre zu eng."},{"id":28,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was gilt, wenn eine erforderliche Anhörung unterblieben ist?","opts":["Der Verwaltungsakt ist automatisch nichtig","Die Anhörung kann nachgeholt werden","Der Verwaltungsakt bleibt dauerhaft unwirksam","Der Verwaltungsakt ist nur in Bayern gültig"],"correct":1,"exp":"Nach § 45 VwVfG ist dieser Verfahrensfehler heilbar."},{"id":29,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Welche Aussage ist richtig?","opts":["Jeder Verwaltungsakt muss durch die Polizei vollzogen werden","Verwaltungsakte werden durch das Grundgesetz definiert","Allgemeinverfügungen richten sich an eine unbestimmte Vielzahl von Personen","Ein Verwaltungsakt muss immer durch den Bundesrat bestätigt werden"],"correct":2,"exp":"So die Definition der Allgemeinverfügung in § 35 S. 2 VwVfG."},{"id":30,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Wann wird ein Verwaltungsakt wirksam?","opts":["Bei Unterschrift durch den Behördenleiter","Bei Veröffentlichung im Gesetzblatt","Mit seiner Bekanntgabe","Nach Zustimmung der betroffenen Person"],"correct":2,"exp":"So §§ 41, 43 VwVfG."},{"id":31,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was ist eine Nebenbestimmung im Verwaltungsakt?","opts":["Ein unwesentlicher Zusatz ohne rechtliche Wirkung","Eine Regelung, die den Verwaltungsakt inhaltlich oder zeitlich einschränkt","Eine interne Dienstanweisung","Eine mündliche Erläuterung für den Bürger"],"correct":1,"exp":"So § 36 VwVfG."},{"id":32,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was ist eine Bedingung im Sinne des § 36 VwVfG?","opts":["Eine sofort wirksame Einschränkung","Von einem künftigen ungewissen Ereignis abhängige Regelung","Eine interne Absprache","Eine Obliegenheit"],"correct":1,"exp":"Eine Bedingung macht den Eintritt oder Wegfall einer Vergünstigung oder Belastung vom ungewissen Eintritt eines künftigen Ereignisses abhängig (§ 36 II Nr. 2 VwVfG)."},{"id":33,"cat":"Allgemeines Verwaltungsrecht","type":"essay","q":"Was ist eine Auflage gemäß § 36 VwVfG? Erläutern Sie den Unterschied zur Bedingung.","ref":"Eine Auflage (§ 36 II Nr. 4 VwVfG) verpflichtet die begünstigte Person zu einem zusätzlichen Tun, Dulden oder Unterlassen, ohne dass die Wirksamkeit des Verwaltungsakts selbst davon abhängt.\nUnterschied zur Bedingung: Bei der Bedingung steht die Wirksamkeit des Hauptverwaltungsakts infrage (er tritt erst ein oder entfällt bei Bedingungseintritt). Bei der Auflage bleibt der Hauptverwaltungsakt voll wirksam; die Auflage kann eigenständig durchgesetzt werden."},{"id":34,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was ist ein Realakt?","opts":["Hoheitliche Aufgabe","Gesetz","Verwaltungsakt","Vertrag"],"correct":0,"exp":"In der Altklausur passt von den vier Optionen „Hoheitliche Aufgabe“ am ehesten: Ein Realakt ist schlichtes (tatsächliches) Verwaltungshandeln in Erfüllung öffentlicher Aufgaben ohne Regelungswirkung – z. B. Auskunft, Warnung, Straßenreinigung oder das Absperren einer Unfallstelle. Ein Verwaltungsakt regelt dagegen einen Einzelfall mit Außenwirkung (§ 35 VwVfG); Gesetz und Vertrag sind andere Handlungsformen."},{"id":35,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was sind Ampel- und Handzeichen der Polizei nach der Rechtsprechung?","opts":["Gesetz","Realakt","Allgemeinverfügung","Verordnung"],"correct":2,"exp":"Die Rechtsprechung behandelt Ampelzeichen als Verwaltungsakte in Form von Allgemeinverfügungen, gerichtet an die jeweils anwesenden Verkehrsteilnehmer. Gleiches gilt für Zeichen von Polizeibeamten nach § 36 StVO."},{"id":36,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Welche Zwangsmittel kennt das Verwaltungsvollstreckungsrecht typischerweise?","opts":["Bußgeld, Freiheitsentzug, Enteignung","Zwangsgeld, Ersatzvornahme, unmittelbarer Zwang","Ordnungsstrafe, Hausverbot, Verwarnung","Verwarnungsgeld, Bußgeld, Verhaftung"],"correct":1,"exp":"Nach dem Bundes-VwVG: Ersatzvornahme (§ 10), Zwangsgeld (§ 11), unmittelbarer Zwang (§ 12), zusammengefasst in § 9 VwVG."},{"id":37,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Was ist der wesentliche Unterschied zwischen Verwaltungsvollstreckung und Sofortvollzug?","opts":["Es gibt keinen Unterschied","Der Sofortvollzug kann ohne vorherigen Verwaltungsakt erfolgen","Die Verwaltungsvollstreckung ist nur für Steuerschulden möglich","Der Sofortvollzug darf nur bei Notstand angewendet werden"],"correct":1,"exp":"§ 6 II VwVG: Der Sofortvollzug ist zulässig, wenn die vorherige Bekanntgabe eines Verwaltungsakts den Zweck der Maßnahme vereiteln würde."},{"id":38,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Was muss vor dem Einsatz von Zwangsmitteln vorliegen?","opts":["Eine richterliche Genehmigung","Ein Gesetz zur Anordnung","Ein wirksamer Verwaltungsakt, der nicht befolgt wird","Eine Anzeige durch Dritte"],"correct":2,"exp":"So § 6 I VwVG des Bundes beziehungsweise § 55 I VwVG NRW."},{"id":39,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Welche Wirkung hat ein Widerspruch gegen einen belastenden Verwaltungsakt?","opts":["Keine","Er verzögert die Zustellung","Er hat aufschiebende Wirkung","Er macht den Verwaltungsakt nichtig"],"correct":2,"exp":"So § 80 I VwGO."},{"id":40,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Was muss die Behörde tun, wenn sie trotz Widerspruchs sofort vollziehen will?","opts":["Klage beim Verwaltungsgericht erheben","Eine Anhörung durchführen","Sofortige Vollziehung anordnen und begründen","Den Verwaltungsakt zurücknehmen"],"correct":2,"exp":"So § 80 II Nr. 4, § 80 III VwGO."},{"id":41,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Wie kann sich der Adressat gegen die Anordnung der sofortigen Vollziehung wehren?","opts":["Mit Dienstaufsichtsbeschwerde","Mit Gegenvorstellung bei der Behörde","Mit Eilantrag beim Verwaltungsgericht","Mit Antrag beim Bundesverfassungsgericht"],"correct":2,"exp":"So § 80 V VwGO."},{"id":42,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Was regelt § 34 BeamtStG?","opts":["Dienstunfall","Pflicht zum vollen persönlichen Einsatz","Wahlrecht","Nebentätigkeiten"],"correct":1,"exp":"Beamtinnen und Beamte haben sich mit vollem persönlichem Einsatz ihrem Beruf zu widmen und ihr Verhalten muss der Achtung und dem Vertrauen gerecht werden, die ihr Beruf erfordert."},{"id":43,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Welches Beamtenverhältnis gibt es nicht?","opts":["Beamter auf Probe","Beamter auf Widerruf","Beamter auf Lebenszeit","Beamter auf Abruf"],"correct":3,"exp":"Nach § 4 BeamtStG gibt es Beamte auf Lebenszeit, auf Probe, auf Widerruf und auf Zeit. Einen „Beamten auf Abruf\" kennt das Beamtenrecht nicht."},{"id":44,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Was ist die Voraussetzung für die Berufung in das Beamtenverhältnis?","opts":["10 Jahre Berufserfahrung","Deutsche oder EU-Staatsangehörigkeit","Privatrechtlicher Vertrag","Kirchenzugehörigkeit"],"correct":1,"exp":"Diese materielle Voraussetzung steht in § 7 BeamtStG. § 8 BeamtStG regelt die Ernennung als formalen Akt."},{"id":45,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Welcher Zweck gehört nicht zu den klassischen Zielen des Disziplinarrechts?","opts":["Erziehungszweck","Schutzfunktion","Privatisierung der Ermittlungen","Reinigungsfunktion"],"correct":2,"exp":"Das Disziplinarverfahren ist und bleibt ein hoheitliches, staatliches Verfahren. Erziehungszweck, Schutzfunktion und Reinigungsfunktion sind anerkannte Zwecke."},{"id":46,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Was ist der Zweck des Disziplinarrechts?","opts":["Bestrafung","Erziehung und Funktionssicherung","Politische Kontrolle","Gehaltskürzungen maximieren"],"correct":1,"exp":"Das Disziplinarrecht dient der Erziehung (Wiedereingliederung) und der Funktionssicherung des Berufsbeamtentums, nicht der Bestrafung im strafrechtlichen Sinne."},{"id":47,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Wann muss ein Disziplinarverfahren eingeleitet werden?","opts":["Sobald der Personalrat zustimmt","Wenn eine anonyme Beschwerde eingeht","Bei zureichenden tatsächlichen Anhaltspunkten für ein Dienstvergehen","Wenn ein Strafbefehl rechtskräftig ist"],"correct":2,"exp":"Es gilt das Legalitätsprinzip – dem Dienstvorgesetzten steht kein Ermessen zu, ob er tätig wird, nur wie er das Verfahren führt."},{"id":48,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Was versteht man unter einem „Dienstvergehen\"?","opts":["Jegliches Verhalten außerhalb der Dienstzeit","Eine schuldhafte Verletzung dienstlicher Pflichten","Jede Form von Kritik an Vorgesetzten","Ein Verwaltungsverstoß nach dem Ordnungsrecht"],"correct":1,"exp":"So die Definition in § 47 BeamtStG."},{"id":49,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Was gehört nicht zu den Dienstpflichten?","opts":["Pflicht zur wöchentlichen Fortbildung","Neutralitätsgebot","Folgepflicht","Verschwiegenheitspflicht"],"correct":0,"exp":"Neutralitätsgebot, Folgepflicht und Verschwiegenheitspflicht sind ausdrücklich normiert (§§ 33, 35, 37 BeamtStG). Eine eigenständige, gesetzlich fixierte Pflicht zur wöchentlichen Fortbildung gibt es dagegen nicht."},{"id":50,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Eine Trunkenheitsfahrt in der Freizeit führt zu einem Disziplinarverfahren.","opts":["Richtig","Falsch"],"correct":1,"exp":"Rein außerdienstliches Verhalten ist nur dann relevant, wenn es in besonderem Maß geeignet ist, Achtung und Vertrauen in einer für das Amt bedeutsamen Weise zu beeinträchtigen (§ 34 S. 3 BeamtStG)."},{"id":51,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Das statusrechtliche Amt bezieht sich auf die tatsächlich wahrgenommenen Aufgaben.","opts":["Richtig","Falsch"],"correct":1,"exp":"Das statusrechtliche Amt meint die abstrakte Rechtsstellung (Laufbahn, Besoldungsgruppe, Amtsbezeichnung), nicht die konkret ausgeübte Tätigkeit – das wäre das Amt im konkret-funktionellen Sinn."},{"id":52,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Für eine Ernennung zum 10.01.2025 kann die Urkunde bis zum Ende des Monats überreicht werden.","opts":["Richtig","Falsch"],"correct":1,"exp":"Eine Ernennung auf einen zurückliegenden Zeitpunkt ist unzulässig und unwirksam (§ 8 IV BeamtStG). Wirksam wird sie erst mit tatsächlicher Aushändigung der Urkunde."},{"id":53,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Der Dienstherr muss bei Vorliegen tatsächlicher Anhaltspunkte über ein Dienstvergehen ein Disziplinarverfahren einleiten.","opts":["Richtig","Falsch"],"correct":0,"exp":"Legalitätsprinzip, kein Einleitungsermessen."},{"id":54,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Leistung und Persönlichkeitsbild des Beamten oder der Beamtin sind alleiniger Grund für die Bemessung der Disziplinarmaßnahme.","opts":["Richtig","Falsch"],"correct":1,"exp":"Ausgangspunkt ist die Schwere des Dienstvergehens; Persönlichkeitsbild und bisherige Führung fließen nur ergänzend ein."},{"id":55,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Die dienstliche Beurteilung ist das Hauptauswahlkriterium bei der Beförderung.","opts":["Richtig","Falsch"],"correct":0,"exp":"Im Rahmen der Bestenauslese nach Art. 33 II GG ist sie regelmäßig das zentrale Erkenntnismittel für Eignung, Befähigung und fachliche Leistung."},{"id":56,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Maßgebliche Kriterien bei einer Ernennung von Beamten sind Eignung, Leistung, Befähigung und der Wohnsitz im Gebiet des jeweiligen Dienstherrn.","opts":["Richtig","Falsch"],"correct":1,"exp":"Art. 33 II GG nennt Eignung, Befähigung und fachliche Leistung; ein Wohnsitzerfordernis gehört nicht dazu."},{"id":57,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Bei Bekanntwerden eines Dienstvergehens steht dem Dienstvorgesetzten Ermessen zu, ob ein Disziplinarverfahren eingeleitet wird oder nicht.","opts":["Richtig","Falsch"],"correct":1,"exp":"Legalitätsprinzip – kein Einleitungsermessen."},{"id":58,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Das Disziplinarrecht ist abschließend durch das Bundesdisziplinargesetz geregelt.","opts":["Richtig","Falsch"],"correct":1,"exp":"Das Bundesdisziplinargesetz gilt nur für Bundesbeamte; für Landes- und Kommunalbeamte gilt das jeweilige Landesdisziplinargesetz."},{"id":59,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Die Entfernung aus dem Beamtenverhältnis aufgrund von Verfehlungen muss im Rahmen einer Disziplinarklage vor dem Verwaltungsgericht erwirkt werden.","opts":["Richtig","Falsch"],"correct":0,"exp":"Diese schwerste Disziplinarmaßnahme kann die Behörde nicht selbst verfügen, sondern nur gerichtlich durchsetzen."},{"id":60,"cat":"Beamten- und Disziplinarrecht","type":"essay","q":"Was ist nach einer strafrechtlichen Verurteilung disziplinarisch nicht zulässig? (Die Antwortoptionen fehlen im Original-Protokoll.)","ref":"Einschlägig ist die Bindungswirkung strafgerichtlicher Feststellungen: Die Disziplinarbehörde bzw. das Disziplinargericht ist an die tatsächlichen Feststellungen eines rechtskräftigen Strafurteils grundsätzlich gebunden und darf davon nur unter engen Voraussetzungen abweichen (z. B. bei offenkundiger Unrichtigkeit).\nNicht zulässig ist es daher in aller Regel, eigene, den strafgerichtlichen Feststellungen widersprechende Tatsachenfeststellungen zu treffen."},{"id":61,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Gegen welche drei „Personengruppen\" können sich Maßnahmen der Gefahrenabwehr richten?","ref":"1. Verhaltensstörer (Handlungsstörer): verursacht die Gefahr durch eigenes Verhalten.\n2. Zustandsstörer: hat die tatsächliche Gewalt über eine gefahrverursachende Sache oder ist deren Eigentümer.\n3. Nichtstörer (Notstandspflichtiger): nicht verantwortliche Dritte – nur unter engen Voraussetzungen bei gegenwärtiger erheblicher Gefahr zulässig."},{"id":62,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Erklären Sie den Unterschied zwischen einer konkreten Gefahr und einer Anscheinsgefahr. Was ist bei der Anscheinsgefahr besonders zu beachten?","ref":"Konkrete Gefahr: Bei ungehindertem Ablauf des objektiv zu erwartenden Geschehens ist mit hinreichender Wahrscheinlichkeit in absehbarer Zeit ein Schaden zu erwarten.\nAnscheinsgefahr: Nachträglich stellt sich heraus, dass keine Gefahr bestand – maßgeblich ist die Sicht im Zeitpunkt des Handelns (ex-ante-Betrachtung). Durfte eine besonnene Einsatzkraft von einer Gefahr ausgehen, war das Einschreiten rechtmäßig. Sobald der Irrtum erkannt wird, sind alle Maßnahmen unverzüglich einzustellen.\nBesonders zu beachten: Die Kostenfrage – wer trägt die Kosten einer sich als unbegründet herausstellenden Maßnahme?"},{"id":63,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Welche Aufgabe ergibt sich aus § 1 Abs. 1 Nr. 1 BHKG?","ref":"§ 1 Abs. 1 Nr. 1 BHKG definiert das Ziel des Gesetzes im Bereich Brandschutz: vorbeugende und abwehrende Maßnahmen bei Brandgefahren zum Schutz der Bevölkerung. Die Norm begründet die gesetzliche Grundlage für den vorbeugenden und abwehrenden Brandschutz als Pflichtaufgabe der Gemeinden."},{"id":64,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"mc","q":"Was ist ein Unglücksfall im Sinne des BHKG?","opts":["Langsamer Vorgang","Plötzliches Ereignis mit erheblicher Gefahr","Nur Explosionen","Nur Brände"],"correct":1,"exp":"Ein Unglücksfall ist ein plötzliches Ereignis, von dem eine erhebliche Gefahr für Menschen, Tiere, Sachen oder die Umwelt ausgeht."},{"id":65,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Fall: Schornsteinbrand im Hinterhaus. Alarmierung zu einem Schornsteinbrand in einem Altbau, 3 OG. Der Einsatzleiter ordnet an, alle am Schornstein gelegenen Wohnungen auf Brandausbreitung zu kontrollieren. Im 3. OG lässt ein pensionierter Feuerwehrmann weder die Nachbarwohnung noch seine eigene Wohnung kontrollieren.\n\na) Dürfen Sie als Einsatzleiter die verschlossene Nachbarwohnung gewaltsam öffnen? Was ist zu beachten?\nb) Dürfen Sie die Wohnung gegen den Willen des Mieters betreten?\nc) Was beachten Sie beim Verlassen der Einsatzstelle?","ref":"a) Ja, gestützt auf § 41 BHKG NRW i. V. m. Art. 13 VII GG. Bei möglicher Rauch-/Brandausbreitung liegt zumindest eine Anscheinsgefahr vor. Zu beachten: Verhältnismäßigkeit – wenn zeitlich möglich, zunächst Schlüsseldienst; bei Gefahr im Verzug sofortiges gewaltsames Öffnen zulässig.\nb) Ja. Der widersprechende Mieter ist nicht Inhaber der zu kontrollierenden Nachbarwohnung und kann über deren Betretung nicht wirksam entscheiden. Sein Widerspruch ist rechtlich unbeachtlich.\nc) Geöffnete Wohnung sichern/wiederverschließen; Bewohner und Eigentümer informieren; Vorgang und Gründe dokumentieren; sicherstellen, dass keine Glutnester zurückbleiben."},{"id":66,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Fall: Rauchmelder piept im 2. OG, Nachbarn alarmieren die Feuerwehr. Die Feuerwehr bricht die Tür auf – in der Wohnung kein Rauch, Melder hatte technischen Defekt. Der Mieter fordert Ersatz für die Tür. War die Türöffnung rechtmäßig?","ref":"Ja. Maßgeblich ist die Anscheinsgefahr: Beim Alarm eines Rauchmelders, auf den niemand reagiert, durfte die Feuerwehr ex-ante von einer konkreten Gefahr ausgehen (§ 41 BHKG NRW i. V. m. Art. 13 VII GG). Der nachträglich festgestellte technische Defekt ändert an der Rechtmäßigkeit nichts.\nEin Schadensersatzanspruch scheidet bei rechtmäßiger Maßnahme in der Regel aus; ein etwaiger Ausgleich richtet sich nach den landesrechtlichen Kostenerstattungsregelungen."},{"id":67,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"essay","q":"Fall: Es brennt im Keller eines Mehrfamilienhauses. Ein Trupp soll wegen der Rauchausbreitung die angrenzenden Kellerräume kontrollieren. Der Eigentümer verbietet den Zutritt zu einem vermieteten Kellerraum, weil der Mieter das Betreten nicht erlauben würde. Dürfen Sie den Kellerraum öffnen?","ref":"Ja. Bei einem Kellerbrand mit Rauchausbreitungsgefahr besteht eine konkrete Gefahr, die die Kontrolle aller betroffenen Kellerräume rechtfertigt, unabhängig davon, ob sie vermietet sind. Weder Eigentümer noch Mieter können der Gefahrenabwehr ein wirksames Zutrittsverbot entgegensetzen (§ 41 BHKG NRW).\nVorgehen: Raum verhältnismäßig, notfalls gewaltsam öffnen, kontrollieren, anschließend sichern und Eigentümer sowie Mieter informieren."},{"id":68,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was regelt das Entschließungsermessen einer Behörde?","opts":["Das „Ob\" des behördlichen Handelns – ob die Behörde tätig wird","Das „Wie\" – die Art und Weise der Maßnahme","Die Auswahl zwischen mehreren Adressaten","Den Zeitpunkt des behördlichen Eingreifens"],"correct":0,"exp":"Das Entschließungsermessen (§ 40 VwVfG) betrifft das „Ob\" – ob die Behörde bei Vorliegen aller Voraussetzungen tätig wird oder untätig bleibt. Das „Wie\" regelt das Auswahlermessen."},{"id":69,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was regelt das Auswahlermessen einer Behörde?","opts":["Das „Ob\" des behördlichen Handelns","Das „Wie\" – die Auswahl der passenden Maßnahme oder Person","Die Zuständigkeit der Behörde","Ob überhaupt ein Verwaltungsakt erlassen werden darf"],"correct":1,"exp":"Das Auswahlermessen (§ 40 VwVfG) betrifft das „Wie\" – bei mehreren erlaubten Maßnahmen oder Adressaten wählt die Behörde die passende Reaktion aus."},{"id":70,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Was versteht man unter einer Ermessensreduzierung auf Null?","opts":["Die Behörde hat kein Ermessen und muss untätig bleiben","Aufgrund besonderer Umstände ist nur noch eine einzige rechtmäßige Entscheidung möglich","Die Behörde kann frei zwischen allen Maßnahmen wählen","Das Ermessen wird auf eine übergeordnete Behörde übertragen"],"correct":1,"exp":"Bei der Ermessensreduzierung auf Null schrumpft der gesetzliche Spielraum der Behörde so stark, dass nur noch eine rechtmäßige Entscheidung verbleibt. Jede andere Handlung wäre rechtswidrig (gebundene Entscheidung)."},{"id":71,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"tf","q":"Bei einer Anscheinsgefahr muss die Feuerwehr ihre Maßnahmen sofort einstellen, sobald sich herausstellt, dass keine konkrete Gefahr vorliegt.","opts":["Richtig","Falsch"],"correct":0,"exp":"Richtig. Ergibt die Erkundung, dass keine konkrete Gefahr besteht, handelt es sich um eine Anscheinsgefahr – alle Maßnahmen sind unverzüglich einzustellen."},{"id":72,"cat":"Gefahrenabwehr / Feuerwehrrecht","type":"mc","q":"Wann liegt eine konkrete Gefahr vor?","opts":["Wenn Anhaltspunkte für eine mögliche Gefahr bestehen","Wenn bei ungehindertem Ablauf in absehbarer Zeit mit hinreichender Wahrscheinlichkeit ein Schaden droht","Wenn bereits ein Schaden eingetreten ist","Wenn ein Bürger eine Gefahr gemeldet hat"],"correct":1,"exp":"Eine konkrete Gefahr liegt vor, wenn bei ungehindertem Ablauf des objektiv zu erwartenden Geschehens mit hinreichender Wahrscheinlichkeit in absehbarer Zeit ein Schaden zu erwarten ist."},{"id":73,"cat":"Allgemeines Verwaltungsrecht","type":"mc","q":"Welche Anforderung stellt § 37 VwVfG an den Tenor (Verfügungssatz) eines Verwaltungsaktes?","opts":["Er muss schriftlich und handschriftlich unterschrieben sein","Er muss hinreichend bestimmt sein","Er muss stets eine Rechtsmittelbelehrung enthalten","Er darf keine Bedingungen oder Auflagen enthalten"],"correct":1,"exp":"§ 37 VwVfG verlangt, dass der Tenor eines VA hinreichend bestimmt ist – er muss klar und vollziehbar beschreiben, was die Behörde vom Bürger verlangt."},{"id":74,"cat":"Allgemeines Verwaltungsrecht","type":"tf","q":"Die Begründung eines Verwaltungsaktes darf allgemeine Floskeln enthalten, wenn der Tenor eindeutig ist (§ 39 VwVfG).","opts":["Richtig","Falsch"],"correct":1,"exp":"Falsch. § 39 VwVfG verlangt eine konkrete Begründung: Sie muss an bestimmte Anhaltspunkte geknüpft sein, darf nicht floskelhaft sein und muss die tragenden rechtlichen Gründe aufführen."},{"id":75,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Welche Zwangsmittel nennt § 9 Abs. 1 VwVG zur Durchsetzung eines Verwaltungsaktes?","opts":["Bußgeld, Strafanzeige, Zwangshaft","Zwangsgeld, Ersatzvornahme, unmittelbarer Zwang","Ordnungsgeld, Einspruch, Vollziehung","Bußgeld, Ersatzvornahme, Freiheitsstrafe"],"correct":1,"exp":"§ 9 Abs. 1 VwVG nennt abschließend drei Zwangsmittel: Zwangsgeld, Ersatzvornahme und unmittelbarer Zwang."},{"id":76,"cat":"Verwaltungsvollstreckung / Rechtsschutz","type":"mc","q":"Wie kann ein VA trotz eingelegten Widerspruchs vollzogen werden?","opts":["Gar nicht – der Widerspruch hat immer unüberwindliche aufschiebende Wirkung","Durch Anordnung des sofortigen Vollzugs mit schriftlicher Begründung nach § 80 Abs. 2 Nr. 4 VwGO","Durch eine einfache mündliche Anweisung des Vorgesetzten","Durch Verwirkung des Widerspruchsrechts nach drei Tagen"],"correct":1,"exp":"§ 80 Abs. 2 Nr. 4 VwGO ermöglicht die Anordnung des sofortigen Vollzugs. Sie muss schriftlich erfolgen und besonders begründet werden, damit die aufschiebende Wirkung des Widerspruchs entfällt."},{"id":77,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Arten der Gesetzgebungskompetenz unterscheidet das Grundgesetz?","opts":["Primäre und sekundäre Gesetzgebung","Ausschließliche Bundeskompetenz (§ 71 GG), konkurrierende Gesetzgebung (§ 72 GG) und Länderzuständigkeit (§ 70 GG)","Föderale und zentralistische Gesetzgebung","Formelle und materielle Gesetzgebung"],"correct":1,"exp":"Das GG unterscheidet: ausschließliche Gesetzgebungskompetenz des Bundes (§ 71 GG), konkurrierende Gesetzgebung (§ 72 GG) und den Bereich, in dem die Länder die Gesetzgebungszuständigkeit haben (§ 70 GG, Auffangzuständigkeit)."},{"id":78,"cat":"Beamten- und Disziplinarrecht","type":"tf","q":"Eine Ernennung mit rückwirkendem Datum ist nach § 8 BeamtStG zulässig.","opts":["Richtig","Falsch"],"correct":1,"exp":"Falsch. § 8 Abs. 4 BeamtStG verbietet Ernennungen mit rückwirkender Kraft ausdrücklich. Die Ernennung wird nach § 8 Abs. 2 BeamtStG erst mit Aushändigung der Ernennungsurkunde wirksam."},{"id":79,"cat":"Beamten- und Disziplinarrecht","type":"mc","q":"Ein Beamter trägt bei einer privaten politischen Veranstaltung seine Dienstuniform ohne vorherige Abstimmung. Welche Rechtsgrundlagen sind für die Prüfung eines Dienstvergehens einschlägig?","opts":["§ 33 Abs. 2 BeamtStG (Mäßigungsgebot) i.V.m. § 47 Abs. 1 BeamtStG (Dienstvergehen)","§ 12 BeamtStG (Eidesleistung)","§ 60 BeamtStG (Streikverbot)","§ 42 BeamtStG (Nebentätigkeit)"],"correct":0,"exp":"§ 33 Abs. 2 BeamtStG verpflichtet Beamte zur Mäßigung und Zurückhaltung – das Tragen der Dienstuniform bei politischen Veranstaltungen verletzt diese Pflicht. § 47 Abs. 1 BeamtStG definiert die schuldhafte Verletzung von Dienstpflichten als Dienstvergehen."},{"id":80,"cat":"Staatsorganisationsrecht","type":"mc","q":"Wer hat nach Art. 76 Abs. 1 GG das Recht der Gesetzesinitiative?","opts":["Bundestag, Bundesrat und Bundesregierung","Nur Bundestag und Bundesrat","Bundestag, Bundesrat, Bundesregierung und Bundespräsident","Bundestag und Bundesverfassungsgericht"],"correct":0,"exp":"Das Initiativrecht steht nach Art. 76 I GG dem Bundestag (aus seiner Mitte), dem Bundesrat und der Bundesregierung zu. Der Bundespräsident und das BVerfG haben kein Initiativrecht."},{"id":81,"cat":"Staatsorganisationsrecht","type":"tf","q":"Das Bundesverfassungsgericht ist am regulären Gesetzgebungsverfahren des Bundes beteiligt.","opts":["Richtig","Falsch"],"correct":1,"exp":"Das BVerfG ist am regulären Verfahren nicht beteiligt. Es prüft Bundesgesetze erst nachträglich auf Antrag – z. B. im Wege der abstrakten oder konkreten Normenkontrolle."},{"id":82,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welches Organ fasst den Gesetzesbeschluss (Art. 77 Abs. 1 GG) allein?","opts":["Bundestag und Bundesrat gemeinsam","Nur der Bundestag","Nur der Bundesrat","Bundestag und Bundesregierung gemeinsam"],"correct":1,"exp":"Nach Art. 77 I GG beschließt allein der Bundestag die Bundesgesetze. Der Bundesrat ist in dieser Phase nicht beteiligt – er kommt erst im 2. Durchgang (Art. 77 II ff. GG)."},{"id":83,"cat":"Staatsorganisationsrecht","type":"mc","q":"Welche Möglichkeiten hat der Bundesrat im zweiten Durchgang (Art. 77 Abs. 2 ff. GG)?","opts":["Er kann das Gesetz endgültig und unüberwindlich ablehnen","Er kann zustimmen, Einspruch einlegen oder den Vermittlungsausschuss anrufen","Er hat in dieser Phase keine Mitwirkungsrechte","Er leitet das Gesetz zur Prüfung an das BVerfG weiter"],"correct":1,"exp":"Im 2. Durchgang kann der Bundesrat zustimmen, Einspruch einlegen oder den Vermittlungsausschuss anrufen (Art. 77 II ff. GG). Ein absolutes Veto hat er nur bei Zustimmungsgesetzen; bei Einspruchsgesetzen kann der Bundestag den Einspruch überstimmen."},{"id":84,"cat":"Staatsorganisationsrecht","type":"mc","q":"Wer fertigt ein Bundesgesetz nach Art. 82 Abs. 1 GG aus und verkündet es?","opts":["Der Bundestag","Der Bundesrat","Der Bundespräsident – mit Gegenzeichnung durch die Bundesregierung (Art. 58 GG)","Das Bundesverfassungsgericht"],"correct":2,"exp":"Nach Art. 82 I GG fertigt der Bundespräsident die Bundesgesetze aus und verkündet sie im Bundesgesetzblatt. Die Gegenzeichnung nach Art. 58 GG durch den zuständigen Bundesminister ist Voraussetzung für die Wirksamkeit."}]});
const IDFQ=makeQuiz({G:'IDFQ',view:'v-idf-altklausur',sfx:'-idf',minutes:45,html:true,examCount:25,
  keys:{bm:'bvi_idfq_bm',mastery:'bvi_idfq_mastery',srs:'bvi_idfq_srs',stats:'bvi_idfq_stats'},
  catLabels:{'Vorbeugender Brandschutz':'Vorb. Brandschutz','Stabsarbeit':'Stabsarbeit'},
  Q:typeof IDF_QUIZ_Q!=='undefined'?IDF_QUIZ_Q:[]});

/* ══════════════════════════════════════════════════════════════
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═
   KF_QUIZ – Klausurfragen Übersicht (14 Fragen, 90 Min)
═ */
const KF_QUIZ = (function(){
  const KEY = 'bvi_kf_scores';
  let _step=0, _revealed=false, _shortRevealed=false;
  let _scores={};

  const QUESTIONS = [
    {id:13,nr:'Frage 1',punkte:5,cat:'Haushalt',
     text:'Auf welche Besonderheiten und Konsequenzen des Haushaltswesens muss sich jede Führungskraft der Feuerwehr einstellen?',
     answer:'<strong>1. Der lange Weg zum Haushalt</strong><br>Bedarfsanmeldungen → Parlamentsberatung → Genehmigung der Aufsichtsbehörde → Veröffentlichung. Gesamtdauer: bis zu <strong>18 Monate</strong>.<br><br><strong>2. Konsequenzen</strong><br>→ Zwingend <strong>langfristige, strategische Planung</strong> (Investitionsprogramm, mehrjährige Vorausschau).<br>→ Haushalt gilt nur für <strong>ein Jahr</strong> — Änderungen nur durch das Parlament; keine Eigenentscheidung der Feuerwehr.<br>→ Bedarfsanmeldungen müssen <strong>rechtzeitig und fachlich begründet</strong> eingereicht werden.<br><br><strong>3. Feuerwehrspezifische Konflikte</strong><br>→ Gebot des <strong>schnellen Handelns</strong> steht im Widerspruch zum langsamen Verwaltungsdenken.<br>→ Sicherstellungsauftrag erfordert <strong>Flexibilität im Haushaltsvollzug</strong>.<br>→ Beschaffungen verlangen <strong>strategischen Weitblick</strong> (Nutzungsdauer, Ersatzteilversorgung, technische Reserve).<br><br><strong>4. Vergaberecht</strong><br>→ <strong>Keine Vergabe ohne bereitstehende Haushaltsmittel</strong> — Verstöße begründen Rechtsrisiken.<br>→ Gegenmittel: Rahmenverträge, technische Reserve, langfristige Planung.<br><br><strong>5. Steuerungsauftrag</strong><br>→ Führungskraft gibt der Politik <strong>Handlungsfelder und Strukturen vor</strong>.<br>→ Steuerung auf zwei Ebenen: strategisch (Haushalt) und operativ (KLR, Controlling).',
     short:'<strong>5 Besonderheiten &amp; Konsequenzen:</strong><br>① <strong>Langer Weg</strong> – Anmeldung → Parlament → Aufsichtsbehörde = bis <strong>18 Monate</strong> → langfristige Planung zwingend.<br>② <strong>Konsequenzen</strong> – Haushalt gilt <strong>1 Jahr</strong>; Änderung nur durch Parlament; rechtzeitige, begründete Bedarfsanmeldung.<br>③ <strong>FW-Konflikte</strong> – schnelles Handeln vs. Verwaltungsdenken; Sicherstellungsauftrag erfordert Flexibilität.<br>④ <strong>Vergaberecht</strong> – keine Vergabe ohne Haushaltsmittel → Rahmenverträge, techn. Reserve, Vorausplanung.<br>⑤ <strong>Steuerungsauftrag</strong> – FW gibt Politik Strukturen vor; strategisch (Haushalt) + operativ (KLR).'},
    {id:1,nr:'Frage 2',punkte:5,cat:'Haushalt',
     text:'Welche Ausgaben dürfen geleistet werden, solange der Haushalt noch nicht rechtskräftig ist? Wo liegen die Grenzen? (Thema: vorläufige Haushaltsführung)',
     answer:'Die <strong>vorläufige Haushaltführung</strong> gilt, solange kein rechtskräftiger Haushalt beschlossen ist.<br><br><strong>Zulässig für die Feuerwehr (F 24):</strong><br>① Ausgaben, zu denen die FW <strong>rechtlich verpflichtet</strong> ist: Löhne, Verträge, Brandschutz/Rettungsdienst im Rahmen der Bedarfspläne.<br>② Ausgaben zur <strong>Aufrechterhaltung des Dienstbetriebes</strong>: Kraftstoff, Büromaterial, laufender Unterhalt.<br><br><strong>Zulässig allgemein (F 25):</strong><br>③ Ausgaben zur <strong>Vermeidung von Folgeschäden</strong> oder höheren Folgekosten.<br>④ <strong>Fortführung begonnener Investitionen.</strong><br>⑤ Einnahmen in beliebiger Höhe erzielen.<br>→ Fazit: Faktisch <strong>keine Einschränkungen für den laufenden Dienstbetrieb.</strong><br><br><strong>Nicht zulässig (F 26):</strong><br>① Ausgaben außerhalb der oben genannten Kategorien.<br>② <strong>Beginn neuer, im Umfang erheblicher Investitionsmaßnahmen.</strong><br>③ <strong>Besetzung neuer Stellen</strong> aus noch nicht rechtskräftigem Stellenplan.',
     short:'<strong>Vorläufige Haushaltsführung</strong> = kein rechtskräftiger Haushalt.<br><br><strong>✓ Zulässig:</strong> Pflichtausgaben (Löhne, Verträge), laufender Betrieb (Kraftstoff, Material), Schadensabwehr, begonnene Investitionen, Einnahmen unbegrenzt.<br><br><strong>✗ Nicht zulässig:</strong> Neue erhebliche Investitionen; neue Stellen besetzen.<br>→ Laufender FW-Betrieb faktisch <strong>unbeschränkt.</strong>'},
    {id:2,nr:'Frage 3',punkte:5,cat:'BSC / QM',
     text:'A) Nennen Sie aus zwei typischen Bereichen der Feuerwehr jeweils wesentliche Produkte.\nB) Nennen Sie die an diesen Produkten beteiligten Kunden/Stakeholder.\nC) Nennen Sie mindestens eine Qualität aus Sicht eines beteiligten Stakeholders.\nD) Nennen Sie Indikatoren, anhand derer eine Qualitätsveränderung nachgewiesen werden kann.',
     answer:'<strong>Vorgehensweise (F 98):</strong> Produkte → Beteiligte → Qualität aus Sicht eines Beteiligten → messbarer Indikator.<br><em style="font-size:.85rem;opacity:.75">Für die Klausur genügen zwei Bereiche.</em><br><br><strong>Bereich 1 – Abwehrender Brandschutz (F 105)</strong><br>Produkte: Brandbekämpfung, TH. | Beteiligte: Bürger → <strong>Hilfsfristerreichungsgrad</strong>, Eintreffzeit; Politik → <strong>Kosten je Risikokategorie</strong>.<br><br><strong>Bereich 2 – Leitstelle (F 109)</strong><br>Produkte: Annahme &amp; Disposition von Notrufen. | Beteiligte: Bürger → <strong>Quote angenommener Notrufe</strong>; Kostenträger → <strong>Rettungsdienstgebühr</strong>.<br><br><strong>Bereich 3 – Ausbildung (F 102)</strong><br>Produkte: Grundausbildung, Spezialausbildung (Atemschutz, FzF). | Beteiligte: Mitarbeiter → <strong>Ausbildungsquote je Stufe</strong>; BGU → <strong>Anteil vorschriftsmäßig qualifizierter EK</strong>.<br><br><strong>Bereich 4 – Rettungsdienst (F 106)</strong><br>Produkte: Notfallrettung, Krankentransport. | Beteiligte: Patienten → <strong>Hilfsfristerreichungsgrad RD</strong>; Kostenträger → <strong>Kosten je Einsatz</strong>.<br><br><strong>Bereich 5 – Vorbeugender Brandschutz (F 104)</strong><br>Produkte: Brandschutzprüfungen, Beratungen. | Beteiligte: Bauherren → <strong>Bearbeitungszeit je Antrag</strong>; Genehmigungsbehörde → <strong>Mängelquote Folgeprüfungen</strong>.',
     short:'Struktur: <strong>Bereich → Produkte → Beteiligte → Kennzahl</strong> (mind. 2 Bereiche)<br><br><strong>Abwehrender Brandschutz:</strong> Brandbekämpfung, TH. Bürger → <em>Hilfsfristerreichungsgrad;</em> Politik → <em>Kosten je Risikokategorie.</em><br><strong>Leitstelle:</strong> Notrufannahme &amp; Disposition. Bürger → <em>Quote angenommener Notrufe;</em> Kostenträger → <em>RD-Gebühr.</em><br><strong>Ausbildung:</strong> Grund-/Spezialausbildung. Mitarbeiter → <em>Ausbildungsquote;</em> BGU → <em>qual. EK-Anteil.</em><br><strong>Rettungsdienst:</strong> Notfallrettung, KTW. Patient → <em>Hilfsfristerreichungsgrad RD;</em> Kostenträger → <em>Kosten je Einsatz.</em>'},
    {id:3,nr:'Frage 4',punkte:5,cat:'BSC / QM',
     text:'Stellen Sie die Betrachtung aus den verschiedenen Blickwinkeln (Perspektiven) des Balanced-Scorecard-Ansatzes dar.',
     answer:'<strong>Die 4 BSC-Perspektiven (Kaplan/Norton):</strong><br>① <strong>Finanzperspektive:</strong> Blick des Trägers/Haushalts. FW: Budgettreue, Kosten je Einsatz, Investitionsquote.<br>② <strong>Kundenperspektive:</strong> Blick der Bevölkerung/Politik. FW: Hilfsfristerfüllungsquote, Sicherheitsgefühl.<br>③ <strong>Interne Prozessperspektive:</strong> Kernprozesse. FW: Ausrückzeit, Fahrzeugverfügbarkeit, Ausbildungsstand.<br>④ <strong>Lern- und Entwicklungsperspektive:</strong> Zukunftsfähigkeit. FW: Fortbildungsquote, Personalentwicklung, Digitalisierung.<br><br><strong>Blickwinkel im FW-Kontext (F 93):</strong><br>① <strong>Sicht des Kunden / der Bevölkerung</strong> – Schnelle Hilfe, kompetente Notfallversorgung.<br>② <strong>Sicht der Geschäftsführung / Magistrat / SVV</strong> – Wirtschaftlichkeit, Budgettreue, politische Ziele.<br>③ <strong>Sicht der eigenen Organisation</strong> – Arbeitssicherheit, Entwicklung, angemessene Ressourcen.<br><br><strong>Warum mehrperspektivisch? (F 46)</strong><br>→ Dieselbe Leistung hat je Beteiligtem andere Qualitätsansprüche und andere Indikatoren.<br>→ Steuerung auf zwei Ebenen: stadtgesamt (politisch/strategisch) und Ausrückbereich/Dienstgruppe (taktisch/operativ).',
     short:'<strong>4 BSC-Perspektiven:</strong><br>① Finanzen (Budgettreue, Kosten/Einsatz)<br>② Kunden (Hilfsfristerfüllungsquote, Sicherheitsgefühl)<br>③ Interne Prozesse (Ausrückzeit, Verfügbarkeit, Ausbildung)<br>④ Lernen/Entwicklung (Fortbildungsquote, Digitalisierung)<br><br><strong>FW-Blickwinkel (F93):</strong> Kunden/Bevölkerung · Geschäftsführung/Politik · eigene Organisation.<br><strong>Warum?</strong> Gleiche Leistung = unterschiedliche Indikatoren je Beteiligtem; Steuerung politisch + operativ.'},
    {id:4,nr:'Frage 5',punkte:5,cat:'Bedarfsplanung',
     text:'Welche Informationen und Kennzahlen sind für die strategische Personalplanung und die daraus resultierenden Entscheidungen erforderlich?',
     answer:'<strong>Grundbegriffe (F 111, 114)</strong><br><em>Funktion</em> = Aufgabe, gesichert für 365/24 h; 1 HLF = 6 Funktionen. Jahresbesetztzeit = <strong>8.760 h</strong>. Stellen erbringen keine Arbeitsleistung – nur physisch Anwesende (F 111).<br><br><strong>Die drei zentralen Kennzahlen (F 115–118)</strong><br>① <strong>Ist-Personalfaktor:</strong> 8.760 h ÷ Netto-JAZ je MA (JAZ minus alle Ausfälle).<br>② <strong>Ist-Stellenfaktor:</strong> Planstellen (Art 01) ÷ zu besetzende Funktionen.<br>③ <strong>Soll-Stellenfaktor:</strong> politisch beschlossen; 100 % Besetzung unterstellt, fester Besetzungsgrad (∼95 %, F 128).<br><br><strong>Zu erhebende Ausfallgründe (F 123)</strong><br>Krankheit · Urlaub · Aus-/Fortbildung · Verwendung außerhalb Einsatzdienst · Mutterschutz/Elternzeit · Sonstiges.<br><br><strong>Weitere Einflussgrößen</strong><br>→ <strong>Mehrarbeit (F 124/125):</strong> Aufbau erhöht, Abbau verringert den Faktor. Nicht abbaubar = Organisationsverschulden (F 120).<br>→ <strong>Transferleistungen (F 126):</strong> Integrationsdienst, Wachpraktikanten – verringern den Faktor.<br>→ <strong>Funktionsunterschreitungsstunden (F 127):</strong> erhöhen den Faktor; keine Verrechnung mit Überschreitungen.<br><br><strong>Strategische Nutzung (F 136, 137)</strong><br>Zeitreihenvergleiche · Risikoerkennung · Argumente für Stellenplanverfahren · Erhebung mind. 1× jährlich.',
     short:'<strong>3 Kennzahlen (F115–118):</strong><br>① <strong>Ist-Personalfaktor:</strong> 8.760 h ÷ Netto-JAZ (= JAZ minus alle Ausfälle)<br>② <strong>Ist-Stellenfaktor:</strong> Planstellen ÷ zu besetzende Funktionen<br>③ <strong>Soll-Stellenfaktor:</strong> politisch beschlossen; Besetzungsgrad ~95 %<br><br><strong>Ausfallgründe (F123):</strong> Krankheit · Urlaub · Aus-/Fortbildung · außerhalb Einsatzdienst · MuSch/Elternzeit · Sonstiges.<br><br><strong>Einflussgrößen:</strong> Mehrarbeit-Aufbau erhöht, -Abbau verringert Faktor; Transferleistungen verringern; Funktionsunterschreitungsstunden erhöhen (keine Verrechnung).<br><strong>Nutzung:</strong> Zeitreihenvergleich · Stellenplanverfahren · mind. 1×/Jahr.'},
    {id:5,nr:'Frage 6',punkte:5,cat:'Vergabe',
     text:'Wie würden Sie bei der Beschaffung einer neuen Fahrzeuggeneration strategisch vorgehen, damit der Vergabevorschlag gleichzeitig rechtssicher und zielorientiert ist?\n\nBerücksichtigen Sie: (1) richtiger Zeitpunkt, (2) notwendige Voraussetzungen, (3) worauf besonders zu achten ist, (4) Vor- und Nachteile einer Tranche vs. mehrerer Tranchen, (5) Begründung von Nutzungsdauer und technischer Reserve.',
     answer:'<strong>1. Richtiger Zeitpunkt (F 17, 26, 28)</strong><br>Vergabe erst anstoßen, wenn <strong>Haushaltsmittel bereitstehen</strong>. In der vorläufigen Haushaltsführung: keine neuen erheblichen Investitionen. Zeit vorher nutzen: <strong>Vergabeunterlagen vorbereiten.</strong><br><br><strong>2. Notwendige Voraussetzungen (F 20, 90)</strong><br>→ Haushaltsmittel rechtskräftig bewilligt.<br>→ Maßnahme im <strong>Investitionsprogramm</strong> (5-Jahres-Darstellung mit Gesamtvolumen und Jahresabflüssen).<br>→ <strong>Wertungsmatrix</strong> mit Ausschreibung veröffentlicht; Preis mind. 40 %.<br>→ Fahrzeuge → <strong>Vermögenshaushalt</strong> (einzige Kreditfinanzierung möglich).<br><br><strong>3. Worauf besonders zu achten (F 28, 50, 51)</strong><br>→ <strong>EU-Schwellenwerte</strong> prüfen, Rechtsstreitrisiko einkalkulieren.<br>→ <strong>Rahmenverträge</strong> nutzen – mehrjährig, erleichtern Beschaffungen.<br>→ Feste <strong>Jahresraten</strong> ansparen, Restmittel-Übertragbarkeit sicherstellen.<br><br><strong>4. Eine Tranche vs. mehrere Tranchen (F 51)</strong><br><u>Eine Tranche:</u> einheitliche Ausbildung, gleiche Ersatzteile, Skaleneffekte, eine Ausschreibung. <u>Nachteil:</u> Systemfehler treffen <strong>alle Fahrzeuge</strong>.<br><u>Mehrere Tranchen:</u> Risiko gestreut – Nachteil: höhere Einzelkosten, getrennte Ausschreibungen.<br><br><strong>5. Nutzungsdauer und technische Reserve (F 7, 39, 41, 107)</strong><br>→ Nutzungsdauer nach <strong>AfA-Tabelle</strong> (Anlageverzeichnis: Anschaffungswert, Restwert, Nutzungsdauer).<br>→ Technische Reserve: <strong>ausreichend bemessen</strong>, Indikator: Fahrzeugverfügbarkeit.',
     short:'<strong>1. Zeitpunkt:</strong> Haushaltsmittel bereit → Vergabe starten. Vorher Unterlagen vorbereiten.<br><strong>2. Voraussetzungen:</strong> Mittel rechtskräftig; Investitionsprogramm; Wertungsmatrix (Preis ≥ 40 %) mit Ausschreibung; Fahrzeuge → Vermögenshaushalt.<br><strong>3. Achten auf:</strong> EU-Schwellen prüfen; Rahmenverträge; Jahresraten ansparen.<br><strong>4. Tranche(n):</strong><br>→ <em>Eine:</em> einheitl. Ausbildung + Ersatzteile, Skaleneffekte. ⚠ Systemfehler trifft alle.<br>→ <em>Mehrere:</em> Risiko gestreut. ⚠ Höhere Kosten, mehr Ausschreibungen.<br><strong>5. Nutzungsdauer:</strong> AfA-Tabelle; techn. Reserve = Fahrzeugverfügbarkeit sicherstellen.'},
    {id:6,nr:'Frage 7',punkte:5,cat:'Bedarfsplanung',
     text:'Zweigleisige Analyse des Ist-Zustandes im Rahmen einer Rettungsdienstbedarfsplanung. Welche zwei Ist-Analysen werden eingesetzt und was liefern sie?',
     answer:'<strong>1. Analyse der Hilfsfristerreichung</strong><br>Auswertung des tatsächlichen Erreichungsgrades im Analysezeitraum; SOLL-IST-Vergleich mit dem gesetzlichen Schutzziel (z.B. 95 % innerhalb 10 Min.). Die Auswertung erfolgt zweigleisig:<br>→ <strong>Hilfsfristerreichung insgesamt</strong> (alle Fahrzeuge, alle Einsätze).<br>→ <strong>Hilfsfristerreichung ab der zuständigen Wache</strong> (nur Einsätze der nächstgelegenen Wache).<br>Vergleich beider Auswertungen ermöglicht die Unterscheidung zweier Problemtypen:<br>• Gute Erreichung ab zuständiger Wache, schlechte Gesamterreichung → <strong>Ressourcenverfügbarkeitsproblem</strong> (zu wenig Fahrzeuge parallel verfügbar).<br>• Schlechte Erreichung auch ab zuständiger Wache → <strong>Standort-/Erreichbarkeitsproblem</strong>.<br><em>Ergebnis:</em> Räumliche Identifikation von Versorgungslücken und erste Eingrenzung der Ursachenart.<br><br><strong>2. Problemfeldanalyse</strong><br>Mehrstufige Analyse der <strong>Verursachungsbeiträge</strong> der Nicht-Erreichung der Hilfsfrist. Drei Faktoren werden quantifiziert:<br>① <strong>Standortstruktur und Verkehr</strong> – Nicht-Erreichungen durch ungünstige Wachlage und Verkehrsverhältnisse.<br>② <strong>Ausrückzeit</strong> – Nicht-Erreichungen durch zu lange Ausrückzeit.<br>③ <strong>Ressourcenverfügbarkeit</strong> – Nicht-Erreichungen, weil kein Fahrzeug der zuständigen Wache verfügbar war.<br>Wichtig: Organisatorische Optimierungen der Ausrückzeit sind in der Regel <strong>einfacher und schneller</strong> umsetzbar als Veränderungen der Standortstruktur oder Ausweitungen der Vorhaltung.<br><em>Ergebnis:</em> Priorisierte und zielgerichtete Maßnahmenableitung auf Basis quantifizierter Verursachungsbeiträge.',
     short:'<strong>① Analyse der Hilfsfristerreichung</strong><br><em>Ergebnis:</em> Räumliche Versorgungslücken + Ursachenart.<br><br><strong>② Problemfeldanalyse</strong><br><em>Ergebnis:</em> Zielgerichtete, priorisierte Maßnahmenableitung.'},
    {id:7,nr:'Frage 8',punkte:5,cat:'Bedarfsplanung',
     text:'Phasenmodell der Katastrophenschutzbedarfsplanung. Beschreiben Sie die wesentlichen Phasen.',
     answer:'<strong>Phasenmodell der KatS-Bedarfsplanung (5 Phasen, in Anlehnung an BBK-Leitfaden):</strong><br><br><strong>Phase 1 – Brainstorming</strong><br>Sammlung aller denkbaren Szenarien im Zuständigkeitsbereich. Leitfragen: Bestehen relevante Anschlagsziele? Welche KRITIS gibt es? Sind Hochwasser- oder Georisiken vorhanden? Kategorisierung in <em>anthropogene Katastrophen</em>, <em>Naturkatastrophen</em> und <em>konfliktbedingte Katastrophen</em>. Ziel: möglichst viele Risiken in Szenarien bündeln.<br><br><strong>Phase 2 – Szenarienauswahl</strong><br>Reduktion auf ca. <strong>5 relevante Szenarien</strong> mithilfe der Risikomatrix (Eintrittswahrscheinlichkeit × Schadensausmaß). Zusätzliche Determinante: <strong>Velocity of Risk (VoR)</strong> = Vorwarnzeit des Ereigniseintritts (z. B. ermöglicht Planung von WLF-Konzepten und Dual-Use-Lösungen). Bewertungsverfahren: Delphisches Verfahren mit Fachexperten (Abstimmungsrunden) oder Auswahl durch untere KatS-Behörde. Szenarien sollen die gesamte Breite der KatS-Fachdienste abdecken.<br><br><strong>Phase 3 – Szenarienfolgenbetrachtung</strong><br>Workshopbasierte Analyse der Folgen je Szenario. Fokus: eigene Betroffenheit und Leistungsfähigkeit; Schutzgüter (Menschenleben, Gesundheit, Umwelt, Wirtschaft). Einbindung privater und wirtschaftlicher Akteure (Offenbarung zusätzlicher Ressourcen). Am Ende jedes Szenarios: <strong>Ableitung der Fähigkeitsbedarfe</strong> des Katastrophenschutzes. Maximalbetrachtung gleichartiger Fähigkeiten über alle Szenarien hinweg.<br><br><strong>Phase 4 – Ableitung der Planungsziele</strong><br>Aggregierung der szenarienbezogenen Fähigkeitsbedarfe zu <strong>übergeordneten Planungszielen</strong> (z. B. „Betrieb eines Verwaltungsstabes"). Unterscheidung: <em>Querschnittsfunktionen</em> (I&amp;K, Führungsunterstützung) und <em>Fachdienstanforderungen</em> (ABC-Gefahrenabwehr, SEG Rettung etc.). Berücksichtigung begrenzter Haushaltsmittel: modulare, multifunktionale Einheiten; WLF-Konzepte; Dual-Use von Räumlichkeiten.<br><br><strong>Phase 5 – Maßnahmenableitung</strong><br>IST-Analyse für jedes Planungsziel im Zuständigkeitsbereich. SOLL-IST-Vergleich → bei Differenz sind Maßnahmen erforderlich. Ergebnis: <strong>priorisierte Maßnahmenliste</strong>. Berücksichtigung überörtlicher Konzepte (Katastrophe mit eigenen Mitteln allein nicht bewältigbar); aber: Katastrophe kann angrenzende Kommunen gleichermaßen betreffen und überörtliche Hilfe beeinträchtigen.',
     short:'<strong>5 Phasen KatS-Bedarfsplanung (in Anlehnung an BBK-Leitfaden):</strong><br>① <strong>Brainstorming</strong> – Alle denkbaren Szenarien sammeln (anthropogen · Natur · Konflikt).<br>② <strong>Szenarienauswahl</strong> – Reduktion auf ca. 5 Szenarien via Risikomatrix (EW × Schadensausmaß) + VoR; Delphisches Verfahren.<br>③ <strong>Szenarienfolgenbetrachtung</strong> – Workshopbasierte Folgenanalyse; Ableitung Fähigkeitsbedarfe je Szenario.<br>④ <strong>Ableitung der Planungsziele</strong> – Aggregierung zu übergeordneten Zielen; Querschnittsfunktionen + Fachdienste; modulare Planung.<br>⑤ <strong>Maßnahmenableitung</strong> – IST-SOLL-Vergleich je Planungsziel → priorisierte Maßnahmenliste.'},
    {id:8,nr:'Frage 9',punkte:5,cat:'Rechnungswesen',
     text:'Grenzen Sie die Begrifflichkeiten Kameralistik und Doppik voneinander ab und nennen Sie jeweils vier charakteristische Eigenschaften.',
     answer:'<strong>Kameralistik</strong> – traditionelles zahlungsorientiertes Buchungssystem:<br>① <strong>Kassensteuerung:</strong> Erfasst ausschließlich Einzahlungen und Auszahlungen eines Haushaltsjahres – reiner Kassenfokus, kein Blick auf Vermögenswerte.<br>② <strong>Geldverbrauchs-Fokus:</strong> Zeigt die Liquidität, vernachlässigt aber Vermögenswerte und langfristigen Werteverzehr (keine Abschreibungen).<br>③ <strong>Mittelkontrolle:</strong> Sichert strikte budgetäre Gesetzmäßigkeit und ministerielle Vorgaben; starke formale Bindung an genehmigte Haushaltspläne.<br>④ <strong>Abgrenzung zu Effektivität:</strong> Kameralistik überwacht formal die Kassenmittel, misst aber nicht den inhaltlichen Einsatzerfolg oder gesellschaftlichen Nutzen.<br><br><strong>Doppik</strong> (Doppelte Buchführung / NKF / NKHR) – kaufmännisches Rechnungswesen der öffentlichen Hand; ergibt sich aus dem Neuen Steuerungsmodell (NSM/NPM):<br>① <strong>Kaufmännisches Prinzip:</strong> Ersetzt Kameralistik durch doppelte Buchführung mit Bilanz, Ergebnisrechnung und Finanzrechnung.<br>② <strong>Ressourcenverbrauch:</strong> Periodengerechter Werteverzehr (Abschreibungen) statt reiner Zahlungsströme – macht langfristigen Substanzverlust sichtbar.<br>③ <strong>Transparenz:</strong> Zeigt das tatsächliche Vermögen und die Schulden der öffentlichen Hand vollständig (inkl. Pensionsrückstellungen, Infrastrukturvermögen).<br>④ <strong>Generationengerechtigkeit:</strong> Verhindert Konsum auf Kosten der Zukunft, da Abschreibungen den laufenden Ressourcenverbrauch dem zugehörigen Haushaltsjahr zuordnen.',
     short:'<strong>Kameralistik:</strong><br>① Kassensteuerung – nur Einzahlungen/Auszahlungen (Zahlungsorientierung)<br>② Geldverbrauchs-Fokus – Liquidität, kein Vermögensausweis, keine Abschreibungen<br>③ Mittelkontrolle – strikte budgetäre Gesetzmäßigkeit<br>④ Abgrenzung zu Effektivität – misst nicht inhaltlichen Einsatzerfolg<br><br><strong>Doppik (NSM/NPM):</strong><br>① Kaufmännisches Prinzip – Bilanz + Ergebnisrechnung + Finanzrechnung<br>② Ressourcenverbrauch – Abschreibungen, periodengerechter Werteverzehr<br>③ Transparenz – vollst. Ausweis Vermögen, Schulden, Pensionsrückstellungen<br>④ Generationengerechtigkeit – kein Konsum auf Kosten der Zukunft'},
    {id:9,nr:'Frage 10',punkte:5,cat:'Vergabe',
     text:'Ein neutrales Leistungsverzeichnis ist für eine Beschaffung von zentraler Bedeutung. Nennen Sie vier Aspekte eines neutralen Leistungsverzeichnisses.',
     answer:'Ein <strong>neutrales Leistungsverzeichnis (LV)</strong> beschreibt den Beschaffungsgegenstand so, dass kein Anbieter bevorzugt oder benachteiligt wird (§ 31 VgV, § 7 VOB/A).<br><br><strong>① Vergaberecht &amp; Neutralität:</strong><br>Leistungsverzeichnisse müssen Bedarfe <strong>exakt und herstellerneutral</strong> beschreiben – keine Nennung von Marken, Typen oder Herstellern. Alle geeigneten Anbieter sollen gleichermaßen ansprechen können.<br><br><strong>② Diskriminierungsverbot:</strong><br>Es ist <strong>rechtswidrig</strong>, bestimmte Hersteller oder Fahrzeugmodelle bei Ausschreibungen zu bevorzugen. Auch versteckte Spezifikationen, die faktisch nur ein Produkt erfüllen kann, verstoßen gegen das Diskriminierungsverbot.<br><br><strong>③ Wettbewerbssicherung:</strong><br>Transparente, neutrale Kriterien sichern den <strong>fairen Marktvergleich</strong> – möglichst viele Anbieter sollen Angebote einreichen können. Wettbewerb senkt Preise und steigert Qualität.<br><br><strong>④ Rechtssicherheit:</strong><br>Saubere Leistungsbeschreibungen schützen Kommunen und Feuerwehren vor <strong>Vergaberügen</strong> und teuren Beschaffungsstopps. Lücken oder herstellerspezifische Anforderungen können nachträglich angefochten werden.',
     short:'<strong>4 Aspekte des neutralen Leistungsverzeichnisses:</strong><br>① <strong>Vergaberecht &amp; Neutralität</strong> – exakte, herstellerneutrale Bedarfsbeschreibung; keine Marken/Typen/Hersteller.<br>② <strong>Diskriminierungsverbot</strong> – Bevorzugung bestimmter Hersteller oder Fahrzeugmodelle ist rechtswidrig.<br>③ <strong>Wettbewerbssicherung</strong> – transparente Kriterien ermöglichen fairen Marktvergleich und maximalen Bieterwettbewerb.<br>④ <strong>Rechtssicherheit</strong> – saubere Leistungsbeschreibungen schützen vor Vergaberügen und Beschaffungsstopps.'},
    {id:10,nr:'Frage 11',punkte:5,cat:'Weg der Ansatzermittlung (Haushalt)',
     text:'Beschreiben Sie den Weg der Ansatzermittlung im Haushaltsrecht in vier Schritten.',
     answer:'Der <strong>Weg der Ansatzermittlung</strong> beschreibt, wie die Feuerwehr ihren Finanzbedarf für das kommende Haushaltsjahr geltend macht und bis zum verbindlichen Beschluss begleitet:<br><br><strong>Schritt 1 – Bedarfsanmeldung</strong><br>Die Feuerwehr meldet ihre notwendige Ausrüstung und Technik für das kommende Jahr an. Dabei wird unterschieden in <strong>fixe Kosten</strong> (z. B. Mieten, Vertragskosten, in Teilen Verbrauchsmaterial) und <strong>variable Kosten</strong> (z. B. Projekte, Sonderbeschaffungen). Die Anmeldung muss fachlich begründet sein.<br><br><strong>Schritt 2 – Priorisierung</strong><br>Gemeinde (Kämmerei / Verwaltungsführung) und Wehrleitung ordnen die eingereichten Anträge nach <strong>Dringlichkeit und Relevanz</strong>. Nicht alle Anmeldungen können berücksichtigt werden – politische und finanzielle Abwägungen fließen ein.<br><br><strong>Schritt 3 – Ansatzermittlung</strong><br>Auf Basis der priorisierten Anmeldungen werden die <strong>konkreten Geldbeträge im Haushaltsplanentwurf</strong> festgelegt (Ansätze). Der Entwurf wird durch die Kämmerei erstellt und in die politische Beratung eingebracht.<br><br><strong>Schritt 4 – Finaler Beschluss</strong><br>Der <strong>Gemeinderat verabschiedet den Haushalt rechtssicher</strong> als Satzung. Erst nach dem Beschluss stehen die Mittel für die Feuerwehr verbindlich zur Verfügung – keine Vergabe ohne beschlossene Haushaltsmittel.',
     short:'<strong>4 Schritte – Weg der Ansatzermittlung:</strong><br>① <strong>Bedarfsanmeldung:</strong> FW meldet Ausrüstung/Technik für kommendes Jahr (fixe Kosten: Mieten; variable Kosten: Projekte).<br>② <strong>Priorisierung:</strong> Gemeinde &amp; Wehrleitung ordnen Anträge nach Dringlichkeit und Relevanz.<br>③ <strong>Ansatzermittlung:</strong> Festlegung der konkreten Geldbeträge im Haushaltsplanentwurf durch Kämmerei.<br>④ <strong>Finaler Beschluss:</strong> Gemeinderat verabschiedet Haushalt rechtssicher als Satzung → Mittel verbindlich verfügbar.'},
    {id:11,nr:'Frage 12',punkte:5,cat:'VWL',
     text:'Erläutern Sie das Argument der indirekten Wertschöpfung im Rahmen der Haushaltsaufstellung anhand von vier Kategorien.',
     answer:'Das Argument der <strong>indirekten Wertschöpfung</strong> zeigt, dass Feuerwehrausgaben nicht nur Kosten sind, sondern volkswirtschaftlichen Nutzen erzeugen – ein zentrales Argument in Haushaltsverhandlungen:<br><br><strong>① Indirekte Wertschöpfung</strong><br>Die Feuerwehr <strong>produziert keine Güter</strong>, verhindert aber deren Zerstörung. Dieser Schutz von Sachwerten, Infrastruktur und Betriebskapital ist eine nicht direkt sichtbare, aber real erbrachte wirtschaftliche Leistung.<br><br><strong>② Faktor Zeit</strong><br><strong>Schnelle Eingreifzeiten</strong> begrenzen den Schaden auf ein Minimum. Jede Minute früherer Intervention reduziert direkte Sach- und Folgeschäden – die Eintreffzeit ist daher ein zentraler volkswirtschaftlicher Hebel.<br><br><strong>③ Betriebserhalt</strong><br>Ein gelöschtes Firmengebäude bedeutet die <strong>Vermeidung teurer Produktionsausfälle</strong>. Ohne Feuerwehreinsatz drohen Betriebsunterbrechungen, Lieferkettenausfälle und ggf. dauerhafte Betriebsschließungen.<br><br><strong>④ Existenzsicherung</strong><br>Der Schutz von Betriebsstätten sichert langfristig <strong>lokale Arbeitsplätze und Steuereinnahmen</strong>. Feuerwehrausgaben stabilisieren damit indirekt die kommunale Haushaltsbasis und rechtfertigen sich auch gegenüber einer KNA.',
     short:'<strong>4 Kategorien indirekter Wertschöpfung (VWL S.28):</strong><br>① <strong>Indirekte Wertschöpfung</strong> – FW produziert keine Güter, verhindert aber deren Zerstörung.<br>② <strong>Faktor Zeit</strong> – schnelle Eingreifzeiten begrenzen Schaden auf Minimum.<br>③ <strong>Betriebserhalt</strong> – gelöschtes Firmengebäude verhindert teure Produktionsausfälle.<br>④ <strong>Existenzsicherung</strong> – Schutz von Betriebsstätten sichert Arbeitsplätze und Steuereinnahmen.'},
    {id:12,nr:'Frage 13',punkte:5,cat:'VWL',
     text:'Was ist die Kosten-Nutzen-Analyse (KNA)? Nennen Sie fünf Kategorien des Instruments.',
     answer:'Die <strong>Kosten-Nutzen-Analyse (KNA)</strong> ist ein Bewertungsinstrument, das alle anfallenden Kosten und erwarteten Nutzen eines Projekts oder einer Maßnahme systematisch erfasst, bewertet und gegenüberstellt. Im öffentlichen Haushaltsrecht ist sie gesetzlich verankerte Grundlage für finanzwirksame Entscheidungen (HGrG).<br><br><strong>① Bewertungstool</strong><br>Die KNA <strong>vergleicht alle anfallenden Kosten und erwarteten Nutzen</strong> eines Projekts in Geldwerten. Überwiegt der Nutzen, gilt die Maßnahme als wirtschaftlich vertretbar.<br><br><strong>② Entscheidungshilfe</strong><br>Die KNA <strong>objektiviert die Auswahl zwischen verschiedenen Investitionsalternativen</strong> (z. B. Fahrzeugtypen, Standortalternativen) und macht Entscheidungen rational begründbar und für Dritte nachvollziehbar.<br><br><strong>③ Wirtschaftlichkeitsnachweis</strong><br>Die KNA ist <strong>gesetzlich vorgeschriebene Grundlage</strong> bei finanzwirksamen Maßnahmen im öffentlichen Bereich (Haushaltsgrundsätzegesetz = HGrG). Ohne Wirtschaftlichkeitsnachweis sind Ausgaben formal nicht zulässig.<br><br><strong>④ Makro-Blick</strong><br>Im Gegensatz zu rein betriebswirtschaftlichen Kalkulationen <strong>erfasst die KNA auch gesellschaftliche Wohlfahrtseffekte</strong> – z. B. verhinderte Umweltschäden, öffentliche Sicherheit, Lebensqualität – die über direkte Ausgaben hinausgehen.<br><br><strong>⑤ Priorisierung</strong><br>Die KNA <strong>verhindert Fehlinvestitionen</strong>, indem sie den langfristigen Mehrwert einer Maßnahme nachweist und eine fundierte Priorisierung konkurrierender Ausgaben (z. B. Fahrzeug A vs. Fahrzeug B) ermöglicht.',
     short:'<strong>KNA:</strong> Systematischer Vergleich aller Kosten und Nutzen einer Maßnahme in Geldwerten; gesetzlich vorgeschrieben (HGrG).<br><br><strong>5 Kategorien der KNA (VWL S.42):</strong><br>① <strong>Bewertungstool</strong> – vergleicht Kosten und Nutzen eines Projekts in Geldwerten.<br>② <strong>Entscheidungshilfe</strong> – objektiviert Auswahl zwischen verschiedenen Investitionsalternativen.<br>③ <strong>Wirtschaftlichkeitsnachweis</strong> – gesetzlich vorgeschrieben bei finanzwirksamen Maßnahmen (HGrG).<br>④ <strong>Makro-Blick</strong> – erfasst auch gesellschaftliche Wohlfahrtseffekte über direkte Ausgaben hinaus.<br>⑤ <strong>Priorisierung</strong> – verhindert Fehlinvestitionen durch Nachweis des langfristigen Mehrwerts.'},
    {id:14,nr:'Frage 14',punkte:5,cat:'Bedarfsplanung',
     text:'Was ist ein Planungsziel in der Feuerwehrbedarfsplanung, und woraus besteht es?',
     answer:'<strong>Definition Planungsziel</strong><br>Ein <strong>Planungsziel</strong> definiert den angestrebten Leistungsstand, den eine Feuerwehr im Einsatzfall erreichen soll. Es bildet den <strong>normativen Kern des Bedarfsplans</strong> und macht die geforderte Leistungsfähigkeit quantifizierbar und damit politisch beschließbar.<br><br><strong>Funktion</strong><br>Das Planungsziel operationalisiert das <strong>Schutzziel</strong> (z. B. „Menschenrettung vor Flashover") in mess- und überprüfbare Kenngrößen. Nur so kann die Zielerreichung später per Hilfsfristerreichungsanalyse bewertet und ggf. nachgesteuert werden.<br><br><strong>Die drei Zieldimensionen</strong><br>① <strong>Hilfsfrist (Planungsfrist)</strong><br>Zeitspanne zwischen Eingang des Notrufes und Eintreffen der ersten taktischen Einheit an der Einsatzstelle.<br>→ Üblicherweise <strong>8 Minuten</strong> für die erste und <strong>13 Minuten</strong> für die Ergänzungskraft (Empfehlung AGBF).<br><br>② <strong>Taktische Einheit (Funktionsstärke)</strong><br>Qualitative und quantitative Stärke der Kräfte, die innerhalb der Hilfsfrist ankommen müssen.<br>→ Üblicherweise <strong>1/9 = 10 Einsatzkräfte</strong> für den Kritischen Wohnungsbrand als Referenzszenario (AGBF-Grundsätze).<br><br>③ <strong>Erreichungsgrad</strong><br>Anteil aller relevanten Einsätze, bei denen Hilfsfrist <em>und</em> Funktionsstärke gleichzeitig erreicht werden.<br>→ AGBF-Empfehlung: <strong>mindestens 90 %</strong> aller Einsätze der Schutzzielkategorie.<br><br><strong>Zusammenhang</strong><br>Das Planungsziel bildet die Grundlage für die <strong>Hilfsfristerreichungsanalyse</strong> (Ist-Analyse), aus der Rückschlüsse auf Standorte, Fahrzeugvorhaltung und Personalstärke abgeleitet werden. Eine strukturelle Unterschreitung löst die Pflicht zur Anpassung des Bedarfsplans aus.',
     short:'<strong>Planungsziel:</strong> Definiert den angestrebten Leistungsstand der Feuerwehr im Einsatzfall; normativer Kern des Bedarfsplans; macht Leistungsfähigkeit messbar.<br><br><strong>3 Zieldimensionen:</strong><br>① <strong>Hilfsfrist (Planungsfrist)</strong> – Zeit zwischen Notruf und Eintreffen der 1. taktischen Einheit (Standard: 8 min / Ergänzung: 13 min).<br>② <strong>Taktische Einheit (Funktionsstärke)</strong> – Stärke der fristgerecht eintreffenden Kräfte (Standard: 1/9 = 10 EK für Kritischen Wohnungsbrand).<br>③ <strong>Erreichungsgrad</strong> – Anteil der Einsätze, bei denen Hilfsfrist + Funktionsstärke gleichzeitig erreicht werden (AGBF: mind. <strong>90 %</strong>).'}
  ];

  const KF_TOTAL_PTS = QUESTIONS.reduce(function(s,q){return s+q.punkte;},0);

  function loadScores(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  function saveScores(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} }
  function scoreKey(id){ return 'q'+id; }
  function dotsHtml(){
    return QUESTIONS.map(function(q,i){
      var sc=_scores[scoreKey(q.id)];
      var cls='fb-dot'+(i===_step?' fb-dot-active':sc!==undefined?' fb-dot-done':'');
      return '<span class="'+cls+'" onclick="KF_QUIZ.goToQ('+i+')" title="Zu Frage '+(i+1)+' springen">'+(i+1)+'</span>';
    }).join('');
  }

  function renderStart(){
    var el=document.getElementById('kf-content'); if(!el) return;
    _scores=loadScores();
    var scored=QUESTIONS.filter(function(q){return _scores[scoreKey(q.id)]!==undefined;});
    var totalScored=scored.reduce(function(s,q){return s+(_scores[scoreKey(q.id)]||0);},0);
    var progress=scored.length;
    var overviewRows=QUESTIONS.map(function(q,i){
      var pts=_scores[scoreKey(q.id)];
      var done=pts!==undefined;
      var ptsHtml=done?('<span class="uk-q-pts-got">'+pts+'/'+q.punkte+'</span>'):'<span class="uk-q-pts-open">–</span>';
      return '<div class="uk-q-row'+(done?' uk-q-done':'')+'" onclick="KF_QUIZ.goToQ('+i+')">'+'<span class="acc-num">'+String(i+1).padStart(2,'0')+'</span><span class="uk-q-nr">'+q.nr+'</span><span class="acc-pts">'+q.punkte+' Pkt.</span>'+ptsHtml+'<span class="acc-q">'+q.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\s*\n\s*/g,' ')+'</span><span class="uk-q-hint">'+(done?'Nochmal ansehen ›':'Beantworten ›')+'</span></div>';
    }).join('');
    var progressHtml=progress>0?('<div class="uk-progress-row"><span>Fortschritt: '+progress+'/'+QUESTIONS.length+' bewertet</span><span>'+totalScored+'/'+KF_TOTAL_PTS+' Punkte ('+Math.round(totalScored/KF_TOTAL_PTS*100)+' %)</span></div>'):''
;    var resetBtn=progress>0?'<button class="uk-timer-reset" style="margin-left:auto" onclick="KF_QUIZ.resetAll()">↺ Neu beginnen</button>':'';
    var resultBtn=progress===QUESTIONS.length?'<button class="uk-result-btn" onclick="KF_QUIZ.showResult()">Auswertung anzeigen</button>':'';
    el.innerHTML='<div class="uk-start"><div class="uk-intro-box"><div class="uk-intro-title">Klausurfragen · FeuAK Hamburg</div>'+'<div class="uk-intro-meta">'+QUESTIONS.length+' Fragen · '+KF_TOTAL_PTS+' Punkte</div>'+'</div>'+(resetBtn?'<div class="uk-timer-box">'+resetBtn+'</div>':'')+'<div class="uk-q-overview">'+overviewRows+'</div>'+progressHtml+'<button class="uk-start-btn" onclick="KF_QUIZ.goToQ(0)">'+(progress>0?'Klausur fortsetzen →':'Klausur beginnen →')+'</button>'+resultBtn+'</div>';
  }

  function renderQuestion(){
    var el=document.getElementById('kf-content'); if(!el) return;
    _scores=loadScores();
    var q=QUESTIONS[_step];
    var savedTa=_scores['ta_q'+q.id]||'';
    var myPts=_scores[scoreKey(q.id)];
    var scoreBtns=Array.from({length:q.punkte+1},function(_,i){return '<button class="uk-score-btn'+(myPts===i?' uk-score-active':'')+'" onclick="KF_QUIZ.setScore('+i+')">'+i+'</button>';}).join('');
    var scoreGot=myPts!==undefined?('<span class="uk-score-got">'+myPts+'/'+q.punkte+' Pkt. gespeichert</span>'):'';
    var prevBtn=_step===0?'':'<button class="fb-prev-btn" onclick="KF_QUIZ.prevQ()">← Zurück</button>';
    var nextLabel=_step===QUESTIONS.length-1?'Auswertung →':'Nächste Frage →';
    var nextFn=_step===QUESTIONS.length-1?'KF_QUIZ.showResult()':'KF_QUIZ.nextQ()';
    el.innerHTML='<div class="uk-q-header"><button class="uk-back-btn" onclick="KF_QUIZ.showStart()">← Übersicht</button>'+'<span class="uk-q-badge">'+q.nr+' · '+q.punkte+(q.punkte===1?' Punkt':' Punkte')+'</span></div>'+'<div class="uk-question"><p>'+q.text+'</p></div>'+'<textarea class="fb-textarea" id="kf-ta" placeholder="Schreibe deine Antwort hier…" rows="6">'+xss(savedTa)+'</textarea>'+'<div class="eq-reveal-row" id="kf-reveal-row">'+'<button class="fb-reveal-btn" id="kf-reveal-btn" onclick="KF_QUIZ.reveal()">Musterlösung anzeigen</button>'+'<button class="eq-short-btn" id="kf-short-btn" onclick="KF_QUIZ.revealShort()">Kurzantwort</button></div>'+'<div class="fb-answer'+(_revealed?'':' hidden')+'" id="kf-answer">'+q.answer+'</div>'+'<div class="fb-answer eq-short-answer'+(_shortRevealed?'':' hidden')+'" id="kf-short">'+(q.short||q.answer)+'</div>'+'<div class="uk-score-row'+((_revealed||_shortRevealed)?'':' hidden')+'" id="kf-score-row">'+'<span class="uk-score-label">Meine Punkte:</span><div class="uk-score-btns">'+scoreBtns+'</div>'+scoreGot+'</div>'+'<div class="fb-step-actions">'+prevBtn+'<button class="fb-next-btn" onclick="'+nextFn+'">'+nextLabel+'</button></div>'+'<div class="fb-step-dots">'+dotsHtml()+'</div>';
  }

  function renderResult(){
    var el=document.getElementById('kf-content'); if(!el) return;
    _scores=loadScores();
    var total=QUESTIONS.reduce(function(s,q){return s+(_scores[scoreKey(q.id)]||0);},0);
    var pct=Math.round(total/KF_TOTAL_PTS*100);
    var grade=pct>=90?'Sehr gut':pct>=80?'Gut':pct>=70?'Befriedigend':pct>=60?'Ausreichend':'Nicht bestanden';
    var gradeCol=pct>=60?'#4ACD90':'#ef4444';
    var rows=QUESTIONS.map(function(q,i){
      var got=_scores[scoreKey(q.id)];
      var done=got!==undefined;
      var col=done?(got===q.punkte?'#4ACD90':got>0?'var(--c-gold)':'#ef4444'):'var(--c-slate-l)';
      return '<tr><td>'+q.nr+'</td><td>'+q.punkte+'</td><td style="color:'+col+'">'+(done?got:'–')+'</td><td><button class="uk-jump-btn" onclick="KF_QUIZ.goToQ('+i+')">→</button></td></tr>';
    }).join('');
    el.innerHTML='<div class="uk-result"><div class="uk-result-header">Auswertung</div>'+'<div class="uk-result-score" style="color:'+gradeCol+';">'+total+' / '+KF_TOTAL_PTS+' Punkte</div>'+'<div class="uk-result-pct" style="color:'+gradeCol+';">'+pct+' % – '+grade+'</div>'+'<div class="uk-result-bar"><div class="uk-result-fill" style="width:'+pct+'%;background:'+gradeCol+';"></div></div>'+'<table class="uk-result-table"><thead><tr><th>Frage</th><th>Max.</th><th>Erreicht</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+'<div class="uk-result-actions">'+'<button class="uk-start-btn" onclick="KF_QUIZ.showStart()">← Zur Übersicht</button>'+'<button class="uk-reset-btn" onclick="KF_QUIZ.resetAll()">Neu beginnen</button></div></div>';
  }

  return {
    init:function(){
      _scores=loadScores();
      this.showStart();
    },
    showStart:function(){
      _step=0; _revealed=false;
      renderStart();
    },
    goToQ:function(i){
      var ta=document.getElementById('kf-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      _step=i; _revealed=false; _shortRevealed=false;
      renderQuestion(); window.scrollTo({top:0,behavior:'instant'});
    },
    nextQ:function(){
      var ta=document.getElementById('kf-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      if(_step<QUESTIONS.length-1){_step++;_revealed=false;_shortRevealed=false;renderQuestion();window.scrollTo({top:0,behavior:'instant'});}
    },
    prevQ:function(){
      var ta=document.getElementById('kf-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      if(_step>0){_step--;_revealed=true;_shortRevealed=false;renderQuestion();window.scrollTo({top:0,behavior:'instant'});}
    },
    reveal:function(){
      var ta=document.getElementById('kf-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      _revealed=!_revealed;
      var ans=document.getElementById('kf-answer');
      if(ans){if(_revealed){ans.classList.remove('hidden');}else{ans.classList.add('hidden');}}
      var sr=document.getElementById('kf-score-row');
      if(sr){if(_revealed||_shortRevealed){sr.classList.remove('hidden');}else{sr.classList.add('hidden');}}
      var btn=document.getElementById('kf-reveal-btn');
      if(btn){if(_revealed){btn.classList.add('eq-btn-active');}else{btn.classList.remove('eq-btn-active');}}
    },
    revealShort:function(){
      var ta=document.getElementById('kf-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      _shortRevealed=!_shortRevealed;
      var sh=document.getElementById('kf-short');
      if(sh){if(_shortRevealed){sh.classList.remove('hidden');}else{sh.classList.add('hidden');}}
      var sr=document.getElementById('kf-score-row');
      if(sr){if(_revealed||_shortRevealed){sr.classList.remove('hidden');}else{sr.classList.add('hidden');}}
      var btn=document.getElementById('kf-short-btn');
      if(btn){if(_shortRevealed){btn.classList.add('eq-short-btn-active');}else{btn.classList.remove('eq-short-btn-active');}}
    },
    setScore:function(pts){
      var d=loadScores();d[scoreKey(QUESTIONS[_step].id)]=pts;saveScores(d);_scores=d;
      renderQuestion();
      _revealed=true;
      document.getElementById('kf-answer')?.classList.remove('hidden');
      document.getElementById('kf-score-row')?.classList.remove('hidden');
    },
    showResult:function(){renderResult();},
    // Stand für die Übersichtskachel: nur Fragen, die es wirklich gibt
    info:function(){
      var sc={};try{sc=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
      var got=QUESTIONS.filter(function(q){return sc[scoreKey(q.id)]!==undefined;});
      return {done:got.length,totalQ:QUESTIONS.length,pts:got.reduce(function(a,q){return a+(parseInt(sc[scoreKey(q.id)])||0);},0),maxPts:KF_TOTAL_PTS};
    },
    resetAll:function(){
      localStorage.removeItem(KEY);_scores={};_step=0;_revealed=false;_shortRevealed=false;
      renderStart();
    }
  };
})();

/* ══════════════════════════════════════════════════════════════
   KLAUSUR_HUB – Live-Fortschritt für den Klausuren-Übersichtstab
══════════════════════════════════════════════════════════════ */
const KLAUSUR_HUB = (function(){
  function getInfo(key, totalQ, maxPts){
    try{
      var sc=JSON.parse(localStorage.getItem(key)||'{}');
      var scored=Object.keys(sc).filter(function(k){return /^q\d+$/.test(k);});
      var pts=scored.reduce(function(s,k){return s+(parseInt(sc[k])||0);},0);
      return {done:scored.length, totalQ:totalQ, pts:pts, maxPts:maxPts};
    }catch(e){return {done:0,totalQ:totalQ,pts:0,maxPts:maxPts};}
  }
  function fmt(info){
    if(info.done===0) return 'Noch nicht gestartet';
    return info.done+'/'+info.totalQ+' bewertet · '+info.pts+'/'+info.maxPts+' Pkt.';
  }
  return {
    render:function(){
      var eq=document.getElementById('klh-eq-progress');
      var fq=document.getElementById('klh-fq-progress');
      var kf=document.getElementById('klh-kf-progress');
      if(kf) kf.textContent=fmt(KF_QUIZ.info());
      if(eq) eq.textContent=fmt(getInfo('bvi_eq_scores',8,50));
      if(fq) fq.textContent=fmt(getInfo('bvi_fq_scores',22,110));
    }
  };
})();


/* ======================================================================
   CHANGELOG – Update-Feed mit Auto-Open bei neuer Version
====================================================================== */
const CHANGELOG=(function(){
  const KEY='bvi_seen_version';
  const _MON=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  function _fmtTs(ts){
    const d=new Date(ts);
    return`${d.getDate()}. ${_MON[d.getMonth()]} ${d.getFullYear()}`;
  }
  const ENTRIES=[
    {v:'3.0.0',ts:'2026-10-19T22:00',items:[
      'Neues App-Design auf Handy, Tablet und Desktop: Navigation mit Start, Stundenplan, Prüfung, Einstellungen und Lernen – unten als Tab-Leiste, auf dem Desktop als Seitenleiste links',
      'Android-App: Das Startsymbol und das Startbild folgen jetzt auch dem Farbschema – schwarz im dunklen, hell (Farbton der Website) im hellen Design',
      'Startseite: Beim Wechsel zwischen Woche und Monaten starten die Animationen nicht mehr neu; die Umschalter sind wieder schmaler',
      'Android-App: Drei Widgets für den Startbildschirm zur Auswahl – „Nächste Einheit“, „Tagesplan“ und „Jetzt und danach“ mit Zeitraum, Raum, Restzeit und der Einheit danach (nach Unterrichtsende zeigen sie, was morgen ansteht); sie folgen Akzentfarbe und Hell/Dunkel',
      'Lehrgang: Unter Einstellungen den Jahrgang wählen (BRef/AB, jedes Halbjahr ein neuer). Alle Jahrgänge starten als 1:1-Kopie des Masters; Verbesserungen am Master kommen automatisch an. Pro Jahrgang: eigener Stundenplan (Kalenderdatei, Foto oder Screenshot mit Texterkennung, oder Eingabeformular), Ergänzungen zu jeder Lernseite mit „+“ (Text oder Bild, mit Texterkennung), eigene Prüfungen hinzufügen und löschen (mit Rückgängig), einzelne Prüfungen als „klausurrelevant“ (★) markieren (nur sie füttern Einsatzfahrt und Duell), und alle Änderungen als Datei exportieren und einlesen',
      'Stundenplan: Eigenen Stundenplan aus einer Kalenderdatei (.ics) laden – er ersetzt den IdF-Plan und alle Funktionen laufen weiter (nächste Einheit auf der Startseite, Widgets, Notizen, Kalender-Export); der IdF-Plan lässt sich als Kalender-Abo (Link, der sich selbst aktualisiert) in den eigenen Kalender einbinden',
      'Lernkarten teilen: Eigene Karten als Link oder QR-Code an Kollegen schicken (die Karten stecken im Link, nichts läuft über einen Server); „Per E-Mail senden“ gibt es nicht mehr',
      'Lernseiten: Abkürzungen (z. B. ELW, FwDV, HBKG) sind beim ersten Vorkommen auf der Seite unterstrichen; ein Tipp zeigt Name und Erläuterung aus dem Abkürzungsverzeichnis',
      'Neu: Markierten Text auf einer Lernseite mit „Als Lernkarte“ direkt zu einer eigenen Lernkarte machen (Modul wird vorgewählt, die Frage schreibst du dazu)',
      'Updates: Bei einer neuen Version erscheint ein Hinweis „Aktualisieren“, statt dass die Seite mitten im Lernen neu lädt',
      'Spendenlink: dezente Karte unten auf der Startseite (ohne Pop-up)',
      'Lernseiten bearbeiten: Mit „Seite bearbeiten“ lassen sich ganze Kapitel und einzelne Blöcke ausblenden, auch innerhalb eines Kapitels ergänzen, und „gelöschte wiederherstellen“ bringt alles zurück (zusätzlich gibt es Rückgängig direkt nach dem Löschen)',
      'Prüfungen: Klausurrelevanz (★) gilt jetzt je einzelne Prüfung statt für den ganzen Reiter',
      'Jahrgang einrichten (Einstellungen → Lehrgang): Checkliste mit Stundenplänen, Klausurterminen, Lehrgangs-Link, Standorten und Lernkarten des Jahrgangs; die Datei trägt alles mit',
      'Lernseiten: „+ Eigene Ergänzung“ und „+ Eigene Frage“ erscheinen erst nach „Seite bearbeiten“; Ergänzungen als Freitext, Single-Choice oder Multiple-Choice, dazu eigene Kapitel; das Kreuz sitzt rechts an der Frage',
      'Klausuren: In Jahrgängen lassen sich direkt auf der Prüfungsseite eigene Fragen hinzufügen, bearbeiten, entfernen und üben (sie zählen für Einsatzfahrt, wenn die Prüfung klausurrelevant ist)',
      'Stundenplan (Jahrgänge): Für IdF gibt es je einen Plan für Gruppe 1 und Gruppe 2 mit Umschalter; mit „Als aktiven Stundenplan markieren“ wählst du die Gruppe für Startseite und Widgets',
      'Einsatzfahrt-Duell: Farbverlauf auf der Karte entfernt',
      'Master-Lehrgang ist nicht veränderbar (keine Bearbeitungsfelder); den Farbverlauf in den Prüfungen tragen nur die hervorgehobenen Prüfungen, in Jahrgängen lässt sich das je Prüfung mit ★ ändern',
      'Kapitelkarten zeigen keine Lesezeit in Minuten mehr, nur noch ein Häkchen bei gelesenen Kapiteln',
      'Stundenplan: Er springt von selbst zur aktuellen Kalenderwoche, wenn das Datum weiterläuft (Mitternacht) oder die App wieder in den Vordergrund kommt – außer du hast selbst in andere Wochen geblättert',
      'Fehlerbehebung: In Textfeldern (Suche, eigene Lernkarte) lassen sich „j“ und „f“ wieder tippen; Lesezeichen und „Zuletzt gesucht“ in der Suche funktionieren wieder; Markierungen funktionieren auch im Kapitel-Fenster auf Handy und Tablet',
      'Fehlerbehebung: Der Prüfungsmodus gibt bei Zeitablauf automatisch ab; Pomodoro startet nach Ablauf eine neue Runde; Klausur-Timer und Pomodoro laufen auch bei gesperrtem Bildschirm richtig weiter; ein abgelaufener Klausur-Timer meldet sich nicht mehr bei jedem Start',
      'Fehlerbehebung: Fenster (Suche, Notiz, Pomodoro, Neuigkeiten) nehmen den Fokus auf, halten die Tab-Taste im Fenster und schließen mit Zurück oder Esc einzeln; die Zurück-Taste der Android-App schließt zuerst offene Fenster',
      'Fehlerbehebung: Eine Notiz landet immer auf der Seite, auf der sie geschrieben wurde; Sicherungen werden beim Einspielen geprüft, damit eine kaputte Datei die App nicht lahmlegt; bei vollem Speicher läuft die App weiter und weist darauf hin',
      'Fehlerbehebung: Besserer Kontrast der Schrift auf Akzentflächen (Rot, Blau, Grün); größere Trefferflächen auf Touch-Geräten; ein Quiz-Fakt zur Vergabefrist korrigiert (35 statt 52 Tage); Erste Schritte nennt den Pausenraum; fehlender Trennstrich in den Einstellungen ergänzt',
      'Fehlerbehebung Pausenraum und Duell: Wörter-Raten färbt doppelte Buchstaben richtig, Duell-Gast bricht nicht mehr nach 30 Sekunden ab, fremde oder eingefügte Codes werden erkannt, die Kamera schaltet sich zuverlässig aus, Revanche-Knopf nur wenn der Gegner noch da ist',
      'Fehlerbehebung Offline: Bilder werden mit der App gespeichert und sind auch ohne Netz da',
      'Suche: Aktionen (Seitensprünge, Notiz, Lesezeichen, Fokus) und die Filterleiste entfernt – die Suche zeigt nur noch Treffer und die Kapitel der Seite',
      'Startseite: Der Satz unter der Begrüßung wechselt bei jedem Aufrufen der Seite; „Freiwillige Spende“ ist als ganze Karte anklickbar',
      'Startseite: Wochen- und Monatsdiagramm passt auf dem Handy wieder vollständig in die Karte',
      'Einstellungen: Gruppen (Darstellung, Lernen, Erinnerung, Daten, Werkzeuge, App) klappen auf und zu und zeigen die aktuellen Werte; „Projekt unterstützen“ bleibt immer unten sichtbar',
      'Farbschema: Dunkel, Hell oder System (Einstellungen → Farbschema)',
      'Akzentfarbe wählbar (5 Vorgaben oder Farbkreis); sie färbt Navigation, Rahmen und Grafiken, in der Android-App auch das Symbol auf dem Startbildschirm',
      'Neues App-Symbol: die Flamme der Website',
      'Startseite ruhiger: Weiterlernen mit Tagesziel-Ring, Lernzeit-Verlauf als Balken (Woche oder Monate) mit nächster Einheit, Module als Ringe, 1. Ausbildungsjahr eingeklappt; Gruß und Spruch passend zur Tageszeit',
      'Stundenplan: IdF Modul 3.5 mit Uhrzeiten, Räumen, Hinweisen, Mittagspause und Telefonnummern; Übernahme in den Kalender mit Erinnerung',
      'Prüfung: alle Klausur-Werkzeuge an einem Ort, mit Countdown zur nächsten Klausur; Altklausur-Quiz, Klausurfragen und Fallbearbeitung im neuen Design',
      'Prüfung: neuer Abschnitt „Laufbahnprüfung“ mit den schriftlichen Klausuren Dez 2023 und Juni 2026 samt Musterlösungen (wie Klausur 08/2026) und Abschnitt „IdF Münster“ mit dem Altklausur-Quiz IdF (Vorbeugender Brandschutz und Stabsarbeit, Mehrfachauswahl, Lern- und Prüfungsmodus, Wiederholung nach Plan), auch im Reiter IdF erreichbar; Quelle und Unsicherheit stehen bei jeder Antwort; Prüfung-Tab als gleichmäßiges Raster (3 Spalten Desktop, 2 Tablet, 1 Handy) und Countdown-Karte führt zum passenden Quiz bzw. zur Klausur',
      'Startseite: Die nächste Einheit steht oben rechts neben der Begrüßung (im Unterricht grau die laufende, orange die folgende; Text bis zu drei Zeilen), ein Tipp öffnet den Stundenplan',
      'Prüfungs-Karten (Quiz, Klausuren, Fallbearbeitung, Simulator) bekommen keinen Haken mehr und zählen nicht zum Themenfortschritt; Führungsdienstsimulator steht oben im IBK-Reiter, Zurück aus einem Szenario führt zur Szenario-Übersicht',
      'Klausur-Seiten (Klausur 08/2026, Eingrenzung, Altklausur-Training FeuAK, Laufbahnklausuren, VAk-Klausurhinweise) als Karten: zuerst die Frage, per Tipp Kurzfassung und Musterlösung; Klausurfragen, Hubs (FeuAK, VAk) im gleichen Kartenstil und gleich groß',
      'Desktop: Befehlspalette (Strg K) mit Kapiteln und Aktionen, Fokus-Lesemodus (ganzer Bildschirm, Pfeiltasten, Schriftgröße) und ein ein-/ausblendbares Lernkarten-Fenster neben der Lernseite',
      'Der Pfeil „Nach oben“ (Seitenanfang) ist überall entfernt',
      'Die Kopfzeile mit Zurück, Üben, Fokus, Notiz und Lesezeichen bleibt auf Inhaltsseiten beim Scrollen sichtbar',
      'Startseite: Die Modul-Kreise tragen einen kleinen Pfeil-Knopf (›) mit Rand in Kartenfarbe am Ring und pulsieren beim Öffnen der Seite kurz nacheinander, damit klar ist, dass man sie antippen kann',
      'Neu: Pausenraum – Karte auf der Startseite mit wechselndem Satz und eigene Seite mit sechs Spielen: Einsatzfahrt (Route wählen, Prüfungsfragen aus IBK, VAk, FeuAK oder IdF, Hilfsfrist schaffen, Brand wächst mit der Zeit), Quizleiter, Wahr oder Falsch, Wörter-Raten, Mehr oder weniger und Memory; Fragen wahlweise Allgemeinwissen, Feuerwehr oder beides',
      'Pausenraum: Zurück im Spiel führt zur Spieleauswahl; bei „Mehr oder weniger“ liegen die Werte mit jeder richtigen Antwort enger beieinander; auf dem Handy steht die Karte über dem 1. Ausbildungsjahr; keine Tagesserie mehr in der Kopfzeile der Startseite',
      'Neu: Einsatzfahrt-Duell – zwei Spieler live gegeneinander; Verbindung direkt von Gerät zu Gerät per QR-Code (oder Kurzcode zum Kopieren), gleiche Prüfungsfragen in gleicher Reihenfolge, 5/10/15 Fragen, frei wählbare Module, 30 Sekunden pro Frage, beide Löschfahrzeuge und Richtig/Falsch des Gegners live sichtbar, Revanche, Bilanz gegen den Gegner, Pause von 30 Sekunden bei Verbindungsabbruch',
      'Duell: Die Kamera startet erst nach Tipp auf „Kamera starten“ mit kurzer Erklärung; bei verweigertem Zugriff steht der Weg in die Einstellungen da; die Android-App darf die Kamera jetzt nach Rückfrage nutzen (neue Android-App nötig); Kopfzeile zeigt „Prüfungsfragen“ statt „Allgemeinwissen“',
      'Duell: Alternativ zur Live-Kamera kann man den QR-Code über „Stattdessen Foto vom QR-Code aufnehmen“ fotografieren (Systemkamera des Geräts); das Foto wird in der App gelesen, auch wenn der Kamerazugriff gesperrt ist',
      'Navigation: Der Pausenraum steht jetzt in der Tab-Leiste und am Desktop in der Seitenleiste (nicht mehr auf der Startseite); die Lernkarten sind über die Startseite erreichbar. Entfernt: die Einstellungen „Karten pro Tag“ und „Zahl bei den Lernkarten“ samt Tagesfortschritt der Karten',
      'Duell: Das Haus steht in der Bildmitte, Spieler 1 fährt von links an, Spieler 2 von rechts; vor dem Spiel wählt jeder die Farbe seines Fahrzeugs (sechs Farben, doppelte Farben sind gesperrt)',
      'Duell: Der Platzhalter im Namensfeld („z. B. …“) wechselt bei jedem Antippen und zeigt Namen aus einer Bibliothek von 100 Namen (männlich, weiblich und erfundene Figuren wie Frodo oder Optimus Prime); Namen dürfen bis 14 Zeichen lang sein',
      'Startseite: Unter den Modul-Kreisen (1. und 2. Ausbildungsjahr) stehen keine Zahlen mehr (z. B. 3/3); das Tippen und der Fortschrittsring bleiben',
      'Einstellungen: Eintrag „Lernstatistik“ entfernt',
      'Lernseiten korrigiert: FwDV 8 (Tauchen) und FwDV 10 (tragbare Leitern), praktische Saughöhe einheitlich 7,5 m, LF 10 mit 1.200 l und HLF 20 mit 1.600 l nach DIN 14530-5 bzw. -27, Körperschutzformen 1–3 und Gefahrengruppen I–III nach FwDV 500, Absperrbereich 25 µSv/h, Führungsstufen B/C mit Führungstrupp/-staffel bzw. Führungsgruppe',
      'Altklausur-Quiz korrigiert: IdF „Hochhäuser bis 60 m“ nach MHHR (Feuerwehraufzug und Steigleitungen sowie ein Sicherheitstreppenraum statt zwei Treppenräumen sind richtig), VAk „Was ist ein Realakt?“ mit Erklärung, warum „Hoheitliche Aufgabe“ am ehesten passt',
      'Farbsystem: Skalen (Amber, Neutral, Grün, Rot) und Namen nach Aufgabe (Seite, Fläche, Haupttext, Nebentext, Akzent …) als gemeinsame Schicht im CSS; Kontrast im hellen Design korrigiert (graue Zusatztexte, Datum), alle geprüften Texte erreichen jetzt WCAG AA; Verläufe, Glow und bewusst farbige Kacheln bleiben unverändert',
      'Technik: Höhen folgen der sichtbaren Bildschirmhöhe (dvh, wichtig am Handy mit Adressleiste), Übergänge nur noch für Farben, Rand, Deckkraft und Bewegung statt für alles, ruhigeres Scrollen in Kapitel-Fenster und Tabellen, einheitliche Strichstärke der Symbole (2, große Kachel-Symbole 1,5) und eine benannte Skala für die Ebenen (z-index)',
'Lernseiten neu: Überblick mit Kapitelkarten (Titel, Lesezeit, Vorschau) – auf Handy und Tablet gleich, ohne Umschalter; ein Kapitel öffnet im eigenen Fenster mit „Vorheriges/Nächstes Kapitel“, Stift (Notiz) und Lesezeichen oben; Zurück führt zur Übersicht; am Desktop als Volltext; die Suche springt direkt ins passende Kapitel; Vorlesefunktion entfernt; Tabellen am Handy automatisch lesbar (2 Spalten als Begriff/Erklärung, 3–4 Spalten als Karten, ab 5 Spalten mit fester erster Spalte) und überall im gleichen Stil',
      'Stundenplan springt beim Öffnen zur laufenden bzw. nächsten Einheit: richtige Woche, der aktuelle Tag steht oben (am Wochenende der nächste Montag); die laufende bzw. nächste Einheit leuchtet mit Farbverlauf und Glow und wechselt mit der Uhrzeit',
      'Abkürzungen als Karten zum Aufklappen (Kürzel und Name, Erläuterung per Tipp; auf Tablet 2, auf Desktop 3 Spalten) mit fest stehender Suchleiste, Kategorien-Überschriften und „Suche leeren“',
      'Quiz mit Wiederholung nach Plan (1, 3, 7, 14, 30 Tage) und Filter „Fällig“; Lernkarten mit allen Filtern auf einen Blick',
      'Lernseiten: Text markieren, Merken, Notiz direkt auf der Seite; Bilder und Diagramme per Tipp groß öffnen und zoomen; Inhaltsverzeichnis am Rand auf großen Bildschirmen; Fehler melden',
      'Einstellungen: Suche, Notizen, Lesezeichen, Pomodoro, Abkürzungen, Sicherung erstellen und einspielen, Klausurtermin einstellbar, freiwillige Unterstützung per PayPal',
      'Ersteinrichtung beim ersten Start (Farbschema, Akzentfarbe); Installationshilfe je Gerät und QR-Code zum Teilen der App',
      'Lernkarten: eigene Karten anlegen, Filter „Schwach“ für Karten, die schwer waren oder nicht saßen',
      'Klausur-Timer (30 bis 90 Minuten) auf den Übungsklausuren; Notizen zu Stundenplan-Einträgen; Fehler melden per E-Mail oder GitHub',
      'Suche findet auch bei Tippfehlern und fehlenden Umlauten, Treffer in Gruppen (Seiten, Lernkarten, Notizen); eine Übersicht sammelt die schweren Lernkarten',
      'Schriften liegen jetzt in der App (kein Google-Aufruf mehr), Datenschutz ergänzt, rote Texte im dunklen Design besser lesbar',
      'Android-App: Erinnerung als echte Benachrichtigung, Links öffnen außerhalb der App'
    ]},
    {v:'2.31.0',ts:'2026-10-18T00:00',items:[
      'IdF Münster: Stundenplan Modul 3.5 (KW 44–52, Gruppe 1 & 2) direkt im Übersichtstab – Tageskarten-Ansicht mit Wochennavigation, automatischer Wochenerkennung und Gruppen-Toggle'
    ]},
    {v:'2.30.11',ts:'2026-08-27T00:00',items:[
      'FeuAK · Klausurvorbereitung: Neuer Tab „Klausur 08/2026" – alle 14 Originalfragen des Führungslehrgangs mit Musterlösungen im Akkordeon'
    ]},
    {v:'2.30.10',ts:'2026-08-26T00:00',items:[
      'Klausurfragen FeuAK: Neue Frage 14 – „Planungsziel in der Feuerwehrbedarfsplanung" mit Musterlösung und Kurzantwort (5 Punkte) · Gesamtpunkte 65 → 70'
    ]},
    {v:'2.30.9',ts:'2026-08-26T00:00',items:[
      'FeuAK · Klausurfragen: Seite umbenannt in „Klausurfragen" (war „Klausurfragen – Übungsmodus"), Kachel im Hub bereinigt',
      'FeuAK: Ghost-Views (BWL, Vergabe, Rechnungswesen) aus Fortschritts-Tracking und Verwandten-Chips entfernt – FeuAK-Fortschritt zeigt jetzt korrekte 7 statt 10 Module',
      'HLFS: Thema-Nummern korrigiert – Tunnel→03, Vorbeugl. Brandschutz→04, MANV→05, Zug-/Verbandsführer→06',
      'Simulator: Szenario-Anzahl auf Seite korrigiert (war „4 Szenarien", korrekt: 8)',
      'Startseite: Lernkarten-Zahl aktualisiert (364→319), Abkürzungen-Beschreibung aktualisiert',
      'IBK-Kachel: „Simulator" aus der Beschreibung entfernt (Simulator ist kein Lernmodul im Fortschritt)',
      'HLFS-Hub: Standort „Kassel" in Überschrift ergänzt',
      'CSS: .acc-list als eigene Klasse definiert; tote Regel .ai-tutor-btn{} entfernt'
    ]},
    {v:'2.30.8',ts:'2026-08-25T00:00',items:[
      'Notizen- und Lesezeichen-Button im Header jetzt auf allen Leaf-Pages sichtbar (gleiche Logik wie Gold/Blau-Hintergrund) – u. a. auch auf Klausurfragen-Übungsmodus'
    ]},
    {v:'2.30.6',ts:'2026-08-25T00:00',items:[
      'Navigation: Hintergrundfarbe (Gold/Blau) jetzt konsistent – Leaf-Seiten blau, Hub-Seiten gold',
      'Fix: „Klausurfragen – Übungsmodus" (FeuAK) zeigt nun blauen Hintergrund statt gold',
      'Fix: VAk Klausurvorbereitung-Hub, FeuAK Bedarfsplanungs-Hub und FeuAK Analyse-Hub zeigen nun goldenen Hintergrund'
    ]},
    {v:'2.30.5',ts:'2026-08-25T00:00',items:[
      'Lernkarten FeuAK: 24 Karten aus gelöschten Tabs entfernt – BWL (6 Karten: h06–h08, h29, h30, h57) und Rechnungswesen (14 Karten: h18–h22, h36–h38, h47–h50, h60, h69)',
      'Lernkarten FeuAK · Vergabe: 4 veraltete/redundante Karten gelöscht (h14 Definition, h15 alte Schwellenwerte, h17 Unterschwellen-Verfahren, h45 Grundsätze-Duplikat) – 5 Karten bleiben'
    ]},
    {v:'2.30.4',ts:'2026-08-25T00:00',items:[
      'Lernkarten FeuAK: 11 neue Karten hinzugefügt – KatS-Bedarfsplanung (h106–h108), Stakeholderanalyse (h109–h111), Prospektive Risikoanalyse (h112–h113), Beschaffungspraxis Detail (h114–h116)',
      'Lernkarten FeuAK: 2 Duplikate gelöscht – h23 (Porter-Strategietypen, Duplikat von h80) und h43 (vorläufige Haushaltsführung, Duplikat von h13)'
    ]},
    {v:'2.30.3',ts:'2026-08-25T00:00',items:[
      'Barrierefreiheit: Dekorative SVG-Icons (tile-icon, tile-arr, tc-icon) mit aria-hidden versehen',
      'Barrierefreiheit: Kacheln und Topic-Cards sind jetzt per Tastatur navigierbar (Tab + Enter/Space)',
      'CSS: .glass-card explizit als eigene Klasse definiert',
      'CSS: Textklasse tc-sub vereinheitlicht (war teilweise noch tc-desc)',
      'Layout: Mindestbreite der BVI-Inhalts-Grid von 265 px auf 200 px reduziert (kleinere Tablets)'
    ]},
    {v:'2.30.1',ts:'2026-08-25T00:00',items:[
      'FeuAK Klausurvorbereitung: Grid-Fehler behoben – „Eingrenzung 08/2026 & Münster" und „Altklausur-Training FeuAK" füllen jetzt gemeinsam die volle Breite (cg-3 → cg-2)'
    ]},
    {v:'2.30.0',ts:'2026-08-25T00:00',items:[
      'Startseite: Kachel-Grid auf 2 Spalten umgestellt (war 3/4) und füllt jetzt die volle Bildschirmbreite',
      'Startseite: App-Kachel alleine in voller Breite ganz unten',
      'Startseite: „2. Jahr" als primärer Call-to-Action hervorgehoben – goldener Rahmen, Gold-Glow und goldener Titel',
      'Startseite: „B" im Hero-Logo mit dezenter Schatten-Ebene für mehr Tiefe und Kontrast'
    ]},
    {v:'2.29.48',ts:'2026-08-25T00:00',items:[
      'Global: abschließende hr.sec-div vor </details> entfernt (42 Akkordeons) – kein unnötiger Bodenabstand mehr in offenen Akkordeons'
    ]},
    {v:'2.29.47',ts:'2026-08-25T00:00',items:[
      'Global: hr.sec-div als erstes Element in acc-body entfernt (31 Akkordeons quer durch alle Tabs) – kein Leerraum mehr beim Öffnen'
    ]},
    {v:'2.29.46',ts:'2026-08-25T00:00',items:[
      'GAL UVV (v-gal-uvv): doppelte Zahlen in 5 Akkordeon-Titeln entfernt; hr.sec-div-Leerraum beim Öffnen behoben'
    ]},
    {v:'2.29.45',ts:'2026-08-25T00:00',items:[
      'GAL Wärmebildkamera: doppelte Zahlen in Akkordeon-Titeln entfernt (\"1 · Physikalische Grundlagen\" → \"Physikalische Grundlagen\"); trennende hr.sec-div aus acc-body entfernt (Leerraum beim Öffnen)'
    ]},
    {v:'2.29.44',ts:'2026-08-25T00:00',items:[
      'FeuAK Klausurvorbereitung (v-klausur): Überschrift „Klausur – Training" → „Klausurenvorbereitung"; Klausurfragen-Karte als Gold-Hub-Karte (volle Breite)'
    ]},
    {v:'2.29.43',ts:'2026-08-25T00:00',items:[
      'FeuAK: Tab „Prüfungsleistung Lehrgang Hamburg" komplett gelöscht (Karte + View)'
    ]},
    {v:'2.29.42',ts:'2026-08-25T00:00',items:[
      'FeuAK: Klausuren-Karte zu „Klausurenvorbereitung" umbenannt und als Gold-Hub-Karte (volle Breite) gestaltet'
    ]},
    {v:'2.29.41',ts:'2026-08-25T00:00',items:[
      'VAk Berlin: Tabs Lernzusammenfassung und Übungsklausur gelöscht; neuer Hub-Tab „Klausurvorbereitung" mit Altklausur-Quiz, Fallbearbeitung und Klausurhinweise; Fallbearbeitung-Init-Bug (Comma-Operator) behoben'
    ]},
    {v:'2.29.40',ts:'2026-08-25T00:00',items:[
      'KF_QUIZ: falscher Array-Index in Übersicht und Auswertung behoben (q.id-1 → i); Klick auf Frage 1 öffnet jetzt korrekt Frage 1'
    ]},
    {v:'2.29.39',ts:'2026-08-25T00:00',items:[
      'Klausurfragen und Übungsklausur: nach Fragen-Sprung (goToQ, nextQ, prevQ) wird jetzt automatisch an den Seitenanfang gescrollt'
    ]},
    {v:'2.29.38',ts:'2026-08-25T00:00',items:[
      'Altklausur-Training FeuAK (22 Fragen) und Eingrenzung 08/2026 & Münster (12 Fragen) von Quiz-Struktur auf Akkordeon-Format umgebaut; FEUAK_QUIZ und EINGRENZUNG_QUIZ IIFEs entfernt (~440 Zeilen)'
    ]},
    {v:'2.29.37',ts:'2026-08-25T00:00',items:[
      'Haushalt-Tab ergänzt: Produktorientierter Haushalt (Zeilen/Ansätze/Reste/Ermächtigungsübertragungen), Verpflichtungsermächtigungen (VE) mit Praxis-Beispiel, Deckungsfähigkeit/Übertragbarkeit/Mittelbindung als def-box; Kameralistik + Doppik um Effektivitäts-Abgrenzung erweitert; Broken-Link zum gelöschten Vergabe-Tab in Acc 06 korrigiert'
    ]},
    {v:'2.29.36',ts:'2026-08-25T00:00',items:[
      'VWL-Tab ergänzt: Allokation mit Etymologie-Klammer; Produktivitäts-Hebel in Effizienz-Karte; Statistischer Wert eines Menschenlebens auf 4 Punkte erweitert (Investitionsbasis + Risikominimierung)'
    ]},
    {v:'2.29.35',ts:'2026-08-25T00:00',items:[
      'FeuAK Struktur: Tabs Vergabe, Rechnungswesen und BWL entfernt (Karten + Views gelöscht); „Bedarfsplanung" umbenannt zu „Brandschutzbedarfsplanung"; neuer Hub-Tab „Bedarfsplanung" mit 3 Unterbereichen (Brandschutz-, RD- und KatS-Bedarfsplanung)'
    ]},
    
    {v:'2.29.34',ts:'2026-08-25T00:00',items:[
      'KF_QUIZ: Neue Frage 1 – Besonderheiten & Konsequenzen des Haushaltswesens für FW-Führungskräfte (5 Punkte, 5 Abschnitte: langer Weg/18 Monate, Konsequenzen, FW-Konflikte, Vergaberecht, Steuerungsauftrag); alle bisherigen Fragen 1–12 zu Fragen 2–13 verschoben; Gesamtpunkte 60→65, Fragenanzahl 12→13'
    ]},
    {v:'2.29.33',ts:'2026-08-25T00:00',items:[
      'KF_QUIZ F8–F12: Antworten an Vorlesungsfolien Modul 3.3 angepasst – F8: Kameralistik/Doppik auf PDF-Terminologie (Kassensteuerung, Abgrenzung Effektivität, Generationengerechtigkeit, NSM/NPM); F9: 4 Aspekte neutrales LV nach S.22 (Neutralität, Diskriminierungsverbot, Wettbewerbssicherung, Rechtssicherheit); F10: Fragetext+Antwort auf Weg der Ansatzermittlung (S.32) korrigiert; F11: 4 Kategorien nach S.28 VWL (Indirekte WS, Faktor Zeit, Betriebserhalt, Existenzsicherung); F12: 5 Kategorien KNA nach S.42 VWL (Bewertungstool, Entscheidungshilfe, Wirtschaftlichkeitsnachweis, Makro-Blick, Priorisierung)'
    ]},
    {v:'2.29.32',ts:'2026-08-25T00:00',items:[
      'Neuer Tab „KatS-Bedarfsplanung" in FeuAK: 6 Accordion-Abschnitte auf Basis der Lülf+-Präsentation – Grundlagen & Methodik, Katastrophenkreislauf & Zuständigkeiten, Relevanz der KatSBP, Die 5 Phasen (Brainstorming → Szenarienauswahl → Folgenbetrachtung → Planungsziele → Maßnahmenableitung), Allokation & Modulverschränkung, Abgrenzung KatS vs. Alltag'
    ]},
    {v:'2.29.31',ts:'2026-08-25T00:00',items:[
      'Neuer Tab „RD-Bedarfsplanung" in FeuAK: 7 Accordion-Abschnitte auf Basis der Lülf+-Präsentation – Rahmenbedingungen & Akteure, Zeitabschnitte & Hilfsfrist, IST-Analyse (Hilfsfristerreichung + Problemfeldanalyse), Standortstruktur von Rettungswachen, Vorhaltebemessung (KTW/RTW/NEF), Aktuelle Entwicklungen, Abgrenzung BEP vs. RDBP'
    ]},
    {v:'2.29.30',ts:'2026-08-24T00:00',items:[
      'Klausurfragen F6 + Lernkarte h58: Zweigleisige IST-Analyse RDBP korrigiert – korrekte zwei Analysen: (1) Analyse der Hilfsfristerreichung (Gesamterreichung vs. ab zuständiger Wache → Ressourcenverfügbarkeits- vs. Standortproblem) und (2) Problemfeldanalyse (3 Verursachungsbeiträge: Standortstruktur/Verkehr · Ausrückzeit · Ressourcenverfügbarkeit)'
    ]},
    {v:'2.29.29',ts:'2026-08-24T00:00',items:[
      'Klausurfragen F6: Zweigleisige IST-Analyse RDBP überarbeitet nach Lülf+-Präsentation – Frequenzanalyse (Langzeitentwicklung, räumlich/zeitlich, Tageskategorien, KTW-Angebotsdruck) und Hilfsfristerreichungsanalyse (Gesamterreichung vs. zuständige Wache, Problemfeldanalyse mit 3 Verursachungsbeiträgen)'
    ]},
    {v:'2.29.28',ts:'2026-08-24T00:00',items:[
      'Klausurfragen F7: Phasenmodell KatS-Bedarfsplanung auf 5 Phasen aktualisiert (Brainstorming · Szenarienauswahl · Szenarienfolgenbetrachtung · Planungsziele · Maßnahmenableitung) nach Lülf+/BBK-Leitfaden; Musterlösung und Kurzantwort überarbeitet'
    ]},
    {v:'2.29.27',ts:'2026-08-24T00:00',items:[
      'Klausurfragen: alle 12 Fragen auf einheitlich 5 Punkte (60 Punkte gesamt); Timer entfernt'
    ]},
    {v:'2.29.26',ts:'2026-08-24T00:00',items:[
      'Neuer Tab „Klausurfragen": 12 Fragen aus Dozenten-Fragenliste · 66 Punkte · 90-Min.-Timer · Musterlösung + Kurzantwort; platziert vor den Eingrenzungen im Klausur-Hub'
    ]},
    {v:'2.29.25',ts:'2026-08-24T00:00',items:[
      'AGBF 1998 vs. 2015: Erreichungsgrad korrigiert (95 % → 90 %, nicht 80 % → 90 %); Antwortinhalt auf Basis Lindemann-Folie vollständig überarbeitet – 6 Änderungspunkte (Herleitung entfallen, Einsatzmittel ergänzt, Erreichungsgrad, Szenario, Formulierung Funktionsstärke, mind. 50 Einsätze); betrifft Eingrenzung F12, FeuAK F13 und Lernkarte h52'
    ]},
    {v:'2.29.24',ts:'2026-08-24T00:00',items:[
      'Bedarfsplanung-Tab: 4 neue Akkordeons (07–10) – Drei Ermessensqualitäten, BEP-Aufbau, Erlang-B-Formel, GIS-Standortplanung; irrtümlich eingefügte Lernkarten wieder entfernt'
    ]},
    {v:'2.29.23',ts:'2026-08-24T00:00',items:[
      'Bedarfsplanung-Tab: 5 neue Karten – Drei Ermessensqualitäten, BEP-Aufbau, Erlang-B-Formel, GIS-Standortplanung, Externe Sachverständige'
    ]},
    {v:'2.29.22',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Musterlösung-Button leuchtet gold, Kurzantwort-Button silber'
    ]},
    {v:'2.29.21',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: aktive Buttons in wärmerem Goldton (#D4923A)'
    ]},
    {v:'2.29.20',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Fragen 11+12 (AGBF) an richtiger Position (Doppelkomma-Fix); aktive Buttons leuchten golden'
    ]},
    {v:'2.29.19',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Frage 11 (AGBF 4 Elemente Schutzziel) und Frage 12 (AGBF 1998 vs. 2015) aus Altklausur-Training übernommen, je mit Musterlösung und Kurzantwort'
    ]},
    {v:'2.29.18',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: aktive Buttons farblich hervorgehoben; Neu-beginnen-Button funktioniert jetzt (confirm()-Dialog entfernt)'
    ]},
    {v:'2.29.17',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Musterlösung- und Kurzantwort-Button als Toggle – beliebig ein- und ausblendbar, Wechsel jederzeit möglich'
    ]},
    {v:'2.29.16',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Musterlösung- und Kurzantwort-Button bleiben sichtbar; beide Antworten gleichzeitig anzeigbar'
    ]},
    {v:'2.29.15',ts:'2026-08-24T00:00',items:[
      'Eingrenzungs-Quiz: Kurzantwort-Button neben Musterlösung – kompakte Lernversion aller 10 Antworten'
    ]},
    {v:'2.29.14',ts:'2026-08-21T00:00',items:[
      'Impressum: §5 TMG → §5 DDG aktualisiert'
    ]},
    {v:'2.29.13',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: vereinfacht – nur noch die zwei EU-Schwellenwerte (Liefer-/DL und Bauleistungen), kein Nennen-Sie-außerdem-Block'
    ]},
    {v:'2.29.12',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: Fragetext auf v2.29.8-Stand korrigiert (Bauleistungen (b) explizit, Nennen Sie außerdem-Block erhalten)'
    ]},
    {v:'2.29.11',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: auf v2.29.7-Stand zurückgesetzt (vollständige Antwort mit Schwellenwerten, Zeitpunkt, FW-Fahrzeugen, Angebotsfrist)'
    ]},
    {v:'2.29.10',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: Struktur repariert (Off-by-one-Fehler aus v2.29.9); Frage und Antwort korrekt auf zwei Schwellenwerte reduziert; {id:10} wiederhergestellt'
    ]},
    {v:'2.29.9',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: Frage und Antwort auf die beiden Schwellenwerte reduziert (216.000 € Liefer/DL · 5.404.000 € Bauleistungen)'
    ]},
    {v:'2.29.8',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: Fragetext auf beide Schwellenwerte (Liefer/DL + Bauleistungen) angepasst'
    ]},
    {v:'2.29.7',ts:'2026-08-21T00:00',items:[
      'Eingrenzung F9: Bauleistungen-Schwellenwert 5.404.000 € ergänzt; F10: Fragetext auf „mind. 5 der 9 Grundsätze" geändert, Antwort auf reine Namensliste (keine Stichpunkte)'
    ]},
    {v:'2.29.6',ts:'2026-08-21T00:00',items:[
      'Eingrenzung Fragen 1–9: Antworten gestrafft – Prosa zu Stichpunkten, Frankfurt-Rechenbeispiel (F5) entfernt, F2/F7/F8 redundante Blöcke gekürzt, F3 alle 8 Bereiche kompakt auf Produkte/Beteiligte/Indikator, Folienzahlen beibehalten'
    ]},
    {v:'2.29.5',ts:'2026-08-20T00:00',items:[
      'Beschaffungspraxis Acc 04 + Eingrenzung Frage 10: Wirtschaftlichkeit als eigenständiger Grundsatz #3 wiederhergestellt – korrekt 9 Grundsätze des Vergaberechts in Uhrzeigersinn-Reihenfolge des Kreisdiagramms (Reinstorf 2026)'
    ]},
    {v:'2.29.4',ts:'2026-08-20T23:55',items:[
      'Beschaffungspraxis Acc 04 + Eingrenzung Frage 10: „Gebot der Mittelstandsfreundlichkeit" als eigener Grundsatz ergänzt (§97 Abs. 4 GWB, Losaufteilung); Wirtschaftlichkeit als übergeordnetes Ziel (MEAT) herausgelöst; damit exakt 8 nummerierte Grundsätze'
    ]},
    {v:'2.29.3',ts:'2026-08-20T23:45',items:[
      'Eingrenzung Frage 10: Antwort auf Reinstorf-Slide-Stichpunkte ausgerichtet (§-Verweise, Bieterkommunikation, Verhältnismäßigkeit §124 I GWB, strategische Ziele)',
      'Beschaffungspraxis Acc 04: Vergabegrundsätze auf alle 8 Grundsätze erweitert mit vollständigen Stichpunkten aus der Vorlesung (§7 VgV, §20 VgV, §97, §122, §124, §127, §160 GWB)'
    ]},
    {v:'2.29.2',ts:'2026-08-20T23:30',items:[
      'Eingrenzung-Quiz: 2 neue Fragen (F9: EU-Schwellenwert 216.000 € / Angebotsfristen · F10: 8 Grundsätze Vergaberecht §97 GWB) · Timer 30 → 40 Min.',
      'FeuAK-Altklausur F9: Schwellenwert auf 216.000 € (2026) und Frist auf 35 Tage (§15 VgV) korrigiert',
      'Vergabe-Tab: Oberschwellenwerte auf 2026-Werte aktualisiert (216.000 € / 5.404.000 €)'
    ]},
    {v:'2.29.1',ts:'2026-08-20T23:00',items:[
      '28 Lernkarten entfernt: FeuAK · Beschaffungspraxis (h106–h117, h125–h133), FeuAK · Stakeholder (h118–h121) und FeuAK · Risikoanalyse (h122–h124) – nicht Bestandteil der 17 Groblernziele / Eingrenzung'
    ]},
    {v:'2.29.0',ts:'2026-08-20T22:00',items:[
      'Neue Lernkarte h133: Strategische Handlungsfelder des Warengruppenmanagements (WGM) – 5 Felder: Wettbewerb stärken, Standardisierung, Dienstleistersteuerung, Qualität/Abhängigkeiten, Know-how-Transfer'
    ]},
    {v:'2.28.9',ts:'2026-08-20T21:00',items:[
      'Acc 07 (Beschaffungspraxis): Reinstorf-Badge bei „Ablauf des Vergabeprozesses (offenes Verfahren)" entfernt – Inhalt nicht im Reinstorf-Skript nachweisbar'
    ]},
    {v:'2.28.8',ts:'2026-08-20T20:00',items:[
      'Acc 03 (Beschaffungspraxis): Digitaler Marktplatz Deutschland & KI-Einsatz + Strategische Aspekte WGM aus Acc 10 hierher verschoben',
      'Reinstorf-Badges im Inneren von Acc 03 und Acc 04 entfernt – Badge verbleibt nur in der Akkordeon-Überschrift (Summary)'
    ]},
    {v:'2.28.7',ts:'2026-08-20T19:00',items:[
      'Reinstorf-2026-Badge auf Akkordeon-Ebene: Acc 03 (Vergaberecht: Grundlagen & Schwellenwerte) und Acc 04 (Vergabegrundsätze & Verfahrensarten) im Tab Beschaffungspraxis – beide vollständig aus Reinstorf 2026'
    ]},
    {v:'2.28.6',ts:'2026-08-20T18:00',items:[
      '12 weitere Reinstorf-2026-Badges (gold) im Tab Beschaffungspraxis: Definition Vergaberecht, Zweiteilung, EU-Schwellenwerte, Ausnahmen (Acc 03), Grundsätze, Verfahrensarten, Angebotswertung (Acc 04), Markterkundung (Acc 05), Bestandteile VU, Ablauf Vergabeprozess, Zuschlagskriterien (Acc 07), Strategische Aspekte WGM (Acc 10)'
    ]},
    {v:'2.28.5',ts:'2026-08-20T17:00',items:[
      '3 neue Lernkarten: h130 (Herausforderungen + Anwendungsbereich §98–105 GWB), h131 (Teilnehmer am Vergabeverfahren / Bietergemeinschaft §43 VgV), h132 (Digitaler Marktplatz Deutschland / KI-Einsatz)',
      'Reinstorf-2026-Badge (golden) an 4 Acc-Sub-Überschriften im Tab Beschaffungspraxis ergänzt'
    ]},
    {v:'2.28.4',ts:'2026-08-20T16:00',items:[
      'Acc 03: Aktuelle Herausforderungen öffentlicher Vergabe (Bietermangel, EU-Rechnungshof 2023 „verlorenes Jahrzehnt") ergänzt',
      'Acc 03: Anwendungsbereich des Vergaberechts §98–105 GWB (persönlich + sachlich) ergänzt',
      'Acc 03: HmbTG – Hamburger Transparenzgesetz als Hinweis ergänzt',
      'Acc 04: Teilnehmer am Vergabeverfahren (Bewerber, Bieter, Bietergemeinschaft §43 VgV, Unterauftragnehmer) ergänzt',
      'Acc 10: Digitaler Marktplatz Deutschland & KI-Einsatz bei Vergaben (Koalitionsvertrag 2025, M150/M151, KI-Anwendungsfälle) ergänzt'
    ]},
    {v:'2.28.3',ts:'2026-08-20T15:00',items:[
      '5 neue Lernkarten FeuAK · Beschaffungspraxis: h125 (12 Schadensbilder), h126 (Ziele + Zivilschutzausstattung Bund), h127 (Sonderausstattung + Wattiefe-Faktoren), h128 (Vergabeprozess-Ablauf 7 Schritte + Vertragsstrafe), h129 (Inbetriebnahme + Presse + Projektdokumentation + Mängelabarbeitung)',
      'h109 aktualisiert: §3 VgV Zeitpunkt (Tag der Auftragsbekanntmachung) + Optionen/Verlängerungen einbeziehen'
    ]},
    {v:'2.28.2',ts:'2026-08-20T14:00',items:[
      'FeuAK-Tab Beschaffungspraxis: 9 Inhaltslücken aus Demtröder-PDF geschlossen',
      'Acc 01: Schäden-Liste auf 12 laufzeitrelevante Schadensbilder erweitert',
      'Acc 02: Ziele eines Fahrzeugbeschaffungsprogramms und Exkurs Zivilschutzausstattung des Bundes ergänzt',
      'Acc 03: §3-VgV-Zeitpunkt (Tag der Auftragsbekanntmachung) und Einbeziehung von Optionen ergänzt',
      'Acc 05: Besondere Ausstattungsmerkmale, technische Faktoren Wattiefe und Bedarfsplan als Förderbedingung ergänzt',
      'Acc 07: Vergabeprozess-Ablauf (7 Schritte) und Vertragsstrafe/Garantieansprüche ergänzt',
      'Acc 09: Vertragsstrafe, Garantieansprüche und Reklamationsbeseitigung ergänzt',
      'Acc 10: Presse- und Medienarbeit, abschließende Projektdokumentation und nachträgliche Mängelabarbeitung ergänzt'
    ]},
    {v:'2.28.1',ts:'2026-08-20T13:00',items:[
      '19 neue Lernkarten: FeuAK Beschaffungspraxis (h106–h117), Stakeholder-Analyse (h118–h121), Risikoanalyse (h122–h124)',
      'h44 aktualisiert: EU-Schwellenwerte auf Stand 1.1.2026 (216.000 € statt 221.000 €, Bau 5.404.000 €)'
    ]},
    {v:'2.28.0',ts:'2026-08-20T12:00',items:[
      'Neuer FeuAK-Tab „Beschaffungspraxis": 10 Akkordeons zu Ausgangslage, Bedarfsermittlung & Investitionsplanung, Vergaberecht & Schwellenwerte, Vergabegrundsätze & Verfahrensarten, Vorplanung & Markterkundung, Haushaltsmittel & Lebenszykluskosten, Vergabeunterlagen & Leistungsbeschreibung, Losbildung & Blockbeschaffung, Abnahme sowie Inbetriebnahme & Verwertung',
      'Inhalte aus Demtröder 2026 (Fahrzeugbeschaffung HLF 20, FeuAK HH) und Reinstorf 2026 (Grundlagenwissen öffentliche Beschaffungen)'
    ]},
    {v:'2.27.1',ts:'2026-08-19T17:00',items:[
      'Eingrenzung F3: Alle 8 Feuerwehr-Bereiche vollständig ausgearbeitet (je Produkte, Beteiligte, Indikatoren) – Ausbildung, Fortbildung, Vorbeugender Brandschutz, Rettungsdienst, Technik, IuK neu hinzugefügt'
    ]},
    {v:'2.27.0',ts:'2026-08-19T16:00',items:[
      'Eingrenzung: Alle 8 Fragen durch echte Dozenten-Klausurfragen aus den offiziellen Klausurhinweisen ersetzt (50 Pkt, zuvor 44 Pkt)',
      'Antworten aus Musterlösung + Vorlesungsfolien (Haushalt, BSC/QM, Bedarfsplanung, Vergabe, Risikoanalyse) synthetisiert',
      'Punktzahl-Anzeige im Klausuren-Hub und in der Eingrenzungsseite auf 50 Pkt korrigiert'
    ]},
    {v:'2.26.0',ts:'2026-08-19T14:00',items:[
      'Neu: Tab „Eingrenzung – Klausur 08/2026 & Münster 2026" mit 8 Dozenten-Klausurfragen und 30-Min.-Timer (EINGRENZUNG_QUIZ)',
      'Neu: Hub-Tab „Klausuren" fasst Eingrenzung, Altklausur-Training und Prüfungsleistung in einer Übersicht zusammen',
      'FeuAK-Übersicht: Zwei Einzelkacheln durch eine „Klausuren"-Kachel ersetzt'
    ]},
    {v:'2.25.0',ts:'2026-08-19T12:00',items:[
      'QM: Vergleichsabschnitt „Personal-Ist-Faktor vs. Ist-Stellenfaktor" ergänzt – mit Kernunterschied, Visualisierung und Realdaten FW Frankfurt 2023'
    ]},
    {v:'2.24.1',ts:'2026-08-18T20:00',items:[
      'Planspiel MANV: Bugfix – fehlende </details>-Tags im OLRD-Akkordeon ergänzt, nachfolgende Akkordeons wieder eigenständig'
    ]},
    {v:'2.24.0',ts:'2026-08-18T19:30',items:[
      'Planspiel MANV: OLRD-Akkordeon von acc09 auf acc05 verschoben – direkt nach Oberste Führungsebene',
      'Reihenfolge: MANV-Grundlagen→06, HEIKAT→07, Organigramm→08, Lagekarte→09'
    ]},
    {v:'2.23.0',ts:'2026-08-18T19:00',items:[
      'Planspiel MANV: Acc09 „OLRD – Rolle im Planspiel" neu ergänzt',
      'Ablauf Berliner Platz: 4 Schritte kommissarische Übernahme → Lagemeldung → Abschnitte → Transport',
      'OLRD (grün) vs. LNA (blau): Aufgabenteilung auf einen Blick',
      'Hinweiskarte: Schnittstelle Verbandsführer ↔ OLRD – wer spricht wen für was an'
    ]},
    {v:'2.22.0',ts:'2026-08-18T18:00',items:[
      'Dezentes Farbschema auf der gesamten Lernwebsite – semantisch begründete Farbakzente in allen Haupttabs',
      'Neue CSS-Klasse ic-r (rot) für Gefahren/Verbote – löst alle inline-Styles ab',
      'HLFS Führungsvorgang: AUTO-Regel (blau) vs. EIMER-Regel (amber), Gefahr (rot) vs. Entschluss (grün)',
      'IBK Stress: JD-R-Modell – Job Demands (rot) vs. Job Resources (grün); BGM-Gesundheitsdimensionen + Salutogenese-Trias eingefärbt',
      'FeuAK VWL: Skaleneffekte Vorteile (grün) / Nachteile (amber)',
      'Bedarfsplanung: Szenarien + Externe Sachverständige – dafür (grün) vs. dagegen (amber)',
      'IdF Auftragstaktik: Vorteile (grün) / Voraussetzungen (blau)'
    ]},
    {v:'2.21.0',ts:'2026-08-18T16:30',items:[
      'FeuAK QM: Farbakzente auf nötigstes reduziert – nur noch 5 semantisch begründete Stellen',
      'Acc04 Vorläufige HHF: Erlaubt (grün) / Nicht erlaubt (rot) – weiterhin eingefärbt',
      'Acc05 NSM: Kameralistik (amber) vs. Doppik (blau) – direkter Systemvergleich',
      'Acc09 PDCA: P=blau, D=grün, C=amber – Phasenzyklus farblich markiert',
      'Acc10 Stakeholder-Matrix: 4 Quadranten (grün/amber/blau/neutral) + Risikoanalyse (grün/blau/amber/rot)',
      'Acc13 24h-Dienst: Vorteile (grün) / Nachteile (amber); 2WA (blau) / 3WA (amber) / 4WA (grün)'
    ]},
    {v:'2.20.9',ts:'2026-08-18T15:30',items:[
      'FeuAK QM: Farbliche Akzente im gesamten QM-Tab – semantische Farb-Varianten (blau/grün/amber) für info-card, def-box und step-letter',
      'Acc01: Einnahmequellen-Schritte (2=blau, 3=amber, 4=rot), Finanzausgleich-Cards (blau/grün), Haushaltsgrundsätze (blau/amber/grün)',
      'Acc03: VE-Schritte (blau/amber/grün), Deckungsfähigkeit/Übertragbarkeit/Mittelbindung, IP/Stellenplan',
      'Acc04: Erlaubt (grün) / Nicht erlaubt (rot)',
      'Acc05: NSM 8 Elemente abwechselnd blau/grün/amber, 3-Säulen (blau/amber/grün), Kameralistik (amber) vs. Doppik (blau)',
      'Acc06: KLR 3 Ebenen – Kostenträger (grün), Kostenstelle (blau), Kostenart (amber)',
      'Acc07: Internes (blau) / Externes Controlling (grün), Absolut (amber) / Verhältnis-KZ (blau)',
      'Acc08: Primär (blau) / Sekundärprozesse (amber), Teilprozess-Cards',
      'Acc09: PDCA P=blau, D=grün, C=amber, A=gold; Fehlerkultur def-box grün; BEP-Cards, Schutzziele/Mengenbezugsgrößen/Maßnahmen',
      'Acc10: Stakeholder-Matrix 4 Quadranten (grün/amber/blau/neutral), Risikoanalyse (grün/blau/amber/rot)',
      'Acc11: Produkte (blau), Qualitätsansprüche (grün), Stakeholder (amber) durch alle BF-Bereiche',
      'Acc12: Personal-Ist (blau), Soll (amber), Ist-Stellen (grün), Mehrarbeit-Cards, Transferleistungen/Funktionsunterschreitungen',
      'Acc13: Anforderungen (blau) / Voraussetzungen (grün), EU-RL (amber) / ArbSchG (blau), 24h Vorteile (grün) / Nachteile (amber), 2WA (blau) / 3WA (amber) / 4WA (grün)'
    ]},
    {v:'2.20.8',ts:'2026-08-18T14:00',items:[
      'FeuAK QM: Lückenanalyse – fehlende Inhalte aus Jackel-Skript nachgetragen',
      'QM Acc01: Haushaltsgrundsätze (Wirtschaftlichkeit & Sparsamkeit, Vollständigkeit & Einheit, Jährlichkeit, Gesamtdeckungsprinzip) und Schlüsselzuweisungen ergänzt',
      'QM Acc07: Kennzahlensystematik (Absolut- vs. Verhältnis-Kennzahlen) vor Benchmarking eingefügt',
      'QM Acc09: Fehlerkultur als QM-Element und BEP-Inhalte Funktionssoll & Standortplanung ergänzt',
      'QM Acc13: Schichtfolge-Beispiele inkl. Bremer Modell (D–N–F–F–F), 2/3-Wechsel und RD-taugliche Varianten hinzugefügt'
    ]},
    {v:'2.20.7',ts:'2026-08-18T12:00',items:[
      'FeuAK: Neuer Tab „Qualitätsmanagement" (Skript Jackel, FL 3.3b) – 13 Akkordeons: Einnahmequellen/Finanzausgleich, Haushaltsstruktur, Haushaltspläne, Vorläufige Haushaltsführung, NSM & 3-Säulen-Modell, KLR, Controlling, Prozessmanagement, QM & Brandschutzbedarfsplan, Management-Instrumente, QM nach BF-Bereichen, Personalfaktor, Dienstplanung & Dienstplanmodelle',
      'FeuAK: Haushalt-Tab bereinigt – alle Jackel-markierten Inhalte (Acc 03–05, 08–09, 11–14) ausgelagert in neuen QM-Tab, restliche Akkordeons neu nummeriert'
    ]},
    {v:'2.20.6',ts:'2026-08-18T10:30',items:[
      'FeuAK: Tab „Projektmanagement / Strategisches Management" umbenannt in „Strategisches Management" (Topic-Card, Seitenüberschrift, Kategorie-Map)'
    ]},
    {v:'2.20.5',ts:'2026-08-18T10:00',items:[
      'FeuAK: Neuer Tab Planspiel MANV – Berliner Platz (Polizeilage / LebEL)',
      'Planspiel: 8 Akkordeons – Fahrzeugführer, Zugführer, Verbandsführer, Oberste Führungsebene (Direktionsdienst), MANV-Grundlagen & Sichtung, HEIKAT & Besonderheiten, Organigramm (SVG), Lagekarte (SVG)',
      'Planspiel: Organigramm nach handgezeichnetem Skript (EL-Raute + Lts-Kreis = TEL, EA Tech./Betreuung/med.Rettung, BR, Patientenablagen, Transportorganisation)',
      'Planspiel: Lagekarte mit Drei-Zonen-Konzept (Rot/Gelb/Grün), PA, BHP, LEBEL, Bereitstellungsraum, Zu-/Abfahrt'
    ]},
    {v:'2.20.4',ts:'2026-08-17T22:00',items:[
      'HLFS Kassel MANV & OLRD: 2 neue Akkordeons – OLRD Aufgaben/Qualifikation/Fahrzeug (Fg 21 HLFS, § 18 DVO HRDG) und Med. EL LNA+OLRD Abgrenzung+Alarmierung (§ 8 HRDG)',
      'HLFS MANV: Akkordeon 02 Führungsstruktur erweitert (med. EL, Fachautonomie LNA, kommissarische Übernahme)',
      'HLFS MANV: Akkordeon 03 um Verletztensammelstelle (VSt) ergänzt, Schnittstelle FW→RD an der PA präzisiert',
      'HLFS MANV: Page-Lead und MANV-Definition um Hessische Stufenfolge (MANV-0→1000) ergänzt'
    ]},
    {v:'2.20.3',ts:'2026-08-17T20:00',items:[
      'FeuAK Haushalt: 11 neue Lernkarten h95–h105 (Finanzausgleich, Produktpyramide, VE/IP/Stellenplan, investiv/konsumtiv, Mehrausgaben, Kameralistik vs. Doppik, Controlling, Prozessmanagement, PDCA/BEP, Markterkundung, Rechnungsprüfung)',
      'Lernkartenzahl auf 364 aktualisiert'
    ]},
    {v:'2.20.2',ts:'2026-08-17T18:00',items:[
      'FeuAK Haushalt: 4 Akkordeon-Paare zusammengefasst – 20 → 16 Akkordeons',
      'FeuAK Haushalt: Akk 03+04 → „Einnahmequellen & Finanzausgleich"; Akk 06+07 → „Haushaltspläne – Aufbau, VE, IP & Stellenplan"',
      'FeuAK Haushalt: Akk 17+18 → „Beschaffung: Markterkundung & Vertragsmanagement"; Akk 19+20 → „Kontrolle & Rechnungsprüfung"'
    ]},
    {v:'2.20.1',ts:'2026-08-17T16:00',items:[
      'FeuAK Haushalt: Reihenfolge aller 20 Akkordeons nach Jackel-Skript-Struktur korrigiert (Teil 1 Grundlagen → Teil 2 NSM → Teil 3 Beschaffung & Kontrolle)',
      'FeuAK Haushalt: Dopplung 3-Säulen-Modell entfernt (war in Akk 05 und 11 – jetzt nur in 11)',
      'FeuAK Haushalt: Dopplung Produktpyramide entfernt (stand zweimal in Akk 14 – zu einer Sektion zusammengeführt)'
    ]},
    {v:'2.20.0',ts:'2026-08-17T14:00',items:[
      'FeuAK Haushalt: 5 neue Akkordeons aus Skript Jackel (FL 3.3b, FeuAK Hamburg 08/2026) – Finanzausgleich, Investitionsprogramm & Stellenplan, Controlling, Prozessmanagement, QM & Brandschutzbedarfsplan',
      'FeuAK Haushalt: 5 Badges „nicht im Skript" → „Skript Jackel" (Akk 11–15 alle im Jackel-Skript enthalten)',
      'FeuAK Haushalt: Akk 05 (Doppik) um Aufwand/Ertrag-Definition ergänzt; Akk 09 (Budgetierung) um Restmittel-Übertragbarkeit und „Todsünden"; Akk 11 (NSM) alle 8 Elemente als Cards; Akk 12 (KLR) Gebührenbezug und Steuerungsebenen; Akk 14 (Haushaltsstruktur) Produktpyramide 5 Ebenen + 2 Steuerungsebenen; Akk 15 (Vorläufige HF) 18-Monate-Prozess und Praxis-Hinweis',
      'FeuAK Haushalt: Untertitel auf Skript Jackel als Quelle aktualisiert'
    ]},
    {v:'2.19.8',ts:'2026-08-11T19:00',items:[
      'PM Entscheidungstheorie: Ambiguitätstoleranz nach Skript 1 S. 22 ergänzt (hint-Box nach 3 Rationalitäten)',
      'Lernkarte h85: Frage und Antwort um Ambiguitätstoleranz erweitert'
    ]},
    {v:'2.19.7',ts:'2026-08-11T18:00',items:[
      'Lernkarten PM h78–h94: Reihenfolge an Abschnittsfolge angepasst (Abschnitt 01→02→03→04→05→10) und IDs entsprechend neu nummeriert'
    ]},
    {v:'2.19.6',ts:'2026-08-11T17:00',items:[
      'PM-Tab: Reihenfolge an PDF-Gliederung angepasst – PDF 1 (Kap.1–3) komplett vor PDF 2 (Stakeholder)',
      'PM-Tab: Neue Nummerierung 01–10 (Strategie→Entscheidung→Mintzberg→VUKA→Stakeholder→Prozess→QM→Controlling→Risiko)'
    ]},
    {v:'2.19.5',ts:'2026-08-11T16:00',items:[
      'PM-Tab: Section 06 und 09 getauscht – Reihenfolge entspricht jetzt Skript-Gliederung (Kap. 1 → 2 → 3)'
    ]},
    {v:'2.19.4',ts:'2026-08-11T15:00',items:[
      'Lernkarten: 17 neue PM-Karten h78–h94 (VUKA, BANI, Entscheidungstheorie, Mintzberg, Clausewitz, Gälweiler, Strategiehierarchie, 8 Handlungsfelder, Risikoanalyse, Wohlfahrtsdreieck, Prosumption, Porter)'
    ]},
    {v:'2.19.3',ts:'2026-08-11T14:00',items:[
      'PM-Tab: Prolog-Inhalte (Wohlfahrtsdreieck + SVG-Grafik, Prosumption, 4 Dienstleistungstypen) in Section 01 integriert',
      'PM-Tab: Section 11 entfernt (Inhalte in Section 01 zusammengeführt)',
      'PM-Tab: Section 01 – Titel zu „Grundlagen: Feuerwehr & Strategisches Management" aktualisiert'
    ]},
    {v:'2.19.2',ts:'2026-08-11T13:30',items:[
      'PM-Tab: 3 Strategietypen in Section 01 integriert, Nummerierung 02–11 angepasst'
    ]},
    {v:'2.19.1',ts:'2026-08-11T13:00',items:[
      'PM-Tab: Gälweiler-Definition + „Strat. Mgmt. ohne Markt" in Section 10 ergänzt',
      'PM-Tab: Neue Section 12 – Wohlfahrtsdreieck, Prosumption & 4 Dienstleistungstypen',
      'PM-Tab: Section 08 – 6 Entscheidungsarten der Unternehmensleitung ergänzt',
      'PM-Tab: Section 03 – Stakeholder- vs. Shareholder-Ansatz Vollvergleich (4 Kriterien)'
    ]},
    {v:'2.19.0',ts:'2026-08-11T12:00',items:[
      'PM-Tab: 5 neue Sektionen aus FeuAK-Skripten (VUKA/BANI, Entscheidungstheorie, Mintzberg, Strategiehierarchie, Prospektive Risikoanalyse)',
      'PM-Tab: Stakeholderanalyse erweitert (Etzioni-Bindungsgründe, Macht/Legitimität/Dringlichkeit, 7 Stakeholder-Typen, Einfluss-Interessen-Matrix, 10 Schlüsselfragen)'
    ]},
    {v:'2.18.17',ts:'2026-08-10T15:00',items:[
      'VWL-Tab: Hinweisboxen in Section 08 & 09 lesbar gemacht (inline border-color-Override entfernt, Standard-Hint-Styling)'
    ]},
    {v:'2.18.16',ts:'2026-08-10T14:00',items:[
      'VWL-Tab: Titel bleibt „VWL"; Eyebrow auf „FeuAK Hamburg · Volkswirtschaftslehre" aktualisiert',
      'Neue Section 08: Marktformen &amp; Preis-Mengen-Diagramm (Polypol/Oligopol/Monopol, Kurvenverschiebungen, Altklausur F15/F16) – als „nicht in Modul 3.3" gekennzeichnet',
      'Neue Section 09: Bruttoinlandsprodukt (BIP) mit Definition, 3 Berechnungsseiten, 6 Kritikpunkten, Alternativen (Altklausur F17) – als „nicht in Modul 3.3" gekennzeichnet',
      'Flashcard h27 (Konjunkturzyklus) gelöscht',
      'Lernkarten gesamt: 320 → 319'
    ]},
    {v:'2.18.15',ts:'2026-08-10T13:00',items:[
      'FeuAK VWL-Tab komplett neu nach Modul 3.3 der Vorlesung: 7 Kapitel – Swiftonomics/Multiplikatoreffekt, VWL-Grundlagen &amp; VWL vs. BWL, Knappheit &amp; Opportunitätskosten, Marktversagen &amp; Staatsrolle, Feuerwehr im Wirtschaftskreislauf, Ressourcenmanagement &amp; Effizienz (TCO, Skaleneffekte, Personalökonomie), Kosten-Nutzen-Analysen (KNA, Grenzkosten der Sicherheit)',
      'Vorherige Inhalte (10 VWL-Regeln, Marktformen, BIP, Gütertabelle) durch vorlesungsrelevante Inhalte ersetzt',
      '19 VWL-Lernkarten vollständig überarbeitet: 11 bestehende Karten aktualisiert/neu bespielt (h01–h05, h28, h46, h51, h54, h67, h68), 8 neue Karten h70–h77 (Positive Externalität, Ressourcenmanagement, Effizienz vs. Effektivität, Personalökonomie, Skaleneffekte, TCO, KNA, Grenzkosten)',
      'Lernkarten gesamt: 312 → 320'
    ]},
    {v:'2.18.13',ts:'2026-08-07T16:00',items:[
      '9 neue FeuAK-Lernkarten h61–h69: Haushaltsgrundsätze, QM ISO 9001, Produkte/Kunden/Merkmale FW, BSC-Kennzahlen, Strategische Personalplanung, Beschaffungsalternativen HLF 20, VWL Nachfrageeffekte, VWL Angebotseffekte, Bilanz HGB vollständig',
      'Lernkarten gesamt: 303 → 312',
      'Bug-Fix: Kartenzähler in Lernkarten-Tab, Startseite und Onboarding auf 312 korrigiert (war fälschlicherweise noch 284)'
    ]},
    {v:'2.18.12',ts:'2026-08-07T15:00',items:[
      'FeuAK Altklausur: Punktzahl je Frage neu bewertet – differenzierte Verteilung nach Umfang und Komplexität (3–7 Punkte statt pauschal 5); Gesamtpunktzahl bleibt 110'
    ]},
    {v:'2.18.11',ts:'2026-08-07T14:00',items:[
      'FeuAK Altklausur-Training: komplett neu gestaltet – identisches Design wie VAk-Übungsklausur mit 90-Min.-Timer, Startbildschirm mit Frageübersicht, Selbstbewertung, Dot-Navigation und gespeichertem Fortschritt'
    ]},
    {v:'2.18.10',ts:'2026-08-07T13:00',items:[
      'FeuAK Altklausur: Design des Textfeldes identisch mit den VAk-Übungsfällen',
      'FeuAK Altklausur: Textfeld bleibt beim Vor-/Zurück-Blättern erhalten (kein automatisches Löschen)',
      'FeuAK Übersicht: „Altklausur-Training" steht jetzt an erster Stelle'
    ]},
    {v:'2.18.9',ts:'2026-08-07T12:00',items:[
      'FeuAK Altklausur-Training: Freitext-Eingabefeld – eigene Antwort formulieren, bevor die Musterlösung aufgedeckt wird'
    ]},
    {v:'2.18.8',ts:'2026-08-07T11:00',items:[
      'Neuer Tab: FeuAK Altklausur-Training – 22 Essay-Fragen aus Gedächtnisprotokollen Hamburg Aug 2025 &amp; Feb 2026 mit vollständigen Musterlösungen',
      '19 neue FeuAK-Lernkarten h42–h60: BSC, Haushalt, Vergabe, AGBF 1998/2015, KTW-Kurve, IST-Analysen RD, Doppik, Rechnungswesen',
      'Lernkarten gesamt: 284 → 303'
    ]},
    {v:'2.18.5',ts:'2026-08-06T17:30',items:[
      'Fallbearbeitung: Realakt/VA-Kohärenz in Fall 3 (Tiefgarage) und Fall 6 (Schornsteinbrand) korrigiert – Schritt 2 differenziert nun klar zwischen Realakt (VwVfG entfällt) und VA (§28/§37/§41 VwVfG)',
      'Lernkarten-Kachel: Kartenanzahl auf 284 aktualisiert (war: 271)'
    ]},
    {v:'2.18.4',ts:'2026-08-06T16:00',items:[
      'Lernkarten: Zurück-Button zum Blättern durch bereits beantwortete Karten (Rückblick-Modus)',
      'Lernkarten: Karten mit ⭐ markieren – markierte Karten erscheinen im eigenen „Markiert"-Tab',
      'Lernkarten: Fokus-Modus, Schwer-zuerst und Zeitplan entfernt (vereinfacht)',
      'VAk Berlin: 13 neue Karteikarten zum 9-Punkte-Schema (Fallbearbeitung, §§ BHKG/OBG NRW) – v50–v62',
      'Lernkarten: Gesamtanzahl 271 → 284 Karten'
    ]},
    {v:'2.18.3',ts:'2026-08-06T15:00',items:[
      'Fallbearbeitung: Anzahl der Übungsfälle in Tab-Untertitel und Seitenbeschreibung auf 6 korrigiert (war: 4)'
    ]},
    {v:'2.18.1',ts:'2026-08-06T13:30',items:[
      'Fallbearbeitung Schema: neue §§ in Schematext eingebaut (Steps 1/2/4/5/9) – OBG, Art. 28 Abs.2 GG, Art. 19 Abs.4 GG, §34 Abs.2 BHKG u.a.'
    ]},
    {v:'2.18.0',ts:'2026-08-06T12:00',items:[
      'Fallbearbeitung: 8-Punkte-Schema auf 9-Punkte-Schema erweitert – neuer Punkt 9 „Dokumentation u. Sicherung" (§34 Abs.1 BHKG · §24 Abs.1 Nr.2 OBG · §43 Nr.1 PolG NRW)',
      'Alle Steps: Gesetzesfelder aus Handnotizen ergänzt (§§ OBG, Art. 19 GG, Art. 28 Abs.2 GG u.a.)',
      'Alle 6 Fallbeispiele: 9. Musterlösung (Dokumentation u. Sicherung) hinzugefügt'
    ]},
    {v:'2.17.9',ts:'2026-08-06T11:30',items:[
      'Fall 5 – Betonhalle: Absperrung korrigiert von Realakt zu Allgemeinverfügung (§35 S.2 VwVfG) – Steps 1, 2, 4 und 8 angepasst'
    ]},
    {v:'2.17.8',ts:'2026-08-06T11:10',items:[
      'Fallbearbeitung Step 1 – Ermächtigungsgrundlage: §48 BHKG korrigiert zu „Einschränkung von Grundrechten" (statt Kostenersatz)'
    ]},
    {v:'2.17.7',ts:'2026-08-05T12:30',items:[
      'Fallbearbeitung Schema-Karte: Gesetzestext wird bei Überlänge mit Ellipsis (…) abgeschnitten – alle 8 Karten einheitlich einzeilig'
    ]},
    {v:'2.17.6',ts:'2026-08-05T12:00',items:[
      'VAk Einsatzrecht Karteikarte & Übungsklausur Frage 6: Grundrechtsliste auf §48 BHKG aktualisiert (Art. 2 Abs. 1 i.V.m. Art. 1 Abs. 1, Art. 2 Abs. 2 S. 1, Art. 2 Abs. 2 S. 2, Art. 13 GG); Art. 11 GG und Art. 14 GG entfernt'
    ]},
    {v:'2.17.5',ts:'2026-08-05T11:30',items:[
      'Quiz: Wahlrechtsgrundsätze-Erklärung um Öffentlichkeit ergänzt (BVerfG aus Art. 38 i.V.m. Art. 20 GG)'
    ]},
    {v:'2.17.4',ts:'2026-08-05T11:10',items:[
      'Quiz: Leertaste statt Enter zum Weiterblättern im Lernmodus'
    ]},
    {v:'2.17.3',ts:'2026-08-05T10:45',items:[
      'Fallbearbeitung Step 4 – Störerauswahl: Verhaltensstörer (§17 OBG), Zustandsstörer (§18 OBG), Nichtstörer (§19 OBG)',
      'Fallbearbeitung Step 8 – Kosten: nur §45 BHKG (Entschädigung Nichtstörer); §48 BHKG und §839 BGB entfernt'
    ]},
    {v:'2.17.2',ts:'2026-08-05T10:15',items:[
      'Fallbearbeitung Fall 6 (Schornsteinbrand) Step 2: §41 VwVfG → §44 Abs.2 BHKG i.V.m. Art. 13 Abs.7 GG'
    ]},
    {v:'2.17.1',ts:'2026-08-05T09:45',items:[
      'Quiz: Ergänzungs-Notizen für einzelne Fragen – erste Notiz bei Art.-13-GG-Frage (Wohnmobile-Ausnahme)'
    ]},
    {v:'2.17.0',ts:'2026-08-05T09:00',items:[
      'VAk: Neue Seite „Übungsklausur – Einsatzrecht" – 9 Fragen, 43 Punkte, §27 BHKG, VA, Gefahrenbegriff, Grundrechte; 60-Min.-Timer und Selbstbewertung',
      'VAk: Tab-Reihenfolge neu – Klausurhinweise, Fallbearbeitung, Übungsklausur direkt nach Altklausur-Quiz; Lernzusammenfassung ans Ende'
    ]},
    {v:'2.16.0',ts:'2026-08-04T11:46',items:[
      'Performance: Navigation von O(90) auf O(2) DOM-Operationen beschleunigt – deutlich flüssiger auf Tablet',
      'Fortschritt: Modul-Kacheln zeigen animierte Mini-Fortschrittsbalken statt einfachem Text',
      'Quiz: 84 Fragen in externe Datei (quiz-data.json) ausgelagert – app.js ~80 KB kleiner, Quiz lädt beim ersten Öffnen aus SW-Cache',
      'Quiz-Statistiken: Neuer Tab mit Session-Verlauf, Klausur-Historie und Kategorie-Auswertung',
    ]},
    {v:'2.15.5',ts:'2026-08-03T13:08',items:[
      'CSS: Hyperlinks in Akkordion-Inhalten jetzt in Gold statt Browser-Blau – bessere Lesbarkeit auf dunklem Hintergrund'
    ]},
    {v:'2.15.4',ts:'2026-08-03T12:58',items:[
      'VAk Rettungsdienstrecht: Akkordion-Nummern korrigiert (01–10)'
    ]},
    {v:'2.15.3',ts:'2026-08-03T12:53',items:[
      'VAk Rettungsdienstrecht: UI an andere Tabs angeglichen – info-card statt Goldrahmen-Kästchen, class="dt"-Tabellen, Normenhierarchie und Quellen ins Akkordion (00/09)'
    ]},
    {v:'2.15.2',ts:'2026-08-03T12:30',items:[
      'VAk Rettungsdienstrecht: KTW-B → RTW-B (Notfalltransport) korrigiert; vollständige Besetzung nach § 9 Abs. 2 Buchst. b + § 23 RDG ergänzt (Fahrer RettSan, Betreuung RettSan ≥ 2 J./2.000 h + ÄLRD-Zusatzqual.)'
    ]},
    {v:'2.15.1',ts:'2026-08-03T12:23',items:[
      'VAk Rettungsdienstrecht: RTW-B (Notfalltransport) in Fahrzeugtabelle ergänzt; Weiterführende Quellen mit klickbaren Hyperlinks versehen'
    ]},
    {v:'2.15.0',ts:'2026-08-03T12:12',items:[
      'VAk: Neue Seite „Rettungsdienstrecht" – Normenhierarchie, RDG Berlin (§§ 5/5a/8/9/23), Fahrzeugbesetzung (§ 9 + RDAbweichV 2025), Trägermodelle (Hoheits-/Submissions-/Konzessionsmodell), Leitstelle/ProQA, NAIK, Hilfsfrist/Schutzziele, KatRetter, Notfallversorgungsreform 2023–2027 und Vorbeugender Rettungsdienst'
    ]},
    {v:'2.14.2',ts:'2026-08-02T19:46',items:[
      'VAk Quiz: 5 neue Fragen zum Gesetzgebungsverfahren – Initiativrecht, BVerfG-Beteiligung, Gesetzesbeschluss, Bundesrat 2. Durchgang, Ausfertigung (jetzt 84 Fragen)'
    ]},
    {v:'2.14.1',ts:'2026-08-02T18:50',items:[
      'VAk Klausurfälle: Rechtliche Korrektur Fall 3 – Duldungsverfügung (§§ 6, 9 VwVG) für unbesetzte Wohnung präzisiert',
      'VAk Klausurhinweise: § 80 Abs. 3 VwGO (Schriftlichkeit und Begründungspflicht) ergänzt, § 44 Abs. 2 BHKG präzisiert',
      '2. Jahr: Link zur Lehrgangs-Cloud auf der Jahres-Übersichtsseite ergänzt',
      'PWA: Querformat explizit freigegeben (orientation: any in manifest.json)'
    ]},
    {v:'2.14.0',ts:'2026-08-02T18:39',items:[
      'VAk: 12 neue Quizfragen aus Gedächtnisprotokoll 04.08.2023 (Ermessen, Anscheinsgefahr, VA-Tenor/Begründung, Zwangsmittel, Widerspruch/Vollzug, Gesetzgebungskompetenzen, Ernennung, Dienstvergehen)',
      'VAk: Neue Seite „Klausurhinweise" – Lernübersicht zu Prüfungsthemen und Definitionen',
      'VAk: Neue Seite „Klausurfälle" – drei komplexe Fallbearbeitungen mit Musterlösung aus der Klausur 04.08.2023'
    ]},
    {v:'2.13.3',ts:'2026-08-01',items:[
      'Neuigkeiten: Zeitanzeige entfernt – nur noch Datum wird angezeigt'
    ]},
    {v:'2.13.2',ts:'2026-08-01T21:06',items:[
      'Notizen: Undo-Button erscheint jetzt direkt im Notiz-Overlay nach dem Löschen'
    ]},
    {v:'2.13.1',ts:'2026-07-31T00:16',items:[
      'Desktop: „Inhalt"-Sidebar auf allen Seiten entfernt',
      'Layout: Fehlender Abstand vor Abschnittsüberschriften behoben (gilt für alle Seiten)'
    ]},
    {v:'2.13.0',ts:'2026-07-30T16:21',items:[
      'Performance: Suchindex wird jetzt nur noch einmal aufgebaut (statt bei jedem Öffnen)',
      'Performance: Sucheingabe mit Debouncing – flüssigeres Tippen auf schwächeren Geräten',
      'Performance: Scroll-Handler läuft jetzt immer über requestAnimationFrame',
      'Bug-Fix: Altklausur-Training (VAk) erscheint jetzt in der Suche und im Fortschritts-Tracking',
      'Bug-Fix: Escape-Taste schließt jetzt auch Pomodoro-Timer, Onboarding und Lernstand-Modal',
      'Bug-Fix: Accordion-Häkchen bleiben korrekt gesetzt, auch wenn Inhalte umstrukturiert werden',
      'UX: Notiz löschen zeigt jetzt einen Undo-Button im Toast',
      'Barrierefreiheit: Alle Navigations-Kacheln sind jetzt per Tastatur (Tab + Enter) erreichbar',
      'Barrierefreiheit: Fokus-Indikator für Tastaturnavigation hinzugefügt'
    ]},
    {v:'2.12.13',ts:'2026-07-30T16:10',items:[
      'App-Seite: Hinweistext für Chromium-Browser angepasst'
    ]},
    {v:'2.12.12',ts:'2026-07-30T16:03',items:[
      'Bug-Fix: Android-APK-Download funktioniert wieder (Build-Fehler durch abgelaufenen Keystore-Cache behoben)'
    ]},
    {v:'2.12.11',ts:'2026-07-30T15:50',items:[
      'Lernstatistiken: Bereich „Lernaktivität" (Heatmap) entfernt'
    ]},
    {v:'2.12.10',ts:'2026-07-30T15:34',items:[
      'Bug-Fix: Lernstand-Modal zentriert sich jetzt korrekt auf iOS/Safari, auch wenn die Seite gescrollt ist (Modal auf Body-Ebene verschoben)'
    ]},
    {v:'2.12.9',ts:'2026-07-30T14:51',items:[
      'Bug-Fix: Neuigkeiten-Overlay öffnet jetzt zuverlässig im Quiz (fehlende position:fixed!important-Regel und stopPropagation ergänzt)'
    ]},
    {v:'2.12.8',ts:'2026-07-30T12:42',items:[
      'Lernstand: „Noch nicht gesehen" in Blau-Grau (#4b6180) für bessere Sichtbarkeit'
    ]},
    {v:'2.12.7',ts:'2026-07-30T12:33',items:[
      'Lernstand auf Stand v2.12.4 zurückgesetzt'
    ]},
    {v:'2.12.6',ts:'2026-07-30T12:29',items:[
      'Lernstand: „Noch nicht gesehen"-Felder jetzt klar sichtbar in Blau-Grau statt fast unsichtbarem Hintergrund'
    ]},
    {v:'2.12.5',ts:'2026-07-30T12:27',items:[
      'Bug-Fix: Lernstand-Modal auf iOS/Safari korrekt zentriert – Modal auf Body-Ebene verschoben, sodass position:fixed nicht vom View-Transform gefangen wird'
    ]},
    {v:'2.12.4',ts:'2026-07-30T12:20',items:[
      'Bug-Fix: Lernstand-Modal auf Stand v2.12.0 zurückgesetzt – Zwischenstände 2.12.1–2.12.3 rückgängig gemacht',
      'Changelog-Zeitstempel: alle Einträge zeigen jetzt die exakte Git-Merge-Zeit'
    ]},
    {v:'2.12.3',ts:'2026-07-30T12:11',items:[
      'Bug-Fix: Lernstand-Modal layout wie Statistiken/Pomodoro'
    ]},
    {v:'2.12.2',ts:'2026-07-30T12:03',items:[
      'Bug-Fix: Lernstand-Modal identisch zu Pomodoro/Statistiken'
    ]},
    {v:'2.12.1',ts:'2026-07-30T11:53',items:[
      'Bug-Fix: Lernstand-Modal zentriert auf Mobilgeräten'
    ]},
    {v:'2.12.0',ts:'2026-07-30T11:43',items:[
      'Desktop-Optimierung: schlankerer Hero, breitere Inhaltsspalten ab 1200 px',
      'Desktop-Optimierung: 4-spaltiges Kachel-Raster auf der Startseite ab 1000 px',
      'Desktop-Optimierung: Text-Inhaltsverzeichnis als Seitenleiste auf breiten Bildschirmen (≥ 1300 px)'
    ]},
    {v:'2.11.1',ts:'2026-07-30T10:52',items:[
      'Bug-Fix: 1. Jahr und 2. Jahr zeigten keinen Inhalt (fehlende Registrierung in der NAV-Liste)'
    ]},
    {v:'2.11.0',ts:'2026-07-30T10:50',items:[
      'Startseite nach Ausbildungsjahren gegliedert: 1. Jahr (GAL, SFS, HLFS) und 2. Jahr (IBK, VAk, FeuAK, IdF)'
    ]},
    {v:'2.10.1',ts:'2026-07-30T10:40',items:[
      'Neuigkeiten-Overlay: Verhalten identisch zum Pomodoro-Timer – funktioniert jetzt auf allen Geräten zuverlässig',
      'Zeitstempel im Changelog: zeigt jetzt die echten Git-Commit-Zeiten'
    ]},
    {v:'2.10.0',ts:'2026-07-30T10:23',items:[
      'Neuigkeiten-Overlay öffnet jetzt immer zuverlässig beim Antippen',
      'Kein automatisches Öffnen beim App-Start mehr',
      'Genaues Datum und Uhrzeit pro Eintrag im Neuigkeiten-Feed'
    ]},
    {v:'2.9.0',ts:'2026-07-30T10:02',items:[
      'Neuigkeiten von Startseite in die Einstellungen verschoben'
    ]},
    {v:'2.8.3',ts:'2026-07-30T09:55',items:[
      'Bug-Fix: Neuigkeiten-Overlay öffnet zuverlässig – CSS-Animations-Neustart-Problem behoben'
    ]},
    {v:'2.8.2',ts:'2026-07-30T09:44',items:[
      'Bug-Fix: Ghost-Click-Schutz für Tablets beim Öffnen des Overlays'
    ]},
    {v:'2.8.1',ts:'2026-07-30T09:20',items:[
      'Neuigkeiten-Feed: Overlay-Design wie das Suchfeld (Blur, Header, Footer)',
      'Semantic Versioning (MAJOR.MINOR.PATCH) eingeführt'
    ]},
    {v:'2.8.0',ts:'2026-07-30T09:01',items:[
      'Neuigkeiten-Feed: automatisches Update-Modal bei neuer Version',
      'Neuigkeiten-Kachel auf der Startseite'
    ]},
    {v:'2.7.1',ts:'2026-07-30T08:45',items:[
      'Accordion-Tabs: doppelte Nummern aus Titeln entfernt (Badge zeigt bereits die Nummer)'
    ]},
    {v:'2.7.0',ts:'2026-07-30T08:35',items:[
      'Verwandte Themen: kontextbezogene Verlinkungen am Ende jeder Lernseite',
      'Aktivitäts-Heatmap: 13-Wochen-Übersicht in den Statistiken',
      'Suche: Kontext-Snippets zeigen die relevante Textstelle',
      'Offline-Banner: Hinweis bei fehlendem Netz',
      'Simulator: abgeschlossene Szenarien werden dauerhaft markiert'
    ]},
    {v:'2.6.0',ts:'2026-07-30T08:15',items:[
      'Prüfungs-Timer mit Countdown-Balken',
      'Kategorien-Auswertung nach der Klausur',
      'Service-Worker-Update-Erkennung zuverlässig verbessert'
    ]},
    {v:'2.5.1',ts:'2026-07-30T08:05',items:[
      'Lernstand-Modal: Backdrop-Blur wie beim Suchfeld',
      'Frage 62 (Anscheinsgefahr): fehlenden Inhalt ergänzt'
    ]},
    {v:'2.5.0',ts:'2026-07-29T16:30',items:[
      'Lernstand als zentriertes Modal-Fenster statt Seitenleiste'
    ]},
    {v:'2.4.0',ts:'2026-07-29T16:22',items:[
      'Filter-Panel als kollabierendes Akkordeon'
    ]}
  ];
  function _render(){
    const el=document.getElementById('changelog-feed');
    if(!el) return;
    const seen=localStorage.getItem(KEY);
    el.innerHTML=ENTRIES.map((e,i)=>{
      const isNew=i===0&&e.v!==seen;
      return`<div class="cl-entry${isNew?' cl-new':''}"><div class="cl-meta"><span class="cl-version">v${e.v}</span>${isNew?'<span class="cl-new-badge">Neu</span>':''}<span class="cl-date">${_fmtTs(e.ts)}</span></div><ul class="cl-items">${e.items.map(it=>`<li>${it}</li>`).join('')}</ul></div>`;
    }).join('');
  }
  function _updateTile(){
    const badge=document.getElementById('changelog-badge');
    const desc=document.getElementById('changelog-tile-desc');
    if(!badge) return;
    const seen=localStorage.getItem(KEY);
    if(seen!==APP_VERSION){
      badge.classList.remove('hidden');
      if(desc) desc.textContent='Neu in v'+APP_VERSION+' · Update-Verlauf';
    } else {
      badge.classList.add('hidden');
      if(desc) desc.textContent='Update-Verlauf · Was ist neu';
    }
  }
  return{
    open(){
      const m=document.getElementById('changelog-modal');
      if(!m) return;
      _render();
      m.classList.remove('hidden');
      localStorage.setItem(KEY,APP_VERSION);
      _updateTile();
      document.getElementById('m-cl-badge')?.classList.add('hidden');
      document.getElementById('m-cl-badge2')?.classList.add('hidden');
    },
    close(){
      document.getElementById('changelog-modal').classList.add('hidden');
    },
    check(){
      _updateTile();
    },
    isNew(){
      try{ return localStorage.getItem(KEY)!==APP_VERSION; }catch(e){ return false; }
    }
  };
})();

/* ======================================================================
   RELATED – Themenübergreifende Verlinkung
====================================================================== */
const RELATED={
  'v-hlfs-fuehrungsvorgang':[['v-sfs-fwdv3','SFS Führung/FwDV3'],['v-ibk-konflikt','IBK Konflikt'],['v-ibk-ta','IBK TA']],
  'v-hlfs-gabc':[['v-gal-atemgifte','GAL Atemgifte'],['v-gal-gabc','GAL G-ABC'],['v-sfs-abc','SFS Geräte/ABC']],
  'v-hlfs-vb':[['v-gal-vb','GAL Vorbeugen'],['v-idf-brandschutz','IdF VB']],
  'v-hlfs-manv':[['v-gal-erstehilfe','GAL Erste Hilfe'],['v-ibk-psnv','IBK PSNV']],
  'v-hlfs-zugfuehrer':[['v-sfs-fwdv3','SFS FwDV3/Führung'],['v-hlfs-fuehrungsvorgang','HLFS Führungsvorgang'],['v-ibk-zeit','IBK Zeitmanagement']],
  'v-hlfs-stab':[['v-idf-stab','IdF Stabsarbeit'],['v-ibk-pm','IBK PM'],['v-ibk-zeit','IBK Zeitmanagement']],
  'v-hlfs-tunnel':[['v-gal-atemschutz','GAL Atemschutz']],
  'v-ibk-ta':[['v-ibk-konflikt','IBK Konflikt'],['v-sfs-methodik','SFS Methodik'],['v-ibk-stress','IBK Stress']],
  'v-ibk-konflikt':[['v-ibk-ta','IBK TA'],['v-ibk-stress','IBK Stress'],['v-hlfs-fuehrungsvorgang','HLFS Führung']],
  'v-ibk-stress':[['v-ibk-psnv','IBK PSNV'],['v-ibk-bgm','IBK BGM'],['v-ibk-konflikt','IBK Konflikt']],
  'v-ibk-psnv':[['v-ibk-stress','IBK Stress'],['v-hlfs-manv','HLFS MANV']],
  'v-ibk-bgm':[['v-ibk-stress','IBK Stress'],['v-ibk-psnv','IBK PSNV']],
  'v-ibk-pm':[['v-hlfs-stab','HLFS Stab'],['v-idf-stab','IdF Stabsarbeit'],['v-ibk-zeit','IBK Zeitmanagement'],['v-feuak-pm','FeuAK PM']],
  'v-ibk-zeit':[['v-ibk-pm','IBK PM'],['v-hlfs-zugfuehrer','HLFS Zugführer']],
  'v-vak-verwaltungsrecht':[['v-vak-staatsrecht','Staatsrecht'],['v-vak-einsatzrecht','Einsatzrecht'],['v-vak-dienstrecht','Dienstrecht'],['v-vak-altklausur','Altklausur-Quiz']],
  'v-vak-staatsrecht':[['v-vak-verwaltungsrecht','Verwaltungsrecht'],['v-gal-staatsbuerger','GAL Staatsbürgerkunde']],
  'v-vak-einsatzrecht':[['v-vak-verwaltungsrecht','Verwaltungsrecht'],['v-gal-hbkg','GAL HBKG'],['v-vak-altklausur','Altklausur-Quiz']],
  'v-vak-dienstrecht':[['v-vak-verwaltungsrecht','Verwaltungsrecht'],['v-gal-beamtenrecht','GAL Beamtenrecht'],['v-vak-altklausur','Altklausur-Quiz']],
  'v-vak-altklausur':[['v-vak-verwaltungsrecht','Verwaltungsrecht'],['v-vak-einsatzrecht','Einsatzrecht'],['v-vak-dienstrecht','Dienstrecht'],['v-vak-staatsrecht','Staatsrecht']],
  'v-vak-jur-denken':[['v-vak-verwaltungsrecht','Verwaltungsrecht'],['v-vak-einsatzrecht','Einsatzrecht']],
  'v-feuak-vwl':[['v-feuak-haushalt','FeuAK Haushalt'],['v-feuak-pm','Strategisches Management']],
  'v-feuak-haushalt':[['v-feuak-vwl','FeuAK VWL'],['v-feuak-qm','Qualitätsmanagement']],
  'v-feuak-qm':[['v-feuak-haushalt','Haushalt'],['v-feuak-bedarfsplanung','Bedarfsplanung']],
  'v-feuak-pm':[['v-ibk-pm','IBK PM'],['v-ibk-zeit','IBK Zeitmanagement'],['v-feuak-bedarfsplanung','Bedarfsplanung']],
  'v-feuak-planspiel':[['v-hlfs-manv','HLFS MANV & OLRD'],['v-feuak-altklausur','Altklausur']],
  'v-idf-brandschutz':[['v-hlfs-vb','HLFS VB'],['v-gal-vb','GAL Vorbeugen']],
  'v-idf-stab':[['v-hlfs-stab','HLFS Stab'],['v-ibk-pm','IBK PM']],
  'v-idf-presse':[['v-ibk-konflikt','IBK Konflikt'],['v-ibk-ta','IBK TA']],
  'v-sfs-fwdv3':[['v-hlfs-zugfuehrer','HLFS Zugführer'],['v-hlfs-fuehrungsvorgang','HLFS Führungsvorgang']],
  'v-sfs-methodik':[['v-ibk-ta','IBK TA'],['v-ibk-stress','IBK Stress'],['v-hlfs-fuehrungsvorgang','HLFS Führung']],
  'v-sfs-rechtsgrundlagen':[['v-vak-verwaltungsrecht','VAk Verwaltungsrecht'],['v-vak-einsatzrecht','VAk Einsatzrecht']],
  'v-gal-beamtenrecht':[['v-vak-dienstrecht','VAk Dienstrecht'],['v-gal-beihilferecht','GAL Beihilferecht']],
  'v-gal-hbkg':[['v-vak-einsatzrecht','VAk Einsatzrecht']],
  'v-gal-vb':[['v-hlfs-vb','HLFS VB'],['v-idf-brandschutz','IdF VB']],
  'v-gal-staatsbuerger':[['v-vak-staatsrecht','VAk Staatsrecht']],
  'v-gal-gabc':[['v-hlfs-gabc','HLFS GABC'],['v-sfs-abc','SFS ABC']],
  'v-gal-atemschutz':[['v-hlfs-tunnel','HLFS Tunnel']],
  'v-gal-erstehilfe':[['v-hlfs-manv','HLFS MANV']],
};


/* ══════════════════════════════════════════════════════════════
   FALLBEARBEITUNG – 8-Punkte-Schema + Übungsfälle
══════════════════════════════════════════════════════════════ */
const FALLBEARBEITUNG = (function(){
  const KEY = 'bvi_fb_answers';

  const STEPS = [
    {
      title:'Ermächtigungsgrundlage',
      law:'§1 Abs.1 Nr.1 BHKG · §3 Abs.1 BHKG · §1 Abs.1 OBG · §34 Abs.2 BHKG · §44 Abs.2 BHKG · §48 BHKG · Art. 19 GG · §35 VwVfG',
      prompt:'Auf welche Rechtsgrundlage stützt die Feuerwehr ihr Handeln? Handelt es sich um einen Verwaltungsakt oder einen Realakt?',
      schema:'<p><strong>Verwaltungsakt (§35 VwVfG):</strong> Alle 6 Merkmale müssen erfüllt sein: hoheitliche Maßnahme, einer Behörde, auf dem Gebiet des öffentlichen Rechts, Regelung, eines Einzelfalls, mit Außenwirkung. Auch Anweisungen an Störer sind VAs.</p><p><strong>Realakt:</strong> Schlichtes Verwaltungshandeln ohne Regelungscharakter – es werden nur die Punkte 1–3 (materiell) geprüft.</p><p><strong>Rechtsrahmen NRW:</strong> Das BHKG gilt i.V.m. dem OBG NRW; Aufgabenzuweisungen ergeben sich aus §§ 1 Abs.1 Nr.1, 3 Abs.1 BHKG für die Gemeinde als Trägerin der Feuerwehr, inhaltlich flankiert durch §1 Abs.1 OBG (allgemeine Aufgabe der Ordnungsbehörden: Abwehr von Gefahren für die öffentliche Sicherheit oder Ordnung).</p><p><strong>Wichtige Normen:</strong></p><ul><li>§1 Abs.1 Nr.1 BHKG – Aufgabenzuweisung: Brandschutz und Hilfeleistung als Pflichtaufgabe der Gemeinde</li><li>§3 Abs.1 BHKG – Gemeinde als Trägerin der Feuerwehr (NRW)</li><li>§1 Abs.1 OBG – Allgemeine Aufgabe der Ordnungsbehörden: Gefahrenabwehr für öffentliche Sicherheit</li><li>§34 Abs.2 S.1 BHKG – Hilfeleistung bei anderen Notlagen (Menschenrettung, Schutz bedeutender Sachwerte)</li><li>§44 Abs.2 BHKG – Betretungsrecht, Anordnungsbefugnis, Inanspruchnahme von Sachen, unmittelbarer Zwang</li><li>§48 BHKG – Einschränkung von Grundrechten (Art. 2 Abs.1 i.V.m. Art. 1 Abs.1, Art. 2 Abs.2 S.1+2, Art. 13 GG); Zitiergebot gem. Art. 19 Abs.1 S.2 GG</li></ul>'
    },
    {
      title:'Zuständigkeit',
      law:'§1 Abs.1 BHKG · §3 Abs.1 S.1 BHKG · §4 Abs.1 OBG · §5 Abs.1 OBG · Art. 28 Abs.2 GG · §28 Abs.2 Nr.1 VwVfG · §37 Abs.2 VwVfG · §39 Abs.1 S.1 VwVfG · §41 Abs.1 VwVfG',
      prompt:'Ist die handelnde Feuerwehr sachlich, örtlich und instanziell zuständig? Welche Verfahrensanforderungen gelten?',
      schema:'<p><strong>1. Sachliche Zuständigkeit:</strong> Ergibt sich aus den Aufgabenweisungen: §1 Abs.1 Nr.1, 2 i.V.m. §3 Abs.1 S.1 BHKG → Feuerwehr ist zuständig für Brandschutz und Hilfeleistung.</p><p><strong>2. Örtliche Zuständigkeit:</strong> §3 Abs.1 S.1 BHKG i.V.m. §4 Abs.1 OBG → Feuerwehr ist zuständig im Gebiet der Gemeinde.</p><p><strong>3. Instanzielle Zuständigkeit:</strong> §3 Abs.1 S.1 BHKG i.V.m. Art. 28 Abs.2 GG (kommunale Selbstverwaltung) und §5 Abs.1 OBG → Feuerwehr als behördliche Einrichtung der Gemeinde.</p><p><strong>Verfahren (bei VA mit mind. Anscheinsgefahr):</strong></p><ul><li>Verzicht auf Anhörung: §28 Abs.2 Nr.1 VwVfG (Gefahr im Verzug)</li><li>Form: mündlich nach §37 Abs.2 VwVfG</li><li>Begründung: nicht erforderlich bei mündlichem VA (§39 Abs.1 S.1 VwVfG)</li><li>Bekanntgabe: mündlich nach §41 Abs.1 VwVfG</li></ul>'
    },
    {
      title:'Vorliegen einer Gefahr',
      law:'§34 Abs.2 S.1 BHKG – Gefahrenbegriff',
      prompt:'Liegt eine Gefahr im Sinne des BHKG vor? Welche Art von Gefahr (konkret, abstrakt, Anscheinsgefahr)?',
      schema:'<p><strong>Konkrete Gefahr:</strong> Hinreichende Wahrscheinlichkeit eines Schadenseintritts im Einzelfall. Je gewichtiger das bedrohte Rechtsgut, desto geringer die erforderliche Wahrscheinlichkeit.</p><p><strong>Abstrakte Gefahr:</strong> Typischerweise gefährliche Situation, unabhängig vom konkreten Einzelfall. Grundlage für generell-abstrakte Regelungen, nicht für Einzelfallmaßnahmen.</p><p><strong>Anscheinsgefahr:</strong> Ex-ante erscheint eine konkrete Gefahr als hinreichend wahrscheinlich; ex-post stellt sich heraus, dass keine reale Gefahr bestand. Die Maßnahme bleibt rechtmäßig, wenn die Gefahrenprognose ex-ante vertretbar war. Maßgeblich ist die Beurteilung durch einen sorgfältigen, sachkundigen Beobachter zum Zeitpunkt des Handelns.</p>'
    },
    {
      title:'Störerauswahl',
      law:'§17 OBG · §18 OBG · §19 OBG · Art. 19 Abs.4 GG · §48 BHKG',
      prompt:'Wer ist Störer? Verhaltensstörer, Zustandsstörer oder Nichtstörer? Wer ist Adressat der Maßnahme?',
      schema:'<p><strong>Verhaltensstörer (§17 OBG):</strong> Person, die durch ihr Verhalten (Tun oder Unterlassen) die Gefahr unmittelbar verursacht oder aufrechthält.</p><p><strong>Zustandsstörer (§18 OBG):</strong> Person, von deren Sache die Gefahr ausgeht (Eigentümer oder Inhaber der tatsächlichen Gewalt).</p><p><strong>Nichtstörer (§19 OBG):</strong> Person, die weder Verhaltens- noch Zustandsstörer ist. Inanspruchnahme zulässig, wenn: (1) Störer nicht rechtzeitig erreichbar oder Maßnahme unzureichend, (2) Gefahr anders nicht abwendbar, (3) Nichtstörer so wenig wie möglich belastet. → Entschädigungsanspruch gem. §45 Abs.2 BHKG.</p><p><strong>Auswahlermessen:</strong> Bei mehreren Störern richtet sich die Auswahl nach Effektivität und Verhältnismäßigkeit.</p><p><strong>Rechtsstaatliche Legitimation:</strong> Die Bestimmung des Störers nach §§17–19 OBG legitimiert die Maßnahme gegen diese Person. Eingriffe in Grundrechte müssen dem Zitiergebot gem. §48 BHKG genügen und einer gerichtlichen Kontrolle gem. Art. 19 Abs.4 GG standhalten.</p>'
    },
    {
      title:'Ermessen',
      law:'§1 Abs.1 Nr.1 BHKG · §1 Abs.1 OBG · §1 Abs.2 OBG · §34 Abs.2 BHKG · §44 Abs.2 BHKG',
      prompt:'Welches Ermessen steht der Behörde zu? Ist das Entschließungsermessen auf Null reduziert?',
      schema:'<p><strong>Entschließungsermessen</strong> (ob die Behörde tätig wird?): Die Feuerwehr kann grundsätzlich nach §1 Abs.1 Nr.1 BHKG handeln (vgl. auch §1 Abs.1, 2 OBG). Bei hochrangigen Rechtsgütern (Leib, Leben) ist das Ermessen auf Null reduziert → Einschreiten ist zwingend.</p><p><strong>Auswahlermessen</strong> (wie tätig?): Der Einsatzleiter entscheidet nach §34 Abs.2 BHKG pflichtgemäß im eigenen Ermessen, welche Maßnahme zu ergreifen ist. Zu berücksichtigen: Wirksamkeit, Zumutbarkeit für den Betroffenen, Verhältnismäßigkeit.</p><p><strong>Reduktion auf Null:</strong> Je höherwertiger das bedrohte Rechtsgut (insbes. Menschenleben), desto eher verdichtet sich das Ermessen zur Pflicht zum Einschreiten (§1 Abs.1 Nr.1 BHKG; vgl. §1 Abs.1, 2 OBG).</p>'
    },
    {
      title:'Verhältnismäßigkeit',
      law:'§15 Abs.2 OBG · §44 Abs.2 S.4 BHKG',
      prompt:'Ist die gewählte Maßnahme verhältnismäßig? Prüfe: Legitimer Zweck, Geeignetheit, Erforderlichkeit, Angemessenheit.',
      schema:'<p><strong>Legitimer Zweck:</strong> Die Maßnahme muss einem legitimen Zweck (Gefahrenabwehr, Schutz von Rechtsgütern) dienen.</p><p><strong>Geeignetheit (G):</strong> Die Maßnahme muss geeignet sein, den Zweck zu fördern.</p><p><strong>Erforderlichkeit (E):</strong> Es darf kein milderes, gleich wirksames Mittel geben (mildestes Mittel).</p><p><strong>Angemessenheit (A):</strong> Die Maßnahme darf nicht zu einem Nachteil führen, der außer Verhältnis zum angestrebten Erfolg steht (§15 Abs.2 OBG; §44 Abs.2 S.4 BHKG). Abwägung: Schwere des Eingriffs ↔ Bedeutung des abzuwehrenden Schadens.</p>'
    },
    {
      title:'Rechtsfolge',
      law:'§35 VwVfG · §44 Abs.2 BHKG · §37 Abs.2 VwVfG',
      prompt:'Was ist die Rechtsfolge? Formuliere ggf. den Inhalt des Verwaltungsakts anhand der W-Fragen.',
      schema:'<p><strong>Verwaltungsakt:</strong> Einseitige, verbindliche, hoheitliche Maßnahme, die etwas anordnet, untersagt, gewährt oder feststellt (§35 VwVfG).</p><p><strong>Inhalt – W-Fragen:</strong></p><ul><li><strong>Wer</strong> muss handeln/dulden?</li><li><strong>Was</strong> ist zu tun/zu unterlassen?</li><li><strong>Wann</strong> (Zeitpunkt/Frist)?</li><li><strong>Wohin</strong> (Ort)?</li><li><strong>Wie (lang)</strong> (Dauer)?</li></ul><p>Mündliche Anordnungen sind nach §37 Abs.2 VwVfG zulässig. Bei Weigerung: <strong>Unmittelbarer Zwang</strong> gem. §44 Abs.2 BHKG (sofortiger Vollzug ohne vorherige Androhung bei Gefahr im Verzug).</p>'
    },
    {
      title:'Kosten- und Entschädigungsfragen',
      law:'§45 Abs.1 BHKG',
      prompt:'Wurde ein Nichtstörer in Anspruch genommen? Besteht ein Entschädigungsanspruch nach §45 BHKG?',
      schema:'<p><strong>§45 Abs.2 BHKG – Entschädigung für Nichtstörer:</strong> Wer als Nichtstörer (§19 OBG) in Anspruch genommen wurde, hat Anspruch auf angemessene Entschädigung durch die Gemeinde. Der Entschädigungsanspruch besteht auch bei rechtmäßiger Inanspruchnahme.</p><p>Liegt kein Nichtstörer vor (kein Dritter wurde in Anspruch genommen), findet §45 BHKG keine Anwendung.</p>'
    },
    {
      title:'Dokumentation u. Sicherung',
      law:'§34 Abs.1 BHKG · §24 Abs.1 Nr.2 OBG · §43 Nr.1 PolG NRW',
      prompt:'Wurden alle Maßnahmen dokumentiert? Ist die Einsatzstelle gesichert und an die zuständige Stelle übergeben?',
      schema:'<p><strong>Dokumentationspflicht (§34 Abs.1 BHKG):</strong> Alle getroffenen Maßnahmen, Rechtsgrundlagen, Gründe und Zeitpunkte sind im Einsatzbericht vollständig festzuhalten (quis, quid, quando, ubi, cur). Die Dokumentation dient der Nachvollziehbarkeit und ist Grundlage für Kostenersatz und Entschädigungsansprüche.</p><p><strong>Sicherung der Einsatzstelle:</strong> Beim Verlassen muss die Einsatzstelle gesichert oder an eine zuständige Stelle übergeben werden. Mögliche Maßnahmen:</p><ul><li><strong>Feuerwehr</strong> sichert bis zur Übergabe (ggf. Sicherung der Wohnung/des Objekts)</li><li><strong>Polizei</strong> einschalten gem. §43 Nr.1 PolG NRW – bei Straftatverdacht oder wenn keine andere Ordnungsbehörde erreichbar ist</li><li><strong>Ordnungsamt / Oberbürgermeister</strong> informieren gem. §24 Abs.1 Nr.2 OBG – Weiterleitungspflicht bei fortbestehender Gefahr an zuständige Behörde</li><li>Eigentümer/Verwalter benachrichtigen; beschädigte Zugänge provisorisch sichern</li></ul>'
    }
  ];

  const CASES = [
    {
      id:1,
      title:'Fall 1 – Wohnungsöffnung nach ausgelöstem Heimrauchmelder',
      sachverhalt:'Um 02:15 Uhr wird die Feuerwehr zu einem Mehrfamilienhaus alarmiert. Ein Heimrauchmelder im 3. OG piept seit Längerem. Kein Rauch oder Brandgeruch im Treppenhaus. Klingeln und Klopfen bleiben erfolglos. Ein Nachbar berichtet, der Wohnungsinhaber sei älter und lebe allein. Der Einsatzleiter ordnet die gewaltsame Türöffnung an. In der Wohnung befindet sich niemand; der Rauchmelder wurde durch eine leere Batterie ausgelöst. Der Eigentümer verlangt Ersatz der beschädigten Tür.',
      answers:[
        'Ermächtigungsgrundlage: §34 Abs.2 S.1 BHKG (Hilfeleistung bei anderen Notlagen) i.V.m. §44 Abs.2 BHKG (Betreten und gewaltsames Öffnen von Wohnungen). Da zum Zeitpunkt der Maßnahme niemand anwesend ist, dem eine Anordnung erteilt werden könnte, liegt ein <strong>Realakt</strong> vor – keine VA-Prüfung (Punkte 1–3 genügen materiell).',
        'Sachlich: §1 Abs.1 i.V.m. §3 Abs.1 S.1 BHKG (Brandschutz und Hilfeleistung als Gemeindeaufgabe). Örtlich: §3 Abs.1 S.1 BHKG (Gemeindegebiet). Instanziell: §3 Abs.1 S.1 BHKG (Feuerwehr als behördliche Einrichtung). Da die Maßnahme ein <strong>Realakt</strong> ist, entfallen die VA-spezifischen Verfahrensanforderungen des VwVfG vollständig (keine Anhörungspflicht nach §28 VwVfG, keine Formvorschriften nach §37 VwVfG, keine förmliche Bekanntgabe nach §41 VwVfG). Die drei Zuständigkeiten genügen zur materiellen Legitimation.',
        '<strong>Anscheinsgefahr:</strong> Ex-ante-Betrachtung durch einen sorgfältigen, sachkundigen Einsatzleiter: Piepender Rauchmelder um 02:15 Uhr + älterer alleinlebender Bewohner + keine Reaktion auf Klingeln/Klopfen → hinreichend wahrscheinlich, dass eine hilflose oder bewusstlose Person in der Wohnung ist oder ein Brandgeschehen vorliegt. Die ex-ante-Annahme einer konkreten Gefahr war objektiv vertretbar. Ex-post (leere Batterie, niemand anwesend) ändert die rechtliche Bewertung nicht – maßgeblich bleibt die ex-ante-Perspektive.',
        'Kein Störer identifizierbar (§§17, 18 OBG): Niemand ist vor Ort, dem die Gefahr durch Verhalten oder Sachherrschaft zuzurechnen wäre. Die Feuerwehr handelt ohne Adressat direkt als Realakt (Öffnen der Tür). Der abwesende Eigentümer/Mieter ist nicht Störer im Sinne des OBG.',
        'Entschließungsermessen auf Null reduziert: Mögliche hilflose Person in der Wohnung → Rechtsgut Leben/körperliche Unversehrtheit → Einschreiten zwingend. Auswahlermessen: Gewaltsame Öffnung war die einzig verbleibende Option nach Ausschöpfung milderer Mittel (Klingeln, Klopfen, Nachbarbefragung, kein Schlüsseldienst in vertretbarer Zeit erreichbar).',
        'Legitimer Zweck: Rettung einer möglicherweise hilflosen Person. Geeignet: Wohnungsöffnung ermöglicht die Nachschau → geeignet. Erforderlich: Kein milderes, gleich wirksames Mittel verfügbar (kein Ersatzschlüssel zugänglich um 02:15 Uhr) → erforderlich. Angemessen: Potenzielle Rettung eines Menschenlebens überwiegt den Schaden an der Wohnungstür bei weitem → angemessen.',
        'Die Wohnungsöffnung war rechtmäßig. Rechtsgrundlage: §44 Abs.2 BHKG. Eine förmliche Anordnung war nicht erforderlich (kein Adressat). Die Anscheinsgefahr legitimierte das unmittelbare Handeln.',
        '§45 BHKG liegt nicht vor: Es wurde kein Nichtstörer (§19 OBG) in Anspruch genommen – die Feuerwehr hat als Realakt ohne Adressat gehandelt. Ein Entschädigungsanspruch nach §45 BHKG scheidet daher aus.',
        'Einsatzbericht (§34 Abs.1 BHKG): Alarmzeit, Anscheinsgefahr (piepender Rauchmelder, keine Reaktion), durchgeführte Maßnahmen (gewaltsame Türöffnung), Ergebnis (leere Wohnung, leere Batterie) und Rechtsgrundlage (§44 Abs.2 BHKG) dokumentieren. Sicherung: Beschädigte Tür provisorisch sichern; Eigentümer/Hausverwaltung benachrichtigen (§24 Abs.1 Nr.2 OBG). Keine Einschaltung der Polizei erforderlich (keine strafrechtlich relevante Lage).'
      ]
    },
    {
      id:2,
      title:'Fall 2 – Gasgeruch im Gewerbebetrieb',
      sachverhalt:'Während der Öffnungszeiten eines Supermarkts melden mehrere Kunden starken Gasgeruch. Die Feuerwehr stellt vor Ort ebenfalls deutlichen Gasgeruch fest. Der Filialleiter verweigert die Räumung: „Heute ist Samstag. Wenn wir jetzt schließen, verlieren wir mehrere zehntausend Euro Umsatz."',
      answers:[
        'Ermächtigungsgrundlage: §34 Abs.2 S.1 BHKG i.V.m. §44 Abs.2 BHKG. Die Räumungsanordnung gegenüber dem Filialleiter ist ein <strong>Verwaltungsakt</strong> gem. §35 VwVfG: hoheitlich, einseitig, verbindlich, regelt einen Einzelfall (Räumung dieses Marktes), auf unmittelbare Rechtswirkung gerichtet, durch Behörde (Feuerwehr) erlassen.',
        'Sachlich: §1 Abs.1 i.V.m. §3 Abs.1 S.1 BHKG. Örtlich: §3 Abs.1 S.1 BHKG. Instanziell: §3 Abs.1 S.1 BHKG. Anhörungsverzicht: §28 Abs.2 Nr.1 VwVfG (Gefahr im Verzug – Gasgeruch erfordert sofortiges Handeln). Form: mündlich §37 Abs.2 VwVfG. Begründung entbehrlich (§39 Abs.1 S.1 VwVfG). Bekanntgabe: mündlich §41 Abs.1 VwVfG.',
        '<strong>Konkrete Gefahr:</strong> Starker Gasgeruch, sensorisch von Feuerwehrkräften bestätigt → hinreichende Wahrscheinlichkeit einer Explosion, Verpuffung oder Gasvergiftung im konkreten Einzelfall. Es handelt sich nicht mehr um einen bloßen Verdacht, sondern um eine objektivierte Feststellung. Die Gefahr für Leib und Leben der anwesenden Kunden und des Personals ist konkret und akut.',
        '<strong>Verhaltensstörer (§17 OBG):</strong> Der Filialleiter, der die Räumung aktiv verweigert und dadurch Kunden und Personal in der Gefahrenzone hält (Störung durch Unterlassen einer gebotenen Handlung). <strong>Zustandsstörer (§18 OBG):</strong> Eigentümer/Betreiber des Supermarkts als Inhaber der gasführenden Anlage. Primärer Adressat der Anordnung: der Filialleiter als vor Ort anwesende, handlungs- und weisungsbefugte Person (Auswahlermessen nach Effektivität).',
        'Entschließungsermessen auf Null reduziert: Konkrete Explosionsgefahr → unmittelbare Gefahr für Leib und Leben zahlreicher Personen → Einschreiten zwingend. Auswahlermessen: Vollständige Räumung als verhältnismäßigste Maßnahme. Wirtschaftliche Interessen des Filialleiters (Umsatzverlust am Samstag) sind rechtlich ohne Belang – sie können das Einschreiten weder verhindern noch verzögern.',
        'Legitimer Zweck: Schutz von Leib und Leben der Kunden und Mitarbeiter. Geeignet: Räumung beseitigt die Gefährdung der Personen im Gefahrenbereich → geeignet. Erforderlich: Kein milderes, gleich wirksames Mittel (bei diffusem Gasgeruch im gesamten Markt ist eine Teilräumung unzureichend) → erforderlich. Angemessen: Der Umsatzverlust des Betreibers tritt hinter dem Schutz von Menschenleben zurück (§15 Abs.2 OBG) → angemessen.',
        'Mündliche Räumungsanordnung als VA gem. §44 Abs.2 BHKG: „Sie räumen diesen Markt sofort und vollständig – alle Kunden und Mitarbeiter verlassen jetzt das Gebäude." (Wer? = alle Personen im Markt; Was? = Verlassen des Gebäudes; Wann? = sofort; Wohin? = außerhalb des Gefahrenbereichs; Wie lange? = bis zur Freigabe durch die Feuerwehr). Bei weiterer Weigerung: <strong>Unmittelbarer Zwang</strong> gem. §44 Abs.2 BHKG zulässig (Gefahr im Verzug, kein Aufschub möglich).',
        '§45 BHKG liegt nicht vor: Filialleiter und Betreiber sind Störer (§§17, 18 OBG) – Störer haben keinen Entschädigungsanspruch nach §45 BHKG. Ein Nichtstörer wurde nicht in Anspruch genommen.',
        'Einsatzbericht (§34 Abs.1 BHKG): Gasgeruch (Feststellung, Zeitpunkt), Räumungsanordnung (Inhalt, Adressat, Zeitpunkt), Maßnahmen der Gasfirma und Freigabe durch Fachkraft dokumentieren. Sicherung: Übergabe der Einsatzstelle an Gasfirma und Betreiber; Polizei einschalten (§43 Nr.1 PolG NRW) bis zur vollständigen Beseitigung der Gefahrenquelle. Betreiber über Rechtslage informieren (§24 Abs.1 Nr.2 OBG).'
      ]
    },
    {
      id:3,
      title:'Fall 3 – Brennendes Elektrofahrzeug in Tiefgarage',
      sachverhalt:'In einer Tiefgarage gerät ein Elektrofahrzeug in Brand. Zur Brandbekämpfung muss die Feuerwehr mehrere weitere Fahrzeuge mit Seilwinden aus der Tiefgarage ziehen, um Zugang zum Brandherd zu erhalten. Die Eigentümer der anderen Fahrzeuge widersprechen und befürchten Lackschäden.',
      answers:[
        'Ermächtigungsgrundlage: §34 Abs.1 BHKG (Brandbekämpfung) i.V.m. §44 Abs.2 BHKG (Entfernung von Hindernissen, Inanspruchnahme von Sachen Dritter) und §45 BHKG (Inanspruchnahme von Nichtstörern). Das Versetzen der Fahrzeuge ist ein <strong>Realakt</strong>. Soweit Duldungsanordnungen an anwesende Eigentümer ergehen, liegt jeweils ein VA gem. §35 VwVfG vor.',
        'Sachlich: §1 Abs.1 BHKG (Brandschutz), §3 Abs.1 S.1 BHKG. Örtlich: §3 Abs.1 S.1 BHKG. Instanziell: §3 Abs.1 S.1 BHKG. <strong>Für den Realakt</strong> (Versetzen der Fahrzeuge mit Seilwinden): VwVfG-Verfahrensanforderungen entfallen vollständig – keine Anhörungspflicht (§28 VwVfG), keine Formvorschriften (§37 VwVfG), keine förmliche Bekanntgabe (§41 VwVfG). <strong>Für etwaige Duldungsanordnungen (VA)</strong> an anwesende Eigentümer: Anhörungsverzicht §28 Abs.2 Nr.1 VwVfG (Brand = Gefahr im Verzug); mündliche Form §37 Abs.2 VwVfG; Bekanntgabe §41 Abs.1 VwVfG.',
        '<strong>Konkrete Gefahr:</strong> Brennendes Elektrofahrzeug in geschlossener Tiefgarage → erhöhte thermische Belastung, Rauchentwicklung, erhöhte Brandausbreitungsgefahr (EV-Brände sind schwer zu löschen und neigen zum thermal runaway) → hinreichende Wahrscheinlichkeit eines Schadens für weitere Fahrzeuge, die Gebäudestruktur und ggf. Personen.',
        '<strong>Zustandsstörer (§18 OBG):</strong> Eigentümer des brennenden EV – von seiner Sache geht die Gefahr aus. <strong>Nichtstörer (§19 OBG):</strong> Eigentümer der anderen Fahrzeuge – sie haben die Gefahr nicht verursacht; ihre Fahrzeuge stehen der Brandbekämpfung lediglich im Weg. Inanspruchnahme als Nichtstörer gem. §19 OBG i.V.m. §45 BHKG zulässig, wenn: (1) Störer nicht rechtzeitig erreichbar oder Maßnahme gegen ihn unzureichend, (2) Gefahr sonst nicht abwendbar, (3) Nichtstörer so wenig wie möglich belastet.',
        'Entschließungsermessen auf Null reduziert: Brandbekämpfung in geschlossener Tiefgarage → erheblicher Sachschaden und potenzielle Personengefährdung → Einschreiten zwingend. Auswahlermessen: Umsetzung der Fahrzeuge mit Seilwinden als einzig verfügbares Mittel, um den Löschzugang freizumachen.',
        'Legitimer Zweck: Brandbekämpfung und Verhinderung der Ausbreitung. Geeignet: Umsetzung der Fahrzeuge schafft den erforderlichen Zugang → geeignet. Erforderlich: Kein schonenderes Mittel zur Freimachung des Löschzugangs → erforderlich. Angemessen: Mögliche Lackschäden sind geringfügig gegenüber dem drohenden Brand- und Strukturschaden (§44 Abs.2 S.4 BHKG, §15 Abs.2 OBG) → angemessen.',
        'Umsetzung der Fahrzeuge durch die Feuerwehr gem. §44 Abs.2 i.V.m. §45 BHKG (Realakt). Ggf. mündliche Duldungsanordnung an anwesende Eigentümer: „Wir versetzen Ihr Fahrzeug zur Brandbekämpfung – Sie dulden dies nach §45 BHKG." Bei Widerspruch ist die Maßnahme dennoch zulässig (Nichtstörer haben zu dulden).',
        '§45 BHKG liegt vor: Die Eigentümer der umgesetzten Fahrzeuge sind Nichtstörer (§19 OBG) – sie wurden für die Brandbekämpfung in Anspruch genommen, ohne die Gefahr verursacht zu haben. Sie haben Anspruch auf angemessene Entschädigung durch die Gemeinde gem. §45 Abs.2 BHKG.',
        'Einsatzbericht (§34 Abs.1 BHKG): Umgesetzte Fahrzeuge (Kennzeichen, Eigentümer, Schäden), Rechtsgrundlage der Inanspruchnahme (§19 OBG i.V.m. §45 BHKG) und Löschmaßnahmen dokumentieren. Sicherung: Fahrzeuge sicher abstellen; Eigentümer informieren und auf Entschädigungsanspruch (§45 Abs.2 BHKG) hinweisen (§24 Abs.1 Nr.2 OBG). Tiefgarage an Betreiber/Eigentümer übergeben; Polizei (§43 Nr.1 PolG NRW) bei Verdacht auf Brandstiftung einschalten.'
      ]
    },
    {
      id:4,
      title:'Fall 4 – Umgestürzter Gefahrgut-Lkw',
      sachverhalt:'Ein Tanklastzug mit Salzsäure kippt nach einem Verkehrsunfall auf einer Bundesstraße um. Zur Einrichtung einer Sicherheitszone ordnet die Einsatzleitung an, ein angrenzendes Privatgrundstück zu nutzen. Der Eigentümer verweigert den Zutritt.',
      answers:[
        'Ermächtigungsgrundlage: §34 Abs.2 S.1 BHKG (Hilfeleistung bei anderen Notlagen) i.V.m. §44 Abs.2 BHKG (Betreten von Grundstücken) und §45 BHKG (Inanspruchnahme von Nichtstörern). Die Duldungsanordnung gegenüber dem Eigentümer ist ein <strong>Verwaltungsakt</strong> gem. §35 VwVfG (hoheitlich, einseitig, verbindlich, regelt Einzelfall, auf unmittelbare Rechtswirkung gerichtet).',
        'Sachlich: §1 Abs.1 BHKG (Hilfeleistung bei Gefahrgutunfall), §3 Abs.1 S.1 BHKG. Örtlich: §3 Abs.1 S.1 BHKG. Instanziell: §3 Abs.1 S.1 BHKG. Anhörungsverzicht: §28 Abs.2 Nr.1 VwVfG (akute Gefahrlage durch auslaufende Salzsäure). Mündlicher VA §37 Abs.2 VwVfG; Bekanntgabe §41 Abs.1 VwVfG.',
        '<strong>Konkrete Gefahr:</strong> Auslaufende Salzsäure aus umgestürztem Tanklastzug → akute Gefahr für Leib und Leben von Verkehrsteilnehmern, Anwohnern und Einsatzkräften durch Verätzung und Einatmen von Dämpfen; Umweltgefährdung (Boden, Grundwasser) → hinreichende Wahrscheinlichkeit eines Schadens im konkreten Einzelfall.',
        '<strong>Verhaltensstörer (§17 OBG):</strong> Fahrer des Lkw (hat durch den Unfall die Gefahr kausal verursacht). <strong>Zustandsstörer (§18 OBG):</strong> Halter/Eigentümer des Lkw und Ladungseigentümer (von deren Sache – auslaufende Salzsäure – geht die Gefahr aus). <strong>Nichtstörer (§19 OBG):</strong> Grundstückseigentümer – hat die Gefahr nicht verursacht; sein Grundstück wird ausschließlich für die Sicherheitszone benötigt. Inanspruchnahme als Nichtstörer gem. §19 OBG i.V.m. §45 BHKG zulässig, wenn die drei Voraussetzungen (Störer nicht rechtzeitig erreichbar/unzureichend; Gefahr nicht anders abwendbar; geringstmögliche Belastung) erfüllt sind.',
        'Entschließungsermessen auf Null reduziert: Auslaufende Salzsäure auf Bundesstraße → unmittelbare Gefahr für Leib und Leben → Einschreiten zwingend. Auswahlermessen: Nutzung des angrenzenden Privatgrundstücks als einzig verfügbare geeignete Fläche für die Sicherheitszone (keine ausreichend große öffentliche Fläche in der nötigen Entfernung verfügbar).',
        'Legitimer Zweck: Einrichtung einer Sicherheitszone zum Schutz von Einsatzkräften und Bevölkerung. Geeignet: Nutzung des Grundstücks schafft den nötigen Sicherheitsabstand → geeignet. Erforderlich: Keine andere geeignete Fläche in der Nähe verfügbar → erforderlich. Angemessen: Temporäre Grundstücksnutzung steht nicht außer Verhältnis zur Abwehr schwerer Gesundheitsgefahren durch Salzsäure (§44 Abs.2 S.4 BHKG) → angemessen.',
        'Mündliche Duldungsanordnung als VA gem. §44 Abs.2 i.V.m. §45 BHKG: „Wir nutzen Ihr Grundstück als Sicherheitszone – Sie dulden das nach §45 BHKG." (Wer? = Einsatzkräfte; Was? = Betreten und Nutzen der Grundstücksfläche; Wann? = sofort; Wohin? = bezeichneter Bereich; Wie lange? = bis zur Freigabe durch den Einsatzleiter). Bei weiterer Weigerung: <strong>Unmittelbarer Zwang</strong> gem. §44 Abs.2 BHKG – die Feuerwehr betritt das Grundstück auch gegen den ausdrücklichen Willen des Eigentümers.',
        '§45 BHKG liegt vor: Der Grundstückseigentümer ist Nichtstörer (§19 OBG) – er hat die Gefahr nicht verursacht, sein Grundstück wurde für die Sicherheitszone in Anspruch genommen. Er hat Anspruch auf angemessene Entschädigung durch die Gemeinde gem. §45 Abs.2 BHKG.',
        'Einsatzbericht (§34 Abs.1 BHKG): Gefahrgutstoff, Maßnahmen, Grundstücksinanspruchnahme (Eigentümer, Dauer, entstandene Schäden) und Übergabe an zuständige Behörden dokumentieren. Sicherung: Grundstück räumen und in ursprünglichem Zustand übergeben; Eigentümer über Entschädigungsanspruch informieren (§24 Abs.1 Nr.2 OBG). Übergabe an Polizei (§43 Nr.1 PolG NRW) und Straßenverkehrsbehörde sicherstellen.'
      ]
    }
    ,
    {
      id:5,
      title:'Fall 5 – Betonhalle: Einsturz droht',
      sachverhalt:'Bei Betonarbeiten beschädigt ein Betonmischer einen Trägerbalken so stark, dass er wegbricht. Das Dach der Industriehalle sackt herunter und droht einzustürzen. Keine Personen mehr in der leeren Halle. Neben dem Haupteingang gibt es eine Lieferantenzufahrt auf der Rückseite. Frage: Liegt eine Gefahr vor, die in den Aufgabenbereich der Feuerwehr fällt? Was ist beim Verlassen zu beachten?',
      answers:[
        'Ermächtigungsgrundlage: §34 Abs.1 BHKG (Hilfeleistung bei technischen Notlagen) i.V.m. §44 Abs.2 BHKG (Betreten von Grundstücken, Absperrmaßnahmen). Die Absperrung des Gefahrenbereichs ist eine <strong>Allgemeinverfügung</strong> gem. §35 S.2 VwVfG – sie ist an eine unbestimmte Anzahl von Personen gerichtet (alle, die den Bereich betreten wollen). Soweit einzelne Personen konkret angesprochen werden, liegt daneben ein individueller <strong>Verwaltungsakt</strong> gem. §35 S.1 VwVfG vor.',
        'Sachlich: §1 Abs.1 i.V.m. §3 Abs.1 S.1 BHKG (technische Hilfeleistung). Örtlich: §3 Abs.1 S.1 BHKG (Gemeindegebiet). Instanziell: §3 Abs.1 S.1 BHKG (Feuerwehr). Anhörungsverzicht: §28 Abs.2 Nr.1 VwVfG (Einsturzgefahr = Gefahr im Verzug) – gilt sowohl für die Allgemeinverfügung (Absperrung) als auch für individuelle Anordnungen.',
        '<strong>Konkrete Gefahr:</strong> Der Trägerbalken ist bereits weggebrochen, das Dach sackt sichtbar ab → hinreichende Wahrscheinlichkeit eines unmittelbar bevorstehenden Einsturzes. Gefährdete Schutzgüter: Sachwerte (Hallenstruktur), Leib und Leben von Personen, die über die Lieferantenzufahrt eintreten könnten, sowie der Einsatzkräfte selbst.',
        'Absperrung als Allgemeinverfügung (§35 S.2 VwVfG) richtet sich an alle potenziell Betretenden – kein einzelner individueller Adressat erforderlich. <strong>Verhaltensstörer (§17 OBG):</strong> Betonmischer-Fahrer/Firma (hat den Balken beschädigt und damit die Gefahr kausal verursacht). <strong>Zustandsstörer (§18 OBG):</strong> Eigentümer der Halle (von seiner Sache geht die Einsturzgefahr aus). Für Kostenersatz und Weiterleitungspflichten relevant; als Adressat einer Ordnungsverfügung der Bauaufsichtsbehörde.',
        'Entschließungsermessen auf Null reduziert: Einsturzgefahr → konkrete Lebensgefahr für potenzielle Betretende und Einsatzkräfte → Handeln zwingend. Auswahlermessen: Die Feuerwehr kann die Einsturzgefahr selbst <strong>nicht beseitigen</strong> (keine Zuständigkeit/Mittel für Tragwerksicherung). Einzig verhältnismäßige Maßnahme: Absperrung und sofortige Benachrichtigung der zuständigen Fachbehörden (Bauaufsicht, THW).',
        'Legitimer Zweck: Schutz von Leib und Leben. Geeignet: Absperrung des Gefahrenbereichs verhindert Annäherung an den einsturzgefährdeten Bereich → geeignet. Erforderlich: Kein milderes gleich wirksames Mittel bei unmittelbar drohenden Einsturz → erforderlich. Angemessen: Temporäre Absperrung und Nutzungsuntersagung stehen nicht außer Verhältnis zu der abgewehrten Lebensgefahr → angemessen.',
        'Sofortmaßnahmen der Feuerwehr: (1) Absperrung des Gefahrenbereichs mit Sicherheitsabstand (mind. 1,5-fache Gebäudehöhe). (2) Sicherung <strong>beider Zugänge</strong> (Haupteingang und Lieferantenzufahrt). (3) Benachrichtigung der <strong>Bauaufsichtsbehörde</strong> (Nutzungsuntersagung und Absicherung). (4) Anforderung <strong>THW</strong> (Fachberater Statik). (5) Übergabe des Einsatzes an die zuständige Ordnungsbehörde. Beim Verlassen: Absperrung kontrolliert übergeben, keine eigene Maßnahme zur Gefahrenbeseitigung durchführen.',
        '§45 BHKG liegt nicht vor: Es wurde kein Nichtstörer (§19 OBG) in Anspruch genommen – die Absperrung als Allgemeinverfügung richtete sich gegen alle potenziell Betretenden, nicht gegen einen herangezogenen Dritten. Ein Entschädigungsanspruch nach §45 BHKG scheidet aus.',
        'Einsatzbericht (§34 Abs.1 BHKG): Einsturzgefahr (Feststellungen), Absperrmaßnahmen und benachrichtigte Behörden (Bauaufsicht, THW) dokumentieren. Sicherung: Absperrung an Ordnungsbehörde/Polizei übergeben (§43 Nr.1 PolG NRW); Bauaufsicht als zuständige Fachbehörde informieren (§24 Abs.1 Nr.2 OBG). Hallenbesitzer/Eigentümer benachrichtigen. Feuerwehr darf nach gesicherter Übergabe abrücken.'
      ]
    },
    {
      id:6,
      title:'Fall 6 – Schornsteinbrand: Wohnungszugang',
      sachverhalt:'Alarmierung zu einem Schornsteinbrand im Altbau (Seitenflügel, 5 Geschosse, je 2 Wohnungen). EG bis 2. OG lassen die Einsatzkräfte anstandslos herein. Im 3. OG: Die Nachbarwohnung ist nicht besetzt (Bewohner kommen erst morgen wieder). Der anwesende Mieter (pensionierter Feuerwehrmann) verweigert sowohl den Zutritt zu seiner Wohnung als auch jede Hilfe beim Öffnen der Nachbarwohnung. Fragen: a) Darf die verschlossene Nachbarwohnung gewaltsam geöffnet werden? b) Darf die eigene Wohnung gegen den Willen des Mieters betreten werden? c) Was ist beim Verlassen zu beachten?',
      answers:[
        'Ermächtigungsgrundlage: §34 Abs.1 BHKG (Brandbekämpfung, Verhinderung von Brandausbreitung) i.V.m. §44 Abs.2 BHKG (Betreten und gewaltsames Öffnen von Wohnungen, Art. 13 Abs.7 GG). Das gewaltsame Öffnen der <em>unbesetzten</em> Nachbarwohnung ist ein <strong>Realakt</strong> (kein Adressat vorhanden). Das Betreten der <em>besetzten</em> Wohnung gegen den Willen des Mieters ist ein <strong>Verwaltungsakt</strong> (Duldungsanordnung gem. §35 VwVfG).',
        'Sachlich: §1 Abs.1 i.V.m. §3 Abs.1 S.1 BHKG (Brandbekämpfung). Örtlich: §3 Abs.1 S.1 BHKG. Instanziell: §3 Abs.1 S.1 BHKG. <strong>Für den Realakt</strong> (gewaltsames Öffnen der unbesetzten Nachbarwohnung): VwVfG-Verfahrensanforderungen entfallen vollständig – kein Anhörungs-, Form- oder Bekanntgabeerfordernis (kein Adressat vorhanden). <strong>Für den VA</strong> (Duldungsanordnung gegenüber dem anwesenden Mieter): Anhörungsverzicht §28 Abs.2 Nr.1 VwVfG (Schornsteinbrand mit Ausbreitungsgefahr = Gefahr im Verzug); mündliche Form §37 Abs.2 VwVfG; Betretungsrecht §44 Abs.2 BHKG i.V.m. Art. 13 Abs.7 GG.',
        '<strong>Konkrete Gefahr:</strong> Schornsteinbrand im Altbau → erhöhte Brandausbreitungsgefahr auf Holzbalkendecken der oberen Geschosse; Rauchgasbelastung für Bewohner → hinreichende Wahrscheinlichkeit einer Schädigung von Sachwerten und Gesundheit der Hausbewohner im konkreten Einzelfall. Nicht bloßer Verdacht, sondern festgestellter Brand mit objektiver Ausbreitungsgefahr.',
        'a) <strong>Nachbarwohnung (unbesetzt):</strong> Kein Adressat vorhanden → Realakt. Der anwesende Nachbarmieter ist für die fremde Wohnung <strong>nicht verfügungsberechtigt</strong> – seine Weigerung, beim Öffnen zu helfen, ist rechtlich ohne Belang. b) <strong>Eigene Wohnung:</strong> Adressat ist der Mieter als Inhaber des Hausrechts. Sein Status als pensionierter Feuerwehrmann ist rechtlich irrelevant – §44 Abs.2 BHKG sieht keine Ausnahmen nach Berufsstand vor. Er ist kein Störer; die Feuerwehr nimmt ihn als Wohnungsinhaber in Anspruch.',
        'Entschließungsermessen auf Null reduziert: Schornsteinbrand mit konkreter Ausbreitungsgefahr → öffentliche Sicherheit (Gebäudeintegrität, Gesundheit der Bewohner) → Einschreiten zwingend. Auswahlermessen: Zutritt zu <em>allen</em> angrenzenden Wohnungen im Brandgeschoss und darüber/darunter ist zur Gefahrenerkundung und Brandbekämpfung erforderlich; keine milderen Alternativen verfügbar (kein Ersatzschlüssel zugänglich, Ausbreitung eilt).',
        'Legitimer Zweck: Brandbekämpfung und Verhinderung der Brandausbreitung im Altbau. Geeignet: Betreten der Wohnungen ermöglicht Kontrolle, Absicherung und ggf. direkte Brandbekämpfung vom Innenraum → geeignet. Erforderlich: Kein milderes gleich wirksames Mittel (keine Schlüssel verfügbar, Zeitdruck) → erforderlich. Angemessen: Art. 13 Abs.7 GG lässt den Eingriff bei dringender Gefahr für die öffentliche Sicherheit ausdrücklich zu; mögliche Sachschäden an der Wohnungstür stehen nicht außer Verhältnis → angemessen.',
        'a) <strong>Nachbarwohnung:</strong> Gewaltsames Öffnen gem. §44 Abs.2 BHKG i.V.m. Art. 13 Abs.7 GG als Realakt – zulässig. Ankündigung an den anwesenden Nachbarmieter nicht rechtlich erforderlich, aber empfehlenswert. b) <strong>Eigene Wohnung:</strong> Mündliche Duldungsanordnung (VA): „Wir betreten Ihre Wohnung zur Brandbekämpfung – Sie dulden dies nach §44 Abs.2 BHKG." Bei fortgesetzter Weigerung: <strong>unmittelbarer Zwang</strong> gem. §44 Abs.2 BHKG (Betreten gegen den Willen, ggf. Zurückhalten des Mieters durch körperlichen Zwang).',
        '§45 BHKG liegt bei dem anwesenden Mieter nicht vor: Der Mieter ist kein Nichtstörer im Sinne des §19 OBG i.V.m. §45 BHKG – er wurde nicht als unbeteiligter Dritter für die Gefahrenabwehr in Anspruch genommen, sondern hat lediglich die rechtmäßige Maßnahme zu dulden. Ein Entschädigungsanspruch nach §45 BHKG scheidet aus.',
        'Einsatzbericht (§34 Abs.1 BHKG): Geöffnete Wohnungen (Anschrift, Rechtsgrundlage, Zeitpunkt), Ergebnis der Kontrolle, entstandene Schäden und Verhalten des verweigernden Mieters dokumentieren. Sicherung: Geöffnete Wohnungen provisorisch verschließen; Eigentümer/Hausverwaltung und Vermieter benachrichtigen (§24 Abs.1 Nr.2 OBG). Polizei (§43 Nr.1 PolG NRW) einschalten, wenn der verweigernd auftretende Mieter weitere Maßnahmen behindert oder Straftatverdacht besteht.'
      ]
    }
  ];

  const KEY_STORAGE = 'bvi_fb_answers';
  let _tab='schema', _case=null, _step=0, _revealed=false;
  let _answers={};

  function loadAnswers(){ try{ return JSON.parse(localStorage.getItem(KEY_STORAGE)||'{}'); }catch{ return {}; } }
  function saveAnswers(d){ try{ localStorage.setItem(KEY_STORAGE,JSON.stringify(d)); }catch{} }
  function answerKey(c,s){ return 'c'+c+'s'+s; }

  function renderSchemaTab(){
    const el=document.getElementById('fb-schema-content');if(!el)return;
    el.innerHTML=STEPS.map((s,i)=>`
      <div class="fb-schema-item">
        <div class="fb-schema-head" onclick="this.parentElement.classList.toggle('fb-open')">
          <span class="fb-schema-num">${String(i+1).padStart(2,'0')}</span>
          <span class="fb-schema-title">${s.title}</span>
          <span class="fb-schema-law">${s.law}</span>
          <span class="fb-chevron">›</span>
        </div>
        <div class="fb-schema-body">${s.schema}</div>
      </div>
    `).join('');
  }

  function renderCasesTab(){
    const el=document.getElementById('fb-cases-content');if(!el)return;
    _answers=loadAnswers();
    if(_case===null){
      el.innerHTML=`<p class="fb-cases-intro">Wähle einen Fall aus, um ihn nach dem 8-Punkte-Schema zu bearbeiten:</p>
      <div class="fb-case-cards">`+CASES.map(c=>`
        <div class="fb-case-card" onclick="FALLBEARBEITUNG.selectCase(${c.id-1})">
          <div class="fb-case-num">Fall ${c.id}</div>
          <div class="fb-case-title">${c.title.replace(/^Fall \d+ – /,'')}</div>
        </div>`).join('')+`</div>`;
    } else {
      const c=CASES[_case];
      const s=STEPS[_step];
      const savedKey=answerKey(_case,_step);
      const savedText=(_answers[savedKey]||'');
      el.innerHTML=`
        <div class="fb-case-nav">
          <button class="fb-back-case" onclick="FALLBEARBEITUNG.backToList()">← Fallauswahl</button>
          <span class="fb-case-badge">Fall ${c.id} · Schritt ${_step+1}/${STEPS.length}</span>
        </div>
        <div class="fb-sachverhalt"><strong>Sachverhalt:</strong> ${c.sachverhalt}</div>
        <div class="fb-step-progress"><div class="fb-step-fill" style="width:${((_step)/STEPS.length)*100}%"></div></div>
        <div class="fb-step-block">
          <div class="fb-step-header">
            <span class="fb-step-num">${_step+1}</span>
            <span class="fb-step-name">${s.title}</span>
            <span class="fb-step-law-badge">${s.law}</span>
          </div>
          <p class="fb-step-prompt">${s.prompt}</p>
          <textarea class="fb-textarea" id="fb-ta" placeholder="Schreibe deine Antwort hier…" rows="5">${xss(savedText)}</textarea>
          <button class="fb-reveal-btn${_revealed?' hidden':''}" onclick="FALLBEARBEITUNG.reveal()" id="fb-reveal">Musterlösung anzeigen</button>
          <div class="fb-answer${_revealed?'':' hidden'}" id="fb-answer">${c.answers[_step]}</div>
          <div class="fb-step-actions">
            <button class="fb-prev-btn${_step===0?' hidden':''}" onclick="FALLBEARBEITUNG.prevStep()">← Zurück</button>
            <button class="fb-next-btn${_revealed?'':' hidden'}" id="fb-next" onclick="FALLBEARBEITUNG.nextStep()">${_step===STEPS.length-1?'Fall abschließen ✓':'Nächster Punkt →'}</button>
          </div>
        </div>
        <div class="fb-step-dots">${STEPS.map((_,i)=>`<span class="fb-dot${i===_step?' fb-dot-active':i<_step?' fb-dot-done':''}" onclick="FALLBEARBEITUNG.goToStep(${i})" title="Zu Punkt ${i+1} springen">${i+1}</span>`).join('')}</div>
      `;
      const ta=document.getElementById('fb-ta');
      if(ta) ta.addEventListener('input',()=>{
        const d=loadAnswers();d[savedKey]=ta.value;saveAnswers(d);
      });
    }
  }

  return {
    init(){
      this.setTab('schema');
    },
    setTab(t){
      _tab=t;
      document.getElementById('fb-tab-schema')?.classList.toggle('active',t==='schema');
      document.getElementById('fb-tab-cases')?.classList.toggle('active',t==='cases');
      document.getElementById('fb-schema-content')?.classList.toggle('hidden',t!=='schema');
      document.getElementById('fb-cases-content')?.classList.toggle('hidden',t!=='cases');
      if(t==='schema') renderSchemaTab();
      else renderCasesTab();
    },
    selectCase(idx){
      _case=idx;_step=0;_revealed=false;
      renderCasesTab();
    },
    backToList(){
      _case=null;_step=0;_revealed=false;
      renderCasesTab();
    },
    reveal(){
      const ta=document.getElementById('fb-ta');
      if(ta){ const d=loadAnswers();d[answerKey(_case,_step)]=ta.value;saveAnswers(d);_answers=d; }
      _revealed=true;
      document.getElementById('fb-reveal')?.classList.add('hidden');
      document.getElementById('fb-answer')?.classList.remove('hidden');
      document.getElementById('fb-next')?.classList.remove('hidden');
    },
    nextStep(){
      if(_step<STEPS.length-1){ _step++;_revealed=false;renderCasesTab(); }
      else { _case=null;_step=0;_revealed=false;renderCasesTab(); }
    },
    prevStep(){
      if(_step>0){ _step--;_revealed=true;renderCasesTab(); }
    },
    goToStep(i){
      if(i>=0&&i<STEPS.length){
        // Aktuelle Antwort speichern bevor Wechsel
        const ta=document.getElementById('fb-ta');
        if(ta){ _answers[answerKey(_case,_step)]=ta.value; saveAnswers(_answers); }
        _step=i;_revealed=false;renderCasesTab();
      }
    }
  };
})();


/* ══════════════════════════════════════════════════════════════
   UEBUNGSKLAUSUR – Interaktive Übungsklausur Einsatzrecht
══════════════════════════════════════════════════════════════ */
const UEBUNGSKLAUSUR = (function(){
  const KEY = 'bvi_uk_scores';
  let _step=0, _revealed=false, _timerOn=false, _timeLeft=3600, _timerRef=null;
  let _scores={};

  const CONTEXTS = {
    bhkg27:'<div class="uk-context"><span class="uk-ctx-label">§ 27 BHKG – Brandsicherheitswachen (Abs. 1):</span> Veranstaltungen, bei denen eine erhöhte Brandgefahr besteht und bei Ausbruch eines Brandes eine große Anzahl von Personen gefährdet ist, sind der Gemeinde rechtzeitig anzuzeigen. Die Gemeinde entscheidet über eine Brandsicherheitswache und kann Auflagen erteilen.<br><br><span class="uk-ctx-label">Situation:</span> Als Mitarbeiter der Gemeinde bearbeiten Sie den Antrag von Herrn Meyer (Veranstaltung fällt unter §27 Abs. 1 BHKG). Ergebnis: Herr Meyer muss 3 Brandsicherheitswachen stellen. Herr Meyer wurde angehört und hat Widerspruch angekündigt.</div>',
    pkw:'<div class="uk-context"><span class="uk-ctx-label">Sachverhalt:</span> Bei Tiefbauarbeiten im öffentlichen Straßenland rutscht durch abgleitendes Erdreich ein falsch parkender PKW in die Baugrube. Es befinden sich keine Personen mehr im PKW. Nach Erkundung: Keine auslaufenden Betriebsstoffe.</div>',
    brand:'<div class="uk-context"><span class="uk-ctx-label">Sachverhalt:</span> Alarmierung zu einem Wohn- und Geschäftshaus wegen intensivem Brandrauchgeruch. Im Keller zwei Türen: <strong>Links</strong> – stark gesicherte Kellertür einer geschlossenen Wein- und Zigarrenhandlung (kein Ansprechpartner). <strong>Rechts</strong> – Keller des meldenden Mieters. Dieser verweigert den Zutritt mit der Begründung, er habe seinen Keller bereits kontrolliert. Der Geruch wird im Keller stärker.</div>'
  };

  const QUESTIONS = [
    {
      id:1, nr:'Frage 1', punkte:1, ctx:'bhkg27',
      text:'Welche Form des Verwaltungshandelns wählen Sie, um Herrn Meyer über Ihre Entscheidung zu informieren?',
      answer:'<strong>Verwaltungsakt mit Nebenbestimmung</strong> – konkret eine <strong>Auflage</strong> gem. §36 Abs. 2 Nr. 4 VwVfG i.V.m. §27 Abs. 1 S. 2–3 BHKG.<br><br>Die Gemeinde erlässt einen schriftlichen Bescheid (§37 Abs. 3 VwVfG), der die Zulassung der Veranstaltung mit der Auflage verbindet, drei Brandsicherheitswachen zu stellen. Die Auflage begründet eine selbstständige, vollstreckbare Pflicht.'
    },
    {
      id:2, nr:'Frage 2', punkte:5, ctx:'bhkg27',
      text:'Was sind die wesentlichen Merkmale der gewählten Handlungsform?',
      answer:'Ein <strong>Verwaltungsakt (§35 VwVfG)</strong> muss alle 6 Merkmale kumulativ erfüllen:<ol><li><strong>Hoheitliche Maßnahme</strong> – Die Gemeinde handelt einseitig mit Entscheidungscharakter (Verfügung/Bescheid), nicht auf Augenhöhe wie bei einem Vertrag.</li><li><strong>Einer Behörde</strong> – Die Gemeinde ist Träger öffentlicher Verwaltung und handelt als zuständige Behörde nach BHKG.</li><li><strong>Auf dem Gebiet des öffentlichen Rechts</strong> – Die Maßnahme stützt sich auf §27 BHKG (öffentliches Sonderrecht), nicht auf Zivilrecht.</li><li><strong>Regelung</strong> – Die Auflage begründet unmittelbar eine Pflicht für Herrn Meyer; bloße Auskünfte ohne Bindungswirkung sind keine Regelung.</li><li><strong>Eines Einzelfalls</strong> – Die Auflage richtet sich konkret-individuell an Herrn Meyer (nicht generell-abstrakt wie ein Gesetz).</li><li><strong>Mit Außenwirkung</strong> – Die Auflage trifft Herrn Meyer direkt als Bürger; behördeninterne Weisungen haben keine Außenwirkung und sind kein VA.</li></ol>'
    },
    {
      id:3, nr:'Frage 3', punkte:4, ctx:'bhkg27',
      text:'Welche Möglichkeit haben Sie bei der Erteilung Ihrer Auflage, die eine Umsetzung trotz des angekündigten Widerspruchs sicherstellt? Was müssen Sie dabei beachten?',
      answer:'<strong>Anordnung der sofortigen Vollziehung</strong> gem. §80 Abs. 2 Nr. 4 VwGO.<br><br><strong>Ausgangslage:</strong> Widerspruch und Anfechtungsklage haben grundsätzlich aufschiebende Wirkung (§80 Abs. 1 VwGO). Der angekündigte Widerspruch würde die Auflage zunächst nicht vollziehbar machen.<br><br><strong>Zu beachten:</strong><ul><li><strong>Besonderes öffentliches Interesse</strong> muss vorliegen (hier: Brandschutz und Sicherheit der Veranstaltungsbesucher).</li><li><strong>Schriftliche Begründung</strong> zwingend erforderlich (§80 Abs. 3 S. 1 VwGO) – das besondere Vollziehungsinteresse muss konkret dargelegt werden; Formeln genügen nicht.</li><li>Die Anordnung kann direkt in den Bescheid aufgenommen werden.</li><li>Herr Meyer kann beim Verwaltungsgericht Antrag auf <strong>Wiederherstellung der aufschiebenden Wirkung</strong> stellen (§80 Abs. 5 VwGO).</li></ul>'
    },
    {
      id:4, nr:'Frage 4', punkte:5, ctx:null,
      text:'Wann liegt eine Gefahr im Sinne des Gefahrenabwehrrechts vor?',
      answer:'Eine <strong>Gefahr</strong> liegt vor, wenn bei <strong>ungehindertem Fortgang der Ereignisse</strong> mit <strong>hinreichender Wahrscheinlichkeit</strong> ein <strong>Schaden</strong> für ein polizeiliches Schutzgut (öffentliche Sicherheit/Ordnung – insbes. Leben, Gesundheit, Eigentum) eintreten wird.<br><br>Maßgeblich ist eine <strong>ex-ante-Betrachtung</strong> aus Sicht eines sorgfältigen, sachkundigen Beamten zum Zeitpunkt des Handelns – nicht die nachträgliche Beurteilung.<br><br>Das erforderliche Maß der Wahrscheinlichkeit richtet sich nach der <strong>Schwere des drohenden Schadens</strong> (umgekehrt proportionales Verhältnis): Je gewichtiger das bedrohte Rechtsgut, desto geringere Wahrscheinlichkeit genügt.'
    },
    {
      id:5, nr:'Frage 5', punkte:5, ctx:null,
      text:'Erklären Sie den Unterschied zwischen einer konkreten Gefahr und einer Anscheinsgefahr und erläutern Sie kurz, was bei der Anscheinsgefahr zu beachten ist.',
      answer:'<strong>Konkrete Gefahr:</strong> Eine auf den tatsächlichen Umständen des Einzelfalls beruhende, hinreichend wahrscheinliche Schädigung eines Schutzguts – sowohl ex-ante als auch ex-post liegt die gefährliche Sachlage tatsächlich vor.<br><br><strong>Anscheinsgefahr:</strong> Eine Sachlage, die bei verständiger ex-ante-Beurteilung als konkrete Gefahr erscheint, sich aber ex-post als ungefährlich herausstellt (die Gefahr war nur scheinbar vorhanden).<br><br><strong>Bei der Anscheinsgefahr zu beachten:</strong><ul><li>Die Maßnahme bleibt <strong>rechtmäßig</strong>, wenn die ex-ante-Einschätzung des sorgfältigen, sachkundigen Beamten vertretbar war.</li><li>Maßgeblich ist ausschließlich die <strong>ex-ante-Perspektive</strong>; ex-post-Erkenntnisse ändern die Rechtmäßigkeit nicht.</li><li>Liegt eine <strong>Putativgefahr</strong> vor (Behörde hätte bei sorgfältiger Prüfung erkannt, dass keine Gefahr bestand), ist die Maßnahme rechtswidrig.</li></ul>'
    },
    {
      id:6, nr:'Frage 6', punkte:10, ctx:null,
      text:'Welche Funktion haben die Grundrechte? Mit welchen Grundrechten haben Sie es ggf. im Feuerwehreinsatz zu tun? Unter welchen Voraussetzungen können Grundrechte eingeschränkt werden? Gilt das für alle Grundrechte?',
      answer:'<strong>Funktionen der Grundrechte:</strong><ul><li><strong>Abwehrrechte</strong> (primäre Funktion): Schutz des Bürgers vor staatlichen Eingriffen</li><li><strong>Staatliche Schutzpflichten</strong>: Staat muss Bürger vor Grundrechtsverletzungen durch Dritte schützen</li><li><strong>Institutionelle Garantien</strong>: Schutz von Einrichtungen (z.B. Ehe und Familie, Art. 6 GG)</li><li><strong>Objektive Wertordnung</strong>: Grundrechte strahlen auf die gesamte Rechtsordnung aus</li></ul><strong>Im Feuerwehreinsatz relevant (gem. §48 BHKG):</strong><ul><li><strong>Art. 2 Abs. 1 i.V.m. Art. 1 Abs. 1 GG</strong>: Informationelle Selbstbestimmung</li><li><strong>Art. 2 Abs. 2 S. 1 GG</strong>: Recht auf körperliche Unversehrtheit</li><li><strong>Art. 2 Abs. 2 S. 2 GG</strong>: Freiheit der Person – z.B. bei Sperrmaßnahmen</li><li><strong>Art. 13 GG</strong>: Unverletzlichkeit der Wohnung – Eingriff gem. §44 Abs. 2 BHKG i.V.m. Art. 13 Abs. 7 GG</li></ul><strong>Voraussetzungen der Einschränkung:</strong><ul><li><strong>Gesetzesvorbehalt</strong>: Nur durch Gesetz oder aufgrund eines Gesetzes (Art. 19 Abs. 1 S. 1 GG)</li><li><strong>Verhältnismäßigkeit</strong>: Legitimer Zweck, Geeignetheit, Erforderlichkeit, Angemessenheit</li><li><strong>Wesensgehaltsgarantie</strong>: Kernbestand darf nicht angetastet werden (Art. 19 Abs. 2 GG)</li><li><strong>Zitiergebot</strong>: Das eingeschränkte Grundrecht muss im Gesetz benannt sein (Art. 19 Abs. 1 S. 2 GG)</li></ul><strong>Gilt nicht für alle:</strong> Nein – Art. 1 Abs. 1 GG (<strong>Menschenwürde</strong>) ist absolutes, einschränkungsfestes Grundrecht.'
    },
    {
      id:7, nr:'Frage 7', punkte:4, ctx:null,
      text:'Nennen Sie die vier Gründe, aus denen entsprechend der Festlegungen des BVerfG eine Nebentätigkeit untersagt werden kann.',
      answer:'Entsprechend den Festlegungen des BVerfG kann eine Nebentätigkeit untersagt werden, wenn:<ol><li>Die <strong>Arbeitskraft</strong> des Beamten beeinträchtigt wird (zeitliche oder körperliche Überlastung)</li><li>Eine <strong>Pflichtenkollision</strong> besteht (die Nebentätigkeit steht im Widerspruch zu dienstlichen Pflichten)</li><li>Das <strong>Ansehen des Berufsbeamtentums</strong> geschädigt wird</li><li><strong>Staatliche oder fiskalische Interessen</strong> berührt werden</li></ol>'
    },
    {
      id:8, nr:'Frage 8', punkte:9, ctx:'pkw',
      text:'Prüfen Sie, ob hier eine Gefahr vorliegt, deren Beseitigung in den Aufgabenbereich der Feuerwehr fällt. Sofern nicht: Skizzieren Sie kurz, worauf Sie beim Verlassen der Einsatzstelle achten sollten.',
      answer:'<strong>Prüfung gem. §1 Abs. 1 BHKG:</strong><ul><li>Keine Personen im PKW → keine Menschenrettung erforderlich</li><li>Keine auslaufenden Betriebsstoffe → keine Umweltgefährdung</li><li>Kein Brand und kein Brandrisiko erkennbar</li><li>PKW in Baugrube → reiner Sachschaden ohne akute Gefahr für öffentliche Sicherheit</li></ul><strong>Ergebnis:</strong> Kein Feuerwehreinsatz. Das Bergen des PKW fällt nicht in den Aufgabenbereich der Feuerwehr. Zuständig: Eigentümer/Versicherung (Abschleppunternehmer), Polizei, Ordnungsamt, Straßenverkehrsbehörde.<br><br><strong>Beim Verlassen zu beachten:</strong><ul><li><strong>Absicherung</strong>: Gefahrenbereich absperren (offene Baugrube = Gefahrenstelle für Verkehr und Fußgänger)</li><li><strong>Zuständige Stellen informieren</strong>: Polizei, Ordnungsamt, Straßenverkehrsbehörde</li><li><strong>Verantwortliche benachrichtigen</strong>: Bauherr/Bauleitung, ggf. Fahrzeugeigentümer</li><li><strong>Dokumentation</strong>: Einsatzbericht mit Feststellungen und Begründung</li><li>Übergabe an zuständige Stelle sicherstellen, bevor die Feuerwehr abrückt</li></ul>'
    },
    {
      id:9, nr:'Frage 9 (a–c)', punkte:9, ctx:'brand',
      text:'a) Dürfen Sie den Keller der Gewerbeeinheit (links) gewaltsam öffnen? Welche Voraussetzungen müssen vorliegen? b) Dürfen Sie den Keller des Mieters (rechts) gegen seinen Willen betreten? c) Was müssen Sie beim Verlassen beachten?',
      answer:'<strong>a) Gewerbekeller (links) gewaltsam öffnen – Ja</strong>, gem. §44 Abs. 2 BHKG i.V.m. Art. 13 Abs. 7 GG.<br>Voraussetzungen: <strong>Anscheinsgefahr</strong> liegt vor – intensiver, stärker werdender Brandrauchgeruch ergibt ex-ante die begründete Annahme einer konkreten Brandgefahr. Art. 13 GG gilt auch für Geschäftsräume; Art. 13 Abs. 7 GG erlaubt den Eingriff durch Gesetz (§44 Abs. 2 BHKG). Da die Gewerbeeinheit geschlossen und kein Adressat vorhanden ist, handelt die Feuerwehr als <strong>Realakt</strong>. Verhältnismäßigkeit: gewalt. Öffnung als einzig verfügbares Erkundungsmittel – geeignet, erforderlich, angemessen.<br><br><strong>b) Keller des Mieters (rechts) – Ja</strong>, gem. §44 Abs. 2 BHKG i.V.m. Art. 13 Abs. 7 GG.<br>Die Aussage des Mieters reicht nicht aus, die Anscheinsgefahr auszuschließen. Mündliche <strong>Duldungsanordnung</strong> (VA gem. §35 VwVfG): „Sie dulden das Betreten Ihres Kellers nach §44 Abs. 2 BHKG." Bei weiterer Weigerung: unmittelbarer Zwang gem. §44 Abs. 2 BHKG.<br><br><strong>c) Beim Verlassen:</strong><ul><li>Geöffnete Räume sichern und wieder provisorisch verschließen</li><li>Eigentümer/Vermieter/Hausverwaltung benachrichtigen (insb. für den Gewerbekeller)</li><li>Vollständige Dokumentation im Einsatzbericht (Maßnahmen, Rechtsgrundlagen, Gründe, Zeitpunkte)</li><li>Sicherstellen, dass keine Gefahrenursache zurückbleibt (Glutnester, techn. Defekte)</li><li>Meldenden Mieter über das Ergebnis informieren</li></ul>'
    }
  ];

  const TOTAL_PTS = QUESTIONS.reduce(function(s,q){return s+q.punkte;},0);

  function loadScores(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  function saveScores(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} }
  function scoreKey(id){ return 'q'+id; }
  function fmtTime(s){ return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }

  function startTimer(){
    if(_timerRef) return;
    _timerOn=true;
    _timerRef=setInterval(function(){
      if(_timeLeft>0){ _timeLeft--; updateTimerDisplay(); }
      else{ stopTimer(); var el=document.getElementById('uk-timer'); if(el) el.style.color='#ef4444'; }
    },1000);
    updateTimerDisplay();
  }

  function stopTimer(){
    if(_timerRef){ clearInterval(_timerRef); _timerRef=null; }
    _timerOn=false;
  }

  function updateTimerDisplay(){
    var el=document.getElementById('uk-timer-val'); if(el) el.textContent=fmtTime(_timeLeft);
    var el2=document.getElementById('uk-timer-val2'); if(el2) el2.textContent=fmtTime(_timeLeft);
    var btn=document.getElementById('uk-timer-btn'); if(btn) btn.textContent=_timerOn?'⏸ Pausieren':'▶ Timer starten';
  }

  function dotsHtml(){
    return QUESTIONS.map(function(q,i){
      var sc=_scores[scoreKey(q.id)];
      var cls='fb-dot'+(i===_step?' fb-dot-active':sc!==undefined?' fb-dot-done':'');
      return '<span class="'+cls+'" onclick="UEBUNGSKLAUSUR.goToQ('+i+')" title="Zu Frage '+(i+1)+' springen">'+(i+1)+'</span>';
    }).join('');
  }

  function renderStart(){
    var el=document.getElementById('uk-content'); if(!el) return;
    _scores=loadScores();
    var scored=QUESTIONS.filter(function(q){return _scores[scoreKey(q.id)]!==undefined;});
    var totalScored=scored.reduce(function(s,q){return s+(_scores[scoreKey(q.id)]||0);},0);
    var progress=scored.length;
    var overviewRows=QUESTIONS.map(function(q){
      var pts=_scores[scoreKey(q.id)];
      var done=pts!==undefined;
      var ptsHtml=done?('<span class="uk-q-pts-got">'+pts+'/'+q.punkte+'</span>'):'<span class="uk-q-pts-open">–</span>';
      return '<div class="uk-q-row'+(done?' uk-q-done':'')+'" onclick="UEBUNGSKLAUSUR.goToQ('+(q.id-1)+')"><span class="uk-q-nr">'+q.nr+'</span><span class="uk-q-pts-max">'+q.punkte+' Pkt.</span>'+ptsHtml+'</div>';
    }).join('');
    var progressHtml=progress>0?('<div class="uk-progress-row"><span>Fortschritt: '+progress+'/'+QUESTIONS.length+' bewertet</span><span>'+totalScored+'/'+TOTAL_PTS+' Punkte ('+Math.round(totalScored/TOTAL_PTS*100)+' %)</span></div>'):'';
    var resetBtn=progress>0?'<button class="uk-timer-reset" style="margin-left:auto" onclick="UEBUNGSKLAUSUR.resetAll()">↺ Neu beginnen</button>':'';
    var resultBtn=progress===QUESTIONS.length?'<button class="uk-result-btn" onclick="UEBUNGSKLAUSUR.showResult()">Auswertung anzeigen</button>':'';
    var timerResetBtn=_timeLeft<3600?'<button class="uk-timer-reset" onclick="UEBUNGSKLAUSUR.resetTimer()">↺ Zurücksetzen</button>':'';
    el.innerHTML='<div class="uk-start"><div class="uk-intro-box"><div class="uk-intro-title">Übungsklausur · Einsatzrecht</div><div class="uk-intro-meta">'+QUESTIONS.length+' Fragen · '+TOTAL_PTS+' Punkte · Bearbeitungszeit: 60 Min.</div><div class="uk-intro-desc">Bearbeite jede Frage im Freitextfeld, zeige dann die Musterlösung an und bewerte dich selbst. Am Ende erhältst du deine Gesamtpunktzahl.</div></div><div class="uk-timer-box"><span id="uk-timer">⏱ <span id="uk-timer-val">'+fmtTime(_timeLeft)+'</span></span><button id="uk-timer-btn" class="uk-timer-toggle" onclick="UEBUNGSKLAUSUR.toggleTimer()">'+(_timerOn?'⏸ Pausieren':'▶ Timer starten')+'</button>'+timerResetBtn+resetBtn+'</div><div class="uk-q-overview">'+overviewRows+'</div>'+progressHtml+'<button class="uk-start-btn" onclick="UEBUNGSKLAUSUR.goToQ(0)">'+(progress>0?'Klausur fortsetzen →':'Klausur beginnen →')+'</button>'+resultBtn+'</div>';
  }

  function renderQuestion(){
    var el=document.getElementById('uk-content'); if(!el) return;
    _scores=loadScores();
    var q=QUESTIONS[_step];
    var savedTa=_scores['ta_q'+q.id]||'';
    var myPts=_scores[scoreKey(q.id)];
    var scoreBtns=Array.from({length:q.punkte+1},function(_,i){return '<button class="uk-score-btn'+(myPts===i?' uk-score-active':'')+'" onclick="UEBUNGSKLAUSUR.setScore('+i+')">'+i+'</button>';}).join('');
    var scoreGot=myPts!==undefined?('<span class="uk-score-got">'+myPts+'/'+q.punkte+' Pkt. gespeichert</span>'):'';
    var ctxHtml=q.ctx?CONTEXTS[q.ctx]:'';
    var prevBtn=_step===0?'':'<button class="fb-prev-btn" onclick="UEBUNGSKLAUSUR.prevQ()">← Zurück</button>';
    var nextLabel=_step===QUESTIONS.length-1?'Auswertung →':'Nächste Frage →';
    var nextFn=_step===QUESTIONS.length-1?'UEBUNGSKLAUSUR.showResult()':'UEBUNGSKLAUSUR.nextQ()';
    el.innerHTML='<div class="uk-q-header"><button class="uk-back-btn" onclick="UEBUNGSKLAUSUR.showStart()">← Übersicht</button><span class="uk-q-badge">'+q.nr+' · '+q.punkte+(q.punkte===1?' Punkt':' Punkte')+'</span><span class="uk-timer-inline">⏱ <span id="uk-timer-val2">'+fmtTime(_timeLeft)+'</span></span></div>'+ctxHtml+'<div class="uk-question"><p>'+q.text+'</p></div><textarea class="fb-textarea" id="uk-ta" placeholder="Schreibe deine Antwort hier…" rows="6">'+xss(savedTa)+'</textarea><button class="fb-reveal-btn'+(_revealed?' hidden':'')+'" id="uk-reveal" onclick="UEBUNGSKLAUSUR.reveal()">Musterlösung anzeigen</button><div class="fb-answer'+(_revealed?'':' hidden')+'" id="uk-answer">'+q.answer+'</div><div class="uk-score-row'+(_revealed?'':' hidden')+'" id="uk-score-row"><span class="uk-score-label">Meine Punkte:</span><div class="uk-score-btns">'+scoreBtns+'</div>'+scoreGot+'</div><div class="fb-step-actions">'+prevBtn+'<button class="fb-next-btn" onclick="'+nextFn+'">'+nextLabel+'</button></div><div class="fb-step-dots">'+dotsHtml()+'</div>';
  }

  function renderResult(){
    var el=document.getElementById('uk-content'); if(!el) return;
    stopTimer();
    _scores=loadScores();
    var total=QUESTIONS.reduce(function(s,q){return s+(_scores[scoreKey(q.id)]||0);},0);
    var pct=Math.round(total/TOTAL_PTS*100);
    var grade=pct>=90?'Sehr gut':pct>=80?'Gut':pct>=70?'Befriedigend':pct>=60?'Ausreichend':'Nicht bestanden';
    var gradeCol=pct>=60?'#4ACD90':'#ef4444';
    var rows=QUESTIONS.map(function(q){
      var got=_scores[scoreKey(q.id)];
      var done=got!==undefined;
      var col=done?(got===q.punkte?'#4ACD90':got>0?'var(--c-gold)':'#ef4444'):'var(--c-slate-l)';
      return '<tr><td>'+q.nr+'</td><td>'+q.punkte+'</td><td style="color:'+col+';">'+(done?got:'–')+'</td><td><button class="uk-jump-btn" onclick="UEBUNGSKLAUSUR.goToQ('+(q.id-1)+')">→</button></td></tr>';
    }).join('');
    el.innerHTML='<div class="uk-result"><div class="uk-result-header">Auswertung</div><div class="uk-result-score" style="color:'+gradeCol+';">'+total+' / '+TOTAL_PTS+' Punkte</div><div class="uk-result-pct" style="color:'+gradeCol+';">'+pct+' % – '+grade+'</div><div class="uk-result-bar"><div class="uk-result-fill" style="width:'+pct+'%;background:'+gradeCol+';"></div></div><table class="uk-result-table"><thead><tr><th>Frage</th><th>Max.</th><th>Erreicht</th><th></th></tr></thead><tbody>'+rows+'</tbody></table><div class="uk-result-actions"><button class="uk-start-btn" onclick="UEBUNGSKLAUSUR.showStart()">← Zur Übersicht</button><button class="uk-reset-btn" onclick="UEBUNGSKLAUSUR.resetAll()">Neu beginnen</button></div></div>';
  }

  return {
    init:function(){
      _scores=loadScores();
      this.showStart();
    },
    showStart:function(){
      _step=0; _revealed=false;
      renderStart();
    },
    goToQ:function(i){
      var ta=document.getElementById('uk-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      _step=i; _revealed=false;
      renderQuestion(); window.scrollTo({top:0,behavior:'instant'});
    },
    nextQ:function(){
      var ta=document.getElementById('uk-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      if(_step<QUESTIONS.length-1){_step++;_revealed=false;renderQuestion();window.scrollTo({top:0,behavior:'instant'});}
    },
    prevQ:function(){
      var ta=document.getElementById('uk-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      if(_step>0){_step--;_revealed=true;renderQuestion();window.scrollTo({top:0,behavior:'instant'});}
    },
    reveal:function(){
      var ta=document.getElementById('uk-ta');
      if(ta){var d=loadScores();d['ta_q'+QUESTIONS[_step].id]=ta.value;saveScores(d);_scores=d;}
      _revealed=true;
      document.getElementById('uk-reveal')?.classList.add('hidden');
      document.getElementById('uk-answer')?.classList.remove('hidden');
      document.getElementById('uk-score-row')?.classList.remove('hidden');
    },
    setScore:function(pts){
      var d=loadScores();d[scoreKey(QUESTIONS[_step].id)]=pts;saveScores(d);_scores=d;
      renderQuestion();
      _revealed=true;
      document.getElementById('uk-answer')?.classList.remove('hidden');
      document.getElementById('uk-score-row')?.classList.remove('hidden');
    },
    showResult:function(){renderResult();},
    toggleTimer:function(){
      if(_timerOn) stopTimer(); else startTimer();
      updateTimerDisplay();
    },
    resetTimer:function(){stopTimer();_timeLeft=3600;renderStart();},
    resetAll:function(){
      if(!confirm('Alle Antworten und Punkte zurücksetzen?')) return;
      localStorage.removeItem(KEY);_scores={};_step=0;_revealed=false;
      stopTimer();_timeLeft=3600;
      renderStart();
    }
  };
})();

/* ── IdF Münster Stundenplan Modul 3.5 ──────────────────────────────────── */
/* ── Notizen zu Stundenplan-Einträgen ───────────────────────────────────── */
const PLANNOTE=(function(){
  const KEY='bvi_plan_notes';
  let box=null, cur='', el=null;
  const all=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ return {}; } };
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function build(){
    box=document.createElement('div'); box.id='pn-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Stundenplan-Eintrag');
    box.innerHTML='<div class="cu-card"><button class="sh-x" aria-label="Schließen">×</button><div class="pn-when"></div><div class="sh-t pn-title" style="padding:0"></div><div class="pn-meta"></div>'
      +'<label>Meine Notiz<textarea id="pn-t" rows="4" maxlength="800" placeholder="z. B. Unterlagen mitbringen"></textarea></label></div>';
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
    box.querySelector('#pn-t').addEventListener('input',e=>{
      const a=all(); const v=e.target.value.trim();
      if(v) a[cur]=v; else delete a[cur];
      try{ localStorage.setItem(KEY,JSON.stringify(a)); }catch(x){}
    });
  }
  function open(item){
    if(!box) build();
    el=item; cur=item.dataset.k;
    const [ymd,,]=cur.split('|');
    const d=new Date(ymd+'T00:00').toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});
    const t=item.querySelector('.idf-time'); 
    box.querySelector('.pn-when').textContent=d+' · '+(t?t.textContent.replace(/(\d)(\d{2}:\d{2})/,'$1 – $2'):'');
    box.querySelector('.pn-title').textContent=item.querySelector('.idf-name').textContent.replace(/\s*✎\s*$/,'');
    const m=item.querySelector('.idf-meta'); box.querySelector('.pn-meta').textContent=m?m.textContent:'';
    box.querySelector('#pn-t').value=all()[cur]||'';
    box.hidden=false; box.querySelector('#pn-t').focus({preventScroll:true});
  }
  function close(){
    if(!box||box.hidden) return; box.hidden=true;
    if(typeof IDF_PLAN!=='undefined') IDF_PLAN.redraw();
  }
  return {open,get:k=>all()[k]||''};
})();

const IDF_PLAN = (function(){
  // Eintrag: "Zeit|Titel|Art|Raum|Hinweis" · Zeit = UE ("1-2") oder Uhrzeit ("09:00-09:15", "19:00", "EVA")
  // Art: hi = Schlüsseltermin, ex = Exkursion, ar = Anreise/Abreise/frei
  const UE_S=['07:45','08:30','09:45','10:30','11:30','12:15','14:00','14:45'];
  const UE_E=['08:30','09:15','10:30','11:15','12:15','13:00','14:45','15:30'];
  const TEL={
    spahl:[['Jörn Ruschenburg','-3202'],['Frank Spahlholz','-3223']],
    babz:[['Christoph Schaaf (BABZ)','0228 99550-5205'],['Thorsten Ohm (BABZ)','-5206']]
  };
  const SG='Sachgebiete 1 bis 4|hi|C-205, C-213, C-214, C-215|in vier Gruppen rollierend';
  const VB1_G1=[
    ['1-2|Anreise|ar','3|Begrüßung|hi|C-1|Begrüßung durch den Direktor · Hemd/Krawatte','4|Einführung in das Teilmodul VB||B1-106','5-6|Rechtsgrundlagen Baurecht||B1-106','7-8|Gebäudeklassen||B1-106'],
    ['1-2|Baustoffnormung||B1-106','3-6|Bauliche Trennung||B1-106','7-8|Löschwasserversorgung||B1-106'],
    ['1-6|System Rettungswege||B1-106','7-8|Brandmeldeanlagen||B1-106','19:00|Vortrag @fire|hi|C-1|freiwillig'],
    ['1-2|Einführung Sonderbau||B1-106','3-6|Beherbergungsstätten||B1-106','7-8|Brandschutznachweis||B1-106'],
    ['1-4|Versammlungsstätten||B1-106','5-6|Löschanlagen||B1-106','7|Abreise|ar']];
  const VB1_G2=[
    ['1-2|Anreise|ar','3|Einführung in das Teilmodul VB||B1-106','4-5|Rechtsgrundlagen Baurecht||B1-106','6-7|Gebäudeklassen||B1-106','8|Baustoffnormung||B1-106'],
    ['1-4|Baustoffnormung||B1-106','5-6|Bauliche Trennung||B1-106','7-8|Löschwasserversorgung||B1-106'],
    VB1_G1[2].slice(0,2), VB1_G1[3], VB1_G1[4]];
  const VB2=(mi,doLast,fr)=>[
    ['1-2|Anreise|ar','3-6|Verkaufsstätten||B1-106','7-8|Einführung Stellungnahme||B1-106'],
    ['1-2|Stellungnahme Übung|hi|B1-106','3-5|Garagen||B1-106','6-8|Hochhäuser||B1-106'],
    ['1-4|Industriebau||B1-106','5-8|Brandschutzsachverständige||B1-106',...mi],
    ['07:45-ca. 11:00|Stellungnahme Übung|hi|B1-106','ca. 11:00-13:00|Aktuelles aus der Forschung||B1-106',doLast],
    fr];
  const SELBST=['ganztägig|Selbststudium|ar||Inhalt und Ort nach eigenem Ermessen'];
  const VB3_FR=['1-4|Leitung einer Brandschutzdienststelle||B1-106','5-6|Verabschiedung||B1-106|Evaluation der vergangenen drei Wochen','7|Abreise|ar'];
  const VB3_MO=['1-2|Anreise|ar','3-4|Pflege- und Betreuung||B1-106','5-8|Stellungnahme Übung|hi|B1-106','EVA|Vorbereitung Einsatzplanung'];
  const VB3_DI=['1-4|Einführung Brandverhütungsschau||B1-106','5-8|Brandverhütungsschau praktisch|hi||IdF NRW','EVA|Vorbereitung Exkursion anhand BSK'];
  const VB3_DO=['1-8|Veranstaltungssicherheit||B1-106|Orientierungsrahmen für Veranstaltungen im Freien'];
  const STAB1=(g)=>[
    g===1?['1-2|Anreise|ar','3|Begrüßung & Organisation||C-205','4-7|Führungslehre||C-205|Zwei-Stäbe-Modell · FwDV 100 · Führungsstufe D · Rollenverständnis','8|Kommunikation|||Nachrichtenvordruck · Lagedarstellung · Lagevortrag · Einsatztagebuch','EVA|Sachgebiet 4']
         :['1-2|Anreise|ar','3|Begrüßung|hi|C-1|Begrüßung durch den Direktor · Hemd/Krawatte · Vorstellungsrunde','4|Wochenorganisation||C-205','5-7|Führungslehre||C-205|Zwei-Stäbe-Modell · FwDV 100 · Führungsstufe D · Rollenverständnis · Lagedarstellung NRW','8|Kommunikation|||Nachrichtenvordruck · Lagedarstellung · Lagevortrag · Einsatztagebuch','EVA|Sachgebiet 4'],
    ['07:45-09:00|Führungslehre||C-205|'+(g===1?'Wiederholung Vortrag · Meldewesen · FB & Verbinder':'Meldewesen · Fachberater & Verbinder'),'09:00-09:15|Stationsausbildung|||gemeinsame Lageeinweisung','09:30-10:30|'+SG,'10:45-11:45|'+SG,'12:00-13:00|'+SG,'14:00-15:00|'+SG,'15:00-15:30|Aufbau|||Stabsräume „klein“','EVA|Sichter/Sichterin'],
    ['07:45-08:30|Innerer Dienst / Übernahme der EL|||gleitender Übergang zur Übung','08:30-12:15|Stabsrahmenübung »Waldbrand«|hi|'+(g===1?'C-204, C-205':'C-205, C-215')+'|Küchenwagen mitbringen','6|Übungsauswertung','14:00-15:00|Waldbrände||C-205|Einsatztaktiken · Einsatzmittel · Kooperation mit Forstbehörden','15:00-15:30|Rückbau|||Stabsräume „klein“',...(g===2?['19:00|Vortrag @fire|hi|C-1|freiwillig']:[]),'EVA|Führungsgrundsätze'],
    ['1-2|Sachgebiete 5 und 6||'+(g===1?'C-204, A3-28':'C-204, C-205')+'|in Halbgruppen im Wechsel · in zivil','3-8|Mars, Venus & Saturn||C-215|in zivil','EVA|Fayol'],
    ['1-5|Mars, Venus & Saturn (Fortsetzung)|||in zivil','6|Rekapitulation & Organisatorisches||'+(g===1?'C-215':'C-205'),'7|Abreise|ar']];
  const STAB2=(g)=>[
    ['1-2|Anreise|ar','3-8|Krisenstäbe||C-205|in zivil · Zuständigkeiten · Struktur · Methoden · Kooperation mit EL','EVA|Web-GIS||C-205'],
    ['07:45-12:30|Krisenstäbe||C-1|in zivil · Aufbau · Anwendungstraining · Nachbesprechung','13:30-17:00|Exkursion zur SAR-Leitstelle|ex||Hemd/Krawatte, ggf. Wetterschutz · fußläufig · Abmarsch 13:30 vor Gebäude C','EVA|KatS-Konzepte'],
    ['1|Wiederholung & Aufbau||C-205|Stabsraum „groß“','2-5|Stabsrahmenübung »Auswärtsspiel«|hi|C-205|Küchenwagen mitbringen','6|Übungsauswertung||C-205','7-8|Zusammenarbeit mit dem THW||C-205','EVA|Sachgebiet 3'],
    g===1?['1-5|Stabsrahmenübung »Zugunglück«|hi|C-205|Küchenwagen mitbringen','6|Übungsauswertung & Rückbau','7|Abreise|ar','EVA|LdS']
         :['1-5|Stabsrahmenübung »Zugunglück«|hi|C-205|Küchenwagen mitbringen','6|Übungsauswertung & Rückbau','7-8|EVA: EU-Katastrophenschutz','EVA|LdS'],
    g===1?SELBST:['1-6|EU-Katastrophenschutz|hi|C-205|beide Halbgruppen gemeinsam','7|Abreise|ar']];
  const PRESSE=(g)=>{
    const r=g===1?'C-215':'C-205';
    const wdr='13:30-ca. 17:00|Exkursion zum WDR-Studio|ex||zivil · Fahrt mit MTFs · Abfahrt 13:30, Parkplatz 2 · Ende in Dortmund';
    return [
      ['1-2|Anreise|ar','3|Begrüßung, Vorstellung der Woche||'+r,'4-8|Presserecht||'+r,...(g===2?['18:00|Kaminabend in Präsenz|hi||Gebäude C · zivil/leger · inkl. Catering']:[])],
      ['1|Einführung in die Pressearbeit||'+r,'2|Strategische Pressearbeit','3|Medien im Wandel||'+r,'4|Öffentlichkeitsarbeit','5|Wie arbeitet Presse?','6|Erwartungen eines Journalisten','13:30-18:00|Exkursion zur Villa ten Hompel|ex||zivil · fußläufig · Abmarsch 13:30 vor Gebäude C'],
      g===1?['1-7|Gr. A: Pressearbeit in der Krise, Pressekonferenzen|hi|C-215','1-7|Gr. B: Kameratraining|hi|C-204','8|Gruppenwechsel|||Fortsetzung']
           :['1-6|Gr. A: Pressearbeit in der Krise, Pressekonferenzen|hi|C-205','1-6|Gr. B: Kameratraining|hi|C-204',wdr],
      g===1?['1-6|Pressearbeit in der Krise / Kameratraining (Fortsetzung)',wdr]
           :['1|Pressearbeit in der Krise / Kameratraining (Fortsetzung)','2-8|Gruppenwechsel|||Fortsetzung'],
      ['1-2|Spontanhelfende||'+r,'3-4|Virtual Operations Support Team (VOST)||'+r,'5-6|Krisenkommunikation in der Privatwirtschaft||'+r+'|Evaluation der Woche','7|Abreise|ar']];
  };
  const W = [ // [KW, Woche, Thema, Montag, Gruppe, Tage Mo–Fr, Telefon, Hinweis]
    [44,1,'Vorbeugender Brandschutz 1','2026-10-26','g1',VB1_G1],
    [45,2,'Vorbeugender Brandschutz 2','2026-11-02','g1',VB2([],'EVA|EU-Katastrophenschutz',['1-6|EU-Katastrophenschutz|hi|C-205|beide Halbgruppen gemeinsam','7|Abreise|ar'])],
    [46,3,'Vorbeugender Brandschutz 3','2026-11-09','g1',[[...VB3_MO,'18:00|Kaminabend in Präsenz|hi||Gebäude C · zivil/leger · inkl. Catering'],VB3_DI,
      ['1-3|Exkursion Brandverhütungsschau praktisch|ex||extern · Poloshirt, Büroschuhe genügen','4-6|Brandverhütungsschaubericht||A3-25','7-8|Einsatzplanung||A3-25'],VB3_DO,VB3_FR]],
    [47,4,'Stab 1','2026-11-16','g1',STAB1(1),TEL.spahl],
    [48,5,'Stab 2','2026-11-23','g1',STAB2(1),TEL.spahl],
    [49,6,'Presse & Öffentlichkeitsarbeit','2026-11-30','g1',PRESSE(1),TEL.spahl],
    [44,1,'Stab 1','2026-10-26','g2',STAB1(2),TEL.spahl],
    [45,2,'Stab 2','2026-11-02','g2',STAB2(2),TEL.spahl],
    [46,3,'Presse & Öffentlichkeitsarbeit','2026-11-09','g2',PRESSE(2),TEL.spahl],
    [47,4,'Vorbeugender Brandschutz 1','2026-11-16','g2',VB1_G2],
    [48,5,'Vorbeugender Brandschutz 2','2026-11-23','g2',VB2(['EVA|Vorbereitung Stellungnahme für Freitag anhand Unterlagen'],'7|Abreise|ar',SELBST)],
    [49,6,'Vorbeugender Brandschutz 3','2026-11-30','g2',[VB3_MO,VB3_DI,
      ['1-6|Exkursion Brandverhütungsschau praktisch|ex||Poloshirt, Büroschuhe genügen · inkl. Brandverhütungsschaubericht','7-8|Einsatzplanung||B1-106'],VB3_DO,VB3_FR]],
    [50,7,'Zivile Verteidigung','2026-12-07','both',Array(5).fill(['ganztägig|Programm der BABZ|||Ahrweiler']),TEL.babz,
      'Die ganze Woche gestaltet die BABZ in Ahrweiler. Der genaue Stundenplan und Hinweise zu Anreise, Unterkunft, Verpflegung und Kleidung kommen als separates Dokument.'],
    [51,8,'Stab 3','2026-12-14','both',[
      ['1-2|Anreise|ar','3|Leistungsnachweis nach § 13 Abs. 3|hi|C-1|siehe Prüfungsleitfaden','11:00-11:30|MoFüSt NRW||C-1','11:30-13:00|Historie der Stabsarbeit & Stabsarbeit international||C-1','13:30-14:45|Historie der Stabsarbeit (Fortsetzung)','8|Lageeinweisung||C-1','18:15|Stabsrahmenübung »Unwetter«|hi||Lunchpaket packen · spätes Ende · Küchenwagen mitbringen'],
      ['1-6|unterrichtsfrei|ar','7-8|Übungsauswertung||C-205'],
      ['08:00-16:30|Fachtagung Stabsarbeit|hi|C-1|Get Together 08:00 · Beginn 08:45 · Hemd/Krawatte','EVA|Übungsbedarf'],
      ['1-5|Konzepterarbeitung Großveranstaltung||C-205','6|Aufbau||C-205|Stabsraum „groß“','14:00-17:00|Gr. A: Stabsrahmenübung »Großveranstaltung«|hi|C-205|Küchenwagen mitbringen'],
      ['07:45-ca. 11:00|Gr. B: Stabsrahmenübung »Großveranstaltung«|hi|C-205|Küchenwagen mitbringen','ca. 11:15-12:15|Übungsauswertung beider Gruppen||C-205','6|Rückbau & Organisatorisches|||Evaluation der drei Wochen Stab','7|Abreise|ar']],TEL.spahl],
    [52,9,'Klausuren','2026-12-21','both',[
      ['1|Anreise|ar','08:30-12:30|Klausur nach § 21|hi|B1-106, A3-25|4 Zeitstunden','7-8|unterrichtsfrei|ar'],
      ['1|unterrichtsfrei|ar','08:30-12:30|Klausur nach § 21|hi|B1-106, A3-25|4 Zeitstunden','7-8|Verabschiedung durch den Direktor|hi|A2-1|Hemd/Krawatte'],
      [],['nachmittags|Heiligabend|ar'],['ganztägig|1. Weihnachtstag|ar']],TEL.spahl]
  ];

  const DAYS=['Mo','Di','Mi','Do','Fr','Sa','So'];
  const MONS=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let _grp='g1', _wi=0, _weeks=[];

  function _time(spec){
    const m=/^(\d)(?:-(\d))?$/.exec(spec);
    if(m) return [UE_S[m[1]-1], UE_E[(m[2]||m[1])-1]];
    const i=spec.indexOf('-');
    return i<0?[spec,'']:[spec.slice(0,i),spec.slice(i+1)];
  }
  let _nk='';
  function _item(s,ymd){
    const [t,title,cls='',room='',note='']=s.split('|');
    const [a,b]=_time(t);
    const meta=[note,room?(_isCustom()?room:'Raum '+room):''].filter(Boolean).join(' · ');
    const nk=ymd?ymd+'|'+t+'|'+title:'';
    const isNext=ymd&&_nk&&(ymd+'|'+title+'|'+_minutes(a))===_nk;
    const has=nk&&PLANNOTE.get(nk);
    return `<div class="idf-item ${cls}${/^\d/.test(a)?'':' idf-wtime'}${nk?' idf-tap':''}${isNext?' idf-now':''}"${nk?` data-k="${esc(nk)}" tabindex="0" role="button"`:''}><span class="idf-time">${esc(a)}${b?`<i>${esc(b)}</i>`:''}</span><span class="idf-txt"><span class="idf-name">${esc(title)}${has?' <i class="idf-pen" aria-label="Mit Notiz">✎</i>':''}</span>${meta?`<span class="idf-meta">${esc(meta)}</span>`:''}</span></div>`;
  }
  const LUNCH=end=>`<div class="idf-item idf-lunch"><span class="idf-time">13:00<i>${end}</i></span><span class="idf-txt"><span class="idf-name"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 2v20M4 2v5a3 3 0 0 0 6 0V2M18 22V2c-2.5 1.5-4 4.5-4 8 0 2 1 3 4 3"/></svg>Mittagessen</span></span></div>`;
  function _start(spec){
    const ue=/^(\d)(?:-\d)?$/.exec(spec);
    if(ue) return UE_S[ue[1]-1];
    const hm=/(\d{2}):(\d{2})/.exec(spec);
    return hm?hm[0]:null;
  }
  function _splitAtLunch(items){
    const out=[];
    items.forEach(x=>{
      const p=x.split('|'), m=/^(\d)-(\d)$/.exec(p[0]);
      if(m&&+m[1]<=6&&+m[2]>=7){
        out.push([`${m[1]}-6`,...p.slice(1)].join('|'));
        out.push([m[2]==='7'?'7':`7-${m[2]}`,p[1]+' (Fortsetzung)',p[2]||'',p[3]||''].join('|'));
      } else out.push(x);
    });
    return out.map((x,i)=>({x,i,t:_start(x.split('|')[0])}))
      .sort((a,b)=>a.t&&b.t?(a.t<b.t?-1:a.t>b.t?1:a.i-b.i):a.i-b.i).map(o=>o.x);
  }
  function _dayItems(raw,ymd){
    if(!raw.length) return '<div class="idf-empty">frei</div>';
    const items=_splitAtLunch(raw);
    const starts=items.map(x=>_start(x.split('|')[0]));
    const html=items.map(x=>_item(x,ymd));
    if(!_isCustom()&&starts.some(Boolean)){
      let at=0;
      starts.forEach((t,i)=>{ if(t&&t<'13:00') at=i+1; });
      const next=starts.slice(at).find(Boolean);
      html.splice(at,0,LUNCH(next&&next>'13:00'&&next<'14:00'?next:'14:00'));
    }
    return html.join('');
  }

  // Änderungen vom Institut: data/plan-overrides.json (siehe Datei), wird beim Öffnen frisch geladen
  let _ov={tage:[],wochenhinweise:[]};
  const _ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

  // ── Eigener Stundenplan aus einer Kalenderdatei (.ics): ersetzt den IdF-Plan, alle Funktionen laufen weiter ──
  const CKEY='bvi_plan_custom', SKEY='bvi_plan_src';
  let _cust=null, _act=null, _cw=null, _cwa=null, _mode='view';   // _cust: angezeigter Plan, _act: aktiver Plan (Startseite, Widgets)
  // Master-Jahrgang: eigener Plan optional (alter Speicherort); andere Jahrgänge: immer eigener Plan, ggf. noch leer
  const _nonMaster=()=>typeof JG!=='undefined'&&!JG.isMaster();
  const PTAB={ibk:'IBK',vak:'VAk',feuak:'FeuAK',idf:'IdF Gruppe 1',idf2:'IdF Gruppe 2'};
  const _idfG=()=>{ try{ return localStorage.getItem('bvi_plan_idfg')==='idf2'?'idf2':'idf'; }catch(e){ return 'idf'; } };
  const _actKey=()=>{ const d=JG.data(); return d.aktiv&&d.plane[d.aktiv]?d.aktiv:(JG.PLANKEYS.find(k=>d.plane[k])||null); };
  function _vkey(){ try{ const k=localStorage.getItem('bvi_plan_view'); if(JG.PLANKEYS.includes(k)) return k; }catch(e){} return _actKey()||'idf'; }
  function _loadCust(){
    if(_nonMaster()){ const d=JG.data(), ak=_actKey(); _cust=d.plane[_vkey()]||null; _act=ak?d.plane[ak]:null; }
    else{ try{ const j=JSON.parse(localStorage.getItem(CKEY)||'null'); _cust=j&&Array.isArray(j.ev)&&j.ev.length?j:null; }catch(e){ _cust=null; } _act=_cust; }
    _cw=null; _cwa=null;
  }
  const _isCustom=()=>{ if(_nonMaster()) return true; try{ return !!_cust&&localStorage.getItem(SKEY)==='custom'; }catch(e){ return false; } };
  function _saveCust(res){
    if(_nonMaster()){ const l=JG.local(), k=_vkey(); res.at=Date.now(); l.plane[k]=res; if(!l.aktiv) l.aktiv=k; JG.saveLocal(l); }
    else{ try{ localStorage.setItem(CKEY,JSON.stringify(res)); localStorage.setItem(SKEY,'custom'); }catch(e){} }
    _loadCust(); _manual=false; render(); pushWidget();
    if(typeof SHELL!=='undefined') SHELL.renderHome();
  }
  // Andere Jahrgänge: zwischen den Abschnitten (IBK, VAk, FeuAK, IdF) wechseln und einen Plan als aktiv markieren
  // viewTab('idf') zeigt die zuletzt gewählte IdF-Gruppe, viewTab('idf',true) genau Gruppe 1
  function viewTab(k,exact){ if(!JG.PLANKEYS.includes(k)) return; if(k==='idf'&&!exact) k=_idfG(); try{ localStorage.setItem('bvi_plan_view',k); if(k==='idf'||k==='idf2') localStorage.setItem('bvi_plan_idfg',k); }catch(e){} _loadCust(); _manual=false; render(); }
  function setActive(k){ const l=JG.local(); l.aktiv=k; JG.saveLocal(l); TOAST.show(PTAB[k]+'-Plan ist jetzt aktiv: Startseite und Widgets nutzen ihn',{type:'ok'}); }
  const _icsUnfold=t=>String(t).replace(/\r\n|\r/g,'\n').replace(/\n[ \t]/g,'').split('\n');
  const _icsText=v=>String(v||'').replace(/\\[nN]/g,' ').replace(/\\([,;\\])/g,'$1').replace(/\s+/g,' ').trim();
  // lokale Zeit in einer Zeitzone → UTC-Millisekunden (unbekannte Zeitzone: Zeit des Geräts)
  function _tzMs(y,mo,d,h,mi,tz){
    try{
      const f=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
      const off=t=>{ const p={}; f.formatToParts(new Date(t)).forEach(x=>{ p[x.type]=x.value; }); return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute,+p.second)-t; };
      const g=Date.UTC(y,mo-1,d,h,mi); let t=g-off(g); t=g-off(t); return t;
    }catch(e){ return new Date(y,mo-1,d,h,mi).getTime(); }
  }
  function _icsDate(val,params){
    const m=/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/.exec(String(val).trim()); if(!m) return null;
    const y=+m[1], mo=+m[2], d=+m[3];
    if(m[4]===undefined) return {ms:new Date(y,mo-1,d).getTime(),all:true};
    if(m[7]) return {ms:Date.UTC(y,mo-1,d,+m[4],+m[5],+(m[6]||0)),all:false};
    const tz=/TZID=([^;:]+)/i.exec(params||'');
    return {ms:tz?_tzMs(y,mo,d,+m[4],+m[5],tz[1].replace(/"/g,'')):new Date(y,mo-1,d,+m[4],+m[5]).getTime(),all:false};
  }
  function _icsDur(v){
    const m=/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(v).trim()); if(!m) return null;
    const ms=(((+m[2]||0)*7+(+m[3]||0))*86400+(+m[4]||0)*3600+(+m[5]||0)*60+(+m[6]||0))*1000;
    return m[1]==='-'?-ms:ms;
  }
  // Kalenderdatei lesen → Liste von Terminen {s,e,t,r,n,ad}; einfache Wiederholungen (täglich, wöchentlich) werden aufgelöst
  function parseIcs(text){
    const evs=[]; let cur=null, name='';
    _icsUnfold(text).forEach(ln=>{
      if(ln==='BEGIN:VEVENT'){ cur={}; return; }
      if(ln==='END:VEVENT'){ if(cur&&cur.DTSTART) evs.push(cur); cur=null; return; }
      const m=/^([A-Za-z-]+)((?:;[^:]*)?):(.*)$/.exec(ln); if(!m) return;
      const k=m[1].toUpperCase();
      if(cur){ if(k==='EXDATE'){ (cur.EX=cur.EX||[]).push(...m[3].split(',').map(x=>x.trim().slice(0,8))); } else if(!(k in cur)){ cur[k]=m[3]; cur[k+'_P']=m[2]; } }
      else if(k==='X-WR-CALNAME') name=_icsText(m[3]);
    });
    const out=[], DAYMAP={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6}, LIMIT=3000;
    evs.forEach(ev=>{
      if(/CANCELLED/i.test(ev.STATUS||'')) return;
      const st=_icsDate(ev.DTSTART,ev.DTSTART_P); if(!st) return;
      let en=ev.DTEND?_icsDate(ev.DTEND,ev.DTEND_P):null, dur=en?en.ms-st.ms:(ev.DURATION?_icsDur(ev.DURATION):null);
      if(dur===null||dur<=0) dur=st.all?86400000:3600000;
      const t=_icsText(ev.SUMMARY)||'Termin', r=_icsText(ev.LOCATION), n=_icsText(ev.DESCRIPTION).slice(0,140);
      const starts=[st.ms];
      const rr=ev.RRULE?Object.fromEntries(ev.RRULE.split(';').map(x=>x.split('='))):null;
      if(rr&&(rr.FREQ==='DAILY'||rr.FREQ==='WEEKLY')){
        const iv=Math.max(1,+rr.INTERVAL||1), cnt=+rr.COUNT||0, s0=new Date(st.ms);
        let until=rr.UNTIL?(_icsDate(rr.UNTIL,'')||{}).ms:null; if(!until||until>st.ms+400*864e5) until=st.ms+400*864e5; if(rr.UNTIL&&/^\d{8}$/.test(rr.UNTIL)) until+=86399000;
        const wd=rr.BYDAY?rr.BYDAY.split(',').map(x=>DAYMAP[x.slice(-2)]).filter(x=>x!==undefined):[s0.getDay()];
        const mon0=new Date(s0.getFullYear(),s0.getMonth(),s0.getDate()-((s0.getDay()+6)%7));
        starts.length=0; let c=0;
        for(let i=0;i<=400&&starts.length<LIMIT;i++){
          const day=new Date(s0.getFullYear(),s0.getMonth(),s0.getDate()+i); if(day.getTime()>until) break;
          let ok;
          if(rr.FREQ==='DAILY') ok=i%iv===0;
          else ok=Math.floor((new Date(day.getFullYear(),day.getMonth(),day.getDate()-((day.getDay()+6)%7))-mon0)/(7*864e5))%iv===0&&wd.includes(day.getDay());
          if(!ok) continue;
          const o=new Date(day.getFullYear(),day.getMonth(),day.getDate(),s0.getHours(),s0.getMinutes()).getTime();
          if(o<st.ms) continue;
          c++; if(cnt&&c>cnt) break;
          const key=_ymd(day).replace(/-/g,'');
          if((ev.EX||[]).includes(key)) continue;
          starts.push(o);
        }
      }
      starts.forEach(a=>{ if(out.length<LIMIT) out.push({s:a,e:a+dur,t,r,n,ad:st.all?1:0}); });
    });
    out.sort((a,b)=>a.s-b.s);
    return {name,ev:out};
  }
  const _isoWeek=d=>{ const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const n=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-n); return Math.ceil(((t-Date.UTC(t.getUTCFullYear(),0,1))/864e5+1)/7); };
  // Termine in Wochen (Mo–So) mit Einträgen im Format des IdF-Plans umwandeln
  function _customWeeks(){
    const pl=_mode==='active'?_act:_cust;
    if(_mode==='active'?_cwa:_cw) return _mode==='active'?_cwa:_cw;
    const ev=(pl&&pl.ev)||[]; const keep=w=>{ if(_mode==='active') _cwa=w; else _cw=w; return w; };
    if(!ev.length) return keep([]);
    const hm=ms=>{ const d=new Date(ms); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
    const days=new Map(), add=(ymd,raw)=>{ (days.get(ymd)||days.set(ymd,[]).get(ymd)).push(raw); };
    const clean=x=>String(x||'').replace(/\|/g,'/');
    ev.forEach(e=>{
      if(e.ad){ for(let d=new Date(e.s);d.getTime()<e.e&&d.getTime()<e.s+60*864e5;d.setDate(d.getDate()+1)) add(_ymd(d),['ganztägig',clean(e.t),'ar',clean(e.r),clean(e.n)].join('|')); return; }
      const sd=new Date(e.s), same=_ymd(sd)===_ymd(new Date(e.e-1));
      add(_ymd(sd),[hm(e.s)+'-'+(same?hm(e.e):'23:59'),clean(e.t),'',clean(e.r),clean(e.n)].join('|'));
    });
    const first=new Date(Math.min(...ev.map(e=>e.s))), last=new Date(Math.max(...ev.map(e=>e.e)));
    const mon=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7));
    const ws=[]; let i=0;
    for(let m=mon(first);m<=last&&ws.length<110;m=new Date(m.getFullYear(),m.getMonth(),m.getDate()+7)){
      const dd=[]; for(let k=0;k<7;k++) dd.push(days.get(_ymd(new Date(m.getFullYear(),m.getMonth(),m.getDate()+k)))||[]);
      ws.push([_isoWeek(m),++i,(pl&&pl.name)||'Eigener Plan',_ymd(m),'both',dd,null,'']);
    }
    return keep(ws);
  }
  function importIcs(file){
    if(!file) return;
    const r=new FileReader();
    r.onload=()=>{
      let res; try{ res=parseIcs(String(r.result)); }catch(e){ res=null; }
      if(!res||!res.ev.length){ TOAST.show('In der Datei wurden keine Termine gefunden – bitte eine Kalenderdatei (.ics) wählen',{type:'info'}); return; }
      res.name=res.name||String(file.name||'').replace(/\.[^.]+$/,'')||'Eigener Plan'; res.at=Date.now();
      _saveCust(res);
      TOAST.show(res.ev.length+' Termine aus „'+res.name+'“ geladen',{type:'ok'});
    };
    r.onerror=()=>TOAST.show('Datei konnte nicht gelesen werden');
    r.readAsText(file);
  }
  function useSource(src){
    try{ localStorage.setItem(SKEY,src==='custom'?'custom':'idf'); }catch(e){}
    _cw=null; _manual=false; render(); pushWidget();
    if(typeof SHELL!=='undefined') SHELL.renderHome();
    TOAST.show(src==='custom'?'Eigener Plan wird angezeigt':'IdF-Plan Modul 3.5 wird angezeigt',{type:'ok'});
  }
  function removeCustom(){
    if(!confirm('Den geladenen eigenen Stundenplan entfernen?')) return;
    if(_nonMaster()){ const l=JG.local(), k=_vkey(); delete l.plane[k]; if(l.aktiv===k) l.aktiv=null; JG.saveLocal(l); }
    else{ try{ localStorage.removeItem(CKEY); localStorage.setItem(SKEY,'idf'); }catch(e){} }
    _loadCust(); _manual=false; render(); pushWidget();
    if(typeof SHELL!=='undefined') SHELL.renderHome();
    TOAST.show('Eigener Plan entfernt',{type:'ok'});
  }
  // Leiste ganz oben (andere Jahrgänge): Abschnitt wählen, Plan als aktiv markieren
  function _tabsBar(){
    if(!_nonMaster()) return '';
    const d=JG.data(), vk=_vkey(), ak=_actKey();
    const inIdf=vk==='idf'||vk==='idf2', idfAct=ak==='idf'||ak==='idf2', idfHas=!!(d.plane.idf||d.plane.idf2);
    const seg=[['ibk','IBK'],['vak','VAk'],['feuak','FeuAK'],['idf','IdF']].map(([k,l])=>{
      const on=k==='idf'?inIdf:k===vk, star=k==='idf'?idfAct:ak===k, has=k==='idf'?idfHas:!!d.plane[k];
      return `<button class="${on?'active':''}" onclick="IDF_PLAN.viewTab('${k}')" aria-pressed="${on}">${l}${star?' ★':has?'':' ·'}</button>`;
    }).join('');
    const grp=inIdf?`<span class="m-seg idf-seg idf-gr" role="group" aria-label="IdF-Gruppe">${[['idf','Gruppe 1'],['idf2','Gruppe 2']].map(([k,l])=>`<button class="${k===vk?'active':''}" onclick="IDF_PLAN.viewTab('${k}',true)" aria-pressed="${k===vk}">${l}${ak===k?' ★':d.plane[k]?'':' ·'}</button>`).join('')}</span>`:'';
    let act='';
    if(d.plane[vk]) act=ak===vk?`<div class="idf-act on"><span class="m-badge">★ Aktiv</span><span class="m-t2">Startseite und Widgets zeigen diesen Plan</span></div>`:`<div class="idf-act"><button class="btn btn-gold" onclick="IDF_PLAN.setActive('${vk}')">Als aktiven Stundenplan markieren</button><span class="m-t2">Dann nutzen Startseite und Widgets diesen Plan</span></div>`;
    return `<div class="m-card idf-tabs"><span class="m-seg idf-seg" role="group" aria-label="Abschnitt">${seg}</span>${grp}${act}</div>`;
  }
  function _planControls(){
    const cust=!!_cust, on=_isCustom(), nm=_nonMaster();
    const row=(t1,t2,btn)=>`<div class="m-row m-static m-wrap"><span class="m-tx"><span class="m-t1">${t1}</span><span class="m-t2">${t2}</span></span>${btn}</div>`;
    const fileRow=`<label class="m-row" for="plan-file" style="cursor:pointer"><span class="m-tx"><span class="m-t1">Kalenderdatei (.ics) laden</span><span class="m-t2">z. B. aus dem Kalender deiner Schule oder deines Betriebs</span></span><input type="file" id="plan-file" accept=".ics,text/calendar" hidden onchange="IDF_PLAN.importIcs(this.files[0]);this.value=''"></label>`;
    const ui=(fn,t1,t2)=>`<button class="m-row m-go" onclick="${fn}"><span class="m-tx"><span class="m-t1">${t1}</span><span class="m-t2">${t2}</span></span></button>`;
    let h='<div class="m-sec" style="margin-top:1rem">'+(nm?'Plan für '+PTAB[_vkey()]:'Stundenplan wählen')+'</div><div class="m-list idf-src">';
    if(!nm) h+=row('IdF Münster · Modul 3.5',on?'Der mitgelieferte Plan, mit Gruppe 1 und 2':'Wird gerade angezeigt',on?'<button class="btn btn-ghost" onclick="IDF_PLAN.useSource(\'idf\')">Anzeigen</button>':'<span class="m-badge">aktiv</span>');
    if(cust) h+=row(esc(_cust.name),_cust.ev.length+' Termine'+(nm?'':' aus deiner Datei'),on&&!nm?'<span class="m-badge">aktiv</span>':nm?'':'<button class="btn btn-ghost" onclick="IDF_PLAN.useSource(\'custom\')">Anzeigen</button>');
    if(nm) h+=fileRow;   // Im Master lässt sich nichts ändern oder importieren
    if(nm&&typeof JGUI!=='undefined'){
      h+=ui('JGUI.planPhoto()','Foto oder Screenshot einlesen','Die Termine werden erkannt und zum Ausbessern angezeigt');
      h+=ui('JGUI.planEditor()','Termine von Hand eingeben oder ändern','Datum, Zeit, Titel und Raum');
    }
    if(cust&&(!nm||JG.local().plane[_vkey()])) h+=`<button class="m-row" onclick="IDF_PLAN.removeCustom()"><span class="m-tx"><span class="m-t1">Eigenen Plan entfernen</span></span></button>`;
    if(!on) h+=`<button class="m-row m-go" onclick="PLANABO.open()"><span class="m-tx"><span class="m-t1">Kalender abonnieren</span><span class="m-t2">Der IdF-Plan als Link, der sich selbst aktualisiert</span></span></button>`;
    return h+'</div>';
  }
  // Noch kein Plan für diesen Abschnitt (andere Jahrgänge): Hinweis und Wege zum Importieren
  function _drawEmpty(el){
    const ey=document.querySelector('#v-plan .page-eyebrow'), ld=document.querySelector('#v-plan .page-lead');
    if(ey&&ld){ if(!ey.dataset.d){ ey.dataset.d=ey.textContent; ld.dataset.d=ld.textContent; } ey.style.textTransform='none'; ey.textContent=JG.labelOf(JG.current())+' · '+PTAB[_vkey()]; ld.textContent='Importiere oder erstelle den Stundenplan für diesen Abschnitt. Mit „Aktiv“ nutzen ihn Startseite und Widgets.'; }
    el.innerHTML=_tabsBar()+'<div class="m-card"><div class="m-t1">Noch kein Stundenplan für '+PTAB[_vkey()]+'</div><div class="m-t2" style="margin-top:6px">Importiere ihn als Kalenderdatei (.ics), lies ein Foto oder einen Screenshot ein, oder gib die Termine selbst ein.</div></div>'+_planControls();
  }
  function _dayRaw(w,d,g){
    if(_isCustom()) return w[5][d]||[];
    const day=new Date(w[3]+'T00:00'); day.setDate(day.getDate()+d);
    const key=_ymd(day);
    const o=_ov.tage.find(t=>t&&t.datum===key&&(!t.gruppe||t.gruppe==='both'||t.gruppe===g)&&Array.isArray(t.eintraege));
    return o?o.eintraege:(w[5][d]||[]);
  }
  function _weekNote(w){
    const o=_ov.wochenhinweise.find(x=>x&&x.montag===w[3]);
    return o&&o.text?String(o.text):'';
  }
  async function _loadOv(){
    try{
      const r=await fetch('data/plan-overrides.json',{cache:'no-cache'}); if(!r.ok) return;
      const j=await r.json();
      _ov={tage:Array.isArray(j.tage)?j.tage:[],wochenhinweise:Array.isArray(j.wochenhinweise)?j.wochenhinweise:[]};
      if(document.getElementById('v-plan')?.classList.contains('active')) _draw();
      if(typeof SHELL!=='undefined'&&document.getElementById('v-home')?.classList.contains('active')) SHELL.renderHome();
      pushWidget();
    }catch(e){}
  }
  function _buildWeeks(g=_grp){
    if(_isCustom()) return _customWeeks();
    return W.filter(w=>w[4]==='both'||w[4]===g).sort((a,b)=>a[3]<b[3]?-1:1);
  }
  function _autoIdx(ws=_weeks){
    const today=new Date(); today.setHours(0,0,0,0);
    for(let i=ws.length-1;i>=0;i--) if(new Date(ws[i][3]+'T00:00')<=today) return i;
    return 0;
  }
  function _savedGrp(){ try{ return localStorage.getItem('idf_plan_grp')||'g1'; }catch(e){ return 'g1'; } }

  function _draw(){
    const el=document.getElementById('plan-inner'); if(!el) return;
    const nxt=_next(); _nk=nxt?_ymd(nxt.start)+'|'+nxt.title+'|'+(nxt.start.getHours()*60+nxt.start.getMinutes()):'';
    const wk=_weeks[_wi]; if(!wk) return;
    const [kw,nr,thema,start,grp,days,tel,info]=wk;
    const today=new Date(); today.setHours(0,0,0,0);
    const base=new Date(start+'T00:00');
    const notStarted=today<new Date(_weeks[0][3]+'T00:00');
    const icon=d=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
    let h=_tabsBar()+`<div class="m-card idf-head">
      <div class="idf-row"><div><b class="idf-kw">KW ${kw}</b><span class="m-t2">Woche ${nr} von ${_isCustom()?_weeks.length:9}${grp==='both'&&!_isCustom()?' · beide Gruppen':''}</span></div>
        <div class="idf-nav"><button onclick="IDF_PLAN._nav(-1)" aria-label="Vorherige Woche"${_wi===0?' disabled':''}>${icon('m15 18-6-6 6-6')}</button><button onclick="IDF_PLAN._nav(1)" aria-label="Nächste Woche"${_wi===_weeks.length-1?' disabled':''}>${icon('m9 18 6-6-6-6')}</button></div></div>
      <div class="idf-pips">${_weeks.map((_,i)=>`<i class="${i<_wi?'done':i===_wi?'cur':''}"></i>`).join('')}</div>
      <div class="idf-row idf-row2"><span class="idf-thema">${esc(thema)}</span>
        ${_isCustom()?'':`<span class="m-seg" role="group" aria-label="Gruppe">${['g1','g2'].map(g=>`<button class="${_grp===g?'active':''}" onclick="IDF_PLAN._grp('${g}')">Gruppe ${g[1]}</button>`).join('')}</span>`}</div>
    </div>`;
    if(notStarted&&_wi===0) h+=_isCustom()?`<div class="idf-note">Der Plan beginnt am ${base.toLocaleDateString('de-DE',{day:'numeric',month:'long'})}. Bis dahin zeigt er die erste Woche.</div>`:`<div class="idf-note">Das Modul beginnt am 26. Oktober. Bis dahin zeigt der Plan die erste Woche.</div>`;
    if(info) h+=`<div class="idf-note">${esc(info)}</div>`;
    const wn=_weekNote(wk); if(wn) h+=`<div class="idf-note">${esc(wn)}</div>`;
    h+='<div class="idf-days">'+days.map((_,i)=>{
      const items=_dayRaw(wk,i,_grp);
      const d=new Date(base); d.setDate(base.getDate()+i);
      const isToday=d.getTime()===today.getTime();
      return `<div class="idf-day${isToday?' today':''}" data-ymd="${_ymd(d)}"><div class="idf-dc"><span class="idf-dow">${DAYS[i]}</span><span class="idf-dnum">${d.getDate()}</span><span class="idf-dmo">${MONS[d.getMonth()]}</span></div>
        <div class="idf-items">${_dayItems(items,_ymd(d))}</div></div>`;
    }).join('')+'</div>';
    const full=(n,t)=>/^-/.test(t)?(/BABZ/.test(n)?'0228 99550':'0251 3112')+t:t;
    const rows=[...(tel||TEL.spahl),['Pforte','-1400'],['Notruf','-0112']].map(([n,t])=>[n,full(n,t)]);
    if(!_isCustom()) h+=`<div class="m-card idf-tel"><div class="m-t1">Erreichbarkeiten</div>${rows.map(([n,t])=>`<div class="idf-tel-row"><span>${esc(n)}</span><a href="tel:+49${t.replace(/\D/g,'').replace(/^0/,'')}">${esc(t)}</a></div>`).join('')}</div>`;
    h+=`<button class="m-cal-btn" onclick="IDF_PLAN.exportIcs()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 13v5M9.5 15.5h5"/></svg>Stundenplan in den Kalender übernehmen<small>${_isCustom()?'Dein Plan':'Gruppe '+_grp[1]} · alle Einheiten mit Erinnerung 30 Minuten vorher</small></button>`;
    if(!_isCustom()) h+='<div class="idf-legend"><span><i class="hi"></i>Schlüsseltermin</span><span><i class="ex"></i>Exkursion</span><span><i class="ar"></i>An-/Abreise, frei</span><span>EVA = eigenverantwortliches Arbeiten</span></div>';
    h+=_planControls();
    // Kopf der Seite: Name und Zeitraum des angezeigten Plans
    const ey=document.querySelector('#v-plan .page-eyebrow'), ld=document.querySelector('#v-plan .page-lead');
    if(ey&&ld){
      if(!ey.dataset.d){ ey.dataset.d=ey.textContent; ld.dataset.d=ld.textContent; }
      ey.style.textTransform=_nonMaster()?'none':'';
      ey.textContent=_isCustom()?(_nonMaster()?JG.labelOf(JG.current())+' · '+PTAB[_vkey()]:_cust.name):ey.dataset.d;
      ld.textContent=_isCustom()?'Stundenplan für KW '+_weeks[0][0]+' bis '+_weeks[_weeks.length-1][0]+'. Es öffnet sich immer die aktuelle Woche.':ld.dataset.d;
    }
    el.innerHTML=h;
  }

  // Woche der laufenden bzw. nächsten Einheit (sonst die Woche von heute)
  function _curWeek(){
    let wi=_autoIdx(); const nx=_next();
    if(nx){
      const k=_weeks.findIndex(w=>{ const b=new Date(w[3]+'T00:00'), e=new Date(b); e.setDate(b.getDate()+7); return nx.start>=b&&nx.start<e; });
      if(k>=0) wi=k;
    }
    return wi;
  }
  let _manual=false;   // true, sobald jemand selbst in andere Wochen geblättert hat
  // läuft das Datum weiter (Mitternacht, App wieder im Vordergrund), springt der Plan zur aktuellen Woche – außer es wurde selbst geblättert
  function _follow(){
    if(document.hidden||_manual||!document.getElementById('v-plan')?.classList.contains('active')||!_weeks.length) return;
    const wi=_curWeek();
    if(wi===_wi) return;
    _wi=wi; _draw();
    const nx=_next(), day=nx&&document.querySelector('#plan-inner .idf-day[data-ymd="'+_ymd(nx.start)+'"]');
    if(day) requestAnimationFrame(()=>{ day.scrollIntoView({block:'start'}); });
  }
  document.addEventListener('visibilitychange',_follow);
  function render(){
    _grp=_savedGrp();
    _weeks=_buildWeeks();
    if(!_weeks.length){ const el=document.getElementById('plan-inner'); if(el) _drawEmpty(el); return; }
    _manual=false; _wi=_curWeek();
    // Springt zur laufenden bzw. nächsten Einheit: richtige Woche, Tag nach oben scrollen
    const nx=_next(), key=nx&&_ymd(nx.start);
    _draw();
    const day=key&&document.querySelector('#plan-inner .idf-day[data-ymd="'+key+'"]');
    if(day) requestAnimationFrame(()=>{ day.scrollIntoView({block:'start'}); });
  }
  // Markierung folgt der Uhrzeit: alle 30 s prüfen, ob eine andere Einheit läuft bzw. ansteht
  setInterval(()=>{
    if(document.hidden||!document.getElementById('v-plan')?.classList.contains('active')) return;
    _follow();
    const n=_next(), k=n?_ymd(n.start)+'|'+n.title+'|'+(n.start.getHours()*60+n.start.getMinutes()):'';
    if(k!==_nk) _draw();
  },30000);
  function _nav(d){ _manual=true; _wi=Math.max(0,Math.min(_weeks.length-1,_wi+d)); _draw(); }
  function _setGrp(g){
    _grp=g;
    try{ localStorage.setItem('idf_plan_grp',g); }catch(e){}
    const kw=_weeks[_wi]&&_weeks[_wi][0];
    _weeks=_buildWeeks();
    const keep=_weeks.findIndex(w=>w[0]===kw);
    _wi=keep>=0?keep:_autoIdx();
    _draw();
    pushWidget();
  }
  function _minutes(str){ const m=/(\d{1,2}):(\d{2})/.exec(str||''); return m?(+m[1])*60+(+m[2]):null; }
  // Laufende oder nächste Einheit nach Stundenplan der gewählten Gruppe; null, wenn das Modul vorbei ist
  // öffentlich (Startseite, Widgets): immer der aktive Plan; intern (Seite, Sprung zur Uhrzeit): der angezeigte Plan
  function next(now){ _mode='active'; try{ return _next(now); }finally{ _mode='view'; } }
  function _next(now=new Date()){
    for(const w of _buildWeeks(_savedGrp())){
      const base=new Date(w[3]+'T00:00');
      for(let d=0;d<w[5].length;d++){
        const day=new Date(base); day.setDate(base.getDate()+d);
        const dayEnd=new Date(day); dayEnd.setHours(23,59,59,0);
        if(dayEnd<now) continue;
        for(const raw of _splitAtLunch(_dayRaw(w,d,_savedGrp()))){
          const [t,title,cls='',room='',note='']=raw.split('|');
          if(/unterrichtsfrei|Selbststudium|Heiligabend|Weihnachtstag/.test(title)) continue;
          const [a,b]=_time(t);
          const s=_minutes(a); if(s===null) continue;
          const e=_minutes(b); 
          const start=new Date(day); start.setHours(0,s,0,0);
          const end=new Date(day); end.setHours(0,e===null?s+60:e,0,0);
          if(end>now) return {state:start<=now?'now':'next',title,start,end,room,note,cls,kw:w[0]};
        }
      }
    }
    return null;
  }

  // Alle kommenden Einheiten (Beginn/Ende in ms) für die Startbildschirm-Widgets der Android-App
  function units(){ _mode='active'; try{ return _units(); }finally{ _mode='view'; } }
  function _units(){
    const out=[], g=_savedGrp(), from=new Date(); from.setHours(0,0,0,0);
    for(const w of _buildWeeks(g)){
      const base=new Date(w[3]+'T00:00');
      for(let d=0;d<w[5].length;d++){
        const day=new Date(base); day.setDate(base.getDate()+d);
        if(day<from) continue;
        for(const raw of _splitAtLunch(_dayRaw(w,d,g))){
          const [t,title,cls='',room='']=raw.split('|');
          if(/unterrichtsfrei|Selbststudium|Heiligabend|Weihnachtstag/.test(title)) continue;
          const [a,b]=_time(t); const s=_minutes(a); if(s===null) continue;
          const e=_minutes(b);
          const st=new Date(day); st.setHours(0,s,0,0);
          const en=new Date(day); en.setHours(0,e===null?s+60:e,0,0);
          out.push({s:st.getTime(),e:en.getTime(),t:title,r:room?(_isCustom()?room:'Raum '+room):'',x:1});
        }
      }
    }
    return out;
  }
  function pushWidget(){
    try{ if(window.BVIAndroid&&BVIAndroid.setSchedule) BVIAndroid.setSchedule(JSON.stringify(units())); }catch(e){}
  }
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) pushWidget(); });

  // Stundenplan der gewählten Gruppe als Kalenderdatei (iCalendar), mit Erinnerung 30 Minuten vorher
  function ics(){
    const g=_savedGrp(), pad=n=>String(n).padStart(2,'0');
    const fold=l=>{ let out='',cur=''; for(const ch of l){ if(new TextEncoder().encode(cur+ch).length>73){ out+=cur+'\r\n '; cur=''; } cur+=ch; } return out+cur; };
    const esc=t=>String(t).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
    const stamp=(()=>{const d=new Date();return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+'T'+pad(d.getUTCHours())+pad(d.getUTCMinutes())+pad(d.getUTCSeconds())+'Z';})();
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//B VI Lernwebsite//Stundenplan Modul 3.5//DE','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+(_isCustom()?esc((_cust&&_cust.name)||'Stundenplan'):'IdF Münster Modul 3.5 · Gruppe '+g[1])];
    let count=0;
    for(const w of _buildWeeks(g)){
      const base=new Date(w[3]+'T00:00');
      for(let d=0;d<w[5].length;d++){
        const day=new Date(base); day.setDate(base.getDate()+d);
        const ymd=day.getFullYear()+pad(day.getMonth()+1)+pad(day.getDate());
        _splitAtLunch(_dayRaw(w,d,g)).forEach((raw,i)=>{
          const [t,title,cls='',room='',note='']=raw.split('|');
          if(/unterrichtsfrei|Selbststudium|Heiligabend|Weihnachtstag/.test(title)) return;
          const [a,b]=_time(t); const s=_minutes(a); if(s===null) return;
          const e=_minutes(b)??s+60, hm=m=>pad(Math.floor(m/60))+pad(m%60)+'00';
          lines.push('BEGIN:VEVENT','UID:bvi-'+g+'-'+ymd+'-'+hm(s)+'-'+i+'@bvi-lernwebsite','DTSTAMP:'+stamp,
            'DTSTART:'+ymd+'T'+hm(s),'DTEND:'+ymd+'T'+hm(e),
            'SUMMARY:'+esc(title));
          if(room) lines.push('LOCATION:'+esc(_isCustom()?room:'IdF NRW Münster, Raum '+room));
          lines.push('DESCRIPTION:'+esc([w[2]+' (KW '+w[0]+')',note].filter(Boolean).join('\n')));
          lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc(title),'TRIGGER:-PT30M','END:VALARM','END:VEVENT');
          count++;
        });
      }
    }
    lines.push('END:VCALENDAR');
    return {text:lines.map(fold).join('\r\n')+'\r\n',count,group:g};
  }
  function exportIcs(){
    const r=ics();
    FILES.save(_isCustom()?'bvi-stundenplan-eigener-plan.ics':'bvi-stundenplan-gruppe'+r.group[1]+'.ics','text/calendar',r.text,true);
  }

  function summary(){
    const ws=_buildWeeks(_savedGrp());
    if(!ws.length) return { kw:0, thema:'', over:false };
    const w=ws[_autoIdx(ws)];
    const end=new Date(ws[ws.length-1][3]+'T00:00'); end.setDate(end.getDate()+5);
    return { kw:w[0], thema:w[2], over:new Date()>end };
  }

  document.addEventListener('click',e=>{
    const it=e.target.closest('#plan-inner .idf-tap'); if(it) PLANNOTE.open(it);
  });
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('#plan-inner .idf-tap')){ e.preventDefault(); PLANNOTE.open(e.target); }
  });
  if(typeof JG!=='undefined') JG.on(()=>{
    _loadCust(); _manual=false;
    if(document.getElementById('v-plan')?.classList.contains('active')) render();
    pushWidget();
    if(typeof SHELL!=='undefined'&&document.getElementById('v-home')?.classList.contains('active')) SHELL.renderHome();
  });
  _loadOv();
  pushWidget();
  return { viewTab, setActive, savePlan:_saveCust, getPlan:()=>_cust, render, summary, next, units, pushWidget, ics, exportIcs, parseIcs, importIcs, useSource, removeCustom, isCustom:_isCustom, _nav, _grp:_setGrp, redraw:_draw };
})();

/* ── Stundenplan als Kalender-Abo (Link, der sich selbst aktualisiert) ──────── */
const PLANABO=(function(){
  const BASE='https://flametan.github.io/BVI-Lernwebsite/data/';
  let box=null;
  const url=g=>BASE+'stundenplan-gruppe'+g+'.ics';
  function build(){
    box=document.createElement('div'); box.id='abo-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Stundenplan abonnieren');
    box.innerHTML='<div class="sh-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t">Stundenplan abonnieren</div>'
      +'<p class="abo-p">Dein Kalender holt sich den Plan selbst und aktualisiert ihn bei Änderungen. Wähle deine Gruppe:</p>'
      +[1,2].map(g=>'<div class="abo-row"><b>Gruppe '+g+'</b><button type="button" class="btn btn-ghost" data-g="'+g+'">Link kopieren</button><a class="btn btn-gold" href="'+url(g).replace('https://','webcal://')+'">In Kalender öffnen</a></div>').join('')
      +'<p class="abo-p abo-s">iPhone und Mac: „In Kalender öffnen“ tippen. Google Kalender: am Computer calendar.google.com öffnen, bei „Weitere Kalender“ das Plus wählen, „Per URL“ und den kopierten Link einfügen.</p></div>';
    document.body.appendChild(box);
    box.addEventListener('click',async e=>{
      if(e.target===box||e.target.closest('.sh-x')){ close(); return; }
      const b=e.target.closest('[data-g]'); if(!b) return;
      try{ await navigator.clipboard.writeText(url(b.dataset.g)); TOAST.show('Link kopiert',{type:'ok'}); }
      catch(err){ TOAST.show(url(b.dataset.g),{type:'info',duration:12000}); }
    });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
  }
  function open(){ if(!box) build(); box.hidden=false; box.querySelector('.sh-x').focus({preventScroll:true}); }
  function close(){ if(box) box.hidden=true; }
  return {open,close,url};
})();

/* ── Dateien speichern (Browser: Download, Android-App: Ordner Downloads) ── */
const FILES=(function(){
  function save(name,mime,text,open){
    if(window.BVIAndroid&&BVIAndroid.saveText){
      try{
        const ok=BVIAndroid.saveText(name,mime,text,!!open);
        TOAST.show(ok?(open?'Datei wird geöffnet …':'In Downloads gespeichert'):'Speichern fehlgeschlagen',ok?{type:'ok'}:undefined);
        return ok;
      }catch(e){}
    }
    const url=URL.createObjectURL(new Blob([text],{type:mime+';charset=utf-8'}));
    const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
    TOAST.show('Datei erstellt: '+name,{type:'ok'});
    return true;
  }
  return {save};
})();

/* ── Sicherung: Lernstand, Notizen, Lesezeichen und Einstellungen als Datei ── */
const BACKUP=(function(){
  const keep=k=>(k.startsWith('bvi_')&&k!=='bvi_seen_version'&&k!=='bvi_last_backup'&&k!=='bvi_et_end')||k==='idf_plan_grp';
  // Form der Werte beim Einspielen prüfen: falsch geformte Daten würden die App dauerhaft stören
  const ARR=new Set(['bvi_bookmarks','bvi_recent','bvi_search_hist','bvi_fc_custom','bvi_fc_stars','bvi_fc_weak']);
  const NOJSON=new Set(['bvi_plan_src','bvi_theme','bvi_accent','bvi_font_size','bvi_goal','bvi_timers','bvi_onboarded','bvi_exam','bvi_lp_fz','bvi_lp_prac','bvi_pause_mode','bvi_pause_mods','bvi_duell_name','bvi_duell_col','bvi_duell_stun','bvi_duell_cfg','idf_plan_grp']);
  const safeTxt=t=>String(t==null?'':t).replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function clean(k,v){
    if(typeof v!=='string'||v.length>2e6) return null;
    if(/^bvi_note_v-[a-z0-9-]+$|^bvi_note_home$/.test(k)) return v;
    if(NOJSON.has(k)) return v;
    if(!/^bvi_[a-z0-9_]+$/.test(k)&&!/^bvi_checks_[\w-]+$/.test(k)) return null;
    let j; try{ j=JSON.parse(v); }catch(e){ return null; }
    if(j===null||typeof j!=='object') return null;
    if(ARR.has(k)!==Array.isArray(j)&&(ARR.has(k)||k==='bvi_progress'||k==='bvi_fc'||k==='bvi_usage'||k==='bvi_notif')) return null;
    if(k==='bvi_fc_custom') j=j.filter(c=>c&&typeof c==='object'&&/^[\w-]+$/.test(String(c.id))).map(c=>({...c,id:String(c.id),q:safeTxt(c.q),a:safeTxt(c.a),cat:safeTxt(c.cat||'Eigene')}));
    if(k==='bvi_bookmarks') j=j.filter(b=>b&&typeof b==='object'&&typeof b.id==='string');
    if(k==='bvi_recent'||k==='bvi_search_hist') j=j.filter(x=>typeof x==='string'||(x&&typeof x==='object'));
    return JSON.stringify(j);
  }
  function collect(){
    const d={};
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&keep(k)) d[k]=localStorage.getItem(k); }
    return d;
  }
  const stamp=()=>{ const d=new Date(),p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); };
  return {
    export(){
      const data=collect(), n=Object.keys(data).length;
      const body=JSON.stringify({app:'bvi-lernwebsite',version:APP_VERSION,exported:new Date().toISOString(),data},null,1);
      FILES.save('bvi-sicherung-'+stamp()+'.json','application/json',body);
      try{ localStorage.setItem('bvi_last_backup',new Date().toISOString()); }catch(e){}
      SHELL.syncSettings();
      return n;
    },
    last(){ try{ const t=localStorage.getItem('bvi_last_backup'); return t?new Date(t):null; }catch(e){ return null; } },
    import(input){
      const f=input.files&&input.files[0]; input.value='';
      if(!f) return;
      const r=new FileReader();
      r.onload=()=>{
        let o; try{ o=JSON.parse(r.result); }catch(e){ TOAST.show('Das ist keine gültige Sicherungsdatei'); return; }
        if(!o||o.app!=='bvi-lernwebsite'||typeof o.data!=='object'||!o.data){ TOAST.show('Das ist keine Sicherung dieser App'); return; }
        const ok={}, skipped=[];
        Object.keys(o.data).filter(keep).forEach(k=>{ const c=clean(k,o.data[k]); if(c===null) skipped.push(k); else ok[k]=c; });
        const keys=Object.keys(ok);
        if(!keys.length){ TOAST.show('Die Sicherung enthält keine verwertbaren Daten'); return; }
        const dt=o.exported?new Date(o.exported):null;
        const when=dt&&!isNaN(dt)?dt.toLocaleDateString('de-DE'):'unbekannt';
        if(!confirm('Sicherung vom '+when+' einspielen?\n\nDie '+keys.length+' Einträge der Sicherung überschreiben deine aktuellen Daten. Was in der Sicherung fehlt, bleibt unverändert.')) return;
        let failed=0;
        keys.forEach(k=>{ localStorage.setItem(k,ok[k]); if(localStorage.getItem(k)!==ok[k]) failed++; });
        if(failed||skipped.length){ TOAST.show((failed?failed+' Einträge passten nicht in den Speicher. ':'')+(skipped.length?skipped.length+' ungültige Einträge wurden übersprungen. ':'')+'Rest eingespielt – App wird neu geladen'); }
        else TOAST.show('Sicherung eingespielt – App wird neu geladen',{type:'ok'});
        setTimeout(()=>location.reload(),failed||skipped.length?2600:900);
      };
      r.onerror=()=>TOAST.show('Datei konnte nicht gelesen werden');
      r.readAsText(f);
    }
  };
})();

/* ── Textmarkierungen auf Lernseiten (CSS Custom Highlight API; gespeichert wird das Zitat samt Umgebung) ── */
const HL=(function(){
  const KEY='bvi_hl', OK=!!(window.CSS&&CSS.highlights&&window.Highlight);
  const load=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ return {}; } };
  const save=d=>{ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} };
  let view=null, ranges=[], bar=null, timer=null;
  // im Kapitel-Fenster (Handy/Tablet) liegt der Kapiteltext im Fenster statt in .pc
  const root=()=>{ const v=view&&document.getElementById(view); if(!v) return null; return (v.classList.contains('lp-open')&&v.querySelector(':scope > .lp-win .lp-wbody'))||v.querySelector('.pc'); };
  const lesson=pc=>!!pc&&(pc.classList.contains('lp-wbody')||!!pc.querySelector('.sec-h,.acc-item,.info-card,table'));
  function index(pc){
    const w=document.createTreeWalker(pc,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&!n.parentElement.closest('script,style,textarea,input,.m-report,#m-hl-bar')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
    const arr=[]; let n,pos=0;
    while((n=w.nextNode())){ arr.push({n,s:pos}); pos+=n.data.length; }
    return {arr,full:arr.map(x=>x.n.data).join('')};
  }
  function span(r,idx){
    let a=null,b=null;
    for(const e of idx.arr){
      if(!r.intersectsNode(e.n)) continue;
      const st=e.n===r.startContainer?r.startOffset:0, en=e.n===r.endContainer?r.endOffset:e.n.data.length;
      if(en<=st) continue;
      if(a===null) a=e.s+st;
      b=e.s+en;
    }
    return a===null?null:[a,b];
  }
  function locate(idx,h){
    let best=-1,score=-1,from=0,i;
    while((i=idx.full.indexOf(h.q,from))!==-1){
      let sc=0;
      if(h.p&&idx.full.slice(Math.max(0,i-h.p.length),i)===h.p) sc+=2;
      if(h.s&&idx.full.slice(i+h.q.length,i+h.q.length+h.s.length)===h.s) sc+=2;
      if(sc>score){ score=sc; best=i; }
      from=i+1;
    }
    return best<0?null:[best,best+h.q.length];
  }
  function toRange(idx,a,b){
    const r=document.createRange(); let set=false;
    for(const e of idx.arr){
      const end=e.s+e.n.data.length;
      if(!set&&a<end){ r.setStart(e.n,a-e.s); set=true; }
      if(set&&b<=end){ r.setEnd(e.n,b-e.s); return r; }
    }
    return null;
  }
  function apply(id){
    view=id; ranges=[];
    if(!OK) return;
    const pc=root();
    if(!lesson(pc)){ CSS.highlights.delete('user-hl'); hide(); return; }
    const idx=index(pc), list=load()[id]||[];
    list.forEach((h,i)=>{ const sp=locate(idx,h); const r=sp&&toRange(idx,sp[0],sp[1]); if(r){ r._i=i; ranges.push(r); } });
    ranges.length?CSS.highlights.set('user-hl',new Highlight(...ranges)):CSS.highlights.delete('user-hl');
    hide();
  }
  const overlaps=(r,h)=>h.isPointInRange(r.startContainer,r.startOffset)||h.isPointInRange(r.endContainer,r.endOffset)||r.isPointInRange(h.startContainer,h.startOffset);
  function hide(){ if(bar) bar.hidden=true; }
  function update(){
    const pc=root(), sel=getSelection();
    if(!OK||!lesson(pc)||!sel||!sel.rangeCount) return hide();
    const r=sel.getRangeAt(0), node=r.commonAncestorContainer, el=node.nodeType===1?node:node.parentElement;
    if(!pc.contains(node)||(el&&el.closest('textarea,input,#m-hl-bar'))) return hide();
    const hit=ranges.filter(h=>overlaps(r,h));
    const canAdd=!r.collapsed&&r.toString().trim().length>=2;
    if(!canAdd&&!hit.length) return hide();
    if(!bar) build();
    bar.querySelector('[data-a="add"]').hidden=!canAdd;
    bar.querySelector('[data-a="card"]').hidden=!canAdd;
    bar.querySelector('[data-a="del"]').hidden=!hit.length;
    bar.hidden=false;
  }
  function build(){
    bar=document.createElement('div'); bar.id='m-hl-bar'; bar.hidden=true; bar.setAttribute('role','toolbar');
    bar.innerHTML='<button data-a="add">Markieren</button><button data-a="card">Als Lernkarte</button><button data-a="del">Markierung entfernen</button>';
    ['mousedown','touchstart'].forEach(ev=>bar.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
    bar.addEventListener('click',e=>{ const a=e.target.closest('button')?.dataset.a; if(a==='add') add(); else if(a==='card') toCard(); else if(a==='del') remove(); });
    document.body.appendChild(bar);
  }
  function add(){
    const pc=root(), sel=getSelection(); if(!pc||!sel||!sel.rangeCount) return;
    const idx=index(pc), sp=span(sel.getRangeAt(0),idx); if(!sp) return;
    let [a,b]=sp; while(a<b&&/\s/.test(idx.full[a])) a++; while(b>a&&/\s/.test(idx.full[b-1])) b--;
    const q=idx.full.slice(a,b);
    if(q.length<2||q.length>800){ TOAST.show('Markiere eine Stelle zwischen 2 und 800 Zeichen'); return; }
    const d=load(), list=d[view]||[];
    list.push({q,p:idx.full.slice(Math.max(0,a-24),a),s:idx.full.slice(b,b+24)});
    d[view]=list; save(d);
    sel.removeAllRanges(); apply(view);
    TOAST.show('Stelle markiert',{type:'ok'});
  }
  // Markierten Text als Antwort einer eigenen Lernkarte übernehmen; die Frage schreibt man selbst
  function toCard(){
    const sel=getSelection(); if(!sel||!sel.rangeCount) return;
    const t=sel.toString().replace(/\s+/g,' ').trim(); if(t.length<2) return;
    sel.removeAllRanges(); hide();
    CUSTOM.open({a:t,view});
    TOAST.show('Schreibe oben die Frage dazu',{type:'info'});
  }
  function remove(){
    const sel=getSelection(), r=sel&&sel.rangeCount?sel.getRangeAt(0):null; if(!r) return;
    const drop=new Set(ranges.filter(h=>overlaps(r,h)).map(h=>h._i));
    const d=load(); d[view]=(d[view]||[]).filter((_,i)=>!drop.has(i)); if(!d[view].length) delete d[view];
    save(d); sel.removeAllRanges(); apply(view);
    TOAST.show('Markierung entfernt');
  }
  document.addEventListener('selectionchange',()=>{ clearTimeout(timer); timer=setTimeout(update,120); });
  return {
    apply, hide, supported:OK,
    all(){ const d=load(); return Object.keys(d).map(v=>({view:v,items:d[v]})); },
    removeAt(v,i){ const d=load(); (d[v]=d[v]||[]).splice(i,1); if(!d[v].length) delete d[v]; save(d); if(v===view) apply(view); }
  };
})();

/* ── Nutzungszeit: zählt nur, solange die App sichtbar ist und bedient wird ── */
const USAGE=(function(){
  const KEY='bvi_usage', TICK=15, IDLE=5*60*1000;
  let last=Date.now();
  const pad=n=>String(n).padStart(2,'0');
  const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  ['pointerdown','keydown','wheel','touchstart','scroll'].forEach(ev=>window.addEventListener(ev,()=>{ last=Date.now(); },{passive:true,capture:true}));
  setInterval(()=>{
    if(document.visibilityState!=='visible'||Date.now()-last>IDLE) return;
    const d=load(), k=key(new Date());
    d[k]=(d[k]||0)+TICK;
    try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){}
  },TICK*1000);
  return {
    today(){ return load()[key(new Date())]||0; },
    week(){
      const d=load(), mo=new Date(); mo.setDate(mo.getDate()-((mo.getDay()+6)%7));
      return Array.from({length:7},(_,i)=>{ const x=new Date(mo); x.setDate(mo.getDate()+i); return d[key(x)]||0; });
    },
    total(){ return Object.values(load()).reduce((a,b)=>a+b,0); },
    // letzte n Monate (ältester zuerst) mit Sekunden je Monat
    months(n){
      const d=load(), now=new Date();
      return Array.from({length:n},(_,i)=>{
        const x=new Date(now.getFullYear(),now.getMonth()-(n-1-i),1), pre=x.getFullYear()+'-'+pad(x.getMonth()+1)+'-';
        let sec=0; for(const k in d) if(k.startsWith(pre)) sec+=d[k];
        return {y:x.getFullYear(),m:x.getMonth(),sec};
      });
    }
  };
})();

const SPENDE_URL='https://www.paypal.me/FabianFlemig';

/* ── Bild-Vergrößerung (Lightbox) ───────────────────────────────────────── */
const LIGHTBOX=(function(){
  let box=null, stage=null, content=null, open=false;
  let sc=1, tx=0, ty=0;
  const pts=new Map(); let startDist=0, startSc=1, last=null, lastTap=0;
  function apply(){ content.style.transform=`translate(${tx}px,${ty}px) scale(${sc})`; }
  function reset(){ sc=1; tx=0; ty=0; apply(); }
  function zoomAt(f,cx,cy){
    const n=Math.min(6,Math.max(1,sc*f)), r=n/sc, b=stage.getBoundingClientRect();
    const ox=cx-(b.left+b.width/2), oy=cy-(b.top+b.height/2);
    tx=ox-(ox-tx)*r; ty=oy-(oy-ty)*r; sc=n;
    if(sc===1){ tx=0; ty=0; }
    apply();
  }
  function build(){
    box=document.createElement('div'); box.id='lb'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Bildansicht');
    box.innerHTML='<div class="lb-stage"><div class="lb-content"></div></div><div class="lb-cap"></div>'
      +'<button class="lb-x" aria-label="Schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'
      +'<div class="lb-hint">Zum Zoomen zweimal tippen oder zwei Finger nutzen</div>';
    document.body.appendChild(box);
    stage=box.querySelector('.lb-stage'); content=box.querySelector('.lb-content');
    box.querySelector('.lb-x').onclick=()=>close();
    stage.addEventListener('pointerdown',e=>{
      stage.setPointerCapture(e.pointerId); pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pts.size===2){ const [a,b]=[...pts.values()]; startDist=Math.hypot(a.x-b.x,a.y-b.y); startSc=sc; }
      last={x:e.clientX,y:e.clientY,t:Date.now(),moved:false};
    });
    stage.addEventListener('pointermove',e=>{
      if(!pts.has(e.pointerId)) return;
      const p=pts.get(e.pointerId), dx=e.clientX-p.x, dy=e.clientY-p.y;
      p.x=e.clientX; p.y=e.clientY;
      if(last&&Math.hypot(e.clientX-last.x,e.clientY-last.y)>6) last.moved=true;
      if(pts.size===2){
        const [a,b]=[...pts.values()], d=Math.hypot(a.x-b.x,a.y-b.y);
        if(startDist) zoomAt((startSc*d/startDist)/sc,(a.x+b.x)/2,(a.y+b.y)/2);
      } else if(sc>1){ tx+=dx; ty+=dy; apply(); }
    });
    const up=e=>{
      if(!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if(pts.size===0&&last&&!last.moved&&Date.now()-last.t<350){
        const now=Date.now();
        if(now-lastTap<320){ lastTap=0; if(sc>1) reset(); else zoomAt(2.5,e.clientX,e.clientY); }
        else{
          lastTap=now;
          setTimeout(()=>{ if(lastTap&&Date.now()-lastTap>=300){ lastTap=0; if(sc===1&&!e.target.closest('.lb-x')) close(); } },320);
        }
      }
    };
    stage.addEventListener('pointerup',up); stage.addEventListener('pointercancel',up);
    stage.addEventListener('wheel',e=>{ e.preventDefault(); zoomAt(e.deltaY<0?1.2:1/1.2,e.clientX,e.clientY); },{passive:false});
    document.addEventListener('keydown',e=>{ if(!open) return; if(e.key==='Escape') close(); else if(e.key==='+'||e.key==='=') zoomAt(1.3,innerWidth/2,innerHeight/2); else if(e.key==='-') zoomAt(1/1.3,innerWidth/2,innerHeight/2); else if(e.key==='0') reset(); });
  }
  function show(node,cap){
    if(!box) build();
    content.replaceChildren(node);
    box.querySelector('.lb-cap').textContent=cap||'';
    reset(); box.hidden=false; open=true;
    document.documentElement.classList.add('lb-open');
    try{ history.pushState(history.state,''); }catch(e){}
    box.querySelector('.lb-x').focus({preventScroll:true});
  }
  function close(fromPop){
    if(!open) return;
    open=false; box.hidden=true; content.replaceChildren(); pts.clear();
    document.documentElement.classList.remove('lb-open');
    if(!fromPop){ try{ history.back(); }catch(e){} }
  }
  document.addEventListener('click',e=>{
    if(open) return;
    const img=e.target.closest('img.pdf-img,img.pdf-img-sm');
    if(img){ const c=img.cloneNode(); c.className='lb-img'; c.removeAttribute('style'); c.draggable=false; show(c,img.alt); return; }
    const svg=e.target.closest('.diagram-wrap svg');
    if(svg&&!e.target.closest('a,button')){
      const c=svg.cloneNode(true); c.classList.add('lb-img'); c.removeAttribute('style'); c.removeAttribute('width'); c.removeAttribute('height');
      show(c,svg.getAttribute('aria-label')||'');
    }
  });
  return {open:show,close,isOpen:()=>open};
})();

/* ── App teilen (QR-Code) und Installationshilfe ────────────────────────── */
const APPSHARE=(function(){
  const URL_APP='https://flametan.github.io/BVI-Lernwebsite/';
  let box=null, loading=null;
  function loadLib(){
    if(window.qrcode) return Promise.resolve();
    return loading||(loading=new Promise((ok,fail)=>{
      const s=document.createElement('script'); s.src='js/qrcode.min.js'; s.onload=ok; s.onerror=()=>{ loading=null; fail(); };
      document.head.appendChild(s);
    }));
  }
  function build(){
    box=document.createElement('div'); box.id='share-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','App teilen');
    box.innerHTML='<div class="sh-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t">B VI auf dem Handy öffnen</div>'
      +'<div class="sh-qr" id="sh-qr" role="img" aria-label="QR-Code zum Link der App"></div>'
      +'<div class="sh-u">'+URL_APP.replace('https://','')+'</div>'
      +'<div class="sh-b"><button class="btn btn-gold" id="sh-copy">Link kopieren</button><button class="btn btn-ghost" id="sh-share" hidden>Teilen …</button></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
    box.querySelector('#sh-copy').onclick=async()=>{
      try{ await navigator.clipboard.writeText(URL_APP); TOAST.show('Link kopiert',{type:'ok'}); }
      catch(e){ TOAST.show(URL_APP,{type:'info'}); }
    };
    const sb=box.querySelector('#sh-share');
    if(navigator.share){ sb.hidden=false; sb.onclick=()=>navigator.share({title:'B VI – Höherer Dienst',url:URL_APP}).catch(()=>{}); }
  }
  async function open(){
    if(!box) build();
    box.hidden=false;
    const el=box.querySelector('#sh-qr');
    try{
      await loadLib();
      const q=qrcode(0,'M'); q.addData(URL_APP); q.make();
      el.innerHTML=q.createSvgTag({cellSize:6,margin:2,scalable:true});
    }catch(e){ el.textContent='QR-Code konnte nicht geladen werden – nutze den Link darunter.'; }
    box.querySelector('.sh-x').focus({preventScroll:true});
  }
  function close(){ if(box) box.hidden=true; }
  // QR-Code für beliebigen Text in ein Element zeichnen (z. B. geteilte Lernkarten)
  async function qr(el,text){
    await loadLib();
    const q=qrcode(0,'L'); q.addData(text); q.make();
    el.innerHTML=q.createSvgTag({cellSize:4,margin:2,scalable:true});
  }
  return {open,close,qr};
})();

const INSTALL=(function(){
  let deferred=null;
  window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferred=e; render(); });
  window.addEventListener('appinstalled',()=>{ deferred=null; render(); });
  const ua=navigator.userAgent||'';
  const ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const android=/Android/.test(ua);
  const standalone=()=>window.matchMedia&&(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true);
  function render(){
    const el=document.getElementById('app-device'); if(!el) return;
    let t,steps=[],btn='';
    if(window.BVIAndroid){ t='Du nutzt die Android-App bereits ✓'; }
    else if(standalone()){ t='Die App ist installiert ✓'; }
    else if(ios){ t='So installierst du die App auf deinem iPhone / iPad'; steps=['Öffne diese Seite in <strong>Safari</strong>','Tippe unten auf das <strong>Teilen-Symbol</strong> (□↑)','Wähle <strong>„Zum Home-Bildschirm“</strong> und bestätige mit <strong>„Hinzufügen“</strong>']; }
    else if(android){ t='So installierst du die App auf deinem Android-Gerät'; steps=deferred?['Tippe auf <strong>„Jetzt installieren“</strong> und bestätige']:['Tippe oben rechts auf das <strong>Menü</strong> (⋮)','Wähle <strong>„App installieren“</strong> oder <strong>„Zum Startbildschirm hinzufügen“</strong>','Alternativ: die <strong>APK</strong> weiter unten laden – sie ändert auch das Symbol mit deiner Akzentfarbe']; }
    else { t='So installierst du die App am Computer'; steps=deferred?['Klicke auf <strong>„Jetzt installieren“</strong>']:['Klicke in der Adressleiste auf das <strong>Installieren-Symbol</strong> (Chrome, Edge) oder im Menü auf <strong>„App installieren“</strong>','Auf dem Handy: QR-Code unten scannen']; }
    if(deferred&&!standalone()) btn='<button class="btn btn-gold" onclick="INSTALL.prompt()">Jetzt installieren</button>';
    el.innerHTML='<div class="m-card"><div class="m-eyebrow">Für dein Gerät</div><div class="m-t1" style="margin:4px 0 8px">'+t+'</div>'
      +(steps.length?'<ol class="ap-steps">'+steps.map(x=>'<li>'+x+'</li>').join('')+'</ol>':'')
      +'<div class="ap-act">'+btn+'<button class="btn btn-ghost" onclick="APPSHARE.open()">QR-Code zum Teilen</button></div></div>';
  }
  async function prompt(){ if(!deferred) return; deferred.prompt(); try{ await deferred.userChoice; }catch(e){} deferred=null; render(); }
  return {render,prompt};
})();

/* ── Klausur-Timer für die Übungsklausuren ──────────────────────────────── */
const ETIMER=(function(){
  const KEY='bvi_et_end', VIEWS=['v-klausurfragen','v-feuak-altklausur','v-klausur-0826','v-eingrenzung-klausur','v-laufbahn-2023','v-laufbahn-2026'];
  let pill=null, tick=null, minutes=60;
  const left=()=>{ try{ const e=parseInt(localStorage.getItem(KEY),10); return e?Math.round((e-Date.now())/1000):null; }catch(x){ return null; } };
  const fmt=sec=>{ sec=Math.max(0,sec); const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60; return (h?h+':':'')+String(m).padStart(h?2:1,'0')+':'+String(s).padStart(2,'0'); };
  function ensurePill(){
    if(pill) return;
    pill=document.createElement('div'); pill.id='et-pill'; pill.hidden=true;
    pill.innerHTML='<span class="et-t" role="timer"></span><button class="et-stop" aria-label="Timer beenden">×</button>';
    pill.querySelector('.et-stop').onclick=stop;
    document.body.appendChild(pill);
  }
  function update(){
    const l=left(); ensurePill();
    if(l===null){ pill.hidden=true; clearInterval(tick); tick=null; return; }
    pill.hidden=false;
    pill.classList.toggle('urgent',l<=300&&l>0);
    pill.classList.toggle('over',l<=0);
    pill.querySelector('.et-t').textContent=l>0?'⏱ '+fmt(l):'Zeit um';
    if(l<=-60){ try{ localStorage.removeItem(KEY); }catch(x){} clearInterval(tick); tick=null; pill.hidden=true; return; }   // abgelaufene Zeit nicht ewig anzeigen
    if(l<=0&&!pill.dataset.done){ pill.dataset.done='1'; if(navigator.vibrate) navigator.vibrate([200,100,200]); TOAST.show('Die Zeit ist um – Stift runter!',{type:'ok'}); }
  }
  function start(min){
    if(document.documentElement.classList.contains('no-timers')) return;
    try{ localStorage.setItem(KEY,String(Date.now()+min*60000)); }catch(e){}
    ensurePill(); delete pill.dataset.done; update();
    clearInterval(tick); tick=setInterval(update,1000);
    TOAST.show('Timer läuft: '+min+' Minuten',{type:'ok'});
  }
  function stop(){ try{ localStorage.removeItem(KEY); }catch(e){} update(); }
  function card(){
    return '<div class="m-card et-card"><div class="m-t1">Klausur simulieren</div><div class="m-t2" style="margin:2px 0 10px">Stelle einen Timer und bearbeite die Fragen, ohne in die Musterlösung zu schauen.</div>'
      +'<div class="et-row"><span class="m-seg" role="group" aria-label="Dauer">'+[30,45,60,90].map(m=>'<button class="et-d'+(m===minutes?' active':'')+'" data-m="'+m+'">'+m+' min</button>').join('')+'</span>'
      +'<button class="btn btn-gold et-go">Timer starten</button></div></div>';
  }
  function mount(id){
    if(!VIEWS.includes(id)) return;
    const pc=document.querySelector('#'+id+' .pc'); if(!pc||pc.querySelector('.et-card')) return;
    pc.insertAdjacentHTML('afterbegin',card());
    const c=pc.querySelector('.et-card');
    c.querySelectorAll('.et-d').forEach(b=>b.onclick=()=>{ minutes=+b.dataset.m; c.querySelectorAll('.et-d').forEach(x=>x.classList.toggle('active',x===b)); });
    c.querySelector('.et-go').onclick=()=>start(minutes);
  }
  function init(){
    const l=left();
    if(l!==null&&l<=-60){ try{ localStorage.removeItem(KEY); }catch(x){} return; }   // alter, längst abgelaufener Timer
    if(l!==null){ ensurePill(); if(l<=0) pill.dataset.done='1'; update(); tick=setInterval(update,1000); }
  }
  return {mount,init,start,stop};
})();

/* ── Fehler melden: E-Mail oder GitHub ──────────────────────────────────── */
const REPORT=(function(){
  let box=null;
  function build(){
    box=document.createElement('div'); box.id='rp-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Fehler melden');
    box.innerHTML='<div class="sh-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t">Fehler oder Unklarheit melden</div>'
      +'<div class="m-t2">Seite, Link und App-Version werden automatisch mitgeschickt.</div>'
      +'<div class="sh-b" style="flex-direction:column;align-items:stretch"><a class="btn btn-gold" id="rp-mail">Per E-Mail senden</a><a class="btn btn-ghost" id="rp-gh" target="_blank" rel="noopener noreferrer">Auf GitHub melden (Konto nötig)</a></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')||e.target.closest('a')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
  }
  function open(mail,gh){ if(!box) build(); box.querySelector('#rp-mail').href=mail; box.querySelector('#rp-gh').href=gh; box.hidden=false; box.querySelector('#rp-mail').focus({preventScroll:true}); }
  function close(){ if(box) box.hidden=true; }
  return {open,close};
})();

/* ── Farbschema: Dunkel / Hell / System ─────────────────────────────────── */
const THEME=(function(){
  const KEY='bvi_theme', MODES=['dark','light','system'];
  const mq=window.matchMedia?matchMedia('(prefers-color-scheme: light)'):null;
  function get(){ try{ const m=localStorage.getItem(KEY); return MODES.includes(m)?m:'system'; }catch(e){ return 'system'; } }
  function light(m){ return m==='light'||(m==='system'&&!!(mq&&mq.matches)); }
  function apply(m){
    const l=light(m);
    document.documentElement.setAttribute('data-theme',l?'light':'dark');
    const t=document.querySelector('meta[name=theme-color]'); if(t) t.content=l?'#f4f4f1':'#121212';
    try{ ACCENT.syncIcon(); }catch(e){}   // beim ersten Aufruf ist ACCENT noch nicht angelegt
    document.querySelectorAll('.theme-opt').forEach(b=>{ const on=b.dataset.mode===m; b.classList.toggle('active',on); b.setAttribute('aria-pressed',on); });
  }
  if(mq) (mq.addEventListener?mq.addEventListener.bind(mq,'change'):mq.addListener.bind(mq))(()=>{ if(get()==='system') apply('system'); });
  return {
    init(){ apply(get()); },
    set(m){ if(!MODES.includes(m)) return; try{ localStorage.setItem(KEY,m); }catch(e){} apply(m); },
    render(){ apply(get()); }
  };
})();
THEME.init();

/* ── Akzentfarbe der Mobil-Ansicht ──────────────────────────────────────── */
const ACCENT=(function(){
  const KEY='bvi_accent', DEF='#FFA412';
  const PRESETS=[['#FFA412','Orange','orange'],['#C9A84C','Gold','gold'],['#E5484D','Rot','red'],['#3E8EF7','Blau','blue'],['#3DBE7A','Grün','green']];
  const valid=c=>/^#[0-9a-f]{6}$/i.test(c||'');
  function get(){ try{ const c=localStorage.getItem(KEY); return valid(c)?c.toUpperCase():DEF; }catch(e){ return DEF; } }
  function onColor(hex){
    // Schrift auf Akzentfläche: die Farbe (dunkel oder weiß) mit dem höheren WCAG-Kontrast
    const n=parseInt(hex.slice(1),16), ch=v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); };
    const L=.2126*ch(n>>16&255)+.7152*ch(n>>8&255)+.0722*ch(n&255);
    return (L+.05)/(0.0056+.05)>=(1.05)/(L+.05)?'#111':'#fff';   // #111 hat die Leuchtdichte ≈ .0056
  }
  function apply(c){
    const st=document.documentElement.style;
    st.setProperty('--m-accent',c);
    st.setProperty('--m-on-accent',onColor(c));
    favicon(c);
  }
  // Tab-Symbol im Browser: Flamme in der Akzentfarbe (installierte Web-App behält ihr festes Symbol)
  function favicon(c){
    const el=document.getElementById('fav'); if(!el) return;
    const d='M12 2s5 4.6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3 1-6 1-8z';
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0a0a0a"/><g transform="translate(-24.8 33.7) scale(23.4)"><path d="${d}" fill="${c}"/><path d="${d}" fill="#fff" fill-opacity=".65" transform="translate(12 17) scale(.52) translate(-12 -17)"/></g></svg>`;
    el.href='data:image/svg+xml,'+encodeURIComponent(svg);
  }
  // Android-App: Startsymbol in der nächstliegenden der 5 Vorgabefarben
  function syncAppIcon(c){
    if(!window.BVIAndroid||!BVIAndroid.setIcon) return;
    const rgb=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};
    const [r,g,b]=rgb(c);
    let best=PRESETS[0],min=Infinity;
    PRESETS.forEach(p=>{const [x,y,z]=rgb(p[0]),d=(r-x)**2+(g-y)**2+(b-z)**2;if(d<min){min=d;best=p;}});
    const light=document.documentElement.getAttribute('data-theme')==='light';
    try{ BVIAndroid.setIcon(best[2]+(light?'_light':'')); }catch(e){}
    try{ if(BVIAndroid.setWidgetStyle) BVIAndroid.setWidgetStyle(c,light); }catch(e){}
  }
  function render(){
    const cur=get(), custom=!PRESETS.some(p=>p[0]===cur);
    const html=PRESETS.map(([c,n])=>`<button class="m-sw" role="radio" aria-checked="${c===cur}" aria-label="${n}" style="background:${c}" onclick="ACCENT.set('${c}')"></button>`).join('')
      +`<label class="m-sw m-sw-wheel" role="radio" aria-checked="${custom}" aria-label="Eigene Farbe wählen">${custom?`<i style="background:${cur}"></i>`:''}<input type="color" value="${cur.toLowerCase()}" oninput="ACCENT.preview(this.value)" onchange="ACCENT.set(this.value)"></label>`;
    document.querySelectorAll('#m-accent,.ob-accent').forEach(el=>{ el.innerHTML=html; });
  }
  return {
    init(){ const c=get(); apply(c); syncAppIcon(c); },
    set(c){ if(!valid(c)) return; c=c.toUpperCase(); try{ localStorage.setItem(KEY,c); }catch(e){} apply(c); syncAppIcon(c); render(); },
    preview(c){ if(valid(c)) apply(c); },
    syncIcon(){ syncAppIcon(get()); },
    render
  };
})();
ACCENT.init();
ETIMER.init();

/* ── Mobil-Ansicht: Tab-Leiste, Startseite, Prüfung, Einstellungen ──────── */
const SHELL=(function(){
  const ROOTS={'v-home':'start','v-plan':'plan','v-pruefung':'exam','v-settings':'settings','v-pause':'pause'};
  const MODS=[
    ['gal','GAL','Grundlehrgang','v-gal','GAL Grundlehrgang',1],
    ['sfs','SFS','Staatliche Feuerwehrschule Regensburg','v-sfs','SFS Regensburg',1],
    ['hlfs','HLFS','Hessische Landesfeuerwehrschule Kassel','v-hlfs','HLFS Kassel',1],
    ['ibk','IBK','Institut für Brand- und Katastrophenschutz Heyrothsberge','v-ibk','IBK Heyrothsberge',2],
    ['vak','VAk','Verwaltungsakademie Berlin','v-vak','VAk Berlin',2],
    ['feuak','FeuAK','Feuerwehrakademie Hamburg','v-feuak','FeuAK Hamburg',2],
    ['idf','IdF','Institut der Feuerwehr NRW · Münster','v-idf','IdF Münster',2]
  ];
  const EXAMS=[
    ['Laufbahnprüfung',[
      ['v-laufbahn-2026','Laufbahnklausuren Juni 2026','Recht, Management, Stabsarbeit, Vorbeugender Brandschutz · Musterlösungen','doc',true],
      ['v-laufbahn-2023','Laufbahnklausuren Dez 2023','Führungsvorgang, Recht, Management, Heyrothsberge · Musterlösungen','doc']]],
    ['IdF Münster',[
      ['v-idf-altklausur','Altklausur-Quiz IdF',(typeof IDF_QUIZ_Q!=='undefined'?IDF_QUIZ_Q.length:0)+' Fragen · Vorbeugender Brandschutz & Stabsarbeit · Lern- und Prüfungsmodus','doc',true]]],
    ['FeuAK Hamburg',[
      ['v-klausur-0826','Klausur 08/2026','14 Originalfragen · 70 Punkte · Musterlösungen','doc',true],
      ['v-klausurfragen','Klausurfragen','14 Fragen der Dozenten-Liste · Freitext und Selbstbewertung','pen'],
      ['v-eingrenzung-klausur','Eingrenzung 08/2026 & Münster','12 Fragen · Kurzantwort und Musterlösung','target'],
      ['v-feuak-altklausur','Altklausur-Training FeuAK','22 Fragen aus Aug 2025 und Feb 2026','doc']]],
    ['VAk Berlin',[
      ['v-vak-altklausur','Altklausur-Quiz VAk','84 Fragen · Lernmodus oder Prüfungssimulation','doc',true],
      ['v-vak-fallbearbeitung','Fallbearbeitung','9-Punkte-Schema mit sechs Übungsfällen','pen',true],
      ['v-vak-klausurhinweise','Klausurhinweise','Prüfungsrelevante Themen und Definitionen','doc'],
      ['v-vak-klausurvorbereitung','Klausurvorbereitung VAk','Alle VAk-Materialien auf einen Blick','target']]],
    ['IBK Heyrothsberge',[
      ['v-simulator','Führungsdienstsimulator','8 Szenarien mit verzweigten Entscheidungen','sim',true]]]
  ];
  JG.setExams(EXAMS);
  const ICON={
    doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    sim:'<path d="M12 2s5 4.6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3 1-6 1-8z"/>',
    cal:'<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    cloud:'<path d="M18 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7"/><path d="M15 3h6v6M10 14 21 3"/>',
    exam:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    cards:'<rect x="2.5" y="7" width="15" height="14" rx="2.5"/><path d="M6.5 3.5h12a2.5 2.5 0 0 1 2.5 2.5v11"/>',
    play:'<path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z" fill="currentColor" stroke="none"/>',
    cup:'<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 2.5c-.6 1 .6 1.8 0 3M12 2.5c-.6 1 .6 1.8 0 3"/>',
    flame:'<path d="M12 2s5 4.6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3 1-6 1-8z" fill="currentColor" stroke="none"/>'
  };
  const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const goJs=(id,label)=>esc(`NAV.go(${JSON.stringify(id)},${JSON.stringify(label)})`);
  const row=({ic,t1,t2,on,right=''})=>`<button class="m-row m-go" onclick="${on}">${ic}<span class="m-tx"><span class="m-t1">${esc(t1)}</span>${t2?`<span class="m-t2">${esc(t2)}</span>`:''}</span>${right}</button>`;
  const ic=k=>`<span class="m-ic">${svg(k)}</span>`;

  // Startseite: Gruß und Spruch je Tageszeit; der Spruch bleibt pro App-Öffnung gleich
  const GREET={night:'Noch wach?',morning:'Guten Morgen',noon:'Mahlzeit',afternoon:'Guten Tag',evening:'Guten Abend'};
  const QUIPS={
    night:[
      "Die Leitstelle schläft nie – du offenbar auch nicht.",
      "Nachtschicht am Schreibtisch: Der Lagevortrag hält dich wach.",
      "Um diese Uhrzeit lernt nur, wer wirklich Bereitschaft hat.",
      "Selbst die Brandmeldeanlage gönnt sich gerade Ruhe.",
      "Nachteule erkannt. Kaffee ist keine Dauerlösung.",
      "Funkstille überall, nur dein Kopf ist noch auf Empfang.",
      "Ruhezeiten gelten auch für Führungskräfte. Nur so als Hinweis.",
      "Das Einsatztagebuch notiert: „Lernbetrieb weiterhin aktiv.“",
      "Mondschein, Monitorlicht und Musterbauordnung – romantischer wird's nicht.",
      "Selbst der Sicherheitstrupp hat jetzt Pause.",
      "Die Klausur schreibt man tagsüber. Nur so als Tipp.",
      "Nächtlicher Alarm? Nein, nur dein Ehrgeiz.",
      "Schlaf ist auch eine Lernmethode. Wissenschaftlich belegt.",
      "Wer um diese Zeit Gebäudeklassen paukt, verdient einen Orden.",
      "Die Stabsrahmenübung »Schlafmangel« läuft bereits.",
      "„Nur noch eine Karte“ – sagen alle um diese Uhrzeit.",
      "Sogar der Rauchmelder blinzelt dir müde zu.",
      "Lagefeststellung: Es ist dunkel, und du lernst. Respekt.",
      "Die Wache schläft, die Lernkarten nicht.",
      "Morgen früh dankt dir dein Kopf – oder er beschwert sich.",
      "Die Sterne leuchten, die Lernkarten auch.",
      "Bereitschaftsdienst im Schlafanzug – auch eine Dienstform.",
      "Wenn jetzt der Melder geht, bist du wenigstens schon wach.",
      "Nachtruhe ist kein Dienstvergehen. Nur so.",
      "Um diese Zeit zählt jede Karte doppelt. Gefühlt.",
      "Der Wachhabende fragt: Alles ruhig bei dir?",
      "Das Wissen sickert nachts besonders tief ein. Angeblich.",
      "Wach wie ein Nachtalarm, fleißig wie eine ganze Wachabteilung.",
      "Noch eine Frage, dann ist aber wirklich Licht aus.",
      "Die Wärmebildkamera würde jetzt nur dich und den Bildschirm sehen.",
      "Nachts sind alle Gebäudeklassen grau.",
      "Ein kurzer Blick auf den Plan – und dann ab ins Bett.",
      "Stille Wache am Schreibtisch: angetreten.",
      "Kaffee um diese Uhrzeit ist ein taktischer Fehler.",
      "Selbst die Pforte hat schon das Licht gedimmt.",
      "Du lernst, während andere schnarchen. Respekt.",
      "Nachtdienst-Modus: aktiviert.",
      "Morgen wirst du dich fragen, warum du so lange wach warst.",
      "Die Nacht ist kurz, die FwDV lang.",
      "Schlafen ist die beste Wiederholung. Gute Nacht – bald!"
    ],
    morning:[
      "Kaffee an, Gehirn hochfahren, Lagefeststellung beginnen.",
      "Frühdienst! Heute wird gelernt, nicht nur gelöscht.",
      "Der frühe Vogel kennt alle Gebäudeklassen.",
      "Erst Kaffee, dann Krisenstab.",
      "Morgenappell: Alle Synapsen bitte vollzählig antreten.",
      "Wissen kalt einspeisen, Kaffee heiß trinken.",
      "Heute sagst du S1 bis S6 im Schlaf auf. Na ja, fast.",
      "Die Sonne geht auf, der Lernfortschritt hoffentlich auch.",
      "Morgenstund hat Gold im Mund – und die FwDV im Kopf.",
      "Fahrzeughalle offen, Kopf auch. Los geht's.",
      "Einsatzbereitschaft hergestellt. Jetzt fehlt nur noch der Kaffee.",
      "Heute ist ein guter Tag für einen sauberen Führungsvorgang.",
      "Wer morgens lernt, muss abends nicht büffeln.",
      "Erste Lagemeldung: motiviert, aber noch im Bademantel.",
      "Das Frühstück ist die wichtigste Mahlzeit – direkt nach den Lernkarten.",
      "Alarmstufe Kaffee: erreicht.",
      "Die Brötchen sind frisch, die Rechtsgrundlagen hoffentlich auch.",
      "Wach werden ist auch eine Form von Lagebeurteilung.",
      "Der innere Schweinehund bekommt heute keinen Einsatzbefehl.",
      "Guten Start – heute wird's ein Wissens-Großeinsatz.",
      "Der Tag hat gerade erst ausgerückt.",
      "Das Funkgerät ist noch still, der Kopf schon an.",
      "Wer früh aufsteht, hat mehr Zeit für Lernkarten.",
      "Frisch geduscht, frisch motiviert.",
      "Heute schon Fahrzeugkunde gemacht? Zur Not tut's auch eine Lernkarte.",
      "Morgenlage: Wetter egal, Motivation hoch.",
      "Atemschutzüberwachung läuft – du atmest, also lernst du.",
      "Kaffee ist das Löschmittel gegen Müdigkeit.",
      "Erste Übung des Tages: Augen offen halten.",
      "Der Morgen gehört den Schnellen und den Neugierigen.",
      "Gestern ist abgearbeitet, heute ist ein neuer Einsatz.",
      "Fahrzeugcheck erledigt? Dann jetzt Kopfcheck.",
      "Früh übt sich, wer in den höheren Dienst will.",
      "Ein Frühstücksbrötchen und eine Lernkarte, bitte.",
      "Die Sonne meldet: einsatzbereit. Und du?",
      "Heute schreiben wir Geschichte. Oder wenigstens Stichpunkte.",
      "Gute Laune ist ansteckend. Wissen hoffentlich auch.",
      "Wer morgens schon hier ist, hat den Tag im Griff.",
      "Ab in den Tag – mit Plan, Kaffee und Lernkarten.",
      "Schichtbeginn: Kopf auf Empfang, Handy auf Lernen."
    ],
    noon:[
      "Mittagspause naht. Vorher noch schnell eine Karte?",
      "Erst die Karten, dann die Kantine.",
      "Der Magen knurrt lauter als jedes Funkgerät.",
      "Lagefeststellung: Hunger. Maßnahme: Mittagessen.",
      "Halbzeit! Die zweite Hälfte des Tages wartet schon.",
      "Zwischen Suppe und Stabsarbeit passt noch eine Lernkarte.",
      "Die Kantine ist kein Bereitstellungsraum. Aber fast.",
      "Nachschub angefordert: Essen und Wissen.",
      "Löschwasserversorgung ist wichtig. Trinkwasserversorgung auch.",
      "Auch Führungskräfte brauchen Verpflegung. Zuständig: S4.",
      "Nach dem Essen sollst du ruhen oder tausend Karten üben.",
      "Der Küchenwagen ist schon unterwegs. Hoffentlich.",
      "Kurze Pause im Einsatzabschnitt Schreibtisch.",
      "Satt und schlau – die perfekte Kombination.",
      "Mittagstief? Nicht mit dir.",
      "Schnitzel mit Brandschutzordnung – das Tagesgericht.",
      "Die Lernkarten essen übrigens nicht mit.",
      "Wer mit vollem Bauch lernt, lernt doppelt. Behauptet zumindest der Koch.",
      "Volle Teller, volle Akkus, voller Lernplan.",
      "13 Uhr ist Mittag. Bis dahin zählt jede Minute.",
      "Nachtisch gibt's erst nach drei Karten.",
      "Kurze Lagebesprechung: Was gibt's heute in der Kantine?",
      "Die Mittagspause ist heilig. Die Lernkarten sind geduldig.",
      "Satt werden ist auch eine Form von Eigenschutz.",
      "Ein Lernhäppchen zum Mittagessen?",
      "Pünktlich um 13 Uhr wird verpflegt – bis dahin wird gelernt.",
      "Mittag ist, wenn der Kopf nach Kartoffeln verlangt.",
      "Zwischen Hauptgang und Dessert passt immer eine Definition.",
      "Auch die Wache macht jetzt Mittag. Fast alle.",
      "Die Verpflegungskomponente ist angefordert.",
      "Mittagsrapport: halb geschafft, halb satt.",
      "Kurze Pause, große Wirkung.",
      "Heute auf dem Speiseplan: Brandschutz à la carte.",
      "Wer mittags lernt, verdaut doppelt.",
      "Erst essen, dann Einsatzplanung.",
      "Mit leerem Magen löscht es sich schlecht.",
      "Mittag! Zeit, die Akkus aufzuladen.",
      "Ein Teller Nudeln und ein Prüfschema – das Mittagsmenü.",
      "Der Kopf braucht Pause, der Bauch braucht Essen.",
      "Halbzeitpfiff! Kurz durchatmen."
    ],
    afternoon:[
      "Mittagstief überstanden? Dann ab an die Karten.",
      "Kaffee Nummer drei zählt offiziell als Lernhilfe.",
      "Zeit für Kaffee, Kuchen und Krisenkommunikation.",
      "Die zweite Welle rollt an: Konzentration nachfordern!",
      "Halte durch – der Feierabend ist schon in Sichtweite.",
      "Das Gehirn meldet: Kapazität für noch ein Kapitel.",
      "Perfekte Zeit, um eine Klausurfrage zu knacken.",
      "Kuchenpause ist auch ein taktischer Rückzug.",
      "Kleine Nachforderung: noch zehn Minuten Fokus.",
      "Nachmittags lernen ist wie Nachlöschen – lohnt sich immer.",
      "Die Sonne sinkt, das Wissen steigt.",
      "Kurz die Lage beurteilen und dann Vollgas.",
      "Zwischen Kaffee und Feierabend passt noch ein Prüfschema.",
      "Der Tag ist noch jung. Na ja, mittelalt.",
      "Gute Nachricht: Mehr als die Hälfte des Tages ist geschafft.",
      "Der Nachmittag gehört den Fleißigen – und den Kuchenessern.",
      "Wer jetzt noch lernt, hat den Rückzugsbefehl elegant überhört.",
      "Nachmittagsübung: Die Lernkarten warten schon.",
      "Ein Kapitel noch, dann darfst du an den Kühlschrank.",
      "Feierabend kommt sowieso. Wissen nur, wenn du was tust.",
      "Das Nachmittagsprogramm: Kaffee, Kekse, Kompetenz.",
      "Die Uhr tickt Richtung Feierabend – du tickst Richtung Klausur.",
      "Jetzt wird's spannend: Endspurt des Tages.",
      "Konzentration ist wie Löschwasser – rechtzeitig nachfüllen.",
      "Kleiner Energieschub gefällig? Eine Lernkarte wirkt Wunder.",
      "Der Nachmittag ist lang genug für ein ganzes Kapitel.",
      "Wer jetzt dranbleibt, darf abends entspannen.",
      "Lagebild: müde Augen, wache Gedanken.",
      "Zeit für eine Lernrunde mit Kuchenbegleitung.",
      "Noch nicht Feierabend? Perfekt für eine Wiederholung.",
      "Nachmittagsdienst: Wissen nachfordern, Müdigkeit zurückstellen.",
      "Ein Keks pro richtiger Antwort. Deal?",
      "Die Sonne wandert, du lernst.",
      "Jetzt noch kurz durchziehen, dann ist der Tag gewonnen.",
      "Stabsarbeit am Nachmittag: S3 übernimmt deine Motivation.",
      "Gähnen ist erlaubt, Aufgeben nicht.",
      "Ein paar Karten noch, dann darfst du den Rechner ausmachen.",
      "Wer nachmittags lernt, hat abends frei.",
      "Zweiter Trupp vor: Konzentration, Wasser marsch!",
      "Fast geschafft – der Feierabend steht schon im Bereitstellungsraum."
    ],
    evening:[
      "Feierabend? Nicht für deinen Ehrgeiz.",
      "Couch, Tee und ein bisschen Verwaltungsrecht – so geht Entspannung.",
      "Der Kaminabend ist eröffnet. Thema: Lernen.",
      "Abendrunde: Ein paar Karten noch, dann ist Schluss.",
      "Wer abends lernt, träumt nachts von Gebäudeklassen.",
      "Abendlage: Was hast du heute gelernt?",
      "Die Fahrzeughalle ist sauber, jetzt ist der Kopf dran.",
      "Die Serie kann warten. Die FwDV nicht.",
      "Ein guter Tag endet mit einer guten Wiederholung.",
      "Einsatznachbesprechung des Tages: Lernkarten zählen dazu.",
      "Abendbrot erledigt? Dann jetzt Abendwissen.",
      "Die Sonne ist weg, die Motivation hoffentlich nicht.",
      "Noch eine Fragerunde vor dem Schlafengehen?",
      "Abends ist die Lage ruhig – perfekt zum Lernen.",
      "Kurze Lernschicht, dann ab in die Bereitschaft.",
      "Rückbau des Tages beginnt. Vorher noch eine Karte.",
      "Wer abends lernt, startet morgen mit Vorsprung.",
      "Zeit für eine entspannte Lagebesprechung mit dir selbst.",
      "Gleich ist Ruhezeit. Vorher noch ein kleines Erfolgserlebnis?",
      "Der Tag war lang, die Karteikarten sind kurz.",
      "Feierabendbier? Erst nach der Lernkarte.",
      "Abends werden die Fleißigen sichtbar.",
      "Schicht im Schacht – fast.",
      "Die Lernkarten freuen sich über Abendbesuch.",
      "Ein bisschen Wissen zum Abendbrot.",
      "Abendroutine: Zähne putzen, Karten lernen, schlafen.",
      "Heute schon geglänzt? Hier kannst du noch nachlegen.",
      "Der Abend gehört dir – und ein bisschen der FwDV.",
      "Abendlage: Akkus niedrig, Wissen hoch.",
      "Noch schnell den Tag sichern, dann Feierabend.",
      "Lesezeichen setzen und morgen weitermachen – auch ein Plan.",
      "Gemütlich lernen ist auch lernen.",
      "Abendsonne, Abendruhe, Abendrunde.",
      "Ein Prüfschema vor dem Schlafen – das Gute-Nacht-Märchen für Profis.",
      "Heute war ein guter Tag. Mit einer Karte wird er noch besser.",
      "Die Wache wechselt, du bleibst dran.",
      "Schluss machen ist erlaubt. Eine Karte vorher auch.",
      "Abends lernt es sich ohne Funkverkehr am besten.",
      "Der Tag geht, das Wissen bleibt.",
      "Gleich Feierabend – aber vorher noch ein kleiner Sieg."
    ]
  };
  const daySlot=h=>h>=22||h<5?'night':h<11?'morning':h<14?'noon':h<18?'afternoon':'evening';
  let _quip=null;
  // Satz bleibt, solange die Startseite nur neu gezeichnet wird; beim erneuten Aufrufen der Seite (newQuip) kommt ein anderer
  function quip(slot){
    if(!_quip||_quip.slot!==slot){ const l=QUIPS[slot], old=_quip&&_quip.text; let t; do{ t=l[Math.floor(Math.random()*l.length)]; }while(t===old&&l.length>1); _quip={slot,text:t}; }
    return _quip.text;
  }
  function newQuip(){ if(_quip) _quip.slot=null; }

  function cardStats(){
    let fc={}; try{ fc=JSON.parse(localStorage.getItem('bvi_fc')||'{}'); }catch(e){}
    const now=Date.now();
    const ids=new Set(FLASHCARD_DATA.map(c=>c.id)); if(!fc||typeof fc!=='object') fc={};
    const ks=Object.keys(fc).filter(k=>ids.has(k));
    return { known:ks.length, due:ks.filter(k=>fc[k]&&fc[k].nextReview<=now).length, total:FLASHCARD_DATA.length };
  }
  // Balken-Diagramm: beginnt bei 0, kein Strich bis zur Oberkante; Beschriftung nur an Balken mit Wert
  function plot(vals,labels,cur,top,secs){
    return `<div class="m-plot${vals.length>8?' many':''}" role="group" aria-label="Lernzeit je ${vals.length>8?'Monat':'Tag'}, antippen für die Zeit">${vals.map((v,i)=>{
      const h=v>0?Math.max(4,v/top*100):0, pos=i===0?' first':i===vals.length-1?' last':'';
      return `<button type="button" class="m-pc" onclick="SHELL.pick(this)" aria-label="${labels[i]}: ${dur(secs[i])}"><span class="m-tip${pos}" style="bottom:calc(${h}% + 22px)">${dur(secs[i])}</span><i class="m-pb${i===cur?' cur':v>0?' dim':' zero'}" style="height:${h}%"></i><span class="m-pl${i===cur?' cur':''}">${labels[i]}</span></button>`;}).join('')}</div>`;
  }
  function weekPlot(){
    const w=USAGE.week(), today=(new Date().getDay()+6)%7;
    const hours=Math.max(...w)>=7200;
    const v=w.map(x=>hours?x/3600:x/60), top=hours?Math.max(2,Math.ceil(Math.max(...v))):Math.max(30,Math.ceil(Math.max(...v)/10)*10);
    return {html:plot(v,['Mo','Di','Mi','Do','Fr','Sa','So'],today,top,w),unit:hours?'Stunden pro Tag':'Minuten pro Tag',sum:w.reduce((a,b)=>a+b,0)};
  }
  function monthPlot(){
    const ms=USAGE.months(12), names=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    const hours=Math.max(...ms.map(m=>m.sec))>=7200;
    const v=ms.map(m=>hours?m.sec/3600:m.sec/60), top=hours?Math.max(2,Math.ceil(Math.max(...v)/2)*2):Math.max(30,Math.ceil(Math.max(...v)/10)*10);
    return {html:plot(v,ms.map(m=>names[m.m]),ms.length-1,top,ms.map(m=>m.sec)),unit:hours?'Stunden pro Monat':'Minuten pro Monat',sum:ms.reduce((a,m)=>a+m.sec,0)};
  }
  function homeRing(p,label,aria){
    const r=44,c=2*Math.PI*r;
    return `<svg class="m-hring" viewBox="0 0 100 100" role="img" aria-label="${esc(aria)}"><circle cx="50" cy="50" r="${r}" class="bg"/>${p>0?`<circle cx="50" cy="50" r="${r}" class="fg" stroke-dasharray="${c*p/100} ${c}" transform="rotate(-90 50 50)"/>`:''}<text x="50" y="58" text-anchor="middle" font-size="${label.length>3?22:26}">${esc(label)}</text></svg>`;
  }
  let chartRange='week', y1Open=false;
  if(window.matchMedia) matchMedia('(min-width:701px)').addEventListener('change',()=>{ if(document.getElementById('v-home')?.classList.contains('active')) renderHome(); });

  function dur(sec){
    const m=Math.floor(sec/60);
    return m<60?`${m} min`:`${Math.floor(m/60)} h ${String(m%60).padStart(2,'0')}`;
  }

  // Voreinstellung: der nächste anstehende Termin (nach dem 14.12. folgt die Klausur nach § 21 am 21.12.)
  const DEF_EXAMS=[{date:'2026-12-14',name:'Leistungsnachweis nach § 13 Abs. 3'},{date:'2026-12-21',name:'Klausur nach § 21'}];
  const DEF_EXAM=DEF_EXAMS[0];
  function defExam(){
    const t=new Date(); t.setHours(0,0,0,0);
    let list=DEF_EXAMS;   // andere Jahrgänge: eigene Termine, sonst kein Countdown
    if(!JG.isMaster()){ const tm=JG.data().termine; list=tm.length?tm:[{date:'2000-01-01',name:'Klausur'}]; }
    return list.find(e=>new Date(e.date+'T00:00')>=t)||list[list.length-1];
  }
  function examCfg(){
    const d=defExam();
    try{
      const o=JSON.parse(localStorage.getItem('bvi_exam')||'{}');
      return {date:/^\d{4}-\d{2}-\d{2}$/.test(o.date||'')?o.date:d.date, name:((o.name||'').trim().slice(0,60))||d.name};
    }catch(e){ return {...d}; }
  }
  function goalMin(){
    try{ const v=parseInt(localStorage.getItem('bvi_goal'),10); return v>=5&&v<=240?v:30; }catch(e){ return 30; }
  }
  // Ziel der Countdown-Karte: Klausur nach § 21 → Laufbahnklausuren, sonst Altklausur-Quiz IdF
  function examTarget(){ return /§\s*21/.test(examCfg().name)?['v-laufbahn-2026','Laufbahnklausuren Juni 2026']:['v-idf-altklausur','Altklausur-Quiz IdF']; }
  function daysToExam(){
    const t=new Date(); t.setHours(0,0,0,0);
    return Math.round((new Date(examCfg().date+'T00:00')-t)/864e5);
  }
  const hhmm=d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  function dayWord(d){
    const t=new Date(); t.setHours(0,0,0,0);
    const x=new Date(d); x.setHours(0,0,0,0);
    const diff=Math.round((x-t)/864e5);
    return diff===0?'heute':diff===1?'morgen':d.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'});
  }
  // Lernzeit-Diagramm als eigene Karte: beim Wechsel Woche/Monate wird nur sie ersetzt, die Startseite animiert nicht neu
  function chartHtml(){
    const pl=chartRange==='month'?monthPlot():weekPlot(), isM=chartRange==='month';
    return `<div class="m-card m-chart2"><div class="m-chart-h"><span class="m-seg m-seg-s" role="group" aria-label="Zeitraum"><button class="${isM?'':'active'}" onclick="SHELL.setRange('week')">Woche</button><button class="${isM?'active':''}" onclick="SHELL.setRange('month')">Monate</button></span><span class="m-st"><b>${dur(pl.sum)}</b> / ${isM?'12 Monate':'Woche'}</span></div>
      ${pl.html}</div>`;
  }
  function renderHome(){
    const el=document.getElementById('m-home');
    if(!el) return;
    const now=new Date(), h=now.getHours();
    const slot=daySlot(h), hi=GREET[slot];
    const cnt=PROGRESS.counts();
    const cs=cardStats(), recent=RECENT.list()[0], nx=IDF_PLAN.next(), exam=daysToExam(), week=USAGE.week(), ex=examCfg();
    const pct=c=>c.total?Math.round(c.done/c.total*100):0;
    const modRow=m=>{
      const c=cnt[m[0]]||{done:0,total:0};
      return `<button class="m-row m-go" onclick="${goJs(m[3],m[4])}"><span class="m-ic">${m[1]}</span><span class="m-tx"><span class="m-t1">${m[1]}</span><span class="m-t2">${esc(m[2])}</span><span class="m-bar"><i style="width:${pct(c)}%"></i></span></span><span class="m-val">${c.done}/${c.total}</span></button>`;
    };
    const modCard=m=>{
      const c=cnt[m[0]]||{done:0,total:0};
      return `<button class="m-modcard" onclick="${goJs(m[3],m[4])}"><span class="m-mc-top"><span class="m-ic">${m[1]}</span><span class="m-val">${c.done}/${c.total}</span></span><b>${m[1]}</b><span class="m-t2">${esc(m[2])}</span><span class="m-bar"><i style="width:${pct(c)}%"></i></span></button>`;
    };
    const year=y=>{
      const ms=MODS.filter(m=>m[5]===y);
      return `<div class="m-sec">${y}. Ausbildungsjahr</div><div class="m-list m-only-s">${ms.map(modRow).join('')}</div><div class="m-modgrid">${ms.map(modCard).join('')}</div>`;
    };
    const sec=USAGE.today(), goal=goalMin(), gp=Math.min(100,Math.round(sec/(goal*60)*100));
    const minToday=Math.floor(sec/60);
    let cTitle="Los geht's", cSub='Wähle ein Modul oder übe mit dem Altklausur-Quiz', cGo="NAV.tab('v-pruefung','Prüfung')", cBtn='Starten';
    if(recent&&document.getElementById(recent.id)){
      cTitle=recent.label; cGo=goJs(recent.id,recent.label); cBtn='Weiter';
      cSub=document.querySelector('#'+recent.id+' .page-eyebrow')?.textContent?.trim()||'';
    }
    const cont=`<div class="m-card m-cont2"><div class="m-cont2-top"><div class="m-tx"><span class="m-eyebrow">Weiterlernen</span><span class="m-cont2-t">${esc(cTitle)}</span>${cSub?`<span class="m-t2">${esc(cSub)}</span>`:''}</div>${homeRing(gp,gp+'%',gp+' Prozent des Tagesziels')}</div>
      <div class="m-cont2-bot"><button class="m-go2" onclick="${cGo}">${cBtn} ${svg('play')}</button><span class="m-t2">Ziel heute: ${minToday} / ${goal} min</span></div></div>`;
    // Nächste Einheit oben rechts: im Unterricht die laufende (grau) und die folgende (orange), sonst die kommende
    const stamp=d=>(dayWord(d)==='heute'?'':dayWord(d)==='morgen'?'morgen ':d.toLocaleDateString('de-DE',{weekday:'short'})+' ')+hhmm(d);
    let nextBox='';
    if(nx){
      const aft=nx.state==='now'?IDF_PLAN.next(new Date(nx.end.getTime()+60000)):null;
      const head=nx.state==='now'&&aft?`<span class="m-nx-cur">Jetzt · ${esc(nx.title)}</span><span class="m-nx-h">Danach ${stamp(aft.start)}</span><span class="m-nx-t">${esc(aft.title)}</span>`
        :`<span class="m-nx-h">${nx.state==='now'?'Jetzt · bis '+hhmm(nx.end):stamp(nx.start)}</span><span class="m-nx-t">${esc(nx.title)}</span>`;
      const dt=nx.start.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'});
      nextBox=`<button class="m-nx" onclick="NAV.tab('v-plan','Stundenplan')" aria-label="Zum Stundenplan"><span class="m-nx-d">${esc(dt)}</span>${head}</button>`;
    }
    const chartCard=chartHtml();
    const ringBtn=m=>{
      const c=cnt[m[0]]||{done:0,total:0};
      return `<button class="m-ringbtn" onclick="${goJs(m[3],m[4])}" aria-label="${esc(m[1])}: ${c.done} von ${c.total} Themen"><span class="m-rw">${homeRing(pct(c),m[1],m[1])}</span></button>`; // nur der Ring, ohne Zahl
    };
    const wide=!!(window.matchMedia&&matchMedia('(min-width:701px)').matches);
    const mods=`<div class="m-card m-mods"><div class="m-modgrid2"><div class="m-r2"><div class="m-sec">2. Ausbildungsjahr</div><div class="m-rings">${MODS.filter(m=>m[5]===2).map(ringBtn).join('')}</div></div>
      <details class="m-y1${wide?' static':''}"${y1Open||wide?' open':''} ontoggle="SHELL.y1(this.open)"><summary>1. Ausbildungsjahr</summary><div class="inner"><div class="m-rings r3">${MODS.filter(m=>m[5]===1).map(ringBtn).join('')}</div></div></details></div></div>`;
    const pause=`<div class="m-list m-pause">${row({ic:ic('cards'),t1:'Lernkarten',t2:cs.due?cs.due+' zur Wiederholung fällig · '+cs.known+' von '+cs.total+' gelernt':cs.known+' von '+cs.total+' gelernt · Karten üben',on:goJs('v-flashcards','Lernkarten')})}</div>`;
    const lk=JG.isMaster()?{url:'https://cloud.hd-fw.de/index.php/s/xoHDwfCM9DtLo9t/authenticate/showshare',titel:'Lehrgangs-Cloud',hinweis:'Unterlagen aus dem Lehrgang · Passwort steht in der WhatsApp-Gruppe'}:JG.data().links.cloud;
    const cloud=lk?`<div class="m-list m-cloud"><a class="m-row m-go" href="${esc(lk.url)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">${ic('cloud')}<span class="m-tx"><span class="m-t1">${esc(lk.titel||'Lehrgangs-Link')}</span>${lk.hinweis?`<span class="m-t2 m-cloud-x">${esc(lk.hinweis)}</span>`:''}</span></a></div>`:'';
    const donate=`<a class="m-list m-donate m-donate-home" href="${SPENDE_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration:none"><div class="m-row m-go">${ic('heart')}<span class="m-tx"><span class="m-t1">Gefällt dir die Seite?</span><span class="m-t2">Kostenlos &amp; werbefrei – freiwillig unterstützen</span></span></div></a>`;
    el.innerHTML=`
      <div class="m-hello"><div><h1>${hi}</h1><p class="m-quip">${esc(quip(slot))}</p><div class="m-date">${now.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})}</div></div>${nextBox}</div>
      <div class="m-hgrid"><div class="m-hl">${cont}${chartCard}</div><div class="m-hr2">${mods}${pause}${cloud}${donate}</div></div>`;
  }

  function renderExam(){
    const cd=document.getElementById('m-countdown'), list=document.getElementById('m-exam-list');
    if(!cd||!list) return;
    const days=daysToExam();
    const tgt=examTarget();
    cd.innerHTML=days<0?'':`<button type="button" class="m-card m-count m-count-go" onclick="${goJs(tgt[0],tgt[1])}"><div class="m-count-big">${days===0?'Heute':days}</div><div class="m-tx"><span class="m-t2" style="margin:0">${days===0?'ist die':days===1?'Tag bis zur nächsten Klausur':'Tage bis zur nächsten Klausur'}</span><span class="m-t1">${esc(examCfg().name)}</span><span class="m-t2">${new Date(examCfg().date+'T00:00').toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'long',year:'numeric'})}</span></div><span class="m-count-link">${esc(tgt[1])} <i>›</i></span></button>`;
    const dueQ=(typeof QUIZ!=='undefined'&&QUIZ.dueCount)?QUIZ.dueCount():0;
    const dueI=(typeof IDFQ!=='undefined'&&IDFQ.dueCount)?IDFQ.dueCount():0;
    const jd=JG.data(), weg=new Set(jd.pr.weg), edit=typeof JGUI!=='undefined'&&JGUI.isEditing()&&!JG.isMaster();
    const rel=id=>JG.rel(id), star=id=>`<span class="jg-st${rel(id)?' on':''}" aria-hidden="true">★</span>`;
    // Im Bearbeiten-Modus schaltet das Antippen einer Prüfung ihre Klausurrelevanz um; sonst öffnet es sie
    const card=([id,t1,t2,k])=>row({ic:ic(k),t1,t2:id==='v-vak-altklausur'&&dueQ?`${t2} · ${dueQ} zur Wiederholung fällig`:id==='v-idf-altklausur'&&dueI?`${t2} · ${dueI} zur Wiederholung fällig`:t2,on:edit?`JGUI.setRel('${id}')`:goJs(id,t1),right:edit?star(id):''});
    const own=p=>row({ic:ic('doc'),t1:esc(p.titel),t2:p.fragen.length+' Fragen · eigene Prüfung',on:edit?`JGUI.setRel('${p.id}')`:`JGUI.openExam('${p.id}')`,right:edit?star(p.id):''});
    const del=id=>edit?`<button type="button" class="jg-x" aria-label="Prüfung entfernen" onclick="JGUI.delExam('${id}')">✕</button>`:'';
    const rw=(id,inner)=>`<div class="jg-rw${rel(id)?' hot':''}">${inner}${del(id)}</div>`;
    const sec=([name,items],si)=>{
      const key=JG.TABS[si][0];
      const vis=items.filter(x=>!weg.has(x[0])), adds=jd.pr.hinzu.filter(p=>p.tab===key&&!p.seite);
      const lists=[...vis.map(x=>rw(x[0],card(x))),...adds.map(p=>rw(p.id,own(p)))];
      return `<div class="m-col"><div class="m-sec jg-sh">${esc(name)}</div><div class="m-list">${lists.join('')||'<div class="jg-none">Keine Prüfungen</div>'}</div></div>`;
    };
    const hidden=EXAMS.reduce((n,[,it])=>n+it.filter(x=>weg.has(x[0])).length,0);
    const tools=typeof JGUI==='undefined'||JG.isMaster()?'':`<div class="jg-tools2"><button type="button" class="jg-plus" onclick="JGUI.examEditor()"><span>+</span> Prüfung hinzufügen</button><button type="button" class="btn btn-ghost" onclick="JGUI.toggleEdit()">${edit?'Fertig':'Prüfungen bearbeiten'}</button>${edit&&hidden?`<button type="button" class="btn btn-ghost" onclick="JGUI.restoreExams()">${hidden} ausgeblendete wiederherstellen</button>`:''}</div>${edit?'<div class="m-note" style="padding:6px 2px">Tippe eine Prüfung an, um sie klausurrelevant (★) zu machen oder abzuwählen. Nur relevante Prüfungen liefern Fragen für Einsatzfahrt und Duell.</div>':''}`;
    list.innerHTML=`<div class="m-areas">${EXAMS.map(sec).join('')}</div>${tools}`;
  }

  function renderFcSide(){
    const el=document.getElementById('m-fc-side'); if(!el) return;
    let fc={}; try{ fc=JSON.parse(localStorage.getItem('bvi_fc')||'{}'); }catch(e){}
    const cats=[['gal','GAL'],['sfs','SFS'],['hlfs','HLFS'],['ibk','IBK'],['vak','VAk'],['feuak','FeuAK'],['idf','IdF']];
    const rows=cats.map(([k,l])=>{
      const cs=FLASHCARD_DATA.filter(c=>c.cat.toLowerCase().startsWith(k));
      const p=cs.length?Math.round(cs.filter(c=>fc[c.id]).length/cs.length*100):0;
      return `<div class="m-fc-row"><span>${l}</span><span class="m-bar"><i style="width:${p}%"></i></span><span class="m-val">${p} %</span></div>`;
    }).join('');
    const known=FLASHCARD_DATA.filter(c=>fc[c.id]).length;
    el.innerHTML=`<div class="m-card"><div class="m-t1">Dein Stand</div>${rows}<div class="m-t2" style="margin-top:12px">${known} von ${FLASHCARD_DATA.length} Karten gewusst</div></div>
      <div class="m-card m-kbd"><div class="m-t1">Tastatur</div><div class="m-t2" style="line-height:2.1"><span class="kb-r"><kbd>↑</kbd> aufdecken</span><span class="kb-r"><kbd>Leertaste</kbd> markieren</span><span class="kb-r"><kbd>→</kbd> gewusst</span><span class="kb-r"><kbd>↓</kbd> schwer</span><span class="kb-r"><kbd>←</kbd> nicht gewusst</span></div></div>`;
  }

  let _tocIO=null;
  function buildToc(id,isContent){
    const toc=document.getElementById('m-toc'); if(!toc) return;
    if(_tocIO){ _tocIO.disconnect(); _tocIO=null; }
    const v=document.getElementById(id);
    let heads=isContent&&v?[...v.querySelectorAll('.pc .sec-h')]:[];
    if(heads.length<2&&isContent&&v) heads=[...v.querySelectorAll('.pc .acc-item > summary')];
    heads=heads.slice(0,24);
    const on=heads.length>=2;
    toc.classList.toggle('hidden',!on);
    document.body.classList.toggle('has-toc',on);
    if(!on){ toc.innerHTML=''; return; }
    const label=h=>((h.querySelector('.acc-title,.acc-h')||h).textContent||'').replace(/\s+/g,' ').trim().slice(0,70);
    toc.innerHTML='<div class="m-toc-h">Auf dieser Seite</div>'+heads.map((h,i)=>`<button data-i="${i}">${esc(label(h))}</button>`).join('');
    toc.onclick=e=>{ const b=e.target.closest('button[data-i]'); if(b) heads[+b.dataset.i].scrollIntoView({behavior:'smooth',block:'start'}); };
    const btns=[...toc.querySelectorAll('button')];
    _tocIO=new IntersectionObserver(es=>{
      es.forEach(en=>{ if(en.isIntersecting){ const i=heads.indexOf(en.target); btns.forEach((b,k)=>b.classList.toggle('on',k===i)); } });
    },{rootMargin:'-15% 0px -75% 0px'});
    heads.forEach(h=>_tocIO.observe(h));
  }

  function notes(){
    const out=[];
    try{
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(!k||!k.startsWith('bvi_note_')) continue;
        const txt=(localStorage.getItem(k)||'').trim();
        if(txt) out.push({id:k.slice(9),txt});
      }
    }catch(e){}
    return out;
  }
  function renderNotes(){
    const el=document.getElementById('m-notes-list'); if(!el) return;
    const n=notes(), marks=HL.all();
    let h='';
    if(n.length){
      h+='<div class="m-list">'+n.map(({id,txt})=>{
        const v=document.getElementById(id);
        const label=v?.querySelector('.page-title')?.textContent?.trim()||(id==='home'?'Startseite':id);
        const eb=v?.querySelector('.page-eyebrow')?.textContent?.trim()||'';
        return `<button class="m-row m-go" onclick="${v?goJs(id,label):''}" style="align-items:flex-start"><span class="m-tx"><span class="m-t2" style="margin:0;color:var(--m-accent-fg)">${esc(eb?eb+' · '+label:label)}</span><span class="m-note-txt">${esc(txt)}</span></span></button>`;
      }).join('')+'</div>';
    }
    if(marks.length){
      h+='<div class="m-sec" style="margin-top:1.4rem">Markierungen</div>'+marks.map(({view,items})=>{
        const v=document.getElementById(view);
        const label=v?.querySelector('.page-title')?.textContent?.trim()||view;
        return `<div class="m-hl-group"><div class="m-t2" style="color:var(--m-accent-fg);margin:0 0 6px 4px">${esc(label)}</div><div class="m-list">${items.map((it,i)=>`<div class="m-row bm-row"><button class="bm-open" onclick="${goJs(view,label)}"><span class="m-note-txt">${esc(it.q)}</span></button><button class="bm-remove" aria-label="Markierung löschen" onclick="HL.removeAt(${esc(JSON.stringify(view))},${i});SHELL.renderNotes()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>`).join('')}</div></div>`;
      }).join('');
    }
    if(!h) h='<div class="m-empty">Noch keine Notizen oder Markierungen.<br>Öffne eine Lernseite: Mit dem Stift schreibst du eine Notiz, und wenn du Text auswählst, kannst du ihn markieren.</div>';
    el.innerHTML=h;
  }

  function syncSettings(){
    ACCENT.render();
    SETTINGS._restoreFsUI();
    const nc=notes().length, bc=BOOKMARKS.getAll().length;
    const set=(id,txt)=>{ const e=document.getElementById(id); if(e) e.textContent=txt; };
    set('m-notes-count',nc||'');
    set('m-bm-count',bc||'');
    set('m-version',APP_VERSION);
    set('m-notif-hour',NOTIF.hour()+':00');
    set('m-goal-val',goalMin()+' min');
    const tm=document.getElementById('m-timers-toggle'); if(tm) tm.checked=!document.documentElement.classList.contains('no-timers');
    const lb=BACKUP.last(); set('m-backup-last',lb?'Letzte Sicherung: '+lb.toLocaleDateString('de-DE'):'Noch nie gesichert');
    const ex=examCfg(), di=document.getElementById('m-exam-date'), ni=document.getElementById('m-exam-name');
    if(di) di.value=ex.date; if(ni) ni.value=ex.name===defExam().name&&!localStorage.getItem('bvi_exam')?'':ex.name;
    const tg=document.getElementById('m-notif-toggle'); if(tg) tg.checked=NOTIF.isEnabled();
    document.getElementById('m-cl-badge')?.classList.toggle('hidden',!CHANGELOG.isNew());
    document.getElementById('m-cl-badge2')?.classList.toggle('hidden',!CHANGELOG.isNew());
    accSubs();
  }

  // Kurzinfo unter jeder Einstellungs-Gruppe (zeigt die aktuellen Werte, auch wenn die Gruppe zu ist)
  function accSubs(){
    const set=(id,txt)=>{ const e=document.getElementById(id); if(e) e.textContent=txt; };
    const th={dark:'Dunkel',light:'Hell',system:'System'}[localStorage.getItem('bvi_theme')]||'System';
    const fs={sm:'A−',md:'A',lg:'A+',xl:'A++'}[localStorage.getItem('bvi_font_size')||'md']||'A';
    const nc=notes().length, bc=BOOKMARKS.getAll().length;
    const lb=BACKUP.last();
    set('acc-dar-sub',th+' · Schrift '+fs);
    if(typeof JG!=='undefined') set('acc-lg-sub',JG.labelOf(JG.current())+(JG.isMaster()?' (Master)':''));
    set('acc-ler-sub','Tagesziel '+goalMin()+' min · Timer '+(document.documentElement.classList.contains('no-timers')?'aus':'an'));
    set('acc-eri-sub',NOTIF.isEnabled()?'Täglich um '+NOTIF.hour()+':00':'Aus');
    set('acc-dat-sub',lb?'Letzte Sicherung: '+lb.toLocaleDateString('de-DE'):'Noch nie gesichert');
    set('acc-wer-sub',nc+(nc===1?' Notiz':' Notizen')+' · '+bc+' Lesezeichen');
  }
  document.addEventListener('click',e=>{ if(e.target.closest('#v-settings')) setTimeout(accSubs,0); });
  document.addEventListener('change',e=>{ if(e.target.closest('#v-settings')) setTimeout(accSubs,0); });

  // alte Einstellungen und Zähler der entfernten Funktionen „Karten pro Tag“ und „Zahl bei den Lernkarten“ löschen
  ['bvi_cardgoal','bvi_tabnum','bvi_cards_day'].forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
  function onShow(id,isContent,stack){
    const tab=stack.length&&ROOTS[stack[0].id]?ROOTS[stack[0].id]:'start';
    document.querySelectorAll('#m-tabbar [data-tab],#m-rail [data-tab]').forEach(b=>{
      const on=b.dataset.tab===tab;
      b.classList.toggle('on',on);
      if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
    });
    const isRoot=!stack.length||(stack.length===1&&!!ROOTS[id]);
    document.getElementById('m-topbar')?.classList.toggle('hidden',isRoot);
    if(!isRoot){
      const lbl=document.getElementById('m-back-lbl');
      if(lbl) lbl.textContent=stack.length>=2?stack[stack.length-2].label:'Start';
    }
    document.getElementById('m-tb-actions')?.classList.toggle('hidden',!isContent);
    buildToc(id,isContent);
    HL.apply(id);
    if(isContent){
      const pc=document.getElementById(id)?.querySelector('.pc');
      if(pc&&!pc.querySelector(':scope > .m-report')){
        const d=document.createElement('div'); d.className='m-report';
        d.innerHTML='<button onclick="SHELL.report()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg>Fehler oder Unklarheit melden</button>';
        pc.appendChild(d);
      }
    }
  }

  return {
    onShow, renderHome, newQuip, renderExam, renderNotes, renderFcSide, syncSettings,
    report(extra){
      const v=document.querySelector('.view.active'); if(!v) return;
      const title=v.querySelector('.page-title')?.textContent?.trim()||v.id;
      const eb=v.querySelector('.page-eyebrow')?.textContent?.trim()||'';
      const body='Seite: '+title+(eb?' ('+eb+')':'')+'\nLink: '+location.origin+location.pathname+'?id='+v.id+'\nApp-Version: '+APP_VERSION+'\n'+(extra?'\n'+extra+'\n':'')+'\nWas ist falsch oder unklar?\n';
      const mail='mailto:fabian.flemig@gmx.de?subject='+encodeURIComponent('B VI – Fehler: '+title)+'&body='+encodeURIComponent(body);
      const gh='https://github.com/Flametan/BVI-Lernwebsite/issues/new?labels=fehler&title='+encodeURIComponent('Fehler: '+title)+'&body='+encodeURIComponent(body);
      if(!window.__noMail) REPORT.open(mail,gh);
      return mail;
    },
    reportQuiz(sfx){
      const t=id=>document.getElementById(id+(sfx||''))?.textContent?.trim()||'';
      return this.report((sfx?'IdF-Quiz ':'')+'Frage '+t('quiz-counter')+' ['+t('quiz-cat')+']:\n'+t('quiz-q'));
    },
    acc(btn){
      const open=btn.getAttribute('aria-expanded')!=='true';
      document.querySelectorAll('#v-settings .m-acc-h').forEach(h=>{ h.setAttribute('aria-expanded','false'); document.getElementById(h.getAttribute('aria-controls')).hidden=true; });
      if(open){ btn.setAttribute('aria-expanded','true'); document.getElementById(btn.getAttribute('aria-controls')).hidden=false; }
    },
    stepGoal(d){
      const g=Math.min(240,Math.max(5,goalMin()+d*5));
      try{ localStorage.setItem('bvi_goal',String(g)); }catch(e){}
      const e=document.getElementById('m-goal-val'); if(e) e.textContent=g+' min';
    },
    setTimers(on){
      try{ localStorage.setItem('bvi_timers',on?'1':'0'); }catch(e){}
      document.documentElement.classList.toggle('no-timers',!on);
      if(!on&&typeof ETIMER!=='undefined') ETIMER.stop();
    },
    setRange(r){
      chartRange=r==='month'?'month':'week';
      const old=document.querySelector('#v-home .m-chart2');
      if(!old){ renderHome(); return; }
      const t=document.createElement('template'); t.innerHTML=chartHtml();
      old.replaceWith(t.content.firstElementChild);
      document.querySelector('#v-home .m-chart2 .m-seg-s button.active')?.focus({preventScroll:true});
    },
    y1(open){ if(!document.querySelector('.m-y1.static')) y1Open=!!open; },
    pick(btn){
      const on=!btn.classList.contains('sel');
      btn.parentElement.querySelectorAll('.sel').forEach(x=>x.classList.remove('sel'));
      if(on) btn.classList.add('sel');
    },
    setExam(){
      const date=document.getElementById('m-exam-date')?.value, name=document.getElementById('m-exam-name')?.value||'';
      const o=examCfg(); if(/^\d{4}-\d{2}-\d{2}$/.test(date||'')) o.date=date;
      try{ localStorage.setItem('bvi_exam',JSON.stringify({date:o.date,name:name.trim()})); }catch(e){}
    },
    bookmark(){
      const v=document.querySelector('.view.active'); if(!v) return;
      BOOKMARKS.toggle(v.id, v.querySelector('.page-title')?.textContent?.trim()||v.id);
    },
    async setNotif(el){ await NOTIF.setEnabled(el.checked); el.checked=NOTIF.isEnabled(); accSubs(); },
    stepHour(d){
      const h=Math.min(23,Math.max(6,NOTIF.hour()+d));
      NOTIF.setHour(h);
      const e=document.getElementById('m-notif-hour'); if(e) e.textContent=h+':00';
    }
  };
})();

// Zeit-Sprechblase am Balken nur nach Tipp; ein Tipp daneben oder Esc schließt sie
document.addEventListener('click',e=>{ if(!e.target.closest('.m-pc')) document.querySelectorAll('.m-pc.sel').forEach(x=>x.classList.remove('sel')); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.m-pc.sel').forEach(x=>x.classList.remove('sel')); });

document.addEventListener('DOMContentLoaded',()=>{
  // Deep-link on load
  // Geteilte Lernkarten: ?karten=… übernehmen (nach Rückfrage) und den Parameter aus der Adresse entfernen
  (function(){
    const u=new URL(location.href), kc=u.searchParams.get('karten');
    if(!kc) return;
    u.searchParams.delete('karten');
    try{ history.replaceState(history.state,'',u.pathname+(u.search||'')+u.hash); }catch(e){}
    setTimeout(()=>CUSTOM.fromCode('BVIK'+kc.replace(/^BVIK/,''),true),700);
  })();
  const initId=new URLSearchParams(location.search).get('id')||location.hash.replace(/^#/,'');
  if(initId&&document.getElementById(initId)?.classList.contains('view')){
    const lbl=document.querySelector('#'+initId+' .page-title')?.textContent?.trim()||initId;
    NAV.go(initId,lbl);
  } else {
    NAV.home();
  }
  PROGRESS.updateUI();
  SETTINGS.restoreFontSize();
  NOTIF.check();
  ONBOARD.init();
  OVL.init();
  CHANGELOG.check();
  if(typeof FALLBEARBEITUNG!=='undefined') { document.querySelectorAll('#v-vak-fallbearbeitung').forEach(()=>{}); }
  document.querySelectorAll('.pc table').forEach(t=>{
    if(t.closest('.tbl-wrap')) return;
    const w=document.createElement('div');
    w.className='tbl-wrap';
    t.parentNode.insertBefore(w,t);
    w.appendChild(t);
  });
  // Accent-Solo-Erkennung: Wenn .accent den gesamten Titel ausmacht → Gradient, sonst Vollrot
  document.querySelectorAll('.page-title .accent').forEach(acc=>{
    if(acc.parentNode.textContent.trim()===acc.textContent.trim()) acc.classList.add('accent-solo');
  });
  // Dekorative SVGs für Screenreader ausblenden
  document.querySelectorAll('.tile-icon,.tile-arr,.tc-icon').forEach(el=>el.setAttribute('aria-hidden','true'));
  // Keyboard-Navigation für Kacheln und Topic-Cards
  document.querySelectorAll('.glass-tile,.topic-card').forEach(el=>{
    el.setAttribute('tabindex','0');
    el.setAttribute('role','button');
    el.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); el.click(); }
    });
  });

  document.addEventListener('keydown', e => {
    if((e.ctrlKey||e.metaKey) && e.key==='k'){ e.preventDefault(); const t=OVL.top(); if(!t||t==='search-overlay') SEARCH.open(); return; }
    if(e.key==='?'&&!e.target.matches('input,textarea')){
      e.preventDefault();
      document.getElementById('shortcuts-overlay').classList.toggle('hidden');
      return;
    }
    if(e.key==='Escape'&&OVL.escape(e)) return;
    // Lernkarten-Tastatursteuerung (nicht in Eingabefeldern und nicht hinter offenen Fenstern)
    if(document.getElementById('v-flashcards').classList.contains('active')&&!OVL.any()&&!(e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]'))){
      if(e.key==='ArrowUp'){ e.preventDefault(); FC.flip(); }
      if(e.key===' '&&!e.target.matches('input,textarea,button,select')){ e.preventDefault(); FC.starCurrent(); }
      if((e.key==='ArrowRight'||e.key==='j')&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); FC.answer(true); }
      if((e.key==='ArrowLeft'||e.key==='f')&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); FC.answer(false); }
      if(e.key==='ArrowDown'&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); FC.answer('hard'); }
    }
  });
  let _perfRafPending=false;
  window.addEventListener('scroll',()=>{
    if(!_perfRafPending){_perfRafPending=true;requestAnimationFrame(()=>{updateReadProgress();_perfRafPending=false;});}
  },{passive:true});
  // Swipe-Back-Geste (Wischen vom linken Rand → zurück)
  (function(){
    let x0=0, y0=0, live=false;
    document.addEventListener('touchstart',e=>{
      if(e.touches.length!==1) return;
      x0=e.touches[0].clientX; y0=e.touches[0].clientY;
      live = x0 < 40; // nur vom linken Rand
    },{passive:true});
    document.addEventListener('touchend',e=>{
      if(!live) return; live=false;
      const dx=e.changedTouches[0].clientX-x0;
      const dy=Math.abs(e.changedTouches[0].clientY-y0);
      const active=document.querySelector('.view.active');
      if(active&&active.id==='v-flashcards') return;
      if(dx>70&&dy<60) NAV.back();
    },{passive:true});
  })();
  // Online/Offline-Indikator
  function updateOnlineStatus(){
    const online = navigator.onLine;
    document.body.classList.toggle('offline',!online);
  }
  window.addEventListener('offline', updateOnlineStatus);
  window.addEventListener('online', updateOnlineStatus);
  document.addEventListener('visibilitychange', updateOnlineStatus);
  updateOnlineStatus();
  if('serviceWorker' in navigator){
    // Neue Version: nicht mitten im Lernen neu laden, sondern einen Hinweis zeigen
    const hadSW=!!navigator.serviceWorker.controller;
    let reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(hadSW&&!reloading){ reloading=true; location.reload(); } });
    const offer=w=>{ if(!hadSW||!w) return; TOAST.show('Neue Version verfügbar',{type:'info',duration:600000,undo:()=>w.postMessage({type:'SKIP_WAITING'}),label:'Aktualisieren'}); };
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      if(reg.waiting) offer(reg.waiting);
      reg.addEventListener('updatefound',()=>{ const n=reg.installing; if(n) n.addEventListener('statechange',()=>{ if(n.state==='installed'&&navigator.serviceWorker.controller) offer(n); }); });
      document.addEventListener('visibilitychange',()=>{ if(!document.hidden) reg.update().catch(()=>{}); });
    }).catch(()=>{});
  }
  ABK.render(); ABK.filter('');
  console.log('%c B VI %c Lernwebsite '+APP_VERSION+' · flametan/BVI-Lernwebsite ',
    'background:#A50000;color:#fff;padding:3px 8px;border-radius:4px 0 0 4px;font-family:"DM Mono",monospace;font-weight:700',
    'background:#0A192F;color:#C9A84C;padding:3px 8px;border-radius:0 4px 4px 0;font-family:"DM Mono",monospace');
});
/* ======================================================================
   KLEINE PAUSE – Sätze und Nachladen der Spiele (js/pause-data.js, js/pause.js)
====================================================================== */
const PAUSE_LOADER=(function(){
  const QUIPS=[
    'Kurz durchatmen – das Gehirn speichert in Pausen am besten.',
    'Fünf Minuten Spiel, danach geht das Lernen leichter.',
    'Auch der beste Atemschutzgeräteträger braucht mal frische Luft.',
    'Pause ist keine verlorene Zeit, sondern Ladezeit.',
    'Einmal den Kopf durchlüften, dann weiter im Stoff.',
    'Wissen sacken lassen – und nebenbei ein bisschen spielen.',
    'Kurze Pause, großer Effekt.',
    'Auch zwischen zwei Einsätzen gibt es eine Tasse Kaffee.',
    'Kurz abschalten, bevor der Akku leer ist.',
    'Wer Pausen macht, bleibt länger konzentriert.',
    'Ein Spiel zwischendurch hält den Kopf beweglich.',
    'Raus aus dem Paragrafendschungel, rein in die Pause.',
    'Kurz die Gedanken ordnen, dann geht es weiter.',
    'Die Wache ruht, die Neugier nicht.',
    'Ein bisschen Spaß gehört auch in den Dienstplan.',
    'Pause heißt nicht Stillstand – nur kurz Tempo raus.',
    'Zeit für eine Runde, bevor das nächste Kapitel ruft.',
    'Gehirnjogging statt Grübeln.',
    'Mal kurz den Helm absetzen.',
    'Ein paar Minuten Abstand bringen oft die beste Idee.',
    'Lernen ist ein Marathon – hier ist die Trinkstation.',
    'Durchschnaufen ist erlaubt, sogar ausdrücklich empfohlen.',
    'Kurzer Boxenstopp für den Kopf.',
    'Wer spielt, lernt oft mehr, als er denkt.',
    'Gönn dir eine Runde, du hast sie dir verdient.',
    'Das Lehrbuch läuft nicht weg.',
    'Zwischen Haushaltsplan und Stabsarbeit: einmal lächeln.',
    'Auch Führungskräfte dürfen mal Pause machen.',
    'Kurz entspannen, dann wieder volle Leistung.',
    'Eine Pause ist die beste Vorbereitung auf die nächste Stunde.',
    'Kopf frei, Wasser marsch für neue Gedanken.',
    'Ein kleines Rätsel zwischendurch weckt die grauen Zellen.',
    'Pause machen ist auch eine Führungsaufgabe – an sich selbst.',
    'Kaffee holen, eine Runde spielen, weiterlernen.',
    'Hier zählt kein Punkt für die Prüfung – nur der Spaß.',
    'Kurze Pausen verhindern lange Durchhänger.',
    'Abstand gewinnen, Überblick behalten.',
    'Erst ein Spiel, dann wieder Gesetzestexte.',
    'Wenn der Kopf raucht: kurz lüften.',
    'Eine Runde Quiz ist Frühsport fürs Gehirn.',
    'Kurz runterfahren, ohne den Motor abzustellen.',
    'Konzentration braucht Erholung – hier gibt es beides.',
    'Die beste Lernstrategie hat Pausen fest eingeplant.',
    'Ein bisschen Ablenkung, ganz ohne schlechtes Gewissen.',
    'Kurz die Perspektive wechseln.',
    'Fünf Minuten für dich – der Rest kann warten.',
    'Spielen ist Lernen in bequemer Kleidung.',
    'Status 2: einsatzbereit, aber gerade in der Pause.',
    'Pause heißt auch: Das Gelernte darf sich setzen.',
    'Noch eine Runde? Aber wirklich nur eine.'
  ];
  let last=-1,loading=null;
  // bei jedem Anzeigen ein anderer Satz
  function quip(){let i;do{i=Math.floor(Math.random()*QUIPS.length);}while(i===last&&QUIPS.length>1);last=i;return QUIPS[i];}
  function load(){
    if(typeof PAUSE!=='undefined') return Promise.resolve();
    if(loading) return loading;
    const add=src=>new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=fail;document.body.appendChild(s);});
    loading=add('js/pause-data.js').then(()=>add('js/pause.js')).catch(()=>{loading=null;const r=document.getElementById('pause-root');if(r)r.innerHTML='<div class="m-card">Die Spiele konnten nicht geladen werden. Bitte Verbindung prüfen.</div>';});
    return loading;
  }
  function onShow(id){
    if(id!=='v-pause'){ if(typeof PAUSE!=='undefined') PAUSE.leave(); return; }
    const q=document.getElementById('pause-quip'); if(q) q.textContent=quip();
    load().then(()=>{ if(typeof PAUSE!=='undefined'&&document.getElementById('v-pause').classList.contains('active')) PAUSE.show(); });
  }
  return { quip, onShow, load, QUIPS };
})();
