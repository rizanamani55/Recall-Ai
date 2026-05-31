// components/landing/FeatureGrid.tsx
"use client";

import React from "react";

export function FeatureGrid() {
  const features = [
    {
      title: "AI Keyphrase Extraction",
      desc: "Claude Sonnet reads dense passages and extracts genuinely examinable vocabulary and values, bypassing simple filler words.",
      icon: "⚡",
    },
    {
      title: "Typewriter Authentic",
      desc: "Each card is rendered with an 18ms character tick and auto-clicking soundscapes that match your real typing flow.",
      icon: "⏳",
    },
    {
      title: "Chemical Blur-Reveal",
      desc: "Blanks are obscured in a glass-morphic blur. Typing correct terms triggers a scale bounce and dissolves the blur.",
      icon: "🧪",
    },
    {
      title: "Spaced Repetition (SRS)",
      desc: "Review logs are logged. Automatically reschedule decks based on card difficulty and streak multipliers (coming soon).",
      icon: "🔄",
    },
    {
      title: "Progress Analytics",
      desc: "Track daily conversion counts, active streaks, correct ratios, and accuracy ratings directly in your dashboard.",
      icon: "📊",
    },
    {
      title: "Data Deck Export",
      desc: "Pro members can instantly export study decks as standard CSV spreadsheets for backing up cards to Anki or Quizlet.",
      icon: "📤",
    },
  ];

  return (
    <section className="py-20 bg-bg border-b border-border-card relative select-none">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-3 text-center mb-16">
          <h2 className="serif-header text-4xl sm:text-5xl font-bold text-text">
            Engineered for Serious Study Flow
          </h2>
          <p className="text-text-muted max-w-lg mx-auto text-sm sm:text-base font-sans">
            Every pixel optimized to induce focus and build durable visual recall.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-3 glass-panel rounded-lg p-6 border border-border-card/65 bg-surface/20 hover:border-active/40 transition-colors duration-300 select-none"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-[#131d33] border border-border-card flex items-center justify-center text-sm shadow-inner">
                  {feat.icon}
                </span>
                <h3 className="mono-game text-sm font-bold text-text uppercase tracking-wider">
                  {feat.title}
                </h3>
              </div>
              <p className="text-text-muted text-xs leading-relaxed font-sans mt-1">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
