// hooks/useTypewriter.ts
import { useState, useEffect, useRef } from "react";
import { playTypewriterClick } from "@/lib/typewriterSound";

export function useTypewriter(
  text: string,
  speed = 18,
  active = true,
  onComplete?: () => void
) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayText("");
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (!active || isComplete || !text) return;

    // Check for reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setDisplayText(text);
      setIsComplete(true);
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
      return;
    }

    let currentIndex = 0;
    setDisplayText("");

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        const nextChar = text.charAt(currentIndex);
        setDisplayText((prev) => prev + nextChar);
        
        // Play mechanical key click!
        playTypewriterClick();
        
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, active, isComplete]);

  return { displayText, isComplete };
}
