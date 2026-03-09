import axios from "axios";
import * as cheerio from "cheerio";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// ── Decoder functions (ported from cool-dev-guy/vidsrc.ts) ──────────────
function LXVUMCoAHJ(s: string): string {
  const rev = s.split("").reverse().join("");
  const b64 = rev.replace(/-/g, "+").replace(/_/g, "/");
  const dec = Buffer.from(b64, "base64").toString("latin1");
  let out = "";
  for (let i = 0; i < dec.length; i++) out += String.fromCharCode(dec.charCodeAt(i) - 3);
  return out;
}
function bMGyx71TzQLfdonN(s: string): string {
  const chunks: string[] = [];
  for (let i = 0; i < s.length; i += 3) chunks.push(s.slice(i, i + 3));
  return chunks.reverse().join("");
}
function Iry9MQXnLs(s: string): string {
  const key = "pWB9V)[*4I`nJpp?ozyB~dbr9yt!_n4u";
  const bytes = (s.match(/.{1,2}/g) || []).map(h => String.fromCharCode(parseInt(h, 16))).join("");
  let xored = "";
  for (let i = 0; i < bytes.length; i++) xored += String.fromCharCode(bytes.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  let shifted = "";
  for (let i = 0; i < xored.length; i++) shifted += String.fromCharCode(xored.charCodeAt(i) - 3);
  return Buffer.from(shifted, "base64").toString("latin1");
}
function IGLImMhWrI(s: string): string {
  const rev = s.split("").reverse().join("");
  const rot13 = rev.replace(/[a-zA-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < "n" ? 13 : -13)));
  const rev2 = rot13.split("").reverse().join("");
  return Buffer.from(rev2, "base64").toString("latin1");
}
function GTAxQyTyBx(s: string): string {
  const rev = s.split("").reverse().join("");
  let half = "";
  for (let i = 0; i < rev.length; i += 2) half += rev[i];
  return Buffer.from(half, "base64").toString("latin1");
}
function C66jPHx8qu(s: string): string {
  const key = "X9a(O;FMV2-7VO5x;Ao:dN1NoFs?j,";
  const rev = s.split("").reverse().join("");
  const bytes = (rev.match(/.{1,2}/g) || []).map(h => String.fromCharCode(parseInt(h, 16))).join("");
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return out;
}
function MyL1IRSfHe(s: string): string {
  const rev = s.split("").reverse().join("");
  let shifted = "";
  for (let i = 0; i < rev.length; i++) shifted += String.fromCharCode(rev.charCodeAt(i) - 1);
  let hex = "";
  for (let i = 0; i < shifted.length; i += 2) hex += String.fromCharCode(parseInt(shifted.substr(i, 2), 16));
  return hex;
}
function detdj7JHiK(s: string): string {
  const key = "3SAY~#%Y(V%>5d/Yg\"$G[Lh1rK4a;7ok";
  const trimmed = s.slice(10, -16);
  const decoded = Buffer.from(trimmed, "base64").toString("latin1");
  const keyRep = key.repeat(Math.ceil(decoded.length / key.length)).substring(0, decoded.length);
  let out = "";
  for (let i = 0; i < decoded.length; i++) out += String.fromCharCode(decoded.charCodeAt(i) ^ keyRep.charCodeAt(i));
  return out;
}
function nZlUnj2VSo(s: string): string {
  return s.split("").map(c => {
    if (c >= "a" && c <= "z") return String.fromCharCode(((c.charCodeAt(0) - 97 + 3) % 26) + 97);
    if (c >= "A" && c <= "Z") return String.fromCharCode(((c.charCodeAt(0) - 65 + 3) % 26) + 65);
    return c;
  }).join("");
}
function GuxKGDsA2T(s: string): string {
  const rev = s.split("").reverse().join("");
  const dec = Buffer.from(rev, "base64").toString("latin1");
  let out = "";
  for (let i = 0; i < dec.length; i++) out += String.fromCharCode(dec.charCodeAt(i) - 7);
  return out;
}
function laM1dAi3vO(s: string): string {
  const key = "nDXwWAHoRpCxM2ZsVriFIqtBeYTJ1lOU";
  const bytes = (s.match(/.{1,2}/g) || []).map(h => String.fromCharCode(parseInt(h, 16))).join("");
  let xored = "";
  for (let i = 0; i < bytes.length; i++) xored += String.fromCharCode(bytes.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  let out = "";
  for (let i = 0; i < xored.length; i++) out += String.fromCharCode(xored.charCodeAt(i) - 7);
  return out;
}

function decrypt(param: string, type: string): string | null {
  switch (type) {
    case "LXVUMCoAHJ": return LXVUMCoAHJ(param);
    case "GuxKGDsA2T": return GuxKGDsA2T(param);
    case "laM1dAi3vO": return laM1dAi3vO(param);
    case "nZlUnj2VSo": return nZlUnj2VSo(param);
    case "Iry9MQXnLs": return Iry9MQXnLs(param);
    case "IGLImMhWrI": return IGLImMhWrI(param);
    case "GTAxQyTyBx": return GTAxQyTyBx(param);
    case "C66jPHx8qu": return C66jPHx8qu(param);
    case "MyL1IRSfHe": return MyL1IRSfHe(param);
    case "detdj7JHiK": return detdj7JHiK(param);
    case "bMGyx71TzQLfdonN": return bMGyx71TzQLfdonN(param);
    default: return null;
  }
}

// ── vidsrcme.ru extractor ────────────────────────────────────────────────
let BASEDOM = "https://cloudnestra.com";

async function fetchText(url: string, referer?: string): Promise<string> {
  const res = await axios.get(url, {
    headers: { ...HEADERS, ...(referer ? { Referer: referer } : {}) },
    timeout: 15000,
  });
  return typeof res.data === "string" ? res.data : JSON.stringify(res.data);
}

async function getServers(html: string): Promise<{ name: string; hash: string }[]> {
  const $ = cheerio.load(html);
  // Extract BASEDOM from iframe
  const iframeSrc = $("iframe#player_iframe").attr("src") ?? $("iframe").first().attr("src") ?? "";
  if (iframeSrc) {
    try {
      const base = iframeSrc.startsWith("//") ? "https:" + iframeSrc : iframeSrc;
      BASEDOM = new URL(base).origin;
    } catch {}
  }
  const servers: { name: string; hash: string }[] = [];

  // Strategy 1: parse live DOM elements
  const els = $(".serversList .server[data-hash]").toArray();
  const fallback = els.length === 0 ? $(".server[data-hash]").toArray() : els;
  for (const el of fallback) {
    const hash = $(el).attr("data-hash");
    if (hash) servers.push({ name: $(el).text().trim(), hash });
  }
  if (servers.length > 0) return servers;

  // Strategy 2: the serversList is inside an HTML comment — extract via regex
  const commentMatch = html.match(/<!--\s*([\s\S]*?serversList[\s\S]*?)-->/);
  if (commentMatch) {
    const $c = cheerio.load(commentMatch[1]);
    $c(".server[data-hash]").each((_: number, el: any) => {
      const hash = $c(el).attr("data-hash");
      if (hash) servers.push({ name: $c(el).text().trim(), hash });
    });
  }

  // Strategy 3: direct regex extraction of data-hash from entire HTML
  if (servers.length === 0) {
    const hashRe = /class="server"\s+data-hash="([^"]+)"[^>]*>([^<]*)</g;
    let m;
    while ((m = hashRe.exec(html)) !== null) {
      servers.push({ name: m[2].trim(), hash: m[1] });
    }
  }

  return servers;
}

async function prorcp(id: string): Promise<string | null> {
  try {
    const html = await fetchText(`${BASEDOM}/prorcp/${id}`, `${BASEDOM}/`);
    const scriptMatch = html.match(/<script\s+src="\/([^"]*\.js)\?_=([^"]*)"/g);
    if (!scriptMatch) return null;

    let scriptPath = "";
    for (let i = scriptMatch.length - 1; i >= 0; i--) {
      const m = scriptMatch[i].match(/src="\/([^"]*\.js)\?_=([^"]*)"/);
      if (m && !scriptMatch[i].includes("cpt.js")) {
        scriptPath = `${m[1]}?_=${m[2]}`;
        break;
      }
    }
    if (!scriptPath) return null;

    const jsCode = await fetchText(`${BASEDOM}/${scriptPath}`, `${BASEDOM}/`);
    const decryptRegex = /\{\}\}window\[([^"]+)\("([^"]+)"\)/;
    const m = jsCode.match(decryptRegex);
    if (!m || m.length < 3) return null;

    const $ = cheerio.load(html);
    const fnType = m[1].trim();
    const fnParam = m[2].trim();
    const id2 = decrypt(fnParam, fnType);
    if (!id2) return null;
    const encoded = $("#" + id2).text();
    return decrypt(encoded, fnParam);
  } catch {
    return null;
  }
}

async function extractStreamFromRcp(hash: string): Promise<string | null> {
  try {
    const html = await fetchText(`${BASEDOM}/rcp/${hash}`, `${BASEDOM}/`);
    const m = html.match(/src:\s*'([^']*)'/);
    if (!m) return null;
    const src = m[1];
    if (src.startsWith("/prorcp/")) {
      return prorcp(src.replace("/prorcp/", ""));
    }
    return null;
  } catch {
    return null;
  }
}

export interface VidsrcResult {
  stream: string;
  referer: string;
  provider: string;
}

export async function extractM3U8(
  tmdbId: string,
  type: "movie" | "tv",
  season?: number,
  episode?: number
): Promise<VidsrcResult | null> {
  try {
    const url = type === "movie"
      ? `https://vidsrcme.ru/embed/movie?tmdb=${tmdbId}`
      : `https://vidsrcme.ru/embed/tv?tmdb=${tmdbId}&season=${season ?? 1}&episode=${episode ?? 1}`;

    const html = await fetchText(url);
    const servers = await getServers(html);

    if (servers.length === 0) return null;

    for (const server of servers) {
      const stream = await extractStreamFromRcp(server.hash);
      if (stream && (stream.includes(".m3u8") || stream.startsWith("http"))) {
        return { stream, referer: BASEDOM, provider: `vidsrc.net/${server.name}` };
      }
    }
    return null;
  } catch {
    return null;
  }
}
