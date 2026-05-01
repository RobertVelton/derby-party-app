export type Horse = {
  program: string;
  name: string;
  jockey?: string;
  trainer?: string;
  morningLine?: string;
  liveOdds?: string;
  liveOddsDecimal?: number;
  scratched?: boolean;
  hrnML?: string;
  hrnRating?: number;
  hrnFlaggedScratch?: boolean;
};

export type OddsSnapshot = {
  raceName: string;
  raceTime: string;
  horses: Horse[];
  source: "mock" | "direct" | "scrapingbee" | "twinspires";
  sources?: string[];
  raceNumber?: string;
  trackName?: string;
  liveWageringOpen?: boolean;
  fetchedAt: string;
  upstreamReachable: boolean;
  note?: string;
};

export type OddsAdapter = (target: string) => Promise<OddsSnapshot>;
