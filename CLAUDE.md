# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server (http://localhost:3000)
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — `next lint`

There is no test framework configured. Plain JavaScript (`.jsx`), no TypeScript. Path alias `@/*` resolves to repo root (see `jsconfig.json`).

## Architecture

This is a Next.js 14 App Router app with effectively **one screen**: `app/page.jsx` renders `components/InsulinOverlapApp.jsx`, a single ~1500-line `"use client"` component that contains the entire UI, the domain math, the food database, and the persistence layer. Most non-trivial changes happen inside that file — expect to scroll, and prefer reading the whole file before editing.

### Domain model (the math behind the UI)

The app's purpose is to plan rapid-acting insulin doses for meals by modeling **overlap** between insulin activity and carb absorption curves:

- **Insulin activity** — `iobFraction(elapsedMin, dia)` and `insulinActivityRate(elapsedMin, dia)` model insulin-on-board as a power-law decay (`(1 - t/DIA)^1.5`) over a configurable DIA (duration of insulin action, default 4 hr).
- **Carb absorption** — `carbRate(t, profile)` is an asymmetric Gaussian: `peakMin` shifts the peak, `sigmaUp`/`sigmaDown` control rise vs. tail. Four profiles in `CARB_PROFILES`: `normal`, `highfat`, `veryhigh`, `mixed`.
- **Dose computation** (in the `calc` `useMemo`) — `netDose = carbs/ICR + max(0, (BG - target)/CF) - IOB`, then split via `strategyFor(profile, totalCarbs)` → `splitsForStrategy(strategy)`. Splits are percentage + offset-minutes pairs; the explainer text comes from `STRATEGY_TEXT`.
- **Pre-bolus timing** — `preBolusFor(bg)` returns minutes before the meal. A return of `-1` is the "BG too low, do not dose" signal that gates the entire dose plan UI and the sticky CTA.

The three Recharts panels (peak overlap, predicted BG, 6-hour activity) all derive from the same `overlapData` / `sixHourData` `useMemo`s — changes to the math will reflect across all charts automatically. `overlapData` integrates `carbRate - insulinActivityRate * CF` over 2-minute steps to produce a predicted BG trace; `bgStats` summarizes peak/landing.

### State & persistence

User settings (ICR, CF, target BG, DIA), the dose log, the current meal/plate, the meal profile, and recent food IDs are persisted to `localStorage` via two custom hooks:

- `useStoredState(key, initial)` — generic stored primitive/object.
- `useStoredDoses(key)` — special-cased because dose `time` fields need `Date` ↔ ISO-string conversion.

Both hooks use a `hydrated` flag to avoid writing the SSR-initial value back over the stored value on first mount. If you add new persisted state, follow the same pattern — do **not** call `localStorage` during render or during the initial `useState` initializer.

Ephemeral UI state (current BG input, search text, custom-food inputs, settings drawer visibility, `now` ticker) lives in plain `useState`. A 30-second `setInterval` updates `now`, which drives IOB decay and the dose-history "X min ago" labels.

### Egyptian food database

`EGYPTIAN_FOODS` (inline array) is the meal-builder catalog, organized by `cat` (main/street/bread/side/dessert/drink). `CAT_ORDER` controls section ordering; `CAT_LABEL` maps to display strings. Items have stable numeric `id`s — `recentFoodIds` references these — so when editing the list, **do not renumber existing entries**. Custom foods added via the Quick Log get string IDs (`custom-${Date.now()}`).

### Styling conventions

Tailwind + a small set of custom utility classes defined in `app/globals.css`. The design uses a fixed semantic palette — use these classes rather than hex literals when possible:

- Typography: `.display` (Fraunces serif, for hero numbers/titles), `.sans` (IBM Plex Sans, body), `.num` (JetBrains Mono with tabular figures, for all numeric readouts), `.label-eyebrow` (uppercase tracked labels).
- Colors: `.terra` (#e87a4f, accent — carbs, CTAs), `.lapis` (#6ba8c4, insulin), `.sage` (#8fb37e, in-range/predicted-BG), `.ink` / `.ink-2` / `.ink-3` (primary/secondary/tertiary text on the dark paper background).
- Surfaces: `.bg-paper` (#1a1410, cards), `.bg-paper-2` (#221b16, recessed), `.border-hair` / `.border-hair-soft` (dividers).
- Mobile: `.tap-44` / `.tap-40` ensure touch targets; `.safe-top` / `.safe-x` respect iOS safe-area insets; the layout is constrained to `max-w-md` and the sticky bottom CTA accounts for `env(safe-area-inset-bottom)`.

The app is meant to feel like a printed field guide — keep new UI in the same restrained, typographic style (serif display + mono numerics + thin hairline borders), and avoid pulling in component libraries.

## Disclaimer in code

The footer copy ("A dosing aid, not medical advice…") is intentional and load-bearing — preserve it when refactoring the main component.
