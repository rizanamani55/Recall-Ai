// types/user.ts

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  plan: "free" | "pro";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  created_at: string;
}

export interface UsageMeterData {
  used: number;
  limit: number;
  plan: string;
}
