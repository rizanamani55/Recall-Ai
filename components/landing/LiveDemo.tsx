// components/landing/LiveDemo.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useGameState } from "@/hooks/useGameState";
import { TypewriterText } from "../study/TypewriterText";
import { ProgressHUD } from "../study/ProgressHUD";
import { KeyboardInput } from "../study/KeyboardInput";
import { FeedbackOverlay } from "../study/FeedbackOverlay";
import type { ClozeCard } from "@/types/card";

const MOCK_DEMO_CARDS: ClozeCard[] = [
  {
    id: "demo-1",
    sentence: "Myocardial infarction is a life-threatening medical emergency caused by the complete occlusion of a {{coronary artery}}.",
    blanks: [
      { term: "coronary artery", hint: "Main blood supply vessel of the heart", position: 104 }
    ]
  },
  {
    id: "demo-2",
    sentence: "This blockage leads to {{ischemia}}, depriving the myocardium of vital {{oxygen}}, which rapidly results in cardiac cell necrosis.",
    blanks: [
      { term: "ischemia", hint: "Inadequate blood supply to tissues", position: 23 },
      { term: "oxygen", hint: "Essential metabolic gas (O2)", position: 68 }
    ]
  },
  {
    id: "demo-3",
    sentence: "Symptoms typically include crushing substernal {{chest pain}}, often radiating to the {{left arm}}.",
    blanks: [
      { term: "chest pain", hint: "Angina pectoris clinical presentation", position: 46 },
      { term: "left arm", hint: "Common radiation pathway for cardiac pain", position: 86 }
    ]
  }
];

export function LiveDemo() {
  const {
    state,
    submitAnswer,
    revealAnswer,
    skipCard,
    updateUserInput,
    resetBlankStatus,
    resetGame,
  } = useGameState(MOCK_DEMO_CARDS);

  const [typewriterComplete, setTypewriterComplete] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const currentCard = state.cards[state.currentCardIndex];
  const activeBlankState = state.blanks[state.currentCardIndex]?.[state.currentBlankIndex];

  // Auto-clear wrong answer after delay
  useEffect(() => {
    if (activeBlankState?.status === "wrong") {
      const timer = setTimeout(() => {
        resetBlankStatus(state.currentCardIndex, state.currentBlankIndex);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeBlankState?.status, state.currentCardIndex, state.currentBlankIndex, resetBlankStatus]);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg glass-panel p-6 shadow-2xl relative select-none border border-border-card bg-[#0b1121]/90">
      <div className="absolute top-0 right-4 translate-y-[-50%] px-2.5 py-0.5 rounded bg-active border border-active text-bg text-[10px] font-bold tracking-widest uppercase">
        Live Sandbox Widget
      </div>

      <div className="flex flex-col gap-5">
        {/* Progress Dashboard */}
        <ProgressHUD
          current={state.currentCardIndex + 1}
          total={state.cards.length}
          score={state.score}
          streak={state.streak}
        />

        {/* Game Engine Area */}
        <div className="relative min-h-[160px] bg-bg/85 border border-border-card/65 rounded p-5 flex flex-col justify-center shadow-inner overflow-hidden">
          <FeedbackOverlay status={activeBlankState?.status || "idle"} />

          {!state.isComplete && currentCard ? (
            <TypewriterText
              sentence={currentCard.sentence}
              blanksStates={state.blanks[state.currentCardIndex]}
              currentBlankIndex={state.currentBlankIndex}
              isActiveCard={true}
              onTypewriterComplete={() => setTypewriterComplete(true)}
              updateUserInput={(blankIdx, val) => updateUserInput(state.currentCardIndex, blankIdx, val)}
              submitAnswer={submitAnswer}
              revealAnswer={revealAnswer}
              skipCard={skipCard}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center py-4 animate-correct-pop font-mono">
              <span className="text-correct text-2xl font-bold">🎉 DEMO COMPLETED!</span>
              <span className="text-text-muted text-sm max-w-sm">
                You scored <strong className="text-correct">{state.score}</strong> points. That is the typewriter focus effect!
              </span>
              <button
                onClick={resetGame}
                className="mt-2 px-6 py-2 bg-correct text-bg hover:bg-correct/90 transition-all font-bold uppercase rounded text-xs tracking-wider border border-correct"
              >
                🔄 Play Again
              </button>
            </div>
          )}
        </div>

        {/* Keyboard controller indicators */}
        <KeyboardInput showHelp={showHelp} onToggleHelp={() => setShowHelp(prev => !prev)} />
      </div>
    </div>
  );
}
