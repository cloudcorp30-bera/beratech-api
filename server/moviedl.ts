import axios from "axios";
  import { MOVIES } from "@consumet/extensions";

  const TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
  const TMDB_BASE = "https://api.themoviedb.org/3";
  const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
  const TMDB_IMG_LG = "https://image.tmdb.org/t/p/original";

  export interface MovieDownloadInfo {
    tmdb_id: number;
    imdb_id: string | null;
    title: string;
    year: string | null;
    quality: string;
    source_type: "hls" | "mp4";
    source_url: string;
    is_m3u8: boolean;
    poster: string | null;
    backdrop: string | null;
    overview: string | null;
    rating: number | null;
    subtitles: any[];
    all_sources: any[];
    stream_headers: Record<string, string>;
  }

  const QUALITY_ORDER = ["1080p", "720p", "480p", "360p", "auto"];

  // ── Search TMDB by title, return top results ────────────────────────────────
  export async function searchTmdbMovies(query: string) {
    const res = await axios.get(`${TMDB_BASE}/search/movie`, {
      params: { api_key: TMDB_KEY, query, include_adult: false, language: "en-US", page: 1 },
      timeout: 8000,
    });
    return (res.data.results ?? []).slice(0, 5).map((m: any) => ({
      tmdb_id: m.id,
      title: m.title,
      year: m.release_date?.slice(0, 4) ?? null,
      overview: (m.overview as string)?.slice(0, 150) ?? null,
      rating: m.vote_average ?? null,
      poster: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
    }));
  }

  // ── Core: given a TMDB ID, scrape FlixHQ for a real stream source ───────────
  export async function fetchMovieSource(tmdbId: number): Promise<MovieDownloadInfo> {
    const tmdbRes = await axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
      params: { api_key: TMDB_KEY, append_to_response: "external_ids" },
      timeout: 10000,
    });
    const movie = tmdbRes.data;
    const title = movie.title as string;
    const year = (movie.release_date as string)?.slice(0, 4) ?? null;
    const imdbId: string | null = movie.external_ids?.imdb_id ?? null;

    const flixhq = new MOVIES.FlixHQ();
    const searchRes = await flixhq.search(year ? `${title} ${year}` : title);
    const results = (searchRes.results ?? []) as any[];

    const match =
      results.find(
        (r: any) => r.type === "Movie" && r.title?.toLowerCase() === title.toLowerCase()
      ) ??
      results.find(
        (r: any) =>
          r.type === "Movie" && r.title?.toLowerCase().includes(title.toLowerCase())
      ) ??
      results.find((r: any) => r.type === "Movie") ??
      results[0];

    if (!match?.id) {
      throw new Error(`No stream source found for "${title}" — try a different title`);
    }

    const info = await flixhq.fetchMediaInfo(match.id);
    const episode = (info as any).episodes?.[0];
    if (!episode?.id) {
      throw new Error(`No playable source found for "${title}"`);
    }

    const sourceData = await flixhq.fetchEpisodeSources(episode.id, match.id);
    const sources: any[] = (sourceData as any).sources ?? [];
    const subtitles: any[] = (sourceData as any).subtitles ?? [];
    const consumetHeaders: Record<string, string> = (sourceData as any).headers ?? {};

    if (sources.length === 0) {
      throw new Error(`Source list is empty for "${title}"`);
    }

    // Prefer MP4 over HLS, highest quality first
    const sorted = [...sources].sort((a: any, b: any) => {
      if (!a.isM3U8 && b.isM3U8) return -1;
      if (a.isM3U8 && !b.isM3U8) return 1;
      const qa = QUALITY_ORDER.indexOf((a.quality ?? "auto").toString().toLowerCase());
      const qb = QUALITY_ORDER.indexOf((b.quality ?? "auto").toString().toLowerCase());
      return (qa === -1 ? 999 : qa) - (qb === -1 ? 999 : qb);
    });

    const best = sorted[0];

    return {
      tmdb_id: tmdbId,
      imdb_id: imdbId,
      title,
      year,
      quality: best.quality ?? "auto",
      source_type: best.isM3U8 ? "hls" : "mp4",
      source_url: best.url,
      is_m3u8: best.isM3U8 ?? true,
      poster: movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null,
      backdrop: movie.backdrop_path ? `${TMDB_IMG_LG}${movie.backdrop_path}` : null,
      overview: (movie.overview as string)?.slice(0, 300) ?? null,
      rating: movie.vote_average ?? null,
      subtitles,
      stream_headers: consumetHeaders,
      all_sources: sources.map((s: any) => ({
        url: s.url,
        quality: s.quality ?? "unknown",
        type: s.isM3U8 ? "HLS" : "MP4",
      })),
    };
  }

  // ── Search by title then immediately fetch source ────────────────────────────
  export async function fetchMovieSourceByQuery(query: string): Promise<MovieDownloadInfo> {
    const results = await searchTmdbMovies(query);
    if (results.length === 0) {
      throw new Error(`No TMDB results found for "${query}"`);
    }
    // Use the top result
    return fetchMovieSource(results[0].tmdb_id);
  }
  