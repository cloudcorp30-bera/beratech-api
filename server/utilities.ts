import axios from "axios";

const _e = (b: string) => Buffer.from(b, "base64").toString();

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const COINGECKO_API = _e("aHR0cHM6Ly9hcGkuY29pbmdlY2tvLmNvbS9hcGkvdjM=");
const EXCHANGE_API = _e("aHR0cHM6Ly9vcGVuLmVyLWFwaS5jb20vdjYvbGF0ZXN0");
const ISGD_API = _e("aHR0cHM6Ly9pcy5nZA==");
const RDAP_API = _e("aHR0cHM6Ly9yZGFwLm9yZw==");
const HN_API = _e("aHR0cHM6Ly9oYWNrZXItbmV3cy5maXJlYmFzZWlvLmNvbS92MA==");
const GITIGNORE_API = _e("aHR0cHM6Ly93d3cudG9wdGFsLmNvbS9kZXZlbG9wZXJzL2dpdGlnbm9yZS9hcGk=");

export async function getCryptoPrice(coin: string, currency: string = "usd"): Promise<{
  coin: string;
  symbol: string;
  price: number;
  currency: string;
  change_24h: number | null;
  market_cap: number | null;
  volume_24h: number | null;
}> {
  const cur = currency.toLowerCase();
  let coinId = coin.toLowerCase();
  let symbol = coinId;

  const priceRes = await axios.get(`${COINGECKO_API}/simple/price`, {
    params: {
      ids: coinId,
      vs_currencies: cur,
      include_24hr_change: true,
      include_market_cap: true,
      include_24hr_vol: true,
    },
    headers: { "User-Agent": USER_AGENT },
    timeout: 10000,
  }).catch(() => null);

  if (priceRes?.data && priceRes.data[coinId]) {
    const d = priceRes.data[coinId];
    return {
      coin: coinId,
      symbol,
      price: d[cur] ?? 0,
      currency: cur,
      change_24h: d[`${cur}_24h_change`] ?? null,
      market_cap: d[`${cur}_market_cap`] ?? null,
      volume_24h: d[`${cur}_24h_vol`] ?? null,
    };
  }

  const searchRes = await axios.get(`${COINGECKO_API}/search`, {
    params: { query: coin },
    headers: { "User-Agent": USER_AGENT },
    timeout: 10000,
  });

  const coins = searchRes.data?.coins;
  if (!coins || coins.length === 0) {
    throw new Error(`Cryptocurrency not found: ${coin}`);
  }

  const found = coins[0];
  coinId = found.id;
  symbol = found.symbol || coinId;

  const retryRes = await axios.get(`${COINGECKO_API}/simple/price`, {
    params: {
      ids: coinId,
      vs_currencies: cur,
      include_24hr_change: true,
      include_market_cap: true,
      include_24hr_vol: true,
    },
    headers: { "User-Agent": USER_AGENT },
    timeout: 10000,
  });

  const d = retryRes.data[coinId];
  if (!d) {
    throw new Error(`Price data not available for: ${coin}`);
  }

  return {
    coin: coinId,
    symbol,
    price: d[cur] ?? 0,
    currency: cur,
    change_24h: d[`${cur}_24h_change`] ?? null,
    market_cap: d[`${cur}_market_cap`] ?? null,
    volume_24h: d[`${cur}_24h_vol`] ?? null,
  };
}

export async function getCurrencyRate(from: string, to: string, amount: number = 1): Promise<{
  from: string;
  to: string;
  rate: number;
  amount: number;
  converted: number;
  last_updated: string;
}> {
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();

  const res = await axios.get(`${EXCHANGE_API}/${fromUpper}`, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 10000,
  });

  const data = res.data;
  if (data.result !== "success") {
    throw new Error(`Failed to fetch exchange rate for ${fromUpper}`);
  }

  const rate = data.rates?.[toUpper];
  if (rate === undefined) {
    throw new Error(`Currency not found: ${toUpper}`);
  }

  return {
    from: fromUpper,
    to: toUpper,
    rate,
    amount,
    converted: Number((amount * rate).toFixed(4)),
    last_updated: data.time_last_update_utc || new Date().toISOString(),
  };
}

export async function shortenUrl(url: string): Promise<{
  original_url: string;
  short_url: string;
  service: string;
}> {
  const res = await axios.get(`${ISGD_API}/create.php`, {
    params: { format: "json", url },
    headers: { "User-Agent": USER_AGENT },
    timeout: 10000,
  });

  if (res.data?.errorcode) {
    throw new Error(`URL shortening failed: ${res.data.errormessage || "Unknown error"}`);
  }

  if (!res.data?.shorturl) {
    throw new Error("URL shortening failed: No short URL returned");
  }

  return {
    original_url: url,
    short_url: res.data.shorturl,
    service: "is.gd",
  };
}

export async function whoisLookup(domain: string): Promise<{
  domain: string;
  registrar: string | null;
  status: string[];
  created: string | null;
  expires: string | null;
  updated: string | null;
  nameservers: string[];
}> {
  const res = await axios.get(`${RDAP_API}/domain/${encodeURIComponent(domain)}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rdap+json" },
    timeout: 15000,
  });

  const data = res.data;

  let registrar: string | null = null;
  if (data.entities) {
    for (const entity of data.entities) {
      if (entity.roles?.includes("registrar")) {
        registrar = entity.vcardArray?.[1]?.find((v: any) => v[0] === "fn")?.[3]
          || entity.publicIds?.[0]?.identifier
          || entity.handle
          || null;
        break;
      }
    }
  }

  const status: string[] = data.status || [];

  let created: string | null = null;
  let expires: string | null = null;
  let updated: string | null = null;

  if (data.events) {
    for (const event of data.events) {
      if (event.eventAction === "registration") created = event.eventDate || null;
      if (event.eventAction === "expiration") expires = event.eventDate || null;
      if (event.eventAction === "last changed") updated = event.eventDate || null;
    }
  }

  const nameservers: string[] = [];
  if (data.nameservers) {
    for (const ns of data.nameservers) {
      if (ns.ldhName) nameservers.push(ns.ldhName.toLowerCase());
    }
  }

  return {
    domain: data.ldhName || domain,
    registrar,
    status,
    created,
    expires,
    updated,
    nameservers,
  };
}

const COUNTRY_PREFIXES: Array<{ prefix: string; country: string; code: string }> = [
  { prefix: "+880", country: "Bangladesh", code: "BD" },
  { prefix: "+971", country: "UAE", code: "AE" },
  { prefix: "+966", country: "Saudi Arabia", code: "SA" },
  { prefix: "+358", country: "Finland", code: "FI" },
  { prefix: "+254", country: "Kenya", code: "KE" },
  { prefix: "+234", country: "Nigeria", code: "NG" },
  { prefix: "+212", country: "Morocco", code: "MA" },
  { prefix: "+91", country: "India", code: "IN" },
  { prefix: "+90", country: "Turkey", code: "TR" },
  { prefix: "+86", country: "China", code: "CN" },
  { prefix: "+84", country: "Vietnam", code: "VN" },
  { prefix: "+82", country: "South Korea", code: "KR" },
  { prefix: "+81", country: "Japan", code: "JP" },
  { prefix: "+66", country: "Thailand", code: "TH" },
  { prefix: "+63", country: "Philippines", code: "PH" },
  { prefix: "+62", country: "Indonesia", code: "ID" },
  { prefix: "+61", country: "Australia", code: "AU" },
  { prefix: "+60", country: "Malaysia", code: "MY" },
  { prefix: "+55", country: "Brazil", code: "BR" },
  { prefix: "+49", country: "Germany", code: "DE" },
  { prefix: "+48", country: "Poland", code: "PL" },
  { prefix: "+47", country: "Norway", code: "NO" },
  { prefix: "+46", country: "Sweden", code: "SE" },
  { prefix: "+45", country: "Denmark", code: "DK" },
  { prefix: "+44", country: "United Kingdom", code: "GB" },
  { prefix: "+39", country: "Italy", code: "IT" },
  { prefix: "+34", country: "Spain", code: "ES" },
  { prefix: "+33", country: "France", code: "FR" },
  { prefix: "+31", country: "Netherlands", code: "NL" },
  { prefix: "+27", country: "South Africa", code: "ZA" },
  { prefix: "+20", country: "Egypt", code: "EG" },
  { prefix: "+92", country: "Pakistan", code: "PK" },
  { prefix: "+7", country: "Russia", code: "RU" },
  { prefix: "+1", country: "US/CA", code: "US" },
];

export function validatePhone(phone: string, country_code?: string): {
  phone: string;
  formatted: string;
  is_valid: boolean;
  country: string | null;
  country_code: string | null;
  line_type: string;
  e164_format: string | null;
} {
  const cleaned = phone.replace(/[\s\-.\(\)]/g, "");

  const e164Regex = /^\+[1-9]\d{6,14}$/;
  const isValid = e164Regex.test(cleaned);

  let country: string | null = null;
  let detectedCode: string | null = null;

  if (cleaned.startsWith("+")) {
    for (const entry of COUNTRY_PREFIXES) {
      if (cleaned.startsWith(entry.prefix)) {
        country = entry.country;
        detectedCode = entry.code;
        break;
      }
    }
  }

  if (country_code) {
    const override = COUNTRY_PREFIXES.find(e => e.code.toUpperCase() === country_code.toUpperCase());
    if (override) {
      country = override.country;
      detectedCode = override.code;
    }
  }

  const digitsOnly = cleaned.replace(/\D/g, "");
  let lineType = "unknown";
  if (isValid) {
    if (digitsOnly.length >= 10 && digitsOnly.length <= 12) {
      lineType = "mobile";
    } else if (digitsOnly.length >= 7 && digitsOnly.length <= 9) {
      lineType = "landline";
    } else {
      lineType = "mobile";
    }
  }

  let formatted = cleaned;
  if (isValid && cleaned.startsWith("+1") && digitsOnly.length === 11) {
    const num = digitsOnly.slice(1);
    formatted = `+1 (${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
  } else if (isValid && cleaned.startsWith("+44") && digitsOnly.length >= 12) {
    const num = digitsOnly.slice(2);
    formatted = `+44 ${num.slice(0, 4)} ${num.slice(4)}`;
  } else if (isValid) {
    formatted = cleaned;
  }

  return {
    phone,
    formatted,
    is_valid: isValid,
    country,
    country_code: detectedCode,
    line_type: lineType,
    e164_format: isValid ? cleaned : null,
  };
}

export async function getTechNews(source: string = "hackernews", limit: number = 10): Promise<{
  source: string;
  count: number;
  articles: Array<{
    title: string;
    url: string | null;
    score: number;
    author: string;
    time: string;
    comments: number;
  }>;
}> {
  const count = Math.min(Math.max(1, limit), 30);

  const topRes = await axios.get(`${HN_API}/topstories.json`, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 10000,
  });

  const ids: number[] = topRes.data;
  if (!ids || ids.length === 0) {
    throw new Error("Failed to fetch top stories from Hacker News");
  }

  const storyIds = ids.slice(0, count);
  const storyPromises = storyIds.map((id) =>
    axios.get(`${HN_API}/item/${id}.json`, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    }).then((r) => r.data).catch(() => null)
  );

  const stories = await Promise.all(storyPromises);

  const articles = stories
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map((s) => ({
      title: s.title || "",
      url: s.url || null,
      score: s.score || 0,
      author: s.by || "",
      time: s.time ? new Date(s.time * 1000).toISOString() : "",
      comments: s.descendants || 0,
    }));

  return {
    source: "hackernews",
    count: articles.length,
    articles,
  };
}

export async function generateGitignore(templates: string): Promise<{
  templates: string[];
  content: string;
}> {
  const cleanTemplates = templates.split(",").map((t) => t.trim()).filter(Boolean).join(",");

  if (!cleanTemplates) {
    throw new Error("At least one template name is required (e.g., 'node,python,vscode')");
  }

  const res = await axios.get(`${GITIGNORE_API}/${cleanTemplates}`, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 10000,
  });

  return {
    templates: cleanTemplates.split(","),
    content: res.data,
  };
}

export async function getMetadata(url: string): Promise<{
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  type: string | null;
  site_name: string | null;
  favicon: string | null;
  twitter: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
  };
  all_meta: Record<string, string>;
}> {
  const targetUrl = url.startsWith("http") ? url : `https://${url}`;

  const res = await axios.get(targetUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    timeout: 15000,
    maxRedirects: 5,
    responseType: "text",
  });

  const html: string = res.data;

  const getMetaContent = (nameOrProp: string): string | null => {
    const pattern = new RegExp(
      `<meta[^>]*(?:name|property)\\s*=\\s*["']${nameOrProp}["'][^>]*content\\s*=\\s*["']([^"']*)["'][^>]*/?>` +
      `|<meta[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${nameOrProp}["'][^>]*/?>`,
      "i"
    );
    const match = pattern.exec(html);
    return match ? (match[1] || match[2] || null) : null;
  };

  const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  const ogTitle = getMetaContent("og:title");
  const title = ogTitle || (titleMatch ? titleMatch[1].trim() : null);

  const ogDesc = getMetaContent("og:description");
  const metaDesc = getMetaContent("description");
  const description = ogDesc || metaDesc || null;

  const image = getMetaContent("og:image") || null;
  const ogUrl = getMetaContent("og:url") || null;
  const type = getMetaContent("og:type") || null;
  const siteName = getMetaContent("og:site_name") || null;

  const canonicalMatch = /<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']*)["'][^>]*\/?>/i.exec(html);
  const faviconMatch = /<link[^>]*rel\s*=\s*["'](?:shortcut )?icon["'][^>]*href\s*=\s*["']([^"']*)["'][^>]*\/?>/i.exec(html)
    || /<link[^>]*href\s*=\s*["']([^"']*)["'][^>]*rel\s*=\s*["'](?:shortcut )?icon["'][^>]*\/?>/i.exec(html);

  let favicon: string | null = faviconMatch ? faviconMatch[1] : null;
  if (favicon && !favicon.startsWith("http")) {
    try {
      const base = new URL(targetUrl);
      favicon = new URL(favicon, base.origin).href;
    } catch {}
  }

  const twitterCard = getMetaContent("twitter:card");
  const twitterTitle = getMetaContent("twitter:title");
  const twitterDesc = getMetaContent("twitter:description");
  const twitterImage = getMetaContent("twitter:image");

  const allMeta: Record<string, string> = {};
  const metaRegex = /<meta[^>]*(?:name|property)\s*=\s*["']([^"']*)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*\/?>/gi;
  const metaRegex2 = /<meta[^>]*content\s*=\s*["']([^"']*)["'][^>]*(?:name|property)\s*=\s*["']([^"']*)["'][^>]*\/?>/gi;

  let metaMatch;
  while ((metaMatch = metaRegex.exec(html)) !== null) {
    allMeta[metaMatch[1]] = metaMatch[2];
  }
  while ((metaMatch = metaRegex2.exec(html)) !== null) {
    allMeta[metaMatch[2]] = metaMatch[1];
  }

  return {
    url: ogUrl || (canonicalMatch ? canonicalMatch[1] : targetUrl),
    title,
    description,
    image,
    type,
    site_name: siteName,
    favicon,
    twitter: {
      card: twitterCard || null,
      title: twitterTitle || null,
      description: twitterDesc || null,
      image: twitterImage || null,
    },
    all_meta: allMeta,
  };
}
