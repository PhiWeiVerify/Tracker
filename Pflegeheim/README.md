# Mein Tag – Tablet-App für Pflegeheimbewohner

Prototyp (MVP) für ein fest zugeordnetes Tablet im Bewohnerzimmer.

## Funktionen

| Bereich | Zweck |
|---|---|
| **Heute** | Orientierung: Wochentag, Datum, Uhrzeit, Tageszeit, Jahreszeit, „Jetzt“ / „Als Nächstes“ |
| **Tagesplan** | Termine des Tages (wiederkehrend nach Wochentag), aktueller Termin hervorgehoben |
| **Familie** | Kontakte mit Foto, großer Anruf-/Video-Button |
| **Wie geht's?** | Befindlichkeits-Abfrage (3 Stufen), bei „Nicht gut“ Hinweis auf die Klingel |
| **Betreuung** (PIN) | Plan, Kontakte, Befindens-Verlauf (14 Tage), Anrede, Schriftgröße, PIN, Export, Reset |

Bedienprinzipien: Basisschrift ≥ 20 px, Buttons ≥ 64 px, keine Wischgesten, Text statt reiner Symbole,
„Sie“-Ansprache, nach 2 Min Inaktivität zurück auf „Heute“, Bildschirm bleibt an (Wake Lock, wo unterstützt).

## Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # statische Dateien in dist/
```

Standard-PIN Betreuung: **1234** (App warnt, bis sie geändert ist).

## Bewusste Grenzen – vor einem Echteinsatz lesen

- **Kein Notruf.** Die App löst keinen Alarm aus und ersetzt nicht die Rufanlage. Das ist Absicht:
  Ein Notruf-Feature, das nicht garantiert zugestellt wird, ist gefährlicher als keines.
- **Nur lokale Speicherung** (localStorage). Kein Server, keine Synchronisation, kein Backup.
  Browserdaten löschen = Daten weg. Bei Bewohnerwechsel: *Einstellungen → Alles zurücksetzen*.
- **PIN ist kein Sicherheitsmechanismus**, nur eine Bediensperre. Wer das Gerät hat, kommt an die Daten.
  → Gerät per MDM/Kiosk-Modus absichern (z. B. Android „App anpinnen“, iPad „Geführter Zugriff“).
- **Befindlichkeit = Gesundheitsdatum** (Art. 9 DSGVO). Für den Einsatz im Heim braucht es
  Einwilligung bzw. Rechtsgrundlage, Eintrag im Verarbeitungsverzeichnis, ggf. DSFA.
  Es ist ausdrücklich **keine Pflegedokumentation**.
- **Kein Medizinprodukt** – die App diagnostiziert, überwacht und bewertet nichts.
  Wer daraus Alarme oder Auswertungen ableitet, rutscht potenziell in die MDR.
- **„Anrufen“** nutzt `tel:` und funktioniert nur auf Geräten mit Telefonie (bzw. verbundenem Handy).
  Für reine WLAN-Tablets einen Video-Link (https) hinterlegen.
- Fotos werden auf 240×240 px verkleinert; localStorage hat je nach Browser ~5 MB.

## Nächste sinnvolle Schritte

1. Test mit 3–5 Bewohnern (inkl. leichter Demenz) und Personal – Bedienbarkeit messen, nicht annehmen.
2. Zentrale Pflege des Tagesplans für alle Geräte (Backend + Gerätemanagement) – sonst skaliert der Pflegeaufwand nicht.
3. PWA/Kiosk-Installation, Offline-Fähigkeit.
