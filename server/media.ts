import axios from "axios";

const TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
const TMDB = "https://api.themoviedb.org/3";
const JIKAN = "https://api.jikan.moe/v4";

// ────────────────────────────────────────────────
// UNIFIED SEARCH  (movie | anime | tv | all)
// ────────────────────────────────────────────────
export async function searchMedia(
  query: string,
  type: "movie" | "anime" | "tv" | "all" = "all",
  page: number = 1
) {
  const results: any[] = [];

  const doMovie = async () => {
    const res = await axios.get("https://yts.bz/api/v2/list_movies.json", {
      params: { query_term: query, limit: 10, sort_by: "download_count" },
      timeout: 8000,
    });
    const movies = res.data?.data?.movies || [];
    movies.forEach((m: any) => {
      const topTorrent = m.torrents?.sort((a: any, b: any) => b.seeds - a.seeds)[0];
      results.push({
        id: m.imdb_code || String(m.id),
        tmdb_id: null,
        mal_id: null,
        imdb_id: m.imdb_code,
        title: m.title_long,
        type: "movie",
        year: m.year,
        rating: m.rating,
        thumbnail: m.medium_cover_image,
        synopsis: m.summary?.slice(0, 200) || null,
        genres: m.genres || [],
        episode_count: null,
        stream_url: `https://vidsrc.to/embed/movie/${m.imdb_code}`,
        stream_url_alt: `https://vidsrc.me/embed/movie?imdb=${m.imdb_code}`,
        magnet_link: topTorrent?.hash
          ? `magnet:?xt=urn:btih:${topTorrent.hash}&dn=${encodeURIComponent(m.title_long)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.opentrackr.org:1337/announce`
          : null,
        torrent_url: topTorrent?.url || null,
        quality: topTorrent?.quality || null,
        source: "yts",
      });
    });
  };

  const doAnime = async () => {
    const res = await axios.get(`${JIKAN}/anime`, {
      params: { q: query, page, limit: 10 },
      timeout: 8000,
    });
    (res.data?.data || []).forEach((a: any) => {
      results.push({
        id: `mal:${a.mal_id}`,
        mal_id: a.mal_id,
        tmdb_id: null,
        imdb_id: null,
        title: a.title_english || a.title,
        title_alt: a.title,
        type: "anime",
        year: a.year,
        rating: a.score,
        thumbnail: a.images?.jpg?.large_image_url,
        synopsis: a.synopsis?.slice(0, 200) || null,
        genres: a.genres?.map((g: any) => g.name) || [],
        episode_count: a.episodes,
        status: a.status,
        stream_url: `https://vidsrc.to/embed/anime/${a.mal_id}/1`,
        stream_url_alt: `https://embed.su/embed/anime/${a.mal_id}/1`,
        magnet_link: null,
        torrent_url: null,
        quality: "HD",
        source: "mal/jikan",
      });
    });
  };

  const doTV = async () => {
    const res = await axios.get(`${TMDB}/search/tv`, {
      params: { api_key: TMDB_KEY, query, page, language: "en-US" },
      timeout: 8000,
    });
    (res.data?.results || []).slice(0, 10).forEach((t: any) => {
      results.push({
        id: `tmdb:${t.id}`,
        tmdb_id: t.id,
        mal_id: null,
        imdb_id: null,
        title: t.name,
        type: "tv",
        year: t.first_air_date?.slice(0, 4),
        rating: t.vote_average,
        thumbnail: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : null,
        synopsis: t.overview?.slice(0, 200) || null,
        genres: [],
        episode_count: t.episode_count || null,
        status: null,
        stream_url: `https://vidsrc.to/embed/tv/${t.id}/1/1`,
        stream_url_alt: `https://vidsrc.me/embed/tv?tmdb=${t.id}&season=1&episode=1`,
        magnet_link: null,
        torrent_url: null,
        quality: "HD",
        source: "tmdb",
      });
    });
  };

  const tasks: Promise<void>[] = [];
  if (type === "all" || type === "movie") tasks.push(doMovie().catch(() => {}));
  if (type === "all" || type === "anime") tasks.push(doAnime().catch(() => {}));
  if (type === "all" || type === "tv") tasks.push(doTV().catch(() => {}));
  await Promise.all(tasks);

  return {
    query,
    type,
    total: results.length,
    results,
  };
}

// ────────────────────────────────────────────────
// UNIFIED STREAM / DOWNLOAD
// Returns ytmp3-style response with download_url
// ────────────────────────────────────────────────
export async function streamMedia(
  query: string,
  type: "movie" | "anime" | "tv",
  episode: number = 1,
  season: number = 1
): Promise<{
  title: string;
  type: string;
  year: string | null;
  thumbnail: string | null;
  quality: string;
  episode: number | null;
  season: number | null;
  stream_url: string;
  stream_url_alt: string | null;
  magnet_link: string | null;
  torrent_url: string | null;
  message: string;
  external_url: string;
}> {
  if (type === "movie") {
    const res = await axios.get("https://yts.bz/api/v2/list_movies.json", {
      params: { query_term: query, limit: 5, sort_by: "download_count" },
      timeout: 10000,
    });
    const movies = res.data?.data?.movies;
    if (!movies || movies.length === 0) throw new Error("No movies found for that query");
    const m = movies[0];
    const topTorrent = m.torrents?.sort((a: any, b: any) => b.seeds - a.seeds)[0];
    const streamUrl = m.imdb_code
      ? `https://vidsrc.to/embed/movie/${m.imdb_code}`
      : `https://vidsrc.to/embed/movie/${m.id}`;
    return {
      title: m.title_long,
      type: "movie",
      year: String(m.year),
      thumbnail: m.medium_cover_image,
      quality: topTorrent?.quality || "HD",
      episode: null,
      season: null,
      stream_url: streamUrl,
      stream_url_alt: m.imdb_code ? `https://vidsrc.me/embed/movie?imdb=${m.imdb_code}` : null,
      magnet_link: topTorrent?.hash
        ? `magnet:?xt=urn:btih:${topTorrent.hash}&dn=${encodeURIComponent(m.title_long)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.opentrackr.org:1337/announce`
        : null,
      torrent_url: topTorrent?.url || null,
      message: "Stream URL expires in 10 mins",
      external_url: streamUrl,
    };
  }

  if (type === "anime") {
    const res = await axios.get(`${JIKAN}/anime`, {
      params: { q: query, limit: 5 },
      timeout: 10000,
    });
    const animes = res.data?.data;
    if (!animes || animes.length === 0) throw new Error("No anime found for that query");
    const a = animes[0];
    const streamUrl = `https://vidsrc.to/embed/anime/${a.mal_id}/${episode}`;
    return {
      title: a.title_english || a.title,
      type: "anime",
      year: a.year ? String(a.year) : null,
      thumbnail: a.images?.jpg?.large_image_url || null,
      quality: "HD",
      episode,
      season: null,
      stream_url: streamUrl,
      stream_url_alt: `https://embed.su/embed/anime/${a.mal_id}/${episode}`,
      magnet_link: null,
      torrent_url: null,
      message: "Stream URL expires in 10 mins",
      external_url: streamUrl,
    };
  }

  // type === "tv"
  const res = await axios.get(`${TMDB}/search/tv`, {
    params: { api_key: TMDB_KEY, query, language: "en-US" },
    timeout: 10000,
  });
  const shows = res.data?.results;
  if (!shows || shows.length === 0) throw new Error("No TV series found for that query");
  const t = shows[0];
  const streamUrl = `https://vidsrc.to/embed/tv/${t.id}/${season}/${episode}`;
  return {
    title: t.name,
    type: "tv",
    year: t.first_air_date?.slice(0, 4) || null,
    thumbnail: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : null,
    quality: "HD",
    episode,
    season,
    stream_url: streamUrl,
    stream_url_alt: `https://vidsrc.me/embed/tv?tmdb=${t.id}&season=${season}&episode=${episode}`,
    magnet_link: null,
    torrent_url: null,
    message: "Stream URL expires in 10 mins",
    external_url: streamUrl,
  };
}
