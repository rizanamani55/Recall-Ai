// components/dashboard/Header.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUsage } from "@/hooks/useUsage";
import { isClerkConfiguredClient } from "@/lib/auth-client";
import { UserButton } from "@clerk/nextjs";

export function Header() {
  const { usage, isLoading } = useUsage();

  const used = usage?.used ?? 0;
  const plan = usage?.plan ?? "pro";
  const isPro = plan === "pro";

  return (
    <header className="h-16 border-b border-border-card/65 bg-[#060a14] px-8 flex items-center justify-between font-mono text-xs select-none">
      <div className="flex items-center gap-4 flex-grow">
        {/* Dynamic Usage Meter Pill */}
        {isLoading ? (
          <div className="h-7 w-48 bg-surface/50 animate-pulse rounded border border-border-card/30" />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-[10px] uppercase">CONVERSIONS USED:</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#0a0f1e] border border-border-card/80 text-text">
              <span className="text-correct font-bold flex items-center gap-1.5 select-none">
                <span className="animate-pulse">●</span>
                <span>{used} EXTRACTED</span>
                <span className="px-1.5 py-0.5 rounded bg-correct/10 border border-correct text-[8px]">UNLIMITED FREE</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Profile menu & social links */}
      <div className="flex items-center gap-4 font-mono">
        <span className="px-2.5 py-1 rounded bg-surface/30 border border-border-card text-[9px] text-text uppercase font-bold tracking-widest bg-gradient-to-r from-active/10 to-correct/10">
          ⚡ Offline AI Sandbox
        </span>

        {/* Clerk Profile Avatar Button if Clerk Configured */}
        {isClerkConfiguredClient ? (
          <div className="flex items-center">
            <UserButton />
          </div>
        ) : (
          <span className="px-2 py-0.5 rounded bg-surface/80 border border-border-card text-[9px] text-text-muted uppercase cursor-default">
            Sandbox User
          </span>
        )}
      </div>
    </header>
  );
}
