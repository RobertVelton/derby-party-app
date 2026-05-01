# CLAUDE.md

Notes for future Claude sessions working in this repo. Anything obvious from reading code or `git log` is omitted.

## What this is

A Next.js 15 (App Router) dashboard for displaying Kentucky Derby live odds at a watch party. Designed to run full-screen on a TV — viewport-fit, no scroll, two-column horse grid. Informational only; not a betting platform.

## Data flow

1. `getOdds()` (`src/lib/odds/index.ts`) is the single entry point. Both the SSR `<Home>` page and the `/api/odds` route call it.
2. It picks a **base** adapter by `ODDS_SOURCE`, then applies **overlays** that enrich per-horse fields without touching the roster.
3. Result is cached in-process for `ODDS_CACHE_TTL_SECONDS` (default 30s).

Base adapters return the canonical roster + live odds; overlays merge by `programNumber`. The TwinSpires adapter is the default and only one currently providing scratch data — keep it as the base if you want scratched entries to appear.

## Why we don't scrape kentuckyderby.com directly

The live-odds page at `kentuckyderby.com/wager/live-odds/` is **not scrapable** with normal techniques:

- A plain `fetch()` returns an empty `<div></div>` placeholder + a script tag for `betting-widget.netlify.app/betting-widget/index.es.js`. No horses in the HTML.
- ScrapingBee with `render_js=true` runs the script but returns 0 horses in `outerHTML` because the widget paints into **shadow DOM**, which `document.documentElement.outerHTML` does not serialize. Verified empirically — checked for 2026 Derby horse names in a 10-second wait response, zero hits.
- The widget's only fetch is to `tscom-content.netlify.app/bettingwidget/{configId}.json` (verified by reading the widget bundle source). That is the actual data source — and it's plain JSON, no auth, no CORS for server-side fetch.

So `twinspires.ts` reads the same JSON the widget would read, one hop earlier in the data chain. **Do not** rebuild against the rendered page; you'll be fighting shadow DOM serialization for no benefit.

## Adapter contract

Base adapter signature: `() => Promise<OddsSnapshot>` (or `(target) => ...` for ones that take a URL).

Overlay signature: arbitrary, but should return a `Map<programNumber, partialHorseData>` so `applyOverlays()` in `index.ts` can do the merge. Add new overlays inside `applyOverlays`, after the HRN block.

## Race-day stretch (TVG/FanDuel cross-pool)

Noted in a comment in `src/lib/odds/index.ts` next to the HRN overlay. Plan: add a TVG overlay via ScrapingBee (`js_scenario` against `tvg.com/wagering/kentucky-derby/odds`) for live odds from a *different pool* than TwinSpires. Real cross-pool data, not just two opinions on the same morning line.

Notes if/when implementing:

- TVG is a SPA backed by GraphQL at `service.racing.fanduel.com/v1/graphql` and WebSocket at `/v1/subscriptions` for live odds.
- It probably needs a guest token even for unauth browsing. Cheaper to render the page and traverse the rendered DOM via ScrapingBee than to reverse the GraphQL.
- Burn one credit on a discovery probe before writing the parser. Selectors will be minified and unstable.
- The merge layer already supports multi-overlay, so adding TVG is a new file + 5 lines in `applyOverlays`.

## Layout constraints

The dashboard must fit a single viewport with no scroll. The horse grid uses `flex-1` rows that distribute equally over the available column height. Every visual change should preserve:

- `<html>` and `<body>` are `h-full overflow-hidden` (`src/app/layout.tsx`).
- Main content lives in a single flex column where the horse grid is the only `flex-1 min-h-0` child.
- Rows are `flex-1` themselves so 12 rows per column auto-distribute. If you add a third line per row, check that 12 of them still fit on a 13" laptop.

## Hydration gotchas

Anything time-derived (`Date.now()`, `Math.random()`, `toLocaleString()` with no explicit locale) must not run during SSR. `OddsBoard` uses the `now: number | null` pattern: state starts `null`, gets filled in `useEffect` post-mount, server renders a placeholder. Same fix applies to any future relative-time UI you add.

## Dev mode behavior

`OddsBoard` skips the 45s polling interval when `process.env.NODE_ENV === "development"`. The 1s "updated Xs ago" ticker still runs (different effect), so the staleness counter keeps climbing — that's intentional, it tells you when you last refreshed. Manual refresh = manual fetch in dev.

## Useful commands

- `npm run dev` — dev server at :3000
- `npx tsc --noEmit` — type-check (run after every code edit; the codebase has no test suite)
- `npm run build` — production build
- `curl -s localhost:3000/api/odds | python3 -m json.tool` — inspect the merged snapshot

## Things that would surprise a new reader

- The `direct` adapter is essentially useless against the live-odds page — kept only because it's a clean reference for what a plain HTML fetch returns. Don't delete it.
- `parse.ts` has hand-wavy fallback selectors and is only invoked by `direct`/`scrapingbee`. The TwinSpires path doesn't touch it.
- `Horse.morningLine` always means *TwinSpires* ML. `hrnML` is the HorseRacingNation second opinion. Don't conflate.
- Some longshots show `99/1` from TwinSpires but `50/1` from HRN — that's a vendor floor difference, not divergence-worthy. The 40% threshold in `oddsDiverge()` was tuned to skip those.
- HRN sometimes flags a horse as scratched (`hrnFlaggedScratch`) before TwinSpires updates. Surfaced as a yellow `HRN SCR` badge — likely fresher info than the JSON.
