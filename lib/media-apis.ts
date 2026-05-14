const RADIO_API = "https://de1.api.radio-browser.info/json";

export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  country: string;
  tags: string;
  bitrate: number;
}

export async function searchRadioStations(query: string, limit = 20): Promise<RadioStation[]> {
  const params = new URLSearchParams({
    name: query || "jazz",
    limit: String(limit),
    order: "clickcount",
    reverse: "true",
  });
  const res = await fetch(`${RADIO_API}/stations/search?${params}`, {
    headers: { "User-Agent": "DodgeBoss/1.0" },
  });
  if (!res.ok) throw new Error("Radio search failed");
  return res.json();
}

export interface InvidiousVideo {
  type: string;
  title: string;
  videoId: string;
  author: string;
  videoThumbnails?: { quality: string; url: string }[];
  lengthSeconds?: number;
}

const INVIDIOUS_INSTANCES = [
  "https://vid.puffyan.us",
  "https://invidious.fdn.fr",
  "https://yewtu.be",
];

export async function searchYoutube(query: string): Promise<InvidiousVideo[]> {
  let lastError: Error | null = null;
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=1`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      return (data as InvidiousVideo[]).filter((v) => v.type === "video" && v.videoId);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("Search failed");
    }
  }
  throw lastError ?? new Error("No Invidious instance available");
}

export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`;
}

export function googleSearchUrl(query: string) {
  return `https://www.google.com/search?igu=1&q=${encodeURIComponent(query)}`;
}
