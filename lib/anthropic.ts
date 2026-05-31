// lib/anthropic.ts
// ─────────────────────────────────────────────────────────────────────────────
// AI engine for cloze card generation — supports UNLIMITED text via chunking.
//
// Provider priority:
//   1️⃣  Groq  (FREE, no daily limit — set GROQ_API_KEY in .env.local)
//       Get a free key at: https://console.groq.com/keys
//   2️⃣  Google Gemini 2.0 Flash Lite  (FREE — set GEMINI_API_KEY)
//   3️⃣  Anthropic Claude  (optional — set ANTHROPIC_API_KEY)
//   4️⃣  Smart local mock  (always works, no key needed)
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";

export interface ClozeCard {
  id: string;
  sentence: string;   // "The {{mitochondria}} is the powerhouse of the cell."
  blanks: {
    term: string;     // "mitochondria"
    hint: string;     // "organelle that produces ATP"
    position: number; // char index in sentence
  }[];
}

// ─── Chunking config ──────────────────────────────────────────────────────────

const CHUNK_SIZE = 8_000;  // characters per AI call
const CHUNK_OVERLAP = 0;   // 0 = no overlap; sentence-boundary splitting already prevents mid-concept cuts

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert study material creator specializing in medical, legal, and STEM content.

Your task: Convert the given textbook text into fill-in-the-blank (cloze) study cards.

Rules:
1. Identify the most important terms, concepts, definitions, names, dates, values, and mechanisms.
2. Create one card per key concept. Each card = one sentence or clause from the source text.
3. Blank out 1–3 key terms per sentence using {{double_curly_braces}}.
4. Only blank terms that are genuinely testable — not filler words.
5. Preserve the surrounding context so the blank is answerable from memory.
6. For each blank, provide a short hint (one phrase, max 6 words) explaining what the term is.
7. Aim for 5–20 cards per chunk, depending on density.

Respond ONLY with a JSON array, no markdown, no explanation:
[
  {
    "sentence": "The {{term}} is defined as ...",
    "blanks": [
      { "term": "term", "hint": "brief contextual hint" }
    ]
  }
]`;

// ─── Provider availability ────────────────────────────────────────────────────

export const isGroqConfigured    = !!process.env.GROQ_API_KEY;
export const isGeminiConfigured  = !!process.env.GEMINI_API_KEY;
export const isAnthropicConfigured = !!process.env.ANTHROPIC_API_KEY;

const groqClient = isGroqConfigured
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const geminiClient = isGeminiConfigured
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  : null;

const anthropicClient = isAnthropicConfigured
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── Text chunker ─────────────────────────────────────────────────────────────

/**
 * Splits `text` into overlapping chunks of at most `CHUNK_SIZE` chars,
 * always breaking at a sentence boundary so AI gets coherent prose.
 */
function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    // Try to break at a sentence boundary (. ! ?)
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastPunct = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf(".\n"),
      );
      if (lastPunct > CHUNK_SIZE * 0.5) {
        end = start + lastPunct + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    // Next chunk starts with some overlap to preserve cross-boundary context
    start = Math.max(start + 1, end - CHUNK_OVERLAP);
  }

  return chunks;
}

// ─── HIGH-FIDELITY LOCAL MOCK FALLBACK ───────────────────────────────────────

const DICTIONARY_HINTS: Record<string, string> = {
  mitochondria: "Powerhouse of the cell, produces ATP",
  mitochondrion: "Powerhouse of the cell",
  "action potential": "Transient nerve signal propagated along axon",
  axon: "Long projection of a neuron",
  neuron: "Nervous system cell",
  synapse: "Junction between two nerve cells",
  threshold: "Minimum depolarization to fire action potential",
  membrane: "Thin lipid barrier surrounding cell",
  "sodium channels": "Ion channels causing depolarization",
  sodium: "Na+ — key depolarizing ion",
  potassium: "K+ — key repolarizing ion",
  calcium: "Ca2+ — triggers neurotransmitter release",
  adenosine: "Chemical related to ATP and sleep pressure",
  atp: "Primary cellular energy currency",
  dna: "Double-helix genetic material",
  rna: "Single-stranded nucleic acid helper",
  ribosome: "Cellular site of protein synthesis",
  proteins: "Chains of amino acids executing cellular functions",
  nucleus: "Organelle containing genetic DNA",
  cytoplasm: "Fluid filling the inside of a cell",
  contract: "Legally binding agreement",
  tort: "Civil wrong causing harm or loss",
  liability: "Legal responsibility for actions",
  damages: "Monetary compensation for loss",
  negligence: "Failure to behave with reasonable care",
  plaintiff: "Party initiating a lawsuit",
  defendant: "Party being sued",
  constitution: "Supreme law of a nation",
  jurisdiction: "Official power to make legal decisions",
  precedent: "Earlier event serving as an authoritative guide",
  statute: "Written law passed by a legislative body",
  velocity: "Rate of change of position",
  acceleration: "Rate of change of velocity",
  gravity: "Force pulling objects toward center of mass",
  force: "Influence changing motion (F = ma)",
  energy: "Quantitative property that must be transferred",
  entropy: "Measure of disorder in a system",
  photosynthesis: "Process turning sunlight into chemical energy",
  chloroplast: "Organelle conducting photosynthesis",
  respiration: "Process breaking down glucose for energy",
  homeostasis: "Tendency toward stable equilibrium",
  diffusion: "Net movement from high to low concentration",
  osmosis: "Diffusion of water across a membrane",
  enzyme: "Biological catalyst accelerating reactions",
  substrate: "Substance on which an enzyme acts",
};

function generateMockClozeCards(text: string, subject: string): ClozeCard[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const results: ClozeCard[] = [];
  const sampleSentences = sentences.slice(0, 15);

  for (const origSentence of sampleSentences) {
    const words = origSentence.split(/[\s,.;:()"'!]+/);
    const candidateTerms: string[] = [];

    Object.keys(DICTIONARY_HINTS).forEach((phrase) => {
      if (phrase.includes(" ") && origSentence.toLowerCase().includes(phrase)) {
        if (!candidateTerms.includes(phrase)) candidateTerms.push(phrase);
      }
    });

    words.forEach((word) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9-]/g, "");
      if (cleanWord.length < 4) return;
      const lower = cleanWord.toLowerCase();
      if (
        DICTIONARY_HINTS[lower] ||
        /^[A-Z]/.test(cleanWord) ||
        /(?:tion|ity|ism|ase|ose|ial|um|us|rt|act|ent|ant)$/i.test(cleanWord)
      ) {
        const matchText = new RegExp(`\\b${cleanWord}\\b`, "i").exec(origSentence);
        if (matchText && !candidateTerms.includes(matchText[0])) {
          candidateTerms.push(matchText[0]);
        }
      }
    });

    candidateTerms.sort((a, b) => b.length - a.length);
    const selectedTerms = candidateTerms.slice(
      0,
      Math.min(3, Math.max(1, Math.floor(Math.random() * 2) + 1))
    );

    if (selectedTerms.length === 0) {
      const fallbackWord = words.find(
        (w) => w.length > 5 && !/^(the|this|that|with|from|their)$/i.test(w)
      );
      if (fallbackWord) selectedTerms.push(fallbackWord.replace(/[^a-zA-Z0-9-]/g, ""));
    }
    if (selectedTerms.length === 0) continue;

    let processedSentence = origSentence;
    const blanks: { term: string; hint: string; position: number }[] = [];

    selectedTerms.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      const match = regex.exec(processedSentence);
      if (match) {
        const actualTerm = match[0];
        processedSentence = processedSentence.replace(regex, `{{${actualTerm}}}`);
        const lowerTerm = actualTerm.toLowerCase();
        let hint = DICTIONARY_HINTS[lowerTerm];
        if (!hint) {
          const foundKey = Object.keys(DICTIONARY_HINTS).find((key) => lowerTerm.includes(key));
          hint = foundKey ? DICTIONARY_HINTS[foundKey] : `Key term in ${subject || "subject"} passage`;
        }
        blanks.push({ term: actualTerm, hint, position: -1 });
      }
    });

    const finalBlanks = blanks
      .map((b) => ({ ...b, position: processedSentence.indexOf(`{{${b.term}}}`) }))
      .filter((b) => b.position !== -1);

    if (finalBlanks.length > 0) {
      results.push({ id: crypto.randomUUID(), sentence: processedSentence, blanks: finalBlanks });
    }
  }

  return results;
}

// ─── Parse AI JSON response ───────────────────────────────────────────────────

function parseAIResponse(raw: string): ClozeCard[] {
  const cleanJSON = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleanJSON);
  return parsed.map((card: any) => ({
    id: crypto.randomUUID(),
    sentence: card.sentence,
    blanks: card.blanks.map((b: any) => ({
      term: b.term,
      hint: b.hint,
      position: card.sentence.indexOf(`{{${b.term}}}`),
    })),
  }));
}

// ─── Rate-limit-safe Gemini helper ──────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.0-flash-lite";
const INTER_CHUNK_DELAY_MS = 2_000;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Returns true for quota / rate-limit errors from any provider. */
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

// ─── Groq generator (1️⃣ preferred — no daily quota) ─────────────────────────────

async function generateChunkWithGroq(chunk: string, subject: string): Promise<ClozeCard[]> {
  const response = await groqClient!.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Subject: ${subject}\n\nText:\n${chunk}` },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });
  const raw = response.choices[0]?.message?.content ?? "";
  return parseAIResponse(raw);
}

// ─── Gemini generator (2️⃣ fallback) ──────────────────────────────────────────

async function geminiGenerateWithRetry(
  prompt: string,
  systemInstruction: string,
  retries = 2
): Promise<string> {
  const model = geminiClient!.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction });
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      if (isQuotaError(err) && attempt < retries) {
        const waitMs = Math.pow(2, attempt + 1) * 3_000;
        console.warn(`  ⏳ Gemini quota — retrying in ${waitMs / 1000}s`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Gemini retries exhausted");
}

async function generateChunkWithGemini(chunk: string, subject: string): Promise<ClozeCard[]> {
  const raw = await geminiGenerateWithRetry(`Subject: ${subject}\n\nText:\n${chunk}`, SYSTEM_PROMPT);
  return parseAIResponse(raw);
}

async function generateChunkWithAnthropic(chunk: string, subject: string): Promise<ClozeCard[]> {
  const modelName = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  const message = await anthropicClient!.messages.create({
    model: modelName,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Subject: ${subject}\n\nText:\n${chunk}` }],
  });
  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  return parseAIResponse(raw);
}

// ─── Chunk deduplication ──────────────────────────────────────────────────────

/**
 * Remove near-duplicate cards.
 * Strategy: normalise each sentence (strip blanks markers, lowercase, collapse spaces)
 * then reject any card whose normalised core is already covered by a previously seen card.
 */
function deduplicateCards(cards: ClozeCard[]): ClozeCard[] {
  // Strip {{...}} markers and normalise to plain lowercase text for comparison
  function normalize(sentence: string) {
    return sentence
      .replace(/\{\{.*?\}\}/g, "BLANK")   // replace blanks with a fixed token
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();
  }

  const kept: string[] = [];

  return cards.filter((card) => {
    const norm = normalize(card.sentence);

    // Reject if any already-kept card contains ≥70% of this card's content
    const isDuplicate = kept.some((prev) => {
      // Check substring containment in both directions
      if (prev.includes(norm) || norm.includes(prev)) return true;

      // Levenshtein-free similarity: count shared trigrams
      const trigrams = (s: string) => {
        const set = new Set<string>();
        for (let i = 0; i < s.length - 2; i++) set.add(s.slice(i, i + 3));
        return set;
      };
      const a = trigrams(norm);
      const b = trigrams(prev);
      let shared = 0;
      a.forEach((t) => { if (b.has(t)) shared++; });
      const similarity = (2 * shared) / (a.size + b.size);
      return similarity > 0.72;
    });

    if (!isDuplicate) kept.push(norm);
    return !isDuplicate;
  });
}

// ─── Progress callback type ───────────────────────────────────────────────────

export type ChunkProgressCallback = (done: number, total: number) => void;

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function convertTextToClozeCards(
  text: string,
  subject: string,
  onProgress?: ChunkProgressCallback
): Promise<ClozeCard[]> {
  const chunks = chunkText(text);
  const totalChunks = chunks.length;
  console.log(`📚 Processing ${totalChunks} chunk(s) from ${text.length.toLocaleString()} chars`);

  const allCards: ClozeCard[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    onProgress?.(i, totalChunks);

    // Throttle: wait between chunks to respect free-tier RPM limits
    if (i > 0 && (isGeminiConfigured || isAnthropicConfigured)) {
      await sleep(INTER_CHUNK_DELAY_MS);
    }

    let chunkCards: ClozeCard[] = [];

    // 1️⃣ Groq — free, no daily limit, fast Llama 3.3 70B
    if (isGroqConfigured && groqClient) {
      try {
        console.log(`  🤖 Groq chunk ${i + 1}/${totalChunks}...`);
        chunkCards = await generateChunkWithGroq(chunk, subject);
      } catch (err) {
        console.warn(`  Groq chunk ${i + 1} failed:`, err);
      }
    }

    // 2️⃣ Gemini (with retry)
    if (chunkCards.length === 0 && isGeminiConfigured && geminiClient) {
      try {
        console.log(`  🤖 Gemini chunk ${i + 1}/${totalChunks}...`);
        chunkCards = await generateChunkWithGemini(chunk, subject);
      } catch (err) {
        if (isQuotaError(err)) {
          console.warn(`  Gemini quota exhausted — skipping to next provider`);
        } else {
          console.warn(`  Gemini chunk ${i + 1} failed:`, err);
        }
      }
    }

    // 3️⃣ Anthropic Claude
    if (chunkCards.length === 0 && isAnthropicConfigured && anthropicClient) {
      try {
        console.log(`  🤖 Anthropic chunk ${i + 1}/${totalChunks}...`);
        chunkCards = await generateChunkWithAnthropic(chunk, subject);
      } catch (err) {
        console.warn(`  Anthropic chunk ${i + 1} failed:`, err);
      }
    }

    // 4️⃣ Smart local mock (always works)
    if (chunkCards.length === 0) {
      console.log(`  🤖 Mock chunk ${i + 1}/${totalChunks}...`);
      chunkCards = generateMockClozeCards(chunk, subject);
    }

    allCards.push(...chunkCards);
  }

  onProgress?.(totalChunks, totalChunks);

  const unique = deduplicateCards(allCards);
  console.log(`✅ ${unique.length} unique cards from ${totalChunks} chunk(s)`);
  return unique;
}
