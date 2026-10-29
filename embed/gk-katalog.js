const KATALOG = {
 "bauteile": [
  {
   "id": "tw_wand",
   "name": "Tragende und aussteifende Wände",
   "gruppe": "Tragwerk",
   "kurz": "Wände, die das Gebäude tragen oder aussteifen, müssen im Brandfall ausreichend lang standsicher bleiben. Die geforderte Feuerwiderstandsdauer steigt mit der Gebäudeklasse, im Keller gelten andere Werte.",
   "anf": {
    "2": {
     "og": "feuerhemmend (F 30 / REI 30)",
     "ke": "feuerhemmend (F 30 / REI 30)",
     "h": "Geschosse im Dachraum: nur wenn darüber noch Aufenthaltsräume möglich sind (§ 27 Abs. 1 S. 3 Nr. 1). Balkone ausgenommen, außer offene Gänge als notwendige Flure."
    },
    "3": {
     "og": "feuerhemmend (F 30 / REI 30)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Geschosse im Dachraum: nur wenn darüber noch Aufenthaltsräume möglich sind (§ 27 Abs. 1 S. 3 Nr. 1). Balkone ausgenommen, außer offene Gänge als notwendige Flure."
    },
    "4": {
     "og": "hochfeuerhemmend (REI 60)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Geschosse im Dachraum: nur wenn darüber noch Aufenthaltsräume möglich sind (§ 27 Abs. 1 S. 3 Nr. 1). Balkone ausgenommen, außer offene Gänge als notwendige Flure."
    },
    "5": {
     "og": "feuerbeständig (REI 90)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Geschosse im Dachraum: nur wenn darüber noch Aufenthaltsräume möglich sind (§ 27 Abs. 1 S. 3 Nr. 1). Balkone ausgenommen, außer offene Gänge als notwendige Flure."
    },
    "1a": {
     "og": "keine F-Klasse (nur ausreichend lange Standsicherheit)",
     "ke": "feuerhemmend (F 30 / REI 30)",
     "h": "Geschosse im Dachraum: nur wenn darüber noch Aufenthaltsräume möglich sind (§ 27 Abs. 1 S. 3 Nr. 1). Balkone ausgenommen, außer offene Gänge als notwendige Flure."
    },
    "1b": {
     "og": "keine F-Klasse (nur ausreichend lange Standsicherheit)",
     "ke": "feuerhemmend (F 30 / REI 30)",
     "h": "Geschosse im Dachraum: nur wenn darüber noch Aufenthaltsräume möglich sind (§ 27 Abs. 1 S. 3 Nr. 1). Balkone ausgenommen, außer offene Gänge als notwendige Flure."
    }
   },
   "hh": "Sonderbau, MHHR: feuerbeständig und nichtbrennbar, über 60 m Höhe 120 Minuten (laut Lernseite, MHHR 3.1).",
   "rg": "§ 27 Abs. 1 und 2, § 26 Abs. 2 und 3",
   "pos": "wand-tragend",
   "auftritt": "geschoss",
   "merksatz": "Tragwerk: GK 2 und 3 feuerhemmend, GK 4 hochfeuerhemmend, GK 5 feuerbeständig. Im Keller ab GK 3 feuerbeständig, in GK 1 und 2 feuerhemmend.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "tw_stuetze",
   "name": "Stützen",
   "gruppe": "Tragwerk",
   "kurz": "Stützen unterliegen denselben Brandschutzanforderungen wie tragende Wände. Sie müssen im Brandfall ausreichend lang standsicher sein.",
   "anf": {
    "2": {
     "og": "feuerhemmend (F 30 / REI 30)",
     "ke": "feuerhemmend (F 30 / REI 30)",
     "h": "Wie tragende Wände; Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    },
    "3": {
     "og": "feuerhemmend (F 30 / REI 30)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Wie tragende Wände; Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    },
    "4": {
     "og": "hochfeuerhemmend (REI 60)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Wie tragende Wände; Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    },
    "5": {
     "og": "feuerbeständig (REI 90)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Wie tragende Wände; Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    },
    "1a": {
     "og": "keine F-Klasse (nur ausreichend lange Standsicherheit)",
     "ke": "feuerhemmend (F 30 / REI 30)",
     "h": "Wie tragende Wände; Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    },
    "1b": {
     "og": "keine F-Klasse (nur ausreichend lange Standsicherheit)",
     "ke": "feuerhemmend (F 30 / REI 30)",
     "h": "Wie tragende Wände; Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    }
   },
   "hh": "Sonderbau, MHHR: feuerbeständig und nichtbrennbar, über 60 m 120 Minuten (laut Lernseite).",
   "rg": "§ 27 Abs. 1 und 2",
   "pos": "stuetze",
   "auftritt": "geschoss",
   "merksatz": "Stützen werden brandschutztechnisch wie tragende Wände behandelt: gleiche Gebäudeklasse, gleiche Feuerwiderstandsdauer, Keller gesondert.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "tw_balkon",
   "name": "Balkone und offene Gänge",
   "gruppe": "Tragwerk",
   "kurz": "Balkone sind von den Anforderungen an Tragwerk und Decken ausgenommen. Offene Gänge, die als notwendige Flure dienen, sind nicht ausgenommen.",
   "anf": {
    "2": {
     "t": "Balkone: keine Feuerwiderstandsanforderung; offene Gänge als notwendige Flure: wie Obergeschoss-Tragwerk/Decke der Gebäudeklasse"
    },
    "3": {
     "t": "Balkone: keine Feuerwiderstandsanforderung; offene Gänge als notwendige Flure: wie Obergeschoss-Tragwerk/Decke der Gebäudeklasse"
    },
    "4": {
     "t": "Balkone: keine Feuerwiderstandsanforderung; offene Gänge als notwendige Flure: wie Obergeschoss-Tragwerk/Decke der Gebäudeklasse"
    },
    "5": {
     "t": "Balkone: keine Feuerwiderstandsanforderung; offene Gänge als notwendige Flure: wie Obergeschoss-Tragwerk/Decke der Gebäudeklasse"
    },
    "1a": {
     "t": "Balkone: keine Feuerwiderstandsanforderung; offene Gänge als notwendige Flure: wie Obergeschoss-Tragwerk/Decke der Gebäudeklasse"
    },
    "1b": {
     "t": "Balkone: keine Feuerwiderstandsanforderung; offene Gänge als notwendige Flure: wie Obergeschoss-Tragwerk/Decke der Gebäudeklasse"
    }
   },
   "hh": "MHHR: Wände und Brüstungen offener Gänge feuerhemmend (laut Lernseite).",
   "rg": "§ 27 Abs. 1 S. 3 Nr. 2, § 31 Abs. 1 S. 3 Nr. 2, § 36 Abs. 5",
   "pos": "wand-aussen",
   "auftritt": "mehrfach",
   "merksatz": "Balkone sind von F-Anforderungen ausgenommen, offene Gänge als notwendige Flure nicht.",
   "unklar": false,
   "quelle": "MBO"
  },
  {
   "id": "decke",
   "name": "Geschossdecken",
   "gruppe": "Tragwerk",
   "kurz": "Decken trennen die Geschosse, tragen und schließen den Raum ab. Sie müssen standsicher bleiben und die Brandausbreitung in das nächste Geschoss ausreichend lang verhindern.",
   "anf": {
    "2": {
     "og": "feuerhemmend (F 30 / REI 30)",
     "ke": "feuerhemmend (F 30 / REI 30)",
     "h": "Im Kellergeschoss: Decke mit den Anforderungen des Kellers (§ 31 Abs. 2). Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    },
    "3": {
     "og": "feuerhemmend (F 30 / REI 30)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Im Kellergeschoss: Decke mit den Anforderungen des Kellers (§ 31 Abs. 2). Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    },
    "4": {
     "og": "hochfeuerhemmend (REI 60)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Im Kellergeschoss: Decke mit den Anforderungen des Kellers (§ 31 Abs. 2). Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    },
    "5": {
     "og": "feuerbeständig (REI 90)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Im Kellergeschoss: Decke mit den Anforderungen des Kellers (§ 31 Abs. 2). Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    },
    "1a": {
     "og": "keine F-Klasse",
     "ke": "feuerhemmend (F 30 / REI 30)",
     "h": "Im Kellergeschoss: Decke mit den Anforderungen des Kellers (§ 31 Abs. 2). Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    },
    "1b": {
     "og": "keine F-Klasse",
     "ke": "feuerhemmend (F 30 / REI 30)",
     "h": "Im Kellergeschoss: Decke mit den Anforderungen des Kellers (§ 31 Abs. 2). Geschosse im Dachraum nur, wenn darüber Aufenthaltsräume möglich sind."
    }
   },
   "hh": "Sonderbau, MHHR: Decken raumabschließend mit der Feuerwiderstandsfähigkeit der tragenden Bauteile (feuerbeständig, über 60 m 120 Minuten; laut Lernseite).",
   "rg": "§ 31 Abs. 1 und 2",
   "pos": "decke",
   "auftritt": "geschoss",
   "merksatz": "Decken folgen dem Tragwerk: GK 2 und 3 F30, GK 4 F60, GK 5 F90. Kellerdecke ab GK 3 F90, GK 1 und 2 F30.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "decke_keller",
   "name": "Kellerdecke (Decke im Kellergeschoss)",
   "gruppe": "Tragwerk",
   "kurz": "Die Decke über dem Kellergeschoss trennt Keller und Erdgeschoss. Der Keller gilt als Brandrisiko und hat strengere Werte als das Obergeschoss.",
   "anf": {
    "2": {
     "t": "feuerhemmend (F 30 / REI 30)",
     "h": "Gilt für Decken im Kellergeschoss. Zusätzlich feuerbeständig unter und über Räumen mit Explosions- oder erhöhter Brandgefahr (außer Wohngebäude GK 1/2)."
    },
    "3": {
     "t": "feuerbeständig (REI 90)",
     "h": "Gilt für Decken im Kellergeschoss. Zusätzlich feuerbeständig unter und über Räumen mit Explosions- oder erhöhter Brandgefahr (außer Wohngebäude GK 1/2)."
    },
    "4": {
     "t": "feuerbeständig (REI 90)",
     "h": "Gilt für Decken im Kellergeschoss. Zusätzlich feuerbeständig unter und über Räumen mit Explosions- oder erhöhter Brandgefahr (außer Wohngebäude GK 1/2)."
    },
    "5": {
     "t": "feuerbeständig (REI 90)",
     "h": "Gilt für Decken im Kellergeschoss. Zusätzlich feuerbeständig unter und über Räumen mit Explosions- oder erhöhter Brandgefahr (außer Wohngebäude GK 1/2)."
    },
    "1a": {
     "t": "feuerhemmend (F 30 / REI 30)",
     "h": "Gilt für Decken im Kellergeschoss. Zusätzlich feuerbeständig unter und über Räumen mit Explosions- oder erhöhter Brandgefahr (außer Wohngebäude GK 1/2)."
    },
    "1b": {
     "t": "feuerhemmend (F 30 / REI 30)",
     "h": "Gilt für Decken im Kellergeschoss. Zusätzlich feuerbeständig unter und über Räumen mit Explosions- oder erhöhter Brandgefahr (außer Wohngebäude GK 1/2)."
    }
   },
   "hh": "Sonderbau, MHHR: feuerbeständig (laut Lernseite).",
   "rg": "§ 31 Abs. 2 S. 1",
   "pos": "keller-decke",
   "auftritt": "gebaeude",
   "merksatz": "Kellerdecke: GK 1 und 2 feuerhemmend, GK 3 bis 5 feuerbeständig.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "decke_explosion",
   "name": "Decken bei Explosions-/Brandgefahr und landw. Nutzung",
   "gruppe": "Tragwerk",
   "kurz": "Unter und über Räumen mit Explosions- oder erhöhter Brandgefahr sowie zwischen landwirtschaftlichem Teil und Wohnteil sind Decken feuerbeständig.",
   "anf": {
    "2": {
     "t": "Wohngebäude: keine; sonstige Gebäude: feuerbeständig (REI 90)",
     "h": "Landwirtschaftlicher Teil/Wohnteil: in allen Gebäudeklassen feuerbeständig (§ 31 Abs. 2 S. 2 Nr. 2)."
    },
    "3": {
     "t": "feuerbeständig (REI 90)",
     "h": "Landwirtschaftlicher Teil/Wohnteil: in allen Gebäudeklassen feuerbeständig (§ 31 Abs. 2 S. 2 Nr. 2)."
    },
    "4": {
     "t": "feuerbeständig (REI 90)",
     "h": "Landwirtschaftlicher Teil/Wohnteil: in allen Gebäudeklassen feuerbeständig (§ 31 Abs. 2 S. 2 Nr. 2)."
    },
    "5": {
     "t": "feuerbeständig (REI 90)",
     "h": "Landwirtschaftlicher Teil/Wohnteil: in allen Gebäudeklassen feuerbeständig (§ 31 Abs. 2 S. 2 Nr. 2)."
    },
    "1a": {
     "t": "Wohngebäude: keine; sonstige Gebäude: feuerbeständig (REI 90)",
     "h": "Landwirtschaftlicher Teil/Wohnteil: in allen Gebäudeklassen feuerbeständig (§ 31 Abs. 2 S. 2 Nr. 2)."
    },
    "1b": {
     "t": "zw. landw. Teil und Wohnteil: feuerbeständig (REI 90); Explosionsräume wie GK 1a",
     "h": "Landwirtschaftlicher Teil/Wohnteil: in allen Gebäudeklassen feuerbeständig (§ 31 Abs. 2 S. 2 Nr. 2)."
    }
   },
   "hh": "MHHR: feuerbeständig (laut Lernseite, Räume mit erhöhter Brandgefahr).",
   "rg": "§ 31 Abs. 2 S. 2 Nr. 1 und 2",
   "pos": "decke",
   "auftritt": "mehrfach",
   "merksatz": "Unter und über Räumen mit Explosions- oder erhöhter Brandgefahr: Decken feuerbeständig, nur Wohngebäude GK 1 und 2 sind ausgenommen.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "decke_anschluss",
   "name": "Deckenanschluss an die Außenwand",
   "gruppe": "Tragwerk",
   "kurz": "Der Anschluss der Decke an die Außenwand darf den Brandschutz der Decke nicht schwächen (Fuge, Brandüberschlag im Anschlussbereich).",
   "anf": {
    "2": {
     "t": "Anschluss so herstellen, dass er der Decken-Anforderung (standsicher, raumabschließend) genügt",
     "h": "Nur wirksam, soweit für die Decke eine F-Klasse gilt (GK 2 bis 5)."
    },
    "3": {
     "t": "Anschluss so herstellen, dass er der Decken-Anforderung (standsicher, raumabschließend) genügt",
     "h": "Nur wirksam, soweit für die Decke eine F-Klasse gilt (GK 2 bis 5)."
    },
    "4": {
     "t": "Anschluss so herstellen, dass er der Decken-Anforderung (standsicher, raumabschließend) genügt",
     "h": "Nur wirksam, soweit für die Decke eine F-Klasse gilt (GK 2 bis 5)."
    },
    "5": {
     "t": "Anschluss so herstellen, dass er der Decken-Anforderung (standsicher, raumabschließend) genügt",
     "h": "Nur wirksam, soweit für die Decke eine F-Klasse gilt (GK 2 bis 5)."
    },
    "1a": {
     "t": "Anschluss so herstellen, dass er der Decken-Anforderung (standsicher, raumabschließend) genügt",
     "h": "Nur wirksam, soweit für die Decke eine F-Klasse gilt (GK 2 bis 5)."
    },
    "1b": {
     "t": "Anschluss so herstellen, dass er der Decken-Anforderung (standsicher, raumabschließend) genügt",
     "h": "Nur wirksam, soweit für die Decke eine F-Klasse gilt (GK 2 bis 5)."
    }
   },
   "hh": "MHHR: raumabschließende Bauteile bis an Außenwand/Dachhaut führen (laut Lernseite).",
   "rg": "§ 31 Abs. 3",
   "pos": "decke",
   "auftritt": "geschoss",
   "merksatz": "Auch die Fuge zwischen Decke und Außenwand muss so dicht sein wie die Decke selbst.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "dach_decke",
   "name": "Decke zum Dachraum / Geschosse im Dachraum",
   "gruppe": "Tragwerk",
   "kurz": "Die oberste Decke trennt Dachraum und darunterliegendes Geschoss. Die Anforderung hängt davon ab, ob über dem Dachgeschoss noch Aufenthaltsräume möglich sind.",
   "anf": {
    "2": {
     "t": "Aufenthaltsraum darüber möglich: feuerhemmend (F 30 / REI 30); sonst keine (Wohngebäude: § 29 gilt nicht)",
     "h": "Wird die Decke nach § 29 Abs. 4 F30, gilt das auch für die sie tragenden und aussteifenden Bauteile."
    },
    "3": {
     "t": "Aufenthaltsraum darüber möglich: feuerhemmend (F 30 / REI 30); sonst keine, aber feuerhemmend (F 30 / REI 30) wenn Trennwände nur bis Rohdecke",
     "h": "Wird die Decke nach § 29 Abs. 4 F30, gilt das auch für die sie tragenden und aussteifenden Bauteile."
    },
    "4": {
     "t": "Aufenthaltsraum darüber möglich: hochfeuerhemmend (REI 60); sonst keine, aber feuerhemmend (F 30 / REI 30) wenn Trennwände nur bis Rohdecke",
     "h": "Wird die Decke nach § 29 Abs. 4 F30, gilt das auch für die sie tragenden und aussteifenden Bauteile."
    },
    "5": {
     "t": "Aufenthaltsraum darüber möglich: feuerbeständig (REI 90); sonst keine, aber feuerhemmend (F 30 / REI 30) wenn Trennwände nur bis Rohdecke",
     "h": "Wird die Decke nach § 29 Abs. 4 F30, gilt das auch für die sie tragenden und aussteifenden Bauteile."
    },
    "1a": {
     "t": "Aufenthaltsraum darüber möglich: keine F-Klasse; sonst keine (Wohngebäude: § 29 gilt nicht)",
     "h": "Wird die Decke nach § 29 Abs. 4 F30, gilt das auch für die sie tragenden und aussteifenden Bauteile."
    },
    "1b": {
     "t": "Aufenthaltsraum darüber möglich: keine F-Klasse; sonst keine (Wohngebäude: § 29 gilt nicht)",
     "h": "Wird die Decke nach § 29 Abs. 4 F30, gilt das auch für die sie tragenden und aussteifenden Bauteile."
    }
   },
   "hh": "Sonderbau, MHHR: wie Decken des Gebäudes (laut Lernseite).",
   "rg": "§ 31 Abs. 1 S. 3 Nr. 1, § 27 Abs. 1 S. 3 Nr. 1, § 29 Abs. 4 und 6",
   "pos": "dach-decke",
   "auftritt": "gebaeude",
   "merksatz": "Dachgeschoss: Geschossdecken-Werte nur, wenn darüber Aufenthaltsräume möglich sind. Enden Trennwände an der Rohdecke, ist diese Decke feuerhemmend.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "trennwand_ne",
   "name": "Trennwände zwischen Nutzungseinheiten",
   "gruppe": "Raumabschluss",
   "kurz": "Trennwände schließen Nutzungseinheiten gegeneinander und gegen anders genutzte Räume ab. Sie haben die Feuerwiderstandsfähigkeit der tragenden Bauteile des Geschosses, mindestens feuerhemmend.",
   "anf": {
    "2": {
     "t": "Wohngebäude: keine (§ 29 Abs. 6); sonstige Gebäude: feuerhemmend (F 30 / REI 30)",
     "h": "Nicht erforderlich zwischen Nutzungseinheit und notwendigem Flur (dort gelten die Flurwände). Bis zur Rohdecke führen."
    },
    "3": {
     "t": "feuerhemmend (F 30 / REI 30)",
     "h": "Nicht erforderlich zwischen Nutzungseinheit und notwendigem Flur (dort gelten die Flurwände). Bis zur Rohdecke führen."
    },
    "4": {
     "t": "hochfeuerhemmend (REI 60)",
     "h": "Nicht erforderlich zwischen Nutzungseinheit und notwendigem Flur (dort gelten die Flurwände). Bis zur Rohdecke führen."
    },
    "5": {
     "t": "feuerbeständig (REI 90)",
     "h": "Nicht erforderlich zwischen Nutzungseinheit und notwendigem Flur (dort gelten die Flurwände). Bis zur Rohdecke führen."
    },
    "1a": {
     "t": "Wohngebäude: keine (§ 29 Abs. 6); sonstige Gebäude: feuerhemmend (F 30 / REI 30)",
     "h": "Nicht erforderlich zwischen Nutzungseinheit und notwendigem Flur (dort gelten die Flurwände). Bis zur Rohdecke führen."
    },
    "1b": {
     "t": "Wohngebäude: keine (§ 29 Abs. 6); sonstige Gebäude: feuerhemmend (F 30 / REI 30)",
     "h": "Nicht erforderlich zwischen Nutzungseinheit und notwendigem Flur (dort gelten die Flurwände). Bis zur Rohdecke führen."
    }
   },
   "hh": "MHHR 3.2.5: Trennwände zwischen Nutzungseinheiten feuerhemmend (laut Lernseite).",
   "rg": "§ 29 Abs. 1, 2 Nr. 1, 3 S. 1, 4 und 6",
   "pos": "trennwand",
   "auftritt": "geschoss",
   "merksatz": "Trennwand: Feuerwiderstand der tragenden Bauteile des Geschosses, mindestens F30. Bei Wohngebäuden GK 1 und 2 entfällt die Anforderung.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "trennwand_keller",
   "name": "Trennwände Aufenthaltsräume/andere Räume im Keller",
   "gruppe": "Raumabschluss",
   "kurz": "Im Kellergeschoss sind Aufenthaltsräume von anders genutzten Räumen (zum Beispiel Lager, Technik) durch Trennwände abzuschließen.",
   "anf": {
    "2": {
     "t": "Wohngebäude: keine (§ 29 Abs. 6); sonstige Gebäude: feuerhemmend (F 30 / REI 30)",
     "h": "Keller: Feuerwiderstand der tragenden Bauteile des Kellers (ab GK 3 feuerbeständig)."
    },
    "3": {
     "t": "feuerbeständig (REI 90)",
     "h": "Keller: Feuerwiderstand der tragenden Bauteile des Kellers (ab GK 3 feuerbeständig)."
    },
    "4": {
     "t": "feuerbeständig (REI 90)",
     "h": "Keller: Feuerwiderstand der tragenden Bauteile des Kellers (ab GK 3 feuerbeständig)."
    },
    "5": {
     "t": "feuerbeständig (REI 90)",
     "h": "Keller: Feuerwiderstand der tragenden Bauteile des Kellers (ab GK 3 feuerbeständig)."
    },
    "1a": {
     "t": "Wohngebäude: keine (§ 29 Abs. 6); sonstige Gebäude: feuerhemmend (F 30 / REI 30)",
     "h": "Keller: Feuerwiderstand der tragenden Bauteile des Kellers (ab GK 3 feuerbeständig)."
    },
    "1b": {
     "t": "Wohngebäude: keine (§ 29 Abs. 6); sonstige Gebäude: feuerhemmend (F 30 / REI 30)",
     "h": "Keller: Feuerwiderstand der tragenden Bauteile des Kellers (ab GK 3 feuerbeständig)."
    }
   },
   "hh": "MHHR 3.2.4: feuerbeständig (laut Lernseite).",
   "rg": "§ 29 Abs. 2 Nr. 3, Abs. 3 S. 1, Abs. 6",
   "pos": "trennwand",
   "auftritt": "geschoss",
   "merksatz": "Keller-Trennwände erben die Werte des Kellertragwerks: GK 3 bis 5 feuerbeständig, GK 1 und 2 feuerhemmend.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "trennwand_explosion",
   "name": "Trennwände zu Räumen mit Explosions-/erhöhter Brandgefahr",
   "gruppe": "Raumabschluss",
   "kurz": "Räume mit Explosions- oder erhöhter Brandgefahr (zum Beispiel Heizöl-, Lager-, Werkstattbereiche) sind durch feuerbeständige Trennwände abzuschließen.",
   "anf": {
    "2": {
     "t": "Wohngebäude: keine (§ 29 Abs. 6); sonstige Gebäude: feuerbeständig (REI 90)",
     "h": "Gilt unabhängig vom Tragwerk der Gebäudeklasse; Wohngebäude GK 1/2 ausgenommen."
    },
    "3": {
     "t": "feuerbeständig (REI 90)",
     "h": "Gilt unabhängig vom Tragwerk der Gebäudeklasse; Wohngebäude GK 1/2 ausgenommen."
    },
    "4": {
     "t": "feuerbeständig (REI 90)",
     "h": "Gilt unabhängig vom Tragwerk der Gebäudeklasse; Wohngebäude GK 1/2 ausgenommen."
    },
    "5": {
     "t": "feuerbeständig (REI 90)",
     "h": "Gilt unabhängig vom Tragwerk der Gebäudeklasse; Wohngebäude GK 1/2 ausgenommen."
    },
    "1a": {
     "t": "Wohngebäude: keine (§ 29 Abs. 6); sonstige Gebäude: feuerbeständig (REI 90)",
     "h": "Gilt unabhängig vom Tragwerk der Gebäudeklasse; Wohngebäude GK 1/2 ausgenommen."
    },
    "1b": {
     "t": "Wohngebäude: keine (§ 29 Abs. 6); sonstige Gebäude: feuerbeständig (REI 90)",
     "h": "Gilt unabhängig vom Tragwerk der Gebäudeklasse; Wohngebäude GK 1/2 ausgenommen."
    }
   },
   "hh": "MHHR 3.2.4: feuerbeständig (laut Lernseite).",
   "rg": "§ 29 Abs. 2 Nr. 2, Abs. 3 S. 2, Abs. 6",
   "pos": "trennwand",
   "auftritt": "mehrfach",
   "merksatz": "Räume mit Explosions- oder erhöhter Brandgefahr: Trennwände immer feuerbeständig, auch in niedrigen Gebäudeklassen.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "trennwand_dachraum",
   "name": "Trennwände im Dachraum",
   "gruppe": "Raumabschluss",
   "kurz": "Trennwände sind bis zur Rohdecke, im Dachraum bis unter die Dachhaut zu führen. Enden sie an der Rohdecke, wird diese Decke feuerhemmend.",
   "anf": {
    "2": {
     "t": "Wohngebäude: keine; sonst: bis unter die Dachhaut oder Rohdecke feuerhemmend (F 30 / REI 30)"
    },
    "3": {
     "t": "bis unter die Dachhaut oder Rohdecke feuerhemmend (F 30 / REI 30)"
    },
    "4": {
     "t": "bis unter die Dachhaut oder Rohdecke feuerhemmend (F 30 / REI 30)"
    },
    "5": {
     "t": "bis unter die Dachhaut oder Rohdecke feuerhemmend (F 30 / REI 30)"
    },
    "1a": {
     "t": "Wohngebäude: keine; sonst: bis unter die Dachhaut"
    },
    "1b": {
     "t": "Wohngebäude: keine; sonst: bis unter die Dachhaut"
    }
   },
   "hh": "MHHR: raumabschließende Bauteile bis an Dachhaut/Außenwand führen (laut Lernseite).",
   "rg": "§ 29 Abs. 4, Abs. 6",
   "pos": "dach-decke",
   "auftritt": "gebaeude",
   "merksatz": "Trennwand im Dachraum bis unter die Dachhaut führen. Endet sie an der Rohdecke, muss diese Decke feuerhemmend sein.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "trennwand_oeffnung",
   "name": "Öffnungen in Trennwänden",
   "gruppe": "Öffnungen",
   "kurz": "Öffnungen in Trennwänden sind auf die für die Nutzung erforderliche Zahl und Größe zu beschränken und mit besonderen Abschlüssen zu versehen.",
   "anf": {
    "2": {
     "t": "Wohngebäude: keine; sonst: feuerhemmend, dicht- und selbstschließend (T30-DS)",
     "h": "Der MBO-Text nennt \"feuerhemmende, dicht- und selbstschließende Abschlüsse\"; T30-DS ist die übliche Kurzform."
    },
    "3": {
     "t": "feuerhemmend, dicht- und selbstschließend (T30-DS)",
     "h": "Der MBO-Text nennt \"feuerhemmende, dicht- und selbstschließende Abschlüsse\"; T30-DS ist die übliche Kurzform."
    },
    "4": {
     "t": "feuerhemmend, dicht- und selbstschließend (T30-DS)",
     "h": "Der MBO-Text nennt \"feuerhemmende, dicht- und selbstschließende Abschlüsse\"; T30-DS ist die übliche Kurzform."
    },
    "5": {
     "t": "feuerhemmend, dicht- und selbstschließend (T30-DS)",
     "h": "Der MBO-Text nennt \"feuerhemmende, dicht- und selbstschließende Abschlüsse\"; T30-DS ist die übliche Kurzform."
    },
    "1a": {
     "t": "Wohngebäude: keine; sonst: feuerhemmend, dicht- und selbstschließend (T30-DS)",
     "h": "Der MBO-Text nennt \"feuerhemmende, dicht- und selbstschließende Abschlüsse\"; T30-DS ist die übliche Kurzform."
    },
    "1b": {
     "t": "Wohngebäude: keine; sonst: feuerhemmend, dicht- und selbstschließend (T30-DS)",
     "h": "Der MBO-Text nennt \"feuerhemmende, dicht- und selbstschließende Abschlüsse\"; T30-DS ist die übliche Kurzform."
    }
   },
   "hh": "MHHR: Tür der Nutzungseinheit zum Flur T30-RS (laut Lernseite).",
   "rg": "§ 29 Abs. 5, Abs. 6",
   "pos": "tuer",
   "auftritt": "mehrfach",
   "merksatz": "Türen in Trennwänden: feuerhemmend, dicht- und selbstschließend (T30-DS), Zahl und Größe auf das Nötige begrenzen.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "brandwand_abschluss",
   "name": "Gebäudeabschlusswand (Brandwand am Grundstücksrand)",
   "gruppe": "Raumabschluss",
   "kurz": "Eine Gebäudeabschlusswand ist erforderlich, wenn das Gebäude an oder mit weniger als 2,50 m Abstand zur Grundstücksgrenze steht, es sei denn, ein Abstand von mindestens 5 m zu Nachbargebäuden ist gesichert.",
   "anf": {
    "2": {
     "t": "Brandwand, ersatzweise hochfeuerhemmende Wand oder Abschlusswand F30 innen / F90 außen",
     "h": "Ausgenommen: Gebäude ohne Aufenthaltsräume und Feuerstätten bis 50 m³ BRI. Bei 5 m Abstand zu Gebäuden (rechtlich gesichert) entfällt die Wand."
    },
    "3": {
     "t": "Brandwand, ersatzweise hochfeuerhemmende Wand oder Abschlusswand F30 innen / F90 außen",
     "h": "Ausgenommen: Gebäude ohne Aufenthaltsräume und Feuerstätten bis 50 m³ BRI. Bei 5 m Abstand zu Gebäuden (rechtlich gesichert) entfällt die Wand."
    },
    "4": {
     "t": "Brandwand oder Wand hochfeuerhemmend auch bei zusätzlicher mechanischer Beanspruchung (HFH-M)",
     "h": "Ausgenommen: Gebäude ohne Aufenthaltsräume und Feuerstätten bis 50 m³ BRI. Bei 5 m Abstand zu Gebäuden (rechtlich gesichert) entfällt die Wand."
    },
    "5": {
     "t": "Bauart Brandwand (REI 90-M)",
     "h": "Ausgenommen: Gebäude ohne Aufenthaltsräume und Feuerstätten bis 50 m³ BRI. Bei 5 m Abstand zu Gebäuden (rechtlich gesichert) entfällt die Wand."
    },
    "1a": {
     "t": "Brandwand, ersatzweise hochfeuerhemmende Wand oder Abschlusswand F30 innen / F90 außen",
     "h": "Ausgenommen: Gebäude ohne Aufenthaltsräume und Feuerstätten bis 50 m³ BRI. Bei 5 m Abstand zu Gebäuden (rechtlich gesichert) entfällt die Wand."
    },
    "1b": {
     "t": "Brandwand, ersatzweise hochfeuerhemmende Wand oder Abschlusswand F30 innen / F90 außen",
     "h": "Ausgenommen: Gebäude ohne Aufenthaltsräume und Feuerstätten bis 50 m³ BRI. Bei 5 m Abstand zu Gebäuden (rechtlich gesichert) entfällt die Wand."
    }
   },
   "hh": "Sonderbau, Brandwand wie GK 5; MHHR ergänzt 0,50 m über Dach (laut Lernseite).",
   "rg": "§ 30 Abs. 1, 2 Nr. 1, Abs. 3",
   "pos": "brandwand",
   "auftritt": "gebaeude",
   "merksatz": "Grenzabstand unter 2,50 m: Gebäudeabschlusswand. Ausnahme: 5 m Abstand zum Nachbargebäude gesichert.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "brandwand_innere",
   "name": "Innere Brandwand / Brandabschnitte (40 m)",
   "gruppe": "Raumabschluss",
   "kurz": "Ausgedehnte Gebäude werden durch innere Brandwände in Abständen von höchstens 40 m in Brandabschnitte unterteilt.",
   "anf": {
    "2": {
     "t": "Brandwand oder Ersatzwand (HFH) im Abstand ≤ 40 m",
     "h": "Die Lernseite ergänzt \"40 m × 40 m = 1.600 m²\"; im MBO-Text steht nur der Abstand von nicht mehr als 40 m."
    },
    "3": {
     "t": "Brandwand oder Ersatzwand (HFH) im Abstand ≤ 40 m",
     "h": "Die Lernseite ergänzt \"40 m × 40 m = 1.600 m²\"; im MBO-Text steht nur der Abstand von nicht mehr als 40 m."
    },
    "4": {
     "t": "Brandwand oder Wand HFH-M im Abstand ≤ 40 m",
     "h": "Die Lernseite ergänzt \"40 m × 40 m = 1.600 m²\"; im MBO-Text steht nur der Abstand von nicht mehr als 40 m."
    },
    "5": {
     "t": "Bauart Brandwand (REI 90-M) im Abstand ≤ 40 m",
     "h": "Die Lernseite ergänzt \"40 m × 40 m = 1.600 m²\"; im MBO-Text steht nur der Abstand von nicht mehr als 40 m."
    },
    "1a": {
     "t": "Brandwand oder Ersatzwand (HFH) im Abstand ≤ 40 m",
     "h": "Die Lernseite ergänzt \"40 m × 40 m = 1.600 m²\"; im MBO-Text steht nur der Abstand von nicht mehr als 40 m."
    },
    "1b": {
     "t": "Brandwand oder Ersatzwand (HFH) im Abstand ≤ 40 m; landw. Gebäude zusätzlich ≤ 10 000 m³",
     "h": "Die Lernseite ergänzt \"40 m × 40 m = 1.600 m²\"; im MBO-Text steht nur der Abstand von nicht mehr als 40 m."
    }
   },
   "hh": "Sonderbau, Brandabschnitte nach MHHR/Sonderbauverordnungen (hier nicht geprüft).",
   "rg": "§ 30 Abs. 2 Nr. 2, Abs. 3",
   "pos": "brandwand",
   "auftritt": "mehrfach",
   "merksatz": "Ausgedehnte Gebäude: innere Brandwand spätestens alle 40 m. Die Fläche 1.600 m² nennt nur die Lernseite.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "brandwand_landwirtschaft",
   "name": "Brandwände bei landwirtschaftlicher Nutzung",
   "gruppe": "Raumabschluss",
   "kurz": "Landwirtschaftlich genutzte Gebäude werden in Brandabschnitte bis 10 000 m³ unterteilt. Zwischen Wohnteil und landwirtschaftlichem Teil ist eine Brandwand erforderlich.",
   "anf": {
    "2": {
     "t": "wie 1a, soweit landwirtschaftlich genutzt",
     "h": "Gebäudeabschlusswand zu angebautem landwirtschaftlichem Gebäude bzw. innere Brandwand zwischen Wohnteil und landwirtschaftlichem Teil."
    },
    "3": {
     "t": "wie 1a, soweit landwirtschaftlich genutzt",
     "h": "Gebäudeabschlusswand zu angebautem landwirtschaftlichem Gebäude bzw. innere Brandwand zwischen Wohnteil und landwirtschaftlichem Teil."
    },
    "4": {
     "t": "wie 1a, soweit landwirtschaftlich genutzt",
     "h": "Gebäudeabschlusswand zu angebautem landwirtschaftlichem Gebäude bzw. innere Brandwand zwischen Wohnteil und landwirtschaftlichem Teil."
    },
    "5": {
     "t": "wie 1a, soweit landwirtschaftlich genutzt",
     "h": "Gebäudeabschlusswand zu angebautem landwirtschaftlichem Gebäude bzw. innere Brandwand zwischen Wohnteil und landwirtschaftlichem Teil."
    },
    "1a": {
     "t": "wie Wohn-/landw. Teil: Brandwand; Ersatz feuerbeständige Wand bei ≤ 2 000 m³ landw. BRI",
     "h": "Gebäudeabschlusswand zu angebautem landwirtschaftlichem Gebäude bzw. innere Brandwand zwischen Wohnteil und landwirtschaftlichem Teil."
    },
    "1b": {
     "t": "Brandabschnitte ≤ 10 000 m³ BRI; Wohn-/landw. Trennung: Brandwand, Ersatz feuerbeständig bei ≤ 2 000 m³",
     "h": "Gebäudeabschlusswand zu angebautem landwirtschaftlichem Gebäude bzw. innere Brandwand zwischen Wohnteil und landwirtschaftlichem Teil."
    }
   },
   "hh": "nicht einschlägig (Hochhaus).",
   "rg": "§ 30 Abs. 2 Nr. 3 und 4, Abs. 3 S. 3; § 31 Abs. 2 S. 2 Nr. 2",
   "pos": "brandwand",
   "auftritt": "gebaeude",
   "merksatz": "Landwirtschaftlich genutzte Gebäude: Brandabschnitte bis 10 000 m³, Wohnteil und landwirtschaftlicher Teil durch Brandwand getrennt.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "brandwand_ersatz",
   "name": "Wand anstelle einer Brandwand",
   "gruppe": "Raumabschluss",
   "kurz": "In niedrigen Gebäudeklassen sind anstelle von Brandwänden geringere Wandqualitäten zulässig. Die Regeln für Öffnungen, Dachanschluss und Ecken gelten weiter.",
   "anf": {
    "2": {
     "t": "hochfeuerhemmende Wand; oder Abschlusswand F30 innen / F90 außen",
     "h": "Abschlusswand \"F30 innen / F90 außen\": von innen nach außen Feuerwiderstand der tragenden Teile, mind. F30, von außen nach innen feuerbeständig."
    },
    "3": {
     "t": "hochfeuerhemmende Wand; oder Abschlusswand F30 innen / F90 außen",
     "h": "Abschlusswand \"F30 innen / F90 außen\": von innen nach außen Feuerwiderstand der tragenden Teile, mind. F30, von außen nach innen feuerbeständig."
    },
    "4": {
     "t": "Wand hochfeuerhemmend auch bei zusätzlicher mechanischer Beanspruchung (HFH-M)",
     "h": "Abschlusswand \"F30 innen / F90 außen\": von innen nach außen Feuerwiderstand der tragenden Teile, mind. F30, von außen nach innen feuerbeständig."
    },
    "5": {
     "t": "keine Ersatzwand zulässig: Brandwand erforderlich",
     "h": "Abschlusswand \"F30 innen / F90 außen\": von innen nach außen Feuerwiderstand der tragenden Teile, mind. F30, von außen nach innen feuerbeständig."
    },
    "1a": {
     "t": "hochfeuerhemmende Wand; oder Abschlusswand F30 innen / F90 außen",
     "h": "Abschlusswand \"F30 innen / F90 außen\": von innen nach außen Feuerwiderstand der tragenden Teile, mind. F30, von außen nach innen feuerbeständig."
    },
    "1b": {
     "t": "hochfeuerhemmende Wand; oder Abschlusswand F30 innen / F90 außen",
     "h": "Abschlusswand \"F30 innen / F90 außen\": von innen nach außen Feuerwiderstand der tragenden Teile, mind. F30, von außen nach innen feuerbeständig."
    }
   },
   "hh": "nicht zulässig (Brandwand erforderlich).",
   "rg": "§ 30 Abs. 3 S. 2 und 3, Abs. 10",
   "pos": "brandwand",
   "auftritt": "gebaeude",
   "merksatz": "Statt Brandwand: GK 1 bis 3 hochfeuerhemmende Wand, GK 4 hochfeuerhemmend mit mechanischer Beanspruchung, GK 5 gibt es keinen Ersatz.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "brandwand_ausfuehrung",
   "name": "Brandwand: Bauart und Lage",
   "gruppe": "Raumabschluss",
   "kurz": "Brandwände sind auch unter zusätzlicher mechanischer Beanspruchung feuerbeständig und aus nichtbrennbaren Baustoffen. Sie gehen bis zur Bedachung durch und stehen in allen Geschossen übereinander.",
   "anf": {
    "2": {
     "t": "Bauart Brandwand (REI 90-M): feuerbeständig, nichtbrennbar, auch bei zusätzlicher mechanischer Beanspruchung (F 90-A / REI 90-M)",
     "h": "Versatz geschossweise nur bei inneren Brandwänden: Decken feuerbeständig, nichtbrennbar, ohne Öffnungen; Stützbauteile feuerbeständig, nichtbrennbar; Außenwände im Versatzbereich feuerbeständig; Öffnungen so, dass keine Brandausbreitung zu befürchten ist."
    },
    "3": {
     "t": "Bauart Brandwand (REI 90-M): feuerbeständig, nichtbrennbar, auch bei zusätzlicher mechanischer Beanspruchung (F 90-A / REI 90-M)",
     "h": "Versatz geschossweise nur bei inneren Brandwänden: Decken feuerbeständig, nichtbrennbar, ohne Öffnungen; Stützbauteile feuerbeständig, nichtbrennbar; Außenwände im Versatzbereich feuerbeständig; Öffnungen so, dass keine Brandausbreitung zu befürchten ist."
    },
    "4": {
     "t": "Bauart Brandwand (REI 90-M): feuerbeständig, nichtbrennbar, auch bei zusätzlicher mechanischer Beanspruchung (F 90-A / REI 90-M)",
     "h": "Versatz geschossweise nur bei inneren Brandwänden: Decken feuerbeständig, nichtbrennbar, ohne Öffnungen; Stützbauteile feuerbeständig, nichtbrennbar; Außenwände im Versatzbereich feuerbeständig; Öffnungen so, dass keine Brandausbreitung zu befürchten ist."
    },
    "5": {
     "t": "Bauart Brandwand (REI 90-M): feuerbeständig, nichtbrennbar, auch bei zusätzlicher mechanischer Beanspruchung (F 90-A / REI 90-M)",
     "h": "Versatz geschossweise nur bei inneren Brandwänden: Decken feuerbeständig, nichtbrennbar, ohne Öffnungen; Stützbauteile feuerbeständig, nichtbrennbar; Außenwände im Versatzbereich feuerbeständig; Öffnungen so, dass keine Brandausbreitung zu befürchten ist."
    },
    "1a": {
     "t": "Bauart Brandwand (REI 90-M): feuerbeständig, nichtbrennbar, auch bei zusätzlicher mechanischer Beanspruchung (F 90-A / REI 90-M)",
     "h": "Versatz geschossweise nur bei inneren Brandwänden: Decken feuerbeständig, nichtbrennbar, ohne Öffnungen; Stützbauteile feuerbeständig, nichtbrennbar; Außenwände im Versatzbereich feuerbeständig; Öffnungen so, dass keine Brandausbreitung zu befürchten ist."
    },
    "1b": {
     "t": "Bauart Brandwand (REI 90-M): feuerbeständig, nichtbrennbar, auch bei zusätzlicher mechanischer Beanspruchung (F 90-A / REI 90-M)",
     "h": "Versatz geschossweise nur bei inneren Brandwänden: Decken feuerbeständig, nichtbrennbar, ohne Öffnungen; Stützbauteile feuerbeständig, nichtbrennbar; Außenwände im Versatzbereich feuerbeständig; Öffnungen so, dass keine Brandausbreitung zu befürchten ist."
    }
   },
   "hh": "wie GK 5; zusätzlich MHHR.",
   "rg": "§ 30 Abs. 3 S. 1, Abs. 4",
   "pos": "brandwand",
   "auftritt": "mehrfach",
   "merksatz": "Brandwand: feuerbeständig, nichtbrennbar, auch bei mechanischer Beanspruchung (REI 90-M). Durchgehend übereinander bis zur Bedachung.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "brandwand_dach",
   "name": "Brandwand über Dach / Dachüberstand",
   "gruppe": "Raumabschluss",
   "kurz": "Brandwände werden 0,30 m über die Bedachung geführt oder in Dachhöhe mit einer beidseitig 0,50 m auskragenden feuerbeständigen Platte aus nichtbrennbaren Baustoffen abgeschlossen. Brennbare Dachteile dürfen nicht darüber hinweggeführt werden.",
   "anf": {
    "2": {
     "t": "mindestens bis unter die Dachhaut",
     "h": "Dachausbau zu GK 4: Hohlräume vollständig mit nichtbrennbaren Baustoffen ausfüllen (§ 30 Abs. 5 S. 3 und 4)."
    },
    "3": {
     "t": "mindestens bis unter die Dachhaut",
     "h": "Dachausbau zu GK 4: Hohlräume vollständig mit nichtbrennbaren Baustoffen ausfüllen (§ 30 Abs. 5 S. 3 und 4)."
    },
    "4": {
     "t": "0,30 m über Bedachung oder 0,50 m beidseitig auskragende feuerbeständige Platte",
     "h": "Dachausbau zu GK 4: Hohlräume vollständig mit nichtbrennbaren Baustoffen ausfüllen (§ 30 Abs. 5 S. 3 und 4)."
    },
    "5": {
     "t": "0,30 m über Bedachung oder 0,50 m beidseitig auskragende feuerbeständige Platte",
     "h": "Dachausbau zu GK 4: Hohlräume vollständig mit nichtbrennbaren Baustoffen ausfüllen (§ 30 Abs. 5 S. 3 und 4)."
    },
    "1a": {
     "t": "mindestens bis unter die Dachhaut",
     "h": "Dachausbau zu GK 4: Hohlräume vollständig mit nichtbrennbaren Baustoffen ausfüllen (§ 30 Abs. 5 S. 3 und 4)."
    },
    "1b": {
     "t": "mindestens bis unter die Dachhaut",
     "h": "Dachausbau zu GK 4: Hohlräume vollständig mit nichtbrennbaren Baustoffen ausfüllen (§ 30 Abs. 5 S. 3 und 4)."
    }
   },
   "hh": "MHHR: 0,50 m über Dach (laut Lernseite, mehr als MBO).",
   "rg": "§ 30 Abs. 5; § 32 Abs. 5 S. 2 Nr. 1",
   "pos": "brandwand",
   "auftritt": "gebaeude",
   "merksatz": "Brandwand: 0,30 m über die Bedachung oder 0,50 m Kragplatte beidseitig; in GK 1 bis 3 genügt bis unter die Dachhaut.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "brandwand_innenecke",
   "name": "Brandwand an inneren Ecken",
   "gruppe": "Raumabschluss",
   "kurz": "Stoßen Gebäude oder Gebäudeteile über Eck zusammen und werden durch eine Brandwand getrennt, muss die Wand einen Mindestabstand zur inneren Ecke haben.",
   "anf": {
    "2": {
     "t": "Abstand zur inneren Ecke ≥ 5 m",
     "h": "Entfällt, wenn der Winkel der Ecke > 120° ist oder eine Außenwand auf 5 m Länge öffnungslos ist: feuerbeständig und nichtbrennbar, bei GK 1 bis 4 öffnungslos hochfeuerhemmend."
    },
    "3": {
     "t": "Abstand zur inneren Ecke ≥ 5 m",
     "h": "Entfällt, wenn der Winkel der Ecke > 120° ist oder eine Außenwand auf 5 m Länge öffnungslos ist: feuerbeständig und nichtbrennbar, bei GK 1 bis 4 öffnungslos hochfeuerhemmend."
    },
    "4": {
     "t": "Abstand zur inneren Ecke ≥ 5 m",
     "h": "Entfällt, wenn der Winkel der Ecke > 120° ist oder eine Außenwand auf 5 m Länge öffnungslos ist: feuerbeständig und nichtbrennbar, bei GK 1 bis 4 öffnungslos hochfeuerhemmend."
    },
    "5": {
     "t": "Abstand zur inneren Ecke ≥ 5 m",
     "h": "Entfällt, wenn der Winkel der Ecke > 120° ist oder eine Außenwand auf 5 m Länge öffnungslos ist: feuerbeständig und nichtbrennbar, bei GK 1 bis 4 öffnungslos hochfeuerhemmend."
    },
    "1a": {
     "t": "Abstand zur inneren Ecke ≥ 5 m",
     "h": "Entfällt, wenn der Winkel der Ecke > 120° ist oder eine Außenwand auf 5 m Länge öffnungslos ist: feuerbeständig und nichtbrennbar, bei GK 1 bis 4 öffnungslos hochfeuerhemmend."
    },
    "1b": {
     "t": "Abstand zur inneren Ecke ≥ 5 m",
     "h": "Entfällt, wenn der Winkel der Ecke > 120° ist oder eine Außenwand auf 5 m Länge öffnungslos ist: feuerbeständig und nichtbrennbar, bei GK 1 bis 4 öffnungslos hochfeuerhemmend."
    }
   },
   "hh": "wie GK 5.",
   "rg": "§ 30 Abs. 6",
   "pos": "brandwand",
   "auftritt": "mehrfach",
   "merksatz": "Brandwand über Eck: mindestens 5 m von der inneren Ecke, außer Winkel über 120 Grad oder 5 m öffnungslose Außenwand.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "brandwand_einbauten",
   "name": "Brandwand: brennbare Bauteile, Bekleidung, Einbauten",
   "gruppe": "Raumabschluss",
   "kurz": "Brennbare Bauteile dürfen nicht über Brandwände hinweggeführt werden. Bauteile, Leitungen und Schlitze dürfen die Feuerwiderstandsfähigkeit nicht beeinträchtigen.",
   "anf": {
    "2": {
     "t": "Keine brennbaren Bauteile über der Brandwand; Außenwandbekleidung von Gebäudeabschlusswänden einschließlich Dämmstoffen und Unterkonstruktion nichtbrennbar",
     "h": "Hinterlüftete Fassaden/Doppelfassaden: besondere Vorkehrungen gegen seitliche Brandausbreitung im Bereich der Brandwand. Konkrete Ausführung nicht im MBO-Text (technische Baubestimmungen)."
    },
    "3": {
     "t": "Keine brennbaren Bauteile über der Brandwand; Außenwandbekleidung von Gebäudeabschlusswänden einschließlich Dämmstoffen und Unterkonstruktion nichtbrennbar",
     "h": "Hinterlüftete Fassaden/Doppelfassaden: besondere Vorkehrungen gegen seitliche Brandausbreitung im Bereich der Brandwand. Konkrete Ausführung nicht im MBO-Text (technische Baubestimmungen)."
    },
    "4": {
     "t": "Keine brennbaren Bauteile über der Brandwand; Außenwandbekleidung von Gebäudeabschlusswänden einschließlich Dämmstoffen und Unterkonstruktion nichtbrennbar",
     "h": "Hinterlüftete Fassaden/Doppelfassaden: besondere Vorkehrungen gegen seitliche Brandausbreitung im Bereich der Brandwand. Konkrete Ausführung nicht im MBO-Text (technische Baubestimmungen)."
    },
    "5": {
     "t": "Keine brennbaren Bauteile über der Brandwand; Außenwandbekleidung von Gebäudeabschlusswänden einschließlich Dämmstoffen und Unterkonstruktion nichtbrennbar",
     "h": "Hinterlüftete Fassaden/Doppelfassaden: besondere Vorkehrungen gegen seitliche Brandausbreitung im Bereich der Brandwand. Konkrete Ausführung nicht im MBO-Text (technische Baubestimmungen)."
    },
    "1a": {
     "t": "Keine brennbaren Bauteile über der Brandwand; Außenwandbekleidung von Gebäudeabschlusswänden einschließlich Dämmstoffen und Unterkonstruktion nichtbrennbar",
     "h": "Hinterlüftete Fassaden/Doppelfassaden: besondere Vorkehrungen gegen seitliche Brandausbreitung im Bereich der Brandwand. Konkrete Ausführung nicht im MBO-Text (technische Baubestimmungen)."
    },
    "1b": {
     "t": "Keine brennbaren Bauteile über der Brandwand; Außenwandbekleidung von Gebäudeabschlusswänden einschließlich Dämmstoffen und Unterkonstruktion nichtbrennbar",
     "h": "Hinterlüftete Fassaden/Doppelfassaden: besondere Vorkehrungen gegen seitliche Brandausbreitung im Bereich der Brandwand. Konkrete Ausführung nicht im MBO-Text (technische Baubestimmungen)."
    }
   },
   "hh": "MHHR: Brandwand im Außenwandbereich 0,50 m über Außenwand, 1,0 m nichtbrennbarer Abschnitt (laut Lernseite).",
   "rg": "§ 30 Abs. 7, Abs. 10",
   "pos": "brandwand",
   "auftritt": "gebaeude",
   "unklar": true,
   "merksatz": "Über Brandwände nichts Brennbares hinwegführen. Fassade von Gebäudeabschlusswänden samt Dämmung nichtbrennbar.",
   "quelle": "MBO"
  },
  {
   "id": "brandwand_oeffnungen",
   "name": "Öffnungen und Verglasungen in Brandwänden",
   "gruppe": "Öffnungen",
   "kurz": "In Gebäudeabschlusswänden sind Öffnungen unzulässig. In inneren Brandwänden sind sie nur beschränkt zulässig und müssen besondere Abschlüsse haben.",
   "anf": {
    "2": {
     "t": "Gebäudeabschlusswand: Öffnungen unzulässig. Innere Brandwand: auf erforderliche Zahl/Größe beschränkt, Abschluss feuerbeständig, dicht- und selbstschließend (Kurzform T90-DS)",
     "h": "Feuerbeständige Verglasungen nur in inneren Brandwänden, auf erforderliche Zahl/Größe beschränkt. Die Bezeichnung \"T90-DS\" steht nicht im MBO-Text; der Text verlangt feuerbeständig, dicht- und selbstschließend."
    },
    "3": {
     "t": "Gebäudeabschlusswand: Öffnungen unzulässig. Innere Brandwand: auf erforderliche Zahl/Größe beschränkt, Abschluss feuerbeständig, dicht- und selbstschließend (Kurzform T90-DS)",
     "h": "Feuerbeständige Verglasungen nur in inneren Brandwänden, auf erforderliche Zahl/Größe beschränkt. Die Bezeichnung \"T90-DS\" steht nicht im MBO-Text; der Text verlangt feuerbeständig, dicht- und selbstschließend."
    },
    "4": {
     "t": "Gebäudeabschlusswand: Öffnungen unzulässig. Innere Brandwand: auf erforderliche Zahl/Größe beschränkt, Abschluss feuerbeständig, dicht- und selbstschließend (Kurzform T90-DS)",
     "h": "Feuerbeständige Verglasungen nur in inneren Brandwänden, auf erforderliche Zahl/Größe beschränkt. Die Bezeichnung \"T90-DS\" steht nicht im MBO-Text; der Text verlangt feuerbeständig, dicht- und selbstschließend."
    },
    "5": {
     "t": "Gebäudeabschlusswand: Öffnungen unzulässig. Innere Brandwand: auf erforderliche Zahl/Größe beschränkt, Abschluss feuerbeständig, dicht- und selbstschließend (Kurzform T90-DS)",
     "h": "Feuerbeständige Verglasungen nur in inneren Brandwänden, auf erforderliche Zahl/Größe beschränkt. Die Bezeichnung \"T90-DS\" steht nicht im MBO-Text; der Text verlangt feuerbeständig, dicht- und selbstschließend."
    },
    "1a": {
     "t": "Gebäudeabschlusswand: Öffnungen unzulässig. Innere Brandwand: auf erforderliche Zahl/Größe beschränkt, Abschluss feuerbeständig, dicht- und selbstschließend (Kurzform T90-DS)",
     "h": "Feuerbeständige Verglasungen nur in inneren Brandwänden, auf erforderliche Zahl/Größe beschränkt. Die Bezeichnung \"T90-DS\" steht nicht im MBO-Text; der Text verlangt feuerbeständig, dicht- und selbstschließend."
    },
    "1b": {
     "t": "Gebäudeabschlusswand: Öffnungen unzulässig. Innere Brandwand: auf erforderliche Zahl/Größe beschränkt, Abschluss feuerbeständig, dicht- und selbstschließend (Kurzform T90-DS)",
     "h": "Feuerbeständige Verglasungen nur in inneren Brandwänden, auf erforderliche Zahl/Größe beschränkt. Die Bezeichnung \"T90-DS\" steht nicht im MBO-Text; der Text verlangt feuerbeständig, dicht- und selbstschließend."
    }
   },
   "hh": "MHHR: Türen in Brandwänden feuerbeständig (laut Lernseite: Sonderbauten T30-RS bzw. feuerbeständig).",
   "rg": "§ 30 Abs. 8 und 9, Abs. 10",
   "pos": "tuer",
   "auftritt": "mehrfach",
   "merksatz": "Gebäudeabschlusswand ohne Öffnungen. Innere Brandwand: wenige Öffnungen mit feuerbeständigem, dicht- und selbstschließendem Abschluss.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "aw_allgemein",
   "name": "Außenwände: allgemeine Brandausbreitung",
   "gruppe": "Hülle",
   "kurz": "Außenwände samt Brüstungen und Schürzen müssen so gebaut sein, dass sich ein Brand auf und in diesen Bauteilen ausreichend lang nicht ausbreitet.",
   "anf": {
    "2": {
     "t": "Brandausbreitung auf und in der Außenwand ausreichend lang begrenzen"
    },
    "3": {
     "t": "Brandausbreitung auf und in der Außenwand ausreichend lang begrenzen"
    },
    "4": {
     "t": "Brandausbreitung auf und in der Außenwand ausreichend lang begrenzen"
    },
    "5": {
     "t": "Brandausbreitung auf und in der Außenwand ausreichend lang begrenzen"
    },
    "1a": {
     "t": "Brandausbreitung auf und in der Außenwand ausreichend lang begrenzen"
    },
    "1b": {
     "t": "Brandausbreitung auf und in der Außenwand ausreichend lang begrenzen"
    }
   },
   "hh": "MHHR: vertikale Brandausbreitung: Ausladungen und Wandabschnitte mindestens 1,5 m (laut Lernseite, Hochhaus/Sonderbau).",
   "rg": "§ 28 Abs. 1",
   "pos": "wand-aussen",
   "auftritt": "gebaeude",
   "merksatz": "Die Außenwand darf einen Brand nicht schnell weitertragen, weder auf der Oberfläche noch im Inneren der Konstruktion.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "aw_nichttragend",
   "name": "Nichttragende Außenwände",
   "gruppe": "Hülle",
   "kurz": "Nichttragende Außenwände bestehen aus nichtbrennbaren Baustoffen. Brennbare sind zulässig, wenn die Wand als raumabschließendes Bauteil feuerhemmend ist.",
   "anf": {
    "2": {
     "t": "keine Anforderung",
     "h": "Ausgenommen: Türen, Fenster, Fugendichtungen, brennbare Dämmstoffe in nichtbrennbaren geschlossenen Profilen, Kleinteile. Abs. 2 gilt nicht für GK 1 bis 3 (§ 28 Abs. 5)."
    },
    "3": {
     "t": "keine Anforderung",
     "h": "Ausgenommen: Türen, Fenster, Fugendichtungen, brennbare Dämmstoffe in nichtbrennbaren geschlossenen Profilen, Kleinteile. Abs. 2 gilt nicht für GK 1 bis 3 (§ 28 Abs. 5)."
    },
    "4": {
     "t": "nichtbrennbar oder brennbar mit feuerhemmend (F 30 / REI 30)",
     "h": "Ausgenommen: Türen, Fenster, Fugendichtungen, brennbare Dämmstoffe in nichtbrennbaren geschlossenen Profilen, Kleinteile. Abs. 2 gilt nicht für GK 1 bis 3 (§ 28 Abs. 5)."
    },
    "5": {
     "t": "nichtbrennbar oder brennbar mit feuerhemmend (F 30 / REI 30)",
     "h": "Ausgenommen: Türen, Fenster, Fugendichtungen, brennbare Dämmstoffe in nichtbrennbaren geschlossenen Profilen, Kleinteile. Abs. 2 gilt nicht für GK 1 bis 3 (§ 28 Abs. 5)."
    },
    "1a": {
     "t": "keine Anforderung",
     "h": "Ausgenommen: Türen, Fenster, Fugendichtungen, brennbare Dämmstoffe in nichtbrennbaren geschlossenen Profilen, Kleinteile. Abs. 2 gilt nicht für GK 1 bis 3 (§ 28 Abs. 5)."
    },
    "1b": {
     "t": "keine Anforderung",
     "h": "Ausgenommen: Türen, Fenster, Fugendichtungen, brennbare Dämmstoffe in nichtbrennbaren geschlossenen Profilen, Kleinteile. Abs. 2 gilt nicht für GK 1 bis 3 (§ 28 Abs. 5)."
    }
   },
   "hh": "wie GK 5; ohne Sprinkler laut Lernseite nichtbrennbare Baustoffe (Sonderbau).",
   "rg": "§ 28 Abs. 2, Abs. 5",
   "pos": "wand-aussen",
   "auftritt": "gebaeude",
   "merksatz": "Nichttragende Außenwände ab GK 4: nichtbrennbar oder, wenn brennbar, feuerhemmend. In GK 1 bis 3 gilt das nicht.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "aw_oberflaeche",
   "name": "Außenwandoberflächen, Bekleidungen und Dämmstoffe",
   "gruppe": "Hülle",
   "kurz": "Oberflächen, Bekleidungen, Dämmstoffe und Unterkonstruktionen von Außenwänden müssen schwerentflammbar sein und dürfen nicht brennend abfallen oder abtropfen.",
   "anf": {
    "2": {
     "t": "keine Anforderung",
     "h": "Unterkonstruktion aus normalentflammbaren Baustoffen zulässig, wenn § 28 Abs. 1 erfüllt ist. Hinterlüftete Bekleidungen nach Technischen Baubestimmungen: mit Ausnahme der Dämmstoffe normalentflammbar zulässig (Abs. 5 S. 2). Abs. 3 gilt nicht für GK 1 bis 3."
    },
    "3": {
     "t": "keine Anforderung",
     "h": "Unterkonstruktion aus normalentflammbaren Baustoffen zulässig, wenn § 28 Abs. 1 erfüllt ist. Hinterlüftete Bekleidungen nach Technischen Baubestimmungen: mit Ausnahme der Dämmstoffe normalentflammbar zulässig (Abs. 5 S. 2). Abs. 3 gilt nicht für GK 1 bis 3."
    },
    "4": {
     "t": "schwerentflammbar",
     "h": "Unterkonstruktion aus normalentflammbaren Baustoffen zulässig, wenn § 28 Abs. 1 erfüllt ist. Hinterlüftete Bekleidungen nach Technischen Baubestimmungen: mit Ausnahme der Dämmstoffe normalentflammbar zulässig (Abs. 5 S. 2). Abs. 3 gilt nicht für GK 1 bis 3."
    },
    "5": {
     "t": "schwerentflammbar",
     "h": "Unterkonstruktion aus normalentflammbaren Baustoffen zulässig, wenn § 28 Abs. 1 erfüllt ist. Hinterlüftete Bekleidungen nach Technischen Baubestimmungen: mit Ausnahme der Dämmstoffe normalentflammbar zulässig (Abs. 5 S. 2). Abs. 3 gilt nicht für GK 1 bis 3."
    },
    "1a": {
     "t": "keine Anforderung",
     "h": "Unterkonstruktion aus normalentflammbaren Baustoffen zulässig, wenn § 28 Abs. 1 erfüllt ist. Hinterlüftete Bekleidungen nach Technischen Baubestimmungen: mit Ausnahme der Dämmstoffe normalentflammbar zulässig (Abs. 5 S. 2). Abs. 3 gilt nicht für GK 1 bis 3."
    },
    "1b": {
     "t": "keine Anforderung",
     "h": "Unterkonstruktion aus normalentflammbaren Baustoffen zulässig, wenn § 28 Abs. 1 erfüllt ist. Hinterlüftete Bekleidungen nach Technischen Baubestimmungen: mit Ausnahme der Dämmstoffe normalentflammbar zulässig (Abs. 5 S. 2). Abs. 3 gilt nicht für GK 1 bis 3."
    }
   },
   "hh": "MHHR/Sonderbau: nichtbrennbar im Hochhausbereich (Lernseite nennt hierfür keine eigenen Werte; unklar).",
   "rg": "§ 28 Abs. 3 und 5",
   "pos": "wand-aussen",
   "auftritt": "gebaeude",
   "unklar": true,
   "merksatz": "Fassade samt Dämmung ab GK 4 mindestens schwerentflammbar, kein brennendes Abtropfen. In GK 1 bis 3 entfällt die Anforderung.",
   "quelle": "MBO"
  },
  {
   "id": "aw_balkon_solar",
   "name": "Balkonbekleidungen und Solaranlagen an Außenwänden",
   "gruppe": "Hülle",
   "kurz": "Hochgeführte Balkonbekleidungen und Solaranlagen an Außenwänden, die mehr als zwei Geschosse überbrücken, müssen schwerentflammbar sein.",
   "anf": {
    "2": {
     "t": "keine Anforderung",
     "h": "Gilt für Balkonbekleidungen über die erforderliche Umwehrungshöhe hinaus und für mehr als zwei Geschosse überbrückende Solaranlagen; kein brennendes Abfallen/Abtropfen."
    },
    "3": {
     "t": "keine Anforderung",
     "h": "Gilt für Balkonbekleidungen über die erforderliche Umwehrungshöhe hinaus und für mehr als zwei Geschosse überbrückende Solaranlagen; kein brennendes Abfallen/Abtropfen."
    },
    "4": {
     "t": "schwerentflammbar",
     "h": "Gilt für Balkonbekleidungen über die erforderliche Umwehrungshöhe hinaus und für mehr als zwei Geschosse überbrückende Solaranlagen; kein brennendes Abfallen/Abtropfen."
    },
    "5": {
     "t": "schwerentflammbar",
     "h": "Gilt für Balkonbekleidungen über die erforderliche Umwehrungshöhe hinaus und für mehr als zwei Geschosse überbrückende Solaranlagen; kein brennendes Abfallen/Abtropfen."
    },
    "1a": {
     "t": "keine Anforderung",
     "h": "Gilt für Balkonbekleidungen über die erforderliche Umwehrungshöhe hinaus und für mehr als zwei Geschosse überbrückende Solaranlagen; kein brennendes Abfallen/Abtropfen."
    },
    "1b": {
     "t": "keine Anforderung",
     "h": "Gilt für Balkonbekleidungen über die erforderliche Umwehrungshöhe hinaus und für mehr als zwei Geschosse überbrückende Solaranlagen; kein brennendes Abfallen/Abtropfen."
    }
   },
   "hh": "unklar (MHHR hier nicht geprüft).",
   "rg": "§ 28 Abs. 3 S. 2 und 3, Abs. 5",
   "pos": "wand-aussen",
   "auftritt": "mehrfach",
   "unklar": true,
   "merksatz": "Balkonbekleidungen und große Fassaden-Solaranlagen ab GK 4 schwerentflammbar.",
   "quelle": "MBO"
  },
  {
   "id": "aw_hinterlueftet",
   "name": "Hinterlüftete Fassaden, Doppelfassaden, Brandsperren",
   "gruppe": "Hülle",
   "kurz": "Bei geschossübergreifenden Hohl- oder Lufträumen (hinterlüftete Fassade, Doppelfassade) sind besondere Vorkehrungen gegen Brandausbreitung zu treffen.",
   "anf": {
    "2": {
     "t": "keine Anforderung",
     "h": "Welche Vorkehrungen (z. B. Brandsperren) nötig sind, steht nicht im MBO-Text; Ausführung nach Technischen Baubestimmungen (hier nicht geprüft)."
    },
    "3": {
     "t": "Doppelfassade: besondere Vorkehrungen; hinterlüftete Fassade: nicht gefordert",
     "h": "Welche Vorkehrungen (z. B. Brandsperren) nötig sind, steht nicht im MBO-Text; Ausführung nach Technischen Baubestimmungen (hier nicht geprüft)."
    },
    "4": {
     "t": "hinterlüftete Fassade und Doppelfassade: besondere Vorkehrungen",
     "h": "Welche Vorkehrungen (z. B. Brandsperren) nötig sind, steht nicht im MBO-Text; Ausführung nach Technischen Baubestimmungen (hier nicht geprüft)."
    },
    "5": {
     "t": "hinterlüftete Fassade und Doppelfassade: besondere Vorkehrungen",
     "h": "Welche Vorkehrungen (z. B. Brandsperren) nötig sind, steht nicht im MBO-Text; Ausführung nach Technischen Baubestimmungen (hier nicht geprüft)."
    },
    "1a": {
     "t": "keine Anforderung",
     "h": "Welche Vorkehrungen (z. B. Brandsperren) nötig sind, steht nicht im MBO-Text; Ausführung nach Technischen Baubestimmungen (hier nicht geprüft)."
    },
    "1b": {
     "t": "keine Anforderung",
     "h": "Welche Vorkehrungen (z. B. Brandsperren) nötig sind, steht nicht im MBO-Text; Ausführung nach Technischen Baubestimmungen (hier nicht geprüft)."
    }
   },
   "hh": "unklar.",
   "rg": "§ 28 Abs. 4 und 5",
   "pos": "wand-aussen",
   "auftritt": "gebaeude",
   "unklar": true,
   "merksatz": "Hinterlüftete Fassade ab GK 4, Doppelfassade ab GK 3: besondere Vorkehrungen gegen Brandausbreitung, zum Beispiel Brandsperren.",
   "quelle": "MBO"
  },
  {
   "id": "aw_brandueberschlag",
   "name": "Brüstungen und Schürzen / Brandüberschlag",
   "gruppe": "Hülle",
   "kurz": "Das MBO verlangt für Brüstungen und Schürzen nur allgemein, dass die Brandausbreitung ausreichend lang begrenzt wird. Konkrete Maße für Standardgebäude nennt es nicht.",
   "anf": {
    "2": {
     "t": "keine Maßangabe im MBO (Brüstungs-/Schürzenhöhe)",
     "h": "Konkrete Höhen/Auskragungen: Lernseite nennt nur Hochhaus/Sonderbau (1,5 m); für Standardgebäude unklar."
    },
    "3": {
     "t": "keine Maßangabe im MBO (Brüstungs-/Schürzenhöhe)",
     "h": "Konkrete Höhen/Auskragungen: Lernseite nennt nur Hochhaus/Sonderbau (1,5 m); für Standardgebäude unklar."
    },
    "4": {
     "t": "keine Maßangabe im MBO (Brüstungs-/Schürzenhöhe)",
     "h": "Konkrete Höhen/Auskragungen: Lernseite nennt nur Hochhaus/Sonderbau (1,5 m); für Standardgebäude unklar."
    },
    "5": {
     "t": "keine Maßangabe im MBO (Brüstungs-/Schürzenhöhe)",
     "h": "Konkrete Höhen/Auskragungen: Lernseite nennt nur Hochhaus/Sonderbau (1,5 m); für Standardgebäude unklar."
    },
    "1a": {
     "t": "keine Maßangabe im MBO (Brüstungs-/Schürzenhöhe)",
     "h": "Konkrete Höhen/Auskragungen: Lernseite nennt nur Hochhaus/Sonderbau (1,5 m); für Standardgebäude unklar."
    },
    "1b": {
     "t": "keine Maßangabe im MBO (Brüstungs-/Schürzenhöhe)",
     "h": "Konkrete Höhen/Auskragungen: Lernseite nennt nur Hochhaus/Sonderbau (1,5 m); für Standardgebäude unklar."
    }
   },
   "hh": "MHHR (laut Lernseite): auskragende Bauteile bzw. Wandabschnitte zwischen Öffnungen mindestens 1,5 m.",
   "rg": "§ 28 Abs. 1",
   "pos": "wand-aussen",
   "auftritt": "geschoss",
   "unklar": true,
   "quelle": "Lernseite",
   "merksatz": "Brandüberschlag zwischen Geschossen: MBO fordert nur allgemein Begrenzung; Zahlenwerte kommen aus Sonderbauregeln."
  },
  {
   "id": "bedachung_hart",
   "name": "Bedachung: harte Bedachung",
   "gruppe": "Hülle",
   "kurz": "Bedachungen müssen gegen Flugfeuer und strahlende Wärme ausreichend lang widerstandsfähig sein (harte Bedachung).",
   "anf": {
    "2": {
     "t": "harte Bedachung",
     "h": "Ausnahmen: lichtdurchlässige Teilflächen aus brennbaren Baustoffen und begrünte Bedachungen, wenn keine Brandentstehung zu befürchten ist (§ 32 Abs. 4); weitere Ausnahmen in Abs. 3."
    },
    "3": {
     "t": "harte Bedachung",
     "h": "Ausnahmen: lichtdurchlässige Teilflächen aus brennbaren Baustoffen und begrünte Bedachungen, wenn keine Brandentstehung zu befürchten ist (§ 32 Abs. 4); weitere Ausnahmen in Abs. 3."
    },
    "4": {
     "t": "harte Bedachung",
     "h": "Ausnahmen: lichtdurchlässige Teilflächen aus brennbaren Baustoffen und begrünte Bedachungen, wenn keine Brandentstehung zu befürchten ist (§ 32 Abs. 4); weitere Ausnahmen in Abs. 3."
    },
    "5": {
     "t": "harte Bedachung",
     "h": "Ausnahmen: lichtdurchlässige Teilflächen aus brennbaren Baustoffen und begrünte Bedachungen, wenn keine Brandentstehung zu befürchten ist (§ 32 Abs. 4); weitere Ausnahmen in Abs. 3."
    },
    "1a": {
     "t": "harte Bedachung",
     "h": "Ausnahmen: lichtdurchlässige Teilflächen aus brennbaren Baustoffen und begrünte Bedachungen, wenn keine Brandentstehung zu befürchten ist (§ 32 Abs. 4); weitere Ausnahmen in Abs. 3."
    },
    "1b": {
     "t": "harte Bedachung",
     "h": "Ausnahmen: lichtdurchlässige Teilflächen aus brennbaren Baustoffen und begrünte Bedachungen, wenn keine Brandentstehung zu befürchten ist (§ 32 Abs. 4); weitere Ausnahmen in Abs. 3."
    }
   },
   "hh": "harte Bedachung (Lernseite).",
   "rg": "§ 32 Abs. 1, 3 und 4",
   "pos": "dach",
   "auftritt": "gebaeude",
   "merksatz": "Dächer brauchen eine harte Bedachung: widerstandsfähig gegen Flugfeuer und strahlende Wärme.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "bedachung_weich",
   "name": "Weiche Bedachung nur mit Abständen",
   "gruppe": "Hülle",
   "kurz": "Bedachungen, die nicht hart sind, sind nur bei Gebäuden der GK 1 bis 3 zulässig, wenn große Abstände zu Grenzen und Nachbargebäuden eingehalten werden.",
   "anf": {
    "2": {
     "t": "zulässig: Grenze ≥ 12 m (Wohngebäude 6 m); harte Nachbardächer ≥ 15 m (9 m); weiche ≥ 24 m (12 m); Kleinbauten ≥ 5 m",
     "h": "Verringerte Abstände (6/9/12 m) nur für Wohngebäude der GK 1 und 2."
    },
    "3": {
     "t": "zulässig: Grenze ≥ 12 m; harte Nachbardächer ≥ 15 m; weiche ≥ 24 m; Kleinbauten ≥ 5 m",
     "h": "Verringerte Abstände (6/9/12 m) nur für Wohngebäude der GK 1 und 2."
    },
    "4": {
     "t": "nicht zulässig (harte Bedachung)",
     "h": "Verringerte Abstände (6/9/12 m) nur für Wohngebäude der GK 1 und 2."
    },
    "5": {
     "t": "nicht zulässig (harte Bedachung)",
     "h": "Verringerte Abstände (6/9/12 m) nur für Wohngebäude der GK 1 und 2."
    },
    "1a": {
     "t": "zulässig: Grenze ≥ 12 m (Wohngebäude 6 m); harte Nachbardächer ≥ 15 m (9 m); weiche ≥ 24 m (12 m); Kleinbauten ≥ 5 m",
     "h": "Verringerte Abstände (6/9/12 m) nur für Wohngebäude der GK 1 und 2."
    },
    "1b": {
     "t": "zulässig: Grenze ≥ 12 m (Wohngebäude 6 m); harte Nachbardächer ≥ 15 m (9 m); weiche ≥ 24 m (12 m); Kleinbauten ≥ 5 m",
     "h": "Verringerte Abstände (6/9/12 m) nur für Wohngebäude der GK 1 und 2."
    }
   },
   "hh": "nicht zulässig.",
   "rg": "§ 32 Abs. 2",
   "pos": "dach",
   "auftritt": "gebaeude",
   "merksatz": "Weiche Bedachung nur in GK 1 bis 3: 12 m zur Grenze, 15 und 24 m zu Nachbardächern; Wohngebäude GK 1/2: 6, 9, 12 m.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "dach_aufbauten",
   "name": "Dachaufbauten, Dachfenster, Solaranlagen: Abstand zur Brandwand",
   "gruppe": "Hülle",
   "kurz": "Dachüberstände, Dachaufbauten, Dachflächenfenster, Lichtkuppeln und Solaranlagen müssen so angeordnet sein, dass Feuer nicht auf andere Gebäudeteile oder Nachbargrundstücke übertragen wird. Zur Brandwand gelten Mindestabstände.",
   "anf": {
    "2": {
     "t": "Abstand zu Brandwand/Ersatzwand: 0 m, wenn Wand ≥ 0,30 m über Dach bzw. Brandübertragung verhindert; 0,50 m: flache Solaranlagen (≤ 30 cm hoch/integriert); 1,25 m: übrige Dachfenster, Öffnungen, Gauben, Solaranlagen",
     "h": "Ohne Abstand sind Dachflächenfenster, Oberlichte, Lichtkuppeln und Öffnungen in der Bedachung nur zulässig, wenn die Wand mindestens 30 cm über die Bedachung geführt ist."
    },
    "3": {
     "t": "Abstand zu Brandwand/Ersatzwand: 0 m, wenn Wand ≥ 0,30 m über Dach bzw. Brandübertragung verhindert; 0,50 m: flache Solaranlagen (≤ 30 cm hoch/integriert); 1,25 m: übrige Dachfenster, Öffnungen, Gauben, Solaranlagen",
     "h": "Ohne Abstand sind Dachflächenfenster, Oberlichte, Lichtkuppeln und Öffnungen in der Bedachung nur zulässig, wenn die Wand mindestens 30 cm über die Bedachung geführt ist."
    },
    "4": {
     "t": "Abstand zu Brandwand/Ersatzwand: 0 m, wenn Wand ≥ 0,30 m über Dach bzw. Brandübertragung verhindert; 0,50 m: flache Solaranlagen (≤ 30 cm hoch/integriert); 1,25 m: übrige Dachfenster, Öffnungen, Gauben, Solaranlagen",
     "h": "Ohne Abstand sind Dachflächenfenster, Oberlichte, Lichtkuppeln und Öffnungen in der Bedachung nur zulässig, wenn die Wand mindestens 30 cm über die Bedachung geführt ist."
    },
    "5": {
     "t": "Abstand zu Brandwand/Ersatzwand: 0 m, wenn Wand ≥ 0,30 m über Dach bzw. Brandübertragung verhindert; 0,50 m: flache Solaranlagen (≤ 30 cm hoch/integriert); 1,25 m: übrige Dachfenster, Öffnungen, Gauben, Solaranlagen",
     "h": "Ohne Abstand sind Dachflächenfenster, Oberlichte, Lichtkuppeln und Öffnungen in der Bedachung nur zulässig, wenn die Wand mindestens 30 cm über die Bedachung geführt ist."
    },
    "1a": {
     "t": "Abstand zu Brandwand/Ersatzwand: 0 m, wenn Wand ≥ 0,30 m über Dach bzw. Brandübertragung verhindert; 0,50 m: flache Solaranlagen (≤ 30 cm hoch/integriert); 1,25 m: übrige Dachfenster, Öffnungen, Gauben, Solaranlagen",
     "h": "Ohne Abstand sind Dachflächenfenster, Oberlichte, Lichtkuppeln und Öffnungen in der Bedachung nur zulässig, wenn die Wand mindestens 30 cm über die Bedachung geführt ist."
    },
    "1b": {
     "t": "Abstand zu Brandwand/Ersatzwand: 0 m, wenn Wand ≥ 0,30 m über Dach bzw. Brandübertragung verhindert; 0,50 m: flache Solaranlagen (≤ 30 cm hoch/integriert); 1,25 m: übrige Dachfenster, Öffnungen, Gauben, Solaranlagen",
     "h": "Ohne Abstand sind Dachflächenfenster, Oberlichte, Lichtkuppeln und Öffnungen in der Bedachung nur zulässig, wenn die Wand mindestens 30 cm über die Bedachung geführt ist."
    }
   },
   "hh": "unklar.",
   "rg": "§ 32 Abs. 5",
   "pos": "dach",
   "auftritt": "mehrfach",
   "merksatz": "Dachaufbauten zur Brandwand: 1,25 m Abstand, bei flachen Solaranlagen 0,50 m, ohne Abstand nur mit Brandwand 0,30 m über Dach.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "dach_traufseitig",
   "name": "Dächer aneinandergebauter Gebäude (traufseitig)",
   "gruppe": "Hülle",
   "kurz": "Dächer von traufseitig aneinandergebauten Gebäuden müssen von innen nach außen feuerhemmend sein. Öffnungen sind weit genug von der Brandwand zu halten.",
   "anf": {
    "2": {
     "t": "feuerhemmend (F 30 / REI 30) (inkl. tragender und aussteifender Bauteile); Öffnungen in diesen Dachflächen ≥ 2 m waagerecht von der Brandwand/Ersatzwand"
    },
    "3": {
     "t": "feuerhemmend (F 30 / REI 30) (inkl. tragender und aussteifender Bauteile); Öffnungen in diesen Dachflächen ≥ 2 m waagerecht von der Brandwand/Ersatzwand"
    },
    "4": {
     "t": "feuerhemmend (F 30 / REI 30) (inkl. tragender und aussteifender Bauteile); Öffnungen in diesen Dachflächen ≥ 2 m waagerecht von der Brandwand/Ersatzwand"
    },
    "5": {
     "t": "feuerhemmend (F 30 / REI 30) (inkl. tragender und aussteifender Bauteile); Öffnungen in diesen Dachflächen ≥ 2 m waagerecht von der Brandwand/Ersatzwand"
    },
    "1a": {
     "t": "feuerhemmend (F 30 / REI 30) (inkl. tragender und aussteifender Bauteile); Öffnungen in diesen Dachflächen ≥ 2 m waagerecht von der Brandwand/Ersatzwand"
    },
    "1b": {
     "t": "feuerhemmend (F 30 / REI 30) (inkl. tragender und aussteifender Bauteile); Öffnungen in diesen Dachflächen ≥ 2 m waagerecht von der Brandwand/Ersatzwand"
    }
   },
   "hh": "unklar.",
   "rg": "§ 32 Abs. 6",
   "pos": "dach",
   "auftritt": "gebaeude",
   "merksatz": "Traufseitig angebaute Dächer: Dachfläche feuerhemmend, Öffnungen mindestens 2 m von der Brandwand entfernt.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "dach_anbau",
   "name": "Dächer von Anbauten an Außenwände mit Öffnungen",
   "gruppe": "Hülle",
   "kurz": "Dächer von Anbauten, die an Außenwände mit Öffnungen oder ohne Feuerwiderstandsfähigkeit anschließen, müssen im 5-m-Bereich die Feuerwiderstandsfähigkeit der Decken haben.",
   "anf": {
    "2": {
     "t": "Anbau an Wohngebäude: keine"
    },
    "3": {
     "t": "Anbau an Wohngebäude: keine; sonst: Feuerwiderstand der Decken, Bereich 5 m"
    },
    "4": {
     "t": "Feuerwiderstand der Decken des Gebäudeteils, innerhalb 5 m von der Wand"
    },
    "5": {
     "t": "Feuerwiderstand der Decken des Gebäudeteils, innerhalb 5 m von der Wand"
    },
    "1a": {
     "t": "Anbau an Wohngebäude: keine"
    },
    "1b": {
     "t": "Anbau an Wohngebäude: keine"
    }
   },
   "hh": "unklar.",
   "rg": "§ 32 Abs. 7",
   "pos": "dach",
   "auftritt": "mehrfach",
   "merksatz": "Anbaudach neben einer Wand mit Öffnungen: auf 5 m Breite wie die Decke des Hauptgebäudes ausbilden. Wohngebäude GK 1 bis 3 ausgenommen.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "rw_zwei",
   "name": "Erster und zweiter Rettungsweg",
   "gruppe": "Rettungsweg",
   "kurz": "Jede Nutzungseinheit braucht in jedem Geschoss mit Aufenthaltsräumen zwei voneinander unabhängige Rettungswege ins Freie. Der zweite Rettungsweg kann eine zweite Treppe oder eine Anleiterstelle sein.",
   "anf": {
    "2": {
     "t": "2 voneinander unabhängige Rettungswege je Nutzungseinheit und Geschoss; 1. RW über notwendige Treppe; 2. RW weitere Treppe oder mit Rettungsgerät der Feuerwehr erreichbare Stelle",
     "h": "Kein 2. RW bei eingeschossigen Nutzungseinheiten zu ebener Erde mit direktem Ausgang ins Freie oder bei Sicherheitstreppenraum. Beide RW dürfen im Geschoss über denselben notwendigen Flur führen."
    },
    "3": {
     "t": "2 voneinander unabhängige Rettungswege je Nutzungseinheit und Geschoss; 1. RW über notwendige Treppe; 2. RW weitere Treppe oder mit Rettungsgerät der Feuerwehr erreichbare Stelle",
     "h": "Kein 2. RW bei eingeschossigen Nutzungseinheiten zu ebener Erde mit direktem Ausgang ins Freie oder bei Sicherheitstreppenraum. Beide RW dürfen im Geschoss über denselben notwendigen Flur führen."
    },
    "4": {
     "t": "2 voneinander unabhängige Rettungswege je Nutzungseinheit und Geschoss; 1. RW über notwendige Treppe; 2. RW weitere Treppe oder mit Rettungsgerät der Feuerwehr erreichbare Stelle",
     "h": "Kein 2. RW bei eingeschossigen Nutzungseinheiten zu ebener Erde mit direktem Ausgang ins Freie oder bei Sicherheitstreppenraum. Beide RW dürfen im Geschoss über denselben notwendigen Flur führen."
    },
    "5": {
     "t": "2 voneinander unabhängige Rettungswege je Nutzungseinheit und Geschoss; 1. RW über notwendige Treppe; 2. RW weitere Treppe oder mit Rettungsgerät der Feuerwehr erreichbare Stelle",
     "h": "Kein 2. RW bei eingeschossigen Nutzungseinheiten zu ebener Erde mit direktem Ausgang ins Freie oder bei Sicherheitstreppenraum. Beide RW dürfen im Geschoss über denselben notwendigen Flur führen."
    },
    "1a": {
     "t": "2 voneinander unabhängige Rettungswege je Nutzungseinheit und Geschoss; 1. RW über notwendige Treppe; 2. RW weitere Treppe oder mit Rettungsgerät der Feuerwehr erreichbare Stelle",
     "h": "Kein 2. RW bei eingeschossigen Nutzungseinheiten zu ebener Erde mit direktem Ausgang ins Freie oder bei Sicherheitstreppenraum. Beide RW dürfen im Geschoss über denselben notwendigen Flur führen."
    },
    "1b": {
     "t": "2 voneinander unabhängige Rettungswege je Nutzungseinheit und Geschoss; 1. RW über notwendige Treppe; 2. RW weitere Treppe oder mit Rettungsgerät der Feuerwehr erreichbare Stelle",
     "h": "Kein 2. RW bei eingeschossigen Nutzungseinheiten zu ebener Erde mit direktem Ausgang ins Freie oder bei Sicherheitstreppenraum. Beide RW dürfen im Geschoss über denselben notwendigen Flur führen."
    }
   },
   "hh": "Zwei bauliche Rettungswege je Nutzungseinheit; Sicherheitstreppenräume (MHHR, laut Lernseite).",
   "rg": "§ 33 Abs. 1 und 2",
   "pos": "rettungsweg",
   "auftritt": "geschoss",
   "merksatz": "Zwei unabhängige Rettungswege je Nutzungseinheit und Geschoss: Treppe plus zweite Treppe oder Feuerwehr-Rettungsgerät.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "rw_rettungsgeraet",
   "name": "Rettungsgerät der Feuerwehr, Anleiterhöhe",
   "gruppe": "Rettungsweg",
   "kurz": "Führt der zweite Rettungsweg über Rettungsgeräte der Feuerwehr und liegt die Brüstungsoberkante der Anleiterstelle mehr als 8 m über Gelände, muss die Feuerwehr Hubrettungsfahrzeuge haben.",
   "anf": {
    "2": {
     "t": "Rettungsgerät zulässig",
     "h": "Bei Sonderbauten nur, wenn keine Bedenken wegen der Personenrettung bestehen."
    },
    "3": {
     "t": "Rettungsgerät zulässig",
     "h": "Bei Sonderbauten nur, wenn keine Bedenken wegen der Personenrettung bestehen."
    },
    "4": {
     "t": "zulässig; über 8 m Brüstungshöhe nur mit Hubrettungsfahrzeugen der Feuerwehr",
     "h": "Bei Sonderbauten nur, wenn keine Bedenken wegen der Personenrettung bestehen."
    },
    "5": {
     "t": "zulässig; über 8 m Brüstungshöhe nur mit Hubrettungsfahrzeugen der Feuerwehr",
     "h": "Bei Sonderbauten nur, wenn keine Bedenken wegen der Personenrettung bestehen."
    },
    "1a": {
     "t": "Rettungsgerät zulässig",
     "h": "Bei Sonderbauten nur, wenn keine Bedenken wegen der Personenrettung bestehen."
    },
    "1b": {
     "t": "Rettungsgerät zulässig",
     "h": "Bei Sonderbauten nur, wenn keine Bedenken wegen der Personenrettung bestehen."
    }
   },
   "hh": "Hochhaus: bauliche Rettungswege (Sicherheitstreppenraum), kein Anleitern (laut Lernseite).",
   "rg": "§ 33 Abs. 3; § 5 Abs. 1 S. 2",
   "pos": "rettungsweg",
   "auftritt": "gebaeude",
   "merksatz": "Brüstung der Anleiterstelle über 8 m: Hubrettungsfahrzeug nötig und Zu-/Durchfahrt statt Zugang. Nicht zu verwechseln mit 7 m OKFF.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "rw_laenge",
   "name": "Rettungsweglänge",
   "gruppe": "Rettungsweg",
   "kurz": "Von jeder Stelle eines Aufenthaltsraumes und eines Kellergeschosses muss ein Ausgang ins Freie oder in einen notwendigen Treppenraum in höchstens 35 m erreichbar sein.",
   "anf": {
    "2": {
     "t": "≤ 35 m bis zum Ausgang ins Freie oder zum notwendigen Treppenraum",
     "h": "Mehrere notwendige Treppenräume möglichst entgegengesetzt anordnen, Rettungswege möglichst kurz."
    },
    "3": {
     "t": "≤ 35 m bis zum Ausgang ins Freie oder zum notwendigen Treppenraum",
     "h": "Mehrere notwendige Treppenräume möglichst entgegengesetzt anordnen, Rettungswege möglichst kurz."
    },
    "4": {
     "t": "≤ 35 m bis zum Ausgang ins Freie oder zum notwendigen Treppenraum",
     "h": "Mehrere notwendige Treppenräume möglichst entgegengesetzt anordnen, Rettungswege möglichst kurz."
    },
    "5": {
     "t": "≤ 35 m bis zum Ausgang ins Freie oder zum notwendigen Treppenraum",
     "h": "Mehrere notwendige Treppenräume möglichst entgegengesetzt anordnen, Rettungswege möglichst kurz."
    },
    "1a": {
     "t": "≤ 35 m bis zum Ausgang ins Freie oder zum notwendigen Treppenraum",
     "h": "Mehrere notwendige Treppenräume möglichst entgegengesetzt anordnen, Rettungswege möglichst kurz."
    },
    "1b": {
     "t": "≤ 35 m bis zum Ausgang ins Freie oder zum notwendigen Treppenraum",
     "h": "Mehrere notwendige Treppenräume möglichst entgegengesetzt anordnen, Rettungswege möglichst kurz."
    }
   },
   "hh": "max. 35 m (MHHR, laut Lernseite).",
   "rg": "§ 35 Abs. 2 S. 1 und 3",
   "pos": "rettungsweg",
   "auftritt": "geschoss",
   "merksatz": "Rettungsweglänge: von jeder Stelle höchstens 35 m bis zum Ausgang ins Freie oder zum notwendigen Treppenraum.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "keller_rw",
   "name": "Mehrere Kellergeschosse: zwei Ausgänge",
   "gruppe": "Rettungsweg",
   "kurz": "Übereinanderliegende Kellergeschosse brauchen jeweils mindestens zwei Ausgänge in notwendige Treppenräume oder ins Freie.",
   "anf": {
    "2": {
     "t": "je Kellergeschoss mindestens 2 Ausgänge ins Freie oder in notwendige Treppenräume (bei übereinanderliegenden Kellergeschossen)"
    },
    "3": {
     "t": "je Kellergeschoss mindestens 2 Ausgänge ins Freie oder in notwendige Treppenräume (bei übereinanderliegenden Kellergeschossen)"
    },
    "4": {
     "t": "je Kellergeschoss mindestens 2 Ausgänge ins Freie oder in notwendige Treppenräume (bei übereinanderliegenden Kellergeschossen)"
    },
    "5": {
     "t": "je Kellergeschoss mindestens 2 Ausgänge ins Freie oder in notwendige Treppenräume (bei übereinanderliegenden Kellergeschossen)"
    },
    "1a": {
     "t": "je Kellergeschoss mindestens 2 Ausgänge ins Freie oder in notwendige Treppenräume (bei übereinanderliegenden Kellergeschossen)"
    },
    "1b": {
     "t": "je Kellergeschoss mindestens 2 Ausgänge ins Freie oder in notwendige Treppenräume (bei übereinanderliegenden Kellergeschossen)"
    }
   },
   "hh": "Treppenräume von Kellergeschossen nicht mit oberirdischen verbunden (MHHR, laut Lernseite).",
   "rg": "§ 35 Abs. 2 S. 2",
   "pos": "rettungsweg",
   "auftritt": "geschoss",
   "merksatz": "Mehrere Kellergeschosse übereinander: jedes Geschoss braucht zwei Ausgänge in einen notwendigen Treppenraum oder ins Freie.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "sicherheitstreppenraum",
   "name": "Sicherheitstreppenraum (Begriff und Wirkung)",
   "gruppe": "Rettungsweg",
   "kurz": "Ein Sicherheitstreppenraum ist ein sicher erreichbarer Treppenraum, in den Feuer und Rauch nicht eindringen können. Er ersetzt den zweiten Rettungsweg.",
   "anf": {
    "2": {
     "t": "ersetzt den 2. Rettungsweg, wenn Feuer und Rauch nicht eindringen können",
     "h": "Technische Ausführung (Vorraum, Druckbelüftung, offener Gang) regelt das MBO nicht; sie stammt aus der MHHR (siehe Lernseite)."
    },
    "3": {
     "t": "ersetzt den 2. Rettungsweg, wenn Feuer und Rauch nicht eindringen können",
     "h": "Technische Ausführung (Vorraum, Druckbelüftung, offener Gang) regelt das MBO nicht; sie stammt aus der MHHR (siehe Lernseite)."
    },
    "4": {
     "t": "ersetzt den 2. Rettungsweg, wenn Feuer und Rauch nicht eindringen können",
     "h": "Technische Ausführung (Vorraum, Druckbelüftung, offener Gang) regelt das MBO nicht; sie stammt aus der MHHR (siehe Lernseite)."
    },
    "5": {
     "t": "ersetzt den 2. Rettungsweg, wenn Feuer und Rauch nicht eindringen können",
     "h": "Technische Ausführung (Vorraum, Druckbelüftung, offener Gang) regelt das MBO nicht; sie stammt aus der MHHR (siehe Lernseite)."
    },
    "1a": {
     "t": "ersetzt den 2. Rettungsweg, wenn Feuer und Rauch nicht eindringen können",
     "h": "Technische Ausführung (Vorraum, Druckbelüftung, offener Gang) regelt das MBO nicht; sie stammt aus der MHHR (siehe Lernseite)."
    },
    "1b": {
     "t": "ersetzt den 2. Rettungsweg, wenn Feuer und Rauch nicht eindringen können",
     "h": "Technische Ausführung (Vorraum, Druckbelüftung, offener Gang) regelt das MBO nicht; sie stammt aus der MHHR (siehe Lernseite)."
    }
   },
   "hh": "MHHR: ab 60 m Höhe alle Treppenräume als Sicherheitstreppenräume; Wände F90 (bis 60 m) bzw. F120 (laut Lernseite).",
   "rg": "§ 33 Abs. 2 S. 3; § 36 Abs. 3 S. 4",
   "pos": "treppenraum",
   "auftritt": "gebaeude",
   "unklar": true,
   "merksatz": "Sicherheitstreppenraum: Feuer und Rauch dringen nicht ein, daher kein zweiter Rettungsweg nötig. Details regelt die MHHR.",
   "quelle": "MBO"
  },
  {
   "id": "treppe_notwendig",
   "name": "Notwendige Treppen (tragende Teile)",
   "gruppe": "Rettungsweg",
   "kurz": "Jedes nicht ebenerdige Geschoss und der nutzbare Dachraum braucht eine notwendige Treppe. Ihre tragenden Teile sind je nach Gebäudeklasse nichtbrennbar oder feuerhemmend.",
   "anf": {
    "2": {
     "t": "keine Anforderung",
     "h": "Außentreppen nach § 35 Abs. 1 S. 3 Nr. 3 in GK 3 bis 5: tragende Teile nichtbrennbar. Einschiebbare Treppen, Rolltreppen als notwendige Treppen unzulässig (in GK 1/2 als Dachraumzugang zulässig). In einem Zuge führen, außer GK 1 bis 3."
    },
    "3": {
     "t": "nichtbrennbar oder feuerhemmend (F 30 / REI 30)",
     "h": "Außentreppen nach § 35 Abs. 1 S. 3 Nr. 3 in GK 3 bis 5: tragende Teile nichtbrennbar. Einschiebbare Treppen, Rolltreppen als notwendige Treppen unzulässig (in GK 1/2 als Dachraumzugang zulässig). In einem Zuge führen, außer GK 1 bis 3."
    },
    "4": {
     "t": "nichtbrennbar",
     "h": "Außentreppen nach § 35 Abs. 1 S. 3 Nr. 3 in GK 3 bis 5: tragende Teile nichtbrennbar. Einschiebbare Treppen, Rolltreppen als notwendige Treppen unzulässig (in GK 1/2 als Dachraumzugang zulässig). In einem Zuge führen, außer GK 1 bis 3."
    },
    "5": {
     "t": "feuerhemmend (F 30 / REI 30) und nichtbrennbar",
     "h": "Außentreppen nach § 35 Abs. 1 S. 3 Nr. 3 in GK 3 bis 5: tragende Teile nichtbrennbar. Einschiebbare Treppen, Rolltreppen als notwendige Treppen unzulässig (in GK 1/2 als Dachraumzugang zulässig). In einem Zuge führen, außer GK 1 bis 3."
    },
    "1a": {
     "t": "keine Anforderung",
     "h": "Außentreppen nach § 35 Abs. 1 S. 3 Nr. 3 in GK 3 bis 5: tragende Teile nichtbrennbar. Einschiebbare Treppen, Rolltreppen als notwendige Treppen unzulässig (in GK 1/2 als Dachraumzugang zulässig). In einem Zuge führen, außer GK 1 bis 3."
    },
    "1b": {
     "t": "keine Anforderung",
     "h": "Außentreppen nach § 35 Abs. 1 S. 3 Nr. 3 in GK 3 bis 5: tragende Teile nichtbrennbar. Einschiebbare Treppen, Rolltreppen als notwendige Treppen unzulässig (in GK 1/2 als Dachraumzugang zulässig). In einem Zuge führen, außer GK 1 bis 3."
    }
   },
   "hh": "MHHR (laut Lernseite): notwendige Treppen in Sicherheitstreppenräumen.",
   "rg": "§ 34 Abs. 1 bis 4",
   "pos": "treppenraum",
   "auftritt": "geschoss",
   "merksatz": "Tragende Teile notwendiger Treppen: GK 3 nichtbrennbar oder F30, GK 4 nichtbrennbar, GK 5 F30 und nichtbrennbar.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "treppe_ohne_raum",
   "name": "Notwendige Treppe ohne eigenen Treppenraum",
   "gruppe": "Rettungsweg",
   "kurz": "Notwendige Treppen brauchen einen eigenen Treppenraum, außer in drei Ausnahmefällen. In GK 1 und 2 ist kein Treppenraum nötig.",
   "anf": {
    "2": {
     "t": "kein Treppenraum erforderlich",
     "h": "Außentreppe nur, wenn ihre Nutzung ausreichend sicher ist und im Brandfall nicht gefährdet werden kann."
    },
    "3": {
     "t": "notwendiger Treppenraum; Ausnahmen: ≤ 2 Geschosse derselben NE bis 200 m² mit anderem RW; Außentreppe",
     "h": "Außentreppe nur, wenn ihre Nutzung ausreichend sicher ist und im Brandfall nicht gefährdet werden kann."
    },
    "4": {
     "t": "notwendiger Treppenraum; Ausnahmen wie GK 3",
     "h": "Außentreppe nur, wenn ihre Nutzung ausreichend sicher ist und im Brandfall nicht gefährdet werden kann."
    },
    "5": {
     "t": "notwendiger Treppenraum; Ausnahmen wie GK 3",
     "h": "Außentreppe nur, wenn ihre Nutzung ausreichend sicher ist und im Brandfall nicht gefährdet werden kann."
    },
    "1a": {
     "t": "kein Treppenraum erforderlich",
     "h": "Außentreppe nur, wenn ihre Nutzung ausreichend sicher ist und im Brandfall nicht gefährdet werden kann."
    },
    "1b": {
     "t": "kein Treppenraum erforderlich",
     "h": "Außentreppe nur, wenn ihre Nutzung ausreichend sicher ist und im Brandfall nicht gefährdet werden kann."
    }
   },
   "hh": "Treppenraum zwingend (MHHR).",
   "rg": "§ 35 Abs. 1",
   "pos": "treppenraum",
   "auftritt": "gebaeude",
   "merksatz": "Eigener Treppenraum ab GK 3. Ausnahmen: GK 1 und 2, zwei Geschosse bis 200 m² derselben NE, sichere Außentreppe.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "treppenraum_wand",
   "name": "Wände notwendiger Treppenräume",
   "gruppe": "Rettungsweg",
   "kurz": "Die Wände notwendiger Treppenräume halten Feuer und Rauch lange vom Rettungsweg fern. Die Anforderung steigt mit der Gebäudeklasse.",
   "anf": {
    "2": {
     "t": "kein Treppenraum nötig",
     "h": "Ausnahme: Außenwände aus nichtbrennbaren Baustoffen, die durch angrenzende Gebäudeteile nicht gefährdet werden können."
    },
    "3": {
     "t": "feuerhemmend (F 30 / REI 30)",
     "h": "Ausnahme: Außenwände aus nichtbrennbaren Baustoffen, die durch angrenzende Gebäudeteile nicht gefährdet werden können."
    },
    "4": {
     "t": "hochfeuerhemmend (REI 60) auch unter mechanischer Beanspruchung (HFH-M)",
     "h": "Ausnahme: Außenwände aus nichtbrennbaren Baustoffen, die durch angrenzende Gebäudeteile nicht gefährdet werden können."
    },
    "5": {
     "t": "Bauart Brandwand (REI 90-M)",
     "h": "Ausnahme: Außenwände aus nichtbrennbaren Baustoffen, die durch angrenzende Gebäudeteile nicht gefährdet werden können."
    },
    "1a": {
     "t": "kein Treppenraum nötig",
     "h": "Ausnahme: Außenwände aus nichtbrennbaren Baustoffen, die durch angrenzende Gebäudeteile nicht gefährdet werden können."
    },
    "1b": {
     "t": "kein Treppenraum nötig",
     "h": "Ausnahme: Außenwände aus nichtbrennbaren Baustoffen, die durch angrenzende Gebäudeteile nicht gefährdet werden können."
    }
   },
   "hh": "MHHR: Wände der Treppenräume F90, über 60 m Höhe F120 (laut Lernseite).",
   "rg": "§ 35 Abs. 4 S. 1 und 2; § 26 Abs. 2 S. 5",
   "pos": "treppenraum",
   "auftritt": "gebaeude",
   "merksatz": "Treppenraumwände: GK 3 feuerhemmend, GK 4 hochfeuerhemmend mit mechanischer Beanspruchung, GK 5 in Bauart einer Brandwand.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "treppenraum_abschluss",
   "name": "Oberer Abschluss des Treppenraums",
   "gruppe": "Rettungsweg",
   "kurz": "Der obere Abschluss des Treppenraums hat die Feuerwiderstandsfähigkeit der Decken des Gebäudes. Das gilt nicht, wenn das Dach der Abschluss ist und die Wände bis unter die Dachhaut reichen.",
   "anf": {
    "2": {
     "t": "kein Treppenraum nötig",
     "h": "Alternativ: Treppenraumwände bis unter die Dachhaut führen (Dach als Abschluss)."
    },
    "3": {
     "t": "feuerhemmend (F 30 / REI 30)",
     "h": "Alternativ: Treppenraumwände bis unter die Dachhaut führen (Dach als Abschluss)."
    },
    "4": {
     "t": "hochfeuerhemmend (REI 60)",
     "h": "Alternativ: Treppenraumwände bis unter die Dachhaut führen (Dach als Abschluss)."
    },
    "5": {
     "t": "feuerbeständig (REI 90)",
     "h": "Alternativ: Treppenraumwände bis unter die Dachhaut führen (Dach als Abschluss)."
    },
    "1a": {
     "t": "kein Treppenraum nötig",
     "h": "Alternativ: Treppenraumwände bis unter die Dachhaut führen (Dach als Abschluss)."
    },
    "1b": {
     "t": "kein Treppenraum nötig",
     "h": "Alternativ: Treppenraumwände bis unter die Dachhaut führen (Dach als Abschluss)."
    }
   },
   "hh": "wie Decken des Gebäudes.",
   "rg": "§ 35 Abs. 4 S. 3",
   "pos": "treppenraum",
   "auftritt": "gebaeude",
   "merksatz": "Oberer Treppenraumabschluss wie die Gebäudedecken, es sei denn, die Wände reichen bis unter die Dachhaut.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "treppenraum_erweiterung",
   "name": "Ausgang des Treppenraums / Treppenraumerweiterung",
   "gruppe": "Rettungsweg",
   "kurz": "Jeder Treppenraum braucht einen unmittelbaren Ausgang ins Freie. Führt er nicht direkt ins Freie, muss der Zwischenraum bestimmte Anforderungen erfüllen.",
   "anf": {
    "2": {
     "t": "Ausgang unmittelbar ins Freie; sonst Zwischenraum: mind. so breit wie die Treppenläufe, Wände wie Treppenraum, rauchdichte und selbstschließende Abschlüsse zu notwendigen Fluren, keine Öffnungen zu anderen Räumen",
     "h": "Gilt, soweit ein notwendiger Treppenraum erforderlich ist (ab GK 3)."
    },
    "3": {
     "t": "Ausgang unmittelbar ins Freie; sonst Zwischenraum: mind. so breit wie die Treppenläufe, Wände wie Treppenraum, rauchdichte und selbstschließende Abschlüsse zu notwendigen Fluren, keine Öffnungen zu anderen Räumen",
     "h": "Gilt, soweit ein notwendiger Treppenraum erforderlich ist (ab GK 3)."
    },
    "4": {
     "t": "Ausgang unmittelbar ins Freie; sonst Zwischenraum: mind. so breit wie die Treppenläufe, Wände wie Treppenraum, rauchdichte und selbstschließende Abschlüsse zu notwendigen Fluren, keine Öffnungen zu anderen Räumen",
     "h": "Gilt, soweit ein notwendiger Treppenraum erforderlich ist (ab GK 3)."
    },
    "5": {
     "t": "Ausgang unmittelbar ins Freie; sonst Zwischenraum: mind. so breit wie die Treppenläufe, Wände wie Treppenraum, rauchdichte und selbstschließende Abschlüsse zu notwendigen Fluren, keine Öffnungen zu anderen Räumen",
     "h": "Gilt, soweit ein notwendiger Treppenraum erforderlich ist (ab GK 3)."
    },
    "1a": {
     "t": "Ausgang unmittelbar ins Freie; sonst Zwischenraum: mind. so breit wie die Treppenläufe, Wände wie Treppenraum, rauchdichte und selbstschließende Abschlüsse zu notwendigen Fluren, keine Öffnungen zu anderen Räumen",
     "h": "Gilt, soweit ein notwendiger Treppenraum erforderlich ist (ab GK 3)."
    },
    "1b": {
     "t": "Ausgang unmittelbar ins Freie; sonst Zwischenraum: mind. so breit wie die Treppenläufe, Wände wie Treppenraum, rauchdichte und selbstschließende Abschlüsse zu notwendigen Fluren, keine Öffnungen zu anderen Räumen",
     "h": "Gilt, soweit ein notwendiger Treppenraum erforderlich ist (ab GK 3)."
    }
   },
   "hh": "MHHR: Treppenraumerweiterung mit Wandqualität des Treppenraums (laut Lernseite).",
   "rg": "§ 35 Abs. 3",
   "pos": "treppenraum",
   "auftritt": "gebaeude",
   "merksatz": "Treppenraum mit Ausgang ins Freie. Sonst Erweiterung: gleiche Wandqualität, keine Öffnungen außer RS-Türen zu notwendigen Fluren.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "treppenraum_oberflaeche",
   "name": "Baustoffe in Treppenräumen",
   "gruppe": "Rettungsweg",
   "kurz": "In notwendigen Treppenräumen (und Erweiterungen) müssen Bekleidungen, Putze, Dämmstoffe, Unterdecken und Einbauten nichtbrennbar sein.",
   "anf": {
    "2": {
     "t": "Bekleidungen, Putze, Dämmstoffe, Unterdecken, Einbauten: nichtbrennbar; Bodenbeläge mindestens schwerentflammbar",
     "h": "Brennbare Wände/Decken brauchen eine nichtbrennbare Bekleidung in ausreichender Dicke. Gleitschutzprofile von der Bodenbelagsregel ausgenommen."
    },
    "3": {
     "t": "Bekleidungen, Putze, Dämmstoffe, Unterdecken, Einbauten: nichtbrennbar; Bodenbeläge mindestens schwerentflammbar",
     "h": "Brennbare Wände/Decken brauchen eine nichtbrennbare Bekleidung in ausreichender Dicke. Gleitschutzprofile von der Bodenbelagsregel ausgenommen."
    },
    "4": {
     "t": "Bekleidungen, Putze, Dämmstoffe, Unterdecken, Einbauten: nichtbrennbar; Bodenbeläge mindestens schwerentflammbar",
     "h": "Brennbare Wände/Decken brauchen eine nichtbrennbare Bekleidung in ausreichender Dicke. Gleitschutzprofile von der Bodenbelagsregel ausgenommen."
    },
    "5": {
     "t": "Bekleidungen, Putze, Dämmstoffe, Unterdecken, Einbauten: nichtbrennbar; Bodenbeläge mindestens schwerentflammbar",
     "h": "Brennbare Wände/Decken brauchen eine nichtbrennbare Bekleidung in ausreichender Dicke. Gleitschutzprofile von der Bodenbelagsregel ausgenommen."
    },
    "1a": {
     "t": "Bekleidungen, Putze, Dämmstoffe, Unterdecken, Einbauten: nichtbrennbar; Bodenbeläge mindestens schwerentflammbar",
     "h": "Brennbare Wände/Decken brauchen eine nichtbrennbare Bekleidung in ausreichender Dicke. Gleitschutzprofile von der Bodenbelagsregel ausgenommen."
    },
    "1b": {
     "t": "Bekleidungen, Putze, Dämmstoffe, Unterdecken, Einbauten: nichtbrennbar; Bodenbeläge mindestens schwerentflammbar",
     "h": "Brennbare Wände/Decken brauchen eine nichtbrennbare Bekleidung in ausreichender Dicke. Gleitschutzprofile von der Bodenbelagsregel ausgenommen."
    }
   },
   "hh": "wie GK 5.",
   "rg": "§ 35 Abs. 5",
   "pos": "treppenraum",
   "auftritt": "gebaeude",
   "merksatz": "Im Treppenraum alles nichtbrennbar, nur der Bodenbelag darf schwerentflammbar sein.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "treppenraum_beleuchtung",
   "name": "Beleuchtung und Sicherheitsbeleuchtung im Treppenraum",
   "gruppe": "Rettungsweg",
   "kurz": "Notwendige Treppenräume müssen beleuchtbar sein. Ohne Fenster brauchen sie bei Gebäuden über 13 m Höhe eine Sicherheitsbeleuchtung.",
   "anf": {
    "2": {
     "t": "kein Treppenraum nötig",
     "h": "Die MBO knüpft an die Höhe nach § 2 Abs. 3 S. 2 (> 13 m) an, nicht an die Gebäudeklasse; praktisch entspricht das GK 5."
    },
    "3": {
     "t": "Beleuchtung",
     "h": "Die MBO knüpft an die Höhe nach § 2 Abs. 3 S. 2 (> 13 m) an, nicht an die Gebäudeklasse; praktisch entspricht das GK 5."
    },
    "4": {
     "t": "Beleuchtung (Höhe ≤ 13 m: keine Sicherheitsbeleuchtung)",
     "h": "Die MBO knüpft an die Höhe nach § 2 Abs. 3 S. 2 (> 13 m) an, nicht an die Gebäudeklasse; praktisch entspricht das GK 5."
    },
    "5": {
     "t": "Beleuchtung; ohne Fenster: Sicherheitsbeleuchtung (Höhe > 13 m)",
     "h": "Die MBO knüpft an die Höhe nach § 2 Abs. 3 S. 2 (> 13 m) an, nicht an die Gebäudeklasse; praktisch entspricht das GK 5."
    },
    "1a": {
     "t": "kein Treppenraum nötig",
     "h": "Die MBO knüpft an die Höhe nach § 2 Abs. 3 S. 2 (> 13 m) an, nicht an die Gebäudeklasse; praktisch entspricht das GK 5."
    },
    "1b": {
     "t": "kein Treppenraum nötig",
     "h": "Die MBO knüpft an die Höhe nach § 2 Abs. 3 S. 2 (> 13 m) an, nicht an die Gebäudeklasse; praktisch entspricht das GK 5."
    }
   },
   "hh": "Sicherheitsbeleuchtung, Sicherheitsstromversorgung (laut Lernseite).",
   "rg": "§ 35 Abs. 7",
   "pos": "treppenraum",
   "auftritt": "gebaeude",
   "merksatz": "Treppenräume beleuchten. Fensterlos und Höhe über 13 m (GK 5): Sicherheitsbeleuchtung.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "treppenraum_entrauchung",
   "name": "Belüftung und Rauchableitung des Treppenraums",
   "gruppe": "Rettungsweg",
   "kurz": "Notwendige Treppenräume müssen belüftet und entraucht werden können, entweder über Fenster je Geschoss oder über eine Öffnung an der obersten Stelle.",
   "anf": {
    "2": {
     "t": "kein Treppenraum nötig",
     "h": "Bedienung vom Erdgeschoss und vom obersten Treppenabsatz aus."
    },
    "3": {
     "t": "Fenster ≥ 0,50 m² je oberirdischem Geschoss oder Rauchableitung ≥ 1 m² oben",
     "h": "Bedienung vom Erdgeschoss und vom obersten Treppenabsatz aus."
    },
    "4": {
     "t": "Fenster ≥ 0,50 m² je Geschoss oder Rauchableitung ≥ 1 m² oben (ggf. besondere Vorkehrungen)",
     "h": "Bedienung vom Erdgeschoss und vom obersten Treppenabsatz aus."
    },
    "5": {
     "t": "Fenster ≥ 0,50 m² je Geschoss und zusätzlich Rauchableitung ≥ 1 m² oben",
     "h": "Bedienung vom Erdgeschoss und vom obersten Treppenabsatz aus."
    },
    "1a": {
     "t": "kein Treppenraum nötig",
     "h": "Bedienung vom Erdgeschoss und vom obersten Treppenabsatz aus."
    },
    "1b": {
     "t": "kein Treppenraum nötig",
     "h": "Bedienung vom Erdgeschoss und vom obersten Treppenabsatz aus."
    }
   },
   "hh": "Druckbelüftung bei Sicherheitstreppenräumen (MHHR, laut Lernseite).",
   "rg": "§ 35 Abs. 8",
   "pos": "treppenraum",
   "auftritt": "gebaeude",
   "merksatz": "Treppenraum: Fenster 0,50 m² je Geschoss oder 1 m² Rauchabzug oben; in GK 5 beides. Bedienung im EG und oben.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "flur_pflicht",
   "name": "Notwendige Flure: wann erforderlich",
   "gruppe": "Rettungsweg",
   "kurz": "Notwendige Flure führen den Rettungsweg aus Aufenthaltsräumen oder Nutzungseinheiten zu Treppenraum oder Ausgang. In kleinen Gebäuden und Nutzungseinheiten sind sie nicht erforderlich.",
   "anf": {
    "2": {
     "t": "nicht erforderlich (im Keller bei sonstigen Gebäuden schon)",
     "h": "Auch ab GK 3 nicht erforderlich: innerhalb von Wohnungen, in NE ≤ 200 m², in Büro-/Verwaltungs-NE ≤ 400 m² (oder Teilen ≤ 400 m² mit Trennwänden und eigenen Rettungswegen)."
    },
    "3": {
     "t": "erforderlich",
     "h": "Auch ab GK 3 nicht erforderlich: innerhalb von Wohnungen, in NE ≤ 200 m², in Büro-/Verwaltungs-NE ≤ 400 m² (oder Teilen ≤ 400 m² mit Trennwänden und eigenen Rettungswegen)."
    },
    "4": {
     "t": "erforderlich",
     "h": "Auch ab GK 3 nicht erforderlich: innerhalb von Wohnungen, in NE ≤ 200 m², in Büro-/Verwaltungs-NE ≤ 400 m² (oder Teilen ≤ 400 m² mit Trennwänden und eigenen Rettungswegen)."
    },
    "5": {
     "t": "erforderlich",
     "h": "Auch ab GK 3 nicht erforderlich: innerhalb von Wohnungen, in NE ≤ 200 m², in Büro-/Verwaltungs-NE ≤ 400 m² (oder Teilen ≤ 400 m² mit Trennwänden und eigenen Rettungswegen)."
    },
    "1a": {
     "t": "nicht erforderlich (Wohngebäude und sonstige Gebäude; im Keller nur bei sonstigen Gebäuden)",
     "h": "Auch ab GK 3 nicht erforderlich: innerhalb von Wohnungen, in NE ≤ 200 m², in Büro-/Verwaltungs-NE ≤ 400 m² (oder Teilen ≤ 400 m² mit Trennwänden und eigenen Rettungswegen)."
    },
    "1b": {
     "t": "nicht erforderlich (im Keller bei sonstigen Gebäuden schon)",
     "h": "Auch ab GK 3 nicht erforderlich: innerhalb von Wohnungen, in NE ≤ 200 m², in Büro-/Verwaltungs-NE ≤ 400 m² (oder Teilen ≤ 400 m² mit Trennwänden und eigenen Rettungswegen)."
    }
   },
   "hh": "erforderlich (MHHR).",
   "rg": "§ 36 Abs. 1",
   "pos": "flur",
   "auftritt": "geschoss",
   "merksatz": "Kein notwendiger Flur in GK 1 und 2 (außer Keller sonstiger Gebäude), in Wohnungen, NE bis 200 m² und Büro-NE bis 400 m².",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "flur_wand",
   "name": "Wände notwendiger Flure",
   "gruppe": "Rettungsweg",
   "kurz": "Flurwände sind raumabschließende Bauteile und müssen feuerhemmend sein, in Kellergeschossen mit feuerbeständigen Tragbauteilen feuerbeständig.",
   "anf": {
    "2": {
     "og": "keine (kein Flurzwang)",
     "ke": "sonstige Gebäude: feuerhemmend (F 30 / REI 30)",
     "h": "Wände bis zur Rohdecke führen; bis an die Unterdecke nur, wenn diese feuerhemmend ist und vergleichbarer Raumabschluss besteht."
    },
    "3": {
     "og": "feuerhemmend (F 30 / REI 30)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Wände bis zur Rohdecke führen; bis an die Unterdecke nur, wenn diese feuerhemmend ist und vergleichbarer Raumabschluss besteht."
    },
    "4": {
     "og": "feuerhemmend (F 30 / REI 30)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Wände bis zur Rohdecke führen; bis an die Unterdecke nur, wenn diese feuerhemmend ist und vergleichbarer Raumabschluss besteht."
    },
    "5": {
     "og": "feuerhemmend (F 30 / REI 30)",
     "ke": "feuerbeständig (REI 90)",
     "h": "Wände bis zur Rohdecke führen; bis an die Unterdecke nur, wenn diese feuerhemmend ist und vergleichbarer Raumabschluss besteht."
    },
    "1a": {
     "og": "keine (kein Flurzwang)",
     "ke": "sonstige Gebäude: feuerhemmend (F 30 / REI 30)",
     "h": "Wände bis zur Rohdecke führen; bis an die Unterdecke nur, wenn diese feuerhemmend ist und vergleichbarer Raumabschluss besteht."
    },
    "1b": {
     "og": "keine (kein Flurzwang)",
     "ke": "sonstige Gebäude: feuerhemmend (F 30 / REI 30)",
     "h": "Wände bis zur Rohdecke führen; bis an die Unterdecke nur, wenn diese feuerhemmend ist und vergleichbarer Raumabschluss besteht."
    }
   },
   "hh": "MHHR: Wände notwendiger Flure feuerhemmend (laut Lernseite).",
   "rg": "§ 36 Abs. 4 S. 1 bis 3",
   "pos": "flur",
   "auftritt": "geschoss",
   "merksatz": "Flurwände feuerhemmend, im Keller mit feuerbeständigem Tragwerk (GK 3 bis 5) feuerbeständig. Bis zur Rohdecke führen.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "flur_rauchabschnitt",
   "name": "Rauchabschnitte in notwendigen Fluren",
   "gruppe": "Rettungsweg",
   "kurz": "Notwendige Flure werden durch nichtabschließbare, rauchdichte und selbstschließende Abschlüsse in Rauchabschnitte unterteilt. Die Abschnitte sollen nicht länger als 30 m sein.",
   "anf": {
    "2": {
     "t": "nicht erforderlich (kein Flurzwang)",
     "h": "Abschlüsse bis Rohdecke; bis Unterdecke nur, wenn diese feuerhemmend ist. Gilt nicht für offene Gänge."
    },
    "3": {
     "t": "Rauchabschnitt soll ≤ 30 m sein",
     "h": "Abschlüsse bis Rohdecke; bis Unterdecke nur, wenn diese feuerhemmend ist. Gilt nicht für offene Gänge."
    },
    "4": {
     "t": "Rauchabschnitt soll ≤ 30 m sein",
     "h": "Abschlüsse bis Rohdecke; bis Unterdecke nur, wenn diese feuerhemmend ist. Gilt nicht für offene Gänge."
    },
    "5": {
     "t": "Rauchabschnitt soll ≤ 30 m sein",
     "h": "Abschlüsse bis Rohdecke; bis Unterdecke nur, wenn diese feuerhemmend ist. Gilt nicht für offene Gänge."
    },
    "1a": {
     "t": "nicht erforderlich (kein Flurzwang)",
     "h": "Abschlüsse bis Rohdecke; bis Unterdecke nur, wenn diese feuerhemmend ist. Gilt nicht für offene Gänge."
    },
    "1b": {
     "t": "nicht erforderlich (kein Flurzwang)",
     "h": "Abschlüsse bis Rohdecke; bis Unterdecke nur, wenn diese feuerhemmend ist. Gilt nicht für offene Gänge."
    }
   },
   "hh": "MHHR: Rauchabschnitte, Stichflure durch RS-Türen abtrennen (laut Lernseite).",
   "rg": "§ 36 Abs. 3 S. 1 bis 3 und 5",
   "pos": "flur",
   "auftritt": "geschoss",
   "merksatz": "Flure in Rauchabschnitte teilen: nichtabschließbare rauchdichte, selbstschließende Türen (RS), Abschnitt soll nicht länger als 30 m sein.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "flur_stichflur",
   "name": "Flure mit nur einer Fluchtrichtung (Stichflur)",
   "gruppe": "Rettungsweg",
   "kurz": "Notwendige Flure mit nur einer Fluchtrichtung, die zu einem Sicherheitstreppenraum führen, dürfen höchstens 15 m lang sein.",
   "anf": {
    "2": {
     "t": "kein Flurzwang",
     "h": "Die 35-m-Rettungsweglänge bleibt unabhängig davon maßgeblich."
    },
    "3": {
     "t": "≤ 15 m nur, wenn der Flur zu einem Sicherheitstreppenraum führt",
     "h": "Die 35-m-Rettungsweglänge bleibt unabhängig davon maßgeblich."
    },
    "4": {
     "t": "≤ 15 m nur, wenn der Flur zu einem Sicherheitstreppenraum führt",
     "h": "Die 35-m-Rettungsweglänge bleibt unabhängig davon maßgeblich."
    },
    "5": {
     "t": "≤ 15 m nur, wenn der Flur zu einem Sicherheitstreppenraum führt",
     "h": "Die 35-m-Rettungsweglänge bleibt unabhängig davon maßgeblich."
    },
    "1a": {
     "t": "kein Flurzwang",
     "h": "Die 35-m-Rettungsweglänge bleibt unabhängig davon maßgeblich."
    },
    "1b": {
     "t": "kein Flurzwang",
     "h": "Die 35-m-Rettungsweglänge bleibt unabhängig davon maßgeblich."
    }
   },
   "hh": "MHHR: Stichflure max. 15 m, zu Vorraum, Flur mit zwei Fluchtrichtungen oder offenem Gang (laut Lernseite).",
   "rg": "§ 36 Abs. 3 S. 4",
   "pos": "flur",
   "auftritt": "geschoss",
   "merksatz": "Die 15 m gelten für einseitige Flure zum Sicherheitstreppenraum, sonst bleibt es bei 35 m Rettungsweglänge.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "flur_oberflaeche",
   "name": "Baustoffe in notwendigen Fluren",
   "gruppe": "Rettungsweg",
   "kurz": "In notwendigen Fluren und offenen Gängen bestehen Bekleidungen, Putze, Unterdecken und Dämmstoffe aus nichtbrennbaren Baustoffen.",
   "anf": {
    "2": {
     "t": "kein Flurzwang",
     "h": "Brennbare Wände/Decken benötigen nichtbrennbare Bekleidung in ausreichender Dicke."
    },
    "3": {
     "t": "nichtbrennbar",
     "h": "Brennbare Wände/Decken benötigen nichtbrennbare Bekleidung in ausreichender Dicke."
    },
    "4": {
     "t": "nichtbrennbar",
     "h": "Brennbare Wände/Decken benötigen nichtbrennbare Bekleidung in ausreichender Dicke."
    },
    "5": {
     "t": "nichtbrennbar",
     "h": "Brennbare Wände/Decken benötigen nichtbrennbare Bekleidung in ausreichender Dicke."
    },
    "1a": {
     "t": "kein Flurzwang",
     "h": "Brennbare Wände/Decken benötigen nichtbrennbare Bekleidung in ausreichender Dicke."
    },
    "1b": {
     "t": "kein Flurzwang",
     "h": "Brennbare Wände/Decken benötigen nichtbrennbare Bekleidung in ausreichender Dicke."
    }
   },
   "hh": "wie GK 5.",
   "rg": "§ 36 Abs. 6",
   "pos": "flur",
   "auftritt": "geschoss",
   "merksatz": "Im notwendigen Flur Bekleidungen, Putze, Unterdecken, Dämmstoffe nichtbrennbar; brennbare Wände brauchen nichtbrennbare Bekleidung.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "flur_breite_stufen",
   "name": "Breite und Stufen in notwendigen Fluren",
   "gruppe": "Rettungsweg",
   "kurz": "Notwendige Flure müssen für den größten zu erwartenden Verkehr breit genug sein. Eine Folge von weniger als drei Stufen ist unzulässig.",
   "anf": {
    "2": {
     "t": "Breite: für größten zu erwartenden Verkehr; keine Stufenfolge < 3 Stufen",
     "h": "Zahlenwerte (z. B. 1,20 m, 0,90 m) nennt das MBO nicht; die Lernseite führt sie im Hochhaus-Teil (MHHR/Sonderbauverordnungen)."
    },
    "3": {
     "t": "Breite: für größten zu erwartenden Verkehr; keine Stufenfolge < 3 Stufen",
     "h": "Zahlenwerte (z. B. 1,20 m, 0,90 m) nennt das MBO nicht; die Lernseite führt sie im Hochhaus-Teil (MHHR/Sonderbauverordnungen)."
    },
    "4": {
     "t": "Breite: für größten zu erwartenden Verkehr; keine Stufenfolge < 3 Stufen",
     "h": "Zahlenwerte (z. B. 1,20 m, 0,90 m) nennt das MBO nicht; die Lernseite führt sie im Hochhaus-Teil (MHHR/Sonderbauverordnungen)."
    },
    "5": {
     "t": "Breite: für größten zu erwartenden Verkehr; keine Stufenfolge < 3 Stufen",
     "h": "Zahlenwerte (z. B. 1,20 m, 0,90 m) nennt das MBO nicht; die Lernseite führt sie im Hochhaus-Teil (MHHR/Sonderbauverordnungen)."
    },
    "1a": {
     "t": "Breite: für größten zu erwartenden Verkehr; keine Stufenfolge < 3 Stufen",
     "h": "Zahlenwerte (z. B. 1,20 m, 0,90 m) nennt das MBO nicht; die Lernseite führt sie im Hochhaus-Teil (MHHR/Sonderbauverordnungen)."
    },
    "1b": {
     "t": "Breite: für größten zu erwartenden Verkehr; keine Stufenfolge < 3 Stufen",
     "h": "Zahlenwerte (z. B. 1,20 m, 0,90 m) nennt das MBO nicht; die Lernseite führt sie im Hochhaus-Teil (MHHR/Sonderbauverordnungen)."
    }
   },
   "hh": "MHHR (laut Lernseite): lichte Breite mind. 1,20 m, Türen aus Nutzungseinheiten mind. 0,90 m.",
   "rg": "§ 36 Abs. 2; § 34 Abs. 5",
   "pos": "flur",
   "auftritt": "geschoss",
   "unklar": true,
   "merksatz": "Flurbreite nach dem größten zu erwartenden Verkehr; mindestens drei Stufen, nie einzelne Stufen. Zahlen kommen aus Sonderbauregeln.",
   "quelle": "MBO"
  },
  {
   "id": "offener_gang",
   "name": "Offene Gänge vor Außenwänden",
   "gruppe": "Rettungsweg",
   "kurz": "Offene Gänge mit nur einer Fluchtrichtung dürfen notwendige Flure ersetzen. Wände und Brüstungen müssen die Flurwand-Anforderung erfüllen.",
   "anf": {
    "2": {
     "t": "kein Flurzwang",
     "h": "Fenster in diesen Außenwänden erst ab 0,90 m Brüstungshöhe; keine Rauchabschnitte nötig; Baustoffe nichtbrennbar."
    },
    "3": {
     "t": "Wände und Brüstungen feuerhemmend (F 30 / REI 30)",
     "h": "Fenster in diesen Außenwänden erst ab 0,90 m Brüstungshöhe; keine Rauchabschnitte nötig; Baustoffe nichtbrennbar."
    },
    "4": {
     "t": "Wände und Brüstungen feuerhemmend (F 30 / REI 30)",
     "h": "Fenster in diesen Außenwänden erst ab 0,90 m Brüstungshöhe; keine Rauchabschnitte nötig; Baustoffe nichtbrennbar."
    },
    "5": {
     "t": "Wände und Brüstungen feuerhemmend (F 30 / REI 30)",
     "h": "Fenster in diesen Außenwänden erst ab 0,90 m Brüstungshöhe; keine Rauchabschnitte nötig; Baustoffe nichtbrennbar."
    },
    "1a": {
     "t": "kein Flurzwang",
     "h": "Fenster in diesen Außenwänden erst ab 0,90 m Brüstungshöhe; keine Rauchabschnitte nötig; Baustoffe nichtbrennbar."
    },
    "1b": {
     "t": "kein Flurzwang",
     "h": "Fenster in diesen Außenwänden erst ab 0,90 m Brüstungshöhe; keine Rauchabschnitte nötig; Baustoffe nichtbrennbar."
    }
   },
   "hh": "RS-Tür zum offenen Gang (MHHR, laut Lernseite).",
   "rg": "§ 36 Abs. 5, Abs. 3 S. 5, Abs. 6",
   "pos": "flur",
   "auftritt": "geschoss",
   "merksatz": "Offener Gang: Wände und Brüstungen wie Flurwände, Fenster erst ab 0,90 m Brüstung, keine Rauchabschnitte nötig.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "zugang_zufahrt",
   "name": "Zu- und Durchgänge, Zu- und Durchfahrten",
   "gruppe": "Rettungsweg",
   "kurz": "Zu rückwärtigen Gebäuden und zu Gebäuden mit zweitem Rettungsweg über Feuerwehrgerät ist ein geradliniger Zugang zu schaffen. Liegt die Anleiterstelle über 8 m, ist eine Zu- oder Durchfahrt nötig.",
   "anf": {
    "2": {
     "t": "Zu-/Durchgang (Brüstung ≤ 8 m) bzw. Zu-/Durchfahrt (Brüstung > 8 m) befestigt, tragfähig, gekennzeichnet, ständig freizuhalten",
     "h": "Gebäude über 50 m von der öffentlichen Verkehrsfläche: Zufahrten zu den vor und hinter dem Gebäude gelegenen Grundstücksteilen und Bewegungsflächen, wenn für den Feuerwehreinsatz erforderlich."
    },
    "3": {
     "t": "Zu-/Durchgang (Brüstung ≤ 8 m) bzw. Zu-/Durchfahrt (Brüstung > 8 m) befestigt, tragfähig, gekennzeichnet, ständig freizuhalten",
     "h": "Gebäude über 50 m von der öffentlichen Verkehrsfläche: Zufahrten zu den vor und hinter dem Gebäude gelegenen Grundstücksteilen und Bewegungsflächen, wenn für den Feuerwehreinsatz erforderlich."
    },
    "4": {
     "t": "Zu-/Durchgang (Brüstung ≤ 8 m) bzw. Zu-/Durchfahrt (Brüstung > 8 m) befestigt, tragfähig, gekennzeichnet, ständig freizuhalten",
     "h": "Gebäude über 50 m von der öffentlichen Verkehrsfläche: Zufahrten zu den vor und hinter dem Gebäude gelegenen Grundstücksteilen und Bewegungsflächen, wenn für den Feuerwehreinsatz erforderlich."
    },
    "5": {
     "t": "Zu-/Durchgang (Brüstung ≤ 8 m) bzw. Zu-/Durchfahrt (Brüstung > 8 m) befestigt, tragfähig, gekennzeichnet, ständig freizuhalten",
     "h": "Gebäude über 50 m von der öffentlichen Verkehrsfläche: Zufahrten zu den vor und hinter dem Gebäude gelegenen Grundstücksteilen und Bewegungsflächen, wenn für den Feuerwehreinsatz erforderlich."
    },
    "1a": {
     "t": "Zu-/Durchgang (Brüstung ≤ 8 m) bzw. Zu-/Durchfahrt (Brüstung > 8 m) befestigt, tragfähig, gekennzeichnet, ständig freizuhalten",
     "h": "Gebäude über 50 m von der öffentlichen Verkehrsfläche: Zufahrten zu den vor und hinter dem Gebäude gelegenen Grundstücksteilen und Bewegungsflächen, wenn für den Feuerwehreinsatz erforderlich."
    },
    "1b": {
     "t": "Zu-/Durchgang (Brüstung ≤ 8 m) bzw. Zu-/Durchfahrt (Brüstung > 8 m) befestigt, tragfähig, gekennzeichnet, ständig freizuhalten",
     "h": "Gebäude über 50 m von der öffentlichen Verkehrsfläche: Zufahrten zu den vor und hinter dem Gebäude gelegenen Grundstücksteilen und Bewegungsflächen, wenn für den Feuerwehreinsatz erforderlich."
    }
   },
   "hh": "Zufahrten, Eingänge, Bewegungsflächen kennzeichnen, freihalten (MHHR, laut Lernseite).",
   "rg": "§ 5 Abs. 1 S. 1, 2 und 4, Abs. 2",
   "pos": "aufstellflaeche",
   "auftritt": "gebaeude",
   "merksatz": "Feuerwehrzufahrt: tragfähig, gekennzeichnet, ständig frei. Brüstung der Anleiterstelle über 8 m: Zufahrt statt Zugang.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "aufstellflaeche",
   "name": "Aufstell- und Bewegungsflächen für die Feuerwehr",
   "gruppe": "Rettungsweg",
   "kurz": "Ist für die Personenrettung der Einsatz von Hubrettungsfahrzeugen erforderlich, sind Aufstell- und Bewegungsflächen vorzusehen. Sie müssen tragfähig, gekennzeichnet und freigehalten sein.",
   "anf": {
    "2": {
     "t": "Aufstell-/Bewegungsflächen, soweit Hubrettungsfahrzeuge für die Personenrettung erforderlich; befestigt, tragfähig, gekennzeichnet, ständig freizuhalten, nicht beparken",
     "h": "Maße (Länge, Breite, Abstand zur Fassade) nennt das MBO nicht; sie stehen in der Muster-Richtlinie über Flächen für die Feuerwehr (hier nicht geprüft)."
    },
    "3": {
     "t": "Aufstell-/Bewegungsflächen, soweit Hubrettungsfahrzeuge für die Personenrettung erforderlich; befestigt, tragfähig, gekennzeichnet, ständig freizuhalten, nicht beparken",
     "h": "Maße (Länge, Breite, Abstand zur Fassade) nennt das MBO nicht; sie stehen in der Muster-Richtlinie über Flächen für die Feuerwehr (hier nicht geprüft)."
    },
    "4": {
     "t": "Aufstell-/Bewegungsflächen, soweit Hubrettungsfahrzeuge für die Personenrettung erforderlich; befestigt, tragfähig, gekennzeichnet, ständig freizuhalten, nicht beparken",
     "h": "Maße (Länge, Breite, Abstand zur Fassade) nennt das MBO nicht; sie stehen in der Muster-Richtlinie über Flächen für die Feuerwehr (hier nicht geprüft)."
    },
    "5": {
     "t": "Aufstell-/Bewegungsflächen, soweit Hubrettungsfahrzeuge für die Personenrettung erforderlich; befestigt, tragfähig, gekennzeichnet, ständig freizuhalten, nicht beparken",
     "h": "Maße (Länge, Breite, Abstand zur Fassade) nennt das MBO nicht; sie stehen in der Muster-Richtlinie über Flächen für die Feuerwehr (hier nicht geprüft)."
    },
    "1a": {
     "t": "Aufstell-/Bewegungsflächen, soweit Hubrettungsfahrzeuge für die Personenrettung erforderlich; befestigt, tragfähig, gekennzeichnet, ständig freizuhalten, nicht beparken",
     "h": "Maße (Länge, Breite, Abstand zur Fassade) nennt das MBO nicht; sie stehen in der Muster-Richtlinie über Flächen für die Feuerwehr (hier nicht geprüft)."
    },
    "1b": {
     "t": "Aufstell-/Bewegungsflächen, soweit Hubrettungsfahrzeuge für die Personenrettung erforderlich; befestigt, tragfähig, gekennzeichnet, ständig freizuhalten, nicht beparken",
     "h": "Maße (Länge, Breite, Abstand zur Fassade) nennt das MBO nicht; sie stehen in der Muster-Richtlinie über Flächen für die Feuerwehr (hier nicht geprüft)."
    }
   },
   "hh": "Bewegungsflächen, Feuerwehrzugänge unmittelbar erreichbar (MHHR, laut Lernseite).",
   "rg": "§ 5 Abs. 1 S. 3, Abs. 2",
   "pos": "aufstellflaeche",
   "auftritt": "gebaeude",
   "unklar": true,
   "merksatz": "Aufstellfläche für Drehleiter: tragfähig, gekennzeichnet, nie zuparken. Maße stehen nicht im MBO.",
   "quelle": "MBO"
  },
  {
   "id": "tuer_treppenraum_keller",
   "name": "Türen vom Treppenraum zu Keller, Dachraum, Werkstatt, Laden, Lager, NE > 200 m²",
   "gruppe": "Öffnungen",
   "kurz": "Öffnungen von notwendigen Treppenräumen zu Kellergeschossen, nicht ausgebauten Dachräumen, Werkstätten, Läden, Lagern und größeren Nutzungseinheiten haben die höchsten Anforderungen.",
   "anf": {
    "2": {
     "t": "kein Treppenraum nötig",
     "h": "Wohnungen ausgenommen. Feuerschutz-/Rauchschutzabschlüsse dürfen lichtdurchlässige Seitenteile/Oberlichte haben, wenn der Abschluss insgesamt höchstens 2,50 m breit ist."
    },
    "3": {
     "t": "feuerhemmend, rauchdicht, selbstschließend (T30-RS)",
     "h": "Wohnungen ausgenommen. Feuerschutz-/Rauchschutzabschlüsse dürfen lichtdurchlässige Seitenteile/Oberlichte haben, wenn der Abschluss insgesamt höchstens 2,50 m breit ist."
    },
    "4": {
     "t": "feuerhemmend, rauchdicht, selbstschließend (T30-RS)",
     "h": "Wohnungen ausgenommen. Feuerschutz-/Rauchschutzabschlüsse dürfen lichtdurchlässige Seitenteile/Oberlichte haben, wenn der Abschluss insgesamt höchstens 2,50 m breit ist."
    },
    "5": {
     "t": "feuerhemmend, rauchdicht, selbstschließend (T30-RS)",
     "h": "Wohnungen ausgenommen. Feuerschutz-/Rauchschutzabschlüsse dürfen lichtdurchlässige Seitenteile/Oberlichte haben, wenn der Abschluss insgesamt höchstens 2,50 m breit ist."
    },
    "1a": {
     "t": "kein Treppenraum nötig",
     "h": "Wohnungen ausgenommen. Feuerschutz-/Rauchschutzabschlüsse dürfen lichtdurchlässige Seitenteile/Oberlichte haben, wenn der Abschluss insgesamt höchstens 2,50 m breit ist."
    },
    "1b": {
     "t": "kein Treppenraum nötig",
     "h": "Wohnungen ausgenommen. Feuerschutz-/Rauchschutzabschlüsse dürfen lichtdurchlässige Seitenteile/Oberlichte haben, wenn der Abschluss insgesamt höchstens 2,50 m breit ist."
    }
   },
   "hh": "MHHR: Treppenraum zum Flur/Vorraum T30-RS (laut Lernseite).",
   "rg": "§ 35 Abs. 6 S. 1 Nr. 1 und S. 2",
   "pos": "tuer",
   "auftritt": "mehrfach",
   "merksatz": "Tür vom Treppenraum zu Keller, Dachraum, Werkstatt, Laden, Lager oder NE über 200 m²: T30-RS.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "tuer_treppenraum_flur",
   "name": "Türen vom Treppenraum zu notwendigen Fluren",
   "gruppe": "Öffnungen",
   "kurz": "Zwischen notwendigem Treppenraum und notwendigem Flur genügt ein rauchdichter und selbstschließender Abschluss (RS).",
   "anf": {
    "2": {
     "t": "kein Treppenraum nötig"
    },
    "3": {
     "t": "rauchdicht, selbstschließend (RS)"
    },
    "4": {
     "t": "rauchdicht, selbstschließend (RS)"
    },
    "5": {
     "t": "rauchdicht, selbstschließend (RS)"
    },
    "1a": {
     "t": "kein Treppenraum nötig"
    },
    "1b": {
     "t": "kein Treppenraum nötig"
    }
   },
   "hh": "MHHR: T30-RS (laut Lernseite).",
   "rg": "§ 35 Abs. 6 S. 1 Nr. 2",
   "pos": "tuer",
   "auftritt": "mehrfach",
   "merksatz": "Treppenraum zum notwendigen Flur: Tür rauchdicht und selbstschließend (RS).",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "tuer_treppenraum_sonst",
   "name": "Türen vom Treppenraum zu sonstigen Räumen und Nutzungseinheiten",
   "gruppe": "Öffnungen",
   "kurz": "Zu sonstigen Räumen und Nutzungseinheiten (zum Beispiel Wohnungen) genügt ein dicht- und selbstschließender Abschluss.",
   "anf": {
    "2": {
     "t": "kein Treppenraum nötig"
    },
    "3": {
     "t": "dicht- und selbstschließend (DS)"
    },
    "4": {
     "t": "dicht- und selbstschließend (DS)"
    },
    "5": {
     "t": "dicht- und selbstschließend (DS)"
    },
    "1a": {
     "t": "kein Treppenraum nötig"
    },
    "1b": {
     "t": "kein Treppenraum nötig"
    }
   },
   "hh": "MHHR: T30-RS für Nutzungseinheiten (laut Lernseite).",
   "rg": "§ 35 Abs. 6 S. 1 Nr. 3",
   "pos": "tuer",
   "auftritt": "mehrfach",
   "merksatz": "Treppenraum zu Wohnung oder anderer kleiner Nutzungseinheit: mindestens dicht- und selbstschließend (DS).",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "tuer_flur",
   "name": "Türen in Wänden notwendiger Flure",
   "gruppe": "Öffnungen",
   "kurz": "Türen in Flurwänden müssen dicht schließen. Öffnungen zu Lagerbereichen im Keller brauchen feuerhemmende, dicht- und selbstschließende Abschlüsse.",
   "anf": {
    "2": {
     "t": "kein Flurzwang",
     "h": "Rauchabschnittstüren im Flur: rauchdicht und selbstschließend (RS), nicht abschließbar."
    },
    "3": {
     "t": "Tür dichtschließend; zu Kellerlagern T30-DS",
     "h": "Rauchabschnittstüren im Flur: rauchdicht und selbstschließend (RS), nicht abschließbar."
    },
    "4": {
     "t": "Tür dichtschließend; zu Kellerlagern T30-DS",
     "h": "Rauchabschnittstüren im Flur: rauchdicht und selbstschließend (RS), nicht abschließbar."
    },
    "5": {
     "t": "Tür dichtschließend; zu Kellerlagern T30-DS",
     "h": "Rauchabschnittstüren im Flur: rauchdicht und selbstschließend (RS), nicht abschließbar."
    },
    "1a": {
     "t": "kein Flurzwang",
     "h": "Rauchabschnittstüren im Flur: rauchdicht und selbstschließend (RS), nicht abschließbar."
    },
    "1b": {
     "t": "kein Flurzwang",
     "h": "Rauchabschnittstüren im Flur: rauchdicht und selbstschließend (RS), nicht abschließbar."
    }
   },
   "hh": "MHHR: Tür der Nutzungseinheit zum Flur T30-RS (laut Lernseite).",
   "rg": "§ 36 Abs. 4 S. 4; § 36 Abs. 3 S. 1",
   "pos": "tuer",
   "auftritt": "mehrfach",
   "merksatz": "Flurwand-Türen dichtschließend. Zu Kellerlagern T30-DS, Rauchabschnittstüren im Flur RS.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "tuer_decke_oeffnung",
   "name": "Öffnungen und Abschlüsse in Decken",
   "gruppe": "Öffnungen",
   "kurz": "Öffnungen in Decken mit vorgeschriebener Feuerwiderstandsfähigkeit sind nur in bestimmten Fällen zulässig.",
   "anf": {
    "2": {
     "t": "zulässig (Öffnungen in Decken GK 1 und 2)"
    },
    "3": {
     "t": "zulässig innerhalb derselben NE ≤ 400 m² in ≤ 2 Geschossen; sonst auf das Nötige beschränkt mit Abschluss in der F-Klasse der Decke"
    },
    "4": {
     "t": "wie GK 3"
    },
    "5": {
     "t": "wie GK 3"
    },
    "1a": {
     "t": "zulässig (Öffnungen in Decken GK 1 und 2)"
    },
    "1b": {
     "t": "zulässig (Öffnungen in Decken GK 1 und 2)"
    }
   },
   "hh": "unklar.",
   "rg": "§ 31 Abs. 4",
   "pos": "decke",
   "auftritt": "mehrfach",
   "merksatz": "Deckenöffnungen: frei in GK 1 und 2 und innerhalb einer NE bis 400 m² über zwei Geschosse; sonst nur mit Abschluss in Deckenqualität.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "fenster_rettung",
   "name": "Rettungsfenster (Maße)",
   "gruppe": "Öffnungen",
   "kurz": "Fenster, die als zweiter Rettungsweg dienen, müssen groß genug und nicht zu hoch angeordnet sein. In Dachschrägen gilt ein Höchstabstand zur Traufkante.",
   "anf": {
    "2": {
     "t": "lichtes Maß mind. 0,90 m × 1,20 m; Brüstung/Unterkante max. 1,20 m über Fußboden; in Dachschräge/Dachaufbau Unterkante oder Austritt max. 1 m horizontal von der Traufkante",
     "h": "Gilt für Fenster als Rettungsweg nach § 33 Abs. 2 S. 2 (Anleiterstelle)."
    },
    "3": {
     "t": "lichtes Maß mind. 0,90 m × 1,20 m; Brüstung/Unterkante max. 1,20 m über Fußboden; in Dachschräge/Dachaufbau Unterkante oder Austritt max. 1 m horizontal von der Traufkante",
     "h": "Gilt für Fenster als Rettungsweg nach § 33 Abs. 2 S. 2 (Anleiterstelle)."
    },
    "4": {
     "t": "lichtes Maß mind. 0,90 m × 1,20 m; Brüstung/Unterkante max. 1,20 m über Fußboden; in Dachschräge/Dachaufbau Unterkante oder Austritt max. 1 m horizontal von der Traufkante",
     "h": "Gilt für Fenster als Rettungsweg nach § 33 Abs. 2 S. 2 (Anleiterstelle)."
    },
    "5": {
     "t": "lichtes Maß mind. 0,90 m × 1,20 m; Brüstung/Unterkante max. 1,20 m über Fußboden; in Dachschräge/Dachaufbau Unterkante oder Austritt max. 1 m horizontal von der Traufkante",
     "h": "Gilt für Fenster als Rettungsweg nach § 33 Abs. 2 S. 2 (Anleiterstelle)."
    },
    "1a": {
     "t": "lichtes Maß mind. 0,90 m × 1,20 m; Brüstung/Unterkante max. 1,20 m über Fußboden; in Dachschräge/Dachaufbau Unterkante oder Austritt max. 1 m horizontal von der Traufkante",
     "h": "Gilt für Fenster als Rettungsweg nach § 33 Abs. 2 S. 2 (Anleiterstelle)."
    },
    "1b": {
     "t": "lichtes Maß mind. 0,90 m × 1,20 m; Brüstung/Unterkante max. 1,20 m über Fußboden; in Dachschräge/Dachaufbau Unterkante oder Austritt max. 1 m horizontal von der Traufkante",
     "h": "Gilt für Fenster als Rettungsweg nach § 33 Abs. 2 S. 2 (Anleiterstelle)."
    }
   },
   "hh": "nicht einschlägig (bauliche Rettungswege).",
   "rg": "§ 37 Abs. 5",
   "pos": "fenster",
   "auftritt": "geschoss",
   "merksatz": "Rettungsfenster mindestens 0,90 m × 1,20 m, Brüstung höchstens 1,20 m; im Dach höchstens 1 m von der Traufkante.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "keller_rauchableitung",
   "name": "Kellerfenster / Rauchableitung aus dem Keller",
   "gruppe": "Öffnungen",
   "kurz": "Jedes Kellergeschoss ohne Fenster muss mindestens eine Öffnung ins Freie zur Rauchableitung haben. Übereinanderliegende Kellergeschosse dürfen keinen gemeinsamen Lichtschacht haben.",
   "anf": {
    "2": {
     "t": "mindestens 1 Öffnung ins Freie je fensterlosem Kellergeschoss; keine gemeinsamen Kellerlichtschächte übereinanderliegender Kellergeschosse",
     "h": "Mindestgröße der Öffnung nennt das MBO nicht (unklar)."
    },
    "3": {
     "t": "mindestens 1 Öffnung ins Freie je fensterlosem Kellergeschoss; keine gemeinsamen Kellerlichtschächte übereinanderliegender Kellergeschosse",
     "h": "Mindestgröße der Öffnung nennt das MBO nicht (unklar)."
    },
    "4": {
     "t": "mindestens 1 Öffnung ins Freie je fensterlosem Kellergeschoss; keine gemeinsamen Kellerlichtschächte übereinanderliegender Kellergeschosse",
     "h": "Mindestgröße der Öffnung nennt das MBO nicht (unklar)."
    },
    "5": {
     "t": "mindestens 1 Öffnung ins Freie je fensterlosem Kellergeschoss; keine gemeinsamen Kellerlichtschächte übereinanderliegender Kellergeschosse",
     "h": "Mindestgröße der Öffnung nennt das MBO nicht (unklar)."
    },
    "1a": {
     "t": "mindestens 1 Öffnung ins Freie je fensterlosem Kellergeschoss; keine gemeinsamen Kellerlichtschächte übereinanderliegender Kellergeschosse",
     "h": "Mindestgröße der Öffnung nennt das MBO nicht (unklar)."
    },
    "1b": {
     "t": "mindestens 1 Öffnung ins Freie je fensterlosem Kellergeschoss; keine gemeinsamen Kellerlichtschächte übereinanderliegender Kellergeschosse",
     "h": "Mindestgröße der Öffnung nennt das MBO nicht (unklar)."
    }
   },
   "hh": "unklar.",
   "rg": "§ 37 Abs. 4",
   "pos": "fenster",
   "auftritt": "geschoss",
   "unklar": true,
   "merksatz": "Fensterloser Keller: mindestens eine Öffnung ins Freie zur Rauchableitung; Lichtschächte nie gemeinsam für übereinanderliegende Keller.",
   "quelle": "MBO"
  },
  {
   "id": "aufzug_schacht",
   "name": "Fahrschachtwände von Aufzügen",
   "gruppe": "Technik",
   "kurz": "Aufzüge im Innern von Gebäuden brauchen eigene Fahrschächte, die die Brandausbreitung in andere Geschosse ausreichend lang verhindern. Ein Fahrschacht darf bis zu drei Aufzüge enthalten.",
   "anf": {
    "2": {
     "t": "keine Anforderung",
     "h": "Fahrschachtwände aus brennbaren Baustoffen brauchen schachtseitig nichtbrennbare Bekleidung in ausreichender Dicke. Fahrschachttüren und Öffnungen dürfen den Schutz nicht beeinträchtigen."
    },
    "3": {
     "t": "feuerhemmend (F 30 / REI 30)",
     "h": "Fahrschachtwände aus brennbaren Baustoffen brauchen schachtseitig nichtbrennbare Bekleidung in ausreichender Dicke. Fahrschachttüren und Öffnungen dürfen den Schutz nicht beeinträchtigen."
    },
    "4": {
     "t": "hochfeuerhemmend (REI 60)",
     "h": "Fahrschachtwände aus brennbaren Baustoffen brauchen schachtseitig nichtbrennbare Bekleidung in ausreichender Dicke. Fahrschachttüren und Öffnungen dürfen den Schutz nicht beeinträchtigen."
    },
    "5": {
     "t": "feuerbeständig (REI 90) und nichtbrennbar",
     "h": "Fahrschachtwände aus brennbaren Baustoffen brauchen schachtseitig nichtbrennbare Bekleidung in ausreichender Dicke. Fahrschachttüren und Öffnungen dürfen den Schutz nicht beeinträchtigen."
    },
    "1a": {
     "t": "keine Anforderung",
     "h": "Fahrschachtwände aus brennbaren Baustoffen brauchen schachtseitig nichtbrennbare Bekleidung in ausreichender Dicke. Fahrschachttüren und Öffnungen dürfen den Schutz nicht beeinträchtigen."
    },
    "1b": {
     "t": "keine Anforderung",
     "h": "Fahrschachtwände aus brennbaren Baustoffen brauchen schachtseitig nichtbrennbare Bekleidung in ausreichender Dicke. Fahrschachttüren und Öffnungen dürfen den Schutz nicht beeinträchtigen."
    }
   },
   "hh": "MHHR: Fahrschächte feuerbeständig (F90), über 60 m F120; Feuerwehraufzug mit eigenem Schacht (laut Lernseite).",
   "rg": "§ 39 Abs. 1 und 2",
   "pos": "aufzug",
   "auftritt": "gebaeude",
   "merksatz": "Fahrschachtwände: GK 3 feuerhemmend, GK 4 hochfeuerhemmend, GK 5 feuerbeständig und nichtbrennbar. GK 1 und 2 ohne Anforderung.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "aufzug_ohne_schacht",
   "name": "Aufzüge ohne eigenen Fahrschacht (Ausnahmen)",
   "gruppe": "Technik",
   "kurz": "Aufzüge ohne eigenen Fahrschacht sind nur in vier Fällen zulässig, zum Beispiel in GK 1 und 2 oder innerhalb eines notwendigen Treppenraums.",
   "anf": {
    "2": {
     "t": "ohne eigenen Fahrschacht zulässig, sicher umkleidet",
     "h": "Im notwendigen Treppenraum nicht in Hochhäusern."
    },
    "3": {
     "t": "nur in Ausnahmefällen: im Treppenraum, in geschossüberbrückenden Räumen, bei offen verbundenen Geschossen",
     "h": "Im notwendigen Treppenraum nicht in Hochhäusern."
    },
    "4": {
     "t": "wie GK 3",
     "h": "Im notwendigen Treppenraum nicht in Hochhäusern."
    },
    "5": {
     "t": "wie GK 3",
     "h": "Im notwendigen Treppenraum nicht in Hochhäusern."
    },
    "1a": {
     "t": "ohne eigenen Fahrschacht zulässig, sicher umkleidet",
     "h": "Im notwendigen Treppenraum nicht in Hochhäusern."
    },
    "1b": {
     "t": "ohne eigenen Fahrschacht zulässig, sicher umkleidet",
     "h": "Im notwendigen Treppenraum nicht in Hochhäusern."
    }
   },
   "hh": "im Treppenraum unzulässig (Hochhaus).",
   "rg": "§ 39 Abs. 1 S. 3",
   "pos": "aufzug",
   "auftritt": "gebaeude",
   "merksatz": "Aufzug ohne eigenen Fahrschacht: GK 1 und 2, im Treppenraum (nicht im Hochhaus), in geschossüberbrückenden Räumen, bei offen verbundenen Geschossen.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "aufzug_rauch",
   "name": "Rauchableitung am Fahrschacht",
   "gruppe": "Technik",
   "kurz": "Fahrschächte müssen lüftbar sein und oben eine Rauchableitungsöffnung mit mindestens 2,5 % der Schachtgrundfläche, mindestens 0,10 m², haben.",
   "anf": {
    "2": {
     "t": "keine Anforderung",
     "h": "Gilt für Aufzüge mit Fahrschacht; Abschluss darf im Brandfall selbsttätig öffnen. Lage windunabhängig wählen."
    },
    "3": {
     "t": "≥ 2,5 % der Fahrschachtgrundfläche, mind. 0,10 m²",
     "h": "Gilt für Aufzüge mit Fahrschacht; Abschluss darf im Brandfall selbsttätig öffnen. Lage windunabhängig wählen."
    },
    "4": {
     "t": "≥ 2,5 % der Fahrschachtgrundfläche, mind. 0,10 m²",
     "h": "Gilt für Aufzüge mit Fahrschacht; Abschluss darf im Brandfall selbsttätig öffnen. Lage windunabhängig wählen."
    },
    "5": {
     "t": "≥ 2,5 % der Fahrschachtgrundfläche, mind. 0,10 m²",
     "h": "Gilt für Aufzüge mit Fahrschacht; Abschluss darf im Brandfall selbsttätig öffnen. Lage windunabhängig wählen."
    },
    "1a": {
     "t": "keine Anforderung",
     "h": "Gilt für Aufzüge mit Fahrschacht; Abschluss darf im Brandfall selbsttätig öffnen. Lage windunabhängig wählen."
    },
    "1b": {
     "t": "keine Anforderung",
     "h": "Gilt für Aufzüge mit Fahrschacht; Abschluss darf im Brandfall selbsttätig öffnen. Lage windunabhängig wählen."
    }
   },
   "hh": "Druckbelüftung der Feuerwehraufzugsschächte (MHHR, laut Lernseite).",
   "rg": "§ 39 Abs. 3",
   "pos": "aufzug",
   "auftritt": "gebaeude",
   "merksatz": "Fahrschacht oben entrauchbar: 2,5 % der Grundfläche, mindestens 0,10 m².",
   "unklar": false,
   "quelle": "MBO"
  },
  {
   "id": "aufzug_pflicht",
   "name": "Aufzüge ab 13 m Höhe",
   "gruppe": "Technik",
   "kurz": "Gebäude über 13 m Höhe brauchen Aufzüge in ausreichender Zahl. Mindestens ein Aufzug muss Kinderwagen, Rollstühle, Krankentragen und Lasten aufnehmen können.",
   "anf": {
    "2": {
     "t": "nicht erforderlich",
     "h": "Krankentragen-Fahrkorb mind. 1,10 m × 2,10 m, Tür lichte Breite mind. 0,90 m, davor Bewegungsfläche."
    },
    "3": {
     "t": "nicht erforderlich",
     "h": "Krankentragen-Fahrkorb mind. 1,10 m × 2,10 m, Tür lichte Breite mind. 0,90 m, davor Bewegungsfläche."
    },
    "4": {
     "t": "nicht erforderlich",
     "h": "Krankentragen-Fahrkorb mind. 1,10 m × 2,10 m, Tür lichte Breite mind. 0,90 m, davor Bewegungsfläche."
    },
    "5": {
     "t": "Aufzüge in ausreichender Zahl (Höhe > 13 m)",
     "h": "Krankentragen-Fahrkorb mind. 1,10 m × 2,10 m, Tür lichte Breite mind. 0,90 m, davor Bewegungsfläche."
    },
    "1a": {
     "t": "nicht erforderlich",
     "h": "Krankentragen-Fahrkorb mind. 1,10 m × 2,10 m, Tür lichte Breite mind. 0,90 m, davor Bewegungsfläche."
    },
    "1b": {
     "t": "nicht erforderlich",
     "h": "Krankentragen-Fahrkorb mind. 1,10 m × 2,10 m, Tür lichte Breite mind. 0,90 m, davor Bewegungsfläche."
    }
   },
   "hh": "Feuerwehraufzüge (MHHR, laut Lernseite).",
   "rg": "§ 39 Abs. 4 und 5",
   "pos": "aufzug",
   "auftritt": "gebaeude",
   "merksatz": "Über 13 m Höhe Aufzugspflicht; mindestens ein Aufzug für Krankentrage, Fahrkorb 1,10 m × 2,10 m, Tür 0,90 m.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "leitung_durchfuehrung",
   "name": "Leitungsdurchführungen durch raumabschließende Bauteile",
   "gruppe": "Technik",
   "kurz": "Leitungen dürfen durch Bauteile mit vorgeschriebener Feuerwiderstandsfähigkeit nur geführt werden, wenn keine Brandausbreitung zu befürchten ist oder Vorkehrungen getroffen sind (zum Beispiel Schottungen).",
   "anf": {
    "2": {
     "t": "nicht anwendbar (gilt nicht für GK 1 und 2)",
     "h": "Ausnahmen auch ab GK 3: innerhalb von Wohnungen und innerhalb einer Nutzungseinheit ≤ 400 m² in ≤ 2 Geschossen. Konkrete Schottsysteme nicht im MBO."
    },
    "3": {
     "t": "Brandausbreitung verhindern (Schottung/Vorkehrungen)",
     "h": "Ausnahmen auch ab GK 3: innerhalb von Wohnungen und innerhalb einer Nutzungseinheit ≤ 400 m² in ≤ 2 Geschossen. Konkrete Schottsysteme nicht im MBO."
    },
    "4": {
     "t": "Brandausbreitung verhindern (Schottung/Vorkehrungen)",
     "h": "Ausnahmen auch ab GK 3: innerhalb von Wohnungen und innerhalb einer Nutzungseinheit ≤ 400 m² in ≤ 2 Geschossen. Konkrete Schottsysteme nicht im MBO."
    },
    "5": {
     "t": "Brandausbreitung verhindern (Schottung/Vorkehrungen)",
     "h": "Ausnahmen auch ab GK 3: innerhalb von Wohnungen und innerhalb einer Nutzungseinheit ≤ 400 m² in ≤ 2 Geschossen. Konkrete Schottsysteme nicht im MBO."
    },
    "1a": {
     "t": "nicht anwendbar (gilt nicht für GK 1 und 2)",
     "h": "Ausnahmen auch ab GK 3: innerhalb von Wohnungen und innerhalb einer Nutzungseinheit ≤ 400 m² in ≤ 2 Geschossen. Konkrete Schottsysteme nicht im MBO."
    },
    "1b": {
     "t": "nicht anwendbar (gilt nicht für GK 1 und 2)",
     "h": "Ausnahmen auch ab GK 3: innerhalb von Wohnungen und innerhalb einer Nutzungseinheit ≤ 400 m² in ≤ 2 Geschossen. Konkrete Schottsysteme nicht im MBO."
    }
   },
   "hh": "unklar.",
   "rg": "§ 40 Abs. 1",
   "pos": "durchfuehrung",
   "auftritt": "mehrfach",
   "merksatz": "Leitung durch F-Bauteil nur mit Vorkehrung gegen Brandausbreitung. Nicht in GK 1 und 2, in Wohnungen und in NE bis 400 m² über zwei Geschosse.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "leitung_rettungsweg",
   "name": "Leitungen in Treppenräumen und Fluren",
   "gruppe": "Technik",
   "kurz": "In notwendigen Treppenräumen, deren Erweiterungen und in notwendigen Fluren sind Leitungsanlagen nur zulässig, wenn die Rettungswegnutzung im Brandfall ausreichend lang möglich bleibt.",
   "anf": {
    "2": {
     "t": "Leitungsanlagen nur, wenn Rettungsweg im Brandfall ausreichend lang nutzbar",
     "h": "Wo kein notwendiger Flur/Treppenraum gefordert ist, läuft die Regel leer (GK 1/2)."
    },
    "3": {
     "t": "Leitungsanlagen nur, wenn Rettungsweg im Brandfall ausreichend lang nutzbar",
     "h": "Wo kein notwendiger Flur/Treppenraum gefordert ist, läuft die Regel leer (GK 1/2)."
    },
    "4": {
     "t": "Leitungsanlagen nur, wenn Rettungsweg im Brandfall ausreichend lang nutzbar",
     "h": "Wo kein notwendiger Flur/Treppenraum gefordert ist, läuft die Regel leer (GK 1/2)."
    },
    "5": {
     "t": "Leitungsanlagen nur, wenn Rettungsweg im Brandfall ausreichend lang nutzbar",
     "h": "Wo kein notwendiger Flur/Treppenraum gefordert ist, läuft die Regel leer (GK 1/2)."
    },
    "1a": {
     "t": "Leitungsanlagen nur, wenn Rettungsweg im Brandfall ausreichend lang nutzbar",
     "h": "Wo kein notwendiger Flur/Treppenraum gefordert ist, läuft die Regel leer (GK 1/2)."
    },
    "1b": {
     "t": "Leitungsanlagen nur, wenn Rettungsweg im Brandfall ausreichend lang nutzbar",
     "h": "Wo kein notwendiger Flur/Treppenraum gefordert ist, läuft die Regel leer (GK 1/2)."
    }
   },
   "hh": "unklar.",
   "rg": "§ 40 Abs. 2",
   "pos": "flur",
   "auftritt": "geschoss",
   "merksatz": "Leitungen im Rettungsweg nur, wenn der Rettungsweg im Brandfall ausreichend lang nutzbar bleibt.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "install_schacht",
   "name": "Installationsschächte und -kanäle",
   "gruppe": "Technik",
   "kurz": "Für Installationsschächte und -kanäle gelten die Regeln für Leitungsdurchführungen und für Lüftungsleitungen entsprechend.",
   "anf": {
    "2": {
     "t": "nicht anwendbar (GK 1 und 2)",
     "h": "Die Feuerwiderstandsdauer der Schachtwand selbst legt die MBO nicht fest; sie ergibt sich aus dem durchdrungenen Bauteil und der Leitungsanlagen-Richtlinie (hier nicht geprüft)."
    },
    "3": {
     "t": "Brandausbreitung verhindern; nichtbrennbare Baustoffe, sofern nicht nachgewiesen ungefährlich",
     "h": "Die Feuerwiderstandsdauer der Schachtwand selbst legt die MBO nicht fest; sie ergibt sich aus dem durchdrungenen Bauteil und der Leitungsanlagen-Richtlinie (hier nicht geprüft)."
    },
    "4": {
     "t": "wie GK 3",
     "h": "Die Feuerwiderstandsdauer der Schachtwand selbst legt die MBO nicht fest; sie ergibt sich aus dem durchdrungenen Bauteil und der Leitungsanlagen-Richtlinie (hier nicht geprüft)."
    },
    "5": {
     "t": "wie GK 3",
     "h": "Die Feuerwiderstandsdauer der Schachtwand selbst legt die MBO nicht fest; sie ergibt sich aus dem durchdrungenen Bauteil und der Leitungsanlagen-Richtlinie (hier nicht geprüft)."
    },
    "1a": {
     "t": "nicht anwendbar (GK 1 und 2)",
     "h": "Die Feuerwiderstandsdauer der Schachtwand selbst legt die MBO nicht fest; sie ergibt sich aus dem durchdrungenen Bauteil und der Leitungsanlagen-Richtlinie (hier nicht geprüft)."
    },
    "1b": {
     "t": "nicht anwendbar (GK 1 und 2)",
     "h": "Die Feuerwiderstandsdauer der Schachtwand selbst legt die MBO nicht fest; sie ergibt sich aus dem durchdrungenen Bauteil und der Leitungsanlagen-Richtlinie (hier nicht geprüft)."
    }
   },
   "hh": "MHHR: Wände von Installationsschächten feuerbeständig (laut Lernseite, MHHR 3.2.4).",
   "rg": "§ 40 Abs. 3; § 41 Abs. 2 S. 1 und Abs. 3",
   "pos": "schacht",
   "auftritt": "gebaeude",
   "unklar": true,
   "merksatz": "Installationsschächte wie Leitungsdurchführungen und Lüftungsleitungen behandeln; konkrete F-Klasse der Schachtwand steht nicht im MBO.",
   "quelle": "MBO"
  },
  {
   "id": "lueftung_leitung",
   "name": "Lüftungsleitungen",
   "gruppe": "Technik",
   "kurz": "Lüftungsleitungen sowie Bekleidungen und Dämmstoffe müssen nichtbrennbar sein. Sie dürfen feuerwiderstandsfähige Bauteile nur überbrücken, wenn keine Brandausbreitung zu befürchten ist.",
   "anf": {
    "2": {
     "t": "nicht anwendbar (GK 1 und 2)",
     "h": "Brennbare Baustoffe zulässig, wenn kein Beitrag zur Brandentstehung/Brandweiterleitung zu befürchten ist. Ausnahmen auch in Wohnungen und NE ≤ 400 m² in ≤ 2 Geschossen."
    },
    "3": {
     "t": "nichtbrennbar (Leitung, Bekleidung, Dämmstoff); Überbrückung nur mit Brandschutzvorkehrung",
     "h": "Brennbare Baustoffe zulässig, wenn kein Beitrag zur Brandentstehung/Brandweiterleitung zu befürchten ist. Ausnahmen auch in Wohnungen und NE ≤ 400 m² in ≤ 2 Geschossen."
    },
    "4": {
     "t": "wie GK 3",
     "h": "Brennbare Baustoffe zulässig, wenn kein Beitrag zur Brandentstehung/Brandweiterleitung zu befürchten ist. Ausnahmen auch in Wohnungen und NE ≤ 400 m² in ≤ 2 Geschossen."
    },
    "5": {
     "t": "wie GK 3",
     "h": "Brennbare Baustoffe zulässig, wenn kein Beitrag zur Brandentstehung/Brandweiterleitung zu befürchten ist. Ausnahmen auch in Wohnungen und NE ≤ 400 m² in ≤ 2 Geschossen."
    },
    "1a": {
     "t": "nicht anwendbar (GK 1 und 2)",
     "h": "Brennbare Baustoffe zulässig, wenn kein Beitrag zur Brandentstehung/Brandweiterleitung zu befürchten ist. Ausnahmen auch in Wohnungen und NE ≤ 400 m² in ≤ 2 Geschossen."
    },
    "1b": {
     "t": "nicht anwendbar (GK 1 und 2)",
     "h": "Brennbare Baustoffe zulässig, wenn kein Beitrag zur Brandentstehung/Brandweiterleitung zu befürchten ist. Ausnahmen auch in Wohnungen und NE ≤ 400 m² in ≤ 2 Geschossen."
    }
   },
   "hh": "unklar.",
   "rg": "§ 41 Abs. 2 und 5",
   "pos": "schacht",
   "auftritt": "mehrfach",
   "merksatz": "Lüftungsleitungen samt Dämmung nichtbrennbar; Durchführung durch Brandabschnitte nur mit Vorkehrung (Brandschutzklappe). Gilt nicht in GK 1 und 2.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "lueftung_allgemein",
   "name": "Lüftungsanlagen: Betrieb, Abluft, Geruch",
   "gruppe": "Technik",
   "kurz": "Lüftungsanlagen müssen betriebssicher und brandsicher sein. Abluft ist ins Freie zu führen, Fremdeinrichtungen sind in Lüftungsleitungen unzulässig.",
   "anf": {
    "2": {
     "t": "betriebssicher und brandsicher; Abluft ins Freie; keine Fremdeinrichtungen in Lüftungsleitungen; nicht in Abgasanlagen einführen",
     "h": "Gilt entsprechend für raumlufttechnische Anlagen und Warmluftheizungen (§ 41 Abs. 6)."
    },
    "3": {
     "t": "betriebssicher und brandsicher; Abluft ins Freie; keine Fremdeinrichtungen in Lüftungsleitungen; nicht in Abgasanlagen einführen",
     "h": "Gilt entsprechend für raumlufttechnische Anlagen und Warmluftheizungen (§ 41 Abs. 6)."
    },
    "4": {
     "t": "betriebssicher und brandsicher; Abluft ins Freie; keine Fremdeinrichtungen in Lüftungsleitungen; nicht in Abgasanlagen einführen",
     "h": "Gilt entsprechend für raumlufttechnische Anlagen und Warmluftheizungen (§ 41 Abs. 6)."
    },
    "5": {
     "t": "betriebssicher und brandsicher; Abluft ins Freie; keine Fremdeinrichtungen in Lüftungsleitungen; nicht in Abgasanlagen einführen",
     "h": "Gilt entsprechend für raumlufttechnische Anlagen und Warmluftheizungen (§ 41 Abs. 6)."
    },
    "1a": {
     "t": "betriebssicher und brandsicher; Abluft ins Freie; keine Fremdeinrichtungen in Lüftungsleitungen; nicht in Abgasanlagen einführen",
     "h": "Gilt entsprechend für raumlufttechnische Anlagen und Warmluftheizungen (§ 41 Abs. 6)."
    },
    "1b": {
     "t": "betriebssicher und brandsicher; Abluft ins Freie; keine Fremdeinrichtungen in Lüftungsleitungen; nicht in Abgasanlagen einführen",
     "h": "Gilt entsprechend für raumlufttechnische Anlagen und Warmluftheizungen (§ 41 Abs. 6)."
    }
   },
   "hh": "unklar.",
   "rg": "§ 41 Abs. 1, 3, 4 und 6",
   "pos": "schacht",
   "auftritt": "gebaeude",
   "merksatz": "Lüftungsanlagen betriebs- und brandsicher; Abluft ins Freie; keine fremden Leitungen in Lüftungsleitungen.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "feuerung",
   "name": "Feuerungsanlagen und Abgasanlagen",
   "gruppe": "Technik",
   "kurz": "Feuerstätten und Abgasanlagen müssen betriebssicher und brandsicher sein. Behälter und Rohrleitungen für brennbare Gase und Flüssigkeiten ebenfalls.",
   "anf": {
    "2": {
     "t": "betriebssicher und brandsicher; Aufstellung nur, wenn keine Gefahren entstehen",
     "h": "Konkrete Abstände/Bauart regeln Feuerungsverordnungen der Länder (hier nicht geprüft)."
    },
    "3": {
     "t": "betriebssicher und brandsicher; Aufstellung nur, wenn keine Gefahren entstehen",
     "h": "Konkrete Abstände/Bauart regeln Feuerungsverordnungen der Länder (hier nicht geprüft)."
    },
    "4": {
     "t": "betriebssicher und brandsicher; Aufstellung nur, wenn keine Gefahren entstehen",
     "h": "Konkrete Abstände/Bauart regeln Feuerungsverordnungen der Länder (hier nicht geprüft)."
    },
    "5": {
     "t": "betriebssicher und brandsicher; Aufstellung nur, wenn keine Gefahren entstehen",
     "h": "Konkrete Abstände/Bauart regeln Feuerungsverordnungen der Länder (hier nicht geprüft)."
    },
    "1a": {
     "t": "betriebssicher und brandsicher; Aufstellung nur, wenn keine Gefahren entstehen",
     "h": "Konkrete Abstände/Bauart regeln Feuerungsverordnungen der Länder (hier nicht geprüft)."
    },
    "1b": {
     "t": "betriebssicher und brandsicher; Aufstellung nur, wenn keine Gefahren entstehen",
     "h": "Konkrete Abstände/Bauart regeln Feuerungsverordnungen der Länder (hier nicht geprüft)."
    }
   },
   "hh": "unklar.",
   "rg": "§ 42 Abs. 1 bis 4",
   "pos": "schacht",
   "auftritt": "gebaeude",
   "unklar": true,
   "merksatz": "Feuerstätten und Abgasanlagen betriebs- und brandsicher; Details regelt das Landesrecht (Feuerungsverordnung).",
   "quelle": "MBO"
  },
  {
   "id": "abfallraum",
   "name": "Räume für feste Abfallstoffe (GK 3 bis 5)",
   "gruppe": "Technik",
   "kurz": "In Gebäuden der GK 3 bis 5 dürfen feste Abfallstoffe nur in besonderen Räumen aufbewahrt werden. Diese Räume sind brandschutztechnisch abgeschlossen.",
   "anf": {
    "2": {
     "t": "keine besondere Anforderung"
    },
    "3": {
     "t": "Trennwände und Decken wie tragende Wände; Öffnungen feuerhemmend, dicht- und selbstschließend (T30-DS); vom Freien entleerbar; ständige Lüftung"
    },
    "4": {
     "t": "wie GK 3"
    },
    "5": {
     "t": "wie GK 3"
    },
    "1a": {
     "t": "keine besondere Anforderung"
    },
    "1b": {
     "t": "keine besondere Anforderung"
    }
   },
   "hh": "Lernseite: T30-DS, wie GK 3 bis 5 (Aufbewahrung fester Abfallstoffe).",
   "rg": "§ 45",
   "pos": "trennwand",
   "auftritt": "gebaeude",
   "merksatz": "Abfallraum ab GK 3: Wände und Decken wie das Tragwerk, Tür T30-DS, vom Freien entleerbar, ständig belüftet.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "blitzschutz",
   "name": "Blitzschutzanlage",
   "gruppe": "Technik",
   "kurz": "Bauliche Anlagen, bei denen Blitzschlag leicht eintreten oder schwere Folgen haben kann, brauchen eine dauernd wirksame Blitzschutzanlage.",
   "anf": {
    "2": {
     "t": "nach Lage, Bauart oder Nutzung",
     "h": "Keine Gebäudeklassen-Abstufung im MBO."
    },
    "3": {
     "t": "nach Lage, Bauart oder Nutzung",
     "h": "Keine Gebäudeklassen-Abstufung im MBO."
    },
    "4": {
     "t": "nach Lage, Bauart oder Nutzung",
     "h": "Keine Gebäudeklassen-Abstufung im MBO."
    },
    "5": {
     "t": "nach Lage, Bauart oder Nutzung",
     "h": "Keine Gebäudeklassen-Abstufung im MBO."
    },
    "1a": {
     "t": "nach Lage, Bauart oder Nutzung",
     "h": "Keine Gebäudeklassen-Abstufung im MBO."
    },
    "1b": {
     "t": "nach Lage, Bauart oder Nutzung",
     "h": "Keine Gebäudeklassen-Abstufung im MBO."
    }
   },
   "hh": "unklar.",
   "rg": "§ 46",
   "pos": "dach",
   "auftritt": "gebaeude",
   "merksatz": "Blitzschutz richtet sich nach Lage, Bauart und Nutzung, nicht nach der Gebäudeklasse.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "rauchwarnmelder",
   "name": "Rauchwarnmelder in Wohnungen",
   "gruppe": "Technik",
   "kurz": "In Wohnungen brauchen Schlafräume, Kinderzimmer und Flure, die zu Aufenthaltsräumen führen, jeweils mindestens einen Rauchwarnmelder.",
   "anf": {
    "2": {
     "t": "mind. 1 Rauchwarnmelder je Schlafraum, Kinderzimmer und Flur zu Aufenthaltsräumen"
    },
    "3": {
     "t": "mind. 1 Rauchwarnmelder je Schlafraum, Kinderzimmer und Flur zu Aufenthaltsräumen"
    },
    "4": {
     "t": "mind. 1 Rauchwarnmelder je Schlafraum, Kinderzimmer und Flur zu Aufenthaltsräumen"
    },
    "5": {
     "t": "mind. 1 Rauchwarnmelder je Schlafraum, Kinderzimmer und Flur zu Aufenthaltsräumen"
    },
    "1a": {
     "t": "mind. 1 Rauchwarnmelder je Schlafraum, Kinderzimmer und Flur zu Aufenthaltsräumen"
    },
    "1b": {
     "t": "mind. 1 Rauchwarnmelder je Schlafraum, Kinderzimmer und Flur zu Aufenthaltsräumen"
    }
   },
   "hh": "Rauchwarnmelder mit Netzstromversorgung in den Nutzungseinheiten (MHHR, laut Lernseite).",
   "rg": "§ 48 Abs. 4",
   "pos": "flur",
   "auftritt": "geschoss",
   "merksatz": "Rauchwarnmelder in Schlafräumen, Kinderzimmern und Fluren zu Aufenthaltsräumen jeder Wohnung.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "baustoffklassen",
   "name": "Brandverhalten von Baustoffen",
   "gruppe": "Bauprodukte",
   "kurz": "Baustoffe sind nichtbrennbar, schwerentflammbar oder normalentflammbar. Leichtentflammbare Baustoffe dürfen nicht verwendet werden.",
   "anf": {
    "2": {
     "t": "mindestens normalentflammbar; leichtentflammbar nur in Verbindung mit anderen Baustoffen nicht leichtentflammbar",
     "h": "Europäische Klassen (A1/A2, B, C ...) und Zuordnung stehen in der MVV TB, nicht im MBO-Text."
    },
    "3": {
     "t": "mindestens normalentflammbar; leichtentflammbar nur in Verbindung mit anderen Baustoffen nicht leichtentflammbar",
     "h": "Europäische Klassen (A1/A2, B, C ...) und Zuordnung stehen in der MVV TB, nicht im MBO-Text."
    },
    "4": {
     "t": "mindestens normalentflammbar; leichtentflammbar nur in Verbindung mit anderen Baustoffen nicht leichtentflammbar",
     "h": "Europäische Klassen (A1/A2, B, C ...) und Zuordnung stehen in der MVV TB, nicht im MBO-Text."
    },
    "5": {
     "t": "mindestens normalentflammbar; leichtentflammbar nur in Verbindung mit anderen Baustoffen nicht leichtentflammbar",
     "h": "Europäische Klassen (A1/A2, B, C ...) und Zuordnung stehen in der MVV TB, nicht im MBO-Text."
    },
    "1a": {
     "t": "mindestens normalentflammbar; leichtentflammbar nur in Verbindung mit anderen Baustoffen nicht leichtentflammbar",
     "h": "Europäische Klassen (A1/A2, B, C ...) und Zuordnung stehen in der MVV TB, nicht im MBO-Text."
    },
    "1b": {
     "t": "mindestens normalentflammbar; leichtentflammbar nur in Verbindung mit anderen Baustoffen nicht leichtentflammbar",
     "h": "Europäische Klassen (A1/A2, B, C ...) und Zuordnung stehen in der MVV TB, nicht im MBO-Text."
    }
   },
   "hh": "wie GK 5.",
   "rg": "§ 26 Abs. 1",
   "pos": "wand-tragend",
   "auftritt": "gebaeude",
   "merksatz": "Baustoffe: nichtbrennbar, schwerentflammbar, normalentflammbar. Leichtentflammbar ist verboten.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "bauteilklassen",
   "name": "Feuerwiderstandsfähigkeit und Brandverhalten von Bauteilen",
   "gruppe": "Bauprodukte",
   "kurz": "Bauteile sind feuerbeständig, hochfeuerhemmend oder feuerhemmend. Zusätzlich wird das Brandverhalten ihrer Baustoffe unterschieden.",
   "anf": {
    "2": {
     "t": "feuerhemmend / hochfeuerhemmend / feuerbeständig; feuerbeständig mind. Bauart 2 (nichtbrennbar mit durchgehender nichtbrennbarer Schicht), hochfeuerhemmend mind. Bauart 3 (brennbar mit Brandschutzbekleidung)",
     "h": "Zuordnung zu REI 30/60/90 und R/E/I-Kennzeichnung über Technische Baubestimmungen (nicht MBO-Text)."
    },
    "3": {
     "t": "feuerhemmend / hochfeuerhemmend / feuerbeständig; feuerbeständig mind. Bauart 2 (nichtbrennbar mit durchgehender nichtbrennbarer Schicht), hochfeuerhemmend mind. Bauart 3 (brennbar mit Brandschutzbekleidung)",
     "h": "Zuordnung zu REI 30/60/90 und R/E/I-Kennzeichnung über Technische Baubestimmungen (nicht MBO-Text)."
    },
    "4": {
     "t": "feuerhemmend / hochfeuerhemmend / feuerbeständig; feuerbeständig mind. Bauart 2 (nichtbrennbar mit durchgehender nichtbrennbarer Schicht), hochfeuerhemmend mind. Bauart 3 (brennbar mit Brandschutzbekleidung)",
     "h": "Zuordnung zu REI 30/60/90 und R/E/I-Kennzeichnung über Technische Baubestimmungen (nicht MBO-Text)."
    },
    "5": {
     "t": "feuerhemmend / hochfeuerhemmend / feuerbeständig; feuerbeständig mind. Bauart 2 (nichtbrennbar mit durchgehender nichtbrennbarer Schicht), hochfeuerhemmend mind. Bauart 3 (brennbar mit Brandschutzbekleidung)",
     "h": "Zuordnung zu REI 30/60/90 und R/E/I-Kennzeichnung über Technische Baubestimmungen (nicht MBO-Text)."
    },
    "1a": {
     "t": "feuerhemmend / hochfeuerhemmend / feuerbeständig; feuerbeständig mind. Bauart 2 (nichtbrennbar mit durchgehender nichtbrennbarer Schicht), hochfeuerhemmend mind. Bauart 3 (brennbar mit Brandschutzbekleidung)",
     "h": "Zuordnung zu REI 30/60/90 und R/E/I-Kennzeichnung über Technische Baubestimmungen (nicht MBO-Text)."
    },
    "1b": {
     "t": "feuerhemmend / hochfeuerhemmend / feuerbeständig; feuerbeständig mind. Bauart 2 (nichtbrennbar mit durchgehender nichtbrennbarer Schicht), hochfeuerhemmend mind. Bauart 3 (brennbar mit Brandschutzbekleidung)",
     "h": "Zuordnung zu REI 30/60/90 und R/E/I-Kennzeichnung über Technische Baubestimmungen (nicht MBO-Text)."
    }
   },
   "hh": "wie GK 5.",
   "rg": "§ 26 Abs. 2 und 3",
   "pos": "wand-tragend",
   "auftritt": "gebaeude",
   "merksatz": "Feuerbeständig mindestens mit nichtbrennbarer Schicht; hochfeuerhemmend darf brennbar sein, wenn allseitig mit nichtbrennbarer Brandschutzbekleidung gekleidet.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "bauteile_brennbar",
   "name": "Brennbare Bauteile (Holzbau) bei F90/F60-Anforderung",
   "gruppe": "Bauprodukte",
   "kurz": "Abweichend sind feuerbeständige oder hochfeuerhemmende Bauteile aus brennbaren Baustoffen zulässig, wenn sie den Technischen Baubestimmungen entsprechen.",
   "anf": {
    "2": {
     "t": "zulässig nach Technischen Baubestimmungen (§ 85a); nicht für Brandwände und Wände von Treppenräumen in Brandwand-Bauart",
     "h": "Konkrete Bauweise (z. B. Holzbau-Richtlinie) nicht im MBO-Text."
    },
    "3": {
     "t": "zulässig nach Technischen Baubestimmungen (§ 85a); nicht für Brandwände und Wände von Treppenräumen in Brandwand-Bauart",
     "h": "Konkrete Bauweise (z. B. Holzbau-Richtlinie) nicht im MBO-Text."
    },
    "4": {
     "t": "zulässig nach Technischen Baubestimmungen (§ 85a); nicht für Brandwände und Wände von Treppenräumen in Brandwand-Bauart",
     "h": "Konkrete Bauweise (z. B. Holzbau-Richtlinie) nicht im MBO-Text."
    },
    "5": {
     "t": "zulässig nach Technischen Baubestimmungen (§ 85a); nicht für Brandwände und Wände von Treppenräumen in Brandwand-Bauart",
     "h": "Konkrete Bauweise (z. B. Holzbau-Richtlinie) nicht im MBO-Text."
    },
    "1a": {
     "t": "zulässig nach Technischen Baubestimmungen (§ 85a); nicht für Brandwände und Wände von Treppenräumen in Brandwand-Bauart",
     "h": "Konkrete Bauweise (z. B. Holzbau-Richtlinie) nicht im MBO-Text."
    },
    "1b": {
     "t": "zulässig nach Technischen Baubestimmungen (§ 85a); nicht für Brandwände und Wände von Treppenräumen in Brandwand-Bauart",
     "h": "Konkrete Bauweise (z. B. Holzbau-Richtlinie) nicht im MBO-Text."
    }
   },
   "hh": "unklar.",
   "rg": "§ 26 Abs. 2 S. 4 und 5",
   "pos": "wand-tragend",
   "auftritt": "gebaeude",
   "unklar": true,
   "merksatz": "Holzbau mit F60 oder F90 ist über die Technischen Baubestimmungen möglich, nicht aber als Brandwand.",
   "quelle": "MBO"
  },
  {
   "id": "daemmstoffe",
   "name": "Dämmstoffe: Übersicht nach Einbauort",
   "gruppe": "Bauprodukte",
   "kurz": "Welche Dämmstoffe zulässig sind, hängt vom Einbauort ab: Außenwand, Treppenraum, Flur, Lüftungsleitung, Gebäudeabschlusswand.",
   "anf": {
    "2": {
     "t": "Außenwand: keine Anforderung",
     "h": "Gebäudeabschlusswand-Bekleidung einschließlich Dämmstoffen nichtbrennbar (gilt in allen Klassen, wo Brandwand nötig)."
    },
    "3": {
     "t": "Außenwand: keine (Abs. 3 gilt nicht); Treppenraum, Flur, Lüftungsleitung: nichtbrennbar",
     "h": "Gebäudeabschlusswand-Bekleidung einschließlich Dämmstoffen nichtbrennbar (gilt in allen Klassen, wo Brandwand nötig)."
    },
    "4": {
     "t": "Außenwand: schwerentflammbar; Treppenraum, Flur, Lüftung: nichtbrennbar; Abschlusswand-Fassade: nichtbrennbar",
     "h": "Gebäudeabschlusswand-Bekleidung einschließlich Dämmstoffen nichtbrennbar (gilt in allen Klassen, wo Brandwand nötig)."
    },
    "5": {
     "t": "Außenwand: schwerentflammbar; Treppenraum, Flur, Lüftung: nichtbrennbar; Abschlusswand-Fassade: nichtbrennbar",
     "h": "Gebäudeabschlusswand-Bekleidung einschließlich Dämmstoffen nichtbrennbar (gilt in allen Klassen, wo Brandwand nötig)."
    },
    "1a": {
     "t": "Außenwand: keine Anforderung",
     "h": "Gebäudeabschlusswand-Bekleidung einschließlich Dämmstoffen nichtbrennbar (gilt in allen Klassen, wo Brandwand nötig)."
    },
    "1b": {
     "t": "Außenwand: keine Anforderung",
     "h": "Gebäudeabschlusswand-Bekleidung einschließlich Dämmstoffen nichtbrennbar (gilt in allen Klassen, wo Brandwand nötig)."
    }
   },
   "hh": "wie GK 5; MHHR ergänzend.",
   "rg": "§ 28 Abs. 3; § 30 Abs. 7 S. 3; § 35 Abs. 5; § 36 Abs. 6; § 41 Abs. 2",
   "pos": "wand-aussen",
   "auftritt": "gebaeude",
   "merksatz": "Dämmstoffe: Fassade ab GK 4 schwerentflammbar, in Treppenraum, Flur und Lüftung nichtbrennbar, an Gebäudeabschlusswänden nichtbrennbar.",
   "quelle": "MBO",
   "unklar": false
  },
  {
   "id": "hochhaus_hinweis",
   "name": "Hochhaus (Höhe > 22 m): Hinweis auf die MHHR",
   "gruppe": "Sonderbau",
   "kurz": "Gebäude mit Fußbodenoberkante des obersten Aufenthaltsgeschosses über 22 m sind Hochhäuser und Sonderbauten. Die MBO regelt sie nur als Tatbestand, die Anforderungen stehen in der Muster-Hochhaus-Richtlinie.",
   "anf": {
    "2": {
     "t": "nicht einschlägig",
     "h": "Aufzug ohne eigenen Schacht im Treppenraum bei Hochhäusern unzulässig (§ 39 Abs. 1 S. 3 Nr. 1). Werte der MHHR (F90, F120 über 60 m, Sicherheitstreppenräume, Feuerwehraufzug, Löschanlage) stammen aus der Lernseite, nicht aus der MBO."
    },
    "3": {
     "t": "nicht einschlägig",
     "h": "Aufzug ohne eigenen Schacht im Treppenraum bei Hochhäusern unzulässig (§ 39 Abs. 1 S. 3 Nr. 1). Werte der MHHR (F90, F120 über 60 m, Sicherheitstreppenräume, Feuerwehraufzug, Löschanlage) stammen aus der Lernseite, nicht aus der MBO."
    },
    "4": {
     "t": "nicht einschlägig",
     "h": "Aufzug ohne eigenen Schacht im Treppenraum bei Hochhäusern unzulässig (§ 39 Abs. 1 S. 3 Nr. 1). Werte der MHHR (F90, F120 über 60 m, Sicherheitstreppenräume, Feuerwehraufzug, Löschanlage) stammen aus der Lernseite, nicht aus der MBO."
    },
    "5": {
     "t": "GK 5 nach MBO, bei Höhe > 22 m zusätzlich Sonderbau: MHHR",
     "h": "Aufzug ohne eigenen Schacht im Treppenraum bei Hochhäusern unzulässig (§ 39 Abs. 1 S. 3 Nr. 1). Werte der MHHR (F90, F120 über 60 m, Sicherheitstreppenräume, Feuerwehraufzug, Löschanlage) stammen aus der Lernseite, nicht aus der MBO."
    },
    "1a": {
     "t": "nicht einschlägig",
     "h": "Aufzug ohne eigenen Schacht im Treppenraum bei Hochhäusern unzulässig (§ 39 Abs. 1 S. 3 Nr. 1). Werte der MHHR (F90, F120 über 60 m, Sicherheitstreppenräume, Feuerwehraufzug, Löschanlage) stammen aus der Lernseite, nicht aus der MBO."
    },
    "1b": {
     "t": "nicht einschlägig",
     "h": "Aufzug ohne eigenen Schacht im Treppenraum bei Hochhäusern unzulässig (§ 39 Abs. 1 S. 3 Nr. 1). Werte der MHHR (F90, F120 über 60 m, Sicherheitstreppenräume, Feuerwehraufzug, Löschanlage) stammen aus der Lernseite, nicht aus der MBO."
    }
   },
   "hh": "Tragende Bauteile F90 und nichtbrennbar (über 60 m F120); Treppenraumwände F90/F120; Trennwände NE und Flure F30; Rettungsweg 35 m, Stichflur 15 m (alle laut Lernseite/MHHR).",
   "rg": "§ 2 Abs. 4 Nr. 1; § 39 Abs. 1 S. 3 Nr. 1",
   "pos": "wand-tragend",
   "auftritt": "gebaeude",
   "unklar": true,
   "quelle": "Lernseite",
   "merksatz": "Über 22 m: Hochhaus, Sonderbau. Die Anforderungen stehen in der Muster-Hochhaus-Richtlinie, nicht in der MBO."
  }
 ],
 "abweichungen": [],
 "luecken": [
  "Gebäudeklassen-Einteilung (§ 2 Abs. 3): Ermittlungsregel, kein Bauteil; in gk.js bereits als classify() abgebildet.",
  "Sonderbauten außer Hochhaus (§ 2 Abs. 4 Nr. 2 bis 20, § 51): Verkaufsstätten, Versammlungsstätten, Garagen usw. regeln Sonderbauverordnungen; für Standardgebäude nicht relevant.",
  "Generalklausel (§ 14): Schutzziel ohne Bauteilwert; dient als Rechtsgrundlage der Einträge.",
  "Abstandsflächen und Brandschutz (§ 6 Abs. 1 S. 2, § 6 Abs. 5 bis 6): städtebaulich/Abstandsrecht, nicht Bauteilkatalog. Ausnahme: Wohngebäude GK 1/2 mit 3 m Tiefe nicht aufgenommen.",
  "Verwendbarkeit und Übereinstimmung von Bauprodukten (§§ 16a bis 25): Nachweisverfahren, keine Bauteilwerte.",
  "Umwehrungen (§ 38): Absturzsicherung, nicht vorbeugender Brandschutz. Ausnahme Treppen/Brüstungen nicht einzeln aufgenommen.",
  "Fensterreinigung, Glastüren-Kennzeichnung, Wohnungseingangstür-Breite (§ 37 Abs. 1 bis 3): kein Brandschutz.",
  "Aufenthaltsräume, Wohnungsbau (§§ 47, 48 Abs. 1 bis 3): nur § 48 Abs. 4 (Rauchwarnmelder) aufgenommen.",
  "Sanitäre Anlagen, Kleinkläranlagen, Stellplätze, Barrierefreiheit (§§ 43, 44, 49, 50): nicht brandschutzrelevant.",
  "Dacharbeiten-Sicherung (§ 32 Abs. 8): Arbeitssicherheit, kein Brandschutz.",
  "Dachausbau zu Wohnraum / Bestandsfälle (§ 30 Abs. 5 S. 3 und 4, § 39 Abs. 4 S. 1 Halbsatz 2): Bestandsregel, nur im Hinweis genannt.",
  "Hochhaus-Detailwerte (Sicherheitstreppenraum, Feuerwehraufzug, Löschanlage, Druckbelüftung, ELA): stehen in der MHHR, nicht im MBO; Katalog nur Hinweiseintrag (hochhaus_hinweis) und Feld \"hh\".",
  "T90-RS: der Begriff steht nicht im MBO-Text. Das MBO verlangt \"feuerbeständig, dicht- und selbstschließend\" (Brandwandöffnungen); T90-RS ist Sonderbaurecht (Lernseite: Versammlungsstätten u. a.).",
  "Brandschutzklappen und Schottsysteme: Typen und Prüfzeugnisse nicht im MBO; nur \"Vorkehrungen\" gegen Brandausbreitung (§ 40, § 41).",
  "Kellerersatzräume: im MBO nicht geregelt (nur § 48 Abs. 2: Abstellräume für Kinderwagen, Mobilitätshilfen, Fahrräder in GK 3 bis 5). Kein Eintrag.",
  "Flächen für die Feuerwehr (Maße der Aufstellflächen), Löschwasserversorgung: nicht im MBO; Eintrag aufstellflaeche als unklar.",
  "Rettungswegbreiten und Mindestmaße: nicht im MBO; in flur_breite_stufen als unklar geführt.",
  "Elektrische Anlagen, Brandmeldeanlagen, Sprinkler, Rauchabzugsanlagen (technische Brandschutzanlagen): nicht in §§ 26 bis 41; stehen in Sonderbauverordnungen/MHHR. Nur Rauchableitung nach § 35 Abs. 8, § 37 Abs. 4, § 39 Abs. 3 aufgenommen.",
  "Rauchabschnitte im Dachraum, Brandüberschlag-Maße (Abstand zwischen Öffnungen): keine Zahlen im MBO; aw_brandueberschlag als unklar."
 ]
};
