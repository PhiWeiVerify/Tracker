# Website Marienhaus St. Johann e.V.

Statische Website: HTML, CSS, ~9 KB Vanilla-JavaScript. Kein Build, kein CMS, keine Datenbank, keine Drittanbieter.

**Features:** Aurora-Hero (Canvas, ¼-Auflösung, 30 fps, pausiert außerhalb des Viewports), Seitenübergänge per View Transitions API, Live-Anzeige freier Plätze, Pflegekosten-Rechner (Eigenanteil inkl. § 43c SGB XI), interaktive SVG-Standortkarte, Dark Mode, Schriftgrößen-Umschalter, Scroll-Reveals. `prefers-reduced-motion` schaltet alle Animationen ab.

## Struktur

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite |
| `einrichtungen.html` | Wohnheim St. Johann, St. Marienhaus, Stahlbad St. Antonius |
| `tagespflege.html` | Tagespflege Wiehre |
| `ueber-uns.html` | Verein, Auftrag, Vorstand |
| `karriere.html` | Stellen, Ausbildung, Freiwilligendienst |
| `spenden.html` | Marienhaus-Stiftung, Spendenkonto, Ehrenamt |
| `kosten.html` | Kostenrechner + Erklärung Heimentgelt |
| `kontakt.html` | Ansprechpartner, Karte |
| `impressum.html`, `datenschutz.html` | Pflichtangaben (Entwürfe) |
| `assets/data.js` | **Von der Verwaltung pflegbar:** freie Plätze, Kostensätze, Leistungsbeträge |
| `assets/style.css`, `assets/main.js` | Designsystem, Interaktion |
| `assets/fonts/` | Fraunces + Inter (OFL), lokal gehostet |

Lokal ansehen: `python3 -m http.server` im Ordner, dann http://localhost:8000 (per `file://` blockiert der Browser die Schriften).

## Vor dem Livegang (Pflicht)

1. **Alle Platzhalter ersetzen** – sie sind gelb markiert. Finden mit:
   `grep -n 'class="todo"' *.html`
2. **`assets/data.js` mit echten Werten füllen** – Kostensätze sind aktuell BEISPIELWERTE, die Platzanzeige ist fiktiv. Mit Beispielwerten live zu gehen wäre irreführend (Heimrecht/UWG).
   Die Platzanzeige nur aktivieren, wenn jemand sie verbindlich wöchentlich pflegt – sonst entfernen.
3. **Fakten prüfen.** Die Inhalte stammen aus öffentlichen Verzeichnissen (Stand teils 2021):
   Platzzahlen (82 / 38), Adressen inkl. PLZ (Kirchstr. 13, Talstr. 29/31, Sonnenbergstr. 2), Trägerschaft.
4. **Impressum & Datenschutz** von Vorstand bzw. Datenschutzbeauftragtem freigeben lassen.
   Katholischer Träger → vermutlich **KDG** statt DSGVO als Rechtsgrundlage.
5. **Logo & Bilder:** Das Signet ist ein Platzhalter – offizielles Vereinslogo einsetzen. Bilder nur mit schriftlicher Einwilligung abgebildeter Bewohner:innen/Mitarbeitender (KUG/DSGVO bzw. KDG).
   Ablage in `assets/img/`, als WebP, max. ~200 KB, immer mit `alt`-Text.

## Hosting

Beliebiger Webspace (z. B. Hoster der bisherigen Domain, deutsches Rechenzentrum bevorzugt, AV-Vertrag abschließen).
Einfach den Ordnerinhalt hochladen. GitHub Pages ist technisch möglich, aber US-Anbieter → für einen
Pflegeträger datenschutzrechtlich die schlechtere Wahl.

## Bewusste Entscheidungen

- **Kein Kontaktformular:** bräuchte Backend, Spam-Schutz und eine Datenschutz-Prüfung; Zielgruppe ruft ohnehin an.
- **Keine Google Fonts / Maps / Analytics:** keine Drittanbieter = kein Cookie-Banner nötig.
- **Große Basisschrift (18 px), Umschalter auf ~21 px, Skip-Link, Fokusrahmen:** Zielgruppe Senior:innen.
