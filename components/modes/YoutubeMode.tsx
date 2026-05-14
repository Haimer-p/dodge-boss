"use client";

import { useState, useCallback } from "react";
import BackButton from "@/components/ui/BackButton";
import {
  InvidiousVideo,
  searchYoutube,
  extractYoutubeId,
  youtubeEmbedUrl,
} from "@/lib/media-apis";

const DEFAULT_VIDEO_ID = "jfKfPfyJRdk"; // lofi girl - well known

export default function YoutubeMode() {
  const [videoId, setVideoId] = useState(DEFAULT_VIDEO_ID);
  const [videoTitle, setVideoTitle] = useState("lofi hip hop radio - beats to relax/study to");
  const [query, setQuery] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [results, setResults] = useState<InvidiousVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSearch = () => {
    setResults([]);
    setQuery("");
    setError(null);
  };

  const selectVideo = (id: string, title: string) => {
    setVideoId(id);
    setVideoTitle(title);
    setError(null);
  };

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const videos = await searchYoutube(query.trim());
      setResults(videos.slice(0, 12));
      if (videos.length === 0) setError("No videos found");
    } catch {
      setError("Search unavailable. Paste a YouTube URL instead.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYoutubeId(urlInput);
    if (id) {
      selectVideo(id, "Custom video");
      setUrlInput("");
    } else {
      setError("Invalid YouTube URL or video ID");
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden rounded-lg border border-gray-800 shadow-sm bg-[#0f0f0f] min-h-0">
      {/* Player — left panel */}
      <div className="w-[min(100%,420px)] shrink-0 flex flex-col border-r border-gray-800 bg-black">
        <div className="bg-[#212121] px-3 py-2 flex items-center gap-2 border-b border-gray-800">
          <svg className="w-5 h-5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
          </svg>
          <span className="text-xs text-gray-300 truncate font-medium">YouTube Player</span>
        </div>

        <div className="aspect-video w-full bg-black shrink-0">
          <iframe
            key={videoId}
            src={youtubeEmbedUrl(videoId)}
            title={videoTitle}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="p-3 flex-1 overflow-y-auto thin-scrollbar">
          <h3 className="text-sm font-semibold text-gray-100 leading-snug mb-2 line-clamp-3">{videoTitle}</h3>
          <p className="text-xs text-gray-500">Video ID: {videoId}</p>
          <form onSubmit={handleUrlSubmit} className="mt-3 flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste YouTube URL..."
              className="input-3d input-3d-sm flex-1 min-w-0 rounded-lg"
            />
            <button type="submit" className="px-3 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg shrink-0">
              Load
            </button>
          </form>
        </div>
      </div>

      {/* Search & results — right panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f0f0f]">
        <div className="p-3 border-b border-gray-800 flex items-start gap-2">
          {results.length > 0 && (
            <BackButton onClick={clearSearch} label="Back" className="!min-h-[40px] shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search YouTube..."
                className="input-3d flex-1 rounded-full"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm bg-[#272727] hover:bg-[#3f3f3f] text-gray-200 rounded-full transition-colors disabled:opacity-50"
              >
                {loading ? "..." : "Search"}
              </button>
            </form>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar p-3">
          {results.length === 0 && !loading && (
            <div className="text-center text-gray-500 text-sm mt-8 px-4">
              <p className="mb-2">Search videos or paste a URL on the left</p>
              <p className="text-xs text-gray-600">Uses Invidious API (free, no API key)</p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {results.map((v) => {
              const thumb = v.videoThumbnails?.find((t) => t.quality === "medium")?.url
                ?? v.videoThumbnails?.[0]?.url;
              return (
                <button
                  key={v.videoId}
                  type="button"
                  onClick={() => selectVideo(v.videoId, v.title)}
                  className={`flex gap-3 text-left p-2 rounded-xl hover:bg-white/5 transition-colors ${
                    videoId === v.videoId ? "bg-white/10 ring-1 ring-red-500/40" : ""
                  }`}
                >
                  <div className="w-36 aspect-video rounded-lg bg-gray-800 shrink-0 overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No thumb</div>
                    )}
                  </div>
                  <div className="min-w-0 py-0.5">
                    <p className="text-sm text-gray-100 line-clamp-2 leading-snug">{v.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{v.author}</p>
                    {v.lengthSeconds != null && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {Math.floor(v.lengthSeconds / 60)}:{String(v.lengthSeconds % 60).padStart(2, "0")}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
