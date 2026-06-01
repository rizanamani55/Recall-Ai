// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { updateUserSubscription, downgradeUserByStripeId } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let eventType = "";
    let clerkUserId = "";
    let stripeCustomerId = "";
    let stripeSubscriptionId = "";

    // 1. Check if this is a developer sandbox mock event
    try {
      const parsed = JSON.parse(rawBody);
      if (parsed.event === "mock.subscription_active") {
        const userId = parsed.clerkUserId || "user_mock_dev_terminal";
        await updateUserSubscription(userId, "pro", "cus_mock_stripe", "sub_mock_stripe");
        console.log(`[Developer Webhook] Upgraded sandbox user: ${userId} to Pro plan.`);
        return NextResponse.json({ received: true, mockMode: true });
      }
    } catch (e) {
      // not a JSON mock body, proceed to Stripe validation
    }

    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
    }

    const signature = req.headers.get("stripe-signature") || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error("Stripe Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
    }

    eventType = stripeEvent.type;
    const session = stripeEvent.data.object as any;

    if (eventType === "checkout.session.completed") {
      clerkUserId = session.metadata?.clerkUserId;
      stripeCustomerId = session.customer;
      stripeSubscriptionId = session.subscription;
      
      if (clerkUserId) {
        await updateUserSubscription(clerkUserId, "pro", stripeCustomerId, stripeSubscriptionId);
        console.log(`[Stripe Webhook] Upgraded Clerk User: ${clerkUserId} to Pro plan.`);
      }
    } else if (eventType === "customer.subscription.deleted") {
      stripeSubscriptionId = session.id;
      if (session.metadata?.clerkUserId) {
        await updateUserSubscription(session.metadata.clerkUserId, "free", null, null);
      } else if (stripeSubscriptionId) {
        await downgradeUserByStripeId(stripeSubscriptionId);
      }
      console.log(`[Stripe Webhook] Downgraded Subscription: ${stripeSubscriptionId} to free plan.`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe Webhook Handler Error:", err);
    return NextResponse.json({ error: err.message || "Webhook Handler Error" }, { status: 500 });
  }
}
