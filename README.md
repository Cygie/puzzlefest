# PuzzleFest

Nederlandse puzzels als web-app die je op Android kunt installeren (PWA). De eerste puzzel is de **Woordzoeker**.

## Vereisten

- Node.js 20+ (aanbevolen: 22 LTS)
- npm 10+

## Installeren en starten

```bash
npm install
npm run dev
```

De dev-server luistert ook op het netwerk (`--host`). Open op je telefoon het adres dat Vite toont onder **Network**, bijvoorbeeld `http://192.168.1.20:5173`.

## Scripts

| Script                  | Wat het doet                                                  |
| ----------------------- | ------------------------------------------------------------- |
| `npm run dev`           | Dev-server met hot reload                                     |
| `npm run build`         | Typecheck + productie-build in `dist/` (incl. service worker) |
| `npm run preview`       | Productie-build lokaal serveren                               |
| `npm run lint`          | ESLint                                                        |
| `npm run format`        | Prettier                                                      |
| `npm test`              | Tests (Vitest)                                                |
| `npm run test:coverage` | Tests met coverage                                            |
| `npm run icons`         | PWA-iconen opnieuw genereren in `public/icons/`               |

## Installeren op Android

Een PWA is alleen installeerbaar via **HTTPS** (of `localhost`).

1. Bouw en host de app op een HTTPS-adres (bijv. een statische host), of test lokaal met `npm run build && npm run preview`.
2. Open de site in **Chrome** op Android.
3. Tik op het menu (⋮) → **App installeren** / **Toevoegen aan startscherm**.
4. PuzzleFest verschijnt als app op je startscherm en werkt daarna ook **offline**.

> Tip voor testen vanaf de Raspberry Pi zonder HTTPS: verbind de telefoon via USB, zet in Chrome `chrome://inspect` → _Port forwarding_ `5173 → localhost:5173` aan, en open `http://localhost:5173` op de telefoon.

## Projectstructuur

```
src/
├── app/                 # App-shell, navigatie (hash-routing)
├── puzzles/
│   └── woordzoeker/
│       ├── logic/       # Pure TypeScript: woorden, raster genereren
│       ├── components/  # React UI
│       └── data/        # Thema-woordenlijsten
├── shared/              # Herbruikbare onderdelen
└── main.tsx
```

## Ontwikkelproces

Dit project gebruikt [specs.md](https://specs.md) (FIRE-flow). Plannen, work items en run-verslagen staan in `.specs-fire/`.
