/* ======================================================================
   KREUZWORTRÄTSEL – Pausenraum (wird erst beim Öffnen des Spiels geladen)
   Jeden Tag ein neues Rätsel mit Fachbegriffen, für alle gleich: Der Zufall
   kommt aus dem lokalen Datum (JJJJ-MM-TT). Die Hinweise und Begriffe stammen
   aus den Lerninhalten der Seite.

   Rekord: localStorage['bvi_pause_best'].kreuzwort = Zahl, beste Serie in Tagen
   (höher ist besser). Die laufende Serie liegt getrennt in 'bvi_kreuzwort_streak'
   als {n:Zahl,last:'JJJJ-MM-TT'}. Regel: Wer das Tagesrätsel am Folgetag des
   letzten gelösten Tages löst, setzt die Serie fort (n+1). Wurde ein Tag
   übersprungen oder nur aufgelöst, beginnt die Serie beim nächsten gelösten
   Rätsel wieder bei 1. Die Bestserie sinkt nie.
   Tagesstand: 'bvi_kreuzwort_state_<datum>'.
====================================================================== */
const KREUZWORT=(function(){
  'use strict';
  const BKEY='bvi_pause_best', SKEY='bvi_kreuzwort_streak', STKEY='bvi_kreuzwort_state_', G=13;
  /* WORT|Hinweis, Großbuchstaben, Ä Ö Ü, ß als SS, 4 bis 12 Buchstaben */
  const WORDS=`DREHLEITER|Rettungsgerät mit Korb, Kürzel DLK
RÜSTWAGEN|Fahrzeug für die technische Hilfeleistung, Kürzel RW
WECHSELLADER|Fahrzeug, das Abrollbehälter aufnimmt, Kürzel WLF
GERÄTEWAGEN|Fahrzeug für Ausrüstung und Material, Kürzel GW
ATEMSCHUTZ|Schutz vor Atemgiften, geregelt in der FwDV 7
FEUERWEHR|Organisation für Brandbekämpfung und Hilfeleistung
LEITSTELLE|Nimmt Notrufe an und alarmiert die Einsatzkräfte
MASCHINIST|Bedient die Pumpe am Fahrzeug, Kürzel Ma
ZUGFÜHRER|Führt einen Zug, Kürzel ZF
TRUPPFÜHRER|Führt den Trupp, Kürzel TF
WASSERTRUPP|Baut die Wasserversorgung auf
STAFFEL|Taktische Einheit aus sechs Einsatzkräften
EINSATZ|Alarmierte Hilfeleistung vor Ort
BRANDSCHUTZ|Vorbeugung und Bekämpfung von Bränden
BRANDKLASSE|Einteilung brennbarer Stoffe in A, B, C, D und F
LÖSCHMITTEL|Stoff zur Brandbekämpfung wie Wasser, Schaum oder Pulver
LÖSCHWASSER|Wird mit der Pumpe zur Brandstelle gefördert
SCHAUM|Löschmittel für Flüssigkeitsbrände
PULVER|Trockenes Löschmittel aus feinem Staub
WASSERSTOFF|Leichtestes Gas, Formel H2
STICKSTOFF|Hauptbestandteil der Luft, Formel N2
AMMONIAK|Stechend riechendes Atemgift, Formel NH3
BLAUSÄURE|Atemgift mit der Formel HCN
KOHLENDIOXID|Gas mit der Formel CO2
PROPAN|Brenngas, schwerer als Luft
BUTAN|Erstickendes Gas, ähnlich wie Propan
ACETYLEN|Brenngas für das Schweißen
METHAN|Hauptbestandteil von Erdgas
KNOTEN|Verbindung von Seil oder Leine
ACHTKNOTEN|Sicherung und Stopper am Seilende
MASTWURF|Befestigt eine Leine am Pfosten
PFAHLSTICH|Bildet eine Rettungsschlinge, die sich nicht zuzieht
ROLLSTICH|Dient zur Seilverlängerung
WEBELEINSTEK|Knoten für Bandschlingen und Haken
SCHLAUCH|Leitung für Löschwasser
KUPPLUNG|Verbindet zwei Schläuche, genormt nach Storz
HYDRANT|Entnahmestelle für Löschwasser am Wassernetz
STRAHLROHR|Gibt am Schlauchende den Wasserstrahl ab
VERTEILER|Teilt eine Leitung in mehrere Abgänge
SAUGSCHLAUCH|Fördert Wasser aus offenem Gewässer
FLASHOVER|Schlagartige Durchzündung eines Raumes
BACKDRAFT|Rauchgasexplosion durch plötzliche Luftzufuhr
RAUCHGAS|Gasgemisch, das bei einem Brand entsteht
FLAMMPUNKT|Niedrigste Temperatur, bei der Dämpfe entflammbar werden
ZÜNDQUELLE|Löst die Verbrennung aus
BRENNSTOFF|Eine der Voraussetzungen für Verbrennung
SAUERSTOFF|Muss für die Verbrennung vorhanden sein
VERBRENNUNG|Oxidation mit Flamme und Wärme
EXPLOSION|Schlagartige Volumenvergrößerung
GEFAHRGUT|Stoff, von dem besondere Gefahren ausgehen
STRAHLUNG|Gefahr im A-Einsatz, wird in mSv angegeben
ABSPERRUNG|Sichert die Einsatzstelle gegen Unbefugte
RETTUNG|Befreien von Menschen aus Gefahr
SCHLEIFKORB|Trage zur Rettung aus schwierigem Gelände
HYDRAULIK|Technik mit Flüssigkeitsdruck, etwa bei Spreizer und Schere
SPREIZER|Rettungsgerät zum Aufdrücken von Karosserieteilen
SEILWINDE|Zieht Lasten mit einem Seil
HEBEKISSEN|Hebt Lasten mit Druckluft an
LAGEKARTE|Stellt die Einsatzlage grafisch dar
STABSARBEIT|Arbeit in der Führungsgruppe
SACHGEBIET|Aufgabenbereich im Stab, zum Beispiel S1 bis S6
FÜHRUNGSSTAB|Unterstützt den Einsatzleiter bei der Führung
KRISENSTAB|Administrativ-organisatorische Komponente
BEFEHL|Anweisung der Führungskraft
ERMESSEN|Entscheidungsspielraum der Behörde
GESETZ|Vom Parlament beschlossene Rechtsnorm
VERORDNUNG|Rechtsnorm, die die Exekutive erlässt
SATZUNG|Regelwerk einer Körperschaft
BESCHEID|Schriftliche Entscheidung der Behörde
WIDERSPRUCH|Rechtsbehelf gegen einen Verwaltungsakt
KLAGE|Rechtsbehelf vor dem Gericht
FRIST|Zeitraum, in dem eine Handlung erfolgen muss
VERWALTUNG|Ausführende Gewalt des Staates
BEHÖRDE|Stelle, die Aufgaben der öffentlichen Verwaltung wahrnimmt
BEAMTER|Steht in einem öffentlich-rechtlichen Dienstverhältnis
BESOLDUNG|Bezahlung der Beamten
LAUFBAHN|Beruflicher Werdegang im öffentlichen Dienst
DIENSTGRAD|Rangbezeichnung bei der Feuerwehr
AUSBILDUNG|Wird in der FwDV 2 geregelt
BRANDRAT|Dienstgrad im höheren Dienst
BRANDOBERRAT|Dienstgrad oberhalb des Brandrats
BRANDAMTMANN|Dienstgrad im gehobenen Dienst
FEMUR|Oberschenkelknochen
PATELLA|Kniescheibe
STERNUM|Brustbein
CLAVICULA|Schlüsselbein
SCAPULA|Schulterblatt
TIBIA|Schienbein
HUMERUS|Oberarmknochen
MANDIBULA|Unterkiefer
WATT|Einheit der Leistung
VOLT|Einheit der Spannung
AMPERE|Einheit der Stromstärke
PASCAL|Einheit des Drucks
JOULE|Einheit der Energie
HERTZ|Einheit der Frequenz
NEWTON|Einheit der Kraft
KOMPLEMENTÄR|Transaktion, bei der die Antwort wie erwartet kommt
GEKREUZT|Transaktion, die zum Kommunikationsabbruch führt
VERDECKT|Transaktion als Basis für Psychospiele
NETZBETRIEB|Betriebsart im Digitalfunk, Kürzel TMO
RAUCHMELDER|Warnt bei Rauchentwicklung
SPRINKLER|Löscht automatisch im Brandfall
LÖSCHANLAGE|Feste Einrichtung zum automatischen Löschen
STEIGLEITUNG|Feste Wasserleitung im Gebäude
WANDHYDRANT|Wasserentnahme in Gebäuden
FEUERLÖSCHER|Tragbares Gerät für die Brandbekämpfung
ERSTICKUNG|Löscheffekt durch Entzug von Sauerstoff
INERTGAS|Löschmittel, das den Sauerstoff verdrängt
HALON|Löschmittel, heute weitgehend verboten
ARGON|Edelgas für Löschanlagen
DAMPF|Gasförmiges Wasser
BRANDLAST|Menge brennbarer Stoffe in einem Bereich
BRANDWAND|Bauteil, das Feuer nicht durchlässt
FLUCHTWEG|Weg, auf dem Personen ins Freie gelangen
RETTUNGSWEG|Weg für die Rettung von Personen
RAUCHABZUG|Öffnung zur Ableitung von Rauch, Kürzel RWA
ENTRAUCHUNG|Rauch aus dem Gebäude abführen
FLUCHTHAUBE|Schützt Personen beim Verlassen verrauchter Bereiche
ATEMLUFT|Wird aus der Flasche des Pressluftatmers entnommen
ATEMGIFT|Schädlicher Stoff in der Atemluft
MANOMETER|Zeigt den Druck in bar an
SCHUTZANZUG|Persönliche Schutzausrüstung für besondere Gefahren
SCHUTZHELM|Kopfschutz der Einsatzkraft
KATASTROPHE|Großschadenslage, bei der KatS tätig wird
TRUPP|Kleinste taktische Einheit
STORZ|Name der genormten Schlauchkupplung
LAUGE|Flüssigkeit mit pH über 7, Lackmus färbt sie blau
DOSIS|Wird im A-Einsatz in mSv angegeben
CHLOR|Atemgift mit Reizwirkung, Formel Cl2
DEKON|Kurzwort für die Reinigung nach einer Kontamination
MASKE|Wird beim Atemschutz mit Dichtrahmen getragen
PUMPE|Fördert Wasser, zum Beispiel FPN 10-2000
BRAND|Nicht bestimmungsgemäßes Brennen
FEUER|Bestimmungsgemäßes Brennen
ALARM|Ruft die Einsatzkräfte
WACHE|Standort der Einsatzkräfte und Fahrzeuge
DRUCK|Das Manometer zeigt ihn in bar an
STROM|Fließt durch das Kabel, gemessen in Ampere`.split('\n').map(l=>{ const i=l.indexOf('|'); return {w:l.slice(0,i),h:l.slice(i+1)}; }).filter(o=>/^[A-ZÄÖÜ]{4,12}$/.test(o.w)&&o.h);
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const lget=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
  const lset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  const say=m=>{ if(typeof A11Y!=='undefined') A11Y.say(m); };
  const pad=n=>(n<10?'0':'')+n;
  const isoDate=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const today=()=>isoDate(new Date());
  const yesterday=s=>{ const p=s.split('-'); return isoDate(new Date(+p[0],+p[1]-1,+p[2]-1)); };
  const reduced=()=>{ try{ return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } };

  /* ---------- Zufall ---------- */
  function hashStr(s){ let h=1779033703^s.length; for(let i=0;i<s.length;i++){ h=Math.imul(h^s.charCodeAt(i),3432918353); h=(h<<13)|(h>>>19); } h=Math.imul(h^(h>>>16),2246822507); h=Math.imul(h^(h>>>13),3266489909); return (h^(h>>>16))>>>0; }
  function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^(a>>>15),1|a); t=t+Math.imul(t^(t>>>7),61|t)^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
  function shuffle(a,rnd){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

  /* ---------- Generator ---------- */
  const BYL={}; WORDS.forEach((o,wi)=>{ for(let b=0;b<o.w.length;b++){ (BYL[o.w[b]]=BYL[o.w[b]]||[]).push([wi,b]); } });

  function tryBuild(rnd,target){
    const grid=new Array(G*G).fill(''), own=[new Uint8Array(G*G),new Uint8Array(G*G)], placed=[], used=new Uint8Array(WORDS.length);
    let nodes=0;
    const occ=(r,c)=>r>=0&&c>=0&&r<G&&c<G&&grid[r*G+c]!=='';
    // liefert Anzahl Kreuzungen oder -1, wenn die Platzierung gegen die Regeln verstößt
    function check(w,r,c,dir){
      const L=w.length, dr=dir, dc=1-dir, er=r+dr*(L-1), ec=c+dc*(L-1);
      if(r<0||c<0||er>=G||ec>=G) return -1;
      if(occ(r-dr,c-dc)||occ(er+dr,ec+dc)) return -1;
      let x=0;
      for(let i=0;i<L;i++){
        const rr=r+dr*i, cc=c+dc*i, k=rr*G+cc, ch=grid[k];
        if(ch!==''){ if(ch!==w[i]||own[dir][k]) return -1; x++; }
        else if(occ(rr-dc,cc-dr)||occ(rr+dc,cc+dr)) return -1;
      }
      return x;
    }
    function put(wi,r,c,dir){
      const w=WORDS[wi].w, nw=[]; used[wi]=1;
      for(let i=0;i<w.length;i++){ const k=(r+(dir?i:0))*G+(c+(dir?0:i)); if(grid[k]==='') { grid[k]=w[i]; nw.push(k); } own[dir][k]=1; }
      placed.push({wi,w,r,c,dir,nw});
    }
    function unput(){
      const p=placed.pop(); used[p.wi]=0;
      for(let i=0;i<p.w.length;i++){ own[p.dir][(p.r+(p.dir?i:0))*G+(p.c+(p.dir?0:i))]=0; }
      p.nw.forEach(k=>{ grid[k]=''; });
    }
    function area(extra){
      let a=99,b=-1,c0=99,d=-1;
      const add=p=>{ const er=p.r+(p.dir?p.w.length-1:0), ec=p.c+(p.dir?0:p.w.length-1); a=Math.min(a,p.r); b=Math.max(b,er); c0=Math.min(c0,p.c); d=Math.max(d,ec); };
      placed.forEach(add); if(extra) add(extra);
      return (b-a+1)*(d-c0+1);
    }
    function rec(){
      if(placed.length>=target) return true;
      if(++nodes>1500) return false;
      const base=area(null), seen=new Set(), cands=[];
      placed.forEach(p=>{
        const nd=1-p.dir;
        for(let a=0;a<p.w.length;a++){
          const pr=p.r+(p.dir?a:0), pc=p.c+(p.dir?0:a), list=BYL[p.w[a]]||[];
          for(let q=0;q<list.length;q++){
            const wi=list[q][0], b=list[q][1]; if(used[wi]) continue;
            const r=pr-(nd?b:0), c=pc-(nd?0:b), key=wi+':'+r+':'+c+':'+nd;
            if(seen.has(key)) continue; seen.add(key);
            const w=WORDS[wi].w, x=check(w,r,c,nd); if(x<1) continue;
            const ar=area({w,r,c,dir:nd});
            cands.push({wi,r,c,dir:nd,s:2.2*x-0.05*(ar-base)+rnd()*1.3});
          }
        }
      });
      cands.sort((a,b)=>b.s-a.s);
      const lim=Math.min(6,cands.length);
      for(let i=0;i<lim;i++){
        const o=cands[i]; put(o.wi,o.r,o.c,o.dir);
        if(rec()) return true;
        unput();
      }
      return false;
    }
    const order=shuffle(WORDS.map((o,i)=>i),rnd).filter(i=>WORDS[i].w.length>=8&&WORDS[i].w.length<=11);
    const f=order[0], len=WORDS[f].w.length;
    put(f,4+Math.floor(rnd()*5),Math.max(0,Math.min(G-len,Math.floor((G-len)/2)+Math.floor(rnd()*3)-1)),0);
    if(!rec()) return null;
    // auf den belegten Bereich zuschneiden
    let r0=99,r1=-1,c0=99,c1=-1;
    for(let k=0;k<G*G;k++) if(grid[k]){ const r=Math.floor(k/G), c=k%G; r0=Math.min(r0,r); r1=Math.max(r1,r); c0=Math.min(c0,c); c1=Math.max(c1,c); }
    const R=r1-r0+1, C=c1-c0+1, cells=new Array(R*C).fill('');
    for(let r=0;r<R;r++) for(let c=0;c<C;c++) cells[r*C+c]=grid[(r+r0)*G+c+c0];
    const words=placed.map(p=>({w:p.w,h:WORDS[p.wi].h,r:p.r-r0,c:p.c-c0,dir:p.dir,len:p.w.length,num:0}));
    const start={}; words.forEach(w=>{ start[(w.r*C+w.c)+'|'+w.dir]=w; });
    let num=0;
    for(let k=0;k<R*C;k++){ const a=start[k+'|0'], d=start[k+'|1']; if(a||d){ num++; if(a) a.num=num; if(d) d.num=num; } }
    words.sort((a,b)=>a.num-b.num||a.dir-b.dir);
    return {R,C,cells,words};
  }

  // prüft ein Rätsel: Konflikte, Zusammenhang, Wortzahl; liefert Liste von Fehlern (leer = in Ordnung)
  function verify(P){
    const err=[], R=P.R, C=P.C, cells=P.cells;
    if(P.words.length<8||P.words.length>12) err.push('Wortzahl '+P.words.length);
    if(R>G||C>G) err.push('Gitter zu groß');
    if(!cells.some(Boolean)) return ['leer'];
    const runs=new Set();
    for(let r=0;r<R;r++){ let c=0; while(c<C){ if(!cells[r*C+c]){ c++; continue; } let e=c; while(e<C&&cells[r*C+e]) e++; if(e-c>=2) runs.add(r+','+c+',0,'+cells.slice(r*C+c,r*C+e).join('')); c=e; } }
    for(let c=0;c<C;c++){ let r=0; while(r<R){ if(!cells[r*C+c]){ r++; continue; } let e=r; while(e<R&&cells[e*C+c]) e++; if(e-r>=2){ let s=''; for(let i=r;i<e;i++) s+=cells[i*C+c]; runs.add(r+','+c+',1,'+s); } r=e; } }
    const ws=new Set(); P.words.forEach(w=>{ ws.add(w.r+','+w.c+','+w.dir+','+w.w); });
    runs.forEach(x=>{ if(!ws.has(x)) err.push('Fremdwort im Gitter '+x); });
    ws.forEach(x=>{ if(!runs.has(x)) err.push('Wort fehlt im Gitter '+x); });
    const seen=new Set(P.words.map(w=>w.w)); if(seen.size!==P.words.length) err.push('doppeltes Wort');
    P.words.forEach(w=>{ if(!/^[A-ZÄÖÜ]{4,12}$/.test(w.w)) err.push('Zeichen '+w.w); });
    // Zusammenhang über benachbarte Buchstabenfelder
    const first=cells.findIndex(Boolean), vis=new Uint8Array(R*C), st=[first]; vis[first]=1; let cnt=0;
    while(st.length){ const k=st.pop(); cnt++; const r=Math.floor(k/C), c=k%C;
      [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(a=>{ if(a[0]<0||a[1]<0||a[0]>=R||a[1]>=C) return; const j=a[0]*C+a[1]; if(cells[j]&&!vis[j]){ vis[j]=1; st.push(j); } }); }
    if(cnt!==cells.filter(Boolean).length) err.push('nicht zusammenhängend');
    return err;
  }

  function build(date){
    for(let att=0;att<80;att++){
      const rnd=mulberry32(hashStr(date+'|'+att));
      const P=tryBuild(rnd,8+Math.floor(rnd()*5));
      if(P&&!verify(P).length) return P;
    }
    return null;
  }

  /* ---------- Serie ---------- */
  function streakInfo(d){ const s=lget(SKEY,{}), n=+s.n||0; const cur=(s.last===d||s.last===yesterday(d))?n:0; const b=+((lget(BKEY,{}).kreuzwort)||0); return {cur,best:Math.max(b,cur),last:s.last||'',n}; }

  /* ---------- CSS ---------- */
  const CSS=`
.kw-wrap [hidden]{display:none!important;}
.kw-wrap{display:flex;flex-direction:column;gap:12px;max-width:600px;width:100%;margin:0 auto;}
.kw-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.kw-top h3{margin:0;font-size:1.05rem;}
.kw-date{color:var(--m-muted);font-size:.82rem;margin-top:2px;}
.kw-ser{display:flex;align-items:center;gap:8px;text-align:right;font-size:.8rem;color:var(--m-muted);line-height:1.3;}
.kw-ser b{color:var(--m-fg);font-size:.95rem;}
.kw-ser svg{width:26px;height:26px;flex:none;}
.kw-gridw{container-type:inline-size;width:100%;max-width:calc(var(--c) * 46px);margin:0 auto;}
.kw-grid{display:grid;grid-template-columns:repeat(var(--c),minmax(0,1fr));gap:2px;touch-action:manipulation;}
.kw-x{aspect-ratio:1;}
.kw-cell{position:relative;aspect-ratio:1;min-width:0;padding:0;border:1px solid var(--m-line,rgba(128,128,128,.35));border-radius:4px;background:var(--m-raised);color:var(--m-fg);font-family:inherit;font-weight:800;font-size:1rem;font-size:clamp(11px,calc(100cqw / var(--c) * .5),24px);display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;line-height:1;}
.kw-cell .kw-n{position:absolute;left:2px;top:1px;font-size:clamp(6px,calc(100cqw / var(--c) * .24),11px);font-weight:700;color:var(--m-muted);line-height:1;pointer-events:none;}
.kw-cell .kw-l{pointer-events:none;}
.kw-cell.wd{background:color-mix(in srgb,var(--m-accent,#ffa31a) 26%,var(--m-raised));}
.kw-cell.sel{background:var(--m-accent,#ffa31a);color:var(--m-on-accent,#111);border-color:var(--m-accent,#ffa31a);}
.kw-cell.sel .kw-n{color:var(--m-on-accent,#111);opacity:.75;}
.kw-cell.bad{background:color-mix(in srgb,var(--pz-bad,#e5484d) 38%,var(--m-raised));border-color:var(--pz-bad,#e5484d);}
.kw-cell.bad.sel{background:var(--pz-bad,#e5484d);color:#fff;}
.kw-cell.ok{background:color-mix(in srgb,var(--pz-ok,#2fae6b) 24%,var(--m-raised));border-color:var(--pz-ok,#2fae6b);cursor:default;}
.kw-cell.rv{cursor:default;}
.kw-cell:focus-visible,.kw-key:focus-visible,.kw-cl:focus-visible{outline:3px solid var(--m-accent-fg,#ffa31a);outline-offset:1px;z-index:2;}
.kw-cell.pop .kw-l{animation:kw-pop .16s ease-out;}
.kw-cell.wv{animation:kw-wave .5s ease-out both;}
@keyframes kw-pop{from{transform:scale(.55);}to{transform:scale(1);}}
@keyframes kw-wave{0%{transform:scale(1);}45%{transform:scale(1.22);}100%{transform:scale(1);}}
@media (prefers-reduced-motion:reduce){.kw-cell.pop .kw-l,.kw-cell.wv{animation:none;}}
.kw-cur{min-height:3.1em;display:flex;flex-direction:column;justify-content:center;gap:2px;}
.kw-cur small{color:var(--m-accent-fg,#ffa31a);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:.72rem;}
.kw-cur span{font-weight:600;line-height:1.35;}
.kw-keys{display:flex;flex-direction:column;gap:5px;user-select:none;-webkit-user-select:none;touch-action:manipulation;}
.kw-row{display:flex;gap:4px;}
.kw-key{flex:1 1 0;min-width:0;height:44px;border:0;border-radius:8px;background:var(--m-raised);color:var(--m-fg);font-family:inherit;font-weight:700;font-size:1rem;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent;}
.kw-key:active{background:var(--m-accent,#ffa31a);color:var(--m-on-accent,#111);}
.kw-key.bk{flex:1.8 1 0;}
.kw-act{display:flex;gap:8px;flex-wrap:wrap;}
.kw-act .pz-pri{flex:1 1 120px;min-height:44px;}
.kw-act .pz-sec2{flex:1 1 90px;min-height:44px;border-radius:13px;}
.kw-res{align-items:center;text-align:center;}
.kw-res svg{width:44px;height:44px;}
.kw-res .pz-big-n{color:var(--pz-ok,#2fae6b);}
.kw-lists{display:grid;grid-template-columns:1fr;gap:14px;}
@media(min-width:520px){.kw-lists{grid-template-columns:1fr 1fr;}}
.kw-lists h4{margin:0 0 6px;font-size:.78rem;letter-spacing:.09em;text-transform:uppercase;color:var(--m-muted);}
.kw-lists ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;}
.kw-cl{display:flex;gap:8px;align-items:baseline;width:100%;text-align:left;background:none;border:0;border-radius:8px;padding:7px 8px;min-height:40px;color:var(--m-fg);font-family:inherit;font-size:.88rem;line-height:1.35;cursor:pointer;}
.kw-cl b{flex:none;min-width:1.6em;color:var(--m-accent-fg,#ffa31a);}
.kw-cl.on{background:color-mix(in srgb,var(--m-accent,#ffa31a) 22%,transparent);}
.kw-cl.dn{color:var(--m-muted);text-decoration:line-through;text-decoration-thickness:1px;}
.kw-cl.dn.on{text-decoration:none;color:var(--m-fg);}
`;

  /* ---------- Spiel ---------- */
  const ROWS=['QWERTZUIOPÜ','ASDFGHJKLÖÄ','YXCVBNM'];
  const FLAME='<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="kw-fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a1f"/><stop offset="1" stop-color="#ffd166"/></linearGradient></defs><path fill="url(#kw-fg)" d="M12.500 2c.4 3-1 4.800-2.600 6.700C8.300 10.500 7 12.300 7 14.800 7 18.200 9.200 21 12.200 21c3.200 0 5.300-2.400 5.300-5.500 0-2.100-1-3.600-2-4.800-.3 1.300-.9 2.200-1.800 2.700.5-3.300-.1-7.700-1.200-11.400z"/></svg>';
  let el=null, P=null, date='', cells=[], entries=[], bad=[], cw=[[],[]], cellEls=[], clEls=[], selK=0, dir=0, mode='play', handlers=[], timers=[], refs={}, boundDoc=false;

  function injectCss(){ if(document.getElementById('kw-style')) return; const s=document.createElement('style'); s.id='kw-style'; s.textContent=CSS; document.head.appendChild(s); }
  const later=(fn,ms)=>{ const t=setTimeout(()=>{ timers=timers.filter(x=>x!==t); fn(); },ms); timers.push(t); return t; };
  const cellsOf=w=>{ const a=[]; for(let i=0;i<w.len;i++) a.push((w.r+(w.dir?i:0))*P.C+w.c+(w.dir?0:i)); return a; };
  const activeWord=()=>{ const i=cw[dir][selK]; return i>=0?P.words[i]:null; };

  function saveState(){ lset(STKEY+date,{e:entries.slice(),m:mode,sig:P.words.length+P.cells.join('')}); }
  function loadState(){
    const s=lget(STKEY+date,null);
    if(!s||!Array.isArray(s.e)||s.e.length!==P.R*P.C||s.sig!==P.words.length+P.cells.join('')) return;
    entries=s.e.map((x,k)=>(P.cells[k]&&typeof x==='string'&&/^[A-ZÄÖÜ]$/.test(x))?x:'');
    mode=(s.m==='won'||s.m==='rev')?s.m:'play';
    if(mode!=='play') entries=P.cells.slice();
  }
  function pruneOld(){
    try{ const del=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.indexOf(STKEY)===0&&k!==STKEY+date) del.push(k); } del.forEach(k=>localStorage.removeItem(k)); }catch(e){}
  }

  function html(){
    const ser=streakInfo(date);
    let g='';
    for(let k=0;k<P.R*P.C;k++){
      if(!P.cells[k]){ g+='<span class="kw-x" aria-hidden="true"></span>'; continue; }
      const nums=P.words.filter(w=>w.r*P.C+w.c===k).map(w=>w.num).filter((n,i,a)=>a.indexOf(n)===i);
      g+='<button type="button" class="kw-cell" data-k="'+k+'" tabindex="-1">'+(nums.length?'<i class="kw-n">'+nums[0]+'</i>':'')+'<span class="kw-l"></span></button>';
    }
    const lst=d=>'<ol>'+P.words.map((w,i)=>w.dir===d?'<li><button type="button" class="kw-cl" data-w="'+i+'"><b>'+w.num+'</b><span>'+esc(w.h)+' ('+w.len+')</span></button></li>':'').join('')+'</ol>';
    const keys=ROWS.map((r,ri)=>'<div class="kw-row">'+r.split('').map(ch=>'<button type="button" class="kw-key" data-ch="'+ch+'" aria-label="'+ch+'">'+ch+'</button>').join('')+(ri===2?'<button type="button" class="kw-key bk" data-bk="1" aria-label="Zeichen löschen">⌫</button>':'')+'</div>').join('');
    let ds=date; try{ ds=new Date(date+'T12:00:00').toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'}); }catch(e){}
    return '<div class="kw-wrap">'
      +'<div class="pz-card"><div class="kw-top"><div><h3>Tagesrätsel</h3><div class="kw-date">'+esc(ds)+'</div></div>'
      +'<div class="kw-ser" data-r="ser">'+FLAME+'<div>Serie <b data-r="cur">'+ser.cur+'</b> Tage<br>Beste <b data-r="best">'+ser.best+'</b></div></div></div></div>'
      +'<div class="pz-card"><div class="kw-gridw" style="--c:'+P.C+'"><div class="kw-grid" style="--c:'+P.C+'" role="group" aria-label="Kreuzworträtsel, '+P.R+' Zeilen, '+P.C+' Spalten">'+g+'</div></div>'
      +'<div class="kw-cur" data-r="cur" aria-live="polite"></div>'
      +'<div class="pz-fb kw-msg" data-r="msg" aria-live="polite"></div></div>'
      +'<div data-r="play"><div class="kw-keys" data-r="keys">'+keys+'</div>'
      +'<div class="kw-act" style="margin-top:10px"><button type="button" class="pz-pri" data-a="check">Prüfen</button><button type="button" class="pz-sec2" data-a="reveal">Auflösen</button><button type="button" class="pz-sec2" data-a="clear">Leeren</button></div></div>'
      +'<div data-r="res"></div>'
      +'<div class="pz-card kw-lists"><div><h4>Waagerecht</h4>'+lst(0)+'</div><div><h4>Senkrecht</h4>'+lst(1)+'</div></div>'
      +'</div>';
  }

  function paint(){
    if(!el||!P) return;
    const aw=activeWord(), inA=aw?cellsOf(aw):[], play=mode==='play';
    for(let k=0;k<cellEls.length;k++){
      const c=cellEls[k]; if(!c) continue;
      let cls='kw-cell'; if(c._pop) cls+=' pop';
      if(play&&k===selK) cls+=' sel'; else if(play&&inA.indexOf(k)>=0) cls+=' wd';
      if(bad[k]) cls+=' bad'; if(mode==='won') cls+=' ok'; if(mode==='rev') cls+=' rv';
      if(c._w) cls+=' wv';
      if(c.className!==cls) c.className=cls;
      const L=entries[k]||'';
      if(c._l!==L){ c._l=L; c.lastChild.textContent=L; }
      const r=Math.floor(k/P.C)+1, cc=k%P.C+1, lab='Zeile '+r+', Spalte '+cc+(L?', Buchstabe '+L:', leer')+(bad[k]?', falsch':'');
      if(c._a!==lab){ c._a=lab; c.setAttribute('aria-label',lab); }
      c.tabIndex=(k===selK&&play)?0:-1;
      c.disabled=false;
    }
    P.words.forEach((w,i)=>{
      const b=clEls[i]; if(!b) return;
      const done=cellsOf(w).every(k=>entries[k]);
      const cls='kw-cl'+(done?' dn':'')+(aw===w&&play?' on':'');
      if(b.className!==cls) b.className=cls;
    });
    if(aw&&play){ refs.cur.innerHTML='<small>'+aw.num+' '+(aw.dir?'senkrecht':'waagerecht')+', '+aw.len+' Buchstaben</small><span>'+esc(aw.h)+'</span>'; }
    else refs.cur.innerHTML='';
    refs.play.hidden=!play;
    refs.cur.hidden=!play;
  }

  function msg(t,cls){ refs.msg.className='pz-fb kw-msg'+(cls?' '+cls:''); refs.msg.innerHTML=t; }

  function select(k,fromKey){
    if(mode!=='play'||!P.cells[k]) return;
    if(k===selK){ if(cw[1-dir][k]>=0) dir=1-dir; }
    else { selK=k; if(cw[dir][k]<0) dir=1-dir; }
    paint();
    if(fromKey&&cellEls[k]) try{ cellEls[k].focus({preventScroll:true}); }catch(e){}
  }
  function selectWord(i){
    if(mode!=='play') return; const w=P.words[i]; dir=w.dir;
    const ks=cellsOf(w), k=ks.find(x=>!entries[x]);
    selK=k===undefined?ks[0]:k; paint();
  }
  function advance(step){
    const w=activeWord(); if(!w) return;
    const i=dir?Math.floor(selK/P.C)-w.r:selK%P.C-w.c, ni=i+step;
    if(ni>=0&&ni<w.len) selK=(w.r+(dir?ni:0))*P.C+w.c+(dir?0:ni);
  }
  function arrow(dr,dc){
    const axis=dr?1:0;
    if(axis!==dir&&cw[axis][selK]>=0){ dir=axis; paint(); return; }
    let r=Math.floor(selK/P.C)+dr, c=selK%P.C+dc;
    while(r>=0&&c>=0&&r<P.R&&c<P.C){
      const k=r*P.C+c;
      if(P.cells[k]){ selK=k; if(cw[axis][k]>=0) dir=axis; else dir=1-axis; paint(); return; }
      r+=dr; c+=dc;
    }
  }
  function typeCh(ch){
    if(mode!=='play') return;
    entries[selK]=ch; bad[selK]=false;
    const c=cellEls[selK]; if(c&&!reduced()){ c._pop=true; later(()=>{ c._pop=false; if(c.isConnected) c.classList.remove('pop'); },200); }
    advance(1); refs.msg.innerHTML=''; refs.msg.className='pz-fb kw-msg';
    saveState(); paint();
    afterInput();
  }
  function backspace(){
    if(mode!=='play') return;
    if(entries[selK]){ entries[selK]=''; bad[selK]=false; }
    else { advance(-1); entries[selK]=''; bad[selK]=false; }
    saveState(); paint();
  }
  function afterInput(){
    const letters=P.cells.map((ch,k)=>ch?k:-1).filter(k=>k>=0);
    if(letters.some(k=>!entries[k])) return;
    if(letters.every(k=>entries[k]===P.cells[k])) { win(); return; }
    msg('Alle Felder sind gefüllt, aber nicht alles stimmt. Tippe auf <b>Prüfen</b>.','');
    say('Alle Felder gefüllt, aber nicht alles stimmt.');
  }

  function check(){
    if(mode!=='play') return;
    let wrong=0, open=0;
    P.cells.forEach((ch,k)=>{ if(!ch) return; if(!entries[k]) open++; else if(entries[k]!==ch){ bad[k]=true; wrong++; } });
    paint();
    if(wrong){ msg('<b>'+wrong+(wrong===1?' Feld ist':' Felder sind')+' falsch</b> und rot markiert.'+(open?' Noch '+open+' offen.':''),'r'); say(wrong+(wrong===1?' Feld ist falsch.':' Felder sind falsch.')); }
    else { msg('<b>Bisher alles richtig.</b> '+(open?'Noch '+open+' Felder offen.':''),'g'); say('Bisher alles richtig. Noch '+open+' Felder offen.'); }
  }
  function reveal(){
    if(mode!=='play') return;
    entries=P.cells.slice(); bad=[]; mode='rev'; saveState();
    renderResult(); paint(); say('Rätsel aufgelöst. Diese Tagesaufgabe zählt nicht für die Serie.');
  }
  function clear(){
    if(mode!=='play') return;
    entries=P.cells.map(()=> ''); bad=[]; saveState(); refs.msg.innerHTML=''; refs.msg.className='pz-fb kw-msg'; paint();
  }

  function win(){
    mode='won'; bad=[]; entries=P.cells.slice(); saveState();
    const old=lget(SKEY,{}), oldBest=+((lget(BKEY,{}).kreuzwort)||0);
    const n=(old.last===yesterday(date))?(+old.n||0)+1:(old.last===date?(+old.n||1):1);
    lset(SKEY,{n:n,last:date}); if(typeof PAUSE!=='undefined') PAUSE.addScore('kreuzwort',n);
    const rec=n>oldBest; if(rec){ const b=lget(BKEY,{}); b.kreuzwort=n; lset(BKEY,b); }
    refs.cur.textContent=''; renderResult(rec,oldBest);
    if(typeof GAME!=='undefined') GAME.cheer('spiel','Kreuzworträtsel',rec&&oldBest>0?'Serie '+n+' Tage':'');
    say('Rätsel gelöst. Serie: '+n+(n===1?' Tag.':' Tage.'));
    paint();
    if(!reduced()){
      cellEls.forEach((c,k)=>{ if(!c) return; c._w=true; c.style.animationDelay=((Math.floor(k/P.C)+k%P.C)*35)+'ms'; });
      paint(); later(()=>{ cellEls.forEach(c=>{ if(c){ c._w=false; c.style.animationDelay=''; } }); paint(); },1400);
    }
  }
  function renderResult(rec,oldBest){
    const s=streakInfo(date); refs.cur_n.textContent=s.cur; refs.best_n.textContent=s.best;
    if(mode==='won'){
      refs.res.innerHTML='<div class="pz-card kw-res">'+FLAME+'<div class="pz-big-n">Gelöst</div>'
        +'<div class="pz-center"><b>Serie: '+s.cur+(s.cur===1?' Tag':' Tage')+' in Folge</b>'+(s.best>s.cur?' · Beste Serie: '+s.best+' Tage':'')+'</div>'
        +(rec&&oldBest>0?'<div class="pz-fb g"><b>Neuer Rekord bei der Serie.</b></div>':'')
        +'<div class="pz-center">Das nächste Rätsel gibt es morgen.</div></div>';
    } else {
      refs.res.innerHTML='<div class="pz-card kw-res"><div class="pz-big-n" style="color:var(--m-fg)">Aufgelöst</div>'
        +'<div class="pz-center">Diese Tagesaufgabe zählt nicht für die Serie. Das nächste Rätsel gibt es morgen.</div></div>';
    }
  }

  function onKey(e){
    if(!el||!el.isConnected){ stop(); return; }
    if(mode!=='play'||e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented) return;
    const t=e.target, tag=t&&t.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable)) return;
    if(!el.getClientRects().length) return;
    const k=e.key, inGrid=!!(t&&t.closest&&t.closest('.kw-gridw')), free=(!t||t===document.body||t===document.documentElement||inGrid);
    if(k.length===1&&/^[a-zäöüA-ZÄÖÜ]$/.test(k)){ typeCh(k.toUpperCase()); e.preventDefault(); return; }
    if(k==='Backspace'){ if(tag==='BUTTON'&&!inGrid&&!(t.closest&&t.closest('.kw-keys'))) return; backspace(); e.preventDefault(); return; }
    if(k==='Delete'&&free){ entries[selK]=''; bad[selK]=false; saveState(); paint(); e.preventDefault(); return; }
    if(!free) return;
    const A={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};
    if(A[k]){ arrow(A[k][0],A[k][1]); if(cellEls[selK]) try{ cellEls[selK].focus({preventScroll:true}); }catch(x){} e.preventDefault(); return; }
    if(k===' '||k==='Enter'){ if(cw[1-dir][selK]>=0){ dir=1-dir; paint(); } e.preventDefault(); return; }
  }

  function start(host){
    stop(); injectCss(); el=host; date=today();
    P=build(date);
    if(!P){ el.innerHTML='<div class="pz-card"><div class="pz-fb r"><b>Das Tagesrätsel konnte nicht erzeugt werden.</b> Bitte lade die Seite neu.</div></div>'; return; }
    entries=P.cells.map(()=> ''); bad=[]; mode='play'; cw=[new Array(P.R*P.C).fill(-1),new Array(P.R*P.C).fill(-1)];
    P.words.forEach((w,i)=>{ cellsOf(w).forEach(k=>{ cw[w.dir][k]=i; }); });
    loadState(); pruneOld();
    const w0=P.words[0]; dir=w0.dir; selK=w0.r*P.C+w0.c;
    el.innerHTML=html();
    refs={play:el.querySelector('[data-r=play]'),res:el.querySelector('[data-r=res]'),cur:el.querySelector('.kw-cur'),msg:el.querySelector('.kw-msg'),cur_n:el.querySelector('b[data-r=cur]'),best_n:el.querySelector('b[data-r=best]')};
    cellEls=[]; el.querySelectorAll('.kw-cell').forEach(c=>{ cellEls[+c.dataset.k]=c; });
    clEls=[]; el.querySelectorAll('.kw-cl').forEach(b=>{ clEls[+b.dataset.w]=b; });
    el.querySelector('.kw-grid').addEventListener('click',e=>{ const c=e.target.closest('.kw-cell'); if(c) select(+c.dataset.k,false); });
    el.querySelectorAll('.kw-lists').forEach(l=>l.addEventListener('click',e=>{ const b=e.target.closest('.kw-cl'); if(b) selectWord(+b.dataset.w); }));
    const kb=el.querySelector('.kw-keys');
    kb.addEventListener('mousedown',e=>e.preventDefault());
    kb.addEventListener('click',e=>{ const b=e.target.closest('.kw-key'); if(!b) return; if(b.dataset.bk) backspace(); else typeCh(b.dataset.ch); });
    const confirmBtn=(b,label,fn)=>{ let t=null; b.addEventListener('click',()=>{ if(t){ clearTimeout(t); timers=timers.filter(x=>x!==t); t=null; b.textContent=b._t; fn(); return; } b._t=b.textContent; b.textContent=label; t=later(()=>{ t=null; b.textContent=b._t; },3500); }); };
    el.querySelector('[data-a=check]').addEventListener('click',check);
    confirmBtn(el.querySelector('[data-a=reveal]'),'Wirklich auflösen?',reveal);
    confirmBtn(el.querySelector('[data-a=clear]'),'Wirklich leeren?',clear);
    document.addEventListener('keydown',onKey); boundDoc=true;
    if(mode!=='play'){ renderResult(false,0); }
    paint();
  }
  function stop(){
    if(boundDoc){ document.removeEventListener('keydown',onKey); boundDoc=false; }
    timers.forEach(clearTimeout); timers=[];
    el=null; P=null; cellEls=[]; clEls=[]; refs={};
  }

  return { start, stop, puzzle:build, verify };
})();
