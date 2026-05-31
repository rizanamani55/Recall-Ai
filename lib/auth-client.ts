// lib/auth-client.ts
"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  emailAddresses: { emailAddress: string }[];
}

const MOCK_USER: MockUser = {
  id: "user_mock_dev_terminal",
  firstName: "Guest",
  lastName: "Scholar",
  imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
  emailAddresses: [{ emailAddress: "scholar@recall.ai" }],
};

export const isClerkConfiguredClient = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function useUser() {
  if (isClerkConfiguredClient) {
    try {
      const clerk = useClerkUser();
      return {
        isLoaded: clerk.isLoaded,
        isSignedIn: clerk.isSignedIn,
        user: clerk.user ? {
          id: clerk.user.id,
          firstName: clerk.user.firstName || "Scholar",
          lastName: clerk.user.lastName || "",
          imageUrl: clerk.user.imageUrl,
          emailAddresses: clerk.user.emailAddresses.map(e => ({ emailAddress: e.emailAddress })),
        } : null,
      };
    } catch (err) {
      // Fallback
    }
  }

  // MOCK DEV SESSION MODE
  if (typeof window !== "undefined") {
    const session = localStorage.getItem("recall_mock_session");
    if (session === "active") {
      return {
        isLoaded: true,
        isSignedIn: true,
        user: MOCK_USER,
      };
    }
  }

  return {
    isLoaded: true,
    isSignedIn: false,
    user: null,
  };
}

export function mockLogin() {
  if (typeof window !== "undefined") {
    localStorage.setItem("recall_mock_session", "active");
    window.location.href = "/dashboard";
  }
}

export function mockLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("recall_mock_session");
    window.location.href = "/";
  }
}
