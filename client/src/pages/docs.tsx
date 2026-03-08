import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Copy,
  ChevronDown,
  ChevronRight,
  Play,
  Loader2,
  X,
  Download,
  Search,
  Wrench,
  Sparkles,
  Code,
  Bot,
  MapPin,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Endpoint {
  method: string;
  path: string;
  description: string;
  category: string;
  params: Param[];
  example: string;
  response: string;
}

const endpoints: Endpoint[] = [
  {
    method: "GET", path: "/api/search/yts", description: "Search YouTube videos by query", category: "Search",
    params: [
      { name: "query", type: "string", required: true, description: "Search term" },
      { name: "limit", type: "number", required: false, description: "Max results (default: 10, max: 20)" },
    ],
    example: "/api/search/yts?query=Rick+Astley&limit=5",
    response: `{"status":200,"success":true,"creator":"beratech","results":[{"type":"video","videoId":"dQw4w9WgXcQ","url":"https://youtube.com/watch?v=...","title":"Rick Astley - Never Gonna...","thumbnail":"https://i.ytimg.com/vi/...","timestamp":"3:34","views":1743552410,"author":{"name":"Rick Astley"}}]}`,
  },
  {
    method: "GET", path: "/api/search/lyrics", description: "Search for song lyrics", category: "Search",
    params: [{ name: "query", type: "string", required: true, description: "Song name or artist" }],
    example: "/api/search/lyrics?query=Shape+of+You",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"artist":"Ed Sheeran","title":"Shape of You","image":"https://...","link":"https://...","lyrics":"The club isn't the best place..."}}`,
  },
  {
    method: "GET", path: "/api/search/wiki", description: "Search Wikipedia articles", category: "Search",
    params: [{ name: "query", type: "string", required: true, description: "Search term" }],
    example: "/api/search/wiki?query=Linux",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"title":"Linux","extract":"Linux is a group of open source...","thumbnail":"https://upload.wikimedia.org/...","url":"https://en.wikipedia.org/wiki/Linux"}}`,
  },
  {
    method: "GET", path: "/api/download/ytmp3", description: "Convert YouTube video to MP3", category: "Download",
    params: [
      { name: "url", type: "string", required: true, description: "YouTube video URL" },
      { name: "quality", type: "string", required: false, description: "128kbps, 192kbps, 256kbps, 320kbps (default: 128kbps)" },
    ],
    example: "/api/download/ytmp3?url=https://youtu.be/dQw4w9WgXcQ&quality=128kbps",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"youtube_id":"dQw4w9WgXcQ","title":"Rick Astley - Never Gonna Give You Up","quality":"128kbps","download_url":"https://your-domain/dl/cnv/mp3/..."}}`,
  },
  {
    method: "GET", path: "/api/download/ytmp4", description: "Convert YouTube video to MP4", category: "Download",
    params: [
      { name: "url", type: "string", required: true, description: "YouTube video URL" },
      { name: "quality", type: "string", required: false, description: "360p, 480p, 720p, 1080p (default: 360p)" },
    ],
    example: "/api/download/ytmp4?url=https://youtu.be/dQw4w9WgXcQ&quality=720p",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"youtube_id":"dQw4w9WgXcQ","title":"Rick Astley - Never Gonna Give You Up","quality":"720p","download_url":"https://your-domain/dl/cnv/mp4/..."}}`,
  },
  {
    method: "GET", path: "/api/download/tiktok", description: "Download TikTok video without watermark", category: "Download",
    params: [{ name: "url", type: "string", required: true, description: "TikTok video URL" }],
    example: "/api/download/tiktok?url=https://www.tiktok.com/@user/video/1234567890",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"id":"1234567890","title":"Video caption...","video":"https://...","music":"https://...","author":{"name":"Username"}}}`,
  },
  {
    method: "GET", path: "/api/tools/translate", description: "Translate text between languages", category: "Tools",
    params: [
      { name: "text", type: "string", required: true, description: "Text to translate" },
      { name: "to", type: "string", required: true, description: "Target language code (e.g. es, fr, de, ja)" },
      { name: "from", type: "string", required: false, description: "Source language code (default: en)" },
    ],
    example: "/api/tools/translate?text=Hello+world&to=es",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"original":"Hello world","translated":"Hola mundo","from":"en","to":"es"}}`,
  },
  {
    method: "GET", path: "/api/tools/github", description: "Look up GitHub user profile", category: "Tools",
    params: [{ name: "username", type: "string", required: true, description: "GitHub username" }],
    example: "/api/tools/github?username=torvalds",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"login":"torvalds","name":"Linus Torvalds","avatar":"https://...","public_repos":11,"followers":285741,"company":"Linux Foundation"}}`,
  },
  {
    method: "GET", path: "/api/tools/quote", description: "Get a random inspirational quote", category: "Tools",
    params: [],
    example: "/api/tools/quote",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"quote":"The only way to do great work...","author":"Steve Jobs","category":"inspirational"}}`,
  },
  {
    method: "GET", path: "/api/tools/screenshot", description: "Take a screenshot of any website", category: "Tools",
    params: [{ name: "url", type: "string", required: true, description: "Full website URL (e.g. https://google.com)" }],
    example: "/api/tools/screenshot?url=https://google.com",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"screenshot_url":"https://...","target_url":"https://google.com"}}`,
  },
  {
    method: "GET", path: "/api/ephoto360/list", description: "List all available effects grouped by text inputs", category: "EPhoto360",
    params: [],
    example: "/api/ephoto360/list",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"total_effects":60,"effects":{"single_text":[{"slug":"neon","name":"Neon Text",...}],"dual_text":[{"slug":"deadpool","name":"Deadpool Logo",...}],"triple_text":[{"slug":"wingsLogo","name":"Wings Logo",...}]}}}`,
  },
  {
    method: "GET", path: "/api/ephoto360/deadpool", description: "Deadpool logo style text (2 texts)", category: "EPhoto360",
    params: [
      { name: "text1", type: "string", required: true, description: "First text line" },
      { name: "text2", type: "string", required: true, description: "Second text line" },
    ],
    example: "/api/ephoto360/deadpool?text1=Bera&text2=Tech",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"effect":"Deadpool Logo","effect_slug":"deadpool","text_inputs":2,"image_url":"https://i.ibb.co/..."}}`,
  },
  {
    method: "GET", path: "/api/ephoto360/neon", description: "Neon text effect (1 text)", category: "EPhoto360",
    params: [
      { name: "text", type: "string", required: true, description: "Text to render" },
    ],
    example: "/api/ephoto360/neon?text=Hello",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"effect":"Neon Text","effect_slug":"neon","text_inputs":1,"image_url":"https://i.ibb.co/..."}}`,
  },
  {
    method: "GET", path: "/api/ephoto360/marvel", description: "Marvel style logo (2 texts)", category: "EPhoto360",
    params: [
      { name: "text1", type: "string", required: true, description: "First text line" },
      { name: "text2", type: "string", required: true, description: "Second text line" },
    ],
    example: "/api/ephoto360/marvel?text1=BERA&text2=API",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"effect":"Marvel Logo","effect_slug":"marvel","text_inputs":2,"image_url":"https://i.ibb.co/..."}}`,
  },
  {
    method: "GET", path: "/api/ephoto360/wingsLogo", description: "Wings text effect (3 texts)", category: "EPhoto360",
    params: [
      { name: "text1", type: "string", required: true, description: "First text" },
      { name: "text2", type: "string", required: true, description: "Second text" },
      { name: "text3", type: "string", required: true, description: "Third text" },
    ],
    example: "/api/ephoto360/wingsLogo?text1=Angel&text2=Wings&text3=Effect",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"effect":"Wings Logo","effect_slug":"wingsLogo","text_inputs":3,"image_url":"https://i.ibb.co/..."}}`,
  },
  {
    method: "GET", path: "/api/dev/hash", description: "Generate MD5, SHA1, SHA256, SHA512 hashes", category: "Developer",
    params: [
      { name: "text", type: "string", required: true, description: "Text to hash" },
      { name: "algorithm", type: "string", required: false, description: "md5, sha1, sha256, sha512, or all (default: all)" },
    ],
    example: "/api/dev/hash?text=hello+world",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"md5":"5eb63bbbe01eeed...","sha1":"2aae6c35c94fcfb...","sha256":"b94d27b9934d3e...","sha512":"309ecc489c12d6..."}}`,
  },
  {
    method: "GET", path: "/api/dev/base64/encode", description: "Encode text to Base64", category: "Developer",
    params: [{ name: "text", type: "string", required: true, description: "Text to encode" }],
    example: "/api/dev/base64/encode?text=Hello+World",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"encoded":"SGVsbG8gV29ybGQ=","original":"Hello World"}}`,
  },
  {
    method: "GET", path: "/api/dev/base64/decode", description: "Decode Base64 to text", category: "Developer",
    params: [{ name: "text", type: "string", required: true, description: "Base64 string to decode" }],
    example: "/api/dev/base64/decode?text=SGVsbG8gV29ybGQ=",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"decoded":"Hello World","original":"SGVsbG8gV29ybGQ="}}`,
  },
  {
    method: "GET", path: "/api/dev/uuid", description: "Generate random UUIDs", category: "Developer",
    params: [{ name: "count", type: "number", required: false, description: "Number of UUIDs (default: 1, max: 50)" }],
    example: "/api/dev/uuid?count=5",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"count":5,"uuids":["550e8400-e29b-41d4-a716-446655440000",...]}}`,
  },
  {
    method: "GET", path: "/api/dev/password", description: "Generate secure random passwords", category: "Developer",
    params: [
      { name: "length", type: "number", required: false, description: "Password length (default: 16, min: 8, max: 128)" },
      { name: "uppercase", type: "boolean", required: false, description: "Include uppercase (default: true)" },
      { name: "symbols", type: "boolean", required: false, description: "Include symbols (default: true)" },
    ],
    example: "/api/dev/password?length=24",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"password":"x9K#mP...","length":24,"strength":"very strong"}}`,
  },
  {
    method: "GET", path: "/api/dev/timestamp", description: "Convert between timestamps and dates", category: "Developer",
    params: [{ name: "input", type: "string", required: false, description: "Unix timestamp or ISO date (default: now)" }],
    example: "/api/dev/timestamp?input=1700000000",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"unix_seconds":1700000000,"iso8601":"2023-11-14T22:13:20.000Z","utc":"Tue, 14 Nov 2023 22:13:20 GMT","day_of_week":"Tuesday"}}`,
  },
  {
    method: "GET", path: "/api/dev/color", description: "Convert colors between hex, RGB, HSL, CMYK", category: "Developer",
    params: [{ name: "color", type: "string", required: true, description: "Color in hex (#FF5733), rgb(255,87,51)" }],
    example: "/api/dev/color?color=%23FF5733",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"hex":"#FF5733","rgb":{"r":255,"g":87,"b":51},"hsl":{"h":11,"s":100,"l":60},"cmyk":{"c":0,"m":66,"y":80,"k":0}}}`,
  },
  {
    method: "GET", path: "/api/dev/jwt", description: "Decode JWT tokens (header + payload)", category: "Developer",
    params: [{ name: "token", type: "string", required: true, description: "JWT token string" }],
    example: "/api/dev/jwt?token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.xxx",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"header":{"alg":"HS256"},"payload":{"sub":"1234567890"}}}`,
  },
  {
    method: "GET", path: "/api/dev/ip", description: "IP address geolocation lookup", category: "Developer",
    params: [{ name: "ip", type: "string", required: true, description: "IP address to look up" }],
    example: "/api/dev/ip?ip=8.8.8.8",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"ip":"8.8.8.8","city":"Mountain View","region":"California","country":"US","organization":"AS15169 Google LLC"}}`,
  },
  {
    method: "GET", path: "/api/dev/dns", description: "DNS records lookup (A, AAAA, MX, TXT, NS, CNAME)", category: "Developer",
    params: [{ name: "domain", type: "string", required: true, description: "Domain name" }],
    example: "/api/dev/dns?domain=google.com",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"domain":"google.com","A":["142.250.80.46"],"MX":[{"exchange":"smtp.google.com","priority":10}],"NS":["ns1.google.com",...]}}`,
  },
  {
    method: "GET", path: "/api/dev/headers", description: "Fetch HTTP response headers of any URL", category: "Developer",
    params: [{ name: "url", type: "string", required: true, description: "URL to fetch headers from" }],
    example: "/api/dev/headers?url=https://google.com",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"url":"https://google.com","status_code":200,"headers":{"content-type":"text/html",...}}}`,
  },
  {
    method: "GET", path: "/api/dev/qrcode", description: "Generate QR code image (permanent catbox URL)", category: "Developer",
    params: [
      { name: "text", type: "string", required: true, description: "Text or URL to encode" },
      { name: "size", type: "number", required: false, description: "Image size in px (default: 300, max: 1000)" },
    ],
    example: "/api/dev/qrcode?text=https://github.com&size=400",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"qr_url":"https://files.catbox.moe/...","text":"https://github.com","size":400}}`,
  },
  {
    method: "GET", path: "/api/dev/regex", description: "Test regex patterns against strings", category: "Developer",
    params: [
      { name: "pattern", type: "string", required: true, description: "Regex pattern" },
      { name: "flags", type: "string", required: false, description: "Regex flags (g, i, m)" },
      { name: "text", type: "string", required: true, description: "Test string" },
    ],
    example: "/api/dev/regex?pattern=%5Cd%2B&flags=g&text=abc+123+def+456",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"is_match":true,"match_count":2,"matches":[{"match":"123","index":4},{"match":"456","index":12}]}}`,
  },
  {
    method: "GET", path: "/api/dev/lorem", description: "Generate lorem ipsum placeholder text", category: "Developer",
    params: [
      { name: "count", type: "number", required: false, description: "Number of items (default: 3)" },
      { name: "type", type: "string", required: false, description: "paragraphs, sentences, or words" },
    ],
    example: "/api/dev/lorem?count=2&type=paragraphs",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"text":"Lorem ipsum dolor sit amet...","word_count":85}}`,
  },
  {
    method: "GET", path: "/api/dev/urlparse", description: "Parse and analyze URL components", category: "Developer",
    params: [{ name: "url", type: "string", required: true, description: "URL to parse" }],
    example: "/api/dev/urlparse?url=https://example.com/path?key=value%26foo=bar",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"protocol":"https:","hostname":"example.com","pathname":"/path","query_params":{"key":"value","foo":"bar"}}}`,
  },
  {
    method: "GET", path: "/api/dev/urlencode", description: "URL encode or decode strings", category: "Developer",
    params: [
      { name: "text", type: "string", required: true, description: "Text to encode/decode" },
      { name: "action", type: "string", required: false, description: "encode or decode (default: encode)" },
    ],
    example: "/api/dev/urlencode?text=hello+world%26foo&action=encode",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"result":"hello%20world%26foo","action":"encoded","original":"hello world&foo"}}`,
  },
  {
    method: "GET", path: "/api/dev/hmac", description: "Generate HMAC signatures", category: "Developer",
    params: [
      { name: "text", type: "string", required: true, description: "Message to sign" },
      { name: "secret", type: "string", required: true, description: "Secret key" },
      { name: "algorithm", type: "string", required: false, description: "md5, sha1, sha256, sha512 (default: sha256)" },
    ],
    example: "/api/dev/hmac?text=hello&secret=mysecret",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"hmac":"f7bc83f430538424...","algorithm":"sha256"}}`,
  },
  {
    method: "GET", path: "/api/dev/useragent", description: "Parse user agent strings into components", category: "Developer",
    params: [{ name: "ua", type: "string", required: false, description: "User agent (default: your current UA)" }],
    example: "/api/dev/useragent",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"browser":{"name":"Chrome","version":"120.0.0.0"},"os":{"name":"Windows","version":"10.0"},"device":"Desktop","is_bot":false}}`,
  },
  {
    method: "GET", path: "/api/dev/baseconvert", description: "Convert numbers between bases (bin/oct/dec/hex)", category: "Developer",
    params: [
      { name: "value", type: "string", required: true, description: "Number to convert" },
      { name: "from", type: "number", required: false, description: "Source base (default: 10)" },
      { name: "to", type: "number", required: false, description: "Target base (default: 16)" },
    ],
    example: "/api/dev/baseconvert?value=255&from=10&to=16",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"binary":"11111111","octal":"377","decimal":"255","hexadecimal":"FF"}}`,
  },
  {
    method: "GET", path: "/api/dev/textstats", description: "Analyze text statistics (words, reading time, etc.)", category: "Developer",
    params: [{ name: "text", type: "string", required: true, description: "Text to analyze" }],
    example: "/api/dev/textstats?text=The+quick+brown+fox+jumps+over+the+lazy+dog",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"characters":43,"words":9,"sentences":1,"reading_time":"1 min","top_words":[{"word":"the","count":2}]}}`,
  },
  {
    method: "GET", path: "/api/dev/json", description: "Validate, format and minify JSON", category: "Developer",
    params: [
      { name: "json", type: "string", required: true, description: "JSON string to validate" },
      { name: "format", type: "boolean", required: false, description: "Pretty format output (default: true)" },
    ],
    example: `/api/dev/json?json=${encodeURIComponent('{"name":"Bera","version":1}')}`,
    response: `{"status":200,"success":true,"creator":"beratech","result":{"valid":true,"formatted":"{\\n  \\"name\\": \\"Bera\\",\\n  \\"version\\": 1\\n}","size_bytes":24,"type":"object","keys":["name","version"]}}`,
  },
  {
    method: "GET", path: "/api/dev/slug", description: "Generate URL-friendly slugs from text", category: "Developer",
    params: [
      { name: "text", type: "string", required: true, description: "Text to convert to slug" },
      { name: "separator", type: "string", required: false, description: "Separator character (default: -)" },
    ],
    example: "/api/dev/slug?text=Hello+World+2025!",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"slug":"hello-world-2025","original":"Hello World 2025!"}}`,
  },
  {
    method: "GET", path: "/api/dev/httpstatus", description: "Look up HTTP status codes and descriptions", category: "Developer",
    params: [{ name: "code", type: "number", required: false, description: "Status code (omit to list all)" }],
    example: "/api/dev/httpstatus?code=404",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"code":404,"message":"Not Found","description":"The requested resource could not be found on the server.","category":"Client Error","found":true}}`,
  },
  {
    method: "GET", path: "/api/dev/case", description: "Convert strings between naming conventions", category: "Developer",
    params: [
      { name: "text", type: "string", required: true, description: "Text to convert" },
      { name: "to", type: "string", required: false, description: "camel, pascal, snake, kebab, constant, dot, title, upper, lower" },
    ],
    example: "/api/dev/case?text=hello_world_test&to=camel",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"result":"helloWorldTest","from_detected":"snake_case","to":"camel","original":"hello_world_test"}}`,
  },
  {
    method: "GET", path: "/api/dev/ipvalidate", description: "Validate and classify IP addresses", category: "Developer",
    params: [{ name: "ip", type: "string", required: true, description: "IP address to validate" }],
    example: "/api/dev/ipvalidate?ip=192.168.1.1",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"ip":"192.168.1.1","valid":true,"version":4,"type":"Private (Class C)","class":"Class C","binary":"11000000.10101000.00000001.00000001"}}`,
  },
  {
    method: "GET", path: "/api/dev/bytes", description: "Convert between byte units (B, KB, MB, GB, TB, PB)", category: "Developer",
    params: [
      { name: "value", type: "number", required: true, description: "Numeric value to convert" },
      { name: "from", type: "string", required: false, description: "Source unit: B, KB, MB, GB, TB (default: B)" },
      { name: "to", type: "string", required: false, description: "Target unit (optional, shows all if omitted)" },
    ],
    example: "/api/dev/bytes?value=1536&from=MB&to=GB",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"input":{"value":1536,"unit":"MB"},"bytes":1610612736,"conversions":{"B":1610612736,"KB":1572864,"MB":1536,"GB":1.5},"converted":{"value":1.5,"unit":"GB"}}}`,
  },
  {
    method: "GET", path: "/api/dev/email", description: "Validate email addresses with MX record checks", category: "Developer",
    params: [{ name: "email", type: "string", required: true, description: "Email address to validate" }],
    example: "/api/dev/email?email=test@gmail.com",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"email":"test@gmail.com","valid_format":true,"domain":"gmail.com","is_free_provider":true,"has_mx":true,"mx_records":[{"exchange":"gmail-smtp-in.l.google.com","priority":5}]}}`,
  },
  {
    method: "GET", path: "/api/dev/htmlentities", description: "Encode/decode HTML entities", category: "Developer",
    params: [
      { name: "text", type: "string", required: true, description: "Text to encode or decode" },
      { name: "action", type: "string", required: false, description: "encode or decode (default: encode)" },
    ],
    example: `/api/dev/htmlentities?text=${encodeURIComponent('<p>Hello & "World"</p>')}&action=encode`,
    response: `{"status":200,"success":true,"creator":"beratech","result":{"result":"&lt;p&gt;Hello &amp; &quot;World&quot;&lt;/p&gt;","action":"encoded","original":"<p>Hello & \\"World\\"</p>"}}`,
  },
  {
    method: "GET", path: "/api/dev/morse", description: "Convert text to/from Morse code", category: "Developer",
    params: [
      { name: "text", type: "string", required: true, description: "Text or Morse code" },
      { name: "action", type: "string", required: false, description: "encode or decode (default: encode)" },
    ],
    example: "/api/dev/morse?text=HELLO&action=encode",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"result":".... . .-.. .-.. ---","action":"encoded","original":"HELLO"}}`,
  },
  {
    method: "GET", path: "/api/dev/randomdata", description: "Generate realistic fake user data", category: "Developer",
    params: [{ name: "count", type: "number", required: false, description: "Number of users (default: 1, max: 50)" }],
    example: "/api/dev/randomdata?count=2",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"count":2,"data":[{"id":"uuid...","name":"Emma Johnson","email":"emmajohnson42@gmail.com","phone":"+1-555-123-4567","address":{"city":"New York"},"job_title":"Software Engineer"}]}}`,
  },
  {
    method: "GET", path: "/api/dev/diff", description: "Compare two texts and show differences", category: "Developer",
    params: [
      { name: "text1", type: "string", required: true, description: "First text" },
      { name: "text2", type: "string", required: true, description: "Second text" },
    ],
    example: "/api/dev/diff?text1=hello+world&text2=hello+earth",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"identical":false,"total_changes":2,"lines_added":1,"lines_removed":1,"changes":[{"type":"removed","line_number":1,"content":"hello world"},{"type":"added","line_number":1,"content":"hello earth"}]}}`,
  },
  {
    method: "GET", path: "/api/dev/cron", description: "Parse cron expressions to human-readable format", category: "Developer",
    params: [{ name: "expression", type: "string", required: true, description: "Cron expression (e.g. */5 * * * *)" }],
    example: `/api/dev/cron?expression=${encodeURIComponent("0 9 * * 1")}`,
    response: `{"status":200,"success":true,"creator":"beratech","result":{"expression":"0 9 * * 1","fields":{"minute":"0","hour":"9","day_of_month":"*","month":"*","day_of_week":"1"},"description":"at minute 0, at hour 9, on Monday","is_valid":true}}`,
  },
  {
    method: "GET", path: "/api/dev/ssl", description: "Check SSL certificate details for any domain", category: "Developer",
    params: [{ name: "domain", type: "string", required: true, description: "Domain to check" }],
    example: "/api/dev/ssl?domain=google.com",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"domain":"google.com","ssl_enabled":true,"issuer":{"O":"Google Trust Services"},"valid_to":"2025-03-15T...","days_remaining":90,"is_expired":false,"protocol":"TLSv1.3"}}`,
  },
  {
    method: "GET", path: "/api/dev/markdown", description: "Convert Markdown text to HTML", category: "Developer",
    params: [{ name: "text", type: "string", required: true, description: "Markdown text to convert" }],
    example: `/api/dev/markdown?text=${encodeURIComponent("# Hello **World**")}`,
    response: `{"status":200,"success":true,"creator":"beratech","result":{"html":"<h1>Hello <strong>World</strong></h1>","original":"# Hello **World**"}}`,
  },
  {
    method: "GET", path: "/api/dev/csv2json", description: "Convert CSV data to JSON", category: "Developer",
    params: [
      { name: "csv", type: "string", required: true, description: "CSV string with header row" },
      { name: "delimiter", type: "string", required: false, description: "Column delimiter (default: ,)" },
    ],
    example: `/api/dev/csv2json?csv=${encodeURIComponent("name,age\nAlice,30\nBob,25")}`,
    response: `{"status":200,"success":true,"creator":"beratech","result":{"headers":["name","age"],"rows":2,"columns":2,"data":[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]}}`,
  },
  {
    method: "GET", path: "/api/dev/jwt/generate", description: "Generate JWT tokens with HS256 signing", category: "Developer",
    params: [
      { name: "payload", type: "string", required: true, description: "JSON payload string" },
      { name: "secret", type: "string", required: true, description: "Signing secret key" },
      { name: "expiresIn", type: "number", required: false, description: "Expiry in seconds" },
    ],
    example: `/api/dev/jwt/generate?payload=${encodeURIComponent('{"sub":"user123"}')}&secret=mysecret&expiresIn=3600`,
    response: `{"status":200,"success":true,"creator":"beratech","result":{"token":"eyJhbGciOiJIUzI1NiJ9...","decoded":{"header":{"alg":"HS256","typ":"JWT"},"payload":{"sub":"user123","iat":1700000000,"exp":1700003600}}}}`,
  },
  {
    method: "GET", path: "/api/dev/cidr", description: "Calculate CIDR subnet details", category: "Developer",
    params: [{ name: "cidr", type: "string", required: true, description: "CIDR notation (e.g. 192.168.1.0/24)" }],
    example: "/api/dev/cidr?cidr=192.168.1.0/24",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"cidr":"192.168.1.0/24","network_address":"192.168.1.0","broadcast_address":"192.168.1.255","subnet_mask":"255.255.255.0","first_host":"192.168.1.1","last_host":"192.168.1.254","total_hosts":254}}`,
  },
  {
    method: "GET", path: "/api/dev/directory", description: "Browse 75+ curated developer tools across 14 categories including AI editors, coding agents, API tools, databases, DevOps, containers, monitoring, security, and more.", category: "Developer",
    params: [
      { name: "category", type: "string", required: false, description: "Filter by category name (e.g. 'AI', 'Database', 'Security'). Leave empty for all." },
    ],
    example: "/api/dev/directory?category=AI",
    response: '{\n  "categories": 1,\n  "total_tools": 5,\n  "tools": {\n    "AI-Native Editors & IDEs": [\n      {\n        "name": "Cursor",\n        "description": "AI-first code editor...",\n        "website": "https://cursor.sh",\n        "tags": ["ai", "editor", "ide"]\n      }\n    ]\n  }\n}',
  },
  {
    method: "GET", path: "/api/ai/chat", description: "Ask AI anything. Powered by GPT for general conversation, questions, and assistance.", category: "AI",
    params: [
      { name: "prompt", type: "string", required: true, description: "Your message or question" },
      { name: "system", type: "string", required: false, description: "Custom system prompt to set AI behavior" },
    ],
    example: "/api/ai/chat?prompt=What is Node.js?",
    response: '{\n  "response": "Node.js is a JavaScript runtime built on Chrome\'s V8 engine...",\n  "model": "gpt-4o-mini",\n  "usage": { "prompt_tokens": 12, "completion_tokens": 150, "total_tokens": 162 }\n}',
  },
  {
    method: "GET", path: "/api/ai/summarize", description: "Summarize any text using AI. Returns a concise summary with compression statistics.", category: "AI",
    params: [
      { name: "text", type: "string", required: true, description: "The text to summarize" },
      { name: "maxLength", type: "number", required: false, description: "Maximum word count for the summary" },
    ],
    example: "/api/ai/summarize?text=Long article text here...&maxLength=50",
    response: '{\n  "summary": "Concise summary of the text...",\n  "original_length": 1500,\n  "summary_length": 200,\n  "compression_ratio": "86.7%",\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/codegen", description: "Generate code from natural language descriptions. Returns code with explanation.", category: "AI",
    params: [
      { name: "prompt", type: "string", required: true, description: "Describe what code to generate" },
      { name: "language", type: "string", required: false, description: "Target programming language (e.g. python, javascript)" },
    ],
    example: "/api/ai/codegen?prompt=fibonacci function&language=python",
    response: '{\n  "code": "def fibonacci(n):\\n    ...",\n  "language": "python",\n  "explanation": "Generates the nth Fibonacci number...",\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/translate", description: "AI-powered translation with context awareness and natural phrasing.", category: "AI",
    params: [
      { name: "text", type: "string", required: true, description: "Text to translate" },
      { name: "to", type: "string", required: true, description: "Target language (e.g. Spanish, French, Japanese)" },
      { name: "from", type: "string", required: false, description: "Source language (auto-detected if omitted)" },
    ],
    example: "/api/ai/translate?text=Hello world&to=Spanish",
    response: '{\n  "translated_text": "Hola mundo",\n  "source_language": "auto-detected",\n  "target_language": "Spanish",\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/analyze", description: "Analyze text for sentiment, grammar, keywords, readability, or general analysis.", category: "AI",
    params: [
      { name: "text", type: "string", required: true, description: "Text to analyze" },
      { name: "type", type: "string", required: false, description: "Analysis type: sentiment, grammar, keywords, readability, general (default)" },
    ],
    example: "/api/ai/analyze?text=I love programming!&type=sentiment",
    response: '{\n  "analysis": {\n    "sentiment": "positive",\n    "confidence": 0.95,\n    "emotions": [{"emotion": "joy", "score": 0.9}],\n    "tone": "enthusiastic"\n  },\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/imagine", description: "Generate images from text descriptions using AI. Images are permanently hosted on catbox.moe.", category: "AI",
    params: [
      { name: "prompt", type: "string", required: true, description: "Description of the image to generate" },
      { name: "size", type: "string", required: false, description: "Image size: 1024x1024 (default), 512x512, 256x256" },
    ],
    example: "/api/ai/imagine?prompt=a sunset over mountains",
    response: '{\n  "image_url": "https://files.catbox.moe/abc123.png",\n  "prompt": "a sunset over mountains",\n  "size": "1024x1024",\n  "model": "gpt-image-1"\n}',
  },
  {
    method: "GET", path: "/api/ai/explain", description: "Get AI-powered explanations of code snippets with line-by-line breakdown.", category: "AI",
    params: [
      { name: "code", type: "string", required: true, description: "The code snippet to explain" },
      { name: "language", type: "string", required: false, description: "Programming language (auto-detected if omitted)" },
    ],
    example: "/api/ai/explain?code=const x = arr.map(i => i*2)",
    response: '{\n  "explanation": "This code doubles each element in an array...",\n  "language": "javascript",\n  "complexity": "simple",\n  "line_by_line": [{"line": 1, "code": "const x = arr.map(i => i*2)", "explanation": "Maps each element..."}],\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/debug", description: "Debug code to find bugs, issues, and suggest fixes with severity ratings.", category: "AI",
    params: [
      { name: "code", type: "string", required: true, description: "The code to debug" },
      { name: "error", type: "string", required: false, description: "Error message if known" },
      { name: "language", type: "string", required: false, description: "Programming language" },
    ],
    example: "/api/ai/debug?code=for(i=0;i<10;i++){console.log(i)}&language=javascript",
    response: '{\n  "bugs": [{"line": 1, "issue": "Missing variable declaration", "severity": "error", "fix": "Add let/const/var before i"}],\n  "fixed_code": "for(let i=0;i<10;i++){console.log(i)}",\n  "summary": "Found 1 issue",\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/review", description: "Get an AI code review with quality score, issues, and improvement suggestions.", category: "AI",
    params: [
      { name: "code", type: "string", required: true, description: "Code to review" },
      { name: "language", type: "string", required: false, description: "Programming language" },
    ],
    example: "/api/ai/review?code=function add(a,b){return a+b}",
    response: '{\n  "score": 75,\n  "grade": "C",\n  "issues": [{"type": "style", "severity": "minor", "description": "Missing type annotations"}],\n  "strengths": ["Clear function name"],\n  "improvements": ["Add JSDoc"],\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/commit", description: "Generate professional git commit messages from code diffs.", category: "AI",
    params: [
      { name: "diff", type: "string", required: true, description: "Git diff or changes description" },
      { name: "style", type: "string", required: false, description: "Style: conventional, simple, detailed" },
    ],
    example: "/api/ai/commit?diff=added login form with validation&style=conventional",
    response: '{\n  "message": "feat(auth): add login form with input validation",\n  "type": "feat",\n  "scope": "auth",\n  "description": "add login form with input validation",\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/unittest", description: "Auto-generate unit tests for your code.", category: "AI",
    params: [
      { name: "code", type: "string", required: true, description: "Code to generate tests for" },
      { name: "language", type: "string", required: false, description: "Programming language" },
      { name: "framework", type: "string", required: false, description: "Test framework (jest, pytest, etc.)" },
    ],
    example: "/api/ai/unittest?code=function add(a,b){return a+b}&framework=jest",
    response: '{\n  "tests": "describe(\"add\", () => {\\n  test(\"adds two numbers\", () => {\\n    expect(add(1, 2)).toBe(3);\\n  });\\n});",\n  "language": "javascript",\n  "framework": "jest",\n  "test_count": 3,\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/sql", description: "Convert natural language descriptions to SQL queries.", category: "AI",
    params: [
      { name: "prompt", type: "string", required: true, description: "Describe what you want to query" },
      { name: "dialect", type: "string", required: false, description: "SQL dialect: postgresql, mysql, sqlite" },
      { name: "schema", type: "string", required: false, description: "Table schema for context" },
    ],
    example: "/api/ai/sql?prompt=get all users older than 18&dialect=postgresql",
    response: '{\n  "sql": "SELECT * FROM users WHERE age > 18;",\n  "dialect": "postgresql",\n  "explanation": "Selects all columns from users table where age exceeds 18",\n  "tables_referenced": ["users"],\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/regex", description: "Generate regex patterns from plain English descriptions.", category: "AI",
    params: [
      { name: "description", type: "string", required: true, description: "Describe the pattern to match" },
      { name: "flavor", type: "string", required: false, description: "Regex flavor: javascript, python, pcre" },
    ],
    example: "/api/ai/regex?description=match email addresses",
    response: '{\n  "regex": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}",\n  "flags": "gi",\n  "explanation": "Matches standard email addresses",\n  "examples": {"match": ["test@email.com"], "no_match": ["not-email"]},\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/docstring", description: "Auto-generate documentation and docstrings for code functions.", category: "AI",
    params: [
      { name: "code", type: "string", required: true, description: "Code to document" },
      { name: "language", type: "string", required: false, description: "Programming language" },
      { name: "style", type: "string", required: false, description: "Doc style: jsdoc, google, numpy, sphinx" },
    ],
    example: "/api/ai/docstring?code=function add(a,b){return a+b}&style=jsdoc",
    response: '{\n  "documented_code": "/**\\n * Adds two numbers.\\n * @param {number} a\\n * @param {number} b\\n * @returns {number}\\n */\\nfunction add(a,b){return a+b}",\n  "docstrings": [{"function_name": "add", "docstring": "Adds two numbers together"}],\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/refactor", description: "AI-powered code refactoring with tracked changes.", category: "AI",
    params: [
      { name: "code", type: "string", required: true, description: "Code to refactor" },
      { name: "language", type: "string", required: false, description: "Programming language" },
      { name: "goal", type: "string", required: false, description: "Goal: performance, readability, dry, modern" },
    ],
    example: "/api/ai/refactor?code=var x=1;var y=2;var z=x+y&goal=modern",
    response: '{\n  "refactored_code": "const x = 1;\\nconst y = 2;\\nconst z = x + y;",\n  "changes": [{"description": "Use const instead of var", "before": "var", "after": "const"}],\n  "improvements": ["Modern variable declarations"],\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/complexity", description: "Analyze code complexity including time/space/cyclomatic complexity.", category: "AI",
    params: [
      { name: "code", type: "string", required: true, description: "Code to analyze" },
      { name: "language", type: "string", required: false, description: "Programming language" },
    ],
    example: "/api/ai/complexity?code=function sort(arr){return arr.sort((a,b)=>a-b)}",
    response: '{\n  "overall_complexity": "low",\n  "time_complexity": "O(n log n)",\n  "space_complexity": "O(1)",\n  "cyclomatic_complexity": 1,\n  "suggestions": ["Consider stable sort for objects"],\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/ai/tts", description: "Convert text to natural-sounding speech. Audio permanently hosted on catbox.moe.", category: "AI",
    params: [
      { name: "text", type: "string", required: true, description: "Text to convert to speech" },
      { name: "voice", type: "string", required: false, description: "Voice: alloy, echo, fable, onyx, nova, shimmer" },
      { name: "speed", type: "number", required: false, description: "Speed: 0.25 to 4.0 (default 1.0)" },
    ],
    example: "/api/ai/tts?text=Hello, welcome to Bera API&voice=nova",
    response: '{\n  "audio_url": "https://files.catbox.moe/abc123.mp3",\n  "text": "Hello, welcome to Bera API",\n  "voice": "nova",\n  "speed": 1.0,\n  "model": "gpt-4o-mini-tts"\n}',
  },
  {
    method: "GET", path: "/api/ai/voicetranslate", description: "Translate text and generate speech in the target language. Audio hosted on catbox.moe.", category: "AI",
    params: [
      { name: "text", type: "string", required: true, description: "Text to translate and speak" },
      { name: "to", type: "string", required: true, description: "Target language (e.g. Spanish, French)" },
      { name: "voice", type: "string", required: false, description: "Voice: alloy, echo, fable, onyx, nova, shimmer" },
      { name: "from", type: "string", required: false, description: "Source language (auto-detected if omitted)" },
    ],
    example: "/api/ai/voicetranslate?text=Hello world&to=Japanese&voice=nova",
    response: '{\n  "translated_text": "こんにちは世界",\n  "source_language": "auto-detected",\n  "target_language": "Japanese",\n  "audio_url": "https://files.catbox.moe/xyz789.mp3",\n  "voice": "nova",\n  "model": "gpt-4o-mini"\n}',
  },
  {
    method: "GET", path: "/api/location/geoip", description: "Look up geographic location, ISP, and network info for any IP address.", category: "Location",
    params: [{ name: "ip", type: "string", required: false, description: "IP address (leave empty for your own IP)" }],
    example: "/api/location/geoip?ip=8.8.8.8",
    response: '{\n  "ip": "8.8.8.8",\n  "country": "United States",\n  "city": "Mountain View",\n  "latitude": 37.386,\n  "longitude": -122.0838,\n  "timezone": "America/Los_Angeles",\n  "isp": "Google LLC"\n}',
  },
  {
    method: "GET", path: "/api/location/reverse", description: "Convert coordinates to a human-readable address.", category: "Location",
    params: [
      { name: "lat", type: "number", required: true, description: "Latitude" },
      { name: "lon", type: "number", required: true, description: "Longitude" },
    ],
    example: "/api/location/reverse?lat=40.7128&lon=-74.0060",
    response: '{\n  "display_name": "New York City, New York, USA",\n  "address": {"city": "New York", "state": "New York", "country": "United States"}\n}',
  },
  {
    method: "GET", path: "/api/location/timezone", description: "Get timezone and current local time for any coordinates.", category: "Location",
    params: [
      { name: "lat", type: "number", required: true, description: "Latitude" },
      { name: "lon", type: "number", required: true, description: "Longitude" },
    ],
    example: "/api/location/timezone?lat=48.8566&lon=2.3522",
    response: '{\n  "timezone": "Europe/Paris",\n  "current_time": "2025-02-19T14:30:00",\n  "utc_offset": "+01:00",\n  "is_dst": false\n}',
  },
  {
    method: "GET", path: "/api/location/device", description: "Detect browser, OS, device type, and location from user agent and IP.", category: "Location",
    params: [
      { name: "ua", type: "string", required: false, description: "User agent string (uses yours if empty)" },
      { name: "ip", type: "string", required: false, description: "IP address for location data" },
    ],
    example: "/api/location/device",
    response: '{\n  "browser": {"name": "Chrome", "version": "120"},\n  "os": {"name": "Windows", "version": "10"},\n  "device": {"type": "Desktop"},\n  "is_bot": false\n}',
  },
  {
    method: "GET", path: "/api/utils/weather", description: "Get current weather and forecast for any location worldwide.", category: "Utilities",
    params: [{ name: "location", type: "string", required: true, description: "City or location name" }],
    example: "/api/utils/weather?location=London",
    response: '{\n  "location": "London",\n  "temperature_c": 12,\n  "temperature_f": 54,\n  "humidity": 72,\n  "condition": "Partly Cloudy",\n  "wind_speed_kmh": 15\n}',
  },
  {
    method: "GET", path: "/api/utils/crypto", description: "Get real-time cryptocurrency prices, market cap, and 24h changes.", category: "Utilities",
    params: [
      { name: "coin", type: "string", required: true, description: "Coin name or symbol (bitcoin, eth, etc.)" },
      { name: "currency", type: "string", required: false, description: "Currency: usd, eur, gbp (default: usd)" },
    ],
    example: "/api/utils/crypto?coin=bitcoin&currency=usd",
    response: '{\n  "coin": "bitcoin",\n  "price": 95432.50,\n  "currency": "usd",\n  "change_24h": 2.5,\n  "market_cap": 1870000000000\n}',
  },
  {
    method: "GET", path: "/api/utils/currency", description: "Convert between currencies with real-time exchange rates.", category: "Utilities",
    params: [
      { name: "from", type: "string", required: true, description: "Source currency (e.g. USD)" },
      { name: "to", type: "string", required: true, description: "Target currency (e.g. EUR)" },
      { name: "amount", type: "number", required: false, description: "Amount to convert (default: 1)" },
    ],
    example: "/api/utils/currency?from=USD&to=EUR&amount=100",
    response: '{\n  "from": "USD",\n  "to": "EUR",\n  "rate": 0.92,\n  "amount": 100,\n  "converted": 92.00\n}',
  },
  {
    method: "GET", path: "/api/utils/shorten", description: "Shorten long URLs into compact, shareable links.", category: "Utilities",
    params: [{ name: "url", type: "string", required: true, description: "URL to shorten" }],
    example: "/api/utils/shorten?url=https://example.com/very/long/path",
    response: '{\n  "original_url": "https://example.com/very/long/path",\n  "short_url": "https://is.gd/abc123",\n  "service": "is.gd"\n}',
  },
  {
    method: "GET", path: "/api/utils/whois", description: "Look up domain registration details including registrar, dates, and nameservers.", category: "Utilities",
    params: [{ name: "domain", type: "string", required: true, description: "Domain name (e.g. google.com)" }],
    example: "/api/utils/whois?domain=google.com",
    response: '{\n  "domain": "google.com",\n  "registrar": "MarkMonitor Inc.",\n  "created": "1997-09-15",\n  "expires": "2028-09-14",\n  "nameservers": ["ns1.google.com"]\n}',
  },
  {
    method: "GET", path: "/api/utils/phone", description: "Validate phone numbers and detect country, carrier type, and format.", category: "Utilities",
    params: [
      { name: "phone", type: "string", required: true, description: "Phone number (e.g. +14155552671)" },
      { name: "country_code", type: "string", required: false, description: "Country code hint (e.g. US)" },
    ],
    example: "/api/utils/phone?phone=+14155552671",
    response: '{\n  "phone": "+14155552671",\n  "is_valid": true,\n  "country": "United States",\n  "line_type": "mobile",\n  "e164_format": "+14155552671"\n}',
  },
  {
    method: "GET", path: "/api/utils/news", description: "Get latest tech news headlines from Hacker News.", category: "Utilities",
    params: [
      { name: "source", type: "string", required: false, description: "Source: hackernews (default)" },
      { name: "limit", type: "number", required: false, description: "Number of articles (default 10, max 30)" },
    ],
    example: "/api/utils/news?limit=5",
    response: '{\n  "source": "hackernews",\n  "count": 5,\n  "articles": [{"title": "Show HN: New AI Tool", "url": "https://...", "score": 150, "author": "user1"}]\n}',
  },
  {
    method: "GET", path: "/api/utils/gitignore", description: "Generate .gitignore files from template names.", category: "Utilities",
    params: [{ name: "templates", type: "string", required: true, description: "Comma-separated templates (e.g. node,python,vscode)" }],
    example: "/api/utils/gitignore?templates=node,python",
    response: '{\n  "templates": ["node", "python"],\n  "content": "# Node\\nnode_modules/\\n# Python\\n__pycache__/"\n}',
  },
  {
    method: "GET", path: "/api/utils/metadata", description: "Scrape Open Graph, Twitter Cards, and meta tags from any website.", category: "Utilities",
    params: [{ name: "url", type: "string", required: true, description: "Website URL to scrape" }],
    example: "/api/utils/metadata?url=https://github.com",
    response: '{\n  "url": "https://github.com",\n  "title": "GitHub",\n  "description": "Where the world builds software",\n  "image": "https://github.githubassets.com/images/...",\n  "type": "website"\n}',
  },
  {
    method: "GET", path: "/api/utils/uptime", description: "Check if a website is online and measure response time.", category: "Utilities",
    params: [{ name: "url", type: "string", required: true, description: "URL to check" }],
    example: "/api/utils/uptime?url=https://google.com",
    response: '{\n  "url": "https://google.com",\n  "is_up": true,\n  "status_code": 200,\n  "response_time_ms": 45,\n  "ssl": true\n}',
  },
  {
    method: "GET", path: "/api/stats", description: "Get server statistics and health", category: "System",
    params: [],
    example: "/api/stats",
    response: `{"status":200,"success":true,"creator":"beratech","result":{"uptime":"5d 12h 30m","memory":{"used":"0.45 GB","total":"1.00 GB"},"total_requests":1250,"api_status":"online","endpoints":{...}}}`,
  },
];

const CATEGORY_ICONS: Record<string, typeof Download> = {
  Search: Search,
  Download: Download,
  Tools: Wrench,
  Developer: Code,
  EPhoto360: Sparkles,
  AI: Bot,
  Location: MapPin,
  Utilities: Settings,
};

const CATEGORY_COLORS: Record<string, string> = {
  Search: "text-emerald-500",
  Download: "text-blue-500",
  Tools: "text-amber-500",
  Developer: "text-cyan-500",
  EPhoto360: "text-purple-500",
  AI: "text-rose-500",
  Location: "text-green-500",
  Utilities: "text-orange-500",
  System: "text-muted-foreground",
};

function EndpointDocCard({ ep, baseUrl }: { ep: Endpoint; baseUrl: string }) {
  const [expanded, setExpanded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [params, setParams] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fullExampleUrl = baseUrl + ep.example;

  const copyExample = () => {
    navigator.clipboard.writeText(fullExampleUrl);
    toast({ title: "Copied to clipboard", description: "Full API URL copied" });
  };

  const runTest = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const qs = new URLSearchParams();
      for (const p of ep.params) {
        const val = params[p.name];
        if (val) qs.set(p.name, val);
      }
      const url = ep.params.length > 0 ? `${ep.path}?${qs.toString()}` : ep.path;
      const res = await fetch(url);
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResult(JSON.stringify({ error: err?.message || "Request failed" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-visible" data-testid={`doc-card-${ep.path.replace(/\//g, "-").slice(1)}`}>
      <button
        className="w-full text-left p-3 flex items-center gap-3 justify-between"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-endpoint-${ep.path.replace(/\//g, "-").slice(1)}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <Badge variant="outline" className="shrink-0 font-mono text-xs">{ep.method}</Badge>
          <span className="text-sm font-medium text-foreground">{ep.description}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <div className="px-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-muted/50 dark:bg-muted/30 rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground overflow-x-auto whitespace-nowrap" data-testid={`text-doc-url-${ep.path.replace(/\//g, "-").slice(1)}`}>
            {fullExampleUrl}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); copyExample(); }}
            data-testid={`button-copy-doc-${ep.path.replace(/\//g, "-").slice(1)}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t pt-3">
          {ep.params.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Parameters</p>
              <div className="space-y-1">
                {ep.params.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-sm flex-wrap">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{p.name}</code>
                    <span className="text-xs text-muted-foreground">({p.type})</span>
                    {p.required && <Badge variant="secondary" className="text-xs">required</Badge>}
                    <span className="text-xs text-muted-foreground">— {p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-1">
            <Button
              variant={testing ? "default" : "outline"}
              size="sm"
              onClick={() => { setTesting(!testing); if (testing) { setTestResult(null); setParams({}); } }}
              data-testid={`button-test-doc-${ep.path.replace(/\//g, "-").slice(1)}`}
            >
              {testing ? <><X className="w-3 h-3" /> Close</> : <><Play className="w-3 h-3" /> Try it</>}
            </Button>
          </div>

          {testing && (
            <div className="space-y-2 border rounded-md p-3">
              {ep.params.length > 0 ? (
                ep.params.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 shrink-0 w-16">
                      <code className="text-xs font-mono text-muted-foreground">{p.name}</code>
                      {p.required && <span className="text-destructive text-xs">*</span>}
                    </div>
                    <Input
                      className="text-sm"
                      placeholder={p.description}
                      value={params[p.name] || ""}
                      onChange={(e) => setParams({ ...params, [p.name]: e.target.value })}
                    />
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No parameters needed</p>
              )}
              <Button size="sm" onClick={runTest} disabled={loading}>
                {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Testing...</> : <><Play className="w-3 h-3" /> Send</>}
              </Button>
              {testResult && (
                <pre className="text-xs bg-muted/60 p-3 rounded-md font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">{testResult}</pre>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Response</p>
            <pre className="text-xs bg-muted px-3 py-2 rounded-md font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">{ep.response}</pre>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function DocsPage() {
  const categories = Array.from(new Set(endpoints.map((e) => e.category)));
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bera-api.replit.app";

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-docs-title">API Documentation</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete reference for all {endpoints.length} endpoints</p>
      </div>

      <Card className="p-4 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default">v3.0</Badge>
          <span className="text-sm text-foreground">Base URL:</span>
          <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
            {baseUrl}
          </code>
        </div>
      </Card>

      {categories.map((cat, catIdx) => {
        const Icon = CATEGORY_ICONS[cat] || Wrench;
        const color = CATEGORY_COLORS[cat] || "text-foreground";
        const catEndpoints = endpoints.filter((e) => e.category === cat);

        return (
          <div key={cat} className="space-y-2 animate-fade-in-up" style={{ animationDelay: `${0.15 + catIdx * 0.1}s` }}>
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{cat}</h2>
              <Badge variant="secondary" className="text-xs">{catEndpoints.length}</Badge>
            </div>
            <div className="space-y-2">
              {catEndpoints.map((ep) => (
                <EndpointDocCard key={ep.path} ep={ep} baseUrl={baseUrl} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
