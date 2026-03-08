import crypto from "crypto";
import dns from "dns";
import tls from "tls";
import { promisify } from "util";
import axios from "axios";
import QRCode from "qrcode";
import { uploadToCatbox } from "./catbox";

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveCname = promisify(dns.resolveCname);
const dnsResolveNs = promisify(dns.resolveNs);

const _e = (b: string) => Buffer.from(b, "base64").toString();
const SCREENSHOT_SVC = _e("aHR0cHM6Ly9pbWFnZS50aHVtLmlvL2dldA==");
const IPINFO_SVC = _e("aHR0cHM6Ly9pcGluZm8uaW8=");

export function generateHash(text: string, algorithm: string = "sha256"): Record<string, string> {
  const algos = ["md5", "sha1", "sha256", "sha512"];
  if (algorithm && algorithm !== "all" && algos.includes(algorithm)) {
    return { [algorithm]: crypto.createHash(algorithm).update(text).digest("hex") };
  }
  const result: Record<string, string> = {};
  for (const algo of algos) {
    result[algo] = crypto.createHash(algo).update(text).digest("hex");
  }
  return result;
}

export function encodeBase64(text: string): { encoded: string; original: string } {
  return { encoded: Buffer.from(text).toString("base64"), original: text };
}

export function decodeBase64(encoded: string): { decoded: string; original: string } {
  return { decoded: Buffer.from(encoded, "base64").toString("utf-8"), original: encoded };
}

export function generateUUID(count: number = 1): string[] {
  const c = Math.min(Math.max(1, count), 50);
  return Array.from({ length: c }, () => crypto.randomUUID());
}

export function generatePassword(length: number = 16, options: { uppercase?: boolean; lowercase?: boolean; numbers?: boolean; symbols?: boolean } = {}): { password: string; length: number; strength: string } {
  const len = Math.min(Math.max(8, length), 128);
  const up = options.uppercase !== false;
  const lo = options.lowercase !== false;
  const nu = options.numbers !== false;
  const sy = options.symbols !== false;

  let chars = "";
  if (up) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (lo) chars += "abcdefghijklmnopqrstuvwxyz";
  if (nu) chars += "0123456789";
  if (sy) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const bytes = crypto.randomBytes(len);
  let password = "";
  for (let i = 0; i < len; i++) {
    password += chars[bytes[i] % chars.length];
  }

  let strength = "weak";
  if (len >= 12 && up && lo && nu && sy) strength = "very strong";
  else if (len >= 12 && ((up && lo && nu) || (up && lo && sy))) strength = "strong";
  else if (len >= 10) strength = "medium";

  return { password, length: len, strength };
}

export function convertTimestamp(input: string): Record<string, any> {
  let date: Date;
  const num = Number(input);

  if (!isNaN(num)) {
    date = num > 1e12 ? new Date(num) : new Date(num * 1000);
  } else {
    date = new Date(input);
  }

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date/timestamp input");
  }

  return {
    unix_seconds: Math.floor(date.getTime() / 1000),
    unix_milliseconds: date.getTime(),
    iso8601: date.toISOString(),
    utc: date.toUTCString(),
    date: date.toISOString().split("T")[0],
    time: date.toISOString().split("T")[1].replace("Z", ""),
    day_of_week: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getUTCDay()],
    relative: getRelativeTime(date),
  };
}

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);
  const suffix = diff > 0 ? "ago" : "from now";

  if (abs < 60000) return "just now";
  if (abs < 3600000) return `${Math.floor(abs / 60000)} minutes ${suffix}`;
  if (abs < 86400000) return `${Math.floor(abs / 3600000)} hours ${suffix}`;
  if (abs < 2592000000) return `${Math.floor(abs / 86400000)} days ${suffix}`;
  if (abs < 31536000000) return `${Math.floor(abs / 2592000000)} months ${suffix}`;
  return `${Math.floor(abs / 31536000000)} years ${suffix}`;
}

export function convertColor(color: string): Record<string, any> {
  let r: number, g: number, b: number;

  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color.trim());
  const hex3Match = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(color.trim());
  const rgbMatch = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(color.trim());

  if (hexMatch) {
    r = parseInt(hexMatch[1], 16);
    g = parseInt(hexMatch[2], 16);
    b = parseInt(hexMatch[3], 16);
  } else if (hex3Match) {
    r = parseInt(hex3Match[1] + hex3Match[1], 16);
    g = parseInt(hex3Match[2] + hex3Match[2], 16);
    b = parseInt(hex3Match[3] + hex3Match[3], 16);
  } else if (rgbMatch) {
    r = parseInt(rgbMatch[1]);
    g = parseInt(rgbMatch[2]);
    b = parseInt(rgbMatch[3]);
  } else {
    throw new Error("Invalid color format. Use hex (#FF5733), short hex (#F53), or rgb(255,87,51)");
  }

  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rr: h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6; break;
      case gg: h = ((bb - rr) / d + 2) / 6; break;
      case bb: h = ((rr - gg) / d + 4) / 6; break;
    }
  }

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const m = l - c / 2;

  return {
    hex: `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase(),
    rgb: { r, g, b },
    rgb_string: `rgb(${r}, ${g}, ${b})`,
    hsl: { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) },
    hsl_string: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
    cmyk: {
      c: Math.round((1 - rr / (max || 1)) * 100),
      m: Math.round((1 - gg / (max || 1)) * 100),
      y: Math.round((1 - bb / (max || 1)) * 100),
      k: Math.round((1 - max) * 100),
    },
  };
}

export function decodeJWT(token: string): Record<string, any> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format - expected 3 parts separated by dots");
  }

  const decodeSegment = (seg: string) => {
    const padded = seg.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
  };

  const header = decodeSegment(parts[0]);
  const payload = decodeSegment(parts[1]);

  const result: Record<string, any> = { header, payload };

  if (payload.exp) {
    const expDate = new Date(payload.exp * 1000);
    result.expiration = { timestamp: payload.exp, date: expDate.toISOString(), expired: expDate < new Date() };
  }
  if (payload.iat) {
    result.issued_at = { timestamp: payload.iat, date: new Date(payload.iat * 1000).toISOString() };
  }

  return result;
}

export async function lookupIP(ip: string): Promise<Record<string, any>> {
  const res = await axios.get(`${IPINFO_SVC}/${encodeURIComponent(ip)}/json`, {
    timeout: 10000,
    headers: { "User-Agent": "BeraAPI/1.0" },
  });
  const d = res.data;
  return {
    ip: d.ip,
    hostname: d.hostname || null,
    city: d.city || null,
    region: d.region || null,
    country: d.country || null,
    location: d.loc || null,
    organization: d.org || null,
    timezone: d.timezone || null,
    postal: d.postal || null,
  };
}

export async function dnsLookup(domain: string): Promise<Record<string, any>> {
  const results: Record<string, any> = { domain };

  const tasks = [
    dnsResolve4(domain).then(r => results.A = r).catch(() => results.A = []),
    dnsResolve6(domain).then(r => results.AAAA = r).catch(() => results.AAAA = []),
    dnsResolveMx(domain).then(r => results.MX = r).catch(() => results.MX = []),
    dnsResolveTxt(domain).then(r => results.TXT = r.map(t => t.join(""))).catch(() => results.TXT = []),
    dnsResolveCname(domain).then(r => results.CNAME = r).catch(() => results.CNAME = []),
    dnsResolveNs(domain).then(r => results.NS = r).catch(() => results.NS = []),
  ];

  await Promise.allSettled(tasks);
  return results;
}

export async function getHttpHeaders(url: string): Promise<Record<string, any>> {
  const res = await axios.head(url, {
    timeout: 15000,
    maxRedirects: 5,
    headers: { "User-Agent": "BeraAPI/1.0" },
    validateStatus: () => true,
  });

  return {
    url,
    status_code: res.status,
    status_text: res.statusText,
    headers: res.headers,
  };
}

export async function generateQRCode(text: string, size: number = 300): Promise<string> {
  const sz = Math.min(Math.max(100, size), 1000);
  const buffer = await QRCode.toBuffer(text, {
    width: sz,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });

  const url = await uploadToCatbox(buffer, `qr_${Date.now()}.png`, "image/png");
  return url;
}

export function testRegex(pattern: string, flags: string = "", testString: string): Record<string, any> {
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e: any) {
    throw new Error(`Invalid regex pattern: ${e.message}`);
  }

  const matches: Array<{ match: string; index: number; groups: Record<string, string> | null }> = [];
  let m: RegExpExecArray | null;

  if (flags.includes("g")) {
    while ((m = regex.exec(testString)) !== null) {
      matches.push({ match: m[0], index: m.index, groups: m.groups || null });
      if (matches.length > 100) break;
    }
  } else {
    m = regex.exec(testString);
    if (m) {
      matches.push({ match: m[0], index: m.index, groups: m.groups || null });
    }
  }

  return {
    pattern,
    flags,
    test_string: testString,
    is_match: matches.length > 0,
    match_count: matches.length,
    matches,
  };
}

export function generateLoremIpsum(paragraphs: number = 1, type: string = "paragraphs"): { text: string; word_count: number } {
  const words = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum cras mattis consectetur purus sit amet fermentum maecenas faucibus mollis interdum praesent commodo cursus magna vel scelerisque nisl consectetur et morbi leo risus porta ac consectetur vestibulum at eros vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor nullam quis risus eget urna mollis ornare vel eu leo integer posuere erat ante venenatis dapibus posuere velit aliquet nulla facilisi etiam dignissim diam quis enim lobortis scelerisque fermentum dui faucibus in ornare".split(" ");

  const count = Math.min(Math.max(1, paragraphs), 20);

  if (type === "words") {
    const wc = Math.min(count * 10, 500);
    const result: string[] = [];
    for (let i = 0; i < wc; i++) {
      result.push(words[Math.floor(Math.random() * words.length)]);
    }
    const text = result.join(" ");
    return { text: text.charAt(0).toUpperCase() + text.slice(1) + ".", word_count: wc };
  }

  if (type === "sentences") {
    const sentences: string[] = [];
    for (let i = 0; i < count; i++) {
      const slen = 8 + Math.floor(Math.random() * 12);
      const s: string[] = [];
      for (let j = 0; j < slen; j++) {
        s.push(words[Math.floor(Math.random() * words.length)]);
      }
      const sentence = s.join(" ");
      sentences.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".");
    }
    const text = sentences.join(" ");
    return { text, word_count: text.split(/\s+/).length };
  }

  const paras: string[] = [];
  for (let p = 0; p < count; p++) {
    const scount = 3 + Math.floor(Math.random() * 5);
    const sentences: string[] = [];
    for (let i = 0; i < scount; i++) {
      const slen = 8 + Math.floor(Math.random() * 12);
      const s: string[] = [];
      for (let j = 0; j < slen; j++) {
        s.push(words[Math.floor(Math.random() * words.length)]);
      }
      const sentence = s.join(" ");
      sentences.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".");
    }
    paras.push(sentences.join(" "));
  }
  const text = paras.join("\n\n");
  return { text, word_count: text.split(/\s+/).length };
}

export function parseURL(url: string): Record<string, any> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  const params: Record<string, string> = {};
  parsed.searchParams.forEach((v, k) => params[k] = v);

  return {
    original: url,
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    origin: parsed.origin,
    query_params: params,
  };
}

export async function takeScreenshot(url: string): Promise<{ screenshot_url: string; target_url: string }> {
  const targetUrl = url.startsWith("http") ? url : `https://${url}`;
  const screenshotDirectUrl = `${SCREENSHOT_SVC}/width/1280/crop/720/noanimate/${targetUrl}`;

  try {
    const res = await axios.get(screenshotDirectUrl, {
      responseType: "arraybuffer",
      timeout: 45000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/png,image/jpeg,image/*",
      },
    });

    const buffer = Buffer.from(res.data);
    if (buffer.length < 1000) {
      throw new Error("Screenshot too small, may have failed");
    }

    const catboxUrl = await uploadToCatbox(buffer, `screenshot_${Date.now()}.png`, "image/png");
    return { screenshot_url: catboxUrl, target_url: targetUrl };
  } catch (err: any) {
    const FALLBACK = _e("aHR0cHM6Ly9hcGkuc2NyZWVuc2hvdG1hY2hpbmUuY29t");
    const fallbackUrl = `${FALLBACK}?url=${encodeURIComponent(targetUrl)}&dimension=1280x720&format=png&cacheLimit=0`;
    
    const res2 = await axios.get(fallbackUrl, {
      responseType: "arraybuffer",
      timeout: 45000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });

    const buffer = Buffer.from(res2.data);
    const catboxUrl = await uploadToCatbox(buffer, `screenshot_${Date.now()}.png`, "image/png");
    return { screenshot_url: catboxUrl, target_url: targetUrl };
  }
}

export function encodeDecodeURI(input: string, action: "encode" | "decode" = "encode"): { result: string; action: string; original: string } {
  if (action === "decode") {
    return { result: decodeURIComponent(input), action: "decoded", original: input };
  }
  return { result: encodeURIComponent(input), action: "encoded", original: input };
}

export function generateHMAC(text: string, secret: string, algorithm: string = "sha256"): { hmac: string; algorithm: string } {
  const algos = ["md5", "sha1", "sha256", "sha512"];
  if (!algos.includes(algorithm)) algorithm = "sha256";
  const hmac = crypto.createHmac(algorithm, secret).update(text).digest("hex");
  return { hmac, algorithm };
}

export function analyzeUserAgent(ua: string): Record<string, any> {
  let browser = "Unknown", browserVersion = "";
  let os = "Unknown", osVersion = "";
  let device = "Desktop";

  if (/Mobile|Android|iPhone|iPad/i.test(ua)) device = "Mobile";
  if (/Tablet|iPad/i.test(ua)) device = "Tablet";

  const chromeMatch = /Chrome\/([\d.]+)/.exec(ua);
  const firefoxMatch = /Firefox\/([\d.]+)/.exec(ua);
  const safariMatch = /Version\/([\d.]+).*Safari/.exec(ua);
  const edgeMatch = /Edg\/([\d.]+)/.exec(ua);
  const operaMatch = /OPR\/([\d.]+)/.exec(ua);

  if (edgeMatch) { browser = "Edge"; browserVersion = edgeMatch[1]; }
  else if (operaMatch) { browser = "Opera"; browserVersion = operaMatch[1]; }
  else if (chromeMatch) { browser = "Chrome"; browserVersion = chromeMatch[1]; }
  else if (firefoxMatch) { browser = "Firefox"; browserVersion = firefoxMatch[1]; }
  else if (safariMatch) { browser = "Safari"; browserVersion = safariMatch[1]; }

  const winMatch = /Windows NT ([\d.]+)/.exec(ua);
  const macMatch = /Mac OS X ([\d_.]+)/.exec(ua);
  const linuxMatch = /Linux/.test(ua);
  const androidMatch = /Android ([\d.]+)/.exec(ua);
  const iosMatch = /iPhone OS ([\d_]+)/.exec(ua);

  if (androidMatch) { os = "Android"; osVersion = androidMatch[1]; }
  else if (iosMatch) { os = "iOS"; osVersion = iosMatch[1].replace(/_/g, "."); }
  else if (winMatch) { os = "Windows"; osVersion = winMatch[1]; }
  else if (macMatch) { os = "macOS"; osVersion = macMatch[1].replace(/_/g, "."); }
  else if (linuxMatch) { os = "Linux"; }

  return {
    user_agent: ua,
    browser: { name: browser, version: browserVersion },
    os: { name: os, version: osVersion },
    device,
    is_bot: /bot|crawl|spider|scrape/i.test(ua),
  };
}

export function numberBaseConvert(value: string, fromBase: number = 10, toBase: number = 16): Record<string, any> {
  const num = parseInt(value, fromBase);
  if (isNaN(num)) throw new Error("Invalid number for the given base");

  return {
    original: value,
    from_base: fromBase,
    binary: num.toString(2),
    octal: num.toString(8),
    decimal: num.toString(10),
    hexadecimal: num.toString(16).toUpperCase(),
    base36: num.toString(36),
    requested_base: toBase,
    converted: num.toString(toBase).toUpperCase(),
  };
}

export function textStatistics(text: string): Record<string, any> {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length || 1;
  const lines = text.split("\n").length;

  const wordFreq: Record<string, number> = {};
  if (words > 0) {
    text.toLowerCase().split(/\s+/).forEach(w => {
      const clean = w.replace(/[^a-z0-9]/g, "");
      if (clean) wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    });
  }

  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    characters: chars,
    characters_no_spaces: charsNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    avg_word_length: words > 0 ? Number((charsNoSpaces / words).toFixed(1)) : 0,
    reading_time: `${Math.max(1, Math.ceil(words / 200))} min`,
    speaking_time: `${Math.max(1, Math.ceil(words / 130))} min`,
    top_words: topWords,
  };
}

export function validateJSON(input: string, format: boolean = true): Record<string, any> {
  try {
    const parsed = JSON.parse(input);
    const formatted = format ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
    const minified = JSON.stringify(parsed);
    return {
      valid: true,
      formatted,
      minified,
      size_bytes: Buffer.byteLength(minified, "utf-8"),
      type: Array.isArray(parsed) ? "array" : typeof parsed,
      keys: typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? Object.keys(parsed) : undefined,
      length: Array.isArray(parsed) ? parsed.length : undefined,
    };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

export function generateSlug(text: string, separator: string = "-"): { slug: string; original: string } {
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, separator)
    .replace(new RegExp(`^${separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}+|${separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}+$`, "g"), "");
  return { slug, original: text };
}

const HTTP_STATUS_CODES: Record<number, { message: string; description: string; category: string }> = {
  100: { message: "Continue", description: "The server has received the request headers and the client should proceed to send the request body.", category: "Informational" },
  101: { message: "Switching Protocols", description: "The requester has asked the server to switch protocols.", category: "Informational" },
  200: { message: "OK", description: "The request has succeeded.", category: "Success" },
  201: { message: "Created", description: "The request has been fulfilled and resulted in a new resource being created.", category: "Success" },
  202: { message: "Accepted", description: "The request has been accepted for processing, but the processing has not been completed.", category: "Success" },
  204: { message: "No Content", description: "The server has fulfilled the request but does not need to return a response body.", category: "Success" },
  301: { message: "Moved Permanently", description: "The requested resource has been permanently moved to a new URL.", category: "Redirection" },
  302: { message: "Found", description: "The requested resource resides temporarily under a different URL.", category: "Redirection" },
  304: { message: "Not Modified", description: "The resource has not been modified since the last request.", category: "Redirection" },
  307: { message: "Temporary Redirect", description: "The request should be repeated with another URI but future requests should still use the original URI.", category: "Redirection" },
  308: { message: "Permanent Redirect", description: "The request and all future requests should be repeated using another URI.", category: "Redirection" },
  400: { message: "Bad Request", description: "The server cannot process the request due to a client error (e.g., malformed request syntax).", category: "Client Error" },
  401: { message: "Unauthorized", description: "Authentication is required and has failed or has not been provided.", category: "Client Error" },
  403: { message: "Forbidden", description: "The server understood the request but refuses to authorize it.", category: "Client Error" },
  404: { message: "Not Found", description: "The requested resource could not be found on the server.", category: "Client Error" },
  405: { message: "Method Not Allowed", description: "The HTTP method is not allowed for the requested resource.", category: "Client Error" },
  408: { message: "Request Timeout", description: "The server timed out waiting for the request.", category: "Client Error" },
  409: { message: "Conflict", description: "The request could not be completed due to a conflict with the current state of the resource.", category: "Client Error" },
  410: { message: "Gone", description: "The requested resource is no longer available and will not be available again.", category: "Client Error" },
  413: { message: "Payload Too Large", description: "The request is larger than the server is willing or able to process.", category: "Client Error" },
  415: { message: "Unsupported Media Type", description: "The media format of the requested data is not supported by the server.", category: "Client Error" },
  422: { message: "Unprocessable Entity", description: "The request was well-formed but was unable to be followed due to semantic errors.", category: "Client Error" },
  429: { message: "Too Many Requests", description: "The user has sent too many requests in a given amount of time (rate limiting).", category: "Client Error" },
  500: { message: "Internal Server Error", description: "The server encountered an unexpected condition that prevented it from fulfilling the request.", category: "Server Error" },
  501: { message: "Not Implemented", description: "The server does not support the functionality required to fulfill the request.", category: "Server Error" },
  502: { message: "Bad Gateway", description: "The server received an invalid response from the upstream server.", category: "Server Error" },
  503: { message: "Service Unavailable", description: "The server is not ready to handle the request (overloaded or down for maintenance).", category: "Server Error" },
  504: { message: "Gateway Timeout", description: "The server did not receive a timely response from the upstream server.", category: "Server Error" },
};

export function lookupHTTPStatus(code?: number): Record<string, any> {
  if (code !== undefined) {
    const info = HTTP_STATUS_CODES[code];
    if (!info) return { code, found: false, error: `Unknown HTTP status code: ${code}` };
    return { code, ...info, found: true };
  }
  const grouped: Record<string, any[]> = {};
  for (const [c, info] of Object.entries(HTTP_STATUS_CODES)) {
    const cat = info.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ code: parseInt(c), message: info.message });
  }
  return { total: Object.keys(HTTP_STATUS_CODES).length, categories: grouped };
}

export function convertCase(text: string, to: string): { result: string; from_detected: string; to: string; original: string } {
  const toCamel = (s: string) => {
    const words = s.replace(/[-_\s]+/g, " ").trim().split(" ");
    return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
  };
  const toPascal = (s: string) => {
    return s.replace(/[-_\s]+/g, " ").trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
  };
  const toSnake = (s: string) => {
    return s
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[-\s]+/g, "_")
      .toLowerCase();
  };
  const toKebab = (s: string) => {
    return s
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[_\s]+/g, "-")
      .toLowerCase();
  };
  const toConstant = (s: string) => toSnake(s).toUpperCase();
  const toDot = (s: string) => toSnake(s).replace(/_/g, ".");
  const toTitle = (s: string) => {
    return s.replace(/[-_\s]+/g, " ").trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  };

  let detected = "unknown";
  if (/^[a-z]+([A-Z][a-z]*)+$/.test(text)) detected = "camelCase";
  else if (/^[A-Z][a-z]+([A-Z][a-z]*)+$/.test(text)) detected = "PascalCase";
  else if (/^[a-z]+(_[a-z]+)+$/.test(text)) detected = "snake_case";
  else if (/^[a-z]+(-[a-z]+)+$/.test(text)) detected = "kebab-case";
  else if (/^[A-Z]+(_[A-Z]+)+$/.test(text)) detected = "CONSTANT_CASE";

  const converters: Record<string, (s: string) => string> = {
    camel: toCamel, pascal: toPascal, snake: toSnake, kebab: toKebab,
    constant: toConstant, dot: toDot, title: toTitle,
    upper: (s) => s.toUpperCase(), lower: (s) => s.toLowerCase(),
  };

  const converter = converters[to.toLowerCase()];
  if (!converter) throw new Error(`Unknown case type: ${to}. Available: ${Object.keys(converters).join(", ")}`);

  return { result: converter(text), from_detected: detected, to, original: text };
}

export function validateIP(ip: string): Record<string, any> {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv6Full = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const ipv6Compressed = /^(([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}|::)$/;

  const v4Match = ipv4Regex.exec(ip);
  if (v4Match) {
    const octets = [parseInt(v4Match[1]), parseInt(v4Match[2]), parseInt(v4Match[3]), parseInt(v4Match[4])];
    const valid = octets.every(o => o >= 0 && o <= 255);
    if (!valid) return { ip, valid: false, version: null, error: "Octet values must be 0-255" };

    let type = "Public";
    const [a, b] = octets;
    if (a === 10) type = "Private (Class A)";
    else if (a === 172 && b >= 16 && b <= 31) type = "Private (Class B)";
    else if (a === 192 && b === 168) type = "Private (Class C)";
    else if (a === 127) type = "Loopback";
    else if (a === 0) type = "Unspecified";
    else if (a === 169 && b === 254) type = "Link-Local";
    else if (a >= 224 && a <= 239) type = "Multicast";
    else if (a >= 240) type = "Reserved";

    let cls = "Classless";
    if (a >= 1 && a <= 126) cls = "Class A";
    else if (a >= 128 && a <= 191) cls = "Class B";
    else if (a >= 192 && a <= 223) cls = "Class C";
    else if (a >= 224 && a <= 239) cls = "Class D (Multicast)";
    else if (a >= 240) cls = "Class E (Reserved)";

    const binary = octets.map(o => o.toString(2).padStart(8, "0")).join(".");
    const decimal = ((octets[0] << 24) + (octets[1] << 16) + (octets[2] << 8) + octets[3]) >>> 0;

    return { ip, valid: true, version: 4, type, class: cls, binary, decimal, hex: `0x${decimal.toString(16).toUpperCase().padStart(8, "0")}` };
  }

  if (ipv6Full.test(ip) || ipv6Compressed.test(ip)) {
    return { ip, valid: true, version: 6, type: "IPv6", note: "IPv6 address classification requires expanded analysis" };
  }

  return { ip, valid: false, version: null, error: "Not a valid IPv4 or IPv6 address" };
}

export function convertBytes(value: number, from: string, to?: string): Record<string, any> {
  const units: Record<string, number> = {
    B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, PB: 1024 ** 5,
    KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4, PiB: 1024 ** 5,
  };

  const fromUpper = from.toUpperCase();
  if (!units[fromUpper] && !units[from]) throw new Error(`Unknown unit: ${from}. Available: ${Object.keys(units).join(", ")}`);
  const multiplier = units[fromUpper] || units[from];
  const bytes = value * multiplier;

  const result: Record<string, any> = {
    input: { value, unit: from },
    bytes,
    conversions: {
      B: bytes,
      KB: Number((bytes / 1024).toFixed(6)),
      MB: Number((bytes / 1024 ** 2).toFixed(6)),
      GB: Number((bytes / 1024 ** 3).toFixed(6)),
      TB: Number((bytes / 1024 ** 4).toFixed(6)),
      PB: Number((bytes / 1024 ** 5).toFixed(6)),
    },
    human_readable: formatBytes(bytes),
  };

  if (to) {
    const toUpper = to.toUpperCase();
    const toMul = units[toUpper] || units[to];
    if (!toMul) throw new Error(`Unknown target unit: ${to}`);
    result.converted = { value: Number((bytes / toMul).toFixed(6)), unit: to };
  }

  return result;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export async function validateEmail(email: string): Promise<Record<string, any>> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid = emailRegex.test(email);
  const parts = email.split("@");
  const result: Record<string, any> = {
    email,
    valid_format: valid,
    local_part: parts[0] || null,
    domain: parts[1] || null,
  };

  if (valid && parts[1]) {
    const disposableDomains = ["tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com", "yopmail.com", "10minutemail.com", "trashmail.com"];
    result.is_disposable = disposableDomains.some(d => parts[1].toLowerCase().endsWith(d));

    const freeDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "protonmail.com", "mail.com", "zoho.com"];
    result.is_free_provider = freeDomains.includes(parts[1].toLowerCase());

    try {
      const mx = await promisify(dns.resolveMx)(parts[1]);
      result.mx_records = mx.sort((a: any, b: any) => a.priority - b.priority).map((r: any) => ({ exchange: r.exchange, priority: r.priority }));
      result.has_mx = mx.length > 0;
    } catch {
      result.mx_records = [];
      result.has_mx = false;
    }
  }

  return result;
}

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  "\u00a0": "&nbsp;", "\u00a9": "&copy;", "\u00ae": "&reg;", "\u2122": "&trade;",
  "\u20ac": "&euro;", "\u00a3": "&pound;", "\u00a5": "&yen;",
};
const REVERSE_ENTITIES: Record<string, string> = {};
for (const [k, v] of Object.entries(HTML_ENTITIES)) REVERSE_ENTITIES[v] = k;

export function htmlEntities(text: string, action: "encode" | "decode" = "encode"): { result: string; action: string; original: string } {
  if (action === "decode") {
    let decoded = text;
    for (const [entity, char] of Object.entries(REVERSE_ENTITIES)) {
      decoded = decoded.split(entity).join(char);
    }
    decoded = decoded.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
    return { result: decoded, action: "decoded", original: text };
  }
  let encoded = text;
  for (const [char, entity] of Object.entries(HTML_ENTITIES)) {
    encoded = encoded.split(char).join(entity);
  }
  return { result: encoded, action: "encoded", original: text };
}

const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
  "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", _: "..--.-",
  '"': ".-..-.", $: "...-..-", "@": ".--.-.",
};
const REVERSE_MORSE: Record<string, string> = {};
for (const [k, v] of Object.entries(MORSE_MAP)) REVERSE_MORSE[v] = k;

export function morseCode(text: string, action: "encode" | "decode" = "encode"): { result: string; action: string; original: string } {
  if (action === "decode") {
    const words = text.trim().split("   ");
    const decoded = words.map(word => {
      return word.split(" ").map(c => REVERSE_MORSE[c] || "?").join("");
    }).join(" ");
    return { result: decoded, action: "decoded", original: text };
  }
  const encoded = text.toUpperCase().split("").map(c => {
    if (c === " ") return "  ";
    return MORSE_MAP[c] || "";
  }).filter(Boolean).join(" ");
  return { result: encoded, action: "encoded", original: text };
}

export function generateRandomData(count: number = 1): any[] {
  const firstNames = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "Benjamin", "Isabella",
    "Lucas", "Mia", "Henry", "Charlotte", "Alexander", "Amelia", "Daniel", "Harper", "Matthew", "Evelyn",
    "Michael", "Abigail", "Ethan", "Emily", "Sebastian", "Elizabeth", "Jack", "Sofia", "Owen", "Ella"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
    "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Hill"];
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "proton.me", "mail.com", "icloud.com", "fastmail.com"];
  const streets = ["Oak", "Maple", "Cedar", "Pine", "Elm", "Birch", "Walnut", "Willow", "Cherry", "Ash"];
  const streetTypes = ["St", "Ave", "Blvd", "Dr", "Ln", "Ct", "Way", "Rd"];
  const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Austin",
    "London", "Paris", "Tokyo", "Sydney", "Toronto", "Berlin", "Amsterdam", "Dubai", "Singapore", "Seoul"];
  const countries = ["US", "UK", "CA", "AU", "DE", "FR", "JP", "NL", "AE", "SG"];
  const jobs = ["Software Engineer", "Product Manager", "Designer", "Data Scientist", "DevOps Engineer", "Marketing Manager",
    "Project Manager", "Business Analyst", "QA Engineer", "Technical Writer", "Sales Manager", "Consultant"];

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randNum = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const c = Math.min(Math.max(1, count), 50);
  return Array.from({ length: c }, (_, i) => {
    const first = pick(firstNames);
    const last = pick(lastNames);
    const username = `${first.toLowerCase()}${last.toLowerCase()}${randNum(1, 999)}`;
    return {
      id: crypto.randomUUID(),
      name: `${first} ${last}`,
      username,
      email: `${username}@${pick(domains)}`,
      phone: `+1-${randNum(200, 999)}-${randNum(100, 999)}-${String(randNum(1000, 9999))}`,
      address: {
        street: `${randNum(100, 9999)} ${pick(streets)} ${pick(streetTypes)}`,
        city: pick(cities),
        zipcode: String(randNum(10000, 99999)),
        country: pick(countries),
      },
      company: `${pick(lastNames)} ${pick(["Inc", "LLC", "Corp", "Ltd", "Group", "Tech", "Solutions"])}`,
      job_title: pick(jobs),
      website: `https://${username}.dev`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      date_of_birth: `${randNum(1970, 2002)}-${String(randNum(1, 12)).padStart(2, "0")}-${String(randNum(1, 28)).padStart(2, "0")}`,
      age: randNum(22, 65),
    };
  });
}

export function textDiff(text1: string, text2: string): Record<string, any> {
  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");
  const changes: Array<{ type: string; line_number: number; content: string }> = [];

  const maxLen = Math.max(lines1.length, lines2.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= lines1.length) {
      changes.push({ type: "added", line_number: i + 1, content: lines2[i] });
    } else if (i >= lines2.length) {
      changes.push({ type: "removed", line_number: i + 1, content: lines1[i] });
    } else if (lines1[i] !== lines2[i]) {
      changes.push({ type: "removed", line_number: i + 1, content: lines1[i] });
      changes.push({ type: "added", line_number: i + 1, content: lines2[i] });
    }
  }

  const added = changes.filter(c => c.type === "added").length;
  const removed = changes.filter(c => c.type === "removed").length;

  return {
    identical: changes.length === 0,
    total_changes: changes.length,
    lines_added: added,
    lines_removed: removed,
    text1_lines: lines1.length,
    text2_lines: lines2.length,
    changes,
  };
}

const CRON_FIELDS = ["minute", "hour", "day_of_month", "month", "day_of_week"] as const;
const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function parseCron(expression: string): Record<string, any> {
  const presets: Record<string, string> = {
    "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *",
    "@monthly": "0 0 1 * *", "@weekly": "0 0 * * 0",
    "@daily": "0 0 * * *", "@midnight": "0 0 * * *",
    "@hourly": "0 * * * *",
  };

  const expr = presets[expression.toLowerCase()] || expression;
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error("Invalid cron expression. Expected 5 fields: minute hour day_of_month month day_of_week");

  const parsed: Record<string, string> = {};
  CRON_FIELDS.forEach((field, i) => parsed[field] = parts[i]);

  const descriptions: string[] = [];
  const describeField = (val: string, fieldName: string): string => {
    if (val === "*") return `every ${fieldName}`;
    if (val.includes("/")) {
      const [, step] = val.split("/");
      return `every ${step} ${fieldName}(s)`;
    }
    if (val.includes(",")) return `at ${fieldName} ${val}`;
    if (val.includes("-")) {
      const [start, end] = val.split("-");
      return `${fieldName} ${start} through ${end}`;
    }
    return `at ${fieldName} ${val}`;
  };

  descriptions.push(describeField(parts[0], "minute"));
  descriptions.push(describeField(parts[1], "hour"));
  if (parts[2] !== "*") descriptions.push(describeField(parts[2], "day"));
  if (parts[3] !== "*") {
    const monthNum = parseInt(parts[3]);
    descriptions.push(monthNum > 0 && monthNum <= 12 ? `in ${MONTH_NAMES[monthNum]}` : describeField(parts[3], "month"));
  }
  if (parts[4] !== "*") {
    const dayNum = parseInt(parts[4]);
    descriptions.push(dayNum >= 0 && dayNum <= 6 ? `on ${DAY_NAMES[dayNum]}` : describeField(parts[4], "day of week"));
  }

  return {
    expression: expr,
    fields: parsed,
    description: descriptions.join(", "),
    is_valid: true,
  };
}

export function checkSSL(domain: string): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("SSL check timed out"));
    }, 15000);

    const socket = tls.connect(443, domain, { servername: domain, rejectUnauthorized: false }, () => {
      clearTimeout(timeout);
      const cert = socket.getPeerCertificate(true);
      socket.end();

      if (!cert || !cert.subject) {
        resolve({ domain, ssl_enabled: false, error: "No certificate found" });
        return;
      }

      const validFrom = new Date(cert.valid_from);
      const validTo = new Date(cert.valid_to);
      const now = new Date();
      const daysRemaining = Math.floor((validTo.getTime() - now.getTime()) / 86400000);

      resolve({
        domain,
        ssl_enabled: true,
        subject: cert.subject,
        issuer: cert.issuer,
        valid_from: validFrom.toISOString(),
        valid_to: validTo.toISOString(),
        days_remaining: daysRemaining,
        is_expired: daysRemaining < 0,
        serial_number: cert.serialNumber,
        fingerprint: cert.fingerprint,
        fingerprint256: cert.fingerprint256,
        protocol: socket.getProtocol(),
        san: cert.subjectaltname ? cert.subjectaltname.split(", ") : [],
      });
    });

    socket.on("error", (err: any) => {
      clearTimeout(timeout);
      reject(new Error(`SSL check failed: ${err.message}`));
    });
  });
}

export function markdownToHTML(md: string): { html: string; original: string } {
  let html = md;
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^\- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(/\n{2,}/g, "\n<br />\n");
  return { html: html.trim(), original: md };
}

export function csvToJSON(csv: string, delimiter: string = ","): Record<string, any> {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV must have at least a header row and one data row");

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ""));
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] || "";
    });
    data.push(row);
  }

  return {
    headers,
    rows: data.length,
    columns: headers.length,
    data,
  };
}

export function generateJWTToken(payload: Record<string, any>, secret: string, expiresIn?: number): { token: string; decoded: Record<string, any> } {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: Record<string, any> = { ...payload, iat: now };
  if (expiresIn) fullPayload.exp = now + expiresIn;

  const encodeSegment = (obj: any) => {
    return Buffer.from(JSON.stringify(obj)).toString("base64url");
  };

  const headerB64 = encodeSegment(header);
  const payloadB64 = encodeSegment(fullPayload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");

  const token = `${headerB64}.${payloadB64}.${signature}`;
  return { token, decoded: { header, payload: fullPayload } };
}

export function cidrCalculator(cidr: string): Record<string, any> {
  const match = /^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/.exec(cidr);
  if (!match) throw new Error("Invalid CIDR notation. Expected format: x.x.x.x/prefix (e.g., 192.168.1.0/24)");

  const ip = match[1];
  const prefix = parseInt(match[2]);
  if (prefix < 0 || prefix > 32) throw new Error("Prefix must be between 0 and 32");

  const octets = ip.split(".").map(Number);
  if (octets.some(o => o < 0 || o > 255)) throw new Error("Invalid IP address octets");

  const ipInt = ((octets[0] << 24) + (octets[1] << 16) + (octets[2] << 8) + octets[3]) >>> 0;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & mask) >>> 0;
  const broadcastInt = (networkInt | ~mask) >>> 0;
  const firstHost = prefix >= 31 ? networkInt : (networkInt + 1) >>> 0;
  const lastHost = prefix >= 31 ? broadcastInt : (broadcastInt - 1) >>> 0;

  const toIP = (n: number) => `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;
  const totalHosts = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2;

  return {
    cidr,
    network_address: toIP(networkInt),
    broadcast_address: toIP(broadcastInt),
    subnet_mask: toIP(mask),
    wildcard_mask: toIP(~mask >>> 0),
    first_host: toIP(firstHost),
    last_host: toIP(lastHost),
    total_hosts: totalHosts,
    prefix_length: prefix,
    ip_class: octets[0] <= 126 ? "A" : octets[0] <= 191 ? "B" : octets[0] <= 223 ? "C" : octets[0] <= 239 ? "D" : "E",
    is_private: (octets[0] === 10) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168),
  };
}

export function getDevToolsDirectory(category?: string) {
  const directory: Record<string, Array<{ name: string; description: string; website: string; category: string; tags: string[] }>> = {
    "AI-Native Editors & IDEs": [
      { name: "Cursor", description: "AI-first code editor built on VS Code with deep AI integration for code generation, editing, and chat", website: "https://cursor.sh", category: "AI-Native Editors & IDEs", tags: ["ai", "editor", "ide", "code-generation"] },
      { name: "VS Code + AI Toolkit", description: "Microsoft's popular editor enhanced with GitHub Copilot and AI Toolkit extensions for intelligent coding", website: "https://code.visualstudio.com", category: "AI-Native Editors & IDEs", tags: ["ai", "editor", "ide", "microsoft"] },
      { name: "Windsurf (Codeium)", description: "AI-powered IDE by Codeium with Flows for multi-file editing, deep codebase understanding, and real-time suggestions", website: "https://codeium.com/windsurf", category: "AI-Native Editors & IDEs", tags: ["ai", "editor", "ide", "codeium"] },
      { name: "Zed", description: "High-performance, multiplayer code editor built in Rust with built-in AI assistance and collaboration features", website: "https://zed.dev", category: "AI-Native Editors & IDEs", tags: ["ai", "editor", "rust", "performance"] },
      { name: "Eclipse Theia", description: "Open-source cloud and desktop IDE framework, extensible and customizable for building tailored development environments", website: "https://theia-ide.org", category: "AI-Native Editors & IDEs", tags: ["ide", "open-source", "cloud", "extensible"] },
    ],
    "Autonomous Coding Agents": [
      { name: "Claude Code (Anthropic)", description: "Anthropic's agentic coding tool that operates in the terminal, understanding codebases and executing complex tasks autonomously", website: "https://anthropic.com", category: "Autonomous Coding Agents", tags: ["ai", "agent", "terminal", "anthropic"] },
      { name: "Baidu Comate", description: "Baidu's AI coding assistant offering intelligent code completion, generation, and optimization for multiple languages", website: "https://comate.baidu.com", category: "Autonomous Coding Agents", tags: ["ai", "agent", "baidu", "code-generation"] },
      { name: "GitHub Copilot Workspace", description: "GitHub's AI-powered development environment that can plan, implement, and test code changes from natural language", website: "https://githubnext.com/projects/copilot-workspace", category: "Autonomous Coding Agents", tags: ["ai", "agent", "github", "workspace"] },
      { name: "Devin", description: "Cognition's fully autonomous AI software engineer capable of planning, coding, debugging, and deploying applications", website: "https://devin.ai", category: "Autonomous Coding Agents", tags: ["ai", "agent", "autonomous", "full-stack"] },
      { name: "OpenHands", description: "Open-source autonomous AI agent (formerly OpenDevin) for software development tasks including coding, debugging, and testing", website: "https://github.com/All-Hands-AI/OpenHands", category: "Autonomous Coding Agents", tags: ["ai", "agent", "open-source", "autonomous"] },
      { name: "AutoCodeRover", description: "Autonomous program improvement tool combining LLMs with code search for automated bug fixing and feature development", website: "https://github.com/nus-apr/auto-code-rover", category: "Autonomous Coding Agents", tags: ["ai", "agent", "bug-fixing", "open-source"] },
    ],
    "App Builders & Prototyping": [
      { name: "Bolt.new (StackBlitz)", description: "AI-powered full-stack web app builder that generates, runs, and deploys apps directly in the browser using WebContainers", website: "https://bolt.new", category: "App Builders & Prototyping", tags: ["ai", "builder", "web", "stackblitz"] },
      { name: "Lovable", description: "AI-powered app builder that turns natural language descriptions into full-stack applications with beautiful UI", website: "https://lovable.dev", category: "App Builders & Prototyping", tags: ["ai", "builder", "no-code", "ui"] },
      { name: "Replit Agent", description: "AI agent that builds complete applications from natural language, handling architecture, coding, and deployment on Replit", website: "https://replit.com", category: "App Builders & Prototyping", tags: ["ai", "agent", "builder", "deployment"] },
      { name: "v0 (Vercel)", description: "Vercel's AI-powered UI generator that creates React components and pages from text prompts and images", website: "https://v0.dev", category: "App Builders & Prototyping", tags: ["ai", "ui", "react", "vercel"] },
      { name: "create.bz", description: "AI-powered platform for rapidly prototyping and building web applications from natural language descriptions", website: "https://create.bz", category: "App Builders & Prototyping", tags: ["ai", "builder", "prototyping", "web"] },
    ],
    "API Development & Testing": [
      { name: "Postman", description: "Industry-leading API platform for designing, testing, documenting, and monitoring APIs with collaboration features", website: "https://postman.com", category: "API Development & Testing", tags: ["api", "testing", "collaboration", "documentation"] },
      { name: "Insomnia", description: "Open-source API client for REST, GraphQL, and gRPC with environment management and code generation", website: "https://insomnia.rest", category: "API Development & Testing", tags: ["api", "testing", "graphql", "grpc"] },
      { name: "Bruno", description: "Fast, Git-friendly, offline-first API client that stores collections in filesystem folders for version control", website: "https://usebruno.com", category: "API Development & Testing", tags: ["api", "testing", "git", "offline"] },
      { name: "Hoppscotch", description: "Open-source API development ecosystem with real-time WebSocket testing, GraphQL support, and team collaboration", website: "https://hoppscotch.io", category: "API Development & Testing", tags: ["api", "testing", "open-source", "websocket"] },
      { name: "Thunder Client", description: "Lightweight REST API client extension for VS Code with clean UI and collection management", website: "https://thunderclient.com", category: "API Development & Testing", tags: ["api", "testing", "vscode", "extension"] },
      { name: "HTTPie", description: "User-friendly command-line and desktop HTTP client with intuitive syntax, JSON support, and beautiful output", website: "https://httpie.io", category: "API Development & Testing", tags: ["api", "cli", "http", "terminal"] },
    ],
    "Database Tools": [
      { name: "TablePlus", description: "Modern native database management tool with clean UI supporting PostgreSQL, MySQL, SQLite, Redis, and more", website: "https://tableplus.com", category: "Database Tools", tags: ["database", "gui", "postgresql", "mysql"] },
      { name: "Beekeeper Studio", description: "Open-source SQL editor and database manager with a focus on usability, supporting major databases", website: "https://beekeeperstudio.io", category: "Database Tools", tags: ["database", "sql", "open-source", "gui"] },
      { name: "DBeaver", description: "Free universal database tool supporting 80+ databases with SQL editor, ER diagrams, and data transfer features", website: "https://dbeaver.io", category: "Database Tools", tags: ["database", "sql", "universal", "open-source"] },
      { name: "DataGrip", description: "JetBrains' professional database IDE with intelligent query console, schema navigation, and data editor", website: "https://jetbrains.com/datagrip", category: "Database Tools", tags: ["database", "ide", "jetbrains", "sql"] },
      { name: "Redis Insight", description: "Official Redis GUI for visualizing, monitoring, and managing Redis databases with module support", website: "https://redis.io/insight", category: "Database Tools", tags: ["database", "redis", "gui", "monitoring"] },
      { name: "MongoDB Compass", description: "Official MongoDB GUI for visually exploring data, running queries, optimizing performance, and managing indexes", website: "https://mongodb.com/products/compass", category: "Database Tools", tags: ["database", "mongodb", "gui", "nosql"] },
    ],
    "Infrastructure & DevOps": [
      { name: "Terraform/OpenTofu", description: "Infrastructure as Code tools for provisioning and managing cloud resources across providers using declarative config", website: "https://opentofu.org", category: "Infrastructure & DevOps", tags: ["iac", "cloud", "devops", "provisioning"] },
      { name: "Crossplane", description: "Open-source Kubernetes add-on for building cloud-native control planes and managing infrastructure via K8s APIs", website: "https://crossplane.io", category: "Infrastructure & DevOps", tags: ["kubernetes", "iac", "cloud", "control-plane"] },
      { name: "Pulumi", description: "Infrastructure as Code platform using real programming languages (Python, TypeScript, Go) instead of DSLs", website: "https://pulumi.com", category: "Infrastructure & DevOps", tags: ["iac", "cloud", "devops", "programming"] },
      { name: "Ansible", description: "Red Hat's automation platform for IT tasks including configuration management, application deployment, and orchestration", website: "https://ansible.com", category: "Infrastructure & DevOps", tags: ["automation", "configuration", "devops", "red-hat"] },
      { name: "Argo CD", description: "Declarative GitOps continuous delivery tool for Kubernetes with automated sync and drift detection", website: "https://argoproj.github.io/cd", category: "Infrastructure & DevOps", tags: ["gitops", "kubernetes", "cd", "automation"] },
      { name: "Jenkins X", description: "Cloud-native CI/CD platform for Kubernetes with automated pipelines, GitOps promotion, and preview environments", website: "https://jenkins-x.io", category: "Infrastructure & DevOps", tags: ["ci-cd", "kubernetes", "cloud-native", "automation"] },
    ],
    "Container & Orchestration": [
      { name: "Docker Desktop", description: "Complete Docker development environment with container management, Kubernetes cluster, and extension marketplace", website: "https://docker.com/products/docker-desktop", category: "Container & Orchestration", tags: ["containers", "docker", "development", "kubernetes"] },
      { name: "Podman", description: "Daemonless, rootless container engine compatible with Docker CLI, focused on security and OCI compliance", website: "https://podman.io", category: "Container & Orchestration", tags: ["containers", "security", "rootless", "oci"] },
      { name: "Rancher Desktop", description: "Open-source desktop application for Kubernetes and container management with built-in container runtime", website: "https://rancherdesktop.io", category: "Container & Orchestration", tags: ["containers", "kubernetes", "desktop", "open-source"] },
      { name: "k9s", description: "Terminal-based Kubernetes cluster manager with real-time monitoring, resource navigation, and log streaming", website: "https://k9scli.io", category: "Container & Orchestration", tags: ["kubernetes", "terminal", "monitoring", "cli"] },
      { name: "Lens", description: "Full-featured Kubernetes IDE for managing clusters with real-time statistics, log streaming, and troubleshooting", website: "https://k8slens.dev", category: "Container & Orchestration", tags: ["kubernetes", "ide", "monitoring", "management"] },
      { name: "Okteto", description: "Development platform that makes Kubernetes accessible to developers with instant dev environments and hot reloading", website: "https://okteto.com", category: "Container & Orchestration", tags: ["kubernetes", "development", "cloud", "hot-reload"] },
    ],
    "Monitoring & Observability": [
      { name: "Grafana", description: "Open-source analytics and visualization platform for metrics, logs, and traces from multiple data sources", website: "https://grafana.com", category: "Monitoring & Observability", tags: ["monitoring", "visualization", "dashboards", "open-source"] },
      { name: "Prometheus", description: "Open-source monitoring and alerting system with powerful query language (PromQL) and time series database", website: "https://prometheus.io", category: "Monitoring & Observability", tags: ["monitoring", "metrics", "alerting", "time-series"] },
      { name: "Datadog", description: "Cloud-scale monitoring and security platform with APM, infrastructure monitoring, and log management", website: "https://datadoghq.com", category: "Monitoring & Observability", tags: ["monitoring", "apm", "cloud", "security"] },
      { name: "New Relic", description: "Full-stack observability platform with APM, infrastructure monitoring, error tracking, and AI-powered insights", website: "https://newrelic.com", category: "Monitoring & Observability", tags: ["monitoring", "apm", "observability", "ai"] },
      { name: "Sentry", description: "Application monitoring platform for error tracking, performance monitoring, and release health with source maps", website: "https://sentry.io", category: "Monitoring & Observability", tags: ["monitoring", "error-tracking", "performance", "debugging"] },
      { name: "OpenTelemetry", description: "Vendor-neutral observability framework for generating, collecting, and exporting telemetry data (traces, metrics, logs)", website: "https://opentelemetry.io", category: "Monitoring & Observability", tags: ["observability", "tracing", "metrics", "open-source"] },
    ],
    "Debugging & Testing": [
      { name: "Playwright", description: "Microsoft's end-to-end testing framework for web apps across Chromium, Firefox, and WebKit with auto-wait and codegen", website: "https://playwright.dev", category: "Debugging & Testing", tags: ["testing", "e2e", "browser", "microsoft"] },
      { name: "Cypress", description: "JavaScript end-to-end testing framework with time-travel debugging, real-time reloads, and visual dashboard", website: "https://cypress.io", category: "Debugging & Testing", tags: ["testing", "e2e", "javascript", "debugging"] },
      { name: "Puppeteer", description: "Node.js library for controlling headless Chrome/Chromium for browser automation, testing, and web scraping", website: "https://pptr.dev", category: "Debugging & Testing", tags: ["testing", "automation", "headless", "chrome"] },
      { name: "Selenium", description: "Widely-used browser automation framework supporting multiple languages and browsers for web application testing", website: "https://selenium.dev", category: "Debugging & Testing", tags: ["testing", "automation", "browser", "cross-platform"] },
      { name: "Chrome DevTools", description: "Built-in browser developer tools for debugging, profiling, network analysis, and performance optimization", website: "https://developer.chrome.com/docs/devtools", category: "Debugging & Testing", tags: ["debugging", "profiling", "browser", "chrome"] },
      { name: "React DevTools", description: "Browser extension for inspecting React component trees, props, state, hooks, and performance profiling", website: "https://react.dev/learn/react-developer-tools", category: "Debugging & Testing", tags: ["debugging", "react", "extension", "profiling"] },
    ],
    "Security & Secrets": [
      { name: "Infisical", description: "Open-source secret management platform for syncing environment variables and secrets across teams and infrastructure", website: "https://infisical.com", category: "Security & Secrets", tags: ["security", "secrets", "open-source", "infrastructure"] },
      { name: "Vault (HashiCorp)", description: "Enterprise secrets management tool for securely storing, accessing, and managing tokens, passwords, and certificates", website: "https://vaultproject.io", category: "Security & Secrets", tags: ["security", "secrets", "enterprise", "hashicorp"] },
      { name: "Snyk", description: "Developer security platform for finding and fixing vulnerabilities in code, dependencies, containers, and IaC", website: "https://snyk.io", category: "Security & Secrets", tags: ["security", "vulnerabilities", "dependencies", "devsecops"] },
      { name: "SonarQube", description: "Code quality and security analysis platform detecting bugs, vulnerabilities, and code smells across 30+ languages", website: "https://sonarqube.org", category: "Security & Secrets", tags: ["security", "code-quality", "analysis", "static-analysis"] },
      { name: "Trivy", description: "Comprehensive open-source security scanner for containers, filesystems, git repos, and Kubernetes clusters", website: "https://trivy.dev", category: "Security & Secrets", tags: ["security", "containers", "scanning", "open-source"] },
      { name: "Dependabot", description: "GitHub's automated dependency update tool that creates PRs for outdated or vulnerable packages", website: "https://github.com/dependabot", category: "Security & Secrets", tags: ["security", "dependencies", "automation", "github"] },
    ],
    "Collaboration & Documentation": [
      { name: "Notion", description: "All-in-one workspace combining notes, docs, project management, and wikis with AI-powered writing assistance", website: "https://notion.so", category: "Collaboration & Documentation", tags: ["documentation", "collaboration", "wiki", "project-management"] },
      { name: "Outline", description: "Open-source team knowledge base and wiki with real-time collaboration, Markdown support, and API access", website: "https://getoutline.com", category: "Collaboration & Documentation", tags: ["documentation", "wiki", "open-source", "collaboration"] },
      { name: "Slab", description: "Knowledge management platform designed for modern teams with unified search across all connected tools", website: "https://slab.com", category: "Collaboration & Documentation", tags: ["documentation", "knowledge-base", "search", "team"] },
      { name: "Swagger/OpenAPI", description: "Industry-standard specification and toolset for designing, building, documenting, and consuming RESTful APIs", website: "https://swagger.io", category: "Collaboration & Documentation", tags: ["api", "documentation", "specification", "rest"] },
      { name: "Stoplight", description: "API design and documentation platform with visual OpenAPI editor, mock servers, and style guides", website: "https://stoplight.io", category: "Collaboration & Documentation", tags: ["api", "documentation", "design", "openapi"] },
      { name: "ReadMe", description: "API documentation platform with interactive API explorer, changelogs, and developer hub customization", website: "https://readme.com", category: "Collaboration & Documentation", tags: ["api", "documentation", "developer-portal", "interactive"] },
    ],
    "Platform Engineering": [
      { name: "Backstage", description: "Spotify's open-source developer portal framework for building customized internal developer platforms with plugin ecosystem", website: "https://backstage.io", category: "Platform Engineering", tags: ["platform", "developer-portal", "spotify", "open-source"] },
      { name: "Port", description: "Internal developer portal for creating self-service experiences with software catalog and developer workflows", website: "https://getport.io", category: "Platform Engineering", tags: ["platform", "self-service", "catalog", "developer-experience"] },
      { name: "Cortex", description: "Internal developer portal focused on service quality with scorecards, ownership tracking, and initiative management", website: "https://cortex.io", category: "Platform Engineering", tags: ["platform", "service-quality", "scorecards", "ownership"] },
      { name: "Humanitec", description: "Platform orchestrator that standardizes app and infrastructure configurations for consistent self-service deployments", website: "https://humanitec.com", category: "Platform Engineering", tags: ["platform", "orchestration", "deployment", "self-service"] },
      { name: "Kratix", description: "Open-source framework for building internal platforms as-a-service, enabling teams to deliver anything-as-a-service on K8s", website: "https://kratix.io", category: "Platform Engineering", tags: ["platform", "kubernetes", "open-source", "framework"] },
    ],
    "Version Control & Git": [
      { name: "GitKraken", description: "Cross-platform Git client with visual commit graph, merge conflict editor, built-in code suggestions, and integrations", website: "https://gitkraken.com", category: "Version Control & Git", tags: ["git", "gui", "version-control", "cross-platform"] },
      { name: "Sublime Merge", description: "Lightning-fast Git client from the makers of Sublime Text with powerful search, blame, and diff capabilities", website: "https://sublimemerge.com", category: "Version Control & Git", tags: ["git", "gui", "performance", "diff"] },
      { name: "Fork", description: "Fast and friendly Git client for Mac and Windows with intuitive UI, interactive rebase, and image diff support", website: "https://git-fork.com", category: "Version Control & Git", tags: ["git", "gui", "mac", "windows"] },
      { name: "Tower", description: "Professional Git client with drag-and-drop functionality, interactive rebase, and pull request management", website: "https://git-tower.com", category: "Version Control & Git", tags: ["git", "gui", "professional", "pull-requests"] },
      { name: "SourceTree", description: "Free Atlassian Git GUI client for visualizing repositories with support for Git-flow and large file storage", website: "https://sourcetreeapp.com", category: "Version Control & Git", tags: ["git", "gui", "atlassian", "free"] },
    ],
    "Browser DevTools Extensions": [
      { name: "React Developer Tools", description: "Official React browser extension for inspecting component hierarchies, props, state, and hooks in real-time", website: "https://react.dev/learn/react-developer-tools", category: "Browser DevTools Extensions", tags: ["browser", "react", "extension", "debugging"] },
      { name: "Redux DevTools", description: "Browser extension for debugging Redux state changes with time-travel, action replay, and state diffing", website: "https://github.com/reduxjs/redux-devtools", category: "Browser DevTools Extensions", tags: ["browser", "redux", "extension", "state-management"] },
      { name: "Vue.js Devtools", description: "Official Vue.js browser extension for inspecting components, Vuex/Pinia store, routes, and performance timeline", website: "https://devtools.vuejs.org", category: "Browser DevTools Extensions", tags: ["browser", "vue", "extension", "debugging"] },
      { name: "Apollo Client Devtools", description: "Browser extension for debugging Apollo Client GraphQL cache, queries, mutations, and subscriptions", website: "https://apollographql.com/docs/react/development-testing/developer-tooling", category: "Browser DevTools Extensions", tags: ["browser", "graphql", "apollo", "extension"] },
      { name: "GraphQL Network", description: "Browser extension for inspecting GraphQL network requests with query/mutation visualization and response analysis", website: "https://github.com/nicolestandifer3/graphql-network-inspector", category: "Browser DevTools Extensions", tags: ["browser", "graphql", "network", "extension"] },
      { name: "Wappalyzer", description: "Browser extension that identifies web technologies, frameworks, CMS, analytics, and tools used on websites", website: "https://wappalyzer.com", category: "Browser DevTools Extensions", tags: ["browser", "technology-detection", "extension", "analysis"] },
    ],
  };

  if (category) {
    const key = Object.keys(directory).find(k => k.toLowerCase().includes(category.toLowerCase()));
    if (key) {
      return { categories: 1, total_tools: directory[key].length, tools: { [key]: directory[key] } };
    }
    return { categories: 0, total_tools: 0, tools: {}, error: `Category not found. Available: ${Object.keys(directory).join(", ")}` };
  }

  const totalTools = Object.values(directory).reduce((sum, tools) => sum + tools.length, 0);
  return { categories: Object.keys(directory).length, total_tools: totalTools, tools: directory };
}
