import axios from "axios";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface TikTokResult {
  id: string;
  title: string;
  duration: number;
  cover: string;
  video: string;
  music: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
}

const TIKTOK_API = Buffer.from("aHR0cHM6Ly93d3cudGlrdG9rLmNvbS9vZW1iZWQ=", "base64").toString();
const TIKTOK_API2 = Buffer.from("aHR0cHM6Ly90aWt3bS5jb20vYXBp", "base64").toString();

function extractTikTokId(url: string): string {
  const patterns = [
    /\/video\/(\d+)/,
    /\/v\/(\d+)/,
  ];
  for (const p of patterns) {
    const m = p.exec(url);
    if (m) return m[1];
  }
  return "";
}

export async function downloadTikTok(url: string): Promise<TikTokResult> {
  const tikwmApi = Buffer.from("aHR0cHM6Ly93d3cudGlrd20uY29tL2FwaS8=", "base64").toString();
  
  const response = await axios.post(
    tikwmApi,
    new URLSearchParams({ url, count: "12", cursor: "0", web: "1", hd: "1" }),
    {
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      timeout: 20000,
    }
  );

  const data = response.data?.data;
  if (!data) {
    throw new Error("Failed to fetch TikTok video data");
  }

  const videoId = data.id || extractTikTokId(url);
  const title = data.title || "";
  const duration = data.duration || 0;
  const cover = data.cover || data.origin_cover || "";

  const video = data.hdplay || data.play || "";
  const music = data.music || "";

  const author = {
    id: data.author?.id || "",
    name: data.author?.nickname || data.author?.unique_id || "",
    avatar: data.author?.avatar || "",
  };

  if (!video) {
    throw new Error("No video URL found in TikTok response");
  }

  return {
    id: videoId,
    title,
    duration,
    cover,
    video,
    music,
    author,
  };
}
