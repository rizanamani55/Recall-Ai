// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DeckCard } from "@/components/dashboard/DeckCard";
import type { Deck } from "@/types/deck";

export default function DashboardPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch decks on mount
  useEffect(() => {
    async function fetchDecks() {
      try {
        const res = await fetch("/api/decks");
        if (res.ok) {
          const data = await res.json();
          setDecks(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDecks();
  }, []);

  const handleDeleteDeck = (id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 text-left font-sans select-none animate-correct-pop">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-card/35 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="serif-header text-3xl font-bold text-text">Your Study Library</h1>
          <p className="text-text-muted text-xs font-mono uppercase tracking-wider">
            Access and review your saved active recall card decks
          </p>
        </div>

        <Link
          href="/dashboard/convert"
          className="px-6 py-2.5 rounded bg-gradient-to-r from-active to-correct hover:brightness-110 text-bg font-bold font-mono text-xs uppercase tracking-wider select-none text-center shadow-lg transition-all"
        >
          ➕ Convert New Text
        </Link>
      </div>

      {/* Main library listing area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 rounded-lg bg-surface/30 border border-border-card/40 animate-pulse flex flex-col justify-between p-5"
            >
              <div className="flex flex-col gap-2">
                <div className="h-4 w-16 bg-surface/50 rounded" />
                <div className="h-6 w-3/4 bg-surface/60 rounded" />
              </div>
              <div className="h-5 w-20 bg-surface/40 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 rounded-lg border-2 border-dashed border-border-card/70 bg-surface/10 mt-4 max-w-2xl mx-auto w-full font-mono text-sm">
          <span className="text-4xl mb-4">🗂️</span>
          <span className="text-text font-bold mb-2">No study decks saved in library.</span>
          <span className="text-text-muted text-xs max-w-sm leading-relaxed mb-6">
            Paste textbook definitions, lecture slides, or exam notes to instantly extract Cloze typewriter games.
          </span>
          <Link
            href="/dashboard/convert"
            className="px-6 py-2 bg-active border border-active text-bg font-bold hover:brightness-110 transition-all rounded uppercase text-xs tracking-wider"
          >
            Create Your First Deck
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              id={deck.id}
              title={deck.title}
              subject={deck.subject}
              cardCount={deck.card_count}
              createdAt={deck.created_at}
              onDelete={handleDeleteDeck}
            />
          ))}
        </div>
      )}
    </div>
  );
}
