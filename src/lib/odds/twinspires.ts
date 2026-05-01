import type { Horse, OddsSnapshot } from "./types";

const DEFAULT_FEED =
  "https://tscom-content.netlify.app/bettingwidget/10.json";

type TwinSpiresMtp = {
  ProgramNumber?: string;
  NumOdds?: string;
  TextOdds?: string;
};

type TwinSpiresHorse = {
  ProgramNumber?: string;
  HorseName?: string;
  ML?: string;
  Jockey?: string;
  Trainer?: string;
  Scratched?: boolean | string;
  mtp?: TwinSpiresMtp;
};

type TwinSpiresRace = {
  RaceNum?: string;
  RaceText?: string;
  Horses?: TwinSpiresHorse[];
};

type TwinSpiresPayload = {
  title?: string;
  trackName?: string;
  raceId?: string | number;
  valid?: boolean;
  raceData?: TwinSpiresRace[];
};

export async function twinspiresAdapter(): Promise<OddsSnapshot> {
  const url = process.env.TWINSPIRES_FEED_URL ?? DEFAULT_FEED;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`TwinSpires feed ${res.status}`);
  }

  const data = (await res.json()) as TwinSpiresPayload;
  const race = data.raceData?.[0];
  const horses: Horse[] = (race?.Horses ?? []).map(mapHorse);

  const liveOpen = horses.some(
    (h) => !h.scratched && h.liveOdds && h.morningLine && h.liveOdds !== h.morningLine,
  );

  return {
    raceName: "152nd Kentucky Derby",
    raceTime: "2026-05-02T22:57:00Z",
    raceNumber: race?.RaceNum,
    trackName: data.trackName,
    horses,
    source: "twinspires",
    fetchedAt: new Date().toISOString(),
    upstreamReachable: true,
    liveWageringOpen: liveOpen,
    note:
      horses.length === 0
        ? "TwinSpires feed returned no horses. The race may not yet be loaded into the widget."
        : !liveOpen
          ? "Live wagering not yet open — showing morning-line odds. Live odds will populate at advance wagering / post."
          : undefined,
  };
}

function mapHorse(raw: TwinSpiresHorse): Horse {
  const text = (raw.mtp?.TextOdds ?? "").trim().toUpperCase();
  const mlNum = Number(raw.ML);
  const liveNum = Number(raw.mtp?.NumOdds);
  const scratched =
    parseScratched(raw.Scratched) ||
    text === "SCR" ||
    text === "SCRATCH" ||
    (Number.isFinite(mlNum) && mlNum < 0) ||
    (Number.isFinite(liveNum) && liveNum < 0);

  const ml = scratched ? undefined : normalizeOdds(raw.ML);
  const live = scratched
    ? "SCR"
    : (normalizeOdds(raw.mtp?.TextOdds ?? raw.mtp?.NumOdds) ?? ml);
  const liveDecimal = scratched
    ? undefined
    : parseDecimal(raw.mtp?.NumOdds ?? raw.ML);

  return {
    program: raw.ProgramNumber ?? "",
    name: raw.HorseName ?? "",
    jockey: raw.Jockey || undefined,
    trainer: raw.Trainer || undefined,
    morningLine: ml,
    liveOdds: live,
    liveOddsDecimal: liveDecimal,
    scratched,
  };
}

function normalizeOdds(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  if (Number.isFinite(num)) {
    return formatFractional(num);
  }
  return trimmed;
}

function formatFractional(num: number): string {
  if (num >= 1) {
    if (Number.isInteger(num)) return `${num}/1`;
    const halves = Math.round(num * 2);
    if (halves % 2 === 1) return `${halves}/2`;
    return num.toFixed(1).replace(/\.0$/, "") + "/1";
  }
  const denom = Math.round(1 / num);
  return `1/${denom}`;
}

function parseDecimal(value?: string): number | undefined {
  if (!value) return undefined;
  const num = Number(value.trim());
  return Number.isFinite(num) ? num : undefined;
}

function parseScratched(value: TwinSpiresHorse["Scratched"]): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  return false;
}
