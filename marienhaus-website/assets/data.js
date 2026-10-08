/* ==========================================================================
   PFLEGBARE DATEN – diese Datei kann die Verwaltung selbst bearbeiten.
   Nach jeder Änderung: speichern, hochladen, fertig. Kein Programmierwissen nötig.
   ========================================================================== */
window.MH_DATA = {

  // Stand der Platzanzeige (wird auf der Startseite angezeigt)
  stand: "TT.MM.JJJJ",

  // status: "frei" | "warteliste" | "belegt"
  plaetze: [
    { haus: "Wohnheim St. Johann",   status: "warteliste", text: "Warteliste" },
    { haus: "St. Marienhaus",        status: "warteliste", text: "Warteliste" },
    { haus: "Stahlbad St. Antonius", status: "frei",       text: "1 Platz frei" },
    { haus: "Tagespflege Wiehre",    status: "frei",       text: "Plätze frei (Di, Do)" }
  ],

  // Monatliche Kosten je Haus in Euro (30,42 Tage).
  // ACHTUNG: BEISPIELWERTE! Vor Livegang durch die aktuellen Pflegesatzwerte ersetzen.
  //   eee    = einrichtungseinheitlicher Eigenanteil (pflegebedingt, inkl. Ausbildungsumlage)
  //   uv     = Unterkunft und Verpflegung
  //   invest = Investitionskosten
  beispielwerte: true,
  kosten: {
    "st-johann":    { name: "Wohnheim St. Johann",   eee: 1650, uv: 1050, invest: 520 },
    "st-marienhaus":{ name: "St. Marienhaus",        eee: 1650, uv: 1050, invest: 520 },
    "st-antonius":  { name: "Stahlbad St. Antonius", eee: 1650, uv: 1100, invest: 560 }
  },

  // Leistungsbetrag der Pflegekasse vollstationär, § 43 SGB XI (Stand 2025 – jährlich prüfen)
  leistung: { 2: 805, 3: 1319, 4: 1855, 5: 2096 },

  // Leistungszuschlag auf den EEE nach Wohndauer, § 43c SGB XI (seit 01.01.2024)
  zuschlag: [
    { label: "bis 12 Monate",  pct: 0.15 },
    { label: "13–24 Monate",   pct: 0.30 },
    { label: "25–36 Monate",   pct: 0.50 },
    { label: "über 36 Monate", pct: 0.75 }
  ]
};
