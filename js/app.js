/* ======================================================================
   NAVIGATIONS-ENGINE
   NAV.go(id, label) · NAV.back() · NAV.home() · NAV.jumpTo(idx)
====================================================================== */
const NAV = (function(){
  let stack = [];
  let _dir = 'forward';
  const ALL = ['v-home','v-jahr1','v-jahr2','v-abkuerzungen','v-gal','v-gal-organisation','v-gal-brandlehre','v-gal-fahrzeuge','v-gal-einsatz','v-gal-atemgifte','v-gal-atemschutz','v-gal-vb','v-gal-loeschlehre','v-gal-loeschmittel-schaum','v-gal-loeschwasserversorgung','v-gal-beamtenrecht','v-gal-beihilferecht','v-gal-brandbekaempfung','v-gal-einsatztechnik','v-gal-erstehilfe','v-gal-grundlagen','v-gal-fahrzeugnormung','v-gal-fuehrung','v-gal-fwdven','v-gal-gabc','v-gal-geraetepruefung','v-gal-hbkg','v-gal-kartenkunde','v-gal-knoten','v-gal-staatsbuerger','v-gal-th-verkehr','v-gal-leitern','v-gal-uvv','v-gal-waermebildkamera','v-gal-armaturen','v-gal-maschinist','v-gal-psa','v-gal-personalvertretungsrecht','v-sfs','v-sfs-fwdv3','v-sfs-methodik','v-sfs-rechtsgrundlagen','v-sfs-abc','v-hlfs','v-hlfs-fuehrungsvorgang','v-hlfs-gabc','v-hlfs-vb','v-hlfs-manv','v-hlfs-tunnel','v-hlfs-zugfuehrer','v-hlfs-stab','v-ibk','v-ibk-ta','v-ibk-konflikt','v-ibk-stress','v-ibk-psnv','v-ibk-bgm','v-ibk-pm','v-ibk-zeit','v-vak','v-vak-lernzusammenfassung','v-vak-jur-denken','v-vak-verwaltungsrecht','v-vak-staatsrecht','v-vak-einsatzrecht','v-vak-dienstrecht','v-vak-altklausur','v-feuak','v-feuak-vwl','v-feuak-bwl','v-feuak-haushalt','v-feuak-vergabe','v-feuak-rechnungswesen','v-feuak-pm','v-feuak-bedarfsplanung','v-feuak-pruefung','v-idf','v-idf-brandschutz','v-idf-stab','v-idf-presse','v-simulator','v-flashcards','v-bookmarks','v-app','v-impressum','v-datenschutz'];

  function show(id){
    ALL.forEach(v=>{
      const e=document.getElementById(v);
      if(!e) return;
      const active = v===id;
      e.classList.toggle('active',active);
      if(active){
        e.classList.remove('nav-forward','nav-back');
        void e.offsetWidth; // reflow to restart animation
        e.classList.add(_dir==='back'?'nav-back':'nav-forward');
      }
    });
    window.scrollTo({top:0,behavior:'instant'});
    const NAVY_VIEWS = new Set(['v-simulator','v-flashcards','v-abkuerzungen','v-app']);
    window._shaderContentMode = (id.split('-').length > 2 || NAVY_VIEWS.has(id)) ? 1.0 : 0.0;
    document.body.classList.toggle('mode-navy', window._shaderContentMode === 1.0);
    // Header Notes + Bookmark buttons – only on deep content pages
    const isContentPage = id.split('-').length >= 3;
    const bkBtn = document.getElementById('bookmark-btn');
    if(bkBtn){
      bkBtn.classList.toggle('hidden', !isContentPage);
      if(isContentPage){ bkBtn.dataset.id=id; bkBtn.dataset.label=stack.length?stack[stack.length-1].label:''; }
    }
    const notesFab = document.getElementById('notes-fab');
    if(notesFab) notesFab.classList.toggle('hidden', !isContentPage);
    if(typeof NOTES!=='undefined') NOTES.setView(id);
    if(typeof BOOKMARKS!=='undefined') BOOKMARKS.setView(id);
    updateHeader();
    if(id==='v-abkuerzungen') ABK.init();
    if(id==='v-vak-altklausur') QUIZ.init();
    if(id==='v-simulator') SIM._refreshCards();
    if(id==='v-app' && window._isChromium){
      const w = document.getElementById('apk-chromium-warn');
      if(w) w.classList.remove('hidden');
    }
    if(typeof PROGRESS!=='undefined') PROGRESS.track(id);
    if(typeof HEATMAP!=='undefined') HEATMAP.record();
    if(typeof RELATED!=='undefined'&&RELATED[id]){const _v=document.getElementById(id);if(_v&&!_v.querySelector('.related-topics')){const _pc=_v.querySelector('.pc');if(_pc){const _d=document.createElement('div');_d.className='related-topics';_d.innerHTML='<div class="related-label">Verwandte Themen</div><div class="related-chips">'+RELATED[id].map(([rid,rl])=>'<button class="related-chip" onclick="NAV.go(\''+rid+'\',\''+rl+'\')">'+rl+'</button>').join('')+'</div>';_pc.appendChild(_d);}}}
    updateReadProgress();
    CHECKS.init(id);
    // Update URL for direct linking
    const url=new URL(location.href);
    if(id==='v-home') url.searchParams.delete('id'); else url.searchParams.set('id',id);
    history.replaceState(history.state,'',url.pathname+(url.search==='?'||url.search===''?'':url.search));
    // Recently visited
    if(typeof RECENT!=='undefined') RECENT.track(id);
  }

  function updateHeader(){
    const bb=document.getElementById('back-btn');
    const fb=document.getElementById('float-back');
    const cr=document.getElementById('breadcrumb');
    const noStack = stack.length===0;

    // Header back button (desktop)
    bb.classList.toggle('hidden', noStack);

    // Floating back button (mobile)
    if(fb) fb.classList.toggle('hidden', noStack);

    if(noStack){ cr.innerHTML=''; return; }

    // Breadcrumb trail
    const items=[{label:'Startseite',idx:-1},...stack.map((s,i)=>({label:s.label,idx:i}))];
    cr.innerHTML=items.map((item,i)=>{
      const last=i===items.length-1;
      const cls=last?'crumb-item active':'crumb-item';
      const click=last?'':(item.idx===-1?'onclick="NAV.home()"':`onclick="NAV.jumpTo(${item.idx})"`);
      return `<span class="${cls}" ${click}>${item.label}</span>`;
    }).join('');

    // Float button label = previous page or Startseite
    if(fb){
      const prev = stack.length>=2 ? stack[stack.length-2].label : 'Startseite';
      const lbl = fb.querySelector('.fb-label');
      if(lbl) lbl.textContent = prev;
    }
  }

  return {
    go(id,label){ _dir='forward'; stack.push({id,label}); history.pushState({stack:[...stack]},''); show(id); },
    back(){ if(!stack.length) return; _dir='back'; stack.pop(); show(stack.length?stack[stack.length-1].id:'v-home'); },
    jumpTo(idx){ _dir=idx<stack.length-1?'back':'forward'; stack=stack.slice(0,idx+1); history.pushState({stack:[...stack]},''); show(idx>=0?stack[idx].id:'v-home'); },
    home(){ _dir='back'; stack=[]; history.pushState({home:true},''); show('v-home'); },
    _restoreStack(s){ _dir='back'; stack=s; show(s.length?s[s.length-1].id:'v-home'); }
  };
})();

history.replaceState({home:true},'');
window.addEventListener('popstate',function(e){
  if(e.state&&e.state.stack){
    // Restore stack from state and show the top view
    const s=e.state.stack;
    NAV._restoreStack(s);
  } else {
    NAV._restoreStack([]);
  }
});

/* ======================================================================
   SIMULATOR ENGINE – 4 SZENARIEN
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
    menuBtn.addEventListener('click',() => this.backToMenu());
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
   FLASHCARD-DATEN (61 Karten)
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
  {id:'f21',cat:'HLFS · GABC',q:'Welche Schutzkleidungsstufen gibt es bei GABC?',a:'<strong>KS 1:</strong> Feuerschutzanzug + PA · <strong>KS 2:</strong> CSA (Chemikalienschutzanzug) · <strong>KS 3:</strong> Gasdichter Vollschutzanzug + PA · <strong>KS 4:</strong> Druckluftanzug'},
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
  {id:'g41',cat:'GAL · GABC',q:'Welche Körperschutzformen kennt der Feuerwehrdienst?',a:'<ul><li><strong>Form 1</strong> Spritzschutz (Einweganzug, Atemschutz)</li><li><strong>Form 2</strong> Kontaminationsschutz</li><li><strong>Form 3 (CSA)</strong> gasdichter Chemikalienschutzanzug + PA innen</li></ul>Auswahl nach Stoff, Konzentration, Expositionszeit, Schutzziel.'},
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
  {id:'v06',cat:'VAk · Verwaltungsrecht',q:'Was ist ein Verwaltungsakt (VA) und welche Merkmale muss er erfüllen?',a:'Ein VA ist eine <strong>hoheitliche Maßnahme einer Behörde</strong> auf dem Gebiet des öffentlichen Rechts zur <strong>Regelung eines Einzelfalls mit Außenwirkung</strong>.<br>Inhalt: muss hinreichend bestimmt sein (Wer, Was, Wann, Wo, Wie); schriftlicher VA enthält Begründung + Rechtsbehelfsbelehrung (Frist 1 Monat).'},
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
  {id:'h01',cat:'FeuAK · VWL',q:'Was ist der Unterschied zwischen Mikro- und Makroökonomie?',a:'<strong>Mikroökonomie:</strong> untersucht einzelne Elemente der Wirtschaft – Haushalte, Unternehmen, Märkte (Angebot/Nachfrage, Marktformen).<br><strong>Makroökonomie:</strong> untersucht die Volkswirtschaft als Ganzes – BIP, Inflation, Arbeitslosigkeit, Geldpolitik.'},
  {id:'h02',cat:'FeuAK · VWL',q:'Was sind Opportunitätskosten und welche VWL-Regel beschreibt sie?',a:'Regel 2 der 10 VWL-Regeln: <strong>Die Kosten für das, was man will, bestehen aus dem, was man dafür aufzugeben hat.</strong><br>Beispiel: Wer ein Auto kauft, gibt Bahnkarte oder Freizeitzeit auf. Opportunitätskosten = entgangene Alternative.'},
  {id:'h03',cat:'FeuAK · VWL',q:'Welche 4 Marktformen gibt es in der Mikroökonomie?',a:'<strong>Polypol:</strong> viele Anbieter, identische Produkte – kein Preiseinfluss.<br><strong>Oligopol:</strong> wenige Anbieter, hohe Nachfrage.<br><strong>Monopol:</strong> ein Anbieter beeinflusst Marktpreis vollständig.<br><strong>Monopol. Konkurrenz:</strong> viele Anbieter differenzierter Produkte mit Preiseinfluss.'},
  {id:'h04',cat:'FeuAK · VWL',q:'Welche 4 Ursachen führen zu Marktversagen?',a:'<strong>1. Marktmacht:</strong> Anbieter/Käufer kann Preis beeinflussen.<br><strong>2. Externalitäten:</strong> negative (Abgase) oder positive (Impfung) Nebeneffekte.<br><strong>3. Öffentliche Güter:</strong> fehlende Ausschließbarkeit und/oder Nutzungsrivalität.<br><strong>4. Natürliche Monopole:</strong> ein Anbieter bedient Markt effizienter (Strom, Bahn).'},
  {id:'h05',cat:'FeuAK · VWL',q:'Was ist das BIP und wie wird es berechnet?',a:'<strong>BIP = Bruttoinlandsprodukt</strong> – Marktwert aller für den Endverbraucher bestimmten Güter und Dienstleistungen eines Landes in einem Zeitraum.<br><strong>3 Berechnungsseiten:</strong> Entstehung (wer produziert?) · Verwendung (Konsum, Invest., Staatsausgaben, Nettoexporte) · Verteilung (Gesamteinkommen).'},
  {id:'h06',cat:'FeuAK · BWL',q:'Was sind Maximal- und Minimalprinzip in der BWL?',a:'<strong>Maximalprinzip:</strong> mit gegebenem Mitteleinsatz maximales Ergebnis erzielen.<br><strong>Minimalprinzip:</strong> ein gegebenes Ergebnis mit minimalem Mitteleinsatz erzielen.<br>Beide sind Ausprägungen des <strong>ökonomischen Prinzips</strong> zur Bedürfnisbefriedigung angesichts knapper Ressourcen.'},
  {id:'h07',cat:'FeuAK · BWL',q:'Was unterscheidet Push- und Pullsystem in der Materialwirtschaft?',a:'<strong>Pushsystem:</strong> Planung „schiebt" das Material – laufende Aufträge werden abgearbeitet, um Platz für neue zu schaffen.<br><strong>Pullsystem:</strong> Nachfrage „zieht" die Fertigung – Just-in-Time / Lean Production, möglichst lagerlose, bedarfssynchrone Bereitstellung.'},
  {id:'h08',cat:'FeuAK · BWL',q:'Welche 5 Schritte umfasst der Beschaffungsprozess?',a:'<strong>1. Bedarfsermittlung</strong> · <strong>2. Beschaffungsmarktforschung</strong> (Marktinformationen) · <strong>3. Make or Buy</strong> (Eigen- vs. Fremdbezug) · <strong>4. Bestellung & Abwicklung</strong> (Mengen, Lieferbedingungen) · <strong>5. Lieferantenmanagement</strong> (Lieferantenkreis, Zusammenarbeit).'},
  {id:'h09',cat:'FeuAK · Haushalt',q:'Was ist das Neue Steuerungsmodell (NSM) und welche Kernelemente hat es?',a:'NSM = Konzept zur <strong>Steigerung der Leistungsfähigkeit der Verwaltung</strong> durch Kostentransparenz, Wirtschaftlichkeit und Ergebnisorientierung.<br><strong>Kernelemente:</strong> Doppik, Produktorientierung, Budgetierung, dezentrale Ressourcenverantwortung, KLR, Controlling, Prozessoptimierung, Qualitätsmanagement.'},
  {id:'h10',cat:'FeuAK · Haushalt',q:'Welche 3 Säulen bilden das Rechnungssystem im NSM?',a:'<strong>Liquiditätsrechnung:</strong> tatsächliche Geldflüsse (Einnahmen/Ausgaben) – ähnlich Kameralistik.<br><strong>Ergebnisrechnung:</strong> alle Aufwendungen und Erträge einer Periode (Ressourcenverbrauch).<br><strong>Bilanz (Vermögensrechnung):</strong> Gegenüberstellung Aktiva und Passiva zum Stichtag.'},
  {id:'h11',cat:'FeuAK · Haushalt',q:'Was leisten Kostenträger-, Kostenstellen- und Kostenartenrechnung?',a:'<strong>Kostenträgerrechnung:</strong> Was kostet ein Produkt/eine Leistung? (z.B. Rettungsdiensteinsatz)<br><strong>Kostenstellenrechnung:</strong> Was kostet eine Organisationseinheit? (z.B. Wache)<br><strong>Kostenartenrechnung:</strong> Welche Kostenart (Personal, Material, Abschreibung) fällt insgesamt an?'},
  {id:'h12',cat:'FeuAK · Haushalt',q:'Welche 4 Einnahmewege (Subsidiarität) kennt das kommunale Haushaltsrecht?',a:'<strong>1. Allgemeine Deckungsmittel</strong> (Finanzausgleiche, Gemeindeanteil Bundessteuer, Mieten/Pachten).<br><strong>2. Leistungsgebundene Einnahmen</strong> (Gebühren, zweckgeb. Zuschüsse).<br><strong>3. Gemeindesteuern</strong> (Gewerbe-, Grundsteuer, Hundesteuer).<br><strong>4. Kredite</strong> (nachrangig).'},
  {id:'h13',cat:'FeuAK · Haushalt',q:'Was ist bei vorläufiger Haushaltsführung erlaubt – und was nicht?',a:'<strong>Erlaubt:</strong> rechtl. verpflichtete Ausgaben (Verträge, Gehälter, Gefahrenabwehr), Dienstbetrieb (Kraftstoff), begonnene Investitionen fortführen, Einnahmen erzielen.<br><strong>Nicht erlaubt:</strong> sonstige Ausgaben, neue erhebliche Investitionen beginnen, neue Stellen besetzen.'},
  {id:'h14',cat:'FeuAK · Vergabe',q:'Was regelt das Vergaberecht und wofür gilt es?',a:'Vergaberecht regelt <strong>nicht was</strong>, sondern <strong>wie</strong> der öffentliche Auftraggeber bei der Beschaffung von Waren, Bau- und Dienstleistungen vorzugehen hat.<br><strong>Ausnahmen:</strong> Arbeitsverträge, KatS/Gefahrenabwehr/Zivilschutz, Inhouse-Geschäfte.'},
  {id:'h15',cat:'FeuAK · Vergabe',q:'Wo liegen die EU-Schwellenwerte (Oberschwelle)?',a:'<strong>Dienst- und Lieferleistungen:</strong> ab ca. 221.000 € (EU 2026: 216.000 €).<br><strong>Bauleistungen:</strong> ab ca. 5.538.000 € (EU 2026: 5.404.000 €).<br><strong>Unterhalb:</strong> gilt Landesrecht.<br>Achtung: Schwellenwerte ändern sich regelmäßig!'},
  {id:'h16',cat:'FeuAK · Vergabe',q:'Welche 8 Grundsätze des Vergaberechts gibt es?',a:'<strong>1</strong> Wettbewerb (mind. 3 Anbieter) · <strong>2</strong> Transparenz · <strong>3</strong> Verhältnismäßigkeit · <strong>4</strong> Gleichbehandlung · <strong>5</strong> Strategische Ziele · <strong>6</strong> Mittelstandsfreundlichkeit (Losaufteilung) · <strong>7</strong> Elektronische Mittel · <strong>8</strong> Rechtsanspruch auf Einhaltung.'},
  {id:'h17',cat:'FeuAK · Vergabe',q:'Welche Unterschwellen-Vergabeverfahren gibt es und ab welchen Werten?',a:'<strong>Direktkauf:</strong> bis 1.000 €.<br><strong>Verhandlungsvergabe:</strong> 10.000–100.000 € (mind. 3 Bieter).<br><strong>Beschränkte Ausschreibung:</strong> ab 100.000 € (mind. 3 angeschriebene Bieter).<br><strong>Öffentliche Ausschreibung:</strong> ab 100.000 € (unbeschränkter Bieterkreis).'},
  {id:'h18',cat:'FeuAK · Rechnungswesen',q:'Worin unterscheiden sich externes und internes Rechnungswesen?',a:'<strong>Externes RW:</strong> Außenwirkung (Staat, Gläubiger) – Buchführung/Jahresabschluss, folgt HGB/EStG/AO, ermittelt steuerlichen Gewinn.<br><strong>Internes RW:</strong> innere Organisation (Vorstand, Planung) – KLR, Investitionsrechnung; kann prospektiv (Planung) und retrospektiv (Auswertung) eingesetzt werden.'},
  {id:'h19',cat:'FeuAK · Rechnungswesen',q:'Welche 4 GoB-Grundsätze gelten für die Buchführung?',a:'<strong>1. Klar & übersichtlich</strong> – keine Verrechnung von Vermögen und Schulden.<br><strong>2. Vollständige Erfassung</strong> – fortlaufend, richtig, zeitgerecht, sachgerecht.<br><strong>3. Keine Buchung ohne Beleg</strong> – nummerierte Belege (HGB).<br><strong>4. Aufbewahrungsfrist 10 Jahre</strong> für Bücher, Belege, Jahresabschlüsse (seit 2025: GoBD).'},
  {id:'h20',cat:'FeuAK · Rechnungswesen',q:'Wie ist die Bilanz aufgebaut?',a:'<strong>Aktiva (Mittelverwendung):</strong> Anlagevermögen (Gebäude, Maschinen – geringe Liquidität) + Umlaufvermögen (Vorräte, Forderungen, Kasse – hohe Liquidität).<br><strong>Passiva (Mittelherkunft):</strong> Eigenkapital (inkl. Gewinn-/Verlustrechnung) + Fremdkapital (Verbindlichkeiten, Rückstellungen).<br>Beide Seiten sind stets <strong>ausgeglichen</strong>.'},
  {id:'h21',cat:'FeuAK · Rechnungswesen',q:'Was sind Strömungsgrößen in der Kostenrechnung?',a:'<strong>Abfließend (negativ):</strong> Auszahlungen → Ausgaben → Aufwände → Kosten.<br><strong>Zufließend (positiv):</strong> Einzahlungen → Einnahmen → Erträge → Leistungen/Erlöse.<br>Einzahlungen erhöhen, Auszahlungen verringern den Zahlungsmittelbestand.'},
  {id:'h22',cat:'FeuAK · Rechnungswesen',q:'Was ist der Unterschied zwischen Einzel- und Gemeinkosten?',a:'<strong>Einzelkosten:</strong> direkt und willkürfrei einem Produkt zurechenbar nach dem Verursacherprinzip (Material, Löhne, Entwicklungsstunden).<br><strong>Gemeinkosten:</strong> indirekt und willkürlich zurechenbar (Miete, Maschinenabschreibung, Buchhaltungskosten) – müssen über Schlüssel verteilt werden.'},
  {id:'h23',cat:'FeuAK · PM',q:'Welche 3 Strategietypen nach Porter gibt es?',a:'<strong>Kostenführerstrategie:</strong> preisgünstigster Wettbewerber sein.<br><strong>Differenzierungsstrategie:</strong> Abheben von Konkurrenz durch einzigartiges Produkt/Service.<br><strong>Nischenstrategie:</strong> Fokus auf eng definiertes Käufersegment.'},
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
  {id:'v42',cat:'VAk · Einsatzrecht',q:'Welche Grundrechte sind im Feuerwehreinsatz besonders relevant?',a:'<strong>Art. 1 GG:</strong> Unantastbarkeit der Menschenwürde – absolut geschützt, kein Eingriff möglich.<br><strong>Art. 2 GG:</strong> Freiheit der Person / körperl. Unversehrtheit – z.B. bei Zwangsrettung.<br><strong>Art. 11 GG:</strong> Freizügigkeit – z.B. bei Sperrmaßnahmen.<br><strong>Art. 13 GG:</strong> Unverletzlichkeit der Wohnung – Betretensrecht nur mit Rechtsgrundlage.<br><strong>Art. 14 GG:</strong> Eigentumsschutz – z.B. bei Abrissen oder Beschädigungen im Einsatz.'},
  {id:'v43',cat:'VAk · Einsatzrecht',q:'Welche 5 Fragen prüft man, ob die Feuerwehr handeln muss/darf?',a:'<strong>1. Aufgabenzuweisung:</strong> Hat die Feuerwehr durch Feuerwehrgesetz einen Auftrag?<br><strong>2. Konkrete Gefahr:</strong> Liegt eine konkrete Gefahr für ein Schutzgut vor?<br><strong>3. Handlungsverpflichtung:</strong> Besteht eine Pflicht zum Einschreiten?<br><strong>4. Befugnis:</strong> Liegt eine gesetzliche Eingriffsbefugnis vor?<br><strong>5. Rechtmäßigkeit:</strong> Muss das Handeln rechtmäßig sein (Verhältnismäßigkeit, Zuständigkeit).'},
  {id:'v44',cat:'VAk · Einsatzrecht',q:'Welche Rechte und Pflichten hat die Bevölkerung gegenüber der Feuerwehr?',a:'<strong>Unmittelbare Pflichten:</strong> Pflicht zur Gefahrenvermeidung, Meldepflicht, Hilfeleistungspflicht (Heranziehen von Personen und Sachmitteln).<br><strong>Mittelbare Pflichten (Duldungspflichten):</strong> Entfernen störender Gegenstände, Zutritts- und Betretensrecht dulden, Duldungsverpflichtung auch für Nachbargrundstücke.<br>Nicht nachkommen kann <strong>Ordnungswidrigkeit</strong> nach Feuerwehrgesetz sein. Verhältnismäßigkeit immer beachten!'},
  {id:'v45',cat:'VAk · Einsatzrecht',q:'Wann ist eine strafrechtliche Handlung der Feuerwehr gerechtfertigt?',a:'Verwirklicht die Feuerwehr einen Straftatbestand, ist sie in <strong>persönlicher Verantwortung</strong> (i.d.R. fahrlässig).<br><strong>Rechtfertigung möglich, wenn:</strong><br>1. Eine Gefahr für Leib, Leben, Freiheit, Ehre, Eigentum oder ein anderes Rechtsgut bestand.<br>2. Das geschützte Interesse das beeinträchtigte <strong>wesentlich überwiegt</strong>.<br>→ Dann bleibt die Verwirklichung des Straftatbestands <strong>straffrei</strong>.'},
  {id:'v46',cat:'VAk · Dienstrecht',q:'Was sind die 3 Einstellungskriterien nach Art. 33 II GG und was ist der Bewerberverfahrensanspruch?',a:'<strong>Art. 33 II GG – Bestenauslese:</strong><br><strong>1. Eignung:</strong> persönliche, charakterliche, gesundheitliche Eigenschaften.<br><strong>2. Befähigung:</strong> fachliches Wissen und Können für die Laufbahn.<br><strong>3. Fachliche Leistung:</strong> bisherige Arbeitsleistung (dienstliche Beurteilungen).<br><strong>Bewerberverfahrensanspruch:</strong> leistungsgerechte Einbeziehung aller; bei Gleichstand Hilfskriterien; nach Auswahl 2-wöchige Wartefrist (Ämterstabilität); Grundsatz: Stellenausschreibungspflicht.'},
  {id:'v47',cat:'VAk · Dienstrecht',q:'Welche 3 Beurteilungsarten gibt es und wann werden sie eingesetzt?',a:'<strong>1. Regelbeurteilung:</strong> periodisch für alle Beamten; Standardform; Grundlage für Beförderungsentscheidungen.<br><strong>2. Anlassbeurteilung:</strong> wenn keine aktuelle, vergleichbare Regelbeurteilung vorliegt und eine Auswahlentscheidung ansteht.<br><strong>3. Probezeitbeurteilung:</strong> prüft Bewährung nach Eignung, Befähigung und fachlicher Leistung vor Übernahme in das Beamtenverhältnis auf Lebenszeit.'},
  {id:'v48',cat:'VAk · Dienstrecht',q:'Welche 5 Disziplinarmaßnahmen gibt es aufsteigend nach Schwere?',a:'<strong>1. Verweis:</strong> leichtes Dienstvergehen, keine/geringe Vertrauenseinschränkung.<br><strong>2. Geldbuße:</strong> leichtes bis mittelschweres Vergehen.<br><strong>3. Kürzung der Dienstbezüge:</strong> mittelschweres Vergehen, erhebliche Vertrauensbeeinträchtigung.<br><strong>4. Zurückstufung:</strong> mittelschweres bis schweres Vergehen, Vertrauen nachhaltig erschüttert.<br><strong>5. Entfernung aus dem Beamtenverhältnis:</strong> schweres Vergehen, Vertrauen endgültig verloren.'},
  {id:'v49',cat:'VAk · Dienstrecht',q:'Wie läuft ein Disziplinarverfahren in 4 Schritten ab?',a:'<strong>1. Verdacht:</strong> Vorermittlungen, Kenntnis durch Vorgesetzte/Beschwerde; Einleitung von Amts wegen oder auf Antrag des Beamten.<br><strong>2. Einleitungsverfügung:</strong> Unterrichtung und Belehrung des Betroffenen, Anhörung, Rechtsbeistand.<br><strong>3. Ermittlung:</strong> Ermittlungsführer erhebt Beweis; Aussetzung bei laufendem Strafverfahren.<br><strong>4. Abschluss:</strong> Einstellung (mit/ohne Dienstvergehen), Disziplinarverfügung, ggf. Klage beim VG.'},

  /* ── FeuAK Hamburg – Zusatzkarten ── */
  {id:'h26',cat:'FeuAK · VWL',q:'Wie funktioniert der Preismechanismus über Angebot und Nachfrage?',a:'<strong>Nachfragekurve:</strong> fallend – je höher der Preis, desto weniger wird nachgefragt.<br><strong>Angebotskurve:</strong> steigend – je höher der Preis, desto mehr wird angeboten.<br><strong>Gleichgewichtspreis:</strong> Schnittpunkt; Markt räumt sich selbst.<br>Verschiebungen: Einkommenszunahme → Nachfrage↑ → P↑ und Q↑; Kostensenkung → Angebot↑ → P↓ und Q↑.'},
  {id:'h27',cat:'FeuAK · VWL',q:'Welche 4 Phasen hat ein Konjunkturzyklus?',a:'<strong>1. Aufschwung (Expansion):</strong> wachsende Produktion, sinkende Arbeitslosigkeit, steigende Investitionen.<br><strong>2. Hochkonjunktur (Boom):</strong> Vollauslastung, Preissteigerungen, Inflationsdruck.<br><strong>3. Abschwung (Rezession):</strong> sinkendes BIP (mind. 2 Quartale), steigende Arbeitslosigkeit.<br><strong>4. Tiefstand (Depression):</strong> niedrigste Auslastung, maximale Arbeitslosigkeit.'},
  {id:'h28',cat:'FeuAK · VWL',q:'Welche Instrumente nutzt die EZB zur Geldpolitik?',a:'<strong>Leitzinsen:</strong> Hauptrefinanzierungssatz (Kreditkosten), Einlagezins, Spitzenrefinanzierungssatz.<br><strong>Offenmarktpolitik:</strong> An-/Verkauf von Wertpapieren (QE = quantitative Lockerung).<br><strong>Mindestreserve:</strong> Pflichtanteil der Einlagen bei EZB.<br>Ziel: <strong>Preisstabilität</strong> (Inflation ≈ 2 % p.a.).'},
  {id:'h29',cat:'FeuAK · BWL',q:'Was ist die ABC-Analyse und wie wird sie in der Beschaffung eingesetzt?',a:'Priorisierungsinstrument nach dem 80/20-Prinzip:<br><strong>A-Güter:</strong> ≈ 80 % des Beschaffungswertes, ≈ 20 % der Positionen → intensives Management, Rahmenverträge.<br><strong>B-Güter:</strong> mittlere Bedeutung, Standardprozesse.<br><strong>C-Güter:</strong> ≈ 5 % des Wertes, ≈ 50 % der Positionen → vereinfachte Sammelbestellungen.<br>Ziel: Ressourceneinsatz auf das Wesentliche konzentrieren.'},
  {id:'h30',cat:'FeuAK · BWL',q:'Was sind die 5 Grundprinzipien von Lean Management?',a:'<strong>1. Wert definieren</strong> (aus Kundensicht).<br><strong>2. Wertstrom identifizieren</strong> (alle wertschöpfenden Schritte).<br><strong>3. Fließprinzip</strong> (unterbrechungsfreier Ablauf).<br><strong>4. Pullprinzip</strong> (Produktion nur auf tatsächliche Nachfrage).<br><strong>5. Perfektion anstreben</strong> (KVP/Kaizen).<br>Ziel: Verschwendung (Muda) eliminieren.'},
  {id:'h31',cat:'FeuAK · Haushalt',q:'Welche 6 Haushaltsgrundsätze gelten im kommunalen Haushaltsrecht?',a:'<strong>1. Vollständigkeit:</strong> alle Einnahmen und Ausgaben erfassen.<br><strong>2. Einheit:</strong> ein Haushaltsplan pro Periode.<br><strong>3. Öffentlichkeit:</strong> Haushalt öffentlich zugänglich.<br><strong>4. Jährlichkeit:</strong> gilt für ein Haushaltsjahr.<br><strong>5. Sparsamkeit und Wirtschaftlichkeit:</strong> Mittel optimal einsetzen.<br><strong>6. Vorherigkeit:</strong> Haushalt vor Beginn des HH-Jahres beschließen.'},
  {id:'h32',cat:'FeuAK · Haushalt',q:'Was ist Benchmarking im öffentlichen Sektor?',a:'<strong>Systematischer Vergleich</strong> von Prozessen, Leistungen und Kosten (Best-Practice-Vergleich).<br><strong>Arten:</strong> intern (abteilungsübergreifend), extern (andere Kommunen), funktional (branchenübergreifend).<br>Ziel: Effizienzlücken aufdecken, wirtschaftliches Handeln belegen.<br>Wichtig: Vergleichbarkeit sicherstellen (gleiche Kennzahlen, Kostenstrukturen).'},
  {id:'h33',cat:'FeuAK · Vergabe',q:'Welche Vergabeverfahrensarten gibt es oberhalb der EU-Schwellenwerte?',a:'<strong>1. Offenes Verfahren:</strong> unbegrenzte Bewerber, öffentliche Bekanntmachung (Standardverfahren).<br><strong>2. Nicht offenes Verfahren:</strong> nur ausgewählte Bieter.<br><strong>3. Verhandlungsverfahren:</strong> Verhandlungen mit Bietern (mit/ohne Bekanntmachung).<br><strong>4. Wettbewerblicher Dialog:</strong> komplexe Vorhaben, Lösungsoffenheit.<br><strong>5. Innovationspartnerschaft:</strong> F&E + Beschaffung in einem Verfahren.'},
  {id:'h34',cat:'FeuAK · Vergabe',q:'Was bedeutet MEAT und welche Kriterien fließen in die Zuschlagsentscheidung ein?',a:'<strong>MEAT = Most Economically Advantageous Tender</strong> (wirtschaftlich vorteilhaftestes Angebot).<br>Kriterien neben dem Preis: Qualität, technischer Wert, Funktionalität, Umwelteigenschaften, Betriebskosten, Kundendienst, Lieferdatum, Lebenszykluskosten.<br>Preis allein nur noch bei einfachen Lieferungen zulässig.'},
  {id:'h35',cat:'FeuAK · Vergabe',q:'Wie kann ein Bieter gegen Vergabeentscheidungen vorgehen?',a:'<strong>Rüge</strong> (§ 160 GWB): schriftlich, unverzüglich nach Kenntnis – Voraussetzung für Nachprüfung.<br><strong>Nachprüfantrag</strong> bei der Vergabekammer → Suspensiveffekt (kein Zuschlag).<br><strong>Sofortige Beschwerde</strong> beim OLG.<br>Unterhalb EU-Schwellenwerte: nur zivilrechtlicher Schadensersatz, kein Nachprüfverfahren.'},
  {id:'h36',cat:'FeuAK · Rechnungswesen',q:'Welche Abschreibungsarten gibt es und wann werden sie eingesetzt?',a:'<strong>Lineare Abschreibung:</strong> gleichmäßige Verteilung auf Nutzungsdauer (Standardmethode HGB).<br><strong>Degressive Abschreibung:</strong> höhere Beträge am Anfang, sinkend.<br><strong>Leistungsbezogene AfA:</strong> nach Nutzung (km, Stunden) z.B. Fahrzeuge.<br><strong>Außerplanmäßig:</strong> bei dauerhafter Wertminderung (Unfall, Marktpreisverfall).'},
  {id:'h37',cat:'FeuAK · Rechnungswesen',q:'Was unterscheidet fixe und variable Kosten?',a:'<strong>Fixkosten:</strong> entstehen unabhängig von der Produktionsmenge (Miete, Abschreibungen, Grundgehälter).<br><strong>Variable Kosten:</strong> ändern sich mit der Ausbringungsmenge (Material, Energie, Akkordlohn).<br><strong>Proportional:</strong> steigen im gleichen Verhältnis.<br><strong>Degressiv:</strong> steigen unterproportional (Mengenrabatte).<br><strong>Progressiv:</strong> steigen überproportional (Überstunden).'},
  {id:'h38',cat:'FeuAK · Rechnungswesen',q:'Was ist die Deckungsbeitragsrechnung?',a:'DB = <strong>Erlöse − Variable Kosten</strong> (Beitrag zur Fixkostendeckung).<br><strong>Einstufig:</strong> DB − Fixkosten = Betriebsergebnis.<br><strong>Mehrstufig:</strong> schrittweise Verrechnung von Fixkostenschichten (Produkt-, Gruppen-, Unternehmensebene).<br>Nutzen: Break-Even-Analyse, Preisuntergrenze, Make-or-Buy-Entscheidung.'},
  {id:'h39',cat:'FeuAK · PM',q:'Was ist ein Gantt-Diagramm und wie wird es eingesetzt?',a:'<strong>Balkendiagramm</strong> zur Projektplanung (Henry Gantt, 1910).<br>X-Achse: Zeit · Y-Achse: Vorgänge/Arbeitspakete. Balken zeigen Start, Ende und Dauer.<br><strong>Stärken:</strong> einfach verständlich, zeigt Parallelarbeiten und Zeitpuffer.<br><strong>Schwächen:</strong> Abhängigkeiten weniger gut als im Netzplan darstellbar; bei vielen Vorgängen unübersichtlich.'},
  {id:'h40',cat:'FeuAK · Bedarfsplanung',q:'Was ist die Schutzzielfestlegung und welche Rolle spielt die Hilfsfrist?',a:'<strong>Schutzziel:</strong> Mindeststandard, z.B. 8 Personen in 8–10 Minuten (je nach Bundesland).<br><strong>Hilfsfrist:</strong> Zeit von der Alarmierung bis zum Eintreffen der ersten Kräfte.<br><strong>Schutzzielerfüllungsgrad:</strong> Erreichung in mind. X % der Einsätze (typisch 80–90 %).<br>Basis für: Standortplanung, Fahrzeugausstattung, Personalstärke.'},
  {id:'h41',cat:'FeuAK · Bedarfsplanung',q:'Was umfasst die Personalbedarfsplanung im öffentlichen Dienst?',a:'<strong>Quantitativ:</strong> wie viele Stellen? (Aufgaben-, Zeitbedarfs-, Personalbestandsanalyse)<br><strong>Qualitativ:</strong> welche Qualifikationen werden benötigt?<br><strong>Zeitlich:</strong> kurzfristig (Urlaub/Krankheit), mittelfristig (Fluktuation), langfristig (Demografie).<br>Instrumente: Stellenplan, Nachfolgeplanung, Ausbildungsplanung, Beurteilungswesen.'},

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
  {id:'g70',cat:'GAL · GABC',q:'Welche Gefahrgruppen kennt die FwDV 500 und was bedeuten die T-Klassen?',a:'<strong>Gefahrgruppen nach FwDV 500:</strong><br><strong>IC:</strong> normaler Schutz ausreichend (Körperschutzform 1/2).<br><strong>IIC:</strong> erweiterter Schutz (CSA / Körperschutzform 3).<br><strong>IIIC:</strong> höchster Schutz (druckgasdichter Vollschutzanzug).<br><strong>T-Klassen (Toxizität nach CLP):</strong> T+ (sehr giftig) > T (giftig) > Xn (gesundheitsschädlich).'},
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

/* ======================================================================
   PROGRESS – Lernfortschritt in LocalStorage
====================================================================== */
const PROGRESS = (function(){
  const GROUPS = {
    gal:  ['v-gal-organisation','v-gal-brandlehre','v-gal-fahrzeuge','v-gal-einsatz','v-gal-atemgifte','v-gal-atemschutz','v-gal-vb','v-gal-loeschlehre','v-gal-loeschmittel-schaum','v-gal-loeschwasserversorgung','v-gal-beamtenrecht','v-gal-beihilferecht','v-gal-brandbekaempfung','v-gal-einsatztechnik','v-gal-erstehilfe','v-gal-grundlagen','v-gal-fahrzeugnormung','v-gal-fuehrung','v-gal-fwdven','v-gal-gabc','v-gal-geraetepruefung','v-gal-hbkg','v-gal-kartenkunde','v-gal-knoten','v-gal-staatsbuerger','v-gal-th-verkehr','v-gal-leitern','v-gal-uvv','v-gal-waermebildkamera','v-gal-armaturen','v-gal-maschinist','v-gal-psa','v-gal-personalvertretungsrecht'],
    sfs:  ['v-sfs-fwdv3','v-sfs-methodik','v-sfs-rechtsgrundlagen','v-sfs-abc'],
    hlfs: ['v-hlfs-fuehrungsvorgang','v-hlfs-gabc','v-hlfs-tunnel','v-hlfs-vb','v-hlfs-manv','v-hlfs-zugfuehrer','v-hlfs-stab'],
    ibk:  ['v-ibk-ta','v-ibk-konflikt','v-ibk-stress','v-ibk-psnv','v-ibk-bgm','v-ibk-pm','v-ibk-zeit'],
    vak:  ['v-vak-lernzusammenfassung','v-vak-jur-denken','v-vak-verwaltungsrecht','v-vak-staatsrecht','v-vak-einsatzrecht','v-vak-dienstrecht','v-vak-altklausur'],
    feuak:['v-feuak-vwl','v-feuak-bwl','v-feuak-haushalt','v-feuak-vergabe','v-feuak-rechnungswesen','v-feuak-pm','v-feuak-bedarfsplanung','v-feuak-pruefung'],
    idf:  ['v-idf-brandschutz','v-idf-stab','v-idf-presse'],
  };
  const LEAF_PARENT = {};
  Object.keys(GROUPS).forEach(g => GROUPS[g].forEach(v => { LEAF_PARENT[v] = g; }));

  function load(){ try{ return JSON.parse(localStorage.getItem('bvi_progress')||'{}'); }catch{ return {}; } }
  function save(d){ try{ localStorage.setItem('bvi_progress',JSON.stringify(d)); }catch{} }

  function track(viewId){
    if(!LEAF_PARENT[viewId]) return;
    const d = load(); d[viewId] = true; save(d);
    updateUI();
  }

  function updateUI(){
    const visited = load();
    const allLeafs = Object.values(GROUPS).flat();
    const total = allLeafs.length;
    const done = allLeafs.filter(v=>visited[v]).length;
    const bar = document.getElementById('prog-bar');
    if(bar) bar.style.width = (total ? Math.round(done/total*100) : 0) + '%';

    ['gal','sfs','hlfs','ibk','vak','feuak','idf'].forEach(g => {
      const views = GROUPS[g];
      const d = views.filter(v=>visited[v]).length;
      const el = document.getElementById('prog-'+g);
      if(!el) return;
      el.textContent = d+'/'+views.length;
      el.style.display = d > 0 ? 'block' : 'none';
    });

    document.querySelectorAll('.topic-card').forEach(card => {
      const oc = card.getAttribute('onclick')||'';
      const m = oc.match(/NAV\.go\('([^']+)'/);
      if(!m) return;
      const vid = m[1];
      let chk = card.querySelector('.tc-check');
      if(visited[vid]){
        if(!chk){ chk = document.createElement('span'); chk.className='tc-check'; chk.textContent='✓'; card.style.position='relative'; card.appendChild(chk); }
      } else { if(chk) chk.remove(); }
    });
  }

  return { track, updateUI, reset(){ localStorage.removeItem('bvi_progress'); updateUI(); } };
})();

/* ======================================================================
   SEARCH – Volltext-Suche über alle Views
====================================================================== */
const SEARCH = (function(){
  let idx = [], results = [], focusIdx = -1, _filter = 'all', _indexBuilt = false, _debounceTimer = null;
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
    'v-vak-lernzusammenfassung':'VAk · Lernzusammenfassung','v-vak-jur-denken':'VAk · Juristisches Denken',
    'v-vak-verwaltungsrecht':'VAk · Allgemeines Verwaltungsrecht','v-vak-staatsrecht':'VAk · Staatsrecht',
    'v-vak-einsatzrecht':'VAk · Einsatzrecht','v-vak-dienstrecht':'VAk · Öffentliches Dienstrecht',
    'v-feuak-vwl':'FeuAK · VWL','v-feuak-bwl':'FeuAK · BWL','v-feuak-haushalt':'FeuAK · Haushalt',
    'v-feuak-vergabe':'FeuAK · Vergabe','v-feuak-rechnungswesen':'FeuAK · Rechnungswesen',
    'v-feuak-pm':'FeuAK · Projektmanagement / Strategisches Management',
    'v-feuak-bedarfsplanung':'FeuAK · Bedarfsplanung','v-feuak-pruefung':'FeuAK · Prüfungsleistung Hamburg',
    'v-idf-brandschutz':'IdF · Vorbeugender Brandschutz',
    'v-idf-stab':'IdF · Stabsarbeit',
    'v-idf-presse':'IdF · Presse- & Öffentlichkeitsarbeit',
  };

  function stripHtml(s){ const d=document.createElement('div');d.innerHTML=s;return d.textContent||''; }

  function buildIndex(){
    if(_indexBuilt) return;
    _indexBuilt = true;
    idx = [];
    Object.keys(VIEW_LABELS).forEach(vid => {
      const el = document.getElementById(vid); if(!el) return;
      const lbl = VIEW_LABELS[vid];
      el.querySelectorAll('.sec-h,.tc-name,.page-title,.def-box-label').forEach(h => {
        const t = h.textContent.trim(); if(t.length < 3) return;
        idx.push({vid, lbl, title:t, snippet:'', boost:3});
      });
      el.querySelectorAll('.def-box p,.info-card p,.bl li,.step-desc,.hint p,.tc-sub,.ant-desc,.pillar ul li').forEach(p => {
        const t = p.textContent.trim(); if(t.length < 8) return;
        const hdr = p.closest('.info-card,.def-box,.step-item');
        const ttl = hdr ? (hdr.querySelector('.info-card-title,.def-box-label,.step-title')||{}).textContent||lbl : lbl;
        idx.push({vid, lbl, title:ttl.trim(), snippet:t.slice(0,400), boost:1});
      });
    });
    // Lernkarten in den Index aufnehmen
    FLASHCARD_DATA.forEach(c=>{
      const lbl='Lernkarten · '+c.cat;
      const aText=stripHtml(c.a);
      idx.push({vid:'v-flashcards',lbl,title:c.q,snippet:aText.slice(0,400),boost:2,isCard:true});
    });
  }

  function hl(text, q){
    const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
    return text.replace(re,'<mark>$1</mark>');
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

  function doSearch(q){
    if(!q || q.length < 2) return [];
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    let scored = idx.map(e => {
      const hay = (e.title+' '+e.snippet+' '+e.lbl).toLowerCase();
      const score = terms.reduce((s,t) => s + (hay.includes(t) ? e.boost : 0), 0);
      return {...e, score};
    }).filter(e => e.score > 0);
    if(_filter !== 'all'){
      if(_filter==='karten') scored=scored.filter(e=>e.isCard);
      else scored=scored.filter(e=>!e.isCard&&(
        e.lbl.toLowerCase().split('·')[0].trim()===_filter.toLowerCase()
        ||e.lbl.toLowerCase().split('·')[0].trim().startsWith(_filter.toLowerCase())));
    }
    scored.sort((a,b) => b.score-a.score);
    const seen = new Set();
    return scored.filter(e => { const k=e.vid+'|'+e.title; if(seen.has(k)) return false; seen.add(k); return true; }).slice(0,12);
  }

  function renderBookmarks(){
    const el = document.getElementById('search-results'); if(!el) return;
    const bks = (typeof BOOKMARKS!=='undefined') ? BOOKMARKS.getAll() : [];
    const hist = loadHist();
    let html = '';
    if(bks.length) html+='<div class="bk-section"><div class="bk-section-title">⭐ Lesezeichen</div>'
      +bks.map(b=>`<div class="bk-item" onclick="SEARCH.goBk(${JSON.stringify(b.id)},${JSON.stringify(b.label||b.id)})">`
        +`<span class="bk-label">${xss(b.label||b.id)}</span>`
        +`<button class="bk-del" onclick="event.stopPropagation();SEARCH.removeBk(${JSON.stringify(b.id)})">✕</button>`
        +'</div>').join('')+'</div>';
    if(hist.length) html+='<div class="bk-section"><div class="bk-section-title">🕐 Zuletzt gesucht</div>'
      +hist.map(q=>`<div class="bk-item" onclick="SEARCH.runHist(${JSON.stringify(q)})">`
        +`<span class="bk-label">${xss(q)}</span>`
        +`<button class="bk-del" onclick="event.stopPropagation();SEARCH.clearHist()">✕</button>`
        +'</div>').join('')+'</div>';
    if(!html) html='<div class="search-idle">Suchbegriff eingeben – z.&nbsp;B. <em>AVIVA</em>, <em>Glasl</em>, <em>MANV</em></div>';
    el.innerHTML=html;
  }

  function render(q){
    const el = document.getElementById('search-results');
    if(!q){ renderBookmarks(); results=[]; focusIdx=-1; return; }
    results = doSearch(q);
    if(!results.length){ el.innerHTML='<div class="search-empty">Keine Treffer für <strong>'+xss(q)+'</strong></div>'; focusIdx=-1; return; }
    el.innerHTML = results.map((r,i)=>`<div class="search-result" data-idx="${i}" onclick="SEARCH.go(${i})"><span class="sr-section">${r.lbl}</span><div><div class="sr-title">${hl(xss(r.title),q)}</div>${r.snippet?`<div class="sr-snippet">${hl(xss(contextSnippet(r.snippet,q)),q)}</div>`:''}</div></div>`).join('');
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
      buildIndex(); _filter='all';
      document.querySelectorAll('.sf-btn').forEach(b=>b.classList.toggle('active',b.dataset.f==='all'));
      document.getElementById('search-overlay').classList.remove('hidden');
      const inp = document.getElementById('search-input');
      inp.value = ''; inp.focus(); render('');
    },
    close(){ document.getElementById('search-overlay').classList.add('hidden'); results=[]; focusIdx=-1; },
    toggle(){ document.getElementById('search-overlay').classList.contains('hidden') ? this.open() : this.close(); },
    query(q){ clearTimeout(_debounceTimer); _debounceTimer = setTimeout(()=>render(q.trim()), 150); },
    setFilter(f){
      _filter=f;
      document.querySelectorAll('.sf-btn').forEach(b=>b.classList.toggle('active',b.dataset.f===f));
      render(document.getElementById('search-input').value.trim());
    },
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
      saveHist(document.getElementById('search-input').value.trim());
      this.close();
      const lbl = r.lbl.split('·').pop().trim();
      NAV.go(r.vid, lbl);
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
const TOAST = (function(){
  let wrap;
  function container(){ if(!wrap){ wrap=document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); } return wrap; }
  return {
    show(msg, {type='',undo=null,duration=4200}={}){
      const t=document.createElement('div');
      t.className='toast'+(type?' toast-'+type:'');
      t.innerHTML=`<span class="toast-msg">${msg}</span>${undo?'<button class="toast-undo">Rückgängig</button>':''}`;
      if(undo) t.querySelector('.toast-undo').addEventListener('click',()=>{ undo(); this.dismiss(t); });
      container().appendChild(t);
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
  function closeAllPanels(){
    document.getElementById('fontsize-overlay')?.classList.add('hidden');
    document.getElementById('notif-overlay')?.classList.add('hidden');
  }
  return {
    toggleFontPanel(){
      const p=document.getElementById('fontsize-overlay');
      const was=p?.classList.contains('hidden');
      closeAllPanels();
      if(was) p?.classList.remove('hidden');
    },
    toggleNotifPanel(){
      const p=document.getElementById('notif-overlay');
      const was=p?.classList.contains('hidden');
      closeAllPanels();
      if(was){ p?.classList.remove('hidden'); if(typeof NOTIF!=='undefined') NOTIF.updateUI(); }
    },
    closeAllPanels,
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

/* DARKMODE removed – app is always dark */
const DARKMODE = { init(){}, toggle(){} };

/* ======================================================================
   NOTES – Seitennotizen (localStorage pro View)
====================================================================== */
const NOTES = (function(){
  let _view = null, _prevNote = '', _undoTimer = null;
  const SKIP = new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz']);
  function key(){ return 'bvi_note_'+(_view||'home'); }
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
    const fab = document.getElementById('notes-fab');
    if(fab) fab.classList.toggle('fab-active', !!(note && note.trim()));
  }
  function ensureWidget(){}
  return {
    setView(id){ _view = id; ensureWidget(); updateBtn(); },
    open(){
      const ta = document.getElementById('notes-textarea');
      if(ta) ta.value = localStorage.getItem(key())||'';
      document.getElementById('notes-overlay').classList.remove('hidden');
      if(ta) setTimeout(()=>ta.focus(),80);
    },
    close(){
      const ta = document.getElementById('notes-textarea');
      if(ta){ const v=ta.value.trim(); if(v) localStorage.setItem(key(),ta.value); else localStorage.removeItem(key()); }
      document.getElementById('notes-overlay').classList.add('hidden');
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
      const blob = new Blob([entries.join('\n\n---\n\n')], {type:'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href=url; a.download='bvi-notizen.txt'; a.click();
      URL.revokeObjectURL(url);
      TOAST.show('Notizen exportiert',{type:'ok'});
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
    const btn=document.getElementById('bookmark-btn');
    if(!btn||!id) return;
    btn.classList.toggle('fab-active', load().some(b=>b.id===id));
  }
  function updateHomeTile(){
    const tile=document.getElementById('bm-tile');
    const desc=document.getElementById('bm-tile-desc');
    const d=load();
    if(tile){ tile.classList.toggle('hidden', d.length===0); }
    if(desc){ desc.textContent=d.length===1?'1 gespeicherte Seite':`${d.length} gespeicherte Seiten`; }
  }
  function renderPage(){
    const list=document.getElementById('bm-list');
    const empty=document.getElementById('bm-empty');
    if(!list) return;
    const d=load();
    if(!d.length){ list.innerHTML=''; empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');
    list.innerHTML=d.map(b=>`
      <div class="bm-card">
        <div class="bm-card-label">${xss(b.label||b.id)}</div>
        <div class="bm-card-actions">
          <button class="btn btn-gold bm-open" data-id="${xss(b.id)}" data-label="${xss(b.label||b.id)}">Öffnen →</button>
          <button class="btn btn-ghost bm-remove" data-id="${xss(b.id)}">✕ Entfernen</button>
        </div>
      </div>`).join('');
    list.querySelectorAll('.bm-open').forEach(btn=>{
      btn.addEventListener('click',()=>NAV.go(btn.dataset.id, btn.dataset.label));
    });
    list.querySelectorAll('.bm-remove').forEach(btn=>{
      btn.addEventListener('click',()=>{ removeBk(btn.dataset.id); renderPage(); updateHomeTile(); });
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
      save(d); syncFab(id); updateHomeTile();
    },
    getAll(){ return load(); },
    remove(id){ removeBk(id); },
    renderPage,
    updateHomeTile
  };
})();

/* ======================================================================
   LESEFORTSCHRITT
====================================================================== */
const NO_PROG = new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz']);
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
  let focusMode = false;
  let sortDifficult = false;

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

  function getDeck(){
    let base = activeFilters.size===CATS.length ? [...FLASHCARD_DATA]
      : FLASHCARD_DATA.filter(c=>CATS.filter(f=>activeFilters.has(f)).some(f=>c.cat.toLowerCase().startsWith(f)));
    if(focusMode){
      const known=fcLoad(); const now=Date.now();
      base=base.filter(c=>{ const e=known[c.id]; return !e||(e.nextReview<=now); });
    }
    return sortDifficult ? sortByDiff(base) : shuffle(base);
  }

  function updateFilterButtons(){
    const known=fcLoad();
    const allSel=CATS.every(c=>activeFilters.has(c));
    const PRUEFUNG_CATS=['ibk','vak','feuak','idf'];
    const isPruefung=!focusMode&&PRUEFUNG_CATS.every(c=>activeFilters.has(c))&&activeFilters.size===PRUEFUNG_CATS.length;
    const now=Date.now();
    document.querySelectorAll('.fc-f-btn').forEach(b=>{
      const df=b.dataset.filter;
      const base=b.dataset.label||'';
      if(df==='all'){
        b.classList.toggle('active',allSel&&!focusMode&&!isPruefung);
        b.textContent=`${base} (${FLASHCARD_DATA.length})`;
      } else if(df==='fokus'){
        const due=FLASHCARD_DATA.filter(c=>{ const e=known[c.id]; return !e||(e.nextReview<=now); }).length;
        b.classList.toggle('active',focusMode);
        b.textContent=`🎯 ${base} (${due})`;
      } else if(df==='pruefung'){
        b.classList.toggle('active',isPruefung);
      } else if(df==='plan'){
        b.classList.remove('active');
      } else if(df){
        const cats=FLASHCARD_DATA.filter(c=>c.cat.toLowerCase().startsWith(df));
        const knownCnt=cats.filter(c=>known[c.id]).length;
        b.classList.toggle('active',!allSel&&!focusMode&&!isPruefung&&activeFilters.has(df));
        b.textContent=`${base} ${knownCnt}/${cats.length}`;
      }
    });
  }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]; } return a; }
  function sortByDiff(a){ const k=fcLoad(); return [...a].sort((x,y)=>{ const ex=k[x.id]; const ey=k[y.id]; return (ex?(ex.ease||2.5):2.5)-(ey?(ey.ease||2.5):2.5); }); }

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
    const knownCnt = FLASHCARD_DATA.filter(c=>known[c.id]).length;
    const card_e = known[card.id];
    const iVal=card_e?(card_e.interval||1):0;
    const ease_v=card_e?(card_e.ease||2.5):2.5;
    const reps_v=card_e?(card_e.reps||0):0;
    const iGood=reps_v>=2?Math.round(iVal*ease_v):7;
    const iHard=reps_v>=2?Math.max(3,Math.round(iVal*ease_v*0.85)):3;
    box.innerHTML = `
      <div class="fc-stats-row">
        <span class="fc-stat">🟢 ${sess.known} gewusst</span>
        <span class="fc-stat">🔴 ${sess.unknown} nicht gewusst</span>
        <span class="fc-stat">📚 ${knownCnt}/${FLASHCARD_DATA.length} gelernt</span>
        ${iVal>0?`<span class="fc-stat" title="Letztes Intervall">📅 ${iVal}d</span>`:''}
      </div>
      <div class="fc-nav">${curIdx+1} / ${deck.length}</div>
      <div class="fc-outer">
        <div class="fc-inner" id="fc-inner">
          <div class="fc-face fc-front">
            <div class="fc-cat">${card.cat}</div>
            <div class="fc-q">${card.q}</div>
            <div class="fc-tap">Tippen zum Aufdecken ↓</div>
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
        <button class="fc-btn fc-no" onclick="FC.answer(false)">✗ Nicht gewusst<span class="fc-hint">1d</span></button>
        <button class="fc-btn fc-hard" onclick="FC.answer('hard')">～ Schwer<span class="fc-hint">${iHard}d</span></button>
        <button class="fc-btn fc-yes" onclick="FC.answer(true)">✓ Gewusst<span class="fc-hint">${iGood}d</span></button>
      </div>`;
    flipped = false;
    window._shaderContentMode = 1.0;
    document.body.classList.add('mode-navy');
    requestAnimationFrame(()=>{ sizeCard(); setupSwipe(document.querySelector('.fc-outer')); });
  }

  function renderEnd(){
    window._shaderContentMode = 1.0;
    document.body.classList.add('mode-navy');
    const box = document.getElementById('fc-container'); if(!box) return;
    const known = fcLoad();
    const knownCnt = FLASHCARD_DATA.filter(c=>known[c.id]).length;
    if(focusMode && deck.length===0){
      const dueNow=FLASHCARD_DATA.filter(c=>{ const e=known[c.id]; return !e||(e.nextReview<=Date.now()); }).length;
      box.innerHTML=`<div class="fc-end"><div class="fc-end-ico">🏆</div><div class="fc-end-title">Alle fälligen Karten gelernt!</div><div class="fc-end-sub">Keine weiteren Karten fällig. Insgesamt <strong>${knownCnt}/${FLASHCARD_DATA.length}</strong> Karten gelernt.</div><div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap"><button class="btn btn-gold" onclick="FC.setFilter('plan')">📅 Zeitplan anzeigen</button><button class="btn btn-ghost" onclick="FC.setFilter('all')">Alle Karten</button></div></div>`;
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
          <button class="btn btn-ghost" onclick="FC.setFilter('plan')">📅 Zeitplan</button>
          <button class="btn btn-ghost" onclick="FC.resetKnown()">Lernstand zurücksetzen</button>
        </div>
      </div>`;
  }

  return {
    start(){
      deck = getDeck(); curIdx=0; flipped=false; sess={known:0,unknown:0};
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
    answer(quality){
      if(!flipped) return;
      const q=quality===true?2:quality===false?0:1; // true=gut, false=wieder, 'hard'=schwer
      if(navigator.vibrate) navigator.vibrate(q>0?[30]:[20,50,20]);
      const card=deck[curIdx];
      const d=fcLoad();
      if(q===0){
        delete d[card.id]; sess.unknown++;
        const reps=card._reps||0;
        if(reps<2) deck.push(Object.assign({},card,{_reps:reps+1}));
      } else {
        d[card.id]=sm2(d[card.id]||{},q); sess.known++;
        if(typeof STREAK!=='undefined') STREAK.record();
      }
      fcSave(d); curIdx++; renderCard();
    },
    toggleSort(){
      sortDifficult=!sortDifficult;
      const btn=document.getElementById('fc-sort-btn');
      if(btn) btn.classList.toggle('active',sortDifficult);
      this.start();
    },
    setFilter(f){
      if(f==='fokus'){
        focusMode=!focusMode; if(focusMode) activeFilters=new Set(CATS);
      } else if(f==='all'){
        activeFilters=new Set(CATS); focusMode=false;
      } else if(f==='pruefung'){
        activeFilters=new Set(['ibk','vak','feuak','idf']); focusMode=false;
        updateFilterButtons(); this.start(); return;
      } else if(f==='plan'){
        updateFilterButtons(); this.showPlan(); return;
      } else {
        focusMode=false;
        if(activeFilters.size===CATS.length) activeFilters=new Set([f]);
        else if(activeFilters.has(f)){ activeFilters.delete(f); if(activeFilters.size===0) activeFilters=new Set(CATS); }
        else activeFilters.add(f);
      }
      updateFilterButtons();
      this.start();
    },
    showPlan(){
      const box=document.getElementById('fc-container'); if(!box) return;
      window._shaderContentMode=1.0; document.body.classList.add('mode-navy');
      const known=fcLoad();
      const now=Date.now();
      const MS_DAY=86400000;
      // Group cards by days until due
      const groups={};
      FLASHCARD_DATA.forEach(c=>{
        const e=known[c.id];
        const due = e ? Math.max(0, Math.round((e.nextReview-now)/MS_DAY)) : -1;
        const key = due<0?'due': due===0?'due':`d${due}`;
        groups[key]=(groups[key]||0)+1;
      });
      const dueNow=(groups['due']||0);
      const rows=[{day:'Heute fällig',cnt:dueNow,today:true}];
      for(let i=1;i<=30;i++){
        const cnt=groups[`d${i}`]||0;
        if(cnt>0) rows.push({day:`In ${i} Tag${i===1?'':'en'}`,cnt,today:false});
      }
      const notScheduled=FLASHCARD_DATA.length-Object.keys(known).length;
      box.innerHTML=`<div class="fc-plan"><div class="fc-plan-title">📅 Wiederholungsplan</div>`
        +rows.map(r=>`<div class="fc-plan-group${r.today?' fc-plan-today':''}"><span class="fc-plan-day">${r.day}</span><span class="fc-plan-cnt"><strong>${r.cnt}</strong> Karte${r.cnt===1?'':'n'}</span></div>`).join('')
        +(notScheduled>0?`<div class="fc-plan-group"><span class="fc-plan-day">Noch nicht gelernt</span><span class="fc-plan-cnt"><strong>${notScheduled}</strong> Karte${notScheduled===1?'':'n'}</span></div>`:'')
        +`<div style="text-align:center;margin-top:1.25rem;display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap">`
        +`<button class="btn btn-gold" onclick="FC.setFilter('fokus')">Fällige Karten lernen (${dueNow})</button>`
        +`<button class="btn btn-ghost" onclick="FC.setFilter('all')">Alle Karten</button>`
        +`</div></div>`;
    },
    resetKnown(){ localStorage.removeItem('bvi_fc'); this.start(); },
    resize(){ sizeCard(); },
    print(){
      const cards=[...new Map(getDeck().map(c=>[c.id,c])).values()];
      const rows=cards.map(c=>`<div class="pc"><div class="cat">${c.cat}</div><div class="q">${c.q}</div><hr/><div class="a">${c.a}</div></div>`).join('');
      const w=window.open('','_blank');
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
    {s:'Fahrzeuge',a:'LF 10',f:'Löschfahrzeug 10',d:'Normiertes LF nach DIN EN 1846; 10 Personen, mind. 1600 l Tank'},
    {s:'Fahrzeuge',a:'HLF 20',f:'Hilfeleistungslöschfahrzeug 20',d:'Kombinationsfahrzeug; 2000 l Tank, Hydraulischer Rettungssatz'},
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
      rendered = true;
      const body = document.getElementById('abk-body');
      if(!body) return;
      const sections = [...new Set(DATA.map(d=>d.s))];
      body.innerHTML = sections.map(sec=>{
        const rows = DATA.filter(d=>d.s===sec).sort((a,b)=>a.a.localeCompare(b.a));
        return `<tr class="abk-sec-hdr" data-sec="${sec}"><td colspan="3">${sec}</td></tr>`
          + rows.map(r=>`<tr class="abk-row" data-sec="${sec}" data-search="${(r.a+' '+r.f+' '+r.d).toLowerCase()}">
            <td class="abk-abbr">${r.a}</td>
            <td class="abk-full">${r.f}</td>
            <td class="abk-desc">${r.d}</td>
          </tr>`).join('');
      }).join('');
    },
    filter(q){
      const term = q.trim().toLowerCase();
      const words = term ? term.split(/\s+/).filter(Boolean) : [];
      const rows = document.querySelectorAll('#abk-body .abk-row');
      let vis = 0;
      rows.forEach(r=>{ const show = !words.length||words.every(w=>r.dataset.search.includes(w)); r.classList.toggle('hidden',!show); if(show) vis++; });
      // Hide section headers if all their rows are hidden
      document.querySelectorAll('#abk-body .abk-sec-hdr').forEach(h=>{
        const sec=h.dataset.sec;
        const hasVis=[...rows].some(r=>r.dataset.sec===sec&&!r.classList.contains('hidden'));
        h.classList.toggle('hidden',!hasVis);
      });
      const cnt = document.getElementById('abk-count');
      if(cnt) cnt.textContent = term ? `${vis} Treffer` : `${rows.length} Einträge`;
    },
    init(){ this.render(); document.getElementById('abk-search').value=''; this.filter(''); }
  };
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
   SHADER BG – WebGL2 fractal noise nebula (based on shader by Matthias Hurrle)
====================================================================== */
(function(){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const canvas = document.getElementById('shader-bg');
  if(!canvas) return;
  const gl = canvas.getContext('webgl2');
  if(!gl){ canvas.style.display='none'; return; }

  const VS = `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0,1);}`;

  const FS = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform float blend;
uniform float realTime;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(in vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;mat2 m=mat2(1.,-.5,.2,1.2);for(int i=0;i<5;i++){t+=a*noise(p);p*=2.*m;a*=.5;}return t;}
float clouds(vec2 p){float d=1.,t=.0;for(float i=.0;i<3.;i++){float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);t=mix(t,d,a);d=a;p*=2./(i+1.);}return t;}
void main(void){
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for(float i=1.;i<12.;i++){
    uv+=.18*cos(i*vec2(.12+.013*i,.72)+i*i+T*.5);
    vec2 p=uv;
    float d=length(p);
    float fade=smoothstep(1.3,0.25,d);
    col+=.0003/d*(cos(sin(i)*vec3(1,2,3))+1.)*fade;
    float b=noise(i+p+bg*1.731);
    col+=.00048*b/length(vec2(max(abs(p.x),abs(p.y)*.12+.004),p.y))*fade;
    col=mix(col,vec3(bg*.25,bg*.137,bg*.05),clamp(d,0.,1.));
  }
  // Navy-Modus: dunkles Navy + dezenter langsamer Radial-Puls auf Inhaltsseiten
  float pulse=sin(realTime*0.6)*.5+.5;
  vec2 ctr=(FC/R)-.5;
  float glow=exp(-dot(ctr,ctr)*6.0)*(0.22+pulse*0.12);
  vec3 navy=vec3(
    0.031+bg*.02+glow*.015,
    0.059+bg*.025+glow*.04,
    0.110+bg*.07+glow*.11
  );
  col=mix(col,navy,blend);
  O=vec4(col,1);
}`;

  function makeShader(type, src){
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
      console.warn('Shader compile:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  const vs = makeShader(gl.VERTEX_SHADER, VS);
  const fs = makeShader(gl.FRAGMENT_SHADER, FS);
  if(!vs || !fs){ canvas.style.display='none'; return; }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){
    console.warn('Program link:', gl.getProgramInfoLog(prog));
    canvas.style.display='none'; return;
  }
  gl.useProgram(prog);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes      = gl.getUniformLocation(prog, 'resolution');
  const uTime     = gl.getUniformLocation(prog, 'time');
  const uBlend    = gl.getUniformLocation(prog, 'blend');
  const uRealTime = gl.getUniformLocation(prog, 'realTime');

  function resize(){
    canvas.width  = innerWidth;
    canvas.height = innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  let start = 0, blendVal = 0;
  function frame(now){
    if(!start) start = now;
    blendVal += ((window._shaderContentMode || 0) - blendVal) * 0.025;
    const elapsed = (now - start) * 0.001;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, elapsed * 0.143);
    gl.uniform1f(uRealTime, elapsed);
    gl.uniform1f(uBlend, blendVal);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ======================================================================
   STREAK – tägliche Lernsträhne
====================================================================== */
const STREAK = (function(){
  function load(){ try{return JSON.parse(localStorage.getItem('bvi_streak')||'{}');}catch{return{};} }
  function save(d){ try{localStorage.setItem('bvi_streak',JSON.stringify(d));}catch{} }
  function todayStr(){ const n=new Date();return n.getFullYear()+'-'+(n.getMonth()+1)+'-'+n.getDate(); }
  function render(){
    const d=load(),n=d.current||0;
    const el=document.getElementById('streak-badge');
    if(!el) return;
    el.textContent=n>0?`🔥 ${n}`:'';
    el.style.display=n>0?'':'none';
    el.title=`Lernstreak: ${n} Tag${n===1?'':'e'} in Folge`;
  }
  return {
    record(){
      const d=load(),today=todayStr();
      if(d.lastStudy===today){render();return;}
      const prev=new Date();prev.setDate(prev.getDate()-1);
      const yStr=prev.getFullYear()+'-'+(prev.getMonth()+1)+'-'+prev.getDate();
      d.current=d.lastStudy===yStr?(d.current||0)+1:1;
      d.longest=Math.max(d.longest||0,d.current);
      d.lastStudy=today;
      save(d); render();
    },
    render,
    get(){ return load(); }
  };
})();

/* ======================================================================
   NOTIF – Browser-Benachrichtigungen
====================================================================== */
const NOTIF = (function(){
  function prefs(){ try{return JSON.parse(localStorage.getItem('bvi_notif')||'{}');}catch{return{};} }
  function savePrefs(p){ try{localStorage.setItem('bvi_notif',JSON.stringify(p));}catch{} }
  return {
    async setEnabled(on){
      if(!('Notification' in window)){ TOAST.show('Benachrichtigungen nicht unterstützt'); return false; }
      if(on){
        const r=await Notification.requestPermission();
        if(r!=='granted'){ TOAST.show('Benachrichtigungen wurden abgelehnt'); const t=document.getElementById('notif-toggle');if(t)t.checked=false; return false; }
        savePrefs({...prefs(),enabled:true});
        TOAST.show('Benachrichtigungen aktiviert',{type:'ok'}); return true;
      } else { savePrefs({...prefs(),enabled:false}); return false; }
    },
    setHour(h){ savePrefs({...prefs(),hour:parseInt(h,10)}); },
    isEnabled(){ const p=prefs();return !!p.enabled&&'Notification' in window&&Notification.permission==='granted'; },
    check(){
      const p=prefs(); if(!this.isEnabled()) return;
      const today=new Date().toDateString(); if(p.lastShown===today) return;
      if(new Date().getHours()<(p.hour||18)) return;
      try{ new Notification('B VI Lernwebsite 📚',{body:'Heute schon gelernt? Kurz Karten wiederholen!',icon:'./icons/icon-192.svg',tag:'bvi-daily'}); }catch{}
      savePrefs({...p,lastShown:today});
    },
    updateUI(){
      const p=prefs();
      const t=document.getElementById('notif-toggle');if(t) t.checked=this.isEnabled();
      const h=document.getElementById('notif-hour');if(h) h.value=p.hour||18;
    }
  };
})();

/* ======================================================================
   TTS – Text-to-Speech (Web Speech API)
====================================================================== */
const TTS = (function(){
  let speaking=false;
  function stop(){ if('speechSynthesis' in window) window.speechSynthesis.cancel(); speaking=false; updateBtns(); }
  function updateBtns(){
    document.querySelectorAll('.tts-page-btn').forEach(b=>{
      b.classList.toggle('tts-active',speaking);
      const l=b.querySelector('.tts-lbl');if(l) l.textContent=speaking?'Stop':'Vorlesen';
    });
  }
  return {
    toggle(){
      if(speaking){ stop(); return; }
      if(!('speechSynthesis' in window)){ TOAST.show('Text-to-Speech wird nicht unterstützt'); return; }
      const active=document.querySelector('.view.active');
      const pc=active&&active.querySelector('.pc');
      if(!pc){ TOAST.show('Kein Inhalt zum Vorlesen'); return; }
      const text=(pc.innerText||pc.textContent||'').replace(/\s+/g,' ').trim();
      if(!text){ TOAST.show('Kein Text gefunden'); return; }
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang='de-DE'; u.rate=0.92;
      u.onend=()=>{ speaking=false; updateBtns(); };
      u.onerror=()=>{ speaking=false; updateBtns(); };
      window.speechSynthesis.speak(u);
      speaking=true; updateBtns();
    },
    stop
  };
})();


/* ======================================================================
   STATS – Lernstatistiken
====================================================================== */
const STATS = (function(){
  const GROUPS={
    GAL:['v-gal-organisation','v-gal-brandlehre','v-gal-fahrzeuge','v-gal-einsatz','v-gal-atemgifte','v-gal-atemschutz','v-gal-vb','v-gal-loeschlehre','v-gal-loeschmittel-schaum','v-gal-loeschwasserversorgung','v-gal-beamtenrecht','v-gal-beihilferecht','v-gal-brandbekaempfung','v-gal-einsatztechnik','v-gal-erstehilfe','v-gal-grundlagen','v-gal-fahrzeugnormung','v-gal-fuehrung','v-gal-fwdven','v-gal-gabc','v-gal-geraetepruefung','v-gal-hbkg','v-gal-kartenkunde','v-gal-knoten','v-gal-staatsbuerger','v-gal-th-verkehr','v-gal-leitern','v-gal-uvv','v-gal-waermebildkamera','v-gal-armaturen','v-gal-maschinist','v-gal-psa','v-gal-personalvertretungsrecht'],
    SFS:['v-sfs-fwdv3','v-sfs-methodik','v-sfs-rechtsgrundlagen','v-sfs-abc'],
    HLFS:['v-hlfs-fuehrungsvorgang','v-hlfs-gabc','v-hlfs-tunnel','v-hlfs-vb','v-hlfs-manv','v-hlfs-zugfuehrer','v-hlfs-stab'],
    IBK:['v-ibk-ta','v-ibk-konflikt','v-ibk-stress','v-ibk-psnv','v-ibk-bgm','v-ibk-pm','v-ibk-zeit'],
    VAk:['v-vak-lernzusammenfassung','v-vak-jur-denken','v-vak-verwaltungsrecht','v-vak-staatsrecht','v-vak-einsatzrecht','v-vak-dienstrecht'],
    FeuAK:['v-feuak-vwl','v-feuak-bwl','v-feuak-haushalt','v-feuak-vergabe','v-feuak-rechnungswesen','v-feuak-pm','v-feuak-bedarfsplanung','v-feuak-pruefung'],
    IdF:['v-idf-brandschutz','v-idf-stab','v-idf-presse']
  };
  function ov(){ return document.getElementById('stats-overlay'); }
  function build(){
    const c=document.getElementById('stats-content');if(!c) return;
    const prog=JSON.parse(localStorage.getItem('bvi_progress')||'{}');
    const fc=JSON.parse(localStorage.getItem('bvi_fc')||'{}');
    const streak=STREAK.get();
    const allViews=Object.values(GROUPS).flat();
    const visited=allViews.filter(v=>prog[v]).length;
    const known=Object.keys(fc).length;
    const total=FLASHCARD_DATA.length;
    const now=Date.now();
    const due=Object.values(fc).filter(v=>v&&v.nextReview<=now).length;
    const bars=Object.entries(GROUPS).map(([g,vs])=>{
      const d=vs.filter(v=>prog[v]).length;
      const pct=Math.round(d/vs.length*100);
      return `<div class="stat-row"><span class="stat-row-lbl">${g}</span><div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:${pct}%"></div></div><span class="stat-row-cnt">${d}/${vs.length}</span></div>`;
    }).join('');
    c.innerHTML=`
      <div class="stat-tiles">
        <div class="stat-tile"><div class="stat-val">${streak.current||0}</div><div class="stat-lbl">🔥 Streak (Tage)</div></div>
        <div class="stat-tile"><div class="stat-val">${streak.longest||0}</div><div class="stat-lbl">⭐ Bester Streak</div></div>
        <div class="stat-tile"><div class="stat-val">${Math.round(visited/allViews.length*100)}%</div><div class="stat-lbl">📚 Themen</div></div>
        <div class="stat-tile"><div class="stat-val">${Math.round(known/total*100)}%</div><div class="stat-lbl">🎴 Karten</div></div>
      </div>
      <div class="stat-section-title">Themen-Fortschritt</div>
      <div class="stat-bars">${bars}</div>
      <div class="stat-section-title" style="margin-top:1.1rem">Lernkarten (${known}/${total})</div>
      <div class="stat-bars">
        <div class="stat-row"><span class="stat-row-lbl">Gelernt</span><div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:${Math.round(known/total*100)}%"></div></div><span class="stat-row-cnt">${known}</span></div>
        <div class="stat-row"><span class="stat-row-lbl">Heute fällig</span><div class="stat-bar-wrap"><div class="stat-bar-fill stat-bar-gold" style="width:${Math.min(100,Math.round(due/total*100))}%"></div></div><span class="stat-row-cnt">${due}</span></div>
      </div>
      <div class="stat-section-title" style="margin-top:1.1rem">Lernkarten pro Kategorie</div>
      <div class="stat-bars">${['gal','sfs','hlfs','ibk','vak','feuak','idf'].map(cat=>{
        const cats=FLASHCARD_DATA.filter(c=>c.cat.toLowerCase().startsWith(cat));
        const kn=cats.filter(c=>fc[c.id]).length;
        const pct=Math.round(kn/cats.length*100);
        const label={gal:'GAL',sfs:'SFS',hlfs:'HLFS',ibk:'IBK',vak:'VAk',feuak:'FeuAK',idf:'IdF'}[cat]||cat;
        return `<div class="stat-row"><span class="stat-row-lbl">${label}</span><div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:${pct}%"></div></div><span class="stat-row-cnt">${kn}/${cats.length}</span></div>`;
      }).join('')}</div>
      `;
  }
  return {
    open(){ ov()?.classList.remove('hidden'); build(); },
    close(){ ov()?.classList.add('hidden'); }
  };
})();

/* ======================================================================
   PERF – Performance Mode
====================================================================== */
const PERF=(function(){
  let _io=null;
  return {
    enabled:localStorage.getItem('bvi_perf')==='1',
    toggle(){
      this.enabled=!this.enabled;
      localStorage.setItem('bvi_perf',this.enabled?'1':'0');
      this.apply();
    },
    apply(){
      document.body.classList.toggle('perf-mode',this.enabled);
      const btn=document.getElementById('perf-btn');
      if(btn){
        btn.classList.toggle('active',this.enabled);
        btn.textContent=this.enabled?'Deaktivieren':'Aktivieren';
      }
      if(this.enabled) this.rebuildIO(); else if(_io){_io.disconnect();_io=null;}
    },
    rebuildIO(){
      if(!this.enabled) return;
      if(_io){_io.disconnect();_io=null;}
      const active=document.querySelector('.view.active');
      if(!active) return;
      const sections=Array.from(active.querySelectorAll('.sec-h'));
      if(!sections.length) return;
      _io=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            const idx=sections.indexOf(entry.target);
            if(idx>=0) document.querySelectorAll('.toc-dot').forEach((d,i)=>d.classList.toggle('active',i===idx));
          }
        });
      },{rootMargin:'-30% 0px -70% 0px',threshold:0});
      sections.forEach(s=>_io.observe(s));
    }
  };
})();

/* ======================================================================
   POMO – Pomodoro-Timer
====================================================================== */
const POMO=(function(){
  let _total=25*60, _rem=25*60, _running=false, _iv=null;
  function fmt(s){ return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
  function tick(){ if(!_running) return; _rem--; render(); if(_rem<=0){ clearInterval(_iv); _running=false; done(); } }
  function render(){
    const d=document.getElementById('pomo-display'); if(d) d.textContent=fmt(_rem);
    const btn=document.getElementById('pomo-start'); if(btn) btn.textContent=_running?'⏸ Pause':'▶ Start';
    const hdr=document.getElementById('pomo-hdr-btn');
    if(hdr){ hdr.classList.toggle('hidden',!_running); }
    const ht=document.getElementById('pomo-hdr-time');
    if(ht) ht.textContent=fmt(_rem);
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
      if(_rem<=0) return;
      _running=!_running;
      if(_running) _iv=setInterval(tick,1000); else clearInterval(_iv);
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
  const SKIP=new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz']);
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
    }
  };
})();

/* ======================================================================
   SETTINGS2 – Einstellungs-Overlay (Reset, Schriftart)
====================================================================== */
const SETTINGS2=(function(){
  function applyFont(ff){
    document.documentElement.classList.remove('ff-serif','ff-mono');
    if(ff==='serif') document.documentElement.classList.add('ff-serif');
    else if(ff==='mono') document.documentElement.classList.add('ff-mono');
    localStorage.setItem('bvi_font_family',ff||'sans');
    document.querySelectorAll('.s2-font-btn').forEach(b=>b.classList.toggle('active',b.dataset.ff===(ff||'sans')));
  }
  return {
    open(){
      document.getElementById('settings2-overlay').classList.remove('hidden');
      SETTINGS._restoreFsUI();
      PERF.apply();
      if(typeof NOTIF!=='undefined') NOTIF.updateUI();
    },
    close(){ document.getElementById('settings2-overlay').classList.add('hidden'); },
    setFont(ff){ applyFont(ff); },
    restoreFont(){ applyFont(localStorage.getItem('bvi_font_family')||'sans'); }
  };
})();

/* ======================================================================
   SHARE – Direktlink kopieren
====================================================================== */
const SHARE=(function(){
  return {
    copy(){
      const url=location.href;
      navigator.clipboard.writeText(url)
        .then(()=>TOAST.show('Link kopiert',{type:'ok'}))
        .catch(()=>TOAST.show('Kopieren nicht unterstützt'));
    }
  };
})();

/* ======================================================================
   RECENT – Zuletzt besucht
====================================================================== */
const RECENT=(function(){
  const KEY='bvi_recent'; const MAX=5;
  const SKIP=new Set(['v-home','v-flashcards','v-simulator','v-bookmarks','v-abkuerzungen','v-app','v-impressum','v-datenschutz']);
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } }
  function save(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch{} }
  return {
    track(id){
      if(SKIP.has(id)) return;
      const label=document.querySelector('#'+id+' .page-title')?.textContent?.trim()||id;
      const entries=load().filter(e=>e.id!==id);
      entries.unshift({id,label});
      save(entries.slice(0,MAX));
      this.render();
    },
    render(){
      const el=document.getElementById('recent-section'); if(!el) return;
      const entries=load();
      if(!entries.length){ el.classList.add('hidden'); return; }
      el.classList.remove('hidden');
      const list=el.querySelector('.recent-list');
      if(list){
        list.innerHTML=entries.map(e=>`<button class="recent-item" data-id="${e.id}" data-label="${e.label.replace(/"/g,'&quot;')}">${e.label}</button>`).join('');
        list.querySelectorAll('.recent-item').forEach(b=>b.addEventListener('click',()=>NAV.go(b.dataset.id,b.dataset.label)));
      }
    },
    clear(){ save([]); this.render(); }
  };
})();

/* ======================================================================
   ONBOARD – Erste-Schritte-Overlay (einmalig)
====================================================================== */
const ONBOARD=(function(){
  const KEY='bvi_onboarded';
  let _step=0;
  const TOTAL=5;
  function setStep(n){
    _step=Math.max(0,Math.min(TOTAL-1,n));
    document.querySelectorAll('.ob-step').forEach((el,i)=>el.classList.toggle('active',i===_step));
    document.querySelectorAll('.ob-dot').forEach((el,i)=>el.classList.toggle('active',i===_step));
    const nextBtn=document.querySelector('.ob-next');
    if(nextBtn) nextBtn.textContent=_step===TOTAL-1?'Los geht\'s!':'Weiter →';
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
const QUIZ=(function(){
  const KEY_BM='bvi_quiz_bm';
  const KEY_MASTERY='bvi_quiz_mastery';
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  const Q=[
    {id:1,cat:'Staatsorganisationsrecht',type:'essay',q:'Nennen Sie die Verfassungsorgane, die bei den einzelnen Phasen der Bundesgesetzgebung beteiligt sind oder beteiligt sein können (Gesetzesinitiative, Gesetzesberatung, Gesetzesbeschluss, Länderbeteiligung, Ausfertigung, Verkündung).',ref:'Gesetzesinitiative (Art. 76 I GG): Bundesregierung ✓, Bundesrat ✓, Bundestag ✓\nGesetzesberatung/1. Durchgang: Bundestag ✓, Bundesrat ✓ (Stellungnahme), Bundesregierung ✓\nGesetzesbeschluss (Art. 77 I GG): nur Bundestag ✓\nLänderbeteiligung/2. Durchgang (Art. 77 II ff.): Bundesrat ✓ (Zustimmung/Einspruch, ggf. Vermittlungsausschuss)\nAusfertigung (Art. 82 I GG): Bundespräsident ✓, Bundesregierung ✓ (Gegenzeichnung, Art. 58 GG)\nVerkündung im BGBl. (Art. 82 I GG): Bundespräsident ✓\nDas Bundesverfassungsgericht ist am regulären Gesetzgebungsverfahren nie beteiligt.'},
    {id:2,cat:'Staatsorganisationsrecht',type:'essay',q:'Welche Auswirkungen haben Änderungen in den politischen Kräfteverhältnissen in den Landesparlamenten auf der Bundesebene? Erläutern Sie dies für die Wahl des Bundespräsidenten und für Grundgesetzänderungen.',ref:'Bundespräsidentenwahl: Die Bundesversammlung besteht zur Hälfte aus von den Landesparlamenten entsandten Mitgliedern (Art. 54 III GG); Mehrheitsverschiebungen in den Landtagen verschieben die Mehrheitsverhältnisse bei der Präsidentenwahl.\nGrundgesetzänderungen: Erforderlich sind zwei Drittel der Stimmen des Bundesrates (Art. 79 II GG); der Bundesrat besteht aus Mitgliedern der Landesregierungen (Art. 51 GG) – welche Koalitionen dort regieren, hängt von den Landtagswahlen ab.'},
    {id:3,cat:'Staatsorganisationsrecht',type:'tf',q:'Grundrechte sind Abwehrrechte der Bürgerinnen und Bürger gegen den Staat.',opts:['Richtig','Falsch'],correct:0,exp:'Das ist ihre klassische Funktion gegenüber dem Staat.'},
    {id:4,cat:'Staatsorganisationsrecht',type:'tf',q:'Gemeinderäte sind Bestandteile der vollziehenden Gewalt.',opts:['Richtig','Falsch'],correct:0,exp:'Trotz parlamentsähnlicher Struktur gehört die kommunale Selbstverwaltung nach Art. 28 II GG organisatorisch zur Exekutive, da es auf kommunaler Ebene keine eigene Gewaltenteilung gibt.'},
    {id:5,cat:'Staatsorganisationsrecht',type:'tf',q:'Das Schulrecht fällt in die konkurrierende Gesetzgebungskompetenz des Bundes und der Länder.',opts:['Richtig','Falsch'],correct:1,exp:'Schulrecht ist Ländersache (Kulturhoheit der Länder); eine Bundeskompetenz nach Art. 70 ff. GG besteht dafür nicht.'},
    {id:6,cat:'Staatsorganisationsrecht',type:'tf',q:'Der Bundeskanzler beziehungsweise die Bundeskanzlerin kann den Deutschen Bundestag auflösen.',opts:['Richtig','Falsch'],correct:1,exp:'Auflösen kann nur der Bundespräsident, und nur in den engen Fällen der Art. 63 IV oder Art. 68 GG.'},
    {id:7,cat:'Staatsorganisationsrecht',type:'tf',q:'Der Bundeskanzler beziehungsweise die Bundeskanzlerin vertritt im Falle der Verhinderung den Bundespräsidenten.',opts:['Richtig','Falsch'],correct:1,exp:'Das übernimmt nach Art. 57 GG der Präsident des Bundesrates.'},
    {id:8,cat:'Staatsorganisationsrecht',type:'tf',q:'Bundespräsident Steinmeier kann 2027 wiedergewählt werden.',opts:['Richtig','Falsch'],correct:1,exp:'Seine zweite Amtszeit endet am 18. März 2027, eine dritte Amtszeit in Folge schließt Art. 54 II GG aus.'},
    {id:9,cat:'Staatsorganisationsrecht',type:'tf',q:'Autos sind vom Schutzbereich des Art. 13 Abs. 1 GG umfasst.',opts:['Richtig','Falsch'],correct:1,exp:'Art. 13 GG schützt die Wohnung; Kraftfahrzeuge fallen nach ständiger Rechtsprechung nicht darunter.'},
    {id:10,cat:'Staatsorganisationsrecht',type:'tf',q:'Alle Grundrechte sind im Rahmen der Regelungen des Grundgesetzes einschränkbar.',opts:['Richtig','Falsch'],correct:1,exp:'Die Menschenwürde (Art. 1 I GG) ist nach Art. 79 III GG unantastbar; vorbehaltlos gewährleistete Grundrechte wie Art. 4 I GG sind nur durch verfassungsimmanente Schranken einschränkbar.'},
    {id:11,cat:'Staatsorganisationsrecht',type:'tf',q:'Die Wahlrechtsgrundsätze lauten Allgemein, Unmittelbar, Frei und Geheim.',opts:['Richtig','Falsch'],correct:1,exp:'Art. 38 I 1 GG nennt fünf Grundsätze; es fehlt die Gleichheit der Wahl.'},
    {id:12,cat:'Staatsorganisationsrecht',type:'tf',q:'Das Grundgesetz wurde am 23.05.1949 verkündet.',opts:['Richtig','Falsch'],correct:0,exp:'Verkündet wurde es am 23.05.1949. In Kraft getreten ist es erst am folgenden Tag, dem 24.05.1949.'},
    {id:13,cat:'Staatsorganisationsrecht',type:'mc',q:'Was beschreibt das Entschließungsermessen?',opts:['Die Auswahl eines Mittels durch die Behörde','Die Entscheidung, ob die Behörde überhaupt tätig wird','Die Pflicht zur Anhörung des Betroffenen','Die Festlegung von Nebenbestimmungen'],correct:1,exp:'Das Entschließungsermessen betrifft nur die Frage, ob die Behörde tätig wird. Welches Mittel sie einsetzt, ist das davon zu unterscheidende Auswahlermessen.'},
    {id:14,cat:'Staatsorganisationsrecht',type:'mc',q:'Welches Kriterium gehört nicht zur Verhältnismäßigkeitsprüfung?',opts:['Legitimer Zweck','Geeignetheit','Rechtmäßigkeit','Angemessenheit'],correct:2,exp:'Die Prüfung umfasst legitimen Zweck, Geeignetheit, Erforderlichkeit und Angemessenheit. Die Rechtmäßigkeit ist keine eigene Stufe, sondern das Ergebnis der Prüfung.'},
    {id:15,cat:'Staatsorganisationsrecht',type:'mc',q:'Woran erkennt man in einer Norm typischerweise Ermessensspielräume?',opts:['An der Verwendung von „muss"','An der Verwendung von „kann" oder „darf"','An der Reihenfolge der Normabsätze','An der Länge des Gesetzestextes'],correct:1,exp:'„Kann" oder „darf" signalisieren Ermessen; „muss" oder „ist" weisen auf eine gebundene Entscheidung hin.'},
    {id:16,cat:'Staatsorganisationsrecht',type:'mc',q:'Welche Aussage zur Konkurrenzgesetzgebung ist korrekt?',opts:['Der Bund darf nur tätig werden, wenn die Länder zustimmen','Die Länder sind zuständig, bis der Bund tätig wird','Der Bund ist immer zuständig','Konkurrenzgesetzgebung betrifft nur das Steuerrecht'],correct:1,exp:'Das folgt aus Art. 72 I GG: Die Länder haben die Gesetzgebungsbefugnis, solange und soweit der Bund von seiner Zuständigkeit nicht durch Gesetz Gebrauch gemacht hat.'},
    {id:17,cat:'Staatsorganisationsrecht',type:'mc',q:'Was bedeutet das Rechtsstaatsprinzip?',opts:['Es verpflichtet den Staat zu wirtschaftlicher Neutralität','Es garantiert rechtliche Unabhängigkeit','Es verbietet Gewaltenteilung','Es erlaubt Verwaltungshandeln ohne Gesetz'],correct:1,exp:'Die richterliche Unabhängigkeit (Art. 97 GG) ist eine anerkannte Ausprägung des Rechtsstaatsprinzips. Es umfasst vor allem die Bindung an Gesetz und Recht, den Vorbehalt des Gesetzes, Rechtssicherheit und Rechtsschutz.'},
    {id:18,cat:'Staatsorganisationsrecht',type:'mc',q:'Welche Aussage beschreibt das Prinzip der Gewaltenteilung im deutschen Grundgesetz zutreffend?',opts:['Die Legislative kontrolliert ausschließlich die Exekutive','Die Gewalten sind strikt getrennt und dürfen nicht zusammenwirken','Die Staatsgewalt ist in Legislative, Exekutive und Judikative gegliedert, mit funktionalen Überschneidungen','Die Judikative entscheidet nur über politische Fragen'],correct:2,exp:'Das deutsche Modell kennt keine strikte Trennung, sondern eine Gewaltenverschränkung mit wechselseitigen Kontrollmechanismen.'},
    {id:19,cat:'Staatsorganisationsrecht',type:'mc',q:'Welche der folgenden Institutionen gehört nicht zu den (ständigen) Verfassungsorganen der Bundesrepublik Deutschland?',opts:['Der Bundesrat','Der Bundespräsident','Das Bundesverfassungsgericht','Die Bundesversammlung'],correct:3,exp:'Zu den fünf ständigen Verfassungsorganen zählen Bundestag, Bundesrat, Bundesregierung, Bundespräsident und Bundesverfassungsgericht. Die Bundesversammlung tritt nur bei Bedarf zur Präsidentenwahl zusammen.'},
    {id:20,cat:'Staatsorganisationsrecht',type:'mc',q:'Welche Aussage zur Bundesrat-Mitwirkung im Gesetzgebungsverfahren ist korrekt?',opts:['Der Bundesrat wirkt nur bei Finanzgesetzen mit','Der Bundesrat hat bei Zustimmungsgesetzen ein Vetorecht, das der Bundestag nicht überstimmen kann','Der Bundesrat ist am Gesetzgebungsverfahren nie beteiligt','Der Bundesrat kann nur beratende Stellungnahmen abgeben'],correct:1,exp:'Bei Zustimmungsgesetzen kommt das Gesetz ohne Zustimmung des Bundesrates nicht zustande. Das unterscheidet sie von Einspruchsgesetzen, bei denen der Bundestag einen Einspruch zurückweisen kann (Art. 77 IV GG).'},
    {id:21,cat:'Staatsorganisationsrecht',type:'mc',q:'Welche Aussage zum Wahlgrundsatz der Gleichheit ist zutreffend?',opts:['Jede Stimme hat den gleichen Zähl- und Erfolgswert','Der Erfolgswert darf unterschiedlich sein, solange alle wählen dürfen','Wahlgleichheit gilt nur für Bundestagswahlen','Wahlgleichheit verlangt zwingend Mehrheitswahl'],correct:0,exp:'Das folgt aus Art. 38 I 1 GG: Jede Stimme hat denselben Zählwert und denselben Erfolgswert.'},
    {id:22,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Was ist nach § 35 VwVfG ein Verwaltungsakt?',opts:['Eine Rechtsverordnung, die von einer obersten Bundesbehörde erlassen wird','Eine Maßnahme einer Behörde zur Regelung eines Einzelfalls auf dem Gebiet des öffentlichen Rechts mit Außenwirkung','Ein allgemeiner Erlass, der für eine unbestimmte Vielzahl von Fällen gilt','Eine innerdienstliche Anweisung ohne rechtliche Außenwirkung'],correct:1,exp:'So die Legaldefinition in § 35 S. 1 VwVfG.'},
    {id:23,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Welches der folgenden Merkmale muss ein Verwaltungsakt nach § 35 VwVfG erfüllen?',opts:['Er muss schriftlich erlassen sein','Er muss von einem Gericht stammen','Er muss eine Regelung enthalten','Er muss sich auf Zivilrecht beziehen'],correct:2,exp:'Der Regelungscharakter ist das zentrale Tatbestandsmerkmal des § 35 VwVfG.'},
    {id:24,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Welche Aussage trifft im Sinne des § 35 VwVfG am ehesten auf die „Außenwirkung" eines Verwaltungsaktes zu?',opts:['Der Verwaltungsakt muss für die allgemeine Öffentlichkeit bestimmt sein','Der Verwaltungsakt betrifft ausschließlich interne Verwaltungsabläufe','Der Verwaltungsakt muss gegenüber einer außerhalb der Verwaltung stehenden Person rechtliche Wirkung entfalten','Die Außenwirkung meint, dass der Verwaltungsakt öffentlich bekannt gemacht werden muss'],correct:2,exp:'Außenwirkung bedeutet Rechtswirkung gegenüber einer außerhalb der Verwaltung stehenden Person.'},
    {id:25,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Welche der folgenden Maßnahmen stellt typischerweise keinen Verwaltungsakt im Sinne des § 35 VwVfG dar?',opts:['Eine Baugenehmigung für ein Wohnhaus','Die Versetzung eines Beamten in eine andere Dienststelle','Eine Straßenverkehrsbehörde stellt ein Halteverbotsschild auf','Eine Ministerin kündigt auf einer Pressekonferenz ein neues Gesetzesvorhaben an'],correct:3,exp:'Der Ankündigung fehlt die Regelung eines Einzelfalls – sie ist eine politische Aussage ohne unmittelbare Rechtswirkung. Das Halteverbotsschild gilt als Allgemeinverfügung.'},
    {id:26,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Was ist vor dem Erlass eines belastenden Verwaltungsaktes grundsätzlich erforderlich?',opts:['Die Veröffentlichung im Amtsblatt','Die Genehmigung durch das Bundesministerium','Die Anhörung des Betroffenen','Die Zustimmung des Landtages'],correct:2,exp:'So § 28 I VwVfG.'},
    {id:27,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Wann kann auf eine Anhörung vor Erlass eines Verwaltungsaktes verzichtet werden?',opts:['Nie','Nur bei Gefahr im Verzug','Wenn dies durch Verwaltungsvorschriften vorgesehen ist','Wenn § 28 Abs. 2 VwVfG dies zulässt'],correct:3,exp:'§ 28 II VwVfG zählt mehrere Fallgruppen auf, etwa Gefahr im Verzug, Allgemeinverfügungen oder Massenverfahren – „nur bei Gefahr im Verzug" wäre zu eng.'},
    {id:28,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Was gilt, wenn eine erforderliche Anhörung unterblieben ist?',opts:['Der Verwaltungsakt ist automatisch nichtig','Die Anhörung kann nachgeholt werden','Der Verwaltungsakt bleibt dauerhaft unwirksam','Der Verwaltungsakt ist nur in Bayern gültig'],correct:1,exp:'Nach § 45 VwVfG ist dieser Verfahrensfehler heilbar.'},
    {id:29,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Welche Aussage ist richtig?',opts:['Jeder Verwaltungsakt muss durch die Polizei vollzogen werden','Verwaltungsakte werden durch das Grundgesetz definiert','Allgemeinverfügungen richten sich an eine unbestimmte Vielzahl von Personen','Ein Verwaltungsakt muss immer durch den Bundesrat bestätigt werden'],correct:2,exp:'So die Definition der Allgemeinverfügung in § 35 S. 2 VwVfG.'},
    {id:30,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Wann wird ein Verwaltungsakt wirksam?',opts:['Bei Unterschrift durch den Behördenleiter','Bei Veröffentlichung im Gesetzblatt','Mit seiner Bekanntgabe','Nach Zustimmung der betroffenen Person'],correct:2,exp:'So §§ 41, 43 VwVfG.'},
    {id:31,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Was ist eine Nebenbestimmung im Verwaltungsakt?',opts:['Ein unwesentlicher Zusatz ohne rechtliche Wirkung','Eine Regelung, die den Verwaltungsakt inhaltlich oder zeitlich einschränkt','Eine interne Dienstanweisung','Eine mündliche Erläuterung für den Bürger'],correct:1,exp:'So § 36 VwVfG.'},
    {id:32,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Was ist eine Bedingung im Sinne des § 36 VwVfG?',opts:['Eine sofort wirksame Einschränkung','Von einem künftigen ungewissen Ereignis abhängige Regelung','Eine interne Absprache','Eine Obliegenheit'],correct:1,exp:'Eine Bedingung macht den Eintritt oder Wegfall einer Vergünstigung oder Belastung vom ungewissen Eintritt eines künftigen Ereignisses abhängig (§ 36 II Nr. 2 VwVfG).'},
    {id:33,cat:'Allgemeines Verwaltungsrecht',type:'essay',q:'Was ist eine Auflage gemäß § 36 VwVfG? Erläutern Sie den Unterschied zur Bedingung.',ref:'Eine Auflage (§ 36 II Nr. 4 VwVfG) verpflichtet die begünstigte Person zu einem zusätzlichen Tun, Dulden oder Unterlassen, ohne dass die Wirksamkeit des Verwaltungsakts selbst davon abhängt.\nUnterschied zur Bedingung: Bei der Bedingung steht die Wirksamkeit des Hauptverwaltungsakts infrage (er tritt erst ein oder entfällt bei Bedingungseintritt). Bei der Auflage bleibt der Hauptverwaltungsakt voll wirksam; die Auflage kann eigenständig durchgesetzt werden.'},
    {id:34,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Was ist ein Realakt?',opts:['Hoheitliche Aufgabe','Gesetz','Verwaltungsakt','Vertrag'],correct:0,exp:'Von den gegebenen Optionen kommt „Hoheitliche Aufgabe" am nächsten. Ein Realakt ist tatsächliches Verwaltungshandeln ohne eigenen Regelungscharakter – keine unmittelbare Rechtswirkung wie ein Verwaltungsakt, z. B. eine Auskunft oder eine Maßnahme vor Ort.'},
    {id:35,cat:'Allgemeines Verwaltungsrecht',type:'mc',q:'Was sind Ampel- und Handzeichen der Polizei nach der Rechtsprechung?',opts:['Gesetz','Realakt','Allgemeinverfügung','Verordnung'],correct:2,exp:'Die Rechtsprechung behandelt Ampelzeichen als Verwaltungsakte in Form von Allgemeinverfügungen, gerichtet an die jeweils anwesenden Verkehrsteilnehmer. Gleiches gilt für Zeichen von Polizeibeamten nach § 36 StVO.'},
    {id:36,cat:'Verwaltungsvollstreckung / Rechtsschutz',type:'mc',q:'Welche Zwangsmittel kennt das Verwaltungsvollstreckungsrecht typischerweise?',opts:['Bußgeld, Freiheitsentzug, Enteignung','Zwangsgeld, Ersatzvornahme, unmittelbarer Zwang','Ordnungsstrafe, Hausverbot, Verwarnung','Verwarnungsgeld, Bußgeld, Verhaftung'],correct:1,exp:'Nach dem Bundes-VwVG: Ersatzvornahme (§ 10), Zwangsgeld (§ 11), unmittelbarer Zwang (§ 12), zusammengefasst in § 9 VwVG.'},
    {id:37,cat:'Verwaltungsvollstreckung / Rechtsschutz',type:'mc',q:'Was ist der wesentliche Unterschied zwischen Verwaltungsvollstreckung und Sofortvollzug?',opts:['Es gibt keinen Unterschied','Der Sofortvollzug kann ohne vorherigen Verwaltungsakt erfolgen','Die Verwaltungsvollstreckung ist nur für Steuerschulden möglich','Der Sofortvollzug darf nur bei Notstand angewendet werden'],correct:1,exp:'§ 6 II VwVG: Der Sofortvollzug ist zulässig, wenn die vorherige Bekanntgabe eines Verwaltungsakts den Zweck der Maßnahme vereiteln würde.'},
    {id:38,cat:'Verwaltungsvollstreckung / Rechtsschutz',type:'mc',q:'Was muss vor dem Einsatz von Zwangsmitteln vorliegen?',opts:['Eine richterliche Genehmigung','Ein Gesetz zur Anordnung','Ein wirksamer Verwaltungsakt, der nicht befolgt wird','Eine Anzeige durch Dritte'],correct:2,exp:'So § 6 I VwVG des Bundes beziehungsweise § 55 I VwVG NRW.'},
    {id:39,cat:'Verwaltungsvollstreckung / Rechtsschutz',type:'mc',q:'Welche Wirkung hat ein Widerspruch gegen einen belastenden Verwaltungsakt?',opts:['Keine','Er verzögert die Zustellung','Er hat aufschiebende Wirkung','Er macht den Verwaltungsakt nichtig'],correct:2,exp:'So § 80 I VwGO.'},
    {id:40,cat:'Verwaltungsvollstreckung / Rechtsschutz',type:'mc',q:'Was muss die Behörde tun, wenn sie trotz Widerspruchs sofort vollziehen will?',opts:['Klage beim Verwaltungsgericht erheben','Eine Anhörung durchführen','Sofortige Vollziehung anordnen und begründen','Den Verwaltungsakt zurücknehmen'],correct:2,exp:'So § 80 II Nr. 4, § 80 III VwGO.'},
    {id:41,cat:'Verwaltungsvollstreckung / Rechtsschutz',type:'mc',q:'Wie kann sich der Adressat gegen die Anordnung der sofortigen Vollziehung wehren?',opts:['Mit Dienstaufsichtsbeschwerde','Mit Gegenvorstellung bei der Behörde','Mit Eilantrag beim Verwaltungsgericht','Mit Antrag beim Bundesverfassungsgericht'],correct:2,exp:'So § 80 V VwGO.'},
    {id:42,cat:'Beamten- und Disziplinarrecht',type:'mc',q:'Was regelt § 34 BeamtStG?',opts:['Dienstunfall','Pflicht zum vollen persönlichen Einsatz','Wahlrecht','Nebentätigkeiten'],correct:1,exp:'Beamtinnen und Beamte haben sich mit vollem persönlichem Einsatz ihrem Beruf zu widmen und ihr Verhalten muss der Achtung und dem Vertrauen gerecht werden, die ihr Beruf erfordert.'},
    {id:43,cat:'Beamten- und Disziplinarrecht',type:'mc',q:'Welches Beamtenverhältnis gibt es nicht?',opts:['Beamter auf Probe','Beamter auf Widerruf','Beamter auf Lebenszeit','Beamter auf Abruf'],correct:3,exp:'Nach § 4 BeamtStG gibt es Beamte auf Lebenszeit, auf Probe, auf Widerruf und auf Zeit. Einen „Beamten auf Abruf" kennt das Beamtenrecht nicht.'},
    {id:44,cat:'Beamten- und Disziplinarrecht',type:'mc',q:'Was ist die Voraussetzung für die Berufung in das Beamtenverhältnis?',opts:['10 Jahre Berufserfahrung','Deutsche oder EU-Staatsangehörigkeit','Privatrechtlicher Vertrag','Kirchenzugehörigkeit'],correct:1,exp:'Diese materielle Voraussetzung steht in § 7 BeamtStG. § 8 BeamtStG regelt die Ernennung als formalen Akt.'},
    {id:45,cat:'Beamten- und Disziplinarrecht',type:'mc',q:'Welcher Zweck gehört nicht zu den klassischen Zielen des Disziplinarrechts?',opts:['Erziehungszweck','Schutzfunktion','Privatisierung der Ermittlungen','Reinigungsfunktion'],correct:2,exp:'Das Disziplinarverfahren ist und bleibt ein hoheitliches, staatliches Verfahren. Erziehungszweck, Schutzfunktion und Reinigungsfunktion sind anerkannte Zwecke.'},
    {id:46,cat:'Beamten- und Disziplinarrecht',type:'mc',q:'Was ist der Zweck des Disziplinarrechts?',opts:['Bestrafung','Erziehung und Funktionssicherung','Politische Kontrolle','Gehaltskürzungen maximieren'],correct:1,exp:'Das Disziplinarrecht dient der Erziehung (Wiedereingliederung) und der Funktionssicherung des Berufsbeamtentums, nicht der Bestrafung im strafrechtlichen Sinne.'},
    {id:47,cat:'Beamten- und Disziplinarrecht',type:'mc',q:'Wann muss ein Disziplinarverfahren eingeleitet werden?',opts:['Sobald der Personalrat zustimmt','Wenn eine anonyme Beschwerde eingeht','Bei zureichenden tatsächlichen Anhaltspunkten für ein Dienstvergehen','Wenn ein Strafbefehl rechtskräftig ist'],correct:2,exp:'Es gilt das Legalitätsprinzip – dem Dienstvorgesetzten steht kein Ermessen zu, ob er tätig wird, nur wie er das Verfahren führt.'},
    {id:48,cat:'Beamten- und Disziplinarrecht',type:'mc',q:'Was versteht man unter einem „Dienstvergehen"?',opts:['Jegliches Verhalten außerhalb der Dienstzeit','Eine schuldhafte Verletzung dienstlicher Pflichten','Jede Form von Kritik an Vorgesetzten','Ein Verwaltungsverstoß nach dem Ordnungsrecht'],correct:1,exp:'So die Definition in § 47 BeamtStG.'},
    {id:49,cat:'Beamten- und Disziplinarrecht',type:'mc',q:'Was gehört nicht zu den Dienstpflichten?',opts:['Pflicht zur wöchentlichen Fortbildung','Neutralitätsgebot','Folgepflicht','Verschwiegenheitspflicht'],correct:0,exp:'Neutralitätsgebot, Folgepflicht und Verschwiegenheitspflicht sind ausdrücklich normiert (§§ 33, 35, 37 BeamtStG). Eine eigenständige, gesetzlich fixierte Pflicht zur wöchentlichen Fortbildung gibt es dagegen nicht.'},
    {id:50,cat:'Beamten- und Disziplinarrecht',type:'tf',q:'Eine Trunkenheitsfahrt in der Freizeit führt zu einem Disziplinarverfahren.',opts:['Richtig','Falsch'],correct:1,exp:'Rein außerdienstliches Verhalten ist nur dann relevant, wenn es in besonderem Maß geeignet ist, Achtung und Vertrauen in einer für das Amt bedeutsamen Weise zu beeinträchtigen (§ 34 S. 3 BeamtStG).'},
    {id:51,cat:'Beamten- und Disziplinarrecht',type:'tf',q:'Das statusrechtliche Amt bezieht sich auf die tatsächlich wahrgenommenen Aufgaben.',opts:['Richtig','Falsch'],correct:1,exp:'Das statusrechtliche Amt meint die abstrakte Rechtsstellung (Laufbahn, Besoldungsgruppe, Amtsbezeichnung), nicht die konkret ausgeübte Tätigkeit – das wäre das Amt im konkret-funktionellen Sinn.'},
    {id:52,cat:'Beamten- und Disziplinarrecht',type:'tf',q:'Für eine Ernennung zum 10.01.2025 kann die Urkunde bis zum Ende des Monats überreicht werden.',opts:['Richtig','Falsch'],correct:1,exp:'Eine Ernennung auf einen zurückliegenden Zeitpunkt ist unzulässig und unwirksam (§ 8 IV BeamtStG). Wirksam wird sie erst mit tatsächlicher Aushändigung der Urkunde.'},
    {id:53,cat:'Beamten- und Disziplinarrecht',type:'tf',q:'Der Dienstherr muss bei Vorliegen tatsächlicher Anhaltspunkte über ein Dienstvergehen ein Disziplinarverfahren einleiten.',opts:['Richtig','Falsch'],correct:0,exp:'Legalitätsprinzip, kein Einleitungsermessen.'},
    {id:54,cat:'Beamten- und Disziplinarrecht',type:'tf',q:'Leistung und Persönlichkeitsbild des Beamten oder der Beamtin sind alleiniger Grund für die Bemessung der Disziplinarmaßnahme.',opts:['Richtig','Falsch'],correct:1,exp:'Ausgangspunkt ist die Schwere des Dienstvergehens; Persönlichkeitsbild und bisherige Führung fließen nur ergänzend ein.'},
    {id:55,cat:'Beamten- und Disziplinarrecht',type:'tf',q:'Die dienstliche Beurteilung ist das Hauptauswahlkriterium bei der Beförderung.',opts:['Richtig','Falsch'],correct:0,exp:'Im Rahmen der Bestenauslese nach Art. 33 II GG ist sie regelmäßig das zentrale Erkenntnismittel für Eignung, Befähigung und fachliche Leistung.'},
    {id:56,cat:'Beamten- und Disziplinarrecht',type:'tf',q:'Maßgebliche Kriterien bei einer Ernennung von Beamten sind Eignung, Leistung, Befähigung und der Wohnsitz im Gebiet des jeweiligen Dienstherrn.',opts:['Richtig','Falsch'],correct:1,exp:'Art. 33 II GG nennt Eignung, Befähigung und fachliche Leistung; ein Wohnsitzerfordernis gehört nicht dazu.'},
    {id:57,cat:'Beamten- und Disziplinarrecht',type:'tf',q:'Bei Bekanntwerden eines Dienstvergehens steht dem Dienstvorgesetzten Ermessen zu, ob ein Disziplinarverfahren eingeleitet wird oder nicht.',opts:['Richtig','Falsch'],correct:1,exp:'Legalitätsprinzip – kein Einleitungsermessen.'},
    {id:58,cat:'Beamten- und Disziplinarrecht',type:'tf',q:'Das Disziplinarrecht ist abschließend durch das Bundesdisziplinargesetz geregelt.',opts:['Richtig','Falsch'],correct:1,exp:'Das Bundesdisziplinargesetz gilt nur für Bundesbeamte; für Landes- und Kommunalbeamte gilt das jeweilige Landesdisziplinargesetz.'},
    {id:59,cat:'Beamten- und Disziplinarrecht',type:'tf',q:'Die Entfernung aus dem Beamtenverhältnis aufgrund von Verfehlungen muss im Rahmen einer Disziplinarklage vor dem Verwaltungsgericht erwirkt werden.',opts:['Richtig','Falsch'],correct:0,exp:'Diese schwerste Disziplinarmaßnahme kann die Behörde nicht selbst verfügen, sondern nur gerichtlich durchsetzen.'},
    {id:60,cat:'Beamten- und Disziplinarrecht',type:'essay',q:'Was ist nach einer strafrechtlichen Verurteilung disziplinarisch nicht zulässig? (Die Antwortoptionen fehlen im Original-Protokoll.)',ref:'Einschlägig ist die Bindungswirkung strafgerichtlicher Feststellungen: Die Disziplinarbehörde bzw. das Disziplinargericht ist an die tatsächlichen Feststellungen eines rechtskräftigen Strafurteils grundsätzlich gebunden und darf davon nur unter engen Voraussetzungen abweichen (z. B. bei offenkundiger Unrichtigkeit).\nNicht zulässig ist es daher in aller Regel, eigene, den strafgerichtlichen Feststellungen widersprechende Tatsachenfeststellungen zu treffen.'},
    {id:61,cat:'Gefahrenabwehr / Feuerwehrrecht',type:'essay',q:'Gegen welche drei „Personengruppen" können sich Maßnahmen der Gefahrenabwehr richten?',ref:'1. Verhaltensstörer (Handlungsstörer): verursacht die Gefahr durch eigenes Verhalten.\n2. Zustandsstörer: hat die tatsächliche Gewalt über eine gefahrverursachende Sache oder ist deren Eigentümer.\n3. Nichtstörer (Notstandspflichtiger): nicht verantwortliche Dritte – nur unter engen Voraussetzungen bei gegenwärtiger erheblicher Gefahr zulässig.'},
    {id:62,cat:'Gefahrenabwehr / Feuerwehrrecht',type:'essay',q:'Erklären Sie den Unterschied zwischen einer konkreten Gefahr und einer Anscheinsgefahr. Was ist bei der Anscheinsgefahr besonders zu beachten?',ref:'Konkrete Gefahr: Bei ungehindertem Ablauf des objektiv zu erwartenden Geschehens ist mit hinreichender Wahrscheinlichkeit in absehbarer Zeit ein Schaden zu erwarten.\nAnscheinsgefahr: Nachträglich stellt sich heraus, dass keine Gefahr bestand – maßgeblich ist die Sicht im Zeitpunkt des Handelns (ex-ante-Betrachtung). Durfte eine besonnene Einsatzkraft von einer Gefahr ausgehen, war das Einschreiten rechtmäßig. Sobald der Irrtum erkannt wird, sind alle Maßnahmen unverzüglich einzustellen.\nBesonders zu beachten: Die Kostenfrage – wer trägt die Kosten einer sich als unbegründet herausstellenden Maßnahme?'},
    {id:63,cat:'Gefahrenabwehr / Feuerwehrrecht',type:'essay',q:'Welche Aufgabe ergibt sich aus § 1 Abs. 1 Nr. 1 BHKG?',ref:'§ 1 Abs. 1 Nr. 1 BHKG definiert das Ziel des Gesetzes im Bereich Brandschutz: vorbeugende und abwehrende Maßnahmen bei Brandgefahren zum Schutz der Bevölkerung. Die Norm begründet die gesetzliche Grundlage für den vorbeugenden und abwehrenden Brandschutz als Pflichtaufgabe der Gemeinden.'},
    {id:64,cat:'Gefahrenabwehr / Feuerwehrrecht',type:'mc',q:'Was ist ein Unglücksfall im Sinne des BHKG?',opts:['Langsamer Vorgang','Plötzliches Ereignis mit erheblicher Gefahr','Nur Explosionen','Nur Brände'],correct:1,exp:'Ein Unglücksfall ist ein plötzliches Ereignis, von dem eine erhebliche Gefahr für Menschen, Tiere, Sachen oder die Umwelt ausgeht.'},
    {id:65,cat:'Gefahrenabwehr / Feuerwehrrecht',type:'essay',q:'Fall: Schornsteinbrand im Hinterhaus. Alarmierung zu einem Schornsteinbrand in einem Altbau, 3 OG. Der Einsatzleiter ordnet an, alle am Schornstein gelegenen Wohnungen auf Brandausbreitung zu kontrollieren. Im 3. OG lässt ein pensionierter Feuerwehrmann weder die Nachbarwohnung noch seine eigene Wohnung kontrollieren.\n\na) Dürfen Sie als Einsatzleiter die verschlossene Nachbarwohnung gewaltsam öffnen? Was ist zu beachten?\nb) Dürfen Sie die Wohnung gegen den Willen des Mieters betreten?\nc) Was beachten Sie beim Verlassen der Einsatzstelle?',ref:'a) Ja, gestützt auf § 41 BHKG NRW i. V. m. Art. 13 VII GG. Bei möglicher Rauch-/Brandausbreitung liegt zumindest eine Anscheinsgefahr vor. Zu beachten: Verhältnismäßigkeit – wenn zeitlich möglich, zunächst Schlüsseldienst; bei Gefahr im Verzug sofortiges gewaltsames Öffnen zulässig.\nb) Ja. Der widersprechende Mieter ist nicht Inhaber der zu kontrollierenden Nachbarwohnung und kann über deren Betretung nicht wirksam entscheiden. Sein Widerspruch ist rechtlich unbeachtlich.\nc) Geöffnete Wohnung sichern/wiederverschließen; Bewohner und Eigentümer informieren; Vorgang und Gründe dokumentieren; sicherstellen, dass keine Glutnester zurückbleiben.'},
    {id:66,cat:'Gefahrenabwehr / Feuerwehrrecht',type:'essay',q:'Fall: Rauchmelder piept im 2. OG, Nachbarn alarmieren die Feuerwehr. Die Feuerwehr bricht die Tür auf – in der Wohnung kein Rauch, Melder hatte technischen Defekt. Der Mieter fordert Ersatz für die Tür. War die Türöffnung rechtmäßig?',ref:'Ja. Maßgeblich ist die Anscheinsgefahr: Beim Alarm eines Rauchmelders, auf den niemand reagiert, durfte die Feuerwehr ex-ante von einer konkreten Gefahr ausgehen (§ 41 BHKG NRW i. V. m. Art. 13 VII GG). Der nachträglich festgestellte technische Defekt ändert an der Rechtmäßigkeit nichts.\nEin Schadensersatzanspruch scheidet bei rechtmäßiger Maßnahme in der Regel aus; ein etwaiger Ausgleich richtet sich nach den landesrechtlichen Kostenerstattungsregelungen.'},
    {id:67,cat:'Gefahrenabwehr / Feuerwehrrecht',type:'essay',q:'Fall: Es brennt im Keller eines Mehrfamilienhauses. Ein Trupp soll wegen der Rauchausbreitung die angrenzenden Kellerräume kontrollieren. Der Eigentümer verbietet den Zutritt zu einem vermieteten Kellerraum, weil der Mieter das Betreten nicht erlauben würde. Dürfen Sie den Kellerraum öffnen?',ref:'Ja. Bei einem Kellerbrand mit Rauchausbreitungsgefahr besteht eine konkrete Gefahr, die die Kontrolle aller betroffenen Kellerräume rechtfertigt, unabhängig davon, ob sie vermietet sind. Weder Eigentümer noch Mieter können der Gefahrenabwehr ein wirksames Zutrittsverbot entgegensetzen (§ 41 BHKG NRW).\nVorgehen: Raum verhältnismäßig, notfalls gewaltsam öffnen, kontrollieren, anschließend sichern und Eigentümer sowie Mieter informieren.'},
  ];

  let _mode='learn',_order=[],_cur=0,_answered=false,_filter='all',_catFilter='all',_inited=false;
  let _bookmarks=new Set(),_examAnswers={},_examSubmitted=false;
  let _masteryMap={},_sessionCorrect=0,_sessionWrong=0,_sessionSkipped=0,_retried=new Set();
  let _typeFilter='all',_posHistory={},_retriedCount=0,_examPendingSubmit=false,_filterOpen=false;
  let _examTimerInterval=null,_examTimeLeft=0;

  function startTimer(){
    _examTimeLeft=60*60;
    const bar=document.getElementById('quiz-exam-timer-bar');
    if(bar)bar.classList.remove('hidden');
    updateTimerDisplay();
    clearInterval(_examTimerInterval);
    _examTimerInterval=setInterval(()=>{_examTimeLeft--;updateTimerDisplay();if(_examTimeLeft<=0){clearInterval(_examTimerInterval);QUIZ.submitExam();}},1000);
  }
  function updateTimerDisplay(){
    const el=document.getElementById('quiz-exam-time');if(!el)return;
    const m=Math.floor(_examTimeLeft/60),s=_examTimeLeft%60;
    el.textContent=m+':'+String(s).padStart(2,'0');
    const bar=document.getElementById('quiz-exam-timer-bar');
    if(bar)bar.classList.toggle('qetb-urgent',_examTimeLeft<=300);
  }
  function stopTimer(){
    clearInterval(_examTimerInterval);_examTimerInterval=null;
    const bar=document.getElementById('quiz-exam-timer-bar');
    if(bar)bar.classList.add('hidden');
  }

  const CAT_LABELS={'Staatsorganisationsrecht':'StaatsorgR','Allgemeines Verwaltungsrecht':'AllgVwR','Verwaltungsvollstreckung / Rechtsschutz':'Vollstr./RS','Beamten- und Disziplinarrecht':'BeamtR','Gefahrenabwehr / Feuerwehrrecht':'GefahrenabwR'};

  function loadBm(){try{const s=localStorage.getItem(KEY_BM);if(s)_bookmarks=new Set(JSON.parse(s));}catch(e){}}
  function saveBm(){try{localStorage.setItem(KEY_BM,JSON.stringify([..._bookmarks]));}catch(e){}}
  function loadMastery(){try{const s=localStorage.getItem(KEY_MASTERY);if(s)_masteryMap=JSON.parse(s);}catch(e){}}
  function saveMastery(){try{localStorage.setItem(KEY_MASTERY,JSON.stringify(_masteryMap));}catch(e){}}
  function shuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=0|Math.random()*(i+1);[r[i],r[j]]=[r[j],r[i]];}return r;}
  function filteredIds(){let p=_filter==='bookmarked'?Q.filter(q=>_bookmarks.has(q.id)):_filter==='wrong'?Q.filter(q=>_masteryMap[q.id]==='err'):Q;if(_catFilter!=='all')p=p.filter(q=>q.cat===_catFilter);if(_typeFilter!=='all')p=p.filter(q=>q.type===_typeFilter);return p.map(q=>q.id);}
  function buildOrder(){_order=shuffle(filteredIds());_cur=0;_answered=false;_sessionCorrect=0;_sessionWrong=0;_sessionSkipped=0;_retried=new Set();_retriedCount=0;_posHistory={};hideSummary();renderFilterStatus();}
  function curQ(){return Q.find(q=>q.id===_order[_cur]);}

  function renderCatBar(){
    const bar=document.getElementById('quiz-cat-bar');if(!bar)return;
    const cats=[...new Set(Q.map(q=>q.cat))];
    bar.innerHTML='<button class="quiz-cat-filter-btn'+(_catFilter==='all'?' active':'')+'" data-cat="all">Alle</button>'
      +cats.map(c=>'<button class="quiz-cat-filter-btn'+(_catFilter===c?' active':'')+'" data-cat="'+esc(c)+'">'+(CAT_LABELS[c]||esc(c))+'</button>').join('');
    bar.querySelectorAll('.quiz-cat-filter-btn').forEach(btn=>{btn.addEventListener('click',()=>{QUIZ.setCatFilter(btn.dataset.cat);});});
  }

  function renderMastery(){
    const grid=document.getElementById('quiz-mastery-grid');if(!grid)return;
    grid.innerHTML=Q.map(q=>{const m=_masteryMap[q.id];return'<span class="qmd '+(m==='ok'?'qmd-ok':m==='err'?'qmd-err':'qmd-un')+'" title="'+esc(q.q.substring(0,60))+'"></span>';}).join('');
  }

  function renderMasteryCats(){
    const el=document.getElementById('quiz-mastery-cats');if(!el)return;
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
    const bar=document.getElementById('quiz-type-bar');if(!bar)return;
    const types=[{k:'all',l:'Alle Typen'},{k:'mc',l:'Multiple Choice'},{k:'tf',l:'Richtig/Falsch'},{k:'essay',l:'Freitext'}];
    bar.innerHTML=types.map(t=>'<button class="quiz-cat-filter-btn'+(_typeFilter===t.k?' active':'')+'" data-type="'+t.k+'">'+t.l+'</button>').join('');
    bar.querySelectorAll('.quiz-cat-filter-btn').forEach(btn=>{btn.addEventListener('click',()=>{QUIZ.setTypeFilter(btn.dataset.type);});});
  }

  function renderFilterStatus(){
    const el=document.getElementById('quiz-filter-status');
    const tog=document.getElementById('qft-status');
    const count=filteredIds().length;
    const parts=[];
    if(_filter!=='all')parts.push(_filter==='bookmarked'?'★ Gemerkte':'✗ Falsche');
    if(_catFilter!=='all')parts.push(CAT_LABELS[_catFilter]||_catFilter);
    if(_typeFilter!=='all')parts.push(_typeFilter==='mc'?'Multiple Choice':_typeFilter==='tf'?'Richtig/Falsch':'Freitext');
    const hasFilter=parts.length>0;
    if(el){
      el.innerHTML='<span class="qfs-count">'+count+' Frage'+(count!==1?'n':'')+'</span>'
        +(parts.length?'<span class="qfs-sep">·</span><span class="qfs-chips">'+parts.map(p=>'<span class="qfs-chip">'+esc(p)+'</span>').join('')+'</span>':'')
        +(hasFilter?'<button class="qfs-reset" onclick="QUIZ.clearFilters()">× leeren</button>':'');
    }
    if(tog){tog.textContent=hasFilter?parts.join(' · '):count+' Fragen';tog.className='qft-status'+(hasFilter?' qft-active':'');}
  }

  function initKeyboard(){
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){const m=document.getElementById('quiz-mastery-modal');if(m&&!m.classList.contains('hidden')){QUIZ.closeMastery();return;}}
      if(_mode!=='learn')return;
      const inText=e.target.matches('textarea,input,select,[contenteditable]');
      if(e.key==='Enter'&&!e.ctrlKey&&!e.metaKey&&!inText){
        const q=curQ();if(!q)return;
        if(_answered)QUIZ.next();else if(q.type==='essay')QUIZ._revealEssay();
      }else if(e.key==='Backspace'&&!inText){
        if(_cur>0){e.preventDefault();QUIZ.back();}
      }else if(!inText&&['1','2','3','4'].includes(e.key)){
        const q=curQ();
        if(!_answered&&q&&(q.type==='mc'||q.type==='tf')){const idx=+e.key-1;if(idx<q.opts.length)QUIZ._answer(idx);}
      }
    });
  }

  function initTouch(){
    const card=document.getElementById('quiz-learn-inner');if(!card)return;
    let sx=0,sy=0;
    card.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
    card.addEventListener('touchend',e=>{
      if(_mode!=='learn'||!curQ())return;
      const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
      if(Math.abs(dx)<50||Math.abs(dy)>Math.abs(dx)*0.75)return;
      if(dx<0){if(_answered)QUIZ.next();}else{if(_cur>0)QUIZ.back();}
    },{passive:true});
  }

  function showSummary(){
    const inner=document.getElementById('quiz-learn-inner'),summary=document.getElementById('quiz-summary');
    if(inner)inner.classList.add('hidden');
    if(!summary)return;
    const mc=_sessionCorrect+_sessionWrong||1;
    const pct=Math.round((_sessionCorrect/mc)*100);
    summary.innerHTML='<div class="quiz-summary-inner"><div class="quiz-summary-title">Runde abgeschlossen!</div><div class="quiz-summary-stats"><div class="quiz-stat quiz-stat-ok"><div class="quiz-stat-num">'+_sessionCorrect+'</div><div class="quiz-stat-label">Richtig</div></div><div class="quiz-stat quiz-stat-err"><div class="quiz-stat-num">'+_sessionWrong+'</div><div class="quiz-stat-label">Falsch</div></div><div class="quiz-stat quiz-stat-skip"><div class="quiz-stat-num">'+_sessionSkipped+'</div><div class="quiz-stat-label">Übersprungen</div></div></div><div class="quiz-summary-pct">'+pct+' % richtig (MC / R-F)</div><button class="quiz-next-btn quiz-new-round-btn" onclick="QUIZ.newRound()">Neue Runde ↻</button></div>';
    summary.classList.remove('hidden');
  }

  function hideSummary(){
    const inner=document.getElementById('quiz-learn-inner'),summary=document.getElementById('quiz-summary');
    if(inner)inner.classList.remove('hidden');
    if(summary)summary.classList.add('hidden');
  }

  function renderLearn(){
    const q=curQ();
    if(!q){renderEmpty();return;}
    document.getElementById('quiz-cat').textContent=q.cat;
    document.getElementById('quiz-counter').textContent=(_cur+1)+' / '+_order.length;
    document.getElementById('quiz-progress').style.width=((_cur/_order.length)*100)+'%';
    document.getElementById('quiz-bm-btn').textContent=_bookmarks.has(q.id)?'★':'☆';
    const rt=document.getElementById('quiz-retry-tag');if(rt)rt.textContent=_retriedCount>0?'+'+_retriedCount+' ↻':'';
    document.getElementById('quiz-q').textContent=q.q;
    const tb=document.getElementById('quiz-type-badge');
    tb.textContent=q.type==='mc'?'Multiple Choice':q.type==='tf'?'Richtig / Falsch':'Freitextfrage';
    tb.className='quiz-type-badge quiz-type-'+q.type;
    const opts=document.getElementById('quiz-opts');
    if(q.type==='mc'){
      opts.innerHTML='<div class="quiz-opts">'+q.opts.map((o,i)=>'<button class="quiz-opt" onclick="QUIZ._answer('+i+')"><span class="quiz-opt-label">'+String.fromCharCode(97+i)+'</span><span class="quiz-opt-text">'+esc(o)+'</span></button>').join('')+'</div>';
    }else if(q.type==='tf'){
      opts.innerHTML='<div class="quiz-opts">'+q.opts.map((o,i)=>'<button class="quiz-opt quiz-tf-opt" onclick="QUIZ._answer('+i+')"><span class="quiz-opt-text">'+esc(o)+'</span></button>').join('')+'</div>';
    }else{
      opts.innerHTML='<textarea class="quiz-textarea" id="quiz-ta" placeholder="Schreibe deine Antwort hier..." rows="4"></textarea><button class="quiz-reveal-btn" onclick="QUIZ._revealEssay()">Lösung anzeigen</button>';
    }
    const exp=document.getElementById('quiz-exp');exp.textContent='';exp.className='quiz-exp hidden';
    const hist=_posHistory[_cur];
    if(hist){
      _answered=true;
      if(q.type==='essay'){
        exp.textContent=q.ref;exp.className='quiz-exp quiz-exp-ref';
        const rb=document.querySelector('.quiz-reveal-btn');if(rb)rb.disabled=true;
      }else{
        document.querySelectorAll('.quiz-opt').forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add('correct');else if(i===hist.userIdx)b.classList.add('wrong');});
        exp.textContent=q.exp;exp.className=hist.correct?'quiz-exp quiz-exp-ok':'quiz-exp quiz-exp-err';
      }
      document.getElementById('quiz-skip').classList.add('hidden');
      document.getElementById('quiz-next').classList.remove('hidden');
    }else{
      document.getElementById('quiz-skip').classList.remove('hidden');
      document.getElementById('quiz-next').classList.add('hidden');
      _answered=false;
    }
    const bb=document.getElementById('quiz-back');if(bb)bb.classList.toggle('hidden',_cur===0);
  }

  function renderEmpty(){
    document.getElementById('quiz-cat').textContent='';document.getElementById('quiz-counter').textContent='';
    document.getElementById('quiz-type-badge').textContent='';
    const msg=_filter==='bookmarked'?'Keine gemerkten Fragen für diesen Filter.':_filter==='wrong'?'Keine falsch beantworteten Fragen für diesen Filter.':(_catFilter!=='all'||_typeFilter!=='all'?'Keine Fragen für diesen Filter.':'Keine Fragen gefunden.');
    document.getElementById('quiz-q').textContent=msg;
    document.getElementById('quiz-opts').innerHTML='';document.getElementById('quiz-exp').className='quiz-exp hidden';
    document.getElementById('quiz-skip').classList.add('hidden');document.getElementById('quiz-next').classList.add('hidden');
    document.getElementById('quiz-progress').style.width='100%';
  }

  function renderExam(){
    _examAnswers={};_examSubmitted=false;_examPendingSubmit=false;
    const el=document.getElementById('quiz-exam-questions');
    el.innerHTML=Q.map((q,qi)=>{
      const isE=q.type==='essay';
      const optsH=isE
        ?'<div class="quiz-exam-essay-note">Freitextfrage – fließt nicht in die Bewertung ein</div><textarea class="quiz-textarea quiz-exam-ta" id="qeta-'+q.id+'" placeholder="Notizen..." rows="3"></textarea>'
        :q.opts.map((o,i)=>'<label class="quiz-exam-opt" id="qeol-'+q.id+'-'+i+'"><input type="radio" name="qe-'+q.id+'" value="'+i+'" onchange="QUIZ._examSel('+q.id+','+i+')"><span class="quiz-exam-opt-label">'+(q.type==='mc'?String.fromCharCode(97+i):(i===0?'R':'F'))+'</span><span>'+esc(o)+'</span></label>').join('');
      return '<div class="quiz-exam-q" id="qeq-'+q.id+'"><div class="quiz-exam-q-header"><span class="quiz-exam-q-num" id="qeqn-'+q.id+'">Frage '+(qi+1)+'</span><span class="quiz-cat quiz-cat-sm">'+esc(q.cat)+'</span>'+(isE?'<span class="quiz-essay-tag">Freitext</span>':'')+'</div><div class="quiz-exam-q-text">'+esc(q.q)+'</div><div class="quiz-exam-opts" id="qeo-'+q.id+'">'+optsH+'</div><div class="quiz-exam-ref hidden" id="qee-'+q.id+'">'+esc(isE?q.ref:q.exp)+'</div></div>';
    }).join('');
    document.getElementById('quiz-exam-footer').classList.remove('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
    startTimer();
  }

  return {
    init(){
      if(_inited)return;_inited=true;
      loadBm();loadMastery();buildOrder();renderCatBar();renderTypeBar();renderLearn();initKeyboard();initTouch();
    },
    setMode(m){
      _mode=m;
      document.getElementById('quiz-learn').classList.toggle('hidden',m!=='learn');
      document.getElementById('quiz-exam').classList.toggle('hidden',m!=='exam');
      document.getElementById('quiz-mode-learn').classList.toggle('active',m==='learn');
      document.getElementById('quiz-mode-exam').classList.toggle('active',m==='exam');
      if(m==='exam')renderExam();else{stopTimer();buildOrder();renderCatBar();renderTypeBar();renderLearn();}
    },
    _answer(idx){
      if(_answered)return;_answered=true;
      const q=curQ();const ok=idx===q.correct;
      document.querySelectorAll('.quiz-opt').forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add('correct');else if(i===idx)b.classList.add('wrong');});
      const exp=document.getElementById('quiz-exp');
      exp.textContent=q.exp;exp.className=ok?'quiz-exp quiz-exp-ok':'quiz-exp quiz-exp-err';
      document.getElementById('quiz-skip').classList.add('hidden');document.getElementById('quiz-next').classList.remove('hidden');
      _masteryMap[q.id]=ok?'ok':'err';saveMastery();
      _posHistory[_cur]={userIdx:idx,correct:ok};
      if(!ok&&!_retried.has(q.id)){_retried.add(q.id);_order.push(q.id);_retriedCount++;const rt=document.getElementById('quiz-retry-tag');if(rt){rt.textContent='+'+_retriedCount+' ↻';rt.classList.add('qrt-flash');setTimeout(()=>rt.classList.remove('qrt-flash'),600);}}
      if(ok)_sessionCorrect++;else _sessionWrong++;
      renderMastery();renderMasteryCats();
    },
    _revealEssay(){
      if(_answered)return;_answered=true;
      const q=curQ();
      const exp=document.getElementById('quiz-exp');exp.textContent=q.ref;exp.className='quiz-exp quiz-exp-ref';
      document.getElementById('quiz-skip').classList.add('hidden');document.getElementById('quiz-next').classList.remove('hidden');
      const rb=document.querySelector('.quiz-reveal-btn');if(rb)rb.disabled=true;
      if(!_masteryMap[q.id]||_masteryMap[q.id]==='err')_masteryMap[q.id]='ok';
      saveMastery();_posHistory[_cur]={userIdx:null,correct:true};
      renderMastery();renderMasteryCats();
    },
    next(){_cur++;if(_cur>=_order.length){showSummary();return;}renderLearn();},
    skip(){_sessionSkipped++;_cur++;if(_cur>=_order.length){showSummary();return;}renderLearn();},
    newRound(){buildOrder();renderLearn();},
    toggleBookmark(){
      const q=curQ();if(!q)return;
      if(_bookmarks.has(q.id))_bookmarks.delete(q.id);else _bookmarks.add(q.id);
      saveBm();document.getElementById('quiz-bm-btn').textContent=_bookmarks.has(q.id)?'★':'☆';
    },
    setFilter(f){
      _filter=f;
      document.getElementById('quiz-filter-all').classList.toggle('active',f==='all');
      document.getElementById('quiz-filter-bm').classList.toggle('active',f==='bookmarked');
      document.getElementById('quiz-filter-wrong')?.classList.toggle('active',f==='wrong');
      buildOrder();renderFilterStatus();renderLearn();
    },
    setCatFilter(cat){_catFilter=cat;renderCatBar();buildOrder();renderFilterStatus();renderLearn();},
    setTypeFilter(t){_typeFilter=t;renderTypeBar();buildOrder();renderFilterStatus();renderLearn();},
    toggleFilters(){
      _filterOpen=!_filterOpen;
      const body=document.getElementById('quiz-filter-body');
      const chev=document.getElementById('qft-chevron');
      if(body)body.classList.toggle('open',_filterOpen);
      if(chev)chev.style.transform=_filterOpen?'rotate(180deg)':'';
    },
    clearFilters(){
      _filter='all';_catFilter='all';_typeFilter='all';
      document.getElementById('quiz-filter-all').classList.add('active');
      document.getElementById('quiz-filter-bm').classList.remove('active');
      document.getElementById('quiz-filter-wrong')?.classList.remove('active');
      renderCatBar();renderTypeBar();renderFilterStatus();buildOrder();renderLearn();
    },
    back(){if(_cur>0){_cur--;renderLearn();}},
    reshuffle(){buildOrder();renderLearn();},
    openMastery(){
      renderMastery();renderMasteryCats();
      const m=document.getElementById('quiz-mastery-modal');
      if(m){m.classList.remove('hidden');document.body.style.overflow='hidden';}
    },
    closeMastery(){
      const m=document.getElementById('quiz-mastery-modal');
      if(m){m.classList.add('hidden');document.body.style.overflow='';}
    },
    resetMastery(){
      if(!confirm('Lernstand für alle '+Q.length+' Fragen zurücksetzen?'))return;
      _masteryMap={};saveMastery();renderMastery();renderMasteryCats();
    },
    _examSel(qid,idx){_examAnswers[qid]=idx;},
    submitExam(){
      if(_examSubmitted)return;
      const unanswered=Q.filter(q=>q.type!=='essay'&&_examAnswers[q.id]===undefined);
      if(unanswered.length>0&&!_examPendingSubmit){
        unanswered.forEach(q=>{const el=document.getElementById('qeq-'+q.id);if(el)el.classList.add('exam-q-unanswered');});
        const warn=document.getElementById('quiz-exam-warn');
        if(warn){warn.textContent=unanswered.length+' Frage'+(unanswered.length!==1?'n':'')+' noch nicht beantwortet – nochmal klicken zum Abgeben.';warn.classList.remove('hidden');}
        const first=document.getElementById('qeq-'+unanswered[0].id);
        if(first)first.scrollIntoView({behavior:'smooth',block:'center'});
        _examPendingSubmit=true;return;
      }
      _examSubmitted=true;_examPendingSubmit=false;stopTimer();
      let correct=0,total=0;
      Q.forEach(q=>{
        const ee=document.getElementById('qee-'+q.id);if(ee)ee.classList.remove('hidden');
        if(q.type==='essay')return;
        total++;
        const sel=_examAnswers[q.id],ok=sel===q.correct;
        if(ok)correct++;
        q.opts.forEach((o,i)=>{const l=document.getElementById('qeol-'+q.id+'-'+i);if(!l)return;if(i===q.correct)l.classList.add('exam-correct');else if(i===sel)l.classList.add('exam-wrong');});
        const eo=document.getElementById('qeo-'+q.id);if(eo)eo.querySelectorAll('input').forEach(inp=>inp.disabled=true);
        const qel=document.getElementById('qeq-'+q.id);if(qel)qel.classList.add(ok?'exam-q-correct':'exam-q-wrong');
      });
      const pct=Math.round((correct/total)*100);
      const grade=pct>=90?'Sehr gut':pct>=75?'Gut':pct>=60?'Befriedigend':pct>=50?'Ausreichend':'Nicht bestanden';
      const catBreakdown=[...new Set(Q.filter(q=>q.type!=='essay').map(q=>q.cat))].map(cat=>{
        const cq=Q.filter(q=>q.cat===cat&&q.type!=='essay');
        const cok=cq.filter(q=>_examAnswers[q.id]===q.correct).length;
        const cp=Math.round((cok/cq.length)*100);
        return'<div class="quiz-rcat"><span class="quiz-rcat-name">'+(CAT_LABELS[cat]||esc(cat))+'</span><div class="quiz-rcat-bar"><div class="quiz-rcat-fill'+(cp<60?' qrf-fail':'')+'" style="width:'+cp+'%"></div></div><span class="quiz-rcat-stat">'+cok+'/'+cq.length+'</span></div>';
      }).join('');
      const res=document.getElementById('quiz-result');
      res.innerHTML='<div class="quiz-result-inner"><div class="quiz-result-title">Ergebnis</div><div class="quiz-result-score">'+correct+' / '+total+'</div><div class="quiz-result-pct '+(pct>=60?'grade-ok':'grade-fail')+'">'+pct+' %</div><div class="quiz-result-grade">'+grade+'</div><div class="quiz-result-bar"><div class="quiz-result-fill" style="width:'+pct+'%"></div></div><div class="quiz-result-cats">'+catBreakdown+'</div><p class="quiz-result-note">'+total+' bewertete Fragen (MC + R/F). Freitextfragen nicht eingerechnet.<br>Scrolle nach oben, um alle Korrekturen zu sehen.</p><button class="quiz-retry-btn" onclick="QUIZ.setMode(\'exam\')">Nochmal versuchen</button></div>';
      res.classList.remove('hidden');
      document.getElementById('quiz-exam-footer').classList.add('hidden');
      res.scrollIntoView({behavior:'smooth'});
    }
  };
})();

/* ======================================================================
   HEATMAP – Tägliche Lernaktivität
====================================================================== */
const HEATMAP=(function(){
  const KEY='bvi_heatmap';
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return{};}}
  function save(d){try{localStorage.setItem(KEY,JSON.stringify(d));}catch{}}
  function pad(n){return String(n).padStart(2,'0');}
  function todayStr(){const n=new Date();return n.getFullYear()+'-'+pad(n.getMonth()+1)+'-'+pad(n.getDate());}
  return{
    record(){const d=load(),t=todayStr();d[t]=(d[t]||0)+1;save(d);},
    render(el){
      if(!el)return;
      const d=load();const weeks=13;const today=new Date();const days=[];
      for(let i=(weeks*7)-1;i>=0;i--){
        const dt=new Date(today);dt.setDate(today.getDate()-i);
        const k=dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate());
        days.push({k,count:d[k]||0,dt});
      }
      const max=Math.max(1,...days.map(x=>x.count));
      el.innerHTML='<div class="hm-grid">'+days.map(({k,count,dt})=>{
        const lvl=count===0?0:count<=max*.25?1:count<=max*.5?2:count<=max*.75?3:4;
        const lbl=dt.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'})+(count?' · '+count+' Besuche':'');
        return'<span class="hm-cell hm-'+lvl+'" title="'+lbl+'"></span>';
      }).join('')+'</div>'
      +'<div class="hm-legend"><span class="hm-lbl-l">Weniger</span><span class="hm-cell hm-0"></span><span class="hm-cell hm-1"></span><span class="hm-cell hm-2"></span><span class="hm-cell hm-3"></span><span class="hm-cell hm-4"></span><span class="hm-lbl-l">Mehr</span></div>';
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
    },
    close(){
      document.getElementById('changelog-modal').classList.add('hidden');
    },
    check(){
      _updateTile();
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
  'v-feuak-vwl':[['v-feuak-bwl','FeuAK BWL'],['v-feuak-haushalt','FeuAK Haushalt']],
  'v-feuak-bwl':[['v-feuak-vwl','FeuAK VWL'],['v-feuak-rechnungswesen','Rechnungswesen'],['v-feuak-pm','Projektmanagement']],
  'v-feuak-haushalt':[['v-feuak-vergabe','FeuAK Vergabe'],['v-feuak-bwl','FeuAK BWL']],
  'v-feuak-vergabe':[['v-feuak-haushalt','Haushalt']],
  'v-feuak-pm':[['v-ibk-pm','IBK PM'],['v-ibk-zeit','IBK Zeitmanagement'],['v-feuak-bwl','FeuAK BWL']],
  'v-feuak-rechnungswesen':[['v-feuak-bwl','FeuAK BWL'],['v-feuak-haushalt','Haushalt']],
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

document.addEventListener('DOMContentLoaded',()=>{
  // Deep-link on load
  const initId=new URLSearchParams(location.search).get('id');
  if(initId&&document.getElementById(initId)){
    const lbl=document.querySelector('#'+initId+' .page-title')?.textContent?.trim()||initId;
    NAV.go(initId,lbl);
  } else {
    NAV.home();
  }
  PROGRESS.updateUI();
  BOOKMARKS.updateHomeTile();
  SETTINGS.restoreFontSize();
  STREAK.render();
  NOTIF.check();
  PERF.apply();
  SETTINGS2.restoreFont();
  RECENT.render();
  ONBOARD.init();
  DARKMODE.init();
  CHANGELOG.check();
  document.querySelectorAll('.pc table').forEach(t=>{
    if(t.closest('.tbl-wrap')) return;
    const w=document.createElement('div');
    w.className='tbl-wrap';
    t.parentNode.insertBefore(w,t);
    w.appendChild(t);
  });
  // Keyboard-Navigation für Kacheln und Topic-Cards
  document.querySelectorAll('.glass-tile,.topic-card').forEach(el=>{
    el.setAttribute('tabindex','0');
    el.setAttribute('role','button');
    el.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); el.click(); }
    });
  });

  document.addEventListener('keydown', e => {
    if((e.ctrlKey||e.metaKey) && e.key==='k'){ e.preventDefault(); SEARCH.open(); return; }
    if(e.key==='?'&&!e.target.matches('input,textarea')){
      e.preventDefault();
      document.getElementById('shortcuts-overlay').classList.toggle('hidden');
      return;
    }
    if(e.key==='Escape'){
      if(!document.getElementById('search-overlay').classList.contains('hidden')){ SEARCH.close(); return; }
      if(!document.getElementById('shortcuts-overlay').classList.contains('hidden')){ document.getElementById('shortcuts-overlay').classList.add('hidden'); return; }
      if(!document.getElementById('settings2-overlay').classList.contains('hidden')){ SETTINGS2.close(); return; }
      if(!document.getElementById('pomodoro-overlay').classList.contains('hidden')){ POMODORO.close(); return; }
      if(!document.getElementById('onboarding-overlay')?.classList.contains('hidden')){ ONBOARDING.close(); return; }
      if(!document.getElementById('quiz-mastery-modal').classList.contains('hidden')){ QUIZ.closeMastery(); return; }
      SETTINGS.closeAllPanels();
      if(document.getElementById('stats-overlay')&&!document.getElementById('stats-overlay').classList.contains('hidden')){ STATS.close(); return; }
      if(!document.getElementById('notes-overlay').classList.contains('hidden')){ NOTES.close(); return; }
      if(!document.getElementById('changelog-modal').classList.contains('hidden')){ CHANGELOG.close(); return; }
    }
    // Lernkarten-Tastatursteuerung
    if(document.getElementById('v-flashcards').classList.contains('active')){
      if(e.key===' '||e.key==='ArrowUp'){ e.preventDefault(); FC.flip(); }
      if((e.key==='ArrowRight'||e.key==='j')&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); FC.answer(true); }
      if((e.key==='ArrowLeft'||e.key==='f')&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); FC.answer(false); }
    }
  });
  let _perfRafPending=false;
  window.addEventListener('scroll',()=>{
    const sTop=document.getElementById('scroll-top-btn');
    if(sTop) sTop.classList.toggle('visible',window.scrollY>300);
    if(!_perfRafPending){_perfRafPending=true;requestAnimationFrame(()=>{updateReadProgress();_perfRafPending=false;});}
  },{passive:true});
  document.addEventListener('click', e=>{
    if(!e.target.closest('.fontsize-btn-hdr')&&!e.target.closest('#fontsize-overlay'))
      document.getElementById('fontsize-overlay')?.classList.add('hidden');
    if(!e.target.closest('.notif-btn-hdr')&&!e.target.closest('#notif-overlay'))
      document.getElementById('notif-overlay')?.classList.add('hidden');
  });
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
    const paths = document.querySelectorAll('.logo-emblem svg path');
    if(paths.length>=2){
      paths[0].setAttribute('fill', online ? '#C9A84C' : '#fff');
      paths[1].setAttribute('fill', online ? '#fff' : '#C9A84C');
    }
  }
  window.addEventListener('offline', updateOnlineStatus);
  window.addEventListener('online', updateOnlineStatus);
  document.addEventListener('visibilitychange', updateOnlineStatus);
  updateOnlineStatus();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  ABK.render(); ABK.filter('');
  console.log('%c B VI %c Lernwebsite '+APP_VERSION+' · flametan/BVI-Lernwebsite ',
    'background:#A50000;color:#fff;padding:3px 8px;border-radius:4px 0 0 4px;font-family:"DM Mono",monospace;font-weight:700',
    'background:#0A192F;color:#C9A84C;padding:3px 8px;border-radius:0 4px 4px 0;font-family:"DM Mono",monospace');
});