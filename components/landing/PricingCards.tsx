// components/landing/PricingCards.tsx
"use client";

import React from "react";
import Link from "next/link";

export function PricingCards() {
  return (
    <section className="py-20 bg-bg/95 border-b border-border-card relative select-none">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-3 text-center mb-12">
          <h2 className="serif-header text-4xl sm:text-5xl font-bold text-text">
            100% Free & Unrestricted Sandbox
          </h2>
          <p className="text-text-muted max-w-lg mx-auto text-sm sm:text-base font-sans">
            No credit cards, no monthly subscriptions. Recall.ai is completely free.
          </p>
        </div>

        {/* Centered single pricing dashboard card representing Unlimited Free Edition */}
        <div className="max-w-xl mx-auto border-2 border-active rounded-lg p-8 bg-surface/20 text-left select-none relative transition-all duration-300 shadow-[0_0_25px_rgba(96,165,250,0.15)] flex flex-col gap-6">
          <div className="absolute top-0 right-6 translate-y-[-50%] px-3 py-0.5 rounded bg-correct text-bg text-[10px] font-bold tracking-widest uppercase font-mono animate-pulse">
            Active Recall Open Source
          </div>

          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1 text-left">
              <h3 className="mono-game text-xl font-bold text-active">UNLIMITED FREE EDITION</h3>
              <p className="text-text-muted text-xs font-sans">Built for advanced medical, law, and STEM students</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-correct font-mono">$0</span>
              <span className="text-[10px] text-text-muted font-mono block">FOREVER EDITION</span>
            </div>
          </div>

          <div className="h-px bg-active/20 w-full" />

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-text font-mono">
            <li className="flex items-center gap-2">
              <span className="text-correct">✓</span>
              <span>UNLIMITED AI conversions</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-correct">✓</span>
              <span>UNLIMITED saved decks</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-correct">✓</span>
              <span>PDF, TXT, MD File Uploads</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-correct">✓</span>
              <span>CSV Study Export support</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-correct">✓</span>
              <span>Optional contextual hints</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-correct">✓</span>
              <span>Typewriter click click soundscapes</span>
            </li>
            <li className="flex items-center gap-2 col-span-1 sm:col-span-2 text-correct font-bold">
              <span>★</span>
              <span>Zero server rate limits (unlimited offline AI)</span>
            </li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-3.5 mt-2">
            <Link
              href="/dashboard"
              className="w-full py-3 bg-active text-bg hover:brightness-110 hover:scale-[1.01] transition-all rounded text-center text-xs font-bold uppercase tracking-widest font-mono"
            >
              Start Recall sandbox free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
