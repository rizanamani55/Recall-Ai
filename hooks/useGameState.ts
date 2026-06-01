// hooks/useGameState.ts
import { useState, useCallback } from "react";
import type { ClozeCard, BlankState } from "@/types/card";

interface GameState {
  cards: ClozeCard[];
  currentCardIndex: number;
  currentBlankIndex: number;
  blanks: BlankState[][];     // blanks[cardIndex][blankIndex]
  score: number;
  streak: number;
  isComplete: boolean;
}

export function useGameState(cards: ClozeCard[]) {
  const [state, setState] = useState<GameState>(() => {
    return {
      cards,
      currentCardIndex: 0,
      currentBlankIndex: 0,
      blanks: cards.map((card, cardIdx) =>
        card.blanks.map((b, blankIdx) => ({
          term: b.term,
          userInput: "",
          status: cardIdx === 0 && blankIdx === 0 ? ("typing" as const) : ("idle" as const),
          attempts: 0,
        }))
      ),
      score: 0,
      streak: 0,
      isComplete: false,
    };
  });

  const updateUserInput = useCallback((cardIdx: number, blankIdx: number, value: string) => {
    setState((prev) => {
      const newBlanks = prev.blanks.map((cardBlanks, ci) =>
        cardBlanks.map((b, bi) =>
          ci === cardIdx && bi === blankIdx
            ? { ...b, userInput: value, status: b.status === "wrong" ? ("typing" as const) : b.status }
            : b
        )
      );
      return {
        ...prev,
        blanks: newBlanks,
      };
    });
  }, []);

  const resetBlankStatus = useCallback((cardIdx: number, blankIdx: number) => {
    setState((prev) => {
      const newBlanks = prev.blanks.map((cardBlanks, ci) =>
        cardBlanks.map((b, bi) =>
          ci === cardIdx && bi === blankIdx
            ? { ...b, status: "typing" as const }
            : b
        )
      );
      return {
        ...prev,
        blanks: newBlanks,
      };
    });
  }, []);

  const submitAnswer = useCallback((input: string) => {
    setState((prev) => {
      const { currentCardIndex, currentBlankIndex, blanks, cards: stateCards } = prev;
      
      if (stateCards.length === 0) return prev;
      
      const cardBlanks = blanks[currentCardIndex];
      const blank = cardBlanks[currentBlankIndex];
      
      const isCorrect = input.trim().toLowerCase() === blank.term.trim().toLowerCase();

      // Transition helpers
      const totalBlanksOnCard = stateCards[currentCardIndex].blanks.length;
      
      let nextBlankIndex = currentBlankIndex;
      let nextCardIndex = currentCardIndex;
      let isComplete = prev.isComplete;

      if (isCorrect) {
        // If correct, move to next blank index on card
        const isLastBlankOnCard = currentBlankIndex + 1 >= totalBlanksOnCard;
        if (isLastBlankOnCard) {
          // Move to next card
          const isLastCard = currentCardIndex + 1 >= stateCards.length;
          if (isLastCard) {
            isComplete = true;
          } else {
            nextCardIndex = currentCardIndex + 1;
            nextBlankIndex = 0;
          }
        } else {
          nextBlankIndex = currentBlankIndex + 1;
        }
      }

      const newBlanks = blanks.map((cBlanks, ci) =>
        cBlanks.map((b, bi) =>
          ci === currentCardIndex && bi === currentBlankIndex
            ? {
                ...b,
                userInput: input,
                status: isCorrect ? ("correct" as const) : ("wrong" as const),
                attempts: b.attempts + 1,
              }
            : ci === nextCardIndex && bi === nextBlankIndex && !isComplete
            ? { ...b, status: "typing" as const }
            : b
        )
      );

      // Calculate score using dynamic multiplier: score + base(10) * multiplier(1 + streak * 0.1)
      const basePoints = 10;
      const pointsGained = isCorrect ? Math.round(basePoints * (1 + prev.streak * 0.1)) : 0;

      return {
        ...prev,
        blanks: newBlanks,
        currentCardIndex: nextCardIndex,
        currentBlankIndex: nextBlankIndex,
        score: prev.score + pointsGained,
        streak: isCorrect ? prev.streak + 1 : 0,
        isComplete,
      };
    });
  }, []);

  const revealAnswer = useCallback(() => {
    setState((prev) => {
      const { currentCardIndex, currentBlankIndex, blanks, cards: stateCards } = prev;
      if (stateCards.length === 0) return prev;

      const cardBlanks = blanks[currentCardIndex];
      const blank = cardBlanks[currentBlankIndex];

      const totalBlanksOnCard = stateCards[currentCardIndex].blanks.length;
      const isLastBlankOnCard = currentBlankIndex + 1 >= totalBlanksOnCard;

      let nextBlankIndex = currentBlankIndex;
      let nextCardIndex = currentCardIndex;
      let isComplete = prev.isComplete;

      if (isLastBlankOnCard) {
        const isLastCard = currentCardIndex + 1 >= stateCards.length;
        if (isLastCard) {
          isComplete = true;
        } else {
          nextCardIndex = currentCardIndex + 1;
          nextBlankIndex = 0;
        }
      } else {
        nextBlankIndex = currentBlankIndex + 1;
      }

      const newBlanks = blanks.map((cBlanks, ci) =>
        cBlanks.map((b, bi) =>
          ci === currentCardIndex && bi === currentBlankIndex
            ? { ...b, status: "revealed" as const, userInput: b.term }
            : ci === nextCardIndex && bi === nextBlankIndex && !isComplete
            ? { ...b, status: "typing" as const }
            : b
        )
      );

      return {
        ...prev,
        blanks: newBlanks,
        currentBlankIndex: nextBlankIndex,
        currentCardIndex: nextCardIndex,
        streak: 0, // skip kills streak
        isComplete,
      };
    });
  }, []);

  const skipCard = useCallback(() => {
    setState((prev) => {
      const { currentCardIndex, cards: stateCards } = prev;
      if (stateCards.length === 0 || prev.isComplete) return prev;

      const isLastCard = currentCardIndex + 1 >= stateCards.length;
      return {
        ...prev,
        currentCardIndex: isLastCard ? currentCardIndex : currentCardIndex + 1,
        currentBlankIndex: 0,
        streak: 0,
        isComplete: isLastCard,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState({
      cards,
      currentCardIndex: 0,
      currentBlankIndex: 0,
      blanks: cards.map((card, cardIdx) =>
        card.blanks.map((b, blankIdx) => ({
          term: b.term,
          userInput: "",
          status: cardIdx === 0 && blankIdx === 0 ? ("typing" as const) : ("idle" as const),
          attempts: 0,
        }))
      ),
      score: 0,
      streak: 0,
      isComplete: false,
    });
  }, [cards]);

  return {
    state,
    submitAnswer,
    revealAnswer,
    skipCard,
    updateUserInput,
    resetBlankStatus,
    resetGame,
  };
}
