// lib/cloze.ts

export interface ClozeToken {
  type: "text" | "blank";
  text: string;
  blankIndex?: number;
}

/**
 * Parses a sentence like "The {{mitochondria}} is the {{powerhouse}} of the cell."
 * into a structured list of tokens for rich UI rendering and typewriter progression.
 */
export function parseSentence(sentence: string, blanksOrder?: string[]): ClozeToken[] {
  const tokens: ClozeToken[] = [];
  const regex = /\{\{([^}]+)\}\}/g;
  
  let lastIndex = 0;
  let match;
  let blankCount = 0;

  while ((match = regex.exec(sentence)) !== null) {
    const textBefore = sentence.substring(lastIndex, match.index);
    const term = match[1];

    if (textBefore.length > 0) {
      tokens.push({
        type: "text",
        text: textBefore,
      });
    }

    // Attempt to align blankIndex with the corresponding blank term index
    let blankIndex = blankCount;
    if (blanksOrder) {
      const foundIdx = blanksOrder.findIndex(
        (t) => t.trim().toLowerCase() === term.trim().toLowerCase()
      );
      if (foundIdx !== -1) {
        blankIndex = foundIdx;
      }
    }

    tokens.push({
      type: "blank",
      text: term,
      blankIndex,
    });

    blankCount++;
    lastIndex = regex.lastIndex;
  }

  const textAfter = sentence.substring(lastIndex);
  if (textAfter.length > 0) {
    tokens.push({
      type: "text",
      text: textAfter,
    });
  }

  return tokens;
}

/**
 * Utility to strip out double curly braces and return a clean printable string.
 */
export function cleanSentence(sentence: string): string {
  return sentence.replace(/\{\{([^}]+)\}\}/g, "$1");
}
