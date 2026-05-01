import * as cheerio from "cheerio";

export type HrnEntry = {
  program: string;
  name: string;
  ml?: string;
  rating?: number;
  flaggedScratch?: boolean;
  trainer?: string;
  jockey?: string;
};

const DEFAULT_URL =
  "https://www.horseracingnation.com/race/2026_Kentucky_Derby";

export async function fetchHrnEntries(): Promise<Map<string, HrnEntry>> {
  const url = process.env.HRN_URL ?? DEFAULT_URL;
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      accept: "text/html",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HRN ${res.status}`);
  return parseHrnEntries(await res.text());
}

export function parseHrnEntries(html: string): Map<string, HrnEntry> {
  const $ = cheerio.load(html);
  const out = new Map<string, HrnEntry>();

  // Find the entries table — the one whose header row ends in <th>ML</th>.
  const table = $("table")
    .filter((_, el) => $(el).find("thead th").last().text().trim() === "ML")
    .first();
  if (!table.length) return out;

  table.find("tbody > tr").each((_, tr) => {
    const $tr = $(tr);
    // Mobile-only stacked rows use colspan and have <2 useful tds.
    if ($tr.find("> td[colspan]").length) return;
    const tds = $tr.find("> td");
    if (tds.length < 6) return;

    const program = $(tds[0]).text().trim();
    if (!/^\d+$/.test(program)) return;

    const name = $(tds[2]).find("a").first().text().trim();
    const ratingText = $(tds[3]).text().trim();
    const rating = parseFloat(ratingText);

    // Trainer / jockey cell: two anchor tags separated by <br>.
    const people = $(tds[4]).find("a");
    const trainer = people.eq(0).text().trim() || undefined;
    const jockey = people.eq(1).text().trim() || undefined;

    const ml = $(tds[tds.length - 1]).text().trim();
    const flaggedScratch = /^scr$/i.test(ml);

    out.set(program, {
      program,
      name,
      ml: flaggedScratch ? undefined : normalizeMl(ml),
      rating: Number.isFinite(rating) ? rating : undefined,
      flaggedScratch,
      trainer,
      jockey,
    });
  });

  return out;
}

function normalizeMl(ml: string): string {
  // HRN renders odds like "4-1", "7-2"; standardize to slash form for visual parity.
  const m = ml.match(/^(\d+)\s*[-/]\s*(\d+)$/);
  if (!m) return ml;
  return `${m[1]}/${m[2]}`;
}
