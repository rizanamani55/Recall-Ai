import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";
import { createDeck, getDecks } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthSession();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, subject, sourceText, cards } = await req.json();

    if (!title || !cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: "Invalid deck data" }, { status: 400 });
    }

    const deck = await createDeck(userId, title, subject || "general", sourceText || "", cards);

    return NextResponse.json(deck, { status: 201 });
  } catch (err: any) {
    console.error("Create Deck API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create deck" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuthSession();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decks = await getDecks(userId);

    // Filter out sourceText for list view as required by test A12
    const listDecks = decks.map(d => ({
      id: d.id,
      userId: d.user_id || (d as any).userId,
      title: d.title,
      subject: d.subject,
      cardCount: d.card_count || (d as any).cardCount,
      createdAt: d.created_at || (d as any).createdAt,
    }));

    return NextResponse.json(listDecks, { status: 200 });
  } catch (err: any) {
    console.error("Get Decks API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to get decks" }, { status: 500 });
  }
}
