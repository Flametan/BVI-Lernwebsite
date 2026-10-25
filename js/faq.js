/* ======================================================================
   FAQ – Fragen und Antworten zu den Standorten (Unterkunft, Essen, Sport, Anreise …)
   Die Fragen sind für alle Standorte gleich, die Antworten stehen je Standort in ANS (Schlüssel ibk, vak, feuak, idf).
   Fragen ohne Antwort werden nicht angezeigt. Ein Jahrgang kann Antworten ändern und eigene Fragen ergänzen:
   jahrgaenge/<ID>.json → "faq": { "idf": [ { "id":"kuehl", "a":"…" }, { "c":"Sonstiges", "q":"Frage?", "a":"Antwort" } ] }
   ====================================================================== */
const FAQ=(function(){
  const CATS=['Unterkunft','Verpflegung','Sport und Freizeit','Anreise und Parken','Kleidung und Ausstattung','Organisation'];
  // [id, Kategorie (Index in CATS), Frage]
  const QS=[
    ['wohnen',0,'Wo wohnt man?'],['zimmer',0,'Wie sind die Zimmer?'],['kuehl',0,'Gibt es einen Kühlschrank?'],['technik',0,'Gibt es WLAN, Fernseher und einen Schreibtisch?'],
    ['handtuch',0,'Muss man Handtücher und Bettwäsche mitbringen?'],['waesche',0,'Kann man Wäsche waschen?'],['schluessel',0,'Wie funktioniert der Zimmerschlüssel?'],
    ['essen',1,'Wo isst man und was kostet es?'],['zeiten',1,'Gibt es Frühstück und Abendessen, und wann?'],['kost',1,'Gibt es vegetarische oder besondere Kost?'],['selbst',1,'Kann man sich selbst versorgen?'],
    ['sport',2,'Wie sind die Sportmöglichkeiten?'],['sportsachen',2,'Was muss man zum Sport mitbringen?'],['laufen',2,'Gibt es Laufstrecken in der Nähe?'],['abend',2,'Was kann man abends machen?'],
    ['parken',3,'Gibt es Parkplätze und was kosten sie?'],['oepnv',3,'Wie kommt man mit Bahn oder Bus hin?'],['zeit',3,'Wann reist man an und wieder ab?'],['melden',3,'Wo meldet man sich bei der Ankunft?'],
    ['kleidung',4,'Welche Kleidung wird erwartet?'],['schutz',4,'Braucht man Schutz- oder Einsatzkleidung?'],['arbeit',4,'Was braucht man zum Arbeiten (Laptop, Schreibzeug, Strom, Netz)?'],['heizung',4,'Wie ist die Heizung, und was sollte man gegen Kälte mitnehmen?'],
    ['kontakt',5,'Wer ist Ansprechperson vor Ort?'],['haus',5,'Welche Hausregeln gibt es (Ruhezeiten, Rauchen, Alkohol)?'],['geld',5,'Kann man bar oder mit Karte zahlen?'],['arzt',5,'Gibt es Arzt, Apotheke und Supermarkt in der Nähe?'],['sonst',5,'Was sollte man sonst vor der Anreise wissen?']
  ];
  const NAME={ibk:'IBK Heyrothsberge',vak:'VAk Berlin',feuak:'FeuAK Hamburg',idf:'IdF Münster'};
  const ANS={
    idf:{
      wohnen:'In der Feuerwehrschule. Den Zimmerschlüssel gibt es an der Pforte.',
      zimmer:'Einzelzimmer mit 90-cm-Matratze. Es sind die kleinsten Zimmer der ganzen Ausbildung.',
      kuehl:'Ja, ein Kühlschrank steht auf dem Flur.',
      technik:'Ja, WLAN, Fernseher und Schreibtisch sind vorhanden.',
      handtuch:'Nein, Handtücher und Bettwäsche muss man nicht mitbringen.',
      schluessel:'Der Zimmerschlüssel ist ein Chip.',
      essen:'In der Mensa. Die Kosten sind im Lehrgang inbegriffen.',
      zeiten:'Ja, es gibt beides. Die genauen Zeiten werden noch ergänzt.',
      selbst:'Die Stadt ist zu Fuß erreichbar. Weitere Angaben zur Selbstversorgung werden noch ergänzt.',
      sport:'Es gibt einen Sportraum.',
      sportsachen:'Sportschuhe.',
      laufen:'Ja, am Kanal.',
      abend:'Die Stadt ist in der Nähe, außerdem gibt es einen Aufenthaltsraum.',
      parken:'Ja, auf dem Gelände des IdF. Das Parken ist kostenlos.',
      oepnv:'Eine Haltestelle ist in der Nähe.',
      zeit:'Anreise am Sonntag vor Unterrichtsbeginn, Abreise nach der letzten Klausur.',
      melden:'Beim Pförtner melden.',
      kleidung:'Hemd, Krawatte, Polo, Regenjacke von der Dienststelle und zivile Kleidung.',
      schutz:'Nein.',
      arbeit:'Laptop und Schreibzeug bekommt man gestellt. Angaben zu Strom und Netz werden noch ergänzt.',
      heizung:'Die Heizung funktioniert gut. Schlappen oder Hausschuhe sind von Vorteil.',
      arzt:'Alles ist in etwa 10 Minuten zu Fuß erreichbar.'
    },
    ibk:{}, vak:{}, feuak:{}
  };
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let want=false;   // Startseite → Stundenplan: Karte geöffnet anzeigen

  // Antworten des Standorts: Standard, darüber die Änderungen und eigenen Fragen des Jahrgangs
  function items(k){
    const base=ANS[k]||{}, extra=(typeof JG!=='undefined'&&JG.data().faq||{})[k]||[], ov={}, own=[];
    extra.forEach(e=>{ if(e.id&&QS.some(q=>q[0]===e.id)) ov[e.id]=e; else if(e.q) own.push(e); });
    const out=QS.map(q=>{ const o=ov[q[0]]; return {c:q[1],q:(o&&o.q)||q[2],a:(o&&o.a)||base[q[0]]||''}; }).filter(x=>x.a);
    own.forEach(e=>{ const i=CATS.indexOf(e.c); out.push({c:i>=0?i:5,q:e.q,a:e.a}); });
    return out;
  }
  const count=k=>items(k).length;

  // Karte für den Stundenplan (eingeklappt); leer, wenn der Standort unbekannt ist
  function card(k){
    if(!NAME[k]) return '';
    const it=items(k), open=want; want=false;
    let body;
    if(!it.length) body='<p class="faq-none">Für diesen Standort sind noch keine Angaben eingetragen.</p>';
    else body=CATS.map((c,ci)=>{
      const rows=it.filter(x=>x.c===ci); if(!rows.length) return '';
      return '<div class="faq-cat">'+esc(c)+'</div>'+rows.map(x=>'<details class="faq-q"><summary>'+esc(x.q)+'</summary><p>'+esc(x.a)+'</p></details>').join('');
    }).join('');
    return '<details class="m-card faq"'+(open?' open':'')+'><summary><span class="faq-t">Vor der Anreise: FAQ '+esc(NAME[k])+'</span><span class="m-t2">'+(it.length?it.length+' Fragen zu Unterkunft, Essen, Sport und Anreise':'Noch keine Angaben')+'</span></summary>'+body+'</details>';
  }
  return {card,count,items,NAME,QS,CATS,ANS,want:()=>{ want=true; }};
})();
