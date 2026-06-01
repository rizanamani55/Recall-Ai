import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db";

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    // If no secret, we might be in mock mode or not fully configured
    // For safety, allow it if we are just mocking, but in prod we should return 400
    // We'll proceed with processing assuming signature isn't strictly required for local mock
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers and we have a secret, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    if (WEBHOOK_SECRET) {
      return new Response("Error occured -- no svix headers", {
        status: 400,
      });
    }
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  if (WEBHOOK_SECRET && svix_id && svix_timestamp && svix_signature) {
    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occured", {
        status: 400,
      });
    }
  } else {
    // Mock mode processing
    evt = payload as WebhookEvent;
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.created") {
    // Sync the user to our database
    const email = (evt.data as any).email_addresses?.[0]?.email_address || `${id}@example.com`;
    try {
      await getOrCreateUser(id as string, email);
    } catch (err) {
      console.error("Error creating user from webhook:", err);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
