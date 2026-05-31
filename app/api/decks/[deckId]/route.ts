// app/api/decks/[deckId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";
import { getDeck, deleteDeck } from "@/lib/db";

interface RouteParams {
  params: Promise<{
    deckId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await getAuthSession();

    const { deckId } = await params;
    const details = await getDeck(userId, deckId);
    
    if (!details) {
      return NextResponse.json({ error: "Study deck not found" }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (err: any) {
    console.error("GET single deck error:", err);
    return NextResponse.json({ error: err.message || "Failed to load deck" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await getAuthSession();

    const { deckId } = await params;
    const success = await deleteDeck(userId, deckId);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to delete deck or deck not found" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE deck error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete deck" }, { status: 500 });
  }
}
