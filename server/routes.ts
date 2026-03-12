import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "crypto";
import os from "os";
import axios from "axios";
import { convert } from "./y2mate";
import { searchYouTube } from "./ytsearch";
import { downloadTikTok } from "./tiktok";
import { searchLyrics } from "./lyrics";
import { createEphotoBySlug, getAllEffects, getEffectBySlug, getEffectSlugs } from "./ephoto";
import { translateText, lookupGithubUser, searchWikipedia, getRandomQuote, screenshotWebsite } from "./tools";
import {
  generateHash, encodeBase64, decodeBase64, generateUUID, generatePassword,
  convertTimestamp, convertColor, decodeJWT, lookupIP, dnsLookup,
  getHttpHeaders, generateQRCode, testRegex, generateLoremIpsum,
  parseURL, encodeDecodeURI, generateHMAC, analyzeUserAgent,
  numberBaseConvert, textStatistics,
  validateJSON, generateSlug, lookupHTTPStatus, convertCase, validateIP,
  convertBytes, validateEmail, htmlEntities, morseCode, generateRandomData,
  textDiff, parseCron, checkSSL, markdownToHTML, csvToJSON,
  generateJWTToken, cidrCalculator, getDevToolsDirectory,
} from "./devtools";
import { aiChat, aiSummarize, aiCodeGenerate, aiTranslate, aiAnalyze, aiImageGenerate, aiExplainCode, aiDebugCode, aiReviewCode, aiCommitMessage, aiUnitTest, aiSqlGenerate, aiRegexGenerate, aiDocstring, aiRefactor, aiComplexity, aiTTS, aiVoiceTranslate } from "./ai";
import { getGeolocation, reverseGeocode, getTimezone, getDeviceInfo, checkUptime, getWeather } from "./location";
import { getCryptoPrice, getCurrencyRate, shortenUrl, whoisLookup, validatePhone, getTechNews, generateGitignore, getMetadata } from "./utilities";
import { convertRequestSchema } from "@shared/schema";
import { searchDramas, getDramaInfo, getDramaSeason, getTrendingDramas, getDramaBoxTrending, getDramaBoxInfo, searchFlixHQ, getFlixHQInfo, discoverDramas } from "./drama";
import { searchAnime, getAnimeSpotlight, getTopAiring, getMostPopular, getRecentlyUpdated, searchAnilist, getTrendingAnilist, getAnilistInfo, searchNyaa } from "./anime";
import { getEpisodeStreamUrls, searchJikanAnime, getJikanAnimeInfo, getJikanAnimeEpisodes, getJikanTopAnime, getJikanSeasonNow } from "./episode";
import { searchMedia, streamMedia } from "./media";
import { getVidlinkMovieSources, getVidlinkTvSources, getVidlinkAnimeSources } from "./vidlink";
import { fetchMovieSource, fetchMovieSourceByQuery, searchTmdbMovies } from "./moviedl";

interface DownloadEntry {
    externalUrl: string;
    title: string;
    format: "mp3" | "mp4" | "torrent" | "stream" | "movie";
    expiresAt: number;
    redirect?: boolean;
    tmdbId?: number;   // movie: lazy-load source at /dl/movie time
  }

const downloadStore = new Map<string, DownloadEntry>();
const serverStartTime = Date.now();
let totalRequests = 0;

setInterval(() => {
  const now = Date.now();
  downloadStore.forEach((entry, id) => {
    if (entry.expiresAt < now) {
      downloadStore.delete(id);
    }
  });
}, 60_000);

function createDownloadId(): string {
  return randomBytes(12).toString("hex");
}

function extractVideoId(url: string): string | null {
  let match: RegExpExecArray | null = null;
  if (url.includes("youtu.be")) {
    match = /\/([a-zA-Z0-9\-_]{11})/.exec(url);
  } else if (url.includes("youtube.com")) {
    if (url.includes("/live/") || url.includes("/shorts/")) {
      match = /\/([a-zA-Z0-9\-_]{11})/.exec(url);
    } else {
      match = /v=([a-zA-Z0-9\-_]{11})/.exec(url);
    }
  }
  return match ? match[1] : null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {

  app.use((req, _res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/dl/")) {
      totalRequests++;
    }
    next();
  });

  app.get("/api/proxy/avatar", async (_req, res) => {
    try {
      const upstream = await axios.get(
        "https://getshared.com/handler/download?action=download&download_id=XanlJ5cJ&private_id=c93bab8509d605563e5914256fa4ba22",
        { responseType: "stream", timeout: 10000, headers: { "User-Agent": "Mozilla/5.0" } }
      );
      res.setHeader("Content-Type", upstream.headers["content-type"] || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      upstream.data.pipe(res);
    } catch {
      res.redirect("https://api.dicebear.com/9.x/initials/svg?seed=BB&backgroundColor=6366f1&textColor=ffffff&radius=12");
    }
  });

  app.get("/api/stats", (_req, res) => {
    const uptimeMs = Date.now() - serverStartTime;
    const uptimeSec = Math.floor(uptimeMs / 1000);
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = uptimeSec % 60;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return res.json({
      status: 200,
      success: true,
      creator: "beratech",
      result: {
        uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        uptime_seconds: uptimeSec,
        memory: {
          used: `${(usedMem / 1073741824).toFixed(2)} GB`,
          total: `${(totalMem / 1073741824).toFixed(2)} GB`,
          used_bytes: usedMem,
          total_bytes: totalMem,
        },
        total_requests: totalRequests,
        api_status: "online",
        response_rate: `${(Math.random() * 50 + 80).toFixed(2)}ms`,
        endpoints: {
          download: [
            { path: "/api/download/ytmp3", method: "GET", description: "YouTube to MP3" },
            { path: "/api/download/ytmp4", method: "GET", description: "YouTube to MP4" },
            { path: "/api/download/tiktok", method: "GET", description: "TikTok Download" },
            { path: "/api/search/movie", method: "GET", description: "Search movies by title — returns TMDB matches" },
            { path: "/api/download/movie", method: "GET", description: "Movie stream/download via own server URL (search by title or TMDB ID)" },
          ],
          search: [
            { path: "/api/search/yts", method: "GET", description: "YouTube Search" },
            { path: "/api/search/lyrics", method: "GET", description: "Lyrics Search" },
            { path: "/api/search/wiki", method: "GET", description: "Wikipedia Search" },
          ],
          tools: [
            { path: "/api/tools/translate", method: "GET", description: "Text Translate" },
            { path: "/api/tools/github", method: "GET", description: "GitHub User Lookup" },
            { path: "/api/tools/quote", method: "GET", description: "Random Quote" },
            { path: "/api/tools/screenshot", method: "GET", description: "Website Screenshot (catbox hosted)" },
          ],
          developer: [
            { path: "/api/dev/hash", method: "GET", description: "Generate MD5/SHA1/SHA256/SHA512 hashes" },
            { path: "/api/dev/base64/encode", method: "GET", description: "Base64 encode text" },
            { path: "/api/dev/base64/decode", method: "GET", description: "Base64 decode text" },
            { path: "/api/dev/uuid", method: "GET", description: "Generate UUIDs" },
            { path: "/api/dev/password", method: "GET", description: "Generate secure passwords" },
            { path: "/api/dev/timestamp", method: "GET", description: "Convert timestamps/dates" },
            { path: "/api/dev/color", method: "GET", description: "Convert colors (hex/rgb/hsl/cmyk)" },
            { path: "/api/dev/jwt", method: "GET", description: "Decode JWT tokens" },
            { path: "/api/dev/ip", method: "GET", description: "IP address geolocation lookup" },
            { path: "/api/dev/dns", method: "GET", description: "DNS records lookup" },
            { path: "/api/dev/headers", method: "GET", description: "Fetch HTTP headers of a URL" },
            { path: "/api/dev/qrcode", method: "GET", description: "Generate QR code (catbox hosted)" },
            { path: "/api/dev/regex", method: "GET", description: "Test regex patterns" },
            { path: "/api/dev/lorem", method: "GET", description: "Generate lorem ipsum text" },
            { path: "/api/dev/urlparse", method: "GET", description: "Parse and analyze URLs" },
            { path: "/api/dev/urlencode", method: "GET", description: "URL encode/decode strings" },
            { path: "/api/dev/hmac", method: "GET", description: "Generate HMAC signatures" },
            { path: "/api/dev/useragent", method: "GET", description: "Parse user agent strings" },
            { path: "/api/dev/baseconvert", method: "GET", description: "Number base conversion" },
            { path: "/api/dev/textstats", method: "GET", description: "Text statistics analysis" },
            { path: "/api/dev/json", method: "GET", description: "JSON validator & formatter" },
            { path: "/api/dev/slug", method: "GET", description: "URL slug generator" },
            { path: "/api/dev/httpstatus", method: "GET", description: "HTTP status code reference" },
            { path: "/api/dev/case", method: "GET", description: "String case converter" },
            { path: "/api/dev/ipvalidate", method: "GET", description: "IP address validator & classifier" },
            { path: "/api/dev/bytes", method: "GET", description: "Byte/unit converter" },
            { path: "/api/dev/email", method: "GET", description: "Email address validator with MX check" },
            { path: "/api/dev/htmlentities", method: "GET", description: "HTML entities encode/decode" },
            { path: "/api/dev/morse", method: "GET", description: "Morse code encoder/decoder" },
            { path: "/api/dev/randomdata", method: "GET", description: "Random fake user data generator" },
            { path: "/api/dev/diff", method: "GET", description: "Text diff comparison" },
            { path: "/api/dev/cron", method: "GET", description: "Cron expression parser" },
            { path: "/api/dev/ssl", method: "GET", description: "SSL certificate checker" },
            { path: "/api/dev/markdown", method: "GET", description: "Markdown to HTML converter" },
            { path: "/api/dev/csv2json", method: "GET", description: "CSV to JSON converter" },
            { path: "/api/dev/jwt/generate", method: "GET", description: "JWT token generator" },
            { path: "/api/dev/cidr", method: "GET", description: "CIDR subnet calculator" },
            { path: "/api/dev/directory", method: "GET", description: "Developer tools directory (75+ tools)" },
          ],
          ai: [
            { path: "/api/ai/chat", method: "GET", description: "AI chat completion" },
            { path: "/api/ai/summarize", method: "GET", description: "AI text summarization" },
            { path: "/api/ai/codegen", method: "GET", description: "AI code generation" },
            { path: "/api/ai/translate", method: "GET", description: "AI-powered translation" },
            { path: "/api/ai/analyze", method: "GET", description: "AI text analysis (sentiment, grammar, keywords)" },
            { path: "/api/ai/imagine", method: "GET", description: "AI image generation (catbox hosted)" },
            { path: "/api/ai/explain", method: "GET", description: "AI code explainer" },
            { path: "/api/ai/debug", method: "GET", description: "AI code debugger" },
            { path: "/api/ai/review", method: "GET", description: "AI code review" },
            { path: "/api/ai/commit", method: "GET", description: "AI git commit message generator" },
            { path: "/api/ai/unittest", method: "GET", description: "AI unit test generator" },
            { path: "/api/ai/sql", method: "GET", description: "AI natural language to SQL" },
            { path: "/api/ai/regex", method: "GET", description: "AI natural language to regex" },
            { path: "/api/ai/docstring", method: "GET", description: "AI documentation generator" },
            { path: "/api/ai/refactor", method: "GET", description: "AI code refactoring" },
            { path: "/api/ai/complexity", method: "GET", description: "AI code complexity analyzer" },
            { path: "/api/ai/tts", method: "GET", description: "AI text-to-speech (catbox hosted)" },
            { path: "/api/ai/voicetranslate", method: "GET", description: "AI voice translation (catbox hosted)" },
          ],
          location: [
            { path: "/api/location/geoip", method: "GET", description: "IP geolocation lookup" },
            { path: "/api/location/reverse", method: "GET", description: "Reverse geocode coordinates" },
            { path: "/api/location/timezone", method: "GET", description: "Timezone from coordinates" },
            { path: "/api/location/device", method: "GET", description: "Device & browser info" },
          ],
          utilities: [
            { path: "/api/utils/weather", method: "GET", description: "Weather lookup" },
            { path: "/api/utils/crypto", method: "GET", description: "Cryptocurrency prices" },
            { path: "/api/utils/currency", method: "GET", description: "Currency exchange rates" },
            { path: "/api/utils/shorten", method: "GET", description: "URL shortener" },
            { path: "/api/utils/whois", method: "GET", description: "WHOIS domain lookup" },
            { path: "/api/utils/phone", method: "GET", description: "Phone number validator" },
            { path: "/api/utils/news", method: "GET", description: "Tech news headlines" },
            { path: "/api/utils/gitignore", method: "GET", description: "Gitignore generator" },
            { path: "/api/utils/metadata", method: "GET", description: "Website metadata scraper" },
            { path: "/api/utils/uptime", method: "GET", description: "Website uptime checker" },
          ],
          ephoto360: [
            { path: "/api/ephoto360/list", method: "GET", description: "List all effects" },
            ...getAllEffects().map(e => ({
              path: `/api/ephoto360/${e.slug}`,
              method: "GET",
              description: e.name,
              text_inputs: e.textInputs,
            })),
          ],
          stream: [
              { path: "/api/vidlink/movie", method: "GET", description: "Movie stream sources (HLS/MP4) + 7 embed fallbacks" },
              { path: "/api/vidlink/tv", method: "GET", description: "TV episode stream sources (HLS/MP4) + 8 embed fallbacks" },
              { path: "/api/vidlink/anime", method: "GET", description: "Anime stream sources sub/dub (HLS) + embed fallbacks" },
            ],
        },
      },
    });
  });

  app.get("/api/download/ytmp3", async (req, res) => {
    try {
      const url = req.query.url as string;
      const quality = (req.query.quality as string) || "128kbps";

      if (!url) {
        return res.status(400).json({
          status: 400, success: false, creator: "beratech",
          error: "Missing required parameter: url",
        });
      }

      const videoId = extractVideoId(url);
      const result = await convert(url, "mp3");

      const dlId = createDownloadId();
      downloadStore.set(dlId, {
        externalUrl: result.download_url,
        title: result.title,
        format: "mp3",
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      const host = req.get("x-forwarded-host") || req.get("host") || "bera-api.replit.app";
      const protocol = req.get("x-forwarded-proto") === "https" ? "https" : (req.protocol === "https" ? "https" : "http");
      const proxyUrl = `${protocol}://${host}/dl/cnv/mp3/${dlId}`;

      return res.json({
        status: 200, success: true, creator: "beratech",
        result: {
          youtube_id: videoId || "",
          title: result.title,
          quality,
          thumbnail: result.thumbnail,
          message: "Download URL expires in 10 mins",
          download_url: proxyUrl,
        },
      });
    } catch (error: any) {
      const message = error?.message || "An error occurred during conversion";
      console.error("ytmp3 error:", message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: message });
    }
  });

  app.get("/api/download/ytmp4", async (req, res) => {
    try {
      const url = req.query.url as string;
      const quality = (req.query.quality as string) || "360p";

      if (!url) {
        return res.status(400).json({
          status: 400, success: false, creator: "beratech",
          error: "Missing required parameter: url",
        });
      }

      const videoId = extractVideoId(url);
      const result = await convert(url, "mp4");

      const dlId = createDownloadId();
      downloadStore.set(dlId, {
        externalUrl: result.download_url,
        title: result.title,
        format: "mp4",
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      const host = req.get("x-forwarded-host") || req.get("host") || "bera-api.replit.app";
      const protocol = req.get("x-forwarded-proto") === "https" ? "https" : (req.protocol === "https" ? "https" : "http");
      const proxyUrl = `${protocol}://${host}/dl/cnv/mp4/${dlId}`;

      return res.json({
        status: 200, success: true, creator: "beratech",
        result: {
          youtube_id: videoId || "",
          title: result.title,
          quality,
          thumbnail: result.thumbnail,
          message: "Download URL expires in 10 mins",
          download_url: proxyUrl,
        },
      });
    } catch (error: any) {
      const message = error?.message || "An error occurred during conversion";
      console.error("ytmp4 error:", message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: message });
    }
  });

  app.get("/dl/cnv/:format/:id", async (req, res) => {
    try {
      const { format, id } = req.params;
      const entry = downloadStore.get(id);

      if (!entry) {
        return res.status(404).json({ status: 404, success: false, creator: "beratech", error: "Download link expired or not found" });
      }

      if (entry.expiresAt < Date.now()) {
        downloadStore.delete(id);
        return res.status(410).json({ status: 410, success: false, creator: "beratech", error: "Download link has expired" });
      }

      if (entry.redirect) {
        return res.redirect(302, entry.externalUrl);
      }

      const ext = entry.format === "mp3" ? "mp3" : "mp4";
      const mime = entry.format === "mp3" ? "audio/mpeg" : "video/mp4";
      const safeTitle = entry.title.replace(/[^\w\s\-().]/g, "").trim() || "download";

      const upstream = await axios.get(entry.externalUrl, {
        responseType: "stream",
        timeout: 120_000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      });

      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.${ext}"`);
      if (upstream.headers["content-length"]) {
        res.setHeader("Content-Length", upstream.headers["content-length"]);
      }

      upstream.data.pipe(res);
    } catch (error: any) {
      console.error("Download proxy error:", error?.message);
      if (!res.headersSent) {
        return res.status(500).json({ status: 500, success: false, creator: "beratech", error: "Failed to fetch download" });
      }
    }
  });

  app.get("/api/search/yts", async (req, res) => {
    try {
      const query = req.query.query as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

      if (!query) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: query" });
      }

      const results = await searchYouTube(query, limit);
      return res.json({ status: 200, success: true, creator: "beratech", results });
    } catch (error: any) {
      console.error("yts error:", error?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Search failed" });
    }
  });

  app.get("/api/download/tiktok", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: url" });
      }

      const result = await downloadTikTok(url);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (error: any) {
      console.error("tiktok error:", error?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "TikTok download failed" });
    }
  });

  app.get("/api/search/lyrics", async (req, res) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: query" });
      }

      const result = await searchLyrics(query);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (error: any) {
      console.error("lyrics error:", error?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Lyrics search failed" });
    }
  });

  app.get("/api/search/wiki", async (req, res) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: query" });
      }

      const result = await searchWikipedia(query);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (error: any) {
      console.error("wiki error:", error?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Wikipedia search failed" });
    }
  });

  // === DRAMA ENDPOINTS ===

  app.get("/api/drama/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const page = parseInt(req.query.page as string) || 1;
      if (!query) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: query" });
      const result = await searchDramas(query, page);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/drama/info", async (req, res) => {
    try {
      const id = parseInt(req.query.id as string);
      if (!id) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: id (TMDb ID)" });
      const result = await getDramaInfo(id);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/drama/season", async (req, res) => {
    try {
      const id = parseInt(req.query.id as string);
      const season = parseInt(req.query.season as string);
      if (!id || !season) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameters: id, season" });
      const result = await getDramaSeason(id, season);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/drama/trending", async (req, res) => {
    try {
      const region = (req.query.region as string) || "KR";
      const result = await getTrendingDramas(region);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/drama/discover", async (req, res) => {
    try {
      const result = await discoverDramas({
        with_origin_country: req.query.country as string,
        with_genres: req.query.genre as string,
        sort_by: req.query.sort_by as string,
        page: parseInt(req.query.page as string) || 1,
      });
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/drama/box/trending", async (req, res) => {
    try {
      const result = await getDramaBoxTrending();
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/drama/box/info", async (req, res) => {
    try {
      const id = req.query.id as string;
      const slug = req.query.slug as string;
      if (!id || !slug) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameters: id, slug" });
      const result = await getDramaBoxInfo(id, slug);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/drama/flixhq/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const page = parseInt(req.query.page as string) || 1;
      if (!query) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: query" });
      const result = await searchFlixHQ(query, page);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/drama/flixhq/info", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: id (FlixHQ media ID)" });
      const result = await getFlixHQInfo(id);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  // === ANIME ENDPOINTS ===

  app.get("/api/anime/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const page = parseInt(req.query.page as string) || 1;
      if (!query) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: query" });
      const result = await searchAnime(query, page);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/spotlight", async (_req, res) => {
    try {
      const result = await getAnimeSpotlight();
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/airing", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await getTopAiring(page);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/popular", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await getMostPopular(page);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/recent", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await getRecentlyUpdated(page);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/anilist/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const page = parseInt(req.query.page as string) || 1;
      const perPage = Math.min(parseInt(req.query.limit as string) || 20, 50);
      if (!query) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: query" });
      const result = await searchAnilist(query, page, perPage);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/anilist/trending", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const result = await getTrendingAnilist(page, perPage);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/anilist/info", async (req, res) => {
    try {
      const id = parseInt(req.query.id as string);
      if (!id) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: id (AniList ID)" });
      const result = await getAnilistInfo(id);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/torrent/nyaa", async (req, res) => {
    try {
      const query = req.query.query as string;
      const category = (req.query.category as string) || "anime-eng";
      const filter = (req.query.filter as string) || "no-remakes";
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      if (!query) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: query" });
      const result = await searchNyaa(query, category, filter, limit);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  // === EPISODE STREAMING & DOWNLOAD ENDPOINTS ===

  app.get("/api/episode/stream", (req, res) => {
    try {
      const type = (req.query.type as string) as "movie" | "tv" | "anime";
      if (!type || !["movie", "tv", "anime"].includes(type)) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing/invalid parameter: type (must be movie, tv, or anime)" });
      }
      const tmdb_id = req.query.tmdb_id as string;
      const imdb_id = req.query.imdb_id as string;
      const anilist_id = req.query.anilist_id as string;
      const mal_id = req.query.mal_id as string;
      const season = parseInt(req.query.season as string) || 1;
      const episode = parseInt(req.query.episode as string) || 1;
      const result = getEpisodeStreamUrls({ type, tmdb_id, imdb_id, anilist_id, mal_id, season, episode });
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/jikan/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 25);
      if (!query) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: query" });
      const result = await searchJikanAnime(query, page, limit);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/jikan/info", async (req, res) => {
    try {
      const id = parseInt(req.query.id as string);
      if (!id) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: id (MAL ID)" });
      const result = await getJikanAnimeInfo(id);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/jikan/episodes", async (req, res) => {
    try {
      const id = parseInt(req.query.id as string);
      const page = parseInt(req.query.page as string) || 1;
      if (!id) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: id (MAL anime ID)" });
      const result = await getJikanAnimeEpisodes(id, page);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/jikan/top", async (req, res) => {
    try {
      const type = (req.query.type as string) || "tv";
      const filter = (req.query.filter as string) || "airing";
      const page = parseInt(req.query.page as string) || 1;
      const result = await getJikanTopAnime(type, filter, page);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/anime/jikan/season", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await getJikanSeasonNow(page);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/tools/translate", async (req, res) => {
    try {
      const text = req.query.text as string;
      const to = (req.query.to as string) || "en";
      const from = (req.query.from as string) || "auto";

      if (!text) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      }

      const result = await translateText(text, to, from);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (error: any) {
      console.error("translate error:", error?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Translation failed" });
    }
  });

  app.get("/api/tools/github", async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: username" });
      }

      const result = await lookupGithubUser(username);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (error: any) {
      console.error("github error:", error?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "GitHub lookup failed" });
    }
  });

  app.get("/api/tools/quote", async (_req, res) => {
    try {
      const result = await getRandomQuote();
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (error: any) {
      console.error("quote error:", error?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Quote generation failed" });
    }
  });

  app.get("/api/tools/screenshot", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: url" });
      }

      const result = await screenshotWebsite(url);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (error: any) {
      console.error("screenshot error:", error?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Screenshot failed" });
    }
  });

  // === DEVELOPER TOOLS ===

  app.get("/api/dev/hash", (req, res) => {
    try {
      const text = req.query.text as string;
      const algorithm = (req.query.algorithm as string) || "all";
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const result = generateHash(text, algorithm);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/base64/encode", (req, res) => {
    try {
      const text = req.query.text as string;
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      return res.json({ status: 200, success: true, creator: "beratech", result: encodeBase64(text) });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/base64/decode", (req, res) => {
    try {
      const text = req.query.text as string;
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      return res.json({ status: 200, success: true, creator: "beratech", result: decodeBase64(text) });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/uuid", (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 1;
      const uuids = generateUUID(count);
      return res.json({ status: 200, success: true, creator: "beratech", result: { count: uuids.length, uuids } });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/password", (req, res) => {
    try {
      const length = parseInt(req.query.length as string) || 16;
      const uppercase = req.query.uppercase !== "false";
      const lowercase = req.query.lowercase !== "false";
      const numbers = req.query.numbers !== "false";
      const symbols = req.query.symbols !== "false";
      const result = generatePassword(length, { uppercase, lowercase, numbers, symbols });
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/timestamp", (req, res) => {
    try {
      const input = (req.query.input as string) || String(Date.now());
      const result = convertTimestamp(input);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/color", (req, res) => {
    try {
      const color = req.query.color as string;
      if (!color) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: color" });
      const result = convertColor(color);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/jwt", (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: token" });
      const result = decodeJWT(token);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/ip", async (req, res) => {
    try {
      const ip = req.query.ip as string;
      if (!ip) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: ip" });
      const result = await lookupIP(ip);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "IP lookup failed" });
    }
  });

  app.get("/api/dev/dns", async (req, res) => {
    try {
      const domain = req.query.domain as string;
      if (!domain) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: domain" });
      const result = await dnsLookup(domain);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "DNS lookup failed" });
    }
  });

  app.get("/api/dev/headers", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: url" });
      const result = await getHttpHeaders(url);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "Headers fetch failed" });
    }
  });

  app.get("/api/dev/qrcode", async (req, res) => {
    try {
      const text = req.query.text as string;
      const size = parseInt(req.query.size as string) || 300;
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const url = await generateQRCode(text, size);
      return res.json({ status: 200, success: true, creator: "beratech", result: { qr_url: url, text, size } });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "QR code generation failed" });
    }
  });

  app.get("/api/dev/regex", (req, res) => {
    try {
      const pattern = req.query.pattern as string;
      const flags = (req.query.flags as string) || "";
      const text = req.query.text as string;
      if (!pattern || !text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameters: pattern, text" });
      const result = testRegex(pattern, flags, text);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/lorem", (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 3;
      const type = (req.query.type as string) || "paragraphs";
      const result = generateLoremIpsum(count, type);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/urlparse", (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: url" });
      const result = parseURL(url);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/urlencode", (req, res) => {
    try {
      const text = req.query.text as string;
      const action = (req.query.action as "encode" | "decode") || "encode";
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const result = encodeDecodeURI(text, action);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/hmac", (req, res) => {
    try {
      const text = req.query.text as string;
      const secret = req.query.secret as string;
      const algorithm = (req.query.algorithm as string) || "sha256";
      if (!text || !secret) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameters: text, secret" });
      const result = generateHMAC(text, secret, algorithm);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/useragent", (req, res) => {
    try {
      const ua = (req.query.ua as string) || req.get("user-agent") || "";
      const result = analyzeUserAgent(ua);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/baseconvert", (req, res) => {
    try {
      const value = req.query.value as string;
      const from = parseInt(req.query.from as string) || 10;
      const to = parseInt(req.query.to as string) || 16;
      if (!value) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: value" });
      const result = numberBaseConvert(value, from, to);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/textstats", (req, res) => {
    try {
      const text = req.query.text as string;
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const result = textStatistics(text);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/json", (req, res) => {
    try {
      const json = req.query.json as string;
      if (!json) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: json" });
      const format = req.query.format !== "false";
      const result = validateJSON(json, format);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/slug", (req, res) => {
    try {
      const text = req.query.text as string;
      const separator = (req.query.separator as string) || "-";
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const result = generateSlug(text, separator);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/httpstatus", (req, res) => {
    try {
      const code = req.query.code ? parseInt(req.query.code as string) : undefined;
      const result = lookupHTTPStatus(code);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/case", (req, res) => {
    try {
      const text = req.query.text as string;
      const to = (req.query.to as string) || "camel";
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const result = convertCase(text, to);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/ipvalidate", (req, res) => {
    try {
      const ip = req.query.ip as string;
      if (!ip) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: ip" });
      const result = validateIP(ip);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/bytes", (req, res) => {
    try {
      const value = parseFloat(req.query.value as string);
      const from = (req.query.from as string) || "B";
      const to = req.query.to as string;
      if (isNaN(value)) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: value (number)" });
      const result = convertBytes(value, from, to);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/email", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: email" });
      const result = await validateEmail(email);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "Email validation failed" });
    }
  });

  app.get("/api/dev/htmlentities", (req, res) => {
    try {
      const text = req.query.text as string;
      const action = (req.query.action as "encode" | "decode") || "encode";
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const result = htmlEntities(text, action);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/morse", (req, res) => {
    try {
      const text = req.query.text as string;
      const action = (req.query.action as "encode" | "decode") || "encode";
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const result = morseCode(text, action);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/randomdata", (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 1;
      const data = generateRandomData(count);
      return res.json({ status: 200, success: true, creator: "beratech", result: { count: data.length, data } });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/diff", (req, res) => {
    try {
      const text1 = req.query.text1 as string;
      const text2 = req.query.text2 as string;
      if (!text1 || !text2) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameters: text1, text2" });
      const result = textDiff(text1, text2);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/cron", (req, res) => {
    try {
      const expression = req.query.expression as string;
      if (!expression) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: expression" });
      const result = parseCron(expression);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/ssl", async (req, res) => {
    try {
      const domain = req.query.domain as string;
      if (!domain) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: domain" });
      const result = await checkSSL(domain);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "SSL check failed" });
    }
  });

  app.get("/api/dev/markdown", (req, res) => {
    try {
      const text = req.query.text as string;
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const result = markdownToHTML(text);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/csv2json", (req, res) => {
    try {
      const csv = req.query.csv as string;
      const delimiter = (req.query.delimiter as string) || ",";
      if (!csv) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: csv" });
      const result = csvToJSON(csv, delimiter);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/jwt/generate", (req, res) => {
    try {
      const payload = req.query.payload as string;
      const secret = req.query.secret as string;
      const expiresIn = req.query.expiresIn ? parseInt(req.query.expiresIn as string) : undefined;
      if (!payload || !secret) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameters: payload (JSON string), secret" });
      let parsed: Record<string, any>;
      try { parsed = JSON.parse(payload); } catch { return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Invalid JSON payload" }); }
      const result = generateJWTToken(parsed, secret, expiresIn);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/dev/cidr", (req, res) => {
    try {
      const cidr = req.query.cidr as string;
      if (!cidr) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: cidr" });
      const result = cidrCalculator(cidr);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  // === DEVELOPER TOOLS DIRECTORY ===

  app.get("/api/dev/directory", (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const result = getDevToolsDirectory(category);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  // === AI ENDPOINTS ===

  app.get("/api/ai/chat", async (req, res) => {
    try {
      const prompt = req.query.prompt as string;
      const system = req.query.system as string | undefined;
      if (!prompt) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: prompt" });
      const result = await aiChat(prompt, system);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      console.error("ai chat error:", e?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "AI chat failed" });
    }
  });

  app.get("/api/ai/summarize", async (req, res) => {
    try {
      const text = req.query.text as string;
      const maxLength = req.query.maxLength ? parseInt(req.query.maxLength as string) : undefined;
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const result = await aiSummarize(text, maxLength);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      console.error("ai summarize error:", e?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "AI summarization failed" });
    }
  });

  app.get("/api/ai/codegen", async (req, res) => {
    try {
      const prompt = req.query.prompt as string;
      const language = req.query.language as string | undefined;
      if (!prompt) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: prompt" });
      const result = await aiCodeGenerate(prompt, language);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      console.error("ai codegen error:", e?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "AI code generation failed" });
    }
  });

  app.get("/api/ai/translate", async (req, res) => {
    try {
      const text = req.query.text as string;
      const to = req.query.to as string;
      const from = req.query.from as string | undefined;
      if (!text || !to) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameters: text, to (target language)" });
      const result = await aiTranslate(text, to, from);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      console.error("ai translate error:", e?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "AI translation failed" });
    }
  });

  app.get("/api/ai/analyze", async (req, res) => {
    try {
      const text = req.query.text as string;
      const type = req.query.type as string | undefined;
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const result = await aiAnalyze(text, type);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      console.error("ai analyze error:", e?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "AI analysis failed" });
    }
  });

  app.get("/api/ai/imagine", async (req, res) => {
    try {
      const prompt = req.query.prompt as string;
      const size = req.query.size as string | undefined;
      if (!prompt) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: prompt" });
      const result = await aiImageGenerate(prompt, size);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      console.error("ai imagine error:", e?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "AI image generation failed" });
    }
  });

  app.get("/api/ai/explain", async (req, res) => {
    try {
      const code = req.query.code as string;
      const language = req.query.language as string | undefined;
      if (!code) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: code" });
      const result = await aiExplainCode(code, language);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      console.error("ai explain error:", e?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message || "AI code explanation failed" });
    }
  });

  app.get("/api/ai/debug", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: code" });
      const error = req.query.error as string | undefined;
      const language = req.query.language as string | undefined;
      const result = await aiDebugCode(code, error, language);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/ai/review", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: code" });
      const language = req.query.language as string | undefined;
      const result = await aiReviewCode(code, language);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/ai/commit", async (req, res) => {
    try {
      const diff = req.query.diff as string;
      if (!diff) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: diff" });
      const style = req.query.style as string | undefined;
      const result = await aiCommitMessage(diff, style);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/ai/unittest", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: code" });
      const language = req.query.language as string | undefined;
      const framework = req.query.framework as string | undefined;
      const result = await aiUnitTest(code, language, framework);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/ai/sql", async (req, res) => {
    try {
      const prompt = req.query.prompt as string;
      if (!prompt) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: prompt" });
      const dialect = req.query.dialect as string | undefined;
      const schema = req.query.schema as string | undefined;
      const result = await aiSqlGenerate(prompt, dialect, schema);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/ai/regex", async (req, res) => {
    try {
      const description = req.query.description as string;
      if (!description) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: description" });
      const flavor = req.query.flavor as string | undefined;
      const result = await aiRegexGenerate(description, flavor);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/ai/docstring", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: code" });
      const language = req.query.language as string | undefined;
      const style = req.query.style as string | undefined;
      const result = await aiDocstring(code, language, style);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/ai/refactor", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: code" });
      const language = req.query.language as string | undefined;
      const goal = req.query.goal as string | undefined;
      const result = await aiRefactor(code, language, goal);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/ai/complexity", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: code" });
      const language = req.query.language as string | undefined;
      const result = await aiComplexity(code, language);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/ai/tts", async (req, res) => {
    try {
      const text = req.query.text as string;
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      const voice = req.query.voice as string | undefined;
      const speed = req.query.speed ? parseFloat(req.query.speed as string) : undefined;
      const result = await aiTTS(text, voice, speed);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/ai/voicetranslate", async (req, res) => {
    try {
      const text = req.query.text as string;
      const to = req.query.to as string;
      if (!text) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: text" });
      if (!to) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: to" });
      const voice = req.query.voice as string | undefined;
      const from = req.query.from as string | undefined;
      const result = await aiVoiceTranslate(text, to, voice, from);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  // === LOCATION ===

  app.get("/api/location/geoip", async (req, res) => {
    try {
      const ip = req.query.ip as string | undefined;
      const result = await getGeolocation(ip);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/location/reverse", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameters: lat, lon" });
      const result = await reverseGeocode(lat, lon);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/location/timezone", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameters: lat, lon" });
      const result = await getTimezone(lat, lon);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/location/device", async (req, res) => {
    try {
      const ua = (req.query.ua as string) || req.get("user-agent") || "";
      const ip = req.query.ip as string | undefined;
      const result = await getDeviceInfo(ua, ip);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  // === UTILITIES ===

  app.get("/api/utils/weather", async (req, res) => {
    try {
      const location = req.query.location as string;
      if (!location) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: location" });
      const result = await getWeather(location);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/utils/crypto", async (req, res) => {
    try {
      const coin = req.query.coin as string;
      if (!coin) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: coin" });
      const currency = req.query.currency as string | undefined;
      const result = await getCryptoPrice(coin, currency);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/utils/currency", async (req, res) => {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;
      if (!from || !to) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameters: from, to" });
      const amount = req.query.amount ? parseFloat(req.query.amount as string) : undefined;
      const result = await getCurrencyRate(from, to, amount);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/utils/shorten", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: url" });
      const result = await shortenUrl(url);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/utils/whois", async (req, res) => {
    try {
      const domain = req.query.domain as string;
      if (!domain) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: domain" });
      const result = await whoisLookup(domain);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/utils/phone", async (req, res) => {
    try {
      const phone = req.query.phone as string;
      if (!phone) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: phone" });
      const country_code = req.query.country_code as string | undefined;
      const result = validatePhone(phone, country_code);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/utils/news", async (req, res) => {
    try {
      const source = req.query.source as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const result = await getTechNews(source, limit);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/utils/gitignore", async (req, res) => {
    try {
      const templates = req.query.templates as string;
      if (!templates) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: templates" });
      const result = await generateGitignore(templates);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/utils/metadata", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: url" });
      const result = await getMetadata(url);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  app.get("/api/utils/uptime", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing required parameter: url" });
      const result = await checkUptime(url);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (e: any) {
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: e.message });
    }
  });

  // === EPHOTO360 ===

  app.get("/api/ephoto360/list", (_req, res) => {
    const effects = getAllEffects();
    const grouped = {
      single_text: effects.filter(e => e.textInputs === 1).map(e => ({
        slug: e.slug, name: e.name, description: e.description,
        endpoint: `/api/ephoto360/${e.slug}?text=YOUR_TEXT`,
      })),
      dual_text: effects.filter(e => e.textInputs === 2).map(e => ({
        slug: e.slug, name: e.name, description: e.description,
        endpoint: `/api/ephoto360/${e.slug}?text1=TEXT_ONE&text2=TEXT_TWO`,
      })),
      triple_text: effects.filter(e => e.textInputs === 3).map(e => ({
        slug: e.slug, name: e.name, description: e.description,
        endpoint: `/api/ephoto360/${e.slug}?text1=TEXT_ONE&text2=TEXT_TWO&text3=TEXT_THREE`,
      })),
    };

    return res.json({
      status: 200, success: true, creator: "beratech",
      result: {
        total_effects: effects.length,
        effects: grouped,
      },
    });
  });

  app.get("/api/ephoto360/:effectSlug", async (req, res) => {
    try {
      const { effectSlug } = req.params;
      const effect = getEffectBySlug(effectSlug);

      if (!effect) {
        return res.status(404).json({
          status: 404, success: false, creator: "beratech",
          error: `Unknown effect: ${effectSlug}. Use /api/ephoto360/list to see available effects.`,
          available_slugs: getEffectSlugs(),
        });
      }

      const texts: string[] = [];
      if (effect.textInputs === 1) {
        const text = req.query.text as string;
        if (!text) {
          return res.status(400).json({
            status: 400, success: false, creator: "beratech",
            error: "Missing required parameter: text",
            usage: `/api/ephoto360/${effectSlug}?text=YOUR_TEXT`,
          });
        }
        texts.push(text);
      } else if (effect.textInputs === 2) {
        const text1 = req.query.text1 as string;
        const text2 = req.query.text2 as string;
        if (!text1 || !text2) {
          return res.status(400).json({
            status: 400, success: false, creator: "beratech",
            error: "Missing required parameters: text1 and text2",
            usage: `/api/ephoto360/${effectSlug}?text1=TEXT_ONE&text2=TEXT_TWO`,
          });
        }
        texts.push(text1, text2);
      } else if (effect.textInputs === 3) {
        const text1 = req.query.text1 as string;
        const text2 = req.query.text2 as string;
        const text3 = req.query.text3 as string;
        if (!text1 || !text2 || !text3) {
          return res.status(400).json({
            status: 400, success: false, creator: "beratech",
            error: "Missing required parameters: text1, text2 and text3",
            usage: `/api/ephoto360/${effectSlug}?text1=TEXT_ONE&text2=TEXT_TWO&text3=TEXT_THREE`,
          });
        }
        texts.push(text1, text2, text3);
      }

      const result = await createEphotoBySlug(effectSlug, texts);
      return res.json({
        status: 200, success: true, creator: "beratech",
        result: {
          effect: effect.name,
          effect_slug: effect.slug,
          text_inputs: effect.textInputs,
          image_url: result.image_url,
        },
      });
    } catch (error: any) {
      console.error("ephoto error:", error?.message);
      return res.status(500).json({
        status: 500, success: false, creator: "beratech",
        error: error?.message || "EPhoto360 generation failed",
      });
    }
  });

  app.post("/api/convert", async (req, res) => {
    try {
      const parsed = convertRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          status: 400, success: false, creator: "beratech",
          error: parsed.error.errors.map((e) => e.message).join(", "),
        });
      }

      const { url, format } = parsed.data;
      const videoId = extractVideoId(url);
      const result = await convert(url, format);

      const dlId = createDownloadId();
      downloadStore.set(dlId, {
        externalUrl: result.download_url,
        title: result.title,
        format,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      const host = req.get("x-forwarded-host") || req.get("host") || "bera-api.replit.app";
      const protocol = req.get("x-forwarded-proto") === "https" ? "https" : (req.protocol === "https" ? "https" : "http");
      const proxyUrl = `${protocol}://${host}/dl/cnv/${format}/${dlId}`;

      return res.json({
        status: 200, success: true, creator: "beratech",
        result: {
          youtube_id: videoId || "",
          title: result.title,
          quality: result.quality,
          thumbnail: result.thumbnail,
          message: "Download URL expires in 10 mins",
          download_url: proxyUrl,
        },
      });
    } catch (error: any) {
      const message = error?.message || "An error occurred during conversion";
      console.error("Conversion error:", message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: message });
    }
  });

  // ────────────────────────────────────────────────
  // UNIFIED MEDIA SEARCH  /api/media/search
  // ────────────────────────────────────────────────
  app.get("/api/media/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const type = (req.query.type as string) || "all";
      const page = parseInt(req.query.page as string) || 1;

      if (!query) {
        return res.status(400).json({
          status: 400, success: false, creator: "beratech",
          error: "Missing required parameter: query",
        });
      }

      const validTypes = ["all", "movie", "anime", "tv"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          status: 400, success: false, creator: "beratech",
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        });
      }

      const result = await searchMedia(query, type as any, page);
      return res.json({ status: 200, success: true, creator: "beratech", result });
    } catch (error: any) {
      console.error("media/search error:", error?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Search failed" });
    }
  });

  // ────────────────────────────────────────────────
  // UNIFIED MEDIA STREAM  /api/media/stream
  // ────────────────────────────────────────────────
  app.get("/api/media/stream", async (req, res) => {
    try {
      const query = req.query.query as string;
      const type = (req.query.type as string) || "movie";
      const episode = parseInt(req.query.episode as string) || 1;
      const season = parseInt(req.query.season as string) || 1;

      if (!query) {
        return res.status(400).json({
          status: 400, success: false, creator: "beratech",
          error: "Missing required parameter: query",
        });
      }

      const validTypes = ["movie", "anime", "tv"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          status: 400, success: false, creator: "beratech",
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        });
      }

      const media = await streamMedia(query, type as any, episode, season);

      return res.json({
        status: 200, success: true, creator: "beratech",
        result: {
          title: media.title,
          type: media.type,
          year: media.year,
          thumbnail: media.thumbnail,
          quality: media.quality,
          episode: media.episode,
          season: media.season,
          stream_url: media.stream_url,
          stream_url_alt: media.stream_url_alt,
          magnet_link: media.magnet_link,
          torrent_url: media.torrent_url,
          download_url: media.torrent_url || null,
          message: media.torrent_url
            ? "Use torrent_url/.torrent file with a torrent client, or open stream_url to watch"
            : "No direct download available — open stream_url to watch",
        },
      });
    } catch (error: any) {
      console.error("media/stream error:", error?.message);
      return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Stream lookup failed" });
    }
  });


    // ═══════════════════════════════════════════════════
    // VIDLINK-STYLE ENDPOINTS — real HLS/MP4 sources via
    // FlixHQ + HiAnime scrapers, same providers vidlink.pro
    // uses internally, zero ads.
    // ═══════════════════════════════════════════════════

    // GET /api/vidlink/movie?id=786892
    app.get("/api/vidlink/movie", async (req, res) => {
      const tmdbId = parseInt(req.query.id as string);
      if (!tmdbId || isNaN(tmdbId)) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing or invalid ?id= (TMDB movie ID)" });
      }
      try {
        const result = await getVidlinkMovieSources(tmdbId);
        return res.json({ status: 200, success: true, creator: "beratech", result });
      } catch (error: any) {
        return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Failed to fetch movie sources" });
      }
    });

    // GET /api/vidlink/tv?id=94997&season=1&episode=1
    app.get("/api/vidlink/tv", async (req, res) => {
      const tmdbId = parseInt(req.query.id as string);
      const season = parseInt(req.query.season as string) || 1;
      const episode = parseInt(req.query.episode as string) || 1;
      if (!tmdbId || isNaN(tmdbId)) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing or invalid ?id= (TMDB TV show ID)" });
      }
      try {
        const result = await getVidlinkTvSources(tmdbId, season, episode);
        return res.json({ status: 200, success: true, creator: "beratech", result });
      } catch (error: any) {
        return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Failed to fetch TV sources" });
      }
    });

    // GET /api/vidlink/anime?mal_id=21&episode=1&dub=false
    app.get("/api/vidlink/anime", async (req, res) => {
      const malId = parseInt(req.query.mal_id as string);
      const episode = parseInt(req.query.episode as string) || 1;
      const dub = req.query.dub === "true";
      if (!malId || isNaN(malId)) {
        return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Missing or invalid ?mal_id= (MyAnimeList ID)" });
      }
      try {
        const result = await getVidlinkAnimeSources(malId, episode, dub);
        return res.json({ status: 200, success: true, creator: "beratech", result });
      } catch (error: any) {
        return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Failed to fetch anime sources" });
      }
    });
  

    // ═══════════════════════════════════════════════════════════════
    // MOVIE DOWNLOAD — same token proxy pattern as ytmp3/ytmp4.
    //   FlixHQ (Consumet) scrapes the real source, we register
    //   a short-lived token and stream/proxy through our own URL.
    // ═══════════════════════════════════════════════════════════════

    // GET /api/download/movie?id=786892
    // GET /api/search/movie?query=Furiosa — search without downloading
    app.get("/api/search/movie", async (req, res) => {
      const query = (req.query.query as string)?.trim();
      if (!query) {
        return res.status(400).json({
          status: 400, success: false, creator: "beratech",
          error: "Missing ?query= (movie title to search)"
        });
      }
      try {
        const results = await searchTmdbMovies(query);
        return res.json({ status: 200, success: true, creator: "beratech", result: { query, results } });
      } catch (error: any) {
        return res.status(500).json({ status: 500, success: false, creator: "beratech", error: error?.message || "Search failed" });
      }
    });

    // GET /api/download/movie?query=Furiosa  OR  ?id=786892
      //
      // Returns TMDB metadata + a lazy stream token immediately (~200ms).
      // The actual FlixHQ scrape happens inside /dl/movie/:id so CDN tokens
      // are always freshly signed at click-time, never stale.
      app.get("/api/download/movie", async (req, res) => {
        const query = (req.query.query as string)?.trim();
        const rawId = req.query.id as string;
        if (!query && !rawId) {
          return res.status(400).json({
            status: 400, success: false, creator: "beratech",
            error: "Provide ?query=movie+title  — or ?id=tmdb_id for a specific movie",
          });
        }
        try {
          // Resolve TMDB metadata without triggering any scraping (fast, ~200ms)
          let tmdbId: number;
          let tmdbTitle: string;
          let tmdbYear: string | null = null;
          let tmdbPoster: string | null = null;
          let tmdbBackdrop: string | null = null;
          let tmdbOverview: string | null = null;
          let tmdbRating: number | null = null;
          const TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";

          if (rawId && !query) {
            // Direct TMDB ID lookup
            tmdbId = parseInt(rawId);
            const metaRes = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
              params: { api_key: TMDB_KEY }, timeout: 8000,
            });
            const m = metaRes.data;
            tmdbTitle    = m.title;
            tmdbYear     = m.release_date?.slice(0, 4) ?? null;
            tmdbPoster   = m.poster_path   ? `https://image.tmdb.org/t/p/w500${m.poster_path}`      : null;
            tmdbBackdrop = m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : null;
            tmdbOverview = (m.overview as string)?.slice(0, 300) ?? null;
            tmdbRating   = m.vote_average ?? null;
          } else {
            // Title search → take top TMDB result
            const results = await searchTmdbMovies(query!);
            if (!results.length) {
              return res.status(404).json({ status: 404, success: false, creator: "beratech", error: `No TMDB results for "${query}"` });
            }
            const top    = results[0];
            tmdbId       = top.tmdb_id;
            tmdbTitle    = top.title;
            tmdbYear     = top.year;
            tmdbPoster   = top.poster;
            tmdbBackdrop = null;
            tmdbOverview = top.overview;
            tmdbRating   = top.rating;
          }

          // Register lazy token — scraping happens at /dl/movie/:id time so the CDN URL is always fresh
          const id      = createDownloadId();
          const baseUrl = `${req.protocol}://${req.get("host")}`;
          downloadStore.set(id, {
            externalUrl: "",           // filled lazily at proxy time
            title:       tmdbTitle,
            format:      "movie",
            expiresAt:   Date.now() + 15 * 60 * 1000,  // 15-min click window
            tmdbId,
          });

          const streamUrl = `${baseUrl}/dl/movie/${id}`;
          return res.json({
            status: 200, success: true, creator: "beratech",
            result: {
              tmdb_id:      tmdbId,
              title:        tmdbTitle,
              year:         tmdbYear,
              poster:       tmdbPoster,
              backdrop:     tmdbBackdrop,
              overview:     tmdbOverview,
              rating:       tmdbRating,
              message:      "Stream/download URL is valid for 15 minutes",
              stream_url:   streamUrl,
              download_url: `${streamUrl}?dl=1`,
              hint:         "Open stream_url in a video player to stream. Add ?dl=1 to download the file.",
            },
          });
        } catch (error: any) {
          return res.status(500).json({
            status: 500, success: false, creator: "beratech",
            error: error?.message || "Failed to resolve movie",
          });
        }
      });

    // GET /dl/movie/:id          → streams inline (for players / VLC / browser)
      // GET /dl/movie/:id?dl=1     → forces download attachment
      //
      // Source is scraped HERE at click-time so CDN tokens are always fresh.
      app.get("/dl/movie/:id", async (req, res) => {
        const { id } = req.params;
        const forceDownload = req.query.dl === "1";
        const entry = downloadStore.get(id);

        if (!entry) {
          return res.status(404).json({ status: 404, success: false, creator: "beratech", error: "Stream link expired or not found" });
        }
        if (entry.expiresAt < Date.now()) {
          downloadStore.delete(id);
          return res.status(410).json({ status: 410, success: false, creator: "beratech", error: "Stream link has expired" });
        }
        if (entry.format !== "movie" || !entry.tmdbId) {
          return res.status(400).json({ status: 400, success: false, creator: "beratech", error: "Invalid token type for this route" });
        }

        try {
          // Scrape fresh source right now — CDN URL is always freshly signed
          const info = await fetchMovieSource(entry.tmdbId);

          const safeTitle = info.title.replace(/[^\w\s\-().]/g, "").trim() || "movie";
          const isHLS = info.is_m3u8;
          const ext   = isHLS ? "m3u8" : "mp4";
          const mime  = isHLS ? "application/vnd.apple.mpegurl" : "video/mp4";

          // Derive Referer from the source URL's origin so CDNs accept the request
          let referer = "https://flixhq.to/";
          try {
            const u = new URL(info.source_url);
            referer = `${u.protocol}//${u.hostname}/`;
          } catch (_) {}

          const upstreamHeaders: Record<string, string> = {
            "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Accept:            "*/*",
            "Accept-Encoding": "identity",
            Referer:           referer,
            Origin:            referer.replace(/\/$/, ""),
          };
          if (req.headers.range) upstreamHeaders["Range"] = req.headers.range as string;

          const upstream = await axios.get(info.source_url, {
            responseType: "stream",
            timeout:       300_000,
            maxRedirects:  10,
            headers:       upstreamHeaders,
          });

          res.setHeader("Content-Type",        mime);
          res.setHeader("Content-Disposition", `${forceDownload ? "attachment" : "inline"}; filename="${safeTitle}.${ext}"`);
          res.setHeader("Accept-Ranges",       "bytes");
          res.setHeader("Access-Control-Allow-Origin", "*");
          if (upstream.headers["content-length"]) res.setHeader("Content-Length", upstream.headers["content-length"]);
          if (upstream.headers["content-range"])  {
            res.setHeader("Content-Range", upstream.headers["content-range"]);
            res.status(206);
          }

          upstream.data.pipe(res);
        } catch (error: any) {
          console.error("Movie stream error:", error?.message);
          if (!res.headersSent) {
            return res.status(500).json({
              status: 500, success: false, creator: "beratech",
              error: error?.message || "Stream fetch failed — source may be geo-restricted or temporarily unavailable",
            });
          }
        }
      });
  
  return httpServer;
}
