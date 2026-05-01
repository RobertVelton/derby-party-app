import { NextResponse } from "next/server";
import { getOdds } from "@/lib/odds";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await getOdds();
    return NextResponse.json(snapshot, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 },
    );
  }
}
