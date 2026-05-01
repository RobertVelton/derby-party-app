import * as cheerio from "cheerio";
import type { Horse } from "./types";

export function parseOddsFromHtml(html: string): Horse[] {
  const $ = cheerio.load(html);
  const horses: Horse[] = [];

  // The TwinSpires-powered widget renders rows with horse program + odds.
  // Since the exact selectors depend on a JS-rendered DOM (only visible after
  // ScrapingBee renders the page), we try a few likely shapes and fall back
  // to an empty array. Refine once we have a real rendered HTML sample.
  $("[data-horse], .horse-row, .runner-row, tr.horse").each((_, el) => {
    const $el = $(el);
    const program = $el.find("[data-program], .program, .post").first().text().trim();
    const name = $el.find("[data-name], .horse-name, .runner-name").first().text().trim();
    const liveOdds = $el.find("[data-odds], .live-odds, .odds").first().text().trim();
    const morningLine = $el.find("[data-ml], .morning-line, .ml").first().text().trim();
    const jockey = $el.find("[data-jockey], .jockey").first().text().trim();
    const trainer = $el.find("[data-trainer], .trainer").first().text().trim();
    if (program || name) {
      horses.push({
        program,
        name,
        liveOdds: liveOdds || undefined,
        morningLine: morningLine || undefined,
        jockey: jockey || undefined,
        trainer: trainer || undefined,
      });
    }
  });

  return horses;
}
