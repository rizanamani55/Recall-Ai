// components/convert/PreviewCard.tsx
"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { parseSentence, cleanSentence } from "@/lib/cloze";

interface PreviewCardProps {
  cards: { sentence: string; blanks: { term: string; hint: string }[] }[];
  subject: string;
  sourceText: string;
  onSave: (title: string, cards: any[]) => void;
  onCancel: () => void;
  saving: boolean;
}

export function PreviewCard({
  cards: initialCards,
  subject,
  sourceText,
  onSave,
  onCancel,
  saving,
}: PreviewCardProps) {
  const [title, setTitle] = useState(() => {
    // Generate a beautiful default title
    const dateStr = new Date().toLocaleDateString();
    const capitalizedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
    return `${capitalizedSubject} Study Session — ${dateStr}`;
  });

  const [cards, setCards] = useState(initialCards);

  const handleDeleteCard = (idxToDelete: number) => {
    setCards((prev) => prev.filter((_, idx) => idx !== idxToDelete));
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || cards.length === 0) return;
    onSave(title, cards);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left font-mono text-xs select-none animate-correct-pop max-w-3xl mx-auto">
      {/* Save Deck Form Options */}
      <form onSubmit={handleSaveSubmit} className="glass-panel border border-border-card rounded-lg p-5 flex flex-col sm:flex-row items-end gap-4 w-full bg-[#0d1324]">
        <div className="flex flex-col gap-2 flex-grow text-left w-full">
          <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
            Define Study Deck Library Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
            className="w-full bg-bg/80 border border-border-card focus:border-active rounded px-3.5 py-2 font-mono text-sm text-text focus:outline-none placeholder-text-muted/50"
            required
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2 border border-border-card text-text-muted hover:text-text hover:border-text-muted transition-colors rounded uppercase font-bold"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saving || cards.length === 0}
            className="w-full sm:w-auto px-6 py-2 bg-correct text-bg hover:brightness-110 disabled:opacity-50 transition-all rounded font-bold uppercase"
          >
            {saving ? "Saving..." : "💾 Save Deck"}
          </button>
        </div>
      </form>

      {/* Dynamic count badge status */}
      <div className="flex items-center justify-between border-b border-border-card/30 pb-2">
        <span className="text-[10px] text-text-muted uppercase font-bold">
          REVIEW EXTRACTED CARDS ({cards.length})
        </span>
        {cards.length === 0 && (
          <span className="text-wrong font-bold">⚠️ Add at least one card to save</span>
        )}
      </div>

      {/* Cards Scroll view preview list */}
      <div className="flex flex-col gap-4">
        {cards.map((card, idx) => {
          const cleanText = cleanSentence(card.sentence);
          const parsed = parseSentence(card.sentence);

          return (
            <div
              key={idx}
              className="glass-panel border border-border-card/65 rounded-lg p-5 flex flex-col md:flex-row gap-4 justify-between bg-surface/10 relative hover:border-active/20 transition-all select-none"
            >
              {/* Card Index tag */}
              <div className="absolute top-0 left-4 translate-y-[-50%] px-1.5 py-0.5 rounded bg-surface border border-border-card/85 text-[8px] font-bold text-text-muted">
                CARD #{idx + 1}
              </div>

              {/* Text view and blanks indicators */}
              <div className="flex flex-col gap-3 flex-grow text-left mt-1.5">
                {/* Visual token list displaying clozes */}
                <div className="text-sm text-text/90 leading-relaxed font-sans select-text">
                  {parsed.map((token, tIdx) => {
                    if (token.type === "text") {
                      return <span key={tIdx}>{token.text}</span>;
                    } else {
                      return (
                        <strong
                          key={tIdx}
                          className="px-1.5 py-0.5 rounded bg-active/10 border border-active/40 text-active text-xs font-mono mx-1 inline-block"
                        >
                          {token.text}
                        </strong>
                      );
                    }
                  })}
                </div>

                {/* Blanks contextual details */}
                <div className="flex flex-wrap gap-3 mt-1 font-mono text-[10px] text-text-muted">
                  {card.blanks.map((b, bIdx) => (
                    <div
                      key={bIdx}
                      className="px-2 py-0.5 rounded bg-bg/85 border border-border-card/45 flex gap-1.5"
                    >
                      <span className="text-active font-bold font-sans">🔑 {b.term}:</span>
                      <span className="italic leading-none mt-[1px]">&ldquo;{b.hint}&rdquo;</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action delete row button */}
              <div className="flex items-center justify-end md:justify-start md:self-center border-t md:border-t-0 border-border-card/20 pt-3 md:pt-0">
                <button
                  type="button"
                  onClick={() => handleDeleteCard(idx)}
                  className="px-3.5 py-1.5 rounded bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-500 hover:text-bg transition-colors font-bold uppercase text-[9px]"
                  title="Remove card from deck"
                >
                  🗑️ REMOVE CARD
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
