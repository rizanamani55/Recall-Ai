// app/(auth)/sign-up/[[...sign-up]]/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";
import { isClerkConfiguredClient, mockLogin } from "@/lib/auth-client";

export default function SignUpPage() {
  const isClerk = isClerkConfiguredClient;

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 relative select-none">
      {/* Background vector lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        <Logo />

        {isClerk ? (
          <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
        ) : (
          <div className="w-full max-w-sm glass-panel rounded-lg p-6 border border-border-card bg-[#0e1629] text-center font-mono animate-correct-pop flex flex-col gap-6 shadow-2xl">
            <div className="flex flex-col gap-1">
              <h2 className="serif-header text-2xl text-accent font-bold">Create Terminal Sandbox Account</h2>
              <p className="text-[10px] text-text-muted uppercase mt-1">DEVELOPER SANDBOX AUTH</p>
            </div>

            <div className="text-xs text-text-muted leading-relaxed bg-bg/70 p-3.5 rounded border border-border-card/50 text-left flex flex-col gap-2">
              <span className="font-bold text-text">ℹ️ Zero-Config Active</span>
              <span>
                Clerk environment variables are not configured in your `.env.local`. You are in **local developer mode**.
              </span>
              <span>Click the button below to bypass registrations and create an active sandbox session instantly.</span>
            </div>

            <button
              onClick={mockLogin}
              className="w-full py-2.5 bg-gradient-to-r from-active to-correct hover:scale-[1.01] hover:brightness-110 text-bg rounded font-bold uppercase text-xs tracking-wider transition-all"
            >
              ⚡ Create Sandbox Account
            </button>

            <span className="text-[10px] text-text-muted">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-active hover:underline">
                Bypass Login
              </Link>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
