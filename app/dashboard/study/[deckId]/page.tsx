// app/dashboard/study/[deckId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useGameState } from "@/hooks/useGameState";
import { useKeyboardCapture } from "@/hooks/useKeyboardCapture";
import { useUsage } from "@/hooks/useUsage";
import { TypewriterText } from "@/components/study/TypewriterText";
import { ProgressHUD } from "@/components/study/ProgressHUD";
import { KeyboardInput } from "@/components/study/KeyboardInput";
import { FeedbackOverlay } from "@/components/study/FeedbackOverlay";
import { HintSystem } from "@/components/study/HintSystem";
import { SessionSummary } from "@/components/study/SessionSummary";
import { useUser } from "@/lib/auth-client";

interface StudyPageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default function StudyDeckPage({ params }: StudyPageProps) {
  const resolvedParams = React.use(params);
  const deckId = resolvedParams.deckId;
  const { usage } = useUsage();
  const { user } = useUser();
  
  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [typewriterComplete, setTypewriterComplete] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [maxStreak, setMaxStreak] = useState(0);

  // Fetch saved deck cards
  useEffect(() => {
    async function loadDeckData() {
      if (!user) return;
      try {
        const res = await fetch(`/api/decks/${deckId}`);
        if (!res.ok) {
          throw new Error("Failed to load study deck library");
        }
        const data = await res.json();
        setDeck(data.deck);
        setCards(data.cards);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Failed to load study deck.");
      } finally {
        setLoading(false);
      }
    }

    loadDeckData();
  }, [deckId, user]);

  // Hook game state engine
  const {
    state,
    submitAnswer,
    revealAnswer,
    skipCard,
    updateUserInput,
    resetBlankStatus,
    resetGame,
  } = useGameState(cards);

  // Update highest streak score tracking
  useEffect(() => {
    if (state.streak > maxStreak) {
      setMaxStreak(state.streak);
    }
  }, [state.streak, maxStreak]);

  // Hook global keyboard captures safely in-game
  const currentCard = state.cards[state.currentCardIndex];
  const activeBlankState = state.blanks[state.currentCardIndex]?.[state.currentBlankIndex];

  useKeyboardCapture(
    {
      onSubmit: () => {
        if (activeBlankState && !state.isComplete) {
          submitAnswer(activeBlankState.userInput);
        }
      },
      onReveal: () => {
        if (activeBlankState && !state.isComplete) {
          revealAnswer();
        }
      },
      onSkip: () => {
        if (activeBlankState && !state.isComplete) {
          skipCard();
        }
      },
      onToggleHelp: () => {
        setShowHelp((prev) => !prev);
      },
    },
    !loading && cards.length > 0 && !state.isComplete
  );

  // Auto-revert wrong answer styling indicators after delay
  useEffect(() => {
    if (activeBlankState?.status === "wrong") {
      const timer = setTimeout(() => {
        resetBlankStatus(state.currentCardIndex, state.currentBlankIndex);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeBlankState?.status, state.currentCardIndex, state.currentBlankIndex, resetBlankStatus]);

  // Reset completion trackers when card changes
  useEffect(() => {
    setTypewriterComplete(false);
  }, [state.currentCardIndex]);

  const userPlan = usage?.plan ?? "free";

  const handleUpgradeRedirect = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "pro_monthly" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = "/dashboard?mockUpgradeSession=success";
      }
    } catch (err) {
      window.location.href = "/dashboard?mockUpgradeSession=success";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center font-mono text-xs text-text-muted">
        <div className="flex flex-col items-center gap-3">
          <span className="w-5 h-5 rounded-full border border-t-2 border-active animate-spin" />
          <span>SYNCHRONIZING SAVED STUDY PASSAGE CARDS...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || cards.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8 rounded-lg border border-border-card/65 bg-surface/10 mt-12 font-mono text-xs">
        <span className="text-3xl block mb-3">⚠️</span>
        <span className="text-text font-bold uppercase block mb-1">Study Deck Load Error</span>
        <span className="text-text-muted leading-relaxed block mb-6">
          {errorMsg || "This study deck does not contain any cards. Please delete it and convert a new passage."}
        </span>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 bg-active hover:scale-[1.01] text-bg rounded font-bold uppercase"
        >
          ← Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 text-left font-sans select-none relative animate-correct-pop min-h-[400px] justify-center">
      {/* Session Header details */}
      {!state.isComplete && deck && (
        <div className="flex flex-col border-b border-border-card/35 pb-5">
          <h1 className="serif-header text-3xl font-bold text-text truncate">{deck.title}</h1>
          <p className="text-text-muted text-xs font-mono uppercase tracking-wider mt-1">
            Active Study Mode &bull; {deck.subject} target domain
          </p>
        </div>
      )}

      {/* Main active game engine */}
      {!state.isComplete && currentCard ? (
        <div className="flex flex-col gap-5">
          {/* Dashboard HUD statistics panel */}
          <ProgressHUD
            current={state.currentCardIndex + 1}
            total={state.cards.length}
            score={state.score}
            streak={state.streak}
          />

          {/* Active sentence typing workspace */}
          <div className="relative min-h-[160px] bg-bg border border-border-card/75 rounded-lg p-6 flex flex-col justify-center shadow-inner overflow-hidden">
            {/* Visual glow feedback indicators */}
            <FeedbackOverlay status={activeBlankState?.status || "idle"} />

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
          </div>

          {/* Interactive hints selectors */}
          {typewriterComplete && activeBlankState && (
            <HintSystem
              hintText={activeBlankState.term} // Fallback contextual hints
              term={activeBlankState.term}
              userPlan={userPlan}
              onUpgradeClick={handleUpgradeRedirect}
              onReveal={() => updateUserInput(state.currentCardIndex, state.currentBlankIndex, activeBlankState.term)}
            />
          )}

          {/* Keyboard input reference manual */}
          <KeyboardInput showHelp={showHelp} onToggleHelp={() => setShowHelp((p) => !p)} />
        </div>
      ) : (
        /* End-of-deck summary results overlay */
        <SessionSummary
          totalCards={state.cards.length}
          finalScore={state.score}
          maxStreak={maxStreak}
          userPlan={userPlan}
          onRestart={resetGame}
          onUpgradeClick={handleUpgradeRedirect}
        />
      )}
    </div>
  );
}
