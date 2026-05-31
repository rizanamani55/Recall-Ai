// app/api/decks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";
import { getDecks, createDeck } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuthSession();

    const list = await getDecks(userId);
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET decks error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch decks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthSession();

    const { title, subject, sourceText, cards } = await req.json();

    if (!title || !subject || !sourceText || !cards || cards.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload parameters. Make sure title, subject, source text, and cards are supplied." },
        { status: 400 }
      );
    }

    const newDeck = await createDeck(userId, title, subject, sourceText, cards);
    return NextResponse.json(newDeck);
  } catch (err: any) {
    console.error("POST deck error:", err);
    return NextResponse.json({ error: err.message || "Failed to save deck" }, { status: 500 });
  }
}
