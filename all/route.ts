import { NextRequest, NextResponse } from "next/server";
import { searchSongs } from "@/lib/queries/songs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  // minimum 2 znaki żeby nie wykonywać kosztownych zapytań
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchSongs(q, 8);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[search] query failed:", err);
    return NextResponse.json({ results: [], error: "Search unavailable" }, { status: 500 });
  }
}
