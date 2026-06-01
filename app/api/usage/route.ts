// app/api/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";
import { getOrCreateUser, getDailyUsage } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuthSession();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser(userId, `${userId}@example.com`);
    const used = await getDailyUsage(userId);
    const limit = user.plan === "pro" ? Infinity : 3;

    return NextResponse.json({
      used,
      limit,
      plan: user.plan,
    });
  } catch (err: any) {
    console.error("Usage API Error:", err);
    return NextResponse.json({ error: err.message || "Server Error" }, { status: 500 });
  }
}
