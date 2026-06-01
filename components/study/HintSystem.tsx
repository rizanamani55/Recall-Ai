// components/study/HintSystem.tsx
"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface HintSystemProps {
  hintText?: string;
  term: string;
  userPlan: string;
  onUpgradeClick: () => void;
  onReveal: () => void;
}

export function HintSystem({ hintText, term, userPlan, onUpgradeClick, onReveal }: HintSystemProps) {
  const [showHint, setShowHint] = useState(false);
  const [firstLetterRevealed, setFirstLetterRevealed] = useState(false);

  // Reset hint toggles when moving to a new card/term
  useEffect(() => {
    setShowHint(false);
    setFirstLetterRevealed(false);
  }, [term]);

  const isPro = userPlan === "pro";

  const handleContextHintClick = () => {
    setShowHint(true);
  };

  const handleFirstLetterClick = () => {
    if (!isPro) {
      onUpgradeClick();
      return;
    }
    setFirstLetterRevealed(true);
  };

  return (
    <div className="flex flex-col gap-2.5 w-full bg-surface/30 border border-border-card/40 p-4 rounded-lg font-mono text-sm">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-xs uppercase tracking-wider">Assistance Core</span>
        <div className="flex items-center gap-2">
          {/* Contextual Hint */}
          {!showHint ? (
            <button
              onClick={handleContextHintClick}
              className="px-2.5 py-1 text-xs rounded border border-active/40 bg-active/5 hover:bg-active/20 text-active hover:text-text transition-colors duration-200"
            >
              💡 Show Context Hint
            </button>
          ) : (
            <span className="text-xs text-active/80 animate-pulse font-bold">Hint Active</span>
          )}

          {/* First Letter Hint */}
          {!firstLetterRevealed ? (
            <button
              onClick={handleFirstLetterClick}
              className="px-2.5 py-1 text-xs rounded border border-accent/40 bg-accent/5 hover:bg-accent/20 text-accent hover:text-text flex items-center gap-1 transition-colors duration-200"
            >
              <span>🔠 First Letter</span>
              {!isPro && <span className="text-[10px] text-accent/80 opacity-70">🔒 Pro</span>}
            </button>
          ) : (
            <span className="text-xs text-accent/80 font-bold">First Letter Active</span>
          )}

          {/* Reveal Answer */}
          <button
            onClick={onReveal}
            className="px-2.5 py-1 text-xs rounded border border-wrong/40 bg-wrong/5 hover:bg-wrong/20 text-wrong hover:text-text transition-colors duration-200 ml-2"
          >
            👁️ Reveal Answer
          </button>
        </div>
      </div>

      {/* Hints display output */}
      {(showHint || firstLetterRevealed) && (
        <div className="mt-1 flex flex-col gap-1.5 p-3 rounded bg-bg/60 border border-border-card/30 animate-correct-pop text-sm">
          {showHint && hintText && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-text-muted uppercase">Concept Hint:</span>
              <span className="text-text font-medium text-xs leading-relaxed italic">
                &ldquo;{hintText}&rdquo;
              </span>
            </div>
          )}
          {firstLetterRevealed && (
            <div className="flex flex-col gap-0.5 mt-1 border-t border-border-card/20 pt-1.5">
              <span className="text-[10px] text-text-muted uppercase">First Letter:</span>
              <span className="text-accent font-bold text-xs uppercase">
                The blank starts with &ldquo;{term.trim().charAt(0)}&rdquo;
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
