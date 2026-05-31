// components/convert/SummaryView.tsx
"use client";

import React, { useState } from "react";
import { MindMapCanvas } from "./MindMapCanvas";
import type { SummaryResult } from "@/lib/summarize";

interface SummaryViewProps {
  result: SummaryResult;
  subject: string;
  onGenerateCards: (fromSummary: string) => void;
  onReset: () => void;
  generatingCards: boolean;
}

export function SummaryView({
  result,
  subject,
  onGenerateCards,
  onReset,
  generatingCards,
}: SummaryViewProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "mindmap" | "keypoints">("summary");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text =
      result.summary +
      "\n\nKey Points:\n" +
      result.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: "summary" as const, label: "📄 Summary", emoji: "📄" },
    { id: "mindmap" as const, label: "🗺️ Mind Map", emoji: "🗺️" },
    { id: "keypoints" as const, label: "📌 Key Points", emoji: "📌" },
  ];

  return (
    <div className="flex flex-col gap-5 w-full font-mono animate-correct-pop">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border-card/35 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-text" style={{ fontFamily: "Georgia, serif" }}>
            AI Study Overview
          </h2>
          <p className="text-[11px] text-text-muted uppercase tracking-wider mt-1">
            {subject.toUpperCase()} · {result.keyPoints.length} Key Points ·{" "}
            {result.mindmap.branches.length} Concept Branches
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-border-card text-text-muted hover:text-text hover:border-text-muted rounded transition-colors"
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-border-card text-text-muted hover:text-text hover:border-text-muted rounded transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface/20 p-1 rounded-lg border border-border-card/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === tab.id
                ? "bg-active/20 text-active border border-active/40 shadow-sm"
                : "text-text-muted hover:text-text hover:bg-surface/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[340px]">
        {/* ── Summary ── */}
        {activeTab === "summary" && (
          <div className="flex flex-col gap-4">
            <div className="glass-panel rounded-lg border border-border-card/60 p-5 bg-surface/10">
              {result.summary.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="text-sm text-text leading-7 mb-4 last:mb-0 select-text"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Quick stats strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Key Points", value: result.keyPoints.length, color: "text-active" },
                { label: "Concept Branches", value: result.mindmap.branches.length, color: "text-correct" },
                {
                  label: "Total Leaves",
                  value: result.mindmap.branches.reduce((a, b) => a + b.children.length, 0),
                  color: "text-accent",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border-card/40 bg-surface/10 p-3 text-center"
                >
                  <div className={`text-2xl font-black tabular-nums ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Mind Map ── */}
        {activeTab === "mindmap" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-border-card/50 overflow-hidden bg-[#0b101f] shadow-2xl">
              <MindMapCanvas data={result.mindmap} />
            </div>

            {/* Branch legend */}
            <div className="flex flex-wrap gap-2 px-1">
              {result.mindmap.branches.map((branch, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border"
                  style={{
                    color: branch.color,
                    borderColor: branch.color + "55",
                    backgroundColor: branch.color + "18",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: branch.color }}
                  />
                  {branch.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Key Points ── */}
        {activeTab === "keypoints" && (
          <div className="flex flex-col gap-2">
            {result.keyPoints.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-border-card/40 bg-surface/10 hover:bg-surface/20 hover:border-active/30 transition-all group"
              >
                <span className="text-[10px] font-black text-active/60 tabular-nums mt-0.5 w-5 flex-shrink-0 group-hover:text-active transition-colors">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xs text-text leading-relaxed select-text">{point}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Cards CTA */}
      <div className="border-t border-border-card/35 pt-4 flex flex-col gap-2">
        <button
          onClick={() => onGenerateCards(result.summary)}
          disabled={generatingCards}
          className="w-full py-3.5 bg-gradient-to-r from-active to-correct hover:brightness-110 disabled:opacity-50 text-bg rounded font-bold uppercase text-xs tracking-widest transition-all shadow-lg"
        >
          {generatingCards
            ? "⚙️ Generating Cards..."
            : "🧠 Generate Cloze Cards from Summary"}
        </button>
        <p className="text-[10px] text-text-muted text-center">
          Cards are generated from the AI summary — much more focused than raw chunked cards
        </p>
      </div>
    </div>
  );
}
