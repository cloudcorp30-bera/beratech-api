import axios from "axios";

export async function searchMovies(query: string, limit: number = 20) {
  const response = await axios.get(`https://yts.bz/api/v2/list_movies.json`, {
    params: {
      query_term: query,
      limit: limit,
      sort_by: "download_count"
    },
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    timeout: 10000
  });

  if (response.data?.status !== "ok" || !response.data?.data?.movies) {
    return [];
  }

  return response.data.data.movies.map((m: any) => ({
    id: m.id,
    imdb_code: m.imdb_code,
    title: m.title_long,
    year: m.year,
    rating: m.rating,
    runtime: m.runtime,
    genres: m.genres,
    summary: m.summary,
    thumbnail: m.medium_cover_image,
    background_image: m.background_image,
    stream_url: m.imdb_code ? `https://vidsrc.me/embed/movie?imdb=${m.imdb_code}` : null,
    torrents: m.torrents?.map((t: any) => ({
      url: t.url,
      hash: t.hash,
      quality: t.quality,
      type: t.type,
      size: t.size
    })) || []
  }));
}
