// hooks/useKeyboardCapture.ts
import { useEffect } from "react";

interface KeyboardBindings {
  onSubmit?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  onToggleHelp?: () => void;
}

export function useKeyboardCapture(
  bindings: KeyboardBindings,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting shortcuts if typing in search fields or normal inputs
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "Enter") {
        // Submit answer
        if (bindings.onSubmit) {
          e.preventDefault();
          bindings.onSubmit();
        }
      } else if (e.key === "Tab") {
        // Skip current blank (tab skip shortcut)
        if (bindings.onSkip) {
          e.preventDefault();
          bindings.onSkip();
        }
      } else if (e.key === " " && !isInput) {
        // Space advances if not typing
        if (bindings.onNext) {
          e.preventDefault();
          bindings.onNext();
        }
      } else if (e.key === "?" && !isInput) {
        // Toggle keyboard reference overlay
        if (bindings.onToggleHelp) {
          e.preventDefault();
          bindings.onToggleHelp();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [bindings, isActive]);
}
