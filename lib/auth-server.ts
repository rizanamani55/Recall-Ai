// lib/auth-server.ts
import { auth as clerkAuth } from "@clerk/nextjs/server";

export const isClerkConfiguredServer = !!process.env.CLERK_SECRET_KEY;

export async function getAuthSession() {
  if (isClerkConfiguredServer) {
    try {
      const { userId } = await clerkAuth();
      return { userId };
    } catch (err) {
      // In case Clerk variables exist but the request is mock-originating
      return { userId: "user_mock_dev_terminal" };
    }
  }

  // Developer mock local session
  return { userId: "user_mock_dev_terminal" };
}
