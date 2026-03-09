import axios from "axios";
import * as cheerio from "cheerio";

const BASE = "https://ww1.goojara.to";

function getHeaders(referer?: string) {
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    ...(referer ? { Referer: referer } : {}),
  };
}

// Extract the JS anti-bot cookie value from goojara HTML
function extractCookie(html: string): Record<string, string> {
  const m = html.match(/_3chk\('([^']+)','([^']+)'\)/);
  if (m) return { [m[1]]: m[2] };
  return {};
}

async function fetchPage(url: string): Promise<{ html: string; cookieStr: string }> {
  const res = await axios.get(url, {
    headers: getHeaders(),
    timeout: 12000,
    withCredentials: false,
  });
  const html = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  const serverCookies: Record<string, string> = {};
  const cookieHeader = res.headers["set-cookie"];
  if (cookieHeader) {
    for (const c of Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader]) {
      const [kv] = c.split(";");
      const [k, v] = kv.split("=");
      if (k && v) serverCookies[k.trim()] = v.trim();
    }
  }
  const jsCookies = extractCookie(html);
  const all = { ...serverCookies, ...jsCookies };
  const cookieStr = Object.entries(all).map(([k, v]) => `${k}=${v}`).join("; ");
  return { html, cookieStr };
}

export interface GoojaraMovie {
  id: string;
  title: string;
  year: string | null;
  thumbnail: string | null;
  imdb_id: string | null;
  duration: string | null;
  genres: string[];
  synopsis: string | null;
  director: string | null;
  cast: string | null;
  watch_url: string;
  source: "goojara";
  note: string;
}

export async function getGoojaraInfo(movieCode: string): Promise<GoojaraMovie | null> {
  const url = `${BASE}/${movieCode}`;
  try {
    const { html } = await fetchPage(url);
    const $ = cheerio.load(html);

    const titleRaw = $("title").text().replace(/^Watch\s+/, "").trim();
    const yearMatch = titleRaw.match(/\((\d{4})\)/);
    const title = titleRaw.replace(/\s*\(\d{4}\).*$/, "").trim();
    const year = yearMatch ? yearMatch[1] : null;

    const thumbnail = $("img[alt]").first().attr("src") || null;
    const imdbHref = $("a#imdb").attr("href") || "";
    const imdbMatch = imdbHref.match(/\/title\/(tt\d+)/);
    const imdb_id = imdbMatch ? imdbMatch[1] : null;

    const dateDiv = $(".date").text();
    const durationMatch = dateDiv.match(/^(\d+min)/);
    const duration = durationMatch ? durationMatch[1] : null;

    const genreMatch = dateDiv.match(/\|\s*([^|]+)\s*\|/);
    const genres = genreMatch ? genreMatch[1].split(",").map(g => g.trim()) : [];

    const synopsis = $(".fimm p").first().text().trim() || null;
    let director: string | null = null;
    let cast: string | null = null;
    $(".fimm p").each((_: any, el: any) => {
      const text = $(el).text();
      if (text.includes("Director:")) director = text.replace("Director:", "").trim();
      if (text.includes("Cast:")) cast = text.replace("Cast:", "").trim();
    });

    return {
      id: `goojara:${movieCode}`,
      title,
      year,
      thumbnail,
      imdb_id,
      duration,
      genres,
      synopsis,
      director,
      cast,
      watch_url: url,
      source: "goojara",
      note: "Open watch_url in browser to stream — direct extraction requires browser automation",
    };
  } catch {
    return null;
  }
}

export async function getTrendingGoojara(type: "movies" | "series" = "movies"): Promise<GoojaraMovie[]> {
  const path = type === "series" ? "/watch-series" : "/watch-movies";
  try {
    const { html, cookieStr } = await fetchPage(`${BASE}${path}`);
    const $ = cheerio.load(html);
    const codes: string[] = [];
    $("a[href]").each((_: any, el: any) => {
      const href = $(el).attr("href") || "";
      const m = href.match(/^\/([a-zA-Z0-9]{5,8})$/);
      if (m && !codes.includes(m[1])) codes.push(m[1]);
    });

    // Fetch details for first 8
    const results: GoojaraMovie[] = [];
    for (const code of codes.slice(0, 8)) {
      try {
        const url = `${BASE}/${code}`;
        const pageRes = await axios.get(url, {
          headers: { ...getHeaders(`${BASE}${path}`), Cookie: cookieStr },
          timeout: 8000,
        });
        const pageHtml = typeof pageRes.data === "string" ? pageRes.data : JSON.stringify(pageRes.data);
        const $p = cheerio.load(pageHtml);
        const titleRaw = $p("title").text().replace(/^Watch\s+/, "").trim();
        const yearMatch = titleRaw.match(/\((\d{4})\)/);
        const title = titleRaw.replace(/\s*\(\d{4}\).*$/, "").trim();
        const year = yearMatch ? yearMatch[1] : null;
        const thumbnail = $p("img[alt]").first().attr("src") || null;
        const imdbHref = $p("a#imdb").attr("href") || "";
        const imdbMatch = imdbHref.match(/\/title\/(tt\d+)/);
        results.push({
          id: `goojara:${code}`,
          title,
          year,
          thumbnail,
          imdb_id: imdbMatch ? imdbMatch[1] : null,
          duration: null,
          genres: [],
          synopsis: null,
          director: null,
          cast: null,
          watch_url: url,
          source: "goojara",
          note: "Open watch_url in browser to stream",
        });
      } catch {}
    }
    return results;
  } catch {
    return [];
  }
}
