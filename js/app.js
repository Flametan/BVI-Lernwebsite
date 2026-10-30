/* ======================================================================
   NAVIGATIONS-ENGINE
   NAV.go(id, label) · NAV.back() · NAV.home() · NAV.jumpTo(idx)
====================================================================== */
const _NAVY_VIEWS = new Set(['v-simulator','v-flashcards','v-abkuerzungen','v-app','v-klausurfragen','v-klausur-0826','v-laufbahn-2023','v-laufbahn-2026']);
const _GOLD_VIEWS = new Set(['v-vak-klausurvorbereitung','v-feuak-bp-hub','v-feuak-analyse','v-idf-vb','v-idf-stabhub']);

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
    else if(typeof JGUI!=='undefined'&&/^v-(jahr1|jahr2|gal|sfs|hlfs|ibk|vak|feuak|idf|klausur)$/.test(id)) JGUI.mount(id);   // Übersichtsseiten: Reiter anpassen
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
  {"id":"k-lb26-01","cat":"Laufbahn · Recht","q":"Stromausfall, Kälte: Welche Voraussetzung gilt für Katastrophenschutzmaßnahmen, und wer stellt sie fest?","a":"Eine <strong>Katastrophe oder Großschadenslage</strong> (§ 1 KatSG): Gefahr für Leben/Gesundheit vieler Menschen, lebensnotwendige Versorgung. Die für Inneres zuständige Senatsverwaltung löst Katastrophenalarm aus bzw. stellt die Großschadenslage fest (§ 10 Abs. 1, 2 KatSG)."},
  {"id":"k-lb26-02","cat":"Laufbahn · Recht","q":"Welche Rechtsgrundlagen hat die Amtshilfe?","a":"<strong>Art. 35 Abs. 1 GG</strong> (Rechts- und Amtshilfepflicht aller Behörden von Bund und Ländern) und <strong>§§ 4–8 VwVfG</strong> (in Berlin über das VwVfG Bln)."},
  {"id":"k-lb26-03","cat":"Laufbahn · Recht","q":"Wann liegt Amtshilfe vor (§ 4 Abs. 1 VwVfG)?","a":"<strong>Ergänzende Hilfe auf Ersuchen</strong> einer anderen Behörde. Nötig: Ersuchen, Bedarf an ergänzender Hilfe im Einzelfall, selbstständige Behörden ohne Weisungsverhältnis."},
  {"id":"k-lb26-04","cat":"Laufbahn · Recht","q":"Wann liegt keine Amtshilfe vor (§ 4 Abs. 2 VwVfG)?","a":"Bei Hilfe im Rahmen eines <strong>Weisungs-/Unterstellungsverhältnisses</strong> und bei Handlungen, die der ersuchten Stelle als <strong>eigene Aufgabe</strong> obliegen."},
  {"id":"k-lb26-05","cat":"Laufbahn · Recht","q":"Welche Grenzen der Amtshilfe nennt § 5 VwVfG?","a":"Rechtliche oder tatsächliche <strong>Unmöglichkeit</strong>, unverhältnismäßiger Aufwand, schwerer Nachteil für Bund/Land. Verweigerung der ersuchenden Behörde mitteilen; Streit entscheidet die gemeinsame Aufsichtsbehörde."},
  {"id":"k-lb26-06","cat":"Laufbahn · Recht","q":"Wer trägt bei der Amtshilfe Verantwortung und Kosten (§§ 7, 8 VwVfG)?","a":"Ersuchende Behörde: <strong>Rechtmäßigkeit</strong> der Maßnahme. Ersuchte Behörde: <strong>Durchführung</strong> der Hilfe. Kosten (§ 8): keine Gebühren, Auslagenerstattung ab 35 €."},
  {"id":"k-lb26-07","cat":"Laufbahn · Recht","q":"Wie wird das THW im Katastrophenfall rechtlich eingebunden?","a":"THW ist Bundesanstalt. Es wirkt über <strong>§ 25 Abs. 2 KatSG</strong> im Katastrophenschutz mit (spezialgesetzliche Mitwirkung, Unterstützung nach § 1 Abs. 2 THWG, Nummer bitte prüfen). Nur ergänzend (Stromerzeuger, Beleuchtung, Logistik) greift Art. 35 GG / Amtshilfe."},
  {"id":"k-lb26-08","cat":"Laufbahn · Recht","q":"Wie wird ein städtischer Bauhof je nach Rechtsträger herangezogen?","a":"<strong>Bezirksamt/Landesbehörde:</strong> keine Amtshilfe, gesetzliche Unterstützungspflicht (§ 23 KatSG) und Weisungsrecht. <strong>Landesunternehmen:</strong> Mitwirkung § 24 KatSG. <strong>Privater Betreiber:</strong> Inanspruchnahme § 17 KatSG. <strong>Anderes Land/Gemeinde:</strong> Amtshilfe bzw. § 25 Abs. 1 KatSG."},
  {"id":"k-lb26-09","cat":"Laufbahn · Recht","q":"Begründet Amtshilfe ein Unterstellungsverhältnis?","a":"<strong>Nein.</strong> Die ersuchte Behörde bleibt Herrin ihrer Mittel und Kräfte und führt die Hilfe nach ihrem Recht durch (§ 7 VwVfG). Es gibt Auftrag und Auftragserfüllung (Auftragstaktik), keine Weisung in die Organisation."},
  {"id":"k-lb26-10","cat":"Laufbahn · Recht","q":"Wem unterstehen Kräfte des Bundes (THW) und anderer Länder im Berliner Katastrophenschutz?","a":"Sie haben die gleichen Befugnisse wie Berliner Kräfte und unterstehen den Weisungen der einsetzenden Behörde (§ 25 Abs. 1 S. 2, 3 KatSG). Die Fachführung der THW-Einheit bleibt beim THW (Zuordnung statt Unterstellung, FwDV 100)."},
  {"id":"k-lb26-11","cat":"Laufbahn · Recht","q":"Wem unterstehen anerkannte Hilfsorganisationen und Landesbehörden im Katastrophenfall?","a":"Hilfsorganisationen der <strong>Berliner Feuerwehr</strong> (§ 21 Abs. 2 KatSG). Landesbehörden dem Weisungsrecht der Fachaufsicht bzw. dem Krisenstab/Entscheidungsgremium (§§ 12–14 KatSG). Taktisch-operative Entscheidungen werden abgestimmt (§ 13 KatSG)."},
  {"id":"k-lb26-12","cat":"Laufbahn · Recht","q":"Wie lautet das Ergebnis zu Amtshilfe und Unterstellung beim Stromausfall?","a":"Amtshilfe nur, wo <strong>keine gesetzliche Mitwirkungs- oder Weisungsbeziehung</strong> besteht. THW und Landesbehörden sind über das KatSG eingebunden; Weisungsrecht nur im Rahmen von § 25 KatSG bzw. innerhalb der Landesverwaltung."},
  {"id":"k-lb26-13","cat":"Laufbahn · Recht","q":"Beamter nimmt dienstliche Batterien privat mit: Diebstahl oder Unterschlagung?","a":"Fremde bewegliche Sache. <strong>Diebstahl § 242 StGB</strong> bei Gewahrsamsbruch; ohne Gewahrsamsbruch (Obhut) <strong>Unterschlagung § 246 Abs. 1</strong>, bei anvertrauten Sachen <strong>§ 246 Abs. 2</strong> (höherer Strafrahmen). § 246 ist subsidiär."},
  {"id":"k-lb26-14","cat":"Laufbahn · Recht","q":"Wann liegt bei den Batterien eine Zueignung vor?","a":"Aneignung plus Enteignungsvorsatz; bei dauerhaftem Behalten erfüllt. Nur vorübergehende Nutzung ist straflose Gebrauchsanmaßung, aber der in der Ladung verkörperte <strong>Sachwert</strong> wird verbraucht (Sachwerttheorie)."},
  {"id":"k-lb26-15","cat":"Laufbahn · Recht","q":"Greift bei den Batterien der Notstand (§ 34 StGB)?","a":"<strong>Nein.</strong> Eigeninteresse, Güterabwägung spricht für die dienstliche Gefahrenabwehr, milderes Mittel wäre Melden/Abstimmen. § 35 StGB nur bei Gefahr für Leib, Leben, Freiheit. Bei geringem Wert nur auf Strafantrag (§ 248a StGB)."},
  {"id":"k-lb26-16","cat":"Laufbahn · Recht","q":"Dienstrechtliche Bewertung der Batteriemitnahme: Welche Pflichten sind verletzt?","a":"<strong>Dienstvergehen § 47 Abs. 1 BeamtStG</strong> (schuldhafte Pflichtverletzung). Verletzt: uneigennützige Amtsführung (§ 33 Abs. 1), voller persönlicher Einsatz (§ 34 S. 1), achtungs- und vertrauenswürdiges Verhalten (§ 34 S. 3), Regeln zur Nutzung von Dienstgut."},
  {"id":"k-lb26-17","cat":"Laufbahn · Recht","q":"Wann verliert ein Beamter kraft Gesetzes die Beamtenrechte (§ 24 Abs. 1 BeamtStG)?","a":"Bei Verurteilung wegen einer <strong>Vorsatztat zu mindestens einem Jahr Freiheitsstrafe</strong>. Bei Ersttäter und geringem Wert unwahrscheinlich (§ 246 Abs. 2 StGB bis 5 Jahre)."},
  {"id":"k-lb26-18","cat":"Laufbahn · Recht","q":"Welche Disziplinarmaßnahmen kennt das DiszG Bln (§ 5)?","a":"<strong>Verweis</strong> (§ 6), <strong>Geldbuße</strong> (§ 7), <strong>Kürzung der Dienstbezüge</strong> (§ 8), <strong>Zurückstufung</strong> (§ 9), <strong>Entfernung aus dem Beamtenverhältnis</strong> (§ 10)."},
  {"id":"k-lb26-19","cat":"Laufbahn · Recht","q":"Wie läuft das Disziplinarverfahren nach DiszG Bln ab?","a":"Einleitung von Amts wegen bei zureichenden Anhaltspunkten (§ 17), Anhörung (§ 20), Aussetzung während des Strafverfahrens (§ 22), Bindung an dessen tatsächliche Feststellungen (§ 23)."},
  {"id":"k-lb26-20","cat":"Laufbahn · Recht","q":"Wie wird die Disziplinarmaßnahme bei einem Zugriffsdelikt bemessen?","a":"Nach § 13 Abs. 1: Schwere, Persönlichkeitsbild, Vertrauensbeeinträchtigung, <strong>Verhältnismäßigkeit</strong>. Bei nicht geringwertigen Gegenständen ist Entfernung Regelmaßnahme; bei geringem Wert (Orientierung ca. 50 €, prüfen) und Milderungsgründen Kürzung, Zurückstufung oder Geldbuße."},
  {"id":"k-lb26-21","cat":"Laufbahn · Recht","q":"Wer verhängt welche Disziplinarmaßnahme (DiszG Bln)?","a":"Verweis, Geldbuße, Kürzung per <strong>Disziplinarverfügung</strong> (§ 33). Entfernung nur durch <strong>Disziplinarklage</strong> vor dem Verwaltungsgericht (§§ 34, 41). Vorläufige Dienstenthebung und Bezügeeinbehalt nach § 38."},
  {"id":"k-lb26-22","cat":"Laufbahn · Recht","q":"Was besagt das Doppelahndungsverbot (§ 14 DiszG Bln)?","a":"Nach unanfechtbarer Strafe <strong>kein Verweis, keine Geldbuße</strong> mehr; Kürzung oder Zurückstufung nur, wenn zusätzlich erforderlich."},
  {"id":"k-lb26-23","cat":"Laufbahn · Recht","q":"Nach welcher Zeit sind Disziplinarmaßnahmen nicht mehr zulässig (§ 15 DiszG Bln)?","a":"Verweis nach <strong>2</strong>, Geldbuße und Kürzung nach <strong>3</strong>, Zurückstufung nach <strong>7 Jahren</strong>."},
  {"id":"k-lb26-24","cat":"Laufbahn · Recht","q":"Welche Folgen gelten für Beamte auf Probe/Widerruf und welche weiteren Folgen drohen?","a":"Statt Disziplinarklage: <strong>Entlassung</strong> (§ 23 BeamtStG). Außerdem Schadensersatz/Regress bei Vorsatz oder grober Fahrlässigkeit (§ 48 BeamtStG), Rückgabe, Beurteilung/Beförderung, Anzeigepflicht der Dienststelle."},
  {"id":"k-lb26-25","cat":"Laufbahn · Recht","q":"Kiosk verweigert vertraglich vorgesehenes Notstromaggregat: Darf er gewaltsam geöffnet werden?","a":"<strong>Ja, als letztes Mittel</strong> bei Katastrophe/Großschadenslage: Inanspruchnahme nach § 17 KatSG, Betreten nach § 36 ASOG (Art. 13 GG), verhältnismäßig, mit Ausgleich nach §§ 59–65 ASOG. Zuvor milderes Vorgehen (Aufforderung, Androhung, Verhandlung)."},
  {"id":"k-lb26-26","cat":"Laufbahn · Recht","q":"Warum nicht zivilrechtlich gegen den Kioskbesitzer vorgehen?","a":"Der Vertrag gibt einen Erfüllungsanspruch, die Weigerung ist Vertragsverletzung. Die einstweilige Verfügung ist im akuten Notfall <strong>zu langsam</strong> und ersetzt keine Gefahrenabwehr. Daher öffentlich-rechtlich vorgehen."},
  {"id":"k-lb26-27","cat":"Laufbahn · Recht","q":"Voraussetzungen der Inanspruchnahme Nichtverantwortlicher nach § 17 Abs. 1 KatSG i. V. m. § 16 ASOG?","a":"① gegenwärtige erhebliche Gefahr, ② Maßnahmen gegen Verantwortliche nicht/nicht rechtzeitig möglich, ③ Behörde kann nicht selbst rechtzeitig abwehren, ④ keine erhebliche eigene Gefährdung, keine höherwertigen Pflichten. Nur solange nötig."},
  {"id":"k-lb26-28","cat":"Laufbahn · Recht","q":"Was regelt § 17 Abs. 2 KatSG, und was gilt daneben?","a":"<strong>Duldung</strong> von Nutzung und Verbrauch des Eigentums und Besitzes. Daneben Sicherstellung der Sache nach § 38 Abs. 1 Nr. 1 ASOG (Abwehr einer gegenwärtigen Gefahr)."},
  {"id":"k-lb26-29","cat":"Laufbahn · Recht","q":"In welcher Form ergeht die Inanspruchnahme, und welche Folgen hat ein Widerspruch (§ 17 KatSG)?","a":"<strong>Verwaltungsakt</strong> (ggf. mündlich, § 37 VwVfG). Widerspruch/Anfechtungsklage <strong>ohne aufschiebende Wirkung</strong> (§ 17 Abs. 4). Zuwiderhandlung: Ordnungswidrigkeit bis 5.000 € (§ 34 KatSG)."},
  {"id":"k-lb26-30","cat":"Laufbahn · Recht","q":"Welche Zwangsmöglichkeit besteht, wenn der Zweck anders nicht rechtzeitig erreichbar ist?","a":"<strong>Unmittelbare Ausführung</strong> (§ 15 ASOG Bln) bzw. sofortiger Vollzug nach Verwaltungsvollstreckungsrecht."},
  {"id":"k-lb26-31","cat":"Laufbahn · Recht","q":"Darf die Behörde die Kioskräume betreten? Braucht sie einen Richter?","a":"Geschäftsräume sind <strong>Wohnung</strong> (Art. 13 GG, § 36 Abs. 1 S. 2 ASOG). Betreten zulässig bei gegenwärtiger Gefahr für Leib/Leben oder Sachen von bedeutendem Wert (§ 36 Abs. 1 Nr. 3 ASOG; Art. 13 Abs. 7 GG; § 33 KatSG Zitiergebot). Richtervorbehalt nur für die <strong>Durchsuchung</strong> (Art. 13 Abs. 2)."},
  {"id":"k-lb26-32","cat":"Laufbahn · Recht","q":"Wie prüfen Sie die Verhältnismäßigkeit beim gewaltsamen Öffnen (§ 11 ASOG)?","a":"Geeignet, <strong>erforderlich</strong> (vorher Ansprache, Frist, Androhung, Alternativen wie anderes Aggregat von THW/Hilfsorganisationen), angemessen (Leben gegen Türschaden). Minimal beschädigen, dokumentieren, Kiosk sichern, Zeugen/Polizei."},
  {"id":"k-lb26-33","cat":"Laufbahn · Recht","q":"Welchen Ausgleich erhält der Inanspruchgenommene?","a":"Angemessener Ausgleich nach <strong>§§ 59–65 ASOG</strong> (§ 17 Abs. 3 KatSG), in Geld, nur Vermögensschaden (§ 60): Tür, Nutzungsentgelt, Verbrauch. Ausgleichspflichtig: Land Berlin (§ 63, prüfen); Rückgriff gegen Verantwortliche (§ 64 ASOG, § 31 KatSG)."},
  {"id":"k-lb26-34","cat":"Laufbahn · Recht","q":"Aggregate-Firma hat Geräte im Lager: Dürfen Sie diese nutzen?","a":"Zuerst <strong>freiwillig</strong> (Kauf, Miete, Überlassung; bei äußerster Dringlichkeit Beschaffung ohne förmliches Verfahren, z. B. § 14 Abs. 4 Nr. 3 VgV, prüfen). Sonst Duldung nach § 17 KatSG i. V. m. § 16 ASOG als Nichtverantwortliche."},
  {"id":"k-lb26-35","cat":"Laufbahn · Recht","q":"Wer entscheidet in Eilfällen über die Inanspruchnahme, und wie begrenzt die Verhältnismäßigkeit sie?","a":"Katastrophenschutzbehörde bzw. in Eilfällen das <strong>Senatsmitglied für Inneres</strong> (§ 14 Abs. 3 Nr. 2 KatSG, befristet). Nur benötigte Aggregate, die Existenz der Firma darf nicht gefährdet werden; Lagerbetreten wie beim Kiosk (§ 36 ASOG)."},
  {"id":"k-lb26-36","cat":"Laufbahn · Recht","q":"Warum bleibt bei einer Aggregate-Firma nur der Duldungsweg?","a":"Kritische Infrastrukturen müssen mit den Katastrophenschutzbehörden zusammenarbeiten (§ 28 KatSG), Aggregatehersteller und -vermieter sind aber meist <strong>keine KRITIS</strong>."},
  {"id":"k-lb26-37","cat":"Laufbahn · Recht","q":"Kostenersatz: Was erhält die Firma vom Land?","a":"Ausgleich nach §§ 59–65 ASOG (§ 17 Abs. 3 KatSG): Verlust/Beschädigung, Treibstoff, <strong>Nutzungsentgelt/Mietwert</strong>, entgangener gewöhnlicher Verdienst (Vermögensschaden § 60, in Geld). Bei Vertrag die vereinbarte Vergütung."},
  {"id":"k-lb26-38","cat":"Laufbahn · Recht","q":"Kostenersatz: Von wem kann das Land Kosten zurückfordern?","a":"Vom <strong>Verursacher</strong>, der die Katastrophe vorsätzlich oder grob fahrlässig herbeiführte, sowie bei Gefährdungshaftung (§ 31 Abs. 1 KatSG); bei höherer Gewalt ausgeschlossen (§ 31 Abs. 2). Rückgriff auch § 64 ASOG."},
  {"id":"k-lb26-39","cat":"Laufbahn · Recht","q":"Wer trägt welche Kosten im Katastrophenschutz, und was bleibt unberührt?","a":"Kosten der Maßnahmen trägt der Rechtsträger der Katastrophenschutzbehörde (<strong>Land Berlin</strong>); Hilfsorganisationen tragen ihre Mitwirkungskosten selbst (§ 29 Abs. 1 KatSG). Amtspflichtverletzung bleibt unberührt (§ 59 Abs. 4 ASOG)."},
  {"id":"k-lb26-40","cat":"Laufbahn · Management","q":"Welche Grundlage hat die Katastrophenschutzbedarfsplanung, und warum ist sie qualitativ?","a":"Methodik Lülf+ (angelehnt an den BBK-Leitfaden Risikoanalyse) in <strong>5 Phasen</strong>; <strong>qualitativ und szenarienbasiert</strong>, weil keine statistisch belastbare Grundgesamtheit besteht. Teil der Katastrophenvorsorge."},
  {"id":"k-lb26-41","cat":"Laufbahn · Management","q":"Wie ordnet sich der NTW in die KatS-Bedarfsplanung ein?","a":"NTW ist ein Rettungsdienstmittel (Alltag, quantitative Methodik), wird im Katastrophenschutz aber als Fähigkeit mitgedacht (<strong>Dual-Use</strong>)."},
  {"id":"k-lb26-42","cat":"Laufbahn · Management","q":"Welche fünf Phasen hat das Phasenmodell der KatS-Bedarfsplanung?","a":"① <strong>Brainstorming</strong> → ② <strong>Szenarienauswahl</strong> → ③ <strong>Szenarienfolgenbetrachtung</strong> → ④ <strong>Ableitung der Planungsziele</strong> → ⑤ <strong>Maßnahmenableitung</strong>."},
  {"id":"k-lb26-43","cat":"Laufbahn · Management","q":"Phase 1 Brainstorming: Was geschieht am Beispiel NTW?","a":"Alle denkbaren Szenarien mit zusätzlichem Transportbedarf sammeln: Blackout (Pflegeheime, Dialyse, Beatmung), MANV, Pandemie, Evakuierung, Hochwasser. Einteilung: <strong>anthropogen, Natur, konfliktbedingt</strong>."},
  {"id":"k-lb26-44","cat":"Laufbahn · Management","q":"Phase 2 Szenarienauswahl: Wie wird reduziert?","a":"Auf ca. <strong>5 Szenarien</strong> per Risikomatrix (Eintrittswahrscheinlichkeit × Schadensausmaß), Delphi oder Auswahl durch die untere KatS-Behörde. Velocity of Risk (Vorwarnzeit): lange Vorwarnzeit erlaubt Wechselladerkonzepte/Dual-Use."},
  {"id":"k-lb26-45","cat":"Laufbahn · Management","q":"Phase 3 Folgenbetrachtung: Was wird untersucht?","a":"Betroffenheit und Leistungsfähigkeit je Szenario für die Schutzgüter Leben, Gesundheit, Umwelt, Wirtschaft (Workshops, Beteiligungsmatrix). Ergebnis: <strong>Fähigkeitsbedarfe</strong>, z. B. Transport liegender nicht-kritischer Patienten, Verlegung, Entlastung der RTW."},
  {"id":"k-lb26-46","cat":"Laufbahn · Management","q":"Phase 4 Planungsziele: Was geschieht?","a":"Aggregation der Fähigkeitsbedarfe zu Planungszielen (Anzahl NTW, Eintreffzeit, Besetzung, Durchhalte-/Schichtfähigkeit). Der NTW ist Baustein für das Ziel „RTW bleiben für Notfälle verfügbar“."},
  {"id":"k-lb26-47","cat":"Laufbahn · Management","q":"Phase 5 Maßnahmenableitung: Was geschieht?","a":"<strong>SOLL-IST-Vergleich</strong> je Planungsziel, bei Differenz priorisierte Maßnahmenliste: Beschaffung/Vergabe, Personal (Stellenplan), Standorte, Haushaltsmittel, Dienstplan; überörtliche Konzepte (Nachbarn, Hilfsorganisationen, THW) einbeziehen."},
  {"id":"k-lb26-48","cat":"Laufbahn · Management","q":"Wie unterscheiden sich Ersterstellung und Fortschreibung der KatS-Bedarfsplanung?","a":"Ersterstellung: <strong>breiter Betrachtungshorizont, geringe Detailtiefe</strong>. Fortschreibung vertieft einzelne Planungsziele (hier NTW). Risiken werden objektiviert, Bedarfe priorisiert, Beschaffung legitimiert."},
  {"id":"k-lb26-49","cat":"Laufbahn · Management","q":"Wodurch werden Planungsziele bestimmt?","a":"Sie werden aus <strong>Bemessungsszenarien</strong> abgeleitet und von vier Einflussgrößen bestimmt: gesetzliche/aufsichtsbehördliche Vorgaben, wissenschaftliche Erkenntnisse, ethische Aspekte, normative Kraft des Faktischen."},
  {"id":"k-lb26-50","cat":"Laufbahn · Management","q":"NTW-Planungsziele: Entlastungsziel und Zeitziel?","a":"<strong>Entlastung:</strong> RTW frei für Notfälle; Anteil nicht-dringlicher Einsätze (N, S, K) beim NTW; Blockierungswahrscheinlichkeit RTW P(B) &lt; 1–5 %. <strong>Zeit:</strong> Eintreffzeit und Erreichungsgrad, großzügiger als RTW-Hilfsfrist, politisch festzulegen."},
  {"id":"k-lb26-51","cat":"Laufbahn · Management","q":"NTW-Planungsziele: Struktur-/Qualitätsziel und Wirtschaftlichkeitsziel?","a":"<strong>Struktur/Qualität:</strong> Anzahl, Standorte, Ausstattung (Typ B angelehnt), Rettungssanitäter mit Zusatzqualifikation, sichere Disposition. <strong>Wirtschaftlichkeit:</strong> SGB V § 12, Kostendeckung über Entgelte, geringere Kosten je Einsatz als RTW."},
  {"id":"k-lb26-52","cat":"Laufbahn · Management","q":"NTW-Planungsziele: Personal-, Katastrophenschutz- und Standortziel?","a":"<strong>Personal:</strong> Personalfaktor, Besetzbarkeit, Arbeitszeitrecht. <strong>KatS:</strong> Einsatzfähigkeit bei MANV, Durchhalte-/Schichtfähigkeit, Reserve, Hilfsorganisationen. <strong>Standort:</strong> gleichmäßige Abdeckung (GIS-Isochronen); Zielkonflikt Flächenoptimierung vs. Eintreffzeit."},
  {"id":"k-lb26-53","cat":"Laufbahn · Management","q":"Was sind Kennzahlen, und welche Arten gibt es?","a":"Grundlage für Planung, Controlling und Argumentation gegenüber Politik und Kostenträgern. <strong>Absolutkennzahlen</strong> (Anzahl Einsätze) und <strong>Verhältniskennzahlen</strong> (Kosten je Einsatz, Quoten), letztere für Vergleiche aussagekräftiger."},
  {"id":"k-lb26-54","cat":"Laufbahn · Management","q":"Wie sollten Daten für Kennzahlen aufbereitet werden?","a":"Vorab <strong>Datenbereinigung</strong> der Einsatzdaten; <strong>Zeitreihen</strong> sind das beste Argument in Ressourcenverteilungskämpfen."},
  {"id":"k-lb26-55","cat":"Laufbahn · Management","q":"NTW-Kennzahlen zu Einsatzzahlen, Verteilung und Bindungszeit?","a":"<strong>Einsatzzahlen</strong> nach Bemessungskategorie (N, S, K, Fehleinsätze): Potenzial für den NTW. <strong>Zeitliche/räumliche Verteilung</strong>: Schichtlage, Standorte. <strong>Bindungszeit</strong>: Eingangsgröße der Vorhaltebemessung (A = Häufigkeit × Bindungszeit)."},
  {"id":"k-lb26-56","cat":"Laufbahn · Management","q":"NTW-Kennzahlen zu Auslastung, Eintreffzeit und RTW-Entlastung?","a":"<strong>Auslastung</strong> (Einsatz-/Vorhaltestunden, Grenze ca. 75 %). <strong>Eintreffzeit/Erreichungsgrad</strong> gegenüber dem Planungsziel. <strong>RTW-Entlastung:</strong> RTW-Einsatzzahl, Blockierungsquote, Verfügbarkeit, Hilfsfristerreichung."},
  {"id":"k-lb26-57","cat":"Laufbahn · Management","q":"NTW-Kennzahlen zu Fehlalarmierung, Kosten, Personal und Katastrophenschutz?","a":"<strong>Nach-/Fehlalarmierungsquote</strong> (Qualität der Disposition). <strong>Kosten</strong> je Einsatz/Stunde, Kostendeckungsgrad (SGB V § 12). <strong>Personal:</strong> Personalfaktor, Krankenquote, Überstunden, Fluktuation. <strong>KatS:</strong> Verfügbarkeitsquote, Reaktionszeit der Zusatzvorhaltung."},
  {"id":"k-lb26-58","cat":"Laufbahn · Management","q":"Welche Rahmenbedingungen gelten für Schichtmodelle (EU-Arbeitszeitrichtlinie 2003/88/EG)?","a":"Max. <strong>48 h/Woche</strong> im 12-Monats-Schnitt, tägliche Ruhezeit mind. <strong>11 h</strong>, wöchentlich mind. 24 h, Ruhepause nach 6 h; Abweichung nur mit Opt-out/Personalrat. Die Vorhaltezeit folgt dem Tagesgang (NTW oft nur in der Einsatzspitze)."},
  {"id":"k-lb26-59","cat":"Laufbahn · Management","q":"24-Stunden-Dienst im NTW: Vor- und Nachteile?","a":"<strong>+</strong> beliebt, nur ca. 2 Anwesenheitstage, attraktiv für Personalgewinnung. <strong>−</strong> 11 h Ruhezeit schwer einzuhalten, Unfallrisiko, Nebentätigkeiten problematisch, Fortbildung erschwert; für NTW mit hoher Nachtbelastung ungeeignet."},
  {"id":"k-lb26-60","cat":"Laufbahn · Management","q":"12-Stunden-Schichten und Tagesdienst: Vor- und Nachteile?","a":"<strong>12 h:</strong> + RD-tauglich, Ruhezeit gesichert, Anpassung an Einsatzspitze; − mehr Anwesenheitstage und Wechsel. <strong>Tagesdienst (8–10 h):</strong> + passt zum NTW-Spektrum, planbar, familienfreundlich; − nachts keine Vorhaltung, höherer Personalbedarf."},
  {"id":"k-lb26-61","cat":"Laufbahn · Management","q":"Wachabteilungen und flexible Modelle: Vor- und Nachteile?","a":"<strong>Wachabteilungen (2/3/4 WA, z. B. Bremer Modell):</strong> + planbar, viele freie Tage, Ausfallkompensation; − starr, individuelle Planung kaum möglich. <strong>Flexibel (Springerpool, Jahresarbeitszeitkonten):</strong> + fängt Spitzen ab; − hoher Planungsaufwand."},
  {"id":"k-lb26-62","cat":"Laufbahn · Management","q":"Was empfiehlt die Musterlösung bei der Wahl des Schichtmodells?","a":"Passend zum Vorhaltezeitraum (Tag-/Doppelschichten in der Einsatzspitze), <strong>Personalfaktor</strong> berechnen (Ausfallzeiten erhöhen ihn), Wechsel behutsam einführen, Personalrat beteiligen."},
  {"id":"k-lb26-63","cat":"Laufbahn · Management","q":"Wie lauten die Vergabegrundsätze nach § 97 GWB?","a":"<strong>Wettbewerb, Transparenz</strong> (§ 7 VgV), <strong>Gleichbehandlung</strong> (§ 97 Abs. 2), <strong>Wirtschaftlichkeit</strong> (§ 127 GWB), <strong>Verhältnismäßigkeit</strong>."},
  {"id":"k-lb26-64","cat":"Laufbahn · Management","q":"Welche weiteren Grundsätze nennt die Musterlösung zur Vergabe?","a":"<strong>Mittelstandsfreundlichkeit</strong> (Teil-/Fachlose, § 97 Abs. 4), strategische Ziele (Nachhaltigkeit, Innovation, Soziales), E-Vergabe, <strong>Rechtsschutz</strong> (Rüge, Vergabekammer, § 160 GWB)."},
  {"id":"k-lb26-65","cat":"Laufbahn · Management","q":"Offenes Verfahren, Schritte 1–3?","a":"① Bedarf, Anforderungsprofil, Markterkundung (§ 28 VgV), Auftragswertschätzung, <strong>Mittelsicherung</strong>. ② Verfahrensart wählen (offen, nicht offen, Verhandlung, Dialog, Innovationspartnerschaft; § 119 GWB). ③ Vergabeunterlagen (§ 29 VgV), Losbildung."},
  {"id":"k-lb26-66","cat":"Laufbahn · Management","q":"Offenes Verfahren, Schritte 4–6?","a":"④ Auftragsbekanntmachung (TED und national), e-Vergabe-Plattform, Bieterfragen an alle. ⑤ Angebotsfrist mind. <strong>35 Tage</strong> (§ 15 VgV). ⑥ Öffnung und vierstufige Wertung."},
  {"id":"k-lb26-67","cat":"Laufbahn · Management","q":"Offenes Verfahren, Schritte 7–9?","a":"⑦ Bieterinformation (§ 134 GWB) mit <strong>15-Tage-Wartefrist</strong>. ⑧ Zuschlag und Vertragsschluss (§ 127 GWB, § 58 VgV). ⑨ Auftragsklärung, Abnahme, Vertragsstrafe, Gewährleistung, Vergabevermerk."},
  {"id":"k-lb26-68","cat":"Laufbahn · Management","q":"Wie erfolgt die vierstufige Wertung der Angebote?","a":"Formale Prüfung → <strong>Eignung</strong> → angemessener Preis → <strong>wirtschaftlichstes Angebot</strong>."},
  {"id":"k-lb26-69","cat":"Laufbahn · Management","q":"Wann dürfen Vergabeunterlagen veröffentlicht werden, und welches Recht gilt wo?","a":"Erst, wenn die <strong>Haushaltsmittel sicher</strong> sind. Oberhalb der Schwellenwerte GWB/VgV, darunter Unterschwellenvergabeordnung bzw. Landesrecht (prüfen)."},
  {"id":"k-lb26-70","cat":"Laufbahn · Management","q":"Was ist das Neue Steuerungsmodell (NSM)?","a":"Deutsche Umsetzung des <strong>New Public Management</strong> (KGSt, Anfang der 1990er; Einordnung prüfen): Steuerung über <strong>Ergebnisse</strong> (Output/Wirkung) statt über Mitteleinsatz (Input), Verwaltung als Dienstleister."},
  {"id":"k-lb26-71","cat":"Laufbahn · Management","q":"Welche Ziele hat das NSM?","a":"① Kernziel: <strong>Ausgaben senken ohne Leistungsminderung</strong>. ② Ergebnis, Qualität, Bürgernähe. ③ Mitarbeitermotivation und Eigenverantwortung. ④ Politik legt Ziele fest, Verwaltung entscheidet über das Wie."},
  {"id":"k-lb26-72","cat":"Laufbahn · Management","q":"Nennen Sie die acht Elemente des NSM.","a":"<strong>Doppik</strong>, <strong>Produktorientierung</strong>, <strong>Budgetierung</strong>, <strong>dezentrale Ressourcenverantwortung</strong>, <strong>KLR</strong>, <strong>Controlling/Berichtswesen</strong>, <strong>Prozessanalyse</strong>, <strong>Qualitätsmanagement</strong>. Dazu Kontraktmanagement (Zielvereinbarungen)."},
  {"id":"k-lb26-73","cat":"Laufbahn · Management","q":"Erklären Sie Doppik, Produktorientierung und Budgetierung im NSM.","a":"<strong>Doppik:</strong> kaufmännische Buchführung, Ressourcenverbrauch statt Geldverbrauch. <strong>Produkte:</strong> mit Zielen, Mengen, Kosten (Produktpyramide). <strong>Budgetierung:</strong> Deckungsfähigkeit, Übertragbarkeit."},
  {"id":"k-lb26-74","cat":"Laufbahn · Management","q":"Erklären Sie dezentrale Verantwortung, KLR und Controlling im NSM.","a":"<strong>Dezentral:</strong> Fachbereiche bewirtschaften eigenes Budget. <strong>KLR:</strong> Kostenarten, -stellen, -träger, Basis der Gebührenkalkulation. <strong>Controlling:</strong> intern operativ, extern politisch; planen, kontrollieren, nachsteuern."},
  {"id":"k-lb26-75","cat":"Laufbahn · Management","q":"Welche drei Säulen hat der doppische Haushalt, und wie grenzt er sich von der Kameralistik ab?","a":"<strong>Finanzhaushalt</strong> (Liquidität), <strong>Ergebnishaushalt</strong> (Aufwand/Ertrag, Ausgleich am Jahresende), <strong>Vermögenshaushalt/Bilanz</strong>. Kameralistik: Kassenorientierung, kein Werteverzehr."},
  {"id":"k-lb26-76","cat":"Laufbahn · Management","q":"Welchen Bezug hat das NSM zur Feuerwehr?","a":"Produkte: Brandschutz, Technische Hilfe, Rettungsdienst. Haushalt als „Vertrag“ Politik–Verwaltung (<strong>strategisch</strong>), KLR/Controlling (<strong>operativ</strong>); Kennzahl z. B. Schutzzielerreichungsgrad."},
  {"id":"k-lb26-77","cat":"Laufbahn · Management","q":"Was gilt bei vorläufiger Haushaltsführung, und warum?","a":"Ohne festgestellten Haushalt fehlt die <strong>Ermächtigung</strong> zu Ausgaben (Budgetrecht des Parlaments), ausgenommen gesetzlich zugelassene Ausgaben."},
  {"id":"k-lb26-78","cat":"Laufbahn · Management","q":"Welche Rechtsgrundlage gilt in Hamburg, und was erlaubt sie?","a":"<strong>Art. 67 Hamburgische Verfassung:</strong> Ausgaben (a) zur Erhaltung bestehender Einrichtungen und für beschlossene Maßnahmen, (b) für rechtliche Verpflichtungen, (c) zur Fortsetzung von Bauten/Beschaffungen mit Vorjahresmitteln. Einnahmen dürfen fortgeführt werden."},
  {"id":"k-lb26-79","cat":"Laufbahn · Management","q":"Was ist bei vorläufiger Haushaltsführung erlaubt?","a":"Rechtliche Verpflichtungen (Verträge, Gehälter, Gefahrenabwehr), <strong>Dienstbetrieb</strong>, Vermeidung von Folgeschäden, <strong>Fortführung begonnener Investitionen</strong> mit Vorjahresmitteln, Einnahmen in beliebiger Höhe."},
  {"id":"k-lb26-80","cat":"Laufbahn · Management","q":"Was darf für den NTW bei vorläufiger Haushaltsführung vorbereitet werden?","a":"Ohne Ausgabewirkung: Bedarfsplanung, <strong>Markterkundung</strong> (§ 28 VgV), Leistungsbeschreibung, Mittelanmeldung (Haushalt, Investitionsprogramm, Stellenplan), Abstimmung mit Kostenträgern (Entgeltverhandlung)."},
  {"id":"k-lb26-81","cat":"Laufbahn · Management","q":"Was ist für den NTW bei vorläufiger Haushaltsführung nicht erlaubt?","a":"Neue <strong>erhebliche Investitionen</strong> beginnen (Beschaffung, Zuschlag, Verpflichtungsermächtigungen) ohne Vorjahresmittel; <strong>neue Stellen</strong> eines nicht rechtskräftigen Stellenplans besetzen."},
  {"id":"k-lb26-82","cat":"Laufbahn · Management","q":"Wie geht man praktisch vor, wenn der NTW bei vorläufiger Haushaltsführung beschafft werden soll?","a":"Vergabeunterlagen erst bei gesicherter Finanzierung veröffentlichen, Zuschlag unter Haushaltsvorbehalt verschieben, Bestellung erst nach Inkrafttreten. Bei akuter Gefahrenabwehr bleiben notwendige Beschaffungen zulässig (mit Kämmerei klären)."},
  {"id":"k-lb26-83","cat":"Laufbahn · Management","q":"Wie lange dauert der Haushaltsprozess, und was folgt daraus?","a":"Rund <strong>18 Monate</strong>, daher langfristig planen (Investitionsprogramm, Verpflichtungsermächtigungen, Doppelhaushalte); für alles Neue: erst prüfen, dann handeln."},
  {"id":"k-lb26-84","cat":"Laufbahn · Stabsarbeit","q":"Wie gliedert sich der Führungsstab nach FwDV 100?","a":"<strong>S1</strong> Personal/Innerer Dienst, <strong>S2</strong> Lage, <strong>S3</strong> Einsatz, <strong>S4</strong> Versorgung, <strong>S5</strong> Presse- und Medienarbeit, <strong>S6</strong> Informations- und Kommunikationswesen."},
  {"id":"k-lb26-85","cat":"Laufbahn · Stabsarbeit","q":"Was ist der S4, und mit wem kann er zusammengefasst werden?","a":"Das Sachgebiet <strong>Versorgung/Logistik</strong>. Es kann mit S1 zusammengefasst oder vom Leiter des Stabes übernommen werden."},
  {"id":"k-lb26-86","cat":"Laufbahn · Stabsarbeit","q":"Aufgaben des S4 nach FwDV 100: Einsatzmittel und Verbrauchsgüter?","a":"① Weitere <strong>Einsatzmittel</strong> anfordern und zuführen (Geräte, Baustoffe, Transport-, Räum-/Hebegerät). ② <strong>Verbrauchsgüter</strong>: Löschwasser, Löschmittel (Schaum), Atemschutzgeräte/-filter, Kraftstoffe."},
  {"id":"k-lb26-87","cat":"Laufbahn · Stabsarbeit","q":"Aufgaben des S4 nach FwDV 100: Verpflegung, Unterkunft, Materialerhaltung?","a":"③ <strong>Verpflegung</strong>. ④ <strong>Unterkünfte</strong> und Rettungsmittel zum Eigenschutz (technisch, medizinisch, psychosozial, z. B. FB-PSNV-E). ⑤ <strong>Materialerhaltung</strong> (Instandsetzung, Austausch, Wiederauffüllen)."},
  {"id":"k-lb26-88","cat":"Laufbahn · Stabsarbeit","q":"Aufgabe des S4: Versorgungsorganisation festlegen. Was gehört dazu?","a":"Raumordnung (Versorgungs- und Bereitstellungsräume), Schnittstellen, <strong>Logistikkette</strong>, Finanzierung/Kostenklärung."},
  {"id":"k-lb26-89","cat":"Laufbahn · Stabsarbeit","q":"Welche Leitfragen gelten für die Logistik des S4?","a":"Die <strong>5 W</strong>: Was – Wo – Wieviel – Wann – Woher."},
  {"id":"k-lb26-90","cat":"Laufbahn · Stabsarbeit","q":"Raffineriebrand: Welchen Szenariobezug hat die S4-Arbeit?","a":"Schaum-/Löschwasserbedarf, Atemschutz/Chemikalienschutz, Kraftstoff für Pumpen und Fahrzeuge, Verpflegung und Ablösung bei langer Einsatzdauer."},
  {"id":"k-lb26-91","cat":"Laufbahn · Stabsarbeit","q":"Nach welchen Leitgedanken arbeitet der S4 (Leitidee des Konzepts)?","a":"<strong>Vorausschauend</strong> (Zeitstrahl: wann was, wo, in welcher Menge), entlang des Führungsvorgangs, im Verbund mit S1, S2, S3, S6. Grundlage ist der <strong>7-Punkte-Plan</strong>; S4 trägt Punkt 3 (Eigenschutz) und liefert Bedarfszahlen für Punkt 7 (Nachforderung)."},
  {"id":"k-lb26-92","cat":"Laufbahn · Stabsarbeit","q":"S4-Konzept: Welche vier Phasen mit Zeitrahmen gibt es?","a":"① <strong>Sofortphase</strong> (0 bis ca. 30 Min.) ② <strong>Aufbauphase</strong> (ca. 30 Min. bis 2 h) ③ <strong>Durchhaltephase</strong> (ca. 2 bis 12 h und länger) ④ <strong>Rückbau und Nachbereitung</strong>. Grenzen sind Orientierungswerte."},
  {"id":"k-lb26-93","cat":"Laufbahn · Stabsarbeit","q":"Sofortphase des S4: Bedarf und Kontakte?","a":"Arbeitsaufnahme, Lageeinweisung, Kräfte-/Mittelübersicht (S1). <strong>Bedarfsabschätzung</strong> (Löschwasser, Schaummittel, Atemschutz, Kraftstoff) mit Sicherheitszuschlag. Sofort Kontakt zu Betreiber/Werkfeuerwehr und Rettungsdienst."},
  {"id":"k-lb26-94","cat":"Laufbahn · Stabsarbeit","q":"Sofortphase des S4: Bereitstellungsraum und Eigenschutz?","a":"<strong>Bereitstellungsraum</strong> festlegen (S1/S3): Führung, Tanken, Sanitär, Wetterschutz, Strom/Wasser, Kommunikation, Lotsen, abseits der Rauchrichtung. <strong>Eigenschutz</strong>: Sicherheitstrupps, Sanitätsdienst, PSNV-E."},
  {"id":"k-lb26-95","cat":"Laufbahn · Stabsarbeit","q":"Aufbauphase des S4: Welche Maßnahmen?","a":"<strong>Nachforderung</strong> kalkulieren und über Leitstelle/S1 anfordern (Schaummittel, Großpumpen, Schlauch, Wechsellader, Tankfahrzeuge, Chemieschutz, Messtechnik). <strong>Logistikkette</strong> festlegen (wer liefert, wohin, welcher Weg), Verpflegung/Ablösekonzept, Kostenfragen vorklären."},
  {"id":"k-lb26-96","cat":"Laufbahn · Stabsarbeit","q":"Durchhaltephase des S4: Welche Maßnahmen?","a":"<strong>Verbrauchsfortschreibung</strong> (Soll/Ist, Reichweite), rollierender Nachschub, Materialerhaltung, Ablösung, Ruhe-/Unterkunftsräume, Lagebesprechungen mit Vorplanung für 6, 12 und 24 Stunden."},
  {"id":"k-lb26-97","cat":"Laufbahn · Stabsarbeit","q":"Rückbau- und Nachbereitungsphase des S4: Was gehört dazu?","a":"Rückführung von Material, Bestandsaufnahme, Instandsetzung, Auffüllen, Dekontamination; Abrechnung/Kostennachweis, Einsatztagebuch, Abschlussbericht, Lessons Learned, Übergang zur Regeleinsatzorganisation."},
  {"id":"k-lb26-98","cat":"Laufbahn · Stabsarbeit","q":"Wie kontrolliert der S4 den Ablauf?","a":"Befehle und Anforderungen schriftlich über den <strong>Vierfach-Nachrichtenvordruck</strong>, Dokumentation im Einsatztagebuch (S2), Rückmeldung an den Leiter des Stabes."},
  {"id":"k-lb26-99","cat":"Laufbahn · Stabsarbeit","q":"Schnittstellen des S4: Einsatzleiter/Leiter des Stabes, S1, S2?","a":"<strong>EL/LdS:</strong> Aufträge, Prioritäten, Vortrag der Versorgungslage. <strong>S1:</strong> Kräfte-/Mittelübersicht, Bereitstellungsräume, Ablösung, Nachschub. <strong>S2:</strong> Lagekarte, Prognosen für den Bedarf, Einsatztagebuch."},
  {"id":"k-lb26-100","cat":"Laufbahn · Stabsarbeit","q":"Schnittstellen des S4: S3, S5, S6?","a":"<strong>S3:</strong> Einsatzabschnitte/-schwerpunkte, Absperrungen, An-/Abmarschwege. <strong>S5:</strong> Informationen für die Bevölkerung, Betreuung der Medien. <strong>S6:</strong> Kommunikationswege zu Lieferanten und Bereitstellungsraum."},
  {"id":"k-lb26-101","cat":"Laufbahn · Stabsarbeit","q":"Schnittstellen des S4: Fachberater, Verbindungspersonen, Krisenstab/HVB?","a":"<strong>Fachberater/Verbindungspersonen:</strong> Werkfeuerwehr, Rettungsdienst, Polizei, THW, Hilfsorganisationen, Umwelt-/Gesundheitsamt. <strong>Krisenstab/HVB:</strong> Beschaffung, Finanzierung, Betreuung, Amtshilfe, Bundeswehr, Kosten."},
  {"id":"k-lb26-102","cat":"Laufbahn · Stabsarbeit","q":"Wie läuft die Kommunikation an den Schnittstellen des S4 ab?","a":"In beide Richtungen, <strong>schriftlich über Nachrichtenvordruck</strong>."},
  {"id":"k-lb26-103","cat":"Laufbahn · Stabsarbeit","q":"Welche Rolle hat der S4 im Stab?","a":"Sachgebietsleiter und <strong>Fachberater</strong> Logistik gegenüber EL und LdS; wirkt an Lagebeurteilung und Entschluss mit („Was ist machbar, bis wann?“), trägt in Lagebesprechungen vor. Der Stab berät und bereitet vor."},
  {"id":"k-lb26-104","cat":"Laufbahn · Stabsarbeit","q":"Wer entscheidet im Stab, und was gilt im Zwei-Stäbe-Modell?","a":"<strong>Entscheidung und Befehlsgewalt</strong> liegen beim Einsatzleiter. Zwei-Stäbe-Modell: operativ-taktische Einsatzleitung, daneben administrativ-organisatorischer Krisenstab."},
  {"id":"k-lb26-105","cat":"Laufbahn · Stabsarbeit","q":"Welche Aufgaben hat der S4 im Stab außerdem?","a":"Zuarbeiter (Verpflegungs-, Material-, Nachschubpersonal) anleiten und <strong>Dokumentation</strong> (Nachrichtenvordruck, ETB) sicherstellen."},
  {"id":"k-lb26-106","cat":"Laufbahn · Stabsarbeit","q":"Welche Rolle hat der S4 außerhalb des Stabes?","a":"<strong>Ansprechpartner/Koordinator</strong> gegenüber Versorgungskräften, Bereitstellungsraum und Einsatzabschnitten; Schnittstelle zu Lieferanten, Betreiber, HiOrg, THW, Bundeswehr, Ämtern; Kontrolle der Umsetzung; Vorbildfunktion und Fürsorge."},
  {"id":"k-lb26-107","cat":"Laufbahn · Stabsarbeit","q":"Welche Abgrenzung gilt für den S4?","a":"Er hat <strong>keine eigene Einsatzbefehlsgewalt</strong> über Kräfte im Schadengebiet; er handelt im Auftrag und mit Weisungen des Einsatzleiters/Leiters des Stabes."},
  {"id":"k-lb26-108","cat":"Laufbahn · Stabsarbeit","q":"Fehler 1 der Stabsarbeit (Raffineriebrand): Bedarf zu spät oder zu klein. Vermeidung?","a":"Logistik läuft der Lage hinterher. <strong>Zeitstrahl und Verbrauchsrechnung</strong> mit Sicherheitszuschlag, Nachforderung in Wellen, Rücksprache mit Werkfeuerwehr, Prognosen von S2/S3."},
  {"id":"k-lb26-109","cat":"Laufbahn · Stabsarbeit","q":"Fehler 2: Gestörte Schnittstellen und Informationsverlust. Vermeidung?","a":"Folge: doppelte Anforderungen, widersprüchliche Lagebilder. Klare Zuständigkeiten, <strong>Vierfach-Nachrichtenvordruck</strong>, feste Lagebesprechungen, Verbindungspersonen, Einsatztagebuch."},
  {"id":"k-lb26-110","cat":"Laufbahn · Stabsarbeit","q":"Fehler 3: Eigenschutz und Ablösung vergessen. Vermeidung?","a":"Folge: Überlastung und Ausfall von Kräften (Hitze, Atemschutz, Rauch). <strong>Eigenschutz</strong> (Punkt 3 des 7-Punkte-Plans) zuerst veranlassen, Schichtmodell und Verpflegung früh planen, Sicherheitstrupps, PSNV-E."},
  {"id":"k-lb26-111","cat":"Laufbahn · Stabsarbeit","q":"Fehler 4: Bereitstellungsraum ungeeignet oder ohne Lotsen. Vermeidung?","a":"Z. B. in der Rauchausbreitung, Stau, Glasschäden auf Straßen. Standortwahl mit S2/S3 (Wind, Zufahrten), <strong>Führungseinheit im BR</strong>, Lotsenstellen, Ausweichräume."},
  {"id":"k-lb26-112","cat":"Laufbahn · Stabsarbeit","q":"Fehler 5: Überlastung und Fixierung des S4. Vermeidung?","a":"Tunnelblick auf den Brand, Verletztenlogistik vernachlässigt. <strong>Delegieren</strong>, Prioritätenliste, Rückkopplung mit dem Leiter des Stabes, Krisenstab für nicht-feuerwehrtechnische Ressourcen einbinden."},
  {"id":"k-lb26-113","cat":"Laufbahn · Stabsarbeit","q":"Fehler 6: Rechtliche, finanzielle und dokumentarische Lücken. Vermeidung?","a":"Anforderung ohne Kostenklärung, lückenhaftes ETB, unklare Zuständigkeit. <strong>Lückenlose Dokumentation</strong>, Kostenübernahme früh mit Krisenstab/HVB klären, Betreiber einbinden, Rechtsgrundlage (Amtshilfe, KatS-Recht) beachten."},
  {"id":"k-lb26-114","cat":"Laufbahn · Stabsarbeit","q":"Welche weiteren Fehler der Stabsarbeit nennt die Musterlösung alternativ?","a":"Veraltetes Lagebild ohne Rückmeldung der Abschnitte; Rauchsäule/Bevölkerungswarnung missachtet (S5/Krisenstab); <strong>inkompatibles Material</strong> (Schaummittel, Kupplungen); keine Vorplanung der Nachbereitung."},
  {"id":"k-lb26-115","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welches Schutzziel und welche Normen liegen der Rettungswegsystematik der MBO zugrunde?","a":"Schutzziel <strong>§ 14 MBO</strong>: Rettung von Menschen und Tieren. § 33 Rettungswege, § 34 Treppen, § 35 notwendige Treppenräume und Ausgänge, § 36 notwendige Flure und offene Gänge."},
  {"id":"k-lb26-116","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert § 33 Abs. 1 MBO zu den Rettungswegen?","a":"Je Nutzungseinheit mit Aufenthaltsräumen in jedem Geschoss mindestens <strong>zwei voneinander unabhängige Rettungswege</strong>. Beide dürfen innerhalb eines Geschosses über denselben notwendigen Flur führen."},
  {"id":"k-lb26-117","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie sind erster und zweiter Rettungsweg nach MBO beschaffen?","a":"<strong>Erster:</strong> baulich über eine notwendige Treppe im notwendigen Treppenraum ins Freie. <strong>Zweiter:</strong> zweite notwendige Treppe oder mit Rettungsgeräten der Feuerwehr erreichbare Stelle (<strong>Anleiterbarkeit</strong>)."},
  {"id":"k-lb26-118","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Rettungsweglänge fordert die MBO?","a":"Von jeder Stelle eines Aufenthaltsraumes höchstens <strong>35 m</strong> bis zum notwendigen Treppenraum oder Ausgang ins Freie (§ 35 Abs. 2, Absatz prüfen)."},
  {"id":"k-lb26-119","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wann ist ein zweiter Rettungsweg nicht erforderlich (Sicherheitstreppenraum)?","a":"Wenn die Rettung über einen Treppenraum möglich ist, in den <strong>Feuer und Rauch nicht eindringen</strong> können (§ 33 Abs. 2 S. 3)."},
  {"id":"k-lb26-120","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Bis zu welcher Höhe gilt die Anleiterbarkeit, und was gilt darüber?","a":"Bis <strong>8 m</strong> Brüstungsoberkante. Darüber nur, wenn die Feuerwehr die nötigen Rettungsgeräte (Hubrettungsfahrzeuge) hat (§ 33 Abs. 3). Entscheidend: Leistungsfähigkeit der Feuerwehr, Aufstellflächen; bei Sonderbauten Zustimmung der Feuerwehr."},
  {"id":"k-lb26-121","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Mindestmaße gelten für Fenster als Rettungsweg?","a":"Im Lichten mindestens <strong>0,90 m × 1,20 m</strong>, Brüstungshöhe höchstens 1,20 m."},
  {"id":"k-lb26-122","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Erleichterungen gelten in den Gebäudeklassen 1 und 2?","a":"Keine notwendigen Treppenräume, Treppen ohne eigenen Raum, Anleiterbarkeit als zweiter Rettungsweg."},
  {"id":"k-lb26-123","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Anforderungen gelten für notwendige Treppenräume (GK 3–5)?","a":"Wände nach Gebäudeklasse (REI 30 / REI 60-M / Bauart Brandwand), Ausgang ins Freie, beleuchtet; Sicherheitsbeleuchtung bei GK 5 ohne Fenster; Rauchableitung (Öffnung oben, mind. 1 m²)."},
  {"id":"k-lb26-124","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Anforderungen gelten für notwendige Flure?","a":"<strong>Rauchabschnitte ≤ 30 m</strong>, Rauchschutztüren, nichtbrennbare Wände und Bekleidungen; Stichflure praktisch auf 15 m beschränkt; keine Nutzung als Lagerfläche."},
  {"id":"k-lb26-125","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was gilt für Keller, Sonderbauten und Barrierefreiheit bei Rettungswegen?","a":"<strong>Keller:</strong> ebenfalls zwei Rettungswege, Türen je Nutzung (T30-DS/-RS). <strong>Sonderbauten:</strong> Sonderbauverordnungen (z. B. Versammlungsstätten, Beherbergung, Krankenhäuser, Verkaufsstätten, Garagen, Hochhäuser). Auch mobilitätseingeschränkte Personen berücksichtigen."},
  {"id":"k-lb26-126","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wann liegt ein Hochhaus vor, und welches Regelwerk gilt?","a":"OKFF des höchstgelegenen Aufenthaltsgeschosses mehr als <strong>22 m</strong> über Gelände (§ 2 Abs. 4 Nr. 1 MBO). Sonderbau mit Anforderungen nach der <strong>Muster-Hochhaus-Richtlinie (MHHR)</strong>."},
  {"id":"k-lb26-127","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Warum genügt im Hochhaus die Anleiterbarkeit nicht als zweiter Rettungsweg?","a":"Hubrettungsgeräte reichen nur bis ca. <strong>23 m</strong>. Gefordert sind zwei voneinander unabhängige <strong>bauliche</strong> Rettungswege je Nutzungseinheit und Geschoss, in der Regel zwei notwendige Treppenräume."},
  {"id":"k-lb26-128","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie weit kann ein Sicherheitstreppenraum in Hochhäusern zwei Treppenräume ersetzen?","a":"Bis <strong>60 m</strong> genügt ein Sicherheitstreppenraum (rauchfrei, Vorraum, Druckbelüftung). Über 60 m müssen alle Treppenräume Sicherheitstreppenräume sein. Wände REI 90 bzw. REI 120 (App-Tab, MHHR prüfen)."},
  {"id":"k-lb26-129","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Rettungsweglänge im Hochhaus nach MHHR?","a":"Von jeder Stelle max. <strong>35 m</strong> bis Treppenraum oder Ausgang; Stichflure max. <strong>15 m</strong>. Selbstrettung hat Vorrang, zusätzlich Feuerwehraufzug."},
  {"id":"k-lb26-130","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Anlagentechnik im Hochhaus: Melden und Alarmieren?","a":"<strong>Brandmeldeanlage</strong> (Vollschutz, Aufschaltung zur Leitstelle) mit Brandfallsteuerung (Aufzüge, Türen, Lüftung); <strong>Alarmierungsanlage/ELA</strong> mit Sprachdurchsagen; Hausalarmanlage."},
  {"id":"k-lb26-131","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Anlagentechnik im Hochhaus: Rauchfreihaltung und Beleuchtung?","a":"<strong>Druckbelüftung</strong> für Sicherheitstreppenraum und Vorräume (STR-Vorraum 2,0 m/s, FA-Vorraum 0,75 m/s, App-Werte); <strong>Rauch-/Wärmeabzug</strong>, Rauchschutzdruckanlagen; <strong>Sicherheitsbeleuchtung</strong> und Rettungszeichen mit Sicherheitsstrom."},
  {"id":"k-lb26-132","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Anlagentechnik im Hochhaus: Feuerwehraufzug, Sprinkler, Steigleitungen?","a":"<strong>Feuerwehraufzug:</strong> Haltestelle je Geschoss, Vorraum ≥ 6 m², Druckbelüftung, Sicherheitsstrom. <strong>Sprinkler</strong> (Pflicht, Ausnahme bei kleinen Nutzungseinheiten ≤ 200 m² mit REI 90). <strong>Nasse Steigleitungen</strong> mit Wandhydranten Typ F."},
  {"id":"k-lb26-133","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche organisatorischen Maßnahmen ergänzen die Anlagentechnik im Hochhaus?","a":"Brandschutzordnung, Flucht- und Rettungspläne, Feuerwehrpläne, Räumungskonzept (phasenweise Evakuierung), Brandschutzbeauftragte, Alarmplan. Tiere: Schutzziel § 14 MBO, im Hochhaus kaum relevant."},
  {"id":"k-lb26-134","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Rolle hat die Feuerwehr bei einer Abweichung, und wer entscheidet?","a":"Die Feuerwehr gibt als beteiligte Stelle eine <strong>fachliche Stellungnahme</strong> ab; die <strong>Bauaufsichtsbehörde</strong> entscheidet über die Abweichung. Empfehlung und Anforderung klar trennen."},
  {"id":"k-lb26-135","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Voraussetzungen hat eine Abweichung nach § 67 MBO?","a":"Begründeter schriftlicher <strong>Antrag des Bauherrn</strong>; Vereinbarkeit mit öffentlichen Belangen (§ 3 Abs. 1) und Schutzzielen (§ 14); Ermessen der Bauaufsicht; Anforderung und Schutzzweck benennen."},
  {"id":"k-lb26-136","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was prüfen Sie zur Einordnung eines Bürogebäudes in Holzbauweise?","a":"<strong>Gebäudeklasse</strong> (GK 4: OKFF ≤ 13 m; GK 5: > 13 m bis 22 m; darüber Hochhaus/MHHR), Sonderbau?, Verfahren und Brandschutznachweis (§ 66 MBO), Beteiligung und Frist, Aktenzeichen/Planstand."},
  {"id":"k-lb26-137","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Richtlinie gilt für Holzbau der GK 4 und 5, und was gilt bei Abweichung?","a":"<strong>Muster-Holzbaurichtlinie (MHolzBauRL, Fassung 2024)</strong>, soweit eingeführt. Bei Abweichung ist die <strong>Gleichwertigkeit</strong> nachzuweisen (Verfahrensweg nach Landesrecht prüfen)."},
  {"id":"k-lb26-138","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Inhaltliche Prüfung der Stellungnahme: Abweichungen, Konzept, Konstruktion?","a":"Abweichungen <strong>konkret benennen</strong> (z. B. Kapselung K2 60, Holzoberflächen in Rettungswegen). Brandschutzkonzept vollständig/plausibel mit Schutzzielbetrachtung. Konstruktion: hochfeuerhemmend (GK 4) bzw. feuerbeständig (GK 5), Kapselung, Hohlräume, Fugen, Brandsperren."},
  {"id":"k-lb26-139","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Inhaltliche Prüfung: Rettungswege, Fassade, abwehrender Brandschutz?","a":"<strong>Rettungswege:</strong> nichtbrennbare Oberflächen in Fluren/Treppenräumen, Rauchschutz, Länge, Anleiterbarkeit bis 8 m. <strong>Fassade:</strong> Brandüberschlag, Hinterlüftung. <strong>Abwehrend:</strong> Zugänge, Aufstellflächen, Löschwasser, Nachlöscharbeiten (Glutnester)."},
  {"id":"k-lb26-140","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wann sind Kompensationsmaßnahmen für Abweichungen geeignet?","a":"Sie müssen <strong>geeignet und gleichwertig</strong> sein (Sprinkler, BMA mit Aufschaltung, höhere Feuerwiderstandsklassen, zusätzliche Kapselung, Rettungswege). Organisatorische Maßnahmen allein ersetzen i. d. R. bauliche Anforderungen nicht. Mehrere Abweichungen kumulativ bewerten."},
  {"id":"k-lb26-141","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was tun Sie als Leiter VB bei einer falschen Stellungnahme?","a":"Fehler analysieren, Schutzzielgefährdung bewerten; <strong>korrigierte Fassung</strong> erstellen (Gegenzeichnung); Bauaufsicht unverzüglich informieren, falls schon übermittelt; Akte dokumentieren; Fachaufsicht, Amtshaftung (Art. 34 GG, § 839 BGB) bedenken."},
  {"id":"k-lb26-142","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie gehen Sie mit dem Sachbearbeiter nach einer fehlerhaften Stellungnahme um?","a":"Sachlich, <strong>ohne Bloßstellen</strong>, Ursachen klären; zeitnahes Einzelgespräch mit konkretem Feedback; Qualifizierung (Holzbau, MHolzBauRL, Abweichungsrecht, Checklisten); <strong>Vier-Augen-Prinzip</strong>; Nachhalten, dienstrechtliche Schritte nur als letzte Stufe."},
  {"id":"k-lb23-01","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was besagt die Kernregel des Rettungswegsystems nach § 33 Abs. 1 MBO?","a":"Für jede <strong>Nutzungseinheit</strong> mit mindestens einem Aufenthaltsraum (Wohnung, Praxis, Betriebsstätte) müssen in jedem Geschoss mit Aufenthaltsräumen <strong>zwei voneinander unabhängige Rettungswege ins Freie</strong> vorhanden sein. Beide dürfen innerhalb des Geschosses über denselben notwendigen Flur führen."},
  {"id":"k-lb23-02","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was ist ein Rettungsweg, und welches Schutzziel verfolgt das System der Rettungswege?","a":"Rettungsweg = <strong>baulich gesicherter Weg</strong> von jeder Stelle eines Aufenthaltsraums bis ins Freie (öffentliche Verkehrsfläche oder gesicherter Bereich auf dem Grundstück). Schutzziel nach § 14 MBO: Rettung von Menschen und Tieren, also <strong>Selbstrettung und Fremdrettung</strong> durch die Feuerwehr."},
  {"id":"k-lb23-03","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Aus welchen Bestandteilen besteht das bauordnungsrechtliche System der Rettungswege?","a":"Nutzungseinheit/Aufenthaltsraum als Ausgangspunkt, <strong>notwendige Flure und offene Gänge</strong> (§ 36), <strong>notwendige Treppen</strong> (§ 34), <strong>notwendige Treppenräume</strong> (§ 35), <strong>Ausgänge</strong>, <strong>Türen und Fenster</strong> (§ 37) sowie Zugänge, Zufahrten und Aufstellflächen (§ 5)."},
  {"id":"k-lb23-04","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Anforderungen stellt § 36 MBO an notwendige Flure und offene Gänge?","a":"Nutzung im Brandfall ausreichend lang möglich; Unterteilung in <strong>Rauchabschnitte ≤ 30 m</strong> mit rauchdichten, selbstschließenden Türen; <strong>Stichflure bis 15 m</strong>. Wände feuerhemmend bzw. nach Gebäudeklasse; Ausnahmen u. a. für Flure innerhalb von Wohnungen und kleinen Nutzungseinheiten."},
  {"id":"k-lb23-05","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert § 34 MBO für notwendige Treppen?","a":"Jedes nicht zu ebener Erde liegende Geschoss und der benutzbare Dachraum muss über mindestens <strong>eine notwendige Treppe</strong> erreichbar sein. Tragende Teile: GK 3 feuerhemmend/nichtbrennbar, GK 4 hochfeuerhemmend, GK 5 feuerbeständig und nichtbrennbar; Mindestbreite und Handläufe."},
  {"id":"k-lb23-06","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was fordert § 35 MBO für notwendige Treppenräume?","a":"Jede notwendige Treppe liegt in einem <strong>eigenen, durchgehenden Treppenraum</strong> (Ausnahme GK 1 und 2). Wände: GK 3 feuerhemmend, GK 4 hochfeuerhemmend mit mechanischer Beanspruchung, GK 5 in Bauart einer Brandwand."},
  {"id":"k-lb23-07","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Anforderungen gelten für Rauchableitung und Sonderform des Treppenraums (§ 35 MBO)?","a":"Rauchableitung über eine Öffnung am oberen Ende von <strong>≥ 1 m²</strong> bzw. Fenster, dazu Beleuchtung. Sonderform: <strong>Sicherheitstreppenraum</strong>, in den Feuer und Rauch nicht eindringen. Treppenräume haben einen unmittelbaren Ausgang ins Freie oder einen geschützten Gang dorthin."},
  {"id":"k-lb23-08","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie weit darf der Ausgang höchstens entfernt sein (Rettungsweglänge)?","a":"Von jeder Stelle eines Aufenthaltsraums (und Kellergeschosses) muss mindestens ein Ausgang in einen notwendigen Treppenraum oder ins Freie in höchstens <strong>35 m</strong> Entfernung erreichbar sein."},
  {"id":"k-lb23-09","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Rolle spielen Türen, Fenster und sonstige Öffnungen (§ 37 MBO) im Rettungsweg?","a":"Feuerschutz- und Rauchschutzabschlüsse, <strong>leicht zu öffnen in Fluchtrichtung</strong>. Fenster dienen als Rettungsöffnung bzw. Anleiterstelle; die Mindestmaße sind landesrechtlich geregelt."},
  {"id":"k-lb23-10","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wozu dienen Zugänge, Zufahrten und Aufstellflächen (§ 5 MBO) im Rettungswegsystem?","a":"Sie sind die Voraussetzung für den <strong>zweiten Rettungsweg über Rettungsgeräte der Feuerwehr</strong> (Drehleiter, tragbare Leitern). Die Flächen müssen tragfähig und freigehalten sein."},
  {"id":"k-lb23-11","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche begleitenden Maßnahmen ergänzen das Rettungswegsystem?","a":"Kennzeichnung und <strong>Sicherheitsbeleuchtung</strong>, Rauchableitung/RWA, Alarmierung, Feuerwehraufzug (Hochhaus), in Sonderbauten zusätzliche Anforderungen (Sonderbauverordnungen, Brandschutzkonzept). Organisatorisch: Rettungswege freihalten, Rettungswegpläne, Brandschutzordnung."},
  {"id":"k-lb23-12","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche erste Möglichkeit der MBO sichert den zweiten Rettungsweg?","a":"<strong>Zwei bauliche Rettungswege</strong>: der erste über eine notwendige Treppe, der zweite über eine weitere notwendige Treppe (§ 33 Abs. 2 Satz 1 und 2 MBO)."},
  {"id":"k-lb23-13","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche zweite Möglichkeit der MBO sichert den zweiten Rettungsweg, und welche Bedingung gilt?","a":"Erster Rettungsweg baulich, zweiter über <strong>Rettungsgeräte der Feuerwehr</strong> (Anleiterstelle am Fenster). Liegt die Brüstungsoberkante mehr als <strong>8 m</strong> über Gelände, ist das nur zulässig, wenn die Feuerwehr Hubrettungsfahrzeuge vorhält (§ 33 Abs. 3 MBO)."},
  {"id":"k-lb23-14","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wo ist die Anleiterung als zweiter Rettungsweg ausgeschlossen oder eingeschränkt?","a":"Bei <strong>Hochhäusern</strong> (OKFF &gt; 22 m) nicht zulässig. Bei Sonderbauten nur, wenn keine Bedenken wegen der Personenrettung bestehen (§ 33 Abs. 3 Satz 2 MBO)."},
  {"id":"k-lb23-15","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wann ist nach § 33 Abs. 2 Satz 3 MBO kein zweiter Rettungsweg erforderlich?","a":"Wenn die Rettung über einen sicher erreichbaren <strong>Sicherheitstreppenraum</strong> möglich ist, in den Feuer und Rauch nicht eindringen können."},
  {"id":"k-lb23-16","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Erleichterungen gelten bei ebenerdigen Nutzungseinheiten und niedrigen Gebäudeklassen?","a":"Eingeschossige, zu ebener Erde liegende Nutzungseinheit: kein zweiter Rettungsweg, wenn die Rettung über einen <strong>direkten Ausgang ins Freie</strong> möglich ist (§ 33 Abs. 1 Satz 2). Bei GK 1 und 2 darf die Treppe ohne eigenen Treppenraum ausgeführt werden."},
  {"id":"k-lb23-17","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche ergänzenden Steuerungsinstrumente kennt die MBO für Rettungswege?","a":"Besondere Anforderungen oder Erleichterungen für <strong>Sonderbauten</strong> im Einzelfall (§ 51 MBO) und <strong>Abweichungen</strong> (§ 67 MBO) über Brandschutzkonzept und Kompensation."},
  {"id":"k-lb23-18","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was verlangt § 14 MBO, und durch welche Vorschriften wird er konkretisiert?","a":"Bauliche Anlagen sind so zu errichten, dass der Entstehung eines Brandes und der <strong>Ausbreitung von Feuer und Rauch</strong> vorgebeugt wird und Rettung sowie wirksame Löscharbeiten möglich sind. Konkretisiert durch die <strong>§§ 26 bis 41 MBO</strong>."},
  {"id":"k-lb23-19","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Brandausbreitung: Welche Abstufungen gelten für Baustoffe und Bauteile (§ 26 MBO)?","a":"Baustoffe: nichtbrennbar, schwerentflammbar, normalentflammbar. Bauteile: feuerhemmend (REI 30), hochfeuerhemmend (REI 60), feuerbeständig (REI 90), abgestuft nach <strong>Gebäudeklassen 1 bis 5</strong> (§ 2 Abs. 3)."},
  {"id":"k-lb23-20","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Feuerwiderstandsdauer gilt für tragende Wände, Stützen und Decken je Gebäudeklasse (§§ 27, 31)?","a":"Ausreichend lang standsicher und raumabschließend: <strong>GK 1/2</strong> keine Anforderung (Keller REI 30), <strong>GK 3</strong> REI 30 (Keller REI 90), <strong>GK 4</strong> REI 60, <strong>GK 5</strong> REI 90."},
  {"id":"k-lb23-21","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Was gilt für Außenwände nach § 28 MBO?","a":"Die Ausbreitung von Feuer auf und in den Außenwänden und über Geschosse hinweg muss begrenzt sein. Oberflächen, Dämmstoffe und Bekleidungen mindestens <strong>schwerentflammbar</strong>, bei Fassaden Brandsperren."},
  {"id":"k-lb23-22","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wo sind Trennwände nach § 29 MBO erforderlich, und welche Anforderungen gelten?","a":"Zwischen Nutzungseinheiten, zu Räumen mit erhöhter Brand- oder Explosionsgefahr, im Dachraum und Kellergeschoss. Mindestens REI 30 bzw. wie die tragenden Bauteile des Geschosses, bis zur Rohdecke bzw. Dachhaut geführt; Türen T30."},
  {"id":"k-lb23-23","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wann sind Brandwände nach § 30 MBO erforderlich?","a":"Als <strong>Gebäudeabschlusswand</strong> (Abstand zur Grundstücksgrenze/zu anderen Gebäuden &lt; 2,5 m) und als <strong>innere Brandwand</strong> zur Bildung von Brandabschnitten (i. d. R. ≤ 40 m, landwirtschaftliche Gebäude ≤ 10.000 m³)."},
  {"id":"k-lb23-24","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Bauart und Ausführung haben Brandwände (§ 30 MBO)?","a":"Bauart <strong>REI 90-M</strong> (F 90-A), mindestens <strong>0,30 m über Dach</strong> oder 0,50 m Auskragung, Abstand zu Innenecken ≥ 5 m."},
  {"id":"k-lb23-25","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welchen Beitrag leisten Dächer (§ 32 MBO) und Gebäudeabstände (§ 6 MBO) zum Schutzziel Brandausbreitung?","a":"Dächer: <strong>harte Bedachung</strong> gegen Flugfeuer und strahlende Wärme, Abstände und Brandwandüberstand, Dachaufbauten und Lichtkuppeln mit Abstand. Abstandsflächen zwischen Gebäuden und zu Grundstücksgrenzen wirken als Brandschutzabstand."},
  {"id":"k-lb23-26","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Wie verhindern notwendige Flure und Treppenräume (§§ 35, 36 MBO) die Ausbreitung von Rauch?","a":"Rauchabschnitte ≤ 30 m, Rauchschutztüren, Treppenräume als <strong>Rauch- und Feuerbarriere</strong> und Rauchableitung."},
  {"id":"k-lb23-27","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Öffnungen und Durchführungen müssen für den Brandschutz gesichert werden?","a":"Feuerschutzabschlüsse (T30/T90) und Rauchschutztüren (§ 37), <strong>Abschottungen</strong> von Leitungen und Installationsschächten (§ 40), Lüftungsanlagen mit <strong>Brandschutzklappen</strong> (§ 41), Aufzüge mit feuerwiderstandsfähigen Fahrschächten (§ 39)."},
  {"id":"k-lb23-28","cat":"Laufbahn · Vorbeugender Brandschutz","q":"Welche Maßnahmen ergänzen bei Sonderbauten den baulichen Brandschutz?","a":"Brandschutzkonzept, Löschanlagen, Brandmeldeanlagen sowie Rauch- und Wärmeabzug (<strong>anlagentechnischer Brandschutz</strong>) zur Kompensation oder Erweiterung."},
  {"id":"k-lb23-29","cat":"Laufbahn · Führungsvorgang","q":"Wie beurteilt der S3 die Lage bei einem großflächigen Stromausfall (Lage, Ort, Zeit)?","a":"Lage: Ursache und Dauer zunächst unklar, Wiederversorgung nicht absehbar. Ort: Stadt-/Ausfallgebiet; Zeit: Eintrittszeitpunkt, <strong>Wetter/Jahreszeit</strong> (Kälte, Hitze) beachten. Anlagen (Ausfallgebiet, KRITIS, Einspeisung, Notfallpufferung) auswerten."},
  {"id":"k-lb23-30","cat":"Laufbahn · Führungsvorgang","q":"Welche Gefahren (4A-C-4E) ergeben sich bei einem großflächigen Stromausfall?","a":"Stromabhängige Patienten (Heimbeatmung, Dialyse), Krankenhäuser/Pflege (Notstrom durch Kraftstoff begrenzt), Aufzugseinschlüsse, Verkehr, Trinkwasserdruck und Abwasserpumpen, Kommunikation (<strong>Notruf 112 gefährdet</strong>), Heizung, Kühlketten, Brandgefahr durch Kerzen und Aggregate, CO-Vergiftungen, Sicherheitslage."},
  {"id":"k-lb23-31","cat":"Laufbahn · Führungsvorgang","q":"Wie verläuft ein längerer Stromausfall zeitlich (antizipierter Verlauf)?","a":"<strong>0 bis 6 h</strong> Akutphase; <strong>6 bis 24 h</strong> Notstrom-Pufferzeiten laufen aus, Kraftstoffbedarf, Funk-/Mobilfunkausfall; <strong>24 bis 72 h</strong> Versorgung, Wasser, Pflege, Ablösung; <strong>&gt; 72 h</strong> Eskalation, Kräftenachforderung (Land, THW, Bundeswehr), Katastrophenfall."},
  {"id":"k-lb23-32","cat":"Laufbahn · Führungsvorgang","q":"Was gehört bei der Lagebeurteilung zur eigenen Lage?","a":"Kräfte und Mittel von Feuerwehr, Rettungsdienst und Hilfsorganisationen, ad-hoc verfügbare Rufgruppen, <strong>Eigenversorgung der Feuerwachen</strong> (Notstrom, Kraftstoff), Alarmierung und Funk ohne Netz sowie Personal (Ehrenamt) und Schichtfähigkeit."},
  {"id":"k-lb23-33","cat":"Laufbahn · Führungsvorgang","q":"Wie lautet die Beurteilung der Möglichkeiten beim Stromausfall, und nach welchen Kriterien wird entschieden?","a":"Schwerpunkt <strong>Verteidigung/Sichern</strong> (KRITIS, Notstrom, Kraftstoff) und Rettung (vulnerable Gruppen, Betreuung), kein Angriff; Rückzug nur als Evakuierung einzelner Einrichtungen. Kriterien: Sicherheit, Schnelligkeit, Erfolgsaussicht, Aufwand; Priorisierung nach Wichtigkeit und Autarkiezeit der KRITIS."},
  {"id":"k-lb23-34","cat":"Laufbahn · Führungsvorgang","q":"Welche Ziele und Prioritäten setzt der Entschluss des S3 beim Stromausfall?","a":"1. Leben und Gesundheit (Krankenhäuser, Pflege, Heimbeatmete, Notruf), 2. <strong>Notstrom und Kraftstoff der KRITIS</strong> nach Autarkiezeit, 3. Trink-/Abwasser, 4. Kommunikation und Information, 5. Betreuung/Selbsthilfe, 6. Handlungsfähigkeit der Einsatzkräfte, 7. Sachwerte."},
  {"id":"k-lb23-35","cat":"Laufbahn · Führungsvorgang","q":"Welche Sofortmaßnahmen gehören in den Entschluss des S3?","a":"Führungsorganisation herstellen, Stab einberufen und <strong>Krisenstab (HVB)</strong> anfordern, Einsatzraum gliedern, Bereitstellungsraum, Vollalarm, Kommunikationsplan, <strong>Feststellung des Katastrophenfalls anregen</strong>, Notrufabarbeitung sicherstellen (Wachen als Anlaufstellen)."},
  {"id":"k-lb23-36","cat":"Laufbahn · Führungsvorgang","q":"Wie plant der S3 den Kräfteeinsatz beim Stromausfall?","a":"Feuerwehr (Erkundung, Aggregate, Aufzugsbefreiung), THW (Notstrom, Beleuchtung, Pumpen), RD/HiOrg (Betreuung, Sanität), Polizei (Absperrung, Verkehr). Nachforderung über <strong>Zeitstrahl</strong> (wann wo welche Kräfte) und Nachbarhilfe."},
  {"id":"k-lb23-37","cat":"Laufbahn · Führungsvorgang","q":"Wie bildet der S3 Schwerpunkt und Reserve und regelt Zeit und Kontrolle?","a":"Schwerpunkt: KRITIS mit kürzester Pufferzeit zuerst; eine <strong>taktische Reserve</strong> im Bereitstellungsraum; Ablösung in 12-h-Schichten. Lagebesprechungen alle 2 bis 4 h, Neubewertung bei Lageänderung (Wiederversorgungsprognose des Netzbetreibers)."},
  {"id":"k-lb23-38","cat":"Laufbahn · Führungsvorgang","q":"Wie ist die Einsatzstruktur (Führungsstufe D) beim Stromausfall oben aufgebaut?","a":"Oben <strong>HVB/Krisenstab</strong> (administrativ-organisatorisch) und <strong>Einsatzleitung/Führungsstab</strong> (operativ-taktisch) mit S1 bis S6; der Leiter des Stabes koordiniert."},
  {"id":"k-lb23-39","cat":"Laufbahn · Führungsvorgang","q":"Welche Fachabschnitte bildet die Einsatzstruktur beim Stromausfall?","a":"EA <strong>KRITIS und Notstrom/Kraftstoff</strong>, EA Gesundheit und Pflege, EA Wasser/Abwasser/Umwelt, EA Verkehr/Absperrung (mit Polizei), EA Logistik/Versorgung, EA IuK/Meldewesen."},
  {"id":"k-lb23-40","cat":"Laufbahn · Führungsvorgang","q":"Welche räumlichen Abschnitte und welcher Bereitstellungsraum gehören zur Einsatzstruktur?","a":"EA <strong>Bevölkerungshilfe Nord/Mitte/Süd</strong> (Selbsthilfe-Anlaufstellen/Leuchttürme an Feuerwachen und Gemeindehäusern, Notruf- und Meldestellen, Informationspunkte), Zuschnitt an den Ausrückebereichen. Bereitstellungsraum mit eigener Führung (ELW), Kraftstoff- und Verpflegungszugang."},
  {"id":"k-lb23-41","cat":"Laufbahn · Führungsvorgang","q":"Wie wird die Kommunikation in der Einsatzstruktur beim Stromausfall gesichert?","a":"<strong>Digitalfunk</strong> mit Kanalplan, Rückfallebene Analogfunk, Melder/Meldeköpfe, Leuchttürme als Meldepunkte (S6). Fachberater (Netzbetreiber, Gesundheitsamt, Ärztlicher Leiter RD, THW, Polizei, Bundeswehr) unterstützen im Stab; 30 Minuten vorausdenken."},
  {"id":"k-lb23-42","cat":"Laufbahn · Führungsvorgang","q":"Welches Befehlsschema gilt nach FwDV 100 für die Führung über längere Zeiträume?","a":"<strong>Lage – Auftrag – Durchführung – Versorgung – Führung und Kommunikation.</strong> Das Kurzschema (Einheit/Auftrag/Mittel/Ziel/Weg) gilt dagegen für den Einsatzbefehl im Einzelfall."},
  {"id":"k-lb23-43","cat":"Laufbahn · Führungsvorgang","q":"Was gehört in den Kopf eines schriftlichen Einsatzbefehls?","a":"Befehlende Stelle (z. B. Einsatzleitung/Führungsstab, S3), Abgangsort, <strong>Datum/Uhrzeit</strong>, Verteiler, Anlagen (z. B. Prioritätenliste, Lagekarte, Kanalplan), Unterschrift mit Funktion."},
  {"id":"k-lb23-44","cat":"Laufbahn · Führungsvorgang","q":"Was steht in Lage und Auftrag des Befehls am Beispiel EA KRITIS?","a":"Lage: Stromausfall seit (Zeit), Wiederversorgung ungewiss, KRITIS mit Notstrom-Pufferzeiten, zugeteilte Kräfte (FF-Züge, THW, Tankfahrzeuge). Auftrag: EA KRITIS stellt die <strong>Notstrom- und Kraftstoffversorgung</strong> der priorisierten Objekte ab sofort und bis auf Weiteres sicher."},
  {"id":"k-lb23-45","cat":"Laufbahn · Führungsvorgang","q":"Was steht in der Durchführung des Befehls (Absicht, Aufträge, Zeiten, Schutz)?","a":"Eigene Absicht: zuerst Objekte mit Pufferzeit &lt; 12 h. Aufträge an Einheiten (Erkundung, Aggregate, Betankung), Zusammenarbeit mit Netzbetreiber und S4, Zeitangaben (Beginn, Dauer, <strong>Ablösung 12-h-Schicht</strong>), Schutzmaßnahmen (Elektrofachkraft, CO, Kraftstoffe, Eigenschutz)."},
  {"id":"k-lb23-46","cat":"Laufbahn · Führungsvorgang","q":"Was regeln Versorgung sowie Führung und Kommunikation im Befehl?","a":"Versorgung: Verpflegung, Betriebsstoffe (Kraftstoffdepot), Materialerhaltung, medizinische Versorgung/PSNV-E, Versorgungsstelle und Zeiten. Führung: Digitalfunkkanal, Rückfallebene Analogfunk, Meldekopf, <strong>Lagemeldungen alle 2 h</strong>, Standort des Abschnittsleiters und des Stabes."},
  {"id":"k-lb23-47","cat":"Laufbahn · Führungsvorgang","q":"Wer sind die Empfänger des Befehls, und wie wird er erteilt?","a":"Adressat: Abschnittsleiter EA KRITIS; nachrichtlich Leiter des Stabes, S1, S2, S4, S6, Verbindungsperson Krisenstab, Leiter Bereitstellungsraum, Unterabschnittsleiter. Erteilung als Gesamtbefehl <strong>mündlich vor den Führungskräften und zusätzlich schriftlich</strong> (Nachrichtenvordruck, Einsatztagebuch); vorab Vorbefehl."},
  {"id":"k-lb23-48","cat":"Laufbahn · Führungsvorgang","q":"Was ist mit S1 und S2 vor Beginn der Einsatzabwicklung abzusprechen?","a":"S1: Kräfteübersicht, Alarmierung/Nachalarmierung, Schichtplan und Ablösung (12 h), Reserven, Personal der Anlaufstellen, Spontanhelfer. S2: <strong>einheitliches Lagebild</strong>, Meldewege und -zeiten, Einsatztagebuch, Prognosen des Netzbetreibers, Wetter (DWD)."},
  {"id":"k-lb23-49","cat":"Laufbahn · Führungsvorgang","q":"Was ist mit S4 und S5 abzusprechen?","a":"S4: Kraftstoffbedarf und -priorisierung, Notstromaggregate (THW, Bundeswehr, Baumärkte), Trinkwasser, Verpflegung, Unterkünfte, Beschaffung. S5: <strong>Warnung und Information der Bevölkerung</strong> (Sirenen, Durchsagen, Radio, NINA), Standorte der Anlaufstellen, Bürgertelefon, Falschmeldungen."},
  {"id":"k-lb23-50","cat":"Laufbahn · Führungsvorgang","q":"Was ist mit S6 und dem Leiter des Stabes abzusprechen?","a":"S6: Kommunikationskonzept, Notstrom der Funkstandorte, Kanalplan, Analog-/Satellitenfunk, Notrufabarbeitung. Leiter des Stabes: Prioritäten, Abschnittsgliederung, Nachforderungen, Abstimmung mit Krisenstab (HVB), <strong>Feststellung des Katastrophenfalls</strong>, Ablösung des Stabes."},
  {"id":"k-lb23-51","cat":"Laufbahn · Führungsvorgang","q":"Welche externen Ansprechpartner sind für Energie und KRITIS einzubeziehen?","a":"<strong>Netzbetreiber/Stadtwerke</strong>: Ursache, Dauer, Wiederversorgung, Priorisierung der KRITIS bei Wiederzuschaltung. <strong>KRITIS-Betreiber</strong> (Krankenhäuser, Pflegeheime, Wasser/Abwasser, Telekommunikation, Tankstellen, Handel, Apotheken): Autarkiezeiten, Kraftstoffvorräte, Bedarfe."},
  {"id":"k-lb23-52","cat":"Laufbahn · Führungsvorgang","q":"Welche externen Ansprechpartner kommen aus Gesundheit, Hilfsorganisationen und Sicherheit?","a":"Gesundheit: Gesundheitsamt, Kassenärztliche Vereinigung, Ärztlicher Leiter RD, Krankenhaus-Verbund, Veterinäramt. <strong>DRK, ASB, JUH, MHD</strong> (Betreuung, Verpflegung) und <strong>THW</strong> (Notstrom, Beleuchtung, Pumpen). Polizei und Ordnungsamt (Absperrung, Verkehr, Objektschutz), Verkehrsbetriebe/Bahn."},
  {"id":"k-lb23-53","cat":"Laufbahn · Führungsvorgang","q":"Welche Verwaltungsstellen und höheren Ebenen sind einzubeziehen, und was wird abgesprochen?","a":"Krisenstab/HVB, Sozialamt (Notunterkünfte), Landkreis/Nachbarkommunen, Landesbehörde (Kräftenachforderung), Bundeswehr (Amtshilfe über Kreisverbindungskommando), BBK/Bundesnetzagentur. Inhalt: <strong>Zuständigkeiten, Priorisierung, Erreichbarkeit, Verbindungspersonen, Meldewege, Kostenübernahme</strong>, rechtlicher Rahmen."},
  {"id":"k-lb23-54","cat":"Laufbahn · Recht","q":"Wen binden die Grundrechte nach Art. 1 Abs. 3 GG?","a":"Gesetzgebung, vollziehende Gewalt und Rechtsprechung <strong>unmittelbar</strong>. Sie sind nicht nur individuelle Freiheitsrechte, sondern Grundlage der gesamten Verfassungsordnung."},
  {"id":"k-lb23-55","cat":"Laufbahn · Recht","q":"Welche Funktion haben Grundrechte als Abwehrrechte (status negativus)?","a":"Schutz des Einzelnen vor Eingriffen des Staates; die <strong>Hauptfunktion</strong>. Eingriffe nur bei verfassungsrechtlicher Rechtfertigung (Gesetzesvorbehalt, Art. 19 Abs. 1 GG, Verhältnismäßigkeit). Beispiele: Art. 2 Abs. 2, 4, 5 Abs. 1, 13, 14 GG."},
  {"id":"k-lb23-56","cat":"Laufbahn · Recht","q":"Was bedeutet die Funktion der objektiven Wertordnung?","a":"Grundrechte enthalten Grundentscheidungen für die gesamte Rechtsordnung; sie sind bei Auslegung des einfachen Rechts zu beachten (<strong>Ausstrahlungswirkung</strong>). Folge: mittelbare Drittwirkung im Privatrecht über Generalklauseln (Lüth-Urteil)."},
  {"id":"k-lb23-57","cat":"Laufbahn · Recht","q":"Was folgt aus der Schutzpflichtfunktion der Grundrechte, besonders für die Feuerwehr?","a":"Der Staat muss sich schützend vor Rechtsgüter stellen und sie vor Eingriffen Dritter bewahren (z. B. Leben und Gesundheit, Art. 2 Abs. 2 GG). Daraus folgt die <strong>Pflicht zur Gefahrenabwehr</strong>."},
  {"id":"k-lb23-58","cat":"Laufbahn · Recht","q":"Was sind Teilhabe- und Leistungsrechte (status positivus)? Beispiele?","a":"Anspruch auf gleichberechtigten Zugang zu staatlichen Einrichtungen und Leistungen. Beispiele: gleicher Zugang zu öffentlichen Ämtern (<strong>Art. 33 Abs. 2 GG</strong>), Chancengleichheit im Bildungswesen, effektiver Rechtsschutz (Art. 19 Abs. 4 GG)."},
  {"id":"k-lb23-59","cat":"Laufbahn · Recht","q":"Was sind Mitwirkungsrechte (status activus)? Beispiele?","a":"Teilnahme am demokratischen Willensbildungsprozess, sie legitimieren staatliches Handeln. Beispiele: <strong>Wahlrecht</strong> (Art. 38 Abs. 2 GG), Versammlungs- und Vereinigungsfreiheit (Art. 8, 9 GG), Petitionsrecht (Art. 17 GG)."},
  {"id":"k-lb23-60","cat":"Laufbahn · Recht","q":"Welche ergänzenden Funktionen haben Verfahrens-, Organisations- und Einrichtungsgarantien?","a":"Grundrechte wirken auf Verfahrensgestaltung und Organisation ein; <strong>Institutsgarantien</strong> schützen z. B. Ehe und Familie sowie Eigentum. Ergebnis: Hauptfunktion ist die Abwehrfunktion."},
  {"id":"k-lb23-61","cat":"Laufbahn · Recht","q":"Was bedeutet der Vorrang des Gesetzes?","a":"<strong>„Kein Handeln gegen das Gesetz.“</strong> Die Verwaltung darf nicht gegen bestehende Gesetze und höherrangiges Recht verstoßen. Gilt für jedes Verwaltungshandeln, auch für begünstigende Maßnahmen."},
  {"id":"k-lb23-62","cat":"Laufbahn · Recht","q":"Was bedeutet der Vorbehalt des Gesetzes?","a":"<strong>„Kein Handeln ohne Gesetz.“</strong> Belastende Eingriffe in Freiheit und Eigentum brauchen eine gesetzliche Ermächtigungsgrundlage. Nach der <strong>Wesentlichkeitstheorie</strong> muss der Gesetzgeber alle wesentlichen, grundrechtsrelevanten Entscheidungen selbst treffen."},
  {"id":"k-lb23-63","cat":"Laufbahn · Recht","q":"Woraus leiten sich Vorrang und Vorbehalt des Gesetzes ab?","a":"Vorrang: Rechtsstaatsprinzip, <strong>Art. 20 Abs. 3 GG</strong> (Bindung an Gesetz und Recht). Vorbehalt zusätzlich aus Demokratieprinzip (Art. 20 Abs. 1, 2 GG) und Grundrechten (Gesetzesvorbehalte, z. B. Art. 2 Abs. 2 S. 3, Art. 13 Abs. 2, 7, Art. 19 Abs. 1 GG). Feuerwehr: Eingriffe brauchen eine Befugnis, z. B. § 14 FwG Bln."},
  {"id":"k-lb23-64","cat":"Laufbahn · Recht","q":"Was sind Rechtsverordnungen?","a":"Von der <strong>Exekutive</strong> (Regierung, Minister, Senat) erlassene abstrakt-generelle Rechtsnormen mit Außenwirkung. Materielle Gesetze, im Rang unter den formellen Gesetzen. Abgrenzung: Satzungen setzen Selbstverwaltungskörperschaften, Verwaltungsvorschriften wirken nur intern."},
  {"id":"k-lb23-65","cat":"Laufbahn · Recht","q":"Wer erteilt die Ermächtigung zum Erlass einer Rechtsverordnung?","a":"Der <strong>Gesetzgeber durch ein formelles Gesetz</strong> (Bund: Bundestag/Bundesrat, Land: Abgeordnetenhaus). Ohne Ermächtigungsgesetz gibt es keine Rechtsverordnung (Vorbehalt des Gesetzes, Gewaltenteilung)."},
  {"id":"k-lb23-66","cat":"Laufbahn · Recht","q":"Welche Voraussetzungen stellt Art. 80 Abs. 1 GG an die Ermächtigung?","a":"Ermächtigt werden können Bundesregierung, Bundesminister oder Landesregierungen. <strong>Inhalt, Zweck und Ausmaß</strong> müssen im Gesetz bestimmt sein; die Verordnung nennt die Rechtsgrundlage (Zitiergebot); Subdelegation nur durch Rechtsverordnung."},
  {"id":"k-lb23-67","cat":"Laufbahn · Recht","q":"Welches Beispiel für eine Verordnungsermächtigung nennt die Lösung im Berliner Feuerwehrrecht?","a":"Das FwG Bln ermächtigt die für Inneres zuständige <strong>Senatsverwaltung</strong> zum Erlass von Rechtsverordnungen (Organisation, Werkfeuerwehren). Landesrechtliche Entsprechung zu Art. 80 GG: Art. 64 VvB (bitte prüfen)."},
  {"id":"k-lb23-68","cat":"Laufbahn · Recht","q":"Was ist Ermessen, und woran unterscheidet es sich von der gebundenen Entscheidung?","a":"Handlungsspielraum auf der <strong>Rechtsfolgenseite</strong> einer Norm („kann“, „darf“), auszuüben nach pflichtgemäßem Ermessen (§ 40 VwVfG, § 114 VwGO). Bei „hat“, „muss“, „ist“ liegt eine gebundene Entscheidung vor."},
  {"id":"k-lb23-69","cat":"Laufbahn · Recht","q":"Welche zwei Formen des Ermessens gibt es?","a":"<strong>Entschließungsermessen</strong>: ob die Behörde überhaupt tätig wird (im Gefahrenabwehrrecht Opportunitätsprinzip). <strong>Auswahlermessen</strong>: wie sie tätig wird (Mittelwahl) und gegen wen (Störerauswahl); Schranke ist die Verhältnismäßigkeit."},
  {"id":"k-lb23-70","cat":"Laufbahn · Recht","q":"Welche Ermessensfehler gibt es?","a":"<strong>Ermessensnichtgebrauch</strong> (Ausfall), <strong>Ermessensüberschreitung</strong> (nicht vorgesehene Rechtsfolge), <strong>Ermessensfehlgebrauch</strong> (sachfremde Erwägungen, Verstoß gegen Grundrechte, Gleichheitssatz, Verhältnismäßigkeit)."},
  {"id":"k-lb23-71","cat":"Laufbahn · Recht","q":"Was bedeutet Ermessensreduzierung auf Null?","a":"Der Spielraum schrumpft so weit, dass nur noch <strong>eine einzige Entscheidung</strong> fehlerfrei ist; aus „Können“ wird „Müssen“, der Bürger hat einen Anspruch auf Einschreiten. Typisch: erhebliche, gegenwärtige Gefahr für Leben und Gesundheit; Selbstbindung der Verwaltung (Art. 3 GG)."},
  {"id":"k-lb23-72","cat":"Laufbahn · Recht","q":"Wie wirkt sich die Ermessensreduzierung auf Null beim Feuerwehreinsatz aus?","a":"Droht Menschen im Gebäude <strong>Lebensgefahr</strong>, ist das Entschließungsermessen auf Null reduziert: Die Feuerwehr muss handeln. Nur das Wie bleibt (Auswahlermessen) im Rahmen der Verhältnismäßigkeit."},
  {"id":"k-lb23-73","cat":"Laufbahn · Recht","q":"Welche Voraussetzungen hat die Vollstreckung eines Verwaltungsakts gegen den Willen des Adressaten?","a":"Vollstreckbarer <strong>Grund-VA</strong> mit befehlendem Inhalt (Handlung, Duldung, Unterlassung), unanfechtbar oder ohne aufschiebende Wirkung (Anordnung der sofortigen Vollziehung, § 80 Abs. 2 VwGO), dazu ein richtiges, verhältnismäßiges Zwangsmittel. In Berlin gilt das VwVG des Bundes über § 8 Abs. 1 S. 1 VwVfG Bln."},
  {"id":"k-lb23-74","cat":"Laufbahn · Recht","q":"Welche Zwangsmittel kennt das VwVG, und wann wird welches eingesetzt?","a":"<strong>Ersatzvornahme</strong> bei vertretbaren Handlungen auf Kosten des Pflichtigen (§ 10); <strong>Zwangsgeld</strong> bei unvertretbaren Handlungen, Duldung, Unterlassung, Beugemittel (§ 11); <strong>unmittelbarer Zwang</strong> nur, wenn die anderen Mittel nicht zum Ziel führen (§ 12, § 2 UZwG Bln)."},
  {"id":"k-lb23-75","cat":"Laufbahn · Recht","q":"Wie läuft das gestreckte Vollstreckungsverfahren ab?","a":"<strong>Androhung</strong> (§ 13 VwVG, mit Frist, VA) → <strong>Festsetzung</strong> (§ 14, VA) → <strong>Anwendung</strong> (§ 15, Realakt)."},
  {"id":"k-lb23-76","cat":"Laufbahn · Recht","q":"Wie wird bei Gefahr abgekürzt vollstreckt?","a":"<strong>Sofortiger Vollzug</strong> (§ 6 Abs. 2 VwVG) bzw. <strong>unmittelbare Ausführung</strong> (§ 15 ASOG Bln), wenn der Zweck durch den Verantwortlichen nicht rechtzeitig erreicht werden kann; Androhung und Festsetzung entfallen. Bei Widerstand Vollzugshilfe durch die Polizei (§§ 52 ff. ASOG)."},
  {"id":"k-lb23-77","cat":"Laufbahn · Recht","q":"Ist eine rückwirkende Ernennung eines Beamten möglich, und wo steht das?","a":"Nein: Sie ist unzulässig und <strong>insoweit unwirksam</strong> (§ 8 Abs. 4 BeamtStG). Die Ernennung wirkt frühestens ab <strong>Aushändigung der Urkunde</strong>. Für Bundesbeamte regelt § 10 BBG die Ernennung."},
  {"id":"k-lb23-78","cat":"Laufbahn · Recht","q":"Wie wird eine Ernennung nach BeamtStG geprüft?","a":"(a) Ernennung nach § 8 Abs. 1 (Begründung, Umwandlung, anderes Amt)? (b) Form: <strong>Ernennungsurkunde</strong> mit Zusätzen (§ 8 Abs. 2). (c) Wirksamkeit ab Aushändigung (§ 8 Abs. 4). (d) Zuständige Behörde?"},
  {"id":"k-lb23-79","cat":"Laufbahn · Recht","q":"Wann ist eine Ernennung nichtig, wann wird sie zurückgenommen?","a":"<strong>Nichtigkeit</strong> bei sachlicher Unzuständigkeit oder Formmangel (§ 11 Abs. 1 BeamtStG, Heilung nach Abs. 2). <strong>Rücknahme</strong> bei Täuschung, Zwang usw. (§ 12 BeamtStG). Berliner LBG: Nichtigkeit § 14, Rücknahme § 15."},
  {"id":"k-lb23-80","cat":"Laufbahn · Recht","q":"Warum ist die Ernennung rückwirkend ausgeschlossen, und was folgt im Fall?","a":"Das Beamtenverhältnis ist ein <strong>formgebundenes Statusverhältnis</strong>; Rechtssicherheit verlangt einen eindeutigen Beginn (Schutz vor Manipulation von Besoldung und Versorgung). Die Ernennung gilt ab Aushändigung; bei verzögerter Ernennung ggf. Amtshaftung."},
  {"id":"k-lb23-81","cat":"Laufbahn · Recht","q":"Welche Pflichten regeln §§ 33 und 34 BeamtStG?","a":"§ 33 Abs. 1: Dienst am ganzen Volk, <strong>unparteiische Amtsführung</strong>, Verfassungstreue; Abs. 2: Mäßigung bei politischer Betätigung. § 34: voller persönlicher Einsatz, uneigennützige Aufgabenwahrnehmung, achtungs- und vertrauenswürdiges Verhalten (auch außerdienstlich)."},
  {"id":"k-lb23-82","cat":"Laufbahn · Recht","q":"Welche Pflichten regeln §§ 35 bis 42 BeamtStG?","a":"§ 35: Beratungs-, Unterstützungs- und <strong>Folgepflicht</strong>. § 36: Verantwortung für die Rechtmäßigkeit, Remonstration auf dem Dienstweg. § 37 Verschwiegenheit, § 38 Diensteid, § 40 Nebentätigkeit, § 42 <strong>Verbot der Annahme von Belohnungen und Geschenken</strong>."},
  {"id":"k-lb23-83","cat":"Laufbahn · Recht","q":"Wie wird ein Dienstvergehen nach § 47 BeamtStG geprüft (Schema)?","a":"① Beamtenverhältnis zum Tatzeitpunkt, ② Dienstpflicht und <strong>objektive Pflichtverletzung</strong>, ③ Rechtswidrigkeit, ④ <strong>Verschulden</strong> (Vorsatz oder Fahrlässigkeit, leichte Fahrlässigkeit genügt), ⑤ sonstige Hindernisse (Maßnahmeverbot, Doppelahndung)."},
  {"id":"k-lb23-84","cat":"Laufbahn · Recht","q":"Wann ist ein Verhalten außerhalb des Dienstes ein Dienstvergehen?","a":"Nur, wenn es nach den Umständen in besonderem Maße geeignet ist, das <strong>Vertrauen in einer für das Amt bedeutsamen Weise</strong> zu beeinträchtigen (§ 47 Abs. 1 S. 2 BeamtStG)."},
  {"id":"k-lb23-85","cat":"Laufbahn · Recht","q":"Welche Maßnahmeverbote durch Zeitablauf gelten in Berlin, und was sperrt die Ahndung noch?","a":"Verweis nach <strong>2 Jahren</strong>, Geldbuße und Kürzung nach <strong>3 Jahren</strong>, Zurückstufung nach <strong>7 Jahren</strong>. Sperrwirkung bei bereits unanfechtbarer Strafe oder Geldbuße (Doppelahndungsverbot)."},
  {"id":"k-lb23-86","cat":"Laufbahn · Recht","q":"Welche Disziplinarmaßnahmen kennt das Berliner DiszG, und wie werden sie verhängt?","a":"<strong>Verweis, Geldbuße, Kürzung der Dienstbezüge</strong> (höchstens ein Fünftel, bis zu drei Jahre), <strong>Zurückstufung, Entfernung</strong> aus dem Beamtenverhältnis. Leichte und mittlere Fälle per Disziplinarverfügung (§ 33), schwere nur per Disziplinarklage beim Verwaltungsgericht."},
  {"id":"k-lb23-87","cat":"Laufbahn · Recht","q":"Wann wird ein Disziplinarverfahren eingeleitet, und welche Haftung kommt hinzu?","a":"Von Amts wegen bei <strong>zureichenden tatsächlichen Anhaltspunkten</strong> (Einleitung, Anhörung, Ermittlungen). Bemessung nach Schwere, Persönlichkeitsbild und Vertrauensbeeinträchtigung. Schadensersatz bei Vorsatz/grober Fahrlässigkeit: § 48 BeamtStG."},
  {"id":"k-lb23-88","cat":"Laufbahn · Recht","q":"Darf die Feuerwehr den Keller eines Gewerbes öffnen? Welche Befugnis und welches Grundrecht?","a":"Ja, bei <strong>konkreter Gefahr</strong> (Rauch, Wasser, Gasgeruch, Person in Not). Befugnis: § 14 Abs. 1 FwG Bln (Betreten, Zutritt auch gegen den Willen des Berechtigten); Art. 13 Abs. 7 GG; ergänzend § 36 Abs. 1 Nr. 3 ASOG. Geschäftsräume gelten als „Wohnung“ (§ 36 Abs. 1 S. 2 ASOG)."},
  {"id":"k-lb23-89","cat":"Laufbahn · Recht","q":"Welche Rolle spielen Adressat und Verhältnismäßigkeit beim Öffnen des Gewerbekellers?","a":"Adressat: Verantwortlicher als Verhaltens-/Zustandsstörer (§§ 13, 14 ASOG), sonst Nichtstörer nach § 16 ASOG; bei Nichterreichbarkeit unmittelbare Ausführung (§ 15 ASOG). Erforderlich: zuerst Schlüsselinhaber, Hausmeister, Schlüsseldienst; <strong>zerstörungsarmes Öffnen vor Aufbrechen</strong>. Bei Lebensgefahr Ermessensreduzierung auf Null."},
  {"id":"k-lb23-90","cat":"Laufbahn · Recht","q":"Darf der Keller des Mieters betreten werden, und wer ist Berechtigter?","a":"Der Keller ist Nebenraum der Wohnung, Berechtigter ist der <strong>Mieter</strong> (Besitzer), nicht der Vermieter; dieser kann den Zutritt nicht wirksam gestatten. Zulässig bei konkreter Gefahr, die das Betreten genau dieses Kellers erfordert (Art. 13 Abs. 7 GG, § 14 FwG)."},
  {"id":"k-lb23-91","cat":"Laufbahn · Recht","q":"Welche Grenzen gelten beim Betreten des Mieterkellers?","a":"Nur im <strong>erforderlichen Umfang und Zeit</strong> (keine Nachschau ohne Anlass, keine Durchsuchung), schonendes Vorgehen, Mieter benachrichtigen und möglichst zuziehen. Bei Widerstand Polizei (Vollzugshilfe, §§ 52 ff. ASOG)."},
  {"id":"k-lb23-92","cat":"Laufbahn · Recht","q":"Was ist beim Verlassen der Einsatzstelle zu beachten (Einsatzende, Sicherung, Übergabe)?","a":"Einsatzende erst nach Beseitigung der Gefahr (Nachkontrolle, Restgefahren, Brandwache). <strong>Sichern</strong> geöffneter/beschädigter Zugänge (Notverschluss), Absperrung. <strong>Übergabe nur an Berechtigte</strong>; sonst Polizei/Ordnungsamt informieren; Übergabe dokumentieren."},
  {"id":"k-lb23-93","cat":"Laufbahn · Recht","q":"Was gilt beim Verlassen der Einsatzstelle zu Hinweisen, Entschädigung und Dokumentation?","a":"Betroffene über Zustand, Restgefahren und Nutzungsverbot unterrichten, Eigentümer/Besitzer benachrichtigen. Entschädigung nach <strong>§ 15 FwG i. V. m. §§ 59 bis 65a ASOG</strong>, Amtshaftung § 839 BGB i. V. m. Art. 34 GG; Kostenersatz nur nach § 17 FwG. Einsatzbericht, Fotos, Schäden festhalten."},
  {"id":"k-lb23-94","cat":"Laufbahn · Management","q":"Welche Ziele umfasst das Magische Sechseck der Volkswirtschaft?","a":"<strong>Preisniveaustabilität</strong>, hoher Beschäftigungsstand, außenwirtschaftliches Gleichgewicht, stetiges und angemessenes Wirtschaftswachstum, Umweltschutz/Nachhaltigkeit, gerechte Einkommens- und Vermögensverteilung."},
  {"id":"k-lb23-95","cat":"Laufbahn · Management","q":"Welches Gesetz bildet die Grundlage des Magischen Vierecks, und was ergänzt das Sechseck?","a":"<strong>Stabilitäts- und Wachstumsgesetz (StWG, 1967), § 1</strong>: Erfordernisse des gesamtwirtschaftlichen Gleichgewichts (magisches Viereck). Das Sechseck ergänzt <strong>Umwelt</strong> und <strong>gerechte Verteilung</strong>."},
  {"id":"k-lb23-96","cat":"Laufbahn · Management","q":"Warum ist das Sechseck „magisch“?","a":"Alle Ziele sollen gleichzeitig und dauerhaft erreicht werden, was wegen <strong>Zielkonflikten</strong> (Zielantinomie) praktisch nie gelingt. Die Politik muss gewichten und priorisieren."},
  {"id":"k-lb23-97","cat":"Laufbahn · Management","q":"Nenne Beispiele für Zielkonflikte im Magischen Sechseck.","a":"<strong>Beschäftigung vs. Preisstabilität</strong> (Phillips-Kurve), Wachstum vs. Umweltschutz, Wachstum/Importe vs. außenwirtschaftliches Gleichgewicht, Verteilungsgerechtigkeit vs. Leistungsanreize."},
  {"id":"k-lb23-98","cat":"Laufbahn · Management","q":"Was ist das BIP, und was spricht für seine Verwendung als Maßstab?","a":"Marktwert aller im Inland in einem Zeitraum hergestellten, für die Endverwendung bestimmten Güter und Dienstleistungen. Pro: <strong>international vergleichbar</strong>, regelmäßig und standardisiert erhoben (VGR), gut für Zeitreihen und Konjunkturanalyse."},
  {"id":"k-lb23-99","cat":"Laufbahn · Management","q":"Warum ist das BIP kein perfekter Maßstab (Verteilung, unbezahlte Arbeit, Umwelt)?","a":"Es sagt nichts über <strong>Verteilung/Ungleichheit</strong>; <strong>unbezahlte Arbeit</strong> (Ehrenamt wie Freiwillige Feuerwehr, Hausarbeit, Pflege) und Schwarzarbeit fehlen; Umweltschäden und Ressourcenverbrauch werden nicht abgezogen."},
  {"id":"k-lb23-100","cat":"Laufbahn · Management","q":"Warum ist das BIP kein perfekter Maßstab (Lebensqualität, Schadensbeseitigung, Staatsleistungen)?","a":"Lebensqualität (Gesundheit, Sicherheitsgefühl, Bildung) wird nicht erfasst. <strong>Schadensbeseitigung erhöht das BIP</strong> (Unfälle, Katastrophen, Einsätze), vermiedene Schäden durch Prävention bleiben unsichtbar. Staatsleistungen werden nur zu Kosten bewertet."},
  {"id":"k-lb23-101","cat":"Laufbahn · Management","q":"Welche Maße ergänzen das BIP?","a":"Fazit: Das BIP misst <strong>Wirtschaftsleistung, nicht Wohlstand</strong>. Ergänzend: HDI (Bildung, Lebenserwartung, Einkommen), Genuine Progress Indicator, OECD Better Life Index."},
  {"id":"k-lb23-102","cat":"Laufbahn · Management","q":"Können Überstunden (Mehrarbeit) bei Beamten ausbezahlt werden?","a":"Nur <strong>ausnahmsweise</strong>, wenn Dienstbefreiung aus zwingenden dienstlichen Gründen nicht möglich ist, und im Rahmen der Mehrarbeitsvergütungsverordnung. Vorrang hat der <strong>Freizeitausgleich</strong> (vgl. § 88 BBG: innerhalb eines Jahres bei Mehrarbeit über 5 Stunden im Monat)."},
  {"id":"k-lb23-103","cat":"Laufbahn · Management","q":"Unter welchen Voraussetzungen darf Mehrarbeit angeordnet werden?","a":"Nur bei <strong>zwingenden dienstlichen Verhältnissen</strong> und für temporäre Ereignisse (Krankheitswelle, Großschadenslage, Großveranstaltung), keine Dauerlösung für Personalmangel. Der Abbau muss innerhalb von höchstens 2 Jahren realistisch möglich sein, sonst Organisationsverschulden."},
  {"id":"k-lb23-104","cat":"Laufbahn · Management","q":"Welche Höchstarbeitszeit-Grenzen gelten nach EU-Arbeitszeitrichtlinie 2003/88/EG?","a":"Im Durchschnitt max. <strong>48 Std./Woche</strong> (Bezugszeitraum bis 12 Monate, inkl. Bereitschaft und Überstunden), tägliche Ruhezeit mind. <strong>11 Std.</strong>, wöchentlich mind. 24 Std., Ruhepause nach 6 Std. Überschreitung nur mit individuellem Opt-out."},
  {"id":"k-lb23-105","cat":"Laufbahn · Management","q":"Darf eine Auszahlung die Höchstarbeitszeit legitimieren?","a":"Nein. Bei Überschreitung der 48-Std.-Grenze besteht Anspruch auf <strong>Ausgleich in Freizeit</strong>; Auszahlung löst die Überschreitung nicht. Für Tarifbeschäftigte gelten TVöD-Regelungen (Vergütung bzw. Zeitausgleich)."},
  {"id":"k-lb23-106","cat":"Laufbahn · Management","q":"Welche Ausfallgründe fließen in den Personalausfallfaktor ein?","a":"Urlaub/Sonderurlaub, <strong>Krankheit</strong>, Aus- und Fortbildung, Verwendung außerhalb des Einsatzdienstes, Mutterschutz/Elternzeit und sonstige Gründe. Jede Ausfallstunde erhöht den Personalfaktor."},
  {"id":"k-lb23-107","cat":"Laufbahn · Management","q":"Was gehört nicht in den Personalfaktor?","a":"<strong>Einsatzzeiten</strong> (Arbeitsleistung, keine Ausfallzeit), Stellenzahl/Stellenbesetzungsgrad (das ist der Stellenfaktor), Fahrzeug-/Geräteausfall, Einsatzaufkommen, Gehalt/Besoldung. Feiertage werden bei durchgehendem Schichtdienst nicht gesondert abgezogen."},
  {"id":"k-lb23-108","cat":"Laufbahn · Management","q":"Wie wird der Ist-Personalfaktor berechnet (Rechenweg und Beispiel)?","a":"Theoretische Jahresarbeitszeit minus alle Ausfallstunden = Arbeitsleistung je Mitarbeitenden; <strong>Ist-Personalfaktor = 8.760 h ÷ Arbeitsleistung</strong>. Beispiel Frankfurt 2023: 8.760 ÷ 1.412 = 6,20."},
  {"id":"k-lb23-109","cat":"Laufbahn · Management","q":"Kann ein Personaldefizit durch längere Schichten ausgeglichen werden?","a":"Im Ergebnis <strong>nein</strong>. Längere Schichten verteilen dieselben Stunden nur anders und schaffen keine zusätzlichen Arbeitsstunden; das Stundendefizit bleibt, solange die Wochenarbeitszeit nicht steigt."},
  {"id":"k-lb23-110","cat":"Laufbahn · Management","q":"Welche rechtlichen und arbeitsschutzrechtlichen Grenzen stehen längeren Schichten entgegen?","a":"Durchschnittlich <strong>48 h/Woche</strong>, Ruhezeit mind. 11 h, Ruhepause nach 6 h, Nachtarbeit max. 8 h/24 h. Bereitschaftszeit nur bei Inanspruchnahme unter 50 %. Höheres Unfallrisiko; Personalrat/Mitbestimmung nötig."},
  {"id":"k-lb23-111","cat":"Laufbahn · Management","q":"Welche Kompensationen für ein Personaldefizit sind denkbar (Stellen, Mehrarbeit, Verfügerdienst)?","a":"Zusätzliche <strong>Stellen</strong> schaffen (Personalfaktor als Argument), Recruiting und Ausbildung ausbauen; <strong>Mehrarbeit</strong> nur temporär; Verfügerdienste/Rufbereitschaften und Transferleistungen (Wachpraktikanten, Tagdienstkräfte)."},
  {"id":"k-lb23-112","cat":"Laufbahn · Management","q":"Welche weiteren Kompensationen kommen bei Personaldefiziten in Betracht?","a":"<strong>Ausfallzeiten senken</strong> (Gesundheitsmanagement, Fortbildung planen), Funktionssoll reduzieren nur nach politischem Beschluss (Risikoentscheidung), Aufgaben priorisieren/auslagern, Unterstützung durch Nachbarwehren oder Freiwillige Feuerwehr."},
  {"id":"k-lb23-113","cat":"Laufbahn · Management","q":"Stimmt das? Der Personalfaktor kann nur für rund um die Uhr besetzte Funktionen berechnet werden.","a":"<strong>Falsch.</strong> Der Personalfaktor gilt je Funktion für einen definierten Zeitraum; 24/7 (365 × 24 = 8.760 h) ist der Regelfall im Einsatzdienst, aber keine Voraussetzung. Bei anderer Besetzungszeit (z. B. Tagdienst) wird die jeweilige Jahresbesetztzeit zugrunde gelegt."},
  {"id":"k-lb23-114","cat":"Laufbahn · Management","q":"Wie wird der Personalfaktor bei Bereitschaftsdisponenten der Leitstelle berechnet?","a":"Dispositionstische (rund um die Uhr) mit Standardberechnung; <strong>Bereitschaftsdisponenten</strong> über Tisch- und Bereitschaftszeiten einer Woche, umgerechnet auf 24-h-Funktionen. Funktionsgruppen mit unterschiedlichen Einflussfaktoren getrennt berechnen."},
  {"id":"k-lb23-115","cat":"Laufbahn · Management","q":"Wie heißen die 4 Phasen des Regelkreises im Qualitätsmanagement?","a":"<strong>PDCA-Zyklus</strong> (Deming-Kreis): <strong>Plan</strong> (planen), <strong>Do</strong> (umsetzen), <strong>Check</strong> (überprüfen), <strong>Act</strong> (standardisieren, verbessern). Kontinuierlicher Verbesserungsprozess."},
  {"id":"k-lb23-116","cat":"Laufbahn · Management","q":"Was geschieht in den einzelnen PDCA-Phasen?","a":"Plan: Problem analysieren, Ziele setzen. Do: Lösung umsetzen, zunächst im Pilotmaßstab. Check: <strong>Soll-Ist-Vergleich</strong>, Kennzahlen. Act: erfolgreiche Lösung standardisieren, sonst neuer Zyklus. Beispiel: Einsatznachbereitung, Fortschreibung des Brandschutzbedarfsplans."},
  {"id":"k-lb23-117","cat":"Laufbahn · Management","q":"Nenne 6 Kennzahlen zur Steuerung einer Abteilung.","a":"<strong>Hilfsfristerreichungsgrad</strong>, Ausrückezeit, Kosten je Einsatz, Krankenquote bzw. Ist-Personalfaktor, Budgetstand (Plan-Ist-Vergleich), Abarbeitungsgrad der BEP-Maßnahmen."},
  {"id":"k-lb23-118","cat":"Laufbahn · Management","q":"Welche weiteren Kennzahlen eignen sich, und was gilt für Verhältniskennzahlen?","a":"Fahrzeugverfügbarkeitsquote, Quote unbesetzter Stellen, Bearbeitungszeit von Stellungnahmen, Anteil rechtzeitig angenommener Notrufe, Überstundenstand. <strong>Verhältniskennzahlen</strong> eignen sich besser für Benchmarking; eine Zeitreihe ist das beste Argument in der Ressourcenverteilung."},
  {"id":"k-lb23-119","cat":"Laufbahn · Management","q":"Nenne 4 Ziele des Qualitätsmanagements.","a":"① <strong>Erwartungen der Stakeholder</strong> erfüllen, ② Leistungsqualität sichern und kontinuierlich verbessern, ③ <strong>Wirtschaftlichkeit und Effizienz</strong>, ④ Transparenz, Prozess- und Rechtssicherheit (Prozesse beschreiben, Leistung messbar machen). Ergänzend: Mitarbeiterzufriedenheit."},
  {"id":"k-lb23-120","cat":"Laufbahn · Management","q":"Welche unterschiedlichen Interessen bestehen bei der Bedarfsplanung?","a":"Feuerwehr: <strong>hohes Schutzniveau</strong>, Personal, Fahrzeuge. Politik/Kämmerei: <strong>Kosten</strong>, Haushaltslage, Pflichtaufgabe. Bürger und Wirtschaft: schnelle Hilfe bei niedrigen Gebühren. Personalvertretung: Arbeitszeit, Gesundheitsschutz; Aufsichtsbehörde: Gesetzmäßigkeit."},
  {"id":"k-lb23-121","cat":"Laufbahn · Management","q":"Wie wird der Zielkonflikt Sicherheit versus Kosten in der Bedarfsplanung ausgeglichen?","a":"Über <strong>politisch legitimierte Schutzziele</strong> und Stakeholder-Management. Im Rettungsdienst treten Krankenkassen als Kostenträger mit dem Wirtschaftlichkeitsgebot hinzu."},
  {"id":"k-lb23-122","cat":"Laufbahn · Management","q":"Welche Themenfelder und Leitfragen hat die Bedarfsplanung (Schutzziele, Risiko, IST-SOLL)?","a":"① <strong>Schutzziele</strong> (z. B. AGBF: 10 Funktionen in 8 min, 6 weitere nach 5 min, 90 %), ② Gefährdungs- und Risikoanalyse mit Szenarien, ③ <strong>IST-Analyse und SOLL-IST-Vergleich</strong>."},
  {"id":"k-lb23-123","cat":"Laufbahn · Management","q":"Welche weiteren Themenfelder gehören zur Bedarfsplanung (Organisation bis Fortschreibung)?","a":"④ Organisation, Standorte, Fahrzeuge, Personal, Ausbildung, Leitstelle; ⑤ <strong>Maßnahmenplan und Finanzierung</strong> mit Priorisierung; ⑥ Umsetzung, Controlling, <strong>Fortschreibung ca. alle 5 Jahre</strong> (Kennzahl: BEP-Maßnahmen in %)."},
  {"id":"k-lb23-124","cat":"Laufbahn · Management","q":"Wie läuft die Feuerwehrbedarfsplanung (BEP) ab, und wer ist Träger?","a":"Träger ist die <strong>Gemeinde</strong> (Brandschutzgesetze der Länder), Beschluss durch den Rat. Ablauf: Schutzziel → IST-Analyse → SOLL-IST-Vergleich → Maßnahmenplan; Fortschreibung ca. alle 5 Jahre. Quantitative Methodik, Finanzierung aus dem kommunalen Haushalt."},
  {"id":"k-lb23-125","cat":"Laufbahn · Management","q":"Wie unterscheidet sich die Rettungsdienstbedarfsplanung (Rechtsgrundlage, Akteure, Finanzierung)?","a":"Landesrettungsdienstgesetze und SGB V (<strong>Wirtschaftlichkeitsgebot § 12</strong>); Aufgabenträger Kreis/kreisfreie Stadt. Verhandlung mit den Kostenträgern (Krankenkassen), Schiedsstelle bei Nichteinigung; Finanzierung über <strong>Entgelte der Kassen</strong>."},
  {"id":"k-lb23-126","cat":"Laufbahn · Management","q":"Welche Planungsgrößen gelten in der Rettungsdienstbedarfsplanung?","a":"Hilfsfrist <strong>10 bis 15 min</strong>, Erreichungsgrad 90 bis 95 %. RTW risikoabhängig (Erlang-B, Blockierungswahrscheinlichkeit 1 bis 5 %), <strong>KTW frequenzabhängig</strong> (Auslastung max. 75 %), NEF risikoabhängig. Quantitative Methodik."},
  {"id":"k-lb23-127","cat":"Laufbahn · Management","q":"Wie unterscheidet sich die Katastrophenschutzbedarfsplanung (Methodik und Zuständigkeit)?","a":"<strong>Qualitative Methodik</strong>: sehr seltene Ereignisse, keine statistisch belastbare Häufigkeit; Szenarien statt Einsatzstatistik. Zuständig: untere KatS-Behörde (Landkreis/kreisfreie Stadt), Land und Bund. Überörtliche Zusammenarbeit."},
  {"id":"k-lb23-128","cat":"Laufbahn · Management","q":"Wie läuft die KatS-Bedarfsplanung ab, und was kennzeichnet ihre Einheiten?","a":"<strong>5 Phasen</strong>: Brainstorming → Szenarienauswahl (ca. 5, Risikomatrix, Delphi) → Folgenbetrachtung → Planungsziele → Maßnahmenableitung. Großzügigere Eintreffzeiten, modulare multifunktionale Einheiten, Dual-Use, Wechselladerkonzepte, Querschnittsfunktionen."},
  {"id":"k-lb23-129","cat":"Laufbahn · Management","q":"Welche Gemeinsamkeiten haben Feuerwehr-, Rettungsdienst- und KatS-Bedarfsplanung?","a":"<strong>Strukturqualität</strong> als Ausgangspunkt, IST-Analyse, Risiko-/Szenariobetrachtung, GIS-gestützte Standortplanung, Maßnahmenplan mit Priorisierung und Abstimmung mit dem Haushalt."},
  {"id":"k-lb23-130","cat":"Laufbahn · Heyrothsberge","q":"Anhand welcher vier Prüfschritte wird ein vorgelegtes Feedback analysiert?","a":"<strong>Form</strong> (Ich- oder Du-Botschaft?), <strong>Inhalt</strong> (konkrete Beobachtung oder pauschale Bewertung?), <strong>Struktur</strong> (Positives und Entwicklungsfeld, Feedback-Burger, Änderungswunsch?), <strong>Situation</strong> (zeitnah, unter vier Augen, Rahmen passend?)."},
  {"id":"k-lb23-131","cat":"Laufbahn · Heyrothsberge","q":"Welche typischen Schwächen hat ein schlechtes Feedback?","a":"Pauschal, wertend statt beschreibend, <strong>Person statt Verhalten</strong> kritisiert, Vorwürfe („immer“, „nie“), Rechtfertigungszwang, keine Lösung, zu spät, vor Dritten, Sandwich nur als Floskel."},
  {"id":"k-lb23-132","cat":"Laufbahn · Heyrothsberge","q":"Wie gibt man ein besseres Feedback (Regeln für den Feedback-Geber)?","a":"<strong>Ich-Botschaft</strong>, sachlich, kurz, konstruktiv (Feedback-Burger), neutral und authentisch. Beobachten statt bewerten, Verhalten statt Person, Verallgemeinerungen vermeiden, zeitnah; Kritik unter vier Augen, öffentlich nur Lob."},
  {"id":"k-lb23-133","cat":"Laufbahn · Heyrothsberge","q":"Welche drei Schritte hat ein gutes Feedback, und wie verhält sich der Feedback-Nehmer?","a":"① <strong>Beobachtung</strong> („Ich habe beobachtet, dass …“), ② <strong>Wirkung</strong> („Das wirkt auf mich …“), ③ <strong>Wunsch</strong> („Ich wünsche mir künftig …“). Nehmer: ruhig zuhören, annehmen, nicht rechtfertigen, Sach- und Menschenebene trennen, bedanken."},
  {"id":"k-lb23-134","cat":"Laufbahn · Heyrothsberge","q":"Woran erkennt man die fünf Ich-Zustände in einer Äußerung?","a":"<strong>kEL</strong> Vorwurf, Befehl, „immer/nie“; <strong>fEL</strong> „Ich helfe dir“, „lass mal, ich mache das“; <strong>ER</strong> sachlich, Fakten, Fragen; <strong>nK</strong> spontan, Gefühle, Wünsche; <strong>aK</strong> fügsam, Rechtfertigung, trotzig-rebellisch."},
  {"id":"k-lb23-135","cat":"Laufbahn · Heyrothsberge","q":"Wie ordnet man Ich-Zustände einem Gespräch zu (Vorgehen mit Beispiel)?","a":"Je Satz fragen: <strong>Wer spricht, und wen spricht er an?</strong> Beispiel: „Schon wieder ist der Bericht zu spät!“ = kEL; „Ich konnte nichts dafür …“ = aK; „Wann können Sie ihn liefern?“ = ER."},
  {"id":"k-lb23-136","cat":"Laufbahn · Heyrothsberge","q":"Was zeigt die Auswertung kEL → aK im Vergleich zu ER ↔ ER?","a":"kEL → aK ist komplementär, birgt aber <strong>Eskalationsgefahr</strong>; ER ↔ ER ist das Ziel. Eine bewusst gekreuzte Transaktion (Wechsel ins ER) kann die kEL-aK-Schleife durchbrechen."},
  {"id":"k-lb23-137","cat":"Laufbahn · Heyrothsberge","q":"Wie füllt man das Drama-Dreieck (Karpman) aus: Rollen und Merkmale?","a":"<strong>Verfolger</strong>: kritisiert, wertet ab („Ich bin OK – Du nicht“). <strong>Opfer</strong>: hilflos, verweigert Eigenverantwortung, sucht Retter. <strong>Retter</strong>: hilft ungefragt, hält das Opfer abhängig. Rollenwechsel jederzeit möglich."},
  {"id":"k-lb23-138","cat":"Laufbahn · Heyrothsberge","q":"Wie ordnet man das Drama-Dreieck dem Beispiel zu, und wie steigt man aus?","a":"Beispiel: Chef = <strong>Verfolger</strong>, Mitarbeiter = <strong>Opfer</strong>, Kollege = <strong>Retter</strong>. Ausstieg: aus dem Erwachsenen-Ich handeln, Eigenverantwortung zurückgeben, Hilfe nur auf Bitte, Verantwortung klären."},
  {"id":"k-lb23-139","cat":"Laufbahn · Heyrothsberge","q":"Was ist Game-based Learning, und wie grenzt es sich von Gamification ab?","a":"Lernen mit Spielen (digital oder analog), bei dem das <strong>Spiel selbst das Lernmedium</strong> ist. Gamification dagegen nutzt Spielelemente (Punkte, Ranglisten) in Nicht-Spiel-Kontexten."},
  {"id":"k-lb23-140","cat":"Laufbahn · Heyrothsberge","q":"Welche Vorteile hat Game-based Learning?","a":"Hohe <strong>Motivation</strong> und Aktivierung, Handlungsorientierung (Fehler erlaubt), sofortiges Feedback und Erfolgserlebnisse, Teamarbeit und Entscheidungen unter Zeitdruck, nachhaltigeres Behalten, selbstgesteuertes Lernen."},
  {"id":"k-lb23-141","cat":"Laufbahn · Heyrothsberge","q":"Nenne Beispiele und Grenzen von Game-based Learning.","a":"Beispiele: Quizspiele (Kahoot), <strong>Planspiele und Stabsübungen</strong>, Serious Games/VR-Simulatoren, Escape-Room für Brandschutz oder Erste Hilfe. Grenzen: Vorbereitungsaufwand, Wettbewerb kann demotivieren, klares Lernziel und Debriefing nötig."},
  {"id":"k-lb23-142","cat":"Laufbahn · Heyrothsberge","q":"Mitarbeitende diskreditieren den neuen Abteilungsleiter: Welche Konfliktarten nach Beteiligten liegen vor?","a":"Hauptart: <strong>Personen-Gruppen-Konflikt</strong> (Leiter gegen Mitarbeitergruppe). Möglich zudem Intra-Gruppen-Konflikt (Befürworter und Gegner), interpersonale Konflikte mit Wortführern und intrapersonaler Konflikt beim Leiter."},
  {"id":"k-lb23-143","cat":"Laufbahn · Heyrothsberge","q":"Welche Konfliktursachen liegen beim diskreditierten Abteilungsleiter vor?","a":"Vorrangig <strong>Beziehungskonflikt</strong> (Verletzung des Selbstwerts), dazu Bewertungskonflikt (Werte, Führungsstil) und evtl. Beurteilungskonflikt (Informationsstand zur Auswahlentscheidung, interner Mitbewerber)."},
  {"id":"k-lb23-144","cat":"Laufbahn · Heyrothsberge","q":"Welcher Konflikttyp und welche Eskalationsstufe nach Glasl liegt beim Diskreditieren vor?","a":"Diskreditieren hinter dem Rücken ist ein <strong>kalter (verdeckter) Konflikt</strong>; offener Widerstand macht ihn heiß, wahrscheinlich Übergang kalt → heiß. Etwa <strong>Glasl-Stufe 3 bis 5</strong>; ab Stufe 4 externe Moderation."},
  {"id":"k-lb23-145","cat":"Laufbahn · Heyrothsberge","q":"Wie sieht der Lösungsansatz bei diesem Konflikt aus (Schritte 1 bis 3)?","a":"① Konflikt erkennen und <strong>früh handeln</strong>, ② Analyse (Ursachen, Wortführer, Eskalationsstufe), ③ Einzelgespräche mit aktivem Zuhören, Ich-Botschaften und Erwachsenen-Ich, Sach- und Beziehungsebene trennen."},
  {"id":"k-lb23-146","cat":"Laufbahn · Heyrothsberge","q":"Wie sieht der Lösungsansatz bei diesem Konflikt aus (Schritte 4 und 5)?","a":"④ Klärendes <strong>Gruppengespräch mit Moderation</strong> (Personalrat, Personalentwicklung, ggf. Mediator), Win-win-Ziel. ⑤ Vereinbarungen schriftlich, Nachverfolgung; bei fortgesetzter Diskreditierung <strong>B4-Regel</strong> (Beobachten – Belehren – Beobachten – Bestrafen)."},
  {"id":"k-lb23-147","cat":"Laufbahn · Heyrothsberge","q":"Variante A der perspektivischen Lösungen: Beziehungsarbeit und Teamentwicklung?","a":"Kooperativ, langfristig: Antrittsgespräche mit jedem, <strong>Teamklausur/Workshop</strong>, Quick Wins, Coaching für den Leiter, Feedback. Chance: nachhaltiger Vertrauensaufbau; Risiko: braucht Zeit."},
  {"id":"k-lb23-148","cat":"Laufbahn · Heyrothsberge","q":"Variante B der perspektivischen Lösungen: strukturierte Konfliktklärung mit Dritten?","a":"<strong>Externe Moderation/Mediation</strong>, klare Verhaltensregeln, Zielvereinbarung; bei Fortsetzung Konsequenzen (Ermahnung, Umsetzung). Chance: schnelle Befriedung; Risiko: Akzeptanz, Gesichtsverlust, Aufwand. Prävention: strukturierte Einarbeitung, Vorgesetzter stärkt den Neuen."},
  {"id":"k-lb23-149","cat":"Laufbahn · Heyrothsberge","q":"Welche Transaktionstypen unterscheidet die Transaktionsanalyse, und welches Konfliktpotenzial hat ER ↔ ER?","a":"<strong>Komplementär, gekreuzt, verdeckt</strong> (Berne). Komplementär ER ↔ ER (Einsatzleiter fragt, Gruppenführer antwortet sachlich): Konfliktpotenzial <strong>gering</strong>, Kommunikation läuft unbegrenzt weiter."},
  {"id":"k-lb23-150","cat":"Laufbahn · Heyrothsberge","q":"Welches Konfliktpotenzial hat die komplementäre Transaktion kEL → aK?","a":"Reibungslos, aber <strong>mittel/latent</strong>: Abhängigkeit, Unterwürfigkeit, Frust, Rebellion, Eskalationsschleife; Drama-Dreieck Verfolger–Opfer. Beispiel: „Das haben Sie wieder falsch gemacht!“ – „Entschuldigung, kommt nicht wieder vor.“"},
  {"id":"k-lb23-151","cat":"Laufbahn · Heyrothsberge","q":"Welches Konfliktpotenzial hat eine gekreuzte Transaktion?","a":"<strong>Hoch</strong>: Die Antwort kommt aus unerwartetem Zustand, Kommunikationsabbruch und Streit drohen. Bewusst eingesetzt kann sie eine kEL → aK-Schleife durchbrechen."},
  {"id":"k-lb23-152","cat":"Laufbahn · Heyrothsberge","q":"Welches Konfliktpotenzial hat eine verdeckte Transaktion, und was ist das Ziel?","a":"<strong>Hoch</strong> durch Manipulation, Psychospiele, Missverständnisse (sozial ER, psychologisch kEL). Ziel: aus dem ER führen, Grundposition <strong>„Ich bin OK – Du bist OK“</strong>."},
  {"id":"k-lb23-153","cat":"Laufbahn · Heyrothsberge","q":"Welche fünf Antreiber nennt Taibi Kahler, und was sind sie?","a":"<strong>Sei gefällig! – Sei perfekt! – Sei stark! – Beeil dich! – Streng dich an!</strong> Unbewusste Glaubenssätze aus der Kindheit, die das Verhalten unter Stress steuern."},
  {"id":"k-lb23-154","cat":"Laufbahn · Heyrothsberge","q":"Antreiber „Sei perfekt!“, „Sei stark!“, „Beeil dich!“: Risiko und Erlauber?","a":"Perfekt: Fehlerangst, Überkontrolle → „Ich darf Fehler machen“ / „Gut ist gut genug“. Stark: Schwächen verbergen → „Ich darf Gefühle zeigen und um Hilfe bitten“. Beeil dich: Zeitdruck → „Ich darf mir Zeit nehmen“."},
  {"id":"k-lb23-155","cat":"Laufbahn · Heyrothsberge","q":"Wie befreit man sich von Antreibern (Schritte 1 bis 3)?","a":"① <strong>Erkennen</strong> (Selbstreflexion, Antreibertest, Durchschnitt 16 auf Skala 0–32), ② <strong>Verstehen</strong> (Herkunft, frühere Schutzfunktion), ③ <strong>Erlauber</strong> formulieren und täglich einüben."},
  {"id":"k-lb23-156","cat":"Laufbahn · Heyrothsberge","q":"Wie befreit man sich von Antreibern (Schritte 4 und 5)?","a":"④ <strong>Verhalten ändern</strong> (Delegation, Pausen, Priorisierung nach Eisenhower, „Nein“ üben, Feedback, ggf. Coaching), ⑤ <strong>Ressourcen stärken</strong> (Stressmanagement, Achtsamkeit, Erwachsenen-Ich aktivieren)."},
  {"id":"k-lb23-157","cat":"Laufbahn · Heyrothsberge","q":"Was ist nach einem belastenden Einsatz leiblich und durch die Führungskraft zu tun?","a":"Leiblich: Getränke, Essen, Wärme/Wechselkleidung, Ruhe, Dekontamination, Rotation, Wiederherstellung der Einsatzbereitschaft. Führungskraft: Belastung erkennen (Rückzug, Schweigen), <strong>Einsatznachbesprechung</strong>, Wertschätzung, Kontakt anbieten."},
  {"id":"k-lb23-158","cat":"Laufbahn · Heyrothsberge","q":"Aus welchen drei Schritten besteht die Demobilisation?","a":"<strong>Rekonstruieren</strong> (Ablauf chronologisch), <strong>Normalisieren</strong> („solche Reaktionen sind typisch“), <strong>Aktivieren</strong> (eigene Bewältigungsstrategien, gruppeninterne Unterstützung, Einladung zum Defusing/Nachsorge)."},
  {"id":"k-lb23-159","cat":"Laufbahn · Heyrothsberge","q":"Welche Rolle haben PSNV-Kräfte, und was bedeutet BELLA?","a":"PSNV-E-Kräfte (sekundäre PSNV) hinzuziehen; Einzelgespräch nach <strong>BELLA</strong>: Beziehung aufbauen – Erfassen – Linderung – Leute einbeziehen – Ansatz zur Problembewältigung. Dazu Beratungsangebote, Nachsorge nach Tagen; bei Großlagen ca. <strong>30 %</strong> der Betroffenen als PSNV-Kräfte alarmieren."},
  {"id":"k-lb23-160","cat":"Laufbahn · Heyrothsberge","q":"Nenne vier PSNV-erforderliche Einsatzsituationen.","a":"Tod oder schwere Verletzung eines <strong>Kollegen</strong>; Einsätze mit toten oder schwerverletzten <strong>Kindern</strong>; Großschadenslagen/MANV, Terroranschläge; Suizid, frustrane Reanimation, Brand mit Todesopfern, Einsatz mit persönlichem Bezug."},
  {"id":"k-lb23-161","cat":"Laufbahn · Heyrothsberge","q":"Welche vier Reaktionsebenen der Belastungsreaktion gibt es?","a":"<strong>Körperlich</strong> (Herzrasen, Zittern, Schlafstörungen), <strong>emotional</strong> (Angst, Trauer, Wut, Schuld), <strong>kognitiv</strong> (Konzentrationsstörungen, Grübeln, Intrusionen), <strong>Verhalten/sozial</strong> (Rückzug, Reizbarkeit, Vermeidung, erhöhter Konsum)."},
  {"id":"k-lb23-162","cat":"Laufbahn · Heyrothsberge","q":"Welche präventiven Maßnahmen gibt es gegen Einsatzbelastung (Struktur und Kultur)?","a":"Aus- und Fortbildung (Stresstraining, realitätsnahe Übungen), Information über Belastungsreaktionen vorab, <strong>PSNV-Strukturen</strong> (Beauftragte, Peers, Meldewege), offene Teamkultur ohne Stigma."},
  {"id":"k-lb23-163","cat":"Laufbahn · Heyrothsberge","q":"Welche weiteren präventiven Maßnahmen gibt es (BGM, Taktik, Nachsorge)?","a":"<strong>BGM</strong>: Gefährdungsbeurteilung psychischer Belastung (§ 5 ArbSchG), EAP, Sport, Schlaf, Resilienztraining. Einsatztaktik: Rotation, begrenzte Dauer, Pausen. Regelmäßige Nachbesprechungen auch bei normalen Einsätzen, Betriebsarzt."},
  {"id":"k-lb23-164","cat":"Laufbahn · Heyrothsberge","q":"Was ist beim erstmaligen Auftreten eines alkoholisierten Mitarbeiters sofort zu tun?","a":"Wahrnehmung sachlich feststellen, möglichst mit <strong>Zeugen</strong> und Dokumentation (Datum, Uhrzeit, Beobachtungen, keine Diagnosen). Mitarbeiter <strong>vom Dienst abziehen</strong>, keine Fahrt allein nach Hause, bei Gefahr Rettungsdienst."},
  {"id":"k-lb23-165","cat":"Laufbahn · Heyrothsberge","q":"Welcher Rechtsrahmen gilt beim alkoholisierten Mitarbeiter?","a":"Nicht dienstfähig; Verstoß gegen Dienstpflichten (Beamte u. a. § 34 BeamtStG) und gegen die Unfallverhütungsvorschrift (<strong>DGUV Vorschrift 1</strong>). Beim Erstauftreten steht die <strong>Fürsorge</strong> im Vordergrund, Konsequenzen nach Dienststellenregelung prüfen."},
  {"id":"k-lb23-166","cat":"Laufbahn · Heyrothsberge","q":"Wie läuft das klärende Gespräch und der Stufenplan beim Alkoholproblem ab?","a":"Zeitnah, nüchtern, unter vier Augen: Beobachtungen konkret benennen (Ich-Botschaften, keine Diagnose „Alkoholiker“), Erwartung (kein Alkohol im Dienst) und <strong>Hilfsangebot</strong> (Betriebsarzt, Suchtbeauftragte, EAP). Folgegespräch; bei Wiederholung <strong>Stufenplan</strong> mit zunehmender Verbindlichkeit, Vertraulichkeit, Personalrat."},
  {"id":"k-lb23-167","cat":"Laufbahn · Heyrothsberge","q":"Was bedeutet riskanter Alkoholkonsum?","a":"Menge/Häufigkeit über der Grenze mit geringem Gesundheitsrisiko, <strong>ohne Abhängigkeit</strong>. Orientierungswerte (DHS): Frauen ab ca. 12 g, Männer ab ca. 24 g Reinalkohol pro Tag; Rauschtrinken; weniger als zwei alkoholfreie Tage pro Woche. Es gibt keine völlig risikofreie Menge."},
  {"id":"k-lb23-168","cat":"Laufbahn · Heyrothsberge","q":"Was bedeutet Abhängigkeit (ICD-10/11)?","a":"Mindestens <strong>3 Kriterien in 12 Monaten</strong>: starker Konsumwunsch, Kontrollverlust, Entzugssymptome, Toleranzentwicklung, Vernachlässigung anderer Interessen, Konsum trotz Schäden. Krankheit, kein Charakterfehler; Behandlung nötig."},
  {"id":"k-lb23-169","cat":"Laufbahn · Heyrothsberge","q":"Welche Warnzeichen am Arbeitsplatz deuten auf ein Alkoholproblem hin?","a":"Fehlzeiten (montags), Leistungsschwankungen, Zittern, Fahne, Rückzug, Stimmungsschwankungen, Verheimlichen."},
  {"id":"k-lb23-170","cat":"Laufbahn · Heyrothsberge","q":"Was ist aktives Zuhören?","a":"Gesprächstechnik nach <strong>Carl Rogers</strong>: volle Aufmerksamkeit und Prüfen, ob Inhalt und Gefühl richtig verstanden wurden. Im Suchtgespräch Voraussetzung für die Annahme von Hilfe."},
  {"id":"k-lb23-171","cat":"Laufbahn · Heyrothsberge","q":"Aus welchen Elementen besteht aktives Zuhören?","a":"Blickkontakt und zugewandte Haltung, <strong>ausreden lassen</strong>, <strong>Paraphrasieren</strong> („Wenn ich Sie richtig verstehe …“), Gefühle verbalisieren, offene Fragen, Zusammenfassen, Pausen aushalten, Ich-Botschaften, keine Ratschläge."},
  {"cat":"IBK · Transaktionsanalyse","q":"Wer entwickelte die Transaktionsanalyse und was ist ihr Ziel?","a":"<strong>Eric Berne.</strong> Psychologische Theorie der Persönlichkeit und des zwischenmenschlichen Verhaltens. Ziel: bewusste Kommunikation, bessere Beziehungen, Konfliktlösung und individuelle Autonomie.","id":"k-ibk-01"},
  {"cat":"IBK · Transaktionsanalyse","q":"Aus welchen sieben Bestandteilen besteht die TA?","a":"<strong>Strukturanalyse</strong> (Was geht in mir vor?), <strong>Transaktionsanalyse</strong> (Was geht zwischen uns vor?), <strong>Grundbedürfnisse</strong>, <strong>Grundeinstellungen</strong>, <strong>Spielanalyse</strong>, <strong>Antreiber</strong>, <strong>Skriptanalyse</strong>.","id":"k-ibk-02"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was bezeichnet man als „Transaktion“?","a":"Die <strong>Grundeinheit aller sozialen Verbindungen</strong>: die Interaktion, wenn sich zwei oder mehr Menschen begegnen. Entscheidend ist, aus welchen Ich-Zuständen heraus kommuniziert wird.","id":"k-ibk-03"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Grundannahmen gelten in der TA über den Menschen?","a":"Jeder Mensch kann denken und Probleme lösen, ist in seiner Ganzheit in Ordnung, kann <strong>Verantwortung</strong> für sein Leben übernehmen und sein Lebenskonzept konstruktiv gestalten.","id":"k-ibk-04"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche drei Ich-Zustände unterscheidet die Strukturanalyse?","a":"<strong>Eltern-Ich</strong> (übernommene Werte und Regeln), <strong>Erwachsenen-Ich</strong> (rational, objektiv), <strong>Kind-Ich</strong> (emotional, impulsiv).","id":"k-ibk-05"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche fünf Ich-Zustände sind an einer Transaktion beteiligt (Funktionsmodell)?","a":"<strong>Kritisches Eltern-Ich</strong>, <strong>fürsorgliches Eltern-Ich</strong>, <strong>Erwachsenen-Ich</strong>, <strong>natürliches Kind-Ich</strong>, <strong>angepasstes Kind-Ich</strong>.","id":"k-ibk-06"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was zeigt das Egogramm?","a":"Es stellt grafisch dar, <strong>wie stark und wie oft</strong> eine Person die einzelnen funktionellen Ich-Zustände nutzt. Werkzeug zur Selbstreflexion und Verhaltensänderung.","id":"k-ibk-07"},
  {"cat":"IBK · Transaktionsanalyse","q":"Kritisches Eltern-Ich: Vorteile und Nachteile bei starker Ausprägung?","a":"Vorteil: entscheidet in <strong>Notsituationen rasch</strong>, legt Wert auf Tradition und Norm. Nachteil: lehnt Neues ab, intolerant, unterdrückend, überkritisch, reagiert mit Ärger und Aggression.","id":"k-ibk-08"},
  {"cat":"IBK · Transaktionsanalyse","q":"Fürsorgliches Eltern-Ich: Vorteile und Nachteile bei starker Ausprägung?","a":"Vorteil: schafft Geborgenheit, hört geduldig zu, unterstützt. Nachteil: <strong>überfürsorglich</strong>, macht andere abhängig und verhindert Selbständigkeit.","id":"k-ibk-09"},
  {"cat":"IBK · Transaktionsanalyse","q":"Erwachsenen-Ich: Vorteile und Nachteile bei starker Ausprägung?","a":"Vorteil: fragt viel, geht Ursachen auf den Grund, achtet auf Logik, löst Konflikte durch <strong>kreative Kooperation</strong>. Nachteil: zeigt wenig Gefühl, überkontrolliert, roboterhaft, übertriebene Perfektion.","id":"k-ibk-10"},
  {"cat":"IBK · Transaktionsanalyse","q":"Natürliches Kind-Ich: Vorteile und Nachteile bei starker Ausprägung?","a":"Vorteil: fantasievoll, spontan, offen, zeigt Gefühle. Nachteil: <strong>impulsiv</strong>, rücksichtslos, chaotisch, cholerisch.","id":"k-ibk-11"},
  {"cat":"IBK · Transaktionsanalyse","q":"Angepasstes Kind-Ich: Vorteile und Nachteile bei starker Ausprägung?","a":"Vorteil: nimmt Rücksicht, kompromissbereit, hält sich an Normen. Nachteil: <strong>überangepasst</strong>, Angst vor Fehlern, gibt schnell nach, zieht sich zurück.","id":"k-ibk-12"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was bedeutet ein schwach ausgeprägtes Erwachsenen-Ich?","a":"Es hat <strong>keine Vorteile</strong>: wenig Lernen aus Erfahrung, wechselhaft, unberechenbar, geringes Selbstwertgefühl.","id":"k-ibk-13"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was besagt die erste Kommunikationsregel?","a":"Bei einer <strong>Paralleltransaktion</strong> (komplementär) kommt die erwartbare Reaktion. Das Gespräch läuft glatt weiter und könnte theoretisch unbegrenzt andauern, auch aus „Langeweile“ endet es.","id":"k-ibk-14"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was besagt die zweite Kommunikationsregel?","a":"Die <strong>Über-Kreuz-Transaktion</strong> ist eine Störung: Der Stimulus wird nicht mit der erwartbaren Reaktion beantwortet. Sie ist oft die Grundlage für einen <strong>Konflikt</strong>; zum Glätten muss mindestens einer den Ich-Zustand wechseln.","id":"k-ibk-15"},
  {"cat":"IBK · Transaktionsanalyse","q":"Kann man den Ich-Zustand des Gesprächspartners bestimmen?","a":"Nein. Man kann ihn nur <strong>einladen</strong>, aus einem bestimmten Ich-Zustand zu reagieren.","id":"k-ibk-16"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was besagt die dritte Kommunikationsregel?","a":"Bei der <strong>verdeckten Transaktion</strong> werden zwei Botschaften gleichzeitig gesendet: offen auf der Sachebene, verdeckt auf der Beziehungsebene. Das weitere Verhalten entscheidet sich auf der Beziehungsebene.","id":"k-ibk-17"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie wird die verdeckte Botschaft übertragen?","a":"<strong>Nonverbal</strong> über Gestik, Mimik, Sprechweise und Tonlage.","id":"k-ibk-18"},
  {"cat":"IBK · Transaktionsanalyse","q":"Warum lässt sich ein Beziehungskonflikt nicht auf der Sachebene lösen?","a":"Das eigentliche Problem liegt auf der <strong>Beziehungsebene</strong>. Wird er auf der Sachebene ausgetragen, bleibt die Ursache unberührt. Besser: mit der verdeckten Botschaft konfrontieren und direkte Botschaften einfordern.","id":"k-ibk-19"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche vier Regeln gelten im Umgang mit verdeckten Transaktionen?","a":"1. Selbst darauf <strong>verzichten</strong>. 2. Die verdeckte Ebene <strong>ignorieren</strong> und beim Wort nehmen, zur direkten Botschaft auffordern. 3. Mit der doppelbödigen Kommunikation <strong>konfrontieren</strong>. 4. Bei hartnäckigem Beibehalten den <strong>Kontakt abbrechen</strong>.","id":"k-ibk-20"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie fordert man eine direkte Botschaft ein?","a":"Durch Nachfragen, z. B. „Was ist es, was Du mir damit sagen möchtest?“ oder „Sag mir bitte, was Du wirklich möchtest.“","id":"k-ibk-21"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche psychologischen Grundbedürfnisse nennt Berne?","a":"<strong>Sinnliche Anregung</strong>, <strong>Zuwendung/Beachtung (Strokes)</strong> und <strong>Zeitgestaltung</strong>. Für Führungskräfte am wichtigsten: Zuwendung und Beachtung.","id":"k-ibk-22"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was ist ein Stroke?","a":"Jede Form der <strong>Wahrnehmung oder Anerkennung</strong> eines Menschen durch einen anderen: körperlich (Händedruck), nonverbal (Blickkontakt, Lächeln) oder verbal (Lob, Kritik, Gespräch).","id":"k-ibk-23"},
  {"cat":"IBK · Transaktionsanalyse","q":"Warum provozieren Menschen manchmal Konflikte?","a":"Menschen wollen wahrgenommen werden; selbst <strong>negative Beachtung</strong> wird oft besser erlebt als keine. Notfalls holen sie sich Aufmerksamkeit durch Konflikte, Provokationen oder manipulative Rollen.","id":"k-ibk-24"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche fünf Formen der Beachtung gibt es (in Reihenfolge)?","a":"1. Bedingungslose positive, 2. bedingte positive, 3. bedingte negative, 4. bedingungslose negative Beachtung, 5. <strong>keine Beachtung</strong> (am schlimmsten).","id":"k-ibk-25"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie lauten die fünf Stroke-Erlaubnisse?","a":"Du darfst Strokes <strong>geben</strong>, darum <strong>bitten</strong>, sie <strong>annehmen</strong>, sie <strong>ablehnen</strong> und dich <strong>selbst stroken</strong>.","id":"k-ibk-26"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie grenzt sich Berne von Maslow bei den Grundbedürfnissen ab?","a":"Maslows Grundbedürfnisse sind die unterste Stufe der Pyramide (physiologisch: Nahrung, Wasser, Luft, Schlaf). Bei Berne sind es <strong>psychologische</strong> Bedürfnisse neben den körperlichen.","id":"k-ibk-27"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche vier Grundeinstellungen unterscheidet die TA?","a":"<strong>– +</strong> Ich bin nicht o.k., du bist o.k. · <strong>+ –</strong> Ich bin o.k., du bist nicht o.k. · <strong>– –</strong> beide nicht o.k. · <strong>+ +</strong> beide o.k. (gesund und konstruktiv).","id":"k-ibk-28"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie verhält sich jemand mit der Grundeinstellung „Ich bin nicht o.k. – du bist o.k.“?","a":"Fühlt sich unterlegen und unsicher, abhängig von Anerkennung: <strong>angepasst, zurückhaltend, entschuldigend, konfliktscheu</strong>.","id":"k-ibk-29"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie verhält sich jemand mit der Grundeinstellung „Ich bin o.k. – du bist nicht o.k.“?","a":"Fühlt sich überlegen, sucht Fehler bei anderen: <strong>dominant, kontrollierend, bevormundend</strong>, gibt Verantwortung ungern ab.","id":"k-ibk-30"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie verhält sich jemand mit der Grundeinstellung „Ich bin nicht o.k. – du bist nicht o.k.“?","a":"Erlebt das Leben als sinnlos oder hoffnungslos: <strong>resigniert, pessimistisch, distanziert</strong>.","id":"k-ibk-31"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Grundeinstellung ist die gesunde, und wann zeigt sich die Grundeinstellung deutlich?","a":"<strong>Ich bin o.k. – du bist o.k. (+ +)</strong>: respektvoll, verantwortungsbewusst, offen, lösungsorientiert. Die Grundeinstellung zeigt sich spätestens in <strong>Krisensituationen</strong>.","id":"k-ibk-32"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was ist das Drama-Dreieck und von wem stammt es?","a":"Modell von <strong>Stephen Karpman</strong> (Karpman-Dreieck) für destruktive Beziehungsdynamiken: die Rollen <strong>Verfolger, Opfer, Retter</strong> in psychologischen Spielen.","id":"k-ibk-33"},
  {"cat":"IBK · Transaktionsanalyse","q":"Warum entstehen psychologische Spiele?","a":"Wenn Konflikte nicht offen angesprochen werden. Man will Aufmerksamkeit/Bestätigung, eigene Ziele indirekt durchsetzen, echte Nähe vermeiden oder Verantwortung/Schuld abgeben.","id":"k-ibk-34"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Grundhaltung hat der Verfolger?","a":"<strong>„Ich bin o.k. – du nicht“</strong> (+ –). Kritisiert, kontrolliert, greift an. Typischer Satz: „Du bist schuld.“","id":"k-ibk-35"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Grundhaltung hat der Retter?","a":"„Ohne mich geht es nicht.“ Er hilft <strong>ungefragt</strong>, übernimmt Verantwortung und macht andere abhängig. Typischer Satz: „Ich mache das für dich.“ Er erwartet Dank und fühlt sich später ausgenutzt.","id":"k-ibk-36"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Grundhaltung hat das Opfer?","a":"<strong>„Ich bin nicht o.k. – die anderen sind besser“</strong> (– +). Fühlt sich hilflos, gibt Verantwortung ab, sucht einen Retter oder Verfolger. Typischer Satz: „Ich kann das nicht.“","id":"k-ibk-37"},
  {"cat":"IBK · Transaktionsanalyse","q":"Welche Merkmale haben psychologische Spiele im Drama-Dreieck?","a":"Wunsch nach <strong>Zuwendung</strong> als Einstieg, gleichzeitig <strong>verdeckte Transaktion</strong> (jemand ist nicht o.k.), alle drei Rollen werden eingenommen, <strong>blitzschnelle Rollenwechsel</strong>, die Rollen ziehen sich gegenseitig an.","id":"k-ibk-38"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie kann ein Retter zum Verfolger werden?","a":"Wenn seine Hilfe <strong>nicht angenommen</strong> wird. Das ist ein typischer Rollenwechsel im Drama-Dreieck.","id":"k-ibk-39"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie kommt man aus dem Drama-Dreieck heraus?","a":"Muster erkennen und aus dem <strong>Erwachsenen-Ich</strong> heraus offen, sachlich und verantwortungsvoll kommunizieren.","id":"k-ibk-40"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was sind Gefühlsmaschen?","a":"Taktische, oft unbewusste Gefühlsreaktionen, die in der <strong>Kindheit</strong> gelernt wurden, um andere zu beeinflussen oder Bedürfnisse indirekt durchzusetzen.","id":"k-ibk-41"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie zeigen sich die Drama-Dreieck-Rollen im Führungsalltag?","a":"Übermäßiges Kontrollieren (<strong>Verfolger</strong>), ungefragtes Helfen (<strong>Retter</strong>), Hilflosigkeit oder Schuldzuweisungen (<strong>Opfer</strong>).","id":"k-ibk-42"},
  {"cat":"IBK · Transaktionsanalyse","q":"Wie lauten die fünf Antreiber nach Taibi Kahler?","a":"<strong>Sei perfekt, sei stark, sei anderen gefällig (mach es allen recht), streng dich an, beeil dich.</strong>","id":"k-ibk-43"},
  {"cat":"IBK · Transaktionsanalyse","q":"Antreiber „Sei perfekt!“: Risiko und Erlauber?","a":"Führungsrisiko: <strong>Mikromanagement</strong>, Delegationsprobleme, Entscheidungsverzögerung. Erlauber: „Gut genug ist oft ausreichend.“","id":"k-ibk-44"},
  {"cat":"IBK · Transaktionsanalyse","q":"Antreiber „Sei stark!“: Risiko und Erlauber?","a":"Führungsrisiko: fehlende Fehlerkultur, Isolation, mangelnde Offenheit. Erlauber: <strong>„Du darfst Gefühle zeigen und Unterstützung annehmen.“</strong>","id":"k-ibk-45"},
  {"cat":"IBK · Transaktionsanalyse","q":"Antreiber „Beeil dich!“: Risiko und Erlauber?","a":"Führungsrisiko: Flüchtigkeitsfehler, vorschnelle Entscheidungen, Stressübertragung auf das Team. Erlauber: <strong>„Du darfst dir Zeit zum Denken nehmen.“</strong>","id":"k-ibk-46"},
  {"cat":"IBK · Transaktionsanalyse","q":"Antreiber „Sei anderen gefällig!“: Risiko und Erlauber?","a":"Führungsrisiko: <strong>Konfliktvermeidung</strong>, mangelnde Abgrenzung, Überlastung. Erlauber: „Du darfst eigene Bedürfnisse haben und vertreten.“","id":"k-ibk-47"},
  {"cat":"IBK · Transaktionsanalyse","q":"Antreiber „Streng dich an!“: Risiko und Erlauber?","a":"Führungsrisiko: Ineffizienz, Überarbeitung, fehlende Priorisierung. Erlauber: <strong>„Du darfst es dir leicht machen und wirksam arbeiten.“</strong>","id":"k-ibk-48"},
  {"cat":"IBK · Transaktionsanalyse","q":"Was untersucht die Skriptanalyse und warum ist sie nicht prüfbar?","a":"Den unbewussten, in der Kindheit geformten <strong>Lebensplan</strong>. Sie erfordert Langzeitbetrachtung und tiefenpsychologische Informationen, daher nicht in einer Prüfungssituation bewertbar.","id":"k-ibk-49"},
  {"cat":"IBK · Konflikte","q":"Wie ist ein Konflikt definiert?","a":"Ein Auseinandersetzungsprozess aus unterschiedlichen <strong>Interessen, Werten oder Zielen</strong> zwischen Personen, Gruppen oder innerhalb einer Person. Unvermeidlich, aber auch konstruktiv möglich.","id":"k-ibk-50"},
  {"cat":"IBK · Konflikte","q":"Was kennzeichnet einen heißen Konflikt?","a":"Er wird <strong>offen ausgefochten</strong>. Vorteil: Beteiligte verstecken den Konflikt nicht, günstig für Bearbeitung und Lösung.","id":"k-ibk-51"},
  {"cat":"IBK · Konflikte","q":"Was passiert, wenn man einen heißen Konflikt mit einem faulen Kompromiss „deckelt“?","a":"Er verwandelt sich regelmäßig in einen <strong>kalten Konflikt</strong> (z. B. wenn Vorgesetzte oberflächlich eingreifen, statt zu mediieren).","id":"k-ibk-52"},
  {"cat":"IBK · Konflikte","q":"Was kennzeichnet einen kalten Konflikt?","a":"Er brodelt <strong>unterschwellig</strong> und fast unbemerkt, weil Ängste und Befürchtungen die Austragung verhindern (Firmenkultur, Führungspersönlichkeit, persönlicher Hintergrund).","id":"k-ibk-53"},
  {"cat":"IBK · Konflikte","q":"Welche Eskalationsstufen nach Glasl sind „heiß“, welche „kalt“?","a":"Heiß: Stufen <strong>1, 2, 6, 8, 9</strong>. Kalt: Stufen <strong>3, 4, 7</strong>.","id":"k-ibk-54"},
  {"cat":"IBK · Konflikte","q":"Ab welcher Glasl-Stufe ist man selbst nicht mehr handlungsfähig?","a":"Auf Stufe <strong>3–4</strong> noch selbst handlungsfähig. <strong>Ab Stufe 4</strong> sollte man sich nicht in die Eskalation einbringen: <strong>externe Lösung</strong>.","id":"k-ibk-55"},
  {"cat":"IBK · Konflikte","q":"Welche vier Konfliktursachen gibt es?","a":"<strong>Bewertungskonflikt</strong> (Ziele), <strong>Beurteilungskonflikt</strong> (Wege), <strong>Verteilungskonflikt</strong> (Mittel), <strong>Beziehungskonflikt</strong> (Verletzung des Selbstwertgefühls).","id":"k-ibk-56"},
  {"cat":"IBK · Konflikte","q":"Worüber herrscht beim Bewertungskonflikt Uneinigkeit?","a":"Über die <strong>Ziele</strong>: unterschiedliche Werte und Normen, gegensätzliche Ziele.","id":"k-ibk-57"},
  {"cat":"IBK · Konflikte","q":"Worüber herrscht beim Beurteilungskonflikt Uneinigkeit?","a":"Über die <strong>Wege</strong>: unterschiedliche Erfahrungen, Informationsquellen und Informationsverarbeitung.","id":"k-ibk-58"},
  {"cat":"IBK · Konflikte","q":"Worüber herrscht beim Verteilungskonflikt Uneinigkeit?","a":"Über die <strong>Mittel</strong>: knappe oder knapp gehaltene Mittel, Diskrepanz zwischen Mitteln und Ansprüchen.","id":"k-ibk-59"},
  {"cat":"IBK · Konflikte","q":"Was ist die Ursache eines Beziehungskonflikts?","a":"Die <strong>Verletzung des Selbstwertgefühls</strong>.","id":"k-ibk-60"},
  {"cat":"IBK · Konflikte","q":"Welche fünf Konfliktarten unterscheidet man?","a":"<strong>Intrapersonal</strong> (in einer Person), <strong>interpersonal</strong> (zwischen Einzelpersonen), <strong>Intra-Gruppenkonflikt</strong> (innerhalb einer Gruppe), <strong>Inter-Gruppenkonflikt</strong> (zwischen Gruppen), <strong>Personen-Gruppen-Konflikt</strong>.","id":"k-ibk-61"},
  {"cat":"IBK · Konflikte","q":"Wie geht man mit einem heißen Konflikt zuerst um?","a":"Zuerst die <strong>persönlichen Beziehungen klären</strong>, da der Konflikt hochgradig personalisiert ist. Über externe Bedingungen und Organisation wird erst später gesprochen.","id":"k-ibk-62"},
  {"cat":"IBK · Konflikte","q":"Wie geht man mit einem kalten Konflikt zuerst um?","a":"Zuerst die Parteien befähigen, den Konflikt auszutragen, dazu das <strong>Selbstwertgefühl stärken</strong>. Direkte Konfrontation ruft anfangs Abwehr hervor; Vermeidungsprozeduren direktiv abändern.","id":"k-ibk-63"},
  {"id":"k-vak-01","cat":"VAk · Staatsrecht","q":"Wer hat nach Art. 76 Abs. 1 GG das Recht zur Gesetzesinitiative?","a":"<strong>Bundesregierung, Bundesrat und Bundestag</strong> (aus seiner Mitte). Bundespräsident und Bundesverfassungsgericht haben kein Initiativrecht."},
  {"id":"k-vak-02","cat":"VAk · Staatsrecht","q":"Wer fasst den Gesetzesbeschluss nach Art. 77 Abs. 1 GG?","a":"Allein der <strong>Bundestag</strong>. Der Bundesrat kommt erst im 2. Durchgang (Art. 77 Abs. 2 ff. GG)."},
  {"id":"k-vak-03","cat":"VAk · Staatsrecht","q":"Welche Organe wirken in der Gesetzesberatung (1. Durchgang) mit?","a":"<strong>Bundestag</strong>, <strong>Bundesrat</strong> (Stellungnahme) und <strong>Bundesregierung</strong>."},
  {"id":"k-vak-04","cat":"VAk · Staatsrecht","q":"Welche Möglichkeiten hat der Bundesrat im 2. Durchgang (Art. 77 Abs. 2 ff. GG)?","a":"Er kann <strong>zustimmen</strong>, <strong>Einspruch einlegen</strong> oder den <strong>Vermittlungsausschuss anrufen</strong>. Ein absolutes Veto hat er nur bei Zustimmungsgesetzen."},
  {"id":"k-vak-05","cat":"VAk · Staatsrecht","q":"Unterschied Zustimmungsgesetz und Einspruchsgesetz?","a":"Zustimmungsgesetz: ohne Zustimmung des Bundesrates kommt das Gesetz nicht zustande, der Bundestag kann das nicht überstimmen.<br>Einspruchsgesetz: der Bundestag kann den Einspruch zurückweisen (Art. 77 Abs. 4 GG)."},
  {"id":"k-vak-06","cat":"VAk · Staatsrecht","q":"Wer fertigt ein Bundesgesetz aus und verkündet es (Art. 82 Abs. 1 GG)? Was ist zusätzlich nötig?","a":"Der <strong>Bundespräsident</strong> (Ausfertigung und Verkündung im BGBl.). Erforderlich ist die <strong>Gegenzeichnung</strong> durch die Bundesregierung bzw. den zuständigen Bundesminister (Art. 58 GG)."},
  {"id":"k-vak-07","cat":"VAk · Staatsrecht","q":"Stimmt das? Das Bundesverfassungsgericht ist am regulären Gesetzgebungsverfahren des Bundes beteiligt.","a":"<strong>Falsch.</strong> Das BVerfG prüft Bundesgesetze erst nachträglich auf Antrag (z. B. abstrakte oder konkrete Normenkontrolle)."},
  {"id":"k-vak-08","cat":"VAk · Staatsrecht","q":"Wie wirken sich Änderungen der Kräfteverhältnisse in den Landesparlamenten auf die Wahl des Bundespräsidenten aus?","a":"Die Bundesversammlung besteht zur Hälfte aus von den Landesparlamenten entsandten Mitgliedern (<strong>Art. 54 Abs. 3 GG</strong>). Mehrheitsverschiebungen in den Landtagen verschieben die Mehrheit bei der Präsidentenwahl."},
  {"id":"k-vak-09","cat":"VAk · Staatsrecht","q":"Wie wirken sich Änderungen der Kräfteverhältnisse in den Landesparlamenten auf Grundgesetzänderungen aus?","a":"Nötig sind <strong>zwei Drittel der Stimmen des Bundesrates</strong> (Art. 79 Abs. 2 GG). Der Bundesrat besteht aus Mitgliedern der Landesregierungen (Art. 51 GG), deren Koalitionen von den Landtagswahlen abhängen."},
  {"id":"k-vak-10","cat":"VAk · Staatsrecht","q":"Stimmt das? Grundrechte sind Abwehrrechte der Bürgerinnen und Bürger gegen den Staat.","a":"<strong>Richtig.</strong> Das ist ihre klassische Funktion gegenüber dem Staat."},
  {"id":"k-vak-11","cat":"VAk · Staatsrecht","q":"Stimmt das? Alle Grundrechte sind im Rahmen des Grundgesetzes einschränkbar.","a":"<strong>Falsch.</strong> Die Menschenwürde (Art. 1 Abs. 1 GG) ist nach Art. 79 Abs. 3 GG unantastbar. Vorbehaltlos gewährleistete Grundrechte (z. B. Art. 4 Abs. 1 GG) sind nur durch verfassungsimmanente Schranken einschränkbar."},
  {"id":"k-vak-12","cat":"VAk · Staatsrecht","q":"Stimmt das? Autos sind vom Schutzbereich des Art. 13 Abs. 1 GG umfasst.","a":"<strong>Falsch.</strong> Art. 13 GG schützt die Wohnung, Kraftfahrzeuge fallen nicht darunter. Wohnmobile und Wohnwagen schon (Raum des Rückzugs und der Privatsphäre)."},
  {"id":"k-vak-13","cat":"VAk · Staatsrecht","q":"Stimmt das? Gemeinderäte sind Bestandteile der vollziehenden Gewalt.","a":"<strong>Richtig.</strong> Die kommunale Selbstverwaltung (Art. 28 Abs. 2 GG) gehört organisatorisch zur <strong>Exekutive</strong>, auf kommunaler Ebene gibt es keine eigene Gewaltenteilung."},
  {"id":"k-vak-14","cat":"VAk · Staatsrecht","q":"Stimmt das? Das Schulrecht fällt in die konkurrierende Gesetzgebungskompetenz.","a":"<strong>Falsch.</strong> Schulrecht ist <strong>Ländersache</strong> (Kulturhoheit der Länder), eine Bundeskompetenz nach Art. 70 ff. GG besteht nicht."},
  {"id":"k-vak-15","cat":"VAk · Staatsrecht","q":"Was gilt bei der konkurrierenden Gesetzgebung (Art. 72 Abs. 1 GG)?","a":"Die <strong>Länder sind zuständig, bis der Bund</strong> von seiner Zuständigkeit durch Gesetz Gebrauch macht. Der Bund darf also nicht erst nach Zustimmung der Länder tätig werden."},
  {"id":"k-vak-16","cat":"VAk · Staatsrecht","q":"Welche Arten der Gesetzgebungskompetenz unterscheidet das Grundgesetz?","a":"Ausschließliche Gesetzgebung des Bundes, <strong>konkurrierende Gesetzgebung</strong> und Zuständigkeit der Länder als Auffangzuständigkeit (Art. 70 ff. GG)."},
  {"id":"k-vak-17","cat":"VAk · Staatsrecht","q":"Stimmt das? Der Bundeskanzler kann den Bundestag auflösen.","a":"<strong>Falsch.</strong> Auflösen kann nur der <strong>Bundespräsident</strong>, und nur in den engen Fällen der Art. 63 Abs. 4 oder Art. 68 GG."},
  {"id":"k-vak-18","cat":"VAk · Staatsrecht","q":"Wer vertritt den Bundespräsidenten bei Verhinderung?","a":"Der <strong>Präsident des Bundesrates</strong> (Art. 57 GG), nicht der Bundeskanzler."},
  {"id":"k-vak-19","cat":"VAk · Staatsrecht","q":"Kann Bundespräsident Steinmeier 2027 wiedergewählt werden?","a":"<strong>Nein.</strong> Seine zweite Amtszeit endet am 18. März 2027, eine dritte Amtszeit in Folge schließt Art. 54 Abs. 2 GG aus."},
  {"id":"k-vak-20","cat":"VAk · Staatsrecht","q":"Welche Wahlrechtsgrundsätze nennt Art. 38 Abs. 1 Satz 1 GG?","a":"<strong>Allgemein, unmittelbar, frei, gleich, geheim</strong> (fünf). In der Klausurfrage fehlte die Gleichheit. Die Öffentlichkeit der Wahl hat das BVerfG aus Art. 38 i.V.m. Art. 20 GG entwickelt."},
  {"id":"k-vak-21","cat":"VAk · Staatsrecht","q":"Was bedeutet der Wahlgrundsatz der Gleichheit?","a":"Jede Stimme hat den gleichen <strong>Zählwert</strong> und den gleichen <strong>Erfolgswert</strong> (Art. 38 Abs. 1 Satz 1 GG)."},
  {"id":"k-vak-22","cat":"VAk · Staatsrecht","q":"Wann wurde das Grundgesetz verkündet, wann trat es in Kraft?","a":"Verkündet am <strong>23.05.1949</strong>, in Kraft getreten am <strong>24.05.1949</strong>."},
  {"id":"k-vak-23","cat":"VAk · Staatsrecht","q":"Was bedeutet das Rechtsstaatsprinzip?","a":"Es umfasst die Bindung an Gesetz und Recht, den <strong>Vorbehalt des Gesetzes</strong>, Rechtssicherheit und Rechtsschutz. Die richterliche Unabhängigkeit (Art. 97 GG) ist eine anerkannte Ausprägung."},
  {"id":"k-vak-24","cat":"VAk · Staatsrecht","q":"Wie ist die Gewaltenteilung im Grundgesetz ausgestaltet?","a":"Gliederung in Legislative, Exekutive und Judikative, aber <strong>keine strikte Trennung</strong>: Gewaltenverschränkung mit funktionalen Überschneidungen und wechselseitiger Kontrolle."},
  {"id":"k-vak-25","cat":"VAk · Staatsrecht","q":"Welche fünf ständigen Verfassungsorgane gibt es? Was gehört nicht dazu?","a":"Bundestag, Bundesrat, Bundesregierung, Bundespräsident, Bundesverfassungsgericht. Die <strong>Bundesversammlung</strong> ist kein ständiges Organ, sie tritt nur zur Präsidentenwahl zusammen."},
  {"id":"k-vak-26","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Was beschreibt das Entschließungsermessen?","a":"Das <strong>„Ob\"</strong>: Ob die Behörde überhaupt tätig wird (§ 40 VwVfG)."},
  {"id":"k-vak-27","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Was beschreibt das Auswahlermessen?","a":"Das <strong>„Wie\"</strong>: Auswahl der passenden Maßnahme oder des Adressaten bei mehreren erlaubten Möglichkeiten."},
  {"id":"k-vak-28","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Woran erkennt man in einer Norm typischerweise ein Ermessen?","a":"An <strong>„kann\"</strong> oder <strong>„darf\"</strong>. „Muss\" oder „ist\" weisen auf eine gebundene Entscheidung hin."},
  {"id":"k-vak-29","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Was versteht man unter Ermessensreduzierung auf Null?","a":"Durch besondere Umstände bleibt nur noch <strong>eine einzige rechtmäßige Entscheidung</strong>, jede andere wäre rechtswidrig. Beispiel: Gefahr für Leib und Leben, Einschreiten zwingend."},
  {"id":"k-vak-30","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Welche Stufen hat die Verhältnismäßigkeitsprüfung? Was gehört nicht dazu?","a":"Legitimer Zweck, <strong>Geeignetheit, Erforderlichkeit, Angemessenheit</strong>. Die „Rechtmäßigkeit\" ist keine eigene Stufe, sondern das Ergebnis der Prüfung."},
  {"id":"k-vak-31","cat":"VAk · Ermessen und Verhältnismäßigkeit","q":"Was prüft die Erforderlichkeit, was die Angemessenheit?","a":"Erforderlichkeit: kein <strong>milderes, gleich wirksames Mittel</strong>. Angemessenheit: kein Nachteil außer Verhältnis zum Erfolg, Abwägung Eingriffsschwere gegen Bedeutung des abzuwehrenden Schadens (§ 15 Abs. 2 OBG; § 44 Abs. 2 S. 4 BHKG)."},
  {"id":"k-vak-32","cat":"VAk · Verwaltungsrecht","q":"Was ist ein Verwaltungsakt nach § 35 VwVfG?","a":"<strong>Maßnahme einer Behörde zur Regelung eines Einzelfalls auf dem Gebiet des öffentlichen Rechts mit Außenwirkung</strong> (§ 35 Satz 1 VwVfG)."},
  {"id":"k-vak-33","cat":"VAk · Verwaltungsrecht","q":"Welches Merkmal ist das zentrale Tatbestandsmerkmal des Verwaltungsakts?","a":"Die <strong>Regelung</strong>. Schriftform, gerichtlicher Ursprung oder Zivilrechtsbezug sind nicht erforderlich."},
  {"id":"k-vak-34","cat":"VAk · Verwaltungsrecht","q":"Was bedeutet Außenwirkung beim Verwaltungsakt?","a":"Rechtswirkung gegenüber einer <strong>außerhalb der Verwaltung stehenden Person</strong>. Rein interne Abläufe oder innerdienstliche Anweisungen haben keine Außenwirkung."},
  {"id":"k-vak-35","cat":"VAk · Verwaltungsrecht","q":"Welche Maßnahme ist kein Verwaltungsakt: Baugenehmigung, Versetzung eines Beamten, Halteverbotsschild oder Ankündigung eines Gesetzesvorhabens auf einer Pressekonferenz?","a":"Die <strong>Ankündigung eines Gesetzesvorhabens</strong>: politische Aussage ohne Regelung eines Einzelfalls. Das Halteverbotsschild gilt als Allgemeinverfügung."},
  {"id":"k-vak-36","cat":"VAk · Verwaltungsrecht","q":"Was ist eine Allgemeinverfügung?","a":"Ein Verwaltungsakt, der sich an einen nach allgemeinen Merkmalen bestimmten oder bestimmbaren Personenkreis richtet bzw. an eine <strong>unbestimmte Vielzahl von Personen</strong> (§ 35 Satz 2 VwVfG). Beispiele: Halteverbotsschild, Absperrung eines Gefahrenbereichs."},
  {"id":"k-vak-37","cat":"VAk · Verwaltungsrecht","q":"Wie behandelt die Rechtsprechung Ampel- und Handzeichen der Polizei?","a":"Als Verwaltungsakte in Form von <strong>Allgemeinverfügungen</strong>, gerichtet an die anwesenden Verkehrsteilnehmer (Polizeizeichen: § 36 StVO)."},
  {"id":"k-vak-38","cat":"VAk · Verwaltungsrecht","q":"Was ist ein Realakt?","a":"Schlichtes <strong>tatsächliches Verwaltungshandeln ohne Regelungswirkung</strong> in Erfüllung öffentlicher Aufgaben, z. B. Auskunft, Warnung, Absperren einer Unfallstelle. Abgrenzung: Der Verwaltungsakt regelt einen Einzelfall mit Außenwirkung."},
  {"id":"k-vak-39","cat":"VAk · Verwaltungsrecht","q":"Was ist vor Erlass eines belastenden Verwaltungsaktes grundsätzlich erforderlich?","a":"Die <strong>Anhörung</strong> des Betroffenen (§ 28 Abs. 1 VwVfG)."},
  {"id":"k-vak-40","cat":"VAk · Verwaltungsrecht","q":"Wann kann auf die Anhörung verzichtet werden?","a":"Wenn <strong>§ 28 Abs. 2 VwVfG</strong> das zulässt, z. B. bei Gefahr im Verzug, Allgemeinverfügungen oder Massenverfahren. „Nur bei Gefahr im Verzug\" wäre zu eng."},
  {"id":"k-vak-41","cat":"VAk · Verwaltungsrecht","q":"Was gilt, wenn eine erforderliche Anhörung unterblieben ist?","a":"Der Verfahrensfehler ist <strong>heilbar</strong>, die Anhörung kann nachgeholt werden (§ 45 VwVfG). Der VA ist nicht automatisch nichtig."},
  {"id":"k-vak-42","cat":"VAk · Verwaltungsrecht","q":"Wann wird ein Verwaltungsakt wirksam?","a":"Mit seiner <strong>Bekanntgabe</strong> (§§ 41, 43 VwVfG), nicht erst mit Unterschrift, Veröffentlichung oder Zustimmung des Betroffenen."},
  {"id":"k-vak-43","cat":"VAk · Verwaltungsrecht","q":"Was ist eine Nebenbestimmung?","a":"Eine Regelung, die den Verwaltungsakt <strong>inhaltlich oder zeitlich einschränkt</strong> (§ 36 VwVfG)."},
  {"id":"k-vak-44","cat":"VAk · Verwaltungsrecht","q":"Was ist eine Bedingung im Sinne des § 36 VwVfG?","a":"Eine vom <strong>ungewissen Eintritt eines künftigen Ereignisses</strong> abhängige Regelung (§ 36 Abs. 2 Nr. 2 VwVfG)."},
  {"id":"k-vak-45","cat":"VAk · Verwaltungsrecht","q":"Was ist eine Auflage (§ 36 VwVfG)?","a":"Sie verpflichtet die begünstigte Person zu einem <strong>zusätzlichen Tun, Dulden oder Unterlassen</strong> (§ 36 Abs. 2 Nr. 4 VwVfG). Der Hauptverwaltungsakt bleibt voll wirksam."},
  {"id":"k-vak-46","cat":"VAk · Verwaltungsrecht","q":"Unterschied Auflage und Bedingung?","a":"Bedingung: die <strong>Wirksamkeit</strong> des Hauptverwaltungsakts steht infrage (tritt erst ein oder entfällt).<br>Auflage: Hauptverwaltungsakt bleibt wirksam, die Auflage ist <strong>eigenständig durchsetzbar</strong>."},
  {"id":"k-vak-47","cat":"VAk · Verwaltungsrecht","q":"Welche Anforderung stellt § 37 VwVfG an den Tenor eines Verwaltungsaktes?","a":"Er muss <strong>hinreichend bestimmt</strong> sein, also klar und vollziehbar sagen, was die Behörde verlangt. Mündliche VAs sind zulässig (§ 37 Abs. 2 VwVfG)."},
  {"id":"k-vak-48","cat":"VAk · Verwaltungsrecht","q":"Stimmt das? Die Begründung eines Verwaltungsaktes darf allgemeine Floskeln enthalten, wenn der Tenor eindeutig ist.","a":"<strong>Falsch.</strong> § 39 VwVfG verlangt eine konkrete, nicht floskelhafte Begründung mit den tragenden rechtlichen Gründen."},
  {"id":"k-vak-49","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Welche Zwangsmittel nennt § 9 Abs. 1 VwVG?","a":"<strong>Zwangsgeld, Ersatzvornahme, unmittelbarer Zwang</strong> (im Bundes-VwVG §§ 11, 10, 12)."},
  {"id":"k-vak-50","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Was muss vor dem Einsatz von Zwangsmitteln vorliegen?","a":"Ein <strong>wirksamer Verwaltungsakt, der nicht befolgt wird</strong> (§ 6 Abs. 1 VwVG des Bundes bzw. § 55 Abs. 1 VwVG NRW)."},
  {"id":"k-vak-51","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Unterschied Verwaltungsvollstreckung und Sofortvollzug?","a":"Der Sofortvollzug erfolgt <strong>ohne vorherigen Verwaltungsakt</strong>, wenn dessen vorherige Bekanntgabe den Zweck der Maßnahme vereiteln würde (§ 6 Abs. 2 VwVG)."},
  {"id":"k-vak-52","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Welche Wirkung hat ein Widerspruch gegen einen belastenden Verwaltungsakt?","a":"<strong>Aufschiebende Wirkung</strong> (§ 80 Abs. 1 VwGO). Der VA wird dadurch weder nichtig noch verzögert sich die Zustellung."},
  {"id":"k-vak-53","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Wie kann ein VA trotz Widerspruchs sofort vollzogen werden?","a":"Durch <strong>Anordnung der sofortigen Vollziehung mit besonderer schriftlicher Begründung</strong> (§ 80 Abs. 2 Nr. 4, Abs. 3 VwGO)."},
  {"id":"k-vak-54","cat":"VAk · Verwaltungsvollstreckung und Rechtsschutz","q":"Wie kann sich der Adressat gegen die Anordnung der sofortigen Vollziehung wehren?","a":"Mit einem <strong>Eilantrag beim Verwaltungsgericht</strong> (§ 80 Abs. 5 VwGO)."},
  {"id":"k-vak-55","cat":"VAk · Dienstrecht","q":"Was regelt § 34 BeamtStG?","a":"Die Pflicht zum <strong>vollen persönlichen Einsatz</strong>; das Verhalten muss der Achtung und dem Vertrauen gerecht werden, die der Beruf erfordert."},
  {"id":"k-vak-56","cat":"VAk · Dienstrecht","q":"Welche Beamtenverhältnisse gibt es nach § 4 BeamtStG? Welches gibt es nicht?","a":"Auf <strong>Lebenszeit, auf Probe, auf Widerruf, auf Zeit</strong>. Einen „Beamten auf Abruf\" gibt es nicht."},
  {"id":"k-vak-57","cat":"VAk · Dienstrecht","q":"Welche Staatsangehörigkeit ist Voraussetzung für die Berufung ins Beamtenverhältnis?","a":"<strong>Deutsche oder EU-Staatsangehörigkeit</strong> (§ 7 BeamtStG). § 8 BeamtStG regelt die Ernennung als formalen Akt."},
  {"id":"k-vak-60","cat":"VAk · Dienstrecht","q":"Worauf bezieht sich das statusrechtliche Amt?","a":"Auf die <strong>abstrakte Rechtsstellung</strong> (Laufbahn, Besoldungsgruppe, Amtsbezeichnung), nicht auf die tatsächlich wahrgenommenen Aufgaben (das wäre das Amt im konkret-funktionellen Sinn)."},
  {"id":"k-vak-61","cat":"VAk · Dienstrecht","q":"Welche Kriterien sind bei der Ernennung maßgeblich?","a":"<strong>Eignung, Befähigung und fachliche Leistung</strong> (Art. 33 Abs. 2 GG, Bestenauslese). Der Wohnsitz gehört nicht dazu."},
  {"id":"k-vak-62","cat":"VAk · Dienstrecht","q":"Welche Rolle hat die dienstliche Beurteilung bei der Beförderung?","a":"Sie ist im Rahmen der Bestenauslese regelmäßig das <strong>zentrale Erkenntnismittel</strong> und damit Hauptauswahlkriterium."},
  {"id":"k-vak-63","cat":"VAk · Dienstrecht","q":"Was gehört nicht zu den Dienstpflichten: Neutralitätsgebot, Folgepflicht, Verschwiegenheitspflicht oder wöchentliche Fortbildung?","a":"Die <strong>Pflicht zur wöchentlichen Fortbildung</strong>. Neutralität, Folgepflicht und Verschwiegenheit sind ausdrücklich normiert (§§ 33, 35, 37 BeamtStG)."},
  {"id":"k-vak-64","cat":"VAk · Dienstrecht","q":"Was ist ein Dienstvergehen?","a":"Eine <strong>schuldhafte Verletzung dienstlicher Pflichten</strong> (§ 47 BeamtStG)."},
  {"id":"k-vak-65","cat":"VAk · Dienstrecht","q":"Ein Beamter trägt bei einer privaten politischen Veranstaltung seine Dienstuniform. Welche Normen prüfen Sie?","a":"<strong>§ 33 Abs. 2 BeamtStG</strong> (Mäßigungsgebot) i.V.m. <strong>§ 47 Abs. 1 BeamtStG</strong> (Dienstvergehen)."},
  {"id":"k-vak-66","cat":"VAk · Dienstrecht","q":"Stimmt das? Eine Trunkenheitsfahrt in der Freizeit führt zu einem Disziplinarverfahren.","a":"<strong>Falsch</strong> (pauschal). Außerdienstliches Verhalten ist nur relevant, wenn es in besonderem Maß geeignet ist, Achtung und Vertrauen in einer für das Amt bedeutsamen Weise zu beeinträchtigen (§ 34 Satz 3 BeamtStG)."},
  {"id":"k-vak-67","cat":"VAk · Dienstrecht","q":"Wann muss ein Disziplinarverfahren eingeleitet werden?","a":"Bei <strong>zureichenden tatsächlichen Anhaltspunkten</strong> für ein Dienstvergehen. Es gilt das <strong>Legalitätsprinzip</strong>."},
  {"id":"k-vak-68","cat":"VAk · Dienstrecht","q":"Stimmt das? Dem Dienstvorgesetzten steht Ermessen zu, ob er bei einem bekannt gewordenen Dienstvergehen ein Disziplinarverfahren einleitet.","a":"<strong>Falsch.</strong> Kein Einleitungsermessen: Er muss tätig werden, nur das „Wie\" der Verfahrensführung steht ihm offen."},
  {"id":"k-vak-69","cat":"VAk · Dienstrecht","q":"Was ist der Zweck des Disziplinarrechts?","a":"<strong>Erziehung (Wiedereingliederung) und Funktionssicherung</strong> des Berufsbeamtentums, nicht Bestrafung im strafrechtlichen Sinne."},
  {"id":"k-vak-70","cat":"VAk · Dienstrecht","q":"Welcher Zweck gehört nicht zu den klassischen Zielen des Disziplinarrechts?","a":"Die <strong>Privatisierung der Ermittlungen</strong>. Anerkannt sind Erziehungszweck, Schutzfunktion und Reinigungsfunktion; das Verfahren bleibt hoheitlich."},
  {"id":"k-vak-71","cat":"VAk · Dienstrecht","q":"Stimmt das? Leistung und Persönlichkeitsbild sind alleiniger Grund für die Bemessung der Disziplinarmaßnahme.","a":"<strong>Falsch.</strong> Ausgangspunkt ist die <strong>Schwere des Dienstvergehens</strong>; Persönlichkeitsbild und bisherige Führung fließen nur ergänzend ein."},
  {"id":"k-vak-72","cat":"VAk · Dienstrecht","q":"Stimmt das? Das Disziplinarrecht ist abschließend durch das Bundesdisziplinargesetz geregelt.","a":"<strong>Falsch.</strong> Das BDG gilt nur für Bundesbeamte; für Landes- und Kommunalbeamte gilt das jeweilige <strong>Landesdisziplinargesetz</strong> (in Berlin das DiszG Bln)."},
  {"id":"k-vak-74","cat":"VAk · Dienstrecht","q":"Was folgt disziplinarisch aus einer rechtskräftigen strafrechtlichen Verurteilung?","a":"<strong>Bindungswirkung</strong> der tatsächlichen Feststellungen des Strafurteils; Abweichung nur unter engen Voraussetzungen. Eigene, widersprechende Tatsachenfeststellungen sind in aller Regel unzulässig."},
  {"id":"k-vak-86","cat":"VAk · Gefahrenabwehr","q":"Gegen welche drei Personengruppen können sich Maßnahmen der Gefahrenabwehr richten?","a":"<strong>Verhaltensstörer, Zustandsstörer, Nichtstörer</strong>."},
  {"id":"k-vak-87","cat":"VAk · Gefahrenabwehr","q":"Wer ist Verhaltensstörer?","a":"Wer die Gefahr durch <strong>eigenes Verhalten</strong> (Tun oder Unterlassen) verursacht (§ 17 OBG)."},
  {"id":"k-vak-88","cat":"VAk · Gefahrenabwehr","q":"Wer ist Zustandsstörer?","a":"Wer die <strong>tatsächliche Gewalt</strong> über eine gefahrverursachende Sache hat oder ihr Eigentümer ist (§ 18 OBG)."},
  {"id":"k-vak-89","cat":"VAk · Gefahrenabwehr","q":"Wann darf ein Nichtstörer in Anspruch genommen werden?","a":"Nur unter engen Voraussetzungen bei gegenwärtiger erheblicher Gefahr: Störer nicht rechtzeitig erreichbar oder Maßnahme unzureichend, Gefahr anders nicht abwendbar, Nichtstörer so wenig wie möglich belastet (§ 19 OBG). Folge: <strong>Entschädigung</strong>."},
  {"id":"k-vak-90","cat":"VAk · Gefahrenabwehr","q":"Wann liegt eine konkrete Gefahr vor?","a":"Wenn bei ungehindertem Ablauf des objektiv zu erwartenden Geschehens <strong>in absehbarer Zeit mit hinreichender Wahrscheinlichkeit ein Schaden</strong> droht. Je höherwertiger das Rechtsgut, desto geringer die nötige Wahrscheinlichkeit."},
  {"id":"k-vak-91","cat":"VAk · Gefahrenabwehr","q":"Was ist eine abstrakte Gefahr?","a":"Eine typischerweise gefährliche Situation, unabhängig vom Einzelfall. Grundlage für generell-abstrakte Regelungen, <strong>nicht</strong> für Einzelfallmaßnahmen."},
  {"id":"k-vak-92","cat":"VAk · Gefahrenabwehr","q":"Was ist eine Anscheinsgefahr?","a":"Ex ante erscheint eine konkrete Gefahr hinreichend wahrscheinlich, nachträglich zeigt sich, dass <strong>keine Gefahr bestand</strong>. Maßgeblich ist die Sicht eines besonnenen, sachkundigen Beobachters im Zeitpunkt des Handelns (<strong>ex ante</strong>)."},
  {"id":"k-vak-93","cat":"VAk · Gefahrenabwehr","q":"Wie beurteilen Sie die Rechtmäßigkeit bei Anscheinsgefahr?","a":"Das Einschreiten war <strong>rechtmäßig</strong>, wenn die Gefahrenprognose ex ante vertretbar war. Sobald der Irrtum erkannt wird, sind alle Maßnahmen <strong>unverzüglich einzustellen</strong>."},
  {"id":"k-vak-94","cat":"VAk · Gefahrenabwehr","q":"Was ist bei der Anscheinsgefahr besonders zu beachten?","a":"Die <strong>Kostenfrage</strong>: Wer trägt die Kosten einer sich als unbegründet herausstellenden Maßnahme?"},
  {"id":"k-vak-95","cat":"VAk · Gefahrenabwehr","q":"Was ist ein Unglücksfall im Sinne des BHKG?","a":"Ein <strong>plötzliches Ereignis</strong>, von dem eine erhebliche Gefahr für Menschen, Tiere, Sachen oder die Umwelt ausgeht (nicht nur Brände oder Explosionen)."},
  {"id":"k-vak-96","cat":"VAk · Gefahrenabwehr","q":"Welche Aufgabe ergibt sich aus § 1 Abs. 1 Nr. 1 BHKG?","a":"Gesetzliche Grundlage für den <strong>vorbeugenden und abwehrenden Brandschutz</strong> zum Schutz der Bevölkerung als Pflichtaufgabe der Gemeinden."},
  {"id":"k-vak-97","cat":"VAk · Gefahrenabwehr","q":"Fall Schornsteinbrand im Altbau: Darf der Einsatzleiter die verschlossene Nachbarwohnung gewaltsam öffnen?","a":"<strong>Ja</strong>, gestützt auf § 41 BHKG NRW i.V.m. Art. 13 Abs. 7 GG. Bei möglicher Brandausbreitung liegt mindestens eine Anscheinsgefahr vor. Verhältnismäßigkeit: wenn zeitlich möglich zuerst Schlüsseldienst, bei Gefahr im Verzug sofort öffnen."},
  {"id":"k-vak-98","cat":"VAk · Gefahrenabwehr","q":"Fall Schornsteinbrand: Darf die Wohnung eines widersprechenden Mieters (pensionierter Feuerwehrmann) betreten werden?","a":"<strong>Ja.</strong> Bezüglich der Nachbarwohnung ist er nicht Inhaber und kann nicht wirksam entscheiden, sein Widerspruch ist unbeachtlich. Sein Beruf spielt rechtlich keine Rolle."},
  {"id":"k-vak-99","cat":"VAk · Gefahrenabwehr","q":"Was beachten Sie beim Verlassen der Einsatzstelle nach dem Öffnen einer Wohnung?","a":"Wohnung <strong>sichern bzw. wieder verschließen</strong>, Bewohner und Eigentümer informieren, Vorgang und Gründe <strong>dokumentieren</strong>, keine Glutnester zurücklassen."},
  {"id":"k-vak-100","cat":"VAk · Gefahrenabwehr","q":"Fall: Rauchmelder piept, niemand öffnet, Feuerwehr bricht die Tür auf, Melder war defekt. War das rechtmäßig? Ersatz für die Tür?","a":"<strong>Rechtmäßig</strong> wegen Anscheinsgefahr (ex ante, § 41 BHKG NRW i.V.m. Art. 13 Abs. 7 GG). Bei rechtmäßiger Maßnahme in der Regel kein Schadensersatz; ein Ausgleich richtet sich nach den landesrechtlichen Kostenerstattungsregeln."},
  {"id":"k-vak-101","cat":"VAk · Gefahrenabwehr","q":"Fall: Kellerbrand, der Eigentümer verbietet den Zutritt zu einem vermieteten Kellerraum. Darf geöffnet werden?","a":"<strong>Ja.</strong> Bei Rauchausbreitungsgefahr besteht eine konkrete Gefahr, die die Kontrolle aller betroffenen Räume rechtfertigt (§ 41 BHKG NRW). Weder Eigentümer noch Mieter können ein wirksames Zutrittsverbot setzen. Danach sichern und beide informieren."},
  {"id":"k-vak-102","cat":"VAk · Fallbearbeitung","q":"Wie lauten die Prüfungsschritte des Fallbearbeitungsschemas im Feuerwehreinsatz?","a":"1 Ermächtigungsgrundlage, 2 Zuständigkeit, 3 Vorliegen einer Gefahr, 4 Störerauswahl, 5 Ermessen, 6 Verhältnismäßigkeit, 7 Rechtsfolge, 8 Kosten- und Entschädigungsfragen, 9 Dokumentation und Sicherung."},
  {"id":"k-vak-103","cat":"VAk · Fallbearbeitung","q":"Fallschema Schritt 1: Wann liegt ein Verwaltungsakt vor, wann ein Realakt?","a":"VA nach § 35 VwVfG: hoheitliche Maßnahme einer Behörde, öffentliches Recht, <strong>Regelung eines Einzelfalls mit Außenwirkung</strong>; auch Anweisungen an Störer. <strong>Realakt</strong>: schlichtes Handeln ohne Regelung, z. B. wenn kein Adressat vor Ort ist."},
  {"id":"k-vak-104","cat":"VAk · Fallbearbeitung","q":"Welche Ermächtigungsgrundlagen nennt das Schema für das Feuerwehrhandeln?","a":"<strong>§ 1 Abs. 1 Nr. 1 BHKG</strong> und § 3 Abs. 1 BHKG (Aufgabenzuweisung), <strong>§ 34 Abs. 2 BHKG</strong> (Hilfeleistung bei Notlagen), <strong>§ 44 Abs. 2 BHKG</strong> (Betreten, Anordnungen, unmittelbarer Zwang), flankiert von § 1 Abs. 1 OBG."},
  {"id":"k-vak-105","cat":"VAk · Fallbearbeitung","q":"Schritt 2 Zuständigkeit: Woraus ergeben sich sachliche, örtliche und instanzielle Zuständigkeit der Feuerwehr?","a":"Sachlich: § 1 Abs. 1 Nr. 1, 2 i.V.m. § 3 Abs. 1 S. 1 BHKG. Örtlich: Gemeindegebiet (§ 3 Abs. 1 S. 1 BHKG, § 4 Abs. 1 OBG). Instanziell: Feuerwehr als behördliche Einrichtung der Gemeinde (Art. 28 Abs. 2 GG, § 5 Abs. 1 OBG)."},
  {"id":"k-vak-106","cat":"VAk · Fallbearbeitung","q":"Welche Verfahrensanforderungen gelten für einen VA bei Gefahr im Verzug?","a":"Anhörungsverzicht (<strong>§ 28 Abs. 2 Nr. 1 VwVfG</strong>), mündliche Form (§ 37 Abs. 2 VwVfG), Begründung bei mündlichem VA nicht erforderlich (§ 39 Abs. 1 S. 1 VwVfG), mündliche Bekanntgabe (§ 41 Abs. 1 VwVfG)."},
  {"id":"k-vak-107","cat":"VAk · Fallbearbeitung","q":"Welche Verfahrensanforderungen des VwVfG gelten bei einem Realakt?","a":"<strong>Keine</strong>: weder Anhörung (§ 28), Form (§ 37) noch Bekanntgabe (§ 41). Es genügen die materiellen Schritte."},
  {"id":"k-vak-108","cat":"VAk · Fallbearbeitung","q":"Fallschema Schritt 5: Wann ist das Entschließungsermessen auf Null reduziert?","a":"Bei hochrangigen Rechtsgütern (<strong>Leib, Leben</strong>) ist das Einschreiten zwingend. Das Auswahlermessen übt der Einsatzleiter pflichtgemäß aus (§ 34 Abs. 2 BHKG): Wirksamkeit, Zumutbarkeit, Verhältnismäßigkeit."},
  {"id":"k-vak-109","cat":"VAk · Fallbearbeitung","q":"Wie formulieren Sie die Rechtsfolge (Inhalt des VA) im Fallschema?","a":"Anhand der <strong>W-Fragen</strong>: Wer? Was? Wann? Wohin? Wie (lang)? Bei Weigerung <strong>unmittelbarer Zwang</strong> nach § 44 Abs. 2 BHKG, bei Gefahr im Verzug sofortiger Vollzug ohne vorherige Androhung."},
  {"id":"k-vak-110","cat":"VAk · Fallbearbeitung","q":"Wann besteht ein Entschädigungsanspruch nach § 45 BHKG?","a":"Wenn ein <strong>Nichtstörer</strong> (§ 19 OBG) in Anspruch genommen wurde: angemessene Entschädigung durch die Gemeinde, auch bei rechtmäßiger Inanspruchnahme. Kein Anspruch bei Störern oder wenn kein Dritter herangezogen wurde."},
  {"id":"k-vak-111","cat":"VAk · Fallbearbeitung","q":"Was gehört in die Dokumentation und Sicherung am Einsatzende?","a":"Einsatzbericht (<strong>§ 34 Abs. 1 BHKG</strong>) mit Maßnahmen, Rechtsgrundlage, Gründen und Zeitpunkten; Einsatzstelle sichern oder übergeben; ggf. Ordnungsbehörde (§ 24 Abs. 1 Nr. 2 OBG) oder Polizei (§ 43 Nr. 1 PolG NRW) informieren, Eigentümer benachrichtigen."},
  {"id":"k-vak-112","cat":"VAk · Fallbearbeitung","q":"Fall 1 (Heimrauchmelder piept, Tür gewaltsam geöffnet, Wohnung leer): VA oder Realakt, und warum rechtmäßig?","a":"<strong>Realakt</strong>, da kein Adressat anwesend. Rechtmäßig wegen <strong>Anscheinsgefahr</strong> (piept nachts, älterer Bewohner, keine Reaktion, ex ante vertretbar). Ermessen auf Null, § 44 Abs. 2 BHKG."},
  {"id":"k-vak-113","cat":"VAk · Fallbearbeitung","q":"Fall 1: Besteht ein Entschädigungsanspruch des Eigentümers für die Tür nach § 45 BHKG?","a":"<strong>Nein.</strong> Es wurde kein Nichtstörer in Anspruch genommen, die Feuerwehr handelte per Realakt ohne Adressaten."},
  {"id":"k-vak-114","cat":"VAk · Fallbearbeitung","q":"Fall 2 (Gasgeruch im Supermarkt, Filialleiter verweigert Räumung wegen Umsatz): Handlungsform und Gefahr?","a":"Räumungsanordnung = <strong>mündlicher Verwaltungsakt</strong> (Anhörungsverzicht § 28 Abs. 2 Nr. 1 VwVfG). <strong>Konkrete Gefahr</strong>, da der Gasgeruch von der Feuerwehr bestätigt wurde. Umsatzverlust ist rechtlich ohne Belang (Angemessenheit)."},
  {"id":"k-vak-115","cat":"VAk · Fallbearbeitung","q":"Fall 2: Wer ist Störer und wer Adressat der Räumungsanordnung?","a":"Filialleiter = <strong>Verhaltensstörer</strong> (§ 17 OBG, verweigert die Räumung), Eigentümer/Betreiber = <strong>Zustandsstörer</strong> (§ 18 OBG). Adressat: der anwesende Filialleiter. Bei Weigerung unmittelbarer Zwang; <strong>kein</strong> Anspruch nach § 45 BHKG."},
  {"id":"k-vak-116","cat":"VAk · Fallbearbeitung","q":"Fall 3 (brennendes E-Fahrzeug in Tiefgarage, andere Fahrzeuge werden per Seilwinde umgesetzt): Wer ist Nichtstörer, welche Handlungsform?","a":"Eigentümer der <strong>anderen Fahrzeuge</strong> sind Nichtstörer (§ 19 OBG); Eigentümer des brennenden E-Fahrzeugs ist Zustandsstörer. Umsetzen = <strong>Realakt</strong>, Duldungsanordnung an anwesende Eigentümer = VA. Lackschäden sind gegenüber dem Brandschaden angemessen."},
  {"id":"k-vak-117","cat":"VAk · Fallbearbeitung","q":"Fall 3: Welcher Anspruch besteht für die Eigentümer der umgesetzten Fahrzeuge?","a":"<strong>Entschädigung</strong> durch die Gemeinde nach § 45 Abs. 2 BHKG (Nichtstörer). Eigentümer informieren und im Einsatzbericht dokumentieren."},
  {"id":"k-vak-118","cat":"VAk · Fallbearbeitung","q":"Fall 4 (umgestürzter Salzsäure-Tanklastzug, Sicherheitszone auf Privatgrundstück, Eigentümer verweigert): Rechtliche Einordnung?","a":"Duldungsanordnung = <strong>VA</strong> (§ 44 Abs. 2 i.V.m. § 45 BHKG). Grundstückseigentümer = <strong>Nichtstörer</strong>, Fahrer = Verhaltensstörer, Halter und Ladungseigentümer = Zustandsstörer. Bei Weigerung unmittelbarer Zwang; Entschädigung nach § 45 Abs. 2 BHKG."},
  {"id":"k-vak-119","cat":"VAk · Fallbearbeitung","q":"Fall 4: Was ist beim Verlassen des Privatgrundstücks zu beachten?","a":"Grundstück in <strong>ursprünglichem Zustand übergeben</strong>, Eigentümer über den Entschädigungsanspruch informieren, Übergabe an Polizei und Straßenverkehrsbehörde sicherstellen, im Einsatzbericht dokumentieren."},
  {"id":"k-vak-120","cat":"VAk · Fallbearbeitung","q":"Fall 5 (Hallendach droht einzustürzen, Halle leer): Handlungsform der Absperrung?","a":"<strong>Allgemeinverfügung</strong> (§ 35 Satz 2 VwVfG), gerichtet an alle potenziell Betretenden. Kein Nichtstörer in Anspruch genommen, daher kein Anspruch nach § 45 BHKG."},
  {"id":"k-vak-121","cat":"VAk · Fallbearbeitung","q":"Fall 5: Was darf die Feuerwehr bei drohendem Hallendacheinsturz tun und was nicht?","a":"Die Einsturzgefahr selbst <strong>nicht beseitigen</strong> (keine Zuständigkeit für Tragwerksicherung). Maßnahmen: <strong>beide Zugänge</strong> absperren, Bauaufsicht und THW (Fachberater Statik) benachrichtigen, kontrolliert an die Ordnungsbehörde übergeben."},
  {"id":"k-vak-122","cat":"VAk · Fallbearbeitung","q":"Fall 5: Wer ist Verhaltens- und Zustandsstörer?","a":"Verhaltensstörer: Betonmischer-Fahrer bzw. Firma (<strong>§ 17 OBG</strong>). Zustandsstörer: Hallen-Eigentümer (<strong>§ 18 OBG</strong>). Relevant für Kostenersatz und Weiterleitung an die Bauaufsicht."},
  {"id":"k-vak-123","cat":"VAk · Fallbearbeitung","q":"Fall 6 (Schornsteinbrand, unbesetzte Nachbarwohnung, Mieter verweigert Zutritt): Realakt oder VA?","a":"Öffnen der <strong>unbesetzten</strong> Nachbarwohnung = <strong>Realakt</strong> (§ 44 Abs. 2 BHKG, Art. 13 Abs. 7 GG). Betreten der <strong>besetzten</strong> Wohnung gegen den Willen = Duldungsanordnung als <strong>VA</strong>, notfalls unmittelbarer Zwang."},
  {"id":"k-vak-124","cat":"VAk · Fallbearbeitung","q":"Fall 6: Welche Rolle spielt die Weigerung des Mieters bezüglich der Nachbarwohnung?","a":"Er ist für die fremde Wohnung <strong>nicht verfügungsberechtigt</strong>, seine Weigerung ist rechtlich ohne Belang. Sein früherer Beruf ändert nichts; er ist kein Störer und hat keinen Anspruch nach § 45 BHKG."},
  {"id":"k-feuak-01","cat":"FeuAK · Haushalt","q":"Warum ist langfristige Planung im Haushaltswesen der Feuerwehr zwingend?","a":"Der Weg von Anmeldung über Parlament bis Aufsichtsbehörde dauert bis zu <strong>18 Monate</strong>. Der Haushalt gilt <strong>1 Jahr</strong>, Änderungen nur durch das Parlament. Daher rechtzeitige, begründete Bedarfsanmeldung."},
  {"id":"k-feuak-02","cat":"FeuAK · Haushalt","q":"Welcher Konflikt besteht zwischen Feuerwehr und Haushaltswesen?","a":"<strong>Schnelles Handeln</strong> (Sicherstellungsauftrag, Flexibilität) gegen <strong>Verwaltungsdenken</strong>."},
  {"id":"k-feuak-03","cat":"FeuAK · Haushalt","q":"Welche Konsequenz hat das Vergaberecht für die Haushaltsplanung der Feuerwehr?","a":"<strong>Keine Vergabe ohne Haushaltsmittel.</strong> Konsequenz: Rahmenverträge, technische Reserve, Vorausplanung."},
  {"id":"k-feuak-04","cat":"FeuAK · Haushalt","q":"Was bedeutet der Steuerungsauftrag der Feuerwehr im Haushalt?","a":"Die Feuerwehr gibt der Politik Strukturen vor: <strong>strategisch</strong> über den Haushalt, <strong>operativ</strong> über die KLR."},
  {"id":"k-feuak-10","cat":"FeuAK · Haushalt","q":"Wie lauten die vier Schritte des Wegs eines Haushalts?","a":"1. <strong>Bedarfsanmeldung</strong> 2. <strong>Priorisierung</strong> 3. <strong>Ansatzermittlung</strong> 4. <strong>Beschluss</strong> des Gemeinderats als Satzung."},
  {"id":"k-feuak-11","cat":"FeuAK · Haushalt","q":"Was geschieht bei der Bedarfsanmeldung?","a":"Die Feuerwehr meldet Ausrüstung und Technik für das kommende Jahr an, getrennt nach <strong>fixen Kosten</strong> (Mieten, Verträge) und <strong>variablen Kosten</strong> (Projekte, Sonderbeschaffungen), mit fachlicher Begründung."},
  {"id":"k-feuak-12","cat":"FeuAK · Haushalt","q":"Wer priorisiert die Anträge im Haushaltsverfahren und wonach?","a":"Gemeinde (Kämmerei/Verwaltungsführung) und <strong>Wehrleitung</strong> nach Dringlichkeit und Relevanz; politische und finanzielle Abwägungen fließen ein."},
  {"id":"k-feuak-13","cat":"FeuAK · Haushalt","q":"Was ist die Ansatzermittlung?","a":"Die <strong>Kämmerei</strong> legt konkrete Geldbeträge im Haushaltsplanentwurf fest; der Entwurf geht in die politische Beratung."},
  {"id":"k-feuak-14","cat":"FeuAK · Haushalt","q":"Wann stehen Haushaltsmittel verbindlich zur Verfügung?","a":"Nach dem Beschluss des Gemeinderats als <strong>Satzung</strong>. Erst dann ist eine Vergabe möglich."},
  {"id":"k-feuak-15","cat":"FeuAK · Haushalt","q":"Wodurch ist die Kameralistik gekennzeichnet?","a":"Zahlungsorientiertes Buchungssystem: <strong>Kassensteuerung</strong> (Ein-/Auszahlungen), Fokus auf Geldverbrauch ohne Vermögensausweis und <strong>ohne Abschreibungen</strong>, strikte <strong>Mittelkontrolle</strong>. Sie misst nicht den inhaltlichen Einsatzerfolg."},
  {"id":"k-feuak-16","cat":"FeuAK · Haushalt","q":"Wodurch ist die Doppik gekennzeichnet?","a":"Kaufmännisches Rechnungswesen aus <strong>Bilanz, Ergebnisrechnung und Finanzrechnung</strong>. Sie zeigt <strong>Ressourcenverbrauch</strong> (Abschreibungen), <strong>Transparenz</strong> (Vermögen, Schulden, Pensionsrückstellungen) und fördert <strong>Generationengerechtigkeit</strong>."},
  {"id":"k-feuak-17","cat":"FeuAK · Haushalt","q":"Worin liegt der Kernunterschied zwischen Kameralistik und Doppik?","a":"Kameralistik: Geldverbrauch und Liquidität, kein Werteverzehr. Doppik: <strong>periodengerechter Ressourcenverbrauch</strong>, macht Substanzverlust sichtbar."},
  {"id":"k-feuak-18","cat":"FeuAK · Haushalt","q":"Wofür steht die Abkürzung NKF/NKHR im Zusammenhang mit der Doppik?","a":"Sie stehen für die Doppik (doppelte Buchführung) in der Kommunalverwaltung."},
  {"id":"k-feuak-19","cat":"FeuAK · Haushalt","q":"Welche drei Säulen hat das 3-Säulen-Modell des doppischen Haushalts?","a":"<strong>Finanzhaushalt</strong> (Liquidität, Ein-/Auszahlungen), <strong>Ergebnishaushalt</strong> (Aufwand/Ertrag, Ausgleich am Jahresende), <strong>Vermögenshaushalt/Bilanz</strong> (Aktiva/Passiva)."},
  {"id":"k-feuak-20","cat":"FeuAK · VWL","q":"Was bedeutet indirekte Wertschöpfung der Feuerwehr?","a":"Die Feuerwehr produziert keine Güter, <strong>verhindert aber deren Zerstörung</strong>. Der Schutz von Sachwerten und Infrastruktur ist eine real erbrachte, nicht direkt sichtbare Wirtschaftsleistung."},
  {"id":"k-feuak-21","cat":"FeuAK · VWL","q":"Welche Rolle spielt der Faktor Zeit bei der indirekten Wertschöpfung?","a":"Schnelle Eingreifzeiten begrenzen den Schaden; jede Minute früherer Intervention reduziert direkte Sach- und Folgeschäden."},
  {"id":"k-feuak-22","cat":"FeuAK · VWL","q":"Was bedeutet Betriebserhalt als Kategorie der indirekten Wertschöpfung?","a":"Ein gelöschtes Firmengebäude verhindert Produktionsausfälle, Lieferkettenausfälle und ggf. dauerhafte Betriebsschließungen."},
  {"id":"k-feuak-23","cat":"FeuAK · VWL","q":"Was bedeutet Existenzsicherung als Kategorie der indirekten Wertschöpfung?","a":"Schutz von Betriebsstätten sichert lokale <strong>Arbeitsplätze und Steuereinnahmen</strong>. Feuerwehrausgaben stabilisieren so indirekt die kommunale Haushaltsbasis."},
  {"id":"k-feuak-24","cat":"FeuAK · VWL","q":"Warum ist das Argument der indirekten Wertschöpfung bei knappen Kassen wichtig?","a":"Es zeigt den wirtschaftlichen Nutzen der Feuerwehr: Ausgaben verhindern höhere Schäden. Vier Kategorien: indirekte Wertschöpfung, Faktor Zeit, Betriebserhalt, Existenzsicherung."},
  {"id":"k-feuak-25","cat":"FeuAK · VWL","q":"Was ist eine Kosten-Nutzen-Analyse (KNA)?","a":"<strong>Systematischer Vergleich aller Kosten und Nutzen</strong> einer Maßnahme in Geldwerten; gesetzliche Grundlage bei finanzwirksamen Entscheidungen (<strong>HGrG</strong>). Überwiegt der Nutzen, gilt die Maßnahme als wirtschaftlich vertretbar."},
  {"id":"k-feuak-26","cat":"FeuAK · VWL","q":"Wozu dient die KNA als Entscheidungshilfe?","a":"Sie objektiviert die Auswahl zwischen Investitionsalternativen (z. B. Fahrzeugtypen, Standorte) und macht Entscheidungen rational begründbar und für Dritte nachvollziehbar."},
  {"id":"k-feuak-27","cat":"FeuAK · VWL","q":"Warum ist die KNA ein Wirtschaftlichkeitsnachweis?","a":"Sie ist bei finanzwirksamen Maßnahmen gesetzlich vorgeschrieben (<strong>HGrG</strong>); ohne Nachweis sind Ausgaben formal nicht zulässig."},
  {"id":"k-feuak-28","cat":"FeuAK · VWL","q":"Was leistet der Makro-Blick der KNA?","a":"Er erfasst auch <strong>gesellschaftliche Wohlfahrtseffekte</strong> (verhinderte Umweltschäden, öffentliche Sicherheit, Lebensqualität) über direkte Ausgaben hinaus."},
  {"id":"k-feuak-29","cat":"FeuAK · VWL","q":"Wie hilft die KNA bei der Priorisierung?","a":"Sie verhindert Fehlinvestitionen durch Nachweis des langfristigen Mehrwerts und ermöglicht eine fundierte Priorisierung konkurrierender Ausgaben."},
  {"id":"k-feuak-30","cat":"FeuAK · QM","q":"Mit welcher Struktur beschreibt man Qualität in einem Feuerwehrbereich?","a":"<strong>Bereich → Produkte → Beteiligte (Kunden) → Kennzahl</strong>; mindestens zwei Bereiche nennen."},
  {"id":"k-feuak-31","cat":"FeuAK · QM","q":"Produkte, Beteiligte und Kennzahlen im abwehrenden Brandschutz?","a":"Produkte: Brandbekämpfung, TH. Beteiligte: Bürger (<strong>Hilfsfristerreichungsgrad</strong>), Politik (Kosten je Risikokategorie)."},
  {"id":"k-feuak-32","cat":"FeuAK · QM","q":"Produkte, Beteiligte und Kennzahlen bei der Leitstelle?","a":"Produkte: Notrufannahme und Disposition. Beteiligte: Bürger (<strong>Quote angenommener Notrufe</strong>), Kostenträger (RD-Gebühr)."},
  {"id":"k-feuak-33","cat":"FeuAK · QM","q":"Produkte, Beteiligte und Kennzahlen bei der Ausbildung?","a":"Produkte: Grund- und Spezialausbildung. Beteiligte: Mitarbeiter (<strong>Ausbildungsquote</strong>), BGU (qualifizierter EK-Anteil)."},
  {"id":"k-feuak-34","cat":"FeuAK · QM","q":"Produkte, Beteiligte und Kennzahlen im Rettungsdienst?","a":"Produkte: Notfallrettung, KTW. Beteiligte: Patient (<strong>Hilfsfristerreichungsgrad RD</strong>), Kostenträger (Kosten je Einsatz)."},
  {"id":"k-feuak-35","cat":"FeuAK · QM","q":"Welche vier Perspektiven hat die Balanced Scorecard?","a":"<strong>Finanzen</strong>, <strong>Kunden</strong>, <strong>Interne Prozesse</strong>, <strong>Lernen und Entwicklung</strong>."},
  {"id":"k-feuak-36","cat":"FeuAK · QM","q":"Welche Beispiel-Kennzahlen gehören zu den BSC-Perspektiven Finanzen und Kunden?","a":"Finanzen: Budgettreue, Kosten je Einsatz, Investitionsquote. Kunden: Hilfsfristerfüllungsquote, Sicherheitsgefühl der Bevölkerung."},
  {"id":"k-feuak-37","cat":"FeuAK · QM","q":"Welche Beispiel-Kennzahlen gehören zu den BSC-Perspektiven Interne Prozesse und Lernen/Entwicklung?","a":"Prozesse: Ausrückzeit, Fahrzeugverfügbarkeit, Ausbildungsstand. Lernen/Entwicklung: Fortbildungsquote, Personalentwicklung, Digitalisierung."},
  {"id":"k-feuak-38","cat":"FeuAK · QM","q":"Welche Blickwinkel gelten für die Feuerwehr (F93)?","a":"<strong>Kunden/Bevölkerung</strong>, <strong>Geschäftsführung/Politik</strong>, <strong>eigene Organisation</strong>."},
  {"id":"k-feuak-39","cat":"FeuAK · QM","q":"Warum braucht man verschiedene Blickwinkel auf Qualität?","a":"Dieselbe Leistung hat je Beteiligtem andere Qualitätsansprüche und Indikatoren. Steuerung auf zwei Ebenen: stadtgesamt (politisch/strategisch) und Ausrückbereich/Dienstgruppe (taktisch/operativ)."},
  {"id":"k-feuak-40","cat":"FeuAK · PM","q":"Welche drei Kernkennzahlen nutzt die strategische Personalplanung?","a":"<strong>Ist-Personalfaktor</strong>, <strong>Ist-Stellenfaktor</strong>, <strong>Soll-Stellenfaktor</strong>."},
  {"id":"k-feuak-41","cat":"FeuAK · PM","q":"Wie berechnet sich der Ist-Personalfaktor?","a":"<strong>8.760 h ÷ Netto-JAZ</strong> (Netto-JAZ = JAZ minus alle Ausfälle) = tatsächlich benötigte Mitarbeiter je Funktion."},
  {"id":"k-feuak-42","cat":"FeuAK · PM","q":"Wie berechnet sich der Ist-Stellenfaktor?","a":"<strong>Planstellen ÷ zu besetzende Funktionen</strong>."},
  {"id":"k-feuak-43","cat":"FeuAK · PM","q":"Was ist der Soll-Stellenfaktor?","a":"Der politisch beschlossene Faktor mit festem <strong>Besetzungsgrad (ca. 95 %)</strong>."},
  {"id":"k-feuak-44","cat":"FeuAK · PM","q":"Welche Ausfallgründe gehen in die Netto-JAZ ein?","a":"Krankheit, Urlaub, Aus-/Fortbildung, außerhalb Einsatzdienst, Mutterschutz/Elternzeit, Sonstiges."},
  {"id":"k-feuak-45","cat":"FeuAK · PM","q":"Wie wirken Mehrarbeit, Transferleistungen und Funktionsunterschreitung auf den Personalfaktor?","a":"Mehrarbeit-Aufbau erhöht den Faktor, -Abbau verringert ihn; Transferleistungen verringern ihn; Funktionsunterschreitungsstunden erhöhen ihn (keine Verrechnung mit Überschreitungen)."},
  {"id":"k-feuak-46","cat":"FeuAK · PM","q":"Wie nutzt man die Personalkennzahlen strategisch?","a":"Zeitreihenvergleiche, Risikoerkennung, Argumente im <strong>Stellenplanverfahren</strong>; Erhebung mindestens <strong>1× jährlich</strong>."},
  {"id":"k-feuak-47","cat":"FeuAK · PM","q":"Welche Rahmenbedingungen der EU-Arbeitszeitrichtlinie gelten für Schichtmodelle?","a":"Max. <strong>48 h/Woche</strong> im Durchschnitt von 12 Monaten, tägliche Ruhezeit mind. <strong>11 h</strong>, wöchentlich mind. <strong>24 h</strong>, Ruhepause nach 6 h."},
  {"id":"k-feuak-48","cat":"FeuAK · PM","q":"Vor- und Nachteile des 24-Stunden-Dienstes?","a":"Vorteil: beliebt, nur ca. 2 Anwesenheitstage. Nachteil: 11 h Ruhezeit im Rettungsdienst schwer einzuhalten, höheres Unfallrisiko; bei hoher Nachtbelastung ungeeignet."},
  {"id":"k-feuak-49","cat":"FeuAK · PM","q":"Vor- und Nachteile von 12-Stunden-Schichten und Tagesdienst?","a":"12 h: RD-tauglich, Ruhezeit gesichert; aber häufigere Wechsel. Tagesdienst: familienfreundlich, passt zur Einsatzspitze; aber nachts keine Vorhaltung, höherer Personalbedarf."},
  {"id":"k-feuak-50","cat":"FeuAK · PM","q":"Vor- und Nachteile von Wachabteilungsmodellen und flexiblen Modellen?","a":"WA (z. B. Bremer Modell): planbar, viele freie Tage, aber starr. Flexibel (Springerpool, Arbeitszeitkonten): fangen Spitzen ab, aber hoher Planungsaufwand."},
  {"id":"k-feuak-51","cat":"FeuAK · PM","q":"Was ist bei der Wahl des Schichtmodells zu beachten?","a":"Passend zum Vorhaltezeitraum wählen, <strong>Personalfaktor</strong> berechnen (Ausfallzeiten erhöhen ihn), Wechsel behutsam einführen und den Personalrat beteiligen."},
  {"id":"k-feuak-52","cat":"FeuAK · Vergabe","q":"Wann darf die Vergabe einer neuen HLF-Generation angestoßen werden?","a":"Erst, wenn <strong>Haushaltsmittel bereitstehen</strong>. Vorher werden Vergabeunterlagen und Leistungsverzeichnis vorbereitet."},
  {"id":"k-feuak-53","cat":"FeuAK · Vergabe","q":"Welche Voraussetzungen müssen für die HLF-Beschaffung erfüllt sein?","a":"Mittel rechtskräftig bewilligt; Maßnahme im <strong>Investitionsprogramm</strong> (5-Jahres-Darstellung); <strong>Wertungsmatrix</strong> (Preis mind. 40 %) mit Ausschreibung veröffentlicht; Fahrzeuge im <strong>Vermögenshaushalt</strong> (einzige Kreditfinanzierung)."},
  {"id":"k-feuak-54","cat":"FeuAK · Vergabe","q":"Worauf ist bei der HLF-Beschaffung besonders zu achten?","a":"<strong>EU-Schwellenwerte</strong> prüfen, <strong>Rahmenverträge</strong> nutzen, feste Jahresraten ansparen, Restmittel-Übertragbarkeit sichern."},
  {"id":"k-feuak-55","cat":"FeuAK · Vergabe","q":"Vorteile und Nachteile einer einzigen Tranche?","a":"Vorteile: einheitliche Ausbildung, gleiche Ersatzteile, Skaleneffekte, eine Ausschreibung. Nachteil: Ein Systemfehler trifft alle Fahrzeuge."},
  {"id":"k-feuak-56","cat":"FeuAK · Vergabe","q":"Vorteile und Nachteile mehrerer Tranchen?","a":"Vorteil: Risiko gestreut. Nachteile: höhere Einzelkosten, getrennte Ausschreibungen."},
  {"id":"k-feuak-57","cat":"FeuAK · Vergabe","q":"Wie bemisst man Nutzungsdauer und technische Reserve eines Fahrzeugs?","a":"Nutzungsdauer nach <strong>AfA-Tabelle</strong> (Anlageverzeichnis: Anschaffungswert, Restwert, Nutzungsdauer). Technische Reserve ausreichend bemessen; Indikator: <strong>Fahrzeugverfügbarkeit</strong>."},
  {"id":"k-feuak-58","cat":"FeuAK · Vergabe","q":"Was macht einen Vergabevorschlag rechtssicher?","a":"Mittel vor Vergabestart rechtskräftig vorhanden; <strong>Wertungsmatrix</strong> vorab veröffentlicht (Preis mind. 40 %); EU-Schwellenwerte geprüft; <strong>neutrales Leistungsverzeichnis</strong> (kein Hersteller, Typ, Marke)."},
  {"id":"k-feuak-59","cat":"FeuAK · Vergabe","q":"Was macht einen Vergabevorschlag zielorientiert?","a":"<strong>Bedarfsermittlung zuerst</strong> (Was brauche ich tatsächlich?), Qualitätskriterien in der Wertungsmatrix gewichten, technische Eignungskriterien klar festlegen, Rahmenverträge nutzen, Tranche(n) bewusst abwägen."},
  {"id":"k-feuak-61","cat":"FeuAK · Vergabe","q":"Nenne die vier Aspekte, warum ein neutrales Leistungsverzeichnis zentral ist.","a":"1. Vergaberecht und Neutralität 2. Diskriminierungsverbot 3. Wettbewerbssicherung 4. Rechtssicherheit."},
  {"id":"k-feuak-62","cat":"FeuAK · Vergabe","q":"Was fordert das Vergaberecht von einem neutralen Leistungsverzeichnis, und was ist verboten?","a":"Exakte, <strong>herstellerneutrale</strong> Bedarfsbeschreibung (§ 31 VgV, § 7 VOB/A). Bevorzugung bestimmter Hersteller oder Modelle ist rechtswidrig, auch versteckte Spezifikationen."},
  {"id":"k-feuak-63","cat":"FeuAK · Vergabe","q":"Wie sichert ein neutrales Leistungsverzeichnis den Wettbewerb?","a":"Transparente Kriterien ermöglichen fairen Marktvergleich und maximalen Bieterwettbewerb; Wettbewerb senkt Preise und steigert Qualität."},
  {"id":"k-feuak-64","cat":"FeuAK · Vergabe","q":"Wovor schützt ein neutrales Leistungsverzeichnis?","a":"Vor <strong>Vergaberügen</strong> und teuren <strong>Beschaffungsstopps</strong>."},
  {"id":"k-feuak-68","cat":"FeuAK · Bedarfsplanung","q":"Was prüft die Analyse der Hilfsfristerreichung im Rettungsdienst?","a":"Einen <strong>SOLL-IST-Vergleich</strong> des tatsächlichen Erreichungsgrades mit dem gesetzlichen Schutzziel, zweigleisig: Gesamterreichung aller Fahrzeuge gegenüber Erreichung ab der zuständigen Wache."},
  {"id":"k-feuak-69","cat":"FeuAK · Bedarfsplanung","q":"Wie deutet man gute Erreichung ab zuständiger Wache bei schlechter Gesamterreichung?","a":"Als <strong>Ressourcenverfügbarkeitsproblem</strong>."},
  {"id":"k-feuak-70","cat":"FeuAK · Bedarfsplanung","q":"Wie deutet man schlechte Erreichung auch ab zuständiger Wache?","a":"Als <strong>Standort-/Erreichbarkeitsproblem</strong>. Ergebnis der Analyse: räumliche Versorgungslücken und Eingrenzung der Ursachenart."},
  {"id":"k-feuak-71","cat":"FeuAK · Bedarfsplanung","q":"Was leistet die Problemfeldanalyse?","a":"Sie quantifiziert die Verursachungsbeiträge der Nicht-Erreichung: <strong>Standortstruktur und Verkehr</strong>, <strong>Ausrückzeit</strong>, <strong>Ressourcenverfügbarkeit</strong>. Ergebnis: priorisierte, zielgerichtete Maßnahmen für das Soll-Konzept."},
  {"id":"k-idf-01","cat":"IdF · Brandschutz","q":"Welche Gebäudeklasse hat ein freistehendes Gebäude mit OKFF 6,5 m und zwei Nutzungseinheiten von 130 m² und 280 m²?","a":"<strong>GK 3.</strong> Die Summe der Nutzungseinheiten beträgt 410 m² und überschreitet damit die 400-m²-Grenze von GK 1 und GK 2. Es ist ein sonstiges Gebäude mit Höhe ≤ 7 m."},
  {"id":"k-idf-02","cat":"IdF · Brandschutz","q":"Was kennzeichnet die <strong>Gebäudeklasse 2</strong>?","a":"Höhe (OKFF) bis 7 m, <strong>höchstens 2 Nutzungseinheiten</strong> mit zusammen <strong>höchstens 400 m²</strong>. Anders als GK 1 nicht freistehend."},
  {"id":"k-idf-03","cat":"IdF · Brandschutz","q":"Welche Gebäudeklasse hat ein Gebäude mit OKFF 8,5 m und einer Nutzungseinheit von 700 m²?","a":"<strong>GK 5.</strong> Die Höhe würde GK 4 (bis 13 m) erlauben, aber nur bei Nutzungseinheiten von jeweils höchstens 400 m². Die 700-m²-Einheit überschreitet das."},
  {"id":"k-idf-04","cat":"IdF · Brandschutz","q":"Wie ist die Gebäudeklasse 4 nach Höhe und Nutzungseinheiten abgegrenzt?","a":"OKFF bis 13 m, <strong>unbegrenzt viele Nutzungseinheiten</strong>, aber jede höchstens 400 m². GK 5: OKFF über 13 m bis 22 m; darüber Hochhaus (MHHR)."},
  {"id":"k-idf-05","cat":"IdF · Brandschutz","q":"Ab welcher Höhe ist ein Gebäude ein <strong>Hochhaus</strong>, und welche Regelwerke gelten dann?","a":"OKFF des höchstgelegenen Geschosses mit Aufenthaltsraum <strong>mehr als 22 m</strong> über Geländeoberfläche (Sonderbau, § 2 Abs. 4 MBO). Es gilt die <strong>MHHR</strong>; bei einem Hotel zusätzlich die Beherbergungsstättenverordnung."},
  {"id":"k-idf-06","cat":"IdF · Brandschutz","q":"Wie viele und welche Rettungswege fordert die MHHR bei einem Hotel mit 22 Geschossen?","a":"<strong>Zwei voneinander unabhängige bauliche Rettungswege</strong> je Nutzungseinheit und Geschoss (MHHR Nr. 4.1.1). Anleiterbarkeit genügt als zweiter Rettungsweg nicht."},
  {"id":"k-idf-07","cat":"IdF · Brandschutz","q":"Wie weit kann ein <strong>Sicherheitstreppenraum</strong> in Hochhäusern zwei notwendige Treppenräume ersetzen?","a":"Bis 60 m Höhe genügt <strong>ein Sicherheitstreppenraum</strong> an Stelle von zwei notwendigen Treppenräumen (Nr. 4.2.1). Über 60 m müssen alle notwendigen Treppenräume Sicherheitstreppenräume sein (Nr. 4.2.2)."},
  {"id":"k-idf-08","cat":"IdF · Brandschutz","q":"Welche Pflichten gelten bei einem Wohnhochhaus mit höchstem Aufenthaltsraum in 36 m Höhe?","a":"<strong>Feuerwehraufzug</strong> (Nr. 6.1) und ein <strong>Brandschutzbeauftragter</strong> des Eigentümers (Nr. 9.3.2). Anleiterung als zweiter Rettungsweg ist nicht vorgesehen."},
  {"id":"k-idf-09","cat":"IdF · Brandschutz","q":"Welche Anforderungen stellt die MHHR an Hochhäuser bis 60 m zu Feuerwehraufzug, Steigleitungen und Feuerwiderstand?","a":"<strong>Feuerwehraufzüge</strong> und <strong>nasse Steigleitungen mit Wandhydranten</strong> sind in allen Hochhäusern Pflicht. Tragende Bauteile feuerbeständig, über 60 m 120 Minuten, nie 180 Minuten."},
  {"id":"k-idf-10","cat":"IdF · Brandschutz","q":"Was bedeutet das Kurzzeichen <strong>REI 90-M</strong> (früher F 90-A) bei einer Brandwand?","a":"<strong>R</strong> tragend, <strong>E</strong> raumabschließend, <strong>I</strong> isolierend, <strong>M</strong> gegen Stoßbeanspruchung, <strong>90</strong> Minuten Feuerwiderstand. Selbstschließend (C) ist nicht enthalten."},
  {"id":"k-idf-11","cat":"IdF · Brandschutz","q":"Welche Anforderungen lassen sich genau aus <strong>C5S200</strong> ableiten?","a":"<strong>Rauchdicht und selbstschließend:</strong> C5 = Selbstschließung (Dauerfunktion), S200 = Rauchdichtheit. Brandschutzeigenschaften wie feuerhemmend oder raumabschließend stecken nicht darin."},
  {"id":"k-idf-12","cat":"IdF · Brandschutz","q":"Was bedeutet die Klassifizierung <strong>EI2 30-S200-C5</strong>?","a":"<strong>Feuerhemmender, rauchdichter und selbstschließender</strong> Öffnungsabschluss. EI2 30 = Raumabschluss und Wärmedämmung für 30 Minuten. Entspricht dem bisherigen T30-RS."},
  {"id":"k-idf-13","cat":"IdF · Brandschutz","q":"Welche Türanforderung gilt nach § 35 Abs. 10 MBO zwischen Treppenraum und Kellergeschoss?","a":"<strong>Feuerhemmend, rauchdicht und selbstschließend (T30-RS).</strong> Gilt auch zu Räumen mit erhöhter Brandlast."},
  {"id":"k-idf-14","cat":"IdF · Brandschutz","q":"Welche Anforderung gilt für Türen von notwendigen Treppenräumen zu notwendigen Fluren, Wohnungen und Nutzungseinheiten?","a":"Zu <strong>notwendigen Fluren</strong>: rauchdicht und selbstschließend. Zu <strong>Wohnungen, Nutzungseinheiten und sonstigen Räumen</strong>: dicht- und selbstschließend. Dichtschließend allein genügt nicht."},
  {"id":"k-idf-15","cat":"IdF · Brandschutz","q":"Welche Anforderung gilt für Öffnungen in inneren Brandwänden?","a":"<strong>Feuerbeständig, dicht- und selbstschließend</strong> (EI2 90-C5, § 30 MBO). Rauchdichtheit (Sa) wird dort nicht verlangt."},
  {"id":"k-idf-16","cat":"IdF · Brandschutz","q":"Welche Vorschrift hat bei Kollision Vorrang: MBO oder Sondervorschrift?","a":"<strong>Sondervorschriften</strong> (z. B. Sonderbauverordnungen nach § 51 MBO) gehen als <strong>lex specialis</strong> den allgemeinen Regelungen vor. Eine Wahl nach Günstigkeit für den Bauherrn gibt es nicht."},
  {"id":"k-idf-17","cat":"IdF · Brandschutz","q":"Welche vier Schutzziele nennt § 14 MBO im Wortlaut?","a":"Der <strong>Entstehung eines Brandes</strong> und der <strong>Ausbreitung von Feuer und Rauch</strong> wird vorgebeugt. Bei einem Brand sind die <strong>Rettung von Menschen und Tieren</strong> sowie <strong>wirksame Löscharbeiten</strong> möglich."},
  {"id":"k-idf-18","cat":"IdF · Brandschutz","q":"Was ist <strong>kein</strong> Schutzziel nach § 14 MBO?","a":"Kein Schutzziel sind Sachschutz „um jeden Preis“, Löschwasser als solches und ein einheitliches Schutzniveau aller Bundesländer."},
  {"id":"k-idf-19","cat":"IdF · Brandschutz","q":"Welchen Schutzzielen dienen Flure, Anleiterstellen, Alarmierungsanlagen, Brandwände, Trennwände und Rauchableitung aus Treppenräumen?","a":"<strong>Rettung von Menschen:</strong> notwendige Flure, anleiterbare Stelle, Alarmierungsanlage. <strong>Brandausbreitung:</strong> Brandwände, Trennwände. <strong>Wirksame Löscharbeiten:</strong> Rauchableitung aus Treppenräumen."},
  {"id":"k-idf-20","cat":"IdF · Brandschutz","q":"Welchem Schutzziel dienen Explosionsunterdrückungsanlagen und dauerhafte Sauerstoffreduktion?","a":"Der <strong>Vorbeugung der Brandentstehung</strong>. Anleiterstelle (Rettung) und Rauchabzug im Treppenraum (Löscharbeiten) gehören dagegen nicht dazu."},
  {"id":"k-idf-21","cat":"IdF · Brandschutz","q":"In welche Bereiche teilt sich der vorbeugende Brandschutz auf?","a":"<strong>Baulicher, anlagentechnischer und organisatorischer</strong> Brandschutz (dazu zählt die Brandschutzerziehung). Brandsicherheitswachen gehören zum abwehrenden Brandschutz."},
  {"id":"k-idf-22","cat":"IdF · Brandschutz","q":"Welche Hydrantenwerte gelten nach DVGW W 405 im Wohngebiet mit kleiner Brandausbreitungsgefahr?","a":"Grundschutz <strong>800 l/min (48 m³/h) über mindestens 2 Stunden</strong>, nachzuweisen im Umkreis von <strong>300 m</strong>. Bei 200 m Lauflänge und 120 m Hydrantenabstand sind die Lauflängen ausreichend."},
  {"id":"k-idf-23","cat":"IdF · Brandschutz","q":"Warum ist die Löschwasserversorgung ohne Angabe zur Rohrnetzleistung nicht als sichergestellt zu werten?","a":"Ein DN-100-Unterflurhydrant liefert nur dann etwa 800 l/min, wenn das Netz diese Menge bei mindestens 1,5 bar Betriebsdruck hergibt. Ohne Netzangaben ist das nicht nachgewiesen."},
  {"id":"k-idf-24","cat":"IdF · Brandschutz","q":"Wann sind <strong>Versammlungsstätten</strong> nach MVStättVO anwendbar (Besucherzahlen)?","a":"Versammlungsräume mit <strong>mehr als 200 Besuchern</strong>; mehrere Räume mit gemeinsamen Rettungswegen zählen zusammen. Sportstadien und Freisportanlagen mit Tribünen erst ab <strong>mehr als 5000 Besuchern</strong>."},
  {"id":"k-idf-25","cat":"IdF · Brandschutz","q":"Fällt eine Disco mit 150 m² unter die Versammlungsstättenverordnung?","a":"<strong>Ja.</strong> Bei sonstigen Stehplätzen gelten mindestens 2 Besucher je m², also mindestens 300 Besucher und damit mehr als 200. Auch eine Disco mit 200 m² (mindestens 400 Besucher) fällt darunter."},
  {"id":"k-idf-26","cat":"IdF · Brandschutz","q":"Was gilt für zwei Versammlungsräume im Krankenhaus mit 45 und 120 Personen und gemeinsamem notwendigem Flur?","a":"Zusammen <strong>165 Besucher</strong>, also nicht mehr als 200: <strong>keine Versammlungsstätte</strong>. Ebenso nicht: Fußballplatz mit 1700 Tribünenplätzen (unter 5000)."},
  {"id":"k-idf-27","cat":"IdF · Brandschutz","q":"Was gilt für die Maßgeblichkeit der Zahl in der Versammlungsstättenverordnung und für Rettungswege über Foyers?","a":"Maßgeblich ist die <strong>Besucherzahl</strong> (mehr als 200), nicht die Zahl aller anwesenden Personen. Ein Rettungsweg darf über Hallen oder Foyer geführt werden."},
  {"id":"k-idf-28","cat":"IdF · Brandschutz","q":"Welche Nutzungen fallen unter die Muster-Garagenverordnung?","a":"Offene mehrgeschossige Stahlparkhäuser und <strong>Stellplätze unter einem Gebäude</strong>. Nicht: Gebäude für Fahrzeuge des Brand- und Katastrophenschutzes, Arbeitsmaschinen, land- und forstwirtschaftliche Zugmaschinen, Verkaufsraum eines Autohauses."},
  {"id":"k-idf-29","cat":"IdF · Brandschutz","q":"Wie werden Garagen eingeteilt, und welche Rettungsweglängen gelten?","a":"<strong>Klein-, Mittel- und Großgaragen</strong> nach Nutzfläche (≤ 100 m², bis 1000 m², über 1000 m²). Rettungsweglänge in geschlossenen Garagen 35 m, in offenen 50 m. Bauteilanforderungen hängen davon ab, ob die Garage offen oder geschlossen ist."},
  {"id":"k-idf-30","cat":"IdF · Brandschutz","q":"Welche Aussagen zu <strong>Brandwänden</strong> in § 30 MBO sind richtig?","a":"Brandwände sind mindestens <strong>30 cm über die Bedachung</strong> zu führen (nicht generell 50 cm). In Gebäudeklasse 5 nichtbrennbar und auch unter mechanischer Beanspruchung feuerbeständig. Gebäudeabschlusswand als Brandwand bei Abstand zur Grenze unter 2,5 m."},
  {"id":"k-idf-31","cat":"IdF · Brandschutz","q":"Welche Aussagen zum Schulbau (Muster-Schulbau-Richtlinie) treffen zu?","a":"In Lernbereichen sind <strong>Sichtbereiche</strong> vorzusehen. Nicht pauschal gefordert: Rettungsgerät der Feuerwehr, Brandmeldeanlage mit Aufschaltung, Übungen mit der Feuerwehr, notwendige-Flur-Anforderungen für alle Lernbereiche."},
  {"id":"k-idf-32","cat":"IdF · Brandschutz","q":"Was gilt bei der <strong>Brandverhütungsschau</strong>?","a":"Die Situation ist <strong>verhältnismäßig</strong> zu prüfen und auf akute wesentliche Gefährdungen hinzuweisen. Ein Protokoll und bei Bedarf eine Verfügung der Behörde empfehlen sich. Es gilt Bestandsschutz; die Zuständigkeit ist landesrechtlich verschieden."},
  {"id":"k-idf-33","cat":"IdF · Brandschutz","q":"Welche Gebäude sind Sonderbauten nach § 2 Abs. 4 MBO (Versammlungsstätten, Verkaufsstätten, Beherbergungsstätten)?","a":"Versammlungsstätten mit Räumen für mehr als <strong>200 Besucher</strong>; Verkaufsstätten mit Verkaufsräumen und Ladenstraßen von zusammen mehr als <strong>800 m²</strong>; Beherbergungsstätten bereits ab mehr als <strong>12 Gastbetten</strong> (nicht erst 30)."},
  {"id":"k-idf-34","cat":"IdF · Brandschutz","q":"Wann ist ein Krankenhaus ein Sonderbau?","a":"<strong>Immer</strong>, unabhängig von Bettenzahl, Stationen und Größe; Schwellenwerte gibt es nicht."},
  {"id":"k-idf-35","cat":"IdF · Brandschutz","q":"Welche Aussagen zu Verkaufsstätten sind richtig?","a":"Erster Rettungsweg über die Ladenstraße nur, wenn der zweite davon <strong>unabhängig</strong> ist. Ebenerdig mit Feuerlöschanlage bis <strong>10.000 m²</strong> Brandabschnitt; während der Betriebszeit muss ein Verantwortlicher anwesend sein. Rettungsweglänge im Verkaufsraum 25 m, nicht pauschal 100 m."},
  {"id":"k-idf-36","cat":"IdF · Brandschutz","q":"Welche Bestandsschutz- und Abweichungsregeln gelten bei Bauherrn-Aussagen zu Fenstern, Schiebeleiter und Nutzungsuntersagung?","a":"Bestehende Fenster müssen bei Bestandsschutz nicht auf 0,90 m × 1,20 m geändert werden. Ersatz der Drehleiter durch Schiebeleiter nur per <strong>Abweichung (§ 67 MBO)</strong>. Bei fehlendem zweitem Rettungsweg und schlechtem Zustand ist eine Nutzungsuntersagung möglich."},
  {"id":"k-idf-37","cat":"IdF · Brandschutz","q":"Wer muss Aufstellflächen für die Drehleiter herstellen und erhalten, und was darf angerechnet werden?","a":"Der <strong>Bauherr</strong> muss sie errichten und dauerhaft nutzbar halten (pflegen, freihalten). Anrechenbar sind die tatsächliche Leistungsfähigkeit der örtlichen Drehleiter (z. B. 15 m Nennausladung bei 22 m Rettungshöhe) und die öffentliche Verkehrsfläche."},
  {"id":"k-idf-38","cat":"IdF · Brandschutz","q":"Was fordert die MBO an Mindestmaßen für Fenster als Rettungsweg?","a":"Im Lichten mindestens <strong>0,90 m × 1,20 m</strong>, Brüstungshöhe höchstens 1,20 m."},
  {"id":"k-idf-51","cat":"IdF · Brandschutz","q":"Wie wird die Ausbreitung von Rauch im Gebäude begrenzt?","a":"Notwendige Flure mit <strong>Rauchabschnitten</strong> und rauchdichten Türen, notwendige Treppenräume, Lüftungsanlagen mit Brandschutzklappen sowie Abschottungen bei Leitungsdurchführungen."},
  {"id":"k-idf-58","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat der <strong>S1</strong>?","a":"Personal/Innerer Dienst: Kräfte alarmieren und anfordern (Zwiebelschalenmodell), Reserven, <strong>Lotsenstellen</strong>, mit S3 Bereitstellungsräume, Kräfteübersicht, innerer Stabsdienst und Schichtplanung für den Stab."},
  {"id":"k-idf-59","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat der <strong>S2</strong>?","a":"Lage: Informationen beschaffen und bewerten, <strong>Lagekarte</strong> und Einsatzübersichten führen, Lagebesprechungen vorbereiten, Meldungen, <strong>Einsatztagebuch</strong> und Abschlussbericht."},
  {"id":"k-idf-60","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat der <strong>S3</strong>?","a":"Einsatz: Lagebesprechungen, Lage beurteilen und <strong>Entschluss</strong> fassen, Einsatzschwerpunkte und -abschnitte festlegen, Schadengebiet ordnen, Befehle erteilen und die Durchführung kontrollieren."},
  {"id":"k-idf-61","cat":"IdF · Stabsarbeit","q":"Wer legt den Eigenschutz fest: S3 oder S4?","a":"Der <strong>S4</strong> veranlasst den Eigenschutz (technisch, medizinisch, psychosozial). Der S3 beurteilt die Lage, legt Einsatzschwerpunkte fest und kontrolliert den Einsatzerfolg."},
  {"id":"k-idf-64","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat der <strong>S5</strong>?","a":"Presse- und Medienarbeit: Presseinformationen, Betreuung der Medienvertreter, Warnung und Information der Bevölkerung, Abstimmung mit Pressesprechern (v. a. Polizei). Mit Krisenstab untersteht der S5 der BuMA."},
  {"id":"k-idf-65","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat der <strong>S6</strong>?","a":"Informations- und Kommunikationswesen: Ist-Zustand erfassen, <strong>Kommunikationskonzept</strong> mit Fernmeldeskizze, IuK-Technik bereitstellen, Kommunikationssicherheit (Redundanz) und Übermittlung."},
  {"id":"k-idf-66","cat":"IdF · Stabsarbeit","q":"Wer ist für den Aufbau der Kommunikationsstruktur zuständig?","a":"Der <strong>S6</strong>. Ist er noch nicht besetzt, schafft der <strong>S3</strong> die Kommunikation (7-Punkte-Plan). Leitstelle und BDBOS bauen die Struktur der Einsatzleitung nicht auf."},
  {"id":"k-idf-67","cat":"IdF · Stabsarbeit","q":"Woraus besteht ein Führungsstab?","a":"Aus dem <strong>Leiter des Stabes</strong>, den Leitern der Sachgebiete <strong>S1 bis S6</strong>, Führungsassistenten und Führungshilfspersonal (operativ-taktische Komponente)."},
  {"id":"k-idf-68","cat":"IdF · Stabsarbeit","q":"Woraus besteht die administrativ-organisatorische Komponente?","a":"Aus <strong>KGS, SMS und EMS</strong> (Koordinierungsgruppe, ständige und ereignisspezifische Mitglieder), geführt vom Leiter des Stabes."},
  {"id":"k-idf-69","cat":"IdF · Stabsarbeit","q":"Wofür ist die KGS im administrativ-organisatorischen Stab zuständig?","a":"<strong>Lagedarstellung und Dokumentation</strong> (ETB, GIS) sowie Innerer Dienst (z. B. Alarmierung, Schichtplanung). Pressearbeit macht die BuMA, Befehle erteilt die Einsatzleitung."},
  {"id":"k-idf-70","cat":"IdF · Stabsarbeit","q":"Welche Stabsmodelle gibt es?","a":"Das <strong>Ein-Stabsmodell</strong> und das <strong>Zwei-Stabsmodell</strong> (operativ-taktischer Stab plus administrativ-organisatorischer Stab unter dem HVB)."},
  {"id":"k-idf-71","cat":"IdF · Stabsarbeit","q":"Welche Aussagen zum Krisenstab sind richtig?","a":"Aufgaben werden in den bestehenden <strong>Behördenstrukturen und Zuständigkeiten</strong> (Soziales, Polizei, Gesundheit) abgearbeitet. Er ist keine Führungsstufe E und arbeitet nicht grundsätzlich im selben Raum oder mit derselben Lagedarstellung wie der Führungsstab."},
  {"id":"k-idf-72","cat":"IdF · Stabsarbeit","q":"Wer beruft den Krisenstab in NRW ein, und wo gibt es ihn?","a":"Der <strong>Hauptverwaltungsbeamte (HVB)</strong>. Den Krisenstab gibt es in Kreisen und kreisfreien Städten; in kreisangehörigen Kommunen den <strong>Stab für außergewöhnliche Ereignisse (SAE)</strong>."},
  {"id":"k-idf-73","cat":"IdF · Stabsarbeit","q":"Welche Stellung haben Sachgebietsleiter im Führungsstab?","a":"Sie sind dem <strong>Leiter des Stabes</strong> unterstellt, handeln im Aufgabengebiet <strong>eigenverantwortlich und selbstständig</strong> und versorgen den Leiter des Stabes mit Informationen. Keine Unterstellung unter den S3."},
  {"id":"k-idf-74","cat":"IdF · Stabsarbeit","q":"Welche Sachgebiete werden bei zu wenig Personal im Führungsstab zusammengefasst?","a":"<strong>S4 mit S1</strong>, <strong>S2 mit S3</strong>, <strong>S5 zu S2</strong> und <strong>S6 zu S3</strong>."},
  {"id":"k-idf-75","cat":"IdF · Stabsarbeit","q":"Wofür steht <strong>Führungsstufe D</strong> nach FwDV 100?","a":"Für den <strong>Führungsstab</strong> (S1–S6) bei mehreren Verbänden, Großeinsatzlagen und Katastrophen. Die Führungsstaffel gehört zur Stufe C. Der KBM ist nicht zwingend beteiligt."},
  {"id":"k-idf-76","cat":"IdF · Stabsarbeit","q":"Welches Fahrzeug eignet sich zum stabsmäßigen Arbeiten einer Führungsgruppe?","a":"Der <strong>ELW 2</strong>. ELW 1, KdoW und MTW reichen dafür nicht aus."},
  {"id":"k-idf-77","cat":"IdF · Stabsarbeit","q":"Was besagt die <strong>Auftragstaktik</strong> zum Befehl?","a":"Ziel und Zweck vorgeben, das Wie entscheidet der Geführte. <strong>Je weiter in die Zukunft</strong> ein Befehl reicht, desto freier ist er. Bei Gefahr oder besserer Ortskenntnis darf abgewichen werden; Kommunikation ist keine Einbahnstraße."},
  {"id":"k-idf-78","cat":"IdF · Stabsarbeit","q":"Was ist der <strong>PTZ-10 NRW</strong>?","a":"Eine mit <strong>zwei Notärzten</strong> besetzte Einheit in Zugstärke (1 Führungsfahrzeug, 4 RTW, 4 KTW). „10“ = maximal 10 transportierbare Patienten, nicht 10 Einsatzkräfte; er rückt als geschlossener Verband aus, die SEG Sanität gehört nicht dazu."},
  {"id":"k-idf-79","cat":"IdF · Stabsarbeit","q":"Was gilt für die Anforderung der MoFüSt in NRW?","a":"Anforderung über die <strong>Leitstelle</strong> bei der Bezirksregierung. In den Stufen 2 und 3 wird ein <strong>Vorauskommando</strong> entsandt. Es gibt drei Stufen: Führungskräfte, Führungsgruppe, kompletter Führungsstab."},
  {"id":"k-idf-80","cat":"IdF · Stabsarbeit","q":"Kann die MoFüSt die Gesamteinsatzleitung vollständig übernehmen?","a":"<strong>Nein.</strong> Sie unterstützt im Auftrag des bestellten Einsatzleiters; dieser entscheidet über ihren Einsatz (§§ 33, 37 BHKG)."},
  {"id":"k-idf-81","cat":"IdF · Stabsarbeit","q":"Welche Sachgebiete legen Bereitstellungsräume fest?","a":"<strong>S1 und S3</strong> gemeinsam (7-Punkte-Plan, Punkt 2: BR EL oder BR EA)."},
  {"id":"k-idf-82","cat":"IdF · Stabsarbeit","q":"Was ist bei der Festlegung eines Bereitstellungsraumes zu beachten?","a":"Verkehrstechnisch gut angebunden, <strong>Versorgung</strong> (Unterkunft, Sanitär, Wetterschutz, Tankmöglichkeit, Strom, Wasser, Kommunikation), außerhalb des Gefahrenbereichs."},
  {"id":"k-idf-83","cat":"IdF · Stabsarbeit","q":"Wer führt einen Bereitstellungsraum?","a":"Eine <strong>Führungseinheit</strong> (z. B. mit ELW). Ein bloßer Haltepunkt ist kein Bereitstellungsraum."},
  {"id":"k-idf-84","cat":"IdF · Stabsarbeit","q":"Was gilt für Kraftstoffversorgung durch den S4?","a":"Auch <strong>Bereitstellungsräume</strong> brauchen eine Kraftstoffversorgung. Bestimmte Einheiten von Feuerwehr, THW und Bundeswehr können eine <strong>mobile Tankstelle</strong> stellen. Keine generelle kostenlose Betankungspflicht der Tankstellen."},
  {"id":"k-idf-85","cat":"IdF · Stabsarbeit","q":"Welche Aufgaben hat die Versorgungsstelle Verpflegung?","a":"Umsetzung des S4-Konzepts: <strong>Besorgung</strong> von Lebensmitteln und Getränken, <strong>Zubereitung</strong> von Speisen, Hygiene. Wartungsarbeiten gehören zur Materialerhaltung."},
  {"id":"k-idf-86","cat":"IdF · Stabsarbeit","q":"Wer übernimmt bei Trinkwasseraufbereitung durch das THW die Technische Einsatzleitung?","a":"Sie bleibt bei der <strong>örtlich zuständigen Kommune</strong>. Das THW wird im Wege der <strong>Amtshilfe</strong> tätig."},
  {"id":"k-idf-87","cat":"IdF · Stabsarbeit","q":"Was gilt für die Bundeswehr im Einsatz?","a":"Anforderung über das <strong>Kreisverbindungskommando (KVK)</strong>; Tätigkeit als Amtshilfe/Katastrophenhilfe nach <strong>Art. 35 GG</strong>. Die Einsatzleitung bleibt bei der zivilen Behörde; Selbstverpflegung ist nicht immer gegeben."},
  {"id":"k-idf-88","cat":"IdF · Stabsarbeit","q":"Aus welchen Schritten besteht die Entscheidungshilfe <strong>FOR-DEC</strong>?","a":"<strong>F</strong>acts, <strong>O</strong>ptions, <strong>R</strong>isks &amp; Benefits, <strong>D</strong>ecision, <strong>E</strong>xecution, <strong>C</strong>heck."},
  {"id":"k-idf-89","cat":"IdF · Stabsarbeit","q":"Was umfasst das <strong>Gemeinsame Mentale Modell (GMM)</strong>?","a":"Das geteilte Verständnis des Stabes von <strong>Lage und Auftrag</strong>, <strong>Prozessen und Strukturen</strong> sowie <strong>Umwelt und Umgebung</strong>."},
  {"id":"k-idf-90","cat":"IdF · Stabsarbeit","q":"Was kennzeichnet kritische Situationen in der Stabsarbeit?","a":"<strong>Komplexität/Vernetztheit, Dynamik, Intransparenz und Totzeit.</strong> Motivationsregulation gehört nicht dazu."},
  {"id":"k-idf-91","cat":"IdF · Stabsarbeit","q":"Welche Aussagen zum Einsatztagebuch (ETB) sind richtig?","a":"Wichtige <strong>Einsatzentscheidungen müssen eingetragen</strong> werden. Eintragungen erfolgen zeitnah, nicht erst nach der Umsetzung; eine digitale Führung ist nicht grundsätzlich vorgeschrieben."},
  {"id":"k-idf-96","cat":"IdF · Stabsarbeit","q":"Nennen Sie typische Fehler der Stabsarbeit und wie man sie vermeidet.","a":"Kein gemeinsames Lagebild, unklare Rollen, lückenhafte Dokumentation, mangelhafte Kommunikation, Kurzsichtigkeit (Tunnelblick), vernachlässigte Ablösung, Versorgung und Pressearbeit. Abhilfe: Lagebesprechungen, ETB, Kommunikationskonzept, Zeitstrahl, FOR-DEC."},
  {"id":"k-idf-98","cat":"IdF · Stabsarbeit","q":"Welche Bereiche sind ständige Mitglieder (SMS) des Verwaltungsstabes?","a":"Unter anderem <strong>Sicherheit und Ordnung, Soziales, Katastrophenschutz</strong> (auch Gesundheit, Umwelt, Polizei). Das <strong>Forstamt</strong> gehört nicht dazu."},
  {"id":"k-idf-99","cat":"IdF · Presse","q":"Wer richtet bei eingesetztem Krisenstab das Bürgertelefon ein?","a":"Die für die <strong>BuMA</strong> (Bevölkerungs- und Medienarbeit) zuständige Person des Krisenstabs. Der S5 der Einsatzleitung untersteht dann der BuMA."},
  {"id":"k-idf-100","cat":"IdF · Presse","q":"Wie erfolgt die Pressearbeit, wenn Krisenstab und S5 besetzt sind?","a":"<strong>Abgestimmt mit der BuMA.</strong> Mit Arbeitsaufnahme des Krisenstabes geht das Melde- und Berichtswesen auf die BuMA über; der S5 gibt nicht eigenständig Informationen weiter."}
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
    idf:  ['v-idf-brandschutz','v-idf-vblernen','v-idf-gk','v-idf-sonderbau','v-idf-stab','v-idf-s51','v-idf-s52','v-idf-s53','v-idf-s54','v-idf-s55','v-idf-sim-stabbau','v-idf-stabskarte','v-idf-presse','v-idf-sim-pressesim','v-idf-sim-warnsim','v-idf-zv','v-idf-ucpm'],
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
    'v-feuak-analyse':['v-feuak-stakeholder','v-feuak-risikoanalyse'],
    'v-idf-vb':['v-idf-brandschutz','v-idf-vblernen','v-idf-gk','v-idf-sonderbau'],
    'v-idf-stabhub':['v-idf-stab','v-idf-s51','v-idf-s52','v-idf-s53','v-idf-s54','v-idf-s55','v-idf-sim-stabbau','v-idf-stabskarte']
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
    'v-idf-vb':'IdF · Vorbeugender Brandschutz',
    'v-idf-stabhub':'IdF · Stabsarbeit',
    'v-idf-brandschutz':'IdF · Vorbeugender Brandschutz (Lernseite)',
    'v-idf-stab':'IdF · Stabsarbeit (Lernseite)',
    'v-idf-stabskarte':'IdF · Taschenkarte Stabsarbeit',
    'v-idf-vblernen':'IdF · VB-Prüfung lernen',
    'v-idf-gk':'IdF · Gebäudeklassen-Baukasten',
    'v-idf-sonderbau':'IdF · Sonderbauten',
    'v-idf-s51':'IdF · Stabsarbeit · Begrifflichkeiten','v-idf-s52':'IdF · Stabsarbeit · Gliederung der Einsatzleitung','v-idf-s53':'IdF · Stabsarbeit · Gliederung des Krisenstabs','v-idf-s54':'IdF · Stabsarbeit · Human Factors','v-idf-s55':'IdF · Stabsarbeit · Werkzeuge',
    'v-idf-sim-stabbau':'IdF · Simulation Stab aufbauen','v-idf-sim-pressesim':'IdF · Simulation Pressegespräch','v-idf-sim-warnsim':'IdF · Simulation Warn-Simulation',
    'v-idf-zv':'IdF · Zivile Verteidigung','v-idf-ucpm':'IdF · EU-Katastrophenschutz (UCPM)',
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
      // Ausgeblendete Kapitel, Blöcke und Reiter des Jahrgangs gehören nicht in die Suche
      const gone = (typeof JGUI!=='undefined'&&JGUI.goneEls) ? JGUI.goneEls(vid) : [], hid = n => gone.some(g => g.contains(n));
      el.querySelectorAll('.sec-h,.tc-name,.page-title,.def-box-label').forEach(h => {
        const t = h.textContent.trim(); if(t.length < 3 || hid(h)) return;
        idx.push({vid, lbl, title:t, snippet:'', boost:3, ch:chOf(h)});
      });
      el.querySelectorAll('.def-box p,.info-card p,.bl li,.step-desc,.hint p,.tc-sub,.ant-desc,.pillar ul li').forEach(p => {
        const t = p.textContent.trim(); if(t.length < 8 || hid(p)) return;
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
  // Eigene Inhalte des Jahrgangs: Kapitel, Ergänzungen, Reiter
  function jgEntries(){
    if(typeof JG==='undefined'||JG.isMaster()) return [];
    const d=JG.data(), out=[];
    const rid=s=>/^v-r-/.test(s)?s.slice(4):null;
    d.erg.forEach(e=>{
      const r=rid(e.seite), rt=r&&d.reiter.find(x=>x.id===r);
      if(r&&!rt) return;
      const lbl=r?'Eigener Reiter · '+rt.titel:(VIEW_LABELS[e.seite]||e.seite);
      out.push({vid:r?'v-jg-reiter':e.seite,lbl,title:(e.titel||'Ergänzung').trim(),snippet:String(e.text||'').slice(0,400),boost:e.typ==='kapitel'?3:1,jgReiter:r||null,ch:-1});
    });
    d.reiter.forEach(r=>out.push({vid:'v-jg-reiter',lbl:'Eigener Reiter',title:r.titel,snippet:r.beschr||'',boost:3,jgReiter:r.id,ch:-1}));
    return out;
  }
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
    const all = idx.concat(noteEntries(), jgEntries());
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
    reset(){ _indexBuilt=false; },
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
      if(r.jgReiter&&typeof JGUI!=='undefined'){ JGUI.openReiter(r.jgReiter); return; }
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
  if(typeof SPEISE!=='undefined'&&SPEISE.isOpen()){ SPEISE.close(); return 'handled'; }
  if(typeof RAUMPLAN!=='undefined'&&RAUMPLAN.isOpen()){ RAUMPLAN.close(); return 'handled'; }
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

/* ── Rückgängig/Wiederholen für Einstellungen, Lernstand, Klausurtermin, Notizen und Jahrgangs-Import: dauerhaft sichtbare Knöpfe statt kurz eingeblendetem „Rückgängig“ ── */
const UNDO=(function(){
  const u=[], r=[];
  const refresh=()=>{ document.querySelectorAll('.ud-undo').forEach(b=>{ b.disabled=!u.length; }); document.querySelectorAll('.ud-redo').forEach(b=>{ b.disabled=!r.length; }); };
  const html=()=>'<button type="button" class="btn btn-ghost ud-undo" aria-label="Rückgängig" title="Rückgängig"'+(u.length?'':' disabled')+'><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg></button><button type="button" class="btn btn-ghost ud-redo" aria-label="Aktion wiederholen" title="Wiederholen"'+(r.length?'':' disabled')+'><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg></button>';
  // undo/redo stellen jeweils den Stand vor bzw. nach der Aktion her
  function push(label,undo,redo){ u.push({label,undo,redo}); if(u.length>30) u.shift(); r.length=0; refresh(); }
  function back(){ const a=u.pop(); if(!a) return false; try{ a.undo(); }catch(e){} r.push(a); refresh(); TOAST.show(a.label+': rückgängig gemacht',{type:'ok'}); return true; }
  function again(){ const a=r.pop(); if(!a) return false; try{ a.redo(); }catch(e){} u.push(a); refresh(); TOAST.show(a.label+': wiederholt',{type:'ok'}); return true; }
  document.addEventListener('click',e=>{ const x=e.target.closest('.ud-undo,.ud-redo'); if(!x) return; e.preventDefault(); if(x.classList.contains('ud-undo')) back(); else again(); });
  return {push,html,refresh,undo:back,redo:again};
})();

const SETTINGS = (function(){
  return {
    resetTopics(){
      const snap=localStorage.getItem('bvi_progress');
      if(!confirm('Lernfortschritt wirklich zurücksetzen?')) return;
      PROGRESS.reset();
      const after=localStorage.getItem('bvi_progress'), put=v=>{ if(v===null) localStorage.removeItem('bvi_progress'); else localStorage.setItem('bvi_progress',v); PROGRESS.updateUI(); };
      UNDO.push('Themen-Fortschritt zurücksetzen',()=>put(snap),()=>put(after));
      TOAST.show('Themen-Fortschritt zurückgesetzt',{type:'ok'});
    },
    resetCards(){
      const snap=localStorage.getItem('bvi_fc');
      if(!confirm('Lernkarten-Lernstand wirklich zurücksetzen?')) return;
      localStorage.removeItem('bvi_fc');
      const redraw=()=>{ if(document.getElementById('v-flashcards').classList.contains('active')) FC.start(); }, put=v=>{ if(v===null) localStorage.removeItem('bvi_fc'); else localStorage.setItem('bvi_fc',v); redraw(); };
      redraw();
      UNDO.push('Lernkarten zurücksetzen',()=>put(snap),()=>put(null));
      TOAST.show('Lernkarten zurückgesetzt',{type:'ok'});
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
  let _view = null, _openKey = null;
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
      const k=key(), prev=ta.value;
      ta.value=''; localStorage.removeItem(k); updateBtn();
      if(!prev.trim()) return;
      const show=v=>{ const t=document.getElementById('notes-textarea'); if(t&&key()===k) t.value=v; try{ v?localStorage.setItem(k,v):localStorage.removeItem(k); }catch(e){} updateBtn(); };
      UNDO.push('Notiz löschen',()=>show(prev),()=>show(''));
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
  const CATS = ['laufbahn','ibk','vak','feuak','idf'];
  let deck=[], curIdx=0, flipped=false, sess={known:0,unknown:0};
  let activeFilters = new Set(['laufbahn']);
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
    const isPruefung=false;   // seit es nur noch die vier Prüfungsmodule gibt, ist „Alle“ die Prüfungsauswahl
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

  // Jahrgang: Karte löschen (nur für diesen Jahrgang), dazu Rückgängig/Wiederholen und die gelöschten Karten zurückholen
  function _jgBar(card){
    if(typeof JGUI==='undefined'||JG.isMaster()) return '';
    const n=JGUI.hiddenCards();
    return `<div class="jg-bar fc-jgbar">${card.own?'':`<button type="button" class="btn btn-ghost" onclick="FC.delCard('${card.id}')">Karte löschen</button>`}${JGUI.histHtml()}${n?`<button type="button" class="btn btn-ghost" onclick="JGUI.restoreCards()">${n} gelöschte wiederherstellen</button>`:''}</div>`;
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
      ${_jgBar(card)}
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
        <div class="jg-bar ud-bar" style="justify-content:center;margin:.8rem 0 0">${UNDO.html()}</div>
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
        activeFilters=activeFilters.has('starred')?new Set(['laufbahn']):new Set(['starred']);
      } else if(f==='own'){
        activeFilters=activeFilters.has('own')?new Set(['laufbahn']):new Set(['own']);
      } else if(f==='weak'){
        activeFilters=activeFilters.has('weak')?new Set(['laufbahn']):new Set(['weak']);
      } else if(f==='all'){
        activeFilters=new Set(['laufbahn']);
      } else if(f==='pruefung'){
        activeFilters=new Set(['ibk','vak','feuak','idf']);
        updateFilterButtons(); this.start(); return;
      } else {
        activeFilters.delete('starred'); activeFilters.delete('weak'); activeFilters.delete('own');
        if(activeFilters.size===CATS.length) activeFilters=new Set([f]);
        else if(activeFilters.has(f)){ activeFilters.delete(f); if(activeFilters.size===0) activeFilters=new Set(['laufbahn']); }
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
    delCard(id){
      const c=FLASHCARD_DATA.find(x=>x.id===id); if(!c||c.own||typeof JGUI==='undefined'||!JGUI.hideCard(id)) return;
      deck=deck.filter(x=>x.id!==id); _seen=_seen.filter(x=>(x&&x.id!==undefined?x.id:x)!==id);
      TOAST.show('Karte gelöscht – nur in deinem Jahrgang',{type:'ok'});
      renderCard();
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
      const put=v=>{ if(v===null) localStorage.removeItem('bvi_fc'); else localStorage.setItem('bvi_fc',v); FC.start(); };
      UNDO.push('Lernstand zurücksetzen',()=>put(snap),()=>put(null));
      TOAST.show('Lernstand zurückgesetzt',{type:'ok'});
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
    { const v0=document.getElementById(id); if(v0&&v0.hasAttribute('data-noabk')) return; }
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
    if(v.hasAttribute('data-nolp')) return;
    if(v._lp){ apply(v); return; }
    const list=v.querySelector('.pc .acc-list:not(.acc-cards)'); if(!list||items(v).length<3) return;
    v._lp={id};
    const cards=document.createElement('div'); cards.className='lp-cards';
    list.parentNode.insertBefore(cards,list);
    cards.onclick=e=>{ const c=e.target.closest('.lp-card'); if(c) open(v,+c.dataset.i); };
    apply(v);
  }
  function apply(v){
    const mode='ueber'; // Handy, Tablet und Desktop gleich: Kapitelkarten, ein Kapitel öffnet im eigenen Fenster (Vorheriges/Nächstes Kapitel)
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
    const cards=[...v.querySelectorAll('.lp-card')], its=cards.length&&cards[0].offsetParent?cards:items(v); let i=0;   // die Kapitelkarten (oder, ohne Karten, die Kapitel selbst) zeigen, wo man gerade liest
    its.forEach((d,k)=>{ if(d.getBoundingClientRect().top<window.innerHeight*0.4) i=k; });
    open(v,i,{focus:true});
  }
  // ── Lernkarten-Fenster neben der Lernseite (Desktop): ein-/ausblendbar ──
  const PMAP={
    'v-vak-jur-denken':['VAk · Ermessen und Verhältnismäßigkeit'],'v-vak-verwaltungsrecht':['VAk · Verwaltungsrecht','VAk · Verwaltungsvollstreckung und Rechtsschutz'],'v-vak-staatsrecht':['VAk · Staatsrecht'],
    'v-vak-einsatzrecht':['VAk · Einsatzrecht Berlin','VAk · Gefahrenabwehr','VAk · Fallbearbeitung'],'v-vak-dienstrecht':['VAk · Dienstrecht','VAk · Dienstrecht Fallklausur Berlin'],
    'v-ibk-ta':['IBK · Transaktionsanalyse'],'v-ibk-konflikt':['IBK · Konflikte'],
    'v-feuak-vwl':['FeuAK · VWL'],'v-feuak-haushalt':['FeuAK · Haushalt'],'v-feuak-pm':['FeuAK · PM'],'v-feuak-bedarfsplanung':['FeuAK · Bedarfsplanung'],
    'v-feuak-qm':['FeuAK · QM'],'v-feuak-beschaffung':['FeuAK · Vergabe'],
    'v-idf-brandschutz':['IdF · Brandschutz'],'v-idf-stab':['IdF · Stabsarbeit']
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
  mq.addEventListener&&mq.addEventListener('change',()=>{ const v=document.querySelector('.view.active'); if(v&&v._lp) apply(v); });
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
  const KEY='bvi_fc_custom', MODS=['Laufbahn','IBK','VAk','FeuAK','IdF'];
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
      const m=MODS.includes(k.modul)?k.modul:'Laufbahn', q=String(k.frage||'').slice(0,500), a=String(k.antwort||'').slice(0,1500);
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
  const TOTAL=3;
  function syncSetup(){
    THEME.render(); ACCENT.render();
  }
  // Lehrgangsliste der letzten Seite (neueste zuerst, der Master ist vorgewählt)
  function fillCourses(){
    const sel=document.getElementById('ob-jg'); if(!sel||sel.options.length) return;
    sel.innerHTML=JG.list().map(j=>'<option value="'+j.id+'"'+(j.id===JG.MASTER?' selected':'')+'>'+j.label+(j.id===JG.MASTER?' (Master)':'')+'</option>').join('');
  }
  function setStep(n){
    _step=Math.max(0,Math.min(TOTAL-1,n));
    document.querySelectorAll('.ob-step').forEach((el,i)=>el.classList.toggle('active',i===_step));
    document.querySelectorAll('.ob-dot').forEach((el,i)=>el.classList.toggle('active',i===_step));
    const nextBtn=document.querySelector('.ob-next');
    if(nextBtn) nextBtn.textContent=_step===TOTAL-1?'Los geht\'s!':'Weiter →';
    if(_step===0) syncSetup();
    if(_step===2) fillCourses();
  }
  return {
    init(){
      if(localStorage.getItem(KEY)) return;
      document.getElementById('onboarding-overlay')?.classList.remove('hidden');
    },
    next(){ if(_step<TOTAL-1){ setStep(_step+1); } else { this.finish(); } },
    // Letzte Seite: Master → nichts weiter; anderer Jahrgang → wählen und die Erklärseite zeigen
    finish(){
      const id=document.getElementById('ob-jg')?.value||JG.MASTER;
      this.close();
      if(id!==JG.MASTER){ JG.set(id); if(typeof JGUI!=='undefined') JGUI.help(true); }
    },
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
  if(cfg.topCats&&cfg.keys.cat){ try{ const c=localStorage.getItem(cfg.keys.cat); if(c&&cfg.Q.some(q=>q.cat===c)) _catFilter=c; }catch(e){} }   // gewählter Themenbereich bleibt erhalten
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
    // Themenbereich oben auf der Seite: immer sichtbar, gilt für Lernmodus und Prüfungsmodus
    const top=$('quiz-topcat');
    if(top&&cfg.topCats){
      const n=c=>Q.filter(q=>c==='all'||q.cat===c).length;
      top.innerHTML=['all',...cats].map(c=>'<button type="button" class="quiz-topcat-btn'+(_catFilter===c?' active':'')+'" data-cat="'+esc(c)+'" aria-pressed="'+(_catFilter===c)+'">'+(c==='all'?'Alle':esc(c))+' <small>'+n(c)+'</small></button>').join('');
      top.querySelectorAll('.quiz-topcat-btn').forEach(btn=>{btn.addEventListener('click',()=>{self.setCatFilter(btn.dataset.cat);});});
      if(cfg.keys.cat){ try{ if(_catFilter==='all') localStorage.removeItem(cfg.keys.cat); else localStorage.setItem(cfg.keys.cat,_catFilter); }catch(e){} }
    }
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
    const pool=cfg.topCats&&_catFilter!=='all'?Q.filter(q=>q.cat===_catFilter):Q;   // Prüfungsmodus: nur der gewählte Themenbereich
    _examQs=cfg.examCount?shuffle(pool.filter(q=>q.type!=='essay')).slice(0,cfg.examCount):pool;
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
    setCatFilter(cat){_catFilter=cat;renderCatBar();if(_mode==='exam'){stopTimer();renderExam();return;}buildOrder();renderFilterStatus();renderLearn();},
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
const IDFQ=makeQuiz({G:'IDFQ',view:'v-idf-altklausur',sfx:'-idf',minutes:45,html:true,examCount:25,topCats:true,
  keys:{bm:'bvi_idfq_bm',mastery:'bvi_idfq_mastery',srs:'bvi_idfq_srs',stats:'bvi_idfq_stats',cat:'bvi_idfq_cat'},
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
// Eingebettete Seiten (iframe): füllen den Platz zwischen Kopfleiste und Tableiste, ihre Reiter bleiben sichtbar
(function(){
  function fit(){
    var any=false;
    document.querySelectorAll('iframe.emb-frame').forEach(function(f){
      var v=f.parentElement;if(!v||!v.classList.contains('active'))return;
      any=true;
      var tb=document.getElementById('m-topbar'),bar=document.getElementById('m-tabbar');
      var top=tb?Math.max(0,Math.ceil(tb.getBoundingClientRect().bottom)):0;
      var bot=bar&&getComputedStyle(bar).display!=='none'?bar.offsetHeight:0;
      var rail=document.getElementById('m-rail'),left=rail&&getComputedStyle(rail).display!=='none'?Math.round(rail.getBoundingClientRect().right):0;
      /* fest am Bildschirm: die Seite scrollt nicht mit, die Reiter der Karte bleiben immer sichtbar */
      f.style.position='fixed';f.style.left=left+'px';f.style.top=top+'px';f.style.width=(innerWidth-left)+'px';
      f.style.height=Math.max(300,innerHeight-top-bot)+'px';
      var q=f.getBoundingClientRect();
      if(Math.abs(q.left-left)>1)f.style.left=(left-(q.left-left))+'px';
      if(Math.abs(q.top-top)>1)f.style.top=(top-(q.top-top))+'px';
    });
    /* Eingebettete Seiten: Tableiste ohne herausragenden Mittelknopf, damit zwischen beiden Leisten kein Spalt bleibt */
    document.body.classList.toggle('emb-on',any);
  }
  window.addEventListener('resize',fit);
  setInterval(fit,500);
  document.addEventListener('click',function(){setTimeout(fit,350)},true);
  window.addEventListener('popstate',function(){setTimeout(fit,350)});
})();
const CHANGELOG=(function(){
  const KEY='bvi_seen_version';
  const _MON=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  function _fmtTs(ts){
    const d=new Date(ts);
    return`${d.getDate()}. ${_MON[d.getMonth()]} ${d.getFullYear()}`;
  }
  const ENTRIES=[
    {v:'3.1.0',ts:'2026-10-30T09:00',items:[
      'Laufbahn-Lernkarten: Feuerwiderstand einheitlich in der EN-Schreibweise (REI 30, REI 60, REI 90, REI 120)',
      'Einstellungen → Navigationsleiste: Reihenfolge der sechs Tabs frei wählbar, benachbarte Tabs können sich einen Platz teilen (Auswahl beim Antippen, Symbol aus beiden Tabs mit Schrägstrich), höchstens 5 Plätze, Mittelknopf frei wählbar, Zurücksetzen',
      'Lernkarten: Modul-Auswahl (Alle, IBK, VAk, FeuAK, IdF) steht in einer Reihe; Symbol des Tabs „Pause/Karten“ nicht mehr abgeschnitten',
      'Gebäudeklassen-Baukasten: Prüf-Quiz ohne Hochhaus als Antwortoption und ohne Hochhaus-Fälle',
      'Abkürzung für Oberkante Fertigfußboden einheitlich OKFF (statt FOK)',
      'Version 3.1: Stabsarbeit in fünf Reiter, neue IdF-Tabs (Zivile Verteidigung, EU-Katastrophenschutz), Simulationen (Sonderbauten, Stab aufbauen, Pressegespräch, Warn-Simulation), Gebäudeklassen-Baukasten mit MBO-Katalog, neue Lernkarten nur zu den Prüfungen, Tab „Pause/Karten“',
      'Startseite: neuer Reiter „Pausenraum“ unter den Lernkarten',
      'Simulationen (Sonderbauten, Stab aufbauen, Pressegespräch, Warn-Simulation) bekommen beim Besuch einen Haken und zählen zum Themenfortschritt',
      'IdF → Stabsarbeit: „Stab aufbauen (Simulation)“ steht jetzt direkt hinter „Werkzeuge der Stabsarbeit“ und vor der Taschenkarte',
      'IdF: Taschenkarte Stabsarbeit steht jetzt als letzter Reiter in der Stabsarbeit; Planspiel-Trainer, Eskalationsleiter und „Lernunterlagen und Prüfungshinweise“ wieder entfernt',
      'Neue Simulationen (IdF): Stab aufbauen mit Vordruck-Trainer (Stabsarbeit), Pressegespräch, Eskalationsleiter Zivile Verteidigung, Warn-Simulation und Planspiel-Trainer mit eigenen Szenarien (Erkundung, Lagebeurteilung, Organisations- und Kommunikationsschema, Aufträge)',
      'Krisenstab: Grafiken zu Aktivierungsprozess, erster Verwaltungsstabssitzung (mit modifizierter Eisenhower-Matrix und Auftragsliste) und Folgesitzungen nachgebaut; Quiz-Frage 49 und Karte zur Zusammenlegung der Sachgebiete um „S4 mit S1“ und „S2 mit S3“ ergänzt',
      'Vorbeugender Brandschutz: Grafik „Türen im Gebäude“ (T30-RS, DS, DSS, RS je Nutzung) nachgebaut und in die Lernseite eingefügt',
      'IdF-Lernseiten: wichtige Grafiken der Zusammenfassung als eigene Diagramme nachgebaut (Zwei-Stäbe-Modell, Aufbau der Einsatzleitung, Krisenstab mit Zeitablauf und Zusammensetzung, Meldungsarten, Human Factors mit „dreckigem Dutzend“, Gesamtverteidigung, Pakt für den Bevölkerungsschutz, Regelkreis, Risikoanalyse, KRITIS-Sektoren, Weg der länderübergreifenden Hilfe, Warnsystem, Kapazitätenpyramide)',
      'IdF-Prüfungsfragen an die neuen Stabsarbeit-Seiten angepasst (Bürgertelefon liegt bei der BuMA, Schichtplanung des S1, Großeinsatzlagen, 7-Punkte-Plan Punkt 7 in der Laufbahn-Musterlösung)',
      'IdF → Stabsarbeit: fünf neue Reiter zu Begrifflichkeiten, Gliederung der Einsatzleitung, Gliederung des Krisenstabs, Human Factors und Werkzeugen der Stabsarbeit (aus der Zusammenfassung Oktober 2026); IdF Münster: neue Tabs „Zivile Verteidigung“, „EU-Katastrophenschutz (UCPM)“ und „Lernunterlagen und Prüfungshinweise“; Presse- und Öffentlichkeitsarbeit um Grenzen des Auskunftsanspruchs und Pressestatements ergänzt',
      'Eingebettete Seiten (Baukasten, Sonderbauten, VB-Prüfung lernen, Stabskarte): zwischen der Seiten-Leiste und der unteren Navigationsleiste bleibt kein Spalt mehr; der Prüfung-Knopf ragt dort nicht mehr über die Leiste',
      'IdF → Vorbeugender Brandschutz: neue Simulation „Sonderbauten“ – Quartier mit allen sieben Sonderbau-Typen der Lernseite, Röntgenblick und Quiz',
    ]},
    {v:'3.0.3',ts:'2026-10-29T10:00',items:[
      'Lernkarten komplett neu: 623 Karten ausschließlich aus den Prüfungen – neuer Tab „Laufbahn“ (313 Karten aus den Laufbahnklausuren Juni 2026 und Dezember 2023, ersetzt „Alle“), IBK (Transaktionsanalyse und Konflikte, 63), VAk (110), FeuAK (62) und IdF (75); alle Tabs stehen oben in einer Reihe',
      'IdF → Vorbeugender Brandschutz: Tabs „Brandabschnitt-Haus in 3D“, „Brandschutzplaner“ und „Sonderbau-Quartier“ entfernt',
      'IdF → Vorbeugender Brandschutz → Lernseite: Inhalte der Zusammenfassung Oktober 2026 (Prüfschemata bis Schule) eingearbeitet – neue Punkte Begriffe, Baurecht, Grundsatzanforderungen, Baustoffe und Bauteile, Aufzüge, Versammlungsstätten, Schulen; Ergänzungen bei Rettungswegen, baulichem Brandschutz, Hochhäusern, Verkaufs-, Beherbergungs-, Industriebau und Garagen',
      'Lernkarten: „Alle“ wird markiert, wenn man darauf tippt oder alle vier Module einzeln auswählt',
      'Brandwand: REI 90-M gilt nach europäischer Norm (EN 13501-2), nach deutscher Norm (DIN 4102) heißt es F 90-A; „REIM 90“ überall durch REI 90-M ersetzt (Lernseite, Quiz)',
      'IdF → Vorbeugender Brandschutz: Gebäudeklassen-Baukasten in drei Varianten zur Auswahl, jeweils mit allen 80 Bauteilen der MBO (Rundgang, Katalog mit Vergleich, Abnahme zum Ausfüllen); neuer Bauteil-Katalog aus MBO und Lernseite mit 12 dokumentierten Abweichungen',
      'Lernseite Vorbeugender Brandschutz und Baukasten nach der MBO korrigiert: GK 2 im Obergeschoss feuerhemmend, Stichflur 15 m nur zum Sicherheitstreppenraum, Rauchabschnitte als Sollvorschrift, Brandabschnitte ohne feste Fläche, Tür zur Nutzungseinheit dicht schließend, Hubrettung ab Anleiterhöhe 8 m, Sicherheitsbeleuchtung ab 13 m Höhe, Brandwand-Abstand 5 m, Breite 2,50 m nur für Seitenteile und Oberlichte, Trennwände in Wohngebäuden GK 1/2 entfallen',
      'Baukasten: nur noch eine Version („Gebäudeklassen-Baukasten“, bisher Variante 2) mit Bauteil-Katalog; Katalog auf die 32 Bauteile mit Feuerwiderstandsangaben gekürzt, ohne Hochhaus; Hinweiskästen in hellem Design lesbar; Navigationsleiste bleibt beim Scrollen sichtbar; Varianten 1 und 3 sowie der alte Baukasten entfernt',
      'Baukasten: Matrix-Tab lädt wieder (Fehler bei der Brandwand-Zeile behoben)',
      'Baukasten: Gruppen-Chips im Katalog umbrechen statt zu scrollen (am PC nicht bedienbar); Matrix: Tab „Nach Bauteil“ steht jetzt vor „Nach Gebäudeklasse“ und ist die Startansicht',
      'Untere Leiste: Tab „Pause/Karten“ mit geteiltem Symbol (Tasse / Karten); beim Antippen erscheint eine Auswahl mit Lernkarten und Pausenraum; am PC steht „Lernkarten“ zusätzlich in der Seitenleiste',
      'Alle bisherigen Karten ohne Klausurbezug (GAL, SFS, HLFS und die Theoriekarten der vier Module) entfernt; Filter und Fortschritt zeigen nur noch IBK, VAk, FeuAK und IdF',
    ]},
    {v:'3.0.2',ts:'2026-10-27T00:10',items:[
      'Lernseite Vorbeugender Brandschutz · Brandwände: Die Anforderung REIM 90 ist als „Besonders wichtig“ hervorgehoben und aufgeschlüsselt: REI 90-M (DIN EN 13501-2) und F 90-A (DIN 4102), mit R, E, I, M und A erklärt; in den Simulationen steht überall dieselbe Schreibweise',
      'Alle vier 3D-Simulationen (Brandabschnitt-Haus, Gebäudeklassen-Baukasten, Brandschutzplaner, Sonderbau-Quartier) übernehmen jetzt Farben und Hintergrund der App (Dunkel, Hell und Beige): kein blauer Hintergrund mehr, Bedienfelder und 3D-Hintergrund in den App-Farben',
      'Gebäudeklassen-Baukasten: Neuer Reiter „Matrix“ mit der kompletten Lösung der Übungsmatrix (Tabelle Seite 133, 12 Bauteile × GK 1 bis 5): nach Gebäudeklasse (gleiche Anforderungen zusammengefasst, nach Farbe sortiert), nach Bauteil (gleiche Zeilen zusammengefasst, fünf Farbfelder je Zeile) und zum Üben mit Auswahlfeldern, Auswertung und Punktzahl bis 60',
      'Gebäudeklassen-Baukasten · Bauteile nach BauO NRW 2018 geprüft: Die Decke über dem Keller ist jetzt die Kellerdecke und folgt der Kellerzeile (§ 31 Abs. 2); neu die Decke zum Dachraum mit Schalter „Aufenthaltsräume über dem Dachgeschoss möglich“ (§ 31 Abs. 1, § 29 Abs. 4); Brandwand: Abstand zur Innenecke 5 m (MBO, Lernseite) bzw. 3 m (BauO NRW), bei GK 1 bis 3 bis unter die Dachhaut; Hinweis zu Trennwänden in Wohngebäuden der GK 1 und 2',
      'Gebäudeklassen-Baukasten: GK 1 und GK 2 getrennt – nach § 27 Abs. 1 BauO NRW 2018 sind tragende Teile im Obergeschoss bei GK 2 feuerhemmend (bei GK 1 keine Anforderung), im Keller bei beiden feuerhemmend; bei GK 1 und 2 ist kein notwendiger Treppenraum erforderlich (§ 35 Abs. 1)',
      'Duell: Ein roter Hinweis ganz oben sagt klar, dass das Duell im Schul-WLAN (und in Gast- oder Firmennetzen) nicht funktioniert, und empfiehlt mobile Daten (WLAN aus, Hilfsdienst an), einen Hotspot vom Handy oder das WLAN zu Hause',
      'Duell: Verbindung im selben WLAN zuverlässiger – beim Beitreten bleibt die Kamera an, bis der Antwort-Code erzeugt ist (dann nennt das Gerät seine echte WLAN-Adresse statt eines .local-Namens, den manche Android-Geräte nicht auflösen können); ist die Kamera schon erlaubt, gilt das auch beim Eröffnen. Der Hinweis bei einem Fehlschlag nennt jetzt die Geräteisolierung von Gast- und Schulnetzen',
      'VB lernen · Standsicherheit: Die 120 Minuten heißen jetzt „hochfeuerbeständig“ (F120) wie in der Unterrichtsfolie, mit Raumabschluss bei den Besonderen Fällen',
      'Gebäudeklassen-Baukasten · Bauteile: Hinter F30, F60, F90 steht jetzt die bauaufsichtliche Benennung (feuerhemmend, hochfeuerhemmend, feuerbeständig); die Kachel Kellergeschoss steht links, Obergeschoss in der Mitte; beim Hochhaus sind die Werte nach der Muster-Hochhaus-Richtlinie ergänzt (tragende und aussteifende Bauteile feuerbeständig und nichtbrennbar, über 60 m Höhe 120 Minuten; Wände der notwendigen Treppenräume wie die tragenden Bauteile; Trennwände zwischen Nutzungseinheiten feuerhemmend)',
      'Gebäudeklassen-Baukasten: Das Gebäude steht sofort beim Öffnen da (die Stockwerke wuchsen vorher per Animation ein und blieben auf manchen Geräten unsichtbar)',
      'Drei weitere 3D-Lernsimulationen (React und three.js) im IdF-Bereich „Vorbeugender Brandschutz“, passend zur Lernseite: der Gebäudeklassen-Baukasten (Gebäude hochziehen, Gebäudeklasse und Anforderungen an die Bauteile live sehen, Prüf-Quiz), der Brandschutzplaner (ein Geschoss selbst planen, vom Prüfer abnehmen lassen, Evakuierung und Fehlerpläne) und das Sonderbau-Quartier (Röntgenblick auf Hochhaus, Verkaufsstätte, Beherbergung, Industrie und Garage, Prüfreihenfolge, Zuordnen)',
      'Neu im IdF-Bereich „Vorbeugender Brandschutz“: Das Brandabschnitt-Haus in 3D (React und three.js) – ein aufgeschnittenes Haus zum Drehen und Zoomen. Drei Modi: Erkunden (die vier Ziele nach § 14 MBO mit Wortlaut), Brand (Feuer und Rauch lassen sich per Zeitregler ausbreiten, vier Schutzmaßnahmen schalten die Ausbreitung ein oder aus) und Aufgabe (Menschen retten, mit Sternen und Quiz)',
    ]},
    {v:'3.0.1',ts:'2026-10-26T20:00',items:[
      'VB lernen: Alle fünf Reiter haben denselben kompakten Aufbau – Definition bzw. Grundsatz oben, darunter der Merksatz, dann kleine Farbkacheln „Auf einen Blick“ (Punkte mit Komma getrennt), dann die Simulation; „Ausführlich erklärt“ entfällt. Aufenthaltsraum hat jetzt die Kachel „Bedingt“, Standsicherheit zeigt „mind. 30/60/90/120 Min.“ und die Kachel „Besondere Fälle“, Baustoffe nennt Abtropfen und § 26 MBO in den Kacheln',
      'VB lernen · Ziele: Der Merksatz steht oben, die vier Ziele sind nummerierte, aufklappbare Kacheln („Entstehung verhindern“, „Ausbreitung verhindern“, „Rettung ermöglichen“, „Löschen ermöglichen“) mit dem jeweiligen Satz aus § 14 MBO (alle beim Öffnen zugeklappt); die ausführliche Erklärung entfällt',
      'VB lernen: Die Definition (bei Aufenthaltsraum und Nutzungseinheit) steht jetzt als hervorgehobene Karte ganz oben direkt unter dem Titel',
      'VB lernen: Die Texte in „Auf einen Blick“ stehen als Stichpunkte mit hellem Strich in breiten Farbkacheln (statt in schmalen Pillen)',
      'VB lernen: Neues Seitenlayout auf allen fünf Reitern – oben „Auf einen Blick“ als farbige Kacheln (bei Standsicherheit mit den Minutenzahlen), dann „Ausprobieren“ mit der Simulation, darunter „Ausführlich erklärt“',
      'Startseite: Der FAQ-Hinweis „Vor der Anreise“ ist entfernt; die FAQ bleibt im Stundenplan',
      'VB lernen: Aufbau wie die Taschenkarte Stabsarbeit – alle fünf Themen (Ziele, Aufenthaltsraum, Nutzungseinheit, Baustoffe, Standsicherheit) sind Reiter in einer festen Navigationsleiste oben; die Themenliste sowie Quiz und Sortieren sind entfallen',
      'VB-Prüfung lernen und Taschenkarte Stabsarbeit: Alle Aktionsknöpfe (Weiter, Prüfen, Nochmal, Quiz starten, Brand starten, Text kopieren usw.) stehen rechts',
      'Taschenkarte Stabsarbeit: „Weiter“ im Zeichen-Quiz steht rechts; die Zeichen im Quiz passen in ihre Kästen; die Reiter bleiben auch am Desktop beim Scrollen sichtbar (eingebettete Seiten stehen fest unter der Kopfleiste)',
      'VB-Prüfung lernen: Die Zurück-Taste (Handy und Browser) führt erst aus dem Thema, Quiz oder Sortierspiel zurück zur Themenliste und danach erst aus der Seite; „Weiter“ im Quiz steht rechts; die Kopfleiste der eingebetteten Seiten verdeckt die Reiter nicht mehr',
      'IdF Münster: Die Themen sind neu geordnet. „Vorbeugender Brandschutz“ und „Stabsarbeit“ sind jetzt eigene Kacheln; darin liegen jeweils die Lernseite und das interaktive Lernen (Brandofen, Quiz, Sortieren bzw. Taschenkarte). Die interaktiven Seiten bekommen wie die übrigen Themen einen Haken, sobald man sie geöffnet hat, und zählen zum IdF-Fortschritt.',
      'IdF · Vorbeugender Brandschutz: Neue interaktive Lernseite „VB-Prüfung lernen“ mit Definitionen und Aufgaben aus dem Unterricht (Ziele des Brandschutzes, Aufenthaltsraum, Nutzungseinheit, Baustoffklassen, Standsicherheit im Brandfall). Zum Ausprobieren gibt es einen Brandprüfstand, einen Brandofen mit Zeitregler, einen Grundriss und ein Gebäude zum Erkunden, dazu Quiz und Sortierspiel. Neue Themen lassen sich leicht ergänzen.',
      'Taschenkarte Stabsarbeit: Taktische Zeichen nach der Vorlage neu gezeichnet (Führungsstellen mit Fahne, Leitstelle mit Dach, Führungskräfte mit schwarzer Spitze, Personen, Schäden, Brände als rote Zacken, Gefahren, Fahrzeuge, Patientenablage, Versorgungsstellen mit schwarzem Boden, Größenordnung als Punkte); die ausgewählte Palette in der Lagerhalle ist klar hervorgehoben und wird erst mit Plus in den Rechner gelegt.',
      'IdF · Stabsarbeit: Neue interaktive Taschenkarte mit 7-Punkte-Plan, Stabsstruktur, taktischen Zeichen, Katastrophenschutzlager NRW (Lagerhalle im Querschnitt mit antippbaren Paletten und Anforderungsrechner) und der EVA-Übung zum Sachgebiet 4 Versorgung; zu jeder der drei Aufgaben gibt es am Ende eine recherchierte Musterlösung mit Quellen.',
      'Stundenplan: In allen Jahrgängen außer dem Master gibt es unter der FAQ den Knopf „Raumplan IdF Münster“; er öffnet das Gelände in 3D mit allen Gebäuden, Parkplätzen und Sammelplätzen, auch wenn der eigene Plan keine Räume enthält',
      'Stundenplan IdF Münster: Frühstück, Mittagessen und Abendessen nennen den Speiseraum (Gebäude A3); ein Tipp auf Frühstück oder Abendessen zeigt A3 im Raumplan, im Speiseplan gibt es dazu einen Knopf',
      'Stundenplan IdF Münster: Jeder Tag zeigt jetzt auch Frühstück (6:30 bis 7:45 Uhr) und Abendessen (17:00 bis 19:00 Uhr, Essenausgabe bis 18:30 Uhr); am Abreisetag und in der BABZ-Woche entfällt das Abendessen bzw. beides',
      'Feinschliff: weichere Ecken wie bei iOS auf Karten, Listen und Knöpfen, Zahlen mit gleich breiten Ziffern, ausgewogene Überschriften, der Speiseplan lässt sich nach unten wischen, und bei sehr langsamer Verbindung zeigt die App nach 3 Sekunden die gespeicherte Seite statt zu warten',
      'Prüfung: Die wichtigen Klausuren (Laufbahnklausuren Juni 2026, Altklausur-Quiz IdF, Klausur 08/2026, die beiden oberen von VAk Berlin und der Führungsdienstsimulator) haben jetzt einen deutlich sichtbaren orangen Farbverlauf, auch im beigen und hellen Design',
      'Altklausur-Quiz IdF: Oben auf der Seite lässt sich der Themenbereich wählen – Alle, Vorbeugender Brandschutz oder Stabsarbeit. Im Lernmodus und im Prüfungsmodus (25 Fragen) kommen dann nur Fragen dieses Bereichs; die Auswahl bleibt beim nächsten Öffnen erhalten',
      'Datenschutz: Die Angabe zu Notizen im Stundenplan ist entfernt, weil es sie nicht mehr gibt',
      'Startseite: Der Link zur FAQ vor der Anreise öffnet den Stundenplan jetzt ganz oben bei der FAQ statt bei der aktuellen Einheit',
      'FAQ zu den Standorten: Für das IdF Münster sind jetzt Essenszeiten, Getränke, Tagesablauf, Sporthalle, Strom und Netz sowie Waschmöglichkeiten eingetragen; der Laptop wird in keiner Antwort mehr erwähnt',
      'Lernseiten: Auf dem Desktop gibt es jetzt wie auf Handy und Tablet die Kapitelkarten; ein Kapitel öffnet im eigenen Fenster mit „Vorheriges Kapitel“ und „Nächstes Kapitel“. Auf dem Tablet war die Leiste mit diesen Knöpfen unter der Tab-Leiste verdeckt und ist jetzt sichtbar. Die Seitenübersicht „Auf dieser Seite“ am rechten Rand entfällt dafür',
      'Stundenplan IdF Münster: Ein Tipp auf „Mittagessen“ öffnet den Speiseplan des Tages (Stammessen, Beilage, vegetarisch, Dessert mit den Kürzeln vom Aushang); die anderen Tage der Woche stehen darunter, der gewählte Tag ist hervorgehoben. Der Speiseplan der aktuellen Woche ist eingetragen',
      'Raumplan: Das Gelände ist jetzt nach der detaillierten Übersichtskarte des Instituts nachgebaut – Gebäudeformen und Farben nach Nutzung (Unterrichtsgebäude, Sporthalle B4, Werkstatt und Fahrzeughalle B2 und B3, Parkhaus), Parkplätze P1 bis P7, Sammelplätze S1 bis S3, Haltestellen und Wolbecker Straße; die Legende ist angepasst',
      'Stundenplan IdF Münster: In den Vorbeugender-Brandschutz-Wochen (Gruppe 1 die ersten drei, Gruppe 2 die letzten drei Wochen) zeigt „Erreichbarkeiten“ jetzt die Ansprechpersonen des VB mit Durchwahl (Heiko Böcking, Joachim Achtert, Stephanie Vöge), die VB-E-Mail-Adresse und die Adresse für Abwesenheiten. Vorher standen dort die Kontakte der Stabswochen'
    ]},
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
      'Einstellungen „Nächste Klausur“: Die Auswahl „Der Countdown öffnet“ folgt jetzt dem Prüfung-Tab – eigene Prüfungen des Jahrgangs stehen dort zur Wahl, ausgeblendete nicht mehr; ein nicht mehr vorhandenes Ziel fällt auf „Automatisch“ zurück',
      'Beige: Beim Verschieben des Hintergrund-Reglers bleiben die Kacheln so heller als der Hintergrund wie in der Voreinstellung (vorher wurden sie schwächer abgehoben), ebenso eingelassene Flächen und Linien',
      'Stundenplan: Die Abschnitte der Fortschrittsleiste unter der Kalenderwoche sind größer, mit KW-Nummer, und springen beim Antippen direkt zur jeweiligen Woche',
      'Stundenplan: Die Navigation bei Anreise und Abreise startet gleich mit „Auto“ als Verkehrsmittel',
      'Stundenplan Zivile Verteidigung (KW 50): Montag „Anreise“ 07:45–11:00 mit Navigation zur BABZ in Ahrweiler (Ramersbacher Str. 95), Programm ab mittags; Freitag „Abreise“ 14:00–14:45 (ohne Gewähr) zur Heimadresse',
      'Stundenplan IdF Münster: Die ganze Zeile „Anreise“ bzw. „Abreise“ ist der Knopf zu Maps, es öffnet sich keine Notiz mehr (nur „Adresse ändern“ öffnet die Adresseingabe)',
      'Stundenplan IdF Münster: „Abreise“ startet die Navigation zu deiner Heimadresse, die du dort einmal festlegst. Sie bleibt nur auf deinem Gerät und steckt in keiner Sicherung und keinem Export',
      'Stundenplan IdF Münster: „Anreise“ ist antippbar und startet die Navigation zum Institut der Feuerwehr NRW (Wolbecker Straße 237, Münster) in der Karten-App',
      'Hilfe: neuer Abschnitt „Am Ende eures Lehrgangs“ – Jahrgänge können dir am Ende ihres B VI (einmal) ihre App-Datei schicken, damit sie fest in der App hinterlegt wird',
      'Jahrgänge: Lernkarten lassen sich löschen (auch Karten des Masters, nur im eigenen Jahrgang; „Karte löschen“ unter der Lernkarte, „gelöschte wiederherstellen“ holt sie zurück). Die gelöschten Karten stehen im Jahrgangs-Export und gelten für alle, die ihn einlesen',
      'Jahrgänge: „Rückgängig“ ist nicht mehr nur kurz eingeblendet, sondern dauerhaft sichtbar neben „Seite bearbeiten“ (auch bei Prüfungen, Lernkarten und im Karten-Fenster). Daneben gibt es „Wiederholen“, das die zurückgenommene Aktion erneut ausführt',
      'Jahrgänge: Prüfungen und Klausurvorbereitung bleiben im Gleichklang – eine im Prüfung-Tab hinzugefügte Prüfung erscheint auch als Kachel auf der Übersichtsseite ihres Reiters (IBK, VAk, FeuAK, IdF), eine gelöschte Prüfung verschwindet dort ebenfalls, und umgekehrt',
      'Jahrgänge: Unter „Kürzel und Standorte“ lassen sich jetzt auch die Kürzel (IBK, VAk, FeuAK, IdF) ändern. Kürzel und Ort ersetzen die Standardnamen überall, wo sie auf der Seite stehen, und stehen im Jahrgangs-Export',
      'Rückgängig und Wiederholen sind jetzt auch an den übrigen Stellen dauerhaft sichtbar statt nur kurz eingeblendet: oben in den Einstellungen (Fortschritt und Lernkarten zurücksetzen, Klausurtermin entfernen, Jahrgang importieren oder verwerfen), nach „Lernstand zurücksetzen“ bei den Lernkarten und bei den Notizen (Notiz löschen)',
      'Stundenplan in Jahrgängen: Zwischen der Reiterkarte (IBK, VAk, FeuAK, IdF) und der Karte darunter ist jetzt eine kleine Lücke',
      'Pausenraum: neues Spiel „Einsatzleitung-Snake“ direkt unter dem Duell. Du steuerst einen Trupp mit Schlauchleitung, sammelst Feuerlöscher und meidest die Flammen. Als Herausforderung wählbar: „Atemluft“ (der Vorrat sinkt, Druckluftflaschen füllen auf) und „Löschwasser“ (Aufnehmen löscht einen Brandherd), dazu drei Einsatzstufen',
      'Pausenraum: neues Spiel „Solitär“ direkt unter dem Snake – Klondike mit Flammen, Löschern, Äxten und Leitern als Kartenfarben und Feuerwehr-Namen für Ass, Bube, Dame und König. Karten antippen oder ziehen (die Karte hängt am Greifpunkt hinter dem Zeiger her und kippt dabei in 3D), Doppeltipp führt den passenden Zug aus (zuerst ins Fundament, sonst auf eine Spalte), dazu Rückgängig, Wiederholen, Tipp, Ziehen 1 oder 3 und einschaltbare Hinweise beim Ziehen',
      'Stundenplan IdF Münster: Ein Tipp auf eine Einheit mit Raum öffnet den Raumplan als 3D-Ansicht des Geländes – die Kamera fährt zum Gebäude, es leuchtet orange und über ihm steht die Raumnummer (bei mehreren Räumen je ein Chip, zum Beispiel bei der Klausur). Ziehen dreht, zwei Finger oder das Mausrad zoomen, dazu Draufsicht und Legende. Die Notizen zu Einheiten gibt es dafür nicht mehr',
      'Ladebildschirm: Solange die Seite startet, zeigt sie jetzt einen Platzhalter-Bildschirm (graue Flächen im Aufbau der Startseite, in deinem Farbschema) statt einer leeren Fläche; sobald die App bereit ist, blendet er sich aus. Gilt für die Website und die Android-App',
      'Pausenraum: neues Spiel „Minesweeper“ direkt unter dem Solitär – im Dunkeln Brandherde aufspüren. Vier Stufen (Leicht 12, Mittel 30, Schwer 56, Sehr schwer 72 Brandherde), Antippen sucht ab, langes Drücken, Rechtsklick oder der Schalter „Markieren“ setzt die Markierung, Doppeltipp auf eine Zahl öffnet die Nachbarfelder. Dazu Tipp, Zeit und Rekord je Stufe sowie ein leuchtender Wärmebild-Cursor',
      'Neu: FAQ zu den Standorten. Im Stundenplan gibt es ganz oben die eingeklappte Karte „Vor der Anreise: FAQ“ mit Fragen zu Unterkunft, Verpflegung, Sport, Anreise, Kleidung und Organisation (für IdF Münster, IBK Heyrothsberge, VAk Berlin und FeuAK Hamburg). Fragen ohne Antwort werden ausgeblendet. 14 Tage vor dem ersten Plantag zeigt die Startseite einen Link dorthin. Jahrgänge können Antworten ändern und eigene Fragen in ihrer Jahrgangsdatei ergänzen',
      'Hinweis für iPhone und iPad: Apple löscht die Daten einer Website in Safari nach etwa 7 Tagen ohne Besuch. Das steht jetzt unter Einstellungen, bei der App-Installation und in der Hilfe – mit dem Rat, die App auf den Home-Bildschirm zu legen und ab und zu zu sichern',
      'Die Flamme im Kopf der Seite flackert deutlicher und ist jetzt gut zu erkennen',
      'Sicherung: Gewählter Jahrgang, eigene Jahrgangs-Änderungen und die Plan-Ansicht werden jetzt mitgesichert und wieder eingespielt (vorher gingen sie beim Einspielen verloren)',
      'Duell: Eigene Fragen des Jahrgangs zählen jetzt mit, wenn beide Spieler genau dieselben haben (die Lobby zeigt das an); sonst kommen nur die mitgelieferten Fragen dran',
      'Jahrgang importieren: Rückfrage mit dem Jahrgang der Datei und Wahl „Ergänzen“ oder „Stand ersetzen“ (mit Rückgängig); die Suche findet eigene Kapitel, Ergänzungen und Reiter und zeigt ausgeblendete nicht mehr; die Erklärseite nennt Datenverlust-Risiko, Export statt Sicherung und weitere Grenzen',
      'Ersteinrichtung nur noch 2 Seiten plus Lehrgangs-Auswahl: Wer einen anderen Jahrgang als den Master wählt, landet auf „So funktioniert dein Jahrgang“ und kommt mit „Verstanden, lass mich in die App“ zur Startseite; aus den Einstellungen gibt es den Knopf nicht. Neu auf der Erklärseite: Die App-Datei lässt sich an den Jahrgang nach euch weitergeben',
      'Hintergrund-Regler (Einstellungen → Darstellung): Die Hintergrundhelligkeit lässt sich stufenlos von Schwarz bis Weiß einstellen, Karten, Linien und Texte passen sich an und bleiben lesbar; im Beige-Schema mit warmem Farbton',
      'Neues Farbschema „Beige“ (Einstellungen → Darstellung): warmer Leinen-Ton statt Grauweiß; in der Android-App mit passendem Startsymbol und beigem Startbild',
      'Abkürzungsverzeichnis: Dort wird kein Wort mehr als Abkürzung markiert',
      'Nächste Klausur (Einstellungen → Lernen): Der Termin lässt sich mit „Termin entfernen“ wieder löschen (mit Rückgängig), und du wählst, welche Prüfung der Countdown öffnet',
      'Stundenplan: „Wichtige Termine in den Kalender übernehmen“ nimmt nur Schlüsseltermine (Akzentfarbe) und Exkursionen (grün) mit; „Kalender abonnieren“ und die Anzeige des aktiven Plans im Master sind entfernt',
      'Jahrgänge: Die Erklärseite beschreibt jetzt, dass jeder Jahrgang eine Person bestimmt, die die Seite pflegt, den Jahrgang exportiert und in der WhatsApp-Gruppe teilt; alle anderen importieren die Datei. Klausurtermine als Countdown für Jahrgänge sind entfernt.',
      'Jahrgänge: „So funktioniert dein Jahrgang“ in den Einstellungen erklärt, warum es die Seite gibt und wie sie funktioniert; „Prüfungen bearbeiten“ steht oben auf der Prüfungsseite, auf Übersichtsseiten lassen sich Reiter ausblenden und eigene Reiter mit Kapiteln anlegen; eigene Fragen können Single-Choice, Multiple-Choice oder Freitext sein; die Ergänzung im Kapitel hat nur noch Text und Bild',
      'Jahrgang einrichten (Einstellungen → Lehrgang): Checkliste mit Stundenplänen, Lehrgangs-Link, Standorten und Lernkarten des Jahrgangs; die Datei trägt alles mit',
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
/* ── Heimadresse für „Abreise“: nur auf diesem Gerät. Sie steckt in keiner Sicherung, keinem Jahrgangs-Export und keiner Kalenderdatei
   (BACKUP.keep schließt sie aus, BACKUP.clean lehnt sie ab). ── */
const HOME=(function(){
  const KEY='bvi_heimadresse';
  let box=null;
  const get=()=>{ try{ return (localStorage.getItem(KEY)||'').slice(0,160); }catch(e){ return ''; } };
  const clean=v=>String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,160);
  const url=a=>'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='+encodeURIComponent(a);
  function build(){
    box=document.createElement('div'); box.id='hm-ov'; box.hidden=true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Heimadresse');
    box.innerHTML='<div class="cu-card"><button class="sh-x" aria-label="Schließen">×</button><div class="sh-t" style="padding:0">Meine Heimadresse</div>'
      +'<p class="m-t2" style="margin:6px 0 12px">Mit ihr startet „Abreise“ im Stundenplan die Navigation nach Hause. Die Adresse bleibt nur auf diesem Gerät: Sie wird <strong>nicht gesichert und nicht exportiert</strong>.</p>'
      +'<label>Adresse<input id="hm-a" class="m-input" type="text" maxlength="160" autocomplete="street-address" placeholder="Straße Nr., PLZ Ort"></label>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button type="button" class="btn btn-gold" id="hm-s">Speichern</button><button type="button" class="btn btn-ghost" id="hm-d">Adresse löschen</button></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click',e=>{ if(e.target===box||e.target.closest('.sh-x')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
    box.querySelector('#hm-s').onclick=()=>{ const v=clean(box.querySelector('#hm-a').value); if(!v){ box.querySelector('#hm-a').focus(); return; } try{ localStorage.setItem(KEY,v); }catch(e){} close(); TOAST.show('Heimadresse gespeichert',{type:'ok'}); };
    box.querySelector('#hm-d').onclick=()=>{ clear(); close(); TOAST.show('Heimadresse gelöscht',{type:'ok'}); };
    box.querySelector('#hm-a').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); box.querySelector('#hm-s').click(); } });
  }
  function edit(){
    if(!box) build();
    box.querySelector('#hm-a').value=get();
    box.querySelector('#hm-d').hidden=!get();
    box.hidden=false; box.querySelector('#hm-a').focus({preventScroll:true});
  }
  function close(){ if(!box||box.hidden) return; box.hidden=true; if(typeof IDF_PLAN!=='undefined') IDF_PLAN.redraw(); }
  function clear(){ try{ localStorage.removeItem(KEY); }catch(e){} }
  return {get,edit,url,clear};
})();

const IDF_PLAN = (function(){
  // Eintrag: "Zeit|Titel|Art|Raum|Hinweis" · Zeit = UE ("1-2") oder Uhrzeit ("09:00-09:15", "19:00", "EVA")
  // Art: hi = Schlüsseltermin, ex = Exkursion, ar = Anreise/Abreise/frei
  const UE_S=['07:45','08:30','09:45','10:30','11:30','12:15','14:00','14:45'];
  const UE_E=['08:30','09:15','10:30','11:15','12:15','13:00','14:45','15:30'];
  const TEL={
    spahl:[['Jörn Ruschenburg','-3202'],['Frank Spahlholz','-3223']],
    vb:[['Heiko Böcking','-2220'],['Joachim Achtert','-2213'],['Stephanie Vöge','-2222'],['E-Mail VB','vb@idf.nrw.de'],['Abwesenheiten melden','poststelle@idf.nrw.de']],
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
    [50,7,'Zivile Verteidigung','2026-12-07','both',[
      ['07:45-11:00|Anreise|ar||BABZ Ahrweiler, Ramersbacher Str. 95|babz','ab mittags|Programm der BABZ|||Ahrweiler · Start voraussichtlich Montag mittags'],
      ...Array(3).fill(['ganztägig|Programm der BABZ|||Ahrweiler']),
      ['ganztägig|Programm der BABZ|||Ahrweiler','14:00-14:45|Abreise|ar||Termin ohne Gewähr']],TEL.babz,
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
  // Anreise: Tipp öffnet die Karten-App mit Navigation zum IdF Münster (Android/iOS öffnen Google Maps bzw. fragen nach der Karten-App)
  const mapsTo=a=>'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='+encodeURIComponent(a);   // travelmode=driving: gleich „mit dem Auto“
  const IDF_MAPS=mapsTo('Institut der Feuerwehr Nordrhein-Westfalen, Wolbecker Straße 237, 48155 Münster');
  const BABZ_MAPS=mapsTo('BABZ, Ramersbacher Str. 95, 53474 Bad Neuenahr-Ahrweiler-Godeneltern');
  const NAV_PIN='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  // „Anreise“ → Navigation zum IdF; „Abreise“ → Navigation zur eigenen Heimadresse (erst festlegen, dann Link plus kleiner Knopf zum Ändern)
  function _navTitle(title,ymd,nav){
    if(!ymd||!(!_isCustom()||/^idf/.test(_vkey()))) return esc(title);
    if(title==='Anreise') return `<a class="idf-map" href="${nav==='babz'?BABZ_MAPS:IDF_MAPS}" target="_blank" rel="noopener noreferrer" aria-label="Anreise: Navigation ${nav==='babz'?'zur BABZ in Ahrweiler':'zum Institut der Feuerwehr NRW'} starten">${NAV_PIN}${esc(title)}</a>`;
    if(title!=='Abreise') return esc(title);
    const a=HOME.get();
    return a?`<span class="idf-abr"><a class="idf-map" href="${esc(HOME.url(a))}" target="_blank" rel="noopener noreferrer" aria-label="Abreise: Navigation zur Heimadresse starten">${NAV_PIN}${esc(title)}</a><button type="button" class="idf-home idf-home-edit" onclick="event.stopPropagation();HOME.edit()" aria-label="Heimadresse ändern">Adresse ändern</button></span>`
      :`<button type="button" class="idf-map idf-home-set" onclick="event.stopPropagation();HOME.edit()" aria-label="Abreise: Heimadresse festlegen">${NAV_PIN}${esc(title)} <span class="idf-home">Heimadresse festlegen</span></button>`;
  }
  // Räume für den Raumplan: nur im IdF-Plan; Raum = Gebäude + Nummer (B1-106, C-205, A3-25), „Gebäude C“ nennt nur das Gebäude
  const _BLD=/^(A[1-9]|B[1-4]|C|M6)$/;
  const _idfView=()=>_nonMaster()?/^idf/.test(_vkey()):!_isCustom();
  function _roomsOf(room){
    const out=[], seen={};
    String(room||'').replace(/(^|[^A-Za-z0-9])([ABCM]\d?)-(\w+)/g,(m,p,b,n)=>{ const r=b+'-'+n; if(_BLD.test(b)&&!seen[r]){ seen[r]=1; out.push({room:r,b}); } return m; });
    return out;
  }
  const _bldOf=(room,note)=>{ const m=/Gebäude\s+(A[1-9]|B[1-4]|C|M6)(?![A-Za-z0-9])/.exec((room||'')+' '+(note||'')); return m?m[1]:''; };
  let _nk='';
  function _item(s,ymd){
    const [t,title,cls='',room='',note='',nav='']=s.split('|');   // nav: 'babz' = Anreise führt zur BABZ statt zum IdF
    const [a,b]=_time(t);
    const meta=[note,room?(_isCustom()?room:'Raum '+room):''].filter(Boolean).join(' · ');
    const isNext=ymd&&_nk&&(ymd+'|'+title+'|'+_minutes(a))===_nk;
    const hasNav=!!ymd&&(title==='Anreise'||title==='Abreise')&&(!_isCustom()||/^idf/.test(_vkey()));
    const rooms=ymd&&_idfView()?_roomsOf(room):[], bd=rooms.length?'':(ymd&&_idfView()?_bldOf(room,note):'');
    const lunch=ymd&&_idfView()&&/^Mittagessen/i.test(title)?ymd:'';
    const tap=hasNav||rooms.length||bd||lunch;
    return `<div class="idf-item ${cls}${/^\d/.test(a)?'':' idf-wtime'}${tap?' idf-tap':''}${isNext?' idf-now':''}"${tap?` tabindex="0" role="button"${lunch?` data-lunch="${lunch}" aria-label="Mittagessen, Speiseplan öffnen"`:''}${rooms.length||bd?` data-rm="${esc(rooms.map(r=>r.room).join(','))}" data-bd="${esc(bd)}" aria-label="${esc(title+', '+(rooms.length?'Raum '+rooms.map(r=>r.room).join(', '):'Gebäude '+bd)+'. Raumplan öffnen')}"`:''}`:''}><span class="idf-time">${esc(a)}${b?`<i>${esc(b)}</i>`:''}</span><span class="idf-txt"><span class="idf-name">${_navTitle(title,ymd,nav)}</span>${meta?`<span class="idf-meta${rooms.length||bd?' idf-rm':''}">${rooms.length||bd?NAV_PIN:''}${esc(meta)}</span>`:''}</span></div>`;
  }
  const LUNCH=(end,ymd)=>`<div class="idf-item idf-lunch${ymd&&_idfView()?' idf-tap':''}"${ymd&&_idfView()?` data-lunch="${ymd}" tabindex="0" role="button" aria-label="Mittagessen, Speiseplan öffnen"`:''}><span class="idf-time">13:00<i>${end}</i></span><span class="idf-txt"><span class="idf-name"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 2v20M4 2v5a3 3 0 0 0 6 0V2M18 22V2c-2.5 1.5-4 4.5-4 8 0 2 1 3 4 3"/></svg>Mittagessen</span><span class="idf-meta">Speiseraum A3</span></span></div>`;
  // Frühstück und Abendessen (Zeiten laut IdF); wie das Mittagessen nur als Hinweis, kein Termin
  const MEAL=(name,a,b,note)=>`<div class="idf-item idf-lunch idf-tap" tabindex="0" role="button" data-bd="A3" aria-label="${name}, Speiseraum A3, Raumplan öffnen"><span class="idf-time">${a}<i>${b}</i></span><span class="idf-txt"><span class="idf-name"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 2v20M4 2v5a3 3 0 0 0 6 0V2M18 22V2c-2.5 1.5-4 4.5-4 8 0 2 1 3 4 3"/></svg>${name}</span><span class="idf-meta idf-rm">${NAV_PIN}Speiseraum A3${note?' · '+note:''}</span></span></div>`;
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
      const babz=raw.some(x=>/BABZ/.test(x)), away=raw.some(x=>/^[^|]*\|Abreise\|/.test(x));   // BABZ-Woche hat eigene Verpflegung; am Abreisetag kein Abendessen
      if(!babz&&!away){ let d=starts.findIndex(t=>t&&t>='17:00'); if(d<0) d=html.length; html.splice(d,0,MEAL('Abendessen','17:00','19:00','Essenausgabe bis 18:30 Uhr')); }
      if(!babz) html.unshift(MEAL('Frühstück','06:30','07:45'));
      let at=0;
      starts.forEach((t,i)=>{ if(t&&t<'13:00') at=i+1; });
      const next=starts.slice(at).find(Boolean);
      html.splice(at+(babz?0:1),0,LUNCH(next&&next>'13:00'&&next<'14:00'?next:'14:00',ymd));
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
  const _faqKey=()=>{ const k=_nonMaster()?_vkey():'idf'; return k==='idf2'?'idf':k; };
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
    let h='<div class="m-sec" style="margin:1rem 0 .6rem">'+(nm?'Plan für '+PTAB[_vkey()]:cust?'Stundenplan wählen':'Kalender')+'</div><div class="m-list idf-src">';
    if(!nm&&cust) h+=row('IdF Münster · Modul 3.5',on?'Der mitgelieferte Plan, mit Gruppe 1 und 2':'Wird gerade angezeigt',on?'<button class="btn btn-ghost" onclick="IDF_PLAN.useSource(\'idf\')">Anzeigen</button>':'<span class="m-badge">aktiv</span>');
    if(cust) h+=row(esc(_cust.name),_cust.ev.length+' Termine'+(nm?'':' aus deiner Datei'),on&&!nm?'<span class="m-badge">aktiv</span>':nm?'':'<button class="btn btn-ghost" onclick="IDF_PLAN.useSource(\'custom\')">Anzeigen</button>');
    if(nm) h+=fileRow;   // Im Master lässt sich nichts ändern oder importieren
    if(nm&&typeof JGUI!=='undefined'){
      h+=ui('JGUI.planPhoto()','Foto oder Screenshot einlesen','Die Termine werden erkannt und zum Ausbessern angezeigt');
      h+=ui('JGUI.planEditor()','Termine von Hand eingeben oder ändern','Datum, Zeit, Titel und Raum');
    }
    if(cust&&(!nm||JG.local().plane[_vkey()])) h+=`<button class="m-row" onclick="IDF_PLAN.removeCustom()"><span class="m-tx"><span class="m-t1">Eigenen Plan entfernen</span></span></button>`;
    return h.endsWith('<div class="m-list idf-src">')?'':h+'</div>';
  }
  // Noch kein Plan für diesen Abschnitt (andere Jahrgänge): Hinweis und Wege zum Importieren
  function _drawEmpty(el){
    const ey=document.querySelector('#v-plan .page-eyebrow'), ld=document.querySelector('#v-plan .page-lead');
    if(ey&&ld){ if(!ey.dataset.d){ ey.dataset.d=ey.textContent; ld.dataset.d=ld.textContent; } ey.style.textTransform='none'; ey.textContent=JG.labelOf(JG.current())+' · '+PTAB[_vkey()]; ld.textContent='Importiere oder erstelle den Stundenplan für diesen Abschnitt. Mit „Aktiv“ nutzen ihn Startseite und Widgets.'; }
    el.innerHTML=_tabsBar()+FAQ.card(_faqKey())+_raumBtn()+'<div class="m-card"><div class="m-t1">Noch kein Stundenplan für '+PTAB[_vkey()]+'</div><div class="m-t2" style="margin-top:6px">Importiere ihn als Kalenderdatei (.ics), lies ein Foto oder einen Screenshot ein, oder gib die Termine selbst ein.</div></div>'+_planControls();
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
    let h=_tabsBar()+FAQ.card(_faqKey())+_raumBtn()+`<div class="m-card idf-head">
      <div class="idf-row"><div><b class="idf-kw">KW ${kw}</b><span class="m-t2">Woche ${nr} von ${_isCustom()?_weeks.length:9}${grp==='both'&&!_isCustom()?' · beide Gruppen':''}</span></div>
        <div class="idf-nav"><button onclick="IDF_PLAN._nav(-1)" aria-label="Vorherige Woche"${_wi===0?' disabled':''}>${icon('m15 18-6-6 6-6')}</button><button onclick="IDF_PLAN._nav(1)" aria-label="Nächste Woche"${_wi===_weeks.length-1?' disabled':''}>${icon('m9 18 6-6-6-6')}</button></div></div>
      <div class="idf-pips">${_weeks.map((w,i)=>`<button type="button" class="${i<_wi?'done':i===_wi?'cur':''}" onclick="IDF_PLAN._go(${i})" aria-label="Zu KW ${w[0]} springen (Woche ${i+1} von ${_weeks.length})"${i===_wi?' aria-current="true"':''}><i></i><span>${w[0]}</span></button>`).join('')}</div>
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
    const rows=[...(tel||(/^Vorbeugender Brandschutz/.test(thema)?TEL.vb:TEL.spahl)),['Pforte','-1400'],['Notruf','-0112']].map(([n,t])=>[n,full(n,t)]);
    if(!_isCustom()) h+=`<div class="m-card idf-tel"><div class="m-t1">Erreichbarkeiten</div>${rows.map(([n,t])=>`<div class="idf-tel-row"><span>${esc(n)}</span><a href="${t.includes('@')?'mailto:'+esc(t):'tel:+49'+t.replace(/\D/g,'').replace(/^0/,'')}">${esc(t)}</a></div>`).join('')}</div>`;
    h+=`<button class="m-cal-btn" onclick="IDF_PLAN.exportIcs()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 13v5M9.5 15.5h5"/></svg>Wichtige Termine in den Kalender übernehmen<small>${_isCustom()?'Alle Termine deines Plans':'Gruppe '+_grp[1]+' · Schlüsseltermine und Exkursionen'} · mit Erinnerung 30 Minuten vorher</small></button>`;
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
    if(_toFaq){ _toFaq=false; _draw(); window.scrollTo(0,0); requestAnimationFrame(()=>window.scrollTo(0,0)); return; }
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
  function _go(i){ _manual=true; _wi=Math.max(0,Math.min(_weeks.length-1,i)); _draw(); }   // Sprung per Tipp auf einen Abschnitt der Fortschrittsleiste
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
  // Erster Plantag und Standort des aktiven Plans (für den FAQ-Hinweis auf der Startseite)
  function arrival(){ _mode='active'; try{ const w=_buildWeeks(_savedGrp()), k=_nonMaster()?(_actKey()||'idf'):'idf'; return w.length?{key:k==='idf2'?'idf':k,start:w[0][3]}:null; }catch(e){ return null; }finally{ _mode='view'; } }
  // Andere Jahrgänge (nicht der Master): Knopf zum Raumplan des IdF Münster, auch für Pläne ohne Raumangaben
  const _raumBtn=()=>_nonMaster()?`<button type="button" class="m-card idf-raumbtn" onclick="RAUM.open({title:'Raumplan IdF Münster',time:'Gelände des Instituts',rooms:[],overview:true},this)"><span class="idf-rb-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg></span><span class="m-tx"><span class="m-t1">Raumplan IdF Münster</span><span class="m-t2">Gelände in 3D, Gebäude und Parkplätze</span></span></button>`:'';
  let _toFaq=false;   // true: der nächste Aufbau springt nicht zur aktuellen Einheit, sondern bleibt oben bei der FAQ
  function openFaq(){ const a=arrival(); if(a&&_nonMaster()) viewTab(a.key,true); FAQ.want(); _toFaq=true; NAV.tab('v-plan','Stundenplan'); }
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
          if(!_isCustom()&&!/^(hi|ex)$/.test(cls)) return;   // nur Schlüsseltermine (Akzentfarbe) und Exkursionen (grün)
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

  // Tipp auf einen Eintrag: An-/Abreise führen zu Maps (die ganze Zeile ist der Knopf); ohne Heimadresse öffnet „Abreise“ die Adresseingabe; Einheiten mit Raum öffnen den Raumplan
  function _tap(it){
    const go=it.querySelector('a.idf-map'); if(go){ go.click(); return; }
    if(it.querySelector('button.idf-home-set')){ HOME.edit(); return; }
    if(it.dataset.lunch){ SPEISE.open(it.dataset.lunch,it); return; }
    const rm=(it.dataset.rm||'').split(',').filter(Boolean), bd=it.dataset.bd||'';
    if(!rm.length&&!bd) return;
    const t=it.querySelector('.idf-time'), day=it.closest('.idf-day'), d=day&&day.dataset.ymd?new Date(day.dataset.ymd+'T00:00').toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'}):'';
    const time=(d?d+' · ':'')+(t?t.textContent.replace(/(\d)(\d{2}:\d{2})/,'$1 – $2'):'');
    RAUM.open({time,title:it.querySelector('.idf-name').textContent.trim(),rooms:_roomsOf(rm.join(' ')),building:bd},it);
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('#plan-inner .idf-map,#plan-inner .idf-home')) return;   // der Link bzw. Knopf selbst tut das Seine
    const it=e.target.closest('#plan-inner .idf-tap'); if(it) _tap(it);
  });
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('#plan-inner .idf-tap')){ e.preventDefault(); _tap(e.target); }
  });
  if(typeof JG!=='undefined') JG.on(()=>{
    _loadCust(); _manual=false;
    if(document.getElementById('v-plan')?.classList.contains('active')) render();
    pushWidget();
    if(typeof SHELL!=='undefined'&&document.getElementById('v-home')?.classList.contains('active')) SHELL.renderHome();
  });
  _loadOv();
  pushWidget();
  return { roomsOf:_roomsOf, arrival, openFaq, viewTab, setActive, savePlan:_saveCust, getPlan:()=>_cust, render, summary, next, units, pushWidget, ics, exportIcs, parseIcs, importIcs, useSource, removeCustom, isCustom:_isCustom, _nav, _go, _grp:_setGrp, redraw:_draw };
})();

/* ── Speiseplan des IdF: Tipp auf „Mittagessen“ im Stundenplan öffnet den Plan des Tages (data/speiseplan.json, wöchentlich ergänzen) ── */
const SPEISE=(function(){
  let ov=null, ret=null, data=null, onKey=null;
  const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ROWS=[['stamm','Stammessen'],['beilage','Beilage'],['veg','Vegetarisch'],['dessert','Dessert']];
  const load=()=>data?Promise.resolve(data):fetch('data/speiseplan.json',{cache:'no-cache'}).then(r=>{ if(!r.ok) throw 0; return r.json(); }).then(j=>(data=j));
  const dayHtml=(ymd,d,on)=>{
    const dt=new Date(ymd+'T00:00'), h=dt.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});
    const rows=d?ROWS.filter(([k])=>d[k]&&d[k].t).map(([k,l])=>`<div class="sp-row"><span class="sp-l">${l}</span><span class="sp-t">${esc(d[k].t)}${d[k].a?` <small>(${esc(d[k].a)})</small>`:''}</span></div>`).join(''):'';
    return `<section class="sp-day${on?' on':''}" data-d="${ymd}"${on?' aria-current="date"':''}><h3>${esc(h)}</h3>${rows||'<p class="sp-none">Für diesen Tag liegt noch kein Speiseplan vor.</p>'}</section>`;
  };
  function close(quiet){
    if(!ov) return; document.removeEventListener('keydown',onKey,true); ov.remove(); ov=null; document.body.classList.remove('rp-lock');
    if(!quiet&&ret&&ret.isConnected) try{ ret.focus({preventScroll:true}); }catch(e){}
  }
  function open(ymd,from){
    close(true); ret=from||document.activeElement;
    load().catch(()=>({tage:{}})).then(j=>{
      const days=Object.keys(j.tage||{}).sort(), mon=new Date(ymd+'T00:00'); mon.setDate(mon.getDate()-((mon.getDay()+6)%7));
      const fri=new Date(mon); fri.setDate(mon.getDate()+6);
      const week=days.filter(k=>k>=_ymdOf(mon)&&k<=_ymdOf(fri));
      const list=week.includes(ymd)?week:[...week,ymd].sort();
      ov=document.createElement('div'); ov.className='rp-back sp-back';
      ov.innerHTML=`<div class="sp-card" role="dialog" aria-modal="true" aria-label="Speiseplan"><div class="sp-head"><div><div class="sp-title">Speiseplan</div><div class="sp-sub">Speisenausgabe ${esc(j.ausgabe||'12:00 bis 13:30 Uhr')}${j.stand?' · Stand '+esc(j.stand):''}</div></div><button type="button" class="rp-close" aria-label="Schließen">Schließen</button></div><button type="button" class="sp-room" data-room>Speiseraum im Raumplan zeigen (Gebäude A3)</button><div class="sp-body">${list.map(k=>dayHtml(k,(j.tage||{})[k],k===ymd)).join('')}</div></div>`;
      document.body.appendChild(ov); document.body.classList.add('rp-lock');
      ov.addEventListener('click',e=>{ if(e.target===ov||e.target.closest('.rp-close')) close(); else if(e.target.closest('[data-room]')) RAUM.open({title:'Speiseraum',time:'Gebäude A3',rooms:[],building:'A3'},e.target.closest('[data-room]')); });
      onKey=e=>{ if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); close(); } };
      document.addEventListener('keydown',onKey,true);
      const cur=ov.querySelector('.sp-day.on'); if(cur) cur.scrollIntoView({block:'start'});
      // Wischen nach unten (am Anfang der Liste) schließt das Fenster
      const bd=ov.querySelector('.sp-body'), cd=ov.querySelector('.sp-card'); let y0=null, dy=0;
      bd.addEventListener('touchstart',e=>{ y0=bd.scrollTop<=0&&e.touches.length===1?e.touches[0].clientY:null; dy=0; },{passive:true});
      bd.addEventListener('touchmove',e=>{ if(y0===null) return; dy=e.touches[0].clientY-y0; if(dy>0&&bd.scrollTop<=0) cd.style.transform='translateY('+Math.min(dy,220)+'px)'; else if(dy<0){ y0=null; cd.style.transform=''; } },{passive:true});
      bd.addEventListener('touchend',()=>{ if(y0!==null&&dy>110) close(); else cd.style.transform=''; y0=null; },{passive:true});
      const cb=ov.querySelector('.rp-close'); if(cb) cb.focus({preventScroll:true});
    });
  }
  const _ymdOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  return {open,close,isOpen:()=>!!ov};
})();

/* ── Raumplan (3D): Code und three.js werden erst beim ersten Tipp auf eine Einheit mit Raum geladen ── */
const RAUM=(function(){
  const JS={};
  const load=src=>JS[src]||(JS[src]=new Promise((ok,no)=>{ const x=document.createElement('script'); x.src=src; x.onload=ok; x.onerror=()=>{ delete JS[src]; x.remove(); no(); }; document.body.appendChild(x); }));
  function open(info,from){
    if(typeof RAUMPLAN!=='undefined'){ RAUMPLAN.open(info,from); return; }
    TOAST.show('Raumplan wird geladen …',{type:'info'});
    load('js/three.min.js').then(()=>load('js/raumplan.js')).then(()=>RAUMPLAN.open(info,from)).catch(()=>TOAST.show('Der Raumplan konnte nicht geladen werden. Bitte Verbindung prüfen.',{type:'info'}));
  }
  return {open};
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
  const keep=k=>(k.startsWith('bvi_')&&k!=='bvi_seen_version'&&k!=='bvi_last_backup'&&k!=='bvi_et_end'&&k!=='bvi_heimadresse'&&!k.startsWith('bvi_jgp_'))||k==='idf_plan_grp';   // bvi_jgp_ = Zwischenspeicher veröffentlichter Jahrgangs-Dateien
  // Form der Werte beim Einspielen prüfen: falsch geformte Daten würden die App dauerhaft stören
  const ARR=new Set(['bvi_bookmarks','bvi_recent','bvi_search_hist','bvi_fc_custom','bvi_fc_stars','bvi_fc_weak']);
  const NOJSON=new Set(['bvi_plan_src','bvi_theme','bvi_bg','bvi_accent','bvi_font_size','bvi_goal','bvi_timers','bvi_onboarded','bvi_exam','bvi_lp_fz','bvi_lp_prac','bvi_pause_mode','bvi_pause_mods','bvi_duell_name','bvi_duell_col','bvi_duell_stun','bvi_duell_cfg','idf_plan_grp']);
  const safeTxt=t=>String(t==null?'':t).replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function clean(k,v){
    if(typeof v!=='string'||v.length>2e6||k==='bvi_heimadresse') return null;
    if(/^bvi_note_v-[a-z0-9-]+$|^bvi_note_home$/.test(k)) return v;
    if(NOJSON.has(k)) return v;
    // Jahrgänge: gewählter Jahrgang, eigene Änderungen je Jahrgang, Plan-Ansicht
    if(k==='bvi_jg') return /^BRef-\d\d-\d{4}_AB-\d\d-\d{4}$/.test(v)?v:null;
    if(/^bvi_jgd_BRef-\d\d-\d{4}_AB-\d\d-\d{4}$/.test(k)){ try{ const o=JSON.parse(v); return o&&typeof o==='object'&&!Array.isArray(o)?v:null; }catch(e){ return null; } }
    if(k==='bvi_plan_view') return JG.PLANKEYS.includes(v)?v:null;
    if(k==='bvi_plan_idfg') return v==='idf'||v==='idf2'?v:null;
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
/* ── Hintergrundhelligkeit: Regler von Schwarz bis Weiß ───────────────────────
   Leitet Hintergrund, Karten, Linien und Textfarben aus einem Wert 0–100 ab; die Texte bleiben dabei lesbar
   (Kontrast mindestens 4,5:1). Beige-Farbschema = warmer Farbton, sonst neutral. */
const BG=(function(){
  const KEY='bvi_bg', DEFAULTS={dark:7,light:95,beige:77};
  const NAMES=['--m-bg','--m-card','--m-raised','--m-line','--m-bar','--m-fg','--m-muted','--m-dim','--c-bg','--c-navy','--c-navy-2','--c-navy-3','--c-navy-4','--c-slate','--c-slate-l','--c-text','--c-text-b','--glass','--glass-h','--glass-b'];
  function get(){ try{ const v=parseInt(localStorage.getItem(KEY),10); return v>=0&&v<=100?v:null; }catch(e){ return null; } }
  function hsl(h,s,l){   // → [r,g,b]
    s/=100; l/=100; const k=n=>(n+h/30)%12, a=s*Math.min(l,1-l), f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
    return [Math.round(255*f(0)),Math.round(255*f(8)),Math.round(255*f(4))];
  }
  const hex=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
  const lum=c=>{ const f=v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }; return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]); };
  const ratio=(a,b)=>{ const x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
  const mix=(a,b,w)=>a.map((v,i)=>Math.round(v+(b[i]-v)*w));   // w=0 → a, w=1 → b
  // Farben für den Wert t (0–100); warm=true: Beige-Farbton
  function colors(t,warm){
    const h=warm?41:0, s=warm?38:0, dark=t<50;
    const bg=hsl(h,s,t), up=l=>hsl(h,s,Math.max(0,Math.min(100,l)));
    // Kacheln wie in Dunkel und Hell: immer ein Stück heller als der Hintergrund (Leuchtdichte-Verhältnis wie dort,
    // Dunkel 1,12 / Hell 1,07); ganz am weißen Ende, wo es nicht heller geht, stattdessen ein Stück dunkler
    // Beige (hell): wie die Voreinstellung (Kachel 1,18 heller, eingelassene Flächen 1,15 und Linien 1,37 dunkler als der Hintergrund)
    const R=dark?1.12:warm?1.18:1.07, tile=(want)=>{ for(let l=t;l<=100;l+=.5){ const c=up(l); if(ratio(c,bg)>=want) return c; } return null; };
    const shade=want=>{ for(let l=t;l>=0;l-=.5){ const c=up(l); if(ratio(c,bg)>=want) return c; } return up(0); };
    let card=tile(R);
    if(!card){ for(let l=t;l>=0;l-=.5){ card=up(l); if(ratio(card,bg)>=R) break; } }
    const raised=dark?up(t+8):warm?shade(1.15):up(t-6), line=dark?up(t+10):warm?shade(1.37):up(t-12);
    // Textfarbe: die mit dem höheren Kontrast, im warmen Ton leicht bräunlich
    const light=warm?[237,229,214]:[237,237,237], darkc=warm?[40,31,20]:[26,26,26];
    let fg=ratio(light,bg)>ratio(darkc,bg)?light:darkc;
    if(ratio(fg,bg)<6){ const pure=[[255,255,255],[0,0,0]]; fg=pure.reduce((b,c)=>ratio(c,bg)>ratio(b,bg)?c:b,fg); }   // mittlere Töne: reines Weiß oder Schwarz für den bestmöglichen Kontrast
    // gedämpfte Texte: so weit zum Hintergrund hin, wie der Kontrast 4,5:1 (Nebentext) bzw. 4,0:1 (ganz leise) erlaubt
    const soft=min=>{ let w=0; for(let i=1;i<=20;i++){ const c=mix(fg,bg,i/20); if(ratio(c,bg)>=min) w=i/20; else break; } return mix(fg,bg,w); };
    return {bg,card,raised,line,fg,muted:soft(5.2),dim:soft(4.6),dark,fgStrong:lum(fg)>.4?[255,255,255]:[17,17,17],glassH:dark?up(t+7):warm?(tile(1.26)||[250,248,242]):(t>=93?[250,250,248]:up(t+9))};
  }
  function clear(){ const st=document.documentElement.style; NAMES.forEach(n=>st.removeProperty(n)); }
  function apply(){
    const t=get(), de=document.documentElement;
    if(t===null){ clear(); return; }
    const warm=de.getAttribute('data-tone')==='beige', c=colors(t,warm), st=de.style, H=hex;
    de.setAttribute('data-theme',c.dark?'dark':'light');
    const set=(k,v)=>st.setProperty(k,v);
    set('--m-bg',H(c.bg)); set('--m-card',H(c.card)); set('--m-raised',H(c.raised)); set('--m-line',H(c.line)); set('--m-bar',H(c.card));
    set('--m-fg',H(c.fg)); set('--m-muted',H(c.muted)); set('--m-dim',H(c.dim));
    set('--c-bg',H(c.bg)); set('--c-navy',H(c.card)); set('--c-navy-2',H(c.card)); set('--c-navy-3',H(c.raised)); set('--c-navy-4',H(c.line));
    set('--c-slate',H(c.muted)); set('--c-slate-l',H(mix(c.fg,c.muted,.35))); set('--c-text',H(c.fg)); set('--c-text-b',H(c.fgStrong));
    set('--glass',H(c.card)); set('--glass-h',H(c.glassH)); set('--glass-b',H(c.line));
    const m=document.querySelector('meta[name=theme-color]'); if(m) m.content=H(c.bg);
  }
  function sync(){
    const r=document.getElementById('m-bg-range'); if(!r) return;
    const t=get(), mode=(()=>{ try{ return localStorage.getItem('bvi_theme')||'system'; }catch(e){ return 'system'; } })();
    const de=document.documentElement, base=de.getAttribute('data-tone')==='beige'?DEFAULTS.beige:de.getAttribute('data-theme')==='light'?DEFAULTS.light:DEFAULTS.dark;
    r.value=t===null?base:t;
    r.style.background='linear-gradient(90deg,'+(de.getAttribute('data-tone')==='beige'?'#000,#7d6c47 50%,#fff':'#000,#fff')+')';
    const s=document.getElementById('m-bg-sub'); if(s) s.textContent=t===null?'Hintergrund von Schwarz bis Weiß':'Hintergrund: eigene Helligkeit '+t+' %';
  }
  return {
    get, apply, sync, colors, hex, clear,
    set(v){ v=Math.max(0,Math.min(100,Math.round(+v))); try{ localStorage.setItem(KEY,String(v)); }catch(e){} apply(); sync(); try{ ACCENT.syncIcon(); }catch(e){} },
    reset(){ try{ localStorage.removeItem(KEY); }catch(e){} clear(); THEME.render(); sync(); }
  };
})();

const THEME=(function(){
  const KEY='bvi_theme', MODES=['dark','light','beige','system'];
  const mq=window.matchMedia?matchMedia('(prefers-color-scheme: light)'):null;
  function get(){ try{ const m=localStorage.getItem(KEY); return MODES.includes(m)?m:'system'; }catch(e){ return 'system'; } }
  function light(m){ return m==='light'||m==='beige'||(m==='system'&&!!(mq&&mq.matches)); }
  function apply(m){
    const l=light(m), b=m==='beige';
    document.documentElement.setAttribute('data-theme',l?'light':'dark');
    if(b) document.documentElement.setAttribute('data-tone','beige'); else document.documentElement.removeAttribute('data-tone');   // Beige = helles Design mit warmem Farbton
    const t=document.querySelector('meta[name=theme-color]'); if(t) t.content=b?'#ddcfb1':l?'#f4f4f1':'#121212';
    BG.apply();   // eigene Hintergrundhelligkeit (falls gesetzt) legt sich über das Farbschema
    try{ ACCENT.syncIcon(); }catch(e){}   // beim ersten Aufruf ist ACCENT noch nicht angelegt
    document.querySelectorAll('.theme-opt').forEach(b=>{ const on=b.dataset.mode===m; b.classList.toggle('active',on); b.setAttribute('aria-pressed',on); });
  }
  if(mq) (mq.addEventListener?mq.addEventListener.bind(mq,'change'):mq.addListener.bind(mq))(()=>{ if(get()==='system') apply('system'); });
  return {
    init(){ apply(get()); },
    set(m){ if(!MODES.includes(m)) return; try{ localStorage.setItem(KEY,m); localStorage.removeItem('bvi_bg'); }catch(e){} BG.clear(); apply(m); BG.sync(); },
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
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${document.documentElement.getAttribute('data-tone')==='beige'?'#ddcfb1':'#0a0a0a'}"/><g transform="translate(-24.8 33.7) scale(23.4)"><path d="${d}" fill="${c}"/><path d="${d}" fill="#fff" fill-opacity=".65" transform="translate(12 17) scale(.52) translate(-12 -17)"/></g></svg>`;
    el.href='data:image/svg+xml,'+encodeURIComponent(svg);
  }
  // Android-App: Startsymbol in der nächstliegenden der 5 Vorgabefarben
  function syncAppIcon(c){
    if(!window.BVIAndroid||!BVIAndroid.setIcon) return;
    const rgb=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};
    const [r,g,b]=rgb(c);
    let best=PRESETS[0],min=Infinity;
    PRESETS.forEach(p=>{const [x,y,z]=rgb(p[0]),d=(r-x)**2+(g-y)**2+(b-z)**2;if(d<min){min=d;best=p;}});
    const light=document.documentElement.getAttribute('data-theme')==='light', beige=document.documentElement.getAttribute('data-tone')==='beige';
    try{ BVIAndroid.setIcon(best[2]+(beige?'_beige':light?'_light':'')); }catch(e){}
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
  /* Navigationsleiste: Reihenfolge, Zusammenlegungen und Mittelknopf einstellbar; zwei Tabs teilen sich einen Platz */
  const NAVBAR=(function(){
    const KEY='bvi_nav', MAX=5;
    const D=(a,b)=>({a,b});
    const IC={
      start:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
      plan:'<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
      exam:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
      pause:'<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 2.5c-.6 1 .6 1.8 0 3M12 2.5c-.6 1 .6 1.8 0 3"/>',
      cards:'<rect x="2.5" y="7" width="15" height="14" rx="2.5"/><path d="M6.5 3.5h12a2.5 2.5 0 0 1 2.5 2.5v11"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'};
    const T={
      start:{n:'Start',s:'Start',go:()=>NAV.home()},
      plan:{n:'Stundenplan',s:'Plan',go:()=>NAV.tab('v-plan','Stundenplan')},
      exam:{n:'Prüfung',s:'Prüfung',go:()=>NAV.tab('v-pruefung','Prüfung')},
      pause:{n:'Pausenraum',s:'Pause',go:()=>NAV.tab('v-pause','Pausenraum')},
      cards:{n:'Lernkarten',s:'Karten',go:()=>NAV.tab('v-flashcards','Lernkarten')},
      settings:{n:'Einstellungen',s:'Einst.',go:()=>NAV.tab('v-settings','Einstellungen')}};
    const IDS=Object.keys(T);
    const DEF={order:['start','plan','exam','pause','cards','settings'],join:{pause:true},fab:'exam'};
    const clone=o=>JSON.parse(JSON.stringify(o));
    const svg=(inner,cls)=>'<svg'+(cls?' class="'+cls+'"':'')+' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+inner+'</svg>';
    const pairSvg=(a,b,cls)=>svg('<g transform="translate(-.5 6.5) scale(.5)" stroke-width="3.4">'+IC[a]+'</g><g transform="translate(12.5 6.5) scale(.5)" stroke-width="3.4">'+IC[b]+'</g><path d="M14.2 3.5 9.8 20.5" stroke-width="1.6"/>',cls);
    function slots(c){ const r=[]; for(let i=0;i<c.order.length;i++){ const a=c.order[i]; if(c.join[a]&&i+1<c.order.length){ r.push([a,c.order[i+1]]); i++; } else r.push([a]); } return r; }
    function valid(c){
      if(!c||!Array.isArray(c.order)||c.order.length!==IDS.length||new Set(c.order).size!==IDS.length||!c.order.every(x=>IDS.includes(x))) return false;
      if(c.order[c.order.length-1]!=='settings') return false;   // Einstellungen bleiben immer ganz rechts
      if(typeof c.join!=='object'||!c.join) return false;
      return slots(c).length<=MAX;
    }
    function load(){ try{ const c=JSON.parse(localStorage.getItem(KEY)||'null'); if(valid(c)&&(c.fab===null||IDS.includes(c.fab))) return c; }catch(e){} return clone(DEF); }
    let cfg=load(), draft=null;
    function save(c){ try{ localStorage.setItem(KEY,JSON.stringify(c)); }catch(e){} }
    const key=s=>s.join(' ');
    function label(s){ return s.length===1?T[s[0]].n:s.map(x=>T[x].s).join('/'); }
    function curTab(){ return window.__navTab||'start'; }
    function apply(){ const t=curTab(); document.querySelectorAll('#m-tabbar [data-tabs],#m-rail [data-tab]').forEach(b=>{ const on=(b.dataset.tabs||b.dataset.tab||'').split(' ').includes(t); b.classList.toggle('on',on); if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); }); }
    function render(){
      const bar=document.getElementById('m-tabbar'); if(!bar) return;
      const sl=slots(cfg);
      bar.style.gridTemplateColumns='repeat('+sl.length+',1fr)';
      bar.innerHTML=sl.map(s=>{
        const fab=cfg.fab&&s.includes(cfg.fab);
        const ic=s.length===1?svg(IC[s[0]]):pairSvg(s[0],s[1]);
        const click=s.length===1?'NAVBAR.go(\''+s[0]+'\')':'PMENU.toggle(event,this)';
        const attrs=s.length===1?'':' aria-haspopup="menu" aria-expanded="false" aria-controls="m-pmenu"';
        return '<button class="m-tab'+(fab?' m-tab-center':'')+'" data-tab="'+s[0]+'" data-tabs="'+key(s)+'" onclick="'+click+'"'+attrs+'>'+(fab?'<span class="m-fab">'+ic+'</span>':ic)+'<span>'+label(s)+'</span></button>';
      }).join('');
      apply();
    }
    function go(id){ PMENU.close(); T[id].go(); }
    /* ---- Einstellungen ---- */
    const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    function renderSettings(){
      const el=document.getElementById('nav-edit'); if(!el) return;
      const c=draft||cfg, sl=slots(c), ok=sl.length<=MAX;
      const prev='<div class="nb-prev" style="grid-template-columns:repeat('+sl.length+',1fr)">'+sl.map(s=>{ const fab=c.fab&&s.includes(c.fab); return '<div class="nb-p'+(fab?' nb-fab':'')+'">'+(s.length===1?svg(IC[s[0]]):pairSvg(s[0],s[1]))+'<span>'+esc(label(s))+'</span></div>'; }).join('')+'</div>';
      let pairStart={}; sl.forEach(s=>{ if(s.length===2) pairStart[s[0]]=true; });
      const second={}; sl.forEach(s=>{ if(s.length===2) second[s[1]]=true; });
      const rows=c.order.map((id,i)=>'<div class="nb-row'+(second[id]?' nb-sec':'')+'"><span class="nb-ic">'+svg(IC[id])+'</span><span class="nb-n">'+esc(T[id].n)+'</span>'
        +'<span class="nb-btns"><button type="button" aria-label="'+esc(T[id].n)+' nach oben" '+(i===0||id==='settings'?'disabled':'')+' onclick="NAVBAR.move(\''+id+'\',-1)">▲</button><button type="button" aria-label="'+esc(T[id].n)+' nach unten" '+(i>=c.order.length-2?'disabled':'')+' onclick="NAVBAR.move(\''+id+'\',1)">▼</button></span>'
        +(i<c.order.length-1&&!second[id]?'<label class="nb-l"><input type="checkbox" '+(c.join[id]?'checked':'')+' onchange="NAVBAR.join(\''+id+'\',this.checked)"> mit „'+esc(T[c.order[i+1]].n)+'“ teilen</label>':'<span class="nb-l nb-mu">'+(second[id]?'teilt sich den Platz mit dem Tab davor':(id==='settings'?'steht immer ganz rechts und kann nicht entfernt werden':''))+'</span>')
        +'<label class="nb-l"><input type="radio" name="nb-fab" '+(c.fab&&(c.fab===id)?'checked':'')+' onchange="NAVBAR.fab(\''+id+'\')"> Mittelknopf</label></div>').join('');
      el.innerHTML='<p class="nb-t">Ordne die Tabs in der Reihenfolge, in der sie in der Leiste stehen sollen. Mit „teilen“ legst du zwei benachbarte Tabs auf einen Platz; beim Antippen erscheint dann eine Auswahl. Es gibt höchstens '+MAX+' Plätze. Die Einstellungen stehen immer ganz rechts.</p>'
        +'<div class="nb-h">Vorschau</div>'+prev
        +'<div class="nb-st'+(ok?'':' nb-bad')+'">'+(ok?sl.length+' von '+MAX+' Plätzen belegt':'Zu viele Plätze ('+sl.length+'): lege mindestens '+(sl.length-MAX)+' Tab(s) mit einem anderen zusammen. Bis dahin bleibt die letzte gültige Leiste aktiv.')+'</div>'
        +'<div class="nb-rows">'+rows+'</div>'
        +'<div class="nb-act"><label class="nb-l"><input type="radio" name="nb-fab" '+(c.fab===null?'checked':'')+' onchange="NAVBAR.fab(null)"> Kein Mittelknopf</label><button type="button" class="btn btn-ghost" onclick="NAVBAR.reset()">Zurücksetzen</button></div>';
    }
    function commit(c){ if(slots(c).length<=MAX){ cfg=c; draft=null; save(cfg); render(); } else { draft=c; } renderSettings(); }
    function edit(fn){ const c=clone(draft||cfg); fn(c); commit(c); }
    return {
      init(){ render(); renderSettings(); },
      render, renderSettings, go, mark(){ apply(); },
      move(id,d){ edit(c=>{ if(id==='settings') return; const i=c.order.indexOf(id), j=i+d; if(j<0||j>=c.order.length-1) return; [c.order[i],c.order[j]]=[c.order[j],c.order[i]]; }); },
      join(id,on){ edit(c=>{ if(on) c.join[id]=true; else delete c.join[id]; /* keine Ketten: der nächste Tab teilt nicht weiter */ if(on){ const i=c.order.indexOf(id); const nx=c.order[i+1]; if(nx) delete c.join[nx]; const pv=c.order[i-1]; if(pv) delete c.join[pv]; } }); },
      fab(id){ edit(c=>{ c.fab=id; }); },
      reset(){ draft=null; cfg=clone(DEF); try{ localStorage.removeItem(KEY); }catch(e){} render(); renderSettings(); },
      pairOf(btn){ return (btn.dataset.tabs||'').split(' ').filter(Boolean); },
      T, IC, svg
    };
  })();
  window.NAVBAR=NAVBAR;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>NAVBAR.init()); else NAVBAR.init();
  /* Pause / Karten und andere geteilte Plätze: Tab öffnet eine Auswahl über der Leiste */
  const PMENU=(function(){
    let anchor=null;
    const el=()=>document.getElementById('m-pmenu');
    function place(){ const m=el(), t=anchor; if(!m||!t) return; const r=t.getBoundingClientRect(); const L=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,r.left+r.width/2-m.offsetWidth/2)); m.style.left=L+'px'; m.style.setProperty('--pm-ax',(r.left+r.width/2-L)+'px'); m.style.bottom=(innerHeight-r.top+8)+'px'; }
    function close(){ const m=el(); if(!m||m.hidden) return; m.hidden=true; if(anchor) anchor.setAttribute('aria-expanded','false'); anchor=null; }
    function open(btn){ const m=el(); if(!m) return; const ids=NAVBAR.pairOf(btn); m.innerHTML=ids.map(id=>'<button role="menuitem" onclick="NAVBAR.go(\''+id+'\')">'+NAVBAR.svg(NAVBAR.IC[id])+'<span>'+NAVBAR.T[id].n+'</span></button>').join(''); anchor=btn; m.hidden=false; place(); btn.setAttribute('aria-expanded','true'); m.querySelector('button')?.focus({preventScroll:true}); }
    document.addEventListener('click',e=>{ const m=el(); if(m&&!m.hidden&&!e.target.closest('#m-pmenu')&&!e.target.closest('#m-tabbar [aria-haspopup]')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
    addEventListener('resize',close);
    return { toggle(e,btn){ e&&e.stopPropagation(); const m=el(); if(m&&m.hidden||anchor!==btn){ close(); open(btn); } else close(); }, close };
  })();
  window.PMENU=PMENU;
  const ROOTS={'v-home':'start','v-plan':'plan','v-pruefung':'exam','v-settings':'settings','v-pause':'pause','v-flashcards':'cards'};
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
    let list=DEF_EXAMS;   // andere Jahrgänge: kein vorgegebener Termin (jeder kann seinen eigenen unter Einstellungen eintragen)
    if(!JG.isMaster()) list=[{date:'2000-01-01',name:'Klausur'}];
    return list.find(e=>new Date(e.date+'T00:00')>=t)||list[list.length-1];
  }
  // Ziele für den Countdown: dieselben Prüfungen wie im Prüfung-Tab (Master ohne die ausgeblendeten, dazu die eigenen des Jahrgangs)
  function examList(){
    const jd=JG.data(), weg=new Set(jd.pr.weg);
    return EXAMS.map(([name,items],si)=>{
      const key=JG.TABS[si][0];
      return [name,[...items.filter(x=>!weg.has(x[0])).map(x=>[x[0],x[1]]),...jd.pr.hinzu.filter(p=>p.tab===key&&!p.seite).map(p=>[p.id,p.titel,'own'])]];
    }).filter(g=>g[1].length);
  }
  const examFind=id=>examList().flatMap(g=>g[1]).find(x=>x[0]===id);
  function examCfg(){
    const d=defExam();
    try{
      const o=JSON.parse(localStorage.getItem('bvi_exam')||'{}');
      return {date:/^\d{4}-\d{2}-\d{2}$/.test(o.date||'')?o.date:d.date, name:((o.name||'').trim().slice(0,60))||d.name, target:examFind(o.target)?o.target:'', off:!!o.off};
    }catch(e){ return {...d,target:'',off:false}; }
  }
  function goalMin(){
    try{ const v=parseInt(localStorage.getItem('bvi_goal'),10); return v>=5&&v<=240?v:30; }catch(e){ return 30; }
  }
  // Ziel der Countdown-Karte: Klausur nach § 21 → Laufbahnklausuren, sonst Altklausur-Quiz IdF
  function examTarget(){
    const t=examCfg().target;
    if(t){ const it=examFind(t); if(it) return it; }   // it = [id, Titel, 'own' bei eigener Prüfung]
    return /§\s*21/.test(examCfg().name)?['v-laufbahn-2026','Laufbahnklausuren Juni 2026']:['v-idf-altklausur','Altklausur-Quiz IdF']; }
  function daysToExam(){
    const t=new Date(); t.setHours(0,0,0,0);
    if(examCfg().off) return -1;   // Termin entfernt: kein Countdown
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
    const pause=`<div class="m-list m-pause">${row({ic:ic('cards'),t1:'Lernkarten',t2:cs.due?cs.due+' zur Wiederholung fällig · '+cs.known+' von '+cs.total+' gelernt':cs.known+' von '+cs.total+' gelernt · Karten üben',on:goJs('v-flashcards','Lernkarten')})}</div><div class="m-list m-pause">${row({ic:ic('cup'),t1:'Pausenraum',t2:'Spiele und Einsatzfahrt für zwischendurch',on:goJs('v-pause','Pausenraum')})}</div>`;
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
    cd.innerHTML=days<0?'':`<button type="button" class="m-card m-count m-count-go" onclick="${tgt[2]==='own'&&/^[\w-]+$/.test(tgt[0])?`JGUI.openExam('${tgt[0]}')`:goJs(tgt[0],tgt[1])}"><div class="m-count-big">${days===0?'Heute':days}</div><div class="m-tx"><span class="m-t2" style="margin:0">${days===0?'ist die':days===1?'Tag bis zur nächsten Klausur':'Tage bis zur nächsten Klausur'}</span><span class="m-t1">${esc(examCfg().name)}</span><span class="m-t2">${new Date(examCfg().date+'T00:00').toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'long',year:'numeric'})}</span></div><span class="m-count-link">${esc(tgt[1])} <i>›</i></span></button>`;
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
    // Bearbeiten-Knopf oben auf der Seite; „Prüfung hinzufügen“ erst im Bearbeiten-Modus
    const tools=typeof JGUI==='undefined'||JG.isMaster()?'':`<button type="button" class="btn btn-ghost" onclick="JGUI.toggleEdit()">${edit?'Fertig':'Prüfungen bearbeiten'}</button>${JGUI.histHtml()}${edit?`<button type="button" class="jg-plus" onclick="JGUI.examEditor()"><span>+</span> Prüfung hinzufügen</button>`:''}${edit&&hidden?`<button type="button" class="btn btn-ghost" onclick="JGUI.restoreExams()">${hidden} ausgeblendete wiederherstellen</button>`:''}`;
    let eb=document.getElementById('jg-exam-bar');
    if(!eb){ eb=document.createElement('div'); eb.id='jg-exam-bar'; cd.parentNode.insertBefore(eb,cd); }
    eb.className=tools?'jg-bar':''; eb.innerHTML=tools;
    const hint=edit&&tools?'<div class="m-note" style="padding:6px 2px">Tippe eine Prüfung an, um sie klausurrelevant (★) zu machen oder abzuwählen. Nur relevante Prüfungen liefern Fragen für Einsatzfahrt und Duell.</div>':'';
    list.innerHTML=`${hint}<div class="m-areas">${EXAMS.map(sec).join('')}</div>`;
  }

  function renderFcSide(){
    const el=document.getElementById('m-fc-side'); if(!el) return;
    let fc={}; try{ fc=JSON.parse(localStorage.getItem('bvi_fc')||'{}'); }catch(e){}
    const cats=[['laufbahn','Laufbahn'],['ibk','IBK'],['vak','VAk'],['feuak','FeuAK'],['idf','IdF']];
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
    const ex=examCfg(), di=document.getElementById('m-exam-date'), ni=document.getElementById('m-exam-name'), ti=document.getElementById('m-exam-target'), xb=document.getElementById('m-exam-clear');
    if(di) di.value=ex.off?'':ex.date; if(ni) ni.value=ex.off?'':(ex.name===defExam().name&&!localStorage.getItem('bvi_exam')?'':ex.name);
    if(ti){
      ti.innerHTML='<option value="">Automatisch</option>'+examList().map(([n,it])=>'<optgroup label="'+esc(n)+'">'+it.map(x=>'<option value="'+esc(x[0])+'">'+esc(x[1])+(x[2]?' (eigene)':'')+'</option>').join('')+'</optgroup>').join('');   // bei jedem Öffnen neu: folgt dem Prüfung-Tab
      ti.value=ex.off?'':ex.target;
    }
    if(xb) xb.hidden=ex.off;
    BG.sync();
    const tg=document.getElementById('m-notif-toggle'); if(tg) tg.checked=NOTIF.isEnabled();
    document.getElementById('m-cl-badge')?.classList.toggle('hidden',!CHANGELOG.isNew());
    document.getElementById('m-cl-badge2')?.classList.toggle('hidden',!CHANGELOG.isNew());
    accSubs();
  }

  // Kurzinfo unter jeder Einstellungs-Gruppe (zeigt die aktuellen Werte, auch wenn die Gruppe zu ist)
  function accSubs(){
    const set=(id,txt)=>{ const e=document.getElementById(id); if(e) e.textContent=txt; };
    const th={dark:'Dunkel',light:'Hell',beige:'Beige',system:'System'}[localStorage.getItem('bvi_theme')]||'System';
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
    window.__navTab=tab;
    PMENU.close();
    document.querySelectorAll('#m-tabbar [data-tabs],#m-rail [data-tab]').forEach(b=>{
      const on=(b.dataset.tabs||b.dataset.tab||'').split(' ').includes(tab);
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
      const target=document.getElementById('m-exam-target')?.value||'';
      if(o.off&&!/^\d{4}-\d{2}-\d{2}$/.test(date||'')){ try{ localStorage.setItem('bvi_exam',JSON.stringify({off:1,target})); }catch(e){} return; }   // ohne neues Datum bleibt der Termin entfernt
      try{ localStorage.setItem('bvi_exam',JSON.stringify({date:o.date,name:name.trim(),target})); }catch(e){}
      syncSettings(); if(document.getElementById('v-pruefung')?.classList.contains('active')) renderExam();
    },
    clearExam(){
      let prev=null; try{ prev=localStorage.getItem('bvi_exam'); localStorage.setItem('bvi_exam',JSON.stringify({off:1})); }catch(e){}
      syncSettings(); renderExam(); renderHome();
      const put=v=>{ try{ v===null?localStorage.removeItem('bvi_exam'):localStorage.setItem('bvi_exam',v); }catch(e){} syncSettings(); renderExam(); renderHome(); };
      UNDO.push('Klausurtermin entfernen',()=>put(prev),()=>put(JSON.stringify({off:1})));
      TOAST.show('Klausurtermin entfernt',{type:'ok'});
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
  if(window.SK) requestAnimationFrame(()=>window.SK());
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
