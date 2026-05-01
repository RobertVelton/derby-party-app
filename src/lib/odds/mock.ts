import type { OddsSnapshot } from "./types";

const FIELD = [
  { program: "1", name: "Renegade", jockey: "J. Rosario", trainer: "B. Cox", morningLine: "4-1" },
  { program: "2", name: "Commandment", jockey: "L. Saez", trainer: "T. Pletcher", morningLine: "6-1" },
  { program: "3", name: "Further Ado", jockey: "I. Ortiz Jr.", trainer: "C. Brown", morningLine: "6-1" },
  { program: "4", name: "Storm Front", jockey: "F. Geroux", trainer: "B. Mott", morningLine: "10-1" },
  { program: "5", name: "Highland Reign", jockey: "J. Velazquez", trainer: "S. Asmussen", morningLine: "12-1" },
  { program: "6", name: "Bourbon County", jockey: "T. Gaffalione", trainer: "W. Mott", morningLine: "15-1" },
  { program: "7", name: "Iron Compass", jockey: "J. Castellano", trainer: "K. McPeek", morningLine: "20-1" },
  { program: "8", name: "Twilight Run", jockey: "M. Smith", trainer: "B. Baffert", morningLine: "8-1" },
  { program: "9", name: "Rolling Thunder", jockey: "F. Prat", trainer: "R. Mandella", morningLine: "20-1" },
  { program: "10", name: "Northern Lights", jockey: "B. Hernandez", trainer: "M. Casse", morningLine: "30-1" },
];

function jitter(ml: string): { live: string; decimal: number } {
  const [a, b] = ml.split("-").map(Number);
  const baseDecimal = a / b + 1;
  const drift = (Math.random() - 0.5) * 0.4;
  const decimal = Math.max(1.5, baseDecimal + drift);
  const fractional = decimal - 1;
  const num = Math.round(fractional * 2);
  const den = 2;
  const simplified = num % 2 === 0 ? `${num / 2}-1` : `${num}-${den}`;
  return { live: simplified, decimal: Number(decimal.toFixed(2)) };
}

export async function mockAdapter(): Promise<OddsSnapshot> {
  const horses = FIELD.map((h) => {
    const j = jitter(h.morningLine);
    return { ...h, liveOdds: j.live, liveOddsDecimal: j.decimal, scratched: false };
  });
  return {
    raceName: "152nd Kentucky Derby",
    raceTime: "2026-05-02T22:57:00Z",
    horses,
    source: "mock",
    fetchedAt: new Date().toISOString(),
    upstreamReachable: true,
    note: "Mock data — set ODDS_SOURCE to direct or scrapingbee for live odds.",
  };
}
