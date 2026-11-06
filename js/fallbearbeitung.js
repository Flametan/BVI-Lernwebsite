/* Fallbearbeitung (8-Punkte-Schema und Übungsfälle) – wird erst beim Öffnen der Seite geladen */
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
