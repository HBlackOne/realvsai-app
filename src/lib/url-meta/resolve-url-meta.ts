import "server-only";

export type UrlMetaPlatform = "youtube" | "tiktok" | "vimeo" | "generic";
export type UrlMetaMediaType = "image" | "audio" | "video";

export type ResolvedUrlMeta = {
  originalUrl: string;
  resolvedUrl: string;
  platform: UrlMetaPlatform;
  detectedType: UrlMetaMediaType | null;
  contentType: string | null;
  title: string | null;
  thumbnail: string | null;
  duration: number | null;
  siteName: string | null;
};

type FetchResult = {
  response: Response;
  resolvedUrl: string;
  contentType: string | null;
  html: string | null;
};

function detectPlatform(url: string): UrlMetaPlatform {
  const value = url.toLowerCase();
  if (/youtube\.com|youtu\.be/.test(value)) return "youtube";
  if (/tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com/.test(value)) return "tiktok";
  if (/vimeo\.com/.test(value)) return "vimeo";
  return "generic";
}

function inferMediaType(url: string, contentType?: string | null): UrlMetaMediaType | null {
  const type = (contentType || "").toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("video/")) return "video";

  const value = url.toLowerCase();
  if (/(\.png|\.jpe?g|\.webp|\.gif)(\?|#|$)/.test(value)) return "image";
  if (/(\.mp3|\.wav|\.m4a)(\?|#|$)/.test(value)) return "audio";
  if (/(\.mp4|\.mov|\.webm|\.m3u8)(\?|#|$)/.test(value)) return "video";

  const platform = detectPlatform(url);
  if (platform === "youtube" || platform === "tiktok" || platform === "vimeo") {
    return "video";
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.toLowerCase().includes("/reel/")) return "video";
  } catch {
    return null;
  }

  return null;
}

function extractMetaTag(html: string, key: string, attr: "property" | "name" = "property") {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
}

function normalizeUrl(url: string | null | undefined, baseUrl: string) {
  if (!url) return null;
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

async function fetchWithRedirects(url: string): Promise<FetchResult> {
  const doFetch = async (method: "HEAD" | "GET", includeRange = false) => {
    return fetch(url, {
      method,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; RealvsAI/1.0; +https://realvs.ai)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,video/*,audio/*,*/*;q=0.8",
        ...(includeRange ? { range: "bytes=0-4096" } : {}),
      },
      cache: "no-store",
    });
  };

  let response: Response;
  try {
    response = await doFetch("HEAD");
  } catch {
    response = await doFetch("GET", true);
  }

  const resolvedUrl = response.url || url;
  const contentType = response.headers.get("content-type");
  let html: string | null = null;

  if ((contentType || "").toLowerCase().includes("text/html")) {
    try {
      const htmlResponse = await doFetch("GET");
      html = await htmlResponse.text();
      return {
        response: htmlResponse,
        resolvedUrl: htmlResponse.url || resolvedUrl,
        contentType: htmlResponse.headers.get("content-type"),
        html,
      };
    } catch {
      // keep initial response
    }
  }

  return { response, resolvedUrl, contentType, html };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; RealvsAI/1.0; +https://realvs.ai)" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function extractYouTubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    }
    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v") ?? "";
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    const embedIndex = parts.findIndex((part) => part === "embed" || part === "shorts");
    if (embedIndex >= 0) return parts[embedIndex + 1] ?? "";
  } catch {
    return "";
  }
  return "";
}

function parseIsoDuration(iso: string) {
  const match = iso.match(/P(?:\d+Y)?(?:\d+M)?(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

async function fetchYouTubeMeta(url: string, fallback: FetchResult): Promise<Partial<ResolvedUrlMeta>> {
  const oembed = await fetchJson<{ title?: string; thumbnail_url?: string; author_name?: string }>(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  );

  let duration: number | null = null;
  const apiKey = process.env.YOUTUBE_API_KEY;
  const videoId = extractYouTubeId(url);
  if (apiKey && videoId) {
    const detail = await fetchJson<{ items?: Array<{ contentDetails?: { duration?: string } }> }>(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`,
    );
    duration = parseIsoDuration(detail?.items?.[0]?.contentDetails?.duration || "") ?? null;
  }

  const html = fallback.html || "";
  return {
    title: oembed?.title || extractMetaTag(html, "og:title") || extractTitle(html),
    thumbnail: normalizeUrl(oembed?.thumbnail_url || extractMetaTag(html, "og:image") || extractMetaTag(html, "twitter:image", "name"), fallback.resolvedUrl),
    duration,
    siteName: extractMetaTag(html, "og:site_name") || oembed?.author_name || "YouTube",
  };
}

async function fetchTikTokMeta(url: string, fallback: FetchResult): Promise<Partial<ResolvedUrlMeta>> {
  const oembed = await fetchJson<{ title?: string; thumbnail_url?: string; author_name?: string }>(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
  );
  const html = fallback.html || "";

  return {
    title: oembed?.title || extractMetaTag(html, "og:title") || extractTitle(html),
    thumbnail: normalizeUrl(oembed?.thumbnail_url || extractMetaTag(html, "og:image") || extractMetaTag(html, "twitter:image", "name"), fallback.resolvedUrl),
    duration: null,
    siteName: extractMetaTag(html, "og:site_name") || oembed?.author_name || "TikTok",
  };
}

async function fetchVimeoMeta(url: string, fallback: FetchResult): Promise<Partial<ResolvedUrlMeta>> {
  const oembed = await fetchJson<{ title?: string; thumbnail_url?: string; duration?: number; author_name?: string }>(
    `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
  );
  const html = fallback.html || "";

  return {
    title: oembed?.title || extractMetaTag(html, "og:title") || extractTitle(html),
    thumbnail: normalizeUrl(oembed?.thumbnail_url || extractMetaTag(html, "og:image") || extractMetaTag(html, "twitter:image", "name"), fallback.resolvedUrl),
    duration: oembed?.duration ?? null,
    siteName: extractMetaTag(html, "og:site_name") || oembed?.author_name || "Vimeo",
  };
}

async function fetchGenericMeta(fallback: FetchResult): Promise<Partial<ResolvedUrlMeta>> {
  const html = fallback.html || "";
  return {
    title: extractMetaTag(html, "og:title") || extractTitle(html),
    thumbnail: normalizeUrl(extractMetaTag(html, "og:image") || extractMetaTag(html, "twitter:image", "name"), fallback.resolvedUrl),
    duration: null,
    siteName: extractMetaTag(html, "og:site_name"),
  };
}

export async function resolveUrlMeta(url: string): Promise<ResolvedUrlMeta> {
  const fetched = await fetchWithRedirects(url);
  const platform = detectPlatform(fetched.resolvedUrl);

  const platformMeta =
    platform === "youtube"
      ? await fetchYouTubeMeta(fetched.resolvedUrl, fetched)
      : platform === "tiktok"
        ? await fetchTikTokMeta(fetched.resolvedUrl, fetched)
        : platform === "vimeo"
          ? await fetchVimeoMeta(fetched.resolvedUrl, fetched)
          : await fetchGenericMeta(fetched);

  return {
    originalUrl: url,
    resolvedUrl: fetched.resolvedUrl,
    platform,
    detectedType: inferMediaType(fetched.resolvedUrl, fetched.contentType) || inferMediaType(url, fetched.contentType),
    contentType: fetched.contentType,
    title: platformMeta.title ?? null,
    thumbnail: platformMeta.thumbnail ?? null,
    duration: platformMeta.duration ?? null,
    siteName: platformMeta.siteName ?? null,
  };
}
