// components/convert/TextInputPanel.tsx
"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { playTypewriterClick } from "@/lib/typewriterSound";

export type ConvertMode = "cloze" | "summary";

interface TextInputPanelProps {
  onConvert: (text: string, subject: string, mode: ConvertMode) => void;
  disabled: boolean;
}

function estimateChunks(len: number) {
  return Math.max(1, Math.ceil(len / 8_000));
}

// ─── PDF text extractor using PDF.js ─────────────────────────────────────────
async function extractPdfText(
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<string> {
  // Dynamic import so PDF.js only loads when actually needed (keeps initial bundle small)
  const pdfjsLib = await import("pdfjs-dist");

  // Use the CDN worker — avoids webpack bundling issues with the heavy worker file
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];
  const totalPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(pageNum, totalPages);
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Each item in content.items is a TextItem with a `str` field
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TextInputPanel({ onConvert, disabled }: TextInputPanelProps) {
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("medicine");
  const [mode, setMode] = useState<ConvertMode>("cloze");
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<
    | { type: "idle" }
    | { type: "parsing"; page: number; total: number }
    | { type: "success"; message: string }
    | { type: "error"; message: string }
  >({ type: "idle" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 50) return;
    onConvert(text, subject, mode);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFile = async (file: File) => {
    setUploadState({ type: "idle" });
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "pdf") {
      setUploadState({ type: "parsing", page: 0, total: 0 });

      try {
        const extracted = await extractPdfText(file, (page, total) => {
          setUploadState({ type: "parsing", page, total });
        });

        if (extracted.trim().length < 50) {
          setUploadState({
            type: "error",
            message:
              "Could not extract readable text. This appears to be a scanned image PDF — please use a searchable/text-based PDF.",
          });
          return;
        }

        setText(extracted);
        setUploadState({
          type: "success",
          message: `✓ "${file.name}" — ${extracted.length.toLocaleString()} chars extracted ≈ ${estimateChunks(extracted.length)} AI chunk(s)`,
        });
        playTypewriterClick();
      } catch (err: any) {
        console.error("PDF extraction error:", err);
        setUploadState({
          type: "error",
          message: err?.message?.includes("Invalid PDF")
            ? "Invalid or corrupted PDF file."
            : "Failed to parse PDF. Make sure it is a valid, text-based PDF.",
        });
      }
    } else if (ext === "txt" || ext === "md" || ext === "json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content.trim().length < 50) {
          setUploadState({
            type: "error",
            message: "File is too short (minimum 50 characters).",
          });
          return;
        }
        setText(content);
        setUploadState({
          type: "success",
          message: `✓ "${file.name}" — ${content.length.toLocaleString()} chars ≈ ${estimateChunks(content.length)} AI chunk(s)`,
        });
        playTypewriterClick();
      };
      reader.readAsText(file);
    } else {
      setUploadState({
        type: "error",
        message: "Unsupported format. Upload a PDF, TXT, or MD file.",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const charCount = text.length;
  const isTooShort = charCount < 50;
  const chunks = estimateChunks(charCount);
  const isParsing = uploadState.type === "parsing";

  const subjects = [
    { value: "medicine", label: "🩺 Medicine / USMLE" },
    { value: "law", label: "⚖️ Law / Bar Exam" },
    { value: "stem", label: "🔬 Advanced STEM / Chemistry" },
    { value: "other", label: "📚 General Knowledge" },
  ];

  const modeOptions: { id: ConvertMode; label: string; desc: string; icon: string }[] = [
    {
      id: "cloze",
      icon: "🧠",
      label: "Cloze Cards",
      desc: "Direct card extraction from raw text (fast)",
    },
    {
      id: "summary",
      icon: "🗺️",
      label: "Summarize + Mind Map",
      desc: "AI summarizes first, then builds mind map + focused cards",
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 w-full font-mono text-xs text-left select-none animate-correct-pop"
    >
      {/* Mode selector */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
          0. Choose Processing Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {modeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={cn(
                "px-3 py-3 rounded border text-left bg-surface/20 hover:bg-surface/40 transition-all",
                mode === opt.id
                  ? "border-active bg-active/10 shadow-md"
                  : "border-border-card"
              )}
            >
              <div className={cn("text-sm font-black", mode === opt.id ? "text-active" : "text-text")}>
                {opt.icon} {opt.label}
              </div>
              <div className="text-[9px] text-text-muted mt-0.5 leading-relaxed">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Subject selector */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
          1. Select Target Domain
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {subjects.map((sub) => {
            const isSelected = subject === sub.value;
            return (
              <button
                key={sub.value}
                type="button"
                onClick={() => setSubject(sub.value)}
                className={cn(
                  "px-3 py-2.5 rounded border border-border-card text-left bg-surface/20 hover:bg-surface/50 text-text transition-all font-semibold",
                  isSelected &&
                    "bg-active/20 border-active text-active shadow-sm font-bold pulse-border-active"
                )}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Drag-and-drop upload */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
          2. Upload Textbook (PDF, TXT, MD) — any size supported
        </label>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isParsing && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-all duration-300 bg-surface/5 text-center select-none border-border-card",
            isParsing ? "cursor-wait opacity-80" : "cursor-pointer hover:border-active/40",
            dragActive && "border-active bg-active/5 shadow-inner scale-[0.99]",
            uploadState.type === "success" && "border-correct bg-correct/5",
            uploadState.type === "error" && "border-wrong bg-wrong/5"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.txt,.md,.json"
            className="hidden"
            disabled={isParsing}
          />

          {isParsing ? (
            <>
              {/* PDF parsing progress */}
              <span className="text-2xl animate-spin">⚙️</span>
              <span className="font-bold text-active text-xs">
                Extracting PDF text…
              </span>
              {uploadState.total > 0 && (
                <>
                  <div className="w-full max-w-xs h-1.5 bg-border-card/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-active to-correct rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((uploadState.page / uploadState.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted tabular-nums">
                    Page {uploadState.page} / {uploadState.total}
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="text-2xl">📥</span>
              <span className="font-bold text-text text-xs leading-none">
                {dragActive
                  ? "Drop file here!"
                  : "Drag & Drop or click to browse"}
              </span>
              <span className="text-[10px] text-text-muted leading-tight">
                Full textbooks, lecture notes, legal docs — text extracted properly via PDF.js
              </span>

              {uploadState.type === "success" && (
                <span className="text-[10px] text-correct font-bold mt-1.5 animate-pulse select-text">
                  {uploadState.message}
                </span>
              )}
              {uploadState.type === "error" && (
                <span className="text-[10px] text-wrong font-bold mt-1.5">
                  ⚠️ {uploadState.message}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Text area */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
          3. Paste or Edit Text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || isParsing}
          placeholder="Paste dense textbook paragraphs, lecture slides, or legal passages here — or upload a file above. No size limit."
          className="w-full h-56 bg-surface/40 border border-border-card/85 focus:border-active rounded-lg p-4 font-mono text-sm leading-relaxed text-text focus:outline-none focus:ring-1 focus:ring-active placeholder-text-muted/50 transition-colors select-text"
        />

        {/* Stats bar */}
        <div className="flex items-center justify-between text-[10px] text-text-muted mt-1 px-1">
          <span className={cn(isTooShort ? "text-amber-500" : "text-correct")}>
            {isTooShort
              ? "⚠️ Minimum 50 characters required"
              : `✓ Ready — ${chunks} AI chunk${chunks > 1 ? "s" : ""}`}
          </span>
          <span className="tabular-nums">
            {charCount.toLocaleString()} chars
            {charCount > 8_000 && (
              <span className="text-active ml-2">≈ {chunks} chunks</span>
            )}
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={disabled || isTooShort || isParsing}
        className="w-full py-3 bg-gradient-to-r from-active to-correct hover:brightness-110 disabled:opacity-50 text-bg rounded font-bold uppercase text-xs tracking-wider transition-all select-none shadow-lg mt-2"
      >
        {mode === "summary"
          ? `🗺️ Summarize & Build Mind Map${chunks > 1 ? ` (${chunks} chunks)` : ""}`
          : `🚀 Extract Cloze Cards${chunks > 1 ? ` (${chunks} chunks)` : ""}`}
      </button>
    </form>
  );
}
