import axios from "axios";
  import { MOVIES, ANIME } from "@consumet/extensions";

  const TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
  const TMDB_BASE = "https://api.themoviedb.org/3";
  const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
  const TMDB_IMG_LG = "https://image.tmdb.org/t/p/original";

  // ═══════════════════════════════════════════════════════════════
  // MOVIE SOURCES — scrapes FlixHQ (Consumet) for real HLS/MP4
  //                streams, same source aggregation vidlink.pro uses
  // ═══════════════════════════════════════════════════════════════
  export async function getVidlinkMovieSources(tmdbId: number) {
    const [tmdbRes] = await Promise.all([
      axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
        params: { api_key: TMDB_KEY, append_to_response: "external_ids" },
        timeout: 10000,
      }),
    ]);
    const movie = tmdbRes.data;
    const title = movie.title as string;
    const year = (movie.release_date as string)?.slice(0, 4) ?? null;
    const imdbId: string | null = movie.external_ids?.imdb_id ?? null;

    // Fetch actual HLS/MP4 sources via FlixHQ scraper
    const flixhq = new MOVIES.FlixHQ();
    let sources: any[] = [];
    let subtitles: any[] = [];
    let flixhqId: string | null = null;
    let scrapeError: string | null = null;

    try {
      const searchQuery = year ? `${title} ${year}` : title;
      const searchRes = await flixhq.search(searchQuery);
      const results = (searchRes.results ?? []) as any[];
      const match =
        results.find(
          (r: any) =>
            r.type === "Movie" &&
            r.title?.toLowerCase() === title.toLowerCase()
        ) ??
        results.find(
          (r: any) =>
            r.type === "Movie" &&
            r.title?.toLowerCase().includes(title.toLowerCase())
        ) ??
        results[0];

      if (match?.id) {
        flixhqId = match.id;
        const info = await flixhq.fetchMediaInfo(match.id);
        const episode = (info as any).episodes?.[0];
        if (episode?.id) {
          const sd = await flixhq.fetchEpisodeSources(episode.id, match.id);
          sources = (sd as any).sources ?? [];
          subtitles = (sd as any).subtitles ?? [];
        }
      }
    } catch (e: any) {
      scrapeError = e?.message ?? "FlixHQ scrape failed";
    }

    return {
      tmdb_id: tmdbId,
      imdb_id: imdbId,
      title,
      year,
      type: "movie" as const,
      poster: movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null,
      backdrop: movie.backdrop_path
        ? `${TMDB_IMG_LG}${movie.backdrop_path}`
        : null,
      overview: (movie.overview as string)?.slice(0, 300) ?? null,
      rating: movie.vote_average ?? null,
      sources,
      subtitles,
      source_count: sources.length,
      flixhq_id: flixhqId,
      scrape_error: scrapeError,
      embed_urls: {
        vidlink: `https://vidlink.pro/movie/${tmdbId}`,
        ...(imdbId
          ? {
              "vidsrc.me": `https://vidsrc.me/embed/movie?imdb=${imdbId}`,
              "vidsrc.to": `https://vidsrc.to/embed/movie/${imdbId}`,
              "2embed": `https://www.2embed.cc/embed/${imdbId}`,
              multiembed: `https://multiembed.mov/?video_id=${imdbId}&tmdb=1`,
            }
          : {}),
        autoembed: `https://player.autoembed.cc/embed/movie/${tmdbId}`,
        "vidsrc.xyz": `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`,
        "vidsrc.me_tmdb": `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // TV SHOW SOURCES — same pattern, season + episode aware
  // ═══════════════════════════════════════════════════════════════
  export async function getVidlinkTvSources(
    tmdbId: number,
    season: number,
    episode: number
  ) {
    const [tvRes, epRes] = await Promise.all([
      axios.get(`${TMDB_BASE}/tv/${tmdbId}`, {
        params: { api_key: TMDB_KEY, append_to_response: "external_ids" },
        timeout: 10000,
      }),
      axios
        .get(
          `${TMDB_BASE}/tv/${tmdbId}/season/${season}/episode/${episode}`,
          { params: { api_key: TMDB_KEY }, timeout: 10000 }
        )
        .catch(() => null),
    ]);
    const show = tvRes.data;
    const ep = epRes?.data ?? null;
    const title = show.name as string;
    const year = (show.first_air_date as string)?.slice(0, 4) ?? null;
    const imdbId: string | null = show.external_ids?.imdb_id ?? null;

    const flixhq = new MOVIES.FlixHQ();
    let sources: any[] = [];
    let subtitles: any[] = [];
    let flixhqId: string | null = null;
    let scrapeError: string | null = null;

    try {
      const searchRes = await flixhq.search(title);
      const results = (searchRes.results ?? []) as any[];
      const match =
        results.find(
          (r: any) =>
            r.type === "TV Series" &&
            r.title?.toLowerCase() === title.toLowerCase()
        ) ??
        results.find((r: any) =>
          r.title?.toLowerCase().includes(title.toLowerCase())
        ) ??
        results[0];

      if (match?.id) {
        flixhqId = match.id;
        const info = await flixhq.fetchMediaInfo(match.id);
        const episodes = (info as any).episodes ?? [];
        const targetEp =
          episodes.find(
            (e: any) => e.season === season && e.number === episode
          ) ?? episodes[0];

        if (targetEp?.id) {
          const sd = await flixhq.fetchEpisodeSources(targetEp.id, match.id);
          sources = (sd as any).sources ?? [];
          subtitles = (sd as any).subtitles ?? [];
        }
      }
    } catch (e: any) {
      scrapeError = e?.message ?? "FlixHQ scrape failed";
    }

    return {
      tmdb_id: tmdbId,
      imdb_id: imdbId,
      title,
      year,
      type: "tv" as const,
      season,
      episode,
      episode_title: ep?.name ?? null,
      episode_overview: (ep?.overview as string)?.slice(0, 200) ?? null,
      poster: show.poster_path ? `${TMDB_IMG}${show.poster_path}` : null,
      backdrop: show.backdrop_path
        ? `${TMDB_IMG_LG}${show.backdrop_path}`
        : null,
      rating: show.vote_average ?? null,
      sources,
      subtitles,
      source_count: sources.length,
      flixhq_id: flixhqId,
      scrape_error: scrapeError,
      embed_urls: {
        vidlink: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`,
        "vidsrc.to": `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
        autoembed: `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`,
        "vidsrc.xyz": `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
        "vidsrc.me_tmdb": `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
        multiembed: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
        "2embed": `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
        ...(imdbId
          ? {
              "vidsrc.me": `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`,
            }
          : {}),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // ANIME SOURCES — HiAnime (Consumet) for actual HLS streams,
  //                MAL ID input (same as vidlink.pro anime URLs)
  // ═══════════════════════════════════════════════════════════════
  export async function getVidlinkAnimeSources(
    malId: number,
    episodeNum: number = 1,
    preferDub: boolean = false
  ) {
    const JIKAN = "https://api.jikan.moe/v4";
    const jikanRes = await axios.get(`${JIKAN}/anime/${malId}`, {
      timeout: 8000,
    });
    const anime = jikanRes.data.data;
    const title: string = anime.title_english || anime.title;

    const hianime = new ANIME.Hianime();
    let sources: any[] = [];
    let subtitles: any[] = [];
    let hiAnimeId: string | null = null;
    let scrapeError: string | null = null;

    try {
      const searchRes = await hianime.search(title);
      const results = (searchRes.results ?? []) as any[];
      const match =
        results.find(
          (r: any) => r.title?.toLowerCase() === title.toLowerCase()
        ) ??
        results.find((r: any) =>
          r.title?.toLowerCase().includes(title.split(" ")[0].toLowerCase())
        ) ??
        results[0];

      if (match?.id) {
        hiAnimeId = match.id;
        const info = await hianime.fetchAnimeInfo(match.id);
        const episodes = (info as any).episodes ?? [];
        const targetEp =
          episodes.find((e: any) => e.number === episodeNum) ?? episodes[0];

        if (targetEp?.id) {
          const sd = await hianime.fetchEpisodeSources({
            id: targetEp.id,
            ...(preferDub ? { category: "dub" } : { category: "sub" }),
          } as any);
          sources = (sd as any).sources ?? [];
          subtitles = (sd as any).subtitles ?? [];
        }
      }
    } catch (e: any) {
      scrapeError = e?.message ?? "HiAnime scrape failed";
    }

    const mode = preferDub ? "dub" : "sub";
    return {
      mal_id: malId,
      title,
      type: "anime" as const,
      episode: episodeNum,
      mode,
      image: anime.images?.jpg?.large_image_url ?? null,
      synopsis: (anime.synopsis as string)?.slice(0, 300) ?? null,
      rating: anime.score ?? null,
      total_episodes: anime.episodes ?? null,
      sources,
      subtitles,
      source_count: sources.length,
      hianime_id: hiAnimeId,
      scrape_error: scrapeError,
      embed_urls: {
        vidlink: `https://vidlink.pro/anime/${malId}/${episodeNum}/${mode}`,
        "vidsrc.to": `https://vidsrc.to/embed/anime/${malId}/${episodeNum}`,
        "embed.su": `https://embed.su/embed/anime/${malId}/${episodeNum}`,
      },
    };
  }
  