// app/pricing/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { PricingCards } from "@/components/landing/PricingCards";
import { Footer } from "@/components/landing/Footer";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans select-none antialiased">
      {/* Sticky glassmorphism header navigation */}
      <header className="sticky top-0 z-50 w-full bg-[#060a14]/80 backdrop-blur-md border-b border-border-card/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold select-none text-text hover:opacity-90">
            <span className="text-xl">💾</span>
            <span className="font-mono text-sm tracking-widest uppercase">RECALL.AI</span>
          </Link>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded bg-active/20 border border-active text-active hover:bg-active hover:text-bg font-mono text-xs font-bold transition-all"
          >
            ← Back to Terminal
          </Link>
        </div>
      </header>

      {/* Pricing workspace */}
      <main className="flex-grow flex flex-col justify-center py-12">
        <PricingCards />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
