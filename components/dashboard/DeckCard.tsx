// components/dashboard/DeckCard.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DeckCardProps {
  id: string;
  title: string;
  subject: string;
  cardCount: number;
  createdAt: string;
  onDelete: (id: string) => void;
}

export function DeckCard({ id, title, subject, cardCount, createdAt, onDelete }: DeckCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete the deck "${title}"?`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/decks/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const getSubjectColor = (sub: string) => {
    const s = sub.toLowerCase();
    if (s === "medicine") return "text-correct border-correct/30 bg-correct/5";
    if (s === "law") return "text-amber-400 border-amber-400/30 bg-amber-50/5";
    if (s === "stem") return "text-blue-400 border-blue-400/30 bg-blue-500/5";
    return "text-text-muted border-border-card bg-surface/30";
  };

  return (
    <div className="flex flex-col gap-4 border border-border-card/65 rounded-lg p-5 bg-surface/10 hover:border-active/40 hover:scale-[1.01] transition-all duration-300 select-none font-mono relative bg-[#0d1222]/50 shadow-inner group">
      {/* Decorative dot matrix matrix details */}
      <div className="absolute top-0 right-4 translate-y-[-50%]">
        <span className={cn("px-2 py-0.5 rounded text-[8px] uppercase tracking-widest border font-bold", getSubjectColor(subject))}>
          {subject}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 mt-1 text-left">
        <h3 className="serif-header text-xl font-bold text-text leading-tight group-hover:text-active transition-colors truncate">
          {title}
        </h3>
        <span className="text-[10px] text-text-muted">
          Created: {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-center justify-between mt-2 border-t border-border-card/25 pt-4">
        {/* Card Counter badge */}
        <span className="px-2 py-0.5 rounded bg-bg border border-border-card text-[10px] font-bold text-text-muted">
          {cardCount} CARDS
        </span>

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-500 hover:text-bg transition-colors font-bold uppercase text-[9px]"
            title="Delete Deck"
          >
            {deleting ? "..." : "🗑️"}
          </button>
          
          <Link
            href={`/dashboard/study/${id}`}
            className="px-3.5 py-1.5 rounded bg-active hover:scale-[1.03] text-bg font-bold uppercase text-[10px] tracking-wider transition-all"
          >
            Study Deck ⏎
          </Link>
        </div>
      </div>
    </div>
  );
}
