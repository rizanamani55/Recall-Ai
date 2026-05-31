// types/card.ts

export type CardStatus = "idle" | "typing" | "correct" | "wrong" | "revealed";

export interface CardBlank {
  term: string;
  hint: string;
  position: number;
}

export interface ClozeCard {
  id: string;
  sentence: string;
  blanks: CardBlank[];
}

export interface BlankState {
  term: string;
  userInput: string;
  status: CardStatus;
  attempts: number;
}
