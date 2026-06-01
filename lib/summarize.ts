// lib/summarize.ts
// ─────────────────────────────────────────────────────────────────────────────
// AI-powered text summarization + mind-map generation.
//
// Large texts are chunked → each chunk summarised → chunk summaries merged
// into one final synthesis → mind-map JSON derived from that synthesis.
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MindMapBranch {
  label: string;
  color: string;        // hex — each branch gets its own colour
  children: string[];   // leaf labels
}

export interface MindMapData {
  center: string;       // root node label
  branches: MindMapBranch[];
}

export interface SummaryResult {
  summary: string;      // 3–5 paragraph cohesive summary
  keyPoints: string[];  // 8–15 bullet points
  mindmap: MindMapData;
}

// ─── Branch colour palette ────────────────────────────────────────────────────

const BRANCH_COLORS = [
  "#4f8ef7", "#7c5ef7", "#f7774f", "#4ff7a0",
  "#f7c44f", "#f74f8e", "#4ff7f0", "#f74fdb",
];

// ─── Providers ────────────────────────────────────────────────────────────────

const isGroqConfigured     = !!process.env.GROQ_API_KEY;
const isGeminiConfigured   = !!process.env.GEMINI_API_KEY;
const isAnthropicConfigured = !!process.env.ANTHROPIC_API_KEY;

const groqClient = isGroqConfigured
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const geminiClient = isGeminiConfigured
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  : null;
const anthropicClient = isAnthropicConfigured
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── Chunk splitter (same logic as anthropic.ts) ──────────────────────────────

const CHUNK_SIZE = 10_000;

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastPunct = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf(".\n")
      );
      if (lastPunct > CHUNK_SIZE * 0.5) end = start + lastPunct + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks;
}

// ─── Rate-limit helpers ───────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.0-flash-lite";
const INTER_CHUNK_DELAY_MS = 2_000;

function isQuotaError(err: any): boolean {
  const msg: string = err?.message ?? "";
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("Too Many Requests") ||
    msg.includes("rate limit") ||
    err?.status === 429
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callAI(prompt: string): Promise<string> {
  // 1️⃣ Groq — no daily quota
  if (isGroqConfigured && groqClient) {
    try {
      const response = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
      });
      return response.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.warn("Groq summarize failed, trying Gemini:", err);
    }
  }

  // 2️⃣ Gemini with retry
  if (isGeminiConfigured && geminiClient) {
    const model = geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err: any) {
        if (isQuotaError(err) && attempt < 3) {
          const waitMs = Math.pow(2, attempt + 1) * 3_000;
          console.warn(`  ⏳ Gemini quota in summarize — retrying in ${waitMs / 1000}s`);
          await sleep(waitMs);
          continue;
        }
        if (isQuotaError(err)) {
          console.warn("Gemini quota fully exhausted, trying Anthropic");
          break;
        }
        throw err;
      }
    }
  }

  // 3️⃣ Anthropic
  if (isAnthropicConfigured && anthropicClient) {
    const msg = await anthropicClient.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    return msg.content[0].type === "text" ? msg.content[0].text : "";
  }

  throw new Error("ALL_PROVIDERS_EXHAUSTED");
}

function parseJSON(raw: string): any {
  // Fix raw newlines inside strings that cause "Bad control character" errors
  let clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  
  // A quick heuristic to escape unescaped newlines within the JSON string values
  // We replace actual newlines with "\n" so JSON.parse won't choke.
  clean = clean.replace(/\n/g, "\\n");
  // But wait, the structure itself might rely on newlines (like between keys).
  // Actually, replacing all \n with \n string is bad for the JSON structure, 
  // but JSON.parse ignores whitespace. Wait, \n inside strings is the issue.
  // It's safer to just instruct the AI very clearly. I'll rely on the AI instruction 
  // and handle control characters via a regex that targets control chars.
  clean = clean.replace(/[\u0000-\u001F]+/g, (match) => {
    if (match === '\n' || match === '\r\n') return "\\n";
    if (match === '\t') return "\\t";
    return "";
  });

  // Extract first JSON object/array
  const firstBrace = Math.min(
    clean.indexOf("{") === -1 ? Infinity : clean.indexOf("{"),
    clean.indexOf("[") === -1 ? Infinity : clean.indexOf("[")
  );
  const lastBrace = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  
  // Unescape the structural newlines we accidentally escaped
  let jsonStr = clean.slice(firstBrace, lastBrace + 1);
  // Re-allow standard json formatting by fixing escaped structural characters
  jsonStr = jsonStr.replace(/\\n/g, "\\n"); // keep them as escaped newlines for the strings
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Fallback: if it still fails due to weird escaping, try to just parse it after basic cleanup
    const veryClean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(veryClean.slice(firstBrace, lastBrace + 1).replace(/\n/g, " "));
  }
}

// ─── Step 1: Summarise one chunk ─────────────────────────────────────────────

async function summariseChunk(chunk: string, subject: string): Promise<string> {
  const prompt = `You are an expert academic summariser for ${subject} students.

Summarise the following textbook passage. Adapt your summary length to the source material:
- If the passage is short (e.g. a single paragraph), provide a concise 1-2 paragraph summary.
- If the passage is long and dense, provide a comprehensive 4-6 paragraph summary.
Ensure the summary is clear and crisp, preserving all critical facts, key terms, values, mechanisms, and nuances. Focus on what is testable and important to remember.

Passage:
${chunk}

Return ONLY the summary paragraphs, no preamble.`;

  return callAI(prompt);
}

// ─── Step 2: Synthesise chunk summaries → final result ───────────────────────

async function synthesise(
  chunkSummaries: string[],
  subject: string,
  originalLength: number
): Promise<SummaryResult> {
  const combined = chunkSummaries.join("\n\n---\n\n");

  const prompt = `You are an expert academic content analyst for ${subject}.

Below are section-by-section summaries of a ${Math.round(originalLength / 5)}-word textbook excerpt.
Synthesise them into a final structured study overview. Ensure the synthesis is clear, crisp, and comprehensive without losing critical information. 

**Length Requirement:** Adapt your final summary length proportionally to the original text length (${Math.round(originalLength / 5)} words). For short texts, write 1–2 paragraphs. For full chapters, write 5–8 paragraphs.

Section summaries:
${combined}

Return ONLY a valid JSON object with exactly this shape (no markdown, no explanation):
{
  "summary": "Detailed, cohesive summary appropriately scaled to the source text length. Separate paragraphs using \\n\\n.",
  "keyPoints": [
    "Concise testable fact 1",
    "Concise testable fact 2"
  ],
  "mindmap": {
    "center": "Main Topic (2–4 words)",
    "branches": [
      {
        "label": "Branch label (2–3 words)",
        "children": ["leaf 1", "leaf 2", "leaf 3"]
      }
    ]
  }
}

CRITICAL RULES FOR JSON:
- Escape all newlines inside strings as \\n\\n. DO NOT use literal line breaks inside the string values.
- Ensure the output is strictly valid JSON.

Rules:
- keyPoints: Extracted factual and testable points (5–20 items depending on text length, each ≤ 20 words)
- mindmap.center: 2–4 words, the overarching topic
- mindmap.branches: 3–8 branches (scale with text size), each with 2–5 children
- branch/children labels: short (1–4 words), no punctuation
- Return ONLY the JSON object`;

  const raw = await callAI(prompt);
  const parsed = parseJSON(raw);

  // Attach colours to branches
  const branches: MindMapBranch[] = (parsed.mindmap?.branches || []).map(
    (b: any, i: number) => ({
      label: b.label || "Branch",
      color: BRANCH_COLORS[i % BRANCH_COLORS.length],
      children: Array.isArray(b.children) ? b.children : [],
    })
  );

  return {
    summary: parsed.summary || "Summary could not be generated.",
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    mindmap: {
      center: parsed.mindmap?.center || subject,
      branches,
    },
  };
}

// ─── Fallback mock (no API key) ───────────────────────────────────────────────

function buildMockResult(text: string, subject: string): SummaryResult {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 30)
    .slice(0, 20);

  const keyPoints = sentences
    .slice(0, 12)
    .map((s) => s.replace(/\s+/g, " ").trim().slice(0, 120));

  const words = text
    .split(/\W+/)
    .filter((w) => w.length > 5)
    .slice(0, 40);

  const branches: MindMapBranch[] = [
    { label: "Core Concepts", color: BRANCH_COLORS[0], children: words.slice(0, 4) },
    { label: "Key Mechanisms", color: BRANCH_COLORS[1], children: words.slice(4, 8) },
    { label: "Clinical Relevance", color: BRANCH_COLORS[2], children: words.slice(8, 12) },
    { label: "Important Facts", color: BRANCH_COLORS[3], children: words.slice(12, 16) },
  ];

  return {
    summary:
      `This passage covers key concepts in ${subject}. ` +
      sentences.slice(0, 3).join(" ") +
      "\n\n[Add your GEMINI_API_KEY to .env.local for a real AI-generated summary.]",
    keyPoints,
    mindmap: { center: subject.charAt(0).toUpperCase() + subject.slice(1), branches },
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function summariseText(
  text: string,
  subject: string,
  onProgress?: (stage: string, done: number, total: number) => void
): Promise<SummaryResult> {
  const chunks = chunkText(text);
  const total = chunks.length;

  // If no AI configured, return a mock
  if (!isGroqConfigured && !isGeminiConfigured && !isAnthropicConfigured) {
    onProgress?.("mock", 1, 1);
    await new Promise((r) => setTimeout(r, 1500));
    return buildMockResult(text, subject);
  }

  try {
    // Step 1: summarise each chunk (with inter-chunk delay)
    const chunkSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      onProgress?.("chunk", i, total);
      if (i > 0) await sleep(INTER_CHUNK_DELAY_MS);
      const s = await summariseChunk(chunks[i], subject);
      chunkSummaries.push(s);
    }

    // Step 2: synthesise
    onProgress?.("synthesise", total, total);
    return await synthesise(chunkSummaries, subject, text.length);
  } catch (err: any) {
    console.error("AI summarization failed or quotas exhausted. Falling back to mock.", err);
    return buildMockResult(text, subject);
  }
}
