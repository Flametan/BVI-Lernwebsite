/* ===== Pressegespräch: Simulation. Regeln nur aus der Lernseite „Presse- & Öffentlichkeitsarbeit“ (IdF Münster). Lagen sind frei erfunden. ===== */
(function(){
'use strict';
const ROLES=[['lt','Leitung der Behörde','entscheidet, wer Auskünfte erteilt'],['buma','BuMA','im Krisenstab'],['s5','S5','Einsatzleitung'],['el','Einsatzleiter','vor Ort'],['ps','Pressesprecher','Feuerwehr']];
const RN={lt:'Leitung der Behörde',buma:'BuMA',s5:'S5',el:'Einsatzleiter',ps:'Pressesprecher'};
const OT_NOTE='Aufbau (Lernseite: einfache Sprache, nur das Wichtigste): erst die Lage, dann die größte Herausforderung, zuletzt, was jetzt zu tun ist.';
const BADWHY={zahl:'Zahlensalat vermeiden.',alles:'Auf die wichtigsten Punkte beschränken: nur auf die größte Herausforderung eingehen, nicht auf sämtliche Probleme.',buero:'Einfache Sprache nutzen, keine Bürokratensprache.'};
const KIND=['Lage','Herausforderung','Hinweis'];
const SC=[
{id:'brand',t:'Großbrand mit Verletzten',ic:'🔥',ks:false,
 lage:'In einer Lagerhalle brennt es. Mehrere Personen sind verletzt, der Einsatz läuft. Ein Kamerateam steht am Absperrband.',
 frage:'„Was ist passiert, wer ist schuld, wie heißen die Verletzten, und wann gibt es ein Statement?“',
 who:{q:'Das Team möchte einen authentischen O-Ton direkt von der Einsatzstelle. Wer spricht?',ok:'el',half:'ps',
  w:{lt:'Die Leitung der Behörde entscheidet, wer Auskunft gibt. Sie ist nicht der Augenzeuge vor Ort.',buma:'Die BuMA gibt es erst im Krisenstab, der hier nicht arbeitet.',s5:'S5 erstellt Informationen und betreut die Medien. Der Experte vor Ort ist der Einsatzleiter.',el:'Richtig: Die Presse möchte authentische Augenzeugenberichte, der Einsatzleiter vor Ort ist als Experte besonders wertvoll (nach Delegation durch die Leitung).',ps:'Zulässig, weil Pressesprecher FW delegiert werden kann. Für den O-Ton vor Ort ist der Einsatzleiter aber besonders wertvoll: halber Punkt.'}},
 st:[
 {t:'Das Feuer ist nach aktuellem Stand unter Kontrolle.',say:1,why:'Wahrheitsgetreu antworten.',r:'Grundsätze'},
 {t:'Die Ursache ist unklar. Ein technischer Defekt ist denkbar, das ist aber nur eine Vermutung.',say:1,why:'Vermutungen kennzeichnen.',r:'Grundsätze'},
 {t:'Mehrere Personen sind verletzt und werden vom Rettungsdienst versorgt.',say:1,why:'Wahrheitsgetreu antworten, ohne Personalien zu nennen.',r:'Grundsätze'},
 {t:'Sie dürfen fotografieren, solange Sie die Einsatzkräfte nicht behindern und die Würde der Betroffenen wahren.',say:1,why:'Die Presse darf an der Einsatzstelle fotografieren, aber nicht behindern oder gefährden und die Würde nicht verletzen.',r:'Grundsätze'},
 {t:'Ein Statement gebe ich, sobald der Einsatz es zulässt.',say:1,why:'Statements erst, wenn der Einsatz es zulässt.',r:'Grundsätze'},
 {t:'Der Betreiber hat die Brandschutzvorschriften missachtet.',say:0,why:'Keine Aussagen zu Schuldfragen.',r:'Grundsätze'},
 {t:'Einer der Verletzten ist der Hausmeister, Herr Meier.',say:0,why:'Keine Personalien preisgeben.',r:'Grundsätze'},
 {t:'Das ist die schlimmste Katastrophe, die diese Stadt je erlebt hat.',say:0,why:'Keine wertenden Aussagen.',r:'Grundsätze'},
 {t:'Es steht fest, dass ein technischer Defekt die Ursache war.',say:0,why:'Eine Vermutung darf nicht als Tatsache auftreten, sie muss gekennzeichnet werden.',r:'Grundsätze'}],
 ot:{good:['In der Lagerhalle brennt es, mehrere Personen sind verletzt.','Unsere größte Aufgabe ist, das Feuer von den Nachbargebäuden fernzuhalten.','Bitte meiden Sie die Umgebung und halten Sie Fenster und Türen geschlossen.'],
  bad:{zahl:'Im Einsatz sind 14 Fahrzeuge, 83 Kräfte, 4 Abschnitte und 3 Wasserentnahmestellen mit zusammen 2.400 Litern pro Minute.',alles:'Wir kämpfen mit dem Brand, der Wasserversorgung, dem Funk, dem Verkehr, dem Personal und der Absperrung.',buero:'Die brandbekämpfende Maßnahme wird im Rahmen der einsatztaktischen Zuständigkeitsregelung sukzessive umgesetzt.'}}},
{id:'gefahr',t:'Gefahrguteinsatz',ic:'☣',ks:false,
 lage:'Aus einem Tankwagen im Gewerbegebiet tritt ein Stoff aus. Anwohner sind besorgt. Eine Redaktion ruft in der Behörde an.',
 frage:'„Wir haben ein Recht auf Auskunft: Geben Sie uns sofort alle Messwerte, sagen Sie, wer den Fehler gemacht hat, und nennen Sie den Fahrer!“',
 who:{q:'Die Redaktion fragt, wer bei der Behörde entscheidet, wer den Medien Auskünfte erteilt. Wer ist das?',ok:'lt',half:null,
  w:{lt:'Richtig: Nach § 43 Landesbeamtengesetz entscheidet die Leitung der Behörde, wer den Medien und der Öffentlichkeit Auskünfte erteilt.',buma:'Die BuMA arbeitet im Krisenstab und trifft diese Entscheidung nicht.',s5:'S5 arbeitet in der Einsatzleitung, die Entscheidung liegt aber bei der Leitung der Behörde.',el:'Der Einsatzleiter kann nur delegiert Auskunft geben, die Entscheidung trifft die Leitung der Behörde.',ps:'Der Pressesprecher kann delegiert Auskunft geben, entscheiden tut die Leitung der Behörde.'}},
 st:[
 {t:'Wir sind nach § 4 Landespressegesetz verpflichtet, auf konkrete Anfragen zweckdienliche und erschöpfende Auskünfte zu geben.',say:1,why:'§ 4 LPG: Auskunftspflicht der Behörde auf konkrete Anfragen.',r:'§ 4 LPG'},
 {t:'Rohdaten geben wir nicht sofort heraus. Ausgewertete Informationen machen wir innerhalb eines Monats zugänglich.',say:1,why:'Kein Anspruch auf sofortige Herausgabe von Messwerten (Rohdaten) nach Umweltinformationsgesetz, ausgewertete Informationen binnen eines Monats.',r:'Auskunftspflicht'},
 {t:'Eine Beurteilung der Lage ist erst möglich, wenn das Einsatzgeschehen es zulässt. Danach informieren wir Sie.',say:1,why:'Die Presse kann erst auf Auskünfte bestehen, wenn das Einsatzgeschehen Beurteilung und Weitergabe zulässt.',r:'Auskunftspflicht'},
 {t:'Nach der ersten Erkundung vermuten wir ein Leck am Tankventil. Das ist noch nicht bestätigt.',say:1,why:'Vermutungen kennzeichnen.',r:'Grundsätze'},
 {t:'Sie haben als Presse Anspruch auf sofortige Herausgabe sämtlicher Messwerte.',say:0,why:'Falsch: Kein Anspruch auf sofortige Herausgabe von Rohdaten nach Umweltinformationsgesetz.',r:'Auskunftspflicht'},
 {t:'Der Fahrer hat den Tank falsch befüllt.',say:0,why:'Keine Aussagen zu Schuldfragen.',r:'Grundsätze'},
 {t:'Das Unternehmen ist unverantwortlich mit dem Stoff umgegangen.',say:0,why:'Keine wertenden Aussagen.',r:'Grundsätze'},
 {t:'Der Fahrer, Herr Schulz, 43 Jahre, liegt im Krankenhaus.',say:0,why:'Keine Personalien preisgeben.',r:'Grundsätze'}],
 ot:{good:['Aus einem Tankwagen ist ein Stoff ausgetreten, wir haben das Gebiet abgesperrt.','Unsere größte Aufgabe ist, den Stoff aufzufangen, bevor er sich ausbreitet.','Bitte halten Sie Fenster und Türen geschlossen und achten Sie auf Durchsagen.'],
  bad:{zahl:'Wir messen 12 ppm, in Abschnitt 3 sogar 41 ppm, an 9 Messpunkten, mit 7 Trupps und 3 Messfahrzeugen.',alles:'Probleme haben wir mit dem Leck, dem Wind, der Abdichtung, dem Abtransport, dem Funk und der Absperrung.',buero:'Die gefahrenabwehrrechtliche Maßnahme wird nach Maßgabe der Zuständigkeitsregelung sukzessive abgearbeitet.'}}},
{id:'hoch',t:'Hochwasser',ic:'🌊',ks:true,
 lage:'Der Pegel steigt, mehrere Straßen stehen unter Wasser. Der Krisenstab hat die Arbeit aufgenommen. Die Medien fragen aus allen Richtungen an.',
 frage:'„Wer informiert uns und die Bevölkerung jetzt? Wer entscheidet, wer meldet? Und wer ist schuld, dass der Deich nicht gehalten hat?“',
 who:{q:'Der Krisenstab arbeitet. Wer übernimmt jetzt die aktive Presse- und Medienarbeit, die Information der Bevölkerung und das Meldewesen?',ok:'buma',half:null,
  w:{lt:'Die Leitung der Behörde entscheidet, wer Auskunft gibt. Die Arbeit selbst übernimmt im Krisenstab die BuMA.',buma:'Richtig: Die BuMA übernimmt nach Einberufung des Krisenstabes das gesamte Meldewesen und die Warnung der Bevölkerung sowie die aktive Presse- und Medienarbeit.',s5:'S5 untersteht jetzt der BuMA, das Melde- und Berichtswesen geht auf die BuMA über.',el:'Der Einsatzleiter berichtet aus dem Einsatz. Meldewesen und Medienarbeit liegen jetzt bei der BuMA.',ps:'Der Pressesprecher kann zuarbeiten. Zuständig im Krisenstab ist die BuMA.'}},
 st:[
 {t:'Der Krisenstab arbeitet. Das Meldewesen läuft jetzt über die BuMA.',say:1,why:'Bei eingesetztem Krisenstab geht das Meldewesen komplett auf den Krisenstab über, die BuMA übernimmt es.',r:'BuMA / Meldewesen'},
 {t:'Wir richten ein Bürgertelefon ein, unter dem Sie sich informieren können.',say:1,why:'Einrichtung eines Bürgertelefons ist Aufgabe der BuMA.',r:'BuMA'},
 {t:'Wir informieren vorgesetzte, benachbarte und nachgeordnete Stellen sowie die Bevölkerung.',say:1,why:'Das sind die Informationspflichten im Meldewesen bei Großeinsatzlagen.',r:'Meldewesen'},
 {t:'Der Pegel steigt weiter. Wie hoch er steigt, ist eine Prognose und damit eine Vermutung.',say:1,why:'Wahrheitsgetreu antworten und Vermutungen kennzeichnen.',r:'Grundsätze'},
 {t:'Die Gemeinde hat den Deich zu spät verstärkt. Das ist ihre Schuld.',say:0,why:'Keine Aussagen zu Schuldfragen.',r:'Grundsätze'},
 {t:'Der Bewohner des Hauses in der Mühlenstraße, Herr Krämer, wird vermisst.',say:0,why:'Keine Personalien preisgeben.',r:'Grundsätze'},
 {t:'Die Einsatzleitung meldet weiter selbst an die vorgesetzten Stellen, mit dem Krisenstab hat das nichts zu tun.',say:0,why:'Falsch: Bei eingesetztem Krisenstab geht das Meldewesen komplett auf den Krisenstab über.',r:'Meldewesen'},
 {t:'Es besteht keine Gefahr mehr, das Hochwasser ist beherrscht.',say:0,why:'Nicht wahrheitsgetreu: Der Pegel steigt weiter. Wahrheitsgetreu antworten.',r:'Grundsätze'}],
 ot:{good:['Der Pegel steigt weiter, mehrere Straßen im Ort stehen unter Wasser.','Unsere größte Aufgabe ist, die Menschen in den tiefliegenden Straßen rechtzeitig in Sicherheit zu bringen.','Bei Fragen erreichen Sie unser Bürgertelefon.'],
  bad:{zahl:'Der Pegel liegt bei 6,42 Metern, gestern waren es 5,87, die Prognose lautet 6,95, der Abfluss 1.870 Kubikmeter pro Sekunde.',alles:'Uns beschäftigen der Pegel, die Sandsäcke, der Strom, die Straßensperren, der Funk und die Betreuung.',buero:'Die Hochwasserlage wird im Wege der stabsmäßigen Koordinierung einer Gesamtbewertung zugeführt.'}}},
{id:'vu',t:'Verkehrsunfall mit Todesopfer',ic:'🚑',ks:false,
 lage:'Auf einer Landstraße sind mehrere Fahrzeuge zusammengestoßen, eine Person ist gestorben. Der Einsatzleiter ist durch die Rettung gebunden.',
 frage:'„Wie heißt der Tote, wer ist zu schnell gefahren, und dürfen wir ganz nah ran und fotografieren?“',
 who:{q:'Die Leitung der Behörde will Auskunft delegieren, der Einsatzleiter ist gebunden. An wen geht das nach den Beispielen der Lernseite?',ok:'ps',half:null,
  w:{lt:'Die Leitung entscheidet, wer Auskunft gibt. Sie delegiert hier aber an eine andere Stelle.',buma:'Die BuMA gibt es erst im Krisenstab, der hier nicht arbeitet.',s5:'S5 bereitet Informationen vor und betreut die Medien. Als Delegation nennt die Lernseite aber Pressesprecher FW und Einsatzleiter.',el:'Der Einsatzleiter ist laut Lage durch die Rettung gebunden.',ps:'Richtig: Der HVB kann delegieren, zum Beispiel an den Pressesprecher FW oder den Einsatzleiter. Der Einsatzleiter fällt hier aus.'}},
 st:[
 {t:'Bei dem Unfall ist eine Person ums Leben gekommen.',say:1,why:'Wahrheitsgetreu antworten, ohne Personalien.',r:'Grundsätze'},
 {t:'Zur Schuldfrage sagen wir nichts.',say:1,why:'Keine Aussagen zu Schuldfragen.',r:'Grundsätze'},
 {t:'Sie dürfen fotografieren, aber Rettungskräfte nicht behindern und die Würde der Betroffenen nicht verletzen.',say:1,why:'Die Presse darf fotografieren, darf aber nicht behindern oder gefährden und die Würde der Betroffenen nicht verletzen.',r:'Grundsätze'},
 {t:'Eine Beurteilung ist erst möglich, wenn der Einsatz es zulässt. Danach informieren wir Sie.',say:1,why:'Statements und Auskünfte, sobald das Einsatzgeschehen es zulässt.',r:'Auskunftspflicht'},
 {t:'Der Tote ist der 34-jährige Herr Weber aus der Nachbarstadt.',say:0,why:'Keine Personalien preisgeben.',r:'Grundsätze'},
 {t:'Der Lkw-Fahrer ist viel zu schnell gefahren.',say:0,why:'Keine Aussagen zu Schuldfragen, außerdem wertend.',r:'Grundsätze'},
 {t:'Gehen Sie ruhig ganz nah ran und fotografieren Sie das Opfer.',say:0,why:'Die Presse darf die Würde von Betroffenen nicht verletzen und nicht behindern oder gefährden.',r:'Grundsätze'},
 {t:'Der Fahrer war sicher betrunken.',say:0,why:'Schuldzuweisung und als Tatsache ausgegeben. Vermutungen müssten gekennzeichnet werden, Schuldfragen bleiben ohnehin außen vor.',r:'Grundsätze'}],
 ot:{good:['Auf der Landstraße ist es zu einem schweren Unfall mit mehreren Fahrzeugen gekommen, eine Person ist gestorben.','Unsere größte Aufgabe ist jetzt, die Verletzten zu retten und die Strecke zu sichern.','Bitte umfahren Sie die Unfallstelle großräumig.'],
  bad:{zahl:'Beteiligt waren 3 Fahrzeuge, 2 Rettungswagen, 1 Hubschrauber, 14 Kräfte, 6 Trupps und eine Sperrung über 2,4 Kilometer.',alles:'Wir haben Probleme mit der Rettung, der Sperrung, dem Gegenverkehr, den Schaulustigen, dem Wetter und dem Funk.',buero:'Die verkehrsrechtliche Sicherung der Unfallörtlichkeit wird im Rahmen der Zuständigkeiten sukzessive hergestellt.'}}},
{id:'halle',t:'Hallenbrand im Gewerbepark',ic:'🏭',ks:false,
 lage:'Eine große Lagerhalle steht in Vollbrand, die Medien reisen in Scharen an. Ein Journalist verlangt umfangreiche Unterlagen.',
 frage:'„Wir verlangen alle Pläne, Lagerlisten und Personallisten der Halle, die Namen der Beschäftigten und wer den Brand gelegt hat!“',
 who:{q:'Wer erstellt Presse- und Medieninformationen, setzt bei Bedarf ein VOST ein und betreut die Medienvertreter?',ok:'s5',half:null,
  w:{lt:'Die Leitung entscheidet, wer Auskunft gibt. Die Informationen erstellt und betreut S5.',buma:'Die BuMA gibt es erst im Krisenstab, der hier nicht arbeitet.',s5:'Richtig: S5 macht Presse- und Medienarbeit (Informationen erstellen, VOST) und Medienbetreuung (informieren, führen, unterbringen, Pressekonferenzen vorbereiten).',el:'Der Einsatzleiter führt den Einsatz. Für Medieninformationen und Betreuung ist S5 zuständig.',ps:'Der Pressesprecher kann Auskunft geben. Die Medienbetreuung ist Aufgabe der S5.'}},
 st:[
 {t:'Zu Dingen, die der Geheimhaltung unterliegen, geben wir keine Auskunft.',say:1,why:'Auskunft kann verweigert werden, soweit Geheimhaltungsvorschriften entgegenstehen.',r:'Grenzen'},
 {t:'Auskünfte, die ein schutzwürdiges privates Interesse verletzen würden, geben wir nicht.',say:1,why:'Auskunft kann verweigert werden, soweit ein überwiegendes öffentliches oder schutzwürdiges privates Interesse verletzt würde.',r:'Grenzen'},
 {t:'Alle Unterlagen zusammenzustellen würde das zumutbare Maß übersteigen. Zu konkreten Fragen geben wir Auskunft.',say:1,why:'Auskunft kann verweigert werden, soweit ihr Umfang das zumutbare Maß überschreiten würde.',r:'Grenzen'},
 {t:'Zur Brandursache gibt es noch keine gesicherten Erkenntnisse.',say:1,why:'Wahrheitsgetreu antworten.',r:'Grundsätze'},
 {t:'Wir laden Sie zu einer Pressekonferenz ein, sobald der Einsatz es zulässt.',say:1,why:'S5 bereitet Presse- und Medienkonferenzen vor, Statements gibt es erst, wenn der Einsatz es zulässt.',r:'S5'},
 {t:'Sie bekommen alle Unterlagen und Daten. Ihr Auskunftsanspruch kennt keine Grenzen.',say:0,why:'Falsch: Der Auskunftsanspruch hat Grenzen (Geheimhaltung, überwiegende Interessen, zumutbarer Umfang).',r:'Grenzen'},
 {t:'Die Namen aller Beschäftigten der Halle geben wir Ihnen gern.',say:0,why:'Keine Personalien preisgeben, außerdem schutzwürdige private Interessen.',r:'Grundsätze'},
 {t:'Der Hallenbesitzer hat die Brandmeldeanlage absichtlich abgeschaltet.',say:0,why:'Keine Aussagen zu Schuldfragen.',r:'Grundsätze'},
 {t:'Der Brand wurde sicher von einem Mitarbeiter gelegt.',say:0,why:'Schuldzuweisung ohne Kennzeichnung als Vermutung. Keine Aussagen zu Schuldfragen.',r:'Grundsätze'}],
 ot:{good:['Eine große Lagerhalle im Gewerbepark steht in Vollbrand.','Unsere größte Aufgabe ist, die Nachbarhallen zu schützen.','Zu einer Pressekonferenz laden wir Sie ein, sobald der Einsatz es zulässt.'],
  bad:{zahl:'In der Halle lagern 1.240 Paletten auf 8.600 Quadratmetern, es brennen 3 Abschnitte mit 4 Löschleitungen und 26 Atemschutztrupps.',alles:'Wir haben Sorgen wegen der Halle, der Nachbarn, des Rauchs, des Löschwassers, der Zufahrt und des Personals.',buero:'Die Brandbekämpfung erfolgt im Rahmen der abgestimmten Zuständigkeiten nach einsatztaktischer Priorisierung.'}}}];
const RULES=[
['01','Rechtliche Grundlagen',['<h4>§ 4 Landespressegesetz (LPG)</h4>Behörden sind verpflichtet, den Vertretern der Presse auf konkrete Anfragen auch zweckdienliche und erschöpfende Auskünfte zu erteilen.','<h4>§ 43 Landesbeamtengesetz (LBG)</h4>Die Leitung der Behörde entscheidet, wer den Medien und der Öffentlichkeit Auskünfte erteilt. Der HVB kann dies delegieren (z. B. Pressesprecher FW, Einsatzleiter).','<h4>Auskunftspflicht vs. Auskunftsrecht</h4><ul><li>Die Presse kann erst dann auf Auskünfte bestehen, wenn das Einsatzgeschehen eine Beurteilung und die Informationsweitergabe nach pflichtgemäßem Ermessen zulässt.</li><li>Kein Anspruch auf sofortige Herausgabe von Messwerten (Rohdaten) nach Umweltinformationsgesetz. Ausgewertete Informationen müssen innerhalb eines Monats zugänglich gemacht werden.</li></ul>']],
['02','8 Grundsätze der Pressearbeit',['<ul><li>Keine Aussagen zu Schuldfragen</li><li>Keine Personalien preisgeben</li><li>Keine wertenden Aussagen</li><li>Vermutungen kennzeichnen</li><li>Wahrheitsgetreu antworten</li><li>Statements erst, wenn der Einsatz es zulässt</li><li>Presse darf fotografieren (Pressekodex)</li><li>Presse darf nicht behindern oder gefährden</li></ul>Die Presse darf die Würde von Betroffenen nicht verletzen (Pressekodex). Sie darf sich innerhalb dieser Schranken an der Einsatzstelle bewegen und fotografieren.']],
['03','S5: Presse und Medienarbeit in der Einsatzleitung',['<h4>Presse- und Medienarbeit</h4><ul><li>Erstellung von Presse- und Medieninformationen</li><li>Einsatz von VOST (Virtual Operations Support Team)</li></ul><h4>Presse- und Medienbetreuung</h4><ul><li>Informieren, Führen und Unterbringen von Presse- und Medienvertretern</li><li>Vorbereitung und Durchführung von Presse- und Medienkonferenzen</li></ul><h4>Warnung und Information der Bevölkerung</h4><h4>Unterstellung bei Krisenstab</h4>Bei Arbeitsaufnahme des Krisenstabes geht das Melde- und Berichtswesen auf die BuMA über. S5 untersteht dann der BuMA.']],
['04','BuMA: Bevölkerungswarnung und Medienarbeit im Krisenstab',['<ul><li>Aktive Presse- und Medienarbeit</li><li>Information der Bevölkerung</li><li>Auswertung und Zusammenfassung aller medialen Informationen</li><li>Koordination der Informationen nach innen</li><li>Einrichtung eines Bürgertelefons</li></ul>Die BuMA übernimmt nach Einberufung des Krisenstabes das gesamte Meldewesen und die Warnung der Bevölkerung. S5 der Einsatzleitung untersteht der BuMA.']],
['05','Meldewesen bei Großeinsatzlagen',['Informationspflichten bestehen auch im regulären Einsatzbetrieb: vorgesetzte Stellen unterrichten, benachbarte Stellen informieren, nachgeordnete Stellen unterrichten, Bevölkerung informieren.','<h4>Meldeerlass NRW</h4>Regelt die Meldung an vorgesetzte Stellen und definiert verschiedene Meldearten, die über Formblätter abzuhandeln sind.','<h4>Zuständigkeit</h4>Bei eingesetztem Krisenstab geht das Meldewesen komplett auf den Krisenstab über. Verbindungspersonen externer Stellen finden sich eher im Krisenstab als in der Einsatzleitung.']],
['06','Grenzen des Auskunftsanspruchs',['Auskünfte können verweigert werden, soweit:<ul><li>Vorschriften über die Geheimhaltung entgegenstehen,</li><li>ein überwiegendes öffentliches oder schutzwürdiges privates Interesse verletzt würde,</li><li>ihr Umfang das zumutbare Maß überschreiten würde.</li></ul>']],
['07','Pressestatements abgeben: Interviews / O-Ton',['<ul><li>Einfache Sprache nutzen, keine Bürokratensprache</li><li>Zahlensalat vermeiden</li><li>Auf die wichtigsten Punkte beschränken: nur auf die größte Herausforderung im Einsatz eingehen, nicht auf sämtliche Probleme</li><li>Die Presse möchte authentische Augenzeugenberichte, der Einsatzleiter vor Ort ist als Experte besonders wertvoll</li><li>Klare und verlässliche Aussagen sind wichtig</li></ul>']]];

/* ===== Hilfen ===== */
const KEY='bvi_sim_pressesim';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {};}}
function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
function starsOf(p){return p>=.9?3:p>=.7?2:p>=.5?1:0;}
function starHtml(n){return '<span class="stars" aria-label="'+n+' von 3 Sternen">'+'★'.repeat(n)+'<i>'+'★'.repeat(3-n)+'</i></span>';}
const MODES={kurz:['Kurzer Durchlauf','3 zufällige Lagen',3],voll:['Alle 5 Lagen','komplette Prüfung',5]};

/* ===== Zustand ===== */
let S={tab:'play',scr:'start',mode:null,list:[],i:0,step:0,checked:false,res:[],cur:null,last:null};
function build(sc){
  const say=shuffle(sc.st.filter(x=>x.say)).slice(0,3),no=shuffle(sc.st.filter(x=>!x.say)).slice(0,3);
  const bk=shuffle(Object.keys(sc.ot.bad)).slice(0,2);
  const blocks=sc.ot.good.map((t,k)=>({t,k,good:1})).concat(bk.map(k=>({t:sc.ot.bad[k],kind:k,good:0})));
  return {sc,roles:shuffle(ROLES),stm:shuffle(say.concat(no)),ans:{},pick:null,blocks:shuffle(blocks),seq:[]};
}
function start(m){S.mode=m;S.list=shuffle(SC).slice(0,MODES[m][2]);S.i=0;S.step=0;S.checked=false;S.res=[];S.cur=build(S.list[0]);S.scr='play';S.tab='play';render(true);}
function check(){
  const c=S.cur,sc=c.sc,r={sc:sc.t,pts:0,max:0,errs:[]};
  if(S.step===0){const w=sc.who;r.max=1;if(c.pick===w.ok)r.pts=1;else if(c.pick===w.half)r.pts=.5;
    if(r.pts<1)r.errs.push({h:'Zuständigkeit: '+RN[c.pick]+' gewählt (richtig: '+RN[w.ok]+')',w:w.w[c.pick]});c.rw=r;}
  else if(S.step===1){r.max=c.stm.length;c.stm.forEach((x,k)=>{const a=c.ans[k];if(a===x.say)r.pts++;else r.errs.push({h:'„'+x.t+'“ '+(a?'gesagt':'nicht gesagt'),w:(x.say?'Das hätte gesagt werden sollen. ':'Das darf nicht gesagt werden. ')+x.why+' ('+x.r+')'});});c.rs=r;}
  else{r.max=c.blocks.length;const g=c.seq.filter(b=>b.good);
    c.blocks.forEach(b=>{if(!b.good){if(!c.seq.includes(b))r.pts++;else r.errs.push({h:'Im O-Ton verwendet: „'+b.t+'“',w:BADWHY[b.kind]});}
      else{if(!c.seq.includes(b))r.errs.push({h:'Im O-Ton fehlt: „'+b.t+'“ ('+KIND[b.k]+')',w:'Dieser Baustein gehört zum Kern des Statements. '+OT_NOTE});
        else{const gi=g.indexOf(b);const bad=g.slice(0,gi).some(x=>x.k>b.k);if(bad)r.errs.push({h:'Reihenfolge falsch: „'+b.t+'“ ('+KIND[b.k]+') steht zu spät oder zu früh',w:OT_NOTE});else r.pts++;}}});c.ro=r;}
  S.checked=true;render(true);
}
function next(){
  const c=S.cur;
  if(S.step<2){S.step++;S.checked=false;render(true);return;}
  S.res.push({sc:c.sc.t,ic:c.sc.ic,pts:c.rw.pts+c.rs.pts+c.ro.pts,max:c.rw.max+c.rs.max+c.ro.max,errs:c.rw.errs.concat(c.rs.errs,c.ro.errs)});
  if(S.i+1<S.list.length){S.i++;S.step=0;S.checked=false;S.cur=build(S.list[S.i]);render(true);return;}
  const pts=S.res.reduce((a,r)=>a+r.pts,0),max=S.res.reduce((a,r)=>a+r.max,0),p=pts/max,st=starsOf(p);
  S.last={mode:S.mode,pts,max,p,st,res:S.res.slice()};
  const d=load();d.best=d.best||{};const b=d.best[S.mode];if(!b||p>b.p)d.best[S.mode]={p,st,pts,max};d.last={mode:S.mode,p,st,pts,max};d.runs=(d.runs||0)+1;save(d);
  S.scr='result';render(true);
}

/* ===== Ansichten ===== */
function vStart(){
  const d=load(),bs=d.best||{};
  const bm=m=>bs[m]?'<span class="note">Bestwert: '+'★'.repeat(bs[m].st)+'☆'.repeat(3-bs[m].st)+' ('+Math.round(bs[m].p*100)+' %)</span>':'<span class="note">Noch kein Ergebnis</span>';
  return '<div class="card q"><h2>Pressegespräch</h2><p>Journalisten fragen, du antwortest für die Feuerwehr. Je Lage drei Schritte: <b>Wer spricht?</b> Welche Aussagen <b>sagst du, welche nicht?</b> Wie baust du einen <b>O-Ton</b> auf?</p></div>'
   +'<div class="card"><h2>Zuständigkeit</h2><p>Die Leitung der Behörde entscheidet, wer Auskünfte erteilt, und kann delegieren (Pressesprecher, Einsatzleiter). Im Krisenstab übernimmt die BuMA, S5 untersteht ihr dann.</p></div>'
   +'<div class="card"><h2>Hilfe</h2><p>Im Reiter „Regeln“ stehen alle Regeln der Lernseite zum Nachlesen. Die Lagen sind frei erfunden, die Regeln stammen aus der Lernseite.</p></div>'
   +'<div class="foot"><button class="btn" data-a="start:kurz">'+MODES.kurz[0]+' ('+MODES.kurz[1]+')</button>'+bm('kurz')+'<button class="btn ghost" data-a="start:voll">'+MODES.voll[0]+' ('+MODES.voll[1]+')</button>'+bm('voll')+'</div>';
}
function head(){const c=S.cur,sc=c.sc;
  return '<div class="card q"><h2>'+sc.ic+' Lage '+(S.i+1)+' von '+S.list.length+': '+esc(sc.t)+'</h2><p>'+esc(sc.lage)+'</p><p style="margin-top:8px"><b>'+esc(sc.frage)+'</b></p></div>';}
function mkRow(ok,txt,why){return '<div class="opt '+(ok?'yes':'no')+'"><div class="t">'+esc(txt)+(why?'<div class="why">'+esc(why)+'</div>':'')+'</div><div class="mk '+(ok?'ok':'bad')+'" aria-label="'+(ok?'richtig':'falsch')+'">'+(ok?'✓':'✗')+'</div></div>';}
function vPlay(){
  const c=S.cur,sc=c.sc,last=S.i+1>=S.list.length;let h=head();
  const lbl=['Schritt 1 von 3: Zuständigkeit','Schritt 2 von 3: Aussagen','Schritt 3 von 3: O-Ton aufbauen'];
  h+='<div class="note"><b>'+lbl[S.step]+'</b></div>';
  if(S.step===0){
    h+='<div class="card"><p>'+esc(sc.who.q)+'</p></div>';
    h+=c.roles.map(r=>{const k=r[0],sel=c.pick===k,fb=S.checked&&sel;
      if(S.checked){const ok=k===sc.who.ok,half=k===sc.who.half;
        if(sel||ok)return '<div class="opt '+((ok||(sel&&half))?'yes':'no')+'"><div class="t"><b>'+r[1]+'</b>'+(sel?' (deine Wahl)':'')+'<div class="why">'+esc(sc.who.w[k])+'</div></div><div class="mk '+(ok?'ok':(sel&&half)?'ok':'bad')+'">'+(ok?'✓':(sel&&half)?'½':'✗')+'</div></div>';
        return '<div class="opt" style="opacity:.6"><div class="t">'+r[1]+'<div class="why">'+esc(sc.who.w[k])+'</div></div></div>';}
      return '<button class="opt rolebtn'+(sel?' sel':'')+'" data-a="pick:'+k+'" aria-pressed="'+sel+'"><span class="t">'+r[1]+'<small>'+r[2]+'</small></span></button>';}).join('');
    h+='<div class="foot">'+(S.checked?'<button class="btn" data-a="next">Weiter zu den Aussagen</button>':'<button class="btn" data-a="check"'+(c.pick?'':' disabled')+'>Prüfen</button>')+'</div>';
  }else if(S.step===1){
    h+='<div class="card"><p>Welche dieser Aussagen sagst du den Journalisten? Entscheide bei jeder: <b>Sagen</b> oder <b>Nicht sagen</b>.</p></div>';
    h+=c.stm.map((x,k)=>{const a=c.ans[k];
      if(S.checked)return mkRow(a===x.say,x.t,(a?'Du: Sagen. ':'Du: Nicht sagen. ')+(x.say?'Richtig wäre: Sagen. ':'Richtig wäre: Nicht sagen. ')+x.why);
      return '<div class="opt'+(a===1?' yes':a===0?' no':'')+'"><div class="t">'+esc(x.t)+'</div><div class="tg"><button class="pill'+(a===1?' on y':'')+'" data-a="ans:'+k+':1" aria-pressed="'+(a===1)+'">Sagen</button><button class="pill'+(a===0?' on n':'')+'" data-a="ans:'+k+':0" aria-pressed="'+(a===0)+'">Nicht</button></div></div>';}).join('');
    const n=Object.keys(c.ans).length,all=n===c.stm.length;
    h+='<div class="foot">'+(S.checked?'<button class="btn" data-a="next">Weiter zum O-Ton</button>':'<button class="btn" data-a="check"'+(all?'':' disabled')+'>'+(all?'Prüfen':'Noch '+(c.stm.length-n)+' Aussage(n) offen')+'</button>')+'</div>';
  }else{
    h+='<div class="card"><p>Du gibst ein kurzes O-Ton-Statement. Tippe die Bausteine in der Reihenfolge an, in der du sie sagst. Nicht Passendes lässt du weg. Nochmal tippen nimmt einen Baustein zurück.</p></div>';
    if(!S.checked){
      h+='<div class="card"><h2>Dein O-Ton</h2>'+(c.seq.length?c.seq.map((b,k)=>'<p><b>'+(k+1)+'.</b> '+esc(b.t)+'</p>').join(''):'<p class="note">Noch leer.</p>')+'</div>';
      h+=c.blocks.map(b=>{const p=c.seq.indexOf(b);return '<button class="opt rolebtn'+(p>=0?' sel':'')+'" data-a="blk:'+c.blocks.indexOf(b)+'" aria-pressed="'+(p>=0)+'"><span class="num'+(p>=0?'':' e')+'">'+(p>=0?p+1:'+')+'</span><span class="t">'+esc(b.t)+'</span></button>';}).join('');
      h+='<div class="foot"><button class="btn" data-a="check"'+(c.seq.length?'':' disabled')+'>Prüfen</button></div>';
    }else{
      h+='<div class="card"><h2>Dein O-Ton</h2>'+(c.seq.length?c.seq.map((b,k)=>'<p><b>'+(k+1)+'.</b> '+esc(b.t)+'</p>').join(''):'<p class="note">Leer.</p>')+'</div>';
      const ideal=c.blocks.filter(b=>b.good).sort((a,b)=>a.k-b.k);
      h+='<div class="card"><h2>Gute Reihenfolge</h2>'+ideal.map((b,k)=>'<p><b>'+(k+1)+'.</b> '+esc(b.t)+' <span class="note">('+KIND[b.k]+')</span></p>').join('')+'<p class="note" style="margin-top:8px">'+OT_NOTE+'</p></div>';
      const bad=c.blocks.filter(b=>!b.good);
      h+=bad.map(b=>mkRow(!c.seq.includes(b),b.t,'Gehört nicht in den O-Ton: '+BADWHY[b.kind])).join('');
      const r=c.ro;h+='<div class="note"><b>'+r.pts+' von '+r.max+' Punkten</b> im O-Ton'+(r.errs.length?'':'. Sauber gelöst.')+'</div>';
      h+='<div class="foot"><button class="btn" data-a="next">'+(last?'Zur Auswertung':'Nächste Lage')+'</button></div>';
    }
  }
  if(S.checked&&S.step<2){const r=S.step===0?c.rw:c.rs;const nt='<div class="note"><b>'+r.pts+' von '+r.max+' Punkten</b></div>',fi=h.lastIndexOf('<div class="foot">');h=h.slice(0,fi)+nt+h.slice(fi);}
  return h;
}
function vResult(){
  const L=S.last;let h='<div class="card"><div class="row"><div>'+starHtml(L.st)+'<div class="note" style="margin-top:6px">'+['Noch nicht bestanden. Lies die Regeln und versuche es nochmal.','Ausreichend, aber mit Lücken.','Gut, einzelne Fehler.','Sehr gut, sicher im Pressegespräch.'][L.st]+'</div></div><div class="score" style="margin-left:auto">'+Math.round(L.pts*2)/2+' / '+L.max+'</div></div></div>';
  h+='<div class="card"><h2>Ergebnis je Lage</h2>'+L.res.map(r=>'<p>'+r.ic+' <b>'+esc(r.sc)+':</b> '+r.pts+' von '+r.max+' Punkten</p>').join('')+'</div>';
  const errs=[];L.res.forEach(r=>r.errs.forEach(e=>errs.push({sc:r.sc,h:e.h,w:e.w})));
  if(errs.length){h+='<div class="note"><b>Deine Fehler ('+errs.length+')</b></div>'+errs.map(e=>'<div class="card err"><b>'+esc(e.sc)+'</b><div style="margin-top:2px">'+esc(e.h)+'</div><div class="why">'+esc(e.w)+'</div></div>').join('');}
  else h+='<div class="card"><p class="ok"><b>Keine Fehler.</b> Alle Entscheidungen waren richtig.</p></div>';
  h+='<div class="foot"><button class="btn" data-a="start:'+L.mode+'">Nochmal ('+MODES[L.mode][0]+', neue Reihenfolge)</button><button class="btn ghost" data-a="menu">Zur Startseite</button></div>';
  return h;
}
function vRules(){
  return '<div class="note">Alle Regeln der Lernseite „Presse- &amp; Öffentlichkeitsarbeit“ zum Nachlesen. Rechtsgrundlage: § 4 Landespressegesetz, § 43 Landesbeamtengesetz.</div>'
   +RULES.map(r=>'<details><summary><span class="tag" style="margin:0">'+r[0]+'</span>'+r[1]+'</summary><div class="b">'+r[2].join('')+'</div></details>').join('');
}
function vStat(){
  const d=load(),b=d.best||{};
  let h='<div class="card"><h2>Bestwerte</h2>'+['kurz','voll'].map(m=>'<p><b>'+MODES[m][0]+':</b> '+(b[m]?'<span class="or">'+'★'.repeat(b[m].st)+'☆'.repeat(3-b[m].st)+'</span> '+Math.round(b[m].p*100)+' %':'noch kein Ergebnis')+'</p>').join('')+'<p class="note" style="margin-top:8px">Durchläufe gesamt: '+(d.runs||0)+'</p></div>';
  h+='<div class="card"><h2>Sterne</h2><p>★★★ ab 90 %, ★★ ab 70 %, ★ ab 50 %. Je Lage zählen die Zuständigkeit, sechs Aussagen und die Bausteine des O-Tons.</p></div>';
  h+='<div class="foot"><button class="btn ghost" data-a="reset">Bestwerte löschen</button></div>';return h;
}
function render(top){
  const m=$('.main'),app=$('.app');
  if(!app)return;
  let h=S.tab==='rules'?vRules():S.tab==='stat'?vStat():S.scr==='start'?vStart():S.scr==='result'?vResult():vPlay();
  m.innerHTML=h;if(top)m.scrollTop=0;
  const n=S.scr==='start'?0:S.list.length;
  $('.step').innerHTML=n&&S.tab==='play'?S.list.map((x,k)=>'<span class="'+(S.scr==='result'||k<S.i?'d':k===S.i?'c':'')+'"></span>').join(''):'';
  document.querySelectorAll('.tab').forEach(t=>{const on=t.dataset.t===S.tab;t.classList.toggle('on',on);t.setAttribute('aria-selected',on);});
}
function boot(){
  $('#root').innerHTML='<div class="app"><div class="top"><small>IdF Münster · Presse</small><h1>Pressegespräch</h1><div class="step"></div></div><div class="main"></div><div class="tabs" role="tablist"><button class="tab on" role="tab" data-t="play"><b>?</b>Gespräch</button><button class="tab" role="tab" data-t="rules"><b>§</b>Regeln</button><button class="tab" role="tab" data-t="stat"><b>★</b>Bilanz</button></div></div>';
  $('.tabs').addEventListener('click',e=>{const t=e.target.closest('.tab');if(t){S.tab=t.dataset.t;render(true);}});
  $('.main').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a.split(':'),c=S.cur,y=$('.main').scrollTop;
    if(a[0]==='start')start(a[1]);
    else if(a[0]==='menu'){S.scr='start';render(true);}
    else if(a[0]==='reset'){try{localStorage.removeItem(KEY);}catch(x){}render(false);}
    else if(a[0]==='pick'&&!S.checked){c.pick=a[1];render(false);$('.main').scrollTop=y;}
    else if(a[0]==='ans'&&!S.checked){c.ans[+a[1]]=+a[2];render(false);$('.main').scrollTop=y;}
    else if(a[0]==='blk'&&!S.checked){const bl=c.blocks[+a[1]],p=c.seq.indexOf(bl);if(p>=0)c.seq.splice(p,1);else c.seq.push(bl);render(false);$('.main').scrollTop=y;}
    else if(a[0]==='check')check();
    else if(a[0]==='next')next();});
  render(true);
}
boot();
})();
