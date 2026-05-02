import type { Horse, OddsSnapshot } from "./types";
import { mockAdapter } from "./mock";
import { directAdapter } from "./direct";
import { scrapingBeeAdapter } from "./scrapingbee";
import { twinspiresAdapter } from "./twinspires";
import { fetchHrnEntries } from "./hrn";

const TARGET = process.env.ODDS_TARGET_URL ?? "https://www.kentuckyderby.com/wager/live-odds/";

let cache: { snapshot: OddsSnapshot; expires: number } | null = null;

export async function getOdds(): Promise<OddsSnapshot> {
  const ttl = Number(process.env.ODDS_CACHE_TTL_SECONDS ?? 30) * 1000;
  if (cache && cache.expires > Date.now()) return cache.snapshot;

  const source = (process.env.ODDS_SOURCE ?? "twinspires").toLowerCase();
  const base = await fetchBase(source);
  const snapshot = await applyOverlays(base);

  cache = { snapshot, expires: Date.now() + ttl };
  return snapshot;
}

async function fetchBase(source: string): Promise<OddsSnapshot> {
  switch (source) {
    case "twinspires":
      try {
        return await twinspiresAdapter();
      } catch (err) {
        if (process.env.SCRAPINGBEE_API_KEY) {
          console.warn("[odds] twinspires failed, falling back to scrapingbee:", err);
          return scrapingBeeAdapter(TARGET);
        }
        throw err;
      }
    case "scrapingbee":
      return scrapingBeeAdapter(TARGET);
    case "direct":
      return directAdapter(TARGET);
    case "mock":
    default:
      return mockAdapter();
  }
}

// Cross-source overlays. Roster + live odds come from the base source above;
// each overlay enriches per-horse data without changing the roster.
//
// Race-day stretch: add a TVG/FanDuel overlay via ScrapingBee for live odds
// from a different (non-TwinSpires) pool. TVG is a SPA backed by GraphQL at
// service.racing.fanduel.com, so it'll need ScrapingBee + js_scenario to
// extract from the rendered DOM. Plug it in here next to the HRN overlay.
async function applyOverlays(base: OddsSnapshot): Promise<OddsSnapshot> {
  const sources: string[] = [base.source];
  let horses: Horse[] = base.horses;

  if (process.env.ODDS_OVERLAY_HRN !== "false") {
    try {
      const hrn = await fetchHrnEntries();
      // Only trust HRN's "missing horse → scratched" signal if HRN itself
      // returned a healthy roster. Guards against a parser/upstream blip
      // marking the entire field as scratched.
      const hrnHealthy = hrn.size >= 15;
      horses = horses.map((h) => {
        const e = hrn.get(h.program);
        if (e) {
          const scratched = h.scratched || !!e.flaggedScratch;
          return {
            ...h,
            hrnML: e.ml,
            hrnRating: e.rating,
            hrnFlaggedScratch: e.flaggedScratch,
            trainer: h.trainer ?? e.trainer,
            jockey: h.jockey ?? e.jockey,
            scratched,
          };
        }
        if (hrnHealthy) {
          return { ...h, scratched: true, hrnFlaggedScratch: true };
        }
        return h;
      });
      sources.push("hrn");
    } catch (err) {
      console.warn("[odds] HRN overlay failed:", err);
    }
  }

  return { ...base, horses, sources };
}
