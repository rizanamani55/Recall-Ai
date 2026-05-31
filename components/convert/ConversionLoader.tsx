// components/convert/ConversionLoader.tsx
"use client";

import React, { useEffect, useState } from "react";

interface ConversionLoaderProps {
  chunksDone?: number;
  chunksTotal?: number;
  messages?: string[];
  label?: string;
}

const DEFAULT_MESSAGES = [
  "Initializing AI pipeline...",
  "Scanning textbook density and structure...",
  "Isolating key memorisable concepts...",
  "Formulating double-curly {{cloze}} blocks...",
  "Creating 6-word context hints...",
  "Deduplicating cards across chunks...",
  "Compiling interactive playground...",
];

export function ConversionLoader({
  chunksDone = 0,
  chunksTotal = 1,
  messages = DEFAULT_MESSAGES,
  label,
}: ConversionLoaderProps) {
  const [msgIdx, setMsgIdx] = useState(0);

  const isMultiChunk = chunksTotal > 1;
  const progressPct = chunksTotal > 0 ? Math.round((chunksDone / chunksTotal) * 100) : 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [messages.length]);

  const headerLabel = label
    ? label
    : isMultiChunk
    ? `Analyzing chunk ${chunksDone + 1} / ${chunksTotal}`
    : "Processing…";

  return (
    <div className="w-full glass-panel border border-border-card rounded-lg p-8 max-w-md mx-auto text-center font-mono text-xs select-none flex flex-col items-center gap-6 shadow-2xl bg-[#0b101f]">
      {/* Spinner */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <span className="w-10 h-10 rounded-full border border-dashed border-active animate-spin" />
        <span className="absolute w-5 h-5 rounded-full border border-double border-correct animate-ping" />
      </div>

      <div className="flex flex-col gap-2 w-full text-center">
        <span className="text-active font-bold text-sm uppercase tracking-widest">
          {headerLabel}
        </span>
        <span className="text-text-muted italic text-[11px] leading-relaxed h-5 block">
          &ldquo;{messages[msgIdx]}&rdquo;
        </span>
      </div>

      {/* Progress bar (multi-chunk) */}
      {isMultiChunk && (
        <div className="w-full flex flex-col gap-1.5">
          <div className="w-full h-1.5 bg-border-card/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-active to-correct rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[9px] text-text-muted tabular-nums">
            {progressPct}% — {chunksTotal - chunksDone} chunk(s) remaining
          </span>
        </div>
      )}

      {/* Terminal log */}
      <div className="w-full bg-bg/80 border border-border-card/60 p-4 rounded text-left flex flex-col gap-1.5 text-[9px] text-text-muted leading-none select-none shadow-inner h-24 overflow-hidden font-mono">
        <div>[SYSTEM] AI_ENGINE_V2.0</div>
        <div>[STATUS] PIPELINE_ACTIVE</div>
        <div className="text-correct">[OK] GEMINI-1.5-FLASH / LOCAL_MOCK READY</div>
        <div className="text-correct">[OK] CHUNK_ENGINE — NO SIZE LIMIT</div>
        <div className="text-active animate-pulse">
          &gt; {isMultiChunk
            ? `Chunk ${chunksDone + 1}/${chunksTotal} in progress...`
            : messages[msgIdx]}
        </div>
      </div>
    </div>
  );
}
