import axios from "axios";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface SearchResult {
  type: "video" | "channel";
  videoId: string;
  url: string;
  title: string;
  description: string;
  image: string;
  thumbnail: string;
  seconds: number;
  timestamp: string;
  duration: {
    seconds: number;
    timestamp: string;
  };
  ago: string;
  views: number;
  author: {
    name: string;
    url: string;
  };
}

function parseViewCount(text: string): number {
  if (!text || text === "N/A") return 0;
  const cleaned = text.replace(/[, views]/g, "").trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function parseTimestampToSeconds(ts: string): number {
  if (!ts || ts === "Live") return 0;
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export async function searchYouTube(query: string, limit: number = 10): Promise<SearchResult[]> {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  const response = await axios.get(searchUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 15000,
  });

  const html = response.data as string;

  const dataMatch = new RegExp("var ytInitialData\\s*=\\s*(\\{.+?\\});\\s*<\\/script>", "s").exec(html);
  if (!dataMatch) {
    throw new Error("Failed to extract search data from YouTube");
  }

  const data = JSON.parse(dataMatch[1]);

  const results: SearchResult[] = [];

  try {
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents;

    if (!contents) {
      throw new Error("Unexpected YouTube response structure");
    }

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (!items) continue;

      for (const item of items) {
        if (item?.channelRenderer) {
          const ch = item.channelRenderer;
          const channelId = ch.channelId || "";
          const channelName =
            ch.title?.simpleText || "";
          const channelUrl =
            ch.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl ||
            ch.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url ||
            "";
          const rawThumb = ch.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || "";
          const channelThumb = rawThumb.startsWith("//") ? `https:${rawThumb}` : rawThumb;
          const about =
            ch.descriptionSnippet?.runs?.map((r: any) => r.text).join("") || "";
          const subLabel =
            ch.subscriberCountText?.simpleText || "";
          const videoCountLabel =
            ch.videoCountText?.runs?.map((r: any) => r.text).join("") || "";

          results.push({
            type: "channel",
            videoId: "",
            url: `https://youtube.com${channelUrl}`,
            title: channelName,
            description: about,
            image: channelThumb,
            thumbnail: channelThumb,
            seconds: 0,
            timestamp: "0:00",
            duration: { seconds: 0, timestamp: "0:00" },
            ago: "",
            views: 0,
            author: {
              name: channelName,
              url: `https://youtube.com/channel/${channelId}`,
            },
          } as any);

          if (results.length >= limit) break;
          continue;
        }

        const video = item?.videoRenderer;
        if (!video) continue;

        const videoId = video.videoId;
        if (!videoId) continue;

        const title =
          video.title?.runs?.map((r: any) => r.text).join("") ||
          video.title?.simpleText ||
          "";

        const description =
          video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join("") ||
          video.descriptionSnippet?.runs?.map((r: any) => r.text).join("") ||
          "";

        const thumbnail =
          video.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;

        const timestamp =
          video.lengthText?.simpleText || "Live";
        const seconds = parseTimestampToSeconds(timestamp);

        const viewsText =
          video.viewCountText?.simpleText ||
          video.viewCountText?.runs?.map((r: any) => r.text).join("") ||
          "0";
        const views = parseViewCount(viewsText);

        const ago =
          video.publishedTimeText?.simpleText || "";

        const authorName =
          video.ownerText?.runs?.map((r: any) => r.text).join("") ||
          video.longBylineText?.runs?.map((r: any) => r.text).join("") ||
          "";

        const authorUrl =
          video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl ||
          video.ownerText?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url ||
          "";

        const authorChannelId =
          video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || "";

        results.push({
          type: "video",
          videoId,
          url: `https://youtube.com/watch?v=${videoId}`,
          title,
          description,
          image: thumbnail,
          thumbnail,
          seconds,
          timestamp,
          duration: {
            seconds,
            timestamp,
          },
          ago,
          views,
          author: {
            name: authorName,
            url: authorChannelId
              ? `https://youtube.com/channel/${authorChannelId}`
              : `https://youtube.com${authorUrl}`,
          },
        });

        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }
  } catch (e: any) {
    if (results.length === 0) {
      throw new Error("Failed to parse search results: " + (e?.message || ""));
    }
  }

  return results;
}
