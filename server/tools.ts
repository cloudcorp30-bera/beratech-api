import axios from "axios";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface TranslateResult {
  original: string;
  translated: string;
  from: string;
  to: string;
}

export interface GithubUserResult {
  login: string;
  id: number;
  avatar: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  profile_url: string;
}

export interface WikiResult {
  title: string;
  extract: string;
  thumbnail: string;
  url: string;
}

export interface QuoteResult {
  quote: string;
  author: string;
  category: string;
}

export interface ScreenshotResult {
  screenshot_url: string;
  target_url: string;
}

const GITHUB_API = Buffer.from("aHR0cHM6Ly9hcGkuZ2l0aHViLmNvbQ==", "base64").toString();
const WIKI_BASE = Buffer.from("aHR0cHM6Ly9lbi53aWtpcGVkaWEub3Jn", "base64").toString();
const TRANSLATE_API = Buffer.from("aHR0cHM6Ly9hcGkubXltZW1vcnkudHJhbnNsYXRlZC5uZXQvZ2V0", "base64").toString();
const QUOTE_API = Buffer.from("aHR0cHM6Ly9hcGkuYXBpLW5pbmphcy5jb20vdjEvcXVvdGVz", "base64").toString();

export async function translateText(text: string, to: string, from: string = "auto"): Promise<TranslateResult> {
  const langPair = from === "auto" ? `en|${to}` : `${from}|${to}`;
  const res = await axios.get(TRANSLATE_API, {
    params: { q: text, langpair: langPair },
    headers: { "User-Agent": USER_AGENT },
    timeout: 10000,
  });

  const data = res.data;
  if (!data?.responseData?.translatedText) {
    throw new Error("Translation failed");
  }

  return {
    original: text,
    translated: data.responseData.translatedText,
    from: data.responseData.detectedLanguage || from,
    to,
  };
}

export async function lookupGithubUser(username: string): Promise<GithubUserResult> {
  const res = await axios.get(`${GITHUB_API}/users/${encodeURIComponent(username)}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/vnd.github.v3+json",
    },
    timeout: 10000,
  });

  const u = res.data;
  return {
    login: u.login,
    id: u.id,
    avatar: u.avatar_url,
    name: u.name,
    bio: u.bio,
    company: u.company,
    location: u.location,
    blog: u.blog || "",
    public_repos: u.public_repos,
    followers: u.followers,
    following: u.following,
    created_at: u.created_at,
    profile_url: u.html_url,
  };
}

export async function searchWikipedia(query: string): Promise<WikiResult> {
  const summaryRes = await axios.get(`${WIKI_BASE}/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 10000,
  });

  if (summaryRes.data?.type === "disambiguation" || !summaryRes.data?.extract) {
    const searchRes = await axios.get(`${WIKI_BASE}/w/api.php`, {
      params: { action: "query", list: "search", srsearch: query, srlimit: 1, format: "json" },
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    });

    const results = searchRes.data?.query?.search;
    if (!results || results.length === 0) {
      throw new Error("No Wikipedia article found for: " + query);
    }

    const title = results[0].title;
    const retryRes = await axios.get(`${WIKI_BASE}/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    });

    const s = retryRes.data;
    return {
      title: s.title || title,
      extract: s.extract || "",
      thumbnail: s.thumbnail?.source || s.originalimage?.source || "",
      url: s.content_urls?.desktop?.page || "",
    };
  }

  const s = summaryRes.data;
  return {
    title: s.title || query,
    extract: s.extract || "",
    thumbnail: s.thumbnail?.source || s.originalimage?.source || "",
    url: s.content_urls?.desktop?.page || "",
  };
}

export async function getRandomQuote(): Promise<QuoteResult> {
  try {
    const res = await axios.get("https://zenquotes.io/api/random", {
      headers: { "User-Agent": USER_AGENT },
      timeout: 8000,
    });
    const q = res.data[0];
    return {
      quote: q.q,
      author: q.a,
      category: "inspirational",
    };
  } catch {
    return {
      quote: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      category: "inspirational",
    };
  }
}

export async function screenshotWebsite(url: string): Promise<ScreenshotResult> {
  const { takeScreenshot } = await import("./devtools");
  return takeScreenshot(url);
}
