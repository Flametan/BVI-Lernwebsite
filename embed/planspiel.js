/* ===== Planspiel-Trainer: Lagebearbeitung in sieben Schritten =====
   Fachregeln nur aus den Lernseiten (Stabsarbeit IdF: Begrifflichkeiten, Gliederung EL/Krisenstab, Human Factors,
   Werkzeuge, Presse, Zivile Verteidigung, Hinweise zur Lagebearbeitung). Die Szenarien sind frei erfunden. */
(function(){
'use strict';

/* ---------- Stammdaten ---------- */
const RL={s1:'S1 Personal / Innerer Dienst',s2:'S2 Lage',s3:'S3 Einsatz',s4:'S4 Versorgung',s5:'S5 Presse (unter BuMA)',s6:'S6 IuK',
 buma:'BuMA (Bevölkerungs- und Medienarbeit)',lds:'Leiter des Stabes (Krisenstab)',so:'Amt Sicherheit und Ordnung',ges:'Amt Gesundheit',umw:'Amt Umwelt',
 soz:'Amt Soziales',pol:'Polizei',ls:'Leitstelle'};
const BK=[['el','Einsatzleitung'],['ks','Krisenstab'],['ea','Einsatzabschnitt'],['x','Nicht erforderlich']];
const BDEF={el:'Das gehört zur operativ-taktischen Einsatzleitung (Sachgebiete S1 bis S6, Fachberater).',
 ks:'Das gehört in den administrativ-organisatorischen Krisenstab.',
 ea:'Das ist ein Einsatzabschnitt: operative Arbeit vor Ort, geordnet durch S3.',
 x:'Dafür gibt es in dieser Lage keinen Bedarf.'};
const PK=[['p1','Priorität 1'],['p2','Priorität 2'],['p3','Priorität 3'],['p4','Priorität 4'],['nz','Nicht zuständig'],['nb','Nicht beeinflussbar']];
const PKX={p1:'wichtig und dringend',p2:'wichtig, nicht dringend',p3:'nicht wichtig, dringend',p4:'nicht wichtig, nicht dringend (später prüfen / löschen)',nz:'nicht zuständig',nb:'nicht beeinflussbar'};
const ART=[['sofort','Sofortmeldung'],['folge','Folgemeldung'],['schluss','Schlussmeldung'],['info','Keine Meldeart: Information / Warnung']];
const WEG=[['el-ls','Einsatzleitung → Leitstelle → vorgesetzte Stelle'],['ks-vor','Krisenstab → vorgesetzte Stelle'],['buma-bev','BuMA → Bevölkerung'],
 ['buma-pr','BuMA (mit S5) → Presse'],['s2-ea','S2 → Einsatzabschnitte (nachgeordnete Stellen)'],['vp','Verbindungsperson ↔ Krisenstab / Einsatzleitung']];
const BIS=[['sofort','Sofort'],['2h','In 2 Stunden'],['6h','In 6 Stunden'],['24h','In 24 Stunden']];
const RUE=[['erl','Meldung an den Stab, sobald erledigt'],['sitz','Zwischenstand zur nächsten Sitzung und bei Erledigung'],['prob','Nur bei Problemen'],['kein','Keine Rückmeldung nötig']];
const STA=[['offen','Offen (neu erteilt)'],['bearb','In Bearbeitung'],['erl','Erledigt']];
const TER=[['30','In 30 Minuten'],['2h','In 2 Stunden'],['6h','In 6 Stunden'],['24h','Morgen früh']];
const FZ=[['ein','Einstabsmodell: eine Einsatzleitung führt alles'],['zwei','Zwei-Stäbe-Modell: Einsatzleitung und Krisenstab'],['eler','Nur ein Einsatzleiter ohne Stab']];
const FE={
 budget:['Frage-Budget verschwendet','Unnötige Fragen kosten Punkte und Budget. Wichtig sind Betroffene, Lageentwicklung, Kräfte, Warnstatus, KRITIS und Pressebedarf (S2: beschaffen, auswerten, bewerten lagerelevanter Informationen).'],
 luecke:['Kernfragen nicht gestellt','Ohne Warnstatus, Kräfteübersicht oder Prognose fehlt die Grundlage für Entschluss und Zeitstrahl (FOR-DEC: erst Fakten sammeln).'],
 sicht:['Sichtweisen vermischt','Die Problemanalyse trennt die Sicht der Betroffenen von der fachlichen Sicht (erste Sitzung, Schritt 4).'],
 prio:['Wichtig und dringend verwechselt','Priorität 1 ist wichtig und dringend, Priorität 2 wichtig und nicht dringend, Priorität 3 nicht wichtig und dringend (modifizierte Eisenhower-Matrix).'],
 zust:['Zuständigkeit und Beeinflussbarkeit nicht geprüft','Die modifizierte Matrix kennt zusätzlich „nicht zuständig“ und „nicht beeinflussbar“. Solche Punkte bekommen keinen Auftrag.'],
 fz:['Führungsorganisation falsch gewählt','Mehrere Verbände oder mehrere Einsatzstellen verlangen Führen mit Führungsstab (Führungsstufe D); bei Großeinsatzlage gilt das Zwei-Stäbe-Modell.'],
 stab:['Aufgaben dem falschen Stab zugeordnet','Einsatzleitung: operativ-taktisch (S1 bis S6, Fachberater). Krisenstab: administrativ-organisatorisch (LdS, BuMA, KGS, Fachämter). Verbindungspersonen externer Stellen eher im Krisenstab.'],
 art:['Meldeart verwechselt','Sofortmeldung: Leitstelle max. 30 min nach Bekanntwerden. Folgemeldung: bei wesentlichen Lageänderungen. Schlussmeldung: in der Regel die letzte Folgemeldung.'],
 weg:['Meldeweg falsch','Mit Arbeitsaufnahme des Krisenstabes gehen Meldewesen und Warnung der Bevölkerung komplett auf ihn (BuMA) über; S5 untersteht dann der BuMA.'],
 auf:['Auftrag falsch zugeordnet','Wer, Mit wem und Was müssen zu den Sachgebietsaufgaben passen (S1 Kräfte, S3 Einsatz, S4 Versorgung, BuMA Warnung, Fachämter im Krisenstab).'],
 frist:['Frist, Rückmeldung oder Status unklar','Jeder Auftrag braucht Frist, Rückmeldung und Status; ohne Rückmeldung bleibt die Kontrolle (FOR-DEC: Check) leer.'],
 ff:['Federführung unklar','Pro Problemfeld wird eine Federführung festgelegt, sonst fühlt sich niemand zuständig.'],
 termin:['Nächster Termin nicht lageabhängig','Die Zeiträume zwischen den Sitzungen sind lageabhängig; die Rückmeldung zum ersten fälligen Auftrag soll im Stab besprochen werden.']
};

/* ---------- Szenarien (frei erfunden) ----------
   q:  [Kategorie, Frage, Antwort, Wertung k|n|u, Begründung]
   pa: [Aussage, b|f]      pr: [Punkt, Kategorie, Begründung]
   og: [Name, Bucket, Begründung?]       km: [Sachverhalt, Art, Weg, Begründung]
   au: Aufträge {t,ctx,wer[],mit[],was[4, erste richtig],bis,st,why}                              */
const SC=[
{id:'hw',n:'Hochwasser im Kreis Nordfeld',kz:'Dauerregen, steigende Berla, Sickerstellen am Deich von Mühlau.',zt:'Samstag, 14:20 Uhr',fb:'Fachberater Hochwasser (THW)',
 roles:['s1','s3','s4','buma','lds','so','soz','ges','pol','ls','fb'],
 lage:['Seit 36 Stunden regnet es im Einzugsgebiet der Berla. Der Pegel Hohenbrück steht bei 5,10 m und steigt weiter. Am Deich des Ortsteils Mühlau (Gemeinde Hohenbrück) treten Sickerstellen auf.',
  'Feuerwehren aus drei Gemeinden sind mit Sandsackverbau, Deichwache und Pumparbeiten an mehreren Einsatzstellen im Einsatz. Die Leitstelle zählt über 120 Einsätze. Bundeswehr und THW sind bekannt, die Bundeswehr hat Hilfe angeboten.',
  'Einsatzleiter und Landrat (HVB) stufen die Lage als Großeinsatzlage ein. Mehrere Verbände arbeiten an mehreren Einsatzstellen: Es wird mit Führungsstab geführt.'],
 q:[['Betroffene','Wie viele Menschen leben in den gefährdeten Bereichen von Mühlau und Auwiese?','Rund 640 Einwohner, davon etwa 90 über 75 Jahre. Ein Pflegeheim mit 48 Bewohnern liegt in Mühlau.','k','Zahl und Art der Betroffenen bestimmen Umfang der Evakuierung und die Meldepflicht (Evakuierung betrifft mehr als 50 Personen).'],
  ['Prognose','Wie lautet die Scheitelprognose?','Scheitel mit 5,90 m in etwa 7 Stunden. Die Deichkrone liegt bei 6,10 m. Worst case bei weiterem Regen: 6,30 m.','k','Prognose und Annahmen (best, middle, worst case) sind die Grundlage für Zeitstrahl und Rückwärtsplanung.'],
  ['Kräfte','Welche Kräfte stehen noch zur Verfügung?','Im Kreis sind 70 % der Feuerwehr gebunden, Reserve sind 2 Löschzüge. Über gegenseitige Hilfe kann der Nachbarkreis 3 Züge stellen. Das THW ist bereits im Einsatz.','k','Kräfteübersicht und Zwiebelschalenmodell (eigene Kräfte, gegenseitige Hilfe, landesweite Hilfe) sind Sache der S1.'],
  ['Warnstatus','Wurde die Bevölkerung bereits gewarnt?','Nein. Es gab nur eine Pressemitteilung des Kreises vor 3 Stunden. In Mühlau wurde nicht gewarnt, Sirenen wurden nicht ausgelöst.','k','Warnung und Information der Bevölkerung sind eine Kernaufgabe von S5 beziehungsweise BuMA.'],
  ['KRITIS','Sind kritische Infrastrukturen betroffen?','Das Wasserwerk Mühlau (9.000 Einwohner), das Pflegeheim und ein Umspannwerk liegen im Überflutungsbereich.','k','Kritische Infrastruktur verändert Priorisierung und Zusammensetzung des Stabes.'],
  ['Zufahrten','Welche Zufahrten und Bereitstellungsräume sind nutzbar?','Die Kreisstraße K 8 nach Mühlau wird in etwa 2 Stunden überflutet. Von Norden über Hohenbrück ist die Zufahrt frei. Bereitstellungsraum: Sportplatz Hohenbrück, hochwasserfrei.','k','Bereitstellungsraum und Zugang gehören zum Sieben-Punkte-Plan (S1 und S3).'],
  ['Presse','Wie groß ist das Medieninteresse?','Regionale Presse und zwei Fernsehteams sind vor Ort, Videos vom Deich laufen in sozialen Netzwerken. Landesweite Berichte werden erwartet.','k','Landesweites Medieninteresse ist meldepflichtig; Presse- und Medienarbeit liegt bei S5 und BuMA.'],
  ['Wetter','Wie ist die Wetterlage?','Der Dauerregen lässt voraussichtlich in 6 Stunden nach. Temperatur 8 °C.','n','Nützlich, steckt aber im Wesentlichen schon in der Scheitelprognose.'],
  ['Versorgung','Ist die Verpflegung der Einsatzkräfte gesichert?','Eine Feldküche ist angefordert und trifft in 2 Stunden ein.','n','Wichtig für S4, aber nachrangig gegenüber der Gefahr für Menschen.'],
  ['Material','Wie viele Sandsäcke sind verfügbar?','40.000 Stück im Lager, 15.000 sind verbaut.','n','Logistikdetail für S4; nützlich, aber keine Kernfrage.'],
  ['Unterkunft','Gibt es Notunterkünfte?','Turnhalle Hohenbrück (200 Plätze) und Schule (150 Plätze) sind vorgeplant.','n','Wichtig für die Betreuung, lässt sich nach dem Entschluss zur Evakuierung klären.'],
  ['Historie','Wann wurde der Deich zuletzt saniert?','Vor 14 Jahren.','u','Die Geschichte des Deichs hilft in der akuten Lage nicht.'],
  ['Technik','Welches Fabrikat haben die Pumpen der Feuerwehr Hohenbrück?','Ein Standardfabrikat mit 1.000 l/min.','u','Ein Fabrikat ändert keine Entscheidung; wichtig wäre die Förderleistung insgesamt.'],
  ['Historie','Wie hoch war der Pegel beim Hochwasser vor 25 Jahren?','5,35 m.','u','Alte Rekorde ersetzen keine aktuelle Prognose.'],
  ['Sonstiges','Wann findet das nächste Fest in Mühlau statt?','Im Herbst.','u','Hat mit der Lage nichts zu tun.'],
  ['Statistik','Wie viele Einsätze hatte die Feuerwehr Hohenbrück im letzten Jahr?','Rund 190.','u','Statistik ohne Bezug zur aktuellen Lage.']],
 pa:[['Angst, Haus und Habe zu verlieren','b'],['Unsicherheit: Wann muss ich gehen, wohin, was nehme ich mit?','b'],['Ältere Menschen kommen ohne Hilfe nicht aus dem Haus','b'],
  ['Die Betroffenen wissen nicht, wie sich die Lage entwickelt','b'],['Sickerstellen können bei höherem Scheitel zum Deichbruch führen','f'],
  ['Kräfte reichen nur, wenn die gegenseitige Hilfe rechtzeitig angefordert wird','f'],['Das Wasserwerk muss geschützt werden, weil sonst die Versorgung ausfällt','f'],
  ['Die Zufahrt K 8 ist in 2 Stunden überflutet, ein Bereitstellungsraum muss festgelegt werden','f']],
 pr:[['Menschen aus Mühlau und Auwiese in Sicherheit bringen (Zufahrt K 8 in 2 Stunden überflutet)','p1','Leben und Gesundheit sind betroffen (wichtig) und die Zufahrt fällt in 2 Stunden weg (dringend).'],
  ['Pflegeheim mit 48 Bewohnern verlegen, bevor die Zufahrt K 8 überflutet ist','p1','Hilfebedürftige Personen (wichtig) mit Frist durch die Überflutung (dringend).'],
  ['Wasserwerk gegen den Scheitel in 7 Stunden schützen und Schutzmaßnahmen planen','p2','Wichtig, aber nicht unmittelbar dringend: der Scheitel kommt erst in 7 Stunden, es bleibt Zeit zum Planen.'],
  ['Nachforderung von Kräften kalkulieren und Zeitstrahl für die kommenden Nächte erstellen','p2','Wichtig für die Rückwärtsplanung, aber nicht dringend.'],
  ['Eine Zeitung bittet um ein Hintergrundgespräch und will in 30 Minuten antworten','p3','Dringend (Frist), aber nicht wichtig für die Gefahrenabwehr; die S5 kann es übernehmen.'],
  ['Ein Heimatverein möchte nach dem Hochwasser Bilder für eine Ausstellung sammeln','p4','Weder wichtig noch dringend: später prüfen.'],
  ['Die überflutete Bundesstraße B 56 später instand setzen','nz','Aufgabe des Straßenbaulastträgers, nicht des Stabes.'],
  ['Die Regenmenge im Oberlauf der Berla verringern','nb','Niederschlag kann der Stab nicht beeinflussen.']],
 og:[['S3 Einsatz: Lage beurteilen, Entschluss fassen, Befehle erteilen','el','S3 ist Sachgebiet der Einsatzleitung (Beurteilen, Entschluss, Befehle).'],
  ['S1 Personal / Innerer Dienst: Kräfte alarmieren, Bereitstellungsraum, gegenseitige Hilfe','el','S1 bereitet Einsatzkräfte bereit (Zwiebelschalenmodell, Bereitstellungsräume).'],
  ['Fachberater Hochwasser (THW, Wasserverband)','el','Fachberater gehören zur Einsatzleitung; S1 fordert fach-, orts- und betriebskundige Personen an.'],
  ['Einsatzabschnitt Deichsicherung Mühlau','ea'],['Einsatzabschnitt Evakuierung Mühlau','ea'],
  ['BuMA: Warnung der Bevölkerung, Bürgertelefon, Medienarbeit','ks','Die BuMA ist Teil des Krisenstabs; Warnung der Bevölkerung geht auf sie über.'],
  ['Leiter des Stabes des Krisenstabs (LdS)','ks','Der LdS leitet und koordiniert den Krisenstab.'],
  ['Verbindungsperson Bundeswehr (eigene Einsatzleitung, Hilfe angeboten)','ks','Verbindungspersonen externer Stellen finden sich eher im Krisenstab als in der Einsatzleitung.'],
  ['Amt Soziales: Betreuung der evakuierten Personen','ks','Soziales ist ständiges Mitglied im Krisenstab und Fachamt für die Betroffenen.'],
  ['Einsatzabschnitt Brandbekämpfung','x','Es brennt nichts: ein Abschnitt Brandbekämpfung hätte keine Aufgabe.']],
 fzw:'Mehrere Verbände arbeiten an mehreren Einsatzstellen (Führungsstufe D). Bei Großeinsatzlage erfolgt die Unterteilung in Einsatzleitung und Krisenstab.',
 km:[['13:50 Uhr: Die Großeinsatzlage ist festgestellt, die Evakuierung von mehr als 50 Personen steht bevor. Der Krisenstab arbeitet noch nicht.','sofort','el-ls','Meldepflichtiges Ereignis: Sofortmeldung über die Leitstelle innerhalb von 30 Minuten, mit qualifizierter Rückmeldung des Einsatzleiters.'],
  ['17:00 Uhr: Der Krisenstab arbeitet. Die Scheitelprognose steigt auf 6,30 m (wesentliche Lageänderung).','folge','ks-vor','Wesentliche Lageänderung: Folgemeldung. Mit Arbeitsaufnahme geht die Meldepflicht auf den Krisenstab über.'],
  ['Der Krisenstab beschließt die Räumung von Mühlau. Die Betroffenen müssen gewarnt und informiert werden, ein Bürgertelefon wird gebraucht.','info','buma-bev','Die BuMA übernimmt nach Einberufung des Krisenstabes die Warnung der Bevölkerung und richtet das Bürgertelefon ein.'],
  ['Die Bundeswehr bietet Pioniere an, hat eine eigene Einsatzleitung und schickt eine Person zur Abstimmung.','info','vp','Die Bundeswehr hat eigene Einsatzleitung und arbeitet über eine Verbindungsperson im Stab, eher im Krisenstab.'],
  ['Tag 3: Der Scheitel ist durch, alle Einsatzstellen sind zurückgebaut, der Einsatz ist beendet.','schluss','ks-vor','Die Schlussmeldung ist in der Regel die letzte Folgemeldung; der Krisenstab meldet an die vorgesetzte Stelle.']],
 au:[{t:'Evakuierung Mühlau und Auwiese',ctx:'Die Zufahrt K 8 ist in 2 Stunden überflutet. Bis dahin muss die Räumung abgeschlossen sein. Der Auftrag wird neu erteilt.',wer:['s3'],mit:['pol','soz'],
   was:['Mühlau und Auwiese räumen, Pflegeheim verlegen und Betreuungsstelle Turnhalle Hohenbrück einrichten','Nur das Pflegeheim räumen, über den Rest später entscheiden','Die Bevölkerung per Pressemitteilung zur Selbsthilfe aufrufen','Abwarten, bis der Scheitel erreicht ist'],
   bis:'2h',st:'offen',why:'S3 veranlasst Sofortmaßnahmen zum Schutz der Bevölkerung; Polizei (ständiges Mitglied) und Soziales unterstützen. Frist: bis die Zufahrt wegfällt.'},
  {t:'Deichsicherung Mühlau',ctx:'Sickerstellen müssen vor dem Scheitel gesichert sein. Frist: 6 Stunden. Die Kräfte am Deich arbeiten bereits.',wer:['s3'],mit:['fb'],
   was:['Sickerstellen sichern, Deichwache durchgehend, Fachberater beteiligen','Sickerstellen nur beobachten und den Pegel abwarten','Den Deich aufgeben und alle Kräfte abziehen','Anwohner um Mithilfe am Deich bitten, ohne Fachleute'],
   bis:'6h',st:'bearb',why:'S3 führt den Einsatz, der Fachberater bringt die Fachkenntnis. Der Status ist „in Bearbeitung“, weil die Kräfte schon arbeiten.'},
  {t:'Kräfte nachfordern und Bereitstellungsraum einrichten',ctx:'Die Ablösung aus gegenseitiger Hilfe soll in 6 Stunden eintreffen. Der Auftrag wird neu erteilt.',wer:['s1'],mit:['ls'],
   was:['Gegenseitige Hilfe über die eigene Leitstelle anfordern, Bereitstellungsraum Sportplatz Hohenbrück festlegen','Die Nachbarwehren direkt anrufen und selbst einweisen','Sofort landesweite Hilfe anfordern, bevor die eigenen Kräfte ausgeschöpft sind','Keine Nachforderung, bis alle Kräfte erschöpft sind'],
   bis:'6h',st:'offen',why:'S1 stellt Kräfte bereit; Anforderung läuft EL, eigene Leitstelle, Nachbar-Leitstelle (Zwiebelschalenmodell).'}],
 ff:{t:'Betreuung der evakuierten Personen',r:'soz',why:'Das Fachamt Soziales ist ständiges Mitglied im Krisenstab und kennt die Betreuungsstrukturen.'},
 tm:{o:'2h',n:'Der erste Auftrag (Evakuierung) ist in 2 Stunden fällig. Der Stab will dazu die Rückmeldung besprechen.'}},

{id:'gg',n:'Gefahrgutunfall mit Evakuierung',kz:'Tankwagen mit Ammoniaklösung verunglückt, Gaswolke zieht auf Neuhof.',zt:'Dienstag, 08:40 Uhr',fb:'Fachberater Gefahrstoffe',
 roles:['s1','s2','s3','s4','buma','lds','umw','ges','soz','pol','ls','fb'],
 lage:['Auf der Kreisstraße K 12 bei Eschenau (Kreis Breitental) ist ein Tankwagen mit Ammoniaklösung verunglückt. Der Tank ist undicht, die Flüssigkeit läuft aus und eine Gaswolke zieht bei Westwind in Richtung Ortsteil Neuhof.',
  'Die Freiwillige Feuerwehr Eschenau, der Rettungsdienst und die Polizei sind vor Ort. Es gibt die Unfallstelle, einen Dekontaminationsplatz und ein mögliches Evakuierungsgebiet: mehrere Einsatzstellen und mehrere Verbände.',
  'Der Einsatzleiter stuft die Lage als Großeinsatzlage ein und beschließt das Führen mit Führungsstab. Der Krisenstab wird einberufen.'],
 q:[['Betroffene','Wie viele Personen sind betroffen oder gefährdet?','Neuhof hat 410 Einwohner, dazu kommt eine Grundschule mit 160 Kindern. 15 Personen haben Reizgasverletzungen, 3 davon schwer.','k','Zahl der Betroffenen bestimmt Evakuierung und Meldepflicht (Evakuierung betrifft mehr als 50 Personen).'],
  ['Gefahrstoff','Welcher Stoff tritt in welcher Menge aus?','Ammoniaklösung (Frachtpapiere liegen vor), etwa 12 m³ im Tank. Das Leck ist nicht abgedichtet, es entsteht eine reizende und ätzende Gaswolke.','k','Art und Menge des Stoffes bestimmen Gefahrenbereich und Fachberater.'],
  ['Wetter / Prognose','Wie breitet sich die Wolke aus, wie entwickeln sich Wind und Wetter?','Wind aus West mit 3 m/s auf Neuhof, Windwechsel auf Nordost in etwa 6 Stunden. Ausbreitung bis 1,5 km erwartet.','k','Prognose und Annahmen (best, middle, worst case) sind Grundlage für Zeitstrahl und Rückwärtsplanung.'],
  ['Kräfte','Welche Kräfte für Gefahrstoffe, Messung und Dekontamination stehen bereit?','Der Gefahrstoffzug der Berufsfeuerwehr Breitental ist in 25 Minuten da, der ABC-Erkunder ist unterwegs. Eine Dekon-Einheit ist erst angefordert und wäre in etwa 2 Stunden da.','k','Kräfteübersicht und Nachforderung sind Sache der S1.'],
  ['Warnstatus','Wurde die Bevölkerung gewarnt?','Nein. Sirenen und Warn-App sind nicht ausgelöst. Einzelne Anwohner rufen bei der Leitstelle an.','k','Warnung der Bevölkerung gehört zu S5 beziehungsweise BuMA.'],
  ['KRITIS','Liegt kritische Infrastruktur im Gefahrenbereich?','Ein Trinkwasserbrunnen der Gemeinde liegt 500 m östlich, die Bahnstrecke verläuft direkt neben der Unfallstelle.','k','Kritische Infrastruktur verändert die Prioritäten und die Besetzung des Stabes.'],
  ['Presse','Wie ist das Medieninteresse?','Presse steht am Absperrband, Anwohnervideos kursieren online. Es wird nach der Schuldfrage gefragt.','k','Landesweites Medieninteresse ist meldepflichtig; Pressearbeit liegt bei S5 und BuMA.'],
  ['Zufahrten','Wie sind Absperrung und Zufahrten?','Die K 12 ist durch die Polizei gesperrt, die Zufahrt von Osten ist frei. Bereitstellungsraum ist der Parkplatz Gewerbepark Ost.','n','Wichtig, aber die Polizei hat bereits gesperrt und der Bereitstellungsraum ist benannt.'],
  ['Unterkunft','Gibt es Notunterkünfte?','Die Sporthalle Eschenau hat 250 Plätze.','n','Gehört zur Betreuung der Betroffenen, klärbar nach dem Entschluss zur Evakuierung.'],
  ['Versorgung','Wie ist die Ablösung der Einsatzkräfte geplant?','Bisher gibt es noch keinen Schichtplan.','n','Wichtig für S1 und S4, aber nachrangig zur akuten Gefahr.'],
  ['Fahrer','Ist der Fahrer ansprechbar?','Ja, leicht verletzt. Die Frachtpapiere liegen vor.','n','Hilft bei der Identifikation, die Papiere sind aber schon ausgewertet.'],
  ['Fahrzeug','Welche Marke hat der Tankwagen?','Ein gängiger Hersteller.','u','Die Marke ändert keine Entscheidung.'],
  ['Betrieb','Wie viele Mitarbeiter hat die Spedition?','Rund 60.','u','Hat mit der Gefahrenabwehr nichts zu tun.'],
  ['Schuldfrage','Wer ist schuld an dem Unfall?','Das ist unklar und Sache der Polizei.','u','Schuldfragen sind weder für die Entscheidung noch für die Pressearbeit relevant.'],
  ['Straße','Wann wurde die K 12 zuletzt neu asphaltiert?','Vor 6 Jahren.','u','Straßenhistorie hilft hier nicht.'],
  ['Statistik','Wie viele Unfälle gab es dort in den letzten zehn Jahren?','Etwa 20.','u','Statistik ohne Bezug zur aktuellen Lage.']],
 pa:[['Angst vor giftigem Gas und gesundheitlichen Folgen','b'],['Unklarheit: Bleiben oder gehen, Fenster schließen?','b'],['Eltern wollen sofort zur Grundschule, um ihre Kinder zu holen','b'],
  ['Die Anwohner haben keine offizielle Information und hören Gerüchte','b'],['Die Wolke zieht auf Neuhof; ein Windwechsel in 6 Stunden verändert den Gefahrenbereich','f'],
  ['Das Leck ist nicht abgedichtet, weitere Freisetzung ist möglich','f'],['Der Trinkwasserbrunnen 500 m entfernt kann verunreinigt werden','f'],['Gefahrstoffkräfte und Dekon-Kapazität sind begrenzt, eine Nachforderung ist nötig','f']],
 pr:[['Neuhof und die Grundschule (160 Kinder) aus dem Gefahrenbereich bringen (Wolke zieht jetzt dorthin)','p1','Gesundheit vieler Menschen (wichtig) und die Wolke erreicht Neuhof sofort (dringend).'],
  ['Die Bevölkerung im Gefahrenbereich sofort warnen und Verhaltenshinweise geben','p1','Schutz der Bevölkerung (wichtig) mit unmittelbarer Gefahr (dringend).'],
  ['Trinkwasserbrunnen schützen und ein Messprogramm für Wasser und Boden planen','p2','Wichtig, aber nicht unmittelbar dringend: der Windwechsel kommt erst in 6 Stunden.'],
  ['Ablösung und Schichtplanung für die Gefahrstoffkräfte vorbereiten','p2','Wichtig für Eigenschutz und Durchhaltefähigkeit, aber nicht dringend.'],
  ['Ein Radiosender will in 20 Minuten eine Telefonschalte ansetzen','p3','Dringend (Frist), aber nicht wichtig; die S5 kann es übernehmen.'],
  ['Statistik zur Unfallhäufigkeit auf der K 12 zusammenstellen','p4','Weder wichtig noch dringend: später prüfen oder löschen.'],
  ['Haftung und Schadensregulierung zwischen Spedition und Versicherung klären','nz','Das ist Sache der Beteiligten, nicht des Stabes.'],
  ['Die Windrichtung ändern','nb','Das Wetter kann der Stab nicht beeinflussen.']],
 og:[['S2 Lage: Messwerte auswerten, Lagekarte, Einsatztagebuch','el','S2 ist Sachgebiet der Einsatzleitung (Lagefeststellung, Lagedarstellung, Dokumentation).'],
  ['S4 Versorgung: Schutzausrüstung, Atemschutz, Verbrauchsgüter, Eigenschutz','el','S4 ist Sachgebiet der Einsatzleitung (Verbrauchsgüter, Atemschutzgeräte, Eigenschutz).'],
  ['Fachberater Gefahrstoffe (Gefahrstoffzug, Chemiker)','el','Fachberater gehören zur Einsatzleitung; S1 fordert fach- und betriebskundige Personen an.'],
  ['Einsatzabschnitt Gefahrenbereich und Dekontamination','ea'],['Einsatzabschnitt Evakuierung Neuhof','ea'],
  ['BuMA: Warnung der Bevölkerung, Medienarbeit, Bürgertelefon','ks','Die BuMA ist Teil des Krisenstabs; Warnung geht auf sie über.'],
  ['Amt Umwelt: Trinkwasser, Boden und Gewässer','ks','Umwelt ist ständiges Mitglied im Krisenstab.'],
  ['Verbindungsperson Polizei (Absperrung, Verkehr)','ks','Die Polizei ist ständiges externes Mitglied im Krisenstab; Verbindungspersonen externer Stellen eher dort.'],
  ['KGS Innerer Dienst: Alarmierung der Stabsmitglieder, Stabsräume','ks','Der Innere Dienst gehört zur Koordinierungsgruppe Stab im Krisenstab.'],
  ['Fachberater Hochwasserschutz','x','Es gibt kein Hochwasser; ein solcher Fachberater hätte keine Aufgabe.']],
 fzw:'Mehrere Verbände und mehrere Einsatzstellen (Unfallstelle, Dekon-Platz, Evakuierungsgebiet): Führungsstufe D. Bei Großeinsatzlage folgt das Zwei-Stäbe-Modell.',
 km:[['09:05 Uhr: Das Geschehen ist eine Großeinsatzlage, mehr als 50 Personen müssen evakuiert werden. Der Krisenstab arbeitet noch nicht.','sofort','el-ls','Meldepflichtiges Ereignis: Sofortmeldung über die Leitstelle innerhalb von 30 Minuten, mit qualifizierter Rückmeldung des Einsatzleiters.'],
  ['11:30 Uhr: Der Krisenstab arbeitet. Der Gefahrenbereich muss wegen veränderter Ausbreitung deutlich erweitert werden.','folge','ks-vor','Wesentliche Lageänderung: Folgemeldung; mit Arbeitsaufnahme des Krisenstabes geht die Meldepflicht auf ihn über.'],
  ['Der Krisenstab beschließt die Räumung. Die Bevölkerung soll gewarnt werden: Gebiet verlassen, Fenster und Türen schließen.','info','buma-bev','Warnung und Information der Bevölkerung geht komplett auf den Krisenstab, die BuMA, über.'],
  ['Journalisten am Absperrband verlangen Auskünfte und fragen nach der Schuld des Fahrers.','info','buma-pr','Die BuMA übernimmt die Pressearbeit (S5 untersteht ihr). Keine Aussagen zu Schuldfragen, wahrheitsgetreu antworten.'],
  ['Tag 2: Das Leck ist abgedichtet, das Gebiet freigegeben, der Einsatz beendet.','schluss','ks-vor','Die Schlussmeldung ist in der Regel die letzte Folgemeldung; der Krisenstab meldet.']],
 au:[{t:'Evakuierung Neuhof und Grundschule',ctx:'Gefahr im Verzug: Die Wolke erreicht Neuhof in kurzer Zeit. Unverzüglich handeln. Der Auftrag wird neu erteilt.',wer:['s3'],mit:['pol','soz'],
   was:['Neuhof und Grundschule räumen, Betreuungsstelle Sporthalle Eschenau einrichten','Nur die Schule räumen, Anwohner bleiben ohne Information','Abwarten, bis alle Messwerte vorliegen','Die Betroffenen fahren selbst über die K 12 ab'],
   bis:'sofort',st:'offen',why:'S3 veranlasst Sofortmaßnahmen zum Schutz der Bevölkerung, die Polizei sperrt ab, Soziales betreut die Betroffenen.'},
  {t:'Trinkwasserbrunnen schützen und messen',ctx:'Der Windwechsel kommt in 6 Stunden; das Messprogramm muss bis dahin stehen. Der Auftrag wird neu erteilt.',wer:['umw'],mit:['fb','s2'],
   was:['Brunnen vorsorglich abschalten, Wasserproben und Messungen durch die Gefahrstoffkräfte veranlassen','Brunnen weiterbetreiben und Messwerte abwarten','Nur die Bevölkerung warnen, Wasser nicht zu trinken, Brunnen aber laufen lassen','Den Brunnen erst nach dem Abdichten des Lecks prüfen'],
   bis:'6h',st:'offen',why:'Umwelt ist Fachamt im Krisenstab (Trinkwasser, Boden, Gewässer); Fachberater und S2 liefern Messwerte und Bewertung.'},
  {t:'Dekon-Einheit nachfordern',ctx:'Die Dekon-Einheit soll in 2 Stunden bereitstehen. Die Anforderung läuft bereits.',wer:['s1'],mit:['ls'],
   was:['Dekon-Einheit über die Leitstelle anfordern und im Bereitstellungsraum Gewerbepark Ost aufnehmen','Die Einheit direkt an die Unfallstelle schicken, ohne Bereitstellungsraum','Dekontamination später prüfen, erst das Leck beobachten','Keine Anforderung, nur eigene Kräfte einsetzen'],
   bis:'2h',st:'bearb',why:'S1 stellt Kräfte bereit und richtet Bereitstellungsräume ein; die Anforderung läuft über die Leitstelle. Der Status ist „in Bearbeitung“.'}],
 ff:{t:'Schutz von Trinkwasser, Boden und Gewässer',r:'umw',why:'Das Fachamt Umwelt ist ständiges Mitglied im Krisenstab und fachlich zuständig.'},
 tm:{o:'30',n:'Der erste Auftrag (Evakuierung) ist unverzüglich auszuführen. Die Dynamik ist hoch, der Stab will den Vollzug zeitnah kontrollieren.'}},

{id:'st',n:'Großflächiger Stromausfall',kz:'Netzstörung im Winter, 85.000 Einwohner ohne Strom, Dauer unklar.',zt:'Mittwoch, 04:10 Uhr',fb:'Fachberater Netzbetreiber',
 roles:['s1','s3','s4','s6','buma','lds','so','ges','soz','pol','ls','fb'],
 lage:['Eine Störung im Hochspannungsnetz hat im Kreis Lindenfeld einen großflächigen Stromausfall ausgelöst. Etwa 85.000 Einwohner sind ohne Strom. Es herrschen minus 6 Grad.',
  'Der Netzbetreiber kann die Dauer nicht einschätzen. Ampeln, Aufzüge und Heizungen fallen aus, Leitstelle und Krankenhaus laufen auf Notstrom. Die Feuerwehr zählt viele Einsätze an mehreren Stellen im Kreis.',
  'Es gibt keine Gefahrstofflage. Der Einsatzleiter und der Landrat (HVB) stufen die Lage als Großeinsatzlage ein: mehrere Verbände, mehrere Einsatzstellen, erheblicher Koordinierungsbedarf.'],
 q:[['Betroffene','Wie viele besonders gefährdete Personen gibt es?','Rund 85.000 Einwohner sind betroffen, etwa 1.200 Personen sind auf Beatmung oder Pflege zu Hause angewiesen. Drei Pflegeheime haben keinen Notstrom.','k','Zahl und Art der Betroffenen bestimmen den Schwerpunkt der Hilfe.'],
  ['Prognose','Wie lange dauert der Ausfall voraussichtlich?','Der Netzbetreiber rechnet mit einer schrittweisen Wiederversorgung ab etwa 12 Stunden, einzelne Gebiete länger. Worst case: über 24 Stunden.','k','Prognose und Annahmen (best, middle, worst case) sind die Grundlage für den Zeitstrahl.'],
  ['Kräfte','Welche Kräfte stehen noch zur Verfügung?','Die Feuerwehr ist zu 60 % gebunden (Aufzugsbefreiungen, Hilfeleistungen). Die Reserve ist 1 Löschzug, gegenseitige Hilfe ist möglich.','k','Kräfteübersicht und Reserven sind Sache der S1.'],
  ['Warnstatus','Wie erreicht man die Bevölkerung, ist schon gewarnt worden?','Nein. Die Mobilfunkmasten laufen noch etwa 4 Stunden auf Akku, die Sirenen sind nur teilweise batteriegepuffert. Radio per Notstrom sendet.','k','Warnung und Information der Bevölkerung (S5, BuMA) muss auf ausfallsichere Wege setzen.'],
  ['KRITIS Gesundheit','Wie sieht es bei Krankenhaus und Pflege aus?','Das Krankenhaus hat Diesel für 24 Stunden, die Nachbetankung ist nicht geklärt. Drei Pflegeheime ohne Notstrom haben noch etwa 6 Stunden Akkulaufzeit der Geräte.','k','Kritische Infrastruktur verändert Priorisierung und Besetzung des Stabes.'],
  ['KRITIS Versorgung','Wie sind Wasser, Tankstellen und Kommunikation betroffen?','Das Wasserwerk läuft auf Notstrom, Tankstellen sind ohne Strom, Mobilfunk fällt in 4 Stunden aus.','k','Versorgung und Kommunikation sind Voraussetzung für Einsatzführung und Meldewesen.'],
  ['Presse','Wie groß ist das Medieninteresse?','Landesweite Medien berichten bereits. Es wird nach Verhaltenshinweisen und Prognosen gefragt.','k','Landesweites Medieninteresse ist meldepflichtig; Pressearbeit liegt bei S5 und BuMA.'],
  ['Wetter','Wie ist die Wetterlage?','Dauerfrost, minus 6 Grad, in der Nacht fallend.','n','Nützlich für Wärmestuben, aber schon in der Lage genannt.'],
  ['Material','Wie viele Notstromaggregate sind verfügbar?','Der Kreis hat 14 Aggregate, das THW weitere 6.','n','Wichtig für S4, aber erst nach der Priorisierung zu klären.'],
  ['Verkehr','Wie ist die Lage auf den Straßen?','Ampeln sind ausgefallen, die Polizei regelt den Verkehr an Kreuzungen.','n','Wird bereits von der Polizei bearbeitet; nachrangig für den Stab.'],
  ['Unterkunft','Gibt es beheizbare Anlaufstellen?','Zwei Turnhallen mit Notstromanschluss sind vorgeplant.','n','Hilfreich für die Betreuung, klärbar nach dem Entschluss.'],
  ['Betreiber','Wer sind die Aktionäre des Netzbetreibers?','Mehrere Stadtwerke und Investoren.','u','Hat mit der Lagebewältigung nichts zu tun.'],
  ['Preis','Wie hoch ist der aktuelle Strompreis?','Das ist an der Börse tagesabhängig.','u','Der Preis ändert keine Entscheidung.'],
  ['Energie','Wie viele Windräder stehen im Kreis?','Etwa 45.','u','Hilft bei der Lagebewältigung nicht.'],
  ['Historie','Wann gab es den letzten Stromausfall im Kreis?','Vor 12 Jahren.','u','Historie ersetzt keine aktuelle Prognose.'],
  ['Betrieb','Wie viele Mitarbeiter hat der Netzbetreiber?','Rund 800.','u','Hat mit der Lagebewältigung nichts zu tun.']],
 pa:[['Angst, in der Kälte ohne Heizung und Licht zu sein','b'],['Unsicherheit: Wie lange dauert es, wohin kann ich mich wenden?','b'],['Menschen mit Beatmungsgerät fürchten um ihr Leben','b'],
  ['Die Betroffenen können nicht telefonieren und wissen nicht, wie sie Hilfe rufen','b'],['Der Dieselvorrat des Krankenhauses reicht nur 24 Stunden, die Nachbetankung ist offen','f'],
  ['Die Mobilfunkmasten fallen in 4 Stunden aus, die Kommunikation der Kräfte muss gesichert werden','f'],['Die Feuerwehr ist zu 60 % gebunden, die Reserve ist knapp','f'],
  ['Pflegeheime ohne Notstrom brauchen Aggregate und Heizung, sonst entsteht Gefahr für die Bewohner','f']],
 pr:[['Menschen mit Beatmungsgerät und Pflege zu Hause versorgen (Akkus halten etwa 6 Stunden)','p1','Lebensbedrohung (wichtig) mit knapper Frist (dringend).'],
  ['Drei Pflegeheime ohne Notstrom bei minus 6 Grad mit Aggregaten und Heizung versorgen','p1','Gefahr für hilfebedürftige Menschen (wichtig) bei Kälte (dringend).'],
  ['Die Nachbetankung des Krankenhauses (Diesel für 24 Stunden) planen','p2','Wichtig, aber nicht dringend: der Vorrat reicht noch 24 Stunden.'],
  ['Schichtplanung und Ablösung der Kräfte für die nächsten 48 Stunden vorbereiten','p2','Wichtig für Durchhaltefähigkeit, aber nicht dringend.'],
  ['Ein Radiosender will in 15 Minuten eine Schalte zum Thema „Tipps für zu Hause“ besprechen','p3','Dringend (Frist), aber nicht wichtig; die S5 kann es erledigen.'],
  ['Eine Schulklasse fragt nach einer Wehrbesichtigung im nächsten Jahr','p4','Weder wichtig noch dringend: später prüfen oder löschen.'],
  ['Reparatur der Hochspannungsleitung durch den Netzbetreiber','nz','Das ist Aufgabe des Netzbetreibers, nicht des Stabes.'],
  ['Die Außentemperatur von minus 6 Grad anheben','nb','Das Wetter kann der Stab nicht beeinflussen.']],
 og:[['S1 Personal / Innerer Dienst: Kräfte, Reserven, Bereitstellungsraum','el','S1 ist Sachgebiet der Einsatzleitung.'],
  ['S4 Versorgung: Kraftstoffe, Notstromaggregate, Verbrauchsgüter','el','S4 ist Sachgebiet der Einsatzleitung (Kraftstoffe, Hilfsmittel).'],
  ['S6 IuK: Funknetz und Kommunikationskonzept bei Mobilfunkausfall','el','S6 plant die Fernmeldeorganisation und das Kommunikationskonzept der Einsatzleitung.'],
  ['Fachberater Netzbetreiber (Energieversorger)','el','Fachberater gehören zur Einsatzleitung; S1 fordert fach- und betriebskundige Personen an.'],
  ['Einsatzabschnitt Notstromversorgung Pflegeeinrichtungen','ea'],['Einsatzabschnitt Anlaufstellen und Wärmestuben','ea'],
  ['BuMA: Bürgertelefon und Information bei Ausfall der Kommunikation','ks','Die BuMA ist Teil des Krisenstabs; Bürgertelefon und Information der Bevölkerung gehen auf sie über.'],
  ['Amt Gesundheit: Krankenhäuser und Pflegeeinrichtungen','ks','Gesundheit ist ständiges Mitglied im Krisenstab.'],
  ['Verbindungsperson Polizei (Verkehrsregelung bei ausgefallenen Ampeln)','ks','Die Polizei ist ständiges externes Mitglied im Krisenstab; Verbindungspersonen externer Stellen eher dort.'],
  ['Fachberater Gefahrstoffe','x','Es gibt keine Gefahrstofflage; der Fachberater hätte keine Aufgabe.']],
 fzw:'Mehrere Verbände und mehrere Einsatzstellen (Führungsstufe D). Bei Großeinsatzlage mit erheblichem Koordinierungsbedarf gilt das Zwei-Stäbe-Modell.',
 km:[['05:00 Uhr: Großeinsatzlage mit betroffener Kritischer Infrastruktur. Der Krisenstab arbeitet noch nicht.','sofort','el-ls','Meldepflichtiges Ereignis (Großeinsatzlage): Sofortmeldung über die Leitstelle, max. 30 Minuten nach Bekanntwerden.'],
  ['10:00 Uhr: Der Krisenstab arbeitet. Der Netzbetreiber meldet, dass die Wiederversorgung länger als 24 Stunden dauern wird (wesentliche Lageänderung).','folge','ks-vor','Wesentliche Lageänderung: Folgemeldung durch den Krisenstab, der die Meldepflicht übernommen hat.'],
  ['Die Mobilfunkmasten fallen aus. Die Bevölkerung soll über Radio, Lautsprecher und Anlaufstellen informiert werden.','info','buma-bev','Die BuMA übernimmt Warnung und Information der Bevölkerung und das Bürgertelefon.'],
  ['Die Polizei meldet, dass an mehreren Kreuzungen der Verkehr nicht mehr sicher geregelt werden kann. Sie hat eine eigene Einsatzleitung und schickt eine Person zur Abstimmung.','info','vp','Die Polizei hat eine eigene Einsatzleitung und fungiert über eine Verbindungsperson im Stab, eher im Krisenstab.'],
  ['Tag 2: Die Stromversorgung ist wieder hergestellt, der Einsatz ist beendet.','schluss','ks-vor','Die Schlussmeldung ist in der Regel die letzte Folgemeldung; der Krisenstab meldet.']],
 au:[{t:'Notstrom für drei Pflegeheime',ctx:'Die Akkus der Pflegegeräte halten noch etwa 8 Stunden. Frist: in 6 Stunden müssen Aggregate laufen. Der Auftrag wird neu erteilt.',wer:['s3'],mit:['s4','ges'],
   was:['Notstromaggregate zu den drei Heimen bringen und anschließen, Heizung sichern','Die Bewohner ohne Aggregate in ihren Zimmern lassen','Nur Decken verteilen und abwarten','Warten, bis der Netzbetreiber den Strom wieder anschaltet'],
   bis:'6h',st:'offen',why:'S3 veranlasst die Maßnahme, S4 stellt Aggregate und Kraftstoffe, Gesundheit kennt die Einrichtungen.'},
  {t:'Kraftstoffversorgung für Notstromaggregate',ctx:'Der Dieselvorrat des Krankenhauses reicht 24 Stunden. Die Nachbetankung muss spätestens dann eintreffen. Der Auftrag wird neu erteilt.',wer:['s4'],mit:['ges','ls'],
   was:['Nachbetankung für Krankenhaus, Leitstelle und Aggregate organisieren und Zeitstrahl erstellen','Auf die Rückkehr des Stroms warten','Nur das Krankenhaus informieren, selbst zu tanken','Die Bevölkerung auffordern, Diesel zu spenden'],
   bis:'24h',st:'offen',why:'S4 ist für Kraftstoffe und Verbrauchsgüter zuständig; Rückwärtsplanung vom Ende des Vorrats.'},
  {t:'Kommunikation für Kräfte und Anlaufstellen',ctx:'Die Mobilfunkmasten fallen in 4 Stunden aus. Bis dahin sollen Funk und Anlaufstellen stehen: Frist 2 Stunden. Die Arbeit hat bereits begonnen.',wer:['s6'],mit:['s3'],
   was:['Kommunikationskonzept mit eindeutigen Bezeichnungen der Abschnitte und Funkanbindung der Anlaufstellen aufstellen','Auf Mobilfunk setzen und bei Ausfall neu planen','Nur Kuriere einsetzen, ohne Funk','Nichts tun, der Mobilfunk wird noch laufen'],
   bis:'2h',st:'bearb',why:'S6 plant die Fernmeldeorganisation und das Kommunikationskonzept; S3 oder S6 schaffen die Kommunikation. Status: in Bearbeitung.'}],
 ff:{t:'Versorgung der Krankenhäuser und Pflegeeinrichtungen',r:'ges',why:'Das Amt Gesundheit ist ständiges Mitglied im Krisenstab und kennt Einrichtungen und Bedarfe.'},
 tm:{o:'2h',n:'Der Auftrag zur Kommunikation ist in 2 Stunden fällig. Der Stab will dazu die Rückmeldung besprechen.'}},

{id:'br',n:'Großbrand in Industrieanlage',kz:'Lagerhalle in Vollbrand, Rauchwolke auf Wohngebiet, Löschwasser knapp.',zt:'Freitag, 13:30 Uhr',fb:'Fachberater Chemie (Werkfeuerwehr)',
 roles:['s1','s2','s3','s4','s5','buma','lds','umw','so','pol','ls','fb'],
 lage:['Im Industriegebiet Rothenfeld (Kreis Ostfeld) steht eine 12.000 m² große Lagerhalle der Kunststoffwerke Rothenfeld in Vollbrand. Eine dichte Rauchsäule zieht bei Nordwestwind in Richtung Wohngebiet Rothenfeld-Süd.',
  'Die Werkfeuerwehr und mehrere Feuerwehren des Kreises sind an mehreren Einsatzstellen aktiv. Löschwasser ist knapp, die Löschwasserrückhaltung reicht nicht. Der Weidenbach liegt in der Nähe des Werks.',
  'Der Einsatzleiter stuft die Lage als Großeinsatzlage ein und führt mit Führungsstab. Der Krisenstab wird einberufen.'],
 q:[['Betroffene','Wie viele Menschen sind betroffen?','Im Wohngebiet Rothenfeld-Süd leben 2.800 Einwohner, dazu zwei Kitas. Von 120 Beschäftigten sind 118 am Sammelplatz, 2 werden vermisst.','k','Zahl der Betroffenen und Vermisste bestimmen Schwerpunkt und Meldepflicht (Evakuierung betrifft mehr als 50 Personen).'],
  ['Lagergut','Was lagert in der Halle?','Kunststoffgranulat und Lösemittelfässer, in Halle 2 liegen Acetylenflaschen. Das Feuer kann auf Halle 3 übergreifen.','k','Art des Brandguts bestimmt Gefahren und Fachberater (betriebskundige Personen anfordern).'],
  ['Prognose','Wie entwickeln sich Brand und Wind?','Der Brand dauert voraussichtlich mehr als 12 Stunden. Der Wind dreht in etwa 3 Stunden auf Südwest. Worst case: Übergriff auf Halle 3.','k','Prognose und Annahmen (best, middle, worst case) sind Grundlage für Zeitstrahl und Rückwärtsplanung.'],
  ['Kräfte','Welche Kräfte und welches Löschwasser stehen zur Verfügung?','Löschwasser reicht nur für 2 Stunden, die Kräfte sind nach 2 Stunden erschöpft. Die gegenseitige Hilfe ist möglich, die Werkfeuerwehr ist im Einsatz.','k','Kräfteübersicht und Nachforderung sind Sache der S1, Löschmittel Sache der S4.'],
  ['Warnstatus','Wurde die Bevölkerung gewarnt?','Nein. Warn-App und Sirenen wurden noch nicht ausgelöst.','k','Warnung der Bevölkerung gehört zu S5 beziehungsweise BuMA.'],
  ['KRITIS','Liegt kritische Infrastruktur in der Nähe?','Eine Gasleitung verläuft am Werk, das Wasserwerk liegt 1 km flussabwärts am Weidenbach.','k','Kritische Infrastruktur verändert Priorisierung und Zusammensetzung des Stabes.'],
  ['Presse','Wie ist das Medieninteresse?','Fernsehteams und Drohnen sind vor Ort, landesweite Berichterstattung ist angekündigt.','k','Landesweites Medieninteresse ist meldepflichtig; Pressearbeit liegt bei S5 und BuMA.'],
  ['Zufahrten','Welche Zufahrten sind frei?','Die Zufahrt von Süden ist frei, im Norden ist die Werkstraße blockiert. Bereitstellungsraum ist der Parkplatz Süd.','n','Wichtig, aber die Zufahrten sind schon geordnet.'],
  ['Wetter','Wie ist das Wetter?','Trocken, 22 Grad.','n','Nützlich, der Wind steckt schon in der Prognose.'],
  ['Versorgung','Wie ist die Verpflegung der Einsatzkräfte?','Die Verpflegung ist noch nicht angefordert.','n','Wichtig für S4, aber nachrangig gegenüber der akuten Gefahr.'],
  ['Betreuung','Gibt es Betreuungsplätze?','Die Stadthalle hat 300 Plätze.','n','Hilfreich, klärbar nach dem Entschluss zur Warnung oder Räumung.'],
  ['Wirtschaft','Wie hoch ist der Jahresumsatz der Firma?','Rund 80 Millionen Euro.','u','Hat mit der Lagebewältigung nichts zu tun.'],
  ['Historie','Wann wurde die Halle gebaut?','Vor 30 Jahren.','u','Baujahr ändert keine Entscheidung.'],
  ['Sponsoring','Welche Vereine sponsert die Firma?','Zwei Sportvereine.','u','Hat mit der Gefahrenabwehr nichts zu tun.'],
  ['Börse','Wie ist der Aktienkurs der Firma?','Das ist tagesabhängig.','u','Kein Einfluss auf Entscheidungen im Stab.'],
  ['Technik','Welche Marke hat das Löschfahrzeug der Werkfeuerwehr?','Ein gängiger Hersteller.','u','Die Marke ändert keine Entscheidung.']],
 pa:[['Angst vor giftigem Rauch und gesundheitlichen Folgen','b'],['Eltern wollen ihre Kinder aus den Kitas holen','b'],['Unklarheit: Fenster schließen oder gehen?','b'],
  ['Beschäftigte fürchten um ihre Arbeitsplätze und um vermisste Kollegen','b'],['Die Rauchwolke zieht auf Rothenfeld-Süd, die Schadstoffe sind unklar und müssen gemessen werden','f'],
  ['Löschwasser ist knapp und die Rückhaltung reicht nicht: Gefahr für den Weidenbach','f'],['Acetylenflaschen in Halle 2 bedeuten Explosionsgefahr und mögliche Brandausbreitung auf Halle 3','f'],
  ['Kräfte sind nach 2 Stunden erschöpft, Ablösung und Atemschutz fehlen','f']],
 pr:[['Rothenfeld-Süd (2.800 Einwohner, 2 Kitas) warnen: Fenster und Türen schließen, Hinweise geben','p1','Gesundheit vieler Menschen (wichtig), Rauch zieht jetzt auf das Gebiet (dringend).'],
  ['Den Gefahrenbereich um Halle 2 (Acetylenflaschen) absperren und Kräfte zurücknehmen','p1','Eigenschutz und Explosionsgefahr: wichtig und dringend.'],
  ['Löschwasserrückhaltung und Schutz des Weidenbachs und des Wasserwerks planen','p2','Wichtig, aber erst in einigen Stunden dringend.'],
  ['Nachforderung von Kräften und Atemschutz für einen Brand über 12 Stunden kalkulieren','p2','Wichtig für die Durchhaltefähigkeit, aber nicht unmittelbar dringend.'],
  ['Ein Fernsehsender will in 15 Minuten einen Live-Interviewtermin vereinbaren','p3','Dringend (Frist), aber nicht wichtig; die S5 kann es übernehmen.'],
  ['Brandgeschichte der Firma für ein Archiv zusammenstellen','p4','Weder wichtig noch dringend: später prüfen oder löschen.'],
  ['Brandursachenermittlung','nz','Das ist Sache der Polizei und Brandermittler, nicht des Stabes.'],
  ['Den Wind dauerhaft von Rothenfeld-Süd wegdrehen','nb','Das Wetter kann der Stab nicht beeinflussen.']],
 og:[['S3 Einsatz: Lage beurteilen, Entschluss, Befehle','el','S3 ist Sachgebiet der Einsatzleitung.'],
  ['S4 Versorgung: Löschmittel, Löschwasser, Atemschutzgeräte, Eigenschutz','el','S4 ist Sachgebiet der Einsatzleitung (Löschmittel, Atemschutzgeräte, Wasserversorgung).'],
  ['Fachberater Chemie (Werkfeuerwehr, betriebskundige Person)','el','Fachberater gehören zur Einsatzleitung; S1 fordert betriebskundige Personen an.'],
  ['Einsatzabschnitt Brandbekämpfung Halle 2 und 3','ea'],['Logistikabschnitt Löschwasser und Atemschutz','ea','Befehlsgebung im Logistikabschnitt: ein Einsatzabschnitt unter S4.'],
  ['BuMA: Warnung der Bevölkerung, Bürgertelefon, Medienarbeit','ks','Die BuMA ist Teil des Krisenstabs; Warnung geht auf sie über.'],
  ['Amt Umwelt: Löschwasser, Gewässerschutz, Messungen','ks','Umwelt ist ständiges Mitglied im Krisenstab.'],
  ['KGS Lage und Dokumentation: Lagebild, Einsatztagebuch des Stabes','ks','Lage und Dokumentation gehört zur Koordinierungsgruppe Stab im Krisenstab.'],
  ['Verbindungsperson Polizei (Absperrung, Verkehr, Ermittlungen)','ks','Die Polizei ist ständiges externes Mitglied im Krisenstab; Verbindungspersonen externer Stellen eher dort.'],
  ['Fachberater Hochwasserschutz','x','Es gibt kein Hochwasser; der Fachberater hätte keine Aufgabe.']],
 fzw:'Mehrere Verbände und mehrere Einsatzstellen (Führungsstufe D). Bei Großeinsatzlage folgt die Unterteilung in Einsatzleitung und Krisenstab.',
 km:[['14:00 Uhr: Brandtote sind nicht bekannt, aber mehr als 50 Personen sind betroffen, Großeinsatzlage, landesweites Medieninteresse. Der Krisenstab arbeitet noch nicht.','sofort','el-ls','Meldepflichtiges Ereignis: Sofortmeldung über die Leitstelle innerhalb von 30 Minuten, mit qualifizierter Rückmeldung des Einsatzleiters.'],
  ['16:30 Uhr: Der Krisenstab arbeitet. Der Brand greift auf Halle 3 über (wesentliche Lageänderung).','folge','ks-vor','Wesentliche Lageänderung: Folgemeldung durch den Krisenstab, der die Meldepflicht übernommen hat.'],
  ['Der Krisenstab entscheidet, die Bevölkerung in Rothenfeld-Süd zu warnen und ein Bürgertelefon einzurichten.','info','buma-bev','Die BuMA übernimmt Warnung der Bevölkerung und richtet das Bürgertelefon ein.'],
  ['Der Wind dreht auf Südwest. Die Einsatzabschnitte müssen die neue Lage und den geänderten Gefahrenbereich erfahren.','info','s2-ea','Unterrichten nachgeordneter Stellen wie der Einsatzabschnitte ist Aufgabe der S2.'],
  ['Tag 2: Der Brand ist aus, die Nachlöscharbeiten sind abgeschlossen, der Einsatz ist beendet.','schluss','ks-vor','Die Schlussmeldung ist in der Regel die letzte Folgemeldung; der Krisenstab meldet.']],
 au:[{t:'Warnung und Information Rothenfeld-Süd',ctx:'Der Rauch erreicht das Wohngebiet in wenigen Minuten. Unverzüglich handeln. Der Auftrag wird neu erteilt.',wer:['buma'],mit:['s5','so'],
   was:['Warnung über Sirenen und Warn-App mit Verhaltenshinweisen, Bürgertelefon einrichten','Nur eine Pressemitteilung nach dem Brandende','Keine Warnung, erst Messwerte abwarten','Nur die Betriebsangehörigen informieren'],
   bis:'sofort',st:'offen',why:'Die BuMA übernimmt nach Einberufung des Krisenstabes die Warnung der Bevölkerung; S5 untersteht ihr.'},
  {t:'Löschwasserrückhaltung und Gewässerschutz',ctx:'Das Löschwasser erreicht die Rückhaltung in etwa 6 Stunden. Bis dahin müssen Maßnahmen stehen. Der Auftrag wird neu erteilt.',wer:['s3','umw'],mit:['umw','fb','s4'],
   was:['Rückhaltung erweitern, Weidenbach und Wasserwerk schützen, Messungen veranlassen','Das Löschwasser ungehindert abfließen lassen','Nur den Wasserversorger informieren','Die Maßnahmen erst nach dem Brandende planen'],
   bis:'6h',st:'offen',why:'Umwelt ist Fachamt im Krisenstab; S3 und Fachberater setzen vor Ort um.'},
  {t:'Ablösung und Atemschutz nachfordern',ctx:'Die ersten Kräfte sind in 2 Stunden erschöpft; die Ablösung muss dann eintreffen. Die Anforderung läuft bereits.',wer:['s1'],mit:['s4','ls'],
   was:['Ablösung über die Leitstelle und gegenseitige Hilfe anfordern, Bereitstellungsraum Parkplatz Süd nutzen, Atemschutz durch S4 planen','Kräfte im Einsatz lassen, bis sie von selbst ausfallen','Ablösung erst in der Nacht anfordern','Freiwillige aus der Bevölkerung einsetzen'],
   bis:'2h',st:'bearb',why:'S1 stellt Kräfte bereit, S4 versorgt mit Atemschutz und Verpflegung. Status: in Bearbeitung.'}],
 ff:{t:'Schutz von Gewässer und Löschwasserrückhaltung',r:'umw',why:'Das Fachamt Umwelt ist ständiges Mitglied im Krisenstab und fachlich zuständig.'},
 tm:{o:'2h',n:'Der Auftrag zur Ablösung ist in 2 Stunden fällig. Der Stab will dazu die Rückmeldung besprechen.'}}
];
SC.forEach(s=>{s.au.forEach(a=>{a.rue=['erl','sitz'];});});

/* ---------- Hilfen ---------- */
const BUDGET=8,MAXP=[20,20,20,20,20];
const PHN=['Erkundung','Beurteilung','Organisation','Kommunikation','Entschluss'];
const STEPNAME={lage:'Lagemeldung',erk:'Erkundung',pa:'Lagebeurteilung: Problemanalyse',pr:'Lagebeurteilung: Priorisierung',org:'Organisationsschema',kom:'Kommunikationsschema',auf:'Entschluss und Auftragsvergabe',aus:'Auswertung'};
const PHASE={lage:0,erk:1,pa:2,pr:2,org:3,kom:4,auf:5,aus:6};
const PLAB=['Lage','Erkundung','Beurteilung','Organisation','Kommunikation','Entschluss','Auswertung'];
const KEY='bvi_sim_planspiel';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function lab(list,id){const f=list.find(x=>x[0]===id);return f?f[1]:'–';}
function rl(id,sc){return id==='fb'?sc.fb:RL[id];}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {};}}
function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}

/* ---------- Zustand ---------- */
let S=null,tab='ueben';
function newRun(i){
  const sc=SC[i];
  S={i,sc,step:'lage',chk:{},asked:[],ans:{pa:{},pr:{},org:{},kom:{},auf:[{},{},{}],ff:null,tm:null,fz:null},sub:{},
   ord:{q:shuffle(sc.q.map((_,k)=>k)),pa:shuffle(sc.pa.map((_,k)=>k)),pr:shuffle(sc.pr.map((_,k)=>k)),og:shuffle(sc.og.map((_,k)=>k)),
        was:sc.au.map(()=>shuffle([0,1,2,3])),roles:shuffle(sc.roles)},done:false};
}

/* ---------- Wertung ---------- */
function scErk(){const sc=S.sc;let k=0,u=0,K=0;sc.q.forEach(q=>{if(q[3]==='k')K++;});S.asked.forEach(j=>{const r=sc.q[j][3];if(r==='k')k++;if(r==='u')u++;});
  return {k,u,K,pts:Math.max(0,Math.round(20*k/K-3*u))};}
function scPA(){let c=0;S.sc.pa.forEach((p,j)=>{if(S.ans.pa[j]===p[1])c++;});return {c,n:S.sc.pa.length,pts:8*c/S.sc.pa.length};}
function scPR(){let c=0;S.sc.pr.forEach((p,j)=>{if(S.ans.pr[j]===p[1])c++;});return {c,n:S.sc.pr.length,pts:12*c/S.sc.pr.length};}
function scOG(){let c=0;S.sc.og.forEach((p,j)=>{if(S.ans.org[j]===p[1])c++;});const f=S.ans.fz==='zwei'?1:0;return {c,n:S.sc.og.length,f,pts:3*f+17*c/S.sc.og.length};}
function scKM(){let a=0,w=0;S.sc.km.forEach((p,j)=>{const x=S.ans.kom[j]||{};if(x.art===p[1])a++;if(x.weg===p[2])w++;});const n=S.sc.km.length;return {a,w,n,pts:10*a/n+10*w/n};}
function auOK(j){const a=S.sc.au[j],x=S.ans.auf[j]||{};return {wer:a.wer.indexOf(x.wer)>=0,mit:a.mit.indexOf(x.mit)>=0,was:x.was===0,bis:x.bis===a.bis,rue:a.rue.indexOf(x.rue)>=0,st:x.st===a.st};}
function scAU(){let c=0,n=0;S.sc.au.forEach((a,j)=>{const o=auOK(j);Object.keys(o).forEach(k=>{n++;if(o[k])c++;});});
  const f=S.ans.ff===S.sc.ff.r?1:0,t=S.ans.tm===S.sc.tm.o?1:0;return {c,n,f,t,pts:16*c/n+2*f+2*t};}
function phasePts(){
  const e=scErk(),p=scPA(),r=scPR(),o=scOG(),k=scKM(),a=scAU();
  return [e.pts,Math.round(p.pts+r.pts),Math.round(o.pts),Math.round(k.pts),Math.round(a.pts)];
}

/* ---------- Bausteine ---------- */
function chipRow(g,k,f,opts,cur,sol,checked,ok){
  return '<div class="chips">'+opts.map(o=>{
    let c='chip';
    if(checked){ if(o[0]===cur)c+=ok?' ok':' bad'; else if(!ok&&sol.indexOf(o[0])>=0)c+=' sol'; }
    else if(o[0]===cur)c+=' on';
    return '<button class="'+c+'" '+(checked?'disabled ':'')+'data-a="set" data-g="'+g+'" data-k="'+k+'"'+(f?' data-f="'+f+'"':'')+' data-v="'+o[0]+'">'+esc(o[1])+'</button>';
  }).join('')+'</div>';
}
function selBox(g,k,f,opts,cur,sol,checked,label){
  const ok=checked&&sol.indexOf(cur)>=0;
  return '<label class="fld"><span>'+label+'</span><select class="sel'+(checked?(ok?' ok':' bad'):'')+'" '+(checked?'disabled ':'')+'data-a="sel" data-g="'+g+'" data-k="'+k+'" data-f="'+f+'"><option value="">– wählen –</option>'+
   opts.map(o=>'<option value="'+o[0]+'"'+(cur===o[0]?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select></label>';
}
function fbox(ok,txt){return '<div class="fb '+(ok?'ok':'bad')+'"><b>'+(ok?'Richtig.':'Nicht ganz.')+'</b> '+esc(txt)+'</div>';}
function ptsCard(label,pts,max,extra){return '<div class="card acc"><div class="lbl">'+label+'</div><div><span class="big">'+Math.round(pts)+'</span> <span class="mu">von '+max+' Punkten</span></div>'+(extra?'<p class="sm" style="margin-top:6px">'+extra+'</p>':'')+'</div>';}
function lageBild(){
  const sc=S.sc;let h='<details><summary>Lagebild: '+esc(sc.n)+'</summary><div class="in">';
  h+=sc.lage.map(p=>'<p class="sm">'+esc(p)+'</p>').join('');
  if(S.asked.length){h+='<div class="lbl" style="margin-top:8px">Erkundete Informationen</div><ul class="l sm">'+S.asked.map(j=>'<li><b>'+esc(sc.q[j][0])+':</b> '+esc(sc.q[j][2])+'</li>').join('')+'</ul>';}
  return h+'</div></details>';
}
function nextBtn(label){return '<button class="btn or" data-a="next">'+label+'</button>';}
function checkBtn(ready){return '<button class="btn or" data-a="check" '+(ready?'':'disabled')+'>Antworten prüfen</button>'+(ready?'':'<p class="sm mu" style="text-align:center;margin:0">Erst alle Felder beantworten.</p>');}

/* ---------- Seiten ---------- */
function pageWahl(){
  const b=load().best||{};
  let h='<div class="card acc"><h2>Planspiel-Trainer</h2><p class="sm mu" style="margin-top:6px">Arbeite eine Lage wie in der Planbesprechung ab: Lagemeldung, Erkundung, Lagebeurteilung, Organisationsschema, Kommunikationsschema, Entschluss und Aufträge, Auswertung. Die Szenarien sind frei erfunden; die Regeln stammen aus den Lernseiten Stabsarbeit.</p></div>';
  h+=SC.map((s,i)=>'<button class="sc" data-a="pick" data-i="'+i+'"><b>'+esc(s.n)+'</b><span>'+esc(s.kz)+'</span>'+(b[s.id]!=null?'<em>Bestwert: '+b[s.id]+' von 100</em>':'<em>Noch nicht gespielt</em>')+'</button>').join('');
  h+='<button class="btn or" data-a="rnd">Zufälliges Szenario</button>';
  return h;
}
function pageLage(){
  const sc=S.sc;
  return '<div class="card acc"><div class="lbl">'+esc(sc.zt)+'</div><h2>'+esc(sc.n)+'</h2></div>'+
   '<div class="card">'+sc.lage.map(p=>'<p>'+esc(p)+'</p>').join('')+'</div>'+
   '<div class="card"><div class="lbl">Dein Auftrag</div><p class="sm">Du arbeitest in sieben Schritten. Als Nächstes erkundest du die Lage: Dir stehen <b>'+BUDGET+' Fragen</b> zur Verfügung. Wichtige Fragen bringen Punkte, unnötige Fragen kosten Punkte.</p></div>'+
   nextBtn('Weiter zur Erkundung');
}
function pageErk(){
  const sc=S.sc,done=S.chk.erk,left=BUDGET-S.asked.length;
  let h='<div class="card"><div class="bud"><b>Fragen: '+S.asked.length+' von '+BUDGET+'</b><div class="bar"><i style="width:'+(100*S.asked.length/BUDGET)+'%"></i></div></div>'+
   '<p class="sm mu" style="margin-top:6px">Tippe auf eine Frage, um die Antwort zu erhalten. Mit „Erkundung abschließen“ endet die Erkundung.</p></div>';
  S.ord.q.forEach(j=>{
    const q=sc.q[j],asked=S.asked.indexOf(j)>=0,dis=done||asked||left<=0;
    h+='<div><button class="q'+(asked?' asked':'')+(!asked&&!done&&left<=0?' dim':'')+'" '+(dis?'disabled ':'')+'data-a="ask" data-j="'+j+'"><span class="tag">'+esc(q[0])+'</span>'+esc(q[1])+'</button>';
    if(asked)h+='<div class="ans">'+esc(q[2])+'</div>';
    if(done){
      const r=q[3];
      if(asked)h+='<div class="fb '+(r==='k'?'ok':r==='u'?'bad':'nt')+'"><b>'+(r==='k'?'Kernfrage.':r==='u'?'Unnötig (minus 3 Punkte).':'Nützlich, aber nicht prioritär.')+'</b> '+esc(q[4])+'</div>';
      else if(r==='k')h+='<div class="ans" style="border-color:var(--bad)"><b>Fehlt, wichtig:</b> '+esc(q[2])+'<br><span class="mu">'+esc(q[4])+'</span></div>';
    }
    h+='</div>';
  });
  if(!done)h+='<button class="btn or" data-a="check" '+(S.asked.length?'':'disabled')+'>Erkundung abschließen</button>';
  else{const e=scErk();h=ptsCard('Erkundung',e.pts,20,e.k+' von '+e.K+' Kernfragen gestellt, '+e.u+' unnötige Frage(n) (je minus 3 Punkte).')+h+nextBtn('Weiter zur Lagebeurteilung');}
  return h;
}
function pagePA(){
  const sc=S.sc,c=S.chk.pa,A=S.ans.pa;
  let h=lageBild()+'<div class="card"><h3>Problemanalyse</h3><p class="sm mu">Ordne jede Aussage zu: Ist das die Sicht der Betroffenen oder die fachliche Sicht? Die Problemanalyse betrachtet beides.</p></div>';
  S.ord.pa.forEach(j=>{const p=sc.pa[j];
    h+='<div class="item"><div class="t">'+esc(p[0])+'</div>'+chipRow('pa',j,'',[['b','Sicht der Betroffenen'],['f','Fachliche Sicht']],A[j],[p[1]],c,A[j]===p[1])+
     (c?fbox(A[j]===p[1],p[1]==='b'?'Das erleben die Betroffenen unmittelbar: Sicht der Betroffenen.':'Das ist eine Sachfrage der Gefahrenabwehr: fachliche Sicht.'):'')+'</div>';});
  const ready=sc.pa.every((_,j)=>A[j]);
  if(!c)h+=checkBtn(ready);else{const p=scPA();h=ptsCard('Problemanalyse',p.pts,8,p.c+' von '+p.n+' richtig.')+h+nextBtn('Weiter zur Priorisierung');}
  return h;
}
function pagePR(){
  const sc=S.sc,c=S.chk.pr,A=S.ans.pr;
  let h=lageBild()+'<div class="card"><h3>Priorisierung: modifizierte Eisenhower-Matrix</h3><p class="sm mu">Priorität 1: wichtig und dringend. Priorität 2: wichtig, nicht dringend. Priorität 3: nicht wichtig, dringend. Priorität 4: nicht wichtig, nicht dringend. Dazu: nicht zuständig und nicht beeinflussbar.</p></div>';
  S.ord.pr.forEach(j=>{const p=sc.pr[j];
    h+='<div class="item"><div class="t">'+esc(p[0])+'</div>'+chipRow('pr',j,'',PK,A[j],[p[1]],c,A[j]===p[1])+
     (c?fbox(A[j]===p[1],'Richtig ist: '+lab(PK,p[1])+' ('+PKX[p[1]]+'). '+p[2]):'')+'</div>';});
  const ready=sc.pr.every((_,j)=>A[j]);
  if(!c)h+=checkBtn(ready);else{const p=scPR();h=ptsCard('Priorisierung',p.pts,12,p.c+' von '+p.n+' richtig.')+h+nextBtn('Weiter zum Organisationsschema');}
  return h;
}
function pageOrg(){
  const sc=S.sc,c=S.chk.org,A=S.ans.org;
  let h=lageBild()+'<div class="card"><h3>Führungsorganisation</h3><p class="sm mu">Wie wird geführt?</p>';
  h+=FZ.map(o=>{let k='opt';if(c){if(o[0]===S.ans.fz)k+=(o[0]==='zwei'?' ok':' bad');else if(o[0]==='zwei')k+=' sol';}else if(o[0]===S.ans.fz)k+=' on';
    return '<button class="'+k+'" '+(c?'disabled ':'')+'data-a="set" data-g="fz" data-k="" data-v="'+o[0]+'">'+esc(o[1])+'</button>';}).join('');
  if(c)h+=fbox(S.ans.fz==='zwei',sc.fzw);
  h+='</div><div class="card"><h3>Aufbau zuordnen</h3><p class="sm mu">Wohin gehört jede Stelle: Einsatzleitung (operativ-taktisch), Krisenstab (administrativ-organisatorisch), Einsatzabschnitt oder gar nicht?</p></div>';
  S.ord.og.forEach(j=>{const p=sc.og[j];
    h+='<div class="item"><div class="t">'+esc(p[0])+'</div>'+chipRow('org',j,'',BK,A[j],[p[1]],c,A[j]===p[1])+
     (c?fbox(A[j]===p[1],'Richtig ist: '+lab(BK,p[1])+'. '+(p[2]||BDEF[p[1]])):'')+'</div>';});
  const ready=S.ans.fz&&sc.og.every((_,j)=>A[j]);
  /* Strukturübersicht */
  h+='<div class="lbl" style="margin-top:4px">Dein Schema</div><div class="col3">'+BK.slice(0,3).map(b=>'<div class="card"><div class="lbl">'+b[1]+'</div>'+
    (sc.og.filter((_,j)=>A[j]===b[0]).map(p=>'<div class="sm">• '+esc(p[0].split(':')[0])+'</div>').join('')||'<div class="sm mu">–</div>')+'</div>').join('')+'</div>';
  if(!c)h+=checkBtn(ready);else{const o=scOG();h=ptsCard('Organisation',o.pts,20,'Führungsorganisation '+(o.f?'richtig':'falsch')+', '+o.c+' von '+o.n+' Zuordnungen richtig.')+h+nextBtn('Weiter zum Kommunikationsschema');}
  return h;
}
function pageKom(){
  const sc=S.sc,c=S.chk.kom,A=S.ans.kom;
  let h=lageBild()+'<div class="card"><h3>Wer meldet was an wen?</h3><p class="sm mu">Wähle zu jedem Sachverhalt die Meldeart und den Meldeweg. Sofortmeldung, Folgemeldung und Schlussmeldung gehen an vorgesetzte Stellen; Warnung und Information der Bevölkerung sind keine Meldearten.</p></div>';
  sc.km.forEach((p,j)=>{const x=A[j]||{};const okA=x.art===p[1],okW=x.weg===p[2];
    h+='<div class="item"><div class="t">'+(j+1)+'. '+esc(p[0])+'</div><div class="lbl">Meldeart</div>'+chipRow('kom',j,'art',ART,x.art,[p[1]],c,okA)+
     '<div class="lbl" style="margin-top:8px">Meldeweg</div><div class="chips" style="flex-direction:column">'+WEG.map(o=>{let k='opt';if(c){if(o[0]===x.weg)k+=(okW?' ok':' bad');else if(o[0]===p[2])k+=' sol';}else if(o[0]===x.weg)k+=' on';
      return '<button class="'+k+'" '+(c?'disabled ':'')+'data-a="set" data-g="kom" data-k="'+j+'" data-f="weg" data-v="'+o[0]+'" style="margin-top:0">'+esc(o[1])+'</button>';}).join('')+'</div>'+
     (c?fbox(okA&&okW,'Richtig: '+lab(ART,p[1])+' über „'+lab(WEG,p[2])+'“. '+p[3]):'')+'</div>';});
  const ready=sc.km.every((_,j)=>A[j]&&A[j].art&&A[j].weg);
  if(!c)h+=checkBtn(ready);else{const k=scKM();h=ptsCard('Kommunikation',k.pts,20,'Meldeart '+k.a+' von '+k.n+' richtig, Meldeweg '+k.w+' von '+k.n+' richtig.')+h+nextBtn('Weiter zu Entschluss und Aufträgen');}
  return h;
}
function pageAuf(){
  const sc=S.sc,c=S.chk.auf;
  let h=lageBild()+'<div class="card"><h3>Entschluss und Auftragsvergabe</h3><p class="sm mu">Stelle die Auftragsliste zusammen: Wer, Mit wem, Was, Bis wann, Rückmeldung, Status. Danach legst du die Federführung und den nächsten Termin fest.</p></div>';
  const roles=S.ord.roles.map(r=>[r,rl(r,sc)]);
  sc.au.forEach((a,j)=>{const x=S.ans.auf[j],o=c?auOK(j):{};
    h+='<div class="item"><h3>Auftrag '+(j+1)+': '+esc(a.t)+'</h3><p class="sm mu">'+esc(a.ctx)+'</p>';
    h+='<div class="g2">'+selBox('auf',j,'wer',roles,x.wer,a.wer,c,'Wer (federführend)')+selBox('auf',j,'mit',roles,x.mit,a.mit,c,'Mit wem')+'</div>';
    h+='<div class="fld"><span>Was</span>';
    S.ord.was[j].forEach(w=>{let k='opt';if(c){if(w===x.was)k+=(w===0?' ok':' bad');else if(w===0)k+=' sol';}else if(w===x.was)k+=' on';
      h+='<button class="'+k+'" '+(c?'disabled ':'')+'data-a="set" data-g="auf" data-k="'+j+'" data-f="was" data-v="'+w+'">'+esc(a.was[w])+'</button>';});
    h+='</div><div class="g2">'+selBox('auf',j,'bis',BIS,x.bis,[a.bis],c,'Bis wann')+selBox('auf',j,'rue',RUE,x.rue,a.rue,c,'Rückmeldung')+'</div>';
    h+='<div class="g2">'+selBox('auf',j,'st',STA,x.st,[a.st],c,'Status')+'</div>';
    if(c){const wrong=Object.keys(o).filter(k=>!o[k]);
      h+=fbox(!wrong.length,(wrong.length?'Falsch: '+wrong.map(k=>({wer:'Wer',mit:'Mit wem',was:'Was',bis:'Bis wann',rue:'Rückmeldung',st:'Status'}[k])).join(', ')+'. ':'')+
       'Soll: Wer '+a.wer.map(r=>rl(r,sc)).join(' oder ')+', mit '+a.mit.map(r=>rl(r,sc)).join(' oder ')+', bis '+lab(BIS,a.bis)+', Status '+lab(STA,a.st)+'. '+a.why+' Rückmeldung ist Pflicht: bei Erledigung oder zur nächsten Sitzung.');}
    h+='</div>';});
  /* Federführung und Termin */
  h+='<div class="item"><h3>Federführung</h3><p class="sm mu">Wer übernimmt die Federführung für „'+esc(sc.ff.t)+'“?</p>'+selBox('ff',0,'v',roles,S.ans.ff,[sc.ff.r],c,'Federführung')+(c?fbox(S.ans.ff===sc.ff.r,'Soll: '+rl(sc.ff.r,sc)+'. '+sc.ff.why):'')+'</div>';
  h+='<div class="item"><h3>Nächster Termin</h3><p class="sm mu">'+esc(sc.tm.n)+'</p>'+chipRow('tm',0,'v',TER,S.ans.tm,[sc.tm.o],c,S.ans.tm===sc.tm.o)+(c?fbox(S.ans.tm===sc.tm.o,'Soll: '+lab(TER,sc.tm.o)+'. Die Zeiträume zwischen den Sitzungen sind lageabhängig, die Rückmeldung zum ersten fälligen Auftrag wird im Stab besprochen.'):'')+'</div>';
  const ready=S.ans.ff&&S.ans.tm&&sc.au.every((a,j)=>{const x=S.ans.auf[j];return x.wer&&x.mit&&x.was!=null&&x.bis&&x.rue&&x.st;});
  if(!c)h+=checkBtn(ready);else{const a=scAU();h=ptsCard('Entschluss und Aufträge',a.pts,20,a.c+' von '+a.n+' Auftragsfeldern richtig, Federführung '+(a.f?'richtig':'falsch')+', Termin '+(a.t?'richtig':'falsch')+'.')+h+nextBtn('Zur Auswertung');}
  return h;
}
function patterns(){
  const sc=S.sc,P={};const add=(k,n)=>{if(n>0)P[k]=(P[k]||0)+n;};
  const e=scErk();add('budget',e.u);add('luecke',e.K-e.k);
  sc.pa.forEach((p,j)=>{if(S.ans.pa[j]!==p[1])add('sicht',1);});
  sc.pr.forEach((p,j)=>{if(S.ans.pr[j]!==p[1]){add(p[1]==='nz'||p[1]==='nb'||S.ans.pr[j]==='nz'||S.ans.pr[j]==='nb'?'zust':'prio',1);}});
  if(S.ans.fz!=='zwei')add('fz',1);
  sc.og.forEach((p,j)=>{if(S.ans.org[j]!==p[1])add('stab',1);});
  sc.km.forEach((p,j)=>{const x=S.ans.kom[j]||{};if(x.art!==p[1])add('art',1);if(x.weg!==p[2])add('weg',1);});
  sc.au.forEach((a,j)=>{const o=auOK(j);add('auf',(o.wer?0:1)+(o.mit?0:1)+(o.was?0:1));add('frist',(o.bis?0:1)+(o.rue?0:1)+(o.st?0:1));});
  if(S.ans.ff!==sc.ff.r)add('ff',1);if(S.ans.tm!==sc.tm.o)add('termin',1);
  return Object.keys(P).sort((a,b)=>P[b]-P[a]).map(k=>[k,P[k]]);
}
function pageAus(){
  const sc=S.sc,pp=phasePts(),tot=pp.reduce((a,b)=>a+b,0);
  if(!S.done){S.done=true;const d=load();d.best=d.best||{};if(d.best[sc.id]==null||tot>d.best[sc.id])d.best[sc.id]=tot;d.runs=(d.runs||0)+1;save(d);}
  const best=(load().best||{})[sc.id];
  const lv=tot>=85?'Sehr sicher. Die Lage ist sauber bearbeitet.':tot>=70?'Gut. Einzelne Schritte noch schärfen.':tot>=50?'Auf dem Weg. Die Fehlermuster unten helfen beim Wiederholen.':'Wiederholen lohnt sich. Arbeite die Fehlermuster unten durch.';
  let h='<div class="card acc"><div class="lbl">'+esc(sc.n)+'</div><div><span class="big">'+tot+'</span> <span class="mu">von 100 Punkten</span></div><p class="sm" style="margin-top:6px">'+lv+(best!=null?' Bestwert: '+best+'.':'')+'</p></div>';
  h+='<div class="card">'+PHN.map((n,i)=>'<div class="pb"><span>'+n+'</span><div class="bar"><i style="width:'+(100*pp[i]/MAXP[i])+'%"></i></div><b>'+pp[i]+' / '+MAXP[i]+'</b></div>').join('')+'</div>';
  const pt=patterns();
  h+='<div class="card"><div class="lbl">Typische Fehler in deinem Durchgang</div>'+(pt.length?pt.slice(0,5).map(p=>'<div class="er"><b>✕ '+esc(FE[p[0]][0])+' ('+p[1]+'x)</b>'+esc(FE[p[0]][1])+'</div>').join(''):'<p class="sm">Keine Fehler. Sehr gut.</p>')+'</div>';
  /* Musterlösung */
  const e=scErk();
  let m='';
  m+='<details><summary>Erkundung: Kernfragen</summary><div class="in"><ul class="l sm">'+sc.q.filter(q=>q[3]==='k').map(q=>'<li><b>'+esc(q[0])+':</b> '+esc(q[1])+' <span class="mu">('+esc(q[4])+')</span></li>').join('')+'</ul></div></details>';
  m+='<details><summary>Lagebeurteilung: Problemanalyse und Priorisierung</summary><div class="in"><div class="lbl">Sicht der Betroffenen</div><ul class="l sm">'+sc.pa.filter(p=>p[1]==='b').map(p=>'<li>'+esc(p[0])+'</li>').join('')+'</ul><div class="lbl" style="margin-top:8px">Fachliche Sicht</div><ul class="l sm">'+sc.pa.filter(p=>p[1]==='f').map(p=>'<li>'+esc(p[0])+'</li>').join('')+'</ul>'+
    '<div class="lbl" style="margin-top:8px">Priorisierung</div>'+PK.map(k=>{const L=sc.pr.filter(p=>p[1]===k[0]);return L.length?'<p class="sm"><b>'+k[1]+' ('+PKX[k[0]]+'):</b><br>'+L.map(p=>esc(p[0])).join('<br>')+'</p>':'';}).join('')+'</div></details>';
  m+='<details><summary>Organisationsschema</summary><div class="in"><p class="sm"><b>Zwei-Stäbe-Modell:</b> '+esc(sc.fzw)+'</p><div class="col3">'+BK.map(b=>'<div class="card"><div class="lbl">'+b[1]+'</div>'+(sc.og.filter(p=>p[1]===b[0]).map(p=>'<div class="sm">• '+esc(p[0])+'</div>').join('')||'–')+'</div>').join('')+'</div></div></details>';
  m+='<details><summary>Kommunikationsschema</summary><div class="in"><div class="tw"><table class="t"><tr><th>Sachverhalt</th><th>Meldeart</th><th>Meldeweg</th></tr>'+sc.km.map(p=>'<tr><td>'+esc(p[0])+'</td><td>'+esc(lab(ART,p[1]))+'</td><td>'+esc(lab(WEG,p[2]))+'</td></tr>').join('')+'</table></div></div></details>';
  m+='<details><summary>Auftragsliste</summary><div class="in"><div class="tw"><table class="t"><tr><th>Auftrag</th><th>Wer</th><th>Mit wem</th><th>Was</th><th>Bis wann</th><th>Rückmeldung</th><th>Status</th></tr>'+sc.au.map(a=>'<tr><td>'+esc(a.t)+'</td><td>'+esc(a.wer.map(r=>rl(r,sc)).join(' oder '))+'</td><td>'+esc(a.mit.map(r=>rl(r,sc)).join(' oder '))+'</td><td>'+esc(a.was[0])+'</td><td>'+esc(lab(BIS,a.bis))+'</td><td>Bei Erledigung oder zur nächsten Sitzung</td><td>'+esc(lab(STA,a.st))+'</td></tr>').join('')+'</table></div>'+
    '<p class="sm" style="margin-top:8px"><b>Federführung:</b> '+esc(rl(sc.ff.r,sc))+' für „'+esc(sc.ff.t)+'“.<br><b>Nächster Termin:</b> '+esc(lab(TER,sc.tm.o))+'.</p></div></details>';
  h+='<div class="lbl" style="margin-top:4px">Musterlösung</div>'+m;
  h+='<div class="row2"><button class="btn" data-a="again">Nochmal (neu gemischt)</button><button class="btn or" data-a="other">Anderes Szenario</button></div>';
  return h;
}

/* ---------- Schema- und Hinweise-Tab ---------- */
function pageSchema(){
  const P=[['Lagemeldung lesen','Lage erfassen. Mehrere Verbände oder mehrere Einsatzstellen: Führen mit Führungsstab (Führungsstufe D). Großeinsatzlage und Katastrophe: Zwei-Stäbe-Modell.'],
   ['Erkundung','Lagefeststellung (S2): lagerelevante Informationen beschaffen, auswerten, bewerten. FOR-DEC beginnt mit Fakten. Mit begrenzten Fragen priorisieren: Betroffene, Prognose, Kräfte, Warnstatus, KRITIS, Presse.'],
   ['Lagebeurteilung','Problemanalyse aus Sicht der Betroffenen und aus fachlicher Sicht. Dann Priorität mit der modifizierten Eisenhower-Matrix: Priorität 1 wichtig und dringend, 2 wichtig und nicht dringend, 3 nicht wichtig und dringend, 4 weder noch (später prüfen oder löschen), dazu nicht zuständig und nicht beeinflussbar.'],
   ['Organisationsschema','Einsatzleitung (operativ-taktisch): Leiter, S1 bis S6, Fachberater und Verbindungspersonen; Einsatzabschnitte bildet S3. Krisenstab (administrativ-organisatorisch): Leiter des Stabes, KGS (Lage und Dokumentation, Innerer Dienst), BuMA, ständige und ereignisspezifische Mitglieder. Verbindungspersonen externer Stellen eher im Krisenstab.'],
   ['Kommunikationsschema','Meldearten: Sofortmeldung (Leitstelle max. 30 min nach Bekanntwerden), Folgemeldung (wesentliche Lageänderung), Schlussmeldung (in der Regel die letzte Folgemeldung). Mit Arbeitsaufnahme des Krisenstabes gehen Meldewesen und Warnung der Bevölkerung auf ihn (BuMA) über; S5 untersteht dann der BuMA.'],
   ['Entschluss und Aufträge','FOR-DEC: Decision, Execution, Check. Auftragsliste mit Auftrag, Wer, Mit wem, Was, Bis wann, Rückmeldung, Status. Federführung festlegen, nächster Termin lageabhängig.'],
   ['Auswertung','Punkte je Phase, Musterlösung und typische Fehler.']];
  const SG=[['S1','Personal / Innerer Dienst: Kräfte bereitstellen, Bereitstellungsräume, Kräfteübersicht'],['S2','Lage: Lagefeststellung, Lagedarstellung, Melden und Unterrichten, Einsatztagebuch'],['S3','Einsatz: Lagebesprechung, Beurteilen, Entschluss, Befehle, Sofortmaßnahmen zum Schutz der Bevölkerung'],['S4','Versorgung: Verpflegung, Unterkünfte, Eigenschutz, Verbrauchsgüter, Einsatzmittel'],['S5','Presse und Medienarbeit, Warnung und Information der Bevölkerung (unter der BuMA, wenn der Krisenstab arbeitet)'],['S6','Informations- und Kommunikationswesen: Fernmeldeorganisation, Kommunikationskonzept']];
  let h='<div class="card acc"><h2>Schema: Phasen und Anforderungen</h2><p class="sm mu" style="margin-top:6px">Das Schema ist eine Hilfe, kein Muss. Es kann bei der Priorisierung der Gefahrenschwerpunkte und der Definition von Maßnahmen helfen.</p></div>';
  h+=P.map((p,i)=>'<div class="card"><div class="ph"><div class="n">'+(i+1)+'</div><div><h3>'+p[0]+'</h3><p class="sm">'+p[1]+'</p></div></div></div>').join('');
  h+='<details><summary>Sachgebiete S1 bis S6</summary><div class="in">'+SG.map(s=>'<div class="ln"><b>'+s[0]+'</b><span>'+s[1]+'</span></div>').join('')+'</div></details>';
  h+='<details><summary>FOR-DEC</summary><div class="in"><div class="ln"><b>F</b><span>Fakten sammeln</span></div><div class="ln"><b>O</b><span>Optionen für Handlungen benennen</span></div><div class="ln"><b>R</b><span>Risiken und Nutzen je Option abschätzen</span></div><div class="ln"><b>Pause</b><span>Habe ich alles beachtet?</span></div><div class="ln"><b>D</b><span>Decision: für eine Option entscheiden</span></div><div class="ln"><b>E</b><span>Execution: ausführen</span></div><div class="ln"><b>C</b><span>Check: Kontrolle der Maßnahmeneffekte, ggf. Neubeginn</span></div></div></details>';
  return h;
}
function pageHinweise(){
  const d=load();
  let h='<div class="card acc"><h2>Hinweise</h2><p class="sm" style="margin-top:6px">Die Szenarien sind frei erfunden (Orte und Namen ohne Bezug). Die Regeln stammen aus den Lernseiten Stabsarbeit, Presse sowie den Hinweisen zur Lagebearbeitung.</p></div>';
  h+='<div class="card"><div class="lbl">Wichtig</div><p class="sm">Die Nutzung des Schemas ist keine Garantie auf Erfolg, und es wird nicht erwartet, dass nach diesem Konzept abgearbeitet wird. Die Planbesprechung ist nach der Initialphase und Übernahme der Einsatzleitung eher ein strukturiertes Interview als ein Vortrag.</p></div>';
  h+='<div class="card"><div class="lbl">Punkte</div><p class="sm">Erkundung 20 (Kernfragen, unnötige Fragen minus 3), Beurteilung 20, Organisation 20, Kommunikation 20, Entschluss und Aufträge 20. Insgesamt 100.</p></div>';
  h+='<div class="card"><div class="lbl">Typische Fehlermuster</div>'+Object.keys(FE).map(k=>'<div class="er"><b>✕ '+esc(FE[k][0])+'</b>'+esc(FE[k][1])+'</div>').join('')+'</div>';
  const b=d.best||{};
  h+='<div class="card"><div class="lbl">Bestwerte</div>'+SC.map(s=>'<div class="ln"><b style="flex:0 0 auto;min-width:0"></b><span>'+esc(s.n)+': '+(b[s.id]!=null?b[s.id]+' von 100':'noch nicht gespielt')+'</span></div>').join('')+'<button class="btn" style="margin-top:8px" data-a="reset">Bestwerte zurücksetzen</button></div>';
  return h;
}

/* ---------- Rendering ---------- */
function render(){
  const main=$('#main'),keep=main?main.scrollTop:0,keepKey=main?main.dataset.k:'';
  let body='',eb='',ttl='Planspiel-Trainer',steps='';
  if(tab==='schema'){body=pageSchema();eb='Schema';}
  else if(tab==='hinweise'){body=pageHinweise();eb='Hinweise';}
  else if(!S){body=pageWahl();eb='Szenario wählen';}
  else{
    const st=S.step,ph=PHASE[st];eb='Schritt '+(ph+1)+' von 7 · '+PLAB[ph];ttl=S.sc.n;
    body=({lage:pageLage,erk:pageErk,pa:pagePA,pr:pagePR,org:pageOrg,kom:pageKom,auf:pageAuf,aus:pageAus})[st]();
    steps='<div class="steps">'+PLAB.map((_,i)=>'<i class="'+(i<ph?'dn':i===ph?'cur':'')+'"></i>').join('')+'</div>';
  }
  const key=tab+'|'+(S?S.step+(S.chk[S.step]?'c':''):'w');
  $('#root').innerHTML='<div class="app"><header class="top"><div class="eb">'+eb+'</div><h1>'+esc(ttl)+'</h1>'+steps+'</header>'+
   '<nav class="tabs" role="tablist">'+[['ueben','▶','Üben'],['schema','☰','Schema'],['hinweise','i','Hinweise']].map(t=>'<button class="tab'+(tab===t[0]?' on':'')+'" role="tab" aria-selected="'+(tab===t[0])+'" data-a="tab" data-t="'+t[0]+'"><b>'+t[1]+'</b>'+t[2]+'</button>').join('')+'</nav>'+
   '<main id="main" data-k="'+key+'"><div class="wrap">'+body+'</div></main></div>';
  const m=$('#main');if(m)m.scrollTop=(keepKey===key)?keep:0;
}

/* ---------- Ereignisse ---------- */
function setAns(g,k,f,v){
  if(g==='fz')S.ans.fz=v;
  else if(g==='ff')S.ans.ff=v;
  else if(g==='tm')S.ans.tm=v;
  else if(g==='auf'){const x=S.ans.auf[+k];x[f]=(f==='was')?+v:v;}
  else if(g==='kom'){(S.ans.kom[+k]=S.ans.kom[+k]||{})[f]=v;}
  else S.ans[g][+k]=v;
}
function next(){
  const o=['lage','erk','pa','pr','org','kom','auf','aus'];const i=o.indexOf(S.step);S.step=o[Math.min(i+1,o.length-1)];render();
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-a]');if(!t||t.disabled)return;
  const a=t.dataset.a;
  if(a==='tab'){tab=t.dataset.t;render();return;}
  if(a==='pick'){tab='ueben';newRun(+t.dataset.i);render();return;}
  if(a==='rnd'){tab='ueben';newRun(Math.floor(Math.random()*SC.length));render();return;}
  if(a==='again'){newRun(S.i);render();return;}
  if(a==='other'){S=null;render();return;}
  if(a==='reset'){const d=load();d.best={};save(d);render();return;}
  if(!S)return;
  if(a==='next'){next();return;}
  if(a==='ask'){const j=+t.dataset.j;if(S.asked.indexOf(j)<0&&S.asked.length<BUDGET&&!S.chk.erk){S.asked.push(j);render();}return;}
  if(a==='check'){S.chk[S.step]=true;render();return;}
  if(a==='set'){if(S.chk[S.step])return;setAns(t.dataset.g,t.dataset.k,t.dataset.f,t.dataset.v);render();}
});
document.addEventListener('change',e=>{
  const t=e.target.closest('select[data-a="sel"]');if(!t||!S||S.chk[S.step])return;
  setAns(t.dataset.g,t.dataset.k,t.dataset.f,t.value);render();
});
window.addEventListener('embtheme',()=>{});

/* Testzugriff */
window.__ps={SC,get S(){return S;},newRun,render,phasePts};
render();
})();
