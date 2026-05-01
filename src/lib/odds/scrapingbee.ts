import type { OddsSnapshot } from "./types";
import { parseOddsFromHtml } from "./parse";

export async function scrapingBeeAdapter(target: string): Promise<OddsSnapshot> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    throw new Error("SCRAPINGBEE_API_KEY not set");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    url: target,
    render_js: "true",
    wait: "3500",
    block_resources: "false",
    country_code: "us",
  });
  // Premium proxy ~15× the credit cost. Only enable if a standard call gets blocked.
  if (process.env.SCRAPINGBEE_PREMIUM_PROXY === "true") {
    params.set("premium_proxy", "true");
  }

  const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ScrapingBee ${res.status}: ${body.slice(0, 200)}`);
  }

  const html = await res.text();
  const horses = parseOddsFromHtml(html);

  return {
    raceName: "152nd Kentucky Derby",
    raceTime: "2026-05-02T22:57:00Z",
    horses,
    source: "scrapingbee",
    fetchedAt: new Date().toISOString(),
    upstreamReachable: true,
    note:
      horses.length === 0
        ? "ScrapingBee fetched the page but the parser found 0 horses. Selectors in parse.ts need to be updated against the rendered DOM."
        : undefined,
  };
}
