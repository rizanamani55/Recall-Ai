// components/study/BlurredTerm.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CardStatus } from "@/types/card";
import { playTypewriterClick } from "@/lib/typewriterSound";

interface BlurredTermProps {
  term: string;
  hint?: string;
  status: CardStatus;
  userInput: string;
  isActive: boolean;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onReveal: () => void;
  onSkip: () => void;
}

export function BlurredTerm({
  term,
  hint,
  status,
  userInput,
  isActive,
  onChange,
  onSubmit,
  onReveal,
  onSkip,
}: BlurredTermProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shake, setShake] = useState(false);

  // Auto-focus active blank
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive, status]);

  // Handle wrong answer shake animation trigger
  useEffect(() => {
    if (status === "wrong") {
      setShake(true);
      const timer = setTimeout(() => {
        setShake(false);
        // Clear input after shake
        onChange("");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [status, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      onSkip();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      // Play a mechanical sound on standard character typing!
      playTypewriterClick();
    }
  };

  // Determine placeholder or matching width string
  const displayLength = Math.max(term.length, 4);
  const widthStyle = {
    width: `${displayLength * 0.65}em`, // DM Mono monospace char width approximation
    minWidth: "60px",
  };

  return (
    <span
      className={cn(
        "relative inline-block align-middle mx-1 rounded px-1 transition-all duration-300 select-none mono-game",
        status === "idle" && "bg-active/10 text-transparent blur-[6px] border border-border-card",
        status === "typing" && "bg-active/15 text-transparent border border-active pulse-border-active",
        status === "correct" && "bg-correct/10 text-correct border border-correct animate-correct-pop shadow-[0_0_10px_rgba(74,222,128,0.2)]",
        status === "wrong" && "bg-wrong/10 text-wrong border border-wrong animate-wrong-shake",
        status === "revealed" && "bg-neutral-800 text-neutral-400 border border-neutral-700 line-through opacity-70"
      )}
      style={widthStyle}
      title={hint ? `Hint: ${hint}` : undefined}
    >
      {/* Blurred / Display word */}
      <span className={cn(
        "inline-block text-center w-full",
        status === "idle" && "opacity-20",
        status === "typing" && "opacity-0",
        (status === "correct" || status === "wrong" || status === "revealed") && "opacity-100 font-bold"
      )}>
        {status === "revealed" ? term : status === "correct" ? term : term.replace(/./g, "*")}
      </span>

      {/* Typing input overlay */}
      {isActive && (status === "typing" || status === "wrong") && (
        <div className="absolute inset-0 flex items-center pr-5">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent text-center text-text focus:outline-none caret-active font-bold select-text text-[inherit] leading-none p-0 border-0"
            placeholder=""
            aria-label="Fill in the blank"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            autoFocus
          />
        </div>
      )}

      {/* Reveal Answer Icon */}
      {isActive && (status === "typing" || status === "wrong") && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(term);
            if (inputRef.current) inputRef.current.focus();
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-text-muted hover:text-wrong p-0.5 rounded transition-colors"
          title="Reveal Answer"
          tabIndex={-1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      )}

      {/* Typewriter cursor blinking effect */}
      {isActive && userInput.length === 0 && (status === "typing") && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-1 w-2 h-0.5 bg-active animate-blink" />
      )}
    </span>
  );
}
