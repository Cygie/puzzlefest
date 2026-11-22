---
id: woordslang
title: Woordslang-puzzel toevoegen aan PuzzleFest
status: completed
created: 2026-11-21T23:40:00Z
completed_at: 2026-11-22T08:44:28.102Z
---

# Intent: Woordslang-puzzel

## Goal

Een tweede speltype naast de woordzoeker: een **woordslang**-puzzel. De speler krijgt een volledig gevuld letterraster en een vage themahint en moet alle themawoorden vinden; samen bedekken die woorden elke cel van het raster precies één keer. Het spel hergebruikt het raster en de sleep-interactie van de woordzoeker, maar speelt fundamenteel anders: het thema moet worden afgeleid, het raster kan niet mechanisch worden afgescand.

## Users

- PuzzleFest-spelers (desktop en mobiel/PWA, Nederlandstalig).
- Beheerder (Robin), die puzzels per thema aanmaakt en publiceert.

## Spelregels

- Raster standaard 6 kolommen × 8 rijen (48 cellen), configureerbaar.
- Elk themawoord is een pad van aangrenzende cellen (8 richtingen); een pad mag op elk punt van richting veranderen. Binnen één woord wordt een cel maar één keer gebruikt.
- Woorden overlappen niet en bedekken samen het hele raster (geen opvulletters).
- Eén woord is het **sleutelwoord**: het benoemt het thema en raakt twee tegenoverliggende randen (links↔rechts of boven↔onder).
- Selecteren door te slepen of op opeenvolgende cellen te tikken. Een gevonden themawoord blijft gemarkeerd, het sleutelwoord in een eigen kleur.
- Opgelost wanneer alle cellen bij een gevonden woord horen.

## Scope

### In scope
- Domeinmodel: puzzel, raster, woordpad, sleutelwoord — strikt getypeerd (geen `any`, geen stringly-typed coördinaten).
- **Generator**: thema + sleutelwoord + kandidaat-woorden + afmetingen → volledige, geldige rasterbezetting. Backtracking pad voor pad, flood-fill-pruning (geen geïsoleerde cellen, regiogroottes haalbaar met resterende woordlengtes), stapbudget + time-out + herstarts met andere seed/volgorde, deterministisch per seed. Bij mislukken een expliciete fout, nooit een half raster.
- **Validator**: volledige dekking, geen overlap, aangrenzende paden, sleutelwoord raakt tegenoverliggende randen, totale woordlengte = aantal cellen.
- **Publicatie**: vooraf gegenereerde puzzels als JSON-bestanden in de repo; ze worden met de site meegeleverd en nooit live gegenereerd tijdens het spelen.
- **Speelpagina** met hergebruik van rastercomponent en selectie-interactie van de woordzoeker (eerst generaliseren waar die te specifiek is).
- **Beheerflow**: verborgen beheerpagina (alleen in `npm run dev`) — thema, sleutelwoord, woorden invoeren → genereren → resultaat bekijken → JSON kopiëren/downloaden om toe te voegen aan de repo.

### Buiten scope (later)
- Hint-systeem (vereist een volledige Nederlandse woordenlijst).
- Automatische woordsuggesties per thema.
- Dagpuzzels, scores, leaderboards.

## Success Criteria

- Generator: voor een realistische woordset (6–8 woorden, samen 48 letters) een geldige oplossing binnen 5 s in ≥ 90% van de gevallen (gemeten op de Raspberry Pi).
- Elke gepubliceerde puzzel slaagt voor de validator — afgedwongen in CI (een ongeldige puzzel kan niet live gaan).
- Een speler kan een puzzel volledig oplossen met muis en touch.
- Bestaande woordzoeker blijft ongewijzigd werken (alle bestaande tests groen).

## Constraints

- **Stack (beslist 2026-11-21, wijkt af van het oorspronkelijke brief)**: de bestaande PuzzleFest-stack — React + TypeScript (strict), Vite PWA, Vitest + Testing Library (in plaats van C#/.NET/Blazor/bUnit). Geen server: hosting blijft GitHub Pages.
- Geen extra packages voor wat het platform zelf kan.
- Verwachte fouten (geen oplossing, ongeldige invoer zoals woordlengte ≠ aantal cellen) als Result-type; excepties alleen voor echte bugs.
- Letters hoofdletter-ongevoelig, normalisatie gedeeld met de woordzoeker. **IJ = twee cellen (I + J)**, zoals in de woordzoeker.
- Eigen naam en vormgeving (woordslang / sleutelwoord); geen namen, teksten of uiterlijk van bestaande commerciële spellen.

## Beslissingen bij de open vragen

- **Herbruikbaarheid woordzoeker**: `PlayGrid` rendert het raster en vertaalt pointer-events, maar selectie is beperkt tot rechte lijnen (`selection.ts`). De rasterweergave en pointer-afhandeling worden gegeneraliseerd naar een gedeelde component; lijn- en padselectie worden aparte strategieën.
- **Opslag**: er is geen database — gepubliceerde puzzels zijn JSON in de repo; spelersvoortgang in `localStorage` (zoals bij de woordzoeker).
- **IJ**: twee cellen.

## Testen

- Generator: geldige output bij vaste seed, juiste fout bij onmogelijke invoer, gedrag bij budget/time-out.
- Validator: dekking, overlap, aangrenzendheid, randregel sleutelwoord.
- Fuzz: N willekeurige seeds → elke geslaagde generatie is geldig volgens de validator.
- Componenttests (Testing Library) voor de padselectie: geldig/ongeldig pad, reeds gevonden woord, tikken en slepen.
- Alle gepubliceerde puzzel-JSON's door de validator in de testsuite (CI).
