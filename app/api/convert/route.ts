// app/api/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";
import { convertTextToClozeCards } from "@/lib/anthropic";
import { checkAndIncrementUsage, decrementUsage } from "@/lib/usage";
import { getOrCreateUser } from "@/lib/db";

const FREE_DAILY_LIMIT = 3;

// Rough upper bound: 15,000 chars for standard
const MAX_TEXT_LENGTH = 15_000;
const MIN_TEXT_LENGTH = 50;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthSession();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Check user plan
    const user = await getOrCreateUser(userId, `${userId}@example.com`);
    const limit = user.plan === "pro" ? Infinity : FREE_DAILY_LIMIT;

    const { allowed, used } = await checkAndIncrementUsage(userId, limit);
    if (!allowed) {
      return NextResponse.json(
        { error: "Daily limit reached", used, limit, upgrade: true },
        { status: 429 }
      );
    }

    try {
      // Generate cards
      const cards = await convertTextToClozeCards(text, subject || "general");
      return NextResponse.json({ cards, used, limit });
    } catch (apiErr: any) {
      await decrementUsage(userId);
      throw apiErr; // caught by outer catch
    }
  } catch (err: any) {
    console.error("Convert Route Error:", err);
    return NextResponse.json(
      { error: "Conversion failed. Please try again." },
      { status: 500 }
    );
  }
}
