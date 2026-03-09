import axios from "axios";
import * as cheerio from "cheerio";

const BASE = "https://moviebox.ph";
const IMG_BASE = "https://pbcdnw.aoneroom.com";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// Resolve Nuxt payload: the flat array stores ALL values — numbers in objects are indices
function resolveNuxt(arr: any[], idx: number, seen = new Set<number>()): any {
  if (seen.has(idx) || idx < 0 || idx >= arr.length) return null;
  seen.add(idx);
  const val = arr[idx];
  if (Array.isArray(val)) {
    if (val[0] === "ShallowReactive" || val[0] === "Reactive") return resolveNuxt(arr, val[1], seen);
    if (val[0] === "Set" || val[0] === "Map") return null;
    return val.map((v: any) => (typeof v === "number" ? resolveNuxt(arr, v, new Set(seen)) : v));
  }
  if (typeof val === "object" && val !== null) {
    const obj: any = {};
    for (const [k, v] of Object.entries(val)) {
      obj[k] = typeof v === "number" ? resolveNuxt(arr, v as number, new Set(seen)) : v;
    }
    return obj;
  }
  return val;
}

function extractNuxtData(html: string): any[] | null {
  const m = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// Find items array in the resolved data — look for the search results
function findItems(resolved: any): any[] {
  if (!resolved || typeof resolved !== "object") return [];
  if (Array.isArray(resolved.items)) return resolved.items;
  for (const v of Object.values(resolved)) {
    if (typeof v === "object" && v !== null) {
      const found = findItems(v);
      if (found.length > 0) return found;
    }
  }
  return [];
}

function mapItem(item: any): any {
  if (!item || !item.title) return null;
  return {
    id: `moviebox:${item.subjectId}`,
    moviebox_id: item.subjectId ? String(item.subjectId) : null,
    type: item.subjectType === 2 ? "tv" : "movie",
    title: item.title,
    year: item.releaseDate ? item.releaseDate.slice(0, 4) : null,
    rating: item.imdbRatingValue ? parseFloat(item.imdbRatingValue) : null,
    thumbnail: item.cover?.url || null,
    synopsis: item.description || null,
    genres: item.genre ? item.genre.split(",").map((g: string) => g.trim()) : [],
    detail_url: item.detailPath ? `${BASE}/en/web/movie/${item.detailPath}` : null,
    stream_url: item.detailPath ? `${BASE}/en/web/movie/${item.detailPath}` : null,
    source: "moviebox",
  };
}

export async function searchMovieBox(query: string, page = 1): Promise<any[]> {
  const url = `${BASE}/en/web/searchResult?keyword=${encodeURIComponent(query)}&page=${page}`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 12000 });
  const arr = extractNuxtData(res.data);
  if (!arr) return [];

  // The root resolved object has nested fetch data — we resolve index 2 which is the page data container
  const root = resolveNuxt(arr, 2);
  const items = findItems(root);
  return items.filter(Boolean).map(mapItem).filter(Boolean);
}

export async function getMovieBoxDetail(detailPath: string): Promise<any> {
  const url = `${BASE}/en/web/movie/${detailPath}`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 12000 });
  const arr = extractNuxtData(res.data);
  if (!arr) return null;
  const root = resolveNuxt(arr, 2);
  // Extract the subject detail from the resolved data
  return root;
}
