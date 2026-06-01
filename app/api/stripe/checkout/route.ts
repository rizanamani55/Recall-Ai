// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";
import { isStripeConfigured, stripe, getMockCheckoutUrl } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthSession();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { priceId } = await req.json();

    if (!isStripeConfigured || !stripe) {
      // Mock sandbox checkout redirection
      const mockUrl = getMockCheckoutUrl(userId);
      return NextResponse.json({ url: mockUrl });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Real Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID || priceId || "price_pro_default",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/dashboard?stripeSession=success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        clerkUserId: userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message || "Failed to initiate payment" }, { status: 500 });
  }
}
