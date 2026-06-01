// components/study/TypewriterText.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { parseSentence } from "@/lib/cloze";
import { useTypewriter } from "@/hooks/useTypewriter";
import { BlurredTerm } from "./BlurredTerm";
import type { CardStatus, BlankState } from "@/types/card";

interface TypewriterTextProps {
  sentence: string;
  blanksStates: BlankState[];
  currentBlankIndex: number;
  isActiveCard: boolean;
  onTypewriterComplete?: () => void;
  updateUserInput: (blankIdx: number, value: string) => void;
  submitAnswer: (input: string) => void;
  revealAnswer: () => void;
  skipCard: () => void;
}

export function TypewriterText({
  sentence,
  blanksStates,
  currentBlankIndex,
  isActiveCard,
  onTypewriterComplete,
  updateUserInput,
  submitAnswer,
  revealAnswer,
  skipCard,
}: TypewriterTextProps) {
  const [typewriterActive, setTypewriterActive] = useState(false);

  // We parse the tokens
  const tokens = useMemo(() => {
    const blankTerms = blanksStates.map((b) => b.term);
    return parseSentence(sentence, blankTerms);
  }, [sentence, blanksStates]);

  // We construct the "cleaned" sentence to type out
  const cleanedSentence = useMemo(() => {
    return tokens.map((t) => t.text).join("");
  }, [tokens]);

  // Compute character ranges for each token in the cleaned sentence
  const tokenRanges = useMemo(() => {
    const ranges: { start: number; end: number }[] = [];
    let currentOffset = 0;
    tokens.forEach((token) => {
      const len = token.text.length;
      ranges.push({
        start: currentOffset,
        end: currentOffset + len,
      });
      currentOffset += len;
    });
    return ranges;
  }, [tokens]);

  // Start typewriter when card is active
  useEffect(() => {
    if (isActiveCard) {
      setTypewriterActive(true);
    }
  }, [isActiveCard, sentence]);

  // Custom mechanical reveal
  const { displayText, isComplete } = useTypewriter(
    cleanedSentence,
    18, // 18ms speed per character
    typewriterActive,
    onTypewriterComplete
  );

  const typewriterLength = displayText.length;

  return (
    <div className="mono-game text-xl leading-relaxed text-text tracking-wide whitespace-pre-wrap">
      {tokens.map((token, index) => {
        const range = tokenRanges[index];

        // If the typewriter hasn't reached the start of this token, don't show it yet
        if (typewriterLength < range.start) {
          return null;
        }

        if (token.type === "text") {
          // Render character-by-character substring of text
          const showCount = typewriterLength - range.start;
          return (
            <span key={index} className="text-text opacity-95">
              {token.text.substring(0, showCount)}
            </span>
          );
        } else {
          // Render the blank
          const blankIdx = token.blankIndex ?? 0;
          const blankState = blanksStates[blankIdx];
          
          if (!blankState) return null;

          const isCurrentActive = isActiveCard && blankIdx === currentBlankIndex;

          // Determine blank status: directly use the engine state
          const status: CardStatus = blankState.status;

          return (
            <BlurredTerm
              key={index}
              term={token.text}
              hint={isActiveCard ? sentence : undefined} // Context hint
              status={status}
              userInput={blankState.userInput}
              isActive={isCurrentActive}
              onChange={(val) => updateUserInput(blankIdx, val)}
              onSubmit={() => submitAnswer(blankState.userInput)}
              onReveal={revealAnswer}
              onSkip={skipCard}
            />
          );
        }
      })}

      {/* Trailing blinking mechanical terminal cursor while typing sentence */}
      {typewriterActive && !isComplete && (
        <span className="inline-block w-2.5 h-5 bg-active ml-0.5 align-middle animate-blink" />
      )}
    </div>
  );
}
