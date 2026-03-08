import axios from "axios";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface LyricsResult {
  artist: string;
  title: string;
  image: string;
  link: string;
  lyrics: string;
}

const DEEZER_API = Buffer.from("aHR0cHM6Ly9hcGkuZGVlemVyLmNvbQ==", "base64").toString();
const LYRICS_API = Buffer.from("aHR0cHM6Ly9hcGkubHlyaWNzLm92aA==", "base64").toString();

export async function searchLyrics(query: string): Promise<LyricsResult> {
  const searchRes = await axios.get(`${DEEZER_API}/search?q=${encodeURIComponent(query)}&limit=1`, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 8000,
  });

  const tracks = searchRes.data?.data;
  if (!tracks || tracks.length === 0) {
    throw new Error("No song found for query: " + query);
  }

  const track = tracks[0];
  const artist = track.artist?.name || "";
  const title = track.title || "";
  const image = track.album?.cover_big || track.album?.cover_medium || track.album?.cover || "";
  const link = track.link || "";

  let lyrics = "";
  if (artist && title) {
    try {
      const lyricsRes = await axios.get(
        `${LYRICS_API}/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        {
          headers: { "User-Agent": USER_AGENT },
          timeout: 8000,
        }
      );
      lyrics = lyricsRes.data?.lyrics || "";
    } catch {}
  }

  if (lyrics) {
    lyrics = lyrics.replace(/^Paroles de la chanson .+ par .+\r?\n/, "");
    lyrics = lyrics.trim();
  }

  if (!lyrics) {
    lyrics = "Lyrics not available for this track";
  }

  return { artist, title, image, link, lyrics };
}
