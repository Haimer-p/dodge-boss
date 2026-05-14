"use client";

import { useState } from "react";
import { googleSearchUrl } from "@/lib/media-apis";
import BackButton from "@/components/ui/BackButton";

const QUICK_SEARCHES = [
  "typescript best practices",
  "react server components",
  "kubernetes deployment guide",
  "system design interview",
];

export default function GoogleMode() {
  const [query, setQuery] = useState("");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const goHome = () => setIframeUrl(null);

  const doSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setIframeUrl(googleSearchUrl(trimmed));
    setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 8));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm min-h-0">
      <div className="shrink-0 px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap bg-white">
        {iframeUrl && (
          <BackButton onClick={goHome} label="Back to search" variant="light" />
        )}
        <span className="text-2xl font-bold tracking-tight select-none">
          <span className="text-blue-500">G</span>
          <span className="text-red-500">o</span>
          <span className="text-yellow-500">o</span>
          <span className="text-blue-500">g</span>
          <span className="text-green-500">l</span>
          <span className="text-red-500">e</span>
        </span>
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2 min-w-[200px] max-w-2xl">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Google..."
              className="input-3d input-3d-light rounded-full pl-11"
            />
          </div>
          <button
            type="submit"
            className="btn-3d btn-3d-primary px-5 py-2.5 text-sm rounded-xl min-h-[44px]"
          >
            Search
          </button>
        </form>
      </div>

      {!iframeUrl ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
          <div className="text-[72px] font-normal tracking-tight mb-8 select-none">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </div>
          <form onSubmit={handleSubmit} className="w-full max-w-xl">
            <div className="relative">
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-3d input-3d-light rounded-full pl-12 text-base"
                placeholder="Search Google or type a URL"
              />
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button type="submit" className="btn-3d btn-3d-primary px-5 py-2 text-sm rounded-xl min-h-[40px]">
                Google Search
              </button>
              <button
                type="button"
                onClick={() => doSearch("I'm Feeling Lucky")}
                className="btn-3d btn-3d-secondary px-5 py-2 text-sm rounded-xl min-h-[40px] !text-gray-700 !from-[#f8f9fa] !to-[#e8eaed] !shadow-[0_3px_0_#dadce0]"
              >
                I&apos;m Feeling Lucky
              </button>
            </div>
          </form>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {QUICK_SEARCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => doSearch(s)}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
          {history.length > 0 && (
            <div className="mt-8 w-full max-w-xl">
              <p className="text-xs text-gray-500 mb-2">Recent searches</p>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => doSearch(h)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="shrink-0 px-4 py-2.5 border-b border-gray-100 bg-[#f8f9fa] flex items-center gap-3">
            <BackButton onClick={goHome} label="Back to search" variant="light" />
            <span className="text-sm text-gray-600 truncate">
              Results for: <span className="font-medium text-gray-800">{query}</span>
            </span>
          </div>
          <iframe
            src={iframeUrl}
            title="Google Search Results"
            className="flex-1 w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      )}
    </div>
  );
}
