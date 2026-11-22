---
id: getallenpad
title: Getallenpad-puzzel toevoegen aan PuzzleFest
status: in_progress
created: 2026-11-22T11:00:00Z
---

# Intent: Getallenpad-puzzel

## Goal

Een derde speltype naast woordzoeker en woordslang: het **getallenpad**, een getallenpuzzel in Hidato-stijl. De speler krijgt een raster waarin een deel van de getallen al staat en vult de rest aan, zodat 1 tot en met N één aaneengesloten pad vormt dat elke cel precies één keer bezoekt.

## Users

- PuzzleFest-spelers (desktop en mobiel/PWA).
- Beheerder (Robin), die puzzels genereert en per moeilijkheidsgraad publiceert.

## Problem

PuzzleFest heeft alleen woordpuzzels. Een getallenpuzzel spreekt een ander publiek aan. Dit type hergebruikt het rastermodel en de padselectie van de woordslang, waardoor de marginale bouwkost laag blijft.

## Spelregels

- Raster standaard 7×7 (N = 49), configureerbaar; rechthoekig toegestaan. Onregelmatige vormen / uitgesloten cellen: uitbreidbaar, niet in v1.
- Aangrenzend = 8 richtingen. Getal k+1 ligt aangrenzend aan k voor alle k in 1..N-1.
- Givens zijn vast; 1 en N zijn altijd gegeven.
- Invoer:
  - Slepen vanaf een cel met een getal over lege cellen nummert die oplopend (aflopend als je vanaf het hogere getal sleept).
  - Tikken op een lege cel + getal intikken (toetsenbord), vooral voor toegankelijkheid.
  - Een nummering die botst met een given wordt geweigerd, met visuele feedback.
  - Ongedaan maken.
- **Foutfeedback direct tijdens het spelen**: een ingevuld getal waarvan de buur k−1 of k+1 al geplaatst is maar niet aangrenzend ligt, wordt meteen gemarkeerd (niet pas bij een vol raster).
- Opgelost wanneer alle cellen gevuld zijn en het pad geldig is.

## Scope

### In scope
- **Domeinmodel**, strikt getypeerd: puzzel, givens, oplossing, spelerstoestand. Spelerstoestand gescheiden van de puzzeldefinitie.
- **Padgenerator**: willekeurig Hamiltonpad over het raster. Backtracking met Warnsdorff-heuristiek (gelijke stand: willekeurig volgens seed), deterministisch per seed, time-out + herstart, expliciete fout bij mislukken.
- **Solver**: DFS die oplossingen telt en stopt bij 2 (0 / 1 / meerdere). Snoei: afstand tussen opeenvolgende givens (Chebyshev-afstand ≤ waardeverschil) en flood fill op lege regio's. Rapporteert het aantal bezochte knopen.
- **Puzzelreductie**: vanaf het volledige pad getallen verwijderen in seed-volgorde zolang de solver precies 1 oplossing vindt. Doelpercentages givens: makkelijk ~40%, normaal ~30%, moeilijk ~20%.
- **Moeilijkheidsmetriek** (beslist): per puzzel worden zowel het percentage givens als de solver-metriek (bezochte knopen bij de uniciteitscheck) opgeslagen.
- **Validator**: unieke oplossing, givens komen overeen met de oplossing, geldig pad.
- **Publicatie**: vooraf gegenereerde puzzels als JSON in de repo, meegeleverd met de site; nooit live genereren tijdens het spelen.
- **Speelpagina** op basis van het gedeelde raster en de padselectie. Getalspecifieke rendering (givens onderscheiden, pad als lijn tussen opeenvolgende getallen, foutmarkering) zit in de getallenpad-module.
- **Beheerflow**: verborgen beheerpagina (alleen `npm run dev`), zoals bij woordslang: afmetingen + moeilijkheid → genereren (eventueel batch) → voorbeeld → JSON kopiëren/downloaden om aan de repo toe te voegen.

### Buiten scope (later)
- Onregelmatige rastervormen of rasters met gaten.
- Hints ("toon de volgende cel na k").
- Timer, scores, dagpuzzels.

## Success Criteria

- 7×7: generator + reductie leveren binnen 5 s een unieke puzzel in ≥ 95% van de runs (gemeten op de Raspberry Pi).
- Elke gepubliceerde puzzel slaagt voor de validator, inclusief uniciteit, afgedwongen in CI.
- De drie moeilijkheidsgraden zijn merkbaar verschillend, gemeten met de opgeslagen metriek (givens-% én solver-knopen).
- Volledig speelbaar met muis, touch en toetsenbord.
- Woordzoeker en woordslang blijven ongewijzigd werken (alle bestaande tests groen).

## Constraints

- **Stack (zelfde beslissing als bij woordslang, wijkt af van het oorspronkelijke brief)**: React + TypeScript (strict), Vite PWA, Vitest + Testing Library in plaats van C#/.NET/Blazor/bUnit. Geen server; hosting blijft GitHub Pages. Geen `any` / stringly-typed coördinaten in domeinlogica.
- Geen extra packages voor wat het platform zelf kan.
- Verwachte fouten (geen pad binnen time-out, moeilijkheid niet haalbaar) als `Result` (`src/shared/result.ts`); excepties alleen voor bugs.
- Generatie en solving zijn CPU-gebonden: buiten de UI-thread (Web Worker of in stukken) en annuleerbaar (`AbortSignal`, het TS-equivalent van een `CancellationToken`).
- Eigen naam en vormgeving (getallenpad); geen namen, teksten of uiterlijk van bestaande commerciële spellen.

## Afhankelijkheid

- Intent `woordslang` is **completed**. Aanwezig in `src/shared/grid`: `Cell`, `isNeighbour`, `inGrid`, `cellIndex`, `pathSelection` (8-richtingen slepen/tikken), `usePathSelection`, `LetterGrid`.
- Nog niet gedeeld, op te lossen in dit intent:
  - `LetterGrid` rendert alleen letters (`rows: string[]`); de celinhoud moet generiek worden (bv. een render-prop), zonder de woordzoeker en woordslang te breken.
  - Flood fill / regio-labeling (`woordslang/logic/regions.ts`) en padvalidatie naar het gedeelde model verplaatsen.

## Beslissingen bij de open vragen

- **Foutfeedback**: direct tonen tijdens het spelen (2026-11-22).
- **Moeilijkheid**: givens-% stuurt de reductie; givens-% én solver-knopen worden opgeslagen (2026-11-22).
- **Opslag**: geen database. Eigen JSON-map per speltype (`src/puzzles/getallenpad/data/`), zoals bij woordslang. Spelersvoortgang in `localStorage`.

## Testen

- Padgenerator: geldig Hamiltonpad bij vaste seed, time-out-pad, herstartgedrag.
- Solver: bekende puzzels met 0, 1 en meerdere oplossingen; stopt bij de tweede oplossing; orakeltest snoei vs. zonder snoei op kleine rasters.
- Reductie: resultaat heeft altijd precies 1 oplossing; 1 en N blijven gegeven.
- Property-based: N willekeurige seeds → elke puzzel slaagt voor de validator.
- Testing Library: nummeren door slepen (oplopend en aflopend), botsing met given geweigerd, ongedaan maken, toetsenbordinvoer, directe foutmarkering.
- Alle gepubliceerde getallenpad-JSON's door de validator in de testsuite (CI).
- Regressie: bestaande woordzoeker- en woordslang-tests groen na het generaliseren van het raster.

## Notes

Decompositie-hints: (1) generiek raster + gedeelde pad/regio-utilities, (2) domeinmodel + validator, (3) padgenerator, (4) solver met telling en snoei, (5) reductie + moeilijkheid, (6) beheer + publicatie, (7) speelpagina + invoer, (8) regressie.
