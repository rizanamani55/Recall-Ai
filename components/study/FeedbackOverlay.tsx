// components/study/FeedbackOverlay.tsx
"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CardStatus } from "@/types/card";

interface FeedbackOverlayProps {
  status: CardStatus;
}

export function FeedbackOverlay({ status }: FeedbackOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    if (status === "correct") {
      setType("correct");
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(t);
    } else if (status === "wrong") {
      setType("wrong");
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (!visible || !type) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center rounded-lg overflow-hidden">
      {/* Background flash */}
      <div
        className={cn(
          "absolute inset-0 opacity-15 transition-opacity duration-300",
          type === "correct" ? "bg-correct animate-pulse" : "bg-wrong animate-pulse"
        )}
      />

      {/* Floating icon indicator */}
      <div
        className={cn(
          "px-6 py-4 rounded-xl flex items-center gap-3 backdrop-filter backdrop-blur-md border shadow-2xl scale-0 transition-transform duration-300 animate-correct-pop text-lg font-bold mono-game",
          type === "correct"
            ? "bg-correct/20 border-correct text-correct"
            : "bg-wrong/20 border-wrong text-wrong"
        )}
      >
        <span>{type === "correct" ? "✓" : "✗"}</span>
        <span>{type === "correct" ? "CORRECT" : "INCORRECT"}</span>
      </div>
    </div>
  );
}
