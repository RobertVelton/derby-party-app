"use client";

import { useEffect, useState } from "react";
import type { Horse, OddsSnapshot } from "@/lib/odds/types";

const POLL_MS = 45_000;
const GATE_SIZE = 20;

function computeGate(horses: Horse[]): Set<string> {
  return new Set(
    horses
      .filter((h) => !h.scratched)
      .sort((a, b) => programNum(a) - programNum(b))
      .slice(0, GATE_SIZE)
      .map((h) => h.program),
  );
}

function programNum(h: Horse): number {
  const n = parseInt(h.program, 10);
  return Number.isFinite(n) ? n : Infinity;
}

type Status = "loading" | "live" | "stale" | "error";
type SortMode = "odds" | "gate";

export default function OddsBoard({ initial }: { initial: OddsSnapshot | null }) {
  const [snapshot, setSnapshot] = useState<OddsSnapshot | null>(initial);
  const [status, setStatus] = useState<Status>(initial ? "live" : "loading");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortMode>("odds");

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch("/api/odds", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const next: OddsSnapshot = await res.json();
        if (cancelled) return;
        setSnapshot(next);
        setStatus("live");
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setStatus("stale");
        setError(err instanceof Error ? err.message : "fetch failed");
      }
    }

    tick();
    if (process.env.NODE_ENV === "development") {
      return () => {
        cancelled = true;
      };
    }
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center text-derby-cream/60">
        Loading odds…
      </div>
    );
  }

  const gate = computeGate(snapshot.horses);
  const horses = [...snapshot.horses].sort(comparator(sortBy));
  const favorite = [...snapshot.horses]
    .sort(comparator("odds"))
    .find((h) => gate.has(h.program));

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-3">
      <Header
        snapshot={snapshot}
        status={status}
        error={error}
        now={now}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      {favorite && <FavoriteStrip horse={favorite} live={!!snapshot.liveWageringOpen} />}
      <Grid horses={horses} live={!!snapshot.liveWageringOpen} gate={gate} />
      {snapshot.note && (
        <p className="text-[11px] text-derby-cream/45 italic shrink-0">
          {snapshot.note}
        </p>
      )}
    </div>
  );
}

function Header({
  snapshot,
  status,
  error,
  now,
  sortBy,
  onSortChange,
}: {
  snapshot: OddsSnapshot;
  status: Status;
  error: string | null;
  now: number | null;
  sortBy: SortMode;
  onSortChange: (mode: SortMode) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4 shrink-0">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-derby-cream leading-none truncate">
          {snapshot.raceName}
        </h1>
        <p className="text-xs text-derby-cream/60 mt-1 truncate">
          Post: {new Date(snapshot.raceTime).toLocaleString()}
          {snapshot.trackName && (
            <span className="ml-3 text-derby-cream/40">· {snapshot.trackName}</span>
          )}
          {snapshot.raceNumber && (
            <span className="ml-3 text-derby-cream/40">Race {snapshot.raceNumber}</span>
          )}
        </p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <SortToggle value={sortBy} onChange={onSortChange} />
        <p className="text-[10px] text-derby-cream/40 italic text-center max-w-[22rem] leading-tight">
          This is for informational purposes ONLY. There are no odds for the horse betting.
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 text-[11px] min-w-0">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <span className="text-derby-cream/70 tabular-nums">
            {status === "live" &&
              (now == null ? "Updated …" : `Updated ${timeAgo(snapshot.fetchedAt, now)}`)}
            {status === "stale" && (error ?? "Connection issue")}
            {status === "loading" && "Connecting…"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-derby-cream/40">
          <span>
            source:{" "}
            {snapshot.sources && snapshot.sources.length > 0
              ? snapshot.sources.join(" + ")
              : snapshot.source}
          </span>
          <span>·</span>
          <span>
            {snapshot.liveWageringOpen ? (
              <span className="text-derby-gold">live wagering open</span>
            ) : (
              "morning line"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function SortToggle({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (mode: SortMode) => void;
}) {
  const options: { id: SortMode; label: string }[] = [
    { id: "odds", label: "Odds" },
    { id: "gate", label: "Gate #" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Sort horses by"
      className="inline-flex items-center rounded-full border border-derby-cream/15 bg-black/40 p-0.5 text-xs"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1 rounded-full transition-colors tabular-nums ${
              active
                ? "bg-derby-gold/20 text-derby-cream font-medium"
                : "text-derby-cream/55 hover:text-derby-cream/80"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FavoriteStrip({ horse, live }: { horse: Horse; live: boolean }) {
  return (
    <div className="shrink-0 rounded-xl border border-derby-gold/30 bg-gradient-to-r from-derby-gold/10 via-black/30 to-derby-rose/10 px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-derby-gold/80 shrink-0">
          Favorite
        </span>
        <div className="min-w-0">
          <div className="text-lg font-semibold text-derby-cream truncate leading-tight">
            #{horse.program} {horse.name}
          </div>
          {(horse.jockey || horse.trainer) && (
            <div className="text-[11px] text-derby-cream/55 truncate leading-tight">
              {horse.jockey && <>Jockey: {horse.jockey}</>}
              {horse.jockey && horse.trainer && <span> - </span>}
              {horse.trainer && <>Trainer: {horse.trainer}</>}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-baseline gap-2 shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-derby-cream/50">
          {live ? "Live" : "M/L"}
        </span>
        <span className="font-mono text-2xl text-derby-rose font-semibold tabular-nums">
          {horse.liveOdds || horse.morningLine || "—"}
        </span>
      </div>
    </div>
  );
}

function Grid({ horses, live, gate }: { horses: Horse[]; live: boolean; gate: Set<string> }) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-derby-cream/10 bg-black/30 backdrop-blur-sm">
      <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-derby-cream/10">
        <Column
          horses={horses.slice(0, Math.ceil(horses.length / 2))}
          live={live}
          gate={gate}
        />
        <Column
          horses={horses.slice(Math.ceil(horses.length / 2))}
          live={live}
          gate={gate}
        />
      </div>
    </div>
  );
}

const ROW_GRID =
  "grid grid-cols-[2.25rem_1fr_6rem] items-center gap-3 px-3";

function Column({
  horses,
  live,
  gate,
}: {
  horses: Horse[];
  live: boolean;
  gate: Set<string>;
}) {
  return (
    <div className="h-full flex flex-col">
      <div
        className={`${ROW_GRID} py-1.5 bg-derby-cream/5 text-[10px] uppercase tracking-wider text-derby-cream/55 shrink-0`}
      >
        <span>#</span>
        <span>Horse</span>
        <span className="text-right">Odds</span>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        {horses.map((h, i) => (
          <Row key={h.program || h.name || i} horse={h} inGate={gate.has(h.program)} />
        ))}
      </div>
    </div>
  );
}

function Row({ horse, inGate }: { horse: Horse; inGate: boolean }) {
  const standby = !horse.scratched && !inGate;
  const stateClass = horse.scratched
    ? "opacity-40 line-through"
    : standby
      ? "opacity-60"
      : "";

  return (
    <div
      className={`${ROW_GRID} flex-1 min-h-0 border-t border-derby-cream/5 text-sm transition-colors hover:bg-derby-cream/5 ${stateClass}`}
    >
      <span className={`font-mono ${standby ? "text-derby-cream/40" : "text-derby-gold"}`}>
        {horse.program || "—"}
      </span>
      <div className="min-w-0">
        <div className="font-medium truncate flex items-center gap-2 leading-tight">
          <span className="truncate">{horse.name || "—"}</span>
          {standby && (
            <span className="shrink-0 text-[9px] tracking-[0.15em] uppercase font-semibold rounded px-1.5 py-0.5 border border-derby-cream/25 text-derby-cream/55">
              AE
            </span>
          )}
          {horse.hrnFlaggedScratch && !horse.scratched && (
            <span
              title="HRN flagged this horse as scratched"
              className="shrink-0 text-[9px] tracking-[0.15em] uppercase font-semibold rounded px-1.5 py-0.5 border border-amber-400/50 text-amber-300"
            >
              HRN SCR
            </span>
          )}
        </div>
        {(horse.jockey || horse.trainer) && (
          <div className="text-[10px] text-derby-cream/45 truncate leading-tight">
            {horse.jockey && <>Jockey: {horse.jockey}</>}
            {horse.jockey && horse.trainer && <span> - </span>}
            {horse.trainer && <>Trainer: {horse.trainer}</>}
          </div>
        )}
      </div>
      <span
        className={`text-right font-mono font-semibold tabular-nums text-xl leading-none ${
          standby ? "text-derby-cream/55" : "text-derby-rose"
        }`}
      >
        {horse.scratched ? "SCR" : horse.liveOdds || "—"}
      </span>
    </div>
  );
}

function StatusDot({ status }: { status: Status }) {
  const color =
    status === "live"
      ? "bg-emerald-400"
      : status === "stale"
        ? "bg-amber-400"
        : status === "error"
          ? "bg-rose-500"
          : "bg-derby-cream/30";
  return (
    <span className="relative flex h-2 w-2">
      {status === "live" && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}

function comparator(mode: SortMode): (a: Horse, b: Horse) => number {
  return (a, b) => {
    if (a.scratched !== b.scratched) return a.scratched ? 1 : -1;
    if (mode === "gate") {
      const ap = parseInt(a.program, 10);
      const bp = parseInt(b.program, 10);
      return (Number.isFinite(ap) ? ap : Infinity) - (Number.isFinite(bp) ? bp : Infinity);
    }
    const av = a.liveOddsDecimal ?? Infinity;
    const bv = b.liveOddsDecimal ?? Infinity;
    return av - bv;
  };
}

function timeAgo(iso: string, now: number): string {
  const sec = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}
