// app/dashboard/convert/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TextInputPanel, type ConvertMode } from "@/components/convert/TextInputPanel";
import { ConversionLoader } from "@/components/convert/ConversionLoader";
import { PreviewCard } from "@/components/convert/PreviewCard";
import { SummaryView } from "@/components/convert/SummaryView";
import { useUsage } from "@/hooks/useUsage";
import type { SummaryResult } from "@/lib/summarize";

type PageStatus =
  | "idle"
  | "loading-cloze"
  | "loading-summary"
  | "loading-cards-from-summary"
  | "preview-summary"
  | "preview-cards";

const LOADING_MESSAGES_SUMMARY = [
  "Reading and chunking your document...",
  "AI is distilling core concepts...",
  "Synthesising section summaries...",
  "Building mind map structure...",
  "Organising key points hierarchy...",
  "Finalising study overview...",
];

const LOADING_MESSAGES_CLOZE = [
  "Scanning textbook density and structure...",
  "Isolating key memorisable concepts...",
  "Formulating {{cloze}} blanks...",
  "Creating 6-word context hints...",
  "Deduplicating across chunks...",
  "Building typewriter playground...",
];

export default function ConvertPage() {
  const router = useRouter();
  const { mutateUsage } = useUsage();

  const [status, setStatus] = useState<PageStatus>("idle");
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [activeSubject, setActiveSubject] = useState("medicine");
  const [activeText, setActiveText] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Mode: Direct Cloze ──────────────────────────────────────────────────────
  const handleClozeConvert = async (text: string, subject: string) => {
    setStatus("loading-cloze");
    setErrorMsg("");
    setActiveText(text);
    setActiveSubject(subject);

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, subject }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to process text. Please try again.");
        setStatus("idle");
        return;
      }
      setGeneratedCards(data.cards);
      setStatus("preview-cards");
      mutateUsage();
    } catch {
      setErrorMsg("Connection timed out. Please try again.");
      setStatus("idle");
    }
  };

  // ── Mode: Summarize + Mind Map ──────────────────────────────────────────────
  const handleSummaryConvert = async (text: string, subject: string) => {
    setStatus("loading-summary");
    setErrorMsg("");
    setActiveText(text);
    setActiveSubject(subject);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, subject }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Summarization failed. Please try again.");
        setStatus("idle");
        return;
      }
      setSummaryResult(data);
      setStatus("preview-summary");
    } catch {
      setErrorMsg("Connection timed out. Please try again.");
      setStatus("idle");
    }
  };

  // ── Router: dispatch to correct handler ────────────────────────────────────
  const handleConvert = async (text: string, subject: string, mode: ConvertMode) => {
    if (mode === "summary") {
      await handleSummaryConvert(text, subject);
    } else {
      await handleClozeConvert(text, subject);
    }
  };

  // ── Generate cards from AI summary ─────────────────────────────────────────
  const handleGenerateCardsFromSummary = async (summaryText: string) => {
    setStatus("loading-cards-from-summary");
    setErrorMsg("");

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summaryText, subject: activeSubject }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to generate cards.");
        setStatus("preview-summary");
        return;
      }
      setGeneratedCards(data.cards);
      setStatus("preview-cards");
      mutateUsage();
    } catch {
      setErrorMsg("Connection timed out.");
      setStatus("preview-summary");
    }
  };

  // ── Save deck ───────────────────────────────────────────────────────────────
  const handleSaveDeck = async (title: string, cardsToSave: any[]) => {
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject: activeSubject,
          sourceText: activeText,
          cards: cardsToSave,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save deck");
      }
      mutateUsage();
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save deck to library.");
      setSaving(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const isLoading =
    status === "loading-cloze" ||
    status === "loading-summary" ||
    status === "loading-cards-from-summary";

  const pageTitle: Record<PageStatus, string> = {
    idle: "AI Study Engine",
    "loading-cloze": "",
    "loading-summary": "",
    "loading-cards-from-summary": "",
    "preview-summary": "Study Overview",
    "preview-cards": "Review Extracted Cards",
  };

  const pageSubtitle: Record<PageStatus, string> = {
    idle: "Upload a textbook, paste text, choose your mode",
    "loading-cloze": "",
    "loading-summary": "",
    "loading-cards-from-summary": "",
    "preview-summary": "Summary · Mind Map · Key Points — then generate focused cards",
    "preview-cards": "Verify sentences and clues before saving to your study library",
  };

  const loadingMessages =
    status === "loading-summary" ? LOADING_MESSAGES_SUMMARY : LOADING_MESSAGES_CLOZE;

  return (
    <div className="flex flex-col gap-6 text-left font-sans select-none relative animate-correct-pop max-w-4xl mx-auto w-full">
      {/* Page Header */}
      {!isLoading && (
        <div className="flex flex-col border-b border-border-card/35 pb-5">
          <h1 className="serif-header text-3xl font-bold text-text">{pageTitle[status]}</h1>
          <p className="text-text-muted text-xs font-mono uppercase tracking-wider mt-1">
            {pageSubtitle[status]}
          </p>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded border border-wrong bg-wrong/5 font-mono text-xs text-wrong leading-normal">
          <strong>⚠️ ERROR:</strong> {errorMsg}
        </div>
      )}

      {/* Workspace */}
      <div className="mt-2 w-full">
        {status === "idle" && (
          <TextInputPanel onConvert={handleConvert} disabled={false} />
        )}

        {isLoading && (
          <div className="py-12">
            <ConversionLoader
              messages={loadingMessages}
              label={
                status === "loading-summary"
                  ? "Building study overview…"
                  : status === "loading-cards-from-summary"
                  ? "Generating cards from summary…"
                  : "Extracting cloze cards…"
              }
            />
          </div>
        )}

        {status === "preview-summary" && summaryResult && (
          <SummaryView
            result={summaryResult}
            subject={activeSubject}
            onGenerateCards={handleGenerateCardsFromSummary}
            onReset={() => setStatus("idle")}
            generatingCards={false}
          />
        )}

        {status === "preview-cards" && (
          <PreviewCard
            cards={generatedCards}
            subject={activeSubject}
            sourceText={activeText}
            onSave={handleSaveDeck}
            onCancel={() =>
              summaryResult ? setStatus("preview-summary") : setStatus("idle")
            }
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}
