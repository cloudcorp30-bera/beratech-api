import axios from "axios";
import { ANIME } from "@consumet/extensions";
import * as cheerio from "cheerio";

const hianime = new ANIME.Hianime();

// ========================
// ANILIST GRAPHQL
// ========================
async function anilistQuery(query: string, variables: Record<string, any>) {
  const res = await axios.post(
    "https://graphql.anilist.co",
    { query, variables },
    { headers: { "Content-Type": "application/json" }, timeout: 10000 }
  );
  return res.data.data;
}

// ========================
// HIANIME — Search
// ========================
export async function searchAnime(q: string, page: number = 1) {
  const results = await hianime.search(q, page);
  return results;
}

// ========================
// HIANIME — Spotlight (trending hero banners)
// ========================
export async function getAnimeSpotlight() {
  const res = await hianime.fetchSpotlight();
  return res;
}

// ========================
// HIANIME — Top Airing
// ========================
export async function getTopAiring(page: number = 1) {
  const res = await hianime.fetchTopAiring(page);
  return res;
}

// ========================
// HIANIME — Most Popular
// ========================
export async function getMostPopular(page: number = 1) {
  const res = await hianime.fetchMostPopular(page);
  return res;
}

// ========================
// HIANIME — Recently Updated
// ========================
export async function getRecentlyUpdated(page: number = 1) {
  const res = await hianime.fetchRecentlyUpdated(page);
  return res;
}

// ========================
// HIANIME — Search Suggestions
// ========================
export async function getAnimeSuggestions(q: string) {
  const res = await hianime.fetchSearchSuggestions(q);
  return res;
}

// ========================
// ANILIST — Search Anime
// ========================
export async function searchAnilist(
  search: string,
  page: number = 1,
  perPage: number = 20
) {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(search: $search, type: ANIME, format_not: NOVEL) {
          id
          title { romaji english native }
          description(asHtml: false)
          episodes
          status
          season
          seasonYear
          averageScore
          popularity
          genres
          coverImage { large medium }
          bannerImage
          format
          siteUrl
          trailer { id site }
          studios(isMain: true) { nodes { name } }
          nextAiringEpisode { episode airingAt }
          externalLinks { url site color }
        }
      }
    }
  `;
  const data = await anilistQuery(query, { search, page, perPage });
  return data.Page;
}

// ========================
// ANILIST — Trending Anime
// ========================
export async function getTrendingAnilist(page: number = 1, perPage: number = 20) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage }
        media(type: ANIME, sort: TRENDING_DESC, format_not: NOVEL) {
          id
          title { romaji english }
          description(asHtml: false)
          episodes
          status
          season
          seasonYear
          averageScore
          popularity
          genres
          coverImage { large medium }
          bannerImage
          format
          siteUrl
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page, perPage });
  return data.Page;
}

// ========================
// ANILIST — Anime Info by ID
// ========================
export async function getAnilistInfo(id: number) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        description(asHtml: false)
        episodes
        status
        season
        seasonYear
        averageScore
        meanScore
        popularity
        favourites
        genres
        tags { name rank }
        coverImage { large extraLarge }
        bannerImage
        format
        duration
        source
        countryOfOrigin
        isAdult
        siteUrl
        trailer { id site }
        studios { nodes { name isAnimationStudio } }
        characters(sort: ROLE, role: MAIN, page: 1, perPage: 10) {
          nodes { name { full } image { large } }
        }
        staff(sort: RELEVANCE, page: 1, perPage: 6) {
          nodes { name { full } primaryOccupations }
        }
        relations {
          nodes {
            id
            title { romaji english }
            format
            type
            coverImage { medium }
            siteUrl
          }
        }
        externalLinks { url site color }
        nextAiringEpisode { episode airingAt }
        streamingEpisodes { title thumbnail url site }
      }
    }
  `;
  const data = await anilistQuery(query, { id });
  return data.Media;
}

// ========================
// NYAA — Anime Torrents (RSS)
// ========================

const NYAA_CATEGORIES: Record<string, string> = {
  all: "1_0",
  anime: "1_0",
  "anime-amv": "1_1",
  "anime-eng": "1_2",
  "anime-non-eng": "1_3",
  "anime-raw": "1_4",
};

const NYAA_FILTERS: Record<string, string> = {
  all: "0",
  "no-remakes": "1",
  "trusted-only": "2",
};

export async function searchNyaa(
  query: string,
  category: string = "anime-eng",
  filter: string = "no-remakes",
  limit: number = 20
) {
  const cat = NYAA_CATEGORIES[category] || NYAA_CATEGORIES["anime-eng"];
  const fil = NYAA_FILTERS[filter] || NYAA_FILTERS["no-remakes"];

  const url = `https://nyaa.si/?page=rss&q=${encodeURIComponent(query)}&c=${cat}&f=${fil}`;
  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 10000,
  });

  const $ = cheerio.load(res.data, { xmlMode: true });
  const items: any[] = [];

  $("item").each((_i, el) => {
    if (items.length >= limit) return;

    const title = $(el).find("title").text().trim();
    const torrentUrl = $(el).find("link").text().trim() || $(el).find("enclosure").attr("url") || "";
    const guid = $(el).find("guid").text().trim();
    const pubDate = $(el).find("pubDate").text().trim();
    const hash = $(el).find("nyaa\\:infoHash").text().trim() || $(el).find("[nodeName='nyaa:infoHash']").text().trim();
    const seeders = parseInt($(el).find("nyaa\\:seeders").text().trim()) || 0;
    const leechers = parseInt($(el).find("nyaa\\:leechers").text().trim()) || 0;
    const downloads = parseInt($(el).find("nyaa\\:downloads").text().trim()) || 0;
    const size = $(el).find("nyaa\\:size").text().trim();
    const category_name = $(el).find("nyaa\\:category").text().trim();
    const trusted = $(el).find("nyaa\\:trusted").text().trim();

    const infoHash = hash || (guid.match(/\/view\/(\d+)$/)
      ? null
      : null);

    const magnetLink = infoHash
      ? `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}&tr=http://nyaa.tracker.wf:7777/announce&tr=http://tracker.opentrackr.org:1337/announce`
      : null;

    items.push({
      title,
      download_url: torrentUrl,
      magnet_link: magnetLink,
      view_url: guid,
      info_hash: infoHash,
      seeders,
      leechers,
      downloads,
      size,
      category: category_name,
      trusted: trusted === "Yes",
      published: pubDate,
    });
  });

  return { query, category, total: items.length, results: items };
}
