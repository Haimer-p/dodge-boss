export interface VocabWord {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  definitionVi: string;
  example: string;
  exampleVi: string;
}

export interface VocabBatch {
  words: VocabWord[];
  generatedAt: number;
  level: VocabLevel;
}

export type VocabLevel = "beginner" | "intermediate" | "advanced";

const LEARNED_KEY = "dodgeboss:vocab:learned";
const BATCH_KEY = "dodgeboss:vocab:batch";
const LEVEL_KEY = "dodgeboss:vocab:level";

export function loadLearnedWords(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEARNED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLearnedWords(words: string[]): void {
  localStorage.setItem(LEARNED_KEY, JSON.stringify(words));
}

export function markWordLearned(word: string): string[] {
  const normalized = word.toLowerCase().trim();
  const learned = loadLearnedWords();
  if (!learned.includes(normalized)) {
    learned.push(normalized);
    saveLearnedWords(learned);
  }
  return learned;
}

export function loadVocabBatch(): VocabBatch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BATCH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveVocabBatch(batch: VocabBatch): void {
  localStorage.setItem(BATCH_KEY, JSON.stringify(batch));
}

export function loadVocabLevel(): VocabLevel {
  if (typeof window === "undefined") return "intermediate";
  const v = localStorage.getItem(LEVEL_KEY);
  if (v === "beginner" || v === "advanced") return v;
  return "intermediate";
}

export function saveVocabLevel(level: VocabLevel): void {
  localStorage.setItem(LEVEL_KEY, level);
}

export function clearCurrentBatch(): void {
  localStorage.removeItem(BATCH_KEY);
}
