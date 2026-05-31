// lib/usage.ts
import { isRedisConfigured, redis } from "./redis";
import { getDailyUsage, incrementDailyUsage } from "./db";

export async function checkAndIncrementUsage(
  userId: string,
  limit: number
): Promise<{ allowed: boolean; used: number }> {
  // If limit is Infinity (Pro plan), let them pass without checking
  if (limit === Infinity) {
    const used = await getUsedCount(userId);
    return { allowed: true, used };
  }

  if (isRedisConfigured && redis) {
    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const key = `usage:${userId}:${today}`;

      const used = (await redis.get<number>(key)) ?? 0;

      if (used >= limit) {
        return { allowed: false, used };
      }

      await redis.set(key, used + 1, { ex: 86400 }); // 24h expiration
      return { allowed: true, used: used + 1 };
    } catch (err) {
      console.warn("Redis error, falling back to database limit tracker", err);
    }
  }

  // DATABASE/LOCAL STORAGE FALLBACK RATE LIMITER
  const used = await getDailyUsage(userId);
  if (used >= limit) {
    return { allowed: false, used };
  }

  const nextVal = await incrementDailyUsage(userId);
  return { allowed: true, used: nextVal };
}

// Simple non-incrementing getter for SWR usage meters
export async function getUsedCount(userId: string): Promise<number> {
  if (isRedisConfigured && redis) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `usage:${userId}:${today}`;
      const used = await redis.get<number>(key);
      return used ?? 0;
    } catch (err) {
      // fallback to DB
    }
  }
  return await getDailyUsage(userId);
}
