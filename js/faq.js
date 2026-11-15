/* ======================================================================
   FAQ – Fragen und Antworten zu den Standorten (Unterkunft, Essen, Sport, Anreise …)
   Die Fragen sind für alle Standorte gleich, die Antworten stehen je Standort in ANS (Schlüssel ibk, vak, feuak, idf, bruchsal).
   Stand der Angaben: Zusammenfassung B VI V3.11, Kapitel 13 (Organisatorisches zu den Ausbildungsorten).
   Fragen ohne Antwort werden nicht angezeigt. Ein Jahrgang kann Antworten ändern und eigene Fragen ergänzen:
   jahrgaenge/<ID>.json → "faq": { "idf": [ { "id":"kuehl", "a":"…" }, { "c":"Sonstiges", "q":"Frage?", "a":"Antwort" } ] }
   ====================================================================== */
const FAQ=(function(){
  const CATS=['Unterkunft','Verpflegung','Sport und Freizeit','Anreise und Parken','Kleidung und Ausstattung','Organisation'];
  // [id, Kategorie (Index in CATS), Frage]
  const QS=[
    ['wohnen',0,'Wo wohnt man?'],['zimmer',0,'Wie sind die Zimmer?'],['kuehl',0,'Gibt es einen Kühlschrank?'],['technik',0,'Gibt es WLAN, Fernseher und einen Schreibtisch?'],
    ['handtuch',0,'Muss man Handtücher und Bettwäsche mitbringen?'],['pflege',0,'Gibt es Seife und Shampoo?'],['waesche',0,'Kann man Wäsche waschen?'],['schluessel',0,'Wie funktioniert der Zimmerschlüssel?'],
    ['essen',1,'Wo isst man und was kostet es?'],['zeiten',1,'Gibt es Frühstück und Abendessen, und wann?'],['getraenke',1,'Gibt es Getränke?'],['kost',1,'Gibt es vegetarische oder besondere Kost?'],['selbst',1,'Kann man sich selbst versorgen?'],['tipps',1,'Gibt es Essenstipps in der Umgebung?'],
    ['sport',2,'Wie sind die Sportmöglichkeiten?'],['sportsachen',2,'Was muss man zum Sport mitbringen?'],['laufen',2,'Gibt es Laufstrecken in der Nähe?'],['abend',2,'Was kann man abends machen?'],
    ['parken',3,'Gibt es Parkplätze und was kosten sie?'],['oepnv',3,'Wie kommt man mit Bahn oder Bus hin?'],['zeit',3,'Wann reist man an und wieder ab?'],['melden',3,'Wo meldet man sich bei der Ankunft?'],['wege',3,'Wie kommt man zur Schule oder Akademie?'],['fahrrad',3,'Gibt es Fahrradstellplätze oder Leihräder?'],
    ['kleidung',4,'Welche Kleidung wird erwartet?'],['schutz',4,'Braucht man Schutz- oder Einsatzkleidung?'],['arbeit',4,'Was braucht man zum Arbeiten (Schreibzeug, Strom, Netz)?'],['heizung',4,'Wie ist die Heizung, und was sollte man gegen Kälte mitnehmen?'],
    ['kontakt',5,'Wer ist Ansprechperson vor Ort?'],['haus',5,'Welche Hausregeln gibt es (Ruhezeiten, Rauchen, Alkohol)?'],['geld',5,'Kann man bar oder mit Karte zahlen?'],['arzt',5,'Gibt es Arzt, Apotheke und Supermarkt in der Nähe?'],['tag',5,'Wie sieht der Tagesablauf aus?'],['orga',5,'Wie ist der Lehrgang vor Ort organisiert?'],['pruefung',5,'Wie läuft die Laufbahnprüfung vor Ort ab?'],['sonst',5,'Was sollte man sonst vor der Anreise wissen?']
  ];
  const NAME={ibk:'IBK Heyrothsberge',vak:'VAk Berlin',feuak:'FeuAK Hamburg',idf:'IdF Münster',bruchsal:'LFS Bruchsal'};
  const ANS={
    idf:{
      wohnen:'In der Feuerwehrschule. Der Zimmerschlüssel ist beim Pförtner hinterlegt, die Pforte ist rund um die Uhr besetzt.',
      zimmer:'Einzelzimmer mit 90-cm-Matratze und eigener Nasszelle. Es sind die kleinsten Zimmer der ganzen Ausbildung. 2025 waren die Zimmer teils im Neubau, teils im Altbau. Das IdF befindet sich in einem großen Umbauprozess, die Unterbringungsqualität kann sich bis zu weiteren Lehrgängen ändern.',
      kuehl:'Ja, ein Kühlschrank steht auf dem Flur.',
      technik:'Ja, WLAN, Fernseher und Schreibtisch sind vorhanden.',
      handtuch:'Nein, Handtücher und Bettwäsche muss man nicht mitbringen.',
      pflege:'Ja, Seife und Shampoo gibt es.',
      schluessel:'Der Zimmerschlüssel ist ein Chip. Er muss einmal wöchentlich aufgeladen werden; darauf wird nicht immer hingewiesen (2025 nur sporadisch). Im Gebäude B, wo auch die Kantine ist, gibt es ausreichend Stellen, an denen man den Schlüssel wieder aktivieren kann.',
      essen:'In der Mensa im Gebäude A3. Die Kosten sind im Lehrgang inbegriffen. Mahlzeiten gibt es von Montag bis Freitagmittag. Für das Frühstück am Montag und das Mittagessen am Freitag müssen die Teilnehmerzahlen bis zur Mitte der Vorwoche der Küche gemeldet werden.',
      zeiten:'Frühstück von 6:30 bis 7:45 Uhr, Abendessen von 17:00 bis 19:00 Uhr (Essenausgabe bis 18:30 Uhr). Der Speiseraum ist von 8:30 bis 9:00 Uhr und von 11:30 bis 12:00 Uhr geschlossen. Frühstück und Abendessen sind ein Buffet: Je später man kommt, desto spärlicher wird die Auswahl. Mittags sind den beiden Gruppen feste Zeitfenster vorgegeben, auf deren Einhaltung die Dozierenden achten sollten.',
      getraenke:'Wasserspender und Heißgetränke im Speiseraum stehen zur freien Verfügung.',
      tag:'Frühstück 6:30–7:45 Uhr, Unterricht 7:45–15:30 Uhr, EVA (eigenverantwortliches Arbeiten) 15:30–17:30 Uhr, Abendessen 17:00–19:00 Uhr. Die EVA wird nicht so ernst genommen.',
      orga:'Wegen der großen Lehrgangsgröße gibt es zwei Gruppen. Die erste Gruppe macht drei Wochen „Vorbeugender Brandschutz“, die zweite zwei Wochen „Stabsarbeit“ und eine Woche „Presse- und Öffentlichkeitsarbeit“, danach wird getauscht. Es folgt die gemeinsame dritte Stabswoche, in der auch der Leistungsnachweis für Modul 3.5 geschrieben wird. Danach geht der ganze Lehrgang für eine Woche an die BABZ nach Ahrweiler (Europäischer Katastrophenschutz-Mechanismus). In der letzten Woche des Moduls 3.5 ist man wieder in Münster.',
      pruefung:'In der letzten Woche des Moduls 3.5 werden in Münster die beiden schriftlichen Laufbahnklausuren an zwei aufeinanderfolgenden Tagen geschrieben, jeweils vier Stunden. Am Folgetag gibt es eine Abschlussveranstaltung. Die mündliche Laufbahnprüfung findet ebenfalls am IdF statt: Eine Anreise am Vortag ist möglich, die Unterbringung erfolgt am IdF. Pro Prüfungstag werden sechs Prüflinge in zwei Dreiergruppen geprüft. Die Prüfung hat drei Teile; dazwischen können längere Wartezeiten entstehen, die man frei in einem „Quarantäneraum“ gestaltet. Die Mittagspause verbringt man gemeinsam mit den Prüfern in der Kantine des IdF.',
      selbst:'Die Stadt ist zu Fuß erreichbar. Weitere Angaben zur Selbstversorgung werden noch ergänzt.',
      sport:'Am IdF gibt es gute Sportmöglichkeiten: einen Kraft- und Ausdauerraum, in dem man jederzeit trainieren kann, und eine Sporthalle (2025 wegen eines Wasserschadens eine Baustelle) mit eingeschränkten Nutzungszeiten: Montag und Mittwoch 17:30–19:00 Uhr Betriebssportgemeinschaft BezReg Münster, Dienstag 16:30–18:00 Uhr Betriebssport für IdF-Bedienstete, Donnerstag 16:30–18:00 Uhr Sportkurse für Teilnehmende. Die Kurse leitet ein Trainerteam; die Anmeldung läuft über Listen an der zentralen Anmeldestelle. Bei den anderen Gruppen kann man einfach fragen, ob man mitmachen darf.',
      sportsachen:'Sportschuhe.',
      laufen:'Ja, am Kanal.',
      abend:'Die Stadt ist in der Nähe, außerdem gibt es einen Aufenthaltsraum.',
      parken:'Ja, auf dem Gelände des IdF. Das Parken ist kostenlos. Montagmorgens kann das Parkplatzangebot etwas begrenzter sein.',
      fahrrad:'Ja, Fahrradstellplätze sind mehr als ausreichend vorhanden.',
      oepnv:'Eine Haltestelle ist in der Nähe.',
      zeit:'Anreise am Sonntag vor Unterrichtsbeginn ist problemlos möglich, auch spät, denn die Pforte ist rund um die Uhr besetzt. Die Information dazu steht in der Einberufung, die einige Wochen vorher von der Koordinierungsstelle verschickt wird. Abreise nach der Abschlussveranstaltung am Tag nach der zweiten Klausur.',
      melden:'Beim Pförtner (dort liegt der Schlüssel). Am ersten Tag muss man sich zusätzlich bis zu einer angegebenen Uhrzeit im Lehrgangsbüro anmelden.',
      kleidung:'Hemd, Krawatte, Polo, Regenjacke von der Dienststelle und zivile Kleidung.',
      schutz:'Nein.',
      arbeit:'Schreibzeug bringt man selbst mit, es wird nicht gestellt. Strom und Netz sind in den Lehrräumen verfügbar.',
      waesche:'Auf dem Gelände gibt es keine Waschmöglichkeit. Ausreichend Waschsalons sind wenige Autominuten entfernt.',
      heizung:'Die Heizung funktioniert gut. Schlappen oder Hausschuhe sind von Vorteil.',
      arzt:'Alles ist in etwa 10 Minuten zu Fuß erreichbar.'
    },
    ibk:{
      wohnen:'Auf dem Gelände des IBK in Einzelzimmern (Gästehäuser). Im April 2026 war der Lehrgang stattdessen im Achat Hotel Magdeburg, Hansapark 2, 39116 Magdeburg, untergebracht; dort werden die Zimmer an der Rezeption vergeben.',
      zimmer:'Auf dem Gelände: Einzelzimmer, teils mit eigener Nasszelle. Einige Personen teilen sich im Gästehaus 2 ein Badezimmer, das über einen Flur verbunden ist. Im Achat Hotel (April 2026): Doppelzimmer mit eigenem Bad.',
      kuehl:'Nein.',
      technik:'Ja, alles ist vorhanden.',
      handtuch:'Nein, Handtücher und Bettwäsche muss man nicht mitbringen.',
      pflege:'Ja, Seife und Shampoo gibt es.',
      waesche:'Ja: Am IBK steht eine Waschmaschine zur Verfügung. Wie man Zugang bekommt, klärt man zu Beginn des Lehrgangs mit der Lehrgangsleitung. Im Hotel gibt es einen Wäscheservice, der aber sehr teuer ist.',
      schluessel:'Im Hotel eine Zimmerkarte. Ein Ersatz kostet nichts, die andere Karte wird dann aber deaktiviert.',
      essen:'Verpflegung gibt es am IBK von Montagmorgen bis Freitagmittag. Im Achat Hotel (April 2026) gibt es das Frühstück im Hotel, es ist sehr gut; Mittag- und Abendessen gibt es im IBK.',
      zeiten:'Die Uhrzeiten teilt das IBK direkt vor dem Lehrgang mit. Das Abendessen gibt es eine Stunde nach Ende des Unterrichts. Für die Mahlzeiten am Montagmorgen und am Freitagmittag muss der Lehrgangssprecher oder die Lehrgangssprecherin die Teilnehmenden bei der Küche anmelden.',
      kost:'Ja, man muss sich vorher anmelden. Zöliakie wird beachtet.',
      selbst:'Ein Supermarkt ist in der Nähe.',
      sport:'In den Gästehäusern gibt es kleine Sporträume mit einfacher Ausstattung (Rudergerät, Fahrrad, Laufband, wenige Gewichte). Im Achat Hotel ist der Sportraum schlecht, ein Fitnessstudio ist aber in der Nähe. Außerdem gibt es dort ein sehr kleines Schwimmbad und eine Sauna.',
      sportsachen:'Badekleidung und Schlappen.',
      laufen:'Ja.',
      abend:'Im Hotel gibt es einen Aufenthaltsraum in der obersten Etage.',
      parken:'Rund um das Hotel kostenlos, aber begrenzt. Die Parkplätze des Hotels kosten etwas.',
      fahrrad:'Im Gästehaus 2 gibt es einen Fahrradkeller. Den Schlüssel gibt es an der Pforte. Es gibt nicht für jeden Teilnehmenden einen Schlüssel; das stimmt der Lehrgang untereinander ab.',
      oepnv:'Eine Bahnstation ist in der Nähe.',
      zeit:'Anreise am Sonntagabend vor Lehrgangsbeginn ist problemlos möglich. Das IBK fragt das bei der Kontaktaufnahme mit dem Lehrgang ab, man muss sich nur anmelden. Auschecken am Morgen des letzten Lehrgangstages.',
      melden:'Auf dem Gelände zunächst an der Pforte, die rund um die Uhr besetzt ist; ist der Pförtner auf seiner Runde, hängt dort eine Telefonnummer zum Anrufen. Am Montagmorgen meldet man sich zusätzlich im Lehrgangsbüro an. Im Hotel an der Rezeption.',
      kleidung:'Zivil.',
      schutz:'Für einen Praxistag wird PSA benötigt.',
      arbeit:'Strom und Netz gibt es im Raum.',
      heizung:'Die Heizung war gut.',
      arzt:'Ja, alles ist in der Nähe.'
    },
    vak:{
      wohnen:'Im Hotel Ameron am Spreebogen (2025 und 2026). Die Lage ist sehr zentral, das Hotel hat einen guten Vier-Sterne-Standard.',
      zimmer:'Große Einzelzimmer (Doppelzimmer) mit eigenem Bad. Die Reinigung erfolgt nicht täglich, sondern zweimal in der Woche; die Bettwäsche wird einmal wöchentlich gewechselt (samstags). Familienmitglieder können gegen einen kleinen Aufpreis mit untergebracht werden (2025: 5 Euro, mit Frühstück 20 Euro). Wer am Wochenende nach Hause fährt, kann einfach Zimmernummern tauschen.',
      kuehl:'Nein, einen Kühlschrank gab es nicht.',
      technik:'Ja, alles ist vorhanden.',
      handtuch:'Nein, Handtücher und Bettwäsche muss man nicht mitbringen.',
      pflege:'Ja, Seife und Shampoo gibt es.',
      waesche:'Waschmöglichkeiten gibt es grundsätzlich nicht. Man kann den Wäscheservice des Hotels nutzen, der aber teuer ist.',
      schluessel:'Der Schlüssel ist eine Zimmerkarte.',
      essen:'Das Frühstück im Hotel nach Hotelstandard ist sehr gut. Mittag- und Abendessen gibt es nicht über die VAk oder das Hotel, man organisiert es selbst. In direkter Nachbarschaft zur VAk gibt es eine öffentliche Kantine, in der man relativ günstig zu Mittag essen kann.',
      selbst:'Ein Supermarkt ist in der Nähe, im Umkreis gibt es ausreichend Supermärkte und gute Dönerläden. Tipp: Butterbrottüten mitbringen und sich beim Frühstück Brötchen zum Mitnehmen schmieren.',
      tipps:'Empfehlungen des Jahrgangs BRef 2024/2 und AB 2025/2: Falafel Humbaba (Turmstr. 85), Bäckerei Domberger (Essener Str. 11), Ristorante Da Ponte (Helgoländer Ufer 7), Irish Pub The Lir (Flensburger Str. 7), Pizza Teigmeister (Levetzowstr. 10), Pizza Sapori di Casa (Wilsnacker Str. 61–62), Quê Choa (Alt-Moabit 96D, auch Cocktails), Wilhelms Burger (Stromstr. 10B), Biergarten und Restaurant Zollpackhof (Elisabeth-Abegg-Str. 1).',
      sport:'Die VAk hat keinen Sportraum. Das Hotel hat einen einfachen Sportraum mit ein paar Ausdauer- und Kraftgeräten sowie eine Sauna. In direkter Nähe liegt das McFit Moabit.',
      sportsachen:'Kleidung für die Sauna gibt es an der Rezeption.',
      laufen:'Ja.',
      abend:'Es gibt keinen klassischen Aufenthaltsraum. Auch die Quelle bietet sich als angenehmer Aufenthaltsort an.',
      parken:'Es gibt eine öffentliche Garage, die 20 Euro pro Tag kostet. Wegen der günstigen Verkehrsanbindung bietet sich die Anreise mit der Bahn an.',
      wege:'Die VAk ist vom Hotel zu Fuß in etwa 10 Minuten erreichbar.',
      oepnv:'Sehr gut möglich: Vom Hauptbahnhof mit der S-Bahn bis zum S-Bahnhof Bellevue (mehrere Linien fahren dorthin). Von Bellevue ist das Hotel zu Fuß in weniger als fünf Minuten erreichbar.',
      zeit:'Die Anreise am Vorabend ist problemlos möglich. Anreise am Sonntag vor dem ersten Lehrgangstag, Abreise direkt am letzten Lehrgangstag. Achtung: Über das Wochenende dazwischen ist man nicht untergebracht.',
      melden:'An der Rezeption.',
      kleidung:'Zivil, Uniform wird nicht benötigt.',
      schutz:'Nein.',
      arbeit:'Schreibzeug bekommt man gestellt.',
      orga:'Der Unterricht findet gemeinsam mit dem gesamten Lehrgang statt, manchmal in Teilgruppen. Für den Kaffee (inklusive Keksen) stellt die VAk das Material; zwei oder drei Leute erklären sich bereit, vor Lehrgangsbeginn den Kaffee zu kochen.',
      heizung:'Die Heizung ist in Ordnung.',
      arzt:'Ja, alles ist zu Fuß erreichbar.'
    },
    feuak:{
      wohnen:'2025 und im Frühjahr 2026 im Holiday Inn am Berliner Tor. Im August 2026 im Hotel Panorama Billstedt. Das ist nicht das Hotel Panorama Inn, das gegenüber liegt.',
      zimmer:'Doppelzimmer mit eigenem Bad. Beide Hotels haben einen guten Standard. Das Hotel Panorama Billstedt liegt an einer Hauptverkehrsstraße, Ohropax sind empfehlenswert.',
      kuehl:'Ja, es gab einen Kühlschrank.',
      technik:'Ja, alles ist vorhanden. Im Hotel Panorama Billstedt gibt es Arbeitsplätze im Zimmer, im Holiday Inn im Foyer.',
      handtuch:'Nein, Handtücher und Bettwäsche muss man nicht mitbringen.',
      pflege:'Ja, Seife und Shampoo gibt es.',
      waesche:'Das Hotel bietet keinen Waschservice an. An der FeuAK kann man aber waschen.',
      schluessel:'Der Schlüssel ist eine Zimmerkarte.',
      essen:'Das Frühstück gibt es im Hotel (normales Frühstücksbuffet), das Mittagessen an der FeuAK. Für den Abend gibt die FeuAK „Dinner“-Pakete aus (belegtes Brötchen, süßer Snack, Müsliriegel o. Ä.). Sie zählen im Allgemeinen als Mahlzeit und sind damit auf die Trennungsentschädigung o. Ä. anrechenbar.',
      zeiten:'Frühstück als Buffet im Hotel, Mittagessen an der FeuAK, abends ein „Dinner“-Paket der FeuAK.',
      kost:'Vegetarisch und vegan ist möglich.',
      selbst:'Ein Supermarkt ist in der Nähe.',
      sport:'An der FeuAK kann man Sport machen, der Sportraum ist gut ausgestattet. Ein Fitnessstudio ist 5 Minuten zu Fuß entfernt.',
      laufen:'Ja.',
      abend:'Es gibt keinen klassischen Aufenthaltsraum. Die gemieteten Fahrzeuge stehen am Nachmittag für privat-dienstliche Veranstaltungen zur Verfügung, zum Beispiel die Besichtigung der Feuerlöschboote Hamburgs, der Kieler Woche oder der HanseSail. Die Nutzung ist abzusprechen.',
      parken:'Die Parkplätze am Hotel kosten etwas. Eine Anreise mit dem Zug wird grundsätzlich empfohlen, weil Parkplätze nur bedingt kostenfrei sind und man Hamburg mit S-Bahn, U-Bahn und Bus gut erkunden kann.',
      wege:'Die FeuAK stellt für den Weg zur Akademie gemietete Fahrzeuge (T6, V-Klasse o. Ä.) zur Verfügung, dazu gibt es eine Tankkarte der Feuerwehr Hamburg. Sie stehen ab dem zweiten Tag bereit, der Weg am ersten Tag muss anders organisiert werden. Man soll sie angemessen behandeln: Das ist ein großes Zugeständnis und eine Erleichterung für den Lehrgang.',
      oepnv:'Gut möglich. Das Holiday Inn am Berliner Tor erreicht man bequem mit Zug und S-Bahn und dann zu Fuß. Das Hotel Panorama Billstedt erreicht man gut über die U-Bahn-Station Billstedt oder mit dem Bus.',
      zeit:'Die Anreise am Vorabend ist unkompliziert möglich. Anreise am Sonntag vor dem ersten Lehrgangstag, Abreise am letzten Lehrgangstag. Achtung: Über das Wochenende dazwischen ist man nicht untergebracht.',
      melden:'An der Rezeption.',
      kleidung:'Hemd.',
      schutz:'Nein, Brandschutzkleidung wird nicht benötigt.',
      arbeit:'Schreibzeug bekommt man gestellt. Arbeitsplätze gibt es im Zimmer (Hotel Panorama Billstedt) oder im Foyer (Holiday Inn). Im Hotel Panorama Billstedt können auf Nachfrage an der Rezeption gelegentlich einzelne Meetingräume genutzt werden, aber keine Gruppenräume.',
      heizung:'Die Heizung ist in Ordnung.',
      arzt:'Ja, alles ist zu Fuß erreichbar.'
    },
    bruchsal:{
      wohnen:'In den Wohntürmen der Landesfeuerwehrschule Bruchsal, in Einzelzimmern mit eigener Nasszelle. Im Wohnturm gibt es zusätzlich einen Fernsehraum und einen Gemeinschaftsraum mit gut ausgestatteter Küche.',
      zimmer:'Einzelzimmer mit eigener Nasszelle.',
      kuehl:'Ja, im Gemeinschaftsraum des Wohnturms stehen zwei Kühlschränke.',
      waesche:'Waschmöglichkeiten gibt es nicht, und in Bruchsal selbst gibt es keine Waschsalons. Nach Absprache kann man eine eigene Waschmaschine in der Umkleide der Übungshalle anschließen. Sie muss nach dem Lehrgang wieder mitgenommen oder verkauft werden (Stand 2026).',
      schluessel:'Es gibt keine rund um die Uhr besetzte Pforte. Für die Anreise am Sonntag wird eine Schlüsselübergabe vereinbart. Wer zuerst eintrifft, nimmt die Schlüssel an sich und empfängt den restlichen Tag und Abend die übrigen Teilnehmenden.',
      essen:'Mahlzeiten gibt es von Montagmorgen bis Freitagmittag. Frühstück und Abendessen werden als Buffet serviert, mittags gibt es ein vegetarisches und ein Fleischgericht. Auf Wunsch kann man einmalig im Lehrgang das Abendessen gegen Grillfleisch tauschen und mit dem Lehrgang auf dem Grillplatz grillen. Das geht auch an der BABZ.',
      zeiten:'Frühstück und Abendessen sind ein Buffet: Je später man kommt, desto spärlicher wird die Auswahl. Dienstags und donnerstags gibt es abends zusätzlich warme Küche.',
      kost:'Für das vegetarische Mittagsgericht muss man sich am Vortag in eine Liste eintragen.',
      selbst:'Ja. Im Gemeinschaftsraum des Wohnturms gibt es eine gut ausgestattete Küche mit Herd, Backofen, zwei Kühlschränken, Spülmaschine und Kochutensilien.',
      sport:'An der LFS und an der BABZ gibt es jeweils einen Kraft- und einen Ausdauerraum. In Bruchsal ist zusätzlich fußläufig ein Fitnessstudio mit Monatstarifen erreichbar (Stand 2026: 25 Euro im Monat).',
      abend:'Im Wohnturm gibt es einen Fernsehraum und einen Gemeinschaftsraum mit Küche, außerdem einen Grillplatz.',
      parken:'Die Anreise mit dem Auto ist problemlos möglich. Ausreichend Stellplätze gibt es auf dem Langzeitparkplatz hinter den Wohntürmen, außerhalb des Übungsgeländes.',
      fahrrad:'Die LFS kann Fahrradboxen für normale und E-Bikes zur Verfügung stellen. Auf Wunsch können sogar zwei Mountainbikes bei der Schule ausgeliehen werden.',
      zeit:'Eine Anreise am Vorabend (Sonntag) ist problemlos möglich. Bei Bedarf meldet der Lehrgangssprecher sie zentral beim Lehrgangsleiter der LFS an und vereinbart die Schlüsselübergabe.',
      melden:'Der Lehrgangssprecher meldet die Vorabendanreise beim Lehrgangsleiter der LFS an. Eine besetzte Pforte gibt es nicht, die Schlüssel übernimmt der Erstankommende.',
      orga:'Wegen der großen Lehrgangsgröße gibt es zwei Gruppen. Die erste Gruppe macht drei Wochen „Vorbeugender Brandschutz“, die zweite zwei Wochen „Stabsarbeit“ und eine Woche „Presse- und Öffentlichkeitsarbeit“. Vor dem Tausch geht der ganze Lehrgang für eine Woche an die BABZ nach Ahrweiler (Europäischer Katastrophenschutz-Mechanismus und Zivilschutz). Am Ende der Blöcke VB und Stab wird jeweils ein Leistungsnachweis (Multiple Choice) geschrieben. Nach diesen sieben Wochen folgt eine gemeinsame Stabswoche.',
      pruefung:'In der letzten Woche des Moduls 3.5 werden die beiden schriftlichen Laufbahnklausuren an zwei aufeinanderfolgenden Tagen geschrieben, jeweils vier Stunden. Am Folgetag gibt es eine Abschlussveranstaltung.'
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
