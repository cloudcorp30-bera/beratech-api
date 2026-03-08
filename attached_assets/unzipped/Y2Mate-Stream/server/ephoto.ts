import axios from "axios";
import FormData from "form-data";
import { uploadToCatbox } from "./catbox";

export interface EphotoEffect {
  slug: string;
  name: string;
  url: string;
  textInputs: number;
  description: string;
}

export interface EphotoResult {
  image_url: string;
  effect_name: string;
}

const _e = (b: string) => Buffer.from(b, "base64").toString();

const IMAGE_SERVER_FALLBACK = _e("aHR0cHM6Ly9lMS55b3Rvb2xzLm5ldA==");
const BASE_DOMAIN = _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29t");
const CREATE_ENDPOINT = _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2VmZmVjdC9jcmVhdGUtaW1hZ2U=");


const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const EFFECTS: EphotoEffect[] = [
  { slug: "neon", name: "Neon Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL25lb24tdGV4dC1lZmZlY3QtMTcxLmh0bWw="), textInputs: 1, description: "Neon text effect" },
  { slug: "naruto", name: "Naruto Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL25hcnV0by1zaGlwcHVkZW4tbG9nby1zdHlsZS10ZXh0LWVmZmVjdC1vbmxpbmUtODA4Lmh0bWw="), textInputs: 1, description: "Naruto shippuden logo style" },
  { slug: "neonLight", name: "Neon Light Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1uZW9uLWxpZ2h0LXRleHQtZWZmZWN0cy1vbmxpbmUtNzA2Lmh0bWw="), textInputs: 1, description: "Neon light text effects" },
  { slug: "graffiti", name: "Graffiti Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1ncmFmZml0aS10ZXh0LW9uLXdhbGwtNjE4Lmh0bWw="), textInputs: 1, description: "Graffiti text on wall" },
  { slug: "dragonBall", name: "Dragon Ball Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1kcmFnb24tYmFsbC1zdHlsZS10ZXh0LWVmZmVjdHMtb25saW5lLTgwOS5odG1s"), textInputs: 1, description: "Dragon Ball style text" },
  { slug: "3dComic", name: "3D Comic Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1vbmxpbmUtM2QtY29taWMtc3R5bGUtdGV4dC1lZmZlY3RzLTgxNy5odG1s"), textInputs: 1, description: "3D comic style text" },
  { slug: "glossySilver", name: "Glossy Silver 3D", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1nbG9zc3ktc2lsdmVyLTNkLXRleHQtZWZmZWN0LW9ubGluZS04MDIuaHRtbA=="), textInputs: 1, description: "Glossy silver 3D text" },
  { slug: "colorfulNeon", name: "Colorful Neon", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1jb2xvcmZ1bC1uZW9uLWxpZ2h0LXRleHQtZWZmZWN0cy1vbmxpbmUtNzk3Lmh0bWw="), textInputs: 1, description: "Colorful neon light text" },
  { slug: "wetGlass", name: "Wet Glass", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL3dyaXRlLXRleHQtb24td2V0LWdsYXNzLW9ubGluZS01ODkuaHRtbA=="), textInputs: 1, description: "Write text on wet glass" },
  { slug: "3dGradient", name: "3D Gradient Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS0zZC1ncmFkaWVudC10ZXh0LWVmZmVjdC1vbmxpbmUtNjg2Lmh0bWw="), textInputs: 1, description: "3D gradient text effect" },
  { slug: "pixelGlitch", name: "Pixel Glitch", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1waXhlbC1nbGl0Y2gtdGV4dC1lZmZlY3Qtb25saW5lLTc2OS5odG1s"), textInputs: 1, description: "Pixel glitch text effect" },
  { slug: "embroidery", name: "Embroidery Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1hLXJlYWxpc3RpYy1lbWJyb2lkZXJ5LXRleHQtZWZmZWN0LW9ubGluZS02NjIuaHRtbA=="), textInputs: 1, description: "Realistic embroidery text" },
  { slug: "watercolor", name: "Watercolor Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1hLXdhdGVyY29sb3ItdGV4dC1lZmZlY3Qtb25saW5lLTY1NS5odG1s"), textInputs: 1, description: "Watercolor text effect" },
  { slug: "3dBalloon", name: "3D Balloon Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2JlYXV0aWZ1bC0zZC1mb2lsLWJhbGxvb24tZWZmZWN0cy1mb3ItaG9saWRheXMtYW5kLWJpcnRoZGF5LTgwMy5odG1s"), textInputs: 1, description: "3D foil balloon effects" },
  { slug: "3dColorPaint", name: "3D Color Paint", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS0zZC1jb2xvcmZ1bC1wYWludC10ZXh0LWVmZmVjdC1vbmxpbmUtODAxLmh0bWw="), textInputs: 1, description: "3D colorful paint text" },
  { slug: "matrix", name: "Matrix Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL21hdHJpeC10ZXh0LWVmZmVjdC0xNTQuaHRtbA=="), textInputs: 1, description: "Matrix text effect" },
  { slug: "cloudSky", name: "Cloud Sky Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL3dyaXRlLXRleHQtZWZmZWN0LWNsb3Vkcy1pbi10aGUtc2t5LW9ubGluZS02MTkuaHRtbA=="), textInputs: 1, description: "Cloud text in the sky" },
  { slug: "goldPro", name: "Gold Text Pro", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2dvbGQtdGV4dC1lZmZlY3QtcHJvLTI3MS5odG1s"), textInputs: 1, description: "Gold text effect pro" },
  { slug: "luxuryGold", name: "Luxury Gold Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1hLWx1eHVyeS1nb2xkLXRleHQtZWZmZWN0LW9ubGluZS01OTQuaHRtbA=="), textInputs: 1, description: "Luxury gold text effect" },
  { slug: "3dCrack", name: "3D Crack Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS0zZC1jcmFjay10ZXh0LWVmZmVjdC1vbmxpbmUtNzA0Lmh0bWw="), textInputs: 1, description: "3D crack text effect" },
  { slug: "blackpink", name: "Blackpink Logo", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1ibGFja3BpbmstbG9nby1vbmxpbmUtZnJlZS02MDcuaHRtbA=="), textInputs: 1, description: "BLACKPINK logo" },
  { slug: "3dGradientLogo", name: "Gradient Logo 3D", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS0zZC1ncmFkaWVudC10ZXh0LWVmZmVjdC1vbmxpbmUtNjAwLmh0bWw="), textInputs: 1, description: "3D gradient logo" },
  { slug: "wingsLogo", name: "Wings Logo", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL3dpbmdzLXRleHQtZWZmZWN0LTE3Ni5odG1s"), textInputs: 1, description: "Wings text effect" },

  { slug: "deadpool", name: "Deadpool Logo", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS10ZXh0LWVmZmVjdHMtaW4tdGhlLXN0eWxlLW9mLXRoZS1kZWFkcG9vbC1sb2dvLTgxOC5odG1s"), textInputs: 2, description: "Deadpool logo style text" },
  { slug: "bornPink", name: "Born Pink Album", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1ibGFja3Bpbmstcy1ib3JuLXBpbmstYWxidW0tbG9nby1vbmxpbmUtNzc5Lmh0bWw="), textInputs: 2, description: "BLACKPINK Born Pink album logo" },
  { slug: "thor", name: "Thor Logo", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS10aG9yLWxvZ28tc3R5bGUtdGV4dC1lZmZlY3RzLW9ubGluZS1mb3ItZnJlZS03OTYuaHRtbA=="), textInputs: 2, description: "Thor logo style text" },
  { slug: "tiktok", name: "TikTok Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL3Rpay10b2stdGV4dC1lZmZlY3RzLW9ubGluZS1nZW5lcmF0b3ItNDg1Lmh0bWw="), textInputs: 2, description: "TikTok text effects" },
  { slug: "pornhub", name: "PornHub Logo", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1wb3JuaHViLXN0eWxlLWxvZ29zLW9ubGluZS1mcmVlLTU0OS5odG1s"), textInputs: 2, description: "PornHub style logo" },
  { slug: "avengers", name: "Avengers Logo", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1sb2dvLTNkLXN0eWxlLWF2ZW5nZXJzLW9ubGluZS00MjcuaHRtbA=="), textInputs: 2, description: "Avengers 3D style logo" },
  { slug: "wolfGalaxy", name: "Wolf Galaxy Logo", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1sb2dvLWF2YXRhci13b2xmLWdhbGF4eS1vbmxpbmUtMzY2Lmh0bWw="), textInputs: 2, description: "Wolf galaxy avatar logo" },
  { slug: "vintageLightBulb", name: "Vintage Light Bulb", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1yZWFsaXN0aWMtdmludGFnZS0zZC1saWdodC1idWxiLTYwOC5odG1s"), textInputs: 2, description: "Vintage 3D light bulb" },
  { slug: "graffitiWall", name: "Graffiti Wall", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1hLWdyYWZmaXRpLXRleHQtZWZmZWN0LW9uLXRoZS13YWxsLW9ubGluZS02NjUuaHRtbA=="), textInputs: 2, description: "Graffiti text on wall" },
  { slug: "graffitiGirl", name: "Graffiti Girl", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2N1dGUtZ2lybC1wYWludGluZy1ncmFmZml0aS10ZXh0LWVmZmVjdC02NjcuaHRtbA=="), textInputs: 2, description: "Cute girl painting graffiti" },
  { slug: "footballShirt", name: "Football Shirt", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1mb290YmFsbC1zaGlydC1tZXNzaS1iYXJjYS1vbmxpbmUtMjY4Lmh0bWw="), textInputs: 2, description: "Football shirt with name" },
  { slug: "3dWood", name: "3D Wood Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS0zZC13b29kLXRleHQtZWZmZWN0cy1vbmxpbmUtZnJlZS03MDUuaHRtbA=="), textInputs: 2, description: "3D wood text effects" },
  { slug: "3dStone", name: "3D Stone Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS0zZC1zdG9uZS10ZXh0LWVmZmVjdC1vbmxpbmUtNTA4Lmh0bWw="), textInputs: 2, description: "3D stone text effect" },
  { slug: "space3d", name: "Space 3D Text", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2xhdGVzdC1zcGFjZS0zZC10ZXh0LWVmZmVjdC1vbmxpbmUtNTU5Lmh0bWw="), textInputs: 2, description: "Space 3D text effect" },

  { slug: "sciFiLogo", name: "Sci-Fi Logo", url: _e("aHR0cHM6Ly9lbi5lcGhvdG8zNjAuY29tL2NyZWF0ZS1hLWF3ZXNvbWUtbG9nby1zY2ktZmktZWZmZWN0cy00OTIuaHRtbA=="), textInputs: 3, description: "Sci-fi effects logo" },
];

export function getAllEffects(): EphotoEffect[] {
  return EFFECTS;
}

export function getEffectBySlug(slug: string): EphotoEffect | undefined {
  return EFFECTS.find((e) => e.slug.toLowerCase() === slug.toLowerCase());
}

export function getEffectSlugs(): string[] {
  return EFFECTS.map((e) => e.slug);
}

function parseCookies(headers: any): string {
  const raw = headers["set-cookie"];
  if (!raw) return "";
  const arr = Array.isArray(raw) ? raw : [raw];
  const cookies: Record<string, string> = {};
  for (const line of arr) {
    const parts = line.split(";");
    if (parts[0]) {
      const [k, ...v] = parts[0].split("=");
      if (k && v.length) cookies[k.trim()] = v.join("=").trim();
    }
  }
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
}

function extractFormValue(html: string): string | null {
  const patterns = [
    /name="form_value_input"\s+value="(.+?)"/,
    /name='form_value_input'\s+value='(.+?)'/,
    /id="form_value_input"[^>]*value="(.+?)"/,
    /value="(.+?)"\s+name="form_value_input"/,
    /id="form_value_input"[^>]*value='(.+?)'/,
    /name="form_value_input"[^>]*value='(.+?)'/,
  ];
  for (const p of patterns) {
    const m = p.exec(html);
    if (m) return m[1];
  }
  const hiddenInputs = html.match(/<input[^>]*type=["']hidden["'][^>]*>/gi) || [];
  for (const inp of hiddenInputs) {
    if (inp.includes("form_value") || inp.includes("token_value")) {
      const valMatch = /value=["'](.+?)["']/.exec(inp);
      if (valMatch && valMatch[1].includes("&quot;")) return valMatch[1];
      if (valMatch && valMatch[1].startsWith("{")) return valMatch[1];
    }
  }
  return null;
}

async function generateEphotoImage(url: string, texts: string[]): Promise<string> {
  const headers: Record<string, string> = {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "User-Agent": UA,
    "Referer": BASE_DOMAIN + "/",
    "Origin": BASE_DOMAIN,
  };

  const res1 = await axios.get(url, { headers, timeout: 25000, maxRedirects: 5 });
  const html1: string = res1.data;
  const cookieStr = parseCookies(res1.headers);

  const tokenMatch = /name="token"\s*value="(.+?)"/.exec(html1) || /name="token"[^>]*value="(.+?)"/.exec(html1);
  if (!tokenMatch) throw new Error("Could not extract form token");

  const buildServerMatch = /name="build_server"\s*value="(.+?)"/.exec(html1) || /name="build_server"[^>]*value="(.+?)"/.exec(html1);
  const buildServerIdMatch = /name="build_server_id"\s*value="(.+?)"/.exec(html1) || /name="build_server_id"[^>]*value="(.+?)"/.exec(html1);

  const form = new FormData();
  for (const t of texts) {
    form.append("text[]", t);
  }
  form.append("submit", "GO");
  form.append("token", tokenMatch[1]);
  const buildServer = buildServerMatch?.[1] || IMAGE_SERVER_FALLBACK;
  form.append("build_server", buildServer);
  form.append("build_server_id", buildServerIdMatch?.[1] || "1");

  const res2 = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      cookie: cookieStr,
      "User-Agent": UA,
      "Referer": url,
      "Origin": BASE_DOMAIN,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 25000,
    maxRedirects: 5,
  });
  const html2: string = res2.data;

  const formValueRaw = extractFormValue(html2);
  if (!formValueRaw) throw new Error("Could not extract form_value_input");

  const tokenVal = formValueRaw.replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&amp;/g, '&');

  const cookieStr2 = parseCookies(res2.headers);
  const finalCookie = [cookieStr, cookieStr2].filter(Boolean).join("; ");

  let formData: Record<string, any>;
  try {
    formData = JSON.parse(tokenVal);
  } catch {
    throw new Error("Could not parse form value data");
  }

  const body = Object.keys(formData)
    .map((key) => {
      const vals = formData[key];
      const isArray = Array.isArray(vals);
      const keyEnc = encodeURIComponent(key + (isArray ? "[]" : ""));
      const valArr = isArray ? vals : [vals];
      return valArr.map((v: string) => `${keyEnc}=${encodeURIComponent(v)}`).join("&");
    })
    .join("&");

  const res3 = await axios.post(CREATE_ENDPOINT, body, {
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      cookie: finalCookie,
      "User-Agent": UA,
      "Referer": url,
      "Origin": BASE_DOMAIN,
      accept: "application/json, text/javascript, */*; q=0.01",
      "x-requested-with": "XMLHttpRequest",
    },
    timeout: 30000,
  });

  const data = res3.data;
  if (!data || !data.image) {
    throw new Error("Image generation failed - no image in response");
  }

  if (data.image.startsWith("http")) return data.image;
  return (buildServer || IMAGE_SERVER_FALLBACK) + data.image;
}

async function uploadToHost(imageBuffer: Buffer): Promise<string> {
  return uploadToCatbox(imageBuffer, "ephoto_" + Date.now() + ".jpg", "image/jpeg");
}

export async function createEphotoBySlug(
  slug: string,
  texts: string[]
): Promise<EphotoResult> {
  const effect = getEffectBySlug(slug);
  if (!effect) {
    throw new Error(`Unknown effect: ${slug}. Use /api/ephoto360/list to see available effects.`);
  }

  if (texts.length < effect.textInputs) {
    const needed = effect.textInputs === 1
      ? "text"
      : effect.textInputs === 2
        ? "text1 and text2"
        : "text1, text2 and text3";
    throw new Error(`This effect requires ${effect.textInputs} text input(s): ${needed}`);
  }

  const textArray = texts.slice(0, effect.textInputs);

  const imageUrl = await generateEphotoImage(effect.url, textArray);

  const imgResponse = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
    headers: { "User-Agent": UA },
  });

  const hostedUrl = await uploadToHost(Buffer.from(imgResponse.data));

  return {
    image_url: hostedUrl,
    effect_name: effect.slug,
  };
}
