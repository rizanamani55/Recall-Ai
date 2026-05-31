// lib/stripe.ts
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const isStripeConfigured = !!stripeSecretKey;

export const stripe = isStripeConfigured
  ? new Stripe(stripeSecretKey!, {
      apiVersion: "2023-10-16" as any, // standard API version
    })
  : null;

// Mock checkout URL helper
export function getMockCheckoutUrl(clerkUserId: string): string {
  // Direct back to dashboard with a mock upgraded status
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/dashboard?mockUpgradeSession=success&clerkUserId=${clerkUserId}`;
}
