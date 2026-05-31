// components/landing/HowItWorks.tsx
"use client";

import React from "react";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Paste Raw Textbook Text",
      desc: "Paste dense study materials, slides, lecture notes, or textbook definitions. Select your subject target domain (medicine, law, or STEM).",
      icon: "📋",
    },
    {
      num: "02",
      title: "AI Terminology Blanking",
      desc: "Claude Sonnet instantly scans the text, identifies critical examinable terminology and definitions, and generates double-curly-clozed blanks with hints.",
      icon: "🧠",
    },
    {
      num: "03",
      title: "Mechanical Typing Study",
      desc: "Solve sentences by typing exact terms on your mechanical typewriter terminal keyboard. Watch the blur dissolve as you type correctly and rack up multipliers.",
      icon: "⌨️",
    },
  ];

  return (
    <section className="py-20 bg-bg border-b border-border-card relative select-none">
      <div className="container mx-auto px-6 text-center">
        <div className="flex flex-col gap-3 mb-16">
          <h2 className="serif-header text-4xl sm:text-5xl font-bold text-text">
            Three Steps to Mechanical Mastery
          </h2>
          <p className="text-text-muted max-w-lg mx-auto text-sm sm:text-base font-sans">
            How Recall.ai re-engineers textbook studying into active terminal recall games.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col items-start text-left glass-panel rounded-lg p-6 border border-border-card/60 bg-surface/30 relative hover:border-active/40 hover:scale-[1.01] transition-all duration-300 group"
            >
              {/* Step counter */}
              <div className="absolute top-4 right-6 text-6xl font-bold font-serif opacity-[0.04] text-text select-none">
                {step.num}
              </div>

              {/* Icon badge */}
              <div className="w-12 h-12 flex items-center justify-center rounded bg-[#131d33] border border-border-card text-2xl mb-6 shadow-inner">
                {step.icon}
              </div>

              <h3 className="mono-game text-lg font-bold text-text mb-3 flex items-center gap-2 group-hover:text-active transition-colors">
                <span className="text-active font-mono text-xs opacity-70">[{step.num}]</span>
                <span>{step.title}</span>
              </h3>
              
              <p className="text-text-muted text-sm leading-relaxed font-sans">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
