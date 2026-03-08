import axios from "axios";

const _e = (b: string) => Buffer.from(b, "base64").toString();

const IPAPI_BASE = _e("aHR0cDovL2lwLWFwaS5jb20vanNvbi8=");
const NOMINATIM_BASE = _e("aHR0cHM6Ly9ub21pbmF0aW0ub3BlbnN0cmVldG1hcC5vcmcvcmV2ZXJzZQ==");
const TIMEAPI_BASE = _e("aHR0cHM6Ly90aW1lYXBpLmlvL2FwaS9UaW1lL2N1cnJlbnQvY29vcmRpbmF0ZQ==");
const WTTR_BASE = _e("aHR0cHM6Ly93dHRyLmluLw==");

const USER_AGENT = "BeraAPI/1.0";

export interface GeolocationResult {
  ip: string;
  continent: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  zip: string;
  latitude: number;
  longitude: number;
  timezone: string;
  currency: string;
  isp: string;
  org: string;
  is_mobile: boolean;
  is_proxy: boolean;
  is_hosting: boolean;
}

export interface ReverseGeocodeResult {
  display_name: string;
  address: Record<string, string>;
  latitude: number;
  longitude: number;
}

export interface TimezoneResult {
  timezone: string;
  current_time: string;
  date: string;
  day_of_week: string;
  utc_offset: string;
  is_dst: boolean;
}

export interface DeviceInfoResult {
  browser: { name: string; version: string };
  os: { name: string; version: string };
  device: { type: string; brand?: string; model?: string };
  engine: string;
  is_bot: boolean;
  location?: GeolocationResult;
}

export interface UptimeResult {
  url: string;
  status: string;
  status_code: number;
  response_time_ms: number;
  headers: { server: string | null; content_type: string | null };
  is_up: boolean;
  ssl: boolean;
  checked_at: string;
}

export interface WeatherResult {
  location: string;
  temperature_c: number;
  temperature_f: number;
  feels_like_c: number;
  humidity: number;
  wind_speed_kmh: number;
  wind_direction: string;
  condition: string;
  description: string;
  visibility_km: number;
  pressure_mb: number;
  uv_index: number;
  forecast: Array<{ date: string; max_temp_c: number; min_temp_c: number; condition: string }>;
}

export async function getGeolocation(ip?: string): Promise<GeolocationResult> {
  const target = ip || "";
  const fields = "status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,mobile,proxy,hosting,query";
  const res = await axios.get(`${IPAPI_BASE}${encodeURIComponent(target)}?fields=${fields}`, {
    timeout: 10000,
    headers: { "User-Agent": USER_AGENT },
  });

  const d = res.data;
  if (d.status === "fail") {
    throw new Error(`Geolocation failed: ${d.message || "Unknown error"}`);
  }

  return {
    ip: d.query,
    continent: d.continent || "",
    country: d.country || "",
    country_code: d.countryCode || "",
    region: d.regionName || d.region || "",
    city: d.city || "",
    zip: d.zip || "",
    latitude: d.lat,
    longitude: d.lon,
    timezone: d.timezone || "",
    currency: d.currency || "",
    isp: d.isp || "",
    org: d.org || "",
    is_mobile: !!d.mobile,
    is_proxy: !!d.proxy,
    is_hosting: !!d.hosting,
  };
}

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  const res = await axios.get(NOMINATIM_BASE, {
    params: { format: "json", lat, lon, zoom: 18, addressdetails: 1 },
    timeout: 10000,
    headers: { "User-Agent": USER_AGENT },
  });

  const d = res.data;
  if (d.error) {
    throw new Error(`Reverse geocoding failed: ${d.error}`);
  }

  return {
    display_name: d.display_name || "",
    address: d.address || {},
    latitude: parseFloat(d.lat),
    longitude: parseFloat(d.lon),
  };
}

export async function getTimezone(lat: number, lon: number): Promise<TimezoneResult> {
  const res = await axios.get(TIMEAPI_BASE, {
    params: { latitude: lat, longitude: lon },
    timeout: 10000,
    headers: { "User-Agent": USER_AGENT },
  });

  const d = res.data;
  if (!d.timeZone) {
    throw new Error("Failed to retrieve timezone data");
  }

  return {
    timezone: d.timeZone,
    current_time: d.dateTime || d.time || "",
    date: d.date || "",
    day_of_week: d.dayOfWeek || "",
    utc_offset: d.utcOffset || d.gmtOffset?.toString() || "",
    is_dst: !!d.dstActive,
  };
}

export async function getDeviceInfo(userAgent: string, ip?: string): Promise<DeviceInfoResult> {
  let browserName = "Unknown", browserVersion = "";
  let osName = "Unknown", osVersion = "";
  let deviceType = "Desktop";
  let engine = "Unknown";
  let brand: string | undefined;
  let model: string | undefined;

  const edgeMatch = /Edg(?:e)?\/([\d.]+)/.exec(userAgent);
  const operaMatch = /(?:OPR|Opera)\/([\d.]+)/.exec(userAgent);
  const chromeMatch = /Chrome\/([\d.]+)/.exec(userAgent);
  const firefoxMatch = /Firefox\/([\d.]+)/.exec(userAgent);
  const safariMatch = /Version\/([\d.]+).*Safari/.exec(userAgent);
  const ieMatch = /(?:MSIE |Trident\/.*rv:)([\d.]+)/.exec(userAgent);

  if (edgeMatch) { browserName = "Edge"; browserVersion = edgeMatch[1]; }
  else if (operaMatch) { browserName = "Opera"; browserVersion = operaMatch[1]; }
  else if (chromeMatch) { browserName = "Chrome"; browserVersion = chromeMatch[1]; }
  else if (firefoxMatch) { browserName = "Firefox"; browserVersion = firefoxMatch[1]; }
  else if (safariMatch) { browserName = "Safari"; browserVersion = safariMatch[1]; }
  else if (ieMatch) { browserName = "Internet Explorer"; browserVersion = ieMatch[1]; }

  if (/Gecko\//.test(userAgent) && /Firefox/.test(userAgent)) engine = "Gecko";
  else if (/AppleWebKit\//.test(userAgent)) engine = "WebKit";
  else if (/Trident\//.test(userAgent)) engine = "Trident";
  else if (/Presto\//.test(userAgent)) engine = "Presto";
  if (/Chrome\//.test(userAgent) && /AppleWebKit\//.test(userAgent)) engine = "Blink";

  const androidMatch = /Android ([\d.]+)/.exec(userAgent);
  const iosMatch = /(?:iPhone|iPad|iPod).*OS ([\d_]+)/.exec(userAgent);
  const winMatch = /Windows NT ([\d.]+)/.exec(userAgent);
  const macMatch = /Mac OS X ([\d_.]+)/.exec(userAgent);

  if (androidMatch) {
    osName = "Android"; osVersion = androidMatch[1];
    const modelMatch = /;\s*([^;)]+)\s*Build/.exec(userAgent);
    if (modelMatch) model = modelMatch[1].trim();
  } else if (iosMatch) {
    osName = "iOS"; osVersion = iosMatch[1].replace(/_/g, ".");
    if (/iPhone/.test(userAgent)) { brand = "Apple"; model = "iPhone"; }
    else if (/iPad/.test(userAgent)) { brand = "Apple"; model = "iPad"; }
  } else if (winMatch) {
    osName = "Windows";
    const winVersions: Record<string, string> = {
      "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7", "6.0": "Vista", "5.1": "XP",
    };
    osVersion = winVersions[winMatch[1]] || winMatch[1];
  } else if (macMatch) {
    osName = "macOS"; osVersion = macMatch[1].replace(/_/g, ".");
    brand = "Apple";
  } else if (/Linux/.test(userAgent)) {
    osName = "Linux";
  } else if (/CrOS/.test(userAgent)) {
    osName = "Chrome OS";
  }

  const isBot = /bot|crawl|spider|scrape|slurp|mediapartners|facebookexternalhit|twitterbot|linkedinbot|bingbot|googlebot/i.test(userAgent);
  if (isBot) {
    deviceType = "Bot";
  } else if (/Tablet|iPad|PlayBook|Silk|Kindle/i.test(userAgent)) {
    deviceType = "Tablet";
  } else if (/Mobile|Android.*Mobile|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(userAgent)) {
    deviceType = "Mobile";
  }

  const result: DeviceInfoResult = {
    browser: { name: browserName, version: browserVersion },
    os: { name: osName, version: osVersion },
    device: { type: deviceType, ...(brand ? { brand } : {}), ...(model ? { model } : {}) },
    engine,
    is_bot: isBot,
  };

  if (ip) {
    try {
      result.location = await getGeolocation(ip);
    } catch {}
  }

  return result;
}

export async function checkUptime(url: string): Promise<UptimeResult> {
  const targetUrl = url.startsWith("http") ? url : `https://${url}`;
  const isSSL = targetUrl.startsWith("https");
  const start = Date.now();

  try {
    const res = await axios.head(targetUrl, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: { "User-Agent": USER_AGENT },
    });

    const responseTime = Date.now() - start;

    return {
      url: targetUrl,
      status: res.statusText || "Unknown",
      status_code: res.status,
      response_time_ms: responseTime,
      headers: {
        server: (res.headers["server"] as string) || null,
        content_type: (res.headers["content-type"] as string) || null,
      },
      is_up: res.status >= 200 && res.status < 400,
      ssl: isSSL,
      checked_at: new Date().toISOString(),
    };
  } catch (err: any) {
    const responseTime = Date.now() - start;
    return {
      url: targetUrl,
      status: err.code || "Error",
      status_code: 0,
      response_time_ms: responseTime,
      headers: { server: null, content_type: null },
      is_up: false,
      ssl: isSSL,
      checked_at: new Date().toISOString(),
    };
  }
}

export async function getWeather(location: string): Promise<WeatherResult> {
  const res = await axios.get(`${WTTR_BASE}${encodeURIComponent(location)}?format=j1`, {
    timeout: 10000,
    headers: { "User-Agent": USER_AGENT },
  });

  const d = res.data;
  if (!d.current_condition || !d.current_condition[0]) {
    throw new Error("Failed to retrieve weather data for: " + location);
  }

  const current = d.current_condition[0];
  const area = d.nearest_area?.[0];
  const locationName = area
    ? `${area.areaName?.[0]?.value || ""}, ${area.region?.[0]?.value || ""}, ${area.country?.[0]?.value || ""}`
    : location;

  const forecast = (d.weather || []).map((day: any) => ({
    date: day.date,
    max_temp_c: parseFloat(day.maxtempC),
    min_temp_c: parseFloat(day.mintempC),
    condition: day.hourly?.[4]?.weatherDesc?.[0]?.value || "",
  }));

  return {
    location: locationName,
    temperature_c: parseFloat(current.temp_C),
    temperature_f: parseFloat(current.temp_F),
    feels_like_c: parseFloat(current.FeelsLikeC),
    humidity: parseInt(current.humidity, 10),
    wind_speed_kmh: parseFloat(current.windspeedKmph),
    wind_direction: current.winddir16Point || "",
    condition: current.weatherDesc?.[0]?.value || "",
    description: current.weatherDesc?.[0]?.value || "",
    visibility_km: parseFloat(current.visibility),
    pressure_mb: parseFloat(current.pressure),
    uv_index: parseInt(current.uvIndex, 10),
    forecast,
  };
}
