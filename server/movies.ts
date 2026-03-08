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
    vidsrc_url: m.imdb_code ? `https://vidsrc.to/embed/movie/${m.imdb_code}` : null,
    torrents: m.torrents?.map((t: any) => ({
      url: t.url,
      hash: t.hash,
      quality: t.quality,
      type: t.type,
      size: t.size,
      magnet_link: t.hash
        ? `magnet:?xt=urn:btih:${t.hash}&dn=${encodeURIComponent(m.title_long || m.title)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://torrent.gresille.org:80/announce&tr=udp://p4p.arenabg.com:1337&tr=udp://tracker.leechers-paradise.org:6969`
        : null
    })) || []
  }));
}
