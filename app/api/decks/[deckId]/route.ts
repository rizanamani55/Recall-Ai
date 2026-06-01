import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";
import { getDeck, deleteDeck } from "@/lib/db";

export async function GET(req: NextRequest, context: { params: Promise<{ deckId: string }> }) {
  try {
    const { userId } = await getAuthSession();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deckId } = await context.params;
    if (!deckId) {
      return NextResponse.json({ error: "Deck ID required" }, { status: 400 });
    }

    const result = await getDeck(userId, deckId);
    
    // Test A13: Authorization Boundary (403 or 404 if deck belongs to another user / doesn't exist)
    if (!result) {
      return NextResponse.json({ error: "Deck not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Get Deck API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to get deck" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ deckId: string }> }) {
  try {
    const { userId } = await getAuthSession();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deckId } = await context.params;
    if (!deckId) {
      return NextResponse.json({ error: "Deck ID required" }, { status: 400 });
    }

    const success = await deleteDeck(userId, deckId);
    
    if (!success) {
      return NextResponse.json({ error: "Deck not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Delete Deck API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete deck" }, { status: 500 });
  }
}
