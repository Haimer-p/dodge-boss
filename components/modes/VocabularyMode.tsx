"use client";

import { useCallback, useEffect, useState } from "react";
import {
  VocabBatch,
  VocabLevel,
  VocabWord,
  clearCurrentBatch,
  loadLearnedWords,
  loadVocabBatch,
  loadVocabLevel,
  markWordLearned,
  saveVocabBatch,
  saveVocabLevel,
} from "@/lib/vocabulary";

export default function VocabularyMode() {
  const [batch, setBatch] = useState<VocabBatch | null>(null);
  const [learned, setLearned] = useState<string[]>([]);
  const [level, setLevel] = useState<VocabLevel>("intermediate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [learnedFlash, setLearnedFlash] = useState<string | null>(null);

  useEffect(() => {
    setLearned(loadLearnedWords());
    setLevel(loadVocabLevel());
    const saved = loadVocabBatch();
    if (saved?.words?.length) setBatch(saved);
  }, []);

  const generateWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const exclude = loadLearnedWords();
      const res = await fetch("/api/vocabulary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, count: 6, exclude }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generate failed");

      const newBatch: VocabBatch = {
        words: data.words as VocabWord[],
        generatedAt: data.generatedAt,
        level: data.level,
      };
      setBatch(newBatch);
      saveVocabBatch(newBatch);
      setExpandedId(newBatch.words[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate words");
    } finally {
      setLoading(false);
    }
  }, [level]);

  const handleMarkLearned = (word: VocabWord) => {
    const updated = markWordLearned(word.word);
    setLearned(updated);
    setLearnedFlash(word.id);
    setTimeout(() => setLearnedFlash(null), 600);

    if (batch) {
      const remaining = batch.words.filter(
        (w) => !updated.includes(w.word.toLowerCase())
      );
      if (remaining.length === 0) {
        clearCurrentBatch();
        setBatch(null);
        setExpandedId(null);
      } else {
        const next = { ...batch, words: remaining };
        setBatch(next);
        saveVocabBatch(next);
        if (expandedId === word.id) {
          setExpandedId(remaining[0]?.id ?? null);
        }
      }
    }
  };

  const handleLevelChange = (next: VocabLevel) => {
    setLevel(next);
    saveVocabLevel(next);
  };

  const pendingInBatch =
    batch?.words.filter((w) => !learned.includes(w.word.toLowerCase())) ?? [];

  return (
    <div className="flex-1 flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-sm min-h-0">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h12a2 2 0 0 1 2 2v13l-5-3-5 3-5-3-5 3V6a2 2 0 0 1 2-2z" />
          </svg>
          <span className="text-sm font-semibold text-slate-200">
            Confluence — Engineering Glossary
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["beginner", "intermediate", "advanced"] as VocabLevel[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleLevelChange(l)}
              className={`px-2.5 py-1 text-[10px] rounded-lg capitalize transition-colors ${
                level === l
                  ? "bg-blue-600/30 text-blue-300 ring-1 ring-blue-500/40"
                  : "text-slate-500 hover:bg-slate-800"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center gap-3 text-xs shrink-0">
        <span className="text-slate-500">
          Learned: <span className="text-green-400 font-semibold">{learned.length}</span>
        </span>
        {batch && (
          <span className="text-slate-500">
            Current set: <span className="text-blue-300">{pendingInBatch.length}</span> left
          </span>
        )}
        <button
          type="button"
          onClick={generateWords}
          disabled={loading}
          className="btn-3d btn-3d-primary px-4 py-2 text-xs rounded-xl min-h-[36px] ml-auto disabled:opacity-50"
        >
          {loading ? "Generating…" : batch ? "New words (Gemini)" : "Generate words"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto thin-scrollbar p-4 space-y-3 min-h-0">
        {!batch && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 mb-1">No vocabulary set yet</p>
            <p className="text-xs text-slate-600 mb-4">Gemini will generate words you haven&apos;t learned yet</p>
            <button
              type="button"
              onClick={generateWords}
              className="btn-3d btn-3d-primary px-5 py-2.5 text-sm rounded-xl"
            >
              Start learning
            </button>
          </div>
        )}

        {batch && pendingInBatch.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-green-400 text-sm font-medium mb-2">Set complete!</p>
            <p className="text-xs text-slate-500 mb-4">All words marked as learned</p>
            <button
              type="button"
              onClick={generateWords}
              className="btn-3d btn-3d-primary px-5 py-2.5 text-sm rounded-xl"
            >
              Generate new words
            </button>
          </div>
        )}

        {batch?.words.map((w) => {
          const isLearned = learned.includes(w.word.toLowerCase());
          const isOpen = expandedId === w.id;
          const flash = learnedFlash === w.id;

          return (
            <div
              key={w.id}
              className={`rounded-xl border transition-all ${
                flash
                  ? "border-green-500/60 bg-green-500/10 scale-[0.98]"
                  : isLearned
                  ? "border-slate-800 bg-slate-900/40 opacity-50"
                  : "border-slate-700 bg-slate-900/80 hover:border-slate-600"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : w.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-lg font-bold text-slate-100">{w.word}</span>
                    {w.phonetic && (
                      <span className="text-xs text-slate-500 font-mono">{w.phonetic}</span>
                    )}
                    <span className="text-[10px] uppercase tracking-wide text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      {w.partOfSpeech}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5 truncate">{w.definitionVi || w.definition}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-800/80 pt-3">
                  <div>
                    <p className="text-[10px] uppercase text-slate-500 mb-1">English</p>
                    <p className="text-sm text-slate-300">{w.definition}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-500 mb-1">Tiếng Việt</p>
                    <p className="text-sm text-slate-300">{w.definitionVi}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-sm text-slate-200 italic">&ldquo;{w.example}&rdquo;</p>
                    <p className="text-xs text-slate-500 mt-1">{w.exampleVi}</p>
                  </div>
                  {!isLearned && (
                    <button
                      type="button"
                      onClick={() => handleMarkLearned(w)}
                      className="btn-3d btn-3d-primary w-full py-2.5 text-sm rounded-xl"
                    >
                      Đã học xong
                    </button>
                  )}
                  {isLearned && (
                    <p className="text-center text-xs text-green-400">✓ Đã học</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
