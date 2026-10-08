# Website Marienhaus St. Johann e.V.

Statische Website (reines HTML/CSS, ~2 KB JavaScript). Kein Build, kein CMS, keine Datenbank.

## Struktur

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite |
| `einrichtungen.html` | Wohnheim St. Johann, St. Marienhaus, Stahlbad St. Antonius |
| `tagespflege.html` | Tagespflege Wiehre |
| `ueber-uns.html` | Verein, Auftrag, Vorstand |
| `karriere.html` | Stellen, Ausbildung, Freiwilligendienst |
| `spenden.html` | Marienhaus-Stiftung, Spendenkonto, Ehrenamt |
| `kontakt.html` | Ansprechpartner |
| `impressum.html`, `datenschutz.html` | Pflichtangaben (Entwürfe) |
| `assets/style.css`, `assets/main.js` | Layout, Mobilmenü, Schriftgrößen-Umschalter |

Lokal ansehen: `index.html` im Browser öffnen oder `python3 -m http.server` im Ordner.

## Vor dem Livegang (Pflicht)

1. **Alle Platzhalter ersetzen** – sie sind gelb markiert. Finden mit:
   `grep -n 'class="todo"' *.html`
2. **Fakten prüfen.** Die Inhalte stammen aus öffentlichen Verzeichnissen (Stand teils 2021):
   Platzzahlen (82 / 38), Adressen inkl. PLZ (Kirchstr. 13, Talstr. 29/31, Sonnenbergstr. 2), Trägerschaft.
3. **Impressum & Datenschutz** von Vorstand bzw. Datenschutzbeauftragtem freigeben lassen.
   Katholischer Träger → vermutlich **KDG** statt DSGVO als Rechtsgrundlage.
4. **Bilder:** nur mit schriftlicher Einwilligung abgebildeter Bewohner:innen/Mitarbeitender (KUG/DSGVO bzw. KDG).
   Bilder nach `assets/img/`, als WebP, max. ~200 KB, immer mit `alt`-Text.

## Hosting

Beliebiger Webspace (z. B. Hoster der bisherigen Domain, deutsches Rechenzentrum bevorzugt, AV-Vertrag abschließen).
Einfach den Ordnerinhalt hochladen. GitHub Pages ist technisch möglich, aber US-Anbieter → für einen
Pflegeträger datenschutzrechtlich die schlechtere Wahl.

## Bewusste Entscheidungen

- **Kein Kontaktformular:** bräuchte Backend, Spam-Schutz und eine Datenschutz-Prüfung; Zielgruppe ruft ohnehin an.
- **Keine Google Fonts / Maps / Analytics:** keine Drittanbieter = kein Cookie-Banner nötig.
- **Große Basisschrift (18 px), Umschalter auf ~21 px, Skip-Link, Fokusrahmen:** Zielgruppe Senior:innen.
