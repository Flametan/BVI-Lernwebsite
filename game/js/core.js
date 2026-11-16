/* IdF-Spiel – Kern: Missionen, Speichern, Punkte, Level, Abzeichen, Tagesziel.
   Der Stand bleibt auf dem Gerät (localStorage „bvi_game_v1“). */
const CORE = (function(){
  const KEY = 'bvi_game_v1';
  const PASS = 0.7;                       // Level bestanden ab 70 % der möglichen Punkte

  // bereit:true = spielbar; die übrigen Missionen folgen einzeln
  const MISSIONS = [
    { id:'begehung',      thema:'Vorbeugender Brandschutz', titel:'Begehung',        text:'Geh durch das Gebäude und bestimme Türen, Wände, Decken und Treppen.', levels:5, bereit:true },
    { id:'stellungnahme', thema:'Vorbeugender Brandschutz', titel:'Stellungnahme',   text:'Prüfe ein Bauvorhaben und setze die Stellungnahme zusammen.', levels:5 },
    { id:'stab',          thema:'Stabsarbeit',              titel:'Im Stab',         text:'Ordne Meldungen den Sachgebieten zu und entscheide unter Zeitdruck.', levels:5 },
    { id:'presse',        thema:'Presse- und Öffentlichkeitsarbeit', titel:'Pressestatement', text:'Beantworte die Fragen der Reporter an der Einsatzstelle.', levels:5 },
    { id:'lage',          thema:'Zivile Verteidigung und Katastrophenschutz', titel:'Lage Bevölkerungsschutz', text:'Entscheide am Lagetisch über Warnung, Zuständigkeit und Hilfe.', levels:5 },
    { id:'ucpm',          thema:'Katastrophenschutzverfahren der EU', titel:'Hilfeersuchen', text:'Bring den Weg des Hilfeersuchens in die richtige Reihenfolge.', levels:5 },
    { id:'ibk',           thema:'IBK',                      titel:'Mitarbeitergespräch', text:'Führe Gespräche: Konflikt, Führung und Kommunikation.', levels:5 },
    { id:'vak',           thema:'VAk',                      titel:'Einsatzrecht vor Ort', text:'Prüfe Maßnahmen an der Einsatzstelle Schritt für Schritt auf Rechtmäßigkeit.', levels:5 },
    { id:'feuak',         thema:'FeuAK',                    titel:'Feuerwehr planen', text:'Plane Bedarf, Haushalt und Beschaffung für eine Stadt.', levels:5 }
  ];

  const BADGES = {
    erste:      { titel:'Erste Begehung',  text:'Erstes Level bestanden' },
    fehlerfrei: { titel:'Fehlerfrei',      text:'Ein Level ohne Fehler' },
    begehung:   { titel:'Brandschutzprüfer', text:'Alle Level der Begehung bestanden' },
    serie7:     { titel:'Sieben Tage',     text:'Tagesziel an 7 Tagen in Folge' }
  };

  const pad = n => String(n).padStart(2,'0');
  const dkey = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());

  let S = load();
  const OPT = { ton:true, vib:true, qual:'auto', sens:1 };
  function blank(){ return { v:1, m:{}, badges:[], tag:{ last:'', serie:0 }, opt:{} }; }
  function load(){
    try{
      const o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if(o && o.v === 1 && o.m && Array.isArray(o.badges) && o.tag){ o.opt = o.opt || {}; return o; }
    }catch(e){}
    return blank();
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

  function lv(mid, n){ return (S.m[mid] && S.m[mid][n]) || null; }
  function unlocked(mid, n){ return n === 0 || !!(lv(mid, n-1) && lv(mid, n-1).ok); }
  function best(mid){ let s = 0; const m = S.m[mid] || {}; for(const k in m) s += m[k].best || 0; return s; }
  function passed(mid){ let c = 0; const m = S.m[mid] || {}; for(const k in m) if(m[k].ok) c++; return c; }
  function total(){ return MISSIONS.reduce((a, m) => a + best(m.id), 0); }
  function today(){ return dkey(new Date()); }
  function dailyDone(){ return S.tag.last === today(); }

  function award(id, neu){ if(BADGES[id] && !S.badges.includes(id)){ S.badges.push(id); neu.push(id); } }

  // Ergebnis eines Levels eintragen; liefert, was neu ist (für die Auswertung)
  function finish(mid, n, punkte, max, fehler){
    const ok = max > 0 && punkte / max >= PASS;
    const m = S.m[mid] || (S.m[mid] = {});
    const alt = m[n] || { best:0, ok:false };
    const rekord = punkte > alt.best;
    m[n] = { best: Math.max(alt.best, punkte), ok: alt.ok || ok };
    const neu = [];
    if(ok){
      award('erste', neu);
      if(fehler === 0) award('fehlerfrei', neu);
      const mi = MISSIONS.find(x => x.id === mid);
      if(mi && passed(mid) >= mi.levels && BADGES[mid]) award(mid, neu);
    }
    // Tagesziel: ein Level am Tag; die Serie zählt aufeinanderfolgende Tage
    const t = today();
    if(S.tag.last !== t){
      const g = new Date(); g.setDate(g.getDate() - 1);
      S.tag.serie = S.tag.last === dkey(g) ? S.tag.serie + 1 : 1;
      S.tag.last = t;
      if(S.tag.serie >= 7) award('serie7', neu);
    }
    save();
    return { ok, rekord, neu };
  }

  const opt = k => (k in S.opt ? S.opt[k] : OPT[k]);
  function setOpt(k, v){ S.opt[k] = v; save(); }

  return { MISSIONS, BADGES, PASS, opt, setOpt, lv, unlocked, best, passed, total, finish, dailyDone,
           serie: () => S.tag.serie, badges: () => S.badges.slice() };
})();
