// components/auth/AuthProviderWrapper.tsx
import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

export const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export default function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  if (isClerkConfigured) {
    return (
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
      >
        {children}
      </ClerkProvider>
    );
  }

  // local developer mode doesn't need ClerkProvider
  return <>{children}</>;
}
