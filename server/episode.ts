import axios from "axios";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const JIKAN_HEADERS = { "User-Agent": "beratech/3.0" };

// ========================
// JIKAN (MAL) — Search Anime
// ========================
export async function searchJikanAnime(query: string, page: number = 1, limit: number = 20) {
  const res = await axios.get(`${JIKAN_BASE}/anime`, {
    params: { q: query, page, limit, sfw: false },
    headers: JIKAN_HEADERS,
    timeout: 10000,
  });
  const data = res.data;
  return {
    pagination: data.pagination,
    results: (data.data || []).map((a: any) => ({
      mal_id: a.mal_id,
      title: a.title,
      title_english: a.title_english,
      title_japanese: a.title_japanese,
      type: a.type,
      episodes: a.episodes,
      status: a.status,
      aired: a.aired?.string,
      season: a.season,
      year: a.year,
      score: a.score,
      rank: a.rank,
      popularity: a.popularity,
      synopsis: a.synopsis,
      genres: a.genres?.map((g: any) => g.name),
      studios: a.studios?.map((s: any) => s.name),
      image: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
      trailer_url: a.trailer?.url,
      url: a.url,
      stream_urls: {
        vidsrc_to: `https://vidsrc.to/embed/anime/${a.mal_id}/1`,
        embed_su: `https://embed.su/embed/anime/${a.mal_id}/1`,
      },
    })),
  };
}

// ========================
// JIKAN (MAL) — Anime Full Info by ID
// ========================
export async function getJikanAnimeInfo(malId: number) {
  const res = await axios.get(`${JIKAN_BASE}/anime/${malId}/full`, {
    headers: JIKAN_HEADERS,
    timeout: 10000,
  });
  const a = res.data.data;
  return {
    mal_id: a.mal_id,
    title: a.title,
    title_english: a.title_english,
    title_japanese: a.title_japanese,
    type: a.type,
    episodes: a.episodes,
    status: a.status,
    aired: a.aired?.string,
    season: a.season,
    year: a.year,
    score: a.score,
    scored_by: a.scored_by,
    rank: a.rank,
    popularity: a.popularity,
    synopsis: a.synopsis,
    genres: a.genres?.map((g: any) => g.name),
    themes: a.themes?.map((t: any) => t.name),
    demographics: a.demographics?.map((d: any) => d.name),
    studios: a.studios?.map((s: any) => s.name),
    producers: a.producers?.map((p: any) => p.name),
    image: a.images?.jpg?.large_image_url,
    trailer_url: a.trailer?.url,
    url: a.url,
    relations: a.relations,
    streaming: a.streaming,
    external: a.external,
    stream_urls: {
      vidsrc_to: `https://vidsrc.to/embed/anime/${a.mal_id}/1`,
      embed_su: `https://embed.su/embed/anime/${a.mal_id}/1`,
    },
  };
}

// ========================
// JIKAN (MAL) — Anime Episode List
// ========================
export async function getJikanAnimeEpisodes(malId: number, page: number = 1) {
  const res = await axios.get(`${JIKAN_BASE}/anime/${malId}/episodes`, {
    params: { page },
    headers: JIKAN_HEADERS,
    timeout: 10000,
  });
  const data = res.data;
  return {
    pagination: data.pagination,
    mal_id: malId,
    episodes: (data.data || []).map((ep: any) => ({
      mal_id: ep.mal_id,
      episode: ep.mal_id,
      title: ep.title,
      title_japanese: ep.title_japanese,
      title_romanji: ep.title_romanji,
      aired: ep.aired,
      score: ep.score,
      filler: ep.filler,
      recap: ep.recap,
      url: ep.url,
      stream_url: `https://vidsrc.to/embed/anime/${malId}/${ep.mal_id}`,
      embed_url: `https://embed.su/embed/anime/${malId}/${ep.mal_id}`,
    })),
  };
}

// ========================
// JIKAN (MAL) — Top Anime
// ========================
export async function getJikanTopAnime(type: string = "tv", filter: string = "airing", page: number = 1) {
  const res = await axios.get(`${JIKAN_BASE}/top/anime`, {
    params: { type, filter, page, limit: 25 },
    headers: JIKAN_HEADERS,
    timeout: 10000,
  });
  const data = res.data;
  return {
    pagination: data.pagination,
    results: (data.data || []).map((a: any) => ({
      mal_id: a.mal_id,
      title: a.title,
      title_english: a.title_english,
      type: a.type,
      episodes: a.episodes,
      status: a.status,
      score: a.score,
      rank: a.rank,
      popularity: a.popularity,
      genres: a.genres?.map((g: any) => g.name),
      image: a.images?.jpg?.large_image_url,
      url: a.url,
      stream_url: `https://vidsrc.to/embed/anime/${a.mal_id}/1`,
    })),
  };
}

// ========================
// JIKAN (MAL) — Seasonal Anime
// ========================
export async function getJikanSeasonNow(page: number = 1) {
  const res = await axios.get(`${JIKAN_BASE}/seasons/now`, {
    params: { page, limit: 25 },
    headers: JIKAN_HEADERS,
    timeout: 10000,
  });
  const data = res.data;
  return {
    pagination: data.pagination,
    results: (data.data || []).map((a: any) => ({
      mal_id: a.mal_id,
      title: a.title,
      title_english: a.title_english,
      type: a.type,
      episodes: a.episodes,
      status: a.status,
      score: a.score,
      genres: a.genres?.map((g: any) => g.name),
      studios: a.studios?.map((s: any) => s.name),
      image: a.images?.jpg?.large_image_url,
      url: a.url,
      stream_url: `https://vidsrc.to/embed/anime/${a.mal_id}/1`,
    })),
  };
}

// ========================
// UNIVERSAL — Episode streaming embed URLs (multi-provider)
// ========================
export function getEpisodeStreamUrls(params: {
  type: "movie" | "tv" | "anime";
  tmdb_id?: string | number;
  imdb_id?: string;
  anilist_id?: string | number;
  mal_id?: string | number;
  season?: number;
  episode?: number;
}) {
  const { type, tmdb_id, imdb_id, anilist_id, mal_id, season = 1, episode = 1 } = params;
  const streams: Record<string, string> = {};

  if (type === "movie") {
    if (imdb_id) {
      streams["vidsrc.me"] = `https://vidsrc.me/embed/movie?imdb=${imdb_id}`;
      streams["vidsrc.to"] = `https://vidsrc.to/embed/movie/${imdb_id}`;
      streams["2embed"] = `https://www.2embed.cc/embed/${imdb_id}`;
      streams["multiembed"] = `https://multiembed.mov/?video_id=${imdb_id}&tmdb=1`;
    }
    if (tmdb_id) {
      if (!imdb_id) streams["vidsrc.to"] = `https://vidsrc.to/embed/movie/${tmdb_id}`;
      streams["vidsrc.me_tmdb"] = `https://vidsrc.me/embed/movie?tmdb=${tmdb_id}`;
      streams["autoembed"] = `https://player.autoembed.cc/embed/movie/${tmdb_id}`;
      streams["vidsrc.xyz"] = `https://vidsrc.xyz/embed/movie?tmdb=${tmdb_id}`;
    }
  } else if (type === "tv") {
    if (imdb_id) {
      streams["vidsrc.me"] = `https://vidsrc.me/embed/tv?imdb=${imdb_id}&season=${season}&episode=${episode}`;
    }
    if (tmdb_id) {
      streams["vidsrc.to"] = `https://vidsrc.to/embed/tv/${tmdb_id}/${season}/${episode}`;
      streams["vidsrc.me_tmdb"] = `https://vidsrc.me/embed/tv?tmdb=${tmdb_id}&season=${season}&episode=${episode}`;
      streams["autoembed"] = `https://player.autoembed.cc/embed/tv/${tmdb_id}/${season}/${episode}`;
      streams["2embed"] = `https://www.2embed.cc/embedtv/${tmdb_id}&s=${season}&e=${episode}`;
      streams["vidsrc.xyz"] = `https://vidsrc.xyz/embed/tv?tmdb=${tmdb_id}&season=${season}&episode=${episode}`;
      streams["multiembed"] = `https://multiembed.mov/?video_id=${tmdb_id}&tmdb=1&s=${season}&e=${episode}`;
    }
  } else if (type === "anime") {
    if (anilist_id) {
      streams["vidsrc.to_anilist"] = `https://vidsrc.to/embed/anime/${anilist_id}/${episode}`;
      streams["embed.su_anilist"] = `https://embed.su/embed/anime/${anilist_id}/${episode}`;
    }
    if (mal_id) {
      streams["vidsrc.to_mal"] = `https://vidsrc.to/embed/anime/${mal_id}/${episode}`;
      streams["embed.su_mal"] = `https://embed.su/embed/anime/${mal_id}/${episode}`;
    }
  }

  return {
    type,
    season: type !== "movie" ? season : null,
    episode: type !== "movie" ? episode : null,
    streams,
    stream_count: Object.keys(streams).length,
    note: "These embed URLs work in iframes or with yt-dlp. For anime torrent downloads, use the /api/torrent/nyaa endpoint.",
    yt_dlp_hint: "yt-dlp '<stream_url>' — downloads from most of these providers",
  };
}
