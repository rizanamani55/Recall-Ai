// types/deck.ts
import { ClozeCard } from "./card";

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  source_text: string;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface DeckWithCards {
  deck: Deck;
  cards: ClozeCard[];
}
