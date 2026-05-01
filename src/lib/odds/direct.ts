import type { OddsSnapshot } from "./types";
import { parseOddsFromHtml } from "./parse";

export async function directAdapter(target: string): Promise<OddsSnapshot> {
  const res = await fetch(target, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  const html = await res.text();
  const horses = parseOddsFromHtml(html);

  return {
    raceName: "152nd Kentucky Derby",
    raceTime: "2026-05-02T22:57:00Z",
    horses,
    source: "direct",
    fetchedAt: new Date().toISOString(),
    upstreamReachable: res.ok,
    note:
      horses.length === 0
        ? "Direct fetch returned 0 horses — the live-odds page renders odds via client-side JS, so a plain HTML fetch will not see them. Use ODDS_SOURCE=scrapingbee."
        : undefined,
  };
}
