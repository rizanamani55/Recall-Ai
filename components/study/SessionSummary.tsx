// components/study/SessionSummary.tsx
"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { playCarriageReturn } from "@/lib/typewriterSound";

interface SessionSummaryProps {
  totalCards: number;
  finalScore: number;
  maxStreak: number;
  userPlan: string;
  onRestart: () => void;
  onUpgradeClick: () => void;
}

export function SessionSummary({
  totalCards,
  finalScore,
  maxStreak,
  userPlan,
  onRestart,
  onUpgradeClick,
}: SessionSummaryProps) {
  // Play typewriter bell ring on initial render to celebrate completion!
  React.useEffect(() => {
    playCarriageReturn();
  }, []);

  const isPro = userPlan === "pro";

  const handleExportClick = () => {
    if (!isPro) {
      onUpgradeClick();
      return;
    }
    // Simulate a CSV download for high-quality mock
    const csvContent = "data:text/csv;charset=utf-8,Card,Sentence\n" + 
      "Recall.ai Session Completed successfully!";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "recall_ai_deck_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full glass-panel border border-border-card rounded-lg p-6 max-w-lg mx-auto flex flex-col items-center gap-6 text-center animate-correct-pop mono-game shadow-2xl relative select-none">
      {/* Dynamic light bursts */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-correct to-transparent" />

      {/* Retro mechanical badge */}
      <div className="flex flex-col gap-1.5 items-center">
        <div className="text-correct font-bold text-3xl animate-pulse">🎉 SESSION COMPLETE</div>
        <div className="text-text-muted text-xs uppercase tracking-widest mt-1">TRANSMISSION TERMINATED</div>
      </div>

      {/* Grid statistics columns */}
      <div className="grid grid-cols-2 gap-4 w-full mt-2">
        {/* Score Block */}
        <div className="flex flex-col gap-1 p-3.5 rounded bg-bg/70 border border-border-card/40">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Total Score</span>
          <span className="text-2xl text-correct font-bold">{finalScore.toLocaleString()}</span>
        </div>

        {/* Cards Block */}
        <div className="flex flex-col gap-1 p-3.5 rounded bg-bg/70 border border-border-card/40">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Cards Solved</span>
          <span className="text-2xl text-text font-bold">{totalCards}</span>
        </div>

        {/* Max Streak */}
        <div className="flex flex-col gap-1 p-3.5 rounded bg-bg/70 border border-border-card/40">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Max Streak</span>
          <span className="text-2xl text-accent font-bold">{maxStreak} 🔥</span>
        </div>

        {/* Accuracy */}
        <div className="flex flex-col gap-1 p-3.5 rounded bg-bg/70 border border-border-card/40">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Performance Rating</span>
          <span className="text-xs text-active font-bold mt-1.5 leading-none uppercase">
            {finalScore > totalCards * 15 ? "S-CLASS GENIUS" : finalScore > totalCards * 10 ? "HONORS A Grade" : "PASS STATUS"}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2.5 w-full mt-4">
        {/* Restart */}
        <button
          onClick={onRestart}
          className="w-full py-2.5 bg-correct text-bg hover:bg-correct/90 transition-colors rounded font-bold uppercase text-sm"
        >
          🔄 Study Again (Reset)
        </button>

        {/* Export */}
        <button
          onClick={handleExportClick}
          className="w-full py-2.5 bg-surface border border-border-card/85 text-text hover:bg-surface-active hover:border-active transition-all rounded font-bold uppercase text-sm flex items-center justify-center gap-1.5"
        >
          <span>📥 Export study data (CSV)</span>
          {!isPro && <span className="px-1.5 py-0.5 rounded bg-accent/20 border border-accent text-accent text-[9px]">🔒 Pro Only</span>}
        </button>

        {/* Decks home */}
        <Link
          href="/dashboard"
          className="w-full py-2 bg-transparent border border-border-card text-text-muted hover:text-text hover:border-text-muted transition-colors rounded text-xs uppercase text-center mt-1"
        >
          ← Back to Library Decks
        </Link>
      </div>
    </div>
  );
}
