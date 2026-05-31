// app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";
import { summariseText } from "@/lib/summarize";

const MAX_TEXT = 2_000_000;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthSession();

    const { text, subject } = await req.json();

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "Text too short (minimum 50 chars)." }, { status: 400 });
    }

    if (text.length > MAX_TEXT) {
      return NextResponse.json({ error: "Text too long (max 2 million chars)." }, { status: 400 });
    }

    const result = await summariseText(text, subject || "general");
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Summarize Route Error:", err);
    return NextResponse.json({ error: err.message || "Summarization failed." }, { status: 500 });
  }
}
