// components/study/ProgressHUD.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProgressHUDProps {
  current: number;
  total: number;
  score: number;
  streak: number;
}

export function ProgressHUD({ current, total, score, streak }: ProgressHUDProps) {
  const progressPercent = total > 0 ? (current / total) * 100 : 0;
  const multiplier = 1 + streak * 0.1;

  return (
    <div className="flex flex-col gap-3 w-full bg-surface/50 border border-border-card/60 p-4 rounded-lg mono-game text-sm shadow-inner select-none">
      {/* Top dashboard details */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Card Counter */}
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs uppercase tracking-wider">UNIT DECK</span>
          <span className="px-2 py-0.5 rounded bg-bg text-text font-bold border border-border-card/40">
            {current} OF {total}
          </span>
        </div>

        {/* Dynamic Streak Flame Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs uppercase tracking-wider">STREAK</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded border font-bold flex items-center gap-1.5 transition-all duration-300",
              streak > 0
                ? "bg-amber-950/20 border-accent text-accent shadow-[0_0_8px_rgba(217,119,6,0.2)]"
                : "bg-bg border-border-card/40 text-text-muted"
            )}
          >
            <span>{streak}</span>
            {streak > 0 && <span className="animate-pulse">🔥</span>}
          </span>
          {streak > 0 && (
            <span className="text-[10px] text-accent font-bold animate-pulse">
              x{multiplier.toFixed(1)} MULTIPLIER
            </span>
          )}
        </div>

        {/* Score Counter */}
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs uppercase tracking-wider">SCORE</span>
          <span className="px-2 py-0.5 rounded bg-bg text-correct font-bold border border-correct/20 text-right min-w-[70px] tabular-nums">
            {score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Retro loading progress bar */}
      <div className="w-full h-1.5 bg-bg rounded overflow-hidden border border-border-card/30">
        <div
          className="h-full bg-gradient-to-r from-active to-correct transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
