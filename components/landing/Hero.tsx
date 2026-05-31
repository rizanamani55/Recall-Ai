// components/landing/Hero.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Hero() {
  const [simulationState, setSimulationState] = useState<"typing" | "blanking" | "solving" | "correct">("typing");
  const [typedSentence, setTypedSentence] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");

  const sentencePart1 = "The ";
  const targetTerm = "mitochondria";
  const sentencePart2 = " is the powerhouse of the cell.";

  // Auto-run visual typing simulation loop for ultimate landing WOW effect!
  useEffect(() => {
    let active = true;
    
    async function runLoop() {
      while (active) {
        // Step 1: Type full sentence
        setSimulationState("typing");
        setTypedAnswer("");
        setTypedSentence("");
        
        const fullClean = sentencePart1 + targetTerm + sentencePart2;
        for (let i = 0; i <= fullClean.length; i++) {
          if (!active) return;
          setTypedSentence(fullClean.substring(0, i));
          await new Promise((r) => setTimeout(r, 20));
        }

        await new Promise((r) => setTimeout(r, 1200));

        // Step 2: Blank out term
        if (!active) return;
        setSimulationState("blanking");

        await new Promise((r) => setTimeout(r, 1000));

        // Step 3: Auto type the solution character-by-character
        if (!active) return;
        setSimulationState("solving");
        for (let i = 0; i <= targetTerm.length; i++) {
          if (!active) return;
          setTypedAnswer(targetTerm.substring(0, i));
          await new Promise((r) => setTimeout(r, 60));
        }

        // Step 4: Correct answer pop
        if (!active) return;
        setSimulationState("correct");

        await new Promise((r) => setTimeout(r, 2500));
      }
    }

    runLoop();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="relative py-16 md:py-24 border-b border-border-card bg-gradient-to-b from-[#060a14] to-[#0A0F1E] overflow-hidden flex flex-col justify-center select-none">
      {/* Decorative vector grid backgrounds */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left copy section */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          <h1 className="serif-header text-5xl sm:text-6xl md:text-7xl font-bold leading-none tracking-tight text-text">
            Turn any textbook <br />
            <span className="text-active bg-gradient-to-r from-active to-correct bg-clip-text text-transparent">
              into a test.
            </span>{" "}
            In seconds.
          </h1>
          <p className="text-text-muted text-base sm:text-lg max-w-xl font-sans leading-relaxed">
            Recall.ai instantly transforms dense textbook pages and study notes into a
            cloze fill-in-the-blank terminal game. Type exact terms to unlock knowledge.
            Built for professional students in <strong className="text-text">medicine, law, and STEM</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 rounded bg-gradient-to-r from-active to-correct hover:from-active/90 hover:to-correct/90 text-bg hover:scale-[1.02] shadow-[0_4px_20px_rgba(96,165,250,0.25)] font-bold text-sm text-center uppercase tracking-wider transition-all"
            >
              Start Study Session (Free)
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 rounded border border-border-card bg-surface hover:bg-surface-active text-text hover:border-active text-sm text-center uppercase tracking-wider font-bold transition-all"
            >
              Unlock Pro — $12/Mo
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted font-mono mt-4">
            <span className="flex h-2 w-2 rounded-full bg-correct animate-pulse" />
            <span>CLAUDE 3.5 SONNET POWERED CLOZE EXTRACTION</span>
          </div>
        </div>

        {/* Right animated simulation widget */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md glass-panel rounded-lg p-5 border border-border-card/80 bg-[#0e1629] shadow-2xl relative select-none">
            {/* Header chrome */}
            <div className="flex items-center justify-between border-b border-border-card/50 pb-3 mb-4">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              </div>
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">
                SYSTEM SIMULATOR
              </span>
            </div>

            {/* Terminal contents */}
            <div className="min-h-[140px] bg-bg/90 border border-border-card/50 p-4 rounded flex flex-col justify-center shadow-inner font-mono text-sm leading-relaxed text-text select-none">
              {simulationState === "typing" && (
                <div>
                  <span>{typedSentence}</span>
                  <span className="inline-block w-2 h-4 bg-active ml-0.5 align-middle animate-blink" />
                </div>
              )}

              {simulationState === "blanking" && (
                <div>
                  <span>The </span>
                  <span className="bg-active/10 text-transparent blur-[5px] border border-border-card rounded px-1.5 mx-1 inline-block align-middle select-none">
                    mitochondria
                  </span>
                  <span> is the powerhouse of the cell.</span>
                </div>
              )}

              {simulationState === "solving" && (
                <div>
                  <span>The </span>
                  <span className="relative inline-block align-middle mx-1 rounded px-1.5 bg-active/15 text-transparent border border-active pulse-border-active">
                    mitochondria
                    <span className="absolute inset-0 w-full h-full text-center text-text font-bold flex items-center justify-center">
                      {typedAnswer}
                    </span>
                    {typedAnswer.length < targetTerm.length && (
                      <span className="absolute bottom-1 left-[55%] w-1.5 h-0.5 bg-active animate-blink" />
                    )}
                  </span>
                  <span> is the powerhouse of the cell.</span>
                </div>
              )}

              {simulationState === "correct" && (
                <div className="animate-correct-pop">
                  <span>The </span>
                  <span className="inline-block align-middle mx-1 rounded px-1.5 bg-correct/10 text-correct border border-correct font-bold shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                    mitochondria
                  </span>
                  <span> is the powerhouse of the cell.</span>
                  <div className="text-[10px] text-correct font-bold uppercase mt-2 select-none tracking-widest animate-pulse">
                    ✓ CORRECT (+12 pts)
                  </div>
                </div>
              )}
            </div>

            {/* Dashboard summary footer */}
            <div className="flex justify-between items-center text-[10px] text-text-muted font-mono mt-4 border-t border-border-card/30 pt-3">
              <span>SCORE: {simulationState === "correct" ? "120" : "108"}</span>
              <span>STREAK: {simulationState === "correct" ? "4 🔥" : "3"}</span>
              <span>MULTIPLIER: x1.4</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
