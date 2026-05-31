// app/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { PricingCards } from "@/components/landing/PricingCards";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const subjects = [
    { label: "USMLE", color: "text-blue-400 border-blue-400/30 bg-blue-500/5" },
    { label: "MCAT", color: "text-red-400 border-red-400/30 bg-red-500/5" },
    { label: "Bar Exam", color: "text-amber-400 border-amber-400/30 bg-amber-500/5" },
    { label: "Medicine", color: "text-correct border-correct/30 bg-correct/5" },
    { label: "Pharmacy", color: "text-purple-400 border-purple-400/30 bg-purple-500/5" },
    { label: "STEM", color: "text-pink-400 border-pink-400/30 bg-pink-500/5" },
    { label: "Neurology", color: "text-indigo-400 border-indigo-400/30 bg-indigo-500/5" },
    { label: "US Patent Law", color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/5" },
  ];

  const testimonials = [
    {
      quote: "The mechanical sound feedback combined with the visual blur-reveal is complete dopamine. I spent 4 hours memorizing neurology pathways and it felt like 15 minutes.",
      author: "Sarah K.",
      role: "M4 Medical Student, Johns Hopkins",
    },
    {
      quote: "Before Recall.ai, memorizing contract definitions and restatement clauses was a chore. Now it is a high-speed terminal game. My retention score jumped to 94% on practice tests.",
      author: "Marcus L.",
      role: "L2 Law Student, NYU Law",
    },
    {
      quote: "If you are studying for USMLE or MCAT, this is the ultimate tool. You paste a dense biology passage and instantly have an interactive game. Highly recommended.",
      author: "Dr. David V.",
      role: "Resident Physician, Stanford Med",
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans select-none antialiased">
      {/* Sticky glassmorphism header navigation */}
      <header className="sticky top-0 z-50 w-full bg-[#060a14]/80 backdrop-blur-md border-b border-border-card/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold select-none text-text hover:opacity-90">
            <span className="text-xl">💾</span>
            <span className="font-mono text-sm tracking-widest uppercase">RECALL.AI</span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono text-text-muted">
            <a href="#how-it-works" className="hover:text-text transition-colors">How It Works</a>
            <a href="#live-demo" className="hover:text-text transition-colors">Sandbox Demo</a>
            <a href="#features" className="hover:text-text transition-colors">Features</a>
            <a href="#pricing" className="hover:text-text transition-colors">Pricing</a>
          </nav>

          {/* User CTA Actions */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded bg-gradient-to-r from-active to-correct hover:from-active/90 hover:to-correct/90 text-bg font-bold hover:scale-[1.02] transition-all shadow-[0_2px_10px_rgba(96,165,250,0.2)]"
            >
              Start Now →
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden p-2 text-text hover:text-active focus:outline-none"
          >
            <span className="text-xl">{mobileMenuOpen ? "×" : "≡"}</span>
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full bg-[#0a0f1e] border-b border-border-card/60 p-6 flex flex-col gap-4 text-sm font-mono text-text-muted animate-correct-pop">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-text transition-colors">How It Works</a>
            <a href="#live-demo" onClick={() => setMobileMenuOpen(false)} className="hover:text-text transition-colors">Sandbox Demo</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-text transition-colors">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-text transition-colors">Pricing</a>
            <div className="h-px bg-border-card/30 my-2" />
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 bg-gradient-to-r from-active to-correct text-bg text-center font-bold rounded"
            >
              Start Now →
            </Link>
          </div>
        )}
      </header>

      {/* Main pages container */}
      <main className="flex-grow">
        {/* Hero split section */}
        <Hero />

        {/* Dynamic Subject Badges Grid */}
        <section className="py-8 bg-bg border-b border-border-card/30 flex items-center justify-center select-none overflow-hidden">
          <div className="container mx-auto px-6 text-center flex flex-col gap-4">
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">
              POPULAR DISCIPLINE SCHOLARSHIPS
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {subjects.map((sub, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "px-3 py-1.5 rounded-full border font-mono text-xs font-medium cursor-default transition-all duration-300 hover:scale-[1.05] hover:opacity-100 opacity-90",
                    sub.color
                  )}
                >
                  {sub.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works section */}
        <div id="how-it-works">
          <HowItWorks />
        </div>

        {/* Embedded Interactive Live Demo Sandbox */}
        <section id="live-demo" className="py-20 bg-bg border-b border-border-card relative select-none">
          <div className="container mx-auto px-6 text-center">
            <div className="flex flex-col gap-3 mb-12">
              <h2 className="serif-header text-4xl sm:text-5xl font-bold text-text">
                Try the Typewriter Recaller Now
              </h2>
              <p className="text-text-muted max-w-lg mx-auto text-sm sm:text-base font-sans">
                Experience the flow state of mechanical spaced-repetition. No login required.
              </p>
            </div>
            
            <LiveDemo />
          </div>
        </section>

        {/* Features list Grid */}
        <div id="features">
          <FeatureGrid />
        </div>

        {/* Student Testimonials */}
        <section className="py-20 bg-[#080d1a] border-b border-border-card relative select-none">
          <div className="container mx-auto px-6 text-center">
            <div className="flex flex-col gap-3 mb-16">
              <h2 className="serif-header text-4xl sm:text-5xl font-bold text-text">
                Approved by Motivated Students
              </h2>
              <p className="text-text-muted max-w-lg mx-auto text-sm sm:text-base font-sans">
                Real feedback from students studying for advanced credentials and exams.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((test, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-6 text-left glass-panel rounded-lg p-6 border border-border-card/60 bg-surface/10 select-none relative"
                >
                  {/* Decorative terminal quotes symbol */}
                  <span className="text-active font-serif text-5xl opacity-20 absolute top-4 left-4">
                    &ldquo;
                  </span>

                  <p className="text-text font-sans text-sm italic leading-relaxed relative z-10 pl-4">
                    {test.quote}
                  </p>
                  
                  <div className="flex flex-col gap-1 border-t border-border-card/30 pt-4 pl-4 font-mono">
                    <span className="text-text text-xs font-bold">{test.author}</span>
                    <span className="text-text-muted text-[10px] uppercase leading-none mt-0.5">
                      {test.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing columns section */}
        <div id="pricing">
          <PricingCards />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
