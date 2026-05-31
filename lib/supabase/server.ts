// lib/supabase/server.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfiguredServer = !!(supabaseUrl && supabaseServiceKey);

export const supabaseServer = isSupabaseConfiguredServer
  ? createClient(supabaseUrl!, supabaseServiceKey!)
  : null;

// Standard service helper to get user's billing plan
export async function getUserPlan(clerkUserId: string): Promise<string> {
  if (!isSupabaseConfiguredServer || !supabaseServer) {
    // If not configured, we'll use local storage/JSON database in db.ts
    // Return placeholder and let db.ts handle logic
    return "free";
  }

  try {
    const { data, error } = await supabaseServer
      .from("users")
      .select("plan")
      .eq("clerk_id", clerkUserId)
      .single();

    if (error || !data) return "free";
    return data.plan || "free";
  } catch (err) {
    console.error("Error fetching user plan:", err);
    return "free";
  }
}
