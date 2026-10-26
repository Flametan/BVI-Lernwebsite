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
    ['handtuch',0,'Muss man Handtücher und Bettwäsche mitbringen?'],['pflege',0,'Gibt es Seife und Shampoo?'],['waesche',0,'Kann man Wäsche waschen?'],['schluessel',0,'Wie funktioniert der Zimmerschlüssel?'],
    ['essen',1,'Wo isst man und was kostet es?'],['zeiten',1,'Gibt es Frühstück und Abendessen, und wann?'],['getraenke',1,'Gibt es Getränke?'],['kost',1,'Gibt es vegetarische oder besondere Kost?'],['selbst',1,'Kann man sich selbst versorgen?'],
    ['sport',2,'Wie sind die Sportmöglichkeiten?'],['sportsachen',2,'Was muss man zum Sport mitbringen?'],['laufen',2,'Gibt es Laufstrecken in der Nähe?'],['abend',2,'Was kann man abends machen?'],
    ['parken',3,'Gibt es Parkplätze und was kosten sie?'],['oepnv',3,'Wie kommt man mit Bahn oder Bus hin?'],['zeit',3,'Wann reist man an und wieder ab?'],['melden',3,'Wo meldet man sich bei der Ankunft?'],
    ['kleidung',4,'Welche Kleidung wird erwartet?'],['schutz',4,'Braucht man Schutz- oder Einsatzkleidung?'],['arbeit',4,'Was braucht man zum Arbeiten (Laptop, Schreibzeug, Strom, Netz)?'],['heizung',4,'Wie ist die Heizung, und was sollte man gegen Kälte mitnehmen?'],
    ['kontakt',5,'Wer ist Ansprechperson vor Ort?'],['haus',5,'Welche Hausregeln gibt es (Ruhezeiten, Rauchen, Alkohol)?'],['geld',5,'Kann man bar oder mit Karte zahlen?'],['arzt',5,'Gibt es Arzt, Apotheke und Supermarkt in der Nähe?'],['tag',5,'Wie sieht der Tagesablauf aus?'],['sonst',5,'Was sollte man sonst vor der Anreise wissen?']
  ];
  const NAME={ibk:'IBK Heyrothsberge',vak:'VAk Berlin',feuak:'FeuAK Hamburg',idf:'IdF Münster'};
  const ANS={
    idf:{
      wohnen:'In der Feuerwehrschule. Den Zimmerschlüssel gibt es an der Pforte.',
      zimmer:'Einzelzimmer mit 90-cm-Matratze. Es sind die kleinsten Zimmer der ganzen Ausbildung.',
      kuehl:'Ja, ein Kühlschrank steht auf dem Flur.',
      technik:'Ja, WLAN, Fernseher und Schreibtisch sind vorhanden.',
      handtuch:'Nein, Handtücher und Bettwäsche muss man nicht mitbringen.',
      pflege:'Ja, Seife und Shampoo gibt es.',
      schluessel:'Der Zimmerschlüssel ist ein Chip.',
      essen:'In der Mensa. Die Kosten sind im Lehrgang inbegriffen.',
      zeiten:'Frühstück von 6:30 bis 7:45 Uhr, Abendessen von 17:00 bis 19:00 Uhr (Essenausgabe bis 18:30 Uhr). Der Speiseraum ist von 8:30 bis 9:00 Uhr und von 11:30 bis 12:00 Uhr geschlossen.',
      getraenke:'Wasserspender und Heißgetränke im Speiseraum stehen zur freien Verfügung.',
      tag:'Frühstück 6:30–7:45 Uhr, Unterricht 7:45–15:30 Uhr, EVA (eigenverantwortliches Arbeiten) 15:30–17:30 Uhr, Abendessen 17:00–19:00 Uhr. Die EVA wird nicht so ernst genommen.',
      selbst:'Die Stadt ist zu Fuß erreichbar. Weitere Angaben zur Selbstversorgung werden noch ergänzt.',
      sport:'Es gibt einen Sportraum und eine Sporthalle mit eingeschränkten Nutzungszeiten: Montag und Mittwoch 17:30–19:00 Uhr Betriebssportgemeinschaft BezReg Münster, Dienstag 16:30–18:00 Uhr Betriebssport für IdF-Bedienstete, Donnerstag 16:30–18:00 Uhr Sportkurse für Teilnehmende. Bei den anderen Gruppen kann man einfach fragen, ob man mitmachen darf.',
      sportsachen:'Sportschuhe.',
      laufen:'Ja, am Kanal.',
      abend:'Die Stadt ist in der Nähe, außerdem gibt es einen Aufenthaltsraum.',
      parken:'Ja, auf dem Gelände des IdF. Das Parken ist kostenlos.',
      oepnv:'Eine Haltestelle ist in der Nähe.',
      zeit:'Anreise am Sonntag vor Unterrichtsbeginn, Abreise nach der letzten Klausur.',
      melden:'Beim Pförtner melden.',
      kleidung:'Hemd, Krawatte, Polo, Regenjacke von der Dienststelle und zivile Kleidung.',
      schutz:'Nein.',
      arbeit:'Laptop und Schreibzeug bringt man selbst mit, beides wird nicht gestellt. Strom und Netz sind in den Lehrräumen verfügbar.',
      waesche:'Auf dem Gelände gibt es keine Waschmöglichkeit. Ein Waschsalon ist in der Nähe.',
      heizung:'Die Heizung funktioniert gut. Schlappen oder Hausschuhe sind von Vorteil.',
      arzt:'Alles ist in etwa 10 Minuten zu Fuß erreichbar.'
    },
    ibk:{
      wohnen:'Im ACHAT Hotel Magdeburg. Die Zimmer werden an der Rezeption vergeben.',
      zimmer:'Doppelzimmer mit eigenem Bad.',
      kuehl:'Nein.',
      technik:'Ja, alles ist vorhanden.',
      handtuch:'Nein, Handtücher und Bettwäsche muss man nicht mitbringen.',
      pflege:'Ja, Seife und Shampoo gibt es.',
      waesche:'Ja, im Hotel ist es aber sehr teuer.',
      schluessel:'Der Schlüssel ist eine Zimmerkarte. Ein Ersatz kostet nichts, die andere Karte wird dann aber deaktiviert.',
      essen:'Das Frühstück gibt es im Hotel, Mittag- und Abendessen im IBK.',
      zeiten:'Die genauen Uhrzeiten sind nicht mehr bekannt. Das Abendessen gibt es eine Stunde nach Ende des Unterrichts.',
      kost:'Ja, man muss sich vorher anmelden. Zöliakie wird beachtet.',
      selbst:'Ein Supermarkt ist in der Nähe.',
      sport:'Der Sportraum ist schlecht, ein Fitnessstudio ist aber in der Nähe. Außerdem gibt es ein sehr kleines Schwimmbad und eine Sauna.',
      sportsachen:'Badekleidung und Schlappen.',
      laufen:'Ja.',
      abend:'Es gibt einen Aufenthaltsraum in der obersten Etage.',
      parken:'Rund um das Hotel kostenlos, aber begrenzt. Die Parkplätze des Hotels kosten etwas.',
      oepnv:'Eine Bahnstation ist in der Nähe.',
      zeit:'Anreise am Sonntag vor Unterrichtsbeginn, Auschecken am Morgen des letzten Lehrgangstages.',
      melden:'An der Rezeption.',
      kleidung:'Zivil.',
      schutz:'Für einen Praxistag wird PSA benötigt.',
      arbeit:'Den Laptop bringt man selbst mit, er wird nirgends gestellt. Strom und Netz gibt es im Raum.',
      heizung:'Die Heizung war gut.',
      arzt:'Ja, alles ist in der Nähe.'
    },
    vak:{
      wohnen:'Im ABION Spreebogen Waterside Hotel Berlin.',
      zimmer:'Doppelzimmer mit eigenem Bad.',
      kuehl:'Nein, einen Kühlschrank gab es nicht.',
      technik:'Ja, alles ist vorhanden.',
      handtuch:'Nein, Handtücher und Bettwäsche muss man nicht mitbringen.',
      pflege:'Ja, Seife und Shampoo gibt es.',
      waesche:'Ja, im Hotel, aber es ist teuer.',
      schluessel:'Der Schlüssel ist eine Zimmerkarte.',
      essen:'Das Frühstück gibt es im Hotel. Mittag- und Abendessen muss man selbst organisieren.',
      selbst:'Ein Supermarkt ist in der Nähe.',
      sport:'Es gibt Sporträume, sie sind aber sehr schlecht. Ein Fitnessstudio ist direkt in der Nähe, außerdem gibt es eine Sauna.',
      sportsachen:'Kleidung für die Sauna gibt es an der Rezeption.',
      laufen:'Ja.',
      abend:'Es gibt keinen klassischen Aufenthaltsraum.',
      parken:'Parkplätze am Hotel, sie kosten aber viel.',
      oepnv:'Sehr gut möglich.',
      zeit:'Anreise am Sonntag vor dem ersten Lehrgangstag, Abreise direkt am letzten Lehrgangstag. Achtung: Über das Wochenende dazwischen ist man nicht untergebracht.',
      melden:'An der Rezeption.',
      kleidung:'Zivil.',
      schutz:'Nein.',
      arbeit:'Den Laptop bringt man selbst mit, er wird nirgends gestellt. Schreibzeug bekommt man gestellt.',
      heizung:'Die Heizung ist in Ordnung.',
      arzt:'Ja, alles ist zu Fuß erreichbar.'
    },
    feuak:{
      wohnen:'Im Hotel Panorama Hamburg-Billstedt.',
      zimmer:'Doppelzimmer mit eigenem Bad.',
      kuehl:'Ja, es gab einen Kühlschrank.',
      technik:'Ja, alles ist vorhanden.',
      handtuch:'Nein, Handtücher und Bettwäsche muss man nicht mitbringen.',
      pflege:'Ja, Seife und Shampoo gibt es.',
      waesche:'Ja, im Hotel, aber es ist teuer. Man konnte auch an der FeuAK waschen.',
      schluessel:'Der Schlüssel ist eine Zimmerkarte.',
      essen:'Das Frühstück gibt es im Hotel, das Mittagessen an der FeuAK. Dort kann man auch ein Lunchpaket nehmen (Brötchen, Obst und Süßes).',
      kost:'Vegetarisch und vegan ist möglich.',
      selbst:'Ein Supermarkt ist in der Nähe.',
      sport:'Es gibt Sporträume, sie sind aber sehr schlecht. Ein Fitnessstudio ist 5 Minuten zu Fuß entfernt.',
      laufen:'Ja.',
      abend:'Es gibt keinen klassischen Aufenthaltsraum.',
      parken:'Parkplätze am Hotel, sie kosten aber etwas.',
      oepnv:'Gut möglich.',
      zeit:'Anreise am Sonntag vor dem ersten Lehrgangstag, Abreise am letzten Lehrgangstag. Achtung: Über das Wochenende dazwischen ist man nicht untergebracht.',
      melden:'An der Rezeption.',
      kleidung:'Hemd.',
      schutz:'Nein.',
      arbeit:'Den Laptop bringt man selbst mit, er wird nirgends gestellt. Schreibzeug bekommt man gestellt.',
      heizung:'Die Heizung ist in Ordnung.',
      arzt:'Ja, alles ist zu Fuß erreichbar.'
    }
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
