// app/dashboard/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { useUsage } from "@/hooks/useUsage";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Suspensed subcomponent to handle searchParams check safely without CSR build bails!
function UpgradeSync({ onUpgrade }: { onUpgrade: () => void }) {
  const searchParams = useSearchParams();
  const { mutateUsage } = useUsage();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mockUpgrade = searchParams.get("mockUpgradeSession");
      const clerkUserId = searchParams.get("clerkUserId");
      
      if (mockUpgrade === "success") {
        fetch("/api/stripe/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "mock.subscription_active",
            clerkUserId: clerkUserId || "user_mock_dev_terminal",
          }),
        }).then(() => {
          mutateUsage();
          onUpgrade();
          
          // Clear query params elegantly without page reloads
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        });
      }
    }
  }, [searchParams, mutateUsage, onUpgrade]);

  return null;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [showUpgradeToast, setShowUpgradeToast] = useState(false);

  // Set mounted state to true on client mount to eliminate hydration mismatches!
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a stable skeleton loading screen that is identical on server and client on first pass!
  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center font-mono text-xs select-none">
        <div className="flex flex-col items-center gap-3">
          <span className="w-5 h-5 rounded-full border border-t-2 border-active animate-spin" />
          <span className="text-text-muted">SYNCHRONIZING TERMINAL SECURITY UTILITIES...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg text-text select-none antialiased overflow-hidden relative">
      {/* Decorative CRT scanline terminal screen overlay for ultimate visual immersion! */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] opacity-30" />

      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main viewport */}
      <div className="flex-grow flex flex-col min-w-0 overflow-hidden relative">
        {/* Header toolbar */}
        <Header />

        {/* Scrollable workspace portal */}
        <main className="flex-grow p-8 overflow-y-auto relative bg-[#090d19]/45">
          <React.Suspense fallback={null}>
            <UpgradeSync onUpgrade={() => setShowUpgradeToast(true)} />
          </React.Suspense>
          
          {children}

          {/* Upgraded celebratory banner toast */}
          {showUpgradeToast && (
            <div className="fixed bottom-6 right-6 z-50 glass-panel border border-correct rounded-lg p-5 max-w-sm shadow-2xl animate-correct-pop bg-correct/5 mono-game select-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-correct font-bold text-sm">⚡ SYSTEM INSTANTLY UPGRADED!</span>
                  <span className="text-text-muted text-[10px] leading-relaxed">
                    Subscription active. All limits cleared. Unlimited Claude 3.5 Sonnet processing enabled!
                  </span>
                </div>
                <button
                  onClick={() => setShowUpgradeToast(false)}
                  className="text-text-muted hover:text-text font-bold text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
