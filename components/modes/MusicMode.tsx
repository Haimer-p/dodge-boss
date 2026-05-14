"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RadioStation, searchRadioStations } from "@/lib/media-apis";

const GENRE_PRESETS = ["lofi", "jazz", "classical", "ambient", "pop", "rock", "vietnam"];

export default function MusicMode() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [query, setQuery] = useState("lofi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<RadioStation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const loadStations = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchRadioStations(q);
      const valid = results.filter((s) => s.url_resolved || s.url);
      setStations(valid);
      if (valid.length === 0) setError("No stations found");
    } catch {
      setError("Could not load stations. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStations("lofi");
  }, [loadStations]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const playStation = async (station: RadioStation) => {
    const url = station.url_resolved || station.url;
    if (!audioRef.current || !url) return;
    setCurrent(station);
    audioRef.current.src = url;
    try {
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setError("Cannot play this stream. Try another station.");
      setPlaying(false);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (!current && stations[0]) {
      await playStation(stations[0]);
      return;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        setError("Playback failed");
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStations(query);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#121212] rounded-lg overflow-hidden border border-gray-800 shadow-sm">
      <audio ref={audioRef} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />

      <div className="bg-[#181818] border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <span className="text-sm font-semibold text-gray-200">Focus Playlist — Work Mode</span>
        </div>
        <span className="text-xs text-gray-500">Free radio via Radio Browser</span>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-72 shrink-0 border-r border-gray-800 flex flex-col bg-[#181818]">
          <form onSubmit={handleSearch} className="p-3 border-b border-gray-800">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stations..."
              className="input-3d w-full rounded-full"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {GENRE_PRESETS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setQuery(g); loadStations(g); }}
                  className="px-2.5 py-1 text-xs bg-[#282828] hover:bg-[#333] text-gray-400 rounded-full capitalize transition-colors"
                >
                  {g}
                </button>
              ))}
            </div>
          </form>

          <div className="flex-1 overflow-y-auto thin-scrollbar">
            {loading && <p className="text-xs text-gray-500 p-3">Loading...</p>}
            {error && <p className="text-xs text-red-400 p-3">{error}</p>}
            {stations.map((s) => (
              <button
                key={s.stationuuid}
                type="button"
                onClick={() => playStation(s)}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-gray-800/50 ${
                  current?.stationuuid === s.stationuuid ? "bg-green-500/10" : ""
                }`}
              >
                <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center shrink-0 overflow-hidden">
                  {s.favicon ? (
                    <img src={s.favicon} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <span className="text-green-500 text-lg">♪</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 truncate">{s.name}</p>
                  <p className="text-xs text-gray-500 truncate">{s.country} · {s.bitrate ? `${s.bitrate}kbps` : "live"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1a1a2e] to-[#121212]">
          <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-green-600/30 to-purple-600/30 flex items-center justify-center mb-6 shadow-2xl">
            <span className="text-6xl">{playing ? "🎵" : "🎧"}</span>
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-1 max-w-md truncate">
            {current?.name ?? "Select a station"}
          </h2>
          <p className="text-sm text-gray-400 mb-6">{current?.country ?? "Radio Browser — free streams"}</p>

          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 text-black flex items-center justify-center transition-colors shadow-lg shadow-green-500/30"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg className="w-6 h-6 ml-1" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21" /></svg>
              )}
            </button>
          </div>

          <div className="w-full max-w-xs flex items-center gap-3">
            <svg className="w-4 h-4 text-gray-500 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="range-3d flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
