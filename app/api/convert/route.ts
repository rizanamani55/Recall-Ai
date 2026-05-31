// app/api/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";
import { convertTextToClozeCards } from "@/lib/anthropic";
import { checkAndIncrementUsage } from "@/lib/usage";
import { getOrCreateUser } from "@/lib/db";

// ─── No limits — fully free & unlimited ──────────────────────────────────────
const DAILY_LIMIT = Infinity;

// Rough upper bound: ~2 million chars ≈ ~1 400 pages of text
const MAX_TEXT_LENGTH = 2_000_000;
const MIN_TEXT_LENGTH = 50;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthSession();

    const { text, subject } = await req.json();

    if (!text || text.trim().length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        { error: "Text too short. Please provide at least 50 characters." },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long (maximum ${(MAX_TEXT_LENGTH / 1_000_000).toFixed(0)} million characters).` },
        { status: 400 }
      );
    }

    // Usage tracking (always allowed — DAILY_LIMIT = Infinity)
    await getOrCreateUser(userId, `${userId}@example.com`);
    const { allowed, used } = await checkAndIncrementUsage(userId, DAILY_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Daily limit reached.", used, limit: DAILY_LIMIT, upgrade: false },
        { status: 429 }
      );
    }

    // Generate cards — large texts are chunked automatically inside this function
    const cards = await convertTextToClozeCards(text, subject || "general");

    return NextResponse.json({ cards, used, limit: DAILY_LIMIT });
  } catch (err: any) {
    console.error("Convert Route Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process text" },
      { status: 500 }
    );
  }
}
