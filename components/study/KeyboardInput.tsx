// components/study/KeyboardInput.tsx
"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface KeyboardInputProps {
  showHelp: boolean;
  onToggleHelp: () => void;
}

export function KeyboardInput({ showHelp, onToggleHelp }: KeyboardInputProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let keyLabel = "";
      if (e.key === "Enter") {
        if (e.ctrlKey || e.metaKey) keyLabel = "ctrl-enter";
        else keyLabel = "enter";
      }
      else if (e.key === "Tab") keyLabel = "tab";
      else if (e.key === " ") keyLabel = "space";
      else if (e.key === "?") keyLabel = "question";

      if (keyLabel) {
        setActiveKey(keyLabel);
        const t = setTimeout(() => setActiveKey(null), 150);
        return () => clearTimeout(t);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col items-center w-full gap-2">
      {/* Dynamic Keybinding Pill Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs mono-game text-text-muted mt-2 border-t border-border-card/30 pt-4 w-full max-w-lg">
        <div className="flex items-center gap-1.5">
          <kbd
            className={cn(
              "px-1.5 py-0.5 rounded border border-border bg-surface font-mono transition-colors text-[10px]",
              activeKey === "enter" && "bg-active border-active text-bg"
            )}
          >
            ⏎ Enter
          </kbd>
          <span>Submit</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd
            className={cn(
              "px-1.5 py-0.5 rounded border border-border bg-surface font-mono transition-colors text-[10px]",
              activeKey === "tab" && "bg-amber-500 border-amber-500 text-bg"
            )}
          >
            ⇥ Tab
          </kbd>
          <span>Skip / Switch</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd
            className={cn(
              "px-1.5 py-0.5 rounded border border-border bg-surface font-mono transition-colors text-[10px]",
              activeKey === "space" && "bg-correct border-correct text-bg"
            )}
          >
            ␣ Space
          </kbd>
          <span>Next Card</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd
            onClick={onToggleHelp}
            className={cn(
              "px-1.5 py-0.5 rounded border border-border bg-surface font-mono cursor-pointer transition-colors text-[10px] hover:border-active hover:text-text",
              (activeKey === "question" || showHelp) && "bg-active border-active text-bg"
            )}
          >
            ? Help
          </kbd>
          <span>Shortcuts</span>
        </div>
      </div>

      {/* Modal Help Reference Overlay */}
      {showHelp && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-lg p-6 max-w-md w-full border border-border-card animate-correct-pop flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="serif-header text-2xl text-accent font-bold">Terminal Reference Manual</h3>
              <button
                onClick={onToggleHelp}
                className="text-text-muted hover:text-text text-xl font-mono"
              >
                ×
              </button>
            </div>
            
            <div className="flex flex-col gap-3 font-mono text-sm">
              <div className="flex justify-between items-center py-1 border-b border-border-card/30">
                <span className="text-text-muted">Submit Cloze Card</span>
                <kbd className="px-2 py-1 rounded bg-surface border border-border">Enter</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-card/30">
                <span className="text-text-muted">Skip / Switch Card</span>
                <kbd className="px-2 py-1 rounded bg-surface border border-border">Tab</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-card/30">
                <span className="text-text-muted">Toggle Shortcuts Manual</span>
                <kbd className="px-2 py-1 rounded bg-surface border border-border">?</kbd>
              </div>
            </div>

            <div className="text-xs text-text-muted font-sans italic mt-2 text-center bg-surface/50 p-2.5 rounded border border-border-card">
              Type the answers exactly as they are blanked out. Correct entries automatically light up. Reveal Answer key shows the correct answer at the cost of your current streak.
            </div>

            <button
              onClick={onToggleHelp}
              className="mt-2 w-full py-2 bg-active/20 border border-active text-active hover:bg-active hover:text-bg transition-colors font-mono rounded text-sm uppercase font-bold"
            >
              Close Reference
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
