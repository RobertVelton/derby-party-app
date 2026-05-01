# Velton Derby Party — Live Odds

A full-viewport, no-scroll dashboard for displaying Kentucky Derby live odds at a watch party. Pulls real data from public sources, cross-validates between two of them, and is designed to live full-screen on a TV.

This is for informational purposes ONLY. There are no odds for the horse betting.

## What it shows

- **All 24 entrants** with program number, name, jockey, and trainer
- **TwinSpires morning line** alongside **near-time / live odds** (the `mtp` field — updates as advance wagering opens)
- **HorseRacingNation morning line** in a parallel column (different handicapper opinion)
- **HRN composite rating** (proprietary handicap score, higher = better)
- **State styling** — in-gate horses full color, AE (also-eligible) horses muted with a badge, scratched horses faded with line-through
- **Divergence highlighting** when TwinSpires and HRN ML differ by ≥40%
- **Sort toggle** — by odds (default) or by gate number
- **Favorite banner** — highlights the in-gate odds-on favorite

## Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- React 19
- Tailwind CSS
- [cheerio](https://cheerio.js.org/) for HTML parsing
- TypeScript

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

The default `ODDS_SOURCE=twinspires` works out of the box with no API keys — the TwinSpires widget JSON is publicly readable.

## Environment

| Var | Default | What it does |
|---|---|---|
| `ODDS_SOURCE` | `twinspires` | One of: `twinspires`, `scrapingbee`, `direct`, `mock`. Picks the base data source. |
| `ODDS_TARGET_URL` | `https://www.kentuckyderby.com/wager/live-odds/` | Page the `scrapingbee` and `direct` adapters scrape. |
| `TWINSPIRES_FEED_URL` | `https://tscom-content.netlify.app/bettingwidget/10.json` | The widget JSON the TwinSpires adapter reads. |
| `SCRAPINGBEE_API_KEY` | _(unset)_ | Required only when using the ScrapingBee fallback. |
| `ODDS_OVERLAY_HRN` | `true` | Set to `false` to skip the HorseRacingNation overlay. |
| `ODDS_CACHE_TTL_SECONDS` | `30` | Server-side fetch cache TTL. |
| `HRN_URL` | `https://www.horseracingnation.com/race/2026_Kentucky_Derby` | The HRN page parsed for the overlay. |

## Where the data comes from

The dashboard reads from two independent public sources:

1. **TwinSpires betting widget JSON** — the same file that powers the live odds widget on kentuckyderby.com. Reached directly at `tscom-content.netlify.app/bettingwidget/10.json`. Provides: program number, horse name, ML odds, near-time odds, scratch flags.
2. **HorseRacingNation entry table** — `horseracingnation.com/race/2026_Kentucky_Derby`. Provides: a second morning-line opinion, HRN composite rating, jockey, trainer.

Sources are merged in `src/lib/odds/index.ts`. The TwinSpires source drives the roster (full 24-horse field including scratches); HRN overlays per-horse data keyed by program number.

## Project layout

```
src/
  app/
    api/odds/route.ts    # GET /api/odds — server route returning the merged snapshot
    page.tsx             # Server component, calls getOdds() once for SSR initial state
    layout.tsx           # Full-height/no-scroll shell
    globals.css          # Tailwind + radial-gradient background
  components/
    OddsBoard.tsx        # The whole client UI
  lib/odds/
    index.ts             # getOdds() — picks a source, applies overlays
    types.ts             # Horse + OddsSnapshot
    twinspires.ts        # JSON adapter (default)
    hrn.ts               # HorseRacingNation overlay adapter
    scrapingbee.ts       # Fallback adapter via ScrapingBee proxy
    direct.ts            # Plain HTML fetch adapter (largely useless for the live-odds page)
    mock.ts              # Canned data for dev with no network
    parse.ts             # Shared HTML→horses parser used by direct/scrapingbee
```

## Disclaimer

This dashboard displays publicly available odds data for informational and entertainment purposes only. It does not accept bets, take wagers, or facilitate gambling of any kind.
