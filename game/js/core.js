/* IdF-Spiel – Kern: Missionen, Speichern, Punkte, Level, Abzeichen, Tagesziel, Wochenaufgabe,
   Wiederholung falscher Aufgaben (Abstand wächst), Prüfung und Bestenliste.
   Der Stand liegt in localStorage „bvi_game_v1“ und läuft über den Geräte-Abgleich der Lern-App mit;
   Einstellungen des Geräts (Ton, Grafik, Stufe) liegen getrennt in „bvi_game_opt“ und bleiben auf dem Gerät. */
const CORE = (function(){
  const KEY = 'bvi_game_v1', OKEY = 'bvi_game_opt';
  const PASS = 0.7;                       // Level bestanden ab 70 % der möglichen Punkte

  // bereit:true = spielbar; die übrigen Missionen folgen einzeln
  const MISSIONS = [
    { id:'begehung',      thema:'Vorbeugender Brandschutz', titel:'Begehung',        text:'Geh durch das Gebäude und bestimme Türen, Wände, Decken und Treppen.', levels:5, kapitel:'v-idf-vb', bereit:true },
    { id:'stellungnahme', thema:'Vorbeugender Brandschutz', titel:'Stellungnahme',   text:'In der Brandschutzdienststelle: Prüfe Bauvorhaben und setze Stellungnahmen aus Textbausteinen zusammen.', levels:6, kapitel:'v-idf-vb', bereit:true, welt:true },
    { id:'stab',          thema:'Stabsarbeit',              titel:'Im Stab',         text:'Bring Meldungen zum richtigen Sachgebiet und beantworte Fragen, teils unter Zeitdruck.', levels:6, kapitel:'v-idf-stabhub', bereit:true, welt:true },
    { id:'presse',        thema:'Presse- und Öffentlichkeitsarbeit', titel:'Pressestatement', text:'Beantworte die Fragen der Reporter und gib dein Statement vor laufender Kamera.', levels:6, kapitel:'v-idf-presse', bereit:true, welt:true },
    { id:'lage',          thema:'Zivile Verteidigung und Katastrophenschutz', titel:'Lage Bevölkerungsschutz', text:'Im Lagezentrum: Zivile Verteidigung, Warnung und länderübergreifende Hilfe.', levels:6, kapitel:'v-idf-zv', bereit:true, welt:true },
    { id:'ucpm',          thema:'Katastrophenschutzverfahren der EU', titel:'Hilfeersuchen', text:'Auf dem Flugfeld: Abkürzungen, Weg des Ersuchens und Kapazitäten der EU.', levels:6, kapitel:'v-idf-ucpm', bereit:true, welt:true },
    { id:'ibk',           thema:'IBK',                      titel:'Mitarbeitergespräch', text:'Auf der Wache: Führe Gespräche und beantworte Fragen zu Transaktionsanalyse und Konflikten.', levels:6, kapitel:'v-ibk', bereit:true, welt:true },
    { id:'vak',           thema:'VAk',                      titel:'Rechtskunde im Hörsaal', text:'Beantworte Fragen zu Staatsrecht, Verwaltungsrecht und Dienstrecht.', levels:6, kapitel:'v-vak', bereit:true, welt:true },
    { id:'feuak',         thema:'FeuAK',                    titel:'Feuerwehr planen', text:'Im Planungsbüro: Haushalt mit Budget, Standortwahl am Stadtmodell, Projekte, Qualität, Vergabe.', levels:6, kapitel:'v-feuak', bereit:true, welt:true }
  ];

  const BADGES = {
    erste:      { titel:'Erster Einsatz',  text:'Erstes Level bestanden' },
    fehlerfrei: { titel:'Fehlerfrei',      text:'Ein Level ohne Fehler' },
    begehung:   { titel:'Brandschutzprüfer', text:'Alle Level der Begehung bestanden' },
    stellungnahme:{ titel:'Sachbearbeiter VB', text:'Alle Level der Stellungnahme bestanden' },
    stab:       { titel:'Stabsmitglied',   text:'Alle Level im Stab bestanden' },
    presse:     { titel:'Pressesprecher',  text:'Alle Level des Pressestatements bestanden' },
    lage:       { titel:'Lagezentrum',     text:'Alle Level der Lage Bevölkerungsschutz bestanden' },
    ucpm:       { titel:'Europa-Einsatz',  text:'Alle Level des Hilfeersuchens bestanden' },
    ibk:        { titel:'Gesprächsführer', text:'Alle Level des Mitarbeitergesprächs bestanden' },
    vak:        { titel:'Rechtskundig',    text:'Alle Level im Einsatzrecht bestanden' },
    feuak:      { titel:'Planer',          text:'Alle Level von Feuerwehr planen bestanden' },
    serie7:     { titel:'Sieben Tage',     text:'Tagesziel an 7 Tagen in Folge' },
    woche:      { titel:'Wochenaufgabe',   text:'Eine Wochenaufgabe geschafft' },
    pruefung:   { titel:'Prüfung bestanden', text:'Die gemischte Prüfung mit Note 4 oder besser' },
    aufgeholt:  { titel:'Aufgeholt',       text:'10 Aufgaben in der Wiederholung gekonnt' },
    ernstfall:  { titel:'Ernstfall',       text:'Ein Level in der Stufe „Ernstfall“ bestanden' },
    lagegriff:  { titel:'Lage im Griff',   text:'Einen Einsatz (Level 6) mit gutem Ausgang beendet' }
  };

  const pad = n => String(n).padStart(2,'0');
  const dkey = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());

  let S = load();
  const OPT = { ton:true, vib:true, qual:'auto', sens:1, fx:'mittel', sprache:true, karte:true, name:'', stufe:'normal', tut:false, fps:false };
  function blank(){ return { v:1, m:{}, badges:[], tag:{ last:'', serie:0 } }; }
  function load(){
    try{
      const o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if(o && o.v === 1 && o.m && Array.isArray(o.badges) && o.tag) return o;
    }catch(e){}
    return blank();
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
  // Einstellungen: früher im Spielstand, jetzt eigener Schlüssel (einmalig umziehen)
  let O = {};
  try{ O = JSON.parse(localStorage.getItem(OKEY) || 'null') || {}; }catch(e){}
  if(S.opt){ O = Object.assign({}, S.opt, O); delete S.opt; saveOpt(); save(); }
  function saveOpt(){ try{ localStorage.setItem(OKEY, JSON.stringify(O)); }catch(e){} }

  function lv(mid, n){ return (S.m[mid] && S.m[mid][n]) || null; }
  function unlocked(mid, n){ return n === 0 || !!(lv(mid, n-1) && lv(mid, n-1).ok); }
  function best(mid){ let s = 0; const m = S.m[mid] || {}; for(const k in m) s += m[k].best || 0; return s; }
  function passed(mid){ let c = 0; const m = S.m[mid] || {}; for(const k in m) if(m[k].ok) c++; return c; }
  function total(){ return MISSIONS.reduce((a, m) => a + best(m.id), 0); }
  function today(){ return dkey(new Date()); }
  function dailyDone(){ return S.tag.last === today(); }

  function award(id, neu){ if(BADGES[id] && !S.badges.includes(id)){ S.badges.push(id); neu.push(id); } }

  // Ergebnis eines Levels eintragen; liefert, was neu ist (für die Auswertung)
  function finish(mid, n, punkte, max, fehler, extra){
    const ok = max > 0 && punkte / max >= PASS;
    const m = S.m[mid] || (S.m[mid] = {});
    const alt = m[n] || { best:0, ok:false };
    const rekord = punkte > alt.best;
    m[n] = { best: Math.max(alt.best, punkte), ok: alt.ok || ok };
    if(alt.ernst || (ok && extra && extra.ernst)) m[n].ernst = true;
    const neu = [];
    if(ok){
      award('erste', neu);
      if(fehler === 0) award('fehlerfrei', neu);
      if(extra && extra.ernst) award('ernstfall', neu);
      if(extra && extra.gut) award('lagegriff', neu);
      const mi = MISSIONS.find(x => x.id === mid);
      if(mi && passed(mid) >= mi.levels && BADGES[mid]) award(mid, neu);
    }
    // Wochenaufgabe: drei bestandene Durchläufe in der Mission der Woche
    const w = woche();
    if(ok && mid === w.mission.id && w.n < w.ziel){ S.woche.n++; if(S.woche.n >= w.ziel) award('woche', neu); }
    if(punkte > 0){ const mi = MISSIONS.find(x => x.id === mid); eintrag('level', { p:punkte, w:(mi ? mi.titel : mid) + ' · Level ' + (n + 1) }); }
    tagesziel(neu); save();
    return { ok, rekord, neu };
  }
  // Tagesziel: ein Level, eine Wiederholung oder eine Prüfung am Tag; die Serie zählt aufeinanderfolgende Tage
  function tagesziel(neu){
    const t = today(); if(S.tag.last === t) return;
    const g = new Date(); g.setDate(g.getDate() - 1);
    S.tag.serie = S.tag.last === dkey(g) ? S.tag.serie + 1 : 1; S.tag.last = t;
    if(S.tag.serie >= 7) award('serie7', neu);
  }

  /* Wochenaufgabe: Die Mission wechselt jede Kalenderwoche (ISO-Woche) */
  function wochenId(){ const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const j = new Date(d.getFullYear(), 0, 4), nr = 1 + Math.round(((d - j) / 864e5 - 3 + (j.getDay() + 6) % 7) / 7); return { id:d.getFullYear() + '-W' + pad(nr), nr }; }
  function woche(){
    const w = wochenId(); if(!S.woche || S.woche.id !== w.id) S.woche = { id:w.id, n:0 };
    return { id:w.id, mission:MISSIONS[w.nr % MISSIONS.length], ziel:3, n:S.woche.n };
  }

  /* Wiederholung: Falsch gelöste Aufgaben sind sofort fällig; nach jeder richtigen Antwort wächst der Abstand (1, 3, 7, 16 Tage), danach gilt die Aufgabe als gelernt */
  const ABSTAND = [1, 3, 7, 16];
  const wkey = (m, l, f) => m + '|' + l + '|' + f;
  function merke(m, l, f){ S.wdh = S.wdh || {}; S.wdh[wkey(m, l, f)] = { m, l, f, s:0, d:today() }; save(); }
  function gekonnt(m, l, f){
    const k = wkey(m, l, f), e = S.wdh && S.wdh[k], neu = []; if(!e) return neu;
    if(e.s >= ABSTAND.length) delete S.wdh[k]; else { const d = new Date(); d.setDate(d.getDate() + ABSTAND[e.s]); e.s++; e.d = dkey(d); }
    S.wdhOk = (S.wdhOk || 0) + 1; if(S.wdhOk >= 10) award('aufgeholt', neu); save(); return neu;
  }
  function faellig(){ const t = today(), w = S.wdh || {}; return Object.keys(w).map(k => w[k]).filter(e => e.d <= t).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)); }
  function vergiss(m, l, f){ if(S.wdh) delete S.wdh[wkey(m, l, f)]; }

  /* Bestenliste auf dem Gerät: die zehn besten Läufe je Art (level, pruefung) */
  function eintrag(art, o){
    S.rang = S.rang || {}; const a = S.rang[art] || (S.rang[art] = []);
    a.push(Object.assign({ n:opt('name') || 'Ich', d:today() }, o)); a.sort((x, y) => y.p - x.p || (x.t || 0) - (y.t || 0)); a.length = Math.min(a.length, 10);
  }
  // Prüfung eintragen: p = Prozent, t = gebrauchte Sekunden
  function pruefung(p, t, note){
    const neu = []; S.pruef = S.pruef || { best:0, n:0 }; S.pruef.n++; const rekord = p > S.pruef.best; S.pruef.best = Math.max(S.pruef.best, p);
    eintrag('pruefung', { p, t, w:'Note ' + note }); if(note <= 4) award('pruefung', neu); tagesziel(neu); save();
    return { rekord, neu };
  }
  function trainiert(){ const neu = []; tagesziel(neu); save(); return neu; }

  const opt = k => (k in O ? O[k] : OPT[k]);
  function setOpt(k, v){ O[k] = v; saveOpt(); }

  return { MISSIONS, BADGES, PASS, opt, setOpt, lv, unlocked, best, passed, total, finish, dailyDone, woche, merke, gekonnt, faellig, vergiss, pruefung, trainiert,
           serie: () => S.tag.serie, badges: () => S.badges.slice(), rang: art => ((S.rang || {})[art] || []).slice(), pruefBest: () => (S.pruef ? S.pruef.best : 0) };
})();
