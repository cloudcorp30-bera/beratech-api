import axios from "axios";
import * as cheerio from "cheerio";
import { MOVIES } from "@consumet/extensions";

const TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_IMG_LG = "https://image.tmdb.org/t/p/original";

const scraperHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function buildStreamUrl(tmdbId: number, season?: number, episode?: number) {
  if (season && episode) {
    return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
  }
  return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}`;
}

function buildVidsrc2Url(tmdbId: number, season?: number, episode?: number) {
  if (season && episode) {
    return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
  }
  return `https://vidsrc.to/embed/tv/${tmdbId}`;
}

// === TMDB Drama Search ===
export async function searchDramas(query: string, page: number = 1) {
  const res = await axios.get(`${TMDB_BASE}/search/tv`, {
    params: { api_key: TMDB_KEY, query, language: "en-US", page },
    timeout: 10000,
  });

  const results = res.data.results.map((s: any) => ({
    id: s.id,
    title: s.name,
    original_title: s.original_name,
    overview: s.overview,
    poster: s.poster_path ? `${TMDB_IMG}${s.poster_path}` : null,
    backdrop: s.backdrop_path ? `${TMDB_IMG_LG}${s.backdrop_path}` : null,
    first_air_date: s.first_air_date,
    rating: s.vote_average,
    vote_count: s.vote_count,
    origin_country: s.origin_country,
    genres: s.genre_ids,
    popularity: s.popularity,
    stream_url: buildStreamUrl(s.id),
    stream_url_ep1: buildStreamUrl(s.id, 1, 1),
  }));

  return {
    page: res.data.page,
    total_pages: res.data.total_pages,
    total_results: res.data.total_results,
    results,
  };
}

// === TMDB TV Show Info ===
export async function getDramaInfo(tmdbId: number) {
  const [detailRes, creditsRes] = await Promise.all([
    axios.get(`${TMDB_BASE}/tv/${tmdbId}`, {
      params: { api_key: TMDB_KEY, language: "en-US", append_to_response: "external_ids" },
      timeout: 10000,
    }),
    axios.get(`${TMDB_BASE}/tv/${tmdbId}/credits`, {
      params: { api_key: TMDB_KEY },
      timeout: 10000,
    }),
  ]);

  const d = detailRes.data;
  const seasons = d.seasons?.map((s: any) => ({
    season_number: s.season_number,
    name: s.name,
    episode_count: s.episode_count,
    air_date: s.air_date,
    poster: s.poster_path ? `${TMDB_IMG}${s.poster_path}` : null,
    stream_url: buildStreamUrl(tmdbId, s.season_number, 1),
  }));

  const cast = creditsRes.data.cast?.slice(0, 15).map((c: any) => ({
    name: c.name,
    character: c.character,
    profile: c.profile_path ? `${TMDB_IMG}${c.profile_path}` : null,
  }));

  return {
    id: d.id,
    title: d.name,
    original_title: d.original_name,
    overview: d.overview,
    status: d.status,
    type: d.type,
    origin_country: d.origin_country,
    original_language: d.original_language,
    first_air_date: d.first_air_date,
    last_air_date: d.last_air_date,
    number_of_seasons: d.number_of_seasons,
    number_of_episodes: d.number_of_episodes,
    episode_runtime: d.episode_run_time,
    genres: d.genres?.map((g: any) => g.name),
    networks: d.networks?.map((n: any) => n.name),
    rating: d.vote_average,
    vote_count: d.vote_count,
    popularity: d.popularity,
    poster: d.poster_path ? `${TMDB_IMG}${d.poster_path}` : null,
    backdrop: d.backdrop_path ? `${TMDB_IMG_LG}${d.backdrop_path}` : null,
    homepage: d.homepage,
    tagline: d.tagline,
    imdb_id: d.external_ids?.imdb_id,
    cast,
    seasons,
    stream_url: buildStreamUrl(tmdbId),
    stream_url_ep1: buildStreamUrl(tmdbId, 1, 1),
    vidsrc_url: buildVidsrc2Url(tmdbId),
  };
}

// === TMDB Season Episodes ===
export async function getDramaSeason(tmdbId: number, seasonNumber: number) {
  const res = await axios.get(`${TMDB_BASE}/tv/${tmdbId}/season/${seasonNumber}`, {
    params: { api_key: TMDB_KEY, language: "en-US" },
    timeout: 10000,
  });

  const episodes = res.data.episodes?.map((ep: any) => ({
    episode_number: ep.episode_number,
    name: ep.name,
    overview: ep.overview,
    air_date: ep.air_date,
    runtime: ep.runtime,
    still: ep.still_path ? `${TMDB_IMG}${ep.still_path}` : null,
    rating: ep.vote_average,
    stream_url: buildStreamUrl(tmdbId, seasonNumber, ep.episode_number),
    vidsrc_url: buildVidsrc2Url(tmdbId, seasonNumber, ep.episode_number),
  }));

  return {
    id: tmdbId,
    season_number: res.data.season_number,
    name: res.data.name,
    overview: res.data.overview,
    air_date: res.data.air_date,
    poster: res.data.poster_path ? `${TMDB_IMG}${res.data.poster_path}` : null,
    episodes,
  };
}

// === TMDB Trending Dramas ===
export async function getTrendingDramas(region: string = "KR") {
  const [trendingRes, topRes] = await Promise.all([
    axios.get(`${TMDB_BASE}/trending/tv/week`, {
      params: { api_key: TMDB_KEY, language: "en-US" },
      timeout: 10000,
    }),
    axios.get(`${TMDB_BASE}/discover/tv`, {
      params: {
        api_key: TMDB_KEY,
        language: "en-US",
        with_origin_country: region,
        sort_by: "popularity.desc",
        "vote_count.gte": 50,
        page: 1,
      },
      timeout: 10000,
    }),
  ]);

  const trending = trendingRes.data.results.slice(0, 20).map((s: any) => ({
    id: s.id,
    title: s.name,
    original_title: s.original_name,
    overview: s.overview?.slice(0, 200),
    poster: s.poster_path ? `${TMDB_IMG}${s.poster_path}` : null,
    backdrop: s.backdrop_path ? `${TMDB_IMG_LG}${s.backdrop_path}` : null,
    first_air_date: s.first_air_date,
    rating: s.vote_average,
    origin_country: s.origin_country,
    popularity: s.popularity,
    stream_url: buildStreamUrl(s.id),
    stream_url_ep1: buildStreamUrl(s.id, 1, 1),
  }));

  const byRegion = topRes.data.results.slice(0, 20).map((s: any) => ({
    id: s.id,
    title: s.name,
    original_title: s.original_name,
    overview: s.overview?.slice(0, 200),
    poster: s.poster_path ? `${TMDB_IMG}${s.poster_path}` : null,
    backdrop: s.backdrop_path ? `${TMDB_IMG_LG}${s.backdrop_path}` : null,
    first_air_date: s.first_air_date,
    rating: s.vote_average,
    origin_country: s.origin_country,
    popularity: s.popularity,
    stream_url: buildStreamUrl(s.id),
    stream_url_ep1: buildStreamUrl(s.id, 1, 1),
  }));

  return { trending_global: trending, trending_by_region: byRegion, region };
}

// === DramaBox Trending (Short Dramas) ===
export async function getDramaBoxTrending() {
  const res = await axios.get("https://www.dramaboxdb.com/", {
    headers: scraperHeaders,
    timeout: 12000,
  });

  const $ = cheerio.load(res.data);
  const dramas: any[] = [];

  // Collect all link data grouped by drama id
  const dramaMap = new Map<string, { id: string; slug: string; texts: string[] }>();

  $("a[href*='/movie/']").each((_i, el) => {
    const href = $(el).attr("href") || "";
    const match = href.match(/\/movie\/(\d+)\/([^?#]+)/);
    if (!match) return;
    const id = match[1];
    const text = $(el).text().trim();
    if (!text) return;

    if (!dramaMap.has(id)) {
      dramaMap.set(id, { id, slug: match[2], texts: [] });
    }
    const entry = dramaMap.get(id)!;
    if (!entry.texts.includes(text)) entry.texts.push(text);
  });

  for (const [id, entry] of dramaMap.entries()) {
    // Pick the title: shortest non-episode-count text under 150 chars
    const title = entry.texts.find(t =>
      !/^\d+\s+Episodes?$/i.test(t) &&
      t.length > 2 &&
      t.length < 150 &&
      !/^\d+\s*$/.test(t)
    );
    if (!title) continue;

    dramas.push({
      id: entry.id,
      slug: entry.slug,
      title,
      url: `https://www.dramaboxdb.com/movie/${entry.id}/${entry.slug}`,
      source: "dramabox",
    });
    if (dramas.length >= 30) break;
  }

  return dramas.slice(0, 30);
}

// === DramaBox Drama Detail ===
export async function getDramaBoxInfo(id: string, slug: string) {
  const url = `https://www.dramaboxdb.com/movie/${id}/${slug}`;
  const res = await axios.get(url, {
    headers: scraperHeaders,
    timeout: 12000,
  });

  const $ = cheerio.load(res.data);

  const title = $("h1").first().text().trim();

  let description = "";
  $("p").each((_i, el) => {
    const text = $(el).text().trim();
    if (text.length > 80 && !description) description = text;
  });

  const genres: string[] = [];
  const genreSeen = new Set<string>();
  $("a[href*='/genres/']").each((_i, el) => {
    const g = $(el).text().trim();
    if (g && !genreSeen.has(g)) {
      genreSeen.add(g);
      genres.push(g);
    }
  });

  const episodes: any[] = [];
  const epSeen = new Set<string>();
  $("a[href*='/ep/']").each((_i, el) => {
    const href = $(el).attr("href") || "";
    const epMatch = href.match(/\/ep\/(\d+)_[^/]+\/(\d+)_([^?#]+)/);
    if (!epMatch || epSeen.has(epMatch[2])) return;
    epSeen.add(epMatch[2]);

    episodes.push({
      episode_id: epMatch[2],
      episode_name: epMatch[3].replace(/-/g, " "),
      url: `https://www.dramaboxdb.com${href}`,
    });
  });

  return {
    id,
    slug,
    title,
    description,
    genres,
    total_episodes: episodes.length,
    episodes,
    url,
    source: "dramabox",
    note: "Video playback requires DramaBox account/app login",
  };
}

// === FlixHQ Drama/Movie Search (via Consumet) ===
export async function searchFlixHQ(query: string, page: number = 1) {
  const flixhq = new MOVIES.FlixHQ();
  const results = await flixhq.search(query, page);
  return results;
}

// === FlixHQ Media Info (via Consumet) ===
export async function getFlixHQInfo(mediaId: string) {
  const flixhq = new MOVIES.FlixHQ();
  const info = await flixhq.fetchMediaInfo(mediaId);
  return info;
}

// === TMDB Genre-based Drama Discovery ===
export async function discoverDramas(params: {
  with_origin_country?: string;
  with_genres?: string;
  sort_by?: string;
  page?: number;
}) {
  const res = await axios.get(`${TMDB_BASE}/discover/tv`, {
    params: {
      api_key: TMDB_KEY,
      language: "en-US",
      sort_by: params.sort_by || "popularity.desc",
      "vote_count.gte": 20,
      with_origin_country: params.with_origin_country,
      with_genres: params.with_genres,
      page: params.page || 1,
    },
    timeout: 10000,
  });

  return {
    page: res.data.page,
    total_pages: res.data.total_pages,
    total_results: res.data.total_results,
    results: res.data.results.map((s: any) => ({
      id: s.id,
      title: s.name,
      original_title: s.original_name,
      overview: s.overview?.slice(0, 200),
      poster: s.poster_path ? `${TMDB_IMG}${s.poster_path}` : null,
      backdrop: s.backdrop_path ? `${TMDB_IMG_LG}${s.backdrop_path}` : null,
      first_air_date: s.first_air_date,
      rating: s.vote_average,
      origin_country: s.origin_country,
      popularity: s.popularity,
      stream_url: buildStreamUrl(s.id),
      stream_url_ep1: buildStreamUrl(s.id, 1, 1),
    })),
  };
}
