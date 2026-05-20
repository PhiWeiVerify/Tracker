# TRACKER — Habit Tracker

Dein persönlicher Habit Tracker mit Streak-System, Belohnungen und Wochenstatistik.

## Features

- ✅ Tägliche Habits abhaken
- 📊 Wochenstatistik mit Heatmap
- 🏆 Belohnungen für Wochen-, Monats- und Jahresziele
- 🔥 Streak-Meilensteine pro Habit (z.B. 100 Tage nicht rauchen)
- 🎉 Konfetti-Feier beim App-Öffnen wenn Ziele erreicht
- 💾 Automatisches Speichern (localStorage)

## Setup

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Entwicklungsserver starten
npm run dev

# 3. App öffnen
# http://localhost:5173
```

## Build für Produktion

```bash
npm run build
```

Die fertige App liegt dann im `dist/` Ordner — kann direkt auf GitHub Pages, Netlify oder Vercel deployed werden.

## GitHub Pages Deploy

```bash
# 1. vite.config.js anpassen (base setzen):
# base: '/dein-repo-name/'

# 2. Build erstellen
npm run build

# 3. dist/ Ordner auf gh-pages Branch pushen
```

## Technologie

- React 18
- Vite 5
- localStorage für Datenpersistenz
- Keine externe Backend-Abhängigkeit
